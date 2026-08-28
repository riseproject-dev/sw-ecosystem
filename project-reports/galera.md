---
title: Galera
---

# Galera

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for Galera<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Galera Cluster is a synchronous multi-master replication library for MySQL and MariaDB. It implements the wsrep API and provides certification-based replication with automatic node provisioning (SST/IST). The core artifact is a shared library (`libgalera_smm.so`) loaded by the database server at runtime. A standalone arbitrator daemon (`garbd`) is also shipped.

**Governance:** Codership Oy, a Finnish company headquartered in Helsinki, holds sole copyright and operates the project under a Contributor License Agreement (CLA) via clahub.com. All contributor work becomes jointly licensed to Codership. There is no foundation affiliation (no Apache, Linux Foundation, or CNCF membership). Codership is not a RISE project member.

**License:** GPL v2 with a commercial dual-license option available from Codership.

**Corporate maintainers:**

| Contributor | GitHub login | Employer | Approximate commit count |
|---|---|---|---|
| Alexey Yurchenko | ayurchen | MariaDB | ~1,584 (all-time top) |
| Teemu Ollakka | temeo / mariadb-TeemuOllakka | MariaDB | ~1,530 |
| Jan Lindström | janlindstrom | Codership | ~28 on 4.x; release manager |
| Pekka Lampio | plampio | Codership | Merge gatekeeper for MariaDB-sourced PRs |
| Hemant Dangi | hemantdangi-gc | MariaDB | Recent test-fix commits |

MariaDB Corporation staff author the majority of commits, but Codership retains gating authority. External community contribution is rare. The Debian packaging team (Otto Kekäläinen, ottok) has filed and resolved the only RISC-V-related issue on record.

