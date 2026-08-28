---
title: MariaDB
parent: Project Reports
categories:
  - databases
---

# MariaDB
**Author:** Ludovic HENRY \<ludovic.henry@qti.qualcomm.com\>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for MariaDB
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

MariaDB Server is a GPLv2-licensed relational database management system (RDBMS) forked from MySQL 5.5 in 2010 by Michael Widenius. It includes multiple pluggable storage engines (InnoDB, MyRocks/RocksDB, Aria, Spider, S3), a built-in query optimizer, and a full SQL/procedural language stack. The server is written in C and C++ with targeted assembly for performance-critical subsystems.

**Governance.** MariaDB is controlled by the [MariaDB Foundation](https://mariadb.org/about/), a non-profit Delaware corporation. The Foundation holds legal control but has no technical veto authority. Technical decisions are made by open consensus on the [maria-developers mailing list](https://lists.launchpad.net/maria-developers/). The project uses [JIRA (MDEV)](https://jira.mariadb.org/) for issue tracking and GitHub for code hosting and PR review. New architecture ports do not require a governance vote or a formal RFC; the bar is technical merit reviewed by Foundation staff. Contributions are accepted under the MariaDB Contributor Agreement (MCA), BSD-new, or public domain.

**Corporate sponsors.** As of August 2024 (CREDITS file in the repository):

| Tier | Members |
|---|---|
| Diamond | Amazon, DBS Bank |
| Platinum | IBM, Intel, MariaDB Corporation |
| Gold | Hetzner, IONOS, Scarf |
| Silver | Automattic, Wikimedia Foundation, Nextcloud, Tencent Cloud, Percona, ServiceNow, Alibaba Cloud, and approximately 25 others |

**Community stance on new ports.** The pattern of RISC-V fixes being accepted from IBM employees (Daniel Black), community contributors affiliated with lowRISC (alexfanqi), and OpenBSD developers (Brad Smith) confirms an open, pragmatic stance. No RISC-V maintainer objections appear in any JIRA comment or PR review thread found in the research.

**RISE involvement.** MariaDB is not a RISE Project member and has received no RISE funding. All 27 RISE blog posts from May 2024 through June 2026 were checked; none mentions MariaDB.

---

## 2. Port History and Upstreaming Timeline

All fixes are upstream in the main repository at [MariaDB/server](https://github.com/MariaDB/server). There is no out-of-tree riscv64 patch set.

| Date | Event | Source |
|---|---|---|
| 2020-07-02 | First RISC-V commit: [MDEV-23051](https://jira.mariadb.org/browse/MDEV-23051), RocksDB build fails on riscv64 due to missing `-latomic` linkage. Merged 2020-07-28. Fixed in 10.2.33, 10.3.24, 10.4.14, 10.5.5. | [PR #1617](https://github.com/MariaDB/server/pull/1617) |
| 2020-12-21 | [MDEV-24456](https://jira.mariadb.org/browse/MDEV-24456) filed: `main.join_outer` and `main.join_outer_jcl6` tests time out after 900 seconds on riscv64. Open, unassigned. | JIRA |
| 2021-12-20 | Fix riscv64 build failure linking correctly with pthread (commit `cc3105e`). | GitHub |
| 2022-01-04 | [MDEV-27429](https://jira.mariadb.org/browse/MDEV-27429): Add `rdtime` CSR support for RISC-V cycle timer. Contributor: alexfanqi (community, lowRISC-adjacent). Fixed in 10.8.0. | GitHub commit `d18f6f2` |
| 2022-03-18 | Enable pmem (persistent memory) on riscv64 in Debian packaging. | GitHub commit `63f76d3` |
| 2022-10-26 | [MDEV-29875](https://jira.mariadb.org/browse/MDEV-29875) filed: RocksDB (MyRocks) fails to build on riscv64 due to stale bundled submodule and jemalloc `mm_malloc.h` scope issue. Open, critical. | JIRA |
| 2023-02-03 | [MDEV-30554](https://jira.mariadb.org/browse/MDEV-30554): Re-fix RocksDB libatomic linking regression on riscv64 (regression of MDEV-23051). Fixed in 10.4.29-11.0.1. | GitHub commit `17423c6` |
| 2023-03-18 | [MDEV-33750](https://jira.mariadb.org/browse/MDEV-33750): Enable mariadb-plugin-rocksdb for riscv64 in Debian packaging. Fixed in packaging. | GitHub commit `9e92112` |
| 2024-08-28 | [MDEV-34825](https://jira.mariadb.org/browse/MDEV-34825): FreeBSD riscv64 compatibility patch. Fixed in 10.5.27, 10.6.20, 11.4.4. Contributor: Brad Smith (OpenBSD/community). | GitHub commit `e9b70e5` |
| 2024-11-25 | [MDEV-34815](https://jira.mariadb.org/browse/MDEV-34815): SIGILL on riscv64 when compiled with Clang 17. `rdcycle` is privileged in Linux kernel 6.6+; fix uses `rdtime` instead. Fixed in 10.11.11, 11.4.5, 11.7.2. Contributor: Daniel Black (MariaDB Foundation). | GitHub commit `aca72b3` |
| 2025-01-13 | [MDEV-35827](https://jira.mariadb.org/browse/MDEV-35827): Replace expensive generic `MY_RELAX_CPU` spin-wait with `__builtin_riscv_pause()` on RISC-V. Contributor: Marko Makela (MariaDB Corporation, InnoDB lead). | [PR #3752](https://github.com/MariaDB/server/pull/3752) |
| 2025-02 | [MDEV-36217](https://jira.mariadb.org/browse/MDEV-36217): Build regression from MDEV-35827 on Ubuntu 22.04/24.04 (compiler/assembler too old for `__builtin_riscv_pause`). Switched to raw opcode `.long 0x0100000f`. Fixed in 10.6.22, 10.11.12, 11.4.6, 11.8.2. | JIRA |
| 2025-03-07 | Fix building with both Clang and GCC on RISC-V (compiler guard for GCC-only intrinsic). Contributor: Brad Smith. | GitHub commit `05be186` |
| 2026-03-25 | [MDEV-39142](https://jira.mariadb.org/browse/MDEV-39142): InnoDB fails to start on sv39 kernels (512 GiB VA limit). InnoDB default `innodb_buffer_pool_size_max=8TiB` requires 43-bit VA; fix retries mmap with 128 GiB. Merged 2026-03-25. Contributor: Marko Makela. | [PR #4852](https://github.com/MariaDB/server/pull/4852) |

**Key contributors and affiliations:**

| GitHub login | Name | Affiliation | Primary riscv64 contributions |
|---|---|---|---|
| grooverdan | Daniel Black | MariaDB Foundation (daniel@mariadb.org; previously IBM/daniel@linux.ibm.com) | MDEV-23051 (atomics), MDEV-34815 (SIGILL/Clang fix) |
| dr-m | Marko Makela | MariaDB Corporation (InnoDB lead) | MDEV-35827 (MY_RELAX_CPU), MDEV-39142 (InnoDB VA bits) |
| alexfanqi | -- | Community (alex.fan.q@gmail.com; lowRISC-adjacent) | MDEV-27429 (rdtime timer) |
| bradsmith | Brad Smith | Community/OpenBSD (brad@comstyle.com) | MDEV-34825 (FreeBSD), MDEV-29875 reporter, toolchain fixes |

The riscv64 port is fully upstream with no out-of-tree patches required. IBM drove initial enablement (2020); subsequent work has come from MariaDB Corporation staff and community contributors.

---

## 3. Upstream Support Tier

MariaDB has no published platform support tier document (no `PLATFORMS.md`, `SUPPORTED.md`, or equivalent in the repository). Support tiers are inferred from CI, release blocking, and packaging evidence.

| Criteria | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in CI matrix | Yes (all CI) | No (not in GitLab CI) | No |
| Official riscv64 binaries on mariadb.org | Yes | Yes (tarballs) | No |
| Debian official build | Yes (primary) | Yes | Yes (ports, autopkgtest Pass) |
| Ubuntu official package | Yes | Yes | Yes (via ports repository) |
| Docker Hub official image | Yes | Yes (arm64v8) | No |
| Debian packaging Architecture field | `any` (implicit) | `any` (implicit) | `any` (implicit); RocksDB plugin: explicit riscv64 listed |
| Build blocks releases | Yes | Not verifiable | No |
| Known open correctness bugs | None found | None found | MDEV-24456 (test timeouts), MDEV-29875 (RocksDB build) |

**Assessment:** riscv64 is an implicit community-supported architecture. It is not a release-blocking tier. Debian and Ubuntu maintainers independently build and ship packages from source, and those packages currently pass autopkgtests. MariaDB's own engineering org performs no riscv64 validation before releasing.

The Debian `debian/control` file in the repository explicitly lists `riscv64` in the `Architecture:` field of the `mariadb-plugin-rocksdb` package alongside `amd64 arm64 mips64el ppc64el`, which is the strongest signal of intentional riscv64 support commitment from the MariaDB project itself.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

MariaDB has no JIT query compiler. Architecture-specific code is limited to performance-oriented subsystems: CPU synchronization primitives, hardware timers, checksum acceleration, and InnoDB memory management.

### Component inventory

**`include/my_cpu.h` -- CPU spin-wait / yield hint**

Used in lock contention loops (`LF_BACKOFF`, `ut_delay`). RISC-V implementation (post MDEV-36217, currently in 10.6.22+, 10.11.12+, 11.4.6+, 11.8.2+):

```c
#elif defined __GNUC__ && defined __riscv
  __asm__ volatile(".long 0x0100000f" ::: "memory");
```

The opcode `0x0100000f` is the Zihintpause `pause` instruction encoding. Per the spec, on cores that do not implement Zihintpause, this decodes as a `fence` variant and acts as a memory barrier -- no SIGILL. Works with any GCC that supports inline asm and the `__riscv` predefined macro (GCC 7+).

**`include/my_rdtsc.h` -- hardware cycle/time counter**

Used for profiling and timing infrastructure. RISC-V implementation (added MDEV-27429, Jan 2022):

- riscv64: `__asm __volatile("rdtime %0" : "=r"(result))` - reads the `time` CSR
- riscv32: three-step `rdtimeh`/`rdtime`/`rdtimeh` sequence to handle 64-bit rollover across two 32-bit reads
- Named constant `MY_TIMER_ROUTINE_RISCV = 30`

`rdtime` is a Zicsr pseudo-instruction present in all RV32/RV64 implementations and accessible from user mode. This is correct. `rdcycle` (previously used via Clang's `__builtin_readcyclecounter`) became a privileged instruction in Linux kernel 6.6 and caused SIGILL until MDEV-34815 (Nov 2024).

**`storage/innobase/sync/cache.cc` -- InnoDB pmem cache flush**

RISC-V implementation:

```c
// riscv64 path
__asm__ volatile("fence w,w" ::: "memory");
```

Compared to aarch64 (`dc cvac/cvap` + `dmb ishst`, per-cacheline) and x86 (`clflush/clflushopt/clwb` + `sfence`, per-cacheline). RISC-V lacks a per-cacheline flush instruction in the base ISA; the `fence w,w` is functionally correct for ordering but does not flush cachelines to persistent media. This is an ISA limitation, not a MariaDB gap.

**`mysys/crc32/crc32c.cc` and `mysys/crc32/` -- CRC32 and CRC32c**

| Architecture | Implementation | File |
|---|---|---|
| x86_64 | SSE4.2 hardware CRC | `crc32_x86.c` |
| aarch64 | ACLE intrinsics, hardware CRC | `crc32_arm64.c` |
| ppc64 | POWER8 VSX | `crc32_ppc64.c` |
| riscv64 | `crc32c_slow()` software LUT | (generic fallback) |

No `crc32_riscv64.c` exists in the repository. riscv64 uses the generic software table-based CRC computation for all CRC operations. The RISC-V Zbc extension (carry-less multiply instructions, `clmul`/`clmulh`/`clmulr`) would enable hardware-accelerated CRC, but no MariaDB implementation exists. This is the most significant measurable performance gap for riscv64.

**`storage/innobase/sync/srw_lock.cc` -- InnoDB shared/exclusive lock**

x86 has a hardware RTM (Restricted Transactional Memory) path. ppc64 has a `__TM_*` HTM path. riscv64 falls through to the generic `SUX_LOCK_GENERIC` pthread mutex path. aarch64 also uses the generic pthread path in this file, so this is not exclusively a riscv64 deficit.

**Atomics (`include/atomic/gcc_builtins.h`)**

All architectures use GCC C11 `__atomic_*` builtins. This is an intentional design decision; there are no x86 or arm64 specialized atomic files. On riscv64, sub-word (1- and 2-byte) atomics require linking with `-latomic` because older GCC toolchains do not inline them -- this is the root cause of MDEV-23051 and MDEV-30554.

### Summary table

| Component | amd64 | arm64 | riscv64 | riscv64 status |
|---|---|---|---|---|
| JIT query compiler | None | None | None | N/A (MariaDB has no JIT) |
| CPU relax / pause hint | `PAUSE` instruction | GCC memory clobber asm (generic) | `.long 0x0100000f` (Zihintpause encoding) | Complete |
| Cycle/time counter | `__rdtsc()` | `mrs CNTVCT_EL0` | `rdtime %0` (Zicsr) | Complete |
| CRC32c | SSE4.2 hardware | ACLE hardware | `crc32c_slow()` software LUT | Performance gap (no Zbc path) |
| CRC32 ISO | PCLMULQDQ SIMD | ACLE hardware | Generic C fallback | Performance gap |
| InnoDB pmem cache flush | `clflush`/`clwb` per-cacheline | `dc cvac/cvap` per-cacheline | `fence w,w` (no per-cacheline flush) | ISA limitation |
| InnoDB SRW lock | RTM hardware path | pthread generic | pthread generic | Same as arm64 |
| Atomics (all widths) | GCC `__atomic_*` | GCC `__atomic_*` | GCC `__atomic_*` + `-latomic` required | Complete (requires explicit library link) |
| InnoDB buffer pool VA sizing | 47-bit assumed | 39-bit minimum (MDEV-39142) | 39-bit minimum (sv39, MDEV-39142) | Complete (fixed Mar 2026) |

---

## 5. Build System, Cross-Compilation, and Toolchain

### Native build (on riscv64 host)

```bash
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=RelWithDebInfo \
         -DPLUGIN_ROCKSDB=NO
make -j$(nproc)
```

`-DPLUGIN_ROCKSDB=NO` is required; the RocksDB plugin does not build cleanly on riscv64 (MDEV-29875, open since 2022).

### Cross-compilation (two-stage)

MariaDB generates host-side tools during the build that must execute on the build machine. Cross-compilation requires a two-stage process:

```bash
# Stage 1: build host helper tools
mkdir host && cd host
cmake ..
make import_executables
cd ..

# Stage 2: cross-compile for riscv64 target
mkdir target && cd target
cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/riscv64-toolchain.cmake \
  -DIMPORT_EXECUTABLES=../host/import_executables.cmake
make
```

A minimum toolchain cmake file must set values that cannot be detected at cross-compile time:

```cmake
SET(CMAKE_SYSTEM_NAME Linux)
SET(CMAKE_SYSTEM_PROCESSOR riscv64)
SET(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
SET(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
SET(STACK_DIRECTION -1)
SET(HAVE_IB_GCC_ATOMIC_BUILTINS 1)
```

No MariaDB-provided toolchain cmake file for riscv64 exists in the repository. The files `cmake/riscv64.cmake` and `cmake/toolchain-riscv64.cmake` do not exist (verified as 404).

### Toolchain version requirements

**GCC:** The current source (post MDEV-36217) uses raw opcode `.long 0x0100000f` instead of `__builtin_riscv_pause()`. This works with any GCC supporting inline asm and the `__riscv` predefined macro (GCC 7+). Ubuntu 22.04 GCC 11 is confirmed to work with current MariaDB versions.

**Clang:** Clang 17 or earlier with riscv64 target requires MariaDB 10.11.11+, 11.4.5+, or 11.7.2+ to avoid the MDEV-34815 SIGILL. Earlier MariaDB releases compiled with Clang on riscv64 will crash at runtime when `my_timer_cycles()` executes `rdcycle`, which is a privileged instruction under Linux kernel 6.6+.

**libatomic:** Must be linked explicitly when building RocksDB or any component using sub-word atomic operations on riscv64. This is handled by MariaDB's cmake since MDEV-23051 and MDEV-30554. No manual override needed for current releases.

### QEMU usage

No QEMU usage appears in any MariaDB CI configuration or build documentation. MDEV-24456 shows test suite timeouts on riscv64 (likely under QEMU emulation), but no documented procedure for QEMU-based testing exists in the repository.

### InnoDB pmem (`WITH_INNODB_PMEM`)

The cmake logic in `storage/innobase/CMakeLists.txt` explicitly matches riscv64 in the regex pattern `(aarch|AARCH|p(ower)?pc|x86_|amd|loongarch|riscv)64`, setting `WITH_INNODB_PMEM=ON` by default on riscv64. No manual override is required.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional gaps

| Feature | amd64 | arm64 | riscv64 | Impact |
|---|---|---|---|---|
| RocksDB (MyRocks) storage engine | Supported | Supported | Not buildable from default bundled submodule (MDEV-29875) | High: MyRocks is MariaDB's primary LSM-tree storage engine; riscv64 deployments requiring it must patch manually |
| Docker official image | Available | Available (arm64v8) | Not available | Medium: riscv64 users must build from source or use distro packages |
| Official binary tarball (mariadb.org) | Available | Available | Not available | Low: distro packages available as substitute |
| InnoDB buffer pool full default (8TiB) | Supported (47-bit VA) | Supported | Limited to 128 GiB on sv39 kernels | Low: MariaDB falls back automatically (MDEV-39142, fixed Mar 2026); operator can set `innodb_buffer_pool_size_max` explicitly |

### Performance gaps

| Subsystem | amd64 | arm64 | riscv64 | Estimated impact |
|---|---|---|---|---|
| CRC32c (InnoDB page checksums, binlog, replication) | Hardware SSE4.2 | Hardware ACLE | Software LUT | Data not available: no published benchmark figures for riscv64 vs amd64 MariaDB CRC performance |
| CRC32 ISO (protocol-level checksums) | PCLMULQDQ SIMD | Hardware ACLE | Generic C | Data not available: same caveat |
| Spin-wait efficiency | `PAUSE` instruction | Generic GCC asm | Zihintpause (`.long 0x0100000f`) | Minimal: RISC-V hardware yields correctly; not a bottleneck under normal load |
| SRW lock (InnoDB high-concurrency) | RTM hardware path (when TSX available) | pthread generic | pthread generic | Moderate under high write concurrency; same as arm64 |

### Security hardening

Data not available: no search results found comparing `-fstack-protector`, CFI, shadow call stack, or PAC/BTI coverage between amd64, arm64, and riscv64 in the MariaDB build system.

### Floating-point and numeric semantics

MariaDB uses IEEE 754 double-precision for DOUBLE columns and DECIMAL for exact arithmetic. riscv64 uses the standard F/D extensions for hardware floating-point, which are IEEE 754 compliant. No RISC-V-specific floating-point issues appear in JIRA.

---

## 7. CI/CD Infrastructure

The riscv64 CI situation has been verified by reading the actual CI configuration files in the repository:

| CI system | File | riscv64 present |
|---|---|---|
| GitHub Actions | `.github/workflows/windows-arm64.yml` | No; Windows ARM64 only |
| GitHub Actions | `.github/workflows/backup.yml` | No; ubuntu-latest (x86) only |
| GitHub Actions | `.github/workflows/label_recent_prs.yaml` | No; ubuntu-latest (x86) only |
| GitLab CI | `.gitlab-ci.yml` | No; Fedora/CentOS/Amazon Linux amd64 only |
| Debian Salsa CI | `debian/salsa-ci.yml` | No; amd64 only |
| Buildbot | buildbot.mariadb.org | No; 1,255+ builders, none for riscv64 |
| Jenkinsfile | Not present (404) | N/A |
| Cirrus CI | Not present (404) | N/A |

**Conclusion:** MariaDB has zero riscv64 CI of any kind. The only non-x86 CI target is Windows ARM64 (one GitHub Actions workflow for native ARM64 Windows builds). All riscv64 validation is performed externally by Debian and Ubuntu maintainers as part of their distribution build infrastructure.

| Criteria | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI coverage | Full (GitLab CI, GitHub Actions, Buildbot) | None | None |
| Release-blocking CI | Yes | No | No |
| RISE CI runners | N/A | N/A | None |
| External distro CI | Debian, Ubuntu, Arch | Debian, Ubuntu | Debian (autopkgtest Pass), Arch RISC-V |

---

## 8. Distribution and Release Status

### Official channels

- **mariadb.org binary tarballs:** x86_64 only. No riscv64 tarballs offered.
- **GitHub releases:** No binary assets attached to any release for any architecture. MariaDB does not distribute binaries via GitHub releases.
- **Docker Hub official image** (`docker.io/mariadb`): Supported architectures are amd64, arm64/v8, ppc64le, s390x. riscv64 is absent. The `.architectures-lib` configuration hardcodes the supported set.
- **MariaDB Python connector** (`mariadb` on PyPI, version 1.1.14): Windows wheels (win32, win_amd64 for cp39-cp314) and source distributions only. No riscv64 wheel.

### Community distribution packages

| Distribution | Version | riscv64 status | Notes |
|---|---|---|---|
| Debian sid | 1:11.8.8-1 | Available, autopkgtest Pass | All ~64 packages including mariadb-plugin-rocksdb. Migration to testing blocked by unrelated rtpengine regression. |
| Debian trixie | 11.8.6 | Available | In testing |
| Ubuntu Noble (24.04) | 10.11.x | Available (ports) | Via `ports.ubuntu.com/ubuntu-ports`; approximately 33 packages including RocksDB plugin |
| Ubuntu Questing/Resolute/Stonking | 11.8.x | Available (ports) | Via Ubuntu ports repository |
| Arch Linux RISC-V (archriscv.felixc.at) | 12.3.2-2, 11.8.8-1 | Available | Current and LTS; `mariadb-12.3.2-2-riscv64.pkg.tar.zst` (38 MB), built 2026-06-08; also `mariadb-lts-11.8.8-1-riscv64.pkg.tar.zst` (34 MB) |

**What a user must do to get a working binary on riscv64:** Install from Debian sid, Ubuntu ports, or Arch RISC-V package manager. No action by the MariaDB project is required. RocksDB (MyRocks) will be present in the Debian package but may have limitations due to the stale submodule issue (MDEV-29875).

---

## 9. Dependencies

### Summary table

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blockers |
|---|---|---|---|---|---|
| OpenSSL | TLS/crypto for connections and certificates | Builds (generic C; `linux64-riscv64` target exists but inherits only `linux-generic64`) | No dedicated CI | Packaged (Debian/Ubuntu riscv64) | No assembly crypto optimizations for riscv64 yet; AES-GCM, ChaCha20, Poly1305 PRs open upstream |
| zlib | Row/InnoDB compression; network compression | Builds (pure C) | No riscv64 failures reported | All major distros | No blockers |
| PCRE2 | SQL `REGEXP` engine (system or bundled 10.47) | Builds | JIT backend functional (SLJIT has `sljitNativeRISCV_64.c`); one resolved JIT issue (pcre2#831, closed Oct 2025) | Packaged (Debian/Ubuntu riscv64) | No current blockers |
| libnuma | InnoDB NUMA-interleave memory allocation | Builds | NUMA topology detection works on riscv64 Linux | Packaged | No blockers |
| readline / libedit | mysql/mariadbd client interactive editing | Builds (pure C) | No riscv64 issues | Packaged | No blockers |
| libsystemd | Socket activation, journal logging | Builds (pure C) | No riscv64 issues | Packaged | No blockers |
| RocksDB (bundled submodule) | MyRocks storage engine (LSM-tree) | Not cleanly buildable (MDEV-29875, open critical) | Partial | Not officially released for riscv64 | MDEV-29875 (critical, open); upstream RocksDB PRs #14485 and #14530 open but unmerged as of Jun 2026 |
| libatomic | Atomic ops fallback for sub-word atomics on riscv64 | Required, explicitly linked since MDEV-23051 | Builds when linked | Available in all distros as `libatomic1` | No current blockers |
| Boost.Context | Optional Connector/C async protocol | Builds (riscv64 backend since Boost 1.77) | Not tested | Available in distros | No blockers |

### OpenSSL deep-dive

OpenSSL's `linux64-riscv64` target inherits from `linux-generic64` and compiles the generic C implementation of all cipher and hash primitives. Hardware-accelerated AES-GCM, ChaCha20-Poly1305, and SHA implementations using the RISC-V Vector extension (RVV) and RISC-V Cryptography extensions are the subject of open upstream PRs in the OpenSSL repository (openssl/openssl #30787, #31182, #30552). These PRs were not merged as of the research date. The impact on MariaDB is a performance gap in TLS-intensive workloads on riscv64. No functional impact. See `project-reports/openssl.md` for full details.

### PCRE2 / SLJIT deep-dive

The SLJIT JIT backend for RISC-V (`sljitNativeRISCV_64.c`) is present in the PCRE2 source. One issue was resolved in October 2025 (pcre2#831: JIT was broken with `-march=rv64gcb_zicond` due to march flag conflicts). No current blockers for MariaDB's use of PCRE2 on riscv64. See `project-reports/pcre2.md` for full details.

### RocksDB deep-dive (critical dependency)

The MyRocks storage engine bundles RocksDB as a git submodule. The riscv64 situation:

1. **MDEV-23051** (fixed 2020): Missing `-latomic` linkage. Root cause: riscv64 GCC does not inline sub-word atomic operations; `libatomic` must be linked explicitly. Fixed in cmake.

2. **MDEV-30554** (regression, fixed 2023): The same `-latomic` fix was lost when cmake logic was copied for a new build target. Re-fixed in 10.4.29-11.0.1.

3. **MDEV-29875** (open, critical, last updated 2026-06-02): The bundled RocksDB submodule has not been updated to include upstream commits required for riscv64. Specifically, the `jemalloc_helper` `mm_malloc.h` scope fix (upstream RocksDB commit `bac39944`) must be applied. Upstream RocksDB PRs #14485 and #14530 were open but not merged as of research date. The submodule update effort (MDEV-16523) improved the situation by moving to RocksDB 6.29, but the issue remains open. Brad Smith notes [NEEDS VERIFICATION] that rolling to 6.29 "helped eliminate most of the patching."

**Practical consequence:** Users requiring MyRocks on riscv64 must apply manual patches to the bundled submodule or use a distro-provided package that includes those patches. The Debian `mariadb-plugin-rocksdb` package for riscv64 is explicitly listed in `debian/control` and ships in Debian sid, suggesting Debian maintainers have resolved the build issues in their packaging pipeline, but the upstream MariaDB repository does not build RocksDB cleanly for riscv64 without workarounds.

---

## 11. Known Bugs and Active Issues

### Open issues

| ID | Title | Severity | Status | Notes |
|---|---|---|---|---|
| [MDEV-29875](https://jira.mariadb.org/browse/MDEV-29875) | RocksDB (MyRocks) fails to build on riscv64 from bundled submodule | Critical | Open (last updated 2026-06-02) | Upstream RocksDB PRs #14485, #14530 open; Debian packages work but upstream source does not build cleanly. No fix version set. |
| [MDEV-24456](https://jira.mariadb.org/browse/MDEV-24456) | `main.join_outer` and `main.join_outer_jcl6` tests timeout after 900s on riscv64 | Minor | Open (since 2020-12-21, last updated 2025-06-12) | Unassigned, no fix version set. Likely QEMU speed or a timeout threshold not calibrated for slow architectures. Not a correctness bug. |

### Recently fixed issues (closed, no longer blocking)

| ID | Title | Fixed in | Fixed date |
|---|---|---|---|
| [MDEV-23051](https://jira.mariadb.org/browse/MDEV-23051) | RocksDB build fails: missing `-latomic` | 10.2.33, 10.3.24, 10.4.14, 10.5.5 | Jul 2020 |
| [MDEV-27429](https://jira.mariadb.org/browse/MDEV-27429) | Add RISC-V `rdtime` cycle timer support | 10.8.0 | Jan 2022 |
| [MDEV-30554](https://jira.mariadb.org/browse/MDEV-30554) | RocksDB libatomic linking regression on riscv64 | 10.4.29-11.0.1 | Feb 2023 |
| [MDEV-33435](https://jira.mariadb.org/browse/MDEV-33435) | RISC-V RDCYCLE userland access broken in kernel 6.6+ | 10.11.8, 11.0.6-11.4.2 | 2024 |
| [MDEV-34815](https://jira.mariadb.org/browse/MDEV-34815) | SIGILL on riscv64 compiled with Clang (rdcycle is privileged) | 10.11.11, 11.4.5, 11.7.2 | Dec 2024 |
| [MDEV-35827](https://jira.mariadb.org/browse/MDEV-35827) | Expensive generic `MY_RELAX_CPU`; riscv64 now uses Zihintpause | 10.6+, 11.4+ | Jan 2025 |
| [MDEV-36217](https://jira.mariadb.org/browse/MDEV-36217) | Build regression from MDEV-35827 on Ubuntu 22.04/24.04 toolchains | 10.6.22, 10.11.12, 11.4.6, 11.8.2 | Feb 2025 |
| [MDEV-39142](https://jira.mariadb.org/browse/MDEV-39142) | InnoDB fails to start on sv39 RISC-V kernels (512 GiB VA limit) | Pending (merged Mar 2026) | Mar 2026 |

### Correctness note on MDEV-39142

This is the most operationally significant recent fix. All production RISC-V Linux systems use sv39 (39-bit virtual address space, 512 GiB maximum). InnoDB's default `innodb_buffer_pool_size_max=8TiB` requires 43-bit VA and failed with an unrecoverable error on sv39 at startup. Without the MDEV-39142 fix, InnoDB could not start at all on any RISC-V Linux deployment using a default configuration. The fix, merged 2026-03-25, retries the mmap with 128 GiB on first failure, which fits within sv39. Release targeting is pending as of the research date.

---

## 12. Objections and Upstream Blockers

**No stated objections** to riscv64 support appear in any JIRA comment or PR review thread found in the research. The project has consistently accepted riscv64 contributions from external contributors.

**Technical blockers:**

1. **MDEV-29875 (open, critical):** RocksDB (MyRocks) does not build from the default bundled submodule on riscv64. Unblocked when upstream RocksDB PRs #14485 and #14530 are merged and the MariaDB submodule is updated. No committed timeline.

2. **MDEV-39142 not yet in a stable release:** The InnoDB sv39 fix is merged but not yet tagged into a numbered release. Any riscv64 deployment using InnoDB (the default storage engine) needs either the Debian sid package (which includes the fix) or to build from a post-March-2026 main branch commit.

3. **OpenSSL riscv64 crypto performance:** No hardware-accelerated AES/ChaCha20/SHA in the OpenSSL version shipped with current Linux distributions for riscv64. Multiple upstream PRs are open. This is an OpenSSL project concern, not a MariaDB-specific blocker, but it degrades TLS throughput for any MariaDB deployment requiring encryption-at-transit.

4. **No riscv64 CI:** MariaDB can ship riscv64 regressions silently. MDEV-35827/MDEV-36217 demonstrated this: the Jan 2025 `MY_RELAX_CPU` fix introduced a build regression on Ubuntu 22.04 and 24.04 riscv64 toolchains within weeks. Without CI, regression detection depends on Debian/Ubuntu maintainers filing bugs after package builds fail. The latency from regression introduction to fix release was approximately 1 month in that case.

**Acceptance probability for contributions:** High. The project has accepted riscv64 contributions from IBM, community developers, and OpenBSD developers with no stated friction. The contribution process requires a JIRA MDEV entry and a GitHub PR; no governance vote is required for architecture support changes.

---

## 13. Investment Analysis

RISE has not funded any MariaDB work. All riscv64 work to date has been contributed by IBM (initial port), MariaDB Corporation staff (performance and InnoDB fixes), and community contributors (timer, FreeBSD, toolchain). No duplication risk.

### 13.1 Functional Enablement

**RocksDB (MyRocks) on riscv64 (MDEV-29875).** The bundled RocksDB submodule must be updated to include upstream commits that fix riscv64 build failures. The primary required change is scoping the `jemalloc_helper` `mm_malloc.h` hack to glibc-on-Linux. The upstream RocksDB PRs (#14485, #14530) are the immediate unblocking action; once merged upstream, MariaDB needs to update its submodule reference (MDEV-16523, also open). Estimated effort: 1-2 person-weeks to audit the required upstream commits, validate the build on riscv64, and submit the submodule update PR. The Debian packaging team has implicitly solved this already; the MariaDB upstream has not.

**MDEV-39142 release targeting.** The InnoDB sv39 fix is merged but untargeted to a stable release as of research date. Advocacy to ensure the fix is included in the next stable maintenance releases (10.11.x, 11.4.x, 11.8.x) would ensure riscv64 deployments get a functional InnoDB without building from main. Estimated effort: 0.5 person-weeks of release coordination.

**MDEV-24456 resolution.** The `main.join_outer` test timeout on riscv64 has been open since December 2020 without investigation. Options are: (a) increase the test timeout for slow architectures, or (b) investigate whether the timeout reflects a genuine query planner regression on riscv64. Option (a) is a 1-hour fix if the timeout is purely a calibration issue. Option (b) requires hardware access and profiling. Estimated effort: 0.5-3 person-weeks depending on root cause.

### 13.2 Performance Optimization

**CRC32c/CRC32 acceleration.** Implementing `crc32_riscv64.c` using the RISC-V Zbc extension (carry-less multiply) would bring riscv64 CRC performance in line with amd64 and arm64. CRC32c is used for InnoDB page checksums (every page read and write), binlog checksums, and replication integrity. This is the highest-leverage single optimization available. Estimated effort: 3-5 person-weeks (implement, test on hardware with Zbc, integrate into cmake runtime dispatch). Requires RISC-V hardware with Zbc extension support.

Data not available: no published benchmark comparing `crc32c_slow()` vs hardware CRC on riscv64 MariaDB workloads. The relative impact depends on workload I/O intensity.

**OpenSSL TLS acceleration.** Contributing to or accelerating the open OpenSSL upstream PRs for riscv64 AES/ChaCha20/SHA would benefit MariaDB and every other TLS-using application on riscv64. This is out-of-scope for a MariaDB-specific investment but is complementary. See `project-reports/openssl.md`.

### 13.3 CI/CD Infrastructure

**riscv64 CI in MariaDB's GitLab pipeline.** Adding a riscv64 build and test job to `.gitlab-ci.yml` is the highest-leverage infrastructure investment. Without it, every riscv64 regression requires external detection (Debian build failure, user report). MDEV-36217 showed a regression-to-fix cycle of approximately 1 month; CI would reduce this to days.

Implementation paths:
- Native RISC-V hardware runner (requires runner registration with MariaDB Foundation or GitLab SaaS with riscv64 support)
- QEMU emulation on an x86 GitLab runner (available today; slow but functional for build verification)
- RISE-provided CI infrastructure if the RISE Platform WG offers runner capacity

The minimum viable CI is a build-only job running on QEMU, which would catch the class of regressions seen in MDEV-34815 and MDEV-36217. A full test run (`mysql-test-run`) on QEMU would likely take hours per run and is not practical for per-commit CI, but could be a weekly scheduled job.

Estimated effort: 2-4 person-weeks to author the CI configuration, validate on riscv64 (native or QEMU), and get it accepted by the MariaDB project.

### 13.4 Ecosystem Enablement

MariaDB's dependent package ecosystem (plugins, connectors, ORMs) is addressed in the dependency section. The primary gap is the Python connector (`mariadb` on PyPI), which has no riscv64 wheel. Building and publishing a riscv64 wheel requires either cross-compilation with `crossenv` or a native RISC-V build environment. Estimated effort: 1-2 person-weeks including CI integration for wheel publishing. This is lower priority than the server-side functional and CI gaps.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix RocksDB (MyRocks) build on riscv64 (MDEV-29875): audit required upstream RocksDB commits, update bundled submodule | 1-2 | MariaDB contributor | Critical |
| Functional | Verify MDEV-39142 (InnoDB sv39 fix) is included in next stable maintenance releases | 0.5 | MariaDB contributor | High |
| Functional | Resolve MDEV-24456 join_outer test timeout: calibrate timeout for slow architectures | 0.5-3 | MariaDB contributor | Low |
| Performance | Implement CRC32c/CRC32 using RISC-V Zbc extension (`crc32_riscv64.c`) | 3-5 | MariaDB contributor (requires riscv64 Zbc hardware) | High |
| CI/CD | Add riscv64 build job to MariaDB GitLab CI (QEMU-based minimum, native hardware preferred) | 2-4 | MariaDB contributor / RISE Platform WG | High |
| Ecosystem | Build and publish riscv64 wheel for `mariadb` Python connector on PyPI | 1-2 | MariaDB contributor | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [MariaDB/server GitHub repository](https://github.com/MariaDB/server)
- [MDEV-23051: RocksDB build fails on riscv64 (missing -latomic)](https://jira.mariadb.org/browse/MDEV-23051)
- [MDEV-24456: main.join_outer tests timeout on riscv64](https://jira.mariadb.org/browse/MDEV-24456)
- [MDEV-27429: Support RISC-V cycle timer (rdtime)](https://jira.mariadb.org/browse/MDEV-27429)
- [MDEV-29875: Building RocksDB on aarch64 and riscv64 (jemalloc mm_malloc.h)](https://jira.mariadb.org/browse/MDEV-29875)
- [MDEV-30554: RocksDB libatomic linking on riscv64 (regression of MDEV-23051)](https://jira.mariadb.org/browse/MDEV-30554)
- [MDEV-33435: RISC-V RDCYCLE userland access broken in kernel 6.6+](https://jira.mariadb.org/browse/MDEV-33435)
- [MDEV-33750: Enable mariadb-plugin-rocksdb for riscv64](https://jira.mariadb.org/browse/MDEV-33750)
- [MDEV-34815: SIGILL on riscv64 compiled with Clang (rdcycle is privileged)](https://jira.mariadb.org/browse/MDEV-34815)
- [MDEV-34825: FreeBSD riscv64 compatibility patch](https://jira.mariadb.org/browse/MDEV-34825)
- [MDEV-35827: MY_RELAX_CPU expensive; add Zihintpause for RISC-V](https://jira.mariadb.org/browse/MDEV-35827)
- [MDEV-36217: New MY_RELAX_CPU dependency on riscv_pause breaks riscv64 build](https://jira.mariadb.org/browse/MDEV-36217)
- [MDEV-39142: InnoDB fails to start with CONFIG_ARM64_VA_BITS_39=y (covers riscv64 sv39)](https://jira.mariadb.org/browse/MDEV-39142)
- [PR #1617: MDEV-23051 riscv64 atomics fix (merged 2020-07-28)](https://github.com/MariaDB/server/pull/1617)
- [PR #3752: MDEV-35827 MY_RELAX_CPU performance (merged 2025-01-13)](https://github.com/MariaDB/server/pull/3752)
- [PR #4852: MDEV-39142 InnoDB VA bits (merged 2026-03-25)](https://github.com/MariaDB/server/pull/4852)
- [MariaDB Foundation governance](https://mariadb.org/about/)
- [Debian tracker: mariadb package](https://tracker.debian.org/pkg/mariadb)
- [Arch Linux RISC-V package repository](https://archriscv.felixc.at/repo/extra/)
- [PyPI: mariadb Python connector](https://pypi.org/project/mariadb/)
- [RISE Project member roster](https://riseproject.dev)
- [MariaDB Docker Hub official image](https://hub.docker.com/_/mariadb)