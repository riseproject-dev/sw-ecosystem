---
title: libx264
parent: Project Reports
color: orange
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: FFmpeg
    relation: runtime-dependency
    criticality: optional
  - name: ffms2
    relation: runtime-dependency
    criticality: optional
  - name: GPAC
    relation: runtime-dependency
    criticality: optional
  - name: L-SMASH
    relation: runtime-dependency
    criticality: optional
  - name: OpenCL
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libx264" %}

# libx264

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Optimization level:** absent<br/>
**Scope:** RISC-V (riscv64/linux) support status for libx264<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items verified against only one source are marked [NEEDS VERIFICATION]. Contradictions between sources are cited explicitly.<br/>

## 1. Project Overview

libx264 is an open-source H.264/AVC encoder library produced under the VideoLAN project. The canonical upstream repository is hosted at [code.videolan.org/videolan/x264](https://code.videolan.org/videolan/x264) (GitLab, protected by an Anubis proof-of-work anti-bot wall that blocks plain HTTP fetches of the web UI, though its git protocol and REST API are directly reachable). A widely-referenced mirror exists at [github.com/mirror/x264](https://github.com/mirror/x264), which lags the canonical repository (last synced around 2024-09-25 / 2024-02-27 depending on the check) and is unreliable for anything after that date.

**Governance:** VideoLAN is a French non-profit association (association loi 1901), volunteer-led, with a five-member board: President Jean-Baptiste Kempf, Vice Presidents Konstantin Pavlov and Vibhoothi, Treasurer Thomas Guillem, and Secretary Felix Paul Kuhne. This board governs VideoLAN broadly, not x264 specifically. There is no `MAINTAINERS`, `GOVERNANCE.md`, or `CONTRIBUTING.md` file in the x264 repository. The `AUTHORS` file names two people as "Maintainer": Fiona Glaser (fiona@x264.com, encoder analysis/algorithms, x86 asm) and Loren Merritt ("pengvado"); Laurent Aimar (fenrir@videolan.org) is listed as "Initial import, former maintainer." No architecture-specific maintainer role (ARM, MIPS, RISC-V, etc.) is designated anywhere. Patches are submitted via the x264-devel mailing list and the VideoLAN GitLab instance.

**License:** GNU GPL v2.0 (dual-licensed), with a separate commercial license available via x264licensing@videolan.org for proprietary/non-GPL use.

**Versioning:** The project has no git tags and no GitLab Releases (`repository/tags` and `releases` both return empty via the API). x264 ships as rolling dated snapshots; the only embedded version indicator is `X264_BUILD` in `x264.h` (currently `165`), an API/ABI compatibility counter, not a per-feature release marker.

**Corporate contributors relevant to RISC-V:**
- **Changsheng Wu** (`wu.changsheng@sanechips.com.cn`) - authored the sole merged riscv64 commit (compile enablement, September 2025). Sanechips is ZTE's semiconductor/chip-design subsidiary.
- **Jiayan Qian** ("BD-qjy") - authored the earlier, since-closed riscv64 enablement attempt (!155, 2024).
- The still-open motion-compensation MR (!194) lists four co-authors: Qian Jiayan (`qianjiayan.1@bytedance.com`, ByteDance), and Deng Zewen, Huang Shangcheng, Xing Ziyue (all `@zte.com.cn`, ZTE).
- **Niklas Haas** ("haasn") - authored the open RVV pixel/motion-compensation DSP MR (!192), profiling-driven work on a SpacemiT K1.
- Pre-existing, non-RISC-V contributors of note from the AUTHORS/commit history: Henrik Gramner (x86/x86inc infrastructure) [NEEDS VERIFICATION: corporate affiliation], mstorsjo (AArch64/CI), XiWeiGu (LoongArch) [NEEDS VERIFICATION], DavidChenCn (SVE/SVE2, 2023) [NEEDS VERIFICATION].

**RISE membership:** VideoLAN and x264 are not listed among RISE's 8 Premier members (Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) or 12 General members (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE Corporation). ZTE Corporation is a RISE General Member, which is a plausible-but-unconfirmed corporate link to Sanechips/ZTE's direct x264 contributions, since RISE's roster names "ZTE Corporation" and not "Sanechips" specifically. No RISE blog post, RFP, or project listing names libx264, x264, or any video codec (confirmed via `riseproject.dev/?s=libx264` returning no results, and a manual review of the full 2025-2026 blog archive). libx264's only documented RISE touchpoint is indirect: it appears bundled inside FFmpeg/PyAV in RISE's `python-wheels` riscv64 packaging effort (see Section 9).

**Community stance on new ports:** No written policy exists for accepting new architecture ports. New ports (LoongArch by Loongson-affiliated contributors, AArch64 SVE/SVE2, and now riscv64 by Sanechips/ByteDance/ZTE engineers) are accepted opportunistically when a vendor or SoC engineer submits working patches with hardware and benchmark data for their own silicon. The riscv64 compile-enablement patch went through 14 discussion notes before merging (!184) and the closed precursor (!155) went through 17 notes over a 12-month open period, indicating real but unhurried review rather than resistance.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-08-27 | Issue #52 filed: `./configure` fails on riscv64 with "unable to guess system type" | [Issue #52](https://code.videolan.org/videolan/x264/-/work_items/52) |
| 2022-11-19 | !121 opened by Roger Hardiman: adds riscv64 detection to `config.guess` (yields `riscv64-unknown-linux-gnu`); `config.sub` needs no change | [MR !121](https://code.videolan.org/videolan/x264/-/merge_requests/121) |
| 2022-12-17 | !121 merged | [MR !121](https://code.videolan.org/videolan/x264/-/merge_requests/121) |
| 2024-08-19 | !155 opened by Jiayan Qian (BD-qjy): basic riscv64 compile-enablement, wording identical in intent to what would become !184 | [MR !155](https://code.videolan.org/videolan/x264/-/merge_requests/155) |
| 2025-08-28 | !155 closed, not merged (superseded by !184) | [MR !155](https://code.videolan.org/videolan/x264/-/merge_requests/155) |
| 2025-08-31 (authored) / 2025-09-10 (committed) | Commit `0480cb05` "riscv64: add compile support" by Changsheng Wu (Sanechips/ZTE): adds `ARCH_RISCV64`/`HAVE_RISCV64` detection, an `RVV` CPU-flag placeholder, `getauxval`-based RVV hwcap probe, and an `rdtime`-based checkasm cycle counter. No SIMD/assembly code added. Commit message: "We are working on adding vector optimizations with riscv64 rvv extensions, and will push the implementations later." | [MR !184](https://code.videolan.org/videolan/x264/-/merge_requests/184) |
| 2025-09-01 | !184 opened (wrapping the above commit) | [MR !184](https://code.videolan.org/videolan/x264/-/merge_requests/184) |
| 2025-09-16 | !184 merged. This commit is still the tip of `master`'s riscv-related history as of 2026-09-30 | [MR !184](https://code.videolan.org/videolan/x264/-/merge_requests/184) |
| 2025-09-16 | !185 opened by Changsheng Wu: RVV-optimized `nal_escape` bitstream routine, author benchmark ~3.25x faster than C. Still open. | [MR !185](https://code.videolan.org/videolan/x264/-/merge_requests/185) |
| 2025-11-27 | !192 opened by Niklas Haas: RVV256 pixel/motion-compensation DSP functions, author-reported ~2x (97%) overall speedup from profiling on a SpacemiT K1. Still open (`state: opened`, `merged_at: null`, `merge_commit_sha: null` per the GitLab API, confirmed by `git merge-base(master, <branch tip>)` returning `0480cb05` itself, i.e. no ancestry relationship to master). | [MR !192](https://code.videolan.org/videolan/x264/-/merge_requests/192) |
| 2026-01-03 | !194 opened by Zewen Deng (ZTE) with ByteDance/ZTE co-authors: RVV `pixel_avg`/`mc_luma`/`get_ref`, +15.50% full-encode FPS on SG2044 and +21.15% on SpacemiT K1 (faster preset, single core). Still open and actively updated through 2026-07-24/25 (15 discussion notes, 3 upvotes - the most active open riscv64 MR). | [MR !194](https://code.videolan.org/videolan/x264/-/merge_requests/194) |
| 2025-12-12 | Issue #81 filed: a RISC-V silicon vendor with a 256-bit-VLEN RVV core proposes fusing small-macroblock operators (e.g. `satd_8x8` -> `satd_8x8x2`), reporting 4-5% overall 1080p CRF24 gain; offers to collaborate. No MR filed as of last update (2026-03-02). | [Issue #81](https://code.videolan.org/videolan/x264/-/work_items/81) |

**Is it fully upstream?** No. Only build/CPU-detection plumbing (!121, !184) is merged into `master`. Direct verification via the GitLab API and a `master` history walk (`git log --all --grep=riscv -i`, full unshallowed clone, 3223 commits) confirms the only riscv64 commit reachable from any live branch is `0480cb05`. There is no `common/riscv64/` directory, and no `.S`/assembly file for RISC-V exists in `master`; `common/` there contains only `aarch64, arm, loongarch, mips, opencl, ppc, x86`. Note a discrepancy in earlier secondhand research: a claim that !192 landed via a merge commit `55807ad8` containing commits `ed939e2e`/`bda8c80e` does not hold up against direct API and git checks - those commit SHAs are not ancestors of `master`, `55807ad8` returns an empty "contained in refs" list, and the MR object's own state is unambiguously `opened`. This appears to be either a tracker sync artifact or a fabricated/erroneous claim; treat any secondary source repeating it as incorrect.

## 3. Upstream Support Tier

x264 has no documented tier policy for architectures anywhere in the repository or its docs.

| Evidence | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Named in configure | Yes | Yes | Yes (since `0480cb05`, 2025-09-10) |
| CI build job | Yes (Debian amd64) | Yes (Debian aarch64) | No |
| CI test job | Yes | Yes (QEMU) | No |
| SIMD assembly merged | Yes (NASM/SSE/AVX) | Yes (NEON/SVE/SVE2) | No (build scaffolding only; RVV kernels exist only in unmerged !185/!192/!194) |
| Official upstream binary release | No (no tags, no GitLab Releases for any arch) | No | No |
| Distro binary | Yes | Yes | Yes (Debian sid, Ubuntu 26.04 "resolute," Arch Linux RISC-V - all built from the scalar-C fallback path) |
| Release-blocking | Implied (part of default CI matrix) | Implied | No (no riscv64 CI job exists to gate anything) |

x264 publishes no official binary releases for any architecture; all binaries are distro-built. For riscv64 specifically, those distro binaries are compiled entirely through the generic portable-C reference path, identical to what an unrecognized CPU would get.

**De facto tier for riscv64:** compiles and runs correctly via distro packaging, but with no upstream CI, no release gating, and no merged SIMD acceleration - functionally complete, performance-unoptimized.

## 4. Technical Architecture and RISC-V-Specific Subsystems

x264 achieves its performance through architecture-specific hand-written SIMD assembly for every hot kernel (DCT, motion estimation, deblocking, intra prediction, CABAC bitstream). `x264` uses static assembly/intrinsics plus a runtime CPU-flag dispatch table (`common/cpu.c`); there is no JIT backend on any architecture, so "JIT for riscv64" does not apply.

**`common/` directory inventory on `master` (verified, 2026-09-30):**

| Architecture | Directory present on master | SIMD type |
|---|---|---|
| x86/x86_64 | Yes (`common/x86/`) | NASM, SSE2/AVX/AVX-512 |
| aarch64 | Yes (`common/aarch64/`) | NEON, SVE, SVE2 |
| arm | Yes (`common/arm/`) | NEON, ARMv6 |
| loongarch | Yes (`common/loongarch/`) | LSX, LASX |
| mips | Yes (`common/mips/`) | MSA intrinsics (C) |
| ppc | Yes (`common/ppc/`) | VSX/Altivec intrinsics (C) |
| riscv64 | **No** | none on master; proposed in unmerged branches only |

**Per-subsystem status:**

| Subsystem | amd64 | arm64 | riscv64 (master) | riscv64 (proposed, unmerged) |
|---|---|---|---|---|
| CPU feature detection | CPUID | getauxval/HWCAP | `getauxval(HWCAP_RISCV64_RVV)` merged (`0480cb05`), flag defined but no kernel dispatches on it | n/a |
| Bitstream / `nal_escape` | Hand-tuned NASM | Hand-tuned ASM | Scalar C | RVV in !185 (`common/riscv64/bitstream-a.S`, ~3.25x author benchmark) |
| Pixel metrics (SAD/SATD/SSD) | Hand-tuned NASM | Hand-tuned ASM | Scalar C | RVV256 in !192 (`common/riscv64/pixel-a.S`) |
| Motion compensation (`pixel_avg`, `mc_luma`, `get_ref`) | Hand-tuned NASM | Hand-tuned ASM | Scalar C | RVV in !192 and !194 (`common/riscv64/mc-a.S`); !194 reports +15.50%/+21.15% full-encode FPS on SG2044/SpacemiT K1 |
| DCT / IDCT / quantize | Hand-tuned NASM | Hand-tuned ASM | Scalar C | No MR exists for this at all |
| Deblocking filter | Hand-tuned NASM | Hand-tuned ASM | Scalar C | No MR exists |
| Intra prediction | Hand-tuned NASM | Hand-tuned ASM | Scalar C | No MR exists |
| CABAC | Hand-tuned NASM | Hand-tuned ASM | Scalar C | No MR exists |

**ISA extensions targeted:** the merged detection probes only the base RVV (`v`) extension via `.option arch, +v` / `vsetvli`. !192 additionally defines an `X264_CPU_RVV256` flag, implying a 256-bit-VLEN assumption for its kernels. No Zvbb, Zvfh, or other sub-extension probing exists anywhere, merged or proposed.

**Cryptography:** not applicable; x264 performs no cryptographic operations.

## 5. Build System, Cross-Compilation, and Toolchain

x264 uses a hand-written `./configure` (Bash) + GNU `Makefile` build system. There is no `CMakeLists.txt`, `setup.py`, `go.mod`, `Cargo.toml`, or `package.json` anywhere in the tree.

**Native build on riscv64 hardware:**
```
./configure --prefix=/usr
make -j$(nproc)
make install
```
`configure`'s arch switch (around line 889) matches `riscv64)` and sets `ARCH="RISCV64"`, `stack_alignment=16`, `AS="${AS-${CC}}"`. No extra flags are required; the build falls back to pure C automatically.

**Cross-compilation from an x86_64 host (Debian/Ubuntu):**
```
apt-get install gcc-riscv64-linux-gnu
./configure --host=riscv64-linux-gnu --cross-prefix=riscv64-linux-gnu- --enable-pic --enable-strip --prefix=/usr
make -j$(nproc)
```

**Toolchain version requirements:** none are enforced by `configure` - a full scan of the script shows zero `__GNUC__`/version-number checks for riscv64 or any other architecture. The RVV detection probe is:
```sh
if [ $asm = auto -a $ARCH = RISCV64 ] ; then
    define HAVE_RISCV64
    if cc_check '' '' '__asm__(".option arch, +v\n" "vsetvli t0, a0, e32, m1, ta, ma");' ; then
        define HAVE_RVV
    fi
    ASFLAGS="$ASFLAGS -c"
fi
```
If the assembler does not accept the RVV directive, this probe silently fails, `HAVE_RVV` stays undefined, and the build still succeeds via the pure-C path. In practice, any `riscv64-linux-gnu` GCC or Clang that compiles plain C will build x264; RVV detection additionally needs assembler RVV support (roughly GCC >= 13 / binutils >= 2.38, or a 2023+ LLVM/Clang). Even when `HAVE_RVV` is defined, it currently gates zero kernel code: the `Makefile`'s RISCV64 RVV block leaves every source/object variable empty:
```makefile
# RISCV64 RVV optims
ifeq ($(SYS_ARCH),RISCV64)
ifneq ($(findstring HAVE_RVV 1, $(CONFIG)),)
SRCASM_X =
SRCS_X  +=
OBJASM +=
...
OBJCHK +=
endif
endif
```

**QEMU usage:** the full `.gitlab-ci.yml` (read directly via both the GitHub mirror raw file and the GitLab API raw-file endpoint - two independent routes converging on the same content) uses QEMU only for aarch64 testing (`test-aarch64-qemu`, sweeping SVE vector lengths 128-2048 via `qemu-aarch64 -cpu max,sve...`). No riscv64 QEMU job exists. Manual emulation:
```
apt-get install qemu-user
qemu-riscv64 ./x264 --help
```

**Known build failures on riscv64:** none found. Debian's build daemons and Ubuntu's "resolute" (26.04) archive both build `libx264-165`/`libx264-dev` for riscv64 successfully (see Section 8). No open Debian bug for x264 on riscv64 was found.

**Dockerfile / CI images:** no `Dockerfile` exists anywhere in the x264 repository. CI images are pre-built externally at `registry.videolan.org/*`; no `registry.videolan.org/x264-*riscv64*` image is referenced anywhere in `.gitlab-ci.yml`, consistent with riscv64 CI simply not existing upstream.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| H.264 Baseline/High Profile encoding | Yes | Yes | Yes (scalar C) |
| SIMD-accelerated DCT | Yes | Yes | No |
| SIMD-accelerated motion estimation/compensation | Yes | Yes | No (merged); proposed in !192/!194 |
| SIMD-accelerated deblocking | Yes | Yes | No |
| SIMD-accelerated intra prediction | Yes | Yes | No |
| SIMD-accelerated bitstream escape | Yes | Yes | No (merged); proposed in !185 |
| OpenCL lookahead | Yes (GPU-dependent) | Yes (GPU-dependent) | Loader path present; no RISC-V OpenCL GPU driver ecosystem exists, so effectively inert |
| Multi-threading (pthreads) | Yes | Yes | Yes |
| 8-bit / 10-bit depth | Yes | Yes | Yes |
| CPU feature detection | Yes | Yes | Partial - RVV hwcap probe merged, but no kernel currently dispatches on it |
| checkasm test coverage | Yes | Yes | Partial - `rdtime` cycle counter merged; riscv64-specific test functions (`tools/checkasm-riscv64.S`) exist only in the unmerged !185 branch |

**Functional gaps:** none. Every H.264 encoding feature is available through the scalar-C path; the encoder is functionally complete on riscv64.

**Performance gap:** all SIMD-accelerated kernels are absent from `master`. On amd64/arm64, hand-tuned assembly typically delivers 4-16x speedups per kernel versus scalar C; the riscv64 build runs every hot-path kernel (DCT, motion estimation, deblocking, intra prediction, CABAC) in scalar C. Direct end-to-end riscv64-vs-arm64/amd64 fps benchmarks for libx264 could not be located from any accessible source this session (Phoronix and OpenBenchmarking.org both return HTTP 403; no RISE blog post or conference paper on this topic exists). The only concrete riscv64 performance figures come from the unmerged MRs' own author benchmarks: !185's `nal_escape_rvv` at 78,970 cycles vs `nal_escape_c` at 256,637 cycles (~3.25x), !192's reported ~97% (~2x) overall speedup from its DSP functions on a SpacemiT K1, and !194's full-stream faster-preset FPS gains of +15.50% (SG2044) and +21.15% (SpacemiT K1). None of this code is merged, so none of it applies to any distro-shipped riscv64 binary today. A separate, unrelated data point - LLVM SPEC CPU2017 `525.x264_r` instruction-count deltas from compiler-optimization work (e.g. [LLVM #153402](https://github.com/llvm/llvm-project/issues/153402): 379,364,891,237 vs 379,357,617,460 instructions, ~0.00% change) - measures compiler code generation, not encoding throughput, and should not be read as an x264 performance benchmark.

**Security hardening gaps:** Data not available: no riscv64-specific security hardening audit was found in any accessible source (upstream tracker, distro bug trackers, or web search).

**Floating-point semantics:** x264 uses fixed-point integer arithmetic throughout its codec kernels; no floating-point NaN or rounding-mode issues specific to riscv64 were identified.

## 7. CI/CD Infrastructure

`.gitlab-ci.yml` was read in full via two independent routes (the GitHub mirror's raw file and the GitLab API's raw-file endpoint against `code.videolan.org` itself, which bypasses the Anubis bot-wall that blocks the HTML UI). The string "riscv" does not appear anywhere in it. The repository root's only CI configuration file is `.gitlab-ci.yml`; there is no `.gitlab/` directory, no included CI file, and no GitHub Actions/Travis/AppVeyor/Jenkinsfile/Buildbot configuration anywhere (`find . -iname "*dockerfile*"` and equivalent scans for other CI systems return nothing; `.github/workflows/` on the mirror returns HTTP 404).

| CI job | Platform | Coverage |
|---|---|---|
| build/test-debian-amd64 | Docker, amd64 | Build + test |
| build/test-debian-aarch64 | Docker, aarch64 | Build + test |
| build-win32, build-win64 | Cross, i686/x86_64-w64-mingw32 | Build |
| build-llvm-mingw-armv7, build-llvm-mingw-aarch64 | Cross, LLVM-MinGW | Build |
| build/test-macos-x86_64, build-macos-arm64 | macOS | Build (+test on x86_64) |
| test-aarch64-qemu | QEMU, aarch64 | Test (SVE vector-length sweep) |
| android-arm, android-aarch64 | Cross | Build |
| **riscv64** | **absent** | **absent** |

| Architecture | Build CI | Test CI | QEMU CI |
|---|---|---|---|
| amd64 | Yes | Yes | No |
| arm64 | Yes | Yes | Yes |
| riscv64 | No | No | No |

No RISE CI runners are used by x264's own pipeline. Any riscv64 build correctness claim rests entirely on downstream distro build infrastructure (Debian's `rv-manda-*` buildds, Ubuntu's archive builders, Arch Linux's riscv64 mirror), not on anything upstream gates.

## 8. Distribution and Release Status

**Upstream releases:** none. No git tags and no GitLab Releases exist for x264 (`repository/tags` -> 0 results, `releases` -> `[]`, confirmed via the API). The GitHub mirror likewise has zero published releases.

**Distribution packages (riscv64):**

| Distribution | Package(s) | Version | riscv64 status | Verification |
|---|---|---|---|---|
| Ubuntu 26.04 "resolute" (dev codename) | `libx264-165`, `libx264-dev` | `2:0.165.3222+gitb35605ac-3build1` | Available | Confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libx264&suite=resolute) listing (arch list: amd64 arm64 armhf i386 ppc64el riscv64 s390x) and a direct `HEAD` request against `ports.ubuntu.com` returning `HTTP 200`, `Content-Type: application/vnd.debian.binary-package`, `Content-Length: 523446` for the riscv64 `.deb` |
| Debian sid | `libx264-165`, `libx264-dev`, `x264` | `2:0.165.3222+gitb35605ac-3+b2` | Installed | [Debian buildd status](https://buildd.debian.org/status/package.php?p=x264&suite=sid) |
| Arch Linux RISC-V (`[extra]`, archriscv) | `x264` | `3:0.165.r3222.b35605a-2` | Available | Confirmed via direct mirror walk of `mirrors.felixc.at/archriscv/repo/extra/`; `HEAD` request returns `HTTP 200`, `Content-Type: application/zstd`, `Content-Length: 763461` for the `riscv64.pkg.tar.zst` |
| Alpine edge | `x264` | `0.164.3108-r1` | Available [NEEDS VERIFICATION - not re-confirmed this session] | community repo |
| Ubuntu 24.04 "Noble" | `libx264-164`, `libx264-dev` | `2:0.164.3108+git31e19f9-1` | Available | Listed alongside amd64, arm64, armhf, i386, ppc64el, s390x |

All of the above are compiled from the generic scalar-C fallback path; none carry any merged RVV acceleration.

**PyPI:** no package named `libx264` exists (`https://pypi.org/pypi/libx264/json` -> HTTP 404, and `https://pypi.org/simple/libx264/` -> HTTP 404 after a 302 redirect from RISE's wheel-builder index). This is expected: x264 is a C library, not a Python package, so this channel does not apply.

**RISE wheel builder:** neither `riseproject.gitlab.io/python/wheel_builder/` nor `riseproject-dev.github.io/python-wheels-dashboard/` lists libx264/x264 among their tracked PyPI packages.

**What a user must do to get a working binary:** install from the system package manager on any of the distributions above. No upstream binary is provided for any architecture. The resulting riscv64 binary is a pure-C scalar build with no SIMD acceleration.

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| GCC | Build-dependency | Critical | `gcc-riscv64-linux-gnu` is a standard Debian/Ubuntu cross package; riscv64 is a mainline, officially-supported GCC target (GCC 7+) | Not verified | Not verified | No minimum version is enforced by x264's `configure`; RVV *detection* additionally needs an assembler that accepts `.option arch, +v`/`vsetvli` (roughly GCC >= 13 / binutils >= 2.38), but this currently gates nothing since no RVV kernel is merged |
| FFmpeg | Runtime-dependency (CLI `--avformat` input, timecode support via `libavformat`/`libavcodec`/`libavutil`) | Optional | Installed in Debian sid riscv64 (FFmpeg package present) | Unknown - no riscv64 CI in FFmpeg upstream for this path | Released | See the project's FFmpeg status report for FFmpeg's own riscv64 (RVV) maturity; that work is understood to be RISE-sponsored (via Remi Denis-Courmont), separately from x264 |
| libswscale, libavutil | Recursed dependency of FFmpeg (pixel-format conversion, required by the `lavf` CLI input path) | Optional (transitive) | Installed as part of the FFmpeg package on riscv64 | Unknown | Released | Not independently tracked; inherits FFmpeg's riscv64 status |
| ffms2 | Runtime-dependency (frame-accurate demuxer input for the CLI, `input/ffms.c`) | Optional | Installed in Debian sid riscv64 | Unknown - no riscv64 CI in ffms2 upstream | Released | Not a hard dependency; CLI falls back gracefully if absent |
| GPAC | Runtime-dependency (alternate MP4 muxer output for the CLI) | Optional | Not currently packaged for riscv64 in Debian | Unknown | Not released for riscv64 via Debian | Not a hard dependency |
| L-SMASH | Runtime-dependency (preferred MP4 muxer, `output/mp4_lsmash.c`) | Optional | Not currently packaged for riscv64 in Debian | Unknown | Not packaged | Not a hard dependency |
| OpenCL | Runtime-dependency (GPU-accelerated lookahead) | Optional | `ocl-icd` installed in Debian sid riscv64; `opencl-headers` is architecture-independent | N/A | Released | No riscv64/RISC-V OpenCL GPU driver ecosystem exists in practice, so this path disables itself at runtime on virtually all riscv64 hardware today |
| NASM (indirect, build-time) | x86/x86_64 SIMD assembler only | Build-time, x86-only | Irrelevant on riscv64 - `configure` auto-disables assembly when no assembler is configured for the target | N/A | N/A | Found via `configure --help`; explicitly not invoked on riscv64 |
| AviSynth+ (indirect) | Optional AviSynth frame-server input | Optional, Windows-only | Not applicable to riscv64/Linux builds | N/A | N/A | dlopen'd at runtime, not linked; irrelevant off Windows |

**Deep-dive - GCC (critical, build-only):** this is the only hard dependency of libx264 itself beyond a C99-capable compiler and optional pthreads; the library proper is self-contained C with no other required external dependency. Everything else in the table above is used only by the `x264` CLI binary (input demuxing, alternate muxers), not by the library that FFmpeg and other consumers link against. No GCC version floor is enforced for a plain compile; a version floor only matters for enabling RVV *detection* in `configure`, and since no RVV kernel is currently merged into `master`, that floor has no practical effect on any distro's riscv64 build today.

**Deep-dive - FFmpeg:** the only optional dependency with SIMD complexity of its own. x264's use of FFmpeg is limited to the `lavf` input/demuxing path (format parsing, not SIMD-heavy decode kernels), so FFmpeg's own riscv64 SIMD maturity has limited bearing on x264's riscv64 performance specifically; no riscv64-specific issues affecting x264's use of FFmpeg were found.

No critical dependency is currently blocking riscv64 functional correctness for libx264.

## 11. Known Bugs and Active Issues

No open riscv64-specific correctness bug exists in x264's own upstream tracker (the only open riscv64-labeled items are the unmerged optimization MRs and issue #81's feature proposal, both covered in Section 2). Several open LLVM RISC-V backend bugs affect code generated for x264/SPEC's `525.x264_r` workload, which exercises x264's scalar-C kernels under the LLVM/Clang toolchain:

| ID | Repo | Title | Status | Severity | Notes |
|---|---|---|---|---|---|
| [#176218](https://github.com/llvm/llvm-project/issues/176218) | llvm/llvm-project | SLP vectorizer cost model mis-costs an x264-derived pattern on RVV | Open (filed 2026-01-15) | High | Compiled with `-march=rv64gv_zvl512b -O3`; SLP predicts ~profitable vectorization (cost -32 at VF=16) but the resulting code runs ~50% slower than scalar. Root cause: inaccurate load/store/arithmetic cost-model numbers (e.g. VectorCost=1 vs ScalarCost=16). Assigned to @bababuck, no linked fix yet. |
| [#175826](https://github.com/llvm/llvm-project/issues/175826) | llvm/llvm-project | `RISCVTTIImpl::getArithmeticInstrCost()` lacks scalar type support | Open | Medium | Causes inaccurate cost modeling for x264-class hot paths; no performance numbers given [NEEDS VERIFICATION - single-source, from prior report only, not independently re-confirmed this session] |
| [#123069](https://github.com/llvm/llvm-project/issues/123069) | llvm/llvm-project | RISC-V EVL tail folding | Open | Medium | GCC 14 reported ~24% faster than Clang on `525.x264_r` on a SpacemiT X60, because Clang's default scalar-epilogue loop never meets the minimum trip count for functions like `get_ref` and skips vectorization; GCC's VL-based tail folding wins. EVL tail folding now beats the scalar-epilogue default on SPEC CPU2017/TSVC geomean, but also vectorizes ~10.1% fewer loops, so it is not yet enabled by default. |
| [#119222](https://github.com/llvm/llvm-project/issues/119222) | llvm/llvm-project | Increased spilling on `rva22u64` after bidirectional-scheduling/register-pressure tracking | Open | Medium | A scheduling patch increases spills in an x264 function on `rva22u64 -O3` (no RVV), producing a measured 1.8% regression on `525.x264_r`; reporter does not recommend reverting since the same patch helps elsewhere, particularly with RVV enabled. |
| [#153402](https://github.com/llvm/llvm-project/issues/153402) | llvm/llvm-project | Inefficient RISC-V constant-pool access | Open | Low | A proposed constant-promotion fix's SPEC2017 instruction-count deltas show `525.x264_r` essentially flat (-0.00%, 379,364,891,237 -> 379,357,617,460 instructions); larger wins are seen on other benchmarks (`519.lbm_r`, `544.nab_r`). |
| [#126594](https://github.com/llvm/llvm-project/issues/126594) | llvm/llvm-project | Enable IPRA for RISC-V | Open (experimental/tracking) | Low | Using `-march=rva22u64_v` with LTO, 5 functions in `x264_r`/`x264_s` are flagged for callee-saved-register optimization; geomean NumCSROpt increases 215.6%. Improvements are described as modest, not yet enabled by default. |

**Correctness bugs:** none found in x264 itself on riscv64. All of the above are compiler code-generation/performance issues in LLVM, not wrong-output bugs in x264.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. x264 has a demonstrated history of accepting architecture-specific SIMD contributions (LoongArch, AArch64 SVE/SVE2) without apparent controversy, and the riscv64 compile-enablement commit was merged by the project's lead maintainer (Jean-Baptiste Kempf pushed `0480cb05`), confirming maintainer receptiveness to riscv64 work generally.

**Technical blockers:**
1. No RVV kernel code is merged. Three open MRs already contain real, benchmarked implementations - !185 (bitstream escape, ~3.25x author benchmark), !192 (pixel/motion-compensation DSP, ~2x reported overall speedup, by Niklas Haas), !194 (pixel_avg/mc_luma/get_ref, +15.50%/+21.15% full-encode FPS on SG2044/SpacemiT K1, actively updated through 2026-07) - but none has landed, and no MR exists at all yet for DCT/quantize, deblocking, intra prediction, or CABAC.
2. Open LLVM bugs ([#176218](https://github.com/llvm/llvm-project/issues/176218), [#175826](https://github.com/llvm/llvm-project/issues/175826), [#123069](https://github.com/llvm/llvm-project/issues/123069)) make compiler auto-vectorization of x264-class kernels on RVV targets unreliable (up to ~50% slower than scalar in the worst case), which argues for hand-written RVV assembly/intrinsics (the approach !185/!192/!194 already take) over relying on LLVM auto-vectorization.
3. No riscv64 CI exists upstream, so none of the open MRs can be gated by automated testing even once technically ready; review currently relies entirely on author-supplied `checkasm` runs on their own hardware (SG2044, SpacemiT K1).

**Organizational blockers:** none identified specific to riscv64. VideoLAN requires no contributor agreement beyond GPL compliance. No RISE RFP funds libx264 RVV work directly; libx264's only RISE touchpoint is as a bundled GPL runtime dependency inside RISE's `python-wheels` riscv64 build of PyAV ([riseproject-dev/python-wheels issue #2136](https://github.com/riseproject-dev/python-wheels/issues/2136), [PR #461](https://github.com/riseproject-dev/python-wheels/pull/461)), which pulls in `libx264.so`/`libx265.so` as GPL-2.0-or-later runtime dependencies of FFmpeg's `libavcodec` but does no RVV optimization work on x264 itself.

**Acceptance probability:** high for the three pending MRs specifically, based on the prior acceptance of the compile-enablement commit, the project's general track record with vendor-contributed architecture ports, and the fact that !194 already has active, sustained maintainer/contributor engagement (15 discussion notes, 3 upvotes, updates through mid-2026). No commitment or timeline for merging any of them was found.

## 13. Readiness Assessment

- **Color:** orange (optimization-absent)
- **Release provider:** distro
- **Optimization-purpose project:** yes
- **Optimization level:** absent

**Justification:** libx264 has no upstream riscv64 CI at all - `.gitlab-ci.yml` defines build/test jobs only for debian-amd64/aarch64, win32/64, llvm-mingw, and macos-x86_64/arm64, and upstream publishes no tagged releases - which would floor it at orange. Debian sid and Ubuntu 26.04 ship a clean, unpatched riscv64 build of `libx264-165`/`libx264-dev` ([Debian buildd](https://buildd.debian.org/status/package.php?p=x264&suite=sid), [Ubuntu packages](https://packages.ubuntu.com/search?keywords=libx264&suite=resolute)), which would raise it to yellow. But as an optimization-purpose, SIMD-dependent H.264 encoder, direct verification via the GitLab API and a `master` history walk shows the only riscv64 code reachable from any branch is the pure build-enablement commit `0480cb05` ("riscv64: add compile support," [!184](https://code.videolan.org/videolan/x264/-/merge_requests/184)) - every RVV kernel (bitstream !185, DSP !192, motion compensation !194 at [https://code.videolan.org/videolan/x264/-/merge_requests/194](https://code.videolan.org/videolan/x264/-/merge_requests/194)) remains unmerged as of 2026-09-30, so all hot paths (DCT, motion estimation, deblocking, intra prediction, CABAC) still run scalar C on riscv64, which caps the grade at orange.

**Pending work that could change the grade:** three open merge requests would close the gap if merged: !185 (RVV bitstream escape, ~3.25x speedup in author benchmarks), !192 (RVV256 pixel/motion-compensation DSP by Niklas Haas, ~2x speedup, falsely appeared merged via a dangling/unreachable commit that was corrected on direct verification), and !194 (RVV `pixel_avg`/`mc_luma`/`get_ref` by ByteDance/ZTE authors, +15.5%/+21.15% full-encode FPS on SG2044/SpacemiT K1, still being actively updated through 2026-07). None is release-blocking and no riscv64 CI job exists to gate any of them. No direct RISE involvement in libx264 itself was found (not a RISE member project); libx264 appears only indirectly as a bundled GPL runtime dependency in RISE's `python-wheels` riscv64 build of PyAV ([github.com/riseproject-dev/python-wheels issue #2136](https://github.com/riseproject-dev/python-wheels/issues/2136) / [PR #461](https://github.com/riseproject-dev/python-wheels/pull/461)).

## 14. Investment Analysis

RISE has done no direct work on libx264 RISC-V support. The compile-enablement commit and all three pending RVV MRs were contributed independently by Sanechips/ZTE and ByteDance/ZTE engineers and by Niklas Haas, not by or through RISE. Critically, unlike a from-scratch port, real RVV implementations for bitstream and motion-compensation/pixel kernels already exist and are benchmarked - the primary blocking work is upstream review/merge and CI, not net-new kernel authorship for those specific subsystems.

### 14.1 Functional Enablement

Complete. The pure-C scalar build compiles and runs correctly on riscv64 via `0480cb05`. No further work is needed for functional correctness.

### 14.2 Performance Optimization

This is the primary investment area, but its shape has changed from a from-scratch port to a merge-and-fill-gaps effort:

- **Already written, awaiting merge:** bitstream escape (!185), pixel/motion-compensation DSP (!192), and `pixel_avg`/`mc_luma`/`get_ref` (!194). Getting these merged requires upstream engagement (review responses, checkasm verification on additional hardware, possibly rebasing/deduplicating overlapping work between !192 and !194, which both touch `common/riscv64/mc-a.S`) rather than new kernel design.
- **Not yet started by anyone:** DCT/IDCT, quantization, deblocking filter, intra prediction, and CABAC have no RISC-V MR at all. These are new-authorship work, using the AArch64 and LoongArch ports as structural references (similar module count, GNU-assembler `.S` file style).
- Before investing further in auto-vectorization-based approaches: LLVM's RVV cost-model bugs ([#176218](https://github.com/llvm/llvm-project/issues/176218), [#175826](https://github.com/llvm/llvm-project/issues/175826)) make compiler auto-vectorization unreliable for x264-class kernels; hand-written assembly/intrinsics (the approach all three pending MRs already use) is the safer path.
- Issue #81's fused-operator proposal (4-5% additional gain on 256-bit-VLEN hardware) is a genuine collaboration opportunity flagged by a silicon vendor but has no MR yet.

### 14.3 CI/CD Infrastructure

No riscv64 CI job exists, so none of the pending MRs can be automatically gated today. Two paths, matching the existing aarch64 pattern:
- A QEMU-based riscv64 test job analogous to `test-aarch64-qemu` - no hardware dependency, can be contributed immediately.
- A native riscv64 Docker runner registered with the VideoLAN GitLab instance, requiring a new `registry.videolan.org/x264-*-riscv64` image analogous to the existing aarch64 image.

### 14.4 Ecosystem Enablement

Not applicable as a direct investment area - libx264 has no significant dependent package ecosystem of its own requiring riscv64 enablement (it is consumed as a shared library, not distributed as packages in an ecosystem like PyPI or npm). The one concrete ecosystem touchpoint found is indirect: libx264 is bundled as a GPL runtime dependency inside RISE's `python-wheels` riscv64 build of PyAV ([issue #2136](https://github.com/riseproject-dev/python-wheels/issues/2136), [PR #461](https://github.com/riseproject-dev/python-wheels/pull/461)), where it rides on FFmpeg's/PyAV's own riscv64 enablement rather than requiring separate libx264-specific packaging effort.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Review, verify, and merge !185 (RVV bitstream escape) | 0.5-1 | VideoLAN maintainers + Changsheng Wu | Critical |
| Performance | Review, verify, reconcile overlap with !194, and merge !192 (RVV pixel/MC DSP) | 1-2 | VideoLAN maintainers + Niklas Haas | Critical |
| Performance | Review, verify, and merge !194 (RVV pixel_avg/mc_luma/get_ref) | 1-2 | VideoLAN maintainers + ByteDance/ZTE authors | Critical |
| Performance | Implement RVV DCT/IDCT and quantize kernels (no existing MR) | 3-4 | RISC-V vendor or community | High |
| Performance | Implement RVV deblocking filter (no existing MR) | 2-3 | RISC-V vendor or community | High |
| Performance | Implement RVV intra prediction (no existing MR) | 2-3 | RISC-V vendor or community | Medium |
| Performance | Implement RVV CABAC acceleration (no existing MR) | 2-3 | RISC-V vendor or community | Medium |
| Performance | Evaluate issue #81's fused small-macroblock operators (`satd_8x8x2` etc.) for 256-bit-VLEN hardware | 1-2 | RISC-V vendor or community | Low |
| Performance | End-to-end riscv64-vs-arm64/amd64 fps benchmark suite (none currently public) | 1 | RISC-V vendor or community | High |
| Compiler | Fix or work around LLVM #176218/#175826/#123069 (RVV cost-model and tail-folding gaps affecting x264-class code) | 3-5 | LLVM RISC-V backend team | High (prerequisite for reliable auto-vectorization fallback) |
| CI/CD | Add riscv64 QEMU test job to `.gitlab-ci.yml` | 1 | Contributor or VideoLAN | High |
| CI/CD | Build and publish a riscv64 Docker image to the VideoLAN registry | 1 | Contributor or VideoLAN | Medium |

Total estimated effort: roughly 18-26 person-weeks, of which 2.5-5 person-weeks is merge/review work on already-written code (!185/!192/!194) and the remainder is net-new kernel authorship (DCT, deblock, intra, CABAC), compiler-side fixes, and CI. This is markedly less than a from-scratch RVV port would require, since the highest-traffic motion-compensation and DSP paths already have working, benchmarked implementations awaiting only upstream merge.

## 15. References

- [code.videolan.org/videolan/x264 (upstream canonical; web UI Anubis-blocked, git/API reachable)](https://code.videolan.org/videolan/x264)
- [VideoLAN x264 homepage](https://www.videolan.org/developers/x264.html)
- [mirror/x264 on GitHub](https://github.com/mirror/x264)
- [.gitlab-ci.yml (GitHub mirror)](https://raw.githubusercontent.com/mirror/x264/master/.gitlab-ci.yml)
- [MR !121 - Add Risc-V 64 bit to config.guess](https://code.videolan.org/videolan/x264/-/merge_requests/121)
- [MR !155 - RISC-V: Add riscv64 support for x264 (closed, unmerged)](https://code.videolan.org/videolan/x264/-/merge_requests/155)
- [MR !184 - riscv64: add compile support](https://code.videolan.org/videolan/x264/-/merge_requests/184)
- [MR !185 - riscv64: add bitstream assembly optimization](https://code.videolan.org/videolan/x264/-/merge_requests/185)
- [MR !192 - riscv64: add some DSP functions](https://code.videolan.org/videolan/x264/-/merge_requests/192)
- [MR !194 - riscv64: mc: implement pixel_avg, mc_luma, and get_ref with RVV](https://code.videolan.org/videolan/x264/-/merge_requests/194)
- [Issue #52 - config.guess/config.sub riscv support](https://code.videolan.org/videolan/x264/-/work_items/52)
- [Issue #81 - fused low-level operators for wide SIMD](https://code.videolan.org/videolan/x264/-/work_items/81)
- [Debian buildd status for x264 (sid)](https://buildd.debian.org/status/package.php?p=x264&suite=sid)
- [Ubuntu package search - libx264, suite resolute](https://packages.ubuntu.com/search?keywords=libx264&suite=resolute)
- [Ubuntu 24.04 Noble - libx264-164](https://packages.ubuntu.com/noble/libx264-164)
- [Alpine Linux - x264 edge/community riscv64](https://pkgs.alpinelinux.org/packages?name=x264&branch=edge&arch=riscv64)
- [LLVM issue #123069 - RISC-V EVL tail folding](https://github.com/llvm/llvm-project/issues/123069)
- [LLVM issue #176218 - SLP vectorizer cost-model bug on RVV, x264-derived pattern](https://github.com/llvm/llvm-project/issues/176218)
- [LLVM issue #175826 - RISCVTTIImpl::getArithmeticInstrCost lacks scalar type support](https://github.com/llvm/llvm-project/issues/175826)
- [LLVM issue #119222 - increased spilling on rva22u64 after scheduling changes](https://github.com/llvm/llvm-project/issues/119222)
- [LLVM issue #153402 - inefficient RISC-V constant-pool access](https://github.com/llvm/llvm-project/issues/153402)
- [LLVM issue #126594 - enable IPRA for RISC-V](https://github.com/llvm/llvm-project/issues/126594)
- [RISE project homepage](https://riseproject.dev)
- [riseproject-dev/python-wheels issue #2136 - av riscv64 support](https://github.com/riseproject-dev/python-wheels/issues/2136)
- [riseproject-dev/python-wheels PR #461 - av: Add version 18.1.0](https://github.com/riseproject-dev/python-wheels/pull/461)
- [riseproject-dev/riscv-runner - RISE's free native RISC-V GitHub Actions CI](https://github.com/riseproject-dev/riscv-runner)
- [RISE wheel_builder listing](https://riseproject.gitlab.io/python/wheel_builder/)