---
title: Highway
categories:
  - libraries
---

# Highway

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for Highway
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

[Google Highway](https://google.github.io/highway/) is a C++ SIMD abstraction library that provides a single portable API over platform-specific vector intrinsics. It targets amd64 (SSE2 through AVX-512), AArch64 (NEON, SVE, SVE2), RISC-V (RVV 1.0), PowerPC (VSX), WASM (SIMD128), and LoongArch (LSX/LASX). The library is a header-plus-small-runtime design: the SIMD backends are header-only template instantiations compiled separately per target, selected at runtime via a dispatch table.

Highway is hosted under the `google` GitHub organization. The README states explicitly: "This is not an officially supported Google product." There is no steering committee, formal governance body, or written tier policy for new or existing ports. Jan Wassenbergh (Google DeepMind, Zurich) is the primary author and de-facto gatekeeper. The project has no MAINTAINERS, OWNERS, or CODEOWNERS file.

Highway is licensed Apache 2.0 / BSD-3 (dual; BSD-3 was added after initial release).

Google is a Premier Member of the [RISE Project](https://riseproject.dev) organizationally. Highway as a library is not individually listed on riseproject.dev. No RISE blog post about Highway was found after scanning all 27 posts from May 2024 through June 2026.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port targets the RVV (RISC-V Vector) 1.0 extension. It has been in-tree since 2021 and is fully upstream. There is no out-of-tree or vendor fork.

| Date | Event | Source |
|---|---|---|
| Feb 3, 2021 | First substantive RVV commit by jan-wassenberg; `hwy/ops/rvv-inl.h` created; acknowledgment of discussion with K. Asanovic, B. Huffman, A. Waterman (PiperOrigin-RevId: 355388526) | GitHub commit history |
| Feb 19, 2021 | Release 0.11.0: "Add RVV port (some functions pending compiler update)" | [GitHub Releases](https://github.com/google/highway/releases) |
| Aug 31, 2021 | compnerd adds Bazel experimental RISC-V support (`-march=rv64gcv0p10`, Clang-only, RVV spec 0.10) | [GitHub PR history](https://github.com/google/highway/pull) |
| Nov 2021 | Release 0.15.0: "Targets: update RVV for LLVM" | [GitHub Releases](https://github.com/google/highway/releases) |
| Jun 2022 | Release 0.17.0: "HWY_RVV is feature-complete"; "Support Arm/RISC-V timers" | [GitHub Releases](https://github.com/google/highway/releases) |
| Jul 2022 | Issue [#838](https://github.com/google/highway/issues/838) (runtime dispatch on riscv64) closed | [Issue #838](https://github.com/google/highway/issues/838) |
| Jan 2023 | Release 1.0.3: "Update for new RVV intrinsics" | [GitHub Releases](https://github.com/google/highway/releases) |
| Mar 2023 | Release 1.0.4: "Update RVV intrinsics for 1.0-draft" | [GitHub Releases](https://github.com/google/highway/releases) |
| Apr 2024 | luyahan (PLCT Lab) adds `HWY_ARCH_RISCV` (replacing `HWY_ARCH_RVV`), atomic support, `HWY_ATTAINABLE_RISCV` | [PR #2073](https://github.com/google/highway/pull/2073), [PR #2084](https://github.com/google/highway/pull/2084), [PR #2110](https://github.com/google/highway/pull/2110) |
| May 2024 | Release 1.2.0: "Enable runtime dispatch for NEON/RVV" (NOTE: see Jun 2024 retraction) | [GitHub Releases](https://github.com/google/highway/releases) |
| Jun 2024 | PR [#2230](https://github.com/google/highway/pull/2230) merged: RVV runtime dispatch disabled via `&& 0` guard due to LLVM bug #56592 and GCC bug #115325; post-dates the 1.2.0 release notes | [PR #2230](https://github.com/google/highway/pull/2230) |
| Aug 2025 | Release 1.3.0: "RVV groundwork for runtime dispatch, enable tuples; RVV ops via superoptimizer" | [GitHub Releases](https://github.com/google/highway/releases) |
| Sep 2025 | PR [#2704](https://github.com/google/highway/pull/2704) merged: VQSORT enabled for RISC-V; tested on Banana Pi BPI-F3 (SpacemiT K1) | [PR #2704](https://github.com/google/highway/pull/2704) |
| Apr 7, 2026 | PR [#2968](https://github.com/google/highway/pull/2968) merged: RVV runtime dispatch re-enabled for Clang 19+, `&& 0` guard removed | [PR #2968](https://github.com/google/highway/pull/2968) |
| Apr 23, 2026 | Release 1.4.0: "RVV and LSX/LASX runtime dispatch" | [GitHub Releases](https://github.com/google/highway/releases) |
| Jun 23, 2026 | PR [#3148](https://github.com/google/highway/pull/3148) opened: first attempt to add riscv64 to multiarch CI; open, blocked on CLA | [PR #3148](https://github.com/google/highway/pull/3148) |

Key contributors with organizational affiliation:

- **jan-wassenberg** (Jan Wassenbergh) -- Google DeepMind, Zurich. Primary author and lead maintainer; architect of the RVV port.
- **luyahan** -- PLCT Lab. Active RISC-V contributor in 2024; introduced `HWY_ARCH_RISCV`, atomic support, and `HWY_ATTAINABLE_RISCV`.
- **compnerd** (Saleem Abdulrasool) -- affiliated with @llvm, @swiftlang, @ClangBuiltLinux. Added first Bazel RISC-V support (2021).
- **JamieMagee** -- Enabled RVV runtime dispatch for Clang 19+ (PR #2968, Apr 2026).
- **kraj** (Khem Raj) -- CMake 32-bit/64-bit RISC-V deduction (PR #2330, Oct 2024).
- **eyupcanakman** -- Active RVV ops contributor (May-June 2026).
- **johnplatts** -- Active reviewer; proposed GCC cross-compiler approach for riscv64 CI (Jun 2026).

The entire RVV backend has been merged to main since 2021. There are no known out-of-tree patches required.

---

## 3. Upstream Support Tier

No formal tier policy exists. The project has no written documentation classifying architectures as primary, secondary, or best-effort. Tier classification is inferred from observable evidence.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree code | Yes | Yes | Yes |
| CI (native runner) | Yes | Yes (ubuntu-24.04-arm) | No |
| CI (QEMU/cross) | Yes | Yes | No (PR #3148 open, not merged) |
| Release-blocking | Yes | Yes [NEEDS VERIFICATION] | No |
| Official pre-built binaries | No (source only) | No (source only) | No (source only) |
| Distro package (main) | Yes | Yes | Debian sid/trixie only |
| Compiler minimum enforced | GCC 11+ / Clang 6+ | GCC 11+ / Clang 6+ | GCC 13+ / Clang 16+ |
| Runtime dispatch | Yes | Yes | Clang 19+ only (as of 1.4.0) |

riscv64 is effectively a best-effort tier. The RVV code is in-tree and maintained, but there is zero automated CI coverage. PR [#3148](https://github.com/google/highway/pull/3148) (opened June 23, 2026) is the first attempt to add riscv64 CI and remains unmerged as of the report date, blocked on a Google CLA from the contributor. The PR description itself states: "zero CI coverage for riscv64, meaning regressions go undetected."

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Highway has one architecture-specific code path per SIMD backend. For RISC-V, the entire implementation is in `hwy/ops/rvv-inl.h`. There is no assembly (`.S`) file for RISC-V, no JIT backend, and no `arch/riscv/` directory.

### 4.1 SIMD Backend

The RISC-V backend (`hwy/ops/rvv-inl.h`) implements the full Highway SIMD API surface via RVV v1.0 intrinsics (`<riscv_vector.h>`, `__riscv_v*` family). It uses an x-macro expansion framework to generate variants across all element types and LMUL values (mf8, mf4, mf2, m1, m2, m4, m8).

File size: 7,169 lines / 301 KB. PR [#3148](https://github.com/google/highway/pull/3148) states 448+ operations. For comparison: `arm_sve-inl.h` is 7,265 lines.

ISA extensions:
- RVV v1.0 (base): required for all RVV operations
- `Zvfhmin`: optional; enables float16 minimum subset; guarded by `__riscv_zvfhmin`
- `Zvfh`: optional; full float16; via `HWY_HAVE_FLOAT16`
- No Zba/Zbb scalar bit-manipulation extensions used

Operations status:

| Operation Group | riscv64 Implementation | Notes |
|---|---|---|
| Initialization (Set, Zero, Iota, Undefined) | Hand-tuned RVV intrinsics | Undefined returns Zero to avoid RVV poison semantics |
| Logical (And, Or, Xor, Not, masked variants) | Hand-tuned RVV intrinsics | Full, including MaskedOr/MaskedXor added Jun 2026 (PR #3145) |
| Arithmetic (Add, Sub, Neg, Mul, Div, FMA, Sqrt, Sat) | Hand-tuned RVV intrinsics | Full |
| Shifts (ShiftLeft, ShiftRight, Shl, Shr, RoundingShr, RotateRight, masked) | Hand-tuned RVV intrinsics | MaskedShiftLeftOr and variants added Jun 2026 (PR #3122); RoundingShiftRightAndDemoteTo added Jun 2026 (PR #3140) |
| Comparisons (Eq, Ne, Lt, Le, Gt, Ge, TestBit, IsNaN, masked) | Hand-tuned RVV intrinsics | Full |
| Masking/Selection (IfThenElse, MaskFromVec, FirstN, RebindMask) | Hand-tuned RVV intrinsics | Full |
| Reductions (ReduceSum, ReduceMin, ReduceMax, SumsOf8) | Hand-tuned RVV intrinsics | SumsOf8: documented as slower on RVV/WASM (manual shifts/adds; no dedicated widening reduction intrinsic) |
| Masked Reductions (MaskedReduceSum, MaskedReduceMin, MaskedReduceMax, MaskedSqrtOr) | Hand-tuned RVV intrinsics | Added May 2026 (PR #3050) |
| Gather/Scatter (incl. masked) | Hand-tuned RVV intrinsics via HWY_RVV_SCATTER macro | Full |
| Load/Store (aligned, unaligned, blended) | Hand-tuned RVV intrinsics | Full |
| Interleaved Load/Store (2/3/4) | Hand-tuned RVV intrinsics | RVV provides native implementation (HWY_NATIVE_LOAD_STORE_INTERLEAVED) |
| Permutations (Reverse, Compress, Expand, Concat, CombineShiftRightLanes) | Hand-tuned RVV intrinsics | RVV has its own CombineShiftRightLanes implementation |
| Type conversion (PromoteTo, DemoteTo, ConvertTo) | Hand-tuned RVV intrinsics | Full for f32/f64/i8/u8/i16/u16/i32/u32/i64/u64 |
| float16 | Conditional: intrinsics if Zvfhmin/Zvfh present, absent otherwise | Without Zvfhmin, HWY_RVV_FOREACH_F16 expands to nothing; no f16 ops available |
| bfloat16 | Emulated via int16 reinterpret | No native bf16 in RVV 1.0 baseline |
| VQSORT (vectorized sort) | Enabled for GCC 14+ or Clang 19+ | PR #2704 (Sep 2025); tested on SpacemiT K1 hardware |
| Runtime dispatch | Enabled for Clang 19+ | PR #2968 (Apr 2026); previously disabled Jun 2024 -- Apr 2026 due to LLVM #56592 and GCC #115325 |
| Operator overloads (+, -, *, etc.) | Not available on RVV | Sized type constraint; callers must use named API functions |
| Cache control (prefetch, fence) | Not present | No RISC-V paths in cache_control.h |
| Performance counters | Not present | No RISC-V paths in perf_counters.cc |

### 4.2 Target Detection and Runtime Dispatch

`hwy/detect_targets.h` defines `HWY_RVV` as bit 37. Minimum compiler requirements:
- Broken for GCC < 13 or Clang < 16 (`HWY_BROKEN_RVV` defined; fallback to scalar/emu128)
- Runtime dispatch (`HWY_HAVE_RUNTIME_DISPATCH_RVV`): requires Clang 19+

`hwy/targets.cc` implements runtime CPU detection via `getauxval(AT_HWCAP)` checking `COMPAT_HWCAP_ISA_V (1 << ('V' - 'A'))`, followed by inline assembly (`vsetvli` + `csrr vtype`) to validate the VILL bit and confirm minimum 16-byte vector length. `.option push/pop` directives permit compilation without `-march=rv64gcv1p0`.

`hwy/base.h` sets `kMaxVectorSize = 4096` for RISC-V (the largest of any supported architecture, reflecting RVV scalable vectors). Note: `abort()` is replaced with `exit(1)` on RISC-V to avoid freezing the Spike simulator.

### 4.3 Comparison Table

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD backend | x86_128/256/512-inl.h (~33,000 lines combined) | arm_neon-inl.h + arm_sve-inl.h (~18,000 lines combined) | rvv-inl.h (7,169 lines) |
| ISA extensions | SSE2 through AVX-512 (tiered) | NEON, SVE, SVE2 (tiered) | RVV 1.0 (one target), optional Zvfhmin/Zvfh |
| Target count | 10 (SSE2, SSSE3, SSE4, AVX2, AVX3, AVX3_DL, AVX3_ZEN4, AVX3_SPR, ...) | 4+ (NEON, SVE, SVE2, SVE2_128) | 1 (RVV) |
| Runtime dispatch | Yes, mature | Yes, mature | Yes but Clang 19+ only as of 1.4.0 |
| Float16 native | Via F16C / AVX-512FP16 | Via NEON f16 | Only with Zvfhmin/Zvfh extension |
| Bfloat16 native | Via AVX512_BF16 / VNNI | Via SVE BF16 intrinsics | Emulated (int16 reinterpret) |
| Gather/Scatter | Yes | Yes | Yes |
| Interleaved LD/ST | Yes | Yes | Yes |
| Cache control | Yes | Yes | No |
| Performance counters | Yes | Yes | No |
| VQSORT | Yes | Yes | GCC 14+ or Clang 19+ only |
| Assembly (.S files) | No | No | No |
| JIT backend | No | No | No |

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 CMake Flags

Highway auto-detects RISC-V via the `__riscv` preprocessor define or `CMAKE_SYSTEM_PROCESSOR` matching `riscv32|riscv64|riscv128`. When `HWY_CMAKE_RVV=ON` (default), CMake adds:
- `-march=rv64gcv1p0` (riscv64) or `-march=rv32gcv1p0` (riscv32) to compile and link flags
- Additionally for Clang: `-menable-experimental-extensions`

The `-march rv64gcv1p0` hardcoding is a known issue on RVA23 platforms (see Section 11, issue [#2738](https://github.com/google/highway/issues/2738)).

### 5.2 Cross-Compilation Invocation

From `run_tests.sh` (the canonical reference):

```
export QEMU_LD_PREFIX=/usr/riscv64-linux-gnu

mkdir build_rvv && cd build_rvv
CC=riscv64-linux-gnu-gcc-15 CXX=riscv64-linux-gnu-g++-15 \
  cmake .. \
    -DCMAKE_C_COMPILER_TARGET="riscv64-linux-gnu" \
    -DCMAKE_CXX_COMPILER_TARGET="riscv64-linux-gnu" \
    -DCMAKE_CROSSCOMPILING=true \
    -DCMAKE_CROSSCOMPILING_EMULATOR="/usr/bin/qemu-riscv64;-cpu;max;-L;/usr/riscv64-linux-gnu" \
    -DCMAKE_SYSTEM_NAME=Linux
make -j && ctest -j
```

Compiler version selection: GCC 15 is used specifically for riscv64 in the CI script, while other architectures use GCC 11-13. This is because GCC 13+ is required for non-broken RVV support (`HWY_BROKEN_RVV` triggers on GCC < 13), and GCC 15 is used to track the current compiler bugs being worked around (e.g., GCC bug #110812, GCC bug #115325).

Note: `HWY_WARNINGS_ARE_ERRORS` is NOT set in the RVV CI section of `run_tests.sh`, unlike most other CI configurations. [NEEDS VERIFICATION: this may indicate known warnings with GCC 15 + RVV.]

### 5.3 QEMU Usage

- Binary: `/usr/bin/qemu-riscv64` with `-cpu max` flag (enables all QEMU-emulated CPU features including RVV)
- Library prefix: `-L /usr/riscv64-linux-gnu` for riscv64 sysroot libraries
- Set as `CMAKE_CROSSCOMPILING_EMULATOR` so CTest automatically prefixes all test executables
- Environment: `QEMU_LD_PREFIX=/usr/riscv64-linux-gnu`

Reviewer johnplatts ([PR #3148](https://github.com/google/highway/pull/3148)) argues that native GCC cross-compilers on x86_64 are faster than QEMU via `run-on-arch-action` and cover more architectures. This approach is under consideration as an alternative for the proposed CI.

### 5.4 Required System Packages

From `run_tests.sh` (inferred):

```
gcc-15-riscv64-linux-gnu
g++-15-riscv64-linux-gnu
libc6-dev-riscv64-cross
qemu-user
qemu-user-binfmt
```

### 5.5 Known Build Failures

- mold linker fails with highway 1.2.0 on riscv64 (issue [#2854](https://github.com/google/highway/issues/2854)): mold rejects the generated `.riscv.attributes` ISA string as corrupted; linker (ld via collect2) segfaults. Workaround: use the default `ld` linker.
- `-march rv64gcv1p0` conflicts with Ubuntu 25.10 rva23u64 platform profile and LTO under GCC 15.2 (issue [#2738](https://github.com/google/highway/issues/2738)); Ubuntu Launchpad bug [#2121375](https://bugs.launchpad.net/ubuntu/+source/highway/+bug/2121375).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional Gaps

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Full SIMD API (arithmetic, logical, compare) | Yes | Yes | Yes | None |
| Gather/Scatter | Yes | Yes | Yes | None |
| Interleaved Load/Store (2/3/4) | Yes | Yes | Yes | None |
| Permutations (Reverse, Compress, Expand) | Yes | Yes | Yes | None |
| Reductions (ReduceSum, ReduceMin, ReduceMax) | Yes | Yes | Yes | None |
| Masked reductions | Yes | Yes | Yes | None |
| Float16 native | Conditional (F16C) | Conditional (NEON f16) | Conditional (Zvfhmin/Zvfh required) | Gap: requires optional extension; no f16 ops on base RVV without Zvfhmin |
| Bfloat16 native | Conditional (AVX512_BF16) | Conditional (SVE BF16) | Emulated via int16 reinterpret | Gap: emulated path; may have performance or edge-case correctness divergence |
| Operator overloads | Yes | Yes | No | Gap: sizeless type constraint on RVV prevents C++ operator overloads |
| Cache control (prefetch/fence) | Yes | Yes | No | Gap: no RISC-V paths in cache_control.h |
| Performance counters | Yes | Yes | No | Gap: no RISC-V paths in perf_counters.cc |
| VQSORT | Yes | Yes | GCC 14+ or Clang 19+ only | Partial gap: unavailable on older toolchains |
| Runtime dispatch | Yes | Yes | Clang 19+ (as of 1.4.0) | Partial gap: GCC-built binaries cannot runtime-dispatch as of 1.4.0 |
| Multiple SIMD tiers | Yes (10 x86 targets) | Yes (4+ ARM targets) | No (1 RVV target) | Architectural: RVV scalable design has one target; not a bug |
| CI coverage | Yes | Yes | No | Critical operational gap |

### 6.2 Performance Gaps

SumsOf8 is explicitly documented (in `quick_reference.md`) as "slower on RVV/WASM" relative to x86 and ARM. The implementation uses manual shifts and adds rather than a dedicated widening reduction intrinsic.

No quantitative RISC-V benchmark figures (throughput numbers, speedup ratios vs. scalar, or inter-arch comparisons) were found in any upstream source. The README's general claims of "5-10x speedups" and "fivefold energy reduction" are stated across all SIMD targets without per-architecture breakdown. Data not available: architecture-specific benchmark numbers for riscv64 vs. x86 or ARM.

The vectorized sort paper ([arXiv:2205.05982](https://arxiv.org/abs/2205.05982)) reports 1.59x geometric mean speedup integrating vqsort into ips4o and up to 20x faster than std::sort for non-tuple keys, but these figures are not broken down by architecture.

### 6.3 Floating-Point Semantics

No RISC-V-specific NaN or floating-point correctness bugs were found. A recent fix (PR #3129, merged Jun 19, 2026) addressed VQSelect/PartialSort NaN handling for arrays containing real infinity (issue #3098), but that was not RISC-V-specific.

The bfloat16 emulation via int16 reinterpret on RVV could produce differing behavior from native bfloat16 instructions on amd64 (AVX512_BF16) or arm64 (SVE BF16) in edge cases such as NaN payload propagation. Data not available: no test cases or issue reports documenting such divergence were found.

### 6.4 Security Hardening

Data not available: no RISC-V-specific security hardening gaps, sanitizer coverage gaps, or stack canary issues were identified in the research sources.

---

## 7. CI/CD Infrastructure

### 7.1 Current State

riscv64 is absent from all CI configurations. This was confirmed by reading the complete contents of all four workflow files:
- `.github/workflows/build_test.yml` -- x86_64 only
- `.github/workflows/multiarch.yml` -- armv7, ppc64le, AArch64 (native runners), LoongArch64 (QEMU); no riscv64
- `.github/workflows/meson_build_test.yml` -- x86_64 and ppc64le; no riscv64
- `.github/workflows/docs_pages_workflow.yml` -- documentation only

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

PR [#3148](https://github.com/google/highway/pull/3148) (opened Jun 23, 2026) is the first attempt to add riscv64 to the multiarch CI matrix via QEMU and `run-on-arch-action`. It is open and blocked on a Google CLA signature from the contributor. Reviewer johnplatts has proposed an alternative approach using native GCC cross-compilers instead of QEMU emulation, which would run faster on x86 hosts.

### 7.2 Comparison Table

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | Yes (ubuntu-22.04, ubuntu-24.04, windows-2022) | Yes (ubuntu-24.04-arm) | No |
| QEMU runner | No | No | No (PR #3148 pending) |
| Cross-compile + QEMU | Yes (in run_tests.sh) | N/A | Yes (in run_tests.sh, not in CI) |
| Regression detection | Yes | Yes | No |
| RISE runners | Data not available | Data not available | Data not available |
| Release gating | Yes | Yes [NEEDS VERIFICATION] | No |

### 7.3 Impact

With no riscv64 CI, any of the following can merge undetected: RVV intrinsic regressions, compiler-version-specific code generation failures, test failures specific to scalable vector semantics. PR #3148 documents that 5 RVV-related commits merged in the month preceding its opening with zero CI validation.

---

## 8. Distribution and Release Status

Highway publishes source-only releases. No pre-built binaries for any architecture are provided via GitHub Releases.

| Source | Package | riscv64 Available | Version | Notes |
|---|---|---|---|---|
| GitHub Releases | Source tarball (.tar.gz + .asc) | Source only | 1.4.0 (Apr 23, 2026) | No prebuilt binaries for any arch |
| Debian sid/trixie | `libhwy-dev`, `libhwy1t64` | Yes | 1.3.0-2+b1 | Built on `rv-manda-04`; one release behind upstream |
| Debian stable (bookworm) | `libhwy-dev` | Status not confirmed | 1.0.3 | Old; no RVV runtime dispatch |
| Ubuntu 24.04 LTS (noble) | `libhwy-dev` | Status not confirmed | 1.0.7 | Very old; no RVV runtime dispatch |
| Arch Linux RISC-V (archriscv port) | highway | Yes | Maintained with `riscv64.patch` | Separate from mainline Arch (x86_64 only for mainline) |
| PyPI `highway` | Python wheel | No | 0.9.1 | Unrelated project; pure-Python, architecture-neutral |

Note: `libhighwayhash-dev` and `libhighwayhash0t64` are present on riscv64 in Ubuntu 24.04 noble, but these are from the HighwayHash hash function library -- a separate project from google/highway.

For a user wanting a working riscv64 binary with current RVV runtime dispatch (1.4.0):
1. Install GCC 13+ or Clang 16+ cross-toolchain (GCC 14+ for VQSORT)
2. Build from source with `HWY_CMAKE_RVV=ON` (default)
3. For runtime dispatch: use Clang 19+ only; GCC builds do not support runtime dispatch as of 1.4.0
4. For LTO on RVA23 platforms: no upstream resolution yet (issue [#2738](https://github.com/google/highway/issues/2738) open)

---

## 9. Dependencies

Highway's own runtime dependencies are minimal (pthreads, libatomic from the GCC toolchain). GoogleTest is an optional build-time-only dependency that can be excluded with `HWY_TEST_STANDALONE=1`. All are available on riscv64 Linux toolchains.

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| GCC 13+ cross-toolchain | Compile riscv64 targets (minimum non-broken RVV) | N/A (host tool) | Via QEMU in run_tests.sh | Available in Ubuntu/Debian | GCC 14+ required for VQSORT; GCC 15 has known RVV mis-optimizations (workarounds in PR #2996, PR #2971) |
| Clang 16+ (minimum for RVV) | Alternative compiler | N/A (host tool) | Via QEMU | Available | Clang 19+ required for runtime dispatch; Clang 20 has a bug requiring workaround in hwy/ops/rvv-inl.h |
| googletest | Unit testing (optional) | Yes | Via QEMU | Available in Debian/Ubuntu for riscv64 | None (not a runtime dependency) |
| libatomic | Atomic operations in hwy_contrib | Yes | Yes | Available in all riscv64 toolchains | None |
| qemu-riscv64 | Cross-compiled test execution | N/A | Required for cross-compile test runs | Available (qemu-user in Ubuntu/Debian) | QEMU 7.0+ needed for RVV 1.0 emulation |
| mold linker | Optional alternative linker | BROKEN | N/A | N/A | Issue #2854 open: mold segfaults on highway 1.2.0 riscv64; workaround is to use default ld |

Key downstream consumers of Highway that also require riscv64 attention:

- **libjxl**: Uses Highway for SIMD-accelerated JPEG XL encode/decode. A 2022 PR (#1429) to add riscv64 support was abandoned. Highway's RVV backend does not automatically benefit libjxl on riscv64 until libjxl adds its own riscv64 CI and build support.
- **Node.js/V8**: Vendors Highway for SIMD. Issue [#2967](https://github.com/google/highway/issues/2967) notes that Node.js was experiencing SIGILL crashes or build errors on RISC-V depending on build configuration, which was resolved by PR #2968 (RVV runtime dispatch re-enabled in Apr 2026).

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2854](https://github.com/google/highway/issues/2854) | Problems with mold-linker on riscv64 | Open | Medium | mold crashes with corrupted `.riscv.attributes` ISA string on highway 1.2.0 + GCC 13.3.0; workaround: use default ld; no fix assigned; root cause likely mold bug |
| [#2738](https://github.com/google/highway/issues/2738) | -march rv64gcv1p0 does not make sense on RVA23 platforms | Open | High | Ubuntu 25.10 targets rva23u64; highway's hardcoded march flag blocks additional RVA23 extensions and breaks LTO with GCC 15.2 (GCC bug #110812); additional f16 type conversion bug triggered when zvfhmin is present (rva23 profile includes zvfhmin); no fix or assigned PR |
| [#3148](https://github.com/google/highway/pull/3148) | ci: add riscv64 to multiarch CI workflow | Open PR | High | First attempt to add riscv64 CI; blocked on CLA; reviewer recommends GCC cross-compiler over QEMU approach; no automated regression detection exists until this merges |

Recently resolved issues (RISC-V-specific):

| ID | Title | Status | Resolution |
|---|---|---|---|
| [#2967](https://github.com/google/highway/issues/2967) / [PR #2968](https://github.com/google/highway/pull/2968) | RVV runtime dispatch: remove `&& 0` guard | Closed Apr 7, 2026 | LLVM #56592 fixed in Clang 19; GCC #115325 resolved; `&& 0` guard removed; runtime dispatch re-enabled for Clang 19+ |
| [PR #2996](https://github.com/google/highway/pull/2996) | RVV fix for Reorder/OrderedDemote2To: GCC 15 scalar codegen bug | Merged Apr 20, 2026 | Rolled back incorrect PR #2971 workaround; fixed scalar reference implementation path |
| [PR #2971](https://github.com/google/highway/pull/2971) | Attempted workaround for GCC-15 RVV vnclipu mis-optimization | Merged Apr 9, 2026, then superseded by #2996 | Root cause was in scalar reference path, not vector path; fully resolved in #2996 |
| [PR #2704](https://github.com/google/highway/pull/2704) | Enable VQSORT for RISC-V | Merged Sep 12, 2025 | Removed `HWY_ARCH_RISCV` preprocessor block; enabled for GCC 14+; tested on SpacemiT K1 hardware |
| [PR #2995](https://github.com/google/highway/pull/2995) | RVV count_value_test correctness failure | Merged Apr 21, 2026 | Test was running against sub-128-bit vectors; restricted to 128+ bit vectors |
| [PR #2586](https://github.com/google/highway/pull/2586) | Fixes for RVV detection and re-enable RVV with Clang 16+ or GCC 13+ | Merged Jun 6, 2025 | Formalized minimum compiler versions for non-broken RVV; updated version checks to 1.0 |

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. `-march rv64gcv1p0` hardcoding (issue [#2738](https://github.com/google/highway/issues/2738)): This flag is incompatible with RVA23 platform profiles and breaks LTO with GCC 15.2. The fix requires adopting target-attribute-based dispatch (which was implemented for Clang 19+ in PR #2968 but has not been extended to GCC 14+). Additionally, the RVA23 profile includes `zvfhmin`, which triggered a float16 type conversion bug in `rvv-inl.h` during testing (October 2025 discussion on the issue). The bug is unresolved. Any deployment on Ubuntu 25.10 or other RVA23-targeting distributions will hit this.

2. Runtime dispatch GCC gap: Runtime dispatch requires Clang 19+ as of 1.4.0. GCC-built binaries do not support runtime dispatch. This means a GCC-compiled binary cannot detect and use RVV at runtime on a system where RVV may or may not be present -- it will either always use RVV (requiring `-march=rv64gcv1p0` at build time) or never use it. This limits utility for distribution packages that must produce one binary for diverse hardware.

3. Zero CI coverage: No riscv64 CI exists. PR #3148 to add it is blocked on CLA and an unresolved approach disagreement (QEMU vs. cross-compiler). Until this lands, every merge to the RVV backend is unvalidated.

**Organizational blockers:**

- PR #3148 is blocked on a Google CLA from an external contributor. Google CLA enforcement is standard for the project and non-negotiable; the contributor must sign before the PR can proceed.
- The project's de-facto gatekeeper (jan-wassenberg) has not reviewed PR #3148 as of the report date.

**Acceptance probability:**

The RVV backend is clearly valued and actively maintained by Google DeepMind (jan-wassenberg) and PLCT Lab (luyahan). Issue [#2738](https://github.com/google/highway/issues/2738) shows jan-wassenberg engaged directly with the RVA23 compatibility problem in September-October 2025. The probability of accepting a correct CI fix (PR #3148 or an equivalent) is high once the CLA and approach questions are resolved. The probability of accepting a fix for issue #2738 is moderate but blocked on resolving the f16 type conversion bug on RVA23 profiles.

---

## 13. Investment Analysis

RISE has not funded any Highway-specific RISC-V work based on available data (RISE blog, riseproject.dev membership pages, GitHub search). The existing RVV backend was built by Google and PLCT Lab contributors without RISE involvement.

### 13.1 Functional Enablement

Issue [#2738](https://github.com/google/highway/issues/2738): Fix `-march` hardcoding for RVA23 compatibility. This requires extending target-attribute-based compilation (already implemented for Clang 19+ in PR #2968) to GCC 14+, and fixing the float16 type mismatch (`vfloat16mf2_t` vs `__rvv_uint16mf2_t`) that appears when `zvfhmin` is present without `zvfh`. The issue discussion (October 2025) shows the maintainer engaged but no PR opened.

Issue [#2854](https://github.com/google/highway/issues/2854): mold linker crash. Root cause is likely in mold's parsing of the `.riscv.attributes` ISA string produced by highway's RVV build. This requires investigation into which component (highway's CMake flags, binutils, or mold) generates the offending attribute string, and likely a bug report and fix to mold upstream. Relatively isolated; workaround (use `ld`) is available.

Extend runtime dispatch to GCC 14+: The GCC bug #115325 (RVV intrinsics without `-march`) is marked RESOLVED FIXED upstream, but PR #2968 only enabled Clang 19+. Extending to GCC 14+ would close the runtime dispatch gap for GCC-built distribution packages.

### 13.2 Performance Optimization

SumsOf8 is documented as slower on RVV. This is a known gap with no open PR. A hand-optimized widening reduction could improve throughput for operations that depend on it (e.g., histogram computations, u8 dot products).

bfloat16 emulation via int16 reinterpret: No native bf16 in RVV 1.0 baseline. Zvfbfmin (bf16 minimum floating-point) is defined in the RISC-V ISA specification as a ratified extension. If Zvfbfmin gains compiler support, a Highway RVV bf16 path could be added. This is future work dependent on toolchain support.

Data not available: no RISC-V-specific performance benchmarks were found to guide prioritization of other optimization targets.

### 13.3 CI/CD Infrastructure

PR [#3148](https://github.com/google/highway/pull/3148) proposes QEMU-based riscv64 CI via `run-on-arch-action`. Reviewer johnplatts prefers native GCC cross-compilers (proof-of-concept: [fork workflow runs](https://github.com/johnplatts/jep_google_highway/actions/runs/28099376891)). The cross-compiler approach would run on existing x86 runners without QEMU overhead and is faster.

The primary blocker is the Google CLA from the PR author. A contributor already holding a Google CLA could submit an equivalent PR immediately. Alternatively, Google or RISE could fund a dedicated riscv64 CI runner (native RISC-V hardware) to resolve both the CLA issue and the QEMU approach debate.

### 13.4 Ecosystem Enablement

libjxl: Highway's RVV backend does not automatically benefit libjxl on riscv64. libjxl would need its own riscv64 build and CI work. This is tracked separately from Highway.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix #2738: extend target-attribute dispatch to GCC 14+ and fix f16 type mismatch on RVA23 (zvfhmin) | 3-5 | Google/PLCT contributor | Critical |
| Functional | Fix RVV runtime dispatch for GCC 14+ (extend PR #2968 to GCC path) | 1-2 | Google/PLCT contributor | High |
| Functional | Investigate and fix mold linker crash (#2854): trace `.riscv.attributes` ISA string issue | 1-2 | Highway maintainer or mold upstream | Medium |
| CI/CD | Land riscv64 CI via GCC cross-compiler approach (resolve CLA, submit new PR or assist #3148) | 1 | External contributor with Google CLA or Google employee | Critical |
| CI/CD | Add native riscv64 hardware CI runner (RISE runner pool) | 2 (infra setup) | RISE infra team | High |
| Performance | Optimize SumsOf8 for RVV (widening reduction alternative) | 2-3 | RISC-V SIMD specialist | Medium |
| Performance | Establish riscv64 benchmark baseline and publish per-architecture numbers | 1-2 | Any contributor with riscv64 hardware | Medium |
| Functional | Add Zvfbfmin native bfloat16 path once toolchain support is available | 3-4 | Highway maintainer + toolchain dependency | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/highway repository](https://github.com/google/highway)
- [Highway homepage](https://google.github.io/highway/)
- [hwy/ops/rvv-inl.h](https://github.com/google/highway/blob/master/hwy/ops/rvv-inl.h)
- [hwy/detect_targets.h](https://github.com/google/highway/blob/master/hwy/detect_targets.h)
- [hwy/detect_compiler_arch.h](https://github.com/google/highway/blob/master/hwy/detect_compiler_arch.h)
- [hwy/targets.cc](https://github.com/google/highway/blob/master/hwy/targets.cc)
- [hwy/base.h](https://github.com/google/highway/blob/master/hwy/base.h)
- [CMakeLists.txt](https://github.com/google/highway/blob/master/CMakeLists.txt)
- [run_tests.sh](https://github.com/google/highway/blob/master/run_tests.sh)
- [GitHub Releases](https://github.com/google/highway/releases)
- [PR #2968: Enable RVV runtime dispatch for Clang 19+](https://github.com/google/highway/pull/2968)
- [PR #2704: Enable VQSORT for RISC-V](https://github.com/google/highway/pull/2704)
- [PR #2996: RVV fix for Reorder/OrderedDemote2To: GCC 15 scalar codegen bug](https://github.com/google/highway/pull/2996)
- [PR #3050: MaskedReduceSum/Min/Max and MaskedSqrtOr with RVV](https://github.com/google/highway/pull/3050)
- [PR #3122: add MaskedShiftLeftOr and masked shift specializations for x86/RVV](https://github.com/google/highway/pull/3122)
- [PR #3140: Add RVV overrides for RoundingShiftRightAndDemoteTo](https://github.com/google/highway/pull/3140)
- [PR #3145: Add MaskedXorOr, masked shifts and missing specializations for x86/sve/rvv](https://github.com/google/highway/pull/3145)
- [PR #3148: ci: add riscv64 to multiarch CI workflow](https://github.com/google/highway/pull/3148)
- [Issue #2738: -march rv64gcv1p0 does not make sense on RVA23 platforms](https://github.com/google/highway/issues/2738)
- [Issue #2854: Problems with mold-linker on riscv64](https://github.com/google/highway/issues/2854)
- [Issue #2967: RVV runtime dispatch: can the `&& 0` be removed?](https://github.com/google/highway/issues/2967)
- [Ubuntu Launchpad bug #2121375: highway FTBFS on rva23u64](https://bugs.launchpad.net/ubuntu/+source/highway/+bug/2121375)
- [Debian buildd tracker: highway package](https://buildd.debian.org/status/package.php?p=highway)
- [Arch Linux RISC-V port: highway riscv64.patch](https://github.com/felixonmars/archriscv-packages/tree/main/highway)
- [johnplatts fork CI proof-of-concept for cross-compiler approach](https://github.com/johnplatts/jep_google_highway/actions/runs/28099376891)
- [RISC-V vectorized sort paper: arXiv:2205.05982](https://arxiv.org/abs/2205.05982)
- [RISE Project member list](https://riseproject.dev)
- [GCC bug #110812: RISC-V: Always register vector built-in functions during LTO](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=110812)
- [GCC bug #115325: RVV intrinsics unavailable without -march](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=115325)
- [LLVM bug #56592: riscv_vector.h gated by preprocessor instead of target attributes](https://github.com/llvm/llvm-project/issues/56592)