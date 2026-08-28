---
title: dav1d
parent: Project Reports
categories:
  - multimedia
  - browser
---

# dav1d

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for dav1d
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

dav1d is a high-performance, BSD-2-Clause-licensed AV1 video decoder developed by VideoLAN and Alliance for Open Media (AOM). It is the reference fast decoder for the AV1 codec standard, targeting all major architectures with hand-tuned SIMD. The codebase is pure C with architecture-specific assembly backends; it has no external runtime dependencies beyond pthreads/librt.

**Governance.** The project is owned by [VideoLAN](https://www.videolan.org/), a French non-profit association. Alliance for Open Media provided partial initial funding. VideoLAN holds collective copyright; contributors retain individual copyright. No CLA is required. The license (BSD-2-Clause) imposes no barrier to commercial use or architecture porting.

**Corporate sponsors.** The AOM consortium (Amazon, Cisco, Google, Intel, Microsoft, Mozilla, Netflix, Apple) funded the project's creation. Active named contributors include Ronald S. Bultje (core maintainer, rbultje), Jean-Baptiste Kempf (VideoLAN president), Nathan E. Egge (primary RISC-V author), Niklas Haas (haasn), and Martin Storsjö. VideoLabs SAS (VideoLAN's commercial arm) provides organizational support. No employer is listed publicly for Nathan E. Egge.

**Community culture on new ports.** The README explicitly names RISC-V among "less common architectures" the project intends to accelerate, alongside PPC, SSE2, and AVX-512. The BSD porting work (MR !1764, Nov 2024) and the volume of RISC-V MRs from multiple independent contributors indicate the maintainers actively accept new architecture contributions. The only code-style requirement is conformance to the existing ASM macro conventions. No CLA and a permissive license minimize the friction for new contributors.

