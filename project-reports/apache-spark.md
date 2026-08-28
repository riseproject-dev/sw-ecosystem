---
title: Apache Spark
parent: Project Reports
categories:
  - data-analytics
---

# Apache Spark

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Apache Spark<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Apache Spark is a distributed data analytics engine, a top-level project of the Apache Software Foundation (ASF) since February 2014. It is licensed under Apache License 2.0. The governance model follows the standard ASF Project Management Committee (PMC) structure with lazy consensus on the dev@spark.apache.org mailing list. Significant new functionality requires a Spark Improvement Proposal (SPIP). The project uses Apache JIRA for issue tracking and GitHub for pull requests.

The dominant corporate sponsor is Databricks, which employs the founders (Matei Zaharia, Reynold Xin, Patrick Wendell) and the majority of active committers. Secondary sponsoring organizations include Apple, NVIDIA, IBM, Intel, Meta, Cloudera, Microsoft, NetEase, Huawei, Baidu, and Alibaba. The top contributor by commit count is Dongjoon Hyun (Apple, 2,396 commits); the top Databricks contributor is Hyukjin Kwon (1,969 commits).

The current release at the time of writing is 4.1.2. The master branch targets 5.0.0-SNAPSHOT. The minimum supported JVM is Java 17 (minimum 17.0.11). The primary language is Scala 2.13 (Scala 2.12 support was dropped in Spark 4.0.0).

