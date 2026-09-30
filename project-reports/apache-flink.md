---
title: Apache Flink
parent: Project Reports
color: orange
dependencies:
  - name: OpenJDK
    relation: runtime-dependency
    criticality: critical
  - name: snappy-java
    relation: runtime-dependency
    criticality: optional
  - name: lz4-java
    relation: runtime-dependency
    criticality: optional
  - name: Netty
    relation: runtime-dependency
    criticality: critical
  - name: netty-tcnative
    relation: test-dependency
    criticality: optional
  - name: frocksdbjni
    relation: runtime-dependency
    criticality: critical
  - name: forstjni
    relation: runtime-dependency
    criticality: critical
  - name: Apache Arrow
    relation: runtime-dependency
    criticality: optional
  - name: Protocol Buffers
    relation: build-dependency
    criticality: critical
  - name: os-maven-plugin
    relation: build-dependency
    criticality: critical
  - name: Apache Hadoop
    relation: runtime-dependency
    criticality: optional
  - name: Apache Parquet
    relation: runtime-dependency
    criticality: optional
  - name: Apache Avro
    relation: runtime-dependency
    criticality: optional
  - name: Conscrypt
    relation: runtime-dependency
    criticality: optional
  - name: Byte Buddy
    relation: runtime-dependency
    criticality: optional
  - name: Janino
    relation: runtime-dependency
    criticality: optional
  - name: Kryo
    relation: runtime-dependency
    criticality: optional
  - name: ZooKeeper
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="apache-flink" %}

# Apache Flink

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Apache Flink<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Apache Flink is a distributed stream and batch processing framework, originally developed at TU Berlin and donated to the Apache Software Foundation in 2014. It is a top-level ASF project licensed under Apache License v2.0.

