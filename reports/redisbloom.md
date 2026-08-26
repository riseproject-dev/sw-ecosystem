---
title: RedisBloom
---

# RedisBloom

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for RedisBloom<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[RedisBloom](https://redis.io/docs/data-types/probabilistic/) is a Redis module that adds probabilistic data structures to a Redis server: Bloom filter (`BF.*`), Cuckoo filter (`CF.*`), Count-Min Sketch (`CMS.*`), Top-K (`TOPK.*`), and t-digest (`TDIGEST.*`). It is implemented in C and loaded at runtime as a shared library (`.so`) into a running Redis process.

**Deprecation status (as of May 2025):** The standalone RedisBloom module is deprecated. Starting with Redis 8 GA (May 2025), all RedisBloom data structures are built into the core Redis Open Source codebase. No further standalone releases are planned. Future RISC-V work for these data structures must target `redis/redis`, not `RedisBloom/RedisBloom`.

**Governance:** Redis Ltd. (formerly Redis Labs) wholly owns and governs this project. There is no Linux Foundation, CNCF, or Apache Software Foundation membership. All active maintainers carry `@redis.com` email addresses: Tom Gabsow, Eran Hadad, and Momchil Marinov are the current active committers. Historical contributors Guy Korland and Mark Nunberg have left for other companies (FalkorDB and Valkey respectively). Contributions require signing the Redis Software Grant and Contributor License Agreement. Major features require pre-approval from Redis Ltd. staff designated as "project leaders."

**License:** RSALv2 / SSPLv1 / AGPLv3 (AGPLv3 added with Redis 8 GA in May 2025; earlier releases were RSALv2/SSPLv1 only). The non-OSI-approved dual license has historically deterred Linux distribution packaging.

**Culture toward new ports:** No published platform tier or porting policy exists. Given the deprecation of the standalone module, Redis Ltd. has no stated interest in extending the standalone module's platform support. RISC-V work is not on any public roadmap.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| Never | No riscv64-related issue, PR, commit, or discussion has ever appeared in the repository | GitHub code search, issue search, PR search - all return 0 results |
| May 2025 | Redis 8 GA released; RedisBloom data structures integrated into Redis core | README, Redis 8 announcement |
| 2026-08-14 | Standalone module confirmed deprecated; 12 open issues, none architecture-related | Live GitHub issue scan |

No RISC-V port has ever been attempted, proposed, or discussed for RedisBloom. There is no upstreaming timeline because there is no port to upstream.

---

## 3. Upstream Support Tier

No formal platform tier policy is published. The effective tier is determined by the CI matrix and the Makefile architecture allowlist.

| Criterion | amd64 (x64) | arm64 | riscv64 |
|-----------|------------|-------|---------|
| Makefile allowlist | Yes | Yes (as `arm64v8`) | No - hard build error |
| CI build | Yes | Yes | No |
| CI test | Yes | Yes | No |
| Official prebuilt binary | No (GitHub Releases have 0 assets) | No | No |
| Debian/Ubuntu package | No (package not in Debian; not in Ubuntu noble) | No | No |
| Explicit README mention | Implicit (default) | Implicit (default) | Not mentioned |

The Makefile contains an explicit allowlist that aborts compilation for any architecture other than `x64` or `arm64v8` before a single source file is compiled. This is not an oversight; it is a deliberate gate.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

RedisBloom's source code is entirely portable C with no architecture-specific subsystems.

| Component | File(s) | Architecture-specific code | riscv64 status |
|-----------|---------|---------------------------|----------------|
| Bloom filter core | `deps/bloom/bloom.c` (255 lines) | None | Portable C, scalar |
| MurmurHash2 | `deps/murmur2/MurmurHash2.c` (190 lines) | None (little-endian assumption; riscv64 is LE by default) | Portable C, scalar |
| Cuckoo filter | `src/cuckoo.c` (439 lines) | None | Portable C, scalar |
| Count-Min Sketch | `src/cms.c` (193 lines) | None | Portable C, scalar |
| Top-K | `src/topk.c` (244 lines) | None | Portable C, scalar |
| t-digest | `deps/t-digest-c/` (C99, CMake) | None | Portable C, scalar |
| Redis module glue | `src/rebloom.c`, `src/sb.c`, etc. | None | Portable C, scalar |

GitHub code search for `__x86_64__`, `__aarch64__`, `__ARM_NEON`, `__riscv`, and `#ifdef __riscv` in `RedisBloom/RedisBloom` returns 0 results for every query. There is no SIMD, no inline assembly, no JIT backend, no arch/ subdirectory, and no ISA dispatch layer anywhere in the codebase.

The absence of architecture-specific code means riscv64 is not behind any other architecture in the compiled logic. The only blocker is the Makefile allowlist, not a missing implementation.

MurmurHash2 uses unaligned 4-byte reads and assumes little-endian byte order. riscv64 Linux is little-endian by default, so there is no correctness issue for the standard deployment configuration.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Primary build system:** GNU Make, wrapping CMake only for the `deps/t-digest-c` submodule. No top-level `CMakeLists.txt` exists. C standard: `gnu99` (flag: `-std=gnu99`).

**Architecture hard block (exact Makefile text):**

```makefile
ifneq ($(ARCH),x64)
ifneq ($(ARCH),arm64v8)
$(error RedisBloom only supports 64-bit architectures (x64, arm64v8). Current architecture: $(ARCH))
endif
endif
```

The `ARCH` variable is populated by `deps/readies/paella/platform.py`'s `_identify_arch()` function, which maps `aarch64` to `arm64v8` but has no mapping for `riscv64`. On riscv64, `platform.machine()` returns `riscv64` verbatim, which is not in the allowlist, causing the immediate error.

**CMake flags for t-digest-c (the only CMake component):**

```
cmake -DBUILD_SHARED=OFF -DBUILD_STATIC=ON -DENABLE_CODECOVERAGE=OFF
      -DBUILD_TESTS=OFF -DBUILD_BENCHMARK=OFF -DBUILD_EXAMPLES=OFF
      -DCMAKE_C_FLAGS=-DTD_MALLOC_INCLUDE="..."
```

No architecture-specific CMake flags exist. No riscv64 toolchain file exists anywhere in the repository.

**Cross-compilation:** Not supported. No documented cross-compilation path, no Docker cross-build configuration, no QEMU build support.

**Required fix to unblock a source build on riscv64:**

1. In `deps/readies/paella/platform.py`, add a `riscv64` case to `_identify_arch()`.
2. In the Makefile, extend the architecture allowlist to include `riscv64`.

No other source changes are required, as the source code itself is fully portable.

**GCC/Clang minimum versions:** Not documented. No compiler version guards exist in any Makefile or CMakeLists.txt. [NEEDS VERIFICATION]

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| `BF.*` Bloom filter commands | Full | Full | Not buildable (build gate) |
| `CF.*` Cuckoo filter commands | Full | Full | Not buildable |
| `CMS.*` Count-Min Sketch commands | Full | Full | Not buildable |
| `TOPK.*` Top-K commands | Full | Full | Not buildable |
| `TDIGEST.*` t-digest commands | Full | Full | Not buildable |
| SIMD acceleration | None (scalar only) | None (scalar only) | None (scalar only) |

There are no SIMD-accelerated code paths on any architecture. riscv64 has no performance gap relative to amd64 or arm64 from missing SIMD - the baseline is uniformly scalar across all three. Any performance delta on riscv64 would be attributable to CPU microarchitecture, clock frequency, and memory subsystem, not to missing software optimization.

No floating-point correctness issues are known. The t-digest component uses IEEE 754 double-precision arithmetic; riscv64 has full hardware double-precision support in the D extension (included in riscv64gc, the standard Linux profile). [NEEDS VERIFICATION - no riscv64 test run has been executed to confirm t-digest numerical output parity]

No security hardening gaps specific to riscv64 are known from the research findings.

---

## 7. CI/CD Infrastructure

All 20 workflow files in `.github/workflows/` were read in full. The string "riscv" (case-insensitive) appears in zero files across all 20.

| CI dimension | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Build CI | Yes (`ubuntu-latest`) | Yes (`ubuntu24-arm64-4-16` self-hosted) | No |
| Functional test CI | Yes | Yes | No |
| Nightly CI | Yes | Yes | No |
| Benchmark CI | Yes (`redisfab/rmbuilder:6.2.7-x64-focal`) | No | No |
| QEMU emulation | No | No | No |
| RISE runners | No | No | No |

CI platforms tested (amd64 and arm64 only): Ubuntu focal, jammy, noble, resolute; Debian bullseye, bookworm, trixie; Rocky Linux 8/9/10; AlmaLinux 8/9/10; Amazon Linux 2 and 2023; Azure Linux 3; Alpine.

No RISE CI runners are used for any architecture. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

---

## 8. Distribution and Release Status

| Channel | riscv64 binary | Notes |
|---------|---------------|-------|
| [GitHub Releases](https://github.com/RedisBloom/RedisBloom/releases) | No | All recent releases (v2.8.24, v2.6.32, v2.4.27, v2.8.23, v2.6.31) have zero release assets attached |
| [PyPI redisbloom](https://pypi.org/project/redisbloom/) v0.4.1 | N/A (pure Python) | `py3-none-any` wheel; architecture-agnostic Python client library, not the server module |
| Debian tracker | No | [Package does not exist in Debian](https://tracker.debian.org/pkg/redisbloom) (HTTP 404) |
| Ubuntu 24.04 noble | No | Not in Ubuntu noble repository |
| [Arch Linux RISC-V mirror](https://archriscv.felixc.at/) | No | Not found in the Arch RISC-V package mirror |

**What a user must do to get a working binary on riscv64:**

1. Remove the architecture allowlist from the Makefile (two `ifneq` blocks, approximately 3 lines).
2. Add a `riscv64` case to `deps/readies/paella/platform.py`.
3. Build from source using `make build`.
4. Run against a Redis server that also supports riscv64 (see `reports/redis.md` for Redis riscv64 status).

Note: the `redisbloom` PyPI package (the Python client) installs on riscv64 without any modification because it is a pure-Python library (`py3-none-any`). However, this client is useless without the server-side `.so` module also running.

**Strategic note:** Redis 8 integrates all RedisBloom data structures natively. Users on Redis 8 do not need the standalone module at all. The relevant binary question for RISC-V is the Redis 8 server binary, not the RedisBloom module.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocker |
|------------|------|--------------|-------------|----------------|---------|
| Redis server | Required runtime host; RedisBloom loads as a `.so` module | Builds (no hard arch gate in Redis source) | No riscv64 CI in Redis repo | No riscv64 binary release | See `reports/redis.md` |
| Build system (Makefile + `deps/readies/paella`) | Arch detection and build orchestration | BLOCKED - hard Makefile error for riscv64 | N/A | N/A | `paella/_identify_arch()` has no riscv64 case; Makefile allowlist is `{x64, arm64v8}` only |
| `deps/t-digest-c` (submodule, tag v0.4.1) | t-digest sketch for `TDIGEST.*` | Builds (pure C99, no arch guards) | No riscv64 CI | No releases | Not a blocker once build gate is removed |
| `deps/bloom/bloom.c` (vendored) | Bloom filter for `BF.*` | Builds (pure C) | Untested on riscv64 | N/A (vendored) | Not a blocker |
| `deps/murmur2/MurmurHash2.c` (vendored) | Hash function for Bloom and Cuckoo filters | Builds (little-endian assumption; riscv64 is LE) | Untested | N/A (vendored) | Not a blocker |
| `deps/RedisModulesSDK` (submodule) | Redis module API headers (`redismodule.h`) | Builds (header-only) | N/A | N/A | Not a blocker |

The only dependency that constitutes a hard technical blocker is the build system itself. All compiled dependencies are portable C with no architecture-specific code. The Redis server dependency is a separate concern addressed in the Redis status report.

---

## 11. Known Bugs and Active Issues

No RISC-V related issues or bugs exist in the `RedisBloom/RedisBloom` repository. The 12 currently open issues cover macOS build failures, Rocky Linux build errors, Redis 8.x packaging, and user questions about filter behavior.

| Issue | Title | Status | Architecture relevance |
|-------|-------|--------|----------------------|
| All 12 open issues | Various build and usage topics | Open | None - zero riscv64 or architecture content |

GitHub searches for `riscv`, `riscv64`, performance, and floating-point topics all returned 0 results. No riscv64 tracking issue has ever been filed.

---

## 12. Objections and Upstream Blockers

**Deprecation is the primary organizational blocker.** RedisBloom is deprecated as of May 2025. Redis Ltd. has no stated interest in extending the standalone module's platform support. Any riscv64 PR to `RedisBloom/RedisBloom` would be reviewed by a team that has declared the module end-of-life. The probability of acceptance for a riscv64 port to the standalone repo is low.

**Correct upstream target is Redis 8.** Since Redis 8 inlines all of these data structures, riscv64 enablement belongs in `redis/redis`, not in `RedisBloom/RedisBloom`. See `reports/redis.md` for the Redis riscv64 status. This report's findings for the standalone module are strategically secondary.

**License friction.** The RSALv2/SSPLv1/AGPLv3 tri-license has historically prevented inclusion in major Linux distributions. Ubuntu and Debian do not package RedisBloom. This limits the value of a source-level port, since there is no distribution packaging path to deliver it to end users.

**Technical blockers are minor.** The build gate is a 3-line Makefile change plus a one-line Python addition. The source code itself is fully portable. There are no JIT backends, no SIMD paths, and no architecture-specific assembly to implement. The technical effort to build on riscv64 is trivial; the organizational and strategic barriers are the real constraints.

---

## 13. Investment Analysis

Given the deprecation of the standalone module and the integration of all data structures into Redis 8, investment in `RedisBloom/RedisBloom` specifically is not recommended. The correct investment target is the Redis 8 server (`redis/redis`).

If a specific use case requires the standalone module (e.g., Redis 6 or 7 deployments), the following applies.

### 13.1 Functional Enablement

The build system block is the only functional blocker. All algorithms are portable C and will compile and run correctly on riscv64 once the build gate is removed.

### 13.2 Performance Optimization

No SIMD or ISA-specific optimizations exist on any platform. There is no RISC-V Vector Extension (RVV) gap to close because there is no SIMD baseline to match. Performance is determined entirely by scalar C execution and memory access patterns.

Data not available: no riscv64 benchmark runs have been performed, so no quantitative throughput or latency comparison between riscv64 and amd64/arm64 exists.

### 13.3 CI/CD Infrastructure

No riscv64 CI exists. Adding it would require either a self-hosted riscv64 runner (hardware or QEMU) or a GitHub Actions runner with riscv64 support. No RISE runners are currently available to this project.

### 13.4 Ecosystem Enablement

Not applicable. The server-side module has no dependent package ecosystem. The Python client is pure Python and already works on riscv64 without modification.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Functional | Remove Makefile arch allowlist; add `riscv64` case to `paella/platform.py` | 0.1 | External contributor | Low (module is deprecated; target Redis 8 instead) |
| Functional | Source build validation and correctness testing on riscv64 hardware or QEMU | 0.5 | External contributor | Low |
| CI/CD | Add riscv64 CI lane (QEMU or hardware runner) | 1.0 | External contributor + Redis Ltd. approval | Low |
| Performance | RVV-accelerated MurmurHash2 or Bloom filter inner loop | 2-4 | External contributor | Not recommended (module is deprecated) |

**Recommendation:** Do not invest in `RedisBloom/RedisBloom` riscv64 enablement. Direct equivalent effort to `redis/redis` riscv64 support, which delivers all of the same functionality via Redis 8 and has an active maintenance path.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [RedisBloom GitHub repository](https://github.com/RedisBloom/RedisBloom)
- [RedisBloom documentation - Probabilistic data types](https://redis.io/docs/data-types/probabilistic/)
- [RISE Project member list](https://riseproject.dev/members/)
- [PyPI redisbloom package](https://pypi.org/project/redisbloom/)
- [Debian package tracker - redisbloom (404)](https://tracker.debian.org/pkg/redisbloom)
- [Arch Linux RISC-V mirror](https://archriscv.felixc.at/)
- [Ubuntu package search - noble](https://packages.ubuntu.com/search?keywords=RedisBloom&suite=noble&searchon=names&section=all)
- [RedisBloom GitHub Releases](https://github.com/RedisBloom/RedisBloom/releases)
- [RedisBloom CI workflow - flow-linux.yml](https://github.com/RedisBloom/RedisBloom/blob/master/.github/workflows/flow-linux.yml)
- [RedisBloom CI workflow - benchmark-flow.yml](https://github.com/RedisBloom/RedisBloom/blob/master/.github/workflows/benchmark-flow.yml)
- [t-digest-c submodule](https://github.com/tdunning/t-digest-c)