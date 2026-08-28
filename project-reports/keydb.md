---
title: KeyDB
---

# KeyDB

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for KeyDB<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

KeyDB is a multi-threaded fork of Redis, created in 2019 by John Sully under EQ Alpha Technology Ltd. Its primary differentiation from upstream Redis is a multi-threaded I/O model using a custom lock-free concurrent queue and an assembly-optimized spinlock (x86_64 only). Snap Inc. acquired EQ Alpha around 2021-2022 and moved the repository to [github.com/Snapchat/KeyDB](https://github.com/Snapchat/KeyDB).

**License:** BSD 3-Clause. Copyright holders are Salvatore Sanfilippo (upstream Redis), John Sully (original KeyDB author), EQ Alpha Technology Ltd. (2019-2021), and Snap Inc. (2022-present).

**Governance:** Corporate-driven, single-company (Snap Inc.) with community PR contributions. No steering committee, no TSC, no foundation affiliation. Code of Conduct is Contributor Covenant. Community channels are GitHub Issues, Slack, and community.keydb.dev. The README states: "The KeyDB team maintains this project as part of Snap Inc. KeyDB is used by Snap as part of its caching infrastructure and is fully open sourced. There is no separate commercial product and no paid support options available."

**RISE Project:** KeyDB is not a RISE Project member and does not appear in the RISE wheel builder package list (~80 packages). No RISE-funded work on KeyDB was found in any accessible source.

**Community culture on new ports:** Snap uses KeyDB exclusively on x86-64 and ARM64 servers. There is no organizational incentive to add a RISC-V port. No formal process for accepting new architecture tiers exists. PRs are accepted informally through GitHub. No community discussion of RISC-V has appeared in issues or PRs except one user benchmarking question (see Section 2).

**Maintenance status:** As of mid-2026, the project shows signs of reduced maintainer activity. Open issue [#923](https://github.com/Snapchat/KeyDB/issues/923) (Oct 2025) expresses community concern that the project is effectively abandoned by Snap Inc. Issue [#977](https://github.com/Snapchat/KeyDB/issues/977) (Jul 2026, "Project is died?") has received no maintainer response.

---

## 2. Port History and Upstreaming Timeline

There is no RISC-V port of KeyDB. The complete history of RISC-V-related activity in the repository is one user benchmarking question.

| Date | Event | Source |
|------|-------|--------|
| 2022-11-30 | Issue #517 opened: user runs `keydb-benchmark -n 1000000` on four unnamed RISC-V boards and asks why throughput differs across boards. Implies KeyDB compiled and ran on riscv64 via the generic POSIX codepath as of this date, with no dedicated port work. | [Issue #517](https://github.com/Snapchat/KeyDB/issues/517) |
| 2022-12-17 | Maintainer comment (DreadfulCode): `keydb-benchmark` is single-threaded; recommends `memtier_benchmark` instead. No architectural guidance given. | [Issue #517 comment](https://github.com/Snapchat/KeyDB/issues/517) |
| 2023-03-15 | Issue #517 closed. No further RISC-V activity in the tracker. | [Issue #517](https://github.com/Snapchat/KeyDB/issues/517) |

No dedicated riscv64 port issues, PRs, or commits exist in Snapchat/KeyDB. Searches confirmed:

- `gh search issues "riscv repo:Snapchat/KeyDB"`: 1 result (issue #517 only)
- `gh search issues "riscv64 repo:Snapchat/KeyDB"`: 0 results
- `gh search prs "riscv repo:Snapchat/KeyDB"`: 0 results
- `gh search commits "riscv repo:Snapchat/KeyDB"`: 0 results
- Full git tree scan for paths matching `riscv|rvv|risc-v`: empty

No key contributors with RISC-V work exist. The project is not upstream of any riscv64-specific work because none has been done.

---

## 3. Upstream Support Tier

No formal written tier policy document exists. Platform status is inferred from CI matrix and documentation.

| Platform | CI-Tested | Official Binaries | Documentation | Tier |
|----------|-----------|-------------------|---------------|------|
| Linux x86-64 | Yes (GitHub Actions, 3 jobs) | No (all GitHub releases have 0 assets) | Full | Tier 1 (primary) |
| Linux ARM64 | Yes (internal Machamp CI, `["amd64","arm64"]` matrix) [NEEDS VERIFICATION on public CI] | Docker image only (`linux/arm64/v8`) | Documented as "a main platform equal to Linux/x86" | Tier 1 (primary) |
| ARM/Raspberry Pi (ARMv7) | No | No | Mentioned in ARM docs | Tier 2 (community) |
| macOS | Yes (GitHub Actions, macos-latest) | No | Yes | Tier 2 |
| Android | No | No | "Runs but not officially supported" | Unofficial |
| riscv64 | No | No | Not mentioned | Not supported |

The ARM documentation page explicitly classifies ARM as "a main platform" equal to Linux/x86. RISC-V receives no mention anywhere in the official documentation.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

KeyDB's architecture-specific code is concentrated in three source files: `src/fastlock.cpp` (spinlock with spin-hint), `src/db.cpp` (SSE prefetch on the GET/SET hot path), and `src/debug.cpp` (crash register dump). The `src/config.h` header controls the `HAVE_ATOMIC` macro that enables GCC atomic builtins.

| Component | amd64 | aarch64 | riscv64 |
|-----------|-------|---------|---------|
| Spin-wait hint in fastlock | `pause` inline asm (`#if defined(__i386__) || defined(__amd64__)`) | `yield` inline asm (`#elif defined(__aarch64__)`) | Missing - no `#ifdef __riscv` branch; falls through to no-hint busy loop |
| Assembly spinlock (fastlock_x64.asm) | Hand-tuned x86-64 ASM; compiled when `uname_M == x86_64` | Not compiled | Not compiled |
| C++ fallback lock (fastlock.cpp) | Used when `USEASM=false` | Used (with yield hint) | Used (no hint) |
| SSE prefetch on GET/SET hot path (db.cpp) | `_mm_prefetch(..., _MM_HINT_T2)` guarded by `#if defined(__x86_64__) || defined(__i386__)` | Missing | Missing |
| Crash register dump (debug.cpp) | Full: RAX-R15, RIP, EFL via `uc_mcontext.gregs` | Partial: X18-X30, PC, SP, PSTATE via `uc_mcontext.regs[]` | Missing: function returns NULL (falls through all arch branches) |
| `HAVE_ATOMIC` in config.h | Set (x86 + GCC/glibc version checks) | Not set | Not set |
| SIMD/RVV dispatch | SSE4/AVX2 via RocksDB (opt-in) | None | None |
| JIT backend | None (KeyDB has no JIT; Lua 5.1, not LuaJIT, is used) | None | None |
| Byte order / endianness (config.h) | `BYTE_ORDER LITTLE_ENDIAN` set for `__x86_64__` | Not set explicitly | Not set explicitly |

The riscv64 build uses the generic C/C++ path throughout. The lock is functionally correct via `std::atomic` and Linux futex but lacks the spin-hint instruction (equivalent to the Zihintpause `pause` extension or `fence iorw,0`) that reduces power and interconnect traffic during contention. The crash handler will produce NULL context on riscv64, meaning post-mortem register state is unavailable in production incidents.

ISA extensions used: None. No RVV (RISC-V Vector) intrinsics, no Zba/Zbb bitmanip, no Zihintpause.

---

## 5. Build System, Cross-Compilation, and Toolchain

KeyDB uses GNU Make exclusively. The entry point is `Makefile` at the repo root, delegating to `src/Makefile`. There is no CMakeLists.txt, no cmake/ directory, and no cross-compilation toolchain file for riscv64.

**Standard build command:**

```
make -j$(nproc) BUILD_TLS=yes
```

**riscv64-specific behavior (automatic, no flags required):**

The assembly spinlock is gated by three conditions in `src/Makefile`:

```
ifeq ($(uname_S),Linux)
ifeq ($(uname_M),x86_64)
ifneq ($(TARGET32), true)
ifeq ($(USEASM),true)
    ASM_OBJ+= fastlock_x64.o
    CFLAGS+= -DASM_SPINLOCK
```

On riscv64, `uname_M` is `riscv64`, so `ASM_OBJ` stays empty and `-DASM_SPINLOCK` is never set. No override flag is required.

**Allocator:** The default allocator on Linux riscv64 is jemalloc. The Makefile exception for `armv6l`/`armv7l` does not apply to riscv64:

```
MALLOC=libc
ifneq ($(uname_M),armv6l)
ifneq ($(uname_M),armv7l)
ifeq ($(uname_S),Linux)
    MALLOC=jemalloc
```

The bundled jemalloc (`deps/jemalloc`) recognizes riscv64 via `config.guess`:

```
riscv32:Linux:*:* | riscv64:Linux:*:*)
    echo ${UNAME_MACHINE}-unknown-linux-${LIBC}
    exit ;;
```

**`-latomic`:** Added unconditionally on Linux. `libatomic1` must be installed (included in GCC toolchain or available as a separate package).

**`nasm`:** Listed as a build dependency in the Dockerfile but only used on x86_64. Safe to include on riscv64; no effect.

**Key build variables for riscv64:**

| Variable | Effect | riscv64 note |
|----------|--------|--------------|
| `USEASM=false` | Disable x86 ASM spinlock | Automatic on riscv64; explicit flag not needed |
| `MALLOC=libc` | Use libc malloc | Optional; jemalloc is default and works |
| `BUILD_TLS=yes` | Build with OpenSSL TLS | Requires `libssl-dev` |
| `ENABLE_FLASH=yes` | Enable RocksDB Flash storage | Requires RocksDB + compression libs + `libgflags-dev` |

**Minimum toolchain:** Not formally documented. The Makefile tests for C11 `_Atomic` at configure time and falls back to C99. C++ is compiled with `-std=c++17`. GCC 7+ or Clang 5+ satisfy both. The CI uses `ubuntu-latest` and `ubuntu-20.04` (GCC 9/10). No riscv64-specific minimum is enforced or tested.

**QEMU / cross-compilation:** No QEMU setup scripts, cross-compilation Dockerfiles, or QEMU-related CI steps exist in the repository. Native build on riscv64 hardware or `qemu-user-static` with a riscv64 container is the expected path. Cross-compilation is not documented or tested.

**Complete riscv64 native build procedure (Ubuntu/Debian):**

```
sudo apt-get install -y build-essential g++ make autoconf autotools-dev \
    pkg-config uuid-dev libcurl4-openssl-dev libbz2-dev zlib1g-dev \
    libsnappy-dev liblz4-dev libzstd-dev libssl-dev git libatomic1

git clone --recursive https://github.com/Snapchat/KeyDB.git
cd KeyDB
make -j$(nproc) BUILD_TLS=yes
```

No known build failures on riscv64 are documented in the issue tracker or web sources. The one data point confirming a successful build is issue #517 (Nov 2022), where a user ran the resulting binary on four unnamed riscv64 boards.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | aarch64 | riscv64 | Notes |
|---------|-------|---------|---------|-------|
| Core key-value operations (GET, SET, LPUSH, etc.) | Full | Full | Full | Generic C path; confirmed working by issue #517 |
| Multi-threaded I/O | Full | Full | Full | Uses C++ std::atomic and futex |
| TLS (`BUILD_TLS=yes`) | Full | Full | Functional, security gap (see OpenSSL notes) | OpenSSL constant-time AES-GCM issues on riscv64 |
| Flash storage backend (`ENABLE_FLASH=yes`, RocksDB) | Full | Full | Functional | No riscv64-specific issues in RocksDB for correctness |
| Lua scripting (EVAL/EVALSHA) | Full | Full | Full | Lua 5.1, pure C, no arch-specific code |
| Replication | Full | Full | Full | Uses hiredis (pure C) |
| Crash register dump | Full | Partial | Missing - returns NULL | `debug.cpp` has no riscv64 branch |
| Spin-wait efficiency | Full (pause asm) | Partial (yield asm) | Missing | No Zihintpause hint; busy loop under contention |
| SSE prefetch on GET/SET hot path | Full | Missing | Missing | `_mm_prefetch` guarded x86-only |
| ASM spinlock (fastlock_x64.asm) | Full | Missing | Missing | x86-64 only by design |
| HAVE_ATOMIC (GCC atomic builtin optimizations) | Enabled | Disabled | Disabled | config.h only enables for x86/PowerPC |
| NUMA-aware allocation (memkind) | Supported | Unknown | Likely non-functional | NUMA absent on most riscv64 boards; `MALLOC=memkind` flag required |

**Functional gaps:**
- Crash register dump returns NULL on riscv64. Post-mortem debugging of production crashes will lack register state.
- `HAVE_ATOMIC` is not set for riscv64. This affects `config.h`-gated atomic optimization paths. [NEEDS VERIFICATION on which code paths this gates at runtime]

**Performance gaps:**
- No spin-hint instruction in the lock contention path. Under high concurrency, riscv64 will busy-spin without the power/bandwidth hint that `pause` (x86) and `yield` (aarch64) provide.
- No `_mm_prefetch` equivalent on the GET/SET hot path. Memory latency on riscv64 will not be hidden by software prefetch.
- lz4 lacks RVV SIMD paths (upstream PRs [#1678](https://github.com/lz4/lz4/pull/1678), [#1734](https://github.com/lz4/lz4/pull/1734), [#1738](https://github.com/lz4/lz4/pull/1738), [#1779](https://github.com/lz4/lz4/pull/1779) open). Affects RocksDB compression performance when `ENABLE_FLASH=yes`.
- zstd lacks the 4-way fast decompression loop on riscv64 (upstream issue [#4622](https://github.com/facebook/zstd/issues/4622) open).

**Security hardening gaps:**
- OpenSSL constant-time AES-GCM and GHASH issues affect riscv64 (upstream issues #31080, #31082). If KeyDB TLS is used on riscv64, the TLS stack does not provide constant-time guarantees for AES-GCM. This is a security-relevant gap for production deployments requiring timing-attack resistance.

---

## 7. CI/CD Infrastructure

The sole public CI file is `.github/workflows/ci.yml`. It defines four jobs:

| Job | Runner | Architecture | Tests |
|-----|--------|--------------|-------|
| `test-ubuntu-latest` | ubuntu-latest | x86-64 | Full test suite |
| `build-ubuntu-old` | ubuntu-20.04 | x86-64 | Build only |
| `build-macos-latest` | macos-latest | x86-64 or Apple Silicon | Build only |
| `build-libc-malloc` | ubuntu-latest | x86-64 | Build with MALLOC=libc |

The string "riscv" does not appear anywhere in `ci.yml`. There is no:
- riscv64 runner of any kind
- QEMU emulation step
- architecture matrix (`strategy: matrix:`)
- cross-compilation step targeting RISC-V

An internal Machamp CI system (`ci.yaml`) targets `["amd64", "arm64"]` for PR and push-to-main triggers [NEEDS VERIFICATION - internal system, not publicly visible].

| CI dimension | amd64 | aarch64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (public GitHub Actions) | Yes (internal Machamp) | No |
| Test CI | Yes (public GitHub Actions, full suite) | Yes (internal Machamp) | No |
| QEMU emulation CI | No | No | No |
| RISE runner | No | No | No |
| Release-blocking | Yes | Yes | Not applicable |

---

## 8. Distribution and Release Status

**GitHub Releases:** All releases (v6.3.0 through v6.3.4) have zero binary assets attached. No release artifacts of any kind are published on GitHub for any architecture.

**Docker Hub (`eqalpha/keydb`):** Linux/amd64 and linux/arm64/v8 images published. No riscv64 image.

**Debian:** HTTP 404 on [tracker.debian.org/pkg/keydb](https://tracker.debian.org/pkg/keydb). KeyDB is not in Debian.

**Ubuntu 24.04 (Noble):** No results. KeyDB is not in Ubuntu 24.04.

**Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at/?q=keydb)):** Not present. Not packaged for Arch Linux RISC-V.

**PyPI `keydb` package:** Version 0.0.1, files `keydb-0.0.1-py3-none-any.whl` and `keydb-0.0.1.tar.gz`. This is a Python client library, not the KeyDB server. Pure Python, architecture-neutral. Not relevant to server deployment.

**RISE wheel builder:** KeyDB does not appear in the RISE wheel builder package list.

**Summary:** No riscv64 binary or package for KeyDB exists in any distribution channel. To obtain a working binary on riscv64, a user must build from source using the procedure in Section 5.

---

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 Build | riscv64 Tests | riscv64 Release | Blocking |
|---|---|---|---|---|---|
| jemalloc 5.2.1 (bundled) | Default Linux allocator | Builds (riscv64gc support in upstream jemalloc) | Unknown - no upstream riscv64 CI visible | No dedicated artifact | Minor: bundled version is 5.2.1; verify configure recognition on riscv64gc |
| RocksDB (submodule, opt-in) | Flash/NVMe backend | Builds (issues #12139, #7051 closed upstream) | Partial - Java static libs have riscv64 target; C++ CI coverage unclear | No riscv64 binaries | No correctness blocker; SIMD paths fall back gracefully |
| OpenSSL (system) | TLS, crypto | Builds | Open issues: timing/constant-time failures in AES-GCM (#31082), MD5 misaligned input (#32022) | Ships in distros for riscv64 | Semi-blocking: constant-time issues affect security posture for TLS deployments |
| zstd (system) | Compression (via RocksDB) | Builds | Passes | Packaged for riscv64 | Non-blocking: 4-way fast decompression loop absent (#4622, open) |
| lz4 (system) | Compression (via RocksDB) | Builds | Builds on riscv64 | Packaged for riscv64 | Non-blocking for correctness; RVV vectorization PRs open (#1678, #1734, #1738, #1778) |
| snappy (system) | Compression (via RocksDB) | Builds | Builds (benchmark submodule fix #208 closed) | Packaged for riscv64 | No blocking issues |
| zlib (system) | Compression | Builds | Passes | Packaged | No riscv64-specific issues |
| bzip2 (system) | Compression (via RocksDB) | Builds | Passes | Packaged | No riscv64-specific issues |
| hiredis (bundled, deps/hiredis) | Redis client (replication, cluster) | Builds - pure C, no arch code | Unknown (issue #1240 arch porting assessment closed) | N/A (bundled) | No blocking issues |
| Lua 5.1 (bundled, deps/lua) | Scripting (EVAL/EVALSHA) | Builds - pure C, no SIMD | Not tested on riscv64 upstream | N/A (bundled) | No blocking issues; Lua 5.1 has no JIT |
| concurrentqueue (header-only) | Lock-free MPMC queue (threading) | Builds with modern toolchains; linker error #453 with GCC 8.1 | Untested on riscv64 (issue #452 closed) | N/A (header-only) | Potentially blocking with old toolchains (GCC <= 8.1); GCC 10+ resolves |
| HdrHistogram_c (bundled) | Latency histogram | Builds - pure C | No riscv64-specific issues | N/A (bundled) | No blocking issues |
| memkind (optional, deps/memkind) | NUMA-aware allocator | Unknown | Untested | N/A | Low priority: NUMA absent on most riscv64 boards; gated behind `MALLOC=memkind` |
| fastlock (in-tree x86 ASM) | Performance-critical spinlock | x86 ASM not compiled; C fallback used automatically | C fallback functional; no explicit riscv64 branch | N/A (in-tree) | Non-blocking for correctness; no Zihintpause spin-hint in C fallback |

### OpenSSL Deep-Dive

OpenSSL is the most significant dependency concern for riscv64 KeyDB deployments using TLS. Upstream issues #31080 and #31082 document constant-time failures in AES-GCM and GHASH on riscv64 (no-clmul fallback path). Issue #32022 documents MD5 misaligned input crashes. These affect the security posture of TLS-enabled KeyDB on riscv64 in production. See `project-reports/openssl.md` for the full analysis.

### concurrentqueue Note

Issue [#453](https://github.com/cameron314/concurrentqueue/issues/453) documents a `.tbss` linker error on riscv64 with GCC 8.1. This is toolchain-version-specific. GCC 10+ (the version shipped in Ubuntu 20.04 and later) resolves the issue. Any riscv64 build environment using GCC >= 10 is not affected.

---

## 11. Known Bugs and Active Issues

### RISC-V-Specific Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#517](https://github.com/Snapchat/KeyDB/issues/517) | KeyDB performance factors | Closed | Informational | Only RISC-V item in tracker; user benchmarking question, not a bug |

### Architecture-Agnostic Issues Relevant to riscv64 Deployments

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#924](https://github.com/Snapchat/KeyDB/issues/924) | Crash from fastlock lock/unlock mismatch under heavy concurrent load | Open | High | `fastlock.cpp:295`, 560+ clients, active replication; x86_64 report; also affects riscv64 C fallback path |
| [#972](https://github.com/Snapchat/KeyDB/issues/972) | maxmemory eviction fails under large datasets; unbounded memory growth | Open | High | Architecture-agnostic correctness bug |
| [#975](https://github.com/Snapchat/KeyDB/issues/975) | Off-by-one global buffer overflow in `RM_RegisterClusterMessageReceiver` | Open | High | Correctness/security; architecture-agnostic |
| [#923](https://github.com/Snapchat/KeyDB/issues/923) | Project effectively abandoned by Snap Inc. | Open | Organizational | Community concern; no maintainer response to recent issues |
| [#977](https://github.com/Snapchat/KeyDB/issues/977) | "Project is died?" | Open | Organizational | No maintainer response as of Jul 2026 |

Issue #975 (buffer overflow) is a correctness/security bug that affects all architectures including riscv64.

---

## 12. Objections and Upstream Blockers

**Technical blockers:** None that prevent a functional riscv64 build. KeyDB compiled and ran on four unnamed riscv64 boards as of November 2022 with no architecture-specific work. The build system automatically disables the x86 ASM spinlock on non-x86 hosts.

**Organizational blockers:**
- Snap Inc. has no production use of RISC-V. The project exists to serve Snap's x86-64 and ARM64 server infrastructure. There is no internal driver for a riscv64 port.
- The project may be in maintenance-only or wind-down status as of mid-2026 (issues #923, #977). The probability of Snap merging new architecture-support PRs is unknown, but the lack of maintainer responses to open issues reduces confidence.
- No formal tier policy means there is no defined acceptance path for a new architecture tier.

**Stated objections:** None recorded. No maintainer has explicitly rejected RISC-V support. The absence of any response to the RISC-V benchmarking issue (#517) beyond a single comment about benchmark methodology indicates indifference rather than active rejection.

**Acceptance probability for a riscv64 port PR:** Moderate-to-low given the apparent reduction in maintainer activity. A minimal, non-invasive PR (adding riscv64 to CI, adding the Zihintpause spin hint, adding the riscv64 crash dump handler) has the highest acceptance probability. A PR requiring significant architectural changes would likely be deprioritized.

---

## 13. Investment Analysis

RISE has done zero work on KeyDB for riscv64. All areas below represent net-new work.

### 13.1 Functional Enablement

The riscv64 build already works via the generic POSIX codepath (confirmed Nov 2022). No functional enablement work is needed to achieve a working binary. The gaps are: (1) missing crash register dump handler in `debug.cpp`, and (2) `HAVE_ATOMIC` not set in `config.h` for riscv64.

The crash dump handler is a 20-30 line addition to `debug.cpp` mirroring the aarch64 pattern against `uc_mcontext.__gregs` (or the riscv64 Linux ucontext layout). This is low-effort, high-value for production deployments.

The `HAVE_ATOMIC` gap requires understanding which runtime paths it gates before determining if enabling it for riscv64 is safe. [NEEDS VERIFICATION on runtime impact.]

The OpenSSL constant-time issue (TLS) is an upstream OpenSSL problem, not a KeyDB problem. It should be addressed in the OpenSSL report, not here.

### 13.2 Performance Optimization

Two targeted optimizations are meaningful:

1. **Spin-hint in fastlock.cpp:** Add `#elif defined(__riscv)` branch with `__asm__ __volatile__ ("fence iorw,0")` or the Zihintpause `pause` pseudo-instruction. This mirrors the aarch64 `yield` addition. 1-2 person-days. Impact: reduced power and interconnect traffic under lock contention.

2. **Prefetch on GET/SET hot path (db.cpp):** Extend the `_mm_prefetch` block with a riscv64 path using `__builtin_prefetch`. The aarch64 gap (no prefetch) already limits AArch64 relative to x86; adding riscv64 parity with aarch64 is straightforward. 1-2 person-days.

RVV SIMD for lz4 and zstd is upstream work in those projects, not in KeyDB itself.

### 13.3 CI/CD Infrastructure

Adding riscv64 to the public GitHub Actions CI requires either a QEMU `binfmt_misc` emulation job or a self-hosted riscv64 runner. QEMU emulation via `docker/setup-qemu-action` is the lowest-friction path and is used by other projects (PyTorch, RocksDB). A build-only riscv64 job would confirm compilation continues to work on each PR.

A full test suite run on QEMU riscv64 is slow (KeyDB's test suite involves server startup and Redis protocol testing) but feasible. Estimated: 2-3 person-weeks including CI debugging, test isolation for QEMU-specific timing issues, and upstream PR process.

### 13.4 Ecosystem Enablement

KeyDB has no significant dependent package ecosystem on the server side. The PyPI `keydb` package is a Python client library (pure Python, architecture-neutral). No riscv64-specific ecosystem work is needed.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Add riscv64 crash register dump handler to `debug.cpp` | 0.5 | Community contributor + Snap review | High |
| Functional | Verify and enable `HAVE_ATOMIC` for riscv64 in `config.h` | 0.5 | Community contributor + Snap review | Medium |
| Performance | Add Zihintpause spin-hint to `fastlock.cpp` riscv64 path | 0.5 | Community contributor + Snap review | Medium |
| Performance | Add `__builtin_prefetch` to GET/SET hot path for riscv64 in `db.cpp` | 0.5 | Community contributor + Snap review | Low |
| CI/CD | Add QEMU riscv64 build job to `.github/workflows/ci.yml` | 1 | Community contributor + Snap review | High |
| CI/CD | Add QEMU riscv64 test job (full suite) | 2 | Community contributor + Snap review | Medium |
| Functional | OpenSSL constant-time AES-GCM (TLS security gap) | See `project-reports/openssl.md` | OpenSSL upstream | High (if TLS required) |

**Total KeyDB-specific work:** approximately 5 person-weeks, excluding OpenSSL.

**Risk factor:** Snap Inc. maintainer responsiveness is the primary risk. If the project is in wind-down, PRs may not be reviewed. The low per-item effort means a contribution could be made and left open with minimal sunk cost if Snap does not merge it.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Snapchat/KeyDB GitHub repository](https://github.com/Snapchat/KeyDB)
- [KeyDB documentation homepage](https://docs.keydb.dev/)
- [Issue #517: KeyDB performance factors (RISC-V benchmarking)](https://github.com/Snapchat/KeyDB/issues/517)
- [Issue #923: Community concern about project abandonment](https://github.com/Snapchat/KeyDB/issues/923)
- [Issue #924: Crash from fastlock lock/unlock mismatch](https://github.com/Snapchat/KeyDB/issues/924)
- [Issue #972: maxmemory eviction failure under large datasets](https://github.com/Snapchat/KeyDB/issues/972)
- [Issue #975: Off-by-one buffer overflow in RM_RegisterClusterMessageReceiver](https://github.com/Snapchat/KeyDB/issues/975)
- [Issue #977: Project maintenance status question](https://github.com/Snapchat/KeyDB/issues/977)
- [concurrentqueue issue #453: tbss linker error on riscv64 with GCC 8.1](https://github.com/cameron314/concurrentqueue/issues/453)
- [concurrentqueue issue #452: unit tests for riscv64](https://github.com/cameron314/concurrentqueue/issues/452)
- [lz4 PR #1678: RVV vectorization](https://github.com/lz4/lz4/pull/1678)
- [lz4 PR #1734: RVV vectorization](https://github.com/lz4/lz4/pull/1734)
- [lz4 PR #1738: RVV vectorization](https://github.com/lz4/lz4/pull/1738)
- [zstd issue #4622: 4-way fast decompression loop not enabled on riscv64](https://github.com/facebook/zstd/issues/4622)
- [KeyDB benchmarking documentation](https://docs.keydb.dev/docs/benchmarking/)
- [Debian package tracker - keydb (404, not packaged)](https://tracker.debian.org/pkg/keydb)
- [Arch Linux RISC-V mirror - keydb search](https://archriscv.felixc.at/?q=keydb)
- [PyPI keydb package](https://pypi.org/project/keydb/)
- [RISE Project homepage](https://riseproject.dev/)
- [GitHub releases - Snapchat/KeyDB](https://github.com/Snapchat/KeyDB/releases)