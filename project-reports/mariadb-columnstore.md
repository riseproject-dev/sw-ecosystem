---
title: MariaDB ColumnStore
---

# MariaDB ColumnStore

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for MariaDB ColumnStore<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

MariaDB ColumnStore is a columnar storage engine plugin for MariaDB Server, designed for analytical (OLAP) workloads. It originated as a fork of InfiniDB 4.6.7 (as stated in the repository README) and was first published to GitHub on 2016-05-23.

**Governance:** MariaDB ColumnStore is owned and developed entirely by MariaDB Corporation, now part of K1 Investment Management's portfolio following the 2023 acquisition of MariaDB plc. It is not governed by the MariaDB Foundation; the Foundation's scope is limited to MariaDB Server. The project lives under the [mariadb-corporation GitHub organization](https://github.com/mariadb-corporation/mariadb-columnstore-engine).

- License: GPL-2.0
- Bug tracker: [MariaDB JIRA, MCOL project](https://jira.mariadb.org/browse/MCOL) -- GitHub Issues are disabled on the repository
- No MAINTAINERS or CODEOWNERS file exists in the repository

**Maintainers:** All active contributors carry `@mariadb.com` email addresses. Top contributors by recent commit volume (top 100 commits as of August 2026):

| Contributor | Affiliation |
|---|---|
| Vasily Kozhukhovskiy | MariaDB Corporation (46/100 recent commits) |
| Timofey Turenko | MariaDB Corporation (PR merge lead, release manager) |
| Aleksei Antipovskii | MariaDB Corporation |
| Serguey Zefirov | MariaDB Corporation |
| Stanislav Usov | MariaDB Corporation |
| Alan Mologorsky | MariaDB Corporation |

No external community maintainers are identifiable. This is a single-vendor corporate project with essentially no independent contributor base.

**Community stance on new ports:** The aarch64 port required multiple PRs and was subsequently deprioritized -- arm64 CI is currently commented out in the Drone configuration. This history is the strongest available signal for how a new architecture port would be received: technically possible with effort, but not prioritized by the corporate team.

**RISE membership:** MariaDB is not a RISE Project member. The RISE member list (fetched from [riseproject.dev/members](https://riseproject.dev/members/)) includes no MariaDB entity. No RISE blog posts, wheel builder entries, or funded work items reference MariaDB ColumnStore.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2016-05-23 | Repository created on GitHub, forked from InfiniDB 4.6.7 | [GitHub repository metadata](https://github.com/mariadb-corporation/mariadb-columnstore-engine) |
| 2021-01-22 | PR #1731 merged: "MCOL-4510 thrift code need to be upgraded to support aarch64" (community contributor `zhaorenhai`) | [PR #1731](https://github.com/mariadb-corporation/mariadb-columnstore-engine/pull/1731) |
| 2021-11-04 | PR #2148 merged: "Fix compilation failure on aarch64 with gcc 10.3 Ubuntu 21.04" | [PR #2148](https://github.com/mariadb-corporation/mariadb-columnstore-engine/pull/2148) |
| Post-2021 | arm64 CI deprioritized: `local archs = ["amd64"]` with arm64 commented out in `.drone.jsonnet` | [.drone.jsonnet](https://github.com/mariadb-corporation/mariadb-columnstore-engine/blob/develop/.drone.jsonnet) |
| 2026-07-30 | PR #4075 merged: fix `simd_arm.h` compile failure on aarch64 with GCC 16 (ambiguous `__int128` template specialization); PR #4076 backports to develop-23.02 | [PR #4075](https://github.com/mariadb-corporation/mariadb-columnstore-engine/pull/4075) |
| Through 2026-08 | Zero riscv64 commits, issues, or PRs ever filed | GitHub code search, issue search, PR search |

**riscv64:** No port has been started. Zero commits, issues, PRs, or external references to riscv64 support exist anywhere in the repository, JIRA, package registries, or the public web.

---

## 3. Upstream Support Tier

No formal tier policy document exists (no PLATFORMS.md, SUPPORT.md, or equivalent).

Support level is inferred from CI coverage and release engineering:

| Architecture | CI Status | Official Binaries | Release Blocking |
|---|---|---|---|
| amd64 | Active (Drone, amd64 only) | No binaries on GitHub releases (source-only tags) | Yes |
| arm64 | Disabled (commented out in `.drone.jsonnet`) | No binaries | No |
| riscv64 | Not present in any CI config | No binaries | No |

GitHub releases (`vcolumnstore-23.10.4-1` through earlier tags) carry zero binary assets -- the releases are source-only tags. No distribution packages for riscv64 exist in Ubuntu, Debian, Arch Linux RISC-V, PyPI, or the RISE wheel builder.

The effective tier classification is: **amd64 = Tier 1, arm64 = Tier 3 (builds occasionally, no CI), riscv64 = unsupported/absent**.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

MariaDB ColumnStore's performance-critical path is columnar scan-and-filter in the primitives layer, implemented with architecture-specific SIMD code. The architecture split is strict and two-way.

### 4.1 SIMD Primitives

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD header | `utils/common/simd_sse.h` (1861 lines, SSE2/SSE4.1 intrinsics via `<smmintrin.h>`, `<emmintrin.h>`) | `utils/common/simd_arm.h` (1780 lines, ARM NEON/ASIMD via `<arm_neon.h>`) | Not present |
| Columnar filter dispatch (`column.cpp:1816`) | `vectorizedFilteringDispatcher<T, KIND, FT, ST>(...)` | `vectorizedFilteringDispatcher<T, KIND, FT, ST>(...)` | `scalarFiltering<T, FT, ST, KIND>(...)` (no SIMD) |
| RVV intrinsics | N/A | N/A | None (zero occurrences of `vfloat32m1_t`, `rvv`, `__riscv_v`) |

The dispatch guard at `primitives/linux-port/column.cpp:1816` is:

```cpp
#if defined(__x86_64__) || defined(__aarch64__)
    vectorizedFilteringDispatcher<T, KIND, FT, ST>(...);
    return;
#endif
scalarFiltering<T, FT, ST, KIND>(...);
```

On riscv64, the SIMD path is bypassed and the scalar path executes. This is a performance gap, not a correctness abort -- but the architecture check in primproc (Section 4.2) causes a functional abort before any query can reach this point.

### 4.2 Architecture Detection and Startup Guard

`primitives/primproc/archcheck.h` implements a three-way check:
- `__x86_64__`: returns `SSE4_2` via GCC multiversioning
- `__aarch64__`: returns `ASIMD` via runtime `AT_HWCAP` check
- `#else`: returns `UNKNOWN`

`primitives/primproc/primproc.cpp` line 711 enforces a hard startup abort:

```
if checkArchitecture() returns neither SSE4_2 nor ASIMD:
    print "Unsupported CPU architecture. ARM Advanced SIMD or x86_64 SSE4.2 required; aborting."
    return 1  // process exit
```

On riscv64, `UNKNOWN` is returned unconditionally, and `primproc` exits before processing any query. This is a functional blocker, not a performance gap. There is no scalar fallback bypass of this check.

### 4.3 128-bit Data Types

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `mcs_int128.h` -- 128-bit integer load | `__asm__ volatile("movups ...")` (SSE inline asm) | `memcpy` (safe) | Hits the `#elif defined(__GNUC__)` branch and emits x86 `movups` inline asm -- compile failure |
| `mcs_float128.h` -- 128-bit float typedef | `using float128_t = __float128` | `using float128_t = long double` | Hits the `__float128` branch -- GCC does not support `__float128` on riscv64, compile failure |

The `mcs_int128.h` dispatch has three branches:
1. `#ifdef __aarch64__` -- safe `memcpy`
2. `#elif defined(__GNUC__) && (__GNUC__ > 7) || defined(__clang__)` -- x86 SSE inline asm (`movups`)
3. `#else` -- x86 SSE inline asm (`movdqu xmm0`)

On riscv64, both GCC and Clang match the `#elif` branch and emit x86 SSE instructions, causing an assembler error. There is no `#elif defined(__riscv)` memcpy guard.

### 4.4 Assembly Files

Zero `.S` assembly files exist anywhere in the repository. All architecture-specific code is in C++ headers with preprocessor guards.

### 4.5 Summary Table

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD primitives | Full (SSE2/SSE4.1, 1861 lines) | Full (NEON/ASIMD, 1780 lines) | Missing |
| Architecture detection | Full | Full | Returns UNKNOWN, process aborts |
| 128-bit integer load | x86 inline asm | memcpy | x86 inline asm (compile fail) |
| 128-bit float type | `__float128` | `long double` | `__float128` (compile fail on riscv64 GCC) |
| SIMD unit tests | Full | Full | Zero test cases (both guards fail) |
| Scalar filter fallback | Present (unreachable via primproc abort) | Present (unreachable) | Present (unreachable -- primproc aborts first) |

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build Entry Point

MariaDB ColumnStore is a plugin to MariaDB Server. It is not a standalone build. Build procedure:

```bash
git clone https://github.com/MariaDB/server.git
cd server
git submodule update --init --recursive
cd storage/columnstore/columnstore
sudo build/bootstrap_mcs.sh --install-deps

# or directly via cmake from server root:
cmake -DCMAKE_BUILD_TYPE=RelWithDebInfo \
      -DCMAKE_INSTALL_PREFIX=/usr/ \
      -DPLUGIN_COLUMNSTORE=YES \
      -S /path/to/server \
      -B /path/to/build
cmake --build /path/to/build -j$(nproc)
```

The `bootstrap_mcs.sh` script pins GCC 11 (`GCC_VERSION="11"`) and requires C++20 support. On riscv64, the cmake configure step would be skipped entirely before reaching any compiler flag issues (see Section 5.2).

### 5.2 Build Blockers for riscv64

**Blocker 1 -- Hard architecture guard in the server CMakeLists.txt**

`MariaDB/server:storage/columnstore/CMakeLists.txt` contains:

```cmake
IF(CMAKE_SYSTEM_PROCESSOR STREQUAL "x86_64" OR
   CMAKE_SYSTEM_PROCESSOR STREQUAL "amd64" OR
   CMAKE_SYSTEM_PROCESSOR STREQUAL "aarch64")
    add_submodule_subdirectory(columnstore)
ENDIF()
```

`riscv64` is not in this list. The entire ColumnStore build is silently skipped on riscv64 with no warning, no error, and no fallback. This is the first and highest-priority fix required.

**Blocker 2 -- `-msse4.2` hardcoded in `FLAGS_ALL`**

`cmake/compiler_flags.cmake` line 70 includes `-msse4.2` in `FLAGS_ALL` (applied to all build types). The cmake macro `my_check_and_set_compiler_flag()` probes the flag before applying it, so on riscv64 the flag is discarded rather than causing a configure-time error -- but no SIMD equivalent for riscv64 is provided or detected.

**Blocker 3 -- x86 SSE inline asm in `datatypes/mcs_int128.h`**

As described in Section 4.3. The fix is a one-line guard (`#elif defined(__riscv)` with a `memcpy` body), but it has not been made.

**Blocker 4 -- `__float128` not supported on riscv64**

`datatypes/mcs_float128.h` uses `__float128` as `float128_t` on non-aarch64 targets. GCC does not support `__float128` on riscv64. Resolution requires either extending the `long double` alias to riscv64 or introducing software quad-precision emulation.

**Blocker 5 -- Startup abort in `primproc`**

As described in Section 4.2. Even if the build blockers are resolved, `primproc` will abort at process start on riscv64 until the architecture detection is extended to include `__riscv`.

### 5.3 Toolchain Requirements

- C++ standard: C++20 minimum (GCC 10+; GCC 11 pinned by `bootstrap_mcs.sh`)
- Bundled Boost 1.88.0 (fetched via `ExternalProject` from `archives.boost.io`) -- no riscv64-specific issues expected
- Bundled Apache Thrift 0.24.0 (fetched from GitHub tags, compiled with `-DBUILD_COMPILER=NO`) -- no riscv64-specific issues expected

### 5.4 Cross-Compilation and QEMU

No cross-compilation toolchain files exist in the repository (`cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake` -- both absent). No Dockerfiles for riscv64. No QEMU usage is documented or configured anywhere.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional Gaps (cannot execute at all on riscv64)

The `primproc` startup abort means no ColumnStore operation -- not scans, not aggregations, not writes -- executes on riscv64 in the current state. This is a total functional gap, not a partial one.

### 6.2 Performance Gaps (after functional blockers are resolved)

| Operation | amd64 | arm64 | riscv64 (post-fix, no RVV) |
|---|---|---|---|
| Columnar scan and filter | Vectorized (SSE2/SSE4.1) | Vectorized (NEON/ASIMD) | Scalar fallback only |
| Aggregation over columns | Vectorized | Vectorized | Scalar fallback only |

Data not available: no published benchmarks comparing scalar fallback performance to vectorized performance on any architecture for ColumnStore. The performance regression from scalar-only operation is unquantified in the research findings.

### 6.3 Floating-Point Semantics

`__float128` is absent on riscv64 with GCC. This affects decimal arithmetic in `datatypes/mcs_float128.h`. No riscv64-specific NaN or floating-point behavior bugs were found in JIRA or GitHub (data not available: JIRA is not publicly searchable via GitHub tooling).

### 6.4 Security Hardening

Data not available: no riscv64-specific security hardening analysis was performed in the research; the repository has no SECURITY.md or equivalent. No CFI, stack protection, or hardening flags specific to riscv64 were identified in the build system.

---

## 7. CI/CD Infrastructure

| CI System | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Drone CI (`.drone.jsonnet`) | Active (`local archs = ["amd64"]`) | Commented out (`//local archs = ["amd64", "arm64"]`) | Not present |
| GitHub Actions (`.github/workflows/`) | Does not exist (HTTP 404) | Does not exist | Does not exist |
| GitLab CI (`.gitlab-ci.yml`) | Does not exist | Does not exist | Does not exist |
| Jenkinsfile | Does not exist | Does not exist | Does not exist |
| Cirrus CI (`.cirrus.yml`) | Does not exist | Does not exist | Does not exist |

The only CI system in use is Drone CI. The active architecture list is `["amd64"]` only. arm64 was previously enabled but is currently commented out. riscv64 is not mentioned anywhere in the 37 KB Drone configuration file.

OS matrix (amd64 only): rockylinux:8, rockylinux:9, debian:11, debian:12, ubuntu:20.04, ubuntu:22.04, ubuntu:24.04.

No RISE CI runners are used. No hardware CI runners for riscv64 exist or are configured.

---

## 8. Distribution and Release Status

| Channel | riscv64 Status |
|---|---|
| [GitHub Releases](https://github.com/mariadb-corporation/mariadb-columnstore-engine/releases) | Source-only tags; zero binary assets on any release including the latest `vcolumnstore-23.10.4-1` (2025-05-16) |
| [PyPI](https://pypi.org/pypi/mariadb-columnstore/json) | Package does not exist (HTTP 404) |
| [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) | Not listed (79 packages indexed; ColumnStore absent) |
| [Ubuntu 24.04 (noble)](https://packages.ubuntu.com/search?keywords=mariadb-columnstore&suite=noble&searchon=names&section=all) | Not packaged |
| [Debian](https://tracker.debian.org/pkg/mariadb-columnstore) | Not a tracked Debian source package (HTTP 404) |
| [Arch Linux RISC-V](https://archriscv.felixc.at/?q=mariadb+columnstore) | Not present |

To obtain a working riscv64 binary: not possible in the current state. Building from source would require resolving all five blockers enumerated in Section 5.2, none of which has been started.

---

## 9. Dependencies

### 9.1 Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| MariaDB Server | Required host -- ColumnStore is a plugin | Builds | Partial | Community only | No official riscv64 packages; see `project-reports/mariadb.md` |
| Snappy | Column block compression | Builds | Unknown | Yes (distro) | RVV 1.0 and RVV 0.7 detection in CMake; scalar fallback available; see `project-reports/snappy.md` |
| LZ4 | Optional additional block compression (`WITH_COLUMNSTORE_LZ4`) | Builds | Unknown | Yes (distro) | Portable C fallback; one open RVV optimization proposal (#783) not a blocker; see `project-reports/lz4.md` |
| Boost 1.88.0 | Thread, filesystem, chrono, regex, program_options (bundled via ExternalProject) | Builds | Unknown | N/A (bundled) | Generic-portable components used; no riscv64-specific issues identified |
| Apache Thrift 0.24.0 | IPC/RPC between ColumnStore processes (bundled via ExternalProject) | Builds | Unknown | N/A (bundled) | No SIMD dependency; cross-platform C++ |
| libmarias3 | S3 object-storage backend (git submodule) | Likely builds | No | No | Depends only on libcurl and OpenSSL; no arch-specific code; no riscv64 CI |
| libcurl | HTTP transport for S3 access (system) | Builds | Yes (distro CI) | Yes | No riscv64 issues; see `project-reports/libcurl.md` |
| libxml2 | Configuration file parsing (`/etc/columnstore/Columnstore.xml`) (system) | Builds | Yes (distro CI) | Yes | No riscv64 issues; see `project-reports/libxml2.md` |
| OpenSSL | TLS (system, via libcurl/libmarias3) | Builds | Yes | Yes | No riscv64 issues; see `project-reports/openssl.md` |
| GCC `__float128` | 128-bit decimal arithmetic | Fails | N/A | N/A | Not supported by GCC on riscv64; compile blocker in `mcs_float128.h` |
| GCC `__int128` | 128-bit integer arithmetic | Works | N/A | N/A | Supported on riscv64 |

### 9.2 Critical Dependency Deep-Dives

**Snappy:** Has explicit RVV 1.0 and RVV 0.7 detection and falls back to a scalar C implementation on architectures without RVV. Not a blocker for riscv64.

**`__float128` (GCC built-in):** Not a library dependency but a compiler capability. GCC supports `__float128` on x86_64 and powerpc but not riscv64. The `mcs_float128.h` file uses `__float128` as the `float128_t` type on all non-aarch64 targets. Resolving this requires either adding riscv64 to the `long double` alias path (same as aarch64) or introducing software quad-precision (e.g., via libquadmath or a portable implementation).

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| PR #4075 | `simd_arm.h` compile failure on aarch64 with GCC 16 (ambiguous `__int128` template specialization in NEON SIMD layer) | Merged 2026-07-30 | Medium | aarch64-specific; x86 unaffected; relevant as a signal of ongoing SIMD maintenance burden |
| PR #4076 | Backport of PR #4075 to `develop-23.02` | Merged 2026-07-30 | Medium | Backport only |

**riscv64-specific bugs:** Zero filed in JIRA (MCOL project) or GitHub. No riscv64 bugs can be filed because GitHub Issues is disabled, and riscv64 has never been built or tested.

The MDEV tracker has MDEV-23051 "RocksDB build fails on riscv64" for a different storage engine. No equivalent ColumnStore ticket exists.

---

## 12. Objections and Upstream Blockers

### 12.1 Organizational Blockers

- MariaDB Corporation is not a RISE member and has no publicly stated riscv64 roadmap for ColumnStore.
- The project is single-vendor. Acceptance of external patches depends entirely on MariaDB Corp prioritization. The aarch64 experience is instructive: two community PRs were merged (2021), but arm64 CI was subsequently disabled. A riscv64 contributor would face the same dynamic.
- The JIRA tracker (MCOL project) is the required channel for upstream coordination; no GitHub Issues exist.

### 12.2 Technical Blockers (in order of fix sequence)

1. Architecture guard in `MariaDB/server:storage/columnstore/CMakeLists.txt` -- must add `riscv64` to the processor list
2. x86 SSE inline asm in `datatypes/mcs_int128.h` -- must add `#elif defined(__riscv)` memcpy guard
3. `__float128` in `datatypes/mcs_float128.h` -- must extend the `long double` fallback to riscv64 or introduce quad-precision software emulation
4. Runtime abort in `primitives/primproc/archcheck.h` and `primproc.cpp` -- must add `__riscv` detection returning a new enum value and remove the hard abort for `UNKNOWN`
5. SIMD primitives -- requires authoring `utils/common/simd_riscv.h` with RVV intrinsics for all filter and aggregation operations, or accepting scalar-only performance

Items 1-4 are required for functional correctness. Item 5 is required for production-grade query performance.

### 12.3 Acceptance Probability

Data not available: no upstream maintainer has publicly stated a position on riscv64 support. Given the single-vendor governance and the precedent of arm64 CI being disabled, acceptance probability for externally contributed patches is uncertain without direct engagement with the MariaDB Corporation engineering team.

---

## 13. Investment Analysis

RISE has done zero work on MariaDB ColumnStore for riscv64. No funded work items, no wheel builder entries, no blog posts, and no repository references exist in any RISE channel.

### 13.1 Functional Enablement

The five blockers in Section 12.2 must be resolved in sequence. Items 1-4 are low-complexity code changes (each is 1-10 lines). Item 5 (SIMD) is the large item.

- **CMakeLists.txt architecture guard:** Add `riscv64` to the processor check. Trivial; 1-2 lines.
- **`mcs_int128.h` inline asm:** Add `#elif defined(__riscv)` with `memcpy`. Trivial; 3-5 lines.
- **`mcs_float128.h` `__float128`:** Extend the aarch64 `long double` path to also cover `__riscv`. Trivial; 2-3 lines.
- **`archcheck.h` / `primproc.cpp` startup abort:** Add `__riscv` detection; remove or make the hard abort conditional on whether a SIMD path exists. Low complexity; requires deciding whether scalar fallback is acceptable for a "functional" tier.

### 13.2 Performance Optimization

Authoring `utils/common/simd_riscv.h` with RVV 1.0 intrinsics covering all filter and aggregation operations equivalent to `simd_sse.h` (1861 lines) and `simd_arm.h` (1780 lines) is the dominant work item. This requires deep knowledge of RVV 1.0 and ColumnStore's SIMD abstraction layer.

A scalar-only riscv64 build is achievable quickly. A vectorized build is a significant engineering effort.

### 13.3 CI/CD Infrastructure

Adding riscv64 to Drone CI requires coordination with MariaDB Corporation to provision or authorize riscv64 runners. QEMU emulation is an alternative for build verification but is too slow for a full test matrix. No RISE CI runners are currently used by this project.

### 13.4 Ecosystem Enablement

No dependent package ecosystem exists for MariaDB ColumnStore at the level that would require a separate ecosystem effort. The upstream MariaDB Server riscv64 enablement (see `project-reports/mariadb.md`) is a prerequisite, as ColumnStore is a server plugin.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `riscv64` to CMakeLists.txt architecture guard | 0.1 | External contributor / MariaDB Corp | Critical |
| Functional | Fix `mcs_int128.h` x86 SSE inline asm (add `__riscv` memcpy path) | 0.1 | External contributor / MariaDB Corp | Critical |
| Functional | Fix `mcs_float128.h` `__float128` (extend `long double` alias to riscv64) | 0.1 | External contributor / MariaDB Corp | Critical |
| Functional | Fix `archcheck.h` / `primproc.cpp` startup abort (add `__riscv` detection, remove hard abort) | 0.5 | External contributor / MariaDB Corp | Critical |
| Functional | Upstream coordination and patch review (JIRA MCOL tickets, PR cycle) | 2 | External contributor + MariaDB Corp | Critical |
| Performance | Author `utils/common/simd_riscv.h` with RVV 1.0 intrinsics (equivalent coverage to SSE and NEON headers) | 12-16 | RVV specialist | High |
| CI/CD | Add riscv64 to Drone CI (provisioning riscv64 runners or QEMU build jobs) | 2 | MariaDB Corp infra + RISE | Medium |
| CI/CD | Establish riscv64 test coverage in OS matrix | 3 | MariaDB Corp + external | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [mariadb-corporation/mariadb-columnstore-engine repository](https://github.com/mariadb-corporation/mariadb-columnstore-engine)
- [MariaDB ColumnStore documentation](https://mariadb.com/kb/en/mariadb-columnstore/)
- [.drone.jsonnet CI configuration](https://github.com/mariadb-corporation/mariadb-columnstore-engine/blob/develop/.drone.jsonnet)
- [MariaDB JIRA -- MCOL project](https://jira.mariadb.org/browse/MCOL)
- [GitHub Releases -- mariadb-corporation/mariadb-columnstore-engine](https://github.com/mariadb-corporation/mariadb-columnstore-engine/releases)
- [PR #1731 -- aarch64 Thrift support](https://github.com/mariadb-corporation/mariadb-columnstore-engine/pull/1731)
- [PR #2148 -- aarch64 GCC 10.3 compile fix](https://github.com/mariadb-corporation/mariadb-columnstore-engine/pull/2148)
- [PR #4075 -- simd_arm.h GCC 16 fix](https://github.com/mariadb-corporation/mariadb-columnstore-engine/pull/4075)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE wheel builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu noble package search -- mariadb-columnstore](https://packages.ubuntu.com/search?keywords=mariadb-columnstore&suite=noble&searchon=names&section=all)
- [Debian package tracker -- mariadb-columnstore](https://tracker.debian.org/pkg/mariadb-columnstore)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=mariadb+columnstore)