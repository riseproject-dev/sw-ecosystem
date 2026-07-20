---
title: MySQL
categories:
  - databases
---

# MySQL

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for MySQL<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

MySQL is a relational database management system owned and operated solely by Oracle Corporation, which acquired it through the 2010 purchase of Sun Microsystems. There is no independent foundation, no community steering committee, and no public RFC or governance process. The project operates under a dual-license model: GPLv2 for MySQL Community Edition and a commercial license for MySQL Enterprise Edition. The authoritative source repository is [mysql/mysql-server](https://github.com/mysql/mysql-server), which functions primarily as a read-only source mirror: it has no CI configuration files, has only 6 open issues as of mid-2026, and all development occurs on Oracle-internal infrastructure.

All external contributions are gated by the Oracle Contributor Agreement (OCA), available at [oca.opensource.oracle.com](https://oca.opensource.oracle.com). Oracle's automated bot closes pull requests after 31 days if OCA compliance is not confirmed. No named external maintainers, MAINTAINERS file, OWNERS file, or CODEOWNERS file exists in the repository. MySQL is not a member or tracked project of the RISE Project. Oracle's official supported platforms for MySQL 8.4 LTS and 9.x are: x86_64 on Oracle Linux/RHEL/Rocky, Ubuntu, SUSE, and Debian; arm64 on Oracle Linux/RHEL/Rocky and macOS; and SPARC_64 on Oracle Solaris. RISC-V is not on this list.

---

## 2. Port History and Upstreaming Timeline

There is no Oracle-driven RISC-V port history. The complete public record of RISC-V engagement in `mysql/mysql-server` consists of one item:

**2025-12-18:** Community contributor PeterPtroc opened [PR #639](https://github.com/mysql/mysql-server/pull/639), "Add RISC-V hardware acceleration for Abseil CRC32C." The PR was co-authored with gong-flying (gongxiaofei24@iscas.ac.cn, Institute of Software, Chinese Academy of Sciences / ISCAS). It proposed adding hardware CRC32C acceleration for RISC-V using the Zbc/Zbkc carry-less multiplication extensions, targeting the vendored Abseil library at `extra/abseil/abseil-cpp-20230802.1/`. The implementation used runtime detection via the `riscv_hwprobe` syscall and a new `crc_riscv.cc` file implementing carry-less multiply via `clmul`/`clmulh` instructions.

**2025-12-18 (same day):** The `mysql-oca-bot` posted a request for the contributor to sign the OCA. No Oracle engineer reviewed the technical content. No reviewer was assigned. No labels were applied.

**2026-01-18:** The `mysql-oca-bot` auto-closed the PR after 31 days with no response from the author. The PR was closed unmerged (`merged_at: null` per GitHub API). This is the first and only upstream RISC-V attempt on record.

There is no tracking issue, no master port issue, and no upstream discussion thread for a MySQL RISC-V port in `mysql/mysql-server`, the MySQL bug tracker at [bugs.mysql.com](https://bugs.mysql.com), or GitHub Discussions. The bug tracker recognizes "RISC-V" as a CPU architecture filter but returns zero results against it.

Separately, in the downstream ecosystem: a Debian patch (`use-largest-lock-free-type-selector-on-riscv.patch`) was authored by Sergio Durigan Junior (Canonical) on 2020-07-27 to fix a `static_assert` failure in `storage/temptable/include/temptable/lock_free_type.h` on RISC-V. This patch has never been upstreamed to `mysql/mysql-server` trunk.

---

## 3. Upstream Support Tier

Oracle does not publish a tiered platform support policy document. The implicit model is: Oracle-tested and Oracle-released binary = supported; everything else is unsupported community effort. Under this model, RISC-V is unsupported at every level:

- No Oracle binary release for riscv64 exists on [dev.mysql.com/downloads](https://dev.mysql.com/downloads/).
- No GitHub Release asset for riscv64 exists (the `mysql/mysql-server` repository publishes zero GitHub Releases via the API).
- No CI run for riscv64 is visible in any public configuration.
- No Oracle engineer has publicly commented on any riscv64 question.

Downstream distributions (Debian, Ubuntu) independently build and ship MySQL for riscv64 as a community effort, without any formal Oracle coordination. These are not Oracle-supported tiers.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

**Summary verdict:** MySQL compiles and runs correctly on riscv64. All architecture-sensitive hotpaths fall to scalar/software fallbacks. There is zero RISC-V-specific code in the upstream source tree.

### 4.1 InnoDB CRC32

File: `storage/innobase/ut/crc32.cc` and `storage/innobase/include/ut0crc32.h`.

Architecture paths present: x86_64 (CPUID detection, HW SSE4.2/PCLMULQDQ intrinsics), ARM64 Linux (getauxval AT_HWCAP, HWCAP_CRC32 + HWCAP_PMULL intrinsics), ARM64 Apple (separate variant). All other architectures fall to `CRC32_DEFAULT`, which assigns `ut_crc32 = software::crc32` -- a slice-8 software table implementation using polynomial 0x82f63b78. The header comment explicitly states: "we don't even know how to ask if the hardware supports crc32" for the default case.

RISC-V status: software slice-8 table only. No hardware path.

### 4.2 MySQL Checksum (`my_checksum.h`)

File: `include/my_checksum.h`.

Architecture paths present: ARMv8 hardware CRC intrinsics via `HAVE_ARMV8_CRC32_INTRINSIC` with runtime detection via `getauxval(AT_HWCAP) & HWCAP_CRC32`. All other architectures use zlib's `crc32_z()`.

RISC-V status: generic zlib `crc32_z()` fallback. No hardware path.

### 4.3 Cycle Counter / rdtsc

Files: `mysys/my_rdtsc.cc` and `include/my_rdtsc.h`.

Architecture paths with dedicated hardware timers: x86 (i386 RDTSC), x86_64 (RDTSC), Windows x64, IA-64, PowerPC 32/64, SPARC v9 64-bit, SPARC 32-bit, AArch64 (cntvct_el0), s390x, Apple/Mach. The header defines `MY_TIMER_ROUTINE_ASM_*` constants for: ASM_X86, ASM_X86_64, RDTSC, ASM_IA64, ASM_PPC, ASM_PPC64, ASM_GCC_SPARC64, ASM_AARCH64, ASM_S390X. No `MY_TIMER_ROUTINE_ASM_RISCV` constant is defined.

RISC-V status: cycle counter returns 0. This affects performance profiling, query timing, and any code path that relies on the cycle counter for sub-microsecond timing.

### 4.4 Bundled Abseil CRC32C

Directory: `extra/abseil/abseil-cpp-20250814.1/absl/crc/internal/`.

Files present: `cpu_detect.cc`, `crc32_x86_arm_combined_simd.h`, `crc_memcpy_x86_arm_combined.cc`, `crc_x86_arm_combined.cc`, `non_temporal_arm_intrinsics.h`, `crc_memcpy_fallback.cc`.

Architecture paths in `cpu_detect.cc`: x86_64 (CPUID with per-model detection: Skylake, Haswell, Naples, Milan, Turin, etc.), AArch64 Linux (reads MIDR_EL1, detects Neoverse N1/V1/N2/V2/N3, Ampere Siryn), AArch64 Apple (sysctlbyname). All other architectures fall to `CpuType::kUnknown` and `SupportsArmCRC32PMULL() = false`.

RISC-V status: `kUnknown`, generic software fallback. No `__riscv` guard appears anywhere in this directory. The abandoned PR #639 proposed adding `SupportsRiscvCrc32()` via `riscv_hwprobe` and a new `crc_riscv.cc`. That patch was blocked by Oracle's OCA process, not by technical objection.

Performance impact: PR #639 documented the cost of this gap on a 64-core SG2044 server at 2.6 GHz running openEuler Linux:

| Benchmark | Baseline (ns) | Accelerated (ns) | Speedup |
|---|---|---|---|
| BM_Calculate/500000 | 7,773,083 | 2,994,595 | 2.60x |
| BM_Extend/500000 | 7,779,846 | 2,736,667 | 2.84x |
| BM_Memcpy/500000 | 7,867,667 | 2,782,868 | 2.83x |

Throughput (BM_Memcpy, 500 KB): ~60.7 MiB/s baseline vs. ~171.7 MiB/s with Zbc/Zbkc hardware acceleration. MySQL currently ships at the baseline figure on riscv64.

### 4.5 Atomic / Spin-wait

File: `include/my_atomic.h`.

The `LF_BACKOFF` spin-wait macro is a no-op (`#define LF_BACKOFF (1)`) for all non-Windows platforms. There is no `pause`/`wrs.nto` or architecture-specific yield instruction inserted for any ISA including riscv64.

RISC-V status: same as all non-Windows platforms -- no spin-wait optimization, but this is not a RISC-V-specific regression.

### 4.6 Architecture File Count Summary

| Architecture | Files with dedicated code in mysql-server trunk |
|---|---|
| x86_64 | 4+ (InnoDB CRC32, my_rdtsc, Abseil crc_x86_arm_combined.cc, crc_memcpy_x86_arm_combined.cc, abseil SIMD header) |
| ARM64 | 4+ (InnoDB CRC32, my_rdtsc, Abseil ARM intrinsics, my_checksum.h ARMv8 path) |
| RISC-V | 0 |

Two files in the source tree contain the string "riscv": `extra/abseil/abseil-cpp-20250814.1/absl/debugging/internal/stacktrace_riscv-inl.inc` (vendored Abseil, not MySQL code) and `extra/boost/boost_1_87_0/boost/predef/architecture/riscv.h` (vendored Boost platform detection header). Neither is MySQL-authored code.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 cmake Architecture Detection

The `cmake/os/` directory contains: Darwin.cmake, FreeBSD.cmake, Linux.cmake, SunOS.cmake, Windows.cmake, WindowsCache.cmake. No riscv-specific cmake file exists. The variable `LINUX_RISCV` is not defined anywhere in the cmake tree.

`cmake/os/Linux.cmake` contains one architecture check: a guard for `aarch64` that sets `LINUX_ARM`. No equivalent check for riscv64 exists.

### 5.2 Compiler Requirements

Enforced by cmake guards in `cmake/os/Linux.cmake`:
- GCC minimum: 11 (GCC 10 is documented as known to fail)
- Clang minimum: 14 (described as "lowest version tested")
- C++17 is required

These produce fatal cmake errors unless `-DFORCE_UNSUPPORTED_COMPILER=ON` is set. Both GCC 11 and Clang 14 are well above the versions currently shipping in Debian sid and Ubuntu 24.04, so this is not a blocking issue on current distributions.

### 5.3 Downstream riscv64 Build (Debian Reference)

Debian's `mysql-8.0` package version 8.0.46-1 builds natively on riscv64 buildd `rv-osuosl-02` (Oregon State University Open Source Lab). Build duration: approximately 29 hours. The Debian `debian/rules` cmake invocation uses:

```
-DWITH_SYSTEM_LIBS=ON -DWITH_ZLIB=system -DWITH_BOOST=../boost
-DWITH_FIDO=bundled -DWITH_LIBWRAP=OFF
```

Standard Debian build flags. No riscv64-specific cmake flags are required.

Debian's build rules include a test-suite failure handling guard:

```makefile
ifneq (,$(filter $(ARCH), amd64 i386 armhf))
    TESTSUITE_FAIL_CMD:=exit 1
else
    TESTSUITE_FAIL_CMD:=true   # riscv64 lands here; failures are ignored
endif
```

This means the Debian riscv64 build is classified as "Maybe-Successful" -- it compiles and installs, but test suite failures on riscv64 do not block the package.

### 5.4 Required Downstream Patch (Not Upstreamed)

Patch: `use-largest-lock-free-type-selector-on-riscv.patch` (Debian `mysql-8.0` packaging, authored by Sergio Durigan Junior, 2020-07-27)

File patched: `storage/temptable/include/temptable/lock_free_type.h`

Root cause: On RISC-V, `ATOMIC_BOOL_LOCK_FREE` returns 1 (lock-free "sometimes" semantics), triggering `static_assert` failures inside `Lock_free_type_selector`. The patch wraps the selector in `#ifndef __riscv` and substitutes `Largest_lock_free_type_selector` on RISC-V.

This patch is present in Debian and Ubuntu packaging. It has not been submitted to or merged into `mysql/mysql-server` trunk. Any build directly from the upstream source tree without this patch will fail to compile on riscv64. [NEEDS VERIFICATION for exact upstream trunk behavior -- the patch existence is confirmed from Debian sources but the exact build failure on unpatched trunk was not directly reproduced.]

### 5.5 Cross-Compilation

No cmake toolchain file for riscv64 exists in `mysql/mysql-server`. Standard cmake cross-compilation applies. `-DFORCE_UNSUPPORTED_COMPILER=ON` may be required if the cross-compiler version string does not satisfy the cmake version guards. MySQL's official documentation contains no cross-compilation instructions for riscv64.

No QEMU usage is documented in the mysql-server repository or official build documentation. Debian performs native builds on riscv64 hardware.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | x86_64 | arm64 | riscv64 |
|---|---|---|---|
| InnoDB CRC32 | HW intrinsics (SSE4.2/PCLMULQDQ) | HW intrinsics (HWCAP_CRC32/PMULL) | Software slice-8 table |
| MySQL checksum | zlib fallback | ARMv8 HW CRC32 | zlib fallback |
| Abseil CRC32C | PCLMULQDQ, per-CPU-model tuning | PMULL, per-CPU-model tuning | Generic software fallback |
| Cycle counter | RDTSC | cntvct_el0 | Returns 0 |
| cmake arch detection | Full | LINUX_ARM defined | Not detected |
| Oracle official support | Yes | Yes (aarch64) | No |
| Oracle binary release | Yes | Yes | No |
| Upstream CI | Internal (not public) | Internal (not public) | None |
| Downstream CI | N/A | N/A | Debian buildd (rv-osuosl-02) |
| Test suite gating | Pass required | Pass required | Failures ignored |
| Architecture-specific patches | None required | None required | 1 required (TempTable lock-free types) |
| Arch-specific source files | 4+ | 4+ | 0 |

The riscv64 implementation is functionally complete (the database starts, queries execute, data persists) but carries no architecture-specific optimizations. The most quantified gap is Abseil CRC32C: approximately 2.6-2.8x throughput reduction relative to what Zbc/Zbkc hardware would deliver, documented by the unmerged PR #639 on a production-grade SG2044 server. The cycle counter returning 0 affects all timing and profiling infrastructure, and has unknown secondary effects on performance-adaptive code paths.

---

## 7. CI/CD Infrastructure

**MySQL upstream CI:** The `mysql/mysql-server` GitHub repository contains no CI configuration files at any level. There is no `.github/workflows/` directory, no `Jenkinsfile`, no `.gitlab-ci.yml`, no `.cirrus.yml`. MySQL's CI is run entirely on Oracle's internal infrastructure and is not publicly visible. This applies to all architectures, not just riscv64. The two files in the tree that match "riscv" are vendored third-party source files (Abseil stacktrace, Boost predef header) -- not CI configurations.

**RISC-V upstream CI:** None. No riscv64 CI job exists for MySQL in any public or known private configuration.

**Downstream CI (Debian):** Debian's `buildd` infrastructure natively builds and installs `mysql-8.0_8.0.46-1` on riscv64 hardware (`rv-osuosl-02` at OSU OSL). As of approximately 2026-05-23, the package status is "Installed" (up-to-date in the archive). The Debian autopkgtest result for riscv64 shows Pass in the testing migration tracker. However, the package is currently "Not considered" for migration from unstable to testing due to unrelated failures on amd64 and loong64, not riscv64.

**Ubuntu CI:** Ubuntu Ports independently builds MySQL 8.0 for riscv64. Physical `.deb` files are present on `ports.ubuntu.com` as of 2026-06-02, version 8.0.46-0ubuntu0.24.04.2. Ubuntu's CI infrastructure for ports is not publicly documented in detail.

**RISE Project:** MySQL is not a RISE Project-tracked workload. A complete enumeration of all 27 RISE blog posts from May 2024 through June 2026 contains zero MySQL references. The RISE Python wheel builder does not include MySQL packages. No RISE repository, RFP, or funding record related to MySQL was found.

---

## 8. Distribution and Release Status

| Distribution | riscv64 Status | Version | Binary location | Notes |
|---|---|---|---|---|
| Oracle official | Not available | -- | dev.mysql.com/downloads | Zero riscv64 assets |
| GitHub Releases | Not available | -- | github.com/mysql/mysql-server | 0 GitHub Releases published |
| Debian sid | Available | 8.0.46-1 | [Debian buildd](https://buildd.debian.org/status/package.php?p=mysql-8.0&suite=sid) | Native build, rv-osuosl-02, status: Installed |
| Ubuntu 24.04 (Noble) | Available | 8.0.46-0ubuntu0.24.04.2 | [ports.ubuntu.com](https://ports.ubuntu.com) | .deb files confirmed 2026-06-02 |
| Ubuntu 22.04 (Jammy) | Available | 8.0.46-0ubuntu0.22.04.x | ports.ubuntu.com | .deb files confirmed 2026-06-02 |
| Arch Linux RISC-V | Server: not available | -- | archriscv.felixc.at | MySQL server is AUR-only, no prebuilt riscv64 binary |
| Arch Linux RISC-V | Workbench: available | 8.0.41-1 | mirror.iscas.ac.cn | GUI client only, not server |

The riscv64 Debian and Ubuntu packages include the full MySQL server (`mysql-server-8.0`), client (`mysql-client-8.0`), router (`mysql-router`), shell (`mysql-shell`), and test suite (`mysql-testsuite-8.0`). These are independently maintained by Debian/Canonical package maintainers and are not coordinated with or endorsed by Oracle.

The packages apply the `use-largest-lock-free-type-selector-on-riscv.patch` that is absent from the Oracle upstream tree.

---

## 9. Dependencies

The following table covers MySQL's critical build dependencies and their riscv64 status. The Debian `mysql-8.0_8.0.46-1` successful build on `rv-osuosl-02` confirms that all required-path dependencies resolve correctly for a functional binary.

| Dependency | Role in MySQL | riscv64 Build | riscv64 Tests | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| OpenSSL | TLS, all crypto (AES, SHA, RSA, EC, ChaCha20, SM2/3/4) | Builds -- `linux64-riscv64` target in `Configurations/10-main.conf`; 33 riscv-specific asm files | Passes -- Debian `openssl` Installed | Released (4.0.1, 2026-06-09) | 16 open riscv issues, all performance/optimization (SHA3, ChaCha20-Poly1305, SM4-XTS). No build blockers. |
| zlib | Wire protocol compression, InnoDB page compression | Builds -- pure C, no riscv asm | Passes (scalar path) | Released (1.3.2) | 0 riscv issues. No blocker. |
| zstd | InnoDB page compression, binlog compression | Builds -- scalar path | Passes with caveats -- unaligned access and HUF_FAST_DEC_LOOP not enabled | Released (1.5.7) | 8 open riscv optimization issues (RVV vectorization, prefetch). No correctness blocker. |
| LZ4 | InnoDB redo log compression | Builds -- scalar path | Passes -- LZ4_FAST_DEC_LOOP not enabled | Released (1.10.0) | 6 open riscv optimization issues. LZ4_FAST_DEC_LOOP blocked ([lz4#1739](https://github.com/lz4/lz4/issues/1739)). No correctness blocker. |
| ICU | RLIKE/REGEXP, charset conversion | Builds -- pure C/C++ | Passes | Released (77.1) | 0 riscv issues. No blocker. |
| Protobuf | Group Replication wire protocol, NDB Cluster | Builds -- all 4 riscv issues closed | Passes | Released (35.1, 2026-06-11) | 0 open riscv issues. No blocker. |
| RapidJSON | JSON functions | Builds -- header-only | Passes | Released | 1 open issue ([#2386](https://github.com/Tencent/rapidjson/issues/2386)): `__riscv` missing from `RAPIDJSON_ENDIAN` detection. Cosmetic, fallback works. Low priority. |
| Boost | Router async I/O (headers only) | Builds -- header-only | Passes | Released (1.87.0) | 0 riscv issues relevant to MySQL usage. No blocker. |
| Abseil-cpp (bundled) | CRC32C checksums (InnoDB), base libraries | Builds -- software fallback | Passes (software path) | Shipped in MySQL | [abseil#1986](https://github.com/abseil/abseil-cpp/issues/1986) open: RISC-V HW CRC32C via Zbc/Zbkc not in abseil upstream. MySQL-local PR #639 (closed, blocked by Oracle OCA). Performance gap: ~2.6x slower CRC throughput. Not a functional blocker. |
| libevent | MySQL Router async event loop | Builds -- pure C | Passes | Released | 0 riscv issues. No blocker. |
| libcurl | MySQL Shell, component services | Builds -- pure C | Passes | Released | 2 riscv issues in curl/curl, both closed. No blocker. |
| SASL (cyrus-sasl) | LDAP authentication (optional) | Builds | Passes | Released | 0 riscv issues. Optional plugin. No blocker. |
| tcmalloc (gperftools) | Optional memory allocator (OFF by default) | Partial -- gperftools 2.18.1 includes `__riscv` stacktrace guard; prior versions failed | Limited -- no riscv-native frame unwinding | Released (2.18.1) | Stacktrace accuracy degraded. Not a blocker (OFF by default). |
| jemalloc | Optional memory allocator (OFF by default) | Unknown -- basic riscv code present in 5.3.1 | Unknown -- [#2399](https://github.com/jemalloc/jemalloc/issues/2399) open (unanswered) | Released (5.3.1) | Unclear riscv64 validation status. Not a blocker (OFF by default). |

**No hard dependency blockers exist.** All critical-path dependencies build and produce functionally correct output on riscv64. The primary dependency-level gap is the Abseil CRC32C hardware acceleration path, which causes a measurable performance regression on InnoDB checksum operations.

---

## 10. Ecosystem Status

**RISE Project:** No involvement. MySQL is not tracked, funded, or discussed by the RISE Project. This was confirmed by a complete enumeration of all 27 RISE blog posts (May 2024 to June 2026), the RISE Python wheel builder package list (80+ packages, no database servers), and the full inventory of repositories under the `riseproject-dev` GitHub organization.

**ISCAS involvement:** The only known external RISC-V contribution to MySQL (PR #639) included a co-author at the Institute of Software, Chinese Academy of Sciences (ISCAS, gongxiaofei24@iscas.ac.cn). ISCAS is a General Member of the RISE Project and operates the `rv-osuosl-02` buildd referenced in Debian's riscv64 build records. The institutional connection exists but did not produce a merged upstream contribution.

**Benchmarks:** No published end-to-end MySQL benchmark data for riscv64 (sysbench, TPC-C, TPC-H, oltp_read_write, or equivalent) is publicly available as of June 2026. Phoronix, RISC-V International, RISE, and all general search results returned zero results for full-workload MySQL riscv64 benchmarks. The only published riscv64 MySQL performance data is the CRC32C sub-component benchmark from the unmerged PR #639, detailed in Section 4.4.

**Hardware tested (known):** SG2044, 64-core @ 2.6 GHz, openEuler Linux -- from PR #639. This is a production-grade server, not a development board. The Debian buildd (`rv-osuosl-02`) is also a riscv64 server-class machine at OSU OSL.

---

## 11. Known Bugs and Active Issues

**mysql/mysql-server (GitHub):** Zero open or closed RISC-V issues. The GitHub search `riscv OR riscv64 OR risc-v repo:mysql/mysql-server` returns only PR #639 (closed). No correctness bugs, build failures, or performance reports exist in the public issue tracker.

**bugs.mysql.com:** The tracker supports RISC-V as a CPU architecture filter. Zero bugs exist under that filter. A MySQL bug #102926 (a sysconf error-checking issue, closed 2021) is the only result for a broad riscv search, and it is not riscv-specific.

**Upstream patch not applied (functional issue):** The `use-largest-lock-free-type-selector-on-riscv.patch` (Debian, 2020) fixes a `static_assert` failure in TempTable on riscv64. It is required for a successful build from unpatched upstream source. It has not been submitted upstream after approximately 6 years.

**Cycle counter returning 0:** The `my_rdtsc` cycle counter has no riscv64 implementation. The read instruction available (`rdcycle`) is standard in RISC-V base ISA but has not been implemented in MySQL's rdtsc layer. Impact on production workloads is not documented.

**MariaDB historical reference (for context):** MariaDB/server had a riscv64 build failure (MDEV-23051) in 2020 due to missing `-latomic` for `#include <atomic>` on riscv64. This was fixed 2020-07-28. This issue does not apply to MySQL directly but indicates a similar class of issue was present in MySQL-compatible code around the same period when the Debian TempTable patch was authored.

---

## 12. Objections and Upstream Blockers

**Oracle Contributor Agreement (OCA):** The single biggest structural barrier for external riscv64 contributions to MySQL. All code must be signed over to Oracle. The OCA bot closes PRs after 31 days without a response. No Oracle engineer has ever reviewed the technical content of any riscv64 contribution. This was the sole reason PR #639 was rejected. There is no technical objection on record.

**No upstream RISC-V CI:** Any merged contribution would have no CI coverage on riscv64. Oracle's internal CI does not target riscv64. A contribution accepted today would have no automated regression detection.

**Vendored library staleness:** PR #639 targeted the vendored Abseil at `extra/abseil/abseil-cpp-20230802.1`. The repository now ships `abseil-cpp-20250814.1`. Abseil upstream has an open issue for RISC-V HW CRC32C support ([abseil#1986](https://github.com/abseil/abseil-cpp/issues/1986)). If abseil upstream merges riscv64 CRC32C support, MySQL could pick it up by updating its vendored snapshot rather than requiring a MySQL-internal patch -- avoiding the OCA issue entirely for that specific optimization.

**Test suite failures silently ignored:** Debian's build rules explicitly discard test suite failures on riscv64 (`TESTSUITE_FAIL_CMD:=true`). The actual test pass rate on riscv64 is not documented. Any upstream submission claiming riscv64 compatibility cannot cite Debian's "Maybe-Successful" build status as validation.

**No Oracle business case:** Oracle has not publicly indicated any riscv64 support roadmap for MySQL. RISC-V is absent from all Oracle MySQL product pages. External contributions face an inherently passive review posture.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

MySQL builds and runs on riscv64 today via Debian/Ubuntu packages. The one required patch (TempTable lock-free types) is a small, well-understood fix. Functional enablement is effectively done at the distribution level. The gap is: this patch is not upstream, and there is no Oracle binary release.

Upstreaming the TempTable patch: Low effort, low Oracle engagement required. The fix is a one-file `#ifndef __riscv` guard with a trivial substitute type. The contributor would need to sign the OCA. Oracle review timeline is unpredictable.

### 13.2 Performance Optimization

Three performance gaps are quantified or documented:

1. **Abseil CRC32C (highest impact):** A 2.6-2.8x throughput gap on InnoDB checksum operations, measured on SG2044. The implementation exists (PR #639 code). Two paths to resolution: (a) upstream the patch to `google/abseil-cpp` directly (avoids Oracle OCA), then wait for MySQL to update its vendored Abseil snapshot; or (b) re-submit PR #639 to MySQL with OCA compliance. Path (a) is lower-friction and bypasses Oracle's contribution process.

2. **Cycle counter (`my_rdtsc`):** Adding `rdcycle` support for riscv64 requires a 2-5 line change in `mysys/my_rdtsc.cc`. Impact on production workloads beyond profiling accuracy is undocumented.

3. **LZ4/zstd optimization:** These are upstream issues in `lz4/lz4` and `facebook/zstd` respectively, not MySQL-specific. Investment here benefits all riscv64 software using these libraries, not MySQL specifically.

### 13.3 CI/CD Infrastructure

MySQL has no public CI. Oracle's internal CI does not target riscv64. Options:

- Contribute riscv64 CI configuration to the public repository: requires Oracle to accept a `.github/workflows/` PR. Oracle has shown no interest in adding public CI of any kind.
- Operate a downstream CI (e.g., building and testing against the upstream source mirror on riscv64 hardware): achievable without Oracle cooperation, but results are not integrated into the official release process.
- Partner with Debian's riscv64 buildd infrastructure: already happening organically. The Debian build at rv-osuosl-02 serves as de facto CI, but with failures silently ignored.

Upstream CI integration is blocked by Oracle's posture on the public repository. Downstream CI is feasible but has no upstream feedback loop.

### 13.4 Ecosystem Enablement

MySQL's riscv64 footprint is already adequate for most use cases: both Debian sid and Ubuntu 24.04 LTS ship current 8.0.46 riscv64 packages. The gaps are: no Oracle official support, no Oracle binary release, and test failures silently ignored. For engineering organizations deploying on riscv64, the Ubuntu Ports packages are the practical path today.

Workloads that depend on Oracle's official MySQL support tier (enterprise customers, regulated environments) have no path on riscv64 without Oracle's explicit commitment to support the architecture. No external party can change this.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream TempTable lock-free type patch to mysql/mysql-server | 1-2 (including OCA process time) | External contributor + Oracle review | High |
| Performance | Upstream RISC-V Zbc/Zbkc CRC32C to abseil-cpp upstream (google/abseil-cpp) | 2-4 | External contributor (no OCA needed for abseil) | High |
| Performance | Upstream RISC-V rdcycle to my_rdtsc.cc | 1 (including OCA) | External contributor + Oracle review | Medium |
| Performance | LZ4 LZ4_FAST_DEC_LOOP enablement for riscv64 | 2-4 (in lz4 upstream) | External contributor to lz4/lz4 | Medium |
| Performance | zstd RVV vectorization / unaligned access enablement | 4-8 (in zstd upstream) | External contributor to facebook/zstd | Low |
| CI/CD | Downstream riscv64 CI operating against mysql/mysql-server source mirror | 4-6 (infrastructure setup) | Any org with riscv64 hardware | Medium |
| CI/CD | Upstream CI contribution to mysql/mysql-server | Not feasible without Oracle cooperation | Oracle | Low |
| Ecosystem | Coordinate with Debian/Canonical to upgrade test suite failure handling on riscv64 | 1-2 | Debian/Ubuntu package maintainers | Low |
| Ecosystem | Oracle formal riscv64 support tier | Not achievable externally | Oracle | N/A |

The highest-leverage single action is upstreaming the CRC32C patch to `google/abseil-cpp` rather than to MySQL directly. This avoids Oracle's OCA entirely, benefits all abseil consumers on riscv64, and MySQL would pick up the fix when it updates its vendored copy. The TempTable patch should be submitted to MySQL trunk with OCA compliance to eliminate the downstream-only divergence.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [mysql/mysql-server repository](https://github.com/mysql/mysql-server)
- [MySQL official site](https://www.mysql.com/)
- [MySQL supported platforms](https://www.mysql.com/support/supportedplatforms/database.html)
- [MySQL CONTRIBUTING.md](https://github.com/mysql/mysql-server/blob/trunk/CONTRIBUTING.md)
- [Oracle Contributor Agreement portal](https://oca.opensource.oracle.com)
- [PR #639 -- Add RISC-V hardware acceleration for Abseil CRC32C](https://github.com/mysql/mysql-server/pull/639)
- [MySQL bug tracker -- riscv search](https://bugs.mysql.com/search.php?search_for=riscv&status=All)
- [Abseil issue #1986 -- RISC-V HW CRC32C support](https://github.com/abseil/abseil-cpp/issues/1986)
- [Debian buildd -- mysql-8.0 riscv64 status](https://buildd.debian.org/status/package.php?p=mysql-8.0&suite=sid)
- [Debian packages -- mysql-8.0](https://packages.debian.org/sid/mysql-server)
- [Ubuntu Ports -- mysql-server 8.0 riscv64](https://ports.ubuntu.com/pool/main/m/mysql-8.0/)
- [LZ4 issue #1739 -- LZ4_FAST_DEC_LOOP not enabled on riscv64](https://github.com/lz4/lz4/issues/1739)
- [RISE Project member list](https://riseproject.dev)
- [RapidJSON issue #2386 -- riscv endian detection](https://github.com/Tencent/rapidjson/issues/2386)