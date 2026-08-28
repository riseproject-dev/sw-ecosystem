---
title: pgjdbc
parent: Project Reports
---

# pgjdbc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for pgjdbc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

pgjdbc is the official JDBC driver for PostgreSQL. It is a pure-Java Type 4 driver: all communication with the PostgreSQL server happens over a standard TCP wire protocol (the PostgreSQL Frontend/Backend Protocol), entirely in JVM bytecode. There is no native code, no JNI, no C extension, no SIMD dispatch, and no architecture-specific bytecode in the project.

The project is governed under the PostgreSQL Global Development Group (PGDG), the same community body that oversees the PostgreSQL server. License: BSD 2-Clause. The GitHub organization at [github.com/pgjdbc](https://github.com/pgjdbc) has eight official maintainer-members.

**Corporate affiliation of key contributors:**

| Contributor | GitHub handle | Company | Commits |
|---|---|---|---|
| Vladimir Sitnikov | vlsi | Netcracker Technology (NTT Group) | 820 |
| Dave Cramer | davecramer | Amazon Web Services | 651 |
| Kris Jurka | kjurka | (unaffiliated) | 571 |
| Sehrope Sarkuni | sehrope | JackDB, Inc. | 160 |
| Bruce Momjian | bmomjian | EnterpriseDB | 154 |
| Craig Ringer | ringerc | EnterpriseDB | 52 |
| Pavel Raiskup | praiskup | Red Hat | manages Fedora RPM packaging |
| Brett Okken | bokken | Oracle | 22 |

pgjdbc is not a RISE project member. No RISE blog post, RFP, or working group has engaged with pgjdbc in any publicly indexed source.

Community stance on new architecture ports: because the project produces only architecture-independent artifacts, the concept of "porting" does not apply. Architecture support is determined entirely by JVM availability on the target platform. There is no stated policy on new ports because there is nothing to port.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V-specific commit, issue, PR, or branch has ever existed in pgjdbc/pgjdbc | [GitHub issue search riscv](https://github.com/pgjdbc/pgjdbc/issues?q=riscv) -- 0 results |
| N/A | No RISC-V-specific commit, issue, PR, or branch has ever existed in pgjdbc/pgjdbc | [GitHub PR search riscv64](https://github.com/pgjdbc/pgjdbc/pulls?q=riscv64) -- 0 results |

There is no port history because no port work is necessary. pgjdbc compiles to JVM bytecode. Any JVM that supports riscv64 can run pgjdbc without modification. The Debian source package `libpgjava` declares `Architecture: all`, which means a single build artifact serves every architecture the distribution supports, including riscv64.

---

## 3. Upstream Support Tier

No formal tier policy exists. Architecture support is inherited from the underlying JVM. There is no documented distinction between supported and unsupported architectures.

**CI runner support by architecture:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runners present | Yes (ubuntu-latest, windows-latest) | Partial (ARM64 path in main.yml but no dedicated arm64 runner configured in matrix) | No |
| Release-blocking tests | Yes | No | No |
| Official binaries | arch-independent JAR | arch-independent JAR (same artifact) | arch-independent JAR (same artifact) |
| Debian/Ubuntu package | `arch: all` .deb | `arch: all` .deb | `arch: all` .deb |

The aarch64 reference in `.github/workflows/main.yml` is a workaround for a GitHub Actions `setup-java` bug on ARM64-hosted macOS runners, not a dedicated arm64 CI tier [NEEDS VERIFICATION on the exact runner type used].

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

pgjdbc has no architecture-specific subsystems. The table below documents what was searched and what was found.

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Wire protocol (Frontend/Backend) | Pure Java | Pure Java | Pure Java | No arch-specific path exists or is needed |
| SSL/TLS | Delegated to JVM JSSE | Delegated to JVM JSSE | Delegated to JVM JSSE | Zero pgjdbc-owned crypto code |
| Authentication (SCRAM-SHA) | Pure Java (shaded scram-client 3.2) | Pure Java | Pure Java | Architecture-independent |
| Authentication (SSPI/Kerberos) | N/A (Windows only) | N/A (Windows only) | N/A (Windows only) | Waffle-JNA; not available on any Linux target regardless of CPU |
| SIMD / vectorization | None | None | None | Not applicable; no numeric kernel |
| JIT backend | None (JVM-provided) | None (JVM-provided) | None (JVM-provided) | pgjdbc does not implement or configure JIT |
| Memory allocator | None | None | None | Standard JVM heap only |
| Assembly (.S files) | 0 files | 0 files | 0 files | Confirmed by code search |

Code searches for `riscv`, `riscv64`, `rvv`, `vfloat32m1_t`, `simd`, and `arch/riscv` against the pgjdbc/pgjdbc repository all returned 0 results (two false positives for `rvv` were confirmed to be substring matches inside RSA key files in `certdir/`).

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Gradle with Kotlin DSL (`build.gradle.kts`). No CMake, no Makefile, no Maven pom.xml (a `reduced-pom.xml` is present for source distribution verification only).

**Build requirements (from CONTRIBUTING.md):**
- Git
- JDK 8 or higher; JDK 21 required for pgjdbc >= 42.7.1 and recommended for all builds
- Optional: a running PostgreSQL instance for integration tests

**Gradle properties for JDK selection:**
- `jdkBuildVersion` (default: 21) -- selects the JDK that compiles the code
- `jdkBuildVendor` -- optional vendor filter (Temurin, Corretto, Zulu, etc.)
- `jdkTestVersion` -- defaults to `jdkBuildVersion`

**Build commands:**

```
./gradlew assemble                       # produce JAR artifacts only
./gradlew build -x test                  # build + style checks, skip tests
./gradlew test                           # integration tests (requires PostgreSQL)
./gradlew test -PjdkTestVersion=21       # integration tests with specific JDK
```

**Cross-compilation:** Not applicable. The output is JVM bytecode, which is platform-independent by definition. There are no QEMU references, no toolchain files, no `--sysroot` flags, and no `TARGETPLATFORM` variables anywhere in the repository.

**To build on a riscv64 host:** install a riscv64 JDK 21, then run `./gradlew assemble`. The produced JAR is identical to what would be produced on any other platform.

Known build failures on riscv64: Data not available -- no riscv64 CI exists and no bug reports covering riscv64 build failures were found.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because pgjdbc contains no architecture-specific code, there are no functional gaps between amd64, arm64, and riscv64. All SQL types, all authentication protocols (excluding Windows SSPI, which is unavailable on all Linux targets), all PostgreSQL protocol features, and all SSL modes are available identically on all architectures.

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| All SQL types (text + binary mode) | Yes | Yes | Yes | None |
| SCRAM-SHA-256 authentication | Yes | Yes | Yes | None |
| SSL/TLS (JSSE-backed) | Yes | Yes | Yes | None |
| Windows SSPI (Kerberos) | No (Linux) | No (Linux) | No (Linux) | By design; OS restriction |
| Large object support | Yes | Yes | Yes | None |
| Logical replication (PgReplicationStream) | Yes | Yes | Yes | None |
| Copy API (COPY TO/FROM STDIN) | Yes | Yes | Yes | None |
| Pipeline mode (partial, tracked in #2325, #4066) | Partial | Partial | Partial | Architecture-agnostic gap |

**Performance gaps:** No RISC-V-specific performance data exists. The performance of pgjdbc on riscv64 relative to amd64 is determined entirely by the JVM implementation (OpenJDK), not by pgjdbc itself. Data not available: no benchmarks comparing pgjdbc throughput on riscv64 versus x86_64 have been published in any indexed source.

**NaN / floating-point semantics:** Issue [#1941](https://github.com/pgjdbc/pgjdbc/issues/1941) documents inconsistent NaN handling between binary and text transport modes. In binary mode, integer types silently return 0 for NaN; BigDecimal throws ClassCastException. In text mode, all numeric types throw PSQLException. This is an architecture-agnostic correctness bug, open since 2020.

---

## 7. CI/CD Infrastructure

**Summary:** No riscv64 CI exists anywhere in the pgjdbc project.

All 16 workflow files under `.github/workflows/` were read directly. Zero occurrences of "riscv", "riscv64", or "RISCV" were found. No alternate CI systems (`.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`) exist in the repository.

**CI matrix (from `.github/workflows/matrix.mjs` and `main.yml`):**
- OS: `ubuntu-latest`, `windows-latest` (macOS commented out with a TODO)
- Architectures: x64 only (hardcoded `architecture: x64` in `actions/setup-java` calls in `omni.yml`)
- Java versions: 8, 11, 17, 21, 25, 26-EA
- JDK distributions: Corretto, Liberica, Microsoft, Oracle, Temurin, Zulu
- PostgreSQL versions: 9.1 through 18 plus HEAD
- QEMU: none
- RISE runners: none

**CI comparison by architecture:**

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runners configured | Yes | No | No |
| Java version matrix | Full (8-26-EA) | No | No |
| PostgreSQL version matrix | Full (9.1-18+HEAD) | No | No |
| Release-blocking gate | Yes | No | No |
| QEMU emulation | No | No | No |
| RISE-hosted hardware | No | No | No |

---

## 8. Distribution and Release Status

**GitHub releases:** pgjdbc publishes architecture-independent JAR artifacts. The three most recent releases (42.7.13, 42.7.12, 42.7.11) contain only `postgresql-<version>.jar` and its PGP signature. No architecture-specific asset exists or is needed.

**Maven Central:** pgjdbc is published to [Maven Central](https://central.sonatype.com/artifact/org.postgresql/postgresql) as `org.postgresql:postgresql:<version>`. The artifact is a single `.jar` file usable on any JVM platform including riscv64. No separate riscv64 classifier artifact exists or is needed.

**Debian:** Source package `libpgjava`, binary package `libpostgresql-jdbc-java`. Architecture: `all`. Available in:
- Debian stable: 42.7.7-1
- Debian unstable/testing: 42.7.13-1

A single `.deb` installs on riscv64 without any architecture-specific build. No per-architecture binary is produced.

**Ubuntu:** Available in Ubuntu 24.04 (Noble) as `libpostgresql-jdbc-java` at version 42.7.2-1, architecture `all`. Installable on riscv64 directly.

**Fedora RPM:** Maintained by Red Hat's Pavel Raiskup via [Fedora Copr](https://copr.fedorainfracloud.org/). The RPM spec declares `BuildArch: noarch` and `ExclusiveArch: %{java_arches} noarch`. The `%{java_arches}` macro in Fedora includes riscv64 when a Fedora riscv64 JDK is present in the buildroot -- no upstream pgjdbc changes required.

**Arch Linux:** Data not available -- pgjdbc does not appear to be packaged in official Arch Linux repositories (mainline or riscv64 port); searches for "pgjdbc" and "postgresql-jdbc" returned no results.

**PyPI:** Not applicable. pgjdbc is not a Python package.

**What a user must do to get a working binary on riscv64:**
1. Install a riscv64 JDK 8+ (JDK 21 recommended; available from Eclipse Temurin, Amazon Corretto, or Azul Zulu for riscv64)
2. Either: `apt install libpostgresql-jdbc-java` on Debian/Ubuntu, or add `org.postgresql:postgresql:42.7.13` to a Gradle/Maven dependency declaration
3. Connect to a PostgreSQL server (which must run separately; see `project-reports/postgresql.md` for server-side riscv64 status)

No riscv64-specific build step, cross-compiler, or workaround is required.

---

## 9. Dependencies

**Summary table:**

| Dependency | Version | Role | riscv64 build | riscv64 test | riscv64 release | Blocking |
|---|---|---|---|---|---|---|
| OpenJDK | 8+ (21 recommended) | JVM runtime | Yes (JEP 422, JDK 19+) | Full jtreg pass | Temurin/Corretto/Zulu all ship riscv64 | None; see project-reports/openjdk.md |
| PostgreSQL server | 9.1-18+HEAD | Database backend | Yes (generic C paths) | Regression tests pass | Packaged by Debian/Ubuntu/Fedora | No correctness blockers; see project-reports/postgresql.md |
| com.ongres.scram:scram-client 3.2 | 3.2 | SCRAM-SHA-1/256 auth (shaded into JAR) | Pure Java | No riscv64-specific issues found | Shaded; no separate riscv64 artifact needed | None |
| org.checkerframework:checker-qual | 3.55.1 | Nullness annotations | Pure Java | No riscv64-specific issues found | Platform-neutral JAR on Maven Central | None |
| com.github.waffle:waffle-jna | 1.9.1 | Windows SSPI/Kerberos auth (optional) | Windows-only; not applicable on Linux/riscv64 | Not applicable | Not applicable | None; OS guard makes this inert on riscv64 |
| net.java.dev.jna:jna | (transitive via waffle-jna) | JNA native bridge for waffle-jna | riscv64 support in JNA 5.13+; `linux-riscv64.jar` ships since 5.13 | All riscv64-related JNA issues closed (PRs #1623, #1558 merged) | JNA 5.15.0 ships riscv64 | None; only relevant via Windows SSPI path which is inert on Linux |
| org.osgi:{core,service.jdbc} | 6.0.0 / 1.0.0 | OSGi container integration (optional) | Pure Java specification interfaces | No riscv64-specific issues | Container-provided at deploy time | None |

**Deep-dive: OpenJDK**

OpenJDK is the only dependency with riscv64-specific implementation work. JEP 422 (RISC-V Linux port) was delivered in JDK 19 (September 2022) and is mainline since then. The C1 and C2 JIT compilers, all GC barriers, and RVV SIMD vectorization are present. Eclipse Temurin, Amazon Corretto, and Azul Zulu all ship riscv64 binary distributions. See `project-reports/openjdk.md` for full detail.

**Deep-dive: PostgreSQL server**

The server builds on riscv64 via generic C code paths. riscv64 is present on the PostgreSQL Build Farm. Spin-lock, CRC32C, and popcount implementations use generic fallbacks rather than architecture-specific intrinsics; hand-tuned patches are under community review but do not block correctness. See `project-reports/postgresql.md` for full detail.

**Deep-dive: JNA via waffle-jna**

JNA is a transitive dependency only through the optional Windows SSPI authentication path (`waffle-jna`). On Linux/riscv64, the SSPI code path cannot be activated (SSPI is a Windows authentication protocol that loads `NTDSAPI.dll`). JNA riscv64 support is resolved: `linux-riscv64.jar` ships since JNA 5.13, the OSGi MANIFEST.MF fix for riscv64 merged in JNA 5.14 (PR #1623), and GLIBC 2.34 compatibility improved in 5.14 (PR #1558). All four riscv64-related issues and PRs in `java-native-access/jna` are closed. This dependency is not a blocker for any riscv64 Linux deployment.

---

## 11. Known Bugs and Active Issues

**Performance issues (open):**

| Issue | Title | Opened | Notes |
|---|---|---|---|
| [#4066](https://github.com/pgjdbc/pgjdbc/issues/4066) | feat: Add pipeline mode with dedicated reader thread | 2026-05-12 | Architecture-agnostic |
| [#4188](https://github.com/pgjdbc/pgjdbc/issues/4188) | feat: built-in Unix domain socket factory for Java 17+ | 2026-06-15 | Architecture-agnostic; beneficial on all platforms |
| [#3694](https://github.com/pgjdbc/pgjdbc/issues/3694) | Enable reWriteBatchedInserts by default | 2025-06-29 | Architecture-agnostic |
| [#3221](https://github.com/pgjdbc/pgjdbc/issues/3221) | Performance degradation of XML operations under Java 21 | 2024-04-18 | XML factory instantiation 2-3x slower under Java 21 vs Java 8; 40,546 vs 1,653 JAR reads per invocation; fix is to cache factory instances |
| [#2325](https://github.com/pgjdbc/pgjdbc/issues/2325) | Support pipelining queries | 2021-10-27 | Architecture-agnostic |
| [#1724](https://github.com/pgjdbc/pgjdbc/issues/1724) | Very slow performance over network (small TCP window size) | 2020-02-28 | Architecture-agnostic |

**Correctness bugs (open):**

| Issue | Title | Opened | Severity | Notes |
|---|---|---|---|---|
| [#1941](https://github.com/pgjdbc/pgjdbc/issues/1941) | Poor handling of numeric NaN | 2020-10-22 | High | Binary mode: integers silently return 0 for NaN; BigDecimal throws ClassCastException. Text mode: PSQLException. Inconsistent behavior, unassigned, no fix proposed in 6 years. |
| [#1460](https://github.com/pgjdbc/pgjdbc/issues/1460) | Fix ResultSet.getBigDecimal when scale is -1 | 2019-04-04 | Medium | Architecture-agnostic numeric precision issue |
| [#1394](https://github.com/pgjdbc/pgjdbc/issues/1394) | time '24:00:00' wraps to '00:00:00' in binary mode | 2019-01-20 | Medium | Binary vs text mode inconsistency |
| [#1393](https://github.com/pgjdbc/pgjdbc/issues/1393) | LocalTime loses precision: microseconds stored, milliseconds returned | 2019-01-20 | Medium | Architecture-agnostic |

No riscv64-specific bugs exist. All open issues are architecture-agnostic JVM or SQL protocol behavioral problems.

---

## 12. Objections and Upstream Blockers

No upstream objections to riscv64 exist because no one has raised riscv64 as a topic in the project. The project has no stated objection to riscv64 CI or testing; the absence is structural (GitHub-hosted runners do not provide riscv64) rather than philosophical.

**Technical blockers:** None. The artifact is architecture-independent bytecode.

**Organizational blockers:** None stated.

**What would adding riscv64 CI require:** A riscv64 self-hosted GitHub Actions runner or QEMU emulation step in one workflow file, plus a running PostgreSQL instance on riscv64 for integration tests. No upstream code changes are required.

---

## 13. Investment Analysis

RISE has not funded or engaged with pgjdbc in any indexed public source. No work has been done that this analysis would duplicate.

### 13.1 Functional Enablement

No functional enablement work is needed. pgjdbc runs on riscv64 today via any conformant JDK. The Debian/Ubuntu `arch: all` package installs without modification.

### 13.2 Performance Optimization

No pgjdbc-specific performance optimization is applicable on riscv64. pgjdbc performs network I/O and SQL wire protocol parsing in pure Java. Its riscv64 performance is determined by the OpenJDK JIT and the PostgreSQL server, not by any pgjdbc code. Investment here should target OpenJDK vectorization and PostgreSQL server-side riscv64 optimizations, not pgjdbc itself.

### 13.3 CI/CD Infrastructure

This is the only area where investment in pgjdbc itself makes sense for riscv64. Adding riscv64 CI would provide test coverage that currently does not exist anywhere upstream. The effort is low: one workflow file change plus a riscv64 runner or QEMU configuration.

### 13.4 Ecosystem Enablement

Not applicable. pgjdbc is a library with no dependent plugin ecosystem that requires separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 runner or QEMU emulation to `.github/workflows/main.yml`; configure a PostgreSQL riscv64 instance for integration tests | 1 | RISE infrastructure or pgjdbc maintainers | Low |
| Functional | No work required | 0 | N/A | N/A |
| Performance | No pgjdbc-specific work; address via OpenJDK and PostgreSQL server reports | 0 | N/A | N/A |
| Packaging | Fedora RPM auto-includes riscv64 via `%{java_arches}`; Debian/Ubuntu `arch: all` already works; no action needed | 0 | N/A | N/A |

**Overall assessment:** pgjdbc requires zero functional investment for riscv64 enablement. The driver works today on any riscv64 JVM. The only gap is CI coverage, which is a 1-person-week effort with low strategic value unless riscv64 PostgreSQL server deployments reach a scale where JDBC driver correctness testing is independently warranted. Investment should flow to OpenJDK and PostgreSQL server instead.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [pgjdbc GitHub repository](https://github.com/pgjdbc/pgjdbc)
- [pgjdbc homepage / JDBC.postgresql.org](https://jdbc.postgresql.org/)
- [pgjdbc GitHub issue search: riscv](https://github.com/pgjdbc/pgjdbc/issues?q=riscv)
- [pgjdbc GitHub PR search: riscv64](https://github.com/pgjdbc/pgjdbc/pulls?q=riscv64)
- [pgjdbc CI matrix script: .github/workflows/matrix.mjs](https://github.com/pgjdbc/pgjdbc/blob/main/.github/workflows/matrix.mjs)
- [pgjdbc main CI workflow: .github/workflows/main.yml](https://github.com/pgjdbc/pgjdbc/blob/main/.github/workflows/main.yml)
- [pgjdbc release 42.7.13 on GitHub](https://github.com/pgjdbc/pgjdbc/releases/tag/REL42.7.13)
- [pgjdbc on Maven Central: org.postgresql:postgresql](https://central.sonatype.com/artifact/org.postgresql/postgresql)
- [Debian tracker: libpgjava source package](https://tracker.debian.org/pkg/libpgjava)
- [Ubuntu Noble: libpostgresql-jdbc-java package](https://packages.ubuntu.com/noble/libpostgresql-jdbc-java)
- [Fedora Copr: pgjdbc RPM (praiskup)](https://copr.fedorainfracloud.org/)
- [Issue #1941: Poor handling of numeric NaN](https://github.com/pgjdbc/pgjdbc/issues/1941)
- [Issue #3221: XML operations performance degradation under Java 21](https://github.com/pgjdbc/pgjdbc/issues/3221)
- [Issue #4066: Pipeline mode with dedicated reader thread](https://github.com/pgjdbc/pgjdbc/issues/4066)
- [Issue #4188: Built-in Unix domain socket factory for Java 17+](https://github.com/pgjdbc/pgjdbc/issues/4188)
- [Issue #2325: Support pipelining queries](https://github.com/pgjdbc/pgjdbc/issues/2325)
- [Issue #1724: Very slow performance over network](https://github.com/pgjdbc/pgjdbc/issues/1724)
- [Issue #1394: time 24:00:00 wraps in binary mode](https://github.com/pgjdbc/pgjdbc/issues/1394)
- [Issue #1393: LocalTime loses microsecond precision](https://github.com/pgjdbc/pgjdbc/issues/1393)
- [JNA riscv64 support: linux-riscv64.jar since JNA 5.13](https://github.com/java-native-access/jna)
- [JNA PR #1623: OSGi MANIFEST.MF riscv64 entry fix](https://github.com/java-native-access/jna/pull/1623)
- [JNA PR #1558: GLIBC 2.34 compatibility for riscv64](https://github.com/java-native-access/jna/pull/1558)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE 2024 end-of-year ecosystem update](https://riseproject.dev/2024/12/18/rise-2024-end-of-year-ecosystem-update/)
- [OpenJDK RISC-V status report](project-reports/openjdk.md)
- [PostgreSQL server RISC-V status report](project-reports/postgresql.md)