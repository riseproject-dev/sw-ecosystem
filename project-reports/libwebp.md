---
title: libwebp
categories:
  - multimedia
  - browser
---

# libwebp

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libwebp<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libwebp is the reference encoder and decoder for the WebP image format, launched by Google in 2010 as part of the WebM initiative. It is written in C and provides a C API, plus optional command-line tools (cwebp, dwebp, gif2webp, vwebp). The canonical repository is hosted on Google's Chromium Gerrit infrastructure at [chromium.googlesource.com/webm/libwebp](https://chromium.googlesource.com/webm/libwebp) and is mirrored to [github.com/webmproject/libwebp](https://github.com/webmproject/libwebp). Copyright is held by "The WebM Project," which is Google's umbrella branding for the codec ecosystem. There is no independent foundation; governance is entirely Google-managed via Gerrit code review. Documentation is served from developers.google.com.

The active maintainer core is exclusively Google employees: James Zern (primary maintainer and merge authority, present in virtually all recent merge commits), Maryla Ustarroz-Calonge (active committer since at least 2024), and Vincent Rabaud. Historical external contributors with vendor affiliations visible in the AUTHORS file include Istvan Stefan and Yang Zhang (ARM Ltd., NEON optimizations), Djordje Pesut and Jovan Zelincevic (Imagination Technologies, MIPS optimizations), and Tamar Levy (Intel, x86 SIMD). This pattern -- silicon vendors contribute architecture-specific DSP optimizations, Google reviews and merges -- defines the practical contribution model for new architecture work.

