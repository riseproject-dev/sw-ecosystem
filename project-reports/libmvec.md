---
title: libmvec
parent: Project Reports
color: orange
dependencies:
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="libmvec" %}

# libmvec

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Orange<br/>
**Optimization level:** Absent<br/>
**Scope:** RISC-V (riscv64/linux) support status for libmvec<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libmvec is the vectorized math library component of the GNU C Library (glibc). It provides SIMD-accelerated implementations of standard math functions (sin, cos, exp, log, pow, and variants) under the symbol naming convention `_ZGV*`. It is not a standalone project: it ships as `libmvec.so` and `libmvec.a` inside the `libc6` and `libc6-dev` distribution packages, built from the `mathvec/` subdirectory of the glibc tree at [sourceware.org/git/glibc.git](https://sourceware.org/git/glibc.git).

glibc is a GNU Project. It was FSF-overseen from its 1987 start (Roland McGrath), then run by a GNU Steering Committee from 2001-2012; the committee dissolved itself in March 2012, moving to distributed maintainership under five co-maintainers (Ryan Arnold, Maxim Kuvyrkov, Joseph Myers, Carlos O'Donell, Alexandre Oliva) with no centralized steering authority. Patches are submitted to the `libc-alpha` mailing list at sourceware.org and merged by established committers; glibc has no Bugzilla entry, wiki tracking page, or GitHub issue dedicated to the riscv64 libmvec port, so all activity lives as ad hoc RFC threads on libc-alpha/Patchwork with no assigned patchwork delegate. The project is licensed LGPL-2.1-or-later (LGPL-2.0-or-later before 2001). In 2021 the FSF copyright-assignment requirement for contributions was removed, so the expectation referenced in the February 2026 RFC cover letter ("FSF copyright assignment") is legacy/ambiguous rather than a settled formal requirement.

**Corporate maintainers and sponsors:** Adhemerval Zanella Netto (Linaro, highest recent libmvec commit volume, effective maintainer); Carlos O'Donell, Florian Weimer, Joseph Myers (Red Hat); Szabolcs Nagy and Joe Ramsay (ARM, delivered the successful aarch64 libmvec port); Palmer Dabbelt (SiFive/Rivos, RISC-V glibc context, reviewer on the veclibm source). None of the three RISC-V libmvec RFC submitting organizations (ISCAS/PLCT Lab, SpacemiT, ZTE) has an established glibc committer with merge rights, which is the structural gap underlying the stalled review cycle.

libmvec is built for a target architecture only when the architecture's `sysdeps` configure fragment explicitly sets `build_mathvec=yes`. As of glibc master checked 2026-09-30, this is set only for x86_64 and aarch64. `sysdeps/riscv/configure.ac` does not set this variable, so libmvec is never built for riscv64 in any released glibc version.

**Community stance on new ports:** No formal promotion or tier policy exists. Maintainer objections recorded against the RISC-V series (O'Donell, Weimer, Myers, Zanella) are substantive and specific (license incompatibility, ABI symbol-naming break, wrong GLIBC version symbol, out-of-tree-branch procedural issue), not blanket hostility to RISC-V; maintainers engage with each RFC round. The pattern that made the 2023 aarch64 port fast (ARM engineers with pre-existing glibc committer relationships) is absent for the RISC-V effort.

## 2. Port History and Upstreaming Timeline

**x86_64 (amd64):** Original architecture. First patchwork entry 2015-06-23 (Joseph Myers). AVX512 implementations contributed by Andrew Senkevich, July 2015. Intel's Hongjiu Lu contributed multiarch functions, August 2015. Reference implementation for all other ports.

**AArch64 (arm64):** RFC proposed by Steve Ellcey (Cavium), March 2018, not merged at the time. Re-proposed by Joe Ramsay (ARM), February 2023, as RFC. Accepted and merged at v5 on 2023-04-12. Released in glibc 2.38, August 2023. Time from RFC to merge: approximately 6 weeks for the Ramsay series.

**PPC64le (POWER8):** First function (double-precision cosine) committed 2019-04-03.

**RISC-V (riscv64):** Zero code merged as of 2026-09-30. Earliest known activity is informal prototyping: PLCT-Weekly entries dated 2023-12-01 ("cos function framework, testing in progress") and 2024-01/02 ("submitted libmvec function support code, build macro-expansion issues being resolved") describing work by Yulong Shi at `github.com/yulong-plct/riscv-glibc` (branch `libmvec`), predating the formal RFC series. [NEEDS VERIFICATION: repository and commit details not independently re-fetched this session.]

**RISC-V RFC timeline:**

| Date | Author (org) | Submission | Status |
|---|---|---|---|
| 2024-04-08 | Yulong Shi (ISCAS) | RFC V1: single double-precision cos | Unmerged |
| 2024-04-15 | Yulong Shi (ISCAS) | [RFC V4](https://sourceware.org/pipermail/libc-alpha/2024-April/156072.html): ABI version bump `GLIBC_2.39` to `GLIBC_2.40`, demonstration vector cos, ~356 lines / 10 files | Unmerged; Palmer Dabbelt (Rivos) pointed to Rivos's veclibm and suggested starting from a single function |
| 2024-11-04 | Zhijin Zeng (SpacemiT) | [RFC V4 new](https://sourceware.org/pipermail/libc-alpha/2024-November/161214.html): 30+ double-precision functions (VLENB <= 256), symbol scheme `_ZGV<LMUL>N<simdlen>v..._<func>`, accompanying GCC patch, licensing concern raised (Apache-2.0 vs LGPL) | Unmerged |
| 2026-02-08 | Zihong Yao (PLCT/ISCAS) | [RFC PATCH 0/5](https://sourceware.org/pipermail/libc-alpha/2026-February/174950.html): log/logf infrastructure, 1,765 lines / 23 files, SpacemiT X60 benchmarks | Unmerged, blocked on licensing and version-symbol objections |
| 2026-05-14 | zhou.yanan (ZTE) | [RFC PATCH 1-2/2](https://sourceware.org/pipermail/libc-alpha/2026-May/177378.html): VLA support, Fortran declarations, improved exp (from ARM Optimized Routines), symbol rename to `_ZGVr*` | Unmerged, objected to on ABI and procedural grounds |
| 2026-07-06 | Zhijin Zeng (SpacemiT) | [PATCH 0/2, gcc-patches](https://gcc.gnu.org/pipermail/gcc-patches/2026-July/722818.html): GCC-side OpenMP vector function name mangling for RISC-V (compiler prerequisite, not glibc itself) | Under review; Robin Dapp (2026-07-07) flagged CI failures, requested Kito Cheng review; not merged; no further activity through September 2026 |

Zero libmvec RISC-V patches have been merged into upstream glibc as of 2026-09-30. The only related item that has merged is the compiler/ABI prerequisite psABI spec (Section 9).

## 3. Upstream Support Tier

glibc has no published formal architecture-tier policy (no Rust-style Tier 1/2/3 system). Support is de facto: an architecture is "in" when its `sysdeps/<arch>` tree exists and is wired into `scripts/build-many-glibcs.py`; libmvec specifically requires the arch's `configure.ac` to set `build_mathvec=yes`, done today only for x86_64 and aarch64.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `build_mathvec=yes` set | Yes | Yes | No |
| libmvec code merged | Yes (since 2015) | Yes (glibc 2.38, 2023) | No |
| Upstream CI exercising libmvec | No (glibc has no CI system at all for any arch, see Section 7) | No | No |
| Distro binary packages | Yes | Yes | No (package absent entirely, not merely missing riscv64 builds) |

**Assessment:** RISC-V libmvec is pre-tier. It does not exist in upstream glibc and has no committed maintainer. The comparison point is aarch64 before the 2023 ARM effort, not aarch64 today. The RFC has no assigned patchwork delegate and no Reviewed-by/Acked-by tag has been recorded on any patch in the series.

## 4. Technical Architecture and RISC-V-Specific Subsystems

**libmvec build gate:** `mathvec/Makefile` compiles the library only when `$(build-mathvec)` is set; `mathvec/Depend` contains only `math`, and `mathvec/Makefile` links `libmvec.so` against `$(libm)`. The gate is set per architecture in `sysdeps/<arch>/configure.ac` (confirmed live: `sysdeps/x86_64/configure.ac` explicitly sets `build_mathvec=yes`). `sysdeps/riscv/configure.ac` (full content verified live) contains only R_RISCV_ALIGN linker-relaxation and static-PIE checks; no `build_mathvec` line exists anywhere in it.

**RVV gating in glibc:** `sysdeps/riscv/preconfigure.ac` (full content verified live) hard-gates any V-extension code path:
```
test $version -lt 15 && AC_MSG_ERROR([glibc requires GCC 15 or later for the V extension], [1])
test $vector -lt "1000000" && AC_MSG_ERROR([glibc requires at least RVV 1.0 for the V extension], [1])
```
This requires GCC >= 15 and RVV spec >= 1.0 and is a hard configure abort, not a soft warning.

**Current upstream riscv64 content with vector relevance (verified via direct inspection of `sysdeps/riscv/`):** the subdirectory contains `bits/`, `multiarch/`, `nofpu/`, `nptl/`, `rv32/`, `rv64/`, `rvd/` (scalar double-precision FP helpers), `rvf/` (scalar single-precision FP helpers), `rvv/`, `sys/`. There is no `mathvec/`, `libmvec/`, or `fpu/` subdirectory under `sysdeps/riscv/`. `sysdeps/riscv/rvv/` contains exactly one file, `memset.S`, an RVV-accelerated memset (a string/memory routine, landed December 2025, unrelated to math). `sysdeps/riscv/multiarch/` contains only memcpy/memset RVV string-routine dispatch, no math dispatch.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `build_mathvec := yes` in arch Makefile/configure | Yes | Yes | Absent, no `sysdeps/riscv/fpu/` directory exists |
| Vectorized function sources (e.g. `*_avx512.c`, `*_advsimd.c`) | Dozens of files | Dozens of files (`cos_advsimd.c`, `exp_advsimd.c`, `pow_advsimd.c`, etc.) | Zero files |
| `libmvec.abilist` | Present | Present | Does not exist |
| ifunc/multiarch dispatch for math | Present | Present | Only memcpy/memset RVV dispatch; no math dispatch |
| GCC SIMD clone support | Present | Present | Patch under review (July 2026), not merged |
| VLA variant symbols (`_ZGV*Nxv_*`) | No (fixed-width only) | No (fixed-width only) | Proposed in RFC only, unmerged |

**What the unmerged RFC patches propose (February 2026 series, 5 patches, 1,765 lines):** a multi-LMUL instantiation pattern, a single `v_d_log_skeleton.c` implementation included four times with different LMUL macros, generating one exported symbol per (LMUL, SIMDLEN) pair, e.g. for log: `_ZGVr1N2v_log`, `_ZGVr1N4v_log`, `_ZGVr2N2v_log`, `_ZGVr2N4v_log`, `_ZGVr2N8v_log`, `_ZGVr4N4v_log`, `_ZGVr4N8v_log`, `_ZGVr4N16v_log`, `_ZGVr8N8v_log`, `_ZGVr8N16v_log`, `_ZGVr8N32v_log`. The log algorithm uses a 7-bit table lookup into a 128-entry table, biased-exponent extraction, `vfrec7` approximation, a degree-6 polynomial, compensated summation (`T_hi`/`T_lo` split), and FRM CSR save/restore via `frrm`/`fsrm` inline assembly.

**Performance data, SpacemiT X60 (from the February 2026 RFC cover letter):** logf up to 4x speedup at LMUL=4/SIMDLEN=32 vs scalar libm, degrading to 3x at LMUL=8/SIMDLEN=64 (register spilling), GCC 15.2 and Clang 21, `-O3`, accuracy <=1 ULP vs libm; log up to 2x at LMUL=2/SIMDLEN=8, similar spilling at LMUL=8.

**Performance data, SpacemiT K1 (VLEN=256), exp, N=1M, REPEAT=1000 (from the May 2026 ZTE RFC):**

| Implementation | Time | Relative |
|---|---|---|
| ARM Optimized Routines exp (proposed) | 9.92 s | 1x |
| Rivos veclibm v4 | 16.14 s | 1.63x slower |
| Rivos veclibm v1 | 17.79 s | 1.79x slower |
| Rivos veclibm v3 | 23.05 s | 2.32x slower |
| Rivos veclibm v2 | 23.47 s | 2.37x slower |

**VLA vs VLS penalty, SpacemiT K1 VLEN=256, exp (same source):** `-march=rv64gcv` (assumes VLEN=128) 39.84 s vs `-march=rv64gcv_zvl256b` (actual VLEN=256) 17.79 s, a 2.24x penalty from the compiler under-assuming hardware VLEN.

**GCC middle-end constraint:** `struct cgraph_simd_clone`'s `vecsize_mangle` field is single-character; RISC-V requires a multi-character field because the ISA identifier consumes one character and the LMUL token another. The July 2026 GCC patch (Zhijin Zeng, `gcc-patches/722819`) adds `TARGET_SIMD_CLONE_COMPUTE_VECSIZE_AND_SIMDLEN`, `_ADJUST`, and `_USABLE` hooks to `riscv.cc` (15 files, 618 insertions) implementing `_ZGV<isa><mask><len><params>_<func>` mangling per the merged psABI spec, and includes libmvec-oriented tests for exp/log/pow. It remains under review with flagged CI failures as of 2026-09-30.

## 5. Build System, Cross-Compilation, and Toolchain

glibc uses GNU Autoconf/`configure` plus GNU Make only. There is no CMake, no Dockerfile, and no `-DUSE_X=OFF`-style flag anywhere in the glibc tree (confirmed by full-tree search); the only `-DUSE_*` flags present are unrelated internal knobs (e.g. `-DUSE_TCACHE=1`, `-DUSE_PTHREADS=0`), none riscv or mathvec related.

**Standard riscv64 cross-build:**
```
../glibc/configure \
  --host=riscv64-linux-gnu \
  --with-headers=<SYSROOT>/usr/include \
  --prefix=/usr \
  --enable-kernel=5.15 \
  --disable-werror \
  CC=riscv64-linux-gnu-gcc
```
`--enable-mathvec` does not exist upstream; it only appears in the unmerged RFC patch series.

**Toolchain minimums (from glibc `INSTALL`, verified live):**

| Tool | Minimum | Why |
|---|---|---|
| GCC | 12.1 | `INSTALL`: "GCC 12.1 or higher is required" |
| GCC (V extension code paths) | 15 | Hard `AC_MSG_ERROR` in `sysdeps/riscv/preconfigure.ac` |
| RVV spec | >= 1.0 | Same file, `AC_MSG_ERROR` on `__riscv_v < 1000000` |
| GNU binutils | 2.39+ | R_RISCV_ALIGN linker relaxation |
| GNU Make | 4.0 | `INSTALL` general requirement |
| Python | 3.4+ | `INSTALL` general requirement |
| GNU texinfo | 4.7+ | `INSTALL` |
| GNU awk (gawk) | 3.1.2+, built with MPFR for testing | `INSTALL` |
| GNU bison | 2.7+ | `INSTALL` |

No Clang minimum is documented by glibc upstream; glibc's own build is GCC-only. Clang appears only in third-party consumers (the archived veclibm reference repo used Clang 18).

**Official riscv64 CI build configurations (`scripts/build-many-glibcs.py`, verbatim):**
```python
self.add_config(arch='riscv64', os_name='linux-gnu', variant='rv64imac-lp64',
                gcc_cfg=['--with-arch=rv64imac', '--with-abi=lp64', '--disable-multilib'])
self.add_config(arch='riscv64', os_name='linux-gnu', variant='rv64imafdc-lp64',
                gcc_cfg=['--with-arch=rv64imafdc', '--with-abi=lp64', '--disable-multilib'])
self.add_config(arch='riscv64', os_name='linux-gnu', variant='rv64imafdc-lp64d',
                gcc_cfg=['--with-arch=rv64imafdc', '--with-abi=lp64d', '--disable-multilib'])
```
No `rv64gcv` or V-extension variant exists in this script. These three configurations build only scalar-ISA cross-toolchains plus glibc; the script has zero QEMU or `test-wrapper` references (verified by direct grep) and does not itself run tests under emulation.

**QEMU usage:** glibc's cross-testing mechanism (documented in `INSTALL`) is generic: `make check test-wrapper="SRCDIR/scripts/cross-test-ssh.sh HOSTNAME"`, or any program set as `test-wrapper`. No riscv64/QEMU-specific wrapper is documented upstream; the only architecture-specific `test-wrapper` example in `INSTALL` is AArch64 SVE's `vltest.py`. In practice, riscv64 glibc testing under QEMU (e.g. `test-wrapper='qemu-riscv64 -L <sysroot>'`) is a downstream/CI convention, not something the glibc tree itself ships or documents. The only riscv-adjacent file mentioning `qemu` is a workaround comment in `sysdeps/unix/sysv/linux/riscv/flush-icache.c`, unrelated to build/test infrastructure.

**veclibm reference build (MIT-licensed, archived March 30, 2026):** CMake-based, Clang 18 toolchain, target `riscv64-linux-gnu`, `-march=rv64gcv_zba_zbb_zbs`; CI used QEMU with `vlen=128`, `vlen=256`, `vlen=512` variants; testing via `ctest -j$(nproc)`. No Dockerfile exists in either the glibc tree or the veclibm repository.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| libmvec source files | Yes, since glibc 2.22 | Yes, since glibc 2.38 | No |
| `libmvec.abilist` | Yes | Yes | No |
| `sysdeps/*/fpu/Versions` | Yes | Yes | No (no `fpu/` directory) |
| `bench-libmvec-arch.h` | Yes | Yes | No |
| `build_mathvec=yes` | Yes (unconditional) | Yes (default fallback) | No |
| GCC SIMD clone support | Yes | Yes | No (patch under review, July 2026) |
| VLA variant symbols | No (fixed-width only) | No (fixed-width only) | Proposed in RFC only |

**Functions present in aarch64 libmvec (glibc 2.38+):** cos, cosf, exp, expf, exp2, exp2f, exp10, exp10f, log, logf, log2, log2f, pow, powf, sin, sinf (minimum set; SVE variants add more). [NEEDS VERIFICATION on exact function count.]

**Functions proposed in the RISC-V RFC (November 2024 series, unmerged):** exp, asin, atan, acos, atanh, exp10, exp2, tan, tanh, pow, sin, log, cos, acosh, asinh, atan2, expm1, tgamma, lgamma, log2, log10, cbrt, erfc, erf, cosh, sinh (double-precision only; single-precision noted as "pending future work"). The February 2026 series added log and logf only (first single-precision work); full single-precision coverage remains unsubmitted.

**Gap summary:** riscv64 has zero libmvec coverage, not a stub or partial coverage. aarch64 reached initial coverage in glibc 2.38 (2023). The riscv64 effort is at least one full release cycle behind where aarch64 was pre-merge, with additional structural blockers (licensing, ABI naming, missing GCC codegen) not present for aarch64. No NaN/floating-point semantics divergence data exists because no riscv64 implementation exists to compare.

## 7. CI/CD Infrastructure

No `.gitlab-ci.yml` and no `.github/` directory exist anywhere in the glibc repository (verified against the full top-level tree listing); this applies to every architecture, not just riscv64. `scripts/build-many-glibcs.py` defines three riscv64 build configurations but is a standalone developer/bot-driven script with `bot`/`bot-cycle` modes, not a wired CI pipeline definition file.

**Sourceware Buildbot (`builder.sourceware.org`):** direct query of the live Buildbot API shows an active riscv64 glibc builder, `glibc-ubuntu-riscv` (builder id 293, tags `glibc`/`ubuntu`/`riscv`), running on real hardware (worker `starfive-riscv`), with builds roughly daily (build #830 in progress 2026-09-30, #829 on 2026-09-29). Its raw configure log confirms `checking host system type... riscv64-unknown-linux-gnu`. Recent builds (#826-#829) report "2 failed test (failure)"; the failure is `FAIL: nscd/tst-nscd-basic`, unrelated to math or libmvec. A second builder, `glibc-fedora-riscv` (id 336), is stale: last build #211 was 2025-06-10, over a year old, with no master currently attached. In build #829's `make` log, the `mathvec` subdirectory is entered and linked into `libc.so`, but only stamp files are produced; no riscv-specific object files are compiled because none exist in the tree, directly confirming that the RFC patches were never merged.

**glibc `Testing/Results` wiki** (`sourceware.org/glibc/wiki/Testing/Results`): lists aarch64, hppa, ia64, loongarch64, mips, x86_64; riscv64 is absent, and `Testing/Results/riscv64-unknown-linux-gnu` returns HTTP 404.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Buildbot builder (glibc, general) | Yes | Yes | Yes (`glibc-ubuntu-riscv`, active, real hardware) |
| Buildbot builder exercising libmvec code | Yes | Yes | No (no libmvec riscv64 code exists to compile or test) |
| Testing/Results wiki entry | Yes | Yes | No |

**RISE pre-commit CI:** the RISE December 2024 webinar listed "glibc pre-commit CI" as an active initiative. Its scope, configuration, and architecture coverage are not publicly documented; whether it duplicates or extends the `glibc-ubuntu-riscv` Buildbot builder, and whether it has any libmvec-related tests, is unknown. Data not available: RISE internal CI configuration details for this initiative.

**libmvec-specific CI for riscv64:** does not exist, because libmvec has no riscv64 code in the tree to test. The general riscv64 glibc CI that does exist (the Buildbot builder) provides no coverage of this gap, since it only compiles and links whatever is present in `mathvec/`, which for riscv64 is nothing.

## 8. Distribution and Release Status

libmvec is not available for riscv64 in any distribution or package-index channel checked. As a glibc-internal component it is never distributed as a standalone package; the check below is for its presence bundled inside `libc6`/`libc6-dev`, or as a hypothetical standalone package.

| Channel | riscv64 libmvec available | Evidence |
|---|---|---|
| PyPI | No (not applicable) | `https://pypi.org/pypi/libmvec/json` returns HTTP 404; no package named `libmvec` exists on PyPI for any architecture (libmvec is not a Python package) |
| RISE wheel builder (GitLab PyPI proxy) | No | Proxies to PyPI; `pypi.org/simple/libmvec/` also 404s |
| Ubuntu 26.04 "resolute" | No (package absent for all architectures) | `packages.ubuntu.com` search for `libmvec` in suite `resolute`, all sections, returns "Sorry, your search gave no results" |
| Ubuntu 24.04 LTS (Noble) | No | riscv64 `libc6-dev` filelist does not include `libmvec.a`/`libmvec.so`; the amd64 filelist does |
| Debian (all suites including sid) | No | packages.debian.org name and contents search returns zero results for `libmvec` on riscv64 |
| Arch Linux RISC-V (archriscv.felixc.at) | No | Full listing of `core/`, `extra/`, `community/` repos shows zero matches; direct extraction of the live riscv64 glibc package `glibc-2.44+r50+g1848099f063e-1-riscv64.pkg.tar.zst` (built 2026-09-28) shows `usr/lib/libc.so.6` and `usr/lib/libm.so.6` present but no `libmvec.so` anywhere in the archive |
| Fedora Koji | No | Package search for `libmvec*` returns zero results |

For comparison, on amd64, `libc6-dev` in Ubuntu Noble explicitly ships `/usr/lib/x86_64-linux-gnu/libmvec.a` and `/usr/lib/x86_64-linux-gnu/libmvec.so`.

The root cause is upstream, not packaging: glibc's build system never constructs `libmvec.so` for riscv64 because no `sysdeps/riscv/configure.ac` fragment sets `build_mathvec=yes`, and even if it did, there is no vectorized implementation code in the tree to compile. No distro packaging workaround is possible without an upstream glibc patch landing first. A riscv64 user today gets only the scalar libm fallback through `libc6`; there is no binary, source patch, or build flag that produces a working riscv64 `libmvec.so`.

## 9. Dependencies

| Name | Role | riscv64 Status | Notes / Blocking issues |
|---|---|---|---|
| glibc | Runtime dependency, critical (libmvec's parent project; `mathvec/Depend` declares only `math`, and `libmvec.so` links against `$(libm)` at build time) | libm/core glibc ships on riscv64; the `mathvec/` subtree itself is never built for riscv64 | Primary structural blocker is the missing `build_mathvec=yes` flag in `sysdeps/riscv/configure.ac`, not libm availability |
| GCC | Build-dependency, critical (compiles glibc generally; GCC >= 15 hard-required for any V-extension code path per `sysdeps/riscv/preconfigure.ac`) | GCC 15.1+ is released and available in riscv64 toolchains; GCC's own SIMD-clone hooks for RISC-V (`_ZGV*` mangling) remain an unmerged patch under review since July 2026 (gcc-patches [722818](https://gcc.gnu.org/pipermail/gcc-patches/2026-July/722818.html), [722819](https://gcc.gnu.org/pipermail/gcc-patches/2026-July/722819.html)) | Robin Dapp (2026-07-07, [722985](https://gcc.gnu.org/pipermail/gcc-patches/2026-July/722985.html)) flagged CI failures blocking acceptance; no merge as of 2026-09-30 |
| GNU binutils | Build-dependency, critical (assembler/linker; RVV instruction encoding, R_RISCV_ALIGN relaxation) | Binutils 2.39+ ships in all riscv64 distros | No known blocker specific to libmvec |
| Linux kernel | Runtime dependency, critical (RVV hardware-feature probing via `RISCV_HWPROBE_IMA_V`, `prctl(PR_RISCV_V_VSTATE_CTRL)`) | Linux 6.4+ (hwprobe) and 6.5+ ship in current distros; hardware with RVV 1.0 exists (SpacemiT K1/X60, SiFive P670/P870, SG2042/SG2044) | A separate, already-identified bug affects any future RVV IFUNC dispatch: the `__memset_vector` IFUNC resolver does not re-check `PR_RISCV_V_VSTATE_CTRL` after startup, so a process disabling RVV post-init gets SIGILL; the same pattern would affect a future RVV libmvec IFUNC |
| QEMU | Test-dependency, critical (riscv64 emulation for build/test in the absence of upstream glibc CI wiring; `veclibm`'s own CI used QEMU with vlen=128/256/512) | QEMU 8+ supports RVV 1.0 emulation; not wired into glibc's own test harness (`scripts/build-many-glibcs.py` has zero QEMU references) | glibc's Sourceware Buildbot riscv64 builder (`glibc-ubuntu-riscv`) runs on real hardware, not QEMU, and does not exercise libmvec regardless |
| `build_mathvec` configure flag | Source-level build gate (not a package) | Unset in `sysdeps/riscv/configure.ac`; defaults to `no` | Primary structural blocker for the whole effort; setting it alone is insufficient without real implementation files |
| veclibm (Rivos) | Reference RVV math implementation the RFC patches derive from | Archived (read-only) March 30, 2026; relicensed to MIT in the same month | Licensing objection from Carlos O'Donell/Florian Weimer (Apache-2.0 vs LGPL-2.1) is resolved by the MIT relicense, but no new glibc patch series has been resubmitted since; open issue [#34](https://github.com/rivosinc/veclibm/issues/34) ("Unused variable might be an error") remains unfixable in the archived repo |
| LLVM/Clang vector library mapping | Compiler-side consumer: maps auto-vectorized calls to `_ZGV*` symbols | [PR #193721](https://github.com/llvm/llvm-project/pull/193721) open, Draft/WIP, 3 failing tests (`Flang.Driver/fveclib.f90`, `LLVM.Transforms/LoopVectorize/RISCV/libm-vector-calls.ll`, `Clang.Driver/fveclib.c`); supersedes closed [PR #119844](https://github.com/llvm/llvm-project/pull/119844) | Reviewers closed #119844 on the grounds that glibc itself had no riscv64 libmvec implementation yet |
| riscv-elf-psABI vector function name-mangling spec | ABI naming prerequisite (`_ZGVr<lmul><mask><len><params>_<func>`) | [PR #455](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/pull/455) merged 2026-06-18 | Resolved; removes one prerequisite blocker, but no glibc or (until July 2026) GCC follow-up patch series had been resubmitted in the interim |

## 11. Known Bugs and Active Issues

| ID | Tracker | Description | Status |
|---|---|---|---|
| (no upstream ID) | libc-alpha | RFC PATCH 0/5 (Feb 2026): blocked on Apache-2.0 veclibm vs LGPL-2.1 incompatibility; Carlos O'Donell: "The current license of the code makes [it] unacceptable for inclusion in glibc"; Florian Weimer asked whether copyright could be assigned to the FSF | Open; licensing partially resolved by veclibm's March 2026 MIT relicense, but no new patch series resubmitted |
| (no upstream ID) | libc-alpha | RFC PATCH 0/5 (Feb 2026): GLIBC version-symbol error, used `GLIBC_2.43` after that version had already released; flagged by Joseph Myers | Open, unfixed in any subsequent patch |
| (no upstream ID) | libc-alpha | RFC PATCH 1/2 (May 2026): symbol rename `_ZGV<lmul>N...` to `_ZGVr<lmul>N...` breaks ABI backward compatibility for consumers of earlier RFC builds; Florian Weimer: "Ugh, we can't do that" | Open; Weimer proposed retaining old symbols as compat or bumping the soname |
| (no upstream ID) | libc-alpha | RFC PATCH 1/2 (May 2026): submitted against an out-of-tree branch rather than glibc master; Adhemerval Zanella Netto questioned the basis for this | Open, procedurally unresolved |
| (no upstream ID) | gcc-patches | PATCH 0/2 (July 2026): RISC-V SIMD clone / OpenMP vector name mangling; CI failures flagged by Robin Dapp, review from Kito Cheng requested | Open, under review, not merged |
| [#193721](https://github.com/llvm/llvm-project/pull/193721) | llvm/llvm-project | RISC-V libmvec support, Draft/WIP; 3 failing tests: FileCheck `captures(none)` vs `nocapture` mismatch in `libm-vector-calls.ll`; missing `-plugin-opt=-vector-library=LIBMVEC` LTO emission in `fveclib.c`; no error diagnostic emitted in `fveclib.f90` | Draft, failing CI |
| [#119844](https://github.com/llvm/llvm-project/pull/119844) | llvm/llvm-project | Prior RISC-V libmvec PR; closed 2026-04-23, pending psABI finalization | Closed, superseded by #193721 |
| [#34](https://github.com/rivosinc/veclibm/issues/34) | rivosinc/veclibm | "Unused variable might be an error" | Open; repo archived March 30, 2026, no further fix possible |
| (design, no bug filed) | GCC `cgraph.h` | `struct cgraph_simd_clone` lacks an LMUL field; requires either a new field or a `TARGET_SIMD_CLONE_MANGLE`-style hook | Addressed by the July 2026 GCC patch under review; not yet merged |
| (no upstream ID) | glibc | RVV IFUNC resolver for `__memset_vector` does not re-check `PR_RISCV_V_VSTATE_CTRL` after startup; a process disabling RVV post-init can hit SIGILL; same pattern would affect a future RVV libmvec IFUNC | Open, design-level concern for any future RVV IFUNC dispatch |

## 12. Objections and Upstream Blockers

**1. Licensing (February 2026, Carlos O'Donell and Florian Weimer).** The RFC patches derive from Rivos's veclibm, originally Apache-2.0 licensed. The FSF considers Apache-2.0 incompatible with LGPL-2, which glibc uses. O'Donell: "The current license of the code makes [it] unacceptable for inclusion in glibc." Weimer asked whether copyright could be assigned to the FSF.
**Resolution status:** veclibm was relicensed to MIT and archived March 30, 2026 (MIT is FSF-compatible with LGPL). No glibc patch series has been resubmitted since; whether FSF copyright-assignment paperwork is still required in addition to the license change is unclear, and is now a legacy/ambiguous expectation following the FSF's 2021 removal of the blanket copyright-assignment requirement (Section 1).

**2. ABI symbol naming backward incompatibility (May 2026, Florian Weimer).** The May 2026 RFC renamed symbols from `_ZGV<lmul>N...` to `_ZGVr<lmul>N...` per the (then-draft) psABI spec. Weimer objected to treating this as a clean break since the old symbols were already published in an earlier RFC. He proposed retaining old symbols as compatibility symbols or bumping the libmvec soname.
**Resolution status:** unresolved; no updated patch exists.

**3. Procedural: patch against an out-of-tree branch (May 2026, Adhemerval Zanella Netto).** The May 2026 RFC was submitted against Zeng's November 2024 branch rather than glibc master.
**Resolution status:** unresolved; would require a rebase onto glibc master.

**4. GLIBC version symbol error (February 2026, Joseph Myers).** The February 2026 RFC used `GLIBC_2.43` in `Versions`/`.map` files, but 2.43 had already released at submission time.
**Resolution status:** unresolved; mechanical fix but blocks acceptance.

**5. GCC SIMD clone support missing (first noted April 2024, Palmer Dabbelt).** No GCC patches existed at the time of the first RFC to validate codegen end to end.
**Resolution status:** a real GCC patch now exists (July 2026, Zhijin Zeng), under review with CI failures flagged by Robin Dapp; the psABI blocker for these GCC patches resolved June 18, 2026.

**6. Single-precision variants missing.** The November 2024 RFC explicitly deferred single precision ("pending future work"); the February 2026 RFC added log and logf only.
**Resolution status:** partially addressed; full single-precision coverage across the function set has not been submitted.

**7. veclibm's VLENB <= 256 limitation.** The November 2024 RFC limited support to VLENB <= 256; wider hardware (VLEN=512) would bypass the vectorized paths.
**Resolution status:** partially addressed in the May 2026 RFC via VLA (`_ZGVr<lmul>Nxv_*`) symbols, which carry their own performance issue: the auto-vectorizer assumes VLEN=128 under `-march=rv64gcv`, a 2.24x loss on VLEN=256 hardware versus `-march=rv64gcv_zvl256b` (Section 4).

**Acceptance probability:** four generations of unmerged RFC series (Apr 2024, Nov 2024, Feb 2026, May 2026) across three submitting organizations, none with an Acked-by or Reviewed-by from a glibc maintainer, indicate the technical objections are specific and addressable but the organizational gap (no submitter holds glibc commit rights) is the structural bottleneck. Maintainer engagement is substantive rather than dismissive on each round, which is a positive signal for eventual acceptance given a sponsor with committer relationships, but does not by itself predict a merge timeline.

## 13. Readiness Assessment

- **Color:** Orange (optimization-absent)
- **Release provider:** None
- **Optimization-purpose project:** Yes
- **Optimization level:** Absent. No merged riscv64 code exists anywhere in glibc's `mathvec/` or math-vector path, and `sysdeps/riscv/configure.ac` never sets `build_mathvec=yes`. The operations lacking a RISC-V implementation are the entire vectorized math function set (log, logf, exp, sin, cos, pow, and the ~40 functions enumerated across the RFC series); the ISA extension that would close the gap, the V extension (RVV >= 1.0) with GCC >= 15, is already hard-required by `sysdeps/riscv/preconfigure.ac` for any future implementation but is not sufficient by itself, since the implementation code, ABI, and build-gate flag are all absent.

**Justification:** libmvec has no upstream CI at all (glibc has no `.github/` or `.gitlab-ci.yml`; `scripts/build-many-glibcs.py` is a developer script, not CI) and zero riscv64 libmvec packages exist in Debian, Ubuntu, or Fedora, so the base grade per the CI table is orange (no upstream CI, no release, and no distro-floor upgrade since the package is entirely absent, not just unpatched); see [`sysdeps/riscv/configure.ac`](https://sourceware.org/git/glibc.git) (no `build_mathvec` flag) and the [February 2026 RFC cover letter](https://sourceware.org/pipermail/libc-alpha/2026-February/174950.html). As an optimization-purpose SIMD math library, its RISC-V optimization level is "absent" (no merged riscv-specific vectorized math code anywhere upstream), which caps at orange and matches the CI-derived grade, so the color stays orange rather than red since this reflects "never implemented" rather than confirmed breakage. Note: this report's independent CI research additionally confirmed that a general riscv64 glibc Buildbot builder (`glibc-ubuntu-riscv`, id 293, active on real hardware) does exist, but it does not affect this grade because it exercises no libmvec code at all, since none exists in the tree to compile.

**Pending work that could change the grade:** four generations of unmerged RFC patch series on libc-alpha (Apr 2024 ISCAS/Yulong Shi, Nov 2024 SpacemiT/Zhijin Zeng, Feb 2026 PLCT-ISCAS/Zihong Yao, May 2026 ZTE/zhou.yanan), all blocked on substantive maintainer objections (Apache-2.0/LGPL licensing conflict, partially resolved by veclibm's March 2026 MIT relicense but no new patch resubmitted; ABI symbol-naming break; wrong GLIBC version symbol; out-of-tree-branch procedural issue) with no Acked-by/Reviewed-by from any maintainer. Compiler-side LLVM [PR #193721](https://github.com/llvm/llvm-project/pull/193721) remains an open Draft with 3 failing tests (superseding closed [PR #119844](https://github.com/llvm/llvm-project/pull/119844)). The psABI vector-function name-mangling spec ([riscv-non-isa/riscv-elf-psabi-doc PR #455](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/pull/455)) merged 2026-06-18, removing one prerequisite blocker, and this did produce one follow-up: a GCC PATCH 0/2 series (Zhijin Zeng, July 6 2026, [gcc-patches/722818](https://gcc.gnu.org/pipermail/gcc-patches/2026-July/722818.html)) implementing the mangling in `riscv.cc`, still under review with CI failures flagged by Robin Dapp as of 2026-09-30; no glibc-side patch series has followed. No RISE blog post, funded project, or member with glibc commit rights is involved; none of the three submitting organizations (ISCAS/PLCT, SpacemiT, ZTE) has an established glibc committer, which is the structural gap likely explaining the stalled review cycle (contrast with aarch64's approximately 6-week RFC-to-merge in 2023 via ARM engineers with existing committer relationships).

## 14. Investment Analysis

Before sizing new work: RISE has not funded or blogged about libmvec in any of its 35 posts published 2024-05 through 2026-09, and no RISE-affiliated repository or working-group roadmap item targets it (Section 9's contributor institutions, ISCAS/PLCT, SpacemiT, ZTE, are RISE General Members doing this work independently of any RISE-funded project). The only glibc riscv64 infrastructure RISE-adjacent work has touched is the unrelated RVV memset (landed December 2025). No effort below is already covered by RISE funding.

### 14.1 Functional Enablement

**GCC SIMD clone hooks:** a real patch now exists (July 2026, Zhijin Zeng, `gcc-patches/722818`-`722819`) implementing the required hooks with psABI-final naming; it is under review with CI failures flagged by Robin Dapp. Remaining work is fixing those CI failures and carrying the patch through review to merge. Estimate: 2-4 person-weeks for a GCC-experienced engineer (reduced from a from-scratch estimate since the psABI blocker is resolved and an initial patch exists).

**glibc libmvec RISC-V implementation:** the February 2026 RFC covers log and logf. A minimal upstream-acceptable submission requires: (a) rebase onto glibc master, (b) a correct GLIBC version symbol, (c) MIT-licensed or originally written source code (the veclibm MIT relicense resolves the origin question; FSF copyright-assignment paperwork requirements remain unclear), (d) at minimum exp/expf, sin/sinf, cos/cosf, log/logf as a first function set. Estimate: 4-6 person-weeks for a glibc-experienced engineer, longer if a copyright-assignment process is required.

**LLVM vector library mapping:** [PR #193721](https://github.com/llvm/llvm-project/pull/193721) is WIP/Draft with 3 mechanical failures (FileCheck string mismatch, missing LTO plugin flag emission, wrong error diagnostic). Estimate: 1-2 person-weeks to fix and move from Draft to ready-for-review.

**Total for minimal functional enablement:** approximately 7-12 person-weeks of engineering across GCC, glibc, and LLVM upstreams, plus unpredictable elapsed calendar time for review-cycle and possible copyright-assignment paperwork (potentially several weeks to months, independent of engineering effort). The work is not bottlenecked on implementation complexity; it is bottlenecked on upstream process navigation and the absence of a submitter with glibc/GCC commit rights.

### 14.2 Performance Optimization

Performance data is sparse and comes entirely from SpacemiT hardware (X60 and K1); no published riscv64-vs-amd64 or riscv64-vs-arm64 libmvec comparison exists anywhere found [NEEDS VERIFICATION]. Available riscv64 vectorized math speedups: logf up to 4x vs scalar on SpacemiT X60 (LMUL=4/SIMDLEN=32); log up to 2x vs scalar on SpacemiT X60 (LMUL=2/SIMDLEN=8); exp implementation choice alone spans a 1.63x-2.37x range among competing candidate implementations on SpacemiT K1. This 2x-4x range is broadly consistent with published aarch64 SVE libmvec speedups at comparable vector widths, though no direct comparison has been published [NEEDS VERIFICATION].

**Key performance issue:** the VLA auto-vectorizer penalty (2.24x loss at VLEN=256 when compiled assuming VLEN=128) means portable builds targeting the widest hardware need hardware-specific `-march` flags or VLS symbols, a trade-off similar to aarch64 SVE vs fixed-width NEON but more pronounced given RISC-V's wider VLEN variance (128 to 512+ bits across shipping hardware). Optimization work beyond the initial port (algorithm selection, LMUL tuning, VLA vs VLS dispatch) is a secondary investment; the primary bottleneck remains getting any implementation merged.

### 14.3 CI/CD Infrastructure

No CI exercises libmvec riscv64 code because none exists to test. A general riscv64 glibc Buildbot builder (`glibc-ubuntu-riscv`, real hardware) already exists and would pick up libmvec tests automatically once code merges, provided the merged code includes test files; no new general riscv64 CI infrastructure needs to be built from scratch for this purpose. What is needed once implementation code lands:
- QEMU-based build and test at multiple VLEN values (128 and 256 minimum), feasible with QEMU 8+, to complement the single real-hardware Buildbot worker
- A GCC 15 cross-compiler available in whatever CI runs these builds
- Hardware-in-the-loop performance regression testing (not required for correctness CI, but relevant given the VLA/VLS performance sensitivity documented above)

Estimate: 2-3 person-weeks to add riscv64 libmvec-specific test wiring once code exists (the general riscv64 builder and its hardware are already present and do not need to be stood up).

### 14.4 Ecosystem Enablement

libmvec on riscv64 would unblock auto-vectorization of math-heavy code via `__attribute__((simd))` and OpenMP SIMD pragmas when compiled with GCC or Clang targeting riscv64, and HPC/numerical workloads (the [ZhouYan-an PoC](https://github.com/ZhouYan-an/riscv-simdclone-libmvec-vla-test-z1) validated `_ZGVr2Nxv_exp` and `_ZGVr2Nxv_log` being called at runtime during SPEC CPU 2017 benchmark 527.cam4_r on Sophgo SG2044, with no published speedup figure). The dependency chain is: psABI (done) -> GCC SIMD clone hooks (patch under review, ~2-4 weeks remaining) -> glibc libmvec RISC-V implementation (RFC stage, ~4-6 weeks) -> LLVM vector library mapping (WIP, ~1-2 weeks). These can be parallelized across teams, but the glibc portion depends on a usable, merged GCC.

SpacemiT and ISCAS/PLCT have done the primary technical work to date; ZTE has contributed a competing implementation approach. None has glibc or GCC commit access. A company with existing glibc/GCC maintainer relationships (Red Hat, Linaro, or a GCC-committer organization) sponsoring or co-reviewing this work would materially accelerate upstream acceptance; without such a sponsor, review cycles may continue to extend, as they have for the roughly 2.5 years since the first RFC (April 2024).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Carry the July 2026 GCC SIMD clone patch through CI fixes and review to merge | 2-4 | GCC RISC-V contributor with upstream access | Critical |
| Functional | glibc libmvec RISC-V initial port (log, logf, exp, expf, sin, sinf, cos, cosf; correct version symbols; MIT-licensed source; upstream process) | 4-6 + copyright paperwork (elapsed) | glibc contributor with upstream access | Critical |
| Functional | LLVM vector library mapping (fix 3 failing tests, move WIP to ready-for-review) | 1-2 | Clang/LLVM RISC-V contributor | High |
| Performance | Algorithm selection and LMUL tuning for the full function set (exp, pow, trig, hyperbolic, log variants) | 8-16 | Math library specialist | Medium |
| Performance | VLA/VLS dispatch strategy for variable-VLEN hardware | 2-4 | Math library specialist with RISC-V hardware access | Medium |
| CI/CD | Wire libmvec riscv64 tests into the existing `glibc-ubuntu-riscv` Buildbot builder and add QEMU multi-VLEN coverage | 2-3 | glibc CI contributor | High |
| CI/CD | Hardware-in-the-loop performance regression CI | 3-5 | Infrastructure engineer with RISE hardware access | Low |
| Ecosystem | Upstream sponsor engagement (a Red Hat, Linaro, or GCC-committer organization to co-review and hold commit rights) | 1-2 (coordination) | Leadership / partner relationship | Critical |

## 15. References

- [glibc source repository](https://sourceware.org/git/glibc.git)
- [RFC V4: Enable libmvec support for RISC-V (Yulong Shi, April 15, 2024)](https://sourceware.org/pipermail/libc-alpha/2024-April/156072.html)
- [RFC V4 new: RISC-V libmvec (Zhijin Zeng / SpacemiT, November 4, 2024)](https://sourceware.org/pipermail/libc-alpha/2024-November/161214.html)
- [RFC PATCH 0/5: riscv: Add libmvec routines, cover letter (Zihong Yao / PLCT, February 8, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174950.html)
- [Florian Weimer reply: licensing block (February 9, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174959.html)
- [Carlos O'Donell reply: licensing block (February 9, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174969.html)
- [RFC PATCH 1/2: RISC-V VLA support and Fortran declarations (ZTE, May 14, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-May/177378.html)
- [RFC PATCH 2/2: Improved double-precision exp (ZTE, May 14, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-May/177377.html)
- [Florian Weimer reply: ABI backward-compatibility concern (May 14, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-May/177379.html)
- [Adhemerval Zanella Netto reply: out-of-tree branch concern (May 14, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-May/177385.html)
- [riscv-elf-psabi-doc PR #455: name mangling for vector functions (merged June 18, 2026)](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/pull/455)
- [gcc-patches PATCH 0/2: RISC-V OpenMP vector function name mangling, cover letter (Zhijin Zeng, July 6, 2026)](https://gcc.gnu.org/pipermail/gcc-patches/2026-July/722818.html)
- [gcc-patches PATCH 1/2: OpenMP ISA mangle support for multi-character codes](https://gcc.gnu.org/pipermail/gcc-patches/2026-July/722817.html)
- [gcc-patches PATCH 2/2: RISC-V name mangling for vector function](https://gcc.gnu.org/pipermail/gcc-patches/2026-July/722819.html)
- [Robin Dapp reply: CI failures flagged (July 7, 2026)](https://gcc.gnu.org/pipermail/gcc-patches/2026-July/722985.html)
- [LLVM PR #193721: RISC-V libmvec support (WIP/Draft)](https://github.com/llvm/llvm-project/pull/193721)
- [LLVM PR #119844: RISC-V libmvec support (closed)](https://github.com/llvm/llvm-project/pull/119844)
- [rivosinc/veclibm: RISC-V vector math library (archived, MIT license)](https://github.com/rivosinc/veclibm)
- [rivosinc/veclibm issue #34](https://github.com/rivosinc/veclibm/issues/34)
- [ZhouYan-an/riscv-simdclone-libmvec-vla-test-z1: end-to-end PoC on SG2044](https://github.com/ZhouYan-an/riscv-simdclone-libmvec-vla-test-z1)
- [RISE blog: OpenJDK, supercharging vectorized math with SLEEF (September 24, 2025)](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/)
- [RISE members page](https://riseproject.dev/members/)
- [glibc Testing/Results wiki](https://www.sourceware.org/glibc/wiki/Testing/Results)
- [Sourceware Buildbot, builder glibc-ubuntu-riscv](https://builder.sourceware.org/buildbot/#/builders/293)