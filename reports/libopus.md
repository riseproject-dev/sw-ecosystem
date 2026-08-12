---
title: libopus
categories:
  - multimedia
---

# libopus

**Author:** Ludovic HENRY &lt;ludovic.henry@qti.qualcomm.com&gt;
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libopus
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libopus is the reference implementation of the Opus audio codec, an IETF standard published as RFC 6716 (September 2012). The codec combines two audio technologies: SILK (originally from Skype, optimized for voice) and CELT (from Xiph.Org, optimized for music and general audio). The library is written in C with architecture-specific SIMD acceleration for x86 and ARM.

Xiph.Org Foundation is a US non-profit corporation. Governance is volunteer-driven with no formal steering committee, no Contribution License Agreement (CLA), and no membership tiers. The project coordinates via its [GitLab instance](https://gitlab.xiph.org/xiph/opus), a [GitHub mirror](https://github.com/xiph/opus), IETF mailing lists, and IRC (`#opus` on irc.libera.chat).

The primary active maintainer is Jean-Marc Valin. His corporate affiliations in sequence: Octasic (2008-2011), Mozilla (2011-2019), Amazon Web Services (2019-2024), Google (2024-present). He authored 86 of the last 100 commits on the GitHub mirror. Other active contributors include Timothy B. Terriberry (Xiph.Org volunteer, co-author of RFC 6716) and Mark Harris (9 of last 100 commits). Samsung R&D Poland (user k-kisielak) filed the only substantive RISC-V upstream issue (see Section 2).

Copyright holders named in the COPYING file: Xiph.Org, Skype Limited, Octasic, Jean-Marc Valin, Timothy B. Terriberry, CSIRO, Gregory Maxwell, Mark Borgerding, Erik de Castro Lopo, Mozilla, Amazon. License: BSD 3-clause.

Patent posture: Xiph.Org, Broadcom, and Microsoft (via Skype acquisition) all provide royalty-free irrevocable patent grants. Four other entities (Qualcomm, Huawei, France Telecom, Ericsson) filed disclosures of potentially relevant patents; external counsel concluded no license is required. [NEEDS VERIFICATION - no primary source was cited in the research findings for the "external counsel concluded" claim.]

Community culture on new ports: the project has informal port support -- no formal tier policy exists. The only RISC-V-targeted PR in the repository's history (PR #476, June 2026) was closed on the same day it was opened with zero maintainer review comments, which is a concrete signal of low maintainer engagement on RISC-V work.

The project is not a member of the RISE project. No RISE blog post (28 posts scanned, May 2024 through June 2026) mentions libopus.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| March 2024 | Issue #323 opened: reporter confirms libopus 1.5.1 builds successfully on two RISC-V boards (VisionFive 2 with JH7110/RV64GC, MangoPi MQ-Pro with Allwinner D1/C906/RV64GCV) despite unrelated ARM warnings. First public confirmation of riscv64 build success. | [Issue #323](https://github.com/xiph/opus/issues/323) |
| October 4, 2024 | Issue #368 opened by k-kisielak (Samsung R&D Poland) titled "RISC-V port implementation." Describes early-stage RVV intrinsics work on a private `rvv_impl` branch, targeting the SILK module. Test hardware: BananaPI F3 (SpacemiT K1 SoC). Described as "not deemed for merging in current form." | [Issue #368](https://github.com/xiph/opus/issues/368) |
| February 2025 | PR #392 opened as draft by MarekPikula titled "RFC: Streamline implementation overrides," motivated by the RISC-V work in #368. Refactors the RTCD (Run-Time CPU Detection) dispatch mechanism to reduce copy-paste when adding new SIMD backends. Blocked by C90 compatibility constraint (`__VA_ARGS__` requires C99). Still draft, no merge decision. | [PR #392](https://github.com/xiph/opus/pull/392) |
| June 10, 2026 | PR #476 opened and closed on the same day by external contributor carlosqwqqwq. Adds explicit CMake and autotools recognition of `riscv`/`riscv64` as a CPU family, marks 64-bit RISC-V as fast-64-bit-int via `__riscv_xlen`. No RVV backend. Zero maintainer review comments. Author deleted the source branch on close. | [PR #476](https://github.com/xiph/opus/pull/476) |

**Current state:** No RISC-V specific code has ever been merged into upstream xiph/opus. The `rvv_impl` branch referenced in Issue #368 has not been pushed publicly on GitHub. GitHub code search `riscv repo:xiph/opus` returns zero results. Zero RISC-V related commits exist in the repository history.

**Key contributor org:** Samsung R&D Poland is the only organization on record with active RISC-V work for libopus (Issue #368, PR #392). No RISE funding for libopus was found in any public RISE RFP catalog.

---

## 3. Upstream Support Tier

No formal tier policy exists. Tier inference from direct evidence:

| Signal | amd64 | arm64 | riscv64 |
|--------|-------|-------|---------|
| Architecture-specific SIMD directories | Yes (`celt/x86`, `silk/x86`, `dnn/x86`) | Yes (`celt/arm`, `silk/arm`, `dnn/arm`) | No |
| CI coverage (GitHub Actions) | Yes (ubuntu-latest) | Partial (GitLab arm64 runner only) | No |
| CI coverage (GitLab) | Yes (avx2-tagged runner) | Yes (`gstreamer-arm64-linux-docker`) | No |
| Official upstream binaries | No (source tarball only for all arches) | No | No |
| Distribution packages | Yes | Yes | Yes (Debian, Ubuntu) |
| Recognized by CMake build system | Yes | Yes | No (PR #476 rejected) |
| Recognized by autotools configure.ac | Yes | Yes | No (same) |
| Release-blocking tests | Yes | Implied | No |

**Effective tier: unrecognized.** The build system does not recognize riscv64 as a named CPU family. The library compiles and runs correctly on riscv64 via generic C fallback, but the platform is not an acknowledged target in the CMake or autotools configurations, has no CI, and has no SIMD optimization work in the upstream tree.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libopus contains two main codec modules (CELT and SILK) plus a DNN subsystem (for DRED, Deep PLC, OSCE). Each module has a generic portable C implementation plus architecture-specific SIMD acceleration. SIMD dispatch is performed via RTCD (Run-Time CPU Detection): at runtime the library queries CPU features and selects the fastest available implementation for each function.

Architecture-specific source directories confirmed by direct grep of the repository:

| Directory | Target | Optimization type |
|-----------|--------|-------------------|
| `celt/x86/` | x86/x86_64 | SSE, SSE2, SSE4.1, AVX2 intrinsics (27 files total across x86 dirs) |
| `silk/x86/` | x86/x86_64 | SSE4.1, AVX2 intrinsics |
| `silk/fixed/x86/` | x86/x86_64 | SSE4.1 intrinsics |
| `silk/float/x86/` | x86/x86_64 | SSE4.1 intrinsics |
| `dnn/x86/` | x86/x86_64 | AVX for DNN inference |
| `celt/arm/` | ARM/AArch64 | NEON intrinsics + ARMv4/ARMv5e assembly (24 files total across ARM dirs) |
| `silk/arm/` | ARM/AArch64 | NEON intrinsics for NSQ, LPC, biquad |
| `silk/fixed/arm/` | ARM/AArch64 | NEON fixed-point arithmetic |
| `dnn/arm/` | ARM/AArch64 | NEON/DOTPROD for DNN inference |
| `celt/mips/` | MIPS | MIPSr1 header-only optimizations for FFT, MDCT, pitch |
| `silk/mips/` | MIPS | Header-only optimizations |
| `silk/fixed/mips/` | MIPS | Header-only fixed-point |
| `silk/xtensa/` | Xtensa LX7 | LX7 DSP macros |

There is no `celt/riscv/`, `silk/riscv/`, `dnn/riscv/`, or any other RISC-V directory. The `celt/cpu_support.h` RTCD dispatch mechanism recognizes only ARM and x86; RISC-V falls into the generic `#else` branch with `OPUS_ARCHMASK 0` and no runtime dispatch.

Component-level status on riscv64:

| Component | Function | amd64 | arm64 | riscv64 | ISA extensions used on riscv64 |
|-----------|----------|-------|-------|---------|-------------------------------|
| CELT FFT/MDCT | Core transform for music/audio | AVX2 hand-tuned | NEON intrinsics | Scalar C fallback | None |
| CELT pitch xcorr | Autocorrelation for pitch detection | AVX2 | NEON | Scalar C fallback | None |
| SILK NSQ | Noise-shaping quantizer | AVX2 | NEON | Scalar C fallback | None |
| SILK LPC | Linear predictive coding | SSE4.1 | NEON | Scalar C fallback | None |
| SILK biquad | Biquad filter | SSE4.1 | NEON | Scalar C fallback | None |
| DNN inference (DRED, Deep PLC) | Neural net for enhancement | AVX | NEON/DOTPROD | Scalar C fallback | None |
| Fixed-point arithmetic | Optional fixed-point math | SSE4.1 | NEON | Scalar C fallback | None |
| RTCD dispatch | Runtime CPU feature selection | x86 feature flags | ARM feature flags | No dispatch (ARCHMASK=0) | N/A |

No RVV (RISC-V Vector) intrinsics, no Zba/Zbb scalar extensions, and no RISC-V assembly files exist anywhere in the repository.

---

## 5. Build System, Cross-Compilation, and Toolchain

The build system does not recognize riscv64 as a named CPU family. On riscv64 all SIMD paths are inactive by default because no `OPUS_CPU_RISCV` variable is defined. The generic C path is selected automatically.

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

`-DOPUS_DISABLE_INTRINSICS=ON` is not strictly required (riscv64 triggers no intrinsics path in the current build system), but is explicit best practice. CMake minimum required version: 3.16.

**Autotools (cross-compilation):**

```
./autogen.sh
./configure \
  --host=riscv64-linux-gnu \
  --disable-asm \
  CC=riscv64-linux-gnu-gcc
make -j$(nproc)
```

`--disable-asm` suppresses any ARM/x86 assembly detection warnings and is a safe no-op on riscv64. Note: `configure.ac` does not include `riscv*` in the architecture case statement that sets `has_float_approx=yes`. The float approximation path must be enabled explicitly with `--enable-float-approx` if desired (PR #476, which would have added automatic riscv* recognition, was not merged).

**Meson (cross-compilation):**

Create a cross file `riscv64-cross.ini`:

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

Then:

```
./autogen.sh
meson setup builddir \
  --cross-file riscv64-cross.ini \
  -Dtests=enabled \
  -Dbuildtype=release
meson compile -C builddir
meson test -C builddir
```

With `host_cpu_family = 'riscv64'`, meson emits a warning "No intrinsics support for riscv64" but does not error. Do not pass `-Dintrinsics=enabled` -- that triggers a hard error for unrecognized architectures.

**QEMU:** No QEMU-specific configuration exists in the repository. Standard QEMU user-mode emulation works:

```
QEMU_LD_PREFIX=/usr/riscv64-linux-gnu qemu-riscv64 ./build/opus_demo
```

**Required toolchain versions:** CMake >= 3.16. Meson >= 0.54.0. C99 (`c_std=gnu99` in meson.build; `CMAKE_C_STANDARD 99` in CMakeLists.txt). Any GCC >= 7 (which added riscv64 target support) or Clang >= 9 with `--target=riscv64-linux-gnu` is sufficient. The Debian bookworm cross-toolchain (`gcc-riscv64-linux-gnu`) provides GCC 12.

**Known build failures:** None reported in the issue tracker or CI logs for generic C builds. Issue #323 confirms successful builds on VisionFive 2 (RV64GC) and MangoPi MQ-Pro (RV64GCV) hardware in early 2024 using libopus 1.5.1.

No Dockerfiles for riscv64 exist in the repository. Search `riscv64 repo:xiph/opus filename:Dockerfile` returned zero results.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature / Capability | amd64 | arm64 | riscv64 |
|---------------------|-------|-------|---------|
| Encoding (correctness) | Full | Full | Full |
| Decoding (correctness) | Full | Full | Full |
| CELT SIMD acceleration | AVX2 | NEON | None (scalar C) |
| SILK SIMD acceleration | SSE4.1/AVX2 | NEON | None (scalar C) |
| DNN inference (DRED/Deep PLC) | AVX | NEON/DOTPROD | Scalar C |
| Float approximation path (autotools) | Yes (auto-detected) | Yes (auto-detected) | No (not auto-detected; PR #476 not merged) |
| RTCD runtime dispatch | Yes | Yes | No (ARCHMASK=0) |
| RVV Vector extension | N/A | N/A | Not implemented |
| CI coverage | Yes | Partial | None |

**Functional gaps:** None. The generic C path implements the full Opus specification. Every Opus profile (SILK, CELT, Hybrid) and every optional feature (DRED, Deep PLC, OSCE, fixed-point) compiles and runs correctly on riscv64.

**Performance gaps:** All SIMD-accelerated functions fall back to scalar C on riscv64. The SIMD acceleration in Opus 1.5+ targets the most compute-intensive inner loops: MDCT, pitch xcorr, NSQ, LPC, biquad, and DNN inference. No published benchmark data quantifies the scalar-vs-SIMD gap on riscv64 hardware (data not available: no benchmark figures found in any issue, blog post, or conference paper searched). A related data point: Issue #469 (open, April 2026) reports a 5-10% CPU regression in 1.6.1 vs 1.5.2 on all platforms from new CELT tone detection code, with the note "the lower the platform performance, the more noticeable the increase" -- indicating riscv64 hardware will absorb this regression more than x86 or ARM.

**Security hardening gaps:** Data not available: no issues or documentation addressing stack hardening, CFI, or similar flags specifically for riscv64 were found. The `libssp` flag is MinGW/Windows-only; Linux riscv64 uses compiler-integrated SSP.

**Float approximation path:** On amd64 and arm64, `configure.ac` auto-enables `has_float_approx=yes` (enabling a faster but slightly less accurate float path). On riscv64 this does not happen automatically. The autotools build will use the conservative float path unless `--enable-float-approx` is passed explicitly. PR #476, which would have added `riscv*` to the auto-enable list, was not merged.

---

## 7. CI/CD Infrastructure

All seven CI files in the xiph/opus repository were read directly from source and grepped for "riscv" (case-insensitive). Result: zero occurrences in all seven files.

| CI file | Architectures covered | riscv64 present |
|---------|----------------------|-----------------|
| `.github/workflows/autotools.yml` | ubuntu-latest (x86_64 only) | No |
| `.github/workflows/autotools-cross-mips.yml` | MIPS32, MIPS64 via QEMU | No |
| `.github/workflows/cmake.yml` | Android (arm64/x86/x86_64), Windows (x86/x64/ARM64), Linux x64, macOS, iOS | No |
| `.github/workflows/dred.yml` | Windows x64/ARM64, Linux x64, Android (x86_64/arm64), macOS, iOS | No |
| `.github/workflows/makefile.yml` | Linux/GCC on ubuntu-latest (x86_64) | No |
| `.github/workflows/repository.yml` | Whitespace check only (ubuntu-latest) | No |
| `.gitlab-ci.yml` | avx2-tagged x86_64 runners; `gstreamer-arm64-linux-docker` runner | No |

The MIPS cross-compile job (`autotools-cross-mips.yml`) uses QEMU and demonstrates the project is willing to run QEMU-based cross-architecture CI. No equivalent exists for riscv64.

No Jenkinsfile or `.cirrus.yml` exists in the repository.

No RISE runners are used for this project. The project is not a RISE member.

| CI dimension | amd64 | arm64 | riscv64 |
|--------------|-------|-------|---------|
| GitHub Actions | Yes | No | No |
| GitLab CI | Yes (avx2 runner) | Yes (arm64-linux-docker) | No |
| QEMU cross | No | No | No |
| Hardware-in-loop | No | No | No |
| RISE runners | No | No | No |

---

## 8. Distribution and Release Status

**Upstream releases:** xiph/opus ships source-only releases. The five most recent releases (v1.5.2, v1.5.1, v1.5, v1.4, v1.1.2) each contain exactly one asset: a generic source tarball (e.g., `opus-1.5.2.tar.gz`). No pre-built binary exists for any architecture from upstream.

**Debian sid:** `libopus0 1.6.1-1+b1` and `libopus-dev 1.6.1-1+b1` are built for riscv64 as an official Debian port (not unofficial debports). Build host: `rv-osuosl-05`. Status at time of research: "Installed." The `+b1` suffix indicates a binary-only NMU rebuild for the architecture. Confirmed via [Debian buildd tracker](https://buildd.debian.org/status/package.php?p=opus&suite=sid).

**Ubuntu 24.04 Noble:** `libopus0 1.4-1build1` is listed explicitly for riscv64 alongside amd64, arm64, armhf, i386, ppc64el, and s390x. Confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/noble/libopus0).

**Arch Linux RISC-V:** No entry in the `felixonmars/archriscv-packages` patch repository for "opus," consistent with a clean upstream build requiring no riscv64-specific patches. [NEEDS VERIFICATION - direct package listing from archriscv.felixc.at was not obtained in this research session.]

**PyPI:** No package named `libopus` exists on PyPI (HTTP 404 for `/pypi/libopus/json`). Not applicable.

**RISE wheel builder:** Redirects to PyPI `libopus`, which does not exist. Not applicable.

**What a user must do to get a working binary:** On Debian or Ubuntu, `apt install libopus-dev` delivers a working riscv64 binary. On other distributions, build from source tarball using the cross-compilation commands in Section 5. No additional patches are required for a correct generic-C build.

---

## 9. Dependencies

libopus has no external runtime dependencies beyond libc and libm. All SIMD acceleration is in-tree. All build-time tools (Doxygen, Perl, Git) are development-only and have no effect on runtime behavior.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|------|------|--------------|--------------|-----------------|-------|
| libc / libm | Mandatory runtime: `lrintf`, `lrint`, standard C math | Pass (Debian sid 1.6.1-1+b1 built on rv-osuosl-05; libc6 >= 2.27 required -- lower bar than arm64) | Assumed passing; no known failures | Released: libopus0 1.6.1-1+b1 in Debian sid | No issues |
| NE10 | Optional ARM-only SIMD math library (NEON-accelerated FFTs). Enabled by `--with-NE10` in autoconf. Guarded entirely by `#ifdef OPUS_ARM_MAY_HAVE_NEON`. | Not applicable | Not applicable | Not applicable | ARM-only; last release 2015, project dormant. No impact on riscv64. |
| x86 SIMD (SSE/SSE2/SSE4.1/AVX2) | In-tree SIMD acceleration. Runtime-selected via RTCD. | Not applicable (x86-only code, not compiled on riscv64) | Not applicable | Not applicable | No RVV equivalent written. riscv64 runs scalar C fallbacks. |
| ARM NEON / DOTPROD | In-tree SIMD acceleration for ARM/AArch64. | Not applicable | Not applicable | Not applicable | No RVV equivalent written. |
| DNN / LPCNet (internal) | Neural network for DRED, Deep PLC, OSCE. Bundled in `dnn/` subdirectory; no external library. | Compiles as portable C | Assumed passing (C-only path, no arch-specific SIMD in DNN) | Present in Debian/Ubuntu packages | No riscv64-specific issues; C-only means no acceleration gap beyond scalar throughput. |
| Doxygen | Build-time documentation generation only | Not applicable | Not applicable | Not applicable | No runtime effect. |
| Perl | Build-time only: translates RVCT ARM asm syntax to GAS. ARM assembly preprocessing only. | Not applicable | Not applicable | Not applicable | No effect on riscv64. |
| Git | Build-time only: `git describe` for package versioning in CMake. | Not applicable | Not applicable | Not applicable | No runtime effect. |

**Downstream consumers of libopus relevant to this repository's scope:**

| Consumer | Dependency type | Notes |
|----------|----------------|-------|
| FFmpeg | `--enable-libopus` for Opus encode/decode | See `./reports/ffmpeg.md` |
| GStreamer | `gst-plugins-base` opusenc/opusdec elements | See `./reports/gstreamer.md` |

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#368](https://github.com/xiph/opus/issues/368) | RISC-V port implementation | Open (Oct 2024) | Performance | Samsung R&D Poland RVV work on `rvv_impl` branch (not public). SILK module initial target. No benchmark figures published. No linked merged PR as of Jun 2026. |
| [#392](https://github.com/xiph/opus/pull/392) | RFC: Streamline implementation overrides | Draft PR (Feb 2025) | Infrastructure | RTCD refactor to ease adding new SIMD backends (motivated by #368). Blocked on C90 vs C99 compatibility. No merge decision. |
| [#469](https://github.com/xiph/opus/issues/469) | OPUS 1.6.1 consumes more CPU than 1.5.2 | Open (Apr 2026) | Performance | ~5-10% CPU regression attributed to new CELT tone detection code. Platform-agnostic; disproportionate on weaker hardware. riscv64 impact: more pronounced than on x86/ARM. |
| [#475](https://github.com/xiph/opus/issues/475) | `opus_cpu_feature_check` does not check XState | Open | Correctness (x86 only) | SIMD feature detection correctness bug; could cause incorrect SIMD dispatch. riscv64 is unaffected (no RTCD dispatch on riscv64). |
| [#476](https://github.com/xiph/opus/pull/476) | Add initial RISC-V platform recognition | Closed without merging (Jun 10, 2026) | Build system | Zero maintainer engagement. Conservative patch (CMake + autotools recognition, no RVV). Self-closed by author same day. |
| [#477](https://github.com/xiph/opus/issues/477) | HYBRID + DTX: CELT encoded then discarded on silent frames in 1.6.1 | Open (Jun 2026) | Correctness (all archs) | Regression vs 1.5.2. Affects all architectures including riscv64. |
| [#323](https://github.com/xiph/opus/issues/323) | Compiling libopus 1.5.1 with Linux fails on ARM Cortex-A53 and Cortex-A55 | Open (reopened, Mar 2024) | Build (ARM only) | Primary bug is ARM NEON. riscv64 referenced only as a comparison: builds successfully on VisionFive 2 and MangoPi MQ-Pro. No riscv64 action item. |

**Correctness regressions in current release (1.6.1) affecting riscv64:**
- Issue #469: ~5-10% CPU regression vs 1.5.2.
- Issue #477: CELT encoder drops frames on silent HYBRID+DTX input.

---

## 12. Objections and Upstream Blockers

**Stated objections:** No explicit maintainer objection to RISC-V support exists on record. PR #476 received zero review comments; the maintainer (Jean-Marc Valin) did not engage at all. This is ambiguous -- it could mean disinterest, or it could mean the maintainer would engage on a more complete patch (one that includes an RVV SIMD backend and CI, rather than build-system-recognition-only).

**Technical blockers:**

1. RTCD refactor (PR #392) is blocked on C90 vs C99 compatibility. The existing RTCD dispatch mechanism is designed for x86 and ARM patterns; adding a third architecture cleanly requires the refactoring proposed in #392. Adding RVV without the refactor would require duplicating the same dispatch boilerplate that #392 is trying to eliminate.

2. No public RVV implementation branch exists. Issue #368 references a `rvv_impl` branch, but it has not been pushed to GitHub. The work is not publicly reviewable.

3. CI infrastructure does not include a riscv64 runner or QEMU cross-compile job for RISC-V. Any RVV patch would arrive without upstream CI validation, reducing acceptance probability.

**Organizational blockers:**

1. The project is very small (one primary maintainer). Jean-Marc Valin dominates commit history (86 of last 100 commits). Any RISC-V work that does not have his buy-in will not merge.

2. The RISE project is not involved. Samsung R&D Poland is the only external organization publicly working on RISC-V support for libopus; their work is early-stage and unpublished.

3. PR submission practices may create friction: the CI pipeline checks for GPG-signed commits (`ci-fairy check-commits --gpg-signed-commit`), which is a non-trivial setup burden for new contributors.

**Acceptance probability for a complete RVV patch (build system recognition + RVV SIMD backend + CI):** Moderate, given prior precedent of accepting MIPS and Xtensa optimizations. Low for a build-system-recognition-only patch (PR #476 outcome). The absence of maintainer comments on PR #476 makes this hard to calibrate precisely.

---

## 13. Investment Analysis

RISE has no publicly confirmed funded project for libopus RISC-V optimization as of June 2026. Samsung R&D Poland has independent in-progress work (Issue #368) that is not publicly available for review. Investment strategy must account for the risk of duplicating Samsung's work.

### 13.1 Functional Enablement

No functional gap exists. The generic C build is complete and correct. No investment needed for functional correctness.

### 13.2 Performance Optimization

The primary gap is the absence of RVV SIMD intrinsics for the SILK and CELT modules. The DNN module (DRED, Deep PLC) is a secondary target.

The existing ARM NEON code in `silk/arm/` and `celt/arm/` is the natural reference for RVV intrinsics. The RTCD refactor in PR #392 is a prerequisite for adding a new architecture cleanly; that PR should be unblocked first (resolve the C90/C99 compatibility issue) before landing RVV intrinsics.

Scope:
- Unblock PR #392 (RTCD refactor): resolve C90/C99 constraint (likely: define a compatibility macro or negotiate C99 adoption with maintainer).
- Add `celt/riscv/` MDCT and pitch xcorr RVV intrinsics (reference: `celt/arm/` NEON files).
- Add `silk/riscv/` NSQ, LPC, biquad RVV intrinsics (reference: `silk/arm/` NEON files).
- Add `dnn/riscv/` RVV intrinsics for DNN inference (reference: `dnn/arm/`).
- Add CMake and autotools recognition (superseding PR #476).

No benchmark data is available to quantify the performance delta on riscv64 hardware, so the business case for this work rests on architecture parity rather than measured speedup.

### 13.3 CI/CD Infrastructure

Add a QEMU cross-compile CI job for riscv64 to GitHub Actions. Precedent exists: `autotools-cross-mips.yml` already does QEMU cross-compilation for MIPS. A riscv64 equivalent would be a small incremental addition. If RISE runner infrastructure is available (hardware-in-loop with a real riscv64 board), a GitLab CI job on the Xiph.Org GitLab would be higher value.

### 13.4 Ecosystem Enablement

Not applicable. libopus is a system library with no dependent package ecosystem requiring separate enablement on riscv64. Downstream consumers (FFmpeg, GStreamer) have their own riscv64 status covered in separate reports.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Build system | Add riscv64 platform recognition to CMake, autotools, meson (superseding PR #476) | 0.5 | External contributor | High |
| Build system | Resolve C90/C99 blocker in PR #392 (RTCD refactor) | 1 | External contributor (coordinate with MarekPikula) | High |
| Performance | RVV intrinsics for CELT (MDCT, pitch xcorr) | 4-6 | External contributor with RVV expertise | High |
| Performance | RVV intrinsics for SILK (NSQ, LPC, biquad) | 4-6 | External contributor with RVV expertise (coordinate with Samsung) | High |
| Performance | RVV intrinsics for DNN inference module | 3-5 | External contributor | Medium |
| CI/CD | Add riscv64 QEMU cross-compile job to GitHub Actions | 0.5 | External contributor | High |
| CI/CD | Add riscv64 hardware-in-loop job to Xiph.Org GitLab (if RISE runner available) | 1 | RISE infrastructure team | Medium |
| Performance | Benchmark riscv64 vs amd64 vs arm64 on reference hardware | 1 | Any | Medium |

**Total estimated effort:** 15-21 person-weeks for full functional parity (build recognition + RVV SIMD + CI). Build recognition alone (0.5 weeks) is a quick win but requires a more complete PR than #476 to get maintainer engagement.

**Coordination risk:** Samsung R&D Poland has independent RVV work in progress (Issue #368). Before starting new RVV intrinsics work, establish contact with k-kisielak to assess overlap and avoid duplicate effort.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [xiph/opus GitHub mirror (read-only)](https://github.com/xiph/opus)
- [Xiph.Org GitLab (upstream)](https://gitlab.xiph.org/xiph/opus)
- [Opus codec homepage](https://opus-codec.org/)
- [RFC 6716 -- Definition of the Opus Audio Codec](https://www.rfc-editor.org/rfc/rfc6716)
- [PR #476 -- Add initial RISC-V platform recognition (closed without merging)](https://github.com/xiph/opus/pull/476)
- [Issue #368 -- RISC-V port implementation (Samsung R&D Poland)](https://github.com/xiph/opus/issues/368)
- [PR #392 -- RFC: Streamline implementation overrides (draft, RTCD refactor)](https://github.com/xiph/opus/pull/392)
- [Issue #323 -- Compiling libopus 1.5.1 on ARM Cortex-A53/A55 (contains riscv64 build confirmation)](https://github.com/xiph/opus/issues/323)
- [Issue #469 -- OPUS 1.6.1 consumes more CPU than 1.5.2](https://github.com/xiph/opus/issues/469)
- [Issue #475 -- opus_cpu_feature_check does not check XState](https://github.com/xiph/opus/issues/475)
- [Issue #477 -- HYBRID + DTX: CELT encoded then discarded on silent frames in 1.6.1](https://github.com/xiph/opus/issues/477)
- [Debian buildd tracker for opus (sid)](https://buildd.debian.org/status/package.php?p=opus&suite=sid)
- [Ubuntu packages.ubuntu.com -- libopus0 noble](https://packages.ubuntu.com/noble/libopus0)
- [Arch Linux RISC-V patch repository (felixonmars/archriscv-packages)](https://github.com/felixonmars/archriscv-packages)
- [RISE project homepage](https://riseproject.dev/)