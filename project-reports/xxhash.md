---
title: xxHash
parent: Project Reports
color: blue
---

# xxHash

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** Blue<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for xxHash<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

xxHash is a non-cryptographic hash library written in C, distributed as a single-header file (`xxhash.h`) and a companion source file (`xxhash.c`). It implements four hash families: XXH32, XXH64, XXH3_64b, and XXH128. XXH3 is the primary performance target and the only family with SIMD acceleration. The library is self-contained with no external library dependencies beyond libc.

**Governance:** Single-maintainer BDFL. Yann Collet (`@Cyan4973`, Meta) holds exclusive merge rights. No CODEOWNERS, MAINTAINERS, or CONTRIBUTING.md files exist. No foundation affiliation. License: BSD 2-Clause.

**Corporate sponsors:** None. xxHash is maintained as Yann Collet's personal project. Meta's involvement is indirect -- Zstandard (a Meta project) uses xxHash internally.

**Community stance on new ports:** Welcoming but demanding. Ports are accepted when they include a working vectorized implementation, CI integration, and passing correctness tests. The quality bar is demonstrated by the history of the RISC-V port: the first RVV PR ([#898](https://github.com/Cyan4973/xxHash/pull/898)) was open for 13 months before being closed without merge; a cleaner implementation ([#1043](https://github.com/Cyan4973/xxHash/pull/1043)) was merged in 3 days.

**RISE membership:** xxHash/Cyan4973 is not listed as a RISE member. RISE's involvement has been limited to building and distributing riscv64 Python wheels for `python-xxhash` (see Section 10).

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the `Cyan4973/xxHash` repository. No out-of-tree patches exist.

| Date | Event | Source |
|---|---|---|
| 2023-06-25 | RISC-V QEMU CI added (scalar only) -- PR #846 merged | [PR #846](https://github.com/Cyan4973/xxHash/pull/846) |
| 2023-07-21 | PR #846 included in v0.8.2 release | [PR merge status table](https://github.com/Cyan4973/xxHash/pull/846) |
| 2023-11-15 | First RVV PR (#898) opened, targeting RVV 0.7.1 + 1.0 | [PR #898](https://github.com/Cyan4973/xxHash/pull/898) |
| 2024-12-08 | PR #898 closed without merge (abandoned, dual-version complexity) | [PR #898](https://github.com/Cyan4973/xxHash/pull/898) |
| 2024-12-30 | v0.8.3 released (no RVV code; last release before RVV landed) | [GitHub releases](https://github.com/Cyan4973/xxHash/releases) |
| 2025-06-16 | RVV 1.0 implementation merged -- PR #1043 | [PR #1043](https://github.com/Cyan4973/xxHash/pull/1043) |
| 2025-07-19 | RVV CI (vlen=128/256/512) merged -- PR #1049 | [PR #1049](https://github.com/Cyan4973/xxHash/pull/1049) |
| 2025-09-09 | RVV refactor and performance enhancement -- PRs #1069, #1070 | [PR #1069](https://github.com/Cyan4973/xxHash/pull/1069), [PR #1070](https://github.com/Cyan4973/xxHash/pull/1070) |
| 2025-09-10 | RVV cleanup -- PR #1066 | [PR #1066](https://github.com/Cyan4973/xxHash/pull/1066) |

**Key contributors:**

| Login | Affiliation | Contribution |
|---|---|---|
| Cyan4973 (Yann Collet) | Meta | Maintainer; merged all RISC-V PRs; authored PR #846 |
| zijianli1234 | Unknown | Authored PRs #1043, #1049, #1069, #1070 -- primary RVV implementer |
| camel-cdr | Unknown | Authored PR #1066 (cleanup); key reviewer on #1018 and #870 |
| WoWaster | Unknown | Authored closed PR #898 (first RVV attempt); work informed PR #1043 |

**Upstreaming status:** Complete. All merged RISC-V work is in the upstream `dev` branch. The RVV implementation (PRs #1043, #1049, #1066, #1069, #1070) has not yet appeared in a tagged release -- v0.8.3 (2024-12-30) is the latest release and predates all RVV merges. The next release (expected v0.8.4) will be the first to include RVV support.

## 3. Upstream Support Tier

xxHash has no formal platform support tier policy document. The following is inferred from CI configuration and release history.

**Evidence of support:**
- RISC-V scalar CI has been present since v0.8.2 (2023-07-21), triggered on every push and pull request.
- RVV CI (vlen=128/256/512) was added in July 2025 and is also triggered on every push and pull request.
- The `make check` target (full test suite) runs for both scalar and RVV paths under QEMU.
- Real hardware benchmarks were conducted on Spacemit X60, BananaPi BPI-F3, and Sophgo SG2044 during PR review.

**Comparison table:**

| Property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD implementation | SSE2, AVX2, AVX512 | NEON, SVE | RVV 1.0 |
| Runtime dispatch | Yes (`xxh_x86dispatch.c`) | No (compile-time) | No (compile-time) |
| CI on every push/PR | Yes | Yes | Yes (QEMU) |
| Native CI runner | Yes | Yes | No (QEMU only) |
| In released version | Yes | Yes | No (dev branch only; awaiting v0.8.4) |
| Official upstream binary | Windows zip only | Windows zip only | Windows zip only |

The absence of a tagged release containing RVV is the primary gap. The implementation is complete and CI-tested; it is waiting on the maintainer's release cadence.

## 4. Technical Architecture and RISC-V-Specific Subsystems

xxHash's architecture is simple: a single-header C library with per-architecture SIMD backends selected at compile time. There is no JIT, no GC, no crypto, no allocator. The only architecture-specific subsystem is the SIMD acceleration of XXH3.

**SIMD dispatch model:**
- x86: runtime dispatch via `xxh_x86dispatch.c` (821 lines), which detects SSE2/AVX2/AVX512 at runtime using CPUID.
- All other architectures (ARM, POWER, s390x, LoongArch, RISC-V): compile-time selection via preprocessor guards. No runtime dispatch.

**RISC-V RVV implementation** (lines 5841-5965 of `xxhash.h`, 126 total lines, 97 non-comment lines):

| Function | Status | ISA | Notes |
|---|---|---|---|
| `XXH3_accumulate_512_rvv` | Full | RVV 1.0 | vlen-agnostic via `vsetvl_e64m2(8)`; uses `vle8`, `vxor`, `vsrl`, `vand`, `vrgather`, `vmacc`, `vadd`, `vse64` |
| `XXH3_accumulate_rvv` | Full | RVV 1.0 | Generated via `XXH3_ACCUMULATE_TEMPLATE(rvv)` macro |
| `XXH3_scrambleAcc_rvv` | Full | RVV 1.0 | Full RVV loop with `vsrl`, `vxor`, `vmul` |
| `XXH3_initCustomSecret_rvv` | Full | RVV 1.0 | RVV-specific; NEON/SVE/VSX all fall back to scalar for this function |

**Intrinsic types used:** `vuint64m2_t`, `vint64m2_t`, `vbool32_t` (LMUL=2).

**Compiler version guards in `xxhash.h`:**
- GCC < 13 or Clang < 16: uses legacy non-prefixed intrinsic names (e.g., `vsetvl_e64m2`).
- GCC >= 13 or Clang >= 16: uses `__riscv_` prefix (e.g., `__riscv_vsetvl_e64m2`).
- `__riscv_v_intrinsic >= 1000000`: selects ratified v1.0 mask-to-vector cast in `initCustomSecret`.

**Detection:** `#elif defined(__riscv_vector)` at compile time. No runtime CPU feature detection on RISC-V.

**Comparison table by component:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| XXH3 SIMD accumulate | Hand-tuned intrinsics + runtime dispatch | C intrinsics (NEON/SVE), compile-time | C intrinsics (RVV 1.0), compile-time |
| XXH3 scramble | SIMD | SIMD | SIMD |
| XXH3 initCustomSecret | SIMD | Scalar fallback | RVV-specific |
| XXH32 / XXH64 | Scalar (compiler auto-vec) | Scalar (compiler auto-vec) | Scalar (compiler auto-vec; GCC fails to vectorize, Clang uses suboptimal LMUL=2) |
| Runtime dispatch | Yes (CPUID) | No | No |
| Assembly files | None (intrinsics only) | None | None |
| JIT | None | None | None |

**Gap vs arm64:** The RISC-V implementation is structurally equivalent to ARM NEON/SVE -- both use C intrinsics with compile-time selection and no runtime dispatch. RISC-V's `initCustomSecret` is actually more complete than ARM's (which falls back to scalar). The only structural gap is the absence of runtime dispatch, which is also absent on ARM.

## 5. Build System, Cross-Compilation, and Toolchain

**Primary build system:** GNU Make. CMake is supported as an alternative.

**Exact build commands for riscv64 (from `.github/workflows/ci.yml`):**

```bash
# Install toolchain
sudo apt-get install gcc-riscv64-linux-gnu qemu-system-riscv64 qemu-user-static

# Scalar path
LDFLAGS="-static" CC=riscv64-linux-gnu-gcc RUN_ENV=qemu-riscv64-static \
  make clean check

# RVV vlen=128
CPPFLAGS="-march=rv64gcv -O2 -DXXH_VECTOR=XXH_RVV" \
  LDFLAGS="-static" CC=riscv64-linux-gnu-gcc \
  RUN_ENV="qemu-riscv64-static -cpu rv64,v=true,vlen=128,rvv_ta_all_1s=on,rvv_ma_all_1s=on" \
  make clean check

# RVV vlen=256 and vlen=512: same pattern with vlen=256 or vlen=512
```

**CMake cross-compilation:**

```bash
cmake -S build/cmake -B build_riscv64 \
      -DCMAKE_TOOLCHAIN_FILE=/path/to/riscv64-toolchain.cmake \
      -DDISPATCH=OFF \
      -DBUILD_SHARED_LIBS=OFF
cmake --build build_riscv64 --parallel
```

`-DDISPATCH=OFF` is mandatory for riscv64. Without it, `CMAKE_HOST_SYSTEM_INFORMATION` detects the x86-64 host and compiles `xxh_x86dispatch.c` for the riscv64 target, causing a build failure. This is a documented bug in `.github/workflows/cmake-cross-compile-test.yml`.

**Required toolchain versions:**

| Compiler | Minimum | Reason |
|---|---|---|
| GCC (cross) | GCC 9 | Oldest version in CI matrix |
| GCC for RVV | GCC 13 | `xxhash.h` line 5844 guard; GCC < 13 uses legacy intrinsic names (still supported via macro) |
| Clang for RVV | Clang 16 | `xxhash.h` line 5845 guard; Clang < 16 uses legacy intrinsic names (still supported) |
| CMake | 3.10 | `cmake_minimum_required(VERSION 3.10)` in `build/cmake/CMakeLists.txt` |

**QEMU flags:**
- `v=true`: enable RVV extension
- `vlen=N`: vector register length in bits (128/256/512 all tested)
- `rvv_ta_all_1s=on,rvv_ma_all_1s=on`: tail-agnostic and mask-agnostic policies (stricter correctness testing)
- `LDFLAGS=-static` is required for `qemu-riscv64-static` user-mode execution

**No Dockerfiles exist** in the xxHash repository. CI uses apt-installed cross-toolchains on `ubuntu-latest`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| XXH32 | Yes | Yes | Yes | None (functional) |
| XXH64 | Yes | Yes | Yes | None (functional) |
| XXH3_64b | Yes + SIMD | Yes + SIMD | Yes + SIMD | None (functional) |
| XXH128 | Yes + SIMD | Yes + SIMD | Yes + SIMD | None (functional) |
| Streaming API | Yes | Yes | Yes | Performance bug (see below) |
| Runtime SIMD dispatch | Yes | No | No | Parity with arm64 |
| `-march` auto-detection | Yes | Yes | Yes (via `__riscv_vector`) | None |
| Unaligned memory access | Yes | Yes | Partial (implementation-dependent) | Issue #870 open |

**Functional gaps:** None. All hash variants are available on riscv64.

**Performance gaps:**

1. **XXH32/XXH64 not manually vectorized for RVV.** GCC fails to auto-vectorize these; Clang uses suboptimal LMUL=2. Noted by `camel-cdr` in PR #1066 comments. No issue filed; no fix in progress.

2. **XXH32_stream unaligned and XXH64_stream unaligned catastrophic regression.** On Sophgo SG2044 (RVV 1.0 native, GCC 15.1.0), `XXH32_stream unaligned` = 8.8 MB/s and `XXH64_stream unaligned` = 10.5 MB/s, versus 2,637 MB/s and 5,174 MB/s aligned respectively -- approximately 300x slower. Acknowledged in PR #1070 body; no issue filed, no fix in progress.

3. **No runtime dispatch.** On a system where the binary is compiled without `-march=rv64gcv`, the scalar path is used regardless of hardware capability. This is a deployment concern, not a correctness issue, and is identical to the arm64 situation.

**Alignment:** RISC-V lacks guaranteed unaligned memory access (Issue #870, open since 2023-07-17). Some RISC-V implementations do support unaligned access, complicating the guard condition. The current code requires `-DXXH_FORCE_MEMORY_ACCESS=0` for strict-alignment targets. No specialized `XXH3_accumulate_512_scalar_aligned` exists.

**Security hardening gaps:** Data not available: no search was conducted for RISC-V-specific security hardening (stack canaries, CFI, shadow stack) in xxHash's build system.

**NaN / floating-point:** Not applicable. xxHash is pure integer arithmetic. Zero floating-point operations.

**Quantitative performance data (from PR benchmarks on real hardware):**

| Hardware | Hash | Scalar | RVV | Speedup |
|---|---|---|---|---|
| Spacemit X60 @ 1.6 GHz (PR #1043) | XXH3_64b 100 KB | 324.8 MB/s | 915.7 MB/s | 2.8x |
| Sophgo SG2044 (PR #1070) | XXH3_64b 100 KB aligned | -- | 3,584.7 MB/s | -- |
| Sophgo SG2044 (PR #1070) | XXH128 100 KB aligned | -- | 4,062.4 MB/s | -- |
| BananaPi BPI-F3 (PR #1066) | XXH3_64b peak | -- | ~1,684 MB/s | -- |

No head-to-head riscv64 vs arm64 throughput comparison is available in the research findings.

## 7. CI/CD Infrastructure

**riscv64 CI exists and runs on every push and pull request.**

From `.github/workflows/ci.yml` (verified by direct file read):

```yaml
on: [push, pull_request]
```

The `qemu-consistency` job includes a RISC-V matrix entry:

```yaml
{ name: 'RISC-V',
  xcc_pkg: gcc-riscv64-linux-gnu,
  xcc: riscv64-linux-gnu-gcc,
  xemu_pkg: qemu-system-riscv64,
  xemu: qemu-riscv64-static,
  os: ubuntu-latest }
```

The test step runs `make check` (full test suite, not build-only) for four configurations: scalar, RVV vlen=128, RVV vlen=256, RVV vlen=512.

**CI comparison table:**

| Property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI trigger | push + PR | push + PR | push + PR |
| Runner | ubuntu-latest (native) | ubuntu-latest (native) | ubuntu-latest (x86, QEMU) |
| Native hardware runner | Yes | Yes | No |
| Test suite runs | Yes | Yes | Yes (under QEMU) |
| SIMD paths tested | SSE2, AVX2, AVX512 | NEON, SVE | Scalar, RVV vlen=128/256/512 |
| `-Werror` | Yes | Yes | Yes |

**RISE runners:** RISE runners were used for building Python wheels for `python-xxhash` (see Section 10), not for the upstream C library CI. The upstream CI uses only GitHub-hosted runners.

**No native riscv64 hardware runner** exists in the upstream CI. All riscv64 testing is QEMU-based cross-compilation on x86-64. Real hardware benchmarks (Spacemit X60, BananaPi BPI-F3, Sophgo SG2044) were conducted manually by PR authors during review, not in automated CI.

## 8. Distribution and Release Status

**Upstream binary releases:** GitHub releases publish only a Windows zip (`xxhsum_win64_*.zip`). No Linux binaries of any architecture are published upstream. Verified across releases v0.8.3, v0.8.2, v0.8.1, v0.8.0, v0.7.4.

**RVV code in released versions:** The RVV implementation (PRs #1043 and later) is not yet in any tagged release. v0.8.3 (2024-12-30) is the latest release and predates all RVV merges. The next release (expected v0.8.4) will be the first to include RVV.

**Distribution packages (Ubuntu 26.04 / resolute, riscv64):**

| Package | Version | riscv64 |
|---|---|---|
| `xxhash` | 0.8.3-2build1 | Yes |
| `libxxhash0` | 0.8.3-2build1 | Yes |
| `libxxhash-dev` | 0.8.3-2build1 | Yes |
| `python3-xxhash` | 3.2.0-1build7 | Yes |

All four packages are in the `universe` pocket and list riscv64 alongside amd64, arm64, armhf, i386, ppc64el, s390x. Note: Ubuntu 26.04 ships v0.8.3, which contains scalar riscv64 support (from PR #846) but not RVV (which is in `dev` only).

**PyPI (`xxhash` Python package):** v4.0.1 publishes 18 riscv64 wheels (manylinux and musllinux, cp39-cp315 including free-threaded variants). PyPI began shipping native riscv64 wheels at v3.7.0 [NEEDS VERIFICATION -- exact version not confirmed in findings; findings state "April 2026" as the date].

**What a user must do to get a working riscv64 binary:**
- C library: `apt install libxxhash0` on Ubuntu 26.04 (scalar only, v0.8.3). For RVV, build from `dev` branch with `-march=rv64gcv`.
- Python: `pip install xxhash` (PyPI ships riscv64 wheels natively as of v4.0.1).
- No pre-built RVV-enabled binary is available from any distribution channel as of this report.

## 9. Dependencies

xxHash is self-contained. Its only runtime dependency is libc.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| glibc (libc6) | C runtime (only runtime dep) | Yes | Yes | Yes -- libc6 2.43-2ubuntu2 in Ubuntu 26.04 riscv64 | None |
| gcc-riscv64-linux-gnu | Cross-compiler (build-time only) | Yes | Yes | Yes -- gcc 4:15.2.0-5ubuntu1 in Ubuntu 26.04 | None; GCC 15 fully supports RVV intrinsics |
| cmake | Build system (optional) | Yes | Yes | Yes -- cmake 4.2.3-2ubuntu2 in Ubuntu 26.04 riscv64 | None |
| make | Build system (primary) | Yes | Yes | Yes -- make 4.4.1-3 in Ubuntu 26.04 riscv64 | None |
| qemu-user-static | CI test emulator (not runtime) | Yes (amd64 host) | Yes | Yes -- qemu-system-riscv 1:10.2.1+ds-1ubuntu3 in Ubuntu 26.04 | None |

No JIT, SIMD library, crypto, compression, or allocator dependencies exist. All SIMD paths (AVX2, SSE2, NEON, SVE, RVV, VSX, LSX/LASX) are implemented directly in `xxhash.h` using compiler intrinsics.

## 10. Ecosystem Status

The `python-xxhash` PyPI package (`xxhash`) is the primary dependent ecosystem item. It wraps the C library and is used in data pipelines, content-addressable storage, and deduplication workloads.

**PyPI riscv64 coverage:** As of v4.0.1, PyPI publishes 18 riscv64 wheels (manylinux_2_31 and musllinux_1_2, cp39-cp315 including free-threaded `t` variants). This is full coverage for all supported CPython versions.

**RISE wheel builder history:** RISE (via BayLibre, maintainer Julien Stephan) built and distributed riscv64 wheels for `python-xxhash` v3.5.0 (2025-02-11) and v3.6.0 (2025-11-24) through the RISE wheel builder at `gitlab.com/riseproject/python/python-xxhash`. The RISE wheel builder page for xxhash now carries a deprecation notice: "PyPI now publishes newer versions of this package for riscv64, and we will no longer maintain this package. Please use the version from PyPI instead." RISE filled a 14-month gap (February 2025 to approximately April 2026) before upstream PyPI added native riscv64 support.

**RISE runner usage:** The `build-python-xxhash` CI job ran on a RISE runner (tag: `python-wheels-xl`) using `cibuildwheel` with `CIBW_ARCHS_LINUX=riscv64`. Build duration was approximately 835 seconds for v3.6.0. The deploy job ran on standard GitLab SaaS amd64 runners.

**Current state:** No RISE action required for `python-xxhash`. PyPI ships riscv64 wheels natively. The C library (`libxxhash0`) is available in Ubuntu 26.04 riscv64 via distro packages.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1018](https://github.com/Cyan4973/xxHash/issues/1018) | Proposal: Add RISC-V Optimization for XXH_mult32to64_add64 with Inline Assembly | Open | Low | Inline-asm patch regresses real hardware (T-Head C906) by 37% at 1KB+ inputs; QEMU shows 2x gain but is not representative. Maintainer and camel-cdr skeptical. Stalled pending real hardware data from proposer. Latest comment (2025-12-18) adds GCC < 14 guard. |
| [#870](https://github.com/Cyan4973/xxHash/issues/870) | Optimize scalar secret access for strict-align CPUs | Open | Medium | XXH3 assumes unaligned access; RISC-V lacks guaranteed unaligned memory access. Ring-buffer approach proposed to reduce redundant secret reads. Open since 2023-07-17; no implementation merged. camel-cdr's `XXH3_accumulate_512_scalar_aligned` sketch (from PR #1066 comments) is the most concrete proposal. |
| (no issue) | XXH32_stream unaligned and XXH64_stream unaligned catastrophic regression | No issue filed | High | 8.8 MB/s and 10.5 MB/s respectively on Sophgo SG2044 (vs 2,637 MB/s and 5,174 MB/s aligned). ~300x regression. Acknowledged in PR #1070 body. Pre-existing, not introduced by recent PRs. |
| (no issue) | XXH32/XXH64 not manually vectorized for RVV | No issue filed | Low | GCC fails to auto-vectorize; Clang uses suboptimal LMUL=2. Noted by camel-cdr in PR #1066 comments. |

**No correctness bugs.** All open issues are performance-related. xxHash is pure integer arithmetic; no NaN or floating-point issues exist.

## 12. Objections and Upstream Blockers

**No upstream blockers for functional riscv64 support.** The scalar path has been in releases since v0.8.2 (2023). The RVV implementation is merged and CI-tested.

**Release timing:** The RVV implementation is in the `dev` branch only. v0.8.4 has not been tagged. The maintainer (Cyan4973) controls release timing with no stated schedule. This is not a technical blocker but a process dependency on a single individual.

**No runtime dispatch on RISC-V:** Unlike x86, there is no `xxh_riscv_dispatch.c` that selects RVV at runtime based on hardware capability. Binaries compiled without `-march=rv64gcv` use the scalar path regardless of hardware. This is a deployment concern for distributions that ship a single generic binary. The same limitation applies to arm64 (no runtime NEON/SVE dispatch). Upstream has not indicated intent to add runtime dispatch for RISC-V.

**Issue #870 (strict-alignment):** Open since 2023 with no implementation. For RISC-V hardware that traps on unaligned access, the current code requires `-DXXH_FORCE_MEMORY_ACCESS=0`. This is a correctness concern on strict-alignment targets, not a performance concern.

**Maintainer bandwidth:** Cyan4973 is the sole decision-maker. The 13-month delay on PR #898 (first RVV attempt) illustrates that review latency is unpredictable. PR #1043 (the accepted implementation) was merged in 3 days, suggesting the bottleneck is implementation quality, not maintainer hostility to RISC-V.

**Organizational blockers:** None. xxHash is not part of any foundation or standards body. No export control, patent, or licensing issues identified.

## 13. Readiness Assessment

- **Color:** Blue (CI builds and tests pass; upstream does not publish riscv64 artifacts)
- **Release provider:** Distro (Ubuntu 26.04 ships `libxxhash0` 0.8.3 for riscv64; PyPI ships `xxhash` Python wheels natively)
- **Optimization level:** Partial

**Justification:** xxHash CI builds and runs the full test suite (`make check`) for riscv64 on every push and pull request, covering both scalar and RVV paths at vlen=128/256/512 via QEMU ([`.github/workflows/ci.yml`](https://github.com/Cyan4973/xxHash/blob/dev/.github/workflows/ci.yml)). Upstream publishes no riscv64 binary artifacts -- only a Windows zip per release -- placing the release provider at distro level. The optimization level is partial: a complete RVV 1.0 C-intrinsics implementation exists for XXH3 (all four vector hooks, vlen-agnostic, tested on real hardware including Sophgo SG2044 and BananaPi BPI-F3), but runtime dispatch is absent (compile-time selection only, unlike x86's `xxh_x86dispatch.c`), XXH32/XXH64 lack manual RVV vectorization, and the streaming unaligned performance regression (~300x slowdown) is unresolved.

**Pending work that could change the grade:**
- v0.8.4 release (no date set): will be the first tagged release containing RVV. Does not change the color (CI already passes) but improves distribution availability.
- Issue #870 (strict-alignment scalar path): if resolved, closes a correctness gap for strict-alignment RISC-V targets.
- Runtime dispatch for RISC-V: if implemented (no PR or issue exists), would bring riscv64 to parity with x86 and could support a `full` optimization level.
- The streaming unaligned regression (no issue filed): if fixed, removes the highest-severity known performance bug.

## 14. Investment Analysis

RISE has already covered Python wheel distribution for `python-xxhash` (deprecated; PyPI now handles it natively). The upstream C library RVV implementation was contributed by community members (zijianli1234, camel-cdr) without RISE funding. The following sizing covers remaining gaps only.

### 14.1 Functional Enablement

No functional gaps exist. All hash variants work on riscv64. The strict-alignment issue (#870) is a correctness concern for hardware that traps on unaligned access, but the workaround (`-DXXH_