Repository: [https://github.com/apache/spark](https://github.com/apache/spark)
Homepage: [https://spark.apache.org/](https://spark.apache.org/)

---

## 2. Port History and Upstreaming Timeline

Apache Spark has no RISC-V port history. There are zero commits in `apache/spark` referencing RISC-V in any form. No JIRA ticket has ever been filed with RISC-V as its primary subject (confirmed via JIRA REST API: `total=0` for both `riscv` and `riscv64`). No GitHub issue or PR in `apache/spark` exists with RISC-V as a primary topic.

The only RISC-V-adjacent activity consists of six pull requests where `riscv64` appears incidentally in build logs or Maven dependency listings as a side-effect of Netty shipping riscv64 platform artifacts:

| PR | Title | Merged | Release | riscv64 Role |
|----|-------|--------|---------|--------------|
| [#44384](https://github.com/apache/spark/pull/44384) | Upgrade Netty to 4.1.106.Final | 2024-01-26 | Spark 4.0.0 | First riscv64 Netty artifact included; active committer debate about inclusion (see Section 12) |
| [#48666](https://github.com/apache/spark/pull/48666) | Upgrade ZooKeeper to 3.9.3 | 2024-10-27 (reverted 2024-11-06) | N/A (reverted) | Incidental artifact listing; PR reverted due to unrelated Netty version conflict |
| [#48771](https://github.com/apache/spark/pull/48771) | ZooKeeper 3.9.3 / Netty 4.1.114 follow-up | 2024-11-07 | Spark 4.0.0 | Incidental artifact listing; fixes #48666 |
| [#48810](https://github.com/apache/spark/pull/48810) | Upgrade netty-tcnative to 2.0.69.Final | 2024-11-11 | Spark 4.0.0 | Incidental artifact listing; no riscv64 tcnative artifact included |
| [#51868](https://github.com/apache/spark/pull/51868) | Split common-utils Java code into new module | 2025-08-12 | Spark 4.1.0 | riscv64 Netty epoll jar shaded into YARN shuffle JAR |
| [#53382](https://github.com/apache/spark/pull/53382) | Correctly relocate Netty native libs for YARN ESS | 2025-12-09 | Spark 4.1.0 | riscv64 explicitly named; fixes relocation of `io_uring42` and `epoll` native libs in YARN ESS JAR |

The most architecturally significant of these is [PR #53382](https://github.com/apache/spark/pull/53382): it explicitly names `liborg_sparkproject_netty_transport_native_io_uring42_riscv64.so` and `liborg_sparkproject_netty_transport_native_epoll_riscv64.so` in the YARN External Shuffle Service relocation fix, ensuring these libs get the correct `liborg_sparkproject_` prefix in the shaded JAR. This is correctness work for YARN deployment, not a RISC-V enablement initiative.

First RISC-V commit: **none**.
Tracking issue: [SPARK-53065](https://issues.apache.org/jira/browse/SPARK-53065) -- "Comprehensive Tracking of RISC-V Architecture Support" -- filed 2025-08-01 by Gong Xiaofei. Status: Open / To Do. Zero sub-tasks, zero comments, no assignee. A placeholder with no follow-up activity.

---

## 3. Upstream Support Tier

Apache Spark has no formal platform tier policy. There is no PLATFORMS.md, SUPPORT.md, CODEOWNERS, MAINTAINERS, or OWNERS file in the repository. Platform support is implicit: if a JVM runs on a given architecture, Spark's JVM layer runs there.

The contributing guide warns that "significant, independent functionality" is often redirected to spark-packages.org rather than accepted into the core. Large changes require SPIP discussion before implementation. The project leans against complex features for niche use cases.

For RISC-V specifically: because Spark is a JVM application, RISC-V support flows automatically from JVM availability. No formal Spark-side porting work has been initiated, tracked, or approved. RISC-V is not listed as a supported or experimental platform anywhere in official documentation.

**Effective tier: unsupported / untested.** RISC-V is not a documented platform, has no CI coverage, and has no assigned maintainer.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Apache Spark contains no architecture-specific native code. The codebase is pure Java/Scala. There are no C, C++, or assembly source files in the repository. There is no `src/main/native/` or `jni/` directory. All native acceleration comes from upstream dependency JARs that bundle prebuilt `.so` files.

**Platform.java -- unaligned memory access detection (silent pessimization on riscv64):**

`Platform.java` at `common/unsafe/src/main/java/org/apache/spark/unsafe/Platform.java` determines whether the JVM is running on a CPU that supports unaligned memory access. It uses two mechanisms:

- Explicit overrides for `ppc64le`, `ppc64`, `s390x` (forced true due to known JDK bugs).
- A fallback regex matching `^(i[3-6]86|x86(_64)?|x64|amd64|aarch64)$` assumed true.

**`riscv64` appears in neither list.** If the JVM's `java.nio.Bits.unaligned()` does not correctly detect unaligned support on the specific JVM/kernel combination, Spark's Tungsten off-heap memory engine falls back to 8-byte aligned offsets via `UnsafeAlignedOffset.java` instead of the optimal 4-byte offsets. This wastes approximately 50% of record header space in Tungsten's off-heap hash maps and sort buffers. The fallback is correctness-safe but represents a measurable memory-efficiency regression. There is no JIRA ticket, no PR, and no tracking issue for this gap.

**Netty native transport (the main riscv64 native surface):**

Spark's networking layer (RPC, shuffle) delegates to Netty. As of Netty 4.2.x (the version in Spark 5.0.0-SNAPSHOT), three Netty native transports exist for Linux: `epoll`, `io_uring42`, and `quiche42`. The riscv64 coverage is:

| Transport | riscv64 upstream artifact | YARN ESS shading (post-PR #53382) |
|-----------|--------------------------|----------------------------------|
| `epoll` | Present (since Netty 4.1.106, 2024) | Correctly relocated |
| `io_uring42` | Present (since Netty 4.2) | Correctly relocated |
| `quiche42` (QUIC) | Absent (no upstream artifact) | Absent |
| `tcnative` (TLS/BoringSSL) | Absent (BoringSSL not built for riscv64) | Absent |

If `epoll` and `io_uring42` native JARs load successfully on riscv64, Spark gets full async network I/O performance. TLS offload via `tcnative` is not available; the JVM JSSE fallback is used for encrypted shuffle.

**Shuffle codec (lz4-java -- critical gap):**

LZ4 is Spark's default shuffle compression codec. The Java binding `lz4-java` version 1.8.0 (last released 2021-06-19) does not include a riscv64 native binary. [PR #212](https://github.com/lz4/lz4-java/pull/212) adding riscv64 JNI support is open and unmerged. Every Spark shuffle on riscv64 uses the pure-Java LZ4 implementation. The performance impact is significant and affects all shuffle-heavy workloads (joins, aggregations, sorts). The project appears poorly maintained; no release has occurred in over four years.

**No SIMD / RVV code paths exist** in Spark itself. There is no vectorized SQL execution via RVV intrinsics. Vectorized execution in Spark SQL operates at the JVM level via the Java Vector API (`jdk.incubator.vector`), which is platform-agnostic and depends on the JIT compiler for SIMD code generation.

---

## 5. Build System, Cross-Compilation, and Toolchain

Apache Spark uses Maven as its primary build system (minimum version 3.9.16) and SBT as a secondary option. There is no CMake, no toolchain files, no cross-compilation configuration, and no Dockerfile using `--platform=linux/riscv64` or `ARG TARGETARCH`. No QEMU usage exists in any CI workflow.

Because Spark has no native code to compile, cross-compilation is not applicable. All build artifacts are JVM bytecode JARs. Architecture-specific `.so` files are downloaded as Maven classifier dependencies from upstream projects (Netty, snappy-java, etc.), not compiled during the Spark build.

**To build Spark on riscv64 hardware:**

1. Install Java 17+ for riscv64 (available from Debian/Ubuntu ports or Adoptium Temurin -- see [RISE blog post, May 2024](https://riseproject.dev/)).
2. Install Maven 3.9.x.
3. Run `./build/mvn -DskipTests clean package`.
4. No architecture flags are needed. Maven downloads JVM bytecode artifacts.
5. The Netty native transport JARs (`epoll`, `io_uring42`) for `linux-riscv64` will be pulled automatically.
6. `netty-tcnative` (BoringSSL/TLS) and `netty-quiche42` (QUIC) have no riscv64 artifacts; these are silently skipped at runtime.
7. `lz4-java` has no riscv64 native binary; Spark falls back to pure-Java LZ4.

No riscv64-specific build documentation exists in the Apache Spark repository or on spark.apache.org.

The Kubernetes Dockerfile at `resource-managers/kubernetes/docker/src/main/dockerfiles/spark/Dockerfile` uses `eclipse-temurin:25-jre` as the base image with no `--platform` flag and no multi-arch build logic. Temurin does not publish a stable riscv64 manifest for JRE images as of 2025 [NEEDS VERIFICATION]; multi-arch Docker builds for riscv64 would require a custom base image.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| JVM execution (HotSpot JIT) | Full | Full | Full (OpenJDK 17/21 with C2 JIT, available since ~2022) |
| Netty epoll native transport | Full | Full | Full (Netty 4.1.106+, passively bundled since Spark 4.0) |
| Netty io\_uring42 transport | Full | Full | Full (Netty 4.2, correctly shaded in Spark 4.1 via PR #53382) |
| Netty quiche42 (QUIC) | Full | Full | Missing (no upstream riscv64 artifact from Netty) |
| TLS offload (netty-tcnative) | Full | Full | Missing (BoringSSL not built for riscv64) |
| LZ4 shuffle codec (native) | Full | Full | Missing (lz4-java PR #212 open/unmerged; pure-Java fallback used) |
| Snappy codec (native) | Full | Full | Full (snappy-java riscv64 binary since 2023, PR #396) |
| Zstandard codec (native) | Full | Full | Full (zstd-jni riscv64 binary since 2023, PR #282) |
| Tungsten off-heap (4-byte UAO) | Full (regex match) | Full (regex match) | Conservative 8-byte fallback if JVM unaligned() misreports; Platform.java regex excludes riscv64 |
| Arrow columnar execution (JNI) | Full | Full | Missing (Arrow Java JNI binary not published for riscv64; build from source required) |
| ORC native read/write | Full | Full | Missing (ORC C++ native lib not published for riscv64; two open PRs: #2639, #2644) |
| Hadoop native CRC32C | Full | Full | Degraded (CRC32C riscv64 support in Hadoop 4.x trunk only; Spark 5.0 uses Hadoop 3.5.0 which has no riscv64 native CRC binary) |
| protoc (Spark Connect codegen) | Full | Full | Missing (protoc not published for riscv64 in any Protobuf release; two PRs closed without merge) |
| CI coverage | Full | Partial (2 workflows) | None |
| Docker multi-arch image | Full (linux/amd64) | Full (linux/arm64) | None |

The three highest-impact gaps relative to arm64 are: (1) lz4-java native shuffle codec, (2) Arrow JNI binary for columnar operations, (3) Platform.java unaligned detection pessimization in Tungsten.

---

## 7. CI/CD Infrastructure

Apache Spark has no riscv64 CI of any kind. This was confirmed by reading all 49 workflow files in `.github/workflows/` plus checking for `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, and `appveyor.yml` (none of the latter five exist in the repository).

Current CI matrix:
- x86\_64: `ubuntu-latest`, the majority of all CI jobs.
- ARM64: `ubuntu-24.04-arm` in two workflows (`build_maven_java21_arm.yml`, `build_python_3.12_arm.yml`).
- macOS: Intel and arm64 macOS runners in several workflows.

None of the 49 workflow files contain the strings `riscv`, `riscv64`, or `RISCV`.

The PR #44384 review (January 2024) explicitly noted the absence of riscv64 CI. Committer LuciferYang stated: "we do not yet have the corresponding CI to verify the usability of Apache Spark on RISC-V." The riscv64 Netty artifact was included anyway, with committer dongjoon-hyun noting: "It doesn't mean Apache Spark claims any new additional architecture support."

No QEMU-based riscv64 emulation step exists in any workflow.

---

## 8. Distribution and Release Status

Apache Spark publishes releases through the Apache Software Foundation distribution infrastructure, not GitHub Releases. GitHub Releases for `apache/spark` contain no binary assets.

The latest stable release is 4.1.2. The Apache archive at [downloads.apache.org/spark/spark-4.1.2/](https://downloads.apache.org/spark/spark-4.1.2/) contains:
- `spark-4.1.2-bin-hadoop3.tgz` and variants -- JVM fat binary, architecture-neutral JAR bundles.
- `pyspark-4.1.2.tar.gz`, `pyspark_client-4.1.2.tar.gz`, `pyspark_connect-4.1.2.tar.gz` -- source distributions.
- `SparkR_4.1.2.tar.gz` -- source distribution.

No architecture-split binaries exist. No filename contains `riscv64`.

**PyPI:** The `pyspark` package on PyPI (latest version 4.1.2) ships only as `pyspark-4.1.2.tar.gz` (sdist). There are zero wheel files for any platform or architecture. riscv64 is not applicable at the PyPI level; PySpark's JVM dependency is bundled in the tarball.

**Docker Hub:** The `apache/spark` image on Docker Hub (current tag 4.0.3) publishes exactly two platform manifests: `linux/amd64` and `linux/arm64`. `riscv64` does not appear in any tag manifest. No riscv64 Docker image is published.

**Linux distributions:**
- Ubuntu: Apache Spark is not packaged in Ubuntu Noble (24.04) or any current Ubuntu release.
- Debian: The `apache-spark` package was removed from Debian in December 2019 and has not been re-introduced.
- Arch Linux RISC-V: Apache Spark is not in the Arch Linux RISC-V port database.

**Summary:** Apache Spark ships exclusively as architecture-neutral JVM archives. No riscv64-specific binary artifact is published through any official or community channel.

---

## 9. Dependencies

The table below covers dependencies with riscv64-specific relevance. Version numbers are from `apache/spark` master (`pom.xml`, version 5.0.0-SNAPSHOT) unless otherwise noted.

| Dependency | Version | Role | riscv64 Status | Blocking Issues |
|------------|---------|------|----------------|-----------------|
| OpenJDK | 17 (min 17.0.11) | JVM runtime; all Spark execution | Full: C2 JIT upstreamed since JDK 11; Temurin 17 and 21 riscv64 binaries available | None |
| Apache Hadoop | 3.5.0 | HDFS, YARN | Degraded: riscv64 native CRC32C (via Zbc extension) merged to Hadoop 4.x trunk only; not in 3.5.0; all checksumming falls back to Java CRC | [HADOOP-19849](https://issues.apache.org/jira/browse/HADOOP-19849) open; no 3.5.x backport |
| Apache Arrow | 19.0.0 | Columnar in-memory format; DataFrame vectorization; PySpark Arrow acceleration | Missing: Arrow Java JNI binary not published for riscv64; Python wheels absent ([GH-49555](https://github.com/apache/arrow/issues/49555) open, [PR#49556](https://github.com/apache/arrow/pull/49556) open); must build from source | [GH-49555](https://github.com/apache/arrow/issues/49555) open |
| Apache ORC | 2.3.0 | Columnar storage; C++ native lib via JNI | Missing native lib: active riscv64 porting in progress ([PR#2639](https://github.com/apache/orc/pull/2639), [PR#2644](https://github.com/apache/orc/pull/2644) open); Spark falls back to Java ORC path | [PR#2639](https://github.com/apache/orc/pull/2639), [PR#2644](https://github.com/apache/orc/pull/2644) open |
| Apache Parquet (parquet-mr) | 1.17.1 | Columnar storage; default table format | Full: pure Java, arch-neutral | None in parquet-mr; indirectly affected by lz4-java gap |
| Apache Avro | 1.12.1 | Binary serialization (Kafka, schema registry) | Full: Java core arch-neutral | None identified |
| Netty | 4.2.15.Final | Async network I/O, RPC, shuffle | Full for epoll and io\_uring42: riscv64 native libs shipped; quiche42 absent (no upstream riscv64 artifact) | None blocking for core transport |
| Protocol Buffers | 4.33.5 | Serialization; Spark Connect RPC | Java runtime arch-neutral; protoc binary not published for riscv64 ([PR#12244](https://github.com/protocolbuffers/protobuf/pull/12244), [PR#23206](https://github.com/protocolbuffers/protobuf/pull/23206) both closed without merge) | protoc absent for riscv64: blocks on-device Maven builds that code-generate protobuf stubs |
| gRPC (grpc-java) | 1.76.0 | Spark Connect client-server RPC | Full: pure Netty-based Java, arch-neutral | None for Java use |
| snappy-java | 1.1.10.8 | JNI wrapper for Snappy compression | Full: riscv64 native binary bundled since [PR#396](https://github.com/xerial/snappy-java/pull/396) (merged 2023-02-15) | None |
| zstd-jni | 1.5.7-9 | JNI wrapper for Zstandard | Full: riscv64 native binary present since [PR#282](https://github.com/luben/zstd-jni/pull/282) (merged 2023-10-18); no riscv64 CI in upstream | No hard blocker; silent regressions possible without CI |
| lz4-java | 1.8.0 | JNI wrapper for LZ4; default Spark shuffle codec | Missing native binary: [PR#212](https://github.com/lz4/lz4-java/pull/212) open/unmerged; issues [#209](https://github.com/lz4/lz4-java/issues/209), [#215](https://github.com/lz4/lz4-java/issues/215) open; project stale (last release 2021) | **Critical for performance**: every shuffle on riscv64 uses pure-Java fallback |
| OpenSSL | system lib | TLS for encrypted shuffle/HDFS | Full: OpenSSL 3.x supports riscv64; available on riscv64 Linux distros | None |

---

## 10. Ecosystem Status

**RISE Project:** Apache Spark is not a RISE Project member and is not mentioned in any RISE project materials. An exhaustive search of riseproject.dev (all 27 blog posts from May 2024 through June 2026, the 2024 end-of-year update, all project pages, the RISE Taipei Day 2024 presentation, and all 30 repos at github.com/orgs/riseproject-dev) returned zero results for "Spark," "big data," "Hadoop," or "data analytics." RISE is focused on AI/ML (PyTorch, llama.cpp), compilers (GCC, LLVM), Python packaging, and CI infrastructure.

RISE does fund OpenJDK work that benefits Spark indirectly:
- "OpenJDK: Supercharging Vectorized Math with SLEEF" (2025-09-24): approximately 2.38x average speedup on RISC-V for vectorized math in OpenJDK JIT. Methodology: SLEEF bridge wrapping OpenJDK JIT math calls; JDK PRs #20781 and #21083, SLEEF PRs #536 and #537. [NEEDS VERIFICATION -- no cross-architecture comparison data published]
- "OpenJDK: CMoveX and Vectorization" (2025-07-23): greater than 2.1x average JIT performance improvement with `-XX:+UseVectorCmov -XX:+UseCMoveUnconditionally` flags; some cases up to 4x. Uses Zicond extension (PR #24153). [NEEDS VERIFICATION -- no x86\_64 or arm64 comparison data published]
- "Java on RISC-V: RISE and Eclipse Adoptium Partnership" (2024-05-29): Java 17, 21, 22 available for riscv64 via Adoptium Temurin. Distribution/availability only, no benchmark data.

These JVM improvements benefit Spark on RISC-V but no Spark-specific enablement work has been initiated within or outside RISE.

**Published benchmarks:** One published benchmark dataset exists.

Gomez-Sanchez et al. (2023), "Challenges and Opportunities for RISC-V Architectures towards Genomics-based Workloads," arXiv:2306.15562, ISC High-Performance Computing 2023. Funded by EU Vitamin-V (GA 101093062).

Testbed:
- RISC-V: 4x HiFive Unmatched boards, SiFive U740, 4-core at 1.2 GHz, 16 GB DDR4, 1 Gbps Ethernet. Extensions: IMAFDC (no vector/SIMD).
- x86\_64: 4x VMs on OpenStack, SandyBridge-EP E5-2670, 8-core at 2.6 GHz, 16 GB DDR3, 40 Gbps FDR10 InfiniBand.
- JVM on RISC-V: Java Zero VM 11 (interpreter-only, no JIT) -- no JIT-capable JVM was available for RISC-V at the time.

Key results:

| Metric | Value |
|--------|-------|
| Spark cluster startup, RISC-V (Zero VM) | ~535 seconds (~2.6e10 cycles) |
| Spark cluster startup, x86\_64 (HotSpot) | Less than 10 seconds (~6.4e9 cycles) |
| Startup overhead (cycles) | 25x slower on RISC-V |
| Workload throughput vs vectorized x86\_64 | 5x or more slower across all 12 test configurations |
| Workload throughput vs non-vectorized x86\_64 | 3x or more slower across all 12 test configurations |
| Node scalability on RISC-V | Adding nodes from 2 to 3 caused performance degradation (no improvement) |

Root causes identified by the authors: (1) Zero VM interpreter overhead vs HotSpot JIT, (2) no RVV extension on HiFive Unmatched (all SIMD paths bypass to scalar), (3) 1 Gbps Ethernet vs 40 Gbps InfiniBand, (4) data distribution bottleneck on master node when scaling workers.

These numbers are from 2023 hardware and an interpreter-only JVM. With OpenJDK C2 JIT now available on RISC-V, the JVM overhead gap has narrowed significantly. No updated published Spark benchmark on modern RISC-V hardware with HotSpot JIT has been located.

The EU Vitamin-V project (GA 101093062) designated TPC-DS as the primary Spark benchmark for RISC-V. Deliverable D3.4 ("RISC-V ported Google TensorFlow and Apache Spark platforms") was filed at M32 (approximately August 2025). The deliverable PDF is not publicly accessible. No published TPC-DS numeric results for Spark on RISC-V have been located.

---

## 11. Known Bugs and Active Issues

**SPARK-53065:** "Comprehensive Tracking of RISC-V Architecture Support" -- filed 2025-08-01. Status: Open / To Do. No sub-tasks, no assignee, no comments, no activity. Placeholder only.

**Platform.java unaligned detection gap:** No JIRA ticket, no PR, no tracking. riscv64 is absent from the `^(i[3-6]86|x86(_64)?|x64|amd64|aarch64)$` regex and the explicit override list in `Platform.java`. If the JVM does not independently detect unaligned support, Spark Tungsten uses 8-byte instead of 4-byte record offsets in off-heap memory. Correctness-safe, performance-degrading.

**SPARK-54579:** "createDataFrame incorrectly handles NaN in pandas DataFrame when arrow-optimization is on" -- filed 2025-12-03. Status: Open. When `spark.sql.execution.arrow.pyspark.enabled=true`, `np.nan` and `None` both convert to NULL, erasing the distinction. Linked PR apache/spark#53310 is active. Not riscv64-specific, but floating-point handling bugs of this type can manifest differently on platforms where JIT behavior varies.

**lz4-java [PR#212](https://github.com/lz4/lz4-java/pull/212):** Open and unmerged. Not a Spark bug, but a blocker for native LZ4 performance on riscv64 Spark. The upstream project has not had a release since 2021.

**Arrow [GH-49555](https://github.com/apache/arrow/issues/49555):** riscv64 Python wheel pipeline, open. Blocks PySpark with Arrow-accelerated DataFrames on riscv64 from using official release wheels.

**ORC [PR#2639](https://github.com/apache/orc/pull/2639), [PR#2644](https://github.com/apache/orc/pull/2644):** C++ native lib riscv64 build and CI support, open. Until merged and released, Spark uses the Java ORC fallback path on riscv64.

No riscv64-specific correctness bugs are filed in `apache/spark` beyond the empty SPARK-53065 umbrella.

---

## 12. Objections and Upstream Blockers

**Active committer opposition to riscv64 inclusion (on record):**

Committer LuciferYang (Databricks) explicitly advocated for excluding the riscv64 Netty artifact in [PR #44384](https://github.com/apache/spark/pull/44384) review (January 2024): "I am more inclined to exclude this dependency. Because we do not yet have the corresponding CI to verify the usability of Apache Spark on RISC-V." Committer dongjoon-hyun (Apple) overruled this: "I'm fine with new entry. It doesn't mean Apache Spark claims any new additional architecture support." LuciferYang accepted the decision. This exchange is the only on-record committer discussion of riscv64 policy. LuciferYang is the only committer who expressed interest in gating on CI verification, and he was overruled.

**Community stance on new functionality:**

The SPIP process requires mailing list consensus before implementation of significant features. The contributing guide explicitly states that large new functionality is often redirected to spark-packages.org. A proposal to add riscv64 CI runners or formal riscv64 support would need a SPIP, a hardware source (RISC-V CI runners are not available on GitHub Actions as of 2025), and a maintainer willing to own riscv64 breakages.

**Upstream dependency blockers:**

The three external blockers that must be resolved before riscv64 Spark can match arm64 feature parity:
1. `lz4-java` [PR#212](https://github.com/lz4/lz4-java/pull/212): stale, no maintainer activity. Worst-case path: fork or replace with an alternative LZ4 JNI binding.
2. `apache/arrow` [GH-49555](https://github.com/apache/arrow/issues/49555): active but unmerged; requires Arrow CI infrastructure investment.
3. `protobuf` protoc binary: two PRs closed without merge; workaround available (build from source or use `protoc-jar-maven-plugin` fallback).

---

## 13. Investment Analysis

### 13.1 Functional Enablement

Spark runs on riscv64 today without any code changes, provided a riscv64 JDK 17+ is available. The JVM layer is complete. The gaps are in native code paths that are performance-relevant but not correctness-blocking:

- lz4-java: every shuffle uses pure-Java LZ4 (slower). Fix requires merging or forking [PR#212](https://github.com/lz4/lz4-java/pull/212) upstream, or contributing a new release to a stale project. Estimated effort: 2-4 weeks to land a release; risk is upstream maintainer responsiveness.
- Platform.java unaligned detection: a one-line regex change to include `riscv64` (plus validation that the Linux riscv64 kernel reports unaligned support correctly for the JVM). Estimated effort: 1 week including testing. This is the highest-return, lowest-risk Spark-side code change.
- Arrow JNI / PySpark Arrow: requires Arrow C++ build infrastructure for riscv64, tracking [GH-49555](https://github.com/apache/arrow/issues/49555). Estimated effort: 3-6 weeks in Arrow, then a Spark-side validation pass.
- ORC native lib: tracking [PR#2639](https://github.com/apache/orc/pull/2639) and [PR#2644](https://github.com/apache/orc/pull/2644). Estimated effort if PRs merge: 1-2 weeks Spark-side validation; if PRs need driving: 4-8 weeks in ORC.
- protoc: workaround available; for production Maven builds on riscv64 hardware this is a one-time setup cost, not a recurring blocker.

### 13.2 Performance Optimization

The 2023 Gomez-Sanchez et al. benchmark (interpreter-only JVM, 1.2 GHz, no RVV, 1 Gbps Ethernet) showed 25x startup and 3-5x throughput regression vs a 2012-era x86\_64 cluster. These numbers are not representative of current hardware or JVM. With HotSpot JIT now available on riscv64 and RISE-funded JVM improvements (2.1x-2.4x math/vectorization speedups), the JVM overhead gap has meaningfully closed. No updated Spark benchmark on current riscv64 hardware with HotSpot JIT has been published.

Data not available: Spark TPC-H or TPC-DS benchmark results on modern riscv64 hardware with HotSpot JIT.

Performance investment priorities:
1. Enable native LZ4 shuffle codec (via lz4-java [PR#212](https://github.com/lz4/lz4-java/pull/212)): highest impact per effort for shuffle-heavy workloads.
2. Fix Platform.java unaligned detection: recovers Tungsten off-heap memory efficiency.
3. Validate Netty io\_uring transport on riscv64 hardware: the upstream work is done ([PR #53382](https://github.com/apache/spark/pull/53382) merged); validation cost is operational.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI to Apache Spark requires:
1. A riscv64 CI runner source (GitHub Actions has no managed riscv64 runners as of 2025 [NEEDS VERIFICATION]; options are self-hosted runners or QEMU emulation).
2. A workflow file modeled on `build_maven_java21_arm.yml`.
3. Committer consensus via a SPIP or informal proposal on dev@spark.apache.org.
4. A long-term owner willing to handle riscv64 test failures.

QEMU-based CI is viable for correctness testing but not for performance benchmarking. Self-hosted riscv64 runners require hardware procurement and maintenance. Estimated effort to add basic riscv64 CI (QEMU, build + core tests): 3-5 weeks including infrastructure setup and mailing list process.

### 13.4 Ecosystem Enablement

The highest-leverage indirect investments that unblock Spark on riscv64:
1. `lz4-java` [PR#212](https://github.com/lz4/lz4-java/pull/212): review, merge, and cut a release. Unblocks the default Spark shuffle codec for all riscv64 users of any JVM application using LZ4.
2. Apache Arrow riscv64 wheel pipeline ([GH-49555](https://github.com/apache/arrow/issues/49555)): unblocks PySpark Arrow-accelerated DataFrames and many other Python data stack components.
3. OpenJDK JIT improvements (already funded by RISE): continued investment in C2 JIT quality on RISC-V directly improves Spark's JVM execution performance with no Spark-side changes required.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Functional | Fix Platform.java unaligned detection (add riscv64 to regex) | 1 | Apache Spark committer | High |
| Functional | Drive lz4-java [PR#212](https://github.com/lz4/lz4-java/pull/212) to merge and release | 2-4 | lz4-java upstream + Spark dep bump | Critical |
| Functional | Drive Apache Arrow riscv64 JNI + wheel pipeline ([GH-49555](https://github.com/apache/arrow/issues/49555)) | 3-6 | Apache Arrow + PySpark | High |
| Functional | Drive Apache ORC riscv64 native lib ([PR#2639](https://github.com/apache/orc/pull/2639), [PR#2644](https://github.com/apache/orc/pull/2644)) | 2-4 (if PRs merge), 4-8 (if drive needed) | Apache ORC | Medium |
| Performance | Validate Netty io\_uring on riscv64 hardware post-PR #53382 | 1-2 | Spark networking subteam | High |
| Performance | Benchmark Spark TPC-DS on current riscv64 hardware with HotSpot JIT | 2-4 | Performance team | High |
| CI/CD | Add riscv64 CI runner (QEMU or self-hosted) + workflow file | 3-5 | Infrastructure + Apache Spark committer | Medium |
| CI/CD | File and pursue SPIP for riscv64 as supported/experimental platform | 1-2 (process) | Spark PMC sponsor | Medium |
| Ecosystem | Continue RISE-funded OpenJDK JIT improvements for RISC-V | Ongoing | RISE / JVM team | High |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Apache Spark GitHub repository](https://github.com/apache/spark)
- [SPARK-53065 -- Comprehensive Tracking of RISC-V Architecture Support](https://issues.apache.org/jira/browse/SPARK-53065)
- [PR #44384 -- Upgrade Netty to 4.1.106.Final (first riscv64 artifact + committer debate)](https://github.com/apache/spark/pull/44384)
- [PR #53382 -- Correctly relocate Netty native libs for YARN ESS (riscv64 io\_uring fix)](https://github.com/apache/spark/pull/53382)
- [PR #51868 -- Split common-utils Java code into new module](https://github.com/apache/spark/pull/51868)
- [PR #48771 -- ZooKeeper 3.9.3 / Netty 4.1.114 follow-up](https://github.com/apache/spark/pull/48771)
- [PR #48810 -- Upgrade netty-tcnative to 2.0.69.Final](https://github.com/apache/spark/pull/48810)
- [lz4-java PR#212 -- Add JNI binding for Linux riscv64](https://github.com/lz4/lz4-java/pull/212)
- [lz4-java issue #209](https://github.com/lz4/lz4-java/issues/209)
- [lz4-java issue #215](https://github.com/lz4/lz4-java/issues/215)
- [Apache Arrow GH-49555 -- riscv64 Python wheel pipeline](https://github.com/apache/arrow/issues/49555)
- [Apache Arrow PR#49556 -- riscv64 wheel pipeline implementation](https://github.com/apache/arrow/pull/49556)
- [Apache ORC PR#2639 -- C++ riscv64 build support](https://github.com/apache/orc/pull/2639)
- [Apache ORC PR#2644 -- Docker/CI riscv64](https://github.com/apache/orc/pull/2644)
- [HADOOP-19849 -- CRC32C riscv64 open issue](https://issues.apache.org/jira/browse/HADOOP-19849)
- [snappy-java PR#396 -- riscv64 native binary (merged 2023)](https://github.com/xerial/snappy-java/pull/396)
- [zstd-jni PR#282 -- riscv64 support (merged 2023)](https://github.com/luben/zstd-jni/pull/282)
- [SPARK-54579 -- NaN / Arrow optimization bug](https://issues.apache.org/jira/browse/SPARK-54579)
- [Gomez-Sanchez et al. 2023, arXiv:2306.15562 -- Spark benchmark on HiFive Unmatched](https://arxiv.org/abs/2306.15562)
- [RISE blog -- OpenJDK SLEEF vectorized math speedup (2025-09-24)](https://riseproject.dev/)
- [RISE blog -- OpenJDK CMoveX and Vectorization (2025-07-23)](https://riseproject.dev/)
- [RISE blog -- Java on RISC-V: Adoptium partnership (2024-05-29)](https://riseproject.dev/)