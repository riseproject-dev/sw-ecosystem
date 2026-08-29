---
title: TimescaleDB
parent: Project Reports
color: yellow
---

# TimescaleDB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for TimescaleDB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

TimescaleDB is a PostgreSQL extension that adds time-series storage and query
capabilities to PostgreSQL. It implements automatic partitioning (hypertables),
columnar compression, continuous aggregates, and a vectorized aggregation engine
on top of standard PostgreSQL infrastructure. It is written in C and requires
PostgreSQL 13 or later.

**Governance:** TimescaleDB has no independent foundation. It is a corporate
open-source project wholly owned by Timescale, Inc., which rebranded as
TigerData on 2025-06-17 (legal entity remains "Timescale, Inc., d/b/a Tiger
Data"). There is no Apache Software Foundation, CNCF, or other neutral
foundation oversight.

**License:** Dual-licensed. The core engine is Apache 2.0. Enterprise features
ship under the Timescale License Agreement (TLS), which is source-available
but not OSI-approved. Debian and Ubuntu package only the Apache 2.0 core
(`+dfsg` repack removes TLS-only code).

**Active maintainers** (derived from recent commit history; no MAINTAINERS or
CODEOWNERS file exists in the repository): akuzm (Alexander Kuzmenkov),
svenklemm (Sven Klemm), dbeck, Poroma-Banerjee, gayyappan -- all
Timescale/TigerData employees. No external corporate co-maintainers are
identified.

**Community stance on new ports:** No public discussion of RISC-V porting
exists. The project is tightly controlled by TigerData engineers with no
history of community-driven architecture expansions. New platform support
would require either a TigerData business case or a well-maintained community
PR. Because TimescaleDB is a PostgreSQL extension in C, a RISC-V port is
technically straightforward -- it primarily depends on PostgreSQL supporting
RISC-V on the target OS, which PostgreSQL does -- but no such work is
currently prioritized or planned.

**RISE membership:** Timescale/TigerData is not a RISE project member. The
RISE member list (8 Premier + 11 General members as of 2026-08) does not
include any Timescale entity.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2025-08-27 | Debian Trixie ships `postgresql-17-timescaledb` 2.19.3+dfsg-1+deb13u1 for riscv64 | [Debian package tracker](https://packages.debian.org/trixie/postgresql-17-timescaledb) |
| 2026-08-19 | Debian sid ships `postgresql-18-timescaledb` 2.29.2+dfsg-1 for riscv64 | [Debian pool](https://ftp.debian.org/debian/pool/main/t/timescaledb/) |
| (ongoing) | Ubuntu 26.04 (resolute) ships `postgresql-18-timescaledb` 2.25.1+dfsg-1 for riscv64 | [packages.ubuntu.com resolute](https://packages.ubuntu.com/resolute/postgresql-18-timescaledb) |

No upstream port exists. There are zero issues, PRs, commits, or code
references to RISC-V in the `timescale/timescaledb` repository across all
search vectors (GitHub Issues API, PRs API, Commits API, Code Search, and
web search). The riscv64 packages available in Ubuntu and Debian are built
entirely by Canonical and Debian maintainers from dfsg-repacked source,
with no upstream involvement.

**Key contributors:** None identified -- all riscv64 packaging work is done
by Debian/Ubuntu maintainers, not by TimescaleDB upstream contributors.

## 3. Upstream Support Tier

TimescaleDB has no formal platform tier policy document (no PLATFORMS.md, no
SUPPORT.md, no docs/platforms/ directory). Platform support is implicitly
determined by the CI matrix. RISC-V is neither blocked nor planned -- it is
absent from all upstream considerations.

| Tier aspect | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| CI builds | Yes | Yes (custom runner) | No |
| CI tests pass | Yes | Yes | No |
| Upstream binary releases | Yes (Windows ZIP) | No | No |
| Docker image manifest | Yes | Yes | No |
| Official support statement | Implicit (CI) | Implicit (CI) | None |
| Distribution package | Ubuntu/Debian | Ubuntu/Debian | Ubuntu/Debian (distro-built only) |

The arm64 CI runner (`timescaledb-runner-arm64`) uses
`CFLAGS=-march=armv8.2-a+crypto` to enable ARM crypto extensions for
vectorized grouping. The riscv64 distribution package is a downstream
initiative with no upstream backing.

## 4. Technical Architecture and RISC-V-Specific Subsystems

TimescaleDB's performance-sensitive code is concentrated in four areas:

**UMASH hashing (vectorized text/multi-column GROUP BY)**

UMASH is a vendored non-cryptographic hash library (`tsl/src/import/umash.c`)
used for vectorized aggregation on text columns, UUID columns, and
multi-column grouping keys. It requires either x86-64 PCLMUL
(`__PCLMUL__`, `-mpclmul`) or ARM crypto (`__ARM_FEATURE_CRYPTO`,
`-march=...+crypto`). The source contains a hard compile-time
`#error "Unsupported platform: umash requires CLMUL (-mpclmul) on x86-64, or crypto (-march=...+crypto) extensions on aarch64."` for all other architectures. On riscv64, the
build system (`tsl/src/CMakeLists.txt`) auto-detects this at configure time
and sets `USE_UMASH=OFF`, disabling the text and serialized hashing
strategies entirely. This is a silent functional gap: vectorized text-column
and multi-column GROUP BY do not exist on riscv64.

RISC-V extensions that could close this gap: Zvbc or Zbc (carry-less
multiply) or Zvkned (AES). No upstream code to wire these in exists.

**CRC32 fast hash (fixed-width single-column grouping)**

`tsl/src/nodes/vector_agg/hashing/hash64.h` uses SSE4.2 `_mm_crc32_u64`
under the `USE_SSE42_CRC32C` flag for fast hashing of 2/4/8-byte integer
keys. On riscv64, this flag is not set and the code falls back to the
SplitMix64 scalar finalizer. Fixed-width integer-key grouping works but
without hardware acceleration. RISC-V Zbc/Zbkc extensions would enable
hardware CRC, but no such code exists.

**FastLanes compression (integer column compression)**

`tsl/src/compression/algorithms/fastlanes/` implements bit-packing and
frame-of-reference (FFOR) compression for integer columns. The README
states: "only portable C" with compiler auto-vectorization. No SIMD
intrinsics, no `#ifdef __riscv`, no `.S` files. Compiles and runs on all
platforms. The compiler may auto-vectorize this on riscv64 with
`-march=rv64gcv` but no explicit RVV handling exists. This is a performance
gap (auto-vectorization quality vs. hand-tuned SIMD) but not a functional
gap.

**Vector aggregation functions (SUM/MIN/MAX/AVG)**

The columnar accumulation code is portable C with no ISA-specific dispatch.
No architecture-specific implementations for riscv64 exist. The compiler
may auto-vectorize.

| Component | amd64 implementation | arm64 implementation | riscv64 implementation |
|-----------|---------------------|---------------------|----------------------|
| UMASH text/multi-col hashing | PCLMUL intrinsics | NEON+crypto (`vmull_p64`) | Missing (compile-time disabled) |
| CRC32 fast hash (int keys) | SSE4.2 `_mm_crc32_u64` | Scalar SplitMix64 | Scalar SplitMix64 |
| FastLanes compression | Portable C (compiler auto-vec) | Portable C (compiler auto-vec) | Portable C (compiler auto-vec) |
| Vector aggregation (sum/min/max) | Portable C (compiler auto-vec) | Portable C (compiler auto-vec) | Portable C (compiler auto-vec) |
| JIT query compilation | PostgreSQL LLVM JIT | PostgreSQL LLVM JIT | Disabled (JIT package unavailable on riscv64) |

## 5. Build System, Cross-Compilation, and Toolchain

**Standard build commands** (from `docs/BuildSource.md`):

```bash
git clone https://github.com/timescale/timescaledb.git
cd timescaledb
git checkout <release-tag>
./bootstrap [-DCMAKE_BUILD_TYPE=Release] [-DPG_CONFIG=/path/to/pg_config]
cd build && make
make install
```

The `bootstrap` script is a wrapper around `cmake`. CMake >= 3.15 is
required (`cmake_minimum_required(VERSION 3.15)` in `CMakeLists.txt`). No
minimum GCC or Clang version is stated; any compiler with C11 support
(`-std=c11` for PG <= 17, `-std=c23` for PG >= 18) is accepted.

**Native riscv64 build invocation:**

```bash
./bootstrap \
  -DCMAKE_BUILD_TYPE=Release \
  -DPG_CONFIG=/usr/lib/postgresql/18/bin/pg_config \
  -DUSE_OPENSSL=ON \
  -DUSE_UMASH=OFF
```

`USE_UMASH=OFF` is not strictly necessary to specify -- the configure step
will auto-detect and set it OFF -- but explicitly passing it avoids
a confusing warning if the UMASH probe fails.

**Key CMake flags for riscv64:**

| Flag | Default | riscv64 note |
|------|---------|--------------|
| `USE_UMASH` | auto-detected | Auto-sets OFF on riscv64; do not force ON |
| `USE_OPENSSL` | ON | Keep ON if PostgreSQL was built with OpenSSL |
| `APACHE_ONLY` | OFF | Set ON to exclude TSL/proprietary code |
| `WARNINGS_AS_ERRORS` | ON (Debug), OFF (Release) | Can disable during porting |
| `EXPERIMENTAL` | OFF | Set ON to skip PG version check with snapshot PG builds |

**Cross-compilation:** No riscv64 CMake toolchain file exists in the
repository (`cmake/` contains only `GenerateScripts.cmake`,
`GenerateTestSchedule.cmake`, `GitCommands.cmake`, `ScriptFiles.cmake`).
A custom toolchain file is required for cross-compilation:

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
```

When `CMAKE_CROSSCOMPILING=TRUE`, the UMASH `-mpclmul` probe is
additionally guarded away (`if(NOT CMAKE_CROSSCOMPILING)` at
`tsl/src/CMakeLists.txt` line 53), so `USE_UMASH` correctly remains OFF.

**QEMU:** No QEMU usage in the repository. The 32-bit CI uses a native
`i386/debian:bookworm-slim` container. For riscv64 testing, QEMU
user-mode emulation or a native board would need to be set up externally.

**Known build failures:** None documented, but the build has not been tested
upstream. The Ubuntu 26.04 package build succeeding confirms the core build
is functional on riscv64. The one structural issue is that `USE_UMASH=OFF`
causes `hash_strategy_single_text.c` and `hash_strategy_serialized.c` to be
excluded from compilation, resulting in a functional gap rather than a build
failure.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Hypertable storage | Full | Full | Full |
| Columnar compression (FastLanes) | Full | Full | Full |
| Continuous aggregates | Full | Full | Full |
| Vectorized aggregation (int keys) | Full | Full | Full (scalar fallback) |
| Vectorized aggregation (text keys) | Full (UMASH) | Full (UMASH+crypto) | Absent (UMASH disabled) |
| Vectorized aggregation (multi-col) | Full (UMASH) | Full (UMASH+crypto) | Absent (UMASH disabled) |
| CRC32-accelerated hashing | Hardware (SSE4.2) | Scalar fallback | Scalar fallback |
| PostgreSQL JIT (LLVM) | Available | Available | Unavailable (distro) |
| SSL/TLS (OpenSSL) | Full | Full | Full (software AES; no Zknd/Zkne) |

**Functional gaps on riscv64:**

1. Vectorized text-column and multi-column GROUP BY are not compiled in.
   Queries that exercise these paths fall back to PostgreSQL's standard
   (non-vectorized) hash aggregation. There is no crash, no error, and no
   data corruption -- only a performance regression.

2. PostgreSQL JIT is unavailable on riscv64 in Ubuntu 26.04 (the
   `postgresql-18-jit` package is not built for riscv64). TimescaleDB's own
   columnar execution engine operates independently of JIT, so this does not
   affect columnar scans, but complex query plans that would benefit from JIT
   run uncompiled.

**Performance gaps on riscv64 (no benchmark data available):**

- Vectorized integer aggregation runs without hardware CRC32 (SplitMix64
  fallback).
- FastLanes compression runs on portable C without explicit RVV
  auto-vectorization tuning.
- No benchmark data for TimescaleDB on riscv64 exists in any public source
  (GitHub, RISE blog, or web). Data not available: no riscv64 vs amd64/arm64
  performance comparison.

**Security hardening gaps:** OpenSSL on riscv64 uses software AES (T-table
implementation) unless the CPU implements Zknd/Zkne or Zvkned. The T-table
AES is not constant-time. See the OpenSSL report for full details.

**NaN/floating-point semantics:** No riscv64-specific floating-point issues
have been identified in TimescaleDB. The code does not contain
architecture-specific floating-point dispatch.

## 7. CI/CD Infrastructure

No riscv64 CI exists in the `timescale/timescaledb` repository. All 47
workflow files in `.github/workflows/` were read and searched; none contains
the strings `riscv`, `riscv64`, `risc-v`, or `RISCV`.

| CI aspect | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Build | Yes (ubuntu-22.04) | Yes (timescaledb-runner-arm64) | No |
| Unit/regression tests | Yes | Yes | No |
| Vectorized aggregation tests | Yes | Yes (with `-march=armv8.2-a+crypto`) | No |
| Sanitizer (ASAN/UBSAN) | Yes | No | No |
| Memory tests (Valgrind) | Yes | No | No |
| Package build (apt) | Yes (amd64 + ARM) | Yes | No |
| RISE CI runners | No | No | No |

The arm64 build requires a self-hosted runner (`timescaledb-runner-arm64`)
with `-march=armv8.2-a+crypto` to enable ARM crypto for UMASH. No RISE
runners are used. No QEMU-based riscv64 emulation test job exists.

## 8. Distribution and Release Status

**Upstream releases:** GitHub releases provide only Windows/amd64 ZIP
archives (`timescaledb-postgresql-{16,17,18}-windows-amd64.zip`). No Linux
binaries, no riscv64 binaries, and no arm64 binaries are published upstream.
The three most recent releases (2.29.2, 2.29.1, 2.29.0) each contain exactly
three assets, all Windows/amd64.

**Docker Hub:** The official `timescale/timescaledb` Docker image supports
linux/amd64, linux/arm64, linux/arm/v7, linux/arm/v6, and linux/386. No
linux/riscv64 manifest entry exists.

**Distribution packages:**

| Distribution | Package | Version | riscv64 |
|-------------|---------|---------|---------|
| Ubuntu 26.04 (resolute) | postgresql-18-timescaledb | 2.25.1+dfsg-1 | Yes |
| Debian sid | postgresql-18-timescaledb | 2.29.2+dfsg-1 | Yes |
| Debian Trixie | postgresql-17-timescaledb | 2.19.3+dfsg-1+deb13u1 | Yes |
| Docker Hub | timescale/timescaledb | latest | No |
| PyPI (`timescaledb`) | Django ORM wrapper | 0.2.1 | N/A (pure Python) |

All distribution packages are built by Canonical/Debian maintainers from
dfsg-repacked source. The `+dfsg` suffix indicates that non-DFSG-compliant
files (TLS enterprise code) are removed. These builds are not tested by
upstream CI and represent a downstream initiative.

**To get a working riscv64 binary:** Install `postgresql-18-timescaledb`
from Ubuntu 26.04 or Debian via `apt install postgresql-18-timescaledb`.
No upstream-provided binary exists.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|------------|------|--------------|--------------|-----------------|-----------------|
| PostgreSQL | Database engine hosting the extension | Green | Green (regression tests pass) | Green (ubuntu/debian packages) | LLVM JIT unavailable on riscv64; affects query compilation not columnar engine |
| OpenSSL (libssl3) | TLS for remote connections and telemetry | Green | Yellow (QEMU CI; known flaky test) | Green (libssl3t64 in Ubuntu 26.04 riscv64) | Software AES only unless Zknd/Zkne present; T-table not constant-time |
| LZ4 (liblz4) | Column and WAL compression | Green | Yellow (QEMU CI only) | Green (liblz4-1 in Ubuntu 26.04 riscv64) | LZ4_FAST_DEC_LOOP not enabled (PRs [#1678](https://github.com/lz4/lz4/pull/1678), [#1739](https://github.com/lz4/lz4/pull/1739) unmerged); performance gap |
| zstd (libzstd) | Higher-ratio column compression | Green | Yellow (QEMU CI only) | Green (libzstd1 in Ubuntu 26.04 riscv64) | Fast sequence decoding path not enabled (PR [#4557](https://github.com/facebook/zstd/pull/4557) stalled); performance gap |
| UMASH (vendored) | Vectorized text/multi-col GROUP BY hashing | Red (disabled) | N/A | N/A | Hard #error at compile time; USE_UMASH=OFF on riscv64; entire text and multi-col vectorized grouping absent |
| FastLanes (vendored) | Integer column bitpacking compression | Green | Green | Green | None; pure portable C |
| LLVM JIT (via PostgreSQL) | Query plan JIT compilation | Red (unavailable) | N/A | N/A | postgresql-18-jit not built for riscv64 in Ubuntu 26.04 |
| libpq5 | PostgreSQL client library | Green | Green | Green | None |

**PostgreSQL (critical dependency):** PostgreSQL builds and tests pass on
riscv64. LLVM JIT is disabled in all riscv64 distribution packages due to
segfaults in the LLVM JIT backend. TimescaleDB's vectorized columnar engine
operates independently of JIT and is not affected.

**UMASH (critical gap):** The vendored UMASH library has a hard
`#error` for riscv64. The build system auto-detects and disables it.
The RISC-V extensions Zvbc (carry-less multiply on vectors) or Zbkc
(carry-less multiply on scalars) could provide the underlying operation
needed, but no upstream code exists to wire them in.

**LZ4 / zstd:** Both dependencies have performance gaps on riscv64 (no
fast decode paths, no unaligned-access optimization). These are performance
gaps, not functional blockers.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs have been filed against TimescaleDB. The following
bugs on related architectures document the portability surface:

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#8984](https://github.com/timescale/timescaledb/issues/8984) | Tests consistently fail on ARM (vector_agg_text, vector_agg_uuid, etc.) | Closed 2025-11-28 | High | Vectorized aggregation nodes not enabled on ARM for certain query shapes; closest analog for riscv64 risk |
| [#9039](https://github.com/timescale/timescaledb/issues/9039) | TimescaleDB 2.24.0 Debian arm64 crashes with SIGILL on Raspberry Pi 4 | Closed 2026-01-23 | Critical | SIGILL from CPU features not supported by ARMv8.0 (armv8.2 binary run on armv8.0 CPU); regression in 2.24.0 |
| [#9126](https://github.com/timescale/timescaledb/issues/9126) | SIGILL on Raspberry Pi 3B+ (ARMv8.0-A Cortex-A53) with 2.24.0 | Closed 2026-01-23 | Critical | Same root cause as #9039: arm64 package built with features not supported on older ARMv8.0 cores |
| [#9900](https://github.com/timescale/timescaledb/issues/9900) | Illegal instruction on Intel Atom (SIGILL in _mm_clmulepi64_si128 / umash.c) | Closed 2026-05-26 | Critical | PCLMUL compiled in but CPU lacks it; crash path: `umash_fprint -> single_text_key_hashing_get_key -> vector_agg_exec`; confirms runtime SIGILL risk if UMASH is forced on an unsupported ISA |
| [#9996](https://github.com/timescale/timescaledb/issues/9996) | Domain constraint not respected in vectorized filter | Open 2026-06-08 | Medium | Architecture-agnostic correctness bug in vectorized filter layer |
| [#9925](https://github.com/timescale/timescaledb/issues/9925) | Wrong null handling for degenerate scalar array operations in vectorized filters | Open 2026-05-29 | Medium | Architecture-agnostic null handling bug in vectorized filter |

The SIGILL pattern in #9039, #9126, and #9900 is the exact failure mode that
would occur if UMASH were compiled in on riscv64 (it is not, so this is
not an active risk -- but it illustrates why the hard `#error` and
auto-disable exist).

## 12. Objections and Upstream Blockers

**No stated objections:** No issues, PRs, or forum posts document any
decision to block or defer RISC-V support. The absence is one of
disinterest, not active rejection.

**Technical blockers:**

1. UMASH: Requires a RISC-V carry-less multiply implementation (Zvbc/Zbkc)
   or an alternative hash algorithm. This is the most significant engineering
   task for feature parity.

2. LLVM JIT: Blocked by the PostgreSQL/distro LLVM segfault issue on
   riscv64. Not a TimescaleDB issue to fix.

3. No riscv64 CI runner: Self-hosted riscv64 runners are required for
   testing (the ARM64 path uses a self-hosted runner); GitHub Actions does
   not provide hosted riscv64 runners as of 2026-08.

**Organizational blockers:**

- TigerData has no disclosed commercial interest in RISC-V. There is no
  evidence of RISC-V hardware in their customer or internal deployment base.

- All maintainers are TigerData employees. External contributions require
  a CLA (Contributor License Agreement). Community-driven RISC-V port PRs
  are possible but would need to be maintained by the submitter; TigerData
  is unlikely to own ongoing riscv64 CI costs without a business case.

**Acceptance probability:** Data not available -- no upstream discussion
exists to evaluate receptiveness to a RISC-V port PR.

## 13. Readiness Assessment

- **Color:** yellow (Distribution floor -- no upstream riscv64 CI, but
  Ubuntu 26.04 and Debian ship unpatched riscv64 packages built from source)
- **Release provider:** distro

TimescaleDB has no upstream riscv64 CI, no upstream riscv64 binary releases,
and zero riscv64-related activity in the repository. Ubuntu 26.04 and Debian
ship `postgresql-18-timescaledb` for riscv64 as a distro-built package
([packages.ubuntu.com](https://packages.ubuntu.com/resolute/postgresql-18-timescaledb)),
confirming that the build succeeds and the package is installable. The
distribution floor rule applies: distro ships an unpatched riscv64 build,
giving a floor of yellow. No upstream testing is performed on riscv64.

The build is functionally correct except for the UMASH vectorized hashing
gap: text-column and multi-column GROUP BY fall back to non-vectorized
PostgreSQL execution (no crash, no data error). FastLanes compression,
continuous aggregates, and hypertable storage are fully functional.

Pending work that could change the grade:
- An upstream riscv64 CI job with passing tests would raise the grade to blue.
- A UMASH replacement for riscv64 (Zvbc/Zbkc-based or algorithmic fallback)
  would close the primary performance gap but would not by itself affect the
  color.
- No RISE involvement in TimescaleDB exists at this time.

## 14. Investment Analysis

### 14.1 Functional Enablement

TimescaleDB installs and runs on riscv64 via the Ubuntu/Debian package.
Basic time-series workloads (insert, query, compression, continuous
aggregates) are functional. The only functional gap is vectorized text/multi-
column GROUP BY via UMASH.

Work required to close the functional gap:
- Implement a riscv64 carry-less multiply path in `tsl/src/import/umash.c`
  using Zvbc or Zbkc extensions (or a scalar software fallback), and update
  `tsl/src/CMakeLists.txt` to detect riscv64 CLMUL capability. [NEEDS
  VERIFICATION: whether TigerData would accept a Zbkc-scalar fallback vs.
  requiring a hardware extension path]
- Alternatively, replace UMASH with a platform-agnostic hash (e.g., a
  wyhash or xxHash3 variant) for riscv64 builds.

### 14.2 Performance Optimization

Performance gaps relative to amd64 (no benchmark data -- gap is structural):

1. CRC32 hash path: Add a Zbc/Zbkc-based CRC32 implementation in
   `tsl/src/nodes/vector_agg/hashing/hash64.h` (equivalent to the SSE4.2
   path). Effort: 1-2 weeks.

2. FastLanes compression: Add explicit RVV (RISC-V Vector) intrinsics for the
   bit-packing inner loops in `tsl/src/compression/algorithms/fastlanes/`.
   This mirrors the auto-vectorization improvement pattern. Effort: 4-6
   weeks, requires profiling on riscv64 hardware to justify.

3. JIT: Blocked upstream (PostgreSQL LLVM JIT unavailable on riscv64 in
   distributions). Not actionable within TimescaleDB.

### 14.3 CI/CD Infrastructure

- Add a riscv64 build job to `.github/workflows/linux-build-and-test.yaml`
  using either a self-hosted riscv64 runner or QEMU-based emulation.
- Add a riscv64 package build job to `apt-packages.yaml` and
  `apt-installcheck.yaml`.
- Estimated effort: 2-3 weeks (CI setup, QEMU or runner provisioning,
  test exclusion list for UMASH-dependent tests analogous to the 32-bit
  job's exclusions).

### 14.4 Ecosystem Enablement

No dependent package ecosystem requires separate enablement for riscv64. The
PyPI `timescaledb` package (v0.2.1) is a pure-Python Django ORM wrapper
(`py3-none-any`); it works on riscv64 without any changes. No npm, Maven, or
OCI ecosystem components require separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | UMASH riscv64 carry-less multiply path or hash algorithm replacement | 3-4 | Timescale/TigerData or community (CLA required) | High |
| Functional | cmake detection for riscv64 UMASH support | 1 | Timescale/TigerData or community | High |
| Performance | CRC32 Zbc/Zbkc hash path in hash64.h | 1-2 | Community | Medium |
| Performance | RVV intrinsics for FastLanes compression | 4-6 | Community | Low |
| CI/CD | riscv64 build + test job (QEMU or self-hosted runner) | 2-3 | Timescale/TigerData or community | High |
| CI/CD | riscv64 package build verification | 1 | Timescale/TigerData or community | Medium |

Total estimated effort: 12-17 person-weeks for full functional parity and
basic CI. Performance optimization (FastLanes RVV) is optional and lower
priority.

## 15. Updates

No updates yet -- initial report dated 2026-06-17.

## 16. References

- [timescale/timescaledb GitHub repository](https://github.com/timescale/timescaledb)
- [TimescaleDB homepage (TigerData)](https://www.timescale.com/)
- [postgresql-18-timescaledb Ubuntu 26.04 (resolute)](https://packages.ubuntu.com/resolute/postgresql-18-timescaledb)
- [postgresql-18-timescaledb Ubuntu 26.04 riscv64 download page](https://packages.ubuntu.com/resolute/riscv64/postgresql-18-timescaledb/download)
- [postgresql-17-timescaledb Debian Trixie](https://packages.debian.org/trixie/postgresql-17-timescaledb)
- [postgresql-18-timescaledb Debian sid pool](https://ftp.debian.org/debian/pool/main/t/timescaledb/)
- [PyPI timescaledb 0.2.1](https://pypi.org/project/timescaledb/)
- [RISE Project member list](https://riseproject.dev)
- [TimescaleDB issue #8984: Tests fail on ARM (vector_agg_text, vector_agg_uuid)](https://github.com/timescale/timescaledb/issues/8984)
- [TimescaleDB issue #9039: SIGILL on Raspberry Pi 4 with 2.24.0](https://github.com/timescale/timescaledb/issues/9039)
- [TimescaleDB issue #9126: SIGILL on Raspberry Pi 3B+ (ARMv8.0-A)](https://github.com/timescale/timescaledb/issues/9126)
- [TimescaleDB issue #9900: Illegal instruction on Intel Atom in umash.c](https://github.com/timescale/timescaledb/issues/9900)
- [TimescaleDB issue #9996: Domain constraint not respected in vectorized filter](https://github.com/timescale/timescaledb/issues/9996)
- [TimescaleDB issue #9925: Wrong null handling in vectorized filters](https://github.com/timescale/timescaledb/issues/9925)
- [LZ4 riscv64 fast decode loop PR #1678](https://github.com/lz4/lz4/pull/1678)
- [LZ4 riscv64 fast decode loop PR #1739](https://github.com/lz4/lz4/pull/1739)
- [zstd riscv64 fast sequence decoding PR #4557](https://github.com/facebook/zstd/pull/4557)
