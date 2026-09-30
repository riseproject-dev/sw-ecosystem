---
title: libopus
parent: Project Reports
color: yellow
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: Meson
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: automake
    relation: build-dependency
    criticality: optional
  - name: Ninja
    relation: build-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="libopus" %}

# libopus

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for libopus<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libopus is the reference implementation of the Opus audio codec, an IETF standard published as RFC 6716 (September 2012), available at [rfc-editor.org](https://www.rfc-editor.org/rfc/rfc6716). The codec combines two audio technologies: SILK (originally from Skype, optimized for voice) and CELT (from Xiph.Org, optimized for music and general audio). The library is written in C with architecture-specific SIMD acceleration for x86, ARM, MIPS, and Xtensa; there is no RISC-V SIMD backend.

Xiph.Org Foundation is a US non-profit corporation. Governance is volunteer-driven: there is no MAINTAINERS file in the repository (confirmed absent on both [GitLab](https://gitlab.xiph.org/xiph/opus) and the [GitHub mirror](https://github.com/xiph/opus)), no formal steering committee, no Contribution License Agreement, and no published membership-tier or platform-tier policy. The project coordinates via GitLab, the GitHub mirror, IETF mailing lists, and IRC (`#opus` on irc.libera.chat).

The AUTHORS file lists six individuals: Jean-Marc Valin, Koen Vos, Timothy B. Terriberry, Karsten Vandborg Sorensen, Soren Skak Jensen, and Gregory Maxwell, reflecting the codec's origin from the 2010-2012 merger of Xiph's CELT and Skype's SILK. Jean-Marc Valin is the primary active maintainer; his corporate affiliations in sequence are reported as Octasic (2008-2011), Mozilla (2011-2019), Amazon Web Services (2019-2024), and Google (2024-present), and he is reported to author the large majority of recent commits on the GitHub mirror [NEEDS VERIFICATION - commit-count and affiliation detail is carried from a single prior pass and was not independently re-verified in this round]. Timothy B. Terriberry (co-author of RFC 6716) is another named active contributor.

Copyright holders named in the COPYING file: Xiph.Org, Skype Limited, Octasic, Jean-Marc Valin, Timothy B. Terriberry, CSIRO, Gregory Maxwell, Mark Borgerding, Erik de Castro Lopo, Mozilla, Amazon. License: BSD 3-clause.

Patent posture: Xiph.Org, Broadcom, and Microsoft (via the Skype acquisition) provide royalty-free irrevocable patent grants. Four other entities (Qualcomm, Huawei, France Telecom, Ericsson) filed disclosures of potentially relevant patents; external counsel reportedly concluded no license is required. [NEEDS VERIFICATION - no primary source document for the "external counsel concluded" claim was located in any research pass.]

Community culture on new ports is informal and, on the RISC-V evidence available, low-engagement: the only RISC-V-targeted pull request in the repository's history (PR #476, opened and closed the same day, June 10, 2026) received zero maintainer review comments. The still-open RISC-V tracking issue (#368, opened October 2024) likewise has zero comments after roughly two years.

The project is not a member of the RISE project. RISE's Premier Members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and General Members (including Canonical, Microchip, and others) are listed on [riseproject.dev](https://riseproject.dev/), but libopus does not appear on the homepage's ten working-group focus areas, nor among named RISE RFP projects found in search (e.g. RP001 Go Runtime, RP003 libjpeg-turbo, RP009 LLVM SPEC Optimization, RP013 PyTorch ATen Operators). A full scan of the RISE blog sitemap (33 resolvable posts, May 2024 through September 2026) found zero posts mentioning Opus, libopus, audio, or codec.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| March 2024 | Issue #323 opened: reporter confirms libopus 1.5.1 builds successfully on two RISC-V boards (VisionFive 2, JH7110/RV64GC; MangoPi MQ-Pro, Allwinner D1/C906/RV64GCV) despite unrelated ARM build warnings. First public confirmation of riscv64 build success. | [Issue #323](https://github.com/xiph/opus/issues/323) |
| October 4, 2024 | Issue #368 opened by k-kisielak (Samsung R&D Poland, with partial RISE Project engineer involvement per the issue text). Announces RVV intrinsics work for the SILK module (porting the existing SSE implementation), developed on a personal fork branch, [k-kisielak/opus:rvv_impl](https://github.com/k-kisielak/opus/tree/rvv_impl). Test hardware referenced: BananaPI F3 (SpacemiT K1 SoC), plus QEMU. Explicitly described by the author as "in early stage and is not deemed for merging in current form." Zero comments as of this writing, roughly two years after opening. | [Issue #368](https://github.com/xiph/opus/issues/368) |
| February 2025 | PR #392 opened as a draft by MarekPikula, "RFC: Streamline implementation overrides," motivated directly by the RISC-V work in #368. Refactors the RTCD (Run-Time CPU Detection) dispatch mechanism to reduce duplication when adding a new SIMD backend. Blocked on a C90/C99 compatibility constraint (use of `__VA_ARGS__`). Still draft; no merge decision recorded. | [PR #392](https://github.com/xiph/opus/pull/392) |
| June 10, 2026 | PR #476, "Add initial RISC-V platform recognition," opened by external contributor carlosqwqqwq at 07:03:26Z and closed unmerged by the same author at 09:52:39Z the same day. Adds `riscv`/`riscv64` CPU-family recognition to CMake and autotools platform detection and marks 64-bit RISC-V as a fast-64-bit-integer target via `__riscv_xlen`. Explicitly "a conservative platform recognition patch... without RVV optimized backends." Zero maintainer review comments; the author deleted the source branch (`carlosqwqqwq/opus:codex/riscv-opus`) on close. | [PR #476](https://github.com/xiph/opus/pull/476) |

**Current state:** No RISC-V-specific code has ever been merged into upstream xiph/opus, on either GitLab (the canonical repository) or the GitHub mirror. The `rvv_impl` branch referenced in Issue #368 exists only on the author's personal fork and has not been submitted as a merge request or pull request against `xiph/opus`. A fresh clone of the repository at HEAD `503d81b` (2026-09-08) confirms `grep -ril "riscv" .` across the entire tree returns zero matches.

**Key contributor org:** Samsung R&D Poland (via the k-kisielak account) is the only organization on record with active RISC-V work related to libopus, with partial engineering time from the RISE Project per the issue text. This is not the same as formal RISE Project sponsorship or a published RISE RFP grant; no such grant for libopus was found in any RISE blog post, the RISE wheel-builder listing, or the riseproject-dev GitHub organization.

## 3. Upstream Support Tier

No formal tier policy is documented anywhere in the project's materials. Tier status is inferred from direct evidence:

| Signal | amd64 | arm64 | riscv64 |
|--------|-------|-------|---------|
| Architecture-specific SIMD directories | Yes (`celt/x86`, `silk/x86`, `dnn/x86`) | Yes (`celt/arm`, `silk/arm`, `dnn/arm`) | No |
| CI coverage (GitHub Actions) | Yes (ubuntu-latest / windows-latest / macos-latest) | Partial (Windows/macOS/iOS ARM64, Android arm64-v8a) | No |
| CI coverage (GitLab) | Yes (`avx2`-tagged runner) | Yes (`gstreamer-arm64-linux-docker` runner) | No |
| Official upstream binaries | No (source tarball only, all archs) | No | No |
| Distribution packages | Yes | Yes | Yes (Debian, Ubuntu) |
| Recognized by CMake build system | Yes | Yes | No (PR #476 closed unmerged) |
| Recognized by autotools `configure.ac` | Yes | Yes | No |
| Recognized by meson (as an "optimizations-eligible" `host_cpu_family`) | Yes | Yes | No (explicitly excluded, see Section 4) |

**Effective tier: unrecognized by the build system, but portable.** riscv64 is not a named CPU family in any of the project's three build systems (CMake, autotools, meson), has no CI of any kind, and has no architecture-specific optimization work. The library compiles and runs correctly on riscv64 solely because its generic C code path is architecture-neutral, not because riscv64 is an acknowledged target.

## 4. Technical Architecture and RISC-V-Specific Subsystems

libopus contains two codec modules (CELT and SILK) plus a DNN subsystem (for DRED, Deep PLC, OSCE). Each module has a portable C implementation plus architecture-specific SIMD acceleration, selected at runtime via RTCD (Run-Time CPU Detection).

Architecture-specific source directories, confirmed by direct repository listing (both the GitLab API and a fresh clone at HEAD `503d81b`):

| Directory | Target | Optimization type |
|-----------|--------|-------------------|
| `celt/x86/` | x86/x86_64 | SSE, SSE2, SSE4.1, AVX2 intrinsics |
| `silk/x86/`, `silk/fixed/x86/`, `silk/float/x86/` | x86/x86_64 | SSE4.1, AVX2 intrinsics |
| `dnn/x86/` | x86/x86_64 | AVX for DNN inference |
| `celt/arm/` | ARM/AArch64 | NEON intrinsics plus ARMv4/ARMv5e assembly |
| `silk/arm/`, `silk/fixed/arm/` | ARM/AArch64 | NEON intrinsics, NEON fixed-point arithmetic |
| `dnn/arm/` | ARM/AArch64 | NEON/DOTPROD for DNN inference |
| `celt/mips/`, `silk/mips/`, `silk/fixed/mips/` | MIPS | Header-only MIPSr1 optimizations (FFT, MDCT, pitch, fixed-point) |
| `silk/xtensa/` | Xtensa LX7 | LX7 DSP macros |

There is no `celt/riscv/`, `silk/riscv/`, `dnn/riscv/`, or any other RISC-V directory. This is corroborated directly by the build system, which is unusually explicit about the gap. `meson.build` (lines 708-710) contains:

```
if host_cpu_family not in ['arm', 'aarch64', 'x86', 'x86_64']
  set_variable(res, 'No optimizations for your platform, please send patches')
endif
```

riscv64 falls outside this list, so meson emits this message and proceeds with the generic C path. `configure.ac` (lines 224-225) likewise restricts its asm/SIMD architecture case statement to `i386`, `x86_64`, `arm*`, `aarch64*`, `powerpc64`, `powerpc32`, and `ia64` only; riscv64 is absent. The `celt/cpu_support.h` RTCD dispatch mechanism recognizes only ARM and x86 feature flags; on riscv64 it falls into the generic branch with `OPUS_ARCHMASK 0` and no runtime dispatch.

Component-level status on riscv64:

| Component | Function | amd64 | arm64 | riscv64 | ISA extensions used on riscv64 |
|-----------|----------|-------|-------|---------|-------------------------------|
| CELT FFT/MDCT | Core transform for music/audio | AVX2 hand-tuned | NEON intrinsics | Scalar C fallback | None |
| CELT pitch xcorr | Autocorrelation for pitch detection | AVX2 | NEON | Scalar C fallback | None |
| SILK NSQ | Noise-shaping quantizer | AVX2 | NEON | Scalar C fallback | None |
| SILK LPC | Linear predictive coding | SSE4.1 | NEON | Scalar C fallback | None |
| SILK biquad | Biquad filter | SSE4.1 | NEON | Scalar C fallback | None |
| DNN inference (DRED, Deep PLC) | Neural net for enhancement | AVX | NEON/DOTPROD | Scalar C fallback | None |
| Fixed-point arithmetic | Optional fixed-point math path | SSE4.1 | NEON | Scalar C fallback | None |
| RTCD dispatch | Runtime CPU feature selection | x86 feature flags | ARM feature flags | No dispatch (ARCHMASK=0) | N/A |

No RVV (RISC-V Vector) intrinsics, no Zba/Zbb scalar-extension usage, and no RISC-V assembly files exist anywhere in the repository. There is no RISC-V "stub": a stub implies a scaffolded file with an unimplemented body, and no such file exists for riscv64 in `celt/`, `silk/`, or `dnn/`. The only reason riscv64 works at all is that the generic/portable C path (the same fallback used for any architecture without a SIMD backend, e.g. powerpc, s390x) is architecture-neutral.

## 5. Build System, Cross-Compilation, and Toolchain

Because riscv64 is not a named CPU family in any of the three build systems, all SIMD paths are inactive by default on riscv64 and the generic C path is selected automatically.

**CMake (cross-compilation):**

```
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DOPUS_DISABLE_INTRINSICS=ON \
  -DOPUS_BUILD_PROGRAMS=ON \
  -DBUILD_TESTING=ON
cmake --build build
```

`-DOPUS_DISABLE_INTRINSICS=ON` is not strictly required (riscv64 triggers no intrinsics path in the current build system) but is explicit best practice. CMake minimum required version: 3.16. Relevant CMake options that exist in the repository's `CMakeLists.txt` (none riscv-specific): `OPUS_BUILD_PROGRAMS`, `BUILD_TESTING`, `OPUS_FAST_MATH`, `OPUS_FLOAT_APPROX`, `OPUS_DRED`, `OPUS_OSCE`, `OPUS_X86_PRESUME_AVX2`, `OPUS_DISABLE_INTRINSICS`.

**Autotools (cross-compilation):**

```
./autogen.sh
./configure \
  --host=riscv64-linux-gnu \
  --disable-asm \
  CC=riscv64-linux-gnu-gcc
make -j$(nproc)
```

`--disable-asm` suppresses ARM/x86 assembly-detection warnings and is a safe no-op on riscv64. `configure.ac` does not include `riscv*` in the architecture case statement that sets `has_float_approx=yes` (see Section 4), so the float-approximation path must be enabled explicitly with `--enable-float-approx` if desired. PR #476, which would have added automatic `riscv*` recognition, was closed unmerged.

**Meson (cross-compilation):**

Cross file `riscv64-cross.ini`:

```
[binaries]
c = 'riscv64-linux-gnu-gcc'
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'

[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'
```

```
./autogen.sh
meson setup builddir \
  --cross-file riscv64-cross.ini \
  -Dtests=enabled \
  -Dbuildtype=release
meson compile -C builddir
meson test -C builddir
```

With `host_cpu_family = 'riscv64'`, meson prints "No optimizations for your platform, please send patches" (see Section 4) but does not error. Do not pass `-Dintrinsics=enabled`, which triggers a hard error for unrecognized architectures.

**QEMU:** No QEMU configuration for RISC-V exists in the repository (the project's only QEMU-based CI targets MIPS, see Section 7). Standard QEMU user-mode emulation works for local testing:

```
QEMU_LD_PREFIX=/usr/riscv64-linux-gnu qemu-riscv64 ./build/opus_demo
```

**Required toolchain versions:** CMake >= 3.16. Meson >= 0.54.0. C99 (`c_std=gnu99` in `meson.build`; `CMAKE_C_STANDARD 99` in `CMakeLists.txt`). Any GCC >= 7 (first GCC release with riscv64 target support) or Clang >= 9 with `--target=riscv64-linux-gnu` is sufficient. The Debian bookworm cross-toolchain (`gcc-riscv64-linux-gnu`) provides GCC 12.

**Known build failures:** None reported in the issue tracker or CI logs for a generic-C riscv64 build. Issue #323 confirms successful builds on VisionFive 2 (RV64GC) and MangoPi MQ-Pro (RV64GCV) hardware in early 2024 using libopus 1.5.1.

No Dockerfile exists anywhere in the repository (CI jobs pull stock `debian:bookworm-slim`/`gcc` Docker Hub images inline, not a custom Dockerfile), so there is no riscv64-specific Dockerfile to report.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature / Capability | amd64 | arm64 | riscv64 |
|---------------------|-------|-------|---------|
| Encoding (correctness) | Full | Full | Full |
| Decoding (correctness) | Full | Full | Full |
| CELT SIMD acceleration | AVX2 | NEON | None (scalar C) |
| SILK SIMD acceleration | SSE4.1/AVX2 | NEON | None (scalar C) |
| DNN inference (DRED/Deep PLC) | AVX | NEON/DOTPROD | Scalar C |
| Float-approximation path (autotools) | Yes (auto-detected) | Yes (auto-detected) | No (not auto-detected; requires `--enable-float-approx`) |
| RTCD runtime dispatch | Yes | Yes | No (ARCHMASK=0) |
| RVV Vector extension | N/A | N/A | Not implemented |
| CI coverage | Yes | Partial | None |

**Functional gaps:** None. The generic C path implements the full Opus specification. Every Opus profile (SILK, CELT, Hybrid) and every optional feature (DRED, Deep PLC, OSCE, fixed-point) compiles and runs correctly on riscv64.

**Performance gaps:** All SIMD-accelerated functions (CELT MDCT/pitch xcorr, SILK NSQ/LPC/biquad, DNN inference) fall back to scalar C on riscv64. Quantified data is sparse. The one concrete, numbers-bearing report found is Microchip's "PolarFire SoC FPGA: Opus Codec Benchmarking" white paper (2021, [ww1.microchip.com](https://ww1.microchip.com/downloads/aemDocuments/documents/FPGA/ProductDocuments/SupportingCollateral/whitepapers/Microchip_PolarFire_SoC_FPGA_Opus_Codec_Benchmarking_White_Paper.pdf)), which tested libopus 1.3.1-91-g7b05f44f (pre-1.4, scalar C, no vector intrinsics) on a PolarFire SoC Icicle Kit (MPFS250T, single 600 MHz RISC-V core). Reported figures: code size (.text) 194,142 bytes, rodata 52,048 bytes, sdata 1,310 bytes, BSS 16 bytes; RFC 8251 test-vector pass rate 99% (14/14 core unit tests, one audio-quality comparison failure at high-bitrate stereo); no cycles-per-sample, real-time factor, or any ARM/x86 comparison is given. [NEEDS VERIFICATION - single source, and the tested libopus revision predates the current 1.6.x line by several years, so it should not be read as representative of current scalar performance.] Data not available: no other quantified riscv64-vs-arm64 or riscv64-vs-amd64 encode/decode benchmark was found in any RISE publication, GitHub discussion, or general web search as of 2026-09-30.

**Security hardening gaps:** Data not available: no issue or documentation addressing stack hardening, CFI, or similar flags specifically for riscv64 was found. The `libssp` build flag referenced in the codebase is MinGW/Windows-only; Linux riscv64 relies on compiler-integrated SSP.

## 7. CI/CD Infrastructure

All seven CI files in the xiph/opus repository (`.gitlab-ci.yml` plus six `.github/workflows/*.yml` files) were fetched and read directly, and each was grepped case-insensitively for "riscv". Result: zero occurrences in all seven files, confirmed on an independent re-verification pass.

| CI file | Architectures covered | riscv64 present |
|---------|----------------------|-----------------|
| `.gitlab-ci.yml` | x86_64 (`avx2`-tagged runners: `autoconf`, `cmake`, `meson x86_64` jobs); arm64 (`gstreamer-arm64-linux-docker` runner: `meson arm64` job); default-runner `makefile` job (gcc image) | No |
| `.github/workflows/autotools.yml` | ubuntu-latest (x86_64), plus a conditional macOS branch | No |
| `.github/workflows/autotools-cross-mips.yml` | MIPS32/MIPS64 (`mipsel-unknown-linux-musl(sf)`, `mips64el-unknown-linux-musl`) via QEMU, using prebuilt musl-cross toolchains | No |
| `.github/workflows/cmake.yml` | Linux/Windows/macOS x64; Windows/macOS ARM64/iOS arm64; Android (arm64-v8a, x86, x86_64) | No |
| `.github/workflows/dred.yml` | Windows x64/ARM64, Linux x64, Android (x86_64, arm64-v8a), macOS x64, iOS arm64 | No |
| `.github/workflows/makefile.yml` | ubuntu-latest, gcc, no arch matrix | No |
| `.github/workflows/repository.yml` | Trailing-whitespace check only (`git diff-tree --check`), no build/arch matrix | No |

The `.github/workflows` directory listing was independently fetched and confirmed to contain exactly these six files; no hidden or differently-named riscv workflow exists. `.gitlab-ci.yml` includes only the `Workflows/Branch-Pipelines.gitlab-ci.yml` template and no other files.

The MIPS cross-compile job (`autotools-cross-mips.yml`) is the project's only QEMU-based cross-architecture CI and demonstrates the project is technically willing to run QEMU-based CI for a non-native architecture; no equivalent exists for riscv64. No Jenkinsfile or `.cirrus.yml` exists in the repository. No RISE runners (`riseproject-dev/riscv-runner`) are used by this project.

| CI dimension | amd64 | arm64 | riscv64 |
|--------------|-------|-------|---------|
| GitHub Actions | Yes | Partial | No |
| GitLab CI | Yes (`avx2` runner) | Yes (`gstreamer-arm64-linux-docker`) | No |
| QEMU cross | No | No | No |
| Hardware-in-loop | No | No | No |
| RISE runners | No | No | No |

Downstream distro packaging of riscv64 binaries (Section 8) involves zero upstream CI; it should not be conflated with riscv64 CI existing for libopus itself.

## 8. Distribution and Release Status

**Upstream releases:** xiph/opus ships source-only releases on GitHub/GitLab. No pre-built binary exists for any architecture from upstream; every release asset is a generic source tarball (e.g. `opus-1.5.2.tar.gz`).

**Ubuntu 26.04 "resolute":** Confirmed directly via [packages.ubuntu.com](https://packages.ubuntu.com/resolute/riscv64/libopus0) (HTTP 200). `libopus0` and `libopus-dev`, version 1.6.1-1, are listed for `amd64 arm64 armhf i386 ppc64el riscv64 s390x`. The riscv64 package detail page lists Package Size 3,455.4 kB, Installed Size 4,060.0 kB, and the filelist shows a real compiled shared-library artifact at `/usr/lib/riscv64-linux-gnu/libopus.so.0.11.1`, an architecture-triplet path that is not a template or placeholder. Also present for riscv64 in resolute: `libopus-doc` (arch-independent), `libopus-ocaml`/`libopus-ocaml-dev` 1.0.0-1build5, and `libopusenc0`/`libopusenc-dev`/`libopusenc-doc` 0.3-1. Ubuntu 24.04 "noble" also lists `libopus0 1.4-1build1` for riscv64 alongside the other architectures.

**Debian sid:** `libopus0 1.6.1-1+b1` and `libopus-dev 1.6.1-1+b1` are built for riscv64 as an official Debian port (not unofficial debports), build host `rv-osuosl-05`, status "Installed" at time of check. Confirmed via the [Debian buildd tracker](https://buildd.debian.org/status/package.php?p=opus&suite=sid). The `+b1` suffix indicates a binary-only NMU rebuild for the architecture.

**No riscv64-specific patches were found or needed** in either Debian or Ubuntu packaging: both build the unmodified upstream generic-C source.

**Arch Linux RISC-V:** No package inventory entry for "opus" or "libopus" was found via a direct fetch of the [archriscv.felixc.at](https://archriscv.felixc.at) homepage, and no riscv64-specific patch entry was found in the `felixonmars/archriscv-packages` repository. [NEEDS VERIFICATION - the archriscv homepage's package search may be JavaScript-driven and not reachable via a static fetch; this should not be read as confirmation the port is absent, only that it could not be positively confirmed.]

**PyPI:** No package named `libopus` exists on PyPI (`pypi.org/pypi/libopus/json` returns HTTP 404, confirmed on two independent passes). Not applicable to this project; opus is a C library, not a PyPI-distributed package.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/libopus/` redirects to the same nonexistent PyPI page. Not applicable. Separately, "libopus" is not among the 84 packages listed at [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/).

**What a user must do to get a working binary:** On Debian or Ubuntu, `apt install libopus-dev` delivers a working riscv64 binary with no additional steps. On other distributions, build from the source tarball using the cross-compilation commands in Section 5; no riscv64-specific patches are required for a correct generic-C build.

## 9. Dependencies

libopus's codec itself has no external runtime/library dependencies: there are no `dependency()`/`find_package()` calls for any external codec/DSP library and no `.gitmodules` entries. It links only against `libm` (via `find_library('m', required: false)`) and, on Windows only, `libssp`. All of the dependencies below are build-time, test-time, or runtime-toolchain items, not linked codec libraries.

| Name | Role | riscv64 status |
|------|------|-----------------|
| GCC | Build-dependency, critical. Primary C compiler (`c_std=gnu99`); any GCC >= 7 provides riscv64 target support. | Present and released for riscv64 in Ubuntu 26.04/Debian sid (`gcc-riscv64-linux-gnu` cross-toolchain, e.g. GCC 12 in bookworm). |
| GNU make | Build-dependency, critical. Drives `Makefile.unix` and the autotools build. | Present and released for riscv64 in Ubuntu 26.04 resolute. |
| Meson | Build-dependency, critical. Primary build system used in GitLab CI (`meson x86_64`, `meson arm64` jobs). | Architecture:all (pure Python) upstream; expected present for riscv64 as part of the generic Debian/Ubuntu toolchain, though the project-graph lookup used in an earlier research pass returned no explicit riscv64 row for this Architecture:all package (a likely indexing gap for arch:all packages, not a real gap). [NEEDS VERIFICATION] |
| CMake | Build-dependency, optional. Alternate build system (`CMakeLists.txt`); GitLab CI `cmake` job. | Present and released for riscv64 in Ubuntu 26.04 resolute. |
| autoconf | Build-dependency, optional. Autotools build system (`configure.ac`, `autogen.sh`). | Architecture:all upstream; same indexing caveat as Meson applies. [NEEDS VERIFICATION] |
| automake | Build-dependency, optional. Autotools build system. | Architecture:all upstream; same indexing caveat as Meson applies. [NEEDS VERIFICATION] |
| Ninja | Build-dependency, optional. Meson/CMake build backend used in GitLab CI's `meson` and `cmake` jobs. | Present and released for riscv64 in Ubuntu 26.04 resolute. |
| glibc | Runtime-dependency, critical. C standard library and headers (`libc6`/`libc6-dev`, `>= 2.27` required, a lower bar than arm64's requirement). | Present and released for riscv64 in Ubuntu 26.04/Debian sid; libopus0 1.6.1-1+b1 built successfully against it on `rv-osuosl-05`. |
| QEMU | Test-dependency, critical, for cross-architecture CI/test execution and local emulation (`qemu-user`, `qemu-riscv64`). | Present and released for riscv64-capable packages in Ubuntu 26.04 resolute; used for the project's MIPS CI (not riscv64) and for ad hoc local riscv64 testing described in Section 5. |
| libtool / libtool-bin | Autotools libtoolize/link helper, build-time. | `libtool-bin` present and released for riscv64 in Ubuntu 26.04 resolute; the plain `libtool` metapackage did not return a row in the same lookup, likely the same arch:all indexing caveat. [NEEDS VERIFICATION] |
| pkg-config / pkgconf | Generates `.pc` files (`opus.pc.in`, `opus-uninstalled.pc.in`), build-time. | Both present and released for riscv64 in Ubuntu 26.04 resolute. |
| Doxygen | Optional API documentation generation, build-time only. | Present and released for riscv64 in Ubuntu 26.04 resolute; no runtime effect. |
| Perl | Build-time only, translates RVCT ARM assembly syntax to GAS (ARM-only code path). | Present and released for riscv64 in Ubuntu 26.04 resolute; not relevant to riscv64 builds since the code path it serves is ARM-only. |
| Git | Build-time only: `git describe` for package versioning in CMake. | No runtime or riscv64-specific effect. |
| libm | Runtime-dependency. Standard C math library (`lrintf`, `lrint`, and other math functions), linked via `find_library('m', required: false)`. | Ships as part of glibc; present on riscv64 wherever glibc is present. |

None of these dependencies have any reported riscv64-specific blocking issue. No RISC-V-specific patch or workaround was found necessary for any of them in the context of building libopus.

**Downstream consumers of libopus relevant to this repository's scope:**

| Consumer | Dependency type | Notes |
|----------|----------------|-------|
| FFmpeg | `--enable-libopus` for Opus encode/decode | See `./project-reports/ffmpeg.md` |
| GStreamer | `gst-plugins-base` opusenc/opusdec elements | See `./project-reports/gstreamer.md` |

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#368](https://github.com/xiph/opus/issues/368) | RISC-V port implementation | Open (since Oct 2024) | Performance/enablement | Samsung R&D Poland (plus partial RISE Project engineering time) RVV work for SILK on a private `rvv_impl` fork branch. Author states it is "not deemed for merging in current form." No public branch on the upstream repo, no benchmark figures posted, zero comments in roughly two years. |
| [#392](https://github.com/xiph/opus/pull/392) | RFC: Streamline implementation overrides | Draft PR (Feb 2025) | Infrastructure | RTCD dispatch refactor motivated by #368, to ease adding new SIMD backends. Blocked on a C90 vs C99 compatibility constraint. No merge decision. |
| [#476](https://github.com/xiph/opus/pull/476) | Add initial RISC-V platform recognition | Closed unmerged (opened and closed same day, Jun 10, 2026) | Build system | CMake/autotools `riscv`/`riscv64` CPU-family recognition only, no SIMD code. Zero maintainer review comments; author self-closed and deleted the branch. |
| [#323](https://github.com/xiph/opus/issues/323) | Compiling libopus 1.5.1 with Linux fails on ARM Cortex-A53 and Cortex-A55 | Open (reopened, Mar 2024) | Build (ARM only) | Primary bug is ARM NEON-related; riscv64 is referenced only as a positive comparison point (VisionFive 2, MangoPi MQ-Pro build successfully). No riscv64 action item. |
| [#469](https://github.com/xiph/opus/issues/469) [NEEDS VERIFICATION] | OPUS 1.6.1 consumes more CPU than 1.5.2 | Open (Apr 2026) | Performance (all archs) | ~5-10% CPU regression attributed to new CELT tone-detection code, reportedly more noticeable on lower-performance platforms. Carried from a single prior research pass; not independently re-confirmed in this round. |
| [#475](https://github.com/xiph/opus/issues/475) [NEEDS VERIFICATION] | `opus_cpu_feature_check` does not check XState | Open | Correctness (x86 only) | SIMD feature-detection bug; riscv64 is unaffected since it has no RTCD dispatch. Carried from a single prior research pass. |
| [#477](https://github.com/xiph/opus/issues/477) [NEEDS VERIFICATION] | HYBRID + DTX: CELT encoded then discarded on silent frames in 1.6.1 | Open (Jun 2026) | Correctness (all archs) | Regression vs 1.5.2, platform-agnostic, would affect riscv64 equally. Carried from a single prior research pass. |

**riscv64-specific correctness bugs:** None found. Direct search of the GitHub issue tracker for "riscv"/"riscv64"/"RVV" across all issues and PRs returns only #368 and #476; a Debian bug-tracker query for `libopus0` returns "No reports found!"; Ubuntu's riscv64/riscv32-tagged bug lists contain no libopus-specific entries. opus-codec.org's libopus 1.6 release notes (December 2025, [opus-codec.org](https://opus-codec.org/release/stable/2025/12/15/libopus-1_6.html)) make no mention of RISC-V, RVV, or riscv64.

## 12. Objections and Upstream Blockers

**Stated objections:** No explicit maintainer objection to RISC-V support exists on record. PR #476 received zero review comments, and Issue #368 has received zero comments in roughly two years; the maintainer (Jean-Marc Valin) has not engaged publicly with either. This is ambiguous: it could reflect disinterest, or it could reflect that the maintainer is waiting for a more complete contribution (an RVV SIMD backend plus CI, rather than build-system recognition alone).

**Technical blockers:**

1. The RTCD refactor (PR #392) is blocked on a C90 vs C99 compatibility constraint. The existing RTCD dispatch mechanism is patterned around x86 and ARM; adding a third architecture cleanly depends on this refactor landing first. Adding RVV support without it would require duplicating the dispatch boilerplate the refactor is meant to eliminate.
2. No public RVV implementation branch exists against the upstream repository. Issue #368 references the `rvv_impl` branch, but it remains only on a personal GitHub fork and has never been opened as a merge request or pull request, so the code is not publicly reviewable by other contributors.
3. No CI infrastructure (riscv64 runner or QEMU cross-compile job) exists for RISC-V. Any RVV patch would arrive without upstream CI validation, which lowers its acceptance probability relative to the ARM/x86/MIPS precedent where CI exists.

**Organizational blockers:**

1. The project has a very small maintainer base, dominated by one primary maintainer (Valin). Any RISC-V work that does not have his buy-in is unlikely to merge.
2. RISE Project involvement is, at most, partial engineering time contributed to Samsung R&D Poland's effort per the text of Issue #368; there is no RISE-funded RFP project, RISE blog coverage, or RISE CI runner usage for libopus.
3. The CI pipeline requires GPG-signed commits (`ci-fairy check-commits --gpg-signed-commit`), a setup burden that adds friction for new external contributors.

**Acceptance probability:** For a complete patch (RVV SIMD backend plus CI plus build-system recognition), moderate, given precedent of the project accepting MIPS and Xtensa architecture-specific optimizations in the past. For a build-system-recognition-only patch, low, based directly on PR #476's outcome (closed same-day, zero review). The absence of any maintainer comment on either #368 or #476 makes this difficult to calibrate more precisely.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** No upstream CI builds or tests riscv64 for libopus: all seven CI files (`.gitlab-ci.yml`, six `.github/workflows/*.yml` files) were read directly and contain zero riscv64/riscv mentions, covering only x86_64, arm64, and MIPS (via QEMU). No riscv64 merge requests or issues exist on [gitlab.xiph.org](https://gitlab.xiph.org/xiph/opus), and the only GitHub-mirror riscv64 items are a stalled tracking issue ([#368](https://github.com/xiph/opus/issues/368)) and a closed, unmerged platform-detection PR ([#476](https://github.com/xiph/opus/pull/476)), with no code merged. Debian and Ubuntu do, however, build and ship `libopus0`/`libopus-dev` for riscv64 from unmodified upstream source via the portable generic-C fallback path, with no riscv64-specific patches needed or found: Ubuntu 26.04 resolute lists `libopus0`/`libopus-dev` 1.6.1-1 for riscv64 with a real compiled artifact at `/usr/lib/riscv64-linux-gnu/libopus.so.0.11.1` ([packages.ubuntu.com](https://packages.ubuntu.com/resolute/riscv64/libopus0)), and Debian sid ships `libopus0`/`libopus-dev` 1.6.1-1+b1 via the official Debian riscv64 port ([buildd.debian.org](https://buildd.debian.org/status/package.php?p=opus&suite=sid)). This satisfies a "no upstream CI, but distro builds from unmodified upstream source" distribution floor, yielding yellow (clean-distro-build). libopus is not treated as an optimization-purpose project for grading purposes: its value proposition is RFC 6716 standards-compliant audio coding (bitrate/quality tradeoff), not raw processing speed relative to a simpler generic-C alternative, analogous to a general-purpose codec/runtime rather than a SIMD/allocator/compression-speed library. The absence of a `celt/riscv` or `silk/riscv` RVV backend therefore does not itself cap the color further.
- **Pending work that could change the grade:** Issue #368 (open since October 2024): Samsung R&D Poland, with partial RISE Project engineering involvement, working on RVV intrinsics for the SILK module on a private `rvv_impl` fork branch, described by the author as early-stage and "not deemed for merging in current form"; no public branch, no benchmarks posted, no maintainer response in roughly two years. PR #392 (draft, February 2025): an RTCD dispatch refactor motivated by #368, blocked on a C90/C99 compatibility constraint. PR #476 (closed unmerged, June 2026): would have added `riscv`/`riscv64` CPU-family recognition to CMake/autotools (build-system detection only, no SIMD) but received zero maintainer review comments and was self-closed by its author. No RISE-funded project or riscv64 CI job for libopus has been announced. Any of these landing, especially a riscv64 CI job with test execution, or upstream-recognized platform detection plus merged RVV code, could raise the color toward blue or green.

## 14. Investment Analysis

RISE has no publicly confirmed funded project for libopus RISC-V optimization as of September 2026. Samsung R&D Poland has independent in-progress work (Issue #368, with partial RISE engineering time per the issue text) that is not publicly available for review. Any investment strategy must account for the risk of duplicating this existing, unpublished effort; the first action item in any RVV-focused scope should be establishing contact with the Issue #368 author (k-kisielak) to assess overlap before committing engineering time.

### 14.1 Functional Enablement

No functional gap exists. The generic C build is complete and correct on riscv64, and is already shipped to end users via Debian and Ubuntu. No investment is needed for functional correctness.

### 14.2 Performance Optimization

The primary gap is the absence of RVV SIMD intrinsics for the SILK and CELT modules; the DNN module (DRED, Deep PLC, OSCE) is a secondary target. The existing ARM NEON code in `silk/arm/` and `celt/arm/` is the natural reference implementation for a new RVV port. The RTCD refactor in PR #392 is a stated prerequisite for adding a new architecture cleanly and should be unblocked first (resolve the C90/C99 constraint) before landing RVV intrinsics, to avoid duplicating dispatch boilerplate that #392 is meant to eliminate.

Scope:
- Unblock PR #392 (RTCD refactor): resolve the C90/C99 constraint, likely via a compatibility macro or negotiating C99 adoption with the maintainer.
- Add `celt/riscv/` MDCT and pitch-xcorr RVV intrinsics (reference: `celt/arm/` NEON files).
- Add `silk/riscv/` NSQ, LPC, and biquad RVV intrinsics (reference: `silk/arm/` NEON files).
- Add `dnn/riscv/` RVV intrinsics for DNN inference (reference: `dnn/arm/`).
- Add CMake, autotools, and meson recognition of `riscv`/`riscv64` as a named CPU family (superseding the scope of PR #476, but including it in dispatch logic rather than platform-recognition alone).

No quantified benchmark data exists for a scalar-vs-RVV delta on riscv64 hardware (the one available figure, from Microchip's 2021 white paper, reports only code size and test-pass rate, not throughput, and predates the 1.4+ codebase), so the business case for this work rests on architecture parity with ARM/x86 rather than a measured speedup target. Establishing a benchmark baseline should be an early, low-cost part of this scope.

### 14.3 CI/CD Infrastructure

Add a QEMU cross-compile CI job for riscv64 to GitHub Actions. Direct precedent exists: `autotools-cross-mips.yml` already performs QEMU cross-compilation and test execution for MIPS32/MIPS64 using prebuilt musl-cross toolchains; a riscv64 equivalent following the same pattern would be a comparatively small, incremental addition. If RISE hardware-in-loop runner infrastructure becomes available (a real riscv64 board), a GitLab CI job on the Xiph.Org GitLab instance would be higher value than emulation alone, given riscv64 test-execution CI is one of the pending-work items that would raise the readiness color (Section 13).

### 14.4 Ecosystem Enablement

Not applicable. libopus is a system library with no dependent package ecosystem (no PyPI, npm, Maven, or similar package family) requiring separate riscv64 enablement. Downstream consumers such as FFmpeg and GStreamer have their own riscv64 status tracked in separate reports.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Build system | Add riscv64 platform recognition to CMake, autotools, and meson (superseding the scope of PR #476) | 0.5 | External contributor | High |
| Build system | Resolve the C90/C99 blocker in PR #392 (RTCD refactor) | 1 | External contributor, coordinate with MarekPikula | High |
| Performance | RVV intrinsics for CELT (MDCT, pitch xcorr) | 4-6 | External contributor with RVV expertise | High |
| Performance | RVV intrinsics for SILK (NSQ, LPC, biquad) | 4-6 | External contributor with RVV expertise, coordinate with Samsung R&D Poland | High |
| Performance | RVV intrinsics for the DNN inference module | 3-5 | External contributor | Medium |
| CI/CD | Add a riscv64 QEMU cross-compile job to GitHub Actions | 0.5 | External contributor | High |
| CI/CD | Add a riscv64 hardware-in-loop job to Xiph.Org GitLab, if a RISE runner is available | 1 | RISE infrastructure team | Medium |
| Performance | Establish a riscv64 vs amd64 vs arm64 benchmark baseline on reference hardware | 1 | Any | Medium |

**Total estimated effort:** roughly 15-21 person-weeks for full functional-and-performance parity (build recognition plus RVV SIMD plus CI). Build recognition alone (0.5 weeks) is a quick win but, based on PR #476's outcome, is unlikely by itself to secure maintainer engagement; it should be paired with, or follow, a more substantial contribution.

**Coordination risk:** Samsung R&D Poland has independent RVV work in progress (Issue #368), with partial RISE engineering involvement already claimed in that issue's text. Before starting new RVV intrinsics work, establish direct contact with the Issue #368 author (k-kisielak) to assess overlap and avoid duplicating effort.

## 15. References

- [xiph/opus GitHub mirror](https://github.com/xiph/opus)
- [Xiph.Org GitLab (upstream, canonical)](https://gitlab.xiph.org/xiph/opus)
- [Opus codec homepage](https://opus-codec.org/)
- [RFC 6716 - Definition of the Opus Audio Codec](https://www.rfc-editor.org/rfc/rfc6716)
- [Issue #368 - RISC-V port implementation](https://github.com/xiph/opus/issues/368)
- [k-kisielak/opus:rvv_impl branch](https://github.com/k-kisielak/opus/tree/rvv_impl)
- [PR #392 - RFC: Streamline implementation overrides](https://github.com/xiph/opus/pull/392)
- [PR #476 - Add initial RISC-V platform recognition (closed unmerged)](https://github.com/xiph/opus/pull/476)
- [Issue #323 - Compiling libopus 1.5.1 on ARM Cortex-A53/A55 (contains riscv64 build confirmation)](https://github.com/xiph/opus/issues/323)
- [Issue #469 - OPUS 1.6.1 consumes more CPU than 1.5.2](https://github.com/xiph/opus/issues/469)
- [Issue #475 - opus_cpu_feature_check does not check XState](https://github.com/xiph/opus/issues/475)
- [Issue #477 - HYBRID + DTX: CELT encoded then discarded on silent frames in 1.6.1](https://github.com/xiph/opus/issues/477)
- [Opus 1.6 release notes (December 2025)](https://opus-codec.org/release/stable/2025/12/15/libopus-1_6.html)
- [Debian buildd tracker for opus (sid)](https://buildd.debian.org/status/package.php?p=opus&suite=sid)
- [Ubuntu packages.ubuntu.com - libopus0 resolute/riscv64](https://packages.ubuntu.com/resolute/riscv64/libopus0)
- [Microchip - PolarFire SoC FPGA: Opus Codec Benchmarking white paper](https://ww1.microchip.com/downloads/aemDocuments/documents/FPGA/ProductDocuments/SupportingCollateral/whitepapers/Microchip_PolarFire_SoC_FPGA_Opus_Codec_Benchmarking_White_Paper.pdf)
- [Arch Linux RISC-V port homepage](https://archriscv.felixc.at)
- [felixonmars/archriscv-packages patch repository](https://github.com/felixonmars/archriscv-packages)
- [RISE project homepage](https://riseproject.dev/)
- [RISE Python wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)