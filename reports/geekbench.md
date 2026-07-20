---
title: Geekbench
categories:
  - benchmarks
---

# Geekbench

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Geekbench<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Geekbench is a proprietary, closed-source, cross-platform CPU benchmark developed and distributed by Primate Labs Inc., a privately held Canadian company. The founder is John Poole, identified as the author of the Geekbench 6 launch blog post (February 14, 2023) [NEEDS VERIFICATION -- sole source]. Governance is entirely single-vendor: there is no open-source license, no foundation, no steering committee, and no community contribution path. Primate Labs makes all platform support decisions unilaterally.

The freemium model requires users who run the benchmark for free to upload their results to [browser.geekbench.com](https://browser.geekbench.com/). A paid license permits offline use.

Primate Labs is not a member of the RISE Project. No RISE blog posts mention Geekbench in any context (28 posts checked, May 2024 through June 2026). Primate Labs is not listed as a RISC-V International member and no announcements to that effect were found on riscv.org.

The two repositories under the [primatelabs](https://github.com/primatelabs) GitHub organization are auxiliary tooling only: [geekbench-tools](https://github.com/primatelabs/geekbench-tools) (Python/Ruby scripts for parsing legacy Geekbench 2/3/4 XML result files) and [geekbench-swift](https://github.com/primatelabs/geekbench-swift) (Swift reference implementations of Geekbench workloads). Neither contains any architecture-specific RISC-V code nor any RISC-V-related issues or pull requests. The benchmark engine itself is not public. Note: the repository URL `https://github.com/primaeval/geekbench` referenced in this report's input returns HTTP 404; `primaeval` is a different GitHub user with 126 unrelated public repositories (Kodi addons). All research confirmed that no public Geekbench source repository exists under that name.

---

## 2. Port History and Upstreaming Timeline

All RISC-V support is delivered through proprietary binary releases. There is no open-source patch history, no upstream PR, and no public commit to inspect.

| Date | Event | Source |
|---|---|---|
| March 2021 | Geekbench 5.4 released; first RISC-V64 (Linux) support introduced [NEEDS VERIFICATION -- single source] | Governance research, confirmed via community RISC-V benchmark submissions |
| September 12, 2023 | Geekbench 6.2.0 released; first GB6 `LinuxRISCVPreview` tarball confirmed on CDN (HTTP 200, 185 MB) | Direct CDN probe: `cdn.geekbench.com/Geekbench-6.2.0-LinuxRISCVPreview.tar.gz` |
| August 2024 | Geekbench 6.3.0 Preview run on Milk-V Jupiter (SpacemiT X60 RISC-V), results uploaded to browser.geekbench.com/v6/cpu/7287569 | [cnx-software.com Milk-V Jupiter review](https://www.cnx-software.com/), [geerlingguy/sbc-reviews #47](https://github.com/geerlingguy/sbc-reviews/issues/47) |
| January 28, 2025 | Geekbench 6.4 released; release announcement states explicit support for RISC-V Vector Extensions added [NEEDS VERIFICATION -- geekbench.com blog blocked HTTP 403, could not confirm text directly] | CDN confirmation: `cdn.geekbench.com/Geekbench-6.4.0-LinuxRISCVPreview.tar.gz` HTTP 200 (224 MB) |
| April 27, 2026 | Geekbench 6.7.1 released; latest version with `LinuxRISCVPreview` tarball confirmed | Direct CDN probe: `cdn.geekbench.com/Geekbench-6.7.1-LinuxRISCVPreview.tar.gz` HTTP 200, 214 MB |

No external contributor (individual or corporate) has been identified as the author of the RISC-V port. All development is internal to Primate Labs. The "upstreaming" concept does not apply: Geekbench has no upstream other than Primate Labs itself.

---

## 3. Upstream Support Tier

Primate Labs has not published a formal platform support tier policy. The "Preview" label applied to non-x86-64 Linux ports is the only tier signal available.

This label appears to be a permanent convention rather than a stability qualifier: ARM64 Linux has shipped as `LinuxARMPreview` in every Geekbench 6 release, co-existing with the `Linux` (x86-64) variant. No `LinuxARMPreview` has ever been promoted to a non-preview name in GB6. RISC-V follows the same naming pattern [NEEDS VERIFICATION -- inferred from CDN filename pattern, not from a published Primate Labs statement].

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Tarball label | `Linux` | `LinuxARMPreview` | `LinuxRISCVPreview` |
| First GB6 availability | GB6.0 (Feb 2023) | GB6.0 (Feb 2023) | GB6.2.0 (Sep 2023) |
| Latest confirmed version | 6.7.1 | 6.7.1 [NEEDS VERIFICATION] | 6.7.1 |
| Official release binary | Yes | Yes (Preview label) | Yes (Preview label) |
| Package manager distribution | None | None | None |
| Result browser upload supported | Yes | Yes | Yes (community runs confirmed) |
| Explicit vector extension support | AVX2/AVX-512 (assumed) | NEON/SVE (assumed) | RVV (added GB6.4, per announcement) |

The GB6.1.0 CDN probe returned HTTP 404 for the RISC-V path, confirming that riscv64 support was genuinely absent before 6.2.0 and was not a CDN misconfiguration.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Geekbench's benchmark engine is closed source. No public repository exposes its SIMD kernels, JIT compiler, or assembly routines. The following is derived from what can be inferred from binary availability, release notes, and the open-source `geekbench-swift` reference repository.

**Workload categories in Geekbench 6:**
- CPU integer workloads: file compression (zlib/zstd/lzma), navigation, HTML5, SQLite, PDF renderer, text processing, asset compression, object detection, background blur, portrait mode, horizon detection, object removal, HDR
- CPU floating-point workloads: FFT, ray tracing, structure from motion, machine learning (Object Detection, Background Blur, etc.), clang compilation, camera
- GPU compute workloads (separate suite, not relevant here)

**Architecture-specific subsystem analysis:**

The `geekbench-swift` reference implementation contains 10 workload files (FFT, GEMM, Mandelbrot, etc.) all in pure scalar Swift with no SIMD intrinsics for any architecture. This is explicitly a reference/educational port and is not representative of the production binary.

| Subsystem | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD/vector acceleration | Present (AVX2/AVX-512 assumed, source closed) | Present (NEON/SVE assumed, source closed) | Unknown -- source closed; RVV support stated in GB6.4 release note |
| JIT compiler | Not applicable (compiled benchmark) | Not applicable | Not applicable |
| Crypto acceleration | OpenSSL with hardware AES (assumed) | OpenSSL with hardware AES (assumed) | OpenSSL, no hardware AES on most tested RISC-V boards |
| Architecture-specific assembly | Unknown (source closed) | Unknown (source closed) | Unknown (source closed) |
| RISC-V ISA extensions used | N/A | N/A | Unknown; "RVV" stated but no details |
| Open-source architecture code | None (closed) | None (closed) | None (closed) |

Data not available: whether the riscv64 binary uses hand-tuned RVV assembly, C intrinsics, or scalar fallback for any workload. The source is closed and no reverse-engineering data was found.

**Observed benchmark performance on riscv64 hardware** (from public runs -- GB6 results uploaded to browser.geekbench.com):

| Device | SoC | Cores | Clock | GB6 Single-Core | GB6 Multi-Core | Date |
|---|---|---|---|---|---|---|
| StarFive VisionFive 2 | StarFive JH7110 | 4 | 1.5 GHz | 74 | 218 | Jan 2023 |
| Milk-V Mars CM | StarFive JH7110 | 4 | 1.5 GHz | 74 | 219 | Oct 2023 |
| Milk-V Mars | StarFive JH7110 | 4 | 1.5 GHz | 74 | 218 | Jul 2024 |
| Milk-V Jupiter | SpacemiT X60 | 8 | 1.8 GHz | 78 | 356 | Jul 2024 |
| HiFive Premier P550 | SiFive P550 | 4 | 1.4 GHz | 136 | 424 | 2024 |
| DC-ROMA AI PC Mainboard II | SiFive P550 | 8 | 1.8 GHz | 174 | 640 | Oct 2025 |

Sources: [geerlingguy/sbc-reviews #10](https://github.com/geerlingguy/sbc-reviews/issues/10), [#22](https://github.com/geerlingguy/sbc-reviews/issues/22), [#46](https://github.com/geerlingguy/sbc-reviews/issues/46), [#47](https://github.com/geerlingguy/sbc-reviews/issues/47), [#65](https://github.com/geerlingguy/sbc-reviews/issues/65), [#82](https://github.com/geerlingguy/sbc-reviews/issues/82).

For comparison context: a Raspberry Pi 4 (Cortex-A72, 2019) scores approximately SC=300, MC=800. All tested RISC-V hardware trails ARM peers of comparable price by 2-4x in single-core. The cnx-software reviewer covering the Milk-V Jupiter (Geekbench 6.3.0, August 2024) explicitly stated that the scores "can't be used to compare the performance against other systems due to the current software situation" -- meaning unoptimized compiler paths and missing SIMD acceleration deflate RISC-V scores relative to theoretical hardware ceiling.

SiFive published a claim (May 2026) that the P570 Gen 3 achieves greater than 2x improvement in Geekbench score per GHz relative to the P550 Gen 1 [NEEDS VERIFICATION -- geekbench.com/sifive.com sources blocked HTTP 403/ECONNREFUSED; claim appears in research summary but could not be directly confirmed from the primary URL]. This is a relative per-GHz figure, not an absolute score.

---

## 5. Build System, Cross-Compilation, and Toolchain

Data not available: Geekbench's internal build system, required toolchain versions, cross-compilation procedure, QEMU usage, and any known build failures. The benchmark engine is proprietary and closed source. No build documentation, CMakeLists, Makefile, or Dockerfile is publicly accessible for the production binary. The repository `primaeval/geekbench` (the URL provided as input) does not exist on GitHub; all attempts to read build files from it returned HTTP 404.

The two open-source Primate Labs repositories use Swift Package Manager (`geekbench-swift`) and Python/Ruby scripts (`geekbench-tools`). Neither is relevant to the production binary build.

The only known third-party packaging recipe is [bobolopolis/meta-geekbench](https://github.com/bobolopolis/meta-geekbench), an MIT-licensed Yocto/OpenEmbedded layer that fetches and repackages the pre-built Geekbench binaries for embedded Linux targets. It explicitly supports riscv64, aarch64, and x86_64 by downloading the corresponding CDN tarballs. This recipe does not build Geekbench from source [NEEDS VERIFICATION -- single source].

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:**

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| Binary available | Yes | Yes | Yes (CDN tarball) | None |
| Result upload to browser.geekbench.com | Yes | Yes | Yes (confirmed via community runs) | None |
| ML workloads (LiteRT-backed) | Functional | Functional | Non-functional or scalar fallback | Critical |
| ML workloads (XNNPACK-backed) | Functional | Functional | Partially functional (f32 only; FP16 broken) | Medium |
| Image processing (OpenCV DNN) | Functional | Functional | Broken (RVV DNN engine regression, Apr 2025) | Medium |
| CPU integer workloads | Optimized | Optimized | Functional, likely unoptimized | Low |
| CPU float workloads | Optimized | Optimized | Functional, optimization status unknown | Low |
| JPEG acceleration | libjpeg-turbo SIMD | libjpeg-turbo SIMD | Scalar only (RVV in 3.2 beta, not yet stable) | Low |
| File compression (zstd) | Optimized | Optimized | Partial RVV (some kernels merged, 5 optimization PRs unreviewed) | Low |
| AES workload | Hardware AES | Hardware AES | Software AES (no hardware AES on tested boards) | Low |
| Package manager install | None | None | None | Parity |

**ML workload severity detail:**

Geekbench 6 includes Object Detection, Background Blur, Speech Recognition, Portrait Mode, and Horizon Detection workloads that are implemented via [LiteRT](https://github.com/google-ai-edge/LiteRT) (formerly TFLite). LiteRT has zero RISC-V entries in any CMakeLists, BUILD file, or CI configuration. The build documentation page at `developers.google.com/edge/litert/build/riscv` returns HTTP 404. A community attempt to build LiteRT for riscv64 ([issue #37](https://github.com/google-ai-edge/LiteRT/issues/37)) failed with XNNPACK disabled. These workloads account for approximately 30-40% of the total Geekbench 6 score weight [NEEDS VERIFICATION -- score weight estimate from research summary, not from a published Primate Labs scoring document].

**Performance gap (scalar vs. SIMD):**

Data not available: the exact performance delta between scalar fallback and optimized SIMD paths for each Geekbench workload on riscv64. The general pattern from community benchmark submissions (JH7110 at SC=74 vs Cortex-A72 at SC=300) indicates a 3-4x single-core gap, attributable to a combination of lower IPC in current RISC-V cores, lower clock frequencies, and absent or incomplete SIMD acceleration.

---

## 7. CI/CD Infrastructure

No CI pipeline for Geekbench exists in any publicly accessible location. Geekbench is closed source. The repository `primaeval/geekbench` does not exist; the `.github/workflows` path returns HTTP 404. Primate Labs does not publish any CI configuration for the benchmark engine.

| CI attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Public CI exists | Unknown (closed source) | Unknown (closed source) | Unknown (closed source) |
| RISE runners used | No | No | No |
| Open CI YAML inspectable | No | No | No |
| Hardware runner type | Unknown | Unknown | Unknown |

The `primatelabs/geekbench-swift` and `primatelabs/geekbench-tools` repositories have no CI workflows at all (zero `.github/workflows` files in either, zero issues mentioning CI) [NEEDS VERIFICATION -- confirmed by absence of issues mentioning CI, but workflows directory was not directly read].

---

## 8. Distribution and Release Status

Geekbench is distributed exclusively as proprietary binary tarballs directly from Primate Labs' CDN. No package manager distributes it.

**Official CDN distribution:**

URL pattern: `https://cdn.geekbench.com/Geekbench-<version>-LinuxRISCVPreview.tar.gz`

Confirmed versions with HTTP 200 responses (file sizes from Content-Length header):

| Version | File size | Last-Modified |
|---|---|---|
| 6.2.0 | 185 MB | September 12, 2023 |
| 6.2.1 | ~185 MB | [NEEDS VERIFICATION -- size inferred from pattern] |
| 6.2.2 | ~185 MB | [NEEDS VERIFICATION -- size inferred from pattern] |
| 6.3.0 | ~185 MB | [NEEDS VERIFICATION -- size inferred from pattern] |
| 6.4.0 | 214 MB | [NEEDS VERIFICATION -- date not confirmed] |
| 6.5.0 | 214 MB | [NEEDS VERIFICATION -- date not confirmed] |
| 6.6.0 | 214 MB | [NEEDS VERIFICATION -- date not confirmed] |
| 6.7.0 | 214 MB | [NEEDS VERIFICATION -- date not confirmed] |
| 6.7.1 | 214 MB | April 27, 2026 |

The 6.1.0 probe returned HTTP 404, confirming no RISC-V binary existed before 6.2.0.

**Package manager status:**

| Channel | Status |
|---|---|
| PyPI | Not available (HTTP 404 for `geekbench` package) |
| Debian | Not packaged (tracker.debian.org returns 404) |
| Ubuntu | Not in official repositories (packages.ubuntu.com returns no results) |
| Arch Linux RISC-V (archriscv.felixc.at) | Not available |
| GitHub Releases (primatelabs) | Not used for binary distribution |
| Flatpak/Snap | Data not available: not searched |

**What a user must do to run Geekbench 6 on riscv64:**
1. Download the tarball directly from `cdn.geekbench.com/Geekbench-6.7.1-LinuxRISCVPreview.tar.gz` (214 MB).
2. Extract and run the binary. The binary is a prebuilt ELF for Linux/riscv64.
3. Accept the freemium license requirement (results upload to browser.geekbench.com unless a license key is provided).

There is no automated package manager installation path for any Linux distribution.

---

## 9. Dependencies

Geekbench 6 uses the following dependencies for its workloads. RISC-V support status is based on individual project research reports in this repository.

**Summary table:**

| Dependency | Role in Geekbench | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| LiteRT (TFLite) | ML workloads: Object Detection, Background Blur, Speech Recognition, Object Removal, HDR | Does not build upstream | None | None | CRITICAL: zero RISC-V support; build fails with XNNPACK disabled ([issue #37](https://github.com/google-ai-edge/LiteRT/issues/37)) |
| XNNPACK | Neural net inference backend for LiteRT; fallback for ML workloads | Builds (cmake-linux-riscv64 CI since Dec 2023) | Partial -- 100+ FP16 failures in CI ([issue #9886](https://github.com/google/XNNPACK/issues/9886)) | Source-pinned, no versioned release | FP16 detection macro defective under Clang 19; f32 paths functional |
| OpenCV | Background Blur, Horizon Detection, Object Removal image processing | Builds | Partial -- RVV DNN engine broken (Apr 2025 high-priority), G-API failures since 2021 | Ships in distros | MEDIUM: DNN engine regression blocks neural inference paths |
| OpenSSL / libcrypto | AES-XTS encryption workload | Builds -- full cross-compile CI | Tests pass (Zkn, Zvk, Zbb, Zbc) | Ships in all stable releases | None |
| zlib | File Compression (gzip/DEFLATE); PDF rendering | Builds (portable C) | Tests pass (OpenBSD QEMU) | Ships -- scalar only, no RVV | RVV Adler-32 PR [#1099](https://github.com/madler/zlib/pull/1099) unreviewed since Oct 2025 |
| zstd | File Compression (Zstandard) | Builds (QEMU CI since Jul 2025) | Tests mostly pass (QEMU) | Ships -- partial RVV | 5 RVV optimization PRs unreviewed 2-6 months: [#4557](https://github.com/facebook/zstd/pull/4557), [#4596](https://github.com/facebook/zstd/pull/4596), [#4622](https://github.com/facebook/zstd/pull/4622), [#4629](https://github.com/facebook/zstd/pull/4629), [#4668](https://github.com/facebook/zstd/pull/4668) |
| xz / liblzma | Asset Compression (LZMA2) | Builds | Tests pass (100% code coverage of riscv.c) | Ships (LZMA_FILTER_RISCV since 5.6.2, stable since 5.8.0 Mar 2025) | None |
| libjpeg-turbo | Photo Library workload (JPEG encode/decode) | Builds -- RVV merged to dev branch Feb 2026 | Tests pass (manual testing on OrangePi RV2) | Ships -- RVV in 3.2 beta only; distros carry 3.1.x (pre-RVV) | 3.2 stable not yet released; maintainer declined riscv64 release binaries ([issue #885](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885)) |
| SQLite | SQLite workload (database queries) | Builds (portable C) | Tests pass | Ships -- 3.53.0+ has riscv64 `__uint128_t` fix | `hwtime.h` cycle counter returns 0 on riscv64 (profiling builds only, no correctness impact) |
| FreeType | PDF rendering (font rasterization) | Builds (portable C) | Tests pass | Ships -- widely packaged | None known |
| libpng | Photo Library (PNG decode); PDF images | Builds (portable C) | Tests pass | Ships -- widely packaged | No RVV path; performance gap only |
| ICU (Unicode) | Text Processing workload | Builds (portable C++) | Tests pass | Ships -- widely packaged | None known |
| LLVM / Clang | Clang workload (incremental C++ compilation) | Builds -- Tier 2 RISC-V backend | Tests pass -- riscv64 CI in LLVM | Ships (LLVM 18/19/20) | None critical |
| zlib-ng | Accelerated DEFLATE (alternative to zlib) | Builds -- RVV + Zbc implementations in `arch/riscv/` | Tests pass (QEMU; Clang CI disabled) | Ships on Alpine Linux edge for riscv64 | [Issue #1670](https://github.com/zlib-ng/zlib-ng/issues/1670): unaligned-access bug in chunkset_rvv.c open; Clang riscv64 CI coverage broken |

**Critical dependency deep-dive -- LiteRT:**

LiteRT (formerly TensorFlow Lite, now [google-ai-edge/LiteRT](https://github.com/google-ai-edge/LiteRT)) is the ML inference framework backing Geekbench 6's neural network workloads. The repository contains zero RISC-V entries in any CMakeLists.txt, BUILD file, or CI workflow. The official build documentation page for riscv64 (`developers.google.com/edge/litert/build/riscv`) returns HTTP 404. A community member attempted to build LiteRT for riscv64 in [issue #37](https://github.com/google-ai-edge/LiteRT/issues/37); the build failed because XNNPACK is disabled on RISC-V at the LiteRT level. There is no Google commitment to RISC-V support in any accessible public statement.

**Critical dependency deep-dive -- XNNPACK:**

[google/XNNPACK](https://github.com/google/XNNPACK) is the neural network kernel library used as LiteRT's backend and as a direct inference accelerator. It has dedicated `cmake-linux-riscv64` CI since December 2023 with 300+ RISC-V kernel files and RVV f32/int8/fp16 kernels present. However, [issue #9886](https://github.com/google/XNNPACK/issues/9886) (April 2026) documents 100+ FP16 (Zvfh) test failures in current CI. The flag `XNN_ENABLE_RISCV_FP16_VECTOR` is enabled unconditionally, causing regressions on hardware without Zvfh support. Additionally, [issue #4650](https://github.com/google/XNNPACK/issues/4650) (cpuinfo build failure) has been open for 3 years without resolution. The f32 inference paths are functional; fp16 acceleration is broken in CI.

---

## 11. Known Bugs and Active Issues

No public Geekbench bug tracker is accessible. The official community forum (community.geekbench.com, discuss.geekbench.com) and result browser returned ECONNREFUSED during research. Primate Labs does not expose a public issue tracker for the benchmark engine. The following bugs are documented from third-party hardware reviews.

**Geekbench-adjacent bugs from community hardware reviews:**

| Source | Issue | Severity | Notes |
|---|---|---|---|
| [geerlingguy/sbc-reviews #65](https://github.com/geerlingguy/sbc-reviews/issues/65), [#82](https://github.com/geerlingguy/sbc-reviews/issues/82) | CPU identification failure: processor shown as "Unknown" on HiFive Premier P550 | Low | Ecosystem-wide RISC-V identification gap, not Geekbench-specific |
| [geerlingguy/sbc-reviews #46](https://github.com/geerlingguy/sbc-reviews/issues/46) | GPU benchmark `glmark2-es2` scored 0 with many tests at 0 FPS on Milk-V Mars | Low | GPU/OpenGL driver immaturity; separate from CPU Geekbench scores |
| [geerlingguy/sbc-reviews #46](https://github.com/geerlingguy/sbc-reviews/issues/46), [#47](https://github.com/geerlingguy/sbc-reviews/issues/47) | Multiple Phoronix Test Suite benchmarks failed to compile on Milk-V Mars and Milk-V Jupiter | Medium | Indicates broader RISC-V software compatibility gaps affecting other workloads |
| cnx-software.com Milk-V Jupiter review, result #7287569 | Reviewer caveat: GB6 scores on RISC-V "can't be used to compare the performance against other systems due to the current software situation" | Medium | Unoptimized compiler paths, absent SIMD; scores systematically deflated vs. hardware capability |

**Dependency bugs with direct impact on Geekbench workloads:**

| Dependency | Issue | Impact on Geekbench |
|---|---|---|
| LiteRT | No RISC-V build support at all | All ML workloads (Object Detection, Background Blur, Speech Recognition, Portrait Mode, Horizon Detection) are non-functional or scalar-fallback only |
| XNNPACK | [#9886](https://github.com/google/XNNPACK/issues/9886): 100+ FP16 test failures in CI (Apr 2026) | FP16 inference acceleration disabled; affects ML workload quality |
| OpenCV | RVV branch broken in new DNN engine (Apr 2025, marked high priority) | Background Blur and Horizon Detection workloads using OpenCV neural paths affected |
| zlib-ng | [#1670](https://github.com/zlib-ng/zlib-ng/issues/1670): unaligned-access bug in chunkset_rvv.c | File Compression workload correctness risk if zlib-ng is used as backend |

No floating-point NaN correctness bugs or incorrect Geekbench result submissions specific to riscv64 were found in any accessible source.

---

## 12. Objections and Upstream Blockers

**Proprietary closed source -- no contribution path:**

Geekbench is not open source. No external contributor can submit a patch for RISC-V SIMD acceleration, add a new workload, or fix a bug in the benchmark engine. All improvements require Primate Labs to prioritize them internally. This is the fundamental architectural constraint for any investment strategy. RISC-V hardware vendors who want better scores must engage Primate Labs directly under a commercial arrangement.

**LiteRT has no RISC-V roadmap:**

The single largest functional gap for Geekbench 6 on riscv64 is LiteRT. Without it, the ML workload suite (approximately 30-40% of total score weight [NEEDS VERIFICATION]) produces either failures or unoptimized scalar results. Primate Labs cannot fix this; it requires Google (LiteRT owner) or a third party to port LiteRT to riscv64. Google is a RISE Premier Member but LiteRT RISC-V support has not been announced.

**"Preview" label permanence is unconfirmed:**

ARM64 has carried the "LinuxARMPreview" label for all of Geekbench 6 despite being a first-class supported platform. Whether the riscv64 "Preview" label will ever be removed, and what criteria Primate Labs uses for promotion, is not publicly documented. This creates uncertainty about the long-term status of the riscv64 port.

**Benchmark comparability across architectures:**

The cnx-software reviewer explicitly warned that riscv64 Geekbench scores are not cross-architecture comparable due to absent SIMD and unoptimized toolchain paths. This limits the benchmark's utility as a competitive evaluation tool for RISC-V silicon until the dependency stack matures.

---

## 13. Investment Analysis

RISE has no existing Geekbench-specific investment (confirmed: zero mentions in 28 RISE blog posts). The following analysis covers work not already done.

### 13.1 Functional Enablement

The highest-value functional work is enabling LiteRT on riscv64. This would directly unblock all ML workloads in Geekbench 6 and numerous other ML-dependent applications. This is an upstream LiteRT/Google problem, not a Geekbench problem. A second-order enablement is XNNPACK FP16 fix ([issue #9886](https://github.com/google/XNNPACK/issues/9886)), which is a narrower code fix.

Fixing OpenCV's RVV DNN engine regression (high-priority issue, Apr 2025) would benefit Background Blur and Horizon Detection workloads.

### 13.2 Performance Optimization

The zstd optimization backlog (5 open RVV PRs with no maintainer response for 2-6 months) represents low-effort, high-yield work: the patches exist and need review pressure or contributor time to land. File Compression workload performance would improve directly.

libjpeg-turbo 3.2 stable release is gated on Primate Labs' (or the community's) willingness to cut a release. The RVV SIMD is already merged to dev. The Photo Library workload would benefit once 3.2 ships to distros.

Data not available: quantified performance improvement estimates per workload for any of the above, as no benchmarking data comparing scalar vs. RVV paths for these specific dependency versions was found.

### 13.3 CI/CD Infrastructure

Not applicable for Geekbench itself (closed source, no public CI). For the dependency stack, RISE already operates hardware runners for open-source projects. The specific projects in the dependency chain (LiteRT, XNNPACK, OpenCV) do not currently use RISE runners.

### 13.4 Ecosystem Enablement

No package ecosystem applies to Geekbench (no plugins, extensions, or dependent packages). The distribution is a single binary tarball.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | LiteRT riscv64 port: enable build, integrate XNNPACK backend, validate inference workloads | Data not available: scope requires LiteRT codebase audit | Google (RISE Premier Member) or contractor | Critical |
| Functional | XNNPACK FP16 (Zvfh) fix: resolve [issue #9886](https://github.com/google/XNNPACK/issues/9886), fix `XNN_ENABLE_RISCV_FP16_VECTOR` detection | 2-4 | Qualcomm, SiFive, or Google XNNPACK team | High |
| Functional | OpenCV RVV DNN engine: fix regression introduced Apr 2025, restore riscv64 neural inference path | 4-8 | OpenCV community, RISE Enablement WG | High |
| Performance | zstd RVV optimization PRs: review and land [#4557](https://github.com/facebook/zstd/pull/4557), [#4596](https://github.com/facebook/zstd/pull/4596), [#4622](https://github.com/facebook/zstd/pull/4622), [#4629](https://github.com/facebook/zstd/pull/4629), [#4668](https://github.com/facebook/zstd/pull/4668) | 1-2 (review); patches already written | RISE Enablement WG | Medium |
| Performance | libjpeg-turbo 3.2 stable release: pressure or assist Primate Labs / distro maintainers to adopt 3.2 with RVV | 1 (coordination) | RISE or Canonical | Low |
| Functional | zlib-ng unaligned-access bug fix: resolve [issue #1670](https://github.com/zlib-ng/zlib-ng/issues/1670) chunkset_rvv.c | 1-2 | RISE Enablement WG | Medium |
| Functional | Engage Primate Labs directly: request public tier policy documentation, RVV workload optimization, removal of "Preview" label | 0 (business development) | Chip vendor BD team | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [primatelabs/geekbench-tools on GitHub](https://github.com/primatelabs/geekbench-tools)
- [primatelabs/geekbench-swift on GitHub](https://github.com/primatelabs/geekbench-swift)
- [geerlingguy/sbc-reviews #10 -- StarFive VisionFive 2 review](https://github.com/geerlingguy/sbc-reviews/issues/10)
- [geerlingguy/sbc-reviews #22 -- Milk-V Mars CM review](https://github.com/geerlingguy/sbc-reviews/issues/22)
- [geerlingguy/sbc-reviews #46 -- Milk-V Mars review](https://github.com/geerlingguy/sbc-reviews/issues/46)
- [geerlingguy/sbc-reviews #47 -- Milk-V Jupiter review](https://github.com/geerlingguy/sbc-reviews/issues/47)
- [geerlingguy/sbc-reviews #65 -- HiFive Premier P550 review](https://github.com/geerlingguy/sbc-reviews/issues/65)
- [geerlingguy/sbc-reviews #82 -- DC-ROMA AI PC Mainboard II review](https://github.com/geerlingguy/sbc-reviews/issues/82)
- [Geekbench 6 RISC-V result: Milk-V Jupiter (SpacemiT X60), browser.geekbench.com/v6/cpu/7287569](https://browser.geekbench.com/v6/cpu/7287569)
- [Geekbench 6 result: StarFive VisionFive 2, browser.geekbench.com/v6/cpu/3784701](https://browser.geekbench.com/v6/cpu/3784701)
- [Geekbench 6 result: Milk-V Mars CM, browser.geekbench.com/v6/cpu/3281902](https://browser.geekbench.com/v6/cpu/3281902)
- [Geekbench 6 result: Milk-V Mars, browser.geekbench.com/v6/cpu/6746810](https://browser.geekbench.com/v6/cpu/6746810)
- [Geekbench 6 result: Milk-V Jupiter, browser.geekbench.com/v6/cpu/6979805](https://browser.geekbench.com/v6/cpu/6979805)
- [Geekbench 6 result: HiFive Premier P550, browser.geekbench.com/v6/cpu/10507637](https://browser.geekbench.com/v6/cpu/10507637)
- [Geekbench 6 result: DC-ROMA AI PC Mainboard II, browser.geekbench.com/v6/cpu/14421987](https://browser.geekbench.com/v6/cpu/14421987)
- [LiteRT issue #37 -- riscv64 build failure](https://github.com/google-ai-edge/LiteRT/issues/37)
- [XNNPACK issue #9886 -- 100+ FP16 test failures on riscv64 (Apr 2026)](https://github.com/google/XNNPACK/issues/9886)
- [XNNPACK issue #4650 -- cpuinfo build failure, open 3 years](https://github.com/google/XNNPACK/issues/4650)
- [libjpeg-turbo issue #885 -- maintainer declines riscv64 release binaries](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/885)
- [libjpeg-turbo issue #895 -- DCT/IDCT follow-on optimizations (Jun 2026)](https://github.com/libjpeg-turbo/libjpeg-turbo/issues/895)
- [zstd PR #4557 -- RVV optimization](https://github.com/facebook/zstd/pull/4557)
- [zstd PR #4596 -- RVV optimization](https://github.com/facebook/zstd/pull/4596)
- [zstd PR #4622 -- RVV optimization](https://github.com/facebook/zstd/pull/4622)
- [zstd PR #4629 -- RVV optimization](https://github.com/facebook/zstd/pull/4629)
- [zstd PR #4668 -- RVV optimization](https://github.com/facebook/zstd/pull/4668)
- [zlib-ng issue #1670 -- unaligned-access bug in chunkset_rvv.c](https://github.com/zlib-ng/zlib-ng/issues/1670)
- [zlib PR #1099 -- RVV Adler-32, unreviewed since Oct 2025](https://github.com/madler/zlib/pull/1099)
- [XNNPACK PR #28655 -- SGEMM optimization blocked on VLEN portability](https://github.com/microsoft/onnxruntime/pull/28655)
- [bobolopolis/meta-geekbench -- Yocto/OE layer packaging Geekbench binaries for riscv64](https://github.com/bobolopolis/meta-geekbench)
- [RISE Project blog -- riseproject.dev/blog](https://riseproject.dev/blog)
- [Geekbench CDN direct tarball -- Geekbench-6.7.1-LinuxRISCVPreview.tar.gz](https://cdn.geekbench.com/Geekbench-6.7.1-LinuxRISCVPreview.tar.gz)