The [webmproject.org supporters list](https://www.webmproject.org/about/supporters/) includes hardware companies AMD, ARM, Broadcom, Chips&Media, Hisilicon, Imagination Technologies, Marvell, MIPS, Qualcomm, Rockchip, Texas Instruments, Verisilicon, and ZTE. No RISC-V semiconductor vendors (SiFive, StarFive, Alibaba T-Head) appear on this list. The list predates the modern RISC-V era and has not been updated to reflect it.

libwebp has no formal platform tier policy document (no PLATFORMS.md, SUPPORT.md, or CODEOWNERS file). The CONTRIBUTING.md covers only CLA requirements, Gerrit workflow, and code style -- no architecture contribution guidelines.

Google is a RISE Premier Member, but libwebp is not a RISE target project. No RISE blog posts, no riseproject-dev repositories, and no funded work related to libwebp were found in any RISE channel.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2010 | Project launched by Google as part of WebM initiative | [webmproject.org](https://www.webmproject.org/about/) |
| ~2012-2014 | ARM NEON DSP optimizations contributed by ARM Ltd. (Istvan Stefan, Yang Zhang) | AUTHORS file, src/dsp/ commit history |
| ~2013-2015 | MIPS DSP optimizations contributed by Imagination Technologies | AUTHORS file, src/dsp/ commit history |
| ~2015-2017 | Intel x86 SSE2/SSE4.1/AVX2 optimizations contributed by Tamar Levy (Intel) | AUTHORS file, src/dsp/ commit history |
| 2025 | v1.5.0 released (latest stable at report date) | [github.com/webmproject/libwebp/releases](https://github.com/webmproject/libwebp/releases) |
| 2026-06 | **No RISC-V work of any kind has ever been initiated** | Direct source inspection, all search results zero |

There is no RISC-V port history. No commit in the main branch history matches the query `q=riscv`. No GitHub issue or pull request (open or closed) on the GitHub mirror references "riscv", "risc-v", or "rvv". The architecture has never been addressed upstream.

---

## 3. Upstream Support Tier

libwebp has no published tier policy. The effective tier is determined by what is present in the CI build matrix and the source tree.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD optimizations in source | SSE2, SSE4.1, AVX2 | NEON | None |
| CI cross-compile target in infra/compile.sh | Yes (x86_64 explicit) | Yes (aarch64 explicit) | No |
| GitHub Actions CI | None (no .github directory exists) | None | None |
| Release-blocking test coverage | No formal blocking policy documented | No formal blocking policy documented | No |
| Official prebuilt binaries | No (upstream uses Git tags only, no Release assets) | No | No |
| Entry in CPUFeature enum | kSSE2, kSSE3, kSSE4_1, kAVX, kAVX2 | kNEON | Absent |

The only automated CI that exists upstream is limited to the build script `infra/compile.sh`, which is a local cross-compile helper. It explicitly enumerates all supported cross-compilation targets: aarch64, arm (armv7, NEON), mips (8 variants), i686, x86_64, MinGW, and WebAssembly. riscv64 is absent. There is no `.github/workflows/` directory (the path returns 404 on the GitHub mirror), no `.cirrus.yml`, no `.gitlab-ci.yml`, and no `Jenkinsfile`.

The effective upstream tier for riscv64 is: **unsupported / not recognized**.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libwebp's performance-critical work is concentrated in the DSP layer (`src/dsp/`) and the SharpYUV subcomponent (`sharpyuv/`). These implement lossy encoder prediction and quantization, lossy decoder reconstruction, lossless encoder and decoder, upsampling and rescaling, alpha channel processing, YUV-to-RGB conversion, cost model evaluation, and SSIM computation. Each function family has an architecture-specific SIMD implementation and a scalar C fallback. Runtime dispatch is controlled by the `CPUFeature` enum in `src/dsp/cpu.h` and the `VP8GetCPUInfo` function pointer initialized in `src/dsp/cpu.c`.

**SIMD dispatch matrix -- files present in src/dsp/ and sharpyuv/**

| Component | x86 SSE2 | x86 SSE4.1 | x86 AVX2 | ARM NEON | MIPS MSA | RISC-V RVV |
|---|---|---|---|---|---|---|
| Encoder (enc) | Yes (~1000 lines) | Yes | No | Yes | Yes | **Missing** |
| Decoder (dec) | Yes | Yes | No | Yes | Yes | **Missing** |
| Lossless encode | Yes | Yes | Yes | Yes | Yes | **Missing** |
| Lossless decode | Yes | Yes | No | Yes | Yes | **Missing** |
| Upsampling | Yes | Yes | No | Yes | Yes | **Missing** |
| Rescaler | Yes | No | No | Yes | Yes | **Missing** |
| Alpha processing | Yes | Yes | No | Yes | Yes | **Missing** |
| Filters | Yes | No | No | Yes | Yes | **Missing** |
| YUV conversion | Yes | Yes | No | Yes | Yes | **Missing** |
| Cost model | Yes | No | No | Yes | Yes | **Missing** |
| SSIM | Yes | No | No | Scalar | Scalar | **Missing** |
| SharpYUV | Yes | No | No | Yes | Scalar | **Missing** |
| CPU feature detection | Full | Full | Full | Full | Full | **Absent from enum** |

Total RISC-V source files in `src/dsp/`: 0 (confirmed from 78-file directory listing). Total RISC-V source files in `sharpyuv/`: 0. The `CPUFeature` enum in `src/dsp/cpu.h` lists: kSSE2, kSSE3, kSlowSSSE3, kSSE4_1, kAVX, kAVX2, kNEON, kMIPS32, kMIPSdspR2, kMSA -- no kRVV entry. The `cmake/cpu.cmake` SIMD target list is: `"AVX2;SSE41;SSE2;MIPS32;MIPS_DSP_R2;NEON;MSA"` -- RVV is absent. No `#ifdef __riscv` guard appears anywhere in the codebase.

On riscv64, `VP8GetCPUInfo` is set to NULL (the fallback branch for all unrecognized architectures), and every DSP function uses the scalar C implementation.

There are no other architecture-specific subsystems (no JIT, no crypto, no GC). The performance exposure is entirely SIMD.

---

## 5. Build System, Cross-Compilation, and Toolchain

libwebp supports CMake (recommended), Autotools (legacy), and nmake (Windows only).

**CMake cross-compile for riscv64 (derived from documented MIPS patterns; no riscv64-specific docs exist):**

```
cmake \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DWEBP_ENABLE_SIMD=OFF \
  -DWEBP_BUILD_CWEBP=ON \
  -DWEBP_BUILD_DWEBP=ON \
  -DWEBP_USE_THREAD=ON \
  -DWEBP_BUILD_VWEBP=OFF \
  ..
```

`-DWEBP_ENABLE_SIMD=OFF` disables all SIMD globally and is required for riscv64 because no SIMD targets are defined for that architecture. Without it, the build will succeed (no errors are triggered), but the absence of a RISC-V SIMD case means the cmake logic simply skips all SIMD enable flags, producing the same scalar-only result. The flag is nonetheless recommended for clarity.

**Autotools cross-compile (derived from documented MIPS pattern in doc/building.md):**

```
./autogen.sh
./configure \
  --host=riscv64-linux-gnu \
  --build=$(./config.guess) \
  --enable-everything
make -j$(nproc)
```

The configure script auto-detects architecture from `--host` and will not enable x86 or ARM SIMD for a riscv64 target.

**Toolchain version requirements for riscv64:** No GCC or Clang minimum version is documented for RISC-V because the architecture is not a supported target upstream. The existing GCC version workarounds in `configure.ac` (GCC 4.3 for `-flax-vector-conversions` on x86; GCC 4.9 for `-frename-registers` on AArch64) do not apply to riscv64. Any modern GCC (10+) or Clang (12+) targeting `riscv64-linux-gnu` will compile the scalar C code without issue.

**QEMU usage:** Not documented anywhere in the repository. No `qemu-riscv64` references exist in `infra/`, `cmake/`, or any documentation file. Debian and Arch Linux RISC-V packages build successfully on native riscv64 hardware (Debian buildd rv-osuosl-01).

**Known build failures on riscv64:** None. The library builds cleanly on riscv64 in Debian sid (1.5.0-0.1+b2, status "Installed" on rv-osuosl-01) and Arch Linux RISC-V (1.6.0-2). No riscv64-specific build failures are reported in any distribution tracker.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Lossy encode | Full (SIMD-accelerated) | Full (SIMD-accelerated) | Functional (scalar C only) |
| Lossy decode | Full (SIMD-accelerated) | Full (SIMD-accelerated) | Functional (scalar C only) |
| Lossless encode | Full (SIMD-accelerated) | Full (SIMD-accelerated) | Functional (scalar C only) |
| Lossless decode | Full (SIMD-accelerated) | Full (SIMD-accelerated) | Functional (scalar C only) |
| Alpha channel processing | Full (SIMD-accelerated) | Full (SIMD-accelerated) | Functional (scalar C only) |
| SharpYUV | Full (SIMD-accelerated) | Full (SIMD-accelerated) | Functional (scalar C only) |
| Animated WebP | Full | Full | Full |
| Multi-threaded encode | Full | Full | Full |
| All command-line tools | Full | Full | Full (no OpenGL dependency for vwebp if GPU absent) |

**Functional gaps:** None. All encode/decode operations are functionally complete on riscv64. The library does not refuse to operate, does not skip code paths, and does not produce incorrect output. No correctness bugs are reported in any tracker for riscv64.

**Performance gap:** All performance-critical operations run at scalar C speed on riscv64. Based on documented speedups from SIMD optimizations on other platforms:

- ARM NEON (v0.4.1): approximately 25% faster lossy decode/encode at `-m 4`, approximately 10% faster lossless decode, 5-10% faster lossless encode
- x86 SSE2 (v0.1.3): 40% improvement in overall decoding performance; 2x faster SSIM computation

The expected performance deficit for riscv64 vs. arm64 is in the range of 25-40% for typical encode/decode workloads [NEEDS VERIFICATION -- no riscv64 benchmark data exists; this estimate is derived from the magnitude of NEON/SSE2 speedups documented in the libwebp changelog].

No published benchmark data comparing libwebp throughput on riscv64 vs. arm64 or amd64 was found in any source.

**Security hardening gaps:** Data not available. No riscv64-specific security hardening analysis was found in any upstream source or distribution security tracker.

**Floating-point / NaN semantics:** No riscv64 floating-point correctness issues are reported. A search of GitHub issues for "riscv64" and "NaN" returned zero results. libwebp uses floating-point only in quantization and distortion computation; the operations are not numerically sensitive enough to be exposed to RISC-V FP edge cases in practice.

---

## 7. CI/CD Infrastructure

**No `.github/workflows/` directory exists** in the webmproject/libwebp repository. The path returns 404 on the GitHub mirror API. There are zero GitHub Actions workflow files of any kind. This supersedes an earlier finding in the research that described a CodeQL workflow; direct API inspection of the repository root confirmed no `.github` directory is present.

The upstream CI infrastructure consists solely of `infra/compile.sh`, a shell script that performs cross-compilation for a fixed set of targets. It is a build helper, not a CI system with test execution.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (x86_64 in infra/compile.sh) | Yes (aarch64 in infra/compile.sh) | No |
| Test execution CI | No (infra script builds only; no test runner) | No | No |
| QEMU-based test CI | No | No | No |
| GitHub Actions | None for any architecture | None for any architecture | None |
| RISE runners | No | No | No |
| Hardware-in-the-loop | No | No | No |

The CI situation for all architectures is weak. For riscv64 specifically, there is no build verification, no test execution, and no automated regression detection at any level.

---

## 8. Distribution and Release Status

The upstream project (webmproject) does not publish prebuilt binaries. The [GitHub releases API](https://api.github.com/repos/webmproject/libwebp/releases) returns an empty array -- the project uses Git tags only (latest: v1.6.0, v1.5.0). No binary assets of any kind are distributed by upstream.

**Distribution package availability for riscv64:**

| Distribution | Package | Version | riscv64 Status |
|---|---|---|---|
| Debian sid | libwebp7, libwebp-dev, libwebpdecoder3, libwebpdemux2, libwebpmux3 | 1.5.0-0.1+b2 | Installed; built on rv-osuosl-01 |
| Ubuntu 24.04 (Noble) | libwebp7, libwebp-dev, libwebpdecoder3, libwebpdemux2, libwebpmux3 | 1.3.2-0.4build3 | Available; riscv64 .deb confirmed |
| Arch Linux RISC-V | libwebp, libwebp-utils | 1.6.0-2 | Available; 276.3 KB binary package confirmed on two mirrors |
| PyPI (libwebp package) | libwebp | N/A | Package does not exist (404 on /simple/libwebp/) |
| PyPI (webp package) | webp 0.4.0 | 0.4.0 | Only aarch64, x86_64, macOS, Windows wheels; no riscv64 |
| RISE wheel builder | libwebp | N/A | Not listed; redirects to PyPI 404 |

To obtain a working riscv64 binary today, a user installs `libwebp-dev` from their distribution. No additional steps are required. The library builds cleanly from source with the CMake invocation in Section 5 if a distribution package is not available.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking |
|---|---|---|---|---|---|
| libpng | Optional I/O: PNG read/write for conversion tools | Yes (Debian sid ships; RVV path available but off by default) | No upstream CI; contributor hardware only | Debian sid 1.6.x (pre-RVV default); RVV opt in 1.6.49+ | No |
| libjpeg-turbo | Optional I/O: JPEG read/write for conversion tools | Yes (Debian sid 3.1.3; pre-RVV) | No upstream CI | RVV SIMD in 3.2 beta (dev branch) only; Debian/Ubuntu on 2.x/3.1.x | No |
| libtiff | Optional I/O: TIFF read for conversion tools | Yes (Debian sid 4.7.1-3, built ~6 days before report date) | No gaps; pure C | Current in Debian sid | No |
| giflib | Optional I/O: GIF read for gif2webp, anim_diff | Yes (Debian sid 6.1.3-1 Installed; Alpine edge 5.2.2-r1) | No architecture-specific tests; compiles on any C99 target | Current on all distros | No |
| pthreads / libm | Threading; floating-point math in quantization | Full; glibc and musl both support riscv64 | No issues | Ships in all riscv64 Linux distributions | No |
| SDL2 | Optional: vwebp display tool only; not part of encode/decode library | SDL2 2.30.x ships for riscv64 on Debian | Not commonly tested on riscv64 server targets | Available in Debian sid | No |

All dependencies are optional. The core libwebp encode/decode library has no mandatory external dependencies beyond libc. None of the dependencies are a blocking issue for riscv64 builds.

**Dependency deep-dives for SIMD-critical deps:**

**libpng:** RVV SIMD merged upstream in v1.6.49 (May 2025), enabled via `-DPNG_RISCV_RVV=ON` at build time (off by default). A Paeth correctness bug was fixed in v1.6.52 (December 2025) and an intrinsic removal fix in v1.6.53. No open riscv64 issues as of June 2026. See `project-reports/libpng.md` for full details.

**libjpeg-turbo:** RVV SIMD merged to the upstream dev branch (3.2 beta, February 2026) covering SIMD-accelerated DCT and color conversion. The upstream project explicitly declined to publish riscv64 release binaries (Issue #885). The DCT follow-on optimization is pending (Issue #895, branch `rvv-dct-opt`). Debian and Ubuntu currently ship 2.x/3.1.x without RVV. See `project-reports/libjpeg-turbo.md` for full details.

**libtiff:** Pure C; no SIMD of any kind (no SSE, no NEON, no RVV). Not a performance bottleneck and not a porting concern.

**giflib:** Pure C throughout. Zero SIMD ever. No porting work required. See `project-reports/giflib.md`.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none) | -- | -- | -- | -- |

Zero open or closed issues matching "riscv64" exist in the [webmproject/libwebp GitHub mirror](https://github.com/webmproject/libwebp/issues). The WebM project issue tracker (issues.webmproject.org) requires authentication and was not publicly queryable. No riscv64-specific bugs appear in the Debian buildd logs (status: Installed, no failures), the Arch Linux RISC-V failure tracker (libwebp absent from failure/patch list), or Gentoo Bugzilla.

There are no open correctness bugs, no open performance bug reports, and no open CI addition requests for riscv64 in any accessible tracker.

---

## 12. Objections and Upstream Blockers

**No stated objections exist** because the question has never been raised upstream. There are no issues, no mailing list threads, and no Gerrit discussion about riscv64 or RVV support.

**Organizational model:** The CONTRIBUTING.md establishes that contributors must sign a CLA and submit via Gerrit. Google employees review and merge. The historical precedent for architecture-specific DSP optimizations is that silicon vendors contributed the patches (ARM Ltd. for NEON, Imagination Technologies for MIPS DSP, Intel for x86 SIMD) and Google merged them. There is no stated objection to new architecture ports; there is simply no one who has submitted one.

**Technical path:** Adding riscv64 SIMD (RVV) support requires:

1. Adding `kRVV` to the `CPUFeature` enum in `src/dsp/cpu.h`
2. Adding `__riscv` detection to `src/dsp/cpu.c`
3. Adding `RVV` to the SIMD target list in `cmake/cpu.cmake` with the appropriate `-march` flag
4. Writing `*_rvv.c` source files for each DSP function family (encoder, decoder, lossless, upsampling, SharpYUV, etc.) -- approximately 12 function families
5. Adding a riscv64 cross-compile target to `infra/compile.sh`

No technical blockers prevent this work. The scalar C fallback is complete and correct; RVV files are additive.

**Acceptance probability:** High, given the vendor-contribution precedent. Google has accepted SIMD patches from multiple external vendors historically. The only condition is that the code passes review and correctness testing.

---

## 13. Investment Analysis

RISE has no existing or funded work on libwebp. Google has not initiated RVV optimizations internally. The full scope of work described below is unaddressed.

### 13.1 Functional Enablement

libwebp is fully functional on riscv64 today using scalar C fallbacks. No functional enablement work is required. The library builds, installs, and operates correctly on riscv64 without any code changes.

### 13.2 Performance Optimization

The entire DSP layer (approximately 12 function families, approximately 78 architecture-specific source files exist for other platforms) has no RISC-V equivalent. Writing RVV intrinsic implementations for the full DSP surface is the primary engineering task. Priority order based on encode/decode hot paths:

1. YUV conversion and upsampling (decoder hot path)
2. Lossy encoder prediction and transform (encoder hot path)
3. Lossless encode/decode (Huffman and color transform)
4. SharpYUV
5. Alpha processing, filters, rescaler, cost model, SSIM

Each function family requires: writing the RVV intrinsic file, adding it to CMakeLists.txt, adding the dispatch hook, and running correctness + performance tests.

### 13.3 CI/CD Infrastructure

Adding riscv64 to `infra/compile.sh` is a small change (one case block, approximately 5 lines). Upstream has no GitHub Actions CI at all; adding a QEMU-based riscv64 test job would require contributing a `.github/workflows/` directory, which is a larger organizational change given it does not currently exist. The minimum viable CI addition is the cross-compile target in `infra/compile.sh`.

### 13.4 Ecosystem Enablement

libwebp has no Python package ecosystem requiring separate enablement (the PyPI `libwebp` package does not exist; the `webp` package does not ship Linux riscv64 wheels, but this is a third-party binding, not the upstream project). No npm, Maven, or OCI ecosystem applies. No Section 10 ecosystem investment is warranted.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None required -- scalar C is complete and correct | 0 | -- | N/A |
| Performance | RVV intrinsics for YUV conversion and upsampling (decoder hot path) | 3-4 | RISC-V vendor engineer | High |
| Performance | RVV intrinsics for lossy encoder prediction and quantization | 4-5 | RISC-V vendor engineer | High |
| Performance | RVV intrinsics for lossless encode/decode | 3-4 | RISC-V vendor engineer | Medium |
| Performance | RVV intrinsics for SharpYUV | 1-2 | RISC-V vendor engineer | Medium |
| Performance | RVV intrinsics for alpha, filters, rescaler, cost model, SSIM | 3-4 | RISC-V vendor engineer | Low |
| CI/CD | Add riscv64 cross-compile target to infra/compile.sh | 0.5 | Any contributor | High |
| CI/CD | Add QEMU-based riscv64 test job (GitHub Actions) | 1-2 | Any contributor | Medium |

Total estimated effort: 15-21 person-weeks for full RVV optimization coverage plus CI. Decoder hot path (YUV + upsampling) alone is 3-4 person-weeks and recovers the bulk of the performance gap.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [webmproject/libwebp GitHub mirror](https://github.com/webmproject/libwebp)
- [libwebp upstream Chromium Gerrit](https://chromium.googlesource.com/webm/libwebp)
- [WebM Project supporters](https://www.webmproject.org/about/supporters/)
- [libwebp src/dsp/ directory (GitHub)](https://github.com/webmproject/libwebp/tree/main/src/dsp)
- [libwebp src/dsp/cpu.h (GitHub)](https://github.com/webmproject/libwebp/blob/main/src/dsp/cpu.h)
- [libwebp cmake/cpu.cmake (GitHub)](https://github.com/webmproject/libwebp/blob/main/cmake/cpu.cmake)
- [libwebp infra/compile.sh (GitHub)](https://github.com/webmproject/libwebp/blob/main/infra/compile.sh)
- [Debian buildd libwebp riscv64 status](https://buildd.debian.org/status/package.php?p=libwebp&suite=sid)
- [Ubuntu 24.04 libwebp7 riscv64 package](https://packages.ubuntu.com/noble/riscv64/libwebp7)
- [Arch Linux RISC-V mirror (ISCAS)](https://mirror.iscas.ac.cn/archriscv/repo/extra/)
- [Arch Linux RISC-V mirror (felixc.at)](https://archriscv.felixc.at/)
- [libwebp GitHub releases API](https://api.github.com/repos/webmproject/libwebp/releases)
- [PyPI webp package](https://pypi.org/project/webp/)
- [RISE Project member list](https://riseproject.dev/)
- [libpng RISC-V status report](./multimedia/libpng.md)
- [libjpeg-turbo RISC-V status report](./multimedia/libjpeg-turbo.md)
- [giflib RISC-V status report](./multimedia/giflib.md)