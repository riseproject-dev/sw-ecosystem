---
title: libx264
categories:
  - multimedia
---

# libx264

**Author:** Ludovic HENRY \<ludovic.henry@qti.qualcomm.com\><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libx264<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items verified against only one source are marked [NEEDS VERIFICATION]. Contradictions between sources are cited explicitly.<br/>

---

## 1. Project Overview

libx264 is an open-source H.264/AVC encoder library produced under the VideoLAN project. The canonical upstream repository is hosted at [code.videolan.org/videolan/x264](https://code.videolan.org/videolan/x264) (GitLab). A widely-referenced mirror exists at [github.com/mirror/x264](https://github.com/mirror/x264), but this mirror lags the canonical repo and as of the research date had not been updated past 2024-09-25.

**Governance:** VideoLAN is a French non-profit association (association loi 1901), volunteer-led, with a five-member board: President Jean-Baptiste Kempf, Vice Presidents Konstantin Pavlov and Vibhoothi, Treasurer Thomas Guillem, and Secretary Felix Paul Kuhne. There is no MAINTAINERS, OWNERS, or CODEOWNERS file in the repository. Patches are submitted via the x264-devel mailing list and the VideoLAN GitLab instance.

**License:** GNU GPL v2.0. A commercial dual-license is available via x264licensing@videolan.org.

**Corporate contributors:** The AUTHORS file names 17 contributors without corporate affiliations. Based on commit history in mirror/x264:

- Henrik Gramner ("Gramner"), secondary account "gramner-twoorioles" -- x86 and x86inc infrastructure; affiliated with Two Orioles [NEEDS VERIFICATION]
- mstorsjo -- AArch64 and CI/LLVM toolchain work; likely independent or LLVM-ecosystem-affiliated [NEEDS VERIFICATION]
- XiWeiGu -- all LoongArch optimizations; likely employed by Loongson Technology [NEEDS VERIFICATION]
- DavidChenCn -- November 2023 SVE/SVE2 acceleration; likely Arm-ecosystem or Chinese hardware vendor affiliated [NEEDS VERIFICATION]
- MasterNobody -- general maintenance and CI
- Changsheng Wu -- foundational riscv64 enablement commit (September 2025); affiliation unknown from available sources

**Major users:** YouTube, Facebook, Vimeo, Hulu. None of these are disclosed sponsors. VideoLAN has no formal corporate membership program.

**RISE membership:** VideoLAN and x264 are not members of the RISE project. No RISE blog posts, RFPs, or project listings mention x264 or any multimedia codec work.

**Community stance on new ports:** The pattern for accepted architecture ports (LoongArch added by Loongson-affiliated contributors, AArch64/ARM by Arm-ecosystem contributors) shows that new ports are merged when contributed by architecture owners or vendors with hardware and performance data. LoongArch (a relatively niche ISA) was merged without apparent controversy, indicating no structural resistance to new architecture contributions.

---

## 2. Port History and Upstreaming Timeline

**Note on source conflict:** The GitHub mirror at [github.com/mirror/x264](https://github.com/mirror/x264) was last updated 2024-09-25, which predates the foundational riscv64 commit. Searches against the mirror (issues, commits, file tree, code) return zero RISC-V results. The mailing list archive, however, reveals a September 2025 commit to the canonical VideoLAN GitLab. These two sources are mutually consistent once the mirror lag is understood: the mirror does not reflect upstream changes after 2024-09-25.

| Date | Event | Source |
|---|---|---|
| (no date) | RISC-V not listed in configure; all search results against mirror/x264 return zero riscv hits | [mirror/x264 configure](https://raw.githubusercontent.com/mirror/x264/master/configure), mirror last updated 2024-09-25 |
| 2025-09-10 | Commit 0480cb05 by Changsheng Wu, pushed by Jean-Baptiste Kempf: adds riscv64 to configure, RVV detection via getauxval(HWCAP_RISCV64_RVV), X264_CPU_RVV flag in x264.h, rdtime cycle counter in checkasm, empty Makefile scaffolding for future RVV objects | x264-devel mailing list, announced 2025-09-16 [NEEDS VERIFICATION - VideoLAN GitLab blocked by Anubis] |
| 2025-09-16 | Commit 0480cb05 announced to x264-devel mailing list. Commit message: "We are working on adding vector optimizations with riscv64 rvv extensions, and will push the implementations later." | x264-devel mailing list archive [NEEDS VERIFICATION] |
| 2025-10 to 2026-03 | No follow-up RVV optimization patches from Changsheng Wu appear in mailing list archives for October 2025, February 2026, or March 2026 | x264-devel mailing list archive [NEEDS VERIFICATION] |
| ~2026-01 | Debian sid ships libx264-165 (version 2:0.165.3222+gitb35605ac-3+b2) for riscv64, built successfully on rv-manda-04, ~159 days before research date | [Debian buildd](https://buildd.debian.org/status/package.php?p=x264&suite=sid) |

**Summary:** The foundational riscv64 enablement is upstream in the canonical VideoLAN GitLab as of September 2025. No RVV-optimized SIMD routines have been merged as of March 2026. The GitHub mirror does not reflect the September 2025 commit.

---

## 3. Upstream Support Tier

x264 has no documented tier policy for architectures.

De facto tier assignment based on CI and release status:

| Evidence | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Named in configure | Yes | Yes | Yes (after 2025-09-10) |
| CI build job | Yes (Debian amd64) | Yes (Debian aarch64) | No |
| CI test job | Yes | Yes (QEMU) | No |
| SIMD assembly | Yes (NASM/SSE/AVX) | Yes (NEON/SVE/SVE2) | No (RVV scaffolding only) |
| Official upstream binary | No (no upstream releases) | No | No |
| Distro binary | Yes | Yes | Yes (C-only build) |
| Release-blocking | Implied | Implied | No |

x264 does not publish official binary releases upstream at all (GitHub mirror/x264 has zero releases). All binaries come from distro packaging. The riscv64 distro builds are pure-C scalar only.

**De facto tier for riscv64:** Best described as Tier 3 -- compiles and runs, no SIMD acceleration, no upstream CI, no release-blocking.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

x264 achieves performance through architecture-specific SIMD assembly. The codebase is approximately 33.6% Assembly by language. All high-throughput kernel functions (DCT, motion estimation, intra prediction, deblocking) have SIMD implementations for supported architectures.

**Architecture-specific directory inventory (from mirror/x264 `common/` tree):**

| Architecture | Directory | ASM files | C files | SIMD type |
|---|---|---|---|---|
| x86/x86_64 | common/x86/ | ~19 .asm | ~2 | NASM SSE2/AVX/AVX-512 |
| aarch64 | common/aarch64/ | ~18 .S | ~3 | NEON, SVE, SVE2 |
| arm | common/arm/ | ~9 .S | ~2 | NEON, ARMv6 |
| loongarch | common/loongarch/ | ~9 .S | ~3 | LSX, LASX |
| mips | common/mips/ | 0 | ~6 | MSA intrinsics (C) |
| ppc | common/ppc/ | 0 | ~6 | VSX/Altivec intrinsics (C) |
| riscv64 | (none) | 0 | 0 | -- |

**Per-subsystem riscv64 status:**

| Subsystem | amd64 | arm64 | riscv64 |
|---|---|---|---|
| DCT/IDCT | Hand-tuned NASM | Hand-tuned ASM | Scalar C fallback |
| Deblock filter | Hand-tuned NASM | Hand-tuned ASM | Scalar C fallback |
| Motion estimation / SAD/SSD/SATD | Hand-tuned NASM | Hand-tuned ASM | Scalar C fallback |
| Intra prediction | Hand-tuned NASM | Hand-tuned ASM | Scalar C fallback |
| CABAC bitstream | Hand-tuned NASM | Hand-tuned ASM | Scalar C fallback |
| CPU feature detection | CPUID (x86) | getauxval/HWCAP | getauxval(HWCAP_RISCV64_RVV) present (after 2025-09-10) |
| Cycle counter (checkasm) | rdtsc | cntvct_el0 | rdtime (after 2025-09-10) |
| RVV/SIMD flag definition | X264_CPU_MMX etc. | X264_CPU_NEON etc. | X264_CPU_RVV defined (after 2025-09-10), never set at runtime (no detection routine written) |

**ISA extensions targeted:** The 2025-09-10 commit probes for RVV (base vector extension) via `.option arch, +v` inline asm and getauxval. No Zvbb, Zvfh, or other sub-extensions are mentioned. No actual RVV code has been written.

**JIT:** Not applicable. x264 uses static assembly, not JIT compilation.

**Cryptography:** Not applicable. x264 performs no cryptographic operations.

---

## 5. Build System, Cross-Compilation, and Toolchain

x264 uses a hand-written autoconf-style `configure` + `Makefile` build system. There is no CMakeLists.txt, setup.py, go.mod, Cargo.toml, or package.json.

**Status of configure script on riscv64:**

The GitHub mirror configure (reflecting state before 2025-09-10) has no riscv branch; riscv64 falls through to `ARCH="$(echo $host_cpu | tr a-z A-Z)"`. After commit 0480cb05, the upstream configure adds an explicit `riscv64` case with ARCH="RISCV64" and 16-byte stack alignment. In both cases, no assembler is assigned for riscv64 and no SIMD flags are set.

The configure logic `[ "x$AS" = x ] && asm="no"` means assembly is auto-disabled when no assembler is configured for the target. `--disable-asm` is redundant but harmless.

**Native build on riscv64 hardware:**

```sh
./configure --prefix=/usr
make -j$(nproc)
make install
```

No additional flags are needed. The configure script auto-detects no ASM support for riscv64 and falls back to pure C.

**Cross-compilation from x86_64 host (Debian/Ubuntu):**

```sh
apt-get install gcc-riscv64-linux-gnu

./configure \
  --host=riscv64-linux-gnu \
  --cross-prefix=riscv64-linux-gnu- \
  --prefix=/usr \
  --enable-shared
make -j$(nproc)
```

The `--host` and `--cross-prefix` flags cause configure to prefix CC, AR, STRIP, RANLIB, and PKGCONFIG with `riscv64-linux-gnu-`.

**With explicit sysroot:**

```sh
./configure \
  --host=riscv64-linux-gnu \
  --cross-prefix=riscv64-linux-gnu- \
  --sysroot=/path/to/riscv64-sysroot \
  --prefix=/usr
```

**Toolchain version requirements:** x264 states no minimum GCC/Clang version. The only explicit version requirement is `nasm >= 2.13` for x86/amd64 targets only -- irrelevant on riscv64. Any GCC version supporting the riscv64-linux-gnu target triplet (GCC 7+ added RISC-V support; Debian Bookworm ships GCC 12) is sufficient.

**QEMU usage:** The `.gitlab-ci.yml` uses QEMU only for AArch64 testing (job `test-aarch64-qemu`). No riscv64 QEMU CI job exists. For manual QEMU emulation testing:

```sh
apt-get install qemu-user
qemu-riscv64 ./x264 --help
```

**Known build failures on riscv64:** None found. Debian sid builds x264 for riscv64 successfully (Installed status on rv-manda-04). No open Debian bugs for x264 on riscv64 were found.

**Debian packaging notes:** The `debian/control` requires `nasm >= 2.13` only on `[any-i386 any-amd64]` -- this dependency is skipped on riscv64. The `debian/rules` disables ASM on some PowerPC variants but has no riscv64-specific override; riscv64 builds with default flags (pure C).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| H.264 Baseline encoding | Yes | Yes | Yes |
| H.264 High Profile encoding | Yes | Yes | Yes |
| SIMD-accelerated DCT | Yes (SSE/AVX) | Yes (NEON/SVE) | No |
| SIMD-accelerated motion estimation | Yes | Yes | No |
| SIMD-accelerated deblocking | Yes | Yes | No |
| SIMD-accelerated intra prediction | Yes | Yes | No |
| OpenCL lookahead | Yes (GPU-dependent) | Yes (GPU-dependent) | Loader present; no RISC-V OpenCL GPU driver exists |
| Multi-threading (pthreads/OpenMP) | Yes | Yes | Yes |
| 8-bit and 10-bit depth | Yes | Yes | Yes |
| CPU feature detection | Yes | Yes | Partial (RVV flag defined, no detection routine written) |
| checkasm test suite | Yes | Yes | Partial (rdtime cycle counter present; no riscv64 test functions written) |

**Functional gaps:** None. All H.264 encoding features are available via scalar C paths. The encoder is functionally complete on riscv64.

**Performance gap:** All SIMD-accelerated kernels are absent. On amd64 and arm64, the hot encode loops run in hand-tuned assembly achieving typical speedups of 4-16x versus scalar C for individual kernels. The riscv64 build runs every kernel in scalar C. No riscv64 vs amd64 or riscv64 vs arm64 fps benchmark data is available from any accessible source (Phoronix returns HTTP 403, OpenBenchmarking returns HTTP 403, no RISE or conference benchmark papers found). The only quantitative riscv64 data found is a compiler measurement: LLVM SPEC CPU2017 `525.x264_r` instruction count on `rva22u64 -O3` is 379,364,891,237 (baseline) vs 379,357,617,460 (with a double-promotion patch) -- a 0.00% change. This is a code-generation micro-measurement, not an end-to-end fps figure.

**Security hardening gaps:** Data not available: no riscv64-specific security hardening audit was found in any accessible source.

**Floating-point semantics:** x264 uses fixed-point integer arithmetic throughout the codec kernels. No floating-point NaN or rounding-mode issues specific to riscv64 were found.

---

## 7. CI/CD Infrastructure

The complete `.gitlab-ci.yml` was read in full. The string "riscv" does not appear anywhere in the file.

| CI job | Platform | Coverage |
|---|---|---|
| build-debian-amd64 | Docker, amd64 | Build |
| build-debian-aarch64 | Docker, aarch64 | Build |
| build-win32 | Cross, i686-w64-mingw32 | Build |
| build-win64 | Cross, x86_64-w64-mingw32 | Build |
| build-llvm-mingw-armv7 | Cross, armv7-w64-mingw32 | Build |
| build-llvm-mingw-aarch64 | Cross, aarch64-w64-mingw32 | Build |
| build-macos-x86_64 | macOS, x86_64-apple-darwin19 | Build |
| build-macos-arm64 | macOS, aarch64-apple-darwin19 | Build |
| test-debian-amd64 | Docker, amd64 | Test |
| test-debian-aarch64 | Docker, aarch64 | Test |
| test-win32, test-win64 | Windows | Test |
| test-macos-x86_64 | macOS | Test |
| test-aarch64-qemu | QEMU, aarch64 | Test |
| **riscv64** | **absent** | **absent** |

No GitHub Actions CI exists (`.github/workflows/` returns HTTP 404). No RISE CI runners are used.

**CI summary by architecture:**

| Architecture | Build CI | Test CI | QEMU CI |
|---|---|---|---|
| amd64 | Yes | Yes | No |
| arm64 | Yes | Yes | Yes |
| riscv64 | No | No | No |

Any riscv64 build correctness claim relies entirely on distro build daemons (Debian rv-manda-04, etc.), not on upstream CI.

---

## 8. Distribution and Release Status

**Upstream releases:** None. The GitHub mirror has zero published releases. x264 uses rolling commits only with no versioned tags in the sense of GitHub/GitLab releases.

**Distribution packages:**

| Distribution | Package | Version | riscv64 Status | Notes |
|---|---|---|---|---|
| Debian sid | libx264-165, libx264-dev, x264 | 2:0.165.3222+gitb35605ac-3+b2 | Installed | Built on rv-manda-04, ~159 days before research date |
| Ubuntu 24.04 Noble | libx264-164, libx264-dev | 2:0.164.3108+git31e19f9-1 | Available | Listed alongside amd64, arm64, armhf, i386, ppc64el, s390x |
| Alpine edge | x264 | 0.164.3108-r1 | Available | community repo |
| Arch Linux RISC-V | x264 | Data not available: archriscv.felixc.at search returned unparseable results | Likely available [NEEDS VERIFICATION] | x264 is in Arch Linux extra; Arch RISC-V port generally mirrors extra |

**PyPI:** No package named "libx264" exists on PyPI. Both `https://pypi.org/pypi/libx264/json` and `https://pypi.org/simple/libx264/` return HTTP 404.

**RISE wheel builder:** The RISE wheel builder does not list libx264 among its 80+ tracked packages.

**What a user must do to get a working binary:** Install from the system package manager on any of the above distributions. No upstream binary is provided. The resulting binary is a pure-C scalar build with no SIMD acceleration.

---

## 9. Dependencies

**Build dependency status on riscv64:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| nasm (>= 2.13) | x86/x86_64 SIMD assembler only; not invoked on riscv64 | Installed in Debian sid riscv64 (v3.01-1) | N/A (tool, not runtime) | Available | None -- not used on riscv64 |
| libavformat / libavcodec / libavutil (FFmpeg lavf) | Optional: demuxer input for CLI (input/lavf.c) | Installed in Debian sid riscv64 (FFmpeg 7:8.1.2-2, built ~3 days before research date on rv-manda-03) | Unknown -- no riscv64 CI in FFmpeg upstream for this path | Released | None known; see multimedia/ffmpeg.md |
| libswscale / libavutil | Optional: pixel-format conversion for CLI (required by lavf path) | Installed as part of FFmpeg package on riscv64 | Unknown | Released | None known |
| ffms2 (FFmpegSource2) | Optional: frame-accurate demuxer input for CLI (input/ffms.c) | Installed in Debian sid riscv64 (v5.0-2, built ~10 days before research date on rv-manda-01) | Unknown -- no riscv64 CI in ffms2 | Released | None known |
| GPAC / libgpac | Optional: MP4 muxer output for CLI | Not in Debian sid (removed from Debian) | Unknown | Not released for riscv64 via Debian | Not a hard dep; CLI falls back gracefully |
| l-smash | Optional: MP4 muxer via lsmash (output/mp4_lsmash.c) | Not packaged for riscv64 in Debian | Unknown | Not packaged | Not a hard dep |
| OpenCL (ocl-icd + opencl-headers) | Optional: OpenCL-accelerated lookahead; skipped at runtime if no ICD | ocl-icd Installed in Debian sid riscv64 (v2.3.4-1+b1); opencl-headers is arch-independent | N/A | Released | No RISC-V OpenCL GPU driver exists; path disables at runtime |
| AviSynth+ (avs) | Optional: AviSynth frame server input | Not packaged in Debian sid for any arch | N/A | Not available | Not a hard dep; auto-disabled unless manually installed |

**Critical dependency deep-dive -- FFmpeg:**

FFmpeg is the only runtime dependency with SIMD complexity of its own. On riscv64, FFmpeg 7 in Debian sid is built and installed. FFmpeg has partial riscv64 support (see the separate FFmpeg status report at `./multimedia/ffmpeg.md`). For x264's use of FFmpeg (lavf input only), no riscv64-specific issues were identified -- the lavf input path uses format demuxing, not SIMD-heavy decode kernels.

No critical dependency is blocking riscv64 functionality.

---

## 11. Known Bugs and Active Issues

No open riscv64-specific bugs exist in the x264 upstream tracker (VideoLAN GitLab is Anubis-blocked; GitHub mirror search for "riscv" returns zero issues). Open LLVM compiler bugs affecting x264 workloads on RISC-V targets:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [llvm/llvm-project#176218](https://github.com/llvm/llvm-project/issues/176218) | SLP vectorizer cost model bug triggered by x264 butterfly/transform kernel on RVV targets | Open (filed 2026-01-15) | High | Compiled with `-march=rv64gv_zvl512b -O3`, vectorizer predicts ~50% speedup (cost=-32 for VF=16) but resulting code runs ~50% slower than scalar. Root cause: SLP cost model underestimates load/store and arithmetic costs for int16_t on RVV targets. Assigned to @bababuck, no linked PR. |
| [llvm/llvm-project#175826](https://github.com/llvm/llvm-project/issues/175826) | `RISCVTTIImpl::getArithmeticInstrCost()` lacks scalar type support | Open | Medium | Causes inaccurate cost modeling for x264-class hot code paths. No performance numbers in the issue. |
| [llvm/llvm-project#119222](https://github.com/llvm/llvm-project/issues/119222) | Increased register spilling on `rva22u64` after bidirectional scheduling changes | Open | Medium | Relevant to x264-class workloads. |

**Correctness bugs:** None found in x264 itself on riscv64. Issue #176218 is a performance regression (slower code, not wrong output) caused by the compiler, not x264. The other two LLVM issues affect code quality only.

---

## 12. Objections and Upstream Blockers

**No stated objections found.** The x264 project has a demonstrated history of accepting architecture-specific SIMD contributions (LoongArch, AArch64 SVE/SVE2) without controversy. The September 2025 foundational commit was merged by the project maintainer (Jean-Baptiste Kempf), confirming maintainer acceptance of riscv64 work.

**Technical blockers:**

1. No RISC-V SIMD (RVV) routines exist. The September 2025 commit explicitly deferred them. Writing RVV equivalents of the x86 NASM and AArch64 ASM kernels is the primary remaining work item.

2. Three open LLVM bugs (llvm#176218, llvm#175826, llvm#119222) affect code quality for x264 workloads on RVV targets. Bug #176218 causes measurable performance regression when using the SLP vectorizer on x264 transform kernels. Any auto-vectorization strategy depends on resolving this first; hand-written intrinsics or assembly bypass the issue.

3. No riscv64 CI upstream. Any contributed RVV code cannot be gated by automated testing until CI is added.

**Organizational blockers:** None identified. VideoLAN does not require contributor agreements beyond GPL compliance. No RISE RFP covers this work, so external funding is unavailable from that source as of June 2026.

**Acceptance probability:** High, based on prior acceptance of the foundational commit and the project's track record with architecture contributions.

---

## 13. Investment Analysis

RISE has done no work on libx264 RISC-V support. The foundational enablement commit (September 2025) was contributed independently. All work described below is unstarted.

### 13.1 Functional Enablement

Functional enablement is complete. The pure-C scalar build compiles and runs correctly on riscv64. No work is needed for functional correctness.

### 13.2 Performance Optimization

This is the primary investment area. x264 on riscv64 runs every hot kernel in scalar C. The AArch64 port provides the closest structural analog (similar number of modules, similar assembly style using GNU assembler .S files). The LoongArch port (LSX/LASX) is also instructive as a more recent contribution using a similar workflow.

Modules requiring RVV implementation (priority order based on profiling data from other architectures):

1. Pixel (sad, satd, ssd, intra_sad) -- highest proportion of encode time
2. Dct (transform kernels) -- second highest
3. Deblock filter
4. Quantize
5. Intra prediction
6. MC (motion compensation / halfpel filtering)
7. Macroblock (mb_encode_* functions)
8. Cabac (partial acceleration opportunities)

Before writing RVV assembly: resolve or work around LLVM bug [#176218](https://github.com/llvm/llvm-project/issues/176218). Use GCC or write hand-assembly rather than relying on auto-vectorization for the transform kernel path.

### 13.3 CI/CD Infrastructure

Adding a riscv64 CI job to `.gitlab-ci.yml` requires either:

- A native riscv64 Docker runner registered with the VideoLAN GitLab instance, or
- A QEMU-based riscv64 emulation job (analogous to the existing `test-aarch64-qemu` job)

The QEMU approach has no hardware dependency and can be contributed immediately. A Docker image analogous to `registry.videolan.org/x264-debian-unstable-aarch64` would need to be built and published to the VideoLAN registry.

### 13.4 Ecosystem Enablement

Not applicable. libx264 has no significant dependent package ecosystem requiring separate riscv64 enablement. It is consumed as a shared library by applications (FFmpeg, HandBrake, etc.) that have their own riscv64 status.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Implement RVV pixel (sad/satd/ssd/intra_sad) in common/riscv/ | 4-6 | RISC-V vendor or community | Critical |
| Performance | Implement RVV DCT/IDCT kernels | 3-4 | RISC-V vendor or community | Critical |
| Performance | Implement RVV deblock filter | 2-3 | RISC-V vendor or community | High |
| Performance | Implement RVV quantize kernels | 2-3 | RISC-V vendor or community | High |
| Performance | Implement RVV intra prediction | 2-3 | RISC-V vendor or community | High |
| Performance | Implement RVV MC / halfpel filter | 2-3 | RISC-V vendor or community | Medium |
| Performance | Implement RVV macroblock encode kernels | 3-4 | RISC-V vendor or community | Medium |
| Performance | Benchmark suite (riscv64 fps vs arm64/amd64 baseline) | 1 | RISC-V vendor or community | High |
| Compiler | Fix or work around LLVM #176218 (SLP cost model for RVV int16_t) | 2-4 | LLVM RISC-V backend team | High (prerequisite for reliable auto-vectorization) |
| CI/CD | Add riscv64 QEMU test job to .gitlab-ci.yml | 1 | Contributor or VideoLAN | High |
| CI/CD | Build and publish riscv64 Docker image to VideoLAN registry | 1 | Contributor or VideoLAN | Medium |

Total estimated effort: 23-33 person-weeks for complete RVV optimization coverage and CI. The pixel and DCT kernels alone (the most impactful) represent 7-10 person-weeks.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [mirror/x264 GitHub repository](https://github.com/mirror/x264)
- [x264 configure script (GitHub mirror)](https://raw.githubusercontent.com/mirror/x264/master/configure)
- [x264 common/ directory tree (GitHub mirror)](https://github.com/mirror/x264/tree/master/common)
- [x264 cpu.c (GitHub mirror)](https://github.com/mirror/x264/blob/master/common/cpu.c)
- [x264 .gitlab-ci.yml (GitHub mirror)](https://github.com/mirror/x264/blob/master/.gitlab-ci.yml)
- [VideoLAN project homepage](https://www.videolan.org/developers/x264.html)
- [Debian buildd status for x264 sid](https://buildd.debian.org/status/package.php?p=x264&suite=sid)
- [Debian packages -- libx264-165 (sid)](https://packages.debian.org/sid/libx264-165)
- [Ubuntu 24.04 Noble -- libx264-164](https://packages.ubuntu.com/noble/libx264-164)
- [Alpine Linux -- x264 edge/community riscv64](https://pkgs.alpinelinux.org/packages?name=x264&branch=edge&arch=riscv64)
- [LLVM issue #176218 -- SLP vectorizer cost model bug on RVV for x264 transform kernel](https://github.com/llvm/llvm-project/issues/176218)
- [LLVM issue #175826 -- RISCVTTIImpl::getArithmeticInstrCost lacks scalar type support](https://github.com/llvm/llvm-project/issues/175826)
- [LLVM issue #119222 -- increased register spilling on rva22u64 after bidirectional scheduling](https://github.com/llvm/llvm-project/issues/119222)
- [LLVM issue #153402 -- 525.x264_r instruction count on rva22u64 (compiler measurement)](https://github.com/llvm/llvm-project/issues/153402)
- [RISE project homepage](https://riseproject.dev)
- [code.videolan.org/videolan/x264 (upstream canonical, Anubis-blocked)](https://code.videolan.org/videolan/x264)