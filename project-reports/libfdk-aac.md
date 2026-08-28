---
title: libfdk-aac
parent: Project Reports
categories:
  - multimedia
---

# libfdk-aac

**Author:** Ludovic HENRY `<ludovic.henry@qti.qualcomm.com>`
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libfdk-aac
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

[libfdk-aac](https://github.com/mstorsjo/fdk-aac) is an open-source packaging of the Fraunhofer IIS FDK AAC codec library, maintained by Martin Storsjo (mstorsjo) as a personal project on GitHub. The upstream codec code originates from Fraunhofer-Gesellschaft zur Forderung der angewandten Forschung e.V. (Fraunhofer IIS, Erlangen, Germany), copyright 1995-2018. The mstorsjo packaging also incorporates ongoing upstream contributions from Google/AOSP, merged via automated bots (Treehugger Robot, android-build-merge-worker-robot).

The library provides AAC-LC, HE-AACv1, HE-AACv2 encode and decode. It is consumed by FFmpeg (optional link for AAC encoding), GStreamer (gstreamer-plugins-bad fdk-aac plugin), and Android (AOSP ART/media stack).

**Governance:** None. There is no foundation membership, no steering committee, no MAINTAINERS or OWNERS file, and no corporate sponsorship listed in the repository. Martin Storsjo is the sole gatekeeper. There is no tier policy, no platform support matrix, and no stated policy on accepting architecture-specific contributions.

**Community culture on new ports:** Neutral. Architecture-specific contributions have been accepted historically -- s390x SIMD was added via [PR #159](https://github.com/mstorsjo/fdk-aac/pull/159) (merged December 2023, ~500 lines of vector intrinsics), SPARC architecture detection was added via [PR #178](https://github.com/mstorsjo/fdk-aac/pull/178) (merged February 2025), and AArch64 assembly optimization was attempted via [PR #47](https://github.com/mstorsjo/fdk-aac/pull/47) (closed, not merged). No one has filed a RISC-V optimization request, and no contributor is currently working on it.

**License:** Fraunhofer FDK AAC proprietary license. Redistribution without copyright fees is permitted under specific conditions, but the license explicitly states "NO EXPRESS OR IMPLIED LICENSES TO ANY PATENT CLAIMS ARE GRANTED." This restricts the library from being included in main or free sections of most Linux distributions regardless of architecture.

**RISE Project involvement:** None. No RISE blog post mentions libfdk-aac or audio codec work. libfdk-aac does not appear in the RISE wheel builder package list (74 packages listed). No RISE-funded work exists for this project.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-05-13 | Single commit `3aabcb6abd` adds RISC-V architecture detection to `libFDK/include/FDK_archdef.h` -- 6 preprocessor `#define` lines selecting 16-bit lookup tables and 32x16 multiply preference (generic C path, no SIMD) | [commit 3aabcb6abd](https://github.com/mstorsjo/fdk-aac/commit/3aabcb6abd1b32344370758aaae424735ca061a6) |
| 2022-05-13 | Commit authored by Zhang Ye (haocheng.zy@alibaba-inc.com), committed by Mao Han (han_mao@linux.alibaba.com), both at Alibaba. The Gerrit-style Change-Id suggests internal review at Alibaba before direct push to master. [NEEDS VERIFICATION: no second source confirms Alibaba internal review process] | [commit 3aabcb6abd](https://github.com/mstorsjo/fdk-aac/commit/3aabcb6abd1b32344370758aaae424735ca061a6) |
| 2023+ | Debian and Ubuntu package the 2022 commit as part of fdk-aac 2.0.2/2.0.3 and build riscv64 .deb packages using the generic C fallback path | [Debian tracker](https://tracker.debian.org/pkg/fdk-aac), [Ubuntu packages](https://packages.ubuntu.com/search?keywords=libfdk-aac&suite=noble) |

The port is fully upstream in the sense that the architecture detection commit is in the master branch. It is not fully upstream in any meaningful engineering sense -- there is no riscv64 CI, no SIMD optimization, and no RISC-V contributor actively maintaining the port. The 2022 commit is the entirety of RISC-V work ever done on this project.

---

## 3. Upstream Support Tier

The project has no documented tier policy.

**Evidence-based tier assignment:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI runner in upstream repo | Yes (ubuntu-latest x86_64) | Yes (macOS universal, MSVC ARM64, llvm-mingw aarch64-w64-mingw32) | No |
| SIMD/intrinsic optimization | Yes (`x86/` headers: abs, clz, fixmul, fixpoint_math) | Yes (`arm/` headers: clz, cplx_mul, fixmadd, fixmul, scale, scramble) | No (generic C fallback only) |
| Official GitHub release binaries | No (no GitHub releases at all; source only) | No | No |
| Architecture characterization in FDK_archdef.h | Yes | Yes | Yes (6 lines, 2022) |
| Distro binary packages | Yes (all distros) | Yes (all distros) | Debian sid, Ubuntu 24.04 only |

riscv64 is a third-class target: it compiles, links, and produces correct output via the generic C fallback, but receives no CI coverage, no SIMD acceleration, and limited distro packaging. It is closer to an ad-hoc port than a supported target.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libfdk-aac is a fixed-point AAC codec. Its performance-critical operations are:

- Fixed-point multiply (32x16, 32x32, MLA)
- Fixed-point multiply-accumulate for filter banks
- Complex multiply for the MDCT/FFT butterfly
- Arithmetic shift with saturation (scale)
- Count-leading-zeros (clz) for normalization
- Absolute value (abs)
- FFT scramble

Each of these has architecture-specific intrinsic implementations for ARM, MIPS, x86, and (partially) PowerPC. None has a RISC-V implementation.

**Architecture-specific code inventory:**

| Component | amd64 implementation | arm64 implementation | riscv64 implementation |
|-----------|---------------------|---------------------|----------------------|
| abs | `x86/abs_x86.h` | no dedicated file (uses generic) | missing -- generic C |
| clz | `x86/clz_x86.h` (uses `__builtin_clz`) | `arm/clz_arm.h` (uses `__builtin_clz` + ARM hint) | missing -- generic C loop |
| fixmul (32x16) | `x86/fixmul_x86.h` | `arm/fixmul_arm.h` | missing -- 64-bit C cast fallback |
| fixmadd | no dedicated file | `arm/fixmadd_arm.h` | missing -- generic C |
| fixpoint_math | `x86/fixpoint_math_x86.h` | no dedicated file | missing -- generic C |
| scale (shift+sat) | no dedicated file | `arm/scale_arm.h` | missing -- generic C |
| cplx_mul (FFT) | no dedicated file | `arm/cplx_mul_arm.h` | missing -- generic C |
| FFT scramble | no dedicated file | `arm/scramble_arm.h` | missing -- generic C |
| Architecture tuning flags | `FDK_archdef.h` (full) | `FDK_archdef.h` (full) | `FDK_archdef.h` (6 lines: 16-bit tables, MULT_32x16 preference) |
| RVV Vector intrinsics | n/a | n/a | not present |
| Assembly (.S files) | none in repo | none for aarch64 specifically | none |
| Architecture subdirectory | `libFDK/include/x86/` (4 files) | `libFDK/include/arm/` (6 files) | none -- directory does not exist |

**ISA extensions used on riscv64:** None. The 2022 commit selects `ARCH_PREFER_MULT_32x16`, `SINETABLE_16BIT`, `POW2COEFF_16BIT`, `LDCOEFF_16BIT`, and `WINDOWTABLE_16BIT`. These are compile-time flags that cause the generic C code to use 16-bit ROM tables (reducing memory bandwidth) and prefer 32x16 over 32x32 multiplies. No Zba, Zbb, Zbc, Zvl, or RVV (Vector) extensions are used.

**Functional correctness:** The codec compiles and runs on riscv64 via the generic C path. Debian builds it successfully. There are no known correctness bugs.

**Performance:** No benchmarks exist. The absence of SIMD means every MDCT butterfly, every filter bank convolution, and every fixed-point multiply is executed as a scalar C operation. On a wide-issue out-of-order riscv64 core this will be slower than arm64 with NEON, though no quantitative data is available. For real-time audio on embedded riscv64 (in-order, low-frequency), the generic C path is likely insufficient for high-bitrate HE-AACv2 without hardware acceleration. Data not available: no published cycles/frame figures for libfdk-aac on any riscv64 silicon.

---

## 5. Build System, Cross-Compilation, and Toolchain

libfdk-aac supports two build systems: autoconf/automake (`configure.ac`, `Makefile.am`, `autogen.sh`) and CMake (`CMakeLists.txt`, minimum CMake 3.5.1). Neither has any riscv64-specific logic.

**Cross-compilation with autoconf:**

```
autoreconf -fi
./configure \
  --host=riscv64-linux-gnu \
  --prefix=/usr \
  CC=riscv64-linux-gnu-gcc \
  CXX=riscv64-linux-gnu-g++ \
  AR=riscv64-linux-gnu-ar
make -j$(nproc)
```

**Cross-compilation with CMake:**

```
cmake -S . -B build \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DCMAKE_INSTALL_PREFIX=/usr \
  -DBUILD_PROGRAMS=OFF
cmake --build build -j$(nproc)
```

No riscv64-specific CMake toolchain file exists in the repository, and none is required because the codebase has no `CMAKE_SYSTEM_PROCESSOR` branches.

**Toolchain requirements:** C++98 minimum. Any GCC or Clang from the past 15 years suffices. On Debian/Ubuntu, `gcc-riscv64-linux-gnu` and `g++-riscv64-linux-gnu` (GCC 12/13 in bookworm/trixie) are the standard packages. No minimum GCC version for riscv64 is documented in the project; GCC riscv64 support was complete from GCC 7.

**QEMU:** No QEMU setup exists in upstream CI. To run the test suite cross-compiled, `qemu-riscv64-static` with binfmt_misc registration enables transparent execution of the cross-compiled binary. No automated test runner script is provided by the project.

**Known build failures on riscv64:** None reported. Zero issues and zero PRs in the tracker mention any riscv64 build failure.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| AAC-LC decode | Yes | Yes | Yes |
| HE-AACv1 decode (SBR) | Yes | Yes | Yes |
| HE-AACv2 decode (PS) | Yes | Yes | Yes |
| AAC-LC encode | Yes | Yes | Yes |
| HE-AACv1 encode | Yes | Yes | Yes |
| SIMD-accelerated fixed-point multiply | Yes (x86 intrinsics) | Yes (ARM intrinsics) | No (generic C) |
| SIMD-accelerated FFT/MDCT | Partial (complex mul) | Partial (complex mul, scramble) | No |
| SIMD-accelerated scale/shift | No (generic C) | Yes (ARM intrinsics) | No |
| clz hardware acceleration | Yes (via x86 intrinsics or __builtin_clz) | Yes | No (generic C loop) [NEEDS VERIFICATION: GCC may generate riscv64 clz from __builtin_clz even without an explicit dispatch; this was not tested] |
| 16-bit ROM tables (memory optimization) | Yes | Yes | Yes (set by 2022 commit) |
| CI-validated correctness | Yes | Yes (macOS arm64, MSVC ARM64) | No |

**Functional gaps:** None. All codec features work on riscv64.

**Performance gaps:** Every SIMD-accelerated hot path falls back to generic C on riscv64. The magnitude of the regression cannot be quantified without benchmark data, which does not exist.

**Security hardening gaps:** No riscv64-specific stack protection, shadow call stack, or CFI configuration exists in the build system. This is not a regression from arm64 -- neither target has project-level security hardening configuration. Data not available: no security audit of the riscv64 code path has been published.

**Floating-point / NaN semantics:** The codec is fixed-point throughout. Floating-point is not used in the audio pipeline. No NaN sensitivity issues apply.

---

## 7. CI/CD Infrastructure

The upstream CI is a single file: [`.github/workflows/ci.yml`](https://github.com/mstorsjo/fdk-aac/blob/master/.github/workflows/ci.yml). It defines 14 jobs triggered on `push` and `pull_request`.

**CI coverage by target:**

| Target | CI present | Runner | Test depth |
|--------|-----------|--------|------------|
| Linux x86_64 (autotools) | Yes | ubuntu-latest | Build + sanitizers (ASan, UBSan) |
| Linux x86_64 (CMake) | Yes | ubuntu-latest | Build |
| macOS x86_64+arm64 universal | Yes | macos-latest | Build |
| Windows x86_64 (MSVC) | Yes | windows-latest | Build |
| Windows ARM (MSVC cross) | Yes | windows-latest | Build |
| Windows ARM64 (MSVC cross) | Yes | windows-latest | Build |
| MinGW x86_64 | Yes | ubuntu-latest | Cross-compile |
| MinGW AArch64 (llvm-mingw) | Yes | ubuntu-latest | Cross-compile |
| FFmpeg integration (x86_64) | Yes | ubuntu-latest | Build + functional |
| **riscv64 (any form)** | **No** | **None** | **None** |

**RISE runners:** Not used. The RISE Project announced [RISC-V Runners](https://riseproject.dev/blog/announcing-the-rise-risc-v-runners) in March 2026. libfdk-aac does not use them.

**QEMU emulation in CI:** Not present.

Adding riscv64 CI would require either a QEMU-based cross-compilation job (functional validation only, no performance data) or a native riscv64 runner via the RISE runners program.

---

## 8. Distribution and Release Status

**GitHub releases:** None. The project ships source tarballs via git tags only. No binary release assets exist for any architecture.

**Distribution packages:**

| Distribution | Package name | riscv64 available | Version | Build status | Notes |
|---|---|---|---|---|---|
| [Debian sid](https://tracker.debian.org/pkg/fdk-aac) | `libfdk-aac2t64`, `libfdk-aac-dev` | Yes | 2.0.3-1 | Installed (built on rv-manda-03 buildd, ~482 days ago) | non-free/misc section |
| [Ubuntu 24.04 (noble)](https://packages.ubuntu.com/search?keywords=libfdk-aac&suite=noble) | `libfdk-aac2`, `libfdk-aac-dev` | Yes | 2.0.2-3~ubuntu4 | Available (460.4 kB download) | cross-compiled on amd64 builder |
| [Arch Linux RISC-V port](https://archriscv.felixc.at/?q=fdk-aac) | `libfdk-aac` | No | 2.0.3-2 (x86_64 only) | Not ported | fdk-aac is in Arch extra for x86_64; not carried in archriscv community port |
| Fedora | `fdk-aac` | Unknown | Unknown | Unknown | Data not available: Koji build system was not accessible during research |
| PyPI | n/a | n/a | n/a | Not present (HTTP 404) | No Python wrapper exists on PyPI |

**To get a working riscv64 binary:**

- On Debian sid: `apt install libfdk-aac-dev` (non-free repo must be enabled)
- On Ubuntu 24.04: `apt install libfdk-aac-dev` (universe repo; non-free-firmware may also be needed)
- On any other distribution: build from source using the cross-compilation steps in Section 5

The Debian and Ubuntu riscv64 binaries are compiled from the generic C fallback path. No native riscv64 hardware validation was performed by Debian/Ubuntu in producing these packages [NEEDS VERIFICATION: Debian buildd rv-manda-03 may run test suites; this was not confirmed from the research data].

---

## 9. Dependencies

libfdk-aac is intentionally self-contained. All codec subsystems (libAACdec, libAACenc, libSBR, libMpegTP, libFDK, libSYS) are bundled within the repository. There are no external library dependencies for the core codec.

**Dependency table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| libm (glibc) | Optional: `sin()` for fixed-point table generation; linked as `-lm` where math is not in default libc | Yes -- glibc riscv64 ships libm | Yes -- glibc riscv64 is tested | Yes -- all major distros | None |
| libstdc++ / libc++ | C++ runtime; all sources are C++ | Yes -- GCC riscv64 support complete since GCC 7 | Functional | Ships in all riscv64 toolchains | None |
| CMake / autoconf (build-time only) | Build system | n/a | n/a | n/a | None |
| ARM SIMD (`libFDK/include/arm/`, `libFDK/src/arm/`) | Optional performance: NEON intrinsics for fixmul, scale, cplx_mul, scramble, FFT | Not applicable | Not applicable | Not applicable | No riscv64 equivalent; see Section 6 |
| MIPS DSP (`libFDK/include/mips/`, `libFDK/src/mips/`) | Optional performance: MIPS DSP intrinsics | Not applicable | Not applicable | Not applicable | No riscv64 equivalent |
| x86 SIMD (`libFDK/include/x86/`) | Optional performance: SSE/x86 intrinsics | Not applicable | Not applicable | Not applicable | No riscv64 equivalent |
| PowerPC (`libFDK/include/ppc/`) | Optional performance: PPC intrinsics (partial) | Not applicable | Not applicable | Not applicable | No riscv64 equivalent |

The only dependency deserving deeper attention is glibc/libm on riscv64. glibc has full riscv64 support including optimized math routines. Since libfdk-aac is a fixed-point codec and uses libm only at table-generation time (not in the real-time decode/encode path), glibc riscv64 maturity is not a concern.

---

## 11. Known Bugs and Active Issues

**RISC-V-specific issues:** None. GitHub issue and PR searches for "riscv" in `repo:mstorsjo/fdk-aac` return zero results (confirmed via GitHub search API). Manual review of all issues and all 26 PRs found no RISC-V mentions.

**Open issues potentially relevant to any new architecture port:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#166](https://github.com/mstorsjo/fdk-aac/issues/166) | Are CPU specific optimizations with -mcpu supported? | Open (Feb 2024) | Medium | Reports performance regression with -mcpu flags on aarch64 due to conditional SIMD paths being disabled; same risk applies to any future riscv64 SIMD work that uses architecture-specific compiler flags |

**Open PRs (none are RISC-V related):**

| PR | Title | Status | Notes |
|----|-------|--------|-------|
| [#168](https://github.com/mstorsjo/fdk-aac/pull/168) | Visual Studio / NuGet packaging | Open (Feb 2024) | Unrelated to riscv64 |
| [#139](https://github.com/mstorsjo/fdk-aac/pull/139) | Meson build system | Open (Oct 2021) | Would affect all targets; stalled |
| [#40](https://github.com/mstorsjo/fdk-aac/pull/40) | Whitespace cleanup | Open (Jan 2016) | Stale |
| [#37](https://github.com/mstorsjo/fdk-aac/pull/37) | Typo fix | Open (Jan 2016) | Stale |

No correctness bugs are open for riscv64.

---

## 12. Objections and Upstream Blockers

**Technical blockers:** None. The generic C path compiles and runs correctly on riscv64. A contributor could submit a PR adding `libFDK/include/riscv/` headers with RVV intrinsics without any upstream objection anticipated.

**Stated objections:** None on record. No maintainer has expressed opposition to riscv64 work. The project accepted s390x SIMD (PR #159) and SPARC detection (PR #178), establishing precedent for new architecture contributions.

**Organizational blockers:** The project is a single-maintainer personal project (Martin Storsjo). PR review throughput is low -- two of four open PRs are from 2016 and remain unmerged. A RISC-V optimization PR could wait months for review. The maintainer has no stated RISC-V interest.

**License blocker:** The Fraunhofer FDK AAC license restricts patent use. This limits which distributors can ship riscv64 binaries but does not block upstream code contribution or building from source. For a chip company's internal use or for Debian non-free, the license is workable.

**Acceptance probability:** High for a minimal PR (arch detection + CI job). Medium-to-low for a full RVV optimization PR given low maintainer bandwidth and the complexity of intrinsic code review.

---

## 13. Investment Analysis

RISE has done nothing for libfdk-aac. All work scoped below would be net-new.

### 13.1 Functional Enablement

Functional correctness on riscv64 is already complete via the 2022 Alibaba commit. No additional functional enablement work is required.

### 13.2 Performance Optimization

The performance gap relative to arm64 is the primary technical deficiency. The hot paths to optimize, in priority order based on codec profile:

1. `fixmul.h` -- 32x16 and 32x32 fixed-point multiply (called in every filter bank and spectral coefficient operation). RVV widening multiply (`vwmul`) would directly accelerate this.
2. `cplx_mul.h` -- complex multiply for MDCT/FFT butterflies. RVV interleaved vector arithmetic.
3. `scale.h` -- arithmetic right shift with saturation. Zbb extension (`sra` + `max`) or RVV.
4. `clz.h` -- count leading zeros. Zbb `clz` instruction is a single-instruction fix.
5. `abs.h` -- absolute value. Zbb `abs` instruction.
6. `scramble_arm.h` equivalent -- FFT index scramble. Lower priority.

The analogous s390x SIMD PR (#159) was ~500 lines. A complete RVV optimization covering items 1-5 is estimated at 600-900 lines across 5 header files. No prior art exists in the upstream repo.

### 13.3 CI/CD Infrastructure

A QEMU-based riscv64 CI job can be added to `.github/workflows/ci.yml` with a `qemu-user-static` cross-compile step. This validates correctness but not performance. A native riscv64 CI job using RISE runners would provide both. The RISE RISC-V Runners program (announced March 2026) is available for open-source projects.

### 13.4 Ecosystem Enablement

libfdk-aac has no language-level package ecosystem (no PyPI, no npm, no Maven artifacts). The only distribution surface is system .deb/.rpm packages, which Debian and Ubuntu already provide for riscv64. No ecosystem enablement work is required beyond what distros already do.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None -- generic C path is correct and ships in Debian/Ubuntu riscv64 | 0 | n/a | n/a |
| Performance | Implement `libFDK/include/riscv/` headers with RVV intrinsics for fixmul, cplx_mul, scale, clz, abs | 4-6 | Compiler/codec engineer with RVV experience | High (required for real-time use on embedded or mobile riscv64) |
| Performance | Benchmark vs arm64 NEON to quantify gap before and after | 1 | Performance engineer | High (justifies and validates the optimization work) |
| CI/CD | Add riscv64 QEMU cross-compile job to upstream ci.yml and submit PR | 0.5 | Any engineer | Medium |
| CI/CD | Onboard to RISE RISC-V Runners for native hardware CI | 1 | DevOps / RISE liaison | Medium |
| Distro packaging | Arch Linux RISC-V port (archriscv) -- request package addition | 0.25 | Any contributor | Low |
| Upstream PR | Submit performance optimization PR, shepherd through review | 1-2 (review cycles) | Senior engineer | High (blocks upstream acceptance) |

Total estimated effort: 7.75-10.75 person-weeks for a complete, upstreamed, CI-validated RVV optimization.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [mstorsjo/fdk-aac repository](https://github.com/mstorsjo/fdk-aac)
- [Commit 3aabcb6abd -- "Add riscv64 support" (Zhang Ye / Alibaba, 2022-05-13)](https://github.com/mstorsjo/fdk-aac/commit/3aabcb6abd1b32344370758aaae424735ca061a6)
- [PR #159 -- s390x SIMD support (merged Dec 2023)](https://github.com/mstorsjo/fdk-aac/pull/159)
- [PR #178 -- SPARC architecture detection (merged Feb 2025)](https://github.com/mstorsjo/fdk-aac/pull/178)
- [PR #47 -- AArch64 assembly optimization (closed, not merged)](https://github.com/mstorsjo/fdk-aac/pull/47)
- [Issue #166 -- CPU-specific optimizations with -mcpu (open Feb 2024)](https://github.com/mstorsjo/fdk-aac/issues/166)
- [Debian package tracker -- fdk-aac](https://tracker.debian.org/pkg/fdk-aac)
- [Debian buildd status -- fdk-aac sid](https://buildd.debian.org/status/package.php?p=fdk-aac&suite=sid)
- [Ubuntu 24.04 package search -- libfdk-aac](https://packages.ubuntu.com/search?keywords=libfdk-aac&suite=noble&searchon=names&section=all)
- [Arch Linux RISC-V port tracker](https://archriscv.felixc.at/?q=fdk-aac)
- [Upstream CI workflow -- .github/workflows/ci.yml](https://github.com/mstorsjo/fdk-aac/blob/master/.github/workflows/ci.yml)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners announcement (Mar 2026)](https://riseproject.dev/blog/announcing-the-rise-risc-v-runners)
- [FFmpeg RISC-V status report -- libfdk-aac note](./multimedia/ffmpeg.md)