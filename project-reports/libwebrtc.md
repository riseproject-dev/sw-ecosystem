---
title: libwebrtc
parent: Project Reports
categories:
  - multimedia
  - browser
---

# libwebrtc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libwebrtc
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libwebrtc is the Google-maintained native C++ implementation of the WebRTC protocol stack, used in Chrome, Chromium, and any application requiring real-time audio/video communication. The codebase covers audio capture and processing (AEC3 echo cancellation, noise suppression, AGC, FIR filtering), video encode/decode (VP8, VP9, AV1, H.264 via third-party codecs), signaling (SDP, ICE, DTLS, SRTP), and data channels.

The project is not governed by an independent foundation. It is a Google-originated project hosted on [webrtc.googlesource.com](https://webrtc.googlesource.com/src) under Google's Gerrit infrastructure. The W3C WebRTC Working Group standardizes the JavaScript API (W3C Recommendation achieved March 13, 2025). The IETF RTCWEB group specifies underlying protocols (JSEP, RFC 9429). Neither W3C nor IETF controls the libwebrtc native implementation; Google does exclusively.

**Core OWNERS** (all Google employees): danilchap@webrtc.org, dct@google.com, eshr@webrtc.org, hta@webrtc.org (Harald Alvestrand), stefan@webrtc.org, tommi@webrtc.org.

The AUTHORS file lists organizational contributors including Google Inc., Microsoft Corporation, Meta Platforms, Intel Corporation, NVIDIA Corporation, Mozilla Foundation, Twilio, RingCentral, Vonage, Sinch AB, Signal Messenger, LiveKit, and ARM Holdings. However, all governance authority over the native library sits with Google.

WebRTC contributions go through Gerrit on googlesource.com. All core OWNERS are Google employees, so port acceptance is at Google's discretion. The project's historical posture toward new architecture ports is passive tolerance: RISC-V received preprocessor-level detection in 2020 and nothing further in over five years.

libwebrtc is not listed as a RISE Project member or funded RFP project. The RISE multimedia focus as of 2024-2025 is dav1d, FFmpeg, XNNPACK, and Android Bionic. No RISE blog post (28 posts, May 2024 through June 2026) mentions libwebrtc or WebRTC.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-12-17 | Commit 6215ba804eb5 adds `__riscv`/`__riscv_xlen` preprocessor guards to `rtc_base/system/arch.h`, enabling riscv64 to compile without hitting `#error Please add support for your architecture`. Defines `WEBRTC_ARCH_64_BITS` and `WEBRTC_ARCH_LITTLE_ENDIAN` only. | [commit 6215ba8](https://github.com/webrtc-mirror/webrtc/commit/6215ba804eb500f3e28b39088c73af3c4f4cd10a) |
| 2020-12-17 | Author: Timothy Gu (timothygu@chromium.org). Reviewer: Mirko Bonadei (mirko.bonadei@webrtc.org), Google. Bug reference: webrtc:12312. | same commit |
| 2020-12-17 to present | No further riscv64-related commits, issues, CLs, or PRs in the mirror repo or upstream Gerrit. | GitHub search: 0 results for `riscv repo:webrtc-mirror/webrtc`; Gerrit search: 0 CLs |

The port history is a single commit in 2020. There is no ongoing porting effort, no tracking issue, and no indication that further work is planned.

---

## 3. Upstream Support Tier

No formal platform tier document exists in the WebRTC native codebase. There is no PLATFORMS.md, SUPPORT.md, or docs/platforms/ directory. The officially documented supported platforms are Windows, macOS, Linux, Android, and iOS.

Evidence-based tier assignment:

| Architecture | CI builders | Release binaries | SIMD optimizations | Family macro | Tier |
|---|---|---|---|---|---|
| amd64 (x86-64) | Multiple (Linux, Windows, Mac, Android) | N/A (built into Chromium) | SSE2, SSE3, AVX2, FMA3 | `WEBRTC_ARCH_X86_FAMILY` | Tier 1 |
| arm64 | Multiple (Linux, iOS, Android, Apple M1) | N/A | NEON | `WEBRTC_ARCH_ARM_FAMILY` | Tier 1 |
| arm (32-bit) | Cross-compile CI | N/A | NEON | `WEBRTC_ARCH_ARM_FAMILY` | Tier 1 |
| MIPS | Present in build files | N/A | MIPS-DSP assembly | `WEBRTC_ARCH_MIPS_FAMILY` | Tier 2 [NEEDS VERIFICATION] |
| riscv64 | None | None | None | None (missing) | Unsupported |

riscv64 receives no CI, no release artifacts, no SIMD, and no family macro. It compiles via scalar fallback paths only. This is below any recognized support tier.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libwebrtc's performance-critical components all have architecture-specific acceleration for x86 and ARM. None have RISC-V equivalents.

### 4.1 Architecture Detection

`rtc_base/system/arch.h` defines architecture classification macros. RISC-V detection added Dec 2020 defines bitness and endianness only. The `WEBRTC_ARCH_RISCV_FAMILY` macro does not exist, while `WEBRTC_ARCH_X86_FAMILY` and `WEBRTC_ARCH_ARM_FAMILY` do. This missing family macro means all downstream SIMD dispatch guards (`#ifdef WEBRTC_ARCH_X86_FAMILY`, `#ifdef WEBRTC_ARCH_ARM_FAMILY`) exclude RISC-V by construction.

`rtc_base/cpu_info.cc` handles runtime CPU feature detection. It covers the x86 family (SSE2, SSE3, AVX2, FMA3 via cpuid) and ARM family (NEON via getauxval/android_getCpuFeatures). RISC-V hits `#else { RTC_UNUSED(isa); return false; }`. No RVV detection exists anywhere in libwebrtc core.

### 4.2 Audio Signal Processing

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| FIR filter (`common_audio/fir_filter_*.cc`) | SSE, AVX2 (hand-tuned) | NEON (hand-tuned) | Scalar C (FIRFilterC) |
| Sinc resampler | SSE2, AVX2 | NEON | Scalar C |
| Signal processing (spl_init, cross-corr, downsample, min/max, filter) | SSE2 | NEON + assembly | Scalar C |
| AEC3 matched filter | SSE2, AVX2 | NEON | Scalar C (`default:` branch) |
| AEC3 adaptive FIR filter | SSE2, AVX2 | NEON | Scalar C |
| AEC3 vector math | SSE2, AVX2 | NEON | Scalar std:: |
| Noise suppression (ns/) | None | None | None (no arch code at all) |

Dedicated arch-specific source file count:

| Architecture | Dedicated source files |
|---|---|
| x86/x64 (SSE2/AVX2) | ~15+ |
| ARM/NEON | ~10 |
| MIPS | ~8 |
| riscv64 | 0 |

### 4.3 Video Codec Layer

WebRTC wraps third-party codec libraries (libvpx, libaom, dav1d, OpenH264) and does not contain its own codec SIMD. riscv64 status for these libraries is covered in Section 9.

### 4.4 Crypto (DTLS/SRTP)

WebRTC uses BoringSSL for DTLS and SRTP keying. BoringSSL has no crypto assembly for riscv64; all crypto operations fall back to scalar C. See Section 9 for detail.

### 4.5 libyuv (YUV colorspace conversion, bundled)

libyuv (pinned at commit d23308a2, bundled in `third_party/libyuv/`) has RVV-accelerated pixel format conversion and scaling:

- `source/row_rvv.cc`: 53 RVV functions for YUV-to-RGB conversion, channel splitting/merging, blending. Uses `__riscv_vector` guard. ~700-750 lines.
- `source/scale_rvv.cc`: 27 RVV functions for image scaling (downscale, upscale, bilinear, bicubic). Uses `__riscv_vector` and `__riscv_zve64x` guards. ~950-1000 lines.
- `source/cpu_id.cc`: `RiscvCpuCaps()` parses `/proc/cpuinfo` ISA string, detecting `'v'` (RVV) and `"zvfh"` (ZVFH). Sets `kCpuHasRISCV = 0x4`, `kCpuHasRVV = 0x100`, `kCpuHasRVVZVFH = 0x200`.

The RVV files compile unconditionally (no explicit `-march=+v` injected by the build system), relying on the compiler's predefined `__riscv_vector`. This means correct RVV compilation depends on the toolchain's default `-march` including `+v`; without an explicit flag, compilers targeting `rv64gc` will not define `__riscv_vector` and libyuv will silently fall back to scalar. This is a build configuration risk.

libyuv RVV support is the only RISC-V SIMD present anywhere in the WebRTC dependency tree that directly affects the WebRTC video pipeline. All WebRTC-owned DSP code (audio processing, AEC3, sinc resampler, FIR filters) is scalar on RISC-V.

---

## 5. Build System, Cross-Compilation, and Toolchain

WebRTC uses GN + Ninja exclusively. CMake, Visual Studio projects, and Xcode projects are not supported. The build is managed via Google's depot_tools.

### 5.1 GN Commands for riscv64

With Clang (recommended):
```
gn gen out/riscv64 --args='target_os="linux" target_cpu="riscv64" is_clang=true'
autoninja -C out/riscv64
```

With GCC cross-compiler:
```
gn gen out/riscv64-gcc --args='target_os="linux" target_cpu="riscv64" is_clang=false'
autoninja -C out/riscv64-gcc
```

V8 simulator mode (x64 host, riscv64 target):
```
gn gen out/x64-v8-riscv64 --args='target_os="linux" target_cpu="x64" v8_target_cpu="riscv64"'
autoninja -C out/x64-v8-riscv64
```

### 5.2 Toolchain

**Clang:** WebRTC uses a vendored, pinned Clang downloaded via gclient hooks to `third_party/llvm-build/Release+Asserts/`. The pinned version is `llvmorg-23-init-19482-g53d18800` (LLVM 23 pre-release). There is no minimum system Clang version; the vendored binary is required.

**GCC cross-compiler:** Tool prefix is `riscv64-linux-gnu-` (standard Debian/Ubuntu `gcc-riscv64-linux-gnu` package). No explicit minimum GCC version is stated in build files.

### 5.3 Sysroot

riscv64 uniquely uses Debian Trixie as its sysroot. All other architectures use Debian Bullseye. Setup:

```
python3 build/linux/sysroot_scripts/install-sysroot.py --arch riscv64
```

This downloads `debian_trixie_riscv64_sysroot.tar.xz` from `commondatastorage.googleapis.com/chrome-linux-sysroot` and installs to `build/linux/debian_trixie_riscv64-sysroot/`. GN auto-resolves this path when `target_cpu="riscv64"` and `use_sysroot=true` (default).

### 5.4 RISC-V Architecture GN Flags

From `build/config/riscv.gni` (in the Chromium build submodule):

| GN Arg | Default | Notes |
|---|---|---|
| `riscv_use_rvv` | `false` | Enable RVV |
| `riscv_rvv_vlen` | `128` | Simulator VLEN; options: 128/256/512/1024 |
| `riscv_profile` | `"rv64gc"` | Alternatives: `"rvau22"` |
| `riscv_use_zba` | `false` | B-ext address generation |
| `riscv_use_zbb` | `false` | B-ext basic bit manipulation |
| `riscv_use_zbs` | `false` | B-ext single-bit |
| `riscv_use_zicfiss` | `false` | Shadow-stack CFI |
| `riscv_use_zicond` | `false` | Integer conditional operations |

### 5.5 Toolchain Definitions

From `build/toolchain/linux/BUILD.gn` (Chromium build submodule, commit 0cd0da38e2c2014565c29d8fcbe0f9d893b41ce6):

Clang toolchain:
```
clang_toolchain("clang_riscv64") {
  enable_linker_map = true
  toolchain_args = {
    current_cpu = "riscv64"
    current_os = "linux"
    is_clang = true
  }
}
```

GCC cross-compilation toolchain:
```
gcc_toolchain("riscv64") {
  toolprefix = "riscv64-linux-gnu"
  ...
  toolchain_args = {
    current_cpu = "riscv64"
    current_os = "linux"
    is_clang = false
  }
}
```

### 5.6 QEMU

No QEMU configuration files or Dockerfiles for riscv64 exist in the webrtc-mirror/webrtc repository. Standard approach for testing a riscv64 cross-compiled binary on an x64 host:

```
qemu-riscv64 -L build/linux/debian_trixie_riscv64-sysroot ./out/riscv64/<target_binary>
```

The Debian Trixie sysroot serves as the `-L` root for shared library resolution.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional Gaps

The codebase compiles and links on riscv64. There are no known correctness failures in the WebRTC stack itself. Functional failures reported in the wild are from embedded RISC-V devices running libwebrtc-based applications (see Section 11), not from the library itself.

### 6.2 Performance Gaps

The entire WebRTC DSP pipeline runs scalar C++ on riscv64. No component has RVV, Zba/Zbb, or any RISC-V extension optimization. The performance gap relative to arm64 (with NEON) and amd64 (with SSE2/AVX2) is total for audio processing.

| Component | amd64 vs riscv64 (estimated gap) | arm64 vs riscv64 (estimated gap) |
|---|---|---|
| AEC3 echo cancellation | Large (AVX2 vectorized vs scalar) | Large (NEON vectorized vs scalar) |
| FIR filter | Large (SSE2/AVX2 vs scalar) | Large (NEON vs scalar) |
| Sinc resampler | Large (SSE2/AVX2 vs scalar) | Large (NEON vs scalar) |
| YUV conversion (libyuv) | Large if RVV not compiled in; competitive if RVV enabled | Competitive if RVV enabled |
| VP8/VP9 encode/decode (libvpx) | Large (libvpx has no riscv64 SIMD) | Large |
| AV1 decode (dav1d) | Competitive (dav1d has first-class RVV support) | Competitive |
| AV1 encode (libaom) | Moderate gap (active upstream RVV work, partial) | Moderate gap |
| DTLS/SRTP crypto (BoringSSL) | Moderate (no crypto assembly on riscv64) | Moderate |

Data not available: quantitative benchmark numbers (cycles, fps, latency) comparing libwebrtc on riscv64 vs arm64 or amd64. No such measurements exist in any public source.

### 6.3 Security Hardening Gaps

- BoringSSL has no FIPS module for riscv64 [NEEDS VERIFICATION].
- No shadow-stack CFI (`riscv_use_zicfiss=false` by default).
- No crypto assembly (scalar C fallback only for AES-GCM, ChaCha20, ECDH used in DTLS/SRTP).

### 6.4 Notable Anomaly: libyuv vs WebRTC Core

libyuv (bundled dependency) has RVV runtime dispatch and 80+ RVV-accelerated functions, while WebRTC's own DSP code (audio processing, AEC3) has none. This creates an asymmetry: the video pixel conversion pipeline (libyuv) can be RVV-accelerated, but the audio processing pipeline (AEC3, noise suppression, AGC) cannot.

---

## 7. CI/CD Infrastructure

WebRTC uses Google's LUCI/Buildbucket/Swarming CI system (chromium-swarm.appspot.com). It does not use GitHub Actions (`.github/` directory does not exist in the repository).

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes (multiple builders) | Yes (Linux, iOS, Android, Apple M1) | None |
| Test execution CI | Yes | Yes | None |
| Commit queue (CQ) gating | Yes | Yes | None |
| LUCI builder entries in builders.star | Yes | Yes | Zero |
| mb_config.pyl entries | Yes | Yes | Zero |
| waterfalls.pyl entries | Yes | Yes | Zero |

Sources confirming riscv64 CI absence:
- `infra/config/builders.star`: zero riscv references; defines all CI/CQ builders exhaustively
- `infra/config/generated/luci/cr-buildbucket.cfg`: zero riscv references
- `tools_webrtc/mb/mb_config.pyl`: zero riscv references
- `infra/specs/waterfalls.pyl`, `mixins.pyl`, `variants.pyl`: zero riscv references
- Live CI console at [ci.chromium.org/p/webrtc](https://ci.chromium.org/p/webrtc/g/ci/console): architectures present are x86, x64, arm, arm64, Android arm/arm64/x86/x64, iOS arm64, Apple M1; zero riscv64 entries

No RISE CI runners are involved in WebRTC builds. RISE has no funded RFP for libwebrtc.

---

## 8. Distribution and Release Status

The full Google/Chromium WebRTC native library ("libwebrtc") is not packaged or released as a standalone binary for any architecture. It is always compiled from source as part of Chromium/Chrome or application-specific builds. The webrtc-mirror/webrtc GitHub repository has zero releases and zero tags.

The `webrtc-audio-processing` sub-library (an extracted signal processing module, maintained separately at [gitlab.freedesktop.org/pulseaudio/webrtc-audio-processing](https://gitlab.freedesktop.org/pulseaudio/webrtc-audio-processing)) is available as a distro package on riscv64:

| Distro | Package | Version | riscv64 status |
|---|---|---|---|
| Debian sid | webrtc-audio-processing | 1.3-3+b3 | Installed (built on rv-osuosl-02 ~66 days ago) |
| Ubuntu 24.04 Noble | libwebrtc-audio-processing1, libwebrtc-audio-processing-dev | 0.3.1-0ubuntu6 | Available |
| Arch Linux RISC-V | (none) | -- | Not present |
| PyPI | (none) | -- | Package does not exist |
| GitHub releases | (none) | -- | No releases at all |

The Ubuntu riscv64 package for `libwebrtc-audio-processing-dev` is approximately 5,890 kB installed, versus approximately 1,500 kB for amd64/arm64, consistent with no SIMD dead-code elimination and full scalar fallback code paths compiled in [NEEDS VERIFICATION - size figures from package metadata, not independently cross-checked].

Chromium (which embeds the full libwebrtc) is not available for riscv64 in Debian sid; autopkgtest is skipped on riscv64 as "not installable (which is allowed)."

A user who needs the full libwebrtc stack on riscv64 must build from source using the GN + depot_tools workflow described in Section 5.

---

## 9. Dependencies

### 9.1 Summary Table

| Dependency | Role | riscv64 build | riscv64 test (CI) | riscv64 release | Notes |
|---|---|---|---|---|---|
| BoringSSL | DTLS/SRTP crypto | Builds | Compile-only, no test exec CI | No official binaries | No FIPS, no crypto ASM; scalar C only |
| libsrtp (cisco/libsrtp) | SRTP media encryption | Builds | PR #754 open: test timeout under QEMU | No official riscv64 binaries | No SIMD; functionally equivalent |
| libvpx | VP8/VP9 encode/decode | Builds (generic-gnu fallback) | No CI | No release binaries | Zero riscv64 SIMD; major perf gap |
| libaom | AV1 encode | Builds | No CI; RVV patches merged without CI | No tagged releases | Active RVV work from Andes Technology (RISE Premier Member) |
| dav1d | AV1 decode | Builds with CI (every commit) | QEMU CI job since 2024-02-23 | Every release since v1.4.0 | Strongest riscv64 posture; RVV 1.0+ required |
| libgav1 | AV1 decode (secondary) | Builds (scalar only) | No CI | No releases | No RISC-V code paths |
| FFmpeg | Audio/video decode/encode | Builds (`--arch=riscv64`) | 3 external QEMU nodes (remlab.net), not in-repo CI | No official riscv64 binary | 219+ RISC-V patches upstream; no RVV decode paths for most codecs |
| libjpeg-turbo | JPEG encode/decode | Builds with RVV C intrinsics | No upstream CI | Upstream declined riscv64 binaries (Issue #885, "won't implement") | RVV acceleration in-tree (18 files in `simd/riscv64/`) |
| OpenSSL (fallback) | TLS/crypto | Builds with extensive riscv64 ASM | `riscv-more-cross-compiles.yml` (13 configs) | Upstream releases include riscv64 | Rich RVV crypto: AES-Zvkned, SHA-Zvknha/b, GCM-Zvkg, ChaCha20-RVV |
| libyuv (bundled) | YUV colorspace conversion | Builds with RVV source files | No CI | No separate release | RVV in-tree but no explicit `-march=+v`; see Section 4.5 |
| OpenH264 (cisco) | H.264 encode/decode | Builds (meson fix merged Aug 2024, PR #3773) | No CI | No riscv64 release | No SIMD on riscv64; x86 ASM only |
| Abseil-cpp | Core utilities | Mostly builds; Issue #1702 (linker error) open | Issues #2002 open: test failures on riscv64-linux-gnu | No official riscv64 wheels | PR #1986 open: HW CRC32C for riscv64; open linker bug may affect static builds |
| Protocol Buffers | SDP/signaling serialization | Builds (community-patched); maintainers stated riscv64 is unsupported | No riscv64 CI | No riscv64 Maven/PyPI binaries (Issue #17798 open) | Maintainer explicitly declined support; no protoc binary for riscv64 |
| zstd | Compression | Builds | Cross-compile CI only | No riscv64 release binary | PR #4557 (fast sequence decode) open since 2025-12-22, no maintainer response |
| crc32c | CRC checksum | Builds (portable fallback) | No CI | No binary | PR #75 open (2026-06-11): adds cmake riscv64 detection; no HW acceleration yet |
| cpuinfo | CPU feature detection | Builds; QEMU CI job fixed (PR #295, merged 2025-05-22) | QEMU CI | N/A | PR #397 open: complete ISA extension and uarch support for riscv64 |
| XNNPACK | Neural network inference | Builds with RVV | `cmake-linux-riscv64` QEMU CI (every PR since Dec 2023) | No official binary | No native CI hardware |

### 9.2 Critical Dependency Analysis

**Protocol Buffers -- highest risk.** Maintainers have explicitly stated riscv64 is unsupported and not on their roadmap. No protoc binary is published for riscv64 (Issue #17798 open, PR #23206 open). Any WebRTC build toolchain that auto-downloads protoc from Maven or PyPI will break on riscv64. Workaround: build protoc from source on riscv64 or use a distro package.

**Abseil-cpp -- second highest risk.** Issue #1702 (open linker error with riscv64 toolchain) can block riscv64 static builds depending on toolchain version. Abseil is used directly by libwebrtc and transitively via gRPC.

**BoringSSL -- performance risk, not correctness.** No FIPS module, no crypto assembly for riscv64. All AES-GCM, ChaCha20, ECDH operations in DTLS/SRTP fall back to scalar C. Not a build blocker but relevant for DTLS handshake performance.

**libvpx -- performance risk, not correctness.** VP8/VP9 encode/decode has zero SIMD on riscv64. The `generic-gnu` fallback configuration is used, meaning all DCT, motion estimation, and prediction operations are scalar. This is the highest-impact codec gap given VP8/VP9 remain the most widely deployed WebRTC codecs.

**dav1d -- best-in-class.** First-class riscv64 support with QEMU CI on every commit since early 2024. RVV 1.0+ required; on hardware supporting RVV, AV1 decode performance on riscv64 is competitive.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none in webrtc-mirror/webrtc) | Zero riscv64 issues exist in the upstream tracker | -- | -- | GitHub search confirmed 0 results for `riscv` in webrtc-mirror/webrtc issues (open or closed) |
| sipeed/NanoKVM #804 | Switching from WebRTC to MPEG mode wedges NanoKVM-Server until reboot | Open | High (availability) | Error: `[lt6911_probe] jump return CVI_FAILURE`, `rmmod: can't unload module 'soph_vpss': Resource temporarily unavailable`. WebRTC noted as unreliable behind NAT/tunnels on SG2002 RISC-V device [NEEDS VERIFICATION - device-specific, may not reflect libwebrtc itself] |
| sipeed/NanoKVM #537 | H264 streaming regressed vs WebRTC between firmware 2.2.7 and 2.2.8 | Closed (May 2025) | Medium | Qualitative observation: "WEBRTC was never good" for responsiveness on this RISC-V device. No benchmark numbers. |
| libsrtp PR #754 | test_roc_driver.c timeout under riscv64 QEMU | Open | Low (test-only) | Build succeeds; test infrastructure issue under QEMU |
| Abseil-cpp Issue #1702 | Link error with riscv64 toolchain | Open | High (build) | Affects static builds; toolchain-version-dependent |
| Abseil-cpp Issue #2002 | `hashtablez_sampler_test` and `cordz_sample_token_test` fail on riscv64-linux-gnu | Open | Medium (test correctness) | May indicate runtime issue in sampling code on riscv64 |
| protobuf Issue #17798 | No riscv64 Maven/PyPI binaries for protoc | Open | High (toolchain) | Maintainer stance: not on roadmap; blocks automated build pipelines |

---

## 12. Objections and Upstream Blockers

**Organizational:** All core WebRTC OWNERS are Google employees. Google decides what architectures receive CI and optimization investment. RISC-V has received one commit in over five years. There is no signal that Google intends to add riscv64 CI or audio DSP optimizations.

**Technical:** libwebrtc has no `WEBRTC_ARCH_RISCV_FAMILY` macro, which means adding RVV dispatch to any audio component requires: (a) adding the family macro to arch.h, (b) adding CPU feature detection for RVV in cpu_info.cc, (c) writing RVV-accelerated implementations for each component (AEC3, FIR filter, sinc resampler, signal processing). This is a 4-7 person-month effort.

**Contribution process:** Contributions must go through googlesource.com Gerrit and require OWNERS approval. All OWNERS are Google employees. Acceptance of external riscv64 SIMD contributions is not guaranteed and has no precedent for this project.

**Protocol Buffers blocker:** Until protobuf maintainers publish an official riscv64 protoc binary, any CI pipeline that uses the standard proto compilation toolchain requires a workaround. This is a known friction point for new adopters.

**libyuv RVV build flag gap:** The libyuv RVV files compile unconditionally but require the toolchain's `-march` to include `+v`. Without an explicit build flag, `rv64gc` toolchains do not activate RVV. This is not documented in WebRTC's build docs.

---

## 13. Investment Analysis

RISE has no funded work on libwebrtc. All items below represent un-covered ground.

### 13.1 Functional Enablement

The codebase already compiles and runs in scalar mode on riscv64. No functional gaps block deployment. Effort here is CI infrastructure (Section 13.3) and protobuf workaround documentation.

### 13.2 Performance Optimization

The largest performance gaps, in priority order:

1. **libvpx riscv64 SIMD** -- VP8/VP9 encode/decode is zero-SIMD on riscv64. Given that VP8/VP9 are the dominant WebRTC codecs in deployed systems, this is the highest-impact optimization target. This is a libvpx project effort, not a libwebrtc project effort, but it directly determines WebRTC video performance on riscv64.

2. **WebRTC audio DSP RVV** -- AEC3, FIR filter, sinc resampler. Requires adding `WEBRTC_ARCH_RISCV_FAMILY`, RVV detection in cpu_info.cc, and RVV implementations per component. Precedent exists from libyuv (which has complete RVV audio-adjacent code).

3. **BoringSSL crypto assembly** -- Unblocks DTLS handshake performance. BoringSSL riscv64 crypto assembly does not exist; OpenSSL has it (AES-Zvkned, ChaCha20-RVV, etc.) and could serve as a reference.

4. **libyuv RVV build flag** -- Ensure `-march=+v` is applied when building libyuv within WebRTC's GN build for riscv64 when `riscv_use_rvv=true`. Low effort, high impact if RVV hardware is available.

### 13.3 CI/CD Infrastructure

Adding riscv64 to WebRTC's LUCI CI requires Google cooperation since LUCI is Google-operated infrastructure. An alternative path is a GitHub Actions workflow in a fork or downstream distribution targeting riscv64 QEMU, as a proof-of-concept to demonstrate stability and build confidence before upstreaming a request to Google.

### 13.4 Ecosystem Enablement

The primary ecosystem gap is the missing `WEBRTC_ARCH_RISCV_FAMILY` macro, which serves as the gating mechanism for all future arch-specific dispatch. Adding this macro is a prerequisite for any downstream optimization work and is a one-line change that should be trivially upstreamable.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `WEBRTC_ARCH_RISCV_FAMILY` macro to arch.h, upstream via Gerrit | 0.5 | Google Gerrit contributor | Critical |
| Functional | Add RVV detection to cpu_info.cc (mirrors libyuv's RiscvCpuCaps()) | 1 | Google Gerrit contributor | Critical |
| Functional | Document protobuf riscv64 workaround (build from source or use distro package) | 0.5 | Any | High |
| Functional | Fix libyuv RVV build flag in WebRTC's GN build (`riscv_use_rvv=true` path) | 1 | WebRTC build team | High |
| Performance | libvpx riscv64 RVV SIMD (VP8/VP9 DCT, motion estimation, prediction) | 24-40 | libvpx project | Critical |
| Performance | WebRTC AEC3 RVV optimization (matched filter, adaptive FIR, vector math) | 8-12 | Audio DSP engineer | High |
| Performance | WebRTC FIR filter and sinc resampler RVV implementation | 4-6 | Audio DSP engineer | High |
| Performance | WebRTC signal processing (spl: cross-corr, downsample, min/max) RVV | 4-6 | Audio DSP engineer | Medium |
| Performance | BoringSSL riscv64 crypto assembly (AES-GCM, ChaCha20, at minimum) | 8-12 | BoringSSL/crypto engineer | Medium |
| CI/CD | riscv64 QEMU build+test workflow (fork or downstream, proof of concept) | 2-3 | CI engineer | High |
| CI/CD | Upstream riscv64 LUCI builder to Google (requires Google buy-in) | 2-4 + negotiation | Google + external sponsor | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [webrtc-mirror/webrtc commit 6215ba8 -- Add preprocessor support for additional architectures](https://github.com/webrtc-mirror/webrtc/commit/6215ba804eb500f3e28b39088c73af3c4f4cd10a)
- [WebRTC arch.h (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/rtc_base/system/arch.h)
- [WebRTC cpu_info.cc (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/rtc_base/cpu_info.cc)
- [WebRTC common_audio BUILD.gn (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/common_audio/BUILD.gn)
- [WebRTC webrtc.gni (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/webrtc.gni)
- [WebRTC infra/config/builders.star (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/infra/config/builders.star)
- [WebRTC tools_webrtc/mb/mb_config.pyl (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/tools_webrtc/mb/mb_config.pyl)
- [WebRTC CI console (ci.chromium.org)](https://ci.chromium.org/p/webrtc/g/ci/console)
- [libyuv row_rvv.cc (chromium.googlesource.com, commit d23308a2)](https://chromium.googlesource.com/libyuv/libyuv/+/d23308a2a7442be8e559b1b471862fd7588d6a57/source/row_rvv.cc)
- [libyuv scale_rvv.cc (chromium.googlesource.com, commit d23308a2)](https://chromium.googlesource.com/libyuv/libyuv/+/d23308a2a7442be8e559b1b471862fd7588d6a57/source/scale_rvv.cc)
- [libyuv cpu_id.h (chromium.googlesource.com)](https://chromium.googlesource.com/libyuv/libyuv/+/d23308a2a7442be8e559b1b471862fd7588d6a57/include/libyuv/cpu_id.h)
- [libyuv cpu_id.cc (chromium.googlesource.com)](https://chromium.googlesource.com/libyuv/libyuv/+/d23308a2a7442be8e559b1b471862fd7588d6a57/source/cpu_id.cc)
- [Chromium build toolchain definitions, build/toolchain/linux/BUILD.gn, commit 0cd0da38](https://chromium.googlesource.com/chromium/src/build/+/0cd0da38e2c2014565c29d8fcbe0f9d893b41ce6/toolchain/linux/BUILD.gn)
- [Ubuntu packages -- libwebrtc-audio-processing riscv64](https://packages.ubuntu.com/search?keywords=libwebrtc&suite=noble&searchon=names&section=all)
- [Debian buildd -- webrtc-audio-processing riscv64](https://buildd.debian.org/status/package.php?p=webrtc-audio-processing)
- [sipeed/NanoKVM Issue #537 -- H264 streaming regression](https://github.com/sipeed/NanoKVM/issues/537)
- [sipeed/NanoKVM Issue #804 -- WebRTC mode-switch wedges server](https://github.com/sipeed/NanoKVM/issues/804)
- [RISE Project blog (riseproject.dev)](https://riseproject.dev/blog)
- [RISE December 2024 Ecosystem Update PDF](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8585217/2024+End-of-Year+Ecosystem+Update)
- [RISE multimedia instruction requirements for video/multimedia (x264 analysis)](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8588516/RISCV64+new+vector+instructions+requirements+for+video+multimedia)
- [libsrtp PR #754 -- riscv64 QEMU test timeout](https://github.com/cisco/libsrtp/pull/754)
- [Abseil-cpp Issue #1702 -- linker error with riscv64 toolchain](https://github.com/abseil/abseil-cpp/issues/1702)
- [Abseil-cpp Issue #2002 -- test failures on riscv64-linux-gnu](https://github.com/abseil/abseil-cpp/issues/2002)
- [protobuf Issue #17798 -- no riscv64 Maven/PyPI binaries](https://github.com/protocolbuffers/protobuf/issues/17798)
- [crc32c PR #75 -- cmake riscv64 detection](https://github.com/google/crc32c/pull/75)
- [cpuinfo PR #397 -- complete riscv64 ISA extension support](https://github.com/pytorch/cpuinfo/pull/397)
- [OpenH264 PR #3773 -- meson riscv64 CPU family fix](https://github.com/cisco/openh264/pull/3773)