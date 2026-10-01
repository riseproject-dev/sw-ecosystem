---
title: MariaDB
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: PCRE2
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: wolfSSL
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: libnuma
    relation: runtime-dependency
    criticality: optional
  - name: readline
    relation: runtime-dependency
    criticality: optional
  - name: systemd
    relation: runtime-dependency
    criticality: optional
  - name: RocksDB
    relation: runtime-dependency
    criticality: optional
  - name: jemalloc
    relation: runtime-dependency
    criticality: optional
  - name: Boost
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="mariadb" %}

# MariaDB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for MariaDB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

MariaDB Server is a GPLv2-licensed relational database management system (RDBMS) forked from MySQL 5.5 in 2010 by Michael Widenius. It includes multiple pluggable storage engines (InnoDB, MyRocks/RocksDB, Aria, Spider, S3, ColumnStore, and an embedded DuckDB-based engine), a built-in query optimizer, and a full SQL/procedural-language stack. The server is written in C and C++ with targeted inline assembly for performance-critical subsystems.

**Governance.** MariaDB is stewarded by the [MariaDB Foundation](https://mariadb.org/about/), a non-profit that owns the `MariaDB/server` GitHub repository, the official binaries, and mariadb.org. The Foundation is legally and organizationally distinct from **MariaDB plc/Corporation**, the commercial company, though the Corporation is also a major sponsor and employs many core committers. Technical decisions are made on a merit basis ("technical merit," per mariadb.org); governance documents (Governance Framework, Code of Conduct, Committer/Maintainer policy, Security/Deprecation policy, Quality Development Rules) are published separately at mariadb.org/governance/, and no `MAINTAINERS`/`OWNERS`/`CODEOWNERS` file exists in the `MariaDB/server` repository itself. Every contribution requires both a JIRA ticket (jira.mariadb.org, MDEV-xxxx) and a GitHub PR carrying a single logical commit; PRs move Draft to Preliminary Review to Final Review to Approved to Merged, with automatic closing after inactivity (21 days at review stages, 3 months in Draft), per `COMMUNITY_CONTRIBUTIONS.md`. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exists, so there is no formal, written tier policy for CPU architectures; platform support is handled implicitly through CI/buildbot coverage and code review.

**Corporate sponsors.** From the `CREDITS` file (as of August 2024): Amazon, Acronis, Alibaba Cloud, C>onstructor, Development Bank of Singapore (DBS), Intel, MariaDB plc, ServiceNow, WebPros, IBM, IONOS, Automattic, SkySQL, team.blue, Tencent Cloud, Wikimedia Foundation, Cyber Leo, Hetzner, Rumahweb, Tasjeel.ae, Galera Cluster, Percona, and Vettabase (previous sponsors include Booking.com, Microsoft, Nexedi, Visma, Webyog). mariadb.org references Diamond/Platinum/Gold/Silver sponsor tiers on its site, but the pages checked do not break out which company sits in which tier; any specific per-tier attribution is [NEEDS VERIFICATION].

**Top contributors by affiliation** (recent commit history): Oleksandr Byelkin, Sergei Petrunia, Marko Makela, Alexander Barkov, Yuchen Pei, Thirunarayanan Balathandayuthapani, Brandon Nesterenko, Dave Gosselin, and bsrikanth-mariadb are all MariaDB Corporation (@mariadb.com); Georgi Kodinov, Daniel Black, and Sergei Golubchik are MariaDB Foundation (@mariadb.org); Daniel Black is also historically @linux.ibm.com. Fariha Shaikh (Amazon) and Jiakai Xu (Institute of Software, Chinese Academy of Sciences, ISCAS) are the notable non-MariaDB corporate contributors, with Jiakai Xu driving the 2026 RISC-V CRC32 acceleration work. Essentially all core-committer bandwidth sits inside MariaDB plc/Foundation, with occasional external corporate contributions.

**Community stance on new ports.** No formal RISC-V or new-architecture policy document exists. RISC-V support has grown incrementally through individual community/vendor patches (lowRISC-adjacent contributors, OpenBSD's Brad Smith, ISCAS/SpacemiT-linked contributors) accepted via the standard JIRA+PR review pipeline, with MariaDB Foundation/Corporation engineers (chiefly Daniel Black and Marko Makela) acting as reviewers rather than a dedicated ports team. No RISC-V maintainer objection appears in any PR review thread found. Acceptance is de facto defined by what passes review, not by a published architecture-support commitment.

**RISE involvement.** MariaDB is not a RISE Project member (RISE Premier members: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General members: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE - MariaDB appears nowhere on this list). No RISE blog post (checked the full post history from May 2024 through September 2026), no dedicated `riseproject-dev` repository, and no listing on the [RISE wheel builder page](https://riseproject.gitlab.io/python/wheel_builder/) references MariaDB. The one tangential touchpoint: `riseproject-dev/python-wheels` builds riscv64 wheels for `asyncmy`/`asyncmy2`, a Cython MySQL/MariaDB **wire-protocol client library** ([PR #2418](https://github.com/riseproject-dev/python-wheels)), unrelated to the MariaDB server codebase itself and not documented on the RISE blog or in a dedicated repo.

---

## 2. Port History and Upstreaming Timeline

All fixes are upstream in [MariaDB/server](https://github.com/MariaDB/server). There is no out-of-tree riscv64 patch set. PR merge status below was verified directly against the GitHub API (`state`, `merged`, `merged_at`), not inferred from PR titles.

| Date | Event | Source |
|---|---|---|
| 2018-12-01 | [PR #979](https://github.com/MariaDB/server/pull/979), MDEV-23892: link against libatomic on platforms missing 64-bit atomics. Earliest riscv64-relevant PR, but **closed without a GitHub merge** (`merged:false`, closed 2021-10-19); the underlying MDEV-23892 fix landed later via a different path, released in 10.3.32/10.4.22/10.5.13/10.6.5/10.7.1 (2021-10-22). | [PR #979](https://github.com/MariaDB/server/pull/979) |
| 2020-07-02 | [MDEV-23051](https://jira.mariadb.org/browse/MDEV-23051): riscv64 build fails (missing `-latomic`). Merged 2020-07-28. Shipped in 10.2.33, 10.3.24, 10.4.14, 10.5.5. Author: Daniel Black. | [PR #1617](https://github.com/MariaDB/server/pull/1617) |
| 2020-12-20 | MDEV-23892 follow-up, "fix riscv64 build failure by linking correctly with pthread." **Closed without a GitHub merge** (closed 2021-04-15); PR discussion ("Closes: #1717") indicates the patch was pushed directly to 10.3/10.5 by a maintainer rather than merged through GitHub, which is a known MariaDB workflow pattern - the fix is reflected in the same MDEV-23892 release train (10.3.32+). | [PR #1717](https://github.com/MariaDB/server/pull/1717) |
| 2020-12-21 | [MDEV-24456](https://jira.mariadb.org/browse/MDEV-24456) filed: `main.join_outer`/`main.join_outer_jcl6` tests time out after 900s on riscv64. [NEEDS VERIFICATION - not re-confirmed in this round of research; status as of this writing not independently re-checked.] | JIRA |
| 2021-12-30 | "Improve checks for libatomic linking" merged, generalizing the earlier riscv64 atomics detection; shipped 10.3.33 (2022-02-09). No MDEV ticket attached. | [PR #1974](https://github.com/MariaDB/server/pull/1974) |
| 2022-01-05 | [MDEV-27429](https://jira.mariadb.org/browse/MDEV-27429): add RISC-V cycle-timer support (`rdtime`/`rdtimeh`, ported from Google Benchmark). Merged 2022-01-05/06. | [PR #1981](https://github.com/MariaDB/server/pull/1981) |
| 2022-03-18 | Enable InnoDB pmem on riscv64 in build configuration. [NEEDS VERIFICATION - not re-confirmed this round; superseded in effect by the `WITH_INNODB_PMEM` CMake regex now covering riscv64, confirmed directly in `storage/innobase/CMakeLists.txt`.] | GitHub commit `63f76d3` |
| 2022-10-26 | [MDEV-29875](https://jira.mariadb.org/browse/MDEV-29875) filed: RocksDB (MyRocks) build issues on riscv64 from a stale bundled submodule. **Discrepancy:** this ticket was previously reported as open/critical, but current live research into the RocksDB submodule (see Section 9) finds it builds on riscv64 with author-self-reported hardware testing and no CI enforcement, with no reference to this specific ticket surfacing in this round's bug search. Status should be re-verified directly against JIRA; treat as [NEEDS VERIFICATION]. | JIRA |
| 2023-02-01/03 | [MDEV-30554](https://jira.mariadb.org/browse/MDEV-30554): RocksDB libatomic linking on riscv64 (regression of MDEV-23051, tools missing). First attempt ([PR #2472](https://github.com/MariaDB/server/pull/2472)) closed unmerged, superseded by [PR #2477](https://github.com/MariaDB/server/pull/2477), merged 2023-02-07. Shipped 11.0.1 and 10.4.29/10.5.20/10.6.13/10.8.8/10.9.6/10.10.4/10.11.3. | [PR #2477](https://github.com/MariaDB/server/pull/2477) |
| 2023-03-18 | [MDEV-33750](https://jira.mariadb.org/browse/MDEV-33750): enable `mariadb-plugin-rocksdb` for riscv64 in Debian packaging. [NEEDS VERIFICATION this round, but consistent with the `debian/control` riscv64 architecture line confirmed by direct repo read.] | GitHub commit `9e92112` |
| 2024-02-12 | [MDEV-33435](https://jira.mariadb.org/browse/MDEV-33435): RISC-V, use `RDTIME` instead of `RDCYCLE` (`RDCYCLE` became privileged/SIGILL-causing on Linux kernel 6.6+). Merged. Shipped 10.11.8, 11.0.6, 11.1.5, 11.2.4 (2024-05-16), 11.4.2 (2024-05-29). Author: aurel32 (Debian); reviewers Daniel Black, LinuxJedi. | [PR #2980](https://github.com/MariaDB/server/pull/2980) |
| 2024-08-28 | [MDEV-34825](https://jira.mariadb.org/browse/MDEV-34825): FreeBSD riscv64 compatibility patch. [NEEDS VERIFICATION - not re-confirmed this round.] | GitHub commit `e9b70e5` |
| 2024-12-04 | [MDEV-34815](https://jira.mariadb.org/browse/MDEV-34815): SIGILL executing mariadbd compiled for RISC-V with Clang (Clang's `__builtin_readcyclecounter()` lowers to the now-privileged `rdcycle`). Merged via rebase (commit `aca72b3`). Shipped 10.11.11, 11.4.5 (2025-02-04), 11.7.2 (2025-02-13). Author: Daniel Black, filed an upstream LLVM bug (#117701) during review at `dr-m`'s request; Andrew Richardson (arichardson) corrected the fix's scope to Linux-only so FreeBSD's working `rdcycle` was preserved. | [PR #3661](https://github.com/MariaDB/server/pull/3661) |
| 2025-01-13 | [MDEV-35827](https://jira.mariadb.org/browse/MDEV-35827): generic `MY_RELAX_CPU` is expensive; adds `__builtin_riscv_pause()` for RISC-V (also benefits s390x/LoongArch). Merged same day by Marko Makela. Shipped 10.6.21, 11.4.5, 11.7.2, 11.8.1. Explicitly not backported to 10.5 (differing ARM implementation). | [PR #3752](https://github.com/MariaDB/server/pull/3752) |
| 2025-03-21 | [MDEV-36217](https://jira.mariadb.org/browse/MDEV-36217): fix building with Clang and GCC on RISC-V - regression from MDEV-35827, since Clang lacks the `__builtin_riscv_pause()` builtin GCC provides. Merged. Shipped 10.6.22, 10.11.12*/11.4.6* (2025-05-06; *both subsequently pulled for unrelated performance regressions, per JIRA), 11.8.2 (2025-06-04). Author: Brad Smith (community). | [PR #3871](https://github.com/MariaDB/server/pull/3871) |
| 2026-03-25 | [MDEV-39142](https://jira.mariadb.org/browse/MDEV-39142), InnoDB VA-bits startup issue. **Discrepancy / correction:** this was previously characterized as a RISC-V-specific sv39 fix; the live keyword search instead characterizes [PR #4852](https://github.com/MariaDB/server/pull/4852) as an **ARM64 VA_BITS startup issue** with only an incidental riscv reference, grouped among "peripheral/tangential matches ... not RISC-V-specific work." Both 39-bit virtual-address schemes (ARM's `VA_BITS=39`, RISC-V's sv39) are plausibly handled by the same code path, but the primary ticket framing is ARM64, not RISC-V. Treat the prior characterization of this as "the most operationally significant RISC-V fix" as [NEEDS VERIFICATION] and re-confirm against the actual patch diff before relying on it for RISC-V-specific sv39 claims. | [PR #4852](https://github.com/MariaDB/server/pull/4852) |
| 2026-09-14/21 | [MDEV-41115](https://jira.mariadb.org/browse/MDEV-41115): add RISC-V Zbc-accelerated CRC32C implementation. Hardware CRC32C via carry-less multiply (`clmul`/`clmulh`), 128-bit 4-way folding, Barrett reduction, ifunc dispatch via `riscv_hwprobe`. Merged (commit `45717ef4`) 2026-09-21 by Marko Makela after review covering constant representation, alignment, and ISA-extension-detection safety (cross-referenced against MDEV-24745 precedent). Author: Jiakai Xu (ISCAS). Up to ~215x speedup at 64 KiB on SpacemiT X100 hardware (see Section 4). Targets release 13.2.1, scheduled 2026-11-05 - **not yet shipped as of this writing.** | [PR #5669](https://github.com/MariaDB/server/pull/5669) |
| 2026-09-23 | [MDEV-41271](https://jira.mariadb.org/browse/MDEV-41271): add RISC-V Zvbc (vector carry-less multiply) accelerated CRC-32C implementation, a direct follow-on to MDEV-41115. **Open, unmerged** as of 2026-09-30, the most active RISC-V thread in the repository. Author: Jiakai Xu. | [PR #5746](https://github.com/MariaDB/server/pull/5746) |

**Key contributors and affiliations:**

| GitHub login | Name | Affiliation | Primary riscv64 contributions |
|---|---|---|---|
| grooverdan | Daniel Black | MariaDB Foundation (previously IBM) | MDEV-23051 (atomics), MDEV-34815 (SIGILL/Clang fix) |
| dr-m | Marko Makela | MariaDB Corporation (InnoDB lead) | MDEV-35827 (MY_RELAX_CPU), de facto RISC-V correctness gatekeeper across all five major RISC-V PRs including MDEV-41115/41271 |
| aurel32 | - | Debian | MDEV-33435 (RDTIME fix) |
| bradsmith | Brad Smith | Community/OpenBSD | MDEV-36217 (Clang/GCC build fix) |
| 6eanut | Jiakai Xu | ISCAS (Institute of Software, Chinese Academy of Sciences) | MDEV-41115 (Zbc CRC32C, merged), MDEV-41271 (Zvbc CRC32C, open) |

The riscv64 port is fully upstream with no out-of-tree patches required. Initial atomics/build-fix enablement (2020) came from IBM; a steady low-volume cadence of correctness fixes followed through 2025 (Debian, OpenBSD, Foundation/Corporation contributors); and 2026 brought a new, larger wave of RISC-V performance investment from ISCAS (a RISE general member organization), reviewed in depth by MariaDB Corporation's InnoDB lead.

---

## 3. Upstream Support Tier

MariaDB has no published platform support tier document. Support tiers are inferred from CI, release-blocking, and packaging evidence.

| Criteria | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in CI matrix | Yes (GitLab CI, GitHub Actions, Buildbot) | No | No (confirmed: no riscv64 job in `.gitlab-ci.yml`, GitHub Actions, or `appveyor.yml`) |
| Official riscv64 binaries/tarballs on mariadb.org | Yes | Yes | No |
| GitHub release assets | Source-only (`.zip`/`.tar.gz`) for every architecture | Same | Same (no architecture gets compiled binaries from GitHub releases) |
| Debian official build | Yes (primary) | Yes | Yes - Debian sid builds and autopkgtests pass |
| Ubuntu official package | Yes | Yes | Yes - [Ubuntu 26.04 "resolute"](https://packages.ubuntu.com/search?keywords=MariaDB&suite=resolute&searchon=names&section=all) ships `mariadb-server` (1:11.8.6-5, confirmed via direct package-page fetch), `mariadb-client`, and 28 of 37 MariaDB-related binary packages, via the ports archive |
| Docker Hub official image | Yes | Yes (arm64v8) | No - `bashbrew-architectures` line lists only amd64, arm64v8, ppc64le, s390x |
| PyPI `mariadb` connector wheel | Yes (sdist + no Linux wheels at all, win32/win_amd64 only) | Same | No riscv64 wheel (0 of 373 release filenames contain "riscv") |
| Arch Linux RISC-V (archriscv.felixc.at) | N/A | Yes | **No.** A full-content check of the port's own 6,193-line package status page (`.status/status.htm`) found zero occurrences of "maria." Any claim that MariaDB is packaged there, with a specific version/filename, is refuted by this direct check. |
| Debian `debian/control` Architecture field | `any` (implicit) | `any` (implicit) | `any` (implicit); `mariadb-plugin-rocksdb` explicitly lists `riscv64` |
| Build blocks releases | Yes | Not verifiable | No |

**Assessment:** riscv64 is an implicit, community-supported architecture, not a release-blocking tier. Ubuntu and Debian maintainers independently build and ship packages from unmodified upstream source (no riscv64-specific downstream patches were identified in `debian/control` beyond the architecture listing itself), and the Debian sid build and autopkgtests currently pass. This is a clean-distro-build posture: MariaDB's own engineering organization performs no riscv64 validation prior to release; the distro is the de facto release provider for riscv64 binaries.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

MariaDB has no JIT query compiler of its own (PCRE2's bundled SLJIT JIT is a dependency - see Section 9). Architecture-specific code is limited to CPU synchronization primitives, hardware timers, checksum acceleration, and InnoDB memory management. A direct, exhaustive code search (`vfloat32m1_t`, `__riscv_v_intrinsic`, `rvv`, `path:arch/riscv`, `riscv extension:S`, `zba zbb`, `SLJIT_CONFIG_RISCV`) confirms **no `arch/riscv/` directory, no `.S` assembly files, no dedicated JIT backend, and no Zba/Zbb-specific code path** exist in `MariaDB/server` itself.

### Component inventory

**CRC32C / CRC32 checksums (`mysys/crc32/`).** This is the one subsystem with genuine, hand-tuned RISC-V acceleration, and it changed materially in September 2026:

| File | Lines | Purpose | ISA extension | Status |
|---|---|---|---|---|
| `mysys/crc32/crc32c_riscv.cc` | 86 | Runtime CPU-feature detection via the `riscv_hwprobe` syscall (glibc >= 2.40 ifunc-resolver fast path), dispatch glue | Zbc (detection) | Complete |
| `mysys/crc32/crc32c_riscv_zbc.cc` | 209 | Hand-written inline-asm `clmul`/`clmulh` kernel, 128-bit 4-way parallel folding, Barrett reduction, for both CRC-32C (Castagnoli) and ISO-3309 CRC-32 (adapted from apache/brpc#3312); compiled only with `-march=rv64gc_zbc_zbb` | Zbc (carry-less multiply) | Complete, functional, merged |
| `mysys/crc32/crc32c.cc` / `mysys/crc32ieee.cc` | 575 / 79 | Generic dispatcher; adds `HAVE_RISCV_ZBC` branch selecting the Zbc path via `rv_zbc_supported()`, falls back to zlib's software implementation otherwise | Zbc (glue) | Complete |
| `mysys/crc32/crc32c_riscv_zvbc.cc` (in review, PR #5746) | - | 4-lane vector core using RVV intrinsics, 128-bit folding, deinterleaved loads, adaptive to 256-bit and 128-bit VLEN; dispatch prefers scalar Zbc when available, falls back to vector Zvbc otherwise | Zvbc (vector carry-less multiply) | **Open, not yet merged** |

This corrects any characterization of MariaDB's RISC-V CRC32 path as "generic software LUT only": that was true until MDEV-41115 merged (2026-09-21); as of the current `main` branch, CRC32C on riscv64 dispatches to a hand-tuned Zbc hardware kernel when available, with a vector Zvbc path in active review. Both are gated so unsupported hardware still falls back correctly.

**`include/my_cpu.h` - CPU spin-wait/yield hint.** RISC-V uses `__builtin_riscv_pause()` (GCC) or a raw/fence-encoded pause instruction for compilers lacking that builtin, as of MDEV-35827/MDEV-36217.

**`include/my_rdtsc.h` - hardware cycle/time counter.** Defines `MY_TIMER_ROUTINE_RISCV`, using the `RDTIME`/`RDTIMEH` instruction (Zicsr) rather than `RDCYCLE`, which became a privileged instruction under Linux kernel 6.6+ (MDEV-33435, MDEV-34815).

**`storage/innobase/sync/cache.cc` - InnoDB pmem cache flush.** Emits `fence w,w` inline asm on `__riscv && __riscv_xlen==64` for persistent-memory redo-log write ordering. RISC-V lacks a per-cacheline flush instruction in the base ISA, unlike x86 (`clflush`/`clwb`) or ARM (`dc cvac/cvap`); this is an ISA limitation, not a MariaDB gap.

**`storage/innobase/buf/buf0buf.cc` / `storage/innobase/log/log0recv.cc`.** Trivial `#if defined __riscv` compatibility branches: one controls buffer-pool huge-page/size heuristics (grouped with aarch64/mips/loongarch64), the other excludes RISC-V from a GCC-builtin `clz` (count-leading-zero) fast path, since RISC-V has no single leading-zero-count instruction, falling through to generic/`std::countl_one` code.

**Atomics (`include/atomic/gcc_builtins.h`).** All architectures use GCC C11 `__atomic_*` builtins; there is no RISC-V-specific atomics file. Sub-word (1- and 2-byte) atomics on riscv64 require explicit `-latomic` linkage because older GCC toolchains do not inline them - this is the root cause of the original MDEV-23051/MDEV-30554 build failures, now handled automatically by CMake.

### Summary table

| Component | amd64 | arm64 | riscv64 | riscv64 status |
|---|---|---|---|---|
| JIT query compiler | None (MariaDB has none) | None | None | N/A |
| CPU relax/pause hint | `PAUSE` instruction | Generic GCC asm | `__builtin_riscv_pause()` / fence-encoded fallback | Complete |
| Cycle/time counter | `__rdtsc()` | `mrs CNTVCT_EL0` | `rdtime` (Zicsr) | Complete |
| CRC32C | SSE4.2 hardware | ACLE hardware | **Zbc hardware-accelerated kernel (merged); Zvbc vector kernel (in review)** | Hand-tuned, at near parity with amd64/arm64 for the merged path |
| CRC32 ISO | PCLMULQDQ SIMD | ACLE hardware | Same Zbc kernel, generic C fallback otherwise | Hand-tuned (as above) |
| InnoDB pmem cache flush | `clflush`/`clwb` per-cacheline | `dc cvac/cvap` per-cacheline | `fence w,w` (no per-cacheline flush) | ISA limitation, not a code gap |
| InnoDB SRW lock | RTM hardware path (when TSX available) | pthread generic | pthread generic | Same as arm64 |
| Atomics (all widths) | GCC `__atomic_*` | GCC `__atomic_*` | GCC `__atomic_*` + explicit `-latomic` | Complete |
| RVV (vector) usage elsewhere | N/A | N/A | None confirmed anywhere outside the in-review Zvbc CRC32C path | No RVV beyond the single in-review feature |

---

## 5. Build System, Cross-Compilation, and Toolchain

**No riscv64 build documentation exists in the repository.** `README.md` has no architecture-specific build instructions (only a link out to mariadb.org); `BUILDING.md`, `docs/building.md`, and `docs/cross-compilation.md` do not exist; `INSTALL` does not exist as real content (only 160/212-byte stub files `INSTALL-SOURCE`/`INSTALL-WIN-SOURCE`). No `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake` exists anywhere in the tree. riscv64 is a "works if your generic toolchain works" target, not a documented, first-class one.

### Native build

```
mkdir bld && cd bld
cmake .. -DCMAKE_BUILD_TYPE=RelWithDebInfo
make -j$(nproc)
```

`CMAKE_MINIMUM_REQUIRED(VERSION 3.12.0)`; C++ standard fixed at C++17. No riscv64-specific `-DUSE_X=OFF` flag is required by name; instead several plugins silently self-disable at configure time on riscv64 (see Section 6).

### Cross-compilation

MariaDB needs a handful of native code-generator executables (`comp_err`, `comp_sql`, `gen_lex_hash`, `gen_lex_token`, etc.) to run during the build, which is a problem cross-compiling to riscv64 from an x86_64 host. Two generic (not riscv64-specific) mechanisms exist in the build system:

- **Emulator path:** pass `-DCMAKE_CROSSCOMPILING_EMULATOR=/usr/bin/qemu-riscv64-static` on the cross-compile configure line; CMake then runs every build-time-generated executable (and `CHECK_C_SOURCE_RUNS` probes) under QEMU user-mode emulation.
- **Two-stage native-import path:** first run a native build through `make import_executables`, producing `import_executables.cmake`; then pass `-DIMPORT_EXECUTABLES=/path/to/import_executables.cmake` on the actual cross-compile configure step, so host-built binaries substitute for target binaries entirely. (`CMakeLists.txt` lines 463-466 and 552-560.)

No `CMAKE_TOOLCHAIN_FILE` for riscv64 is shipped; a user must write one setting at minimum `CMAKE_SYSTEM_NAME=Linux`, `CMAKE_SYSTEM_PROCESSOR=riscv64`, and the riscv64 cross-compiler paths.

### Toolchain version requirements

No riscv64-specific compiler-version floor is stated anywhere in the repository. The one implicit, riscv64-specific requirement is in `mysys/CMakeLists.txt` (lines 153-190): a `CHECK_CXX_SOURCE_COMPILES` probe for whether the compiler accepts `-march=rv64gc_zbc_zbb` and can inline-assemble `clmul`/`clmulh`. This probe is **optional and gracefully degrading** - if it fails, `HAVE_RISCV_ZBC` is simply undefined and the Zbc-accelerated CRC32C path is skipped without failing the build. In practice this needs a RISC-V bitmanip-capable toolchain (GCC with Zba/Zbb/Zbc/Zbs support, paired binutils) [NEEDS VERIFICATION - exact minimum version not stated in the MariaDB repository itself].

### Plugins that self-disable on riscv64

- **DuckDB** (`storage/duckdb/CMakeLists.txt`, lines 6-9): `IF(NOT (CMAKE_SYSTEM_PROCESSOR STREQUAL "x86_64" OR ... "aarch64")) -> skip`, printing "DuckDB: not x86_64 or aarch64, skipping." riscv64 is excluded unconditionally.
- **MariaDB ColumnStore** (`storage/columnstore/CMakeLists.txt`, lines 54-56): the submodule is only added `IF(CMAKE_SYSTEM_PROCESSOR STREQUAL "x86_64" OR ... "amd64" OR ... "aarch64")`; riscv64 falls through silently, with no build target created at all.
- RocksDB's arch-specific build tuning (`storage/rocksdb/build_rocksdb.cmake`) has branches only for ppc64/powerpc64 and arm64/aarch64 - riscv64 builds with generic, non-arch-tuned flags.
- InnoDB's `WITH_INNODB_PMEM` option defaults ON for riscv64 (`storage/innobase/CMakeLists.txt` line 52, regex `(aarch|AARCH|p(ower)?pc|x86_|amd|loongarch|riscv)64`), grouping riscv64 with other "trusted" 64-bit architectures despite the absence of any riscv64 CI validating it.

### QEMU usage

No `QEMU` string appears anywhere in `MariaDB/server`'s own CI configuration. QEMU is only relevant as a user-supplied `CMAKE_CROSSCOMPILING_EMULATOR` for manual cross-builds; the project documents no QEMU-based testing procedure of its own.

### Docker

`MariaDB/mariadb-docker` (official image source) contains a shell `case` statement mapping RPM architecture names that incidentally includes `s390x|riscv64) dpkgArch=$rpmArch ;;` for downloading a helper binary, but every Dockerfile's actual `# bashbrew-architectures:` manifest line lists only `amd64 arm64v8 ppc64le s390x`. riscv64 is **not** a published Docker Hub target; the case-arm appears to be dead code copied from a shared bashbrew template.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional gaps

| Feature | amd64 | arm64 | riscv64 | Impact |
|---|---|---|---|---|
| MariaDB ColumnStore (columnar analytics engine) | Supported | Supported | **Build target not created at all** - excluded by CMake arch check (`storage/columnstore/CMakeLists.txt`) | High for analytics workloads: ColumnStore is entirely unavailable on riscv64 from upstream source, and the dedicated per-dependency assessment grades riscv64-ColumnStore readiness red, unpackaged anywhere (no GitHub release binaries, not on PyPI, not in Ubuntu, not in Debian, not in Arch RISC-V) |
| DuckDB-backed storage engine | Supported | Supported | **Explicitly excluded** by CMake (`storage/duckdb/CMakeLists.txt`) | Medium: this embedded OLAP engine is unavailable on riscv64 from upstream source regardless of whether DuckDB itself supports riscv64 upstream (DuckDB's own riscv64 release-binary issue, #21494, is closed/landed upstream, but MariaDB does not attempt to build it there) |
| RocksDB (MyRocks) storage engine | Supported | Supported | Builds on riscv64 (author-self-reported hardware testing on SG2044), no automated CI enforcement | Low-to-medium: builds, but regression risk is uncontrolled; see Section 9 |
| Docker official image | Available | Available (arm64v8) | Not available | Medium: riscv64 users must build from source or use distro packages |
| Official binary tarball (mariadb.org) | Available | Available | Not available | Low: distro packages substitute |

### Performance gaps

| Subsystem | amd64 | arm64 | riscv64 | Status |
|---|---|---|---|---|
| CRC32C (InnoDB page checksums, binlog, replication) | Hardware SSE4.2 | Hardware ACLE | **Zbc hardware-accelerated** (merged); measured up to ~215x faster than the generic path at 64 KiB on SpacemiT X100 hardware | At or near parity for buffers large enough to amortize dispatch overhead; small-buffer (128B) speedup is lower (~8.6x) but still substantial |
| CRC32C, vector path | N/A | N/A | Zvbc (RVV) implementation **open in review**, reporting 4.0x-38.7x speedup over the scalar-Zbc baseline on SpacemiT X100 (256-bit VLEN) | Pending merge |
| Spin-wait efficiency | `PAUSE` instruction | Generic GCC asm | `__builtin_riscv_pause()` | Complete, not a bottleneck |
| SRW lock (InnoDB high-concurrency) | RTM hardware path (when TSX available) | pthread generic | pthread generic | Moderate under high write concurrency; same as arm64, not a riscv64-specific deficit |

Data not available: no published general sysbench/TPC-C/TPC-H MariaDB riscv64-vs-amd64 or riscv64-vs-arm64 throughput comparison was found (checked mariadb.org, Percona's blog including its 2026 MySQL Ecosystem Performance Benchmark Report, and SmallDatum - the Percona report's rich sysbench figures, e.g. 32,392 TPS at 128 threads for MariaDB 10.11, are x86-64-only). The VLDB 2025 ADMS workshop paper "RISC-V Meets RDBMS" reports RVV delivering roughly 1.03x-10x speedups on compute-intensive TPC-H operators generally, but it could not be confirmed whether MariaDB specifically was one of the systems under test.

### Security hardening

Data not available: no findings compare `-fstack-protector`, CFI, shadow call stack, or RISC-V pointer-masking/CFI-extension coverage between amd64, arm64, and riscv64 in the MariaDB build system.

### Floating-point and numeric semantics

MariaDB uses IEEE 754 double-precision for DOUBLE columns and DECIMAL for exact arithmetic. riscv64 uses the standard F/D extensions for hardware floating-point, which are IEEE 754 compliant. No RISC-V-specific floating-point or NaN-canonicalization bug tied to MariaDB was found in JIRA or GitHub Issues.

---

## 7. CI/CD Infrastructure

A direct, line-by-line read of every CI configuration file on `main` (commit `d45cf75c`, 2026-09-30) confirms **zero riscv64 CI of any kind**:

| File | Trigger | Runner | "riscv" match |
|---|---|---|---|
| `.github/workflows/backup.yml` (79 lines) | schedule (cron) | `ubuntu-latest` | 0 |
| `.github/workflows/generate-api-docs.yml` (37 lines) | push, pull_request | `ubuntu-latest` | 0 |
| `.github/workflows/windows-arm64.yml` (55 lines) | push, pull_request | `windows-11-arm` | 0 |
| `.github/workflows/label_recent_prs.yaml` (78 lines) | schedule, workflow_dispatch | `ubuntu-latest` | 0 |
| `.gitlab-ci.yml` (26,483 bytes) | GitLab CI | - | 0 |
| `appveyor.yml` | AppVeyor | - | 0 |

No `.cirrus.yml`, `Jenkinsfile`, `.travis.yml`, `azure-pipelines.yml`, or `.circleci/` exists. The `10.11` stable branch has no `.github/workflows/` directory at all. The only non-x86 CI target anywhere is `windows-arm64.yml`, which targets Windows on ARM64 - unrelated to RISC-V. A GitHub code search for `riscv64` scoped to `path:.github` across the whole MariaDB org returned zero results. None of the PRs that fix riscv64 build issues (#1617, #2477, #2980, #3661, #3752, #3871, #5669, #5746) add, modify, or reference a CI workflow file - they are source-level fixes validated by their authors on physical hardware, not by any repository-level automated pipeline.

| Criteria | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI coverage | Full (GitLab CI, GitHub Actions, Buildbot) | None found in the files checked | None |
| Release-blocking CI | Yes | No | No |
| RISE CI runners | N/A | N/A | None |
| External distro CI | Debian, Ubuntu, Arch | Debian, Ubuntu | Debian sid (build + autopkgtest pass) |

**Conclusion:** all riscv64 validation is performed externally by Debian and Ubuntu maintainers as part of their own distribution build infrastructure, with no feedback loop into MariaDB's own CI. The MDEV-35827/MDEV-36217 cycle demonstrates the cost of this: a January 2025 performance fix broke the riscv64 build on Ubuntu 22.04/24.04 toolchains, and the regression took roughly a month to surface and fix without any CI to catch it immediately.

---

## 8. Distribution and Release Status

### Official channels

- **mariadb.org binary tarballs:** x86_64 only; no riscv64 tarballs.
- **GitHub releases (`MariaDB/server`):** source-only for every architecture. Checked release tags (`mariadb-13.1.1`, `mariadb-13.0.2`, `mariadb-12.3.3`, `mariadb-11.8.9`, `mariadb-11.4.13`, `mariadb-10.11.19`, `mariadb-10.6.28`): each has exactly two assets, a `.zip` and a `.tar.gz` source archive. No compiled binaries of any kind are attached to any release.
- **Docker Hub official image:** `bashbrew-architectures` lists amd64, arm64v8, ppc64le, s390x only. riscv64 is absent.
- **MariaDB Python connector** (`mariadb` on PyPI, latest 1.1.14): all 373 release filenames checked are Windows wheels (win32/win_amd64) or source distributions. No riscv64 wheel, and no Linux wheel of any architecture - this connector ships Windows wheels plus sdist only. The RISE wheel-builder GitLab project ([`riseproject.gitlab.io/python/wheel_builder`](https://riseproject.gitlab.io/python/wheel_builder/)) does not list `mariadb` among its ~80 supported riscv64 packages, and a direct query of its PyPI-simple endpoint redirects to plain pypi.org with the same result.

### Community distribution packages

| Distribution | riscv64 status | Notes |
|---|---|---|
| Debian sid | Available, 1:11.8.8-1 per the existing per-project tracking; builds and autopkgtests pass | Confirmed via Debian sid build/autopkgtest status |
| Ubuntu 26.04 "resolute" | Available | Confirmed via direct fetch of [`packages.ubuntu.com/resolute/riscv64/mariadb-server`](https://packages.ubuntu.com/resolute/riscv64/mariadb-server) (HTTP 200, package `mariadb-server (1:11.8.6-5)`, ports/main); the broader package search lists 28 of 37 MariaDB-related binary packages for riscv64, including `mariadb-server`, `mariadb-client`, `mariadb-client-core`, `mariadb-server-core`, `mariadb-backup`, `libmariadb3`, `libmariadb-dev`, `libmariadbd-dev`, `python3-mariadb-connector`, and most `mariadb-plugin-*` packages (exception: `mariadb-plugin-mroonga`, amd64/arm64/armhf/ppc64el only) |
| Ubuntu Noble/Jammy ports | Available | Same package set via the ports archive |
| Arch Linux RISC-V (archriscv.felixc.at) | **Not available.** A direct, full-content read of the port's 6,193-line package status page found zero "maria" matches. Any earlier claim of specific MariaDB package filenames/versions there (e.g. `mariadb-12.3.2-2-riscv64.pkg.tar.zst`) is **refuted** by this check and should not be relied upon. | Discrepancy flagged per verification policy: treat the prior claim as superseded by this direct re-check |

**What a user must do to get a working binary on riscv64:** install from Debian sid or Ubuntu ports. No action by the MariaDB project itself is required, and no action is currently possible on Arch Linux RISC-V, where the package does not exist. ColumnStore and the DuckDB-backed storage engine are unavailable on riscv64 regardless of distribution, since MariaDB's own build system excludes them from the riscv64 build target before packaging ever happens.

---

## 9. Dependencies

### Summary table

Direct dependencies are listed as given; indirect/recursed dependencies found via research (git submodules and transitive build dependencies) are appended below the direct set.

| Dependency | Relation | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes / blockers |
|---|---|---|---|---|---|---|
| OpenSSL | runtime-dependency | critical | Builds cleanly (generic `linux-generic64`-derived target); mainstream distro architecture | Test coverage is QEMU-emulation/community-driven, no dedicated native CI | Ships via Debian/Ubuntu/Arch RISC-V packages | No RISC-V-specific hardware-crypto (AES-GCM, ChaCha20-Poly1305, RVV/scalar-crypto-extension) fast path is merged upstream as of this writing; see `project-reports/openssl.md` |
| GCC | build-dependency and runtime-dependency | critical | GCC is itself a riscv64-supported upstream compiler (used both to build MariaDB and, via `libatomic`, linked at runtime for sub-word atomics) | N/A (toolchain, not MariaDB-tested) | Available in all riscv64 distros | GCC's riscv64 bitmanip (Zba/Zbb/Zbc/Zbs) support is required for MariaDB's optional Zbc CRC32C fast path; exact minimum version not documented in MariaDB's own build system [NEEDS VERIFICATION] |
| CMake | build-dependency | critical | CMake itself has broad riscv64 support; MariaDB requires CMake >= 3.12.0 | N/A | Available in all riscv64 distros | No MariaDB-specific riscv64 CMake issues found |
| PCRE2 | runtime-dependency | critical | Builds; contains the SLJIT JIT backend with a native riscv64 code generator (`sljitNativeRISCV_64.c`) | JIT functional on riscv64 (RV64GC) since PCRE2 10.41; one closed JIT regression (`pcre2#831`, `-march=rv64gcb_zicond` conflict, fixed via PRs #835/#836, 2025-10/11) | Packaged (Debian/Ubuntu riscv64) | PCRE2's separate non-JIT SIMD fast-path scanner excludes riscv64 entirely (`SLJIT_CONFIG_RISCV` is absent from its guard), falling back to scalar even though the JIT's own vector-extension SIMD support works; see `project-reports/pcre2.md` |
| LLVM | build-dependency | optional | LLVM/Clang riscv64 code generation works, but is the source of MDEV-34815 (Clang emits the privileged `rdcycle` instruction via `__builtin_readcyclecounter()`) and MDEV-36217 (Clang lacks `__builtin_riscv_pause()`) | N/A | Available in riscv64 distros | Two confirmed Clang/GCC-parity gaps on RISC-V, both patched around in MariaDB rather than fixed in LLVM (an upstream LLVM issue, #117701, was filed during MDEV-34815's review) |
| wolfSSL | runtime-dependency | optional | Builds; bundled as `extra/wolfssl` git submodule | Multiple RISC-V-specific issues found and closed upstream (asm alignment bugs #10525, extension-selection #10526, SHA3 asm build #10515, unaligned-load faults #10043), indicating active riscv64 optimization work; QEMU-based riscv64 CI historically used (#7943) | No dedicated per-project report tracked in this workflow yet | 4 RISC-V-specific bugs found, all closed/fixed |
| zlib | runtime-dependency | optional | Builds cleanly (pure C) | No riscv64 failures reported | Available in all major distros | No blockers |
| libnuma | runtime-dependency | optional | Builds (pure C); used for InnoDB NUMA-interleave memory allocation | NUMA topology detection works on riscv64 Linux | Packaged | No blockers |
| readline | runtime-dependency | optional | Builds (pure C) | No riscv64 issues found | Packaged | No blockers |
| systemd | runtime-dependency | optional | Builds (pure C); used for socket activation and journal logging | No riscv64 issues found | Packaged | No blockers |
| RocksDB | runtime-dependency | optional | Bundled as `storage/rocksdb/rocksdb` git submodule; builds on riscv64, with author-self-reported testing on SG2044 hardware in upstream PRs | No RISE runner involvement, no CI enforcement of any kind | Debian sid riscv64 build "Installed" (host `rv-manda-01`); Ubuntu 24.04 ships `librocksdb-dev`/`librocksdb8.9` for riscv64 | A previously tracked critical build-blocker ticket (MDEV-29875) could not be re-confirmed this round and may be stale; see Section 2 and Section 11 for the discrepancy. RocksDB's own compression sub-dependencies (zstd, LZ4) have open upstream RVV-vectorization gaps |
| jemalloc | runtime-dependency | optional | Builds and passes on riscv64; USDT tracing is explicitly disallowed on riscv64 at configure time but is off by default and does not block the build | Not exercised by jemalloc's own CI (no riscv64 job) | Available via distro packages | Open issue #2917 (GCC 16 build compatibility, not riscv64-specific but relevant since riscv64 toolchains track GCC closely) |
| Boost | runtime-dependency | optional | Boost.Context has had a riscv64 backend since Boost 1.77; builds on riscv64 | Not independently tested in this round | Available in distros | No blockers found |

### Indirect/recursed dependencies (git submodules and transitive build dependencies, found via research)

| Dependency | Role | riscv64 status |
|---|---|---|
| MariaDB ColumnStore (`mariadb-corporation/mariadb-columnstore-engine`, submodule) | Columnar analytics storage engine, heavy SIMD/vectorized numerics | **Excluded from the riscv64 build target entirely** by CMake arch check; not packaged anywhere (no GitHub release binaries, not on PyPI, not in Ubuntu, not in Debian, not in Arch RISC-V); 5 unresolved engineering blockers tracked separately, graded red for riscv64 readiness in its own dedicated assessment |
| DuckDB (`duckdb/duckdb`, submodule `storage/duckdb/third_parties/duckdb`) | Embedded OLAP storage engine, vectorized SIMD execution | **Excluded from the riscv64 build target entirely** by CMake arch check, independent of DuckDB's own upstream riscv64 support (DuckDB issue #21494, "add riscv64 to release binaries and Python wheel builds," is closed/landed upstream) |
| wsrep-lib / Galera (`mariadb-corporation/wsrep-lib` + `codership/galera`, submodule) | Cluster replication (wsrep API) | 0 riscv64 GitHub issues found for wsrep-lib itself; Galera-4 confirmed "Installed" in Debian sid riscv64 (26.4.27-1) as of 2026-08-10; no dedicated riscv64 CI upstream |
| MariaDB Connector/C (`mariadb-corporation/mariadb-connector-c`, submodule) | Client library linked into server tools | Builds; its bundled zlib `chunkcopy.h` SIMD inflate path is gated to SSE2/NEON only and is excluded entirely on riscv64, falling back to generic zlib (not a hard blocker); Ubuntu ships `libmariadb3`/`libmariadb-dev` for riscv64 |
| LZ4 | Optional InnoDB page compression | Builds and passes correctness on riscv64; RVV-vectorized paths proposed upstream but unmerged (4 open proposals) |
| Snappy | Optional InnoDB/RocksDB compression | Builds; has a dedicated riscv64-qemu test CI workflow upstream |
| zstd | Optional InnoDB/backup/replication compression | Builds; a historical silent 32-bit-codepath bug from RISC-V not being recognized as `__64BIT__` was fixed upstream (PR #4525, merged 2025-12-02); some SIMD fast-path code remains unoptimized for riscv64 |
| LZO2 | Optional compression codec | Not independently researched this round (no GitHub mirror; canonical source is a tarball) |
| fmt (libfmt) | Bundled string-formatting library | Only one riscv64/ARM-adjacent issue found and it is unrelated to RISC-V; no known riscv64 problems |

### Deep-dive: PCRE2 / SLJIT

PCRE2's SLJIT JIT backend has full, upstream, actively-maintained riscv64 code generation, including V-extension SIMD support inside the JIT since mid-2024 - genuinely ahead of most of MariaDB's own dependency tree on RISC-V maturity. The one gap is that PCRE2's separate non-JIT SIMD scanner path does not dispatch on riscv64 at all.

### Deep-dive: RocksDB (MyRocks)

The riscv64 history here is a repeated libatomic-linkage story (MDEV-23051 fixed 2020, regressed and re-fixed as MDEV-30554 in 2023) followed by an open question about the bundled submodule's current build health (MDEV-29875, previously tracked as open/critical but not re-confirmed this round against live JIRA data - see the discrepancy note in Section 2). Current live evidence shows the submodule building on physical riscv64 hardware per self-reported author testing, and the resulting `mariadb-plugin-rocksdb` Debian package is explicitly listed as riscv64-supported in `debian/control`. This is a case where the practical, packaged state (Debian ships it) may be ahead of the upstream bundled-submodule state (an open ticket's exact current status should be re-checked directly against jira.mariadb.org).

### Deep-dive: wolfSSL

As a bundled alternative TLS provider, wolfSSL shows more RISC-V-specific engineering activity than MariaDB's default OpenSSL path: four distinct riscv64 assembly/correctness bugs were found and resolved upstream (alignment bugs, extension-selection logic, SHA3 assembly build issues, unaligned-load faults), evidence of active hardware-level optimization that OpenSSL's generic riscv64 target currently lacks.

---

## 11. Known Bugs and Active Issues

### Open issues

| ID | Title | Severity | Status | Notes |
|---|---|---|---|---|
| [MDEV-41271](https://jira.mariadb.org/browse/MDEV-41271) | Add RISC-V Zvbc accelerated CRC-32C implementation | Feature (critical per the implementing PR's own label) | **Open**, in review as of 2026-09-30 | [PR #5746](https://github.com/MariaDB/server/pull/5746); blocked on final reviewer sign-off from `dr-m` after a round covering vector-register-preservation semantics, code style, and a promised (not yet filed) follow-up to deduplicate constants shared with MDEV-41115 |
| [MDEV-29875](https://jira.mariadb.org/browse/MDEV-29875) | RocksDB (MyRocks) build issues on riscv64 from bundled submodule | Previously tracked as critical | [NEEDS VERIFICATION] - not re-confirmed against current JIRA state this round; live research into the RocksDB submodule found it building on riscv64 with no mention of this specific blocker, suggesting it may have been resolved or superseded, but this is not independently confirmed | Re-verify directly against jira.mariadb.org before treating as a live blocker |
| [MDEV-24456](https://jira.mariadb.org/browse/MDEV-24456) | `main.join_outer`/`main.join_outer_jcl6` tests timeout after 900s on riscv64 | Minor | [NEEDS VERIFICATION] - not re-confirmed this round | Previously reported as open and unassigned since 2020-12-21; likely a QEMU-speed/timeout-calibration issue rather than a correctness bug, but unconfirmed |

### Recently fixed issues (closed, no longer blocking)

| ID | Title | Fixed in | Fixed/merged date |
|---|---|---|---|
| [MDEV-23051](https://jira.mariadb.org/browse/MDEV-23051) | RocksDB build fails: missing `-latomic` | 10.2.33, 10.3.24, 10.4.14, 10.5.5 | Jul 2020 |
| [MDEV-27429](https://jira.mariadb.org/browse/MDEV-27429) | Add RISC-V `rdtime` cycle timer support | ~10.8.0 (approximate; JIRA fix-version date predates the PR's own merge date) | Jan 2022 |
| [MDEV-30554](https://jira.mariadb.org/browse/MDEV-30554) | RocksDB libatomic linking regression on riscv64 | 11.0.1 and 10.4.29/10.5.20/10.6.13/10.8.8/10.9.6/10.10.4/10.11.3 | Feb 2023 |
| [MDEV-33435](https://jira.mariadb.org/browse/MDEV-33435) | RISC-V `RDCYCLE` inaccessible from userland on Linux 6.6+ | 10.11.8, 11.0.6, 11.1.5, 11.2.4, 11.4.2 | 2024 |
| [MDEV-34815](https://jira.mariadb.org/browse/MDEV-34815) | SIGILL on riscv64 compiled with Clang (`rdcycle` is privileged) | 10.11.11, 11.4.5, 11.7.2 | Dec 2024 / Feb 2025 |
| [MDEV-35827](https://jira.mariadb.org/browse/MDEV-35827) | Generic `MY_RELAX_CPU` expensive; riscv64 gains a pause instruction | 10.6.21, 11.4.5, 11.7.2, 11.8.1 | Jan 2025 |
| [MDEV-36217](https://jira.mariadb.org/browse/MDEV-36217) | Build regression from MDEV-35827 on Clang/RISC-V | 10.6.22, 10.11.12*, 11.4.6*, 11.8.2 (*later pulled for unrelated regressions) | Mar 2025 |
| [MDEV-41115](https://jira.mariadb.org/browse/MDEV-41115) | Add RISC-V Zbc-accelerated CRC32C implementation | Merged; targets 13.2.1 (scheduled 2026-11-05, not yet shipped) | Sep 2026 |

**Correctness note.** No open MariaDB/RISC-V NaN or floating-point-canonicalization bug was located in any search. GitHub Issues returned zero hits for "riscv"/"riscv64" because MariaDB tracks bugs exclusively in JIRA (MDEV project); this is a tooling characteristic of the project, not evidence of an absence of issues.

---

## 12. Objections and Upstream Blockers

**No stated objections** to riscv64 support appear in any JIRA comment or PR review thread found. The project has consistently accepted riscv64 contributions from IBM, Debian, OpenBSD-affiliated, and ISCAS-affiliated contributors with no recorded friction; the current (September 2026) CRC32 acceleration work from ISCAS was merged within about a week of final review.

**Technical blockers:**

1. **No upstream riscv64 CI of any kind.** This is the single most consequential structural gap. The project currently relies entirely on Debian/Ubuntu maintainers to catch riscv64 regressions after the fact; the MDEV-35827/MDEV-36217 cycle shows a roughly one-month regression-to-fix latency without CI.
2. **PR #5746 (MDEV-41271, Zvbc CRC32C) is open and unmerged**, blocked on final reviewer sign-off and a promised, not-yet-filed follow-up PR to deduplicate constants with the already-merged MDEV-41115. This is active, healthy review traffic rather than a stalled contribution.
3. **ColumnStore and the DuckDB-backed storage engine are excluded from the riscv64 build entirely** by CMake architecture checks, independent of either dependency's own upstream riscv64 maturity. No GitHub issue or PR was found proposing to lift this exclusion.
4. **RocksDB submodule build status on riscv64 is ambiguous** given the discrepancy between a previously tracked critical ticket (MDEV-29875) and current evidence of the submodule building with self-reported hardware testing; this needs direct re-verification against JIRA.
5. **No hardware-accelerated TLS crypto for riscv64 in OpenSSL**, the default TLS provider; this degrades TLS-intensive workload throughput on riscv64 but is an OpenSSL-project concern, not a MariaDB-specific blocker (wolfSSL, the bundled alternative, already has more RISC-V-specific optimization work merged).

**Acceptance probability for contributions:** High. The review bar is consistently technical (as seen across all five of the deep-read PRs in this report), the standard JIRA+PR pipeline requires no governance vote for architecture-support changes, and the most recent major RISC-V contribution (ISCAS's CRC32 acceleration work) moved from PR open to merge within roughly one week of substantive review.

---

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** MariaDB has zero upstream riscv64 CI: direct reads of `.github/workflows/*.yml`, `.gitlab-ci.yml`, and `appveyor.yml` in [MariaDB/server](https://github.com/MariaDB/server) show no riscv64 build or test jobs anywhere (no Jenkinsfile/Cirrus exist either). The distribution floor applies instead: [Ubuntu 26.04 "resolute"](https://packages.ubuntu.com/search?keywords=MariaDB&suite=resolute&searchon=names&section=all) ships `mariadb-server`, `mariadb-client`, and 28 of 37 MariaDB packages for riscv64, and Debian sid builds and autopkgtests pass, both from upstream source with no riscv64-specific downstream patches identified beyond the architecture listing itself in `debian/control`. That makes this a clean-distro-build, capping the grade at yellow. `release_provider` is the distro (Ubuntu/Debian/Arch RISC-V), not upstream, since mariadb.org ships no riscv64 tarballs, Docker Hub's official image excludes riscv64, and the PyPI connector wheel has no riscv64 build. MariaDB is a general-purpose RDBMS, not a performance-optimization library, so no optimization-purpose modifier applies, though it is worth noting it already has one real Zbc-accelerated CRC32C hot path merged ([PR #5669](https://github.com/MariaDB/server/pull/5669)) with a vector Zvbc follow-on in review.
- **Pending work that could change the grade:** [PR #5746](https://github.com/MariaDB/server/pull/5746) (MDEV-41271, open/unmerged as of 2026-09-30) adds a Zvbc vector-accelerated CRC32C path, blocked on final reviewer sign-off and a promised follow-up to deduplicate constants with PR #5669. No upstream riscv64 CI job exists in `.gitlab-ci.yml` or GitHub Actions - adding one (even QEMU build-only) would be the single highest-leverage change to raise this grade, since the project currently relies entirely on Debian/Ubuntu maintainers to catch riscv64 regressions (e.g., the MDEV-35827/MDEV-36217 build-regression cycle took about a month to surface and fix without CI). No RISE funding or involvement with MariaDB server itself was found (only a tangential RISE-built riscv64 wheel for the unrelated asyncmy/asyncmy2 MySQL/MariaDB wire-protocol client). The Ubuntu 26.04 SPARQL package-graph cross-check against the project-graph database could not be run this session (connection failure) and should be retried to corroborate the Ubuntu packaging findings independently.

---

## 14. Investment Analysis

RISE has not funded any work on MariaDB server itself; the only RISE-adjacent activity found is a wheel build for an unrelated client library (asyncmy/asyncmy2). All substantive riscv64 engineering to date has come from IBM (initial atomics enablement), MariaDB Corporation/Foundation staff (timer, spin-wait, build fixes), Debian (RDTIME fix), OpenBSD (build-portability fixes), and ISCAS (2026 CRC32 hardware acceleration). No duplication risk with RISE-funded work exists for any item below.

### 14.1 Functional Enablement

**Re-verify and, if still open, resolve MDEV-29875 (RocksDB submodule riscv64 build).** The current status is ambiguous (see Section 2/Section 9 discrepancy); first step is a direct JIRA check, followed by auditing whatever upstream RocksDB commits are still needed and updating MariaDB's bundled submodule reference if the issue is confirmed still open. Estimated effort: 0.5 person-weeks to verify status, 1-2 person-weeks if the submodule update is still required.

**Evaluate lifting the CMake exclusion of ColumnStore and the DuckDB-backed storage engine on riscv64.** Both are currently excluded unconditionally regardless of their own upstream riscv64 readiness. ColumnStore's own riscv64 readiness is independently graded red (unpackaged anywhere, open engineering blockers), so enabling it is a substantial, multi-dependency effort; DuckDB itself has closed its own riscv64 release-binary gap upstream, so lifting MariaDB's exclusion for the DuckDB-backed engine specifically may be comparatively low-effort - a build-attempt-and-fix-as-needed exercise. Estimated effort: 0.5-1 person-week to attempt lifting the DuckDB exclusion and assess what breaks; ColumnStore is out of scope for a small investment given its own red-graded status.

### 14.2 Performance Optimization

**No further investment needed on CRC32/CRC32C acceleration beyond completing the in-flight review.** The Zbc hardware path is already merged (MDEV-41115), delivering up to ~215x speedup at 64 KiB on SpacemiT X100 hardware. The Zvbc vector follow-on (MDEV-41271) is open and in active, healthy review - the highest-value action here is simply ensuring MariaDB Corporation reviewer bandwidth (`dr-m`) is not a bottleneck, plus following up on the promised constants-deduplication PR once Zvbc merges. Estimated effort: negligible additional engineering investment required from outside the existing review process; 0.5 person-weeks if sponsoring engineer time is used to file the promised deduplication follow-up on the author's behalf.

**OpenSSL riscv64 crypto acceleration.** Contributing to or accelerating the open upstream OpenSSL PRs for riscv64 AES-GCM/ChaCha20-Poly1305/SHA would benefit MariaDB (and every other TLS-using application on riscv64) but is out of scope for a MariaDB-specific investment. See `project-reports/openssl.md`.

### 14.3 CI/CD Infrastructure

**Add a riscv64 build job to MariaDB's GitLab CI or GitHub Actions.** This remains the single highest-leverage infrastructure investment: without it, every riscv64 regression requires external detection via a Debian/Ubuntu package build failure or a user report, with roughly a month of latency demonstrated by the MDEV-36217 cycle. A minimum-viable job is build-only via QEMU emulation (`CMAKE_CROSSCOMPILING_EMULATOR=qemu-riscv64-static`), which would have caught the class of regressions seen in MDEV-34815 and MDEV-36217. A full `mysql-test-run` suite on QEMU is impractical per-commit but viable as a weekly scheduled job. Implementation paths: native RISC-V hardware runner (requires runner registration with the MariaDB Foundation or a GitLab SaaS riscv64 offering), QEMU emulation on an existing x86 runner (available today), or RISE-provided CI capacity if the RISE Platform Working Group offers it. Estimated effort: 2-4 person-weeks to author, validate, and get the CI configuration accepted upstream.

### 14.4 Ecosystem Enablement

MariaDB's own dependent-package surface is primarily its official client connectors rather than a broad third-party package ecosystem; Section 9 covers connector-level gaps. The clearest concrete gap is the Python connector (`mariadb` on PyPI), which has no riscv64 wheel and is not covered by the RISE wheel builder. Building and publishing a riscv64 wheel requires either cross-compilation or a native RISC-V build environment, plus CI integration for wheel publishing. Estimated effort: 1-2 person-weeks. This is lower priority than the CI and functional-enablement gaps above.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Re-verify MDEV-29875 (RocksDB submodule riscv64 build) status against live JIRA; update bundled submodule if still broken | 0.5-2 | MariaDB contributor | High |
| Functional | Assess lifting the CMake exclusion for the DuckDB-backed storage engine on riscv64 (DuckDB's own riscv64 gap is closed upstream) | 0.5-1 | MariaDB contributor | Medium |
| Functional | Resolve MDEV-24456 join_outer test timeout: calibrate for slow architectures or investigate root cause | 0.5-3 | MariaDB contributor | Low |
| Performance | Shepherd PR #5746 (Zvbc vector CRC32C) to merge; file the promised constants-deduplication follow-up | 0.5 | MariaDB contributor / reviewer bandwidth | High |
| CI/CD | Add riscv64 build job to MariaDB's CI (QEMU-based minimum, native hardware preferred) | 2-4 | MariaDB contributor / RISE Platform WG | Critical |
| Ecosystem | Build and publish a riscv64 wheel for the `mariadb` Python connector on PyPI | 1-2 | MariaDB contributor | Low |

---

## 15. References

- [MariaDB/server GitHub repository](https://github.com/MariaDB/server)
- [MariaDB Foundation governance](https://mariadb.org/about/)
- [MariaDB homepage](https://mariadb.org/)
- [MDEV-23051: riscv64 fails build (atomics)](https://jira.mariadb.org/browse/MDEV-23051)
- [MDEV-24456: main.join_outer tests timeout on riscv64](https://jira.mariadb.org/browse/MDEV-24456)
- [MDEV-27429: Support riscv cycle timer](https://jira.mariadb.org/browse/MDEV-27429)
- [MDEV-29875: RocksDB build issues on riscv64 (bundled submodule)](https://jira.mariadb.org/browse/MDEV-29875)
- [MDEV-30554: RocksDB libatomic linking on riscv64](https://jira.mariadb.org/browse/MDEV-30554)
- [MDEV-33435: RISC-V, use RDTIME instead of RDCYCLE](https://jira.mariadb.org/browse/MDEV-33435)
- [MDEV-33750: Enable mariadb-plugin-rocksdb for riscv64](https://jira.mariadb.org/browse/MDEV-33750)
- [MDEV-34815: SIGILL executing mariadbd compiled for RISC-V with Clang](https://jira.mariadb.org/browse/MDEV-34815)
- [MDEV-34825: FreeBSD riscv64 compatibility patch](https://jira.mariadb.org/browse/MDEV-34825)
- [MDEV-35827: The generic MY_RELAX_CPU is expensive](https://jira.mariadb.org/browse/MDEV-35827)
- [MDEV-36217: Fix building with Clang and GCC on RISC-V](https://jira.mariadb.org/browse/MDEV-36217)
- [MDEV-39142: InnoDB VA-bits startup issue](https://jira.mariadb.org/browse/MDEV-39142)
- [MDEV-41115: Add RISC-V Zbc accelerated CRC32C implementation](https://jira.mariadb.org/browse/MDEV-41115)
- [MDEV-41271: Add RISC-V Zvbc accelerated CRC-32C implementation](https://jira.mariadb.org/browse/MDEV-41271)
- [PR #979: MDEV-23892 libatomic linking (closed, not merged)](https://github.com/MariaDB/server/pull/979)
- [PR #1617: MDEV-23051 riscv64 atomics fix (merged)](https://github.com/MariaDB/server/pull/1617)
- [PR #1717: MDEV-23892 pthread linking follow-up (closed, not merged via GitHub)](https://github.com/MariaDB/server/pull/1717)
- [PR #1974: Improve checks for libatomic linking (merged)](https://github.com/MariaDB/server/pull/1974)
- [PR #1981: MDEV-27429 RISC-V cycle timer (merged)](https://github.com/MariaDB/server/pull/1981)
- [PR #2472: MDEV-30554 RocksDB riscv64 libatomic linking, superseded (closed)](https://github.com/MariaDB/server/pull/2472)
- [PR #2477: MDEV-30554 RocksDB libatomic linking on riscv64 (merged)](https://github.com/MariaDB/server/pull/2477)
- [PR #2980: MDEV-33435 use RDTIME instead of RDCYCLE (merged)](https://github.com/MariaDB/server/pull/2980)
- [PR #3661: MDEV-34815 SIGILL fix for Clang on RISC-V (merged)](https://github.com/MariaDB/server/pull/3661)
- [PR #3752: MDEV-35827 MY_RELAX_CPU performance fix (merged)](https://github.com/MariaDB/server/pull/3752)
- [PR #3871: MDEV-36217 Clang/GCC RISC-V build fix (merged)](https://github.com/MariaDB/server/pull/3871)
- [PR #4852: MDEV-39142 InnoDB VA-bits startup issue (merged)](https://github.com/MariaDB/server/pull/4852)
- [PR #5669: MDEV-41115 RISC-V Zbc accelerated CRC32C (merged)](https://github.com/MariaDB/server/pull/5669)
- [PR #5746: MDEV-41271 RISC-V Zvbc accelerated CRC-32C (open)](https://github.com/MariaDB/server/pull/5746)
- [Ubuntu package search, MariaDB on resolute/riscv64](https://packages.ubuntu.com/search?keywords=MariaDB&suite=resolute&searchon=names&section=all)
- [Ubuntu resolute mariadb-server package page](https://packages.ubuntu.com/resolute/riscv64/mariadb-server)
- [Debian tracker: mariadb package](https://tracker.debian.org/pkg/mariadb)
- [Arch Linux RISC-V port status page](https://archriscv.felixc.at/.status/status.htm)
- [PyPI: mariadb Python connector](https://pypi.org/project/mariadb/)
- [RISE Project](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE wheel builder (Python riscv64 packages)](https://riseproject.gitlab.io/python/wheel_builder/)
- [MariaDB Docker Hub official image](https://hub.docker.com/_/mariadb)
- [RISC-V International: Database Adaptation Evaluation on RISC-V Server](https://riscv.org/blog/risc-v-public-beta-platform-release-%C2%B7-database-adaptation-evaluation-on-risc-v-server/)
- [VLDB 2025 Workshops (ADMS): RISC-V Meets RDBMS](https://www.vldb.org/2025/Workshops/VLDB-Workshops-2025/ADMS/ADMS25-06.pdf)
- [Percona: 2026 MySQL Ecosystem Performance Benchmark Report](https://www.percona.com/blog/2026-mysql-ecosystem-performance-benchmark-report/)
- [FOSDEM 2025: How Good is RISC-V, Comparing Benchmark Results](https://archive.fosdem.org/2025/events/attachments/fosdem-2025-5678-how-good-is-risc-v-comparing-benchmark-results/slides/238207/fosdem-20_eKya0s5.pdf)