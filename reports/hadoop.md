---
title: Apache Hadoop
categories:
  - data-analytics
---

# Apache Hadoop

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Apache Hadoop<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Apache Hadoop is a top-level project of the Apache Software Foundation (ASF), licensed under Apache License 2.0. The canonical repository is [apache/hadoop](https://github.com/apache/hadoop) (15,571 stars, 9,220 forks). The primary development branch is `trunk` (Hadoop 4.x). The latest stable release is 3.5.0 (released 2026-04-01).

Hadoop is architecturally split into two layers for portability purposes:

- **Java core:** architecture-neutral, runs on any JVM with riscv64 support. This layer requires no porting work.
- **Native (C/JNI) layer:** performance-critical operations including CRC32/CRC32C checksumming, byte-swap, erasure coding (via Intel ISA-L), and crypto (via OpenSSL). This layer requires explicit architecture-specific work.

All RISC-V porting effort to date targets the native layer exclusively.

**Governance:** The PMC is volunteer-based, merit-driven. No paid maintainer program exists. Coordination is via dev@hadoop.apache.org and [Apache JIRA](https://issues.apache.org/jira/browse/HADOOP). Identified PMC members include contributors from Cloudera, Google, Microsoft, NTT DATA, NVIDIA, and LY Corporation. No formal platform tier document (PLATFORMS.md, SUPPORT.md) exists in the repository.

**RISE Project:** Apache Hadoop is not affiliated with the [RISE Project](https://riseproject.dev). No RISE blog posts, RFP listings, or working group assignments reference Hadoop. RISE Premier Members include Google, NVIDIA, Qualcomm, Red Hat, SiFive, MediaTek, Andes Technology, Damo Academy, and Tenstorrent. RISE General Members include ISCAS, which is the institutional affiliation of at least one Hadoop RISC-V contributor (see Section 2).

---

## 2. Port History and Upstreaming Timeline

The RISC-V porting effort has two distinct phases: an inactive early discussion phase (2021-2022) and an active implementation campaign that began July 2025.

### Phase 1: Dormant (2021-2022)

| Date | Event |
|---|---|
| 2021-02-14 | [HADOOP-17529](https://issues.apache.org/jira/browse/HADOOP-17529) opened by Ivan Serdyuk: "Update os-maven-plugin to 1.7.0 to support RISC-V architecture (JDK11)". The associated PRs were not merged. Ticket remains Open. |
| 2022-06-06 | [HADOOP-18275](https://issues.apache.org/jira/browse/HADOOP-18275) opened and merged by Steve Loughran (Cloudera/Apache): upgrades os-maven-plugin to 1.7.0, incidentally adding riscv64 Maven platform detection support. This is the earliest merged commit with implicit RISC-V relevance. |

### Phase 2: Active (July 2025 - present)

The active campaign was initiated by **Lei Wen (leiwen2025)**, whose institutional affiliation is not publicly stated on GitHub [NEEDS VERIFICATION]. **Peter Pan (PeterPtroc / gong-flying, email gongxiaofei24@iscas.ac.cn)** is identified by email as affiliated with ISCAS (Institute of Software, Chinese Academy of Sciences), which is a RISE General Member.

Umbrella tracker: [HADOOP-19623](https://issues.apache.org/jira/browse/HADOOP-19623) "RISC-V Architecture Support" -- Open, Major, created 2025-07-15 by Lei Wen. Affects versions 3.3.0 and 3.4.1. No fix version assigned.

| Date | JIRA | PR | Description | Status |
|---|---|---|---|---|
| 2025-07-11 | [HADOOP-19615](https://issues.apache.org/jira/browse/HADOOP-19615) | [#7796](https://github.com/apache/hadoop/pull/7796) | Upgrade os-maven-plugin to 1.7.1 to fix "unknown os.arch: riscv64" Maven build failure | Merged 2025-07-16; fix version 3.5.0 |
| 2025-07-11 | [HADOOP-19616](https://issues.apache.org/jira/browse/HADOOP-19616) | [#7809](https://github.com/apache/hadoop/pull/7809) | Add bswap support for RISC-V (fixes "unrecognized opcode 'bswap a4'" on riscv64) | Merged 2025-07-23; fix version 3.5.0 |
| 2025-07-15 | [HADOOP-19623](https://issues.apache.org/jira/browse/HADOOP-19623) | -- | Umbrella: RISC-V Architecture Support | Open |
| 2025-08-26 | [HADOOP-19663](https://issues.apache.org/jira/browse/HADOOP-19663) | [#7903](https://github.com/apache/hadoop/pull/7903) | CRC32 build scaffolding and placeholder (bulk_crc32_riscv.c no-op constructor) | Merged 2025-10-09; fix version 3.5.0 |
| 2025-10-12 | [HADOOP-19724](https://issues.apache.org/jira/browse/HADOOP-19724) | [#8031](https://github.com/apache/hadoop/pull/8031) | [RISC-V] rv64 Zbc (CLMUL) bulk CRC32 acceleration | Merged 2026-02-06; fix version 3.5.0 |
| 2026-03-23 | [HADOOP-19849](https://issues.apache.org/jira/browse/HADOOP-19849) | [#8371](https://github.com/apache/hadoop/pull/8371) | [RISC-V] rv64 Zbc (CLMUL) bulk CRC32C acceleration | Open as of 2026-03-23 |

Closed/abandoned PRs (superseded or stale):

| PR | Description | Closure date | Reason |
|---|---|---|---|
| [#7787](https://github.com/apache/hadoop/pull/7787) | bswap: add RISC-V support (first attempt) | 2025-10-18 | Superseded by #7809 |
| [#7896](https://github.com/apache/hadoop/pull/7896) | Zbc CLMUL CRC32/CRC32C monolithic PR | 2025-12-09 | Superseded by incremental #7903+#8031+#8371 |
| [#7912](https://github.com/apache/hadoop/pull/7912) | CRC32 via v/zbc/zvbc (RVV approach) | 2026-03-01 | Closed stale; strategy shifted to scalar-first |
| [#7924](https://github.com/apache/hadoop/pull/7924) | WIP: RISC-V riscv64 dev container Dockerfile | 2026-02-20 | Closed stale; maintenance burden objection |
| [#7842](https://github.com/apache/hadoop/pull/7842) | Missing LevelDB deps in hadoop-hdfs (surfaced by riscv64 builds) | 2025-10-13 | Closed as environment-specific |

All merges to date went into `apache:trunk` (Hadoop 4.x). No RISC-V patches have been backported to any 3.x release branch as of the available data. Hadoop 4.x has not had a GA release; merged changes are in trunk snapshots only.

---

## 3. Upstream Support Tier

Hadoop has no formal platform tier system. No PLATFORMS.md, SUPPORT.md, or equivalent tier classification document exists in the repository. Platform support is determined by contributor availability and CI capacity, with new ports accepted if they build correctly and do not break existing CI.

The umbrella ticket HADOOP-19623 (Open, Major) signals that RISC-V is recognized as an accepted, tracked effort. The PMC reviewer who has merged the bulk of the RISC-V work -- Steve Loughran (steveloughran) -- has merged three of the four landed PRs and is engaged as the de-facto reviewer for native work.

**Effective tier:** community-supported, no CI, no official binary. Functionally analogous to an early "tier 3" in projects that use formal tier language, though Hadoop has no such classification.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 CRC32 (zlib polynomial) -- partial

File: `hadoop-common-project/hadoop-common/src/main/native/src/org/apache/hadoop/util/bulk_crc32_riscv.c`

This is a 244-line implementation (not a stub) merged via [PR #8031](https://github.com/apache/hadoop/pull/8031) on 2026-02-06. It uses GCC inline assembly with `.option arch, +zbc` directives to emit `clmul` and `clmulh` instructions from the RISC-V Zbc scalar cryptography extension.

Implementation details:
- Main loop: 16-byte/iteration carry-less multiply folding with Barrett reduction
- `rv_clmul()` / `rv_clmulh()` wrappers via `__asm__ volatile`
- 1-to-3 block pipelining function (`pipelined_crc32_zlib`)
- Bitwise fallback for short/tail/misaligned data
- Runtime detection: `__attribute__((constructor))` reads `/proc/cpuinfo` for `"zbc"` substring; sets `pipelined_crc32_zlib_func` function pointer accordingly
- Guard: `#if defined(__riscv) && (__riscv_xlen == 64)`

No RVV (V-extension) path exists in trunk. The planned hierarchy (acknowledged in PR #8031 review) is `vclmul > clmul > software`, with the Zbc scalar path as the first tier. The RVV path ([PR #7912](https://github.com/apache/hadoop/pull/7912), HADOOP-19666) was closed as stale in March 2026; no replacement has been opened.

**Rating vs. amd64/aarch64:** Partial. amd64 uses SSE4.2 hardware CRC instructions; aarch64 uses a pipelined 128-bit LDP approach with hardware CRC instructions. The riscv64 Zbc scalar path processes 16 bytes per iteration via CLMUL folding, which is functionally different but comparable in approach to the aarch64 implementation.

### 4.2 CRC32C (Castagnoli polynomial) -- missing in trunk

CRC32C hardware acceleration for riscv64 does not exist in trunk as of the available data. [PR #8371](https://github.com/apache/hadoop/pull/8371) (HADOOP-19849, opened 2026-03-23) adds a Zbc CLMUL CRC32C path using 64-byte blocks with 4-way parallelism and Barrett reduction. The PR is open and blocked by two issues (see Section 12).

aarch64 has full hardware CRC32C support in trunk. amd64 has SSE4.2 CRC32C support in trunk. riscv64 falls back to software for all CRC32C operations currently.

### 4.3 bswap (byte-swap, MapReduce NativeTask) -- scalar/compiler builtin

File: `hadoop-mapreduce-project/hadoop-mapreduce-client/hadoop-mapreduce-client-nativetask/src/main/native/src/lib/primitives.h`

[PR #7809](https://github.com/apache/hadoop/pull/7809) adds `defined(__riscv)` to the `#elif` chain in both `bswap` and `bswap64` inline functions, routing riscv64 through `__builtin_bswap32` / `__builtin_bswap64`. These GCC built-ins delegate to whatever instruction sequence the compiler generates (typically `rev` or equivalent on a capable toolchain). This is not hand-written inline assembly. amd64 and aarch64 both use explicit `bswap` / `rev` assembly in the same file.

**Rating vs. amd64/aarch64:** Functional parity, not performance-tuned. The GCC builtin path is correct; the performance delta is compiler-dependent.

### 4.4 Erasure coding (ISA-L / Reed-Solomon) -- missing/broken

Hadoop's erasure coding path (`io/erasurecode/`) delegates entirely to Intel ISA-L (`libisal`) via `dlopen`. There are no architecture-specific guards in the Hadoop source -- `dlopen(HADOOP_ISAL_LIBRARY)` is attempted unconditionally. On riscv64, this call will fail at runtime unless a riscv64-capable ISA-L library is installed. No such library exists from Intel; all RISC-V PRs to the ISA-L repository were abandoned (see Section 9). When ISA-L is unavailable, Hadoop falls back to a Java software erasure coding path.

No riscv64 ISA-L alternative and no fallback C erasure coding implementation exist within Hadoop itself.

### 4.5 Crypto (OpenSSL AES-256-CTR) -- scalar, delegated

`OpensslCipher.c` and `OpensslSecureRandom.c` contain no architecture guards. They call OpenSSL via the EVP API. On riscv64, OpenSSL 3.x provides scalar AES (T-table implementation) but does not activate hardware AES acceleration because the base RISC-V ISA has no AES instructions; that requires the Zkn/Zvkned extensions. The T-table AES path is not constant-time on hardware lacking Zkn/Zvkned (see Section 9 for the security implication). Hadoop itself does not require AES acceleration to be correct; the functional gap is performance and, on hardware without Zkn/Zvkned, a side-channel risk in the underlying OpenSSL library.

### 4.6 Build system architecture detection

`hadoop-common-project/hadoop-common/src/CMakeLists.txt` contains:

```cmake
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "^riscv64" OR CMAKE_SYSTEM_PROCESSOR MATCHES "^riscv32")
    set(BULK_CRC_ARCH_SOURCE_FIlE "${SRC}/util/bulk_crc32_riscv.c")
```

Note: the variable name contains a typo (`FIlE` with lowercase `l`). This is consistent throughout the file and does not break the build as the typo is used uniformly.

Both riscv32 and riscv64 are handled by the same regex, routing both to `bulk_crc32_riscv.c`.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Native build toolchain requirements (from BUILDING.txt)

| Dependency | Required Version | Notes |
|---|---|---|
| CMake | 3.19+ | |
| GCC | 9.3.0+ | Required for `thread_local` storage; Rocky Linux 8 uses gcc-toolset-9 explicitly |
| JDK | 17 | |
| Maven | 3.9.15+ | Or `./mvnw` wrapper |
| Boost | 1.86.0 | |
| Protocol Buffers | 3.25.5 | Requires abseil-cpp 20230802.1 |
| zlib | any | Required |
| Cyrus SASL | any | Required |
| OpenSSL | any | Optional but recommended |

### 5.2 Native build command (riscv64 native host or QEMU)

No riscv64-specific CMake flags are required. Architecture detection is automatic. Standard build:

```bash
mvn package -Pdist,native -DskipTests -Dtar -Dmaven.javadoc.skip=true
```

For testing only native CRC32:

```bash
mvn -Pnative -Dtest=org.apache.hadoop.util.TestNativeCrc32 test
```

Optional native library flags (same on riscv64 as any other platform):
- `-Drequire.snappy` -- fail if libsnappy not found
- `-Drequire.openssl` -- fail if libcrypto not found
- `-Drequire.isal` -- fail if libisal not found
- `-Drequire.pmdk` -- fail if libpmem not found

### 5.3 Cross-compilation and Docker

No riscv64 Dockerfile exists in `dev-support/docker/`. The only non-x86 Dockerfile is `Dockerfile_ubuntu_24_aarch64`. The `start-build-env.sh` script accepts `CPU_ARCH` values of `x86_64`, `amd64`, `aarch64`, and `arm64` only; passing `CPU_ARCH=riscv64` would exit with an error because no corresponding Dockerfile exists.

`BUILDING.txt` documents QEMU cross-platform container support for amd64 and arm64 only via `tonistiigi/binfmt`. riscv64 QEMU support is not documented.

Contributors working on RISC-V (leiwen2025, PeterPtroc) have tested on physical riscv64 hardware (SG2380/EulixOS) and via a manually configured QEMU + openEuler RISC-V image. The QEMU approach was described in PR review as "super super slow" and not usable for performance benchmarking [NEEDS VERIFICATION: exact quote from pan3793 in PR #8031].

### 5.4 Protobuf build on riscv64

Protobuf 3.25.5 must be built from source (system packages are outdated). The build requires:
- abseil-cpp 20230802.1 as a third-party dependency
- cmake flags: `-DCMAKE_POSITION_INDEPENDENT_CODE=ON -Dprotobuf_BUILD_TESTS=OFF`

The same flags apply on riscv64 as on any other architecture. PR #7903 review documents the full QEMU reproduction chain: openEuler 25.03, QEMU, GCC, CMake, JDK 17 riscv64, Protobuf 2.5.0 with RISC-V patches + Protobuf 3.25.5/Abseil.

---

## 6. Feature Coverage and Gap Analysis vs. arm64 and amd64

| Component | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| CRC32 (zlib) | Full (SSE4.2 hw CRC) | Full (hw CRC asm, pipelined LDP) | Partial (Zbc CLMUL inline asm, 16B/iter, merged) |
| CRC32C (Castagnoli) | Full (SSE4.2 hw CRC) | Full (hw CRC asm) | Missing in trunk (open PR #8371) |
| bswap32 / bswap64 | Full (bswap asm) | Full (rev asm) | Scalar (GCC __builtin_bswap, correct, not tuned) |
| Erasure coding (ISA-L) | Full (ISA-L native, optimized) | Full (ISA-L native, optimized) | Missing (ISA-L unavailable for riscv64; falls back to Java) |
| AES-256-CTR (OpenSSL) | Full (AES-NI hw) | Full (ARMv8 AES hw) | Scalar (OpenSSL T-table, no Zkn/Zvkned activation) |
| Compression (zlib, bzip2, snappy, lz4, zstd) | Scalar (system libraries) | Scalar (system libraries) | Scalar (system libraries) |
| Build system detection | Full | Full | Full (CMakeLists.txt riscv64/riscv32 regex) |
| Dev container Dockerfile | Full | Full (Dockerfile_ubuntu_24_aarch64) | Absent |

The operationally significant gaps are:
1. **CRC32C not in trunk** -- CRC32C is the default checksum for HDFS data blocks. The software fallback works but carries a performance penalty on riscv64 for every HDFS read/write.
2. **Erasure coding unavailable** -- ISA-L is a hard dependency for the native EC path. On riscv64, any HDFS deployment using erasure-coded storage will run the Java software EC path, which is substantially slower.

---

## 7. CI/CD Infrastructure

All 13 GitHub Actions workflow files in `apache/hadoop` (`.github/workflows/`) were read directly from the trunk branch. None contain any reference to "riscv", "riscv64", "RISCV", "qemu", multi-arch Docker buildx, or any architecture-specific runner label.

All runners are:
- `ubuntu-24.04` (primary build and test)
- `ubuntu-latest`
- `ubuntu-slim`

The `tmpl_cloud_aws.yml` template accepts a parameterized `runner_os` input, but the only caller (`cloud_aws.yml`) passes `ubuntu-24.04`.

Checked and absent:
- `.gitlab-ci.yml` -- does not exist (404)
- `Jenkinsfile` -- does not exist (404)
- `.cirrus.yml` -- does not exist (404)

**Conclusion:** Apache Hadoop has zero riscv64 CI. All RISC-V testing in the merged PRs was performed by contributors on private hardware or QEMU, outside the project's automated CI. No riscv64 build, unit test, or integration test runs on any merge or pull request.

---

## 8. Distribution and Release Status

### 8.1 Apache official releases

Source: [downloads.apache.org/hadoop/common/](https://downloads.apache.org/hadoop/common/)

Latest release: 3.5.0 (2026-04-01). Files shipped:
- `hadoop-3.5.0.tar.gz` -- generic/x86_64 binary
- `hadoop-3.5.0-aarch64.tar.gz` -- the only named-architecture binary variant
- `hadoop-3.5.0-src.tar.gz`

No riscv64 tarball exists in 3.5.0 or any prior release. The Apache project has published architecture-specific binaries only for aarch64 (since 3.3.x series). No riscv64 tarball has ever appeared in any release directory.

The RISC-V native code (PRs #7796, #7809, #7903, #8031) has merged into `trunk` (Hadoop 4.x), not any 3.x release branch. Hadoop 4.x has no GA release. There is no riscv64-named tarball in any release, and there is no confirmed plan to produce one [NEEDS VERIFICATION: no official roadmap document found].

### 8.2 Package managers and distributions

| Source | riscv64 Status |
|---|---|
| [Apache dist server](https://downloads.apache.org/hadoop/common/) | Absent -- only generic + aarch64 tarballs |
| GitHub Releases (apache/hadoop) | Not applicable -- zero GitHub Release assets exist; all distribution is via Apache dist server |
| [PyPI](https://pypi.org/pypi/apache-hadoop/json) | Absent -- apache-hadoop package does not exist on PyPI (404) |
| [Ubuntu 24.04 noble](https://packages.ubuntu.com/) | Absent -- Hadoop not packaged in Ubuntu |
| [Debian](https://tracker.debian.org/pkg/hadoop) | Absent -- Hadoop package removed from all active Debian distributions |
| [Arch Linux RISC-V port](https://archriscv.felixc.at/) | Absent -- not listed |

**Summary:** No riscv64 binary for Apache Hadoop exists in any verified distribution channel. Hadoop is a JVM application and can run on any JVM with riscv64 support (OpenJDK riscv64 is available in Debian/Ubuntu/Fedora since JDK 11), but no pre-built distribution targeting riscv64 is published by Apache or any downstream distributor.

---

## 9. Dependencies

### 9.1 Dependency status table

| Dependency | Role in Hadoop | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| OpenJDK / JNI | Primary runtime + JNI bridge | Green | Green | Green (Debian/Ubuntu/Fedora) | None (see separate OpenJDK report) |
| zlib | Compression codec, CRC support | Green | Green | Green (packaged in all major distros) | None |
| OpenSSL / libcrypto | AES-256-CTR encryption of HDFS data at rest and in-flight | Green (builds) | Yellow (QEMU CI only; test hang at high parallelism [#22166](https://github.com/openssl/openssl/issues/22166); test_lhash flaky [#30880](https://github.com/openssl/openssl/issues/30880)) | Green (packaged) | AES T-table not constant-time without Zkn/Zvkned ([PRs #31080](https://github.com/openssl/openssl/pull/31080), [#31082](https://github.com/openssl/openssl/pull/31082)); cross-compile with no-deprecated broken ([#29357](https://github.com/openssl/openssl/issues/29357)) |
| BZip2 | Optional compression codec | Green | Green | Green | None |
| ISA-L (Intel Storage Acceleration Library) | Erasure coding (Reed-Solomon, GF math, CRC) -- HDFS EC fast path | Yellow (portable C builds; RVV paths require GCC >= 12.1) | Red (no CI; [PR #324](https://github.com/intel/isa-l/pull/324) "add RISCV CI" closed abandoned April 2025) | Red (no riscv64 packages in any distro) | RISC-V officially unsupported ([issue #239](https://github.com/intel/isa-l/issues/239) open since April 2023); 6 RISC-V PRs all closed abandoned Feb-Mar 2026 (adler32 RVV [#390](https://github.com/intel/isa-l/pull/390), erasure code [#387](https://github.com/intel/isa-l/pull/387), CRC Zvbc [#350](https://github.com/intel/isa-l/pull/350), CRC zbc/zbb [#299](https://github.com/intel/isa-l/pull/299)); no active maintainer-driven RISC-V effort |
| PMDK / libpmem | Persistent memory (NVM) storage path for HDFS on PMEM hardware | Red | Red | Red | PMDK repository archived November 12, 2025 (read-only, EOL); zero RISC-V issues or PRs ever filed; HDFS PMEM storage path is unavailable on riscv64 and has no viable path forward |
| LZ4 | Compression codec for HDFS blocks and MapReduce intermediate data | Yellow (basic riscv64 support merged October 2023, [PR #1298](https://github.com/lz4/lz4/pull/1298); LZ4_FAST_DEC_LOOP not enabled [#1686](https://github.com/lz4/lz4/pull/1686), [#1739](https://github.com/lz4/lz4/pull/1739)) | Yellow | Yellow | Decompression throughput gap until LZ4_FAST_DEC_LOOP + RVV PRs merge; no correctness blockers |
| Zstd | HDFS block compression codec | Yellow (basic arch detection merged December 2025, [PR #4525](https://github.com/facebook/zstd/pull/4525); huf_decompress 4-way loop not enabled [#4622](https://github.com/facebook/zstd/pull/4622); unaligned access unhandled [#4546](https://github.com/facebook/zstd/issues/4546)) | Yellow | Yellow | 6 open performance PRs (Feb-May 2026); none blocking correctness |
| Snappy | Optional compression codec | Yellow (pure C fallback builds; RVV fast path not merged; 2 open RVV PRs [#233](https://github.com/google/snappy/pull/233), [#235](https://github.com/google/snappy/pull/235) April 2026) | Yellow | Yellow | No correctness blockers; throughput gap |
| LevelDB | HDFS NameNode local metadata persistence | Yellow (riscv64 build failure resolved, [issue #1058](https://github.com/google/leveldb/issues/1058) closed September 2022; no open riscv64 issues) | Green | Green (packaged in Debian/Ubuntu) | None |
| libdl / pthreads / librt | Dynamic linker and threading (glibc-provided) | Green | Green | Green | None |

### 9.2 Hard blockers for production deployment

Two dependencies represent hard functional blockers for specific Hadoop features on riscv64:

**ISA-L:** The HDFS erasure coding native fast path is unavailable on riscv64. All RISC-V PRs to intel/isa-l were closed abandoned in early 2026 with no replacement activity. A RISC-V-capable ISA-L must be produced either by forking ISA-L or contributing to a community port before the HDFS EC native path can function on riscv64. The fallback Java software EC path works but is a significant performance regression for EC-heavy HDFS workloads.

**PMDK:** The HDFS persistent memory storage path is permanently unavailable. PMDK was archived in November 2025. This only affects deployments using NVM/PMEM hardware, but on such deployments the feature cannot be enabled on riscv64 under any circumstances.

---

## 10. Ecosystem Status

### 10.1 RISE Project involvement

Apache Hadoop is not listed as a RISE project, working group item, or blog topic. The RISE Python Wheel Builder package list (~80 packages) does not include Hadoop. No RISE blog posts (27 reviewed, May 2024 through June 2026) mention Hadoop. The contributor Peter Pan (PeterPtroc) is affiliated with ISCAS (gongxiaofei24@iscas.ac.cn), and ISCAS is a RISE General Member, but this affiliation is between an individual contributor and ISCAS -- there is no formal RISE project engagement with Apache Hadoop.

### 10.2 Contributor base

The RISC-V port is driven by two individuals:

- **Lei Wen (leiwen2025):** Initiated the campaign, filed HADOOP-19623, landed the Maven build fix (HADOOP-19615) and the bswap fix (HADOOP-19616). Public GitHub profile shows no company affiliation [NEEDS VERIFICATION].
- **Peter Pan (PeterPtroc / gong-flying):** Landed the CRC32 scaffolding (HADOOP-19663) and the Zbc bulk CRC32 path (HADOOP-19724). ISCAS email (gongxiaofei24@iscas.ac.cn) confirmed in commit authorship.

The reviewing committer for native code is Steve Loughran (steveloughran), who merged three of the four landed RISC-V PRs. No other PMC member has reviewed RISC-V-specific native code.

The contributor base is thin. Attrition of either leiwen2025 or PeterPtroc would stall the port. No second reviewer for RISC-V native code exists in the confirmed PMC list based on the available data.

---

## 11. Known Bugs and Active Issues

### 11.1 Open performance issues

**CRC32 small-buffer regression (merged, no fix planned short-term)**

[PR #8031](https://github.com/apache/hadoop/pull/8031) introduced a performance regression for small CRC32 buffers. Benchmarks from the PR on riscv64 (SG2380/EulixOS, JDK 17 BiSheng, Linux 6.12), using `org.apache.hadoop.util.Crc32PerformanceTest` with 64 MB data, 5 trials:

| bpc | Before (software, MB/s) | After (Zbc, MB/s) | Delta |
|---|---|---|---|
| 32 | 661.5 | 463.5 | -30% |
| 64 | 793.9 | 318.0 | -60% |
| 128 | 878.8 | 2,398.8 | +173% |
| 512 | 923.6 | 3,328.9 | +260% |
| 4,096 | 969.9 | 3,654.5 | +277% |
| 8,192 | 973.6 | 4,008.1 | +312% |
| 32,768 | 972.2 | 4,205.7 | +333% |
| 65,536 | 976.3 | 4,226.6 | +333% |

The crossover point is approximately bpc=128. The PR author acknowledged the small-buffer regression and deferred bpc-size-specific dispatch to a future RVV-based follow-up. No size-threshold dispatch is planned in the current scalar Zbc path.

**CRC32C small-buffer regression (open PR, unresolved)**

[PR #8371](https://github.com/apache/hadoop/pull/8371) shows a more severe regression for small CRC32C buffers. Benchmarks from the PR on the same platform:

| bpc | Before (software, MB/s) | After (Zbc, MB/s) | Delta |
|---|---|---|---|
| 32 | ~695 | ~70 | -90% |
| 64 | ~830 | ~748 | -10% |
| 128 | ~916 | ~693 | -24% |
| 256 | ~872 | ~2,982 | +242% |
| 1,024 | ~1,007 | ~3,597 | +257% |
| 4,096 | ~1,029 | ~4,562 | +344% |
| 16,384 | ~1,035 | ~5,706 | +451% |
| 65,536 | ~1,038 | ~6,236 | +484% |

The crossover point is ~bpc=256, significantly later than in the CRC32 path. The -90% regression at bpc=32 is unresolved and has not been addressed in the current PR.

Note: PR #8371 also has an open reviewer question about whether JDK intrinsics (which may themselves activate hardware CRC32C on riscv64) make this Hadoop native path redundant. The author committed to producing a JDK-builtin vs. native comparison benchmark; those results have not been posted as of the available data.

### 11.2 Open JIRA issues

| Issue | Title | Priority | Status |
|---|---|---|---|
| [HADOOP-19849](https://issues.apache.org/jira/browse/HADOOP-19849) | [RISC-V] Zbc-accelerated native CRC32C path | Major | Open |
| [HADOOP-19666](https://issues.apache.org/jira/browse/HADOOP-19666) | CRC32 hardware acceleration using v, zbc, zvbc (RVV path) | Major | Open |
| [HADOOP-19655](https://issues.apache.org/jira/browse/HADOOP-19655) | Add RISC-V Zbc CLMUL hardware-accelerated CRC32/CRC32C | Major | Open |
| [HADOOP-19623](https://issues.apache.org/jira/browse/HADOOP-19623) | RISC-V Architecture Support (umbrella) | Major | Open |
| [HADOOP-17529](https://issues.apache.org/jira/browse/HADOOP-17529) | Update os-maven-plugin to 1.7.0 for RISC-V (original, 2021) | Minor | Open |

HADOOP-19666 is marked as a duplicate of HADOOP-19655 by the JIRA tracker, but both remain open/unresolved.

### 11.3 No correctness bugs found

No NaN/floating-point correctness bugs, endianness defects, or data corruption issues specific to RISC-V were identified in the Hadoop issue tracker based on the available search results. TestNativeCrc32 (22 tests) passes on riscv64 hardware for all merged code.

---

## 12. Objections and Upstream Blockers

### 12.1 PR #8371 (CRC32C) -- two open objections

**Objection 1 -- JDK intrinsic redundancy (reviewer pan3793, 2026-03-31):** Modern JDKs may activate hardware CRC32C via built-in intrinsics on riscv64 hardware that supports the appropriate extension. If the JDK already provides hardware acceleration, the Hadoop native layer duplicates effort and adds maintenance burden for no gain. The PR author committed to benchmarking JDK built-in vs. Hadoop native CRC32C on riscv64; results have not been published as of the available data. This objection must be resolved before the PR can be approved.

**Objection 2 -- No new tests (Yetus CI, all runs):** The Yetus pre-commit tool reports `-1 test4tests` because no new automated tests accompany the new CRC32C code path. This is the sole CI failure blocking merge, and it is consistent with the pattern in prior RISC-V PRs (#7903, #8031) where the same flag was raised and overridden by the reviewer on the basis of scaffolding-only or platform-hardware-dependent test limitations. However, for a correctness-critical path like CRC32C, the objection has more weight.

### 12.2 CI infrastructure unavailability

The Apache Hadoop CI does not have riscv64 runners. Apache Infrastructure does not operate riscv64 build agents. The Hadoop PMC has not established a plan for riscv64 CI based on available data [NEEDS VERIFICATION: no public discussion thread found]. Without CI, every RISC-V patch requires manual hardware testing by contributors before submission, and regression detection after merge is nonexistent.

### 12.3 ISA-L has no upstream solution

ISA-L is controlled by Intel. Intel has not publicly committed to riscv64 support. All community RISC-V contributions to ISA-L were closed abandoned in early 2026. There is no upstream path visible for riscv64 ISA-L. A deployment requiring HDFS erasure coding hardware acceleration on riscv64 must either fork ISA-L or accept the Java software fallback indefinitely.

### 12.4 PMDK is EOL

PMDK was archived November 12, 2025. The HDFS PMEM feature is permanently blocked on riscv64. This is relevant only for PMEM-equipped server deployments; standard storage deployments are unaffected.

### 12.5 Small contributor base

Two individuals account for all RISC-V-specific commits. Steve Loughran is the only active PMC reviewer for native code. There is no rotation, no second reviewer familiar with RISC-V intrinsics, and no succession plan visible in the available data.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The Hadoop Java core requires no investment -- it runs on any OpenJDK riscv64 build. The native layer needs three items to reach feature parity with aarch64:

1. **CRC32C Zbc acceleration (trunk):** Requires resolving the two objections in PR #8371. The implementation exists. The primary work is: (a) produce the JDK built-in vs. native benchmark that reviewer pan3793 requested, (b) add targeted automated tests, and (c) address the small-buffer regression or document the threshold policy. Estimated as 2-3 person-weeks of engineering for the benchmark, test work, and review cycle.

2. **ISA-L riscv64 support:** This is the largest functional gap. Intel has made no commitment to riscv64 ISA-L. A riscv64 ISA-L port requires contributing Galois field arithmetic, Reed-Solomon encode/decode, and CRC primitives for riscv64 to the ISA-L repository -- or maintaining a fork. Prior community PRs (Feb-Mar 2026) were closed without review, suggesting Intel is not actively reviewing RISC-V contributions. The effort is large (estimated 8-16 person-weeks for the core GF and RS primitives) and the upstreaming path is uncertain. A fork carries ongoing maintenance overhead.

3. **Dev container / build tooling for riscv64:** PR #7924 (Dockerfile) was closed as stale. Without a standard container, every new contributor must manually configure QEMU + openEuler. This is a contributor friction issue that slows future contributions. Estimated 1-2 person-weeks to produce a working Dockerfile and integrate it with `start-build-env.sh`.

### 13.2 Performance Optimization

Current state on riscv64 (trunk):
- CRC32: Hardware Zbc CLMUL acceleration for buffers >= 128 bytes; software for smaller buffers. Measured throughput at large buffer sizes: ~4,000-4,200 MB/s vs. ~970 MB/s software baseline (approximately 4x at 8192-byte buffers [NEEDS VERIFICATION: PR #8031 reported "~4x vs software at 8192-byte buffers" as author summary]).
- CRC32C: Software only (pending PR #8371).
- All other hot paths: software (compression codecs, crypto).

The planned next tier -- RVV (V-extension) vectorized CRC using `vclmul`/`vclmulh` -- was abandoned in PR #7912 and is now tracked under HADOOP-19666 (Open). No implementation is in progress as of the available data. Hardware that supports Zvbc is required for this path; availability on current production riscv64 silicon is not confirmed in the research findings.

Performance optimization investments, in order of impact per effort:

1. **RVV CRC32/CRC32C (Zvbc):** Highest ceiling for HDFS I/O throughput. Requires a contributor with both RISC-V V-extension intrinsics expertise and Hadoop native code familiarity. Prior attempt (PR #7912) shows the work is understood; it was closed for strategic reasons, not technical ones. Estimated 4-6 person-weeks for a merged implementation.
2. **Small-buffer CRC dispatch:** Adding a size threshold to skip the Zbc path for buffers < ~128 bytes (CRC32) or < ~256 bytes (CRC32C) eliminates the existing regressions. Straightforward change, estimated 1 person-week.

### 13.3 CI/CD Infrastructure

Zero riscv64 CI currently exists. Options:

1. **Self-hosted riscv64 runner for apache/hadoop:** Requires Apache Infrastructure cooperation and hardware provisioning. The RISE Project or member companies (SiFive, ISCAS, SpacemiT, etc.) could donate hardware or CI runner time. No such arrangement is in place based on available data.
2. **QEMU-based riscv64 CI on GitHub Actions:** Technically feasible using `tonistiigi/binfmt` + QEMU. Slow -- QEMU riscv64 emulation was described as unusable for benchmarking but functional for correctness testing. Could run TestNativeCrc32 and build validation. Estimated 2-3 person-weeks to integrate and tune, plus ongoing maintainer attention for QEMU slowness and flakiness.
3. **No CI:** Current state. All RISC-V patches are manually tested. Regression detection is nonexistent.

For production deployment use cases, option 1 (native hardware CI) is the only approach that provides confidence in performance characterization.

### 13.4 Ecosystem Enablement

| Item | Status | Investment Needed |
|---|---|---|
| OpenJDK riscv64 | Fully available since JDK 11; no work needed | None |
| zlib, bzip2, LevelDB | Available, no known issues | None |
| LZ4, Zstd, Snappy | Available, performance gaps vs. amd64/aarch64 | Upstream contribution to those projects (outside Hadoop scope) |
| OpenSSL riscv64 AES (Zkn/Zvkned) | Available in 3.x; hardware-dependent | None required within Hadoop |
| ISA-L riscv64 | No upstream support; all PRs abandoned | Fork or upstream contribution (large effort, uncertain outcome) |
| PMDK riscv64 | Permanently unavailable (archived) | No viable path |

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Resolve PR #8371 (CRC32C Zbc): JDK benchmark + tests + small-buffer regression | 2-3 | Hadoop native contributor | Critical |
| Functional | ISA-L riscv64 port: GF arithmetic, Reed-Solomon, CRC | 8-16 | ISA-L contributor + Hadoop integration | High |
| Functional | riscv64 dev container Dockerfile + start-build-env.sh integration | 1-2 | Hadoop build engineer | High |
| Performance | Small-buffer CRC dispatch threshold (eliminates -30% to -90% regressions) | 1 | Hadoop native contributor | High |
| Performance | RVV (Zvbc) vectorized CRC32/CRC32C | 4-6 | RISC-V ISA expert + Hadoop contributor | Medium |
| CI/CD | QEMU-based riscv64 CI on GitHub Actions (correctness testing) | 2-3 | Hadoop infra contributor | High |
| CI/CD | Native riscv64 hardware runner (performance CI) | N/A (hardware dependent) | Apache Infrastructure + hardware donor | Medium |
| Ecosystem | LZ4 LZ4_FAST_DEC_LOOP and RVV path (upstream lz4/lz4) | out of scope | LZ4 upstream | Low |
| Ecosystem | PMDK EOL -- no action possible | N/A | N/A | N/A |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [apache/hadoop GitHub repository](https://github.com/apache/hadoop)
- [HADOOP-19623 (umbrella: RISC-V Architecture Support)](https://issues.apache.org/jira/browse/HADOOP-19623)
- [HADOOP-19615 (os-maven-plugin 1.7.1)](https://issues.apache.org/jira/browse/HADOOP-19615)
- [HADOOP-19616 (bswap)](https://issues.apache.org/jira/browse/HADOOP-19616)
- [HADOOP-19663 (CRC32 scaffolding)](https://issues.apache.org/jira/browse/HADOOP-19663)
- [HADOOP-19724 (CRC32 Zbc)](https://issues.apache.org/jira/browse/HADOOP-19724)
- [HADOOP-19849 (CRC32C Zbc)](https://issues.apache.org/jira/browse/HADOOP-19849)
- [HADOOP-19655 (CRC32/CRC32C Zbc, parent)](https://issues.apache.org/jira/browse/HADOOP-19655)
- [HADOOP-19666 (RVV CRC32)](https://issues.apache.org/jira/browse/HADOOP-19666)
- [HADOOP-17529 (original riscv os-maven, 2021)](https://issues.apache.org/jira/browse/HADOOP-17529)
- [PR #7796 -- os-maven-plugin 1.7.1](https://github.com/apache/hadoop/pull/7796)
- [PR #7809 -- bswap](https://github.com/apache/hadoop/pull/7809)
- [PR #7903 -- CRC32 scaffolding](https://github.com/apache/hadoop/pull/7903)
- [PR #8031 -- CRC32 Zbc implementation](https://github.com/apache/hadoop/pull/8031)
- [PR #8371 -- CRC32C Zbc (open)](https://github.com/apache/hadoop/pull/8371)
- [PR #7912 -- RVV CRC32 (closed stale)](https://github.com/apache/hadoop/pull/7912)
- [PR #7924 -- riscv64 Dockerfile (closed stale)](https://github.com/apache/hadoop/pull/7924)
- [ISA-L issue #239 (RISC-V support question, open since April 2023)](https://github.com/intel/isa-l/issues/239)
- [ISA-L PR #324 (RISC-V CI, closed abandoned)](https://github.com/intel/isa-l/pull/324)
- [Apache Hadoop 3.5.0 release directory](https://downloads.apache.org/hadoop/common/hadoop-3.5.0/)
- [bulk_crc32_riscv.c (trunk)](https://github.com/apache/hadoop/blob/trunk/hadoop-common-project/hadoop-common/src/main/native/src/org/apache/hadoop/util/bulk_crc32_riscv.c)
- [CMakeLists.txt with riscv detection (trunk)](https://github.com/apache/hadoop/blob/trunk/hadoop-common-project/hadoop-common/src/CMakeLists.txt)
- [BUILDING.txt (trunk)](https://github.com/apache/hadoop/blob/trunk/BUILDING.txt)
- [RISE Project member list](https://riseproject.dev)