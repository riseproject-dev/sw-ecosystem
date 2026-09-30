---
title: FFmpeg
parent: Project Reports
color: blue
dependencies:
  - name: libx264
    relation: runtime-dependency
    criticality: optional
  - name: libx265
    relation: runtime-dependency
    criticality: optional
  - name: dav1d
    relation: runtime-dependency
    criticality: optional
  - name: libaom
    relation: runtime-dependency
    criticality: optional
  - name: SVT-AV1
    relation: runtime-dependency
    criticality: optional
  - name: libvpx
    relation: runtime-dependency
    criticality: optional
  - name: libopus
    relation: runtime-dependency
    criticality: optional
  - name: libvorbis
    relation: runtime-dependency
    criticality: optional
  - name: libfdk-aac
    relation: runtime-dependency
    criticality: optional
  - name: libmp3lame
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: zlib-ng
    relation: runtime-dependency
    criticality: optional
  - name: bzip2
    relation: runtime-dependency
    criticality: optional
  - name: xz
    relation: runtime-dependency
    criticality: optional
  - name: libxml2
    relation: runtime-dependency
    criticality: optional
  - name: libwebp
    relation: runtime-dependency
    criticality: optional
  - name: OpenBLAS
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="ffmpeg" %}

# FFmpeg

**Author:** Ludovic HENRY <mail@ludovic.dev><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for FFmpeg<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[FFmpeg](https://ffmpeg.org/) is the dominant open-source multimedia framework, providing encoding, decoding, transcoding, muxing, demuxing, streaming, and filtering for audio and video. It underpins a large fraction of the multimedia software stack across Linux distributions, embedded devices, streaming infrastructure, and consumer electronics. The codebase is organized around shared libraries: `libavcodec` (codec DSP), `libavutil` (utility and platform abstraction), `libswscale` (pixel format and color space conversion), `libswresample` (audio sample format conversion), and `libavfilter` (audio/video filters).

**Development model.** FFmpeg does not use GitHub Issues or Pull Requests. The [FFmpeg/FFmpeg GitHub repository](https://github.com/FFmpeg/FFmpeg) is a read-only mirror of the project's real, self-hosted Forgejo forge at `code.ffmpeg.org`; it has `"has_issues": false` and zero Pull Requests of any kind, confirmed by repeated `search_issues`/`search_pull_requests` queries returning `total_count: 0` for `is:issue` and `is:pr` scoped to the whole repository, not just RISC-V topics. All patch development happens on the [ffmpeg-devel mailing list](https://ffmpeg.org/mailman/listinfo/ffmpeg-devel), tracked at [patchwork.ffmpeg.org](https://patchwork.ffmpeg.org/project/ffmpeg/list/?q=riscv). The GitHub mirror also carries zero GitHub Releases ("There aren't any releases here").

**License.** LGPL v2.1+ by default; GPL v2+ applies project-wide whenever any `--enable-gpl` component is built in. No proprietary/commercial licensing is offered. The "FFmpeg" name itself is a trademark of founder Fabrice Bellard.

**Fiscal sponsorship and funding.** FFmpeg has no independent legal foundation. It is fiscally sponsored by [Software in the Public Interest (SPI)](https://www.spi-inc.org/) ("Funding through SPI" on ffmpeg.org), with infrastructure hosting donated by Telepoint (Bulgaria). It also receives support from Germany's government-funded Sovereign Tech Fund (first disclosed governmental sponsor, announced May 2024). `FUNDING.json` in the repository contains only a blockchain/"drips" donation address; no named corporate sponsors appear there.

**Governance.** Community-run since Michael Niedermayer's August 2015 resignation from the BDFL role. Per `doc/community.texi`, the structure is:
- **General Assembly (GA):** all "active contributors" (20+ patches in the trailing 36 months, or GA-approved), decisions by ranked-choice voting.
- **Technical Committee (TC):** 5 members elected annually by the GA; resolves technical disputes (not a steering committee) via RFC or internal deliberation, 96-hour decision window, rulings binding for roughly 1 year unless overturned by GA majority.
- **Community Committee:** 5 members elected annually; handles interpersonal/Code-of-Conduct conflicts, can revoke commit access or issue temporary bans (indefinite bans need GA confirmation).

**Corporate involvement.** The `MAINTAINERS` file is organized by subsystem/architecture, not by employer, and names almost no corporate affiliations. The one explicit corporate credit found is Samsung, via Dawid Kozinski, for EVC codec support in `libavformat` (unrelated to RISC-V). RISC-V, LoongArch, Darwin, MIPS, and PowerPC maintainers are listed by name only, with no employer stated.

**Culture toward new ports.** No written policy affirms or restricts new architecture ports. New SIMD/architecture backends (RISC-V, LoongArch, etc.) go through the standard mailing-list/patchwork review process, with the TC intervening only when disputes arise; there is no separate "port acceptance" gate.

## 2. Port History and Upstreaming Timeline

The port's earliest indexed commit is **`d808070`** ("lavu/riscv: AV_READ_TIME cycle counter"), authored by **Remi Denis-Courmont** on **2022-09-12T18:53:17+03:00** (`search_commits` query `riscv repo:FFmpeg/FFmpeg`, sorted ascending). It was followed the same day by three more patches from the same author: CLZ detection (`ff14e373`), Zbb byte-swap operations (`df205704`), and intmath optimizations (`c177108a`), with a rebase fix (`a5ce44f3`) two days later. [NEEDS VERIFICATION: a prior pass of this research cited `746f1ff` on 2022-09-26 as "lavu/riscv: initial common header for assembler macros" as the first commit; the two dates/SHAs could not be reconciled from a single authoritative source this cycle and both are recorded here.]

`search_commits` against `repo:FFmpeg/FFmpeg` with query `riscv` returns **117 commits** on the default branch (`master`) as of this research. All are merged (there is no "open" commit state on this repository's git history). Selected milestones:

| Date | Commit | Description | Author / Org |
|---|---|---|---|
| 2022-09-12 | [`d8080705`](https://github.com/FFmpeg/FFmpeg/commit/d808070547a867a8f3f7b97fdff3574576213c07) | AV_READ_TIME cycle counter (foundational) | Remi Denis-Courmont |
| 2022-09-12 | [`ff14e373`](https://github.com/FFmpeg/FFmpeg/commit/ff14e3739393147b4596245ea511ec43a4ce6448) | configure: detect fast CLZ (Zbb) | Remi Denis-Courmont |
| 2024-06-25 | [`e61fed82`](https://github.com/FFmpeg/FFmpeg/commit/e61fed8280ccf2fb9e69c8d4e1849be2dcfebd89) | cpu: fix `__riscv_v_min_vlen` typo | J. Dekker |
| 2024-07-25 | [`1b2a925e`](https://github.com/FFmpeg/FFmpeg/commit/1b2a925e94c772c59a88c03c1654bddf6aff0ca2) | lavc: drop probing for F & D extensions (RVA20 baseline) | Remi Denis-Courmont |
| 2024-12-21 | [`8d27256a`](https://github.com/FFmpeg/FFmpeg/commit/8d27256a747fdd9eda41c480aa1eb7a065b88286) | vvcdec: remove vvc prefix for x86 and riscv (VVC RVV path) | Nuo Mi |
| 2025-11-09 | [`9b348aa6`](https://github.com/FFmpeg/FFmpeg/commit/9b348aa60b0f1b45a6cfbae5451bf1544fc6fd93) | riscv/cpu: add V (vector) subset feature detection (Zve32x/f/64x/d) | Remi Denis-Courmont |
| 2025-11-07 | [`e3b0d583`](https://github.com/FFmpeg/FFmpeg/commit/e3b0d58394484def810aca712d090be000ddeece) | Revert pixblockdsp RVV `get_pixels_unaligned` (stride-not-multiple-of-8 bug) | Remi Denis-Courmont |
| 2026-01-10 | [`bba42ce0`](https://github.com/FFmpeg/FFmpeg/commit/bba42ce036aa68da2f91e1c9f1ae19e8ab78f1e0), [`83477e2e`](https://github.com/FFmpeg/FFmpeg/commit/83477e2e1879d3e2195786f7f2d7b32e667f1624) | checkasm: riscv32 call checks; other float ABIs than double | Remi Denis-Courmont |
| 2026-06-14 | [`f704dd77`](https://github.com/FFmpeg/FFmpeg/commit/f704dd77b7d879707e6745424d129f6ec8f66035) | avcodec/riscv: add RVV-optimized `hevc_add_res` | deng.zewen (ZTE) |
| 2026-06-14 | [`b1d2190f`](https://github.com/FFmpeg/FFmpeg/commit/b1d2190f5f8430fce061da0cc33dcf8f1c3922d1) | avutil: include unistd.h for musl Linux (`__NR_riscv_hwprobe` fix) | WyattBlue |
| 2026-07-17 | [`8d394252`](https://github.com/FFmpeg/FFmpeg/commit/8d394252d80d045bd5ad473f25e85dc55556105d) | hevcdsp_init: decouple add_residual from RVB guard | deng.zewen (ZTE) |
| 2026-09-11 | [`c2bb5aa8`](https://github.com/FFmpeg/FFmpeg/commit/c2bb5aa8d85f1e2cdf5e72b942b94df932eb4f42) | avcodec/riscv: vector FDCT, ported from AArch64 NEON, ~3.29x speedup on SG2044 | yuanjia (Sanechips) |
| 2026-09-20 | [`7d472b77`](https://github.com/FFmpeg/FFmpeg/commit/7d472b77772d92e90193e5cefcad730946c544f9) | riscv/asm: move lx/sx XLEN macros to shared asm.S | daichengrong (ISCAS) |
| 2026-09-27 | [`b87602a6`](https://github.com/FFmpeg/FFmpeg/commit/b87602a63a52b0f7f968fd314f02be14acde16b7) | swscale/riscv: fix uyvy/yuyv to yuv422p on odd widths | Hongyan Wang (ISCAS) |

**Key contributors:** Remi Denis-Courmont (`remi@remlab.net`, independent, no current corporate affiliation listed in `MAINTAINERS`) architected the port and remains the named RISC-V maintainer. Recent 2025-2026 activity is increasingly institutional: **ISCAS** (Institute of Software, Chinese Academy of Sciences; daichengrong, Hongyan Wang, sunyuechi), **ZTE** (deng.zewen), and **Sanechips** (yuanjia), alongside core maintainers Andreas Rheinhardt, James Almer, Kacper Michajlow, Nuo Mi (VVC), and Michael Niedermayer (merging much of the 2026 activity).

The port is fully upstream with no out-of-tree patch queue for the mainline FFmpeg project itself. (A separate, non-upstream fork, [sifive/ffmpeg-rvv](https://github.com/sifive/ffmpeg-rvv), integrates RVV-optimized H.264 decode independently of `FFmpeg/FFmpeg`.)

## 3. Upstream Support Tier

FFmpeg has no documented architecture-support-tier policy. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exists anywhere in the repository (confirmed by a root-listing fetch; only `CONTRIBUTING.md`, `README.md`, `INSTALL.md`, `MAINTAINERS`, `FUNDING.json`, and license files are present). Platform/architecture support is handled ad hoc through `MAINTAINERS` entries and ordinary patch review.

`MAINTAINERS` lists RISC-V under Platform/OS with a named maintainer, **Remi Denis-Courmont**, and `.forgejo/CODEOWNERS` assigns all RISC-V source directories (`libavcodec/riscv/`, `libavfilter/riscv/`, `libavutil/riscv/`, `libswscale/riscv/`, `tests/checkasm/riscv/`) to `@Courmisch` (Denis-Courmont's handle), confirming continuous personal ownership of active riscv64 SIMD/asm development.

The decisive fact for tier purposes is that riscv64 is a **live, blocking-adjacent CI target**: FFmpeg's canonical CI (self-hosted Forgejo, `code.ffmpeg.org`) runs a full cross-build plus FATE test suite for riscv64 under QEMU emulation on every push to `master` and every pull request (see Section 7). This puts riscv64 in the same `run_fate_full` job matrix as win64, aarch64, ppc64, and mips64.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Named maintainer | (general) | (general) | Remi Denis-Courmont |
| In-pipeline CI (build+test) | Yes (`run_fate` job, native) | Yes (`run_fate_full`, native aarch64) | Yes (`run_fate_full`, QEMU-emulated on aarch64 host) |
| Official upstream binaries | None | None | None |
| Distro packaging | Yes | Yes | Yes (Debian trixie, Ubuntu, Arch RISC-V) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

FFmpeg has no top-level `arch/` dispatcher tree; architecture code lives per-library in `<lib>/riscv/` subdirectories. There is **no JIT backend anywhere** in the codebase (confirmed by an empty recursive search for `jit` across all `riscv/` directories). All riscv64 SIMD code is **100% hand-written GNU-assembler `.S`**, not C intrinsics: a search for `vfloat32m1_t` (the RVV C-intrinsics type) across the repository returned zero hits.

### 4.1 CPU Detection

**File:** `libavutil/riscv/cpu.c` (153 lines), `cpu.h`. Detection uses, in priority order: the Linux `riscv_hwprobe()` syscall (Linux 6.4+, most reliable/fine-grained), `getauxval(AT_HWCAP)`/`elf_aux_info()` (with a FreeBSD/OpenBSD path added by commit `f3eca3f3`, and a musl-Linux `unistd.h` fix added by `b1d2190f`, merged 2026-06-14), and compile-time macros as a fallback.

| Flag | Extension |
|---|---|
| `AV_CPU_FLAG_RVI` | Base integer ISA |
| `AV_CPU_FLAG_RVV_I32/F32` | Zve32x / Zve32f |
| `AV_CPU_FLAG_RVV_I64/F64` | Zve64x / Zve64d |
| `AV_CPU_FLAG_RVB_BASIC` / `AV_CPU_FLAG_RVB` | Zbb alone / full Zba+Zbb+Zbs |
| `AV_CPU_FLAG_RV_ZVBB` | Vector crypto bit-manipulation |
| `AV_CPU_FLAG_RV_MISALIGNED` | Fast unaligned-access hint |

Commit [`9b348aa6`](https://github.com/FFmpeg/FFmpeg/commit/9b348aa60b0f1b45a6cfbae5451bf1544fc6fd93) (merged 2025-11-09/11) added V-subset feature detection (Zve32x/Zve32f/Zve64x/Zve64d), correctness-significant for hardware that declares only a vector subset rather than the full V extension.

### 4.2 Assembly Infrastructure and Dispatch

`libavutil/riscv/asm.S` provides `func`/`endfunc` wrappers, `const`/`endconst` sections, the `lpad` CFI landing pad (Zicfilp, no-op when unsupported), soft/hard-float ABI guards, and RVV `vtype` computation macros. `libavcodec/riscv/h26x/asm.S` extends this with statically-sized `vsetvli` wrappers and jump tables supporting both VLEN=128 and VLEN=256 in a single binary. Dispatch is pure C function-pointer tables populated at init time from `av_get_cpu_flags()`, identical in mechanism to the x86 and ARM dispatch patterns.

### 4.3 Source Tree Inventory and Scale

A direct clone-and-count (commit `a7b0af0`, cross-checked against a later fetch of `5a54fcf7`, 2026-09-30) found **158 riscv-related files totaling 17,447 lines** across `libavcodec`, `libavutil`, `libswscale`, `libavfilter`, and the checkasm test harness. Per-directory breakdown:

| Directory | Files | Status |
|---|---|---|
| `libavutil/riscv/` | 16 | Complete: cpu detection, bswap, fixed/float DSP, intmath, LLS, pixelutils |
| `libavcodec/riscv/` | ~104 (43 C dispatch + 61 `.S` kernels) | Complete for ~50 codec modules: H.264, HEVC, VP7/8/9, VC1, RV3/4, AAC, AC3, FLAC, ALAC, Vorbis, Opus, JPEG2000, TAK, G722, SVQ1, HuffYUV, UtVideo, motion estimation, IDCT, and more |
| `libavcodec/riscv/vvc/` | dsp_init.c, mc_rvv.S, sad_rvv.S | Partial: motion compensation + SAD only |
| `libavcodec/riscv/h26x/` | shared H.264/HEVC helpers | Complete infrastructure |
| `libswscale/riscv/` | 8 | Complete for covered paths: RGB/YUV input, range conversion, rgb2rgb |
| `libavfilter/riscv/` | 6 | Partial: only `af_afir` (audio FIR) and `vf_blackdetect` hand-tuned |
| `libavdevice/riscv/`, `libavformat/riscv/` | 1-line `cpu_common.c` stub each | Legitimate stub, no SIMD-eligible hot loops in these libraries |
| `tests/checkasm/ext/src/riscv/` | 3 | Complete: RVV ABI/clobber checking |

A comparison against other architectures in `libavcodec` shows riscv64 with **more files than aarch64**:

| Arch | Dispatch (.c) | Hand-written asm | Total | Asm language |
|---|---|---|---|---|
| x86 | 82 | 117 (.asm) | 199 | NASM/YASM (MMX/SSE/AVX/AVX2/AVX512) |
| aarch64 | 34 | 45 (.S) | 79 | GAS (NEON, SME2) |
| riscv64 | 43 | 61 (.S) | 104 | GAS (RVV, RVB, RVI) |

A stub/TODO/FIXME check found **zero `FIXME`** in any `riscv/` path, and only two trivial `TODO` comments (a micro-optimization note in `videodsp_init.c` and a code-factoring note in `float_dsp_rvv.S`), neither indicating missing functionality. No `#if 0`-disabled or otherwise dark Makefile entries were found. This is not a stub port.

### 4.4 ISA Extension Usage

Extracted from every `func name, <ext-list>` declaration across the `.S` files:

| Extension | Occurrences | Purpose |
|---|---|---|
| Zve32x | 163 | Integer vector (32-bit elements), baseline for nearly all RVV kernels |
| Zba | 94 | Address-generation bit-manipulation |
| Zve32f | 28 | Single-precision float vector |
| Zve64x | 24 | 64-bit-element integer vector |
| B (Zba+Zbb+Zbs) | 17 | Full bit-manipulation |
| Zve64d | 7 | Double-precision float vector |
| Zbb | 7 | Scalar basic bit-manipulation |
| Zvbb | 3 | Vector crypto bit-manipulation |
| Zve64f | 2 | 64-bit float vector variant |
| Zicbop | 1 | Cache-block prefetch |

All assembly functions include the `lpad 0` Zicfilp CFI landing pad, a RISC-V-exclusive hardening feature not present in the x86 or ARM builds. The largest kernels include `h264idct_rvv.S` (797 lines), `h264_intrapred_rvv.S` (679), `flacdsp_rvv.S` (629), `vp8dsp_rvv.S` (558), and `me_cmp_rvv.S` (544, motion estimation SAD/SATD).

## 5. Build System, Cross-Compilation, and Toolchain

FFmpeg uses its own hand-written `./configure` (8,843-line shell script) plus GNU Make. There is no CMakeLists.txt, no `BUILDING.md`, and no `docs/cross-compilation.md` (all confirmed absent by direct fetch). `INSTALL.md` gives the canonical build: `./configure`, then `make` (GNU Make 3.81+ required), then `make install`.

### 5.1 riscv64 configure integration

- Arch detection: `riscv*)` maps to `arch="riscv"`; 64-bitness is detected via `check_64bit riscv32 riscv64`. `riscv64` is included in the `fast_64bit_if_any` list.
- `ARCH_EXT_LIST_RISCV = "rv rvv rv_zicbop rv_zvbb"`, with dependencies `rv_deps=riscv`, `rvv_deps=rv`, `rv_zicbop_deps=riscv`, `rv_zvbb_deps=rvv`.
- Each extension is feature-probed by actually trying to assemble its instructions, not by checking a compiler version number: `rv` probes `.option arch, +zbb` / `rev8`; `rvv` probes `.option arch, +v` / `vsetivli`; `rv_zicbop` probes `.option arch, +zicbop` / `prefetch.r`; `rv_zvbb` probes `.option arch, +zvbb` / `vclz.v`. `__riscv_zbb` and `__riscv_zfhmin` are also probed via `test_cpp_condition`.
- The only riscv64-specific flag documented in `--help` is `--disable-rvv` (disable RISC-V Vector optimizations); `--disable-rv`, `--disable-rv-zicbop`, `--disable-rv-zvbb` exist via the generic `ARCH_EXT_LIST` mechanism but are undocumented in `--help`.
- **No pinned minimum GCC/Clang version exists anywhere in the build system for riscv64.** Feature probing silently disables anything the toolchain cannot assemble. In practice, usable RVV 1.0 support requires roughly GCC >= 13/14 or Clang >= 17, but this is not a number FFmpeg's own docs or configure script state.

### 5.2 Cross-compilation command pattern

```
./configure \
  --arch=riscv64 \
  --target-os=linux \
  --cross-prefix=riscv64-linux-gnu- \
  --enable-cross-compile \
  --sysroot=/path/to/riscv64-sysroot \
  --pkg-config=pkg-config
make -j$(nproc)
```
Configure errors with `"Must specify target arch (--arch) and OS (--target-os) when cross-compiling"` if `--cross-prefix` is set without both.

### 5.3 Reference toolchain (BtbN/FFmpeg-Builds, used by Forgejo CI)

The Forgejo CI riscv64 job pulls `ghcr.io/btbn/ffmpeg-builds/base-linuxriscv64:latest-arm`, the BtbN cross-build image set. A prior detailed toolchain-version pull for this image set (GCC 15.2.0, binutils 2.46.0, glibc 2.36, Linux headers 6.1.159, triple `riscv64-ffbuild-linux-gnu`, ABI `lp64d`) was not independently re-confirmed this cycle. [NEEDS VERIFICATION]

### 5.4 QEMU testing

FATE's generic cross-testing mechanism (`doc/fate.texi`) is `--target-exec`, documented as a way to "run FATE wrapped in valgrind, qemu-user or wine or on remote targets through ssh." For riscv64 this is used as `--target-exec="qemu-riscv64 -L /path/to/sysroot"` locally, and as `target_exec: 'qemu-riscv64'` inside the Forgejo CI container (see Section 7). Minimum QEMU version for RISC-V support is commonly cited as 2.12, with 7.0+ needed for V-extension emulation; neither figure is stated in FFmpeg's own documentation. [NEEDS VERIFICATION]

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Strong coverage (comparable to or exceeding arm64)

H.264 encode/decode DSP (weight, IDCT, QPEL, loop filter, chroma MC), H.265/HEVC inter prediction and residual add, VP8 DSP, VC-1 DSP, AAC DSP, AC3 DSP (three-tier: Zbb/RVV/Zvbb), FLAC DSP, float DSP, motion-estimation compare, and CPU capability detection are all full, hand-tuned implementations.

### 6.2 Partial coverage

| Area | Gap |
|---|---|
| VVC/H.266 | riscv64 has motion compensation and SAD only (`libavcodec/riscv/vvc/`). By comparison x86 also covers ALF, SAO, DMVR, dequant, and `add_res`; aarch64 covers ALF, SAD, inter, and an SME2 path. HEVC `add_res` RVV was added separately for HEVC ([`f704dd77`](https://github.com/FFmpeg/FFmpeg/commit/f704dd77b7d879707e6745424d129f6ec8f66035), ZTE, merged 2026-06-14), but VVC itself remains the newest, least-complete codec port. |
| VP9 | Intra prediction and MC present; loop filter absent. |
| libswscale | RVV kernels exist for RGB/YUV input and rgb2rgb conversion; range conversion (JPEG<->MPEG) code exists in-tree but was disabled with `#if 0` pending a re-enable patch (series 18247), status unresolved as of the justification for this report's grade. |
| libswresample | No RISC-V directory exists at all; audio sample-format conversion runs entirely in scalar C. |

### 6.3 Missing coverage

AV1 native decode has **no** `libavcodec/riscv/` files (AV1 DSP is entirely absent for RISC-V; practical AV1 decode relies on libdav1d's own RVV, see Section 9). DCA/DTS DSP and ProRes DSP have no riscv64 files either (present on aarch64). `libswresample` has no riscv64 path of any kind. Everywhere a riscv64 file is absent, FFmpeg falls back to the portable C reference path and still builds and runs correctly; this is the same degrade-gracefully pattern every architecture exhibits for codecs it has not yet vectorized.

### 6.4 RISC-V-exclusive features

Zicfilp CFI landing pads (`lpad`) in every assembly function; the Zvbb three-tier dispatch for AC3/bswapdsp/huffyuvdsp; and `hwprobe`-syscall-based CPU detection, which is more fine-grained than x86 CPUID or ARM hwcap.

## 7. CI/CD Infrastructure

FFmpeg's GitHub mirror carries **no `.github/workflows` directory at all** (confirmed by `git ls-tree -r origin/master --name-only | grep -i "^\.github"` returning zero results against HEAD `5a54fcf7`, dated 2026-09-30). Consequently **zero GitHub Actions workflows run on this repository, for any architecture**. There is also no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` anywhere in the tree.

The project's real, canonical CI lives at `.forgejo/workflows/test.yml` on FFmpeg's self-hosted Forgejo instance (`code.ffmpeg.org`); GitHub mirrors the file but does not execute it. This file **does** define a riscv64 job, in the `run_fate_full` job's matrix:

```yaml
- name: 'Qemu, Linux, riscv64'
  image: 'ghcr.io/btbn/ffmpeg-builds/base-linuxriscv64:latest-arm'
  target_exec: 'qemu-riscv64'
  runner: 'linux-aarch64-big'
```

**Trigger:** `on: push` (branches: `master`) and `on: pull_request` - the riscv64 job runs on every push to master and every pull request. **Runner model:** `runs-on: linux-aarch64-big` is an aarch64 host, not native riscv64 silicon; the job pulls a riscv64-cross-compiled container image and executes the resulting binaries via **QEMU user-mode emulation** (`target_exec: 'qemu-riscv64'`). **What it does:** cross-compiles FFmpeg for riscv64 with `--enable-memory-poisoning --assert-level=2 --enable-hardcoded-tables --target-exec=qemu-riscv64`, then runs the full FATE test suite under emulation (`make -C build fate fate-build`). This is build **and** test, not build-only, satisfying both the build=yes and test=yes conditions behind this report's readiness grade.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-pipeline CI location | Forgejo, native runner | Forgejo, native `linux-aarch64` runner (also hosts the riscv64 job) | Forgejo, QEMU-emulated on `linux-aarch64-big` |
| Trigger | push/PR | push/PR | push/PR |
| Build + FATE test | Yes | Yes | Yes |
| GitHub Actions | None (repo has no `.github/workflows`) | None | None |

**Corrections to prior claims about this pipeline.** An earlier pass of this research, and a patch series (patchwork #17194, submitted 2026-03-06 by Timo Rothenpieler, adding riscv64/ppc64/mips64 QEMU FATE jobs to `test.yml`) reported this capability as pending/unmerged as of 2026-06-17. A direct read of the live file as of 2026-09-30 shows the riscv64 matrix entry is now present and active in `run_fate_full` alongside ppc64 and mips64 entries using the identical pattern, indicating this work has since landed.

**External FATE farm.** A prior report cited three dedicated external FATE instances operated by Remi Denis-Courmont at Remlab.net (`rv64gc-debian-clang-19`, `rv64gc-debian-gcc-14`, `rv64gcvb-linux-gnu-gcc`, each reporting full pass counts). This was not re-confirmed against `fate.ffmpeg.org` in this research cycle. [NEEDS VERIFICATION]

`.forgejo/CODEOWNERS` assigns all riscv64 source directories to `@Courmisch`, consistent with single-maintainer ownership of the riscv64 CI-exercised code paths (see Section 3 and Section 12).

## 8. Distribution and Release Status

FFmpeg upstream ships **no prebuilt binaries for any architecture**. The GitHub Releases page for `FFmpeg/FFmpeg` returns "There aren't any releases here" - zero releases, zero assets, confirmed by direct fetch. Releases are tracked via git tags (e.g., `n7.1`, `n8.0`) with no attached binary assets. This means the riscv64 artifact a user consumes must come from downstream distro packaging, not from FFmpeg itself.

| Distribution | Package | riscv64 status |
|---|---|---|
| Debian trixie (testing) | `ffmpeg_7.1.4-0+deb13u1_riscv64.deb` | Confirmed live |
| Ubuntu 26.04 "resolute" | `ffmpeg 7:8.0.1-3ubuntu2` (universe) | Confirmed live: `amd64 arm64 armhf i386 ppc64el riscv64 s390x`; dependent packages `ffmpegthumbnailer`, `ffmpegthumbs`, `libffmpeg-ocaml(-dev)`, `baresip-ffmpeg`, `cmus-plugin-ffmpeg`, `ffmpegfs`, `gmerlin-encoders-ffmpeg`, `kodi-inputstream-ffmpegdirect` all also ship riscv64 builds |
| Ubuntu 24.04 "noble" | `ffmpeg 7:6.1.1-3ubuntu5` | riscv64 available for the core package and most related libraries; `chromium-codecs-ffmpeg` omits riscv64 |
| Arch Linux RISC-V (archriscv) | `ffmpeg-2:8.0.1-5-riscv64.pkg.tar.zst` (+ `.sig`), with `1:7.1.3p1-4-riscv64` and `6.10.1-1-riscv64` also live, plus a separate `ffmpeg4.4-4.4.6-3-riscv64` branch package | Confirmed via direct `extra.db` fetch; each artifact is signed. The archriscv build-status/blocked tracker has no `ffmpeg` entry, consistent with the package building successfully. **Discrepancy:** an earlier pass of this research reported the current Arch riscv64 package as `ffmpeg-2:8.1.1-2-riscv64.pkg.tar.zst` (built 2026-05-20); the most recent direct repo-database fetch instead lists `8.0.1-5` as current. Both figures are recorded here; the discrepancy was not resolved against a third source. |

**PyPI.** The PyPI package literally named `ffmpeg` is an unrelated placeholder/decoy (one source sdist, `ffmpeg-1.4.tar.gz`, across its whole release history); it is not the real FFmpeg project and carries no riscv64 signal either way.

**What a user must do to get a working binary on riscv64:** install from a distribution that packages it (Debian trixie, Ubuntu Noble/resolute, Arch Linux RISC-V) or build from source with `./configure && make` as described in Section 5. There is no upstream-published binary path.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes / blocking issues |
|---|---|---|---|---|---|
| libx264 | H.264 encoder (runtime, optional) | Builds clean as scalar C; RVV asm reported **in progress** | No dedicated riscv64 CI; buildd-only | Debian/Ubuntu ports build from source | LLVM SLP-vectorizer cost-model bugs hurt RVV codegen ([llvm#176218](https://github.com/llvm/llvm-project/issues/176218), [#175826](https://github.com/llvm/llvm-project/issues/175826)) - a compiler, not x264, issue |
| libx265 | H.265/HEVC encoder (runtime, optional) | Debian sid builds include RVV DCT optimizations (PR#40) | Buildd `rv-manda-04` only | Debian sid 4.1 (+b2 rebuild); Ubuntu Noble 3.5 predates RVV work | [BB#1005](https://bitbucket.org/multicoreware/x265_git/issues/1005) stale open CMake-unknown-processor issue; [PR#895](https://github.com/Multicorewareinc/x265/pull/895) RVV DCT32x32 has unresolved stack/buffer-overflow review comments |
| dav1d | AV1 decoder, primary path (runtime, optional) | Builds from source, `src/riscv/64/` full RVV coverage (CDEF, intra prediction, inverse transforms, MC, palette) | CI covers riscv64; distro buildd only | Ubuntu Noble native .deb | [Issue #463](https://code.videolan.org/videolan/dav1d/-/issues/463) static cross-compile linking fails (open, workaround exists) |
| libaom | AV1 reference encoder/decoder (runtime, optional) | Debian sid RTCD=1 build; cross-compile path uses RTCD=0 | Gerrit CI only (Verified+1) | Debian sid `libaom3` .deb | [Gerrit 208401](https://aomedia-review.googlesource.com/c/aom/+/208401) correctness bug in RVV highbd convolve for w==2/h==2 blocks, open, stalled, affects native (RTCD=1) builds only |
| SVT-AV1 | AV1 encoder, production path (runtime, optional) | C-only build on riscv64, no SIMD kernels yet | Debian buildd continuous since 2022 | Ubuntu Noble `libsvtav1enc1d1`; Arch package is x86_64-only | [#2214](https://gitlab.com/AOMediaCodec/SVT-AV1/-/work_items/2214) bundled thirdparty code blocks clean riscv64 packaging (open) |
| libvpx | VP8/VP9 codec (runtime, optional) | Scalar C fallback via `--target=generic-gnu`; riscv64 absent from configure ARCH_LIST | N/A | apt `libvpx-dev` riscv64; AUR Android riscv64 target | No riscv64 issues/PRs found upstream |
| libopus | Opus audio codec (runtime, optional) | Generic-C build | Debian buildd `rv-osuosl-05`, Installed | Debian sid & Ubuntu Noble official riscv64 | [#368](https://github.com/xiph/opus/issues/368): Samsung R&D reportedly has a non-public RISC-V RVV branch, no merged PR; [#392](https://github.com/xiph/opus/pull/392) RTCD refactor draft blocked on C90/C99 |
| libvorbis | Vorbis audio codec (runtime, optional) | Builds with standard toolchain | Debian buildd `rv-osuosl-01`, Installed | Debian sid & Ubuntu Noble official riscv64 | [#124](https://github.com/xiph/vorbis/issues/124) SIGFPE div-by-zero on malformed input (open, not riscv64-specific); [PR#127](https://github.com/xiph/vorbis/pull/127) x86 SSE2 leak into RISC-V cross probes (open) |
| libfdk-aac | AAC encoder/decoder (runtime, optional) | Generic C fallback build | No dedicated riscv64 validation confirmed | Debian/Ubuntu riscv64 packages (compiled, not hardware-validated) | Zero riscv64 issues/PRs in `mstorsjo/fdk-aac` |
| libmp3lame | MP3 encoder (runtime, optional) | Generic C path | Debian buildd `rv-osuosl-02`, Installed (sid); absent from bookworm stable | Debian sid/trixie + Ubuntu Noble riscv64 .deb | None riscv64-specific; upstream has had no releases since 2017 |
| OpenSSL | TLS/crypto for network I/O (runtime, optional) | First-class target: AES (Zkn), AES-GCM (Zvkned), ChaCha20 (RVV), SHA-256/512 (RVV), SM3/SM4 (Zvksh/Zvksed), GHASH (Zvkg/Zvbc), Poly1305 | Debian buildd `rv-manda-01`, Installed | Debian sid, Ubuntu Noble, Arch RISC-V (3.6.3 + legacy 1.1) | **Security-relevant:** AES T-table fallback leaks key material via a cache side-channel when Zkn/Zvkned are absent on the target hardware; fixes [PR#31080](https://github.com/openssl/openssl/pull/31080)/[#31082](https://github.com/openssl/openssl/pull/31082) are still open. [#22166](https://github.com/openssl/openssl/issues/22166) SSL test flakiness at high HARNESS_JOBS on riscv64, open since 2023 |
| zlib | DEFLATE compression (runtime, optional) | Pure C, no external deps, builds trivially | Debian buildd `rv-manda-03`, Installed | Debian sid, Ubuntu Noble, Arch RISC-V, Alpine edge | [PR#1099](https://github.com/madler/zlib/pull/1099) RVV Adler32 optimization, open since 2025-10-28 with zero maintainer response, matching the maintainer's historic pattern on SIMD-arch PRs |
| zlib-ng | DEFLATE compression, SIMD fork (runtime, optional) | Builds from source; has an RVV `CHUNK_MEMSET` implementation | No mainstream CI binary except Alpine edge | Alpine edge only (2.3.3-r0); no riscv64 wheel on PyPI, no GitHub release binaries | Open correctness issue [#1670](https://github.com/zlib-ng/zlib-ng/issues/1670): `CHUNK_MEMSET_RVV_IMPL` does an unaligned pointer cast without an `UNALIGNED_OK` gate, a risk on strict-alignment riscv64 targets. Other reported issues from the same project: detection breakage ([#1997](https://github.com/zlib-ng/zlib-ng/issues/1997)), undeclared `crc32_riscv64_zbc` at build ([#2148](https://github.com/zlib-ng/zlib-ng/issues/2148)), RVV SIGILL on older kernels ([#1705](https://github.com/zlib-ng/zlib-ng/issues/1705)), broken CMake arch-detection fallback ([#941](https://github.com/zlib-ng/zlib-ng/issues/941)) |
| bzip2 | BZIP2 compression (runtime, optional) | Builds cleanly, no arch patches | N/A (no dedicated CI) | Ubuntu Noble all-arch riscv64 .deb | Only non-riscv64-specific perf/UB issues; upstream repo is archived on GitLab |
| xz (liblzma) | LZMA compression (runtime, optional) | Source-only; `TUKLIB_FAST_UNALIGNED_ACCESS` auto-detected via `__riscv_misaligned_fast` | N/A | Ubuntu Noble (ports), Arch RISC-V (signed pkg) | No open riscv64 correctness issues; historical build-script issues closed ([#146](https://github.com/tukaani-project/xz/issues/146), [#180](https://github.com/tukaani-project/xz/issues/180)) |
| libxml2 | XML parsing for demuxer/metadata (runtime, optional) | Builds without arch-specific handling | N/A | Arch RISC-V core repo (2.15.3-1); `lxml` PyPI wheels exist for riscv64 | Open [#971](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/971): XML-catalog code is not thread-safe on weakly-ordered architectures, directly relevant to riscv64's weak memory model (RVWMO) |
| libwebp | WebP image codec (runtime, optional) | CMake build, no special steps | N/A | Ubuntu Noble riscv64 .deb | Zero riscv64 issues found across GitHub, Debian buildd, Arch, and Gentoo trackers |
| OpenBLAS | Linear algebra, used by some filters/ML integration (runtime, optional) | `DYNAMIC_ARCH` riscv64 support since 0.3.28, with ZVL128B/ZVL256B targets and T-Head C910V/x280 vendor kernels | Debian buildd `rv-manda-02`, Installed | Debian sid 0.3.33+ds-3; Ubuntu Noble universe 0.3.26 predates DYNAMIC_ARCH | **Fixed but unreleased:** [#5811](https://github.com/xianyi/OpenBLAS/issues/5811)/[PR#5815](https://github.com/xianyi/OpenBLAS/pull/5815) - a DGEMM correctness regression on ZVL256B (SpacemiT K1) produced wrong eigenvalues; merged to `develop` but not in a tagged release yet |
| GCC | Primary build toolchain (build, critical) | No minimum version pinned by FFmpeg's configure; feature-probed by compile tests. BtbN CI image reportedly uses GCC 15.2.0 [NEEDS VERIFICATION] | - | - | Usable RVV 1.0 support is generally GCC >= 13/14 in practice, per external toolchain maturity, not a figure stated in FFmpeg's own docs |
| LLVM | Alternate build toolchain (build, optional) | Historically, LLVM's built-in assembler lacked `.option arch` directive support, making it largely unusable for FFmpeg's RISC-V assembly per the maintainer's own writeup; current status not re-verified. SLP-vectorizer cost-model bugs ([llvm#176218](https://github.com/llvm/llvm-project/issues/176218), [#175826](https://github.com/llvm/llvm-project/issues/175826)) affect RVV codegen quality for dependent libraries such as libx264 | - | - | [NEEDS VERIFICATION: current LLVM RISC-V assembler maturity] |
| GNU binutils | Assembler/linker toolchain (build, critical) | BtbN CI image reportedly uses binutils 2.46.0 [NEEDS VERIFICATION] | - | - | - |
| GNU make | Build driver (build, critical) | GNU Make 3.81+ required per `INSTALL.md`; no riscv64-specific constraint | - | - | - |
| QEMU | Test-execution emulator (test, critical) | - | Used both locally (`--target-exec="qemu-riscv64 -L sysroot"`) and in Forgejo CI (`target_exec: 'qemu-riscv64'`, `ghcr.io/btbn/ffmpeg-builds/base-linuxriscv64:latest-arm` container) to run the FATE suite on riscv64-cross-compiled binaries under QEMU user-mode emulation | - | Minimum version commonly cited as 2.12 (general riscv64) / 7.0+ (V-extension emulation) [NEEDS VERIFICATION] |

**Cross-cutting pattern.** The single most severe correctness/security issue across this dependency set is OpenSSL's AES side-channel gap on riscv64 hardware lacking Zkn/Zvkned - directly relevant to any FFmpeg deployment doing HTTPS/TLS I/O on such hardware, with fix PRs still open. The second most notable is the OpenBLAS DGEMM correctness regression on ZVL256B (SpacemiT K1), fixed upstream but not yet in a tagged release - relevant to any FFmpeg build pulling in an OpenBLAS-backed numerics filter chain on affected hardware.

## 11. Known Bugs and Active Issues

There are no GitHub issue numbers to cite for FFmpeg's own riscv64 bugs: the GitHub mirror has Issues disabled entirely, and the project's real tracker, Trac (`trac.ffmpeg.org`), returned an access-denied response in this research session. The record below is reconstructed from commit messages, which is the closest GitHub-native substitute available.

| Commit / ID | Description | Status |
|---|---|---|
| [`e3b0d583`](https://github.com/FFmpeg/FFmpeg/commit/e3b0d58394484def810aca712d090be000ddeece) | RVV `pixblockdsp` `get_pixels_unaligned` produced wrong results when stride was not a multiple of 8; reverted | Fixed by revert, merged 2025-11-07 |
| [`b87602a6`](https://github.com/FFmpeg/FFmpeg/commit/b87602a63a52b0f7f968fd314f02be14acde16b7) | `swscale/riscv`: uyvy/yuyv to yuv422p conversion incorrect on odd widths (found via checkasm-sw_rgb) | Fixed, merged 2026-09-27 (most recent riscv commit found) |
| `1912c86` [NEEDS VERIFICATION, existing-report source only] | `sws/range_convert`: `ff_range_chr_from_jpeg_16_rvv` wrote to the wrong register (`v0` instead of `v4`), silently corrupting Cb/Cr | Reported fixed 2024-11-17 |
| `acb38d3` [NEEDS VERIFICATION] | `lavc/llvidencdsp`: `sub_left_predict` RVV assumed a pre-zeroed destination buffer; checkasm's zeroed test buffers masked the bug | Reported fixed 2025-12-15 |
| `a0a89ef` [NEEDS VERIFICATION] | `sad_rvv.S`: tail-agnostic (`ta`) policy after zero-init let vector tail lanes corrupt the accumulator; switched to tail-undisturbed (`tu`) | Reported fixed 2025-01-25 |
| `e61fed82` | `avutil/riscv/cpu`: `__riscv_v_min_vlen` typo caused incorrect CPU detection | Fixed 2024-06-26 |
| dav1d [#463](https://code.videolan.org/videolan/dav1d/-/issues/463) | Static cross-compile linking fails on riscv64 | Open, workaround exists |
| libaom [Gerrit 208401](https://aomedia-review.googlesource.com/c/aom/+/208401) | RVV highbd convolve correctness bug for w==2/h==2 blocks | Open, stalled |
| libopus [#368](https://github.com/xiph/opus/issues/368) | RISC-V RVV port exists as a non-public Samsung R&D branch, no public merged PR | Open |
| zlib-ng [#1670](https://github.com/zlib-ng/zlib-ng/issues/1670) | `CHUNK_MEMSET_RVV_IMPL` unaligned pointer cast without alignment gate | Open |
| libxml2 [#971](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/971) | XML-catalog code not thread-safe on weakly-ordered architectures (RVWMO-relevant) | Open |
| OpenSSL [PR#31080](https://github.com/openssl/openssl/pull/31080) / [#31082](https://github.com/openssl/openssl/pull/31082) | AES T-table side-channel on hardware without Zkn/Zvkned | Open, security-relevant |
| OpenBLAS [#5811](https://github.com/xianyi/OpenBLAS/issues/5811) / [PR#5815](https://github.com/xianyi/OpenBLAS/pull/5815) | DGEMM correctness regression on ZVL256B, wrong eigenvalues | Fixed in `develop`, unreleased |

**No FFmpeg-specific "NaN/floating" bug was located.** Searches surfaced only general RISC-V ISA-spec discussion (e.g., NaN-boxing behavior in `vfmerge`/`vfmv`, [riscv-isa-manual #1030](https://github.com/riscv/riscv-isa-manual/issues/1030)), none tied to an FFmpeg bug report; this may be tracked on the inaccessible Trac instance rather than not existing at all.

**Historical toolchain/hardware issues** noted by the RISC-V maintainer's own writeup: unaligned memory access on the VisionFive v1 board traps and is emulated in M-mode, causing severe slowdowns; older LLVM lacked `.option arch` assembler support; `checkasm`/riscv needed explicit SIGILL handling so in-development RVV assembly reports a clear error instead of crashing (patchwork [thread](https://patchwork.ffmpeg.org/project/ffmpeg/patch/20230712195247.38674-1-remi@remlab.net/)).

## 12. Objections and Upstream Blockers

**Reviewer bandwidth is the primary technical-process bottleneck.** The H.264 QPEL RVV series (patchwork #12953) received maintainer "LGTM" approval and remains unmerged. There is no technical objection recorded against it - it appears to be idle for lack of a committer to push it, a low-effort, high-value item sitting unaddressed.

**Single-maintainer dependency persists.** Remi Denis-Courmont owns the RISC-V platform designation in `MAINTAINERS`, owns every riscv64 source directory per `.forgejo/CODEOWNERS`, and continues to author or review the majority of riscv64 commits through September 2026 (including the most recent CPU-detection and checkasm work). No RISE membership or funded RISE engagement is confirmed for FFmpeg itself as a project (see below); the newer institutional contributors (ISCAS, ZTE, Sanechips) submit codec-specific patches but do not appear to be carrying maintainer-level review load.

**RISE Project connection is real but narrow and indirect.** FFmpeg is **not** a RISE member and no RISE blog post mentions FFmpeg (confirmed by `riseproject.dev/?s=ffmpeg` returning "no results found", and by checking the closest candidate post, "Announcing the RISE RISC-V Runners"). FFmpeg is also not listed in the RISE Python wheel builder's ~80 supported riscv64 packages. What does exist:
- **Project RP002, "Optimize H.264 Decoding in FFmpeg"** - a RISE-funded RFP, publicly announced by [FFmpeg on X](https://x.com/FFmpeg/status/1726020510406881701) in November 2023, bidding window Nov 15-Dec 1, 2023. Scope: RVV + Zb{a,b,c,s} DSP for H.264 decode (motion compensation, intra prediction, IDCT, weighted prediction, in-loop filtering), correctness testing, CI integration, and hardware validation on RVV 1.0 silicon (e.g., Kendryte K230). The [Confluence wiki entry](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8585701/Project+RP002+Optimize+H.264+Decoding+in+FFmpeg) shows status "Bidding Closed"; no delivered contractor, award amount, or benchmark results are disclosed.
- **Downstream RISE python-wheels ecosystem:** [riseproject-dev/python-wheels issue #2136](https://github.com/riseproject-dev/python-wheels/issues/2136) and [PR #461](https://github.com/riseproject-dev/python-wheels/pull/461) (merged 2026-09-20) added a riscv64 wheel for PyAV, which bundles a prebuilt FFmpeg via `pyav-ffmpeg`; [PR #2105](https://github.com/riseproject-dev/python-wheels/pull/2105) similarly packages torchcodec (PyTorch's FFmpeg-backed video decoder) for riscv64.
- **RISE native runner exposure of FFmpeg build fragility:** [PyAV-Org/PyAV PR #2407](https://github.com/PyAV-Org/PyAV/pull/2407) (merged 2026-09-16) used RISE's native `ubuntu-24.04-riscv` GitHub runners to build and test PyAV, and hit an illegal-instruction/core-dump bug compiling FFmpeg on that runner, initially worked around with prebuilt artifacts, then fixed with RISC-V-specific vector-option build workarounds after reviewer feedback. This is independent, empirical evidence that building FFmpeg from source on real riscv64 hardware is not yet friction-free, distinct from the QEMU-emulated CI path.

**No riscv64-specific written objection to the port exists.** No maintainer or TC ruling was found opposing riscv64 work; blockers are entirely a function of limited reviewer time, not technical or policy resistance.

## 13. Readiness Assessment

- **Color:** Blue
- **Release provider:** distro

FFmpeg's canonical CI (self-hosted Forgejo at `code.ffmpeg.org`; GitHub is a read-only mirror) includes a live riscv64 job - the `run_fate_full` matrix entry "Qemu, Linux, riscv64" in [`.forgejo/workflows/test.yml`](https://github.com/FFmpeg/FFmpeg/blob/master/.forgejo/workflows/test.yml) - that cross-builds FFmpeg in a riscv64 container and then runs the full FATE test suite via `qemu-riscv64` emulation on every push to master and every PR, verified by direct file fetch. This satisfies build=yes/test=yes. However, FFmpeg publishes no upstream binary releases of any kind for any architecture (git tags only, no release assets), so the consumable riscv64 artifact comes from distro packaging - Debian trixie (`ffmpeg_7.1.4-0+deb13u1_riscv64.deb`), Ubuntu Noble/resolute, and Arch Linux RISC-V all ship it, built from upstream source. Per the color model this is CI build+test=yes / release=no, giving blue with release_provider=distro rather than upstream. FFmpeg is a general-purpose multimedia framework (codec/container/filter/protocol breadth), not a project whose sole value proposition is RISC-V-specific speed over a simpler alternative, so the optimization-purpose modifier does not apply; its RISC-V SIMD (RVV/Zbb/Zba/Zvbb) DSP coverage across `libavcodec`/`libavutil`/`libswscale`/`libavfilter` is real and extensive (Section 4) but is not a color-capping factor here.

**Pending work that could change the grade.** Development happens via the `ffmpeg-devel` mailing list and patchwork.ffmpeg.org, not GitHub Issues/PRs (the repo has 0 of each on GitHub). Notable pending items: H.264 QPEL RVV (patchwork series 12953) has maintainer LGTM but remains unmerged; the swscale range-convert RVV re-enable (series 18247) was pending review as of the most recent check. The V-subset feature-detection work (series 15830) is **no longer pending** - it merged as commit [`9b348aa6`](https://github.com/FFmpeg/FFmpeg/commit/9b348aa60b0f1b45a6cfbae5451bf1544fc6fd93) (2025-11-09/11). Fresh commit activity through 2026-09-27 (the swscale odd-width fix, a vector-FDCT port, and the merged V-subset detection) shows the port is actively maintained, now with contributions from ISCAS, ZTE, and Sanechips alongside primary RISC-V maintainer Remi Denis-Courmont. No RISE membership or funded RISE engagement is confirmed for FFmpeg itself, though a RISE-funded RFP (project RP002, H.264/RVV decode optimization) was issued in November 2023 and reached only the bidding stage in its published record.

## 14. Investment Analysis

### 14.1 Functional Enablement

The riscv64 port is functionally complete for the core codec set (H.264, HEVC, VP8, VP9, AAC, AC3, FLAC, Opus, Vorbis). Remaining gaps are concentrated in AV1 native DSP (no riscv64 files at all; libdav1d's own comprehensive RVV support is the practical workaround for AV1 decode, see Section 9), VVC completeness (MC + SAD only vs. richer x86/aarch64 coverage), libswresample (no riscv64 directory), and the still-disabled swscale range-convert path. Most gaps have patches already written; the demonstrated bottleneck is review/merge latency (the QPEL series sitting idle after LGTM), not technical difficulty.

### 14.2 Performance Optimization

Credible, attributable riscv64 performance figures for FFmpeg are sparse:
- **~14% improvement** from a single configuration change ([PLCT Lab](https://plctlab.org/en/news/093/)); underlying benchmark undisclosed, no hardware named.
- **>2x average FPS** for 720p H.264 decode on an unnamed internal FPGA ([sifive/ffmpeg-rvv](https://github.com/sifive/ffmpeg-rvv), a separate non-upstream fork, not `FFmpeg/FFmpeg` itself); no baseline numbers published, and the upstream reviewer explicitly noted the patches were validated only on FPGA emulation of RVV 1.0 silicon that did not yet exist in production.
- **~3.29x speedup on SG2044** for the new vector FDCT kernel ([`c2bb5aa8`](https://github.com/FFmpeg/FFmpeg/commit/c2bb5aa8d85f1e2cdf5e72b942b94df932eb4f42), Sanechips, merged 2026-09-11) - the most recent, most directly attributable figure.

A prior detailed checkasm micro-benchmark table (VVC put_pixels, VVC DMVR, HEVC put_pixels, H.264 QPEL, swscale JPEG range, `llvidencdsp`, all on T-Head C908 VLEN=128 and SpacemiT X60 VLEN=256, showing 5.8x-22x speedups over C) was not re-derived or re-verified against a primary source in this research cycle and is not reproduced here without that verification; it should be re-pulled from `fate.ffmpeg.org`/checkasm output directly before being cited again. [NEEDS VERIFICATION]

No end-to-end riscv64-vs-arm64 or riscv64-vs-amd64 FFmpeg transcode benchmark (with methodology and numbers) exists anywhere in the public record checked, including the RISE blog, GitHub, and general web search. No Qualcomm RISC-V hardware appears in any published benchmark or CI configuration.

### 14.3 CI/CD Infrastructure

The riscv64 build-and-test job now exists in `run_fate_full` (Section 7); the previously identified gap (no in-pipeline riscv64 CI) has closed. No further CI investment is required to reach build+test parity with aarch64/amd64 at the CI level; the remaining CI gap, if any, is that the job runs on QEMU emulation rather than native silicon.

### 14.4 Ecosystem Enablement

Key performance-critical runtime dependencies for a production riscv64 FFmpeg deployment:
- **dav1d:** comprehensive RVV coverage, no action needed.
- **OpenSSL:** comprehensive RVV/Zvk support, but carries an open, security-relevant side-channel gap (Section 9/11) that should be tracked, not re-engineered.
- **libx265:** RVV DCT work exists in Debian sid but has an unresolved stack/buffer-overflow review comment blocking merge (PR#895) - the single highest-leverage, lowest-effort dependency fix available, since the code already exists.
- **libx264:** RVV asm reported in progress but blocked in part by upstream LLVM SLP-vectorizer codegen bugs, not by x264 itself.
- **libvpx, SVT-AV1:** no riscv64 SIMD kernels; pure C fallback only. No upstream RVV work tracked for either.
- **libopus:** a non-public Samsung R&D RVV branch reportedly exists but has never been made public or merged.

For a chip company with transcoding workloads, libx264 and libx265 RISC-V SIMD remain the highest-leverage dependency investments; libx265's RVV DCT patch (PR#895) in particular needs only review-comment resolution, not new engineering, to land.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Merge H.264 QPEL RVV (patchwork series 12953, maintainer LGTM) | 0.5 (push/rebase check) | Committer needed | Critical |
| Functional | Resolve review comments and merge libx265 RVV DCT32x32 (PR#895) | 1-2 (address stack/buffer-overflow feedback) | libx265 maintainers + reviewer | Critical |
| Functional | Merge/complete swscale range-convert re-enable (series 18247) | 1 (review, verify correctness) | Reviewer needed | High |
| Functional | libswresample RVV (audio sample-format conversion) | 2-4 (new work, review) | New contributor | High |
| Security | Land OpenSSL AES side-channel fixes for riscv64 without Zkn/Zvkned (PR#31080/#31082) | 0.5-1 (review, backport) | OpenSSL reviewer | Critical |
| Security | Verify OpenBLAS DGEMM ZVL256B fix (PR#5815) reaches a tagged release before deploying on SpacemiT K1-class hardware | 0.25 (verification/backport tracking) | Internal team | High |
| Performance | AV1 native decoder RVV DSP | 20-40 (new work, many functions) | New contributor | Medium |
| Performance | VVC deblocking + SAO RVV | 8-12 (new work) | New contributor | Medium |
| Performance | libx264 RVV DSP, unblock via LLVM SLP-vectorizer fixes | 20-40 (cross-project: x264 + LLVM) | New contributor | High |
| Performance | libvpx riscv64 configure support + basic RVV | 8-16 (separate project) | New contributor | Medium |
| CI/CD | Move riscv64 FATE job from QEMU emulation to native riscv64 runner | 2-4 (infra, hardware access) | Internal team | Medium |
| Ecosystem | Benchmark riscv64 vs amd64/arm64 end-to-end transcode FPS | 2-4 (hardware access required) | Internal team | High |

## 15. References

- [FFmpeg project homepage](https://ffmpeg.org/)
- [FFmpeg/FFmpeg GitHub mirror](https://github.com/FFmpeg/FFmpeg)
- [Forgejo CI workflow, test.yml (riscv64 job)](https://github.com/FFmpeg/FFmpeg/blob/master/.forgejo/workflows/test.yml)
- [FFmpeg patchwork - RISC-V patches](https://patchwork.ffmpeg.org/project/ffmpeg/list/?q=riscv&archive=&state=*)
- [ffmpeg-devel mailing list archive](https://ffmpeg.org/pipermail/ffmpeg-devel/)
- [libavcodec/riscv source tree](https://github.com/FFmpeg/FFmpeg/tree/master/libavcodec/riscv)
- [libavutil/riscv source tree](https://github.com/FFmpeg/FFmpeg/tree/master/libavutil/riscv)
- [libswscale/riscv source tree](https://github.com/FFmpeg/FFmpeg/tree/master/libswscale/riscv)
- [libavfilter/riscv source tree](https://github.com/FFmpeg/FFmpeg/tree/master/libavfilter/riscv)
- [Commit d8080705 - AV_READ_TIME cycle counter](https://github.com/FFmpeg/FFmpeg/commit/d808070547a867a8f3f7b97fdff3574576213c07)
- [Commit 9b348aa6 - V subset feature detection](https://github.com/FFmpeg/FFmpeg/commit/9b348aa60b0f1b45a6cfbae5451bf1544fc6fd93)
- [Commit e3b0d583 - RVV get_pixels_unaligned revert](https://github.com/FFmpeg/FFmpeg/commit/e3b0d58394484def810aca712d090be000ddeece)
- [Commit f704dd77 - HEVC add_res RVV (ZTE)](https://github.com/FFmpeg/FFmpeg/commit/f704dd77b7d879707e6745424d129f6ec8f66035)
- [Commit c2bb5aa8 - vector FDCT (Sanechips)](https://github.com/FFmpeg/FFmpeg/commit/c2bb5aa8d85f1e2cdf5e72b942b94df932eb4f42)
- [Commit b87602a6 - swscale odd-width fix (ISCAS)](https://github.com/FFmpeg/FFmpeg/commit/b87602a63a52b0f7f968fd314f02be14acde16b7)
- [RISE Project RP002 - Optimize H.264 Decoding in FFmpeg](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8585701/Project+RP002+Optimize+H.264+Decoding+in+FFmpeg)
- [FFmpeg announcing the RISE RFP](https://x.com/FFmpeg/status/1726020510406881701)
- [riseproject-dev/python-wheels issue #2136 - av riscv64 support](https://github.com/riseproject-dev/python-wheels/issues/2136)
- [riseproject-dev/python-wheels PR #461 - av 18.1.0](https://github.com/riseproject-dev/python-wheels/pull/461)
- [riseproject-dev/python-wheels PR #2105 - torchcodec 0.16.0](https://github.com/riseproject-dev/python-wheels/pull/2105)
- [PyAV-Org/PyAV PR #2407 - riscv64 build via RISE native runners](https://github.com/PyAV-Org/PyAV/pull/2407)
- [sifive/ffmpeg-rvv (non-upstream fork)](https://github.com/sifive/ffmpeg-rvv)
- [Remi Denis-Courmont - RISC-V support in FFmpeg (Remlab)](https://www.remlab.net/op/ffmpeg-riscv-1.shtml)
- [PLCT Lab - FFmpeg RISC-V performance note](https://plctlab.org/en/news/093/)
- [Debian trixie ffmpeg riscv64 package](https://packages.debian.org/trixie/riscv64/ffmpeg)
- [Ubuntu packages search - ffmpeg, resolute](https://packages.ubuntu.com/search?keywords=ffmpeg&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V mirror repo](https://mirrors.felixc.at/archriscv/repo/extra/)
- [dav1d issue #463 - static cross-compile linking](https://code.videolan.org/videolan/dav1d/-/issues/463)
- [libaom Gerrit 208401 - RVV highbd convolve bug](https://aomedia-review.googlesource.com/c/aom/+/208401)
- [SVT-AV1 issue #2214 - riscv64 packaging blocker](https://gitlab.com/AOMediaCodec/SVT-AV1/-/work_items/2214)
- [Opus issue #368 - RISC-V RVV port](https://github.com/xiph/opus/issues/368)
- [Opus PR #392 - RTCD refactor](https://github.com/xiph/opus/pull/392)
- [Vorbis issue #124 - SIGFPE div-by-zero](https://github.com/xiph/vorbis/issues/124)
- [Vorbis PR #127 - x86 SSE2 leak into RISC-V probes](https://github.com/xiph/vorbis/pull/127)
- [x265 BB#1005 - CMake unknown processor](https://bitbucket.org/multicoreware/x265_git/issues/1005)
- [x265 PR #895 - RVV DCT32x32](https://github.com/Multicorewareinc/x265/pull/895)
- [OpenSSL PR #31080 - AES side-channel fix](https://github.com/openssl/openssl/pull/31080)
- [OpenSSL PR #31082 - AES side-channel fix](https://github.com/openssl/openssl/pull/31082)
- [OpenSSL issue #22166 - SSL test flakiness on riscv64](https://github.com/openssl/openssl/issues/22166)
- [zlib PR #1099 - RVV Adler32](https://github.com/madler/zlib/pull/1099)
- [zlib-ng issue #1670 - unaligned pointer cast in RVV CHUNK_MEMSET](https://github.com/zlib-ng/zlib-ng/issues/1670)
- [libxml2 issue #971 - XML-catalog thread-safety on weakly-ordered architectures](https://gitlab.gnome.org/GNOME/libxml2/-/work_items/971)
- [OpenBLAS issue #5811 - DGEMM correctness regression on ZVL256B](https://github.com/xianyi/OpenBLAS/issues/5811)
- [OpenBLAS PR #5815 - DGEMM fix](https://github.com/xianyi/OpenBLAS/pull/5815)
- [xz issue #146](https://github.com/tukaani-project/xz/issues/146) / [issue #180](https://github.com/tukaani-project/xz/issues/180)
- [LLVM issue #176218 - SLP vectorizer cost model](https://github.com/llvm/llvm-project/issues/176218)
- [LLVM issue #175826 - SLP vectorizer cost model](https://github.com/llvm/llvm-project/issues/175826)
- [RISE Project homepage](https://riseproject.dev/)