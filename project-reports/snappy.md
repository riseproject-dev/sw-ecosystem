---
title: snappy
parent: Project Reports
color: blue
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: benchmark
    relation: test-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: LZO2
    relation: runtime-dependency
    criticality: optional
  - name: LZ4
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="snappy" %}

# snappy

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for snappy<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Snappy is a fast byte-oriented compression/decompression library written in C++11, developed by Google. It explicitly does not target maximum compression ratio; the stated goal is throughput, with a baseline of 250+ MB/s compression and 500+ MB/s decompression on a single x86 core (Core i7 reference, per upstream documentation).

**Governance:** Snappy is a plain Google-owned GitHub repository ([github.com/google/snappy](https://github.com/google/snappy)) with no software-foundation affiliation (not Apache, CNCF, Linux Foundation, or OpenSSF). License is **BSD-3-Clause**. `CONTRIBUTING.md` is Google's standard generic open-source template: a Google CLA is required for every external contribution, and review happens through ordinary GitHub PRs. No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, or `PLATFORMS.md` file exists at the default branch (direct fetches of `MAINTAINERS` and `PLATFORMS.md` both returned HTTP 404), so there is no written, named maintainer roster or tiered-governance structure.

**Maintainer activity:** `danilak-G` is the sole active reviewer/merger observed across every RISC-V pull request examined (PRs #213, #214, #220). He described the project as "mostly in maintenance mode" when declining a timely review of an early RVV contribution (PR #212). Specific commit-count attributions and corporate affiliations for individual maintainers (e.g., a claim that `danilak-G` is a named Google engineer with 39 commits, or that `pwnall`/`sesse` are the top two historical contributors with 105/19 commits) could **not be independently verified**: the GitHub contributors graph did not render usable data for this research pass, and no `MAINTAINERS` file exists to cross-check against. **[NEEDS VERIFICATION]**

**Stated platform scope:** The README/CONTRIBUTING.md scope statement says Snappy "explicitly supports" C++11, Clang, and low-level optimizations for **x86, x86-64, ARMv7, ARMv8**. RISC-V is not in this list, and the document states that "changes adding features or dependencies outside of the core area of focus... might not be accepted," with build-configuration contributions called out as unlikely to be accepted because Google prioritizes its own internally-tested configurations.

**Actual community stance on RISC-V:** Despite the conservative written policy, RISC-V-related commits have been merged since mid-2025, and the repository carries a dedicated riscv64 QEMU CI workflow. This indicates informal, incremental tolerance for RISC-V contributions that is not reflected in the written contribution scope. The majority of the optimization work is driven by contributor `anthony-zy`, confirmed in PR #213's review thread to be associated with the email domain `zte.com.cn` (ZTE). Contributor `yunfeizhou2025` (git identity "Zhou Yunfei", email `xdzyf2012@gmail.com`) authored the FindMatchLength 64-bit guard (PR #220); a corporate (e.g. Alibaba) affiliation for this contributor could not be confirmed from the commit/PR metadata itself and is **[NEEDS VERIFICATION]**. CI-hardening contributor `Alb3e3` (PR #243) has no affiliation data available.

**RISE Project involvement:** Google LLC is a RISE Premier Member (alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent). ZTE is a RISE General Member. But snappy itself has **no RISE project designation, no RISE blog coverage, no RISE wheel-builder entry, and no dedicated RISE tracking repo or issue**. The RISE blog's full WordPress sitemap (36 posts through mid-2026) contains zero mentions of "snappy" or compression. The sole RISE-owned record of this work is a one-line status entry in RISE TSC meeting notes (Nov 20, 2025, "Deep Dive System Libraries" segment): "Snappy: RVV optimization [merged]," linking to [PR #213](https://github.com/google/snappy/pull/213) - no RISE funding or engineering time is implied by that note. All RISC-V work on snappy is community-driven.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work discussed below is upstream in `main`; no out-of-tree fork or vendor patch tree exists.

| Date | Event | Source |
|---|---|---|
| 2025-07-01 | PR #208 opened: benchmark submodule fix (Linux 6.6+ blocks privileged `rdcycle`; bump to a `rdtime`-based submodule commit) | [PR #208](https://github.com/google/snappy/pull/208) |
| 2025-07-22 | Issue #209 filed: `FindMatchLength` falls back to a slow 32-bit scalar loop on RISC-V instead of the 64-bit unaligned-load/cmov path used on x86-64/PPC/LE-ARM | [Issue #209](https://github.com/google/snappy/issues/209) |
| 2025-07-29 | PR #208 merged by `danilak-G`; verified on SG2042 hardware, openEuler 25.03, kernel 6.6.0 | [PR #208](https://github.com/google/snappy/pull/208) |
| 2025-08-28 | PR #212 opened: early RVV `MemCopy64` (silesia.tar: decompression 186 to 278 MB/s, +49.5%); closed by author without merge after `danilak-G` called the project "mostly in maintenance mode" | [PR #212](https://github.com/google/snappy/pull/212) |
| 2025-09-12 | PR #213 opened by `anthony-zy` (zte.com.cn): clean RVV `MemCopy64` rewrite | [PR #213](https://github.com/google/snappy/pull/213) |
| 2025-10-20 | PR #213 merged. Benchmark (silesia.tar, GCC 13.2.1): decompression 186 to 272 MB/s (+46%), compression unchanged (~64 MB/s) | [PR #213](https://github.com/google/snappy/pull/213) |
| 2025-11-10 | PR #214 opened by `anthony-zy`: gate `__builtin_ctzll` behind the `__riscv_zbb` macro | [PR #214](https://github.com/google/snappy/pull/214) |
| 2025-11-20 | PR #214 merged. Avoids a ~10% regression on cores without Zbb (42.5 to 47.4 MB/s fixed vs. unconditional-builtin baseline); with Zbb hardware, +19.7% overall | [PR #214](https://github.com/google/snappy/pull/214) |
| 2025-12-12 | PRs #216, #217, #218, #219 opened and closed same day: duplicate/CLA-incomplete resubmissions of the FindMatchLength 64-bit guard | [#216](https://github.com/google/snappy/pull/216), [#217](https://github.com/google/snappy/pull/217), [#218](https://github.com/google/snappy/pull/218), [#219](https://github.com/google/snappy/pull/219) |
| 2025-12-12 | PR #220 opened by `yunfeizhou2025`: `__riscv_xlen == 64` guard restricting the fast `FindMatchLength` path to 64-bit RISC-V | [PR #220](https://github.com/google/snappy/pull/220) |
| 2026-04-16 | PR #233 opened: RVV-vectorized `FindMatchLength` (16-byte parallel compares) | [PR #233](https://github.com/google/snappy/pull/233) |
| 2026-04-17 | PR #235 opened: RVV short-memcpy refactor mirroring the x86 AVX fixed 32-byte fast path (+15% decompression, lzbench 269 to 310 MB/s on SpacemiT X60) | [PR #235](https://github.com/google/snappy/pull/235) |
| 2026-04-28 | PR #236 opened: branchless RISC-V decompression tag-advance loop | [PR #236](https://github.com/google/snappy/pull/236) |
| 2026-05-07 | PR #239 opened: RVV-vectorized `FindMatchLengthPlain` (double-hash level-2 path) | [PR #239](https://github.com/google/snappy/pull/239) |
| 2026-05-09 | PR #220 merged (~5 months after its "please review" ping), commit `70a0e1c`. Same day: PR #233 remained unmerged; PR #236 closed as a duplicate "of #234"; PR #239 closed; PR #240 (`ExtractOffset` for RISC-V) closed as a "sub-patch of #236" | [PR #220](https://github.com/google/snappy/pull/220), [PR #236](https://github.com/google/snappy/pull/236), [PR #240](https://github.com/google/snappy/pull/240) |
| 2026-06-11 | PR #243 opened: pin CI Actions to commit SHAs, add `permissions: read-all` to `riscv64-qemu-test.yaml` | [PR #243](https://github.com/google/snappy/pull/243) |
| 2026-06-29 | PR #233 closed without merge (author deleted the branch) | [PR #233](https://github.com/google/snappy/pull/233) |
| 2026-07-06/07 | PR #246 (resubmission of #235) opened and closed without merge | [PR #246](https://github.com/google/snappy/pull/246) |
| 2026-08-24 | PR #243's Google CLA check clears, ~2.5 months after opening; still awaiting maintainer review as of this report | [PR #243](https://github.com/google/snappy/pull/243) |
| 2026-08-28 | PR #256 opened (resubmission of #233): RVV `FindMatchLength` vectorization, still open | [PR #256](https://github.com/google/snappy/pull/256) |
| 2026-09-14 | Release **1.3.0**: first tagged release to include PRs #208, #213, #214, #220 (no release shipped between 1.2.2 on 2025-03-26 and this one) | [Releases](https://github.com/google/snappy/releases) |
| 2026-09-18 | Release **1.3.1** | [Releases](https://github.com/google/snappy/releases) |

**Key contributors:**

| Contributor | Affiliation | Contributions |
|---|---|---|
| `anthony-zy` | ZTE (`zte.com.cn`, confirmed in PR #213 review thread) | Bulk of merged optimization work: PRs #213 (RVV MemCopy64), #214 (Zbb-gated ctz), and the short-memcpy proposal #235 |
| `yunfeizhou2025` / "Zhou Yunfei" | Not independently confirmed (personal gmail.com address in commit metadata) [NEEDS VERIFICATION] | PRs #216-#220 (FindMatchLength 64-bit guard) |
| `Alb3e3` | Not stated | PR #243 (CI hardening) |
| `danilak-G` | Google (inferred from maintainer role) | Sole reviewer/merger for all merged RISC-V PRs |

**Discrepancy flag on PR provenance:** The primary PR-tracking pass of this research enumerates only four merged RISC-V PRs (#208, #213, #214, #220). However, that same research records PR #236 as closed "dup of #234" and PR #240 as closed as a "sub-patch of #236" - both annotations imply a PR #234 exists and was itself merged (consistent with 2026-05-09, the date on which #220 merged and #236/#239/#240 were closed). Independently, direct source inspection of `snappy.cc` at commit `9c28114` confirms that the features those closed PRs targeted - a Zicond-friendly branchless `AdvanceToNextTagRVOptimized` tag-decode loop and a shared AArch64/RISC-V `ExtractOffset` bit-trick - **are present and functional in `main` today**. The exhaustive-looking 16-PR enumeration from the primary pass therefore appears incomplete (it omits PR #232 and PR #234 entirely), while cross-references within that same dataset and the verified source content both indicate those two PRs did land. This report treats `AdvanceToNextTagRVOptimized` and the shared `ExtractOffset` as merged, functional code (source-verified), while flagging the exact PR numbers/dates (#232, #234) as **[NEEDS VERIFICATION]** against a clean GitHub API read.

---

## 3. Upstream Support Tier

No formal tiered-platform policy document (`PLATFORMS.md` or equivalent) exists. The de-facto policy is the CONTRIBUTING.md scope statement limiting official support to x86, x86-64, ARMv7, ARMv8. RISC-V sits outside that written scope but has nonetheless accumulated merged optimizations and a dedicated CI job.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in CONTRIBUTING.md scope | Yes | Yes | No |
| CI on every push/PR | Yes (`build.yml`) | Yes (`build.yml`, via `macos-latest`) | Yes (`riscv64-qemu-test.yaml`) |
| Native CI runner | Yes | Yes (macOS arm64) | No - QEMU user-mode emulation on an x86-64 GitHub-hosted runner |
| CI covers vector/SIMD paths | Yes (avx, avx2 matrix) | Implicit (NEON always on) | Uncertain - no explicit `-march=rv64gcv` flag is passed, so coverage depends on the cross-toolchain's default target (see Section 5) |
| Official GitHub-release binaries | No (source-only for all arches) | No | No |
| Downstream distro binary packages | Yes | Yes | Yes (Ubuntu, Debian, Arch - Section 8) |
| RISC-V optimizations merged into a tagged release | n/a | n/a | Yes - release 1.3.0 (2026-09-14) is the first tag containing PRs #208, #213, #214, #220 |

**Conclusion:** riscv64 is an unofficial but actively maintained third platform. It is the only architecture in the repository with a dedicated, named CI workflow (arm64 only gets incidental coverage through a generic macOS runner), and merged riscv64 work has now shipped in a tagged release (1.3.0/1.3.1), closing the gap the prior assessment flagged (no release had previously contained the RISC-V work). It remains outside the written contribution scope, has no native hardware CI, and has three PRs (#235, #243, #256) stalled in review.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Snappy has no JIT compiler, no garbage collector, and no cryptographic primitives. All architecture-specific logic lives inline, guarded by preprocessor `#ifdef`/`#if` blocks, inside four shared files - there is no `arch/riscv/` directory, no `.S` assembly files, and no per-architecture source tree for any platform (amd64 and arm64 get zero dedicated files either):

- `CMakeLists.txt` - Zbb-gated `__builtin_ctzll` capability probe; `SNAPPY_RVV_1` / `SNAPPY_RVV_0_7` capability probes for the two RVV intrinsic API generations.
- `cmake/config.h.in` - propagates the RVV probes into generated `config.h`.
- `snappy-internal.h` (449 lines) - RVV macro wrappers (`VSETVL_E8M2`, `VLE8_V_U8M2`, `VSE8_V_U8M2`, e8m2 = 8-bit element, LMUL=2); no floating-point vector types are used anywhere (`vfloat32m1_t` search returned 0 hits) - only 8-bit integer vectors for memcopy.
- `snappy.cc` (2,806 lines) - three RISC-V-specific sites: the RVV `MemCopy64` loop (~lines 1271-1291), `AdvanceToNextTagRVOptimized()` (~lines 1392-1414, called at line 1500), and the shared AArch64/RISC-V `ExtractOffset()` bit-trick (~lines 1434-1439, gated on `__riscv_xlen == 64`).

No stub markers, `TODO`, or "not implemented" comments exist anywhere in the RISC-V-guarded code.

| Component | amd64 | arm64 | riscv64 | ISA extension needed on riscv64 |
|---|---|---|---|---|
| Hash (CRC32) | SSE4.2 `_mm_crc32_u32` - hardware | ARMv8 CRC `__crc32cw` - hardware | Multiplicative scalar fallback only | Zbc (`clmul`/`crc32`) - not implemented, no PR exists |
| V128 byte shuffle (decompression) | SSSE3 `_mm_shuffle_epi8` - full | NEON `vqtbl1q_u8` - full | Missing entirely; `SNAPPY_HAVE_VECTOR_BYTE_SHUFFLE` is never enabled for RVV | RVV `vrgather` - not implemented, no PR exists |
| `MemCopy64` (bulk copy) | AVX fixed 32-byte load/store | Scalar (`memmove`), no NEON path | RVV `vsetvl`/`vle8`/`vse8` loop (e8m2), merged PR #213; a fixed 32-byte two-segment variant mirroring AVX is open in PR #235 | RVV 1.0 (compiled with `-march=...v`) |
| `AdvanceToNextTag` (decode hot loop) | Inline GCC asm with `cmovzq` | `AdvanceToNextTagARMOptimized`, pure C exploiting csinc-friendly codegen | `AdvanceToNextTagRVOptimized`, pure C ternary form written to lower to Zicond `czero.eqz`/`czero.nez` | Zicond (compiler/CPU dependent; not intrinsic-gated) |
| `ExtractOffset` | Dedicated x86 lookup-table path | Shared branchless mask-trick path with riscv64 | Shares the AArch64 trick, gated by `__riscv_xlen == 64` | Base RV64I only |
| `FindMatchLength` | 64-bit path + x86-only inline `cmovzq` asm | 64-bit path, portable ternary (no asm) | 64-bit path enabled by PR #220's `__riscv_xlen == 64` guard, same scalar form as arm64; RVV 16-byte-parallel vectorization open in PR #256 | Base RV64I (merged); RVV (open) |
| ctz / `FindLSBSetNonZero64` | Unconditional `__builtin_ctzll` | Unconditional `__builtin_ctzll` | `__builtin_ctzll` only when `__riscv_zbb` is set (PR #214); portable de-Bruijn bit-trick fallback otherwise | Zbb |

**Quality assessment:** The RISC-V paths are real, hand-written, non-trivial implementations with inline design-rationale comments, gated by working two-generation RVV feature detection plus Zbb, and exercised by a dedicated CI job - not placeholder code. What is missing is narrower but consequential: no Zbc-accelerated CRC32 hash, and no RVV equivalent of the SSSE3/NEON V128 byte-shuffle used in the decompression fast path. The primary compression-side hot path, `FindMatchLength`, has only a correctness/scope guard merged (PR #220); the RVV vectorization that would bring it to x86/ARM throughput parity is still unmerged (PR #256 open, PR #233 closed unmerged).

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake >= 3.10 (`cmake_minimum_required(VERSION 3.10)`), C++11 standard, project version declared as 1.3.1 in `CMakeLists.txt`. No `BUILDING.md`, `INSTALL`, or cross-compilation doc exists; the only riscv64 build reference is the CI workflow itself.

**Feature detection (not user-facing flags):** riscv64 support is entirely compiler-capability auto-detected via `check_cxx_source_compiles` - there is no `-DUSE_RVV=OFF`-style option for any architecture in this project.

1. `HAVE_BUILTIN_CTZ` - on RISC-V this probe additionally requires `__riscv_zbb` to be defined, or the check fails and falls back to the portable implementation.
2. `SNAPPY_RVV_1` - probes `__riscv_vsetvl_e8m1`/`__riscv_vmv_v_x_u8m1` from `<riscv_vector.h>` (RVV 1.0 ratified, `__riscv_`-prefixed API).
3. `SNAPPY_RVV_0_7` - probes unprefixed `vsetvl_e8m1`/`vmv_v_x_u8m1` (RVV 0.7.1 draft API, pre-ratification toolchains). Note: both dialects map onto the same `__riscv_`-prefixed macro names in `snappy-internal.h`, meaning the 0.7.1 branch would not actually compile correctly if ever selected - functionally vestigial.

Data not available: no documented minimum GCC or Clang version for RVV 1.0 intrinsic support appears anywhere in the repository; the project relies on the runtime capability probes above rather than a version gate.

**Exact CI cross-compilation sequence** (`.github/workflows/riscv64-qemu-test.yaml`):

```bash
wget https://github.com/riscv-collab/riscv-gnu-toolchain/releases/download/2025.07.03/riscv64-glibc-ubuntu-24.04-gcc-nightly-2025.07.03-nightly.tar.xz -O riscv-toolchain.tar.xz
sudo tar -xvf riscv-toolchain.tar.xz -C /opt/riscv --strip-components=1
sudo sed -i "s|libdir='/mnt/riscv/riscv64-unknown-linux-gnu/lib'|libdir='/opt/riscv/riscv64-unknown-linux-gnu/lib'|g" \
  /opt/riscv/riscv64-unknown-linux-gnu/lib/libatomic.la

export PATH=/opt/riscv/bin:$PATH
export LD_LIBRARY_PATH=/opt/riscv/lib:$LD_LIBRARY_PATH
export QEMU_LD_PREFIX=/opt/riscv/sysroot

mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release ../
make -j$(nproc)
make test
./snappy_benchmark
```

**Toolchain:** a prebuilt nightly cross-GCC from [riscv-collab/riscv-gnu-toolchain release 2025.07.03](https://github.com/riscv-collab/riscv-gnu-toolchain/releases/tag/2025.07.03) (glibc, Ubuntu-24.04 host build), pinned by exact download URL. There is no CMake toolchain file (`-DCMAKE_TOOLCHAIN_FILE`) and no explicit `CC=`/`CXX=` override; the cross-compiler's `bin/` is simply prepended to `PATH`, and CMake's default compiler search finds `riscv64-unknown-linux-gnu-gcc`/`g++` via PATH precedence. A `sed` fix rewrites a hardcoded `libdir` path baked into the toolchain's `libatomic.la` so `-latomic` resolves correctly on the CI runner's filesystem.

**`-march` flag:** no explicit `-march=rv64gcv` (or similar) is passed anywhere in the CI configure step. The RVV `MemCopy64` path (`snappy.cc`) carries an inline comment stating it requires `-march=rv64gcv` to be reachable. CI relies instead on the riscv-gnu-toolchain nightly's built-in default target, which that distribution is understood to build as an rv64gc-with-V multilib toolchain - meaning the RVV code path is plausibly exercised by CI by default, though this was not independently confirmed against an actual CI run's compiler invocation flags. **[NEEDS VERIFICATION]** This nuance should be weighed against any assumption that CI never exercises RVV code at all; the evidence available indicates the opposite is at least plausible.

**QEMU:** `qemu-user`/`qemu-user-static` are installed via `apt`; no explicit `qemu-riscv64 ...` invocation is present. Cross-compiled riscv64 ELF binaries are transparently dispatched through `binfmt_misc` (registered by `qemu-user-static`), with `QEMU_LD_PREFIX` pointed at the toolchain's sysroot so dynamic libraries resolve correctly. This is QEMU **user-mode** emulation, not full-system emulation, and runs on a standard `ubuntu-latest` x86-64 GitHub-hosted runner - there is no native riscv64 hardware runner in this CI.

**Current CI green status:** not independently confirmed in this research pass (no Actions run-history/API access to the unattached repository); only the workflow file's existence and content were verified directly.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps (cannot do X at all on riscv64):**

| Feature | amd64 | arm64 | riscv64 | Impact |
|---|---|---|---|---|
| Hardware-accelerated CRC32 hash | Yes (SSE4.2) | Yes (ARMv8 CRC) | No - scalar fallback only | Hash speed only; no correctness impact |
| V128 byte shuffle in decompressor | Yes (SSSE3) | Yes (NEON) | No - never enabled for RVV | Decompression fast path unavailable |
| RVV-vectorized `FindMatchLength` | n/a (x86 has its own fast path) | n/a | Open (PR #256, resubmit of closed PR #233) | Compression throughput gap vs. the architectures with hand-tuned fast paths |
| RVV fixed-size `MemCopy64` (AVX-mirrored) | Yes (AVX) | No | Open (PR #235) | Decompression throughput gap |

**Performance deltas (from PR benchmark data, hardware and workload vary - figures are not directly comparable across rows without normalization):**

- Without Zbb: compression ~10% slower than with the Zbb gate applied (42.5 vs. 47.4 MB/s, PR #214 data).
- RVV `MemCopy64` (PR #213, silesia.tar, GCC 13.2.1): decompression 186 to 272 MB/s (+46%); an earlier closed variant (PR #212) measured 186 to 278 MB/s (+49.5%) on the same corpus.
- `AdvanceToNextTagRVOptimized`-class branchless decode loop (SpacemiT X60, lzbench): decompression 233 to 265 MB/s (+13.7%) per one benchmark pass; a related/duplicate submission (PR #236) reported up to +23% on some UFlat workloads (html, urls, txt1, medley).
- `ExtractOffset`-class change (SpacemiT X60 @1.6GHz): UFlat decode +5.1 to +5.8%, UValidate +7.4 to +10.4%.
- PR #235 (open, RVV short-memcpy, SpacemiT X60): lzbench 269 to 310 MB/s (+15%).
- PR #256 (open, RVV `FindMatchLength`, Banana Pi K1 / SpacemiT X60 VLEN=256): Gaviota +13.03%, Protobuf +9.97%, PDF +9.08%, HTML +8.13%, overall ZFlat average **+2.67%**.
- Data not available: a frequency- and core-normalized riscv64-vs-amd64 or riscv64-vs-arm64 head-to-head on identical hardware and workload. All RISC-V numbers above (42-310 MB/s compression, 186-672 MB/s decompression depending on data type and board) are well below the x86 baseline (250+/500+ MB/s), consistent with issue #209's premise that RISC-V ran the slower fallback path before these patches - though see Section 11 for the finding that PR #220 has already moved riscv64 onto the same 64-bit scalar path as arm64.

**Security hardening:** no RISC-V-specific hardening gaps were found; snappy has no cryptographic code paths, and stack-protection/ASLR are OS/compiler responsibilities outside the library.

**Floating-point / NaN:** not applicable - snappy performs no floating-point computation (confirmed: zero `vfloat32m1_t`/floating-vector hits in the RISC-V code, and a targeted search for RISC-V NaN/floating bugs returned zero results).

---

## 7. CI/CD Infrastructure

A dedicated riscv64 CI workflow exists and was verified by direct file read: [`.github/workflows/riscv64-qemu-test.yaml`](https://github.com/google/snappy/blob/main/.github/workflows/riscv64-qemu-test.yaml), last touched 2026-09-18.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI file | `build.yml` | `build.yml` (via `macos-latest`) | `riscv64-qemu-test.yaml` |
| Trigger | `push`, `pull_request` | `push`, `pull_request` | `push`, `pull_request` (no branch filter, no `workflow_dispatch`, no `schedule`) |
| Runner | `ubuntu-latest` (x86-64) | `macos-latest` (native arm64) | `ubuntu-latest` (x86-64), riscv64 execution via QEMU user-mode emulation |
| Native hardware execution | Yes | Yes | No |
| Build tested | Yes | Yes | Yes (`make -j$(nproc)`) |
| Unit tests run | Yes | Yes | Yes (`make test`) |
| Benchmark run | Yes | Yes | Yes (`./build/snappy_benchmark`) |
| Explicit vector-ISA matrix | Yes (baseline/avx/avx2) | Implicit (NEON always on for arm64 builds) | No explicit `-march=rv64gcv`; RVV coverage depends on toolchain default (Section 5) |
| RISE-provided runners | No | No | No - no evidence of RISE's `riscv-runner`/board-farm infrastructure being used for snappy |

**CI security posture:** PR #243 (open, CLA cleared 2026-08-24) would add `permissions: read-all` to `riscv64-qemu-test.yaml` and pin both workflows' `actions/checkout` references to commit SHAs. The PR author's own `zizmor` scan notes 15 pre-existing template-injection findings in `build.yml` that are explicitly out of scope for that PR and remain unaddressed.

**Limitation:** QEMU user-mode emulation does not model real hardware timing; benchmark numbers from this specific CI job (if any are recorded) would not be representative of native riscv64 performance. All quantitative benchmark figures cited elsewhere in this report come from PR authors' own hardware (SG2042, SpacemiT X60, Banana Pi K1), not from this CI job.

---

## 8. Distribution and Release Status

**Upstream GitHub releases:** every release (1.3.1 on 2026-09-18, 1.3.0 on 2026-09-14, 1.2.2, 1.2.1, 1.2.0, 1.1.10) ships **only source archives** (`<tag>.zip`, `<tag>.tar.gz`, GitHub's auto-generated source assets). No binary asset of any kind, for any architecture, has ever been published via [GitHub releases](https://github.com/google/snappy/releases). This is a blanket source-only policy, not a riscv64-specific gap; the 1.3.0 release notes mention "significant RISC-V efficiency improvements" at the source level only.

**All four confirmed-merged riscv64 PRs (#208, #213, #214, #220) - and, per the Section 2 discrepancy note, likely #232/#234 as well - first shipped in release 1.3.0 (2026-09-14).** Prior to that release (which postdates 2.2's March 2025 tag by roughly a year and a half), a user building from a tagged source archive would not have received any of this work; a user today pulling 1.3.0/1.3.1 source does.

**Downstream package availability:**

| Channel | Package(s) | Version | riscv64 | Notes |
|---|---|---|---|---|
| Ubuntu 26.04 "resolute" | `libsnappy1v5`, `libsnappy-dev` | 1.2.2-2 | **Yes** - confirmed with exact artifact: `libsnappy1v5_1.2.2-2_riscv64.deb`, 32,126 bytes, SHA256 `6d9c009466681c2ef4ae88ebc4594e5a95562676dce62b4bcb6203fb625b78a2` | Archs: amd64 arm64 armhf i386 ppc64el **riscv64** s390x |
| Ubuntu 26.04 "resolute" | `python3-snappy` | 0.5.3-1.3build1 | Yes | Also includes riscv64 |
| Ubuntu 26.04 "resolute" | `snappy-tools`, `libsnappy-jni`, `libcompress-snappy-perl` | various | Yes | All include riscv64 in the archive |
| Arch Linux RISC-V (`archriscv`) | `snappy` | 1.2.2-3 | **Yes** - confirmed artifact `snappy-1.2.2-3-riscv64.pkg.tar.zst`, 36.9 KiB, dated 2026-03-05, plus `.sig` | Via [mirrors.sustech.edu.cn/archriscv/repo/extra](https://mirrors.sustech.edu.cn/archriscv/repo/extra/) |
| conda-forge | `snappy-feedstock` | - | Yes | linux-riscv64 platform added via [PR #42](https://github.com/conda-forge/snappy-feedstock/pull/42) and [PR #43](https://github.com/conda-forge/snappy-feedstock/pull/43) |
| PyPI | "snappy" (note: this is an unrelated topology package, "SnapPy") | - | No | macOS/Windows/manylinux1_x86_64 only |
| PyPI | `python-snappy` (the actual Google-Snappy binding) | 0.7.3 | **No** | sdist plus wheels for macosx_x86_64, manylinux_2_17_aarch64, manylinux_2_17_ppc64le only; no riscv64 |
| RISE GitLab PyPI proxy (wheel builder, project 56254198) | `snappy` | - | No | Endpoint 302-redirects straight to upstream PyPI, i.e. no RISE-built wheel is registered |
| RISE wheel-builder supported-package list ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)) | - | - | n/a | `snappy`/`python-snappy` is not among the 86 listed packages |

**To get a working riscv64 binary today:** C/C++ users should install `libsnappy-dev`/`libsnappy1v5` from Ubuntu 26.04 or build 1.3.0+ from source with CMake. Python users have no PyPI wheel option for `python-snappy` on riscv64 (neither upstream PyPI nor the RISE wheel builder carries one) and must compile from source, or use the Arch RISC-V `python-snappy` package if on that distribution.

---

## 9. Dependencies

Snappy has no required runtime dependency. The eight dependencies below are drawn from `CMakeLists.txt` (`HAVE_LIBZ`, `HAVE_LIBLZO2`, `HAVE_LIBLZ4` optional-codec probes used only by the benchmark/test harness), the `third_party/` git submodules and `MODULE.bazel` (googletest, google/benchmark), and the toolchain the project's own CI depends on (CMake, GCC, QEMU).

| Dependency | Role | Criticality | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|---|
| CMake | Build-dependency - the project's sole supported build system (>= 3.10 required) | Critical | Runs on the x86-64 CI host to drive the riscv64 cross-build; a native riscv64 CMake package was not independently checked in this research pass. Data not available: riscv64 archive check for CMake itself | n/a (host-side tool) | n/a | None found |
| GCC | Build-dependency - the riscv64-unknown-linux-gnu cross-compiler used in CI (riscv-gnu-toolchain nightly 2025.07.03) | Critical | Confirmed functional: cross-compiles snappy for riscv64 in CI, pinned by exact release URL | n/a (host-side tool) | n/a | No documented minimum version; project relies on CMake capability probes (`SNAPPY_RVV_1`/`SNAPPY_RVV_0_7`, Zbb check) rather than a GCC version gate |
| QEMU | Test-dependency - `qemu-user`/`qemu-user-static` provide user-mode emulation of the cross-compiled riscv64 binaries via `binfmt_misc` | Critical | Confirmed functional: `make test` and the benchmark binary both execute transparently under QEMU, `QEMU_LD_PREFIX` set to the cross sysroot | Confirmed - this is the mechanism by which `make test`/`snappy_benchmark` run at all on the x86 runner | n/a | None found; QEMU user-mode does not model native timing, so any benchmark figures from this specific CI job would not be representative |
| benchmark (google/benchmark) | Build/test-dependency - vendored via `third_party/benchmark` git submodule, drives `snappy_benchmark` | Critical | Yes | Yes | Debian sid "Installed" (built on `rv-osuosl-01`); **Arch Linux RISC-V has no package at all** (confirmed gap) | The riscv64 crash fixed by snappy's own PR #208 (privileged `rdcycle` blocked under Linux 6.6+) traces to an old pinned submodule commit; upstream google/benchmark had already fixed this via `rdtime` in [PR #833](https://github.com/google/benchmark/pull/833) (merged 2019) - snappy just needed to bump its pin. No further riscv64 issues found against google/benchmark |
| googletest | Build/test-dependency - vendored via `third_party/googletest` git submodule, drives the unit test suite exercised by `make test` | Critical | Yes | Yes, with one caveat | Ubuntu 26.04 lists riscv64 support for `libgtest-dev` | [google/googletest#3756](https://github.com/google/googletest/issues/3756) (open since Feb 2022): `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 - does not affect snappy's own test results, non-blocking |
| zlib | Runtime-dependency - optional benchmark-comparison codec (`HAVE_LIBZ`), not linked into the library itself | Optional | Yes (pure portable C) | No dedicated riscv64 CI found upstream (madler/zlib) | Ubuntu 26.04 riscv64: `zlib1g` 1:1.3.dfsg+really1.3.1-1ubuntu3 | None found; a GitHub issue search for "riscv64" on madler/zlib returned no riscv64-specific hits |
| LZO2 | Runtime-dependency - optional benchmark-comparison codec (`HAVE_LIBLZO2`) | Optional | Yes (pure C) | No dedicated riscv64 CI found | Ubuntu 26.04 riscv64: `liblzo2-2` present | None found; LZO2 is not hosted on GitHub (tarball distribution at oberhumer.com), so issue search was not applicable; no RISE project report exists for it |
| LZ4 | Runtime-dependency - optional benchmark-comparison codec (`HAVE_LIBLZ4`) | Optional | Yes - basic riscv64 support merged upstream | riscv64 added to upstream LZ4 CI (QEMU-based) | Ubuntu 26.04 riscv64: `liblz4-1`/`liblz4-dev`/`lz4` 1.10.0-8 | Benchmark-only dependency for snappy, not blocking. Open riscv64 optimization proposal [lz4/lz4#1635](https://github.com/lz4/lz4/issues/1635), closed Sep 2025, maintainer receptive; PyPI `lz4` wheels have zero riscv64 builds |

None of these dependencies carries a JIT backend, external SIMD library, cryptographic primitive, or memory allocator with riscv64-specific concerns relevant to snappy's own usage - all riscv64-specific hot-path code (CRC32 hash, V128 shuffle gap, RVV `MemCopy64`, Zicond tag advance, Zbb-gated ctz) is inline in snappy's own `snappy.cc`/`snappy-internal.h`, independent of these build/test/benchmark-only dependencies.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #209](https://github.com/google/snappy/issues/209) | Performance Issue with Snappy FindMatchLength on RISC-V | **Open** (filed 2025-07-22, zero comments) | Performance | Reports that `FindMatchLength` falls back to a slower 32-bit scalar loop on RISC-V vs. the 64-bit unaligned-load/cmov path on x86-64/PPC/LE-ARM. A source-level read of current `main` shows the merged PR #220 guard (`__riscv_xlen == 64`) has already moved riscv64 onto the same 64-bit scalar fast path used by arm64 - meaning the issue's literal premise (RISC-V on the "slower" generic path) appears **stale relative to `main`**. The remaining real gap is that even on the 64-bit path, riscv64 lacks the RVV vectorization that PR #256 (open) would add, so a genuine throughput gap vs. hand-tuned x86/ARM paths persists; no maintainer has commented on or closed the issue |
| [PR #256](https://github.com/google/snappy/pull/256) | RISC-V: Add RVV vectorized FindMatchLength optimization (resubmit of #233) | **Open** (2026-08-28) | Performance | +2.67% average, up to +13% on compressible data (Gaviota). Awaiting maintainer review |
| [PR #235](https://github.com/google/snappy/pull/235) | RISC-V: RVV short-memcpy mirrors AVX fast-path | **Open** (2026-04-17) | Performance | +15% decompression (269 to 310 MB/s, SpacemiT X60). Reviewer `camel-cdr` raised an LMUL=1 vs. LMUL=2 tradeoff (LMUL=1 variants measured a further +0.6-1.2%), not yet resolved |
| [PR #243](https://github.com/google/snappy/pull/243) | CI: pin Action references to SHAs, add `permissions: read-all` | **Open** (2026-06-11) | Security/CI hygiene | Google CLA cleared 2026-08-24; scope is narrow and author-verified via `zizmor`; nothing blocks merge except maintainer review bandwidth |

**No correctness bugs** specific to riscv64 are open. PR #220 (the correctness/scope guard preventing the 64-bit `FindMatchLength` fast path from misapplying on 32-bit RISC-V) merged 2026-05-09. Issue #206 (a split-prefix-header correctness regression between v1.2.1 and v1.2.2) is open but is not riscv64-specific.

---

## 12. Objections and Upstream Blockers

**Stated objection (PR #212, 2025-09):** `danilak-G` told the contributor the project is "mostly in maintenance mode" and could not commit to a review timeline, after which the author withdrew the PR. The RVV `MemCopy64` work was later resubmitted cleanly as PR #213 and merged.

**Structural objection (CONTRIBUTING.md):** RISC-V is outside the formally documented scope (x86, x86-64, ARMv7, ARMv8). This has not prevented merges in practice, but it means there is no standing commitment to accept or continue maintaining RISC-V contributions.

**Review bottleneck:** `danilak-G` is the sole observed merger across every examined RISC-V PR. Review latency has been severe and unexplained in at least one case - PR #220 sat from a "please review" ping on 2025-12-18 to merge on 2026-05-09, roughly five months, with no comment in between. Several PRs landed in a same-day batch (2026-05-09: #220 merged, #236/#239/#240 closed), consistent with reviews accumulating and being processed in bursts rather than steadily.

**CLA friction:** PRs #216-#219 (same-day duplicate FindMatchLength-guard submissions) and PR #243's ~2.5-month CLA-clearance delay both show the Google CLA process creating friction for contributors, particularly ones without a pre-existing CLA on file.

**Technical gap:** CI does not pass an explicit `-march=rv64gcv`, so whether the RVV code paths are actually exercised by CI depends on the cross-toolchain's default target - this was not independently confirmed (Section 5). If RVV coverage in CI is in fact absent or partial, a regression in RVV-only code could land undetected.

**Acceptance probability for pending PRs:** PR #235 has received direct maintainer-adjacent review feedback (the LMUL tradeoff from reviewer `camel-cdr`) and a reasonably narrow, well-benchmarked scope - moderate-to-high likelihood of eventual merge, but no fixed timeline given the review bottleneck. PR #256 and PR #243 have cleared process gates (CLA, in #243's case) but show no maintainer engagement yet - acceptance probability is uncertain, weighted down by the "maintenance mode" characterization and the multi-month review latencies observed on comparable prior PRs.

---

## 13. Readiness Assessment

- **Color:** blue (blue has no sub-type in the color model)
- **Release provider:** distro
- **Optimization-purpose project:** yes - **Optimization level: partial**

**Primary color (Step 1):** upstream CI runs `.github/workflows/riscv64-qemu-test.yaml` on every push/PR, cross-compiling for riscv64-linux-gnu and actually executing `make test` (the unit test suite) plus the benchmark binary under QEMU user-mode emulation (build=yes, test=yes), but upstream [GitHub releases](https://github.com/google/snappy/releases) ship source-only archives with zero riscv64 (or any-architecture) binary assets, so release=no upstream. Build+test-yes/release-no maps to blue; the consumable riscv64 binary instead comes from distros - Ubuntu 26.04 "resolute" ships `libsnappy1v5`/`libsnappy-dev`/`python3-snappy` for riscv64 ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=snappy&suite=resolute)).

**Step 2 (optimization modifier):** applies because snappy's stated value proposition is speed, not compression ratio, over a generic reference implementation. A direct read of the live source at commit `9c28114` ([snappy.cc](https://github.com/google/snappy/blob/main/snappy.cc)) confirms genuine, merged RISC-V-specific code covering real hot paths: an RVV-vectorized `MemCopy64` (PR #213, merged, +46-49% decompression), a Zicond-friendly branchless `AdvanceToNextTagRVOptimized` tag-decode loop, a shared AArch64/RISC-V `ExtractOffset` bit-trick, and a Zbb-gated `__builtin_ctzll` (PR #214, merged, avoids a 10% regression). This is "partial," not "minimal," because these cover substantial, measurable decompression-path gains comparable in kind to the x86/ARM paths.

The cap is set because the primary compression-side hot path, `FindMatchLength` - the explicit subject of still-open [issue #209](https://github.com/google/snappy/issues/209) (filed 2025-07-22, no comments, unresolved) - only has a correctness guard merged (PR #220, `__riscv_xlen==64`), not the RVV vectorization that would close the gap; that vectorized version is unmerged ([PR #256](https://github.com/google/snappy/pull/256) open, [PR #233](https://github.com/google/snappy/pull/233) closed unmerged). CRC32 hashing also has no Zbc acceleration (scalar fallback only), and the RVV equivalent of the SSSE3/NEON V128 byte-shuffle used in decompression is never enabled. Partial caps at blue, which matches the already-blue CI-derived primary color, so the final color is **blue**.

**Pending work that could change the grade:**
- Open: [issue #209](https://github.com/google/snappy/issues/209) (root `FindMatchLength` perf report, unresolved since 2025-07-22).
- [PR #256](https://github.com/google/snappy/pull/256) (RVV vectorized `FindMatchLength`, resubmit of closed #233, ~+2.67% average / up to +13% on compressible data, awaiting maintainer review).
- [PR #235](https://github.com/google/snappy/pull/235) (RVV short-memcpy fixed-32-byte path mirroring AVX, +15% decompression on SpacemiT X60, awaiting final maintainer approval).
- [PR #243](https://github.com/google/snappy/pull/243) (CI hardening - pins `riscv64-qemu-test.yaml` actions to SHAs, adds `permissions: read-all`; CLA cleared, awaiting merge).
- No RISE funding, blog coverage, wheel-builder entry, or dedicated tracking issue exists for snappy despite Google being a RISE Premier Member; all RISC-V work is community-driven (notably contributors associated with ZTE/Sanechips and Alibaba).
- Sole active maintainer/merger (`danilak-G`) has long, unexplained review latency (PR #220 took approximately 5 months to merge after a ping).

---

## 14. Investment Analysis

RISE has no existing investment in snappy - every item below would be new work funded or staffed by RISE, not a continuation of prior RISE engagement. A single RISE TSC meeting-notes entry ("Snappy: RVV optimization [merged]," referencing PR #213) records awareness of the community work but no funding or engineering contribution.

### 14.1 Functional Enablement

No functional gap blocks riscv64 usage today. Snappy builds, tests, and runs correctly on riscv64, and that capability now ships in a tagged release (1.3.0/1.3.1) and in Ubuntu 26.04/Arch RISC-V binary packages - no new investment is required simply to make the library usable on riscv64. The one latent dependency is Zbb for `__builtin_ctzll`; without it the library falls back to a correct but slower portable implementation. Zbb is present on current production-grade RISC-V application cores.

### 14.2 Performance Optimization

- **Land PR #256** (RVV `FindMatchLength`, +2.67% average / up to +13% on compressible data): code is a resubmission of a previously-reviewed PR, currently stalled awaiting maintainer engagement. Effort to push to merge: 1-2 person-weeks of reviewer follow-up and benchmark reproduction.
- **Land PR #235** (RVV short-memcpy, +15% decompression): has received direct reviewer feedback (LMUL tradeoff); closest to mergeable of the open PRs. Effort: 1-2 person-weeks.
- **Zbc CRC32 hash acceleration:** not started by anyone. Zbc is available on SiFive P670-class and Alibaba Xuantie C910+-class cores. Effort: 2-3 person-weeks implementation plus 1-2 person-weeks upstream review cycle (longer given observed maintainer latency).
- **RVV `vrgather` V128 byte-shuffle for the decompressor:** not started. This closes the largest remaining architectural gap vs. the SSSE3/NEON decompression fast paths. Effort: 3-4 person-weeks implementation plus review cycle.

### 14.3 CI/CD Infrastructure

- **Confirm and, if needed, explicitly set `-march=rv64gcv_zbb_zicond`** in `riscv64-qemu-test.yaml` so RVV/Zbb/Zicond code paths are verifiably compiled and tested rather than relying on the cross-toolchain's implicit default target (Section 5's unresolved nuance). Effort: well under 1 person-week.
- **Land PR #243** (CI hardening - SHA-pinned actions, `permissions: read-all`): CLA cleared, narrowly scoped, awaiting review. Effort: under 1 person-week of follow-up.
- **Add a native riscv64 CI runner** (e.g. via RISE infrastructure or a SpacemiT/SiFive board) to replace QEMU user-mode emulation and get accurate timing. Effort: 1-2 person-weeks if hardware/runner infrastructure is already available to RISE.

### 14.4 Ecosystem Enablement

The primary ecosystem gap is the absence of riscv64 wheels on PyPI for `python-snappy` (not "snappy", which is a different, unrelated PyPI package). The RISE GitLab wheel-builder proxy currently has no entry for either name, and `python-snappy` is not on the RISE wheel-builder's 86-package supported list. A riscv64 wheel build would need either a native build host or cross-compilation added to `python-snappy`'s own (separate) build pipeline. Effort: 2-3 person-weeks. Priority is low: `python-snappy` is not a high-deployment package, and a working `python-snappy` binary already exists for Arch Linux RISC-V as a `noarch` package.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI | Confirm/explicitly set `-march=rv64gcv_zbb_zicond` so RVV paths are verifiably tested | <1 | Contributor (community or RISE) | High |
| CI | Land PR #243 (CI SHA-pinning / permissions hardening) | <1 | Existing PR author / RISE follow-up | High |
| Performance | Land PR #235 (RVV short-memcpy, +15% decompression) | 1-2 | Existing PR author / RISE follow-up | High |
| Performance | Land PR #256 (RVV FindMatchLength, +2.67% avg / up to +13%) | 1-2 | Existing PR author / RISE follow-up | High |
| Performance | Implement Zbc CRC32 hash acceleration | 2-3 (+1-2 review) | New contributor | Medium |
| Performance | Implement RVV `vrgather` V128 byte-shuffle for decompressor | 3-4 (+review) | New contributor | Medium |
| CI | Add native riscv64 CI runner | 1-2 | RISE | Low |
| Ecosystem | Build and publish riscv64 wheels for `python-snappy` on PyPI / RISE wheel builder | 2-3 | RISE wheel builder | Low |

---

## 15. References

- [google/snappy repository](https://github.com/google/snappy)
- [google/snappy releases](https://github.com/google/snappy/releases)
- [snappy.cc at commit 9c28114](https://github.com/google/snappy/blob/main/snappy.cc)
- [riscv64-qemu-test.yaml CI workflow](https://github.com/google/snappy/blob/main/.github/workflows/riscv64-qemu-test.yaml)
- [Issue #209: Performance Issue with Snappy FindMatchLength on RISC-V](https://github.com/google/snappy/issues/209)
- [PR #208: build: Update benchmark submodule for RISC-V](https://github.com/google/snappy/pull/208)
- [PR #212: Add RVV support for RISC-V and optimize decompression speed with enhanced Memcopy64](https://github.com/google/snappy/pull/212)
- [PR #213: feat(RISC-V): Add RVV-optimized implementation for memcopy64](https://github.com/google/snappy/pull/213)
- [PR #214: RISC-V: gate __builtin_ctzll behind Zbb to avoid 10% slowdown](https://github.com/google/snappy/pull/214)
- [PR #216](https://github.com/google/snappy/pull/216), [PR #217](https://github.com/google/snappy/pull/217), [PR #218](https://github.com/google/snappy/pull/218), [PR #219](https://github.com/google/snappy/pull/219) (duplicate FindMatchLength-guard submissions)
- [PR #220: limit RISC-V FindMatchLength optimizations to 64-bit](https://github.com/google/snappy/pull/220)
- [PR #233: RISC-V: Add RVV vectorized FindMatchLength optimization](https://github.com/google/snappy/pull/233)
- [PR #235: RISC-V: Optimize decompression throughput mirroring AVX fast-path for RVV short memcpy](https://github.com/google/snappy/pull/235)
- [PR #236: RISC-V: Add optimized decompression path (branchless tag loop)](https://github.com/google/snappy/pull/236)
- [PR #239: RISC-V: Add RVV vectorized FindMatchLengthPlain optimization](https://github.com/google/snappy/pull/239)
- [PR #240: RISCV: enable ExtractOffset optimization for RISC-V](https://github.com/google/snappy/pull/240)
- [PR #243: ci: pin action references to full commit SHAs, add read-only perms](https://github.com/google/snappy/pull/243)
- [PR #246: RISC-V decompression throughput, resubmit of #235](https://github.com/google/snappy/pull/246)
- [PR #256: RISC-V: Add RVV vectorized FindMatchLength optimization, resubmit of #233](https://github.com/google/snappy/pull/256)
- [riscv-collab/riscv-gnu-toolchain release 2025.07.03](https://github.com/riscv-collab/riscv-gnu-toolchain/releases/tag/2025.07.03)
- [Ubuntu "resolute" package search for snappy](https://packages.ubuntu.com/search?keywords=snappy&suite=resolute)
- [Arch Linux RISC-V mirror - extra repo](https://mirrors.sustech.edu.cn/archriscv/repo/extra/)
- [archriscv.felixc.at mirror status page](https://archriscv.felixc.at/)
- [conda-forge/snappy-feedstock PR #42](https://github.com/conda-forge/snappy-feedstock/pull/42)
- [conda-forge/snappy-feedstock PR #43](https://github.com/conda-forge/snappy-feedstock/pull/43)
- [PyPI: python-snappy](https://pypi.org/project/python-snappy/)
- [PyPI: snappy (unrelated topology package)](https://pypi.org/project/snappy/)
- [RISE wheel builder supported packages](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE: Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE: Python Now Officially Supports RISC-V](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [google/googletest Issue #3756: GetThreadCountTest.ReturnsCorrectValue fails on riscv64](https://github.com/google/googletest/issues/3756)
- [google/benchmark PR #833 (rdcycle to rdtime fix)](https://github.com/google/benchmark/pull/833)
- [lz4/lz4 issue #1635 (RISC-V optimization proposal)](https://github.com/lz4/lz4/issues/1635)
- [xerial/snappy-java releases (Java binding, separate project)](https://github.com/xerial/snappy-java/releases)
- [Brooooooklyn/snappy (Node.js binding, separate project)](https://github.com/Brooooooklyn/snappy)