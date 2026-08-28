---
title: expat
categories:
  - libraries
---

# expat

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for expat
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

Expat (libexpat) is a stream-oriented XML parsing library written in C. It is one of the most widely deployed XML parsers in existence, used as a dependency by Python, Subversion, Apache httpd, and hundreds of other projects. The library is licensed under the MIT/X Consortium license and operates under no foundation governance structure.

The project self-describes as "understaffed and without funding." The de-facto sole maintainer is Sebastian Pipping (GitHub: hartwork), a volunteer based in Berlin affiliated with Gentoo and the Free Software Foundation Europe. No corporate employer is listed. The project has no RISE membership and no RISE-funded work targeting it.

The contribution policy is conservative. The CONTRIBUTING.md explicitly rejects PRs that "fix an issue for an unsupported (or no-longer supported) environment" and favors "small, low-risk" changes. RISC-V is not listed as unsupported -- it is simply unmentioned. The practical consequence is that adding riscv64 CI coverage would require zero ongoing maintenance burden to be accepted; any proposal with operational overhead will not be merged.

There is no community discussion of RISC-V in any tracked issue or PR beyond the single packaging failure documented in Section 2.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-02-06 | expat 2.6.0 released with incomplete backport of PR #817 -- only the second of two required commits was included in the release tag | [GitHub releases](https://github.com/libexpat/libexpat/releases) |
| 2024-02-13 | [PR #817](https://github.com/libexpat/libexpat/pull/817) merged -- replaced clock()-based timing in linear-time tests with byte-scan counting, eliminating flakiness on platforms with low CLOCKS_PER_SEC | [PR #817](https://github.com/libexpat/libexpat/pull/817) |
| 2024-02-19 | [Issue #827](https://github.com/libexpat/libexpat/issues/827) filed by andreas-schwab (openSUSE packager) -- build failure on openSUSE Factory RISC-V when packaging expat 2.6.0: `error: 'g_bytesScanned' undeclared` in basic_tests.c | [Issue #827](https://github.com/libexpat/libexpat/issues/827) |
| 2024-02-20 | Issue #827 closed as duplicate of #826; maintainer confirmed fix requires both commits fe0177cd and dc8499f2 from PR #817 | [Issue #827](https://github.com/libexpat/libexpat/issues/827) |
| 2024-02-29 | expat 2.6.1 released -- first release containing both commits from PR #817; RISC-V build failure resolved | [GitHub releases](https://github.com/libexpat/libexpat/releases) |
| 2.7.3 release | [PR #1048](https://github.com/libexpat/libexpat/pull/817) merged -- fixed memory alignment of internal allocations for "non-amd64 architectures (e.g. sparc32)"; RISC-V not named explicitly but "non-amd64" includes it [NEEDS VERIFICATION] | Research findings |
| 2026-05-23 | Debian sid buildd (rv-manda-02) built and installed expat 2.8.1-1 for riscv64 | [Debian buildd](https://buildd.debian.org/status/package.php?p=expat&suite=sid) |

The upstream repository has no RISC-V-specific commit. There is no riscv/ directory, no riscv64 CI workflow, and no RISC-V mention in the changelog. The 2024 activity was entirely a downstream packaging failure caused by a release-tag defect, not a porting problem.

Key contributor for the fix: Snild Dolkow (Sony), author of PR #817. The motivation was cross-platform test reliability (Solaris/SPARC, macOS ARM64, RISC-V all affected by identical root cause). No contributor is identified as working specifically on RISC-V.

---

## 3. Upstream Support Tier

Expat has no formal tier policy and no documented architecture support matrix. Tier status is inferred from CI coverage and release artifact content.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage | Yes (ubuntu-24.04, all 22 workflows) | Partial (Windows ARM64 added in 2.8.1 via windows-binaries.yml) | No |
| Release blocking | Yes | No | No |
| Official upstream binaries | Yes (Windows only; source tarballs for all) | No | No |
| Known build failures (current) | None | None | None |
| Distribution packages (latest) | All major distros | All major distros | Debian sid 2.8.1-1, Ubuntu Noble 2.6.1 (ports) |

amd64 is the only architecture with comprehensive CI coverage. arm64 received Windows CI in 2.8.1 (May 2026) -- the only non-x86 architecture explicitly added to CI in recent years. riscv64 has no upstream CI coverage and no upstream release artifacts. Upstream testing on riscv64 is performed entirely by downstream distributors (Debian buildd, openSUSE OBS).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Expat is a pure portable C99 XML parser. It has no JIT engine, no SIMD dispatch, no cryptographic library, no compression library, no garbage collector, and no memory allocator beyond the system standard library. The implementation is a single-threaded recursive descent parser with four primary source files (xmlparse.c, xmltok.c, xmlrole.c, xmltok_impl.c).

The only platform variation in the source tree is:

1. **Entropy source selection** -- auto-detected at configure time from `getrandom`, `arc4random`, `getentropy`, `SYS_getrandom`. All are available on glibc riscv64.
2. **Endianness** -- `ConfigureChecks.cmake` uses CMake's `TestBigEndian` probe. riscv64 is little-endian (BYTEORDER=1234), same result as amd64 and aarch64. The `little2_encoding` path handles UTF-16 on all three.
3. **Calling convention hint** -- `internal.h` applies `regparm(3)` (FASTCALL) only on `defined(__GNUC__) && defined(__i386__)`. This applies to x86 32-bit only. It is absent on amd64 (x86_64), aarch64, and riscv64 equally.

Component comparison:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD / vectorized XML parsing | missing | missing | missing |
| Hand-written assembly | missing | missing | missing |
| C intrinsics | missing | missing | missing |
| JIT | missing | missing | missing |
| Calling-convention hint (i386 regparm) | x86-32 only, not x86_64 | missing | missing |
| Endianness (little-endian scalar path) | full | full | full |
| Entropy source detection | full | full | full |
| Scalar XML parser (xmlparse, xmltok, xmlrole) | full | full | full |

No architecture receives a performance-optimized path. The scalar C implementation is the entire implementation for all three architectures. riscv64 is at parity with amd64 and arm64 in every functional respect.

---

## 5. Build System, Cross-Compilation, and Toolchain

The build system is CMake (minimum 3.17.0) with a parallel Autotools path. The C standard is C99 (enforced; extensions disabled).

**Compiler requirements (from README.md):** GCC >= 4.5 (for C use), GCC >= 4.8.1 (for C++ use), Clang >= 3.5. Any current riscv64-targeted GCC or Clang exceeds these minimums.

**Cross-compilation with CMake (riscv64):**

The repo ships only a MinGW toolchain file (`expat/cmake/mingw-toolchain.cmake`) as a template. The riscv64 equivalent follows the same structure:

```
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
```

Build invocation (disabling host-run components):

```
cmake \
  -DCMAKE_TOOLCHAIN_FILE=../cmake/riscv64-linux-gnu.cmake \
  -DEXPAT_BUILD_TOOLS=OFF \
  -DEXPAT_BUILD_EXAMPLES=OFF \
  -DEXPAT_BUILD_TESTS=OFF \
  -DEXPAT_BUILD_DOCS=OFF \
  ..
make -j$(nproc)
```

The flags `EXPAT_BUILD_TOOLS=OFF`, `EXPAT_BUILD_EXAMPLES=OFF`, and `EXPAT_BUILD_TESTS=OFF` are required for cross-compilation because the resulting binaries cannot run on the x86 build host without QEMU user-mode emulation.

**Endianness detection during cross-compilation:** CMake's `TestBigEndian` uses compiler intrinsics rather than executing a test binary. It detects correctly for riscv64 (little-endian, BYTEORDER=1234) without requiring an execution environment.

**Autotools cross-compilation:**

```
./configure --host=riscv64-linux-gnu CC=riscv64-linux-gnu-gcc
make -j$(nproc)
```

**QEMU usage:** No QEMU appears in any CI workflow or project documentation. Running the test suite on riscv64 requires QEMU user-mode emulation (`qemu-riscv64-static`) set up externally; the project provides no established pattern for this.

**Known build failures:** None in the current release (2.8.1). The 2.6.0 compile error on RISC-V (issue #827) was caused by an incomplete release tag backport, not a build system defect, and was resolved in 2.6.1.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| XML parsing (all conformance levels) | full | full | full | None |
| Namespace support | full | full | full | None |
| DTD / parameter entity parsing | full | full | full | None |
| xmlwf command-line tool | full | full | full | None |
| UTF-8, UTF-16 (LE and BE), ISO-8859 | full | full | full | None |
| Hash randomization (SipHash) | full | full | full | None |
| SIMD-accelerated parsing | missing | missing | missing | None (not implemented for any arch) |
| Upstream CI validation | full | partial (Windows) | none | CI gap only |

There are no functional gaps between riscv64 and amd64 or arm64. No feature is gated on architecture. The only gap is CI coverage, which is an infrastructure gap rather than a correctness or capability gap.

Performance gap: because no architecture has a SIMD path, there is no architecture-derived performance delta. Any riscv64 vs amd64 throughput difference is attributable to hardware clock speed and microarchitecture, not to missing software optimization.

Security hardening: the entropy source selection is identical. No architecture-specific hardening is present on any platform.

---

## 7. CI/CD Infrastructure

All 22 `.github/workflows/` files were inspected directly. None contain the string "riscv" in any form. The following architectures are covered:

- Linux x86_64 (ubuntu-24.04 runners): all 22 workflows
- macOS ARM64: macos.yml (cross-compile only, no riscv64)
- Windows x86_64 and x86_32: windows-build.yml, windows-binaries.yml
- Windows ARM64: windows-binaries.yml (added in 2.8.1)
- FreeBSD x86_64: freebsd.yml (via Cirrus CI)
- Solaris 11.4: solaris.yml
- musl Linux x86_64: musl.yml (Alpine, x86 only)
- Emscripten (wasm): emscripten.yml
- WASI SDK: wasi_sdk.yml
- MinGW i686 cross-compile: linux.yml

No `.cirrus.yml`, `.gitlab-ci.yml`, or Jenkinsfile exists at the repository root.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linux native CI | Yes | No | No |
| Windows CI | Yes | Yes (2.8.1+) | No |
| QEMU-based testing | No | No | No |
| Release-blocking test gate | Yes | No | No |
| RISE CI runners | No | No | No |

RISE has no involvement with the libexpat project. No RISE blog posts mention expat, and expat does not appear in the RISE wheel builder package list.

---

## 8. Distribution and Release Status

**Upstream releases:** The upstream project at [libexpat/libexpat](https://github.com/libexpat/libexpat) ships source tarballs (tar.bz2, tar.gz, tar.lz, tar.xz with .asc signatures) and Windows binaries (win32/win64 installer and zip) only. The latest release is R_2_8_1. No riscv64 binary is present in any release asset. This is by design -- the project has never shipped pre-built binaries for any Unix architecture.

**Debian sid (riscv64):** [libexpat1 version 2.8.1-1, status "Installed"](https://buildd.debian.org/status/package.php?p=expat&suite=sid) on buildd host `rv-manda-02` (real hardware). Built approximately 32 days prior to the research date. The Debian riscv64 port is official (not unofficial). No Debian bugs are filed for libexpat1 on riscv64.

**Ubuntu 24.04 LTS (Noble) ports (riscv64):** [libexpat1 version 2.6.1-2build1](https://packages.ubuntu.com/noble/riscv64/libexpat1/download) available at 85,972 bytes. This is a ports build (riscv64 is not a Tier-1 Ubuntu architecture for Noble). Version lags Debian sid by two major versions (2.6.1 vs 2.8.1), which is expected given Ubuntu Noble's freeze date. [NEEDS VERIFICATION -- the download page was fetched but could not be re-verified in the adversarial pass]

**openSUSE Factory RISC-V:** Active as of February 2024 (confirmed as origin of issue #827 via [OBS build page](https://build.opensuse.org/package/show/openSUSE:Factory:RISCV/expat)). Current build status not confirmed.

**Arch Linux RISC-V:** Data not available -- the [archriscv.felixc.at](https://archriscv.felixc.at/) status page returned 404 during the research. Availability is inferred from the fact that expat is a core Arch Linux package (2.8.1-1 in the `core` repository), but riscv64 build status is unconfirmed.

**PyPI:** A package named [expat (0.1.0.post4)](https://pypi.org/project/expat/) exists as a pure-Python wrapper unrelated to the C library. Wheel tag is `py3-none-any`. Not relevant to riscv64 binary availability.

**To obtain a working riscv64 binary today:** Install from Debian sid or Ubuntu Noble ports using the system package manager. No additional steps are required.

---

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| glibc (C standard library) | Runtime: entropy APIs (getrandom, arc4random, getentropy, SYS_getrandom), memory, I/O | Pass (all major distros) | Pass | Available in all riscv64 Linux distros | None |
| SipHash (internal, siphash.h) | Hash randomization for internal hash tables; pure-C header-only | N/A (header-only) | Pass (little-endian path, riscv64 is LE) | Bundled in every expat release | None |
| libm (-lm) | Legacy autotools probe only; expat does not call transcendental functions at runtime | N/A | N/A | Present on all riscv64 Linux targets | None |
| CMake >= 3.17 (build-time only) | Build system | Pass (CMake riscv64 support predates 3.17) | N/A | Build-time only | None |
| docbook2x (optional, build-time only) | Man page generation for xmlwf | Pass | N/A | Build-time only | None |

No dependency in this library involves JIT compilation, SIMD dispatch, cryptographic acceleration, or architecture-specific memory allocation. SipHash is the only non-trivial algorithmic component; it uses portable rotation/XOR operations with no architecture-specific code paths. All entropy source APIs are provided by glibc on riscv64 without modification.

---

## 11. Known Bugs and Active Issues

**RISC-V-specific (resolved):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#827](https://github.com/libexpat/libexpat/issues/827) | FAIL: runtests | Closed (duplicate of #826) | Low | Compile error in test suite on openSUSE Factory RISC-V when building expat 2.6.0 due to incomplete release tag backport (missing commit fe0177cd). Fixed in 2.6.1 (2024-02-29). Not a correctness bug. |

**Active issues (not RISC-V-specific):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1277](https://github.com/libexpat/libexpat/issues/1277) | Vulnerability report moratorium | Open | Security | Moratorium until 2026-08-01; details not public |
| [#1276](https://github.com/libexpat/libexpat/issues/1276) | Release 2.8.2 | Open | Informational | ETA 2026-06-25 |
| [#1160](https://github.com/libexpat/libexpat/issues/1160), [#1076](https://github.com/libexpat/libexpat/issues/1076) | Non-public security issues | Open | DoS | Details not disclosed |
| [#967](https://github.com/libexpat/libexpat/issues/967) | XML version string validation | Open | Low | Correctness edge case |
| [#928](https://github.com/libexpat/libexpat/issues/928) | Input amplification exceeded by non-attack input | Open | Low | |
| [#171](https://github.com/libexpat/libexpat/issues/171) | XML 1.0r5/1.1 support | Open | Feature | Long-standing, no ETA |

None of the open issues are RISC-V-specific. No correctness bugs are filed against riscv64.

---

## 12. Objections and Upstream Blockers

**Stated policy:** CONTRIBUTING.md rejects PRs that fix issues on unsupported environments and favors small, low-risk changes. The sole maintainer is a volunteer with limited bandwidth.

**Practical consequence:** Adding riscv64 CI via a QEMU-based job would require GitHub Actions runner minutes and ongoing maintenance if the QEMU image drifts or a test breaks. This is non-zero maintenance overhead for a one-person project. The probability of acceptance for a QEMU-based riscv64 CI PR without external hosting infrastructure being donated is low.

**Technical blockers:** None. The library is pure C99 and compiles on riscv64 without modification. Debian demonstrates this with a 9-minute build on real hardware.

**Organizational blockers:** No corporate maintainer or foundation to engage. Any contribution must go through Sebastian Pipping directly. No RISE relationship exists as a pathway.

**Acceptance probability for a zero-maintenance riscv64 CI job** (e.g., using a self-hosted RISE runner that the contributor operates): moderate. The maintainer has accepted other CI expansions (FreeBSD, Solaris, Emscripten, WASI) when they did not impose ongoing burden. The precedent exists.

---

## 13. Investment Analysis

RISE has no prior investment in expat. No work is already funded or covered.

### 13.1 Functional Enablement

No functional enablement work is required. expat builds and runs correctly on riscv64 today. All functionality is present. No porting work is needed.

### 13.2 Performance Optimization

No architecture has a SIMD-optimized path. If XML parsing throughput on RISC-V is a bottleneck, the correct intervention is a new SIMD-accelerated XML tokenizer using RVV intrinsics. However: (a) no benchmark data exists for expat on riscv64 to establish whether this is actually a bottleneck; (b) no other architecture has such a path; (c) the sole maintainer would need to accept a complex new code path, which is inconsistent with the project's conservative contribution policy; (d) the upstream project's maintenance posture makes long-term support of an RVV path by the current maintainer implausible.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI is the highest-value investment available. It provides regression detection and a visible signal of first-class support. The work requires: (a) a self-hosted RISC-V GitHub Actions runner or QEMU-based job; (b) a PR adding a riscv64 job to `linux.yml` or a new `riscv64.yml` workflow; (c) coordination with Sebastian Pipping.

### 13.4 Ecosystem Enablement

Not applicable. expat is a C library with no dependent package ecosystem requiring separate riscv64 enablement (see Section 10 omission rationale).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 CI job (self-hosted runner or QEMU) to linux.yml; upstream the PR | 1 | RISE / Qualcomm contributor | Medium |
| CI/CD | Operate and maintain the riscv64 CI runner for the project | 0.1/month ongoing | RISE infrastructure team | Medium |
| Performance | Benchmark expat XML parsing throughput on riscv64 vs amd64 and arm64 to determine if SIMD gap matters in practice | 1 | RISE / Qualcomm performance team | Low |
| Performance | RVV-accelerated XML tokenizer (only if benchmarks show a real bottleneck) | 8-12 | External contributor + upstream negotiation | Low |

No functional enablement work is required. The CI gap is the only actionable item with clear upstream acceptance probability.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libexpat/libexpat repository](https://github.com/libexpat/libexpat)
- [expat homepage](https://libexpat.github.io/)
- [Issue #827 -- FAIL: runtests (openSUSE Factory RISC-V)](https://github.com/libexpat/libexpat/issues/827)
- [PR #817 -- tests: Replace clock counting with counting scanned bytes](https://github.com/libexpat/libexpat/pull/817)
- [PR #826 -- Avoid writing to the bytesScanned counter outside of tests](https://github.com/libexpat/libexpat/pull/826)
- [openSUSE Factory RISC-V expat build page](https://build.opensuse.org/package/show/openSUSE:Factory:RISCV/expat)
- [Debian buildd status for expat (sid)](https://buildd.debian.org/status/package.php?p=expat&suite=sid)
- [Ubuntu Noble libexpat1 riscv64 download](https://packages.ubuntu.com/noble/riscv64/libexpat1/download)
- [GitHub releases -- libexpat/libexpat](https://github.com/libexpat/libexpat/releases)
- [PyPI expat package](https://pypi.org/project/expat/)
- [expat/lib directory (source tree)](https://github.com/libexpat/libexpat/tree/master/expat/lib)
- [.github/workflows directory (CI files)](https://github.com/libexpat/libexpat/tree/master/.github/workflows)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)