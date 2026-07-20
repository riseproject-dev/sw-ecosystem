---
title: glibc
categories:
  - libraries
---

# glibc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for glibc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

glibc is the GNU C Library, the primary system C library for Linux. It implements the POSIX and ISO C standard library interfaces, the Linux system call wrapper layer, the ELF dynamic linker (`ld.so`), POSIX threads (NPTL), and the `libm` math library. Every user-space process on a glibc-based Linux system links against it. Its correctness and performance are foundational to every higher-level software stack.

- **Upstream URL:** [https://sourceware.org/git/glibc.git](https://sourceware.org/git/glibc.git)
- **Homepage:** [https://www.gnu.org/software/libc/](https://www.gnu.org/software/libc/)
- **Mirror (archived Feb 2026):** [https://github.com/bminor/glibc](https://github.com/bminor/glibc)
- **License:** GNU Lesser General Public License v2.1 or later
- **Governance:** GNU Project / FSF, maintained by 8 designated GNU package maintainers with commit-access authority over ~70 developers
- **Bug tracker:** Sourceware Bugzilla at sourceware.org (blocked to programmatic access via Anubis bot protection at time of research)
- **Latest release:** glibc 2.43 (Data not available: exact release date; ftp.gnu.org/gnu/libc/ lists 2.43 as the latest tarball). Prior: glibc 2.42 (released 2025-07-28), glibc 2.41 (2025-01-29).

---

## 2. Port History and Upstreaming Timeline

The RISC-V port was upstreamed in **glibc 2.27** (early 2018). The original author was **Palmer Dabbelt** (then at SiFive, palmer@sifive.com).

- **2018-01-07:** First preparatory commits land (VDSO hash, ELF flags, shared-object subdirectory support), Palmer Dabbelt, SiFive
- **2018-01-29:** Core port infrastructure ("RISC-V: Build Infrastructure", SHA c50615570927) and hard-float support ("RISC-V: Hard Float Support", SHA b2cb5e0298e0), Palmer Dabbelt, SiFive
- **2018-02:** glibc 2.27 released with riscv64 upstream for the first time
- **2019:** Early bug fixes for DL_RO_DYN_SECTION ABI (BZ #24484), VDSO for static linking (BZ #19767)
- **2021:** Stack alignment fixes in clone and `_dl_init` (BZ #28702, BZ #28703)
- **2023:** feenvupdate with FE_DFL_ENV fixed (BZ #31022)
- **2024:** Alignment-ignorant memcpy added (Evan Green / Palmer Dabbelt, Rivos); multi-argument IFUNC resolvers introduced (RISC-V was first architecture to pass two arguments to resolvers)
- **2025:** IFUNC gp-pointer crash fixed (BZ #32269); `__riscv_hwprobe` prototype corrected (BZ #32932); vector register syscall clobbers fixed; RVV memset added; Zbkb `repeat_bytes` optimization added
- **Current maintainers:** Palmer Dabbelt (Rivos), Andrew Waterman (SiFive), Peter Bergner (IBM/Tenstorrent), Darius Rad (affiliation not confirmed from available sources)

---

## 3. Upstream Support Tier

glibc does not publish a formal numbered tier system. Port standing is determined by the presence of active named machine maintainers and by the health of the port in the master branch.

The RISC-V port currently has three named machine maintainers: Palmer Dabbelt (Rivos), Andrew Waterman (SiFive), Peter Bergner (IBM). This is a stronger maintainer bench than most non-x86/arm64 architectures. The port has accumulated no known unaddressed architectural regressions as of the data available.

The practical risk indicator for glibc ports is loss of named maintainership -- the SuperH/sh port is the canonical cautionary example. RISC-V does not currently exhibit that risk.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

The riscv64 implementation is not a stub. All ABI-critical components have real architecture-specific implementations.

### 4.1 Directory Structure

The RISC-V implementation spans three directory trees:

- `sysdeps/riscv/` -- base architecture code (startup, setjmp, atomic, FPU, PLT trampoline, IFUNC infrastructure, string helpers)
- `sysdeps/riscv/rvf/`, `sysdeps/riscv/rvd/`, `sysdeps/riscv/rvv/` -- extension-specific math, FPU environment, and vector routines
- `sysdeps/unix/sysv/linux/riscv/` -- Linux-specific syscall layer, clone, vfork, ucontext, hwprobe, IFUNC dispatch, ABI lists

### 4.2 Component Coverage

| Component | Implementation Status | Notes |
|---|---|---|
| Process startup (`_start`) | Full | `start.S`: hand-written asm, `load_gp` preinit, `__wrap_main` PIC trampoline |
| setjmp / longjmp | Full | Saves/restores integer regs (ra, s0-s11, sp) and FP regs (fs0-fs11); soft-float variant omits FP |
| Dynamic linker | Full | `dl-machine.h`: handles R_RISCV_RELATIVE, R_RISCV_JUMP_SLOT, TLS, R_RISCV_COPY, R_RISCV_IRELATIVE; gp-register init via `__global_pointer$` |
| PLT trampoline | Full | `dl-trampoline.S`: `_dl_runtime_resolve` and `_dl_runtime_profile` (audit); saves/restores a0-a7 and fa0-fa7 |
| memcpy | Full | IFUNC dispatch: `__memcpy_noalignment` (128-byte block loop) on `RISCV_HWPROBE_MISALIGNED_FAST` hardware; generic C fallback |
| memset | Full (with known bug) | IFUNC dispatch: `__memset_vector` (RVV, LMUL=m8, `vse8.v` loop) when `RISCV_HWPROBE_IMA_V`; generic C fallback. **Known bug: SIGILL if RVV disabled via prctl() -- see Section 11.** |
| String functions (strchr, strcmp, strlen, memchr) | Partial | Zero-byte detection primitives in `string-fza.h`/`string-fzi.h` use Zbb `orc.b` or XTheadBb `th.tstnbz` where available; actual string loops are generic C, not hand-tuned asm |
| Atomic operations | Full | `atomic-machine.h`: AMO instructions (`amomaxu`, `amominu`); hard compile error if A extension absent; PAUSE via raw `.insn i` encoding |
| NPTL / thread support | Full | TLS headers, `pthreaddef.h`, `pthread-offsets.h` for NPTL; tp register as thread pointer |
| `clone()` / `vfork()` | Full | `clone.S`: 128-bit stack alignment per ABI, arg remapping, `__thread_start`; `vfork.S`: CLONE_VM|CLONE_VFORK|SIGCHLD |
| ucontext (get/set/swap/make) | Full | Full integer + FP register save/restore; signal mask via `rt_sigprocmask`; `makecontext` handles up to 8 register args |
| Cancellable syscall | Full | `syscall_cancel.S`: `__syscall_cancel_arch_start`/`_end` markers; PIC and non-PIC |
| FPU control | Full | `fpu_control.h`: `frsr`/`fssr` inline asm; soft-float no-ops |
| Floating-point environment | Full | 16 functions in `sysdeps/riscv/rvf/` (fegetenv, fesetenv, fegetround, fesetround, feholdexcpt, feupdateenv, etc.) |
| Single-precision math | Full (no asm) | C using hardware FP classification (`fclass.s`); compiler builtins for sqrt/fma via headers |
| Double-precision math | Full (no asm) | C using hardware instructions; builtins for sqrt/fma |
| ffs/ffsll | Partial | `math-use-builtins-ffs.h`: hardware `ctz` when Zbb (GCC 12+) or XTheadBb (GCC 13+); otherwise generic C. Note: XTheadBb only enables ffsll, not ffs -- asymmetry suggests incomplete 32-bit ctz support in that extension under GCC 13. |
| hwprobe VDSO | Full | `hwprobe.c`: `__riscv_hwprobe()` via `INTERNAL_VSYSCALL`; corrected prototype (BZ #32932, May 2025) |
| Syscall layer | Full | a7 for syscall number, a0-a6 for args; vector register clobbers added Sep 2025 (was a latent silent-corruption bug) |
| VDSO | Full (rv64 only) | `__vdso_clock_gettime` and `__vdso_getrandom` (Linux >= 4.15); rv32 lacks VDSO clocks |
| ABI lists | Full | 15 `.abilist` files for rv64 covering libc, libm, libpthread, libdl, librt, libresolv, libthread_db, libc_malloc_debug, and others |
| Zbkb optimization | Full | `string-misc.h`: `packh`/`packw`/`pack` for byte-replication across a machine word (Oct 2025); falls back to generic when `__riscv_zbkb` not defined |

### 4.3 IFUNC Runtime Dispatch

RISC-V is the first glibc architecture whose IFUNC resolvers receive two arguments: `hwcap` (uint64_t) and a pointer to `__riscv_hwprobe`. This enables resolvers to query specific microarchitectural capabilities (misaligned access performance, vector support, extension presence) without making an additional syscall.

The registered IFUNC implementations as of the current codebase:
- `memcpy`: `{__memcpy_noalignment, __memcpy_generic}` -- selects on `RISCV_HWPROBE_MISALIGNED_FAST`
- `memset`: `{__memset_vector, __memset_generic}` -- selects on `RISCV_HWPROBE_IMA_V`

### 4.4 RVV (Vector Extension) Status

As of Dec 2025, only `memset` has an RVV-optimized path. No RVV `memcpy`, `strcmp`, `strlen`, `strchr`, `memchr`, or `memmove` exist upstream. The December 2024 RISE webinar explicitly listed "Vector mem* and str* in glibc" as the next priority item for the Compilers and Toolchains working group [NEEDS VERIFICATION for exact RFP funding status].

---

## 5. Build System, Cross-Compilation, and Toolchain

glibc uses autoconf `./configure` + GNU Make. There are no CMake or Meson build files.

### 5.1 Toolchain Version Requirements

From the upstream `INSTALL` file and `sysdeps/riscv/preconfigure.ac`:

| Tool | Minimum Version | Newest Verified |
|---|---|---|
| GCC | 12.1 | 15.1.1 |
| GNU binutils | 2.39 | 2.45 |
| GNU make | 4.0 | 4.4.1 |
| GNU autoconf | exactly 2.72 | -- (only if regenerating configure) |
| Linux kernel headers | 3.2 | 6.12 |
| Python | 3.4 | 3.13.5 |
| GDB (for test suite) | 7.8 + Python 3.4 | 14.2 |

**Additional requirement for RVV paths:** GCC >= 15 is required if building with the V extension active. `sysdeps/riscv/preconfigure.ac` enforces: `"glibc requires GCC 15 or later for the V extension"` and requires RVV spec version >= 1.0 (encoded as `>= 1000000`). This check was added in commit 4797591 (Sep 2025).

The upstream CI toolchain defaults (from `build-many-glibcs.py`) are: binutils `vcs-2.45`, GCC `vcs-15`, Linux headers `6.18`.

### 5.2 ABI Constraints

From `sysdeps/riscv/preconfigure.ac`:

| Condition | Result |
|---|---|
| XLEN not 32 or 64 | Build error: "Unable to determine XLEN" |
| FLEN = 32 (F extension, no D) | Build error: "glibc does not yet support systems with the F but not D extensions" |
| float_abi = single | Build error: "glibc does not yet support the single floating-point ABI" |
| No A (atomic) extension | Build error: "glibc requires the A extension" |
| V extension + GCC < 15 | Build error: "glibc requires GCC 15 or later for the V extension" |

Supported riscv64 ABI combinations (from `build-many-glibcs.py`):
- `rv64imac` / `lp64` (soft-float)
- `rv64imafdc` / `lp64` (hardware FP registers, soft-float ABI)
- `rv64imafdc` / `lp64d` (hardware FP, double-precision ABI -- Debian/Ubuntu baseline)

F-only (no D) is explicitly unsupported and will produce a build error.

### 5.3 Cross-Compilation

Standard cross-build (host=x86_64, target=riscv64):

```bash
mkdir build-riscv64 && cd build-riscv64
../glibc/configure \
  --host=riscv64-linux-gnu \
  --build=$(../glibc/scripts/config.guess) \
  --prefix=/usr \
  --with-headers=/path/to/linux-headers/usr/include \
  --enable-kernel=5.4.0 \
  --disable-werror \
  CC=riscv64-linux-gnu-gcc
make -j$(nproc)
make install install_root=/path/to/sysroot
```

The official multi-arch build method uses `scripts/build-many-glibcs.py`:

```bash
python3 scripts/build-many-glibcs.py /path/to/builddir checkout
python3 scripts/build-many-glibcs.py /path/to/builddir \
  build riscv64-linux-gnu-rv64imafdc-lp64d
```

This script builds the full toolchain chain (binutils, stage1/stage2 GCC, Linux headers, glibc) automatically, passing `--with-arch=rv64imafdc --with-abi=lp64d --disable-multilib` to GCC.

### 5.4 Linker Relaxation Handling

`sysdeps/riscv/Makefile` auto-detects `R_RISCV_ALIGN` support in the linker at configure time. If absent, it automatically adds `-Wa,-mno-relax` and `-mno-relax`. No user action is required.

### 5.5 Test Execution

glibc's native cross-test mechanism uses SSH:

```bash
make check \
  test-wrapper="$(pwd)/scripts/cross-test-ssh.sh user@riscv-host"
```

QEMU user-mode can substitute:

```bash
make check \
  test-wrapper="qemu-riscv64 -L /opt/riscv/sysroot"
```

No Dockerfile exists in the glibc source tree. The `riscv-collab/riscv-gnu-toolchain` CI uses stock `ubuntu-22.04` / `ubuntu-24.04` GitHub Actions runners.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

This section compares riscv64 to arm64 and amd64 across the primary user-visible subsystems.

### 6.1 String and Memory Functions

| Function | amd64 | arm64 | riscv64 |
|---|---|---|---|
| memcpy | Multi-variant asm (AVX-512, AVX2, SSE2, erms) | Multi-variant asm (SVE, ASIMD, DC ZVA) | Single asm variant (`__memcpy_noalignment`) for misaligned-fast hardware; generic C otherwise |
| memset | Multi-variant asm (AVX-512, AVX2, erms) | Multi-variant asm (SVE, ASIMD, DC ZVA) | RVV asm (`__memset_vector`) on V-capable hardware (Dec 2025); generic C otherwise |
| memchr | asm (AVX2, SSE2) | asm (SVE, ASIMD) | Generic C with Zbb zero-byte detection primitive |
| strchr | asm (AVX2, SSE2) | asm (SVE, ASIMD) | Generic C with Zbb/XTheadBb zero-byte detection primitive |
| strcmp | asm (AVX2, SSE2) | asm (SVE, ASIMD) | Generic C with Zbb/XTheadBb zero-byte detection primitive |
| strlen | asm (AVX2, SSE2) | asm (SVE, ASIMD) | Generic C with Zbb/XTheadBb zero-byte detection primitive |
| strnlen | asm (AVX2) | asm (SVE, ASIMD) | Generic C |
| memmove | Multi-variant asm | Multi-variant asm | Generic C |

The gap for riscv64 is consistent: building blocks are hardware-accelerated (zero-byte detection via Zbb/XTheadBb, byte replication via Zbkb, misaligned-access memcpy, RVV memset), but the actual string loop functions have no dedicated hand-tuned asm.

Data not available: quantitative throughput benchmarks comparing riscv64 to arm64 or amd64 for any of these functions. No published numeric comparison was found in accessible sources.

### 6.2 Math Library (libm)

All three architectures share the CORE-MATH-based correctly-rounded implementations for transcendental functions (sin, cos, exp, log, pow, etc.) that were merged across Oct 2024-Dec 2024. These are architecture-neutral.

riscv64 uses compiler builtins for sqrt and fma when the D/F extensions are present. amd64 and arm64 have additional hand-tuned asm for a subset of transcendentals (data not available: exact list of hand-tuned functions on arm64 that riscv64 lacks).

Data not available: benchmark comparison of libm throughput or latency between riscv64 and arm64/amd64 on any specific function.

### 6.3 Dynamic Linker

The riscv64 dynamic linker is complete (see Section 4.2). The gp-register initialization quirk (requiring `lla` rather than simple `mv` due to `__global_pointer$` being `SHN_ABS` type) is handled correctly as of commit 3fd2ff7 (Feb 2025).

### 6.4 Thread-Local Storage

riscv64 uses the DTV-at-TP layout (pre-TCB, TCB_SIZE=0), which is the same model as most non-x86 architectures. No known gaps vs arm64.

### 6.5 vDSO

riscv64 supports `__vdso_clock_gettime` (Linux >= 4.15) and `__vdso_getrandom` (Linux >= 6.16, glibc support added Jun 2025 via commit fc6f074). amd64 and arm64 have additional vDSO entries (`gettimeofday`, `getcpu`). Data not available: full enumeration of vDSO entries present on arm64 but absent on riscv64.

---

## 7. CI/CD Infrastructure

### 7.1 Upstream glibc CI

No CI pipeline configuration file (`.gitlab-ci.yml`, GitHub Actions workflow, Jenkinsfile, or equivalent) was found in the glibc source tree. The `bminor/glibc` GitHub mirror, which is the only accessible code mirror (archived Feb 2026), contains no `.github/` directory and no `.gitlab-ci.yml`.

`scripts/build-many-glibcs.py` defines riscv64 cross-build configurations (`rv64imac-lp64`, `rv64imafdc-lp64`, `rv64imafdc-lp64d`) and has a `bot`/`bot-cycle` mode for continuous operation, but this is a developer utility script, not a CI pipeline definition. Its presence proves that riscv64 builds are supported by the official multi-arch toolchain builder; it does not prove that any automated CI bot runs it.

**Sourceware Buildbot:** The sourceware.org Buildbot (`builder.sourceware.org`) lists the following active glibc builders: `glibc-autoregen`, `glibc-debian-arm64`, `glibc-debian-armhf`, `glibc-debian-i386`, `glibc-debian-ppc64`, `glibc-fedora-ppc64le`, `glibc-fedora-s390x`, `glibc-fedora-x86_64`, `glibc-fedrawhide-x86_64`, `glibc-snapshots-trunk`. **No riscv64 builder exists in this list.** The sourceware.org Buildbot infrastructure does have riscv64 hardware (VisionFive-2 boards donated by StarFive, Milk-V Pioneer Box from RISC-V International/SOPHGO), and those machines run RISC-V CI for other projects (binutils, GDB, elfutils, valgrind, libabigail), but not for glibc.

### 7.2 RISE Project CI

The RISE December 2024 webinar slides list seven active CI projects on the RISE build farm. One of them is **glibc pre-commit CI**. The RISE build farm grew 600% in machine cycles since November 2023. New projects added to RISE CI infrastructure include glibc, LLVM, Python, and OpenJDK.

The nature of this CI (which configurations are tested, pass/fail status, hosting URL) is Data not available: the RISE CI dashboard or glibc-specific job definitions were not accessible from available sources.

### 7.3 CI Gap Assessment

riscv64 has no automated glibc CI on the upstream sourceware.org Buildbot despite that infrastructure having riscv64 hardware. The RISE build farm claims glibc pre-commit CI [NEEDS VERIFICATION for scope and configuration], but the specifics are not publicly documented in accessible sources.

---

## 8. Distribution and Release Status

| Distribution | Package | Version | Status |
|---|---|---|---|
| Upstream GNU | Source tarball only | 2.43 (latest) | Source distribution; no binary packages from upstream |
| Debian unstable (sid) | libc6 riscv64 | 2.42-17 | Confirmed built successfully on `rv-osuosl-05` buildd; status "Installed" |
| Ubuntu 24.04 (Noble) | libc6 riscv64 | 2.39-0ubuntu8 | Confirmed available; ~2.7 MB package |
| Arch Linux RISC-V | glibc riscv64 | 2.43+r22+g8362e8ce10b2-2.1 | Confirmed in live `core` repository; package database record verified |

The Debian autopkgtest results page for glibc lists only amd64, arm64, i386, loong64, ppc64el, s390x -- riscv64 is absent from that view. This is likely a tracking/display gap in the autopkgtest infrastructure rather than a test failure, given the successful buildd record [NEEDS VERIFICATION].

---

## 9. Dependencies

### 9.1 GCC

- **Role:** Required compiler; generates RISC-V machine code for all C, inline asm, and assembly source files
- **Minimum:** 12.1 (general); 15.0 required if building with the V extension
- **riscv64 build status:** Builds cleanly with GCC 12-15 for standard `rv64gc lp64d`; RVV paths require GCC >= 15
- **Blocker:** Distros shipping GCC 12-14 cannot build the RVV-optimized memset path. The `preconfigure.ac` enforces this as a hard error, not a warning.
- **Latest verified:** GCC 16.1 (Apr 2026) [NEEDS VERIFICATION: GCC 16 riscv64 build status with glibc]

### 9.2 GNU Binutils

- **Role:** Assembler and linker; required for STT_GNU_IFUNC support (glibc's IFUNC dispatch), R_RISCV_ALIGN relaxation, and R_RISCV_RELATIVE for static-PIE
- **Minimum:** 2.39
- **riscv64 build status:** Builds cleanly; linker relaxation auto-detected at configure time
- **Latest verified upstream CI default:** vcs-2.45

### 9.3 Linux Kernel Headers

- **Role:** Provides the userspace-visible syscall ABI surface
- **General minimum:** 3.2; RISC-V PI-mutex requires >= 4.20 (`kernel-features.h`); VDSO on rv64 requires >= 4.15
- **hwprobe syscall:** Requires kernel >= 6.4 (added in Linux 6.4)
- **vDSO getrandom on riscv64:** Requires kernel >= 6.16; glibc support added Jun 2025
- **Status:** All current riscv64 distributions run kernel 6.x; all required features present

### 9.4 glibc Version Requirements for Downstream Consumers

The following glibc releases introduced fixes that are blocking for correct behavior on riscv64:

| Version | Blocker |
|---|---|
| 2.40 | Static-PIE crash on self-relocation (fixed in 2.40) |
| 2.41 | `.preinit_array` misalignment in `Scrt1.o` (BZ #32228, fixed in 2.41) |
| 2.42 | IFUNC resolver gp-pointer SIGSEGV (BZ #32269, fixed in 2.42); incorrect `__riscv_hwprobe` attributes (BZ #32932, fixed in 2.42) |

Any deployment on glibc < 2.42 for riscv64 should be treated as carrying known crash-class defects.

---

## 10. Ecosystem Status

### 10.1 Governance and Corporate Involvement

glibc is governed by the GNU Project via 8 designated package maintainers. Red Hat / IBM dominates the GNU package maintainer tier (Carlos O'Donell, Jakub Jelinek, Florian Weimer, Siddhesh Poyarekar). Andreas Schwab (SUSE) and Joseph Myers (ARM) hold GNU package maintainer roles. Adhemerval Zanella (Linaro) is a major subsystem maintainer. The RISC-V machine maintainers are Palmer Dabbelt (Rivos), Andrew Waterman (SiFive), and Peter Bergner (IBM).

### 10.2 RISE Project Involvement

glibc is placed in the **Compilers and Toolchains working group** within the RISE project (not the System Libraries WG). Nathan Egge (Google) is TSC member; Jeff Law (Ventana Micro) leads the Compilers and Toolchains WG.

Confirmed RISE involvement with glibc:
1. **glibc pre-commit CI** is listed as one of seven active CI projects on the RISE build farm (Dec 2024 webinar)
2. **"Vector mem* and str* in glibc"** was explicitly listed as a next-priority item in the Dec 2024 RISE Compilers and Toolchains roadmap
3. The RISE GCC toolchain CI (`riseproject-dev/riscv-gnu-toolchain-ci`) builds a Linux/glibc toolchain and provides a `make check-glibc-linux` test target
4. The RISE Python wheel builder produces riscv64 wheels against `manylinux_2_35` and `manylinux_2_39` glibc ABI tags (83 riscv64 binary wheels as of the available data)

No RISE blog post addresses glibc development or patching as a standalone topic (0 of 27 blog posts found with "glibc" in title or summary).

### 10.3 Key Active Contributors (2024-2025)

| Person | Affiliation | Contribution area |
|---|---|---|
| Peter Bergner | Tenstorrent / IBM | Vector syscall clobbers, memcpy micro-opts reviewer, IFUNC infra |
| Yao Zihong | ISCAS/PLCT | memcpy_noalignment micro-optimizations, RVV memset co-author |
| Pincheng Wang | ISCAS/PLCT | Zbkb `repeat_bytes` |
| Jerry Shih | SiFive | RVV memset co-author |
| Jeff Law | Ventana Micro / RISE WG lead | RVV memset committer |
| Evan Green | Rivos | Alignment-ignorant memcpy, multi-arg IFUNC resolvers |
| Palmer Dabbelt | Rivos | Machine maintainer, alignment-ignorant memcpy |
| Adhemerval Zanella (zatrazz) | Linaro | Atomic cleanup, hwprobe prototype fix, upstream reviewer |
| Mark Harris | (affiliation not confirmed from sources) | `__riscv_hwprobe` prototype correction (BZ #32932) |
| Yangyu Chen, Vivian Wang | (affiliation not confirmed from sources) | IFUNC gp-pointer fix (BZ #32269) |

---

## 11. Known Bugs and Active Issues

### 11.1 Fixed Bugs (historical, for context)

| BZ | Title | Fixed in |
|---|---|---|
| BZ #32932 | `__riscv_hwprobe` wrong prototype (access attribute, `cpu_set_t *` vs `unsigned long *`) | glibc 2.42, May 2025 |
| BZ #32269 | IFUNC resolver cannot access gp pointer -- SIGSEGV on resolvers using global variables | glibc 2.42, Feb 2025 |
| BZ #32228 | `.preinit_array` section lacks pointer-size alignment | glibc 2.41, Oct 2024 |
| BZ #31022 | `feenvupdate` fails to check for `FE_DFL_ENV` | glibc 2.39, Nov 2023 |
| BZ #28703 | Stack not aligned to 128-bit boundary before `_dl_init` | Dec 2021 |
| BZ #28702 | Stack not aligned to 128-bit boundary in `clone` | Dec 2021 |
| BZ #24484 | DL_RO_DYN_SECTION ABI breakage | Jul 2019 |

### 11.2 Open Issues

**Issue 1: RVV memset SIGILL on prctl-disabled vector (no BZ filed)**
- **Severity:** High
- **Introduced:** Dec 19, 2025 (commit [0b8a996](https://github.com/bminor/glibc/commit/0b8a996))
- **Description:** The IFUNC resolver for `memset` checks `RISCV_HWPROBE_IMA_V` at process load time and selects `__memset_vector`. It does not re-check whether RVV has been subsequently disabled via `prctl(PR_RISCV_V_VSTATE_CTRL)`. Any process that disables vector support after startup and then calls `memset` receives SIGILL.
- **Status:** Acknowledged in the commit message verbatim: "the resolver still selects the RVV variant even when the RVV extension is disabled via prctl(). As a consequence, any process that has RVV disabled via prctl() will receive SIGILL when calling memset()." No Bugzilla entry confirmed as of the research data.
- **Mitigation:** Processes that use `prctl()` to disable RVV should not be run against glibc versions containing this commit until the fix lands.

**Issue 2: Missing vector register clobbers for GCC < 15 builds with V extension**
- **Severity:** Low (build-time enforced)
- **Status:** Resolved at the build level by the GCC >= 15 enforcement in `preconfigure.ac` (commit 4797591, Sep 2025). Distributions that backport the clobber fix without the GCC >= 15 guard could reintroduce silent vector register corruption. [NEEDS VERIFICATION: whether any major distribution has done this]

**Issue 3: RVV memcpy absent**
- **Severity:** Performance gap, not correctness
- **Status:** Not filed as a bug; the scalar `__memcpy_noalignment` path is the current "fast" variant. The RISE roadmap from Dec 2024 listed this as the next priority item. No upstream patch has landed as of the available data.

---

## 12. Objections and Upstream Blockers

**No architectural objections** to the RISC-V port exist in the upstream record. The port was accepted cleanly in 2018. The FSF/GNU governance model does not create structural barriers to RISC-V-specific work: RISC-V machine maintainers can approve their own patches within their subsystem, and there is no single corporate gatekeeper.

**Practical friction points:**

1. **Sourceware.org inaccessibility:** Bugzilla, patchwork, gitweb, and mailing list archives are all blocked to programmatic HTTP access via Anubis bot protection. This makes automated tracking of open bugs, pending patches, and mailing list discussion effectively impossible for external tooling. Engineers working in this project must use the mailing list directly.

2. **GCC >= 15 requirement for RVV paths:** Any distribution or toolchain still on GCC 12-14 cannot build the RVV-optimized glibc routines. This affects embedded and older enterprise toolchains.

3. **No upstream riscv64 build CI on sourceware Buildbot:** Regressions in the RISC-V port are not caught by the upstream CI infrastructure. Detection depends on downstream distro builds (Debian, Fedora) and the RISE pre-commit CI (scope unverified).

4. **Single-float ABI (F without D) unsupported:** This is a hard build error. Embedded riscv32 configurations with only the F extension cannot use glibc.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The riscv64 port is functionally complete for standard `rv64gc lp64d` targets. The only functional gap requiring work is the RVV memset prctl SIGILL bug. All other functional components are production-grade.

### 13.2 Performance Optimization

The primary performance gap is the absence of RVV-optimized routines beyond `memset`, and the absence of hand-tuned asm loops for string functions (strcmp, strlen, strchr, memchr, memmove, strncmp). The RISE roadmap identified this gap in Dec 2024. RVV memset landed Dec 2025. RVV memcpy is the most impactful next item.

Data not available: quantitative throughput comparison between riscv64 and arm64 for any string or memory function. No published benchmark numbers exist in accessible sources.

### 13.3 CI/CD Infrastructure

The sourceware Buildbot has riscv64 hardware but no glibc builder. This is the highest-leverage infrastructure gap: catching regressions upstream, before they ship in distributions.

### 13.4 Ecosystem Enablement

Downstream riscv64 deployments must run glibc >= 2.42 to avoid known crash-class bugs (IFUNC gp-pointer, static-PIE, hwprobe prototype). Ubuntu 24.04 ships glibc 2.39, which predates all three of these fixes. This is a deployment risk for riscv64 on Ubuntu 24.04 LTS.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix RVV memset SIGILL on prctl-disabled vector (no BZ filed) | 1-2 | RISC-V machine maintainers | Critical |
| Performance | Implement RVV memcpy (IFUNC-dispatched) | 4-8 | ISCAS/PLCT, SiFive, Tenstorrent (current contributors) | High |
| Performance | Implement RVV strlen, strcmp, strchr, memchr | 6-12 | ISCAS/PLCT, SiFive | High |
| Performance | Implement RVV memmove, strncmp, strnlen | 4-8 | ISCAS/PLCT, SiFive | Medium |
| CI/CD | Add riscv64 glibc builder to sourceware.org Buildbot | 2-4 (infra setup, ongoing maintenance) | Sourceware.org infra + RISC-V contributor | High |
| CI/CD | Document and publish RISE glibc pre-commit CI scope and results | 1 | RISE / Compilers and Toolchains WG | Medium |
| Ecosystem | Backport BZ #32269, BZ #32932, BZ #32228 fixes to Ubuntu 24.04 LTS | 1-2 | Canonical (Ubuntu) | High |
| Performance | Add RVV-optimized libm functions (sinf, cosf, expf, logf for V-capable hardware) | 8-16 | Requires coordination with libm subsystem maintainers | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [bminor/glibc GitHub mirror (archived Feb 2026)](https://github.com/bminor/glibc)
- [glibc upstream homepage](https://www.gnu.org/software/libc/)
- [GNU FTP -- glibc tarballs](https://ftp.gnu.org/gnu/libc/)
- [Commit 0b8a996 -- RVV memset (Dec 2025)](https://github.com/bminor/glibc/commit/0b8a996)
- [Commit 4797591 -- vector registers in __SYSCALL_CLOBBERS (Sep 2025)](https://github.com/bminor/glibc/commit/4797591)
- [Commit 3fd2ff7 -- Fix IFUNC resolver gp pointer, BZ #32269 (Feb 2025)](https://github.com/bminor/glibc/commit/3fd2ff7)
- [Commit 8af8beb -- Correct __riscv_hwprobe prototype, BZ #32932 (May 2025)](https://github.com/bminor/glibc/commit/8af8beb)
- [Commit 720e891 -- Zbkb repeat_bytes optimization (Oct 2025)](https://github.com/bminor/glibc/commit/720e891)
- [Commit 444d812 -- memcpy_noalignment Zca-friendly register allocation (Oct 2025)](https://github.com/bminor/glibc/commit/444d812)
- [Commit 1f5d866 -- Consolidate atomic-machine.h (Sep 2025)](https://github.com/bminor/glibc/commit/1f5d866)
- [Commit 273f803 -- Fix soft-float _FPU_SETCW for GCC 16 (Sep 2025)](https://github.com/bminor/glibc/commit/273f803)
- [Commit 4c966c0 -- Use builtin for ffs/ffsll (Apr 2025)](https://github.com/bminor/glibc/commit/4c966c0)
- [Commit 587a129 -- Alignment-ignorant memcpy (Feb 2024)](https://github.com/bminor/glibc/commit/587a129)
- [Sourceware Buildbot -- glibc builders](https://builder.sourceware.org)
- [Debian buildd tracker -- glibc sid riscv64](https://buildd.debian.org/status/package.php?p=glibc&suite=sid&arch=riscv64)
- [Ubuntu 24.04 -- libc6 riscv64](https://packages.ubuntu.com/noble/riscv64/libc6/download)
- [Arch Linux RISC-V package mirror](https://riscv.mirror.pkgbuild.com)
- [RISE project homepage](https://riseproject.dev)
- [RISE December 2024 End of Year Ecosystem Update](https://riseproject.dev/2024/12/18/rise-2024-end-of-year-ecosystem-update/)
- [RISE RP009 -- LLVM SPEC Optimization (May 2025)](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [riseproject-dev/riscv-gnu-toolchain-ci](https://github.com/riseproject-dev/riscv-gnu-toolchain-ci)