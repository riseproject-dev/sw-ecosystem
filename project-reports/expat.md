---
title: expat
parent: Project Reports
color: blue
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: automake
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="expat" %}

# expat

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for expat<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Expat (libexpat) is a stream-oriented XML parsing library written in portable C99. It is one of the most widely deployed XML parsers in existence, consumed by Python (via the `pyexpat` stdlib binding), Subversion, Apache httpd, and hundreds of other downstream projects. The library is licensed under the MIT/X Consortium license and has no foundation governance structure.

The project self-describes on [its homepage](https://libexpat.github.io/) as "unfunded" and "understaffed," operating in maintenance mode. It is effectively a single-maintainer project: Sebastian Pipping (GitHub handle hartwork), with the feedback contact point `sebastian@pipping.org`. Decisions are driven by GitHub issue/PR discussion rather than any formal board or committee. One time-boxed institutional exception exists: starting August 2026 the City of Munich is funding six months of maintenance work under its Open Source Sabbatical program, a municipal grant rather than a corporate sponsorship or foundation membership. No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, or `PLATFORMS.md` file exists, so there is no documented tiered platform-support policy.

expat is not a RISE member. RISE's Premier Members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and General Members (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) do not include expat, libexpat, or Codasip (see Section 2). No RISE blog post, wheel-builder listing, or working-group repository references expat.

Community culture on new ports is conservative. CONTRIBUTING.md rejects changes that break API/ABI backward compatibility and asks that large or controversial changes be discussed in an issue first. In practice the two riscv64 CI PRs (Section 2) were accepted quickly because they imposed no ongoing maintenance burden beyond CI minutes.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2026-08-25 | [PR #1337](https://github.com/libexpat/libexpat/pull/1337), "Make CI cover compilation and execution on riscv64," opened by contributor darkavatar23 | [PR #1337](https://github.com/libexpat/libexpat/pull/1337) |
| 2026-08-28 (~11:24 UTC) | PR #1337 merged by maintainer hartwork after a requested commit-author-name fix; adds a QEMU-emulated riscv64 build+test job, the first non-x86 Linux architecture in CI | [PR #1337](https://github.com/libexpat/libexpat/pull/1337) |
| 2026-08-28 (~17:17 UTC) | [PR #1339](https://github.com/libexpat/libexpat/pull/1339), "Cover s390x in addition to riscv64, and rename the workflow to qemu.yml," opened and merged same day | [PR #1339](https://github.com/libexpat/libexpat/pull/1339) |
| 2026-08-31 | Release R_2_8_4 tagged, the first release whose CI included riscv64/s390x coverage (the CI change itself ships no code affecting parsing behavior) | Git history (`git tag --contains`) |
| 2026-09-14 | Commit `823b490de425109175b1ef5232416cc00944371a`, "lib: Do not assume long long has the strictest member alignment," authored by Florian Schmaus and co-authored by Stuart Menefy (both Codasip) | Git commit history |

The upstream repository has no dedicated riscv64 "port": there is no `riscv/` directory, no architecture-specific source file, and no `#ifdef __riscv` block anywhere in the tree. The entirety of libexpat's RISC-V-specific work consists of the two CI PRs above, which add QEMU-emulated build-and-test coverage, and one portability bugfix.

The September 2026 commit from Codasip engineers Florian Schmaus and Stuart Menefy fixed a malloc-alignment assumption (`unsigned long long` fields needing 64-bit alignment while some allocators only guarantee 32-bit alignment) that caused crashes on **CHERI RISC-V** (16-byte pointer "capabilities" requiring 16-byte alignment); it also benefits other platforms such as sparc32. This is the only RISC-V/CHERI/Codasip-attributed commit in the entire commit history (confirmed via three independent commit-message searches: "RISC-V," "cheri," "codasip"). It is a one-off portability contribution from Codasip (a RISC-V processor IP vendor), not evidence of an ongoing Codasip maintainer relationship.

No GitHub Issue anywhere in libexpat/libexpat mentions "riscv" or "riscv64" (`search_issues` returns 0 results for both terms, open and closed). The work is fully upstream and merged; no riscv64 CI PR remains open.

## 3. Upstream Support Tier

Expat has no formal tier policy and no documented architecture support matrix. Tier status is inferred from CI coverage and release artifact content.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage | Yes (ubuntu-24.04 runner, all workflows) | Partial (Windows ARM64 via windows-binaries.yml) | Yes, QEMU-emulated (`.github/workflows/qemu.yml`, added by PR #1337/#1339) |
| CI trigger scope | Every push/PR | Every push/PR (Windows only) | Every push/PR, plus weekly cron and manual dispatch |
| Release-blocking test gate | Yes | No | No (CI passing is not a documented release gate for any non-native architecture) |
| Official upstream binaries | Source tarballs; Windows installers/zips | No (source only) | No (source only) |
| Known build failures (current) | None | None | None |
| Distribution packages (latest) | All major distros | All major distros | Debian trixie/sid `libexpat1-dev` 2.8.3-1; Ubuntu 26.04 resolute `libexpat1`/`libexpat1-dev` 2.7.4-1 (ports component) |

amd64 is the only architecture with release-blocking, native CI across all workflows. riscv64 now has build-and-test CI coverage equal in trigger scope to amd64 (every push and PR, via `qemu.yml`), the only difference being emulation versus native execution. No upstream release process, for any architecture beyond Windows, publishes prebuilt binaries; riscv64 binaries reach users exclusively through downstream distro packaging (Section 8).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Expat is a pure portable C99 XML parser. It has no JIT engine, no SIMD dispatch, no cryptographic library, no compression library, no garbage collector, and no memory allocator beyond the system standard library. GitHub code search within libexpat/libexpat for `__riscv`, `__x86_64__`, `__aarch64__`, `SIMD`, and `intrinsics` each returned 0 results; the single `asm` substring hit is a false positive inside the identifier `hasMore` in `xmlparse.c`, not inline assembly.

The complete contents of `expat/lib/` (12 files) are: `xmlparse.c` (parser state machine), `xmltok.c` (tokenizer dispatch), `xmltok_impl.c` and `xmltok_ns.c` (included variants, keyed by encoding width, not architecture), `xmlrole.c` (grammar/role classifier), `xcsinc.c` (included helper), and six `random_*.c` files (`getrandom`, `arc4random`, `arc4random_buf`, `getentropy`, `dev_urandom`, `rand_s`) selecting an entropy source by OS/libc API, not by CPU ISA. None of these files are named or guarded per-CPU-architecture.

The only platform variation anywhere in the source tree is:

1. **Entropy source selection**, auto-detected at configure time from `getrandom`, `arc4random`, `getentropy`, `SYS_getrandom`. All are available on glibc riscv64.
2. **Endianness**, via CMake's `TestBigEndian` probe (compiler-intrinsic based, does not require executing a target binary). riscv64 is little-endian (BYTEORDER=1234), identical in outcome to amd64 and arm64. This is also the reason PR #1339 added s390x (the one big-endian architecture Debian ships) as a complementary CI target, per maintainer hartwork's review comment on PR #1337.
3. **Calling-convention hint** (`regparm(3)`/FASTCALL) in `internal.h`, gated on `defined(__GNUC__) && defined(__i386__)` only; absent on amd64 (x86_64), arm64, and riscv64 equally.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD / vectorized XML parsing | missing | missing | missing |
| Hand-written assembly | missing | missing | missing |
| C intrinsics | missing | missing | missing |
| JIT | missing | missing | missing |
| Calling-convention hint (i386 regparm) | x86-32 only, absent on x86_64 | missing | missing |
| Endianness handling (scalar, generic) | full | full | full |
| Entropy source detection | full | full | full |
| Scalar XML parser (xmlparse, xmltok, xmlrole) | full | full | full |

No architecture receives a performance-optimized path. Applying an "arch-specific implementation completeness" scale (full/partial/scalar/missing) to expat is a category error: amd64 and arm64 have exactly zero lines of arch-specific code, so riscv64 is at parity with both by construction, not by a porting effort.

## 5. Build System, Cross-Compilation, and Toolchain

The build system is CMake (minimum version 3.17.0, per `expat/CMakeLists.txt`), with a parallel Autotools path. The C standard is C99, enforced with extensions disabled.

**Compiler requirements** (from `README.md`, apply to all platforms including riscv64): GNU GCC >= 4.5 for C use, GCC >= 4.8.1 for C++ use, LLVM Clang >= 3.5. No riscv64-specific minimum is documented; any current riscv64-targeted GCC or Clang exceeds these floors.

**Actual riscv64 build mechanism** (verified by direct fetch of `https://raw.githubusercontent.com/libexpat/libexpat/master/.github/workflows/qemu.yml`, HTTP 200, and independently corroborated by GitHub code search matching the same file): a `ubuntu-24.04` (x86_64) GitHub Actions runner registers QEMU user-mode/binfmt emulation via `docker/setup-qemu-action@v4.4.0`, then runs `docker run --platform "linux/riscv64" debian:trixie-slim`. Inside the emulated container it natively compiles and tests:

```
cmake \
  -DCMAKE_C_FLAGS="-O1 -pipe -Wall -Wextra -pedantic -Wno-overlength-strings" \
  -DCMAKE_CXX_FLAGS="-O1 -pipe -Wall -Wextra -pedantic -Wno-overlength-strings" \
  -DEXPAT_BUILD_DOCS=OFF \
  -DEXPAT_WARNINGS_AS_ERRORS=ON \
  -S expat/ -B build/

make -C build -j$(nproc) VERBOSE=1 all
make -C build/ test run-xmltest
```

`-DEXPAT_BUILD_DOCS=OFF` is the only option disabled specifically for this job, and it is unrelated to riscv64 itself: it skips the xmlwf man page because `docbook2x-man` is not installed in the minimal container. `EXPAT_WARNINGS_AS_ERRORS=ON` means any new compiler warning on riscv64 fails the build. The job runs on every `pull_request`, every `push`, a weekly Friday 2am UTC cron, and manual `workflow_dispatch`; it is matrixed over `riscv64` (little-endian) and `s390x` (big-endian) with `fail-fast: false`.

There is no dedicated riscv64 CMake toolchain file in the repository (`expat/cmake/` contains only `autotools/`, `expat-config.cmake.in`, and MinGW win32/win64 toolchain files) and no riscv64 Dockerfile; the CI approach is "compile natively inside an emulated container," not cross-compilation with a `riscv64-linux-gnu-gcc` toolchain file. A user wanting true cross-compilation would need to construct their own toolchain file (analogous to the MinGW ones shipped) and pass `-DEXPAT_BUILD_TOOLS=OFF -DEXPAT_BUILD_TESTS=OFF` since the resulting binaries cannot run on the build host without separate QEMU setup; no such file or documented flow currently exists.

**Known build failures:** none on riscv64 in the current CI or current releases (2.8.5, milestone history shows the riscv64/s390x additions shipped cleanly in 2.8.4 with 54 and 55 CI checks passing respectively, per PR #1337 and #1339).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| XML parsing (all conformance levels) | full | full | full | None |
| Namespace support | full | full | full | None |
| DTD / parameter entity parsing | full | full | full | None |
| xmlwf command-line tool | full | full | full | None |
| UTF-8, UTF-16 (LE and BE), ISO-8859 | full | full | full | None |
| Hash randomization (SipHash) | full | full | full | None |
| SIMD-accelerated parsing | missing | missing | missing | None (not implemented for any architecture) |
| CI build + test execution | full (native) | partial (Windows only) | full (QEMU-emulated, PR #1337/#1339) | Execution-mode gap only (emulated vs. native) |
| Release-published binaries | source + Windows only | source only | source only | None beyond what every non-Windows architecture also lacks |

There are no functional gaps between riscv64 and amd64 or arm64; no feature is gated on architecture. The remaining gap is that riscv64's CI runs under QEMU emulation on an x86_64 host rather than on native riscv64 hardware, a characterization explicitly confirmed by direct inspection of `qemu.yml` ("this is QEMU-emulated riscv64 on an x86_64 host, not native riscv64 hardware/runner CI"). Since no architecture has a SIMD path, there is no software-derived performance delta between riscv64 and amd64/arm64; any observed throughput difference is attributable to hardware clock speed and microarchitecture. No published benchmark data comparing expat's throughput on riscv64 versus amd64 or arm64 was found in this research (Phoronix, academic SPEC/RISC-V papers, and RISE's own optimization guide were checked; none mention expat). No RISC-V-specific NaN/floating-point issue exists; the one semantically adjacent closed issue, [#1046](https://github.com/libexpat/libexpat/issues/1046) ("Bad memory alignment on 32 bit architectures," closed 2025-09-22), concerns sparc32/ARM 32-bit alignment, not RISC-V. No architecture-specific security hardening differs by platform; entropy source selection is identical across amd64, arm64, and riscv64.

## 7. CI/CD Infrastructure

All 25 files under `.github/workflows/` were checked (`autotools-cmake.yml`, `clang-format.yml`, `clang-static-analyzer.yml`, `clang-tidy.yml`, `cmake-required-version.yml`, `codespell.yml`, `coverage.yml`, `coverity-scan.yml`, `cppcheck.yml`, `emscripten.yml`, `expat_config_h.yml`, `fil-c.yml`, `freebsd.yml`, `fuzzing.yml`, `linux.yml`, `macos.yml`, `mingw-clang.yml`, `musl.yml`, `perl-integration.yml`, `qemu.yml`, `solaris.yml`, `valid-xml.yml`, `wasi_sdk.yml`, `windows-binaries.yml`, `windows-build.yml`, `zizmor.yml`). Only `qemu.yml` contains riscv references. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository.

`qemu.yml` ("Build and test with QEMU") runs on `ubuntu-24.04`, uses `docker/setup-qemu-action@v4.4.0` to register binfmt QEMU emulation, and executes a matrix of `riscv64` and `s390x` inside `debian:trixie-slim` containers via `docker run --platform "linux/${platform}"`. It both builds Expat with CMake and runs `make test run-xmltest` inside the emulated container, i.e. it compiles and executes the full test suite, not merely a compile check. Triggers are `pull_request` (any), `push` (any), a weekly cron (`0 2 * * 5`), and `workflow_dispatch`.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linux native CI | Yes | No | No (QEMU-emulated) |
| Linux build+test CI (any mode) | Yes (native) | No | Yes (QEMU-emulated via qemu.yml) |
| Windows CI | Yes | Yes (2.8.1+) | No |
| QEMU-based testing | No | No | Yes |
| Release-blocking test gate | Not formally documented for any architecture | No | No |
| RISE CI runners used | No | No | No |

No RISE runner, RISE infrastructure, or RISE funding is involved in this CI. The riscv64 job uses a standard GitHub-hosted x86_64 runner plus QEMU emulation, contributed and merged by an independent community contributor (darkavatar23), reviewed by maintainer hartwork.

## 8. Distribution and Release Status

**Upstream (GitHub Releases):** [libexpat/libexpat releases](https://github.com/libexpat/libexpat/releases), latest 2.8.5, ship source tarballs only (`.tar.bz2`, `.tar.bz3`, `.tar.gz`, `.tar.lz`, `.tar.xz`, each with `.asc` signatures) plus GitHub's auto-generated source archives. This has been verified directly across releases 2.8.5, 2.8.4, 2.8.3, 2.8.2, and 2.8.1: zero binary assets of any architecture are attached to any of them. Windows installer/zip binaries mentioned in earlier reporting were not found in this pass's direct check of the releases page and should be treated as unconfirmed for the current release set; the only confirmed asset type across all recent releases is source. No riscv64 (or any-architecture) binary is published upstream, by design.

**Debian:** `libexpat1-dev` 2.8.3-1 is available for trixie/sid, and 2.8.3-1~deb13u1 (319.9 kB `.deb`) is confirmed present specifically for riscv64 on the trixie package page.

**Ubuntu 26.04 "resolute":** Confirmed via two independent channels. The `packages.ubuntu.com` search (HTTP 200 at time of check) lists `expat`, `libexpat1`, and `libexpat1-dev` at 2.7.4-1 for `armhf ppc64el riscv64 s390x` in the **ports** component (not the primary `security`/main archive, which covers only amd64/arm64/i386), and separately 2.7.4-1ubuntu0.2 for amd64/arm64/i386 in the security component. Independently, Launchpad's REST API (`api.launchpad.net`, queried directly against the `resolute`/riscv64 distro-arch-series) returned two `Published` binary entries for `libexpat1`: 2.7.4-1 and 2.7.4-1ubuntu0.2 (updates pocket, 2026-09-24). This is machine-verifiable confirmation independent of the packages.ubuntu.com front end, which was intermittently unreachable (HTTP 503) during part of this research.

**PyPI:** A package literally named `expat` exists at [pypi.org/project/expat](https://pypi.org/project/expat/) (versions 0.1.0 through 0.1.0.post4), but it is an unrelated, unaffiliated pure-Python package (`py3-none-any` wheel, by an unrelated author) and not libexpat or its Python bindings; `pyexpat`/`xml.parsers.expat` ship in CPython's own standard library, not as a separate PyPI wheel. This PyPI package is not evidence of, or against, riscv64 availability for the real Expat library and should not be cited as such.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/expat/` returns an HTTP 302 redirect straight to plain PyPI, confirming no RISE-specific riscv64 build exists for the (unrelated) "expat" PyPI package.

**Arch Linux:** Not confirmed present or absent; the `archriscv.felixc.at` status page's content did not list expat in a plain fetch, but the page appears to be JS-rendered, so this is inconclusive rather than a confirmed absence. Data not available: a reliable non-JS query path for Arch Linux's RISC-V port status for this package.

**To obtain a working riscv64 binary today:** install `libexpat1`/`libexpat1-dev` from Debian trixie/sid or Ubuntu 26.04 resolute's ports component via the system package manager. No additional steps, compilation, or QEMU setup are required by an end user; upstream source-only distribution means building from source is also always available and requires no riscv64-specific patches.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| CMake | Build-dependency, critical. Primary build system (>=3.17.0) | Pass, riscv64 CMake support predates 3.17 and is exercised directly by `qemu.yml` | N/A (build-time only) | Build-time only, present in Debian trixie riscv64 used by CI | None |
| GCC | Build-dependency, critical. Default C/C++ compiler; `qemu.yml` installs `gcc`/`g++` from Debian trixie's riscv64 apt repository inside the emulated container | Pass, exercised on every CI run | Pass (compiles and links the test binaries executed in the same job) | Runtime toolchain only, not shipped | None |
| LLVM | Build-dependency, optional. README documents Clang >= 3.5 as an alternative compiler; not used in the riscv64 CI job (which installs GCC), so riscv64 Clang coverage is untested by upstream CI | Not exercised on riscv64 by any upstream workflow; Data not available: dedicated riscv64 Clang CI | N/A | N/A | None known, but unverified on riscv64 specifically |
| glibc | Runtime-dependency, critical. Provides entropy APIs (`getrandom`, `arc4random`, `getentropy`, `SYS_getrandom`), memory, and I/O | Pass, present on all major riscv64 Linux distros (see [glibc report](project-reports/glibc.md)) | Pass | Available in all riscv64 Linux distros | None |
| autoconf | Build-dependency, optional. Drives the parallel Autotools build path (`./configure --host=riscv64-linux-gnu`) | Pass, standard cross/native autoconf support; not the path exercised by `qemu.yml` (which uses CMake) | N/A | Build-time only | None |
| automake | Build-dependency, optional. Companion to autoconf for the Autotools path | Pass, architecture-agnostic | N/A | Build-time only | None |
| QEMU | Test-dependency, optional. Provides the user-mode/binfmt emulation (via `docker/setup-qemu-action@v4.4.0`) that makes riscv64 (and s390x) CI possible on an x86_64 GitHub-hosted runner | N/A (host-side tool, not linked into expat) | Pass, this is precisely the mechanism that executes `make test run-xmltest` on riscv64 in CI | N/A | None |
| glibc (docbook2x) | Build-dependency, optional. Generates the `xmlwf` man page; omitted in the riscv64 CI job via `-DEXPAT_BUILD_DOCS=OFF` because it is not installed in the minimal `debian:trixie-slim` container | Not exercised on riscv64 by CI (explicitly disabled) | N/A | Build-time only, when enabled | None |

No dependency in this set involves JIT compilation, SIMD dispatch, cryptographic acceleration, or architecture-specific memory allocation. Expat's one internal algorithmic component of note, SipHash (vendored, header-only, no separate package), uses portable rotation/XOR operations with no architecture-specific code path and needs no separate riscv64 verification beyond the compiler itself. All entropy-source APIs consumed from glibc are available on riscv64 without modification. The critical-path dependencies for riscv64 CI to keep passing are CMake, GCC, glibc, and QEMU; none currently carries a known riscv64-blocking issue.

## 11. Known Bugs and Active Issues

**RISC-V/CHERI-related:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| Commit [823b490](https://github.com/libexpat/libexpat/commit/823b490de425109175b1ef5232416cc00944371a) | "lib: Do not assume long long has the strictest member alignment" | Merged (2026-09-14) | Correctness (crash fix) | Fixes a malloc-alignment assumption causing crashes on CHERI RISC-V (16-byte capability alignment); also benefits sparc32. Not filed as a tracked issue, landed directly as a Codasip-authored commit. |

No open GitHub Issue in libexpat/libexpat mentions RISC-V, riscv64, or CHERI (`search_issues` with both terms returns 0 results, confirmed in two independent passes of this research). The one semantically adjacent closed issue is [#1046](https://github.com/libexpat/libexpat/issues/1046), "Bad memory alignment on 32 bit architectures" (closed 2025-09-22), which concerns sparc32 and 32-bit ARM, not RISC-V, and should not be conflated with a RISC-V-filed bug. No open correctness or performance bug is currently filed against expat specifically for RISC-V.

**Other active issues (not RISC-V-specific):** Data not available in this research pass: a current, re-verified snapshot of open non-RISC-V issues (security moratoriums, release-tracking issues, feature requests) was not part of the live findings gathered for this report and is not reproduced here to avoid presenting stale information as current.

## 12. Objections and Upstream Blockers

**Stated policy:** CONTRIBUTING.md favors small, low-risk changes and rejects PRs that break API/ABI compatibility; the sole maintainer is a volunteer with limited bandwidth (partially offset by the City of Munich's six-month funded sabbatical starting August 2026).

**Practical consequence, historically:** the riscv64 CI addition (PR #1337) was accepted with only a minor requested change (real-name commit authorship) and one substantive technical question from the maintainer (endianness coverage), which was resolved by a same-day follow-up PR (#1339) adding s390x. Both merged cleanly with all CI checks passing and no reported test failures in either PR thread. This is direct precedent that low-maintenance-overhead CI expansions (QEMU-emulated, GitHub-hosted-runner-based, no external infrastructure dependency) are readily accepted by this maintainer.

**Technical blockers:** none. The library is pure C99 and compiles and passes its test suite on riscv64 without modification, both under CI emulation and via native Debian/Ubuntu buildd infrastructure.

**Organizational blockers:** no corporate maintainer or foundation to engage beyond Sebastian Pipping directly. No RISE relationship currently exists as a pathway; the two riscv64 CI PRs and the CHERI alignment fix were each contributed independently (darkavatar23 and Codasip respectively), with no RISE involvement in either.

**Outstanding gap:** the only remaining distinction from amd64/native-arm64 CI is that riscv64 execution is QEMU-emulated on an x86_64 host rather than native hardware. Closing this gap (e.g., via a native riscv64 GitHub Actions runner) is a CI-infrastructure change, not a code or acceptance-risk change, and fits the precedent this maintainer has already shown for accepting low-overhead CI improvements.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro
- **Justification:** Upstream CI (`.github/workflows/qemu.yml`, added by merged [PR #1337](https://github.com/libexpat/libexpat/pull/1337) and extended by merged [PR #1339](https://github.com/libexpat/libexpat/pull/1339)) both builds expat and executes its full test suite (`make test run-xmltest`) on riscv64 under QEMU emulation on every push and PR, but libexpat's [GitHub Releases](https://github.com/libexpat/libexpat/releases) ship source tarballs only for every architecture, with no riscv64 (or any-architecture) binary published upstream. riscv64 binaries reach users only via downstream distro packaging (Debian trixie/sid `libexpat1-dev` 2.8.3-1; Ubuntu 26.04 resolute `libexpat1` 2.7.4-1, in the ports component), so build=yes/test=yes/release=no places expat at blue with release_provider=distro rather than upstream.
- **Pending work that could change the grade:** none open. The riscv64 (and s390x) CI additions (PR #1337, PR #1339) are already merged and shipped in release 2.8.4. No RISC-V tracking issue exists in libexpat/libexpat, and no RISE involvement with expat was found in RISE's blog, wheel builder, or member/working-group listings. The grade would move to green only if upstream began publishing riscv64 release binaries directly (or a general policy of publishing binaries for any Unix architecture, which does not currently exist for any architecture).

expat is not an optimization-purpose project: it has no SIMD, JIT, or intrinsics path on any architecture, so an optimization-level rating does not apply.

## 14. Investment Analysis

RISE has no prior or current investment in expat; no work targeting this project is already funded or covered elsewhere.

### 14.1 Functional Enablement

No functional enablement work is required. Expat builds and passes its test suite on riscv64 today, both via upstream QEMU-emulated CI and via native downstream distro buildd infrastructure (Debian). All functionality is present with zero architecture-gated features.

### 14.2 Performance Optimization

No architecture has a SIMD-optimized path; expat is a scalar C parser everywhere. No benchmark data exists (upstream, Phoronix, academic, or RISE's own optimization guide) establishing whether riscv64 XML-parsing throughput is a practical bottleneck for any real workload. Before committing to a SIMD/RVV tokenizer, a benchmark pass is a prerequisite to establish whether a gap actually exists in practice; absent that, this is not an actionable investment.

### 14.3 CI/CD Infrastructure

The remaining infrastructure gap is emulated-versus-native riscv64 execution. A native riscv64 GitHub Actions runner (self-hosted or RISE-provided) submitted as a follow-up to the existing `qemu.yml` matrix would close this gap; precedent from PR #1337/#1339's fast, low-friction acceptance suggests high upstream acceptance probability for this kind of change specifically, provided it imposes no new maintenance burden on the sole maintainer.

### 14.4 Ecosystem Enablement

Not applicable. Expat is a standalone C library with no dependent package ecosystem of its own requiring separate riscv64 enablement (see Section 10 omission rationale below).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add a native riscv64 GitHub Actions runner as a follow-up to the existing QEMU-emulated `qemu.yml` matrix, upstreamed as a PR | 1 | RISE / Qualcomm contributor | Low |
| CI/CD | Operate and maintain the native riscv64 CI runner, if added | 0.1/month ongoing | RISE infrastructure team | Low |
| Performance | Benchmark expat XML parsing throughput on riscv64 vs. amd64 and arm64 to establish whether a real-world bottleneck exists | 1 | RISE / Qualcomm performance team | Low |
| Performance | RVV-accelerated XML tokenizer (contingent on benchmark results showing a real bottleneck, and on maintainer willingness given the conservative contribution policy) | 8-12 | External contributor with upstream negotiation | Low |

Given blue status with all build/test work already merged upstream and shipping, no functional or CI work is time-critical; remaining items are low-priority polish (native versus emulated CI) or contingent on data not yet collected (performance).

## 15. References

- [libexpat/libexpat repository](https://github.com/libexpat/libexpat)
- [expat homepage](https://libexpat.github.io/)
- [PR #1337, Make CI cover compilation and execution on riscv64](https://github.com/libexpat/libexpat/pull/1337)
- [PR #1339, Cover s390x in addition to riscv64, and rename the workflow to qemu.yml](https://github.com/libexpat/libexpat/pull/1339)
- [PR #1082, Bump vmactions/freebsd-vm 1.2.5 to 1.2.6 (incidental riscv64 mention)](https://github.com/libexpat/libexpat/pull/1082)
- [PR #1348, Bump vmactions/freebsd-vm 1.5.3 to 1.5.5 (incidental riscv64 mention)](https://github.com/libexpat/libexpat/pull/1348)
- [PR #1385, Bump vmactions/freebsd-vm 1.5.5 to 1.5.6 (incidental riscv64 mention)](https://github.com/libexpat/libexpat/pull/1385)
- [Commit 823b490, lib: Do not assume long long has the strictest member alignment](https://github.com/libexpat/libexpat/commit/823b490de425109175b1ef5232416cc00944371a)
- [Issue #1046, Bad memory alignment on 32 bit architectures](https://github.com/libexpat/libexpat/issues/1046)
- [.github/workflows/qemu.yml (raw)](https://raw.githubusercontent.com/libexpat/libexpat/master/.github/workflows/qemu.yml)
- [GitHub releases, libexpat/libexpat](https://github.com/libexpat/libexpat/releases)
- [Debian trixie package page, libexpat1-dev](https://packages.debian.org/trixie/libexpat1-dev)
- [Ubuntu package search, expat, resolute suite](https://packages.ubuntu.com/search?keywords=expat&suite=resolute&searchon=names&section=all)
- [Launchpad, libexpat1 in Ubuntu resolute riscv64](https://launchpad.net/ubuntu/resolute/riscv64/libexpat1)
- [PyPI, expat package (unrelated to libexpat)](https://pypi.org/project/expat/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE members page](https://riseproject.dev/members/)
- [RISE Software Optimization Guide](https://riscv-optimization-guide.riseproject.dev/)
- [glibc project report](project-reports/glibc.md)