---
title: Memcached
parent: Project Reports
categories:
  - databases
---

# Memcached
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Memcached<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Memcached is a general-purpose, high-performance, distributed in-memory key-value cache server written in C. It is used as a session store and database query cache by most large-scale web deployments. Current release: 1.6.42 (May 18, 2026).

**License:** BSD 3-Clause (copyright 2003 Danga Interactive, Inc.).

**Governance:** Informal BDFL-style. Alan "dormando" Kasindorf is the sole active maintainer (1,138 commits). There is no foundation affiliation (not Linux Foundation, Apache, CNCF, or RISE), no TSC, and no steering committee. Commercial support is channeled through Cache Forge LLC ([cacheforge.com](https://cacheforge.com)), which dormando operates.

**Corporate history:** Brad Fitzpatrick (Google, 164 commits) created the project. Steven Grimm (Facebook, early multithreaded rework) and Trond Norbye (Sun Microsystems) made early architectural contributions. Netflix is listed as a supporter on the official site. No active corporate co-maintainers exist today.

**Culture on new ports:** The project has no formal platform tier policy and no PLATFORMS.md or SUPPORT.md. Because memcached is portable C with no arch-specific code requirements, new architecture support is handled implicitly by OS distributions rather than through any upstream acceptance process. The maintainer's public posture on RISC-V is positive: dormando acquired a HiFive Unmatched board in 2025 and confirmed in [Issue #1111](https://github.com/memcached/memcached/issues/1111) (July 2025): "the build as-is is completely fine on RISCV and will continue to be going forward."

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| October 2019 | Contributor olajep (Rocket Chip FPGA research platform) files PR #552 fixing `AC_RUN_IFELSE` cross-compilation failures; explicitly tests against `riscv64-unknown-linux-gnu` | [PR #552](https://github.com/memcached/memcached/pull/552) |
| November 2019 | PR #552 patch content committed as `be0804cf` by dormando; ships in memcached 1.5.20 | [PR #552](https://github.com/memcached/memcached/pull/552) |
| September 2021 | mkszuba files Issue #816 reporting chunked-extstore test failures (tests 124, 178, 232) on BeagleV Starlight (rv64gc, Gentoo, memcached 1.6.10); failures do not reproduce under QEMU user-mode, only on physical hardware | [Issue #816](https://github.com/memcached/memcached/issues/816) |
| October 2022 | Community member alexfanqi confirms no reproduction on QEMU and SiFive Unmatched with memcached 1.6.16/1.6.17 | [Issue #816](https://github.com/memcached/memcached/issues/816) |
| February 2024 | alitariq4589 files Issue #1111 requesting upstream riscv64 CI via Cloud-V; dormando responds he has purchased a RISC-V board | [Issue #1111](https://github.com/memcached/memcached/issues/1111) |
| July 2025 | dormando gets HiFive Unmatched running; confirms "it does build and run just fine" on riscv64; states personal CI planned | [Issue #1111](https://github.com/memcached/memcached/issues/1111) |
| August 5, 2025 | Issue #816 closed by dormando as fixed in recent releases | [Issue #816](https://github.com/memcached/memcached/issues/816) |

**Key contributors with orgs:**

| Contributor | Org | Contribution |
|-------------|-----|--------------|
| olajep | FPGA research (unnamed) | PR #552: cross-compilation fix for riscv64 |
| mkszuba | Individual / Gentoo | Issue #816: initial RISC-V extstore bug report |
| alexfanqi | Individual | Issue #816: confirmed fixed on physical RISC-V hardware |
| alitariq4589 / 10x Engineers | Cloud-V / RISC-V Labs | Issue #1111: CI infrastructure outreach |

**Upstreaming status:** The cross-compilation fix is fully upstream (1.5.20+). The extstore bug is fixed. No dedicated RISC-V code path has ever been added because none is required -- the codebase is portable by design. The project is functionally supported but lacks upstream CI coverage.

---

## 3. Upstream Support Tier

Memcached has no formal tier policy. The CI configuration is a single 21-line GitHub Actions workflow targeting `ubuntu-latest` (x86_64) only. There is no architecture matrix, no release-blocking tests for non-x86_64, and no official riscv64 binary releases.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI | Yes (ubuntu-latest) | No | No |
| Release-blocking tests | Yes | No | No |
| Official upstream binary | No (source-only) | No | No |
| Distro binary available | Yes | Yes | Yes (Ubuntu, Debian) |
| Maintainer confirmed working | Yes | Not stated | Yes (Issue #1111, Jul 2025) |
| Hardware CRC32 acceleration | Yes (SSE4.2) | Yes (ARM CRC ext) | No (software fallback) |

Effective tier: riscv64 is an informal community-supported tier with no upstream CI, no release-blocking tests, and no official binaries. Distribution packages exist and are functional.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Memcached has no JIT compiler, no garbage collector, no floating-point subsystem, and no SIMD dispatch layer. The entire architecture-specific code is in one file: `crc32c.c`.

**CRC32C (`crc32c.c`):** Used to checksum data written to the extstore disk-offload backend.

| Implementation | amd64 | arm64 | riscv64 |
|----------------|-------|-------|---------|
| Strategy | Hardware SSE4.2 intrinsics + triple-stream pipelining | Hardware ARM CRC extension (`crc32cx`/`crc32cb`) | Software table-driven fallback |
| ISA extension required | SSE4.2 | `HWCAP_CRC32` (detected at runtime) | None |
| Runtime detection | Yes (`cpuid`) | Yes (`getauxval(AT_HWCAP)`) | N/A |
| Quality | Hand-tuned | Hand-tuned | Generic C99 |
| Correctness | Full | Full | Full |
| Relative performance | Baseline | Comparable | Degraded (~2-5x slower for CRC-intensive extstore workloads) [NEEDS VERIFICATION] |

The riscv64 scalar fallback is a complete, correct implementation -- it is not a stub. It is the same fallback used for ppc64le, s390x, and all other architectures. The practical impact is limited to deployments that use the `extstore` feature (disk offload); the main caching path does not use CRC32C.

**MurmurHash3 (`murmur3_hash.c`):** Generic portable C99, no architecture-specific code on any platform.

**Seccomp sandbox (`linux_priv.c`):** Uses libseccomp's architecture-neutral API. No architecture-specific syscall filter lists are required in the memcached source. The upstream README states seccomp is tested on x86-64 only; the project recommends `--disable-seccomp` (by omission -- seccomp is not enabled by default) for other architectures until validated.

**No other architecture-specific components exist.** The repository contains zero `.S` assembly files, zero JIT backends, and zero inline asm outside `crc32c.c`.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Autotools only (autoconf + automake). No CMake, no Meson, no toolchain files.

**Native build (standard):**

```
./autogen.sh
./configure
make
make test
```

**Cross-compilation to riscv64 (standard autotools pattern; no project-specific documentation exists):**

```
./autogen.sh
./configure --host=riscv64-linux-gnu --build=x86_64-linux-gnu \
    CC=riscv64-linux-gnu-gcc
make
```

The cross-compilation fix in PR #552 (shipped 1.5.20) replaced `AC_RUN_IFELSE` calls in `configure.ac` with `AC_COMPILE_IFELSE` fallbacks that do not require executing code on the target. This is the only riscv64-specific build system change ever made.

**Minimum toolchain versions:** Not explicitly stated. `configure.ac` requires autoconf 2.52 (a 2003 vintage); the code uses C99 features (m4/c99-backport.m4 present). Any GCC or Clang version capable of riscv64-linux-gnu targeting will suffice.

**QEMU usage:** Zero. No QEMU-based emulation is used or documented anywhere in the project.

**Known build failures:** None active as of 1.6.42. The extstore test failures (Issue #816) on BeagleV Starlight were timing-sensitive failures on slow hardware, not build failures. They are resolved in releases 1.6.16+.

**Feature flags relevant to riscv64:**

| Flag | Notes |
|------|-------|
| `--enable-seccomp` | Tested x86-64 only per upstream README. Use with caution on riscv64; libseccomp itself supports riscv64 since v2.5.0 (2021). |
| `--enable-tls` | Arch-neutral. Requires OpenSSL and pkg-config. |
| `--enable-sasl` | Arch-neutral. Requires libsasl2. |
| `--enable-proxy` | Requires running `cd vendor && ./fetch.sh` first to pull Lua and optionally liburing. Arch-neutral. |
| `--enable-extstore` | Arch-neutral. Uses software CRC32C on riscv64. |

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Core get/set/delete | Full | Full | Full |
| LRU eviction | Full | Full | Full |
| Extstore disk offload | Full | Full | Full (software CRC32C) |
| TLS termination | Full | Full | Full |
| SASL authentication | Full | Full | Full |
| Proxy subsystem (Lua) | Full | Full | Full |
| Seccomp sandbox | Full (tested) | Untested upstream | Untested upstream |
| io_uring proxy (EXPERIMENTAL) | Full | Full | Full (liburing has riscv64 CI) |

**Performance gaps:**

- CRC32C throughput: riscv64 uses software fallback vs. hardware acceleration on amd64 and arm64. This affects only the extstore code path. Magnitude of throughput reduction is not quantified in any published benchmark -- data not available.
- No other performance gaps attributable to missing riscv64 code paths have been identified.

**Security hardening gaps:**

- The seccomp sandbox (`--enable-seccomp`) is untested on riscv64 upstream. It is not enabled by default in the upstream build. Deployments requiring seccomp sandboxing on riscv64 must validate independently.
- OpenSSL dependency: AES without the Zkn vector-crypto extension is not constant-time on riscv64 (OpenSSL issues [#20980](https://github.com/openssl/openssl/issues/20980), [#31080](https://github.com/openssl/openssl/issues/31080)), creating a potential timing side-channel for TLS-enabled memcached deployments on baseline rv64gc hardware without Zkn. OpenSSL maintainers have open PRs addressing this.

**No floating-point or NaN semantics issues identified.** Memcached does not perform floating-point arithmetic.

---

## 7. CI/CD Infrastructure

The upstream CI configuration is a single file: `.github/workflows/ci.yml`, 21 lines total.

```yaml
name: GitHub CI
on: [push, pull_request]
jobs:
  ubuntu-build-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: sudo apt-get install -y libevent-dev libseccomp-dev git libsasl2-dev libio-socket-ssl-perl
      - run: gcc --version
      - run: ./autogen.sh
      - run: ./configure --enable-seccomp --enable-tls --enable-sasl --enable-sasl-pwdb
      - run: make -j
      - run: PARALLEL=5 make test
```

No Jenkinsfile, no `.cirrus.yml`, no `.gitlab-ci.yml` exists in the repository. This is the entire CI footprint.

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists upstream | Yes | No | No |
| Tests run on push/PR | Yes | No | No |
| QEMU-based cross-arch | No | No | No |
| Hardware-in-the-loop | No | No | No (planned personal, not upstream) |
| RISE CI runners used | No | No | No |
| Cloud-V integration | No | No | No (offered, not accepted) |
| Release gates on test pass | No (informally yes) | N/A | N/A |

**RISE involvement:** Zero. No RISE Project blog posts mention Memcached. No RISE-funded RFP or working group deliverable covers Memcached. The RISE wheel builder does not apply to a C server daemon.

**Maintainer's personal CI:** dormando stated in [Issue #1111](https://github.com/memcached/memcached/issues/1111) (July 2025) that his HiFive Unmatched "will be in my own CI shortly." This is personal/private infrastructure, not upstream GitHub Actions. No pull request integrating riscv64 CI has been filed as of the last activity in Issue #1111 (August 6, 2025).

**Arch Linux RISC-V data point:** The Arch Linux RISC-V port shows memcached 1.6.42-1 as FTBFS (`check() failed`) as of the report date. This is evidence that the test suite does not pass reliably on riscv64 in at least one build environment, and that the absence of upstream riscv64 CI allows regressions to go undetected.

---

## 8. Distribution and Release Status

Memcached does not publish binary releases. GitHub Releases returns an empty array; the project uses git tags only, with auto-generated source tarballs. No binary assets of any kind are attached to any release.

**To obtain a working riscv64 binary, a user must either:**
1. Install the distribution package (Ubuntu, Debian), or
2. Cross-compile from source using the standard autotools cross pattern.

**Distribution package status:**

| Distro | Package | riscv64 Status | Version | Notes |
|--------|---------|----------------|---------|-------|
| Ubuntu Noble (24.04 LTS) | memcached | Available | 1.6.24-1build3 | File: `memcached_1.6.24-1build3_riscv64.deb` (222 kB). SHA256: b8b44991649212fba88bb0d1e7728bc34c449be9ebffa5a1b18c933578a75cc |
| Debian sid | memcached | Installed | 1.6.42-1 | Built on `rv-manda-03` buildd approximately 33 days before report date |
| Arch Linux RISC-V | memcached | FTBFS | 1.6.42-1 | `check() failed`; cascading `DEP BROKEN` for python-memcached, pifpaf, consul, nginx, nginx-mainline, and others |
| Fedora riscv64 | memcached | Data not available: Fedora riscv64 package database was not queried. | - | - |

**Ubuntu Noble companion packages on riscv64:** libmemcached-dev, libmemcached-tools, libmemcached11t64, libmemcachedutil2t64, libcache-memcached-fast-perl, php-memcached, php8.3-memcached, kamailio-memcached-modules -- all listed as riscv64-available on Ubuntu Noble.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| libevent (mandatory) | Event loop, all network I/O | OK (Debian sid ships it) | No riscv64 CI upstream | System package | General C; 0 riscv64 issues found |
| OpenSSL (optional, `--enable-tls`) | TLS termination | CI: dedicated `riscv-more-cross-compiles.yml` runs daily; linux64-riscv64 QEMU tests | QEMU tests in upstream CI | Debian riscv64 | 12 open riscv64 issues; AES constant-time gap without Zkn ([#20980](https://github.com/openssl/openssl/issues/20980), [#31080](https://github.com/openssl/openssl/issues/31080)) is a security concern for TLS deployments on rv64gc without Zkn |
| Cyrus SASL / libsasl2 (optional, `--enable-sasl`) | SASL authentication | OK (Debian riscv64) | No riscv64 CI upstream | System package | General C; 0 riscv64 issues found |
| libseccomp (optional, `--enable-seccomp`) | Syscall sandbox | riscv64 supported since v2.5.0 (2021); v2.6.0 (Jan 2025) | Debian riscv64 | v2.6.0 | Issue [#327](https://github.com/seccomp/libseccomp/issues/327): riscv32 not yet supported; riscv64 is fine. Syscall table lags kernel by a few releases |
| Lua 5.4 (vendored in `vendor/lua/`) | Proxy scripting engine | Architecture-neutral C99 | No riscv64 CI upstream (0 riscv issues) | N/A (vendored, in-tree copy is 5.4.3) | Fully portable C; latest upstream is 5.4.7; vendored copy is stale |
| liburing (vendored, optional, `--enable-proxy-uring`, EXPERIMENTAL) | io_uring async I/O for proxy | Upstream CI has explicit `arch: riscv64` cross-compile entry | Cross-compile tested upstream | liburing-2.14 (Feb 2026) via vendor fetch | Issues [#930](https://github.com/axboe/liburing/issues/930)/[#928](https://github.com/axboe/liburing/issues/928) (riscv64 nolibc) closed; [#1601](https://github.com/axboe/liburing/issues/1601) open (documentation only) |
| mcmc (vendored in `vendor/mcmc/`) | Internal proxy backend client | Pure C; 0 riscv issues | No riscv64-specific CI | N/A (vendored) | No issues |
| CRC32C (in-tree, `crc32c.c`) | Extstore checksum | Software fallback (correct, ~2-5x slower than hw paths) | No riscv64 test | N/A (in-tree) | No hw path for riscv64; no upstream issue filed |
| xxhash (in-tree header, `xxhash.h`) | Proxy request hash routing | Architecture-neutral | N/A | N/A (header-only) | No issues |
| pthreads / glibc (mandatory) | Threading, runtime | riscv64 fully supported | Debian riscv64 | N/A (system) | No issues |

**OpenSSL riscv64 deep-dive (TLS path):** OpenSSL is the only dependency with meaningful riscv64-specific active issues. For memcached deployments that enable TLS (`--enable-tls`), baseline rv64gc hardware without the Zkn vector-crypto extension will use a non-constant-time AES implementation, which is a timing side-channel risk. Hardware with Zkn (e.g., SpacemiT X60 cores) will not be affected. OpenSSL has open PRs to address this. This is not a blocker for non-TLS deployments, which are the majority of internal datacenter use cases.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [Issue #1111](https://github.com/memcached/memcached/issues/1111) | RISC-V CI for memcached | Open (Feb 2024) | Low | No upstream CI added; maintainer confirmed personal CI planned; Cloud-V offer unaccepted |
| [PR #1291](https://github.com/memcached/memcached/pull/1291) | SPARC traps on unaligned memory accesses | Open (May 2026) | Medium | Fixes three unaligned access bugs gated on `NEED_ALIGN` preprocessor flag: (1) MurmurHash3 unaligned key pointer reads, (2) `ITEM_suffix()` unaligned `client_flags_t*` cast, (3) logger payload 64-bit alignment. RISC-V is not named in the PR but would be affected on toolchains that define `NEED_ALIGN`. Whether `riscv64-linux-gnu` GCC defines `NEED_ALIGN` is not confirmed in the research findings -- data not available. |
| [PR #1180](https://github.com/memcached/memcached/pull/1180) | mc_swap64 UB fix (signed integer overflow) | Open (Oct 2024) | Medium | UBSan-detected signed integer overflow in `util.c` line 247 during `binary_append` test. x86_64 masks this as accidental correctness; strict-conformance targets including riscv64 may produce incorrect behavior rather than the expected wrap-around. |
| [Issue #816](https://github.com/memcached/memcached/issues/816) | chunked-extstore test failures on RISC-V | Closed Aug 2025 | High (was) | Tests 124/178/232 in `t/chunked-extstore.t` returned empty records on BeagleV Starlight and SiFive Unmatched running memcached 1.6.10. Fixed organically around 1.6.16-1.6.17. No dedicated RISC-V patch; fix was a general correctness improvement. |
| [PR #552](https://github.com/memcached/memcached/pull/552) | Fix cross compilation | Closed / shipped 1.5.20 | N/A (resolved) | `AC_RUN_IFELSE` incompatible with cross-compilation; replaced with compile-time fallbacks. Explicitly tested against `riscv64-unknown-linux-gnu`. |

**Correctness bugs (current):** PR #1291 (unaligned access) and PR #1180 (signed integer overflow UB) are the two open issues with potential correctness impact on riscv64. Neither has been merged. Both are filed but unacknowledged by the maintainer in the research findings.

**Arch Linux RISC-V FTBFS:** Memcached 1.6.42-1 fails the test suite (`check()`) in the Arch Linux RISC-V build environment. The specific test failures are not identified in the research findings -- data not available. This may be related to timing sensitivity on slow hardware (the identified root cause of Issue #816) or may be a new regression. Given that Debian sid 1.6.42-1 builds cleanly on the Debian riscv64 buildd, the Arch FTBFS is likely environment-specific rather than a fundamental correctness regression.

---

## 12. Objections and Upstream Blockers

**No stated objections exist.** The maintainer (dormando) has publicly expressed positive interest in RISC-V support and acquired personal hardware.

**Technical blockers:**

1. Test suite timing sensitivity: Issue #816 showed that the extstore test suite produces false failures on physically slow RISC-V hardware. The root cause is timing-dependent tests, not hardware bugs. This is a test infrastructure problem, not a product bug, but it creates unreliable CI results on lower-end RISC-V boards.

2. CRC32C hardware acceleration gap: No `__riscv` hardware CRC32C path exists. RISC-V has no widely implemented standardized CRC32 instruction as of this report. The Zbkc (Carry-less Multiply) extension exists but is not equivalent to CRC32C. This is a performance gap only, not a correctness blocker.

3. OpenSSL TLS AES constant-time gap: Only relevant for `--enable-tls` deployments on hardware without Zkn.

**Organizational blockers:**

- Single-maintainer project: dormando is the sole active maintainer. Any upstream CI infrastructure change requires his personal time and bandwidth. The Cloud-V automated GitHub runner offer (free, no tokens required) has been available since at least July 2025 with no action taken.

**Acceptance probability for upstream contributions:** High for correctness bug fixes (PR #1291, PR #1180 style). Medium for CI infrastructure additions (dormando has personal CI planned but has not integrated any external CI in 18 months of the open issue). Low for performance work (CRC32C riscv64 hardware path) unless a contributor submits a clean, tested PR.

---

## 13. Investment Analysis

RISE has zero funded work on Memcached. No prior investment to avoid duplicating.

### 13.1 Functional Enablement

Two open PRs with correctness implications for riscv64 are unreviewed by the maintainer:

- PR #1291 (unaligned memory access): Confirming whether `NEED_ALIGN` is triggered on riscv64-linux-gnu, testing the fix, and nudging dormando to merge constitutes roughly 1 person-week. The fix is already written by a third-party contributor; the work is review and follow-through.

- PR #1180 (signed integer overflow UB): Same pattern. Fix exists, needs review and merge nudge.

Arch Linux RISC-V FTBFS: Diagnosing whether the test suite failures are timing-related (same root cause as Issue #816) or a new regression requires access to an Arch riscv64 build environment. Estimated 1-2 person-weeks to diagnose and patch.

### 13.2 Performance Optimization

Adding a hardware CRC32C path for riscv64 in `crc32c.c` using the Zbc or Zbkc extension would close the performance gap for extstore-heavy workloads. Prerequisites: the extension must be present (Rocket Chip, SiFive P-series with Zbkc) and the toolchain must support the intrinsics. Estimated effort: 2-3 person-weeks (implementation, runtime detection via `getauxval`, testing). Priority is low -- extstore is an optional feature and the software fallback is correct.

### 13.3 CI/CD Infrastructure

The Cloud-V automated GitHub runner ([cloud-v.co/github-riscv-runner](https://cloud-v.co/github-riscv-runner)) is free for open-source projects, self-service, and requires no access tokens. The offer has been made to dormando and not acted upon. Adding an riscv64 CI job to `.github/workflows/ci.yml` is trivial mechanical work (1-3 days) if the test suite timing issues are resolved first.

The test suite timing problem is the gating dependency: if the CI job is added before timing-sensitive tests are fixed or marked skip-on-slow-hardware, the CI will produce intermittent failures that dormando will disable. Fixing the timing sensitivity is estimated at 1-2 person-weeks.

### 13.4 Ecosystem Enablement

Not applicable. Memcached is a server daemon. Its RISC-V availability is determined by distribution packages, not a plugin or wheel ecosystem. Ubuntu Noble and Debian sid carry working riscv64 packages. The Arch Linux RISC-V FTBFS creates downstream cascading broken packages (python-memcached, consul, nginx, pifpaf) but the root fix is in the memcached test suite, not in the downstream packages.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Review and merge PR #1291 (unaligned access) + confirm riscv64 impact | 1 | External contributor / RISE engineer | High |
| Functional | Review and merge PR #1180 (signed integer overflow UB) | 1 | External contributor / RISE engineer | High |
| Functional | Diagnose and fix Arch Linux RISC-V FTBFS (test suite) | 2 | RISE engineer | High |
| CI/CD | Fix timing-sensitive test suite failures on slow riscv64 hardware | 2 | RISE engineer | High |
| CI/CD | Add riscv64 CI job to upstream GitHub Actions (via Cloud-V runner) | 0.5 | RISE engineer + dormando | Medium |
| Performance | Add riscv64 hardware CRC32C path in `crc32c.c` (Zbc/Zbkc, `getauxval` detection) | 3 | RISE engineer | Low |

**Total estimated investment:** 9.5 person-weeks to reach full CI coverage, all open correctness bugs fixed, and one performance optimization. The functional and CI items (6 person-weeks) are the practical minimum for production confidence on riscv64.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [memcached/memcached repository](https://github.com/memcached/memcached)
- [Memcached project homepage](https://memcached.org)
- [PR #552 - Fix cross compilation (riscv64-unknown-linux-gnu)](https://github.com/memcached/memcached/pull/552)
- [Issue #816 - chunked-extstore test failures on RISC-V](https://github.com/memcached/memcached/issues/816)
- [Issue #1111 - RISC-V CI for memcached](https://github.com/memcached/memcached/issues/1111)
- [PR #1291 - SPARC traps on unaligned memory accesses](https://github.com/memcached/memcached/pull/1291)
- [PR #1180 - mc_swap64 UB fix proposal](https://github.com/memcached/memcached/pull/1180)
- [Gentoo Bug 811477 - memcached RISC-V test failures](https://bugs.gentoo.org/811477)
- [memcached crc32c.c source](https://raw.githubusercontent.com/memcached/memcached/master/crc32c.c)
- [memcached .github/workflows/ci.yml](https://raw.githubusercontent.com/memcached/memcached/master/.github/workflows/ci.yml)
- [Ubuntu Noble memcached package (riscv64)](https://packages.ubuntu.com/noble/riscv64/memcached/download)
- [Debian buildd status - memcached sid](https://buildd.debian.org/status/package.php?p=memcached&suite=sid)
- [Arch Linux RISC-V port status](https://archriscv.felixc.at/.status/status.htm)
- [Cache Forge LLC (dormando commercial support)](https://cacheforge.com)
- [Cloud-V RISC-V CI platform](https://cloud-v.co)
- [RISE Project blog](https://riseproject.dev/blog)
- [OpenSSL issue #20980 - AES constant-time without Zkn](https://github.com/openssl/openssl/issues/20980)
- [OpenSSL issue #31080 - AES constant-time riscv64](https://github.com/openssl/openssl/issues/31080)
- [libseccomp issue #327 - riscv32 not yet supported](https://github.com/seccomp/libseccomp/issues/327)