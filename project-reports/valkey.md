---
title: Valkey
parent: Project Reports
color: yellow
---

# Valkey

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** Yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Valkey<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Valkey is an open-source, BSD-3-Clause-licensed in-memory key-value store forked from Redis 7.2.4 in March 2024 after Redis Ltd. relicensed Redis under SSPL/RSALv2. It is hosted under the Linux Foundation (LF Projects, LLC).

Governance is by a nine-member Technical Steering Committee (TSC). The current chair is Madelyn Olson (Amazon). The TSC includes representatives from Amazon (2 seats), Tencent, Apple, Percona, Google, Oracle, Alibaba, and Ericsson. A hard rule caps any single organization at one-third of TSC seats. Major technical decisions (new architecture, new API, breaking change) require a simple majority TSC vote. No TSC member is affiliated with a RISC-V-focused organization.

Major cloud providers with managed Valkey offerings include Amazon (ElastiCache), Google Cloud (Memorystore), Oracle Cloud (OCI Cache), Alibaba Cloud, Tencent Cloud, DigitalOcean, Heroku/Salesforce, IONOS Cloud, NetApp Instaclustr, UpCloud, Vultr, Aiven, Momento, and ByteDance.

The project has no formal platform tier policy document (no `PLATFORMS.md`, no `SUPPORT.md`). Platform support is implicitly defined by README language and CI workflow presence. The maintainer stance on RISC-V is explicit: it is a "standard C fallback" platform, not an optimization target. Maintainer @zuiderkwast stated in [issue #2031](https://github.com/valkey-io/valkey/issues/2031): "let's keep a fallback to standard C so it still runs on all systems including old 32-bit, s390x, RISC-V and who knows what."

Valkey is not a RISE Project member and does not appear in any RISE blog post, working group, or funded project list. Exhaustive search of all 34 RISE blog posts (2024-05-15 through 2026-08-24) and all 35 `riseproject-dev` GitHub repositories returned zero Valkey references.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-06-27 | Commit `ef4bb4e37490` adds RISC-V crash handler (`getAndSetMcontextEip`, `logRegisters`) to `src/debug.c` under `#elif defined(__riscv)`. Authored by michalbiesek. This is Redis upstream PR #12349 -- predates the Valkey fork. | [commit ef4bb4e](https://github.com/valkey-io/valkey/commit/ef4bb4e37490b7441657d8e8e36feb885144772e) |
| 2024-01-09 | Valkey 7.2.4 released as the first Valkey release. The RISC-V crash handler commit is present from day one, inherited from Redis. | [valkey-io/valkey releases](https://github.com/valkey-io/valkey/releases) |
| 2024-10-11 | libvalkey PR #114 merged: adds riscv64 cross-compile CI to the libvalkey C client library (a separate repo, also vendored inside Valkey's `deps/`). CI-only change, no source modifications. | [libvalkey PR #114](https://github.com/valkey-io/libvalkey/pull/114) |
| 2025-04-30 | libvalkey 0.1.0 released, shipping the riscv64 cross-compile CI. | [libvalkey releases](https://github.com/valkey-io/libvalkey/releases) |
| 2026-03-09 | Issue #2031 (CRC16 SIMD acceleration) closed without any RVV implementation. RISC-V explicitly named as a fallback-only platform. | [issue #2031](https://github.com/valkey-io/valkey/issues/2031) |

**Post-fork RISC-V contributions to `valkey-io/valkey`: zero.** All RISC-V code in the Valkey server was inherited from Redis. No Valkey-native RISC-V PR or commit exists. There is no master tracking issue for a RISC-V port.

Key contributor: michalbiesek (michalbiesek@gmail.com) -- authored the original Redis crash handler commit. No organizational affiliation identified in the research findings.

## 3. Upstream Support Tier

No formal tier policy exists. The implicit tiers, inferred from CI and README, are:

| Tier | Platforms | Evidence |
|---|---|---|
| Tier 1 (CI + binary releases) | Linux x86_64, Linux aarch64 | Dedicated GitHub Actions runners; binary artifacts published |
| Tier 2 (listed as supported) | macOS, OpenBSD, NetBSD, FreeBSD | README lists as supported; no dedicated CI jobs |
| Tier 3 (CI via emulation) | s390x (big-endian) | `uraimo/run-on-arch-action` in `daily.yml` |
| Best effort | Solaris/SmartOS | README explicitly says "best effort, not guaranteed" |
| Not a target | RISC-V | No CI, no binary releases, no tracking issue |

Architecture comparison:

| Property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | Native `ubuntu-latest` (daily) | Native `ubuntu-24.04-arm` (daily) | None |
| Official binary releases | Yes | Yes | No |
| Official Docker image | Yes (`linux/amd64`) | Yes (`linux/arm64`) | No |
| Ubuntu 26.04 package | Yes | Yes | Yes (ports archive) |
| Crash handler | Full (Linux + BSD + Solaris) | Full (Linux + macOS) | Linux only |
| SIMD acceleration | SSE2/AVX2/AVX512 | NEON | None (scalar fallback) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Valkey has no JIT compiler and no GC. Architecture-specific code is limited to SIMD acceleration, crash diagnostics, and low-level timing.

| Component | File | amd64 | arm64 | riscv64 | Quality |
|---|---|---|---|---|---|
| Hash table key lookup | `src/hashtable.c` | `findKeyInBucketSSE2` (SSE2) | `findKeyInBucketNeon` (NEON) | Generic C loop | Scalar |
| HyperLogLog merge/compress | `src/hyperloglog.c` | `hllMergeDenseAVX2`, `hllDenseCompressAVX2` | `hllMergeDenseNEON`, `hllDenseCompressNEON` | Generic C loop | Scalar |
| BITCOUNT popcount | `src/bitops.c` | AVX2 (>=32 bytes) | NEON (>=16 bytes) | Scalar lookup table | Scalar |
| BITOP AND/OR/XOR/NOT | `src/bitops.c` (PR [#3605](https://github.com/valkey-io/valkey/pull/3605), open) | AVX2 | NEON | Scalar fallback | Scalar |
| Crash handler (PC + registers) | `src/debug.c` | Full: Linux + BSD + Solaris | Full: Linux + macOS | Linux only, all 31 GPRs named | Complete (Linux) |
| SipHash unaligned LE load | `src/siphash.c` | `UNALIGNED_LE_CPU` defined (direct 64-bit load) | `UNALIGNED_LE_CPU` defined | Not listed (byte-by-byte path) | Scalar (missed opt) |
| Monotonic clock | `src/monotonic.c` | TSC (`__x86_64__`) | CNTVCT (`__aarch64__`) | `clock_gettime()` syscall fallback | Scalar |
| CRC16 | `src/crc16.c` | Pure C (512-byte LUT) | Pure C | Pure C | Equal |
| CRC64 | `src/crc64.c` | Pure C | Pure C | Pure C | Equal |
| SHA256 | `src/sha256.c` | Pure C | Pure C | Pure C | Equal |
| jemalloc quantum | `deps/jemalloc/include/jemalloc/internal/quantum.h` | `LG_QUANTUM=4` | `LG_QUANTUM=4` | `LG_QUANTUM=4` (correct) | Complete |
| zmalloc thread memory | `src/zmalloc.c` | Plain `size_t` (TSO safe) | Plain `size_t` | `_Atomic size_t` fallback | Correct, slower |

The crash handler in `src/debug.c` is a complete, production-quality implementation: 30 lines, all 31 GPRs named with correct ABI names (ra, gp, tp, t0-t6, s0-s11, a0-a7), stack content dump via `logStackContent`. It is larger than the aarch64 block (30 vs 19 lines) because RISC-V has more GPRs. No TODO or FIXME markers. Linux-only; FreeBSD/OpenBSD RISC-V falls to `NOT_SUPPORTED()`.

No `arch/riscv/` directory exists. No `.S` assembly files exist anywhere in the repo. No RVV intrinsics (`vfloat32m1_t`, `rvv`, `HAVE_RVV`, `HAVE_RISCV`) exist anywhere in `src/`. The SIMD dispatch macros in `src/config.h` are `HAVE_X86_SIMD` and `HAVE_ARM_NEON`; no `HAVE_RISCV_RVV` equivalent exists.

## 5. Build System, Cross-Compilation, and Toolchain

Valkey supports two build systems: a primary Makefile (`src/Makefile`) and an experimental CMake build (`CMakeLists.txt` + `cmake/Modules/ValkeySetup.cmake`).

There is no dedicated riscv64 build documentation, no cmake toolchain file for riscv64, and no riscv64 Dockerfile anywhere in the repository.

**Required toolchain versions:**

| Component | Version | Reason |
|---|---|---|
| GCC (riscv64 cross) | GCC 12 minimum | `riscv64-linux-gnu-gcc-12` is the version used in the only riscv64 cross-compile CI in the repo (`deps/libvalkey/.github/workflows/build.yml`) |
| GCC (native Linux) | GCC 13 (used in daily CI) | `gcc-13` explicitly installed in `daily.yml` |
| CMake | >= 3.10 | `cmake_minimum_required(VERSION 3.10)` in `CMakeLists.txt` |
| C standard | C11 (gnu11) | `ValkeySetup.cmake` checks for `stdatomic.h`; uses `-std=gnu11`, falls back to `-std=c99` |

**Native riscv64 build (on a riscv64 host):**
```bash
make MALLOC=jemalloc -j$(nproc)
```

**Cross-compilation (safe, using libc allocator):**
```bash
make CC=riscv64-linux-gnu-gcc-12 \
     AR=riscv64-linux-gnu-ar \
     MALLOC=libc \
     -j$(nproc)
```

**Cross-compilation with jemalloc (requires `DEB_HOST_GNU_TYPE`):**
```bash
DEB_HOST_GNU_TYPE=riscv64-linux-gnu \
  make CC=riscv64-linux-gnu-gcc-12 \
       AR=riscv64-linux-gnu-ar \
       -j$(nproc)
```
`DEB_HOST_GNU_TYPE` triggers `--host=riscv64-linux-gnu` in jemalloc's `./configure`, which is required for correct cross-compilation of jemalloc.

**CMake cross-compilation:**
```bash
mkdir build-riscv64 && cd build-riscv64
cmake .. \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc-12 \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++-12 \
  -DBUILD_MALLOC=libc \
  -DBUILD_TLS=no \
  -DBUILD_RDMA=no
make -j$(nproc)
```

**Critical known build issue -- jemalloc `--with-lg-quantum=3` mismatch:**
`deps/Makefile` hardcodes `./configure --with-lg-quantum=3` (8-byte alignment). The correct value for riscv64 is `LG_QUANTUM=4` (16-byte), as defined in `deps/jemalloc/include/jemalloc/internal/quantum.h`. Passing `--with-lg-quantum=3` to jemalloc on a riscv64 host will cause heap corruption. Workaround: use `MALLOC=libc` for cross-compilation, or pass `DEB_HOST_GNU_TYPE=riscv64-linux-gnu` so jemalloc's `./configure` receives `--host=riscv64-linux-gnu` and auto-detects the correct quantum.

**`-latomic` not added for riscv64:**
`src/Makefile` adds `-latomic` for `armv*` and `ppc*` but not for `riscv64`. GCC 12+ has built-in atomics for riscv64, but older toolchains may require `FINAL_LIBS="-latomic"`. [NEEDS VERIFICATION] on GCC 14+.

**QEMU:** The main Valkey CI does not use QEMU for riscv64. To run cross-compiled binaries on an x86_64 host: `sudo apt-get install qemu-user-static && qemu-riscv64-static ./src/valkey-server --version`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| Hash table SIMD lookup | SSE2 | NEON | Scalar C loop | Performance |
| HyperLogLog SIMD merge | AVX2 | NEON | Scalar C loop | Performance |
| BITCOUNT acceleration | AVX2 | NEON | Scalar lookup table | Performance |
| BITOP acceleration | AVX2 (PR open) | NEON (PR open) | Scalar | Performance |
| Monotonic clock (hardware) | TSC (~10-30 ns) | CNTVCT (~10-30 ns) | `clock_gettime()` (~100 ns) | Performance (~3% GET/SET per Valkey 9.1 release notes) |
| SipHash unaligned LE load | Direct 64-bit | Direct 64-bit | Byte-by-byte | Performance (minor) |
| Crash handler | Full (Linux + BSD + Solaris) | Full (Linux + macOS) | Linux only | Functional (non-Linux BSDs) |
| `-funwind-tables` in Makefile | Yes | Yes (aarch64/armv*) | No | Diagnostic (stack unwind quality) |
| Docker image | Yes | Yes | No | Distribution |
| Official binary release | Yes | Yes | No | Distribution |
| Upstream CI | Yes (native) | Yes (native) | No | Quality assurance |
| TLS support | Yes | Yes | Yes (system OpenSSL) | None |
| RDMA support | Yes | Yes | Yes (system libs) | None |
| Lua scripting | Yes | Yes | Yes (pure C) | None |
| musl/Alpine | Yes | Yes | Yes (with open bug #3812) | Correctness (see Section 11) |

**Performance gap quantification:** No riscv64 benchmark data exists. All published Valkey benchmarks run on AWS EC2 ARM64 (Graviton) or x86_64. The scalar fallback for hash table lookup and HyperLogLog operations is expected to produce measurable throughput regression relative to arm64 at equivalent clock speeds, but no measured delta is available.

**Floating-point semantics:** No riscv64-specific floating-point issues identified. NaN-related bugs in sorted sets (issues #3921, #3989, #3988) were closed and were not architecture-specific.

## 7. CI/CD Infrastructure

**The main Valkey server (`valkey-io/valkey`) has zero riscv64 CI.** All 20 workflow files in `.github/workflows/` were checked; none contain "riscv". This was verified by direct file-by-file inspection via GitHub API.

A workflow file at `deps/libvalkey/.github/workflows/build.yml` contains a riscv64 cross-compile matrix entry. This file is never executed by GitHub Actions -- GitHub Actions only processes workflow files at the repository root `.github/workflows/`. The file is inert text from GitHub Actions' perspective. Confirmed: `GET /repos/valkey-io/valkey/contents/.github/workflows/build.yml` returns HTTP 404.

The `valkey-io/libvalkey` client library (a separate repository) does have riscv64 cross-compile CI (PR #114, merged 2024-10-11), but this tests the C client library, not the Valkey server.

| Property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | `ubuntu-latest` (native) | `ubuntu-24.04-arm` (native) | None |
| CI workflow | `ci.yml`, `daily.yml`, `weekly.yml` | `daily.yml` | None |
| Test execution | Full test suite | Full test suite | None |
| QEMU | No | No | N/A |
| RISE runners | No | No | No |
| Benchmark CI | Self-hosted ARM64 EC2 (every 8 hours) | Same | None |

No RISE runner sponsorship for Valkey exists. The `stack-reports/databases/databases.md` file in this repository contains a recommendation that "RISE runner sponsorship for Valkey is the lowest-friction path given the community's openness to contributions" -- this is a recommendation, not current funded work.

## 8. Distribution and Release Status

**GitHub Releases:** Valkey publishes source-only releases (`.tar.gz` + `.zip`). No pre-built binaries exist for any architecture -- not riscv64, not amd64, not arm64. Latest releases: 9.1.1, 9.0.5, 8.1.9, 8.0.10, 7.2.14.

**Docker Hub (`valkey/valkey`):** Published platforms are `linux/amd64`, `linux/arm64`, `linux/arm/v7`, `linux/ppc64le`. No `linux/riscv64`. The container CI (`valkey-io/valkey-container`) does not include riscv64 in its build matrix.

**Ubuntu 26.04 (resolute):** riscv64 binaries are available in the Ubuntu ports archive. Verified by downloading and inspecting the actual `.deb`:

| Package | Version | Architecture | Builder |
|---|---|---|---|
| `valkey-server` | 9.0.3-0ubuntu2 | riscv64 | bos03-riscv64-060 (native hardware) |
| `valkey-sentinel` | 9.0.3-0ubuntu2 | riscv64 | bos03-riscv64-060 |
| `valkey-tools` | 9.0.3-0ubuntu2 | riscv64 | bos03-riscv64-060 |

ELF verification of extracted `valkey-cli` from `valkey-tools_9.0.3-0ubuntu2_riscv64.deb`: `ELF 64-bit LSB pie executable, UCB RISC-V, RVC, double-float ABI, version 1 (SYSV), dynamically linked, interpreter /lib/ld-linux-riscv64-lp64d.so.1`. Built on a native riscv64 Launchpad builder, not cross-compiled.

**Alpine Linux edge:** `valkey 9.0.4-r0` is available (source-compiled). Subject to open bug #3812 (musl segfault on `BUILD_LUA=module`).

**Arch Linux RISC-V (`archriscv.felixc.at`):** Not packaged.

**PyPI `valkey`:** The Python client library (`valkey 6.1.1`) ships as `valkey-6.1.1-py3-none-any.whl` -- pure Python, architecture-independent. Works on riscv64 without any special build.

**To get a working riscv64 binary today:** Install `valkey-server` from Ubuntu 26.04 ports archive, or build from source using `MALLOC=libc` with a riscv64 cross-compiler or native riscv64 host.

## 9. Dependencies

| Dependency | Role | Bundled? | riscv64 Build | riscv64 Test | riscv64 Release | Ubuntu 26.04 riscv64 | Blocking Issues |
|---|---|---|---|---|---|---|---|
| jemalloc 5.3.0 | Memory allocator (default on Linux) | Yes | Yes | No CI | No | `libjemalloc2` 5.3.0-4 | `--with-lg-quantum=3` hardcoded in `deps/Makefile` causes heap corruption on riscv64; workaround: `MALLOC=libc` or `DEB_HOST_GNU_TYPE`. See [jemalloc.md](jemalloc.md). |
| Lua 5.x | Scripting engine (EVAL/EVALSHA) | Yes | Yes | Yes (Debian buildd) | Yes | `liblua5.4-dev` 5.4.8-1build1 | None -- pure C. See [lua.md](lua.md). |
| LZ4 1.10.0 | Compression (RDB persistence, replication) | Yes | Yes | Yes (QEMU CI since Oct 2023) | Yes | `liblz4-dev` 1.10.0-8 | Performance gap: no RVV fast-decode path (PRs [#1678](https://github.com/lz4/lz4/pull/1678), [#1686](https://github.com/lz4/lz4/pull/1686), [#1739](https://github.com/lz4/lz4/pull/1739) open). See [lz4.md](lz4.md). |
| OpenSSL | TLS transport (`BUILD_TLS=yes/module`) | No (system) | Yes | Yes (13-config QEMU CI matrix) | Yes | `libssl-dev` 3.5.5-1ubuntu3.4 | FIPS provider not tested on riscv64. See [openssl.md](openssl.md). |
| libsystemd | systemd notify/watchdog (auto-detected) | No (system) | Yes | Yes | Yes | `libsystemd-dev` 259.5-0ubuntu3.4 | 57 open riscv64 issues in systemd repo; none block Valkey's use of the notify API. |
| librdmacm + libibverbs | RDMA transport (optional module, Linux only) | No (system) | Yes | Partial (3 riscv64 issues in rdma-core, all closed) | Yes | `librdmacm-dev` / `libibverbs-dev` 61.0-2ubuntu3 | No blocking issues; RDMA hardware not available on riscv64 platforms in practice. |
| libatomic | Sub-word atomic emulation | No (system) | Yes | Yes | Yes | `libatomic1` 16-20260322-1ubuntu1 | `src/Makefile` does not add `-latomic` for riscv64 (only ARM32 and POWER). GCC 12+ has built-in atomics; older toolchains may need `FINAL_LIBS="-latomic"`. |
| libvalkey (hiredis fork) | C client library (bundled, used internally) | Yes | Yes (pure C) | No dedicated CI | N/A | N/A (bundled) | No functional blockers. |
| linenoise | Line editing for valkey-cli | Yes | Yes (pure C) | N/A | N/A | N/A (bundled) | None. |
| hdr_histogram | Latency statistics | Yes | Yes (pure C) | N/A | N/A | N/A (bundled) | None. |
| fpconv | Fast float-to-string conversion | Yes | Yes (pure C) | N/A | N/A | N/A (bundled) | None. |

**jemalloc deep-dive:** The bundled jemalloc 5.3.0 has the correct `LG_QUANTUM=4` for riscv64 in `quantum.h`. The problem is the build system: `deps/Makefile` passes `--with-lg-quantum=3` unconditionally to jemalloc's `./configure`, overriding the header. This is a build system bug, not a jemalloc source bug. Ubuntu's packaged `libjemalloc2` is built correctly and is safe to use.

**LZ4 deep-dive:** LZ4 1.10.0 builds and runs correctly on riscv64 (scalar path). Three open PRs propose RVV vector acceleration for the decompression fast path but none are merged. The bundled copy in Valkey `deps/` is the same version as Ubuntu 26.04's system package.

**OpenSSL deep-dive:** OpenSSL 3.x builds and tests on riscv64 via QEMU in upstream CI. The FIPS provider is not tested on riscv64 [NEEDS VERIFICATION]. No blocking issues for Valkey's TLS use case.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#3812](https://github.com/valkey-io/valkey/issues/3812) | [BUG] BUILD_LUA=module segfaults on FUNCTION LOAD on Alpine Linux / musl | Open (2026-05-23) | High | Directly affects Alpine Linux riscv64, which uses musl libc. This is the primary riscv64 distribution path outside Ubuntu. |
| [#3850](https://github.com/valkey-io/valkey/issues/3850) | [BUG] reserved identifier violation | Open (2026-05-27) | Medium | Strict compiler behavior may differ on RISC-V toolchains. Not confirmed riscv64-specific. |
| [#1947](https://github.com/valkey-io/valkey/issues/1947) | [BUG] valkey-benchmark badly affected by Speculative Return Stack Overflow mitigations | Open (2025-04-12) | Low (riscv64) | ~53% throughput degradation in the benchmark client on AMD EPYC with SRSO mitigations enabled. RISC-V is not affected by SRSO. Relevant for benchmark methodology on x86. |
| jemalloc `--with-lg-quantum=3` | Build system passes wrong quantum to jemalloc on riscv64 | Not filed as issue | Critical (cross-compile) | Causes heap corruption when building with jemalloc on riscv64. Workaround: `MALLOC=libc`. |
| `-latomic` missing for riscv64 | `src/Makefile` does not add `-latomic` for riscv64 | Not filed as issue | Low-Medium | Added for `armv*` and `ppc*` but not riscv64. GCC 12+ has built-in atomics; risk is low on modern toolchains. |

**Correctness bugs (closed, not riscv64-specific):**

| ID | Title | Status |
|---|---|---|
| [#3921](https://github.com/valkey-io/valkey/pull/3921) | Reject NAN scores in listpack/ziplist-encoded sorted sets on RDB load | Closed |
| [#3989](https://github.com/valkey-io/valkey/pull/3989) | Fix NAN-score listpack test payload for 7.2 RDB version | Closed |
| [#3988](https://github.com/valkey-io/valkey/pull/3988) | Fix NAN-score listpack test payload for 8.0 RDB version | Closed |

## 12. Objections and Upstream Blockers

**Stated maintainer position:** RISC-V is explicitly a "standard C fallback" platform. The authoritative statement is from TSC member @zuiderkwast in [issue #2031](https://github.com/valkey-io/valkey/issues/2031): "Other platforms are not important to optimize, but let's keep a fallback to standard C so it still runs on all systems including old 32-bit, s390x, RISC-V and who knows what." This is not an objection to correctness work, but it is a clear signal that SIMD optimization PRs for riscv64 will face a higher bar than equivalent x86/ARM work.

**Organizational blockers:**
- No TSC member is affiliated with a RISC-V-focused organization. Adding riscv64 CI requires a TSC sponsor willing to maintain the infrastructure.
- Adding a new architecture that affects runtime behavior is a "Technical Major Decision" requiring a TSC vote (simple majority). This is a low bar procedurally, but requires a champion.
- No formal tier policy means a new port needs: (1) a TSC sponsor, (2) sustained CI infrastructure, (3) a binary release pipeline. None of these exist for riscv64.

**Technical blockers:**
- The jemalloc `--with-lg-quantum=3` build system bug must be fixed before riscv64 can use jemalloc (the default allocator). This is a one-line fix in `deps/Makefile` but requires a PR and TSC review.
- Bug #3812 (musl/Alpine segfault on `BUILD_LUA=module`) blocks the Alpine riscv64 deployment path.

**Acceptance probability for CI PR:** High. The project already uses `uraimo/run-on-arch-action` for s390x in `daily.yml`. A riscv64 QEMU job following the same pattern is technically straightforward and precedented. The main risk is finding a TSC member willing to own the ongoing maintenance.

**Acceptance probability for RVV SIMD PRs:** Low in the near term. The CRC16 SIMD issue (#2031) was closed after multiple failed attempts for x86/ARM. The maintainer stance is that short-key workloads do not benefit from SIMD. RVV PRs would need to demonstrate clear benchmark wins on realistic workloads.

## 13. Readiness Assessment

**Color:** Yellow (distro-floor case)
**Release provider:** distro (Ubuntu 26.04 ports archive)

Valkey has no upstream riscv64 CI in `valkey-io/valkey`. The only riscv64 reference in the main repository is a vendored dependency workflow file that GitHub Actions never executes. However, Ubuntu 26.04 (resolute) ships `valkey-server`, `valkey-sentinel`, and `valkey-tools` at version 9.0.3-0ubuntu2 for riscv64, built on native riscv64 hardware (Launchpad builder `bos03-riscv64-060`), with no riscv64-specific patches applied. The distribution floor rule applies: no upstream CI, distro ships riscv64 unpatched -> yellow.

The yellow grade reflects that the codebase is functional on riscv64 (