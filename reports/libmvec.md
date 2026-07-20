---
title: libmvec
categories:
  - libraries
---

# libmvec

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libmvec<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libmvec is the vectorized math library component of the GNU C Library (glibc). It provides SIMD-accelerated implementations of standard math functions (sin, cos, exp, log, pow, and variants) under the symbol naming convention `_ZGV*`. It is not a standalone project: it ships as `libmvec.so` and `libmvec.a` inside the `libc6` and `libc6-dev` distribution packages, built from the `mathvec/` subdirectory of the glibc tree.

The library is governed under the GNU Project / Free Software Foundation (FSF). Patches are submitted to the `libc-alpha` mailing list at sourceware.org and merged by established committers. FSF copyright assignment is expected for substantial contributions (referenced explicitly in the February 2026 RFC cover letter as an open question for the RISC-V submission). The project is licensed LGPLv2+.

libmvec is only built for a target architecture when the architecture's `sysdeps` configure fragment explicitly sets `build_mathvec=yes`. As of glibc master in June 2026, this is done only for x86_64 and aarch64. The RISC-V configure fragment (`sysdeps/riscv/configure.ac`) does not set this variable, so libmvec is never built for riscv64 in any released glibc version.

---

## 2. Port History and Upstreaming Timeline

**x86_64 (amd64):** Original architecture. First patchwork entry: 2015-06-23 (Joseph Myers, `math/Makefile` dependency fix). AVX512 implementations contributed by Andrew Senkevich in July 2015. Intel's Hongjiu Lu contributed multiarch functions in August 2015. This is the reference implementation against which all other ports are measured.

**AArch64 (arm64):** RFC proposed by Steve Ellcey (Cavium) in March 2018; not merged at that time. Re-proposed by Joe Ramsay (ARM) in February 2023 as RFC. Accepted and merged at v5 on 2023-04-12. Released in glibc 2.38 (August 2023). Time from first RFC to merge: approximately 6 weeks for the Joe Ramsay series (the prior Cavium series was abandoned).

**PPC64le (POWER8):** First function (double-precision cosine) committed 2019-04-03 by a contributor with a protonmail address.

**RISC-V (riscv64):** No code merged as of June 2026. See sections below for the full patch history.

**RISC-V RFC timeline:**

| Date | Author | Submission | Status |
|---|---|---|---|
| 2024-04-08 | Yulong Shi (ISCAS) | RFC V1: single double-precision cos under `sysdeps/riscv/rvd/` | Unmerged |
| 2024-04-15 | Yulong Shi (ISCAS) | RFC V2, V3, V4: revised ABI naming, veclibm-derived implementations | Unmerged |
| 2024-11-04 | Zhijin Zeng (SpacemiT) | RFC V4 (new): 30+ double-precision functions, GCC hooks included, Apache 2.0 licensing conflict raised | Unmerged |
| 2026-02-08 | Zihong Yao (PLCT/ISCAS), co-authored Yulong Shi, Zhijin Zeng | RFC PATCH 0/5: log + logf + infrastructure, 1,765 lines across 23 files | Unmerged, blocked |
| 2026-05-14 | zhou.yanan@zte.com.cn (ZTE) | RFC PATCH 1-2/2: VLA support, Fortran declarations, improved exp (ARM Optimized Routines), symbol rename to `_ZGVr*` | Unmerged, procedurally rejected |

Zero libmvec RISC-V patches have been merged into upstream glibc as of this report date.

---

## 3. Upstream Support Tier

glibc has no published formal tier policy.

The precedent from the aarch64 port shows that a well-staffed ARM team (multiple named ARM engineers with pre-existing glibc committer relationships) moved from RFC to merge in approximately 6 weeks. The RISC-V effort, spanning April 2024 to May 2026, has not cleared the RFC stage despite three separate submitter groups.

The RISC-V libmvec RFC has no assigned delegate in the glibc patchwork system. No Reviewed-by or Acked-by tags have been recorded for any patch in the series. The February 2026 cover letter explicitly asked whether the community wanted a different integration model, indicating uncertainty about acceptance criteria on the submitter side.

