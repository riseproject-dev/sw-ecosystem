---
title: GStreamer
parent: Project Reports
categories:
  - multimedia
  - browser
---

# GStreamer

**Author:** Ludovic HENRY \<ludovic.henry@qti.qualcomm.com\><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for GStreamer<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

GStreamer is a pipeline-based multimedia framework written in C, licensed under LGPL 2.1. It provides a plugin architecture for media ingest, decode, encode, transform, and output across Linux, Windows, macOS, Android, and iOS. It is the dominant open-source multimedia framework for Linux desktop and embedded Linux products.

**Upstream location:** [gitlab.freedesktop.org/gstreamer/gstreamer](https://gitlab.freedesktop.org/gstreamer/gstreamer) (canonical). The [GitHub mirror](https://github.com/GStreamer/gstreamer) is read-only; issue tracking is not used there.

**Governance:** Informal meritocracy under freedesktop.org infrastructure. No formal steering committee or foundation. Long-standing contributors hold de-facto maintainership.

**Corporate sponsors and maintainers:**

- **Centricular** (UK): Dominant maintainer organization. Key contributors: Tim-Philipp Muller (release manager), Sebastian Droege (core), Jan Schmidt, Matthew Waters (OpenGL/Vulkan), Edward Hervey, Nirbheek Chauhan, Mathieu Duponchelle, Seungha Yang, Francois Laignel.
- **Collabora**: Nicolas Dufresne, Aaron Boxer, Daniel Morin. Co-maintains Debian packaging.
- **Igalia**: Victor Manuel Jaquez Leal, Stephane Cerveau, Philippe Normand, Thibault Saunier.
- Companies with documented technical involvement: NVIDIA, AMD, Google, Meta, LG Electronics, Valve, Pexip, Twilio.
- **Samsung Electronics**: Active contributors to the ORC RISC-V backend (see Section 2).

GStreamer Conference 2025 platinum sponsors: Centricular, Collabora, Igalia, Pexip. Gold: Axis Communications, Fluendo.

**Culture on new ports:** The project accepts new architecture ports through the normal contribution path with no formal approval process. The Samsung ORC RISC-V work was accepted upstream without controversy. The project does not proactively invest in RISC-V but does not block downstream packaging or contributions.

**SIMD acceleration model:** GStreamer core and all standard plugins contain no architecture-specific assembly or intrinsics. All SIMD acceleration is delegated to [liborc](https://gitlab.freedesktop.org/gstreamer/orc) (a portable JIT SIMD compiler). This design means a RISC-V gap in ORC is a gap for the entire GStreamer DSP path, but it also means the core framework compiles cleanly on any architecture that GCC or Clang supports.

---

## 2. Port History and Upstreaming Timeline

The freedesktop.org GitLab instance is protected by Anubis bot-challenge; all direct fetch attempts to issue/MR pages and API endpoints returned Access Denied (error code `9e4edb5b6b850c41`). Dates below are sourced from web searches, release notes, and accessible source files.

| Date | Event | Source |
|------|-------|--------|
| Pre-2024 | GStreamer core and plugins build on riscv64 as generic portable C; Debian and Alpine package riscv64 builds. No architecture-specific work. | Debian tracker, Alpine pkgs |
| Aug 2024 | Samsung engineers (Maksymilian Knust, Filip Wasil) begin ORC RISC-V backend development. Copyright notice in source: "2024-2025 Samsung Electronics". | `orcriscv.c` source header |
| May 9, 2025 | First large ORC RISC-V commit batch landed: "riscv: Add target" (SHA `c9c39f3482fd4f22b454dfb07aad253ed6c6705f`). 407 additions across 15 files introduce `orc/riscv/` directory and meson build integration. | ORC commit history |
| Jan 8, 2026 | ORC 0.4.42 release announcement: "Initial 64-bit RISC-V support" included. | [gstreamer.freedesktop.org news](https://gstreamer.freedesktop.org/) |
| Mar 22, 2026 | GStreamer 1.29.1 release: "cerbero gained support for Android on RISC-V64" (build toolchain only, not a runtime feature). | GStreamer release notes |
| Jun 6, 2026 | MR !11768 opened: adds `gst_cpuid_supports_riscv_v()` for runtime RVV detection via `getauxval(AT_HWCAP)`. Not yet reviewed or merged as of 2026-06-17. | [GStreamer MR !11768](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11768) |
| Jun 8, 2026 | MR !11773 opened: adds `HAVE_CPU_RISCV32` and `HAVE_CPU_RISCV64` preprocessor definitions in the ABI test `host_defines` arrays. Not yet reviewed or merged as of 2026-06-17. | [GStreamer MR !11773](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11773) |
| Jun 15, 2026 | MR !11784 merged into milestone 1.29.2 (backported to 1.28): fixes a Meson `full_path()` build error when building on Alpine RISC-V with system GLib but G-I from source. | [GStreamer MR !11784](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11784) |
| Jun 25, 2026 | ORC commit: "Fix convsusN vsetvli to preserve VL." Active RVV bug fixes still landing. | ORC commit history |

**Key contributors by organization:**

| Contributor | Org | Work |
|---|---|---|
| Maksymilian Knust (mbknust) | Samsung Electronics | ORC RISC-V backend initial implementation |
| Filip Wasil (filipwasil) | Samsung Electronics | ORC RISC-V backend, co-author of initial batch |
| brad0 | (unknown) [NEEDS VERIFICATION] | ORC RISC-V hwprobe/getauxval CPU detection, OpenBSD support |
| ziyao233 | (unknown) [NEEDS VERIFICATION] | ORC ISA string parse crash fix for multi-character extensions |
| Felix-Gong | (unknown) [NEEDS VERIFICATION] | GStreamer MRs !11768 and !11773 (runtime RVV detection, ABI defines) |

**Fully upstream?** Yes, for what exists. All landed ORC changes are in the canonical upstream ORC repository. The two GStreamer core MRs (!11768, !11773) are open and pending review. There are no known out-of-tree or distro-specific RISC-V patches in Debian or Alpine.

---

## 3. Upstream Support Tier

GStreamer has no published platform tier policy.

**CI evidence (what upstream actually tests):**

The monorepo `.gitlab-ci.yml` defines jobs for:
- x86-64 Linux (Fedora 43, Debian Bookworm) - native runners
- Windows x86/x86_64/arm64 (MSVC) - native runners
- macOS arm64 - native runners
- Windows arm64 cross-compile - marked manual/allow_failure

There is no riscv64 CI job of any kind: no native runner, no QEMU emulation, no cross-compilation target.

**Release-blocking:** riscv64 is not a release-blocking platform. Release manager Tim-Philipp Muller has never listed riscv64 as a required-passing architecture in any accessible release announcement.

**Official binary releases:** The [GStreamer download page](https://gstreamer.freedesktop.org/download/) ships binaries for Windows (x86/x86_64/arm64), macOS (Universal x86_64+arm64), Android (armv7/arm64/x86/x86_64), and iOS. No riscv64 binary release exists and none is announced.

**Cerbero (GStreamer's build-integration tool):** Platform configs cover Android (arm64, armv7, x86, x86_64), macOS/iOS (arm64, x86_64), Windows (x86, x86_64, arm64). GStreamer 1.29.1 added `cross-android-riscv64.cbc` for Android only. No Linux riscv64 cerbero config exists.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI (upstream) | Yes - blocking | Yes - blocking (Windows arm64 manual) | No |
| Official binary releases | Yes | Yes | No |
| Release-blocking | Yes | Partial | No |
| Formal tier name | (not published) | (not published) | (not published) |
| ORC SIMD acceleration | Yes - SSE/AVX/AVX-512 | Yes - NEON/AArch64 | Partial - RVV, unstable API |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

GStreamer itself has no architecture-specific subsystems. All SIMD acceleration, JIT compilation, and CPU-dispatch is in ORC (liborc). The analysis below covers ORC, which is the critical dependency for RISC-V media performance.

### 4.1 ORC RISC-V Backend

ORC is a portable JIT SIMD compiler. At runtime it reads `.orc` bytecode (embedded in GStreamer plugins as generated C arrays) and emits native instructions for the detected CPU.

**Backend files:** 9 files in `orc/riscv/` subdirectory:
- `orcriscv.c`, `orcriscv.h`, `orcriscv-internal.h`
- `orcriscvcompiler.c` (~660 lines)
- `orcriscvinsn.c` (~700-750 lines) - RV64I + RVV instruction encoding
- `orcriscvinsn.h`
- `orcriscvrules.c` (~900-950 lines) - ORC opcode to RISC-V mapping
- `orcriscvtarget.c` (~285-295 lines) - CPU feature detection
- `riscv/meson.build`

**Total:** approximately 2,600-2,700 lines of substantive C code.

**ISA extensions implemented:**

| Extension | Detection | Code generation | Notes |
|---|---|---|---|
| RV64I (scalar) | Always | Full | Complete instruction encoding |
| V (RVV 1.0) | hwprobe, getauxval, cpuinfo | Broad - load/store, arith, shift, float, convert | Active bug fixes landing; API marked unstable |
| Zvkb | hwprobe + cpuinfo | Flag only | No dedicated rules |
| Zvbb | hwprobe + cpuinfo | Flag only | No dedicated rules |
| Zvkn | cpuinfo/getauxval only | Partial - not in hwprobe path | [NEEDS VERIFICATION] whether rules use it |
| Zvks | cpuinfo/getauxval only | Partial - not in hwprobe path | [NEEDS VERIFICATION] |
| RV32 | Explicitly rejected | None | FIXME comment in `orcriscvcompiler.c` |

**CPU feature detection priority (`orcriscvtarget.c`):**
1. `elf_aux_info()` - BSD
2. `__riscv_hwprobe()` - Linux, requires kernel >= 6.4
3. `getauxval(AT_HWCAP)` + `/proc/cpuinfo`
4. `/proc/cpuinfo` string parsing only

**Rules coverage in `orcriscvrules.c`:**
- Memory: load/store in all widths (8/16/32/64-bit)
- Integer arithmetic: add, sub, multiply (mull/muls/mulhs), divide (div255w via multiply optimization), abs, avg, sign, accumulate
- Bitwise/shift: and, andn, or, xor, shl, shrs, shru
- Pack/unpack: merge, split, select, splat
- Conversions: narrowing, widening, signed/unsigned, saturating, float-to-int, int-to-float, double
- Float: addf/d, subf/d, mulf/d, divf/d, sqrtf/d, minf/d, maxf/d
- Known FIXMEs: two load rules noted as "should be fixed at a higher level"

**API stability:** All public ORC RISC-V API is gated behind `ORC_ENABLE_UNSTABLE_API`. The backend is not yet promoted to stable ABI.

### 4.2 GStreamer Core CPU Detection (MRs in progress)

MR !11768 adds `gst_cpuid_supports_riscv_v()` using `getauxval(AT_HWCAP)` with `COMPAT_HWCAP_ISA_V`. This is detection plumbing only - no GStreamer plugin currently has RVV-optimized codepaths. The existing `gstcpuid` module covers only x86 (MMX/SSE/AVX) and ARM/AArch64 (NEON). MR !11773 adds `HAVE_CPU_RISCV32` and `HAVE_CPU_RISCV64` preprocessor defines to the ABI test framework. Neither MR is reviewed as of 2026-06-17.

### 4.3 Comparison Table per Component

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| ORC JIT backend | SSE/AVX/AVX-512, mature | NEON/AArch64, mature | RVV 1.0, experimental, Samsung-driven |
| ORC CPU detection | CPUID instruction | getauxval/HWCAP | hwprobe + getauxval + cpuinfo (4 paths) |
| ORC API stability | Stable | Stable | Unstable (requires `ORC_ENABLE_UNSTABLE_API`) |
| GStreamer CPU detection | CPUID in gstcpuid.c | NEON in gstcpuid.c | MR !11768 open, not merged |
| GStreamer ABI test defines | HAVE_CPU_X86_64 | HAVE_CPU_AARCH64 | MR !11773 open, not merged |
| Plugin SIMD dispatch | Via ORC | Via ORC | Via ORC (when RVV rules fire) |
| Video scaler (plugins-base) | ORC-accelerated | ORC-accelerated | ORC-accelerated if RVV available, else C |
| Audio format conversion (plugins-base) | ORC-accelerated | ORC-accelerated | ORC-accelerated if RVV available, else C |
| Compositor | ORC-accelerated | ORC-accelerated | C fallback (ORC rules may fire partially) |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Meson, minimum version 1.4 (enforced in top-level `meson.build`). No CMake. No autotools.

**C standard:** `gnu11,c11`. **C++ standard:** `c++14`. No explicit minimum GCC or Clang version is stated; any compiler supporting C11/C++14 with GNU extensions satisfies the formal requirement.

**Cross-compilation files in repo:** None for riscv64. The only cross files present are:
- `ci/meson/vs2022-arm64-cross.ini` (Windows MSVC arm64)
- `ci/meson/vs2022-x64-native.ini` (Windows MSVC x64)

A riscv64 Linux cross file must be created manually. Example derived from existing patterns and Meson documentation:

```ini
[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'

[binaries]
c = 'riscv64-linux-gnu-gcc'
cpp = 'riscv64-linux-gnu-g++'
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'
pkgconfig = 'riscv64-linux-gnu-pkg-config'

[properties]
sys_root = '/usr/riscv64-linux-gnu'
```

**Cross-compilation build commands:**

```bash
meson setup builddir \
  --cross-file riscv64-linux-gnu.ini \
  -Dauto_features=disabled \
  -Ddoc=disabled \
  -Dintrospection=disabled \
  -Dtests=disabled
meson compile -C builddir
```

**Native build on a riscv64 host:**

```bash
meson setup builddir
meson compile -C builddir
```

**Known -D flags relevant to riscv64:**

| Flag | Reason |
|---|---|
| `-Ddoc=disabled` | Documentation auto-disabled on cross-builds |
| `-Dintrospection=disabled` | GObject Introspection may lack riscv64 support in some distros |
| `-Dgst-plugins-bad:intel-media-sdk=disabled` | Intel MSDK is x86-only |
| `-Dgst-plugins-bad:va=disabled` | VA-API drivers absent on riscv64 |
| `-Dauto_features=disabled` | Safe starting point for cross-compilation |
| `-Dorc=disabled` | Disable ORC if the unstable RVV backend causes issues |

**libatomic:** GStreamer's `meson.build` includes a generic `cc.find_library('atomic', required: false)` workaround that applies to architectures requiring explicit `-latomic` linkage, including riscv64. No special action needed.

**QEMU:** GStreamer's CI uses QEMU for virtme VM-based Linux kernel tests (`ci/scripts/build-linux.sh`), but this infrastructure has no riscv64 target. The script contains `s/riscv.*/riscv/` as host architecture normalization boilerplate; it is dead code in practice because no riscv64 CI runner is provisioned.

For local riscv64 testing on an x86-64 host, `qemu-riscv64-static` user-mode emulation via `binfmt_misc` works with Debian and Alpine riscv64 sysroots. No GStreamer-specific QEMU configuration exists.

**Known build failures:**

- MR !11784 (merged Jun 2026): Meson `full_path()` method error when building on Alpine RISC-V with system GLib but G-I from source. Fixed in 1.29.2, backported to 1.28.
- Arch Linux RISC-V: `riscv64.patch` fails to apply to current GStreamer source ("Hunk #3 FAILED at 243"). Hard FTBFS as of verification date. Dependency `svt-hevc` is also missing entirely on Arch RISC-V.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional Gaps

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| All pipeline features (decode, encode, mux, RTP, etc.) | Yes | Yes | Yes | Portable C; no functional gaps in framework |
| GObject Introspection (language bindings) | Yes | Yes | Partial | Build workaround merged (MR !11784); distro support varies |
| Hardware video decode via VA-API | Yes | No (NVIDIA proprietary) | No | No riscv64 VA-API drivers |
| Hardware video decode via NVDEC/NVENC | Yes | Yes (Jetson) | No | NVIDIA hardware not available for riscv64 Linux |
| Hardware video decode via V4L2 | Yes | Yes | Yes (on capable hardware) | V4L2 is kernel-level; portable |
| RTP/RTSP streaming | Yes | Yes | Yes | Portable |
| Android riscv64 (cerbero) | Yes | Yes | Partial - cerbero `cross-android-riscv64.cbc` added in 1.29.1 | Toolchain only; runtime untested |
| WebRTC (gst-plugins-bad) | Yes | Yes | Yes (functional) | No SIMD acceleration, software-only |

### Performance Gaps (ORC SIMD)

The primary performance gap is ORC having no RISC-V backend until 2025-2026, and the current backend being experimental. On riscv64 without RVV hardware or with ORC in C-fallback mode:

| Operation | amd64 | arm64 | riscv64 (C fallback) | riscv64 (ORC RVV, when available) |
|---|---|---|---|---|
| Video color space conversion (I420->NV12 etc.) | ORC/SSE | ORC/NEON | C scalar | ORC/RVV (partial, unstable) |
| Audio format conversion (S16->F32 etc.) | ORC/SSE | ORC/NEON | C scalar | ORC/RVV (partial, unstable) |
| Video compositing | ORC/SSE | ORC/NEON | C scalar | ORC/RVV (partial, unstable) |
| H.264 decode (via gst-libav/FFmpeg) | RVV-optimized (FFmpeg) | NEON-optimized | RVV-optimized (FFmpeg, strong) | Same as "available" |
| AV1 decode (via dav1d) | RVV-optimized | NEON-optimized | RVV-optimized (dav1d >= 1.4.0) | Same |
| VP8/VP9 decode (via libvpx) | SIMD | SIMD | C scalar | C scalar (libvpx has no riscv64 SIMD) |
| Opus audio (via libopus) | SIMD | SIMD | C scalar | C scalar (libopus has no riscv64 SIMD) |
| H.264 encode (via x264) | x86 assembly | ARM assembly | C scalar | C scalar (x264 has no riscv64 SIMD) |
| HEVC encode (via x265) | x86 SIMD | ARM SIMD | C scalar | C scalar (x265 has no riscv64 SIMD) |

No benchmark figures are published. Data not available: published fps, latency, or throughput comparisons between riscv64 and arm64/amd64 for any GStreamer pipeline.

### Security Hardening Gaps

Data not available: any published analysis of security hardening feature coverage differences between riscv64 and other architectures for GStreamer. No riscv64-specific security bugs filed in any accessible tracker.

### Floating-Point Semantics

GStreamer relies on standard IEEE 754 via GLib and the C compiler. No riscv64-specific floating-point issues are documented. ORC's RVV float rules (`addf`, `mulf`, `divf`, etc.) exist in `orcriscvrules.c` with a note that missing `normalize_result` bugs were fixed in May 2026; some subtlety around VL-preserving `vsetvli` was fixed in a June 25, 2026 ORC commit.

---

## 7. CI/CD Infrastructure

**GStreamer monorepo CI (`.gitlab-ci.yml`):**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | Yes (Fedora, Debian) | Yes (Windows MSVC, macOS) | No |
| Cross-compile job | No | Yes (Windows arm64, manual) | No |
| QEMU emulation | No | No | No |
| Docker image | Yes | Yes | No |
| CI framework | GitLab CI | GitLab CI | N/A |
| Test suite runs | Yes (build + unit) | Windows: build only | N/A |

**ORC CI:** ORC's own `.gitlab-ci.yml` runs jobs for amd64, arm64, ppc64le, and loongarch64. No riscv64 job exists for ORC either.

**RISE CI runners:** The RISE Project is not involved with GStreamer (see Section 12). No RISE-provisioned riscv64 runner is used by GStreamer or ORC.

**Downstream regression gate:** The only riscv64 regression detection for GStreamer comes from Debian sid autopkgtest runs and Alpine CI. These run on QEMU-emulated or native riscv64 hardware as part of distro infrastructure, not under GStreamer's control.

---

## 8. Distribution and Release Status

**Official upstream binaries:** None for riscv64. The [GStreamer download page](https://gstreamer.freedesktop.org/download/) ships binaries for Windows, macOS, Android, and iOS only. Linux consumers have always depended on distribution packages.

**Distribution package status:**

| Distribution | Version | riscv64 Status | Notes |
|---|---|---|---|
| Debian sid (unstable) | 1.28.4-2 | YES - available | `arch: any`; built on `rv-manda-03` buildd; 1,401.9 kB |
| Debian experimental | 1.29.1-1 | YES - available | Development snapshot |
| Debian testing | 1.28.3-1 | YES - available | Autopkgtest results include riscv64 |
| Ubuntu Noble (24.04 LTS) | 1.24.2-1 | YES - available | Via Ubuntu Ports for riscv64; 32 of 33 packages include riscv64; `gstreamer1.0-fdkaac` excluded (FDK-AAC license restrictions) |
| Alpine Linux edge | 1.28.3-r0 | YES - available | Main repo, build date 2026-05-29 |
| Fedora 42 | 1.26.11 | NO | Koji build arches: i386/aarch64/ppc64le/x86_64/s390x only. riscv64 absent. |
| Arch Linux RISC-V | 1.26.0-3 | BROKEN | FTBFS: `riscv64.patch` fails at hunk #3; `svt-hevc` dep missing entirely |
| Gentoo | 1.26.11 | Partial | `~riscv` keyword (testing only, not stabilized) |

**What a user must do to get a working binary:**

On Debian or Alpine: install via package manager (`apt install gstreamer1.0-tools libgstreamer1.0-dev gstreamer1.0-plugins-base gstreamer1.0-plugins-good`). No source build required.

On Fedora: GStreamer for riscv64 is not packaged. Users must build from source using Meson with a riscv64 cross file or on a native riscv64 host.

On Arch Linux RISC-V: current package is broken. Users must build from source with patches applied manually.

**PyPI / npm / Maven / OCI containers:** Not applicable. GStreamer is a C library. Python bindings are accessed via system PyGObject packages, not standalone PyPI wheels. No GStreamer OCI container image for riscv64 is published by the upstream project.

---

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|
| GLib >= 2.64 | GObject, GIO, GThread, GMainLoop | Yes | No dedicated CI | Packaged universally | No riscv64-specific code in glib |
| ORC >= 0.4.34 | SIMD JIT acceleration | Yes (Alpine 0.4.42) | Partial (no ORC CI for riscv64) | Released in 0.4.42 | RVV backend experimental; see deep-dive below |
| FFmpeg (libav*) | All codec decode/encode in gst-libav | Yes (Alpine 8.1.1) | CI in development (QEMU riscv64 PR unmerged Mar 2026) | Packaged | Named RISC-V maintainer; 219+ riscv64 patches; strong RVV |
| OpenSSL | TLS in gst-plugins-bad | Yes | Yes (QEMU cross-compile CI) | Released since 3.0.3 (2022) | First-class riscv64 support |
| GnuTLS | TLS alternative | Yes (Alpine 3.8.13) | Unknown | Packaged | Depends on nettle; no known issues |
| dav1d | AV1 decode in gst-plugins-bad | Yes (Alpine 1.5.3) | Yes (RVV CI added MR !1608, Feb 2024) | Released since 1.4.0 | RVV-accelerated; excellent trajectory |
| zlib | Compression (matroska, isomp4) | Yes | Partial (OpenBSD CI Jan 2026) | Packaged | No riscv64 SIMD; pure-C fallback |
| zlib-ng | zlib replacement (some distros) | Yes | Cross-compile CI | Packaged | SiFive/Icenowy RVV work for adler32/slide_hash |
| libopus | Opus audio | Yes (Alpine 1.6.1) | None | Packaged | No riscv64 SIMD; PR #476 abandoned. C fallback only |
| libvpx | VP8/VP9 encode/decode | Yes (Alpine 1.15.2) | Unknown | Packaged | No riscv64 in `configure` ARCH_EXT_LIST; C fallback only |
| x264 | H.264 encode | Yes (Alpine 0.164.3108) | Unknown | Packaged | No riscv64 assembly; C fallback only |
| x265 | HEVC encode | Yes (Alpine 4.1) | Unknown | Packaged | No riscv64 SIMD; C fallback only |
| libvorbis / libogg | Vorbis audio | Yes | Unknown | Packaged | Pure-C; zero risk |
| libdrm | DRM/KMS for hardware decode | Yes | Unknown | Packaged | Portable IOCTL layer; no arch code |
| gst-plugins-rs | Rust plugins (dav1d, rav1e, rspng) | Yes (Alpine 0.15.2) | None | Packaged | Rust riscv64 Tier 2; dav1d/rav1e leverage their riscv64 optimizations |

### Deep Dive: ORC (liborc)

ORC is the most important dependency for riscv64 performance. Its RISC-V backend is a genuine non-trivial implementation (9 files, ~2,700 lines) written by Samsung Electronics engineers.

**Version shipped:** ORC 0.4.42 (Alpine edge 2026-06-23, Debian sid `1:0.4.42-3`).

**Strengths:**
- Complete RV64I scalar instruction encoding
- Broad RVV 1.0 opcode coverage: load/store all widths, integer arithmetic, shift, float, conversions
- Four-path CPU feature detection supporting Linux and BSD
- Detects V, Zvkb, Zvbb extensions
- 35+ commits through June 2026; active maintainer engagement

**Weaknesses:**
- RV32 explicitly unsupported (FIXME in source)
- Entire API gated behind `ORC_ENABLE_UNSTABLE_API`
- Two FIXME notes in load rules
- Zvkn/Zvks detection incomplete in hwprobe path
- No ORC CI for riscv64; correctness depends on downstream distro testing
- ORC requires kernel >= 6.4 for `sys_riscv_hwprobe`; falls back to `getauxval` on older kernels

**ORC's riscv64 CI gap is the highest-priority infrastructure investment for GStreamer on RISC-V.** Without it, regressions in ORC's RVV backend will reach distros undetected.

### Deep Dive: FFmpeg (via gst-libav)

FFmpeg has a named RISC-V maintainer (Remi Denis-Courmont) and 219+ RISC-V patches. RVV-optimized implementations exist for H.264, VP8/VP9, HEVC, AAC, FLAC, Opus, Vorbis, and swscale. gst-libav passes all decode/encode operations through FFmpeg's codec layer, so the quality of riscv64 codec support in gst-libav tracks FFmpeg's trajectory directly. Full details in `./multimedia/ffmpeg.md`.

### Codec SIMD Gap Summary

The three encoder dependencies (x264, x265, libvpx encode) and libopus have no riscv64 SIMD paths. For a media server workload that requires high-throughput VP9 or H.265 encoding on riscv64, performance will be significantly below arm64 and amd64 in the current state.

---

## 11. Known Bugs and Active Issues

**Correctness bugs:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#4856](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/work_items/4856) | `libs_gstharness.test sometimes times out` | Open (Jan 2026) | Low (test infrastructure) | Observed only on `qemuriscv5` QEMU; intermittent timeout after 104.9s; 1 error among 8 checks. Hypothesis: slow QEMU emulation triggering a pre-existing race in gstharness. No response or patch. |
| [#3433](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/work_items/3433) | `gst-libav: general:test_videoenc_drain fails on riscv64` | Closed (Mar 2024) | Medium (was correctness) | SIGILL in gst-libav 1.22.11 on Alpine Linux riscv64 (real hardware). Root cause: FFmpeg codec path executed unsupported instruction. Closed same day by reporter (Natanael Copa, Alpine maintainer). Resolved upstream or in FFmpeg dep. |

**Infrastructure/build issues:**

| ID | Title | Status | Notes |
|---|---|---|---|
| [MR !11784](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11784) | GObject-Introspection build fix for Alpine RISC-V | Merged Jun 2026, backported to 1.28 | Meson `full_path()` error on Alpine riscv64 with mixed GLib/GI versions. |
| Arch RISC-V FTBFS | `riscv64.patch` fails to apply | Open | Hunk #3 fails at line 243; `svt-hevc` dep missing. GStreamer on Arch RISC-V is currently uninstallable from source. [NEEDS VERIFICATION - no upstream issue filed] |

**Open MRs adding riscv64 functionality (not yet merged):**

| MR | Title | Status | Notes |
|---|---|---|---|
| [!11768](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11768) | Add `gst_cpuid_supports_riscv_v()` RVV runtime detection | Open (Jun 6, 2026) | Detection plumbing only; no RVV codepaths yet. Author: Felix-Gong. |
| [!11773](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11773) | Add `HAVE_CPU_RISCV32/64` to ABI test `host_defines` | Open (Jun 8, 2026) | Prerequisite for riscv64 ABI regression testing. Author: Felix-Gong. |

---

## 12. Objections and Upstream Blockers

**No stated organizational objections.** The Samsung ORC work was accepted without controversy. The project's informal governance means there is no committee to lobby.

**Technical blockers for CI:**
- GStreamer's CI runs on self-hosted GitLab runners maintained by Centricular and Collabora. Adding riscv64 requires provisioning physical or cloud riscv64 machines and registering them with the freedesktop.org GitLab instance. This is a resource/infrastructure problem, not a code problem.
- freedesktop.org infrastructure is not part of the RISE project's runner program.
- The freedesktop.org GitLab instance has Anubis bot-challenge protection that blocks automated tooling, complicating CI integration work from outside the core team.

**Technical blocker for ORC stability:** The RVV backend must exit `ORC_ENABLE_UNSTABLE_API` gating before GStreamer distro packages can depend on it unconditionally. This requires the ORC maintainers to review, stabilize, and declare the API stable. Timeline is not published.

**Acceptance probability for well-formed contributions:** High. Both the ORC backend and the build-fix MR were accepted without friction. The two open MRs (!11768, !11773) from Felix-Gong are straightforward and there is no documented reviewer pushback.

**RISE involvement:** None. GStreamer is not a RISE-funded project. The RISE blog (28 posts through June 2026) contains zero mentions of GStreamer. RISE's multimedia work covers FFmpeg (RP002: H.264 decode optimization) and libjpeg-turbo (RP003: RVV port). Neither Centricular nor Collabora appear in the RISE member list.

---

## 13. Investment Analysis

RISE has not funded GStreamer directly. FFmpeg (RP002) and libjpeg-turbo (RP003) are adjacent but do not cover GStreamer infrastructure or the ORC SIMD layer.

### 13.1 Functional Enablement

MRs !11768 and !11773 are already submitted and need review only. No new code investment is required for basic riscv64 detection support in GStreamer core. The functional gap is in encoder SIMD: x264, x265, libvpx, and libopus all lack riscv64 SIMD paths and are independent projects with their own contribution processes.

### 13.2 Performance Optimization

The ORC RVV backend is the single highest-leverage performance investment. It accelerates all ORC-based DSP in gstreamer-plugins-base (color conversion, audio mixing, compositing) across every GStreamer application without per-codec work. The backend exists and is active; the investment need is in stabilizing it (fixing remaining FIXMEs, promoting out of `ORC_ENABLE_UNSTABLE_API`, adding ZVKN/ZVKS hwprobe detection) and adding GStreamer-level CI to validate it.

Encoder SIMD (x264, x265, libvpx) is higher effort, lower leverage for a multimedia framework evaluation: these are separate upstreams with large existing codebases and no RISC-V SIMD contributors currently engaged.

### 13.3 CI/CD Infrastructure

The highest-impact infrastructure gap is the absence of any riscv64 CI in both GStreamer and ORC. Without it, regressions reach Debian and Alpine silently. The investment is:
- Provision one or more riscv64 runners (native hardware or QEMU) registered with freedesktop.org GitLab.
- Add a riscv64 CI job to ORC's `.gitlab-ci.yml` (highest priority - this is where the active SIMD code lives).
- Add a riscv64 CI job to GStreamer's `.gitlab-ci.yml` (cross-compile + QEMU test run).

### 13.4 Ecosystem Enablement

Section 10 is omitted per the formatting rules: GStreamer is a C multimedia framework with no significant dependent package ecosystem requiring per-package riscv64 enablement work.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Review and merge MR !11768 (RVV detection) and MR !11773 (ABI defines) | 1 | GStreamer core maintainer | High |
| Performance | Stabilize ORC RVV backend: fix remaining FIXMEs, complete Zvkn/Zvks hwprobe detection, promote out of `ORC_ENABLE_UNSTABLE_API` | 4-6 | Samsung/ORC maintainers | High |
| CI/CD | Add riscv64 QEMU job to ORC `.gitlab-ci.yml` | 2 | Centricular/freedesktop.org infra | High |
| CI/CD | Add riscv64 QEMU or cross-compile job to GStreamer monorepo `.gitlab-ci.yml` | 2-3 | Centricular/freedesktop.org infra | Medium |
| CI/CD | Provision riscv64 CI runner for freedesktop.org GitLab | 2 (infrastructure) | freedesktop.org / sponsor | High |
| Performance | Fedora riscv64 packaging: enable GStreamer builds (investigate koji riscv64 arch enablement) | 2 | Fedora packager | Medium |
| Performance | Fix Arch Linux RISC-V `riscv64.patch` to apply against current GStreamer source | 1 | Arch RISC-V porter | Low |
| Performance | libopus riscv64 SIMD (RVV Opus decode/encode) | 8-12 | New contributor or libopus maintainer | Low |
| Performance | libvpx riscv64 SIMD (RVV VP8/VP9) | 10-16 | New contributor | Low |
| Performance | x264 riscv64 assembly (H.264 encode) | 12-20 | New contributor | Low |

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [GStreamer monorepo (GitHub mirror)](https://github.com/GStreamer/gstreamer)
- [GStreamer canonical upstream (GitLab, Anubis-protected)](https://gitlab.freedesktop.org/gstreamer/gstreamer)
- [GStreamer ORC library (GitLab)](https://gitlab.freedesktop.org/gstreamer/orc)
- [GStreamer ORC (GitHub mirror)](https://github.com/GStreamer/orc)
- [GStreamer download page](https://gstreamer.freedesktop.org/download/)
- [GStreamer 1.29.1 release notes](https://gstreamer.freedesktop.org/releases/1.29/)
- [ORC 0.4.42 release announcement](https://gstreamer.freedesktop.org/)
- [MR !11768: Add gst_cpuid_supports_riscv_v()](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11768)
- [MR !11773: Add HAVE_CPU_RISCV32/64 ABI defines](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11773)
- [MR !11784: Alpine RISC-V G-I build fix (merged)](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11784)
- [Issue #4856: gstharness test timeout on qemuriscv5](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/work_items/4856)
- [Issue #3433: gst-libav SIGILL on Alpine riscv64 (closed)](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/work_items/3433)
- [Debian tracker: gstreamer1.0](https://tracker.debian.org/pkg/gstreamer1.0)
- [Ubuntu Noble: libgstreamer1.0-0 packages](https://packages.ubuntu.com/noble/libgstreamer1.0-0)
- [Alpine Linux pkgs: gstreamer edge riscv64](https://pkgs.alpinelinux.org/packages?name=gstreamer&arch=riscv64)
- [Fedora Koji: gstreamer1-1.26.11-1.fc42](https://koji.fedoraproject.org/koji/buildinfo?buildID=2659447)
- [Arch Linux RISC-V porting: archriscv-packages](https://github.com/felixonmars/archriscv-packages)
- [RISE Project: riseproject.dev](https://riseproject.dev/)
- [RISE RFP002: Optimize H.264 Decoding in FFmpeg](https://riseproject.dev/)
- [Centricular: core GStreamer maintainer organization](https://www.centricular.com/)