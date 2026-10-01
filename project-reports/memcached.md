---
title: Memcached
parent: Project Reports
color: yellow
dependencies:
  - name: libevent
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: Cyrus SASL
    relation: runtime-dependency
    criticality: optional
  - name: libseccomp
    relation: runtime-dependency
    criticality: optional
  - name: Lua
    relation: runtime-dependency
    criticality: optional
  - name: liburing
    relation: runtime-dependency
    criticality: optional
  - name: mcmc
    relation: runtime-dependency
    criticality: optional
  - name: xxHash
    relation: runtime-dependency
    criticality: optional
  - name: autoconf
    relation: build-dependency
    criticality: critical
  - name: automake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: Perl
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="memcached" %}

# Memcached

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Memcached<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Memcached is a general-purpose, high-performance, distributed in-memory key-value cache server written in portable C. It is used as a session store and database query cache by large-scale web deployments. Distro packaging observed during this review (Ubuntu 26.04 "resolute," Arch Linux RISC-V) places the current shipping line at 1.6.40-1.6.45; HEAD of the `master` branch at review time was commit [`2d51e364799bc9698bd4b11728ea978cea12da6e`](https://github.com/memcached/memcached).

**License:** 3-clause BSD-style license, copyright 2003 Danga Interactive, Inc. (confirmed via the repository's `LICENSE`/`COPYING` file).

**Governance:** Informal, BDFL-style, centered on Alan "dormando" Kasindorf. Of roughly 2,360 commits in the full repository history, dormando authored approximately 1,180 (about 50%), and the most recent 30+ commits through July 2026 are all his. There is no written governance charter, no MAINTAINERS/OWNERS/CODEOWNERS file, and no formal RFC or PR-review-board process; `CONTRIBUTING.md` only points to a wiki page and asks users to run and report back on releases. Memcached is not affiliated with any foundation (not Linux Foundation, Apache, CNCF, or RISE).

**Corporate history and sponsors:** Brad Fitzpatrick (Danga Interactive/LiveJournal, 164 commits) created the project. Trond Norbye (Sun Microsystems), Steven Grimm (Facebook), Tharanga Gamaethige (Netflix), Fei Hu (Stripe), Igor Bujna (Oracle), Paul Lindner (hi5), and David Carlier (independent) are the other historically significant contributors by commit count. Netflix is listed as a homepage sponsor on [memcached.org](https://memcached.org/), and Cache Forge is listed as a commercial-support provider. No single corporation funds a maintainer team; contributions are individual, drive-by patches from engineers at companies using memcached in production.

**Culture on new ports:** There is no `PLATFORMS.md`, `SUPPORT.md`, or formal platform-tier policy. Portability relies entirely on generic GNU Autotools (`configure.ac`) rather than a maintained list of first/second-class architectures. The project's historical pattern (the 2019 cross-compilation fix, the 2020 aarch64 hardware-CRC patch) is to accept architecture-portability patches when an outside contributor does the work and testing, but the maintainer does not proactively initiate port work himself. On RISC-V specifically, dormando's public stance is positive but reactive: he confirmed in July 2025, after acquiring a HiFive Unmatched board, that "memcached does build and run just fine" on riscv64 ([Issue #1111](https://github.com/memcached/memcached/issues/1111)), but a community request for upstream RISC-V CI opened in February 2024 sat without a merged CI change for over a year and a half.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2019-10-05 | bkuhls files [Issue #550](https://github.com/memcached/memcached/issues/550): cross-compilation broken, `configure: error: cannot run test program while cross compiling` | [Issue #550](https://github.com/memcached/memcached/issues/550) |
| 2019-10-07 | Ola Jeppsson (olajep) opens [PR #552](https://github.com/memcached/memcached/pull/552), replacing `AC_RUN_IFELSE` autoconf checks with cross-compile-safe fallbacks (`AC_CHECK_SIZEOF`, `AC_C_BIGENDIAN`); explicitly validated against the `riscv64-unknown-linux-gnu` cross-compiler | [PR #552](https://github.com/memcached/memcached/pull/552) |
| 2019-10-17 | dormando commits the patch content directly to master as [`be0804cf3855cf968b3c6c0cc6e1f4b0724205a7`](https://github.com/memcached/memcached/commit/be0804cf3855cf968b3c6c0cc6e1f4b0724205a7) | commit be0804c |
| 2019-11-11 | [PR #552](https://github.com/memcached/memcached/pull/552) closed; fix ships in release 1.5.20 | GitHub PR API, tag ancestry check |
| 2021-09-03 | mkszuba files [Issue #816](https://github.com/memcached/memcached/issues/816): chunked-extstore tests 124/178/232 return empty records on a BeagleV Starlight (rv64gc, Gentoo, memcached 1.6.10) | [Issue #816](https://github.com/memcached/memcached/issues/816) |
| 2022-10-30 | alexfanqi reports no reproduction on QEMU user-mode or SiFive Unmatched with memcached 1.6.16/1.6.17 | [Issue #816](https://github.com/memcached/memcached/issues/816) |
| 2024-02-26 | alitariq4589 files [Issue #1111](https://github.com/memcached/memcached/issues/1111) requesting upstream riscv64 CI via the Cloud-V platform; dormando states he has purchased a RISC-V board | [Issue #1111](https://github.com/memcached/memcached/issues/1111) |
| 2025-02-19 to 2025-07-29 | dormando searches for HiFive Unmatched parts, then confirms the board is running and "does build and run just fine" on riscv64; states plans to add it to his own in-house CI | [Issue #1111](https://github.com/memcached/memcached/issues/1111) |
| 2025-08-05 | [Issue #816](https://github.com/memcached/memcached/issues/816) closed by dormando as fixed in recent releases | [Issue #816](https://github.com/memcached/memcached/issues/816) |
| 2025-08-06 | Last activity on [Issue #1111](https://github.com/memcached/memcached/issues/1111); issue remains open, no CI PR filed | [Issue #1111](https://github.com/memcached/memcached/issues/1111) |
| (release notes) | Memcached 1.6.39 wiki release notes state: "our in-house CI supports riscv64 and all known tests pass" | [ReleaseNotes1639 wiki](https://github.com/memcached/memcached/wiki/ReleaseNotes1639) |

**Key contributors with context:**

| Contributor | Context | Contribution |
|---|---|---|
| olajep | External contributor | PR #552 / commit be0804c: cross-compilation fix validated against riscv64-unknown-linux-gnu |
| mkszuba | Individual (Gentoo) | Issue #816: initial RISC-V extstore bug report, offered temporary hardware access |
| ArchFeh / alexfanqi | Individual contributors | Issue #816: reproduced and later confirmed fixed on real hardware (BeagleV Starlight, SiFive Unmatched) |
| alitariq4589 | Non-maintainer (author association "NONE"), Cloud-V / RISC-V Labs | Issue #1111: repeated offers of free RISC-V CI access (Cloud-V), never accepted into the public workflow |
| dormando | Maintainer | Acquired personal RISC-V hardware (SiFive HiFive Unmatched), confirmed functional correctness, plans in-house (non-public) CI |

**Upstreaming status:** The cross-compilation fix shipped in 1.5.20 via a direct commit rather than a GitHub-merged PR (GitHub's own API records `"merged": false, "merged_at": null"` for PR #552, with the `merge_commit_sha` field pointing to a non-ancestor synthetic test-merge commit; the real fix, commit be0804c, is confirmed by `git merge-base --is-ancestor` to be present in `master` and in the 1.5.20 tag but absent from 1.5.19). The extstore correctness bug (#816) is closed and fixed. No dedicated RISC-V code path has ever been added to the project because none is required for correctness; the codebase is portable C by design. The project is functionally reported working on riscv64 by its sole maintainer, but that status rests on private, unverifiable infrastructure rather than anything checked into the public repository (see Section 7).

## 3. Upstream Support Tier

Memcached has no formal platform-tier policy, no `PLATFORMS.md`, and no `SUPPORT.md`. The CI configuration is a single ~20-line GitHub Actions workflow (`.github/workflows/ci.yml`) targeting `ubuntu-latest` (x86_64) only, confirmed by direct repository inspection (fresh clone, HEAD `2d51e364799bc9698bd4b11728ea978cea12da6e`) and by a repository-wide case-insensitive grep for "riscv," which returned zero matches anywhere in the tree.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream public CI | Yes (`ubuntu-latest`) | No | No |
| Release-blocking tests | Yes (public CI) | No | No (claimed in private maintainer CI only, unverifiable) |
| Official upstream binary | No (source-only; no GitHub Releases exist at all) | No | No |
| Distro binary available | Yes | Yes | Yes (Ubuntu 26.04 "resolute," Debian sid, Arch Linux RISC-V) |
| Maintainer confirmed working | Yes | Not stated | Yes, personally, on a HiFive Unmatched board ([Issue #1111](https://github.com/memcached/memcached/issues/1111), Jul 2025) |
| Hardware CRC32 acceleration | Yes (SSE4.2) | Yes (ARMv8 CRC extension) | No (software fallback) |

Effective tier: riscv64 is a community/distro-supported tier with no public upstream CI, no release-blocking riscv64 tests, and no official upstream binaries of any kind for any architecture (memcached ships source tarballs and git tags, not GitHub Releases). Distribution packages build and are functional.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Memcached has no JIT compiler, no garbage collector, no floating-point computation subsystem, and no general SIMD dispatch layer. A repository-wide search for architecture guards (`__riscv`, `__x86_64__`, `__aarch64__`, `__arm__`, intrinsics headers) found exactly one memcached-authored file with real per-architecture hand-written code paths: `crc32c.c`. `xxhash.h` is a vendored third-party header with its own independent SIMD autodetection, not memcached-authored arch code.

**`crc32c.c` structure (verified by direct source read):**

```c
#ifdef __x86_64__
   /* inline-asm crc32q/crc32b hardware CRC, SSE4.2 detected via cpuid */
#elif defined(__aarch64__) && (linux || apple)
   /* inline-asm crc32cx/crc32cb using ARMv8 CRC extension, HWCAP_CRC32/sysctl detected */
#else /* every other architecture, including riscv64 */
   void crc32c_init(void) { crc32c = crc32c_sw; }
#endif
```

riscv64 falls into the final `#else` branch along with ppc64, s390x, mips, and armv7, landing on `crc32c_sw`, a generic byte/8-byte-chunk table-driven software CRC32C. This fallback is fully correct and functional, not a stub or placeholder; it is the identical code path used by every non-x86_64/non-aarch64 target and is exercised by the normal test suite. It contains no reference anywhere to RISC-V's Zbc/Zbkc (carry-less multiply) or vector extensions. `configure.ac` confirms the asymmetry directly: there is an `ENABLE_ARM_CRC32` flag wiring the aarch64 hardware path and runtime SSE4.2 detection for x86_64, but no equivalent riscv64 flag or detection exists anywhere in `configure.ac`, `Makefile.am`, or the C sources.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CRC32C checksum (`crc32c.c`) | Full (hand-tuned inline-asm SSE4.2, runtime cpuid-detected) | Full (hand-tuned inline-asm ARMv8 CRC extension, runtime HWCAP-detected) | Scalar software fallback (correct, no Zbc/vector usage, unoptimized) |
| Hashing (jenkins_hash.c, murmur3_hash.c) | Scalar portable C | Scalar portable C | Scalar portable C (no ISA-specific code on any platform; "MurmurHash3_x86_32" denotes an output-size variant, not an x86 dependency) |
| xxHash (vendored `xxhash.h`) | Optional SSE2/AVX2 autovectorized paths (third-party, not memcached-authored) | NEON autovectorized paths (third-party) | Generic scalar fallback (third-party; no RISC-V vector path) |
| Seccomp sandbox (`linux_priv.c`) | Tested (README states x86-64 only) | Untested upstream | Untested upstream; libseccomp's own architecture-neutral API means no memcached-side syscall table is required |
| Everything else (slab/item/network/protocol/extstore/auth/logging) | Scalar, fully generic | Scalar | Scalar - architecture is irrelevant to correctness |

The repository contains zero `.S` assembly files and zero inline asm outside `crc32c.c`. Memcached is not an optimization-purpose project; its value proposition is correctness and scalability as a cache server, not CPU-bound numerical or SIMD throughput, so the one performance-sensitive path identified (CRC32C for the optional extstore feature) is the only architecture-dependent optimization surface in the project.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autotools only (`autogen.sh` + `configure.ac` + `Makefile.am`). Confirmed by direct repository inspection: there is no `CMakeLists.txt`, no `cmake/` directory, no Meson, and no toolchain files anywhere in the tree.

**Native build (from `README.md`, verbatim):**

```
./autogen.sh
./configure
make
make test
```

With optional features: `./configure --enable-tls`, `./configure --enable-sasl --enable-sasl-pwdb`, `./configure --enable-seccomp`, `./configure --enable-proxy` (requires running `cd vendor && ./fetch.sh` first to pull Lua and optionally liburing).

**Cross-compilation to riscv64:** No project-specific documentation exists anywhere in the repository (`README.md`, `doc/`, no `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exist). `configure.ac` uses standard `AC_CANONICAL_HOST` host-triplet detection, which is what makes the generic autotools cross-compilation pattern work:

```
./autogen.sh
./configure --host=riscv64-linux-gnu --build=x86_64-linux-gnu CC=riscv64-linux-gnu-gcc
make
```

The only riscv64-specific build-system change ever made is the one behind PR #552 / commit be0804c (2019): replacing `AC_RUN_IFELSE` calls (which require executing target code, impossible when cross-compiling) with `AC_CHECK_SIZEOF`, `AC_C_BIGENDIAN`, and `AS_IF`-based fallbacks that default to a cross-compile-safe assumption with a warning rather than hard-failing. Without this fix, memcached could not be cross-compiled for riscv64 at all.

**Minimum toolchain versions:** Not documented for any architecture. `configure.ac` targets a legacy Autoconf baseline (2003-era) and the source uses C99 features (`m4/c99-backport.m4` is present for pre-C99 compatibility). No GCC/Clang minimum version tied to riscv64 is stated anywhere.

**QEMU usage:** None. No QEMU-based emulation is referenced anywhere in the memcached repository.

**Known build failures:** None confirmed active at the current reviewed HEAD. The chunked-extstore test failures of Issue #816 were timing-sensitive test failures on slow physical hardware (BeagleV Starlight), not build failures, and were closed as resolved by 1.6.16/1.6.17 without an isolated fix commit ever being identified; the fix appears to have been an incidental side effect of other extstore work.

**Feature flags relevant to riscv64:**

| Flag | Notes |
|---|---|
| `--enable-seccomp` | README states tested on x86-64 only. libseccomp itself has shipped native riscv64 syscall-table support since a 2020 merge ([PR #197](https://github.com/seccomp/libseccomp/pull/197)); see Section 9. |
| `--enable-tls` | Architecture-neutral at the memcached level. Requires OpenSSL; see Section 9 for riscv64-specific OpenSSL caveats. |
| `--enable-sasl` / `--enable-sasl-pwdb` | Architecture-neutral. Requires libsasl2. |
| `--enable-proxy` | Requires vendoring Lua (and optionally liburing) via `vendor/fetch.sh`. Architecture-neutral. |
| `--enable-proxy-uring` | EXPERIMENTAL. Vendors liburing; see Section 9 for its riscv64 CI caveats. |
| `--enable-extstore` | Architecture-neutral; uses the software CRC32C fallback on riscv64. |

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core get/set/delete | Full | Full | Full |
| LRU eviction | Full | Full | Full |
| Extstore disk offload | Full | Full | Full (software CRC32C) |
| TLS termination | Full | Full | Full (subject to the OpenSSL AES caveat below) |
| SASL authentication | Full | Full | Full |
| Proxy subsystem (Lua) | Full | Full | Full |
| Seccomp sandbox | Full (tested) | Untested upstream | Untested upstream |
| io_uring proxy backend (EXPERIMENTAL) | Full | Full | Compiles (vendored source, and the system `liburing` package cross-compiles for riscv64 in its own upstream CI); never exercised under QEMU or on real hardware in any CI observed |

**Functional gaps:** None identified that are specific to riscv64 at the memcached source level. The codebase has no architecture-conditional feature code outside `crc32c.c`.

**Performance gaps:** CRC32C throughput on riscv64 uses the generic software fallback versus hand-tuned hardware paths on amd64 (SSE4.2) and arm64 (ARMv8 CRC extension). This affects only the optional extstore (disk-offload) code path; the primary in-memory caching path does not use CRC32C. No published benchmark quantifies the magnitude of this specific gap: data not available.

**Security hardening gaps:** The seccomp sandbox is explicitly documented as tested on x86-64 only and is untested upstream on riscv64; it is not enabled by default. For `--enable-tls` deployments, OpenSSL's AES implementation is not constant-time on riscv64 hardware lacking the Zkn/Zvkned vector-crypto extensions (OpenSSL fix PRs [#31080](https://github.com/openssl/openssl/pull/31080) and [#31082](https://github.com/openssl/openssl/pull/31082) are open and unmerged as of this review), which is a timing side-channel risk for TLS-enabled memcached deployments on baseline rv64gc hardware. Hardware implementing Zkn is unaffected.

**NaN / floating-point semantics issues:** None. Memcached performs no floating-point arithmetic in its core paths.

## 7. CI/CD Infrastructure

Full and current content of the sole CI file, `.github/workflows/ci.yml` (independently re-fetched twice during this review, both via `raw.githubusercontent.com` and via a fresh shallow clone, both landing on identical HEAD `2d51e364799bc9698bd4b11728ea978cea12da6e`):

```yaml
name: GitHub CI
on: [push, pull_request]
jobs:
  ubuntu-build-test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - name: Install deps
      run: |
        sudo apt-get update -y
        sudo apt-get install -y libevent-dev libseccomp-dev git libsasl2-dev libio-socket-ssl-perl
    - name: Build
      run: |
        gcc --version
        ./autogen.sh
        ./configure --enable-seccomp --enable-tls --enable-sasl --enable-sasl-pwdb
        make -j
    - name: Test
      run: PARALLEL=5 make test
```

This is a single job on a GitHub-hosted `ubuntu-latest` (x86_64) runner, with no matrix, no QEMU setup action, no riscv64 runner, no cross-compilation step, and no `workflow_dispatch` or `schedule` trigger. `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, and `azure-pipelines.yml` do not exist anywhere in the repository root. A repository-wide, case-insensitive grep for "riscv" across the entire tree returns zero matches, and GitHub's own code-search API (`riscv repo:memcached/memcached`) independently returns `total_count: 0`.

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Public CI job exists | Yes | No | No |
| Tests run on push/PR | Yes | No | No |
| QEMU-based cross-arch testing | No | No | No |
| Hardware-in-the-loop | No | No | Claimed, privately (not in any public repository file) |
| RISE CI runners used | No | No | No |
| Cloud-V integration | No | No | Offered repeatedly (Feb 2024-Jul 2025), never accepted |

**On the "in-house CI supports riscv64" claim:** Memcached's 1.6.39 wiki release notes state, "As a side note, our in-house CI supports riscv64 and all known tests pass" ([ReleaseNotes1639](https://github.com/memcached/memcached/wiki/ReleaseNotes1639)), and dormando states in [Issue #1111](https://github.com/memcached/memcached/issues/1111) that his personal HiFive Unmatched board "will be in my own CI shortly." Both are wiki/comment assertions about private, off-repository infrastructure, not files checked into the repository, and are not independently inspectable or reproducible by anyone outside the maintainer. No corresponding GitHub Actions job, Jenkinsfile, or any other in-repo CI configuration for riscv64 has ever been added. This status should be read as "maintainer-asserted, functionally plausible given manual testing history, but not verifiable from the public repository" rather than as confirmed CI coverage. [NEEDS VERIFICATION]

**RISE involvement:** None found. No RISE Project blog post (37 posts checked via the RISE sitemap, spanning May 2024-September 2026) mentions memcached. No RISE-affiliated GitHub repository, working group, or the RISE Python wheel builder (not applicable to a C daemon) references memcached. The only RISC-V-affiliated outreach found is from Cloud-V / RISC-V Labs (alitariq4589 in Issue #1111), which is a distinct, unaffiliated effort.

## 8. Distribution and Release Status

Memcached publishes no GitHub Releases of any kind for any architecture; the GitHub Releases page states "There aren't any releases here." The project ships via git tags and source tarballs on [memcached.org](https://memcached.org/), with distribution packaging as the sole path to a prebuilt riscv64 binary. There is no PyPI package (memcached is a C daemon, not a Python package; `pypi.org/pypi/memcached/json` returns HTTP 404) and no npm/Maven relevance.

**To obtain a working riscv64 binary, a user must either:**
1. Install the distribution package (Ubuntu, Debian, Arch Linux RISC-V), or
2. Cross-compile from source using the standard autotools pattern in Section 5.

**Distribution package status (directly verified by HTTP fetch during this review):**

| Distro | Package | riscv64 status | Version observed | Notes |
|---|---|---|---|---|
| Ubuntu 26.04 "resolute" | `memcached` | Available | 1.6.40-1 listed on packages.ubuntu.com; `.deb` artifacts confirmed on ports.ubuntu.com up to 1.6.45-1ubuntu1 (2026-08-14, 304K) | Listed architectures: amd64, arm64, armhf, ppc64el, riscv64, s390x; built from unmodified upstream source, no riscv64 patches |
| Debian sid | `memcached` | Installed/built | 1.6.42-1 | Builds on the Debian riscv64 porter buildd infrastructure |
| Arch Linux RISC-V | `memcached` | Available (`[extra]` repo) | 1.6.45-1 | Confirmed via direct fetch of `memcached-1.6.45-1-riscv64.pkg.tar.zst` (HTTP 200, `last-modified: 2026-09-04`, correct zstd content type and size) |

Companion packages confirmed riscv64-available on Ubuntu 26.04 "resolute": `libmemcached-dev`, `libmemcached-tools`, `libmemcached11t64`, `libmemcachedutil2t64`, `php-memcached`, `python3-binary-memcached`.

Qualification note: because memcached contains no architecture-specific code at all, Ubuntu 26.04 and Debian sid build and ship the `memcached` package for riscv64 from unmodified upstream source with no riscv64 patches required - this is the basis for the "clean-distro-build" grading exception discussed in Section 13.

## 9. Dependencies

| Dependency | Role | Relation / Criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| libevent | Core event loop; required for every build | Runtime, critical | Builds cleanly, zero arch-specific code; Ubuntu 26.04 `libevent-dev 2.1.12-stable-10build2`, riscv64 (ports archive) | No upstream riscv64 CI (0 references in any GitHub Actions workflow); Debian sid builds on a riscv64 buildd (build-only, no gated tests) | Distro-only (Debian sid, Ubuntu, Alpine, Gentoo ~riscv) | No open riscv64 issues found |
| OpenSSL | Optional TLS for client/server sockets and proxy TLS (`--enable-tls`, `--enable-proxy-tls`) | Runtime, optional | Builds; Ubuntu 26.04 `libssl-dev 3.5.5-1ubuntu3`, riscv64 (ports archive); includes RVV/Zkn/Zvk-accelerated crypto paths where present | CI is QEMU-only, no native riscv64 runner; SSL test suite reportedly hangs/fails at high parallelism ([openssl/openssl#22166](https://github.com/openssl/openssl/issues/22166), open since 2023) | Distro-only (Debian sid 3.6.3-1, Ubuntu resolute 3.5.5-1ubuntu3); no upstream binaries for any architecture | Critical open gap: AES T-table fallback is not constant-time without Zkn/Zvkned (fix PRs [#31080](https://github.com/openssl/openssl/pull/31080), [#31082](https://github.com/openssl/openssl/pull/31082), open/unmerged); also [#28118](https://github.com/openssl/openssl/issues/28118) (musl Zbb detection broken) and [#29357](https://github.com/openssl/openssl/issues/29357) (`no-deprecated` cross-compile failure, fix open) |
| Cyrus SASL | Optional SASL authentication (`--enable-sasl`, `--enable-sasl-pwdb`) | Runtime, optional | Ubuntu 26.04 `libsasl2-dev 2.1.28+dfsg1-9ubuntu3`, riscv64, in the main archive across the full architecture set | Data not available: no riscv64 CI information found for `cyrusimap/cyrus-sasl` | Ubuntu resolute confirmed | No open riscv64 issues found |
| libseccomp | Optional syscall sandboxing, Linux-only, marked EXPERIMENTAL (`--enable-seccomp`) | Runtime, optional | Ubuntu 26.04 `libseccomp2`/`libseccomp-dev 2.6.0-2ubuntu5`, riscv64 | No upstream riscv64 CI (ubuntu-24.04 x86_64 only, no QEMU); a downstream NixOS QEMU seccomp-emulation test failure ([NixOS/nixpkgs#301385](https://github.com/NixOS/nixpkgs/issues/301385)) is reported as stale/environment-specific, not an upstream libseccomp bug | Distro-only (Ubuntu, Debian trixie, Arch RISC-V) | Native riscv64 syscall-table support merged upstream via [PR #197](https://github.com/seccomp/libseccomp/pull/197) in 2020; separately, release-level riscv64 support is also cited as landing with v2.5.0 (2021) - the two dates reflect merge vs. shipped-release timing rather than a true conflict. [Issue #327](https://github.com/seccomp/libseccomp/issues/327) notes riscv32 (not riscv64) remains unsupported |
| Lua (vendored, plain Lua 5.x, not LuaJIT) | Optional proxy scripting engine (`--enable-proxy`) | Runtime, optional | Ubuntu 26.04 `lua5.4 5.4.8-1build1`, riscv64; vendored in-tree copy observed at 5.4.3 in prior review (stale vs. upstream 5.4.7) | Debian sid builds/installs on its riscv64 buildd; no riscv64-specific bugs found in the Lua 5.x tracker | Distro-only (Debian sid, Ubuntu) | None found. Memcached vendors plain Lua, not LuaJIT; LuaJIT's separate, more serious riscv64 port gap does not apply here |
| liburing (vendored under `vendor/liburing`) | Optional io_uring backend for the proxy, EXPERIMENTAL (`--enable-proxy-uring`) | Runtime, optional | Ubuntu 26.04 `liburing2`/`liburing-dev 2.14-1`, riscv64, confirmed as a genuine riscv64 ELF binary; upstream CI itself cross-compiles for riscv64 (`gcc-riscv64-linux-gnu` on an x86_64 runner) | Cross-compiled riscv64 binaries are never executed in upstream CI (no QEMU, no hardware runner) | Distro-only; upstream GitHub Releases are source-only | This review found 0 open riscv-related issues/PRs in `axboe/liburing`; a prior pass of this report had cited specific open issues ([#930](https://github.com/axboe/liburing/issues/930)/[#928](https://github.com/axboe/liburing/issues/928)/[#1601](https://github.com/axboe/liburing/issues/1601)) as closed/open respectively - treat the exact current issue state as [NEEDS VERIFICATION] given the discrepancy between passes. Memcached vendors liburing's source directly, so the real build target is the vendored copy compiling under a riscv64 toolchain, which is unaffected either way |
| mcmc (vendored under `vendor/mcmc`) | Memcached's own sibling C client library, used internally by the proxy to speak the memcached protocol to backend pools | Runtime, optional | Not independently packaged (vendored source only, no apt package); trivial portable C with no arch-specific code observed | Data not available: GitHub issue search against `memcached/mcmc` returned a 422 ("cannot be searched") rather than a result set | N/A (vendored, never released standalone) | No riscv64 evidence found either way |
| xxHash (vendored header, `xxhash.h`) | Proxy request hash routing | Runtime, optional | Architecture-neutral; falls through to its generic scalar implementation on riscv64 (its optional SSE2/AVX2/NEON autovectorized paths are third-party code, not memcached-authored, and have no RISC-V vector path) | N/A (header-only) | N/A (header-only) | No issues found |
| autoconf | Generates `configure` from `configure.ac` | Build, critical | Data not available: no riscv64-specific research was conducted on autoconf packaging; the fact that Debian/Ubuntu riscv64 buildds already produce the `memcached` packages in Section 8 using the standard GNU toolchain is indirect evidence it functions on riscv64, but this was not independently verified | Data not available | Distro-only (standard GNU toolchain component on every riscv64 Linux distro) | No riscv64-specific issues identified |
| automake | Generates `Makefile.in` from `Makefile.am` | Build, critical | Data not available, same basis as autoconf above | Data not available | Distro-only | No riscv64-specific issues identified |
| GCC | Default compiler; the public CI explicitly runs `gcc --version` before building | Build, critical | Data not available: no riscv64 GCC-specific research was conducted in this pass; CI itself only exercises GCC on x86_64 (`ubuntu-latest`), not riscv64 | Data not available | Distro-only (riscv64 GCC cross and native toolchains are standard Debian/Ubuntu/Arch packages, as implied by the riscv64 memcached packages in Section 8) | No riscv64-specific issues identified |
| Perl | Required to run the test suite (`make test`, `prove`); CI installs `libio-socket-ssl-perl` | Test, critical | N/A (interpreted, not compiled by memcached) | Data not available: no riscv64-specific Perl interpreter research was conducted; Debian/Ubuntu riscv64 ship a working Perl as a base-system package, which the successful riscv64 package builds in Section 8 implicitly depend on | Distro-only | No riscv64-specific issues identified |

**OpenSSL riscv64 deep-dive (TLS path):** OpenSSL is the dependency with the most material, currently open riscv64-specific risk. For memcached deployments that enable TLS (`--enable-tls`), hardware without the Zkn/Zvkned extensions will run a non-constant-time AES path, a timing side-channel risk; the relevant OpenSSL fix PRs are open and unmerged. This is not a blocker for non-TLS deployments, which constitute the majority of internal datacenter memcached usage.

Memcached has no significant dependent package ecosystem of its own (no language-level package manager distributes "memcached" as a library users install transitively; `libmemcached` client bindings exist across several languages but are themselves independent projects, not part of this review's dependency graph). Section 10 (Ecosystem Status) is accordingly omitted.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #1111](https://github.com/memcached/memcached/issues/1111) | RISC-V CI for memcached | Open since 2024-02-26, last activity 2025-08-06 | Low (process, not correctness) | No public CI added; maintainer confirms personal RISC-V hardware and plans private CI; Cloud-V's free CI offer remains unaccepted |
| [PR #1291](https://github.com/memcached/memcached/pull/1291) | Fix unaligned memory access (titled around SPARC traps) | Open | Medium | Fixes unaligned-access bugs in MurmurHash3's `getblock32`, the `ITEM_suffix()`/`FLAGS_CONV` cast, and logger payload alignment, gated on a `NEED_ALIGN`-style preprocessor path. Not framed as a RISC-V fix, but would affect riscv64 toolchains/configurations that trigger the same strict-alignment code path. Whether `riscv64-linux-gnu` GCC triggers that path is not confirmed in available research: data not available. [NEEDS VERIFICATION] |
| [PR #1180](https://github.com/memcached/memcached/pull/1180) | Fix signed-integer-overflow undefined behavior (`mc_swap64`/`util.c`) | Open | Medium | UBSan-detected signed overflow during `binary_append` testing; x86_64 masks this as accidentally correct two's-complement wraparound, while strict-conformance targets, potentially including riscv64 toolchains, could produce incorrect behavior rather than wraparound. Not merged |
| [Issue #816](https://github.com/memcached/memcached/issues/816) | chunked-extstore test failures on RISC-V | Closed 2025-08-05 | High (historical) | Tests 124/178/232 returned empty records on a BeagleV Starlight (rv64gc). No isolated fix commit was ever identified; the bug self-resolved between 1.6.10 and 1.6.16/1.6.17 as a side effect of other extstore work |
| [PR #552](https://github.com/memcached/memcached/pull/552) / commit [be0804c](https://github.com/memcached/memcached/commit/be0804cf3855cf968b3c6c0cc6e1f4b0724205a7) | Fix cross compilation | Closed (GitHub API: not merged via the merge button); fix content shipped directly in 1.5.20 | Resolved | `AC_RUN_IFELSE` incompatible with cross-compilation; replaced with compile-time-safe fallbacks; explicitly tested against `riscv64-unknown-linux-gnu` |
| [Issue #902](https://github.com/memcached/memcached/issues/902) | Alignment issues on SPARC (not RISC-V) | Open, filed 2022-06-13, last updated 2026-01-23 | Reference only | Unaligned-access crashes in `murmur3_hash.c`, the `FLAGS_CONV` macro, and `storage_write` on strict-alignment SPARC64 hardware; same bug class a RISC-V configuration with strict alignment requirements could hit. Not itself a RISC-V issue |

**Correctness bugs with potential riscv64 relevance (currently open):** PR #1291 (unaligned access) and PR #1180 (signed-integer-overflow UB) are the two open items with plausible riscv64 correctness impact. Neither is merged, and neither has been explicitly acknowledged by the maintainer as RISC-V-relevant in the available research. No open issue specifically alleges a RISC-V correctness or NaN/floating-point bug; a targeted search for "riscv nan floating" returned only Issue #1111 (the CI request), confirming no such report exists.

## 12. Objections and Upstream Blockers

**No stated objections exist.** The maintainer has publicly expressed positive, if unhurried, interest in RISC-V support and has personally acquired RISC-V hardware (a SiFive HiFive Unmatched board).

**Technical blockers:**

1. Test-suite timing sensitivity: Issue #816 showed the extstore test suite can produce false failures on physically slow RISC-V hardware. This is a test-infrastructure characteristic rather than a product defect, but it creates unreliable results on lower-end boards and is a plausible reason the maintainer has not yet added public riscv64 CI.
2. No hardware-accelerated CRC32C path for riscv64: no widely adopted standardized CRC32 instruction is referenced anywhere in the memcached source for RISC-V; this is a performance gap, not a correctness blocker, and is confined to the optional extstore feature.
3. OpenSSL TLS AES constant-time gap on hardware lacking Zkn/Zvkned: relevant only to `--enable-tls` deployments.

**Organizational blockers:** Memcached is a single-maintainer project. Any upstream CI infrastructure change requires dormando's personal time. The Cloud-V free, token-free GitHub runner offer has been available since at least July 2025 with no action taken as of the latest activity recorded on Issue #1111 (2025-08-06), and no RISE project engagement with memcached exists to apply resourcing pressure or supply engineering time.

**Acceptance probability for upstream contributions:** High for correctness bug fixes in the style of PR #1291 / PR #1180 (the project has a track record of accepting outside architecture-portability patches, e.g. PR #552 in 2019 and the aarch64 CRC patch via Issue #374 in 2020). Medium for CI infrastructure additions, given 18+ months of an open CI request with no integration. Low priority, though not objected to, for riscv64-specific performance work (a hardware CRC32C path) absent a contributor submitting a clean, tested PR.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro

Memcached has no upstream riscv64 CI at all: its only workflow, [.github/workflows/ci.yml](https://raw.githubusercontent.com/memcached/memcached/master/.github/workflows/ci.yml), runs a single `ubuntu-latest` (x86_64) job with no riscv64 target, no QEMU, and no cross-compile step, and a fresh clone/grep confirms zero mentions of "riscv" anywhere in the repository. Since memcached has no architecture-specific code at all (pure portable autotools C), Ubuntu 26.04 and Debian sid build and ship its `memcached` package for riscv64 from unmodified upstream source with no riscv64 patches (per [packages.ubuntu.com](https://packages.ubuntu.com/resolute/memcached) and the Debian buildd infrastructure), which qualifies for the clean-distro-build exception, upgrading the grade from orange (no CI) to yellow rather than leaving it at orange. Memcached is not an optimization-purpose project (its value is correctness/scalability as a cache server, not CPU-bound numerical/SIMD throughput), so no optimization-level modifier applies to this grade.

**Pending work that could change the grade:** [Issue #1111](https://github.com/memcached/memcached/issues/1111) ("RISC-V CI for memcached") has been open since February 2024; maintainer dormando confirmed in July 2025 that memcached builds and runs fine on a personal HiFive Unmatched board and plans to add it to his own in-house CI, but as of HEAD (October 2026) no riscv64 job has been merged into the public GitHub Actions workflow, and a Cloud-V free CI offer (RISC-V Labs-affiliated) remains unaccepted. No RISE project involvement with memcached was found anywhere (blog, GitHub org, wheel builder). Two open PRs, [#1291](https://github.com/memcached/memcached/pull/1291) (unaligned-access fix) and [#1180](https://github.com/memcached/memcached/pull/1180) (signed-overflow UB fix), could affect riscv64 correctness if merged. No RISE-affiliated or other credible riscv64-vs-other-architecture performance benchmark exists; the only riscv64 optimization attempts found (RVSPOC contest forks, unaffiliated third parties) are unmerged and show no RISE connection.

## 14. Investment Analysis

RISE has zero funded or identified work on memcached. There is no prior investment to avoid duplicating.

### 14.1 Functional Enablement

Two open PRs with potential riscv64 correctness implications are unreviewed by the maintainer:

- PR #1291 (unaligned memory access): confirming whether `NEED_ALIGN`-equivalent conditions are triggered on `riscv64-linux-gnu`, testing the fix, and following through to merge is roughly 1 person-week. The fix itself is already written by a third-party contributor; the remaining work is verification and maintainer follow-up.
- PR #1180 (signed-integer-overflow UB): same pattern - fix exists, needs riscv64-specific verification and a merge nudge, roughly 1 person-week.

### 14.2 Performance Optimization

Adding a hardware CRC32C path for riscv64 in `crc32c.c` using the Zbc or Zbkc extension would close the one identified performance gap, relevant only to extstore-heavy workloads. Prerequisites: target hardware must implement the extension and the toolchain must expose the intrinsics. The only existing riscv64 vectorization attempts (RVSPOC contest PRs against a third-party fork, not against upstream) show that memcached's CPU profile is dominated by locking (about 25%) and syscalls (about 20%), with application code at under 20%, leaving limited room for vectorization gains; contest organizers awarded no champion in this category because no submission met a 30% improvement bar, with best end-to-end results in the single digits to low double digits percent and some scenarios showing no measurable gain. This should temper expectations for a dedicated CRC32C port: estimated effort 2-3 person-weeks, priority low, since extstore is optional and the current software fallback is already correct.

### 14.3 CI/CD Infrastructure

The Cloud-V automated GitHub runner is free for open-source projects, self-service, and requires no access tokens; it has been offered to dormando repeatedly since February 2024 and not acted upon. Adding a riscv64 CI job to `.github/workflows/ci.yml` is mechanically trivial (an estimated 1-3 days) once the test-suite's timing sensitivity on slow hardware (the root cause behind the historical Issue #816 failures) is understood and mitigated, so it does not reintroduce flaky results that the maintainer would disable. Estimated 1-2 person-weeks to characterize and, if needed, fix the timing sensitivity ahead of a CI PR.

### 14.4 Ecosystem Enablement

Not applicable. Memcached is a standalone server daemon with no dependent package ecosystem of its own; its riscv64 availability is governed entirely by distribution packaging (Section 8), which is already functional on Ubuntu 26.04, Debian sid, and Arch Linux RISC-V.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify riscv64 impact of and help land PR #1291 (unaligned access) | 1 | External contributor / RISE engineer | High |
| Functional | Verify riscv64 impact of and help land PR #1180 (signed-overflow UB) | 1 | External contributor / RISE engineer | High |
| CI/CD | Characterize and, if needed, fix test-suite timing sensitivity on slow riscv64 hardware | 1-2 | RISE engineer | Medium |
| CI/CD | Add a public riscv64 CI job to `.github/workflows/ci.yml` (via the standing Cloud-V offer or RISE runners), coordinated with dormando | 0.5 | RISE engineer plus maintainer | Medium |
| Performance | Add a riscv64 hardware CRC32C path in `crc32c.c` (Zbc/Zbkc, `getauxval` detection) | 2-3 | RISE engineer | Low |

**Total estimated investment:** approximately 5.5-7.5 person-weeks to close the two open correctness PRs, stand up public riscv64 CI, and ship one performance optimization. The functional and CI items (3.5-4.5 person-weeks) represent the practical minimum to move memcached from "distro-build-only, no public CI" to a verifiably tested riscv64 target.

## 15. References

- [memcached/memcached repository](https://github.com/memcached/memcached)
- [Memcached project homepage](https://memcached.org/)
- [.github/workflows/ci.yml](https://raw.githubusercontent.com/memcached/memcached/master/.github/workflows/ci.yml)
- [Issue #550 - Cross-compilation is broken](https://github.com/memcached/memcached/issues/550)
- [PR #552 - Fix cross compilation](https://github.com/memcached/memcached/pull/552)
- [Commit be0804c - configure: Fix cross-compilation errors](https://github.com/memcached/memcached/commit/be0804cf3855cf968b3c6c0cc6e1f4b0724205a7)
- [Issue #816 - chunked-extstore test failures on RISC-V](https://github.com/memcached/memcached/issues/816)
- [Gentoo Bug 811477 - memcached RISC-V test failures](https://bugs.gentoo.org/811477)
- [Issue #1111 - RISC-V CI for memcached](https://github.com/memcached/memcached/issues/1111)
- [Memcached wiki - ReleaseNotes1639](https://github.com/memcached/memcached/wiki/ReleaseNotes1639)
- [PR #1291 - Fix unaligned memory access](https://github.com/memcached/memcached/pull/1291)
- [PR #1180 - mc_swap64 UB fix proposal](https://github.com/memcached/memcached/pull/1180)
- [Issue #902 - Alignment issues on SPARC](https://github.com/memcached/memcached/issues/902)
- [Issue #374 - Add hardware crc support for aarch64](https://github.com/memcached/memcached/issues/374)
- [Ubuntu "resolute" (26.04) memcached package](https://packages.ubuntu.com/resolute/memcached)
- [Debian buildd status - memcached sid](https://buildd.debian.org/status/package.php?p=memcached&suite=sid)
- [Arch Linux RISC-V port status](https://archriscv.felixc.at/.status/status.htm)
- [rv2036/rvspoc-S2604-memcached - RVV optimization contest fork](https://github.com/rv2036/rvspoc-S2604-memcached)
- [OpenSSL issue #22166 - SSL test suite hangs at high parallelism](https://github.com/openssl/openssl/issues/22166)
- [OpenSSL PR #31080 - AES constant-time fix](https://github.com/openssl/openssl/pull/31080)
- [OpenSSL PR #31082 - AES constant-time fix](https://github.com/openssl/openssl/pull/31082)
- [OpenSSL issue #28118 - musl Zbb detection broken](https://github.com/openssl/openssl/issues/28118)
- [OpenSSL issue #29357 - no-deprecated cross-compile failure](https://github.com/openssl/openssl/issues/29357)
- [libseccomp PR #197 - native riscv64 syscall table support](https://github.com/seccomp/libseccomp/pull/197)
- [libseccomp issue #327 - riscv32 not yet supported](https://github.com/seccomp/libseccomp/issues/327)
- [NixOS/nixpkgs issue #301385 - stale QEMU seccomp-emulation test failure](https://github.com/NixOS/nixpkgs/issues/301385)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Cloud-V RISC-V CI platform](https://cloud-v.co/)
- [Cache Forge LLC](https://cacheforge.com/)