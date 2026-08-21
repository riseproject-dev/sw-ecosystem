---
title: Dragonfly
---

# Dragonfly

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for Dragonfly<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Dragonfly is a Redis- and Memcached-compatible in-memory datastore written in C++20, designed as a drop-in replacement with a shared-nothing thread-per-core architecture. It uses the `helio` async I/O framework (`romange/helio`, Apache 2.0) as its foundation, which provides coroutine scheduling via Boost.Fiber and io_uring.

**License:** [Business Source License 1.1 (BSL 1.1)](https://github.com/dragonflydb/dragonfly/blob/main/LICENSE.md) with DragonflyDB, Ltd. as licensor. Change Date: November 1, 2030, converting to Apache 2.0. The BSL explicitly prohibits use as a competing in-memory datastore service. This is source-available, not open source.

**Governance:** No foundation membership. No MAINTAINERS, OWNERS, or CODEOWNERS file. Not a member of the RISE project. Governed entirely by DragonflyDB, Ltd. (privately held, Israeli startup). Roman Gershman (ex-Google, ex-AWS) is the creator and primary maintainer and also owns the `romange/helio` dependency.

**Core committers:**

| Contributor | GitHub | Affiliation | Commits |
|---|---|---|---|
| Roman Gershman | romange | DragonflyDB (founder) | 1,689 |
| Vladislav | dranikpg | Unaffiliated | 620 |
| Volodymyr Yavdoshenko | vyavdoshenko | DragonflyDB | 369 |
| Borys | BorysTheDev | Unaffiliated | 373 |
| Kostas Kyrimis | kostasrim | Unaffiliated | 465 |
| Shahar Mike | chakaz | DragonflyDB | 254 |

**Community culture on new ports:** No documented architecture tier policy. The single RISC-V PR was merged without friction, suggesting portability patches following the established `#ifdef __riscv` pattern are accepted. No community-driven port initiative exists. RISC-V enablement depends entirely on external contributor patches given the commercial backing and BSL licensing.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-09-05 | PR #3655 opened in dragonflydb/dragonfly by @howjmay (Yang Hau, independent, Tainan, Taiwan); companion helio PR #313 opened same day | [PR #3655](https://github.com/dragonflydb/dragonfly/pull/3655) |
| 2024-09-05 | romange identifies that `sse2rvv.h` is absent from helio; requires upstream helio PR first | [PR #3655 review](https://github.com/dragonflydb/dragonfly/pull/3655) |
| 2024-09-06 | howjmay confirms RVV intrinsics require GCC 14; explains why no CI was added | [helio PR #313](https://github.com/romange/helio/pull/313) |
| 2024-09-08 | helio PR #313 merged by romange (adds `base/sse2rvv.h`, 3,760 lines, MIT) | [helio PR #313](https://github.com/romange/helio/pull/313) |
| 2024-09-12 | dragonfly PR #3655 merged (SHA `35c70db`); adds 2-line include shim in `src/core/sse_port.h` | [PR #3655](https://github.com/dragonflydb/dragonfly/pull/3655) |
| 2024-09-25 | Shipped in Dragonfly v1.23.0 | [Discussion #3788](https://github.com/dragonflydb/dragonfly/discussions/3788) |
| 2026-08 | No further RISC-V PRs, issues, or commits; current release is v1.40.1 | [dragonflydb/dragonfly releases](https://github.com/dragonflydb/dragonfly/releases) |

The entire RISC-V contribution was made by a single first-time contributor with no DragonflyDB affiliation. It is fully upstreamed but represents minimal scope: 2 lines in `sse_port.h` plus a dependency addition in helio. No follow-on work has occurred in the 11 months since merge.

---

## 3. Upstream Support Tier

No formal tier policy is documented anywhere in the repository. CONTRIBUTING.md covers code style, GPG signing, and conventional commits; it says nothing about architecture tiers or supported platforms.

**Effective tier by evidence:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage | Full (ubuntu-latest, ubuntu-dev:24) | Full (ubuntu-24.04-arm, CI-LARGE-ARM) | None |
| Official binary release | Yes (.deb, .rpm, .tar.gz, .x86_64) | Yes (.deb, .tar.gz, aarch64) | No |
| Docker image | linux/amd64 | linux/arm64 | No |
| Release-blocking | Yes | Yes | N/A |
| Compiler tested | GCC 14 (release), GCC default (CI) | GCC 14 | None tested |

riscv64 is an untested, best-effort tier with no official support policy. The helio maintainer (romange) asked whether RISC-V CI was possible during the PR review; the answer from the contributor was that RVV intrinsics require GCC 14, which was not available on GitHub Actions riscv64 runners at that time. No CI was added, and none has been added since.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Dragonfly has no JIT compiler, no GC barriers, and no hand-written assembly files (confirmed: no `.S` files in the repository, no `arch/riscv/` directory). Architecture-specific code is limited to SIMD acceleration paths.

**SIMD components:**

| Component | File | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| SSE/SIMD translation layer | `src/core/sse_port.h` | Native (emmintrin.h) | Full (sse2neon.h, 9,415 lines, 7 TODOs) | Partial (sse2rvv.h, 3,760 lines, 17 TODOs including known broken float rounding in 8 intrinsics and a known memory error in `vreinterpretq_m64_u16`) |
| Hash table movemask (`SimdOp::GetMSBs()`) | `src/core/simd_op.h` | Hand-tuned AVX2 (`_mm256_movemask_pd`) | Hand-tuned NEON (`vshrn_n_u64`) | Scalar fallback (C bit-extract loop; no RVV path) |
| ASCII 7-bit string packing | `src/core/detail/bitpacking.cc` | SSE3 intrinsics | aarch64 NEON intrinsics | Scalar fallback (no RVV path) |

**sse2rvv.h quality assessment:** The ARM64 equivalent (`sse2neon.h`) is 2.5x larger by line count (9,415 vs 3,760 lines) and has 7 TODO/FIXME entries vs 17 in `sse2rvv.h`. Known issues in `sse2rvv.h` include 8 entries marked `FIXME riscv round doesn't work` (float rounding intrinsics), one `FIXME vreinterpretq_m64_u16 would trigger memory error`, and one `FIXME sth wrong with __riscv_vredminu_vs_u16m1_u16m1_m()`. These are correctness defects in the translation shim itself.

**ISA extension requirements:** RVV (RISC-V Vector Extension) is required for the SIMD paths. GCC 14 or later is required for RVV intrinsics (per the contributor's own statement referencing [GCC 14 release notes](https://gcc.gnu.org/gcc-14/changes.html)).

**Hash table hot path impact:** `SimdOp::GetMSBs()` is used in the `OAHSet` (open-addressing hash set) hot path. On riscv64 it falls through to a scalar bit-shift loop. For workloads that are hash-table bound, this represents a direct performance regression vs. arm64 and amd64.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Normal build (amd64/arm64):**
```bash
sudo apt install ninja-build libunwind-dev libboost-context-dev libssl-dev \
     autoconf-archive libtool cmake g++ bison zlib1g-dev
git clone --recursive https://github.com/dragonflydb/dragonfly && cd dragonfly
./helio/blaze.sh -release
cd build-opt && ninja dragonfly
```

**Hard blocker for riscv64:** `helio/cmake/internal.cmake` at the pinned submodule commit has an exhaustive architecture dispatch that issues `FATAL_ERROR "Unsupported architecture riscv64"` for any processor not in {aarch64, x86_64, amd64, arm64, s390x}. Building natively on a riscv64 host fails at CMake configure time unless `-DMARCH_OPT="-march=rv64gc"` (or `-march=rv64gcv`) is passed explicitly.

**Hypothetical native riscv64 build command** [NEEDS VERIFICATION - untested]:
```bash
./helio/blaze.sh -release \
  -DMARCH_OPT="-march=rv64gcv" \
  -DWITH_AWS=OFF -DWITH_GCP=OFF \
  -DWITH_GPERF=OFF -DWITH_TIERING=OFF \
  -DWITH_SEARCH=OFF -DWITH_SIMSIMD=OFF
```

**Compiler requirements:**
- C++20 required for Dragonfly layer (`set(CMAKE_CXX_STANDARD 20)` in `CMakeLists.txt`)
- C++17 required for helio layer
- GCC or Clang only (helio issues `FATAL_ERROR` for any other compiler)
- GCC 14 required for RVV intrinsics (per contributor, [GCC 14 release notes](https://gcc.gnu.org/gcc-14/changes.html))
- CI release builds use `ubuntu-dev:20-gcc14` image (GCC 14 pinned)

**Cross-compilation:** No cross-compilation toolchain file exists (`cmake/riscv64.cmake` - not found). No QEMU usage documented or used anywhere in the build system. No `qemu-user-static` setup in any CI workflow or Dockerfile.

**Known build failures on riscv64:**
1. CMake configure fails unless `-DMARCH_OPT` is set manually.
2. mimalloc v2.2.4 (pinned) predates RISC-V TLS and SV39/SV48 hwprobe fixes (see Section 9).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core key-value operations | Full | Full | Full (scalar) |
| Hash table (OAHSet) movemask SIMD | AVX2 hand-tuned | NEON hand-tuned | Scalar fallback |
| ASCII string packing (bitpacking.cc) | SSE3 | NEON | Scalar fallback |
| SSE intrinsic translation layer | Native | sse2neon (mature) | sse2rvv (partial, known bugs) |
| Snapshot compression (LZ4, zstd) | Scalar + SIMD (upstream) | Scalar + SIMD (upstream) | Scalar (RVV PRs unmerged upstream) |
| TLS / OpenSSL | Full + assembly | Full + assembly | Builds; AES not constant-time without Zkn |
| Profiling (gperftools) | Full (with libunwind) | Stack trace non-functional | Stack trace non-functional (helio CMake guards x86_64-only libunwind path) |
| Official binary distribution | Yes | Yes | No |
| Docker image | Yes | Yes | No |
| CI validation | Yes | Yes | No |

**Float rounding correctness gap:** 8 SSE float rounding intrinsics in `sse2rvv.h` are marked `FIXME riscv round doesn't work`. Any Dragonfly code path that invokes those intrinsics (via the helio SIMD layer) may produce incorrect results on riscv64. The scope of affected code paths is not documented. This is a correctness risk, not merely a performance gap.

**Performance gaps (non-blocking):**
- Hash table hot path (OAHSet): scalar C fallback vs. hand-tuned SIMD on other arches.
- String compression: LZ4 and zstd run at generic scalar speeds; multiple upstream RVV optimization PRs are unmerged.
- AES encryption: non-constant-time without Zkn hardware (OpenSSL issue [#20980](https://github.com/openssl/openssl/issues/20980)); security implication for TLS-enabled deployments.

**No published benchmark data for riscv64.** All published Dragonfly throughput numbers (3.8M QPS SET on c6gn.16xlarge ARM64, 10M QPS pipeline mode) are x86 and ARM64 only. No riscv64 equivalents exist from DragonflyDB or any third party.

---

## 7. CI/CD Infrastructure

All 20 GitHub Actions workflow files and `.circleci/config.yml` were checked directly. The word "riscv" does not appear in any CI configuration file.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner | ubuntu-latest, ubuntu-dev:24 | ubuntu-24.04-arm, CI-LARGE-ARM (self-hosted) | None |
| Build test | Yes | Yes | No |
| Unit tests | Yes | Yes | No |
| Regression tests | Yes (regression-tests.yml) | Yes | No |
| Docker build | Yes (buildx, linux/amd64) | Yes (buildx, linux/arm64) | No |
| QEMU emulation | No | No | No |
| RISE runners | No | No | No |

No riscv64 CI runner, no QEMU-based emulation, no Docker buildx `linux/riscv64` target anywhere. The reason documented by the contributor: RVV intrinsics require GCC 14, which was not available on GitHub Actions riscv64 runners at the time of the RISC-V PR.

---

## 8. Distribution and Release Status

**GitHub release assets** (confirmed for v1.38.0, v1.38.1, v1.39.0, v1.40.0, v1.40.1):
- `dragonfly-x86_64.tar.gz`, `dragonfly-x86_64-dbgsym.tar.gz`
- `dragonfly-aarch64.tar.gz`, `dragonfly-aarch64-dbgsym.tar.gz`
- `dragonfly_amd64.deb`, `dragonfly_arm64.deb`, `dragonfly.x86_64.rpm`
- `dfly_bench-x86_64.tar.gz`, `dfly_bench-aarch64.tar.gz`

No riscv64 asset in any release.

**Docker images:** Multi-arch manifest covers `linux/amd64` and `linux/arm64` only. The `docker-release2.yml` workflow explicitly merges exactly two digest references. No `linux/riscv64` platform.

**Linux distribution packages:**
- Debian: HTTP 404 at [tracker.debian.org/pkg/dragonfly](https://tracker.debian.org/pkg/dragonfly). Not packaged.
- Ubuntu: Not packaged (a separate unrelated `dragonfly-reverb` audio plugin exists but is unrelated).
- Arch Linux RISC-V mirror ([archriscv.felixc.at](https://archriscv.felixc.at)): No results.
- PyPI: The `dragonfly` PyPI package is an entirely different speech-recognition library (v0.6.5, Windows only). dragonflydb is not on PyPI.

**To obtain a working riscv64 binary:** Build from source on a riscv64 host with GCC 14, manually overriding the MARCH_OPT CMake variable to bypass the `FATAL_ERROR` in helio's `internal.cmake`. No pre-built path exists.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking? |
|---|---|---|---|---|---|
| mimalloc v2.2.4 | Primary heap allocator | Partial | No CI | No | **Yes - hard blocker** |
| abseil-cpp 20250512.1 | Hash maps, strings, logging, CRC | Builds with `-latomic` | 2 test suites fail | No | Yes (test-level) |
| OpenSSL (system) | TLS for client connections | Builds | Partially failing | Available in distros | Performance/security gap |
| LZ4 v1.10.0 | Snapshot compression | Builds | No CI | Available in distros | No (performance gap only) |
| zstd v1.5.7 | Snapshot compression | Builds | No CI | Available in distros | No (performance gap only) |
| Boost.Context/Fiber (system) | Coroutine stack switching (helio proactor) | Builds | Passes in distros | Available in distros | No |
| liburing v2.13 | io_uring async I/O (helio I/O backend) | Builds | CI active (riscv64) | Available in distros | No |
| SimSIMD v6.5.3 | Vector distance kernels (WITH_SIMSIMD=OFF default) | Unknown | Unknown | Header-only | Conditionally (only if built with -DWITH_SIMSIMD=ON) |
| gperftools v2.18.1 | CPU profiler (optional, WITH_GPERF=ON) | Partial | Unknown | No riscv64 release | No (helio CMake guards x86_64-only libunwind path) |

**Critical dependency detail:**

**mimalloc v2.2.4 (hard blocker):** Dragonfly pins mimalloc at v2.2.4. The critical RISC-V SV39 aligned-memory fix (issue [#939](https://github.com/microsoft/mimalloc/issues/939)) and TLS support (PR [#1319](https://github.com/microsoft/mimalloc/pull/1319), merged 2026-07-07) are both in `dev3` only, not v2.2.4. On SV39 hardware (39-bit virtual address space, common on RISC-V Linux), the allocator may silently fall back to system alloc or corrupt heap metadata on large aligned allocations. The fix requires advancing the mimalloc pin to v2.2.7 or later, which requires rebasing Dragonfly's patches in `patches/mimalloc-v2.2.4/`. See `reports/mimalloc.md`.

**abseil-cpp (test-level blocker):** Issue [#2002](https://github.com/abseil/abseil-cpp/issues/2002) (open, 2026-02, last updated 2026-08-07) reports `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` fail on riscv64-linux-gnu. Issue [#1702](https://github.com/abseil/abseil-cpp/issues/1702) (open, 2024-07) reports linking error requiring `-latomic` for riscv64 cross-toolchain. A production build should work but the test suite will report failures. See `reports/abseil-cpp.md`.

**OpenSSL:** AES encryption is not constant-time without Zkn hardware extensions (issue [#20980](https://github.com/openssl/openssl/issues/20980)). This is a security concern for TLS-enabled Dragonfly deployments on hardware without Zkn. Build is not blocked. SSL test suite has known flakiness on riscv64 (issues [#22166](https://github.com/openssl/openssl/issues/22166), [#30880](https://github.com/openssl/openssl/issues/30880)). See `reports/openssl.md`.

**LZ4, zstd:** Both build on riscv64. Multiple unmerged upstream RVV optimization PRs exist for both: LZ4 PRs [#1678](https://github.com/lz4/lz4/pull/1678), [#1734](https://github.com/lz4/lz4/pull/1734), [#1738](https://github.com/lz4/lz4/pull/1738), [#1778](https://github.com/lz4/lz4/pull/1778); zstd PR [#4622](https://github.com/facebook/zstd/pull/4622). Dragonfly's snapshot performance will be limited to scalar throughput until these land. See `reports/lz4.md`, `reports/zstd.md`.

---

## 11. Known Bugs and Active Issues

**RISC-V-specific bugs:** Zero. No riscv64-labeled or riscv64-mentioning issues exist in the dragonflydb/dragonfly tracker.

**Known correctness issues in the sse2rvv shim** (from direct code inspection of `helio/base/sse2rvv.h`):

| Item | Location | Description | Severity |
|---|---|---|---|
| Float rounding | 8 intrinsics in sse2rvv.h | `FIXME riscv round doesn't work` | Correctness defect |
| Memory error | `vreinterpretq_m64_u16` in sse2rvv.h | `FIXME vreinterpretq_m64_u16 would trigger memory error` | Correctness defect |
| Vector reduction | `__riscv_vredminu_vs_u16m1_u16m1_m()` in sse2rvv.h | `FIXME sth wrong with` | Correctness defect |

**Active general correctness bugs** (not RISC-V-specific, P1 severity):

| Issue | Title | Severity |
|---|---|---|
| [#8071](https://github.com/dragonflydb/dragonfly/issues/8071) | Blocked multi-stream read returns only one stream when several become ready together | P1 |
| [#8070](https://github.com/dragonflydb/dragonfly/issues/8070) | Multi-stream XREADGROUP mutates group state and then returns an error | P1 |
| [#8069](https://github.com/dragonflydb/dragonfly/issues/8069) | Active expiry never runs for non-default namespaces | P1 |
| [#8068](https://github.com/dragonflydb/dragonfly/issues/8068) | NotifyPending() is reentrant through a suspending expiry checker | P1 |
| [#8067](https://github.com/dragonflydb/dragonfly/issues/8067) | Heterogeneous blocking queue can hide XREADGROUP forever | P1 |
| [#8128](https://github.com/dragonflydb/dragonfly/issues/8128) | Eviction deletes a key mid-full-sync before baseline is captured | Replication correctness |
| [#6787](https://github.com/dragonflydb/dragonfly/issues/6787) | SIGABRT crash during SAVE/backup on v1.36 | Crash |

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. helio `internal.cmake` `FATAL_ERROR` for riscv64 - requires `-DMARCH_OPT` override to build. The helio maintainer (romange) owns this file and would need to add riscv64 to the dispatch table for a clean build without workarounds.

2. mimalloc v2.2.4 pin - the pinned version predates the RISC-V TLS and SV39 hwprobe fixes. Advancing the pin requires rebasing `patches/mimalloc-v2.2.4/`.

3. No CI infrastructure for riscv64 - the maintainer's question during PR review ("do you know if it's possible to run tests on RISC-V on GitHub?") was unanswered in the affirmative at that time. This was the explicit reason no CI was added.

4. GCC 14 requirement for RVV intrinsics - standard distribution toolchains (Ubuntu 22.04 LTS ships GCC 11, Ubuntu 24.04 ships GCC 13) do not satisfy this requirement without manual toolchain installation.

5. `sse2rvv.h` correctness defects - 3 known FIXME-level bugs in float rounding, memory access, and vector reduction. These are in helio, not dragonfly proper, and require fixes upstream in `romange/helio`.

**Organizational blockers:**

BSL 1.1 licensing limits community contribution incentive for RISC-V chip vendors. Contributing engineering effort to a source-available commercial product with a prohibition on competing datastore services is a policy question for each contributor organization. This does not prevent contribution but narrows the pool of motivated contributors.

No stated objection to RISC-V from maintainers. PR #3655 was merged in 7 days with minimal review friction.

**Acceptance probability:** High for individual patches that follow the established pattern (CMake arch dispatch, CI config, SIMD optimization). The maintainer has already demonstrated willingness to merge RISC-V work.

---

## 13. Investment Analysis

RISE has no funded work on Dragonfly. The dependency reports referenced below cover some upstream work that is relevant but does not substitute for Dragonfly-specific enablement.

### 13.1 Functional Enablement

Three items are required before riscv64 builds succeed reliably:

1. Fix helio `internal.cmake` to add riscv64 to the architecture dispatch (eliminates `FATAL_ERROR`). Requires upstream PR in `romange/helio`.
2. Advance mimalloc pin from v2.2.4 to a version including the RISC-V TLS and SV39 hwprobe fixes (dev3 or v2.2.7+). Requires rebasing `patches/mimalloc-v2.2.4/`.
3. Fix or document workaround for abseil `-latomic` linking requirement on riscv64.

These are build correctness prerequisites; without them, riscv64 builds either fail at configure time or risk allocator instability at runtime.

### 13.2 Performance Optimization

1. Implement `SimdOp::GetMSBs()` using RVV intrinsics in `src/core/simd_op.h` (eliminates scalar fallback in hash table hot path). Requires GCC 14 and RISC-V hardware with V extension.
2. Implement RVV path in `src/core/detail/bitpacking.cc` for ASCII string packing (mirrors existing SSE3/NEON paths).
3. Fix the 3 known correctness defects in `helio/base/sse2rvv.h` (float rounding x8, memory error, vector reduction). These are upstream helio PRs.
4. Coordinate with LZ4 and zstd upstreams to land unmerged RVV optimization PRs (see dependency section).

### 13.3 CI/CD Infrastructure

1. Add riscv64 build job to `helio` CI (prerequisite: RISC-V GCC 14 runner available, e.g., RISE runners).
2. Add riscv64 build job to dragonfly CI (at minimum: compile check; test execution requires hardware or QEMU with RVV support).
3. Add `linux/riscv64` platform to Docker release workflow.

### 13.4 Ecosystem Enablement

Not applicable. Dragonfly is a server binary. It has no library SDK, no language package ecosystem, and no plugin/extension system that requires independent riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix helio `internal.cmake` FATAL_ERROR for riscv64 | 0.5 | helio upstream (romange) | Critical |
| Functional | Advance mimalloc pin past RISC-V TLS/SV39 fixes + rebase patches | 1 | DragonflyDB or contributor | Critical |
| Functional | Fix abseil `-latomic` linkage on riscv64 (issue #1702) | 0.5 | abseil upstream | Critical |
| Functional | Fix sse2rvv.h correctness defects (float rounding x8, memory error, vector reduction) | 2 | helio upstream (howjmay or contributor) | High |
| CI/CD | Add riscv64 build CI to helio and dragonfly | 1 | DragonflyDB or RISE | High |
| CI/CD | Add linux/riscv64 Docker image to release pipeline | 1 | DragonflyDB | Medium |
| Performance | RVV implementation of SimdOp::GetMSBs() (hash table hot path) | 2 | Contributor | High |
| Performance | RVV implementation of bitpacking.cc ASCII packing | 2 | Contributor | Medium |
| Performance | Land LZ4 upstream RVV PRs (4 open PRs) | 3 | LZ4 upstream (see reports/lz4.md) | Medium |
| Performance | Land zstd upstream RVV PR #4622 | 1 | zstd upstream (see reports/zstd.md) | Medium |

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [PR #3655: feat(core): Support RISCV RVV (dragonflydb/dragonfly)](https://github.com/dragonflydb/dragonfly/pull/3655)
- [helio PR #313: feat: Support RISC-V RVV (romange/helio)](https://github.com/romange/helio/pull/313)
- [Dragonfly commit 35c70db: feat(core): Support RISCV RVV](https://github.com/dragonflydb/dragonfly/commit/35c70db)
- [Dragonfly v1.23.0 release discussion #3788](https://github.com/dragonflydb/dragonfly/discussions/3788)
- [dragonflydb/dragonfly releases page](https://github.com/dragonflydb/dragonfly/releases)
- [Dragonfly vs Valkey 9.0 on AWS Graviton benchmark blog post](https://www.dragonflydb.io/blog/dragonfly-vs-valkey-90-on-aws-graviton-an-honest-head-to-head)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog (riseproject.dev)](https://riseproject.dev/category/blog/)
- [mimalloc RISC-V SV39 issue #939](https://github.com/microsoft/mimalloc/issues/939)
- [mimalloc RISC-V TLS PR #1319](https://github.com/microsoft/mimalloc/pull/1319)
- [mimalloc SV39 hwprobe PR #1299](https://github.com/microsoft/mimalloc/pull/1299)
- [abseil-cpp riscv64 test failures issue #2002](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp riscv64 -latomic linking issue #1702](https://github.com/abseil/abseil-cpp/issues/1702)
- [OpenSSL AES constant-time riscv64 issue #20980](https://github.com/openssl/openssl/issues/20980)
- [OpenSSL riscv64 SSL test failures issue #22166](https://github.com/openssl/openssl/issues/22166)
- [LZ4 riscv64 RVV PR #1678](https://github.com/lz4/lz4/pull/1678)
- [zstd riscv64 fast decompression loop PR #4622](https://github.com/facebook/zstd/pull/4622)
- [GCC 14 release notes (RVV intrinsics support)](https://gcc.gnu.org/gcc-14/changes.html)
- [Ubuntu packages search for dragonfly (Noble)](https://packages.ubuntu.com/search?keywords=Dragonfly&suite=noble&searchon=names&section=all)
- [Debian tracker for dragonfly (404 - not packaged)](https://tracker.debian.org/pkg/dragonfly)
- [Arch Linux RISC-V mirror](https://archriscv.felixc.at/?q=dragonfly)