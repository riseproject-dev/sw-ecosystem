---
title: libevent
parent: Project Reports
categories:
  - libraries
---

# libevent

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libevent<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libevent is a portable C event notification library that provides a uniform API over OS-level I/O multiplexing primitives: epoll (Linux), kqueue (BSD/macOS), devpoll (Solaris), select, poll, and IOCP (Windows). It also provides buffered I/O (evbuffer), an async DNS resolver, an HTTP server, and RPC infrastructure. The library is written entirely in portable C99 with no architecture-specific code of any kind.

**Governance.** libevent is an independent project with no foundation affiliation. There is no MAINTAINERS, CODEOWNERS, or PLATFORMS file. The project is hosted under the [libevent GitHub organization](https://github.com/libevent/libevent) and governed informally by commit access. Three contributors hold the majority of commit history:

- Nick Mathewson (`nmathewson`), 2,205 commits, affiliated with The Tor Project
- Azat Khuzhin (`azat`), 1,173 commits, affiliated with ClickHouse
- Niels Provos (`provos`), 633 commits, original author, now independent

Additional org members: Nathan French (`NathanFrench`), Dmitry Ilyin (`widgetii`, OpenIPC), and `ygj6`.

**License.** 3-clause BSD.

**Corporate sponsors.** No current corporate sponsorship program. AppNexus sponsored development in 2012 (noted on the project website). The active maintainers are employed by Tor Project and ClickHouse in personal capacity; those employers are not formal sponsors. No CLA, no foundation membership, no Sponsor button on the repository.

**RISE involvement.** None. The complete RISE blog archive (27 posts, May 2024 through June 2026) contains no mention of libevent. libevent does not appear in the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/), in any of the 30 repositories under the riseproject-dev GitHub org, or in any RISE-funded work description.

