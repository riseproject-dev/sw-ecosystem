---
title: MySQL
parent: Project Reports
color: orange
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: LZ4
    relation: runtime-dependency
    criticality: optional
  - name: ICU
    relation: runtime-dependency
    criticality: optional
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: optional
  - name: RapidJSON
    relation: runtime-dependency
    criticality: optional
  - name: Boost
    relation: runtime-dependency
    criticality: optional
  - name: Abseil
    relation: runtime-dependency
    criticality: optional
  - name: libevent
    relation: runtime-dependency
    criticality: optional
  - name: libcurl
    relation: runtime-dependency
    criticality: optional
  - name: Cyrus SASL
    relation: runtime-dependency
    criticality: optional
  - name: gperftools
    relation: runtime-dependency
    criticality: optional
  - name: jemalloc
    relation: runtime-dependency
    criticality: optional
  - name: GNU bison
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="mysql" %}

# MySQL

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for MySQL<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

MySQL is a relational database management system owned and operated solely by Oracle Corporation, which acquired it through the 2010 purchase of Sun Microsystems. There is no independent foundation, no community steering committee, and no public RFC process for platform support decisions. Oracle runs a self-branded "MySQL Community Governance Model" initiative (Contributor Summit, Community Early Access program) described on [mysql.com](https://www.mysql.com/) as "expanding open collaboration, transparent processes, and community participation," but release and platform-support control remain Oracle-centric, not delegated to a foundation with an independent board or membership tiers. The project is dual-licensed: GPLv2 for MySQL Community Edition, commercial licensing for Enterprise/Standard/Classic editions.

The authoritative source repository, [mysql/mysql-server](https://github.com/mysql/mysql-server), does carry a substantial public GitHub Actions CI setup (13 workflow files under `.github/workflows/`, covering PR builds, the MTR test suite, daily MTR runs, clang-format checks, stale-issue management, and a CODEOWNERS auto-assignment workflow), all running on `ubuntu-latest` GitHub-hosted x86 runners or self-hosted labels for the internal MTR suites. All external contributions are gated by the Oracle Contributor Agreement (OCA, [oca.opensource.oracle.com](https://oca.opensource.oracle.com)); an automated `mysql-oca-bot` closes pull requests after roughly 31 days without OCA confirmation. A CODEOWNERS file exists in the repository (referenced by the `assign-codeowners.yml` workflow) but contains no riscv64-specific entries. MySQL is not a member or tracked project of the RISE Project; RISE's own member roster (8 Premier members, 12 General members, as of the most recent fetch of [riseproject.dev/members](https://riseproject.dev)) consists entirely of semiconductor/chip organizations, with no database vendor present. Total open-issue counts for the repository were not independently reverified in this research pass; what is confirmed is that repeated searches for every riscv-related keyword variant ("riscv", "riscv64", "RISC-V", "rv64") returned zero GitHub Issues results.

Oracle's official supported-platforms page ([mysql.com/support/supportedplatforms/database.html](https://www.mysql.com/support/supportedplatforms/database.html)) lists only **x86_64** and **arm64** as supported CPU architectures, across Oracle Linux, RHEL, Rocky, Ubuntu, SUSE, Debian, Windows, and macOS. RISC-V does not appear on this list. There is no visible community or corporate push toward an official RISC-V port: platform support is unilaterally set by Oracle, with no open process for community-maintained architecture ports (in contrast to foundation-governed projects).

## 2. Port History and Upstreaming Timeline

There is no Oracle-driven RISC-V port effort. The public record of RISC-V engagement with `mysql/mysql-server` consists of one pull request plus a handful of downstream/third-party bug reports.

| Date | Event | Source |
|---|---|---|
| 2020-07-27 | Sergio Durigan Junior (Canonical) authors Debian's `use-largest-lock-free-type-selector-on-riscv.patch`, fixing a `static_assert` failure in `storage/temptable/include/temptable/lock_free_type.h` on RISC-V (the "always-lock-free" atomics assertion added in MySQL 8.0.21+ cannot be satisfied on RISC-V). Never upstreamed to `mysql/mysql-server` trunk. | Debian `mysql-8.0` packaging |
| ~2021 | [bugs.mysql.com #100356](https://bugs.mysql.com/search.php?search_for=riscv&status=All), "MySQL server fails to build on RISC-V 64," filed against Oracle's own bug tracker; closed by Oracle as **Unsupported** (RISC-V not officially supported), not fixed upstream. | bugs.mysql.com |
| ~2020-2021 | Gentoo Bug #761715, "MySQL >=8.0.22 fails to build on PPC and RISC-V." Status: CONFIRMED. Same root cause as #100356. Three community patches (libatomic linking, a RISC-V cycle-timer implementation, the lock-free type selector fix) landed for RISC-V in MySQL 8.0.27; PPC remains unsupported in Gentoo. | Gentoo Bugzilla |
| ~2021 | Launchpad Bug #1915275 (Ubuntu glibc package): `mysql-8.0` regressed on riscv64 after a glibc change made `sysconf(_SC_LEVEL1_DCACHE_LINESIZE)` return -1 instead of 0, which MySQL's aligned-atomic allocation code cast to an unsigned 64-bit value (~18 exabytes), crashing with `std::bad_alloc` at startup and cascading to break dependent packages (php7.4, BOINC). Fixed in MySQL packaging 8.0.23-3ubuntu1 by validating the `sysconf` return value. Status: Fix Released. | Launchpad |
| 2025-12-18 | External contributor PeterPtroc opens [PR #639](https://github.com/mysql/mysql-server/pull/639), "Add RISC-V hardware acceleration for Abseil CRC32C," targeting the vendored Abseil library. Author association: NONE (first-time/external contributor). | GitHub |
| 2025-12-18 (same day) | `mysql-oca-bot` posts a request for OCA sign-off, asking the contributor to link their bugs.mysql.com account email to the OCA signature. | GitHub PR #639 |
| 2026-01-18 | `mysql-oca-bot` auto-closes PR #639 after no response to the OCA request within the ~31-day window. `merged_at: null`. No Oracle engineer, reviewer, or other human ever commented on the PR; the only two comments on the thread are both from the bot. | GitHub PR #639 |

**On the ISCAS co-author claim:** An earlier record of this project associated PR #639 with a co-author at the Institute of Software, Chinese Academy of Sciences (ISCAS, `gongxiaofei24@iscas.ac.cn`). A direct, full re-read of the PR body (via GitHub search) and the live comment thread (via WebFetch) in this research pass found a single author, PeterPtroc, with `author_association: NONE`, and exactly two comments, both automated and from `mysql-oca-bot`. No ISCAS co-author or any human reviewer appears anywhere in the verified PR content. This is a direct contradiction with the earlier claim; absent independent reconfirmation, the co-author claim should be treated as **[NEEDS VERIFICATION]** and is not relied on elsewhere in this report.

There is no tracking issue, no master port issue, and no upstream discussion thread for a MySQL RISC-V port anywhere in `mysql/mysql-server`, bugs.mysql.com, or GitHub Discussions. PR #639 is the complete inventory of RISC-V-specific GitHub artifacts on the upstream repository: repeated searches with every keyword variant ("riscv", "riscv64", "risc-v", "rv64", "rv64gc", "zbkc") return exactly one PR and zero issues.

## 3. Upstream Support Tier

Oracle publishes no tiered platform-support policy document (no Tier 1/Tier 2 classification). The implicit model is binary: Oracle-tested-and-released = supported, everything else is unsupported community effort. Under this model RISC-V is unsupported at every level:

- No Oracle binary release for riscv64 exists on [dev.mysql.com/downloads](https://dev.mysql.com/downloads/).
- No GitHub Release asset exists: a direct fetch of [github.com/mysql/mysql-server/releases](https://github.com/mysql/mysql-server/releases) returns "There aren't any releases here" (MySQL does not use GitHub Releases for distribution at all, for any architecture; this applies equally to x86_64/arm64, not a riscv64-specific gap).
- No GitHub Actions CI run targets riscv64: all 13 workflow files under `.github/workflows/` use `ubuntu-latest` GitHub-hosted x86 runners or self-hosted labels for the `mtr.yml`/`daily-mtr.yml` suites; zero riscv string matches anywhere under `.github/` (workflows, CODEOWNERS, issue/PR templates, dependabot config), confirmed independently via both a local sparse-clone grep and GitHub's server-side `search_code` index (`total_count: 0` for `riscv repo:mysql/mysql-server path:.github`).
- `.gitlab-ci.yml` and `Jenkinsfile` do not exist anywhere in the repository. The only two `.cirrus.yml` files in the tree belong to vendored third-party source drops (`extra/json/json-3.12.0/`, `extra/libcbor/libcbor-0.11.0/`), not to MySQL's own CI.
- No Oracle engineer has publicly commented on any riscv64-related question, issue, or pull request.

| Area | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Oracle-listed supported CPU architecture | Yes | Yes | No |
| Oracle official binary release | Yes | Yes | No |
| GitHub Actions CI coverage | Yes (ubuntu-latest) | Data not available: arm64-specific CI coverage was not independently verified in this pass | No (0 of 13 workflow files reference riscv) |
| Architecture-specific source code | Yes (10+ non-vendored files) | Yes (6+ non-vendored files) | No (0 non-vendored files) |

Downstream distributions (Debian, Ubuntu) independently build and ship MySQL for riscv64 as a community effort, with no formal Oracle coordination; these do not constitute an Oracle-supported tier.

## 4. Technical Architecture and RISC-V-Specific Subsystems

**Summary verdict:** MySQL compiles and runs correctly on riscv64 via generic, portable C/C++ code paths. Every architecture-sensitive hotpath examined falls to a scalar or generic fallback on riscv64; there is zero RISC-V-specific (hand-tuned, intrinsic, or inline-asm) code anywhere in MySQL's own, non-vendored source tree. This was independently confirmed via `search_code` queries restricted to `NOT path:extra` (i.e., excluding bundled third-party sources): `__x86_64__` appears in 10 non-vendored files, `__aarch64__` in 6, and `riscv`/`__riscv`/`riscv64` in **0** files (two independent zero-result queries).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| InnoDB CRC32 (`storage/innobase/ut/crc32.cc`, `ut0crc32.h`) | Full: SSE4.2 `_mm_crc32_u64` + PCLMUL `_mm_clmulepi64_si128`, runtime `cpuid` dispatch | Full: `__crc32cd`/`vmull_p64` ACLE intrinsics, runtime `getauxval(HWCAP_CRC32/PMULL)` dispatch, separate Apple-ARM branch | Scalar: no riscv branch exists; falls into `CRC32_DEFAULT`, a generic slice-by-8 software table (polynomial 0x82f63b78). Header comment: "we don't even know how to ask if the hardware supports crc32" for this default case. |
| MySQL checksum (`include/my_checksum.h`) | zlib `crc32_z()` fallback (no dedicated x86 path in this file) | ARMv8 hardware CRC via `HAVE_ARMV8_CRC32_INTRINSIC`, runtime `getauxval(AT_HWCAP) & HWCAP_CRC32` | zlib `crc32_z()` generic fallback |
| Cycle counter (`mysys/my_rdtsc.cc`, ~950 lines) | Full: inline RDTSC asm (i386 and x86_64 variants) | Full: inline `mrs %[rt],cntvct_el0` asm | Missing: no riscv branch among the 9 enumerated architectures (i386, x86_64, Win64, ia64, ppc64, ppc32, sparcv9, sparc32, aarch64, s390x); falls through every `#elif` to the final `#else return 0;`. Genuine functional degradation for cycle-accurate profiling, though correctness is unaffected since millisecond/microsecond timers use portable `gettimeofday()`. |
| Bundled Abseil CRC32C (`extra/abseil/abseil-cpp-20250814.1/absl/crc/internal/cpu_detect.cc`) | Full: CPUID with per-model tuning (Skylake, Haswell, Naples, Milan, Turin, etc.) | Full: MIDR_EL1-based detection (Neoverse N1/V1/N2/V2/N3, Ampere Siryn), separate Apple path | `CpuType::kUnknown`, generic software fallback; `SupportsArmCRC32PMULL()` not applicable. No `__riscv` guard anywhere in this directory. |
| Spin-lock yield (`libs/mysql/concurrency/spin_lock_mutex.h`) | Full: `_mm_pause()` | Full: inline `yield` asm | Missing: falls to generic `std::this_thread::yield()`; RISC-V's own `Zihintpause`/fence hint is unused. |

**Quantified performance gap (Abseil CRC32C):** PR #639 proposed `SupportsRiscvCrc32()` via the `riscv_hwprobe` syscall to detect `Zbc`/`Zbkc` extensions, a build-time check for `-march=rv64gc_zbc`/`-march=rv64gc_zbkc`, and a carry-less-multiplication CRC32C algorithm in a new `crc_riscv.cc`. Benchmarks were run on a 64-core SG2044 server at 2.6 GHz, openEuler/Linux:

| Benchmark | Baseline (ns) | Accelerated (ns) | Speedup |
|---|---|---|---|
| BM_Calculate/500000 | 7,773,083 | 2,994,595 | 2.60x |
| BM_Extend/500000 | 7,779,846 | 2,736,667 | 2.84x |
| BM_Memcpy/500000 | 7,867,667 | 2,782,868 | 2.83x |

BM_Memcpy (500 KB) throughput: ~60.7 MiB/s baseline vs. ~171.7 MiB/s accelerated. All 11 existing CRC32C unit tests passed against the accelerated implementation. This patch was closed unmerged (Section 2) and independently confirmed absent from trunk: `search_code` for `crc_riscv` and for `Zbkc` across the entire current repository returns zero matches (the only "Zbkc" hits found were false positives inside unrelated PEM test certificates). Even had it merged, it would only have accelerated Abseil's internal CRC usage path, not InnoDB's own `crc32.cc` hot path (page/redo-log checksums), which no PR has touched for RISC-V.

No `.S` assembly files, no JIT backend, no SIMD dispatch table, and no `arch/riscv/`-style directory exist for RISC-V anywhere in the repository. Searches for RVV intrinsics (`vfloat32m1_t`: 0 hits) and Zba/Zbb bitmanip (`zbb OR zba`: 2 raw hits, both false positives inside unrelated base64 test data) found nothing. The ~37 repo-wide "riscv" string matches are entirely inside vendored third-party source trees (`extra/boost`, `extra/abseil`, `extra/gperftools`, `extra/rapidyaml`, `extra/zstd`, `extra/icu`, `extra/libtirpc`) as generic `#ifdef __riscv` portability guards written by those upstream projects, handling basic build/portability concerns (stack unwinding, cache-line size, endianness, autoconf triplets), not MySQL-authored or performance-tuned code.

## 5. Build System, Cross-Compilation, and Toolchain

No `BUILDING.md` exists. `INSTALL` is a 9-line pointer to [dev.mysql.com/doc/refman/en/source-installation.html](https://dev.mysql.com/doc/refman/en/source-installation.html) and the downloads page, with no build commands. There is no `docs/` directory, no riscv64 cmake toolchain file, no `.ci/` or top-level `docker/` directory, and a code search for `riscv64 repo:mysql/mysql-server filename:Dockerfile` returns zero results (the only Dockerfiles in the repo are unrelated telemetry test containers and ones bundled inside vendored third-party sources such as `extra/curl` and `extra/opentelemetry-cpp`).

**cmake architecture detection:** `cmake/os/` contains Darwin.cmake, FreeBSD.cmake, Linux.cmake, SunOS.cmake, Windows.cmake, WindowsCache.cmake; no riscv-specific file exists, and `LINUX_RISCV` is not defined anywhere in the cmake tree. `cmake/os/Linux.cmake` contains exactly one architecture-specific guard, for `aarch64` (sets `LINUX_ARM`); no riscv64 equivalent exists.

**KNOWN_64BIT_ARCHITECTURES (`CMakeLists.txt` lines ~664-671):**
```
SET(KNOWN_64BIT_ARCHITECTURES
  arm64
  aarch64
  ppc64
  ppc64le
  s390x
  x86_64
)
```
riscv64 is absent from this list, which governs RPM packaging install paths (`lib64` vs `lib`); it is not a hard build gate but confirms riscv64 has never been added for packaging purposes.

**Compiler requirements** (`cmake/os/Linux.cmake`, blanket Linux-wide, no architecture branch, so it applies identically to riscv64): GCC 11 minimum ("gcc10 is known to fail"; code comment references GCC 10 but the enforced check is `VERSION_LESS 11`, an internal inconsistency in the comment vs. the actual check), Clang 14 minimum ("lowest version tested"), C++17 required. An escape hatch, `-DFORCE_UNSUPPORTED_COMPILER=ON`, disables this check entirely (undocumented risk). CMake minimum: 3.17.5 (`CMAKE_MINIMUM_REQUIRED(VERSION 3.17.5)`, Unix path).

**No riscv64-specific `-DUSE_X=OFF` flags exist.** The nearest architecture-conditional build option is `WITH_NUMA` (`configure.cmake` ~line 679), which is Linux-generic (ON if libnuma is found) and not gated by processor type.

**No QEMU usage is documented** anywhere in the build system or official build documentation.

**Downstream riscv64 build (Debian reference):** Debian's `mysql-8.0` package (version 8.0.46-1) builds natively on riscv64 buildd `rv-osuosl-02` (Oregon State University Open Source Lab), taking approximately 29 hours. `debian/rules` invokes cmake with standard flags (`-DWITH_SYSTEM_LIBS=ON -DWITH_ZLIB=system -DWITH_BOOST=../boost -DWITH_FIDO=bundled -DWITH_LIBWRAP=OFF`), none riscv64-specific. Debian's build rules discard test-suite failures on riscv64:
```makefile
ifneq (,$(filter $(ARCH), amd64 i386 armhf))
    TESTSUITE_FAIL_CMD:=exit 1
else
    TESTSUITE_FAIL_CMD:=true   # riscv64 lands here; failures are ignored
endif
```
This means the Debian riscv64 build is "maybe-successful": it compiles and installs, but test-suite failures on riscv64 do not block the package.

**Required downstream patch, not upstreamed:** `use-largest-lock-free-type-selector-on-riscv.patch` (Debian `mysql-8.0` packaging, Sergio Durigan Junior, 2020-07-27) patches `storage/temptable/include/temptable/lock_free_type.h`. Root cause: on RISC-V, `ATOMIC_BOOL_LOCK_FREE` returns 1 ("sometimes lock-free"), triggering a `static_assert` failure inside `Lock_free_type_selector`. The patch wraps the selector in `#ifndef __riscv` and substitutes `Largest_lock_free_type_selector` on RISC-V. This patch is present in Debian and Ubuntu packaging and has not been submitted to or merged into `mysql/mysql-server` trunk as of this research pass (unsubmitted since 2020). Building directly from unpatched upstream source will fail on riscv64. [NEEDS VERIFICATION: the exact unpatched-trunk failure was not directly reproduced in this session, though the Gentoo #761715 and bugs.mysql.com #100356 reports independently corroborate the same root cause.]

**Cross-compilation:** No cmake toolchain file for riscv64 exists. Standard cmake cross-compilation applies; `-DFORCE_UNSUPPORTED_COMPILER=ON` may be needed if the cross-compiler's version string fails the guard above. No cross-compilation instructions for riscv64 exist in official documentation. Debian performs native builds on riscv64 hardware; no QEMU usage was found.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | x86_64 | arm64 | riscv64 |
|---|---|---|---|
| InnoDB CRC32 | HW intrinsics (SSE4.2/PCLMULQDQ) | HW intrinsics (HWCAP_CRC32/PMULL) | Software slice-8 table |
| MySQL checksum | zlib fallback | ARMv8 HW CRC32 | zlib fallback |
| Abseil CRC32C | PCLMULQDQ, per-CPU-model tuning | PMULL, per-CPU-model tuning | Generic software fallback (`kUnknown`) |
| Cycle counter | RDTSC | cntvct_el0 | Returns 0 |
| Spin-lock yield | `_mm_pause()` | inline `yield` asm | generic `std::this_thread::yield()` |
| cmake arch detection | Full | `LINUX_ARM` defined | Not detected (absent from `KNOWN_64BIT_ARCHITECTURES`) |
| Oracle official support | Yes | Yes | No |
| Oracle binary release | Yes | Yes | No |
| Upstream GitHub Actions CI | Yes (ubuntu-latest) | Data not available (not independently checked) | No |
| Downstream CI | N/A | N/A | Debian buildd (rv-osuosl-02) |
| Test-suite gating | Pass required | Pass required | Failures ignored (`TESTSUITE_FAIL_CMD:=true`) |
| Architecture-specific patches required | None | None | 1 (TempTable lock-free type selector, Debian-only) |
| Non-vendored arch-specific source files | 10+ | 6+ | 0 |

The riscv64 build is functionally complete at a basic level (the database starts, queries execute, data persists via Ubuntu/Debian packages) but carries no architecture-specific optimizations. The most quantified gap is Abseil CRC32C: a measured 2.6-2.8x throughput reduction relative to Zbc/Zbkc hardware acceleration, documented on a production-grade SG2044 server by the unmerged PR #639 (Section 4). The cycle counter returning 0 affects all timing/profiling infrastructure; its effect on performance-adaptive code paths is undocumented.

**NaN/floating-point semantics:** No MySQL-specific NaN or floating-point correctness bug on RISC-V was found. General web search surfaced only adjacent, non-MySQL items: RISC-V's canonical-NaN encoding (zero-payload, matching the ARM/JVM model), NaN-boxing bugs in specific RISC-V CPU implementations (e.g., openhwfoundation/cva6 #2449), and an LLVM issue (`llvm/llvm-project` #225455) on inconsistent NaN canonicalization on 64-bit RISC-V, a compiler-level concern that could theoretically affect clang-built riscv64 binaries but has no report tying it to MySQL specifically. Treat as a watch-item, not a confirmed MySQL defect.

**Quantitative end-to-end benchmarks:** No published sysbench, TPC-C, TPC-H, or oltp_read_write riscv64 results for MySQL were found. The RISC-V International blog's "Database Adaptation Evaluation On RISC-V Server" (2023, SG2042 64-core, Ubuntu 22.10, Linux 6.1.31 riscv64) tested MySQL, MariaDB, PostgreSQL, Redis, MongoDB, and TiDB, but MySQL **failed to compile from source** (the atomics issue above) and was excluded from the actual stress-test benchmarking; only PostgreSQL (pgbench) and Redis (redis-benchmark) received quantitative throughput figures. OpenBenchmarking.org's "MySQL Benchmark" test profile is currently marked "Broken," with no usable riscv64 results. Percona's "2026 MySQL Ecosystem Performance Benchmark Report" (700+ data points across 10 InnoDB-compatible engines) is x86/ARM-focused with no RISC-V dimension. The only published riscv64 MySQL performance data of any kind is the CRC32C sub-component benchmark from PR #639 (Section 4).

## 7. CI/CD Infrastructure

**MySQL upstream CI exists and is public, but has zero riscv64 coverage.** `mysql/mysql-server` carries 13 GitHub Actions workflow files (`pr-build.yml`, `mtr.yml`, `daily-mtr.yml`, `clang-format.yml`, `cache-warmer.yml`, `labeler.yml`, `stale.yml`, `mark-integrate.yml`, `assign-codeowners.yml`, `codex-pr-review.lock.yml`, `codex-pr-review.md`, `pr-ci-report.yml`, `reset-pr-head-state.yml`). This was confirmed two independent ways: a full local sparse-clone grep of every file under `.github/` and a GitHub server-side `search_code` query for `riscv repo:mysql/mysql-server path:.github`, which returned `total_count: 0`. A direct raw-content fetch of `pr-build.yml` confirms `runs-on: ubuntu-latest` and a `pull_request`-targeting-`trunk` trigger, with no riscv mention. All workflows use `ubuntu-latest` GitHub-hosted x86 runners or self-hosted labels for the internal `mtr.yml`/`daily-mtr.yml` test suites; there is no riscv64 runner label, no QEMU or cross-arch emulation step, and no riscv64 entry in any build matrix. `.gitlab-ci.yml` and `Jenkinsfile` do not exist in the repository; the two `.cirrus.yml` files present belong to vendored third-party source drops (`extra/json`, `extra/libcbor`), not MySQL's own CI.

| Area | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions presence | Yes (13 workflows) | Data not available (no arm64-specific runner label confirmed either way) | None |
| CI runner type | `ubuntu-latest` / self-hosted | Not determined | None |
| QEMU/cross-arch emulation | N/A | Not determined | None found |
| Downstream CI | N/A | N/A | Debian buildd `rv-osuosl-02` (OSU OSL), native build, ~29 hours |

**RISE Project runners:** No evidence of RISE involvement with MySQL was found anywhere. This was checked across the RISE blog (9 individually dated posts identified via WebSearch site-scoping, 2 fetched in full; the two "RISC-V Runners" posts explicitly list ~17 projects using RISE runners - llama.cpp, PyTorch, k0s, Kairos, k3s/Kubernetes/containerd, mldsa/mlkem-native, NumPy, alibaba/zvec, kubetail, Home Assistant, armbian/os, wazero, pyca/cryptography, Portable-Network-Archive, mullvadvpn-app-riscv, uiua - none database-related), the [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) (82 packages listed, no MySQL/mysqlclient/PyMySQL/mysql-connector), a GitHub `search_repositories("MySQL org:riseproject-dev")` (0 results), and a full listing of all 26 `riseproject-dev` org repositories (none MySQL-related; the closest hit, `riseproject-dev/python-wheels` issue #82 "sqlalchemy riscv64 support," concerns generic SQLAlchemy core wheel support, not MySQL or a MySQL driver). Separately, RISE's own `riscv-runners.riseproject.dev` infrastructure documentation indicates the project uses PostgreSQL, not MySQL, for its own persistence layer.

## 8. Distribution and Release Status

| Distribution | riscv64 status | Version | Binary location | Notes |
|---|---|---|---|---|
| Oracle official | Not available | - | [dev.mysql.com/downloads](https://dev.mysql.com/downloads/) | Zero riscv64 assets |
| GitHub Releases | Not available | - | [github.com/mysql/mysql-server/releases](https://github.com/mysql/mysql-server/releases) | Page states "There aren't any releases here"; MySQL does not use GitHub Releases for distribution at all (any architecture) |
| Ubuntu 26.04 "resolute" | **Available (confirmed, authoritative)** | 8.4.8-0ubuntu1 | [packages.ubuntu.com/resolute/riscv64/mysql-server](https://packages.ubuntu.com/resolute/riscv64/mysql-server) | Source package `mysql-8.4`, archive tag `[ports]` (Ubuntu's secondary-architecture archive, not primary `main`). The `.deb` resolves to a concrete, checksummed artifact (`mysql-server_8.4.8-0ubuntu1_riscv64.deb`, exact size 1,377,740 bytes, with MD5/SHA1/SHA256 published), independently re-verified in this research pass via direct fetch. |
| Debian sid | Available | 8.0.46-1 | [Debian buildd](https://buildd.debian.org/status/package.php?p=mysql-8.0&suite=sid) | Native build on `rv-osuosl-02`; status "Installed"; currently blocked from migrating sid to testing by unrelated amd64/loong64 failures, not riscv64 |
| Ubuntu 24.04 (Noble) | Available | 8.0.46-0ubuntu0.24.04.2 | ports.ubuntu.com | .deb files confirmed |
| Ubuntu 22.04 (Jammy) | Available | 8.0.46-0ubuntu0.22.04.x | ports.ubuntu.com | .deb files confirmed; related glibc regression (Launchpad #1915275, Section 2) affected this release line |
| AlmaLinux | Downstream enablement present | mysql8.4 RPM | AlmaLinux packaging git | Separate commits titled "Add riscv64 support" in AlmaLinux's own RPM packaging repo, independent of mysql-server upstream |
| Arch Linux RISC-V | No evidence found | - | [archriscv.felixc.at](https://archriscv.felixc.at) | MySQL server appears to be AUR-only with no prebuilt riscv64 binary; note the site's `?q=` query parameter does not actually filter results (static page, no client-side search logic), so this should be read as "no evidence found via a flawed query method," not a clean confirmed absence |
| PyPI `mysql` | Not relevant | 0.0.3 | [pypi.org/project/mysql](https://pypi.org/pypi/mysql/json) | A pure-Python stub/virtual package pointing to `mysqlclient`; architecture-independent, not actual server binaries. No riscv64 signal either way. |
| RISE wheel builder | No custom build | - | `gitlab.com/.../packages/pypi/simple/mysql/` | Proxies through to upstream PyPI (same stub package, no riscv wheel) |

The riscv64 Debian and Ubuntu packages include the full MySQL server, client, router, shell, and test suite. These are independently maintained by Debian/Canonical package maintainers, not coordinated with or endorsed by Oracle, and incorporate the `use-largest-lock-free-type-selector-on-riscv.patch` that is absent from the Oracle upstream tree.

## 9. Dependencies

| Dependency | Role in MySQL | riscv64 Build | riscv64 Test | riscv64 Release | Notes / Blocking Issues |
|---|---|---|---|---|---|
| OpenSSL | TLS and all crypto (AES, SHA, RSA, EC, ChaCha20, SM2/3/4) | Builds: dedicated `linux64-riscv64` cmake target, 33 riscv asm files | Passes (Debian) | Released 4.0.1 (2026-06-09) | Open, non-blocking: [#28118](https://github.com/openssl/openssl/issues/28118) riscv extension detection broken on musl, [#30880](https://github.com/openssl/openssl/issues/30880) flaky `test_lhash` on linux-riscv64 CI, [#29453](https://github.com/openssl/openssl/issues/29453) intrinsics-vs-inline-asm request, [#25334](https://github.com/openssl/openssl/issues/25334) AES zknd/zkne capability bug. None block build or correctness. (An unverified-this-pass figure of "16 open riscv issues" appears in an earlier version of this assessment; the 4 issues above are the ones independently cited with URLs this pass, and the discrepancy is noted rather than resolved.) |
| zlib | Wire-protocol compression, InnoDB page compression | Builds: pure C, no riscv asm | Passes (scalar path) | Released 1.3.2 | Live search against `madler/zlib` found 0 riscv-related issues, open or closed. No blocker. |
| zstd | InnoDB page compression, binlog compression | Builds: scalar path | Passes with caveats: unaligned-access handling, `HUF_FAST_DEC_LOOP` not enabled | Released 1.5.7 | Open, performance-only: [#4471](https://github.com/facebook/zstd/issues/4471) add RVV support for XXH3, [#4546](https://github.com/facebook/zstd/issues/4546) RISC-V unaligned access. Closed: #3134 (contrib build fix), #4069 (weak-symbol support). No correctness blocker. (An earlier figure of "8 open riscv optimization issues" could not be reconfirmed this pass; discrepancy noted.) |
| LZ4 | InnoDB redo-log compression | Builds: scalar path | Passes (`LZ4_FAST_DEC_LOOP` not enabled) | Released 1.10.0 | [#1635](https://github.com/lz4/lz4/issues/1635), "RISC-V Architecture Optimizations" proposal, closed. Separately tracked and still open: [lz4#1739](https://github.com/lz4/lz4/issues/1739), `LZ4_FAST_DEC_LOOP` not enabled on riscv64. No correctness blocker. (An earlier figure of "6 open riscv optimization issues" could not be reconfirmed this pass; discrepancy noted.) |
| ICU | RLIKE/REGEXP, charset/collation conversion | Builds: pure C/C++ | Passes | Released 77.1 | Not independently re-queried this pass; carried forward as 0 riscv issues / no blocker from the prior assessment. |
| Protocol Buffers | Group Replication wire protocol, NDB Cluster | Builds | Passes | Released 35.1 (2026-06-11) | Closed only: [#12266](https://github.com/protocolbuffers/protobuf/issues/12266) "Add riscv64 support" (merged), [#14549](https://github.com/protocolbuffers/protobuf/issues/14549) "Build fails on RISCV" (fixed). No open riscv issues. No blocker. |
| RapidJSON | JSON functions | Builds: header-only | Passes | Released | 1 open issue, [#2386](https://github.com/Tencent/rapidjson/issues/2386): `__riscv` missing from `RAPIDJSON_ENDIAN` detection. Cosmetic; fallback works. Low priority. Not independently re-queried this pass. |
| Boost | MySQL Router async I/O (headers only) | Builds: header-only | Passes | Released 1.87.0 | No riscv issues found relevant to MySQL's header-only usage. |
| Abseil | InnoDB CRC32C checksums (via bundled copy), base libraries | Builds: software fallback (`CpuType::kUnknown`, no `riscv_hwprobe` path) | Passes (software path) | Vendored `abseil-cpp-20250814.1` shipped in MySQL source | Open: [#1702](https://github.com/abseil/abseil-cpp/issues/1702) cannot link with riscv64 toolchain, [#1236](https://github.com/abseil/abseil-cpp/issues/1236) ILP32E stack-alignment, and critically, upstream [abseil#1986](https://github.com/abseil/abseil-cpp/issues/1986), RISC-V HW CRC32C (Zbc/Zbkc), still open and unmerged, which is the same capability MySQL's own PR #639 attempted (Section 4) and abandoned. Closed: #1684 (NaN test fail on riscv64, fixed), #1561 (protobuf-via-abseil riscv build fail, fixed). Highest-impact open gap in the whole dependency set: ~2.6-2.8x InnoDB checksum throughput loss. |
| libevent | MySQL Router async event loop | Builds: pure C | Passes | Released | 0 riscv issues found. No blocker. |
| libcurl | MySQL Shell, component services | Builds: pure C | Passes | Released | 2 riscv issues in `curl/curl`, both closed. No blocker. |
| Cyrus SASL | LDAP authentication (optional) | Builds | Passes | Released | 0 riscv issues found. Optional plugin, not a blocker. |
| gperftools | Optional memory allocator (OFF by default) | Partial: `__riscv` stacktrace guard added in 2.18.1 | Limited: no native frame unwinding on riscv64 | Released 2.18.1 | Closed: [#1359](https://github.com/gperftools/gperftools/issues/1359), "Broken on riscv64: Cannot calculate stack trace," fixed in 2.18.1. Stacktrace accuracy still degraded. Not a MySQL blocker since OFF by default. |
| jemalloc | Optional memory allocator (OFF by default) | Basic riscv code present since 5.3.1 | Unclear: weakest-validated dependency in the set | Released 5.3.1 | Open, unanswered since 2023: [#2399](https://github.com/jemalloc/jemalloc/issues/2399), "Does jemalloc support cross build for RISCV64?" Closed: #2323 (added riscv64gc support), #1401 (riscv64 FTBFS due to atomics, fixed 2019). Not a MySQL blocker since OFF by default. |
| GNU bison | Build-dependency (parser generator), critical | Data not available: no riscv64-specific research was performed on GNU bison in this pass | Data not available | Data not available | Data not available: searched findings contain no riscv64-specific bison data; bison is widely packaged for riscv64 in Debian/Ubuntu generally, but this was not independently confirmed as part of this research. |
| CMake | Build-dependency, critical (minimum 3.17.5 for Unix per `CMakeLists.txt`) | Data not available: no riscv64-specific research was performed on CMake in this pass | Data not available | Data not available | Data not available: no riscv64 build/test/release status for CMake itself was researched in this pass. |
| googletest | Test-dependency, critical | Data not available: no riscv64-specific research was performed on googletest in this pass | Data not available | Data not available | Data not available: no riscv64 build/test/release status for googletest was researched in this pass. |

No hard build-blocking dependency issue exists for any dependency on riscv64, consistent across all live searches performed. The weakest link by test-signal clarity is jemalloc, which carries an unanswered 2023 issue questioning riscv64 cross-build support and is the only dependency with no clear "passes" test signal, though it is optional and OFF by default in MySQL. The highest-impact open gap is Abseil CRC32C hardware acceleration: not a build or test blocker, but a measured ~2.6-2.8x InnoDB checksum throughput regression, tracked upstream at abseil#1986 rather than as a MySQL-specific issue.

## 11. Known Bugs and Active Issues

| ID / Source | Title | Status | Notes |
|---|---|---|---|
| [mysql/mysql-server PR #639](https://github.com/mysql/mysql-server/pull/639) | Add RISC-V hardware acceleration for Abseil CRC32C | Closed, unmerged | Auto-closed by `mysql-oca-bot` for lack of OCA response; no human code review ever occurred. See Section 2. |
| [bugs.mysql.com #100356](https://bugs.mysql.com/search.php?search_for=riscv&status=All) | MySQL server fails to build on RISC-V 64 | Closed as Unsupported | Oracle declined to patch upstream; fix carried only as a downstream Ubuntu/Debian patch. Root cause: "always-lock-free" atomics `static_assert` added in MySQL 8.0.21+. |
| Gentoo Bug #761715 | MySQL >=8.0.22 fails to build on PPC and RISC-V | CONFIRMED | Same root cause as #100356; three community patches landed for RISC-V in MySQL 8.0.27 (community packaging, not upstream trunk). PPC remains unsupported in Gentoo. |
| Launchpad Bug #1915275 | mysql-8.0 regressed on riscv64 due to new glibc | Fix Released | `sysconf` cache-line-size regression caused `std::bad_alloc` crash at startup; fixed in packaging 8.0.23-3ubuntu1. This is a correctness/availability bug, not merely a build issue: MySQL became completely non-functional on riscv64 until fixed, and the breakage cascaded to dependent packages (php7.4, BOINC). |
| `my_rdtsc` cycle counter | Returns 0 on riscv64 | Open (architectural gap, not tracked as a bug) | No riscv branch exists among the 9 enumerated architectures in `mysys/my_rdtsc.cc`; impact on production workloads beyond profiling accuracy is undocumented. |
| [abseil#1986](https://github.com/abseil/abseil-cpp/issues/1986) | RISC-V HW CRC32C (Zbc/Zbkc) not merged upstream in Abseil | Open | Would close the ~2.6-2.8x InnoDB checksum throughput gap if merged and MySQL's vendored Abseil snapshot were subsequently updated. See Sections 4, 9, 13. |
| [lz4#1739](https://github.com/lz4/lz4/issues/1739) | `LZ4_FAST_DEC_LOOP` not enabled on riscv64 | Open | Performance-only; not a correctness blocker. |
| [RapidJSON #2386](https://github.com/Tencent/rapidjson/issues/2386) | `__riscv` missing from `RAPIDJSON_ENDIAN` detection | Open | Cosmetic; generic fallback already works. |
| [jemalloc #2399](https://github.com/jemalloc/jemalloc/issues/2399) | Does jemalloc support cross build for RISCV64? | Open, unanswered since 2023 | Not a MySQL blocker (jemalloc OFF by default), but the weakest-validated optional dependency in the set. |

**bugs.mysql.com** supports a RISC-V CPU-architecture filter but returns essentially no results against it beyond #100356 above; the public GitHub issue tracker for `mysql/mysql-server` returns zero issues for every riscv-related search term tried, across all query variants.

## 12. Objections and Upstream Blockers

**Oracle Contributor Agreement (OCA):** The single largest structural barrier to external riscv64 contributions. All code must be signed over to Oracle via the OCA before any human review occurs; the `mysql-oca-bot` auto-closes PRs after roughly 31 days without a response. This is the sole, confirmed reason PR #639 was rejected: no Oracle engineer reviewed its technical content at any point, and there is no record of a technical objection anywhere in the thread. The blocker is procedural and legal, not technical.

**No upstream RISC-V CI:** Even a merged riscv64 contribution would have no automated regression coverage, since none of MySQL's 13 public GitHub Actions workflows run on riscv64, and Oracle's broader internal CI (not publicly visible) is not known to target riscv64 either.

**Vendored library staleness:** PR #639 targeted the vendored Abseil at `extra/abseil/abseil-cpp-20230802.1`; the repository now ships `abseil-cpp-20250814.1`. Abseil upstream itself has an open issue for RISC-V HW CRC32C support ([abseil#1986](https://github.com/abseil/abseil-cpp/issues/1986)). If Abseil upstream merges riscv64 CRC32C support, MySQL could inherit it automatically the next time its vendored snapshot is bumped, without touching Oracle's OCA process at all for that specific optimization.

**Test-suite failures silently ignored downstream:** Debian's build rules explicitly discard test-suite failures on riscv64 (`TESTSUITE_FAIL_CMD:=true`). The actual riscv64 test pass rate is therefore not documented anywhere; an upstream submission citing Debian's "Installed"/"maybe-successful" build status cannot be treated as evidence of full test-suite correctness.

**RISE Project:** No involvement of any kind was found (Section 7). RISE's member roster is composed entirely of semiconductor/chip organizations with no database vendor present, and RISE's own infrastructure uses PostgreSQL rather than MySQL. There is no RISE-funded RFP, blog post, repository, or wheel-builder entry tied to MySQL.

**No Oracle business case:** RISC-V is absent from every Oracle MySQL product and supported-platforms page. External contributions face an inherently passive, slow review posture (the 31-day OCA auto-close window being the clearest evidence of this).

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

**Justification:** MySQL has zero riscv64 CI upstream (no GitHub Actions/GitLab/Jenkins/Cirrus riscv references, confirmed via repeated workflow-file reads across all 13 workflow files plus CODEOWNERS, templates and dependabot config) and ships no official Oracle riscv64 release. It falls to the distribution floor: Ubuntu ([packages.ubuntu.com/resolute/riscv64/mysql-server](https://packages.ubuntu.com/resolute/riscv64/mysql-server), 8.4.8-0ubuntu1) and Debian build and ship riscv64 packages, but only via a riscv64-specific downstream patch (Debian's `use-largest-lock-free-type-selector-on-riscv.patch`, fixing a TempTable `static_assert` failure) that has never been upstreamed, and Debian's own build rules explicitly discard riscv64 test-suite failures (`TESTSUITE_FAIL_CMD:=true`). Per the distribution-floor rule, a distro build requiring riscv64-specific patches against unmodified upstream source caps at orange, sub-type downstream-only, with release provider = distro rather than upstream.

**Pending work that could change the grade:**
- [PR #639](https://github.com/mysql/mysql-server/pull/639) (Abseil CRC32C RISC-V hardware acceleration via Zbc/Zbkc) was closed unmerged after the author did not respond to Oracle's OCA bot within 31 days, a procedural, not technical, blocker; no Oracle engineer ever reviewed it.
- The TempTable lock-free-type patch required for riscv64 builds has sat in Debian-only packaging since 2020 with no upstream submission.
- Upstream Abseil issue [abseil#1986](https://github.com/abseil/abseil-cpp/issues/1986) (RISC-V HW CRC32C) remains open and unmerged; MySQL could inherit this fix by bumping its vendored Abseil snapshot without touching Oracle's OCA process at all.
- No RISE Project involvement with MySQL was found anywhere (blog, wheel builder, org repositories).

## 14. Investment Analysis

RISE has not funded or touched any MySQL-related work (Section 7, Section 12); none of the sizing below overlaps with existing RISE investment.

### 14.1 Functional Enablement

MySQL already builds and runs on riscv64 today via Debian/Ubuntu packages. The one required patch (TempTable lock-free types) is small and well understood. Functional enablement is effectively complete at the distribution level; the gap is that this patch is not upstream and no Oracle binary release exists. Upstreaming it is low-effort, low-Oracle-engagement work: a one-file `#ifndef __riscv` guard with a trivial substitute type. The contributor would need to sign the OCA, and Oracle's review timeline is unpredictable (PR #639's 31-day auto-close is the only data point available).

### 14.2 Performance Optimization

Three performance gaps are quantified or documented:

1. **Abseil CRC32C (highest impact):** A 2.6-2.8x throughput gap on InnoDB checksum operations, measured on SG2044. The implementation already exists (PR #639's code). Two resolution paths: (a) upstream the patch directly to `google/abseil-cpp` (bypasses Oracle's OCA entirely), then wait for MySQL to bump its vendored Abseil snapshot; or (b) resubmit a MySQL-side PR with OCA compliance. Path (a) is lower-friction and benefits every Abseil consumer on riscv64, not just MySQL.
2. **Cycle counter (`my_rdtsc`):** Adding `rdcycle` support for riscv64 is a small (2-5 line) change in `mysys/my_rdtsc.cc`. Impact on production workloads beyond profiling accuracy is undocumented, so the business case rests mainly on restoring observability parity with x86_64/arm64.
3. **LZ4/zstd optimization:** These are upstream issues in `lz4/lz4` and `facebook/zstd` respectively ([lz4#1739](https://github.com/lz4/lz4/issues/1739), [zstd#4471](https://github.com/facebook/zstd/issues/4471)/[#4546](https://github.com/facebook/zstd/issues/4546)), not MySQL-specific; investment here benefits all riscv64 software using these libraries.

### 14.3 CI/CD Infrastructure

MySQL's public CI exists but has no riscv64 coverage, and Oracle's internal CI does not target riscv64 either. Options:
- Contribute riscv64 CI to `.github/workflows/`: requires Oracle to accept such a PR into the already-public, Oracle-maintained workflow set; Oracle has shown no evidence of interest in extending its CI to new architectures.
- Operate a downstream CI building/testing against the upstream source mirror on riscv64 hardware: achievable without Oracle cooperation, but results stay outside the official release process.
- Partner with Debian's `rv-osuosl-02` buildd infrastructure: already happening organically, serving as de facto CI, but with test failures silently ignored.

### 14.4 Ecosystem Enablement

MySQL's riscv64 footprint is already adequate for most non-enterprise use cases: Debian sid and Ubuntu (24.04 LTS and 26.04) ship current riscv64 packages. The remaining gaps are the absence of Oracle official support, the absence of an Oracle binary release, and silently-discarded test failures in the one downstream build pipeline that exists. For organizations deploying on riscv64 today, the Ubuntu Ports / Debian packages are the practical path. Workloads that require Oracle's official support tier (enterprise customers, regulated environments) have no path on riscv64 without an explicit Oracle commitment, which no external party can produce.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream the TempTable lock-free-type-selector patch to mysql/mysql-server trunk | 1-2 (including OCA process time) | External contributor + Oracle review | High |
| Performance | Upstream RISC-V Zbc/Zbkc CRC32C to `google/abseil-cpp` directly | 2-4 | External contributor (no OCA needed for Abseil) | High |
| Performance | Upstream RISC-V `rdcycle` support to `my_rdtsc.cc` | 1 (including OCA) | External contributor + Oracle review | Medium |
| Performance | LZ4 `LZ4_FAST_DEC_LOOP` enablement for riscv64 | 2-4 (in lz4 upstream) | External contributor to lz4/lz4 | Medium |
| Performance | zstd RVV vectorization / unaligned-access enablement | 4-8 (in zstd upstream) | External contributor to facebook/zstd | Low |
| CI/CD | Downstream riscv64 CI operating against the mysql/mysql-server source mirror | 4-6 (infrastructure setup) | Any org with riscv64 hardware | Medium |
| CI/CD | Upstream CI contribution to mysql/mysql-server's existing GitHub Actions set | Not feasible without Oracle cooperation | Oracle | Low |
| Ecosystem | Coordinate with Debian/Canonical to stop discarding riscv64 test-suite failures | 1-2 | Debian/Ubuntu package maintainers | Low |
| Ecosystem | Oracle formal riscv64 support tier and official binary release | Not achievable externally | Oracle | N/A |

The highest-leverage single action is upstreaming the CRC32C acceleration to `google/abseil-cpp` directly rather than resubmitting to MySQL: it avoids Oracle's OCA entirely, benefits every Abseil consumer on riscv64, and MySQL would pick up the fix automatically on its next vendored-Abseil bump. The TempTable patch should still be submitted to MySQL trunk with OCA compliance, since it is the one true upstream-vs-downstream divergence blocking a clean build from unpatched source.

## 15. References

- [mysql/mysql-server repository](https://github.com/mysql/mysql-server)
- [MySQL official site](https://www.mysql.com/)
- [MySQL supported platforms](https://www.mysql.com/support/supportedplatforms/database.html)
- [Oracle Contributor Agreement portal](https://oca.opensource.oracle.com)
- [PR #639 - Add RISC-V hardware acceleration for Abseil CRC32C](https://github.com/mysql/mysql-server/pull/639)
- [MySQL bug tracker - riscv search](https://bugs.mysql.com/search.php?search_for=riscv&status=All)
- [Abseil issue #1986 - RISC-V HW CRC32C support](https://github.com/abseil/abseil-cpp/issues/1986)
- [Abseil issue #1702 - cannot link with riscv64 toolchain](https://github.com/abseil/abseil-cpp/issues/1702)
- [Abseil issue #1236 - ILP32E stack alignment](https://github.com/abseil/abseil-cpp/issues/1236)
- [OpenSSL issue #28118 - riscv extension detection broken on musl](https://github.com/openssl/openssl/issues/28118)
- [OpenSSL issue #30880 - flaky test_lhash on linux-riscv64 CI](https://github.com/openssl/openssl/issues/30880)
- [OpenSSL issue #29453 - intrinsics vs inline asm request](https://github.com/openssl/openssl/issues/29453)
- [OpenSSL issue #25334 - AES zknd/zkne capability bug](https://github.com/openssl/openssl/issues/25334)
- [zstd issue #4471 - add RVV support for XXH3](https://github.com/facebook/zstd/issues/4471)
- [zstd issue #4546 - RISC-V unaligned access](https://github.com/facebook/zstd/issues/4546)
- [LZ4 issue #1739 - LZ4_FAST_DEC_LOOP not enabled on riscv64](https://github.com/lz4/lz4/issues/1739)
- [LZ4 issue #1635 - RISC-V Architecture Optimizations proposal](https://github.com/lz4/lz4/issues/1635)
- [Protocol Buffers issue #12266 - Add riscv64 support](https://github.com/protocolbuffers/protobuf/issues/12266)
- [Protocol Buffers issue #14549 - Build fails on RISCV](https://github.com/protocolbuffers/protobuf/issues/14549)
- [RapidJSON issue #2386 - riscv endian detection](https://github.com/Tencent/rapidjson/issues/2386)
- [gperftools issue #1359 - broken on riscv64: cannot calculate stack trace](https://github.com/gperftools/gperftools/issues/1359)
- [jemalloc issue #2399 - does jemalloc support cross build for RISCV64](https://github.com/jemalloc/jemalloc/issues/2399)
- [Debian buildd - mysql-8.0 riscv64 status](https://buildd.debian.org/status/package.php?p=mysql-8.0&suite=sid)
- [Debian packages - mysql-8.0](https://packages.debian.org/sid/mysql-server)
- [Ubuntu packages - mysql-server riscv64 (26.04 resolute)](https://packages.ubuntu.com/resolute/riscv64/mysql-server)
- [Ubuntu Ports - mysql-8.0](https://ports.ubuntu.com/pool/main/m/mysql-8.0/)
- [Arch Linux RISC-V package status](https://archriscv.felixc.at)
- [PyPI - mysql package](https://pypi.org/pypi/mysql/json)
- [RISE Project](https://riseproject.dev)
- [RISE Project members](https://riseproject.dev)
- [RISE Project Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [MariaDB PR #5746 - RISC-V Zvbc-accelerated CRC-32C (sibling fork effort)](https://github.com/MariaDB/server/pull/5746)
- [LLVM issue #225455 - inconsistent NaN canonicalization on 64-bit RISC-V](https://github.com/llvm/llvm-project/issues/225455)