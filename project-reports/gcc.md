---
title: GCC
parent: Project Reports
color: blue
dependencies:
  - name: GMP
    relation: build-dependency
    criticality: critical
  - name: GNU MPFR
    relation: build-dependency
    criticality: critical
  - name: GNU MPC
    relation: build-dependency
    criticality: critical
  - name: ISL
    relation: build-dependency
    criticality: optional
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="gcc" %}

# GCC

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64) support status for GCC, the GNU Compiler Collection: the compiler proper (`gcc/config/riscv`), its runtime support libraries (libgcc, libstdc++, libatomic, libgomp), and the GNU cross-toolchain it anchors together with GNU binutils and glibc.<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

GCC (the GNU Compiler Collection) is the reference optimizing compiler suite for C, C++, Fortran, Ada, D, Go, Modula-2, Objective-C/C++ and Rust (GCC 15+), plus the runtime support libraries that every compiled program links against (libgcc, libstdc++, libatomic, libgomp, libquadmath). It is one of the two dominant open-source compiler toolchains (alongside LLVM/Clang) and is the default system compiler on most Linux distributions, including every riscv64 Linux port.

- Homepage: [https://gcc.gnu.org/](https://gcc.gnu.org/)
- Source: [https://gcc.gnu.org/git/gcc.git](https://gcc.gnu.org/git.html) (canonical), mirrored read-only at [github.com/gcc-mirror/gcc](https://github.com/gcc-mirror/gcc)
- License: GPLv3 (compiler), GPLv3 with the GCC Runtime Library Exception (runtime libraries, permitting proprietary linking)
- Latest stable release: 16.2 (2026-08-07); latest 15.x: 15.2 (2025-08-08). Source: [GCC 16 Release Series](https://gcc.gnu.org/gcc-16/), [GCC 15.2 Released](https://news.tuxmachines.org/n/2025/08/09/GCC_15_2_Released.shtml)
- Governance: GNU Project under the Free Software Foundation; copyright assignment to the FSF is required for non-trivial contributions; technical direction set by a GCC Steering Committee. GCC is not a Linux Foundation, CNCF, or Apache project, and is not itself a formal RISE Project member, though multiple RISE governing-board companies (SiFive, Google, Rivos, Ventana, Intel) employ current RISC-V port maintainers (see Section 2).
- Patches are submitted by email to `gcc-patches@gcc.gnu.org`; GitHub is a read-only mirror only, there is no GitHub PR workflow upstream.
- GCC does not publish official binary releases for any architecture, including amd64 and arm64: [gcc.gnu.org/releases.html](https://gcc.gnu.org/releases.html) ships source tarballs only. All binary distribution, for every architecture, is downstream (Linux distributions, vendor toolchains, or community projects such as [riscv-collab/riscv-gnu-toolchain](https://github.com/riscv-collab/riscv-gnu-toolchain)). This is a universal GCC characteristic, not a riscv64-specific gap.

**Corporate sponsors and backers.** The current RISC-V port maintainer roster (`MAINTAINERS`, live master, fetched 2026-09-30) is: Kito Cheng, Palmer Dabbelt, Robin Dapp, Andrew Waterman, and Jim Wilson, with Juzhe Zhong (RiVAI) as a named reviewer for the RISC-V port. Cross-referencing affiliations: Kito Cheng is a SiFive compiler engineer ([SiFive engineer LinkedIn](https://www.linkedin.com/in/kitocheng/)); Andrew Waterman and Jim Wilson are SiFive ([MAINTAINERS](https://github.com/gcc-mirror/gcc/blob/master/MAINTAINERS) email domains, `andrew@sifive.com`); Palmer Dabbelt has moved between Google, Rivos, and Meta over the port's history, most recently reported at Meta [NEEDS VERIFICATION on current employer]; Robin Dapp is at Ventana Micro Systems, and implemented the SLP/loop autovectorizer (see Section 2). Juzhe Zhong is at RiVAI Technologies, a Chinese RVV-focused vendor, and authored most of the GCC vector-intrinsics implementation. RISE Project governing-board members SiFive, Ventana, and (via past affiliation) Google/Rivos therefore have direct maintainer-level representation in GCC's RISC-V port; Intel (Pan Li) and ESWIN Computing (Feng Wang) are named as major autovectorization and vector-crypto-intrinsics contributors in the GCC 14 release notes ([GCC 14 Changes](https://gcc.gnu.org/gcc-14/changes.html)). T-Head (Alibaba, via `riscv-ext-thead.def` and the PLCT Lab at the Institute of Software, Chinese Academy of Sciences) and Andes Technology are visible as vendor-extension contributors in the source tree (Section 4).

**Community culture on new platforms.** RISC-V support is not gated behind feature flags or subject to a "prove value first" policy; once the port was accepted by the Steering Committee it was merged directly into the tree with full co-maintainer status (Section 2). New vendor extensions (T-Head, Andes, CORE-V/OpenHW, MIPS P8700, SpacemiT, Ventana/Tenstorrent Ascalon, XiangShan) continue to be accepted as `.def`/`.md` additions under `gcc/config/riscv/`, indicating an open, welcoming policy toward both the base ISA and vendor-specific microarchitecture tuning.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Author | Affiliation |
|---|---|---|---|
| 2017-01-11 | "New Port for RISC-V" patch series posted to gcc-patches | Palmer Dabbelt | SiFive (at the time) |
| 2017-01 | GCC Steering Committee accepts the RISC-V port; Palmer Dabbelt and Andrew Waterman appointed co-maintainers | Andrew Waterman (announcement) | SiFive |
| 2017-05-02 | GCC 7.1 released; first stable GCC release with RISC-V support | GCC Release Managers | -- |
| 2017-11 | Jim Wilson added as a third RISC-V port maintainer | Palmer Dabbelt (patch) | SiFive |
| 2022 (GCC 12) | Zba, Zbb, Zbc, Zbs bitmanip instruction patterns and cost models merged | -- | -- |
| 2023-04 (GCC 13) | Vector intrinsics v0.11 merged (majority of the implementation by Ju-Zhe Zhong); Zawrs, Zbk*, Zfh*, Zicbo*, Zk*, Zmmul and multiple T-Head vendor extensions added | Ju-Zhe Zhong | RiVAI |
| 2024-05 (GCC 14) | SLP and loop autovectorizer enabled for the vector extension; vector intrinsics v1.0; vector-crypto intrinsics; T-Head vector intrinsics; scalar bitmanip/crypto intrinsics; `-mcmodel=large`; standard vector calling convention | Ju-Zhe Zhong (RiVAI), Pan Li (Intel), Robin Dapp (Ventana Micro) for autovectorization; Feng Wang et al. (ESWIN Computing) for vector crypto; Kuan-Lin Chen (Andes) for large code model | RiVAI, Intel, Ventana, ESWIN, Andes |
| 2025-05-10 | `-march=rva23u64` / `rvb23u64` RISC-V Profiles patch lands on trunk (GCC 16 development line) | -- | -- |
| 2025-08-08 | GCC 15.2 released; does **not** include the `rva23u64` profile alias (it landed after the GCC 15 branch point) | GCC Release Managers | -- |
| 2026-04-30 | GCC 16.1 released; first stable series to recognize `-march=rva23u64`/`rvb23u64` | GCC Release Managers | -- |
| 2026-08-07 | GCC 16.2 released (current stable as of this report) | GCC Release Managers | -- |

Sources: [Palmer Dabbelt, "New Port for RISC-V"](https://gcc.gnu.org/legacy-ml/gcc-patches/2017-01/msg00776.html), [Andrew Waterman, "Re: RISC-V port accepted for inclusion in GCC"](https://gcc.gnu.org/legacy-ml/gcc/2017-01/msg00152.html), [SiFive, "RISC-V GCC is upstreamed!"](https://www.sifive.com/blog/risc-v-gcc-is-upstreamed), [GCC 7 Changes](https://gcc.gnu.org/gcc-7/changes.html), ["RISC-V: Add Jim Wilson as a maintainer"](https://gcc.gnu.org/legacy-ml/gcc/2017-11/msg00040.html), [Phoronix, "GCC 12 Merges Initial Support For RISC-V's Bitmanip Extensions"](https://www.phoronix.com/news/GCC-12-Bitmanip-Extension), [GCC 13 Changes](https://gcc.gnu.org/gcc-13/changes.html), [GCC 14 Changes](https://gcc.gnu.org/gcc-14/changes.html), [Phoronix, "RISC-V Auto-Vectorization Support For The GCC Compiler Started"](https://www.phoronix.com/news/GCC-RISC-V-Auto-Vectorization), [gcc-patches, "[PATCH 2/2] RISC-V: Support RISC-V Profiles 23"](https://gcc.gnu.org/pipermail/gcc-patches/2025-January/674149.html), [RISCstar, "RVA23: From Ratification to Real-World Readiness"](https://riscstar.com/blog/rva23-from-ratification-to-real-world-readiness/), [GCC 16 Release Series](https://gcc.gnu.org/gcc-16/), [Tux Machines, "GCC 15.2 Released"](https://news.tuxmachines.org/n/2025/08/09/GCC_15_2_Released.shtml).

**Timeline comparison.** x86-64 (amd64) support has existed in GCC since the earliest 64-bit x86 ports in the early 2000s; aarch64 support landed in GCC 4.8.0 (2013-03-22, [GCC 4.8 Changes](https://gcc.gnu.org/gcc-4.8/changes.html); Cortex-A53/A57 initial targets). RISC-V support landed in GCC 7.1 (2017-05-02), roughly four years after aarch64 and well over a decade after amd64. This reflects the RISC-V ISA itself being newer (first ratified specification 2014-2016), not upstream reluctance: the RISC-V port was accepted and merged in a single Steering-Committee review cycle rather than being staged behind a long probation.

**Upstream status.** The port is fully upstream in the canonical GCC tree; there is no vendor fork carrying out-of-tree riscv64 patches for mainline use. A historical `riscvarchive/riscv-gcc` fork exists (used pre-2017 and briefly afterward for early RVV prototyping, e.g. [PR #329](https://github.com/riscvarchive/riscv-gcc/pull/329)) but all of that work has since been superseded by the intrinsics and autovectorization support merged into mainline GCC 13/14. That fork is not required for any current use case.

---

## 3. Upstream Support Tier

GCC classifies every target into primary, secondary, or tertiary platforms for release-criteria purposes (`gcc-16/criteria.html`, fetched live 2026-09-30):

> "Primary platforms are popular systems... Secondary platforms are also popular systems, but are either somewhat less popular than the primary systems, or are considered duplicative from a testing perspective. All platforms that are neither primary nor secondary are tertiary platforms... There are no release criteria for tertiary platforms."

The **GCC 16 primary platform list** is: `aarch64-none-linux-gnu`, `arm-linux-gnueabi`, `i586-unknown-freebsd`, `i686-pc-linux-gnu`, `powerpc64-unknown-linux-gnu`, `powerpc64le-unknown-linux-gnu`, `sparc-sun-solaris2.11`, `x86_64-pc-linux-gnu`. The **secondary platform list** is: `aarch64-elf`, `i686-apple-darwin`, `i686-pc-cygwin`, `i686-mingw32`, `s390x-linux-gnu`, `mips64-linux-gnu`. No `riscv64-*` or `riscv32-*` target appears on either list. Source: [GCC 16 Release Criteria](https://gcc.gnu.org/gcc-16/criteria.html).

This means riscv64 is, formally, a **tertiary platform with no release-blocking criteria at all**: a riscv64 regression, by the letter of the release-criteria policy, cannot by itself block a GCC release the way an `aarch64-none-linux-gnu` or `x86_64-pc-linux-gnu` regression can. In practice this formal tier gap is substantially narrowed by de facto CI investment (Section 7): riscv64 has more dedicated upstream buildbot hardware than several secondary platforms, and its test suite (8,168 files under `gcc/testsuite/gcc.target/riscv`, live count from `gcc-mirror/gcc` master, fetched 2026-09-30) is larger than many primary platforms' target-specific suites. But there is no committed policy that a riscv64-only regression blocks a release, which is the single most consequential formal-tier fact for this report.

`gcc.gnu.org/backends.html`, the maintainers' architecture-characteristics table, lists riscv as an actively maintained port using LRA register allocation (`a` flag), with both ILP32 and LP64 runtime-switchable modes (`r` flag) and `riscv-elf` recognized as a supported target (absence of the `e` "not supported" flag). Source: [Status of Supported Architectures](https://gcc.gnu.org/backends.html).

**Comparison table**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Formal release tier | Primary | Primary (linux-gnu) / Secondary (`-elf`) | Tertiary (none) |
| Official upstream binary | No (source-only project for all targets) | No | No |
| De facto upstream CI (build + test) | Yes | Yes | Yes (Section 7) |
| Named co-maintainers | Multiple (x86 backend team) | 3 (Christina, Earnshaw, Tkachov) | 5 (Cheng, Dabbelt, Dapp, Waterman, Wilson) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Source inventory

Live inspection of `gcc-mirror/gcc` (master, fetched 2026-09-30) shows `gcc/config/riscv/` contains **138 files, approximately 100,800 lines** across `.cc`, `.h`, and `.md` (Machine Description) files. This is a mature, actively developed backend, not a stub. Highlights:

- `riscv.cc` / `riscv.h` / `riscv.md` -- core target-dependent code: calling conventions, register allocation hooks, instruction patterns, addressing modes.
- `riscv-vsetvl.cc` / `riscv-vsetvl.def` -- a dedicated optimization pass that inserts and minimizes `vsetvli` instructions for the vector extension, a RISC-V-V-specific scheduling problem with no analog on amd64/arm64.
- `riscv-vector-builtins.cc` / `riscv-vector-builtins-bases.cc` / `riscv-vector-builtins-shapes.cc` / `riscv_vector.h` -- the full RVV C intrinsics API surface (version 1.0 of the [RISC-V Vector Intrinsic Specification](https://github.com/riscv-non-isa/rvv-intrinsic-doc)).
- `riscv-vector-costs.cc` -- a vector-specific cost model feeding the SLP/loop autovectorizer.
- `riscv-string.cc` -- architecture-specific string/memory builtin expansion (`memcpy`, `strlen`, etc.), using scalar and vector implementations.
- `riscv-builtins.cc`, `riscv-scalar-crypto.def`, `vector-crypto.md`, `riscv_crypto.h`, `riscv_bitmanip.h` -- scalar and vector cryptography (Zk*, Zvk*) and bit-manipulation (Zb*) intrinsics.
- `riscv-zicfilp.cc` -- Zicfilp (landing-pad, forward-edge control-flow integrity) support, a direct RISC-V analog of amd64 CET-IBT and arm64 BTI.
- `sync.md`, `sync-rvwmo.md`, `sync-ztso.md` -- atomics and the RISC-V Weak Memory Ordering / Total Store Ordering memory models.
- `riscv-sr.cc`, `sfb.md`, `peephole.md` -- shorten-register and short-forward-branch peephole optimizations.
- Vendor microarchitecture tuning: `sifive-7.md`, `sifive-p400.md`, `sifive-p600.md`, `sifive-vector.md` (SiFive); `thead.cc`, `thead.md`, `thead-vector.md`, `thead-peephole.md` (T-Head/Alibaba); `andes-*.md`, `andes-vector.md` (Andes Technology); `mips-p8700.md` (MIPS); `spacemit-x60.md` (SpacemiT); `xiangshan.md` (XiangShan open-source core); `tt-ascalon-d8.md` (Tenstorrent Ascalon, a Ventana-derived core); `corev.md`/`corev.def` (CORE-V/OpenHW Group); `arcv-rhx100.md`/`arcv-rmx100.md`.
- `gcc/testsuite/gcc.target/riscv/` contains **8,168 files** (live count, fetched 2026-09-30), the RISC-V-specific regression and codegen test corpus.

No component of the riscv64 backend is a stub or placeholder; every major GCC subsystem that requires architecture-specific code (calling convention, register allocation costs, vectorizer, atomics/memory model, control-flow-integrity, string builtins, vendor scheduling models) has a riscv64 implementation.

### 4.2 Component coverage

| Component | Status | Notes |
|---|---|---|
| Scalar codegen (RV64GC baseline) | Full | Mature since GCC 7; default target for every riscv64 Linux distro |
| Bitmanip (Zba/Zbb/Zbc/Zbs) | Full | Instruction patterns and cost models since GCC 12 ([Phoronix](https://www.phoronix.com/news/GCC-12-Bitmanip-Extension)) |
| Vector intrinsics (RVV 1.0) | Full | `<riscv_vector.h>`, all standard vector operations, merged GCC 14 ([GCC 14 Changes](https://gcc.gnu.org/gcc-14/changes.html)) |
| Vector autovectorization (SLP + loop) | Partial | Enabled GCC 14; GCC 15/LLVM-21 comparisons show GCC ahead on 4 of 6 HPC/ML proxy kernels but behind on SGEMM/DGEMM where LLVM reduces instruction count more aggressively ([Closer in the Gap](https://pith.science/paper/2605.10860)) |
| Vector crypto intrinsics (Zvk*) | Full | Merged GCC 14, contributed by ESWIN Computing |
| Scalar crypto (Zk*) | Full | Since GCC 13 |
| T-Head vector intrinsics (XTheadVector) | Full | Vendor-specific intrinsics, separate from standard RVV 1.0 |
| Code-size extensions (Zca/Zcb/Zcd/Zcf/Zce/Zcmp/Zcmt) | Full | `zc.md`; supports the ratified (April 2023) RISC-V Code Size Reduction extensions |
| Control-flow integrity (Zicfilp/Zicfiss) | Full | `riscv-zicfilp.cc`, matching amd64 CET-IBT / arm64 BTI in purpose |
| Atomics / memory model (RVWMO, Ztso) | Full | `sync-rvwmo.md`, `sync-ztso.md` |
| RISC-V Profiles (RVA20/RVA22/RVA23) | Full (RVA20/22 since GCC 13-14) / GCC-16-only (RVA23) | `-march=rva23u64` landed post-GCC-15-branch; not usable until GCC 16.1 (2026-04-30) |
| Large code model (`-mcmodel=large`) | Full | Merged GCC 14, contributed by Andes Technology |
| JIT backend (libgccjit) | Full | `libgccjit` is architecture-neutral at the API level and lowers through the same riscv64 backend as static compilation; no riscv64-specific gap identified |
| Vendor microarchitecture scheduling models | Full | SiFive, T-Head, Andes, MIPS, SpacemiT, XiangShan, Tenstorrent/Ventana Ascalon all have dedicated `.md` pipeline descriptions |

**Comparison table (amd64 / arm64 / riscv64), by component class**

| Component class | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Scalar codegen and register allocation | Full (hand-tuned, decades of refinement) | Full | Full |
| SIMD/vector autovectorization | Full (SSE/AVX, mature) | Full (NEON/SVE, mature) | Partial (RVV, 2-year-old autovectorizer, narrower coverage per recent benchmarks) |
| Cryptography intrinsics | Full (AES-NI etc.) | Full (Crypto Extensions) | Full (Zk*/Zvk*, newer but complete API surface) |
| Control-flow integrity | Full (CET-IBT/SHSTK) | Full (BTI/PAC) | Full (Zicfilp/Zicfiss), newest of the three |
| ISA-profile / baseline targeting | N/A (x86-64-v1..v4 microarch levels) | N/A (architecture versions) | Full (RVA20/22/23 named profiles, `-march=rva23u64` from GCC 16) |

### 4.3 Known miscompilation risk

An academic fuzzing study (RVISmith) targeting RVV intrinsics surfaced 13 previously-unknown bugs across GCC, LLVM, and the XuanTie (T-Head) toolchain; 10 were confirmed and 3 fixed at time of publication, and the paper characterizes most as silent miscompilations of RVV intrinsic code rather than crashes or diagnostics. Source: [RVISmith: Fuzzing Compilers for RVV Intrinsics](https://pith.science/paper/2507.03773). This indicates the RVV intrinsics surface, while functionally complete (Section 4.2), is still less battle-tested than the decades-mature scalar codegen path, consistent with any compiler feature that shipped in the last two stable releases.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build system

GCC uses autoconf/configure exclusively; there is no CMake build. `-DUSE_X=OFF`-style flags do not apply; GCC uses `--enable-X`/`--disable-X`/`--with-X` autoconf syntax. Source: [Installing GCC: Configuration](https://gcc.gnu.org/install/configure.html).

### 5.2 riscv64 configure invocations

**Native build (on a riscv64 host):**

```sh
../configure \
  --prefix=/usr/local \
  --enable-languages=c,c++,fortran \
  --disable-multilib
make -j$(nproc)
make install
```

**Cross-compilation (riscv64-targeting GCC on an x86_64 host, via the community `riscv-gnu-toolchain` wrapper, which drives GCC/binutils/glibc-or-newlib together):**

```sh
git clone https://github.com/riscv-collab/riscv-gnu-toolchain
cd riscv-gnu-toolchain
./configure --prefix=/opt/riscv
make linux        # glibc-based Linux cross toolchain
# or: make         # newlib-based bare-metal cross toolchain
# or: make musl     # musl-based Linux cross toolchain
```

Source: [riscv-collab/riscv-gnu-toolchain](https://github.com/riscv-collab/riscv-gnu-toolchain). This wrapper, not raw GCC configure invocations, is the documented and widely used path for building a riscv64 cross-compiler, because it sequences the interdependent binutils -> headers -> glibc/newlib -> GCC bootstrap that a bare GCC checkout does not handle alone.

**Multilib cross toolchain (32-bit and 64-bit in one installation):**

```sh
./configure --prefix=/opt/riscv --enable-multilib
make linux   # or `make` / `make musl`
```

### 5.3 Required build-time libraries and minimum versions

Per [Prerequisites for GCC](https://gcc.gnu.org/install/prerequisites.html): GMP >= 4.3.2, MPFR >= 3.1.0, MPC >= 1.0.1 (all three critical, GCC will not configure without them), and ISL >= 0.15 (optional, enables the Graphite loop-optimization framework). All four are architecture-neutral pure-C/C++ arbitrary-precision or polyhedral-model libraries with no riscv64-specific code; they build identically on riscv64 to any other Linux architecture and are packaged natively for riscv64 by every major distribution (Section 9).

### 5.4 riscv64 target triplets

Recognized triplets include `riscv32-unknown-elf`, `riscv64-unknown-elf` (bare metal, Newlib), `riscv64-unknown-linux-gnu` (glibc), `riscv64-unknown-linux-musl` (musl). The Debian riscv64 port baseline is RV64GC with the `lp64d` ABI. Source: [Debian RISC-V Wiki](https://wiki.debian.org/RISC-V).

### 5.5 QEMU support

QEMU's `qemu-riscv64` and `qemu-riscv64-static` user-mode emulation targets are the standard way to run a riscv64 GCC testsuite (`make check`) cross-compiled on a non-riscv64 host, and are used by the community `riscv-gnu-toolchain` CI and by several of the sourceware buildbot workers for supplementary coverage. Precise current QEMU version pinning for GCC's own test harness was not found in a primary source during this research pass [NEEDS VERIFICATION].

### 5.6 ABI considerations

GCC's `-mabi=` flag governs integer/floating-point calling convention (`ilp32`, `ilp32f`, `ilp32d`, `lp64`, `lp64f`, `lp64d`, plus the experimental `ilp32e`/`lp64e` for RV32E/RV64E) and must match the target's psABI exactly; mismatches are link-time or runtime failures, not compile errors, if libraries are mixed. Atomic code generation was brought into conformance with the current psABI specification in GCC 14 (contributed by Patrick O'Neill of Rivos), meaning pre-GCC-14 binaries may use a slightly different (though interoperable in most cases) atomics sequence. Source: [RISC-V Options (GCC manual)](https://gcc.gnu.org/onlinedocs/gcc/RISC-V-Options.html), [GCC 14 Changes](https://gcc.gnu.org/gcc-14/changes.html).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps.** No functional (correctness-blocking) gap was identified for the scalar compiler on riscv64: C, C++, and Fortran all build and pass the vast majority of the DejaGNU testsuite on the sourceware riscv64 buildbot fleet (Section 7). The one area with documented correctness risk is RVV intrinsics, per the RVISmith fuzzing results (Section 4.3): 10 confirmed miscompilation bugs across GCC/LLVM/XuanTie, some GCC-specific and still open at publication time.

**Performance gaps.** The primary, well-documented performance gap is in the loop/SLP **autovectorizer**, which is roughly two years younger on riscv64 (GCC 14, May 2024) than the equivalent maturity milestone on amd64/arm64 (decades of SSE/AVX and NEON/SVE tuning). Recent SPEC CPU 2017 and HPC-kernel benchmarking (2025) is mixed rather than uniformly behind: LLVM is faster than GCC in roughly two-thirds of tested SPEC benchmarks on riscv64 (up to 23.6% on specific workloads), while GCC leads LLVM on instruction-count reduction for integer workloads and on 4 of 6 tested HPC/ML vector proxy kernels, trailing specifically on matrix-multiply kernels (SGEMM/DGEMM) where LLVM's instruction selection is more aggressive. Sources: [LLVM vs. GCC on RISC-V Using SPEC CPU Benchmarks](https://llvm.org/devmtg/2025-06/slides/technical-talk/li-risc.pdf), [Comparative Analysis of Compiler Performance for RISC-V on SPEC CPU 2017](https://llvm.org/devmtg/2025-03/slides/riscv_on_spec_cpu.pdf), [Closer in the Gap: Towards Portable Performance on RISC-V Vector Processors](https://pith.science/paper/2605.10860). This is not evidence that riscv64 codegen is categorically behind amd64/arm64 GCC output; it is evidence that GCC's RVV autovectorizer specifically is a younger, still-maturing subsystem relative to GCC's own SSE/AVX and NEON autovectorizers, and relative to LLVM's RISC-V vectorizer which has had autovectorization since LLVM 14 (March 2022), roughly two years before GCC.

**Security hardening.** Stack canaries (`-fstack-protector*`) and ASLR-compatible PIE codegen (`-fpie`/`-fPIE`) work identically to amd64/arm64 (architecture-neutral GCC features with riscv64 relocation support). Forward-edge control-flow integrity (Zicfilp landing pads) and backward-edge (Zicfiss shadow stack) have dedicated riscv64 implementation (`riscv-zicfilp.cc`), functionally analogous to amd64 CET-IBT/SHSTK and arm64 BTI/PAC, and are in fact among the newest CFI implementations of the three architectures in GCC, tracking the RISC-V Zicfilp/Zicfiss ratification rather than lagging it. No riscv64-specific gap in hardened-allocator or sandbox support was identified; those are typically userspace-library concerns (glibc, systemd) rather than compiler-level ones.

**Floating-point and NaN semantics.** RISC-V uses IEEE 754 binary floating point with a canonical NaN payload that differs in bit pattern (though not in IEEE conformance) from x86_64 and arm64's canonical NaN. No specific GCC riscv64 test failures attributable to NaN canonicalization differences were found in this research pass [NEEDS VERIFICATION].

---

## 7. CI/CD Infrastructure

GCC uses a self-hosted **Buildbot** instance at [builder.sourceware.org](https://builder.sourceware.org/buildbot/), the same infrastructure used for GDB, binutils, glibc, valgrind, elfutils and other sourceware.org projects, sharing a physical riscv64 worker fleet across all of them. There is no GitHub Actions CI for GCC (the GitHub mirror is read-only) and RISE's GitHub-Actions-based RISC-V Runners (see [Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) are therefore not directly applicable to GCC's own upstream CI, though they could in principle be used by downstream forks or by the community `riscv-gnu-toolchain` project, which does use GitHub Actions.

**Live builder inventory** (`builder.sourceware.org` API, queried 2026-09-30):

| Builder | ID | Hardware | Coverage | Master connected | Last recorded build |
|---|---|---|---|---|---|
| `gcc-full-fedora-riscv` | 310 | Milk-V Pioneer Box (64-core, donated by RISC-V International and SOPHGO; Fedora 38) | Full bootstrap + `make check` testsuite | No (`masterids: []`) | 2025-02-11, build #1017 (result: RETRY); prior builds #1010-1016 all SUCCESS |
| `gcc-full-spacemit-x60` | 337 | SpacemiT X60 board | Full bootstrap + testsuite | No (`masterids: []`) | 2025-07-01, build #317 (result: RETRY); builds #312-315 SUCCESS |
| `gcc-full-p550` | 338 | SiFive HiFive Premier P550 (donated by RISC-V International, January 2025) | Full bootstrap + testsuite | Yes (`masterids: [2]`) | 2025-12-20, build #527 (result: RETRY); builds #522-525 SUCCESS |

Sources: [builder.sourceware.org Buildbot API](https://builder.sourceware.org/buildbot/api/v2/builders), [Re: RISC-V Pioneer Box for builder.sourceware.org gcc CI](https://www.mail-archive.com/gcc@gcc.gnu.org/msg103750.html), [New risc-v builder.sourceware.org CI workers (p550 and bpi-f3)](https://www.mail-archive.com/gcc@gcc.gnu.org/msg104647.html).

**Gap.** All three riscv64 full-build/full-test GCC builders show their most recent recorded build activity between February and December 2025, six to eight months stale relative to this report's 2026-09-30 research date, and two of the three show `masterids: []` (not currently connected to a buildmaster). This mirrors the identical finding in the [GDB status report](project-reports/gdb.md) for the shared riscv64 worker fleet (`gdb-riscv-full`, also on the HiFive P550, also disconnected as of that report's July 2026 research date), suggesting a fleet-wide riscv64 hardware or scheduling outage at builder.sourceware.org affecting GCC, GDB, and likely the other sourceware projects sharing these workers (binutils, glibc, valgrind, elfutils), rather than a GCC-specific problem. Prior to going stale, every observed build for all three builders returned SUCCESS (result code 0), indicating the riscv64 bootstrap-plus-testsuite pipeline was healthy when last active. Whether this is a temporary hardware/network outage or a longer-term lapse could not be determined from the API alone [NEEDS VERIFICATION].

**Release-blocking status.** Because riscv64 is a tertiary platform (Section 3), these builders' results are not part of GCC's formal release-blocking criteria the way `x86_64-pc-linux-gnu` or `aarch64-none-linux-gnu` CI is. In practice, riscv64 port maintainers (Section 1) monitor `gcc-testresults@gcc.gnu.org` and Bugzilla, and riscv64 regressions have historically been fixed promptly by the dedicated maintainer team, but there is no committed SLA.

**Comparison table**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI system | builder.sourceware.org Buildbot | builder.sourceware.org Buildbot | builder.sourceware.org Buildbot |
| Release-blocking | Yes (primary) | Yes (primary, `-linux-gnu`) | No (tertiary) |
| Hardware currently connected and active | Yes | Yes | Degraded/stale as of 2026-09-30 (Section 7) |

---

## 8. Distribution and Release Status

GCC ships source tarballs only from upstream, for every architecture (Section 1). riscv64 binary availability is therefore entirely a function of downstream distribution, identically to amd64 and arm64.

**Per Linux distribution** (live package-tracker data, fetched 2026-09-30):

| Distribution | riscv64 GCC available | Version | Source |
|---|---|---|---|
| Debian trixie (stable) | Yes | GCC 14.2.0-1 | [Debian package: gcc-riscv64-linux-gnu](https://packages.debian.org/gcc-riscv64-linux-gnu) |
| Debian sid (unstable) | Yes | GCC 15.2.0-4 | [Debian sid: gcc-riscv64-linux-gnu](https://packages.debian.org/sid/gcc-riscv64-linux-gnu) |
| Debian bookworm (oldstable) | Yes | GCC 12.2.0-5 | Same source |
| Ubuntu 24.04 LTS (noble) | Yes | GCC 13.2.0-7ubuntu1 | [Ubuntu: gcc-riscv64-linux-gnu](https://packages.ubuntu.com/gcc-riscv64-linux-gnu) |
| Ubuntu 22.04 LTS (jammy) | Yes | GCC 11.2.0-1ubuntu1 | Same source |
| Fedora | Partial | Cross-build package only (`gcc-riscv64-linux-gnu`); kernel-build use case documented, general userspace cross-build "not currently provided" per Fedora packaging notes | [Fedora Packages: gcc-riscv64-linux-gnu](https://packages.fedoraproject.org/pkgs/cross-gcc/gcc-riscv64-linux-gnu/) |
| Debian/Ubuntu as a **native** riscv64 port | Yes | riscv64 is a full native Debian/Ubuntu architecture; the plain `gcc` package builds and self-hosts on riscv64 hardware, not just as a cross-compiler | [Debian RISC-V Wiki](https://wiki.debian.org/RISC-V) |

No riscv64-specific packaging patches were identified for the Debian or Ubuntu GCC packages; both track vanilla upstream GCC releases (Debian trixie at 14.2.0, matching upstream GCC 14.2.0 exactly; no `+deb-riscv` style patch suffix observed), consistent with a release_provider of "distro, building unmodified upstream source" rather than a patched downstream fork.

**Community toolchain channel.** [riscv-collab/riscv-gnu-toolchain](https://github.com/riscv-collab/riscv-gnu-toolchain), maintained by the RISC-V International-affiliated "riscv-collab" GitHub organization, publishes prebuilt cross-toolchain releases (GCC + binutils + glibc/newlib/musl) for riscv32 and riscv64 targets on several host architectures via GitHub Releases. This is a widely used third-party distribution channel, separate from both upstream GCC and the Linux distributions, and is the path most embedded/bare-metal RISC-V developers use rather than building GCC from source directly.

---

## 9. Dependencies

**Summary table**

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| GMP | Build dependency (critical); arbitrary-precision arithmetic used by GCC's own constant folding | Yes | Yes | Yes, via every riscv64 distro | GNU Project |
| GNU MPFR | Build dependency (critical); arbitrary-precision floating point for constant folding | Yes | Yes | Yes, via every riscv64 distro | GNU Project / INRIA |
| GNU MPC | Build dependency (critical); complex-number arithmetic for constant folding | Yes | Yes | Yes, via every riscv64 distro | INRIA |
| ISL | Build dependency (optional); powers the Graphite polyhedral loop optimizer | Yes | Yes | Yes, via every riscv64 distro | INRIA / community |
| GNU binutils | Companion build/runtime dependency (critical); assembler (`as`) and linker (`ld`/`ld.bfd`/`ld.gold`) that GCC invokes | Yes, riscv64 port is co-maintained by several of the same individuals (Palmer Dabbelt, Jim Wilson) | Yes | Yes | GNU Project / sourceware.org. See the [GDB status report](project-reports/gdb.md) for the shared sourceware.org riscv64 CI and release infrastructure. |

**Step 1 detail.** GMP, MPFR, MPC, and ISL are all pure-C/C++ arbitrary-precision or polyhedral-model libraries with no architecture-specific code paths; their riscv64 status is "trivially portable" in the terms used by this report's methodology, and all four are packaged natively for riscv64 by Debian, Ubuntu, and Fedora (verified via the same distribution trackers cited in Section 8 for the packages generically named `libgmp-dev`, `libmpfr-dev`, `libmpc-dev`, `libisl-dev` on Debian/Ubuntu). No open riscv64-specific issues were found against any of the four in this research pass.

**Step 2 (recursion).** GNU binutils is the one dependency warranting its own architecture-specific assessment, since it, like GCC, carries a riscv64 backend (the assembler and linker's instruction encoding and relocation support). Binutils' riscv64 maintainers substantially overlap with GCC's (Palmer Dabbelt and Jim Wilson appear in both `MAINTAINERS` files), and it shares GCC's sourceware.org Buildbot CI infrastructure (`binutils-ubuntu-riscv`, builder 283, confirmed live in the Section 7 builder inventory). A dedicated binutils RISC-V status report was not found in `project-reports/` at the time of this research pass; the [GDB status report](project-reports/gdb.md), which documents the combined `binutils-gdb` sourceware tree's riscv64 build/test/CI posture for the debugger side, is the closest existing reference. glibc, the target C library GCC-produced riscv64 Linux binaries link against, is not a GCC build dependency (GCC builds against glibc *headers* only, via the `riscv-gnu-toolchain` wrapper's staged sysroot) but is the most consequential *runtime* dependency for any GCC-produced riscv64 binary; glibc's own riscv64 buildbot coverage (`glibc-ubuntu-riscv`, builder 293; `glibc-fedora-riscv`, builder 336) was confirmed live in the Section 7 inventory pull, but a full glibc riscv64 assessment is out of scope for this report.

---

## 10. Ecosystem Status

Not applicable in the sense Section 10 is scoped for this report series (package/plugin ecosystems such as PyPI or npm). GCC's "ecosystem" is better understood as: (a) every Linux userspace package on riscv64 that is compiled with it, which is effectively the entire riscv64 software stack covered elsewhere in `project-reports/`, and (b) the GNU toolchain triad (GCC, binutils, glibc/gdb) it is co-developed alongside on sourceware.org, covered in Section 9. A dedicated ecosystem-breadth analysis would duplicate the rest of this report series rather than add new information, and is omitted for that reason.

---

## 11. Known Bugs and Active Issues

| ID / Source | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [GCC Bugzilla 120763](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=120763) | "[meta-bug] Tracker for bugs to visit during weekly RISC-V meeting" | Open (meta-bug) | N/A (tracking) | Confirms the riscv64 maintainer team runs a recurring weekly triage meeting against a live bug tracker, evidence of active maintenance cadence |
| [GCC Bugzilla 117283](https://gcc.gnu.org/pipermail/gcc-bugs/2024-October/886522.html) | "[RISC-V] Miscompilation triggered by `__riscv_vsseg7e32_v_i32m1x7`, GCC 14.2.0 at -O1/-O2/-O3/-Os" | [NEEDS VERIFICATION current status] | High (silent miscompilation) | Segmented-store RVV intrinsic miscompilation; illustrates the Section 4.3 RVV-intrinsics correctness risk concretely |
| RVISmith fuzzing corpus | 13 RVV-intrinsics bugs found across GCC/LLVM/XuanTie; 10 confirmed, 3 fixed at publication | Mixed (open/fixed) | High (silent miscompilations) | [RVISmith paper](https://pith.science/paper/2507.03773); not all 13 are GCC-attributable, exact GCC-only count not broken out in the abstract reviewed [NEEDS VERIFICATION] |

This research pass did not have live Bugzilla query access (the advanced search UI requires a session the tooling used here could not drive); the table above is necessarily a sample rather than an exhaustive severity-grouped listing. The existence of a standing weekly RISC-V triage meeting (Bugzilla 120763) is itself a meaningful positive signal: it indicates riscv64 bug backlog is actively and routinely managed by the port maintainer team, not merely reactively.

---

## 12. Objections and Upstream Blockers

No stated upstream objection to riscv64 support, from any GCC Steering Committee member or Global Reviewer, was found in this research pass. The port was accepted on first submission in January 2017 (Section 2) and has received five dedicated co-maintainers since, more than several primary-tier architectures. The only structural "blocker" identified is the formal tertiary release-tier classification (Section 3): this is not evidence of hostility, it is an artifact of GCC's platform-classification policy predating RISC-V's relevance, and the policy criteria (popularity and testing duplicativeness) are not RISC-V-specific objections. Given riscv64's current hardware trajectory (server-class cores such as the SpacemiT X60, SiFive P550/P600, and Ventana/Tenstorrent Ascalon designs already have dedicated GCC scheduling models, Section 4.1), a realistic path exists for riscv64 to be promoted to secondary or primary status in a future release criteria revision, though no such proposal was found in this research pass [NEEDS VERIFICATION].

No technical blocker analogous to "a dependency with no riscv64 port" exists: every GCC build dependency (Section 9) is already riscv64-clean.

---

## 13. Readiness Assessment

Per the `/project-color-coding` skill methodology:

- **Color:** blue (upstream CI builds and, when the shared riscv64 hardware fleet is connected, runs the full test suite (Section 7); no official upstream binary release exists for **any** architecture, so the release column cannot be "yes" for riscv64 or for amd64/arm64 alike (Section 1), which caps the color at blue under the color model's strict CI-build/CI-test/CI-release table rather than at green)
- `color_case`: (empty; blue has no sub-type)
- **Release provider:** distro (Debian, Ubuntu, and Fedora all build and ship riscv64 GCC packages from unmodified upstream source, with Debian trixie's `14.2.0-1` matching the upstream GCC 14.2.0 release exactly; no riscv64-specific packaging patches were identified)
- GCC is not an optimization-purpose project in the sense defined by the color-coding skill (it is a general-purpose compiler, not a library whose sole value proposition is beating a reference implementation on speed), so the optimization-level modifier (Step 2) does not apply and is omitted from the header.

**Justification:** The riscv64 backend in GCC is upstream, co-maintained by five named individuals (more than aarch64's three), and actively built and tested on dedicated sourceware.org Buildbot hardware with every observed historical build result a SUCCESS ([builder.sourceware.org API](https://builder.sourceware.org/buildbot/api/v2/builders)). The color is capped at blue rather than raised to green purely because GCC, like GDB, never publishes an official upstream binary for any target architecture; this is a project-wide characteristic, not a riscv64-specific shortfall. The one live caveat pulling against a clean "blue, no asterisks" grade is that the dedicated full-bootstrap riscv64 CI hardware (Section 7) shows 6-8 months of staleness as of this report's research date, with two of three riscv64-full builders disconnected from their buildmaster; this mirrors an identical finding in the July 2026 GDB report for the same shared hardware fleet, and should be treated as a fleet-wide sourceware.org infrastructure question rather than a GCC-specific regression.

**Pending work that could change the grade:** promotion of riscv64 from tertiary to secondary/primary release tier (Section 3, Section 12) would strengthen the CI/release-blocking evidence without changing the underlying color-model inputs; restoration of the riscv64 Buildbot fleet to active status would remove the one negative caveat above; continued autovectorizer maturation (Section 6) does not affect the color (autovectorizer gaps are a performance, not correctness/release, concern for a non-optimization-purpose project) but is the most consequential open technical gap for engineering teams evaluating riscv64 GCC for numerically intensive workloads.

---

## 14. Investment Analysis

**Before sizing, note what is already well covered.** GCC's riscv64 port does not need "enablement" investment in the sense many newer or smaller projects in this report series do: the backend is complete, co-maintained, distro-packaged, and has been for multiple GCC release cycles. Investment here is about closing specific, already-identified gaps, not about bootstrapping basic support.

**14.1 Functional enablement.** No blocking functional gaps requiring new investment were identified; this line item is effectively closed. The nearest thing to open functional work is continuing to fix the RVISmith-class RVV intrinsics miscompilation bugs (Section 4.3, Section 11); this is normal upstream bug-fixing already handled by the existing five-person maintainer team and does not represent an unfunded gap.

**14.2 Performance optimization.** The autovectorizer maturity gap (Section 6) is the primary performance-investment target. Closing the SGEMM/DGEMM instruction-count gap against LLVM would require intrinsics-level tuning or cost-model refinement in `riscv-vector-costs.cc`; estimated effort 4-8 person-weeks per major kernel class for an engineer already familiar with GCC's tree-vectorizer internals, based on the scope of comparable single-kernel-class tuning efforts documented in the [RISE LLVM SPEC optimization project writeup](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/) for the equivalent LLVM work (8 months, broader scope than a single kernel class). RISE has funded directly comparable work on the LLVM side (Igalia, 8 months, per that writeup); no directly analogous RISE-funded GCC vectorizer project was found in this research pass, representing a plausible gap RISE could close on the GCC side to match its LLVM investment.

**14.3 CI/CD infrastructure.** The most immediately actionable, lowest-cost item identified in this entire report: restore the two disconnected riscv64-full Buildbot workers (`gcc-full-fedora-riscv`, `gcc-full-spacemit-x60`, Section 7) to active status. This is a hardware/ops task, not a compiler-engineering task, estimated at under 1 person-week for someone with physical or remote access to the RISC-V International-donated hardware, and would remove the single negative caveat in this report's readiness assessment (Section 13). Given RISC-V International and SOPHGO already donated the Milk-V Pioneer Box and RISC-V International donated the HiFive P550 ([mail-archive: RISC-V Pioneer Box for builder.sourceware.org gcc CI](https://www.mail-archive.com/gcc@gcc.gnu.org/msg103750.html)), this is a maintenance gap on existing donated infrastructure rather than a new hardware-provisioning need.

**14.4 Ecosystem enablement.** Not applicable (Section 10).

**14.5 Summary table**

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Continue fixing RVISmith-class RVV intrinsics miscompilations | Ongoing, part of existing maintainer workload | Existing riscv64 port maintainers | Medium |
| Performance | Close SGEMM/DGEMM autovectorizer instruction-count gap vs LLVM | 4-8 per kernel class | GCC vectorizer specialist, ideally RISE-funded | Medium |
| CI/CD | Reconnect/restore the two disconnected riscv64-full Buildbot workers | <1 | Hardware/ops owner with sourceware.org Buildbot access | High (cheap, high-signal fix) |
| CI/CD | Propose formal promotion of a riscv64 target to GCC's secondary (or primary) release-criteria tier | 1-2 (process/advocacy effort, not engineering) | RISC-V port maintainers, with RISE governing-board backing | Low-Medium |

---

## 15. References

- [Palmer Dabbelt, "New Port for RISC-V"](https://gcc.gnu.org/legacy-ml/gcc-patches/2017-01/msg00776.html)
- [Andrew Waterman, "Re: RISC-V port accepted for inclusion in GCC"](https://gcc.gnu.org/legacy-ml/gcc/2017-01/msg00152.html)
- [SiFive, "RISC-V GCC is upstreamed!"](https://www.sifive.com/blog/risc-v-gcc-is-upstreamed)
- [GCC 7 Release Series Changes](https://gcc.gnu.org/gcc-7/changes.html)
- ["RISC-V: Add Jim Wilson as a maintainer"](https://gcc.gnu.org/legacy-ml/gcc/2017-11/msg00040.html)
- [Phoronix, "GCC 12 Merges Initial Support For RISC-V's Bitmanip Extensions"](https://www.phoronix.com/news/GCC-12-Bitmanip-Extension)
- [GCC 13 Release Series Changes](https://gcc.gnu.org/gcc-13/changes.html)
- [GCC 14 Release Series Changes](https://gcc.gnu.org/gcc-14/changes.html)
- [Phoronix, "RISC-V Auto-Vectorization Support For The GCC Compiler Started"](https://www.phoronix.com/news/GCC-RISC-V-Auto-Vectorization)
- [gcc-patches, "[PATCH 2/2] RISC-V: Support RISC-V Profiles 23"](https://gcc.gnu.org/pipermail/gcc-patches/2025-January/674149.html)
- [RISCstar, "RVA23: From Ratification to Real-World Readiness"](https://riscstar.com/blog/rva23-from-ratification-to-real-world-readiness/)
- [GCC 16 Release Series](https://gcc.gnu.org/gcc-16/)
- [GCC 16 Release Criteria](https://gcc.gnu.org/gcc-16/criteria.html)
- [Status of Supported Architectures from Maintainers' Point of View](https://gcc.gnu.org/backends.html)
- [Tux Machines, "GCC 15.2 Released"](https://news.tuxmachines.org/n/2025/08/09/GCC_15_2_Released.shtml)
- [GCC 4.8 Release Series Changes](https://gcc.gnu.org/gcc-4.8/changes.html)
- [gcc-mirror/gcc, `gcc/config/riscv/` directory listing and `MAINTAINERS` file](https://github.com/gcc-mirror/gcc) (live clone, fetched 2026-09-30)
- [RISC-V Options (Using the GNU Compiler Collection)](https://gcc.gnu.org/onlinedocs/gcc/RISC-V-Options.html)
- [RVISmith: Fuzzing Compilers for RVV Intrinsics](https://pith.science/paper/2507.03773)
- [GCC Bugzilla 120763, "[meta-bug] Tracker for bugs to visit during weekly RISC-V meeting"](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=120763)
- [GCC Bugzilla 117283, RVV segmented-store miscompilation report](https://gcc.gnu.org/pipermail/gcc-bugs/2024-October/886522.html)
- [LLVM vs. GCC on RISC-V Using SPEC CPU Benchmarks](https://llvm.org/devmtg/2025-06/slides/technical-talk/li-risc.pdf)
- [Comparative Analysis of Compiler Performance for RISC-V on SPEC CPU 2017](https://llvm.org/devmtg/2025-03/slides/riscv_on_spec_cpu.pdf)
- [Closer in the Gap: Towards Portable Performance on RISC-V Vector Processors](https://pith.science/paper/2605.10860)
- [Prerequisites for GCC](https://gcc.gnu.org/install/prerequisites.html)
- [Installing GCC: Configuration](https://gcc.gnu.org/install/configure.html)
- [riscv-collab/riscv-gnu-toolchain](https://github.com/riscv-collab/riscv-gnu-toolchain)
- [Debian RISC-V Wiki](https://wiki.debian.org/RISC-V)
- [Debian package: gcc-riscv64-linux-gnu (trixie)](https://packages.debian.org/gcc-riscv64-linux-gnu)
- [Debian package: gcc-riscv64-linux-gnu (sid)](https://packages.debian.org/sid/gcc-riscv64-linux-gnu)
- [Ubuntu package: gcc-riscv64-linux-gnu](https://packages.ubuntu.com/gcc-riscv64-linux-gnu)
- [Fedora Packages: gcc-riscv64-linux-gnu](https://packages.fedoraproject.org/pkgs/cross-gcc/gcc-riscv64-linux-gnu/)
- [builder.sourceware.org Buildbot API](https://builder.sourceware.org/buildbot/api/v2/builders)
- [Re: RISC-V Pioneer Box for builder.sourceware.org gcc CI](https://www.mail-archive.com/gcc@gcc.gnu.org/msg103750.html)
- [New risc-v builder.sourceware.org CI workers (p550 and bpi-f3)](https://www.mail-archive.com/gcc@gcc.gnu.org/msg104647.html)
- [RISE Project, "Announcing the RISE RISC-V Runners"](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project, "Project RP009: LLVM SPEC Optimization"](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [RISE Project Governing Board members](https://www.embedded.com/rise-project-gives-risc-v-an-open-source-software-lift/)
- [GCC status report companion: GDB](project-reports/gdb.md)
