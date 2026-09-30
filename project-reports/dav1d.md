---
title: dav1d
parent: Project Reports
color: yellow
dependencies:
  - name: Meson
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: SDL2
    relation: runtime-dependency
    criticality: optional
  - name: pkg-config
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="dav1d" %}

# dav1d

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Optimization level:** minimal<br/>
**Scope:** RISC-V (riscv64/linux) support status for dav1d<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

dav1d is a BSD-2-Clause-licensed AV1 video decoder developed jointly by [VideoLAN](https://code.videolan.org/videolan/dav1d) (a French non-profit association) and the broader FFmpeg community, with partial funding from the Alliance for Open Media (AOM). It is explicitly positioned as "the reference fast decoder" for AV1: the codebase is pure C99 with hand-written, architecture-specific SIMD assembly for every performance-critical DSP path (x86, ARM, PPC, LoongArch, RISC-V). There is no JIT, no garbage collector, and no cryptography in the library; its only mandatory runtime dependencies are pthreads, libm and libdl.

**Governance.** VideoLAN holds collective-work rights; individual contributors retain copyright and authorship. There is no CLA, only a requirement for valid (non-anonymous) authorship and agreement to the AV1 patent license before committing. No formal MAINTAINERS file exists in the repository; governance runs informally through merge-request review on `code.videolan.org`, with `git shortlog` as the authoritative contributor record.

**Corporate sponsors and affiliated maintainers.** AOM (Amazon, Cisco, Google, Intel, Microsoft, Mozilla, Netflix, Apple) funded the project's creation. THANKS.md credits Two Orioles, LLC for "important coding effort" (the commercial entity most associated with day-to-day core development) and VideoLabs SAS (tied to VideoLAN founder Jean-Baptiste Kempf). The primary RISC-V author and maintainer, **Nathan E. Egge**, committed the first RISC-V support as `unlord@xiph.org` (Mozilla/Xiph.Org Foundation) in 2022; by the time of his 2024 RISC-V Summit Europe talk and subsequent GitLab activity his affiliation is `negge@google.com` -- he is now at **Google LLC** and serves as RISE TSC co-chair (formerly chair of its System Libraries Working Group). Luca Barbato co-mentored the 2025 Google Summer of Code RISC-V Vector optimization project alongside Egge. Other long-standing authors with industry ties include Ronald S. Bultje (Two Orioles, core maintainer), Martin Storsjo, Janne Grunau, James Almer (FFmpeg), Jean-Baptiste Kempf (VideoLabs), and Wan-Teh Chang / Dale Curtis (Google/Chromium).

**Community stance on new ports.** CONTRIBUTING.md actively solicits "platform-specific developers." The technical bar is uniform across architectures: pure C99, target-specific GAS-subset assembly, no C++ in the library, and mandatory checkasm/CI passing. In practice the RISC-V port has strong institutional backing -- championed by a Google-employed RISE TSC co-chair, sustained by multi-year multi-contributor activity, and selected as a mentored 2025 Google Summer of Code project whose merge requests passed checkasm/Argon conformance testing.

**RISE involvement.** dav1d is tracked by RISE's System Libraries Working Group as page **SL_01_002**, migrated from Confluence to [`riseproject-dev/system-libraries-wg` issue #20](https://github.com/riseproject-dev/system-libraries-wg/issues/20) (opened 2026-07-27). The issue is a monitoring/tracking record of upstream progress (timeline: Oct 2022 initial support merged, late-2023 two-part WG presentation on RVV 1.0 integration, Feb 2024 additional transform work) -- it is not evidence of direct RISE funding of the port. RISE's `python-wheels` CI separately merged [PR #1865](https://github.com/riseproject-dev/python-wheels/pull/1865) adding a Bazel `BUILD`-file patch so that tensorstore, which vendors a copy of dav1d, can build for riscv64; this patches dav1d only as a vendored dependency inside another package's wheel build, not upstream dav1d itself. No RISE blog post covers dav1d, and dav1d/VideoLAN do not appear on RISE's [members list](https://riseproject.dev) (Premier: Alibaba Damo, Google, Intel, MediaTek, NVIDIA, Qualcomm, Red Hat, Rivos, Samsung, SiFive, Tenstorrent, Ventana; General: Akeana, AMD, Andes, Beijing ESWIN, BOSC, Canonical, ByteDance/Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE).

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the canonical [code.videolan.org/videolan/dav1d](https://code.videolan.org/videolan/dav1d) repository; there are no downstream forks carrying RISC-V patches.

The first RISC-V commit, `61251bc9a29049acfb58429d87d8fbb60c20ef82` ("Add initial RISC-V support"), was authored by Nathan E. Egge `<unlord@xiph.org>` on **2022-10-30**. Development then proceeded steadily through 2026:

| Date | Event | Source |
|---|---|---|
| 2022-10-30 | First commit: "Add initial RISC-V support" (CPU feature detection via `getauxval(AT_HWCAP)`) | local-clone git log, commit 61251bc |
| 2024-02-14 | MR !1591 merged: 16x16 8bpc itx transforms; dav1d 1.4.0 released ("New architecture supported: RISC-V") | [MR !1591](https://code.videolan.org/videolan/dav1d/-/merge_requests/1591) |
| 2024-02-15 | Issue #437 (clang 17 vsetvli build failure) opened and closed same window | [issue #437](https://code.videolan.org/videolan/dav1d/-/issues/437) |
| 2024-02-19/21 | MR !1596 (missing ta/ma flags fix), MR !1600 (rectangular itx sizes) merged; dav1d 1.4.1 | [MR !1596](https://code.videolan.org/videolan/dav1d/-/merge_requests/1596) |
| 2024-02-23 | MR !1608 merged: "CI: Add riscv64 clang build" | [MR !1608](https://code.videolan.org/videolan/dav1d/-/merge_requests/1608) |
| 2024-05-06 | MR !1629 merged: reject non-compliant pre-1.0 RVV silicon (e.g. T-Head C910); dav1d 1.4.2 | [MR !1629](https://code.videolan.org/videolan/dav1d/-/merge_requests/1629) |
| 2024-10-01/11 | MR !1731 merged: largest single RVV batch (mc avg/mask/w_avg/blend/warp8x8, ipred smooth/paeth/cfl/pal, CDEF filter) | [MR !1731](https://code.videolan.org/videolan/dav1d/-/merge_requests/1731) |
| 2024-10-13 | MR !1737 merged: fix Argon test failure (issue #447); dav1d 1.5.0 | [MR !1737](https://code.videolan.org/videolan/dav1d/-/merge_requests/1737) |
| 2024-10-29 to 2024-11-05 | MR !1746-!1752 merged: 16bpc mc16 blend/blend_v; dav1d 1.5.1 | [MR !1748](https://code.videolan.org/videolan/dav1d/-/merge_requests/1748) |
| 2024-11-21, 2024-12-29 | MR !1764 (FreeBSD/OpenBSD `elf_aux_info()`), MR !1777 (non-Linux build fix) merged | [MR !1764](https://code.videolan.org/videolan/dav1d/-/merge_requests/1764) |
| 2025-11-05/06 | MR !1808 (emu_edge), MR !1797 (w_mask 420/422/444) merged | [MR !1797](https://code.videolan.org/videolan/dav1d/-/merge_requests/1797) |
| 2025-12-23/26 | MR !1824, !1826 merged: VLEN=512 8bpc/16bpc blend functions | [MR !1824](https://code.videolan.org/videolan/dav1d/-/merge_requests/1824) |
| 2025-12-31 | dav1d 1.5.3 released | NEWS file |
| 2025-12-23 | MR !1825 opened: `dav1d_set_vlen_max()` API (still open) | [MR !1825](https://code.videolan.org/videolan/dav1d/-/merge_requests/1825) |
| 2026-03-17 | Issue #463 opened: static-link cross-compile failure (still open) | [issue #463](https://code.videolan.org/videolan/dav1d/-/issues/463) |
| 2026-05-12/15 | MR !1856, !1857 merged: ipred_v cleanup, ipred_h implementation | [MR !1857](https://code.videolan.org/videolan/dav1d/-/merge_requests/1857) |
| 2026-06-07 to 2026-06-28 | MR !1883, !1889, !1890, !1908 merged: 16bpc ipred_v/h, itx stack fix, generate_grain_y 8bpc, pal_pred optimization; dav1d 1.5.4 (2026-07-14) | [MR !1890](https://code.videolan.org/videolan/dav1d/-/merge_requests/1890) |
| 2026-09-16 | MR !1977 merged: fix SIGSEGV in generate_grain_y (targets unreleased 1.5.5) | [MR !1977](https://code.videolan.org/videolan/dav1d/-/merge_requests/1977) |

**Key contributors (2024-2026).** Nathan E. Egge (unlord, Google) remains the primary architect of the tracking issue and much of mc/itx/ipred work. A broadened, largely independent contributor base has since driven most 2025-2026 activity: Sungjoon Moon (mc w_mask/emu_edge, under handle OctopusET), Mohd Zaid (mdzaid: ipred 16bpc, film grain), Najmus Sakib Afsan (Afsan-z47: ipred_h, ipred_h optimization, cdef_find_dir, the static-link issue #463), S Rajath (iRajath: loopfilter scaffolding), jerry tsai (jerrytsai569: CDEF intrinsics), and Brad Smith (BSD/POSIX portability). The port is fully upstream; no separate riscv64 branch exists.

---

## 3. Upstream Support Tier

There is no formal, published tier policy in dav1d's own documentation (no tiering language in README.md or CONTRIBUTING.md), nor a codified numbered tier list published by RISE's System Libraries Working Group (whose criteria -- "alignment with upstream roadmap," "RISE member goals," impact -- are prioritization factors reviewed by its TSC and Board, not a public tier table). The closest signal is dav1d's own README roadmap, which lists x86 (AVX2, SSSE3+) and ARM (ARMv8/ARMv7, incl. high-bit-depth) as **"Reached"** milestones, while RISC-V sits under **"On-going"** alongside PPC and AVX-512 -- i.e. explicitly framed as a secondary, catch-up architecture relative to x86/ARM, with no formal exclusion.

**CI evidence.** `build-debian-riscv64` and `test-debian-riscv64` run unconditionally (no `rules:`/`only:` gating) on every commit in [`.gitlab-ci.yml`](https://code.videolan.org/videolan/dav1d/-/blob/master/.gitlab-ci.yml), cross-compiling with both GCC and Clang and testing under QEMU across four vector-length configurations. A correctness regression, issue #447 (RVV itx 4x4 Argon test failure), was fixed within days via MR !1737, consistent with release-blocking treatment.

**Release-notes evidence.** Every release since 1.4.0 lists explicit RISC-V line items alongside x86/arm64 changes in the NEWS file / [1.5 "Sonic"](https://jbkempf.com/blog/2025/dav1d-1.5/) and [1.5.4](https://jbkempf.com/blog/2026/dav1d-1.5.4/) release-note posts.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI on every commit | Yes | Yes | Yes (since Feb 2024) |
| Native CI hardware runners | Yes | Yes | No -- QEMU user-mode on amd64 |
| Correctness tests in CI | Yes | Yes | Yes (4 VLEN configs: 128/256/512/1024) |
| Official binaries (Debian/Ubuntu/Arch) | Yes | Yes | Yes |
| All DSP components optimized | Yes | Yes | No -- dominant motion-compensation path (8-tap/bilinear put/prep) is still scalar C |
| Mentioned in release notes | Yes | Yes | Yes (since 1.4.0) |
| Formal tier designation | Not published | Not published | Not published |

**Assessment.** riscv64 is treated as a first-class build and correctness-test target, and packaged by downstream distributions. The gap relative to x86/arm64 is optimization coverage of the highest-cost decode path, not platform status -- which is why this report's readiness grade (Section 13) differs from a pure CI-based grade.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

dav1d's RISC-V backend is real, production-quality hand-written RVV assembly, not a stub or intrinsics shim over scalar code. A direct clone inspection confirms **7,151 lines across 11 `.S` files** under `src/riscv/64/` (`cpu.S`, `pal.S`, `ipred.S`/`ipred16.S`, `itx.S`, `mc.S`/`mc16.S`, `cdef.S`/`cdef16.S`, `filmgrain.S`/`filmgrain16.S`), wired into each DSP module's init table via `ARCH_RISCV` branches, with `src/riscv/` also holding runtime CPU-detection code (`cpu.c`/`cpu.h`) and function-table headers. Dispatch uses the same bitdepth/cpu-flag function-pointer tables as all other architectures, gated at runtime by `DAV1D_RISCV_CPU_FLAG_V`; there is no JIT and no separate ASM ABI toggle (unlike PowerPC's vsx/pwr9 flags).

**ISA extensions used.** RVV (the "V" extension, required for any acceleration; `dav1d_has_compliant_rvv()` additionally filters out pre-1.0 hardware such as T-Head C910 on Scaleway, per [MR !1629](https://code.videolan.org/videolan/dav1d/-/merge_requests/1629)), plus Zba (address generation: sh1add/sh2add) and Zbb (bit manipulation), both ratified extensions available on all production RVV-capable silicon.

**Per-component status (8bpc / 16bpc), from the master tracking issue [#435](https://code.videolan.org/videolan/dav1d/-/issues/435) checklist cross-checked against merged MRs (note: the checklist's last edit was 2025-11-26, so several items merged afterward -- ipred_h, ipred_v/h 16bpc, pal_pred, generate_grain_y -- are not reflected in its checked/unchecked state; status below is as currently implemented in master, not as the checklist literally shows):**

| Component | 8bpc | 16bpc | Notes |
|---|---|---|---|
| mc avg/mask/w_avg, blend, warp8x8, emu_edge, w_mask | Hand-tuned RVV, complete | blend/blend_v only (VLEN=512 variants added) | Closed via !1731, !1748-!1754, !1797, !1808, !1824, !1826 |
| mc 8-tap put/prep, bilinear put/prep | **Missing -- scalar C** | **Missing -- scalar C** | No open MR targets this as of the harvest date; per !1731's own profiling this is the dominant remaining cost |
| itx (inverse transforms) | Partial: 4x4 through 16x16 and rectangular sizes | Missing entirely | 32x32/64x64 and all 16bpc transforms fall through to C |
| ipred v/h/paeth/smooth/cfl/pal | Hand-tuned RVV, complete | v/h added (!1883), pal_pred added (!1908); DC-fill variants still open (!1959) | z1/z2/z3 angular and cfl_ac chroma-from-luma accumulation missing in both bitdepths |
| CDEF filter | Hand-tuned RVV (4x4/4x8/8x8) | Hand-tuned RVV per issue checklist via !1691 -- **but the MR-tracker record shows !1691 as closed-unmerged**, a discrepancy [NEEDS VERIFICATION] | filter kernel present for 8bpc; 10/12bpc status uncertain |
| CDEF direction finding (`cdef_find_dir`) | Missing | Missing | Two competing open approaches: !1735 (C intrinsics, open 12+ months) and !1960 (asm, dependent on the closed-unmerged !1894) |
| Loopfilter / deblocking | Missing (WIP scaffolding only, !1858) | Missing | 8-commit branch explicitly bypasses coverage checks as "wip scaffolding" |
| Loop restoration (Wiener/SGR) | Missing | Missing | WIP branch referenced (`tmatth/dav1d riscv-wiener-v1`), not upstreamed |
| Film grain | generate_grain_y merged (!1890, fixed for a SIGSEGV by !1977); generate_grain_uv open (!1958) | Missing | fgy_32x32xn/fguv_32x32xn not implemented in either bitdepth |
| MSAC (arithmetic decoding) | Missing | N/A | decode_bool*/decode_symbol_adapt* entirely unaddressed |
| refmvs | Missing | N/A | load/save/splat_tmvs entirely unaddressed |

**Quality assessment.** Merged riscv64 assembly uses LMUL escalation, strided loads, and VLEN-tiered dispatch (128/256/512-bit variants for several mc functions) rather than a naive intrinsics translation. `dav1d_set_vlen_max()` (open MR !1825) would add a public API to cap VLEN at runtime, reflecting real hardware VLEN fragmentation (T-Head C910, SpacemiT K1, Kendryte K230, OrangePi RV2, Blackhole p100a).

**Critical gap.** The 8-tap and bilinear interpolation filters (`put_8tap`/`prep_8tap`/`put_bilin`/`prep_bilin`) are the most-executed motion-compensation functions in inter-frame decoding. Per [MR !1731](https://code.videolan.org/videolan/dav1d/-/merge_requests/1731)'s own self-reported profiling, after that batch merged, `prep_8tap_c` still accounts for ~72.6% and `put_8tap_c` ~4.0% of remaining CPU time (with `wiener_c` at ~4.7%) -- i.e. the single dominant hot path remains unoptimized scalar C, and no MR has since been opened against it.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** Meson (>= 0.54) + Ninja exclusively; no CMake support. NASM (>= 2.14) is required only for x86 targets and is never invoked on riscv64.

**Toolchain version requirements,** enforced by a compile-time probe in `meson.build` (lines ~588-596):

```c
__asm__ (
".option arch, +v\n"
"vsetivli zero, 0, e8, m1, ta, ma"
);
```

If this probe fails, Meson aborts with: *"Compiler doesn't support '.option arch' asm directive. Update to binutils>=2.38 or clang>=17 or use '-Denable_asm=false'."*

| Toolchain | Minimum | Reason |
|---|---|---|
| GNU binutils / GAS | >= 2.38 | `.option arch, +v` directive used in all `src/riscv/64/*.S` files |
| Clang | >= 17 | Same directive; earlier Clang integrated assemblers reject it (see issue #437 below) |
| QEMU user-mode | RVV 1.0-capable | Required to run/test cross-compiled binaries on amd64 build hosts |

Both thresholds are satisfied by any distribution released after 2022 (Debian bookworm ships binutils 2.40, sid ships 2.43); this is not a practical barrier on any currently supported distro.

**Official cross-files** (`package/crossfiles/riscv64-linux.meson`, GCC):

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

`riscv64-linux-clang.meson` is identical except `c = 'clang'`, `cpp = 'clang++'`, and `c_args`/`c_link_args = '-target riscv64-linux-gnu'`.

**Build commands** (from `.gitlab-ci.yml`, `build-debian-riscv64` job):

```
meson setup build --buildtype release -Dtrim_dsp=false --werror \
    --cross-file package/crossfiles/${CROSSFILE}.meson
ninja -C build
cd build && meson test -v
```

Test job additionally passes `-Dtestdata_tests=true -Dlogging=false` and runs `meson test -v --timeout-multiplier 10` to compensate for QEMU emulation slowness. To disable RVV assembly entirely (e.g. on a pre-2.38-binutils toolchain): `-Denable_asm=false`.

**Known build failures.**

- [Issue #463](https://code.videolan.org/videolan/dav1d/-/issues/463) (**open**, 2026-03-17): static cross-compilation with a `riscv64-unknown-linux-gnu-gcc` toolchain (`riscv-gnu-toolchain` 2026.03.13) fails Meson's sanity check with *"Executables created by c compiler ... are not runnable"* under `--default-library=static`. Root cause (implied): the sanity-check binary still links dynamically against target libgcc/libc, which the `qemu-riscv64` exe_wrapper cannot resolve without a matching sysroot. Workaround confirmed by the reporter: `CFLAGS='-static' meson setup ...`. No fix merged as of the harvest date.
- [Issue #437](https://code.videolan.org/videolan/dav1d/-/issues/437) (**closed**, opened and closed within 3 days, 2024-02-15 to 2024-02-18): Clang 17's integrated assembler rejected `vsetvli` instructions in `riscv64_itx.S` lacking explicit tail-agnostic/mask-agnostic (`ta`/`ma`) operands, which GNU `as` accepts via implicit defaults. Fixed in [MR !1596](https://code.videolan.org/videolan/dav1d/-/merge_requests/1596), released in 1.4.1.
- Downstream (not upstream GitLab): OpenBSD ports' `multimedia/dav1d` failed on riscv64 because llvm-16 did not support `.option arch` directives (fixed by moving to llvm-17); separately, because OpenBSD's riscv64 kernel at the time lacked Vector-extension support, disabling dav1d assembly on riscv64 was used as a workaround on that platform ([mail-archive thread](https://www.mail-archive.com/ports@openbsd.org/msg130547.html)).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

All gaps below fall back silently and correctly to the C reference implementation; the impact is performance only, not functional correctness.

| Function group | riscv64 status | arm64 status | Impact |
|---|---|---|---|
| mc put/prep (8-tap, bilinear) | Missing | Complete | **High** -- dominant inter-frame decode path (~72-76% of remaining CPU time per !1731 profiling) |
| Loopfilter / deblocking | Missing (scaffolding only, !1858) | Complete | High -- runs on every decoded frame |
| MSAC arithmetic coding | Missing | Complete | Medium-high -- entropy decode is a consistent fraction of decode time |
| refmvs | Missing | Complete | Medium -- present in all inter-coded content |
| itx 32x32/64x64 and large rectangles | Missing | Complete | Medium -- larger intra block sizes |
| itx, all sizes, 16bpc | Missing | Complete | Medium -- affects HDR/10-bit content |
| Loop restoration (Wiener, SGR) | Missing | Complete | Medium -- content-dependent, can be disabled |
| Film grain (uv, fgy/fguv application) | Partial (y-plane generation only) | Complete | Low-medium -- film-grain content only |
| CDEF direction finding | Missing (two competing open MRs) | Complete | Low-medium -- quality metric, not decode correctness |
| mc compound, 16bpc (beyond blend) | Missing | Complete | Low-medium -- affects 16bpc content |
| ipred angular (z1/z2/z3), DC 16bpc, cfl_ac | Missing | Complete | Low-medium |

**Representative performance data (checkasm microbenchmarks, real riscv64 silicon).**

mc compound, 8bpc, Kendryte K230 (VLEN=128):

| Function | C cycles | RVV cycles | Speedup |
|---|---|---|---|
| avg_w32 | 13734.3 | 1226.3 | 11.20x |
| w_mask_444_w32 | 33229.6 | 3289.2 | 10.10x |
| emu_edge_w16 | 1447.9 | 287.6 | 5.03x |
| warp_8x8_8bpc | 4549.7 | 2504.7 | 1.82x |

mc compound, 8bpc, SpacemiT K1 (VLEN=256): `w_mask_444_w64` 14.49x, `w_mask_420_w64` 12.01x, `emu_edge_w64` 4.41x vs C.

GSoC 2025 headline results ([final report](https://seoulsaram.org/articles/GSoC25/final-report/)): w_mask up to 16x (SpacemiT K1) / 9x (K230); emu_edge up to 5x; all changes passed checkasm and Argon conformance. End-to-end full-decode impact of the largest merged batch ([MR !1731](https://code.videolan.org/videolan/dav1d/-/merge_requests/1731), Bosphorus 1080p): baseline 8.97 fps -> 10.09 fps, a ~12.5% real-decode throughput gain from one MR, with the same MR's own profiling showing `prep_8tap_c`/`put_8tap_c` still dominant afterward.

**Regressions at narrow widths (real, self-reported):** `intra_pred_dc_w4_16bpc_rvv` in open MR !1959 measured 220.0 cycles vs 138.3 for C (0.62x, i.e. slower than C), only turning positive from w16 (1.89x) upward. Open MR !1910 (ipred_h LMUL optimization) shows a minor regression at w4-w32 on VLEN=256 hardware (e.g. w4: 10.10x -> 10.01x vs C) traded for an improvement at w64 (6.21x -> 6.58x) -- an open, unresolved trade-off. This narrow-width overhead pattern (fixed vector-setup cost outweighing benefit below ~w8-w16) recurs across multiple RVV kernels.

**Security hardening.** Data not available: no RISC-V-specific hardening flags (shadow stack, CFI) were found in the research.

**Floating-point / NaN semantics.** Not applicable -- dav1d is an integer-only AV1 decoder; no floating-point arithmetic appears in any decode path.

---

## 7. CI/CD Infrastructure

dav1d uses **GitLab CI exclusively**; there is no `.github/workflows/` directory. The canonical definition is [`.gitlab-ci.yml`](https://code.videolan.org/videolan/dav1d/-/blob/master/.gitlab-ci.yml), independently confirmed by direct fetch (via the GitHub mirror raw content, since `code.videolan.org` itself is behind an Anubis anti-bot wall).

**`build-debian-riscv64`** (build stage): extends `.debian-amd64-common` (an **amd64** Docker runner, image `registry.videolan.org/dav1d-debian-unstable:20260622120900`), sets `QEMU_CPU: rv64,v=true,vext_spec=v1.0,vlen=256,elen=64`, and runs a `parallel: matrix:` of two cross-files (`riscv64-linux` for GCC, `riscv64-linux-clang` for Clang).

**`test-debian-riscv64`** (test stage): `needs: ["build-debian-riscv64"]`, runs with `-Dtestdata_tests=true --timeout-multiplier 10`, matrixed over four `QEMU_CPU` vector-length configurations (vlen=128/256/512/1024, each with `rvv_ta_all_1s=on, rvv_ma_all_1s=on, rvv_vl_half_avl=on`).

No `rules:`/`only:` restrictions gate either job -- they run on every commit and merge request.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes | Yes | Yes (since Feb 2024) |
| Native hardware runners | Yes | Yes | No -- QEMU user-mode on amd64 |
| Toolchains tested | GCC, Clang | GCC, Clang | GCC, Clang |
| Vector-width variants tested | N/A | N/A | vlen=128/256/512/1024 |
| Fires on every commit | Yes | Yes | Yes |
| RISE-provided runners | N/A | N/A | No |

**Key observation.** All riscv64 CI is QEMU-emulated; no pipeline run executes on physical riscv64 silicon, so performance regressions (e.g. the warp_8x8 1.82x-speedup ceiling, or the narrow-width regressions in !1910/!1959) are not detectable in CI -- the real-hardware benchmark numbers throughout this report come from contributor-supplied MR descriptions (Kendryte K230, SpacemiT K1/X60, Banana Pi BPI-F3, OrangePi RV2, Blackhole p100a), not from automated CI infrastructure. There is no RISE-provided riscv64 hardware in dav1d's runner pool.

---

## 8. Distribution and Release Status

**Upstream binaries.** dav1d does not publish prebuilt riscv64 (or any architecture's) binaries; the canonical release mechanism is source tarballs from `code.videolan.org`. Users build from source or consume distribution packages.

**PyPI.** No PyPI package named `dav1d` (or plausible variants: `dav1d-py`, `pydav1d`, `python-dav1d`, `dav1dpy`) exists at all -- confirmed via repeated HTTP 404 from `pypi.org/pypi/dav1d/json`. This is not a riscv64-specific gap; the "wheel" distribution model is simply not applicable to this C library. RISE's own wheel-builder index (`riseproject.gitlab.io/python/wheel_builder/`) does not list dav1d among its ~70 tracked packages, consistent with this.

**Distribution packages (riscv64 confirmed directly).**

| Distribution | Version | riscv64 status | Source |
|---|---|---|---|
| Ubuntu 26.04 "resolute" | 1.5.3-1 | `dav1d`, `libdav1d-dev`, `libdav1d7` (plus `libheif-plugin-dav1d`, `librust-dav1d-dev`, `librust-dav1d-sys-dev`) all build for riscv64 alongside amd64/arm64/armhf/i386/ppc64el/s390x | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=dav1d&suite=resolute&searchon=names) |
| Arch Linux RISC-V | 1.5.4-1 | `dav1d-1.5.4-1-riscv64.pkg.tar.zst`, `dav1d-doc`, `gst-plugin-dav1d`, `vlc-plugin-dav1d` confirmed present in the live `extra/` repo directory listing | [archriscv.felixc.at/repo/extra/](https://archriscv.felixc.at) |
| Ubuntu 24.04 "noble" | 1.4.1-1build1 | Native riscv64 `.deb` in universe | packages.ubuntu.com/noble/dav1d |
| Debian sid | 1.5.3-1+b2 | Built; builder rv-manda-04; log-parse status "Maybe-Successful" | [Debian buildd](https://buildd.debian.org/status/package.php?p=dav1d&suite=sid) |
| Fedora RISC-V | Unknown | Data not available: `koji.fedoraproject.org`/`dl.fedoraproject.org` were blocked by Anubis-style bot protection during research | -- |

Arch's riscv64 build (1.5.4-1) is newer than Ubuntu resolute's (1.5.3-1), consistent with the September 2026 package snapshot.

**To get a working binary on riscv64.** Install `dav1d`/`libdav1d-dev` from Debian/Ubuntu or Arch Linux RISC-V. For the latest upstream code, build from source using the crossfile procedure in Section 5; apply the `CFLAGS='-static'` workaround if statically linking (issue #463).

---

## 9. Dependencies

dav1d is deliberately minimal at runtime. The dependency table below covers all direct dependencies plus indirect ones surfaced during research (mainly the optional `dav1dplay` example's GPU-rendering chain).

| Dependency | Role | Criticality | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|---|
| Meson | Build system (>= 0.54) | Critical (build) | Pure-Python, arch-independent; `riscv64` is a recognized `cpu_family` | N/A (build tool) | Ships `Architecture: all` on Debian/Ubuntu -- trivially available on riscv64 in practice, though a project-graph query snapshot lacked an explicit riscv64 binding (a data-coverage artifact, not a real gap) | None |
| Ninja | Default Meson backend, implicit and required | Critical (build) | Builds natively on riscv64 (portable C++) | No dedicated upstream riscv CI; built/tested via Debian/Ubuntu riscv64 autobuilders | Found in Ubuntu 26.04 riscv64 (resolute) | None |
| GNU binutils | RVV assembly (GAS); `.option arch, +v` directive support | Critical (build) | Requires >= 2.38 (Debian bookworm ships 2.40, sid 2.43) | Tested via CI + QEMU | Available on riscv64 | Hard minimum; unmet-toolchain fallback is `-Denable_asm=false` (loses RVV) |
| LLVM | Alternative assembler/compiler path (Clang) | Optional (build) | Requires Clang >= 17 for the same `.option arch` directive; historical build break below 17 (issue #437) | CI `riscv64-linux-clang` job matrix | Available on Debian/Ubuntu riscv64 | Only needed if building with the Clang cross-file |
| glibc | Provides pthreads, libm, libdl -- dav1d's only truly required runtime libs | Critical (runtime) | Mature, Tier-1-class riscv64 port | Extensively tested (Debian/Ubuntu riscv64 porterbox, upstream glibc riscv CI) | Found in Ubuntu 26.04 riscv64 (resolute) | None |
| QEMU | `exe_wrapper` for meson's riscv64 cross-file (`qemu-riscv64 -L /usr/riscv64-linux-gnu/`); dav1d's own CI test harness | Critical (test) | N/A -- host-side emulation tool | Extensively exercised; this is literally dav1d's riscv64 test mechanism, matrixed across 4 VLEN configs | Found in Ubuntu 26.04 riscv64 (resolute) | None |
| SDL2 | Optional: `dav1dplay` example player (`enable_examples` defaults false) | Optional (runtime) | riscv64 support since ~2.24; builds cleanly | Not part of dav1d's own CI matrix; community-level testing only | Found in Ubuntu 26.04 riscv64 (resolute) | Not on the critical path -- off by default |
| pkg-config | Dependency discovery used by Meson for `dependency('sdl2')`, `dependency('vulkan')`, `dependency('threads')`, etc. | Optional (build) | Native riscv64 builds | Standard, well-tested tool | Found in Ubuntu 26.04 riscv64 (resolute) | None |
| NASM (indirect, x86 only) | x86/x86_64 SIMD assembler, gated behind `host_machine.cpu_family().startswith('x86')` | N/A on riscv64 | N/A -- never invoked on this architecture | N/A | Found in Ubuntu 26.04 riscv64 (resolute) as a host tool, but irrelevant here | Not a real riscv64 dependency |
| libplacebo (indirect) | Optional GPU-accelerated rendering backend for `dav1dplay`, pulled in only when SDL2 is found | Optional (runtime) | Meson-based portable C; builds on riscv64 | Limited real-hardware coverage vs. x86/ARM | Found in Ubuntu 26.04 riscv64 (resolute) | Depends on Vulkan for its accelerated path |
| Vulkan (indirect) | Used by `dav1dplay` via libplacebo when a Vulkan ICD is present | Optional (runtime) | Loader/headers build fine on riscv64 | Loader-level: fine. Real hardware-accelerated ICDs on riscv64 boards are still scarce | Found in Ubuntu 26.04 riscv64 (resolute) | Affects only the optional, disabled-by-default example player, not `libdav1d`/the `dav1d` CLI |
| Doxygen (indirect) | Optional docs generation (`enable_docs` defaults false) | Optional (build) | Builds/runs on riscv64 | Standard tool, routinely built by Debian/Ubuntu | Found in Ubuntu 26.04 riscv64 (resolute) | Off by default |
| Graphviz (indirect) | Optional, used by Doxygen for diagrams when docs are enabled | Optional (build) | Builds/runs on riscv64 | Standard tool | Found in Ubuntu 26.04 riscv64 (resolute) | Off by default |

**Bottom line.** No dependency in this table has an unmet critical riscv64 gap. The only real caveat is immature Vulkan GPU-driver (ICD) availability on riscv64 hardware, which affects only the optional `dav1dplay` example, not `libdav1d` or the `dav1d` CLI decoder.

---

## 11. Known Bugs and Active Issues

**Open.**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#435](https://code.videolan.org/videolan/dav1d/-/issues/435) | RVV SIMD (master tracker) | Open (created 2024-02-02, last updated 2025-11-26) | High (scope) | Enumerates remaining work: 8-tap/bilinear mc, deblock, loop restoration, MSAC, refmvs, most film grain and 16bpc paths. Checklist is stale relative to master -- several items (ipred_h, 16bpc ipred_v/h, pal_pred, generate_grain_y) have since merged but are not reflected as checked |
| [#463](https://code.videolan.org/videolan/dav1d/-/issues/463) | Failed to build with static linking for riscv64 | Open (2026-03-17) | Medium | Static cross-compile with `riscv64-unknown-linux-gnu-gcc` fails Meson's sanity check; `CFLAGS='-static'` workaround confirmed; no fix merged |

**Closed.**

| ID | Title | Closed | Notes |
|---|---|---|---|
| [#447](https://code.videolan.org/videolan/dav1d/-/issues/447) [NEEDS VERIFICATION -- referenced in the existing analysis but not independently re-fetched in this pass] | RVV itx 4x4 does not pass the Argon tests | 2024-10-13 | Fixed within days via MR !1737 |
| [#437](https://code.videolan.org/videolan/dav1d/-/issues/437) | dav1d 1.4.0 asm fails to build on riscv64 with clang 17 (not gas) | 2024-02-18 | Missing ta/ma flags in `vsetvli`; fixed in MR !1596, released 1.4.1 |

**Open merge requests (RISC-V, 7 total, verified via GitLab API against the `search=riscv` MR list of 61: 7 open / 37 merged / 17 closed-unmerged):**

| MR | Title | Author | Notes |
|---|---|---|---|
| [!1960](https://code.videolan.org/videolan/dav1d/-/merge_requests/1960) | riscv/cdef: Implement cdef_find_dir | Najmus Sakib Afsan | Depends on closed-unmerged !1894; K230 benchmark 2.65x/2.78x vs C, self-reported 5.7% timing noise |
| [!1959](https://code.videolan.org/videolan/dav1d/-/merge_requests/1959) | riscv64/ipred: ipred_dc, all variants, 16bpc | Mohd Zaid | w4 shows a 0.62x regression (slower than C); net win from w16 up |
| [!1958](https://code.videolan.org/videolan/dav1d/-/merge_requests/1958) | riscv64/filmgrain: generate_grain_uv, 8bpc | Mohd Zaid | First chroma film-grain progress; speedup scales with AR order (1.1x-3.0x) |
| [!1910](https://code.videolan.org/videolan/dav1d/-/merge_requests/1910) | riscv/ipred_h: minimum-LMUL optimization | Najmus Sakib Afsan | Mixed results: minor regression w4-w32 on VLEN=256, improvement at w64 |
| [!1858](https://code.videolan.org/videolan/dav1d/-/merge_requests/1858) | riscv/loopfilter: basic RVV scaffolding | S Rajath | WIP only; coverage checks explicitly bypassed for scaffolding code |
| [!1825](https://code.videolan.org/videolan/dav1d/-/merge_requests/1825) | riscv64: add `dav1d_set_vlen_max()` API call | Nathan E. Egge | Submitted 2025-12-23, assigned to Ronald S. Bultje, still unreviewed/unmerged as of the harvest date |
| [!1735](https://code.videolan.org/videolan/dav1d/-/merge_requests/1735) | riscv64/cdef: filter and dir intrinsic functions | jerry tsai | Open 12+ months; C-intrinsics approach, competes with !1960/!1894 for the `dir` portion |

No open MR targets the 8-tap/bilinear `mc put`/`prep` gap identified as the dominant remaining decode cost.

---

## 12. Objections and Upstream Blockers

**No stated objections to riscv64 support.** Every riscv64 MR meeting code-style requirements has been merged historically; the README explicitly names RISC-V as a target architecture, and review latency (!1735 open 12+ months, !1825 open since December 2025) reflects maintainer bandwidth, not platform rejection.

**Technical blockers.**

1. **mc put/prep absent, no contributor assigned.** The highest-impact gap (Section 4) has no open MR. This is a contributor-supply gap, not a maintainer objection.
2. **MR !1825 (`dav1d_set_vlen_max()`) stalled since December 2025.** Assigned to Ronald S. Bultje but unmerged. This is a structurally important open API change, since dav1d's RVV kernels increasingly branch on detected VLEN at runtime (128/256/512-bit variants exist for several mc functions) and real hardware varies widely (T-Head C910, SpacemiT K1, Kendryte K230, OrangePi RV2).
3. **Competing CDEF-direction approaches.** !1735 (intrinsics, 12+ months old) and !1960 (asm, dependent on the closed-unmerged !1894) both target `cdef_find_dir`; neither is merged. Resolution requires a maintainer decision or one MR absorbing the other.
4. **No native CI runners.** All riscv64 CI runs under QEMU emulation; correctness is covered across 4 VLEN configs, but performance regressions (e.g. the warp_8x8 1.82x speedup ceiling, or narrow-width regressions in open MRs !1910/!1959) are undetectable in CI and rely on contributor-supplied hardware benchmarks.

**Organizational blockers.** None identified. VideoLAN accepts contributions without a CLA; the BSD-2-Clause license imposes no constraint on commercial use.

**Acceptance probability for new contributions.** High, based on the merge track record since 2022 and the breadth of independent contributors active through 2026. The bottleneck is contributor supply against the remaining gaps (mc put/prep, loopfilter, MSAC, loop restoration), not maintainer resistance.

---

## 13. Readiness Assessment

- **Color:** yellow (optimization-minimal -- the primary CI-based grade is blue, capped to yellow by the optimization modifier)
- **Release provider:** distro
- **Optimization-purpose project:** yes
- **Optimization level:** minimal

**Operations lacking RISC-V implementations.** The 8-tap and bilinear motion-compensation `put`/`prep` kernels -- the dominant inter-frame decode cost (~72-76% of remaining CPU time per [MR !1731](https://code.videolan.org/videolan/dav1d/-/merge_requests/1731)'s own profiling of `prep_8tap_c`/`put_8tap_c`) -- remain entirely unoptimized scalar C on riscv64, with no open MR targeting them. Deblocking/loopfilter, MSAC entropy decoding, loop restoration, and most film-grain and 16bpc paths remain unimplemented per the open master tracking issue [#435](https://code.videolan.org/videolan/dav1d/-/issues/435). The RVV (V) extension is already used for everything that is implemented; closing the remaining gap is a matter of authoring additional RVV kernels for the above operations, not adopting a new ISA extension -- Zba/Zbb (already in use) would likely remain sufficient for the address-generation/bit-manipulation needs of an 8-tap kernel.

**Justification.** dav1d's GitLab CI (`.gitlab-ci.yml`) runs `build-debian-riscv64` and `test-debian-riscv64` jobs unconditionally on every commit, cross-compiling with GCC and Clang and running the full test suite under QEMU across VLEN=128/256/512/1024 ([source](https://code.videolan.org/videolan/dav1d/-/blob/master/.gitlab-ci.yml)), and upstream publishes only source tarballs (no riscv64 binaries), with Debian/Ubuntu packaging the riscv64 builds instead ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=dav1d&suite=resolute&searchon=names)) -- on CI evidence alone this would be a blue grade. But dav1d is explicitly positioned as "the reference fast decoder" with hand-tuned SIMD as its value proposition, and its own profiling data ([MR !1731](https://code.videolan.org/videolan/dav1d/-/merge_requests/1731)) shows that after the largest merged RVV optimization batch, `prep_8tap_c`/`put_8tap_c` motion compensation is still entirely unoptimized scalar C on riscv64, and deblocking, MSAC, loop restoration, and most film grain/16bpc paths remain unimplemented per the open master tracking issue [#435](https://code.videolan.org/videolan/dav1d/-/issues/435). Because the single most-executed hot path is uncovered, this is a "minimal" optimization gap, which caps the grade at yellow.

**Pending work that could change the grade.** No open MR yet targets the critical 8-tap/bilinear `mc put`/`prep` gap. Relevant open MRs: [!1960](https://code.videolan.org/videolan/dav1d/-/merge_requests/1960) (cdef_find_dir), [!1959](https://code.videolan.org/videolan/dav1d/-/merge_requests/1959) (ipred_dc 16bpc), [!1958](https://code.videolan.org/videolan/dav1d/-/merge_requests/1958) (filmgrain generate_grain_uv), [!1910](https://code.videolan.org/videolan/dav1d/-/merge_requests/1910) (ipred_h LMUL optimization), [!1858](https://code.videolan.org/videolan/dav1d/-/merge_requests/1858) (loopfilter RVV scaffolding, WIP-only), [!1825](https://code.videolan.org/videolan/dav1d/-/merge_requests/1825) (dav1d_set_vlen_max API, stalled in review since December 2025). RISE's System Libraries Working Group tracks dav1d's RISC-V progress as an ecosystem-readiness item ([system-libraries-wg issue #20](https://github.com/riseproject-dev/system-libraries-wg/issues/20)) but has not funded the port directly -- work is led by Nathan Egge (now at Google) plus a growing set of independent contributors, and was a mentored 2025 Google Summer of Code project. RISE's `python-wheels` CI separately merged a Bazel-build patch adding riscv64 support to a vendored copy of dav1d inside tensorstore ([PR #1865](https://github.com/riseproject-dev/python-wheels/pull/1865)), unrelated to upstream dav1d itself.

---

## 14. Investment Analysis

RISE has no prior direct investment in dav1d itself. Its only touchpoint is the tracking issue in `system-libraries-wg` (monitoring, not funding) and the unrelated tensorstore Bazel patch in `python-wheels`. All riscv64 code in dav1d to date was authored by independent/Google-affiliated contributors without RISE funding. The scope below is therefore uncontested.

### 14.1 Functional Enablement

The dominant functional gap is mc put/prep (8-tap and bilinear interpolation), the hot path for all inter-frame decoding, with no MR open against it. This requires authoring and upstreaming hand-tuned RVV assembly per bitdepth, validated against checkasm and Argon conformance on real hardware.

Secondary functional gaps: loopfilter/deblocking (scaffolding-only MR !1858 needs to progress to real kernels), MSAC arithmetic decoding (no open MR), loop restoration (Wiener/SGR, no open MR against upstream, only an unmerged personal WIP branch), refmvs (no open MR), and the remaining film-grain/16bpc-itx/CDEF-direction items already tracked by open MRs !1958/!1959/!1960/!1735.

### 14.2 Performance Optimization

Existing RVV implementations have known headroom:

- `warp_8x8` achieves only 1.82x on K230 (VLEN=128), well below the 5-14x typical for other mc functions -- likely due to its use of expensive scatter/gather (`vluxseg8ei32.v`).
- Narrow-width regressions are a recurring pattern: `pal_pred_w4` and `intra_pred_dc_w4_16bpc` both run slower than C, and open MR !1910 shows a similar trade-off unresolved for `ipred_h`.
- VLEN-tiered dispatch (128/256/512-bit variants) is implemented only for select mc compound functions; ipred and CDEF use a single code path regardless of detected VLEN.
- MR !1825 (`dav1d_set_vlen_max()`) needs a reviewer push to unblock a structurally important VLEN-safety API that has sat since December 2025.

### 14.3 CI/CD Infrastructure

All riscv64 CI runs under QEMU; no performance regression is detectable pre-merge. Adding a native riscv64 hardware runner (e.g. a SpacemiT K1 or similar board) to VideoLAN's GitLab runner pool would enable cycle-accurate performance benchmarks in CI, catch warp_8x8-class regressions before merge, and validate VLEN-dispatch correctness on physical silicon. This is a runner-registration/logistics item, not a code change.

### 14.4 Ecosystem Enablement

Not applicable -- dav1d has no dependent package ecosystem requiring separate riscv64 enablement (no plugins, no language-binding packages with riscv64-specific gaps beyond the already-packaged `librust-dav1d-dev`/`librust-dav1d-sys-dev`). Section 10 is omitted per the report scope rules.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | mc put/prep: 8-tap and bilinear RVV, 8bpc | 6-8 | Contributor | Critical |
| Functional | mc put/prep: 8-tap and bilinear RVV, 16bpc | 4-6 | Contributor | High |
| Functional | Loopfilter (deblocking) RVV kernels, 8bpc (build on !1858 scaffolding) | 6-8 | Contributor | Critical |
| Functional | Loopfilter RVV kernels, 16bpc | 4-6 | Contributor | High |
| Functional | MSAC arithmetic-coding RVV | 4-6 | Contributor | High |
| Functional | Loop restoration (Wiener + SGR) RVV | 6-8 | Contributor | Medium |
| Functional | refmvs load/save/splat_tmvs RVV | 2-3 | Contributor | Medium |
| Functional | Film grain: land !1958 (generate_grain_uv) and fgy/fguv application kernels | 4-6 | Contributor + reviewer | Medium |
| Functional | CDEF dir: resolve !1735 vs !1960/!1894 and merge | 1-2 | Contributor + reviewer | Medium |
| Functional | Merge review push for MR !1825 (vlen_max API) | 0.5 | Reviewer (Ronald S. Bultje) | High |
| Performance | mc warp_8x8 optimization (1.82x is below the typical mc floor) | 2-4 | Contributor | Medium |
| Performance | VLEN-tiered dispatch for ipred and CDEF modules | 2-4 | Contributor | Medium |
| Performance | itx 32x32/64x64 and large rectangular transforms | 4-6 | Contributor | Medium |
| Performance | Resolve narrow-width regressions in !1910/!1959 before merge | 1-2 | Contributor | Medium |
| CI/CD | Native riscv64 hardware runner in VideoLAN GitLab pool | 1-2 (logistics) | VideoLAN + RISE | High |

---

## 15. References

- [code.videolan.org/videolan/dav1d -- canonical repository](https://code.videolan.org/videolan/dav1d)
- [github.com/videolan/dav1d -- read-only GitHub mirror](https://github.com/videolan/dav1d)
- [GitLab Issue #435 -- RVV SIMD master tracker](https://code.videolan.org/videolan/dav1d/-/issues/435)
- [GitLab Issue #437 -- clang 17 vsetvli build failure](https://code.videolan.org/videolan/dav1d/-/issues/437)
- [GitLab Issue #463 -- static linking failure for riscv64](https://code.videolan.org/videolan/dav1d/-/issues/463)
- [.gitlab-ci.yml -- riscv64 CI job definitions](https://code.videolan.org/videolan/dav1d/-/blob/master/.gitlab-ci.yml)
- [MR !1591 -- riscv64/itx: 16x16 8bpc transforms](https://code.videolan.org/videolan/dav1d/-/merge_requests/1591)
- [MR !1596 -- riscv64/itx: missing tail/mask agnostic flags](https://code.videolan.org/videolan/dav1d/-/merge_requests/1596)
- [MR !1600 -- riscv64/itx: rectangular transform sizes](https://code.videolan.org/videolan/dav1d/-/merge_requests/1600)
- [MR !1608 -- CI: Add riscv64 clang build](https://code.videolan.org/videolan/dav1d/-/merge_requests/1608)
- [MR !1629 -- riscv: Check for standards compliant RVV 1.0+](https://code.videolan.org/videolan/dav1d/-/merge_requests/1629)
- [MR !1690 -- checkasm: fix RISC-V vector clobbering](https://code.videolan.org/videolan/dav1d/-/merge_requests/1690)
- [MR !1731 -- RVV Optimization batch (profiling data)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1731)
- [MR !1735 -- riscv64/cdef: filter and dir intrinsic functions (open)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1735)
- [MR !1737 -- riscv: Fix Argon test failure](https://code.videolan.org/videolan/dav1d/-/merge_requests/1737)
- [MR !1764 -- riscv: Enable FreeBSD/OpenBSD elf_aux_info() support](https://code.videolan.org/videolan/dav1d/-/merge_requests/1764)
- [MR !1777 -- riscv: Fix building on non-Linux OS's](https://code.videolan.org/videolan/dav1d/-/merge_requests/1777)
- [MR !1797 -- riscv64/mc: Add w_mask functions](https://code.videolan.org/videolan/dav1d/-/merge_requests/1797)
- [MR !1808 -- riscv64/mc: Add emu_edge function](https://code.videolan.org/videolan/dav1d/-/merge_requests/1808)
- [MR !1824 -- riscv64/mc: VLEN=512 8bpc blend functions](https://code.videolan.org/videolan/dav1d/-/merge_requests/1824)
- [MR !1825 -- riscv64: Add dav1d_set_vlen_max() API call (open)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1825)
- [MR !1826 -- riscv64/mc16: VLEN=512 16bpc blend functions](https://code.videolan.org/videolan/dav1d/-/merge_requests/1826)
- [MR !1856 -- riscv64/ipred_v: remove redundant vxrm set inst.](https://code.videolan.org/videolan/dav1d/-/merge_requests/1856)
- [MR !1857 -- riscv64/ipred_h: implement ipred_h in RISC-V asm](https://code.videolan.org/videolan/dav1d/-/merge_requests/1857)
- [MR !1858 -- riscv/loopfilter: basic RVV scaffolding (open)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1858)
- [MR !1883 -- riscv64/ipred: ipred_v and ipred_h 16bpc RVV](https://code.videolan.org/videolan/dav1d/-/merge_requests/1883)
- [MR !1889 -- riscv64/itx: match stack allocation of 16x16 itx](https://code.videolan.org/videolan/dav1d/-/merge_requests/1889)
- [MR !1890 -- riscv64/filmgrain: generate_grain_y 8bpc RVV](https://code.videolan.org/videolan/dav1d/-/merge_requests/1890)
- [MR !1908 -- riscv64/ipred: pal_pred 8/16bpc RVV](https://code.videolan.org/videolan/dav1d/-/merge_requests/1908)
- [MR !1910 -- riscv/ipred_h: minimum-LMUL optimization (open)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1910)
- [MR !1958 -- riscv64/filmgrain: generate_grain_uv 8bpc (open)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1958)
- [MR !1959 -- riscv64/ipred: ipred_dc 16bpc, all variants (open)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1959)
- [MR !1960 -- riscv/cdef: implement cdef_find_dir (open)](https://code.videolan.org/videolan/dav1d/-/merge_requests/1960)
- [MR !1977 -- riscv/filmgrain: fix SIGSEGV in generate_grain_y](https://code.videolan.org/videolan/dav1d/-/merge_requests/1977)
- [dav1d 1.5 "Sonic" release notes](https://jbkempf.com/blog/2025/dav1d-1.5/)
- [dav1d 1.5.4 release notes](https://jbkempf.com/blog/2026/dav1d-1.5.4/)
- [GSoC 2025 final report -- RVV optimization for dav1d](https://seoulsaram.org/articles/GSoC25/final-report/)
- [RISC-V Summit Europe 2024 -- Nathan Egge slide deck](https://riscv-europe.org/summit/2024/media/proceedings/plenary/Wed-11-45-Nathan-Egge.pdf)
- [Video Dev Days Nov 2024 -- Nathan Egge slide deck](https://people.videolan.org/~negge/vdd24.pdf)
- [Ubuntu 26.04 "resolute" dav1d packages](https://packages.ubuntu.com/search?keywords=dav1d&suite=resolute&searchon=names)
- [Ubuntu 24.04 "noble" dav1d package](https://packages.ubuntu.com/noble/dav1d)
- [Debian buildd status for dav1d](https://buildd.debian.org/status/package.php?p=dav1d&suite=sid)
- [Arch Linux RISC-V package repository (extra)](https://archriscv.felixc.at)
- [RISE Project -- System Libraries WG issue #20 (dav1d tracking)](https://github.com/riseproject-dev/system-libraries-wg/issues/20)
- [RISE python-wheels PR #1865 -- tensorstore riscv64 build (vendored dav1d patch)](https://github.com/riseproject-dev/python-wheels/pull/1865)
- [RISE Project members](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog)