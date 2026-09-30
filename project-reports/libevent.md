---
title: libevent
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: Mbed TLS
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: test-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: automake
    relation: build-dependency
    criticality: optional
  - name: Python
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libevent" %}

# libevent

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for libevent<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libevent is a portable C event notification library that provides a uniform API over OS-level I/O multiplexing primitives: epoll (Linux), kqueue (BSD/macOS), devpoll (Solaris), select, poll, and IOCP (Windows). It also provides buffered I/O (evbuffer), an async DNS resolver, an HTTP server, and RPC infrastructure. The library is written entirely in portable C with no architecture-specific code of any kind.

**Governance.** libevent is an independent project with no foundation affiliation. There is no MAINTAINERS, CODEOWNERS, or PLATFORMS file, and no `docs/platforms/` directory. The project is governed informally by commit access under the [libevent GitHub organization](https://github.com/libevent/libevent). By commit-history volume, three contributors account for the large majority of the 5,227 total commits: Nick Mathewson (`nmathewson`, 2,168 commits, `nickm@torproject.org`), Azat Khuzhin (`azat`, 1,173 commits, `azat@libevent.org`), and Niels Provos (`provos`, 633 commits, `provos@gmail.com`, original author). `SECURITY.md` states the project "is maintained by a team of volunteers on a reasonable-effort basis," confirming informal, volunteer-driven governance rather than an organization-backed model.

**License.** 3-clause BSD.

**Corporate sponsors.** No current corporate sponsorship program exists. libevent.org credits AppNexus as a one-time sponsor of development in 2012, with no ongoing sponsorship advertised. Mathewson's and several other contributors' commit emails (`nickm@torproject.org`, `sebastian@torproject.org`, `chrisd@torproject.org`) tie back to The Tor Project, reflecting libevent's historical and organizational proximity to Tor (Mathewson is a Tor Project co-founder) rather than formal corporate backing. Other identifiable corporate-affiliated contributors in the history are individual, not institutional: Mark Ellzey (`mark.thomas@mandiant.com`, Mandiant/Google) and Diogo Teles Sant'Anna (`@google.com`). A claimed ClickHouse affiliation for Azat Khuzhin could not be independently confirmed this round: his commit address is `azat@libevent.org`, and no ClickHouse-domain evidence was found in the commit history search performed. [NEEDS VERIFICATION]

**RISE involvement.** None. The complete RISE blog archive (35 posts, 2024-05-15 through 2026-09-28, enumerated via sitemap) contains no mention of libevent. libevent does not appear in the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) (80 listed riscv64 wheel packages, libevent absent), in any of the 26 repositories under the riseproject-dev GitHub org, or in the RISE Technical Steering Committee's [System Libraries working group tracked-library list](https://github.com/riseproject-dev/system-libraries-wg) (18 open issues covering xsimd, SLEEF, Eigen, dav1d, XNNPack, PyTorch vec-lib, libjpeg-turbo, x265, OpenBLAS, libopus, FFmpeg, libflac, and others; libevent is not among them). The only on-topic hit in a code search of the riseproject-dev org is the project-analysis report this document supersedes. libevent is not RISE-member-eligible itself (RISE membership, per [riseproject.dev/members](https://riseproject.dev/members/), is corporate: Premier members Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General members Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE).

