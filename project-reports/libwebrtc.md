---
title: libwebrtc
parent: Project Reports
color: orange
dependencies:
  - name: BoringSSL
    relation: runtime-dependency
    criticality: critical
  - name: libsrtp
    relation: runtime-dependency
    criticality: critical
  - name: libvpx
    relation: runtime-dependency
    criticality: critical
  - name: libyuv
    relation: runtime-dependency
    criticality: critical
  - name: Abseil
    relation: runtime-dependency
    criticality: critical
  - name: libopus
    relation: runtime-dependency
    criticality: critical
  - name: libaom
    relation: runtime-dependency
    criticality: optional
  - name: dav1d
    relation: runtime-dependency
    criticality: optional
  - name: libgav1
    relation: runtime-dependency
    criticality: optional
  - name: libjpeg-turbo
    relation: runtime-dependency
    criticality: optional
  - name: OpenH264
    relation: runtime-dependency
    criticality: optional
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: critical
  - name: GN
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libwebrtc" %}

# libwebrtc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libwebrtc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libwebrtc is the Google-maintained native C++ implementation of the WebRTC protocol stack, used in Chrome, Chromium, and any application requiring real-time audio/video communication. The codebase covers audio capture and processing (AEC3 echo cancellation, noise suppression, AGC, FIR filtering), video encode/decode (VP8, VP9, AV1, H.264 via third-party codecs), signaling (SDP, ICE, DTLS, SRTP), and data channels.

The project is hosted on Google's own Gerrit/Gitiles infrastructure at [webrtc.googlesource.com/src](https://webrtc.googlesource.com/src), not on GitHub - there is no GitHub mirror that accepts issues or pull requests for the core project. There is no independent foundation. Governance runs through Chromium-style per-directory `OWNERS`/`OWNERS_INFRA`/`ENG_REVIEW_OWNERS` files rather than a named-maintainer roster; no `MAINTAINERS` file exists (`https://webrtc.googlesource.com/src/+/refs/heads/main/MAINTAINERS` returns HTTP 404). The project describes itself as "supported by Google, Mozilla and Opera, amongst others," but all code review and merge authority runs through Google-run Gerrit (`webrtc-review.googlesource.com`), and community commentary (e.g., BlogGeek.me) has raised the fact that Google effectively controls the decision process while other large vendors contribute engineering effort without a formal governance seat. This is an outside critique, not documented policy.

License: BSD 3-Clause.

The W3C WebRTC Working Group standardizes the JavaScript API (W3C Recommendation achieved March 13, 2025) and the IETF RTCWEB group specifies the underlying protocols (JSEP, RFC 9429), but neither body controls the native C++ implementation.

There is no documented, formal tier or acceptance policy for new architecture ports. The project's historical posture toward RISC-V is passive: compiler-macro-level architecture recognition exists, one attempt at a more complete port was opened and later abandoned for lack of follow-up (Section 2), and no further RISC-V-specific work has landed since.

