---
title: GStreamer
parent: Project Reports
color: orange
dependencies:
  - name: GLib
    relation: runtime-dependency
    criticality: critical
  - name: liborc
    relation: runtime-dependency
    criticality: critical
  - name: Meson
    relation: build-dependency
    criticality: critical
  - name: GNU bison
    relation: build-dependency
    criticality: critical
  - name: Flex
    relation: build-dependency
    criticality: critical
  - name: Check
    relation: test-dependency
    criticality: critical
  - name: GObject Introspection
    relation: build-dependency
    criticality: optional
  - name: FFmpeg
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: GnuTLS
    relation: runtime-dependency
    criticality: optional
  - name: dav1d
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: zlib-ng
    relation: runtime-dependency
    criticality: optional
  - name: libopus
    relation: runtime-dependency
    criticality: optional
  - name: libvpx
    relation: runtime-dependency
    criticality: optional
  - name: libx264
    relation: runtime-dependency
    criticality: optional
  - name: libx265
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="gstreamer" %}

# GStreamer

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for GStreamer<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

GStreamer is a pipeline-based multimedia framework written in C, licensed under LGPL. It provides a plugin architecture for media ingest, decode, encode, transform and output across Linux, Windows, macOS, Android and iOS, and is the dominant open-source multimedia framework for Linux desktop and embedded Linux products.

