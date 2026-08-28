---
title: libvpx
parent: Project Reports
categories:
  - multimedia
---

# libvpx

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libvpx
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libvpx is the reference implementation of the VP8 and VP9 open video codecs, developed and maintained by Google under the [WebM Project](https://www.webmproject.org/) umbrella. The upstream canonical repository is at [chromium.googlesource.com/webm/libvpx](https://chromium.googlesource.com/webm/libvpx); the [github.com/webmproject/libvpx](https://github.com/webmproject/libvpx) mirror is read-only. Code review is conducted via Gerrit on chromium-review.googlesource.com. Contributors must sign Google's CLA.

There is no independent foundation, neutral steering committee, or multi-member governance body. Google controls the project entirely. The project is affiliated with the Alliance for Open Media alongside Cisco, Intel, Microsoft, Mozilla, and Netflix, but AOM membership does not affect libvpx governance.

Corporate contributors in the AUTHORS file include:

- **Google** - primary maintainer; majority of named committers hold @google.com addresses
- **ARM** - multiple contributors with arm.com addresses for NEON/SVE work
- **Intel** - multiple contributors with intel.com addresses for SSE/AVX work
- **Loongson** - loongson.cn contributors who delivered the LoongArch port
- **Ittiam Systems** - significant optimization contributions
- **Mozilla** - multiple contributors
- **Imagination Technologies / MIPS** - MIPS DSPr2 contributions
- **Linaro** - ARM-related contributions

Hardware supporters listed on webmproject.org include AMD, ARM, Broadcom, Hisilicon, Imagination Technologies, Logitech, Marvell, MIPS, nVidia, Qualcomm, Rockchip, Texas Instruments, Verisilicon, and ZTE. No RISC-V silicon vendor (SiFive, StarFive, Alibaba T-Head, SpacemiT) appears on the supporters list.

The project's culture toward new architecture ports is clear from the LoongArch precedent: support was added by Loongson employees contributing SIMD-accelerated DSP kernels, CPU detection code, and build system entries. New architectures are accepted when a corporate sponsor contributes and commits to maintaining the SIMD layer. No such sponsor has emerged for RISC-V.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Pre-2013 | x86/x86_64 (SSE2 through AVX2), ARM/NEON, MIPS support present | configure.sh ARCH_LIST |
| ~2020-2022 | LoongArch port contributed by Loongson employees | AUTHORS file, vpx_dsp/loongarch/ directory |
| 2026-06-17 | RISC-V: zero commits, zero issues, zero PRs in upstream repository | GitHub API search (0 results) |

There is no RISC-V port history. No contributor from any organization has opened an issue, submitted a patch, or started a discussion about a RISC-V port in the upstream Gerrit instance, the GitHub mirror, or the codec-devel mailing list. The configure script's ARCH_LIST is `arm aarch64 mips x86 x86_64 ppc loongarch` -- riscv is absent.

The RTCD priority ordering in `build/make/rtcd.pl` includes `rvv` as a token after `sve2`, indicating that the dispatch plumbing was stubbed out as a placeholder. However, no `riscv/` subdirectory exists under `vpx_dsp/`, no `vpx_ports/riscv.h` or `vpx_ports/riscv_cpudetect.c` exists, and no RTCD entries reference RVV-accelerated functions. The `rvv` token in rtcd.pl is dead code.

---

## 3. Upstream Support Tier

libvpx has no published tier policy document (no PLATFORMS.md, SUPPORT.md, or equivalent). Tier classification must be inferred from CI, release artifacts, and build system treatment.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Explicit configure target | `x86_64-linux-gcc` | `arm64-linux-gcc` | not present (falls to `generic-gnu`) |
| SIMD acceleration | SSE2 through AVX-512 | NEON, dotprod, i8mm, SVE, SVE2 | none |
| CPU feature detection | yes (`vpx_ports/x86.h`) | yes (`vpx_ports/aarch64_cpudetect.c`) | none |
| CI coverage | no upstream CI of any kind | no upstream CI of any kind | no upstream CI of any kind |
| Official binary releases | source-only | source-only | source-only |
| Arch in configure ARCH_LIST | yes | yes | no |

The absence of upstream CI for all architectures means there is no formal tier hierarchy - the project simply has no CI infrastructure. However, the practical distinction is that amd64 and arm64 have hand-tuned SIMD paths that are tested by Google internally, while riscv64 has no hand-tuned code and no internal testing. riscv64 is an unsupported fallback architecture.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libvpx is a C/C++ codec library. Its performance-critical paths are SIMD-accelerated via architecture-specific assembly and intrinsics. The RTCD (runtime CPU dispatch) system selects the fastest available implementation at runtime based on CPU feature detection.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SAD / variance kernels | hand-tuned (SSE2-AVX2, ~73 files) | hand-tuned (NEON-SVE2, ~86 files) | scalar C fallback |
| DCT / IDCT transforms | hand-tuned SIMD | hand-tuned SIMD | scalar C fallback |
| Motion compensation / convolve | hand-tuned SIMD | hand-tuned SIMD | scalar C fallback |
| Loop filter | hand-tuned SIMD | hand-tuned SIMD | scalar C fallback |
| CPU feature detection | `vpx_ports/x86.h`, CPUID | `vpx_ports/aarch64_cpudetect.c`, HWCAP | missing -- no `riscv.h`, no `riscv_cpudetect.c` |
| RTCD dispatch table | populated | populated | not populated (rvv placeholder only) |
| Build system target tuning | x86_64-linux-gcc with nasm | arm64-linux-gcc with NEON flags | generic-gnu, no ISA flags |
| JIT compilation | not applicable | not applicable | not applicable |
| Assembly files | 25 .asm (nasm) | 18 .asm | none |

Architecture-specific file counts by subdirectory:

- `vpx_dsp/x86/`: approximately 73 files (48 .c + 25 .asm)
- `vpx_dsp/arm/` and `vpx_dsp/aarch64/`: approximately 86 files (68 .c + 18 .asm)
- `vpx_dsp/loongarch/`: approximately 28 files
- `vpx_dsp/riscv/`: directory does not exist (0 files)

There is no JIT, no cryptographic subsystem, and no garbage collector in libvpx - it is a pure codec library. The performance gap between a SIMD-enabled architecture and riscv64's scalar-C path is expected to be substantial. No published benchmark data comparing riscv64 to arm64 or amd64 was found. Data not available: published fps or encode-time comparisons for riscv64 vs arm64/amd64 on VP8 or VP9 workloads.

---

## 5. Build System, Cross-Compilation, and Toolchain

libvpx uses a custom autotools-like configure system, not CMake. There are no CMakeLists.txt, toolchain files, or `-DUSE_X=OFF` cmake flags. The configure script accepts a `--target=ISA-OS-CC` tuple.

**Native riscv64 build:**

```
mkdir build && cd build
../libvpx/configure \
  --target=generic-gnu \
  --enable-pic \
  --enable-shared \
  --disable-install-bins \
  --disable-install-srcs \
  --enable-vp9-highbitdepth \
  --enable-postproc \
  --enable-vp9-postproc \
  --enable-temporal-denoising \
  --enable-vp9-temporal-denoising \
  --enable-multi-res-encoding \
  --size-limit=16384x16384
make
```

**Cross-compilation from x86_64 host:**

```
mkdir build && cd build
CROSS=riscv64-linux-gnu- \
../libvpx/configure \
  --target=generic-gnu \
  --enable-pic \
  --enable-shared \
  --disable-install-bins \
  --disable-install-srcs \
  --enable-vp9-highbitdepth
make
```

The `setup_gnu_toolchain()` function in `build/make/configure.sh` reads the `CROSS` environment variable and constructs `CC=${CROSS}gcc`, `CXX=${CROSS}g++`, `AR=${CROSS}ar`, etc. Individual tool overrides (`CC=`, `CXX=`, `AR=`, `LD=`, `STRIP=`) are also supported.

The Debian `debian/rules` confirms the production cross-compilation setup for riscv64:

| DEB_HOST_ARCH | libvpx --target flag |
|---|---|
| amd64 | `--target=x86_64-linux-gcc` |
| arm64 | `--target=arm64-linux-gcc` |
| riscv64 | `--target=generic-gnu` |
| all others | `--target=generic-gnu` |

**Toolchain requirements:** No documented minimum versions for riscv64. The codebase is C99/C++11. In practice, GCC >= 7 (riscv64 target support) or Clang >= 7 (initial RISC-V backend) are sufficient floor versions [NEEDS VERIFICATION - these are inferred from toolchain history, not from libvpx documentation].

**nasm:** Required only for x86/x86_64 targets. Debian's build dependency on nasm is gated to `[amd64 hurd-i386 i386]`. riscv64 builds do not require nasm.

**QEMU:** Not documented by upstream. For test execution of cross-compiled binaries, `qemu-riscv64-static` is the standard approach. libvpx has no upstream CI scripts referencing QEMU.

**Known build failures:** None found. Debian sid builds libvpx 1.16.0-3 on riscv64 with "Installed" status, confirming the generic-gnu path compiles and links without errors.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| VP8 encode | yes (SIMD-accelerated) | yes (SIMD-accelerated) | yes (scalar C only) |
| VP8 decode | yes (SIMD-accelerated) | yes (SIMD-accelerated) | yes (scalar C only) |
| VP9 encode | yes (SIMD-accelerated) | yes (SIMD-accelerated) | yes (scalar C only) |
| VP9 decode | yes (SIMD-accelerated) | yes (SIMD-accelerated) | yes (scalar C only) |
| VP9 high-bit-depth (10/12-bit) | yes | yes | yes (scalar C only) |
| Frame-parallel decode | yes | yes | yes (threading via pthreads) |
| Tile-parallel decode | yes | yes | yes (threading via pthreads) |
| CPU feature detection | yes | yes | missing |
| RVV / SIMD acceleration | N/A | N/A | missing |
| RTCD runtime dispatch | yes | yes | dispatch table exists but selects C-only functions |

**Functional gaps:** None. libvpx is functionally complete on riscv64. All codec operations are available via the scalar C fallback path.

**Performance gaps:** All DSP kernels (SAD, variance, DCT/IDCT, motion compensation, loop filter, convolve) run as scalar C code on riscv64. No numeric encode/decode throughput comparison between riscv64 and arm64 or amd64 was found in upstream sources, distribution bug trackers, or public benchmarks. Data not available: quantified fps or encode-time delta between riscv64 scalar and arm64 NEON paths for VP9.

**Security hardening:** Debian builds libvpx with `hardening=+all optimize=-lto` (all hardening flags, LTO explicitly disabled). This applies uniformly to all architectures including riscv64. No riscv64-specific security hardening gap was identified.

**Floating-point / NaN semantics:** libvpx is an integer codec; no floating-point arithmetic is used in the core encode/decode paths. No riscv64 floating-point ABI issue was identified.

---

## 7. CI/CD Infrastructure

libvpx has no CI infrastructure of any kind. The [webmproject/libvpx](https://github.com/webmproject/libvpx) GitHub repository has no `.github` directory. The following CI configuration files were checked at the repository root and all returned 404: `.travis.yml`, `.cirrus.yml`, `.gitlab-ci.yml`, `Jenkinsfile`, `.appveyor.yml`, `.circleci`, `azure-pipelines.yml`. The upstream canonical repository at chromium.googlesource.com also has no CI configuration files.

The project uses Gerrit (chromium-review.googlesource.com) for code review, implying that Google runs internal CI for submitted CLs, but this infrastructure is not public and its architecture matrix is not documented.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Public CI pipeline | none | none | none |
| GitHub Actions | none | none | none |
| RISE runners | none | none | none |
| Hardware used for CI | unknown (Google internal) | unknown (Google internal) | unknown / likely none |
| Distro build validation | Debian buildd (passive) | Debian buildd (passive) | Debian buildd (rv-manda-03, passive) |

The only riscv64 build validation that exists is the Debian buildd infrastructure, which is a distribution-side artifact, not upstream CI.

---

## 8. Distribution and Release Status

libvpx publishes source-only releases. All tags (v1.17.0-rc1, v1.16.0, v1.15.2, v1.15.1, v1.15.0, v1.14.1, and prior) provide only source archives (.zip, .tar.gz). No pre-built binaries are published for any architecture.

| Channel | riscv64 available | Version | Notes |
|---|---|---|---|
| Upstream GitHub releases | no (source-only) | v1.17.0-rc1 latest | no binary assets at all |
| PyPI | N/A | N/A | no package named "libvpx" exists on PyPI |
| RISE wheel builder | no | N/A | redirects to nonexistent PyPI package |
| Debian sid | yes | 1.16.0-3 | built on rv-manda-03, "Installed" status confirmed |
| Ubuntu 24.04 Noble | yes [NEEDS VERIFICATION - not independently re-confirmed] | 1.14.0-1ubuntu2 | ports repo; security-patched update (1ubuntu2.3) covers amd64/i386 only |
| Arch Linux RISC-V | unconfirmed | 1.15.0-1 | repology shows version; archriscv.felixc.at search returned no result; not in failure list but positive confirmation unavailable |
| Alpine Linux edge | yes | 1.15.2-r0 | community repo |
| AUR (android-riscv64-libvpx) | yes | 1.16.0 | Android riscv64 target |

To obtain a working riscv64 binary of libvpx today: install the distribution package (`apt install libvpx-dev` on Debian/Ubuntu with a riscv64 sysroot) or cross-compile from source using `--target=generic-gnu CROSS=riscv64-linux-gnu-`. No additional steps are required; the scalar C fallback compiles without errors.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| glibc / pthreads | C runtime, threading primitives | passing (tier-1 since glibc 2.27) | complete | stable | Debian sid 2.41; riscv64 is upstream tier-1 |
| libyuv (optional) | YUV pixel format conversion | passing (Debian sid 0.0.1922.20260106-1+b1, "Installed" on rv-osuosl-01) | partial RVV coverage | released with RVV | partial -- several chroma write-back and luma conversion stubs (RGB24ToYJRow_RVV, RAWToYJRow_RVV, ARGBToUVRow) are empty, falling to scalar C |
| libwebm (optional) | WebM container mux/demux | passing (Debian sid 1.0.0.32-1+b2, "Installed" on rv-osuosl-02) | complete | released | pure C++, no architecture-specific code, no SIMD |
| nasm (build-time) | x86/x86_64 SIMD assembly | not applicable on riscv64 | N/A | N/A | build dependency gated to [amd64 hurd-i386 i386] in Debian; riscv64 builds skip all nasm objects |

**libyuv deep-dive:** libyuv has partial RVV support contributed by SiFive: `row_rvv.cc` and `scale_rvv.cc` contain RVV intrinsics for row-processing and scaling operations. CPU feature detection flags `kCpuHasRVV` and `kCpuHasRVVZVFH` are present in `cpu_id.h`. However, chroma write-back rows and several luma conversion rows (`RGB24ToYJRow_RVV`, `RAWToYJRow_RVV`, `RAWToYRow_RVV`) have empty stubs, meaning those paths still fall to scalar C. The libyuv RVV port is the only RISC-V SIMD work in the libvpx dependency graph.

**glibc:** Fully supported; riscv64 has been upstream tier-1 since glibc 2.27 (2018). No blockers.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issues or PRs | - | - | GitHub issue search "riscv repo:webmproject/libvpx": 0 results; GitHub PR search "riscv repo:webmproject/libvpx type:pr": 0 results |

The WebM Project issue tracker at issues.webmproject.org requires authentication; a search for riscv64 issues there was not possible. Data not available: any RISC-V bugs that may exist in the authenticated issue tracker.

No correctness bugs specific to riscv64 were found. The generic-gnu scalar C path is architecture-neutral and does not produce SIMD-specific correctness issues.

---

## 12. Objections and Upstream Blockers

**No stated objections found.** No upstream maintainer has publicly rejected a RISC-V port or stated policy against accepting one. The absence of objections reflects the absence of any patch submission, not a green light.

**Organizational blockers:**

1. No RISC-V silicon vendor has engaged with the libvpx project. The LoongArch port required sustained effort from Loongson employees. An RVV port would require equivalent investment from a vendor with hardware to test on (SiFive, StarFive, Alibaba T-Head, SpacemiT, or a distro maintainer with access to hardware).

2. Google controls merge decisions. A corporate sponsor would need to negotiate CLA sign-off and maintain the port post-merge, as Google has shown no indication of funding RISC-V work for libvpx internally.

3. The Alliance for Open Media has shifted focus to AV1 (libaom). VP8/VP9 are in maintenance mode. Investment in new architecture ports for VP8/VP9 may be deprioritized in favor of AV1 tooling. This is a strategic risk for any RISC-V sponsorship.

**Technical blockers:**

1. CPU feature detection infrastructure for RISC-V is entirely absent. A port would require adding `vpx_ports/riscv.h`, `vpx_ports/riscv_cpudetect.c`, build system entries in `configure.sh` and `build/make/configure.sh`, and RTCD dispatch entries.

2. The RVV extension (RISC-V Vector) has a variable-length vector model that differs from ARM SVE and x86 AVX-512. The RTCD dispatch system would need extension to handle RVV's VLEN-agnostic programming model.

3. VP9 and VP8 have hundreds of SIMD-accelerated functions. A full RVV port to parity with ARM NEON or x86 SSE2 coverage would be a substantial engineering project.

**Acceptance probability:** Moderate if a corporate sponsor commits sustained engineering resources and targets parity with the LoongArch port (not full ARM/x86 parity) as an initial milestone.

---

## 13. Investment Analysis

The RISE Project has no funded or in-progress libvpx work as of June 2026. All 28 RISE blog posts and 16 funded RFP projects were reviewed; libvpx is not mentioned. No work duplication risk.

### 13.1 Functional Enablement

libvpx is functionally complete on riscv64 via the generic-gnu scalar C path. No functional enablement work is required. Encoding and decoding VP8 and VP9 work today.

### 13.2 Performance Optimization

This is the primary gap. All DSP kernels run as scalar C. An RVV acceleration effort would need to cover:

- CPU feature detection: `vpx_ports/riscv.h`, `riscv_cpudetect.c` with `getauxval(AT_HWCAP)` to detect RVV/Zvl*/Zve* extensions
- Build system: new `riscv64-linux-gcc` target in `configure.sh` with `-march=rv64gcv` flags
- RTCD dispatch: add riscv entries to `vpx_dsp_rtcd_defs.pl`
- Core DSP kernels (highest ROI first): SAD, variance, convolve/MC, loop filter, DCT/IDCT for VP9
- Scope: initial pass targeting VP9 decode acceleration (more widely used than VP8)

A reasonable initial milestone is parity with the LoongArch port (approximately 28 optimized files covering the highest-impact kernels), not full ARM NEON parity (approximately 86 files).

### 13.3 CI/CD Infrastructure

libvpx has no public CI infrastructure of any kind. Adding riscv64 CI would require either:
- Upstream adoption: proposing a GitHub Actions matrix that the WebM Project team would need to accept; this is a governance discussion with Google, not just a patch
- Distribution-side: Debian buildd already provides passive build validation; this is sufficient for build correctness but not for test suite execution

Sponsoring a RISE runner for cross-compiled test execution via QEMU is a medium-effort CI investment that does not require Google approval.

### 13.4 Ecosystem Enablement

libvpx has no dependent package ecosystem requiring separate enablement. It is a C library distributed as source; downstream consumers (FFmpeg, GStreamer, Chromium, Firefox) build it as a dependency. Those consumers' RISC-V status is tracked in their respective reports.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | CPU feature detection (riscv.h, riscv_cpudetect.c, build system riscv64 target) | 2 | silicon vendor or distro maintainer | High |
| Performance | RTCD dispatch plumbing for riscv64/rvv | 1 | silicon vendor or distro maintainer | High |
| Performance | RVV SAD and variance kernels (VP9 encode critical path) | 4 | silicon vendor engineer with RVV hardware | High |
| Performance | RVV convolve / motion compensation kernels (VP9 decode critical path) | 6 | silicon vendor engineer with RVV hardware | High |
| Performance | RVV loop filter kernels | 4 | silicon vendor engineer with RVV hardware | Medium |
| Performance | RVV DCT/IDCT kernels | 4 | silicon vendor engineer with RVV hardware | Medium |
| CI/CD | QEMU-based riscv64 test execution in GitHub Actions (or RISE runner) | 2 | distro/RISE infrastructure team | Medium |
| Performance | VP8 RVV kernels (lower priority given VP8 usage decline) | 6 | silicon vendor engineer | Low |

Total estimated effort for high-priority items (CPU detection + RTCD plumbing + SAD/variance + convolve): approximately 13 person-weeks for a first RVV acceleration pass covering VP9 decode throughput. Full LoongArch-level parity across both codecs: approximately 29 person-weeks.

Note: VP9 is in maintenance mode relative to AV1. Before committing to this investment, evaluate whether the same effort applied to libaom (AV1) would deliver greater strategic return. libaom is the active development target for the WebM/AOM ecosystem.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libvpx GitHub mirror (read-only)](https://github.com/webmproject/libvpx)
- [libvpx upstream canonical repository (Google Gerrit)](https://chromium.googlesource.com/webm/libvpx)
- [WebM Project homepage](https://www.webmproject.org/)
- [libvpx configure script (ARCH_LIST)](https://chromium.googlesource.com/webm/libvpx/+/refs/heads/main/configure)
- [libvpx build/make/configure.sh (ISA detection)](https://chromium.googlesource.com/webm/libvpx/+/refs/heads/main/build/make/configure.sh)
- [libvpx build/make/rtcd.pl (rvv in priority list)](https://chromium.googlesource.com/webm/libvpx/+/refs/heads/main/build/make/rtcd.pl)
- [Debian tracker: libvpx](https://tracker.debian.org/pkg/libvpx)
- [Debian buildd status: libvpx riscv64](https://buildd.debian.org/status/package.php?p=libvpx)
- [Debian packages: libvpx-dev (sid, riscv64)](https://packages.debian.org/unstable/libvpx-dev)
- [Ubuntu 24.04 Noble: libvpx packages](https://packages.ubuntu.com/search?keywords=libvpx&suite=noble&searchon=names&section=all)
- [libyuv (row_rvv.cc, RVV intrinsics for YUV row processing)](https://chromium.googlesource.com/libyuv/libyuv/+/refs/heads/main/source/row_rvv.cc)
- [libyuv Debian sid riscv64 build](https://buildd.debian.org/status/package.php?p=libyuv)
- [libwebm Debian sid riscv64 build](https://buildd.debian.org/status/package.php?p=libwebm)
- [RISE Project blog (no libvpx posts found)](https://riseproject.dev/blog)
- [RISE Project funded projects (RFPs, no libvpx)](https://wiki.riseproject.dev/display/RISE/RISE+RFPs)
- [WebM Project AUTHORS file](https://chromium.googlesource.com/webm/libvpx/+/refs/heads/main/AUTHORS)
- [WebM Project hardware supporters](https://www.webmproject.org/about/supporters/)