**Community stance on new ports.** The project accepts contributions via GitHub PRs with no CLA. No platform-support tier policy exists, and no public discussion, issue, or PR expresses any stance, for or against, on RISC-V or other architecture ports; the topic has simply never come up, consistent with the project's OS/event-backend-oriented (not CPU-architecture-oriented) portability model.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| N/A | No RISC-V-specific commits, issues, or PRs have ever been filed in libevent/libevent | GitHub Issues/PR search: 0 results for "riscv", "riscv64", "risc-v"; GitHub commit search: 0 results for "riscv"; full-tree grep of a local clone: 0 matches |
| 2019-06-08 | Only commit in the entire history that mentions RISC-V in any form: [`0374b559`](https://github.com/libevent/libevent/commit/0374b55942e533a3c3997439481a8d05d6c8f729), "m4/libevent_openssl.m4: fix detection of openssl", by Fabrice Fontaine. Not a RISC-V port commit: it is a generic autoconf/m4 fix (a missing whitespace in `CPPFLAGS`) whose commit message incidentally quotes a Buildroot `riscv32-linux-gcc` build log that surfaced the underlying OpenSSL-detection bug | Local clone commit-message search |
| Undated (ongoing) | Debian sid builds libevent for riscv64 on the `rv-osuosl-01` buildd with no riscv-specific patches | [Debian buildd status](https://buildd.debian.org/status/package.php?p=libevent&suite=sid) |

**Key contributors for riscv64.** None. There is no upstream contributor associated with RISC-V-specific work on libevent. The riscv64 story is entirely downstream (distribution packagers: Debian, Ubuntu, Gentoo, Alpine).

**Upstream status.** The library is fully portable C and required no porting effort for riscv64. There is no RISC-V-specific code anywhere in the source tree, and none is needed. riscv64 support is a consequence of the library's design (feature probing via autoconf/CMake plus POSIX/select/epoll/kqueue abstractions), not a deliberate porting project.

## 3. Upstream Support Tier

**Formal tier policy.** None exists. The project has no documented platform tiers, no PLATFORMS file, and no stated list of supported architectures.

**Evidence from CI.** All four CI workflow files in the repository, `build.yml`, `master.yml`, `cifuzz.yml`, and `scorecard.yml`, were read directly (confirmed as the entirety of `.github/workflows`; no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist). None contains any reference to "riscv", "riscv64", "RISCV", "linux/riscv64", or "qemu". Linux jobs run on `ubuntu-22.04` (x86_64 only). The only cross-compile matrix is an Android NDK job covering `arm-linux-androideabi`, `aarch64-linux-android`, `i686-linux-android`, and `x86_64-linux-android`, none of which is riscv64.

**Official binaries.** libevent ships source tarballs only. The [GitHub releases asset listing](https://github.com/libevent/libevent/releases/expanded_assets/release-2.1.12-stable) for release-2.1.12-stable contains exactly `libevent-2.1.12-stable.tar.gz`, its `.asc` signature, and GitHub's auto-generated source archives, no architecture-specific binaries. Release notes explicitly instruct users to use the dist archive rather than GitHub's auto-generated source tarball. No architecture-specific binaries are released upstream, which is standard practice for a C library.

**Tier comparison.**

| Platform | CI coverage | Official binary | Release-blocking |
|----------|-------------|-----------------|-----------------|
| amd64 | Yes (ubuntu-22.04, full test suite) | Source only | N/A |
| arm64 | No (Android arm64-v8a cross-compile only, no native Linux arm64, no test execution) | Source only | N/A |
| riscv64 | No | Source only | N/A |

riscv64 is not uniquely disadvantaged relative to arm64: neither architecture has upstream CI coverage for native Linux testing. Upstream CI effectively validates only x86_64 Linux natively.

## 4. Technical Architecture and RISC-V-Specific Subsystems

libevent has zero architecture-specific code, for any CPU architecture. Direct source-tree inspection (local clone, 329 tracked files) confirms: no `arch/`, `asm/`, or CPU-vendor subdirectory; no `.S` assembly files; no SIMD dispatch tables; no JIT backend; and zero matches for `__riscv`, `__x86_64__`, and `__aarch64__` ISA guards anywhere in the tree (verified both via GitHub code search and a full-tree grep for inline assembly, intrinsics, `__SSE`, `__AVX`, and `neon`, all zero matches).

The files that superficially resemble platform-specific code, `epoll.c`, `kqueue.c`, `devpoll.c`, `evport.c`, `poll.c`, `select.c`, `win32select.c`, `wepoll.c`, `event_iocp.c`, are OS kernel-API backends (Linux epoll, BSD/macOS kqueue, Solaris `/dev/poll` and event ports, POSIX poll/select, Windows IOCP), not CPU-ISA backends. This is libevent's actual axis of variation, and it is orthogonal to CPU architecture. The only other conditional-compilation-heavy files, `arc4random.c` and `sha1.c`, branch on OS/libc feature-detection macros (`_WIN32`, `__linux__`, `EVENT__HAVE_GETRANDOM`, `EVENT__HAVE_ARC4RANDOM_BUF`, etc.), not ISA guards.

**Component-level comparison.**

| Component | amd64 | arm64 | riscv64 | ISA extensions used |
|-----------|-------|-------|---------|---------------------|
| I/O backends (epoll, kqueue, select, poll) | scalar C | scalar C | scalar C | None |
| evbuffer (buffered I/O) | scalar C | scalar C | scalar C | None |
| Pseudo-random generation (arc4random) | OS entropy sources | OS entropy sources | OS entropy sources | None |
| DNS resolver | scalar C | scalar C | scalar C | None |
| HTTP layer | scalar C | scalar C | scalar C | None |
| Thread locking (pthreads) | OS primitives | OS primitives | OS primitives | None |

All three architectures are at full parity: zero hand-tuned or intrinsic code exists for any of them. riscv64 is not "behind" amd64 or arm64; there is nothing to be behind on. The hot path is the `epoll_wait()`/`kevent()` system call, which is architecture-agnostic at the C level, so there is no SIMD-gap or ISA-extension gap to close for this library.

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems available.** CMake (primary, minimum version 3.15) and Autotools (deprecated since 2.2-alpha, still present). The actual build documentation lives at `Documentation/Building.md` (not a root-level `BUILDING.md`); there is no `docs/` directory, no `docs/cross-compilation.md`, and no explicit riscv64 cross-compilation section anywhere upstream (confirmed absent via raw-file fetch and a fresh clone as of 2026-09-30).

**CMake cross-compilation for riscv64.** No riscv64 toolchain file ships upstream; `cmake/` contains only generic helpers (`AddCompilerFlags.cmake`, `FindMbedTLS.cmake`, `CheckWorkingKqueue.cmake`, etc.), with no `CMAKE_TOOLCHAIN_FILE` template for any target (Android's comes from the NDK, Windows' from vcpkg, both external to this repo). A toolchain file must be authored by the user:

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

**Autotools cross-compilation for riscv64.**

```
./autogen.sh
./configure --host=riscv64-linux-gnu --disable-samples --disable-libevent-regress
make
```

`configure.ac` supports `AC_CANONICAL_HOST` and the standard `--host=` autoconf flag with no special handling for riscv64.

**Available feature-toggle flags** (none riscv64-specific; generic on any architecture): `EVENT__DISABLE_OPENSSL`, `EVENT__DISABLE_MBEDTLS`, `EVENT__DISABLE_THREAD_SUPPORT`, `EVENT__DISABLE_DEBUG_MODE`, `EVENT__DISABLE_MM_REPLACEMENT`, `EVENT__DISABLE_BENCHMARK`, `EVENT__DISABLE_TESTS`, `EVENT__DISABLE_REGRESS`, `EVENT__DISABLE_SAMPLES`, `EVENT__DISABLE_CLOCK_GETTIME`, `EVENT__FORCE_KQUEUE_CHECK` (BSD-only), `EVENT__COVERAGE`, `EVENT__DOXYGEN`.

**Toolchain version requirements.** No explicit GCC or Clang minimum is set in `CMakeLists.txt` or `configure.ac` (the only version gate found is `CMAKE_VERSION VERSION_LESS 3.20`, unrelated to the C compiler). Upstream CI uses `ubuntu-22.04` runners (GCC 11, Clang 14). CMake minimum is 3.15.

**Kqueue caveat.** `cmake/CheckWorkingKqueue.cmake` uses `check_c_source_runs()`, which attempts to execute a compiled binary on the host. This applies only to BSD kqueue targets and is irrelevant for riscv64 Linux.

**QEMU usage.** None. Zero references to "qemu" exist anywhere in the repository (workflows, scripts, docs, CI configs). Tests are expected to run natively or be disabled via the flags above during cross-compilation.

**Known build failures on riscv64.** None documented. Debian sid builds successfully on `rv-osuosl-01` with no reported failures, and no riscv64 build failure appears in any issue-tracker search (0 results for "riscv" across libevent/libevent issues, PRs, and commits).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps.** None. All libevent features, the epoll backend, evbuffer, DNS, HTTP, OpenSSL bufferevent, Mbed TLS bufferevent, and pthreads locking, are available on riscv64 without modification or stubs.

**Performance gaps.** No published benchmark data comparing libevent on riscv64 versus arm64 or x86_64 exists. Exhaustive GitHub and web searches (including a dedicated adversarial verification pass) returned zero results in every channel checked. Data not available: throughput/latency measurements for riscv64 versus arm64 or x86_64 under any workload (connections/second, bytes/second, tail latency). The library has no architecture-specific optimizations for any platform, so there is no SIMD-gap metric to compute; performance on riscv64 is expected to track the underlying CPU's scalar integer throughput and memory bandwidth relative to comparable arm64/x86_64 hardware.

**Security hardening gaps.** None specific to riscv64 were found. The upstream `scorecard.yml` job runs OpenSSF Scorecard checks on x86_64 only. No riscv64-specific stack-clash, CFI, or shadow-stack issue is documented for libevent.

**Floating-point semantics.** libevent contains no floating-point arithmetic in its core logic. No NaN/FP issues apply.

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

## 7. CI/CD Infrastructure

**Upstream CI.** No riscv64 CI of any kind exists. This was verified twice: once via a fresh clone's `.github/workflows` directory listing and full per-file grep, and again via direct `raw.githubusercontent.com` fetches of all four workflow files. Per-file results (case-insensitive search for "riscv", "risc-v", "risc_v", zero matches in every file):

- `build.yml`: jobs `linux-cmake-job`/`linux-autotools-job` (ubuntu-22.04), Windows (VS + vcpkg, MSVC), MinGW, macOS (cmake + autotools), FreeBSD 14/15 and OpenBSD (via `vmactions`), Apple platforms (iphoneos/appletvos/xros/watchos via Xcode), `android-cmake-job` (NDK cross-compile: arm-linux-androideabi, aarch64-linux-android, i686-linux-android, x86_64-linux-android, using an x86_64 AVD emulator only), and `abi-job`. No arm64-native-Linux job, no riscv64 target, no QEMU targeting any riscv architecture anywhere.
- `cifuzz.yml`: single "Fuzzing" job on ubuntu-latest (OSS-Fuzz). No riscv, no emulation.
- `master.yml`: `coverage-job`, `abi-job`, `doxygen-job`, all on ubuntu-22.04. No riscv, no cross-compilation.
- `scorecard.yml`: OpenSSF Scorecard "analysis" job on ubuntu-latest. No riscv.

The only emulation present in the entire CI surface is BSD VMs (x86) and an Android x86_64 AVD emulator, neither of which touches riscv64.

**RISE runners.** Not used. As of the RISE blog's most recent relevant update, RISE-operated Scaleway EM-RV1 runners have processed 13,000+ jobs across 197 repositories; libevent is not among the listed users.

**Hardware used for riscv64 testing.** Debian sid builds libevent on `rv-osuosl-01`, an Oregon State University Open Source Lab riscv64 buildd machine. This is distribution-level infrastructure, not upstream CI, and provides build validation only, not automated regression testing gated on release.

**CI comparison.**

| Platform | CI system | Runner type | Test suite run | RISE runners |
|----------|-----------|-------------|---------------|--------------|
| amd64 | GitHub Actions | ubuntu-22.04 (GitHub-hosted) | Full | No |
| arm64 | None (Android arm64-v8a cross-compile only, no test execution) | N/A | None | No |
| riscv64 | None | N/A | None | No |

## 8. Distribution and Release Status

**Upstream releases.** Source tarballs and PGP signatures only, confirmed via direct inspection of the GitHub release-assets endpoint. Most recent releases: 2.2.2-alpha and 2.2.1-alpha (development), 2.1.13-stable and 2.1.12-stable (stable line). No pre-built binaries of any kind are published upstream.

**Debian sid.** [libevent 2.1.12-stable-10+b2](https://buildd.debian.org/status/package.php?p=libevent&suite=sid) status: built successfully on `rv-osuosl-01`. All tier-1 architectures (amd64, arm64, i386, ppc64el, s390x) carry the same upstream version, built from unmodified source with no riscv-specific patches.

**Ubuntu (26.04 "resolute").** Confirmed present, but two independent archive lookups this round disagree on which archive and exact version it ships from, and that discrepancy is recorded rather than resolved:
- A direct query of [packages.ubuntu.com for resolute](https://packages.ubuntu.com/search?keywords=libevent&suite=resolute&searchon=names&section=all) shows two parallel version lines for `libevent-2.1-7t64`, `libevent-core-2.1-7t64`, `libevent-dev`, `libevent-extra-2.1-7t64`, `libevent-openssl-2.1-7t64`, and `libevent-pthreads-2.1-7t64`: `2.1.12-stable-10ubuntu0.2 [security]` for amd64/arm64/i386, and `2.1.12-stable-10build2 [ports]` for armhf/ppc64el/**riscv64**/s390x, placing riscv64 in the separate ports archive at an older build number.
- A cross-check via [Launchpad](https://launchpad.net/ubuntu/resolute/+source/libevent) (`launchpad.net/ubuntu/resolute/riscv64/libevent-dev`) instead shows libevent published for riscv64 at `2.1.12-stable-10ubuntu0.2`, dated 2026-09-29, in the main archive's updates/security pockets alongside amd64/arm64.
- Net effect: riscv64 availability for libevent in Ubuntu 26.04 is confirmed by both sources; only the archive tier and exact build number disagree (`10build2`/ports vs `10ubuntu0.2`/main). This may reflect a sync between archives that occurred between the two lookups rather than a real conflict, but it was not possible to fully reconcile within this research pass.

**Gentoo.** Version 2.1.12-r1 available at `~riscv` (testing/unstable tier). No riscv64-specific patches are present in the ebuild. [NEEDS VERIFICATION, single source]

**Arch Linux RISC-V.** Not present in the [archriscv-packages patch list](https://github.com/felixonmars/archriscv-packages), which suggests the upstream PKGBUILD builds cleanly on riscv64 without modification. Direct confirmation of current package status on the archriscv.felixc.at package browser could not be obtained this round: its package table is rendered client-side and a non-JS fetch returns only the static shell page. [NEEDS VERIFICATION]

**AUR.** `android-riscv64-libevent 2.1.12` is available as a cross-compiled Android target package.

**Alpine Linux edge.** libevent 2.1.12-r9 available in the main repository for riscv64, last built 2026-03-27. No issues noted.

**PyPI / language package registries.** Not applicable. libevent is a C library with no Python packaging: `pypi.org/pypi/libevent/json` returns HTTP 404, reproduced twice, and the RISE GitLab wheel-builder's simple index for "libevent" redirects to the same 404. No package named "libevent" is registered on PyPI under any form.

**What a user must do to get a working binary.** On Debian or Ubuntu, `apt install libevent-dev` works on riscv64 natively (main or ports archive, per above). For cross-compilation, use the standard `riscv64-linux-gnu-gcc` toolchain with the CMake or Autotools commands in Section 5.

## 9. Dependencies

**Summary table.**

| Dependency | Relation | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|------------|----------|--------------|---------------|--------------|-----------------|-------|
| OpenSSL | runtime-dependency | optional | Builds on riscv64 (Ubuntu 26.04 resolute `libssl-dev`); has a known cross-compile configuration bug | Intermittent `test_lhash` failure reported on riscv64 CI | Debian sid 3.6.3-1 (riscv64) | Only dependency with RISC-V-specific assembly (Zkn/Zvk vector crypto, RVV). See deep-dive below. |
| Mbed TLS | runtime-dependency | optional | Builds on riscv64 (Ubuntu 26.04 resolute `libmbedtls-dev`); no riscv64-specific build issues found | No riscv64 CI reported by Mbed TLS upstream | Debian sid 3.6.6-0.1 (riscv64) | One open upstream issue ([#9003](https://github.com/Mbed-TLS/mbedtls/issues/9003)) characterized as ARM/NEON-specific, not riscv64. |
| zlib | test-dependency | optional | Builds on riscv64 (Ubuntu 26.04 resolute `zlib1g-dev`) | No riscv64-specific issues found; only RISC-V-adjacent CI activity is [zlib#1139](https://github.com/madler/zlib/pull/1139), which added OpenBSD/riscv64 to zlib's own CI matrix (merged 2026-01-28, CI-only) | Debian sid 1:1.3.dfsg+really1.3.2-3 (riscv64) | Used only in libevent's test suite, not linked into the production library. |
| glibc | runtime-dependency | critical | Ships in all riscv64 Linux distributions | Fully tested upstream on riscv64 | Ships in all riscv64 distributions | Provides `pthreads` for `evthread_use_pthreads`, required on Linux. No riscv64-specific issues found. |
| CMake | build-dependency | critical | Data not available: no dedicated riscv64 build/version verification of CMake itself was performed in this research pass. CMake is a foundational, architecture-agnostic build tool already present in every mainstream riscv64 Linux distribution's package set (it is required to build libevent's own CMake path); libevent requires CMake >= 3.15. | Data not available: not specifically researched | Data not available: not specifically researched | No architecture-specific role in libevent's build; general-purpose build-system dependency. |
| autoconf | build-dependency | optional | Data not available: no dedicated riscv64 verification performed. Used only for the Autotools build path (deprecated since 2.2-alpha) | Data not available: not specifically researched | Data not available: not specifically researched | Alternate to CMake; `configure.ac` uses standard `AC_CANONICAL_HOST`/`--host=` cross-compilation with no riscv64-specific handling. |
| automake | build-dependency | optional | Data not available: no dedicated riscv64 verification performed. Used only for the Autotools build path | Data not available: not specifically researched | Data not available: not specifically researched | Same Autotools path as autoconf. |
| Python | build-dependency | optional | Data not available: no dedicated riscv64 verification performed. Referenced in `CMakeLists.txt` as `find_package(Python3)`/`find_package(Python2)`, build-time only, not linked into the library | Data not available: not specifically researched | Data not available: not specifically researched | No JIT/SIMD/crypto/compression role; excluded from the crypto/compression dependency deep-dive below. |

**OpenSSL deep-dive.** OpenSSL is the only dependency with RISC-V-specific code (Zkn, Zvk vector crypto, RVV SHA-512, RVV Poly1305 paths in OpenSSL itself). Two open OpenSSL issues have riscv64 relevance:

- [Issue #29357](https://github.com/openssl/openssl/issues/29357): cross-compilation with `no-deprecated` fails on riscv64 across active branches (3.4, 3.5, 3.6, 4.0, master). Workaround: omit `no-deprecated` from the Configure invocation. A fix (PR #30763) is pending merge.
- [Issue #30880](https://github.com/openssl/openssl/issues/30880): intermittent `test_lhash` failure on riscv64 CI.

Neither issue blocks libevent's use of OpenSSL on riscv64; both affect OpenSSL's own build configuration and test suite, not the runtime TLS functionality libevent exposes through `bufferevent_openssl`.

**Mbed TLS.** The one open issue in the Mbed TLS tracker that surfaced in searches ([#9003](https://github.com/Mbed-TLS/mbedtls/issues/9003)) is characterized as ARM/NEON-specific rather than riscv64-specific. No confirmed riscv64-specific Mbed TLS issue was found.

**zlib.** No blocking issues of any kind found for riscv64; the one RISC-V-adjacent item is a CI-matrix-only pull request, not a bug.

## 11. Known Bugs and Active Issues

No RISC-V-specific bugs exist in libevent/libevent: exhaustive issue, PR, and commit searches for "riscv", "riscv64", and "risc-v" all return 0 results, and a targeted "riscv64 bug" query surfaced only a single, semantically-matched but unrelated Windows IOCP crash report ([#957](https://github.com/libevent/libevent/issues/957), 2020), not a RISC-V bug.

The following general open issues carry cross-architecture correctness or build relevance. These entries originate from the existing report's issue survey and were not independently re-queried against current issue status in this research pass; treat status/severity as [NEEDS VERIFICATION] for currency.

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#1876](https://github.com/libevent/libevent/issues/1876) | Security issues | Open | High | No further detail available in research findings |
| [#1842](https://github.com/libevent/libevent/issues/1842) | UAF via shared lock lifetime mismatch in bufferevent_finalize_cb_ | Open | High | Use-after-free correctness bug; applies to all architectures equally |
| [#1857](https://github.com/libevent/libevent/issues/1857) | Leak when using libevent and pthread | Open | Medium | Memory leak; applies to all architectures |
| [#1858](https://github.com/libevent/libevent/issues/1858) | Compilation failure with gcc 14.2 + Mbed-TLS + aarch64 | Open | Medium | aarch64-specific build failure with gcc 14.2; may indicate a pattern relevant to riscv64/gcc 14 combinations [NEEDS VERIFICATION] |
| [#1856](https://github.com/libevent/libevent/issues/1856) | Memory bloat while using THP | Open | Medium | Transparent huge page interaction; applies to all Linux architectures |
| [#1836](https://github.com/libevent/libevent/issues/1836) | Some tests fail on Illumos | Open | Low | Platform-specific to Illumos; no riscv64 relevance |

**Correctness bugs summary.** Two correctness bugs are open: the use-after-free (#1842) and the pthread leak (#1857). Both affect all architectures equally; neither has a RISC-V-specific component.

## 12. Objections and Upstream Blockers

**Stated objections.** None. The upstream maintainers have made no statements opposing riscv64 support. The zero results across every RISC-V-related search indicate no engagement, not opposition.

**Technical blockers.** None. The library requires no architecture-specific code, compiles cleanly on riscv64 using a standard `riscv64-linux-gnu-gcc` toolchain, and Debian and Ubuntu both ship riscv64 package sets built from unmodified upstream source.

**Organizational blockers.** None. The project accepts PRs without a CLA, has no foundation approval process, and has no formal objection mechanism.

**Acceptance probability for a riscv64 CI addition.** High. Adding a QEMU-based or native riscv64 job to `build.yml` follows the existing pattern of the Android cross-compile jobs. The maintainers (`nmathewson`, `azat`) have demonstrated willingness to accept platform additions historically. The work is mechanical: no code changes are required, only CI configuration.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro

**Justification.** No upstream riscv64 CI exists for libevent: all four GitHub Actions workflow files (`build.yml`, `master.yml`, `cifuzz.yml`, `scorecard.yml`) were read directly and contain zero references to riscv/riscv64/RISC-V in any job, matrix, or runner ([build.yml](https://github.com/libevent/libevent/blob/master/.github/workflows/build.yml)), and there is no riscv64-related issue, PR, or commit in the upstream repository. However, Debian sid and Ubuntu both build and ship libevent for riscv64 from unmodified upstream source with no riscv-specific patches ([Debian buildd: libevent sid](https://buildd.debian.org/status/package.php?p=libevent&suite=sid) shows a successful riscv64 build on `rv-osuosl-01`; Ubuntu resolute's ports archive lists `libevent-2.1.12-stable-10build2` for riscv64 alongside armhf/ppc64el/s390x). Per the color model's distribution floor, a clean (unpatched) downstream build with no upstream CI upgrades the project from orange to yellow (case `clean-distro-build`); it does not qualify for blue or green since no upstream CI runs riscv64 tests or publishes a riscv64 release. libevent is not an optimization-purpose project (it is a portable event-notification/I-O abstraction library, not a SIMD/crypto/allocator/compression speed play), so no optimization-level modifier applies.

**Pending work that could change the grade.** No open PRs or issues reference riscv64 in libevent/libevent. No RISE Project involvement was found (absent from the RISE blog archive, the RISE Python wheel builder, the System Libraries working group's tracked-library list, and the riseproject-dev GitHub org). The only actionable item is a low-effort, low-priority upstream CI addition (a riscv64 QEMU/cross-compile job added to `build.yml`, mirroring the existing Android cross-compile jobs; no code changes required since the library has zero architecture-specific code), estimated at approximately 0.25 person-week and not currently in progress.

## 14. Investment Analysis

RISE has no prior investment in libevent across functional enablement, performance optimization, CI/CD, or ecosystem enablement (confirmed by the absence of libevent from the RISE blog, the RISE wheel builder, the System Libraries WG tracked-library list, and the riseproject-dev GitHub org's project catalog). All areas below are uncovered by any existing RISE work.

### 14.1 Functional Enablement

No functional work is required. libevent builds and runs correctly on riscv64 from unmodified upstream source. Debian sid and Ubuntu both ship riscv64 package sets with no patches against upstream.

### 14.2 Performance Optimization

No performance optimization work is applicable. libevent contains no architecture-specific code for any platform. The library's performance is determined entirely by OS kernel throughput (`epoll_wait` latency, kernel buffer management) and scalar integer performance of the CPU. There are no SIMD, crypto, or JIT paths to optimize, and no riscv64-vs-arm64/amd64 benchmark data exists to establish a baseline even if optimization were in scope.

### 14.3 CI/CD Infrastructure

The only gap of practical engineering value is upstream CI coverage. Without upstream CI, regressions on riscv64 will not be caught before release; the project currently relies entirely on downstream distro buildds (e.g., Debian's `rv-osuosl-01`) for build validation.

**Work item:** Add a riscv64 cross-compile (and, optionally, QEMU-based or native) test job to `.github/workflows/build.yml`. This requires no code changes, only a new CI job definition following the existing Android cross-compile pattern. A RISE-hosted riscv64 runner could be used for native test execution if contributed.

Effort: approximately 0.25 person-week (1-2 person-days) to write and validate the CI job. Upstream PR acceptance probability: high (no CLA, permissive governance, precedent of accepting new cross-compile targets).

### 14.4 Ecosystem Enablement

Not applicable. libevent is a C library with no dependent package ecosystem (no PyPI package, no npm package, no Maven artifact) requiring separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Functional | None, library builds and runs correctly on riscv64 | 0 | N/A | N/A |
| Performance | None, no architecture-specific code paths exist in libevent | 0 | N/A | N/A |
| CI/CD | Add riscv64 cross-compile + test job to upstream GitHub Actions | 0.25 | Qualcomm / RISE contributor | Low |
| Ecosystem | Not applicable | 0 | N/A | N/A |

**Assessment.** libevent requires no investment for riscv64 functional or performance enablement. The single optional work item (upstream CI) is low-effort and low-priority: Debian's `rv-osuosl-01` buildd already provides build validation, and the library's architecture-agnostic design makes riscv64-specific regressions unlikely. Investment here yields minimal return relative to projects with actual porting gaps or SIMD/crypto optimization opportunities.

## 15. References

- [libevent GitHub repository](https://github.com/libevent/libevent)
- [libevent project homepage](https://libevent.org/)
- [libevent GitHub Actions: build.yml](https://github.com/libevent/libevent/blob/master/.github/workflows/build.yml)
- [libevent GitHub Actions: master.yml](https://github.com/libevent/libevent/blob/master/.github/workflows/master.yml)
- [libevent GitHub Actions: cifuzz.yml](https://github.com/libevent/libevent/blob/master/.github/workflows/cifuzz.yml)
- [libevent GitHub Actions: scorecard.yml](https://github.com/libevent/libevent/blob/master/.github/workflows/scorecard.yml)
- [libevent GitHub releases](https://github.com/libevent/libevent/releases)
- [libevent release-2.1.12-stable asset listing](https://github.com/libevent/libevent/releases/expanded_assets/release-2.1.12-stable)
- [libevent Documentation/Building.md](https://github.com/libevent/libevent/blob/master/Documentation/Building.md)
- [libevent commit 0374b559: m4/libevent_openssl.m4 fix](https://github.com/libevent/libevent/commit/0374b55942e533a3c3997439481a8d05d6c8f729)
- [Debian buildd status: libevent sid](https://buildd.debian.org/status/package.php?p=libevent&suite=sid)
- [Ubuntu packages search: libevent, resolute](https://packages.ubuntu.com/search?keywords=libevent&suite=resolute&searchon=names&section=all)
- [Launchpad: libevent source package, resolute](https://launchpad.net/ubuntu/resolute/+source/libevent)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE System Libraries working group](https://github.com/riseproject-dev/system-libraries-wg)
- [archriscv-packages patch list](https://github.com/felixonmars/archriscv-packages)
- [OpenSSL issue #29357: riscv64 cross-compile no-deprecated](https://github.com/openssl/openssl/issues/29357)
- [OpenSSL issue #30880: flaky test_lhash on riscv64](https://github.com/openssl/openssl/issues/30880)
- [Mbed TLS issue #9003](https://github.com/Mbed-TLS/mbedtls/issues/9003)
- [zlib PR #1139: add OpenBSD/riscv64 to CI matrix](https://github.com/madler/zlib/pull/1139)
- [libevent issue #957: http IOCP bug cause crashed](https://github.com/libevent/libevent/issues/957)
- [libevent issue #1842: UAF in bufferevent_finalize_cb_](https://github.com/libevent/libevent/issues/1842)
- [libevent issue #1857: pthread leak](https://github.com/libevent/libevent/issues/1857)
- [libevent issue #1858: gcc 14.2 + Mbed-TLS + aarch64 build failure](https://github.com/libevent/libevent/issues/1858)
- [libevent issue #1856: memory bloat with THP](https://github.com/libevent/libevent/issues/1856)
- [libevent issue #1876: security issues](https://github.com/libevent/libevent/issues/1876)
- [libevent issue #1836: test failures on Illumos](https://github.com/libevent/libevent/issues/1836)