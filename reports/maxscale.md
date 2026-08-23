---
title: MaxScale
---

# MaxScale

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for MaxScale<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[MaxScale](https://mariadb.com/kb/en/maxscale/) is a database proxy and query router for MariaDB and MySQL. It provides connection pooling, read/write splitting, query rewriting, high-availability failover, and CDC (change data capture) functionality. It is deployed in front of MariaDB Server clusters and is commonly used in production deployments where the database tier requires transparent routing or load balancing.

MaxScale is licensed under the **Business Source License (BSL) 1.1**, not an OSI-approved open-source license. The Additional Use Grant permits production use with fewer than three server instances; versions convert to GPL v2+ after a fixed period (for example, version 24.02 converts on 2027-04-10). This is a commercially driven license structure.

**Governance:** MaxScale is 100% controlled by MariaDB plc (formerly MariaDB Corporation Ab). It has no external foundation affiliation. The five largest contributors by commit count are all MariaDB plc or MariaDB Corporation employees: markus456 (Markus Makela, 13,532 commits), jhnwkmn (Johan Wikman, 5,789 commits), ekorh475 (Esa Korhonen, 3,266 commits), mariadb-ThienLy (Thien Ly, 2,844 commits), MassimilianoPinto (historical, 1,426 commits). There is no significant external contributor base. There is no MAINTAINERS, OWNERS, or CODEOWNERS file.

**Community culture on new ports:** Because MaxScale is a single-vendor commercial project with a BSL license, there is no community porting culture. Architecture port requests must originate from or be approved by MariaDB plc. No RISC-V port has been requested, discussed, or filed anywhere in the public issue tracker or pull request history.

The repository ([mariadb-corporation/MaxScale](https://github.com/mariadb-corporation/MaxScale)) was created 2013-12-16 and has 1,496 stars and 350 forks as of the research date. The default branch is `24.02`.

---

## 2. Port History and Upstreaming Timeline

No RISC-V port history exists. The table below summarizes the complete search result.

| Date | Event | Source |
|------|-------|--------|
| - | No issue filed for riscv64 support | [GitHub Issues search: riscv repo:mariadb-corporation/MaxScale](https://github.com/mariadb-corporation/MaxScale/issues) |
| - | No PR filed for riscv64 support | [GitHub PR search: riscv repo:mariadb-corporation/MaxScale](https://github.com/mariadb-corporation/MaxScale/pulls) |
| - | No commit referencing "riscv" or "risc-v" in repo history | GitHub commit search API |
| - | No Jira ticket filed in MXS project for riscv | MariaDB Jira MXS project search |

The only occurrences of the string "riscv" in the entire codebase are in two vendored GNU autoconf files: `server/modules/parser_plugin/pp_sqlite/sqlite-src-3110100/config.sub` and `config.guess`. These are generic architecture-enumeration scripts bundled with SQLite 3.11.0 that list all known CPU architecture triplets as a reference database for the autoconf build system. They contain no MaxScale-specific porting work and no architecture-conditional logic that affects MaxScale compilation or behavior.

**No RISC-V port exists. Nothing is upstream because nothing has been started.**

---

## 3. Upstream Support Tier

MaxScale publishes no formal platform tiering document (no PLATFORMS.md, SUPPORT.md, or equivalent). The supported platform set is inferred from the build system and packaging scripts.

Supported platforms based on `BUILD/install_build_deps.sh` and packaging documentation:
- Debian/Ubuntu (apt-based) on x86_64
- RHEL/Rocky/CentOS/Alma Linux (yum-based) on x86_64
- SUSE (zypper-based) on x86_64
- aarch64 receives a single explicit architecture check in `install_build_deps.sh` and `install_npm.sh` (an `is_arm()` guard for Node.js binary selection)

**Comparison table:**

| Dimension | amd64 | arm64 (aarch64) | riscv64 |
|-----------|-------|-----------------|---------|
| Official binary packages | Yes (MariaDB repos, all major distros) | No [NEEDS VERIFICATION] | No |
| CI pipeline | None visible in repo | None visible in repo | None |
| Release engineering coverage | Full | Unknown | None |
| Build system explicit handling | Full | Partial (Node.js arch check) | None |
| Documented in install guide | Yes | Not explicitly | No |

No CI of any kind is present in the repository. The `.github/` directory contains only `dependabot.yml`; there is no `workflows/` subdirectory. There are no Jenkinsfile, `.gitlab-ci.yml`, or `.cirrus.yml` files in the repository root.

For riscv64, the upstream support tier is: **unsupported, untested, no binaries, no CI.**

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

MaxScale is written in C++17 (core) and C99 (some modules). It is Linux-only (uses epoll). The key arch-sensitive subsystems are:

### 4.1 SQL Canonicalization SIMD (maxutils/maxsimd)

This is the only SIMD-optimized subsystem in MaxScale. It converts query literals to `?` placeholders for cache key normalization and query routing deduplication. It is a hot path in router-heavy deployments.

`maxutils/maxsimd/src/canonical.cc` and `multistmt.cc` both use the following dispatch pattern:

```c
#if defined (__x86_64__)
    // AVX2 path: simd256::make_markers / simd256::is_multi_stmt_impl
    if (cpu_info.has_avx2) { ... }
    else { generic::get_canonical(pSql); }
#else
    // All non-x86_64 architectures, including riscv64 and aarch64
    generic::get_canonical(pSql);
#endif
```

`maxutils/maxsimd/src/impl/simd256.hh` and `simd256.cc` are entirely wrapped in `#if defined (__x86_64__)` and use `<immintrin.h>`, `__m256i`, and `__attribute__((__target__("avx2")))` throughout. There is no NEON (aarch64) path and no RVV (riscv64) path. The `simdimpl` static library compiles to an empty object on riscv64 with no error.

### 4.2 xxHash (maxutils/maxbase)

The vendored `xxHash` header (`maxutils/maxbase/include/maxbase/xxHash/xxhash.h`, 5,581 lines) contains zero occurrences of "riscv" or `__riscv`. On x86_64, xxHash activates SSE2/AVX2 paths. The xxHash source contains an NEON path for aarch64. riscv64 receives the generic scalar path.

### 4.3 CRC32 (server/modules/protocol/NoSQL)

`server/modules/parser_plugin/pp_sqlite/sqlite-src-3110100/config.sub` aside, there is a file `server/modules/protocol/NoSQL/crc32-x86.c` (165 lines) described in the source as x86-only CRC32 from MongoDB/WiredTiger public domain code. No riscv64 equivalent exists in the repository. [NEEDS VERIFICATION: whether this file is conditionally compiled or universally linked]

### 4.4 CpuInfo

`maxutils/maxbase/include/maxbase/cpuinfo.hh` defines a `CpuInfo` struct that lists only x86 SIMD capabilities (MMX, SSE2, SSE3, SSE4.1, SSE4.2, AVX2). There is no `has_rvv` field, no `has_riscv_zbb` field, and no RISC-V extension detection of any kind. On riscv64, all `has_*` booleans will be false, which correctly disables all SIMD dispatch.

### 4.5 JIT

MaxScale has no internal JIT compiler. It uses PCRE2 for regex matching, which has its own JIT (sljit-based). MaxScale gates PCRE2 JIT off for PCRE2 <= 10.32 via compile flag `-DMXS_PCRE2_NO_JIT=1`. For PCRE2 10.41+ (which added riscv64 JIT support in sljit), JIT would be available. See Section 9 for PCRE2 dependency details.

### Component comparison table:

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| SQL canonicalization (maxsimd) | AVX2 hand-tuned | Scalar C fallback | Scalar C fallback |
| xxHash | SSE2/AVX2 | NEON | Scalar |
| CRC32 (NoSQL module) | x86 hardware intrinsics | Unknown | No equivalent [NEEDS VERIFICATION] |
| PCRE2 regex JIT | Full (x86 sljit) | Full (ARM64 sljit) | Available in PCRE2 10.41+ (riscv64 sljit) |
| Connection pooling, routing logic | Arch-neutral C++ | Same | Same |
| SSL/TLS (via OpenSSL or GnuTLS) | Full | Full | Functional (see Section 9) |

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Standard build procedure

From `Documentation/Getting-Started/Building-MaxScale-from-Source-Code.md`:

```bash
git clone https://github.com/mariadb-corporation/MaxScale
mkdir build && cd build
../MaxScale/BUILD/install_build_deps.sh
cmake ../MaxScale -DCMAKE_INSTALL_PREFIX=/usr
make
sudo make install
sudo ./postinst
```

**Compiler requirements:**
- GCC >= 4.9 (per docs); practical minimum is GCC 7+ for C++17
- C standard: C99 (`set(CMAKE_C_STANDARD 99)`)
- C++ standard: C++17 (`set(CMAKE_CXX_STANDARD 17)`)
- CMake >= 3.16 (CMakeLists.txt: `cmake_minimum_required(VERSION 3.16)`); packaging requires 3.25.1
- Clang is supported; the CMakeLists.txt contains Clang-specific warning suppression

### 5.2 Build script blockers on riscv64

Three build helper scripts contain hardcoded architecture assumptions that fail on riscv64:

**`BUILD/install_cmake.sh`:** For aarch64, the script explicitly falls back to downloading CMake 3.20.2 because CMake 3.16 has no aarch64 binary. There is no equivalent handling for riscv64. On riscv64, the script will attempt to download a `cmake-...-Linux-x86_64.tar.gz` binary, which will not execute. **Workaround:** Install CMake >= 3.16 from the OS package manager (available in Debian/Ubuntu riscv64 repos) or build from source.

**`BUILD/install_npm.sh`:** The architecture detection block is:

```bash
if [ "$(arch)" == "aarch64" ]; then node_arch=arm64
elif [ "$(arch)" == "ppc64le" ]; then node_arch=ppc64le
else node_arch=x64
fi
```

On riscv64, `arch` returns `riscv64`, which falls through to `node_arch=x64`, and the script downloads an x86_64 Node.js binary that will not execute on riscv64. **Workaround:** Install a system riscv64 Node.js >= 14 and pass `-DWITH_SYSTEM_NODEJS=Y` to CMake.

**`maxctrl/build.sh`:** Uses `npx pkg ... -t node14-linux` to produce a self-contained MaxCtrl binary. The `pkg` tool's target list (`node14-linux`) covers only x64, arm64, and ppc64le - not riscv64. **Workaround:** `-DBUILD_MAXCTRL=N` unless a system Node.js riscv64 binary is present.

### 5.3 CMake flags for a minimal riscv64 build

The reference Dockerfile (`Documentation/REST-API/templates/Dockerfile`) provides the canonical minimal flag set:

```cmake
cmake ../MaxScale \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_BINLOG=N \
  -DBUILD_CDC=N \
  -DBUILD_GSSAPI=N \
  -DBUILD_GUI=N \
  -DBUILD_KAFKACDC=N \
  -DBUILD_KAFKAIMPORTER=N \
  -DBUILD_KMIP_KEY_MANAGER=N \
  -DBUILD_LUAFILTER=N \
  -DBUILD_MAXCTRL=N \
  -DBUILD_MIRROR=N \
  -DBUILD_NOSQL=N \
  -DBUILD_QC_MYSQLEMBEDDED=N \
  -DBUILD_RABBITMQ=N \
  -DBUILD_STORAGE_MEMCACHED=N \
  -DBUILD_STORAGE_REDIS=N \
  -DBUILD_TESTS=N \
  -DBUILD_TOOLS=N \
  -DBUILD_VAULT_KEY_MANAGER=N
```

Additional flags relevant for riscv64:

| Flag | Default | riscv64 note |
|------|---------|--------------|
| `WITH_LTO` | ON | `check_ipo_supported()` may abort with older LLD or gold on riscv64; set OFF if linker does not support LTO |
| `FORCE_BUNDLE` | ON | Builds microhttpd, jansson, PCRE2, libssh, rdkafka from source; acceptable on riscv64 |
| `WITH_JEMALLOC` | OFF | Leave OFF; cross-build issues in jemalloc; no riscv64 CI |
| `WITH_TCMALLOC` | OFF | Leave OFF; per-CPU RSEQ cache disabled on riscv64 |
| `WITH_SYSTEM_NODEJS` | OFF | Set ON if building MaxCtrl with a system riscv64 Node.js |

### 5.4 Cross-compilation

No cross-compilation toolchain file (`cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake`) exists in the repository. No QEMU usage is documented or scripted anywhere. For cross-compilation, the user must author a CMake toolchain file specifying `CMAKE_SYSTEM_NAME`, `CMAKE_C_COMPILER`, and `CMAKE_CXX_COMPILER` pointing to a `riscv64-linux-gnu` cross toolchain.

### 5.5 libatomic

`cmake/FindLibatomic.cmake` calls `find_package(Libatomic REQUIRED)` unconditionally. On riscv64, GCC emits `__atomic_*` calls that require linking against `libatomic`. The package (`libatomic1` on Debian/Ubuntu, `libatomic` on RHEL/Fedora) is available in all major riscv64 distro packages and is expected to work normally.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Feature matrix

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Core proxy / query routing | Full | Full [NEEDS VERIFICATION] | Expected functional (no blocker identified) |
| Read/write splitting | Full | Full [NEEDS VERIFICATION] | Expected functional |
| Connection pooling | Full | Full [NEEDS VERIFICATION] | Expected functional |
| SQL canonicalization (with SIMD) | Full (AVX2) | Scalar only | Scalar only |
| PCRE2 regex JIT | Full | Full | Available if PCRE2 >= 10.41 |
| MaxCtrl (admin CLI) | Full | Partial (workaround needed) | Requires system Node.js + `-DWITH_SYSTEM_NODEJS=Y` |
| GUI (MaxGUI) | Full | Partial | Requires system Node.js; no pre-built binary |
| Kafka CDC module | Full | Unknown | No riscv64 CI for librdkafka; functional build unverified |
| NoSQL protocol emulation | Full | Unknown | Build requires `-DBUILD_NOSQL=N` unless `crc32-x86.c` is handled [NEEDS VERIFICATION] |
| TLS via OpenSSL | Full | Full | Functional; musl builds may hit OpenSSL hwprobe bug (#28118) |
| Memory allocator (jemalloc) | Full (optional) | Full (optional) | Functional but no CI; cross-build docs absent |
| Memory allocator (tcmalloc) | Full per-CPU RSEQ | Full per-CPU RSEQ | Per-thread cache fallback only (~30% slower per-CPU path unavailable) |

### Performance gaps

The only performance-relevant SIMD gap is in SQL canonicalization (`maxutils/maxsimd`). On amd64 with AVX2, this path processes SQL text using 256-bit wide SIMD operations. On riscv64, the same path executes as generic scalar C++. The performance delta depends on query volume and literal density.

No quantitative benchmark data exists for MaxScale on riscv64. Data not available: no published benchmarks comparing riscv64 vs amd64 or amd64 vs arm64 for MaxScale throughput or latency.

### Security hardening gaps

Data not available: no analysis of stack canaries, CFI, or ASLR effectiveness on riscv64 for MaxScale specifically was found in the research data. OpenSSL on riscv64 with musl has a known hwprobe detection bug that affects RISC-V extension advertised capability - see Section 9.

### Floating-point and NaN semantics

No floating-point-sensitive code was identified in MaxScale core. No NaN or floating-point semantics issues were found in the research data.

---

## 7. CI/CD Infrastructure

The `.github/` directory in the [MaxScale repository](https://github.com/mariadb-corporation/MaxScale) contains only `dependabot.yml`. The `workflows/` subdirectory does not exist (GitHub API returns HTTP 404 for `/repos/mariadb-corporation/MaxScale/contents/.github/workflows`). There are no Jenkinsfile, `.gitlab-ci.yml`, or `.cirrus.yml` files anywhere in the repository.

MaxScale has no CI pipeline of any kind in its public repository - not for amd64, not for arm64, and not for riscv64.

| CI dimension | amd64 | arm64 | riscv64 |
|--------------|-------|-------|---------|
| GitHub Actions | None | None | None |
| Jenkins | Not in repo | Not in repo | Not in repo |
| GitLab CI | None | None | None |
| RISE project runners | No | No | No |
| Build smoke test | None public | None public | None |
| Test suite run | None public | None public | None |

The absence of any public CI is consistent with a commercial product where internal testing infrastructure is not published. No RISE project involvement was found: MaxScale does not appear in the [RISE project member list](https://riseproject.dev/members/), in any RISE blog post, or in the [RISE wheel builder](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/) package list.

---

## 8. Distribution and Release Status

**GitHub Releases:** The [MaxScale GitHub releases page](https://github.com/mariadb-corporation/MaxScale/releases) has zero published releases. The GitHub API returns an empty array `[]` for release assets. MaxScale distributes binaries exclusively through the MariaDB download portal, not GitHub.

**MariaDB download portal:** The portal at `https://downloads.mariadb.com/MaxScale/` returned HTTP 522 during research and could not be fully audited. The [installation guide](https://mariadb.com/kb/en/mariadb-maxscale-installation-guide/) describes only Debian/Ubuntu and RHEL/Rocky/Alma Linux family packages with no CPU architecture qualification. No riscv64 packages are mentioned anywhere in MariaDB documentation. [NEEDS VERIFICATION: exact list of architectures published at downloads.mariadb.com once the portal is accessible]

**Debian:** MaxScale is not tracked in the [Debian package tracker](https://tracker.debian.org/pkg/maxscale) (HTTP 404). It is not a Debian-maintained package. No riscv64 Debian package exists.

**Ubuntu 24.04 (Noble):** [Ubuntu package search](https://packages.ubuntu.com/search?keywords=MaxScale&suite=noble) returns "Sorry, your search gave no results." MaxScale is not packaged in Ubuntu for any architecture.

**Arch Linux RISC-V:** [archriscv.felixc.at](https://archriscv.felixc.at/?q=maxscale) returns no results for MaxScale.

**Summary:** No pre-built riscv64 binary exists through any distribution channel. To obtain a working MaxScale binary on riscv64, a user must:

1. Install CMake >= 3.16 from the OS package manager (not from `install_cmake.sh`)
2. Install system Node.js >= 14 for riscv64 (not from `install_npm.sh`)
3. Clone the repository
4. Configure with `-DBUILD_GUI=N -DBUILD_MAXCTRL=N` (or with `-DWITH_SYSTEM_NODEJS=Y` if system Node.js is present)
5. Build from source with no upstream validation

---

## 9. Dependencies

### Summary table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|---------------|--------------|-----------------|-----------------|
| MariaDB Connector/C | Core DB connectivity; always bundled | Builds (generic C) | No CI | No riscv64 release | No riscv64 CI; `ucontext` fallback for async context |
| OpenSSL | TLS/crypto; required | Builds; 36 riscv64-specific asm files | QEMU CI | Ships in all riscv64 distros | musl hwprobe bug #28118 (glibc builds unaffected) |
| PCRE2 | Regex matching; bundled or system | Builds; riscv64 JIT in 10.41+ | CI added 2025-01-11 | 10.41+ | Closed JIT correctness bug with rv64gcb_zicond; open SIMD sign bug (sljit PR #284) |
| zstd | Network compression; required | Builds; riscv64 detection merged 2025-12 | QEMU CI (vlen 128/256/512) | Upstream dev | Multiple performance PRs stalled; no correctness issues |
| libcurl | HTTP REST API management | Builds | CI: riscv64 cross-compile | Ships in Debian/Ubuntu/Fedora riscv64 | None identified |
| GnuTLS | TLS alternative; required | Builds (pure C) | No riscv64 CI visible | In distro riscv64 repos | None identified |
| jemalloc | Optional memory allocator (off by default) | Builds since 5.1.0 (2018) | No riscv64 CI | No riscv64-specific release | No CI; cross-build docs absent (#2399 open 3+ years) |
| tcmalloc | Optional memory allocator (off by default) | Partial (stub with kAddressBits=48) | No riscv64 CI | Not in support matrix | Missing `percpu_rseq_riscv.S`; per-thread fallback functional but ~30% slower |
| librdkafka | Kafka CDC modules (optional) | Builds (LTO issue #2426 closed) | No riscv64 CI | No riscv64 package | No riscv64 CI; Kafka modules will be absent from riscv64 packages |
| libssh | SSH tunneling for Cluster Manager; bundled | Builds (portable C) | No riscv64 CI visible | In distro riscv64 repos | None identified |
| Avro C library | CDC/Binlog Avro serialization; bundled | Builds (pure C) | No riscv64 CI | No Apache Avro riscv64 CI | None identified |
| Jansson | JSON parsing; bundled | Builds (pure C) | No riscv64 CI | In distro riscv64 repos | None identified |
| libmicrohttpd | Embedded HTTP server; bundled | Builds (portable C) | No riscv64 CI | In Debian riscv64 | None identified |

### Deep-dive: OpenSSL

OpenSSL has 36 riscv64-specific assembly files and a dedicated CI workflow with 13 extension configurations. The open issue [#28118](https://github.com/openssl/openssl/issues/28118) affects musl-based riscv64 builds: hwprobe detection is broken, causing incorrect RISC-V extension capability reporting. This only affects builds using musl libc (Alpine Linux, static builds). glibc-based Debian/Ubuntu riscv64 builds are unaffected. A separate intrinsics cleanup PR [#29453](https://github.com/openssl/openssl/pull/29453) is pending.

### Deep-dive: PCRE2

PCRE2 10.41 (released December 2022) added a riscv64 JIT backend via sljit. MaxScale gates JIT off for PCRE2 <= 10.32 with `-DMXS_PCRE2_NO_JIT=1` at build time, so deployments using PCRE2 10.33-10.40 would run without JIT regardless of architecture. A JIT correctness bug affecting `rv64gcb_zicond` was opened and subsequently closed. An open sljit SIMD sign bug (sljit PR #284) remains; its impact on PCRE2 riscv64 correctness is not fully characterized. A riscv64 CI job was added to PCRE2 on 2025-01-11 and the test suite passes on real Fedora hardware.

### Deep-dive: zstd

zstd merged riscv64 detection (`__riscv && __riscv_xlen == 64`) in December 2025 and added RVV CI in July 2025 covering vlen=128/256/512. Multiple performance optimization PRs are stalled upstream: unaligned access optimization (#4546), RVV XXH3 (#4471), 4x Huffman (#4622), and prefetch PRs. There are no known correctness issues on riscv64. MaxScale uses zstd for network compression; functional correctness is not at risk, but compression throughput will be lower on riscv64 than on amd64 until the performance PRs merge.

### Risk summary

| Risk Level | Dependency | Issue |
|------------|------------|-------|
| Medium | PCRE2 JIT | Closed correctness bug for `rv64gcb_zicond`; open SIMD sign bug in sljit; JIT newly available on riscv64 |
| Medium | OpenSSL | musl riscv64 hwprobe detection broken (#28118); glibc builds unaffected |
| Low-Medium | zstd | Functional; multiple performance PRs stalled |
| Low | MariaDB Connector/C | Bundled from source; functional; no riscv64 CI means regressions go undetected |
| Low (off by default) | jemalloc | No CI; cross-build docs absent; not a blocker given default-off |
| Low (off by default) | tcmalloc | Per-CPU RSEQ cache unavailable; per-thread fallback works; not a blocker given default-off |
| Low | librdkafka | No riscv64 CI; Kafka modules are optional |

No hard blockers exist for a riscv64 build of MaxScale with default CMake options (`FORCE_BUNDLE=ON`, `WITH_JEMALLOC=OFF`, `WITH_TCMALLOC=OFF`, `-DBUILD_KAFKACDC=N`).

---

## 11. Known Bugs and Active Issues

No RISC-V-specific bugs or issues exist in the MaxScale issue tracker. The complete search result:

| Tracker | Query | Result |
|---------|-------|--------|
| GitHub Issues (mariadb-corporation/MaxScale) | "riscv" | 0 results |
| GitHub Issues (mariadb-corporation/MaxScale) | "riscv64" | 0 results |
| MariaDB Jira (MXS project) | text ~ "riscv" | 0 results |

No correctness bugs. No performance regressions filed. No architecture-specific failures reported. The reason is not that riscv64 is well-tested - it is that riscv64 has never been tested. No one has run MaxScale on riscv64 hardware and reported results anywhere in the public record.

---

## 12. Objections and Upstream Blockers

**Organizational blocker: BSL license and single-vendor control.** MaxScale is not a community-maintained project. All maintainers are MariaDB plc employees. A RISC-V port contributed externally would need MariaDB plc review and acceptance. Given the BSL license structure and the commercial focus of the project, the company has no evident incentive to accept riscv64 contributions unless driven by a direct business relationship (e.g., a hardware partner or cloud customer).

**Stated objections:** None are on record because no RISC-V port request has been filed. MariaDB plc has not publicly commented on riscv64 support for MaxScale.

**Technical blockers:**
- `install_cmake.sh` and `install_npm.sh` scripts download x86_64 binaries and fail silently on riscv64 (fallthrough to wrong arch). These would need to be patched before MaxScale's own build scripts work on riscv64.
- MaxCtrl and MaxGUI require Node.js. The `pkg` packaging tool used to build the self-contained MaxCtrl binary does not support riscv64 targets. MaxCtrl cannot be packaged as a standalone binary for riscv64 without upstream changes to the `pkg` tool or a switch to an alternative bundler.
- No CI exists. Any riscv64 enablement work would regress with zero upstream protection unless CI is also added.

**Acceptance probability:** Low without a MariaDB plc business relationship. The BSL license, single-vendor governance, and absence of any community porting tradition make unsolicited riscv64 contributions unlikely to be prioritized or merged promptly.

---

## 13. Investment Analysis

RISE has no prior involvement with MaxScale. No RISE-funded work exists for this project. All investment sizing below represents net new work.

### 13.1 Functional Enablement

The core proxy engine should compile and run on riscv64 without correctness issues - the C++17 codebase is architecturally portable and the only SIMD code (`maxutils/maxsimd`) correctly falls back to generic scalar code on non-x86 architectures. The effort required is to fix the build tooling and validate correctness.

Specific items:
- Patch `BUILD/install_cmake.sh` to handle riscv64 (trivial, 1-2 lines)
- Patch `BUILD/install_npm.sh` to handle riscv64 or document system Node.js requirement
- Validate `BUILD/install_build_deps.sh` against a riscv64 Debian/Ubuntu host
- Document the `cmake` flags required for a minimal riscv64 build
- Perform a build and basic smoke test on riscv64 hardware or QEMU

### 13.2 Performance Optimization

The SQL canonicalization path (`maxutils/maxsimd`) is the only SIMD-accelerated subsystem. Implementing an RVV path would require implementing the equivalent of `simd256::make_markers` and `simd256::is_multi_stmt_impl` using RISC-V Vector intrinsics and adding a dispatch branch for `#elif defined(__riscv) && defined(__riscv_vector)`. This is a meaningful optimization for query-heavy workloads but is not a correctness prerequisite.

A zstd RVV optimization contribution would also benefit MaxScale network compression throughput, but that work belongs to the zstd project (tracked separately).

### 13.3 CI/CD Infrastructure

MaxScale has no public CI at all. Adding riscv64 CI requires first establishing any CI, then adding the riscv64 target. Given the single-vendor, BSL-licensed project structure, it is more realistic to add CI within MariaDB plc's internal infrastructure than to push a GitHub Actions workflow into the public repository. External CI (e.g., a RISE-hosted runner) would require MariaDB plc agreement to use it.

### 13.4 Ecosystem Enablement

MaxScale has no package ecosystem of plugins or extensions requiring separate riscv64 enablement. The primary distribution gap is the absence of official riscv64 binary packages from MariaDB plc. Publishing riscv64 packages to the MariaDB download portal is a MariaDB plc business decision.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Fix `install_cmake.sh` and `install_npm.sh` for riscv64; verify build scripts on Debian riscv64 | 0.5 | External contributor / MariaDB plc | Critical |
| Functional | Build MaxScale from source on riscv64 hardware or QEMU and run smoke tests | 1 | External contributor | Critical |
| Functional | File and resolve any build failures discovered in smoke test | 1-2 | External contributor with MariaDB plc review | High |
| Functional | Document riscv64 build procedure (cmake flags, Node.js workaround) | 0.5 | External contributor | High |
| CI/CD | Negotiate with MariaDB plc to add riscv64 to internal CI | 2-4 (negotiation + integration) | Qualcomm/RISE + MariaDB plc | Medium |
| Performance | Implement RVV SIMD path in `maxutils/maxsimd` for SQL canonicalization | 3-5 | External contributor with MariaDB plc review | Low |
| Distribution | Negotiate riscv64 binary package publishing with MariaDB plc | 2-4 (business engagement) | Qualcomm/RISE + MariaDB plc | Medium |

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [MaxScale GitHub repository](https://github.com/mariadb-corporation/MaxScale)
- [MaxScale documentation homepage](https://mariadb.com/kb/en/maxscale/)
- [MaxScale installation guide](https://mariadb.com/kb/en/mariadb-maxscale-installation-guide/)
- [MariaDB MaxScale releases page (empty)](https://github.com/mariadb-corporation/MaxScale/releases)
- [maxutils/maxsimd/src/canonical.cc - SIMD dispatch](https://github.com/mariadb-corporation/MaxScale/blob/24.02/maxutils/maxsimd/src/canonical.cc)
- [maxutils/maxsimd/src/multistmt.cc - SIMD dispatch](https://github.com/mariadb-corporation/MaxScale/blob/24.02/maxutils/maxsimd/src/multistmt.cc)
- [BUILD/install_npm.sh - Node.js arch detection](https://github.com/mariadb-corporation/MaxScale/blob/24.02/BUILD/install_npm.sh)
- [BUILD/install_cmake.sh - CMake download script](https://github.com/mariadb-corporation/MaxScale/blob/24.02/BUILD/install_cmake.sh)
- [cmake/FindLibatomic.cmake](https://github.com/mariadb-corporation/MaxScale/blob/24.02/cmake/FindLibatomic.cmake)
- [Business Source License 1.1](https://mariadb.com/bsl11/)
- [RISE project member list](https://riseproject.dev/members/)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Debian package tracker - maxscale (HTTP 404, not packaged)](https://tracker.debian.org/pkg/maxscale)
- [Ubuntu package search - MaxScale noble (no results)](https://packages.ubuntu.com/search?keywords=MaxScale&suite=noble)
- [Arch Linux RISC-V package search - maxscale (no results)](https://archriscv.felixc.at/?q=maxscale)
- [OpenSSL issue #28118 - musl riscv64 hwprobe detection broken](https://github.com/openssl/openssl/issues/28118)
- [PCRE2 riscv64 CI addition (2025-01-11)](https://github.com/PCRE2Project/pcre2/actions)
- [zstd riscv64 detection merge](https://github.com/facebook/zstd/blob/dev/lib/common/cpu.h)
- [jemalloc issue #2399 - cross-build documentation absent](https://github.com/jemalloc/jemalloc/issues/2399)
- [MariaDB Connector/C repository](https://github.com/mariadb-corporation/mariadb-connector-c)