- **Repository:** [apache/flink](https://github.com/apache/flink)
- **Homepage:** [flink.apache.org](https://flink.apache.org/)
- **Language breakdown:** 87.5% Java, 8.0% Scala, 2.8% Python, 0.5% Shell, 0.4% TypeScript. No C, C++, or Assembly.
- **Build system:** Apache Maven 3.8.6+
- **Primary deployment model:** JVM-based distributed cluster (JobManager + TaskManagers)

Flink is architecturally a JVM project. All core runtime logic is JVM bytecode. Architecture-specific behavior surfaces only in optional native subsystems: the RocksDB/ForSt JNI state backend, Netty native transports, and PyFlink Cython extensions.

**Governance:** Standard ASF PMC meritocracy. Key decisions are made on the `dev@flink.apache.org` mailing list. Major interface changes require a FLIP (Flink Improvement Proposal) process: a DISCUSS thread, then a VOTE thread requiring PMC consensus. A pure JVM project adding RISC-V support would not require a FLIP unless it affected public interfaces.

**Corporate sponsors:** Confluent is the dominant PMC presence (Robert Metzger as chair, Timo Walther, Fabian Hueske, Matthias Pohl, Martijn Visser). Alibaba/Ververica holds significant representation (Dian Fu, Jark Wu). Immerok was acquired by Confluent; its engineers are now on the Confluent PMC roster.

**RISE Project relationship:** Apache Flink is not a RISE member project. All 33 published RISE blog posts (2024-05-15 through 2026-09-28, checked via the site's own WordPress sitemap and its `?s=flink` search, which returned "Sorry, no results were found") were examined; none mention Apache Flink. The RISE RISC-V Runners adoption list (as of the 2026-05-12 "six weeks in" post; 20 adopting projects: llama.cpp, PyTorch, k0s, Kairos, k3s, Kubernetes, containerd, mldsa-native, mlkem-native, NumPy, zvec, kubetail, Home Assistant, DuckDB, armbian/os, wazero, pyca/cryptography, Portable-Network-Archive, mullvadvpn-app-riscv, uiua) does not include Flink. The `riseproject-dev` GitHub organization (26 repositories enumerated) has no Flink-related repository, and RISE's funded working-group projects (Rust, LLVM/SPEC, OpenSBI, IREE, Go, V8) do not include a JVM/stream-processing workstream. No RISE funding or engineering engagement with the Flink project exists in the public record. Alibaba/DAMO Academy, a RISE Premier Member, has PMC representation on Flink (Dian Fu, Jark Wu), but no riscv64-specific contribution from that affiliation has appeared in the Flink repository.

---

## 2. Port History and Upstreaming Timeline

Flink's riscv64 porting history consists of two merged `os-maven-plugin` fixes, four years apart, plus one open dependency bump with riscv64 implications.

**February 2021 - first merged riscv64 fix**

[PR #14934](https://github.com/apache/flink/pull/14934) was submitted by contributor `advancedwebdeveloper` on 2021-02-12, proposing to upgrade `os-maven-plugin` in `flink-formats/flink-parquet/pom.xml` from 1.5.0.Final to 1.7.0 to address riscv64 build failures. The author reported testing on a SiFive U54-MC based board, and Azure CI passed (build `e4195e8`, SUCCESS). After the author's follow-up question ("@rmetzger, what's next?") on 2021-02-23, committer Robert Metzger (`rmetzger`) reviewed and approved it the next day ("Thanks a lot for your contribution. The change looks good, I'll merge it.") and merged it as commit [`808cae6`](https://github.com/apache/flink/commit/808cae68f6ecd6af67c76293d8c5d5b3d6084804) on 2021-02-24. Flink commonly merges via direct push rather than GitHub's merge button, which is why this PR's page badge shows "Closed" rather than "Merged" - the commit is confirmed present on every release tag from `release-1.13.0` onward, so it first shipped in **Flink 1.13.0** (2021-05-03).

**August 2025 - follow-up fix for a residual detection gap**

Contributor Gong Xiaofei (GitHub: `Felix-Gong`) filed [FLINK-38178](https://issues.apache.org/jira/browse/FLINK-38178), an umbrella tracking issue for comprehensive RISC-V support, and sub-task [FLINK-38179](https://issues.apache.org/jira/browse/FLINK-38179) covering a residual riscv64-detection gap left in `os-maven-plugin` 1.7.0.

- [PR #26852](https://github.com/apache/flink/pull/26852) was submitted 2025-07-31 and closed 2025-08-01 after committer `snuyanzin` requested the title follow Flink's `[FLINK-xxxxx]` naming convention.
- [PR #26860](https://github.com/apache/flink/pull/26860) was submitted 2025-08-01 and merged 2025-08-02 by Sergey Nuyanzin (merge commit `d0eb9ef97908053a51df6b8e78c9a85ed9dc579b`, Fix Version 2.2.0). The change: one line in `flink-formats/flink-parquet/pom.xml`, `os-maven-plugin` 1.7.0 to 1.7.1. The author reported testing on an SG2042-based board [NEEDS VERIFICATION - no CI artifact validates riscv64; testing claim is contributor-attested only].

**2026 - dependency-driven riscv64 opportunity (unmerged)**

[PR #28820](https://github.com/apache/flink/pull/28820), an automated Dependabot bump of `at.yawk.lz4:lz4-java` from 1.10.3 to 1.11.1, was opened 2026-07-25. It is not itself a RISC-V-motivated PR (it targets CVE-2026-59949), but the target version carries a `linux-riscv64` native binary, first added in the fork's 1.11.0 release. As of 2026-09-30 the PR is open, unreviewed, and its Azure CI run is reported failing.

The umbrella issue FLINK-38178 remains open with no new sub-tasks filed since August 2025.

**Summary timeline:**

| Date | Event | Source |
|---|---|---|
| 2021-02-24 | PR #14934 merged by rmetzger: os-maven-plugin 1.5.0.Final -> 1.7.0, tested on SiFive U54-MC | [PR #14934](https://github.com/apache/flink/pull/14934) |
| 2021-05-03 | Flink 1.13.0 released, containing the first os-maven-plugin riscv64 fix | Release tags |
| 2025-08-01 | FLINK-38178 umbrella filed; FLINK-38179 sub-task filed | [FLINK-38178](https://issues.apache.org/jira/browse/FLINK-38178) |
| 2025-08-01 | PR #26852 submitted, closed same day (naming convention) | [PR #26852](https://github.com/apache/flink/pull/26852) |
| 2025-08-02 | PR #26860 merged; FLINK-38179 resolved: os-maven-plugin 1.7.0 -> 1.7.1 | [PR #26860](https://github.com/apache/flink/pull/26860) |
| 2025-12-04 [NEEDS VERIFICATION] | Flink 2.2.0 released, containing the follow-up os-maven-plugin fix | Fix Version field |
| 2026-02-25 | FLINK-39139 resolved: lz4-java relocated to `at.yawk.lz4` fork (CVE fix, unrelated to riscv64 at the time) | [FLINK-39139](https://issues.apache.org/jira/browse/FLINK-39139) |
| 2026-04-09 | `at.yawk.lz4:lz4-java` 1.11.0 adds a `linux-riscv64` native binary upstream | [yawkat/lz4-java#46](https://github.com/yawkat/lz4-java) |
| 2026-07-25 | PR #28820 opened: bump to 1.11.1 (would close the LZ4 riscv64 gap as a side effect) | [PR #28820](https://github.com/apache/flink/pull/28820) |
| 2026-09-30 | FLINK-38178 still open; no new sub-tasks since 2025-08-01; PR #28820 stalled on failing CI | This report |

Flink's riscv64 work is entirely upstream (no fork, no downstream patch set); nothing is pending in a vendor or distro tree outside `apache/flink`.

---

## 3. Upstream Support Tier

Apache Flink does not publish a formal platform tier document. There is no `PLATFORMS.md`, `SUPPORT.md`, `OWNERS`, or `CODEOWNERS` file in the repository that enumerates supported architectures or defines tier criteria. No MAINTAINERS file exists either (`raw.githubusercontent.com/apache/flink/master/MAINTAINERS` returns 404). The canonical PMC/committer roster page ([projects.apache.org/committee.html?flink](https://projects.apache.org/committee.html?flink)) renders via JavaScript and could not be retrieved for individual committer/company verification this session.

CI runs exclusively on `ubuntu-24.04`/`ubuntu-latest` (x86_64) GitHub Actions runners and `ubuntu-24.04`/`macOS-latest` Azure Pipelines images (Section 7). **arm64 is not tested in CI either** - there is no arm64 runner anywhere in the CI configuration, let alone riscv64. There is no official tier policy to reference, and no documented community stance on adding new CPU-architecture ports; in practice, architecture support is inherited from whatever JVM and OS the deployer supplies, rather than governed by an explicit native-port policy [inference from project structure, not a documented statement].

**De facto tier classification for riscv64:** below any recognized tier. The architecture is untested in CI, unreleased in any binary channel, and undocumented. The single merged riscv64 work item is a build-system fix that removes an immediate compile-time error - it does not constitute functional validation.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage | Full | None | None |
| Official binary release | Yes (JVM tarball) | Yes (JVM tarball) | No |
| Docker image | Yes | Yes | No |
| PyPI wheel | Yes | Partial (macOS only) | No |
| Tier policy | Undocumented (de facto primary) | Undocumented (de facto secondary) | Undocumented (unsupported) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Flink's architecture has three layers with distinct riscv64 implications.

**Layer 1 - JVM core (architecture-neutral).** All Flink runtime code (JobManager, TaskManager, scheduler, checkpoint coordinator, network-stack coordination, SQL/Table API) is JVM bytecode. GitHub code search for `riscv`/`riscv64` across `apache/flink` returns only 3 hits in the entire repository, none of which are code: an English docs table row (`docs/content/docs/ops/debugging/profiler.md`) and its Chinese translation listing riscv64 as an unofficial async-profiler port, and a Python `uv.lock` entry (`flink-python/docs/uv.lock`) pinning a doc-tooling dependency's published riscv64 musllinux wheel hash. Searches for `vfloat32m1_t` and `rvv` (RVV intrinsic patterns) return zero hits. There is no `arch/riscv/` directory, no `.S` assembly file anywhere in the repository (Flink has no C/C++/Assembly source at all), and no RISC-V-specific JIT backend - Flink has no JIT of its own; it runs entirely on the host JVM's JIT (HotSpot C2, an OpenJDK concern; see [runtimes/openjdk.md](../runtimes/openjdk.md)). This layer runs on any riscv64 JVM without modification.

The only architecture-aware class in Flink's own source is `flink-core`'s `ProcessorArchitecture` enum (`X86`, `AMD64`, `ARMv7`, `AARCH64`, `PPC64_LE`), used for platform capability checks (e.g., which platforms the built-in async-profiler integration supports). **`RISCV64` is not a member of this enum** - Flink's own architecture-detection code does not recognize riscv64 as a named platform.

**Layer 2 - JNI native subsystems (architecture-specific, critical gap).**

*RocksDB / ForSt state backend:* Flink's `EmbeddedRocksDBStateBackend` depends on `com.ververica:frocksdbjni:8.10.0-ververica-1.0` and `com.ververica:forstjni:0.1.8`, fat JARs bundling pre-compiled `.so` files for linux-x86_64, linux-aarch64 (glibc and musl), macOS x86_64/arm64, and Windows x64. The upstream `ververica/ForSt` source repository has no riscv64 build target; a code search for `riscv` in that repository returns no results. No riscv64 `.so` is bundled in either artifact. At runtime on riscv64, loading this backend triggers `UnsatisfiedLinkError`. The only fallback is `HashMapStateBackend`, which is heap-resident and does not support incremental checkpointing or Flink's managed off-heap memory.

*Netty native transport:* Flink uses `flink-shaded-netty` (Netty 4.2.x). Netty's native epoll and io_uring transports have shipped riscv64 `.so` files since 4.1.103.Final (merged upstream December 2023); Flink's riscv64-relevant transport layer is therefore covered. Netty falls back automatically to pure-Java NIO wherever native transport is unavailable, so this is not a functional blocker regardless.

*Netty tcnative:* `flink-shaded-netty-tcnative-dynamic` (test scope) provides BoringSSL JNI for TLS offload. No riscv64 artifact exists upstream. Flink falls back to JDK JSSE. Test-scope only; not a runtime blocker.

**Layer 3 - Python native extensions (architecture-specific, partial gap).** PyFlink (`flink-python`) includes Cython `.pyx` extensions with no hand-written SIMD or architecture guards - portable Cython compiled to native code for the host architecture at build time. PyPI wheels for `apache-flink` exist only for x86_64 Linux and macOS (x86_64/arm64); no riscv64 wheel is published (confirmed against all 63 published versions on PyPI, zero riscv64 filenames). On riscv64, `pip install` falls back to a source build, which requires Cython to be present.

| Component | amd64 | arm64 | riscv64 | ISA extensions used | Quality |
|---|---|---|---|---|---|
| JVM core (bytecode) | Full | Full | Full (any conformant JVM) | N/A | N/A - no architecture-specific code exists or is needed |
| RocksDB/ForSt JNI state backend | Full | Full | Missing (`UnsatisfiedLinkError`) | N/A | Missing - no riscv64 binary published |
| Netty native epoll/io_uring | Full | Full | Full (since Netty 4.1.103.Final) | None (syscall wrapper, not SIMD) | Full |
| Netty tcnative (BoringSSL) | Full | Full | Missing (JSSE fallback) | None | Missing |
| PyFlink Cython extensions | Full (wheel) | Partial (macOS wheel only) | Missing (source-buildable) | None | Missing (as a distributed artifact) |

---

## 5. Build System, Cross-Compilation, and Toolchain

Apache Flink is a Maven-only project. There is no CMake, no Makefile-based native build, no Cargo.toml, no go.mod, no cross-compilation toolchain file (e.g. `cmake/riscv64.cmake`), and no `Dockerfile.riscv64`. This was re-verified via GitHub code search (`riscv64 repo:apache/flink filename:Dockerfile` and `riscv repo:apache/flink extension:cmake`, both 0 results) since the repository has no C/C++ source tree to cross-compile (Section 4). Consequently there are no cmake/configure commands, no GCC/Clang minimum-version requirements, and no `-DUSE_X=OFF`-style feature flags to report for riscv64 - these concepts do not apply to Flink's build system.

**The riscv64 build-system fix (FLINK-38179):** The `flink-parquet` submodule uses `protobuf-maven-plugin`, which relies on `${os.detected.classifier}` (injected by `os-maven-plugin`) to download the matching pre-built `protoc` binary from Maven Central. Before Flink 2.2.0, `os-maven-plugin` 1.7.0 produced `os.detected.arch: unknown` and aborted the build with `unknown os.arch: riscv`. The upgrade to `os-maven-plugin` 1.7.1 in [PR #26860](https://github.com/apache/flink/pull/26860) resolves this detection failure.

This fix surfaces a secondary blocker: with riscv64 now correctly detected, `os.detected.classifier` resolves to `linux-riscv64`, and `protobuf-maven-plugin` attempts to download `com.google.protobuf:protoc:linux-riscv64` from Maven Central. No such artifact exists. The tracking issue [protocolbuffers/protobuf#17798](https://github.com/protocolbuffers/protobuf/issues/17798) now shows as closed, but a direct check of Maven Central's `com.google.protobuf:protoc` listing (latest 4.36.2, published 2026-09-17) confirms no `linux-riscv64` classifier has actually been published. A full `mvn compile` on a riscv64 host therefore still fails at the protoc download step unless `protoc` is pre-installed to the system `PATH` and the plugin is configured to use it.

**Standard build commands (for reference, on riscv64 with protoc pre-installed):**

```
mvn clean install -DskipTests
mvn clean install -DskipTests -Dfast -Pskip-webui-build -T 1C
```

**Docker images:** Official `apache/flink` images on Docker Hub target `linux/amd64` and `linux/arm64/v8` only. The `flink-docker` bake file lists only these two platforms, built via `docker/setup-qemu-action` + `docker/setup-buildx-action`; QEMU here emulates amd64/arm64 for image publishing, not riscv64. The CI build image is `apache/flink-ci-docker:java_8_11_17_21_25_maven_386_3916_noble` (x86_64 only; this is a rebuilt/renamed tag relative to the previously observed `..._jammy` tag, confirming the image continues to be actively maintained but remains x86_64-only). No riscv64 Docker image exists in any channel.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| JVM core runtime | Full | Full | Full | None |
| RocksDB/ForSt JNI state backend | Full | Full | Missing (`UnsatisfiedLinkError`) | Critical |
| Maven build (os-maven-plugin classifier) | Full | Full | Fixed (2.2.0) | Fixed |
| Maven build (protoc binary on Maven Central) | Full | Full | Missing | Build blocker |
| Netty native epoll/io_uring | Full | Full | Full (since 4.1.103.Final) | None |
| Netty tcnative / BoringSSL | Full | Full | Missing (JSSE fallback) | Minor |
| PyFlink wheels on PyPI | Full | Partial (macOS only) | Missing (source-buildable) | Gap |
| LZ4 JNI compression | Full | Full | Missing at pinned version (1.10.3); riscv64-capable version (1.11.0+) exists upstream, unmerged (PR #28820 open, CI failing) | Fixable, not yet closed |
| Snappy JNI compression | Full | Full | Full (since snappy-java 1.1.10.0) | None |
| Conscrypt TLS provider | Full | Full | Missing (JSSE fallback) | Minor |
| Official Docker image | Full | Full | Missing | Gap |
| CI test coverage | Full | None | None | Missing (matches arm64) |
| HDFS connector (Hadoop 2.10.2, provided scope) | Full | Full | Predates riscv64 work | Gap (use Hadoop 3.5.0+) |
| Published benchmarks | Exists | Exists | None found | Data not available |

**RocksDB/ForSt JNI gap - operational impact.** Stateful Flink applications using `EmbeddedRocksDBStateBackend` (the default for production large-state workloads) fail at runtime on riscv64 with `UnsatisfiedLinkError`. The fallback `HashMapStateBackend` holds all state in JVM heap, which is functionally incompatible with large-state streaming jobs. This is the single most impactful gap for production use.

**LZ4 gap - fixable, not structurally permanent.** The original `lz4/lz4-java` repository was archived 2025-12-02 with [lz4/lz4-java#212](https://github.com/lz4/lz4-java/pull/212) (riscv64 support) permanently unmerged there. Flink migrated its dependency to the community-maintained fork `at.yawk.lz4:lz4-java` via [FLINK-39139](https://issues.apache.org/jira/browse/FLINK-39139) (resolved 2026-02-25, for CVE-2025-66566/CVE-2025-12183, not for riscv64), currently pinned at 1.10.3. The fork added a `linux-riscv64` native binary starting with release 1.11.0 (2026-04-09, upstream [yawkat/lz4-java](https://github.com/yawkat/lz4-java) PR #46 by `luhenry`). Flink's pinned 1.10.3 predates that release and has no riscv64 binary. [PR #28820](https://github.com/apache/flink/pull/28820) (1.10.3 -> 1.11.1, opened for CVE-2026-59949) would close the gap if merged; as of 2026-09-30 it is unmerged and reports an Azure CI failure. Until it merges, LZ4 shuffle/state compression falls back to the fork's pure-Java implementation on riscv64 [NEEDS VERIFICATION - no benchmark quantifying the fallback's throughput penalty was found in any source].

**Protoc build blocker - developer impact.** No riscv64 `protoc` binary exists on Maven Central. Building Flink from source on a riscv64 host requires installing a system `protoc` and configuring the plugin to use it, or building `protoc` from source. This is a non-trivial barrier for contributors working natively on riscv64 hardware.

**Correctness note (not riscv64-specific but relevant):** [FLINK-39677](https://issues.apache.org/jira/browse/FLINK-39677), an open `ARRAY_SORT` comparator-contract violation affecting floating-point/duplicate-heavy arrays of 32+ elements, is a general TimSort correctness bug that applies identically on riscv64; see Section 11.

---

## 7. CI/CD Infrastructure

**Current state: zero riscv64 test coverage, confirmed by direct inspection.**

A sparse clone of `apache/flink` master (as of 2026-09-30) covering every CI configuration surface the project uses was grepped case-insensitively for `riscv`, `risc-v`, and `risc_v`:

- `.github/workflows/ci.yml`, `community-review.yml` (+ `.sh`), `docs-check.yml`, `docs-legacy.yml`, `docs.yml` (+ `.sh`), `nightly-trigger.yml`, `nightly.yml`, `stale.yml`, `template.flink-ci.yml`, `template.pre-compile-checks.yml`
- `azure-pipelines.yml` (root)
- `tools/azure-pipelines/build-apache-repo.yml`, `build-python-wheels.yml`, `build-nightly-dist.yml`, `jobs-template.yml`
- `tools/ci/compile_ci.sh`, `tools/ci/flink-ci-tools/**`
- `.asf.yaml`

**Result: zero matches across all files, exit code 1.** No file, comment, matrix entry, or variable name in Flink's CI configuration mentions riscv in any spelling. `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` do not exist anywhere in the repository.

**Runner/architecture inventory (every `runs-on`/`vmImage` found):**

| Workflow/pipeline | Runner |
|---|---|
| `docs-check.yml` | `ubuntu-24.04` |
| `docs.yml` | `ubuntu-latest` |
| `nightly.yml` (PyFlink wheel matrix, `cibuildwheel`, no `CIBW_ARCHS` override) | `${{ matrix.os }}` (native x86_64/macOS only) |
| `tools/azure-pipelines/build-apache-repo.yml` | `vmImage: 'ubuntu-24.04'` (x2) |
| `tools/azure-pipelines/build-python-wheels.yml` | `vmImage: 'macOS-latest'` |
| `tools/azure-pipelines/build-nightly-dist.yml` | `vmImage: 'ubuntu-24.04'` |
| Main `ci.yml` build image | `apache/flink-ci-docker:java_8_11_17_21_25_maven_386_3916_noble` (x86_64 only) |

Every runner is x86_64 or macOS. **No arm64 runner exists either**, let alone riscv64. No self-hosted riscv64 runner, no QEMU riscv64 emulation step, no `docker/setup-qemu-action` targeting riscv64, no dispatch-only or label-gated riscv job - none of these patterns appear anywhere, because the string "riscv" does not occur in the CI configuration at all.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build validated | Yes (every PR) | No | No |
| Test suite run | Yes (every PR) | No | No |
| RISE runners used | No | No | No |
| Hardware validation | N/A (native CI) | None found | SG2042 board, contributor-attested only ([PR #26860](https://github.com/apache/flink/pull/26860)); not reflected in any CI file |

**Consequence:** every merged change, including the os-maven-plugin fix in PR #26860, goes unvalidated on riscv64 hardware in upstream CI. The contributor's manual test on an SG2042 board is the only validation record, and it does not run on any subsequent PR.

---

## 8. Distribution and Release Status

**Primary Flink distribution (JVM tarballs via ASF mirrors):** Apache Flink publishes zero GitHub Releases (`github.com/apache/flink/releases` shows "There aren't any releases here" - Flink does not use this mechanism at all). All releases are distributed as architecture-neutral JVM bytecode tarballs (e.g., `flink-2.3.0-bin-scala_2.12.tgz`) via ASF mirrors, listed at [flink.apache.org/downloads](https://flink.apache.org/). The tarball itself runs on any riscv64 JVM, but its embedded native libraries (RocksDB/ForSt JNI) do not include riscv64 binaries (Section 4).

**PyPI - `apache-flink`:** latest release 2.3.0 publishes 13 files, enumerated from the PyPI JSON API: `cp39`-`cp312` x `macosx_10_9_x86_64`, `macosx_11_0_arm64`, `manylinux_..._x86_64`, plus one source `.tar.gz`. No filename across any of the 63 published versions contains "riscv" or "riscv64". Linux wheels are published for x86_64 only.

**RISE GitLab wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/apache-flink/` 302-redirects to the canonical PyPI simple index, which lists the same x86_64/arm64-only wheel set. The RISE wheel builder ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/), ~80 packages) does not list `apache-flink` at all.

**Ubuntu 26.04 "resolute":** `packages.ubuntu.com` search for "Apache Flink" in `resolute` returns "Sorry, your search gave no results." Apache Flink is not packaged in Ubuntu under any architecture.

**Debian:** `tracker.debian.org/pkg/apache-flink` returns HTTP 404. Not packaged.

**Arch Linux RISC-V port tracker** (`archriscv.felixc.at`): no Apache Flink entry.

**Docker Hub (`apache/flink`):** images for Flink 2.0.x/2.1.x/2.2.x with Java 11/17/21 variants, architectures `linux/amd64` and `linux/arm64/v8` only. No `linux/riscv64` manifest.

**What a user must do to get a working binary on riscv64 today:** download the architecture-neutral JVM tarball from an ASF mirror (this part works unmodified); build or obtain a riscv64 `protoc` binary and configure Maven to use it if building `flink-parquet` from source; accept that `EmbeddedRocksDBStateBackend`/ForSt is unusable (must configure `HashMapStateBackend` instead); accept LZ4 compression will run in pure-Java fallback mode until [PR #28820](https://github.com/apache/flink/pull/28820) or an equivalent bump merges; and build any container image manually, since no official riscv64 image exists.

---

## 9. Dependencies

Summary table covering every direct dependency, plus indirect dependencies surfaced by this research (RocksDB itself, underlying `frocksdbjni`/`forstjni`; PyArrow, the Python binding underlying `flink-python`'s use of Apache Arrow).

| Dependency | Role | Relation | Criticality | riscv64 Build | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|---|
| OpenJDK | JVM runtime required to run all Flink code | runtime-dependency | critical | Builds (no full HotSpot riscv64 CI job) | Temurin 21/17/11 available from Adoptium; not Tier 1 | C2 JIT missing several intrinsics on riscv64; no riscv64 jtreg CI. See [runtimes/openjdk.md](../runtimes/openjdk.md) |
| snappy-java | Snappy compression for state/shuffle | runtime-dependency | optional | riscv64 native `.so` bundled since 1.1.10.0 (2023) | Present since 1.1.10.0; Flink uses 1.1.10.7 | None - fully supported |
| lz4-java | LZ4 compression for shuffle and state | runtime-dependency | optional | Flink migrated to community fork `at.yawk.lz4:lz4-java` via [FLINK-39139](https://issues.apache.org/jira/browse/FLINK-39139), pinned at 1.10.3, which predates riscv64 support | Fork added `linux-riscv64` binary in 1.11.0 (2026-04-09); Flink still ships 1.10.3 | Not permanent: open [PR #28820](https://github.com/apache/flink/pull/28820) would bump to 1.11.1 (riscv64-capable) but is unmerged, Azure CI reported failing |
| Netty | Network transport (RPC, checkpointing, REST) | runtime-dependency | critical | riscv64 native epoll + io_uring shipped since 4.1.103.Final (2023) | Present since 4.1.103.Final; Flink uses 4.2.x | None for epoll/io_uring |
| netty-tcnative | TLS offload via BoringSSL (test scope) | test-dependency | optional | Not built for riscv64 | No riscv64 artifact | Test scope only; JSSE fallback is functional, not a runtime blocker |
| frocksdbjni | RocksDB state backend JNI | runtime-dependency | critical | Not built for riscv64; no riscv64 target in build config | No riscv64 artifact published | Runtime blocker: `UnsatisfiedLinkError` on `EmbeddedRocksDBStateBackend`; must fall back to `HashMapStateBackend` |
| forstjni | ForSt state backend JNI | runtime-dependency | critical | Not built for riscv64; same `ververica/ForSt` source, code search for "riscv" returns no results | No riscv64 artifact published | Runtime blocker, same as frocksdbjni |
| Apache Arrow | Python/Flink data exchange; flink-python Arrow-based batch transfer | runtime-dependency | optional | Arrow Java is architecture-neutral bytecode; Arrow C++ builds on riscv64 but has open riscv64 test failures ([apache/arrow#49556](https://github.com/apache/arrow/pull/49556), open draft) | Arrow Java JARs run on any JVM; no riscv64 PyArrow wheel on PyPI | PyArrow wheel gap affects flink-python users, who must build from source |
| Protocol Buffers | Proto code generation at build time (protoc) | build-dependency | critical | No pre-built riscv64 `protoc` binary on Maven Central; tracking issue [protocolbuffers/protobuf#17798](https://github.com/protocolbuffers/protobuf/issues/17798) shows closed but Maven Central (protoc 4.36.2, 2026-09-17) still has no `linux-riscv64` artifact | No riscv64 binary published | Build blocker, unchanged in practice despite the tracking issue's closure |
| os-maven-plugin | Maven build-time arch/OS detection | build-dependency | critical | Correctly maps riscv64 as of 1.7.1 ([PR #26860](https://github.com/apache/flink/pull/26860), Flink 2.2.0) | 1.7.1 released; Flink uses it | Fixed - was broken before Flink 2.2.0 |
| Apache Hadoop | HDFS file-system connector (provided scope) | runtime-dependency | optional | Flink's pinned 2.10.2 predates all riscv64 work | No riscv64 artifacts for 2.10.2 | Users requiring HDFS must use Hadoop 3.5.0+. See [data-analytics/apache-hadoop.md](apache-hadoop.md) |
| Apache Parquet | Columnar format read/write | runtime-dependency | optional | Java-only | Architecture-neutral JARs | None |
| Apache Avro | Schema-based serialization | runtime-dependency | optional | Java-only | Architecture-neutral JARs | None |
| Conscrypt | Alternate TLS/crypto provider | runtime-dependency | optional | No riscv64 support; no riscv64 issues or PRs filed upstream | No riscv64 artifact | Runtime scope; JSSE fallback is functional |
| Byte Buddy | Runtime bytecode generation for serializers | runtime-dependency | optional | JVM bytecode only (ASM-based), no native code | Architecture-neutral | None |
| Janino | Runtime Java compilation for SQL codegen | runtime-dependency | optional | JVM bytecode only | Architecture-neutral | None |
| Kryo | Fallback Java object serialization | runtime-dependency | optional | JVM bytecode only (uses `Unsafe`, no arch-specific path) | Architecture-neutral | None |
| ZooKeeper | Leader election, HA coordination | runtime-dependency | optional | Java-only | Architecture-neutral | None |
| RocksDB (indirect, via frocksdbjni/forstjni) | Underlying C++ embedded KV store that frocksdbjni/forstjni wrap | indirect | critical | Upstream RocksDB source supports riscv64 builds, but the Ververica fork's CI pipeline enumerates no riscv64 target | No riscv64 `.so` shipped in either downstream JNI artifact | Same runtime blocker as frocksdbjni/forstjni; fixing this requires Ververica to add a riscv64 build target |
| PyArrow (indirect, via Apache Arrow / flink-python) | Python binding used by PyFlink's Arrow-based batch data exchange | indirect | optional | Arrow C++ has open riscv64 test failures ([apache/arrow#49556](https://github.com/apache/arrow/pull/49556)) | No riscv64 wheel on PyPI | Source build required (~1 hour), contingent on Arrow C++ riscv64 stabilizing |

**Blocking issues summary:**

| Severity | Dependency | Issue |
|---|---|---|
| Build blocker | Protocol Buffers (protoc) | No riscv64 binary on Maven Central; [protocolbuffers/protobuf#17798](https://github.com/protocolbuffers/protobuf/issues/17798) closed without a published fix |
| Runtime blocker | frocksdbjni / forstjni | No riscv64 `.so`; `EmbeddedRocksDBStateBackend` and the ForSt backend are unusable on riscv64 |
| Performance gap (fixable, not merged) | lz4-java | Flink pinned to 1.10.3 (pre-riscv64); fork added riscv64 in 1.11.0; open [PR #28820](https://github.com/apache/flink/pull/28820) to 1.11.1 unmerged |
| TLS performance gap | netty-tcnative | No riscv64 BoringSSL JNI; falls back to JSSE |
| HDFS compatibility | Apache Hadoop | Pinned 2.10.2 predates riscv64 work; HDFS users must use Hadoop 3.5.0+ |
| PyFlink gap | Apache Arrow / PyArrow | No riscv64 wheel; source build required; Arrow C++ has open riscv64 test failures |

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [FLINK-38178](https://issues.apache.org/jira/browse/FLINK-38178) | RISC-V Architecture Support (umbrella) | Open, unresolved, unassigned, no fix version | N/A (tracking) | Created 2025-08-01, last updated 2025-08-01 - dormant for over a year. Only 1 of 4 planned scope areas (platform optimizations, bug fixes, CI/test coverage, documentation) has ever had a sub-task filed |
| [FLINK-38179](https://issues.apache.org/jira/browse/FLINK-38179) | Build failure due to os-maven-plugin missing riscv64 support | Resolved, Fix Version 2.2.0 | N/A (fixed) | Root cause: `os-maven-plugin` 1.7.0 reported `os.detected.arch: unknown`. Fixed via [PR #26860](https://github.com/apache/flink/pull/26860) |
| [FLINK-21139](https://issues.apache.org/jira/browse/FLINK-21139) | `ThresholdMeterTest.testMarkMultipleEvents` unstable | Fixed in Flink 1.13.0 (Feb 2021) | Low | First reported from a riscv64 environment (SiFive Rocket, Debian, OpenJ9, JIT disabled), but root cause was general test-timing flakiness, not riscv64-specific |
| [FLINK-39677](https://issues.apache.org/jira/browse/FLINK-39677) | `ARRAY_SORT` comparator contract violation | Open, Major | Medium-High (correctness) | Affected versions 1.20.4, 2.0.2, 2.1.2, 2.2.1, 2.3.0. `ArraySortComparator.compare` violates Java's `Comparator` antisymmetry contract for equal elements, causing TimSort to throw `Comparison method violates its general contract!` on arrays of 32+ elements with duplicates. Relevant to riscv64 because NaN/floating-point comparisons trigger the same pattern; applies equally on any architecture |

**FLINK-39677 fix status (re-checked 2026-09-30):** [PR #28155](https://github.com/apache/flink/pull/28155) (two-probe comparator fix, returns 0 when neither element is greater) remains **open**, last updated 2026-09-29. [PR #28159](https://github.com/apache/flink/pull/28159), a more thorough fix generating a reusable `$COMPARE$1` codegen helper, was **auto-closed as stale on 2026-09-20** after 120 days of inactivity, without merging. The underlying bug is therefore still open and unfixed in any released or unreleased branch as of this report.

**Published RISC-V benchmarks:** Data not available. No throughput, latency, or comparative performance figures for Apache Flink on riscv64 were found on the Flink project site, the RISE blog, Apache JIRA, GitHub, or general web search.

---

## 12. Objections and Upstream Blockers

**Objection: "The build fix is already merged; Flink 2.2.0 supports riscv64."**

Refuted. The merged change ([PR #26860](https://github.com/apache/flink/pull/26860)) is a one-line `pom.xml` version bump for a Maven plugin. It removes one build-time error while immediately exposing a second build-time error (no `protoc` binary for riscv64 on Maven Central). It validates nothing about whether any native component compiles or passes tests on riscv64 - no CI does that. The RocksDB/ForSt JNI state backend, the component that distinguishes production stateful Flink from a stateless prototype, has no riscv64 native library and fails with `UnsatisfiedLinkError` on any riscv64 host. Characterizing Flink 2.2.0 as "supporting riscv64" materially overstates the situation.

**Blocker 1 - frocksdbjni / forstjni (no riscv64 build).** Controlled by Ververica (an Alibaba subsidiary). The CircleCI-based build pipeline enumerates its targets explicitly; riscv64 is absent. Adding it requires Ververica to allocate a riscv64 build environment and CI runner - an external dependency Flink contributors cannot resolve unilaterally. No riscv64 request or issue has been filed against `ververica/ForSt`.

**Blocker 2 - protoc riscv64 binary on Maven Central.** [protocolbuffers/protobuf#17798](https://github.com/protocolbuffers/protobuf/issues/17798) (filed 2024-08-13) now shows closed, a change from a prior "open, untriaged" status - but this is not a fix. Maven Central's latest protoc release (4.36.2, 2026-09-17) still ships no `linux-riscv64` classifier; only aarch64, ppcle64, s390_64, x86_32/64 (Linux), macOS, and Windows binaries are published. No accessible closing comment or linked merged PR explains the closure. This remains a Google-owned project where the Flink community has no direct leverage; the workaround (pre-install `protoc` to `PATH`) is not documented in Flink's official build docs.

**Blocker 3 - lz4-java (no longer a hard blocker; a version bump away).** The original `lz4/lz4-java` repository was archived 2025-12-02 and [lz4/lz4-java#212](https://github.com/lz4/lz4-java/pull/212) remains permanently unmerged there. Flink already migrated to the community-maintained fork `at.yawk.lz4:lz4-java` via [FLINK-39139](https://issues.apache.org/jira/browse/FLINK-39139), and that fork shipped a `linux-riscv64` native binary starting with release 1.11.0 (2026-04-09). Flink is pinned to 1.10.3, one significant version behind. [PR #28820](https://github.com/apache/flink/pull/28820) already proposes bumping to 1.11.1, driven by a security fix rather than riscv64, but would close the gap as a side effect once merged - it is currently unmerged and its CI run is failing. This is a low-effort, low-risk merge, not an unresolvable upstream dependency.

**Blocker 4 - no riscv64 CI.** Without CI, no regression guarantee exists for any future Flink change on riscv64; every merge risks silent breakage. Adding riscv64 CI requires either QEMU-based emulation (typically 10-20x slower for integer workloads) or access to physical riscv64 hardware or hosted CI. Neither option has been proposed or funded within the Flink project. No RISE engagement exists to supply riscv64 runners for Flink (Section 1).

**Blocker 5 - single-contributor ownership.** All riscv64 work originates from one external contributor (Gong Xiaofei), with no PMC sponsor, no committer assigned, and no corporate backer identified in the public record. FLINK-38178 has received zero engagement since its creation in August 2025. The project has no organizational commitment to riscv64 support.

**Acceptance probability for future riscv64 patches:** High for small, self-contained dependency/build-tool bumps (both prior os-maven-plugin fixes were reviewed and merged within 1-2 days of submission by different committers). Low for anything requiring sustained investment (CI infrastructure, coordinating a fix in a third-party binary artifact like frocksdbjni) absent an external sponsor, since no committer or PMC member owns riscv64 as a workstream.

---

## 13. Readiness Assessment

- **Color:** orange (no-upstream-ci-no-distro-floor)
- **Release provider:** none

**Justification:** Apache Flink has zero upstream riscv64 CI - an exhaustive grep of every GitHub Actions and Azure Pipelines file in [apache/flink](https://github.com/apache/flink) returns no "riscv" hits, and all runners are x86_64 or macOS (Section 7) - and no riscv64 package in any channel checked (PyPI, Ubuntu, Debian, Arch, Docker Hub, GitHub Releases all confirmed absent; Section 8), so no distribution floor applies. Per the project readiness methodology this defaults to orange rather than red, because Flink's own JVM bytecode core needs no source changes for riscv64, and the one riscv64-specific fix Flink's own code required (os-maven-plugin classifier detection) is already merged ([PR #26860](https://github.com/apache/flink/pull/26860)). The grade is capped below blue or green because two dependencies marked critical in Section 9 - the RocksDB/ForSt JNI state backend (`frocksdbjni`/`forstjni`) and the Maven Central `protoc` binary - have no riscv64 artifact at all, which is an unresolved binary-availability gap rather than a confirmed code incompatibility ([FLINK-38178](https://issues.apache.org/jira/browse/FLINK-38178)).

**Pending work that could change the grade:** The open Dependabot PR [apache/flink#28820](https://github.com/apache/flink/pull/28820) (lz4-java 1.10.3 to 1.11.1) would close the LZ4 riscv64 gap if merged, but it is currently stalled on a failing Azure CI run. The umbrella tracking issue [FLINK-38178](https://issues.apache.org/jira/browse/FLINK-38178) is open but has been dormant since 2025-08-01, with only one sub-task ever filed under it. No RISE engagement with Flink exists in the public record (Section 1). Neither the RocksDB/ForSt binary gap nor the protoc binary gap has any open upstream issue or PR tracking a fix as of this report.

---

## 14. Investment Analysis

### 14.1 Functional Enablement

The highest-priority functional gap is the RocksDB/ForSt JNI state backend. Production stateful streaming jobs (exactly-once semantics, large state, incremental checkpoints) require it; without it, Flink on riscv64 is limited to stateless or small-state workloads using heap-based state.

Closing this gap requires:
- A riscv64 build environment with a C++ toolchain targeting riscv64
- CMake configuration for riscv64 within the RocksDB build (upstream RocksDB supports riscv64 in source; the ververica fork inherits this)
- Adding riscv64 as a CI target in `ververica/ForSt`'s build pipeline
- Publishing the fat JAR with the riscv64 `.so` included

This work must be done by or coordinated with Ververica; it cannot be completed unilaterally within `apache/flink`.

Separately, the protoc build blocker requires either a riscv64 `protoc` binary on Maven Central (upstream in `protocolbuffers/protobuf`, multi-month effort requiring Google engagement) or documenting/automating the PATH-based workaround in Flink's own build docs (1-2 day effort, within Flink's control).

### 14.2 Performance Optimization

Flink's JVM core has no SIMD or architecture-specific code paths (Section 4). Performance on riscv64 is entirely a function of: (1) JVM quality (HotSpot C2 JIT, intrinsics - upstream OpenJDK, not Flink); (2) native library performance (RocksDB, Netty epoll - upstream dependencies, not Flink); (3) memory allocation patterns (off-heap via Netty, on-heap via JVM). There is no Flink-specific SIMD or RVV optimization work to be done within `apache/flink`; any RISC-V performance investment for Flink flows through OpenJDK and the native dependency layer.

The LZ4 compression throughput gap is not structurally permanent: merging the already-open [PR #28820](https://github.com/apache/flink/pull/28820) closes it. Until it merges, the practical mitigation is using Snappy (fully supported on riscv64) instead of LZ4 for shuffle and state compression, at some compression-ratio cost [NEEDS VERIFICATION - no benchmark quantifying this tradeoff was found].

### 14.3 CI/CD Infrastructure

Adding riscv64 CI to Flink requires: a GitHub Actions runner with riscv64 capability or QEMU-based emulation on existing runners; a Flink CI Docker image built for `linux/riscv64` (adding riscv64 to the `flink-docker` bake file); a new CI job (or extension of `template.flink-ci.yml`) running the test suite on riscv64; and substantial compute time, since Flink's full test suite is multi-hour on x86_64 and QEMU emulation would multiply this 10-20x. No RISE engagement or Scaleway-hosted runner allocation for Flink exists today (Section 1); pursuing this would require a Flink committer willing to own the CI configuration plus external hardware or hosted-CI access, neither of which currently exists.

### 14.4 Ecosystem Enablement

- **PyFlink riscv64 wheel:** requires adding riscv64 to the `nightly.yml` `cibuildwheel` configuration and a QEMU setup step (1-2 weeks). Blocked on PyArrow riscv64 wheel availability, itself blocked on Arrow C++'s open riscv64 test failures ([apache/arrow#49556](https://github.com/apache/arrow/pull/49556), open draft).
- **Official Docker image:** add `linux/riscv64` to the `flink-docker` bake file and use a riscv64 base JDK image (Eclipse Temurin publishes riscv64 JDK 17/21 images). Low effort (1-2 days), but the resulting image is incomplete until the RocksDB JNI gap is resolved.
- **Documentation:** FLINK-38178 scope item 4 (unstarted). Low effort (1-2 days) once functional gaps are resolved.
- **HDFS connector:** document the Hadoop 3.5.0+ requirement for riscv64 HDFS users. Low effort.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | RocksDB/ForSt JNI riscv64 build (`frocksdbjni`/`forstjni`) | 4-8 | Ververica (external) | Critical |
| Functional | protoc riscv64 binary on Maven Central | 8-16 | Google/protocolbuffers (external) | High |
| Functional | Document PATH-based protoc workaround for riscv64 in Flink build docs | 0.25 | Flink contributor | High |
| Functional | Merge/adopt `at.yawk.lz4:lz4-java` >= 1.11.0 (riscv64-capable) - land [PR #28820](https://github.com/apache/flink/pull/28820) | 0.25-0.5 | Flink committer | Medium |
| Functional | Document `HashMapStateBackend` fallback and Snappy-vs-LZ4 tradeoffs for riscv64 | 0.5 | Flink contributor | Medium |
| CI/CD | riscv64 CI runner integration (RISE runners or QEMU) | 3-5 | Flink committer + RISE WG | High |
| CI/CD | riscv64 CI Docker image for `apache/flink-ci-docker` | 1-2 | Flink committer | High |
| CI/CD | File a riscv64 CI sub-task under FLINK-38178 and drive to completion | 0.5 | Flink contributor | High |
| Ecosystem | PyFlink riscv64 wheel (`cibuildwheel` + QEMU) | 2-3 | Flink contributor; blocked on PyArrow | Medium |
| Ecosystem | Official `apache/flink` Docker image for `linux/riscv64` | 0.5 | Flink committer | Medium |
| Ecosystem | Hadoop 3.5.0+ compatibility documentation for HDFS on riscv64 | 0.25 | Flink contributor | Low |
| Performance | JVM JIT/intrinsics improvement for riscv64 | N/A (OpenJDK scope) | OpenJDK upstream | N/A |
| Performance | Netty native epoll for riscv64 | 0 (already merged upstream) | None | Done |

---

## 15. References

- [apache/flink repository](https://github.com/apache/flink)
- [flink.apache.org](https://flink.apache.org/)
- [FLINK-38178 - RISC-V Architecture Support umbrella (JIRA)](https://issues.apache.org/jira/browse/FLINK-38178)
- [FLINK-38179 - Build failure: os-maven-plugin missing riscv64 support (JIRA)](https://issues.apache.org/jira/browse/FLINK-38179)
- [FLINK-21139 - ThresholdMeterTest unstable (JIRA)](https://issues.apache.org/jira/browse/FLINK-21139)
- [FLINK-39677 - ARRAY_SORT comparator contract violation (JIRA)](https://issues.apache.org/jira/browse/FLINK-39677)
- [FLINK-39139 - lz4-java relocation to at.yawk.lz4 (JIRA, resolved)](https://issues.apache.org/jira/browse/FLINK-39139)
- [PR #14934 - os-maven-plugin upgrade for riscv64 (merged 2021-02-24; first released Flink 1.13.0)](https://github.com/apache/flink/pull/14934)
- [PR #26852 - os-maven-plugin upgrade for riscv64 (closed, superseded)](https://github.com/apache/flink/pull/26852)
- [PR #26860 - os-maven-plugin upgrade for riscv64 (merged, Flink 2.2.0)](https://github.com/apache/flink/pull/26860)
- [PR #27648 - lz4-java relocation merge](https://github.com/apache/flink/pull/27648)
- [PR #28820 - at.yawk.lz4:lz4-java 1.10.3 -> 1.11.1 bump, open (brings in riscv64 binary)](https://github.com/apache/flink/pull/28820)
- [PR #28155 - FLINK-39677 fix, open](https://github.com/apache/flink/pull/28155)
- [PR #28159 - FLINK-39677 fix, closed stale 2026-09-20](https://github.com/apache/flink/pull/28159)
- [protocolbuffers/protobuf#17798 - riscv64 protoc binary missing on Maven Central (closed; no riscv64 artifact published as of protoc 4.36.2)](https://github.com/protocolbuffers/protobuf/issues/17798)
- [lz4/lz4-java#212 - riscv64 JNI support (unmerged; original repo archived)](https://github.com/lz4/lz4-java/pull/212)
- [yawkat/lz4-java - community-maintained continuation, riscv64 binary since v1.11.0](https://github.com/yawkat/lz4-java)
- [apache/arrow PR #49556 - Arrow C++ riscv64 test failures (open draft)](https://github.com/apache/arrow/pull/49556)
- [apache/flink on Docker Hub](https://hub.docker.com/r/apache/flink/tags)
- [apache/flink-docker repository](https://github.com/apache/flink-docker)
- [PyPI apache-flink package](https://pypi.org/project/apache-flink/)
- [RISE project blog](https://riseproject.dev/blog/)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [runtimes/openjdk.md](../runtimes/openjdk.md)
- [data-analytics/apache-hadoop.md](apache-hadoop.md)