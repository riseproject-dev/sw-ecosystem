---
title: libjpeg-turbo
categories:
  - multimedia
  - android
---

# libjpeg-turbo

**Author:** Ludovic HENRY &lt;ludovic.henry@qti.qualcomm.com&gt;<br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libjpeg-turbo<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libjpeg-turbo is a JPEG codec library providing both the legacy libjpeg API and the TurboJPEG API. It is the de facto standard JPEG library on Linux, Android, macOS, and embedded platforms, and serves as an ISO/IEC and ITU-T reference implementation of the JPEG standard.

The project is vendor-neutral and foundation-independent. It is maintained by a single unpaid primary maintainer, D. R. Commander (GitHub: dcommander), funded through GitHub Sponsors, PayPal, and project-specific grants. No foundation or governance board exists. The maintainer retains full technical and release control.

- **Repository:** [libjpeg-turbo/libjpeg-turbo](https://github.com/libjpeg-turbo/libjpeg-turbo)
- **Homepage:** [libjpeg-turbo.org](https://libjpeg-turbo.org/)
- **License:** IJG License (libjpeg API, inherited code), Modified 3-Clause BSD (TurboJPEG API, build system), zlib License (SIMD source)
- **Current stable release:** 3.1.4.1
- **Next release:** 3.2 (currently in beta as 3.1.90, released 2026-03-27)
- **RISE Project member:** No. libjpeg-turbo is not listed among RISE premier or general members. RISE premier members include Andes Technology, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Alibaba DAMO Academy, and Tenstorrent.

---

## 2. Port History and Upstreaming Timeline

| Date | Event |
|---|---|
| 2022-09-27 | [Issue #620](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/620) opened by stalkerg: first public request for RVV SIMD support. Maintainer response: "This won't happen without outside funding." |
| 2022-2023 | Zhiyuan Tan (BHbean, ISCAS) develops first complete RVV 1.0 implementation as a graduation project; no real hardware available for benchmarking. Published at [isrc-cas/libjpeg-turbo](https://github.com/isrc-cas/libjpeg-turbo/tree/riscv-dev). |
| 2023-07-24 | [Issue #710](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/710) opened by negge: 2 of 590 unit tests fail on qemu-system-riscv64 (floating-point DCT tests). Closed 2023-07-25 as "SEP / worked around" by disabling FLOATTEST8 by default on non-x86 builds. Root cause: FMA contraction rounding differs from x86 reference values. |
| 2023-07 | rednoah91 (SiFive) contacts dcommander about funding through RISE. |
| 2024-01 | Andes Technology contributes RVV IDCT implementations to BHbean's fork. Funding discussions with SiFive, Google, and The Linux Foundation begin; all parties go silent by January 2024. |
| 2024-05 | First widely available RVV 1.0 hardware (SpacemiT K1, Banana Pi F3, VLEN=256) becomes purchasable. |
| 2025-05-06 | Filip Wasil (Samsung Electronics / RISE) consolidates all prior implementations and proposes coordinated upstreaming via [RISE GitLab MR !2](https://gitlab.com/riseproject/libjpeg-turbo/-/merge_requests/2). |
| 2025-09-09 | Maintainer announces FLOSS/fund grant. Requests rebased implementation on dev branch. |
| 2025-09-10 | [PR #837](https://github.com/libjpeg-turbo/libjpeg-turbo/pull/837) opened by filipwasil (Samsung Electronics), citing contributions from BHbean (ISCAS) and camel-cdr. Initial benchmarks on Banana Pi F3 (VLEN=256): compression 10.71 -> 20.36 Mpix/s, decompression 14.96 -> 23.81 Mpix/s on monkey16.ppm / 4:2:0. |
| 2025-11-21 | dcommander acquires OrangePi RV2 for independent testing. |
| 2026-01-21 | dcommander measures 59-87% compression speedup (avg 72%), 15-94% decompression speedup (avg 53%) with submitted PR on OrangePi RV2. Characterizes result as "not a very good speedup compared to other SIMD implementations" and begins independent rewrite. |
| 2026-02-03 | Commit [9817c40](https://github.com/libjpeg-turbo/libjpeg-turbo/commit/9817c40) merged to dev branch: "RISC-V Vector (RVV) SIMD extensions." 23 files changed, 3,141 additions. dcommander's rewrite achieves an additional 54-290% per-algorithm speedup over the submitted PR via segmented loads/stores and algorithm restructuring. PR #837 and Issue #620 closed. |
| 2026-03-27 | Release 3.1.90 (3.2 beta1) published -- first public release containing RVV source. |
| 2026-05-06 | [Issue #885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885) opened requesting riscv64 release binaries, citing Tier-1 distro status and free RISE CI runners. Closed "won't implement" by maintainer. |
| 2026-06-12 | [Issue #895](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/895) opened by ChipKerchner: follow-on DCT/IDCT optimizations (madd, nclip, segmented load transpose). Shows 8.5% compression / 1.5% decompression improvement on BananaPi K1. Open as of report date. |
| 2026-06-19 | dcommander pushes branch [rvv-dct-opt](https://github.com/libjpeg-turbo/libjpeg-turbo/tree/rvv-dct-opt) with cleaned-up DCT optimizations from Issue #895, targeting 3.2.1, not 3.2. |

The RVV implementation took approximately 3.5 years from first request (September 2022) to merge (February 2026). The primary blockers were funding and hardware availability, not technical complexity.

---

## 3. Upstream Support Tier

**Tier: Partially Upstream -- source merged, no CI, no official binaries.**

The RVV SIMD source code is merged and will ship in the 3.2 stable release. However:

- No riscv64 CI exists in the upstream repository.
- Upstream does not publish riscv64 prebuilt binaries and has explicitly declined to do so ([Issue #885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885), "won't implement").
- The stable release line (3.1.x) has no RVV SIMD. End-users require 3.2 or build from source.
- Distribution packages on riscv64 (Ubuntu, Debian) carry pre-RVV versions (2.1.5 and 3.1.3 respectively).

The maintainer is a single unpaid individual operating in self-described "funding deficit" as of June 2026. Review cycles for community patches are measured in months. The contributing policy explicitly bars unsolicited PRs and requires prior discussion and a 5% minimum overall performance threshold.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Implementation Overview

The RISC-V SIMD implementation resides in `simd/riscv64/` and consists of 18 files (16 C intrinsic files, 1 assembly file for CPU probing, 1 C file for CPU detection). All image-processing code uses RVV 1.0 C intrinsics from `<riscv_vector.h>`. No hand-written assembly is used for image processing (contrast: x86_64 uses hand-tuned NASM for all SIMD paths).

Contributors with copyright notices in the merged code: Filip Wasil (Samsung Electronics), Zhiyuan Tan (ISCAS), D. R. Commander, Olaf Bernstein (camel-cdr). Copyright years span 2022-2026.

### 4.2 CPU Detection

**`simd/riscv64/jsimdcpu.c`** (~80 lines): Runtime RVV 1.0 detection using three mechanisms in order of preference:
1. `syscall(__NR_riscv_hwprobe, ...)` checking `RISCV_HWPROBE_IMA_V` (Linux)
2. `getauxval(AT_HWCAP)` checking `COMPAT_HWCAP_ISA_V` (Linux fallback)
3. `elf_aux_info(AT_HWCAP, ...)` (BSD)

Returns `JSIMD_RVV` bitmask (value `0x20`). Adds new architecture constant `RISCV64` (value `5`) to the SIMD dispatcher.

**`simd/riscv64/jsimdcpu.S`** (~45 lines, ISA: `+v`): Assembly probe `has_compliant_vsetvli`. Sets tail/mask-agnostic vsetvli config (an RVV 0.9+ feature), reads `vtype` CSR, and checks the VILL bit via sign test. This correctly rejects non-compliant RVV 0.7.1 hardware (e.g., early Kendryte K210 derivatives) that accept but misbehave on RVV 1.0 instructions.

### 4.3 Implemented Algorithms

All implementations target 8-bit (BITS_IN_JSAMPLE=8) input only.

**`simd/riscv64/jccolor-rvv.c` / `jccolext-rvv.c`**: RGB-to-YCbCr colorspace conversion for 8 pixel formats (RGB, BGR, RGBX, BGRX, XBGR, XRGB, EXT_RGBA, EXT_BGRA). Uses `vlseg3/4e8` segmented loads, `vzext_vf2`, `vwmulu_vx_u32m4`, `vwmaccu_vx_u32m4`, `vnclipu_wx_u16m2`. The maintainer's rewrite of this function achieved ~145% additional speedup over the submitted PR via restructured segmented loads.

**`simd/riscv64/jcgray-rvv.c` / `jcgryext-rvv.c`**: RGB-to-grayscale conversion for 7 pixel formats. Achieved ~156% additional speedup in dcommander's rewrite.

**`simd/riscv64/jdcolor-rvv.c` / `jdcolext-rvv.c`**: YCbCr-to-RGB decode colorspace conversion for 7 pixel formats. Uses `vle8`, `vzext_vf2`, `vsub_vx`, `vmulh_vx`, `vwmul_vx_i32m8`, `vwmacc_vx`, `vnclipu_wx_u8m2`, `vsseg3/4e8`.

**`simd/riscv64/jcsample-rvv.c`**: h2v1 and h2v2 chroma downsampling. h2v2 downsampling achieved ~167% additional speedup in dcommander's rewrite.

**`simd/riscv64/jdsample-rvv.c`** (~270 lines): h2v1 and h2v2 fancy upsampling plus h2v1 and h2v2 plain upsampling. Plain h2v2 upsampling achieved ~290% additional speedup -- the largest single-function gain in dcommander's rewrite.

**`simd/riscv64/jdmerge-rvv.c` / `jdmrgext-rvv.c`**: Merged YCbCr-to-RGB upsample+convert for h2v1 and h2v2, all 7 pixel formats.

**`simd/riscv64/jfdctint-rvv.c`** (~250 lines): Accurate integer forward DCT (islow, CONST_BITS=13). Includes VLEN>=256 variant.

**`simd/riscv64/jfdctfst-rvv.c`** (~200 lines): Fast integer forward DCT (ifast). Includes VLEN>=256 variant.

**`simd/riscv64/jidctint-rvv.c`** (~290 lines): Accurate integer inverse DCT (islow). Uses full 8x8 TRANSPOSE_8x8 macro from `jsimd_rvv.h`. Includes VLEN>=256 variant.

**`simd/riscv64/jidctfst-rvv.c`** (~265 lines): Fast integer inverse DCT (ifast). Includes VLEN>=256 variant.

**`simd/riscv64/jquanti-rvv.c`** (~135 lines): Integer quantization (`jsimd_quantize_rvv`) and sample conversion (`jsimd_convsamp_rvv`).

### 4.4 VLEN Dispatch

All DCT files contain two code paths: a standard path (VLEN=128, LMUL=m1/m2) and a VLEN>=256 path (LMUL=mf2/m1 fractional registers). The VLEN>=256 path was added at camel-cdr's suggestion and achieves 20-30% lower-level DCT/IDCT improvement by eliminating half the wasted register bandwidth on VLEN=256 hardware such as SpacemiT K1/X1.

Runtime dispatch is performed via `vsetvlmax` at function entry.

### 4.5 Known Technical Limitations

The in-register 8x8 matrix transpose used in DCT/IDCT is suboptimal. The current implementation uses `vslide1up_mu`/`vslide1down_mu` from `jsimd_rvv.h`. The maintainer notes that the upcoming Zvzip RVV extension (not yet ratified) would allow a more efficient transpose equivalent to TRN1/TRN2 on AArch64. The accurate IDCT (islow) remains "only barely faster than C code" per dcommander's closing comment on Issue #620.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 CMake Architecture Detection

In `simd/CMakeLists.txt`, the riscv64 branch is triggered by:

```cmake
elseif(CPU_TYPE STREQUAL "riscv64")
```

`CPU_TYPE` is derived from `CMAKE_SYSTEM_PROCESSOR` (lowercased) via a generic fallback in the root `CMakeLists.txt`. No explicit riscv64 branch exists in the CPU detection cascade -- the value propagates from the toolchain or host system.

### 5.2 RVV Compiler Probe

```cmake
set(CMAKE_REQUIRED_FLAGS -march=rv64gcv)
check_c_source_compiles(
  "#include <riscv_vector.h>
   int main(void) {
     __riscv_vsetvl_e32m8(0);
     __riscv_vnclipu_wx_u16m4(...);
     __riscv_vcreate_v_u8m2x2(...);
     return 0;
   }"
  HAVE_RVV)
```

If `HAVE_RVV` is false and `REQUIRE_SIMD=TRUE`, the build fails fatally. Otherwise it emits a warning and sets `WITH_SIMD=0`. The compile flag `-march=rv64gcv` is applied to all SIMD source files via `set_source_files_properties`.

### 5.3 Runtime Detection Libraries

CMake probes for `getauxval` (Linux) via `HAVE_GETAUXVAL` and `elf_aux_info` (BSD) via `HAVE_ELF_AUX_INFO` to select the runtime detection path. Assembly language is enabled unconditionally on riscv64 for `jsimdcpu.S`.

### 5.4 CMake Flags Relevant to riscv64

| Flag | Effect |
|---|---|
| `-DWITH_SIMD=0` | Disable RVV; force scalar C fallback |
| `-DREQUIRE_SIMD=TRUE` | Fatal error if RVV probe fails |
| `-DWITH_JPEG7=1` | libjpeg v7 API compatibility |
| `-DWITH_JPEG8=1` | libjpeg v8 API compatibility |
| `-DWITH_PROFILE=1` | Enable low-level SIMD profiling (used in Issue #895 benchmarking) |

NASM and Yasm are not required for riscv64 builds. SIMD is implemented entirely in C intrinsics.

### 5.5 Toolchain Requirements

- **CMake:** 3.15+ (project minimum per BUILDING.md)
- **C compiler:** GCC 14+ or Clang 17+ required for full RVV 1.0 intrinsic support. GCC 13 has partial support. Builds with GCC 16.1.0 and Clang 21.1.6 confirmed in Issue #895 benchmarks. The cmake probe fails at configure time if the compiler cannot compile the RVV intrinsic test.
- **No NASM/Yasm:** Not required for riscv64. Not invoked.

### 5.6 Cross-Compilation

No in-tree toolchain file for riscv64 exists in the repository. The upstream documentation (BUILDING.md) describes a generic cross-compilation pattern requiring a user-supplied toolchain file. A minimal file sets `CMAKE_SYSTEM_NAME=Linux`, `CMAKE_SYSTEM_PROCESSOR=riscv64`, and appropriate compiler paths. The RISE GitLab MR !2 used Clang with a GCC sysroot and `CMAKE_CROSSCOMPILING_EMULATOR` pointing to `qemu-riscv64 -cpu rv64,v=true,vlen=128` for test execution.

When cross-compiling, `RIGHT_SHIFT_IS_UNSIGNED` is hardcoded to `0` (no runtime test possible).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 SIMD Architecture File Count Comparison

| Architecture | Files | Implementation type |
|---|---|---|
| i386 | 57 | Hand-tuned NASM assembly |
| x86_64 | 36 | Hand-tuned NASM assembly |
| arm (Neon) | 28 | C intrinsics |
| riscv64 | 19 | C intrinsics (RVV 1.0) |
| mips64 | 19 | C intrinsics (Loongson MMI) |
| powerpc | 18 | C intrinsics (AltiVec) |

### 6.2 Per-Component Coverage

| Component | x86_64 | arm/Neon | riscv64 | Impact of gap |
|---|---|---|---|---|
| RGB/YCbCr colorspace conversion (encode) | Yes | Yes | Yes | n/a |
| YCbCr/RGB colorspace conversion (decode) | Yes | Yes | Yes | n/a |
| RGB-to-grayscale | Yes | Yes | Yes | n/a |
| h2v1/h2v2 chroma downsampling | Yes | Yes | Yes | n/a |
| h2v1/h2v2 fancy upsampling | Yes | Yes | Yes | n/a |
| h2v1/h2v2 plain upsampling | Yes | Yes | Yes | n/a |
| h2v1/h2v2 merged upsample+convert | Yes | Yes | Yes | n/a |
| Integer quantization | Yes | Yes | Yes | n/a |
| Sample conversion (convsamp) | Yes | Yes | Yes | n/a |
| Accurate integer FDCT (islow) | Yes | Yes | Yes | n/a |
| Fast integer FDCT (ifast) | Yes | Yes | Yes | n/a |
| Accurate integer IDCT (islow) | Yes | Yes | Yes | n/a |
| Fast integer IDCT (ifast) | Yes | Yes | Yes | n/a |
| CPU detection | Yes | Yes | Yes | n/a |
| RGB565 colorspace conversion | Yes | Yes | No | Low -- niche pixel format |
| h1v2 fancy upsample | Yes | Yes | No | Low -- uncommon subsampling format |
| Float FDCT/IDCT | Yes | Partial | No | Low -- float DCT is rarely selected |
| Float quantization / convsamp | Yes | No | No | Low -- same |
| Scaled IDCT (2x2, 4x4) | Yes | Yes | No | Medium -- used for thumbnail decode |
| Huffman encoding (huff_encode_one_block) | Yes | Yes | No | High -- limits compression throughput |
| Huffman encode_mcu_AC_first/refine_prepare | Yes | Yes | No | Medium -- progressive JPEG compression |

### 6.3 Most Impactful Gap: Huffman Encoding

The absence of a vectorized Huffman encoder (`jsimd_huff_encode_one_block`) is the most consequential gap relative to arm64 and x86_64. Huffman encoding is on the critical path for JPEG compression. Its absence means that after the color conversion and DCT steps (both vectorized), the entropy coding step falls back to scalar C, capping compression throughput gains. This gap is not tracked in any open upstream issue as of the report date.

### 6.4 Secondary Gap: Scaled IDCT

The absence of 2x2 and 4x4 IDCT variants (`jsimd_idct_2x2`, `jsimd_idct_4x4`) means that thumbnail-size JPEG decode (e.g., requesting a 1/4 or 1/8 scale decode via `dct_method=JDCT_ISLOW` with reduced output dimensions) uses scalar fallback. This is a relevant use case for preview generation pipelines.

---

## 7. CI/CD Infrastructure

**No riscv64 CI exists in libjpeg-turbo/libjpeg-turbo.**

The sole CI configuration is `.github/workflows/build.yml`. It defines seven jobs:

| Job | Runner | Architecture |
|---|---|---|
| `linux` | `ubuntu-latest`, Docker `dcommander/buildljt` | x86_64 |
| `macos` | `macos-15` | ARM64 (Apple Silicon) |
| `windows` | `windows-2025` | x86_64 |
| `linux-asan-ubsan` | `ubuntu-latest` | x86_64 |
| `linux-jpeg7` | `ubuntu-latest` | x86_64 |
| `linux-jpeg8` | `ubuntu-latest` | x86_64 |
| `linux-msan` | `ubuntu-latest` | x86_64 |

No reference to "riscv", "riscv64", "RISCV", "qemu", "cross", or "emulat" appears anywhere in `build.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, or `appveyor.yml` exists at the repository root.

Consequence: the RVV SIMD code merged in February 2026 has no automated build or test coverage in upstream CI. Regressions introduced by future changes to generic SIMD infrastructure or libjpeg-turbo internals would not be caught until a developer manually builds and tests on RISC-V hardware. The Issue #710 float test failure from 2023 has a workaround (FLOATTEST8 disabled for non-x86) but no correct expected MD5 for the RVV fp-contract rounding variant has been committed, leaving a testing gap for any future riscv64 CI adoption.

The upstream maintainer declined to add riscv64 to the release binary pipeline when free RISE CI runners were offered ([Issue #885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885), May 2026, closed "won't implement"). The stated reason was unwillingness to expand release infrastructure.

---

## 8. Distribution and Release Status

### 8.1 Official Upstream Binaries

| Release | riscv64 binary | Notes |
|---|---|---|
| 3.1.4.1 (current stable) | No | Binaries: Windows x64/x86 (gcc/MSVC), macOS dmg, Linux deb/rpm for amd64/arm64/aarch64/i386/x86_64 only |
| 3.1.90 (3.2 beta1) | No | First release containing RVV source; same binary platforms as stable |

No official upstream binary for riscv64 exists or is planned.

### 8.2 Linux Distribution Packages

| Distribution | Package | Version | riscv64? | Has RVV SIMD? |
|---|---|---|---|---|
| Ubuntu 24.04 Noble | `libjpeg-turbo8`, `libjpeg-turbo-progs`, `libjpeg-turbo8-dev` | 2.1.5-2ubuntu2 | Yes | No -- version predates RVV merge by ~3.5 years |
| Debian sid/unstable | `libjpeg-turbo` | 1:3.1.3-4 | Yes -- built on `rv-manda-02` | No -- version predates RVV merge |
| Arch Linux RISC-V | `libjpeg-turbo` | Unknown | Unknown -- fetch truncated | Unknown |

No Linux distribution package on riscv64 currently includes the RVV SIMD code. When distributions package 3.2.0 (once the stable release is tagged), the riscv64 builds will be the first publicly available binaries with SIMD acceleration.

### 8.3 Python / PyPI

No `libjpeg-turbo` package exists on PyPI (HTTP 404). The RISE GitLab wheel builder (project 56254198) contains no libjpeg-turbo package and redirects to the same 404. Data not available: Arch Linux RISC-V exact version and build status.

---

## 9. Dependencies

### 9.1 Build-Time Dependencies

| Dependency | Role | riscv64 status | Notes |
|---|---|---|---|
| CMake 3.15+ | Build system | Fully supported | No riscv64-specific issues known |
| GCC 14+ or Clang 17+ | C compiler for RVV intrinsics | Available in major distros | GCC 13 partial; build probe will fail at configure time if compiler is too old |
| NASM/Yasm | x86 assembly | Not required on riscv64 | Skipped entirely for this architecture |

### 9.2 Runtime Dependencies

| Dependency | Role | riscv64 status | Notes |
|---|---|---|---|
| zlib | PNG write pipeline | Builds and ships on riscv64 in all major distros | Pure C; no SIMD on any platform in the reference implementation. Not a blocker. |
| libspng (optional, bundled) | PNG encode/decode | Builds on riscv64; SIMD silently disabled | Falls to `SPNG_DISABLE_OPT` path for unknown architectures. Filter optimizations (defilter_sub, defilter_avg, defilter_paeth, palette expansion) are all scalar. No upstream appetite to add RVV (no issues filed). Minor throughput gap for PNG-heavy workloads inside libjpeg-turbo's PNG read path. Not a correctness blocker. |
| JNA (Java Native Access) | Optional TurboJPEG Java bindings | Depends on OpenJDK riscv64 status | See `project-reports/openjdk.md` for details. |

---

## 10. Ecosystem Status

### 10.1 RISE Project Involvement

RISE funded and hosted the libjpeg-turbo RVV work under [gitlab.com/riseproject/libjpeg-turbo](https://gitlab.com/riseproject/libjpeg-turbo) (created May 27, 2025). The primary funded contributor was Filip Wasil (Samsung Electronics). Zhiyuan Tan (ISCAS, a RISE general member) contributed the original implementation. camel-cdr (Olaf Bernstein) contributed independently.

No dedicated libjpeg-turbo blog post exists on [riseproject.dev](https://riseproject.dev). Across 27 public RISE blog posts (May 2024 through June 2026), zero posts mention libjpeg-turbo. The work is not referenced in RISE's public end-of-year updates. [NEEDS VERIFICATION: whether the work appears in the RISE wiki at wiki.riseproject.dev, which requires authentication.]

### 10.2 Corporate Sponsors Relevant to RISC-V Context

Of the known project sponsors, the following are relevant to RISC-V context:

- **FLOSS/fund** (September 2025-present, general): The grant dcommander cited as enabling the RVV work. This is the direct funding mechanism for the RVV integration.
- **Google** (multiple periods): Has funded security and API work. Not recorded as funding RVV work specifically.

ISCAS (Zhiyuan Tan's institution) is a RISE general member. SiFive contacted dcommander in 2023 about funding but no agreement was reached. Andes Technology contributed IDCT code to the ISCAS fork but no funding agreement is recorded. No Qualcomm-specific engagement with this project is recorded in the research findings.

### 10.3 Hardware Context

Benchmarks in the research findings used three RISC-V platforms:

- **Banana Pi F3 / SpacemiT K1** (VLEN=256, ISCAS team and filipwasil): primary development and benchmark platform
- **OrangePi RV2** (VLEN=256, dcommander): independent benchmark and integration platform
- **Ky X1 / Kendryte K1** (1.6 GHz, VLEN unknown -- [NEEDS VERIFICATION]): used for official 3.2 beta1 release note benchmarks
- **Kendryte K230** (VLEN=128, filipwasil via RISE MR): earliest real-hardware test

All current production hardware tested uses VLEN=256. The code is validated for correctness on VLEN=128/256/512/1024 (per Issue #895 comments from ChipKerchner).

---

## 11. Known Bugs and Active Issues

### 11.1 Open Issues

**[Issue #895](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/895) -- "Improve performance of IDCT & FDCT for RVV"** (opened 2026-06-12, OPEN)

Proposes: madd instruction fusion, instruction hoisting, nclip replacing min/max/nsra, `vlsseg4e16` segmented loads replacing scalar load + transpose.

Reproduced results by dcommander on OrangePi RV2 (branch `rvv-dct-opt`, commit fa021c4, pushed 2026-06-19):
- Clang 20: compression +3.9% to +8.2% (avg +5.3%), decompression +0.3% to +2.7% (avg +1.6%)
- GCC 14: compression +8.4% to +14.3% (avg +12.1%), decompression -4.4% to -0.4% (avg -1.7%, slight regression)

Status: maintainer is requesting community benchmarking on additional hardware. Changes will not make 3.2.0. May be included in 3.2.1. Timeline described as "probably months" due to project funding deficit. IDCT improvements were not considered compelling; only FDCT changes are under active consideration.

### 11.2 Closed Issues (RISC-V-Specific)

**[Issue #710](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/710) -- Float test failures on RISC-V** (closed 2023-07-25)

2 of 590 tests failed on qemu-system-riscv64: `djpeg-shared-3x2-float-prog-cmp` and `djpeg-static-3x2-float-prog-cmp`. Root cause: FMA contraction on RISC-V produces different rounding than x86. Workaround: `FLOATTEST8` no longer set by default for non-x86 builds. The correct rounding mode for RISC-V is `fp-contract`, but no updated expected MD5 for this variant has been committed to the test suite. This is a latent technical debt item for any future riscv64 CI setup.

**[Issue #620](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/620) -- "Add RISC-V vectors support"** (closed 2026-02-03)

Closed upon merge of commit 9817c40. 71 comments over 3.5 years. No residual action items.

**[Issue #790](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/790) -- "Unsupported marker error in JPEG decompression on MilkV module"** (closed)

On MilkV Duo256M (RISC-V, Linux 5.10, musl libc), libjpeg-turbo 3.0.90 crashed with "Unsupported marker type 0x6d" for a specific JPEG file. Maintainer labeled it "general support" -- the JPEG file had non-standard markers rather than a library defect. No riscv64-specific code path involved.

### 11.3 Known Technical Gaps Not Tracked in Issues

- No vectorized Huffman encoder (most impactful untracked gap)
- No scaled IDCT (2x2, 4x4) for thumbnail decode
- No RGB565 colorspace conversion
- In-register DCT matrix transpose suboptimal pending Zvzip ratification
- No riscv64 expected MD5 for FLOATTEST8 fp-contract variant (Issue #710 follow-up)

---

## 12. Objections and Upstream Blockers

### 12.1 Contributing Policy Constraints

The `.github/CONTRIBUTING.md` defines constraints that directly affect any third-party contribution effort:

1. **No unsolicited PRs.** Every change requires prior maintainer discussion and agreement. The RVV port itself required ~2.5 years of discussion before the maintainer accepted it.
2. **5% minimum performance threshold.** Non-trivial enhancements with less than 5% overall (not micro-benchmark) performance impact will not be accepted. Issue #895 DCT optimizations are borderline: +5.3% avg with Clang 20, +12.1% avg with GCC 14. The decompression regression with GCC 14 (-1.7%) is a blocker for acceptance in current form.
3. **No AI-generated code.** All contributions must be 100% human-generated.
4. **High bar for new features.** Complete regression testing across all affected platforms, changelog documentation, strict code style compliance.
5. **ABI stability.** No new exposed API struct members.

### 12.2 Single-Maintainer Risk

The entire project is maintained by one person. Review cycles are measured in months during periods of funding deficit. The project has been in "funding deficit" since at least June 2026 (per dcommander's comment on Issue #895, 2026-06-18). The FLOSS/fund grant that enabled the RVV integration has been partially consumed. No succession plan or co-maintainer is visible.

### 12.3 No riscv64 Release Binary Path

Issue #885 (May 2026, closed "won't implement") demonstrates that the maintainer will not accept free CI resources or add riscv64 to the release binary pipeline regardless of external infrastructure availability. Any organization requiring official binary packages for riscv64 must rely on Linux distribution packaging or self-managed builds.

### 12.4 Compiler-Specific DCT Performance Variance

The GCC 14 vs. Clang 20 discrepancy on the `rvv-dct-opt` branch (compression +12.1% vs. +5.3%; decompression -1.7% vs. +1.6%) indicates that DCT performance on RISC-V is sensitive to compiler choice. Production deployments should validate performance with the specific compiler version in use.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The core JPEG encode/decode pipeline on riscv64 is fully vectorized. The functional gap is not in baseline JPEG but in Huffman encoding, scaled IDCT, and niche pixel format conversions. Huffman encoding is the highest-value unimplemented component.

Implementing `jsimd_huff_encode_one_block` for RVV would complete the compression pipeline SIMD coverage. Arm Neon and x86_64 provide reference implementations. The upstream contributing policy requires prior discussion, demonstrated >5% overall performance gain, and full test coverage. A contributor must budget for the possibility that the maintainer rewrites the submitted code (as occurred with PR #837, where dcommander rewrote the color conversion and upsampling routines before merging, achieving 54-290% additional speedup per function).

Estimated effort for a production-quality Huffman encoder implementation, including upstream negotiation and test coverage: 4-8 person-weeks. Timeline to merge: 3-12 months depending on maintainer availability.

### 13.2 Performance Optimization

The `rvv-dct-opt` branch (Issue #895) is the only currently active performance work. It targets 3.2.1. The case for investment is marginal: +5% compression with Clang, +12% with GCC. Decompression shows a small regression with GCC 14. The maintainer is already engaged; the primary need is benchmarking on additional hardware platforms to establish whether the GCC regression is platform-specific.

The in-register DCT transpose gap is a medium-term architectural issue tied to Zvzip ratification. No actionable investment path exists until the extension is ratified and compiler support is available.

Estimated effort to resolve Issue #895 and contribute additional hardware benchmark data: 1-2 person-weeks (if hardware is available). No guarantee of upstream acceptance within a specific timeframe.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI to the upstream project requires maintainer buy-in, which was explicitly refused in May 2026 (Issue #885). The upstream will not add riscv64 CI based on current signals.

An organization can run its own fork-based CI against upstream HEAD for internal regression detection. The RISE project demonstrated this approach via gitlab.com/riseproject/libjpeg-turbo. This provides early warning of regressions but does not close the upstream CI gap.

Estimated effort to establish a fork-based riscv64 CI pipeline using RISE runners: 1 person-week. Maintenance: low (webhook-triggered builds).

### 13.4 Ecosystem Enablement

The primary blocker for ecosystem consumers is the absence of riscv64 binaries in stable Linux distribution packages with RVV SIMD. Ubuntu 24.04 ships 2.1.5 (2022, no SIMD). Debian sid ships 3.1.3 (no SIMD). Neither will have RVV-accelerated builds until they package libjpeg-turbo 3.2.0, which has not been tagged as of this report.

Investment options:
1. Contribute packaging patches to Debian/Ubuntu to backport 3.2 to distribution release branches. Effort: 2-4 person-weeks per distribution, subject to distribution-specific packaging policies.
2. Publish a third-party riscv64 binary package repository (e.g., OBS, Launchpad PPA). Effort: 1-2 person-weeks setup. Maintenance: ongoing.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Implement Huffman encoder (`jsimd_huff_encode_one_block`) for RVV | 4-8 | External contributor / Samsung / RISE | High |
| Functional | Implement scaled IDCT (2x2, 4x4) for RVV | 2-4 | External contributor | Medium |
| Performance | Benchmark `rvv-dct-opt` branch on additional hardware; unblock Issue #895 upstream merge | 1-2 | Any contributor with RISC-V hardware access | Medium |
| Performance | Zvzip-based DCT transpose optimization | Not actionable -- pending Zvzip ratification | n/a | Low |
| CI/CD | Fork-based riscv64 CI pipeline (internal) | 1 | Internal | Medium |
| CI/CD | Upstream riscv64 CI | Not actionable -- upstream refuses | n/a | n/a |
| Ecosystem | Upstream official riscv64 release binaries | Not actionable -- upstream refuses | n/a | n/a |
| Ecosystem | Debian/Ubuntu packaging of libjpeg-turbo 3.2 for riscv64 | 2-4 per distro | Distribution maintainers / sponsored contributor | High -- blocks all downstream consumers |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libjpeg-turbo homepage](https://libjpeg-turbo.org/)
- [libjpeg-turbo Sponsors page](https://libjpeg-turbo.org/About/Sponsors)
- [libjpeg-turbo/libjpeg-turbo GitHub repository](https://github.com/libjpeg-turbo/libjpeg-turbo)
- [Issue #620 -- Add RISC-V vectors support](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/620)
- [Issue #710 -- Unit tests fail when run on RISC-V](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/710)
- [Issue #790 -- Unsupported marker error on MilkV module](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/790)
- [Issue #885 -- Request adding riscv64 to release binaries](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885)
- [Issue #895 -- Improve performance of IDCT & FDCT for RVV](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/895)
- [PR #837 -- RISC-V support](https://github.com/libjpeg-turbo/libjpeg-turbo/pull/837)
- [Commit 9817c40 -- RISC-V Vector (RVV) SIMD extensions](https://github.com/libjpeg-turbo/libjpeg-turbo/commit/9817c40)
- [Branch rvv-dct-opt](https://github.com/libjpeg-turbo/libjpeg-turbo/tree/rvv-dct-opt)
- [Release 3.1.90 (3.2 beta1)](https://github.com/libjpeg-turbo/libjpeg-turbo/releases/tag/3.1.90)
- [CONTRIBUTING.md](https://github.com/libjpeg-turbo/libjpeg-turbo/.github/blob/main/CONTRIBUTING.md)
- [RISE Project homepage](https://riseproject.dev)
- [RISE GitLab -- libjpeg-turbo](https://gitlab.com/riseproject/libjpeg-turbo)
- [RISE GitLab MR !2 -- RISC-V Vector support](https://gitlab.com/riseproject/libjpeg-turbo/-/merge_requests/2)
- [Ubuntu 24.04 Noble -- libjpeg-turbo8 package](https://packages.ubuntu.com/noble/libjpeg-turbo8)
- [Debian package tracker -- libjpeg-turbo](https://tracker.debian.org/pkg/libjpeg-turbo)
- [Debian buildd status -- libjpeg-turbo](https://buildd.debian.org/status/package.php?p=libjpeg-turbo)
- [Benchmark test images (imagecompression.info)](http://imagecompression.info/test_images)