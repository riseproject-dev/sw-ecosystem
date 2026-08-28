---
title: FFmpeg
categories:
  - multimedia
  - android
---

# FFmpeg

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for FFmpeg<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[FFmpeg](https://ffmpeg.org/) is the dominant open-source multimedia framework, providing encoding, decoding, transcoding, muxing, demuxing, streaming, filtering, and playback for audio and video. It underpins a large fraction of the multimedia software stack across Linux distributions, embedded devices, streaming infrastructure, and consumer electronics.

The codebase is structured around several shared libraries: `libavcodec` (codec DSP), `libavutil` (utility and platform abstraction), `libswscale` (pixel format and color space conversion), `libswresample` (audio sample format conversion), and `libavfilter` (audio/video filters).

FFmpeg does not use GitHub Issues or Pull Requests. All development occurs through the [ffmpeg-devel mailing list](https://ffmpeg.org/mailman/listinfo/ffmpeg-devel), with patches tracked at [patchwork.ffmpeg.org](https://patchwork.ffmpeg.org/project/ffmpeg/list/?q=riscv). The canonical repository is hosted at [code.ffmpeg.org](https://code.ffmpeg.org) (Forgejo); the GitHub repository at [FFmpeg/FFmpeg](https://github.com/FFmpeg/FFmpeg) is a read-only mirror.

**License:** LGPL v2.1+ (default build), GPL v2+ when `--enable-gpl` components are included.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port began on 26 September 2022.

- **2022-09-26:** First commit (`746f1ff`, author Remi Denis-Courmont, committed by cyanreg/Lynne): "lavu/riscv: initial common header for assembler macros." Added `libavutil/riscv/asm.S` with 77 lines establishing float ABI macros and `func`/`const` assembly wrappers, loosely modeled on earlier ARM work by Mans Rullgard.
- **2022-09:** Build system fixes from Martin Storsjo (`riscv: Fix linking without RVV`, `riscv: Use the correct path for including asm.S`).
- **2022-10:** First codec DSP port: `RISC-V initial bswapdsp` from Remi Denis-Courmont.
- **2023:** Accelerating patch volume. CPU flag infrastructure (`hwprobe` syscall, `getauxval`, compile-time macros), `riscv: set fast half-precision conversion`, Zbb scalar bit-manipulation support, libswscale input and range conversion.
- **2024:** Highest volume period. July 2024 alone saw 64+ RISC-V patches. Coverage expanded to H.264 (weight, IDCT, qpel, loop filter, chroma MC), VP8, VP9, VC-1, RV34/RV40, AAC, AC3, FLAC, Opus, Vorbis, LPC, motion estimation, swscale. Zvbb (vector bit manipulation) and Zba (address generation) extensions added. VVC motion compensation landed from ISCAS contributors. H.264 qpel (series 12953) received LGTM from the maintainer but did not merge.
- **2025:** HEVC IDCT 32x32 (series 14985, 8 revisions), V-subset detection (series 15830), further H.264 DSP, lossless video encoder DSP, swresample RVV work begins.
- **2026:** HEVC `hevc_add_res` RVV merged (April 2026). libswscale range convert re-enable patch submitted (June 2026). Forgejo CI riscv64 QEMU patch submitted (March 2026, unmerged). Total patchwork entries: 219+ RISC-V patches tracked.

The port has been continuously upstreamed. There is no out-of-tree fork maintaining a RISC-V patch queue.

---

## 3. Upstream Support Tier

FFmpeg has no documented tier policy. The MAINTAINERS file uses two levels: a named maintainer (active, area-scoped commit rights) versus no named maintainer (best-effort). RISC-V is listed under "Platform/OS" with a named maintainer: **Remi Denis-Courmont**. This gives RISC-V higher standing than unmaintained platforms.

In practice, RISC-V is treated as a first-class target:

- Three dedicated FATE (FFmpeg's CI) build and test instances run at Remlab.net (Remi Denis-Courmont's infrastructure):
  - `rv64gc-debian-clang-19` -- RVA20 profile, Clang 19, 5532/5532 tests passing
  - `rv64gc-debian-gcc-14` -- RVA20 profile, GCC 14, 5532/5532 tests passing
  - `rv64gcvb-linux-gnu-gcc` -- RVA22+V profile (Vector + Bitmanip), GCC 14, 5531/5531 tests passing
- RISC-V patches receive review from the primary maintainer within days to weeks.
- The RISC-V architecture has a dedicated `libavcodec/riscv/`, `libavutil/riscv/`, `libswscale/riscv/`, and `libavfilter/riscv/` source tree.

There is no SLA, no formal tier commitment, and no corporate entity named as a sponsor of RISC-V work. The port depends primarily on one volunteer maintainer (Remi Denis-Courmont) for review and infrastructure, with secondary contributions from ISCAS-affiliated researchers.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 CPU Detection

**File:** `libavutil/riscv/cpu.c`, `cpu.h`

Detection uses three mechanisms in priority order:

1. `riscv_hwprobe` syscall (Linux 6.4+) -- most reliable, exposes fine-grained ISA extension bits
2. `getauxval(AT_HWCAP)` / `elf_aux_info` -- Linux auxiliary vector
3. Compile-time macros (`__riscv_vector`, `__riscv_zbb`, etc.) -- fallback for static builds

Flags exposed to the dispatch layer:

| Flag | Extension |
|------|-----------|
| `AV_CPU_FLAG_RVI` | Base integer ISA |
| `AV_CPU_FLAG_RVV_I32` | `zve32x` -- 32-bit integer vector |
| `AV_CPU_FLAG_RVV_F32` | `zve32f` -- 32-bit float vector |
| `AV_CPU_FLAG_RVV_I64` | `zve64x` -- 64-bit integer vector |
| `AV_CPU_FLAG_RVV_F64` | `zve64d` -- 64-bit float vector |
| `AV_CPU_FLAG_RVB_BASIC` | `zbb` -- basic scalar bit-manipulation |
| `AV_CPU_FLAG_RVB` | Full B extension |
| `AV_CPU_FLAG_RV_ZVBB` | `zvbb` -- vector bit-manipulation |
| `AV_CPU_FLAG_RV_MISALIGNED` | Fast misaligned memory access |

Helpers: `ff_get_rv_vlenb()` (returns vector register width in bytes), `ff_rv_vlen_least(N)` (returns true if VLEN >= N bits).

### 4.2 Assembly Infrastructure

**File:** `libavutil/riscv/asm.S`

Provides:

- `func`/`endfunc` -- function wrappers with `.text`, `.global`, `.hidden`, `.type` directives
- `const`/`endconst` -- read-only data sections
- `lpad` -- CFI landing pad (Zicfilp), expands to `lpad 0` when `__riscv_zicfilp` is defined, otherwise no-op; all RVV functions use this
- `NOHWF`/`HWF`/`HWD` -- soft/hard float ABI guards for functions that cannot use the FPU
- `parse_vtype`, `vtype_ivli`, `vtype_vli`, `vwtypei`, `vntypei` -- compile-time RVV `vtype` field computation macros

The `h26x/asm.S` file extends this with:

- `vsetvlstatic8`, `vsetvlstatic16`, `vsetvlstatic32` -- statically-sized `vsetvli` wrappers
- `POW2_JMP_TABLE`, `POW2_J` -- jump tables for power-of-2 block-width dispatch, supporting VLEN=128 and VLEN=256 paths in a single binary

### 4.3 SIMD Dispatch Mechanism

Pure C function pointer tables. Each codec has an `_init.c` file that calls `av_get_cpu_flags()` at initialization time and conditionally assigns RVV-accelerated function pointers. No JIT. No runtime code generation. The mechanism is identical to the x86 (`CPUEXT`) and ARM (`cpu_flags`) dispatch patterns.

### 4.4 Source Tree Inventory

**libavutil/riscv/ (16 files)**

Covers: CPU detection, assembly macro infrastructure, bswap (Zbb), byte-swap assembly (Zbb), float DSP (`zve32f`/`zve64d`: fmul, fmac, fmul_window, butterflies, scalarproduct), fixed-point DSP (`zve32x`), LLS linear solver (`zve64f`), pixelutils SAD (`zve32x`).

**libavcodec/riscv/ (103 files, 2 subdirs)**

Covers approximately 50 codec modules. Selected entries:

- H.264: chroma MC, addpx, DSP (loop filter, weight, biweight), IDCT (dequant, 4x4, 8x8), QPEL MC -- `zve32x`, `zve64x`, Zba
- HEVC: IDCT residual add, inter prediction (via h26x shared kernel) -- `zve32x`
- VVC (subdir `vvc/`): motion compensation (put/avg/w_avg/DMVR), SAD -- `zve32x`, Zba, Zbb
- H.264/H.265 shared (subdir `h26x/`): inter prediction with width-dispatch jump tables for VLEN 128/256
- VP8: full DSP + RVI scalar fallback -- `zve32x`
- VP9: intra prediction, MC (RVI and RVV paths) -- `zve32x`, Zba
- VC-1: inverse transforms, mspel, loop filter (RVI + RVV) -- `zve32x`
- RV34/RV40: chroma MC, luma MC -- `zve32x`
- AAC encoder DSP, AAC PS DSP, SBR DSP -- `zve32f`, Zba
- AC3: three-tier (Zbb scalar, `zve32x` vector, Zvbb combined) -- `zve32x`, `zve32f`, Zvbb
- ALAC, FLAC (15.6 KB), Opus, Vorbis, G722, TAK, LPC -- `zve32x`/`zve32f`
- Motion estimation compare (15.6 KB): SAD/SATD for multiple block sizes -- `zve32x`
- MPEG video, H.263, EXR, JPEG2000, HuffYUV, lossless audio/video, UTVideo, SVQ1 -- `zve32x`/`zve32f`
- StartCode scanner (RVI Zbb + RVV)
- VideoDSP: Zicbop prefetch instructions

ISA extensions used: `zve32x` (ubiquitous), `zve32f`, `zve64f`, `zve64d`, `zve64x`, Zba, Zbb, Zvbb, Zicfilp.

**libswscale/riscv/ (8 files)**

- RGB-to-YUV pixel format input conversion -- `zve32x`, Zba, Zbb
- Luma/chroma range conversion (JPEG to MPEG) -- `zve32x` [currently disabled in the scaler dispatch with `#if 0`, pending re-enable -- see section 11]
- RGB-to-RGB conversion (Zbb scalar + RVV)

**libavfilter/riscv/ (6 files)**

- Audio FIR filter (`ff_fcmul_add_rvv`) -- `zve64f`, Zba [ISCAS, 2023]
- Black frame detection -- `zve32x`

**libswresample/riscv/**

No RISC-V directory found. Audio sample format conversion has no RVV acceleration.

### 4.5 Notable Implementation Details

- **No stubs.** All `.S` files contain real, complete, non-trivial RVV assembly. None are placeholders.
- **VLEN portability.** The `h26x/asm.S` jump-table macros handle VLEN=128 and VLEN=256 in a single binary. Width-4 QPEL variants are explicitly disabled for VLEN=256 because no speedup was measurable on available hardware.
- **32-bit RISC-V support.** `float_dsp_rvv.S` and `h264dsp_rvv.S` include explicit `#if __riscv_xlen >= 64` / `#else` branches.
- **Multi-extension dispatch.** AC3, bswapdsp, and llvidencdsp implement separate scalar-Zbb, vector-`zve32x`, and combined-Zvbb code paths selected at runtime.
- **Security.** All assembly functions include `lpad 0` (Zicfilp CFI landing pad) via the `lpad` macro.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build System

FFmpeg uses a custom `./configure` + `make` build system. There is no CMakeLists.txt in the FFmpeg repository. Cross-compilation is the standard mechanism for riscv64 builds on non-RISC-V hosts.

### 5.2 Configure Options for riscv64

```
./configure \
  --enable-cross-compile \
  --cross-prefix=riscv64-linux-gnu- \
  --arch=riscv64 \
  --cpu=rv64gc \
  --target-os=linux \
  [--sysroot=PATH] \
  [--target-exec="qemu-riscv64 -L /sysroot"] \
  [--target-path=/tmp]
```

Key RISC-V-specific configure flags:

| Flag | Effect |
|------|--------|
| `--arch=riscv64` | Selects RISC-V 64-bit target |
| `--cpu=rv64gc` | Base ISA profile (I+M+A+F+D+C) |
| `--enable-rvv` / `--disable-rvv` | Explicitly enable or disable RVV assembly |
| `--target-exec=qemu-riscv64` | Run FATE tests via QEMU user-mode emulation |

RISC-V architecture extensions defined in `ARCH_EXT_LIST_RISCV`:

- `rv` -- base integer ISA (requires `riscv` arch)
- `rvv` -- RISC-V Vector extension (requires `rv`)
- `rv_zicbop` -- cache block operations (requires `riscv`)
- `rv_zvbb` -- vectorized bit manipulation (requires `rvv`)

`fast_64bit` is auto-enabled for `riscv64`, placing it alongside `aarch64`, `x86_64`, and `ppc64` in the fast-path list.

### 5.3 Reference Toolchain (BtbN/FFmpeg-Builds)

The BtbN/FFmpeg-Builds infrastructure is used by FFmpeg's official Forgejo CI for cross builds. The riscv64 configuration uses:

| Component | Version |
|-----------|---------|
| GCC | 15.2.0 |
| binutils | 2.46.0 |
| glibc | 2.36 |
| Linux headers | 6.1.159 |
| GDB | 16.3 |

Toolchain triple: `riscv64-ffbuild-linux-gnu`
ABI: `lp64d` (LP64 with hardware double-precision float)
Architecture string: `rv64gc`

Cross-compilation flags used in the reference build:
- `CFLAGS=-O2 -pipe -fPIC -DPIC -D_FORTIFY_SOURCE=2 -static-libgcc -static-libstdc++`
- `CC=riscv64-ffbuild-linux-gnu-gcc`

A `toolchain.cmake` and `cross.meson` for the same triple are present in the BtbN build infrastructure for use by FFmpeg's dependency libraries. FFmpeg itself uses only the custom configure script.

### 5.4 QEMU Testing

To run FATE tests under QEMU user-mode emulation:

```
--target-exec="qemu-riscv64 -L /path/to/sysroot" --target-path=/tmp
```

QEMU minimum version for RISC-V support: 2.12. For RVV (V extension) emulation, QEMU 7.0+ is required. [NEEDS VERIFICATION: exact minimum QEMU version for full V 1.0 emulation]

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Strong Coverage (comparable to or exceeding arm64)

| Area | riscv64 status |
|------|---------------|
| H.264 encode/decode DSP | Full -- weight, IDCT, QPEL, loop filter, chroma MC all present |
| H.265/HEVC inter prediction | Full -- h26x shared kernel with VLEN 128/256 dispatch |
| VP8 DSP | Full -- luma/chroma subpel, loop filter |
| VC-1 DSP | Full -- mspel, inv_trans, loop filter |
| AAC DSP | Full -- encoder DSP, PS DSP, SBR |
| AC3 DSP | Full -- three-tier (Zbb/RVV/Zvbb) |
| FLAC DSP | Full -- LPC filter, sub-frame residual |
| Float DSP (butterflies, scalar products) | Full |
| Motion estimation compare | Full |
| Pixel format conversion (swscale) | Partial -- RGB/YUV input present; range convert temporarily disabled |
| CPU capability detection | Full -- hwprobe, getauxval, compile-time |
| Lossless video/audio DSP | Full |

### 6.2 Partial Coverage

| Area | riscv64 gap vs arm64/amd64 |
|------|---------------------------|
| VVC/H.266 | MC and SAD present; deblocking, SAO, and IDCT absent |
| VP9 | Intra prediction and MC present; loop filter absent |
| H.265 IDCT (32x32) | RVV patch (series 14985) submitted, 8 revisions, not yet merged as of 2026-06-17 |
| H.264 QPEL | RVV patch (series 12953) has maintainer LGTM, not merged |
| libswscale range convert | Code exists in tree (`range_rvv.S`) but disabled with `#if 0` in the dispatch layer; re-enable patch (series 18247) pending |
| libswresample | No RISC-V directory; no RVV audio sample format conversion |

### 6.3 Missing Coverage

| Area | Status |
|------|--------|
| AV1 decode (native) | No `libavcodec/riscv/` AV1 files; AV1 DSP is entirely absent for RISC-V |
| DCA/DTS DSP | No RISC-V files; present on arm64 |
| ProRes DSP | No RISC-V files |
| libswresample (any) | No RISC-V directory at all |
| HW acceleration (VAAPI, etc.) | Architecture-gated; not applicable |

### 6.4 RISC-V-Exclusive Features

- Zicfilp CFI landing pad (`lpad`) in all assembly functions -- not present in x86 or ARM builds
- Zvbb (vector bit manipulation) three-tier dispatch for AC3, bswapdsp, huffyuvdsp
- `hwprobe` syscall-based CPU detection (Linux 6.4+), more fine-grained than x86 CPUID or ARM hwcap

---

## 7. CI/CD Infrastructure

### 7.1 In-Repository CI (Forgejo)

FFmpeg's in-repository CI consists of three Forgejo workflow files under `.forgejo/workflows/`. All three files were read in full. None contain any reference to "riscv", "riscv64", or "RISCV".

Runners present in the Forgejo CI:

| Runner | Architecture | Job |
|--------|-------------|-----|
| `linux-aarch64` | AArch64 | FATE tests (static 64-bit) |
| `linux-amd64` | x86-64 | FATE tests (static 32-bit, shared 64-bit) |
| `linux-amd64` + Windows container | x86-64 host, Windows cross | FATE full (wine) |

**There is no riscv64 runner in any Forgejo CI file.** No native riscv64 runner, no QEMU-emulated riscv64 build, and no cross-compilation CI targeting riscv64 exists in the in-repository pipeline.

No GitHub Actions (`.github/workflows/`), GitLab CI, Jenkinsfile, Cirrus CI, Travis CI, AppVeyor, or Azure Pipelines configuration was found.

### 7.2 External FATE Infrastructure

FATE (FFmpeg Automated Testing Environment) is a distributed external test farm. Three riscv64 instances run at Remlab.net, operated by Remi Denis-Courmont:

- `rv64gc-debian-clang-19`: 5532/5532 tests passing
- `rv64gc-debian-gcc-14`: 5532/5532 tests passing
- `rv64gcvb-linux-gnu-gcc`: 5531/5531 tests passing

These instances are not triggered by the Forgejo CI pipeline. They operate on a polling basis against the FFmpeg git repository. Regressions are reported asynchronously -- they do not block patch merges through the Forgejo pipeline.

**Consequence:** A riscv64 correctness regression introduced through a merged patch will not appear in the Forgejo CI results. It will only surface when the external FATE instance runs and reports back. This is a latency and reliability gap compared to amd64 and aarch64, which are covered in-pipeline.

### 7.3 Pending CI Improvement

Patch series 17194 (submitted 2026-03-06 by Timo Rothenpieler via catap) adds riscv64 (plus ppc64 and mips64) cross-compilation and QEMU-emulated FATE test runs to Forgejo CI. The patch modifies `.forgejo/workflows/test.yml` to add matrix entries using `ghcr.io/btbn/ffmpeg-builds/base-linuxriscv64:latest` with `target_exec: 'qemu-riscv64'`. No reviewer comments have been posted. The patch is unmerged as of 2026-06-17.

---

## 8. Distribution and Release Status

### 8.1 Upstream Binaries

FFmpeg upstream ships no prebuilt binaries. The GitHub release API returns an empty array. Releases are tracked via git tags (e.g., `n7.1`, `n8.0`) with no attached binary assets.

### 8.2 Linux Distribution Packages

| Distribution | Package | riscv64 status |
|-------------|---------|----------------|
| Debian trixie (testing) | `ffmpeg_7.1.4-0+deb13u1_riscv64.deb` | Confirmed live (HTTP 200, 2.0 MB, Last-Modified 2026-05-13) |
| Debian sid (unstable) | `ffmpeg_8.1.1-4_riscv64.deb` | Package exists on mirror but buildd reports "Needs-Build" / out-of-date as of 2026-06-17 |
| Debian bookworm (stable) | N/A | riscv64 not in the stable architecture matrix for ffmpeg |
| Ubuntu 24.04 Noble | `ffmpeg 7:6.1.1-3ubuntu5` | riscv64 available; core package and most related libraries present; `chromium-codecs-ffmpeg` omits riscv64 |
| Arch Linux RISC-V port | `ffmpeg-2:8.1.1-2-riscv64.pkg.tar.zst` | Confirmed (built 2026-05-20, ~14.5 MB); also `ffmpeg4.4`, `jellyfin-ffmpeg`, `qt6-multimedia-ffmpeg` |

### 8.3 PyPI

The `ffmpeg` PyPI package (version 1.4) is a pure-Python wrapper stub. Its sole artifact is a source tarball. No architecture-specific wheels exist. Not relevant to compiled FFmpeg availability.

---

## 9. Dependencies

### 9.1 Critical Codec Libraries

| Library | Role | riscv64 build | riscv64 SIMD | Notes |
|---------|------|--------------|-------------|-------|
| libx264 | H.264 encoding | Builds (generic C) | None -- no `riscv` directory; x86/aarch64/loongarch/mips/ppc only | Significant encode performance penalty vs x86/arm64 |
| libx265 | HEVC/H.265 encoding | Builds (generic C) | None -- no `riscv` directory | Severe performance penalty at HD+ resolutions |
| libdav1d | AV1 decoding (primary) | Builds with RVV | `src/riscv/64/` -- full RVV assembly for CDEF, intra prediction, inverse transforms, MC, palette (8-bit and 16-bit) | No blocking issues identified; comprehensive RVV coverage |
| libaom | AV1 reference (encode+decode) | Builds | `aom_dsp/riscv/mem_rvv.h` -- single memory utility file | Extremely limited SIMD; encoder performance severely degraded |
| libsvtav1 | AV1 encoding (production) | Builds (generic C) | None detected -- no riscv platform target | No riscv64 support tracked upstream |
| libvpx | VP8/VP9 encode+decode | Requires workaround | None -- riscv64 absent from configure ARCH_LIST | Must use `--target=generic-gnu`; no RVV optimizations |
| libopus | Opus audio | Builds (generic C) | None -- `celt/` has arm/mips/x86 subdirs only | No in-progress upstream work visible |
| libvorbis | Vorbis audio | Builds (generic C) | None | Pure C portable |
| libfdk-aac | AAC (Fraunhofer) | Builds (generic C) | None | License-restricted (non-free); pure C fallback |
| libmp3lame | MP3 encoding | Builds (generic C) | None | Acceptable for audio-only encoding |

### 9.2 Infrastructure Libraries

| Library | Role | riscv64 status | Notes |
|---------|------|----------------|-------|
| OpenSSL | HTTPS/TLS for streaming | Full -- AES (Zkn), AES-GCM (Zvkned), ChaCha20 (RVV), SHA-256/512 (RVV), SM3/SM4 (Zvksh/Zvksed), GHASH (Zvkg/Zvbc), Poly1305 | See `project-reports/openssl.md` |
| zlib | Container decompression | Builds (generic C) | No blocking issues; pure C portable |
| zlib-ng | Optional zlib replacement | Builds with RVV | Recurring detection/SIGILL bugs: Zbc detection broken (issue #1997, Nov 2025), `crc32_riscv64_zbc` undeclared at build (issue #2148), RVV SIGILL on older kernels (issue #1705, Mar 2024), CMake arch detection fallback broken (issue #941) |
| libbz2 / liblzma / libxml2 | Decompression, XML | Builds (generic C) | No blocking issues; pure C portable |
| libwebp | WebP encode/decode | Builds (generic C) | None -- `src/dsp/` has x86/ARM/MIPS subdirs; no riscv files |
| OpenBLAS | DNN inference (libtorch/libtensorflow backend) | Full -- `kernel/riscv64/` with complete BLAS L1/L2/L3, T-Head C910V/x280 vendor kernels | See `project-reports/openblas.md` |

---

## 10. Ecosystem Status

### 10.1 Governance and Funding

FFmpeg has no dedicated foundation. It is fiscally sponsored by [Software in the Public Interest (SPI)](https://www.spi-inc.org/). Infrastructure hosting is provided gratis by Telepoint (Bulgaria). The first governmental sponsor is Germany's Sovereign Tech Fund (announced May 2024, funding ongoing maintenance and modernization). Governance is meritocracy-based with no formal leadership since August 2015, when Michael Niedermayer resigned the leadership role. Decisions are made via consensus on the mailing list. Commit rights are area-scoped via the MAINTAINERS file.

### 10.2 Key RISC-V Contributors

| Contributor | Affiliation | Role |
|------------|------------|------|
| Remi Denis-Courmont | Independent (Nokia alumnus; no current corporate affiliation listed in MAINTAINERS) | Primary RISC-V maintainer; hundreds of patches; FATE infrastructure owner |
| flow gg | Likely ISCAS-affiliated [NEEDS VERIFICATION] | Major contributor: VP8, VP9, H.264, VC-1, RV34 |
| uk7b at foxmail.com | Likely ISCAS-affiliated [NEEDS VERIFICATION] | VVC/HEVC motion compensation |
| sunyuechi | ISCAS | Codec DSP |
| daichengrong | ISCAS | HEVC IDCT, swresample RVV |
| mkver (Andreas Rheinhardt) | Independent | Pixelutils RVV, misc optimizations |
| Martin Storsjo | Independent | Build system fixes |
| J. Dekker | Independent | H.264 QPEL RVV (series 12953) |
| Timo Rothenpieler (BtbN) | NVIDIA (listed in MAINTAINERS for hwcontext_cuda) | FATE infrastructure; Forgejo CI QEMU patch |
| Thomas Guilbert | Google/Chromium | FLAC DSP bug fix (series 17849) |
| Felix-Gong (yudong at nj.iscas.ac.cn) | ISCAS | swscale range convert re-enable (series 18247) |

### 10.3 RISE Project Connection

FFmpeg is not a member of the RISE project. No RISE blog posts mention FFmpeg. FFmpeg is not listed among the packages tracked by the RISE Python wheel builder. The GitHub organization `riseproject-dev` has no repositories referencing FFmpeg.

ISCAS (Institute of Software, Chinese Academy of Sciences) is a RISE General Member. ISCAS-affiliated researchers contribute RISC-V patches to FFmpeg, but this appears to be independent research activity, not a funded RISE engagement. SpacemiT is also a RISE General Member; the BananaPi F3 (SpacemiT X60 core) is the primary high-VLEN test platform for FFmpeg RISC-V benchmarks.

### 10.4 Test Hardware Used in the Ecosystem

All published FFmpeg RISC-V benchmarks use the following hardware:

| Platform | Vendor | Core | VLEN |
|---------|--------|------|------|
| K230 | Kendryte | T-Head C908 | 128 |
| BananaPi F3 | SpacemiT | X60 | 256 |
| T-Head C908 reference | T-Head | C908 | 128 |

No Qualcomm RISC-V hardware appears in any published benchmark or CI configuration.

---

## 11. Known Bugs and Active Issues

### 11.1 Correctness Bugs Fixed in Recent History

| Commit | Date | Description |
|--------|------|-------------|
| `1912c86` | 2024-11-17 | `sws/range_convert`: `ff_range_chr_from_jpeg_16_rvv` wrote wrong register (`v0` instead of `v4`) to chroma output buffer, silently corrupting Cb/Cr channels in JPEG range conversion |
| `acb38d3` | 2025-12-15 | `lavc/llvidencdsp`: `sub_left_predict` RVV assumed destination buffer was pre-zeroed; `checkasm` zeroed buffers masked the bug in testing; real-world usage produced silently corrupt output |
| `a0a89ef` | 2025-01-25 | `sad_rvv.S`: tail handling used `ta` (tail agnostic) policy after initializing accumulator to zero, allowing vector tail lanes to corrupt the accumulator; fixed by switching to `tu` (tail undisturbed) |
| `b88fc4e` | 2025-01-13 | `lavc/ac3dsp`: `HAVE_RVV` macro scope error causing incorrect build-time dispatching |
| `eb3b632` | 2025-12-22 | `lavc/h264qpel`: incorrect stack usage on RISC-V |
| `65018b3`, `435623c`, `56d933b` | 2025-12-22 | `lavu/float_dsp`: multiple double-precision RVV functions (`scalar_product_double`, `vector_dmul_scalar`, `vector_dmac_scalar`) returned incorrect values under the ILP32 ABI; `fmv.x.w` was truncating 64-bit double return values |
| `2dc864e` | 2024-12-10 | `lavc/rv40dsp`: RISC-V `chroma_mc` produced incorrect output |
| `e61fed8` | 2024-06-26 | `avutil/riscv/cpu`: typo in `__riscv_v_min_vlen` macro caused incorrect CPU detection |

### 11.2 Active/Pending Items (as of 2026-06-17)

**Series 18247 -- libswscale range convert re-enable**
Submitted 2026-06-16 by Felix-Gong (ISCAS). Re-enables 8 RVV range conversion functions (`lumRangeToJpeg8/16`, `lumRangeFromJpeg8/16`, `chrRangeToJpeg8/16`, `chrRangeFromJpeg8/16`) that were disabled with `#if 0` after an upstream API change. Fixes a sign-extension correctness bug: narrowing e32 to e16 via `vnsra.wi` wraps values above 32767 negative; fix clamps using `((1<<15)-1)<<14` before narrowing. Performance: ~4x average speedup over C on 1920-width benchmarks. Current blocking issue: LoongArch FATE CI check failing (under investigation). No reviewer comments yet.
[Source](https://patchwork.ffmpeg.org/project/ffmpeg/patch/178161678863.63.12449784828481018144@29965ddac10e/)

**Series 17849 -- FLAC DSP RVV loop underflow**
Submitted 2026-05-15 by Thomas Guilbert (Google/Chromium). Fixes a correctness bug in `libavcodec/riscv/flacdsp_rvv.S`: when `len <= pred_order`, the loop counter `a4` underflows after `sub a4, a4, a2`, producing incorrect output. Fix adds `blez a4, 2f` early-exit guard matching logic on other architectures. No reviewer comments; no blocking issues apparent.
[Source](https://patchwork.ffmpeg.org/project/ffmpeg/patch/177880721929.63.11774855087099623892@29965ddac10e/)

**Series 15830 -- V subset feature detection**
Submitted 2025-11-09 by Remi Denis-Courmont. Adds runtime detection of Zve32x, Zve32f, Zve64x, Zve64d for hardware that declares only a vector subset rather than the full V extension. Correctness-significant: without this, FFmpeg cannot use RVV on hardware implementing only a vector subset profile. Current status: no reviewer comments. Several unrelated CI failures (LoongArch, Windows MSVC).
[Source](https://patchwork.ffmpeg.org/project/ffmpeg/patch/176269360425.25.12445606914598710881@2cb04c0e5124/)

**Series 14985 -- HEVC IDCT 32x32 RVV (v8)**
Submitted 2025-07-15 by daichengrong (ISCAS), 8 revisions over April-July 2025. Performance on BananaPi F3: C reference 119,103 cycles, RVV 5,233 cycles (~22.8x speedup at VLEN=256). In September 2025, Remi Denis-Courmont indicated he forwarded the patch to `code.ffmpeg.org`; the patchwork state still shows "New" as of 2026-06-17, which may not accurately reflect merge status.
[Source](https://patchwork.ffmpeg.org/project/ffmpeg/patch/20250715092350.3807269-1-daichengrong@iscas.ac.cn/)

**Series 12953 -- H.264 QPEL RVV (v4)**
Submitted 2024-09-25 by J. Dekker, v4 of a series starting June 2024. Covers all 16 `mc00`-`mc33` variants for block sizes 4, 8, 16. Remi Denis-Courmont commented "LGTM!" on 2024-09-28. Despite the LGTM, the patch is unmerged as of 2026-06-17 -- nearly 21 months after approval. No v5 exists, suggesting the patch stalled after approval with no one completing the merge.

Performance (K230 VLEN=128):

| Function | C cycles | RVV cycles | Speedup |
|----------|----------|-----------|---------|
| put_h264_qpel_16_mc01_8 | 2774.3 | 339.1 | 8.2x |
| avg_h264_qpel_16_mc02_8 | 2987.3 | 348.4 | 8.6x |
| put_h264_qpel_4_mc01_8 | 987.4 | 79.8 | 12.4x |

[Source](https://patchwork.ffmpeg.org/project/ffmpeg/patch/20240925004611.479066-1-jdek@itanimul.li/)

**Series 17194 -- Forgejo CI riscv64 QEMU FATE tests**
Submitted 2026-03-06 by Timo Rothenpieler. Adds riscv64 cross-build and QEMU FATE tests to `.forgejo/workflows/test.yml`. No reviewer comments. Unmerged.
[Source](https://patchwork.ffmpeg.org/project/ffmpeg/patch/177282360045.25.11629665272580575579@29965ddac10e/)

### 11.3 Known Performance Issues

**H.264 horizontal intra loop filter regression (not a correctness bug).** Benchmarks for `h264_h_loop_filter_*` show negative speedups (0.24x-0.57x vs C). The RVV implementation processes full vector lanes while the C code frequently takes a no-op short-circuit path on the test inputs used by `checkasm`. Whether this constitutes a real-world regression is unclear; the test inputs are acknowledged to "almost always fall in the no-op case."

**H.264 QPEL width-4 at VLEN=256.** Width-4 QPEL variants are explicitly disabled for VLEN >= 256 because no speedup was measured. This is a documented gap in the QPEL series.

**H.264 weight functions at small block heights (historical).** Before commit `b88fc4e` (September 2024), `h264_weight8_8` on SpacemiT X60 ran at 0.49x C speed due to incorrect stride handling. Fixed.

---

## 12. Objections and Upstream Blockers

**Reviewer bandwidth is the primary bottleneck.** The H.264 QPEL series (12953) has been approved by the maintainer since September 2024 and remains unmerged 21 months later. The HEVC IDCT series (14985) required 8 revisions over four months before the maintainer forwarded it manually. The V-subset detection patch (15830) has received no reviewer comments at all. This is not a technical problem -- the code quality is high -- it is a process and personnel gap.

**Single maintainer dependency.** Remi Denis-Courmont owns the RISC-V platform designation, the FATE infrastructure (Remlab.net), and the majority of patch reviews. He operates independently with no corporate backing listed. His departure or reduced availability would have outsized impact on RISC-V progress in FFmpeg.

**No riscv64 in-pipeline CI.** Regressions in riscv64 correctness are caught by external FATE infrastructure only, not by the Forgejo pipeline. This means riscv64 defects can merge and remain undetected until the next FATE cycle. Series 17194 (Forgejo CI QEMU) has been pending since March 2026 with no review.

**H.264 QPEL unblocked but stalled.** Series 12953 has maintainer approval and no technical objections. It only needs a committer to push it. This is low-effort, high-value work sitting idle.

**AV1 decode has no RISC-V DSP.** FFmpeg's native AV1 decoder has no RISC-V-specific code at all. AV1 decode through libdav1d (which has comprehensive RVV) is the current workaround. This is not a blocker for practical use but represents a significant long-term gap.

**libsvtav1 and libvpx have no riscv64 SIMD support.** Both are widely used production codecs. Pure C fallback is functional but slow. No upstream work is tracked for either.

**libswresample has no RISC-V directory.** Series 17882 (RVV audio sample format conversion) is pending (submitted 2026-05-18, not yet merged). All audio resampling currently runs in scalar C.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The RISC-V port is functionally complete for the core codec set (H.264, HEVC, VP8, VP9, AAC, AC3, FLAC, Opus, Vorbis). Gaps are in AV1 native DSP, VVC completeness, libswresample, and the temporarily-disabled swscale range convert. Most gaps have patches in flight; the bottleneck is review latency, not technical difficulty.

### 13.2 Performance Optimization

Published `checkasm` micro-benchmarks on available RISC-V hardware (T-Head C908 VLEN=128, SpacemiT X60 VLEN=256):

| Function | Baseline C cycles | Best RVV cycles | Best speedup | Platform |
|----------|-----------------|----------------|-------------|---------|
| VVC put_pixels 128x128 luma 8-bit | 54,219 | 2,549 | 20.4x | SpacemiT X60 |
| VVC dmvr_hv_8_20x20 | 5,936 | 374 | 15.9x | SpacemiT X60 |
| VVC SAD 16x16 | 760 | 114 | 6.7x | SpacemiT X60 |
| HEVC put_pixels 64x64 8-bit | 12,893 | 778 | 16.6x | SpacemiT X60 |
| H.264 QPEL 16 mc01 8-bit | 2,774 | 280 | 9.9x | SpacemiT X60 |
| swscale JPEG chrRangeToJpeg 512 | 286 | 13 | 22x | SpacemiT X60 |
| swscale rgb24ToY 1920px | 346 | 60 | 5.8x | SpacemiT X60 |
| llvidencdsp sub_left_predict | 51,792 | 3,504 | 14.8x | SpacemiT X60 |
| H.264 weight8 8-bit | 499 | 72 | 6.9x | SpacemiT X60 |

No cross-architecture benchmarks (riscv64 vs amd64 vs arm64 end-to-end fps) are available in public sources.

There is no data on Qualcomm RISC-V hardware.

### 13.3 CI/CD Infrastructure

The single actionable gap with a patch already written is series 17194 (Forgejo CI riscv64 QEMU FATE). This is a two-file patch to a YAML workflow. Sponsoring review and merge of this patch would close the in-pipeline CI gap. Without it, riscv64 correctness coverage in the merge pipeline is zero.

### 13.4 Ecosystem Enablement

The key performance-critical dependencies for a production riscv64 FFmpeg deployment:

- **dav1d:** RVV-optimized, no action needed
- **OpenSSL:** Comprehensive RVV/Zvk support, no action needed
- **libx264/libx265:** No RISC-V SIMD; blocking for encode-heavy workloads
- **libvpx:** Not even in the configure ARCH_LIST; generic-gnu workaround required
- **libsvtav1:** No riscv64 platform target; pure C

For a chip company with transcoding workloads, libx264 and libx265 RISC-V SIMD are the highest-leverage dependency investments. Neither has any upstream RISC-V work in progress.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|---------|
| Functional | Merge H.264 QPEL RVV (series 12953, maintainer LGTM) | 0.5 (push + rebase check) | Committer needed | Critical |
| Functional | Merge FLAC DSP loop underflow fix (series 17849) | 0.5 (trivial 2-line fix) | Reviewer needed | Critical |
| Functional | Merge/complete swscale range convert re-enable (series 18247) | 1 (fix LoongArch CI, review) | Reviewer needed | High |
| Functional | Merge V-subset detection (series 15830) | 1 (review, correctness verify) | Reviewer needed | High |
| Functional | libswresample RVV (series 17882) | 2 (review, test) | Reviewer needed | High |
| Performance | HEVC IDCT 32x32 RVV -- confirm merge or re-submit (series 14985) | 1 (status check, rebase if needed) | ISCAS contributor + reviewer | High |
| Performance | AV1 native decoder RVV DSP | 20-40 (new work, many functions) | New contributor | Medium |
| Performance | VVC deblocking + SAO RVV | 8-12 (new work) | New contributor | Medium |
| Performance | libx264 RVV DSP | 20-40 (upstream separate project) | New contributor | High |
| Performance | libvpx riscv64 configure support + basic RVV | 8-16 (separate project) | New contributor | Medium |
| CI/CD | Merge Forgejo CI riscv64 QEMU FATE (series 17194) | 0.5 (review two YAML files) | Reviewer needed | Critical |
| Ecosystem | Benchmark riscv64 vs amd64/arm64 end-to-end fps (transcode) | 2-4 (hardware access required) | Internal team | High |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [FFmpeg project homepage](https://ffmpeg.org/)
- [FFmpeg/FFmpeg GitHub mirror](https://github.com/FFmpeg/FFmpeg)
- [FFmpeg patchwork -- RISC-V patches](https://patchwork.ffmpeg.org/project/ffmpeg/list/?q=riscv&archive=&state=*)
- [FATE RISC-V build targets](https://fate.ffmpeg.org/)
- [libavcodec/riscv source tree](https://github.com/FFmpeg/FFmpeg/tree/master/libavcodec/riscv)
- [libavutil/riscv source tree](https://github.com/FFmpeg/FFmpeg/tree/master/libavutil/riscv)
- [libswscale/riscv source tree](https://github.com/FFmpeg/FFmpeg/tree/master/libswscale/riscv)
- [libavfilter/riscv source tree](https://github.com/FFmpeg/FFmpeg/tree/master/libavfilter/riscv)
- [BtbN/FFmpeg-Builds riscv64 Dockerfile](https://github.com/btbn/ffmpeg-builds/tree/master/images/base-linuxriscv64)
- [Series 12953 -- H.264 QPEL RVV](https://patchwork.ffmpeg.org/project/ffmpeg/patch/20240925004611.479066-1-jdek@itanimul.li/)
- [Series 14985 -- HEVC IDCT 32x32 RVV](https://patchwork.ffmpeg.org/project/ffmpeg/patch/20250715092350.3807269-1-daichengrong@iscas.ac.cn/)
- [Series 15830 -- V subset feature detection](https://patchwork.ffmpeg.org/project/ffmpeg/patch/176269360425.25.12445606914598710881@2cb04c0e5124/)
- [Series 17194 -- Forgejo CI riscv64 QEMU FATE](https://patchwork.ffmpeg.org/project/ffmpeg/patch/177282360045.25.11629665272580575579@29965ddac10e/)
- [Series 17849 -- FLAC DSP loop underflow fix](https://patchwork.ffmpeg.org/project/ffmpeg/patch/177880721929.63.11774855087099623892@29965ddac10e/)
- [Series 18247 -- swscale RVV range convert re-enable](https://patchwork.ffmpeg.org/project/ffmpeg/patch/178161678863.63.12449784828481018144@29965ddac10e/)
- [FOSDEM 2026 talk: RISC-V Vector optimisations in FFmpeg by Remi Denis-Courmont](https://fosdem.org/2026/schedule/track/risc-v/)
- [Debian trixie ffmpeg riscv64 package](https://packages.debian.org/trixie/riscv64/ffmpeg)
- [Arch Linux RISC-V port mirror](https://riscv.mirror.pkgbuild.com/repo/extra/)
- [RISE Project homepage](https://riseproject.dev/)