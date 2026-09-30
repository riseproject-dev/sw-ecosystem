---
title: Apache Spark
parent: Project Reports
color: orange
dependencies:
  - name: OpenJDK
    relation: runtime-dependency
    criticality: critical
  - name: Maven
    relation: build-dependency
    criticality: critical
  - name: SBT
    relation: build-dependency
    criticality: optional
  - name: Apache Hadoop
    relation: runtime-dependency
    criticality: optional
  - name: Apache Arrow
    relation: runtime-dependency
    criticality: optional
  - name: Apache ORC
    relation: runtime-dependency
    criticality: optional
  - name: Apache Parquet
    relation: runtime-dependency
    criticality: optional
  - name: Apache Avro
    relation: runtime-dependency
    criticality: optional
  - name: Netty
    relation: runtime-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: optional
  - name: gRPC
    relation: runtime-dependency
    criticality: optional
  - name: snappy-java
    relation: runtime-dependency
    criticality: optional
  - name: zstd-jni
    relation: runtime-dependency
    criticality: optional
  - name: lz4-java
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="apache-spark" %}

# Apache Spark

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (no-upstream-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Apache Spark<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Apache Spark is a distributed data analytics engine and a top-level project of the Apache Software Foundation (ASF) since February 2014, licensed under Apache License 2.0. Governance follows the standard ASF Project Management Committee (PMC) model with lazy consensus on the dev@spark.apache.org mailing list; significant new functionality requires a Spark Improvement Proposal (SPIP). Issue tracking runs on Apache JIRA, not GitHub (GitHub Issues are disabled on [apache/spark](https://github.com/apache/spark)); code review and merge happen on GitHub pull requests.

The dominant corporate sponsor is Databricks, employing the project's founders (Matei Zaharia, Reynold Xin, Patrick Wendell) and 47 of the committers listed on [spark.apache.org/committers.html](https://spark.apache.org/), by far the largest single-company bloc. Other organizations with multiple committers: Apple (4, including the current most-active committer Dongjoon Hyun), NVIDIA (4), IBM (3), NetEase (3), Cloudera (3), Intel (2), Meta (2), Alibaba (2), Baidu (2). Single-committer affiliations include AWS, Facebook, Google, Huawei, LinkedIn (2), Microsoft, NTT, OpenAI, Oracle, Palantir, Red Hat, Stripe, eBay, and several universities (UC Berkeley, Michigan, Wisconsin, Virginia, UMass Amherst, Stanford). A sample of the most recent 100 commits on master confirms Dongjoon Hyun (Apple) and several Databricks-affiliated engineers (including Wenchen Fan) as the currently most active committers, consistent with the roster above.

The latest stable release, per the authoritative Apache distribution mirror ([dlcdn.apache.org/spark/spark-4.2.0/](https://dlcdn.apache.org/spark/spark-4.2.0/)), is **4.2.0**. The minimum supported JVM is Java 17. The primary implementation language is Scala 2.13 (Scala 2.12 support was dropped in Spark 4.0.0).

Repository: [https://github.com/apache/spark](https://github.com/apache/spark)
Homepage: [https://spark.apache.org/](https://spark.apache.org/)

On community culture toward new platforms: the contributing guide states that "large and independent new functionality is often rejected for inclusion in Spark itself" in favor of hosting externally on spark-packages.org, and lists "adds complexity that only helps a niche use case" as a negative code-review signal. Major changes require SPIP/mailing-list consensus. This culture directly shapes how RISC-V has been treated to date (Section 12).

---

## 2. Port History and Upstreaming Timeline

Apache Spark has no dedicated RISC-V port. There is no commit on the master branch whose message references RISC-V (`git log --grep=riscv` returns zero hits), no JIRA ticket filed with RISC-V as its primary subject prior to SPARK-53065, and no GitHub issue exists with RISC-V as a topic (GitHub Issues are disabled; JIRA is authoritative). RISC-V support is inherited passively, as a side effect of Netty and other dependencies shipping riscv64 native artifacts.

Six pull requests touch riscv64, none as their actual purpose, all confirmed merged via independent `git fetch` of the merge-commit objects and cross-checked against JIRA `fixVersions`:

| PR | Title | Merged | First release | riscv64 role |
|---|---|---|---|---|
| [#44384](https://github.com/apache/spark/pull/44384) | Upgrade Netty to 4.1.106.Final | 2024-01-26 | 4.0.0 (2025-05-23) | First riscv64 Netty artifact enters the dependency tree; triggers the only on-record committer debate about riscv64 (Section 12) |
| [#48666](https://github.com/apache/spark/pull/48666) | Upgrade ZooKeeper to 3.9.3 | 2024-10-27, reverted 2024-11-06 | N/A (reverted; refixed by #48771) | Incidental artifact listing only; revert was caused by an unrelated Netty version conflict |
| [#48771](https://github.com/apache/spark/pull/48771) | ZooKeeper 3.9.3 / Netty 4.1.114 follow-up | 2024-11-07 | 4.0.0 (2025-05-23) | Incidental artifact listing; re-applies #48666 after fixing its Netty conflict. Merge commit `07301ddb889bdf361499f65e1708b5fdcab7e539` confirmed via git fetch |
| [#48810](https://github.com/apache/spark/pull/48810) | Upgrade netty-tcnative to 2.0.69.Final | 2024-11-11 | 4.0.0 (2025-05-23) | Incidental artifact listing; no riscv64 tcnative binary exists or was added. Merge commit `cf9ca4261e4573db128679419316ff083c1aa4cb` confirmed |
| [#51868](https://github.com/apache/spark/pull/51868) | [SPARK-53138] Split common-utils Java code into new module | 2025-08-12 | 4.1.0 (2025-12-16) | Build-log excerpt in the PR description shows the riscv64 Netty epoll native jar being shaded during the YARN shuffle-service build; incidental exposure, not a code change |
| [#53382](https://github.com/apache/spark/pull/53382) | [SPARK-54636] Correctly relocate Netty native libs for YARN ESS | 2025-12-09 | 4.1.0 (2025-12-16), landed 7 days before release | Most architecturally significant riscv64-touching PR: explicitly names and fixes relocation of `liborg_sparkproject_netty_transport_native_io_uring42_riscv64.so` and `liborg_sparkproject_netty_transport_native_epoll_riscv64.so` in the shaded YARN External Shuffle Service jar |

PR #44384 (January 2024) is the origin point of every subsequent riscv64 mention in Spark's history: committer LuciferYang (Databricks) questioned whether the newly appearing `linux-riscv64` Netty artifacts should be excluded for lack of CI ("we do not yet have the corresponding CI to verify the usability of Apache Spark on RISC-V"); committer dongjoon-hyun (Apple) overruled him ("It's fine with new entry. It doesn't mean Apache Spark claims any new additional architecture support."). LuciferYang accepted the decision. Every later riscv64-touching PR follows this same de facto policy: accept upstream riscv64 artifacts incidentally, without claiming or testing riscv64 platform support.

First RISC-V commit: none exists. Master tracking issue: [SPARK-53065](https://issues.apache.org/jira/browse/SPARK-53065), "Comprehensive Tracking of RISC-V Architecture Support," filed 2025-08-01 by Gong Xiaofei. Status: Open, category "To Do." As of 2026-09-30 (14 months after filing) it has zero sub-tasks, zero comments, and no assignee; its `updated` timestamp is identical to its `created` timestamp, confirming it has never been touched since filing. It is a placeholder with no follow-up activity of any kind. Spark is not upstream-ported for riscv64; it functions there only because it is a JVM application and the JVM itself runs on riscv64.

---

## 3. Upstream Support Tier

Apache Spark has no formal platform-tier policy. No `PLATFORMS.md`, `SUPPORT.md`, `CODEOWNERS`, `MAINTAINERS`, or `OWNERS` file exists in the repository, and there is no `docs/platforms/` directory. Platform support is implicit: whatever architecture a JVM runs on, Spark's JVM layer runs on.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage | Full (majority of 47 workflows) | Partial (2 workflows: `build_maven_java21_arm.yml`, `build_python_3.12_arm.yml`) | None |
| Release-blocking status | Yes | No (best-effort) | Not applicable, not tested |
| Official binaries | Yes (JVM archives, arch-neutral) | Yes (JVM archives, arch-neutral) | Yes in the sense the arch-neutral tarball runs there if a riscv64 JDK is present; no riscv64-specific artifact exists or is needed |
| Documented support | Implicit | Implicit | Not documented anywhere |

Because Spark distributes architecture-neutral JVM bytecode, the "support" question is really about the JVM and native dependency layer, not about Spark's own build. No formal Spark-side porting effort has been initiated, tracked, or approved for RISC-V. **Effective tier: unsupported / untested.** RISC-V is not a documented platform, has zero CI coverage, and has no assigned maintainer or tracking beyond the empty SPARK-53065 umbrella.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Apache Spark contains no architecture-specific native code of its own. Independently re-verified today via a fresh clone of `apache/spark` at HEAD plus GitHub's global code-search index (used as a cross-check independent of the clone): the only native (C/C++/asm) file in the entire repository is `R/pkg/src-native/string_hash_code.c` (49 lines, a portable R-extension implementing Java's `String.hashCode()`, with no `#ifdef`, no architecture guard, and no arch-specific logic). There is no `src/main/native/` or `jni/` directory belonging to Spark itself, no `arch/riscv/` directory, no `.S` assembly files of any ISA, and no RISC-V JIT backend or RVV/SIMD dispatch anywhere in the codebase.

GitHub code-search queries executed against `apache/spark` HEAD (this session, 2026-09-30): `riscv` (3 hits), `vfloat32m1_t` (0), `rvv` (2, both false-positive substring matches inside unrelated npm package names, not RVV intrinsics), `riscv64` (3), `arch/riscv` (0), `extension:S` (0, no assembly files of any architecture exist), `zba` (9, all false positives in test fixtures/base64/hashes), `zbb` (8, same false-positive pattern). The three genuine `riscv`/`riscv64` matches are all non-code: `dev/deps/spark-deps-hadoop-3-hive-2.3` (a generated Maven dependency manifest listing the `netty-transport-native-epoll` riscv64 artifact), `common/network-yarn/pom.xml` (an Ant `<move>` task shading a prebuilt `libnetty_transport_native_epoll_riscv64.so`), and `ui-test/package-lock.json` (an npm lockfile entry for a frontend lint-tool dependency, unrelated to Spark's runtime). All native acceleration Spark uses comes from third-party dependency JARs bundling prebuilt `.so` files, not from code Spark authors itself.

**Platform.java unaligned-memory detection (silent pessimization on riscv64):** `common/unsafe/src/main/java/org/apache/spark/unsafe/Platform.java` determines whether the JVM's CPU supports unaligned memory access, via explicit overrides for `ppc64le`, `ppc64`, `s390x` (forced true, working around known JDK bugs) and a regex fallback `^(i[3-6]86|x86(_64)?|x64|amd64|aarch64)$` assumed true. **`riscv64` appears in neither list.** If the JVM's own `java.nio.Bits.unaligned()` check does not correctly detect unaligned support for the specific riscv64 JVM/kernel combination, Spark's Tungsten off-heap memory engine falls back to 8-byte aligned record offsets via `UnsafeAlignedOffset.java` instead of the optimal 4-byte offsets, wasting roughly half of the record-header space in off-heap hash maps and sort buffers. This is correctness-safe but performance-degrading. No JIRA ticket, PR, or tracking issue exists for this gap.

**Netty native transport (the primary riscv64 native surface Spark relies on):**

| Transport | riscv64 upstream artifact | YARN ESS shading (post-PR #53382) |
|---|---|---|
| epoll | Present since Netty 4.1.106 (2024) | Correctly relocated |
| io_uring42 | Present since Netty 4.2 | Correctly relocated |
| quiche42 (QUIC) | Absent, no upstream artifact | Absent |
| tcnative (TLS/BoringSSL) | Absent, BoringSSL not built for riscv64 | Absent |

If `epoll` and `io_uring42` load successfully on riscv64, Spark gets full async network I/O for RPC and shuffle. TLS offload via `tcnative` is unavailable; encrypted shuffle falls back to the JVM's own JSSE implementation, which is correctness-safe but not offloaded.

**Shuffle codec (lz4-java, critical gap):** LZ4 is Spark's default shuffle compression codec. `lz4-java` 1.8.0 (last released 2021-06-19) ships no riscv64 native binary; [PR #212](https://github.com/lz4/lz4-java/pull/212) adding riscv64 JNI support has been open and unmerged since filing. Every Spark shuffle on riscv64 today uses the pure-Java LZ4 fallback path. This affects all shuffle-heavy workloads (joins, aggregations, sorts), and the upstream project shows no release activity in over four years.

No SIMD or RVV code path exists in Spark itself. Vectorized SQL execution runs through the JVM's `jdk.incubator.vector` Java Vector API, which is platform-agnostic and depends entirely on the JIT compiler's own SIMD code generation, not on anything Spark authors.

---

## 5. Build System, Cross-Compilation, and Toolchain

Apache Spark builds with Maven (minimum 3.9.16) as the primary system and SBT as a secondary option. Independently re-verified today by inspecting the live repository: no `CMakeLists.txt` exists anywhere in the tree, no `cmake/` directory exists at all, `BUILDING.md` and `INSTALL` are absent at the repo root, and `docs/cross-compilation.md` does not exist. The real build document is `docs/building-spark.md` (present, read in full): it covers Maven/SBT usage, Java 17/21/25, Scala 2.13, memory settings, and YARN/Hadoop/Hive/JDBC profiles, with no architecture-specific section, no RISC-V mention, and no CMake reference of any kind.

Because Spark compiles no native code of its own, cross-compilation does not apply. All build artifacts are architecture-neutral JVM bytecode JARs. Architecture-specific `.so` files are pulled in as Maven classifier dependencies from upstream projects (Netty, snappy-java, zstd-jni), not compiled by Spark's own build.

**To build and run Spark on riscv64 hardware:**

1. Install a riscv64 JDK 17+ (Adoptium Temurin publishes riscv64 builds).
2. Install Maven 3.9.x.
3. Run `./build/mvn -DskipTests clean package`. No architecture flags are required.
4. Maven pulls the `linux-riscv64` Netty `epoll` and `io_uring42` native transport JARs automatically.
5. `netty-tcnative` (BoringSSL/TLS) and `netty-quiche42` (QUIC) have no riscv64 artifacts and are silently skipped at runtime.
6. `lz4-java` has no riscv64 native binary; Spark falls back to pure-Java LZ4 for shuffle compression.

No riscv64-specific build documentation exists in the repository or on spark.apache.org. The only Dockerfiles in the repository are `resource-managers/kubernetes/docker/src/main/dockerfiles/spark/Dockerfile` (Kubernetes resource-manager image, base `eclipse-temurin:25-jre`, no `--platform` flag, no multi-arch logic) and `dev/create-release/spark-rm/Dockerfile` (release tooling); neither takes a riscv64 build arg or invokes QEMU. There is no `.ci/` or top-level `docker/` directory. No QEMU usage exists anywhere in the build system (matching the CI finding in Section 7).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JVM execution (HotSpot C2 JIT) | Full | Full | Full: OpenJDK 17/21 with C2 JIT, believed functional per Gomez-Sanchez et al. 2023 (arXiv:2306.15562), though on interpreter-only Zero VM at the time, not verified with a current HotSpot-JIT-on-riscv64 Spark benchmark [NEEDS VERIFICATION] |
| Netty epoll transport | Full | Full | Full, bundled since Spark 4.0, correctly shaded since PR #53382 |
| Netty io_uring42 transport | Full | Full | Full, shading fixed in Spark 4.1 via PR #53382; not validated on real riscv64 hardware |
| Netty quiche42 (QUIC) | Full | Full | Missing, no upstream riscv64 artifact from Netty |
| TLS offload (netty-tcnative) | Full | Full | Missing, BoringSSL not built for riscv64 |
| LZ4 shuffle codec (native) | Full | Full | Missing, [lz4-java PR #212](https://github.com/lz4/lz4-java/pull/212) open/unmerged; pure-Java fallback used |
| Snappy codec (native) | Full | Full | Full, riscv64 binary since 2023 |
| Zstandard codec (native) | Full | Full | Full, riscv64 binary since 2023, but no riscv64 CI upstream |
| Tungsten off-heap 4-byte record offsets | Full (regex match) | Full (regex match) | Conservative 8-byte fallback if the JVM misreports unaligned support; `riscv64` is absent from Platform.java's detection regex |
| Arrow columnar execution (JNI) | Full | Full | Missing, Arrow Java JNI binary not published for riscv64 |
| ORC native read/write | Full | Full | Missing, ORC C++ native lib not published for riscv64 |
| Hadoop native CRC32C | Full | Full | Degraded, riscv64 CRC32C support exists only in Hadoop 4.x trunk, not in the 3.5.0 Spark currently depends on |
| protoc (Spark Connect codegen) | Full | Full | Missing, protoc not published for riscv64 in any Protobuf release |
| CI coverage | Full | Partial (2 workflows) | None |
| Docker multi-arch image | linux/amd64 | linux/arm64 | None |

The three highest-impact gaps relative to arm64 are: (1) the `lz4-java` native shuffle codec, affecting every shuffle operation, (2) the Arrow JNI binary blocking accelerated PySpark DataFrame operations, and (3) the `Platform.java` unaligned-detection pessimization degrading Tungsten off-heap memory efficiency. No security-hardening-specific or NaN/floating-point-semantics gap specific to riscv64 was found; the one open NaN-handling bug in Spark (SPARK-54579, Section 11) is architecture-independent.

---

## 7. CI/CD Infrastructure

Apache Spark has zero riscv64 CI of any kind. Confirmed today (2026-09-30) by a fresh clone of `apache/spark` at HEAD and by reading all 47 files in `.github/workflows/` (benchmark.yml, branch35_scheduler.yml, branch40_scheduler.yml, branch41_scheduler.yml, branch42_scheduler.yml, branch43_scheduler.yml, branch4x_scheduler.yml, build_and_test.yml, build_codegen_jdk.yml, build_coverage.yml, build_infra_images_cache.yml, build_java17.yml, build_java21.yml, build_java25.yml, build_main.yml, build_maven.yml, build_maven_java21.yml, build_maven_java21_arm.yml, build_maven_java21_macos26.yml, build_maven_java25.yml, build_non_ansi.yml, build_python_3.11.yml, build_python_3.12_arm.yml, build_python_3.12_classic_only.yml, build_python_3.12_macos26.yml, build_python_3.12_pandas_3.yml, build_python_3.13.yml, build_python_3.14.yml, build_python_3.14_nogil.yml, build_python_3.9.yml, build_python_connect.yml, build_python_connect40.yml, build_python_minimum.yml, build_python_pypy3.10.yml, build_rockdb_as_ui_backend.yml, build_scala213.yml, build_sparkr_window.yml, build_uds.yml, maven_test.yml, notify_test_workflow.yml, pages.yml, publish_snapshot.yml, python_hosted_runner_test.yml, release.yml, stale.yml, test_report.yml, update_build_status.yml). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository. This was independently corroborated by a GitHub global code-search cross-check restricted to `path:.github/workflows` and `filename:Jenkinsfile`, both returning zero riscv64 hits. The workflow count is 47 today versus 49 in a prior check; this is normal upstream churn, not a riscv64-related change.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner | `ubuntu-latest` (majority of jobs) | `ubuntu-24.04-arm` (2 workflows) | None |
| QEMU emulation step | Not applicable | Not used (native ARM runner) | None exists |
| Trigger conditions referencing this arch | Push, PR, dispatch, schedule (all standard workflows) | Push, PR (2 workflows) | None; no riscv64 matrix entry exists for a trigger to attach to |
| RISE runner infrastructure used | No | No | No; RISE's own `riscv-runner`/`riscv-runner-app`/`riscv-runner-images` GitHub Actions runner projects are not referenced anywhere in `apache/spark`'s CI |

No workflow file contains the string `riscv`, `riscv64`, or `RISCV` in any case, and no riscv64 runner label, matrix entry, or QEMU emulation step exists anywhere. This was noted explicitly during the PR #44384 review (January 2024), where committer LuciferYang stated "we do not yet have the corresponding CI to verify the usability of Apache Spark on RISC-V," and the riscv64 artifact was accepted anyway without that gap being closed.

---

## 8. Distribution and Release Status

Apache Spark distributes releases through the ASF mirror network, not GitHub Releases. The [apache/spark GitHub Releases page](https://github.com/apache/spark/releases) states "There aren't any releases here" -- Spark does not publish GitHub Release binary assets for any architecture, so no release-asset filename analysis for riscv64 is possible or meaningful.

The latest stable release, **4.2.0**, is published at [dlcdn.apache.org/spark/spark-4.2.0/](https://dlcdn.apache.org/spark/spark-4.2.0/) and includes: `spark-4.2.0.tgz`, `spark-4.2.0-bin-hadoop3.tgz`, `spark-4.2.0-bin-hadoop3-connect.tgz`, `spark-4.2.0-bin-without-hadoop.tgz`, `pyspark-4.2.0.tar.gz`, `pyspark_connect-4.2.0.tar.gz`, `pyspark_client-4.2.0.tar.gz`, `SparkR_4.2.0.tar.gz` (plus signatures and checksums). All are architecture-neutral JVM/Java distributions -- Spark ships no arch-specific binaries for any platform, riscv64 included. No filename anywhere contains "riscv64."

**PyPI:** There is no PyPI project literally named `apache-spark` (`https://pypi.org/pypi/apache-spark/json` returns HTTP 404); the real distribution is `pyspark`. Its latest release (4.2.0, confirmed live) ships exactly one file, `pyspark-4.2.0.tar.gz`, a source sdist with zero wheels for any platform. riscv64-specific wheels are therefore not applicable; PySpark's JVM dependency ships inside the tarball regardless of architecture.

**RISE wheel builder (GitLab project 56254198):** No `apache-spark` package is registered (`packages/pypi/simple/apache-spark/` 302-redirects to the same 404 PyPI page). There is nothing to build wheels from, since the underlying PyPI project does not exist under that name.

**Docker Hub:** The `apache/spark` image (tag 4.0.3 as last checked) publishes exactly two platform manifests, `linux/amd64` and `linux/arm64`. No `riscv64` manifest is published [NEEDS VERIFICATION -- not re-checked this pass against the current 4.2.0-era tag].

**Linux distributions:** Not packaged in Ubuntu under any plausible name (`apache spark`, `python3-apache-spark`, `libapache-spark`) -- a live search of Ubuntu 26.04 "resolute" across all sections and architectures found zero matching packages; the only "spark"-substring hits were unrelated packages (`laniakea-spark`, `libjs-jquery.sparkline`, `node-sparkles`, `nspark`, `pcp-export-pcp2spark`, `php-sparkline`, `python3-sparkpost`). Removed from Debian in December 2019 and never reintroduced. Not present in the Arch Linux RISC-V port database (a live search of archriscv.felixc.at for "apache spark" returned no matches).

**Summary:** Apache Spark ships exclusively as architecture-neutral JVM archives through Apache mirrors, with a Python sdist on PyPI. No riscv64-specific binary, wheel, or distro package is published through any official or community channel checked. To get Spark running on riscv64, a user installs a riscv64 JDK 17+ and either downloads the same architecture-neutral `spark-4.2.0-bin-hadoop3.tgz` or builds from source with Maven (Section 5) -- there is no separate riscv64 acquisition path because none is needed for the JVM layer, though the native dependency gaps (Section 6) still apply.

---

## 9. Dependencies

Version numbers are from `apache/spark` master (`pom.xml`, 5.0.0-SNAPSHOT) unless otherwise noted. All rows below were cross-checked live against upstream dependency trackers.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| OpenJDK | JVM runtime, all Spark execution | Full: C2 JIT upstreamed since JDK 11 | No dedicated CI; community-tested | Adoptium Temurin 17/21/25 riscv64 binaries published | None |
| Maven | Build system | Arch-neutral (build-time tool, not deployed) | N/A | N/A | None |
| SBT | Alternate build system | Arch-neutral (build-time tool, not deployed) | N/A | N/A | None |
| Apache Hadoop | HDFS, YARN | Builds; native CRC32C (Zbc extension) only in 4.x trunk, not the 3.5.0 Spark uses | Untested on riscv64 | No riscv64-specific release artifact | [HADOOP-19849](https://issues.apache.org/jira/browse/HADOOP-19849) open, no 3.5.x backport |
| Apache Arrow | Columnar in-memory format, DataFrame vectorization, PySpark Arrow acceleration | JNI native lib not published for riscv64 | N/A pending build-from-source | No riscv64 Python wheels | [GH-49555](https://github.com/apache/arrow/issues/49555) open, [PR #49556](https://github.com/apache/arrow/pull/49556) open |
| Apache ORC | Columnar storage, C++ native lib via JNI | Native lib missing; riscv64 porting in progress | N/A pending merge | Not released for riscv64 | [PR #2639](https://github.com/apache/orc/pull/2639), [PR #2644](https://github.com/apache/orc/pull/2644) open |
| Apache Parquet | Columnar storage, default table format | Full: pure Java, arch-neutral | Arch-neutral | Arch-neutral | None directly; indirectly affected by the lz4-java gap |
| Apache Avro | Binary serialization (Kafka, schema registry) | Full: pure Java, arch-neutral | Arch-neutral | Arch-neutral | None identified |
| Netty | Async network I/O, RPC, shuffle | Full for epoll and io_uring42 (riscv64 native libs shipped); quiche42 (QUIC) absent | Passively exercised via Spark PR #53382's shading fix; not independently CI-tested | riscv64 artifacts published since Netty 4.1.106 (epoll) and 4.2 (io_uring42) | None blocking core transport |
| Protocol Buffers | Serialization, Spark Connect RPC | Java runtime arch-neutral; `protoc` compiler binary not published for riscv64 | N/A | No riscv64 `protoc` release | [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244), [PR #23206](https://github.com/protocolbuffers/protobuf/pull/23206), both closed without merge |
| gRPC | Spark Connect client-server RPC | Full: pure Netty-based Java, arch-neutral | Arch-neutral | Arch-neutral | None for Java use |
| snappy-java | JNI Snappy compression | Full: riscv64 native binary bundled since [PR #396](https://github.com/xerial/snappy-java/pull/396) (merged 2023-02-15) | No riscv64 CI upstream [NEEDS VERIFICATION] | Released | None |
| zstd-jni | JNI Zstandard compression | Full: riscv64 native binary present since [PR #282](https://github.com/luben/zstd-jni/pull/282) (merged 2023-10-18) | No riscv64 CI upstream | Released | None hard; silent-regression risk given the absence of CI |
| lz4-java | JNI LZ4, default Spark shuffle codec | **Missing native binary**, pure-Java fallback used | N/A | Stale project, no release since 2021 | [PR #212](https://github.com/lz4/lz4-java/pull/212) open/unmerged, issues [#209](https://github.com/lz4/lz4-java/issues/209) and [#215](https://github.com/lz4/lz4-java/issues/215) open |
| OpenSSL | TLS for encrypted shuffle and HDFS | Full: OpenSSL 3.x supports riscv64 | Distro-level, not Spark-specific | Available on riscv64 Linux distros | None |

**Highest-impact gap:** lz4-java, the default shuffle codec, has no riscv64 native binary and the upstream project is effectively unmaintained. This is the single dependency gap with the broadest performance impact, since it affects every shuffle-heavy Spark workload (joins, aggregations, sorts) on riscv64.

---

## 10. Ecosystem Status

**RISE Project:** Apache Spark is not a RISE Project member and does not appear in any RISE project material. An exhaustive crawl of riseproject.dev's full blog history (35 posts, May 2024 through 2026-09-28, including 8 posts published since a prior June 2026 check: "RISE RISC-V Runners: Six Weeks In," "Improving RISC-V Support in the Yocto Project," "Industry Cooperation Takes Center Stage at RISC-V Summit Europe 2026," "Optimizing IREE Compilation and End-to-End Object Detection Pipeline for RISC-V," "Advancing OpenSBI Interrupt Handling," "SaltyRN: Turning Neon Kernels into Fast Verified RVV Code with LLMs," "RISE Working Groups Move Their Project Tracking to GitHub," "PyTorch Is Available on riscv64," "Python Now Officially Supports RISC-V," "How Kairos Is Charting the Stepping Stones of RISC-V Productization") returned zero posts referencing Spark, big data, or data analytics, confirmed both by title/content review and via the site's own native search index (query "spark" returns "Sorry, no results were found"). RISE's GitHub org (`riseproject-dev`, 26 repositories confirmed live via the GitHub API) contains only working-group trackers, RISC-V runner infrastructure (`riscv-runner`, `riscv-runner-app`, `riscv-runner-images`, `riscv-runner-device-plugin`), Python packaging tooling (`python-wheels`, `python-versions`, `pypi-proxy`), and CI tooling (`gcc-precommit-ci`, `pytorch-ci`) -- no repository named `spark` or otherwise data-analytics-related exists in the org.

**RISE membership (verified live 2026-09-30 via riseproject.dev/members):** 20 organizations across two tiers. Premier Members (8): Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm Technologies, Red Hat, SiFive, Tenstorrent. General Members (12): Akeana, Andes Technology, Beijing ESWIN Computing Technology, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software Chinese Academy of Sciences, Microchip Technology, NextSilicon, Quintauris, SpacemiT, ZTE. Databricks and the Apache Software Foundation are not members. The membership is exclusively silicon vendors, hyperscalers, and RISC-V tooling organizations, with no data-analytics/big-data project represented.

RISE does fund OpenJDK work that benefits Spark indirectly, since Spark runs entirely on the JVM:
- "OpenJDK: Supercharging Vectorized Math with SLEEF" (2025-09-24): approximately 2.38x average speedup on RISC-V for vectorized math in the OpenJDK JIT (SLEEF bridge, JDK PRs #20781/#21083, SLEEF PRs #536/#537) [NEEDS VERIFICATION -- no cross-architecture comparison data published, and the post makes no mention of Spark or JVM application-level workloads].
- "OpenJDK: CMoveX and Vectorization" (2025-07-23): greater than 2.1x average JIT performance improvement, up to 4x in some cases, using `-XX:+UseVectorCmov -XX:+UseCMoveUnconditionally` (Zicond extension) [NEEDS VERIFICATION -- JVM-level only, no Spark-specific data].
- "Java on RISC-V: RISE and Eclipse Adoptium Partnership" (2024-05-29): Java 17/21/22 availability for riscv64 via Adoptium Temurin; distribution only, no benchmark data.

These JVM-level improvements benefit any Spark deployment on riscv64, but no Spark-specific enablement effort has been initiated within or outside RISE.

**Published benchmarks:** The only quantitative Spark-on-RISC-V benchmark located, across this and prior research passes including a live arXiv API query (`all:Spark AND all:RISC-V`, no new paper found) and a GitHub repository search for "spark riscv64 benchmark" (zero results), is Gomez-Sanchez et al. 2023, "Challenges and Opportunities for RISC-V Architectures towards Genomics-based Workloads," [arXiv:2306.15562](https://arxiv.org/abs/2306.15562) (ISC-HPC 2023, EU Vitamin-V project GA 101093062):

| Metric | Value |
|---|---|
| Spark cluster startup, RISC-V (Zero VM, interpreter-only) | Approximately 535 seconds |
| Spark cluster startup, x86_64 (HotSpot) | Under 10 seconds |
| Startup overhead | 25x slower on RISC-V |
| Workload throughput vs vectorized x86_64 | 5x or more slower, across all 12 test configurations |
| Workload throughput vs non-vectorized x86_64 | 3x or more slower, across all 12 test configurations |
| Node scalability on RISC-V | Adding a 3rd node degraded performance rather than improving it |

Testbed: 4x HiFive Unmatched (SiFive U740, 4-core at 1.2 GHz, 16GB DDR4, 1Gbps Ethernet, no vector/RVV extension), Java Zero VM 11 (interpreter-only, no JIT was available for RISC-V at the time), versus 4x x86_64 VMs (SandyBridge-EP E5-2670, 8-core at 2.6 GHz, 16GB DDR3, 40Gbps InfiniBand). Root causes per the authors: Zero VM interpreter overhead vs HotSpot JIT, absence of vector extensions on the test boards, a 1Gbps-vs-40Gbps network disparity, and a data-distribution bottleneck when scaling workers. This data is from 2023-era hardware and an interpreter-only JVM; with C2 JIT now available on riscv64 and the RISE-funded JVM vectorization work above, the JVM-level gap has likely narrowed, but **no updated published Spark benchmark on current riscv64 hardware with HotSpot JIT exists**. Two tangential papers found via the arXiv query do not constitute updated Spark-on-RISC-V data: one (Arshad & Brown 2026) does not involve Spark at all, and the other (Wen, Gao, Wang, Zhan 2024) uses Spark only as a baseline for a different framework's own speedup claims, not as a measurement of Spark itself.

The EU Vitamin-V project designated TPC-DS as its primary Spark RISC-V benchmark; Deliverable D3.4 ("RISC-V ported Google TensorFlow and Apache Spark platforms," filed approximately August 2025) remains unpublished on both CORDIS and Zenodo as of this check. No numeric TPC-DS result for Spark on RISC-V has been located anywhere.

Data not available: Spark TPC-H or TPC-DS results on modern riscv64 hardware with a HotSpot JIT.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [SPARK-53065](https://issues.apache.org/jira/browse/SPARK-53065) | Comprehensive Tracking of RISC-V Architecture Support | Open / To Do | Informational (umbrella) | Filed 2025-08-01, still 0 comments, 0 sub-tasks, no assignee, `updated` == `created`, confirmed stale as of 2026-09-30. Placeholder only. |
| N/A (no ticket filed) | `Platform.java` unaligned-memory detection excludes riscv64 | Untracked | Performance | `riscv64` is absent from the arch-detection regex and explicit override list; falls back to conservative 8-byte Tungsten offsets if the JVM's own detection is insufficient. No JIRA ticket, no PR. |
| [SPARK-54579](https://issues.apache.org/jira/browse/SPARK-54579) | `createDataFrame` incorrectly handles NaN in a pandas DataFrame when Arrow optimization is on | Open / Unresolved | Correctness (general, not riscv64-specific) | Filed 2025-12-03, last updated 2025-12-04. `np.nan` and `None` both convert to NULL, erasing the distinction, when `spark.sql.execution.arrow.pyspark.enabled=true`. Linked PR apache/spark#53310 is active. No architecture is named in the ticket. |
| [lz4-java #212](https://github.com/lz4/lz4-java/pull/212) | Add riscv64 JNI binding | Open, unmerged | Blocks native shuffle codec | Not a Spark bug; a downstream blocker for the default shuffle codec's performance on riscv64. |
| [Apache Arrow GH-49555](https://github.com/apache/arrow/issues/49555) | riscv64 Python wheel pipeline | Open | Blocks PySpark Arrow acceleration | Downstream blocker, not a Spark bug. |
| [Apache ORC PR#2639](https://github.com/apache/orc/pull/2639), [PR#2644](https://github.com/apache/orc/pull/2644) | riscv64 native build/CI | Open | Blocks native ORC read/write | Downstream blockers, not Spark bugs; Spark falls back to the Java ORC path until merged. |

No GitHub issue exists that references riscv64 (Issues are disabled on `apache/spark`; three GitHub PR/code-search queries for `riscv64 performance`, `riscv64 bug state:open`, and `riscv nan floating` each returned zero results). **No riscv64-specific correctness or performance bug is filed anywhere in `apache/spark` itself, on either GitHub or JIRA, beyond the empty SPARK-53065 tracking umbrella.**

---

## 12. Objections and Upstream Blockers

**On-record committer exchange (the only one that exists):** in the [PR #44384](https://github.com/apache/spark/pull/44384) review (January 2024), committer LuciferYang (Databricks) advocated excluding the newly appearing riscv64 Netty artifact: "I am more inclined to exclude this dependency. Because we do not yet have the corresponding CI to verify the usability of Apache Spark on RISC-V." Committer dongjoon-hyun (Apple) overruled this: "I'm fine with new entry. It doesn't mean Apache Spark claims any new additional architecture support." LuciferYang accepted the decision without further objection. No committer has raised the topic since. There is no active technical objection to riscv64 today; the blocker is inertia and lack of priority, not disagreement.

**Community process:** the SPIP process requires mailing-list consensus before implementing significant new functionality; the contributing guide explicitly states large new functionality is often redirected to spark-packages.org rather than accepted into core. A proposal to add riscv64 CI or formal platform support would need a SPIP, a CI hardware/runner source (GitHub Actions has no managed riscv64 runners), and a maintainer willing to own riscv64-specific breakages -- none of which currently exist for Spark.

**Upstream dependency blockers** that must clear before riscv64 Spark reaches arm64 feature parity:
1. [lz4-java PR#212](https://github.com/lz4/lz4-java/pull/212): stale, no maintainer responsiveness observed; worst-case path is forking or replacing the JNI binding.
2. [Apache Arrow GH-49555](https://github.com/apache/arrow/issues/49555): active discussion but unmerged; needs Arrow's own CI infrastructure investment.
3. Protobuf `protoc` riscv64 binary: two PRs closed without merge; a workaround exists (build `protoc` from source or use the `protoc-jar-maven-plugin` fallback).

**Acceptance probability assessment:** Spark itself is not the bottleneck -- no committer objects to riscv64 support in principle, and PR #53382 shows the project will readily accept correctness fixes that happen to touch riscv64. The real gating factor is that no one has proposed, funded, or driven a SPIP for riscv64 CI, and the empty 14-month-old SPARK-53065 umbrella reflects that no maintainer has taken ownership.

---

## 13. Readiness Assessment

- **Color:** orange (no-upstream-ci)
- **Release provider:** none
- **Justification:** Apache Spark has zero riscv64 CI across all 47 GitHub Actions workflows and no Jenkinsfile, `.gitlab-ci.yml`, or `.cirrus.yml` ([.github/workflows](https://github.com/apache/spark/tree/master/.github/workflows)), and no Linux distribution or third party currently packages it for riscv64 (not in Ubuntu, removed from Debian since 2019, not in Arch RISC-V), so per the grading model's "no upstream CI" orange row there is no distribution floor to raise it above orange. Apache Spark is a general-purpose distributed-computing framework, not an optimization or acceleration library, so the optimization-purpose modifier does not apply. The JVM bytecode is believed to run on riscv64 (Gomez-Sanchez et al. 2023, [arXiv:2306.15562](https://arxiv.org/abs/2306.15562), functionally confirms this, ruling out a red/non-functional grade), but this remains unverified and untracked by the project itself: the sole tracking ticket, [SPARK-53065](https://issues.apache.org/jira/browse/SPARK-53065), has sat open with zero comments, zero sub-tasks, and no assignee since 2025-08-01.
- **Pending work that could change the grade:** [SPARK-53065](https://issues.apache.org/jira/browse/SPARK-53065) is the single item to watch. If it gains real CI or testing sub-tasks, the grade could move to yellow; if upstream adds a riscv64 CI job with actual test execution, it would move to blue or green. No such activity has occurred in the 14 months since filing, and none of the six riscv64-touching PRs found (Section 2) represents dedicated RISC-V enablement work -- all are incidental Netty/ZooKeeper/build-artifact changes.

---

## 14. Investment Analysis

RISE has already funded OpenJDK JIT vectorization work (SLEEF math, CMoveX/Zicond) that benefits Spark indirectly at the JVM layer, and has funded Adoptium Temurin riscv64 JDK availability; no work sizing below duplicates this. RISE has not funded, and is not aware of, any Spark-specific enablement work (Section 10).

### 14.1 Functional Enablement

Spark runs on riscv64 today without code changes, given a riscv64 JDK 17+. The JVM layer is complete; remaining gaps are in native code paths that are performance-relevant, not correctness-blocking:
- lz4-java: every shuffle uses the pure-Java LZ4 fallback. Requires merging or forking [PR#212](https://github.com/lz4/lz4-java/pull/212), or cutting a release from a largely inactive upstream project. Estimated effort: 2-4 weeks to land a release, gated on upstream maintainer responsiveness.
- `Platform.java` unaligned detection: a one-line regex change to add `riscv64`, plus validation that the Linux riscv64 kernel/JVM combination correctly reports unaligned support. Estimated effort: 1 week including testing. Highest-return, lowest-risk Spark-side change identified.
- Arrow JNI / PySpark Arrow acceleration: requires Arrow C++ build infrastructure for riscv64, tracked at [GH-49555](https://github.com/apache/arrow/issues/49555). Estimated effort: 3-6 weeks in Arrow, plus a Spark-side validation pass.
- ORC native lib: tracked at [PR#2639](https://github.com/apache/orc/pull/2639)/[PR#2644](https://github.com/apache/orc/pull/2644). Estimated effort: 1-2 weeks Spark-side validation if the PRs merge as-is, 4-8 weeks if driving the PRs to merge is required.
- protoc: a workaround exists (source build or plugin fallback); one-time setup cost for production Maven builds on riscv64, not a recurring blocker.

### 14.2 Performance Optimization

The only published data point, Gomez-Sanchez et al. 2023, used an interpreter-only JVM on 2023-era hardware and is not representative of a current HotSpot-JIT riscv64 deployment; the RISE-funded JIT vectorization work (2.1x-2.4x math speedups) has likely closed part of the JVM-level gap, but no updated Spark-specific benchmark exists to confirm this. Priorities, in order:
1. Enable the native LZ4 shuffle codec (via [lz4-java PR#212](https://github.com/lz4/lz4-java/pull/212)): highest impact per unit effort for shuffle-heavy workloads.
2. Fix `Platform.java` unaligned detection: recovers Tungsten off-heap memory efficiency.
3. Validate the Netty io_uring42 transport on real riscv64 hardware: the shading fix is already merged ([PR #53382](https://github.com/apache/spark/pull/53382)); the remaining cost is purely operational validation.
4. Commission a current TPC-DS/TPC-H benchmark of Spark on riscv64 hardware with HotSpot JIT, since no such data exists anywhere (Section 10).

### 14.3 CI/CD Infrastructure

Adding riscv64 CI requires: (1) a riscv64 runner source, since GitHub Actions has no managed riscv64 runners as of this writing [NEEDS VERIFICATION] and RISE's own `riscv-runner` GitHub Actions infrastructure is not currently used by Spark; (2) a workflow file modeled on `build_maven_java21_arm.yml`; (3) committer consensus via a SPIP or informal dev@spark.apache.org proposal; (4) a long-term owner for riscv64 test failures. QEMU-based CI is viable for correctness testing but not for performance benchmarking; self-hosted riscv64 runners require hardware procurement. Estimated effort for basic riscv64 CI (QEMU, build plus core tests): 3-5 weeks including infrastructure setup and the mailing-list process.

### 14.4 Ecosystem Enablement

The highest-leverage indirect investments, all outside Spark itself:
1. [lz4-java PR#212](https://github.com/lz4/lz4-java/pull/212): review, merge, and cut a release. Unblocks the default Spark shuffle codec for every riscv64 JVM application using LZ4, not just Spark.
2. Apache Arrow's riscv64 wheel pipeline ([GH-49555](https://github.com/apache/arrow/issues/49555)): unblocks PySpark Arrow-accelerated DataFrames and much of the broader Python data stack.
3. Continued RISE-funded OpenJDK JIT improvements: directly improve Spark's JVM execution performance with zero Spark-side code changes required.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `Platform.java` unaligned detection (add riscv64 to the regex) | 1 | Apache Spark committer | High |
| Functional | Drive [lz4-java PR#212](https://github.com/lz4/lz4-java/pull/212) to merge and release | 2-4 | lz4-java upstream + Spark dependency bump | Critical |
| Functional | Drive Apache Arrow riscv64 JNI and wheel pipeline ([GH-49555](https://github.com/apache/arrow/issues/49555)) | 3-6 | Apache Arrow + PySpark | High |
| Functional | Drive Apache ORC riscv64 native lib ([PR#2639](https://github.com/apache/orc/pull/2639), [PR#2644](https://github.com/apache/orc/pull/2644)) | 2-4 (if PRs merge), 4-8 (if driving needed) | Apache ORC | Medium |
| Performance | Validate Netty io_uring on real riscv64 hardware post-PR #53382 | 1-2 | Spark networking subteam | High |
| Performance | Benchmark Spark TPC-DS on current riscv64 hardware with HotSpot JIT | 2-4 | Performance team | High |
| CI/CD | Add riscv64 CI runner (QEMU or self-hosted) plus workflow file | 3-5 | Infrastructure + Apache Spark committer | Medium |
| CI/CD | File and pursue a SPIP for riscv64 as a supported/experimental platform | 1-2 (process) | Spark PMC sponsor | Medium |
| Ecosystem | Continue RISE-funded OpenJDK JIT improvements for RISC-V | Ongoing | RISE / JVM team | High |

---

## 15. References

- [Apache Spark GitHub repository](https://github.com/apache/spark)
- [Apache Spark GitHub Actions workflows](https://github.com/apache/spark/tree/master/.github/workflows)
- [SPARK-53065, Comprehensive Tracking of RISC-V Architecture Support](https://issues.apache.org/jira/browse/SPARK-53065)
- [SPARK-54579, NaN handling with Arrow optimization](https://issues.apache.org/jira/browse/SPARK-54579)
- [HADOOP-19849, CRC32C riscv64 open issue](https://issues.apache.org/jira/browse/HADOOP-19849)
- [PR #44384, Upgrade Netty to 4.1.106.Final (first riscv64 artifact plus committer debate)](https://github.com/apache/spark/pull/44384)
- [PR #48666, Upgrade ZooKeeper to 3.9.3 (merged then reverted)](https://github.com/apache/spark/pull/48666)
- [PR #48771, ZooKeeper 3.9.3 / Netty 4.1.114 follow-up](https://github.com/apache/spark/pull/48771)
- [PR #48810, Upgrade netty-tcnative to 2.0.69.Final](https://github.com/apache/spark/pull/48810)
- [PR #51868, Split common-utils Java code into a new module](https://github.com/apache/spark/pull/51868)
- [PR #53382, Correctly relocate Netty native libs for YARN ESS (riscv64 fix)](https://github.com/apache/spark/pull/53382)
- [lz4-java PR#212, Add JNI binding for Linux riscv64](https://github.com/lz4/lz4-java/pull/212)
- [lz4-java issue #209](https://github.com/lz4/lz4-java/issues/209)
- [lz4-java issue #215](https://github.com/lz4/lz4-java/issues/215)
- [Apache Arrow GH-49555, riscv64 Python wheel pipeline](https://github.com/apache/arrow/issues/49555)
- [Apache Arrow PR#49556, riscv64 wheel pipeline implementation](https://github.com/apache/arrow/pull/49556)
- [Apache ORC PR#2639, C++ riscv64 build support](https://github.com/apache/orc/pull/2639)
- [Apache ORC PR#2644, Docker/CI riscv64](https://github.com/apache/orc/pull/2644)
- [snappy-java PR#396, riscv64 native binary, merged 2023](https://github.com/xerial/snappy-java/pull/396)
- [zstd-jni PR#282, riscv64 support, merged 2023](https://github.com/luben/zstd-jni/pull/282)
- [Protocol Buffers PR#12244](https://github.com/protocolbuffers/protobuf/pull/12244)
- [Protocol Buffers PR#23206](https://github.com/protocolbuffers/protobuf/pull/23206)
- [Gomez-Sanchez et al. 2023, arXiv:2306.15562, Spark benchmark on HiFive Unmatched](https://arxiv.org/abs/2306.15562)
- [Apache Spark releases (ASF mirror, spark-4.2.0)](https://dlcdn.apache.org/spark/spark-4.2.0/)
- [PyPI, pyspark package](https://pypi.org/pypi/pyspark/json)
- [RISE Project blog](https://riseproject.dev/)
- [RISE Project members list](https://riseproject.dev/members)
- [RISE Project GitHub organization](https://github.com/riseproject-dev)
- [Vitamin-V project (GA 101093062) CORDIS results page](https://cordis.europa.eu/project/id/101093062/results)