libwebrtc is not a RISE Project member and has no RISE-funded work. RISE's 20 member organizations (8 Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; 12 General members) are listed at riseproject.dev; none of RISE's 35 blog posts (full sitemap enumerated, May 2024 through September 2026) mention WebRTC or libwebrtc. The only RISE-adjacent activity touching anything named "webrtc" is unrelated wrapper-package work in `riseproject-dev/python-wheels` (Section 2, Section 9).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Unconfirmed (predates Dec 2020) | Basic `__riscv`/`__riscv__` architecture detection already present in `rtc_base/system/arch.h` as a combined block setting 32/64-bit and little-endian macros. Exact originating commit/date could not be confirmed - Gitiles history for this file returns HTTP 401/403 ("Please sign in to view the history pages") even via direct curl. | [rtc_base/system/arch.h](https://webrtc.googlesource.com/src/+/refs/heads/main/rtc_base/system/arch.h) |
| 2020-12-18 | Gerrit CL 198241, "Add preprocessor support for additional architectures," created by Timothy Gu (`timothygu99@gmail.com` / `timothygu@chromium.org`), reviewed by Mirko Bonadei. This CL did not introduce RISC-V detection from scratch; it reorganized the existing combined riscv block into the current two explicit branches (`__riscv_xlen == 64` and `__riscv_xlen == 32`) alongside new MIPS/PPC/SPARC/MSVC-ARM macros. Change-Id `I7d0176c38102e5e4cf0fcbe9b06a3520a79b0d71`, bug `webrtc:12312`. | [CL 198241](https://webrtc-review.googlesource.com/c/src/+/198241), [bug 12312](https://bugs.chromium.org/p/webrtc/issues/detail?id=12312) |
| 2020-12-31 | CL 198241 merged (`Cr-Commit-Position: refs/heads/master@{#32897}`), 33 insertions / 4 deletions in one file, 0 review comments. A GitHub mirror of this change exists as commit `6215ba804eb500f3e28b39088c73af3c4f4cd10a`, dated 2020-12-17 in the mirror's metadata. | [CL 198241](https://webrtc-review.googlesource.com/c/src/+/198241) |
| 2021-06-15 | Gerrit CL 222481, "arch.h: Add RISC-V support," opened by Zhaofeng Li (`hello@zhaofeng.li`), built originally for a NixOS RISC-V port and first submitted to the PulseAudio `webrtc-audio-processing` fork ([MR !19](https://gitlab.freedesktop.org/pulseaudio/webrtc-audio-processing/-/merge_requests/19)). | [CL 222481](https://webrtc-review.googlesource.com/c/src/+/222481) |
| 2021-06-21 | Author explains, in review comments, why CI/maintenance was the practical blocker: "Linux-capable RISC-V hardware isn't widely available or performant enough for rapid feedback. The fastest RISC-V SoC available, SiFive FU740, has roughly the same single-core performance as the Cortex A53 (emulation is even worse). Furthermore, Chromium doesn't build on RISC-V yet." Reviewer Harald Alvestrand separately asks whether there is a documented RISC-V platform contact point; this thread is still unresolved. | [CL 222481](https://webrtc-review.googlesource.com/c/src/+/222481) |
| 2021-06-23 | CL 222481 reaches Patch Set 3 with `Code-Review+1` from Mirko Bonadei. A companion tracking bug is opened by Mirko Bonadei (`bugs.chromium.org/p/webrtc` issue #12896, later migrated to `issues.webrtc.org/42223066`; content of the new tracker could not be read - it requires Google sign-in and renders only via JS). | [CL 222481](https://webrtc-review.googlesource.com/c/src/+/222481) |
| 2023-03-18 | CL 222481 abandoned by Harald Alvestrand. Reason given verbatim: "No response from submitter for 8 months." No further CL, PR, or tracking issue against core libwebrtc for a riscv64 port or CI lane exists since. | [CL 222481](https://webrtc-review.googlesource.com/c/src/+/222481) |
| 2022-06-21 (authored) / 2023-11-29 (committed to master) | `webrtc-audio-processing` (a separate downstream PulseAudio project extracting the audio-processing module, not core libwebrtc) commit `f89958d8`, "Bring arch.h in line with upstream webrtc," by Ben Brown, committed by maintainer Arun Raghavan. Resyncs the fork's copy of `arch.h` with CL 198241's macros. First ships in `webrtc-audio-processing` v2.0 (tagged 2025-01-08); its parent commit `8e258a19` is the v1.3 tag, so v1.3 does not contain it. | [commit f89958d8](https://gitlab.freedesktop.org/pulseaudio/webrtc-audio-processing/-/commit/f89958d82420cc02c7d80cf8f365e6ed57546c92) |
| 2026-09-06 | `riseproject-dev/python-wheels` issue #1136 ("webrtcvad-wheels riscv64 support," open) and PR #1109 (merged), by luhenry - adds a riscv64 CI build for `webrtcvad-wheels` v2.0.14, a thin Python wrapper around libwebrtc's VAD C code (vendored, not linked). No source patches were required; the vendored VAD C code already compiled on riscv64. This is CI/packaging work in a third-party wrapper, not a libwebrtc-project change, and its output has not been published to PyPI as of 2026-09-30 (see Section 8). | [Issue #1136](https://github.com/riseproject-dev/python-wheels/issues/1136), [PR #1109](https://github.com/riseproject-dev/python-wheels/pull/1109) |

**Is it fully upstream?** No. The only dated, URL-bearing artifact in core libwebrtc touching RISC-V is CL 198241, which is general multi-architecture preprocessor cleanup, not a RISC-V initiative, and RISC-V detection predates it. The one attempt at a more deliberate RISC-V contribution (CL 222481) was abandoned for lack of contributor follow-up. There is no open CL, PR, or tracking issue against core libwebrtc for a riscv64 port or CI lane as of 2026-09-30.

## 3. Upstream Support Tier

No formal platform-tier document exists in the WebRTC native codebase (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` directory). The officially documented supported platforms, per `g3doc/supported-platforms-and-compilers.md`, are Windows, macOS, Linux, Android, and iOS on x86/x86_64/ARM - RISC-V is absent from this list entirely, and the doc states platforms outside it "are not officially supported (which means there is no CI coverage for them)," while welcoming community patches.

This is directly corroborated by the live LUCI buildbucket configuration: `infra/config/generated/luci/cr-buildbucket.cfg` has zero occurrences of "riscv," "riscv64," or "risc-v" across roughly 60+ builders.

| Architecture | CI builders | Release binaries | SIMD optimizations | Family macro | Tier |
|---|---|---|---|---|---|
| amd64 (x86-64) | Multiple (Android, Linux, Mac, Win32/64) | N/A (built into Chromium) | SSE2, SSE3, AVX2, FMA3 | `WEBRTC_ARCH_X86_FAMILY` | Documented/supported |
| arm64 | Multiple (Android, iOS, Linux, Mac M1) | N/A | NEON | `WEBRTC_ARCH_ARM_FAMILY` | Documented/supported |
| arm (32-bit) | Cross-compile CI | N/A | NEON | `WEBRTC_ARCH_ARM_FAMILY` | Documented/supported |
| Fuchsia | Present in LUCI builder list | N/A | N/A | N/A | Documented/supported |
| riscv64 | None (0 occurrences in buildbucket cfg) | None | None | None (missing) | Not officially supported, no CI |

riscv64 receives no CI, no release artifacts, no SIMD, and no family macro. It compiles only via scalar fallback paths, and even that scalar path is never built or tested by any upstream automation.

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Architecture Detection

`rtc_base/system/arch.h` defines architecture classification macros. The riscv64/riscv32 branches (`#elif defined(__riscv) && __riscv_xlen == 64` -> `WEBRTC_ARCH_64_BITS`, `WEBRTC_ARCH_LITTLE_ENDIAN`) set bitness and endianness only. There is no `WEBRTC_ARCH_RISCV_FAMILY` macro, while `WEBRTC_ARCH_X86_FAMILY` and `WEBRTC_ARCH_ARM_FAMILY` both exist. Because all downstream SIMD dispatch guards key off the family macros (`#ifdef WEBRTC_ARCH_X86_FAMILY`, `#ifdef WEBRTC_ARCH_ARM_FAMILY`), RISC-V is excluded from every SIMD dispatch path by construction, not by an explicit decision to skip it.

`rtc_base/cpu_info.cc` handles runtime CPU feature detection for x86 (SSE2/SSE3/AVX2/FMA3 via cpuid) and ARM (NEON via getauxval/android_getCpuFeatures) [existing-report detail, not re-verified this session]. No RVV detection exists anywhere in libwebrtc core.

### 4.2 Confirmed Source-Level Verification (this cycle)

Direct reads of representative hot-path files confirm the scalar-fallback pattern rather than inferring it from `arch.h` alone:

- `common_audio/signal_processing/include/spl_inl.h`: dispatch is `WEBRTC_ARCH_ARM_V7` -> hand-written NEON header, else `MIPS32_LE` -> MIPS inline-asm header, else generic portable C. No riscv branch exists at all; riscv64 falls into the "none of the above" path.
- `common_audio/resampler/sinc_resampler.cc`: runtime CPU dispatch is AVX2+FMA3 -> `Convolve_AVX2`, else SSE2 -> `Convolve_SSE`, else `Convolve_C`; NEON is a separate compile-time `#if WEBRTC_HAS_NEON` branch. RISC-V is not mentioned anywhere in this file; it receives `Convolve_C`, the scalar reference implementation, by default.

This same idiom (x86 hand-tuned, ARM hand-tuned, MIPS hand-tuned in places, riscv absent and falling to generic C) is pervasive across the audio-processing tree by pattern, though `modules/audio_processing/*` (AEC3, noise suppression, AGC) was not individually re-fetched this cycle [NEEDS VERIFICATION for those specific files, inferred from the confirmed pattern in two representative files].

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| FIR filter | SSE, AVX2 (hand-tuned) | NEON (hand-tuned) | Scalar C |
| Sinc resampler | SSE2, AVX2 | NEON | Scalar C (`Convolve_C`, confirmed) |
| Signal processing (`spl_inl.h`) | SSE2 | NEON + assembly | Scalar C (confirmed, no riscv branch) |
| AEC3 matched filter / adaptive FIR / vector math | SSE2, AVX2 | NEON | Scalar (inferred by pattern) |
| Noise suppression | None | None | None (no arch-specific code exists for any architecture) |

### 4.3 Video Codec Layer

WebRTC wraps third-party codec libraries (libvpx, libaom, dav1d, libgav1, OpenH264) and does not contain its own codec SIMD. Their individual riscv64 posture is covered in Section 9.

### 4.4 Crypto (DTLS/SRTP)

WebRTC uses BoringSSL for DTLS and SRTP keying. Ubuntu/Debian do not package upstream BoringSSL directly; the only riscv64-available package is the Android-fork build (`android-libboringssl`), and even that has zero riscv64 perlasm/crypto-assembly files - all crypto operations on riscv64 fall back to scalar C (Section 9).

### 4.5 libyuv (YUV colorspace conversion, bundled)

libyuv, pinned and bundled in `third_party/libyuv/`, has genuine RVV-accelerated pixel-format conversion and scaling - this is the one component in the whole WebRTC dependency tree with hand-written RISC-V vector code [existing-report detail, not re-verified this session but not contradicted by live findings]:

- `source/row_rvv.cc`: roughly 53 RVV functions for YUV-to-RGB conversion, channel splitting/merging, and blending, guarded by `__riscv_vector`.
- `source/scale_rvv.cc`: roughly 27 RVV functions for image scaling, guarded by `__riscv_vector` and `__riscv_zve64x`.
- `source/cpu_id.cc`: `RiscvCpuCaps()` parses `/proc/cpuinfo`'s ISA string for `'v'` (RVV) and `"zvfh"` (ZVFH), setting `kCpuHasRISCV`, `kCpuHasRVV`, `kCpuHasRVVZVFH`.

These RVV files compile unconditionally, relying on the compiler's predefined `__riscv_vector` rather than an explicit `-march=+v` injected by the build system - if the riscv64 toolchain's default `-march` does not include `+v`, libyuv silently falls back to scalar despite the RVV source being present. This creates an asymmetry within the dependency tree: libyuv's video pixel-conversion path can be RVV-accelerated (conditional on build flags), while every audio-processing path owned directly by libwebrtc (AEC3, FIR filter, sinc resampler, signal processing) is unconditionally scalar.

## 5. Build System, Cross-Compilation, and Toolchain

WebRTC uses GN + Ninja exclusively, driven by `depot_tools`. Per `docs/native-code/development/README.md`: "Other build systems are not supported (and may fail), such as Visual Studio on Windows or Xcode on OSX." There is no CMake/configure workflow for libwebrtc at all, for riscv64 or any other target.

### 5.1 GN Commands for riscv64

```
gn gen out/riscv64 --args='target_os="linux" target_cpu="riscv64" is_clang=true'
autoninja -C out/riscv64
```

With a GCC cross-compiler:
```
gn gen out/riscv64-gcc --args='target_os="linux" target_cpu="riscv64" is_clang=false'
autoninja -C out/riscv64-gcc
```

None of these commands are documented by the project itself - `g3doc`/`docs` contain no riscv64-specific build guide (confirmed by direct fetch of the supported-platforms doc and the native-code development README); they are reconstructed from GN's generic `target_cpu` plumbing and Chromium's toolchain definitions [existing-report reconstruction, not upstream-documented].

### 5.2 Toolchain

**Clang** - WebRTC vendors a pinned Clang delivered via gclient hooks. No fixed minimum version is published upstream; the documentation states only that it is "the one used by Chromium," which tracks near the latest development revision.

**GCC** - Standard tool prefix is `riscv64-linux-gnu-` (the Debian/Ubuntu `gcc-riscv64-linux-gnu` package). No minimum GCC version is documented anywhere in the build files. GCC is not an officially supported or tested compiler for WebRTC at all; Chromium-family projects of this kind are Clang-first.

### 5.3 GN riscv64 Toolchain and Flag Plumbing

Chromium's build system, which WebRTC's GN build pulls in via `DEPS`, defines only generic `target_cpu` plumbing for riscv64 - `webrtc.gni` itself has CPU-conditional logic only for `arm`/`arm64` (NEON enablement); there is no riscv64 branch, flag, or conditional anywhere in it. Chromium's own build config additionally contains a placeholder `android_clang_riscv64` toolchain target (`target_cpu = "riscv64"`, `-march=rv64gc -mabi=lp64d`), which is explicitly noted upstream as untested/toolchain-not-ready - this is build-config scaffolding, not a working, verified toolchain path.

### 5.4 Sysroot and DEPS

The root `DEPS` file defines sysroot packages for arm, arm64, x86, mips, and x64 (Linux) - there is no riscv64 sysroot entry. `DEPS` also shows that WebRTC's `third_party` tree is largely pulled as one bundle from `chromium.googlesource.com/chromium/src/third_party@<pin>` rather than pinned per-library; only libraries WebRTC needs at a different version than stock Chromium get an explicit `deps` entry (Section 9).

### 5.5 QEMU / Docker

No Dockerfile, Docker reference, or QEMU configuration exists anywhere in the libwebrtc repository or its docs (`infra/` contains only `config/`, `specs/`, `OWNERS`).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional Gaps

The codebase compiles on riscv64 via scalar fallback (confirmed directly for `spl_inl.h` and `sinc_resampler.cc`; consistent with `arch.h`'s macro coverage). No dedicated report of a libwebrtc-core correctness failure was found. The only field reports of WebRTC problems on RISC-V devices come from an embedded application (sipeed/NanoKVM, a RISC-V SG2002 SoC product), not from libwebrtc itself (Section 11).

### 6.2 Performance Gaps

The entire WebRTC-owned DSP pipeline (AEC3, FIR filter, sinc resampler, signal processing) runs scalar C++ on riscv64; none of it has RVV or any other RISC-V extension optimization. No published benchmark data comparing libwebrtc on riscv64 vs arm64 or amd64 exists in any source checked (RISE blog full sitemap, GitHub code/repo search, general web search) - this was independently re-confirmed this cycle after an exhaustive search.

| Component | amd64 vs riscv64 | arm64 vs riscv64 |
|---|---|---|
| AEC3 echo cancellation | Large (AVX2 vectorized vs scalar) | Large (NEON vectorized vs scalar) |
| FIR filter / sinc resampler | Large (SSE2/AVX2 vs scalar) | Large (NEON vs scalar) |
| YUV conversion (libyuv) | Competitive if `-march=+v` is enabled; large otherwise | Competitive if RVV enabled |
| VP8/VP9 encode/decode (libvpx) | Large (no riscv64 SIMD in libvpx at all) | Large |
| AV1 decode (dav1d) | Competitive (dav1d has first-class RVV support and riscv64 CI) | Competitive |
| AV1 encode (libaom) | Moderate (RVV patches merged, but ungated by CI) | Moderate |
| DTLS/SRTP crypto (BoringSSL) | Moderate/large (no crypto assembly on riscv64 at all) | Moderate/large |

Data not available: quantitative benchmark numbers (cycles, fps, latency) comparing libwebrtc on riscv64 against arm64 or amd64 for any of the above.

### 6.3 Security Hardening Gaps

- BoringSSL has no confirmed FIPS module coverage for riscv64 [NEEDS VERIFICATION].
- No crypto assembly on riscv64 for BoringSSL - AES-GCM, ChaCha20, and ECDH used in DTLS/SRTP run scalar C only (Section 9).
- No documented shadow-stack CFI or other riscv64-specific hardening in WebRTC's own build flags was found this cycle.

## 7. CI/CD Infrastructure

WebRTC uses Google's LUCI/Buildbucket/Swarming CI system; there is no `.github/` directory and no GitHub Actions usage for the core project.

Directly verified by fetching and reading `infra/config/generated/luci/cr-buildbucket.cfg` (both the rendered Gitiles page and the raw `?format=TEXT` base64-decoded content):

- Zero occurrences of "riscv," "riscv64," or "risc-v" (case-insensitive) anywhere in the file.
- The ~60+ builders present cover only: Android (x86/x86-64/ARM/ARM64), iOS, Linux (x86/x64/ARM, Asan/MSan/Tsan/UBSan/Libfuzzer variants), Fuchsia, Mac (Intel and ARM64/M1), and Win32/64 (Clang).

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes | Yes | None |
| Test execution CI | Yes | Yes | None |
| Commit-queue (CQ) gating | Yes | Yes | None |
| Entries in `cr-buildbucket.cfg` | Yes | Yes | Zero (directly confirmed) |

Downstream/adjacent CI that exists but does not count as libwebrtc CI: `webrtc-audio-processing` (gitlab.freedesktop.org/pulseaudio) has its own repository, CI, and maintainers, separate from libwebrtc; `webrtcvad-wheels` (riseproject-dev/python-wheels, GitHub Actions) builds wheels for a third-party VAD wrapper package, in a different CI system entirely (GitHub Actions vs. LUCI). Neither of these downstream CI configs was fetched and read this cycle, so per a strict evidence standard they should not be cited as "libwebrtc riscv64 CI" even qualitatively.

No RISE CI runners are involved in WebRTC builds, and no RISE-funded work covers libwebrtc CI.

## 8. Distribution and Release Status

The full Google/Chromium WebRTC native library ("libwebrtc") is never packaged or released as a standalone binary, for any architecture, by any distro. It is source-only, always built as part of Chromium/Chrome or an application-specific build via the GN + depot_tools workflow in Section 5.

**No package literally named `libwebrtc` exists on PyPI** - `https://pypi.org/pypi/libwebrtc/json` returns HTTP 404, confirmed both directly and via the simple index (`https://pypi.org/simple/libwebrtc/`, also 404) and via a RISE wheel-builder redirect (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/libwebrtc/`, which 302-redirects to the same 404 PyPI URL).

**Ubuntu 26.04 "resolute"** ships only narrower, differently-named sub-libraries, confirmed live against `packages.ubuntu.com` and filtered explicitly to `arch=riscv64`:

| Package | Version | riscv64 |
|---|---|---|
| `libwebrtc-audio-coding-1-3` | (resolute) | Confirmed - direct download link on the package page, 136.4 kB package / 272.0 kB installed |
| `libwebrtc-audio-coding-dev` | (resolute) | Confirmed |
| `libwebrtc-audio-processing-1-3` | (resolute) | Confirmed |
| `libwebrtc-audio-processing-dev` | (resolute, universe) | Confirmed |

These are the PulseAudio `webrtc-audio-processing` module (AEC/AGC/VAD only, Section 2) packaged under Ubuntu's own naming - not the full WebRTC engine (no video codecs, no ICE/PeerConnection, no full stack). Debian sid has separately shipped `webrtc-audio-processing` 1.3-3 (trixie/forky/sid) on riscv64 since that version, predating the Ubuntu 26.04 data point above.

**webrtcvad-wheels** (the third-party VAD wrapper, Section 2): a riscv64 CI build workflow merged 2026-09-06 (PR #1109), but as of 2026-09-30 no `webrtcvad` tag or release exists in that repository's tags/releases list - the workflow has merged but has not produced a published wheel. Separately, the actual upstream `webrtcvad` package on PyPI tops out at v2.0.10 (released 2017-01-07, no riscv64 wheels, no activity since); the `2.0.14` target version riseproject-dev is building is from a fork, not mainline PyPI `webrtcvad`.

**Bottom line:** a user who needs the full libwebrtc stack on riscv64 must build from source using the GN + depot_tools workflow in Section 5. The only riscv64 binaries that exist anywhere are for narrower, differently-named downstream sub-components, and even those are limited to the audio-processing module - no channel provides a riscv64 binary for libwebrtc itself.

## 9. Dependencies

### 9.1 Summary Table

Direct dependencies, using the names given in the project's current dependency manifest, plus indirect/transitive dependencies found via the live DEPS-file analysis:

| Dependency | Role | Criticality | riscv64 build | riscv64 test/CI | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| BoringSSL | DTLS/SRTP crypto | Critical | Compiles (Android NDK cross-compile CI only); 0 perlasm/crypto-asm files for riscv64 | No test-execution CI (compile-only) | No official upstream binaries (source-only); Debian/Ubuntu ship only the Android-fork package `android-libboringssl` | No CPU-detect/perlasm infra for RISC-V at all; needs an external maintainer to own an asm backend |
| libsrtp | SRTP media encryption | Critical | Builds | PR #754 open: test timeout under riscv64 QEMU | Ubuntu 26.04 ships `libsrtp2-1`/`libsrtp2-dev` 2.7.0-3build1 (main tier) | Small portable C library; no known SIMD/correctness blockers beyond the QEMU test-timeout issue |
| libvpx | VP8/VP9 encode/decode | Critical | Compiles via `generic-gnu` fallback | No upstream CI at all, for any architecture | Source-only upstream; Ubuntu 26.04 ships `libvpx-dev`/`libvpx12` 1.16.0-3 (main tier) | Zero riscv64 SIMD; no vendor has engaged (unlike the LoongArch port); AOM has deprioritized VP8/VP9 relative to AV1 |
| libyuv | Frame scaling / colorspace conversion | Critical | Compiles, RVV source files present (`row_rvv.cc`, `scale_rvv.cc`) | No CI | Ubuntu 26.04 ships `libyuv-dev`/`libyuv0` 0.0.1922.20260106-1 (main tier) | Only WebRTC-tree component with real RVV code; relies on compiler's implicit `__riscv_vector`, not an explicit `-march=+v` build flag - see Section 4.5 |
| Abseil | Core C++ utilities, used pervasively by libwebrtc | Critical | Source accepted, compiles; no CI of any kind for riscv64, not even compile-gated | None found by official Abseil CI | Source-only upstream; Ubuntu 26.04 ships `libabsl-dev`/`libabsl20260107` 20260107.0-4 (main tier) | Google requires an internal champion and internal re-export for every patch; a CRC32C hardware-acceleration PR is blocked purely on Google's internal riscv64 hardware access |
| libopus | Default voice/audio codec | Critical | Compiles via generic C; not recognized as a named CPU family in CMake/autotools (PR #476 rejected) | No riscv64 CI | Source-only upstream; Ubuntu 26.04 ships `libopus0`/`libopus-dev` 1.6.1-1 (main tier) | Maintainer (Jean-Marc Valin) never engaged PR #476; an RTCD refactor (#392) blocks clean third-architecture dispatch |
| libaom | AV1 encoder | Optional | Compiles; has an RVV-enabled CMake toolchain file but no riscv64 CI job of any kind, so merged RVV patches are unverified by automation | None | Ubuntu 26.04 ships `libaom-dev`/`libaom3` 3.13.1-2, ports tier only (lags security-updated main-tier archs) | 12 RVV patches merged from Andes Technology with no CI gate |
| dav1d | AV1 decoder (primary) | Optional | Treated as first-class: `build-debian-riscv64` runs on every commit | Yes - correctness tests across 4 VLEN configurations under QEMU, the best riscv64 test coverage of any dependency in this table | Shipped in release notes since v1.4.0; Ubuntu 26.04 ships `libdav1d-dev`/`libdav1d7` 1.5.3-1 (main tier) | Strongest riscv64 posture of any dependency; still missing `mc put/prep` SIMD kernels, no contributor yet |
| libgav1 | AV1 decoder (secondary) | Optional | Ubuntu 26.04 ships `libgav1-2`/`libgav1-dev` 0.20.0-2build1 (main tier); build believed generic C/C++, no known SIMD work [NEEDS VERIFICATION] | Unknown | Ubuntu/Debian ship binaries | Not independently deep-dived this cycle |
| libjpeg-turbo | JPEG codec (screen-capture path) | Optional | RVV SIMD source merged for the upcoming 3.2 release; current stable 3.1.4.1 has none; Ubuntu 26.04's packaged 2.1.5 predates the RVV merge entirely | No riscv64 CI upstream | Upstream has declined to provide official riscv64 binaries (Issue #885, "won't implement"); distro packages lag the RVV merge | Single, unpaid maintainer citing a funding deficit; no unsolicited-PR policy; a 5%-performance-gain bar for new SIMD work |
| OpenH264 | H.264 codec (encode; optional decode) | Optional | Meson build fix for riscv64 merged August 2024 (PR #3773); Ubuntu 26.04 ships `libopenh264-dev`/`libopenh264-8` 2.6.0+dfsg-2build1 (main tier) | No CI | Ubuntu/Debian ship binaries | Cisco-maintained; has x86/ARM SIMD only - riscv64 presumably runs generic C [NEEDS VERIFICATION] |
| LLVM | Build toolchain (Clang) | Critical (build) | N/A - toolchain, not a runtime dependency | N/A | WebRTC vendors a pinned Clang via gclient hooks; no fixed minimum version is published, only "the one Chromium uses" | Data not available: whether this pinned Clang build has full riscv64 codegen parity with x86/ARM in WebRTC's specific build configuration |
| Ninja | Build executor | Critical (build) | N/A - portable build tool | N/A | Not independently checked this cycle | No riscv64-specific issues surfaced in any research pass; Ninja is architecture-independent by design [NEEDS VERIFICATION] |
| GN | Build-file generator | Critical (build) | Generic `target_cpu="riscv64"` plumbing exists; Chromium's own `android_clang_riscv64` placeholder toolchain target is explicitly marked untested/toolchain-not-ready | N/A | N/A | `webrtc.gni` itself has no riscv64-specific conditional logic at all - only arm/arm64 NEON gating |
| GCC | Alternative build compiler | Optional (build) | Standard `riscv64-linux-gnu-` cross-compiler toolprefix works with WebRTC's GN GCC toolchain definition; no minimum version documented | N/A | N/A | Not an officially supported/tested compiler for WebRTC at all - Chromium-family projects are Clang-first |

### 9.2 Additional Indirect Dependencies Found via DEPS Analysis

Fetching `DEPS` directly (`https://webrtc.googlesource.com/src/+/refs/heads/main/DEPS`) surfaced further transitive dependencies not in the curated direct list above but relevant to a riscv64 build:

| Dependency | Role | riscv64 status |
|---|---|---|
| Protocol Buffers | Serialization for RTC event logging | Compiles (community-patched); maintainers have stated riscv64 is explicitly unsupported and "not on our roadmap"; no riscv64 protoc binary on Maven/PyPI (Issue #17798 open); highest-risk transitive dependency for automated build pipelines that auto-download protoc |
| zlib | General compression | Compiles cleanly; Ubuntu 26.04 ships `zlib1g`/`zlib1g-dev` on ports tier only; riscv64 CI exists only on OpenBSD via QEMU, no Linux riscv64 CI; a working RVV Adler32 PR (#1099) has been unmerged 8+ months |
| zstd | Compression (event-log/diagnostics) | Compiles; RVV vectorization partially merged (intrinsics only, no `.S` fast path); QEMU-based CI only on specific branches, not full coverage; 7 open RISC-V PRs stalled 2-6 months |
| crc32c | Checksum utility | Compiles via portable fallback; PR #75 (cmake riscv64 detection) open since 2026-06-11; no hardware acceleration yet |

**Architecture correction:** `usrsctp` (historically assumed to be WebRTC's SCTP/data-channel dependency) is confirmed absent from the current `DEPS` file - WebRTC has replaced it with an in-tree `net/dcsctp` implementation (`src/net/dcsctp` returns HTTP 200 on a directory probe). `usrsctp` is no longer a build dependency of current libwebrtc and should not be tracked as one going forward; Ubuntu still packages `libusrsctp2`/`-dev` for riscv64, but for unrelated consumers.

### 9.3 Critical Dependency Analysis

**Protocol Buffers - highest transitive risk.** Maintainers have explicitly stated riscv64 is unsupported and not on their roadmap; no protoc binary is published for riscv64. Any WebRTC build toolchain that auto-downloads protoc from Maven or PyPI breaks on riscv64.

**Abseil - highest risk among the direct critical dependencies.** No CI of any kind runs for riscv64 - not even a compile gate - and every patch requires an internal Google champion plus internal re-export. A CRC32C hardware-acceleration PR is stalled purely on Google's internal riscv64 hardware access, illustrating that the blocker here is organizational, not technical.

**BoringSSL - performance risk, not correctness.** No FIPS module confirmed, no crypto assembly for riscv64; Ubuntu/Debian ship only the Android-fork package, not vanilla upstream BoringSSL. All AES-GCM, ChaCha20, and ECDH operations used in DTLS/SRTP run scalar C. Not a build blocker, but relevant to DTLS handshake performance.

**libvpx - performance risk, not correctness.** VP8/VP9 encode/decode has zero SIMD on riscv64 via the `generic-gnu` fallback. This is the highest-impact codec gap given VP8/VP9 remain widely deployed WebRTC codecs, and no upstream CI exists for libvpx on any architecture.

**dav1d - best-in-class, for contrast.** First-class riscv64 support with QEMU CI on every commit since early 2024, correctness tests across 4 VLEN configurations, and release-note coverage since v1.4.0. It is the one dependency in this table with a genuinely mature riscv64 posture.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (none in core libwebrtc) | Zero riscv64-specific issues/CLs exist against core libwebrtc on Gerrit, issuetracker.google.com/crbug, GitHub, or lore.kernel.org (libwebrtc has no kernel mailing-list presence - it is userspace) | - | - | Confirmed this cycle across all listed trackers |
| Gerrit CL 222481 | "arch.h: Add RISC-V support" | Abandoned 2023-03-18 | - | No response from submitter for 8 months; see Section 2 |
| sipeed/NanoKVM #804 | Switching from WebRTC to MPEG mode wedges NanoKVM-Server until reboot | Open | High (availability, device-specific) | Error: `[lt6911_probe] jump return CVI_FAILURE`; noted as unreliable behind NAT/tunnels on this SG2002 RISC-V device [NEEDS VERIFICATION - device-specific, may not reflect libwebrtc itself] |
| sipeed/NanoKVM #537 | H264 streaming regressed vs WebRTC between firmware 2.2.7 and 2.2.8 | Closed (May 2025) | Medium | Qualitative only: "WebRTC was never good" for responsiveness on this device; no benchmark numbers |
| libsrtp PR #754 | `test_roc_driver.c` timeout under riscv64 QEMU | Open | Low (test-only) | Build succeeds; this is a QEMU test-infrastructure issue, not a correctness bug |
| github.com/riseproject-dev/python-wheels #1136 | webrtcvad-wheels riscv64 support | Open | - | References PR #1109 as the implementing patch; not a libwebrtc-core issue |
| github.com/riseproject-dev/python-wheels #1079 | pylibsrtp riscv64 support | Open | - | SRTP Python wrapper, not libwebrtc-core |
| protobuf #17798 | No riscv64 Maven/PyPI binaries for protoc | Open | High (toolchain, transitive) | Maintainer stance: not on roadmap |

No correctness bugs specific to libwebrtc's own riscv64 code path were found; the sipeed/NanoKVM reports concern a downstream embedded product, not the library.

## 12. Objections and Upstream Blockers

**Organizational.** All core WebRTC OWNERS are Google employees, and contribution acceptance runs exclusively through Google-run Gerrit review. The one substantive attempt at RISC-V work beyond passive macro detection (CL 222481) was abandoned for lack of contributor follow-up, not for a technical objection - the author's own comments attribute the stall to scarce, slow RISC-V hardware and Chromium itself not yet building on RISC-V at the time (2021). No comparable attempt has been made since.

**Technical.** libwebrtc has no `WEBRTC_ARCH_RISCV_FAMILY` macro, which is the gating mechanism every SIMD dispatch site keys off. Adding RVV dispatch to any audio component requires, at minimum: (a) adding the family macro to `arch.h`, (b) adding RVV feature detection to `cpu_info.cc` (a pattern that already exists for libyuv's `RiscvCpuCaps()`), and (c) writing RVV implementations per component (AEC3, FIR filter, sinc resampler, signal processing).

**Contribution process.** Contributions must go through googlesource.com Gerrit and require OWNERS approval; all OWNERS are Google employees. There is no precedent of an external riscv64 SIMD contribution being accepted into core libwebrtc.

**Transitive blockers.** Protocol Buffers' maintainers have explicitly declined riscv64 support, which is a known friction point for any build pipeline that relies on the standard proto toolchain rather than a distro-packaged or source-built protoc. Abseil has no CI of any kind for riscv64, and Google's internal-champion requirement for every patch is an organizational bottleneck independent of code quality.

**libyuv build-flag gap.** libyuv's RVV files compile unconditionally but depend on the toolchain's `-march` implicitly including `+v`; without an explicit flag, `rv64gc` toolchains do not activate RVV. This is undocumented in WebRTC's own build docs and represents an easy-to-miss silent performance regression for anyone building WebRTC for riscv64.

## 13. Readiness Assessment

- **Color:** Orange (downstream-only)
- **Release provider:** None
- libwebrtc has zero riscv64 CI: the live LUCI buildbucket config has zero occurrences of "riscv" across roughly 60+ builders ([cr-buildbucket.cfg](https://webrtc.googlesource.com/src/+/main/infra/config/generated/luci/cr-buildbucket.cfg)), and riscv64 is absent from the officially documented supported platforms ([supported-platforms-and-compilers.md](https://webrtc.googlesource.com/src/+/refs/heads/main/g3doc/supported-platforms-and-compilers.md)). The full engine is never packaged or released as a standalone binary by any distro (source-only, built into Chromium/apps); the only riscv64 artifacts that exist anywhere are downstream/patched forks of a sub-component - `webrtc-audio-processing` (commit `f89958d8`, synced from upstream's arch.h) and Ubuntu's separately built `libwebrtc-audio-coding`/`libwebrtc-audio-processing` packages ([packages.ubuntu.com](https://packages.ubuntu.com/resolute/libwebrtc-audio-coding-1-3)) - not the core libwebrtc project itself. This places the project at the patched/uncertain "downstream-only" floor (capped at orange, not yellow's clean-distro-build), rather than reflecting a genuine upstream or distro release of libwebrtc itself.
- Code does compile on riscv64 (passive `__riscv`/`__riscv_xlen` macros in `rtc_base/system/arch.h`, confirmed cleanly building in the third-party `webrtcvad-wheels` PR #1109), which rules out red.
- This is not an optimization-purpose project: WebRTC's value proposition is protocol and feature completeness, not raw throughput relative to an alternative library.
- **Pending work that could change the grade:** Gerrit CL 222481 ("arch.h: Add RISC-V support") was abandoned 2023-03-18 for lack of contributor follow-up ([CL 222481](https://webrtc-review.googlesource.com/c/src/+/222481)). No open CL/PR/tracking issue exists against core libwebrtc for a riscv64 port or CI lane. The only open items are unrelated third-party wrapper repos - `riseproject-dev/python-wheels` issue #1136 (webrtcvad-wheels riscv64 wheel request) and issue #1079 (pylibsrtp) - neither of which touches core libwebrtc source or CI. No RISE membership or funded RFP for libwebrtc was found.

## 14. Investment Analysis

RISE has no funded work on libwebrtc; everything below is uncovered ground.

### 14.1 Functional Enablement

The codebase already compiles and runs in scalar mode on riscv64. No functional gap blocks deployment today. The remaining work is entirely about making that scalar build official (a family macro, a re-opened porting CL) and documenting the Protocol Buffers workaround for build pipelines.

### 14.2 Performance Optimization

In priority order:

1. **libvpx riscv64 SIMD** - VP8/VP9 is zero-SIMD on riscv64 and remains the dominant deployed WebRTC codec pair; this is a libvpx-project effort, not a libwebrtc-project effort, but it directly determines WebRTC video performance on riscv64.
2. **WebRTC audio DSP RVV** - AEC3, FIR filter, sinc resampler. Requires adding `WEBRTC_ARCH_RISCV_FAMILY` and RVV detection to `cpu_info.cc` first (precedent already exists in libyuv's `RiscvCpuCaps()`).
3. **BoringSSL crypto assembly** - unblocks DTLS handshake performance; BoringSSL has zero riscv64 crypto assembly today, unlike OpenSSL, which could serve as a reference implementation.
4. **libyuv RVV build-flag fix** - ensure `-march=+v` is applied when WebRTC's GN build targets riscv64 with `riscv_use_rvv=true`-equivalent intent; low effort, immediate payoff if RVV hardware is the deployment target.

### 14.3 CI/CD Infrastructure

Adding riscv64 to WebRTC's LUCI CI requires Google's cooperation, since LUCI is Google-operated infrastructure. A lower-friction path is standing up an out-of-tree riscv64 QEMU build+test workflow (fork or downstream distribution) as a proof-of-concept to demonstrate stability before requesting Google add an official LUCI builder - re-opening a CL similar to the abandoned CL 222481, this time with a working CI signal attached, addresses the exact objection ("no response from submitter," compounded by no CI evidence) that killed the last attempt.

### 14.4 Ecosystem Enablement

The `WEBRTC_ARCH_RISCV_FAMILY` macro is the single gating mechanism for every future SIMD dispatch site; adding it is a one-line, trivially upstreamable prerequisite for any of the performance work in 14.2.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `WEBRTC_ARCH_RISCV_FAMILY` macro to arch.h, upstream via Gerrit | 0.5 | Google Gerrit contributor | Critical |
| Functional | Add RVV detection to cpu_info.cc (mirrors libyuv's `RiscvCpuCaps()`) | 1 | Google Gerrit contributor | Critical |
| Functional | Re-open a riscv64 porting CL with CI evidence attached (addressing the reason CL 222481 was abandoned) | 1-2 | External contributor + Google reviewer | High |
| Functional | Document the Protocol Buffers riscv64 workaround (build protoc from source or use a distro package) | 0.5 | Any | High |
| Functional | Fix the libyuv RVV build-flag gap in WebRTC's GN build | 1 | WebRTC build team | High |
| Performance | libvpx riscv64 RVV SIMD (VP8/VP9 DCT, motion estimation, prediction) | 24-40 | libvpx project | Critical |
| Performance | WebRTC AEC3 RVV optimization (matched filter, adaptive FIR, vector math) | 8-12 | Audio DSP engineer | High |
| Performance | WebRTC FIR filter and sinc resampler RVV implementation | 4-6 | Audio DSP engineer | High |
| Performance | WebRTC signal processing (spl: cross-correlation, downsample, min/max) RVV | 4-6 | Audio DSP engineer | Medium |
| Performance | BoringSSL riscv64 crypto assembly (AES-GCM, ChaCha20 at minimum) | 8-12 | BoringSSL/crypto engineer | Medium |
| CI/CD | riscv64 QEMU build+test workflow (fork or downstream, proof of concept) | 2-3 | CI engineer | High |
| CI/CD | Upstream a riscv64 LUCI builder to Google (requires Google buy-in) | 2-4 + negotiation | Google + external sponsor | Low |

## 15. References

- [WebRTC source repository (webrtc.googlesource.com)](https://webrtc.googlesource.com/src)
- [WebRTC LUCI buildbucket config, confirming zero riscv64 builders](https://webrtc.googlesource.com/src/+/main/infra/config/generated/luci/cr-buildbucket.cfg)
- [WebRTC officially documented supported platforms](https://webrtc.googlesource.com/src/+/refs/heads/main/g3doc/supported-platforms-and-compilers.md)
- [WebRTC CI console (ci.chromium.org)](https://ci.chromium.org/p/webrtc/g/ci/console)
- [WebRTC arch.h (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/rtc_base/system/arch.h)
- [WebRTC cpu_info.cc (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/rtc_base/cpu_info.cc)
- [WebRTC spl_inl.h (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/common_audio/signal_processing/include/spl_inl.h)
- [WebRTC sinc_resampler.cc (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/common_audio/resampler/sinc_resampler.cc)
- [WebRTC DEPS file (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/DEPS)
- [WebRTC webrtc.gni (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/webrtc.gni)
- [WebRTC infra/config/builders.star (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/infra/config/builders.star)
- [WebRTC tools_webrtc/mb/mb_config.pyl (webrtc.googlesource.com)](https://webrtc.googlesource.com/src/+/refs/heads/main/tools_webrtc/mb/mb_config.pyl)
- [Gerrit CL 198241 - Add preprocessor support for additional architectures](https://webrtc-review.googlesource.com/c/src/+/198241)
- [webrtc:12312 bug reference](https://bugs.chromium.org/p/webrtc/issues/detail?id=12312)
- [Gerrit CL 222481 - arch.h: Add RISC-V support (abandoned)](https://webrtc-review.googlesource.com/c/src/+/222481)
- [webrtc-audio-processing MR !19 (original RISC-V patch submission)](https://gitlab.freedesktop.org/pulseaudio/webrtc-audio-processing/-/merge_requests/19)
- [webrtc-audio-processing commit f89958d8 - Bring arch.h in line with upstream webrtc](https://gitlab.freedesktop.org/pulseaudio/webrtc-audio-processing/-/commit/f89958d82420cc02c7d80cf8f365e6ed57546c92)
- [Chromium build toolchain definitions, build/toolchain/linux/BUILD.gn](https://chromium.googlesource.com/chromium/src/build/+/0cd0da38e2c2014565c29d8fcbe0f9d893b41ce6/toolchain/linux/BUILD.gn)
- [libyuv row_rvv.cc (chromium.googlesource.com)](https://chromium.googlesource.com/libyuv/libyuv/+/d23308a2a7442be8e559b1b471862fd7588d6a57/source/row_rvv.cc)
- [libyuv scale_rvv.cc (chromium.googlesource.com)](https://chromium.googlesource.com/libyuv/libyuv/+/d23308a2a7442be8e559b1b471862fd7588d6a57/source/scale_rvv.cc)
- [libyuv cpu_id.cc (chromium.googlesource.com)](https://chromium.googlesource.com/libyuv/libyuv/+/d23308a2a7442be8e559b1b471862fd7588d6a57/source/cpu_id.cc)
- [libyuv cpu_id.h (chromium.googlesource.com)](https://chromium.googlesource.com/libyuv/libyuv/+/d23308a2a7442be8e559b1b471862fd7588d6a57/include/libyuv/cpu_id.h)
- [Ubuntu packages - libwebrtc-audio-coding-1-3 (resolute, riscv64 confirmed)](https://packages.ubuntu.com/resolute/libwebrtc-audio-coding-1-3)
- [Ubuntu packages search - libwebrtc (resolute)](https://packages.ubuntu.com/search?keywords=libwebrtc&suite=resolute&searchon=names&section=all)
- [PyPI libwebrtc package lookup (404, package does not exist)](https://pypi.org/pypi/libwebrtc/json)
- [PyPI webrtcvad package](https://pypi.org/pypi/webrtcvad/json)
- [riseproject-dev/python-wheels issue #1136 - webrtcvad-wheels riscv64 support](https://github.com/riseproject-dev/python-wheels/issues/1136)
- [riseproject-dev/python-wheels PR #1109 - build-webrtcvad-wheels.yml for riscv64](https://github.com/riseproject-dev/python-wheels/pull/1109)
- [riseproject-dev/python-wheels issue #1079 - pylibsrtp riscv64 support](https://github.com/riseproject-dev/python-wheels/issues/1079)
- [daanzu/py-webrtcvad-wheels (upstream of webrtcvad-wheels)](https://github.com/daanzu/py-webrtcvad-wheels)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project blog post sitemap (full post list)](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE Project Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [sipeed/NanoKVM Issue #537 - H264 streaming regression](https://github.com/sipeed/NanoKVM/issues/537)
- [sipeed/NanoKVM Issue #804 - WebRTC mode-switch wedges server](https://github.com/sipeed/NanoKVM/issues/804)
- [libsrtp PR #754 - riscv64 QEMU test timeout](https://github.com/cisco/libsrtp/pull/754)
- [Abseil-cpp Issue #1702 - linker error with riscv64 toolchain](https://github.com/abseil/abseil-cpp/issues/1702)
- [Abseil-cpp Issue #2002 - test failures on riscv64-linux-gnu](https://github.com/abseil/abseil-cpp/issues/2002)
- [Abseil-cpp PR #1986 - hardware CRC32C for riscv64](https://github.com/abseil/abseil-cpp/pull/1986)
- [protobuf Issue #17798 - no riscv64 Maven/PyPI binaries](https://github.com/protocolbuffers/protobuf/issues/17798)
- [crc32c PR #75 - cmake riscv64 detection](https://github.com/google/crc32c/pull/75)
- [OpenH264 PR #3773 - meson riscv64 CPU family fix](https://github.com/cisco/openh264/pull/3773)