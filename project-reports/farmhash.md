---
title: farmhash
parent: Project Reports
---

# farmhash

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for farmhash<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

FarmHash is a family of non-cryptographic hash functions developed at Google, designed as a successor to CityHash. The library provides 32-bit, 64-bit, and 128-bit hash functions with multiple variants tuned for different hardware capabilities. The canonical source is [google/farmhash](https://github.com/google/farmhash).

**Governance:** No formal governance model. The project lives under the `google` GitHub organization with no MAINTAINERS, OWNERS, or CODEOWNERS file. License is MIT. Community contact is farmhash-discuss@googlegroups.com.

**Corporate maintainers:** Google is the sole organizational owner. The primary historical maintainer is Geoff Pike (geoffpike, Google), who authored the bulk of commits and merged all pull requests through 2019. A June 2026 merge (SHA 9d99331 and 84fead3) was performed by a Google engineer ("eustas") doing housekeeping merges of two stale PRs. No external corporate contributors with sustained involvement exist.

**RISE membership:** FarmHash is not listed on riseproject.dev. The project has no connection to the RISE Project. Google is a RISE Premier Member but has not directed any RISE resources toward FarmHash.

**Community culture on new ports:** The project has accepted community portability patches (Haiku, DragonFly BSD, ppc64le, s390x, MinGW - all merged via PR). However, maintainer cadence is extremely low. The last substantive algorithmic commit predates 2020. The June 2026 activity was only merging two PRs that had been open for years. A RISC-V patch would likely be accepted if submitted, but response times are measured in years and there is no proactive effort.

**Project activity:** 38 total commits, 19 merged PRs, 22 open issues as of the report date. The project is effectively in maintenance mode.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2016 | PR #7/#8 merged: fixed `configure: error: cannot guess build type` on aarch64 by updating config.guess/config.sub | [google/farmhash PR #7](https://github.com/google/farmhash/pull/7) |
| 2017 | Issue #12 filed: Debian package FTBFS on s390x and mips; resolved in later packaging | [google/farmhash issue #12](https://github.com/google/farmhash/issues/12) |
| 2019 | Last substantive algorithmic commit | [google/farmhash commits](https://github.com/google/farmhash/commits/master) |
| 2019-05-13 | Debian snapshot date for current packaged version (`0~git20190513.0d859a8`) | [Debian tracker: farmhash](https://tracker.debian.org/pkg/farmhash) |
| 2026-06-05 | Most recent commit: minor housekeeping merge of two stale PRs | [google/farmhash commits](https://github.com/google/farmhash/commits/master) |
| Never | RISC-V port initiated | Confirmed: zero riscv/riscv64 commits, issues, or PRs in repository history |

**Key contributors:** Geoff Pike (Google) for all core algorithmic work. Community contributors for platform portability (aarch64, BSD variants, MinGW).

**Upstreaming status:** There is nothing to upstream. No RISC-V work exists anywhere - not in forks, not in patches, not in issue discussions.

---

## 3. Upstream Support Tier

FarmHash has no formal platform tier policy. There is no PLATFORMS.md, SUPPORT.md, or equivalent document.

**Evidence by support indicator:**

| Indicator | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage | None | None | None |
| Official binary releases | None (no releases published) | None | None |
| SIMD-accelerated code path | Yes (SSE4.2, AES-NI, AVX) | No | No |
| Autoconf triplet recognition | Yes | Yes | Yes (config.sub/config.guess only) |
| Known build failures | None | None | None |
| Distro packaging | Yes | Yes | Yes (Debian/Ubuntu) |
| Release-blocking test suite | No CI; no release process | No CI | No CI |

The practical support tier for riscv64 is: **compiles and runs via portable scalar fallback; no upstream testing; no upstream acknowledgment of the architecture.** This is identical to arm64's upstream status - distro-maintained, not upstream-maintained.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

FarmHash's high-performance paths are exclusively x86 SIMD. The architecture-specific code is concentrated in `dev/platform.cc` and the variant implementation files.

**Architecture dispatch mechanism:** `platform.cc` defines runtime detection macros: `x86_64`, `x86`, `can_use_ssse3`, `can_use_sse41`, `can_use_sse42`, `can_use_aesni`, `can_use_avx`. On riscv64, all of these evaluate to 0 at compile time. No `__riscv`, `__aarch64__`, NEON, or RVV macros appear anywhere in the codebase.

**Component-level status:**

| Component | Purpose | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| farmhashna | 64-bit portable | scalar C++ | scalar C++ | scalar C++ |
| farmhashxo | 64-bit portable | scalar C++ | scalar C++ | scalar C++ |
| farmhashuo | 64-bit portable | scalar C++ | scalar C++ | scalar C++ |
| farmhashmk | 32-bit portable | scalar C++ | scalar C++ | scalar C++ |
| farmhashcc | 32-bit CityHash-compatible | scalar C++ | scalar C++ | scalar C++ |
| farmhashsa | 32-bit SSE4.2 | SIMD (full) | missing | missing |
| farmhashsu | 32-bit SSE4.2 + AES-NI | SIMD (full) | missing | missing |
| farmhashte | 64-bit SSE4.1 | SIMD (full) | missing | missing |
| farmhashns | 64-bit SSE4.2 | SIMD (partial) | missing | missing |
| farmhashnt | 32-bit SSE4.2 | SIMD (partial) | missing | missing |

**Critical detail on "missing" components:** The SSE4.2-gated files (`farmhashsa.cc`, `farmhashsu.cc`, `farmhashte.cc`) use a guard pattern where `#if !can_use_sse42` (or `!can_use_sse41`) branches to `FARMHASH_DIE_IF_MISCONFIGURED` and returns a stub value. This is a compile-time death sentinel, not a graceful fallback. These files together contain 113 `_mm_*` intrinsic calls and `__m128i` references. The amalgamated `src/farmhash.cc` contains 166 x86 SIMD references and zero RISC-V, RVV, NEON, or aarch64 references.

**No RVV, Zbb, Zbc, or Zba usage:** There is no RISC-V Vector extension path, no Zbc (carry-less multiply, which would be relevant for CRC-style hash mixing), and no Zbb bitmanipulation usage. The performance gap versus x86 SSE4.2 is structural.

**Endianness:** riscv64 is little-endian. FarmHash's endianness detection uses `__BYTE_ORDER__`/`__ORDER_LITTLE_ENDIAN__` macros and falls back to `#include <endian.h>` on Linux. The source comment states "FarmHash was developed with little-endian architectures in mind." No manual override is needed for riscv64.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autoconf/Automake exclusively. No CMake. The repository contains a pre-generated `configure` script. Build files: `configure`, `configure.ac`, `Makefile.am`, `src/Makefile.am`, `m4/` macros. No Dockerfiles, no `.devcontainer`, no container build infrastructure of any kind.

**Native build on riscv64:**
```sh
./configure CXXFLAGS="-g -O2"
make all check
```
The x86-specific flags (`-mavx`, `-maes`, `-msse4.2`) must be omitted entirely - they are x86-only and cause compilation errors on riscv64.

**Cross-compilation from x86_64 host:**
```sh
./configure \
  --host=riscv64-linux-gnu \
  CXX=riscv64-linux-gnu-g++ \
  CXXFLAGS="-g -O2"
make all
```
The `configure` script supports `--host=` for cross-compilation via standard autoconf `cross_compiling=yes` path. No toolchain files needed; no CMake toolchain.

**Running the test binary under QEMU:**
```sh
qemu-riscv64 -L /usr/riscv64-linux-gnu src/farmhash_unittest
```

**Required toolchain versions:** `configure.ac` states `AC_PREREQ([2.65])` and `LT_PREREQ([2.2])`. The `farmhash.cc` source uses `__builtin_bswap32`/`__builtin_bswap64` under a guard of `(defined(__GNUC__) && ((__GNUC__ == 4 && __GNUC_MINOR__ >= 8) || __GNUC__ >= 5))`, requiring GCC >= 4.8 or any Clang. Any GCC in a modern `riscv64-linux-gnu-g++` toolchain (GCC 10+) is sufficient.

**ISA feature flags for riscv64:** None of the x86 `FARMHASH_ASSUME_*` defines should be set. Specifically:

| Define | riscv64 guidance |
|---|---|
| `-DFARMHASH_ASSUME_SSSE3=1` | Do not set (x86 only) |
| `-DFARMHASH_ASSUME_SSE41=1` | Do not set |
| `-DFARMHASH_ASSUME_SSE42=1` | Do not set |
| `-DFARMHASH_ASSUME_AESNI=1` | Do not set |
| `-DFARMHASH_ASSUME_AVX=1` | Do not set |
| `-DFARMHASH_BIG_ENDIAN=1` | Do not set (riscv64 is little-endian) |

**Known build failures:** None reported on riscv64. The Debian buildd (`rv-osuosl-04`) successfully built `0~git20190513.0d859a8-4+b2` with no failures recorded.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. All hash functions that compile on riscv64 produce correct output. The portable C++ fallback paths (farmhashna, farmhashxo, farmhashmk, farmhashcc, farmhashuo) are fully functional on riscv64. The SSE4.2-gated variants are absent on both riscv64 and arm64 - this is not a riscv64-specific regression.

**Correctness caveat:** Issue #37 (open, filed 2020-02-22) documents that FarmHash's non-fingerprint `Hash*` functions are not cross-platform stable - results differ between platforms by design. Only `Fingerprint*` functions are guaranteed portable across architectures. This affects any user relying on hash consistency between x86 and riscv64 deployments and is not riscv64-specific. [NEEDS VERIFICATION: whether this affects all non-fingerprint variants equally or only specific ones.]

**Performance gaps:**

| Metric | amd64 (x86 SSE4.2) | arm64 | riscv64 |
|---|---|---|---|
| FarmHash32 bulk speed | 22,136 MiB/sec | Data not available | Data not available: no riscv64 benchmarks found in any public suite |
| FarmHash64 bulk speed | 12,929 MiB/sec | Data not available | Data not available |
| FarmHash128 bulk speed | 14,454 MiB/sec | Data not available | Data not available |
| SIMD acceleration | SSE4.2, AES-NI, AVX | None | None |
| RVV acceleration | N/A | N/A | None (not implemented) |

Note: The SMHasher maintainer explicitly flags FarmHash as "not portable, too machine specific: 64 vs 32bit, old gcc" and marks the x86 figures as "machine-specific (x64 SSE4/AVX)". The smhasher benchmark suite itself fails to build on riscv64 due to x86 inline assembly (open issue [rurban/smhasher#317](https://github.com/rurban/smhasher/issues/317), opened 2025-04-13), so no riscv64 baseline measurement is possible from that tool without upstream fixes.

**Security hardening gaps:** Data not available: no analysis of security hardening flags (stack canaries, CFI, shadow stack) across architectures was found in the research.

**Missing SIMD opportunities on riscv64:** The RVV (RISC-V Vector) extension and the Zbc (carry-less multiply) extension in the B-extension suite could accelerate hash mixing. Zbc in particular maps directly to CRC-style operations that the SSE4.2 `_mm_crc32_u64` intrinsic uses in `farmhashsu`. Neither has been exploited. There is no tracking issue acknowledging this gap.

---

## 7. CI/CD Infrastructure

The google/farmhash repository has no CI configuration of any kind. The root directory contains only autoconf/automake build files and source code. There is no `.github` directory (confirmed via GitHub API returning HTTP 404), no GitHub Actions workflows, and no configuration for Travis CI, CircleCI, Cirrus CI, AppVeyor, Jenkins, or any other CI provider.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI provider | None | None | None |
| Automated build | No | No | No |
| Automated test | No | No | No |
| RISE/Scaleway runner | No | No | No |
| Hardware board | No | No | No |

The `config.sub` and `config.guess` files in the repository contain `riscv32 | riscv64` strings - these are GNU build system triplet recognizers and are entirely unrelated to CI.

The only validated riscv64 builds come from the Debian and Ubuntu package build infrastructure, which is external to the upstream project.

---

## 8. Distribution and Release Status

**Upstream releases:** None. The repository has never published a tagged release with binary assets. The GitHub releases page is empty.

**Debian:** Package `farmhash` (version `0~git20190513.0d859a8-4+b2`) is present in Debian sid with riscv64 status "Installed", built on `rv-osuosl-04`. All 18 tracked architectures show "Installed". Source: [Debian tracker: farmhash](https://tracker.debian.org/pkg/farmhash).

**Ubuntu 24.04 (Noble):** Both `libfarmhash0` and `libfarmhash-dev` are available in the universe repository for: amd64, arm64, armhf, ppc64el, riscv64, s390x. Source: [Ubuntu Packages: farmhash](https://packages.ubuntu.com/search?keywords=farmhash&suite=noble).

**PyPI:** The package named "farmhash" does not exist on PyPI (HTTP 404). The related package "pyfarmhash" publishes only win_amd64 and manylinux_x86_64 wheels - no riscv64 wheels.

**RISE wheel builder:** Not listed. The RISE wheel builder at riseproject.gitlab.io does not include farmhash.

**Arch Linux:** Not in official Arch Linux or Arch Linux RISC-V repositories (archriscv.felixc.at returns no results).

**Summary for a user who needs a working riscv64 binary:** Install `libfarmhash-dev` from Debian sid or Ubuntu 24.04 universe. No other binary channel exists. The installed library uses the portable scalar C++ fallback - there is no SIMD acceleration.

---

## 9. Dependencies

FarmHash has no external library dependencies. The `configure.ac` contains no `PKG_CHECK_MODULES` or `AC_CHECK_LIB` calls beyond the C++ standard library.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| C++ standard library (stdint.h, stdlib.h, string.h, utility) | Core types, memcpy, std::swap | OK - fully portable | OK | N/A (header-only use) | None |
| byteswap / endian headers (byteswap.h, endian.h, platform variants) | Byte-swap primitives | OK - GCC `__builtin_bswap64` covers riscv64 before any platform header | OK | N/A | None |
| x86 SIMD intrinsics (immintrin.h, nmmintrin.h, wmmintrin.h) | SSE4.1/SSE4.2/AES-NI/AVX fast paths | Not applicable - guard macros never defined on riscv64 | Not applicable | N/A | None (falls back to portable C++ automatically) |
| GCC/Clang compiler | `__builtin_expect`, `__builtin_bswap32/64`, `__builtin_unreachable` | OK - all builtins supported on riscv64 in GCC 12+, Clang 16+ | OK | N/A | None |
| autoconf / automake / libtool (build-time only) | Configure and Makefile generation | OK | N/A | N/A | None |

No JIT, crypto library, numerics library, or other dependency with architecture-specific behavior is present. Dependency analysis terminates at one level.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#37](https://github.com/google/farmhash/issues/37) | FreeBSD produces wrong hashes | Open (2020-02-22) | Medium - correctness trap | Non-fingerprint Hash* functions are not cross-platform stable by design; Fingerprint* functions are portable. Affects all non-x86 platforms including riscv64 for users expecting hash consistency. |
| [#35](https://github.com/google/farmhash/issues/35) | Crash in farmhash used by ml vision | Open (2019-07-07) | Low - no architecture attribution | No riscv64 attribution; origin unclear. |
| [#21](https://github.com/google/farmhash/issues/21) | s390x build failure | Status unknown | Low | Historical big-endian build failure; not relevant to riscv64 (little-endian). |

**RISC-V specific issues:** Zero. All 22 issues (all states) and all 19 PRs were reviewed. No riscv or riscv64 mention exists in the issue tracker.

**Correctness issues for riscv64:** Issue #37 is the only open correctness concern. Users must use `Fingerprint*` functions, not `Hash*` functions, to obtain consistent results across x86 and riscv64 deployments.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None on record. No issue or PR has raised RISC-V and been rejected.

**Technical blockers:** None for functional correctness. The portable C++ fallback compiles and runs correctly on riscv64 without modification. The only technical gap is the absence of RVV or Zbc acceleration, which is a performance matter, not a correctness blocker.

**Organizational blockers:** The project is effectively dormant. With 38 total commits and the last algorithmic work dating to 2019, the maintainer bandwidth for reviewing and merging new architecture work is minimal. A submitted RISC-V patch would wait months to years for review based on historical PR merge latency (PRs #25 and #39 were merged in 2026 after being open for approximately 5-7 years). [NEEDS VERIFICATION: exact open dates for PRs #25 and #39.]

**Acceptance probability:** High for a well-formed patch that follows the existing x86 guard pattern and does not touch portable paths. The project has accepted community architecture ports (aarch64, s390x, Haiku, BSD variants). The barrier is maintainer response time, not technical opposition.

---

## 13. Investment Analysis

RISE has done no work on farmhash. The RISE wheel builder does not include it. No RISE blog post, funded effort, or tracked issue references farmhash. All investment sizing below represents net new work.

### 13.1 Functional Enablement

No work required. FarmHash builds and runs correctly on riscv64 via the portable scalar C++ fallback today. Debian and Ubuntu ship working riscv64 packages. There is no functional gap to close.

### 13.2 Performance Optimization

The performance gap is real but the project context limits the return on investment. The high-performance SSE4.2 paths that exist for x86 have no RISC-V equivalents. Potential optimizations:

1. **RVV-accelerated hash mixing:** The SSE4.2 variants use 128-bit SIMD for parallel multiply-add operations. RVV equivalents are possible. Effort: 3-5 person-weeks for implementation, 2-3 person-weeks for validation against SMHasher quality tests.

2. **Zbc (carry-less multiply) for CRC-style mixing:** The `farmhashsu` variant uses `_mm_crc32_u64` (SSE4.2 CRC32). The Zbc extension provides `clmul`/`clmulh` instructions that could serve as an analog. Effort: 1-2 person-weeks.

**Caveat:** Given the project's dormant state and the 5+ year PR merge latency, any optimization work faces an upstream absorption problem. Work may sit unmerged indefinitely unless a downstream fork or distro patch is acceptable as the deployment mechanism.

### 13.3 CI/CD Infrastructure

The project has no CI for any architecture. Adding riscv64 CI to a project that has no CI at all requires first establishing CI infrastructure, which is unlikely to be accepted upstream given the maintainer's demonstrated non-engagement with CI tooling. Effort: 1-2 person-weeks to write GitHub Actions YAML; absorption probability low.

### 13.4 Ecosystem Enablement

FarmHash is a C++ library with no Python package (PyPI 404), no npm package, no Maven JAR, and no independent package ecosystem requiring enablement. It is consumed as a system library or as a vendored header. No ecosystem work is applicable.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required - scalar fallback is fully functional | 0 | N/A | N/A |
| Performance | RVV-accelerated hash variants (farmhashsa/su/te equivalents) | 5-8 | Qualcomm / RISE contributor | Low |
| Performance | Zbc carry-less multiply for CRC-style mixing in farmhashsu equivalent | 1-2 | Qualcomm / RISE contributor | Low |
| CI/CD | Add riscv64 GitHub Actions job | 1-2 | RISE / contributor | Low |
| Ecosystem | N/A (no dependent package ecosystem) | 0 | N/A | N/A |

**Overall investment recommendation:** Defer. FarmHash works on riscv64 today with no blocking issues. The project is dormant and upstream absorption of optimization work is uncertain given multi-year PR merge latency. Downstream consumers (TensorFlow Lite / LiteRT notes farmhash as an internal dependency) obtain riscv64 support via the portable path with no issues. Invest in FarmHash only if a specific performance-sensitive workload on riscv64 hardware demonstrates a measurable hash throughput bottleneck.

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [google/farmhash repository](https://github.com/google/farmhash)
- [google/farmhash issue tracker (all issues)](https://github.com/google/farmhash/issues?state=all)
- [google/farmhash pull requests (all PRs)](https://github.com/google/farmhash/pulls?state=all)
- [google/farmhash issue #37: FreeBSD produces wrong hashes](https://github.com/google/farmhash/issues/37)
- [google/farmhash issue #35: Crash in farmhash used by ml vision](https://github.com/google/farmhash/issues/35)
- [google/farmhash issue #21: s390x build failure](https://github.com/google/farmhash/issues/21)
- [google/farmhash issue #12: FTBFS on mips and s390x](https://github.com/google/farmhash/issues/12)
- [google/farmhash PR #7: aarch64 configure fix](https://github.com/google/farmhash/pull/7)
- [Debian package tracker: farmhash](https://tracker.debian.org/pkg/farmhash)
- [Debian buildd status: farmhash sid](https://buildd.debian.org/status/package.php?p=farmhash&suite=sid)
- [Ubuntu Packages: farmhash noble](https://packages.ubuntu.com/search?keywords=farmhash&suite=noble)
- [PyPI: farmhash (404 - does not exist)](https://pypi.org/pypi/farmhash/json)
- [RISE Project wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project: riseproject.dev](https://riseproject.dev)
- [rurban/smhasher: FarmHash benchmark results](https://github.com/rurban/smhasher)
- [rurban/smhasher issue #317: riscv64 build failure](https://github.com/rurban/smhasher/issues/317)
- [Arch Linux RISC-V package search: farmhash](https://archriscv.felixc.at/?q=farmhash)