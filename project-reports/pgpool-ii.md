---
title: Pgpool-II
parent: Project Reports
---

# Pgpool-II

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for Pgpool-II<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Pgpool-II is a middleware layer that sits between PostgreSQL clients and PostgreSQL servers. It provides connection pooling, load balancing across multiple PostgreSQL instances, automatic failover, and an optional in-memory query cache. It operates as a standalone daemon that speaks the PostgreSQL wire protocol on both sides.

**Language:** C99. No C++, no Rust, no Go. The build system is Autotools (autoconf/automake). No CMake. The source tree contains 1,195 total files, 214 C/H source files, and zero assembly files (two files with `.s` extension in the tree are regression-test expected-output text files, not actual assembly).

**License:** PostgreSQL License (BSD-like permissive). Copyright 2003-2026 Pgpool Global Development Group.

**Governance:** The project is governed by the "Pgpool Global Development Group," an informal collective with no foundation affiliation, no bylaws, and no documented decision-making process. There is no steering committee, no CLA requirement, and no formal tier or platform support policy. The project communicates via the pgpool-hackers mailing list at pgpool.net. Pull requests on the GitHub mirror are explicitly not reviewed upstream; patches are accepted only via the mailing list.

**Corporate maintainers:** SRA OSS K.K. (Tokyo, Japan) is the de facto corporate sponsor. The three top contributors -- Tatsuo Ishii (1,903 commits), Bo Peng / pengbo0328 (578 commits), and yugo-n (357 commits) -- all have @sraoss listed as their GitHub organization. Tatsuo Ishii is the original author (2003) and remains the dominant committer. SRA OSS provides commercial Pgpool-II support services as its core business. No other corporate sponsors are identified. The project has no foundation membership (no LF, CNCF, Apache, PostgreSQL Foundation). Contributor codeforall (273 commits) has no visible employer. Debian packaging is maintained by Christoph Berg (myon@debian.org, Credativ/Cybertec).

**Community stance on new ports:** No record exists of any RISC-V discussion on the pgpool-hackers mailing list or in the GitHub issue tracker. Because the codebase is pure portable C with no architecture-specific code paths, the project has never needed to address RISC-V explicitly. RISC-V support arrived silently through distribution packaging without requiring any upstream action.

---

## 2. Port History and Upstreaming Timeline

There is no upstream port history for RISC-V. The upstream project contains zero riscv-related commits, issues, PRs, or code references. The following table reflects the downstream packaging history.

