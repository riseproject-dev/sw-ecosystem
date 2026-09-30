---
title: libvpx
parent: Project Reports
color: yellow
dependencies:
  - name: Perl
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: libwebm
    relation: runtime-dependency
    criticality: optional
  - name: libyuv
    relation: runtime-dependency
    criticality: optional
  - name: libcurl
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libvpx" %}

# libvpx

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for libvpx<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libvpx is the reference implementation of the VP8 and VP9 open video codecs, developed and maintained by Google under the [WebM Project](https://www.webmproject.org/) umbrella. The canonical repository is [chromium.googlesource.com/webm/libvpx](https://chromium.googlesource.com/webm/libvpx); [github.com/webmproject/libvpx](https://github.com/webmproject/libvpx) is an explicitly read-only mirror ("Mirror only. Please do not send pull requests" per CONTRIBUTING.md). Code review runs through Gerrit at chromium-review.googlesource.com. License is BSD-3-Clause plus a separate PATENTS / VP8 Patent Cross-License grant (see [webmproject.org/license](https://www.webmproject.org/license/)).

There is no independent foundation, neutral steering committee, or published MAINTAINERS/OWNERS file (direct fetch of `MAINTAINERS` on both Gitiles and the GitHub mirror returns 404). Governance runs informally through Google-led Gerrit review. The project sits under the Alliance for Open Media alongside Cisco, Intel, Microsoft, Mozilla, and Netflix, but AOMedia membership does not change libvpx's governance, which remains fully Google-controlled.

Corporate contributors identifiable in the AUTHORS file:

- **Google** - dominant, 100+ @google.com contributors; primary steward (James Zern, Jerome Jiang, Jingning Han are heavy-commit Google-affiliated names)
- **ARM** - roughly 15 contributors, NEON/SVE ports
- **Intel** - several contributors, x86 SSE/AVX
- **Ittiam Systems** - roughly 15 contributors, general optimization work
- **Loongson** (@loongson.cn) - LoongArch port contributors
- **Mozilla** - organizational contributor
- **The Xiph.Org Foundation** - organizational contributor
- **Imagination Technologies / MIPS, Linaro** - MIPS/ARM-adjacent contributions

Hardware supporters listed on webmproject.org include AMD, ARM, Broadcom, Hisilicon, Imagination Technologies, Logitech, Marvell, MIPS, nVidia, Qualcomm, Rockchip, Texas Instruments, Verisilicon, and ZTE. No RISC-V silicon vendor (SiFive, StarFive, Alibaba T-Head, SpacemiT) appears on this list.

New-architecture culture is best illustrated by the LoongArch precedent: Loongson employees contributed SIMD kernels, CPU-detection code, and build-system entries, and the port was accepted through ordinary Gerrit review. No comparable corporate sponsor has engaged for RISC-V. Since the canonical repo takes no external GitHub PRs (Gerrit-only, Google-gated), any RISC-V upstreaming depends on Google/Chromium reviewers accepting a Gerrit CL, not a GitHub pull request - and no such CL was found in any search performed for this report.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Pre-2013 | x86/x86_64 (SSE2-AVX2), ARM/NEON, MIPS support present | [configure ARCH_LIST](https://chromium.googlesource.com/webm/libvpx/+/refs/heads/main/configure) |
| ~2020-2022 | LoongArch port contributed by Loongson employees | AUTHORS file, `vpx_dsp/loongarch/` directory |
| 2023-06-21 | aosp-riscv/libvpx fork PR #1 (gtest for riscv64-unknown-linux-gnu-gcc) opened, closed unmerged | [PR #1](https://github.com/aosp-riscv/libvpx/pull/1) |
| 2023-06-25/26 | aosp-riscv/libvpx fork PR #5 "Add riscv64 support" merged - configure recognizes riscv64 target | [PR #5](https://github.com/aosp-riscv/libvpx/pull/5) |
| 2023-07-03 | Fork issue #6 opens the still-unresolved RVV 0.7-vs-1.0-intrinsic design question | [Issue #6](https://github.com/aosp-riscv/libvpx/issues/6) |
| 2023-07-10 | Fork PR #9 "add rvv framework" merged - RTCD scaffold plus stub `vp8_sixtap_predict` | [PR #9](https://github.com/aosp-riscv/libvpx/pull/9) |
| 2023-08-16 | Fork PR #12 "optimize vp8_copy_mem with RVV" merged - first genuine RVV-vectorized kernel | [PR #12](https://github.com/aosp-riscv/libvpx/pull/12) |
| 2023-09-04 | Fork PR #18 "Add vpx_comp_avg_pred_rvv" opened; fork issue #19 (benchmarking methodology) opened | [PR #18](https://github.com/aosp-riscv/libvpx/pull/18), [Issue #19](https://github.com/aosp-riscv/libvpx/issues/19) |
| 2023-09 onward | Fork branch `riscv64_android_optimization` goes dormant; PR #18 and issues #6/#19 remain open with no further activity through 2026-09-30 | verified live against each PR/issue page |
| 2025-09-06/17 | vcpkg PR #47245 adds riscv64 to the vcpkg libvpx port's platform mapping (packaging layer only, merged) | [vcpkg PR #47245](https://github.com/microsoft/vcpkg/pull/47245) |
| 2026-09-30 | Upstream (chromium.googlesource.com/webm/libvpx, main): zero riscv tokens in `configure`, zero riscv commits in history, zero riscv directories anywhere in the tree | fresh clone + recursive grep, this report |

There is no RISC-V port history in upstream libvpx. No contributor from any organization has opened an issue, submitted a Gerrit CL, or started a codec-devel mailing-list discussion about a RISC-V port. The configure script's target list is `arm*, x86*, mips*, ppc64le-linux-gcc, loongarch32/64-linux-gcc, sparc-solaris-gcc, generic-gnu` - riscv is absent, confirmed by both a direct fetch of `configure` and a fresh shallow clone with a recursive `grep -ril riscv .` returning zero matches anywhere, including `configure`.

All real RISC-V development activity - three merged PRs (#5, #9, #12), one open/unmerged PR (#18), and two open design-discussion issues (#6, #19) - lives entirely in the third-party, never-upstreamed fork **aosp-riscv/libvpx** (PLCT Lab, branch `riscv64_android_optimization`), dated June-September 2023 and dormant since. This fork has never cut a tag or release (confirmed via its Releases and Tags pages), so none of its merged work has ever shipped as a versioned artifact, let alone reached upstream.

A `rvv` token appears in `build/make/rtcd.pl`'s priority list after `sve2` - this is dead placeholder code in upstream; it does not correspond to any populated RTCD dispatch entry, `vpx_dsp/riscv/` directory, or `vpx_ports/riscv.h`/`riscv_cpudetect.c` file anywhere in the canonical tree.

## 3. Upstream Support Tier

libvpx has no published tier-policy document (no PLATFORMS.md, SUPPORT.md, or equivalent) and no MAINTAINERS/OWNERS file. Tier classification must be inferred from configure's ARCH_LIST, CI presence, and release-artifact treatment.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Explicit configure target | `x86_64-linux-gcc` | `arm64-linux-gcc` | not present (falls to `generic-gnu`) |
| SIMD acceleration | SSE2 through AVX-512 | NEON, dotprod, i8mm, SVE, SVE2 | none upstream |
| CPU feature detection | yes (`vpx_ports/x86.h`) | yes (`vpx_ports/aarch64_cpudetect.c`) | none upstream |
| CI coverage | no upstream CI of any kind | no upstream CI of any kind | no upstream CI of any kind |
| Official binary releases | source-only | source-only | source-only |
| Arch in configure ARCH_LIST | yes | yes | no |

Upstream libvpx has no CI infrastructure for any architecture, so there is no formal tier hierarchy to speak of. The practical distinction: amd64 and arm64 carry hand-tuned SIMD paths exercised by Google internally; riscv64 has no hand-tuned code path upstream at all and falls through to the unsupported generic `CROSS=`/`generic-gnu` cross-compilation mechanism documented for arbitrary GNU toolchains. riscv64 is, from upstream's perspective, an unsupported fallback architecture - not a formally lower tier, simply absent from the tier system entirely.

## 4. Technical Architecture and RISC-V-Specific Subsystems

libvpx is a C/C++ codec library whose performance-critical paths are SIMD-accelerated via architecture-specific assembly and intrinsics, dispatched at runtime by the RTCD (runtime CPU detection) system.

| Component | amd64 | arm64 | riscv64 (upstream) |
|---|---|---|---|
| SAD / variance kernels | hand-tuned (SSE2-AVX2, ~73 files) | hand-tuned (NEON-SVE2, ~86 files) | scalar C fallback |
| DCT / IDCT transforms | hand-tuned SIMD | hand-tuned SIMD | scalar C fallback |
| Motion compensation / convolve | hand-tuned SIMD | hand-tuned SIMD | scalar C fallback |
| Loop filter | hand-tuned SIMD | hand-tuned SIMD | scalar C fallback |
| CPU feature detection | `vpx_ports/x86.h`, CPUID | `vpx_ports/aarch64_cpudetect.c`, HWCAP | missing - no `riscv.h`, no `riscv_cpudetect.c` |
| RTCD dispatch table | populated | populated | not populated (`rvv` dead placeholder token only) |
| Build system target tuning | x86_64-linux-gcc with nasm | arm64-linux-gcc with NEON flags | generic-gnu, no ISA flags |
| Assembly files | 25 .asm (nasm) | 18 .asm | none |

Directory-level evidence (confirmed by a fresh clone and directory listing of `vpx_dsp/`): `vpx_dsp/x86/` (~73 files: 48 .c + 25 .asm), `vpx_dsp/arm/`+`vpx_dsp/aarch64/` (~86 files: 68 .c + 18 .asm), `vpx_dsp/loongarch/` (~28 files), `vpx_dsp/riscv/` - **does not exist** (0 files). No `.S` assembly, no RTCD dispatch entries, no `VPX_ARCH_RISCV*` macros anywhere in the upstream tree.

**What the community fork adds (not upstream):** `aosp-riscv/libvpx` branch `riscv64_android_optimization` adds `vpx_ports/riscv.h`, `vpx_ports/riscv_cpudetect.c`, and `VPX_ARCH_RISCV64`/`riscv64` recognition in `configure`/`build/make/configure.sh`. A source-level read of this fork's code (not just its PR titles) surfaces two important qualifiers:

1. `vp8/common/riscv/copymem_rvv.c` (merged PR #12) contains genuine hand-tuned RVV intrinsics (`vlse64`/`vsse64`) for `vp8_copy_mem16x16/8x8/8x4`, author-benchmarked at up to ~60% faster than the C path on a 64-core Xeon (QEMU-emulated RVV).
2. `vp8/common/riscv/sixtap_predict_rvv.c` (merged PR #9) is a **printf-only stub**: `vp8_sixtap_predict{4x4,8x4,8x8,16x16}_rvv` never write to `dst_ptr`; the commit message itself states "have not implemented the actual algorithm." This is wired into the default build path via `rtcd_defs.pl`'s `specialize` line and `configure.sh`'s unconditional `soft_enable rvv` for any `riscv64*` target, with no runtime hardware gate (unlike the loongarch/lsx path, which does enable `runtime_cpu_detect`). Any default riscv64 build of this fork therefore silently replaces working VP8 six-tap sub-pel motion compensation with a function that writes nothing to its output buffer - a build-time-selected correctness defect in a core inter-prediction hot path, not merely a missing optimization. `riscv_cpu_caps()` in `riscv_cpudetect.c` hardcodes `HAS_RVV` unless `CONFIG_RUNTIME_CPU_DETECT` is set, and that flag is never enabled for riscv64 targets - so RVV selection in the fork is a static compile-time choice with no actual V-extension hardware check.
3. `vpx_comp_avg_pred_rvv` exists only in the unmerged, open PR #18 (RVV 0.7.1 intrinsics, D1 Nezha/C906 hardware) - it is not present in any buildable branch of the fork.
4. The entire VP9 codec tree (`vp9/**`) and the shared `vpx_dsp/` SIMD layer - where the majority of libvpx's CPU time is spent for both codecs - have **zero** riscv-specific code in the fork. Only 3 leaf functions (`vp8_copy_mem*`) carry genuine hand-tuned vector code anywhere in the fork; VP9 encode/decode runs purely scalar C even there.

This fork has never been submitted to upstream's Gerrit and has no tagged release, so none of the above - including the working `copy_mem` kernels - reaches any distribution's shipped libvpx. Distro packages (Debian, Ubuntu, openEuler, vcpkg) build unmodified upstream source via the generic scalar-C path only.

No published benchmark data compares riscv64 to arm64/amd64 encode or decode throughput for libvpx specifically. A Phoronix `pts/vpxenc` (Bosphorus 4K) result set for a Scaleway EM-RV1 SiFive-class board (`rv64imafdcvsu`) suggests roughly one to two orders of magnitude slower throughput than an AMD Ryzen 7 7700X on the same benchmark, but the specific fps figures pulled from OpenBenchmarking.org varied across search passes (0.04-0.9 fps depending on pass) and could not be independently verified against the raw page (Cloudflare bot-check blocked direct fetch) [NEEDS VERIFICATION]. Data not available: a precise, independently-verified fps or encode-time delta between riscv64 scalar and arm64 NEON paths for VP9.

## 5. Build System, Cross-Compilation, and Toolchain

libvpx uses a custom autotools-like `configure` script, not CMake. No `CMakeLists.txt` exists anywhere in the repository (confirmed via root listing: only `build/`, `build_debug/`, `examples/`, `test/`, `third_party/`, `tools/`, `vp8/`, `vp9/`, `vpx/`, `vpx_dsp/`, `vpx_mem/`, `vpx_ports/`, `vpx_scale/`, `vpx_util/`, plus `configure`, `.mk` files, `README`, `CHANGELOG`). There is consequently no cmake command and no `-DUSE_X=OFF`-style flag for any architecture, riscv64 included; libvpx uses autotools-style `--enable-*`/`--disable-*` flags exclusively.

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

**Cross-compilation from an x86_64 host:**

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

`setup_gnu_toolchain()` in [`build/make/configure.sh`](https://chromium.googlesource.com/webm/libvpx/+/refs/heads/main/build/make/configure.sh) reads the `CROSS` environment variable and constructs `CC=${CROSS}gcc`, `CXX=${CROSS}g++`, `AR=${CROSS}ar`, etc.; individual tool overrides (`CC=`, `CXX=`, `AR=`, `LD=`, `STRIP=`) are also honored. `riscv64-linux-gcc` is not a distinct, documented `--target` value - `generic-gnu` is the only documented path for a riscv64 build, with no dedicated SIMD optimization.

Debian's `debian/rules` confirms this is the production packaging setup:

| DEB_HOST_ARCH | libvpx --target flag |
|---|---|
| amd64 | `--target=x86_64-linux-gcc` |
| arm64 | `--target=arm64-linux-gcc` |
| riscv64 | `--target=generic-gnu` |
| all others | `--target=generic-gnu` |

**Toolchain requirements:** No documented minimum versions for riscv64 specifically; the codebase is C99/C++11. In practice GCC >= 7 (baseline riscv64 target support) or Clang >= 7 is sufficient [NEEDS VERIFICATION - inferred from general toolchain history, not from libvpx documentation]. NASM/Yasm is required only for x86/x86_64 targets (Debian gates the build-dependency to `[amd64 hurd-i386 i386]`); riscv64 target builds never invoke NASM/Yasm, even though both tools themselves are available as riscv64 host binaries in Ubuntu 26.04 "resolute."

**QEMU:** Not documented anywhere in upstream README/configure/vpx_ports. The only documented use of QEMU for riscv64 comes from the community fork's PR #5, where the author built `riscv-gnu-toolchain` (RV64GCV/LP64D) and QEMU 7.2.3 to run the test suite under emulation, reporting "10187 tests from 141 test suites" with failures attributed to missing input files rather than code defects.

**Known build failures:** None found. Debian sid builds libvpx 1.16.0-3 on riscv64 with "Installed" status via the generic-gnu path, and Ubuntu 26.04 "resolute" ships `libvpx-dev`/`libvpx12` 1.16.0-3 for riscv64 built the same way, confirming the generic-gnu fallback compiles and links cleanly.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| VP8 encode | yes (SIMD-accelerated) | yes (SIMD-accelerated) | yes (scalar C only) |
| VP8 decode | yes (SIMD-accelerated) | yes (SIMD-accelerated) | yes (scalar C only) |
| VP9 encode | yes (SIMD-accelerated) | yes (SIMD-accelerated) | yes (scalar C only) |
| VP9 decode | yes (SIMD-accelerated) | yes (SIMD-accelerated) | yes (scalar C only) |
| VP9 high-bit-depth (10/12-bit) | yes | yes | yes (scalar C only) |
| Frame-parallel / tile-parallel decode | yes | yes | yes (pthreads) |
| CPU feature detection | yes | yes | missing upstream |
| RVV / SIMD acceleration | N/A | N/A | missing upstream |
| RTCD runtime dispatch | yes | yes | dispatch table exists but resolves to C-only functions |

**Functional gaps:** none in upstream libvpx. All codec operations (VP8/VP9 encode and decode, high-bit-depth, multi-threading) are available on riscv64 via the scalar C path; this is functionally complete, not a feature gap.

**Performance gaps:** all DSP kernels (SAD, variance, DCT/IDCT, motion compensation, loop filter, convolve) run as scalar C on riscv64 upstream - no RVV code path exists. The only quantified performance data anywhere in the RISC-V libvpx ecosystem is the community fork's micro-benchmarks for individual kernels (see Section 2 and Section 11), none of which have reached upstream or any distribution. Data not available: an independently-verified, whole-codec fps or encode-time comparison between riscv64 and arm64/amd64.

**Security hardening:** Debian builds libvpx with `hardening=+all optimize=-lto` uniformly across all architectures, riscv64 included. No riscv64-specific hardening gap identified.

**Floating-point / NaN semantics:** libvpx is an integer codec; no floating-point arithmetic is used in core encode/decode paths. No riscv64 floating-point ABI issue identified.

## 7. CI/CD Infrastructure

Upstream libvpx has no CI infrastructure of any kind, for any architecture. Direct fetch of `.cirrus.yml`, `.gitlab-ci.yml`, `.travis.yml`, `Jenkinsfile`, and `.appveyor.yml` at the repository root all return HTTP 404, and the root directory listing (both on chromium.googlesource.com and the GitHub mirror) contains no `.github/workflows/` directory and no other CI config file. This was independently re-verified via a fresh clone and root listing, not merely inferred from prior search results.

The community RISC-V fork (`aosp-riscv/libvpx`, branch `riscv64_android_optimization`) - the only place riscv64/RVV PRs have ever been merged - was also checked directly: its root listing shows the same standard libvpx files with no CI config, and `.github/workflows/` on that branch returns HTTP 404. So even the fork carrying the merged riscv64 architecture-support and RVV-framework PRs (#5, #9, #12) has no automated build or test pipeline; all validation in that fork was evidently manual/local (the author's own QEMU-based test runs documented in PR #5 and the benchmark numbers quoted in PR #12/#18).

The project uses Gerrit (chromium-review.googlesource.com) for code review, implying Google runs internal CI for submitted CLs, but that infrastructure is not public and its architecture matrix is undocumented.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Public CI pipeline | none | none | none |
| GitHub Actions | none | none | none (confirmed 404 on both upstream and the riscv fork) |
| RISE runners | none | none | none |
| Hardware used for CI | unknown (Google internal) | unknown (Google internal) | unknown / likely none |
| Distro build validation | Debian buildd (passive) | Debian buildd (passive) | Debian buildd, Ubuntu "resolute" buildd (passive) |

The only riscv64 build validation that exists anywhere is passive distro buildd infrastructure (Debian sid, Ubuntu 26.04), not upstream CI, and not test execution - it confirms compile/link success only.

## 8. Distribution and Release Status

libvpx publishes source-only releases; no tag (latest: v1.17.0) ships pre-built binaries for any architecture.

| Channel | riscv64 available | Version | Notes |
|---|---|---|---|
| Upstream GitHub releases | no (source-only) | v1.17.0 latest | no binary assets for any architecture |
| PyPI | not applicable | - | no package named "libvpx" exists on PyPI (confirmed HTTP 404 on `pypi.org/pypi/libvpx/json` and `/simple/libvpx/`); libvpx is a C library, not a Python package |
| RISE wheel builder | not applicable | - | redirects to the nonexistent PyPI package (HTTP 302 to a 404); not listed among the 87 packages on the RISE wheel-builder page |
| Debian sid | yes | 1.16.0-3 | "Installed" status on riscv64 buildd |
| Ubuntu 26.04 "resolute" | yes, confirmed | 1.16.0-3 | `libvpx-dev` and `libvpx12` both list riscv64 alongside amd64/arm64/armhf/i386/ppc64el/s390x at [packages.ubuntu.com/resolute/riscv64/libvpx12](https://packages.ubuntu.com/resolute/riscv64/libvpx12); package size 926.5 kB, live download path confirmed, source traces to `libvpx_1.16.0-3.debian.tar.xz` with no riscv64-specific patch beyond the stock `generic-gnu` fallback |
| Ubuntu 24.04 Noble | yes [NEEDS VERIFICATION - not re-confirmed this pass] | 1.14.0-1ubuntu2 | ports repo; earlier finding, not independently re-checked in this research pass |
| EESSI (scientific software) | yes | 1.15.2 (module `libvpx/1.15.2-GCCcore-14.3.0`) | built under the `generic: riscv64` CPU target, no noted build issues |
| Arch Linux RISC-V port (archriscv.felixc.at) | no | - | libvpx is not listed on the Arch-RISC-V port search page at all |
| vcpkg | yes (packaging-layer only) | - | PR #47245 (merged 2025-09-17) adds riscv64/linux to vcpkg's libvpx port mapping; no libvpx source change, presumably builds the portable C path only |
| openEuler | yes (downstream patch) | - | `add-riscv64-arch.patch` (Patch0 in libvpx.spec, ~3 years old) enables riscv64 builds for the openEuler distro package |

To obtain a working riscv64 libvpx today: install the distribution package (`apt install libvpx-dev` on Debian sid or Ubuntu 26.04 "resolute" with a riscv64 target) or cross-compile from source with `--target=generic-gnu CROSS=riscv64-linux-gnu-`. No additional steps are required; the scalar C fallback compiles and links without errors, but ships no RVV acceleration.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Perl | build-dependency, critical - `rtcd.pl` generates the RTCD dispatch tables at build time; the README states "Perl is required to build" | present in Ubuntu 26.04 "resolute" riscv64 | not separately tracked; mature, long-shipped riscv64 package with no known riscv64-specific failures | packaged (main) for riscv64 in resolute | no dedicated project-report file exists for Perl in this tracking system; no known blockers |
| GCC | build-dependency, critical - the only documented toolchain path (`generic-gnu` target) for a riscv64 build | riscv64 is a fully supported, tier-1 GCC target | N/A | ships as part of every riscv64 base toolchain | no riscv64-specific gap identified for GCC itself; libvpx's own code simply has no RVV codegen to exercise |
| googletest | test-dependency, optional - only needed when `--enable-unit-tests`/`CONFIG_UNIT_TESTS` is set | present in Ubuntu 26.04 "resolute" riscv64 (`libgtest-dev`, universe) | widely-used, actively-maintained, no known riscv64 gaps | packaged (universe) for riscv64 in resolute | no known blockers |
| QEMU | test-dependency, optional - used by the community fork's own author to run the riscv64 test suite under emulation (PR #5: "10187 tests from 141 test suites"); not referenced anywhere in upstream README/configure | qemu-riscv64-static is the standard approach for cross-compiled test execution, not documented by upstream itself | upstream has no CI that uses it; only the fork author's manual local runs are documented | N/A (a tool, not a shipped dependency) | no known blockers; absence of QEMU-based CI is itself the gap (see Section 7) |
| glibc | runtime-dependency, critical - pthreads (`HAVE_PTHREAD_H`) gates multithreaded encode/decode | riscv64 has been upstream glibc tier-1 since glibc 2.27 (2018); Debian sid ships glibc 2.41 | complete | stable, base system package present in every riscv64 image | no blockers |
| libwebm | runtime-dependency, optional - only needed when `CONFIG_WEBM_IO` is enabled (WebM container mux/demux for `vpxenc`/`vpxdec`); normally vendored as `third_party/libwebm` rather than linked against the system package | present in Ubuntu 26.04 "resolute" riscv64 (`libwebm-dev`, universe); Debian sid 1.0.0.32-1+b2 "Installed" on riscv64 buildd | complete (pure C++, no architecture-specific code, no SIMD) | packaged (universe) for riscv64 in resolute | no dedicated project-report file exists yet for libwebm in this tracking system; no known blockers |
| libyuv | runtime-dependency, optional - used for colorspace conversion in libvpx's test/tool support code; normally vendored, not a hard system link dependency | present in Ubuntu 26.04 "resolute" riscv64 (`libyuv-dev`, universe); Debian sid build "Installed" on riscv64 buildd | partial RVV coverage (see deep-dive below) | packaged (universe) for riscv64 in resolute, released with RVV support | the only genuine RISC-V SIMD work anywhere in libvpx's dependency graph; no dedicated project-report file exists yet for libyuv in this tracking system |
| libcurl | test-dependency, optional - the `curl` CLI (built on libcurl) is used only to download and verify unit-test data vectors, not a link dependency of libvpx itself | present in Ubuntu 26.04 "resolute" riscv64 (main component) | not separately tracked; no known riscv64-specific gaps | packaged (main) for riscv64 in resolute | no known blockers |

**libyuv deep-dive:** libyuv carries partial RVV support contributed by SiFive: `row_rvv.cc` and `scale_rvv.cc` implement RVV intrinsics for row-processing and scaling, with `kCpuHasRVV`/`kCpuHasRVVZVFH` detection flags present in `cpu_id.h`. However, several chroma write-back and luma conversion row functions (`RGB24ToYJRow_RVV`, `RAWToYJRow_RVV`, `RAWToYRow_RVV`, `ARGBToUVRow`) are empty stubs that still fall through to scalar C. This libyuv RVV work is the only genuine RISC-V SIMD code anywhere in libvpx's dependency graph; it does not extend to libvpx's own codec kernels.

**glibc/pthreads:** fully supported; no riscv64 blockers, tier-1 since glibc 2.27.

**NASM/Yasm** (not a formal direct dependency per the list above, but relevant to Section 5): both tools run fine as native riscv64 host binaries in Ubuntu 26.04 "resolute," but neither is invoked for a riscv64 *target* build, since libvpx's x86 assembly paths compile out entirely on that target. This is not a blocker, simply inapplicable.

All build/test/runtime dependencies checked resolve to riscv64 binaries in Ubuntu 26.04 "resolute" (split across `main`: Perl, libcurl; and `universe`: googletest, libwebm, libyuv). No packaging-availability blocker was found for any dependency on riscv64. The real riscv64 gap for libvpx is not in its dependency graph - it is in libvpx's own codebase, which has no dedicated RVV SIMD backend and falls back to the slow generic-C path (see Sections 2, 4, 6).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issues or PRs in upstream | - | - | GitHub code search `repo:webmproject/libvpx riscv` returns 0 results (control query `loongarch` on the same repo returns 36 hits, confirming the index itself works); GitHub issue/PR search "riscv repo:webmproject/libvpx" also returns 0 results |
| aosp-riscv/libvpx #18 | "RISC-V: Add vpx_comp_avg_pred_rvv" | open, unmerged, no activity since Sep 2023 | N/A (community fork, not upstream) | RVV 0.7.1-intrinsic implementation, 1.4x-3.8x claimed speedup on D1 Nezha hardware; stalled on unresolved design question in issue #6 |
| aosp-riscv/libvpx #6 | "Which rvv version should we choose? intrinsic or not?" | open, no comments | N/A (community fork) | Central unresolved design question: RVV 0.7 vs 1.0 intrinsics, GCC vs Clang target compiler |
| aosp-riscv/libvpx #19 | Benchmarking methodology for RVV optimizations | open, no comments | N/A (community fork) | Notes hardware split: D1 (C906) lacks 64-bit-element vector ops that LicheePi 4a (C910) supports, meaning kernels tuned for one may not be optimal on the other |
| (unfiled) | `vp8_sixtap_predict*_rvv` stub silently overrides working C code | shipped in fork's default riscv64 build path, not fixed or reverted | correctness defect (writes nothing to output buffer) | merged in PR #9, wired into RTCD dispatch and `configure.sh`'s unconditional `soft_enable rvv`; no runtime hardware gate; never filed as a tracked issue in the fork's tracker |

The WebM Project's authenticated issue tracker at issues.webmproject.org could not be searched directly (sign-in wall); search-engine indexing of it is limited. Targeted searches for "libvpx" + "riscv" surfaced no matching issue, but this is a low-confidence negative given the indexing limitation. Data not available: any RISC-V bugs that may exist in the authenticated issue tracker.

No riscv64-specific correctness bug exists in upstream libvpx itself - the generic-gnu scalar C path is architecture-neutral. The one identified correctness defect (the `vp8_sixtap_predict*_rvv` stub) is confined to the unmerged, never-shipped, never-tagged community fork and does not affect any distribution's shipped libvpx.

## 12. Objections and Upstream Blockers

**No stated objections found.** No upstream maintainer has publicly rejected a RISC-V port or stated a policy against accepting one. The absence of objections reflects the absence of any Gerrit CL submission, not a green light - the fork's work has never been proposed to upstream via Gerrit.

**Organizational blockers:**

1. No RISC-V silicon vendor has engaged with the libvpx project directly (upstream has no RISC-V entries in its AUTHORS file or supporters list). The LoongArch precedent required sustained effort from Loongson employees; an equivalent RVV port would need comparable investment from a vendor with hardware to test on (SiFive, StarFive, Alibaba T-Head, SpacemiT) or a distro maintainer willing to carry it upstream.
2. Google controls merge decisions via Gerrit and CLA sign-off. Google is a RISE Premier Member with an institutional RISC-V-ecosystem relationship, but this has not translated into any upstream libvpx RISC-V work, Gerrit CL, or funded effort as of this research.
3. The Alliance for Open Media has shifted focus to AV1 (libaom); VP8/VP9 are in maintenance mode. Investment in new architecture ports for VP8/VP9 specifically carries a strategic deprioritization risk relative to AV1 tooling.

**Technical blockers:**

1. CPU feature detection infrastructure for RISC-V is entirely absent upstream. A port requires `vpx_ports/riscv.h`, `vpx_ports/riscv_cpudetect.c`, build-system entries in `configure`/`build/make/configure.sh`, and populated RTCD dispatch entries - none of which currently exist in the canonical repository (the fork's equivalents exist but are unmerged and, per Section 4, partly non-functional).
2. RVV's variable-length vector model (VLEN-agnostic, unlike ARM SVE's fixed-but-scalable or x86 AVX-512's fixed-width model) requires RTCD dispatch extension the fork's own issue #6 identifies as unresolved - specifically the RVV 0.7 vs 1.0 intrinsic question, complicated at the time by incomplete GCC master support for 1.0 intrinsics.
3. VP9 and VP8 collectively have hundreds of SIMD-accelerated functions (ARM's port alone spans ~86 files). A full RVV port to NEON/SSE2 parity is a substantial engineering project; the fork achieved genuine hand-tuned coverage for only 3 leaf functions in three-plus years.

**Acceptance probability:** moderate if a corporate sponsor commits sustained engineering resources and targets parity with the LoongArch port's scope (not full ARM/x86 parity) as an initial milestone, and is willing to route the work through Gerrit rather than rely on the existing GitHub fork.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- Not an optimization-purpose project; no optimization-level rating applies.
- **Justification:** Upstream libvpx ([chromium.googlesource.com/webm/libvpx](https://chromium.googlesource.com/webm/libvpx)) has no CI of any kind (no `.travis.yml`/`.cirrus.yml`/`.gitlab-ci.yml`/`.github/workflows`, all confirmed 404) and no riscv64 target in its `configure`/ARCH_LIST, which alone would be orange. However, Debian sid and Ubuntu 26.04 "resolute" build and ship [`libvpx-dev`/`libvpx12` for riscv64](https://packages.ubuntu.com/resolute/riscv64/libvpx12) (v1.16.0-3) using the project's own unmodified `generic-gnu` fallback target, with no riscv64-specific patches in the Debian packaging diff - exactly the clean-distro-build floor that raises the grade to yellow. All actual RVV/riscv64 development ([aosp-riscv/libvpx](https://github.com/aosp-riscv/libvpx) fork, PRs #5/#9/#12 merged, #18 still open since 2023) lives in a third-party, CI-less, never-tagged fork that has never been upstreamed via Gerrit, so it does not affect upstream's own grade.
- **Pending work that could change the grade:** [PR #18](https://github.com/aosp-riscv/libvpx/pull/18) (`vpx_comp_avg_pred_rvv`, community fork) remains open/unmerged with no activity since September 2023; [issue #6](https://github.com/aosp-riscv/libvpx/issues/6) (RVV 0.7 vs 1.0 intrinsic decision) and [issue #19](https://github.com/aosp-riscv/libvpx/issues/19) (benchmarking methodology) remain open and unresolved in that fork; [vcpkg PR #47245](https://github.com/microsoft/vcpkg/pull/47245) (merged September 2025) added riscv64 to vcpkg's libvpx port mapping, a packaging-layer change only; no Gerrit CL or RISE-funded effort targeting upstream libvpx riscv64 support was found.

## 14. Investment Analysis

RISE has no dedicated blog post, repository, RFP, or funded work for libvpx. A full sweep of riseproject.dev's blog (site search and sitemap enumeration across 35+ posts), the RISE wheel-builder page (87 listed packages, libvpx not among them), and the riseproject-dev GitHub org (~52 repos, no libvpx-named repository) confirms this. The sole touchpoint is incidental: libvpx is compiled in only as a transitive FFmpeg dependency when RISE's `python-wheels` project builds a riscv64 wheel for the Python `av` (PyAV) package via the external `pyav-ffmpeg` build recipe ([PR #461](https://github.com/riseproject-dev/python-wheels/pull/461), [issue #2136](https://github.com/riseproject-dev/python-wheels/issues/2136)), using RISE's native riscv64 CI runners. This is not libvpx-targeted work and does not reduce the scope of any of the investment items below.

### 14.1 Functional Enablement

libvpx is functionally complete on riscv64 today via the generic-gnu scalar C path, confirmed shipping in Debian sid and Ubuntu 26.04 "resolute." No functional enablement work is required; encoding and decoding both VP8 and VP9 already work on riscv64.

### 14.2 Performance Optimization

This is the primary gap. All DSP kernels run scalar C upstream. A production-quality RVV acceleration effort, informed by (and not simply copied from, given the correctness defect noted in Section 4) the aosp-riscv/libvpx fork's prior work, would need to cover:

- CPU feature detection: `vpx_ports/riscv.h`, `riscv_cpudetect.c` with `getauxval(AT_HWCAP)`-based RVV/Zvl*/Zve* detection, with `CONFIG_RUNTIME_CPU_DETECT` properly enabled (the fork's version does not enable this)
- Build system: a genuine `riscv64-linux-gcc` configure target with `-march=rv64gcv` flags, replacing the generic-gnu fallback
- RTCD dispatch: populated riscv entries in `vpx_dsp_rtcd_defs.pl` and `vp8`/`vp9` RTCD definitions
- Resolution of the fork's unresolved RVV 0.7-vs-1.0 intrinsic and GCC-vs-Clang questions (issue #6) before writing new kernels, to avoid the fork's own churn
- Core DSP kernels in ROI order: SAD, variance, convolve/motion compensation, loop filter, DCT/IDCT for VP9 (VP9 currently has zero riscv code in the fork and is the higher-value target given current usage)
- Removal or correction of the fork's `vp8_sixtap_predict*_rvv` stub if any of that code is reused as a starting point
- A benchmarking methodology resolving the open questions in fork issue #19 (hardware variance between D1/C906 and C910-class cores)

A reasonable initial milestone is parity with the LoongArch port's scope (~28 optimized files covering the highest-impact kernels), not full ARM NEON parity (~86 files).

### 14.3 CI/CD Infrastructure

Neither upstream libvpx nor the community RISC-V fork has any CI of any kind (confirmed via direct 404 checks on `.cirrus.yml` and `.github/workflows/` in both repos). Adding riscv64 CI requires either:

- Upstream adoption: proposing a CI pipeline (Google's internal Gerrit-triggered CI is not public, so the concrete path is unclear) - this is a governance discussion with Google, not just a patch
- Distribution-side: Debian/Ubuntu buildd already provides passive build validation; sufficient for build correctness, not for test-suite execution

Sponsoring a RISE runner for cross-compiled test execution via QEMU (following the approach the fork's own PR #5 author used manually) is a medium-effort investment that does not require Google's upstream approval, though it validates only a downstream fork or packaging build, not upstream CI coverage.

### 14.4 Ecosystem Enablement

libvpx has no dependent package ecosystem of its own requiring separate enablement (see Section 9/omission of Section 10) - it is a C library distributed as source, consumed by FFmpeg, GStreamer, Chromium, and Firefox as a build dependency. Those consumers' RISC-V status is tracked in their own respective reports. The one adjacent RISE activity (the `av`/PyAV wheel build bundling libvpx transitively via FFmpeg) is incidental and does not exercise or validate libvpx's own RVV code paths.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | CPU feature detection (riscv.h, riscv_cpudetect.c with proper runtime gating, dedicated riscv64-linux-gcc build target) | 2 | silicon vendor or distro maintainer | High |
| Performance | RTCD dispatch plumbing for riscv64/rvv | 1 | silicon vendor or distro maintainer | High |
| Performance | Resolve RVV 0.7-vs-1.0 intrinsic and toolchain (GCC/Clang) decision before new kernel work | 1 | silicon vendor or distro maintainer | High |
| Performance | RVV SAD and variance kernels (VP9 encode critical path) | 4 | silicon vendor engineer with RVV hardware | High |
| Performance | RVV convolve / motion compensation kernels (VP9 decode critical path) | 6 | silicon vendor engineer with RVV hardware | High |
| Performance | RVV loop filter kernels | 4 | silicon vendor engineer with RVV hardware | Medium |
| Performance | RVV DCT/IDCT kernels | 4 | silicon vendor engineer with RVV hardware | Medium |
| Performance | Audit/replace the community fork's `vp8_sixtap_predict*_rvv` stub if that code is reused, to avoid propagating the correctness defect | 1 | whoever adopts fork code | High (if fork reused) |
| CI/CD | QEMU-based riscv64 test execution (GitHub Actions or RISE runner) | 2 | distro/RISE infrastructure team | Medium |
| Performance | VP8 RVV kernels (lower priority given VP8 usage decline relative to VP9) | 6 | silicon vendor engineer | Low |
| Upstreaming | Propose and shepherd a Gerrit CL series to chromium-review.googlesource.com for any of the above | 2 | silicon vendor or distro maintainer with Google contact | High (gates everything reaching upstream) |

Total estimated effort for the high-priority items (CPU detection, RTCD plumbing, intrinsic-version decision, SAD/variance, convolve, Gerrit upstreaming): approximately 16 person-weeks for a first RVV acceleration pass covering VP9 decode throughput. Full LoongArch-level parity across both codecs: approximately 31 person-weeks.

VP9 is in maintenance mode relative to AV1 within the Alliance for Open Media's roadmap. Before committing this investment, evaluate whether equivalent effort applied to libaom (AV1) would deliver greater strategic return, since libaom is the active development target for the WebM/AOM ecosystem going forward.

## 15. References

- [libvpx GitHub mirror (read-only)](https://github.com/webmproject/libvpx)
- [libvpx upstream canonical repository (Google Gerrit)](https://chromium.googlesource.com/webm/libvpx)
- [WebM Project homepage](https://www.webmproject.org/)
- [WebM Project license terms](https://www.webmproject.org/license/)
- [libvpx configure script (ARCH_LIST)](https://chromium.googlesource.com/webm/libvpx/+/refs/heads/main/configure)
- [libvpx build/make/configure.sh (ISA detection)](https://chromium.googlesource.com/webm/libvpx/+/refs/heads/main/build/make/configure.sh)
- [libvpx build/make/rtcd.pl (rvv dead-code token in priority list)](https://chromium.googlesource.com/webm/libvpx/+/refs/heads/main/build/make/rtcd.pl)
- [libvpx README](https://chromium.googlesource.com/webm/libvpx/+/refs/heads/main/README)
- [libvpx AUTHORS file](https://chromium.googlesource.com/webm/libvpx/+/refs/heads/main/AUTHORS)
- [WebM Project hardware supporters](https://www.webmproject.org/about/supporters/)
- [aosp-riscv/libvpx fork repository](https://github.com/aosp-riscv/libvpx)
- [aosp-riscv/libvpx PR #1 (gtest for riscv64, closed unmerged)](https://github.com/aosp-riscv/libvpx/pull/1)
- [aosp-riscv/libvpx PR #5 (Add riscv64 support, merged)](https://github.com/aosp-riscv/libvpx/pull/5)
- [aosp-riscv/libvpx PR #7 (Add RVV configuration, closed unmerged)](https://github.com/aosp-riscv/libvpx/pull/7)
- [aosp-riscv/libvpx PR #9 (add rvv framework, merged)](https://github.com/aosp-riscv/libvpx/pull/9)
- [aosp-riscv/libvpx PR #10 (add rvv vpx_comp_avg_pred, closed unmerged)](https://github.com/aosp-riscv/libvpx/pull/10)
- [aosp-riscv/libvpx PR #12 (optimize vp8_copy_mem with RVV, merged)](https://github.com/aosp-riscv/libvpx/pull/12)
- [aosp-riscv/libvpx PR #15 (Header file inclusion + vpx_comp_avg_pred_rvv, closed)](https://github.com/aosp-riscv/libvpx/pull/15)
- [aosp-riscv/libvpx PR #16 (Header file inclusion, closed)](https://github.com/aosp-riscv/libvpx/pull/16)
- [aosp-riscv/libvpx PR #17 (guard inclusion with test macro, closed)](https://github.com/aosp-riscv/libvpx/pull/17)
- [aosp-riscv/libvpx PR #18 (Add vpx_comp_avg_pred_rvv, open/unmerged)](https://github.com/aosp-riscv/libvpx/pull/18)
- [aosp-riscv/libvpx issue #6 (RVV 0.7 vs 1.0 intrinsic decision, open)](https://github.com/aosp-riscv/libvpx/issues/6)
- [aosp-riscv/libvpx issue #19 (benchmarking methodology, open)](https://github.com/aosp-riscv/libvpx/issues/19)
- [vcpkg PR #47245 (libvpx riscv64 linux port support, merged)](https://github.com/microsoft/vcpkg/pull/47245)
- [Debian tracker: libvpx](https://tracker.debian.org/pkg/libvpx)
- [Debian buildd status: libvpx riscv64](https://buildd.debian.org/status/package.php?p=libvpx)
- [Debian packages: libvpx-dev (sid, riscv64)](https://packages.debian.org/unstable/libvpx-dev)
- [Ubuntu 26.04 "resolute": libvpx12 riscv64 package](https://packages.ubuntu.com/resolute/riscv64/libvpx12)
- [Ubuntu packages search: libvpx, suite resolute](https://packages.ubuntu.com/search?keywords=libvpx&suite=resolute&searchon=names&section=all)
- [Ubuntu 24.04 Noble: libvpx packages](https://packages.ubuntu.com/search?keywords=libvpx&suite=noble&searchon=names&section=all)
- [EESSI: libvpx available software (riscv64, generic target)](https://www.eessi.io/docs/available_software_riscv/detail/libvpx/)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=libvpx)
- [openEuler / src-openEuler libvpx packaging (riscv64 patch)](https://gitee.com/src-openeuler/libvpx)
- [libyuv row_rvv.cc (RVV intrinsics for YUV row processing)](https://chromium.googlesource.com/libyuv/libyuv/+/refs/heads/main/source/row_rvv.cc)
- [libyuv Debian sid riscv64 build](https://buildd.debian.org/status/package.php?p=libyuv)
- [libwebm Debian sid riscv64 build](https://buildd.debian.org/status/package.php?p=libwebm)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.dev/python/wheel_builder/)
- [riseproject-dev/python-wheels PR #461 (av 18.1.0, bundles libvpx transitively via FFmpeg)](https://github.com/riseproject-dev/python-wheels/pull/461)
- [riseproject-dev/python-wheels issue #2136 (av riscv64 support)](https://github.com/riseproject-dev/python-wheels/issues/2136)
- [chipsandcheese.com: A RISC-V progress check, benchmarking (adjacent codec context, x264)](https://chipsandcheese.com/p/a-risc-v-progress-check-benchmarking)