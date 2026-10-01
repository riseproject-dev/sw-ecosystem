---
title: PostgreSQL
parent: Project Reports
color: blue
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: Perl
    relation: build-dependency
    criticality: critical
  - name: Flex
    relation: build-dependency
    criticality: critical
  - name: GNU bison
    relation: build-dependency
    criticality: critical
  - name: Meson
    relation: build-dependency
    criticality: optional
  - name: Ninja
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: Python
    relation: runtime-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: ICU
    relation: runtime-dependency
    criticality: optional
  - name: LZ4
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: readline
    relation: runtime-dependency
    criticality: optional
  - name: libxml2
    relation: runtime-dependency
    criticality: optional
  - name: libxslt
    relation: runtime-dependency
    criticality: optional
  - name: libcurl
    relation: runtime-dependency
    criticality: optional
  - name: liburing
    relation: runtime-dependency
    criticality: optional
  - name: libnuma
    relation: runtime-dependency
    criticality: optional
  - name: Kerberos
    relation: runtime-dependency
    criticality: optional
  - name: Linux-PAM
    relation: runtime-dependency
    criticality: optional
  - name: OpenLDAP
    relation: runtime-dependency
    criticality: optional
  - name: UUID library
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="postgresql" %}

# PostgreSQL

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for PostgreSQL<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