| Date (approximate) | Event | Source |
|---|---|---|
| ~2023 (Debian 4.5.x era) | Debian packaging restricts to "linux-any kfreebsd-any" with a 64-bit-only constraint, implicitly enabling riscv64 | [Debian tracker](https://tracker.debian.org/pkg/pgpool2) |
| 2024 or earlier | Ubuntu 24.04 (Noble) ships pgpool2 4.3.7-1ubuntu4 with riscv64 listed as a supported architecture | [Ubuntu packages](https://packages.ubuntu.com/noble/pgpool2) |
| 2026-06-03 (tag date) | pgpool2 4.7.2-1 available in Debian sid with riscv64 status "Installed" on buildd host rv-manda-04 | [Debian buildd](https://buildd.debian.org/status/package.php?p=pgpool2&suite=sid) |

**Key contributors to riscv64 availability:** Christoph Berg (Debian/Ubuntu packager). The upstream SRA OSS team has contributed zero riscv64-specific work.

**Is riscv64 fully upstream?** Not applicable. Pgpool-II requires no upstream code changes for riscv64. The code is architecture-agnostic. "Upstream support" for RISC-V means nothing more than the C compiler and the host PostgreSQL installation working on riscv64, both of which are confirmed.

---

## 3. Upstream Support Tier

Pgpool-II has no documented tier or platform support policy.

The upstream-verified platforms listed in project documentation are entirely x86_64: Rocky Linux 8, Rocky Linux 9, Rocky Linux 10, Ubuntu 20.04, and OpenBSD. RISC-V does not appear in any upstream platform list.

**Upstream CI:** None. The pgpool/pgpool2 repository has no `.github/workflows` directory, no `.gitlab-ci.yml`, no `Jenkinsfile`, and no `.cirrus.yml`. The GitHub repository has no CI configuration of any kind. There are no automated tests run by upstream for any architecture.

**Official upstream binaries:** None. The GitHub releases page states "There aren't any releases here." Tags (V4_7_2, V4_6_7, V4_5_12, V4_4_17, V4_3_20) are source-only archives (.zip and .tar.gz). No binary assets exist for any architecture.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in upstream platform docs | Yes (x86_64) | No | No |
| Upstream CI job exists | No | No | No |
| Upstream binary release | No | No | No |
| Upstream code changes required | N/A | N/A | None required |
| Debian binary package | Yes | Yes | Yes (4.7.2-1) |
| Ubuntu binary package | Yes | Yes | Yes (4.3.7-1ubuntu4) |

The upstream project provides equal (negligible) support for all three architectures: source code only, no CI, no binaries, no platform guarantees. riscv64 parity with amd64 and arm64 is complete by this measure.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Pgpool-II is a network proxy daemon. Its workload is I/O and network bounded: forking child processes, multiplexing client/server connections, parsing the PostgreSQL wire protocol, and optionally caching query results in shared memory. None of these operations benefit from SIMD, JIT, or ISA-specific intrinsics.

The codebase contains no architecture-specific code for any architecture. There are zero instances of `#ifdef __riscv`, `#ifdef __x86_64__`, `#ifdef __aarch64__`, `__builtin_clz` (in C source files -- one hit in a borrowed PostgreSQL autoconf macro in c-compiler.m4, not architecture dispatch), or any SIMD keyword (simd, rvv, vfloat32m1_t, neon, avx, sse). There are no `arch/`, `cpu/`, `simd/`, `platform/`, or `jit/` subdirectories.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Connection multiplexing | scalar C | scalar C | scalar C | No arch code for any arch |
| PostgreSQL wire protocol parsing | scalar C | scalar C | scalar C | No arch code for any arch |
| Query cache (memqcache) | scalar C | scalar C | scalar C | Shared memory, portable C |
| Load balancing logic | scalar C | scalar C | scalar C | Pure algorithmic C |
| Watchdog (HA) | scalar C | scalar C | scalar C | Network I/O, portable C |
| JIT backend | None | None | None | Not applicable to this software |
| SIMD intrinsics | None | None | None | Not applicable to this software |
| Assembly | None | None | None | Not applicable to this software |
| Crypto | Delegated to OpenSSL | Delegated to OpenSSL | Delegated to OpenSSL | See Section 9 |

riscv64 is architecturally complete. There is nothing architecture-specific to port, enable, or optimize in Pgpool-II itself.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Autotools (autoconf/automake). `configure.ac` at repo root. No CMake.

**Minimum C standard:** C99. Enforced via `AC_PROG_CC_C99()` in `configure.ac` with a hard error if the compiler does not support it.

**Debian native build on riscv64 (confirmed):**

The Debian build uses the following configure invocation on a native riscv64 machine (buildd host rv-manda-04, GCC 15, Linux kernel 7.0.10+deb13-riscv64):

```sh
./configure \
  --prefix=/usr \
  --sysconfdir=/etc/pgpool2 \
  --bindir=/usr/sbin \
  --includedir=/usr/include/pgpool2 \
  --disable-rpath \
  --with-ldap \
  --with-openssl \
  --with-pam \
  --with-memcached=/usr/include/libmemcached
```

**configure detection results on riscv64:**
- Cross-compiling: no (native build)
- Build/host triple: `riscv64-unknown-linux-gnu`
- Byte order: little-endian
- `sizeof(unsigned long)` = 8, `sizeof(void*)` = 8
- Float4 and float8 passed by value: yes (64-bit Datum path)

**Compiler flags used:**
```
-g -O2 -Werror=implicit-function-declaration -fstack-protector-strong \
-Wformat -Werror=format-security -Wall -Wmissing-prototypes \
-Wmissing-declarations -fno-strict-aliasing
```

The `-fno-strict-aliasing` flag is set unconditionally in `configure.ac`, not as an architecture-specific workaround.

**GCC 15 open issue:** Issue [#124](https://github.com/pgpool/pgpool2/issues/124) documents a build failure with GCC 15 caused by `typedef char bool` conflicting with C23 where `bool` is a keyword. This was reported on Fedora 42 (x86-64) but affects any architecture building with GCC 15 and `-std=c23`, including riscv64. Assigned to Bo Peng. Status: open.

**Cross-compilation:** No upstream cross-compilation toolchain files or Dockerfiles exist in the repository. Standard autotools cross-compilation works:

```sh
./configure \
  --host=riscv64-linux-gnu \
  --build=x86_64-linux-gnu \
  CC=riscv64-linux-gnu-gcc \
  --with-pgsql=<path-to-riscv64-postgresql-install> \
  --disable-rpath
```

The `c-library.m4` file (borrowed from PostgreSQL) contains cross-compile guards for `snprintf` format detection that fall back to safe defaults when cross-compiling.

**QEMU:** No QEMU-specific build infrastructure in upstream. Debian buildd uses a native riscv64 machine.

**Docker:** No Dockerfiles in pgpool/pgpool2. Docker images are maintained separately at [hub.docker.com/r/pgpool/pgpool2](https://hub.docker.com/r/pgpool/pgpool2), outside the main repository.

**Build dependencies (from Debian control):** `bison`, `flex`, `chrpath`, `libpq-dev`, `libssl-dev`, `libldap-dev`, `libpam0g-dev`, `libmemcached-dev`, `libcrypt-dev`, `postgresql-server-dev-all`, plus documentation tools (`docbook`, `docbook-xml`, `docbook-xsl`, `openjade`, `opensp`, `xsltproc`).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Connection pooling | Full | Full | Full | No arch-specific code |
| Load balancing | Full | Full | Full | No arch-specific code |
| Automatic failover (watchdog) | Full | Full | Full | No arch-specific code |
| Query cache (memcache backend) | Full | Full | Full | Optional; see Section 9 for libmemcached riscv64 status |
| SSL/TLS (OpenSSL) | Full | Full | Full (functional) | AES constant-time gap on riscv64 without Zkne/Zvkned; see Section 9 |
| LDAP authentication | Full | Full | Full | No arch-specific code |
| PAM authentication | Full | Full | Full | No arch-specific code |
| Online recovery | Full | Full | Full | No arch-specific code |
| Streaming replication support | Full | Full | Full | No arch-specific code |
| LLVM JIT (PostgreSQL backend) | Available | Available | Disabled | JIT is a PostgreSQL feature, not Pgpool-II; riscv64 PostgreSQL disables JIT in distros |

**Functional gaps:** None in Pgpool-II itself.

**Performance gaps:** None attributable to Pgpool-II itself. The software has no SIMD paths for any architecture. Performance is bounded by network I/O and PostgreSQL backend latency.

**Security hardening gaps:** The OpenSSL AES constant-time issue (see Section 9) affects TLS-encrypted connections on riscv64 hardware without Zkne/Zvkned extensions. This is not a Pgpool-II gap but a dependency gap that surfaces in Pgpool-II deployments using `--with-openssl`.

**Floating-point:** Pgpool-II does not perform floating-point arithmetic. Float4/float8 pass-by-value configuration is detected at configure time and confirmed working on riscv64 (64-bit Datum path). No NaN or floating-point semantics issues are applicable.

**Big-endian:** Issue [#106](https://github.com/pgpool/pgpool2/issues/106) documented a big-endian regression in 4.6.1 on s390x (fixed before 4.6.2). RISC-V is little-endian; this issue is not relevant to riscv64.

---

## 7. CI/CD Infrastructure

**Upstream CI:** None. Zero. The pgpool/pgpool2 repository has no CI configuration of any kind. No `.github/workflows`, no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml`. This was confirmed by direct HTTP checks for each path (all returned 404) and by GitHub code search returning 0 results for "riscv" across the entire repository.

**RISE Project involvement:** None. Pgpool-II has no RISE Project membership, no RISE blog coverage, no RISE runner usage, and no funded work. Searches of riseproject.dev (blog pages 1-4, covering May 2024 through August 2026), the RISE GitLab organization, and web searches for "RISE project Pgpool-II riscv64" all returned zero results.

| CI Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI job | None | None | None |
| RISE-funded CI | None | None | None |
| Distro build CI (Debian buildd) | Yes | Yes | Yes (rv-manda-04) |
| Automated regression tests | None upstream | None upstream | None upstream |

The only automated build verification for any architecture is Debian's buildd system, which confirms successful builds on riscv64 (rv-manda-04) for the current Debian sid package.

---

## 8. Distribution and Release Status

**Upstream binaries:** None for any architecture. Source-only releases via git tags.

**Debian sid:** pgpool2 4.7.2-1, architecture riscv64, status "Installed" on buildd host rv-manda-04. Package size 1,291.2 kB, installed size 7,018.0 kB. Packages: `pgpool2`, `libpgpool2`, `libpgpool-dev`. Source: [packages.debian.org/sid/pgpool2](https://packages.debian.org/sid/pgpool2), [buildd.debian.org](https://buildd.debian.org/status/package.php?p=pgpool2&suite=sid).

**Ubuntu 24.04 (Noble):** pgpool2 4.3.7-1ubuntu4, universe repository. Architectures: amd64, arm64, armhf, ppc64el, riscv64, s390x. Packages: `pgpool2`, `libpgpool2`, `libpgpool-dev`, `postgresql-16-pgpool2`. Source: [packages.ubuntu.com/noble/pgpool2](https://packages.ubuntu.com/noble/pgpool2).

**Arch Linux:** No `pgpool` or `pgpool-ii` package exists in the official Arch Linux [extra] repository. The archriscv.felixc.at RISC-V port page for pgpool-ii was not confirmed (page inaccessible). Status: not available.

**PyPI:** No "pgpool-ii" package exists on PyPI (HTTP 404). Not applicable.

**What a user must do to get a working riscv64 binary:** On Debian sid or Ubuntu 24.04, `apt install pgpool2` installs a pre-built riscv64 binary with no additional steps. On other distributions, the user must build from source using the standard autotools procedure with a working riscv64 GCC and a riscv64 PostgreSQL installation (libpq-dev).

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| libpq (PostgreSQL) | Required. All connections pass through libpq. | Builds. PostgreSQL 18 lists riscv64 as supported. | Regression suite passes; JIT tests excluded. | Debian/Ubuntu ship `libpq-dev` for riscv64. No official PostgreSQL binary tarball for riscv64. | LLVM JIT disabled in distros on riscv64. Clang <=21 miscompiles under rv64gcv (fixed in Clang 22). Spinlock and CRC32C use slow generic fallbacks (performance, not correctness). See `project-reports/postgresql.md`. |
| OpenSSL (libssl, libcrypto) | Optional (`--with-openssl`). TLS for client and backend connections. Requires >=1.0.2. | Builds. Dedicated `linux64-riscv64` target since OpenSSL 3.0. 13 riscv64-specific CI configurations upstream. Requires Binutils >=2.38 for Zvk assembly. | CI passes on riscv64 QEMU. Flaky `test_lhash` failure on `linux-riscv64` runners (issue #30880, open). | Debian/Ubuntu ship `libssl-dev`/`libssl3` for riscv64. | **Security gap:** AES T-table fallback on hardware without Zkne/Zvkned is not constant-time (issues #20980, #25334, open). PRs #31080/#31082 pending. Logic bug in `rv64i_zkne_set_encrypt_key` (issue #30330) causes incorrect null-key check on hardware with Zkn. Cross-compile with `no-deprecated` fails on riscv64 (issue #29357). See `project-reports/openssl.md`. |
| libmemcached | Optional (`--with-memcached`). In-memory query cache backend. | Portable C. Debian builds pass on riscv64. No upstream riscv64 CI. | No upstream riscv64 CI. Arch Linux RISC-V reports `check() failed` (FTBFS) on riscv64. | Debian ships `libmemcached-dev` for riscv64. | Test suite instability on riscv64 (Arch RISC-V report). Does not block core Pgpool-II functionality; query cache is an optional feature. See `project-reports/memcached.md`. |
| Linux-PAM (libpam) | Optional (`--with-pam`). PAM authentication. | Portable C. Debian builds pass. | No upstream riscv64 CI. No riscv64 issues in `linux-pam/linux-pam`. | Debian ships `libpam0g-dev` for riscv64. | None identified. |
| OpenLDAP (libldap) | Optional (`--with-ldap`). LDAP authentication. | Portable C. No known riscv64 build failures. | No upstream riscv64 CI. Debian builds pass. | Debian ships `libldap-dev` for riscv64. | None identified. |
| glibc (libcrypt) | Required. `AC_CHECK_LIB(crypt)` for legacy password hashing. | glibc has full riscv64 support (tier 1 since 2018). | glibc riscv64 CI is upstream. | Ships in all riscv64 Linux distributions. | None. See `project-reports/glibc.md`. |

**Critical dependency note:** The only significant riscv64 risk for a Pgpool-II deployment is the OpenSSL AES constant-time gap (issues #20980, #25334, #30330) affecting TLS-enabled connections on hardware without Zkne/Zvkned extensions. The majority of deployed riscv64 silicon as of this report (SG2042, TH1520, JH7110, SpacemiT K1) lacks these extensions. This is a runtime security concern for `--with-openssl` deployments, not a build or functional correctness issue in Pgpool-II itself.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | riscv64-specific? | Notes |
|---|---|---|---|---|---|
| [#124](https://github.com/pgpool/pgpool2/issues/124) | 4.6.X build issue against GCC 15 | Open | High (build failure) | No (cross-arch) | `typedef char bool` conflicts with C23. Affects any arch building with GCC 15 + `-std=c23`. Assigned to Bo Peng. |
| [#130](https://github.com/pgpool/pgpool2/issues/130) | Severely degraded performance in geo-distributed configs | Open | Medium | No | 20x performance degradation in multi-region setups; each SQL incurs ~20ms cross-region latency. Architecture-independent. Assigned to Bo Peng. |
| [#165](https://github.com/pgpool/pgpool2/issues/165) | Performance optimization points | Open | Medium | No | Flame graph from BenchmarkSQL identifies bottlenecks: `select()` 4.37% CPU, `pool_flush()` 5.48%+. Proposes: enlarge read buffer from 1024 to 2048, replace `select()` with `epoll()`. Assigned to Tatsuo Ishii. |
| [#106](https://github.com/pgpool/pgpool2/issues/106) | 4.6.1 fails on big-endian s390x | Closed | N/A for riscv64 | No | Big-endian regression fixed before 4.6.2. RISC-V is little-endian; not applicable. |

**Correctness bugs on riscv64:** None. Zero riscv64-specific correctness issues exist in the pgpool/pgpool2 issue tracker.

**No benchmark data is available** for Pgpool-II on riscv64. No published papers, blog posts, RISE Project blog entries, or third-party benchmark studies were found covering this combination. Data not available: quantitative throughput/latency comparison of Pgpool-II on riscv64 vs. amd64 or arm64.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. No upstream discussion of riscv64 has ever occurred.

**Technical blockers:** None in Pgpool-II itself. The software is pure C with no architecture-specific code paths. It builds and runs on riscv64 with a standard C toolchain.

**Organizational blockers:** The upstream project (SRA OSS K.K.) has shown no interest in formally supporting or testing RISC-V. Patches via the pgpool-hackers mailing list are accepted, but there is no mechanism to submit PRs via GitHub. Adding riscv64 CI would require either upstream adoption of GitHub Actions (none currently exist for any architecture) or SRA OSS K.K. setting up their own CI infrastructure. Neither is underway.

**Acceptance probability for riscv64-related patches:** High for pure portability fixes (the project accepts any fix that does not break existing platforms). Low for CI infrastructure additions (the project has no CI at all and no apparent interest in adding it).

---

## 13. Investment Analysis

### 13.1 Functional Enablement

No work required. Pgpool-II builds and runs correctly on riscv64. Debian and Ubuntu ship functional riscv64 binary packages. The code is architecture-agnostic.

### 13.2 Performance Optimization

No SIMD or architecture-specific performance work is applicable to Pgpool-II. The software is I/O bound. Performance gaps relative to amd64 or arm64 do not exist at the Pgpool-II code level. The open performance issues (#130, #165) are topology-driven and architecture-independent; addressing them would benefit all platforms equally. These are candidates for general upstream contribution, not riscv64-specific work.

### 13.3 CI/CD Infrastructure

The upstream project has zero CI infrastructure for any architecture. Adding riscv64 CI to a project with no CI at all would require adding the CI framework first. This is upstream infrastructure work that SRA OSS K.K. has not prioritized. Alternatively, a downstream CI job (e.g., in Debian's autopkgtest or a RISE-funded runner) could provide riscv64 regression coverage without upstream involvement.

The GCC 15 C23 bool typedef bug (#124) needs to be fixed before riscv64 builds on GCC 15 distributions become reliable. This is a one-line fix appropriate for an upstream mailing list patch.

### 13.4 Ecosystem Enablement

Not applicable. Pgpool-II has no dependent package ecosystem requiring separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required | 0 | N/A | N/A |
| Bug fix | Fix GCC 15 C23 bool typedef (#124); submit patch to pgpool-hackers | 0.25 | Upstream contributor | High |
| CI/CD | Add riscv64 autopkgtest job in Debian (downstream, no upstream action required) | 1 | Debian packager (Christoph Berg) or RISE | Medium |
| CI/CD | Add GitHub Actions CI to upstream pgpool/pgpool2 (all arches, including riscv64) | 2-3 | SRA OSS K.K. or external contributor via mailing list | Low (upstream shows no interest) |
| Performance | Upstream `epoll()` replacement and buffer enlargement (#165) -- benefits all arches | 2-4 | Upstream contributor | Low |
| Security | OpenSSL AES constant-time gap on riscv64 without Zkne -- tracked in OpenSSL project, not Pgpool-II | 0 (Pgpool-II) | OpenSSL team | High (track, do not fix here) |

**Total Pgpool-II-specific investment required for riscv64 production readiness:** 0.25 person-weeks (GCC 15 bug fix). Everything else is either already done (functional support via Debian/Ubuntu), tracked in a dependency project (OpenSSL), or discretionary (CI infrastructure).

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [pgpool/pgpool2 GitHub repository](https://github.com/pgpool/pgpool2)
- [Pgpool-II homepage](https://www.pgpool.net/)
- [Debian tracker for pgpool2](https://tracker.debian.org/pkg/pgpool2)
- [Debian packages.debian.org - pgpool2 sid](https://packages.debian.org/sid/pgpool2)
- [Debian buildd status - pgpool2 sid](https://buildd.debian.org/status/package.php?p=pgpool2&suite=sid)
- [Ubuntu packages.ubuntu.com - pgpool2 noble](https://packages.ubuntu.com/noble/pgpool2)
- [pgpool/pgpool2 issue #124 - GCC 15 C23 bool typedef conflict](https://github.com/pgpool/pgpool2/issues/124)
- [pgpool/pgpool2 issue #130 - Geo-distributed performance degradation](https://github.com/pgpool/pgpool2/issues/130)
- [pgpool/pgpool2 issue #165 - Performance optimization points](https://github.com/pgpool/pgpool2/issues/165)
- [pgpool/pgpool2 issue #106 - Big-endian s390x failure in 4.6.1 (closed)](https://github.com/pgpool/pgpool2/issues/106)
- [RISE Project homepage](https://riseproject.dev/)
- [OpenSSL issue #20980 - AES T-table not constant-time](https://github.com/openssl/openssl/issues/20980)
- [OpenSSL issue #25334 - AES constant-time gap on riscv64](https://github.com/openssl/openssl/issues/25334)
- [OpenSSL issue #30330 - rv64i_zkne_set_encrypt_key null-key logic bug](https://github.com/openssl/openssl/issues/30330)
- [OpenSSL issue #30880 - Flaky test_lhash on linux-riscv64](https://github.com/openssl/openssl/issues/30880)