---
title: Apache Hadoop
parent: Project Reports
color: orange
dependencies:
  - name: OpenJDK
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: critical
  - name: bzip2
    relation: runtime-dependency
    criticality: optional
  - name: ISA-L
    relation: runtime-dependency
    criticality: optional
  - name: PMDK
    relation: runtime-dependency
    criticality: optional
  - name: LZ4
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: snappy
    relation: runtime-dependency
    criticality: optional
  - name: leveldb
    relation: runtime-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: Maven
    relation: build-dependency
    criticality: critical
  - name: os-maven-plugin
    relation: build-dependency
    criticality: critical
  - name: Boost
    relation: runtime-dependency
    criticality: optional
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: critical
  - name: Cyrus SASL
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="apache-hadoop" %}

# Apache Hadoop

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Apache Hadoop<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Apache Hadoop is a top-level project of the Apache Software Foundation (ASF), licensed under Apache License 2.0. The canonical repository is [apache/hadoop](https://github.com/apache/hadoop). The primary development branch is `trunk` (Hadoop 4.x).

Hadoop is architecturally split into two layers for portability purposes:

- **Java core:** architecture-neutral, runs on any JVM with riscv64 support. This layer requires no porting work.
- **Native (C/JNI) layer:** performance-critical operations including CRC32/CRC32C checksumming, byte-swap, erasure coding (via Intel ISA-L), and crypto (via OpenSSL). This layer requires explicit architecture-specific work.

All RISC-V porting effort to date targets the native layer exclusively.

**Governance:** The PMC is volunteer-based and merit-driven; the project's own `who.html` roster page states explicitly "we are non-paid volunteers." Coordination is via dev@hadoop.apache.org and [Apache JIRA](https://issues.apache.org/jira/browse/HADOOP). No MAINTAINERS/OWNERS/CODEOWNERS/PLATFORMS.md/SUPPORT.md file exists anywhere in the repository - confirmed by direct repository inspection. Historical and current corporate affiliations represented on the PMC/committer rosters include Hortonworks, Cloudera, Microsoft, LinkedIn, Google, Facebook, Twitter, Netflix, NTT DATA, NVIDIA, and LY Corporation. No single company controls the project.

**Community culture on new ports:** Pragmatically accepting but not systematized. The umbrella ticket [HADOOP-19623](https://issues.apache.org/jira/browse/HADOOP-19623) shows the RISC-V port is recognized and tracked, and committer Steve Loughran (steveloughran) has personally reviewed and merged the RISC-V native PRs. Scrutiny is real, not a rubber stamp: the open CRC32C PR [#8371](https://github.com/apache/hadoop/pull/8371) is blocked on a reviewer's objection about whether the work duplicates JDK-native intrinsics, plus a "no new tests" CI flag - i.e., new-architecture contributions are welcomed but must justify themselves and carry test coverage, especially on a correctness-critical path like checksumming.

**RISE Project:** Apache Hadoop is not a RISE Project member and has no RISE affiliation. Checks against the RISE blog (35 posts enumerated via the site's own sitemap, plus the site's internal search for "hadoop" returning "no results were found"), the RISE Python Wheel Builder (88 packages listed, none Hadoop - expected, since Hadoop is a JVM project, not Python-packaged), and the `riseproject-dev` GitHub organization (26 public repositories, including working-group repos such as `language-runtimes-wg`, `system-libraries-wg`, `distro-integration-wg`, and the `riscv-runner`/`riscv-runner-images` CI infrastructure repos) all show zero Hadoop presence. RISE Premier Members include Google LLC, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent, and Alibaba Damo Academy; RISE General Members include ZTE Corporation and the Institute of Software, Chinese Academy of Sciences (ISCAS) - both are the institutional affiliations of the two individuals who drive Hadoop's RISC-V port (see Section 2).

## 2. Port History and Upstreaming Timeline

The RISC-V porting effort has two distinct phases: a dormant early-discussion phase (2021-2022) and an active implementation campaign that began July 2025 and continues to the present.

### Phase 1: Dormant (2021-2022)

| Date | Event |
|---|---|
| 2021-02-14 | [HADOOP-17529](https://issues.apache.org/jira/browse/HADOOP-17529) opened by Ivan Serdyuk: "Update os-maven-plugin to 1.7.0 to support RISC-V architecture (JDK11)." Associated PRs never merged. Ticket remains Open. |
| 2022-06-06 | [HADOOP-18275](https://issues.apache.org/jira/browse/HADOOP-18275) merged by Steve Loughran: upgrades os-maven-plugin to 1.7.0, incidentally adding riscv64 Maven platform detection. Earliest merged commit with implicit RISC-V relevance. |

### Phase 2: Active (July 2025 - present)

The active campaign was initiated by **Lei Wen (leiwen2025)**. His commit `d3690f0` (HADOOP-19615, 2025-07-16) is authored under the email `lei.wen2@zte.com.cn`, confirming affiliation with **ZTE Corporation**, a RISE General Member; his public GitHub profile itself carries no bio or company field. **Peter Pan (PeterPtroc / gong-flying)**, co-author of commit `c1de2db` (HADOOP-19724), uses the email `gongxiaofei24@iscas.ac.cn`, confirming affiliation with **ISCAS**, also a RISE General Member. No formal RISE Project sponsorship or working-group assignment was found for either individual's Hadoop work - this is individual-contributor affiliation with RISE member companies, not a RISE-funded or RISE-coordinated effort.

Umbrella tracker: [HADOOP-19623](https://issues.apache.org/jira/browse/HADOOP-19623) "RISC-V Architecture Support" - Open, Major, created 2025-07-15 by Lei Wen, no fix version, last JIRA activity 2025-07-23 (the umbrella ticket itself has gone stale even though later work landed under the same theme).

| Date | JIRA | PR | Description | Status |
|---|---|---|---|---|
| 2025-07-11 | [HADOOP-19615](https://issues.apache.org/jira/browse/HADOOP-19615) | [#7796](https://github.com/apache/hadoop/pull/7796) | Upgrade os-maven-plugin to 1.7.1, fixing "unknown os.arch: riscv64" Maven build failure | Merged 2025-07-16; fix version 3.5.0 |
| 2025-07-11 | [HADOOP-19616](https://issues.apache.org/jira/browse/HADOOP-19616) | [#7809](https://github.com/apache/hadoop/pull/7809) | Add bswap support for RISC-V, fixing assembler error "unrecognized opcode 'bswap a4'" | Merged 2025-07-23; fix version 3.5.0 |
| 2025-07-15 | [HADOOP-19623](https://issues.apache.org/jira/browse/HADOOP-19623) | - | Umbrella: RISC-V Architecture Support | Open |
| 2025-08-26 | [HADOOP-19663](https://issues.apache.org/jira/browse/HADOOP-19663) | [#7903](https://github.com/apache/hadoop/pull/7903) | [Part 1] CRC32 build scaffolding | Merged 2025-10-09; fix version 3.5.0 |
| 2025-10-13 | [HADOOP-19724](https://issues.apache.org/jira/browse/HADOOP-19724) | [#8031](https://github.com/apache/hadoop/pull/8031) | rv64 Zbc (CLMUL) bulk CRC32 acceleration | Merged 2026-02-06; fix version 3.5.0 |
| 2026-03-23 | [HADOOP-19849](https://issues.apache.org/jira/browse/HADOOP-19849) | [#8371](https://github.com/apache/hadoop/pull/8371) | rv64 Zbc (CLMUL) bulk CRC32C acceleration | **Open**, unchanged since 2026-03-31, no approvals |

Closed/abandoned PRs (superseded or stale):

| PR | Description | Closed | Reason |
|---|---|---|---|
| [#7787](https://github.com/apache/hadoop/pull/7787) | bswap: RISC-V support (first attempt) | 2025-10-18 | Superseded by #7809 |
| [#7896](https://github.com/apache/hadoop/pull/7896) | Zbc CLMUL CRC32/CRC32C monolithic PR | 2025-12-09 | Superseded by incremental #7903 + #8031 + #8371 |
| [#7912](https://github.com/apache/hadoop/pull/7912) | CRC32 via v/zbc/zvbc (RVV approach) | 2026-03-01 | Auto-closed stale after 100 days idle; strategy shifted to scalar-first |
| [#7924](https://github.com/apache/hadoop/pull/7924) | WIP riscv64 dev container Dockerfile | 2026-02-20 | Closed stale |
| [#7842](https://github.com/apache/hadoop/pull/7842) | Missing LevelDB deps in hadoop-hdfs (surfaced by riscv64 builds) | 2025-10-13 | Closed unmerged |

**Upstreaming status:** all four merged PRs (#7796, #7809, #7903, #8031) landed in `trunk` and carry a `3.5.0` fix version. No RISC-V work has been backported to any 3.4.x branch. As of 2026-09-30, no new genuine RISC-V PRs, JIRA issues, or commits have appeared beyond this set; #8371 remains the only open item.

## 3. Upstream Support Tier

Hadoop has no formal platform tier system. No `PLATFORMS.md`, `SUPPORT.md`, or equivalent classification document exists in the repository (confirmed by direct repository inspection). Platform support is de facto: a port is accepted if it builds, passes Yetus CI, and does not break other platforms.

The open umbrella ticket HADOOP-19623 signals the port is recognized as an ongoing, tracked effort, and committer Steve Loughran has merged three of the four landed PRs, acting as the de-facto native-code reviewer for this work.

| | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes (all GitHub Actions jobs) | No (no aarch64-specific runner found beyond a build-only Dockerfile) | No |
| Release-blocking | Yes | No (no tier gate found) | No |
| Official binary | Yes (generic tarball) | Yes (`-aarch64` tarball) | No |
| Formal tier document | None exists | None exists | None exists |

**Effective tier:** community-supported, no CI, no official binary - functionally comparable to an informal "tier 3" in projects that use explicit tier language, though Hadoop has no such classification.

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 CRC32 (zlib polynomial) - partial, hardware-accelerated

File: [`bulk_crc32_riscv.c`](https://github.com/apache/hadoop/blob/trunk/hadoop-common-project/hadoop-common/src/main/native/src/org/apache/hadoop/util/bulk_crc32_riscv.c), 245 lines, merged via [PR #8031](https://github.com/apache/hadoop/pull/8031) (2026-02-06). Direct fetch and line-by-line inspection confirm this is a genuine, non-stub implementation: `grep` for TODO/FIXME/stub/not-implemented markers returns zero matches. It uses GCC inline assembly with `.option arch, +zbc` directives to emit `clmul`/`clmulh` instructions from the RISC-V Zbc scalar carry-less-multiply extension.

Implementation details:
- Main loop: 16-byte/iteration carry-less-multiply folding with Barrett-style reduction
- `rv_clmul()` / `rv_clmulh()` wrappers via `__asm__ volatile`
- 1-to-3 block pipelining (`pipelined_crc32_zlib`)
- Bitwise fallback for short/tail/misaligned data
- Runtime detection: `__attribute__((constructor))` reads `/proc/cpuinfo` for the `"zbc"` substring and sets the `pipelined_crc32_zlib_func` function pointer accordingly
- Guard: `#if defined(__riscv) && (__riscv_xlen == 64)`

No RVV (V-extension) path exists in trunk. [PR #7912](https://github.com/apache/hadoop/pull/7912) (HADOOP-19666, the RVV/vector approach using `vclmul.v`/`vclmulh.v` with a kernel-probe + `/proc/cpuinfo` runtime check, claimed >3x over software) was auto-closed stale on 2026-03-01 after 100 days of inactivity; no replacement PR has been opened, and HADOOP-19666 remains Open with no active implementation.

**Rating vs. amd64/aarch64, corrected:** riscv64 is not behind amd64 here. Direct inspection of `bulk_crc32_x86.c` shows amd64 registers only a hardware `pipelined_crc32c_func` (via SSE4.2's `crc32` instruction, which is Castagnoli-only); the zlib-polynomial CRC32 path on amd64 stays on the software slicing-by-8 table implementation in all cases, because x86 has no hardware instruction for that polynomial. riscv64's Zbc CLMUL path is therefore a genuine hardware-accelerated implementation for zlib CRC32 where amd64 has none. aarch64's `bulk_crc32_aarch64.c` assigns both `pipelined_crc32c_func` and `pipelined_crc32_zlib_func` from ARMv8's native CRC32 extension, giving aarch64 full hardware coverage of both polynomials; the aarch64 file uses per-width `CRC32CX`/`CRC32ZX` inline-asm macros rather than a 128-bit LDP-based pipeline [lower-confidence characterization, not corroborated by code search this pass - treat the exact instruction sequence as informational rather than load-bearing].

### 4.2 CRC32C (Castagnoli polynomial) - missing in trunk

No riscv64 hardware CRC32C path exists in `trunk`; there is no riscv `pipelined_crc32c_func` assignment anywhere in the merged code. [PR #8371](https://github.com/apache/hadoop/pull/8371) (HADOOP-19849, opened 2026-03-23) adds a Zbc CLMUL CRC32C path with a bitwise fallback for small/misaligned data, pipelined processing for larger blocks, and runtime Zbc detection - but it remains open and unmerged as of 2026-09-30 (see Sections 11 and 12). aarch64 and amd64 both have full hardware CRC32C support in trunk today. riscv64 falls back to software for every CRC32C operation, which is the default checksum algorithm for HDFS data blocks.

### 4.3 bswap (byte-swap, MapReduce NativeTask) - scalar/compiler builtin

File: `hadoop-mapreduce-project/.../nativetask/src/main/native/src/lib/primitives.h`. [PR #7809](https://github.com/apache/hadoop/pull/7809) adds `defined(__riscv)` to the shared `#elif` fallback chain (alongside ppc64/loongarch64), routing riscv64 through `__builtin_bswap32`/`__builtin_bswap64` (compiler builtins), not hand-written assembly. amd64 and aarch64 both use dedicated, hand-written inline-asm branches (`bswap`/`rev`) in the same file. The originating bug was a hard build failure: `Error: unrecognized opcode 'bswap a4'` on riscv64, since standard byte-swap relied on a compiler intrinsic unavailable there.

**Rating vs. amd64/aarch64:** functional parity, not performance-tuned; riscv64 is the only one of the three sharing a generic multi-architecture fallback rather than getting its own dedicated asm branch.

### 4.4 Erasure coding (ISA-L / Reed-Solomon) - missing/broken

Hadoop's erasure coding path (`io/erasurecode/`) delegates entirely to Intel ISA-L (`libisal`) via `dlopen`, with no architecture-specific guards in the Hadoop source - the `dlopen` call is attempted unconditionally on every platform. On riscv64 this call fails at runtime because no riscv64-capable ISA-L build exists from Intel, and every community PR adding riscv64 support to `intel/isa-l` has been closed abandoned (Section 9). When ISA-L is unavailable, Hadoop falls back to a slower, pure-Java software erasure-coding path.

### 4.5 Crypto (OpenSSL AES-256-CTR) - scalar, delegated

`OpensslCipher.c` and `OpensslSecureRandom.c` contain no architecture guards and call OpenSSL via the EVP API. On riscv64, OpenSSL 3.x provides scalar (T-table) AES because base RISC-V has no AES instructions; hardware AES requires the Zkn/Zvkned extensions, which are not universally present on current riscv64 silicon. The T-table path is not constant-time on hardware lacking Zkn/Zvkned - a side-channel risk in the underlying OpenSSL library rather than in Hadoop's own code. Hadoop does not require AES acceleration to be functionally correct.

### 4.6 Build system architecture detection

`hadoop-common-project/hadoop-common/src/CMakeLists.txt` (lines 128-137), confirmed against a fresh clone of trunk (commit `997fa7c1`):

```cmake
if(CMAKE_SYSTEM_PROCESSOR MATCHES "^i.86$" OR CMAKE_SYSTEM_PROCESSOR STREQUAL "x86_64" OR CMAKE_SYSTEM_PROCESSOR STREQUAL "amd64")
  set(BULK_CRC_ARCH_SOURCE_FIlE "${SRC}/util/bulk_crc32_x86.c")
elseif(CMAKE_SYSTEM_PROCESSOR STREQUAL "aarch64")
  set(BULK_CRC_ARCH_SOURCE_FIlE "${SRC}/util/bulk_crc32_aarch64.c")
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "^riscv64" OR CMAKE_SYSTEM_PROCESSOR MATCHES "^riscv32")
  set(BULK_CRC_ARCH_SOURCE_FIlE "${SRC}/util/bulk_crc32_riscv.c")
else()
  message("No HW CRC acceleration for ${CMAKE_SYSTEM_PROCESSOR}, falling back to SW")
endif()
```

(`BULK_CRC_ARCH_SOURCE_FIlE` is an upstream typo, present throughout the file, harmless.) Both riscv32 and riscv64 route to the same `bulk_crc32_riscv.c`. A repo-wide code search confirms exactly one arch-named native `.c` file per architecture (`bulk_crc32_x86.c`, `bulk_crc32_aarch64.c`, `bulk_crc32_riscv.c`) - file-count parity is 1:1:1, i.e. riscv64 is not structurally behind the other two in number of arch-specific source files, only in which components those files cover.

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Native build toolchain requirements (from `BUILDING.txt`, root of repo - the only build documentation that exists; no `BUILDING.md`, `README.md`, `INSTALL`, or `docs/` directory exists)

| Dependency | Required version | Notes |
|---|---|---|
| CMake | 3.19+ | |
| GCC | 9.3.0+ | Required for `thread_local` storage support |
| JDK | 17 | |
| Maven | 3.9.15+ | Or `./mvnw` wrapper |
| Boost | 1.86.0 | |
| Protocol Buffers | 3.25.5 | Requires abseil-cpp 20230802.1 as a third-party dependency |
| zlib | any | Required |
| Cyrus SASL | any | Required |
| OpenSSL | any | Optional but recommended (needed for hadoop-pipes and best HDFS encryption performance) |

No riscv64-specific version minimums exist; the same table applies to every architecture. `BUILDING.txt` documents no `-DUSE_X=OFF`-style disable flags anywhere - the actual mechanism is opt-in fail-fast flags (`-Drequire.snappy`, `-Drequire.openssl`, `-Drequire.isal`, `-Drequire.pmdk`, each paired with `-D<lib>.prefix`/`-D<lib>.lib`/`-Dbundle.<lib>`), identical across all architectures. If an optional native library is absent and its `-Drequire.*` flag is not passed, the build silently produces `libhadoop.so` without that feature - this is the mechanism by which a riscv64 build without an available `libisal.so` succeeds but ships without native erasure coding.

### 5.2 Build commands (identical on riscv64; no arch-specific flags needed - architecture detection is automatic via the CMakeLists.txt regex in Section 4.6)

```bash
mvn package -Pdist,native -DskipTests -Dtar -Dmaven.javadoc.skip=true
mvn -Pnative -Dtest=org.apache.hadoop.util.TestNativeCrc32 test
```

Protobuf must be built from source (system packages are too old), verbatim per `BUILDING.txt`:

```bash
curl -L https://github.com/protocolbuffers/protobuf/archive/refs/tags/v3.25.5.tar.gz > protobuf-3.25.5.tar.gz
curl -L https://github.com/abseil/abseil-cpp/archive/refs/tags/20230802.1.tar.gz > abseil-cpp-20230802.1.tar.gz
tar -zxvf protobuf-3.25.5.tar.gz
tar -zxvf abseil-cpp-20230802.1.tar.gz --strip-components 1 -C protobuf-3.25.5/third_party/abseil-cpp
cd protobuf-3.25.5
cmake -S . -B build -DCMAKE_POSITION_INDEPENDENT_CODE=ON -Dprotobuf_BUILD_TESTS=OFF
cmake --build build --parallel $(nproc)
sudo cmake --install build
```

### 5.3 Cross-compilation, Docker, QEMU

No riscv64 Dockerfile exists in `dev-support/docker/`; the directory contains only `Dockerfile_debian_12`, `Dockerfile_debian_13`, `Dockerfile_rockylinux_8`, `Dockerfile_ubuntu_24`, `Dockerfile_ubuntu_24_aarch64`, and `Dockerfile_windows_10` (confirmed by a direct clone and `find`/`grep`, and independently by `search_code` returning zero hits for `riscv64 filename:Dockerfile`). The `start-build-env.sh` script and `BUILDING.txt` accept `CPU_ARCH` values of `x86_64`, `amd64`, `aarch64`, `arm64` only - `riscv64` is not a valid value and a riscv64 dev-container PR ([#7924](https://github.com/apache/hadoop/pull/7924)) was closed stale.

`BUILDING.txt`'s only cross-platform-container guidance covers amd64/aarch64 via `tonistiigi/binfmt`:

```
docker run --rm --privileged tonistiigi/binfmt --install amd64,arm64
CPU_ARCH=x86_64 ./start-build-env.sh ubuntu_24
```

There is no documented riscv64 QEMU workflow anywhere in the build system; a repo-wide case-insensitive search for "qemu" matches only an unrelated `package-lock.json` string and an image filename. Contributors (leiwen2025, PeterPtroc) tested on physical riscv64 hardware (SG2380/EulixOS) and, per PR #7903's review thread, via a manually configured QEMU + openEuler 25.03 riscv64 image (GCC, CMake, JDK 17 riscv64, Protobuf 2.5.0-with-patches then 3.25.5/abseil). Steve Loughran's review comment on [PR #7912](https://github.com/apache/hadoop/pull/7912) - "two people who are set up to build and test this on riscv hardware is exactly what we need" - indicates the project relies on contributor-owned hardware rather than any standardized or documented environment.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| CRC32 (zlib) | Scalar (software sb8 table; no HW zlib-CRC instruction exists on x86) | Full (native ARMv8 CRC32 extension) | Partial (Zbc CLMUL inline asm, hardware-accelerated for buffers >= 128 bytes, merged) |
| CRC32C (Castagnoli) | Full (SSE4.2 hw `crc32` insn) | Full (native ARMv8 CRC32C extension) | Missing in trunk (open PR #8371) |
| bswap32 / bswap64 | Full (dedicated `bswap` asm) | Full (dedicated `rev` asm) | Scalar (shared `__builtin_bswap` fallback with ppc64/loongarch64) |
| Erasure coding (ISA-L) | Full (native ISA-L) | Full (native ISA-L) | Missing (no riscv64 ISA-L; falls back to Java software EC) |
| AES-256-CTR (OpenSSL) | Full (AES-NI hw) | Full (ARMv8 AES hw) | Scalar (OpenSSL T-table; no Zkn/Zvkned activation) |
| Compression (zlib, bzip2, snappy, lz4, zstd) | Scalar (system libraries) | Scalar (system libraries) | Scalar (system libraries) |
| Build system detection | Full | Full | Full (CMakeLists.txt regex, automatic) |
| Dev container Dockerfile | Full | Full (`Dockerfile_ubuntu_24_aarch64`) | Absent |

Operationally significant gaps:
1. **CRC32C not in trunk.** CRC32C is the default HDFS block checksum. The software fallback is correct but carries a real per-read/write performance cost on riscv64.
2. **Erasure coding unavailable in native form.** ISA-L is a hard dependency for the native EC path; on riscv64 any HDFS deployment using erasure-coded storage runs the substantially slower Java software EC path.

No NaN/floating-point, endianness, or data-corruption defects specific to RISC-V were found in any search performed (see Section 11.3).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** This was verified twice independently: once via keyword search across all workflow files, and again via a fresh sparse clone of `.github/` at HEAD (`997fa7c1`, 2026-09-30) with a direct, file-by-file read of all 20 files under `.github/` (`build_and_test.yml`, `build_image_cache.yml`, `cloud_aws.yml`, `codeql.yml`, `labeler.yml`, `notify_cloud_aws.yml`, `notify_test_workflow.yml`, `report_cloud_aws.yml`, `stale.yml`, `tmpl_build_and_test.yml`, `tmpl_build_image_cache.yml`, `tmpl_cloud_aws.yml`, `update_build_status.yml`, `website.yml`, the two `actions/*/action.yml` files, `gha-tests/README.md`, `gha-tests/exclude-tests.txt`, `gha-tests/hadoop-aws-localstack-excludes.txt`, `pull_request_template.md`, `workflow-security.md`), plus `dev-support/Jenkinsfile` and `dev-support/jenkinsfile-windows-10`. A case-insensitive grep for `riscv|risc-v|riscv64|rv64|zbc|zvbc|qemu|cross-arch` across the entire `.github/` tree returns **zero matches**.

`build_and_test.yml` triggers on every push and dispatches to `tmpl_build_and_test.yml` for three configurations (`default`, `rockylinux-8-java21-build-only`, `debian-13-java25-build-only`); every job in every workflow declares `runs-on: ubuntu-24.04`, `ubuntu-latest`, or `ubuntu-slim`. There is no architecture matrix dimension, no self-hosted or riscv64-labeled runner, and no QEMU/binfmt cross-arch step in any workflow file. `.gitlab-ci.yml` and `.cirrus.yml` do not exist in the repository.

| | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes (all GHA jobs, `ubuntu-24.04`) | No dedicated CI beyond a build-only Dockerfile config | No |
| RISE runner usage | N/A | N/A | None found |
| Hardware used for RISC-V testing | N/A | N/A | Contributor-owned hardware (SG2380/EulixOS) and manual QEMU + openEuler images only, outside CI |

All RISC-V testing to date (22 native `TestNativeCrc32` unit tests, benchmark runs) was performed by contributors on private hardware or QEMU, entirely outside the project's automated CI. No riscv64 build, unit test, or integration test runs automatically on any merge or pull request.

## 8. Distribution and Release Status

### 8.1 Official Apache releases

Per [downloads.apache.org/hadoop/common/](https://downloads.apache.org/hadoop/common/), the `hadoop-3.5.0` release directory ships exactly three artifacts: `hadoop-3.5.0.tar.gz` (generic/x86_64), `hadoop-3.5.0-aarch64.tar.gz`, and `hadoop-3.5.0-src.tar.gz`. **No riscv64 tarball exists in 3.5.0 or any prior release.** Apache has published architecture-specific binaries only for aarch64 (since the 3.3.x series); no riscv64-named tarball has ever appeared in any release directory.

Two of this pass's checks disagree on the exact release cadence and should both be noted rather than silently reconciled: one live fetch of `hadoop.apache.org/releases.html` reported **3.4.3 (2026-02-24)** as "current stable," listing only `hadoop-3.4.3.tar.gz`, `hadoop-3.4.3-aarch64.tar.gz`, and `hadoop-3.4.3-src.tar.gz`; a separate PR-verification pass cites JIRA fix versions landing in **3.5.0 (released 2026-04-02)**, and the readiness-grade research explicitly checked the `hadoop-3.5.0` release directory directly. Both checks agree on the material fact for this report regardless of which release is "current stable": **no riscv64 artifact exists in either 3.4.3 or 3.5.0, or in any other release directory.**

The RISC-V native code (PRs #7796, #7809, #7903, #8031) carries a `3.5.0` fix version in JIRA and is merged to `trunk` (Hadoop 4.x, which has had no GA release). There is no confirmed roadmap document committing to a future riscv64 tarball [NEEDS VERIFICATION: no such document was found].

Apache Hadoop's GitHub repository has zero GitHub Releases (`github.com/apache/hadoop/releases` states "There aren't any releases here") - distribution runs exclusively through the Apache dist mirrors and Maven Central, not GitHub Releases, so this channel is structurally empty for every architecture, not just riscv64.

### 8.2 Package managers and distributions

| Source | riscv64 status |
|---|---|
| [Apache dist server](https://downloads.apache.org/hadoop/common/) | Absent - only generic + aarch64 tarballs |
| GitHub Releases | Not applicable - zero release assets exist for any architecture |
| [PyPI](https://pypi.org/pypi/apache-hadoop/json) | Not applicable - `apache-hadoop` package does not exist on PyPI (404), confirmed twice; expected, since Hadoop is a JVM project |
| Ubuntu (all suites through 26.04 "resolute") | Absent - "your search gave no results" across all sections and all architectures; Hadoop is not packaged in Ubuntu at all, on any architecture |
| Debian (all suites) | Absent - "your search gave no results" for keyword `hadoop`; no Debian package exists on any architecture |
| Arch Linux RISC-V port (archriscv.felixc.at) | Inconclusive - informational/mirror-links page only, no queryable package database found; no positive evidence of a package either way |

Because no Linux distribution packages Hadoop at all, on any architecture, there is no distribution floor available to independently raise riscv64 availability - the absence is total, not riscv64-specific.

**Summary:** no riscv64 binary for Apache Hadoop exists in any verified distribution channel. Hadoop is a JVM application and will run on any JVM with riscv64 support (OpenJDK riscv64 has been available in Debian/Ubuntu/Fedora since JDK 11), but no pre-built distribution targeting riscv64 is published by Apache or any downstream distributor. The only documented path to a working riscv64 Hadoop binary today is compiling from source; a single unofficial, low-activity community guide (`github.com/joeschmo456/hadoop`, 23 commits, 1 star, produced during a Chinese Academy of Sciences internship) documents compiling Hadoop 3.4.0 for riscv64 with manual patching, with no performance benchmarks or comparison data.

## 9. Dependencies

### 9.1 Runtime dependencies

| Dependency | Role in Hadoop | Criticality | riscv64 status | Blocking issues |
|---|---|---|---|---|
| OpenJDK | Primary runtime + JNI bridge | Critical | Green - available since JDK 11 in major distros | None (see `project-reports/openjdk.md`) |
| zlib | Compression codec, CRC support | Optional | Green | None (see `project-reports/zlib.md`) |
| OpenSSL | AES-256-CTR encryption of HDFS data at rest and in-flight | Critical | Green build; Yellow test signal (QEMU-CI test hang and flaky `test_lhash` reported upstream); Green release (packaged) | AES T-table path not constant-time without Zkn/Zvkned; see `project-reports/openssl.md` |
| bzip2 | Optional compression codec | Optional | Green | None for the classic C `libbzip2` that Hadoop links; the separate `bzip2-rs`/`libbzip2-rs` Rust rewrite carries a yellow rating in `project-reports/bzip2.md` due to its CI matrix excluding riscv64, but that rewrite is not what Hadoop uses, so it does not affect Hadoop |
| ISA-L | Erasure coding (Reed-Solomon, GF math, CRC) for HDFS native EC | Optional (but a hard blocker for the native EC feature) | Red - no riscv64 packages in any distro, no riscv64 CI | RISC-V officially unsupported upstream ([intel/isa-l#239](https://github.com/intel/isa-l/issues/239), open since April 2023); every community RISC-V PR (adler32 RVV #390, erasure code #387, CRC Zvbc #350, CRC zbc/zbb #299, CI #324) closed abandoned; not tracked as a separate project in this repository's `projects.yml`, so no dedicated status report exists |
| PMDK | Persistent-memory (NVM) storage path for HDFS on PMEM hardware | Optional (permanently blocks the PMEM feature on riscv64) | Red | Repository archived 2025-11-12 (read-only, EOL); zero RISC-V issues or PRs were ever filed; not tracked as a separate project in `projects.yml`, no dedicated report exists |
| LZ4 | Compression codec for HDFS blocks and MapReduce intermediate data | Optional | Yellow - basic riscv64 support merged upstream, `LZ4_FAST_DEC_LOOP` not yet enabled for riscv64 | Throughput gap, no correctness blockers (see `project-reports/lz4.md`) |
| zstd | HDFS block compression codec | Optional | Yellow - basic arch detection merged, several optimization PRs open | No correctness blockers (see `project-reports/zstd.md`) |
| snappy | Optional compression codec | Optional | Yellow - pure-C fallback builds, RVV fast path not yet merged | No correctness blockers (see `project-reports/snappy.md`) |
| leveldb | HDFS NameNode local metadata persistence | Critical | Yellow-to-Green - earlier riscv64 build failure resolved upstream, no open riscv64 issues | None (see `project-reports/leveldb.md`) |

### 9.2 Build dependencies

| Dependency | Role in Hadoop | Criticality | riscv64 status | Notes |
|---|---|---|---|---|
| CMake | Native build configuration | Critical | Green - used successfully in contributor riscv64 builds documented in the PR #7903 review chain (openEuler 25.03 + QEMU + GCC + CMake + JDK 17 riscv64) | No riscv64-specific flags required; the same `CMakeLists.txt` and commands apply on every architecture (Section 4.6) |
| GCC | Native compiler, 9.3.0+ required for `thread_local` | Critical | Green - same contributor build chain confirms a working riscv64 GCC toolchain | Required across all architectures, not riscv64-specific |
| Maven | Java build orchestration | Critical | Green - pure Java, architecture-independent | Its plugin, os-maven-plugin, is the one component that needed a riscv64-specific fix (below) |
| os-maven-plugin | Maven plugin resolving `os.detected.arch` for native artifact classifiers | Critical | Green as of 1.7.1 - fixed directly by Hadoop's own [PR #7796](https://github.com/apache/hadoop/pull/7796) | Before the fix, riscv64 builds failed outright with `org.apache.maven.MavenExecutionException: unknown os.arch: riscv64`; this is the one build dependency where Hadoop itself, not the upstream project, carried out the riscv64 fix |
| Boost | C++ utility library used by native build | Optional | Data not available: no riscv64-specific build/test verification for Boost was found in this research; `BUILDING.txt` lists it as a required version (1.86.0) with no riscv64-specific flags or known issues documented anywhere in the searches performed |
| Protocol Buffers | RPC/serialization codegen, native and Java | Critical | Green - PR #7903's review thread documents a successful riscv64 build of Protobuf 3.25.5 with abseil-cpp on openEuler 25.03 under QEMU | Must be built from source on every architecture per `BUILDING.txt` (system packages are too old); this is a general Hadoop build requirement, not a riscv64-specific burden. Recursed indirect dependency: **abseil-cpp** (pinned to `20230802.1`), bundled into Protobuf's `third_party/abseil-cpp` tree per the documented build steps - no riscv64-specific abseil-cpp issue was found in this research |
| Cyrus SASL | SASL authentication library for RPC | Critical | Data not available: no riscv64-specific build/test verification for Cyrus SASL was found in this research; `BUILDING.txt` lists it as a required dependency with no riscv64-specific flags or known issues documented |

### 9.3 Hard blockers for production deployment

Two dependencies represent hard functional blockers for specific Hadoop features on riscv64:

**ISA-L:** the HDFS erasure-coding native fast path is unavailable on riscv64. Every RISC-V PR to `intel/isa-l` has been closed abandoned, with no replacement activity as of 2026-09-30. A riscv64-capable ISA-L must be produced either by forking the project or by a fresh community port before the HDFS EC native path can function on riscv64; the fallback Java software EC path works but is a significant performance regression for EC-heavy workloads.

**PMDK:** the HDFS persistent-memory storage path is permanently unavailable, since PMDK was archived (EOL) on 2025-11-12. This only affects deployments using NVM/PMEM hardware, but on such deployments the feature cannot be enabled on riscv64 under any circumstances.

## 11. Known Bugs and Active Issues

### 11.1 CRC32 small-buffer regression (merged, accepted trade-off)

[PR #8031](https://github.com/apache/hadoop/pull/8031) introduced a performance regression for small CRC32 buffers. Benchmarks from the PR (SG2380/EulixOS, JDK 17 BiSheng, Linux 6.12, `org.apache.hadoop.util.Crc32PerformanceTest`, 64 MB data, 5 trials):

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

Crossover is roughly bpc=128. The regression is acknowledged but accepted; a size-threshold dispatch was deferred to a future RVV-based follow-up that does not currently exist. Author summary elsewhere ("~4x vs software at 8192-byte buffers") is single-sourced [NEEDS VERIFICATION].

### 11.2 CRC32C small-buffer regression (open, unresolved)

[PR #8371](https://github.com/apache/hadoop/pull/8371) shows a more severe small-buffer regression, and remains open and unresolved as of 2026-09-30:

| bpc | Before (software, MB/s) | After (Zbc, MB/s) | Delta |
|---|---|---|---|
| 32 | ~695 | ~70 | -90% |
| 64 | ~830 | ~748 | -10% |
| 128 | ~916 | ~693 | -24% |
| 256 | ~872 | ~2,982 | +242% |
| 1,024 | ~1,007 | ~3,597 | +257% |
| 4,096 | ~1,029 | ~4,562 | +344% |
| 16,384 | ~1,035 | ~5,706 | +451% |
| 65,536 | ~1,038 | ~6,236 (peak reported: 6,255.9 MB/s at 32 KB, single thread) | +484% |

Crossover is roughly bpc=256. The -90% regression at bpc=32 remains unresolved as of the most recent JIRA update (2026-03-31); no new comment activity addressing it was found.

### 11.3 Open JIRA issues

| Issue | Title | Priority | Status |
|---|---|---|---|
| [HADOOP-19849](https://issues.apache.org/jira/browse/HADOOP-19849) | [RISC-V] Zbc-accelerated native CRC32C path | Major | Open |
| [HADOOP-19666](https://issues.apache.org/jira/browse/HADOOP-19666) | CRC32 hardware acceleration using v, zbc, zvbc (RVV path) | Major | Open, no active implementation |
| [HADOOP-19655](https://issues.apache.org/jira/browse/HADOOP-19655) | Add RISC-V Zbc CLMUL hardware-accelerated CRC32/CRC32C (parent) | Major | Open |
| [HADOOP-19623](https://issues.apache.org/jira/browse/HADOOP-19623) | RISC-V Architecture Support (umbrella) | Major | Open |
| [HADOOP-17529](https://issues.apache.org/jira/browse/HADOOP-17529) | Update os-maven-plugin to 1.7.0 for RISC-V (original, 2021) | Minor | Open, stale |

HADOOP-19666 is JIRA-flagged as a duplicate of HADOOP-19655, but both remain open and unresolved. Hadoop tracks all issues on Apache JIRA, not GitHub Issues; every GitHub Issues search performed against `apache/hadoop` (riscv, riscv64, riscv64 performance, riscv64 bug, riscv nan floating) returned zero results because the repository does not use GitHub Issues at all.

### 11.4 No correctness bugs found

No NaN/floating-point, endianness, or data-corruption defects specific to RISC-V were identified in any search performed against JIRA or GitHub. All 22 native `TestNativeCrc32` unit tests pass on riscv64 hardware for the merged code.

## 12. Objections and Upstream Blockers

### 12.1 PR #8371 (CRC32C) - two open objections

**Objection 1 - JDK intrinsic redundancy** (reviewer pan3793, most recently 2026-03-31): modern JDKs may already activate hardware CRC32C via built-in intrinsics on riscv64 hardware that supports the relevant extension. If so, the Hadoop native layer duplicates that acceleration and adds maintenance burden for no measurable gain. The PR author committed to producing a JDK-builtin-vs-native benchmark; as of 2026-09-30 that benchmark has still not been posted. This objection must be resolved before the PR can be approved, and the PR currently has zero approvals.

**Objection 2 - missing tests** (Yetus CI, all runs): Yetus reports `-1 test4tests` because no new automated tests accompany the CRC32C path. This is the sole automated CI failure blocking merge, and follows the same pattern as prior RISC-V PRs (#7903, #8031), where the same flag was raised and the reviewer accepted scaffolding-only or hardware-dependent test limitations - but for a correctness-critical path like CRC32C, the objection carries more weight and has not been waived.

### 12.2 CI infrastructure unavailability

Apache Infrastructure does not operate riscv64 build agents, and no riscv64 CI exists for Hadoop (Section 7). No public discussion establishing a plan for riscv64 CI was found [NEEDS VERIFICATION]. Without CI, every RISC-V patch requires manual hardware testing by the two active contributors before submission, and there is no automated regression detection after merge.

### 12.3 ISA-L has no upstream solution

ISA-L is controlled by Intel, which has made no public commitment to riscv64 support. Every community RISC-V contribution to `intel/isa-l` was closed abandoned in early 2026. There is currently no visible upstream path to a riscv64 ISA-L; a deployment requiring hardware-accelerated HDFS erasure coding on riscv64 must fork ISA-L or accept the Java software fallback indefinitely.

### 12.4 PMDK is EOL

PMDK was archived on 2025-11-12. The HDFS PMEM feature is permanently blocked on riscv64 (and on every future architecture, since the upstream project no longer accepts changes). This affects only PMEM-equipped deployments.

### 12.5 Small contributor base

Two individuals - Lei Wen (ZTE Corporation) and Peter Pan (ISCAS) - account for essentially all RISC-V-specific work, and Steve Loughran is the only PMC member who has reviewed RISC-V native code. There is no second reviewer familiar with RISC-V intrinsics and no visible succession plan; attrition of either primary contributor would stall the port.

## 13. Readiness Assessment

**Color:** Orange (no-upstream-ci-no-distro-package)
**Release provider:** none

Apache Hadoop has zero riscv64 upstream CI - confirmed by direct inspection of every file under [`.github/workflows/`](https://github.com/apache/hadoop/tree/trunk/.github/workflows) plus both Jenkinsfiles: all jobs run on `ubuntu-24.04`, with no riscv or qemu references anywhere. It also has no riscv64 release artifact - the [3.5.0 release directory](https://downloads.apache.org/hadoop/common/hadoop-3.5.0/) ships only a generic and an aarch64 tarball. No Linux distribution packages Hadoop at all, on any architecture (confirmed on [packages.ubuntu.com](https://packages.ubuntu.com/) through suite "resolute"/26.04, and on the Debian package tracker), so no distribution floor exists that could raise the grade to yellow.

Per the color model's Step 1 table (no upstream CI, no test, no release), this is orange rather than red, because RISC-V support is not confirmed broken: contributor-tested native code (Zbc CLMUL CRC32 in [PR #8031](https://github.com/apache/hadoop/pull/8031), bswap in [PR #7809](https://github.com/apache/hadoop/pull/7809)) has merged into trunk and passed 22 native unit tests on real riscv64 hardware - it simply has no automated upstream pipeline behind it. Hadoop is not an optimization-purpose project - its value proposition is distributed storage and compute, not raw algorithmic speed - so the readiness model's optimization-level modifier does not apply, and no Optimization level line is included for this project.

**Pending work that could change the grade:** [PR #8371](https://github.com/apache/hadoop/pull/8371) (HADOOP-19849, CRC32C Zbc acceleration) remains open and unmerged, blocked on the unresolved JDK-intrinsic-redundancy objection and a missing-tests CI flag; if merged, it would not change the color by itself (still no CI, still no release) but would close a real functional gap. HADOOP-19666 (the RVV vector CRC32 path) is open with no active implementation after the prior PR ([#7912](https://github.com/apache/hadoop/pull/7912)) was closed stale. ISA-L has no riscv64 support and every community PR to `intel/isa-l` has been closed abandoned. No RISE Project involvement was found with Hadoop. None of these items would move the color above orange without upstream CI or a published riscv64 release being added.

## 14. Investment Analysis

### 14.1 Functional Enablement

The Hadoop Java core requires no investment - it runs on any OpenJDK riscv64 build. The native layer needs three items to reach feature parity with aarch64:

1. **CRC32C Zbc acceleration (land PR #8371):** the implementation already exists; the remaining work is producing the JDK-builtin-vs-native benchmark reviewer pan3793 requested, adding targeted automated tests, and either fixing or documenting the small-buffer regression policy. Estimated 2-3 person-weeks of engineering plus review cycle.
2. **ISA-L riscv64 support:** the largest functional gap. Intel has made no commitment to riscv64 ISA-L, and prior community PRs were closed without review, suggesting Intel is not actively reviewing RISC-V contributions to that repository. A riscv64 port requires Galois-field arithmetic, Reed-Solomon encode/decode, and CRC primitives for riscv64 - either contributed upstream or maintained as a fork. Estimated 8-16 person-weeks for the core GF/RS primitives, with an uncertain upstreaming path and, if forked, ongoing maintenance overhead.
3. **Dev container / build tooling for riscv64:** PR #7924 (Dockerfile) was closed stale. Without a standard container, every new contributor must manually configure QEMU + openEuler, which is real contributor friction. Estimated 1-2 person-weeks to produce a working Dockerfile and integrate it into `start-build-env.sh`.

No RISE-funded work targets any of these three items; nothing here has already been covered.

### 14.2 Performance Optimization

Current riscv64 state in trunk: CRC32 has hardware Zbc CLMUL acceleration for buffers >= ~128 bytes and software for smaller buffers, reaching roughly 4,000-4,200 MB/s at large buffer sizes versus a ~970 MB/s software baseline. CRC32C is software-only pending PR #8371. All other hot paths (compression codecs, crypto) remain scalar/software.

The next planned tier - RVV (V-extension) vectorized CRC via `vclmul.v`/`vclmulh.v` - was abandoned in PR #7912 and is tracked under the still-open HADOOP-19666 with no active implementation. Availability of the Zvbc extension on current production riscv64 silicon is not confirmed in this research.

1. **RVV CRC32/CRC32C (Zvbc):** highest ceiling for HDFS I/O throughput. Requires a contributor with both RISC-V V-extension intrinsics expertise and Hadoop native-code familiarity; the prior attempt (PR #7912) shows the approach is technically understood and was closed for strategic, not technical, reasons. Estimated 4-6 person-weeks for a merged implementation.
2. **Small-buffer CRC dispatch:** adding a size threshold to skip the Zbc path below ~128 bytes (CRC32) or ~256 bytes (CRC32C) would eliminate the existing regressions outright. Estimated 1 person-week.

### 14.3 CI/CD Infrastructure

Zero riscv64 CI currently exists. Options:

1. **Self-hosted riscv64 runner for apache/hadoop:** requires Apache Infrastructure cooperation and hardware provisioning; RISE member companies (e.g. SiFive, ISCAS, SpacemiT) could plausibly donate hardware or runner time, but no such arrangement was found to exist.
2. **QEMU-based riscv64 CI on GitHub Actions:** technically feasible via `tonistiigi/binfmt` + QEMU, sufficient for correctness testing (e.g. `TestNativeCrc32`, build validation) but not reliable for performance benchmarking. Estimated 2-3 person-weeks to integrate and tune, plus ongoing maintainer attention for QEMU slowness and flakiness.
3. **No CI (current state):** all RISC-V patches are manually tested by two individuals; there is no automated regression detection.

For any production-deployment use case, option 1 (native hardware CI) is the only approach that provides real confidence in performance characterization.

### 14.4 Ecosystem Enablement

| Item | Status | Investment needed |
|---|---|---|
| OpenJDK riscv64 | Fully available since JDK 11 | None |
| zlib, bzip2, leveldb | Available, no known riscv64 issues | None |
| LZ4, zstd, snappy | Available, performance gaps vs. amd64/aarch64 | Upstream contribution to those projects (outside Hadoop's own scope) |
| OpenSSL riscv64 AES (Zkn/Zvkned) | Available in 3.x, hardware-dependent | None required within Hadoop |
| ISA-L riscv64 | No upstream support, all PRs abandoned | Fork or upstream contribution (large effort, uncertain outcome) |
| PMDK riscv64 | Permanently unavailable (archived) | No viable path |
| CMake, GCC, Maven, Protocol Buffers | Confirmed working in contributor riscv64 builds | None |
| Boost, Cyrus SASL | No riscv64-specific issue found; not independently re-verified this pass | Low - spot-check as part of any CI-enablement work |

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Resolve PR #8371 (CRC32C Zbc): JDK-intrinsic benchmark + tests + small-buffer regression | 2-3 | Hadoop native contributor | Critical |
| Functional | ISA-L riscv64 port: GF arithmetic, Reed-Solomon, CRC | 8-16 | ISA-L contributor + Hadoop integration | High |
| Functional | riscv64 dev container Dockerfile + `start-build-env.sh` integration | 1-2 | Hadoop build engineer | High |
| Performance | Small-buffer CRC dispatch threshold (eliminates -30% to -90% regressions) | 1 | Hadoop native contributor | High |
| Performance | RVV (Zvbc) vectorized CRC32/CRC32C | 4-6 | RISC-V ISA expert + Hadoop contributor | Medium |
| CI/CD | QEMU-based riscv64 CI on GitHub Actions (correctness testing) | 2-3 | Hadoop infra contributor | High |
| CI/CD | Native riscv64 hardware runner (performance CI) | N/A (hardware-dependent) | Apache Infrastructure + hardware donor | Medium |
| Ecosystem | LZ4 `LZ4_FAST_DEC_LOOP` and RVV path (upstream `lz4/lz4`) | Out of scope | LZ4 upstream | Low |
| Ecosystem | PMDK EOL - no action possible | N/A | N/A | N/A |

## 15. References

- [apache/hadoop GitHub repository](https://github.com/apache/hadoop)
- [Apache Hadoop homepage](https://hadoop.apache.org/)
- [HADOOP-19623 (umbrella: RISC-V Architecture Support)](https://issues.apache.org/jira/browse/HADOOP-19623)
- [HADOOP-19615 (os-maven-plugin 1.7.1)](https://issues.apache.org/jira/browse/HADOOP-19615)
- [HADOOP-19616 (bswap)](https://issues.apache.org/jira/browse/HADOOP-19616)
- [HADOOP-19663 (CRC32 scaffolding)](https://issues.apache.org/jira/browse/HADOOP-19663)
- [HADOOP-19724 (CRC32 Zbc)](https://issues.apache.org/jira/browse/HADOOP-19724)
- [HADOOP-19849 (CRC32C Zbc)](https://issues.apache.org/jira/browse/HADOOP-19849)
- [HADOOP-19655 (CRC32/CRC32C Zbc, parent)](https://issues.apache.org/jira/browse/HADOOP-19655)
- [HADOOP-19666 (RVV CRC32)](https://issues.apache.org/jira/browse/HADOOP-19666)
- [HADOOP-17529 (original riscv os-maven, 2021)](https://issues.apache.org/jira/browse/HADOOP-17529)
- [HADOOP-18275 (os-maven-plugin 1.7.0, 2022)](https://issues.apache.org/jira/browse/HADOOP-18275)
- [PR #7796 - os-maven-plugin 1.7.1](https://github.com/apache/hadoop/pull/7796)
- [PR #7809 - bswap](https://github.com/apache/hadoop/pull/7809)
- [PR #7787 - bswap first attempt (superseded)](https://github.com/apache/hadoop/pull/7787)
- [PR #7842 - missing LevelDB deps](https://github.com/apache/hadoop/pull/7842)
- [PR #7896 - monolithic Zbc CRC32/CRC32C (superseded)](https://github.com/apache/hadoop/pull/7896)
- [PR #7903 - CRC32 build scaffolding](https://github.com/apache/hadoop/pull/7903)
- [PR #7912 - RVV CRC32 (closed stale)](https://github.com/apache/hadoop/pull/7912)
- [PR #7924 - riscv64 Dockerfile (closed stale)](https://github.com/apache/hadoop/pull/7924)
- [PR #8031 - CRC32 Zbc implementation](https://github.com/apache/hadoop/pull/8031)
- [PR #8371 - CRC32C Zbc (open)](https://github.com/apache/hadoop/pull/8371)
- [ISA-L issue #239 (RISC-V support question, open since April 2023)](https://github.com/intel/isa-l/issues/239)
- [ISA-L PR #324 (RISC-V CI, closed abandoned)](https://github.com/intel/isa-l/pull/324)
- [ISA-L PR #390 (adler32 RVV, closed abandoned)](https://github.com/intel/isa-l/pull/390)
- [ISA-L PR #387 (erasure code, closed abandoned)](https://github.com/intel/isa-l/pull/387)
- [ISA-L PR #350 (CRC Zvbc, closed abandoned)](https://github.com/intel/isa-l/pull/350)
- [ISA-L PR #299 (CRC zbc/zbb, closed abandoned)](https://github.com/intel/isa-l/pull/299)
- [Apache Hadoop 3.5.0 release directory](https://downloads.apache.org/hadoop/common/hadoop-3.5.0/)
- [Apache Hadoop releases page](https://hadoop.apache.org/releases.html)
- [bulk_crc32_riscv.c (trunk)](https://github.com/apache/hadoop/blob/trunk/hadoop-common-project/hadoop-common/src/main/native/src/org/apache/hadoop/util/bulk_crc32_riscv.c)
- [CMakeLists.txt with riscv detection (trunk)](https://github.com/apache/hadoop/blob/trunk/hadoop-common-project/hadoop-common/src/CMakeLists.txt)
- [BUILDING.txt (trunk)](https://github.com/apache/hadoop/blob/trunk/BUILDING.txt)
- [Apache Hadoop who.html (PMC/committer roster)](https://hadoop.apache.org/who.html)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python Wheel Builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [Ubuntu package search](https://packages.ubuntu.com/)
- [Debian package tracker](https://tracker.debian.org/)
- [Community riscv64 build guide (unofficial, unbenchmarked)](https://github.com/joeschmo456/hadoop)