PostgreSQL is a community-governed, permissively-licensed (PostgreSQL License, an OSI-approved MIT/BSD-style license, not GPL) relational database server. There is no incorporated foundation comparable to the Apache Software Foundation or the Linux Foundation; the legal/copyright holder is the PostgreSQL Global Development Group, a loosely organized community entity (copyright 1996-2026). Governance (per [postgresql.org/about/governance](https://www.postgresql.org/about/governance/)) is split across several standing bodies: a Core Team that is the central arbiter of project policy; Committers with direct git push access; a Sysadmin Team (PGInfra) that runs postgresql.org infrastructure; a Security Team; a Code of Conduct Committee; a Contributors Committee that curates contributor profiles; and a Sponsors Committee. Regional non-profits (PostgreSQL Europe, PostgreSQL US/SPI-affiliated) provide legal and financial support for conferences and trademark/infrastructure matters but none of them is "the" PostgreSQL foundation; the model is federated, not centralized.

All development happens on the [pgsql-hackers mailing list](https://www.postgresql.org/list/pgsql-hackers/), tracked through the Commitfest app ([commitfest.postgresql.org](https://commitfest.postgresql.org/)), with commits landing in [git.postgresql.org](https://git.postgresql.org/gitweb/?p=postgresql.git). There is no GitHub issue tracker for the project; the canonical `postgres/postgres` GitHub mirror is read-only and does not accept pull requests. An unofficial third-party bot, `MisterRaindrop/postgresql-github-mirror`, mirrors mailing-list threads as GitHub issues/PRs for discoverability; it is explicitly not affiliated with the project (confirmed: 95 open issues, 302 open PRs, 65,283 commits, 0 stars/forks at time of check). There is no single RISC-V tracking issue or meta-thread anywhere; RISC-V work is a series of independent mailing-list threads and Commitfest entries.

**Core Team members and known corporate affiliations** [NEEDS VERIFICATION, single-sourced from existing project tracking]:

| Name | Employer |
|---|---|
| Peter Eisentraut | EDB (EnterpriseDB) |
| Andres Freund | Microsoft |
| Magnus Hagander | Redpill Linpro |
| Jonathan Katz | Databricks |
| Tom Lane | Snowflake Inc |
| Bruce Momjian | EDB (EnterpriseDB) |
| Dave Page | pgEdge |

EDB holds 2 of 7 Core Team seats; Microsoft and Snowflake each hold one. No chip vendor holds a Core Team seat. Beyond individual Core Team affiliations, the companies most frequently cited as heavy corporate contributors to PostgreSQL are EnterpriseDB (EDB), Microsoft (dedicated Postgres team behind Azure Database for PostgreSQL, Citus, Patroni), Fujitsu (20+ years of core contributions), Google Cloud (Cloud SQL, AlloyDB), and secondarily AWS, NTT and VMware. PostgreSQL does not publish a GitHub-style MAINTAINERS file tying individuals to companies; affiliations are documented informally via the Contributors Committee's profile pages.

PostgreSQL is not a RISE Project member (see Section 10/14.4 discussion); RISE's own site lists no PostgreSQL membership or funded project.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2016-11-19 | First reported build failure on RISC-V ("PostgreSQL cannot be compiled on RISC-V," Richard W.M. Jones/Red Hat, PostgreSQL 9.5.5): `src/include/storage/s_lock.h` errors with "does not have native spinlock support on this platform." Tom Lane asks for a GCC-asm implementation; `config.sub`/`config.guess` also needed RISC-V triplets. | [pgsql-bugs thread](https://www.postgresql.org/message-id/16690.1479611287%40sss.pgh.pa.us) |
| 2019-10-17 to 2021-04-21 | Second report of the identical spinlock failure on a SiFive HiFive Unleashed board (rv64imafdc, Linux 5.2.9), Robert Henry. Multi-year debate between Tom Lane (favored hand-written asm) and Andres Freund (favored GCC/Clang intrinsics); Thomas Munro confirms a GCC-intrinsic fix passes under QEMU in 2021. | [pgsql-bugs thread](https://www.postgresql.org/message-id/CAEYr_8nnwxQji0pQJYqFx7%3DgSM8x7jFJi16O-bLuVYvqvkjsLg%40mail.gmail.com) |
| 2021-08-13 | Commitfest #3284, "Native spinlock support on RISC-V," patch author Marek Szuba (Gentoo), committed by Tom Lane. Implements RISC-V spinlocks via GCC's `__sync_lock_test_and_set()` (compiles to `AMOSWAP.W.AQ`), same pattern used for ARM/ARM64. Tested on PostgreSQL 13.3, physical BeagleV Starlight board (rv64gc), all tests passing. Commit `c32fcac56a212b4e6bb5ba63596f60a25a18109a`, back-patched to all then-supported branches. | [Commitfest #3284](https://commitfest.postgresql.org/34/3284), [commit](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=c32fcac56a212b4e6bb5ba63596f60a25a18109a) |
| 2021-09-30 | First tagged release containing the fix: **PostgreSQL 14.0**. Contemporaneous minor releases 13.5/12.9/11.14/10.19 (2021-11-11) carry the back-port. | Commitfest status page |
| 2025-10-11 | Alexander Lakhin reports "IO in wrong state on riscv64": `ERROR: IO in wrong state: 0` in the new AIO subsystem (`pgaio_io_wait()`), reproduced on QEMU/Debian trixie/Clang 19.1.4 with `--enable-debug --enable-cassert`. See Section 11 for full detail and an unresolved discrepancy between sources on fix status. | [pgsql-hackers thread](https://www.postgresql.org/message-id/d79691be-22bd-457d-9d90-18033b78c40a%40gmail.com) |
| 2026-09-10 | Greg Burd opens "Trying out `<stdatomic.h>`," an opt-in C11-atomics-based atomics implementation, tested across x86-64/aarch64/RISC-V/FreeBSD/Windows-ARM64; surfaces real RISC-V correctness issues (see Section 11). Open, not merged. | [Mirror PR #234](https://github.com/MisterRaindrop/postgresql-github-mirror/pull/234) |
| 2026-09-16/09-18 | "[PATCH v1/v2] Optimize 64-bit atomic access on RV64" (Hongyan Wang et al.) proposes a dedicated `arch-riscv.h` atomics header defining `PG_HAVE_8BYTE_SINGLE_COPY_ATOMICITY` for RV64. Open, under review as of 2026-10-01. | [v2 mail-archive](http://www.mail-archive.com/pgsql-hackers@lists.postgresql.org/msg239387.html), [mirror PR #422](https://github.com/MisterRaindrop/postgresql-github-mirror/pull/422) |

**Key contributors:** Marek Szuba (Gentoo, spinlock author), Tom Lane (Snowflake, committer), Thomas Munro (IO-wrong-state fix), Andres Freund (Microsoft, Core Team reviewer), Greg Burd (independent, stdatomic proposal and Zbb/Zbc patch series, also owns build farm worker `greenfly`), Hongyan Wang/Ni Jincheng/Yuansheng (RV64 atomics patch authors).

**Fully upstream?** Only the 2021 spinlock fix is merged to master. Every subsequent RISC-V-specific improvement (atomics fast path, Zbb popcount, Zbc CRC32C, centralized architecture macros, stdatomic migration) remains an open, unmerged pgsql-hackers thread as of 2026-10-01. Direct inspection of the current `master` tree (see Section 4) further found that the 2021 spinlock commit's dedicated RISC-V block may no longer be present in the live source, an unresolved discrepancy flagged below.

---

## 3. Upstream Support Tier

PostgreSQL has no formal Tier 1/2/3 classification analogous to Rust's or LLVM's. A platform is considered "supported" if (a) the source contains provisions for it, and (b) it has recently built and passed regression tests on the [PostgreSQL Build Farm](https://buildfarm.postgresql.org/), a community-run fleet of volunteer-operated machines continuously testing `master` and stable branches. The community's documented stance for a platform not yet represented in the Build Farm is informal and meritocratic: anyone interested is "strongly encouraged to set up a build farm member machine." There is no dedicated "architecture maintainer" role, no tier ranking, and no governance vote required for a new port.

RISC-V (riscv64) is explicitly listed in [PostgreSQL's Supported Platforms documentation](https://www.postgresql.org/docs/current/supported-platforms.html): "PostgreSQL can be expected to work on these CPU architectures: x86, PowerPC, S/390, SPARC, ARM, MIPS, and RISC-V, including big-endian, little-endian, 32-bit, and 64-bit variants where applicable." That is the entire clause; there is no elaboration. The Platform-Specific Notes chapter covers only Cygwin, macOS, MinGW, Solaris, SPARC and Windows; riscv64 is not mentioned there at all, and the documentation states platforms not covered "have no known platform-specific installation issues."

**amd64 vs arm64 vs riscv64:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions CI (`pg-ci.yml`) | Yes (primary) | No (also absent; GH Actions covers only Linux x86_64/i386, macOS, Windows) | No |
| Build Farm coverage | Extensive, many workers | Extensive, many workers | 4 active workers (Section 7.3) |
| Release-blocking status | Yes | Yes (via QEMU/native, not GHA) | No (satisfied only via Build Farm, which is PostgreSQL's own sanctioned support mechanism, not GitHub Actions) |
| Listed in Supported Platforms doc | Yes | Yes | Yes, since 2021 (commit `c32fcac5`, first in PG14) |
| Dedicated platform notes | None needed (default target) | None | None |

In practice, riscv64 occupies the project's informal second tier: it builds, passes regression tests via Build Farm, and is documented as supported, but it has essentially zero architecture-specific optimization code (Section 4) and no presence in the project's primary GitHub Actions CI pipeline.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Direct inspection of the live `postgres/postgres` source tree (checked 2026-10-01) confirms riscv64 support is built almost entirely on generic/portable C and compiler-builtin paths, not dedicated architecture code.

| Subsystem | riscv64 coverage | Detail |
|---|---|---|
| Spinlocks | Generic fallback, with an unresolved discrepancy | Commit `c32fcac56a212b4e6bb5ba63596f60a25a18109a` (2021) added a dedicated `#if defined(__riscv)` block in `src/include/storage/s_lock.h` using `__sync_lock_test_and_set()`. A direct grep of the current `master` tree, however, found no RISC-V-named section between the `__arm__`/`__aarch64__` block and the next (`__s390__`/`__s390x__`) block: RISC-V now appears to fall through to the file's unnamed generic catch-all (`#if !defined(TAS)` / `HAVE_GCC__SYNC_INT32_TAS`), which functionally resolves to the same `__sync_lock_test_and_set()` builtin but is no longer a maintained, named RISC-V branch. **This is a genuine discrepancy between the 2021 commit record (still shown as "applied to all supported branches" in the Commitfest log) and the current tree state**; it was not independently reconciled in this research pass and should be re-verified directly against a current `master` checkout before being treated as settled. |
| Atomics (32/64-bit) | Generic (CAS-loop fallback) | `src/include/port/atomics/` contains only `arch-arm.h`, `arch-ppc.h`, `arch-x86.h`, plus `generic.h`/`generic-gcc.h`/`generic-msvc.h`/`fallback.h`. No `arch-riscv.h` exists. 64-bit atomic reads/writes on riscv64 therefore go through a compare-exchange loop emulation rather than a plain aligned load/store, even though RV64 guarantees naturally-aligned XLEN-wide accesses are atomic. The open "Optimize 64-bit atomic access on RV64" patch (v2, 2026-09-18) proposes exactly this: a new `arch-riscv.h` defining `PG_HAVE_8BYTE_SINGLE_COPY_ATOMICITY` for RV64 only (RV32 untouched). Author-reported testing: SpacemiT K3 (RV64GC) hardware, 240/240 regression tests passed, disassembly confirmed CAS-loop paths replaced by plain loads, 130-paired pgbench runs showing a median ~1.67% improvement (bootstrap CI ~1.36-1.90%). Not merged as of 2026-10-01. |
| CRC32C | Missing (software fallback only) | `pg_crc32c.h` dispatches to hand-tuned paths for x86 (SSE4.2/AVX512), ARMv8, and LoongArch. There is no `#elif defined(__riscv)` branch and no RISC-V CRC32C source file; riscv64 unconditionally falls to the software slice-by-8 table-driven fallback. Notably, LoongArch (a far less widely deployed architecture) already has a dedicated hardware path that riscv64 lacks. An open 3-patch series (Greg Burd, v4) adds a Zbc/Zbkc `clmul`-based implementation adapted from Google Abseil, reporting a roughly 1800-2000x throughput improvement over the software fallback; not merged, under reviewer skepticism (Section 12). |
| Popcount | Missing (compiler-builtin generic) | Relies on generic `__builtin_popcount`, no RISC-V Zbb-specific code path in `pg_bitutils.c`. The same open patch series (Zbb popcount, v4) adds a hardware path gated on `-march=rv64gc_zbb`; author-reported throughput on build-farm hardware (`greenfly`) rose from 510 MB/s (software) to 2280 MB/s (Zbb), roughly a 4x gain. Not merged. |
| Memory barriers / stdatomic exploration | Generic, with surfaced correctness issues | RISC-V uses `generic-gcc.h` (`__atomic_thread_fence`). A separate, open, opt-in proposal to migrate PostgreSQL's atomics layer to C11 `<stdatomic.h>` (Greg Burd, PR #234) surfaced two concrete RISC-V-specific correctness problems during testing: (1) `memory_order_relaxed` loads are not equivalent to PostgreSQL's existing `volatile` loads (relaxed ordering caused data loss in parallel hash joins on RISC-V, which needs sequential consistency there), and (2) RISC-V lacks byte-granular atomic operations, forcing `pg_atomic_flag` to stay 32-bit. These are genuine, currently-open correctness risks in a proposed (not-yet-merged) code path, not in the shipped generic-gcc.h path. |
| JIT (LLVM ORC) | Broken | `--with-llvm` JIT crashes on riscv64 during regression tests with `relocation target ... out of range of R_RISCV_PCREL_HI20 fixup`. Root cause (per the open upstream bug): ORC JIT is invoking `RuntimeDyld`, an MCJIT-only component, on RISC-V targets, an apparent architectural bug in how ORC JIT delegates to lower-level LLVM components rather than a simple relocation-range tuning issue. No fix or linked PR exists. [llvm/llvm-project#106203](https://github.com/llvm/llvm-project/issues/106203), open since 2024-08-27. |
| Platform-detection macros | Present but vestigial | `src/include/c.h` normalizes `__riscv64__`/`__riscv__` via one `#elif defined(__riscv)` block ("RISC-V doesn't follow the common naming pattern, so force it"). Grepping the full tree shows these macros are never referenced anywhere else in PostgreSQL's own code: dead code today. `config/config.sub`/`config.guess` recognize `riscv*` GNU triplets but are stock upstream GNU Autoconf boilerplate, not PostgreSQL-authored logic. |
| SIMD dispatch, assembly files | Not applicable | No `.S` assembly files exist anywhere in the PostgreSQL tree for any architecture, and no `arch/riscv/`-style subtree exists (PostgreSQL does not use per-architecture source directories at all; branching is via `#ifdef` inside shared headers). No RISC-V Vector (RVV) SIMD dispatch exists. |

**amd64 vs arm64 vs riscv64, by component:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Spinlock inline/builtin path | Dedicated (LOCK XCHG) | Dedicated | Generic/unnamed fallback (disputed, see above) |
| Native atomics header | Yes (`arch-x86.h`) | Yes (`arch-arm.h`) | No |
| Hardware popcount | Yes (SSE4.2) | Yes (ARMv8) | No (patch pending) |
| Hardware CRC32C | Yes (SSE4.2) | Yes (ARMv8) | No (patch pending, also behind LoongArch) |
| LLVM JIT | Yes | Yes | No (upstream LLVM bug, open) |

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Compiler requirements

Officially documented minimums: C99 baseline, configure probes for C11; GCC "recent versions recommended" with no explicit floor; Clang has no stated minimum for ordinary builds, only LLVM 14 minimum when `--with-llvm`/`-Dllvm=enabled` is used; Meson 0.57.2 minimum; Autoconf (maintainers only) exactly 2.69.

Effective versions confirmed in use on riscv64, from active Build Farm workers: GCC 13.3.0 (`mollusk`, Ubuntu 24.04), GCC 14 (`boomslang`/`copperhead`, Debian 13 Trixie), Clang 22.1.6 (`greenfly`, Ubuntu 24.04).

**Critical Clang version constraint (riscv64-specific):** Clang 20.x and 21.x contain a confirmed miscompilation in the RISC-V vector (RVV) backend's LoopVectorize pass that silently corrupts output of indexed scatter-store loops (reproduced concretely in PostgreSQL's `crypt-des.c` `des_init()`, with 28 permutation-table mismatches). Clang 22.1.6 is the first confirmed-correct version; GCC is unaffected at any tested version. If building with `rv64gcv` and Clang, Clang < 22 must not be used. Root cause tracked to LLVM issues [#176001](https://github.com/llvm/llvm-project/issues/176001), [#187458](https://github.com/llvm/llvm-project/issues/187458), [#171978](https://github.com/llvm/llvm-project/issues/171978); fixed in Clang 22, not backported to 21.x. An in-progress PostgreSQL patch adds a configure/meson check enforcing `__clang_major__ >= 22` for RISC-V V-extension builds; not yet merged.

### 5.2 Autoconf native build

```
./configure \
  --prefix=/usr/local/pgsql \
  --with-pgport=5432 \
  --with-system-tzdata=/usr/share/zoneinfo \
  --enable-thread-safety
```

### 5.3 Autoconf cross-compilation (x86-64 host to riscv64)

```
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

`--with-system-tzdata` is documented upstream as simplifying cross-compilation by avoiding execution of host binaries during the timezone-database build.

### 5.4 Meson native build

```
meson setup build \
  --prefix=/usr/local/pgsql \
  --buildtype=debugoptimized \
  -Dssl=openssl \
  -Dicu=enabled \
  -Dsystem_tzdata=/usr/share/zoneinfo
ninja -C build
ninja -C build install
```

### 5.5 Meson cross-compilation

No PostgreSQL-maintained meson cross-file for riscv64 exists in the upstream tree. The following is derived from general Meson cross-compilation documentation and Build Farm evidence, not an upstream-published file:

`/etc/meson/cross/linux-riscv64.ini`:
```
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

```
meson setup build \
  --cross-file /etc/meson/cross/linux-riscv64.ini \
  --prefix=/usr/local/pgsql \
  -Dsystem_tzdata=/usr/share/zoneinfo \
  -Dllvm=disabled \
  -Dbonjour=disabled
ninja -C build
```

### 5.6 Flags to disable on riscv64

| Meson flag | configure equivalent | Reason |
|---|---|---|
| `-Dllvm=disabled` | `--without-llvm` | JIT disabled on riscv64 in all known distro packages because of the open ORC-JIT relocation bug (Section 4) |
| `-Dbonjour=disabled` | `--without-bonjour` | macOS-only feature |
| `-Dtap_tests=disabled` | N/A | TAP tests on cross-compiled binaries need a QEMU `exe_wrapper` |

### 5.7 Container / Dockerfile

No official PostgreSQL-maintained Dockerfile for riscv64 exists in `postgres/postgres` or in `anarazel/pg-vm-images`. The `docker-library/postgres` official image supports `linux/riscv64` through standard multi-arch `docker buildx`, based on the Debian/Ubuntu riscv64 base image; the Dockerfile itself is not riscv64-specific. `anarazel/pg-vm-images`' multi-stage `docker/linux_debian_ci` Dockerfile and its `scripts/linux_debian_install_deps.sh` contain no riscv64-specific handling.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Spinlock inline asm | Yes (x86 LOCK XCHG) | Yes | Generic builtin fallback only (named block possibly dropped from master, see Section 4) |
| Memory barrier inline asm | Yes (`arch-x86.h`) | Yes (`arch-arm.h`) | No (`generic-gcc.h` `__atomic_thread_fence`) |
| Native atomics header | Yes | Yes | No (`generic-gcc.h` CAS-loop); fast path proposed, not merged |
| Hardware popcount | Yes (SSE4.2 POPCNT) | Yes (ARMv8 VCNT) | No; patch pending |
| Hardware CRC32C | Yes (SSE4.2) | Yes (ARMv8) | No; patch pending (behind LoongArch) |
| LLVM JIT | Yes | Yes | No (disabled; open ORC-JIT bug) |
| Primary GitHub Actions CI | Yes | No (also not covered by `pg-ci.yml`) | No |
| Build Farm coverage | Extensive | Extensive | Yes, 4 active workers |
| Distribution packages | Yes | Yes | Yes (ports/secondary-architecture pockets) |
| Upstream binary releases | No (source only, applies to every arch) | No | No |

Summary: riscv64 has functional parity (the database builds, runs, and passes the full regression suite) but no performance parity. Every architecture-specific optimization present for arm64 and amd64 is absent for riscv64, and the single historical RISC-V-specific optimization (2021 spinlock block) is in question as of the current tree. Data not available on NaN/floating-point semantics divergence specific to riscv64: no such issue was surfaced in any searched source.

---

## 7. CI/CD Infrastructure

### 7.1 Primary CI (GitHub Actions)

Direct inspection of `.github/workflows/pg-ci.yml` (1,275 lines, fetched at commit `42e96cf2fe095c822f76bc94669ea875cb1e3351`) confirms it defines jobs exclusively for: Linux-Autoconf, Linux-Meson (32-bit), Linux-Meson (64-bit), macOS-Meson, Windows-VisualStudio, Windows-MinGW-Meson, CompilerWarnings, and SanityCheck, running on `ubuntu-24.04`, `macos-15`, `windows-2022`, and `ubuntu-slim`. A full-text search of the file for "riscv64," "risc-v," and "RISC-V" returns zero matches.

The project's own canonical description of its CI system, `src/tools/ci/README`, documents exactly two forms of CI: the Build Farm (a separate, non-GitHub system) and GitHub Actions. Its `ci-os-only` commit-message control enumerates the complete, exhaustive list of supported CI platforms: `compilerwarnings|linux|macos|mingw|sanitycheck|windows`. RISC-V does not appear in that list, and there is no architecture-level selector at all in this CI system, meaning there is no riscv64 *variant* of any job to add short of a new job class entirely. `.cirrus.yml`/`.cirrus.tasks.yml` do not exist in the repository at all (confirmed 404 and zero filename matches); PostgreSQL no longer uses Cirrus CI, GitHub Actions is the sole current GitHub-hosted CI backend. A 2026-04-14 pgsql-hackers proposal from Thomas Munro to add QEMU-based images for RISC-V (and other architectures) as a CI alternative, raised in the context of the Cirrus CI shutdown, remains a mailing-list proposal only; no such job has been added.

A repo-wide code search for "riscv" (GitHub code search, `repo:postgres/postgres`) returns exactly 3 matches, none in `.github/workflows/` or `src/tools/ci/`: the `c.h` macro-normalization block, and the generic `config.sub`/`config.guess` autoconf triplet tables.

**Conclusion: PostgreSQL's primary, GitHub-hosted CI pipeline has zero riscv64 coverage of any kind.**

### 7.2 PostgreSQL Build Farm

The [PostgreSQL Build Farm](https://buildfarm.postgresql.org/) is the project's own, non-GitHub, self-hosted continuous testing infrastructure: volunteer-run machines that continuously build and run the full regression test suite against `master` and stable branches. Per the [Build Farm's riscv64 member list](https://buildfarm.postgresql.org/cgi-bin/show_members.pl?os=Linux&arch=riscv64), four workers are active and reporting current status:

| Worker | OS | Compiler | Branches | Owner |
|---|---|---|---|---|
| boomslang | Debian 13 Trixie | GCC 14 | master through REL_13_STABLE | pgbf@twiska.com |
| copperhead | Debian 13 Trixie | GCC 14 | master through REL_13_STABLE | pgbf@twiska.com |
| greenfly | Ubuntu 24.04.4 LTS (OrangePi RV2, VisionFive 2 CPU, RV64GC+Zba/Zbb/Zbc/Zbs) | Clang 22.1.6 | master through REL_13_STABLE | greg@burd.me |
| mollusk | Ubuntu 24.04.4 LTS | GCC 13.3.0 | master, REL_18, REL_17 | Data not available: owner email not recorded in research findings |

All four report as current. `boomslang` and `copperhead` share the same owner and appear to be a coordinated pair. `greenfly`'s owner, Greg Burd, is also the author of the open Zbb/Zbc and stdatomic patch series discussed in Sections 4 and 11, meaning the person whose hardware generates the test coverage is also the primary author of the pending optimization work. This Build Farm coverage is precisely the mechanism the readiness grade (Section 13) treats as satisfying PostgreSQL's own sanctioned CI build/test bar for riscv64.

**Assessment:** coverage is broad (4 workers, 2 compilers, 2 distros, all supported branches) but entirely dependent on volunteer-owned hardware, with no organizationally owned riscv64 CI capacity anywhere in the project, and no JIT-enabled testing (since JIT is disabled on riscv64).

**amd64 vs arm64 vs riscv64 (CI):**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions job | Yes | No | No |
| Build Farm coverage | Extensive | Extensive | 4 workers, volunteer-owned |
| Organizationally owned CI | Yes (project infra) | Yes | No |
| RISE Runners used | Data not available: no evidence PostgreSQL's own CI uses RISE RISC-V Runners; RISE's runner infrastructure uses PostgreSQL as its own internal scheduler database, not the reverse | | |

---

## 8. Distribution and Release Status

PostgreSQL's upstream Global Development Group ships source-only tarballs for every architecture; there are no upstream-built binary releases for amd64, arm64, or riscv64. All installable binaries come from downstream distributions or vendors.

| Distribution | riscv64 present | Version | Notes |
|---|---|---|---|
| Upstream (postgresql.org) | N/A (source only) | 18.4 stable; 19beta1 pre-release | No binary releases for any architecture, for any CPU |
| Debian trixie (stable) | Yes | 17.10-0+deb13u1 | `postgresql-17_17.10-0+deb13u1_riscv64.deb`, ports archive, JIT disabled |
| Ubuntu 24.04 Noble | Yes | 16.14-0ubuntu0.24.04.1 | Ports archive, universe pocket, JIT disabled |
| Ubuntu 26.04 "resolute" | Yes | 18.3-1 (search-page cache), 18.6-0ubuntu0.26.04.1 / 18.6-3build2 (confirmed in live `ports.ubuntu.com` pool and the `dists/resolute/main/binary-riscv64/Packages.gz` index, with matching SHA256) | riscv64 is an Ubuntu ports architecture (not a primary release arch); the cached tracker page lags the primary-arch version, but the live pool mirror already carries 18.6 builds. `apt install postgresql-18` genuinely resolves and installs on a riscv64 Ubuntu 26.04 system |
| Arch Linux RISC-V | Yes | 18.6-2 (confirmed rebuilt today, 2026-10-01, via `archriscv.felixc.at/repo/extra/`) | Packages: `postgresql`, `postgresql-libs`, `postgresql-docs`, `postgresql-old-upgrade`, plus an unrelated extension `postgresql-ip4r`. Caution: the Arch RISC-V repo directory also lists several unrelated third-party libraries sharing the `postgresql-` name prefix (Haskell/other-ecosystem packages); only the `postgresql-18.6-2-riscv64.pkg.tar.zst` family is the actual RDBMS. The project's own `?q=` search page is non-functional (static, JS-only widget); the repo directory listing must be checked directly |
| Debian sid (unstable) | Not confirmed this pass | N/A | `postgresql_18+292_all.deb` found is architecture-independent (`_all`, a metapackage); no riscv64-specific compiled binary for `postgresql-17`/`postgresql-18` was independently confirmed in sid |
| PyPI | Not applicable | N/A | No package literally named `postgresql` exists (HTTP 404). The historical Python driver `py-postgresql` ships only a source sdist across all 17 of its releases, no wheels at all, so there is no riscv64-specific wheel to find for that package either |

**What a user must do to get a working binary:** install from Debian, Ubuntu (ports pocket), or Arch Linux RISC-V's package repositories; there is no upstream-signed binary and no official riscv64 Docker image from the PostgreSQL project itself (the `docker-library/postgres` image supports `linux/riscv64` via standard multi-arch buildx, built from the Debian/Ubuntu riscv64 packages, not from an upstream PostgreSQL binary).

**RISE-built artifact note:** the RISE Project's `python-wheels` repository built a riscv64 wheel for `pgserver` ([PR #2276](https://github.com/riseproject-dev/python-wheels/pull/2276), [release pgserver-v0.1.4-20260928155916](https://github.com/riseproject-dev/python-wheels/releases/tag/pgserver-v0.1.4-20260928155916)), an embedded PostgreSQL 16.2 + pgvector 0.6.2 distribution (upstream: `github.com/orm011/pgserver`, which ships no riscv64 wheel itself). RISE's fixes were riscv64-specific: patched out `-march=native` (rejected by GCC on `manylinux_2_39_riscv64` for the pgvector build) and relinked with `LDFLAGS=-Wl,-Ttext-segment=0x200000` to avoid segfaults against the kernel's `mmap_min_addr`. This is a RISE-funded riscv64 build of an embedded PostgreSQL distribution, not of mainline PostgreSQL server packages, and it is not reflected in RISE's own `wheel_builder` documentation page, which lists 87 packages but omits pgserver.

---

## 9. Dependencies

"Build" reflects whether the dependency itself builds/is available on riscv64. "Test" reflects whether it has riscv64 test coverage. "Release" reflects whether riscv64 binary packages exist (always via distro, since neither PostgreSQL nor most of its dependencies ship upstream binaries).

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes / Blocking issues |
|---|---|---|---|---|---|
| GCC | Build-dependency, critical | Green | Green | Green | Primary compiler used by 3 of 4 active Build Farm riscv64 workers (GCC 13.3.0 on `mollusk`, GCC 14 on `boomslang`/`copperhead`). No documented riscv64-specific version floor for GCC (unlike Clang, see below) |
| LLVM | Build-dependency, optional (`--with-llvm`) | Green (compiles) | Mostly green, with a critical caveat | Green (distro package; no upstream LLVM binary releases) | Two separate riscv64 defects: (1) Clang 20/21 miscompile RVV LoopVectorize loops, fixed only in Clang 22.1.6 (Section 5.1); (2) ORC-JIT relocation failure (`R_RISCV_PCREL_HI20`) keeps `--with-llvm` JIT disabled on riscv64 in all known distro PostgreSQL packages ([llvm/llvm-project#106203](https://github.com/llvm/llvm-project/issues/106203), open) |
| LLVM | Runtime-dependency, optional (`--with-llvm` JIT) | Green (library present) | Broken for PostgreSQL's JIT use case specifically | No upstream release binaries; distro package unpatched | Same ORC-JIT issue as above; this is why JIT ships disabled |
| Perl | Build-dependency, critical | Not independently verified this pass | Unverified | Expected present (essential Debian/Ubuntu package) | Required at build time for code-generation scripts (e.g. `genbki.pl`) when building from git source (pre-generated in release tarballs). [NEEDS VERIFICATION]: no dedicated riscv64 source check was performed this pass; given "critical, build-dependency" status for building from git, this is the single highest-priority gap to close |
| Flex | Build-dependency, critical | Not independently verified this pass | Unverified | Expected present | Required to build the scanner from git source. [NEEDS VERIFICATION] |
| GNU bison | Build-dependency, critical | Not independently verified this pass | Unverified | Expected present | Required to build the grammar from git source. [NEEDS VERIFICATION] |
| Meson | Build-dependency, optional | Not independently verified this pass | Unverified | Expected present | Pure-Python build-system generator; architecture-independent by construction. 0.57.2 is PostgreSQL's documented minimum |
| Ninja | Build-dependency, optional | Not independently verified this pass | Unverified | Expected present | Standard Linux/C++ build tool invoked by Meson; no riscv64-specific gating found in any searched source |
| QEMU | Test-dependency, optional | Green | Green | Green (distro) | `qemu-riscv64-static` is the standard `exe_wrapper` for Meson cross-builds' TAP tests and for cross-compiled binary execution in CI-style setups; also used in the (unmerged) QEMU CI proposal of Section 7.1 |
| OpenSSL | Runtime-dependency, optional (`--with-ssl=openssl`, default) | Green | Mostly green | Green, confirmed Ubuntu 26.04 resolute (3.5.5-1ubuntu3) | AES T-table implementation is not constant-time on riscv64 hardware lacking the Zkn or Zvkned extensions, which describes the majority of current riscv64 silicon (SG2042, TH1520, JH7110, SpacemiT K1). Key material can leak via cache-timing on those platforms. Open PRs #31080 and #31082 against OpenSSL address this; not a PostgreSQL-authored issue but affects the security posture of any riscv64 PostgreSQL server using TLS. See `project-reports/openssl.md` |
| Python | Runtime-dependency, optional (PL/Python) | Green, confirmed (`python3` 3.12.3-0ubuntu1 on Ubuntu 24.04 noble; not independently re-confirmed on 26.04 this pass) | Stack-unwinding tests (`test_frame_pointer_unwind`, `test_c_stack_unwind`) fail on riscv64 in CPython 3.15 beta; riscv64 is effectively untiered (Tier 0) per PEP 11 | Distro-built only, no upstream official binary | No Tier-2 copy-and-patch JIT and no perf-profiling trampoline support on riscv64; stack unwinding actively broken in the 3.15 beta series. See `project-reports/python.md` |
| glibc | Runtime-dependency, critical | Green | Unclear whether the full glibc test suite actually executes under QEMU | Green, Ubuntu 26.04 resolute (libc6 2.43-2ubuntu2) | Unconfirmed bug [sourceware #33911](https://sourceware.org/bugzilla/show_bug.cgi?id=33911), `--static-pie` SIGSEGV on riscv64/glibc 2.43 under QEMU, unlikely to affect normally-linked PostgreSQL binaries. See `project-reports/glibc.md` |
| zlib | Runtime-dependency, optional (default on) | Green | Green via OpenBSD/QEMU CI, no dedicated Linux release-blocking CI | Green | No correctness blockers; no RVV/SIMD path, so a performance gap vs arm64/x86-64 exists on the Adler32 path (unmerged RVV PR, perf only). See `project-reports/zlib.md` |
| ICU | Runtime-dependency, optional (default collation provider since PG15) | Green | Green | Green, confirmed Ubuntu 26.04 resolute | None; a prior correctness bug (ICU-21613) was fixed as of ICU 71 (2022). See `project-reports/icu.md` |
| LZ4 | Runtime-dependency, optional | Green, confirmed Ubuntu 26.04 resolute (1.10.0-8), continuous riscv64 lineage since 1.9.4 (2024) | Not detailed | Green | None noted. See `project-reports/lz4.md` |
| zstd | Runtime-dependency, optional | Green | CI uses QEMU user-mode, not release-blocking | Green (distro "full") | Performance only: the 4-way decompression loop is disabled on riscv64 ([zstd#4622](https://github.com/facebook/zstd/issues/4622)); RVV vectorization only partially merged. See `project-reports/zstd.md` |
| readline | Runtime-dependency, optional (default on) | Green, confirmed on the Debian rv-osuosl-02 porter box | No upstream CI for any architecture (source-only releases) | Green | None; zero riscv64-specific code needed. See `project-reports/readline.md` |
| libxml2 | Runtime-dependency, optional | Green | No upstream riscv64 CI | Green, Debian sid and Ubuntu 24.04/26.04 resolute | Open [GNOME/libxml2#971](https://gitlab.gnome.org/GNOME/libxml2/-/issues/971): relaxed-atomics race in catalog code on weakly-ordered architectures including riscv64, non-blocking for typical single-threaded PostgreSQL backend use. See `project-reports/libxml2.md` |
| libxslt | Runtime-dependency, optional | Green, confirmed on Ubuntu 26.04 resolute | Inherits libxml2's CI gap | Green | Same libxml2 atomics caveat (upstream dependency). See `project-reports/libxslt.md` |
| libcurl | Runtime-dependency, optional (PG18+, OAuth) | Green, confirmed Ubuntu 26.04 resolute (8.18.0-1ubuntu2) | Not detailed | Ports pocket, one revision behind the security pocket | None noted. See `project-reports/libcurl.md` |
| liburing | Runtime-dependency, optional (PG18+, io_uring AIO backend) | Green, confirmed genuine riscv64 ELF via `file(1)` on the shipped `.so` | Builds only; no sanitizer execution for non-x86_64 including riscv64 | Green, Debian sid and Ubuntu 26.04 resolute, 2.14-1 | No functional blocker; "first-class in source/packaging, second-class in CI." See `project-reports/liburing.md` |
| libnuma | Runtime-dependency, optional (PG18+, NUMA-aware shared-buffer allocation) | Green, but emits a spurious non-fatal `#warning` for `set_mempolicy_home_node` on riscv64 | No upstream riscv64 CI at all | Green, Debian sid and Ubuntu ports ship v2.0.19 | Fix merged to `master` but not yet in a tagged release, a release-cadence gap rather than a code gap. See `project-reports/libnuma.md` |
| Kerberos | Runtime-dependency, optional (`--with-gssapi`) | Not independently verified this pass | Unverified | Expected present | [NEEDS VERIFICATION]: general-knowledge expectation only, no dedicated riscv64 source check performed |
| Linux-PAM | Runtime-dependency, optional (`--with-pam`) | Not independently verified this pass | Unverified | Expected present | [NEEDS VERIFICATION]: essential-tier Debian/Ubuntu package, no dedicated check performed |
| OpenLDAP | Runtime-dependency, optional (`--with-ldap`) | Not independently verified this pass | Unverified | Expected present | [NEEDS VERIFICATION]: no dedicated riscv64 source check performed |
| UUID library | Runtime-dependency, optional (`contrib/uuid-ossp`, `--with-uuid`) | Not independently verified this pass | Unverified | Expected present | [NEEDS VERIFICATION]: util-linux (`libuuid`) is an essential Debian/Ubuntu package, no dedicated check performed |

**Research gap:** Perl, Flex, GNU bison, Meson, Ninja, Kerberos, Linux-PAM, OpenLDAP, and UUID library all lack independently-verified riscv64 package evidence in this research pass; the project's internal dependency-graph query tool (`project-graph` MCP) was unavailable (`CONNECTION_CLOSED`) across this entire research effort, which is the proximate cause. Of these, Perl, Flex, and GNU bison are the highest priority to verify, since all three are flagged critical build-dependencies required to build PostgreSQL from git source (release tarballs ship pre-generated parser/scanner output and so do not need them at build time).

**Highest-severity confirmed dependency risk:** the OpenSSL AES T-table cache-timing gap. Any riscv64 PostgreSQL deployment using TLS on hardware without Zkn/Zvkned, which describes most current riscv64 silicon, runs a non-constant-time AES fallback vulnerable to cache-timing key extraction. This is an OpenSSL-level issue, not a PostgreSQL defect, but it materially affects the security posture of any riscv64 PostgreSQL server that terminates TLS.

---

## 11. Known Bugs and Active Issues

| ID / Title | Status | Severity | Notes |
|---|---|---|---|
| pgsql-bugs 2016-11-19, "cannot be compiled on RISC-V" | Closed, superseded | Historical | No standalone patch landed from this thread; the problem was ultimately resolved by Commitfest #3284 below |
| pgsql-bugs 2019-10-17/2021-04-21, "no spinlock support on riscv rv64imafdc" | Closed, superseded | Historical | Same resolution path as above |
| Commitfest #3284, "Native spinlock support on RISC-V" | Merged, commit `c32fcac56a212b4e6bb5ba63596f60a25a18109a` | Resolved (historical) | First shipped in PostgreSQL 14.0 (2021-09-30). See Section 4 for the unresolved discrepancy found between this commit record and the current `master` tree |
| "IO in wrong state on riscv64" | **Contradictory status across sources, see discussion below** | Potentially critical (data-integrity/assertion failure) | See below |
| LLVM #106203, "[RISC-V][ORCJIT] PostgreSql JIT fails with relocation target out of range error" | Open, unresolved, no linked fix | High (blocks `--with-llvm` on riscv64) | [llvm/llvm-project#106203](https://github.com/llvm/llvm-project/issues/106203), open since 2024-08-27 |
| LLVM #164194, "RISCV fence and load order broken when function inlined twice" | Closed by LLVM maintainers as "not planned" | High (underlying compiler hazard unresolved) | [llvm/llvm-project#164194](https://github.com/llvm/llvm-project/issues/164194); LLVM declined to accept this as a required fix, meaning the class of hazard is not fixed in the compiler itself |
| Known Buildfarm Test Failures item 1.62, "regression tests fail with segmentation faults on riscv64 with llvm enabled" | Archived | Historical | [Buildfarm Known Failures Archive](https://wiki.postgresql.org/wiki/Known_Buildfarm_Test_Failures_-_Archive); likely overlapping with the LLVM JIT relocation issue |
| Known Buildfarm Test Failures item 1.58, "RISC-V animals fail sporadically due to memory-related issues" | Archived | Historical | Same archive page; specific root cause not detailed in available excerpts |
| Known Buildfarm Test Failures item 2.113/2.113.1 | Tracked | See discussion below | [Known Buildfarm Test Failures](https://wiki.postgresql.org/wiki/Known_Buildfarm_Test_Failures), `027_stream_regress.pl` failures on the `greenfly` riscv64 worker |
| "[PATCH v1/v2] Optimize 64-bit atomic access on RV64" | Open, under review | Performance (non-blocking) | See Sections 2 and 4 |
| "Trying out `<stdatomic.h>`" | Open, exploratory/WIP, opt-in, disabled by default | Correctness risk only if adopted as-is | See Section 4; surfaced parallel-hash-join data-loss risk under relaxed ordering on RISC-V |
| "Add RISC-V Zbb popcount / Zbc CRC32C optimization" (3-patch series, v4) | Open, under review, reviewer skepticism | Performance (non-blocking) | See Section 2/12 |
| "Centralised architecture detection" (`PG_ARCH_*` macros) | Open, blocked | Infrastructure, blocks cleaner riscv64 dispatch | See Section 12 |

**Discrepancy flagged under "IO in wrong state on riscv64":** The existing project record states this bug, reported by Alexander Lakhin on 2025-10-11 (`pgaio_io_wait()` assertion failure, traced to LLVM's MachineSink optimization reordering loads past `__atomic_thread_fence()`), was fixed by commit `c5d34f4` ("Fix generic read and write barriers for Clang," Thomas Munro, 2025-11-07), which added an explicit `pg_compiler_barrier_impl()` before the atomic fence in `generic-gcc.h` and was back-patched to PostgreSQL 13. The live research pass for this report, however, independently characterizes the same bug as "active/unresolved" as of 2026-10-01, traces its root cause specifically to Clang reordering a load before an acquire fence when a function is inlined twice (confirmed via a Godbolt repro at `-O1`+, GCC unaffected), and reports that the underlying LLVM defect (`llvm/llvm-project#164194`) was closed by LLVM maintainers as "not planned," with the failure still listed on PostgreSQL's Known Buildfarm Test Failures page. **Both claims cannot be fully reconciled from the sources gathered**: it is plausible that PostgreSQL's own `c5d34f4` workaround (a compiler barrier added inside PostgreSQL's own macros) resolved the specific reproduction while the underlying LLVM compiler hazard remains open and unaddressed upstream, meaning similar reordering could recur in code paths the PostgreSQL-level fix does not cover. This should be independently re-verified against the current `master` branch and a current run of the `greenfly` buildfarm animal before being treated as either fully resolved or still actively failing. [NEEDS VERIFICATION].

**Performance benchmarks:** no rigorous, sourced PostgreSQL-on-RISC-V throughput/latency benchmark with concrete numbers was found in any publicly indexed source as of 2026-10-01. The RISC-V International blog's "Database Adaptation Evaluation On RISC-V Server" tested PostgreSQL on an HS-2/SOPHON SG2042 platform (64 cores, 32GB RAM, Ubuntu 22.10) and reports only pass/fail compatibility ("compiled smoothly and had the best performance in compatibility testing" among the databases evaluated), with no TPS, latency, or throughput figures published. A `cloud-v.co` RISC-V comparison dashboard has a pgbench slot for boards like the Milk-V Pioneer, but the pgbench column was empty/unfilled at the time checked, and the comparison page itself returned 404 on direct fetch. The one concretely-sourced performance claim found anywhere is qualitative: before native spinlock support landed (2021), PostgreSQL on RISC-V required `--disable-spinlocks`, which the build system itself flags as giving "poor" performance. [Source](https://riscv.org/blog/risc-v-public-beta-platform-release-%C2%B7-database-adaptation-evaluation-on-risc-v-server/).

---

## 12. Objections and Upstream Blockers

**Andres Freund (Microsoft, PostgreSQL Core Team), reviewing the Zbb/Zbc patch series:**
> "there's afaict not yet a whole lot of riscv production adoption"

This is the canonical upstream objection to riscv64-specific optimization work: insufficient production deployment evidence, raised by a Core Team member with commit access. It is not a hard block (Greg Burd has continued submitting revisions through v4), but it establishes the review bar any further riscv64 performance patch must clear.

**Tom Lane (Snowflake, PostgreSQL Core Team), on the centralized architecture-detection patch:**
Objects to the proposed `PG_ARCH_*` naming scheme, preferring GCC's built-in spellings (`__x86_64__`, etc.) directly: "why should we invent our own instead of standardizing on gcc's spellings." This blocks a patch that would be a prerequisite for cleaner riscv64-specific dispatch elsewhere in the codebase. No resolution as of the latest recorded activity.

**Peter Eisentraut (EDB, PostgreSQL Core Team), on the `<stdatomic.h>` migration proposal:**
Questioned the long-term maintenance burden of carrying multiple parallel atomics implementations and asked whether the project's end goal is eventually eliminating the custom atomics code entirely. Author Greg Burd confirmed the intended end state is full migration to stdatomic, with a period of parallel testing proposed before a mid-release-cycle cutover.

**No upstream policy objection to riscv64 as a supported platform exists.** The architecture was committed by a Core Team member (Tom Lane) in 2021, is listed in the supported-platforms documentation, and has active Build Farm coverage. All current objections target the pace, naming conventions, and production-adoption evidence behind new optimization work, not riscv64's standing as a supported platform.

---

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro

**Justification:** PostgreSQL's primary GitHub Actions CI (`.github/workflows/pg-ci.yml`) has zero riscv64 jobs (only x86_64/i386 Linux, macOS, and Windows), but the project's own sanctioned platform-support mechanism, the community PostgreSQL Build Farm, continuously builds and runs the full regression test suite on riscv64 across master and stable branches via multiple active, current-reporting workers (`boomslang`, `copperhead`, `greenfly`, `mollusk`), per the [Build Farm's riscv64 member list](https://buildfarm.postgresql.org/cgi-bin/show_members.pl?os=Linux&arch=riscv64). riscv64 has been upstream-supported since [commit `c32fcac5`](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=c32fcac56a212b4e6bb5ba63596f60a25a18109a) (2021, first in PG14). This satisfies CI build=yes, test=yes. However, PostgreSQL ships no binary releases from upstream for any architecture (source tarballs only); the installable riscv64 artifacts that exist (Debian 17.10, Ubuntu ports/resolute builds, Arch Linux RISC-V) are built and published by distributions, not by the PostgreSQL Global Development Group itself. Per the release-provider rule, a non-upstream release caps the color at blue rather than green.

**Pending work that could change the grade:** Open, unmerged pgsql-hackers patches as of late 2026: "Optimize 64-bit atomic access on RV64" (v2, defines `PG_HAVE_8BYTE_SINGLE_COPY_ATOMICITY` for RV64, mirrored as GitHub mirror [PR #422](https://github.com/MisterRaindrop/postgresql-github-mirror/pull/422), [mail-archive](http://www.mail-archive.com/pgsql-hackers@lists.postgresql.org/msg239387.html)); a 3-patch Zbb-popcount/Zbc-CRC32C optimization series (v4, Greg Burd) still under reviewer skepticism from Core Team member Andres Freund over production-adoption evidence; a centralized `PG_ARCH_RISCV` macro patch blocked by Tom Lane's naming objection; and an open, unresolved upstream LLVM ORC-JIT relocation bug ([llvm/llvm-project#106203](https://github.com/llvm/llvm-project/issues/106203)) that keeps `--with-llvm` JIT disabled on riscv64 in all known distro packages. PostgreSQL is not a RISE member project and has no RISE-funded riscv64 work on mainline PostgreSQL itself; RISE's own infrastructure merely runs PostgreSQL internally as its CI scheduler's datastore, and RISE's one riscv64-related PostgreSQL artifact (the `pgserver` embedded-PostgreSQL wheel) is a separate downstream project, not mainline PostgreSQL packaging.

---

## 14. Investment Analysis

Before sizing work: RISE has not funded any riscv64 work against mainline PostgreSQL. Its only PostgreSQL-adjacent riscv64 output is the `pgserver` embedded-distribution wheel (Section 8), which does not touch PostgreSQL's own source tree, build system, or CI. Nothing below should be read as already covered by RISE.

### 14.1 Functional Enablement

PostgreSQL is functionally complete on riscv64: it builds, runs, and passes the full regression test suite via the Build Farm. The one historically confirmed correctness bug in the AIO subsystem has at minimum a PostgreSQL-level workaround on record (commit `c5d34f4`), though its true current status is disputed between sources (Section 11) and needs direct re-verification. The one other pending functional item is the Clang-miscompilation guard (Section 5.1), a narrow, low-risk configure/meson check preventing `rv64gcv` builds with Clang < 22.

### 14.2 Performance Optimization

Every architecture-specific optimization present on arm64 and amd64 is absent on riscv64, with real, author-measured gaps from open (unmerged) patches:

| Subsystem | Measured gap (from open-patch author testing) | Status |
|---|---|---|
| Popcount (Zbb) | Software ~510 MB/s vs. Zbb ~2280 MB/s, roughly 4x | Patch v4 pending, reviewer skepticism |
| CRC32C (Zbc) | Software ~154 MB/s vs. Zbc clmul ~308,052 MB/s, roughly 2000x (GCC); roughly 1800x (Clang) | Patch v4 pending, reviewer skepticism |
| 64-bit atomics | ~1.67% median pgbench improvement across 130 paired runs (CAS-loop removed for aligned 64-bit access) | Patch v2 pending |
| Spinlocks | Possible regression from a named, hand-tuned block back to an unnamed generic fallback (unconfirmed, Section 4) | No open patch; needs investigation first |
| JIT (LLVM) | Disabled entirely; no measured gap possible | Blocked on an open upstream LLVM bug; no PostgreSQL-side patch exists |

The CRC32C gap is the most consequential for production workloads: CRC32C guards WAL integrity on every write, so on Zbc-capable hardware, WAL write throughput is currently dominated by software CRC32C computation whenever the pending patch is not applied.

### 14.3 CI/CD Infrastructure

The only riscv64 CI coverage consists of 4 volunteer-owned Build Farm workers; this is a single-point-of-failure structure with zero organizational ownership. GitHub Actions, PostgreSQL's primary CI surface, has no riscv64 job class at all and no architecture-level selector to add one to without new infrastructure work. A QEMU-based riscv64 CI proposal exists on the mailing list (2026-04-14) but has not been implemented.

### 14.4 Ecosystem Enablement

No RISE-funded work targets mainline PostgreSQL; PostgreSQL is not a RISE member project. No major chip vendor has publicly committed riscv64 investment specifically to PostgreSQL. The riscv64-specific Build Farm and optimization-patch work is driven almost entirely by one individual, Greg Burd (`greg@burd.me`), who owns the primary Clang worker (`greenfly`) and authors the Zbb/Zbc and stdatomic patch series. The only organizationally-adjacent riscv64 PostgreSQL artifact found is RISE's `pgserver` wheel, which is a separate embedded-distribution project, not mainline PostgreSQL.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Independently re-verify current status of "IO in wrong state on riscv64" against current `master` and the `greenfly` buildfarm animal (reconcile the "fixed via c5d34f4" vs. "active/tracked" discrepancy) | 1 | No current owner | Critical |
| Functional | Investigate whether the 2021 RISC-V-named spinlock block has actually been removed from `s_lock.h`, and restore a named, maintained block if so | 1 | No current owner | Critical |
| Functional | Merge the Clang-miscompilation guard (configure/meson check for Clang >= 22 on rv64gcv); align with Greg Burd, Andres Freund, Nathan Bossart | 1 | External contributor (Greg Burd active) | High |
| Functional | Write and merge a dedicated `arch-riscv.h` atomics header (the open RV64 atomics patch) | 2 | External contributor (Hongyan Wang et al., active) | High |
| Functional | Unblock and merge the centralized `PG_ARCH_RISCV` macro patch (resolve Tom Lane's naming objection) | 1 | No current owner | Medium |
| Performance | Merge the Zbc CRC32C optimization (~2000x on the WAL integrity path); supply production-adoption evidence to address Andres Freund's skepticism | 3 | External contributor (Greg Burd active) | High |
| Performance | Merge the Zbb popcount optimization | 1 | External contributor (Greg Burd active) | Medium |
| Performance | Investigate and fix LLVM ORC-JIT segfault/relocation bug on riscv64 (llvm/llvm-project#106203); re-enable JIT in distro packages | 8 | No current owner | Low |
| Correctness | Resolve the RISC-V-specific correctness gaps found while prototyping `<stdatomic.h>` (relaxed-ordering data loss in parallel hash joins, no byte-granular atomics) before that migration proceeds | 2 | External contributor (Greg Burd active) | High |
| CI/CD | Add a QEMU-based riscv64 emulation job to `.github/workflows/pg-ci.yml` (proposal exists, no implementation) | 2 | No current owner | High |
| CI/CD | Establish an organizationally owned riscv64 Build Farm worker with Clang, reducing single-contributor dependency on `greenfly` | 1 | No current owner | High |
| Ecosystem | Publish riscv64 pgbench TPS benchmarks vs. arm64 and x86-64 to substantiate production-readiness claims and counter Andres Freund's adoption-skepticism argument | 2 | No current owner | High |
| Security | Track and, where feasible, help land OpenSSL's AES T-table constant-time fix for riscv64 (PRs #31080/#31082) given its direct impact on TLS-terminating PostgreSQL deployments | 1 | No current owner (OpenSSL-side work) | Medium |

---

## 15. References

- [PostgreSQL Supported Platforms documentation](https://www.postgresql.org/docs/current/supported-platforms.html)
- [PostgreSQL Installation from Source Code (Ch. 17)](https://www.postgresql.org/docs/current/installation.html)
- [PostgreSQL Installation Platform Notes](https://www.postgresql.org/docs/current/installation-platform-notes.html)
- [PostgreSQL configure/install-make options](https://www.postgresql.org/docs/current/install-make.html)
- [PostgreSQL governance](https://www.postgresql.org/about/governance/)
- [PostgreSQL Build Farm, riscv64 members](https://buildfarm.postgresql.org/cgi-bin/show_members.pl?os=Linux&arch=riscv64)
- [PostgreSQL Known Buildfarm Test Failures](https://wiki.postgresql.org/wiki/Known_Buildfarm_Test_Failures)
- [PostgreSQL Known Buildfarm Test Failures, Archive](https://wiki.postgresql.org/wiki/Known_Buildfarm_Test_Failures_-_Archive)
- [git.postgresql.org gitweb, PostgreSQL source tree](https://git.postgresql.org/gitweb/?p=postgresql.git)
- [Commit c32fcac5, native RISC-V spinlock support](https://git.postgresql.org/gitweb/?p=postgresql.git;a=commit;h=c32fcac56a212b4e6bb5ba63596f60a25a18109a)
- [Commitfest #3284, Native spinlock support on RISC-V](https://commitfest.postgresql.org/34/3284)
- [pgsql-bugs 2016-11-19, "PostgreSQL cannot be compiled on RISC-V"](https://www.postgresql.org/message-id/16690.1479611287%40sss.pgh.pa.us)
- [pgsql-bugs thread, SiFive HiFive Unleashed spinlock failure](https://www.postgresql.org/message-id/CAEYr_8nnwxQji0pQJYqFx7%3DgSM8x7jFJi16O-bLuVYvqvkjsLg%40mail.gmail.com)
- ["IO in wrong state on riscv64," initial report](https://www.postgresql.org/message-id/d79691be-22bd-457d-9d90-18033b78c40a%40gmail.com)
- ["IO in wrong state on riscv64," mail-archive mirror](https://www.mail-archive.com/pgsql-hackers@lists.postgresql.org/msg209326.html)
- [LLVM issue #106203, ORC-JIT relocation failure on RISC-V](https://github.com/llvm/llvm-project/issues/106203)
- [LLVM issue #164194, RISCV fence/load reorder on double inline](https://github.com/llvm/llvm-project/issues/164194)
- [LLVM issue #176001](https://github.com/llvm/llvm-project/issues/176001), [#187458](https://github.com/llvm/llvm-project/issues/187458), [#171978](https://github.com/llvm/llvm-project/issues/171978) (Clang RVV LoopVectorize miscompilation)
- ["Optimize 64-bit atomic access on RV64," v1](http://www.mail-archive.com/pgsql-hackers@lists.postgresql.org/msg239174.html)
- ["Optimize 64-bit atomic access on RV64," v2](http://www.mail-archive.com/pgsql-hackers@lists.postgresql.org/msg239387.html)
- [Mirror PR #422, RV64 atomics patch](https://github.com/MisterRaindrop/postgresql-github-mirror/pull/422)
- [Mirror PR #234, "Trying out stdatomic.h"](https://github.com/MisterRaindrop/postgresql-github-mirror/pull/234)
- ["Add RISC-V Zbb popcount optimization," initial, 2026-03-22](https://www.postgresql.org/message-id/ec81011b-c502-4702-b041-e4bdd2aa346f@app.fastmail.com)
- [Zbb/Zbc series v3, DES fix added](https://www.postgresql.org/message-id/038b2469-776f-404b-ad7e-e85f45da2166@app.fastmail.com)
- [Zbb/Zbc series v4, rebase](https://www.postgresql.org/message-id/3a222ec2-01bb-4798-99e2-eedaf6cae19b@app.fastmail.com)
- [Zbb/Zbc series, DES root cause final](https://www.postgresql.org/message-id/d15fe767-e6d1-488e-915a-42794be2cb12@app.fastmail.com)
- ["Centralised architecture detection," Munro proposal](https://www.postgresql.org/message-id/CA+hUKGL8Hs-phHPugrWM=5dAkcT897rXyazYzLw-Szxnzgx-rA@mail.gmail.com)
- ["Centralised architecture detection," Dagfinn review](https://www.postgresql.org/message-id/87pl482zr1.fsf@wibble.ilmari.org)
- ["Centralised architecture detection," Tom Lane objection](https://www.postgresql.org/message-id/3100002.1780514662@sss.pgh.pa.us)
- [QEMU RISC-V CI proposal, Thomas Munro, 2026-04-14](https://www.postgresql.org/message-id/CA+hUKGL_cWRzY9aA+FgfUPhdd0CciB-qOoGdnduFu6mPiNDxsQ@mail.gmail.com)
- [pgsql-hackers RISC-V search](https://www.postgresql.org/search/?m=1&ln=pgsql-hackers&q=riscv)
- [Debian trixie postgresql-17 riscv64 download page](https://packages.debian.org/trixie/riscv64/postgresql-17/download)
- [Ubuntu noble postgresql-16](https://packages.ubuntu.com/noble/postgresql-16)
- [Ubuntu resolute postgresql-18](https://packages.ubuntu.com/resolute/postgresql-18)
- [docker-library/postgres PR #1345, disable JIT on riscv64](https://github.com/docker-library/postgres/pull/1345)
- [anarazel/pg-vm-images CI infrastructure](https://github.com/anarazel/pg-vm-images)
- [Facebook zstd#4622, 4-way decompression loop not enabled on riscv64](https://github.com/facebook/zstd/issues/4622)
- [GNOME libxml2#971, relaxed-atomics race on weakly-ordered architectures](https://gitlab.gnome.org/GNOME/libxml2/-/issues/971)
- [sourceware glibc bug #33911, static-pie SIGSEGV on riscv64/glibc 2.43 under QEMU](https://sourceware.org/bugzilla/show_bug.cgi?id=33911)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners, six weeks in, 2026-05-12](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE RISC-V Runners launch post, 2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Runners architecture docs](https://riscv-runners.riseproject.dev/docs/architecture/ghfe)
- [riseproject-dev/python-wheels PR #2276, pgserver 0.1.4](https://github.com/riseproject-dev/python-wheels/pull/2276)
- [riseproject-dev/python-wheels release, pgserver-v0.1.4-20260928155916](https://github.com/riseproject-dev/python-wheels/releases/tag/pgserver-v0.1.4-20260928155916)
- [RISE wheel builder doc page](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISC-V International, Database Adaptation Evaluation On RISC-V server](https://riscv.org/blog/risc-v-public-beta-platform-release-%C2%B7-database-adaptation-evaluation-on-risc-v-server/)