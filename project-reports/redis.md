---
title: Redis
parent: Project Reports
color: orange
dependencies:
  - name: jemalloc
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: Lua
    relation: runtime-dependency
    criticality: critical
  - name: xxHash
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: optional
  - name: Tcl
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="redis" %}

# Redis

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Redis<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[Redis](https://redis.io/) is an in-memory data structure store used as a database, cache, and message broker. The canonical upstream repository is [redis/redis](https://github.com/redis/redis). The active development branch is `unstable`; stable releases ship from versioned branches. Latest release as of this report is 8.10.2 (2026-09-17).

Redis is controlled by **Redis Ltd.** (formerly Redis Labs), a private company. There is no independent foundation, no GOVERNANCE.md, no MAINTAINERS/CODEOWNERS/OWNERS file, and no TSC. Governance is informal: CONTRIBUTING.md states major changes need "an acknowledgment from the project leaders" (Redis Ltd. staff) before community work begins; minor fixes can go straight to PR. Contributors sign a Redis Software Grant and Contributor License Agreement assigning broad rights to Redis Ltd.

**License history:**

| Period | License |
|---|---|
| Redis 1.0 - 7.2 (through early 2024) | BSD 3-Clause |
| Redis 7.4+ (March 2024) | RSALv2 or SSPLv1 (dual, non-OSI) |
| Redis 8.0+ (2025+) | RSALv2 / SSPLv1 / AGPLv3 (tri-license, user's choice) |

The March 2024 relicensing was contentious and is why the Linux Foundation-backed [Valkey](https://github.com/valkey-io/valkey) fork exists as a separate, foundation-governed, BSD-licensed alternative. Redis itself remains outside any foundation.

**Corporate maintainers (by commit volume, inferred from email domain since no MAINTAINERS file exists):** Salvatore "antirez" Sanfilippo (creator, 7,188 commits all-time, independent since leaving Redis Ltd. around 2020, returned as outside contributor in 2026); Redis Ltd. employees dominate recent activity (debing.sun@redis.com "sundb", yuan.wang@redis.com, filipe@redis.com, jonathan.keinan@redis.com, hristo.staykov@redis.com, oran@redislabs.com, guy.benoish@redislabs.com, itamar@redislabs.com); Amazon/AWS (madolson, also a Valkey TSC member); Alibaba (zhaozhao.zz@alibaba-inc.com).

**RISE membership:** Redis is confirmed **not** listed among RISE Project members. RISE's Premier tier (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and General tier (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) do not include Redis Ltd.

**Community culture on new ports:** No formal platform-tier policy exists (unlike, e.g., Rust's tiered-platform system). New CPU-architecture support (RISC-V, LoongArch) is accepted organically through ordinary community PRs once functionally justified and reviewed, with no dedicated port-approval process, RFC track, or named port maintainer.

---

## 2. Port History and Upstreaming Timeline

Redis is portable ANSI C; it ran on RISC-V via scalar fallback paths before any RISC-V-specific code existed. The timeline below covers architecture-specific optimization and portability work only.

| Date | Event | Source |
|---|---|---|
| 2023-06-27 | First RISC-V-specific commit `ef4bb4e` ("Add RISC-V debug support", #12349) by michalbiesek: adds crash-backtrace register access in `src/debug.c` | [commit](https://github.com/redis/redis) |
| 2025-08-14 | [PR #14251](https://github.com/redis/redis/pull/14251) merged: `USE_PROCESSOR_CLOCK` RISC-V `mtime` CSR monotonic clock, tested on Sophgo SG2042, ~2.78x faster than POSIX clock | GitHub PR |
| 2025-09-26 | [Issue #14383](https://github.com/redis/redis/issues/14383) opened: "Performance improvement plans for Redis under RISC-V?" - still unanswered as of 2026-10-01 | GitHub issue |
| 2025-10-11 | [PR #14342](https://github.com/redis/redis/pull/14342) merged: SipHash unaligned access via Zicclsm, GCC >=14.1.0, +65.5% hashing throughput on SG2044. Supersedes closed [PR #14166](https://github.com/redis/redis/pull/14166) (unconditional unaligned access, closed by author 2025-10-15 after maintainer sundb objected that not all RISC-V cores support unaligned access) | GitHub PR |
| 2025-11-18 | #14251 and #14342 ship in Redis 8.4.0 (confirmed by `git merge-base --is-ancestor`; neither is an ancestor of the earlier 8.2.0/8.2.1 tags) | Release tag ancestry |
| 2026-01-05 | [PR #14660](https://github.com/redis/redis/pull/14660) opened: riscv64 QEMU build+smoke-test CI job. Still open, zero maintainer engagement as of 2026-10-01 | GitHub PR |
| 2026-05-14 | [PR #15204](https://github.com/redis/redis/pull/15204) opened: BITCOUNT Zbb `cpop` popcount, +288% throughput / -74% latency on SG2044. Still open, no reviewer comments | GitHub PR |
| 2026-05-27 | [PR #15273](https://github.com/redis/redis/pull/15273) opened: HyperLogLog RVV vectorization for PFCOUNT/PFMERGE. Still open, no reviewer comments | GitHub PR |
| 2026-08-26 | [PR #15710](https://github.com/redis/redis/pull/15710) merged (commit `b1b5c85`): routes monotonic-clock fallback diagnostics through `serverLog` instead of stderr on the shared x86/aarch64/riscv init path. Merged but **not yet shipped in any tagged release** as of 2026-10-01 (not an ancestor of 8.10.1/8.10.2; next minor, e.g. 8.12.0, not yet cut) | GitHub PR / git ancestry |
| 2026-09-14 | [PR #15785](https://github.com/redis/redis/pull/15785) and [PR #15786](https://github.com/redis/redis/pull/15786) opened: Zbc and Zvbc accelerated CRC64 for RDB/AOF. Both open, unmerged | GitHub PR |
| 2026-09-24 | [PR #15858](https://github.com/redis/redis/pull/15858) (SipHash Zbb build/runtime dispatch) and [PR #15859](https://github.com/redis/redis/pull/15859) (monotonic clock mulhu reciprocal) opened. Both open, each blocked by Bugbot-flagged bugs (see Section 11) | GitHub PR |

**No master tracking issue or riscv64-port umbrella issue exists.** Issue #14383 is the closest candidate but is an unanswered user question, not a roadmap. All RISC-V work is tracked as a series of independent, author-driven PRs.

**Contributors:** huangzhengx (email domain sanechips.com.cn, Sanechips being ZTE's semiconductor subsidiary; tested on Sophgo SG2042; authored #14251 and the earlier, closed #14166), Polaris-911 (email domain zte.com.cn, authored the merged #14342), ww8191201-coder (authored the two newest, as-yet-unmerged #15858 and #15859), anuphalarnkar (authored CI PR #14660, validated locally on x86_64 via Docker+QEMU/binfmt), michalbiesek (first-ever riscv commit, 2023, debug support). The primary reviewer and merger for accepted RISC-V work is **sundb** (debing.sun@redis.com), a Redis org member. **fcostaoliveira** has been requested as reviewer on multiple PRs but has not substantively engaged with any of them.

---

## 3. Upstream Support Tier

No PLATFORMS.md, SUPPORT.md, or architecture-tier policy document exists in the repository. README.md states only: "Redis can be compiled and used on Linux, OSX, OpenBSD, NetBSD, FreeBSD. We support big endian and little endian architectures, and both 32-bit and 64-bit systems," with Solaris-derived systems marked best-effort only. No CPU-architecture tier list is published.

RISC-V has no formal support tier. It is a community-contributed target with zero upstream CI coverage and zero Redis Ltd. ownership of the port.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build/test | Every PR (`ubuntu-latest`) | Every PR, native (`ubuntu-24.04-arm`) | None |
| Official Docker platform | Yes | Yes | Yes (image-level, not CI-validated by Redis's own pipeline) |
| Documented minimum toolchain | Implicit (GCC/Clang unspecified) | Implicit | Implicit; GCC >=14.1.0 needed only to activate the Zicclsm SipHash path |
| SIMD/vector acceleration | AVX2/AVX512 (bitops, HLL) | NEON (bitops, HLL) | None merged (RVV HLL/popcount PRs open, unmerged) |
| Formal tier designation | None (de facto primary) | None (de facto primary) | None |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Redis has no `arch/riscv/` directory, no `.S` assembly files for RISC-V, and no JIT backend (Redis has no JIT at all in core - this is not comparable to V8/LuaJIT). All RISC-V-specific code is inline `#ifdef __riscv` guards within shared source files, confirmed by direct source reads of commit `b540ca49cba815f3fbe634363c3df68d4f4f127a`.

**Files touching each architecture (`src/*.c`):**

| Arch | Files with arch-specific code |
|---|---|
| x86_64 | 8: bitops.c, crccombine.c, crcspeed.c, debug.c, hyperloglog.c, lzf_c.c, monotonic.c, siphash.c |
| aarch64 | 5: bitops.c, debug.c, hyperloglog.c, monotonic.c, siphash.c |
| riscv64 | 3: debug.c, monotonic.c, siphash.c |

`src/Makefile`'s `uname_M` arch-detection block has entries for aarch64/arm/Darwin-arm64 but **no riscv64 entry at all**; riscv64 silently falls through to the generic Linux path. `src/config.h` defines `HAVE_AVX2`, `HAVE_AVX512`, `HAVE_AARCH64_NEON` - there is no `HAVE_RISCV_*` of any kind on the current default branch.

### Component-by-component detail

**Monotonic clock (`src/monotonic.c`, PR #14251, merged 2025-08-14).** Gated on `defined(USE_PROCESSOR_CLOCK) && defined(__riscv) && defined(__linux__)`. Reads the RISC-V `time` CSR directly via inline assembly (`asm volatile("csrr %0, time" : "=r"(val));`), with tick rate computed from `/proc/device-tree/cpus/timebase-frequency` (handles both 32-bit big-endian and 64-bit encodings). Benchmark on Sophgo SG2042, 10M iterations: 286,378 us (RISC-V path) vs. 794,999 us (POSIX `clock_gettime`) - **~2.78x faster**. No ISA extension beyond base `__riscv` CSR read. Complete and functional, but `USE_PROCESSOR_CLOCK` is **not enabled by default for riscv64**, unlike AArch64 where the equivalent clock path is default-on.

**SipHash unaligned access (`src/siphash.c` line 72, PR #14342, merged 2025-10-11).** Extends the `UNALIGNED_LE_CPU` fast-path condition to RISC-V when `__riscv_zicclsm` is defined (requires GCC >=14.1.0 to expose the macro). Zicclsm (misaligned load/store capability) is mandatory under the RVA20U64 profile. Benchmark on SG2044, 10 runs x 10M hashes: 6,482,733 hashes/sec -> 10,732,524 hashes/sec, **+65.5%**. This is a one-line, complete conditional - nothing further is needed here.

**Crash backtraces / register dump (`src/debug.c`).** Two `#elif defined(__riscv)` branches: PC extraction via `uc_mcontext.__gregs[REG_PC]`, and a full 32-register integer dump (ra, gp, tp, t0-t6, s0-s11, a0-a7) logged via `serverLog`. No ISA extension used. **Full parity** with x86_64/aarch64 - genuine, complete support, not a stub.

**xxHash RVV implementation (`deps/xxhash/xxhash.h`, vendored dependency, not Redis-authored).** Direct source inspection of the vendored copy shows a **complete, production RVV 1.0 vector implementation**, not a placeholder: `XXH3_accumulate_512_rvv`, `XXH3_scrambleAcc_rvv`, and `XXH3_initCustomSecret_rvv` using `vsetvl_e64m2`, `vle64_v_u64m2`, `vxor_vv_u64m2`, `vsrl_vx_u64m2`, `vand_vx_u64m2`, `vrgather_vv_u64m2`, `vmacc_vv_u64m2`, `vadd_vv_u64m2`, `vmul_vx_u64m2`, `vse64_v_u64m2`, version-gated on `__riscv_v_intrinsic >= 1000000` with a compatibility shim for pre/post-1.0 intrinsic naming. This is wired into the dispatch when `__riscv_vector` is defined. This full RVV path is auto-selected by compiler predefined macros, with no explicit Redis build flag required.

**CRC64 (`src/crc64.c`/`src/crcspeed.c`).** No `__riscv` guard anywhere in these files currently - scalar table-driven only, identical to x86_64/aarch64 (neither of which has hardware CRC acceleration in Redis either). PRs #15785 (Zbc) and #15786 (Zvbc) would add RISC-V-specific acceleration here, which would put riscv64 **ahead** of x86_64/aarch64 on this specific operation if merged, but neither is merged.

**Bitops/popcount (`src/bitops.c`) and HyperLogLog (`src/hyperloglog.c`).** x86_64 has full AVX2 (`__m256i`) plus AVX512/VPOPCNTDQ with runtime CPU dispatch; aarch64 has full NEON (`vcntq_u8`/`uint8x16_t`) dispatch. riscv64 has **zero code in either file today** - falls through to `__builtin_popcountll` scalar / scalar HLL merge. PR #15204 (Zbb `cpop`) and PR #15273 (RVV) would close these gaps; both open, unmerged.

**jemalloc `quantum.h` (vendored).** Sets `LG_QUANTUM 4` (16-byte allocation quantum) for `__riscv`/`__riscv__`, matching other 64-bit architectures - one-line allocator-alignment constant, not algorithmic logic.

| Component | amd64 | arm64 | riscv64 (merged) | riscv64 (if open PRs merge) |
|---|---|---|---|---|
| Monotonic clock | Full (TSC), default-on | Full (`cntvct_el0`), default-on | Full (`csrr time`), **opt-in only** | Full, opt-in only |
| SipHash unaligned access | Full | Full | Full (Zicclsm, GCC >=14.1.0) | Full |
| Crash/debug register dump | Full | Full | Full | Full |
| CRC64 | Scalar | Scalar | Scalar | Zbc/Zvbc accelerated (2.2x-9.6x) |
| BITCOUNT popcount | AVX512/AVX2/scalar dispatch | NEON | Missing (scalar fallback) | Zbb `cpop` |
| HyperLogLog dense merge | AVX2 | NEON | Missing (scalar fallback) | RVV |
| xxHash (vendored dep) | SSE2/AVX2/AVX512 | NEON/SVE | **RVV, complete** | (already complete) |
| CI verification | Every PR | Every PR | None | None (CI PR #14660 separate and stalled) |

---

## 5. Build System, Cross-Compilation, and Toolchain

Redis core builds via GNU Make (`src/Makefile`/top-level `Makefile`). There is **no root `CMakeLists.txt`** for core; CMake appears only inside vendored `deps/hiredis` (generic, no arch-specific options) and in separately-repositoried bundled modules pulled in via `make modules-update`. No `BUILDING.md`, no `docs/building.md`, no `docs/cross-compilation.md` exist - README.md is the only build documentation and does not mention riscv/riscv64 anywhere. No `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake` exists; no `cmake/` directory exists at all outside `deps/hiredis`. `src/Makefile` has no `CROSS_COMPILE` variable.

### Native build (riscv64 Linux)

```sh
make -j$(nproc) BUILD_TLS=yes
```

The Makefile auto-detects `uname -m` at build time; no `ARCH=` flag is required or supported.

### Cross-compilation

No official cross-compilation documentation exists anywhere in the repository. A side-effect path exists via ordinary Make `CC`/`CXX` overriding combined with the Debian packaging convention:

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

When `DEB_HOST_GNU_TYPE` is set, `deps/Makefile` passes `--host=$(DEB_HOST_GNU_TYPE)` to jemalloc's configure script. `MALLOC=libc` bypasses jemalloc entirely and is the safer cross-compile option. This path is not documented or maintained by upstream; it is inferred from Makefile mechanics, not a tested/supported riscv64 flow.

### Toolchain requirements

No riscv64-specific minimum compiler version is documented or enforced in code beyond the Zicclsm detection. General (architecture-agnostic) requirements for the full `make bootstrap` build per README.md: LLVM 21, CMake 3.25 <= version <= 3.31.6 (CMake 4.x unsupported, used only for bundled modules), Rust 1.94, OpenSSL, Python 3. These apply uniformly regardless of target architecture.

- **GCC >=14.1.0** is required only to expose the `__riscv_zicclsm` preprocessor macro that activates the SipHash unaligned-access optimization (PR #14342). Older toolchains build correctly but without this optimization.
- **Rust 1.94** is required for `BUILD_WITH_MODULES=yes`. `modules/Makefile`'s Rust-toolchain installer case statement recognizes only `x86_64` and `aarch64` and exits with an error for any other architecture. **`BUILD_WITH_MODULES=yes` cannot be used on riscv64 without patching `modules/Makefile`.** This blocks RedisJSON, RediSearch, RedisBloom, and RedisTimeSeries on riscv64.

### Docker

The only Dockerfile in the repository is `docker/Dockerfile.noble` (Ubuntu 24.04), explicitly built as `linux/amd64`/`linux/arm64` only via `docker buildx build --platform linux/amd64,linux/arm64`, because the `ubuntu:24.04` base image's published multi-arch manifest does not include riscv64. This Dockerfile cannot currently target riscv64 without substantial changes. No `.ci/docker/` directory and no `Dockerfile.riscv64` exist.

### CI/build YAML sweep

No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.travis.yml` exists at the repository root. The only QEMU mentions anywhere in the tree are unrelated to riscv64 build/test: generic jemalloc `pages.c`/`ChangeLog` comments about QEMU `madvise` behavior, a generic xxhash Makefile comment about running `make check` under QEMU user-mode for any cross-compiled target, and `deps/hiredis`'s own separate CI, which cross-compiles/tests arm/aarch64 under QEMU (`qemu-arm`, `qemu-aarch64`), not riscv64.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 (merged, current) | riscv64 (if open PRs merge) |
|---|---|---|---|---|
| Monotonic clock | Full, default-on | Full, default-on | Full, opt-in only | Full, opt-in only |
| SipHash unaligned access | Full | Full | Full (Zicclsm) | Full, with optional Zbb dispatch |
| CRC64 (RDB/AOF checksums) | Scalar | Scalar | Scalar | Zbc/Zvbc accelerated, 2.2x-9.6x |
| BITCOUNT popcount | Full (AVX512/AVX2/scalar) | Partial (NEON) | Scalar only | Partial (Zbb `cpop`) |
| HyperLogLog vectorization | Full (AVX2) | Partial (NEON) | Scalar only | Partial (RVV) |
| xxHash (bundled) | SSE2/AVX2/AVX512 | NEON/SVE | **Full (RVV, complete)** | (already complete) |
| CI coverage | Full | Full | None | None (gated on separate, stalled CI PR) |
| Modules (JSON, Search, Bloom, TimeSeries) | Full | Full | Broken (Rust installer gap) | Broken (same gap, untouched by any open PR) |

**Functional gaps:** `BUILD_WITH_MODULES=yes` cannot build on riscv64 at all without patching `modules/Makefile` - this is a hard functional blocker, not a performance gap.

**Performance gaps:** BITCOUNT-style operations and HyperLogLog dense-register merge run scalar on riscv64 today versus hand-tuned SIMD on amd64/arm64; both have ready, unmerged PRs. CRC64 is scalar on all three architectures currently (no architecture has hardware CRC acceleration merged), so riscv64 is not behind here, though two PRs (#15785/#15786) would put it ahead if merged.

**Security hardening / correctness:** No riscv64-specific NaN/floating-point semantics issues were found in Redis's own code. The one correctness-relevant item is a Bugbot-flagged critical bug in open PR #15859 (not merged): the reciprocal-multiply monotonic-clock path divides by zero / wraps to zero when `mono_ticksPerMicrosecond == 1` (1 MHz mtime timebases, e.g. SiFive boards), which would make `getMonotonicUs_riscv` always return 0 and break elapsed-time waits and event-loop timers on that hardware. This has not reached any shipped release.

---

## 7. CI/CD Infrastructure

**No riscv64 CI exists in redis/redis, confirmed by multiple independent methods:** GitHub code search (`search_code` for "riscv" scoped to `path:.github/workflows`: 0 matches) and, more authoritatively, a direct shallow clone (HEAD `b540ca49cba815f3fbe634363c3df68d4f4f127a`, branch `unstable`) with `grep -rniI "riscv|qemu|rv64|risc-v|risc_v" .github/workflows/`: **zero matches** across all 10 workflow files present (`ci.yml`, `codecov.yml`, `codeql-analysis.yml`, `coverity.yml`, `daily.yml`, `external.yml`, `modules-build-flow.yml`, `post-release-automation.yml`, `reply-schemas-linter.yml`, `spell-check.yml`). No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.travis.yml` exists at the repository root (equivalent files found only inside vendored `deps/jemalloc` and `deps/hiredis`, which are third-party dependency CI, unrelated to Redis's own pipeline).

The CI matrix covers `ubuntu-latest` (x86_64), `ubuntu-24.04-arm` (native ARM64, no emulation), and `macos-latest`; `modules-build-flow.yml`'s matrix is `arch: [x64, arm64]` only. No riscv64 runner and no QEMU step exist anywhere in Redis's own CI.

[PR #14660](https://github.com/redis/redis/pull/14660) ("CI: add riscv64 QEMU build+smoke test job") would add a GitHub Actions job cross-compiling Redis for riscv64 and running a lightweight smoke test (PING, SET/GET, graceful shutdown) under QEMU user-mode, with the full test suite explicitly excluded to keep the job fast under emulation. It has been open since 2026-01-05 with **zero maintainer review** - only the CLA Assistant and a security-scanning bot have commented. This is the one PR that would most directly change Redis's riscv64 readiness grade if merged, and it has had no engagement for roughly nine months as of this report.

All RISC-V testing behind the merged optimization PRs was performed by contributors on physical hardware (Sophgo SG2042, SG2044, Spacemit X100/K3, C920) reported in PR descriptions, not validated by any upstream CI run. Reviewer ShooterIT noted on PR #14251: "i don't have RISC CPU, can't verify it" - no Redis maintainer is known to have RISC-V hardware access.

The RISE Project's free native riscv64 CI runners (Scaleway EM-RV1 hardware) have been available since March 2026. Redis has not adopted them, has no RISE membership, and receives no RISE blog coverage of its own CI/testing needs (see Section 10).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build on every PR | Yes | Yes | No |
| Test on every PR | Yes | Yes | No |
| Runner type | GitHub-hosted | GitHub-hosted, native | None (proposed: QEMU, PR #14660, stalled) |

---

## 8. Distribution and Release Status

Redis upstream publishes **source tarballs only** on GitHub releases, for every architecture. Confirmed directly against the two most recent releases via the GitHub `expanded_assets` endpoint: **8.10.2** assets = `redis-full.tar.gz`, `Source code (zip)`, `Source code (tar.gz)`; **8.8.3** assets = `8.8.3.zip`, `8.8.3.tar.gz`. No "riscv" string in any filename for either release - this is expected and not a negative signal, since no architecture gets prebuilt binaries from upstream GitHub releases.

**Debian/Ubuntu (confirmed via multiple independent, authoritative channels):**
- Launchpad API (`api.launchpad.net`, official Canonical JSON API): `redis-server 5:8.0.5-1 in resolute riscv64`, status "Published", published 2025-12-30. This directly confirms Ubuntu 26.04 ("resolute") ships riscv64 `redis-server` via Ubuntu Ports.
- `packages.ubuntu.com` filtered to `arch=riscv64`/`suite=resolute` additionally confirms `redis-tools` and `redis-sentinel` at the same `5:8.0.5-1` version (all `[ports]`, i.e. built via Ubuntu Ports rather than the primary archive), plus the architecture-independent (`all`) `redis` metapackage.
- `ports.ubuntu.com/pool/universe/r/redis/` (raw package-pool directory listing): riscv64 `.deb` builds for `redis-server`, `redis-sentinel`, `redis-tools` exist continuously from version `5.0.7-2` (2020) through the current `8.0.6-3`.
- Debian sid ships `5:8.0.6-2` for riscv64.

**Docker:** The official `redis` library image's manifest list (confirmed via the Docker Hub v2 API against `library/redis:latest`) includes a `riscv64`/`linux` platform entry alongside `amd64`, `arm64`, `ppc64le`, `s390x`, `386`, `arm/v7`, `arm/v5`. A community `riscv64/redis` Docker Hub image also exists independently.

**What determines whether a distro build requires riscv64-specific source patches versus building vanilla upstream source unmodified was not verified in this research** - this is the key open question that governs whether Redis sits at yellow (clean distro build) or orange (downstream-only, patch status unknown) on the readiness scale; see Section 13.

**PyPI:** `redis-py` (latest 8.1.0) is a pure-Python package (`py3-none-any` wheel) - architecture-independent by construction, so it installs natively on riscv64 regardless of upstream RISC-V status. This is not a meaningful riscv64-specific signal either way. The RISE GitLab wheel-builder mirror for `redis` returns an HTTP 302 redirect to the real PyPI simple index, indicating RISE has no custom/overriding build for this package and simply proxies upstream.

**Arch Linux riscv64:** Prior reporting indicated Redis was absent from the Arch RISC-V package set [NEEDS VERIFICATION - not re-confirmed in this research pass; `archriscv.felixc.at` returned no usable content on retry].

---

## 9. Dependencies

Redis has no CMakeLists.txt/setup.py/go.mod/Cargo.toml/package.json at the top level; it is a GNU-Make C project whose real dependency manifest is the `deps/` submodule directory plus a small set of build/test toolchain requirements.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes / blocking issues |
|---|---|---|---|---|---|
| **jemalloc** | runtime-dependency, critical - default memory allocator on Linux (`MALLOC=jemalloc`) | Builds cleanly; confirmed via Launchpad that jemalloc 5.3.0-4 builds `libjemalloc2`/`libjemalloc-dev` for riscv64 in Ubuntu 26.04 "resolute." Only one arch-specific file in jemalloc itself (`quantum.h`'s `LG_QUANTUM` branch), no hand-tuned spinwait/VA-width paths | Zero riscv64 CI in jemalloc's own 7 GitHub workflows plus `.travis.yml` | Debian sid, Ubuntu 24.04/26.04 ship `libjemalloc2`/`libjemalloc-dev` for riscv64 | [jemalloc#2399](https://github.com/jemalloc/jemalloc/issues/2399) open 3+ years, no maintainer response (cross-build docs gap); [jemalloc#2323](https://github.com/jemalloc/jemalloc/issues/2323) closed "completed" but no traceable fix commit found, contradicted by an August 2026 HPC paper stating jemalloc "does not support RISC-V." **Not a practical Redis blocker**: Redis's own cross-compile guidance recommends `MALLOC=libc` to sidestep jemalloc's `--host` cross-compile gap entirely. |
| **OpenSSL** | runtime-dependency, optional - TLS transport when `BUILD_TLS=yes` | Confirmed via Ubuntu 26.04 "resolute": openssl 3.5.5-1ubuntu3 builds for riscv64. Extensive hand-written riscv64 crypto assembly (AES-Zkn/Zvkned, SHA-256/512-Zbb/Zvk, GHASH, Montgomery multiply, SM2/SM3/SM4) - the most mature riscv64 dependency in this set | CI builds **and runs** riscv64 tests on every PR (QEMU, 13-leg extension matrix) plus a nightly native-hardware job (`os-zoo.yml`) | Debian sid/trixie, Ubuntu 26.04, Arch RISC-V (98.3% built) all ship it | [openssl#20980](https://github.com/openssl/openssl/issues/20980) open, security: AES scalar fallback is not constant-time without Zkn/Zvkned, fix PRs #31080/#31082 unmerged; [openssl#30330](https://github.com/openssl/openssl/issues/30330): `rv64i_zkne_set_encrypt_key` null-key logic is backwards, affecting TLS builds on Zkne-capable toolchains - this is the one dependency bug that could reach Redis in production when `BUILD_TLS=yes`; [openssl#28118](https://github.com/openssl/openssl/issues/28118): Zbb detection broken under musl. |
| **Lua** | runtime-dependency, critical - `EVAL` scripting engine, bundled in `deps/lua` (vanilla PUC-Rio Lua 5.1, not LuaJIT) | Pure ISO C99, zero arch-specific code (`#ifdef __riscv` = 0 hits in `deps/lua`). Debian sid `lua5.4` 5.4.8-2 builds for riscv64; Ubuntu 26.04/resolute status for Lua specifically was not independently re-confirmed this session (only 24.04 Noble was checked in prior research) | No riscv64 CI anywhere for lua/lua (none exists for any architecture); distro buildd is the only signal, and it is green | Debian sid, Ubuntu 24.04 ship it; 26.04 status: data not re-verified | None. Critically, Redis deliberately uses vanilla Lua, **not LuaJIT** - LuaJIT itself has zero official RISC-V support ([LuaJIT#628](https://github.com/LuaJIT/LuaJIT/issues/628), open since October 2020; community fork plctlab/LuaJIT PR #1267 unmerged since September 2024). Because Redis never links LuaJIT, this JIT-backend gap is not inherited by Redis. |
| **xxHash** | runtime-dependency, optional - non-cryptographic hashing, bundled in `deps/xxhash` | Ubuntu 26.04/resolute universe pocket ships `xxhash`/`libxxhash0`/`libxxhash-dev` 0.8.3-2build1 for riscv64 (scalar only - see discrepancy note below). **Redis's own vendored copy of `deps/xxhash/xxhash.h`, however, already contains a complete RVV 1.0 vector implementation** (see Section 4) | xxHash's own CI runs full `make check` for riscv64 scalar and RVV (QEMU) on every push/PR | Ubuntu 26.04 riscv64 ships 0.8.3 (scalar); RVV merged upstream via [xxHash PR #1043](https://github.com/Cyan4973/xxHash/pull/1043) (2025-06-16) but not yet in a tagged release (v0.8.3, December 2024, predates it) | **Discrepancy noted**: the standalone xxHash project's own tagged/distro-packaged releases are scalar-only for riscv64, while Redis's vendored copy already carries the full RVV path - these are two different code snapshots and the difference is expected, not contradictory, once the vendoring timeline is accounted for. No functionally blocking issues; perf-only concerns include unvectorized XXH32/64 on RVV and a ~300x streaming-unaligned regression (no issue filed), plus [xxHash#870](https://github.com/Cyan4973/xxHash/issues/870) (strict-alignment, open since 2023). |
| **GCC** | build-dependency, critical | No riscv64-specific minimum version is documented anywhere in the repository; general build requirements apply uniformly regardless of architecture. GCC >=14.1.0 is required specifically to expose the `__riscv_zicclsm` macro that activates the SipHash unaligned-access optimization (PR #14342); older GCC builds correctly without that optimization | N/A (toolchain, not a tested artifact) | N/A | None blocking; version requirement is optimization-specific, not build-blocking. |
| **GNU make** | build-dependency, critical | Redis core builds via GNU Make exclusively (`src/Makefile`/top-level `Makefile`); no riscv64-specific build-system documentation exists (confirmed: no BUILDING.md, no docs/cross-compilation.md) | N/A | N/A | None found. |
| **Rust** | build-dependency, optional - required only for `BUILD_WITH_MODULES=yes` (Redis 8.x modules: JSON, Search, Bloom, TimeSeries) | **Hard-blocked on riscv64**: `modules/Makefile`'s Rust-toolchain installer case statement recognizes only `x86_64` and `aarch64` and exits with error for any other architecture. Confirmed directly from repository source, re-confirmed in multiple research passes. Rust 1.94 is the general version requirement from README.md | N/A | N/A | This is the single clearest functional blocker for riscv64 module builds; requires a patch to `modules/Makefile` to add riscv64 to the installer's architecture list. |
| **Tcl** | test-dependency, critical - Redis's test suite (`runtest`) is written in Tcl | Data not available: no research into Tcl's riscv64 build/packaging status was conducted in this research session | Data not available | Data not available | Data not available: this dependency was not independently investigated. |

**Additional indirect/bundled dependencies found via research** (pure C, no architecture-specific code, no known riscv64 blocking issues): **hiredis** (bundled C client library used by `redis-cli`/Sentinel internals; generic portable C; no dedicated riscv64 CI; listed in `projects.yml` but has no independent riscv64-readiness report), **HdrHistogram_c** (latency-percentile data structure, pure C, no SIMD), **linenoise** (CLI line-editing), **fpconv** (double-to-string conversion), **tre** (POSIX regex). All five are bundled in `deps/` and build as ordinary portable C with no `#ifdef __riscv` guards found in any of them.

---

## 10. Ecosystem Status

Redis carries a dependent-package ecosystem on two fronts that must separately clear riscv64: (a) **official Redis Ltd. modules** (RedisJSON, RediSearch, RedisBloom, RedisTimeSeries), gated behind `BUILD_WITH_MODULES=yes`, and (b) **client libraries** across languages (redis-py, hiredis, etc.).

**Modules ecosystem:** Entirely blocked on riscv64 today due to the `modules/Makefile` Rust-installer gap described in Section 9 - none of RedisJSON/RediSearch/RedisBloom/RedisTimeSeries can currently be built for riscv64 through the documented `BUILD_WITH_MODULES=yes` path. No official riscv64 container image exists for any of these modules.

**Client library ecosystem:** `redis-py` (PyPI `redis`, latest 8.1.0) is a pure-Python package shipping a `py3-none-any` wheel - architecture-independent, installs on riscv64 with no porting work required. `hiredis` (C client, also used internally by Redis itself) has no dedicated riscv64 CI and was not found to have any riscv64-specific build failures reported.

**RISE Project engagement:** Redis is not a RISE member, receives no RISE funding, and is not covered by any RISE blog post as a subject in its own right. A systematic search of the RISE blog index found exactly **one** passing mention of Redis across all posts: the 2026-08-18 post ["PyTorch is available on riscv64!"](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/), which describes "a custom sccache Redis-based coordinator to leverage the multiple machines which may rebuild PyTorch concurrently on a cold-cache." This is Redis used as **internal CI infrastructure** for RISE's own PyTorch build-cache coordination (endpoint referenced in the `riseproject-dev/pytorch-ci` repo README), not a benchmarked workload and not funded porting work. Redis does not appear among the ~80 packages on RISE's Python wheel-builder page (`riseproject.gitlab.io/python/wheel_builder/`). The RISE GitLab wheel mirror for the `redis` PyPI package has no custom build and redirects to real PyPI.

The `riseproject-dev/sw-ecosystem` repository (RISE's own community tracking project, not an official RISE deliverable) maintains independent RISC-V-readiness assessment reports covering the broader Redis-family (`redis.md`, `redis_exporter.md`, `redisbloom.md`, `redisjson.md`, `redistimeseries.md`, `redisearch.md`, plus the Valkey/KeyDB forks) as unfunded community tracking, not RISE-sponsored engineering.

**Conclusion:** No RISE-funded or RISE-sponsored Redis RISC-V porting work exists. RISE's only direct relationship with Redis is as a private infrastructure component for its own CI.

---

## 11. Known Bugs and Active Issues

| Item | Type | Status | Impact |
|---|---|---|---|
| [PR #15859](https://github.com/redis/redis/pull/15859) - mulhu reciprocal divide-by-zero | Correctness bug (Bugbot-flagged, critical) | Open, unmerged, unreviewed | Reciprocal expression wraps to zero when `mono_ticksPerMicrosecond == 1` (1 MHz mtime timebases, e.g. SiFive boards); `getMonotonicUs_riscv` would always return 0, breaking elapsed-time waits and event-loop timers on that hardware |
| [PR #15858](https://github.com/redis/redis/pull/15858) - SipHash Zbb dispatch, 2 open Bugbot issues | Correctness/build bugs | Open, unmerged, unreviewed | (1) High severity: the dispatch macro is applied only when compiling `siphash.o`, so `initServer` (compiled separately) never sees it - the Zbb probe call is never compiled into the running binary, making the dispatch dead code; (2) Medium severity: `REDIS_SIPHASH_RUNTIME` is not tracked in `.make-settings`, so a rebuild without the flag leaves `siphash.o` referencing undefined `siphash_zbb` symbols, causing a link failure |
| [PR #15204](https://github.com/redis/redis/pull/15204) - BITCOUNT Zbb popcount | Performance gap | Open, awaiting review since 2026-05-14 | BITCOUNT falls to scalar on riscv64; +288% throughput / -74% latency available pending merge |
| [PR #15273](https://github.com/redis/redis/pull/15273) - HyperLogLog RVV | Performance gap | Open, awaiting review since 2026-05-27 | PFCOUNT/PFMERGE fall to scalar on riscv64 |
| [PR #15785](https://github.com/redis/redis/pull/15785) / [PR #15786](https://github.com/redis/redis/pull/15786) - CRC64 Zbc/Zvbc | Performance gap | Open, unreviewed since 2026-09-14 | CRC64 (RDB/AOF checksums) scalar on riscv64; 2.2x-9.6x speedup available pending merge |
| [PR #14660](https://github.com/redis/redis/pull/14660) - riscv64 QEMU CI job | Infrastructure gap | Open, zero maintainer engagement since 2026-01-05 | Correctness regressions on riscv64 are invisible to upstream CI |
| `USE_PROCESSOR_CLOCK` opt-in only on riscv64 | Usability gap | No tracking issue | AArch64 gets the hardware clock by default; riscv64 requires an explicit `-DUSE_PROCESSOR_CLOCK` build flag, undocumented in release notes |
| `BUILD_WITH_MODULES=yes` broken on riscv64 | Build blocker | No tracking issue | `modules/Makefile`'s Rust installer exits with error for riscv64; JSON, RediSearch, RedisBloom, RedisTimeSeries unavailable |
| No riscv64 CI | Coverage gap | No tracking issue (PR #14660 pending) | Correctness regressions on riscv64 are not caught by upstream CI |
| [openssl#30330](https://github.com/openssl/openssl/issues/30330) - `rv64i_zkne_set_encrypt_key` correctness (upstream dependency) | Correctness bug | Open in OpenSSL repo | Affects TLS builds (`BUILD_TLS=yes`) with Zkne-capable toolchains; null-key logic reversed |

No open correctness or crash bugs specific to riscv64 were found directly in the redis/redis issue tracker as of this report (targeted searches for "riscv64 bug", "riscv nan/floating/double", "riscv crash/segfault/fail" each returned zero additional RISC-V-specific results). All current RISC-V correctness concerns are confined to the two newest, unmerged, Bugbot-flagged PRs above.

---

## 12. Objections and Upstream Blockers

**Reviewer bandwidth is the primary bottleneck.** Six RISC-V PRs are open simultaneously (#15858, #15859, #15785, #15786, #15273, #15204) with essentially no maintainer engagement; the CI PR (#14660) has had zero maintainer response for roughly nine months. The assigned reviewer fcostaoliveira has been requested on multiple PRs and has not substantively responded to any of them. sundb is the only maintainer who has actively reviewed and merged RISC-V work to date.

**No maintainer has RISC-V hardware.** Stated explicitly by reviewer ShooterIT during PR #14251 review ("i don't have RISC CPU, can't verify it"). All riscv64 correctness validation depends on contributor-run benchmarks reported in PR descriptions; there is no CI backstop (Section 7).

**Established review precedent requires explicit ISA-extension gating.** The closed, unmerged PR #14166 (unconditional unaligned-access enablement) was rejected by sundb specifically because "not all RISC-V supports non-aligned memory access... those that do not support it will raise an exception." The author could not provide runtime version detection when asked and closed the PR rather than resolve it; the superseding #14342 added the Zicclsm build-time gate sundb required, and that version merged. This precedent is now the implicit review bar for every subsequent RISC-V PR (#15858/#15785/#15786/#15204/#15273), and the newest two PRs (#15858, #15859) are each blocked by a single Bugbot-identified correctness/build bug rather than a design disagreement - they appear mechanically close to mergeable but have no human review yet.

**`BUILD_WITH_MODULES=yes` is an undocumented blocker.** `modules/Makefile`'s hard-coded Rust-toolchain architecture list is not documented anywhere in the Redis RISC-V contribution history and would only be discovered during a build attempt.

**The `USE_PROCESSOR_CLOCK` asymmetry is a latent performance surprise.** A deployment expecting AArch64-equivalent clock behavior on riscv64 silently gets the slower POSIX path unless the build flag is set explicitly; this is undocumented in release notes or build guides.

**No master tracking issue or roadmap exists.** Issue #14383 ("Performance improvement plans for Redis under RISC-V?") has been open and unanswered since 2025-09-26. Nothing in the repository links the six open RISC-V PRs to each other or to any coordinating issue.

**No RISE engagement to accelerate review.** Redis is not a RISE member and has not adopted RISE's free riscv64 CI runners, which would directly address the CI gap (#14660) without requiring Redis Ltd. to purchase or maintain RISC-V hardware.

---

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

Redis has zero upstream riscv64 CI: confirmed by both GitHub code search and a direct clone-and-grep of all 10 GitHub Actions workflow files, with no "riscv" string, no QEMU riscv64 step, and no `.gitlab-ci.yml`/`Jenkinsfile`/`.cirrus.yml` equivalent anywhere in the repository. The one CI PR that would add riscv64 coverage, [#14660](https://github.com/redis/redis/pull/14660), is open and unmerged, stalled since 2026-01-05 with zero maintainer engagement. The distribution floor applies because Ubuntu 26.04 "resolute" ships `redis-server`/`redis-tools`/`redis-sentinel` 5:8.0.5-1 for riscv64 via Ubuntu Ports (confirmed via both `packages.ubuntu.com` and the Launchpad API), and Debian sid ships 5:8.0.6-2 - but whether these distro builds require riscv64-specific source patches versus building vanilla upstream source unmodified was never verified in this research. Per the readiness methodology's rule that an unknown patch status upgrades the grade to orange, this lands at **orange/downstream-only** rather than yellow/clean-distro-build. Upstream itself publishes source tarballs only, with no riscv64-specific release assets, so the release provider is the distro, not upstream.

Redis is a general-purpose in-memory data store, cache, and broker, not a speed-differentiated optimization library, so the optimization-purpose modifier does not apply to this grade (optimization_gap: not applicable) even though several RISC-V performance PRs (Zbb/Zbc/RVV for SipHash, CRC64, popcount, HyperLogLog) are currently open and unmerged.

**Pending work that could change the grade:**
- [#15858](https://github.com/redis/redis/pull/15858) (SipHash Zbb) - 2 open Bugbot blockers (dead dispatch code; build-state loss)
- [#15859](https://github.com/redis/redis/pull/15859) (monotonic mulhu reciprocal) - Bugbot-flagged critical divide-by-zero at 1 MHz timebases
- [#15785](https://github.com/redis/redis/pull/15785) / [#15786](https://github.com/redis/redis/pull/15786) (CRC64 Zbc/Zvbc)
- [#15273](https://github.com/redis/redis/pull/15273) (HyperLogLog RVV)
- [#15204](https://github.com/redis/redis/pull/15204) (BITCOUNT Zbb popcount)
- [#14660](https://github.com/redis/redis/pull/14660) (riscv64 QEMU build+smoke CI) is the single PR most likely to directly move the color toward yellow/build-only-CI if merged, but has zero maintainer engagement since 2026-01-05.
- No master tracking issue exists; [#14383](https://github.com/redis/redis/issues/14383) is an unanswered question thread, not a roadmap.
- Redis is not a RISE member, receives no RISE funding or blog coverage of its own, and has not adopted RISE's free riscv64 CI runners.
- Separately (does not affect the CI-based color but matters for module users): `BUILD_WITH_MODULES=yes` is hard-blocked on riscv64 because `modules/Makefile`'s Rust installer only supports x86_64/aarch64.

---

## 14. Investment Analysis

Before sizing any work: RISE has not funded or engineered any Redis RISC-V work. Its only touchpoint with Redis is using it as internal build-cache infrastructure for its own CI (Section 10). None of the work below is already covered by RISE.

### 14.1 Functional Enablement

The core Redis server builds and runs on riscv64 today via the Make-based build system and distro packaging, with no functional blocker for a non-module build. The one hard functional blocker is `BUILD_WITH_MODULES=yes`, which blocks RedisJSON, RediSearch, RedisBloom, and RedisTimeSeries. Fixing this requires patching `modules/Makefile` to add riscv64 to the Rust-installer architecture case statement, which in turn requires either a pre-installed riscv64 Rust toolchain or an upstream contribution extending the modules build support matrix.

### 14.2 Performance Optimization

Two merged PRs (monotonic clock, SipHash unaligned access) provide concrete, measured gains in Redis 8.4+. Six PRs are currently open, representing a substantial, ready-to-engage queue: #15785/#15786 (CRC64, up to 9.58x on 128 KiB buffers), #15204 (BITCOUNT, +288% throughput), #15273 (HyperLogLog RVV), and #15858/#15859 (SipHash Zbb dispatch, monotonic clock reciprocal), the latter two each requiring a small, well-scoped bug fix (dispatch macro propagation; divide-by-zero guard at 1 MHz timebases) before they are mergeable. Engaging sundb or fcostaoliveira directly to review and fix these six PRs would have outsized impact relative to the reviewer time required, since the implementation work is largely already done by external contributors.

### 14.3 CI/CD Infrastructure

The absence of any riscv64 CI is the single largest structural gap and the primary driver of the orange grade. Every other gap is a performance or usability issue; the CI gap means correctness regressions on riscv64 (such as the #15859 divide-by-zero bug) are invisible to the project until a downstream user hits them. PR #14660 already implements a minimal riscv64 QEMU build+smoke-test job; it needs review and merge engagement, not new implementation work. RISE's free native riscv64 runners (Scaleway EM-RV1, available since March 2026) could host a fuller test job at no hardware cost to Redis Ltd. once the smoke-test job is merged.

### 14.4 Ecosystem Enablement

Redis itself is adequately distributed on riscv64 through Ubuntu Ports, Debian sid, and official Docker multi-arch images. The gap is upstream project ownership and CI validation of the port, not user-facing binary availability. The modules ecosystem (JSON/Search/Bloom/TimeSeries) is entirely blocked pending the `modules/Makefile` Rust-installer fix in 14.1.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Patch `modules/Makefile` to support riscv64 in the Rust toolchain installer | 1 | Qualcomm / upstream PR | Critical |
| CI/CD | Review, fix, and merge PR #14660 (riscv64 QEMU build+smoke CI job) | 1 (review/fix coordination) | Qualcomm (liaison) / upstream | Critical |
| Performance | Fix and unblock PR #15859 (resolve Bugbot divide-by-zero bug) | 0.5 | Qualcomm / upstream PR | High |
| Performance | Fix and unblock PR #15858 (resolve 2 Bugbot dispatch/build-state bugs) | 1 | Qualcomm / upstream PR | High |
| Performance | Unblock PR #15204 (BITCOUNT Zbb popcount) via reviewer engagement | 0.5 (coordination) | Qualcomm (liaison) | High |
| Performance | Unblock PR #15273 (HyperLogLog RVV) via reviewer engagement | 0.5 (coordination) | Qualcomm (liaison) | High |
| Performance | Unblock PR #15785/#15786 (CRC64 Zbc/Zvbc) via reviewer engagement | 0.5 (coordination) | Qualcomm (liaison) | Medium |
| Performance | Make `USE_PROCESSOR_CLOCK` default-on for riscv64 (matching AArch64 behavior) | 0.5 | Qualcomm / upstream PR | Medium |
| CI/CD | Extend riscv64 CI beyond smoke test to full suite, using RISE native runners | 3 | Qualcomm + RISE | High |
| Distribution | Verify whether Ubuntu/Debian riscv64 builds carry source patches vs. vanilla upstream, to resolve the orange-vs-yellow grade uncertainty | 0.5 | Qualcomm | Medium |
| Ecosystem | Document riscv64 build procedure in README.md / CONTRIBUTING.md | 1 | Qualcomm / upstream PR | Low |

---

## 15. References

- [redis/redis repository](https://github.com/redis/redis)
- [Issue #14383 - Performance improvement plans for Redis under RISC-V?](https://github.com/redis/redis/issues/14383)
- [PR #12349 - Add RISC-V debug support](https://github.com/redis/redis) (first RISC-V commit, 2023-06-27)
- [PR #14251 - USE_PROCESSOR_CLOCK for RISC-V](https://github.com/redis/redis/pull/14251)
- [PR #14342 - Unaligned access optimizations for RISC-V with Zicclsm](https://github.com/redis/redis/pull/14342)
- [PR #14166 - Enable UNALIGNED_LE_CPU for RISC-V (closed, superseded)](https://github.com/redis/redis/pull/14166)
- [PR #14660 - CI: add riscv64 QEMU build+smoke test job](https://github.com/redis/redis/pull/14660)
- [PR #15204 - RISC-V Zbb popcount support (open)](https://github.com/redis/redis/pull/15204)
- [PR #15273 - HyperLogLog RVV vectorization (open)](https://github.com/redis/redis/pull/15273)
- [PR #15710 - Route monotonic clock fallback diagnostics through serverLog (merged, not yet released)](https://github.com/redis/redis/pull/15710)
- [PR #15785 - RISC-V: add Zbc-accelerated crc64 (open)](https://github.com/redis/redis/pull/15785)
- [PR #15786 - RISC-V: add Zvbc vector crc64 (open)](https://github.com/redis/redis/pull/15786)
- [PR #15858 - SipHash RISC-V Zbb build knobs and runtime dispatch (open)](https://github.com/redis/redis/pull/15858)
- [PR #15859 - monotonic: mulhu reciprocal for RISC-V mtime conversion (open)](https://github.com/redis/redis/pull/15859)
- [Debian buildd status for redis](https://buildd.debian.org/status/package.php?p=redis)
- [Ubuntu package search - Redis, resolute, riscv64](https://packages.ubuntu.com/search?keywords=Redis&suite=resolute&searchon=names&section=all&arch=riscv64)
- [Ubuntu Ports package pool - redis](https://ports.ubuntu.com/pool/universe/r/redis/)
- [Launchpad - redis-server in resolute riscv64](https://launchpad.net/ubuntu/resolute/riscv64/redis-server)
- [Docker Hub - official redis image](https://hub.docker.com/_/redis)
- [riscv64/redis - community Docker image](https://hub.docker.com/r/riscv64/redis/)
- [Arch Linux RISC-V status](https://archriscv.felixc.at/.status/status.htm)
- [jemalloc issue #2323 - riscv64gc support](https://github.com/jemalloc/jemalloc/issues/2323)
- [jemalloc issue #2399 - riscv64 cross-build](https://github.com/jemalloc/jemalloc/issues/2399)
- [OpenSSL issue #20980 - AES scalar fallback not constant-time](https://github.com/openssl/openssl/issues/20980)
- [OpenSSL issue #30330 - rv64i_zkne_set_encrypt_key correctness bug](https://github.com/openssl/openssl/issues/30330)
- [OpenSSL issue #28118 - Zbb detection broken under musl](https://github.com/openssl/openssl/issues/28118)
- [xxHash PR #1043 - RVV 1.0 vector implementation](https://github.com/Cyan4973/xxHash/pull/1043)
- [xxHash issue #870 - strict-alignment](https://github.com/Cyan4973/xxHash/issues/870)
- [LuaJIT issue #628 - no official RISC-V support](https://github.com/LuaJIT/LuaJIT/issues/628)
- [RISE Project - PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISC-V International / PerfXLab - Database Adaptation Evaluation On RISC-V Server](https://riscv.org/blog/risc-v-public-beta-platform-release-%C2%B7-database-adaptation-evaluation-on-risc-v-server/)
- [Valkey fork (Linux Foundation)](https://github.com/valkey-io/valkey)