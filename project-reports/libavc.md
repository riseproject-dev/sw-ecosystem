---
title: libavc
parent: Project Reports
color: yellow
dependencies:
  - name: Soong
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: Bionic
    relation: runtime-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libavc" %}

# libavc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-25<br/>
**Readiness:** yellow (clean-distro-build), release provider RISE<br/>
**Scope:** RISC-V (riscv64/linux and riscv64/android) support status for libavc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libavc is the H.264/AVC software decoder and encoder used by AOSP. Its source is [platform/external/libavc](https://android.googlesource.com/platform/external/libavc). It is the Android fork of the Ittiam library at [github.com/ittiam-systems/libavc](https://github.com/ittiam-systems/libavc). It backs the Codec2 and OMX software codecs (c2.android.avc.decoder/encoder) and is built into the `com.android.media.swcodec` APEX (`apex_available`). It is not the h264 code of libav or ffmpeg.

The AOSP tree provides:
- AVC decoder and encoder.
- SVC encoder and decoder.
- An MVC decoder.
- Five fuzzers: avc_dec, avc_enc, mvc_dec, svc_dec, svc_enc.
- A gtest named `AvcEncTest`.
- Example binaries `avcdec` and `avcenc`.

Hand-written SIMD exists only for ARM (NEON, in `common/arm` and `common/armv8`) and x86 (SSE/SSSE3, in `common/x86`). All other targets use generic C function pointers.

**Governance.**
- **Foundation:** none. libavc is an AOSP third-party import governed by Google/AOSP. There is no MAINTAINERS file, and no documented tier or acceptance policy for architectures.
- **Files in the repo:** `OWNERS`, `METADATA`, `LICENSE`, `NOTICE`, `MODULE_LICENSE_APACHE2`, `PREUPLOAD.cfg`, `TEST_MAPPING`.
- **License:** Apache-2.0 (`METADATA` license_type NOTICE).
- **Import mechanism:** `METADATA` records an import from the Ittiam GitHub repository via `external_updater`, currently v1.6.0 (2024-10-30). The AOSP HEAD is `e67b0aa3b0f5eb15b40c4d148c5d070d8a2c6828` (2024-11-02, "Upgrade libavc to v1.6.0"). The research clone showed no newer AOSP commits.
- **Upstream release lag:** the Ittiam GitHub clone has tags through v1.9.0 and a head `f44f4d8` dated 2026-10-23. AOSP was therefore several upstream versions behind at research time. [NEEDS VERIFICATION: single source]
- **Owners:** `OWNERS` lists the Android media janitors (`avic_OWNERS`, `codec_OWNERS` from `frameworks/av`) and Ray Essick (Google).
- **Code authors:**
  - Harish Mahendrakar has about 1,016 commits.
  - Hamsalekha S, Ashwin Natesan and chamarthi.kishore are the other main authors.
  - Martin Storsjo has about 367 commits.
  - The Ittiam affiliation of the first four is inferred from the upstream mirror and from the SVC/riscv64 follow-up commits. Storsjo's employer was not checked.
- **Google integration engineers:** Ray Essick, Marco Nelissen, Xin Li and Elliott Hughes.
- **RISE:** libavc is neither a RISE work item nor listed in any RISE project. A RISE Android 17 manifest includes it as an ordinary AOSP project (Section 7).
- **Community culture on new ports:** there is no written stance. The history shows an external riscv64 patch was accepted. It was finished and landed by a Google engineer after review by the Ittiam code owner and a Google media owner. A later external patch (Gerrit 3061805) has had no review for about 30 months.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-02-23 | Mao Han (Alibaba/T-Head) authors commit `e8b0093` "Add riscv64 support". Message: "Use generic function pointers on riscv. Test: built for aosp_riscv64" | [commit e8b0093](https://android.googlesource.com/platform/external/libavc/+/e8b0093646bf740f7549fdb9fae938e37f1715be) |
| 2022-08-02 | Gerrit change 2171962 created by Han Mao. Reviewers added by the Lint bot and Han Mao: Lajos Molnar, Elliott Hughes | [Gerrit 2171962](https://android-review.googlesource.com/c/platform/external/libavc/+/2171962) |
| 2022-12-01 | Elliott Hughes (Google) commits the revised change. Harish Mahendrakar (Ittiam) gives Code-Review +1. Presubmit-Verified +2 from Treehugger | Gerrit 2171962 |
| 2022-12-02 | Ray Essick (Google) gives Code-Review +2. Hughes submits at 17:19 to master | Gerrit 2171962 |
| 2022-12-02 and 2022-12-12 | Automerger copies to `main-16k` (changes 2325259, 2345475) | [Gerrit 2325259](https://android-review.googlesource.com/c/platform/external/libavc/+/2325259), [Gerrit 2345475](https://android-review.googlesource.com/c/platform/external/libavc/+/2345475) |
| 2023-01-30 | Commit `bb0f31c` "Encoder: SVC encoding support added" adds `encoder/riscv/svc/` selectors and riscv64 blocks | AOSP history; commit page not re-fetched [NEEDS VERIFICATION] |
| 2023-02-02 | google/android-riscv64 issue #32 "external/libavc: optimization" opened by enh-google | [issue #32](https://github.com/google/android-riscv64/issues/32) |
| 2023-02-07 | Commit `43629a6` (Ashwin Natesan, merged by Harish Mahendrakar, both Ittiam) "svcenc: fixed riscv4 soong build errors". The message says "riscv4" for riscv64 | [commit 43629a6](https://android.googlesource.com/platform/external/libavc/+/43629a63d8cb3b52195c032a662e62ac3bfd8aae) |
| 2023-02-08 | Commit `375b9b7` "SVC decoder support" adds the decoder SVC selector | [commit 375b9b7](https://android.googlesource.com/platform/external/libavc/+/375b9b7) |
| 2023-03-11 | `.github/workflows/cmake.yml` and `cifuzz.yml` added (x86_64 only) | AOSP clone |
| 2024-01-30 | `TEST_MAPPING` with postsubmit `AvcEncTest` added in `df62df7` | AOSP clone |
| 2024-03-22 | Last `Android.bp` change ("Remove useless `neon:` clause"). No riscv-related commits after 2023-02-07 | AOSP clone |
| 2024-04-26 | RT-RK (Nikola Jelic) uploads Gerrit 3061805, scalar riscv64 assembly plus CMake support. Status NEW, no votes, no comments | [Gerrit 3061805](https://android-review.googlesource.com/c/platform/external/libavc/+/3061805) |
| 2024-10-30 / 2024-11-02 | Upgrade to Ittiam v1.6.0 (last AOSP commit seen) | [AOSP libavc](https://android.googlesource.com/platform/external/libavc) |
| Undated (page footer 2026) | RT-RK publishes RVV intrinsics results for six encoder functions. No Gerrit submission linked | [RT-RK RVV article](https://www.rt-rk.com/accelerating-libavc-on-risc-v-performance-gains-through-vector-intrinsics-rvv/) |
| 2026-10-20 | RISE announces Android 17 v1.0 on RVA23 (project RP024). Its manifest lists stock `external/libavc` | [RISE Android 17 post](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/), [android_manifest](https://github.com/riseproject-dev/android_manifest) |

**Key contributors.**
- **Mao Han (Alibaba/T-Head):** original riscv64 port.
- **Elliott Hughes (Google):** completed and submitted the port.
- **Harish Mahendrakar and Ashwin Natesan (Ittiam):** reviewed it and extended it to SVC.
- **Ray Essick (Google):** approved it.
- **RT-RK (Nikola Jelic, Dusan Stojkovic, Dejan Bokan):** downstream scalar assembly and RVV intrinsics.

**Timing.** The commit was authored 2021-02-23 and merged 2022-12-02, about 21 months later (computed). The merged scope is build enablement with generic C only.

**Is it fully upstream?** The generic-C riscv64 build is upstream AOSP. No optimized riscv64 code is upstream. Gerrit changes 1899140 (decoder SVC) and 1968119 (encoder SVC) appeared in the riscv query but are abandoned. The SVC code was later re-landed with riscv64 selectors.

**Upstream Ittiam repository.** The findings contradict each other:
- One search found no riscv mention and no top-level `riscv` directory in the README or listing, with the listing truncated.
- Another stated the v1.6.0 import has no riscv directories.
- A third compared clones and reported the same 8-file riscv set in both the AOSP and the GitHub head (2026-10-23).

These are compatible if riscv directories were added to the GitHub repository after v1.6.0. This is unconfirmed. [NEEDS VERIFICATION]

## 3. Upstream Support Tier

**Formal tier policy:** Data not available. The AOSP repo, README and Gerrit history contain no tier or acceptance policy for architectures. The README lists only aarch32/aarch64 on Linux and Android and x86_32/x86_64 on Linux. riscv64 is absent from it.

**Evidence.** The merged riscv64 support is Soong build blocks only. Release-blocking status is not documented, and no official riscv64 binary exists.

| Aspect | amd64 (x86_64) | arm64 | riscv64 |
|---|---|---|---|
| README-listed target | Linux x86_32/64 | Linux and Android aarch32/64 | Not listed |
| Soong `arch:` block in `Android.bp` | Yes (`-DX86`, SSE4.2/SSSE3) | Yes (`-DARMV8`, NEON) | Yes (include dirs and generic selectors, no cflags) |
| SIMD kernels | SSE/SSSE3 | NEON | None |
| Standalone CMake build | Supported | Supported (toolchain files, NDK) | Not supported (falls into x86 branch) |
| Public CI | GitHub Actions cmake build, CIFuzz, OSS-Fuzz | None found in tree (ARM only built via NDK toolchain, no job) | None |
| OSS-Fuzz architectures | x86_64, i386 | Not listed | Not listed |
| First AOSP release | Pre-Android 14 | Pre-Android 14 | Android 14 (likely) |
| Official standalone binaries | None | None | None |

For arm64, the findings list the CMake toolchain files but record no ARM CI job. The "None found in tree" entry reflects that.

**Android release (discrepancy).** `e8b0093` is an ancestor of `android-14.0.0_r1`, `android-15.0.0_r1` and `android-16.0.0_r1`. It is not in `android-13.0.0_r1`, `android-13.0.0_r83`, `android-12.1.0_r1`, or the android12/android13 release and dev branches. Three searches reported `android-14.0.0_r1` as the first tag. One reported the earliest containing tags as `android-14.0.0_r16` and `android-u-beta-1-gpl`, and noted its Android 13 ancestry check errored. Another could not confirm the first tagged release. The readiness grade treats Android 14 as likely but not fully confirmed. Android 13 riscv64 builds would have needed `ALLOW_MISSING_DEPENDENCIES`. The Cuttlefish `vsoc_riscv64/BoardConfig.mk` carries "Temporary hack while prebuilt modules are missing riscv64." with `ALLOW_MISSING_DEPENDENCIES := true`. That hack is not libavc-specific.

## 4. Technical Architecture and RISC-V-Specific Subsystems

libavc selects implementations through per-architecture `*_function_selector.c` files that fill function-pointer tables. riscv64 fills them with the generic C initializers.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Decoder function selector | SSE4.2/SSSE3 pointers (`D_ARCH_X86_SSE42`) | NEON pointers (`D_ARCH_ARMV8_GENERIC`) | `ih264d_init_function_ptr()` calls `ih264d_init_function_ptr_generic()`. `ih264d_init_arch()` returns `ARCH_NA`. Scalar C |
| Encoder function selector | SSE pointers | NEON pointers | `ih264e_init_function_ptr_generic()`, `ih264e_default_arch` returns `ARCH_NA`. Scalar C |
| SVC enc/dec selectors | x86 | ARM | Generic only, `ARCH_NA` (`encoder/riscv/svc/isvce_function_selector.c`, `decoder/riscv/svc/isvcd_function_selector.c`) |
| MVC decoder (`libmvcdec`) | Builds | Builds | No riscv64 block in `Android.bp`. It relies on the plain build |
| Platform macros | x86 header | ARM header | `common/riscv/ih264_platform_macros.h` (109 lines). Plain C macros: clip, shift, `CLZ`/`CTZ` via `__builtin_clz`/`__builtin_ctz`, `DATA_SYNC` via `__sync_synchronize`, empty `PLD`, `NOP` as `asm("nop")`, `__builtin_bswap32` for byte swap. Encoder adds `ih264e_platform_macros.h`, `ime_platform_macros.h` |
| Hand-written SIMD or assembly | SSE C intrinsics | NEON `.s` and C | None merged. No `.S`/`.s`, no `__riscv` guard, no `riscv_vector.h`, no `vsetvli` anywhere in the AOSP tree |
| JIT | None | None | None |
| Crypto | Not applicable | Not applicable | Not applicable |

**ISA extensions in the merged build.**
- No `-march` or cflags are set for riscv64 in `Android.bp`, so the toolchain default applies. No V, Zvk or Zb requirement exists in merged code.
- The CMake form of the open change sets `-march=rv64imafdc -O3 -DRISCV -DDEFAULT_ARCH=D_ARCH_RISCV64`.

**Open change 3061805 (not merged).** Quality: scalar RV64 assembly, no RVV.
- **Routines:** `ih264_inter_pred_luma_copy`, `ih264_inter_pred_chroma`, `ih264_weighted_pred_chroma`, `ih264_weighted_bi_pred_luma`, `ih264_weighted_bi_pred_chroma`.
- **Instructions:** `lbu`/`sb` byte loops (luma copy unrolled 8x), `mul`, `sll`, `sra`, `sext`.
- **API additions:** an `ARCH_RISCV64 = 0x400` value in `IVD_ARCH_T`, `D_ARCH_RISCV64 17`, and a `--arch RISCV64` option in `avcdec`.
- **Scope:** decoder only. No encoder routines and no performance numbers. The only stated test is `avcdec -c dec.cfg`.
- **Possible defect:** `sext.b` and `sext.h` belong to Zbb, which is not in `rv64imafdc`. The summary says the weighted-pred file uses them. This was not verified against the raw patch. [NEEDS VERIFICATION]
- **Rebase:** the patch is based on parent `21f3edd`, not on the v1.6.0 head, so it may need rebasing.

**Downstream RVV (RT-RK, not upstreamed).** Six encoder functions were converted to RVV intrinsics in C:
- `ime_sub_pel_compute_sad_16x16`
- `ime_calculate_sad4_prog`
- `ih264e_sixtap_filter_2dvh_vert`
- `ih264_evaluate_intra16x16_modes`
- `ih264_inter_pred_chroma`
- `ih264e_sixtapfilter_horz`

See Section 6 for numbers. Separately, an earlier RT-RK page ([RT-RK page 13692](https://www.rt-rk.com/?p=13692)) describes hand-written RISC-V assembly for libavc decode, libmpeg2 and libxaac on a StarFive VisionFive 2 (JH7110), reporting 5% to 40% gains across critical functions for all libraries together. It gives no libavc-specific figure.

## 5. Build System, Cross-Compilation, and Toolchain

### Soong (the supported riscv64 path)

```
lunch aosp_riscv64
```

- This is the lunch target named in the Gerrit 2171962 review. The commit says "Test: built for aosp_riscv64".
- `Android.bp` has `riscv64:` arch blocks at lines 112, 198, 358, 571, 725 and 857. They cover `libavc_enc_defaults`, `libavc_dec_defaults`, `libavcdec`, `libavcenc`, `libsvcenc` and `libsvcdec`.
- The blocks add `local_include_dirs` (`common/riscv`, `encoder/riscv`, and the `*/riscv/svc` directories) and the `*_function_selector.c` sources only. No `-DX86`, `-DARMV8` or `-DDEFAULT_ARCH` is set.
- The compiler is the AOSP prebuilt clang of the tree in use. No riscv-specific minimum is stated anywhere.
- RISE's Android 17 build replaces `platform/build/soong` with its own fork (K3 X100 and A210 riscv64 variants), per the `default.xml` snippet. A RISE fork repository `android_build_soong` also exists.

### Standalone CMake (not supported as shipped)

Documented README commands cover native, x86_32, aarch64, aarch32 and Android NDK builds only.

```
mkdir build && cd build && cmake ..
cmake .. -DCMAKE_TOOLCHAIN_FILE=../cmake/toolchains/aarch64_toolchain.cmake
```

- In-tree builds are refused. Minimums stated: cmake 3.9.1, clang 12 for `-DENABLE_TESTS=1`, clang 6 for the fuzzers (`-fsanitize=fuzzer`).
- No minimum GCC is stated. The C is C90 style (`CMAKE_C_STANDARD 90`).

**Known failures on riscv64 with an unmodified tree** (one researcher's reproduction with Ubuntu 24.04 cross GCC 13.3.0, cmake 3.28.3, clang 18.1.3; [NEEDS VERIFICATION], single source):
- Any riscv64 `SYSTEM_PROCESSOR` falls into the `else()` x86 branches in `cmake/utils.cmake`, `common/common.cmake`, `decoder/libavcdec.cmake` and `encoder/libavcenc.cmake`.
- The compile fails with `unrecognized command-line option '-msse4.2'` and the same for `-mno-avx`.
- The x86 SSE sources and `-DX86 -DX86_LINUX=1 -DDISABLE_AVX2 -DDEFAULT_ARCH=D_ARCH_X86_SSE42` are also pulled in.
- `android_toolchain.cmake` maps every non-`armeabi` ABI to `SYSTEM_PROCESSOR=aarch64`. A `-DANDROID_ABI=riscv64` NDK build would be configured as arm64.
- The SVC and MVC cmake files (`libsvcenc.cmake`, `libsvcdec.cmake`, `libmvcdec.cmake`, `svccommon.cmake`) key off `CMAKE_SYSTEM_PROCESSOR` and have no riscv64 branch. They were not built.
- The sanitizer/fuzzer build is skipped with "Compiler doesn't support -fsanitize=fuzzer". A riscv64 libFuzzer build was not tested.

**Working recipe** (requires an 11-line, 4-file patch adding an `elseif riscv64` branch in each place; not upstream; saved by the researcher as `libavc-riscv64-cmake.patch` in the scratchpad):

```
apt-get install -y gcc-riscv64-linux-gnu g++-riscv64-linux-gnu qemu-user cmake
cd libavc && patch -p1 < libavc-riscv64-cmake.patch
mkdir build && cd build
cmake .. -DCMAKE_TOOLCHAIN_FILE=/path/riscv64_toolchain.cmake -DCMAKE_BUILD_TYPE=Release
make -j8
```

The toolchain file sets `CMAKE_SYSTEM_NAME Linux`, `CMAKE_SYSTEM_PROCESSOR riscv64`, `SYSTEM_NAME Linux`, `SYSTEM_PROCESSOR riscv64`, `CMAKE_C_COMPILER riscv64-linux-gnu-gcc` and `CMAKE_CXX_COMPILER riscv64-linux-gnu-g++`. Both `SYSTEM_PROCESSOR` and `CMAKE_SYSTEM_PROCESSOR` must be set. The first is read by `utils.cmake`, decoder, encoder, common and examples. The second is read by the SVC and MVC files.

**Build results.**
- GCC 13.3.0 produced `avcdec`, `avcenc`, `libavcdec.a` and `libavcenc.a`. The warnings were `-Wstringop-overflow` in `decoder/ih264d_parse_pslice.c:208` and `-Wformat-overflow` in `examples/avcenc/main.c`.
- Clang 18.1.3 compiled and archived both libraries. Linking failed in that environment because the cross libc symlinks sit outside the sysroot. That is an environment issue, not a libavc one.
- No source gives a reason for any riscv-specific compiler minimum. No older compilers were tested.

**Open change 3061805** would add `cmake/toolchains/riscv64_toolchain.cmake` (using `riscv64-linux-gnu-gcc`/`g++`). It is unreviewed.

### QEMU

```
Q="qemu-riscv64 -L /usr/riscv64-linux-gnu"
ARGS="--input in.yuv --width 176 --height 144 --num_frames 10 --input_chroma_format YUV_420P --rc 0 --bframes 0"
$Q ./avcenc $ARGS --output rv.264 --recon_enable 1 --recon rv_recon.yuv
$Q ./avcdec -i nat.264 -o rv_dec.yuv -s 1 --chroma_format YUV_420P
```

The test input was a 176x144, 10-frame clip generated with ffmpeg `testsrc2`. A local clang `--target=riscv64-linux-gnu -fsyntax-only` check in a different session failed on the missing sysroot header `bits/libc-header-start.h`, so no local clang build confirmation exists in that session.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AVC decode (C path) | Yes | Yes | Yes (Soong build) |
| AVC encode (C path) | Yes | Yes | Yes (Soong build) |
| SVC encode and decode | Yes | Yes | Yes (generic selectors, since Feb 2023) |
| MVC decode | Yes | Yes | No riscv64 block. Plain build assumed, untested |
| SIMD acceleration | SSE | NEON | None merged |
| Standalone CMake build | Yes | Yes | No (patch required) |
| Fuzzers (Soong `cc_fuzz`) | Yes | Yes | Defined, riscv64 execution not evidenced |
| `AvcEncTest` | Defined arch-neutral | Defined arch-neutral | Defined arch-neutral, riscv64 run not evidenced |

**Functional gaps.** None are known in the generic path. All gaps are performance or build-system gaps.

**Correctness of the generic path** (one researcher's QEMU run, single source, [NEEDS VERIFICATION]):
- The riscv64 encoder output (16756 bytes) is identical to the x86_64 SSE path on the same patched tree.
- Reconstruction output is identical.
- Decoded output (304128 bytes) is identical.
- RT-RK also states its RVV output is bit-exact against its baseline and reports no bugs.
- No CTS, TradeFed or Cuttlefish run on riscv64 was found. The only recorded validation of the merged upstream port is "built for aosp_riscv64". Whether `c2.android.avc.*` is validated on riscv64 Cuttlefish was not verified.

**Performance gaps.** There is no independent benchmark of libavc on riscv64. The only numbers are two RT-RK vendor reports. They were measured against a GCC auto-vectorized baseline, not pure scalar. Baselines are the compiler output of the unmodified source, not scalar-only.

BPI-F3 (single core, Linux perf), from [RT-RK](https://www.rt-rk.com/accelerating-libavc-on-risc-v-performance-gains-through-vector-intrinsics-rvv/):

| Variant | Total cycles | Time (s) |
|---|---|---|
| Base | 1,185,564,857 | 0.695752 |
| Optimized | 821,883,615 | 0.478514 |

That is about 1.44x in cycles and 1.45x in time (computed from the table). Four cores: 1,535,375,803 to 955,958,149 cycles, and 0.312551099 s to 0.220119798 s, about 1.61x in cycles and 1.42x in time (computed).

Per function, cycles before and after, with speedup computed from the table:

| Function | Before | After | Speedup |
|---|---|---|---|
| `ime_sub_pel_compute_sad_16x16` | 143,809,017 | 31,642,519 | about 4.5x |
| `ime_calculate_sad4_prog` | 119,742,050 | 20,053,960 | about 5.97x |
| `ih264e_sixtap_filter_2dvh_vert` | 119,386,381 | 38,135,399 | about 3.13x |
| `ih264_evaluate_intra16x16_modes` | 62,834,937 | 31,971,272 | about 1.97x |
| `ih264_inter_pred_chroma` | 35,685,502 | 21,615,539 | about 1.65x |
| `ih264e_sixtapfilter_horz` | 29,402,008 | 10,026,980 | about 2.93x |

Test workload: 640x360, 25 frames at 25 fps (about 530 kbps).

Semidynamics FPGA (Atrevido core; the article calls it "Atrevido 423" and "Artevido 430" in different places, a naming discrepancy; GCC 14.1 Aliado SDK and Clang 19). Results are frames per second at VLEN=512 and 2048:

| Config | 1280x720 | 640x360 |
|---|---|---|
| GCC base, VLEN 512 | 0.12 | 0.80 |
| GCC optimized, VLEN 512 | 0.17 | 1.01 |
| Clang base, VLEN 512 | 0.12 | 0.89 |
| Clang optimized, VLEN 512 | 0.14 | 0.91 |
| GCC base, VLEN 2048 | n/a | 0.47 |
| GCC optimized, VLEN 2048 | n/a | 0.70 |
| Clang base, VLEN 2048 | n/a | 0.49 |
| Clang optimized, VLEN 2048 | n/a | 0.67 |

Gains on the FPGA ranged from about 2% to 49% depending on compiler and VLEN. Absolute FPS is very low because it is an FPGA. The article has inconsistencies: Figure 2 omits F6, Table 1 has a sign typo, the four-core table lacks per-function cycles, and it does not say how the encoder was split across threads. The article warns the compiler can reorder memory accesses around the SAD code and recommends an `asm volatile("" ::: "memory")` barrier.

The QEMU frame rates (176x144 encode about 172 FPS vs about 2674 FPS native x86_64; decode about 264 FPS vs about 6406 FPS) measure emulation overhead and say nothing about hardware performance.

**Not covered by any source:**
- Decoder RVV performance.
- Hardware measurements of the merged generic path vs arm64.
- Scalar baseline numbers.

**Security hardening gaps.** Data not available. The CFI and sanitizer settings in the Soong defaults are not riscv64-gated, and no search checked whether they work on riscv64.

**NaN / floating-point semantics.** Data not available. No source discussed floating-point semantics for libavc, and no issue about them was found.

## 7. CI/CD Infrastructure

**riscv64 CI does not exist in the public tree.** This was confirmed by reading the files below at HEAD `e67b0aa`.

| File | What it does | riscv64? |
|---|---|---|
| `.github/workflows/cmake.yml` | One job on `ubuntu-latest` (x86_64). `cmake -DCMAKE_C_COMPILER=clang -DENABLE_MVC=1 -DENABLE_SVC=1 -DENABLE_TESTS=1`, then build. No toolchain file, no tests run | No |
| `.github/workflows/cifuzz.yml` | CIFuzz with address and memory sanitizers on x86_64, 600 seconds | No |
| `TEST_MAPPING` | `postsubmit: AvcEncTest` only, no architecture qualifier | No |
| `tests/Android.bp`, `tests/AndroidTest.xml` | `cc_test AvcEncTest` gtest in `device-tests`, no `arch:` or abi option | No |
| `fuzzer/Android.bp`, `fuzzer/ossfuzz.sh` | `cc_fuzz` defaults, native `cmake` in `ossfuzz.sh`, no cross-compile | No |
| `PREUPLOAD.cfg` | One hook, `mainline_hook_project.sh` | No |

A grep for riscv over `.github`, `TEST_MAPPING`, `PREUPLOAD.cfg`, `.vscode`, `tests/` and `fuzzer/` returned no matches. No `.gitlab-ci.yml`, Jenkinsfile, buildbot or Jenkins config exists. The two GitHub workflows are Ittiam-style files carried inside the AOSP mirror. AOSP Gerrit does not run them. The OSS-Fuzz `project.yaml` (in the google/oss-fuzz repository, `projects/libavc`) lists `architectures: [x86_64, i386]`, sanitizers address, memory and undefined, and engines afl, honggfuzz and libfuzzer.

**Not visible from the public tree.** Google's internal Android Build / ATP infrastructure was not inspected. It may build `aosp_riscv64` and may run `TEST_MAPPING` `AvcEncTest` on a riscv64 Cuttlefish. One finding inferred from commit `43629a6` (an Ittiam fix of a riscv64 Soong build error a month after SVC landed) that Ittiam's own CI builds the riscv64 target. This is an inference, not a read config, and it conflicts with the absence of any public riscv64 job. [NEEDS VERIFICATION]

**RISE runners.** The RISE runner label is `ubuntu-24.04-riscv`, on Scaleway EM-RV1 bare metal, free to open-source GitHub projects ([announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), [six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)). Neither post mentions libavc, Android or codecs. No libavc use of the runners was found. The RISE wheel_builder page does not list libavc.

**Hardware named in vendor work (not CI).** Banana Pi BPI-F3, StarFive VisionFive 2, a Semidynamics FPGA. RISE Android 17 targets the SpacemiT K3 Pico-ITX and the Alibaba A210 EVB.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI (public) | GitHub Actions `ubuntu-latest` | None found | None |
| Fuzzing CI | CIFuzz, OSS-Fuzz | Not listed in OSS-Fuzz | None |
| Soong build in public CI | Not visible | Not visible | Not visible |
| Postsubmit test | `AvcEncTest` mapping is arch-neutral. Google-internal execution not visible | Same | Same, riscv64 execution not evidenced |

## 8. Distribution and Release Status

libavc is released through AOSP only: release tags (such as `android-14.0.0_r1` and later) and the Android release branches. The only way to get a riscv64 build is to build AOSP.

| Channel | Result |
|---|---|
| PyPI | `https://pypi.org/pypi/libavc/json` returns HTTP 404. No project exists, so no wheels. GitLab package-index check redirected to the same 404 |
| Ubuntu 26.04 (resolute) | The packages.ubuntu.com search returned HTTP 500 twice. Substitute Launchpad `getPublishedSources` (resolute) and `getPublishedBinaries` (primary archive, exact name `libavc`) returned `total_size: 0` |
| Debian | Only `libavc1394`, which is an unrelated IEEE 1394 AV/C library. `/api/src/libavc/` returned 404 |
| Arch Linux / Arch RISC-V | Upstream Arch has no `libavc` package. A substring search matched only `ffmpeg`, `ffmpeg4.4` and `libavc1394`. The Arch RISC-V repo pages could not be read |
| Fedora, npm, Maven, OCI | Data not available. These were not searched |
| Ittiam GitHub | Source mirror. No Releases are shown. Tags exist, through v1.9.0 [NEEDS VERIFICATION] |

The Ubuntu check could not be completed on the requested page. The three substitute queries together show no `libavc` package, but they do not prove riscv64 absence in resolute.

**What a user must do to get a working binary:**
1. For Android: sync AOSP at Android 14 or later (`android-14.0.0_r1` onward) and build `aosp_riscv64`. libavc builds as part of the tree through its Soong riscv64 blocks. Alternatively, use RISE's Android 17 developer release (v1.0, open source, not certified), whose manifest pulls `platform/external/libavc` from `riseproject-dev/android_manifest` branch `android-17`. Which remote and revision `external/libavc` is pinned to was not confirmed, because the repo could be read only through its public web page and a code-search snippet. [NEEDS VERIFICATION]
2. For standalone Linux: apply the unmerged 4-file CMake patch (Section 5) and cross-compile or build natively. The result is generic C with no SIMD.

## 9. Dependencies

The Soong build has no third-party library dependencies. The listed dependencies are the build system, toolchain, platform runtime and test framework. The graph database tool (`project_graph_query`) was not available in the research session. No dependency was checked against Ubuntu 26.04 riscv64, so statuses below come from reasoning over the AOSP build and the repository's own status reports.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Soong | build-dependency, critical | Builds libavc via the riscv64 arch blocks. RISE's Android 17 manifest swaps in its own Soong fork | `aosp_riscv64` build only | AOSP | Google/AOSP. RISE fork `android_build_soong` |
| LLVM | build-dependency, critical | AOSP prebuilt clang compiles the generic C path. Local clang 18.1.3 compiled the libraries | Not checked. riscv64 libFuzzer (`cc_fuzz`) not verified | Toolchain, not shipped | LLVM. See [LLVM status report](project-reports/llvm.md) |
| CMake | build-dependency, optional | Standalone path has no riscv64 support without a patch (Section 5). CMake 3.28.3 was used with the patch | Not applicable | Not applicable | Kitware. Minimum required 3.9.1 |
| Bionic | runtime-dependency, critical | riscv64 is a Bionic target (inferred) | Not checked | Ships in AOSP riscv64 builds | Google. See [Bionic status report](project-reports/bionic.md) |
| googletest | test-dependency, optional | Builds for riscv64 (inferred) | Not checked | AOSP only | Google. See [googletest status report](project-reports/googletest.md) |

**Indirect and implicit AOSP modules** (inferred from `Android.bp` shape, not verified on riscv64 in this session):

| Name | Role | Notes |
|---|---|---|
| liblog (`system/logging`) | Shared lib in the enc/dec defaults, static in the fuzzers | Ships in AOSP riscv64 builds. Inferred |
| libcutils (`system/core`) | Shared lib in the enc/dec defaults | Same |
| libutils | Used only by `AvcEncTest` | Same |
| libc++ | C++ runtime for fuzzers and tests | Part of the AOSP riscv64 toolchain. Inferred |

**Deep-dive.** The dependency set has no JIT, crypto or numerics libraries. The critical dependencies are the compiler and Soong. Their riscv64 status is covered in the status reports linked above. The five `*_headers` modules (`libavcdec_headers`, `libmvcdec_headers`, `libsvcenc_headers`, `libsvcdec_headers`, `libavcenc_headers`) are internal and header-only. `min_sdk_version` is 29 on the headers.

## 11. Known Bugs and Active Issues

Section 10 is omitted. libavc is a system library with no dependent package ecosystem.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [google/android-riscv64 #32](https://github.com/google/android-riscv64/issues/32) | external/libavc: optimization | Open since 2023-02-02. Assigned to rbosetti 2023-02-14, unassigned 2023-10-20, "enhancement" label 2024-02-28. No current assignee, no comments, no numbers | Performance | Filed by enh-google. Says Ittiam presumably does the work and that RVV assembly is needed. Sibling issue #33 (libhevc) has the same text and status |
| [Gerrit 3061805](https://android-review.googlesource.com/c/platform/external/libavc/+/3061805) | RISCV build support for Linux/Android | NEW since 2024-04-26, no votes, no comments | Performance, build | Scalar asm, decoder only. Possible Zbb issue (Section 4). May need a rebase |
| (none) | CMake build falls into x86 branch on riscv64 | Not filed | Build | Reproduced by one researcher. Patch not upstream |
| (none) | `android_toolchain.cmake` maps `ANDROID_ABI=riscv64` to aarch64 | Not filed | Build | Inferred from reading the file |
| OSV-2023-117 | Heap overflow in `isvcd_nal_byte_swap_emulation` | Architecture-independent | n/a | Not a riscv64 bug |

**Correctness bugs specific to riscv64:** none on record. The searches "libavc riscv64 bug", "performance issue" and "benchmark" found none, `ittiam-systems/libavc` GitHub search for "riscv" returned 0 issues, and no riscv-related correctness commit exists after the 2023-02-07 build fix. Google's Issue Tracker could not be queried without sign-in. The FFmpeg Trac tickets that surfaced (#11302, #11258) concern FFmpeg, not libavc.

## 12. Objections and Upstream Blockers

**Stated objections (Gerrit 2171962 review, all resolved in the merged change):**
- **Byte swap:** Essick preferred `htonl()` over `bswap32()`. Harish replied the library is untested on big-endian and other compilers use separate internal headers, so `__builtin_bswap32()` stays. Hughes and Essick converged on `bswap32`. Harish said they would look at the decision in a separate change.
- **`ARCH_RISCV` enum:** Essick suggested adding it to `decoder/ivd.h`. Harish said it was unnecessary without multiple implementation options as on x86 or ARM. Change 3061805 now adds `ARCH_RISCV64 = 0x400`.
- **Unresolved:** one of the 27 comments was shown as unresolved. The last 27,660 characters of the change JSON were not read.

**Technical blockers:**
- RVV or any riscv64 optimization needs vector kernels, and an enh-google comment in issue #32 states saturating arithmetic has no RISC-V extension. [NEEDS VERIFICATION: single source]
- The dispatch model (`*_function_selector.c` plus function-pointer tables) has a clear place for RVV kernels. The existing `ARCH_NA` path means a runtime-detection mechanism for RVV would be new work.

**Organizational blockers:**
- Ittiam is the codec's real developer. The issue #32 text expects Ittiam to do the optimization work. No Ittiam riscv64 optimization work was found.
- Change 3061805 has had no human review since 2024-04-26 (about 30 months at the report date). Its single reviewer is Fyodor Kyslov (Google), added by the Lint bot as code owner.
- RT-RK states it plans to integrate its RVV work into community-maintained codebases later. It gave no Gerrit link.
- No governance, tier policy or acceptance criteria exist to appeal to.

**Acceptance probability:** Data not available as a quantity. The evidence is mixed. The generic port was accepted after about 4 months on Gerrit (2022-08-02 to 2022-12-02). The performance patch has had no reviewer attention. Acceptance of future riscv64 optimization code depends on Ittiam and Google reviewers engaging.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** RISE

Upstream AOSP builds libavc for riscv64 through Soong riscv64 arch blocks ([Gerrit 2171962](https://android-review.googlesource.com/c/platform/external/libavc/+/2171962), generic C path only, tested only by "built for aosp_riscv64", first in Android 14). No riscv64 CI job builds or tests it in any public configuration: the GitHub workflows are x86_64 only and OSS-Fuzz lists x86_64 and i386. No riscv64 artifact is published by upstream. The distribution floor applies. RISE's Android 17 manifest ([riseproject-dev/android_manifest](https://github.com/riseproject-dev/android_manifest)) ships stock, unpatched `platform/external/libavc` in its riscv64 developer release, so the grade is yellow (clean-distro-build) with the release provided by RISE, not upstream. It is not graded as an optimization-purpose project, because the value is H.264 codec functionality, which the generic C path delivers. Hand-written SIMD exists only for NEON and SSE.

**Pending work that could change the grade:**
- Gerrit change 3061805 (RT-RK, scalar riscv64 assembly plus CMake support) is open and unreviewed since 2024-04-26.
- RT-RK has published downstream RVV intrinsics for six encoder functions (about 1.45x on BPI-F3), with no Gerrit submission seen.
- google/android-riscv64 issue #32 has been open since 2023-02.
- RISE Android 17 (RP024) phase 2 plans CI automation and possible follow-up RFPs for multimedia libraries. No libavc-specific RISE work was found.
- No riscv64 CI evidence is visible in the public tree. Google's internal postsubmit (`TEST_MAPPING` `AvcEncTest`) could not be inspected. If it runs on riscv64 Cuttlefish, the grade could rise to blue.
- The Android 14 first-release claim is likely but not fully confirmed from tags. No live re-check of the report date dimension was run (no stored report was used, no new research done).

## 14. Investment Analysis

**What RISE has done or funded.** No RISE-funded libavc work exists. The only RISE touchpoints are the stock `external/libavc` project in the Android 17 manifest and the planned RP024 phase 2, which names "multimedia libraries" as a possible follow-up RFP area. No libavc post, repository, fork or runner use was found among the 37 RISE posts (33 judged by title only). Work in Section 14 is therefore not already covered by RISE.

Effort figures below are engineering estimates by this author, not taken from the research findings. They are sized against the scope of the RT-RK work, which covered six encoder functions and five decoder routines.

### 14.1 Functional Enablement

- **Upstream the standalone CMake riscv64 support.** The reproduced 4-file, 11-line patch covers the main files. The SVC and MVC cmake files, `android_toolchain.cmake`, and a riscv64 toolchain file also need branches. This is a small change with a build verification step.
- **Validate on real riscv64 Cuttlefish.** Run `AvcEncTest` and the Codec2 `c2.android.avc.*` path. This is the only gap in correctness evidence for the shipping path.
- **Check the MVC decoder.** `libmvcdec` has no riscv64 block.
- **Add a regression check.** Bit-exactness against the x86 C/SIMD output at decode and encode, as in the QEMU experiment above.

### 14.2 Performance Optimization

- **Rebase and review 3061805, or supersede it with RVV.** The scalar assembly gain is unquantified. Decide whether to land it or go straight to RVV.
- **Bring RT-RK's six RVV encoder kernels upstream.** RT-RK owns the code, so coordination is cheaper than reimplementation. Reported gains are about 1.45x on BPI-F3 against a GCC auto-vectorized baseline.
- **Decoder RVV kernels.** No decoder RVV measurement exists. Profile first, then port the NEON hot paths.
- **Port NEON kernels with tooling.** A RISE post titled "SaltyRN: turning NEON kernels into fast verified RVV code with LLMs" ([post](https://riseproject.dev/2026/07/27/saltyrn-turning-neon-kernels-into-fast-verified-rvv-code-with-llms/)) may be relevant. Its content was not read. [NEEDS VERIFICATION]
- **Add a runtime selection mechanism.** An RVV arch value and detection in the function selectors would be new work.

### 14.3 CI/CD Infrastructure

- **Native CI on RISE runners.** Add a riscv64 job on `ubuntu-24.04-riscv` that builds the CMake tree (with the patch) and runs the example encode/decode comparison. This applies only to a repository that accepts GitHub Actions, for example a fork, since AOSP Gerrit does not run them.
- **Cuttlefish riscv64 postsubmit.** `AvcEncTest` needs a riscv64 run. This depends on Google's infrastructure or on RISE Android 17 phase 2 CI automation.
- **Fuzzing.** A riscv64 `cc_fuzz` run is untested. OSS-Fuzz does not list riscv64.

### 14.4 Ecosystem Enablement

Not applicable. libavc has no dependent package ecosystem. Its consumers are the AOSP Codec2 and OMX software codecs, so enablement is covered by 14.1 and 14.3.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Run `AvcEncTest` and Codec2 `c2.android.avc.*` on riscv64 Cuttlefish, record results | 1 to 2 | RISE / Android 17 team | High |
| Functional | Upstream standalone CMake riscv64 support (utils, common, decoder, encoder, SVC, MVC, toolchain file) | 1 to 2 | Chip company with Ittiam/Google review | Medium |
| Functional | Add riscv64 block for `libmvcdec` or confirm plain build | 0.5 | Chip company | Low |
| Performance | Coordinate with RT-RK and upstream the six encoder RVV kernels | 4 to 6 | RT-RK with chip company reviewers | High |
| Performance | Decoder profiling and RVV kernels for hot paths | 8 to 12 | Chip company | High |
| Performance | Resolve or supersede Gerrit 3061805 (scalar asm, Zbb check, rebase) | 2 | RT-RK / chip company | Low |
| Performance | RVV runtime selection in function selectors (new arch value) | 2 to 3 | Chip company with Ittiam review | Medium |
| CI/CD | GitHub Actions riscv64 build and example comparison on RISE runners | 1 to 2 | Chip company | Medium |
| CI/CD | riscv64 Cuttlefish postsubmit for `AvcEncTest` | 2 to 4 | Google / RISE Android 17 phase 2 | Medium |
| Ecosystem | None required | 0 | n/a | Low |

## 15. References

- [AOSP platform/external/libavc](https://android.googlesource.com/platform/external/libavc)
- [Commit e8b0093, "Add riscv64 support"](https://android.googlesource.com/platform/external/libavc/+/e8b0093646bf740f7549fdb9fae938e37f1715be)
- [Gerrit 2171962, Add riscv64 support](https://android-review.googlesource.com/c/platform/external/libavc/+/2171962)
- [Gerrit 2325259, automerger copy](https://android-review.googlesource.com/c/platform/external/libavc/+/2325259)
- [Gerrit 2345475, automerger copy](https://android-review.googlesource.com/c/platform/external/libavc/+/2345475)
- [Commit 43629a6, svcenc riscv64 Soong fix](https://android.googlesource.com/platform/external/libavc/+/43629a63d8cb3b52195c032a662e62ac3bfd8aae)
- [Commit 375b9b7, SVC decoder support](https://android.googlesource.com/platform/external/libavc/+/375b9b7)
- [Gerrit 3061805, RISCV build support for Linux/Android](https://android-review.googlesource.com/c/platform/external/libavc/+/3061805)
- [Ittiam libavc upstream](https://github.com/ittiam-systems/libavc)
- [google/android-riscv64 issue #32, external/libavc: optimization](https://github.com/google/android-riscv64/issues/32)
- [RT-RK, Accelerating AOSP's libavc H.264 Encoder on RISC-V (RVV)](https://www.rt-rk.com/accelerating-libavc-on-risc-v-performance-gains-through-vector-intrinsics-rvv/)
- [RT-RK, RISC-V assembly optimization of libavc, libmpeg2, libxaac](https://www.rt-rk.com/?p=13692)
- [RISE Android 17 manifest (riseproject-dev/android_manifest)](https://github.com/riseproject-dev/android_manifest)
- [RISE, Android 17 available on RVA23 with RISE](https://riseproject.dev/2026/10/20/android-17-available-on-rva23-with-rise/)
- [RISE, announcing the RISE RISC-V runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE, RISC-V runners six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE, SpeexDSP optimizations for RISC-V (RP020)](https://riseproject.dev/2026/10/13/accelerating-audio-processing-with-speexdsp-optimizations-for-risc-v/)
- [RISE, SaltyRN (title only, not read)](https://riseproject.dev/2026/07/27/saltyrn-turning-neon-kernels-into-fast-verified-rvv-code-with-llms/)
- [RISE members](https://riseproject.dev/members/)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [PyPI libavc lookup (HTTP 404)](https://pypi.org/pypi/libavc/json)
- OSS-Fuzz `projects/libavc/project.yaml` (google/oss-fuzz repository; direct URL not recorded in the findings)
- [Bionic status report](project-reports/bionic.md)
- [googletest status report](project-reports/googletest.md)
- [LLVM status report](project-reports/llvm.md)