---
title: Highway
parent: Project Reports
color: yellow
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Meson
    relation: build-dependency
    criticality: optional
  - name: Bazel
    relation: build-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
  - name: mold
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="highway" %}

# Highway

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Optimization level:** full<br/>
**Scope:** RISC-V (riscv64/linux) support status for Highway<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[Google Highway](https://github.com/google/highway) is a C++ SIMD abstraction library providing a single portable API over platform-specific vector intrinsics. It targets amd64 (SSE2 through AVX-512), AArch64 (NEON, SVE, SVE2), RISC-V (RVV 1.0), PowerPC (VSX), WASM (SIMD128/256), and LoongArch (LSX/LASX). The library is a compile-time-dispatch design: each backend is a header (`hwy/ops/<target>-inl.h`) re-included per target via `hwy/foreach_target.h`, with the active target selected either at compile time or, where supported, at runtime via a CPU-feature check.

Highway is hosted under the `google` GitHub organization. Its README states explicitly: "This is not an officially supported Google product." There is no steering committee, no formal governance body, and no written tier policy for architectures. No MAINTAINERS, OWNERS, or CODEOWNERS file exists (direct fetch attempts on these paths returned 404). Jan Wassenberg (contact `janwas@google.com`) is the founder and de facto lead maintainer; a small set of Google engineers act as reviewers via ordinary GitHub PR review. The library is dual-licensed Apache License 2.0 / BSD-3-Clause.

Google LLC is a RISE Project Premier Member (one of eight: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent), but this is a general corporate membership, not a Highway-specific affiliation. Highway itself is not listed on [riseproject.dev](https://riseproject.dev), and no RISE blog post mentions Highway by name (checked all posts published May 2024 through September 2026, including the two closest topical candidates, "SALTyRN: Turning NEON kernels into fast verified RVV code with LLMs" and "OpenJDK: CMoveX & Vectorization," neither of which references Highway).

Community stance on new ports: no explicit written acceptance policy or tier document was found (a GitHub search for "riscv tier" issues returned nothing). Inferred from commit and issue history, the project is receptive to new-architecture contributions from non-Google, external contributors: the RISC-V port was substantially built out by the Institute of Software, Chinese Academy of Sciences (ISCAS, via contributor Lu Yahan) and by independent contributor Mathieu Malaterre (a Debian packager). The practical gate is a compiler/testability bar, not a corporate-approval gate: a target is expected to be "cross-compilable with currently supported Clang or GCC, and tested using QEMU" in CI.

## 2. Port History and Upstreaming Timeline

The RISC-V port targets the RVV (RISC-V Vector) 1.0 extension and has been in-tree since 2021; there is no known out-of-tree or vendor fork.

| Date | Event | Source |
|---|---|---|
| 2020-09-03 | Issue [#6](https://github.com/google/highway/issues/6), "Any plan for ARM SVE and RiscV support?", opened; later closed once experimental RVV support landed | [Issue #6](https://github.com/google/highway/issues/6) |
| 2021-02-03 | First RVV-referencing commit and PR [#41](https://github.com/google/highway/pull/41) merged (jan-wassenberg, Google): "Implement RVV Round etc." per discussion with K. Asanovic, B. Huffman, A. Waterman | [PR #41](https://github.com/google/highway/pull/41) |
| 2021-06-18 | PR [#233](https://github.com/google/highway/pull/233) merged: "Consider non-V extensions RISC-V" | [PR #233](https://github.com/google/highway/pull/233) |
| 2021-08-31 | PR [#360](https://github.com/google/highway/pull/360) merged (Saleem Abdulrasool / compnerd, Google): "build: add experimental support for RISCV", a Clang/LLVM-only Bazel path (+15/-0 lines) | [PR #360](https://github.com/google/highway/pull/360) |
| 2022-07-04 to 2022-07-06 | Issue [#818](https://github.com/google/highway/issues/818) (dynamic dispatch vs Debian binaries) and issue [#822](https://github.com/google/highway/issues/822) (Debian: missing HWY_RVV on riscv64) closed; established the `try_compile`-based CMake arch-string detection still in use, after finding GCC rejects `-menable-experimental-extensions` and Clang rejects the `rv64gcv1p0` spelling, converging on GCC 11.2 / Clang 14 as a working baseline | [Issue #822](https://github.com/google/highway/issues/822) |
| 2022-07-07 | Issue [#838](https://github.com/google/highway/issues/838) opened, "Implement runtime dispatch on riscv64" (tracker); stayed open roughly 22 months, blocked on lack of riscv64 hardware with V 1.0 for Debian buildds and on GCC/Clang not shipping usable `riscv_vector.h` gating; closed 2024-05-27 ("Hooray, this is at long last done :D") | [Issue #838](https://github.com/google/highway/issues/838) |
| 2023-03-01 | PR [#1173](https://github.com/google/highway/pull/1173) merged: "Initial support for RISCV64/GCC-13", the first real GCC vector-target support | [PR #1173](https://github.com/google/highway/pull/1173) |
| 2024-04-10 to 2024-05-06 | luyahan (ISCAS) lands PR [#2073](https://github.com/google/highway/pull/2073) (`HWY_ARCH_RVV` -> `HWY_ARCH_RISCV`), PR [#2084](https://github.com/google/highway/pull/2084) (atomics), PR [#2110](https://github.com/google/highway/pull/2110) (`HWY_ATTAINABLE_RISCV`) | PR links above |
| 2025-06-06 | PR [#2586](https://github.com/google/highway/pull/2586) merged: RVV detection fixes, re-enable RVV for Clang 16+ / GCC 13+ | [PR #2586](https://github.com/google/highway/pull/2586) |
| 2025-09-12 | PR [#2704](https://github.com/google/highway/pull/2704) merged: Enable VQSORT for RISC-V, tested on Banana Pi BPI-F3 (SpacemiT K1) hardware | [PR #2704](https://github.com/google/highway/pull/2704) |
| 2025-09-29 to 2026-07-01 | Issue [#2738](https://github.com/google/highway/issues/2738) (`-march=rv64gcv1p0` hardcoding vs RVA23 profiles, interacting with GCC LTO bug GCC PR110812) opened and closed | [Issue #2738](https://github.com/google/highway/issues/2738) |
| 2026-01-25 | Issue [#2854](https://github.com/google/highway/issues/2854) opened, "Problems with mold-linker on riscv64"; still open as of 2026-09-30 | [Issue #2854](https://github.com/google/highway/issues/2854) |
| 2026-04-05 to 2026-04-07 | Issue [#2967](https://github.com/google/highway/issues/2967) opened by JamieMagee, resolved same week by PR [#2968](https://github.com/google/highway/pull/2968): RVV runtime dispatch enabled for Clang 19+ (removes the `&& 0` guard) once LLVM issue [#56592](https://github.com/llvm/llvm-project/issues/56592) (fixed in Clang 19) and GCC Bugzilla [#115325](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=115325) (resolved, plus GCC function multiversioning landed late 2024) cleared; jan-wassenberg approved "LGTM" | [Issue #2967](https://github.com/google/highway/issues/2967), [PR #2968](https://github.com/google/highway/pull/2968) |
| 2026-06-23 to 2026-06-25 | PR [#3148](https://github.com/google/highway/pull/3148), "ci: add riscv64 to multiarch CI workflow", closed **without merging** | [PR #3148](https://github.com/google/highway/pull/3148) |
| 2026-06-25 to 2026-06-30 | PR [#3157](https://github.com/google/highway/pull/3157) merged: "Updated multiarch build/test workflow to use cross compilers (adds RISC-V, PPC, LoongArch, s390x)"; this is the PR that actually landed riscv64 CI, superseding #3148 | [PR #3157](https://github.com/google/highway/pull/3157) |
| 2025-11-08 to 2026-07-02 | Issue [#2793](https://github.com/google/highway/issues/2793) (riscv64/GCC15 `HwyDemoteTest` EMU128 failure) opened and closed | [Issue #2793](https://github.com/google/highway/issues/2793) |
| 2026-08-25 | PR [#3317](https://github.com/google/highway/pull/3317) merged: "Do not extend the EMU128 opt-out to GCC 14/15 on RISC-V" | [PR #3317](https://github.com/google/highway/pull/3317) |
| 2026-08-14 to 2026-09-03 | Issue #3281, "RVV `ReorderWidenMulAccumulate` 10-30% slower than portable `WidenMulAccumulate`" on Banana Pi BPI-F3, opened and closed | https://github.com/google/highway/issues/3281 |
| 2026-09-03 | Issue #3353 opened, parent tracker for a differential cross-target test harness (not RISC-V-specific, but built partly to strengthen RVV agreement coverage) | https://github.com/google/highway/issues/3353 |
| 2026-09-11 | PR [#3375](https://github.com/google/highway/pull/3375) opened, "tests: add differential harness for cross-target agreement"; still open | [PR #3375](https://github.com/google/highway/pull/3375) |

Key contributors and affiliations:

- **jan-wassenberg** (Jan Wassenberg) - Google. Founder, primary author, lead reviewer/merger of essentially every riscv64 change.
- **Lu Yahan (luyahan)** - Institute of Software, Chinese Academy of Sciences (ISCAS). Landed `HWY_ARCH_RISCV`, atomics, and `HWY_ATTAINABLE_RISCV` in 2024; the main external institutional contributor for RISC-V.
- **Saleem Abdulrasool (compnerd)** - Google; affiliated with LLVM/Swift tooling. Added the first experimental Bazel RISC-V build path (2021).
- **Mathieu Malaterre** - independent, Debian packager. Primary external bug reporter across the 2022 wave (#818, #822, #838, #856, #888), each surfaced via Debian buildd failures.
- **Khem Raj** - OpenEmbedded/Yocto. 32-bit/64-bit RISC-V CMake detection (PR #2330).
- **Jamie Magee** - drove the 2026 revival of RVV runtime dispatch (#2967/#2968), unblocked purely by upstream compiler fixes.

The entire RVV backend is merged to master; there are no known out-of-tree patches required for functional correctness.

## 3. Upstream Support Tier

No formal, named tier system exists (no "Tier 1/2/3" labels anywhere in the repo). The implicit policy, inferred from CI structure, is that a target remains supported as long as it is cross-compilable with a currently supported Clang or GCC version and testable under QEMU; targets failing that bar (e.g. PPC10, blocked by compiler bugs) are left unsupported.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree code | Yes | Yes | Yes |
| CI native runner | Yes (`ubuntu-22.04`/`24.04`, `windows-2022`) | Yes (`ubuntu-26.04-arm` for `aarch64_cmake`) | No |
| CI QEMU/cross | No | No | Yes (`.github/workflows/multiarch.yml`, since PR #3157, merged 2026-06-30) |
| Build gates PR merge | Yes | Yes | Yes |
| Test failure gates PR merge | Yes | Yes | **No** - `ctest` step has `continue-on-error: true` |
| Official pre-built binaries | No (source only) | No (source only) | No (source only) |
| Distro package (main archive) | Yes | Yes | Debian sid/trixie and Ubuntu 26.04 "resolute" only (`libhwy-dev`/`libhwy1t64`, 1.3.0-2) |
| Compiler minimum enforced | GCC 11+ / Clang 6+ | GCC 11+ / Clang 6+ | GCC 13+ / Clang 16+ (`HWY_BROKEN_RVV` below that) |
| Runtime dispatch | Yes | Yes | Clang 19+ only (no GCC equivalent as of research date) |

riscv64 is exercised in CI (build + QEMU test run) as of 2026-06-30, but because its test step does not gate merges, it sits functionally between "no CI" and "fully gated CI" - this is the deciding factor behind the readiness grade in Section 13.

## 4. Technical Architecture and RISC-V-Specific Subsystems

All riscv64-specific SIMD code lives in one file, `hwy/ops/rvv-inl.h`. There is no `arch/riscv/` directory (Highway uses flat `hwy/ops/<target>-inl.h` naming throughout), no standalone `.S` assembly file for RISC-V, and no JIT backend anywhere in Highway - dispatch is compile-time re-inclusion (`hwy/foreach_target.h`) plus, where supported, a runtime CPU-feature check, not a JIT.

### 4.1 SIMD backend size and maturity

Direct clone inspection (HEAD `d6a05fc1`) gives the following line counts for `hwy/ops/*.h`:

| File | Lines | Arch |
|---|---|---|
| x86_128-inl.h | 15,289 | amd64 |
| arm_neon-inl.h | 11,808 | arm64 |
| x86_256-inl.h | 9,768 | amd64 |
| x86_512-inl.h | 8,961 | amd64 |
| **rvv-inl.h** | **7,595** | **riscv64** |
| arm_sve-inl.h | 7,387 | arm64 (scalable) |
| ppc_vsx-inl.h | 6,952 | ppc64 |
| loongarch_lsx-inl.h | 5,627 | loongarch |
| wasm_128-inl.h | 5,468 | wasm |
| emu128-inl.h | 3,011 | generic scalar-vector fallback |
| scalar-inl.h | 2,190 | generic 1-lane fallback |

RVV is smaller than the combined amd64 (~34,000 lines across three width tiers) or arm64 (~19,200 lines across NEON+SVE) backends, which is architecturally expected: RVV's `vsetvl`-based length-agnostic model needs far less code than fixed-width tiering. It is larger than `ppc_vsx-inl.h` and the LoongArch files, and close to `arm_sve-inl.h`, its closest architectural analog (also a scalable-vector ISA). TODO/FIXME density is unremarkable (3 in 7,595 lines, vs. 9/7,387 for SVE and 5/11,808 for NEON), and no "stub"/"unimplemented" markers exist in the file. `rvv-inl.h` contains 288 calls to native `__riscv_v*` RVV intrinsics, showing genuine hand-tuned masked/widened vector-register manipulation, not a scalar shim.

Op coverage (grep counts of `HWY_API ... <Op>`) confirms parity with peer scalable-vector backends:

| Op | rvv | arm_sve | x86_128 | ppc_vsx | wasm_128 | scalar |
|---|---|---|---|---|---|---|
| Gather | 2 | 2 | 4 | 0 | 0 | 4 |
| Scatter | 1 | 1 | 3 | 0 | 0 | 3 |
| Compress | 6 | 16 | 5 | 9 | 0 | 9 |
| Expand | 4 | 5 | 4 | 4 | 0 | 2 |
| Reduce | 6 | 6 | 0 | 1 | 0 | 0 |
| MulEven | 1 | 9 | 7 | 1 | 5 | 1 |

RVV has Gather/Scatter/Expand/Reduce entirely absent from PPC VSX and WASM, and is on par with SVE for Reduce/Expand - evidence of a maintained, feature-complete backend.

ISA extensions referenced: the base **V** (vector, 1.0) extension (`-march=rv64gcv1p0`, target-attribute string `arch=+v`) and **Zvfh** (`__riscv_zvfh`, vector half-precision). No references to Zba/Zbb/Zbc/Zbs (Bitmanip) or other scalar extensions were found in any code search.

### 4.2 Other RISC-V-specific code

- `hwy/timer.h` - the only inline assembly for RISC-V: `asm volatile("fence; rdtime %0" : "=r"(t));` (reads the `time` CSR).
- `hwy/abort.cc` / `hwy/base.h` - `exit(1)` instead of a trap on RISC-V, because "trap/abort just freeze Spike" (the RISC-V ISA simulator).
- `hwy/aligned_allocator.cc` - RISC-V-specific allocation padding to avoid crossing a 4K boundary, guarded by `__riscv_v_intrinsic >= 11000`.
- `hwy/os_rng.cc` - disables the `getrandom()` heuristic on non-Linux RISC-V.
- `HWY_RVV_HAVE_F16_VEC` in `base.h` - guarded by `__riscv_zvfh` plus Clang >= 16.
- Numerous test files (`div_test.cc`, `convert_test.cc`, `masked_arithmetic_test.cc`, etc.) carry `#if HWY_ARCH_RISCV` / `HWY_TARGET==HWY_RVV` guards working around QEMU/Clang codegen bugs or reducing iteration counts for slow emulation (`AdjustedReps`) - real correctness/performance guards, not stubs.
- Contrib code (`vqsort-inl.h`, `dot-inl.h`, `btree-inl.h`, `unroller-inl.h`, `bit_pack-inl.h`, `highwayhash-inl.h`, and others) is adapted for RVV's scalable, sizeless-vector semantics (which forbid using RVV vector types as struct members or array elements).

Build system integration is complete and wired into CI: `BUILD` (Bazel `select` on `@platforms//cpu:riscv64`), `CMakeLists.txt` (`HWY_CMAKE_RVV` option), `meson.build`/`meson_options.txt` (`rvv` boolean option), `cmake/FindAtomics.cmake` (riscv64 atomics-library note), and `.github/workflows/multiarch.yml` (the riscv64 CI matrix entry, see Section 7).

### 4.3 Comparison table

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD backend size | ~34,000 lines (3 files) | ~19,200 lines (NEON+SVE) | 7,595 lines (1 file) |
| ISA extensions | SSE2 through AVX-512 (tiered) | NEON, SVE, SVE2 (tiered) | V (RVV 1.0), optional Zvfh |
| Target count | 10 (SSE2 ... AVX3_SPR) | 4+ (NEON, SVE, SVE2, SVE2_128) | 1 (RVV) |
| Runtime dispatch | Yes, mature | Yes, mature | Yes, Clang 19+ only |
| Float16 native | Via F16C / AVX-512FP16 | Via NEON f16 | Only with Zvfh/Zvfhmin |
| Bfloat16 native | Via AVX512_BF16/VNNI | Via SVE BF16 | Emulated (int16 reinterpret); no native bf16 in RVV 1.0 baseline |
| Gather/Scatter | Yes | Yes | Yes |
| Cache control | Yes | Yes | No RISC-V path in `cache_control.h` |
| Performance counters | Yes | Yes | No RISC-V path in `perf_counters.cc` |
| Operator overloads (+, -, *) | Yes | Yes | No - sizeless-type constraint |
| VQSORT | Yes | Yes | GCC 14+ or Clang 19+ only |
| Assembly (.S) files | None | None | None (one inline-asm snippet in timer.h) |
| JIT backend | None | None | None |

**Bottom line:** the riscv64 (RVV) backend is a complete, hand-tuned implementation with feature parity to SVE/PPC on Gather/Scatter/Compress/Expand/Reduce, dedicated runtime dispatch, dedicated CI/QEMU coverage, and active 2026 commit history (masked ops, `Compress` rewrites, `WidenMulAccumulate`, runtime dispatch enablement). It is not a stub; it is architecturally leaner than x86/NEON only because RVV's `vsetvl` model needs less code to cover the same operation surface - the same relationship SVE has to NEON.

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 CMake

`CMakeLists.txt` line 76: `set(HWY_CMAKE_RVV ON CACHE BOOL "Set copts for RISCV with RVV?")`. When `HWY_RISCV` and `HWY_CMAKE_RVV` are both on, CMake adds `-march=rv64gcv1p0` (or `rv32gcv1p0` for 32-bit) to both compile and link flags; on Clang it additionally adds `-menable-experimental-extensions`. Setting `-DHWY_CMAKE_RVV=OFF` disables forcing RVV as a compile-time baseline (RVV is then still reachable via Clang 19+ runtime dispatch, per the code comment at that line).

### 5.2 Meson

`meson setup build -Drvv=true` (default `true` in `meson_options.txt`). `meson.build` (lines 38, 66-69, 322-331) detects `__riscv`/`__riscv_xlen` and applies the same `-march=rv<XLEN>gcv1p0` logic as CMake. There is no riscv64-specific Meson CI job (`meson_build_test.yml` has zero riscv references), so this path is not validated in CI.

### 5.3 Bazel

`BUILD` uses `select({"@platforms//cpu:riscv64": ["-march=rv64gcv1p0", ...], ...})` and conditionally includes `hwy/ops/rvv-inl.h` for riscv64. This was the original RISC-V build path (PR #360, 2021), predating CMake/Meson support.

### 5.4 Toolchain minimums (from `hwy/detect_targets.h`)

- **GCC < 13** or **Clang < 16**: `HWY_BROKEN_RVV` is set; RVV fails to compile.
- **Clang >= 19** or **GCC >= 15**: `HWY_HAVE_RUNTIME_DISPATCH_RVV` is enabled, citing [LLVM issue #56592](https://github.com/llvm/llvm-project/issues/56592) (fixed in Clang 19) and [GCC Bugzilla #115325](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=115325) (resolved).
- Baseline detection additionally requires `__riscv_v_intrinsic >= 11000` (RVV intrinsics spec v1.1.0) alongside `__riscv_v`.
- `HWY_HAVE_TUPLE` for RVV is true starting with Clang 16, anticipated true starting with GCC 14.

### 5.5 CI build/test invocation (exact, from `.github/workflows/multiarch.yml`)

GCC job:
```
sudo apt-get update && sudo apt-get install qemu-user g++-16-riscv64-linux-gnu

CXXFLAGS="-DHWY_COMPILE_ONLY_STATIC=1" \
  CC="riscv64-linux-gnu-gcc-16" \
  CXX="riscv64-linux-gnu-g++-16" \
  cmake -DHWY_WARNINGS_ARE_ERRORS=ON -DCMAKE_CXX_STANDARD=17 \
    -DCMAKE_C_COMPILER_TARGET="riscv64-linux-gnu" \
    -DCMAKE_CXX_COMPILER_TARGET="riscv64-linux-gnu" \
    -DCMAKE_CROSSCOMPILING=true \
    -DCMAKE_CROSSCOMPILING_EMULATOR="qemu-riscv64;-cpu;max,v=true,vlen=256;-L;/usr/riscv64-linux-gnu" \
    -DCMAKE_SYSTEM_NAME=Linux -DCMAKE_SYSTEM_PROCESSOR="riscv64" \
    -B out .
cmake --build out
ctest --test-dir out
```
Clang job swaps in `clang-22`/`clang++-22` with the same flags. Runner OS is `ubuntu-26.04` (standard x86_64 GitHub-hosted, not native riscv64 hardware). No `riscv64.cmake` toolchain file exists; the target is set directly on the command line. No Dockerfile exists anywhere in the repository (confirmed by clone inspection and a zero-result `search_code filename:Dockerfile riscv64` query) - cross-compilation is done by installing `.deb` cross-toolchain packages directly on the runner.

### 5.6 Native/plain build and QEMU

Generic build (README.md, applies natively or under QEMU user-mode):
```
sudo apt install cmake
mkdir -p build && cd build
cmake ..
make -j && make test
```
Running cross-compiled tests requires the Debian/Ubuntu `qemu-user-binfmt` package. CI wires QEMU in as `CMAKE_CROSSCOMPILING_EMULATOR="qemu-riscv64;-cpu;max,v=true,vlen=256;-L;/usr/riscv64-linux-gnu"`, enabling the RVV vector extension with a 256-bit vector length inside the emulated CPU.

### 5.7 Known build failures

- **mold linker** (issue [#2854](https://github.com/google/highway/issues/2854), open): segfaults ("`ld terminated with signal 11`") parsing the `.riscv.attributes` ISA string Highway's RVV build emits (e.g. `rv64i2p1_m2p0_a2p1_f2p2_d2p2_c2p0_v1p0_zicsr2p0_zifencei2p0_zmmul1p0_zve32f1p0_zve32x1p0_zve64d1p0_zve64f1p0_zve64x1p0_zvl128b1p0_zvl32b1p0_zvl64b1p0`). Reproduced via a Conan build of highway 1.2.0 on real riscv64 hardware with GCC 13.3.0. Workaround: use the default `ld`. Root cause (Highway vs. mold) is undetermined.
- Issue [#2738](https://github.com/google/highway/issues/2738) (`-march=rv64gcv1p0` vs RVA23 profiles, interacting with GCC LTO bug GCC PR110812) and issue [#2793](https://github.com/google/highway/issues/2793) (GCC15/LTO `HwyDemoteTest` EMU128 failure) are both **closed** (2026-07-01 and 2026-07-02 respectively).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Full SIMD API (arithmetic, logical, compare) | Yes | Yes | Yes | None |
| Gather/Scatter | Yes | Yes | Yes | None |
| Reductions / masked reductions | Yes | Yes | Yes | None |
| Float16 native | Conditional (F16C) | Conditional (NEON f16) | Conditional (Zvfh/Zvfhmin required) | Requires optional extension |
| Bfloat16 native | Conditional (AVX512_BF16) | Conditional (SVE BF16) | Emulated (int16 reinterpret) | No native bf16 in RVV 1.0 baseline; Zvfbfmin not yet used |
| Operator overloads | Yes | Yes | No | Sizeless-type constraint on RVV |
| Cache control (prefetch/fence) | Yes | Yes | No | No RISC-V path |
| Performance counters | Yes | Yes | No | No RISC-V path |
| VQSORT | Yes | Yes | GCC 14+ / Clang 19+ only | Unavailable on older toolchains |
| Runtime dispatch | Yes | Yes | Clang 19+ only | No GCC equivalent as of research date |
| Test-gated CI | Yes | Yes | No (`continue-on-error: true`) | Test regressions do not block merges |

### 6.1 Performance gaps

- **SumsOf8** is documented as "slower on RVV/WASM" (manual shifts/adds; no dedicated widening-reduction intrinsic).
- Issue #3281 (closed 2026-09-03), reported on a Banana Pi BPI-F3 (SpacemiT K1, RVV 1.0): `ReorderWidenMulAccumulate` in `rvv-inl.h` is 10-30% slower than the generic portable `WidenMulAccumulate`, with the reporter confirming the effect on a real algorithm and root-causing it to extra `vslideup`/`vslidedown` combine/split overhead around `vwmaccu.vv` needed to satisfy Highway's split-sum API. This was closed but represents the only quantified RVV-specific regression found anywhere in issue trackers or the literature.
- No independent academic benchmark of Highway specifically on RVV was found (checked arXiv:2605.10860 and arXiv:2608.28097, and the RVV benchmark suites VecIntrinBench, rvv-bench, gemm-bench - none built around Highway).
- No RISE blog post benchmarks Highway on RISC-V; the two closest candidates ("SALTyRN," which compares against XNNPACK/GCC-autovec/Neon2RVV, and "OpenJDK: CMoveX & Vectorization," reporting 2.1x average/4x peak from unrelated OpenJDK vectorization work) do not mention Highway.
- Data not available: no quantitative riscv64-vs-arm64/amd64 comparative benchmark for Highway exists in any indexed or searchable source as of 2026-09-30.

### 6.2 Floating-point and correctness

No open RVV-specific NaN or floating-point correctness bugs were found; all NaN/FP-and-riscv search hits are closed, historical build-failure issues from the 2021-2024 RVV bring-up period. One open, non-RISC-V-specific feature request, issue [#2542](https://github.com/google/highway/issues/2542) ("Should FMA optimizations be implemented for SCALAR/EMU128 on PPC/RISC-V/GPU?"), asks for `__builtin_fma`/`__builtin_fmaf` use on the SCALAR/EMU128 fallback targets for RISC-V CPUs with F/D but not V extensions; it is unimplemented.

### 6.3 Security hardening

Data not available: no RISC-V-specific security hardening gaps, sanitizer coverage gaps, or stack-canary issues were identified in any research source.

## 7. CI/CD Infrastructure

### 7.1 Files checked

`.github/workflows/` contains four files: `build_test.yml`, `docs_pages_workflow.yml`, `meson_build_test.yml`, `multiarch.yml`. Grepping all four for "riscv" (case-insensitive) finds matches only in `multiarch.yml`; the other three have zero riscv references. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist.

### 7.2 What `multiarch.yml` actually does

Trigger: `on: [push, pull_request]` - every push and every PR, not `workflow_dispatch`-only and not label-gated. Two jobs, `multiarch` (GCC 16) and `multiarch_clang22` (Clang 22), each `runs-on: ubuntu-26.04` (a standard x86_64 GitHub-hosted runner - riscv64 is **not** a native runner anywhere in this repository), each containing a riscv64 matrix entry:
```
- arch: riscv64
  cxx_flags: -DHWY_COMPILE_ONLY_STATIC=1
  compiler_tgt_cpu_arch: riscv64
  qemu_emulator: qemu-riscv64;-cpu;max,v=true,vlen=256
```
Both jobs cross-compile with a native apt cross-toolchain package (`g++-16-riscv64-linux-gnu` or `clang-22`), run `cmake --build out` (a genuine, gating build step), and then run:
```
- name: Test
  continue-on-error: true
  run: ctest --test-dir out
```

**The critical fact:** the test step carries `continue-on-error: true`. Tests do execute, under QEMU, with RVV enabled (`-cpu max,v=true,vlen=256`), but a failing riscv64 test never fails the job or blocks a merge - only a compile failure gates the PR. This is the direct basis for the readiness grade in Section 13: for grading purposes it is equivalent to build-only CI, not tests-pass-and-gate CI. PR [#3148](https://github.com/google/highway/pull/3148) (an earlier attempt to add riscv64 CI) was closed without merging and superseded by PR [#3157](https://github.com/google/highway/pull/3157) (merged 2026-06-30), which is the version described above.

### 7.3 Comparison table

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | Yes | Yes (`aarch64_cmake` job) | No |
| QEMU/cross-compile job | No | No | Yes (since 2026-06-30) |
| Build gates merge | Yes | Yes | Yes |
| Test failure gates merge | Yes | Yes | **No** (`continue-on-error: true`) |
| RISE runners in Highway's own CI | Data not available | Data not available | Data not available (none found; RISE runners are used by a separate downstream working group, see Section 9) |

## 8. Distribution and Release Status

Highway publishes source-only releases. Release tags (by commit date, from `git ls-remote`/`git log` since GitHub Releases API access was denied this session): 1.0.1 (2022-08-24) through 1.3.0 (2025-08-14) and 1.4.0 (2026-04-22). No release has shipped since 1.4.0 as of 2026-09-30; everything merged after 2026-04-22 (PR #3185, #3317, #3334, #3339) exists only on `master`.

| Source | Package | riscv64 available | Version | Notes |
|---|---|---|---|---|
| GitHub Releases | Source tarball | Source only | 1.4.0 (2026-04-22) | No prebuilt binaries for any architecture |
| Debian sid/trixie | `libhwy-dev`, `libhwy1t64` | Yes | 1.3.0-2 | Built by Debian from apparently-unpatched upstream source; one release behind (predates the RVV runtime-dispatch fix shipped in 1.4.0) |
| Ubuntu 26.04 "resolute" | `libhwy-dev`, `libhwy1t64` | Yes | 1.3.0-2 | Architectures: amd64, arm64, armhf, i386, ppc64el, riscv64, s390x |
| PyPI `highway` | Python wheel | Not applicable | 0.9.1 | Unrelated project ("Highway Workflow Engine," `rodmena-limited/highway-driver`), pure Python, no connection to google/highway |
| RISE wheel builder | - | Not listed | - | Highway is not itself a Python package on the RISE builder's 87-package list; it appears only as a transitive C++ dependency of other packages there (see Section 9) |
| Arch Linux RISC-V (archriscv.felixc.at) | - | Unconfirmed | - | Dynamic query page did not surface a package listing in this research pass [NEEDS VERIFICATION] |

Note: `libhighwayhash-dev`/`libhighwayhash0t64` also exist on riscv64 in Debian/Ubuntu but are from the separate "HighwayHash" hash-function project, not google/highway's SIMD library.

For a user wanting a working riscv64 binary with current (1.4.0) RVV runtime dispatch: build from source with GCC 13+ or Clang 16+ (Clang 19+ specifically for runtime dispatch), since no distro package yet ships 1.4.0 on riscv64.

## 9. Dependencies

Highway is a leaf C++ SIMD template library with no crypto, compression, or memory-allocator runtime dependencies. Its risk surface on riscv64 is entirely in its toolchain, build tooling, and optional test path.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes / blocking issues |
|---|---|---|---|---|---|
| GCC | Critical build-dependency; primary compiler for RVV vector-intrinsic codegen | Builds, but was broken by GCC 15 + LTO (GCC PR110812 drops vector-builtin registration) | Regressed on GCC 15 + LTO (issue [#2793](https://github.com/google/highway/issues/2793), closed 2026-07-02); GCC 13+ required to avoid `HWY_BROKEN_RVV`; GCC 15+ needed for runtime-dispatch target attributes | Not a release artifact | CI now uses GCC 16 for riscv64 cross-compilation |
| LLVM | Critical build-dependency; alternate RVV codegen path | Was broken on Clang 20/21/22 point releases (undeclared-identifier errors from RVV intrinsic API churn vs. Highway's macros) | Issue [#2554](https://github.com/google/highway/issues/2554) ("Failure to compile with clang++ 20 on riscv64"), open ~15 months, closed 2026-07-02 | Not a release artifact | Clang 16+ required to avoid `HWY_BROKEN_RVV`; Clang 19+ required for runtime dispatch (LLVM #56592 fix); CI uses Clang 22 |
| CMake | Critical build-dependency; primary build system | `HWY_CMAKE_RVV` (default ON) sets `-march=rv<XLEN>gcv1p0`; `try_compile`-based arch detection established via issue #822 (2022) | N/A | N/A | No riscv64-specific CMake blockers beyond historical detection fixes (PR #2330, PR #2396, both merged) |
| Meson | Optional build-dependency; alternate build system | `rvv` option (default true) mirrors CMake's `-march` logic | Unvalidated in CI - `meson_build_test.yml` has zero riscv references | N/A | No dedicated riscv64 Meson CI job |
| Bazel | Optional build-dependency; alternate build system | `select({"@platforms//cpu:riscv64": [...]})`, the original 2021 RISC-V build path (PR #360) | Unvalidated in CI - no dedicated riscv64 Bazel job found | N/A | Also the path RISE's `python-wheels` working group interacts with when statically linking Highway (see Section 14) |
| googletest | Optional test-dependency; link-only via `GTest::gtest` | Builds fine (pure portable C++, no SIMD/asm) | No Highway-specific gtest-riscv64 failures found | Available as a riscv64 Debian/Ubuntu package | googletest's own maintainers state they "don't officially support risc-v64" (google/googletest#3756, filed 2022-02-05, still open as of 2026-08-14); low severity for Highway since usage is link-only |
| QEMU | Optional test-dependency; carries a TCG JIT backend, used to run riscv64 (incl. RVV) tests in CI | N/A (emulator, not linked) | Runs Highway's riscv64 test suite via `qemu-riscv64 -cpu max,v=true,vlen=256`; QEMU's own issue tracker is on GitLab, not GitHub, so GitHub-based search returns 0 riscv64 hits - a tooling blind spot, not evidence of a clean RVV/TCG implementation | N/A | A GitLab-based follow-up is recommended before treating "no GitHub issues" as clean |
| mold | Optional build-dependency; alternate linker for the `hwy_list_targets`/`hwy_contrib` link step | **Currently broken for Highway specifically**: issue [#2854](https://github.com/google/highway/issues/2854), open since 2026-01-25, mold segfaults on Highway's `.riscv.attributes` ISA string | N/A (link-time only) | N/A | mold's own tracker shows a broader, though closed, history of riscv64 linker bugs (rui314/mold#358, #1451, #1400, #1340, #222), suggesting riscv64 support in mold is still maturing generally |

The one currently open, Highway-specific, riscv64-blocking issue across this entire dependency set is #2854 (mold). GCC 15/LTO and Clang 20-22 RVV-intrinsic breakages were real but have since closed (2026-07-01/02).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2854](https://github.com/google/highway/issues/2854) | Problems with mold-linker on riscv64 | Open (since 2026-01-25) | Medium | mold segfaults on corrupted-looking `.riscv.attributes` ISA string; workaround is the default `ld`; root cause (Highway vs. mold) undetermined; no maintainer resolution yet |
| [#2542](https://github.com/google/highway/issues/2542) | Should FMA be implemented for SCALAR/EMU128 on PPC/RISC-V/GPU? | Open (since 2025-03-21) | Low | Feature request, not RISC-V-specific alone, unimplemented |
| [PR #3375](https://github.com/google/highway/pull/3375) | Differential harness for cross-target agreement | Open (since 2026-09-11) | N/A | Child of tracking issue #3353; would strengthen RVV correctness coverage once merged |

Recently closed (no longer open, superseding any prior "open" characterization):

| ID | Title | Resolution |
|---|---|---|
| [#2738](https://github.com/google/highway/issues/2738) | `-march=rv64gcv1p0` vs RVA23 platforms | Closed 2026-07-01 |
| [#2793](https://github.com/google/highway/issues/2793) | riscv64/GCC15 `HwyDemoteTest` EMU128 failure | Closed 2026-07-02 |
| [#2967](https://github.com/google/highway/issues/2967) / [PR #2968](https://github.com/google/highway/pull/2968) | RVV runtime dispatch `&& 0` guard | Closed/merged 2026-04-07 |
| #3281 | `ReorderWidenMulAccumulate` 10-30% slower than portable path | Closed 2026-09-03 (performance, root cause identified) |
| [PR #3148](https://github.com/google/highway/pull/3148) | ci: add riscv64 to multiarch CI workflow | Closed unmerged 2026-06-25, superseded by [PR #3157](https://github.com/google/highway/pull/3157) (merged 2026-06-30) |

The remaining ~20 riscv64-touching issues found (e.g. #6, #460, #467, #822, #856, #888, #958, #1017, #1156, #1160, #1312, #1519, #1740, #2120, #2125, #2227, #2236, #2311, #2328, #2554, #3251) are all closed and reflect the 2021-2026 compiler/toolchain bring-up period (missing `riscv_vector.h`, `-march` mismatches, GCC/Clang intrinsic-availability gaps), resolved as RVV 1.0 and GCC 13+/Clang 16+ target-attribute support matured. No open correctness (computation-result) bug was found for riscv64 - #2854 is a build/link-time tooling bug, and #3281 was a closed performance regression, not a correctness defect.

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. **CI test-gating gap:** the `ctest` step in `multiarch.yml` carries `continue-on-error: true`, so a failing riscv64 test (even one that surfaces a real RVV regression under QEMU) never fails the job or blocks a merge. This is the single most consequential current gap and the direct basis for the yellow/build-only-ci grade.
2. **mold linker segfault** (#2854, open): unresolved since 2026-01-26, with root-cause attribution (Highway vs. mold) still undetermined.
3. **RVV runtime dispatch is Clang 19+ only**: no equivalent has landed for GCC as of 1.4.0/master, so GCC-built distribution binaries cannot runtime-dispatch RVV.
4. **FMA gap on the SCALAR/EMU128 fallback** for RISC-V without the V extension (#2542, open feature request, unimplemented).

**Organizational blockers:** none currently block riscv64 work specifically; the earlier CLA-related friction on PR #3148 resolved itself when that PR was superseded by the cleanly-merged PR #3157. No RISE-specific funding or blog coverage of Highway was found; Google's RISE Premier Membership is a general corporate relationship, not a Highway-specific one.

**Acceptance probability:** High for CI/test-gating fixes and further RVV correctness hardening - jan-wassenberg has approved every recent riscv64 change reviewed in this research (e.g., explicit "LGTM" on PR #2968), and the differential test harness (#3353/PR #3375) is already in progress upstream. Moderate for the mold-linker issue, since root-cause attribution requires cross-project coordination between Highway and mold maintainers.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro
- **Optimization level:** full - Highway is optimization-purpose (a SIMD library), and the RVV backend (`hwy/ops/rvv-inl.h`) is a complete, actively-maintained implementation covering arithmetic, logical, compare, mask, reduction, gather/scatter, load/store, permutation, and conversion ops with coverage comparable to the amd64/arm64 backends (see Section 4).
- **Justification:** Highway's own CI (`.github/workflows/multiarch.yml`, added by PR [#3157](https://github.com/google/highway/pull/3157), merged 2026-06-30) cross-compiles for riscv64 and runs `ctest` under QEMU (`-cpu max,v=true,vlen=256`) on both GCC 16 and Clang 22, but that test step is wrapped in `continue-on-error: true`, so a failing riscv64 test never fails the job or blocks a merge - for grading purposes this is equivalent to build-only CI, not tests-pass-and-gate CI (see [multiarch.yml](https://github.com/google/highway/blob/master/.github/workflows/multiarch.yml)). No upstream riscv64 binary release exists (source tarballs only); the only riscv64 package found is Debian sid/trixie's `libhwy-dev`/`libhwy1t64` (1.3.0-2), built by Debian from apparently-unpatched upstream source.
- **Pending work that could change the grade:** open issue [#2854](https://github.com/google/highway/issues/2854) (mold linker segfaults on Highway's riscv64 `.riscv.attributes` ISA string, unresolved since 2026-01-26); open issue [#2542](https://github.com/google/highway/issues/2542) (feature request for FMA on SCALAR/EMU128 for RISC-V/PPC/GPU); open PR [#3375](https://github.com/google/highway/pull/3375) (differential cross-target test harness that would strengthen RVV correctness coverage). RVV runtime dispatch is Clang 19+ only as of release 1.4.0 (PR #2968); no equivalent has landed for GCC. No RISE-specific funding or blog coverage of Highway was found; Google (upstream owner) is a RISE Premier Member but that is a general corporate membership, not Highway-specific involvement. Issues [#2738](https://github.com/google/highway/issues/2738) (`-march=rv64gcv1p0` vs RVA23) and [#2793](https://github.com/google/highway/issues/2793) (GCC15 LTO/RVV test failure) are both now closed; the CI's `continue-on-error: true` is the more current and decisive blocker for the grade, not those two issues.

## 14. Investment Analysis

RISE has not funded any Highway-specific RISC-V work based on available evidence (RISE blog, riseproject.dev membership pages, GitHub org search). The existing RVV backend was built entirely by Google and ISCAS contributors without RISE involvement; RISE's only touchpoint with Highway is indirect, via its `python-wheels` working group's downstream porting of Google ML packages that statically link Highway (see 14.4).

### 14.1 Functional Enablement

Extend RVV runtime dispatch to GCC: the upstream GCC blocker (Bugzilla #115325) is already resolved, and GCC function multiversioning landed in late 2024, so a GCC-side enablement PR analogous to #2968 is plausible without new upstream compiler work. Root-cause and fix the mold-linker segfault (#2854): requires tracing whether Highway's emitted `.riscv.attributes` string or mold's parser is at fault, and likely coordination with mold upstream. Implement FMA for SCALAR/EMU128 on RISC-V (#2542): a small, well-scoped feature request.

### 14.2 Performance Optimization

The RVV backend already has full operation coverage; remaining performance work is incremental. `SumsOf8` lacks a dedicated widening-reduction intrinsic on RVV/WASM (documented gap, no open PR). The open differential test harness (PR #3375) would also serve as a foundation for catching future RVV performance regressions like the closed #3281 case. Data not available: no riscv64-vs-arm64/amd64 quantitative benchmark baseline exists to further prioritize optimization work.

### 14.3 CI/CD Infrastructure

The highest-priority, best-return item: remove `continue-on-error: true` from the `ctest` step in `multiarch.yml` so riscv64 test failures actually gate merges, converting the grade-limiting factor (build-only-ci) into tests-pass-and-gate CI. This is a small, well-understood change but requires upstream maintainer buy-in given the risk of flaky QEMU-emulated RVV tests blocking unrelated PRs; a staged approach (e.g., first making the check required only after a stabilization period) may ease acceptance.

### 14.4 Ecosystem Enablement

No dependent package ecosystem exists in the PyPI/npm/Maven sense (Section 10 is omitted for this reason), but Highway is consumed as a statically-linked C++ dependency by libjxl, Node.js/V8, and, per RISE's own `python-wheels` working group, by Google ML Python packages such as YDF (Yggdrasil Decision Forests), xprof, and array-record being ported to riscv64. That working group already has to force `CC=clang CXX=clang++` for these builds because Highway's Bazel `BUILD.bazel` unconditionally adds a Clang-only `-menable-experimental-extensions` copt on riscv64 that GCC rejects - documented internally as "Gotcha 567" in `riseproject-dev/python-wheels`. Fixing this compiler-gating logic upstream in Highway's `BUILD` file (e.g., gating the flag on the compiler rather than the architecture) would remove a standing workaround from RISE's build pipeline for every downstream package that statically links Highway.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Remove `continue-on-error: true` from riscv64 `ctest` step in `multiarch.yml` so tests gate merges | 1 (plus upstream negotiation) | Highway maintainer (jan-wassenberg) or external contributor | Critical |
| Functional | Investigate and fix mold-linker crash (#2854): trace `.riscv.attributes` ISA-string generation/parsing | 1-2 | Highway maintainer and/or mold upstream | High |
| Functional | Extend RVV runtime dispatch to GCC (parallel to PR #2968's Clang path) | 2-3 | Google/ISCAS contributor | High |
| Ecosystem | Fix Highway's Bazel `BUILD.bazel` Clang-only `-menable-experimental-extensions` copt gating on riscv64 | 1 | Highway maintainer or RISE python-wheels contributor | Medium |
| Functional | Implement FMA for SCALAR/EMU128 on RISC-V (#2542) | 1 | Any contributor | Low |
| Performance | Optimize `SumsOf8` for RVV (dedicated widening reduction) | 2-3 | RISC-V SIMD specialist | Medium |
| Test coverage | Review/support PR #3375 differential cross-target test harness for RVV agreement | 1-2 | Any contributor | Medium |
| Performance | Establish a riscv64 vs arm64/amd64 benchmark baseline for Highway | 1-2 | Any contributor with riscv64 hardware | Medium |

## 15. References

- [google/highway repository](https://github.com/google/highway)
- [Highway homepage](https://github.com/google/highway)
- [hwy/ops/rvv-inl.h](https://github.com/google/highway/blob/master/hwy/ops/rvv-inl.h)
- [.github/workflows/multiarch.yml](https://github.com/google/highway/blob/master/.github/workflows/multiarch.yml)
- [Issue #6: Any plan for ARM SVE and RiscV support?](https://github.com/google/highway/issues/6)
- [Issue #818: VFPv3: Dynamic dispatch vs Debian binaries](https://github.com/google/highway/issues/818)
- [Issue #822: Debian: Missing HWY_RVV on riscv64](https://github.com/google/highway/issues/822)
- [Issue #838: Implement runtime dispatch on riscv64](https://github.com/google/highway/issues/838)
- [Issue #1740: riscv64/LTO fatal error](https://github.com/google/highway/issues/1740)
- [Issue #2554: Failure to compile with clang++ 20 on riscv64](https://github.com/google/highway/issues/2554)
- [Issue #2542: Should FMA be implemented for SCALAR/EMU128 on PPC/RISC-V/GPU?](https://github.com/google/highway/issues/2542)
- [Issue #2738: -march=rv64gcv1p0 doesn't make sense on RVA23 platforms](https://github.com/google/highway/issues/2738)
- [Issue #2793: riscv64/gcc15 HwyDemoteTest failure (EMU128)](https://github.com/google/highway/issues/2793)
- [Issue #2854: Problems with mold-linker on riscv64](https://github.com/google/highway/issues/2854)
- [Issue #2967: RVV runtime dispatch: can the && 0 be removed?](https://github.com/google/highway/issues/2967)
- [Issue #3353: Differential test harness tracking issue](https://github.com/google/highway/issues/3353)
- [PR #41: Implement RVV Round etc.](https://github.com/google/highway/pull/41)
- [PR #233: Consider non-V extensions RISC-V](https://github.com/google/highway/pull/233)
- [PR #360: build: add experimental support for RISCV](https://github.com/google/highway/pull/360)
- [PR #1173: Initial support for RISCV64/GCC-13](https://github.com/google/highway/pull/1173)
- [PR #2073: Replace HWY_ARCH_RVV with HWY_ARCH_RISCV](https://github.com/google/highway/pull/2073)
- [PR #2586: Fixes for RVV detection; re-enable RVV](https://github.com/google/highway/pull/2586)
- [PR #2704: Enable VQSORT for RISC-V](https://github.com/google/highway/pull/2704)
- [PR #2968: Enable RVV runtime dispatch for Clang 19+](https://github.com/google/highway/pull/2968)
- [PR #2971: Attempted workaround for GCC-15 RVV vnclipu mis-optimization](https://github.com/google/highway/pull/2971)
- [PR #3148: ci: add riscv64 to multiarch CI workflow (closed, unmerged)](https://github.com/google/highway/pull/3148)
- [PR #3157: Updated multiarch build/test workflow to use cross compilers](https://github.com/google/highway/pull/3157)
- [PR #3317: Do not extend the EMU128 opt-out to GCC 14/15 on RISC-V](https://github.com/google/highway/pull/3317)
- [PR #3375: tests: add differential harness for cross-target agreement](https://github.com/google/highway/pull/3375)
- [Issue #3281: RVV ReorderWidenMulAccumulate performance regression](https://github.com/google/highway/issues/3281)
- [google/googletest#3756: riscv64 not officially supported](https://github.com/google/googletest/issues/3756)
- [LLVM issue #56592: riscv_vector.h gated by preprocessor instead of target attributes](https://github.com/llvm/llvm-project/issues/56592)
- [GCC Bugzilla #115325: RVV intrinsics unavailable without -march](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=115325)
- [GCC Bugzilla #110812: RISC-V: Always register vector built-in functions during LTO](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=110812)
- [Ubuntu Launchpad bug #2121375: highway FTBFS on rva23u64](https://bugs.launchpad.net/ubuntu/+source/highway/+bug/2121375)
- [RISE Project member list](https://riseproject.dev)
- [RISE wheel builder (Python packages for riscv64)](https://riseproject.gitlab.io/python/wheel_builder/)