**Upstream location:** [gitlab.freedesktop.org/gstreamer/gstreamer](https://gitlab.freedesktop.org/gstreamer/gstreamer) (canonical, protected by Anubis anti-bot gating for automated access). A read-only [GitHub mirror](https://github.com/GStreamer/gstreamer) exists; issue tracking is not used there, but every merged commit carries a `Part-of: <gitlab.../merge_requests/NNNN>` trailer written by GitLab at merge time, which is a reliable way to recover real GitLab merge-request numbers, authors and dates through the mirror.

**Legal entity and governance:** The GStreamer Foundation is a registered UK entity (Companies House #10367715), with Tim-Philipp Muller as director and Bristol Legal Services Limited as secretary. It is not part of a larger umbrella foundation such as X.Org or the Linux Foundation, though a "GStreamer Security Insights" page is hosted on insights.linuxfoundation.org. There is no formal tiered governance model; the MAINTAINERS file describes the project as "maintained by the consensus of a number of people," with discussion on the gstreamer-devel mailing list, largely superseded by GStreamer Discourse. No formal RFC or tier process for architecture support exists.

**Corporate sponsors and maintainers:**

- **Centricular** (UK): dominant maintainer organization. Key contributors: Tim-Philipp Muller (release manager), Sebastian Droege, Jan Schmidt, Matthew Waters, Edward Hervey, Nirbheek Chauhan, Mathieu Duponchelle, Seungha Yang, Francois Laignel, Taruntej Kanakamalla (RISC-V Rust-bindings work).
- **Collabora**: Nicolas Dufresne, Aaron Boxer, Daniel Morin. Co-maintains Debian packaging.
- **Igalia**: Victor Manuel Jaquez Leal, Stephane Cerveau, Philippe Normand, Thibault Saunier. Maintains gstreamer-vaapi/VA plugin and leads GStreamer Editing Services.
- **Wim Taymans** (Red Hat), **David Schleef** (independent).
- **Samsung Electronics**: authored the foundational ORC RISC-V Vector (RVV) code-generation backend.
- **ISCAS (Institute of Software, Chinese Academy of Sciences)**: authored the first RVV-accelerated GStreamer element (audio resampler) and a large share of ORC's RVV refinement work (contributor Felix-Gong).
- **Alibaba**: authored Android riscv64 cross-build support in cerbero (contributor Mao Han).
- Conference sponsorship tiers (GStreamer Conference 2025): Platinum: Centricular, Pexip, Igalia. Gold: Axis Communications, Collabora, Fluendo. Silver: Tightrope Media Systems.

**Culture on new ports:** Pragmatic and low-friction. Because GStreamer is portable C, new architecture support, including RISC-V, is typically landed as small targeted patches (for example, unaligned-access handling) rather than large port efforts, and is generally accepted without formal gatekeeping. The Samsung ORC RVV backend and the ISCAS follow-on work were both accepted without documented controversy.

**SIMD acceleration model:** GStreamer core and its standard plugins contain almost no architecture-specific assembly or intrinsics of their own. The large majority of SIMD acceleration is delegated to [liborc](https://gitlab.freedesktop.org/gstreamer/orc) (Oil Runtime Compiler), a portable JIT SIMD compiler. This means a RISC-V gap in ORC is a gap for most of GStreamer's DSP path, but it also means the core framework compiles cleanly on any architecture GCC or Clang supports. As of 2026, one plugin (the audio resampler in gst-plugins-base) additionally carries hand-written RVV intrinsics of its own, independent of ORC.

## 2. Port History and Upstreaming Timeline

gitlab.freedesktop.org is protected by Anubis bot-challenge; all direct fetch attempts to issue/MR pages and REST/GraphQL API endpoints returned Access Denied (error code `9e4edb5b6b850c41`) on every attempt across this research cycle. The timeline below is built from the read-only GitHub mirrors' commit history (each commit's `Part-of:` trailer is authoritative GitLab merge data), release-note files, and distro changelogs.

| Date | Event | Source |
|---|---|---|
| 2018-04-15 | First RISC-V-aware commit: sets `GST_HAVE_UNALIGNED_ACCESS` to 0 for RISC-V in `gstconfig.h.in` (RISC-V allows unaligned access only slowly/unreliably depending on implementation). Author: Aurelien Jarno. | GitLab commit `8a156d1725ec...` |
| Pre-2024 | GStreamer core and plugins build on riscv64 as generic portable C; Debian and Alpine package riscv64 builds with no architecture-specific work. | Debian tracker, Alpine pkgs |
| 2024-2025 | Samsung engineers (Maksymilian Knust, Filip Wasil) develop the ORC RISC-V Vector (RVV) backend. Copyright header: "2024-2025 Samsung Electronics." | `orcriscv.c` source header |
| 2025-05-09 to 2025-06-27 | 15 commits authored, implementing the full RVV code-generation backend: target registration, scalar/vector instruction emission, machine-code generation, label/fixup handling, accumulators, loop emission, load/store rules, function prologue/epilogue, opcode table, floating-point rules, and a testsuite. | [orc !236](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/236) |
| 2025-07-14 | orc !236 merged. This is the load-bearing foundational MR; every later RVV feature in the ecosystem depends on it. Presented as a RISC-V Europe Summit 2025 poster, "Enabling RISC-V CI in Open-Source Projects: Challenges and Solutions" (P. Pikula et al.). | [orc !236](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/236), [RISC-V Summit Europe 2025 poster](https://riscv-europe.org/summit/2025/media/proceedings/2025-05-15-RISC-V-Summit-Europe-P2.3.02-PIKULA-poster.pdf) |
| 2025-08-25 to 2025-09-19 | orc !249 (register allocation, LMUL>1 handling) and !254 (12-commit optimization cluster: cmp/swap/splat/signX rules, div255w, convlf/convfl, abs-via-vrsub, function epilogue fix), by Maksymilian Knust. | [orc !249](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/249), [orc !254](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/254) |
| 2026-01-08 | ORC 0.4.42 released: "Initial 64-bit RISC-V support." | gstreamer.freedesktop.org release notes |
| 2026-02-20 | cerbero !1739 merged ("Add RISC-V 64 support for Android builds"), authored by Mao Han (Alibaba), merged by Nirbheek Chauhan (Centricular). Adds NDK r27c riscv64 config (`cross-android-riscv64.cbc`), riscv64 fixes in libass/libffi/opencore-amr/openssl/opus, and a manual-only CI job because of "approximately zero demand." | [cerbero !1739](https://gitlab.freedesktop.org/gstreamer/cerbero/-/merge_requests/1739) |
| 2026-03-22 | GStreamer 1.29.1 release notes record cerbero gaining Android riscv64 support (build toolchain only). | GStreamer release notes |
| 2026-04-14 to 2026-07-21 | 18 further ORC RVV MRs land (!279, !281-283, !288-289, !291-292, !294, !297-299, !303-306, !308-309): a NULL-pointer crash fix in extension detection, non-Linux build fixes, `__riscv_hwprobe()`/`getauxval()` detection-path rework, missing `normalize_result` fixes in addF/subF, a buffer-overrun fix in `convsusN` (vsetvli VL corruption), a narrowing-conversion correctness fix (`convdl`, vfncvt.rtz), and gather-load rules for image resampling. Authors mainly Felix-Gong (ISCAS) and Brad Smith. | [orc merge requests](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/249) |
| 2026-06-27 | gstreamer !11773 merged: `HAVE_CPU_RISCV32`/`HAVE_CPU_RISCV64` host_defines plus riscv64 ABI struct definitions generated on real rv64imafdcv hardware. Author: Felix-Gong. | [gstreamer !11773](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11773) |
| 2026-06-28 | gstreamer !11768 merged: `gst_cpuid_supports_riscv_v()` using `getauxval(AT_HWCAP)`, GStreamer-core-level RVV detection API mirroring the existing x86/ARM cpuid functions. Lands for GStreamer 1.30. Author: Felix-Gong. | [gstreamer !11768](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11768) |
| 2026-07-09 to 2026-07-31 | gstreamer-rs !2018 and !2028 merged, exposing `cpuid_supports_riscv_v()` through the Rust bindings and fixing its version-feature-flag gating. | [gstreamer-rs !2018](https://gitlab.freedesktop.org/gstreamer/gstreamer-rs/-/merge_requests/2018), [!2028](https://gitlab.freedesktop.org/gstreamer/gstreamer-rs/-/merge_requests/2028) |
| 2026-07-10 | gstreamer !11966 merged: the first RVV-accelerated GStreamer element, RVV intrinsics for the audio resampler's inner_product/interpolate kernels (gint16/gint32/gfloat), depending on !11768, tested on SOPHGO SG2044 (rv64gcv) with a full checksuite pass. Author: Felix-Gong. | [gstreamer !11966](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11966) |
| 2026-08-18 | gstreamer !12311 merged: fixes a macOS-hosted prebuilt-bison checksum-lookup bug that assumed host CPU family equals build CPU family, surfaced specifically by Android riscv64 cross-compiles. Author: Dominique Leroux. | [gstreamer !12311](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/12311) |
| 2026-09-07 | Latest stable GStreamer tag, 1.28.7. Latest stable ORC tag, 0.4.44 (2026-09-09). | GitLab tags API |

**Fully upstream?** Yes for everything cited above. All landed ORC and GStreamer-core RISC-V changes are in the canonical upstream repositories, not out-of-tree or distro-only patches. No RISC-V-specific patch was found carried only by a downstream distro.

## 3. Upstream Support Tier

GStreamer has no published platform-tier policy of any kind (no Rust-style tier 1/2/3).

**CI evidence (what upstream actually tests, confirmed by reading the live files):** the monorepo `.gitlab-ci.yml` defines jobs only for amd64 Fedora/Debian (native), Windows x64/x86/arm64-cross (MSVC), and macOS arm64 (native). A repo-wide search of every `.yml` file in `gstreamer/gstreamer` for the string "riscv" returns zero matches. There is no riscv64 native runner, QEMU job, or cross-compile job anywhere in GStreamer's own CI.

**Release-blocking:** riscv64 is not release-blocking for GStreamer. The GitLab Releases API for `gstreamer/gstreamer` returns an empty list (`[]`): GStreamer does not publish GitLab binary release artifacts for any architecture. Official downloads (gstreamer.freedesktop.org) cover Windows, macOS, Android and iOS only; there is no Linux binary of any architecture distributed by the project itself.

**Cerbero (GStreamer's cross-build/packaging tool):** platform configs cover Android (arm64, armv7, x86, x86_64), macOS/iOS (arm64, x86_64), Windows (x86, x86_64, arm64). `cross-android-riscv64.cbc` was added for Android riscv64 only, is Rust-disabled (`norust`, because Android riscv64 is Rust tier-3 with no downloadable toolchain), and its CI jobs are manual-only, citing near-zero demand. No Linux riscv64 cerbero config exists.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI (GStreamer core) | Yes, blocking | Yes, blocking (Windows arm64-cross manual) | No |
| CI (ORC, the SIMD dependency) | Yes, blocking | Yes, blocking | One job exists, manual/scheduled-trigger only, not run on ordinary MRs |
| Official binary releases | No (source only) | No (source only) | No |
| Release-blocking | Yes | Partial | No |
| Formal tier name | Not published | Not published | Not published |
| ORC SIMD acceleration | SSE/AVX/AVX-512 | NEON/AArch64 | RVV, real backend, unstable API |

## 4. Technical Architecture and RISC-V-Specific Subsystems

GStreamer core and its standard plugins carry almost no architecture-specific code of their own; nearly all SIMD acceleration is delegated to ORC. The analysis below was produced by cloning and reading the actual source of both `GStreamer/orc` and `GStreamer/gstreamer` (mirrors), not by reading commit metadata alone.

### 4.1 ORC RISC-V Vector backend (`orc/riscv/`)

A complete, hand-tuned RVV code generator, structurally equivalent to ORC's x86/ARM-NEON/MIPS/PowerPC backends: 8 files, approximately 4,779 lines, authored 2024-2025 by Samsung Electronics and substantially extended through mid-2026 by ISCAS (Felix-Gong) and Brad Smith.

- `orcriscvinsn.c` (1,606 lines): a real RVV instruction encoder, bit-packing raw machine code (e.g. `OP_VECTOR = 0b1010111`), not a wrapper around a compiler's own intrinsics.
- `orcriscvrules.c` (1,698 lines): registers 195 opcode rules mapping ORC's portable IR to RVV instruction sequences, covering load/store in all widths, integer arithmetic (add/sub/mul/div/abs/avg/sign/accumulate), bitwise/shift, pack/unpack/merge/split/select/splat, narrowing/widening/saturating conversions, gather loads for image resampling (`ldresnearl`/`ldreslinl`, added 2026-07-21, tested 1061/1061 on SOPHGO SG2044, VLEN=128), and full float/double arithmetic. For comparison, ARM NEON's single rule file registers 62 rules, so RISC-V's coverage is broad, not partial.
- `orcriscvtarget.c` (approximately 308 lines): four-layer CPU feature detection, in priority order: `elf_aux_info()` (BSD), `__riscv_hwprobe()` (Linux, kernel >= 6.4), `getauxval(AT_HWCAP)` plus `/proc/cpuinfo`, and `/proc/cpuinfo` string parsing alone. Detects the `V`, `Zvbb`, `Zvkb`, `Zvkn` and `Zvks` extensions, though `Zvkn`/`Zvks` detection is incomplete in the hwprobe path.
- Build wiring treats `riscv` identically to `mips`/`aarch64`: `cpu_family.startswith('riscv')` triggers `HAVE_RISCV`, not an opt-in experimental flag. RV32 is explicitly unsupported (FIXME in `orcriscvcompiler.c`). All public RISC-V API is gated behind `ORC_ENABLE_UNSTABLE_API`.
- Real bugs have been found and fixed in production use: a NULL-pointer crash in `strsep`/`strcmp` when parsing cpuinfo extension strings on older devicetrees/kernels or pre-7.1.0 QEMU ([orc !279](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/279)), and a genuine out-of-bounds write: the `convsusN` rule's `vsetvli` used `rs1=x0`, resetting vector length to VLMAX and corrupting memory past the intended buffer on a loop's tail ([orc !306](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/306), fixed 2026-06-25).

Because dozens of GStreamer elements (videoconvert, audioconvert, volume, compositor, videoscale) generate their inner loops through ORC, this single backend gives broad RVV acceleration across the codebase whenever its rules fire, without per-plugin work.

### 4.2 GStreamer core CPU-feature API (`gstcpuid.c`)

`gst_cpuid_supports_riscv_v()` (merged as [!11768](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11768), lands in 1.30) is real and wired into the same dispatch pattern as x86/ARM detection, but checks only the single `V` extension via `getauxval(AT_HWCAP)`, is Linux-only, and does no finer-grained extension or VLEN probing. ARM's equivalent detection is multi-OS and more thorough. Rated partial: functional, but thin.

### 4.3 gst-plugins-base audio-resampler RVV kernels

`audio-resampler-rvv.c` (merged as [!11966](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11966)) is genuine hand-written C code using `<riscv_vector.h>` intrinsics across 9 type/mode combinations (gint16/gint32/gfloat x full/linear/cubic, 15 functions total), gated behind a Meson `cc.compiles()` RVV capability probe with scalar-C fallback, and correctly dispatched at runtime via `gst_cpuid_supports_riscv_v()`, replacing function pointers the same way the SSE/NEON paths do. Validated on real SOPHGO SG2044 (rv64gcv) hardware with full checksuite passes (audioresample 11/11, libs_audio 32/32, audioconvert 18/18, audiotestsrc 2/2). Rated partial only because it is scoped to one plugin rather than a full SIMD library, not because it is a stub. No other plugin outside ORC's coverage carries its own RVV intrinsics.

### 4.4 ABI and alignment plumbing

`subprojects/gstreamer/tests/check/gst/struct_riscv64.h` and the equivalent `libs/` file hold riscv64 ABI struct sizes, generated on real rv64imafdcv hardware and merged as part of [!11773](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11773). `gstconfig.h.in` lists `__riscv` among architectures where `GST_HAVE_UNALIGNED_ACCESS` is defined 0 (unaligned access assumed slow/unsafe, consistent with ARM/MIPS/SPARC).

### 4.5 Comparison Table per Component

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| ORC JIT backend | SSE/AVX/AVX-512, mature | NEON/AArch64, mature | RVV 1.0, real backend, 195 opcode rules, unstable API |
| ORC CPU detection | CPUID instruction | getauxval/HWCAP | hwprobe + getauxval + cpuinfo, 4-path fallback |
| ORC API stability | Stable | Stable | Unstable (`ORC_ENABLE_UNSTABLE_API`) |
| GStreamer core CPU detection | CPUID in gstcpuid.c | NEON in gstcpuid.c | `gst_cpuid_supports_riscv_v()`, merged, lands 1.30, Linux-only, V extension only |
| GStreamer ABI test defines | HAVE_CPU_X86_64 | HAVE_CPU_AARCH64 | HAVE_CPU_RISCV64, merged |
| Plugin-level RVV intrinsics | N/A | N/A | audio resampler only (gst-plugins-base), real intrinsics |
| Video scaler / audio conversion (plugins-base) | ORC-accelerated | ORC-accelerated | ORC-accelerated when RVV rules fire, else scalar C |
| Compositor | ORC-accelerated | ORC-accelerated | ORC-accelerated when RVV rules fire, else scalar C |

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Meson only, minimum version 1.4 (`meson_version : '>= 1.4'` in the live top-level `meson.build`). No CMake, no autotools, no `CMakeLists.txt` anywhere in the tree.

**Language standard:** the top-level `meson.build` sets `cpp_std=c++14` in `default_options`, but does **not** set a `c_std` at top level; the C standard follows whatever the compiler's own default is (gnu17 on modern GCC/Clang). No minimum GCC or Clang version is enforced anywhere in the build; the only version gate in the file is Apple-Clang/Xcode-specific ("Xcode >= 26.0 requires meson >= 1.8.3") and is irrelevant to riscv64/Linux. The practical floor is therefore whatever the target distro's Meson >= 1.4 pulls in (e.g. Debian sid ships GCC 14/Clang 19, Fedora 43 ships GCC 15/Clang 20), not a project-mandated minimum.

**Cross-compilation files in repo:** none for riscv64. The only cross files present are `ci/meson/vs2022-arm64-cross.ini` and `ci/meson/vs2022-x64-native.ini`, both Windows MSVC. A riscv64 Linux cross file must be authored manually, e.g.:

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

```bash
meson setup builddir --cross-file riscv64-linux-gnu.ini \
  -Dauto_features=disabled -Ddoc=disabled -Dintrospection=disabled -Dtests=disabled
meson compile -C builddir
```

Native build on riscv64 hardware: `meson setup builddir && meson compile -C builddir`.

**Known -D flags relevant to riscv64:**

| Flag | Reason |
|---|---|
| `-Ddoc=disabled` | docs auto-disabled on cross builds |
| `-Dintrospection=disabled` | GObject Introspection may be unavailable or broken on some riscv64 distro toolchains |
| `-Dgst-plugins-bad:intel-media-sdk=disabled` | x86-only |
| `-Dgst-plugins-bad:va=disabled` | no riscv64 VA-API drivers |
| `-Dorc=disabled` | escape hatch if the unstable ORC RVV backend misbehaves |
| `-Dauto_features=disabled` | safe starting point for cross-compilation |

**QEMU:** GStreamer's own `ci/scripts/build-linux.sh` builds x86 KVM-guest kernels for `virtme` VM testing and contains a generic `s/riscv.*/riscv/` architecture-name-normalization line, but since no riscv64 CI runner or job is provisioned anywhere in `.gitlab-ci.yml`, that line never executes on a riscv64 path in practice. `ci/docker/fedora/install-deps.sh` strips `qemu` debug symbols from its install list, confirming QEMU is present in the CI image only as an incidental Fedora package, not as riscv64 build/test tooling. For local testing, `qemu-riscv64-static` user-mode emulation via `binfmt_misc` works against Debian/Alpine riscv64 sysroots; no GStreamer-specific QEMU configuration exists.

**Known build failures:**

- [gstreamer !11784](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11784) (merged, backported to 1.28): fixed a Meson `full_path()` error building on Alpine riscv64 with system GLib but GObject-Introspection built from source.
- Alpine `aports` issue [#18343](https://gitlab.alpinelinux.org/alpine/aports/-/issues/18343): the `orcc` bytecode compiler segfaults (signal 11) generating `videomixerorc.h`/`.c` on riscv64 (`ninja: job terminated due to signal 11: orcc --include glib.h --header -o gst/videomixer/videomixerorc.h ...`). Alpine disabled `gst-plugins-good` and `gst-plugins-bad` on riscv64 to unblock the builder. Filed 2026-07-18, closed 2026-07-21; the root-cause fix (believed to be in ORC's riscv64 codegen) was not independently confirmed in public notes, since comments required authentication to read.
- Arch Linux RISC-V: contradictory data points exist. Direct repository listing of `archriscv.felixc.at/repo/extra/` today shows `gstreamer-1.28.7-2-riscv64.pkg.tar.zst`, `gstreamer-docs-1.28.7-2-riscv64.pkg.tar.zst`, and roughly 80 further `gst-plugins-*`/`gst-plugin-*` riscv64 packages currently built and available, including `gst-plugin-skia-0.15.4-1-riscv64.pkg.tar.zst`. A separate, earlier data point held that a `riscv64.patch` failed to apply (hunk #3 failing at line 243) with a missing `svt-hevc` dependency, making the package uninstallable from source. The current repository listing, directly fetched, is the more recent and more authoritative signal and indicates the build is presently succeeding; the discrepancy is noted here rather than resolved, since the intermediate fix was not independently traced. [NEEDS VERIFICATION]
- The informal claim that `gst-plugins-rs`'s bundled Skia build (`fetch-gn`) still lacks riscv64 support does not hold up against the same repository listing: `gst-plugin-skia` is built and shipping for riscv64 in Arch's `extra` repo as of this check.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional Gaps

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Core pipeline features (decode, encode, mux, RTP, etc.) | Yes | Yes | Yes | Portable C; no functional gaps in the framework itself |
| GObject Introspection (language bindings) | Yes | Yes | Partial | Build workaround merged (!11784); distro support varies |
| Hardware video decode via VA-API | Yes | No | No | No riscv64 VA-API drivers |
| Hardware video decode via NVDEC/NVENC | Yes | Yes (Jetson) | No | No riscv64 NVIDIA driver stack |
| Hardware video decode via V4L2 | Yes | Yes | Yes (on capable hardware) | V4L2 is kernel-level, portable |
| RTP/RTSP streaming, WebRTC | Yes | Yes | Yes, functional | No SIMD acceleration path for WebRTC-adjacent codecs on riscv64 |
| Android riscv64 (cerbero) | Yes | Yes | Partial | `cross-android-riscv64.cbc` added, Rust disabled (tier-3 toolchain), manual-only CI |

### Performance Gaps (SIMD)

| Operation | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Video color-space conversion, audio format conversion, compositing (via ORC) | SSE/AVX | NEON | RVV when the ORC backend's rules fire and hardware has V extension; scalar C otherwise |
| Audio resampling (gst-plugins-base, own intrinsics) | SSE/AVX | NEON | RVV intrinsics, merged, validated on SOPHGO SG2044 |
| H.264 decode (via gst-libav/FFmpeg) | Optimized | NEON-optimized | RVV-optimized in FFmpeg (see Section 9 deep dive) |
| AV1 decode (via dav1d) | Optimized | NEON-optimized | RVV-optimized since dav1d 1.4.0 |
| VP8/VP9 decode (libvpx), Opus (libopus), H.264/HEVC encode (x264/x265) | SIMD | SIMD | No riscv64 SIMD in any of these four; scalar C fallback only |

No GStreamer-pipeline-level benchmark numbers (fps, latency, CPU time) comparing riscv64 to arm64/amd64 were found in any public source, including GStreamer Discourse, the RISE blog, RVspace forum, and GitHub/GitLab search. The closest available data point is ORC-specific: a Samsung poster at RISC-V Summit Europe 2025 reports 82.00% test coverage for the RVV backend and a CI job matrix of `bld:linux-riscv64` (2 jobs) and `test:linux-riscv64` (10 jobs, versus 6 for amd64 and 2 for arm64, driven by multiple vector register lengths/VLEN needing separate configurations); it notes dual-toolchain (GNU and LLVM) testing "uncovered several previously unreported bugs" without itemizing them. This is ORC-only, not a GStreamer pipeline benchmark. An adjacent, non-GStreamer data point for context: SiFive's `ffmpeg-rvv` project reports more than 2x average FPS improvement on 720p H.264 decode using RVV intrinsics versus scalar FFmpeg ([sifive/ffmpeg-rvv](https://github.com/sifive/ffmpeg-rvv)).

### Security Hardening Gaps

Data not available: any published analysis of security-hardening feature-coverage differences between riscv64 and other architectures for GStreamer. One active, tracked vulnerability affects plugins being packaged for riscv64 but is not riscv64-specific: CVE-2025-6663, an integer overflow parsing `subpic_level_info` in the H.266/VVC parser, fixed in Debian `gst-plugins-bad` 1.26.2-3 ([osv.dev/vulnerability/CVE-2025-6663](https://osv.dev/vulnerability/CVE-2025-6663)).

### Floating-Point / Numeric Semantics

GStreamer relies on standard IEEE 754 via GLib and the C compiler; no riscv64-specific floating-point deviations are documented at the framework level. Within ORC's RVV backend specifically, two concrete numeric bugs were found and fixed: missing `normalize_result` calls in the `addF`/`subF` float rules ([orc !297](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/297), [!298](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/298), merged May 2026), and a narrowing-conversion bug in `convdl` that used the wrong rounding mode until switched to truncation (`vfncvt.rtz`) ([orc !308](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/308), merged 2026-07-12), which had been silently producing wrong results.

## 7. CI/CD Infrastructure

Direct, live reads of `.gitlab-ci.yml`, `ci/docker/*`, `ci/gitlab/*`, `ci/scripts/*`, and `ci/meson/*.ini` in `gstreamer/gstreamer` were performed via the GitHub mirror (gitlab.freedesktop.org itself is Anubis-blocked for automated access).

**GStreamer core (`gstreamer/gstreamer`):** zero riscv64 CI of any kind. A repo-wide search of every `.yml` file for "riscv" returns 0 results. Defined jobs cover only amd64 Fedora/Debian (native), Windows (MSVC x64/x86/arm64-cross, msys2), and macOS arm64. No riscv64 Dockerfile, image directory, runner tag, or QEMU job exists.

**ORC (`gstreamer/orc`), a dependency library rather than GStreamer core itself:** contains one real, non-hidden riscv64 job:

```yaml
alpine 3.23 riscv64:
  stage: build
  image: alpine:3.23
  needs: ["trigger"]
  tags: ['orc-alpine-riscv64']
  script:
    - meson setup / compile / test / orc-bugreport / install
```

This job genuinely builds and tests ORC via `meson test`, it is not a source-detection shim. However it `needs` a `trigger` job whose rules make it `when: manual` for an ordinary contributor push or merge request; it runs unattended only on scheduled pipelines or bot-merged MRs against the upstream branch. This corrects an earlier characterization that no riscv64 job exists at all for ORC: one exists, but it is gated, not automatic.

**Cerbero (`gstreamer/cerbero`), the packaging/cross-build tool:** two riscv64 jobs, `cerbero deps cross-android riscv64` and `build cerbero cross-android riscv64`, both explicitly `when: manual`. Both cross-compile for Android riscv64 only; neither executes or tests the resulting binaries, and neither runs automatically.

**RISE runners:** not used anywhere in this picture. No GStreamer, ORC, or cerbero CI job is tied to RISE's runner program; RISE has no involvement with GStreamer at all (see Section 12).

**Downstream regression gate:** the only riscv64 regression detection in practice comes from distro infrastructure outside GStreamer's control, and it is itself incomplete: Debian disabled the `gst-plugins-bad1.0` riscv64 autopkgtest after a longer timeout still proved insufficient (v1.26.6-5, 2025-10-09), rather than fixing the underlying slowness, and Alpine disabled `gst-plugins-good`/`gst-plugins-bad` on riscv64 after the `orcc` JIT segfault (aports #18343).

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GStreamer core native runner | Yes | Partial (macOS arm64) | No |
| GStreamer core CI job of any kind | Yes | Yes | No |
| ORC CI job | Yes | Yes | Yes, manual/scheduled-trigger gated |
| Cerbero CI job | Yes | Yes | Yes, manual-only, Android cross-compile, no test execution |
| Distro autopkgtest/buildtest coverage | Full | Full | Partial; disabled for gst-plugins-bad on both Debian (timeout) and Alpine (orcc crash) |

## 8. Distribution and Release Status

**Official upstream binaries:** none for any Linux architecture. GStreamer's download page ships Windows, macOS, Android and iOS binaries only. The GitLab Releases API for `gstreamer/gstreamer` returns an empty array; GStreamer does not use GitLab's release-artifact feature at all. The project instead publishes source tags: latest stable 1.28.7 (2026-09-07), with 1.28.6 before it, and a development snapshot 1.29.2 (2026-06-28) targeting the unreleased 1.30. Linux consumers have always depended on distribution packages, and riscv64 availability is therefore a distro-packaging question, not an upstream-release question.

**Distribution package status:**

| Distribution | Version | riscv64 Status | Notes |
|---|---|---|---|
| Ubuntu 26.04 "resolute" | 1.28.2-1 (base), some plugins patched further | Yes, for nearly all `gstreamer1.0-*` packages | 32 matching packages confirmed by direct fetch of packages.ubuntu.com; riscv64 is built for `gstreamer1.0-tools`, `-plugins-base`, `-good`, `-bad`, `-bad-apps`, `-extra`, `-ugly`, `-libav`, `-nice`, `-vaapi`, `-rtsp`, `-gl`, `-gtk3`/`-gtk4`, `-qt5`/`-qt6`, `-pipewire`, `-fdkaac`, and more. Riscv64 builds mostly from the "ports" pocket alongside armhf/ppc64el/s390x, while amd64/arm64/i386 build from "security"; some packages (e.g. `gstreamer1.0-alsa`) have a newer security-updated build for primary architectures (1.28.2-1ubuntu0.1) while riscv64 remains on the older ports-pocket build (1.28.2-1), a patch-level lag, not a missing package. |
| Debian sid/testing/experimental | 1.28.4-2 / 1.28.3-1 / 1.29.1-1 | Yes | `arch: any`; built on `rv-manda-03` buildd |
| Alpine Linux edge | 1.28.3-r0 (core), but `gst-plugins-good`/`gst-plugins-bad` disabled | Partial | Core package available; good/bad plugin sets disabled on riscv64 due to the `orcc` JIT segfault (aports #18343) |
| Fedora | 1.26.11 | No | Koji build arches: i386/aarch64/ppc64le/x86_64/s390x only; riscv64 absent |
| Arch Linux RISC-V | 1.28.7-2 | Yes, per current repo listing | `archriscv.felixc.at/repo/extra/` lists built `gstreamer` and roughly 80 `gst-plugins-*` riscv64 packages today, including `gst-plugin-skia`; this contradicts an earlier note of an FTBFS patch failure and missing `svt-hevc` dependency, which was not re-confirmed on this pass [NEEDS VERIFICATION] |
| Gentoo | 1.26.11 | Partial | `~riscv` keyword, testing only, not stabilized [NEEDS VERIFICATION, not re-checked this cycle] |
| openSUSE Tumbleweed | 1.26.3 | Yes | riscv64 port build listed (rpmfind) |

**What a user must do to get a working binary:** on Ubuntu, Debian, Arch RISC-V, or openSUSE Tumbleweed, install via the distro package manager; no source build required. On Alpine, `gstreamer1.0-tools` and core are available, but `gst-plugins-good`/`gst-plugins-bad` must be built from source or accepted as unavailable until the Alpine-side fix is independently confirmed. On Fedora, GStreamer for riscv64 is not packaged at all; users must build from source with a riscv64 cross file or natively on riscv64 hardware.

**PyPI / npm / Maven / OCI containers:** not applicable. `https://pypi.org/pypi/gstreamer/json` returns HTTP 404; no PyPI package literally named `gstreamer` exists (Python bindings ship via system PyGObject/`gst-python`, not a pip wheel). The RISE wheel-builder endpoint for `gstreamer` redirects (302) to the same non-existent PyPI project. No GStreamer OCI container image for riscv64 is published by the upstream project.

## 9. Dependencies

### Summary Table

| Dependency | Role | Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|---|---|---|---|---|---|---|
| GLib | runtime-dependency | critical | Yes | No dedicated CI | Packaged universally | No riscv64-specific code in GLib itself |
| liborc | runtime-dependency | critical | Yes (0.4.42+, Alpine, Debian sid 1:0.4.42-3) | One manual/scheduled-gated riscv64 CI job (`alpine 3.23 riscv64`); not run on ordinary MRs | Released in 0.4.42 (Jan 2026), current 0.4.44 (Sep 2026) | See deep dive below; the single highest-leverage riscv64 performance dependency |
| Meson | build-dependency | critical | Yes | N/A (Python, portable) | Packaged universally | No riscv64-specific issues found; top-level `meson.build` requires >= 1.4 |
| GNU bison | build-dependency | critical | Yes | N/A | Packaged universally | A macOS-hosted prebuilt-bison checksum-key lookup bug assumed host CPU family equals build CPU family; broke specifically when cross-compiling for Android riscv64, fixed in [gstreamer !12311](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/12311) |
| Flex | build-dependency | critical | Yes | N/A | Packaged universally | No riscv64-specific issues found |
| Check | test-dependency | critical | Yes | N/A | Packaged universally | No riscv64-specific issues found; standard portable C unit-test library |
| GObject Introspection | build-dependency | optional | Yes, with caveat | Unknown | Packaged | Meson `full_path()` build error on Alpine riscv64 when system GLib is paired with source-built G-I, fixed by [gstreamer !11784](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11784), backported to 1.28 |
| FFmpeg (libav*) | runtime-dependency | optional | Yes (Alpine 8.1.1) | QEMU riscv64 CI reported unmerged as of Mar 2026 [NEEDS VERIFICATION, not re-checked this cycle] | Packaged | Named upstream RISC-V maintainer, 219+ riscv64 patches, strong RVV coverage across H.264/VP8/VP9/HEVC/AAC/FLAC/Opus/Vorbis/swscale; see `project-reports/ffmpeg.md` |
| OpenSSL | runtime-dependency | optional | Yes | Yes (QEMU cross-compile CI) | Released since 3.0.3 (2022) | First-class riscv64 support; see `project-reports/openssl.md` |
| GnuTLS | runtime-dependency | optional | Yes (Alpine 3.8.13) | Unknown | Packaged | Depends on nettle; no known riscv64 issues |
| dav1d | runtime-dependency | optional | Yes (Alpine 1.5.3) | Yes, RVV CI added (MR !1608, Feb 2024) | Released since 1.4.0 | RVV-accelerated, strong trajectory; see `project-reports/dav1d.md` |
| zlib | runtime-dependency | optional | Yes | Partial (OpenBSD CI, Jan 2026) | Packaged | No riscv64 SIMD; pure-C fallback |
| zlib-ng | runtime-dependency | optional | Yes | Cross-compile CI exists | Packaged | SiFive/Icenowy RVV work in progress for adler32/slide_hash |
| libopus | runtime-dependency | optional | Yes (Alpine 1.6.1) | None | Packaged | No riscv64 SIMD; a prior riscv64-SIMD PR was abandoned; C fallback only |
| libvpx | runtime-dependency | optional | Yes (Alpine 1.15.2) | Unknown | Packaged | No riscv64 entry in `configure`'s ARCH_EXT_LIST; C fallback only |
| libx264 | runtime-dependency | optional | Yes (Alpine 0.164.3108) | Unknown | Packaged | No riscv64 assembly; C fallback only |
| libx265 | runtime-dependency | optional | Yes (Alpine 4.1) | Unknown | Packaged | No riscv64 SIMD; C fallback only |
| libvorbis / libogg | runtime-dependency (indirect) | optional | Yes | Unknown | Packaged | Pure C; no architecture risk |
| libdrm | runtime-dependency (indirect, hardware decode) | optional | Yes | Unknown | Packaged | Portable IOCTL layer; no architecture-specific code |
| gst-plugins-rs | runtime-dependency (indirect, Rust plugins: dav1d/rav1e/rspng bindings) | optional | Yes (Alpine 0.15.2) | None | Packaged | Rust riscv64 is tier 2 on Linux (tier 3 on Android, per cerbero !1739); underlying dav1d/rav1e carry their own riscv64 optimizations |

### Deep Dive: liborc (ORC)

ORC is the most important dependency for riscv64 performance and the single highest-leverage investment area (see Section 4.1 for architectural detail). Version shipped in Alpine edge and Debian sid is 0.4.42+ (current upstream stable is 0.4.44, 2026-09-09). Strengths: complete RV64I scalar encoding, broad RVV 1.0 opcode coverage (195 rules), four-path CPU detection spanning Linux and BSD, active maintainer engagement (over 20 merged riscv64 MRs from April to July 2026 alone). Weaknesses: RV32 explicitly unsupported, entire API gated behind `ORC_ENABLE_UNSTABLE_API`, `Zvkn`/`Zvks` detection incomplete in the hwprobe path, and only one riscv64 CI job exists project-wide, gated behind manual/scheduled triggering rather than run on every MR. Two real memory-safety/correctness bugs (a NULL-deref crash and a buffer-overrun) were found and fixed in this backend within the past six months, underscoring the value of moving its CI from manual to automatic.

### Deep Dive: FFmpeg (via gst-libav)

FFmpeg has a named RISC-V maintainer and 219+ riscv64 patches, with RVV-optimized implementations across most major codecs. `gst-libav` passes all decode/encode through FFmpeg's codec layer, so riscv64 quality in `gst-libav` tracks FFmpeg's own trajectory directly rather than any GStreamer-specific work. Full detail in `project-reports/ffmpeg.md`.

### Codec SIMD Gap Summary

Four dependencies, x264, x265, libvpx (encode path), and libopus, have no riscv64 SIMD of any kind; all fall back to scalar C. For a GStreamer-based media-server workload requiring high-throughput VP9/H.265 encode or Opus transcode on riscv64, throughput will be materially below arm64 and amd64 until one of those upstream projects gains riscv64 SIMD, which is outside GStreamer's or ORC's control.

## 11. Known Bugs and Active Issues

**Correctness and memory-safety bugs (riscv64-specific):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Alpine aports #18343](https://gitlab.alpinelinux.org/alpine/aports/-/issues/18343) | `orcc` JIT segfaults generating `videomixerorc` on riscv64 | Closed 2026-07-21 (opened 2026-07-18) | High (build-blocking) | Signal 11 in `orcc --header`/`--implementation`; forced Alpine to disable `gst-plugins-good`/`gst-plugins-bad` on riscv64; root-cause fix not independently confirmed in public notes |
| [orc !306](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/306) | `convsusN` rule's `vsetvli` resets VL to VLMAX, causing an out-of-bounds write past the intended buffer | Fixed, merged 2026-06-25 | High (memory corruption) | The most safety-critical bug found in the RVV backend to date |
| [orc !279](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/279) | NULL-pointer crash in cpuinfo extension detection on platforms with no multi-character extension string (older devicetrees/kernels, pre-7.1.0 QEMU) | Fixed, merged 2026-04-14 | Medium (crash on specific platforms) | |
| [orc !308](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/308) | `convdl` narrowing conversion used the wrong rounding mode, producing wrong results | Fixed, merged 2026-07-12 | Medium (silent wrong output) | Switched to truncation (`vfncvt.rtz`) |
| [#3433 (GStreamer work item)](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/work_items/3433) | `gst-libav: test_videoenc_drain` fails on riscv64, SIGILL on real Alpine hardware, gst-libav 1.22.11 | Closed Mar 2024 | Medium | Root cause traced to the FFmpeg codec path executing an unsupported instruction; resolved upstream or in the FFmpeg dependency |
| [#4856 (GStreamer work item)](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/work_items/4856) | `libs_gstharness.test` intermittently times out on `qemuriscv5` | Open (Jan 2026) | Low (test infrastructure) | Intermittent, hypothesized as slow-QEMU-triggered pre-existing race; no response or patch |

**Packaging and build issues:**

| ID | Title | Status | Notes |
|---|---|---|---|
| Debian `gst-plugins-bad1.0` riscv64 autopkgtest | Test too slow, times out | Disabled, not fixed | v1.26.6-4 increased the timeout (2025-10-08); v1.26.6-5 reverted that and simply stopped running the autopkgtest on riscv64 (2025-10-09), because a longer timeout was still insufficient |
| [Debian Bug#1109780](https://www.mail-archive.com/debian-bugs-dist@lists.debian.org/msg2046937.html) | `gst-plugins-bad1.0-contrib`: enable riscv64 build | Fixed | riscv64 had been excluded from the architecture list; fixed by switching to `Arch: any` in v1.28.0-1 (2026-02-24) |
| [Debian Bug#1114141](https://www.mail-archive.com/debian-bugs-dist@lists.debian.org/msg2061717.html) | `gst-plugins-bad1.0` FTBFS / test failure in `elements_curlhttpsrc` | Open | Triggered by curl 8.16; riscv64 noted among architectures with 2 test failures, not confirmed riscv64-exclusive |
| GStreamer-OMX on StarFive VisionFive 2 | Crash in `OMX_UseEGLImage()` (segfault in `gst_omx_port_allocate_buffers_unlocked`) | Root-caused, worked around | gst-omx 1.18.5; reproduced on both Yocto and Debian images; patched to stub the function as NotImplemented; the affected project subsequently moved off gst-omx to the v4l2-m2m driver for its Wave5 VPU |
| [CVE-2025-6663](https://osv.dev/vulnerability/CVE-2025-6663) | Integer overflow in H.266/VVC parser (`subpic_level_info`) | Fixed (Debian gst-plugins-bad 1.26.2-3) | Not riscv64-specific, listed because it is an active tracked vulnerability in a plugin set being packaged for riscv64 |

## 12. Objections and Upstream Blockers

**No stated organizational objections.** The Samsung ORC backend and the ISCAS follow-on work were both accepted without documented controversy; GStreamer's informal governance means there is no committee to lobby.

**Technical blockers for CI:** GStreamer's CI runs on self-hosted GitLab runners maintained by Centricular and Collabora. Adding riscv64 requires provisioning physical or cloud riscv64 machines and registering them with the freedesktop.org GitLab instance, a resource and infrastructure problem rather than a code problem. ORC already has a working riscv64 job (`alpine 3.23 riscv64`); the remaining work there is to make it run automatically on every MR instead of manual/scheduled-trigger only, and to add an equivalent job to the GStreamer core monorepo, which currently has none.

**Technical blocker for ORC stability:** the RVV backend must exit `ORC_ENABLE_UNSTABLE_API` gating before GStreamer distro packages can depend on it unconditionally. This requires ORC maintainers to review and declare the API stable; no timeline is published.

**Acceptance probability for well-formed contributions:** high. Every riscv64 MR found across ORC, GStreamer core, gstreamer-rs, and cerbero in this research (more than 30 merged MRs) was accepted without documented reviewer pushback.

**RISE involvement:** none, confirmed across every channel checked. The RISE blog (17 posts retrieved, spanning May 2025 through September 2026, including a site search for "GStreamer" that returned zero results) contains no GStreamer mention. GStreamer/freedesktop.org is not listed as a RISE member. The RISE Python wheel builder's 89-package list does not include GStreamer, PyGObject, or gst-python. The `riseproject-dev` GitHub org's repositories show zero GStreamer references in issues or PRs. The RISE Confluence wiki page on video/multimedia RVV requirements discusses x264 porting, not GStreamer. No RISE-funded RFP targets GStreamer; RISE's adjacent multimedia-related funded work is FFmpeg (H.264 decode optimization) and libjpeg-turbo (RVV port), neither of which covers GStreamer or its ORC SIMD layer. The GStreamer RVV port that exists was built by Samsung (foundational ORC backend) and ISCAS (refinement and the first RVV-accelerated element), independent of RISE. Neither Centricular nor Collabora appear in the RISE member list.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro
- GStreamer is a general-purpose multimedia pipeline framework, not a speed-differentiated library; the optimization-purpose modifier does not apply, and no optimization-level rating is assigned.
- **Justification:** No upstream riscv64 CI exists for GStreamer core: direct reads of `gstreamer/gstreamer`'s `.gitlab-ci.yml`, `ci/docker/*`, `ci/gitlab/*`, `ci/scripts/*`, and `ci/meson/*.ini` confirm no riscv64 build or test job, and the GitLab Releases API returns `[]`, meaning no upstream binary releases exist for any Linux architecture; only Windows/macOS/Android/iOS downloads are published. The distribution floor applies via [Ubuntu 26.04 "resolute"](https://packages.ubuntu.com/search?keywords=GStreamer&suite=resolute&searchon=names&section=all), which ships riscv64 for nearly all `gstreamer1.0-*` packages, but patch and build cleanliness is not uniform across distros: [Alpine aports #18343](https://gitlab.alpinelinux.org/alpine/aports/-/issues/18343) documents a genuine riscv64-specific `orcc` JIT segfault that forced Alpine to disable `gst-plugins-bad`/`good` on riscv64, and Debian disabled the `gst-plugins-bad1.0` riscv64 autopkgtest rather than fix its timeout. This mix of exclusions and workarounds, rather than a clean unmodified-source build, places GStreamer at orange/downstream-only rather than yellow.
- **Pending work that could change the grade:** real upstream RVV/riscv64 momentum exists that could raise this grade if it extends to CI: ORC's foundational RVV backend ([orc !236](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/236), merged 2025-07-14, in ORC 0.4.42+) plus roughly 20 follow-on refinement MRs through mid-2026; GStreamer core's `gst_cpuid_supports_riscv_v()` ([!11768](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11768)) and the first RVV-accelerated element, the audio resampler ([!11966](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11966), tested on SOPHGO SG2044, targeting the unreleased 1.30); ABI-test riscv64 struct definitions ([!11773](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11773)); and cerbero's manual-only Android riscv64 cross-build job ([!1739](https://gitlab.freedesktop.org/gstreamer/cerbero/-/merge_requests/1739)). None of this adds a riscv64 CI job to `gstreamer/gstreamer`'s or `gstreamer/orc`'s own `.gitlab-ci.yml` running by default, which remains the blocking gap for yellow or blue; ORC does have one riscv64 CI job, but it is manual/scheduled-trigger gated, not run on ordinary MRs. No RISE involvement was found across any channel checked. The Alpine `orcc` crash (#18343) is marked closed but its fix was not independently confirmed in public notes.

## 14. Investment Analysis

RISE has not funded GStreamer, ORC, or any adjacent component directly; its multimedia-adjacent funded work (FFmpeg H.264 decode, libjpeg-turbo RVV port) does not cover GStreamer or ORC, so nothing here is already RISE-funded. Samsung and ISCAS have, however, already delivered the foundational and follow-on RVV work described in Sections 2 and 4; the items below size only what remains open.

### 14.1 Functional Enablement

The functional detection and ABI plumbing work is done: `gst_cpuid_supports_riscv_v()` (!11768) and the riscv64 ABI struct definitions (!11773) are both merged, and the first RVV-accelerated element (audio resampler, !11966) has landed and targets the 1.30 release. No further functional-enablement investment is required for basic riscv64 support in GStreamer core. The remaining functional gap is encoder/codec SIMD (x264, x265, libvpx, libopus), which is entirely outside GStreamer's own repositories and depends on those upstreams independently gaining riscv64 contributors.

### 14.2 Performance Optimization

The ORC RVV backend remains the single highest-leverage performance investment: it accelerates most ORC-based DSP in gst-plugins-base (color conversion, audio mixing, compositing) across every GStreamer application without per-codec work, and it already exists and is actively maintained. The investment need is stabilization: promoting the backend out of `ORC_ENABLE_UNSTABLE_API`, completing `Zvkn`/`Zvks` detection in the hwprobe path, and continuing to harden the codegen rules, given that two real memory-safety/correctness bugs (!279, !306) have already been found and fixed in production use. Extending RVV intrinsics to additional plugins beyond the audio resampler (e.g. video scalers, compositors not fully covered by ORC) is a secondary, lower-leverage investment. Encoder SIMD (x264, x265, libvpx) is higher effort and lower leverage for a multimedia-framework evaluation specifically, since these are separate upstream projects with large existing codebases and no riscv64 SIMD contributors currently engaged there.

### 14.3 CI/CD Infrastructure

This is the single highest-priority gap. Concretely:
- Promote ORC's existing `alpine 3.23 riscv64` job from manual/scheduled-trigger to automatic on every MR, this is largely a `.gitlab-ci.yml` rules change plus runner-capacity planning, not new infrastructure.
- Add a riscv64 job (cross-compile plus QEMU test run, or native runner) to GStreamer core's `.gitlab-ci.yml`, which today has none.
- Provision one or more riscv64 CI runners (native hardware or QEMU-backed) and register them with the freedesktop.org GitLab instance; this is the underlying resourcing blocker for both items above.
- Without automatic riscv64 CI, regressions such as the Alpine `orcc` crash and Debian's timeout-driven test disablement will continue to reach distros silently.

### 14.4 Ecosystem Enablement

Not applicable. GStreamer is a C multimedia framework; it does not have a significant dependent package ecosystem (comparable to, e.g., a language's package index or a Kubernetes operator catalog) that would require separate per-package riscv64 enablement work. The relevant downstream surface is distro packaging (Section 8) and the codec dependency tree (Section 9), both already covered above.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Provision riscv64 CI runner(s) for freedesktop.org GitLab | 2 (infrastructure) | freedesktop.org infra / sponsor | Critical |
| CI/CD | Promote ORC's `alpine 3.23 riscv64` job from manual/scheduled to automatic-on-MR | 1 | Centricular / ORC maintainers | High |
| CI/CD | Add a riscv64 job (cross-compile or QEMU) to GStreamer core's `.gitlab-ci.yml` | 2-3 | Centricular / freedesktop.org infra | High |
| Performance | Stabilize ORC RVV backend: promote out of `ORC_ENABLE_UNSTABLE_API`, complete Zvkn/Zvks hwprobe detection | 4-6 | Samsung / ORC maintainers | High |
| Performance | Independently confirm and, if needed, re-fix the Alpine `orcc` JIT segfault (#18343) so `gst-plugins-good`/`bad` can be re-enabled on Alpine riscv64 | 1-2 | Alpine / ORC maintainers | High |
| Functional | Fix Debian `gst-plugins-bad1.0` riscv64 autopkgtest timeout properly (rather than leaving it disabled) | 2 | Debian packager | Medium |
| Performance | Extend RVV intrinsics to additional gst-plugins-base elements beyond audio resampler (video scale/convert paths not covered by ORC) | 6-10 | New contributor / ISCAS | Medium |
| Distribution | Fedora riscv64 packaging: investigate koji riscv64 arch enablement for GStreamer | 2 | Fedora packager | Medium |
| Performance | libopus riscv64 SIMD (RVV Opus decode/encode) | 8-12 | New contributor or libopus maintainer | Low |
| Performance | libvpx riscv64 SIMD (RVV VP8/VP9) | 10-16 | New contributor | Low |
| Performance | x264/x265 riscv64 assembly or intrinsics (H.264/HEVC encode) | 12-20 each | New contributor | Low |

## 15. References

- [GStreamer canonical upstream (GitLab, Anubis-protected)](https://gitlab.freedesktop.org/gstreamer/gstreamer)
- [GStreamer monorepo (GitHub mirror)](https://github.com/GStreamer/gstreamer)
- [GStreamer ORC library (GitLab)](https://gitlab.freedesktop.org/gstreamer/orc)
- [GStreamer ORC (GitHub mirror)](https://github.com/GStreamer/orc)
- [GStreamer cerbero (GitLab)](https://gitlab.freedesktop.org/gstreamer/cerbero)
- [GStreamer download page](https://gstreamer.freedesktop.org/download/)
- [orc !236: riscv: Add target](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/236)
- [orc !249](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/249), [orc !254](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/254), [orc !279](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/279), [orc !297](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/297), [orc !298](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/298), [orc !306](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/306), [orc !308](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/308), [orc !309](https://gitlab.freedesktop.org/gstreamer/orc/-/merge_requests/309)
- [gstreamer !11768: cpuid RISC-V Vector detection](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11768)
- [gstreamer !11773: riscv host_defines and ABI structs](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11773)
- [gstreamer !11966: audio-resampler RVV optimization](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11966)
- [gstreamer !11784: Alpine RISC-V G-I build fix](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/11784)
- [gstreamer !12311: macOS-to-Android-riscv64 bison cross-compile fix](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/merge_requests/12311)
- [gstreamer-rs !2018](https://gitlab.freedesktop.org/gstreamer/gstreamer-rs/-/merge_requests/2018), [gstreamer-rs !2028](https://gitlab.freedesktop.org/gstreamer/gstreamer-rs/-/merge_requests/2028)
- [cerbero !1739: RISC-V 64 support for Android builds](https://gitlab.freedesktop.org/gstreamer/cerbero/-/merge_requests/1739)
- [GStreamer work item #4856: gstharness timeout on qemuriscv5](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/work_items/4856)
- [GStreamer work item #3433: gst-libav SIGILL on Alpine riscv64 (closed)](https://gitlab.freedesktop.org/gstreamer/gstreamer/-/work_items/3433)
- [Alpine aports #18343: orcc riscv64 segfault](https://gitlab.alpinelinux.org/alpine/aports/-/issues/18343)
- [Debian Bug#1109780](https://www.mail-archive.com/debian-bugs-dist@lists.debian.org/msg2046937.html)
- [Debian Bug#1114141](https://www.mail-archive.com/debian-bugs-dist@lists.debian.org/msg2061717.html)
- [CVE-2025-6663](https://osv.dev/vulnerability/CVE-2025-6663)
- [Ubuntu 26.04 "resolute" GStreamer package search](https://packages.ubuntu.com/search?keywords=GStreamer&suite=resolute&searchon=names&section=all)
- [Debian tracker: gstreamer1.0](https://tracker.debian.org/pkg/gstreamer1.0)
- [Alpine Linux pkgs: gstreamer edge riscv64](https://pkgs.alpinelinux.org/packages?name=gstreamer&arch=riscv64)
- [Fedora Koji: gstreamer1-1.26.11-1.fc42](https://koji.fedoraproject.org/koji/buildinfo?buildID=2659447)
- [Arch Linux RISC-V porting: archriscv-packages](https://github.com/felixonmars/archriscv-packages)
- [RISC-V Summit Europe 2025 ORC poster](https://riscv-europe.org/summit/2025/media/proceedings/2025-05-15-RISC-V-Summit-Europe-P2.3.02-PIKULA-poster.pdf)
- [SiFive ffmpeg-rvv](https://github.com/sifive/ffmpeg-rvv)
- [RISE Project: riseproject.dev](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Centricular: core GStreamer maintainer organization](https://www.centricular.com/)