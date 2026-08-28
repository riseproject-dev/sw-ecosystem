---
title: PostgreSQL
categories:
  - databases
---

# PostgreSQL

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for PostgreSQL<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

PostgreSQL is a community-governed, BSD-licensed relational database server. Development is coordinated by the PostgreSQL Global Development Group through the [pgsql-hackers mailing list](https://www.postgresql.org/list/pgsql-hackers/). There is no foundation in the Apache or Linux Foundation sense. The project has a Core Team of 7 members and 31 committers with push access. The latest stable release is 18.4; 19beta1 is in pre-release.

**Core Team members and known corporate affiliations:**

| Name | Employer |
|---|---|
| Peter Eisentraut | EDB (EnterpriseDB) |
| Andres Freund | Microsoft |
| Magnus Hagander | Redpill Linpro |
| Jonathan Katz | Databricks |
| Tom Lane | Snowflake Inc |
| Bruce Momjian | EDB (EnterpriseDB) |
| Dave Page | pgEdge |

EDB holds 2 of 7 Core Team seats. Microsoft and Snowflake each hold one seat. No chip vendor holds a Core Team seat.

PostgreSQL has no GitHub issue tracker. All development occurs on the [pgsql-hackers mailing list](https://www.postgresql.org/list/pgsql-hackers/). There is no dedicated RISC-V tracking issue or meta-thread.

---

## 2. Port History and Upstreaming Timeline

The initial RISC-V port was introduced by a single commit in 2021:

- **Date:** 2021-08-13
- **Commit:** `c32fcac56a212b4e6bb5ba63596f60a25a18109a`
- **Committer:** Tom Lane (Snowflake)
- **Patch author:** Marek Szuba (Gentoo contributor)
- **Change:** Added RISC-V spinlock support in `src/include/storage/s_lock.h` using `GCC __sync_lock_test_and_set()`, which compiles to `AMOSWAP.W.AQ`. The patch was back-patched to all then-supported branches.

Notable: the commit message references a missing `arch-riscv.h` atomics file, which still does not exist as of mid-2026. The spinlock path used `__sync_lock_test_and_set` rather than a dedicated atomics header, meaning full native atomics were deferred.

Since 2021, all RISC-V-specific activity has been in-flight patch series on pgsql-hackers, none of which have been merged to master. The three active threads are documented in Section 11.

---

## 3. Upstream Support Tier

PostgreSQL has no formal Tier 1 / Tier 2 / Tier 3 classification. A platform is considered "supported" if: (a) the source contains provisions for it, and (b) it has recently built and passed regression tests on the [PostgreSQL Build Farm](https://buildfarm.postgresql.org/). New ports go through pgsql-hackers.

RISC-V (riscv64) is explicitly listed as a supported CPU architecture in the [PostgreSQL 18 supported platforms documentation](https://www.postgresql.org/docs/18/supported-platforms.html), alongside x86, PowerPC, S/390, SPARC, ARM, and MIPS. There is no dedicated platform-specific notes section for riscv64 in Chapter 17.7 (only Cygwin, macOS, MinGW, Solaris, and Visual Studio are covered with notes). The documentation states: "Platforms not covered here have no known platform-specific installation issues."

In practice, riscv64 is equivalent to the project's informal second tier: it builds and passes regression tests, has build farm coverage, and is documented as supported, but has no architecture-specific optimizations, no hand-tuned assembly, and no dedicated CI runners in the primary pipeline.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

PostgreSQL builds and runs on riscv64 entirely via generic C fallback paths. The following table summarizes architecture-specific coverage across the subsystems that matter for correctness and performance.

| Subsystem | Coverage | Gap Description |
|---|---|---|
| Spinlocks | Generic | No `#ifdef __riscv` block in `src/include/storage/s_lock.h`. RISC-V falls through to a semaphore-based slow path. All other supported architectures (x86, ARM, PowerPC, SPARC, S/390, MIPS) have hand-written inline asm. |
| Memory barriers | Generic (with known bug, now fixed) | No `arch-riscv.h` in `src/include/port/atomics/`. Only `arch-arm.h`, `arch-ppc.h`, `arch-x86.h` exist. RISC-V uses `generic-gcc.h` (`__atomic_thread_fence`). A correctness bug from LLVM reordering loads past this fence was confirmed in production (see Section 11, Bug 1). Fixed 2025-11-07, backpatched. A dedicated `arch-riscv.h` emitting `FENCE R,R` / `FENCE W,W` inline asm has been proposed but not merged. |
| Atomic operations (32/64-bit) | Generic | Same dispatch gap. All atomic ops use `generic-gcc.h` `__atomic_*` builtins. No LR/SC or AMO instruction paths exist in the PostgreSQL source tree. |
| Popcount | Missing | No RISC-V Zbb popcount. A patch (v4, Greg Burd) shows ~4x speedup and is under review. Not merged. |
| CRC32C | Missing | `pg_crc32c.h` dispatches to x86 SSE4.2, ARMv8, and LoongArch. RISC-V falls to the software slice-by-8 fallback. A patch (v4, Greg Burd, adapted from Google Abseil) shows ~2000x speedup via Zbc clmul and is under review. Not merged. |
| Architecture macros | Missing | No `PG_ARCH_RISCV` macro defined anywhere in the tree. A centralized architecture detection patch proposes `PG_ARCH_RISCV`, `PG_ARCH_RISCV_32`, `PG_ARCH_RISCV_64` in `c.h`/`pg_cpu.h`. Not merged; blocked by naming dispute (see Section 11, Thread 3). |
| SIMD dispatch | Not applicable | No architecture-specific SIMD dispatch for riscv64, or for any architecture other than x86 via checksum/SIMD headers in storage. |
| JIT (LLVM) | Disabled on riscv64 | PostgreSQL's LLVM JIT backend is disabled on riscv64 in all major distributions. Root cause: segfaults on riscv64 under the distribution-packaged LLVM backend. Confirmed disabled in Debian trixie packages and in `docker-library/postgres` PR #1345 (merged 2025-06-09). No pgsql-hackers thread exists on riscv64 JIT enablement. |
| Assembly files | Not applicable | No `.S` assembly files exist anywhere in the PostgreSQL source tree for any architecture. |

The GNU autoconf boilerplate files (`config/config.guess`, `config/config.sub`) recognize `riscv32`, `riscv32be`, `riscv64`, `riscv64be` as valid Linux build targets (lines 1174 and 1397-1401). This is upstream GNU config, not PostgreSQL-authored RISC-V code.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Compiler Requirements

**Officially documented minimums:**
- C standard: C99 minimum; configure probes for C11 with `-std=gnu11` / `-std=c11`
- GCC: "Recent versions recommended" -- no specific floor documented
- Clang: No minimum stated for basic builds; LLVM 14 minimum required only when enabling `--with-llvm` / `-Dllvm=enabled`
- Meson: 0.57.2 minimum
- Autoconf (maintainers only): exactly 2.69

**Effective versions in use on riscv64 (from build farm evidence):**
- GCC 13.3.0 (mollusk, Ubuntu 24.04)
- GCC 14 (boomslang/copperhead, Debian 13 Trixie)
- Clang 22.1.6 (greenfly, Ubuntu 24.04)

**Critical Clang version constraint (riscv64-specific):** Clang versions 20.x and 21.x contain a confirmed miscompilation bug in the RISC-V vector (RVV) backend's LoopVectorize pass (see Section 11, Bug 2). Clang 22.1.6 is the first confirmed-correct version. If building with `rv64gcv` and Clang, Clang < 22 must not be used. An in-progress patch adds a configure/meson check enforcing `__clang_major__ >= 22` for RISC-V V-extension builds.

### 5.2 Autoconf Native Build

```bash
./configure \
  --prefix=/usr/local/pgsql \
  --with-pgport=5432 \
  --with-system-tzdata=/usr/share/zoneinfo \
  --enable-thread-safety
```

### 5.3 Autoconf Cross-Compilation (x86-64 host to riscv64)

```bash
mkdir build-riscv64 && cd build-riscv64
/path/to/postgres/source/configure \
  --host=riscv64-linux-gnu \
  --build=x86_64-linux-gnu \
  CC=riscv64-linux-gnu-gcc \
  CXX=riscv64-linux-gnu-g++ \
  --with-system-tzdata=/usr/share/zoneinfo \
  --without-readline \
  --without-icu \
  --disable-rpath
make -j$(nproc)
```

`--with-system-tzdata` is called out in official documentation as enabling more straightforward cross-compilation by avoiding the need to execute host binaries during the timezone database build.

### 5.4 Meson Native Build

```bash
meson setup build \
  --prefix=/usr/local/pgsql \
  --buildtype=debugoptimized \
  -Dssl=openssl \
  -Dicu=enabled \
  -Dsystem_tzdata=/usr/share/zoneinfo
ninja -C build
ninja -C build install
```

### 5.5 Meson Cross-Compilation

No PostgreSQL-maintained meson cross-file for riscv64 exists in the upstream source tree. The following cross-file is derived from Meson cross-compilation documentation and build farm evidence:

`/etc/meson/cross/linux-riscv64.ini`:
```ini
[binaries]
c = 'riscv64-linux-gnu-gcc'
cpp = 'riscv64-linux-gnu-g++'
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'
pkgconfig = 'riscv64-linux-gnu-pkg-config'
exe_wrapper = 'qemu-riscv64-static'

[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'
```

Then:
```bash
meson setup build \
  --cross-file /etc/meson/cross/linux-riscv64.ini \
  --prefix=/usr/local/pgsql \
  -Dsystem_tzdata=/usr/share/zoneinfo \
  -Dllvm=disabled \
  -Dbonjour=disabled
ninja -C build
```

### 5.6 Flags to Disable on riscv64

| Meson flag | configure equivalent | Reason |
|---|---|---|
| `-Dllvm=disabled` | `--without-llvm` | JIT disabled on riscv64 due to segfaults in distro LLVM backends |
| `-Dbonjour=disabled` | `--without-bonjour` | macOS-only feature |
| `-Dtap_tests=disabled` | N/A | TAP tests require QEMU `exe_wrapper` setup for cross-compiled binaries |

### 5.7 Container / Dockerfile

No official PostgreSQL-maintained Dockerfile for riscv64 exists in `postgres/postgres` or in `anarazel/pg-vm-images`. The `docker-library/postgres` official image supports `linux/riscv64` via Docker multi-arch builds using QEMU emulation, based on the Debian/Ubuntu riscv64 base image. The Dockerfile is not riscv64-specific.

The `anarazel/pg-vm-images` CI infrastructure uses a multi-stage `docker/linux_debian_ci` Dockerfile with stages (`base`, `normal`, `linux-meson-64`, etc.) and a `scripts/linux_debian_install_deps.sh` script that contains no riscv64-specific handling.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Spinlock inline asm | Yes (x86 LOCK XCHG) | Yes | No (semaphore fallback) |
| Memory barrier inline asm | Yes (arch-x86.h) | Yes (arch-arm.h) | No (generic-gcc.h __atomic) |
| Native atomics header | Yes | Yes | No (generic-gcc.h) |
| Hardware popcount | Yes (SSE4.2 POPCNT) | Yes (ARMv8 VCNT) | No (patch pending) |
| Hardware CRC32C | Yes (SSE4.2) | Yes (ARMv8) | No (patch pending, Zbc) |
| LLVM JIT | Yes | Yes | No (disabled; segfaults) |
| Native CI runners | Yes | Yes | No |
| QEMU CI coverage | No | No | No (proposed, not implemented) |
| Build farm coverage | Yes | Yes | Yes (4 workers) |
| Distribution packages | Yes | Yes | Yes |

Summary: riscv64 has binary parity (the database builds and runs) but no performance parity. Every architecture-specific optimization present for arm64 and amd64 is absent for riscv64.

---

## 7. CI/CD Infrastructure

### 7.1 Primary CI (GitHub Actions)

The `.github/workflows/pg-ci.yml` file (1,275 lines) defines jobs exclusively targeting:
- Linux x86_64 and i386 on `ubuntu-24.04`
- macOS on `macos-15`
- Windows on `windows-2022`

The only cross-compilation present is MinGW x86-64 Windows. There are zero references to `riscv64`, `riscv`, or `QEMU` anywhere in the file. No riscv64 CI exists in the primary pipeline.

Source: [pg-ci.yml](https://raw.githubusercontent.com/postgres/postgres/master/.github/workflows/pg-ci.yml)

### 7.2 QEMU Proposal (not implemented)

On 2026-04-14, Thomas Munro posted to pgsql-hackers proposing QEMU images for RISC-V (and other architectures) as a CI alternative following the Cirrus CI shutdown. This is a mailing list proposal only. No such job has been added to the CI configuration.

Source: [Thomas Munro, 2026-04-14](https://www.postgresql.org/message-id/CA+hUKGL_cWRzY9aA+FgfUPhdd0CciB-qOoGdnduFu6mPiNDxsQ@mail.gmail.com)

### 7.3 PostgreSQL Build Farm

The [PostgreSQL Build Farm](https://buildfarm.postgresql.org/) is a distributed self-hosted CI system where volunteers run workers on their own hardware. Four active riscv64 workers are registered and reporting:

| Worker | OS | Compiler | Branches | Owner |
|---|---|---|---|---|
| boomslang | Debian 13 Trixie | GCC 14 | master through REL_13_STABLE | pgbf@twiska.com |
| copperhead | Debian 13 Trixie | GCC 14 | master through REL_13_STABLE | pgbf@twiska.com |
| greenfly | Ubuntu 24.04.4 LTS | Clang 22.1.6 | master through REL_13_STABLE | greg@burd.me |
| mollusk | Ubuntu 24.04.4 LTS | GCC 13.3.0 | master, REL_18, REL_17 | Data not available: owner email not recorded in research findings |

All four workers report as current (0-1 days lag). `boomslang` and `copperhead` share the same owner and appear to be a coordinated pair. `greenfly` was approved 2025-08-29 [NEEDS VERIFICATION] and runs Clang 22.1.6, the first version without the RISC-V LoopVectorize miscompilation bug.

Source: [Build Farm riscv64 members](https://buildfarm.postgresql.org/cgi-bin/show_members.pl?os=Linux&arch=riscv64)

**Assessment:** Build farm coverage is broad (4 workers, 2 compilers, 2 distros, all supported branches) but is entirely dependent on volunteer-owned hardware. There is no organizationally owned riscv64 CI capacity. The absence of JIT-enabled testing means no regressions in LLVM code generation paths will be caught.

---

## 8. Distribution and Release Status

PostgreSQL upstream distributes source-only tarballs. Binary packaging is entirely handled by distributions.

| Distribution | riscv64 Present | Version | Notes |
|---|---|---|---|
| Upstream (postgresql.org) | N/A (source only) | 18.4 stable, 19beta1 | No binary releases for any architecture |
| Debian trixie (stable) | Yes | 17.10-0+deb13u1 | `postgresql-17_17.10-0+deb13u1_riscv64.deb`, 6.6 MB, HTTP 200, SHA256 `0cf3b6ed941c2c6aed607161b9ada99308ec66f7902b2cf20c2bbb421ab1303e`. Ports archive. JIT (LLVM) disabled. |
| Ubuntu 24.04 Noble | Yes | 16.14-0ubuntu0.24.04.1 | Ports archive, universe. JIT (LLVM) disabled on riscv64. |
| Arch Linux RISC-V | Yes | 18.4-1 | `postgresql-18.4-1-riscv64.pkg.tar.zst`, packages `postgresql`, `postgresql-docs`, `postgresql-ip4r`, and several Haskell/language bindings. This is the latest upstream stable release. |
| Debian sid (unstable) | No compiled binary confirmed | N/A | `postgresql_18+292_all.deb` exists but is architecture-independent (`_all`). No riscv64 compiled package found for `postgresql-17` in sid. |
| PyPI | Not applicable | N/A | PyPI distributes no PostgreSQL server binaries for any architecture. The `postgresql` PyPI package does not exist (HTTP 404). |

The LLVM JIT is explicitly disabled in all confirmed riscv64 packages. The Debian disable reason (recorded in `docker-library/postgres` PR #1345, merged 2025-06-09) is: "still segfaulting." Architectures excluded from JIT in that PR: i386, loong64, riscv64.

---

## 9. Dependencies

The following table covers all significant PostgreSQL build and runtime dependencies. "Green" means builds and passes tests on riscv64 with no known correctness blockers. Blocking issues are noted inline; see the relevant ecosystem status report for full details where one exists.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| OpenSSL | TLS/SSL connections; optional but enabled by default in all production distro packages | Green | Mostly green | Green | AES T-table implementation is not constant-time on hardware without Zkn or Zvkned extensions. This applies to the majority of current riscv64 silicon (SG2042, TH1520, JH7110, SpacemiT K1). Key material leaks via cache timing on those platforms. PRs #31080 and #31082 open. See `project-reports/openssl.md`. |
| Python (CPython) | PL/Python procedural language; optional | Green | Mostly green | Green (distro only) | Stack unwinding broken in Python 3.15 betas on riscv64 (issues #150919, #151040). riscv64 buildbot broken since March 2026. No JIT. See `project-reports/python.md`. |
| glibc / libm / pthreads | C runtime (required), math library (required), threading (required) | Green | Green | Green | No blocking issues. hwprobe prototype bug (BZ#32932) fixed May 2025; vector register syscall clobber fixed September 2025. See `project-reports/glibc.md`. |
| LLVM | JIT query compilation; optional | Green | Mostly green | Green | No PostgreSQL-specific LLVM riscv64 blockers at the library level. riscv64 backend is LLVM Tier 2. Disabled in all distro PostgreSQL packages due to segfaults. See `project-reports/lldb.md`. |
| zlib | WAL and network compression; optional, default on | Green | Green | Green | No correctness blockers. No RVV/SIMD path; performance gap vs arm64/x86-64. |
| ICU | Unicode collation and locale-aware text; optional, default on | Green | Green | Green | None. |
| LZ4 | WAL and table LZ4 compression; optional | Green | Green | Green | None. |
| zstd | WAL and table ZSTD compression; optional | Green | Green | Green | Performance only: 4-way decompression loop disabled on riscv64 ([zstd#4622](https://github.com/facebook/zstd/issues/4622)). Not a correctness blocker. |
| readline | psql interactive line editing; optional, default on | Green | Green | Green | None. |
| libxml2 | XML data type; optional | Green | Green | Green | None. |
| libxslt | XSLT in contrib/xml2; optional | Green | Green | Green | None. |
| libcurl | OAuth/libpq-oauth; optional, Linux-only | Green | Green | Green | None. |
| liburing | io_uring async I/O; optional | Green | Green | Green | None. io_uring is well-supported on riscv64 kernels >= 5.1. |
| libnuma | NUMA memory allocation; optional | Green | Mostly green | Green | None. NUMA topology is sparse on current riscv64 hardware; library itself has no riscv64 gaps. |
| GSSAPI / Kerberos | Kerberos authentication; optional | Green | Green | Green | None. |
| PAM | PAM authentication; optional | Green | Green | Green | None. |
| LDAP | LDAP authentication; optional | Green | Green | Green | None. |
| UUID (bsd/e2fs/ossp variants) | contrib/uuid-ossp; optional | Green | Green | Green | None. |
| Perl | Build-time parser and catalog generation; required at build | Green | Green | Green | Build-time only; no runtime impact. |
| flex / bison | Build-time parser generation | Green | Green | Green | Build-time only. |

**Critical dependency note:** The highest-severity riscv64 issue in the dependency chain is the OpenSSL AES T-table constant-time gap. Any riscv64 PostgreSQL deployment using TLS on hardware without Zkn or Zvkned (which is the majority of current riscv64 deployments) operates with a non-constant-time AES fallback that is vulnerable to cache-timing key extraction. This is an OpenSSL issue, not a PostgreSQL issue, but it affects the security posture of any riscv64 PostgreSQL server.

---

## 10. Ecosystem Status

### 10.1 RISE Project

PostgreSQL is not a RISE Project member and has no RISE-funded work. A full crawl of all 27 RISE blog posts (May 2024 to June 2026) found zero PostgreSQL-focused articles. All 16 funded RFPs (RP001-RP016) were reviewed; none involve PostgreSQL or any database workload.

PostgreSQL appears in one RISE blog post ([RISE RISC-V Runners: Six Weeks In, May 12 2026](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)) as an internal infrastructure component: the RISE runner scheduler uses PostgreSQL as its coordination database. This is not ecosystem work.

Data not available: whether any RISE member company is running PostgreSQL on riscv64 in production. No such information was found in any searched source.

### 10.2 Hardware Context

Greg Burd's build farm worker `greenfly` runs on an OrangePi RV2 (VisionFive 2 CPU, RV64GC+Zba/Zbb/Zbc/Zbs). His patch series references Scaleway and Milk-V Pioneer as cloud/server platforms with riscv64 availability. No benchmark data comparing PostgreSQL throughput across riscv64 hardware platforms was found.

Data not available: PostgreSQL TPS benchmarks (pgbench) comparing riscv64 vs arm64 vs x86-64. No such data was found in PostgreSQL mailing list archives, RISE Project blog, or openbenchmarking.org (HTTP 403).

### 10.3 Language Ecosystem (Drivers and ORMs)

Data not available: riscv64 status of PostgreSQL client drivers (psycopg2, psycopg3, libpq, JDBC) and ORM layers. No research was conducted on these components.

---

## 11. Known Bugs and Active Issues

### Bug 1: IO in wrong state on riscv64 -- RESOLVED (2025-11-07)

- **Type:** Correctness / data integrity crash
- **Severity:** Critical (assertion failure, data access failure)
- **Environment:** riscv64, Debian Trixie, kernel 6.11.10-riscv64, Clang 19.1.4; reproduced on `qemu-system-riscv64`
- **Symptom:** Assertion failure `IO in wrong state: 0` during full-text search queries
- **Root cause:** `pgaio_io_wait()` had no compiler barrier. LLVM's `MachineSink` optimization moved load instructions past `__atomic_thread_fence()` calls. RISC-V's relaxed memory model (unlike x86 TSO) exposed the race. The problem also reproduced on MIPS and LoongArch; not RISC-V-specific.
- **Fix:** Commit [`c5d34f4`](https://github.com/postgres/postgres/commit/c5d34f4) ("Fix generic read and write barriers for Clang", Thomas Munro, 2025-11-07). Inserted `pg_compiler_barrier_impl()` before `__atomic_thread_fence()` in `src/include/port/atomics/generic-gcc.h`. Backpatched to PostgreSQL 13.
- **Remaining work noted by Thomas Munro:** (1) A dedicated `arch-riscv.h` should be written to emit `FENCE R,R` / `FENCE W,W` inline asm rather than relying on the generic path. (2) RISC-V should declare `PG_HAVE_8BYTE_SINGLE_COPY_ATOMICITY` with a citation to the ISA spec. Neither item has been implemented.
- **Key participants:** Thomas Munro, Andres Freund, Alexander Lakhin, Tom Lane, Greg Burd
- **Sources:** [Initial report 2025-10-12](https://www.postgresql.org/message-id/CA+hUKG+JXKG=+U=demYXu0mVdhP3-ndf0gCk9LqRkZ03yh9qrw@mail.gmail.com), [Fix committed 2025-11-07](https://www.postgresql.org/message-id/CA+hUKGJt82c69MwXwxCnYJTJadMmmtVqeZnApQCJPoVyOOZR1A@mail.gmail.com)

---

### Thread 1: Add RISC-V Zbb popcount optimization (3-patch series) -- OPEN

- **Status:** Open, not merged. Latest: v4, 2026-05-27. Rebased and retested on 2026-06-01.
- **Patches (v4):** `v4-0001` (2.7 KB, DES Clang bug fix), `v4-0002` (11.4 KB, Zbb popcount), `v4-0003` (19.3 KB, Zbc CRC32C)
- **Author:** Greg Burd; **Reviewers:** Andres Freund, Nathan Bossart
- **Motivation:** Build farm machine `greenfly` (OrangePi RV2, RV64GC+Zba/Zbb/Zbc/Zbs)

**Patch 0001 (DES Clang miscompilation fix):** Clang 20 and 21 LoopVectorize generates incorrect code for indexed scatter-store loops (`dst[idx[i]-1] = i`) at `-O2 -march=rv64gcv`. The bug manifests in `crypt-des.c` `des_init()`. Without the fix, DES produces wrong results silently. Confirmed by Greg Burd with output showing 28 permutation table mismatches. Root cause traced to LLVM issues [#176001](https://github.com/llvm/llvm-project/issues/176001), [#187458](https://github.com/llvm/llvm-project/issues/187458), [#171978](https://github.com/llvm/llvm-project/issues/171978). Fixed in Clang 22, not backported to 21.x. The original workaround (`pg_memory_barrier()`, overhead 335%) was rejected; the agreed resolution is a configure/meson check requiring `__clang_major__ >= 22` for `rv64gcv` builds. This patch revision was pending as of 2026-06-01.

Compiler matrix for the raw miscompilation (from Greg Burd):
- Clang 20.1.2 at `-O2 -march=rv64gcv`: WRONG
- Clang 21.1.8 at `-O2 -march=rv64gcv`: WRONG
- Clang 22.1.6 at `-O2 -march=rv64gcv`: correct
- GCC at `-O2 -march=rv64gcv`: correct
- Any compiler at `-O1` or with `-fno-vectorize`: correct

**Patch 0002 (Zbb popcount):** Hardware popcount via `-march=rv64gc_zbb`. Measured speedup on `greenfly`:

| Method | Throughput |
|---|---|
| Software popcount (no Zbb, -O2) | 510.08 MB/s |
| Hardware path without `-march=rv64gc_zbb` | 341.48 MB/s (slower than SW) |
| Hardware path with `-march=rv64gc_zbb` | 2279.89 MB/s (~4.15x vs SW) |

Andres Freund questioned whether PostgreSQL workloads are actually bottlenecked by popcount on riscv64. Discussion ongoing.

**Patch 0003 (Zbc CRC32C):** Adapted from [Google Abseil `absl/crc/internal/crc_riscv.cc`](https://github.com/abseil/abseil-cpp). Requires Zbc/Zbkc (`clmul` instruction). Measured speedup: GCC ~2004x (154 MB/s to 308,052 MB/s), Clang ~1807x. CRC32C test vector validated (`"123456789"` = `0xE3069283`).

- **Sources:** [Initial, 2026-03-22](https://www.postgresql.org/message-id/ec81011b-c502-4702-b041-e4bdd2aa346f@app.fastmail.com), [v3 with DES fix, 2026-03-27](https://www.postgresql.org/message-id/038b2469-776f-404b-ad7e-e85f45da2166@app.fastmail.com), [v4 rebase, 2026-05-27](https://www.postgresql.org/message-id/3a222ec2-01bb-4798-99e2-eedaf6cae19b@app.fastmail.com), [DES root cause, 2026-06-01](https://www.postgresql.org/message-id/d15fe767-e6d1-488e-915a-42794be2cb12@app.fastmail.com)

---

### Thread 2: Centralised architecture detection -- OPEN

- **Status:** Open, not merged. Latest reply: Tom Lane, 2026-06-03.
- **Author:** Thomas Munro (reviving a 2-year-old patch); Co-author: Dagfinn Ilmari Mannsaker
- **Patches:** `0001-Remove-IRIX-remnant.patch` (901 bytes), `0002-Standardize-macros-for-detecting-architectures.patch` (14.1 KB)
- **Scope:** Unified `PG_ARCH_*` macros in `c.h`/`pg_cpu.h` to replace ad-hoc preprocessor checks. Proposes `PG_ARCH_RISCV`, `PG_ARCH_RISCV_32`, `PG_ARCH_RISCV_64`.
- **Immediate motivation:** A Visual Studio bug caused silent x86 detection failure, causing `pg_read/write_barrier()` to fall back to full memory barriers, `pg_spin_delay()` to do nothing, and `PG_HAVE_8BYTE_SINGLE_COPY_ATOMICITY` to be undefined.
- **Blocker:** Tom Lane (2026-06-03) objects to a custom namespace: "why should we invent our own instead of standardizing on gcc's spellings (that is, `__x86_64__` etc)." No resolution as of latest activity.
- **Sources:** [Munro proposal, 2026-04-09](https://www.postgresql.org/message-id/CA+hUKGL8Hs-phHPugrWM=5dAkcT897rXyazYzLw-Szxnzgx-rA@mail.gmail.com), [Tom Lane objection, 2026-06-03](https://www.postgresql.org/message-id/3100002.1780514662@sss.pgh.pa.us)

---

## 12. Objections and Upstream Blockers

**Andres Freund (Microsoft / PostgreSQL Core Team), reviewing Thread 1 (Zbb popcount):**
> "there's afaict not yet a whole lot of riscv production adoption"

This is the canonical upstream objection to riscv64 optimization work: insufficient production deployment justifies the complexity and review burden. This objection is on record from a Core Team member with commit access. It is not a hard block -- Greg Burd has continued submitting revisions -- but it establishes the review bar.

**Tom Lane (Snowflake / PostgreSQL Core Team), on Thread 2 (arch macros):**
Objects to the `PG_ARCH_*` naming scheme in favor of using GCC's built-in spellings directly. This blocks a patch that is a prerequisite for cleaner architecture-specific dispatch, including for riscv64.

**No upstream policy objection to riscv64 as a supported platform exists.** The architecture was committed by a Core Team member (Tom Lane) in 2021, is in the supported platforms documentation, and has active build farm coverage. The objection is to the pace and complexity of new optimizations.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

PostgreSQL is functionally complete on riscv64. It builds, runs, and passes the full regression test suite. The one confirmed correctness bug (IO wrong state, memory barrier reordering) has been fixed and backpatched. No functional gap prevents running a PostgreSQL database server on riscv64 hardware today.

The only pending functional item is the Clang miscompilation bug fix (Thread 1, patch 0001), which requires a configure/meson guard preventing use of `rv64gcv` with Clang < 22. This is a narrow, low-risk fix.

### 13.2 Performance Optimization

All architecture-specific optimizations present on arm64 and amd64 are absent on riscv64. The measured gaps from open patches are:

| Subsystem | Measured Gap | Status |
|---|---|---|
| Popcount (Zbb) | ~4x slower than hardware-accelerated | Patch v4 pending, under reviewer skepticism |
| CRC32C (Zbc) | ~2000x slower than hardware-accelerated | Patch v4 pending, under reviewer skepticism |
| Spinlocks | Uses semaphore fallback instead of AMOSWAP inline asm | No patch; original spinlock used __sync builtin |
| Memory barriers | Uses generic __atomic_thread_fence; arch-riscv.h with FENCE R,R / FENCE W,W not written | No patch |
| JIT (LLVM) | Disabled; segfaults in distro LLVM backends | No patch; no pgsql-hackers thread |

The CRC32C gap is the most significant for PostgreSQL workloads: CRC32C is used for WAL integrity checking on every write. A ~2000x software-to-hardware speedup means that on hardware with Zbc, WAL write throughput is currently dominated by software CRC32C computation.

The JIT gap affects analytical workloads. There is no active upstream effort to re-enable JIT on riscv64.

### 13.3 CI/CD Infrastructure

The only riscv64 CI coverage consists of 4 volunteer-owned build farm workers. This is a single-point-of-failure structure: if those volunteers' hardware goes offline, there is zero riscv64 coverage. There is no organizational ownership of any riscv64 CI capacity in the PostgreSQL project.

A QEMU-based riscv64 CI job was proposed to pgsql-hackers in April 2026 (after Cirrus CI shutdown) but has not been implemented.

### 13.4 Ecosystem Enablement

No RISE-funded work targets PostgreSQL. No major chip vendor has publicly committed to PostgreSQL riscv64 investment. The build farm work is driven by one individual (Greg Burd, `greg@burd.me`) who owns both the primary Clang worker (`greenfly`) and the CRC32C/Zbb patch series.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Merge Clang miscompilation guard (configure/meson check for Clang >= 22 on rv64gcv); resolve approach with Andres Freund and Nathan Bossart | 1 | External contributor (Greg Burd active) | Critical |
| Functional | Write `arch-riscv.h` with `FENCE R,R` / `FENCE W,W` inline asm and `PG_HAVE_8BYTE_SINGLE_COPY_ATOMICITY` declaration (noted as remaining work after Bug 1 fix) | 2 | No current owner | High |
| Functional | Unblock and merge centralized `PG_ARCH_RISCV` macro patch (resolve Tom Lane's naming objection) | 1 | No current owner | Medium |
| Performance | Merge Zbc CRC32C optimization (Zbc/Zbkc required; ~2000x on WAL path); address Andres Freund's adoption-skepticism with production data | 3 | External contributor (Greg Burd active) | High |
| Performance | Merge Zbb popcount optimization | 1 | External contributor (Greg Burd active) | Medium |
| Performance | Write `s_lock.h` RISC-V spinlock (AMOSWAP inline asm); currently falls back to semaphore path | 2 | No current owner | Medium |
| Performance | Investigate and fix LLVM JIT segfaults on riscv64; re-enable JIT in distribution packages | 8 | No current owner | Low |
| CI/CD | Add QEMU-based riscv64 emulation job to `.github/workflows/pg-ci.yml` (proposal exists; no implementation) | 2 | No current owner | High |
| CI/CD | Establish organizationally owned riscv64 build farm worker with Clang (reduces single-contributor dependency) | 1 | No current owner | High |
| Ecosystem | Publish riscv64 pgbench TPS benchmarks vs arm64 and x86-64 to counter Andres Freund's adoption-skepticism argument | 2 | No current owner | High |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [PostgreSQL 18 Supported Platforms](https://www.postgresql.org/docs/18/supported-platforms.html)
- [PostgreSQL 18 Installation Requirements](https://www.postgresql.org/docs/18/install-requirements.html)
- [PostgreSQL 18 Meson Build Options](https://www.postgresql.org/docs/18/install-meson.html)
- [PostgreSQL 18 Autoconf/Make Build](https://www.postgresql.org/docs/18/install-make.html)
- [PostgreSQL 18 Platform Notes](https://www.postgresql.org/docs/18/installation-platform-notes.html)
- [PostgreSQL Build Farm riscv64 members](https://buildfarm.postgresql.org/cgi-bin/show_members.pl?os=Linux&arch=riscv64)
- [PostgreSQL Build Farm status](https://buildfarm.postgresql.org/cgi-bin/show_status.pl)
- [postgres/postgres GitHub mirror](https://github.com/postgres/postgres)
- [commit c5d34f4 -- Fix generic read and write barriers for Clang](https://github.com/postgres/postgres/commit/c5d34f4)
- [Thread 1 initial -- Add RISC-V Zbb popcount optimization, 2026-03-22](https://www.postgresql.org/message-id/ec81011b-c502-4702-b041-e4bdd2aa346f@app.fastmail.com)
- [Thread 1 v3 -- DES fix added, 2026-03-27](https://www.postgresql.org/message-id/038b2469-776f-404b-ad7e-e85f45da2166@app.fastmail.com)
- [Thread 1 v4 -- rebase, 2026-05-27](https://www.postgresql.org/message-id/3a222ec2-01bb-4798-99e2-eedaf6cae19b@app.fastmail.com)
- [Thread 1 -- DES root cause final, 2026-06-01](https://www.postgresql.org/message-id/d15fe767-e6d1-488e-915a-42794be2cb12@app.fastmail.com)
- [Thread 2 -- IO in wrong state, initial report, 2025-10-12](https://www.postgresql.org/message-id/CA+hUKG+JXKG=+U=demYXu0mVdhP3-ndf0gCk9LqRkZ03yh9qrw@mail.gmail.com)
- [Thread 2 -- LLVM MachineSink identified, 2025-10-22 (Andres Freund)](https://www.postgresql.org/message-id/w3qc4gzqywinffeglpwyxbwocpsjvh3yqqy5d42zsqhciy3yr5@tb63f2ipdzrl)
- [Thread 2 -- proposed fix, 2025-10-22 (Thomas Munro)](https://www.postgresql.org/message-id/CA+hUKGLJHW7QjNGpfo+yKD6GzhdVnHxaSf0QJZp4VTu7jAt68A@mail.gmail.com)
- [Thread 2 -- fix committed, 2025-11-07](https://www.postgresql.org/message-id/CA+hUKGJt82c69MwXwxCnYJTJadMmmtVqeZnApQCJPoVyOOZR1A@mail.gmail.com)
- [Thread 3 -- Centralised architecture detection, Munro proposal, 2026-04-09](https://www.postgresql.org/message-id/CA+hUKGL8Hs-phHPugrWM=5dAkcT897rXyazYzLw-Szxnzgx-rA@mail.gmail.com)
- [Thread 3 -- Dagfinn review, 2026-04-09](https://www.postgresql.org/message-id/87pl482zr1.fsf@wibble.ilmari.org)
- [Thread 3 -- Tom Lane objection, 2026-06-03](https://www.postgresql.org/message-id/3100002.1780514662@sss.pgh.pa.us)
- [Thread 4 -- Cirrus CI shutdown / QEMU RISC-V CI proposal, 2026-04-14](https://www.postgresql.org/message-id/CA+hUKGL_cWRzY9aA+FgfUPhdd0CciB-qOoGdnduFu6mPiNDxsQ@mail.gmail.com)
- [pgsql-hackers RISC-V search](https://www.postgresql.org/search/?m=1&ln=pgsql-hackers&q=riscv)
- [Debian trixie postgresql-17 riscv64 download page](https://packages.debian.org/trixie/riscv64/postgresql-17/download)
- [Ubuntu noble postgresql-16](https://packages.ubuntu.com/noble/postgresql-16)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners: Six Weeks In, 2026-05-12](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [docker-library/postgres PR #1345 -- disable JIT on riscv64](https://github.com/docker-library/postgres/pull/1345)
- [anarazel/pg-vm-images CI infrastructure](https://github.com/anarazel/pg-vm-images)
- [Facebook zstd#4622 -- 4-way decompression loop not enabled on riscv64](https://github.com/facebook/zstd/issues/4622)