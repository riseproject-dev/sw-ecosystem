---
title: zstd
categories:
  - libraries
---

# zstd

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for zstd
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

zstd is a real-time compression/decompression library developed and maintained by Meta (Facebook). It is standardized as [IETF RFC 8878](https://datatracker.ietf.org/doc/html/rfc8878). The library is licensed BSD + GPL-2.0. There is no foundation governance (Apache, LF, CNCF, or otherwise). Meta holds merge authority.

The project is maintained by an internal Meta team. No public MAINTAINERS file or CODEOWNERS file exists. The primary maintainer, identified by merge history, is Cyan4973 (Yann Collet, Meta). A secondary reviewer, terrelln (Nick Terrell, Meta), approves performance-sensitive changes. Nearly all external PRs are merged directly by Cyan4973 with minimal ceremony.

zstd is not a RISE Project member. No RISE blog post has mentioned zstd in the period May 2024 through June 2026.

The project's posture toward new architecture ports is welcoming but demanding. Benchmark data is required for any performance-sensitive change. CONTRIBUTING.md sets a high bar for SIMD/optimization work. RISC-V patches have been accepted when benchmarks are present, but maintainer response latency is high: several PRs have waited 3-6 months without a single review comment.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | PR/Commit | Source |
|---|---|---|---|
| 2018-04-09 | First RISC-V fix: switched `-lpthread` to `-pthread` in `contrib/pzstd/Makefile` to pull in `-latomic` for 1/2-byte atomics on riscv64 | [PR #1103](https://github.com/facebook/zstd/pull/1103) | Merged by Cyan4973 |
| 2024-08-09 | Enable weak symbol support for RISC-V (both GCC and Clang); validated on GCC 13.2.1 and Clang 18 on physical RISC-V hardware | [PR #4114](https://github.com/facebook/zstd/pull/4114) | Merged by Cyan4973 |
| 2025-06-08 | RVV vectorization for `convertSequences_noRepcodes()` and `ZSTD_get1BlockSummary()` in the compression pipeline; +62% throughput on both functions on Spacemit X60 | [PR #4399](https://github.com/facebook/zstd/pull/4399) | Merged by Cyan4973 |
| 2025-07-19 | RISC-V RVV CI: QEMU-based tests for vlen=128/256/512; type-punned pointer fix; `MEM_FORCE_MEMORY_ACCESS=0` for Spacemit X60 hardware compatibility | [PR #4435](https://github.com/facebook/zstd/pull/4435) | Merged by Cyan4973 |
| 2025-09-30 | CI GCC bumped from 13 to 14 for RVV 1.0 intrinsic support; bugfix in `ZSTD_row_getRVVMask()`; RVV optimization added to `ZSTD_copy16()`; +7% decompression, +5% compression on enwiki5.txt | [PR #4502](https://github.com/facebook/zstd/pull/4502) | Merged by Cyan4973 |
| 2025-12-02 | RISC-V 64-bit architecture detection: `__riscv && __riscv_xlen == 64` added to define `__64BIT__` in `programs/platform.h`; foundational correctness fix | [PR #4525](https://github.com/facebook/zstd/pull/4525) | Merged by Cyan4973 |
| 2025-12-22 | Fast sequence decoding path extended to riscv64; +0.5-2.9% decompression across levels 1-22 on Zhihe A210 C908; no maintainer response as of 2026-06 | [PR #4557](https://github.com/facebook/zstd/pull/4557) | Open, Alibaba Linux |
| 2026-02-28 | Auto-select `MEM_FORCE_MEMORY_ACCESS=2` when `__riscv_zicclsm` is detected; +74% compression throughput on SG2044; `terrelln` approved direction but deferred to Cyan4973 who has not responded | [PR #4596](https://github.com/facebook/zstd/pull/4596) | Open, stalled |
| 2026-03-12 | Enable `HUF_4X2_4WAY` 4-stream parallel Huffman decode for riscv64; +0.91% decompression; benchmarks provided after request; no merge as of 2026-06 | [PR #4622](https://github.com/facebook/zstd/pull/4622) | Open, stalled |
| 2026-03-25 | RVV intrinsics for `ZSTD_count()` match-length counting; +7.47% compression on r2044 hardware; no review as of 2026-06 | [PR #4629](https://github.com/facebook/zstd/pull/4629) | Open |
| 2026-04-15 | Enable `PREFETCH_L1` for RISC-V in decompression hot path, mirroring aarch64; +0.14% decompression on SG2044 | [PR #4643](https://github.com/facebook/zstd/pull/4643) | Open |
| 2026-05-14 | RISC-V 64-bit prefetch optimization in doubleFast compressor; +9% compression, +8% decompression on RV64GC with GCC 15.1 | [PR #4668](https://github.com/facebook/zstd/pull/4668) | Open |

All merged work is fully upstream in the `dev` branch. No out-of-tree patches are required. The RISC-V work originates from a small group of community contributors, primarily Polaris-911 and zijianli1234 (RISC-V hardware vendors, likely affiliated with Chinese HPC organizations [NEEDS VERIFICATION]), plus yunfeizhou2025 from Alibaba Linux. Meta has contributed no RISC-V-specific code directly; all RISC-V code is community-submitted.

No formal master tracking issue for the RISC-V port exists. The work proceeds as a series of independent incremental PRs without central coordination.

---

## 3. Upstream Support Tier

zstd has no formal platform tier policy. No PLATFORMS.md or SUPPORT.md file exists. There is no documented tier system analogous to Rust or LLVM.

RISC-V support is accepted on a best-effort community basis: patches are merged when they pass CI, include benchmarks, and receive maintainer attention. The absence of a native RISC-V CI runner means broken riscv64 builds could go undetected between PR cycles.

**Platform comparison:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI trigger | Push + PR to all branches | Push + PR to all branches | PR to `dev`/`release`/`actionsTest` only |
| CI hardware | Native x86-64 runner | Native aarch64 runner [NEEDS VERIFICATION] | QEMU user-mode on x86-64 host |
| Release-blocking | Yes | Yes | No |
| Official binaries (GitHub) | Windows zip only | None | None |
| Distro packages | Universal | Universal | Debian, Ubuntu (full); Arch likely |
| Assembly fast paths | Yes (`huf_decompress_amd64.S`) | No `.S`; intrinsics | No `.S`; intrinsics (partial) |
| Vectorization | SSE2/BMI2 (fully merged) | NEON/SVE2 (fully merged) | RVV (partially merged) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

zstd has no JIT, no GC, and no cryptographic components. Its architecture-specific code is concentrated in three areas: SIMD acceleration for compression and decompression hot paths, prefetch hints, and unaligned memory access.

**Component matrix:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Huffman decompression fast loop | Full: hand-written BMI2 assembly (`huf_decompress_amd64.S`); 4-stream loop | Partial: `HUF_4X2_4WAY` C loop enabled via `#if defined(__aarch64__)` | Scalar: 3-way C loop; PR [#4622](https://github.com/facebook/zstd/pull/4622) would add 4-way, open and unreviewed since 2026-03 |
| Row hash match mask (`ZSTD_row_getMatchMask`) | Full: SSE2 intrinsics (`_mm_cmpeq_epi8`) | Full: NEON intrinsics (`vld1q_u8`, `vceqq_u8`) with 16/32/64 byte variants | Partial: RVV intrinsics (`__riscv_vsetvl_e8m1/m2/m4`, `__riscv_vmseq_vx`) merged, requires GCC>=14 and `__riscv_vector` |
| 16-byte copy (`ZSTD_copy16`) | Full: SSE2 (`_mm_loadu_si128`) | Full: NEON (`vld1q_u8`/`vst1q_u8`) | Partial: RVV (`__riscv_vle8_v_u8m1`/`__riscv_vse8_v_u8m1`), merged via [PR #4502](https://github.com/facebook/zstd/pull/4502), requires RVV-capable CPU |
| Sequence conversion (`convertSequences`) | Generic C | Generic C | RVV intrinsics merged via [PR #4399](https://github.com/facebook/zstd/pull/4399): segmented vector loads (`__riscv_vlseg4e32_v_u32m2x4`), narrowing, segmented stores; +62% on Spacemit X60 |
| Block summary (`ZSTD_get1BlockSummary`) | Generic C | Generic C | RVV intrinsics merged via [PR #4399](https://github.com/facebook/zstd/pull/4399): vector compare, reduction (`__riscv_vredsum_vs_u32m2_u32m1`); +62% on Spacemit X60 |
| Match-length counting (`ZSTD_count`) | Generic C (BMI2 dispatch for sequence decode) | Generic C | RVV pending: [PR #4629](https://github.com/facebook/zstd/pull/4629), uses `vsetvl_e8m1`; +7.47% compression; no review since 2026-03-25 |
| Sequence decode fast path | Full: BMI2 dispatch table, runtime `cpuid` dispatch | Partial: prefetch only | Scalar: [PR #4557](https://github.com/facebook/zstd/pull/4557) from Alibaba Linux adds riscv64 to fast path; open since 2025-12-22, no maintainer response |
| Prefetch hints | Full: `_mm_prefetch` (L1/L2) | Full: `__asm__ "prfm pldl1keep"` | Missing: [PR #4643](https://github.com/facebook/zstd/pull/4643) adds `PREFETCH_L1` for `__riscv`; [PR #4668](https://github.com/facebook/zstd/pull/4668) adds prefetch to doubleFast; both open |
| Unaligned memory access (`mem.h`) | Full: `MEM_FORCE_MEMORY_ACCESS=2` forced at compile time | Full: Method 2 (direct cast) | Missing: [PR #4596](https://github.com/facebook/zstd/pull/4596) auto-detects `__riscv_zicclsm` to enable Method 2; stalled on Cyan4973 non-response |
| 64-bit arch detection | Full | Full | Partial: `programs/platform.h` fixed by [PR #4525](https://github.com/facebook/zstd/pull/4525) (merged 2025-12-02); `lib/` internals still lack explicit riscv64 guards in some places |
| Hand-written assembly (.S) | Yes: `huf_decompress_amd64.S` | None | None |
| Unaligned access in `xxhash.h` | Full (`__x86_64__` exemption) | Full (`__aarch64__` exemption) | Missing: [Issue #4546](https://github.com/facebook/zstd/issues/4546) requests `__riscv_misaligned_fast` check; open since 2025-12-10, no PR yet |

RVV dispatch is done via inline `#elif defined ZSTD_ARCH_RISCV_RVV` blocks inside existing source files. There is no separate dispatch table and no dynamic runtime detection; all RVV paths are compile-time gated.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Make-based cross-compilation (canonical pattern from CI):**

Baseline build with QEMU test:
```
LDFLAGS="-static" CC=riscv64-linux-gnu-gcc-14 QEMU_SYS=qemu-riscv64-static make clean check
```

RVV build with QEMU at vlen=128, 256, 512:
```
CFLAGS="-march=rv64gcv -O3" LDFLAGS="-static -DMEM_FORCE_MEMORY_ACCESS=0" \
  CC=riscv64-linux-gnu-gcc-14 \
  QEMU_SYS="qemu-riscv64-static -cpu rv64,v=true,vlen=128" \
  make clean check
```

Replace `vlen=128` with `256` and `512` for the remaining two CI runs.

`-DMEM_FORCE_MEMORY_ACCESS=0` is passed explicitly in the vector runs to prevent unaligned memory access patterns that fail under QEMU's stricter memory model.

**Required toolchain versions:**

The RVV intrinsics path in `lib/common/compiler.h` is gated:
```c
#if defined(__riscv) && defined(__riscv_vector)
#  if ((defined(__GNUC__) && !defined(__clang__) && __GNUC__ >= 14) || \
       (defined(__clang__) && __clang_major__ >= 19))
#    define ZSTD_ARCH_RISCV_RVV
#  endif
#endif
```

- GCC minimum: **14.0** (first release with stable `<riscv_vector.h>` and RVV 1.0 intrinsics)
- Clang minimum: **19.0** (RVV intrinsics ABI stabilized in Clang 19)
- Cross-compile package on Ubuntu 24.04: `gcc-14-riscv64-linux-gnu` (from apt)
- `-march=rv64gcv` required to define `__riscv_vector` at compile time

Below these minimums zstd builds and runs correctly on riscv64 but without SIMD acceleration.

**CMake cross-compilation:**

zstd does not ship a CMake toolchain file for riscv64. Supply your own:
```
cmake -S . -B build-riscv64 \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc-14 \
  -DCMAKE_FIND_ROOT_PATH=/usr/riscv64-linux-gnu \
  -DCMAKE_FIND_ROOT_PATH_MODE_PROGRAM=NEVER \
  -DCMAKE_FIND_ROOT_PATH_MODE_LIBRARY=ONLY \
  -DCMAKE_FIND_ROOT_PATH_MODE_INCLUDE=ONLY \
  -DCMAKE_BUILD_TYPE=Release
cmake --build build-riscv64
```

CMake minimum version is 3.10. No riscv64-specific `-DUSE_X=OFF` flags are required.

**No Dockerfiles for riscv64 exist** in the repository. All CI testing uses inline QEMU user-space emulation.

**Known build issue (historical):** [PR #3134](https://github.com/facebook/zstd/issues/3134) (2022-05-19) reported a linker error in pzstd on a StarFive VisionFive riscv64 board under NixOS 22.05 with GCC 11.3.0. This was the same class of atomic linking problem fixed in 2018 by [PR #1103](https://github.com/facebook/zstd/pull/1103). Status as of 2026-06: closed; root cause assumed to be resolved by the earlier fix, but the issue was closed without an explicit resolution note.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps (riscv64 cannot do X, or X is worse):**

1. Huffman decompression: riscv64 uses the 3-way C loop. The 4-way loop (`HUF_4X2_4WAY`), which is enabled for aarch64, is not enabled for riscv64 in the current dev branch. PR [#4622](https://github.com/facebook/zstd/pull/4622) adds it; benchmarks show +0.91% decompression. The PR has been waiting for a second review response since 2026-03-24.

2. Sequence decode fast path: riscv64 falls through to the scalar path. On amd64 this is handled via a BMI2 dispatch table. PR [#4557](https://github.com/facebook/zstd/pull/4557) (Alibaba Linux) extends the generic fast path to riscv64 with 0.5-2.9% decompression gains; no maintainer has responded since 2025-12-22.

3. Unaligned memory access: on amd64 and aarch64, `MEM_FORCE_MEMORY_ACCESS=2` (direct type-punned cast) is used where the hardware supports it. On riscv64, even on hardware with the Zicclsm extension (which guarantees hardware misaligned access), the code defaults to Method 0 (byte-by-byte via `memcpy`). PR [#4596](https://github.com/facebook/zstd/pull/4596) auto-detects `__riscv_zicclsm` and enables Method 2; benchmarks show +74% compression speed on SG2044 (42.5 MB/s to 74.2 MB/s). The PR has `terrelln` approval in principle but Cyan4973 has not responded since 2026-03-02.

4. Prefetch hints: not enabled for riscv64. PRs [#4643](https://github.com/facebook/zstd/pull/4643) and [#4668](https://github.com/facebook/zstd/pull/4668) add them; gains are 0.1-9% depending on workload. Neither has received a review.

5. `ZSTD_count` vectorization: the match-length counting loop is scalar on riscv64. PR [#4629](https://github.com/facebook/zstd/pull/4629) adds RVV intrinsics for +7.47% compression. No review since opened 2026-03-25.

6. `xxhash.h` unaligned access exemption: x86 and aarch64 both skip the alignment check in `xxhash.h`. riscv64 does not, even on Zicclsm-capable hardware. [Issue #4546](https://github.com/facebook/zstd/issues/4546) tracks this; no PR has been opened.

**Performance gap summary (riscv64 vs aarch64 on comparable hardware):**

No public head-to-head benchmark comparing riscv64 and aarch64 performance was found in any search result, GitHub PR, or benchmark report from 2024-2026. The following are inferred from before/after data within individual riscv64 PRs:

- On SG2044 without Zicclsm optimization: baseline compression 42.5-64 MB/s, decompression 102-237 MB/s
- With Zicclsm (`MEM_FORCE_MEMORY_ACCESS=2`, PR [#4596](https://github.com/facebook/zstd/pull/4596)): compression reaches 74.2 MB/s (+74%)
- With `-mno-strict-align` (PR [#4584](https://github.com/facebook/zstd/pull/4584)): compression 75.2 MB/s (+17.5%), decompression 165 MB/s (+60.5%)
- PR [#4668](https://github.com/facebook/zstd/pull/4668) on a different (higher-clocked) RV64GC system: 337 MB/s compression baseline, 2763 MB/s decompression baseline - indicating substantial variation between RISC-V boards

The large decompression gap on SG2044 (~100 MB/s with default flags vs 165 MB/s with alignment flags) is unresolved in the current dev branch.

**Security hardening gaps:** None found. zstd has no RISC-V-specific security gaps identified in any search result.

**Floating-point / NaN issues:** No floating-point correctness issues specific to RISC-V exist in the tracker. A search for `riscv nan floating` on facebook/zstd returned zero results.

---

## 7. CI/CD Infrastructure

RISC-V CI exists in a single job (`qemu-consistency`) in one file: `.github/workflows/dev-short-tests.yml`.

**Trigger:**
```yaml
on:
  pull_request:
    branches: [ dev, release, actionsTest ]
```

This is PR-only. There is no push CI, no nightly CI, and no scheduled CI for RISC-V. The `nightly.yml` and `commit.yml` workflow files contain zero RISC-V references.

**Runner:** `ubuntu-24.04` (x86-64 host). No native RISC-V runner. No RISE runners are used.

**Emulation:** `qemu-riscv64-static` (QEMU user-mode, not full system emulation).

**Cross-compiler:** `gcc-14-riscv64-linux-gnu` from apt.

**Test runs per PR:**
1. Baseline `rv64gc`, no vector extension, `make clean check`
2. `rv64gcv` with `vlen=128` (emulated RVV)
3. `rv64gcv` with `vlen=256`
4. `rv64gcv` with `vlen=512`

All four runs use static linking. The vector runs pass `MEM_FORCE_MEMORY_ACCESS=0` to avoid QEMU alignment issues.

**CI comparison:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI trigger | Push + PR, all branches | Push + PR, all branches [NEEDS VERIFICATION] | PR to dev/release/actionsTest only |
| Runner | Native x86-64 | Native [NEEDS VERIFICATION] | x86-64 host + QEMU |
| Hardware | Physical | Physical [NEEDS VERIFICATION] | Emulated |
| Vector variants tested | SSE2/AVX2/BMI2 | NEON/SVE [NEEDS VERIFICATION] | RVV vlen=128/256/512 (emulated) |
| Nightly/scheduled | Yes | Yes [NEEDS VERIFICATION] | No |
| Release-blocking | Yes | Yes [NEEDS VERIFICATION] | No |

No GitLab CI (`.gitlab-ci.yml`) exists. A `.cirrus.yml` exists but targets FreeBSD/amd64 only.

---

## 8. Distribution and Release Status

**GitHub release assets (v1.5.5 through v1.5.7):**
- Assets per release: source tarballs (`.tar.gz`, `.tar.zst` with `.sha256` and `.sig` variants) and Windows binaries (`win32.zip`, `win64.zip`)
- No Linux architecture-specific binaries are distributed by upstream via GitHub releases - no amd64, no aarch64, no riscv64
- Latest release: v1.5.7, published 2025-02-19
- v1.6.0 is pending ([issue #4653](https://github.com/facebook/zstd/issues/4653)); PR [#4525](https://github.com/facebook/zstd/pull/4525) (riscv64 arch detection) merged after v1.5.7, so this fix will first appear in v1.6.0

**Ubuntu 24.04 (Noble):**
- Package `zstd` version 1.5.5+dfsg2-2build1 available for riscv64 (507.4 kB binary, 1,886.0 kB installed)
- `libzstd1`, `libzstd-dev`, `python3-zstd`, and 11 other related packages available for riscv64
- Source: [packages.ubuntu.com/noble/zstd](https://packages.ubuntu.com/noble/zstd)

**Debian sid:**
- Package `zstd` version 1.5.7+dfsg-3+b2 available for riscv64 as an official port
- Listed alongside amd64, arm64, armhf, i386, loong64, ppc64el, s390x
- Source: [packages.debian.org/sid/zstd](https://packages.debian.org/sid/zstd)

**PyPI (`zstd` Python binding, latest 1.5.7.3):**
- Pre-built wheels cover: x86_64, i686, aarch64, arm64, win32, win_amd64
- No riscv64 wheel exists. Users on riscv64 must build from source tarball.
- RISE Python wheel builder does not host a riscv64 wheel for `zstd`. The RISE builder does include `pyzstd` (a separate Python binding package), but not `zstd`.

**Arch Linux RISC-V port:**
- Could not be confirmed by direct package database query (site uses JS-rendered package search, mirror directory listings returned 404)
- Policy at archriscv.felixc.at states packages not listed on the status page are "either up-to-date or in the blacklist." Since zstd is a foundational library with no known build issues, it is most likely available but this is an inference, not confirmed data.

**To obtain a working riscv64 binary today:**
- Install from Debian or Ubuntu package manager: `apt install zstd libzstd-dev` on any riscv64 Debian/Ubuntu system
- Build from source using `CC=riscv64-linux-gnu-gcc-14 CFLAGS="-march=rv64gcv -O3" make` for an optimized build

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| pthreads (glibc) | Optional multithreading (`ZSTD_MULTITHREAD_SUPPORT`) | Pass | Pass (in QEMU CI since PR #4502) | Shipped in Debian/Ubuntu | No issues |
| xxhash (bundled) | Content checksums (XXH32/XXH64); bundled as `lib/common/xxhash.c` | Pass (pure C99) | Pass (included in `make check`) | Bundled in all releases | No riscv64 exemption in `xxhash.h` unaligned access check; [issue #4546](https://github.com/facebook/zstd/issues/4546) open |
| zlib (optional) | `zlibWrapper`: drop-in zlib replacement mode | Pass | Partial (no Linux riscv64 CI) | Debian/Ubuntu ship | RVV Adler32 PR unmerged upstream; see `reports/zlib.md` |
| LZ4 (optional) | `zlibWrapper` parity; appears in contrib build targets | Pass (since v1.10.0, Jul 2024) | Partial (QEMU Tier 3 CI) | v1.10.0 released Jul 2024 | Fast decode loop not enabled for riscv64; 5 open RVV PRs; see `reports/lz4.md` |
| liblzma / xz-utils (optional) | Legacy stream format support (`-DZSTD_LZMA_SUPPORT=ON`) | Pass (RISC-V BCJ filter in v5.8.0, Mar 2025) | Partial (no upstream riscv64 CI runner) | v5.8.0 (Mar 2025) first stable with RISC-V BCJ | `TUKLIB_FAST_UNALIGNED_ACCESS` depends on `__riscv_misaligned_fast`; see `reports/xz.md` |

**Deep-dive: xxhash (bundled)**

The bundled copy of xxhash in zstd is a vanilla C implementation with no RVV optimization. The upstream xxhash project has RVV-accelerated XXH3 work in progress, but zstd uses XXH64 internally (not XXH3), so the upstream RVV work has no direct impact on zstd's bundled copy. The practical gap is the missing `__riscv_misaligned_fast` check in `xxhash.h` ([issue #4546](https://github.com/facebook/zstd/issues/4546)): on Zicclsm-capable hardware, xxhash could skip the alignment check as it does on x86/aarch64, yielding a small throughput improvement. No benchmark quantifying this gap was found in the research data.

**Deep-dive: LZ4 (optional dependency)**

LZ4 is only used when building the `zlibWrapper` contrib or when a consumer explicitly links against both. The `LZ4_FAST_DEC_LOOP`, which provides significant decompression acceleration, is not enabled for riscv64 in LZ4 (3 open PRs covering this: #1678, #1686, #1739 in the lz4 repo). This means any application using both zstd's zlibWrapper and LZ4 in the same binary will encounter the LZ4 riscv64 performance gap independently of zstd's own gaps.

---

## 11. Known Bugs and Active Issues

**Correctness issues:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #4502](https://github.com/facebook/zstd/pull/4502) | Bug in `ZSTD_row_getRVVMask()` | Fixed (merged 2025-09-30) | Medium | Correctness fix for RVV codepath; was silent corruption, not crash |
| [PR #4525](https://github.com/facebook/zstd/pull/4525) | RISC-V 64-bit not recognized as `__64BIT__` | Fixed (merged 2025-12-02) | High | Without this, riscv64 builds used 32-bit code paths silently; present in all releases through v1.5.7 |

**Performance/feature issues (open):**

| ID | Title | Status | Impact | Notes |
|---|---|---|---|---|
| [Issue #4546](https://github.com/facebook/zstd/issues/4546) | Add RISC-V unaligned access check to xxhash.h | Open (2025-12-10) | Low | `__riscv_misaligned_fast` not respected; no PR yet |
| [PR #4557](https://github.com/facebook/zstd/pull/4557) | Add RISC-V 64-bit support to sequence decoding optimization path | Open (2025-12-22) | Medium | No maintainer response in 6 months; Alibaba Linux contributor |
| [PR #4584](https://github.com/facebook/zstd/pull/4584) | Add `-mno-strict-align` flag for RISC-V | Open (2026-02-04) | High | +17-60% perf; superseded in maintainer discussion by #4596 |
| [PR #4596](https://github.com/facebook/zstd/pull/4596) | Enable `MEM_FORCE_MEMORY_ACCESS=2` for Zicclsm RISC-V | Open (2026-02-28) | High | +74% compression; `terrelln` approved direction; Cyan4973 non-responsive |
| [PR #4622](https://github.com/facebook/zstd/pull/4622) | Enable 4-way fast Huffman decode loop on riscv64 | Open (2026-03-12) | Medium | +0.91% decompression; benchmarks provided; second review requested but not received |
| [PR #4629](https://github.com/facebook/zstd/pull/4629) | Optimize `ZSTD_count` with RVV intrinsics | Open (2026-03-25) | Medium | +7.47% compression; no review at all |
| [PR #4643](https://github.com/facebook/zstd/pull/4643) | Enable `PREFETCH_L1` for RISC-V | Open (2026-04-15) | Low | +0.14% decompression; no review |
| [PR #4668](https://github.com/facebook/zstd/pull/4668) | Prefetch optimization in doubleFast compressor for riscv64 | Open (2026-05-14) | Medium | +9% compression, +8% decompression; no review |

No crash bugs, no NaN/floating-point correctness issues, and no security vulnerabilities specific to riscv64 were found in the research data.

---

## 12. Objections and Upstream Blockers

**Maintainer non-response (high severity):**
The dominant blocker is Cyan4973's review queue. Seven RISC-V PRs covering substantial performance work have been open between 2-6 months with no merge. `terrelln` has indicated willingness to merge PR [#4596](https://github.com/facebook/zstd/pull/4596) but is explicitly deferring to Cyan4973. The pattern is consistent: Cyan4973 merges RISC-V patches eventually (PR [#4525](https://github.com/facebook/zstd/pull/4525) took about 6 weeks from open to merge), but there is no predictable timeline.

**C99 undefined behavior concern (PR #4524, now #4596):**
An earlier RISC-V PR ([#4524](https://github.com/facebook/zstd/pull/4524)) was rejected by Cyan4973 on the grounds that `MEM_FORCE_MEMORY_ACCESS=2` uses a `union`-based type pun that is UB in C99 (though defined in C11 and by GCC/Clang extensions). The follow-up PR ([#4596](https://github.com/facebook/zstd/pull/4596)) reframed the approach, and `terrelln` accepted it, but Cyan4973 has not weighed in. This means there is a non-zero probability of rejection on the same grounds.

**Contributor concentration risk:**
Polaris-911 and zijianli1234 account for the majority of open RISC-V PRs. If these contributors disengage, the optimization pipeline stalls. There is no Qualcomm, NVIDIA, SiFive, or Red Hat involvement in zstd RISC-V work visible in any search result.

**Acceptance probability assessment:**
- PRs that mirror existing aarch64 functionality with benchmarks ([#4622](https://github.com/facebook/zstd/pull/4622) HUF 4-way, [#4643](https://github.com/facebook/zstd/pull/4643) prefetch): high probability of eventual acceptance, as they follow an established pattern
- RVV intrinsic PRs ([#4629](https://github.com/facebook/zstd/pull/4629)): medium probability; zstd has already merged RVV intrinsics (#4399, #4502), so precedent exists
- Unaligned access PR ([#4596](https://github.com/facebook/zstd/pull/4596)): medium-low; faces the C99/UB objection from a prior round; not rejected but not cleared
- Sequence decode fast path ([#4557](https://github.com/facebook/zstd/pull/4557)): low-medium due to 6 months of silence; the contributor is from Alibaba and may not be actively engaging

---

## 13. Investment Analysis

RISE has no direct involvement with zstd. RISE builds riscv64 wheels for `pyzstd` (a separate Python wrapper) as part of its Python ecosystem work, but has not sponsored any zstd-specific CI, upstream engineering, or optimization work.

### 13.1 Functional Enablement

All functional gaps are addressed by open PRs from community contributors. No new code needs to be written. The gap is reviewer throughput at Meta.

If Qualcomm or RISE engages directly with Cyan4973 or terrelln to expedite review of the open PR queue, the functional gaps (Huffman 4-way, sequence decode fast path, unaligned access) could close within 1-2 quarters without any new engineering investment.

### 13.2 Performance Optimization

Open PRs cover the highest-impact performance items. Quantified gains from pending PRs:

- Unaligned access (PR [#4596](https://github.com/facebook/zstd/pull/4596)): +74% compression on Zicclsm hardware
- `ZSTD_count` RVV (PR [#4629](https://github.com/facebook/zstd/pull/4629)): +7.47% compression
- doubleFast prefetch (PR [#4668](https://github.com/facebook/zstd/pull/4668)): +9% compression, +8% decompression
- Huffman 4-way (PR [#4622](https://github.com/facebook/zstd/pull/4622)): +0.91% decompression
- Sequence decode fast path (PR [#4557](https://github.com/facebook/zstd/pull/4557)): +0.5-2.9% decompression

Hand-written assembly (`huf_decompress.S` equivalent for riscv64) does not exist and is not in any open PR. This is the largest single remaining gap. Effort to develop this is substantial (the amd64 `.S` file is roughly 500 lines of hand-tuned BMI2 assembly).

### 13.3 CI/CD Infrastructure

Current CI is QEMU-only, PR-triggered only, x86 host. Two gaps with meaningful impact:

1. Native RISC-V CI runner: would catch regressions on hardware where QEMU behavior diverges (particularly for unaligned access and memory ordering)
2. Push/nightly trigger: would prevent silent breakage between PR cycles

A RISE-hosted native riscv64 CI runner integrated into `.github/workflows/dev-short-tests.yml` (or a separate workflow file) would close both gaps simultaneously and would provide Meta a zero-maintenance RISC-V test infrastructure.

### 13.4 Ecosystem Enablement

The `zstd` PyPI package has no riscv64 wheel. Adding riscv64 to the wheel build matrix requires changes to the package's CI (separate from facebook/zstd; the `zstd` PyPI package is a third-party binding, not Meta's code). This is a distinct project from the core library and is out of scope for direct facebook/zstd investment, but affects any Python workload on riscv64 that uses this binding.

RISE already builds `pyzstd` riscv64 wheels. The `zstd` PyPI binding is a separate item that is not currently covered.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Drive review and merge of PR #4596 (unaligned access, Zicclsm) | 1 | Qualcomm / RISE upstream engagement | Critical |
| Functional | Drive review and merge of PR #4622 (Huffman 4-way) | 1 | Qualcomm / RISE upstream engagement | High |
| Functional | Drive review and merge of PR #4557 (sequence decode fast path) | 1 | Qualcomm / RISE upstream engagement | High |
| Performance | Drive review and merge of PR #4629 (RVV ZSTD_count, +7.5% compression) | 1 | Qualcomm / RISE upstream engagement | High |
| Performance | Drive review and merge of PR #4668 (doubleFast prefetch, +9% compression) | 1 | Qualcomm / RISE upstream engagement | Medium |
| Performance | Drive review and merge of PR #4643 (PREFETCH_L1, +0.1-0.3%) | 0.5 | Qualcomm / RISE upstream engagement | Low |
| Performance | Write riscv64 Huffman fast-loop assembly equivalent to `huf_decompress_amd64.S` | 8-12 | Qualcomm compiler/asm team | Medium |
| CI/CD | Add native RISC-V runner to zstd CI (push + PR triggers) | 2 | RISE infrastructure | High |
| CI/CD | Add nightly RISC-V CI workflow | 1 | RISE infrastructure | Medium |
| Ecosystem | Add riscv64 wheel to `zstd` PyPI package CI (third-party binding) | 2 | RISE Python wheel effort | Low |

The highest-leverage action is the upstream engagement column: 5 person-weeks of review coordination could unlock 7 PRs already written by community contributors, delivering 10-74% performance improvements without new code investment.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [PR #1103: Fix riscv (pzstd atomic linking)](https://github.com/facebook/zstd/pull/1103)
- [PR #4114: Enable weak symbols for RISC-V](https://github.com/facebook/zstd/pull/4114)
- [PR #4399: RVV vectorization for convertSequences and get1BlockSummary](https://github.com/facebook/zstd/pull/4399)
- [PR #4422: Draft riscv rvv ci (closed)](https://github.com/facebook/zstd/pull/4422)
- [PR #4435: Add riscv ci (QEMU, vlen 128/256/512)](https://github.com/facebook/zstd/pull/4435)
- [Issue #4471: Add RISC-V Vector (RVV) Support for XXH3](https://github.com/facebook/zstd/issues/4471)
- [PR #4483: Add xxh3 RISCV-V implementation from xxhash repo (closed)](https://github.com/facebook/zstd/pull/4483)
- [PR #4502: Modify GCC version for RISCV CI; fix ZSTD_row_getRVVMask; add RVV to ZSTD_copy16](https://github.com/facebook/zstd/pull/4502)
- [PR #4524: Add RISC-V Zicclsm support to MEM_FORCE_MEMORY_ACCESS (closed, superseded)](https://github.com/facebook/zstd/pull/4524)
- [PR #4525: Add RISC-V 64-bit architecture detection](https://github.com/facebook/zstd/pull/4525)
- [Issue #4546: Add RISC-V unaligned access to xxhash.h](https://github.com/facebook/zstd/issues/4546)
- [PR #4557: Add RISC-V 64-bit support to sequence decoding optimization path](https://github.com/facebook/zstd/pull/4557)
- [PR #4584: Build: Add -mno-strict-align flag for RISC-V architecture](https://github.com/facebook/zstd/pull/4584)
- [PR #4596: enable MEM_FORCE_MEMORY_ACCESS=2 for RISC-V targets with zicclsm](https://github.com/facebook/zstd/pull/4596)
- [PR #4622: huf_decompress: enable 4-way fast loop on riscv64](https://github.com/facebook/zstd/pull/4622)
- [PR #4629: Optimize ZSTD_count with RISC-V Vector (RVV) intrinsics](https://github.com/facebook/zstd/pull/4629)
- [Issue #4643: Enable PREFETCH_L1 for RISC-V to improve performance](https://github.com/facebook/zstd/pull/4643)
- [PR #4653: About 1.6.0 release schedule](https://github.com/facebook/zstd/issues/4653)
- [PR #4668: riscv: add prefetch optimization for doubleFast compressor](https://github.com/facebook/zstd/pull/4668)
- [Issue #3134: Contrib build fails on riscv64 hardware](https://github.com/facebook/zstd/issues/3134)
- [zstd releases page](https://github.com/facebook/zstd/releases)
- [zstd on packages.ubuntu.com Noble](https://packages.ubuntu.com/noble/zstd)
- [zstd on packages.debian.org sid](https://packages.debian.org/sid/zstd)
- [zstd on PyPI](https://pypi.org/project/zstd/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [IETF RFC 8878 (zstd standard)](https://datatracker.ietf.org/doc/html/rfc8878)