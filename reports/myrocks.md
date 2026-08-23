---
title: MyRocks
---

# MyRocks

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for MyRocks<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

MyRocks is a MySQL storage engine that embeds [RocksDB](https://github.com/facebook/rocksdb) as its on-disk format. It originated at Meta (Facebook) to replace InnoDB for write-heavy workloads, trading read amplification for dramatically lower write amplification and space usage. The canonical upstream repository is [facebook/mysql-5.6](https://github.com/facebook/mysql-5.6), which despite its name tracks MySQL 8.0.32 on the default branch `fb-mysql-8.0.32`. Meta archived the repository on 2026-03-01, making it read-only.

**Governance:** MyRocks has no foundation affiliation. It is corporate-led open source under Meta Open Source. No MAINTAINERS, OWNERS, CODEBOARDS, or PLATFORMS.md files exist. No formal tier policy for supported platforms has ever been published. Decisions were made by Meta engineers committing directly. The RocksDB CLA is signed via [code.facebook.com/cla](https://code.facebook.com/cla); Meta retains copyright.

**Corporate maintainers:** Yoshinori Matsunobu (@yoshinorim, Meta) created MyRocks. Active contributors include Luqun Lou, Robert Pan, and Xiayi Sun (Meta). Upstream MySQL contributors from Oracle (marcalff, jdduncan, gurusami) and MariaDB Foundation (gkodinov, zmur) also appear in the commit history.

**Community stance on new ports:** No evidence of any Meta position on riscv64 portability. The repository was archived before any riscv64 discussion occurred. RocksDB (the embedded engine) accepted two community RISC-V PRs in 2022, indicating a historically receptive posture, but Meta has never stated a policy.

**RISE Project:** MyRocks is not a RISE member project. An audit of all RISE Project blog posts from May 2024 through August 2026 found zero mentions of MyRocks, RocksDB, MySQL, or MariaDB. No RISE RFP has funded MyRocks work.

---

## 2. Port History and Upstreaming Timeline

MyRocks (facebook/mysql-5.6) has no riscv64 port history whatsoever.

| Date | Event | Source |
|------|-------|--------|
| 2022-05-18 | RocksDB PR #9215 merged: initial riscv64 build fix, `-latomic` linkage. Contributed by @XieJiSS (PLCT Lab / Zhejiang University). Tested on Arch Linux riscv64gc under QEMU. | [facebook/rocksdb#9215](https://github.com/facebook/rocksdb/pull/9215) |
| 2022 (committed) | RocksDB commit 7d7e88c7 / PR #9366: `build_detect_platform` riscv64 detection, `-march` from `/proc/cpuinfo` ISA string. Adam Retter (Evolved Binary). Tested on SiFive Unmatched hardware. | [facebook/rocksdb#9366](https://github.com/facebook/rocksdb/pull/9366) |
| 2026-03-01 | facebook/mysql-5.6 archived by Meta. Repository is read-only. No riscv64 work was ever done in this repo. | [facebook/mysql-5.6](https://github.com/facebook/mysql-5.6) |
| 2026-03-30 | RocksDB PR #14530 opened: CMake riscv64 build fixes (dead code typo in `build_detect_platform`, LLD relocation handling). CLA signed but unmerged. | [facebook/rocksdb#14530](https://github.com/facebook/rocksdb/pull/14530) |
| 2026-03-31 | RocksDB PR #14536 opened: CRC32c hardware acceleration via Zbc (CLMUL) on riscv64. 16.9x throughput improvement on SG2044. Unmerged. | [facebook/rocksdb#14536](https://github.com/facebook/rocksdb/pull/14536) |

**RISC-V port status for MyRocks itself:** Never started. Zero commits, zero PRs, zero issues, zero CI additions. All riscv64 work lives in the RocksDB submodule, not in the MySQL integration layer.

**Fully upstream?** No. MyRocks has no upstream riscv64 enablement. The underlying RocksDB engine has partial community-contributed riscv64 support that is not yet complete (open PRs, no CI).

---

## 3. Upstream Support Tier

MyRocks publishes no formal platform support tier document. The only published support matrix in the MyRocks documentation lists CentOS 6.8/7.2 (official) and Ubuntu 14.04/15.10/16.04 (best-effort), all x86-64. riscv64 is not mentioned anywhere in the repository.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Listed in official support matrix | Yes (CentOS 6/7, Ubuntu 14-16) | No | No |
| Upstream CI exists | Yes (.circleci, azure-pipelines) | No | No |
| Release-blocking test suite | Yes (implied by CI) | No | No |
| Official binaries published | No (zero GitHub releases) | No | No |
| Distro packages | Via MariaDB packaging | Via MariaDB packaging | Via MariaDB packaging (Debian sid, Ubuntu 24.04) |
| Repo status | Archived 2026-03-01 | Archived | Archived |

The repository is archived. No further upstream enablement is possible in the facebook/mysql-5.6 codebase without a fork or a new upstream home. This is the single most important fact for investment planning.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

MyRocks is architecturally divided into a MySQL integration layer (the `storage/rocksdb/` plugin, 163 files) and the embedded RocksDB engine (a submodule). The MySQL layer is pure portable C++. All performance-critical architecture-specific code is in RocksDB.

### 4.1 CRC32c Checksumming

RocksDB uses CRC32c for data integrity on every SST block read and write. The dispatch logic in `crc32c.cc` selects among:
- x86_64: SSE4.2 + PCLMUL hardware path (`_mm_crc32_u64`)
- arm64: `crc32cd` + `vmull_p64` hardware path (`util/crc32c_arm64.cc`)
- PowerPC64: AltiVec VMX (`util/crc32c_ppc_asm.S` + `crc32c_ppc.c`)
- riscv64: `CRC32_DEFAULT` software table-lookup fallback

Measured on SG2044 (PR #14536): software fallback = 375.7 MB/s; Zbc scalar (CLMUL) = 6333.3 MB/s. Ratio: 16.9x. The Zbc PR (#14536) is unmerged. A Zvbc vector path (PR #14894) depends on #14536 and is also unmerged.

### 4.2 Spin-wait (AsmVolatilePause)

`rocksdb/port/port_posix.h` defines `AsmVolatilePause()` for lock-free spin loops:
- x86: `pause` instruction
- aarch64: `isb` instruction
- ppc64: `or 27,27,27`
- loongarch64: `dbar 0`
- riscv64: no-op (falls through to empty function body)

The Zihintpause extension provides `pause` semantics on riscv64. No implementation exists. Impact is moderate: excess CPU power consumption under lock contention; not a correctness issue.

### 4.3 Hash Functions (XXH3)

RocksDB uses XXH3 for bloom filter hashing and other internal purposes. PR #14604 (open) updates `xxhash.h` to pick up the upstream RVV (RISC-V Vector) dispatch path. Currently on riscv64, XXH3 runs the scalar path. [NEEDS VERIFICATION: exact XXH3 throughput delta on riscv64 vs arm64 not quantified in the research findings.]

### 4.4 InnoDB CRC32c (ut0crc32)

MyRocks does not use InnoDB, but the mysql-5.6 codebase includes InnoDB. Its `ut0crc32.h` detects architecture via `__x86_64__` / `__aarch64__` / else. riscv64 falls to the software path. Not relevant to MyRocks workloads but relevant to any mixed-engine deployment.

### 4.5 JIT

No JIT backend exists anywhere in MyRocks or RocksDB. Not applicable.

### 4.6 SIMD / Vector

No SIMD intrinsics exist in the MyRocks storage engine layer. The RocksDB submodule has no RVV paths merged (PR #14604 for xxhash is open). Compression codecs (LZ4, zstd, Snappy) have separate RISC-V gaps covered in Section 9.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CRC32c | Hardware (SSE4.2+PCLMUL) | Hardware (crc32cd+PMULL) | Software fallback only |
| XXH3 hash | Auto-vectorized or scalar | NEON path | Scalar (RVV PR #14604 unmerged) |
| Spin-wait | `pause` instruction | `isb` instruction | No-op (Zihintpause unimplemented) |
| LZ4 decompression | FAST_DEC_LOOP | FAST_DEC_LOOP | Disabled (3 competing PRs unmerged) |
| Zstd compression | SSE/AVX paths | NEON paths | Scalar (Zicclsm PR #4596 stalled) |
| Snappy | SSE4.1/2 paths | NEON paths | Scalar (5 merged PRs unreleased) |
| JIT | N/A | N/A | N/A |

---

## 5. Build System, Cross-Compilation, and Toolchain

The facebook/mysql-5.6 CMake build system has zero riscv64 support.

**Architecture enumeration gap:** The root `CMakeLists.txt` explicitly lists 64-bit architectures as `arm64 aarch64 ppc64 ppc64le s390x x86_64`. riscv64 is absent.

**cmake/os/Linux.cmake:** Detects only `aarch64` (sets `LINUX_ARM`). No riscv64 conditional anywhere in the 67 cmake files.

**Cross-compilation requirement:** `configure.cmake` cannot auto-detect stack direction when cross-compiling. The user must pass `-DSTACK_DIRECTION=-1` (stack grows downward on riscv64, same as x86_64 and aarch64). Without this, the CMake configure step fails or silently uses wrong defaults.

**RocksDB submodule CMakeLists.txt:** Has explicit architecture blocks for x86_64, ppc64/powerpc64, arm64/aarch64, s390x, and loongarch64. riscv64 is absent and falls to compiler defaults. With `PORTABLE=0` (default), this triggers `-march=native` which is invalid for cross-compilation.

**Compiler minimums:** GCC >= 7.1, Clang >= 5 (enforced uniformly on Linux; no riscv64-specific minimum). Both versions support riscv64gc.

**Known build failures in RocksDB:**

1. Dead code typo: `build_detect_platform` sets `RISC_ISA` but checks `RISCV_ISA`. Hardware-specific optimization never activates. When fixed, modern kernels expose supervisor extensions (`sscofpmf`, `sstc`, `svinval`) in `/proc/cpuinfo` that GCC rejects via `-march=`. PR #14530 addresses both.

2. LLD relocation failure: GCC on riscv64 emits `R_RISCV_SET_ULEB128` (reloc 60) and `R_RISCV_SUB_ULEB128` (reloc 61) for C++ exception tables. Older LLD versions fail to link with `error: unknown relocation (60)`. PR #14530 adds LLD version detection.

**No validated cmake configure command for riscv64 exists in any upstream documentation.** A first-of-kind build attempt would require at minimum:

```
cmake \
  -DCMAKE_BUILD_TYPE=RelWithDebInfo \
  -DSTACK_DIRECTION=-1 \
  -DPORTABLE=1 \
  -DWITH_JEMALLOC=OFF \
  -DWITH_TCMALLOC=OFF \
  -DWITH_LTO=OFF \
  ..
```

This is not validated by any upstream source; it is derived from the build system analysis.

**QEMU usage:** None referenced anywhere in the repository.

**Repository archived:** facebook/mysql-5.6 is read-only as of 2026-03-01. Build system fixes cannot be merged upstream. Any fix must target a fork or the MariaDB repository (which carries its own RocksDB integration independently).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---------|-------|-------|---------|--------------|
| Build from source | Yes | Yes (distro) | Untested upstream; builds via Debian/MariaDB | High (no validated path) |
| CRC32c hardware acceleration | Yes | Yes | No (16.9x throughput gap) | High |
| Production binary distribution | No (no GitHub releases) | No | No | N/A (all arches equally absent) |
| Distro package availability | Yes (mariadb-plugin-rocksdb) | Yes | Yes (Debian sid, Ubuntu 24.04) | None |
| Upstream CI coverage | Yes | No | No | Medium |
| LZ4 FAST_DEC_LOOP | Yes | Yes | No (disabled) | Medium |
| Zstd Zicclsm unaligned (+74% compression) | Yes (SSE) | Yes (NEON) | No (PR stalled) | Medium |
| Snappy SIMD decompression | Yes | Yes | No (merged but unreleased) | Low-Medium |
| Spin-wait efficiency | Yes (pause) | Yes (isb) | No (no-op) | Low |
| XXH3 vectorization | Yes | Yes | No (PR open) | Low |
| musl libc RocksJava support | Yes | Partial | No (PR #13740 open) | Low (Java path only) |

**Functional gaps:** No functional gaps. MyRocks can create tables, read, and write data on riscv64. All correctness paths are in portable C++. The gaps are entirely performance-related except for the build system gap.

**Performance gaps:** The dominant gap is CRC32c (16.9x on SG2044). Every SST file read and write passes through CRC32c. This is the single highest-ROI fix. Secondary gaps are compression codec throughput (LZ4, zstd, Snappy) which affect all I/O-bound workloads.

**Security hardening gaps:** Data not available: no research was conducted on CFI, BTI, PAC, or pointer authentication status specific to MyRocks on riscv64.

**Floating-point / NaN semantics:** No floating-point in the storage engine hot path. Not a concern for MyRocks.

---

## 7. CI/CD Infrastructure

MyRocks has no riscv64 CI of any kind.

| CI system | riscv64 job exists | Details |
|-----------|-------------------|---------|
| GitHub Actions | No | `.github/workflows/` directory does not exist in the repository (HTTP 404 from GitHub API) |
| CircleCI (`.circleci/config.yml`) | No | Ubuntu Xenial image, clang-format check only. No compilation. No riscv64. |
| Azure Pipelines (`azure-pipelines.yml`) | No | ubuntu-20.04 and ubuntu-22.04 x86_64 hosted agents; macOS. Compiler matrix: clang 7-15, gcc 7-12. No riscv64 agents or QEMU. |
| RISE runners | No | No RISE involvement confirmed. |
| Hardware runners | No | No SiFive Unmatched or SG2044 runner referenced anywhere. |

| CI capability | amd64 | arm64 | riscv64 |
|--------------|-------|-------|---------|
| Build verification | Yes | No | No |
| Functional test suite | Yes | No | No |
| Sanitizer runs | Yes | No | No |
| Performance regression | No | No | No |

The repository is archived. Adding CI is not possible in the upstream. Any CI investment must target a fork or the downstream MariaDB repository.

---

## 8. Distribution and Release Status

**GitHub releases:** Zero published releases exist in [facebook/mysql-5.6](https://github.com/facebook/mysql-5.6). The GitHub Releases API returns an empty list. No binary assets exist for any architecture.

**RocksDB GitHub releases:** [facebook/rocksdb](https://github.com/facebook/rocksdb) publishes releases (v10.10.1 through v11.8.1 confirmed checked) but attaches zero binary assets to any release. Source-only distribution.

**Distro packages (as standalone MyRocks):** No package named "myrocks" exists in PyPI, Debian, Ubuntu, or Arch Linux RISC-V. A search for "myrocks" on [tracker.debian.org](https://tracker.debian.org/pkg/myrocks) returns HTTP 404.

**Distro packages (via MariaDB integration):** MyRocks functionality is available on riscv64 through `mariadb-plugin-rocksdb`, which is MariaDB's independent integration of RocksDB. This is a distinct codebase from facebook/mysql-5.6, maintained by the MariaDB Foundation and Debian/Ubuntu packaging teams.

| Distribution | Package | riscv64 version | amd64 version | Notes |
|-------------|---------|----------------|---------------|-------|
| Ubuntu 24.04 noble | `mariadb-plugin-rocksdb` | 1:10.11.7-2ubuntu2 | 1:10.11.13-... (security-patched) | riscv64 slightly behind amd64 |
| Debian sid | `mariadb-plugin-rocksdb` | 1:11.8.8-1 (built ~78 days ago) | Same | Built on rv-osuosl-03 hardware runner |
| Arch Linux RISC-V | Not found | - | - | No result for "myrocks" query |
| Fedora | Data not available | - | - | Not researched |

**What a user must do to get a working binary on riscv64:**
1. Install `mariadb-plugin-rocksdb` via `apt` on Debian sid or Ubuntu 24.04.
2. There is no path to a working Facebook-upstream MyRocks binary on riscv64. The upstream repo is archived with no builds and no releases.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|-----------|------|--------------|--------------|----------------|----------------|
| RocksDB | Core storage engine (submodule) | Partial (Makefile path works; CMake broken) | No upstream CI | Source-only | PR #14530 (CMake fix, CLA stalled); PR #14536 (CRC32c Zbc, unmerged) |
| MySQL 8.0 | SQL layer, storage engine API | Builds (distro-packaged) | No upstream CI | No Oracle binary | OCA process blocks community fixes; Debian patch unupstreamed |
| zstd | Default compression codec | Builds | QEMU CI only | Distro packages | PR #4596 (Zicclsm +74% compression) stalled on maintainer non-response |
| LZ4 | Fast-path compression codec | Builds | QEMU CI, Tier 3 | No riscv64 binary | `FAST_DEC_LOOP` disabled; 3 competing PRs (#1678, #1739, #1738) unmerged |
| Snappy | Alternative compression codec | Builds | QEMU CI | All 5 merged patches unreleased (post-v1.2.2) | Unreleased patches; no RVV vector CI |
| zlib | zlib-format streams | Builds (pure C) | No Linux CI for riscv64 | Distro packages | RVV Adler32 PR #1099 unmerged; no Linux riscv64 CI |
| bzip2 | BZ2 format | Builds (pure C) | No upstream CI | Distro packages | None; pure C throughout |
| jemalloc | Memory allocator (optional) | Builds | No upstream CI | Distro packages | Open issue #2399 (cross-compile, 3+ yrs no response); Zihintpause spin-wait missing |
| liburing | Async I/O (default ON) | Builds (full port since v2.5) | Cross-compile CI, no runtime exec | Distro packages | No runtime tests in CI; no sanitizer builds |
| oneTBB | Parallelism (optional) | Builds | No upstream CI | Distro packages | PR #987 (libatomic CMake) open since Dec 2022; no riscv64 optimizations |
| OpenSSL | TLS/crypto | Full first-class support | Comprehensive (13 ISA extension configs) | Distro packages | No blocking issues |
| Folly | High-perf data structures (optional `ROCKSDB_FOLLY`) | Blocked on GCC 14 | N/A | N/A | Issue #2493: GCC 14 build failure on riscv64 Ubuntu 24.04 |

### Deep-dive: RocksDB (critical, embedded submodule)

RocksDB is the actual storage implementation. MyRocks is a MySQL API wrapper around it. Every riscv64 gap in RocksDB is directly inherited by MyRocks.

**CMake build system (PR #14530, open):** Two distinct bugs:
- Variable typo `RISC_ISA` vs `RISCV_ISA` means hardware ISA detection never fires. Fix reveals a second bug: modern Linux kernels expose supervisor extensions in `/proc/cpuinfo` that GCC rejects in `-march=` strings, crashing the build.
- LLD < 17 cannot handle `R_RISCV_SET_ULEB128`/`R_RISCV_SUB_ULEB128` relocations emitted by GCC for C++ exception tables. The fix adds LLD version detection.

**CRC32c (PR #14536, open):** Software fallback at 375.7 MB/s; Zbc scalar at 6333.3 MB/s (16.9x). This affects every read and write operation. A Zvbc vector path (PR #14894, depends on #14536) claims a further ~10% gain at VLEN=128.

**zstd:** PR #4596 (Zicclsm unaligned access, +74% compression speed) has been stalled on maintainer Cyan4973 for an extended period. Four additional performance PRs also stalled (#4622, #4643, #4668, #4557 from Alibaba).

**LZ4:** `LZ4_FAST_DEC_LOOP` is the fast decompression path used on x86 and arm64. It is disabled for riscv64. Three competing PRs (#1678, #1739, #1738) attempt to enable it or provide an RVV alternative. None are merged. `wildCopy64` is aarch64-only with no riscv64 equivalent.

**jemalloc:** Open issue #2399 (cross-compilation regression, 3+ years no maintainer response) makes reproducible cross-compilation of jemalloc unreliable. This affects any MyRocks build with `WITH_JEMALLOC=ON`. The Zihintpause spin-wait extension is not implemented, creating a performance gap under lock contention.

---

## 11. Known Bugs and Active Issues

### RocksDB (upstream engine for MyRocks)

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| PR #14530 | Fix multiple RISC-V CMake build issues: dead code typo, LLD detection | Open (CLA signed) | High | Dead code typo means hardware optimization never activates; LLD link failure blocks GCC builds |
| PR #14536 | RISC-V: CRC32c with Zbc extension (16.9x speedup on SG2044) | Open | High | Unmerged; largest single performance gap |
| PR #14894 | Add Zvbc vector CRC32c for riscv64 | Open | Medium | Depends on #14536 |
| PR #14604 | Sync xxhash.h for RISC-V RVV XXH3 dispatch | Open | Medium | Tested on SG2044; all tests pass |
| PR #13740 | RocksJava musl libc on riscv64 | Open | Low | Affects Java API users only |
| PR #10901 | SIGILL from `rdcycle` blocked by kernel on RISC-V | Closed (2022) | Historical | Fixed by switching to `rdtime`; re-enabled in Linux 6.2+ |
| Issue #7051 / PR #7060 | Build fails on riscv64: missing `-latomic` | Closed (2020) | Historical | Root cause of original Debian riscv64 failure |

### MariaDB (downstream, where MyRocks functionality ships on riscv64)

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [MDEV-29875](https://jira.mariadb.org/browse/MDEV-29875) | RocksDB/MyRocks fails to build on riscv64: stale submodule + jemalloc mm_malloc.h scope issue | Open/Critical | Critical | Filed 2022-10-26, open as of Aug 2026; Debian maintainers carry patches; unresolved upstream |
| MDEV-23051 | Missing `-latomic` linkage for RocksDB on riscv64 | Fixed (MariaDB 10.3.24) | Historical | |
| MDEV-30554 | Re-fix of `-latomic` regression | Fixed (2023) | Historical | |

**Correctness bugs on riscv64:** None identified. All known riscv64 issues are build failures or performance gaps, not data corruption or semantic errors.

---

## 12. Objections and Upstream Blockers

**Repository archived (Critical):** facebook/mysql-5.6 is read-only as of 2026-03-01. No upstream PR can be merged. Investment in the Facebook upstream is not actionable. The effective upstream for riscv64 enablement is the MariaDB repository ([MariaDB Server](https://github.com/MariaDB/server)), which independently maintains a RocksDB integration.

**No upstream owner for riscv64 (High):** No Meta engineer has ever worked on riscv64 support for MyRocks. The two riscv64 PRs in RocksDB were contributed by PLCT Lab and Evolved Binary, not Meta. There is no internal Meta champion for riscv64 MyRocks.

**Oracle OCA wall (Medium):** MySQL upstream (Oracle) requires the Oracle Contributor Agreement. Oracle's only riscv64 PR (#639, CRC32C hardware acceleration) was auto-closed by the OCA bot after 31 days unreviewed. This blocks any direct MySQL riscv64 fixes through Oracle's upstream. Relevant because MyRocks is a MySQL plugin; a MySQL bug on riscv64 is also a MyRocks bug.

**RocksDB CLA process (Medium):** PR #14530 (CMake riscv64 fixes) has been open since 2026-03-30 with CLA signed. The delay indicates low review bandwidth, not a policy objection.

**MDEV-29875 (High):** A critical-severity open MariaDB bug since October 2022 documents that mariadb-plugin-rocksdb fails to build on riscv64 without maintainer-applied patches. This has never been resolved upstream. Debian carries patches as a workaround. Investment should target closing this bug in the MariaDB repository.

**Acceptance probability for riscv64 contributions:**
- RocksDB: High. Two prior community riscv64 PRs were accepted. PR #14536 (CRC32c) has CLA signed; the primary delay appears to be review bandwidth.
- MariaDB: High for MDEV-29875; MariaDB actively ships riscv64 packages and has motivation to fix a critical bug.
- MySQL/Oracle: Low. The OCA process and Oracle's pattern of auto-closing community PRs without review make this path unreliable.

---

## 13. Investment Analysis

RISE has conducted no work on MyRocks. The RISE wheel builder does not include MyRocks (it covers Python packages; MyRocks has no Python package). All work described below is greenfield.

The repository architecture requires targeting two upstreams: RocksDB (the storage engine) and MariaDB (the MySQL integration that actually ships on riscv64). The archived facebook/mysql-5.6 is not a viable target.

### 13.1 Functional Enablement

The dominant functional blocker is [MDEV-29875](https://jira.mariadb.org/browse/MDEV-29875): RocksDB/MyRocks fails to build on riscv64 in the MariaDB upstream without external patches. This must be fixed for any production deployment. Work involves fixing the jemalloc `mm_malloc.h` scope issue and updating the bundled RocksDB submodule to a version with riscv64 fixes. The Debian patch already exists as a reference implementation; upstreaming it is the task.

The RocksDB CMake riscv64 fix (PR #14530) must be merged to enable CMake-based builds. This is already contributed with CLA signed; the investment is engineering engagement to get it reviewed and merged.

### 13.2 Performance Optimization

The highest-ROI performance item is CRC32c hardware acceleration (PR #14536, RocksDB). A 16.9x throughput improvement on SG2044. The PR exists; the investment is review engagement and, if needed, iterating on the implementation to address reviewer feedback.

Secondary items: zstd Zicclsm fix (PR #4596, +74% compression throughput) and LZ4 FAST_DEC_LOOP enablement. Both require upstream maintainer engagement; the zstd item is gated on maintainer Cyan4973 responsiveness. These are tracked under separate reports for zstd and LZ4.

Spin-wait (Zihintpause) in both RocksDB and jemalloc is low-priority but addressable.

### 13.3 CI/CD Infrastructure

The facebook/mysql-5.6 repository is archived; CI cannot be added there. Useful CI investment targets:
1. MariaDB CI: add a riscv64 build job to the MariaDB upstream CI (currently absent). This would catch regressions of the kind that opened MDEV-29875.
2. RocksDB CI: add a riscv64 QEMU job to the RocksDB upstream CI (currently absent). Precedent exists (Snappy, LZ4, zstd all added QEMU riscv64 CI in 2023-2025).

### 13.4 Ecosystem Enablement

MyRocks has no dependent package ecosystem (it is a database storage engine plugin). Section 10 is omitted per policy.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Upstream MDEV-29875 fix to MariaDB: fix jemalloc mm_malloc.h scope + update RocksDB submodule | 2 | MariaDB contributor | Critical |
| Functional | Land RocksDB PR #14530 (CMake riscv64 build fixes) | 1 | RocksDB reviewer engagement | High |
| Performance | Land RocksDB PR #14536 (CRC32c Zbc, 16.9x on SG2044) | 1 | RocksDB reviewer engagement | High |
| Performance | Implement Zihintpause spin-wait in RocksDB `AsmVolatilePause()` | 1 | Community / Qualcomm | Medium |
| Performance | Land RocksDB PR #14604 (XXH3 RVV via xxhash.h sync) | 1 | RocksDB reviewer engagement | Medium |
| CI/CD | Add riscv64 QEMU build+test job to RocksDB upstream CI | 2 | Community / Qualcomm | High |
| CI/CD | Add riscv64 build job to MariaDB upstream CI | 2 | MariaDB contributor | High |
| Functional | Land RocksDB PR #13740 (musl libc RocksJava on riscv64) | 1 | RocksDB reviewer engagement | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [facebook/mysql-5.6 repository (archived 2026-03-01)](https://github.com/facebook/mysql-5.6)
- [facebook/rocksdb repository](https://github.com/facebook/rocksdb)
- [MyRocks homepage](http://myrocks.io/)
- [RocksDB PR #9215: initial riscv64 build fix, -latomic linkage (merged 2022)](https://github.com/facebook/rocksdb/pull/9215)
- [RocksDB PR #9366: build_detect_platform riscv64 detection (merged 2022)](https://github.com/facebook/rocksdb/pull/9366)
- [RocksDB PR #14530: CMake riscv64 multi-fix: dead code typo + LLD detection (open)](https://github.com/facebook/rocksdb/pull/14530)
- [RocksDB PR #14536: CRC32c Zbc hardware acceleration on riscv64 (open)](https://github.com/facebook/rocksdb/pull/14536)
- [RocksDB PR #14604: xxhash.h sync for RISC-V RVV XXH3 dispatch (open)](https://github.com/facebook/rocksdb/pull/14604)
- [RocksDB PR #14894: Zvbc vector CRC32c for riscv64 (open)](https://github.com/facebook/rocksdb/pull/14894)
- [RocksDB PR #13740: musl libc RocksJava on riscv64 (open)](https://github.com/facebook/rocksdb/pull/13740)
- [RocksDB PR #10901: SIGILL from rdcycle on RISC-V (closed)](https://github.com/facebook/rocksdb/pull/10901)
- [RocksDB PR #12139: -march=native invalid on riscv64, RocksJava fix (closed)](https://github.com/facebook/rocksdb/pull/12139)
- [MariaDB MDEV-29875: RocksDB fails to build on riscv64 (open/critical)](https://jira.mariadb.org/browse/MDEV-29875)
- [MariaDB MDEV-23051: missing -latomic for RocksDB on riscv64 (fixed)](https://jira.mariadb.org/browse/MDEV-23051)
- [Debian tracker: mariadb package (includes mariadb-plugin-rocksdb)](https://tracker.debian.org/pkg/mariadb)
- [Ubuntu packages: mariadb-plugin-rocksdb noble](https://packages.ubuntu.com/noble/mariadb-plugin-rocksdb)
- [zstd PR #4596: Zicclsm unaligned access, +74% compression (open)](https://github.com/facebook/zstd/pull/4596)
- [LZ4 PR #1678: FAST_DEC_LOOP for riscv64 (open)](https://github.com/lz4/lz4/pull/1678)
- [RISE Project member list](https://riseproject.dev/members/)
- [Meta Open Source CLA](https://code.facebook.com/cla)