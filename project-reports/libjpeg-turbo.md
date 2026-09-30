---
title: libjpeg-turbo
parent: Project Reports
color: orange
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: libspng
    relation: runtime-dependency
    criticality: optional
  - name: JNA
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libjpeg-turbo" %}

# libjpeg-turbo

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (downstream-only)<br/>
**Optimization level:** partial<br/>
**Scope:** RISC-V (riscv64/linux) support status for libjpeg-turbo<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libjpeg-turbo is a JPEG codec library providing both the legacy libjpeg API and the TurboJPEG API. It is the de facto standard JPEG library on Linux, Android, macOS, and embedded platforms, and serves as an ISO/IEC and ITU-T reference implementation of the JPEG standard.

The project is vendor-neutral and foundation-independent. It describes itself as "an independent open source project," is not affiliated with the Linux Foundation, Apache, or any other foundation, and has no MAINTAINERS/OWNERS/CODEOWNERS file and no Board/Governance page on [libjpeg-turbo.org](https://libjpeg-turbo.org/) (`/About/BoardofDirectors` and `/About/About` both 404). Governance is de facto centered on a single lead maintainer, D. Richard Commander ("DRC," GitHub `dcommander`), who authors essentially all commits and merges under "The libjpeg-turbo Project" and is funded through GitHub Sponsors, PayPal, and project-specific grants (most notably FLOSS/fund).

- **Repository:** [libjpeg-turbo/libjpeg-turbo](https://github.com/libjpeg-turbo/libjpeg-turbo)
- **Homepage:** [libjpeg-turbo.org](https://libjpeg-turbo.org/)
- **License:** IJG License (code inherited from libjpeg), Modified 3-Clause BSD License (TurboJPEG API, build system, bundled programs), zlib License (SIMD source, bundled zlib). No copyleft.
- **Current stable release:** 3.2.0 (tagged 2026-06-30), the first stable release containing the RVV SIMD port.
- **Current development version:** 3.2.1-dev (HEAD `03c9a9d7`, 2026-09-25), carrying unreleased RVV DCT optimization work.
- **Corporate sponsors** (libjpeg-turbo.org/About/Sponsors, General/Project tiers): Google, Microsoft, Cloudflare, Arm Limited, Meta/Facebook, Loongson Technology, Mozilla Research, Intel, IBM, AMD, The MathWorks, Cendio AB, Crimson Vista, Safe Software, Kasm Technologies, Debian, Userful, Wilocity, ImageShack, Santos Ltd, Mercurien, Blinkmind, CamTrace SAS, FLOSS/fund, libvips. No RISC-V-specific silicon vendor (SiFive, Andes, etc.) is on the sponsor list.
- **RISE Project member:** No. libjpeg-turbo is a software project, not a RISE member organization; RISE membership (20 members: 8 Premier including Google, NVIDIA, Qualcomm, SiFive; 12 General including ISCAS, Andes, Canonical) is restricted to companies/institutions, not projects.

**Community culture on new ports:** pragmatic but slow and maintainer-gated. A community member opens an issue or submits a working fork; DRC treats it as a starting point rather than merge-ready code, substantially rewrites it for performance and code-quality parity with existing ports, and merges under his own authorship. This pattern held for both the initial RVV port (PR #837, rewritten before merge) and the follow-on DCT optimization (Issue #895, also rewritten before merge as commit `1db93c2`). A related commit (`640cae2`, February 2026) shows explicit reluctance to add RISC-V to the project's public architecture-marketing blurb, quoting the maintainer: "Adding RISC-V to the list would have made it too long... not all of the SIMD extension implementations are at least 2x faster than libjpeg across the board. Generally speaking, only the x86, Arm, and PowerPC implementations are." RISC-V is accepted into the codebase but is not treated as a headline-tier port, and gets no official prebuilt binaries ([Issue #885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885)).

---

## 2. Port History and Upstreaming Timeline

| Date | Event |
|---|---|
| 2022-09-27 | [Issue #620](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/620) "Add RISC-V vectors support" opened by stalkerg, citing the frozen RVV v1.0 spec and available dev-board hardware. Assigned to dcommander, targeted at milestone 3.2. This became the 3.5-year master tracking issue. |
| 2023-07-24 | [Issue #710](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/710) opened by negge: testing on `qemu-system-riscv64` at commit `e429e37` (pure scalar C, pre-SIMD) showed 588/590 tests passing, with 2 failures (`djpeg-shared-3x2-float-prog-cmp`, `djpeg-static-3x2-float-prog-cmp`) attributable to floating-point/progressive-JPEG rounding differences. Closed 2023-07-25, labeled "SEP (somebody else's problem)" / "worked around," not a functional defect. |
| 2024-11-11 | [Issue #794](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/794), a user question on future RVV support, opened and closed same day as a duplicate of #620, confirming real-world demand roughly 10 months before the implementation PR. |
| 2025-05-27 | RISE GitLab project [gitlab.com/riseproject/libjpeg-turbo](https://gitlab.com/riseproject/libjpeg-turbo) created; RISE consolidates prior forks (ISCAS/Zhiyuan Tan, Andes Technology IDCT contributions, camel-cdr/Olaf Bernstein) into [MR !2](https://gitlab.com/riseproject/libjpeg-turbo/-/merge_requests/2), led by Filip Wasil (Samsung Electronics / RISE). |
| 2025-09-10 | [PR #837](https://github.com/libjpeg-turbo/libjpeg-turbo/pull/837) "RISC-V support" opened by filipwasil, built against RVV intrinsic spec v0.12.0 (RVV 1.0 compatible). Claimed all 287 regression tests passing; initial Banana Pi F3 (VLEN=256) benchmarks in the 25-95% (avg ~72%) compression / 15-94% (avg ~53%) decompression range. |
| 2026-02-02/03 | dcommander merges his own substantial rewrite as commit [9817c40](https://github.com/libjpeg-turbo/libjpeg-turbo/commit/9817c408542c72c0e505360580ae7ebcfa487baf), "RISC-V Vector (RVV) SIMD extensions" (23 files changed). The commit message documents per-routine gains of 54-290% over the submitted PR (e.g. ~145% faster RGB-to-YCbCr, ~290% faster h2v2 plain upsampling), explicitly notes DCT/IDCT remained suboptimal (still strided-load 8x8 transpose; `vrgather`-based in-register transpose was tried and found slower), and closes both #620 and #837. Added `simd/riscv64/` (18 files). |
| 2026-02-13 to 2026-02-27 | Four follow-up commits land directly on `main` (no associated PR numbers): [db1359e](https://github.com/libjpeg-turbo/libjpeg-turbo/commit/db1359ed0c2e4cc07f299a0c469fa27bf57baac3) (IDCT range-limiting, in-register transpose, fancy-upsampling fixes), [e516270](https://github.com/libjpeg-turbo/libjpeg-turbo/commit/e516270b62a20d6e4d020412c9fa40692b7383be) (naming cleanup), [a5939f7](https://github.com/libjpeg-turbo/libjpeg-turbo/commit/a5939f74bbadc819d0d3adbb22a636ab8cff3c10) (color-conversion tweaks, no perf change), [14d0dbc](https://github.com/libjpeg-turbo/libjpeg-turbo/commit/14d0dbc05d42247bdad2e33d92ee7348de874b22) (LMUL=1/2 intrinsics for VLEN>=256 CPUs). |
| 2026-03-27 | Release **3.1.90** ("3.2 beta1") published, first public release containing RVV source. |
| 2026-05-06 [NEEDS VERIFICATION: exact date] | [Issue #885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885) requests riscv64 release binaries, citing free RISE CI runners. Closed "won't implement" by the maintainer. |
| 2026-06-12 | [Issue #895](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/895) "Improve performance of IDCT & FDCT for RVV" opened by ChipKerchner: instruction fusion, `nclip` replacing min/max/`nsra`, segment loads instead of load+transpose. BananaPi K1 (VLEN=256) testing with GCC 16.1.0/Clang 21.1.6 showed ~8.5% compression / ~1.5% decompression gains; correctness verified at VLEN 128/256/512/1024. |
| 2026-06-19 to 2026-07-06 [date range as reported across sources] | dcommander merges a rewrite of ChipKerchner's two commits as [1db93c2](https://github.com/libjpeg-turbo/libjpeg-turbo/commit/1db93c29599cf64e5193297b6e2de069c1838d04), "RVV: Forward/inverse DCT optimizations" (strided segment loads for FDCT, multiply-accumulate intrinsics), closing #895. Measured on a 1.6 GHz OrangePi RV2: compression **+9.7 to +16.6% (avg 12.9%) with GCC 14**, **+1.3 to +8.0% (avg 3.5%) with Clang 20**; decompression "did not change significantly." |
| 2026-06-30 | Release **3.2.0** tagged - first stable release with RVV SIMD support. |
| 2026-07-01 | Arch Linux RISC-V port (archriscv.felixc.at) ships `libjpeg-turbo-3.2.0-2-riscv64.pkg.tar.zst`, the first confirmed downstream binary package containing the RVV code (see Section 8). |
| 2026-07-14 | [Issue #902](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/902) "RVV needs to be able to detect RVA23" opened, labeled enhancement / funding needed, assigned to dcommander. Open as of report date (13 comments, no PR attached). |
| 2026-09-25 | HEAD `03c9a9d7`, version string 3.2.1-dev; the unreleased 3.2.1 changelog section documents the `1db93c2` FDCT work. |

**Discrepancy note:** the follow-up commit date for `1db93c2` is reported inconsistently across search passes as "2026-06-19" (branch-push date) and "2026-06-19/07-06" (merge-window range) in different live-research fetches; the exact merge/commit timestamp was not independently pinned down in this round.

The RVV implementation took approximately 3.5 years from first request (September 2022) to merge (February 2026). The primary blockers were funding, hardware availability, and the maintainer's insistence on rewriting submitted code for performance parity, not technical complexity.

---

## 3. Upstream Support Tier

**Tier: Partially upstream - source merged and shipping in the 3.2.0 stable release, but no CI and no official binaries.**

There is no formal architecture-tiering policy in the project. The only documented "tier" system ([libjpeg-turbo.org/DeveloperInfo/Versioning](https://libjpeg-turbo.org/)) governs release-quality/branch lifecycle (Alpha/Evolving -> Beta -> Post-Beta -> Release Candidate -> Stable, mapped to Next-Gen/Active/Maintenance/Extended/EOL branches), not which CPU architectures are supported. SIMD ports (x86, Arm, PowerPC, MIPS/Loongson, RISC-V) are simply present or absent in `simd/`.

Evidence that riscv64 sits below x86/Arm/PowerPC in practice:
- No riscv64 CI job exists in `.github/workflows/build.yml` (see Section 7).
- Upstream explicitly declined to add riscv64 to its release binary pipeline even when offered free CI runners ([Issue #885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885), closed "won't implement").
- Official downloads at [libjpeg-turbo.org/Documentation/OfficialBinaries](https://libjpeg-turbo.org/) cover only x86/x86-64, AArch64/Armv8, and legacy x86/Armv7; RISC-V users must build from source or rely on distro packaging.
- The maintainer's own public architecture-marketing copy omits RISC-V by design (commit `640cae2`), reserving that list for architectures where "SIMD extension implementations are at least 2x faster... across the board."

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD source present | Yes (hand-tuned NASM) | Yes (C intrinsics, Neon) | Yes (C intrinsics, RVV 1.0), since 3.2.0 |
| CI coverage | Yes (native runners) | Yes (macOS runner, Apple Silicon) | No |
| Official prebuilt binaries | Yes | Yes | No |
| Distro packages with SIMD | Yes | Yes | Partial - Arch Linux 3.2.0 yes; Ubuntu 26.04 "resolute" package predates the merge (see Section 8) |
| Release-blocking status | Yes | Yes | No |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Implementation Overview

The RISC-V SIMD implementation resides in `simd/riscv64/`. As of HEAD `03c9a9d7` (2026-09-25) the directory holds 17 C source/header files plus one assembly file (`jsimdcpu.S`), totaling approximately 3,668 lines. No TODO/FIXME/stub/"not implemented" markers exist anywhere in the tree - this is a real, complete implementation, not scaffolding. All image-processing code uses RVV 1.0 C intrinsics from `<riscv_vector.h>`; no hand-written assembly is used for any compute kernel (contrast: x86_64 uses hand-tuned NASM for all SIMD paths). The sole assembly file, `jsimdcpu.S` (47 lines), is a CPU-feature-probe helper, not a compute kernel.

Contributors with copyright notices in the merged code: D. R. Commander, Zhiyuan Tan (ISCAS), Olaf Bernstein (camel-cdr), and Chip Kerchner. `jidctint-rvv.c` contains genuine fixed-point IDCT math (standard accurate-integer algorithm constants such as `F_0_298`, `F_0_541`) with four named copyright holders - real collaborative engineering.

### 4.2 CPU Detection

**`simd/riscv64/jsimdcpu.c`** (~79-86 lines): runtime RVV 1.0 detection, in order of preference:
1. `syscall(__NR_riscv_hwprobe, ...)` checking `RISCV_HWPROBE_KEY_IMA_EXT_0` / `RISCV_HWPROBE_IMA_V` (Linux).
2. `getauxval(AT_HWCAP)` checking the vector-capability bit (Linux fallback).
3. `elf_aux_info(AT_HWCAP, ...)` (BSD).

A `#if (!defined(__riscv_v) || __riscv_v < 1000000 || __riscv_v >= 2000000)` guard scopes the detection path to cases where RVV 1.0.x is not already compile-time-known. Adds architecture constant `RISCV64` (value 5) and capability bitmask `JSIMD_RVV` (`0x20`).

**`simd/riscv64/jsimdcpu.S`** (47 lines): the assembly probe `has_compliant_vsetvli()`. Sets a tail/mask-agnostic `vsetvli` configuration (an RVV 0.9+/1.0 feature), reads the `vtype` CSR, and checks the VILL bit via sign test - correctly rejecting non-compliant pre-1.0 RVV 0.7.1/0.9 hardware that would otherwise accept but misbehave on RVV 1.0 instructions.

### 4.3 Implemented Algorithms

| File(s) | Purpose | Notes |
|---|---|---|
| `jccolor-rvv.c` / `jccolext-rvv.c` | RGB-to-YCbCr conversion, 8 pixel formats | `vlseg3/4e8` segmented loads, `vwmaccu_vx_u32m4`, `vnclipu_wx_u16m2`; ~145% faster than the submitted PR after dcommander's rewrite |
| `jcgray-rvv.c` / `jcgryext-rvv.c` | RGB-to-grayscale, 7 pixel formats | ~156% faster after rewrite |
| `jdcolor-rvv.c` / `jdcolext-rvv.c` | YCbCr-to-RGB decode conversion, 7 pixel formats | ~64% faster after rewrite |
| `jcsample-rvv.c` | h2v1/h2v2 chroma downsampling | h2v2 ~167% faster after rewrite |
| `jdsample-rvv.c` | h2v1/h2v2 fancy + plain upsampling | h2v2 plain upsampling ~290% faster - the single largest gain in the rewrite |
| `jdmerge-rvv.c` / `jdmrgext-rvv.c` | Merged YCbCr-to-RGB upsample+convert | ~54-59% faster after rewrite |
| `jfdctint-rvv.c` (290-326 lines) | Accurate integer forward DCT (islow), dual VLEN paths | Further optimized in `1db93c2` (2026-06/07): +9.7-16.6% (avg 12.9%) with GCC 14, +1.3-8.0% (avg 3.5%) with Clang 20 |
| `jfdctfst-rvv.c` (268-271 lines) | Fast integer forward DCT (ifast) | dual VLEN paths |
| `jidctint-rvv.c` (449-476 lines) | Accurate integer inverse DCT (islow) | Full 8x8 `TRANSPOSE_8x8` macro from `jsimd_rvv.h` |
| `jidctfst-rvv.c` (432-518 lines) | Fast integer inverse DCT (ifast) | dual VLEN paths |
| `jquanti-rvv.c` (108-157 lines) | Integer quantization + sample conversion | `jsimd_quantize_rvv`, `jsimd_convsamp_rvv` |
| `jsimd_rvv.h` (313-327 lines, count varies slightly by snapshot) | Shared macros: `TRANSPOSE_8x8` / `TRANSPOSE_8x8_VLEN256` | slide/reinterpret/LMUL intrinsics, integer types only |

All kernels use integer vector types (`vint8/16/32/64m*`, `vuint*`) and segmented loads; no `vfloat32m1_t` or other float intrinsics appear anywhere in the riscv64 tree (0 hits for `vfloat32m1_t repo:libjpeg-turbo/libjpeg-turbo`), confirming an integer-only DCT path. No Zba, Zbb, Zvbb, or other bit-manipulation/crypto extensions are referenced anywhere in the repository outside the RVA23-detection proposal in Issue #902.

### 4.4 VLEN Dispatch

DCT files contain two code paths: a standard path (VLEN=128, LMUL=m1/m2) and a VLEN>=256 path (LMUL=mf2/m1 fractional registers, added at camel-cdr's suggestion, commit `14d0dbc`). LMUL=1/2 is not legal with SEW=64, so the 8x8 transpose still requires full-register intrinsics even on VLEN>=256 hardware. Runtime dispatch is via `vsetvlmax` at function entry.

### 4.5 Known Technical Limitations

The in-register 8x8 matrix transpose used in DCT/IDCT remains a bottleneck. `db1359e` (2026-02-13) moved the IDCT transpose in-register (replacing strided memory stores/loads), and `1db93c2` applied strided segment loads to the FDCT side, but a `vrgather`-based full in-register transpose was tried and found *slower* than the strided-load approach at merge time. The maintainer has flagged the not-yet-ratified **Zvzip** RVV extension as the eventual architectural fix, equivalent to TRN1/TRN2 on AArch64.

### 4.6 Build/Dispatch Wiring

`simd/CMakeLists.txt` treats riscv64 as a first-class target: it detects `CPU_TYPE=riscv64`, compile-probes actual RVV 1.0 intrinsics (`__riscv_vsetvl_e32m8`, `__riscv_vnclipu_wx_u16m4`) to gate the build, and links all 11 kernel files plus `jsimdcpu.c`/`jsimdcpu.S`. `simd/jsimd.c` gives RISCV64 its own `#elif SIMD_ARCHITECTURE == RISCV64` branch in every dispatcher (parallel to X86_64/ARM/POWERPC/MIPS64), plus a `JSIMD_FORCERVV` environment-variable override - the same pattern used by mature architectures.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 CMake Architecture Detection

```cmake
elseif(CPU_TYPE STREQUAL "riscv64")
```

`CPU_TYPE` for riscv64 is **not** explicitly special-cased in the root `CMakeLists.txt` CPU-detection cascade; it falls through the generic `else()` branch (`set(CPU_TYPE ${CMAKE_SYSTEM_PROCESSOR_LC})`) and only resolves correctly because `uname -m` / `CMAKE_SYSTEM_PROCESSOR` on riscv64 already reports `riscv64` lowercase.

### 5.2 RVV Compiler Probe (`simd/CMakeLists.txt`, lines ~440-500)

```cmake
set(CMAKE_REQUIRED_FLAGS -march=rv64gcv)
check_c_source_compiles("
  #include <riscv_vector.h>
  int main(int argc, char **argv) {
    size_t vl = __riscv_vsetvl_e32m8(32);
    vuint32m8_t tmp0 = __riscv_vmv_v_x_u32m8(argc, vl);
    vuint16m4_t tmp1 = __riscv_vnclipu_wx_u16m4(tmp0, 1, __RISCV_VXRM_RNU, vl);
    ...
  }" HAVE_RVV)
unset(CMAKE_REQUIRED_FLAGS)

if(NOT HAVE_RVV)
  simd_fail("SIMD extensions not available for this CPU")
  return()
endif()
```

If `HAVE_RVV` is false and `REQUIRE_SIMD=TRUE`, the build fails fatally; otherwise it emits a warning and sets `WITH_SIMD=0` (silent scalar fallback). The compile flag `-march=rv64gcv` (hardcoded, not configurable via a CMake variable) applies to all SIMD source files via `set_source_files_properties`. NASM/Yasm are not required and are never invoked for riscv64 - SIMD is entirely C intrinsics.

### 5.3 Build Command

No riscv64-specific build recipe exists in `BUILDING.md`. The generic Unix recipe applies (CPU_TYPE auto-detects on a native riscv64 host):

```sh
cd {build_directory}
cmake -G"Unix Makefiles" [additional CMake flags] {source_directory}
make
```

### 5.4 Cross-Compilation

No in-tree toolchain file for riscv64 exists in the repository, and no Dockerfile of any kind exists anywhere in the tree (`search_code filename:Dockerfile` returns 0 results; confirmed via local clone that no `docker/`, `.ci/docker/`, or `Dockerfile*` file is present). `BUILDING.md`'s only cross-compilation example is for MinGW/Windows and would need manual adaptation for riscv64. The RISE GitLab MR !2 used Clang with a GCC sysroot and `CMAKE_CROSSCOMPILING_EMULATOR` pointing to `qemu-riscv64 -cpu rv64,v=true,vlen=128` for test execution - this is the only documented riscv64 cross-build+QEMU-test recipe found, and it lives outside the upstream repository. When cross-compiling, `RIGHT_SHIFT_IS_UNSIGNED` is hardcoded to `0` (no runtime test possible).

### 5.5 Toolchain Version Requirements

- **CMake:** >= 3.15 (general project minimum).
- **Compiler:** no formal minimum is documented for riscv64/RVV specifically. The only concrete evidence is the `ChangeLog.md` 3.2.1 entry, which benchmarks the `1db93c2` FDCT optimization with **GCC 14** and **Clang 20**, and Issue #895's testing with **GCC 16.1.0** and **Clang 21.1.6**. In practice, any compiler implementing the ratified RVV 1.0 intrinsics API and accepting `-march=rv64gcv` passes the `check_c_source_compiles` probe; older/incompatible compilers simply fail the probe and fall back to scalar (or fail the build outright under `REQUIRE_SIMD=1`).
- **Minimum libjpeg-turbo version for riscv64 SIMD:** 3.2.0 (first stable release containing `simd/riscv64/`). Earlier versions build riscv64 scalar-only.

### 5.6 QEMU

No QEMU usage exists anywhere in current source, docs, or CI configuration in the upstream repository - the only QEMU references in `ChangeLog.md` are three historical, unrelated ARM/MIPS `/proc/cpuinfo` feature-detection notes. QEMU is used for riscv64 exclusively in two places outside the main build.yml: historically for manual testing (Issue #710, `qemu-system-riscv64`, 2023) and in RISE's own GitLab CI (`qemu-riscv64` as a cross-compile test emulator). Neither is wired into upstream's `.github/workflows/build.yml`.

### 5.7 Known Build-Time Gap

No correct expected MD5 for the RISC-V `fp-contract`/FMA rounding variant of the floating-point progressive-JPEG comparison tests has been committed (follow-up from Issue #710); `FLOATTEST8` is simply disabled by default for non-x86 builds rather than validated on riscv64. This is latent technical debt for any future riscv64 CI adoption.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 SIMD Architecture File Count

| Architecture | Files | Implementation type |
|---|---|---|
| i386 | 57 | Hand-tuned NASM assembly |
| x86_64 | 35-36 | Hand-tuned NASM assembly |
| arm/Neon | ~19-28 (6,547 lines) | C intrinsics |
| riscv64 | 17-18 (~3,668 lines) | C intrinsics (RVV 1.0), 1 asm CPU-probe file |
| mips64 | 19 | C intrinsics (Loongson MMI) |
| powerpc | 18 | C intrinsics (AltiVec) |

The riscv64/arm64 size gap is explained by the two missing feature categories below plus RISC-V using one LMUL-tuned code path versus x86's doubled SSE2/AVX2 variants, not by shallowness of what exists.

### 6.2 Dispatch-Level Function Coverage

| Operation | x86_64 | arm/arm64 | riscv64 |
|---|---|---|---|
| RGB/YCbCr color convert (encode + decode), grayscale | Yes | Yes | Yes |
| h2v1/h2v2 downsample | Yes | Yes | Yes |
| h2v1/h2v2 (+ fancy) upsample | Yes | Yes | Yes |
| h2v1/h2v2 merged upsample+convert | Yes | Yes | Yes |
| convsamp | Yes | Yes | Yes |
| FDCT islow + ifast | Yes | Yes | Yes |
| Quantization | Yes | Yes | Yes |
| IDCT islow + ifast (full-size) | Yes | Yes | Yes |
| Reduced/scaled IDCT (2x2, 4x4) | Yes | Yes | **No - C fallback** |
| Huffman SIMD encode (baseline + progressive AC prepare) | Yes | Yes | **No - C fallback** |
| Float DCT/IDCT/quantize/convsamp | Yes | Partial/No | No (not riscv-specific - arm lacks most of this too) |
| ycc_rgb565 | [CONTRADICTORY - see note] | Yes | No |

**Discrepancy note:** the existing report's Section 6.2 stated x86_64 *does* implement RGB565 colorspace conversion ("Yes | Yes | No" for x86/arm/riscv). A live adversarial-verification pass instead reports "ycc_rgb565 | no | yes | no" - i.e., that RGB565 is an ARM-only embedded feature and x86_64 does *not* implement it either. This is a direct contradiction between the two sources and was not independently resolved in this round; [NEEDS VERIFICATION] against `simd/jsimd.c` directly.

Excluding that one disputed cell, riscv64 covers the same 8 of 10 unambiguous hot-path operations that arm64 covers, with the same two gaps (reduced IDCT, Huffman SIMD encode) in both cases falling back silently and correctly to portable C in `src/` - not broken, just not yet vectorized.

### 6.3 Most Impactful Gap: Huffman Encoding

The absence of a vectorized Huffman encoder (`jsimd_huff_encode_one_block`) is the most consequential functional gap relative to arm64 and x86_64. Huffman entropy coding sits on the critical path for JPEG compression immediately after the (now-vectorized) DCT/quantization steps, capping end-to-end compression throughput gains at the scalar entropy-coding rate. No open upstream issue tracks vectorized Huffman encoding for RVV as of the report date.

### 6.4 Secondary Gap: Scaled IDCT

The absence of 2x2/4x4 IDCT variants means thumbnail-scale JPEG decode (reduced-resolution `dct_method=JDCT_ISLOW` requests) falls back to scalar C - relevant to preview-generation pipelines.

### 6.5 RVA23 / Zvbb Detection Gap

[Issue #902](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/902) (open) documents that the library currently only detects RVA22; RVA23 adds Zvbb/Zbb extensions that could further accelerate the RVV code, but no runtime detection exists yet (a `JSIMD_RVV23` bitmask has been proposed but not implemented). Labeled "funding needed," no PR attached.

### 6.6 Floating-Point Semantics

Issue #710 (closed) identified FMA-contraction rounding differences between RISC-V and x86 causing 2/590 float-DCT progressive-comparison test failures under QEMU; workaround was disabling `FLOATTEST8` by default for non-x86, not a validated riscv64-specific expected result (see Section 5.7). No open NaN-specific RISC-V bug was found.

---

## 7. CI/CD Infrastructure

**No riscv64 CI exists in libjpeg-turbo/libjpeg-turbo**, confirmed independently multiple times against a fresh clone at HEAD `03c9a9d7` (2026-09-25).

The sole CI configuration is `.github/workflows/build.yml` (16,476 bytes, 291 lines), triggered on `push`, `pull_request`, `workflow_dispatch` (no `schedule`). Seven jobs, all on standard GitHub-hosted, non-riscv64 runners:

| Job | Runner | Architecture |
|---|---|---|
| `linux` | `ubuntu-latest`, Docker `dcommander/buildljt` | x86_64 |
| `macos` | `macos-15` | ARM64 (Apple Silicon) |
| `windows` | `windows-2025` | x86_64 |
| `linux-asan-ubsan` | `ubuntu-latest` | x86_64 |
| `linux-jpeg7` | `ubuntu-latest` | x86_64 |
| `linux-jpeg8` | `ubuntu-latest` (Clang) | x86_64 |
| `linux-msan` | `ubuntu-latest` | x86_64 |

Grep of `build.yml` for `riscv`, `riscv64`, `RISCV`, `qemu` (case-insensitive): zero matches, independently confirmed via local `grep`, GitHub's own `search_code` API, and a second adversarial-verification pass. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `appveyor.yml`/`.appveyor.yml`, or `azure-pipelines.yml` exists anywhere in the repository. The only Docker image referenced anywhere in CI is `dcommander/buildljt:$BRANCH`, used for unrelated official nightly-package builds, not riscv64 cross-compilation.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI runner | Yes (`ubuntu-latest`) | Yes (`macos-15`) | No |
| QEMU-emulated CI job | N/A | N/A | No |
| Automated regression coverage of SIMD path | Yes | Yes | No - manual only (BananaPi K1/F3, OrangePi RV2, Kendryte K230, qemu-system-riscv64 per Issue #710) |

Consequence: the RVV SIMD code merged in February 2026, and the further DCT optimizations merged mid-2026, have no automated build or test coverage in upstream CI. Regressions in generic SIMD infrastructure or libjpeg-turbo internals would not be caught until a developer manually builds and tests on RISC-V hardware. RISE demonstrated an external fork-based CI approach via its own GitLab project, but this does not close the upstream CI gap, and RISE's GitHub Actions riscv64 runner fleet (`riscv-runner`, announced in the 2026-03-24 RISE blog post "Announcing the RISE RISC-V Runners") was explicitly offered to libjpeg-turbo in Issue #885 and declined.

---

## 8. Distribution and Release Status

### 8.1 Official Upstream Binaries

No official upstream binary for riscv64 exists or is planned. GitHub release assets for 3.2.0 (visible list; not exhaustively enumerated - the releases page indicated additional unloaded assets) are limited to Windows .exe (gcc/vc, x64/x86/arm64), macOS/iOS .dmg, Linux aarch64/RPM, and source tarball/zip. No riscv64 asset filename was found in any release. [Issue #885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885), which offered free RISE CI runners specifically to produce riscv64 release binaries, was closed "won't implement."

### 8.2 Linux Distribution Packages

| Distribution | Package | Version | riscv64? | Has RVV SIMD? |
|---|---|---|---|---|
| Ubuntu 26.04 "resolute" | `libjpeg-turbo8`, `libjpeg-turbo8-dev`, `libjpeg-turbo-progs` | 2.1.5-4ubuntu4 | Yes (confirmed live, [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libjpeg-turbo&suite=resolute)) | **No** - version predates the RVV merge (3.2.0) by roughly 3.5 years of upstream history |
| Arch Linux RISC-V (archriscv.felixc.at) | `libjpeg-turbo` | 3.2.0-2 | Yes (confirmed live, [archriscv.felixc.at/repo/extra/](https://archriscv.felixc.at/repo/extra/), signed `.pkg.tar.zst`, dated 2026-07-01) | **Yes** - first confirmed downstream binary carrying the RVV port |
| Debian sid/unstable | `libjpeg-turbo` | 1:3.1.3-4 [not reverified this round - carried from prior report] | Yes (built on `rv-manda-02`) | No - version predates the RVV merge |

**Note on discrepancy with the existing report:** the prior version of this report cited Ubuntu 24.04 "Noble" (2.1.5-2ubuntu2); the currently confirmed live data point is Ubuntu 26.04 "resolute" (2.1.5-4ubuntu4) - both are pre-RVV source-version builds, so the substantive finding (no SIMD in the Ubuntu riscv64 package) is unchanged, but the specific suite/version checked has shifted. Debian's entry was not reverified this round and is carried forward from the prior report; it should be treated as potentially stale.

No Linux distribution package on riscv64 confirmed in this research includes the RVV SIMD code except Arch Linux RISC-V's 3.2.0-2 build. As Ubuntu and Debian package 3.2.0 or later in future releases, their riscv64 builds will gain SIMD acceleration for the first time.

### 8.3 Python / PyPI

No `libjpeg-turbo` package exists on PyPI: `https://pypi.org/pypi/libjpeg-turbo/json` and `https://pypi.org/simple/libjpeg-turbo/` both return HTTP 404 (libjpeg-turbo is a C library, not distributed under this name on PyPI). The RISE wheel builder (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/libjpeg-turbo/`) redirects (HTTP 302) to the same nonexistent PyPI simple index (404) - no RISE-built wheel exists, consistent with there being no upstream PyPI package to build against. This channel is inapplicable rather than a gap.

### 8.4 What a User Must Do Today

A riscv64 user wanting RVV-accelerated libjpeg-turbo must either: (a) use Arch Linux RISC-V, whose `extra` repository already ships 3.2.0 with RVV; or (b) build from source at 3.2.0 or later with a GCC 14+/Clang 20+ toolchain supporting `-march=rv64gcv`. Ubuntu and Debian users get a working, but unaccelerated, scalar-C build from their current package versions.

---

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 status |
|---|---|---|---|
| CMake | Build system (`find_package`/build-config generation) | Critical (build-dependency) | Fully functional on riscv64. `CPU_TYPE=riscv64` detection is generic-fallthrough (no explicit `MATCHES "riscv"` branch), but works correctly because `CMAKE_SYSTEM_PROCESSOR` reports `riscv64` natively. No riscv64-specific CMake issues found. |
| GCC | C compiler, primary toolchain for RVV intrinsics | Critical (build-dependency) | Builds the RVV intrinsic probe and all `simd/riscv64/` sources under `-march=rv64gcv`. Benchmarking in this project's own changelog and issues used GCC 14 and GCC 16.1.0. No formal minimum version is documented upstream; older GCC without RVV 1.0 intrinsic support simply fails the CMake compile probe and the build falls back to scalar (or fails hard under `-DREQUIRE_SIMD=1`). |
| LLVM | Clang compiler, alternate toolchain for RVV intrinsics | Critical (build-dependency) | Same role as GCC. Benchmarking used Clang 20 and Clang 21.1.6. The RISE GitLab MR !2 build used Clang with a GCC sysroot. GCC and Clang show measurably different RVV DCT performance on identical source (e.g. `1db93c2`: +12.9% avg with GCC 14 vs +3.5% avg with Clang 20 for compression), so production deployments should validate performance with the specific compiler in use. |
| QEMU | Emulated riscv64 execution for testing and cross-compile test runs | Critical (test-dependency) | Not used anywhere in upstream CI (`build.yml` has zero references). Used historically for manual correctness testing (`qemu-system-riscv64`, Issue #710, 2023) and by RISE's external GitLab CI as `CMAKE_CROSSCOMPILING_EMULATOR` (`qemu-riscv64 -cpu rv64,v=true,vlen=128`). No upstream automation depends on it today. |
| zlib | Optional - PNG write pipeline for the `cjpeg`/`djpeg` utilities (`find_package(ZLIB REQUIRED)` when PNG support is enabled) | Optional (runtime-dependency) | Builds clean on riscv64; pure portable C, no architecture-specific code. Ships in all major distros' riscv64 repositories. An RVV Adler-32 PR (#1099, +7% decompression on SG2042) is unmerged upstream in zlib itself; a duplicate PR (#1267) was self-closed. See `project-reports/zlib.md` for zlib's own riscv64 status. |
| libspng | Optional (bundled) - PNG encode/decode | Optional (runtime-dependency) | Builds on riscv64; SIMD path is silently disabled via `SPNG_DISABLE_OPT` for unrecognized architectures (scalar fallback for `defilter_sub`/`avg`/`paeth`, palette expansion). No riscv64-tagged issues found upstream (0 hits on `randy408/libspng`); no recorded appetite for an RVV port. |
| JNA (Java Native Access) | Optional - required only for the TurboJPEG Java API bindings (`jna/CMakeLists.txt`, `find_package(Java REQUIRED)`) | Optional (runtime-dependency) | A native `linux-riscv64` JNA jar classifier has shipped on Maven Central since JNA 5.13. Two historical, now-closed issues: #1622 (linux-riscv64 missing from MANIFEST.MF, fixed 2024-09) and #1557 (linux-riscv64 jar required glibc >= 2.34 starting at 5.13, closed 2023-11). Neither is open or blocking today. |
| OpenJDK (indirect, via JNA) | Java runtime required to use the optional TurboJPEG Java bindings | Indirect | JNA's Java-side functionality is gated on a working riscv64 OpenJDK. See `project-reports/openjdk.md` for that project's own riscv64 status; this report did not independently re-verify OpenJDK riscv64 status. |

No JIT backend, numerics library, or crypto dependency exists in this project - libjpeg-turbo is a leaf codec library with exactly three non-toolchain library dependencies (zlib, libspng, JNA), all optional.

---

## 11. Known Bugs and Active Issues

### 11.1 Open Issues

**[Issue #902](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/902) - "RVV needs to be able to detect RVA23"** (open, 2026-07-14, 13 comments, labels: enhancement, funding needed, assigned dcommander)
Library currently detects only RVA22; RVA23 adds Zvbb/Zbb extensions that could further accelerate RVV code, but no runtime detection exists (proposed `JSIMD_RVV23 = 0x100`). No PR attached. This is the only open RISC-V-specific issue found in this round (performance or correctness).

### 11.2 Closed Issues (RISC-V-specific)

| ID | Title | Status | Notes |
|---|---|---|---|
| [#620](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/620) | Add RISC-V vectors support | Closed (2026-02-03), 72 comments | Master tracking issue; closed by merge of `9817c40` |
| [#710](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/710) | Unit tests fail when run on RISC-V | Closed (2023-07-25) | 2/590 float-DCT progressive comparison tests fail under QEMU; FMA-rounding difference, labeled "SEP"/"worked around," not a functional defect |
| [#794](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/794) | [Question] Will libjpeg-turbo support RISC-V's SIMD/Vector in the future? | Closed as duplicate (2024-11-11) | Consolidated into #620 |
| [#885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885) | Request riscv64 release binaries | Closed "won't implement" | Free RISE CI runners were offered and declined |
| [#895](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/895) | Improve performance of IDCT & FDCT for RVV | Closed (via commit `1db93c2`) | Compression +9.7-16.6% (avg 12.9%) GCC 14, +1.3-8.0% (avg 3.5%) Clang 20; decompression not significantly changed |
| #790 [NEEDS VERIFICATION - carried from prior report, not reverified] | Unsupported marker error on MilkV module | Closed, "general support" | Malformed input JPEG, not a riscv64-specific code defect |

**Discrepancy note on Issue #895:** the existing report characterized this as an *open* issue with a preliminary, interim benchmark set from the `rvv-dct-opt` branch (GCC 14 avg +12.1% compression but a -1.7% avg **decompression regression**; Clang 20 avg +5.3% compression). Live research in this round confirms the issue is now **closed**, merged as `1db93c2` with different, final numbers (GCC 14 avg +12.9% compression, Clang 20 avg +3.5% compression, and decompression "not significantly changed" - i.e., the earlier regression signal from the interim branch did not appear in the final merged benchmarks). Both figures are used here: the interim branch numbers are superseded by the final merged-commit numbers.

### 11.3 Known Technical Gaps Not Tracked in Issues

- No vectorized Huffman encoder (most impactful untracked gap; see Section 6.3).
- No scaled IDCT (2x2, 4x4) for thumbnail decode.
- No riscv64 expected MD5 for the FLOATTEST8 `fp-contract` rounding variant (Issue #710 follow-up, still unresolved).
- In-register DCT matrix transpose remains suboptimal pending Zvzip ratification.

---

## 12. Objections and Upstream Blockers

### 12.1 Contributing Policy Constraints

`.github/CONTRIBUTING.md` defines constraints affecting any future RISC-V contribution:

1. **No unsolicited PRs** - every change requires prior maintainer discussion and agreement. The RVV port itself required roughly 2.5 years of discussion before acceptance.
2. **5% minimum overall performance threshold** for non-trivial enhancements (not micro-benchmark-only gains). Issue #895's interim branch numbers (avg +5.3% Clang / +12.1% GCC, with a GCC decompression regression) were borderline against this bar; the maintainer's own rewrite (`1db93c2`) cleared it more comfortably before merge.
3. **No AI-generated code** - contributions must be 100% human-generated.
4. **High bar for new features** - full regression testing across affected platforms, changelog documentation, strict code style.
5. **ABI stability** - no new exposed API struct members.

### 12.2 Single-Maintainer Risk

The project is maintained by one person (dcommander), funded through GitHub Sponsors, PayPal, and grants including FLOSS/fund (the grant explicitly cited as enabling the RVV integration). No co-maintainer or succession plan is documented. Review cycles are measured in months; the maintainer has described the project as being in "funding deficit" [as characterized in the prior version of this report; not independently reverified this round].

### 12.3 No riscv64 Release Binary Path

[Issue #885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885) demonstrates the maintainer will not accept free CI resources or add riscv64 to the release binary pipeline regardless of external infrastructure availability. Organizations requiring official binaries for riscv64 must rely on distribution packaging (currently only Arch Linux RISC-V ships an RVV-enabled build) or self-managed builds.

### 12.4 Compiler-Specific DCT Performance Variance

The GCC-versus-Clang gap on the merged `1db93c2` DCT work (compression +12.9% GCC 14 vs +3.5% Clang 20) indicates RVV DCT performance is sensitive to compiler choice. Production deployments should validate performance with the specific compiler version in use rather than assuming parity across toolchains.

### 12.5 Acceptance Probability for Future Contributions

Given the precedent of both PR #837 and Issue #895 being substantially rewritten by the maintainer before merge (not merged as submitted), any future contributor (e.g., for Huffman SIMD or reduced IDCT) should expect the submitted code to serve as a reference implementation rather than mergeable code, and should budget review/negotiation time of several months, consistent with the project's historical cadence.

---

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro
- **Optimization-purpose project:** yes
- **Optimization level:** partial

**Justification:** No upstream riscv64 CI exists: [build.yml](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/.github/workflows/build.yml) has zero riscv/qemu references, and upstream explicitly declined to add riscv64 release binaries ([Issue #885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885), closed won't-implement). Ubuntu 26.04 ships riscv64 packages (`libjpeg-turbo8`, `-dev`, `-progs` at 2.1.5-4ubuntu4, via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libjpeg-turbo&suite=resolute)) predating the RVV merge, but patch status of that packaging diff was not verified, so per the rule this caps at orange/downstream-only rather than yellow. RVV 1.0 SIMD ([PR #837](https://github.com/libjpeg-turbo/libjpeg-turbo/pull/837), commit 9817c40) covers colorspace conversion, chroma sampling, quantization, and forward/inverse DCT, but Huffman entropy encoding and scaled IDCT remain scalar C, so optimization coverage is partial (capping at blue, which has no effect since the primary color is already orange).

**Pending work that could change the grade:** Open issue #902 "RVV needs to be able to detect RVA23" (funding needed); rvv-dct-opt branch / issue #895 follow-on DCT optimizations targeting 3.2.1; RISE funded the original RVV port via gitlab.com/riseproject/libjpeg-turbo MR !2 (Filip Wasil, Samsung/RISE) but no upstream CI or RISE wheel resulted; no vectorized Huffman encoder work is tracked in any open issue; Issue #885 (riscv64 release binaries) closed won't-implement.

**Additional observation from this round's research relevant to a future re-grade:** Arch Linux RISC-V's `extra` repository now ships `libjpeg-turbo-3.2.0-2-riscv64.pkg.tar.zst` (confirmed live, 2026-07-01), the first downstream binary package that does contain the merged RVV code. This was not reflected in the grade computation above and does not change the color as transcribed here, but is a relevant fact for any future reassessment of the "downstream packaging" dimension.

---

## 14. Investment Analysis

Before sizing any of the following, note what RISE has already funded: the original RVV port itself (RISE GitLab MR !2, Filip Wasil/Samsung, consolidating ISCAS and Andes contributions) and, via ISCAS's general membership, the initial implementation that became PR #837. RISE has not funded the Huffman encoder, scaled IDCT, RVA23 detection, CI integration, or distro packaging - none of that work is covered by existing RISE investment.

### 14.1 Functional Enablement

The core JPEG encode/decode pipeline on riscv64 is fully vectorized as of 3.2.0. The remaining functional gaps are Huffman entropy encoding and scaled (2x2/4x4) IDCT. Huffman encoding is the highest-value unimplemented component, since it sits on the compression critical path after the now-vectorized DCT/quantization stages.

A contributor implementing `jsimd_huff_encode_one_block` for RVV must budget for the upstream pattern observed twice already (PR #837, Issue #895): the maintainer is likely to substantially rewrite submitted code before merge. Estimated effort for a production-quality implementation, including upstream negotiation and full test coverage: 4-8 person-weeks. Timeline to merge: 3-12 months depending on maintainer availability.

### 14.2 Performance Optimization

The DCT/IDCT optimization line (Issue #895 -> `1db93c2`) is now merged and shipping in the unreleased 3.2.1 changelog; this specific work is complete and should not be re-funded. The remaining architectural bottleneck - the in-register 8x8 transpose - has no actionable investment path until the Zvzip RVV extension is ratified and compiler support exists; this is not a near-term investable item. RVA23/Zvbb detection (Issue #902) is open and funding-needed; it is a smaller, more tractable investment than a fresh DCT rewrite. Estimated effort to implement RVA23 hwprobe detection and validate on RVA23-capable hardware: 1-2 person-weeks, contingent on hardware access.

### 14.3 CI/CD Infrastructure

Upstream will not add riscv64 CI based on current signals (Issue #885 explicitly declined free RISE runners for the adjacent release-binary ask; no separate offer for CI-only integration is recorded). An organization can run its own fork-based CI against upstream HEAD for internal regression detection, as RISE already demonstrated via its own GitLab project. This provides early warning but does not close the upstream CI gap. Estimated effort to establish a fork-based riscv64 CI pipeline using RISE runners: 1 person-week; maintenance: low (webhook-triggered builds).

### 14.4 Ecosystem Enablement

Section 10 is omitted for this project: libjpeg-turbo is a system/codec library with three optional, already-riscv64-capable dependencies (Section 9) and no dependent package ecosystem (npm/PyPI/Maven/Kubernetes-operator style) of its own that requires separate riscv64 enablement work. The relevant enablement gap is distribution packaging of the library itself, not a downstream ecosystem.

The primary blocker for consumers is the absence of RVV-accelerated riscv64 binaries in mainstream Linux distributions. Ubuntu 26.04 and Debian sid both currently ship pre-3.2.0, scalar-only builds. Arch Linux RISC-V is the sole distro confirmed to ship an RVV-enabled 3.2.0 build. Investment options:
1. Contribute packaging patches to Debian/Ubuntu to package 3.2.0+ for riscv64. Effort: 2-4 person-weeks per distribution, subject to distribution-specific packaging policies.
2. Publish or sponsor a third-party riscv64 binary repository (OBS, Launchpad PPA) tracking upstream releases. Effort: 1-2 person-weeks setup; ongoing low maintenance.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Implement Huffman encoder (`jsimd_huff_encode_one_block`) for RVV | 4-8 | External contributor / Samsung / RISE | High |
| Functional | Implement scaled IDCT (2x2, 4x4) for RVV | 2-4 | External contributor | Medium |
| Performance | RVA23/Zvbb hwprobe detection (Issue #902) | 1-2 | Any contributor with RVA23-capable hardware | Medium |
| Performance | Zvzip-based DCT transpose optimization | Not actionable - pending Zvzip ratification | n/a | Low |
| CI/CD | Fork-based riscv64 CI pipeline (internal) | 1 | Internal | Medium |
| CI/CD | Upstream riscv64 CI | Not actionable - upstream declines | n/a | n/a |
| Ecosystem | Upstream official riscv64 release binaries | Not actionable - upstream declined (Issue #885) | n/a | n/a |
| Ecosystem | Debian/Ubuntu packaging of libjpeg-turbo 3.2.0+ for riscv64 | 2-4 per distro | Distribution maintainers / sponsored contributor | High - blocks most downstream consumers outside Arch |

---

## 15. References

- [libjpeg-turbo homepage](https://libjpeg-turbo.org/)
- [libjpeg-turbo Sponsors page](https://libjpeg-turbo.org/About/Sponsors)
- [libjpeg-turbo/libjpeg-turbo GitHub repository](https://github.com/libjpeg-turbo/libjpeg-turbo)
- [build.yml CI workflow](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/.github/workflows/build.yml)
- [Issue #620 - Add RISC-V vectors support](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/620)
- [Issue #710 - Unit tests fail when run on RISC-V](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/710)
- [Issue #794 - Will libjpeg-turbo support RISC-V's SIMD/Vector in the future?](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/794)
- [Issue #885 - Request adding riscv64 to release binaries](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885)
- [Issue #895 - Improve performance of IDCT & FDCT for RVV](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/895)
- [Issue #902 - RVV needs to be able to detect RVA23](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/902)
- [PR #837 - RISC-V support](https://github.com/libjpeg-turbo/libjpeg-turbo/pull/837)
- [Commit 9817c40 - RISC-V Vector (RVV) SIMD extensions](https://github.com/libjpeg-turbo/libjpeg-turbo/commit/9817c408542c72c0e505360580ae7ebcfa487baf)
- [Commit db1359e - RVV: Various optimizations](https://github.com/libjpeg-turbo/libjpeg-turbo/commit/db1359ed0c2e4cc07f299a0c469fa27bf57baac3)
- [Commit 14d0dbc - RVV: Use 1/2 regs to improve DCT perf w/ VLEN>=256](https://github.com/libjpeg-turbo/libjpeg-turbo/commit/14d0dbc05d42247bdad2e33d92ee7348de874b22)
- [Commit 1db93c2 - RVV: Forward/inverse DCT optimizations](https://github.com/libjpeg-turbo/libjpeg-turbo/commit/1db93c29599cf64e5193297b6e2de069c1838d04)
- [Release 3.1.90 (3.2 beta1)](https://github.com/libjpeg-turbo/libjpeg-turbo/releases/tag/3.1.90)
- [Release 3.2.0](https://github.com/libjpeg-turbo/libjpeg-turbo/releases/tag/3.2.0)
- [CONTRIBUTING.md](https://github.com/libjpeg-turbo/libjpeg-turbo/blob/main/.github/CONTRIBUTING.md)
- [RISE Project homepage](https://riseproject.dev)
- [RISE GitLab - libjpeg-turbo](https://gitlab.com/riseproject/libjpeg-turbo)
- [RISE GitLab MR !2 - RISC-V Vector support](https://gitlab.com/riseproject/libjpeg-turbo/-/merge_requests/2)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riseproject-dev/system-libraries-wg Issue #16 - libjpeg-turbo tracking](https://github.com/riseproject-dev/system-libraries-wg/issues/16)
- [Ubuntu 26.04 "resolute" - libjpeg-turbo packages](https://packages.ubuntu.com/search?keywords=libjpeg-turbo&suite=resolute)
- [Arch Linux RISC-V - extra repository](https://archriscv.felixc.at/repo/extra/)
- [Debian package tracker - libjpeg-turbo](https://tracker.debian.org/pkg/libjpeg-turbo)
- [Benchmark test images (imagecompression.info)](http://imagecompression.info/test_images)