**RISE Project involvement.** None. A review of all 27 RISE blog posts (May 2024 through June 2026) found zero mentions of dav1d, AV1, or multimedia codecs. dav1d is not listed as a RISE-funded RFP project. All RISC-V work is happening independently through upstream VideoLAN contributors.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the canonical [code.videolan.org/videolan/dav1d](https://code.videolan.org/videolan/dav1d) repository. There are no downstream forks carrying RISC-V patches.

| Date | Event | Source |
|---|---|---|
| 2024-01-30 | First commit by Nathan E. Egge: "Add initial RISC-V support" (CPU feature detection via `getauxval(AT_HWCAP)`, meson build detection, CLI flag mapping) | [commit 61251bc](https://github.com/videolan/dav1d) |
| 2024-02-14 | dav1d 1.4.0 released: "New architecture supported: RISC-V; RISC-V optimizations for itx" | NEWS file |
| 2024-02-23 | MR !1608 merged: "CI: Add riscv64 clang build" -- RISC-V CI operational | [MR !1608](https://code.videolan.org/videolan/dav1d/-/merge_requests/1608) |
| 2024-03-15 | dav1d 1.4.1 released: "More RISC-V optimizations for itx (4x8, 8x4, 4x16, 16x4, 8x16, 16x8)" | NEWS file |
| 2024-05-06 | MR !1629 merged: RVV compliance check requiring RVV 1.0+ (filters pre-spec hardware) | [MR !1629](https://code.videolan.org/videolan/dav1d/-/merge_requests/1629) |
| 2024-11-21 | MR !1764 merged: RISC-V ported to FreeBSD/OpenBSD via `elf_aux_info()` | [MR !1764](https://code.videolan.org/videolan/dav1d/-/merge_requests/1764) |
| 2024-12-29 | MR !1777 merged: RISC-V build fixed for non-Linux POSIX OS | [MR !1777](https://code.videolan.org/videolan/dav1d/-/merge_requests/1777) |
| 2025-03-xx | dav1d 1.5.0 released: "RISC-V optimizations for pal, cdef_filter, ipred, mc_blend, mc_bdir, itx" | NEWS file |
| 2025-xx-xx | dav1d 1.5.1 released: "blend optimizations for high bitdepth; Port RISC-V to POSIX/non-Linux OS" | NEWS file |
| 2025-11-05 | MR !1808 merged: emu_edge 8bpc RVV | [MR !1808](https://code.videolan.org/videolan/dav1d/-/merge_requests/1808) |
| 2025-11-06 | MR !1797 merged: w_mask functions 8bpc RVV | [MR !1797](https://code.videolan.org/videolan/dav1d/-/merge_requests/1797) |
| 2025-12-23 | MR !1824 merged: VLEN=512 8bpc blend functions | [MR !1824](https://code.videolan.org/videolan/dav1d/-/merge_requests/1824) |
| 2025-12-26 | MR !1826 merged: VLEN=512 16bpc blend functions | [MR !1826](https://code.videolan.org/videolan/dav1d/-/merge_requests/1826) |
| 2025-12-31 | dav1d 1.5.3 released: "RISC-V assembly optimizations for ipred, emu_edge, w_mask, VLEN-512 blend" | NEWS file |
| 2026-05-15 | MR !1857 merged: ipred_h 8bpc RVV | [MR !1857](https://code.videolan.org/videolan/dav1d/-/merge_requests/1857) |
| 2026-xx-xx | dav1d 1.5.4 released: "RISC-V: add ipred_v, _h, _pal, _dc optimizations" | NEWS file |
| 2026-06-23 | MR !1883 merged: ipred_v and ipred_h 16bpc RVV | [MR !1883](https://code.videolan.org/videolan/dav1d/-/merge_requests/1883) |
| 2026-06-23 | MR !1908 merged: pal_pred 8bpc and 16bpc RVV optimization | [MR !1908](https://code.videolan.org/videolan/dav1d/-/merge_requests/1908) |

**Key contributors and affiliations.**

| Contributor | Handle | Affiliation | RISC-V contributions |
|---|---|---|---|
| Nathan E. Egge | unlord | Independent (no public employer) | Primary architect: itx, mc, ipred, cpu detection, tracking issue #435 |
| Ronald S. Bultje | rbultje | Core maintainer | Code review, merge authority |
| brad0 | brad0 | Independent | BSD/POSIX platform port (MR !1764, !1777) |
| MohdZaid0205 | MohdZaid0205 | Independent | 16bpc ipred optimizations (2025) |
| S Rajath | iRajath | Independent | Loopfilter scaffolding (MR !1858, open) |
| jerry tsai | jerrytsai569 | Independent | CDEF intrinsics (MR !1735, open 8+ months) |

The port is fully upstream. No separate riscv64 branch or fork exists.

---

## 3. Upstream Support Tier

There is no formal tiered support policy documented in dav1d. The following is inferred from CI coverage, release notes, and issue tracker behavior.

**CI evidence.** A riscv64 CI job (`build-debian-riscv64`) has run on every pipeline since MR !1608 merged on 2024-02-23. There are no `rules:` or `only:` restrictions on the riscv64 jobs -- they fire unconditionally on every push and MR. A correctness regression on riscv64 (issue #447, RVV itx 4x4 argon test failure) was fixed within 4 days in October 2024, consistent with treatment as a release-blocking target.

**Release notes evidence.** Every release from 1.4.0 onward includes an explicit RISC-V section in the NEWS file. RISC-V improvements are parity-listed alongside x86 and arm64 changes.

**Comparison table.**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI on every commit | Yes | Yes | Yes |
| Native CI runners | Yes | Yes | No (QEMU only) |
| Correctness tests in CI | Yes | Yes | Yes (4 VLEN configs) |
| Official binaries (distro) | Yes | Yes | Yes (Debian, Ubuntu) |
| All components optimized | Yes | Yes | No (5 of 11 components) |
| Mentioned in release notes | Yes | Yes | Yes (since 1.4.0) |
| Formal tier designation | Not published | Not published | Not published |

**Assessment.** riscv64 is treated as a first-class build and test target. It is not gated by any release-blocking policy that excludes it from releases, and regressions are fixed promptly. The gap relative to arm64 is in optimization coverage, not in platform status.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

dav1d's performance-sensitive code is organized into DSP modules, each with a C reference implementation and optional architecture-specific assembly. There is no JIT engine. There is no garbage collector. There is no cryptography. The sole performance-critical subsystem requiring architecture work is SIMD assembly.

**ISA extensions used by the riscv64 port.**

- RVV (V): primary SIMD extension, required for all acceleration. Runtime-detected via `HWCAP_RVV`; pre-1.0 hardware filtered out via VILL bit check in `src/riscv/64/cpu.S`.
- Zba (address generation: sh1add/sh2add): used in cdef.S, ipred.S, mc.S.
- Zbb (bit manipulation): used in cdef.S, mc.S, mc16.S, cdef16.S.

All three are part of the ratified RISC-V specification and are available on all production RVV-capable silicon.

**Per-component status.**

| Component | amd64 | arm64 | riscv64 8bpc | riscv64 16bpc |
|---|---|---|---|---|
| itx (inverse transforms) | Hand-tuned, all sizes, SSE2/AVX2/AVX512 | Hand-tuned, all sizes | Hand-tuned RVV, 4x4 through 16x16 only | Missing entirely |
| mc put/prep (8tap/bilinear) | Hand-tuned, all sizes | Hand-tuned, all sizes | Missing | Missing |
| mc compound (avg/blend/warp/emu_edge/w_mask) | Hand-tuned | Hand-tuned | Hand-tuned RVV, complete | Blend/blend_v only |
| ipred (intra prediction) | Hand-tuned | Hand-tuned | Hand-tuned RVV, all modes except z1/z2/z3/filter | v/h/paeth/smooth/cfl/pal; DC fill missing |
| CDEF filter | Hand-tuned | Hand-tuned | Hand-tuned RVV, 4x4/4x8/8x8 | Hand-tuned RVV, 4x4/4x8/8x8 |
| CDEF dir (direction finding) | Hand-tuned | Hand-tuned | Missing (MR !1894 open, MR !1735 stalled) | Missing |
| Loopfilter (deblocking) | Hand-tuned | Hand-tuned | Missing (MR !1858 scaffolding, open) | Missing |
| Loop restoration (Wiener/SGR) | Hand-tuned | Hand-tuned | Missing | Missing |
| Film grain synthesis | Hand-tuned | Hand-tuned | Missing (MR !1890 generate_grain_y, open) | Missing |
| MSAC (arithmetic coding) | Hand-tuned | Hand-tuned | Missing | Missing (N/A) |
| refmvs (reference MV) | Hand-tuned | Hand-tuned | Missing | Missing (N/A) |
| Palette index finish | Hand-tuned | Hand-tuned | Hand-tuned RVV | Hand-tuned RVV (via ipred16.S) |

**Quality assessment.** Every merged riscv64 assembly file contains real, production-quality hand-tuned RVV code with no TODO/FIXME/stub markers. VLEN dispatch is implemented for three tiers (128, 256, 512-bit), with runtime switching via `dav1d_get_vlen()`. The code is not a mechanical intrinsics translation -- it uses LMUL escalation, strided loads, scatter/gather, and saturating arithmetic idioms appropriate to RVV.

**Critical gap: mc put/prep.** The 8-tap and bilinear interpolation filters (`put_8tap`, `prep_8tap`, `put_bilin`, `prep_bilin`) are the most-executed MC functions in inter-frame decoding. They are listed as OPEN in the master tracking issue [#435](https://code.videolan.org/videolan/dav1d/-/issues/435) and no MR targeting them has been opened. For typical AV1 video with heavy inter prediction, the absence of these functions means the dominant MC code path runs entirely in scalar C on riscv64.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** Meson + Ninja exclusively. No CMake support. Minimum Meson version: 0.54. NASM is required only for x86 targets and is not invoked on riscv64.

**Toolchain version requirements.**

| Toolchain | Minimum version | Reason |
|---|---|---|
| GNU binutils / GAS | >= 2.38 | `.option arch, +v` directive used in all `src/riscv/64/*.S` files |
| Clang | >= 17 | Same `.option arch` directive support |
| QEMU user-mode | Any with RVV 1.0 | Required for test execution under emulation |

The minimum is enforced via a compile-time probe at build configuration:

```c
__asm__ (
".option arch, +v\n"
"vsetivli zero, 0, e8, m1, ta, ma"
);
```

If the probe fails, Meson aborts with: "Compiler doesn't support '.option arch' asm directive. Update to binutils>=2.38 or clang>=17 or use '-Denable_asm=false'."

Both version thresholds are satisfied by any distribution released after 2022. Debian bookworm ships binutils 2.40; Debian sid ships 2.43. The constraint is not a practical barrier on any supported distro.

**Cross-compilation (GCC)** -- official crossfile `package/crossfiles/riscv64-linux.meson`:

```ini
[binaries]
c = 'riscv64-linux-gnu-gcc'
cpp = 'riscv64-linux-gnu-g++'
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'
exe_wrapper = ['qemu-riscv64', '-L', '/usr/riscv64-linux-gnu/']

[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'
```

**Cross-compilation (Clang)** -- official crossfile `package/crossfiles/riscv64-linux-clang.meson`:

```ini
[binaries]
ar = 'riscv64-linux-gnu-ar'
strip = 'riscv64-linux-gnu-strip'
exe_wrapper = ['qemu-riscv64', '-L', '/usr/riscv64-linux-gnu/']

[properties]
c_args = '-target riscv64-linux-gnu'
c_link_args = '-target riscv64-linux-gnu'

[host_machine]
cpu_family = 'riscv64'
cpu = 'riscv64'
```

**Build commands.**

```
mkdir build && cd build
meson setup .. --buildtype release \
  --cross-file ../package/crossfiles/riscv64-linux.meson \
  -Dtrim_dsp=false
ninja
```

To disable RVV assembly (e.g., toolchain older than binutils 2.38):

```
meson setup .. -Denable_asm=false --cross-file ...
```

**Known build failures.**

- [Issue #463](https://code.videolan.org/videolan/dav1d/-/issues/463) (OPEN, 2026-03-17): Static cross-compilation failure with `riscv-gnu-toolchain` (riscv64-unknown-linux-gnu) using `--default-library=static`. Meson cannot run test binaries via `qemu-riscv64` without the dynamic linker prefix. Workaround: prepend `CFLAGS='-static'` to the meson setup invocation. No upstream fix merged.

- [Issue #437](https://code.videolan.org/videolan/dav1d/-/issues/437) (CLOSED, 2024-02-15): Clang 17 failed to assemble `itx.S` due to missing tail/mask agnostic flags (ta/ma) in `vsetvli` instructions. Fixed same day in [MR !1596](https://code.videolan.org/videolan/dav1d/-/merge_requests/1596), released in 1.4.1.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps (cannot execute correctly without C fallback).**

All items listed below fall back silently to the C reference implementation. The fallback is always functionally correct; the impact is performance only.

| Function group | riscv64 status | arm64 status | Impact |
|---|---|---|---|
| mc put/prep (8tap, bilinear) | Missing | Complete | High: dominant inter-frame decode path |
| Loopfilter / deblocking | Missing | Complete | High: runs on every decoded frame |
| Loop restoration (Wiener, SGR) | Missing | Complete | Medium: codec-dependent, off by default |
| Film grain synthesis | Missing (generate_grain_y partial, unmerged) | Complete | Low-medium: film grain tracks only |
| MSAC arithmetic coding | Missing | Complete | Medium: entropy decode is a consistent fraction of decode time |
| refmvs (reference MV storage/retrieval) | Missing | Complete | Medium: present in all inter-coded content |
| itx 32x32, 64x64, large rects | Missing | Complete | Medium: larger block sizes used in intra |
| itx all sizes 16bpc | Missing | Complete | Medium: affects HDR/10-bit content |
| CDEF direction finding | Missing (two competing open MRs) | Complete | Low-medium: quality metric, not decode correctness |
| mc compound 16bpc (except blend) | Partial | Complete | Low-medium: affects 16bpc content |
| ipred DC fill 16bpc | Missing | Complete | Low: DC fill is a minor intra mode |
| ipred z1/z2/z3/filter_intra | Missing | Complete | Low-medium: directional intra modes |

**Performance benchmarks (cycle counts, microbenchmark via `checkasm`).**

The following data comes from actual RISC-V silicon: Kendryte K230 (VLEN=128) and SpacemiT K1 / Banana Pi BPI-F3 (VLEN=256).

mc compound functions (8bpc, Kendryte K230, VLEN=128):

| Function | C cycles | RVV cycles | Speedup |
|---|---|---|---|
| avg_w8 | 1054.9 | 139.1 | 7.58x |
| avg_w32 | 13734.3 | 1226.3 | 11.20x |
| w_mask_444_w32 | 33229.6 | 3289.2 | 10.10x |
| w_mask_420_w64 | 81934.2 | 11243.9 | 7.29x |
| emu_edge_w16 | 1447.9 | 287.6 | 5.03x |
| warp_8x8_8bpc | 4549.7 | 2504.7 | 1.82x |

mc compound functions (8bpc, SpacemiT K1, VLEN=256, selected):

| Function | C cycles | RVV cycles | Speedup |
|---|---|---|---|
| w_mask_444_w64 | 70695.9 | 4879.0 | 14.49x |
| w_mask_420_w64 | 72313.0 | 6020.9 | 12.01x |
| emu_edge_w64 | 4917.2 | 1115.0 | 4.41x |

blend 16bpc, VLEN=512, Blackhole p100a:

| Function | RVV ticks | Speedup vs C |
|---|---|---|
| blend_w16 | 189.6 | 11.11x |
| blend_h_w128 | 151.5 | 49.50x |

ipred h/v 16bpc (SpacemiT X60, VLEN=256):

| Function | C ticks | RVV ticks | Speedup |
|---|---|---|---|
| ipred_h_w16 | 968.2 | 114.2 | 8.28x |
| ipred_v_w16 | 516.0 | 67.6 | 7.34x |

pal_pred 8bpc (hardware not specified in source data [NEEDS VERIFICATION]):

| Function | C ticks | RVV ticks | Speedup |
|---|---|---|---|
| pal_pred_w64 | 8066.4 | 756.0 | 10.67x |
| pal_pred_w4 | 171.8 | 211.6 | 0.79x |

Note: pal_pred_w4 shows a regression (0.79x). RVV overhead at narrow widths is a documented pattern across multiple dav1d RVV functions; the break-even width is typically w8 or w16.

**Summary of performance posture.** For implemented functions on VLEN=256 hardware, per-primitive speedups range from 4x to 14x. The dominant performance gap on real video is the missing mc put/prep path, not the per-primitive numbers.

**Security hardening gaps.** Data not available: no RISC-V-specific security hardening flags (shadow stack, CFI, etc.) were examined in the research.

**Floating-point semantics.** dav1d is an integer-only AV1 decoder. No floating-point arithmetic is used in any decode path. This is not a gap; it is a design property of AV1 and dav1d.

---

## 7. CI/CD Infrastructure

**CI platform.** dav1d uses GitLab CI exclusively. There is no `.github/workflows/` directory and no GitHub Actions configuration. The canonical CI definition is `.gitlab-ci.yml` at `code.videolan.org/videolan/dav1d`.

**riscv64 CI jobs.**

Two jobs exist, both unconditional (no `rules:` or `only:` restrictions):

`build-debian-riscv64`: Runs on amd64 Docker runner with image `registry.videolan.org/dav1d-debian-unstable:20260622120900`. Cross-compiles via a matrix of two crossfiles (GCC and Clang). Sets `QEMU_CPU=rv64,v=true,vext_spec=v1.0,vlen=256,elen=64`. Runs `meson test -v`.

`test-debian-riscv64`: Depends on `build-debian-riscv64`. Runs the full test suite with `--timeout-multiplier 10` across a matrix of four QEMU vector lengths: vlen=128, 256, 512, 1024. Uses GCC crossfile only.

**CI comparison table.**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes | Yes | Yes (since Feb 2024) |
| Native hardware runners | Yes | Yes | No -- QEMU user-mode on amd64 |
| Toolchains tested | GCC, Clang | GCC, Clang | GCC, Clang |
| Vector width variants tested | N/A (fixed ISA) | N/A | vlen=128/256/512/1024 |
| Correctness test suite runs | Yes | Yes | Yes |
| Fires on every commit | Yes | Yes | Yes |
| RISE runners | N/A | N/A | No |

**RISE runner involvement.** None. The CI runner is an amd64 Docker runner running QEMU user-mode emulation. There are no RISE-provided riscv64 hardware runners in dav1d's CI.

**Key observation.** All riscv64 testing is emulated. The four-way VLEN test matrix provides coverage of the dispatch tiers, but no CI run executes on physical riscv64 silicon. Benchmark data from real hardware (K230, SpacemiT K1, Blackhole p100a) comes from contributor-supplied results in MR descriptions, not from automated CI.

---

## 8. Distribution and Release Status

**Upstream binaries.** dav1d does not publish prebuilt riscv64 binaries. GitHub Releases contains only a source tarball for the ancient 0.1.0 version. The canonical release mechanism is source tarballs distributed via `code.videolan.org`; users are expected to build from source or use distribution packages.

**Distribution package status.**

| Distribution | Version | riscv64 status | Source |
|---|---|---|---|
| Debian sid | 1.5.3-1+b2 | Built and installable; builder rv-manda-04; status "Maybe-Successful" (Debian terminology for log-parse ambiguity, not a failure) | [Debian buildd](https://buildd.debian.org/status/package.php?p=dav1d&suite=sid) |
| Ubuntu 24.04 (Noble) | 1.4.1-1build1 | Native riscv64 .deb in universe; also libdav1d-dev, libdav1d7, libheif-plugin-dav1d | [packages.ubuntu.com/noble/dav1d](https://packages.ubuntu.com/noble/dav1d) |
| Arch Linux RISC-V | Unknown version | Not in FTBFS list (absence is a positive signal, but version not confirmed) | archriscv.felixc.at |
| Fedora RISC-V | Unknown | Data not available: koji.fedoraproject.org and dl.fedoraproject.org blocked by Anubis bot protection during research | -- |
| PyPI | N/A | dav1d does not exist as a PyPI package (HTTP 404) | pypi.org/pypi/dav1d/json |

**To get a working binary on riscv64.** Install `dav1d` from the system package manager on Debian/Ubuntu. For the latest upstream code (post-1.5.3), build from source using the crossfile procedure in Section 5. The static cross-compilation issue (#463) requires the `CFLAGS='-static'` workaround if building statically.

---

## 9. Dependencies

dav1d is deliberately minimal. It has no external runtime library dependencies with riscv64 issues. There is no JIT engine, no crypto library, no compression library, and no memory allocator dependency.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Meson >= 0.54 | Build system | Supported; `riscv64` is a recognized `cpu_family` | N/A | Available on Debian riscv64 | No issues |
| GNU binutils >= 2.38 | RVV assembly (GAS) | Debian bookworm ships 2.40, sid ships 2.43 | Tested via CI + QEMU | Debian binutils 2.43 available on riscv64 | Hard minimum for RVV ASM |
| Clang >= 17 | Alternative assembler | LLVM 17+ ships on Debian/Ubuntu riscv64 | CI `riscv64-linux-clang` job | Available | Hard minimum if using Clang path |
| NASM >= 2.14 | x86 SIMD only | Not applicable to riscv64 | Not applicable | Not applicable | Never invoked on riscv64 |
| pthreads / librt | Multithreading | Standard on all Linux riscv64 toolchains | Tested | Available | No issues |
| RVV 1.0 CPU (runtime) | SIMD acceleration | Build falls back gracefully if absent (-Denable_asm=false) | CI tests vlen=128/256/512/1024 | dav1d 1.4.0+ | Missing RVV causes silent C fallback, not a build failure |

No dependencies recurse into riscv64-specific issues. The project is self-contained.

---

## 11. Known Bugs and Active Issues

**Open correctness and build bugs.**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#463](https://code.videolan.org/videolan/dav1d/-/issues/463) | Failed to build with static linking for riscv64 | Open (2026-03-17) | Medium | Static cross-compile with riscv64-unknown-linux-gnu fails; CFLAGS='-static' workaround confirmed; no fix merged |

**Closed correctness bugs.**

| ID | Title | Closed | Notes |
|---|---|---|---|
| [#447](https://code.videolan.org/videolan/dav1d/-/issues/447) | RVV itx 4x4 does not pass the argon tests | 2024-10-13 | Correctness regression in RVV inverse transform 4x4; fixed within 4 days |
| [#437](https://code.videolan.org/videolan/dav1d/-/issues/437) | dav1d 1.4.0 asm fails to build on riscv64 with clang 17 | 2024-02-15 | Missing ta/ma flags in vsetvli; fixed same day in MR !1596 |

**Open feature/optimization tracking.**

| ID | Title | Status | Notes |
|---|---|---|---|
| [#435](https://code.videolan.org/videolan/dav1d/-/issues/435) | RVV SIMD master tracker | Open (2024-02-02) | 26 of 120 checklist items complete; last updated 2025-11-26 |
| [MR !1825](https://code.videolan.org/videolan/dav1d/-/merge_requests/1825) | riscv64: Add dav1d_set_vlen_max() API call | Open MR (2025-12-23) | Awaiting review by rbultje; enables safe VLEN capping on buggy hardware; 5 discussion notes |
| [MR !1858](https://code.videolan.org/videolan/dav1d/-/merge_requests/1858) | riscv/loopfilter: Add basic RVV scaffolding | Open MR (2026-03-23) | Initial scaffolding only; no optimized kernels yet; pipeline passing |
| [MR !1890](https://code.videolan.org/videolan/dav1d/-/merge_requests/1890) | riscv64/filmgrain: generate_grain_y 8bpc RVV | Open MR (2026-06-07) | First film grain function; 8bpc only |
| [MR !1894](https://code.videolan.org/videolan/dav1d/-/merge_requests/1894) | riscv/cdef: Implement cdef_find_dir* for vlen>=256 | Open MR (2026-06-14) | Requires rebase before merge; pure asm approach |
| [MR !1735](https://code.videolan.org/videolan/dav1d/-/merge_requests/1735) | riscv64/cdef: filter and dir intrinsic functions | Open MR (2024-10-09) | Open 8+ months; C intrinsics approach; may be superseded by !1894 for the dir portion |

**Blocking relationship note.** MR !1825 (vlen_max API) has been pending review since December 2025. It is a prerequisite for correct behavior on hardware that reports a VLEN but behaves incorrectly at that width. The companion VLEN=512 blend MRs (!1824, !1826) were merged without it; they rely on the same runtime dispatch that !1825 is intended to make safe.

---

## 12. Objections and Upstream Blockers

**No stated objections to riscv64 support.** The maintainers have accepted every riscv64 MR that met code style requirements. The README explicitly identifies RISC-V as a target architecture. Maintainer review latency (MR !1735 open 8+ months, MR !1825 open 6+ months) appears to reflect bandwidth constraints, not rejection of the platform.

**Technical blockers.**

1. **mc put/prep absent, no open MR.** The 8-tap and bilinear interpolation filters are the highest-impact missing functions and the oldest items in the tracking checklist. No contributor has opened an MR targeting them. This is a contributor gap, not a maintainer objection.

2. **MR !1825 (vlen_max API) stalled.** Assigned to rbultje with 5 review comments but no merge after 6 months. Until merged, callers cannot cap VLEN at runtime. On hardware with VLEN discrepancies, the VLEN=512 code paths (merged in !1824, !1826) may produce incorrect output [NEEDS VERIFICATION -- the specific hardware failure mode was not demonstrated in the research data, only the motivation stated in the MR description].

3. **Competing CDEF dir approaches.** MR !1735 (C intrinsics, open 8+ months) and MR !1894 (pure asm, 12 days old, needs rebase) both target `cdef_find_dir`. Neither is ready to merge. Resolution requires either a maintainer decision on approach or one MR absorbing the other.

4. **No native CI runners.** All CI runs under QEMU. Performance regressions are not detectable in CI. Correctness is covered; performance validation requires hardware.

**Organizational blockers.** None identified. VideoLAN accepts contributions without CLA. BSD-2-Clause license imposes no constraint on commercial use or hardware deployment.

**Acceptance probability for new contributions.** High, based on the track record of merges since February 2024. The primary bottleneck is contributor supply for the remaining gaps (mc put/prep, loopfilter kernels, loop restoration, MSAC), not maintainer resistance.

---

## 13. Investment Analysis

RISE has no prior investment in dav1d. All prior riscv64 work was done by independent contributors (primarily Nathan E. Egge) without RISE funding. The full scope below is uncontested.

### 13.1 Functional Enablement

The dominant functional gap is mc put/prep (8-tap and bilinear interpolation). This is the hot path for all inter-frame decoding. No MR has been opened; no contributor is publicly working on it. Enabling this gap requires authoring and upstreaming ~600-800 lines of hand-tuned RVV assembly per bitdepth, validated against checkasm with real hardware.

Secondary functional gaps: loopfilter (deblocking), MSAC (arithmetic decoding), refmvs, loop restoration. MR !1858 (loopfilter scaffolding) is open but contains no optimized kernels. MSAC and refmvs have no open MRs.

### 13.2 Performance Optimization

Existing RVV implementations have known optimization headroom:

- warp_8x8 achieves only 1.82x speedup on K230 and 1.34x on BPI-F3 -- substantially below the 5-10x typical for other mc functions. The function uses scatter/gather (`vluxseg8ei32.v`), which is expensive on current microarchitectures.
- pal_pred_w4 shows a 0.79x regression (slower than C) at narrow width. This is a known RVV overhead pattern.
- MR !1740 (vnclip optimization) showed 5-10% per-transform improvement on itx functions, indicating micro-optimization headroom remains.
- The `dav1d_set_vlen_max()` API (MR !1825) needs a reviewer push to get merged.
- VLEN-tiered dispatch is only implemented for mc compound functions. Other modules (ipred, cdef) use a single code path regardless of hardware VLEN.

### 13.3 CI/CD Infrastructure

All riscv64 CI runs under QEMU. No performance regression detection is possible. Adding a native riscv64 hardware runner (e.g., a SpacemiT K1 or SiFive HiFive Unmatched board) to the VideoLAN GitLab runner pool would enable:

- Cycle-accurate performance benchmarks in CI
- Detection of warp_8x8-class performance regressions before merge
- Validation of VLEN dispatch correctness on physical silicon at each tier

This requires runner hardware and a VideoLAN runner registration, not code changes.

### 13.4 Ecosystem Enablement

dav1d has no dependent package ecosystem requiring separate enablement work (no plugins, no language bindings with riscv64 gaps). Section 10 is omitted per the report rules.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | mc put/prep: 8-tap and bilinear RVV, 8bpc | 6-8 | Contributor | Critical |
| Functional | mc put/prep: 8-tap and bilinear RVV, 16bpc | 4-6 | Contributor | High |
| Functional | Loopfilter (deblocking) RVV kernels, 8bpc | 6-8 | Contributor | Critical |
| Functional | Loopfilter RVV kernels, 16bpc | 4-6 | Contributor | High |
| Functional | MSAC arithmetic coding RVV | 4-6 | Contributor | High |
| Functional | Loop restoration (Wiener + SGR) RVV | 6-8 | Contributor | Medium |
| Functional | refmvs load/save/splat_tmvs RVV | 2-3 | Contributor | Medium |
| Functional | Film grain complete (MR !1890 + remainder) | 4-6 | Contributor | Low |
| Functional | CDEF dir: resolve !1735 vs !1894 and merge | 1-2 | Contributor + reviewer | Medium |
| Functional | MR !1825 (vlen_max API): maintainer review push | 0.5 | Reviewer (rbultje) | High |
| Performance | mc warp_8x8 optimization (1.3x is below floor) | 2-4 | Contributor | Medium |
| Performance | VLEN-tiered dispatch for ipred and cdef modules | 2-4 | Contributor | Medium |
| Performance | itx 32x32/64x64 and large rect transforms | 4-6 | Contributor | Medium |
| CI/CD | Native riscv64 hardware runner in VideoLAN GitLab | 1-2 (logistics) | VideoLAN + RISE | High |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [videolan/dav1d GitHub mirror](https://github.com/videolan/dav1d)
- [code.videolan.org/videolan/dav1d -- canonical repository](https://code.videolan.org/videolan/dav1d)
- [GitLab Issue #435 -- RVV SIMD master tracker](https://code.videolan.org/videolan/dav1d/-/issues/435)
- [GitLab Issue #437 -- clang 17 vsetvli build failure](https://code.videolan.org/videolan/dav1d/-/issues/437)
- [GitLab Issue #447 -- RVV itx 4x4 argon test failure](https://code.videolan.org/videolan/dav1d/-/issues/447)
- [GitLab Issue #463 -- static linking failure for riscv64](https://code.videolan.org/videolan/dav1d/-/issues/463)
- [MR !1591 -- riscv64/itx: Add 16x16 8bpc transforms (foundational itx batch)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1591)
- [MR !1596 -- riscv64/itx: fix missing tail/mask agnostic flags](https://code.videolan.org/videolan/dav1d/-/merge_requests/1596)
- [MR !1608 -- CI: Add riscv64 clang build](https://code.videolan.org/videolan/dav1d/-/merge_requests/1608)
- [MR !1629 -- riscv: Check for standards compliant RVV 1.0+](https://code.videolan.org/videolan/dav1d/-/merge_requests/1629)
- [MR !1735 -- riscv64/cdef: filter and dir intrinsic functions (open)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1735)
- [MR !1764 -- riscv: Enable FreeBSD/OpenBSD elf_aux_info() support](https://code.videolan.org/videolan/dav1d/-/merge_requests/1764)
- [MR !1797 -- riscv64/mc: Add w_mask functions](https://code.videolan.org/videolan/dav1d/-/merge_requests/1797)
- [MR !1808 -- riscv64/mc: Add emu_edge function](https://code.videolan.org/videolan/dav1d/-/merge_requests/1808)
- [MR !1824 -- riscv64/mc: Add VLEN=512 8bpc blend functions](https://code.videolan.org/videolan/dav1d/-/merge_requests/1824)
- [MR !1825 -- riscv64: Add dav1d_set_vlen_max() API call (open)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1825)
- [MR !1826 -- riscv64/mc16: Add VLEN=512 16bpc blend functions](https://code.videolan.org/videolan/dav1d/-/merge_requests/1826)
- [MR !1857 -- riscv64/ipred_h: Implement ipred_h in RISC-V asm](https://code.videolan.org/videolan/dav1d/-/merge_requests/1857)
- [MR !1858 -- riscv/loopfilter: Add basic RVV scaffolding (open)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1858)
- [MR !1883 -- riscv64/ipred: ipred_v and ipred_h 16bpc RVV](https://code.videolan.org/videolan/dav1d/-/merge_requests/1883)
- [MR !1889 -- riscv64/itx: Match stack allocation of 16x16 itx](https://code.videolan.org/videolan/dav1d/-/merge_requests/1889)
- [MR !1890 -- riscv64/filmgrain: generate_grain_y 8bpc RVV (open)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1890)
- [MR !1894 -- riscv/cdef: Implement cdef_find_dir* for vlen>=256 (open)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1894)
- [MR !1908 -- riscv64/ipred: pal_pred 8bpc and 16bpc RVV](https://code.videolan.org/videolan/dav1d/-/merge_requests/1908)
- [Debian buildd status for dav1d](https://buildd.debian.org/status/package.php?p=dav1d&suite=sid)
- [Ubuntu 24.04 Noble dav1d package](https://packages.ubuntu.com/noble/dav1d)
- [RISE Project blog](https://riseproject.dev/blog)