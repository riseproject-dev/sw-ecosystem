---
title: Redis
categories:
  - databases
---

# Redis

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Redis<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[Redis](https://redis.io/) is an in-memory data structure store used as a database, cache, and message broker. The canonical upstream repository is [redis/redis](https://github.com/redis/redis). The active development branch is `unstable`; stable releases ship from versioned branches.

Redis is controlled by **Redis Ltd.** (formerly Redis Inc.), a private company. There is no independent foundation, no GOVERNANCE.md, no MAINTAINERS file, and no TSC. Feature proposals require acknowledgment from Redis Ltd. employees before community work begins. Contributors must sign a Redis Software Grant and CLA assigning broad rights to Redis Ltd.

**License history:**

| Period | License |
|---|---|
| Redis 1.0 - 7.2 (~2009 - early 2024) | BSD 3-Clause |
| Redis 7.4 - 7.8 (March 2024+) | RSALv2 or SSPLv1 (dual; non-OSI) |
| Redis 8.0+ (2025+) | RSALv2 / SSPLv1 / AGPLv3 (tri-license, user's choice) |

The March 2024 relicensing was contentious. Redis Ltd. acknowledged the new licenses are not OSI-approved. Redis 8.0 added AGPLv3 as a third option. The **Valkey** fork (Linux Foundation, 2024) emerged in direct response to the relicensing and now provides a BSD-licensed alternative.

Redis is **not** a member of the RISE project (RISC-V Software Ecosystem).

---

## 2. Port History and Upstreaming Timeline

Redis is portable C. It ran on RISC-V before any RISC-V-specific code was added, because the scalar fallback paths cover all architectures. Architecture-specific optimizations are a separate concern from basic portability.

| Date | Event | Source |
|---|---|---|
| 2025-08-14 | [PR #14251](https://github.com/redis/redis/pull/14251) merged: RISC-V `mtime` CSR monotonic clock support | GitHub PR |
| 2025-10-11 | [PR #14342](https://github.com/redis/redis/pull/14342) merged: SipHash unaligned access via Zicclsm | GitHub PR |
| 2025-11-18 | Both above optimizations shipped in Redis 8.4.0 | Release branch analysis |
| 2026-05-14 | [PR #15204](https://github.com/redis/redis/pull/15204) opened: BITCOUNT Zbb popcount | GitHub PR |
| 2026-05-27 | [PR #15273](https://github.com/redis/redis/pull/15273) opened: HyperLogLog RVV vectorization | GitHub PR |

No RISC-V-specific commits predate August 2025 in the public commit history. There is no master tracking issue or riscv64 port umbrella issue. Work is incremental, with individual PRs targeting specific subsystems.

The primary contributor is **huangzhengx** (4 of 5 RISC-V PRs). Their fork history links to the `zte-riscv` org, suggesting a ZTE RISC-V affiliation [NEEDS VERIFICATION]. A second contributor, **Polaris-911**, authored PR #14342; the same fork history links to `zte-riscv` [NEEDS VERIFICATION]. All PRs target `unstable`.

The core reviewer and merger for all accepted RISC-V work is **sundb** (debing.sun), a Redis organization member based in Fuzhou. **fcostaoliveira** has been requested as reviewer on three PRs (#14342, #15204, #15273) but has not commented on any of them.

---

## 3. Upstream Support Tier

No PLATFORMS.md, SUPPORT.md, or architecture tier policy document exists in the repository. Redis officially documents support for Linux, macOS, OpenBSD, NetBSD, and FreeBSD. Both little- and big-endian are supported. Both 32-bit and 64-bit. No CPU architecture tier list is published.

RISC-V has no formal support tier. It is a community-contributed target with no upstream CI coverage and no Redis Ltd. ownership of the port.

The CONTRIBUTING.md states the team is "very overloaded" and PRs may wait significant time. The two open RISC-V PRs (#15204, #15273) have been open since May 2026 with zero reviews and zero maintainer comments, confirming this in practice.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Redis has no `arch/riscv/` directory, no `.S` assembly files for RISC-V, and no JIT backends. All RISC-V architecture-specific code is inline guards within shared files. The following table covers every file with architecture-guarded paths.

| File | amd64/x86_64 | arm64/AArch64 | riscv64 (current, merged) |
|---|---|---|---|
| `src/monotonic.c` | `USE_PROCESSOR_CLOCK` + `__x86_64__`: reads `/proc/cpuinfo`, `rdtsc` | `USE_PROCESSOR_CLOCK` + `__aarch64__`: `mrs cntvct_el0 / cntfrq_el0` | `USE_PROCESSOR_CLOCK` + `__riscv` + `__linux__`: reads `/proc/device-tree/cpus/timebase-frequency`, `csrr time` -- merged PR #14251 |
| `src/siphash.c` | `UNALIGNED_LE_CPU`: direct `uint64_t` cast via `__x86_64__`/`__i386__` | `UNALIGNED_LE_CPU`: `__aarch64__`/`__arm64__` | `UNALIGNED_LE_CPU`: `__riscv && __riscv_zicclsm` -- merged PR #14342 |
| `src/config.h` | `HAVE_POPCNT`, `HAVE_AVX2`, `HAVE_AVX512` | `HAVE_AARCH64_NEON` | No guards currently; `HAVE_POPCNT` for `__riscv && __riscv_zbb` pending PR #15204; `HAVE_RISCV_RVV` for `__riscv && __riscv_v_intrinsic` pending PR #15273 |
| `src/bitops.c` | `HAVE_AVX512`: `_mm512_popcnt_epi64`; `HAVE_AVX2`: 256-bit; `HAVE_POPCNT`: `__builtin_cpu_supports("popcnt")` | `HAVE_AARCH64_NEON`: `vcntq_u8 + vpadalq` | Scalar fallback only currently; `cpop`/Zbb integration pending PR #15204 |
| `src/hyperloglog.c` | `HAVE_AVX2`: `hllMergeDenseAVX2` + `hllDenseCompressAVX2`, `__m256i` | `HAVE_AARCH64_NEON`: `hllMergeDenseAarch64` + `hllDenseCompressAarch64`, `uint8x16_t`/`uint32x4_t` | Scalar fallback only currently; `hllMergeDenseRVV` + `hllDenseCompressRVV` pending PR #15273 |

### Merged subsystem details

**Monotonic clock (PR #14251, merged 2025-08-14)**

Adds `monotonicInit_riscv()` in `src/monotonic.c` gated on `USE_PROCESSOR_CLOCK && __riscv && __linux__`. Reads the RISC-V `mtime` CSR via inline assembly (`csrr time`), bootstrapping tick rate from `/proc/device-tree/cpus/timebase-frequency` (supports both 32-bit and 64-bit big-endian device tree entries). The `__linux__` guard was added during review because BSDs support RISC-V but mostly lack procfs. Benchmark on Sophgo SG2042 (10M iterations): RISC-V clock 286,378 us vs. POSIX `clock_gettime` 794,999 us -- **2.78x faster**. Requires `-DUSE_PROCESSOR_CLOCK` at build time. This flag is NOT enabled by default for RISC-V, unlike AArch64 where it is on by default.

**SipHash unaligned access (PR #14342, merged 2025-10-11)**

Adds `__riscv && __riscv_zicclsm` to the `UNALIGNED_LE_CPU` guard in `src/siphash.c`. Zicclsm (unaligned memory access) is mandatory per the RVA20U64 profile specification. Detection requires GCC 14.1.0+ which exposes the `__riscv_zicclsm` preprocessor macro. Cores without Zicclsm fall back to the safe byte-by-byte path. Benchmark on SG2044 (10 runs x 10M hashes): 6,482,733 hashes/sec (disabled) vs. 10,732,524 hashes/sec (enabled) -- **+65.5% SipHash throughput**. This PR superseded the closed PR #14166, which had attempted unconditional enablement. Reviewer sundb correctly rejected the unconditional approach, noting that unlike x86 and arm64, RISC-V does not universally support unaligned access.

### Open subsystem details

**BITCOUNT popcount (PR #15204, open since 2026-05-14)**

Adds `__riscv && __riscv_zbb` branch to `config.h` defining `HAVE_POPCNT`. Uses `__builtin_popcountll`, which compiles to the `cpop` instruction when Zbb is enabled. Unlike x86_64 which requires runtime `CPUID` detection, the RISC-V path sets `use_popcnt = 1` statically at compile time (Zbb availability is a compile-time flag, not runtime-detectable). Benchmark on SG2044: **+288% throughput, -74% latency**. Targeted for Redis 8.10. No reviewer has commented.

**HyperLogLog RVV vectorization (PR #15273, open since 2026-05-27)**

Adds approximately 125 lines implementing `hllMergeDenseRVV` and `hllDenseCompressRVV` using RVV vector intrinsics (`vrgather`, `vand`, `vsll`, `vmaxu`, `vle32`, `vsrl`, `vse8`). Gated on `__riscv_v_intrinsic` compile-time detection (requires `-march=rv64gcv`). Includes a `simd_enabled` runtime override toggle, consistent with the AVX2 and NEON paths. Falls back to scalar for the last 16 registers. Mirrors the structure of the existing AArch64 NEON path. No benchmark numbers have been posted. Targeted for Redis 8.10. No reviewer has commented.

---

## 5. Build System, Cross-Compilation, and Toolchain

Redis uses GNU Make for the core server. CMake is present only for the optional modules build (`BUILD_WITH_MODULES=yes`). There are no riscv64-specific CMakeLists.txt files, toolchain files, or Dockerfiles in the repository.

### Native build (riscv64 Linux)

```sh
make -j$(nproc) BUILD_TLS=yes
```

The Makefile auto-detects `uname -m` at build time. No `ARCH=` flag is required.

### Cross-compilation

No official cross-compilation documentation exists. The `deps/Makefile` has hooks for it via the Debian packaging convention:

```sh
export DEB_HOST_GNU_TYPE=riscv64-linux-gnu
make CC=riscv64-linux-gnu-gcc \
     AR=riscv64-linux-gnu-ar \
     RANLIB=riscv64-linux-gnu-ranlib \
     MALLOC=libc \
     BUILD_TLS=no \
     SKIP_VEC_SETS=yes \
     BUILD_WITH_MODULES=no
```

When `DEB_HOST_GNU_TYPE` is set, `deps/Makefile` passes `--host=$(DEB_HOST_GNU_TYPE)` to jemalloc's configure. `MALLOC=libc` bypasses jemalloc entirely, which is the safest cross-compile option.

### Toolchain requirements

No minimum GCC or Clang version is documented in the repository. Constraints inferred from source:

- **C11 `_Atomic`**: Required for the HNSW vector set data structure. The Makefile tests for it at build time. If absent, the build falls back to `-std=c99` and disables vector sets (`SKIP_VEC_SETS=yes` is set automatically). GCC 4.9+ supports this; in practice GCC 6+ is assumed.
- **GCC 14.1.0+**: Required to use the `__riscv_zicclsm` macro for the SipHash optimization (PR #14342). Older toolchains will not activate the Zicclsm path but will build correctly.
- **AlmaLinux/Rocky 8 builds use `gcc-toolset-13`**, indicating GCC 13 is the tested minimum for full module builds [NEEDS VERIFICATION for exact minimum for core-only builds].
- **Rust 1.94.0**: Required for `BUILD_WITH_MODULES=yes`. The `modules/Makefile` Rust installer case statement provides binaries only for `x86_64` and `aarch64`, and exits with error for all other architectures. **`BUILD_WITH_MODULES=yes` cannot be used on riscv64 without patching `modules/Makefile`.** This blocks Redis JSON, RediSearch, RedisBloom, and RedisTimeSeries on RISC-V.

### Notable build flags for riscv64

| Flag | Effect | riscv64 notes |
|---|---|---|
| `MALLOC=libc` | Use libc malloc | Recommended for cross-compile; avoids jemalloc `--host` requirement |
| `MALLOC=jemalloc` | Default on Linux | Works natively; requires `DEB_HOST_GNU_TYPE` for cross-compile |
| `SKIP_VEC_SETS=yes` | Disable HNSW vector sets | Auto-set if compiler lacks C11 atomics; safe to set explicitly |
| `BUILD_WITH_MODULES=yes` | Enable JSON/Search/Bloom/TimeSeries | **Broken on riscv64** -- Rust installer only provides x86_64 and aarch64 |
| `BUILD_TLS=yes` | Enable TLS | Requires `libssl-dev`; works on riscv64 |
| `CFLAGS="-DUSE_PROCESSOR_CLOCK"` | Use hardware clock instead of POSIX clock | riscv64 supported (PR #14251); **opt-in only**, unlike AArch64 which is default-on |

### `-latomic` note

The Makefile adds `-latomic` only when `uname -m` matches `armv*`. riscv64 does not match this pattern. If linking fails with undefined `__atomic_*` symbols on an older GCC that does not inline 64-bit atomics, add `LDFLAGS=-latomic` manually.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 (merged, current) | riscv64 (if both open PRs merge) |
|---|---|---|---|---|
| Monotonic clock | Full (`rdtsc`) | Full (`cntvct_el0`), default-on | Full (`csrr time`), opt-in only | Full, opt-in only |
| SipHash unaligned access | Full | Full | Full (Zicclsm, GCC 14.1+) | Full |
| BITCOUNT popcount | Full (AVX512/AVX2/scalar) | Partial (NEON `vcnt`) | Scalar fallback only | Partial (Zbb `cpop`) |
| HyperLogLog vectorization | Full (AVX2 `__m256i`) | Partial (NEON `uint8x16_t`) | Scalar fallback only | Partial (RVV intrinsics) |
| CI coverage | Full | Full | None | None |
| Modules (JSON, Search, Bloom) | Full | Full | Broken (Rust installer gap) | Broken (same gap) |

**Assessment:** The two merged PRs are correct and production-quality. Neither is a stub. The riscv64 port is not a skeleton -- it has functional equivalents for monotonic timing and SipHash. However, two performance-sensitive paths (BITCOUNT and HyperLogLog) currently fall to scalar on RISC-V. Both optimizations are in-flight PRs with no technical blockers, blocked only on reviewer bandwidth.

The modules gap (Rust installer not supporting riscv64 in `modules/Makefile`) is a hard blocker for Redis 8.x module functionality on RISC-V and requires an explicit patch to the build system.

The `USE_PROCESSOR_CLOCK` asymmetry is a minor usability gap: AArch64 gets hardware clock by default, RISC-V requires an explicit build flag. No tracking issue exists for this discrepancy.

---

## 7. CI/CD Infrastructure

All 9 workflow files in `.github/workflows/` (ci.yml, codecov.yml, codeql-analysis.yml, coverity.yml, daily.yml, external.yml, redis_docs_sync.yaml, reply-schemas-linter.yml, spell-check.yml) were verified. No alternative CI backends (.cirrus.yml, .travis.yml, .gitlab-ci.yml, Jenkinsfile, appveyor.yml) exist at the repository root.

**The string "riscv" does not appear in any of the 9 workflow files.**

The CI matrix covers: ubuntu-latest (x86_64), ubuntu-24.04-arm (ARM64), macOS (multiple versions), FreeBSD, Alpine, CentOS Stream 9, and Debian buster. No RISC-V target, no QEMU riscv64 emulation, and no self-hosted riscv64 runner exist.

All RISC-V testing for the merged PRs was performed by contributors on physical hardware (Sophgo SG2042, SG2044). Reviewer ShooterIT explicitly noted on PR #14251: "i don't have RISC CPU, can't verify it" -- this is the current state for all maintainers.

No QEMU integration exists in the Redis test suite (`runtest`). There is no documented procedure for running the Redis test suite on riscv64.

The RISE Project launched free native RISC-V CI runners (Scaleway EM-RV1 hardware) in March 2026. Redis has not adopted them. Redis is not a RISE member project and no RISE blog post mentions Redis.

---

## 8. Distribution and Release Status

Redis upstream publishes source-only tarballs. No pre-built binary packages for any architecture are attached to GitHub releases. The download mirror at download.redis.io/releases/ lists source tarballs only.

| Distribution | riscv64 Available | Version | Notes |
|---|---|---|---|
| GitHub releases (redis/redis) | No (source-only for all arches) | N/A | Auto-generated source archives only |
| Debian sid | Yes -- installed | 5:8.0.6-2 | Built on `rv-osuosl-03` (OSUOSL RISC-V hardware) |
| Ubuntu Noble (24.04) | Yes | 5:7.0.15-1build2 | Via Ubuntu ports archive |
| Ubuntu Jammy (22.04) | Yes | 5:6.0.16-1ubuntu1 | Via Ubuntu ports archive |
| Arch Linux RISC-V | No -- not packaged | N/A | Absent from Arch RISC-V package set; `python-redis` is outdated/FTBFS |
| Docker (official library) | Yes (Alpine-based, all versions; Debian/trixie for 8.x) | Varies | Bookworm-based 7.x/6.x images do not include riscv64 |
| PyPI redis-py | N/A | 8.0.0 | Pure-Python; `py3-none-any` wheel installs natively on riscv64 |

Debian and Ubuntu riscv64 packages are downstream builds maintained by distro packagers, not by Redis Ltd. or upstream contributors. The upstream project does not validate its own releases on riscv64.

The Debian riscv64 package (8.0.6-2) lags upstream (8.8.0), which is normal for the Debian packaging pipeline and not a RISC-V-specific gap.

---

## 9. Dependencies

The following table covers all bundled and optional dependencies in the Redis build.

| Dependency | Role | riscv64 Build | riscv64 Test | Blocking Issues |
|---|---|---|---|---|
| **jemalloc** (bundled) | Default memory allocator on Linux | Builds; riscv64gc support added Nov 2023 ([#2323](https://github.com/jemalloc/jemalloc/issues/2323)). Early atomics/FTBFS issue from 2019 resolved. | No dedicated riscv64 CI | [#2399](https://github.com/jemalloc/jemalloc/issues/2399) (open): cross-build for riscv64 undocumented; `riscv64gc` target triple recognition fix needed for Rust bindings |
| **OpenSSL** (optional) | TLS transport when `BUILD_TLS=yes` | Builds; `linux-riscv64` target exists since May 2022. Crypto assembly (AES/GHASH/ChaCha20) actively merged. | CI flakiness on riscv64 runners ([#30880](https://github.com/openssl/openssl/issues/30880), open) | [#30330](https://github.com/openssl/openssl/issues/30330): `rv64i_zkne_set_encrypt_key` null-key logic is backwards (affects branches 3.3-master); [#31080](https://github.com/openssl/openssl/issues/31080)/[#31082](https://github.com/openssl/openssl/issues/31082): constant-time hardening for no-extension fallbacks incomplete |
| **Lua 5.1** (bundled) | Scripting engine for `EVAL` | Pure ANSI C; no arch-specific assembly; builds anywhere | No riscv64 CI; no failures reported | None |
| **hiredis** (bundled) | C client library for CLI and Sentinel | No riscv64-specific issues; generic C | No dedicated riscv64 CI | None |
| **xxHash** (bundled) | Non-cryptographic hashing | Builds; no riscv64 build failures reported | No dedicated riscv64 CI | Minor: [#1018](https://github.com/Cyan4973/xxHash/issues/1018) (open, Mar 2025): proposal for riscv64 inline asm optimization for `XXH_mult32to64_add64`; not blocking; scalar fallback works. Note: `XXH_RVV = 9` constant exists in `xxhash.h` as a placeholder; RVV backend is NOT implemented -- only scalar portability was validated on RISC-V in v0.8.2. |
| **HdrHistogram_c** (bundled) | Latency percentile tracking | Pure C; no arch-specific code | No dedicated riscv64 CI | None |
| **linenoise** (bundled) | Line-editing for `redis-cli` | Pure C; no arch-specific code | No riscv64 CI | None |
| **fpconv** (bundled) | Double-to-string conversion | Pure C | No dedicated riscv64 CI | None |
| **tre** (bundled) | POSIX regex | Pure C | No dedicated riscv64 CI | None |
| **libsystemd** (optional) | systemd notify | Standard Linux system library; riscv64 packages available in all major distros | Tested as part of distro packages | None |

The OpenSSL `rv64i_zkne_set_encrypt_key` correctness bug ([#30330](https://github.com/openssl/openssl/issues/30330)) is the only dependency issue that could affect Redis in production on riscv64. It affects TLS builds (`BUILD_TLS=yes`) on toolchains that activate the Zkne extension. Builds without TLS are unaffected.

---

## 10. Ecosystem Status

**RISE Project:** Redis is not a RISE member project. Zero of 26+ RISE blog posts (May 2024 - June 2026) mention Redis. Redis does not appear in the RISE wheel builder package list (~80 packages). No RISE-funded Redis optimization work exists in the public record.

**RISE CI infrastructure:** The RISE Project launched free native riscv64 CI runners on Scaleway EM-RV1 hardware in March 2026. These are available to any GitHub-hosted project. Redis has not adopted them.

**Test hardware used for Redis RISC-V work:** All benchmarks and on-hardware test results in the Redis PRs were produced on **Sophgo SG2042** (64-core RISC-V server SoC) and **SG2044** hardware. These are consumer/developer-accessible boards, not cloud instances.

**Community:** The active RISC-V contributor base for Redis is effectively one person (huangzhengx), with a single additional contributor (Polaris-911) on one PR. Both appear affiliated with ZTE RISC-V [NEEDS VERIFICATION]. No Redis maintainer currently has access to RISC-V hardware, as confirmed by ShooterIT's review comment on PR #14251.

**Benchmark data availability:** No public Redis riscv64 vs. arm64 performance comparison reports were found on riseproject.dev or anywhere on the public web. The only quantitative data available is from the PR descriptions themselves, measured on SG2042/SG2044.

---

## 11. Known Bugs and Active Issues

| Item | Type | Status | Impact |
|---|---|---|---|
| [PR #15204](https://github.com/redis/redis/pull/15204) -- BITCOUNT Zbb popcount | Performance gap | Open, awaiting review | BITCOUNT falls to scalar on riscv64; +288% throughput available pending merge |
| [PR #15273](https://github.com/redis/redis/pull/15273) -- HyperLogLog RVV | Performance gap | Open, awaiting review | PFCOUNT/PFMERGE fall to scalar on riscv64 |
| `USE_PROCESSOR_CLOCK` opt-in only | Usability gap | No tracking issue | AArch64 gets hardware clock by default; riscv64 requires explicit `-DUSE_PROCESSOR_CLOCK` build flag |
| `BUILD_WITH_MODULES=yes` broken | Build blocker | No tracking issue | `modules/Makefile` Rust installer case statement exits with error for riscv64; JSON, RediSearch, RedisBloom, RedisTimeSeries unavailable |
| No riscv64 CI | Coverage gap | No tracking issue | Correctness regressions on riscv64 are not caught by upstream CI |
| OpenSSL [#30330](https://github.com/openssl/openssl/issues/30330) -- `rv64i_zkne_set_encrypt_key` correctness | Correctness bug (upstream dep) | Open in OpenSSL repo | Affects TLS builds with Zkne-capable toolchains; null-key logic reversed |

No open correctness or crash bugs specific to riscv64 in the redis/redis issue tracker were found as of the search date.

---

## 12. Objections and Upstream Blockers

**Reviewer bandwidth is the primary bottleneck.** Both open PRs (#15204, #15273) have been waiting since May 2026 with zero maintainer engagement. The assigned reviewer (fcostaoliveira) has not responded to any RISC-V PR. sundb has merged past RISC-V work without waiting for fcostaoliveira on at least one occasion (PR #14342). The team's own documentation warns that PRs may wait significant time.

**No maintainer has RISC-V hardware.** This was stated explicitly during PR #14251 review. All riscv64 correctness validation depends on contributors running tests themselves and reporting results. There is no CI backstop.

**`BUILD_WITH_MODULES=yes` is an undocumented blocker.** The `modules/Makefile` hard-codes an architecture list for the Rust toolchain installer. This is not documented anywhere in the Redis RISC-V contribution history and would be discovered only during a build attempt.

**The `USE_PROCESSOR_CLOCK` asymmetry is a latent performance surprise.** A team deploying Redis 8.4+ on RISC-V expecting the same clock behavior as on AArch64 will get the slower POSIX path unless the build flag is set explicitly. This is not documented in any release notes or build guides.

**No adversarial review process for RISC-V PRs.** The merged PRs were reviewed by a small number of maintainers, none of whom have RISC-V hardware. The review for PR #14251 identified real bugs (redundant check, missing Linux guard, big/little-endian device tree handling), but these were found through code review, not hardware testing. The potential for subtle architecture-specific bugs that only manifest on RISC-V hardware is non-zero and unmitigated by CI.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The core Redis server builds and runs correctly on riscv64 today. No functional blockers exist for the non-module build. The one hard functional blocker is `BUILD_WITH_MODULES=yes`, which blocks JSON, RediSearch, RedisBloom, and RedisTimeSeries. Fixing this requires patching `modules/Makefile` to add riscv64 to the Rust installer case statement, which requires either a pre-installed riscv64 Rust toolchain or upstream contribution to add RISC-V to the modules build support matrix.

### 13.2 Performance Optimization

Two merged PRs (monotonic clock, SipHash unaligned) provide concrete gains available in Redis 8.4+. Two open PRs (BITCOUNT Zbb, HyperLogLog RVV) are ready for merge pending reviewer action.

The pending PRs represent a concrete engagement opportunity. Both are authored by external contributors, well-structured, and targeted for Redis 8.10. Engaging fcostaoliveira or sundb directly to unblock these reviews would have an outsized impact relative to the reviewer time required.

### 13.3 CI/CD Infrastructure

The absence of any riscv64 CI is the single largest structural gap. Every other gap (missing optimizations, opt-in clock flag) is a performance or usability issue. The absence of CI means correctness regressions on riscv64 are invisible to the project until a downstream user reports them. This is a credibility and sustainability risk for any organization depending on Redis on RISC-V.

The RISE Project's free native riscv64 runners (Scaleway EM-RV1, launched March 2026) are available to GitHub-hosted projects at no cost. Adding a minimal riscv64 build-and-smoke-test job to `ci.yml` (build + PING/SET/GET via `redis-cli`) is low-effort and directly addresses the sustainability gap. This does not require Redis Ltd. to purchase hardware.

### 13.4 Ecosystem Enablement

Redis is fully available in Debian and Ubuntu riscv64 package repositories. Docker official images include riscv64 for Alpine-based and Debian/trixie-based builds. The distribution surface is adequate for users building on standard Linux distributions. The gap is upstream project ownership of the port, not user-facing availability.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Patch `modules/Makefile` to support riscv64 Rust toolchain | 1 | Qualcomm / upstream PR | Critical |
| Performance | Unblock PR #15204 (BITCOUNT Zbb popcount) via reviewer engagement | 0.5 (coordination) | Qualcomm (liaison) | High |
| Performance | Unblock PR #15273 (HyperLogLog RVV) via reviewer engagement | 0.5 (coordination) | Qualcomm (liaison) | High |
| Performance | Make `USE_PROCESSOR_CLOCK` default-on for riscv64 (matching AArch64 behavior) | 0.5 | Qualcomm / upstream PR | Medium |
| CI/CD | Add riscv64 build + smoke-test job to `ci.yml` using RISE native runners | 1 | Qualcomm / upstream PR | Critical |
| CI/CD | Add full riscv64 test suite execution to CI (requires RISE runner capacity) | 3 | Qualcomm + RISE | High |
| Performance | Contribute riscv64 vs arm64 benchmark report to establish baseline | 2 | Qualcomm | Medium |
| Ecosystem | Document riscv64 build procedure in Redis CONTRIBUTING.md | 1 | Qualcomm / upstream PR | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [redis/redis repository](https://github.com/redis/redis)
- [PR #14251 -- USE_PROCESSOR_CLOCK for RISC-V](https://github.com/redis/redis/pull/14251)
- [PR #14342 -- Unaligned access optimizations for RISC-V with Zicclsm](https://github.com/redis/redis/pull/14342)
- [PR #14166 -- Enable UNALIGNED_LE_CPU for RISC-V (closed, superseded)](https://github.com/redis/redis/pull/14166)
- [PR #15204 -- RISC-V Zbb popcount support (open)](https://github.com/redis/redis/pull/15204)
- [PR #15273 -- HyperLogLog RVV vectorization (open)](https://github.com/redis/redis/pull/15273)
- [Debian buildd status for redis](https://buildd.debian.org/status/package.php?p=redis)
- [Ubuntu Noble redis-server package](https://packages.ubuntu.com/noble/redis-server)
- [Arch Linux RISC-V status](https://archriscv.felixc.at/.status/status.htm)
- [jemalloc issue #2323 -- riscv64gc support](https://github.com/jemalloc/jemalloc/issues/2323)
- [jemalloc issue #2399 -- riscv64 cross-build](https://github.com/jemalloc/jemalloc/issues/2399)
- [OpenSSL issue #30330 -- rv64i_zkne_set_encrypt_key correctness bug](https://github.com/openssl/openssl/issues/30330)
- [OpenSSL issue #30880 -- riscv64 CI flakiness](https://github.com/openssl/openssl/issues/30880)
- [xxHash issue #1018 -- riscv64 inline asm optimization proposal](https://github.com/Cyan4973/xxHash/issues/1018)
- [RISE Project -- RISC-V Runners announcement (March 2026)](https://riseproject.dev/blog)
- [Valkey fork (Linux Foundation)](https://github.com/valkey-io/valkey)