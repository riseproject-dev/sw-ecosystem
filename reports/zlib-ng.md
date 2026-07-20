---
title: zlib-ng
categories:
  - libraries
---

# zlib-ng

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for zlib-ng
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

zlib-ng is a performance-oriented drop-in replacement for zlib, providing DEFLATE compression and decompression with architecture-specific SIMD acceleration and a modern C11 codebase. It supports both a "zlib-compat" ABI (direct replacement for libz.so) and a native ABI with extended capabilities.

**Governance:** Informal maintainer-led project. Single primary steward: Hans Kristian Rosbach ("Dead2"), reachable via circlestorm.org. No Linux Foundation, Apache, CNCF, or other foundation affiliation. No formal steering committee. All contributions flow through GitHub PRs; Dead2 holds merge authority and exercises it frequently (most RISC-V PRs merged within 1-14 days of submission).

**License:** zlib license (permissive, no copyleft).

**Corporate sponsors and contributors:** Intel contributed a full fork with deflate medium/quick algorithms. Cloudflare contributed optimization patches. Microsoft maintains the vcpkg port. SiFive engineers drove the initial RISC-V RVV optimization push in 2023. ByteDance contributed the ZBC CRC32 implementation in 2025. No formal corporate sponsorship structure; all contributions are individual PR-based.

**RISE project:** No involvement. The RISE project blog (riseproject.dev/blog) contains zero posts mentioning zlib-ng across all 27 posts from May 2024 through June 2026. zlib-ng is not listed on the RISE wheel builder (riseproject.gitlab.io/python/wheel_builder). No RISE working group covers zlib-ng.