The effective corporate maintainers of libmvec are Linaro (Adhemerval Zanella Netto, highest recent commit volume), Red Hat (Carlos O'Donell, Florian Weimer, Joseph Myers), and ARM (Szabolcs Nagy, Joe Ramsay). None of the RISC-V patch submitters (ISCAS/PLCT, SpacemiT, ZTE) has an existing named glibc committer. This is a structural gap: the RISC-V effort has no insider advocate with merge authority.

**Assessment:** RISC-V libmvec is pre-tier. It does not exist in upstream glibc and has no committed maintainer. The comparison point is aarch64 before the 2023 ARM effort, not aarch64 today.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

**libmvec build gate:** The `mathvec/Makefile` compiles the library only when `build-mathvec=yes`. This is set per-arch in `sysdeps/<arch>/configure.ac`. For riscv64, `sysdeps/riscv/configure.ac` handles only R_RISCV_ALIGN and static-PIE; no `build_mathvec` line exists. The glibc top-level configure defaults to `no` when the variable is not set. Enabling the flag requires a matching `libmvec-support` variable listing actual source files -- without real vectorized implementations, the flag alone produces an empty library.

**RVV gating in glibc:** `sysdeps/riscv/preconfigure.ac` enforces hard requirements for any code using the V extension:
- GCC >= 15 (checked via `__GNUC__` macro)
- RVV spec >= 1.0 (checked via `__riscv_v >= 1000000`)

Violation of either constraint causes a hard configure error. This means any riscv64 libmvec build using RVV intrinsics requires GCC 15 minimum.

**Current upstream riscv64 content with vector relevance:**
- `sysdeps/riscv/rvv/memset.S` -- RVV memset (single routine, landed December 2025)
- `sysdeps/riscv/rvd/` -- scalar double-precision FP helpers only (fpclassify, lrint, lround, etc.)
- `sysdeps/riscv/rv64/rvv/Implies` -- wires `riscv/rv64/rvd` and `riscv/rvv`
- No `sysdeps/riscv/fpu/` directory exists

**What the RFC patches proposed (February 2026 series, 5 patches, 1,765 lines):**

The February 2026 RFC used a multi-LMUL instantiation pattern: a single `v_d_log_skeleton.c` implementation is included four times with different LMUL macros defined, generating one exported symbol per (LMUL, SIMDLEN) pair. Example for log (double):

Symbol set for log (11 symbols):
`_ZGVr1N2v_log`, `_ZGVr1N4v_log`, `_ZGVr2N2v_log`, `_ZGVr2N4v_log`, `_ZGVr2N8v_log`, `_ZGVr4N4v_log`, `_ZGVr4N8v_log`, `_ZGVr4N16v_log`, `_ZGVr8N8v_log`, `_ZGVr8N16v_log`, `_ZGVr8N32v_log`

The log algorithm uses: 7-bit table lookup into 128-entry table, biased-exponent extraction, `vfrec7` approximation, degree-6 polynomial, compensated summation with `T_hi`/`T_lo` split, FRM CSR save/restore via inline assembly. The FRM management uses `frrm`/`fsrm` RISC-V CSR instructions.

The importer pattern:
```c
#define LIBMVEC_TYPE double
#define LIBMVEC_FUNC log
#define LIBMVEC_IMPL "v_d_log_skeleton.c"
#include "v_math_importer.h"
```

**Performance data (SpacemiT X60, from February 2026 RFC cover letter):**
- logf (single-precision): up to 4x speedup at LMUL=4/SIMDLEN=32 vs. scalar libm; degrades to 3x at LMUL=8/SIMDLEN=64 due to register spilling (GCC 15.2 and Clang 21, `-O3`)
- log (double-precision): up to 2x speedup at LMUL=2/SIMDLEN=8 vs. scalar libm; similar spilling at LMUL=8
- Accuracy: within <= 1 ULP vs. libm (both GCC and Clang)

**Performance data (SpacemiT K1, VLEN=256, from May 2026 RFC exp patch):**

| Implementation | Time (N=1M, REPEAT=1000) | Relative |
|---|---|---|
| ARM Optimized Routines exp (proposed) | 9.92 s | 1x (fastest) |
| Rivos veclibm v4 | 16.14 s | 1.63x slower |
| Rivos veclibm v1 | 17.79 s | 1.79x slower |
| Rivos veclibm v2 | 23.47 s | 2.37x slower |
| Rivos veclibm v3 | 23.05 s | 2.32x slower |

**VLA vs. VLS performance (SpacemiT K1, VLEN=256, exp):**
- `-march=rv64gcv` (assumes VLEN=128): 39.84 s
- `-march=rv64gcv_zvl256b` (VLEN=256): 17.79 s
- Ratio: 2.24x penalty from underutilizing hardware VLEN

**GCC middle-end constraint:** The `omp-simd-clone` infrastructure in GCC uses a single-character `vecsize_mangle` field in `struct cgraph_simd_clone`. RISC-V requires a multi-character field (`r1`, `r2`, `r4`, `r8`) because the architecture identifier consumes one character and the LMUL token consumes another. The GCC RFC patch (April 2026, Zhijin Zeng) addresses this by adding `unsigned char extend_isa_mangle[4]` to `cgraph_simd_clone` and a sentinel value `'W'` in `vecsize_mangle` to select the extended field.

---

## 5. Build System, Cross-Compilation, and Toolchain

**glibc configure for riscv64 (standard cross-build):**
```
../glibc/configure \
  --host=riscv64-linux-gnu \
  --with-headers=<SYSROOT>/usr/include \
  --prefix=/usr \
  --enable-kernel=5.15 \
  --disable-werror \
  CC=riscv64-linux-gnu-gcc
```

To enable mathvec (only with RFC patch applied, not in upstream master): `--enable-mathvec`.

**Minimum toolchain requirements for RVV-enabled glibc:**

| Tool | Minimum | Source |
|---|---|---|
| GCC (general glibc) | 12.1 | glibc `INSTALL` file |
| GCC (V extension) | 15 | `sysdeps/riscv/preconfigure.ac` hard check |
| GNU binutils | 2.39 | linker relaxation (R_RISCV_ALIGN) |
| GNU Make | 4.0 | glibc `INSTALL` file |
| Python | 3.4 | glibc `INSTALL` file |

**Official riscv64 CI build configurations (`scripts/build-many-glibcs.py`):**
```
arch='riscv64', os_name='linux-gnu', variant='rv64imac-lp64'
arch='riscv64', os_name='linux-gnu', variant='rv64imafdc-lp64'
arch='riscv64', os_name='linux-gnu', variant='rv64imafdc-lp64d'
```
No `rv64gcv` or V-extension variant exists in `build-many-glibcs.py`. These three configurations cover baseline ISA only.

**veclibm reference build (MIT-licensed, archived March 2026):**

CMake-based. Toolchain file uses Clang 18, target triple `riscv64-linux-gnu`, `-march=rv64gcv_zba_zbb_zbs`. CI uses QEMU with `vlen=128`, `vlen=256`, and `vlen=512` variants. Testing via `ctest -j$(nproc)`.

No Dockerfile exists in either the glibc tree or the veclibm repository for RISC-V libmvec development.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Present in amd64 glibc, absent in riscv64:**

| Component | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| libmvec source files (vector math) | Yes, since glibc 2.22 | Yes, since glibc 2.38 | No |
| `libmvec.abilist` | Yes, `sysdeps/unix/sysv/linux/x86_64/` | Yes, `sysdeps/unix/sysv/linux/aarch64/` | No |
| `sysdeps/*/fpu/Versions` | Yes | Yes | No (no fpu/ dir) |
| `bench-libmvec-arch.h` | Yes | Yes | No |
| `build_mathvec=yes` in configure.ac | Yes (unconditional) | Yes (default fallback) | No |
| GCC SIMD clone support | Yes | Yes | No (RFC only) |
| VLA variant symbols (`_ZGV*Nxv_*`) | No (fixed-width only) | No (fixed-width only) | Proposed in RFC only |

**Functions present in aarch64 libmvec (glibc 2.38+):** cos, cosf, exp, expf, exp2, exp2f, exp10, exp10f, log, logf, log2, log2f, pow, powf, sin, sinf (minimum set; SVE variants add more). [NEEDS VERIFICATION on exact function count]

**Functions proposed in RISC-V RFC (November 2024 series, not merged):** exp, asin, atan, acos, atanh, exp10, exp2, tan, tanh, pow, sin, log, cos, acosh, asinh, atan2, expm1, tgamma, lgamma, log2, log10, cbrt, erfc, erf, cosh, sinh (double-precision only; single-precision variants absent and explicitly noted as "pending future work" in the RFC).

**Gap summary:** riscv64 has zero libmvec coverage. aarch64 reached initial coverage in glibc 2.38 (2023). The riscv64 effort is at least one full glibc release cycle behind where aarch64 was in early 2023, with additional structural blockers (GCC, ABI, licensing) that were not present for aarch64.

---

## 7. CI/CD Infrastructure

**Upstream glibc CI for riscv64:** None in any automated system.

The glibc repository contains no `.gitlab-ci.yml` and no `.github/` directory. The `scripts/build-many-glibcs.py` file defines three riscv64 build configurations but this is a standalone developer script, not a wired CI pipeline.

The official Testing/Results wiki page at `sourceware.org/glibc/wiki/Testing/Results` lists the following architectures with active CI/test tracking: aarch64-unknown-linux-gnu, hppa2.0-unknown-linux-gnu, ia64-unknown-linux-gnu, loongarch64-unknown-linux-gnu, mips-unknown-linux-gnu, x86_64-pc-linux-gnu. riscv64 is absent. The subpage `Testing/Results/riscv64-unknown-linux-gnu` returns HTTP 404.

The Sourceware Buildbot has active glibc builders for Debian arm64/armhf/i386/ppc64 and Fedora ppc64le/s390x/x86_64, but no riscv64 builder.

**RISE pre-commit CI:** The RISE December 2024 webinar listed "glibc pre-commit CI" as an active initiative. The scope, configuration, and architecture coverage of this CI are not publicly documented and could not be independently verified. Whether it covers riscv64 glibc builds and whether it has any libmvec-related tests is unknown. Data not available: RISE internal CI configuration details.

**libmvec-specific CI for riscv64:** Does not exist. libmvec does not exist in upstream glibc for riscv64, so there is no libmvec code to test and no CI for it.

---

## 8. Distribution and Release Status

libmvec is not available for riscv64 in any distribution channel.

| Distribution | riscv64 libmvec available | Evidence |
|---|---|---|
| Debian (all suites, including sid/unstable) | No | packages.debian.org name and contents search returns zero results for libmvec on riscv64 |
| Ubuntu 24.04 LTS (Noble) | No | riscv64 libc6-dev filelist does not include `libmvec.a` or `libmvec.so`; amd64 filelist explicitly includes them |
| Ubuntu (Plucky) | No | packages.ubuntu.com contents search returns zero results for libmvec on riscv64 |
| Arch Linux RISC-V (archriscv.felixc.at) | No | No package results returned |
| Fedora Koji | No | Koji package search for `libmvec*` returns zero results |
| PyPI | N/A | libmvec has no PyPI presence (not a Python package); API returns 404 |

For comparison, on amd64, `libc6-dev` in Ubuntu Noble explicitly ships `/usr/lib/x86_64-linux-gnu/libmvec.a` and `/usr/lib/x86_64-linux-gnu/libmvec.so`.

The root cause is upstream: glibc's build system does not build libmvec for riscv64 because no sysdeps configure fragment sets `build_mathvec=yes` for RISC-V. No distro packaging workaround is possible without an upstream glibc patch.

---

## 9. Dependencies

The following table covers all dependencies relevant to a future riscv64 libmvec implementation and their current riscv64 status.

| Dependency | Role | riscv64 Status | Blocking Issues |
|---|---|---|---|
| glibc / libm | Runtime dep (`mathvec/Depend` contains only `math`); libmvec links against libm at build time | Ships on riscv64 (glibc 2.42 in Debian sid, 2.39 in Ubuntu 24.04) | No libm-specific blocker |
| `build_mathvec=yes` configure flag | Must be set in `sysdeps/riscv/configure.ac` to compile mathvec/ | Not set; defaults to `no` | Primary structural blocker; requires real vectorized implementations to be useful |
| GCC >= 15 (RVV paths) | Hard-gated by `sysdeps/riscv/preconfigure.ac` | GCC 15.1+ released; available in toolchains | No blocker if correct toolchain is used |
| GCC SIMD clone hooks (`TARGET_SIMD_CLONE_COMPUTE_VECSIZE_AND_SIMDLEN`, `_ADJUST`, `_USABLE`) | Compiler-side for auto-generating `_ZGV*` symbols from `__attribute__((simd))` | RFC only (Zhijin Zeng, April 2026, [gcc-patches/714883](https://gcc.gnu.org/pipermail/gcc-patches/2026-April/714883.html)); not merged | Unmerged; requires `cgraph_simd_clone` struct extension (`extend_isa_mangle[4]`) |
| GNU binutils | Assembler/linker; RVV instruction support in 2.38+ | Ships in all riscv64 distros | No blocker |
| RVV hardware/kernel support | `RISCV_HWPROBE_IMA_V` probe, Linux 6.4+; hardware: SiFive P670/P870, SG2042, SpacemiT K1/X60 | Linux 6.5+ in distros; hardware available | Existing RVV IFUNC resolver bug in glibc (see Section 11) affects all future RVV routines |
| psABI vector function name mangling | `_ZGVr<lmul><mask><len><params>_<func>` scheme; ABI prerequisite for libmvec symbol names | **Resolved**: [riscv-elf-psabi-doc PR #455](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/pull/455) merged June 18, 2026 | No longer blocking |
| veclibm (Rivos, MIT license) | Reference implementation for RISC-V vectorized math; source for RFC patches | Relicensed to MIT, archived March 30, 2026 | Licensing blocker removed by MIT relicense; repo now read-only |
| LLVM vector library mapping | Clang-side: tells the auto-vectorizer to call `_ZGV*` symbols | RFC only ([llvm-project PR #193721](https://github.com/llvm/llvm-project/pull/193721), WIP/Draft, 3 failing tests) | Not merged; 3 test failures in CI |

---

## 10. Ecosystem Status

**Contributing institutions (all RISC-V libmvec patch work):**

| Institution | RISE Membership | Contributors | Patches Submitted |
|---|---|---|---|
| ISCAS/PLCT Lab | General Member | Yulong Shi, Zihong Yao | RFC V1-V4 (Apr 2024), RFC 0/5 (Feb 2026) |
| SpacemiT | General Member | Zhijin Zeng | RFC V4 new (Nov 2024), RFC 1-2/2 (May 2026, GCC patch), LLVM PR |
| ZTE | General Member | zhou.yanan | RFC 1-2/2 (May 2026, glibc patch) |
| Rivos (archived) | (departed) | Palmer Dabbelt (reviewer), Ping Tak Peter Tang (veclibm) | veclibm upstream source only |

None of the three active contributing institutions has an established glibc committer. The RISE General Member organizations are doing the submission work but lack the commit authority to land it.

**RISE project roadmap relevance:** The RISE December 2024 Compilers and Toolchains WG roadmap explicitly listed "Vector mem* and str* in glibc" as the next priority. RVV memset landed in glibc (December 2025). libmvec is a further step and is not listed as a RISE roadmap item in any publicly accessible document. No RISE blog post (0 of 27 surveyed, May 2024 through June 2026) mentions libmvec.

**Nearest published RISC-V vectorized math performance data:** The RISE blog post "OpenJDK: Supercharging Vectorized Math with SLEEF" (September 24, 2025, Hamlin Li, Rivos) reports a 2.38x average speedup for Vector API math operations (sin, cos, log) on RISC-V after integrating SLEEF into OpenJDK. This is Java JIT context, not glibc libmvec, and no hardware platform is specified. [NEEDS VERIFICATION on hardware platform]

**psABI resolution:** [riscv-elf-psabi-doc PR #455](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/pull/455) merged June 18, 2026 (kito-cheng), specifying `_ZGVr<lmul><mask><len><parameters>_<func>` naming. This was the foundational ABI prerequisite referenced in every patch thread since April 2024. Its resolution enables the GCC and glibc patch series to move forward, but no new glibc submission has appeared since this merge.

**End-to-end validation:** The only confirmed end-to-end validation of RISC-V libmvec-style symbols is the PoC at [ZhouYan-an/riscv-simdclone-libmvec-vla-test-z1](https://github.com/ZhouYan-an/riscv-simdclone-libmvec-vla-test-z1) (April 2026) on Sophgo SG2044 hardware, which confirmed `_ZGVr2Nxv_exp` and `_ZGVr2Nxv_log` are called at runtime during SPEC CPU 2017 benchmark 527.cam4_r. No quantitative speedup figure was published from this PoC.

---

## 11. Known Bugs and Active Issues

| ID | Tracker | Description | Status |
|---|---|---|---|
| (no upstream ID) | glibc libc-alpha | RFC PATCH 0/5 (Feb 2026): blocked on Apache 2.0 veclibm vs. LGPL-2.1 incompatibility; Carlos O'Donell: "unacceptable for inclusion"; Florian Weimer: asked for copyright assignment | Open; licensing blocker partially resolved (veclibm relicensed to MIT March 2026) but no new patch series submitted |
| (no upstream ID) | glibc libc-alpha | RFC PATCH 0/5 (Feb 2026): GLIBC version symbol error -- used `GLIBC_2.43` after it was already released; must use `GLIBC_2.44` | Open; flagged by Joseph Myers, not fixed in any subsequent patch |
| (no upstream ID) | glibc libc-alpha | RFC PATCH 1/2 (May 2026): symbol rename from `_ZGV<lmul>N...` to `_ZGVr<lmul>N...` introduces ABI backward incompatibility for any consumers of prior RFC builds; Florian Weimer: "Ugh, we can't do that" | Open; Weimer proposed retaining old symbols as compat or bumping soname |
| (no upstream ID) | glibc libc-alpha | RFC PATCH 1/2 (May 2026): submitted against out-of-tree branch, not upstream glibc master; Adhemerval Zanella Netto: "not clear to me why you sent a RFC patch against an out-of-tree branch" | Open; procedurally problematic |
| (no upstream ID) | gcc-patches | RFC v2: RISC-V SIMD clone target hooks (April 2026); blocked on psABI naming (now resolved); `cgraph_simd_clone` struct change required | RFC; psABI blocker removed June 18, 2026; no updated patch posted |
| PR #193721 | llvm/llvm-project | [WIP] RISC-V libmvec support -- 3 test failures: `libm-vector-calls.ll` (FileCheck `captures(none)` vs `nocapture` mismatch), `fveclib.c` (LTO plugin option not emitted for RISC-V), `fveclib.f90` (no error diagnostic for `riscv64-none-none`) | Draft/WIP; failing CI |
| PR #119844 | llvm/llvm-project | Prior LLVM RISC-V libmvec support PR; closed by author April 23, 2026 pending psABI finalization and missing `r` in mangled names | Closed/superseded by PR #193721 |
| Issue #34 | rivosinc/veclibm | "Unused variable might be an error" | Open; repo archived March 30, 2026 -- no further activity possible |
| (design, no bug filed) | gcc/cgraph.h | `struct cgraph_simd_clone` has no LMUL field; requires either new field or `TARGET_SIMD_CLONE_MANGLE` hook; current workaround in PoC uses `riscv_simd_clone_adjust` to rewrite assembler names post-generation | No upstream bug; identified as long-term GCC middle-end change required |
| (no upstream ID) | glibc | RVV IFUNC resolver for `__memset_vector` does not re-check `prctl(PR_RISCV_V_VSTATE_CTRL)` after startup; any process disabling RVV post-init gets SIGILL on memset; same pattern would affect future RVV libmvec routines | Open; will affect libmvec IFUNC dispatch design |

---

## 12. Objections and Upstream Blockers

**Blocking objections from glibc maintainers, in order of severity:**

**1. Licensing (February 2026, Carlos O'Donell and Florian Weimer)**
The source code in all RISC-V libmvec RFC patches derives from Rivos's `veclibm` library, which was originally licensed Apache 2.0. The FSF considers Apache 2.0 incompatible with LGPL 2 (which glibc uses). Carlos O'Donell stated directly: "The current license of the code makes [it] unacceptable for inclusion in glibc." Florian Weimer asked whether the submitters could assign copyright to the FSF.

**Resolution status:** veclibm was relicensed to MIT and archived on March 30, 2026. The MIT license is FSF-compatible with LGPL. However, no glibc patch series has been resubmitted since this relicensing, and it is unclear whether the MIT-licensed code requires FSF copyright assignment paperwork in addition to the license change.

**2. ABI symbol naming backward incompatibility (May 2026, Florian Weimer)**
The May 2026 RFC proposed renaming symbols from `_ZGV<lmul>N...` (used in prior RFC builds) to `_ZGVr<lmul>N...` (per psABI PR #455). Weimer objected to treating this as a clean break, noting that the old symbols had already been published in an earlier RFC version of the ABI. He proposed retaining the old symbols as compatibility symbols or bumping the libmvec soname.

**Resolution status:** Unresolved. No updated patch exists.

**3. Procedural: patch submitted against out-of-tree branch (May 2026, Adhemerval Zanella Netto)**
The May 2026 RFC was submitted against Zhijin Zeng's November 2024 branch rather than upstream glibc master, making review difficult and the series non-applicable to mainline.

**Resolution status:** Unresolved. Would require rebase onto glibc master.

**4. GLIBC version symbol error (February 2026, Joseph Myers)**
The February 2026 RFC used `GLIBC_2.43` in Versions and `.map` files, but glibc 2.43 had already been released at submission time. New ABI symbols must use the next unreleased version. At submission time in February 2026, that was `GLIBC_2.44`.

**Resolution status:** Unresolved. Mechanical fix but blocks acceptance.

**5. GCC SIMD clone support missing (noted April 2024, Palmer Dabbelt)**
No GCC patches existed at the time of the first RFC to validate the full codegen stack end-to-end. This was flagged as a prerequisite before glibc acceptance makes practical sense.

**Resolution status:** GCC RFC patches exist (April 2026, Zhijin Zeng). Not merged. The psABI blocker for these GCC patches resolved June 18, 2026; an updated GCC patch series is still needed.

**6. Float (single-precision) variants missing**
The November 2024 RFC explicitly omitted single-precision variants ("pending future work"). The February 2026 RFC covers log and logf but not the full function set. A production libmvec port requires both double and single precision for all major transcendentals.

**Resolution status:** Partially addressed (logf added in February 2026 RFC). Full single-precision coverage not yet submitted.

**7. `veclibm` VLENB <= 256 limitation**
The November 2024 RFC implementation limits support to `VLENB <= 256`. Hardware with wider VLEN (e.g., VLEN=512) would not use the vectorized paths.

**Resolution status:** Partially addressed in May 2026 RFC via VLA (`_ZGVr<lmul>Nxv_*`) symbols. VLA has its own performance issue: compiler auto-vectorizer assumes VLEN=128 when compiling with `-march=rv64gcv`, resulting in 2.24x performance loss on VLEN=256 hardware vs. `-march=rv64gcv_zvl256b`.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

Achieving a minimal functional riscv64 libmvec in upstream glibc requires completing the following work items:

**GCC SIMD clone hooks:** The April 2026 RFC (Zhijin Zeng) provides a starting point. The patch requires updating `cgraph_simd_clone` in `cgraph.h` and modifying `omp-simd-clone.cc` to emit multi-character ISA mangle strings. The psABI blocker resolved June 18, 2026. An updated patch series rebased against current GCC master, with the psABI-final naming, is needed. Estimate: 3-5 person-weeks for a GCC-experienced engineer to revise, test, and iterate through review.

**glibc libmvec RISC-V implementation:** The February 2026 RFC covers log and logf. A minimal upstream-acceptable submission requires: (a) rebase onto glibc master, (b) correct GLIBC version symbol (`GLIBC_2.44` or later depending on release timing), (c) MIT-licensed or originally-written source code (veclibm MIT relicense resolves the origin; FSF copyright assignment paperwork may still be required -- this is unclear), (d) at minimum exp/expf, sin/sinf, cos/cosf, log/logf as a first set. Estimate: 4-6 person-weeks for glibc-experienced engineer; longer if copyright assignment process is required.

**LLVM vector library mapping:** [llvm-project PR #193721](https://github.com/llvm/llvm-project/pull/193721) is a WIP Draft with 3 failing tests. The 3 failures are mechanical (FileCheck string mismatch, missing LTO plugin flag emission, wrong error diagnostic). Estimate: 1-2 person-weeks to fix the 3 failures and move from Draft to ready-for-review.

**Total for minimal functional enablement:** 8-13 person-weeks of engineering, distributed across GCC, glibc, and LLVM upstreams. This estimate does not include time for FSF copyright assignment (potentially 4-12 weeks of elapsed calendar time for paperwork, not engineering time). The work is not bottlenecked on implementation complexity; it is bottlenecked on upstream process navigation and review cycles.

### 13.2 Performance Optimization

Performance data is sparse and comes entirely from SpacemiT hardware (X60 and K1). No published riscv64 vs. amd64 or riscv64 vs. arm64 libmvec comparison exists.

Available riscv64 vectorized math speedup data:
- logf: up to 4x vs. scalar on SpacemiT X60 (RFC claim, LMUL=4/SIMDLEN=32, GCC 15.2 or Clang 21, `-O3`)
- log: up to 2x vs. scalar on SpacemiT X60 (RFC claim, LMUL=2/SIMDLEN=8)
- exp: 1.79x (ARM Optimized Routines) over best prior veclibm implementation on SpacemiT K1 VLEN=256

The 2x-4x range for riscv64 matches published aarch64 SVE libmvec speedups at similar vector widths. [NEEDS VERIFICATION: direct aarch64 libmvec benchmark comparison]

**Key performance issue:** The VLA auto-vectorizer penalty (2.24x loss at VLEN=256 due to compiler assuming VLEN=128) means that portable builds targeting the widest hardware require hardware-specific march flags or VLS symbols. This is the same trade-off as aarch64 SVE vs. fixed-width NEON but more pronounced because VLEN variance in RISC-V hardware (128 to 512+ bits) is wider.

Optimization work beyond the initial port (algorithm selection, LMUL tuning, VLA vs. VLS dispatch) is a secondary investment. The primary bottleneck is getting any implementation into glibc.

### 13.3 CI/CD Infrastructure

No automated CI exists for riscv64 glibc of any kind in the upstream project. The three riscv64 configurations in `build-many-glibcs.py` are developer script definitions, not running CI. No riscv64 builder exists on the Sourceware Buildbot. riscv64 does not appear in the glibc Testing/Results wiki.

A minimal riscv64 libmvec CI would require:
- QEMU-based build and test (VLEN=128 and VLEN=256 at minimum) -- feasible with QEMU 8+
- GCC 15 cross-compiler in CI environment
- A running hardware-in-the-loop runner for performance regression testing (not strictly required for correctness CI)

The RISE RP012 program (Collabora, LAVA lab, BPI-F3 + SiFive P550) provides hardware-in-the-loop CI infrastructure for RISC-V, but its glibc libmvec coverage is not documented.

### 13.4 Ecosystem Enablement

libmvec on riscv64 would unblock:
- Auto-vectorization of math-heavy code via `__attribute__((simd))` and OpenMP SIMD pragmas when compiled with GCC or Clang targeting riscv64
- HPC and numerical computing workloads (SPEC CPU 2017 cam4_r is an example; the PoC validates this use case end-to-end)
- Any libmvec-dependent library or application currently working on amd64 or arm64 that would otherwise need riscv64-specific workarounds

The dependency chain is: psABI (done) -> GCC SIMD clone hooks (RFC, ~3-5 weeks) -> glibc libmvec RISC-V (RFC, ~4-6 weeks) -> LLVM (WIP, ~1-2 weeks). These can be parallelized across teams but the glibc portion depends on a usable GCC.

The RISE ecosystem dependency: SpacemiT and ISCAS/PLCT have done the primary technical work. Neither has glibc commit access. A company with existing glibc maintainer relationships (Red Hat, Linaro, ARM) would significantly accelerate upstream acceptance. Without such a sponsor, review cycles may extend substantially -- the aarch64 libmvec effort succeeded in part because ARM engineers (Szabolcs Nagy, Joe Ramsay) already had committer relationships.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | GCC SIMD clone hooks (rebase RFC onto master, psABI-final naming, iterate review) | 3-5 | GCC RISC-V contributor with upstream access | Critical |
| Functional | glibc libmvec RISC-V initial port (log, logf, exp, expf, sin, sinf, cos, cosf; correct version symbols; MIT-licensed source; upstream process) | 4-6 + copyright paperwork (elapsed) | glibc contributor with upstream access | Critical |
| Functional | LLVM vector library mapping (fix 3 failing tests, move WIP to ready-for-review) | 1-2 | Clang/LLVM RISC-V contributor | High |
| Performance | Algorithm selection and LMUL tuning for full function set (exp, pow, trig, hyperbolic, log variants) | 8-16 | Math library specialist | Medium |
| Performance | VLA/VLS dispatch strategy for variable-VLEN hardware | 2-4 | Math library specialist with RISC-V hardware access | Medium |
| CI/CD | QEMU-based riscv64 libmvec build and test in glibc CI | 2-3 | glibc CI contributor | High |
| CI/CD | Hardware-in-the-loop performance regression CI | 3-5 | Infrastructure engineer with RISE hardware access | Low |
| Ecosystem | Upstream sponsor engagement (Red Hat, Linaro, or ARM glibc committer to co-review and commit) | 1-2 (coordination) | Leadership / partner relationship | Critical |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [glibc source repository](https://sourceware.org/git/glibc.git)
- [RFC V1: Enable libmvec support for RISC-V (Yulong Shi, April 8, 2024)](https://sourceware.org/pipermail/libc-alpha/2024-April/155917.html)
- [RFC V2: Enable libmvec support for RISC-V (Yulong Shi, April 2024)](https://sourceware.org/pipermail/libc-alpha/2024-April/155963.html)
- [RFC V4: Enable libmvec support for RISC-V (Yulong Shi, April 15, 2024)](https://sourceware.org/pipermail/libc-alpha/2024-April/156072.html)
- [Jeff Law reply on veclibm (April 25, 2024)](https://sourceware.org/pipermail/libc-alpha/2024-April/156299.html)
- [Palmer Dabbelt reply on ABI (April 30, 2024)](https://sourceware.org/pipermail/libc-alpha/2024-April/156414.html)
- [RFC V4 new: RISC-V libmvec (Zhijin Zeng / SpacemiT, November 4, 2024)](https://sourceware.org/pipermail/libc-alpha/2024-November/161214.html)
- [RFC PATCH 0/5: riscv: Add libmvec routines -- cover letter (Zihong Yao / PLCT, February 8, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174950.html)
- [RFC PATCH 1/5: riscv: libmvec: add RVV log and infrastructure (February 8, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174954.html)
- [RFC PATCH 2/5: riscv: libmvec: add ABI tests (February 8, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174951.html)
- [Florian Weimer reply: licensing block (February 9, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174959.html)
- [Carlos O'Donell reply: licensing block (February 9, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174969.html)
- [Joseph Myers reply: GLIBC version symbol error (February 9, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174982.html)
- [RFC PATCH 1/2: RISC-V VLA support and Fortran declarations (ZTE, May 14, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-May/177378.html)
- [RFC PATCH 2/2: Improved double-precision exp (ZTE, May 14, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-May/177377.html)
- [Florian Weimer reply: ABI backward-compatibility concern (May 14, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-May/177379.html)
- [Adhemerval Zanella Netto reply: out-of-tree branch concern (May 14, 2026)](https://sourceware.org/pipermail/libc-alpha/2026-May/177385.html)
- [riscv-elf-psabi-doc PR #455: Name mangling for vector functions (merged June 18, 2026)](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/pull/455)
- [GCC RFC patch v1: RISC-V SIMD clone hooks (April 2026)](https://gcc.gnu.org/pipermail/gcc-patches/2026-April/714646.html)
- [GCC RFC patch v2: RISC-V SIMD clone hooks (April 27, 2026)](https://gcc.gnu.org/pipermail/gcc-patches/2026-April/714883.html)
- [LLVM PR #193721: RISC-V libmvec support (WIP/Draft)](https://github.com/llvm/llvm-project/pull/193721)
- [LLVM PR #119844: RISC-V libmvec support (closed April 2026)](https://github.com/llvm/llvm-project/pull/119844)
- [rivosinc/veclibm: RISC-V vector math library (archived, MIT license)](https://github.com/rivosinc/veclibm)
- [ZhouYan-an/riscv-simdclone-libmvec-vla-test-z1: end-to-end PoC on SG2044](https://github.com/ZhouYan-an/riscv-simdclone-libmvec-vla-test-z1)
- [RISE blog: OpenJDK vectorized math with SLEEF (September 24, 2025)](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/)
- [glibc Testing/Results wiki](https://www.sourceware.org/glibc/wiki/Testing/Results)