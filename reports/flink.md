---
title: Apache Flink
categories:
  - data-analytics
---

# Apache Flink

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Apache Flink<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Apache Flink is a distributed stream and batch processing framework, originally developed at TU Berlin and donated to the Apache Software Foundation in 2014. It is a top-level ASF project licensed under Apache License v2.0.

- **Repository:** [apache/flink](https://github.com/apache/flink)
- **Homepage:** [flink.apache.org](https://flink.apache.org/)
- **Language breakdown:** 87.5% Java, 8.0% Scala, 2.8% Python, 0.5% Shell, 0.4% TypeScript. No C, C++, or Assembly.
- **Build system:** Apache Maven 3.8.6+
- **Primary deployment model:** JVM-based distributed cluster (JobManager + TaskManagers)

Flink is architecturally a JVM project. All core runtime logic is JVM bytecode. Architecture-specific behavior surfaces only in optional native subsystems: the RocksDB/ForSt JNI state backend, Netty native transports, and PyFlink Cython extensions.

**Governance:** Standard ASF PMC meritocracy. Key decisions made on the `dev@flink.apache.org` mailing list. Major interface changes require a FLIP (Flink Improvement Proposal) process: DISCUSS thread, then VOTE thread requiring PMC consensus. A pure JVM project adding RISC-V support would not require a FLIP unless it affected public interfaces.

**Corporate sponsors:** Confluent is the dominant PMC presence (Robert Metzger as chair, Timo Walther, Fabian Hueske, Matthias Pohl, Martijn Visser). Alibaba/Ververica holds significant representation (Dian Fu, Jark Wu). Immerok was acquired by Confluent; its engineers are now on the Confluent PMC roster. Apache Flink is not a RISE project member and has no RISE project funding or blog coverage.

---

## 2. Port History and Upstreaming Timeline

The RISC-V porting history for Apache Flink is minimal and concentrated in a single 48-hour window in August 2025, with one earlier abandoned attempt.

**February 2021 -- abandoned attempt**

[PR #14934](https://github.com/apache/flink/pull/14934) was submitted by contributor `advancedwebdeveloper`, proposing to upgrade `os-maven-plugin` from 1.7.0 to address riscv64 build failures. Testing was performed on a SiFive U54-MC based board. The PR CI passed. The PR was silently closed after the automated bot flagged a missing JIRA ID in the title, and the author's follow-up question ("@rmetzger, what's next?") went unanswered. No committer engaged. The fix lay dormant for 4.5 years.

**August 1-2, 2025 -- only landed RISC-V work**

Contributor Gong Xiaofei (GitHub: Felix-Gong) filed [FLINK-38178](https://issues.apache.org/jira/browse/FLINK-38178), an umbrella tracking issue for comprehensive RISC-V support, and immediately filed sub-task [FLINK-38179](https://issues.apache.org/jira/browse/FLINK-38179) covering the same build failure that had blocked the 2021 attempt.

- [PR #26852](https://github.com/apache/flink/pull/26852) was submitted July 31, 2025 and closed August 1, 2025 by the author after committer snuyanzin requested that the title follow Flink's JIRA-prefixed naming convention.
- [PR #26860](https://github.com/apache/flink/pull/26860) was submitted August 1, 2025 and merged August 2, 2025 by Sergey Nuyanzin (snuyanzin). Merge commit: `d0eb9ef97908053a51df6b8e78c9a85ed9dc579b`. Fix version: Flink 2.2.0.

The sole code change: one line in `flink-formats/flink-parquet/pom.xml`, upgrading `kr.motd.maven:os-maven-plugin` from version 1.7.0 to 1.7.1. Testing was performed on an SG2042-based RISC-V board; the contributor reported all tests passed [NEEDS VERIFICATION -- no CI artifact or independent test run log is linked in the PR].

The umbrella issue FLINK-38178 remains open. No further sub-tasks have been filed since August 2025. The remaining scope of FLINK-38178 (CI coverage, documentation, performance optimizations, bug fixes) is entirely unstarted.

**Summary timeline:**

| Date | Event | Status |
|---|---|---|
| Feb 2021 | PR #14934: os-maven-plugin bump, SiFive U54-MC tested | Abandoned, no committer engagement |
| Aug 1, 2025 | FLINK-38178 umbrella filed; FLINK-38179 sub-task filed | Open / Resolved |
| Aug 1, 2025 | PR #26852 submitted | Closed (naming convention) |
| Aug 2, 2025 | PR #26860 merged; FLINK-38179 resolved | Merged into master |
| Dec 4, 2025 | Flink 2.2.0 released, containing the os-maven-plugin fix | Released |
| Jun 2026 | FLINK-38178 umbrella still open; no new sub-tasks | Stalled |

---

## 3. Upstream Support Tier

Apache Flink does not publish a formal platform tier document. There is no `PLATFORMS.md`, `SUPPORT.md`, `OWNERS`, or `CODEOWNERS` file in the repository that enumerates supported architectures or defines tier criteria.

The project's CI runs exclusively on `ubuntu-24.04` (x86_64). arm64 is not tested in CI either. There is no official tier policy to reference.

**De facto tier classification for riscv64:** Below any recognized tier. The architecture is not tested, not released, and not documented. The single merged work item is a build-system fix that prevents an immediate error during compilation -- it does not constitute functional validation.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Flink's architecture has three layers with distinct riscv64 implications.

**Layer 1 -- JVM core (architecture-neutral)**

All Flink runtime code (JobManager, TaskManager, scheduler, checkpoint coordinator, network stack coordination, SQL/Table API) is JVM bytecode. A GitHub file finder search for `riscv` in the `apache/flink` repository returned no matching files. A search for `native` likewise returned zero hits. There are no `.c`, `.cpp`, `.h`, or `.S` files anywhere in the repository tree. This layer runs on any riscv64 JVM without modification.

**Layer 2 -- JNI native subsystems (architecture-specific, critical gap)**

*RocksDB / ForSt state backend:* Flink's `EmbeddedRocksDBStateBackend` depends on `com.ververica:frocksdbjni:8.10.0-ververica-1.0` and `com.ververica:forstjni:0.1.8`. These are fat JARs bundling pre-compiled `.so` files for: linux-x86_64, linux-aarch64 (glibc and musl), macOS x86_64, macOS arm64, and Windows x64. The upstream source repository (ververica/ForSt) has no riscv64 build targets -- a file finder search for `riscv` returns no results. No riscv64 `.so` is bundled. At runtime on riscv64, loading this backend triggers `UnsatisfiedLinkError`. The only fallback is `HashMapStateBackend`, which is heap-resident and does not support incremental checkpointing or memory-managed state.

*Netty native transport:* Flink uses `flink-shaded-netty` (Netty 4.2.x). Netty's native epoll and io_uring transports bundle x86_64 and aarch64 `.so` files; riscv64 native transport does not exist as a published artifact upstream as of mid-2026. Flink falls back automatically to NIO (pure Java) when native transport is unavailable. This is a performance degradation, not a functional failure.

*Netty tcnative:* `flink-shaded-netty-tcnative-dynamic` (test scope) provides BoringSSL JNI for TLS offload. No riscv64 artifact exists. Flink falls back to JDK JSSE. Test-scope only; not a runtime blocker.

**Layer 3 -- Python native extensions (architecture-specific, partial gap)**

PyFlink (`flink-python`) includes 7 Cython `.pyx` extensions. These contain no hand-written SIMD or architecture guards -- they are portable Cython that compiles to C and then to native code for the host architecture. PyPI wheels exist only for x86_64 Linux and macOS arm64. No riscv64 wheel is published. On riscv64, pip attempts a source build (requires Cython to be installed); if Cython is unavailable, execution falls back to pure Python.

---

## 5. Build System, Cross-Compilation, and Toolchain

Apache Flink is a Maven-only project. There is no CMake, no Makefile, no Cargo.toml, no go.mod, no cross-compilation toolchain files, no `cmake/riscv64.cmake`, no `Dockerfile.riscv64`, and no QEMU usage in the build pipeline (QEMU is used only in Docker image publishing, and only for amd64/arm64 targets).

**The riscv64 build-system fix (FLINK-38179):**

The `flink-parquet` submodule uses `protobuf-maven-plugin`, which relies on `${os.detected.classifier}` (injected by `os-maven-plugin`) to download the correct pre-built `protoc` binary from Maven Central. Before Flink 2.2.0, `os-maven-plugin` 1.7.0 produced `"os.detected.arch: unknown"` and `"org.apache.maven.MavenExecutionException: unknown os.arch: riscv"` on riscv64 hosts, aborting the build. The upgrade to `os-maven-plugin` 1.7.1 in PR #26860 resolves this detection failure.

However, the fix surfaces a secondary blocker: with riscv64 now correctly detected, `os.detected.classifier` resolves to `linux-riscv64`, and `protobuf-maven-plugin` attempts to download `com.google.protobuf:protoc:linux-riscv64` from Maven Central. No such binary artifact exists on Maven Central ([protocolbuffers/protobuf#17798](https://github.com/protocolbuffers/protobuf/issues/17798), open, untriaged as of mid-2026). A full `mvn compile` on a riscv64 host therefore still fails at the protoc download step unless `protoc` is pre-installed to the system `PATH` and the Maven plugin is configured to use it.

**Standard build commands (for reference on riscv64 with protoc pre-installed):**

```
mvn clean install -DskipTests
mvn clean install -DskipTests -Dfast -Pskip-webui-build -T 1C
```

**Docker images:** Official `apache/flink` images on Docker Hub target `linux/amd64` and `linux/arm64/v8` only. The `flink-docker` build pipeline uses `docker/setup-qemu-action` + `docker/setup-buildx-action` with a bake file listing only `"linux/amd64"` and `"linux/arm64/v8"`. The CI build image (`apache/flink-ci-docker:java_8_11_17_21_25_maven_386_jammy`) is `linux/amd64` only. No riscv64 Docker image exists.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| JVM core runtime | Full | Full | Full | None |
| RocksDB/ForSt JNI state backend | Full | Full | Missing (UnsatisfiedLinkError) | Critical |
| ForSt JNI state backend | Full | Full | Missing | Critical |
| Maven build (os-maven-plugin) | Full | Full | Fixed in 2.2.0 | Fixed |
| Maven build (protoc binary) | Full | Full | Missing on Maven Central | Build blocker |
| Netty native epoll/io_uring | Full | Full | Missing (NIO fallback) | Performance |
| Netty tcnative / BoringSSL | Full | Full | Missing (JSSE fallback) | Minor |
| PyFlink wheels on PyPI | Full | Partial (macOS only) | Missing (source-buildable) | Gap |
| LZ4 JNI compression | Full | Full | Missing (pure-Java fallback; repo archived) | Performance |
| Conscrypt TLS provider | Full | Full | Missing (JSSE fallback) | Minor |
| Official Docker image | Full | Full | Missing | Gap |
| CI test coverage | Full | None | None | Missing |
| HDFS connector (Hadoop 2.10.2) | Full | Full | Pre-dates riscv64 work | Gap (use Hadoop 3.5.0+) |
| Published benchmarks | Exists | Exists | None | Data not available |

**RocksDB/ForSt JNI gap -- operational impact:** Stateful Flink applications using `EmbeddedRocksDBStateBackend` (the default for production large-state workloads) will fail at runtime on riscv64 with `UnsatisfiedLinkError`. The fallback `HashMapStateBackend` holds all state in JVM heap, which is functionally incompatible with large-state streaming jobs. This is the single most impactful gap for production use.

**LZ4 gap -- operational impact:** The `lz4-java` library's riscv64 JNI binding was never released. [PR #212](https://github.com/lz4/lz4-java/pull/212) was submitted to add riscv64 support but was never reviewed or merged. The repository was archived on December 2, 2025 and is now read-only; there is no upstream path to land this fix. Flink's LZ4 shuffle compression falls back to the pure-Java implementation, which carries an estimated 3-5x throughput penalty [NEEDS VERIFICATION -- no benchmark cited in research findings; figure is from the research synthesis, not a primary source].

**Protoc build blocker -- developer impact:** The riscv64 `protoc` binary does not exist on Maven Central. Building Flink from source on a riscv64 host requires installing a system `protoc` and configuring the Maven plugin to use it, or cross-building. This is a non-trivial barrier for contributors working natively on riscv64 hardware.

---

## 7. CI/CD Infrastructure

**Current state: zero riscv64 test coverage.**

All Apache Flink CI runs on `ubuntu-24.04` (x86_64) GitHub Actions runners using the `apache/flink-ci-docker:java_8_11_17_21_25_maven_386_jammy` Docker image. The following workflow files were inspected directly from the `apache/flink` master branch and confirmed to contain zero references to "riscv":

- `.github/workflows/ci.yml` (49 lines)
- `.github/workflows/template.flink-ci.yml` (448 lines)
- `.github/workflows/template.pre-compile-checks.yml` (77 lines)
- `.github/workflows/nightly.yml` (127 lines)
- `.github/workflows/nightly-trigger.yml`
- `.github/workflows/community-review.yml`
- `.github/workflows/stale.yml`
- `.github/workflows/docs.yml`
- `.github/workflows/docs-legacy.yml`

The `nightly.yml` workflow builds PyFlink wheels using `cibuildwheel`. No `CIBW_ARCHS` override is set, meaning cibuildwheel targets only the default x86_64 on `ubuntu-latest`. No QEMU setup step exists in this workflow. No riscv64 wheel is produced.

`.gitlab-ci.yml`, `.cirrus.yml`, and `Jenkinsfile` do not exist in the repository (HTTP 404 for all three).

No self-hosted riscv64 runners are registered. No QEMU-based emulation targets riscv64 anywhere in the CI configuration.

**Consequence:** Every merged change, including the os-maven-plugin fix in PR #26860, goes unvalidated on riscv64 hardware in upstream CI. The contributor's manual test on an SG2042 board is the only validation record.

---

## 8. Distribution and Release Status

**Primary Flink distribution (JVM tarballs via ASF mirrors):**

Apache Flink publishes zero GitHub Releases. All releases are distributed as JVM bytecode tarballs (e.g., `flink-2.2.1-bin-scala_2.12.tgz`) via Apache Software Foundation mirrors. JVM bytecode is architecture-neutral and runs on any riscv64 JVM. However, as documented in Section 6, the embedded native libraries within these tarballs (RocksDB/ForSt JNI) do not include riscv64 binaries.

**PyPI -- `apache-flink`:**

The latest release (2.3.0) publishes 13 files to PyPI. All were enumerated from the PyPI JSON API. The complete list covers: `cp39/cp310/cp311/cp312` x `macosx_10_9_x86_64`, `macosx_11_0_arm64`, `manylinux_*_x86_64`, plus one source `.tar.gz`. No file contains "riscv64". Linux wheels are published for x86_64 only.

**Ubuntu Noble (24.04):** Apache Flink is not packaged. The Ubuntu Noble package search for "flink" returns only `cufflinks` (bioinformatics) and `python3-reflink` (filesystem). Apache Flink does not exist as an Ubuntu package under any architecture.

**Debian:** [tracker.debian.org/pkg/apache-flink](https://tracker.debian.org/pkg/apache-flink) returns HTTP 404. Apache Flink is not packaged in Debian.

**Arch Linux RISC-V:** Apache Flink does not appear in the Arch RISC-V port status page (`archriscv.felixc.at`).

**Docker Hub (`apache/flink`):** Images for Flink 2.0.x, 2.1.x, 2.2.x are published with Java 11/17/21 variants. Architectures: `linux/amd64`, `linux/arm64/v8` only. No `linux/riscv64` manifest exists.

**RISE wheel builder:** The RISE project GitLab wheel builder ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)) does not list `apache-flink`. The GitLab PyPI endpoint for apache-flink redirects (HTTP 302) to PyPI, returning the same x86_64-only results.

---

## 9. Dependencies

The following table covers dependencies with JIT backends, SIMD paths, native code, JNI bindings, compression, crypto, or memory allocation.

| Dependency | Role | riscv64 Build | riscv64 Release | Blocking Issues |
|---|---|---|---|---|
| OpenJDK (JVM runtime) | Required to run all Flink code | Builds (cross-compile CI only; no full HotSpot CI job on riscv64) | Temurin 21/17/11 available from Adoptium; not Tier 1 | C2 JIT missing several intrinsics; no riscv64 jtreg CI. See [runtimes/openjdk.md](../runtimes/openjdk.md) |
| snappy-java 1.1.10.7 | Snappy compression for state/shuffle | riscv64 native `.so` bundled since 1.1.10.0 (PR #396, merged 2023) | riscv64 artifact present in releases >= 1.1.10.0; Flink uses 1.1.10.7 | None. Fully supported. |
| lz4-java (archived) | LZ4 compression for shuffle and state | riscv64 JNI binding never released; [PR #212](https://github.com/lz4/lz4-java/pull/212) open and unreviewed | No riscv64 release; repository archived December 2, 2025 (read-only) | **Permanent gap:** repo archived, no path to merge PR #212. Pure-Java fallback exists but with significant performance penalty. |
| Netty 4.2.13.Final | Network transport (RPC, checkpointing, REST) | riscv64 native epoll + io_uring built and shipped since 4.1.103.Final (PR #13670, merged Dec 2023) | riscv64 epoll + io_uring artifacts present in releases >= 4.1.103.Final | No open blocking issues for epoll/io_uring. tcnative (TLS) has no riscv64 artifact (see below). |
| netty-tcnative (test scope) | TLS offload via BoringSSL | Not built for riscv64 | No riscv64 artifact; no issues or PRs filed | Test scope only; JSSE fallback is functional. Not a runtime blocker. |
| frocksdbjni 8.10.0-ververica-1.0 | RocksDB state backend JNI | Not built for riscv64; no riscv64 targets in CircleCI build config | No riscv64 artifact published | **Runtime blocker for EmbeddedRocksDBStateBackend:** UnsatisfiedLinkError on riscv64. Must fall back to HashMapStateBackend. |
| forstjni 0.1.8 | ForSt state backend JNI | Not built for riscv64; same ververica/ForSt source; file finder search for riscv returns no results | No riscv64 artifact published | **Runtime blocker for ForSt state backend:** same as frocksdbjni. |
| Apache Arrow 19.0.0 (arrow-vector, arrow-memory-netty) | Python/Flink data exchange; flink-python Arrow-based batch | Arrow Java is JVM bytecode (architecture-neutral). Arrow C++ builds on riscv64 but has riscv64 test failures ([PR #49556](https://github.com/apache/arrow/pull/49556), open draft). | Arrow Java JARs are architecture-neutral; run on any JVM. No riscv64 PyArrow wheel on PyPI. | PyArrow wheel gap affects flink-python users; must build from source (~1 hour). Arrow C++ test failures on riscv64 (PR #49556 open). |
| protoc 4.32.1 (build-time) | Proto code generation at build time | No pre-built riscv64 protoc binary on Maven Central ([protocolbuffers/protobuf#17798](https://github.com/protocolbuffers/protobuf/issues/17798), open, untriaged) | No riscv64 protoc binary on Maven Central | **Build blocker:** `mvn compile` on riscv64 fails at protoc download unless protoc is pre-installed to PATH. |
| os-maven-plugin 1.7.1 | Maven build-time arch/OS detection | Correctly maps riscv64 as of 1.7.1; Flink upgraded in PR #26860 (Flink 2.2.0) | 1.7.1 released; Flink uses it | Was broken before Flink 2.2.0. Fixed. |
| Apache Hadoop 2.10.2 (provided scope) | HDFS file system connector | Hadoop 2.10.2 predates all riscv64 work | No riscv64 artifacts for 2.10.2 | Users requiring HDFS must use Hadoop 3.5.0+ (unreleased as of research). ISA-L erasure coding degrades to Java fallback. See [data-analytics/hadoop.md](../data-analytics/hadoop.md) |
| Apache Parquet (parquet-hadoop, parquet-avro) | Columnar format read/write | Java-only | Architecture-neutral JARs | None. Pure Java. |
| Apache Avro 1.11.5 | Schema-based serialization | Java-only | Architecture-neutral JARs | None. |
| Conscrypt 2.5.1 (runtime scope in flink-python) | Alternate TLS/crypto provider | No riscv64 support; latest release added linux-aarch64 (2.6-alpha3); riscv64 not mentioned; zero issues or PRs filed in google/conscrypt for riscv64 | No riscv64 artifact | Runtime scope; JSSE fallback is functional. |
| Byte Buddy 1.17.6 | Runtime bytecode generation for serializers | JVM bytecode only, ASM-based, no native code | Architecture-neutral | None. |
| Janino (flink-table-runtime) | Runtime Java compilation for SQL codegen | JVM bytecode only | Architecture-neutral | None. |
| Kryo 5.6.2 | Fallback Java object serialization | JVM bytecode only (uses Unsafe; no arch-specific path) | Architecture-neutral | None. |
| ZooKeeper (flink-shaded-zookeeper-3:3.7.2) | Leader election, HA coordination | Java-only | Architecture-neutral | None. |

**Blocking issues summary:**

| Severity | Dependency | Issue |
|---|---|---|
| Build blocker | protoc 4.32.1 | No riscv64 binary on Maven Central; [#17798](https://github.com/protocolbuffers/protobuf/issues/17798) open, untriaged |
| Runtime blocker | frocksdbjni / forstjni | No riscv64 `.so`; EmbeddedRocksDBStateBackend and ForSt backend unusable on riscv64 |
| Permanent performance gap | lz4-java | PR #212 unmerged; repo archived Dec 2025; no upstream resolution path |
| TLS performance gap | netty-tcnative | No riscv64 BoringSSL JNI; falls back to JSSE |
| HDFS compatibility | Hadoop 2.10.2 | Predates riscv64 work; HDFS users must use Hadoop 3.5.0+ |
| PyFlink gap | PyArrow | No riscv64 wheel; source build required (~1 hour); Arrow C++ has riscv64 test failures |

---

## 10. Ecosystem Status

**RISE project:** Apache Flink is not a RISE project member. All 27 published RISE blog posts (May 2024 through June 2026) were examined; none mention Apache Flink. The RISE wheel builder does not list apache-flink among its riscv64 wheel packages. No RISE funding or engineering engagement with the Flink project exists in the public record.

**RISE member companies and Flink PMC overlap:** Alibaba (DAMO Academy is a RISE Premier Member) has engineers on the Flink PMC (Dian Fu, Jark Wu) and in the contributor base. However, no riscv64-specific contributions from Alibaba/DAMO Academy have appeared in the Flink repository.

**Contributor activity:** The entire riscv64 work in the Flink repository originates from a single contributor, Gong Xiaofei (Felix-Gong). No committer or PMC member has self-assigned to riscv64 work beyond the single review/merge of PR #26860 by Sergey Nuyanzin.

**Broader RISC-V ecosystem:** Netty native epoll/io_uring for riscv64 was added in Netty 4.1.103.Final (merged December 2023), which is relevant to Flink's network transport layer. snappy-java has full riscv64 support since 1.1.10.0 (2023). The lz4-java gap is permanent due to archival. The critical ververica/ForSt JNI gap has no current upstream activity.

**Hardware tested:** The only documented Flink-on-riscv64 validation was performed on an SG2042-based board (SpacemiT/Sophon SG2042, a 64-core RISC-V server processor) by the contributor in August 2025. No independent validation exists.

---

## 11. Known Bugs and Active Issues

**RISC-V-specific issues:**

[FLINK-38178](https://issues.apache.org/jira/browse/FLINK-38178) -- "RISC-V Architecture Support in Apache Flink" (umbrella)
- Status: Open, unresolved, no fix version, no assignee, no comments
- Created: August 1, 2025 by Gong Xiaofei
- Scope: (1) platform-specific optimizations/compatibility, (2) post-implementation bug fixes, (3) test/CI coverage for RISC-V, (4) documentation updates
- Sub-tasks: FLINK-38179 (resolved); all other sub-areas have zero sub-tasks filed
- Assessment: The umbrella has been dormant since August 2025. With no new sub-tasks, no assignee, and no committer engagement, it is a placeholder, not an active workstream.

[FLINK-38179](https://issues.apache.org/jira/browse/FLINK-38179) -- "Build Failure Due to os-maven-plugin Missing Support"
- Status: Resolved, Fix Version 2.2.0
- Root cause: `os-maven-plugin` 1.7.0 did not recognize `riscv64`; error: `"os.detected.arch: unknown"` / `"org.apache.maven.MavenExecutionException: unknown os.arch: riscv"`
- Fix: os-maven-plugin upgraded to 1.7.1 in `flink-formats/flink-parquet/pom.xml`

**Earlier RISC-V-adjacent issue:**

[FLINK-21139](https://issues.apache.org/jira/browse/FLINK-21139) -- "ThresholdMeterTest.testMarkMultipleEvents unstable"
- Status: Fixed in Flink 1.13.0 (February 2021)
- First reported from a riscv64 environment (SiFive Rocket, Debian, OpenJ9 JVM with JIT disabled)
- Root cause was general test timing flakiness, not riscv64-specific. Fixed as a general correctness issue.

**Active correctness bug (cross-platform, relevant to riscv64 workloads):**

[FLINK-39677](https://issues.apache.org/jira/browse/FLINK-39677) -- "ARRAY_SORT Comparator Contract Violation"
- Status: Open, Major priority
- Affected versions: 1.20.4, 2.0.2, 2.1.2, 2.2.1, 2.3.0
- Root cause: `ArraySortComparator.compare` violates the Java `Comparator` antisymmetry contract -- both `compare(a,b)` and `compare(b,a)` return -1 for equal elements. TimSort throws `"Comparison method violates its general contract!"` on arrays of 32 or more elements containing duplicates.
- Relevance to riscv64: NaN and floating-point comparisons trigger this pattern (NaN comparisons are never equal under `>`), making this a correctness hazard for any floating-point analytical workload. Applies equally to riscv64.
- Open PRs: [#28155](https://github.com/apache/flink/pull/28155), [#28159](https://github.com/apache/flink/pull/28159)
- Reported: May 13, 2026

**Published RISC-V benchmarks:** Data not available. No throughput, latency, or comparative performance figures for Apache Flink on riscv64 exist in any public source -- not on the Flink blog, the RISE blog, Apache JIRA, or GitHub as of mid-2026.

---

## 12. Objections and Upstream Blockers

**Objection: "The build fix is already merged; Flink 2.2.0 supports riscv64."**

Refuted. The merged change (PR #26860) is a one-line `pom.xml` version bump for a Maven plugin. It removes one build-time error while immediately exposing a second build-time error (missing `protoc` binary for riscv64 on Maven Central). It does not validate that any native component compiles or passes tests on riscv64. No CI validates riscv64. The RocksDB/ForSt JNI state backend -- the component that distinguishes production stateful Flink from a prototype -- has no riscv64 native library and fails with `UnsatisfiedLinkError` on any riscv64 host. Characterizing Flink 2.2.0 as "supporting riscv64" overstates the situation by a significant margin.

**Blocker 1 -- frocksdbjni / forstjni (no riscv64 build):**

This is controlled by Ververica (Alibaba subsidiary). The build pipeline is CircleCI-based and enumerates its targets explicitly. riscv64 is absent. Adding riscv64 requires Ververica to allocate engineering time, a riscv64 build environment, and a CI runner. This is an external dependency that Flink contributors cannot resolve unilaterally. No riscv64 request or issue has been filed against the ververica/ForSt repository.

**Blocker 2 -- protoc riscv64 binary on Maven Central:**

[protocolbuffers/protobuf#17798](https://github.com/protocolbuffers/protobuf/issues/17798) is open and untriaged as of mid-2026. This is a Google-owned project. The Flink community has no leverage here. The workaround (pre-install protoc to PATH) is documented in principle but not in Flink's official build documentation.

**Blocker 3 -- lz4-java (permanently archived):**

The `lz4/lz4-java` repository was archived December 2, 2025. It is read-only. [PR #212](https://github.com/lz4/lz4-java/pull/212) adding riscv64 support is permanently unmerged with no path forward. The pure-Java LZ4 fallback is the only available option. Flink would need to either fork lz4-java, vendor the native code, or replace the dependency.

**Blocker 4 -- no riscv64 CI:**

Without CI, no regression guarantee exists for any future Flink change on riscv64. Every merge risks silent breakage. Adding riscv64 CI requires either QEMU-based emulation (slow, typically 10-20x for integer workloads) or access to physical riscv64 hardware or hosted CI (e.g., Scaleway, RISE Enablement WG resources). Neither option has been proposed or funded within the Flink project.

**Blocker 5 -- single-contributor ownership:**

All riscv64 work originates from one external contributor (Gong Xiaofei) with no PMC sponsor, no committer assigned, and no corporate backer identified in the public record. The umbrella FLINK-38178 has received zero engagement since its creation in August 2025. The project has no organizational commitment to riscv64 support.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The highest-priority gap for functional riscv64 support is the RocksDB/ForSt JNI state backend. Production stateful streaming jobs (exactly-once, large state, incremental checkpoints) require this component. Without it, Flink on riscv64 is limited to stateless or small-state workloads using heap-based state.

The ForSt/RocksDB JNI fix requires:
- An riscv64 build environment with C++ toolchain targeting riscv64
- CMake configuration within the RocksDB build system for riscv64 (RocksDB upstream supports riscv64 in source; ververica's fork inherits this)
- Adding riscv64 as a CI target in the ververica/ForSt CircleCI pipeline
- Publishing the fat JAR with the riscv64 `.so` included
- This work must be done by or in coordination with Ververica; it cannot be done unilaterally within the apache/flink repository

Separately, the protoc build blocker requires either contributing a riscv64 `protoc` binary to Maven Central (upstream in protocolbuffers/protobuf) or documenting and automating the PATH-based workaround in Flink's build docs. The former is a multi-month effort requiring Google engagement; the latter is a 1-2 day documentation task.

### 13.2 Performance Optimization

Flink's JVM core has no SIMD or architecture-specific code paths. Performance optimization on riscv64 is entirely a function of:
1. JVM quality (HotSpot C2 JIT, intrinsics) -- upstream OpenJDK, not Flink
2. Native library performance (RocksDB, Netty epoll) -- upstream dependencies, not Flink
3. Memory allocation patterns (off-heap via Netty; on-heap via JVM)

There is no Flink-specific SIMD or RVV optimization work to be done within the apache/flink repository. Any RISC-V performance investment for Flink flows through OpenJDK and the native dependency layer.

The lz4-java archival creates a permanent ~3-5x LZ4 compression throughput gap [NEEDS VERIFICATION -- no primary source benchmark found]. The practical mitigation is using Snappy (fully supported on riscv64) instead of LZ4 for shuffle and state compression, at the cost of slightly lower compression ratios.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI to Flink requires:
- A GitHub Actions runner with riscv64 capability, or QEMU-based emulation on existing ubuntu-24.04 runners
- A Flink CI Docker image built for `linux/riscv64` (requires adding riscv64 to `flink-docker` bake file)
- A new CI workflow job (or extension of `template.flink-ci.yml`) that runs the Flink test suite on riscv64
- Significant compute time: Flink's full test suite is multi-hour on x86_64; QEMU emulation would multiply this by 10-20x

RISE Enablement WG has infrastructure (Scaleway riscv64 instances) that has been used for other Java projects (OpenJDK). Engagement with RISE to add Flink to that infrastructure is a plausible path, but requires RISE buy-in and a Flink committer willing to maintain the CI configuration.

### 13.4 Ecosystem Enablement

- **PyFlink riscv64 wheel:** Requires adding riscv64 to the `nightly.yml` `cibuildwheel` configuration and providing a QEMU setup step. This is a moderate effort (1-2 weeks) and requires PyArrow riscv64 wheel availability as a prerequisite, which itself is blocked by the Arrow C++ riscv64 test failures ([PR #49556](https://github.com/apache/arrow/pull/49556), open draft).
- **Official Docker image:** Requires adding `linux/riscv64` to the `flink-docker` bake file and a base JDK image for riscv64. Eclipse Temurin riscv64 images exist for JDK 17/21. This is a low effort (1-2 days) configuration change, contingent on the RocksDB JNI gap being resolved (otherwise the image is incomplete).
- **Documentation:** FLINK-38178 scope item 4. Low effort (1-2 days) once the functional gaps are resolved.
- **HDFS connector:** Users with HDFS must use Hadoop 3.5.0+. Flink should document this requirement. Low effort.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | RocksDB/ForSt JNI riscv64 build (frocksdbjni/forstjni) | 4-8 | Ververica (external) | Critical |
| Functional | protoc riscv64 binary on Maven Central | 8-16 | Google/protocolbuffers (external) | High |
| Functional | Workaround: document PATH-based protoc on riscv64 in Flink build docs | 0.25 | Flink contributor | High |
| Functional | lz4-java replacement or fork for riscv64 JNI | 4-6 | TBD (lz4-java archived) | Medium |
| Functional | Document HashMapStateBackend fallback and Snappy-vs-LZ4 tradeoffs for riscv64 | 0.5 | Flink contributor | Medium |
| CI/CD | riscv64 CI runner integration (RISE Scaleway or QEMU) | 3-5 | Flink committer + RISE WG | High |
| CI/CD | riscv64 CI Docker image for `apache/flink-ci-docker` | 1-2 | Flink committer | High |
| CI/CD | File riscv64 CI sub-task under FLINK-38178 and drive to completion | 0.5 | Flink contributor | High |
| Ecosystem | PyFlink riscv64 wheel (cibuildwheel + QEMU) | 2-3 | Flink contributor; blocked on PyArrow | Medium |
| Ecosystem | Official `apache/flink` Docker image for linux/riscv64 | 0.5 | Flink committer | Medium |
| Ecosystem | Hadoop 3.5.0+ compatibility documentation for HDFS on riscv64 | 0.25 | Flink contributor | Low |
| Performance | JVM JIT/intrinsics improvement for riscv64 | N/A (OpenJDK scope) | OpenJDK upstream | N/A |
| Performance | Netty native epoll for riscv64 (epoll already available from 4.1.103.Final) | 0 (already merged upstream) | None | Done |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [FLINK-38178 -- RISC-V Architecture Support umbrella (JIRA)](https://issues.apache.org/jira/browse/FLINK-38178)
- [FLINK-38179 -- Build Failure: os-maven-plugin Missing riscv64 Support (JIRA)](https://issues.apache.org/jira/browse/FLINK-38179)
- [FLINK-21139 -- ThresholdMeterTest unstable (JIRA)](https://issues.apache.org/jira/browse/FLINK-21139)
- [FLINK-39677 -- ARRAY_SORT Comparator Contract Violation (JIRA)](https://issues.apache.org/jira/browse/FLINK-39677)
- [PR #26860 -- os-maven-plugin upgrade for riscv64 (merged)](https://github.com/apache/flink/pull/26860)
- [PR #26852 -- os-maven-plugin upgrade for riscv64 (closed, superseded)](https://github.com/apache/flink/pull/26852)
- [PR #14934 -- os-maven-plugin upgrade for riscv64 (abandoned 2021)](https://github.com/apache/flink/pull/14934)
- [protocolbuffers/protobuf#17798 -- riscv64 protoc binary missing on Maven Central](https://github.com/protocolbuffers/protobuf/issues/17798)
- [lz4/lz4-java#212 -- riscv64 JNI support (unmerged; repo archived)](https://github.com/lz4/lz4-java/pull/212)
- [apache/arrow PR #49556 -- Arrow C++ riscv64 test failures (open draft)](https://github.com/apache/arrow/pull/49556)
- [apache/flink on Docker Hub](https://hub.docker.com/r/apache/flink/tags)
- [apache/flink-docker repository](https://github.com/apache/flink-docker)
- [PyPI apache-flink package](https://pypi.org/project/apache-flink/)
- [RISE project blog](https://riseproject.dev/blog/)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [runtimes/openjdk.md](../runtimes/openjdk.md)
- [data-analytics/hadoop.md](../data-analytics/hadoop.md)