**Stance on new ports:** No documented tier policy exists. The implicit practice is to accept packaging-layer fixes for secondary architectures without requiring upstream source changes or CI. Platform issues on non-tier-1 architectures can remain open indefinitely if no Codership or MariaDB engineer claims them.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-06-28 | [Issue #576](https://github.com/mariadb-corporation/galera/issues/576) filed: galera-4 26.4.5-1 fails to build on Ubuntu Groovy riscv64 (Launchpad) because `gu_fifo_test` times out. Filed by Otto Kekäläinen (Debian/Ubuntu packaging team). | GitHub issue #576 |
| 2020-09-01 | Teemu Ollakka (Codership/MariaDB) suggests applying `CK_TIMEOUT_MULTIPLIER=2` for riscv64, mirroring the existing mipsel workaround in `debian/rules`. | GitHub issue #576, comment by temeo |
| 2020-09-02 | Otto Kekäläinen confirms multiple Launchpad test builds pass with the timeout multiplier. | GitHub issue #576, comment by ottok |
| 2020-09-10 | Otto Kekäläinen closes the issue and commits the fix universally to the Debian packaging layer at [salsa.debian.org commit cbd995fb](https://salsa.debian.org/mariadb-team/galera-4/-/commit/cbd995fbb2c63a71fea3daff9f2cd9857a5feaf0). No changes to the upstream C++ source are made. | GitHub issue #576, Salsa commit |
| 2025-08-13 | Debian sid buildd successfully builds galera-4 26.4.23-1 on riscv64 (rv-osuosl-05). | [buildd.debian.org](https://buildd.debian.org/status/logs.php?pkg=galera-4&arch=riscv64) |
| 2026-08-10 | Debian sid buildd successfully builds galera-4 26.4.27-1 on riscv64 (rv-manda-02), 39-minute build time, 1.67 GB disk. | [buildd.debian.org](https://buildd.debian.org/status/logs.php?pkg=galera-4&arch=riscv64) |

**Summary:** The entire RISC-V history consists of one packaging-layer timeout fix applied in 2020. No upstream source patch, no Codership-authored RISC-V commit, and no tracking issue for ongoing RISC-V work exists. The fix is fully upstreamed into Debian packaging but was never submitted to the upstream Galera source tree because it was not necessary there.

## 3. Upstream Support Tier

No formal tier policy document (PLATFORMS.md, SUPPORT.md, or equivalent) exists in the repository. The implicit tier structure inferred from CI configuration and release practice:

- **Tier 1 (release-blocking):** x86_64, likely x86 (i386). These are the only architectures targeted by upstream CI.
- **Tier 2 (best-effort, packaging-side):** amd64, arm64, armhf, i386, riscv64, ppc64el, s390x, loong64 -- all built by Debian/Ubuntu packaging infrastructure without upstream CI backing.
- **Unsupported:** Architectures not covered by any packaging infrastructure.

riscv64 sits in Tier 2. Failures there do not block upstream releases. No official Codership binary for riscv64 exists; riscv64 packages are entirely the product of Debian/Ubuntu packaging teams.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes (Travis CI + Jenkins) | No | No |
| Release-blocking | Yes | No | No |
| Official Codership binary | No (tag-only repo, no release assets) | No | No |
| Debian sid package | Yes, 26.4.27-1 | Yes | Yes, 26.4.27-1 (Installed) |
| Ubuntu 24.04 package | Yes | Yes | Yes, 26.4.16-2build4 |
| Hardware CRC32C | Yes (SSE4.2) | Yes (ACLE, runtime dispatch) | No (software fallback) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Galera has one category of architecture-specific code: hardware CRC32C acceleration for write-set checksumming. No JIT compiler, no SIMD vectorization, no cryptographic assembly, and no garbage-collector barriers exist in the codebase.

**CRC32C dispatch (`galerautils/src/`)**

The dispatch header `gu_crc32c.h` defines `GU_CRC32C_X86` for `__x86_64` and `__i386`, and `GU_CRC32C_ARM64` for `__aarch64__` / `__AARCH64__`. No `__riscv` or `__riscv_xlen` guard exists anywhere in the repository (confirmed by GitHub code search returning zero results for `riscv` in `codership/galera`).

The `cmake/crc32c.cmake` module checks for hardware CRC32C support only on x86_64/amd64 and aarch64. On all other processors, including riscv64, it sets `GU_CRC32C_NO_HARDWARE` at compile time.

| File | Lines | Architecture | Implementation |
|---|---|---|---|
| `gu_crc32c_x86.c` | 183 | x86 / x86_64 | `__builtin_ia32_crc32*` SSE4.2 intrinsics |
| `gu_crc32c_arm64.c` | 113 | AArch64 | `<arm_acle.h>` intrinsics (`__crc32cb/h/w/d`), runtime `getauxval(AT_HWCAP)` dispatch |
| `gu_crc32c.c` (fallback) | 219 | All others | Software-only: Sarwate, slicing-by-4, slicing-by-8 |

On riscv64, `crc32c_best_algorithm()` selects `gu_crc32c_slicing_by_8` unconditionally. The RISC-V `Zbc` (carry-less multiply) and `Zbkc` extensions, which could provide hardware-accelerated CRC32C, are not used.

**Atomics (`galerautils/src/gu_atomic.h`)**

The implementation uses GCC `__atomic_*` builtins or `__sync_*` for older GCC. riscv64 with GCC 7+ satisfies the `__atomic_*` path fully. 8-byte lock-free atomics are available via the RISC-V A-extension (rv64ima baseline).

**Endianness (`galerautils/src/gu_arch.h`)**

Uses `__BYTE_ORDER == __LITTLE_ENDIAN` from `<endian.h>`. riscv64 is little-endian; no special handling required.

**MurmurHash3 (`galerautils/src/gu_mmh3.c`)**

Portable C with no architecture intrinsics. Works on riscv64 without modification.

**Component comparison:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CRC32C | Hardware (SSE4.2 intrinsics) | Hardware (ACLE intrinsics, runtime dispatch) | Software fallback (slicing-by-8) |
| Atomics | Native (`__atomic_*`) | Native (`__atomic_*`) | Native (`__atomic_*`, `-latomic` required) |
| SIMD | None (Galera does not use SIMD beyond CRC32C) | None | None |
| JIT | None | None | None |
| Assembly (.S files) | None | None | None |

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems:** CMake (default, preferred) and SCons (legacy).

**Native build (riscv64):**

```
cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DGALERA_WITH_SSL=ON \
  .
make -j$(nproc)
```

No riscv64-specific CMake flags are required. The following are set automatically by cmake detection:

- `GU_CRC32C_NO_HARDWARE` -- set by `cmake/crc32c.cmake` because riscv64 matches neither the x86 nor aarch64 hardware CRC check.
- `-DGALERA_ONLY_ALIGNED` -- set by `cmake/alignment.cmake` because riscv64 does not match the `(x86_64|AMD64|i[3-6]86)` regex. This disables unit tests that exercise unaligned memory access, preventing bus errors.
- `-latomic` -- appended to link libraries by `cmake/os.cmake` when the 64-bit atomic compile probe fails without it. The Debian build of 26.4.27-1 confirms this is required on riscv64.

**Cross-compilation (riscv64 from x86_64):**

No upstream toolchain file exists for riscv64. A user-supplied CMake toolchain file is required:

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

Invoked as:

```
cmake -DCMAKE_TOOLCHAIN_FILE=toolchain-riscv64.cmake -DCMAKE_BUILD_TYPE=Release .
make -j$(nproc)
```

No QEMU usage is referenced anywhere in the build system. Tests could be run under `qemu-riscv64-static` after cross-compilation but this is not configured upstream.

**Toolchain requirements:**

- GCC 7+ or Clang equivalent (riscv64 GCC support arrived in GCC 7; the `__atomic_*` builtins require GCC 4.7+)
- C99, C++11 (enforced by cmake)
- The Debian 26.4.27-1 build used GCC 16.1.0 (`riscv64-linux-gnu-gcc`)

**Required build dependencies:**

- `cmake >= 2.8`
- `libboost-dev >= 1.41` + `libboost-program-options-dev`
- `libssl-dev` (OpenSSL)
- `check` (libcheck, unit test framework)
- `libasio-dev >= 1.14.1` (or bundled Asio submodule)
- `libatomic1` (riscv64-specific; not required on x86_64)

**Compiler flags used by Debian for riscv64 (26.4.27-1):**

```
-Wall -Wextra -g -O2 -Werror=implicit-function-declaration
-fstack-protector-strong -Wformat -Werror=format-security
-Wdate-time -D_FORTIFY_SOURCE=2
```

No riscv64-specific RISC-V ISA extension flags (`-march=rv64gc`, `-march=rv64gcv`, etc.) are set by the build system or Debian packaging. The compiler's default march for the target triple is used.

**No cross-compilation Docker image for riscv64 exists.** The repository's `scripts/docker/Dockerfile` targets `debian:testing-slim` on the host architecture only.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. Galera builds and runs correctly on riscv64. All replication, certification, and SST/IST code paths are portable C++11. No feature is gated on architecture.

**Performance gaps:**

| Area | amd64 | arm64 | riscv64 | Delta |
|---|---|---|---|---|
| CRC32C (write-set checksum) | SSE4.2 hardware (single-cycle per 8 bytes) | ACLE hardware (single-cycle per 8 bytes) | Software slicing-by-8 | ~2-4x more CPU cycles per checksum operation [NEEDS VERIFICATION -- no published benchmark found] |
| Atomic operations | Native, lock-free | Native, lock-free | Native, lock-free (-latomic) | Negligible |
| Network I/O (Asio) | Portable | Portable | Portable | None |

The CRC32C gap is measurable only under write-heavy replication workloads where checksum computation becomes a bottleneck. For moderate workloads, the software fallback is adequate.

Data not available: published sysbench, throughput, or latency benchmarks comparing Galera on riscv64 to x86_64 or aarch64. No such benchmarks exist in any public source (GitHub, RISE blog, MariaDB blog, distribution trackers).

**Security hardening gaps:**

OpenSSL on riscv64 hardware lacking the `Zkn` extension uses an AES implementation that is not constant-time ([openssl/openssl#20980](https://github.com/openssl/openssl/issues/20980), open). Galera uses OpenSSL for encrypted replication traffic (`GALERA_WITH_SSL=ON`, default). On riscv64 hardware without `Zkn`, the encrypted replication channel is vulnerable to timing side-channel attacks on AES keys. This is not a Galera code issue but a dependency issue; the mitigation requires either `Zkn`-capable hardware or a patched OpenSSL.

## 7. CI/CD Infrastructure

**Upstream CI files read verbatim (confirmed by direct file fetch from `codership/galera` default branch `4.x`):**

- `.travis.yml` -- `dist: bionic`, `compiler: [gcc, clang]`. Ubuntu Bionic x86 only. No architecture matrix. No riscv64.
- `.jenkins/aws-galera-4-fullbuild.groovy` -- delegates to downstream Jenkins jobs for source tarball, RPM, and DEB packages. No architecture parameter specified anywhere in the file. No riscv64. No QEMU.
- `.jenkins/pr-galera-4.x-review.groovy` -- PR smoke test pipeline, `agent { label 'built-in' }`. Delegates to downstream Jenkins smoke-test and MTR jobs. No architecture parameter. No riscv64.
- `.github/workflows/` -- directory returns HTTP 404. GitHub Actions CI does not exist.
- `.gitlab-ci.yml` -- returns HTTP 404. GitLab CI does not exist.

**RISE runners:** No RISE project involvement with Galera. The RISE project has published zero blog posts or technical articles mentioning Galera, MariaDB, or database clustering. Galera does not appear in the RISE Python wheel builder package list (83 packages scanned). GitHub search for `Galera org:riseproject-dev` returned zero repositories.

**Downstream packaging CI (Debian/Ubuntu):** Debian sid buildd infrastructure builds galera-4 for riscv64 on `rv-manda-*` and `rv-osuosl-*` builder hardware as part of universal Debian architecture builds. This is distribution CI, not upstream project CI.

| CI system | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Travis CI (upstream) | Yes | No | No |
| Jenkins (upstream) | Yes | No | No |
| GitHub Actions (upstream) | No | No | No |
| Debian buildd | Yes | Yes | Yes (distribution-maintained) |
| Ubuntu Launchpad | Yes | Yes | Yes (distribution-maintained) |
| RISE runners | No | No | No |

## 8. Distribution and Release Status

The upstream `codership/galera` repository publishes git tags (latest: `release_26.4.27`) but zero GitHub release assets. No Codership-official binary packages are distributed for any architecture.

**riscv64 binary availability by channel:**

| Channel | riscv64 available | Version | Notes |
|---|---|---|---|
| GitHub releases (codership/galera) | No | N/A | No release assets exist at all |
| Debian sid (universe) | Yes | 26.4.27-1 | Status: "Installed" on riscv64 buildd rv-manda-02 as of 2026-08-10 |
| Ubuntu 24.04 Noble (universe) | Yes | 26.4.16-2build4 | 925,152 bytes; `pool/universe/g/galera-4/` |
| Ubuntu 24.04 Noble (universe) | Yes | galera-3 25.3.37-1build4 | Also built for riscv64 |
| Arch Linux RISC-V (archriscv.felixc.at) | No / unknown | N/A | Not in official Arch repos for any arch; may be AUR-only; no RISC-V Arch port found |
| PyPI | N/A | N/A | No "galera" package on PyPI; HTTP 404 |

**What a user must do to get a working riscv64 binary:**

On Debian sid or Ubuntu 24.04: `apt install galera-4` (Debian) or `apt install galera-4` from the `universe` repository (Ubuntu). No compilation required. The `universe` designation in Ubuntu means the package is community-maintained without Canonical support guarantees.

On any other distribution: compile from source using the cmake procedure described in Section 5.

## 9. Dependencies

| Dependency | Role in Galera | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| OpenSSL | TLS for encrypted replication traffic (default: ON) | Built (Debian sid: 3.6.3-1) | Known issues | Released | [openssl#20980](https://github.com/openssl/openssl/issues/20980) (open): AES not constant-time without Zkn -- security concern on riscv64 hardware lacking Zkn |
| Boost (program_options, date_time) | `garbd` CLI argument parsing; internal date/time | Built (Debian: Boost 1.90.0 in 26.4.27-1 build) | No known riscv64 failures | Released | None found; Boost uses `__atomic` builtins which work on riscv64 |
| Asio 1.36.0 (bundled or system) | Network I/O for group communication (gcomm) | Built (header-only) | No issues | N/A (header-only) | [codership/galera#691](https://github.com/codership/galera/issues/691) (open): "Port ASIO usage to ASIO 1.33+ API" -- API compatibility, not arch-specific |
| libatomic | 64-bit lock-free atomic support | Required, auto-detected by cmake | N/A | Released (libatomic1 in Debian) | None; required on riscv64, not on x86_64 |
| libcheck (Check) | Unit test framework with `CK_TIMEOUT_MULTIPLIER` | Built | Requires `CK_TIMEOUT_MULTIPLIER` multiplier for riscv64 (Debian packaging applies this) | Released | None open; historic timeout issue resolved in 2020 |
| glibc | POSIX threading, networking, file I/O | Built (Debian sid: glibc 2.41 on riscv64) | See project-reports/glibc.md | Released | None Galera-specific |

**CRC32C internal implementation (critical path):**

Galera ships its own CRC32C rather than using a library. As described in Section 4, the riscv64 path is the software slicing-by-8 fallback. The RISC-V `Zbc` (carry-less multiply) or `Zbkc` extensions are not used. No upstream issue or PR requesting a `gu_crc32c_riscv64.c` exists.

**OpenSSL AES depth note:** On riscv64 hardware with the `Zkn` scalar cryptography extension, OpenSSL uses hardware AES and is constant-time. The security gap in [openssl#20980](https://github.com/openssl/openssl/issues/20980) applies only to hardware lacking `Zkn`. SiFive P870 and other high-performance riscv64 cores with `Zkn` are not affected.

## 11. Known Bugs and Active Issues

**riscv64-specific issues:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#576](https://github.com/mariadb-corporation/galera/issues/576) | galera-4_26.4.5-1 failed to build on riscv64 | Closed 2020-09-10 | Low (test timeout only) | Fix applied in Debian packaging layer only; no upstream source change. Has not recurred in any subsequent version. |

No open riscv64-specific issues exist in either `codership/galera` or `mariadb-corporation/galera`.

**Open correctness and liveness bugs (any platform):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#694](https://github.com/codership/galera/issues/694) | NBO phase two hangs indefinitely when garbd is present | Open (2026-07-17) | High | Liveness/deadlock with arbitrator daemon |
| [#687](https://github.com/codership/galera/issues/687) | Problem with asynchronous replication | Open (2026-03-09) | High | Correctness issue in async replication path |
| [#686](https://github.com/codership/galera/issues/686) | Wrong type for EvsAutoEvict | Open (2026-01-11) | Medium | Type mismatch in EVS eviction logic |
| [#624](https://github.com/codership/galera/issues/624) | GCache::RingBuffer initial scan dies at 0.0% | Open (2022-08-31) | Medium | Performance / startup failure |
| [#477](https://github.com/codership/galera/issues/477) | Queries freeze in different statuses | Open (2017-08-14) | High | Liveness; open 9 years |
| [#337](https://github.com/codership/galera/issues/337) | Thread blocked in LocalOrder waiting for signal that never comes | Open (2015-09-02) | High | Concurrency deadlock; open 11 years |
| [#336](https://github.com/codership/galera/issues/336) | Snapshot Isolation may not be as isolated as one would like | Open (2015-09-01) | High | Correctness/isolation; open 11 years |

None of the open correctness bugs are riscv64-specific. Issues #337 and #336, open since 2015, indicate that concurrency and isolation bugs can remain unaddressed indefinitely when they do not affect Codership or MariaDB's primary customer base.

## 12. Objections and Upstream Blockers

**No stated objections to riscv64 support.** The 2020 build issue was handled promptly and collaboratively. The community stance is permissive: Codership accepted the timeout workaround concept (Teemu Ollakka suggested it) and did not object to Debian carrying the fix.

**Organizational blockers:**

- Codership is a small company (Oy = Finnish private limited company). Neither Codership nor MariaDB Corporation is a RISE member. Neither has publicly committed engineering resources to riscv64 optimization. Any feature request for riscv64 hardware CRC32C would need to be accompanied by a pull request to be accepted; a feature request without code is unlikely to produce action given the existing backlog of long-open issues.
- The CLA requirement (clahub.com) is a minor barrier for external contributors. A Qualcomm or RISE-funded engineer contributing `gu_crc32c_riscv64.c` would need to sign the Codership CLA before a PR can be merged.

**Technical blockers:**

- None that block basic functionality. The software CRC32C fallback is correct. Galera builds and runs on riscv64 today without any upstream changes.
- The OpenSSL `Zkn` gap (constant-time AES) is a dependency blocker for production security posture on riscv64 hardware without `Zkn`. This is in the OpenSSL project's scope, not Galera's.

**Acceptance probability for a `gu_crc32c_riscv64.c` PR:** High [NEEDS VERIFICATION]. The x86 and ARM64 CRC32C implementations are clean, self-contained files following a clear pattern. A RISC-V implementation using `Zbc` intrinsics or `__builtin_riscv_clmul` would fit the same structure. The risk of rejection is low if the implementation passes the existing CRC32C unit tests.

## 13. Investment Analysis

RISE has no existing investment in Galera. No RISE blog posts, wheel-builder entries, or GitHub projects cover Galera. All work below is unaddressed.

### 13.1 Functional Enablement

Galera is already functionally complete on riscv64. No work is required to enable basic replication on RISC-V hardware. The Debian and Ubuntu packages install and run without modification.

### 13.2 Performance Optimization

The primary performance gap is CRC32C. Galera computes CRC32C for every write-set before replication. On x86_64 and aarch64, this uses a single hardware instruction per 8 bytes. On riscv64, the software slicing-by-8 path runs in pure C.

The RISC-V `Zbc` extension provides `clmulr` (carry-less multiply, reversed), which can compute CRC32C efficiently. The `Zbkc` extension (a subset of `Zbc`) is included in the scalar cryptography profile. GCC supports `__builtin_riscv_clmul` for targets with `Zbc`.

A `gu_crc32c_riscv64.c` implementation following the pattern of `gu_crc32c_arm64.c` would require:
- 100-150 lines of C using `__builtin_riscv_clmul` or equivalent intrinsics
- A runtime dispatch check for `Zbc` capability (analogous to ARM's `getauxval(AT_HWCAP)` check for `HWCAP_CRC32`)
- Updates to `gu_crc32c.h` to add `#if defined(__riscv) && defined(__riscv_zbc)` guard
- Updates to `cmake/crc32c.cmake` to detect `Zbc` on riscv64
- Passing the existing `gu_crc32c_test` unit tests

Data not available: exact performance delta between software slicing-by-8 and a `Zbc`-based CRC32C on current riscv64 silicon. The ARM64 hardware path is the reference: it replaced approximately the same class of software fallback.

### 13.3 CI/CD Infrastructure

Upstream CI targets x86 only. No riscv64 CI build or test exists anywhere in the upstream project. A minimal CI addition would be a GitHub Actions workflow step building on riscv64 using QEMU emulation or a RISE-provided riscv64 runner.

Given that Debian sid consistently builds galera-4 for riscv64 every release cycle with no failures since 2020, the return on adding CI is primarily regression detection for the CRC32C optimization, not build-failure prevention.

### 13.4 Ecosystem Enablement

Not applicable. Galera is a system library with no dependent package ecosystem.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Implement `gu_crc32c_riscv64.c` using `Zbc` intrinsics with runtime dispatch | 2-3 | Qualcomm / RISE-funded engineer (Codership CLA required) | High |
| Performance | Benchmark CRC32C slicing-by-8 vs Zbc on target riscv64 silicon to quantify regression | 0.5 | Qualcomm | High (prerequisite for justifying CRC32C PR) |
| CI | Add GitHub Actions riscv64 build job (QEMU or RISE runner) | 0.5-1 | Qualcomm / RISE infra team | Medium |
| Security | Track and test OpenSSL `Zkn` constant-time AES fix on target hardware; see project-reports/openssl.md | 0 (tracked in OpenSSL) | OpenSSL project | High (for production deployments) |
| Documentation | Upstream a `cmake/toolchain-riscv64.cmake` file for cross-compilation | 0.5 | Qualcomm | Low |

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

## 15. References

- [codership/galera GitHub repository](https://github.com/codership/galera)
- [mariadb-corporation/galera GitHub repository (mirror)](https://github.com/mariadb-corporation/galera)
- [Galera Cluster homepage](https://galeracluster.com/)
- [Issue #576: galera-4_26.4.5-1 failed to build on riscv64](https://github.com/mariadb-corporation/galera/issues/576)
- [Debian Salsa packaging fix: CBD995FB (timeout multiplier)](https://salsa.debian.org/mariadb-team/galera-4/-/commit/cbd995fbb2c63a71fea3daff9f2cd9857a5feaf0)
- [Debian buildd status for galera-4](https://buildd.debian.org/status/package.php?p=galera-4&suite=sid)
- [Debian buildd riscv64 build logs for galera-4](https://buildd.debian.org/status/logs.php?pkg=galera-4&arch=riscv64)
- [Ubuntu 24.04 Noble galera-4 package](https://packages.ubuntu.com/noble/galera-4)
- [Ubuntu 24.04 Noble galera-4 riscv64 download](https://packages.ubuntu.com/noble/riscv64/galera-4/download)
- [OpenSSL issue #20980: AES not constant-time without Zkn on RISC-V](https://github.com/openssl/openssl/issues/20980)
- [codership/galera issue #694: NBO phase two hangs with garbd](https://github.com/codership/galera/issues/694)
- [codership/galera issue #687: Problem with asynchronous replication](https://github.com/codership/galera/issues/687)
- [codership/galera issue #691: Port ASIO usage to ASIO 1.33+ API](https://github.com/codership/galera/issues/691)
- [codership/galera open issues list](https://github.com/codership/galera/issues)
- [RISE project homepage](https://riseproject.dev/)