**Community stance on new ports:** Accepting. All RISC-V work (20+ PRs since 2021) has been merged. No stated objections to RISC-V from maintainers. Dead2 consistently merges RISC-V PRs quickly and has overruled requests to delay on grounds of stability (e.g., PR #1999: merged critical RISC-V fix before 2.3 stable despite reviewer objections).

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the `develop` branch of [zlib-ng/zlib-ng](https://github.com/zlib-ng/zlib-ng). No downstream fork carries RISC-V patches out-of-tree.

| Date | Event | Source |
|------|-------|--------|
| 2021-05-06 | CMake arch detection fix: RISC-V 32 and 64 bit recognized; without this, SSE2 was incorrectly enabled | [PR #942](https://github.com/zlib-ng/zlib-ng/pull/942) |
| 2023-05-12 | First RISC-V CI: cross-compilation workflows added | [PR #1477](https://github.com/zlib-ng/zlib-ng/pull/1477) |
| 2023-06 | compare256 and slide_hash RVV optimizations | [PR #1498](https://github.com/zlib-ng/zlib-ng/pull/1498), [PR #1522](https://github.com/zlib-ng/zlib-ng/pull/1522) |
| 2023-07 | adler32 RVV optimization; 1.6-1.8x speedup on SiFive FPGA | [PR #1532](https://github.com/zlib-ng/zlib-ng/pull/1532) |
| 2023-10 | Runtime RVV detection via AT_HWCAP (kernel 6.5+) | [PR #1585](https://github.com/zlib-ng/zlib-ng/pull/1585) |
| 2023-11 | adler32_fold_copy_rvv | [PR #1597](https://github.com/zlib-ng/zlib-ng/pull/1597) |
| 2024-03 | uclibc build fix for riscv_features.c | [PR #1700](https://github.com/zlib-ng/zlib-ng/pull/1700) |
| 2024-08 | Improved RVV runtime detection | [PR #1770](https://github.com/zlib-ng/zlib-ng/pull/1770) |
| 2024-12 | adler32_rvv overflow fixes | [PR #1826](https://github.com/zlib-ng/zlib-ng/pull/1826) |
| 2025-01 | RVV workaround for compiler error G6E97C40B | [PR #1853](https://github.com/zlib-ng/zlib-ng/pull/1853) |
| 2025-03 | Fix SIGSEGV in chunkset_rvv CHUNKCOPY (signed/unsigned comparison bug) | [PR #1889](https://github.com/zlib-ng/zlib-ng/pull/1889) |
| 2025-03 | Replaced broken CI flow; added GCC and Clang Ubuntu cross-compile jobs | [PR #1890](https://github.com/zlib-ng/zlib-ng/pull/1890) |
| 2025-04 | CRC32 via Zbc extension (carry-less multiply); 4-8x speedup | [PR #1905](https://github.com/zlib-ng/zlib-ng/pull/1905) |
| 2025-05 | Bash configure script support for RISC-V including RVV/ZBC detection | [PR #1904](https://github.com/zlib-ng/zlib-ng/pull/1904) |
| 2025-05 | Configure --without-zbc flag; ZBC detection in configure | [PR #1917](https://github.com/zlib-ng/zlib-ng/pull/1917) |
| 2025-06 | chunkcopy_rvv optimization (prune redundant memcpy, maximize copy length) | [PR #1921](https://github.com/zlib-ng/zlib-ng/pull/1921) |
| 2025-11 | Remove incorrect kernel version gate before AT_HWCAP; drop bogus HWCAP_ISA_ZBC bit 29; fix SIGILL on kernels < 6.5 | [PR #1999](https://github.com/zlib-ng/zlib-ng/pull/1999) |
| 2026-02 | hwprobe syscall-based detection for V and Zbc; requires Linux 6.8+ UAPI; falls back to hwcap | [PR #2130](https://github.com/zlib-ng/zlib-ng/pull/2130) |
| 2026-02 | Fix build on RISC-V when RVV is disabled but ZBC is enabled (cpu_features struct missing riscv member) | [PR #2152](https://github.com/zlib-ng/zlib-ng/pull/2152) |

**Key contributors by organization:**
- Alex Chiang (SiFive): initial CI and RVV optimizations (compare256, slide_hash, adler32)
- Simon Hosie: adler32_fold_copy_rvv
- Xeonacid: runtime HWCAP detection
- mtl1979 (independent): improved RVV detection, ZBC configure support
- yintong / Ag-Cu (ByteDance): CRC32 Zbc implementation and bash configure
- Icenowy Zheng (Sipeed/independent): primary active RISC-V maintainer 2025-2026, CI rebuilds, all hwcap and hwprobe detection fixes

---

## 3. Upstream Support Tier

No formal tier policy is documented for zlib-ng. The evidence below characterizes actual support level.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Dedicated arch/xxx directory | Yes (arch/x86/) | Yes (arch/arm/) | Yes (arch/riscv/) |
| SIMD implementations | 7+ ISA tiers | 4+ ISA tiers | 2 (RVV, Zbc) |
| Runtime feature detection | Yes (CPUID) | Yes (AT_HWCAP) | Yes (hwprobe + hwcap fallback) |
| CI on every push/PR | Yes | Yes | Yes (QEMU-emulated) |
| Native CI runner | Yes | Yes | No -- QEMU only |
| Code coverage in CI | Yes | Yes | GCC only; Clang coverage disabled due to errors |
| Test corpora in CI | Yes | Yes | No -- skipped due to QEMU slowness |
| Official binary packages | Yes | Yes | Alpine Linux edge only |
| Pre-built GitHub release assets | No (source-only) | No (source-only) | No (source-only) |

riscv64 is treated as a first-class architecture in code and CI structure, but it is second-class in CI execution quality (QEMU vs. native) and binary distribution (Alpine edge only, vs. broad distro coverage for amd64/arm64).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

zlib-ng uses a function-pointer dispatch table populated at runtime by `riscv_check_features()`. There is no JIT backend. All acceleration is via C intrinsics or inline assembly.

**arch/riscv/ inventory (develop branch, confirmed by direct file fetch):**

| File | Lines | ISA Extension | Status |
|------|-------|---------------|--------|
| adler32_rvv.c | 119 | RVV (e8/e16/e32, LMUL=4/8) | Complete |
| chunkset_rvv.c | 126 | RVV (e16/e32/e64, LMUL=4) | Complete; one unaligned-access bug open (issue #1670) |
| compare256_rvv.c | 48 | RVV (e8, LMUL=4) | Complete |
| slide_hash_rvv.c | 33 | RVV (e16, LMUL=4) | Complete |
| crc32_zbc.c | 104 | Zbc (clmul/clmulh inline asm) | Complete |
| riscv_features.c | 99 | Runtime detection (hwprobe + hwcap) | Complete |
| riscv_features.h | ~15 | -- | Complete |
| riscv_natives.h | ~15 | Compile-time (__riscv_v, __riscv_zbc) | Complete |
| riscv_functions.h | ~50 | -- | Complete |
| Makefile.in | ~45 | -- | Complete |

No `.S` assembly files. No JIT. No scalar RISC-V-specific code beyond the feature detection path.

**Per-component comparison:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| adler32 | Hand-tuned intrinsics (SSSE3/AVX2/AVX-512/VNNI); 7+ ISA variants | NEON + dotprod | RVV intrinsics via riscv_vector.h; vectorized with 16/32-bit accumulators and NMAX block handling; 1.6-1.8x speedup on SiFive FPGA |
| chunkset / inflate_fast | SSE2/SSSE3/AVX2/AVX-512 | NEON | RVV intrinsics; inflate_fast_rvv instantiated from inffast_tpl.h; chunkmemset_{2,4,8} with 16/32/64-bit RVV fills; known unaligned-access bug (issue #1670) |
| compare256 / longest_match | SSE2/AVX2/AVX-512 | NEON | RVV: vmsne/vfirst pattern; longest_match_rvv and longest_match_roll_rvv via match_tpl.h |
| slide_hash | SSE2/AVX2 | NEON + ARMv6 | RVV: vssubu (unsigned saturating subtract) |
| crc32 | PCLMULQDQ/VPCLMULQDQ/Chorba SSE4.1 | ARMv8 CRC + PMULL-EOR3 | Zbc inline asm (clmul/clmulh); Barrett reduction; 4-8x vs. generic at >= 16 bytes; falls back to crc32_braid for < 16 bytes |
| feature detection | CPUID via __cpuid() | AT_HWCAP via getauxval | riscv_hwprobe(2) primary (kernel 6.8+); AT_HWCAP fallback (kernel 4.15+); inline vsetvli probe for VILL bit sanity check |

No TODO, FIXME, or stub markers exist in any of the 6 RISC-V .c files (verified by direct file read).

The RISC-V implementation is shallower than amd64 (2 ISA variants vs. 7+) but this reflects hardware reality: RVV 1.0 is the sole stable RISC-V vector ISA, and Zbc is the only relevant scalar-crypto extension with shipping hardware. Coverage is proportionally complete.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake (primary) and autoconf configure (secondary, added by PR #1904 in 2025).

**RISC-V CMake flags:**

| CMake Flag | configure Flag | Description | Default |
|------------|----------------|-------------|---------|
| -DWITH_RVV=ON/OFF | --without-rvv | RVV intrinsics via riscv_vector.h | ON |
| -DWITH_RISCV_ZBC=ON/OFF | --without-zbc | ZBC carry-less multiply via clmul | ON |

Architecture detection: `BASEARCH_RISCV_FOUND=TRUE` when `CMAKE_SYSTEM_PROCESSOR` matches `riscv(32|64)`. Enables `ARCHDIR=arch/riscv`.

Compile flags: RVV sources use `-march=rv64gcv`; ZBC sources use `-march=rv64gc_zbc`; when both are enabled, riscv_features.c is compiled with `-march=rv64gcv_zbc`.

**Toolchain files provided:**
- `cmake/toolchain-riscv.cmake` -- GCC cross-compilation
- `cmake/toolchain-riscv-clang.cmake` -- Clang cross-compilation

Both set:
```
CMAKE_CROSSCOMPILING_EMULATOR = qemu-riscv64 -cpu rv64,zba=true,zbb=true,zbc=true,zbs=true,v=true,vlen=512,elen=64,vext_spec=v1.0 -L /usr/riscv64-linux-gnu/
```

**Exact GCC cross-compile commands (from CI):**
```bash
sudo apt-get install -y --no-install-recommends qemu-user crossbuild-essential-riscv64
cmake -S . -DCMAKE_TOOLCHAIN_FILE=cmake/toolchain-riscv.cmake \
  -DCMAKE_BUILD_TYPE=Release -DWITH_BENCHMARKS=ON
cmake --build . --config Release
ctest --verbose -C Release
```

**Exact configure cross-compile commands (from CI):**
```bash
# Standard
CC=riscv64-linux-gnu-gcc ./configure --host=riscv64-linux-gnu --warn
# Without RVV and ZBC
CC=riscv64-linux-gnu-gcc ./configure --host=riscv64-linux-gnu --warn --without-rvv --without-zbc
# Compat mode, no optimizations
CC=riscv64-linux-gnu-gcc ./configure --host=riscv64-linux-gnu --warn \
  --zlib-compat --without-optimizations --without-new-strategies
```

**Toolchain version requirements:** ZBC requires GCC >= 11 or Clang >= 14 (explicitly noted in cmake/detect-intrinsics.cmake source comments). RVV requires a compiler with `<riscv_vector.h>` support; no explicit minimum version stated in source, but GCC 10+ and Clang 12+ are known to provide it.

**Known build failures (all fixed):**

- [Issue #941](https://github.com/zlib-ng/zlib-ng/issues/941) (2021): CMake fell back to x86 defaults for riscv64. Fixed by [PR #942](https://github.com/zlib-ng/zlib-ng/pull/942).
- [Issue #2148](https://github.com/zlib-ng/zlib-ng/issues/2148) (2026-02): `crc32_riscv64_zbc` undeclared when building on Fedora riscv64 with `-DWITH_RVV=OFF` but ZBC enabled. Fixed by [PR #2152](https://github.com/zlib-ng/zlib-ng/pull/2152).
- [Issue #1936](https://github.com/zlib-ng/zlib-ng/issues/1936) (2025): SIGILL at `riscv_check_features()` when cross-compiling for riscv64-linux-musl with `-static-pie`. Closed 2025-08-29.

**No Dockerfiles** exist in the repository for RISC-V. CI uses Ubuntu packages directly.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. All core compression and decompression paths (deflate, inflate, adler32, crc32, longest-match, hash slide, chunk copy) have RISC-V implementations. The zlib-compat ABI is supported (tested via CI configure job with `--zlib-compat`).

**Performance gaps:**

| Component | amd64 speedup vs. generic | arm64 speedup vs. generic | riscv64 speedup vs. generic |
|-----------|--------------------------|--------------------------|----------------------------|
| adler32 | Substantial (AVX-512 VNNI) | Substantial (NEON dotprod) | 1.6-1.8x on SiFive FPGA (2023 data) |
| crc32 | Substantial (PCLMULQDQ/Chorba) | Substantial (PMULL) | 4-8x vs. generic_chorba for >= 16 bytes (PR #1905, musebook hardware) |
| slide_hash, compare256, chunkset | Substantial (AVX2/AVX-512) | Substantial (NEON) | Data not available: no public benchmark for these components on RISC-V hardware |
| Overall compression L6 | ~4-5x vs. stock zlib | ~4-5x vs. stock zlib (RPi5 data) | Data not available: no public cross-architecture comparison including riscv64 |

All published benchmark discussions (#2022 November 2025, #871 August 2025) target x86 and ARMv8 hardware only. No riscv64 vs. amd64 or riscv64 vs. arm64 comparison exists in any commit, PR, issue, or blog post.

**Security hardening gaps:** Data not available: no issue or PR in the findings discusses RISC-V-specific security hardening (CFI, shadow stack, PAC equivalent, etc.).

**Known correctness issue:** Issue #1670 (open since 2024-02-16): `CHUNK_MEMSET_RVV_IMPL` in chunkset_rvv.c performs a direct pointer cast `*(uint##elen##_t*)from` without the `UNALIGNED_OK` guard that all other architectures use. RISC-V does not define `UNALIGNED_OK`. This is a portability risk on strict-alignment RISC-V targets and inconsistent with every other arch implementation. Severity: correctness/portability; not a crash on standard Linux/glibc RISC-V targets where unaligned loads are handled by the kernel, but a correctness defect on musl or bare-metal targets. Unfixed as of the develop branch at the time of this report.

---

## 7. CI/CD Infrastructure

**CI system:** GitHub Actions, orchestrated by `orchestrator.yml` which triggers on `push`, `pull_request`, and `workflow_dispatch`. It calls `cmake.yml`, `configure.yml`, and `pkgcheck.yml` as reusable workflows. All RISC-V jobs run via these reusable workflows, meaning they fire on every push and every PR.

**Runner type for all RISC-V jobs:** `ubuntu-latest` (x86_64 hosted). No native riscv64 runner exists. All tests execute under `qemu-riscv64` user-mode emulation.

**RISC-V CI matrix entries (total: 6 jobs per run):**

From `cmake.yml`:
1. Ubuntu GCC RISC-V -- `-DCMAKE_TOOLCHAIN_FILE=cmake/toolchain-riscv.cmake -DWITH_BENCHMARKS=ON`; code coverage enabled, reports to Coveralls
2. Ubuntu Clang RISC-V -- `-DCMAKE_TOOLCHAIN_FILE=cmake/toolchain-riscv-clang.cmake`; coverage disabled ("Coverage disabled for clang on riscv, errors")

From `configure.yml`:
3. Ubuntu GCC RISCV64 -- `--warn`
4. Ubuntu GCC RISCV64 No RVV No ZBC -- `--warn --without-rvv --without-zbc`
5. Ubuntu GCC RISCV64 Compat No Opt -- `--warn --zlib-compat --without-optimizations --without-new-strategies`

From `pkgcheck.yml`:
6. Ubuntu GCC RISC-V -- package build verification

**Test corpora:** Explicitly skipped for RISC-V in cmake.yml (condition: `!contains(matrix.name, 'RISC-V')`) due to QEMU emulation speed. This means the largest regression tests do not run in RISC-V CI.

**Delta workflow:** `delta.yml` supports `/delta riscv64` slash command on PR comments, which cross-compiles both the base branch and PR head and posts bloaty/abidiff binary size and ABI diffs as a PR comment. Restricted to OWNER/MEMBER/COLLABORATOR.

**Comparison:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Runs on push/PR | Yes | Yes | Yes (via orchestrator) |
| Native runner | Yes | Yes | No (QEMU) |
| Code coverage | Yes | Yes | GCC only; Clang broken |
| Test corpora | Yes | Yes | No (QEMU too slow) |
| RISE-provided runners | N/A | N/A | No |

---

## 8. Distribution and Release Status

**GitHub releases:** Windows-only pre-built ZIPs (win-arm64, win-x86-64, win-x86, plus compat variants). Source tarballs only for Linux/riscv64. No riscv64 binary asset in any release.

**PyPI (`zlib-ng` Python binding, version 1.0.0):** Wheels exist for macOS x86_64/arm64, Linux manylinux2014 x86_64/aarch64, musllinux_1_2 x86_64/aarch64, Windows win_amd64. No riscv64 wheel. Confirmed by direct PyPI JSON API fetch.

**Debian:** `zlib-ng` does not exist as a Debian package in any suite (stable, testing, sid, or any arch). The buildd database returns no entry for any architecture. The only related Debian entry is `librust-libz-sys+zlib-ng-dev` (a Rust feature flag package), not the library itself.

**Ubuntu:** Package `zlib-ng` does not exist in Ubuntu 24.04 (noble) or any currently supported Ubuntu release.

**Alpine Linux edge:** Confirmed via direct package index fetch. `zlib-ng 2.3.3-r0` and `zlib-ng-dev 2.3.3-r0` exist in `edge/main` for riscv64. Build date: 2026-05-11. This is the only mainstream distribution shipping a current zlib-ng riscv64 binary.

**ArchPOWER riscv64:** `zlib-ng 2.2.4-1` exists but is stale (upstream is 2.3.x) and ArchPOWER is a niche PowerPC-focused community port. [NEEDS VERIFICATION] for current version.

**What a user must do to get a working riscv64 binary:**
- Alpine Linux: `apk add zlib-ng` (edge branch) -- available out-of-the-box
- Debian/Ubuntu: build from source; no package available
- Other distros: build from source using the CMake toolchain files provided in the repository

---

## 9. Dependencies

zlib-ng has no runtime external library dependencies. It is a self-contained compression library. All dependencies are build-time or test-time.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|---------------|--------------|-----------------|-----------------|
| qemu-user (qemu-riscv64) | Test execution of cross-compiled binaries in CI | Packaged in Debian/Ubuntu | Used in all 6 RISC-V CI jobs; CPU model: rv64,v=true,vlen=512,zbc=true | Ships in Debian/Ubuntu | None known |
| crossbuild-essential-riscv64 | Cross-compiler toolchain (GCC + sysroot) for riscv64 | Ubuntu apt package | Passes all RISC-V CI jobs | Packaged in Debian/Ubuntu | None known |
| clang (with riscv64 target) | Cross-compiler alternative | Packaged in Debian/Ubuntu | CI Clang job passes; coverage collection errors noted | Packaged | Code coverage collection broken on Clang/riscv64 (non-blocking) |
| Linux kernel asm/hwprobe.h | Runtime CPU feature detection (V and Zbc) requires riscv_hwprobe(2) | Header present in Linux >= 6.12 UAPI; shipped with Debian Trixie; build probed at configure time via CMake check | Fallback to hwcap if absent; both paths tested in CI (QEMU provides hwprobe) | Ships with kernel | Not a build blocker; deployment risk on kernels < 6.8 where Zbc cannot be reliably detected at runtime. Documented, no open issue. |
| GoogleTest | Unit test framework; optional (WITH_GTEST) | Builds on riscv64 | [googletest issue #3756](https://github.com/google/googletest/issues/3756): GetThreadCountTest.ReturnsCorrectValue fails on riscv64 -- this is a googletest bug, not a zlib-ng bug | N/A (source build) | Non-blocking for zlib-ng; zlib-ng does not use thread-count tests |
| Google Benchmark | Microbenchmark framework; optional (WITH_BENCHMARKS) | Builds on riscv64 | Past riscv64 issues (cycle clock, CPU frequency) resolved | N/A (source build) | None known |
| libpng | Downstream consumer; zlib-ng CI includes a libpng.yml compatibility test | libpng has riscv64 RVV support | libpng.yml CI workflow in zlib-ng tests x86-64 and aarch64 only -- no riscv64 slot | Packaged for riscv64 in Debian/Ubuntu | No open riscv64 issues in libpng upstream; riscv64 zlib-compat regressions could go undetected in this downstream test |

No JIT, SIMD, crypto, or numerics dependencies require recursive riscv64 audit beyond what is listed.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#1670](https://github.com/zlib-ng/zlib-ng/issues/1670) | RISC-V and unaligned memory access | Open (since 2024-02-16) | Medium | CHUNK_MEMSET_RVV_IMPL does direct pointer cast without UNALIGNED_OK; inconsistent with all other arch implementations; risk on strict-alignment targets (musl, bare-metal) |

All other RISC-V-specific issues are closed:

| ID | Title | Status | Resolution |
|----|-------|--------|------------|
| [#941](https://github.com/zlib-ng/zlib-ng/issues/941) | riscv64 support in cmake is broken | Closed 2021-05-06 | Fixed by PR #942 |
| [#1705](https://github.com/zlib-ng/zlib-ng/issues/1705) | RVV support enabled accidentally, SIGILL on older kernels | Closed 2025-11-13 | Fixed by PR #1999 |
| [#1936](https://github.com/zlib-ng/zlib-ng/issues/1936) | Cross-compile to riscv64 with -static-pie causes SIGILL | Closed 2025-08-29 | Fixed upstream |
| [#1997](https://github.com/zlib-ng/zlib-ng/issues/1997) | RISC-V Zbc extension detection is broken (HWCAP bit 29 not in Linux UAPI) | Closed 2026-05-13 | Fixed by PR #1999 (drop bogus bit) + PR #2130 (hwprobe) |
| [#2148](https://github.com/zlib-ng/zlib-ng/issues/2148) | crc32_riscv64_zbc undeclared when building without RVV | Closed 2026-02-16 | Fixed by PR #2152 |

**Correctness bugs (separate highlight):**

1. Signed/unsigned comparison mismatch in chunkset_rvv CHUNKCOPY (commit 2bba7e8, fixed 2025-03-28): `dist` (ptrdiff_t, signed) compared against `len` (size_t, unsigned); negative `dist` converted to huge positive, skipped safe memcpy, caused SIGSEGV during decompression. Fixed by explicit `if (dist < 0 || dist >= len)` check.

2. Incorrect HWCAP_ISA_ZBC bit (issues #1997, closed): bit 29 of AT_HWCAP was never assigned to Zbc in Linux UAPI. The implementation used it from PR #1905 (April 2025) through PR #1999 (November 2025) -- seven months with non-functional Zbc detection on all hardware except where the bit happened to be set for another reason. Fixed by switching to riscv_hwprobe(2) in PR #2130.

3. Issue #1670 (open): unaligned access in CHUNK_MEMSET_RVV_IMPL, described above. No fix committed.

---

## 12. Objections and Upstream Blockers

No stated objections to RISC-V support from maintainers. Dead2 has consistently approved and merged RISC-V work quickly. No evidence of architectural objections or policy barriers.

**Technical blockers that have been encountered and resolved:**
- Bogus HWCAP bit for Zbc (7-month window with broken detection)
- SIGILL on kernels < 6.5 with RVV (required runtime-only detection, resolved Nov 2025)
- Build failure when RVV disabled but ZBC enabled (Feb 2026)

**Remaining technical constraints:**
- hwprobe-based Zbc detection requires kernel 6.8+. On kernel 4.15-6.7, fallback to AT_HWCAP, which cannot detect Zbc reliably (no assigned HWCAP bit). Effective result: Zbc acceleration unavailable on kernels < 6.8.
- RVV detection on Xtheadvector cores: the Nov 2025 HWCAP fix retains inline vsetvli assembly as a defense against cores that incorrectly set HWCAP_ISA_V for RVV 0.7.1 (Xtheadvector). This is a known deployment consideration for T-Head-based SoCs.
- No acceptance probability issue -- RISE involvement would be welcomed given the maintainer's track record.

---

## 13. Investment Analysis

RISE has done nothing for zlib-ng. The 2025-2026 RISC-V improvements (Zbc CRC32, hwprobe detection, CI rebuild) were funded by ByteDance and Sipeed-affiliated engineers acting independently.

### 13.1 Functional Enablement

All functional gaps are closed. No features are missing for riscv64. Issue #1670 (unaligned access) is a correctness issue on strict-alignment targets but not a functional blocker on Linux/glibc.

One actionable item: fix issue #1670. Scope is small (chunkset_rvv.c; adding an UNALIGNED_OK guard consistent with other architectures).

### 13.2 Performance Optimization

Published performance data is thin. The only riscv64 benchmarks in the findings are:
- adler32 RVV: 1.6-1.8x on a 2023 SiFive FPGA
- crc32 Zbc: 4-8x on an unspecified 2025 Zbc-capable device

No chunkset, compare256, or slide_hash benchmarks for riscv64 exist. No cross-architecture comparison (riscv64 vs. arm64 vs. amd64) exists in any public source.

Significant opportunity: run zlib-ng benchmarks on current production riscv64 hardware (Sophgo SG2042, SpacemiT X60, Milk-V Pioneer) and publish cross-architecture comparisons. This directly serves the chip company audience for this report and would be cited in any future RISE blog post.

Potential optimization opportunities not yet implemented: RISC-V has no `inflate_fast` equivalent of the AVX-512 path; the chunkcopy_rvv implementation uses LMUL=4 fixed, whereas adaptive LMUL selection could improve short-buffer performance.

### 13.3 CI/CD Infrastructure

The current CI gap is QEMU-only testing. Two actionable improvements:

1. Native riscv64 CI runner: replace QEMU jobs with actual hardware. This would catch issues that QEMU masks (e.g., HWCAP/hwprobe behavior differences, timing-sensitive RVV dispatch bugs, Xtheadvector false-positive detection on T-Head cores).

2. Re-enable test corpora for riscv64: currently skipped because QEMU is too slow. A native runner removes this constraint and restores parity with amd64/arm64 CI.

3. Fix Clang code coverage on riscv64: currently disabled due to errors. Root cause not identified in the findings.

### 13.4 Ecosystem Enablement

The Python `zlib-ng` binding (PyPI) has no riscv64 wheel. Adding a riscv64 wheel to the PyPI release would benefit any Python workload using the binding (e.g., genomics tools that use python-zlib-ng). This requires adding riscv64 to the cibuildwheel configuration for the python-zlib-ng package.

Debian/Ubuntu packaging is absent entirely. Filing an ITP (Intent to Package) in Debian and getting `libzng-dev` into Debian main would propagate to Ubuntu and all Debian-derivative distributions automatically.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Fix issue #1670 (unaligned access in CHUNK_MEMSET_RVV_IMPL) | 0.5 | Upstream contributor | High |
| Performance | Run and publish benchmarks on production riscv64 hardware (SG2042, SpacemiT X60) across all optimized paths | 1 | Chip company infra | High |
| Performance | Profile chunkset_rvv and compare256_rvv on real hardware; assess adaptive LMUL | 2 | Upstream contributor | Medium |
| CI/CD | Provide native riscv64 CI runner (RISE infrastructure or self-hosted) | 1 | RISE / chip company | High |
| CI/CD | Re-enable test corpora on riscv64 CI once native runner available | 0.5 | Upstream contributor | Medium |
| CI/CD | Investigate and fix Clang coverage collection on riscv64 | 1 | Upstream contributor | Low |
| Ecosystem | Add riscv64 wheel to python-zlib-ng cibuildwheel config and PyPI release | 1 | python-zlib-ng maintainer | Medium |
| Ecosystem | File Debian ITP for zlib-ng; get libzng-dev into Debian main | 3 | Debian packager | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [zlib-ng/zlib-ng repository](https://github.com/zlib-ng/zlib-ng)
- [arch/riscv/ directory](https://github.com/zlib-ng/zlib-ng/tree/develop/arch/riscv)
- [cmake/toolchain-riscv.cmake](https://github.com/zlib-ng/zlib-ng/blob/develop/cmake/toolchain-riscv.cmake)
- [cmake/toolchain-riscv-clang.cmake](https://github.com/zlib-ng/zlib-ng/blob/develop/cmake/toolchain-riscv-clang.cmake)
- [.github/workflows/cmake.yml](https://github.com/zlib-ng/zlib-ng/blob/develop/.github/workflows/cmake.yml)
- [.github/workflows/configure.yml](https://github.com/zlib-ng/zlib-ng/blob/develop/.github/workflows/configure.yml)
- [.github/workflows/delta.yml](https://github.com/zlib-ng/zlib-ng/blob/develop/.github/workflows/delta.yml)
- [Issue #941 -- riscv64 cmake detection broken](https://github.com/zlib-ng/zlib-ng/issues/941)
- [Issue #1670 -- RISC-V and unaligned memory access (open)](https://github.com/zlib-ng/zlib-ng/issues/1670)
- [Issue #1705 -- RVV causes SIGILL on older kernels](https://github.com/zlib-ng/zlib-ng/issues/1705)
- [Issue #1936 -- static-pie riscv64 SIGILL](https://github.com/zlib-ng/zlib-ng/issues/1936)
- [Issue #1997 -- Zbc extension detection broken](https://github.com/zlib-ng/zlib-ng/issues/1997)
- [Issue #2148 -- crc32_riscv64_zbc undeclared without RVV](https://github.com/zlib-ng/zlib-ng/issues/2148)
- [PR #942 -- Fix cmake detection of riscv](https://github.com/zlib-ng/zlib-ng/pull/942)
- [PR #1477 -- Enable RISC-V cross build and test](https://github.com/zlib-ng/zlib-ng/pull/1477)
- [PR #1498 -- compare256 RVV](https://github.com/zlib-ng/zlib-ng/pull/1498)
- [PR #1522 -- slide_hash RVV](https://github.com/zlib-ng/zlib-ng/pull/1522)
- [PR #1532 -- adler32 RVV; 1.6-1.8x speedup on SiFive FPGA](https://github.com/zlib-ng/zlib-ng/pull/1532)
- [PR #1585 -- Runtime RVV detection via AT_HWCAP](https://github.com/zlib-ng/zlib-ng/pull/1585)
- [PR #1597 -- adler32_fold_copy_rvv](https://github.com/zlib-ng/zlib-ng/pull/1597)
- [PR #1889 -- Fix SIGSEGV in chunkset_rvv CHUNKCOPY](https://github.com/zlib-ng/zlib-ng/pull/1889)
- [PR #1890 -- CI fixes for RISC-V](https://github.com/zlib-ng/zlib-ng/pull/1890)
- [PR #1904 -- bash configure script support for RISC-V](https://github.com/zlib-ng/zlib-ng/pull/1904)
- [PR #1905 -- CRC32 via Zbc extension; benchmark data](https://github.com/zlib-ng/zlib-ng/pull/1905)
- [PR #1917 -- configure --without-zbc support](https://github.com/zlib-ng/zlib-ng/pull/1917)
- [PR #1921 -- chunkcopy_rvv optimization](https://github.com/zlib-ng/zlib-ng/pull/1921)
- [PR #1999 -- RISC-V hwcap fixes; fix SIGILL on kernels < 6.5](https://github.com/zlib-ng/zlib-ng/pull/1999)
- [PR #2130 -- hwprobe-based V/Zbc detection](https://github.com/zlib-ng/zlib-ng/pull/2130)
- [PR #2152 -- Fix build without RVV when ZBC enabled](https://github.com/zlib-ng/zlib-ng/pull/2152)
- [commit 2bba7e8 -- Fix SIGSEGV signed/unsigned comparison in chunkset_rvv](https://github.com/zlib-ng/zlib-ng/commit/2bba7e84)
- [commit 29cf624 -- Fix HWCAP kernel version gate](https://github.com/zlib-ng/zlib-ng/commit/29cf6242)
- [commit c699fa6 -- Add hwprobe-based V/Zbc detection](https://github.com/zlib-ng/zlib-ng/commit/c699fa66)
- [Alpine Linux edge riscv64 zlib-ng package](https://pkgs.alpinelinux.org/packages?name=zlib-ng&arch=riscv64&branch=edge)
- [PyPI zlib-ng package](https://pypi.org/pypi/zlib-ng/json)
- [RISE project blog -- no zlib-ng content](https://riseproject.dev/blog)
- [googletest issue #3756 -- thread count test failure on riscv64](https://github.com/google/googletest/issues/3756)