**Community stance on new ports.** The project accepts contributions via GitHub PRs with no CLA. No platform-support tier policy exists. Platform additions would enter through the standard PR process. Responsiveness is driven by two active maintainers (nmathewson and azat).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| N/A | No RISC-V-specific commits, issues, or PRs have ever been filed in libevent/libevent | GitHub Issues API: 0 results for "riscv", "riscv64", "risc-v"; GitHub Commits API: 0 results for "riscv" |
| ~2024 (inferred) | Debian sid begins building libevent for riscv64; no upstream change required | [Debian buildd status](https://buildd.debian.org/status/package.php?p=libevent&suite=sid) |
| 2026-01-17 | Debian sid riscv64 build of 2.1.12-stable-10+b2 completed on rv-osuosl-01 | [Debian buildd status](https://buildd.debian.org/status/package.php?p=libevent&suite=sid) |

**Key contributors for riscv64.** None. There are no upstream contributors associated with RISC-V work on libevent. The riscv64 story is entirely downstream (distribution packagers).

**Upstream status.** The library is fully portable C and required no porting effort for riscv64. There is no RISC-V-specific code anywhere in the source tree, and none is needed. riscv64 support is a consequence of the library's design, not a deliberate porting project.

---

## 3. Upstream Support Tier

**Formal tier policy.** None exists. The project has no documented platform tiers, no PLATFORMS file, and no stated list of supported architectures.

**Evidence from CI.** All four CI workflow files (`.github/workflows/build.yml`, `.github/workflows/master.yml`, `.github/workflows/cifuzz.yml`, `.github/workflows/scorecard.yml`) were read directly. None contains any reference to "riscv", "riscv64", "RISCV", "linux/riscv64", or "qemu". All Linux jobs run on `ubuntu-22.04` (x86_64 only). Android cross-compile targets cover armeabi-v7a, arm64-v8a, i686-linux-android, x86_64-linux-android -- no riscv64. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository.

**Official binaries.** libevent ships source tarballs only. GitHub releases contain only `libevent-*.tar.gz` and PGP signatures (`.asc`). No architecture-specific binaries are released upstream. This is standard practice for a C library.

**Tier comparison.**

| Platform | CI coverage | Official binary | Release-blocking |
|----------|-------------|-----------------|-----------------|
| amd64 | Yes (ubuntu-22.04) | Source only | N/A |
| arm64 | No (Android arm64-v8a cross-compile only; no native Linux arm64) | Source only | N/A |
| riscv64 | No | Source only | N/A |

riscv64 is not uniquely disadvantaged relative to arm64: neither architecture has upstream CI coverage for native Linux. The project's CI effectively validates only x86_64 Linux natively.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libevent has zero architecture-specific code. The repository contains no `arch/`, `asm/`, or CPU-vendor subdirectory. There are no `.S` assembly files, no SIMD dispatch tables, no JIT backends, no `#ifdef __riscv` guards, and no `#ifdef __aarch64__` or `#ifdef __x86_64__` guards anywhere in the codebase.

The build system (CMakeLists.txt and configure.ac) performs only OS-level checks (Linux/macOS/Windows/FreeBSD/OpenBSD, endianness via `AC_C_BIGENDIAN`) with no CPU architecture detection.

The I/O backend selection is entirely OS-level: epoll on Linux, kqueue on BSD/macOS, devpoll on Solaris, IOCP on Windows, with select/poll as universal fallbacks. None of these are CPU-architecture-gated.

**Component-level comparison.**

| Component | amd64 | arm64 | riscv64 | ISA extensions used |
|-----------|-------|-------|---------|---------------------|
| I/O backends (epoll, kqueue, select, poll) | scalar C | scalar C | scalar C | None |
| evbuffer (buffered I/O) | scalar C | scalar C | scalar C | None |
| Cryptographic RNG (arc4random) | OS entropy sources | OS entropy sources | OS entropy sources | None |
| DNS resolver | scalar C | scalar C | scalar C | None |
| HTTP layer | scalar C | scalar C | scalar C | None |
| Thread locking (pthreads) | OS primitives | OS primitives | OS primitives | None |

All three architectures are at full parity. This is not a gap -- it reflects the library's design. The hot path is `epoll_wait()` / `kevent()` system calls, which are architecture-agnostic at the C level. There is no performance headroom from SIMD or ISA extensions in this library.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems available.** libevent supports CMake (primary, minimum version 3.15) and Autotools (deprecated since 2.2-alpha, still present).

**CMake cross-compilation for riscv64.** No riscv64 toolchain file exists in the upstream repo. A standard CMake toolchain file must be supplied by the user. Derived from the Android cross-compile job in `.github/workflows/build.yml`:

```
cmake -B build \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/riscv64-toolchain.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DEVENT__DISABLE_TESTS=ON \
  -DEVENT__DISABLE_SAMPLES=ON \
  -DEVENT__DISABLE_BENCHMARK=ON \
  -DEVENT__DISABLE_REGRESS=ON
cmake --build build
```

Minimal toolchain file for riscv64 Linux:

```
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

**Autotools cross-compilation for riscv64.**

```
./autogen.sh
./configure \
  --host=riscv64-linux-gnu \
  --disable-libevent-regress \
  --disable-samples
make
```

`configure.ac` supports `AC_CANONICAL_HOST` and the standard `--host=` autoconf flag with no special handling for riscv64.

**Kqueue caveat.** `cmake/CheckWorkingKqueue.cmake` uses `check_c_source_runs()`, which attempts to execute a compiled binary on the host. This applies only to BSD kqueue targets and is irrelevant for riscv64 Linux.

**Toolchain version requirements.** No explicit GCC or Clang minimum is set in `CMakeLists.txt` or `configure.ac`. Upstream CI uses `ubuntu-22.04` runners (GCC 11, Clang 14). CMake minimum is 3.15.

**QEMU usage.** None. The upstream repository contains no QEMU references anywhere. There is no QEMU-based test infrastructure. Tests are expected to run natively or be disabled via the flags above during cross-compilation.

**Known build failures on riscv64.** None documented. Debian sid builds successfully on rv-osuosl-01 with no reported failures. No riscv64 build failures appear in any issue tracker search (0 results for "riscv" in libevent/libevent issues).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps.** None. All libevent features (epoll backend, evbuffer, DNS, HTTP, OpenSSL bufferevent, Mbed TLS bufferevent, pthreads locking) are available on riscv64 without modification or stubs.

**Performance gaps.** No published benchmark data comparing libevent on riscv64 vs arm64 or x86_64 exists. Extensive searches returned zero results. Data not available: throughput/latency measurements for riscv64 vs arm64 or x86_64 under any workload (connections/second, bytes/second, tail latency).

The library has no architecture-specific optimizations for any platform, so there is no SIMD-gap metric to compute. Performance on riscv64 is expected to track the underlying CPU's scalar integer throughput and memory bandwidth relative to comparable arm64/x86_64 hardware.

**Security hardening gaps.** None specific to riscv64 detected. The upstream CI runs scorecard checks (`scorecard.yml`) on x86_64 only. No riscv64-specific stack-clash, CFI, or shadow-stack issues are documented.

**Floating-point semantics.** libevent contains no floating-point arithmetic. No NaN/FP issues apply.

**Feature matrix.**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| epoll backend | Yes | Yes | Yes |
| kqueue backend | N/A | N/A | N/A |
| OpenSSL bufferevent | Yes | Yes | Yes |
| Mbed TLS bufferevent | Yes | Yes | Yes |
| pthreads locking | Yes | Yes | Yes |
| Async DNS | Yes | Yes | Yes |
| HTTP layer | Yes | Yes | Yes |
| SIMD acceleration | None | None | None |
| Hardware crypto acceleration | None | None | None |

---

## 7. CI/CD Infrastructure

**Upstream CI.** No riscv64 CI of any kind exists. All four workflow files were read in full; none contain "riscv", "riscv64", "RISCV", or "qemu".

**RISE runners.** Not used. As of May 2026, RISE-operated Scaleway EM-RV1 runners have processed 13,000+ jobs across 197 repositories. libevent is not among the listed users.

**Hardware used for riscv64 testing.** Debian sid builds libevent on `rv-osuosl-01` (an Oregon State University Open Source Lab riscv64 buildd machine). This is distribution-level infrastructure, not upstream CI.

**CI comparison.**

| Platform | CI system | Runner type | Test suite run | RISE runners |
|----------|-----------|-------------|---------------|--------------|
| amd64 | GitHub Actions | ubuntu-22.04 (GitHub-hosted) | Full | No |
| arm64 | None (Android arm64-v8a cross-compile only, no test execution) | N/A | None | No |
| riscv64 | None | N/A | None | No |

---

## 8. Distribution and Release Status

**Upstream releases.** Source tarballs and PGP signatures only. Most recent releases: 2.2.1-alpha (development), 2.1.12-stable (current stable). No pre-built binaries.

**Debian sid.** [libevent 2.1.12-stable-10+b2](https://buildd.debian.org/status/package.php?p=libevent&suite=sid) -- status: Installed, built on rv-osuosl-01. The "Maybe-Successful" label on the Debian buildd is standard for porting architectures and does not indicate a failure. All tier-1 architectures (amd64, arm64, i386, ppc64el, s390x) carry the same version.

**Ubuntu 24.04 Noble.** [libevent 2.1.12-stable-9ubuntu2](https://packages.ubuntu.com/noble/libevent-dev) for riscv64 is available in the official Ubuntu ports archive. Full set of sub-packages: `libevent-2.1-7t64`, `libevent-core-2.1-7t64`, `libevent-dev`, `libevent-extra-2.1-7t64`, `libevent-openssl-2.1-7t64`, `libevent-pthreads-2.1-7t64`, `libevent-perl`, `libverto-libevent1t64`.

**Gentoo.** Version 2.1.12-r1 available at `~riscv` (testing/unstable tier). No riscv64-specific patches are present in the ebuild. [NEEDS VERIFICATION -- source: research findings, single source]

**Arch Linux RISC-V.** Not present in the [archriscv-packages patch list](https://github.com/felixonmars/archriscv-packages), indicating the upstream PKGBUILD builds cleanly on riscv64 without modification. [NEEDS VERIFICATION -- archriscv.felixc.at search page returned 404 during research]

**AUR.** `android-riscv64-libevent 2.1.12` is available as a cross-compiled Android target package.

**Alpine Linux edge.** libevent 2.1.12-r9 available in the main repository for riscv64, last built 2026-03-27. No issues noted.

**What a user must do to get a working binary.** On Debian or Ubuntu, `apt install libevent-dev` works on riscv64 natively. For cross-compilation, use the standard `riscv64-linux-gnu-gcc` toolchain with the CMake or autotools commands in Section 5.

---

## 9. Dependencies

**Summary table.**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|------------|------|---------------|--------------|-----------------|-----------------|
| OpenSSL | TLS backend for bufferevent_openssl; only dep with RISC-V assembly | Builds; cross-compile bug with `no-deprecated` | Intermittent failure (test_lhash) on riscv64 CI | Debian sid 3.6.3-1 (riscv64) | [#29357](https://github.com/openssl/openssl/issues/29357) cross-compile + `no-deprecated` (riscv64-specific, fix PR #30763 pending); [#30880](https://github.com/openssl/openssl/issues/30880) flaky test |
| Mbed TLS | Alternative TLS backend for bufferevent_mbedtls; optional | Builds (no riscv64-specific issues found) | No riscv64 CI reported | Debian sid 3.6.6-0.1 (riscv64) | None found |
| zlib | Compression; used in test suite only, not in production library | Builds | No riscv64 issues | Debian sid 1:1.3.dfsg+really1.3.2-3 (riscv64) | None |
| pthreads (glibc) | Thread locking for evthread_use_pthreads; required on Linux | Builds | Fully tested upstream on riscv64 | Ships in all riscv64 Linux distributions | None |
| epoll (kernel) | Highest-priority I/O backend on Linux; no external package | Works | Works | N/A (in-kernel) | None |

**OpenSSL deep-dive.** OpenSSL is the only dependency with RISC-V-specific code (Zkn, Zvk vector crypto, RVV SHA512, RVV Poly1305). Two open issues affect riscv64:

- [Issue #29357](https://github.com/openssl/openssl/issues/29357): cross-compilation with `no-deprecated` fails on riscv64 across all active branches (3.4, 3.5, 3.6, 4.0, master). Workaround: omit `no-deprecated` from the Configure invocation. Fix in PR #30763 pending merge.
- [Issue #30880](https://github.com/openssl/openssl/issues/30880): intermittent `test_lhash` failure on riscv64 CI in OS Zoo. Does not affect production use of libevent's TLS support.

Neither issue blocks libevent's use of OpenSSL on riscv64; they affect the OpenSSL build configuration and test suite, not the runtime TLS functionality that libevent exposes.

**Mbed TLS.** The open issue #9003 in the Mbed TLS tracker is ARM/NEON-specific, not riscv64. No riscv64-specific Mbed TLS issues were found.

---

## 11. Known Bugs and Active Issues

No RISC-V-specific bugs exist in libevent/libevent (0 results for "riscv", "riscv64", "risc-v" in issues and PRs).

The following general open issues have riscv64 relevance as cross-architecture correctness or build concerns:

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#1876](https://github.com/libevent/libevent/issues/1876) | Security issues | Open | High | Filed 2026-06-16; no details in research findings |
| [#1842](https://github.com/libevent/libevent/issues/1842) | UAF via shared lock lifetime mismatch in bufferevent_finalize_cb_ | Open | High | Use-after-free correctness bug; applies to all architectures |
| [#1857](https://github.com/libevent/libevent/issues/1857) | Leak when using libevent and pthread | Open | Medium | Memory leak; applies to all architectures |
| [#1858](https://github.com/libevent/libevent/issues/1858) | Compilation failure with gcc 14.2 + Mbed-TLS + aarch64 | Open | Medium | aarch64-specific build failure with gcc 14.2; may indicate a pattern relevant to riscv64 gcc 14 combinations [NEEDS VERIFICATION] |
| [#1856](https://github.com/libevent/libevent/issues/1856) | Memory Bloat while using THP | Open | Medium | Transparent huge page interaction; applies to all Linux architectures |
| [#1836](https://github.com/libevent/libevent/issues/1836) | Some tests fail on Illumos | Open | Low | Platform-specific (Illumos); no riscv64 relevance |

**Correctness bugs summary.** Two correctness bugs are open: the UAF (#1842) and the pthread leak (#1857). Both affect all architectures equally. Neither has a RISC-V-specific component.

---

## 12. Objections and Upstream Blockers

**Stated objections.** None. The upstream maintainers have made no statements opposing riscv64 support. The zero results in all RISC-V searches indicate no engagement, not opposition.

**Technical blockers.** None. The library requires no architecture-specific code. It compiles cleanly on riscv64 using a standard `riscv64-linux-gnu-gcc` toolchain. Debian and Ubuntu both ship full riscv64 package sets at the same version as amd64.

**Organizational blockers.** None. The project accepts PRs without a CLA, has no foundation approval process, and has no formal objection mechanism.

**Acceptance probability for riscv64 CI addition.** High. Adding a QEMU-based riscv64 job to `.github/workflows/build.yml` follows the pattern of the existing Android cross-compile jobs. The maintainers (nmathewson, azat) have demonstrated willingness to accept platform additions. The work is mechanical: no code changes required, only CI configuration.

---

## 13. Investment Analysis

RISE has no prior investment in libevent. All areas below are uncovered.

### 13.1 Functional Enablement

No functional work is required. libevent builds and runs correctly on riscv64 from unmodified upstream source. Debian sid and Ubuntu 24.04 both ship full riscv64 package sets with no patches.

### 13.2 Performance Optimization

No performance optimization work is applicable. libevent contains no architecture-specific code for any platform. The library's performance is determined entirely by OS kernel throughput (epoll_wait latency, kernel buffer management) and scalar integer performance of the CPU. There are no SIMD, crypto, or JIT paths to optimize.

### 13.3 CI/CD Infrastructure

The only gap of practical engineering value is upstream CI coverage. Without upstream CI, regressions on riscv64 will not be caught before release.

**Work item:** Add a QEMU-based riscv64 cross-compile and test job to `.github/workflows/build.yml`. This requires no code changes, only a new CI job definition following the existing Android cross-compile pattern. Optionally use a RISE-hosted riscv64 runner for native test execution.

Effort: 1-2 person-days to write and validate the CI job. Upstream PR acceptance probability: high (no CLA, permissive governance).

### 13.4 Ecosystem Enablement

Not applicable. libevent is a C library with no dependent package ecosystem requiring separate enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Functional | None -- library builds and runs correctly on riscv64 | 0 | N/A | N/A |
| Performance | None -- no architecture-specific code paths exist in libevent | 0 | N/A | N/A |
| CI/CD | Add riscv64 cross-compile + test job to upstream GitHub Actions | 0.25 | Qualcomm / RISE contributor | Low |
| Ecosystem | N/A | 0 | N/A | N/A |

**Assessment.** libevent requires no investment for riscv64 functional or performance enablement. The single optional work item (upstream CI) is low-effort and low-priority: Debian's rv-osuosl-01 buildd already provides build validation, and the library's architecture-agnostic design makes riscv64-specific regressions unlikely. Investment here yields minimal return relative to other projects with actual porting gaps.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libevent GitHub repository](https://github.com/libevent/libevent)
- [libevent project homepage](https://libevent.org/)
- [libevent GitHub Actions: build.yml](https://github.com/libevent/libevent/blob/master/.github/workflows/build.yml)
- [libevent GitHub Actions: master.yml](https://github.com/libevent/libevent/blob/master/.github/workflows/master.yml)
- [libevent GitHub Actions: cifuzz.yml](https://github.com/libevent/libevent/blob/master/.github/workflows/cifuzz.yml)
- [libevent GitHub Actions: scorecard.yml](https://github.com/libevent/libevent/blob/master/.github/workflows/scorecard.yml)
- [libevent GitHub releases](https://github.com/libevent/libevent/releases)
- [Debian buildd status: libevent sid](https://buildd.debian.org/status/package.php?p=libevent&suite=sid)
- [Ubuntu 24.04 Noble: libevent-dev riscv64](https://packages.ubuntu.com/noble/libevent-dev)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [archriscv-packages patch list](https://github.com/felixonmars/archriscv-packages)
- [OpenSSL issue #29357: riscv64 cross-compile no-deprecated](https://github.com/openssl/openssl/issues/29357)
- [OpenSSL issue #30880: flaky test_lhash on riscv64](https://github.com/openssl/openssl/issues/30880)
- [libevent issue #1842: UAF in bufferevent_finalize_cb_](https://github.com/libevent/libevent/issues/1842)
- [libevent issue #1857: pthread leak](https://github.com/libevent/libevent/issues/1857)
- [libevent issue #1858: gcc 14.2 + Mbed-TLS + aarch64 build failure](https://github.com/libevent/libevent/issues/1858)
- [libevent issue #1856: memory bloat with THP](https://github.com/libevent/libevent/issues/1856)
- [libevent issue #1876: security issues](https://github.com/libevent/libevent/issues/1876)
- [libevent issue #1836: test failures on Illumos](https://github.com/libevent/libevent/issues/1836)