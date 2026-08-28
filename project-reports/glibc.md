---
title: glibc
---

# glibc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-27<br/>
**Scope:** RISC-V (riscv64/linux) support status for glibc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

glibc is the GNU C Library, the standard system C library for Linux. It implements the POSIX/SUS userspace ABI between the Linux kernel and all userspace software: dynamic linking, syscall wrappers, threading (NPTL), locale, math (libm), and the C standard library. Every binary that runs on a GNU/Linux system depends on it, directly or transitively. There is no practical alternative for production riscv64 Linux systems.

**Governance.** glibc is a GNU project under the Free Software Foundation (FSF). It is hosted on sourceware.org, operated by Red Hat. There is no formal steering committee. The project is governed through the [libc-alpha mailing list](https://sourceware.org/pipermail/libc-alpha/) and a rotating release manager. Named port maintainers are tracked in the MAINTAINERS wiki page. Contributions require either a blanket copyright assignment agreement with the FSF or per-employer agreement. The FSF holds copyright.

**Corporate sponsors active on RISC-V.** Based on commit records for the riscv port (2017-2026):

| Organization | RISE membership | Role |
|---|---|---|
| Linaro | Not listed | Largest all-time contributor (Adhemerval Zanella, 52 RISC-V commits) |
| Red Hat | Premier Member | Core maintainers (Joseph Myers, Florian Weimer, Carlos O'Donell) |
| Rivos Inc. | Not listed | Key RISC-V contributors (Palmer Dabbelt, Evan Green) |
| SiFive | Premier Member | Port founders (Palmer Dabbelt, Kito Cheng, Vincent Chen) |
| ISCAS/PLCT Lab | General Member | Active 2025-2026 (Yao Zihong, RVV string routines) |
| Tenstorrent | Not listed (was not listed as RISE member at time of this report) | Active reviewer 2025 (Peter Bergner) |
| SUSE | Not listed | Active (Andreas Schwab, 7 RISC-V commits) |
| Bluespec | Not listed | Named RISC-V port maintainer (Darius Rad, 7 commits) |
| Google | Premier Member | Linker/toolchain (Fangrui Song, 7 commits) |
| Western Digital | Not listed | Former contributor (Alistair Francis, 5 commits) |
| ZTE Corporation | General Member | Active review 2025 (Zheng Ziyang, RVV memcmp/memrchr) |

**Community stance on RISC-V.** The port is mature and unambiguously upstream. New RISC-V extension patches (RVV, Zbb, Zbkb, Zicfilp, Zicfiss) are accepted through the standard mailing-list review process with no reported policy resistance. The bar for new contributions is technical quality: reviewers (notably Jeffrey Law at Qualcomm) push back on microarchitecture-specific tuning before basic correctness is established, and on assembly submissions where C with compiler intrinsics would suffice.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2017-12-27 (authored) / 2018-01-29 (merged) | Initial RISC-V port: ABI implementation, TLS, soft-fp, hard float, atomics, Linux syscall interface, ABI lists. Author: Palmer Dabbelt (SiFive). First release: glibc 2.27 (2018-02-01). | [bminor/glibc commit c776fa11](https://github.com/bminor/glibc/commit/c776fa11) |
| 2023-09-06 | XTheadBb extension string optimization (string-fz[a,i].h). | [commit 3d6fcf1b](https://github.com/bminor/glibc) |
| 2023-12-19 | BZ #31022 fix: feenvupdate missing FE_DFL_ENV check on RISC-V. | bminor/glibc commit 802aef27 |
| 2023-12-30 | BZ #31151 fix: implement dl_runtime_profile (ltrace/profiling support), based on LoongArch port. | bminor/glibc commit 6b326961 |
| 2024-01-22 | Static PIE support for RISC-V. | bminor/glibc commit 6edaa12b |
| 2024-02-05 | Bitmanip Zbb: string-fza.h / string-fzi.h using clz/ctz. | bminor/glibc commit 25788431 |
| 2024-03-01 | Alignment-ignorant memcpy for CPUs with fast unaligned access; hwprobe vDSO call support; multi-arg IFUNC resolvers. | [commits e7919e0d, 78308ce7, 587a1290](https://github.com/bminor/glibc) |
| 2024-10-02 | BZ #32228 fix: .preinit_array not aligned to pointer size. | [commit a36814e1](https://github.com/bminor/glibc/commit/a36814e1455093fc9ebfcdf6ef39bb0cf3d447da) |
| 2025-04-22 | Sync NT_RISCV_TAGGED_ADDR_CTRL from Linux 6.13 to elf.h. | [commit 4e24e4d9](https://github.com/bminor/glibc/commit/4e24e4d936b57f6e7809032f55cc95a4cf4d2396) |
| 2025-05-24 | BZ #32932 fix: __riscv_hwprobe function prototype corrected (wrong access attribute, argument types, __THROW). | [commit 8af8beb1](https://github.com/bminor/glibc/commit/8af8beb1c488dcfec754431c1626979276046545) |
| 2025-06-20 | getrandom vDSO support for RV64 (Linux 6.16+). | [commit fc6f074e](https://github.com/bminor/glibc/commit/fc6f074e0496fb8a8df491641165f4ed3cdaa3a3) |
| 2025-09-03 | Soft-float _FPU_SETCW fixed for GCC 16 warnings. | [commit 273f803](https://github.com/bminor/glibc/commit/273f80374aeb7d746352a098b23d9bb85e908ea8) |
| 2025-09-03 | Vector registers added to __SYSCALL_CLOBBERS; GCC 15 + RVV 1.0 enforced at configure time. | [commit 47975914](https://github.com/bminor/glibc/commit/47975914fb106b83c42bc0baf6435a0944a23d30) |
| 2025-10-31 | Zbkb-optimized repeat_bytes helper (packh/packw/pack). | [commit 720e8916](https://github.com/bminor/glibc/commit/720e89163702ffa1e921d926b6c36b53c3ccbee4) |
| 2025-12-19 | RVV-optimized memset with IFUNC dispatch (first vectorized string function merged). | [commit 0b8a996f](https://github.com/bminor/glibc/commit/0b8a996f44b5f4c02991f02cd12bf05b17db4576) |

The RISC-V port is fully upstream. No downstream fork carries significant riscv64-specific patches that have not been submitted to libc-alpha.

---

## 3. Upstream Support Tier

glibc does not have a formal tier policy (unlike GCC). Port status is governed by the MAINTAINERS wiki page, not a documented tier matrix. The practical tier for a port is determined by: named maintainers, CI coverage, and whether the port is included in official releases.

**Named RISC-V maintainers (from MAINTAINERS wiki):** Darius Rad (Bluespec). Palmer Dabbelt (Rivos) and Adhemerval Zanella (Linaro) are the dominant historical contributors but are not listed in the official maintainers file as of available data [NEEDS VERIFICATION - direct MAINTAINERS file fetch was not possible due to sourceware.org Anubis protection].

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Named upstream maintainer | Yes | Yes | Yes (Darius Rad) |
| CI - build | Yes (multiple builders) | Yes (multiple builders) | Yes (2 builders, both currently offline) |
| CI - test execution | Yes | Yes | No (build-only in build-many-glibcs.py) |
| Passes full test suite in CI | Yes | Yes | No confirmed passing run; all recent builds failed |
| Included in glibc releases | Yes | Yes | Yes (since glibc 2.27) |
| Debian official port | Yes | Yes | Yes |
| Ubuntu official port | Yes | Yes | Yes |

The riscv64 port receives first-class treatment in releases and package distributions. The CI situation is materially weaker than amd64/arm64: both Buildbot builders are offline as of 2026 and all recent runs failed.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

glibc's architecture-specific code lives in `sysdeps/riscv/`, `sysdeps/riscv/rv64/`, `sysdeps/unix/sysv/linux/riscv/`, and related subdirectories. The following table covers all mandatory and significant optional subsystems.

| Subsystem | amd64 | arm64 | riscv64 | ISA extensions used | Quality |
|---|---|---|---|---|---|
| ELF entry point (start.S) | Full | Full | Full | Base ISA (gp init via lla) | Hand-written asm |
| Dynamic linker (dl-machine.h) | Full | Full | Full | Base ISA | Hand-written asm + inline asm |
| PLT trampoline (_dl_runtime_resolve) | Full | Full | Full | Base ISA | Hand-written asm |
| PLT profiling trampoline (_dl_runtime_profile) | Full | Full | Full | Base ISA | Hand-written asm |
| setjmp / longjmp | Full | Full | Full | Base ISA + F/D extensions | Hand-written asm |
| clone / vfork | Full | Full | Full | Base ISA | Hand-written asm |
| getcontext / setcontext / swapcontext | Full | Full | Full | Base ISA | Hand-written asm |
| TLS (NPTL) | Full | Full | Full | Base ISA (tp register) | C + headers |
| Inline syscall macros | Full | Full | Full | Base ISA; V clobbers when RVV enabled | C macros with inline asm |
| Atomics (atomic-machine.h) | Full | Full | Full | A extension (AMOs); pause hint | C macros with inline asm |
| FP environment (fenv.h) | Full | Full | Full | F/D extensions | C |
| Single-precision libm (32 functions) | Full | Full | Full | F extension | C using compiler builtins |
| Double-precision libm | Full | Full | Full | D extension | C using compiler builtins |
| ffs / ffsll | Full | Full | Full | Zbb or XTheadBb (ctz instructions) | Compiler builtin |
| hwprobe vDSO | N/A | N/A | Full (RV64); absent (RV32) | Base ISA | C |
| getrandom vDSO | Full | Full | Full (RV64, Linux 6.16+) | Base ISA | C |
| memset (scalar) | Full | Full | Full | Base ISA | Hand-written asm |
| memset (vector) | Full (SSE2/AVX) | Full (SVE/ASIMD) | Full (RVV, merged Dec 2025) | V extension, LMUL=m8 | Hand-written asm |
| memcpy (scalar) | Full | Full | Full (unaligned-fast path via hwprobe) | Base ISA + Zca | Hand-written asm |
| memcpy (vector) | Full | Full | Missing (under review, v5) | V extension | Not merged |
| memmove (vector) | Full | Full | Missing (under review, v5) | V extension | Not merged |
| strcmp / strlen / strchr / etc. (vector) | Full | Full | Missing (under review, v5) | V extension | Not merged |
| string byte-broadcast (repeat_bytes) | Full | Full | Full (Zbkb: packh/packw/pack) | Zbkb extension | Inline asm |
| libmvec (vectorized math) | Full (AVX2/AVX512) | Full (SVE) | Missing (RFC stage, Feb 2026) | V + D extensions | Not merged |
| Static PIE | Full | Full | Full | Base ISA | C + configure probes |
| Control Flow Integrity | Full (CET) | Full (BTI/PAC) | Missing (under review, v3) | Zicfilp / Zicfiss | Not merged |
| IFUNC dispatch framework | Full | Full | Full | Base ISA + hwprobe | C |
| Shadow stack (setjmp/longjmp extension) | Full (CET) | Full (GCS) | Missing (under review) | Zicfiss | Not merged |

**IFUNC dispatch detail.** The RISC-V IFUNC framework uses `riscv_hwprobe()` (itself vDSO-accelerated) to query `RISCV_HWPROBE_KEY_IMA_EXT_0` at startup. Currently, this selects between `__memset_vector` (RVV) and `__memset_generic` for memset, and between `__memcpy_noalignment` (fast scalar) and `__memcpy_generic` for memcpy. The 18-routine RVV suite pending in v5 will extend this to all major string/memory functions.

**Known limitation in merged RVV memset.** The IFUNC resolver does not check for RVV disabled via `prctl(PR_RISCV_V_VSTATE_CTRL_OFF)`. A process that disables RVV after startup and then calls `memset()` will receive SIGILL. This is documented in the commit message as a known limitation at the time of merge. No fix has been submitted as of Feb 2026.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** glibc uses GNU autoconf/make. It does not use CMake. All builds must be out-of-tree.

**Canonical cross-build command for riscv64:**

```bash
mkdir build && cd build
../glibc/configure \
  --prefix=/usr \
  --host=riscv64-linux-gnu \
  --build=$(gcc -dumpmachine) \
  CC=riscv64-linux-gnu-gcc \
  CXX=riscv64-linux-gnu-g++ \
  --with-headers=/path/to/linux/include \
  --enable-kernel=5.15 \
  CFLAGS="-O2 -g"
```

The GCC cross-compiler itself must be configured with `--with-arch=rv64imafdc --with-abi=lp64d --disable-multilib` (or the appropriate variant). glibc's configure derives the target ABI from compiler-predefined macros (`__riscv_xlen`, `__riscv_flen`, `__riscv_float_abi_*`).

**Three CI build configurations** from `scripts/build-many-glibcs.py`:

| Config name | --with-arch | --with-abi |
|---|---|---|
| riscv64-linux-gnu-rv64imac-lp64 | rv64imac | lp64 (soft-float) |
| riscv64-linux-gnu-rv64imafdc-lp64 | rv64imafdc | lp64 (soft-float ABI, hard-float registers unused) |
| riscv64-linux-gnu-rv64imafdc-lp64d | rv64imafdc | lp64d (double-float ABI) |

These are build-only (no test execution in the script).

**Required toolchain versions with rationale:**

| Dependency | Minimum | Reason |
|---|---|---|
| GCC | 12.1 | Enforced at configure time via preprocessor check in configure.ac |
| GCC | 15.0 | Required when building with RVV (-march=...v*); enforced in sysdeps/riscv/preconfigure.ac |
| Clang | 18.0 | Alternative to GCC; same configure-time enforcement |
| binutils | 2.39 | R_RISCV_ALIGN and R_RISCV_RELATIVE required; configure probe in sysdeps/riscv/configure.ac |
| binutils | 2.45 | SFrame support; optional |
| Linux kernel headers | 3.2 | --with-headers minimum |
| Python | 3.4 | Test infrastructure scripts |
| GNU make | 4.0 | Build orchestration |
| GNU awk (gawk) | 3.1.2 + MPFR | Test harness |
| GNU bison | 2.7 | Parser generation |

**ABI constraints enforced at configure time.** glibc will abort configure if:
- F extension present but D absent (F-only not supported)
- Single-float ABI (ilp32f or lp64f) is requested
- A extension (atomics) is absent

**Linker relaxation fallback.** If the static linker does not support `R_RISCV_ALIGN` (detected at configure time via `libc_cv_riscv_r_align`), glibc automatically injects `-Wa,-mno-relax` and `-mno-relax` for all riscv objects. This is automatic and not user-controlled.

**GCC 16 compatibility.** A soft-float `_FPU_SETCW` macro generated a set-but-not-used warning under GCC 16. Fixed in glibc Sept 2025 (commit 273f803). No other GCC 16 issues are known.

**QEMU.** There is no Dockerfile or QEMU wrapper in the glibc source tree. `scripts/build-many-glibcs.py` defines build-only configurations with no QEMU test_wrapper. For running tests on a remote target or under QEMU:

```bash
# SSH to real hardware
make test-wrapper='scripts/cross-test-ssh.sh user@riscv64-host' tests

# QEMU user mode (community practice, not in-tree)
make test-wrapper='qemu-riscv64 -L /path/to/riscv64-sysroot' tests
```

Use `--with-timeoutfactor=NUM` to extend test timeouts for emulation.

**Kernel header installation for riscv64:**

```bash
make -C linux-src headers_install ARCH=riscv INSTALL_HDR_PATH=/sysroot/usr
```

Both riscv32 and riscv64 map to Linux arch `riscv` in build-many-glibcs.py.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps** (riscv64 cannot do X at all):

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Control Flow Integrity (CFI) | Yes (CET: IBT + SHSTK) | Yes (BTI + PAC) | No | 38-file patch series v3 under review Dec 2025; not merged. The shadow stack (SSP) append to jmp_buf is an ABI change. |
| libmvec (vectorized math) | Yes (AVX2/AVX512) | Yes (SVE) | No | RFC patch posted Feb 2026 for log/logf using RVV. Integration approach not yet approved. Licensing question raised (veclibm derivation). |
| getrandom vDSO (RV32) | N/A | N/A | No | Only RV64 gets vDSO path. RV32 falls back to syscall. |
| F-only ABI (no D extension) | N/A | N/A | No | configure aborts; documented limitation. |

**Performance gaps** (feature exists but no vectorized implementation):

| Function(s) | amd64 | arm64 | riscv64 | RVV patch status |
|---|---|---|---|---|
| memcpy, memmove | Vectorized | SVE | Scalar only (aligned-fast path) | Under review, v5 (Feb 2026) |
| memchr, memcmp, memcmpeq, memccpy, memrchr | Vectorized | SVE | Scalar only | Under review, v5 (Feb 2026) |
| strcmp, strcpy, strlen, strncmp, strnlen | Vectorized | SVE | Scalar only | Under review, v5 (Feb 2026) |
| strcat, strchr, stpncpy, strncat, strncpy, strrchr | Vectorized | SVE | Scalar only | Under review, v5 (Feb 2026) |
| log, logf (libmvec) | Vectorized | SVE | Missing | RFC, Feb 2026; not merged |
| atan2f (spec2017 WRF) | Vectorized | Vectorized | Not optimized | RISE issue #66: RISC-V has no scalar reciprocal estimator; vector unit path adds overhead |

Published performance figures for the pending RVV string suite (from v5 patch series, measured on SpacemiT X60):

| Routine | RVV speedup vs scalar (SpacemiT X60) |
|---|---|
| memccpy | ~49% time reduction |
| memrchr | ~58% time reduction |
| strrchr | ~39% time reduction |
| stpncpy | ~11% time reduction |

Published performance figures for standalone RVV memcmp patches (Dec 2025):

| Platform | RVV vs __memcmp_generic speedup |
|---|---|
| XuanTie C920 (VLENB=128) | +54.6% |
| SpacemiT X60 (VLENB=256) | +44.8% |

No performance benchmark figures comparing riscv64 against amd64 or arm64 for any glibc function were found in any public source.

**Floating-point correctness.** BZ #31022 (feenvupdate missing FE_DFL_ENV guard) was fixed in 2023. The soft-float nofpu test ULPs were updated in Jan 2025. No current open floating-point correctness bugs are documented (Bugzilla was inaccessible; bugs referenced are from commit messages only).

**prctl/RVV interaction (open correctness bug).** The merged RVV memset resolver selects the vector path based on hwprobe without checking prctl-disabled RVV state. A process that calls `prctl(PR_RISCV_V_VSTATE_CTRL_OFF)` after startup and then calls `memset()` will receive SIGILL. This is present in glibc master since Dec 2025.

---

## 7. CI/CD Infrastructure

**Sourceware Buildbot builders for glibc riscv64:**

| Builder | ID | Current status | Last successful build | Recent builds |
|---|---|---|---|---|
| glibc-ubuntu-riscv | 293 | Offline (masterids: []) | Not observed | Last 5 builds: all FAILURE (result=2); last run Jan 28-30, 2025 |
| glibc-fedora-riscv | 336 | Offline (masterids: []) | Not observed | Last 5 builds: all FAILURE (result=2); last run Jun 10, 2025 |

Both builders are confirmed offline as of August 2026 via direct Buildbot API query. Neither builder has produced a passing build in all observed recent history. `glibc-ubuntu-riscv` has been offline for over 18 months; `glibc-fedora-riscv` for over 14 months.

**RISE CI.** RISE's Dec 2024 end-of-year update listed glibc as one of seven projects running pre-commit CI on the RISE build farm. The gcc-postcommit-ci fork in the riseproject-dev GitHub org includes a `make check-glibc-linux` target. No public dashboard URL for RISE's glibc CI results was found. [NEEDS VERIFICATION - RISE CI configuration details are not publicly documented]

**CI configuration in source tree.** There is no `.gitlab-ci.yml`, `.github/workflows/`, Jenkinsfile, or Buildbot config file in the glibc source tree. The CI is entirely external to the repository.

**Test execution.** The in-tree `scripts/build-many-glibcs.py` performs cross-compilation only for riscv64 - no test execution. No QEMU test_wrapper is configured for any riscv target in that script.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Buildbot builders | Multiple, active | Multiple, active | 2 builders, both offline since mid-2025 |
| Build CI | Yes | Yes | Broken (offline) |
| Test CI | Yes | Yes | No (build-only in script; Buildbot offline) |
| RISE pre-commit CI | Not applicable | Not applicable | Yes (listed Dec 2024) [NEEDS VERIFICATION] |
| In-tree CI config | No (external Buildbot) | No (external Buildbot) | No |

---

## 8. Distribution and Release Status

**Upstream release channel.** glibc distributes source tarballs only (ftp.gnu.org/gnu/glibc/). Current release: glibc 2.44, released 2026-07-24. No binary packages are distributed upstream.

**Commits pending release.** The following riscv64 commits are on master but not yet in a numbered release as of the bminor/glibc mirror (last tag: glibc-2.42, 2025-07-28):
- RVV memset (commit 0b8a996f, Dec 2025)
- Vector register clobbers in __SYSCALL_CLOBBERS (commit 47975914, Sep 2025)
- Zbkb repeat_bytes (commit 720e8916, Oct 2025)
- Soft-float GCC 16 fix (commit 273f803, Sep 2025)
- Atomic-machine.h consolidation (commit 1f5d8663, Sep 2025)

These will ship in glibc 2.43 when tagged.

**Distribution packages:**

| Distribution | Package | Version | riscv64 status |
|---|---|---|---|
| Debian sid | libc6 | 2.43-4 | Official port, installed. Built by buildd machine rv-manda-01. Migration to testing blocked (policy violation affecting all architectures). |
| Ubuntu Noble (24.04) | libc6 | 2.39-0ubuntu8 | Official port, available. |
| Arch Linux RISC-V | glibc | 2.44+r24+g16be1518495f-1.1 | Available in [core] repository as riscv64.pkg.tar.zst. |
| Fedora | glibc | 2.44 | Available for riscv64 in rawhide [NEEDS VERIFICATION - confirmed by commit activity and architecture inclusion, not direct package page fetch]. |

**PyPI.** The `glibc` PyPI package (version 0.6.1) is a pure-Python version-detection shim, not the C library. It ships as `py2.py3-none-any` and is not relevant to riscv64 binary distribution.

**What a user must do to get a working binary.** On Debian, Ubuntu, and Arch Linux RISC-V, glibc for riscv64 installs as a standard distribution package with no extra steps. For cross-compilation, the user must build a cross-toolchain (GCC 12.1+ minimum, GCC 15+ for RVV) targeting riscv64-linux-gnu, then configure glibc with `--host=riscv64-linux-gnu` and appropriate kernel headers.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| GCC 12.1+ | Primary compiler | Available | N/A | Released | GCC 15+ required for RVV; soft-float GCC 16 issue fixed |
| GNU binutils 2.39+ | Assembler, linker | Available | N/A | Released | R_RISCV_ALIGN and R_RISCV_RELATIVE required for static PIE |
| Linux kernel headers 3.2+ | Syscall ABI | Available | N/A | Current kernels | Both riscv32/riscv64 map to ARCH=riscv |
| Python 3.4+ | Test harness scripts | Available | Tests pass | 3.13.x ships for riscv64 | See project-reports/python.md |
| GDB 7.8+ | Test pretty-printers | Built for riscv64 | Known issues | Ships riscv64 support | See project-reports/gdb.md |
| elfutils | Test/debug (eu-readelf in static PIE probe) | Available | Tests pass | Available | See project-reports/elfutils.md |
| libffi | Runtime dep for Python (test scripts) | Full riscv64 support | Tests pass | Released | See project-reports/libffi.md |
| zlib | Optional (memusagestat via libgd) | Available | Tests pass | Released | See project-reports/zlib.md |
| libpng | Optional (memusagestat via libgd) | Available | Tests pass | Released | See project-reports/libpng.md |
| libcap | Optional (nscd SELinux capability support) | Available | Tests pass | Released | See project-reports/libcap.md |
| libselinux | Optional (nscd SELinux) | Available | Tests pass | Released | Not in project-reports/scope.yml |
| libaudit | Optional (nscd SELinux audit) | Available | Tests pass | Released | Not in project-reports/scope.yml |
| GNU make 4.0+ | Build system | Available | N/A | Released | Not in project-reports/scope.yml |
| GNU awk 3.1.2+ | Build scripts | Available | N/A | Released | Not in project-reports/scope.yml |
| GNU bison 2.7+ | Parser generation | Available | N/A | Released | Not in project-reports/scope.yml |

No blocking dependency issues for riscv64 are known. The GCC 15 requirement for RVV is the most consequential version constraint; distributions that ship GCC 14 or earlier cannot enable the RVV memset IFUNC path.

---

## 11. Known Bugs and Active Issues

**Closed correctness bugs:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| BZ #32932 | __riscv_hwprobe function prototype wrong (access attr, arg types, __THROW) | Fixed glibc 2.42 | Medium | False -Wstringop-overread warnings; backward compat via transparent union |
| BZ #32228 | .preinit_array not aligned to pointer size | Fixed glibc 2.41 | Low | Section contains function pointers; alignment was wrong |
| BZ #31022 | feenvupdate missing FE_DFL_ENV check | Fixed 2023 | Medium | Incorrect FP environment handling |
| BZ #31151 | No dl_runtime_profile support | Fixed 2023 | Low | Blocked ltrace/profiling tools |
| (no BZ) | Vector registers omitted from __SYSCALL_CLOBBERS | Fixed Sep 2025 | Critical | Silent data corruption possible in any code with live vector data across a syscall; required GCC 15+; affected all glibc built with RVV |
| BZ #32269 / BZ #31317 | IFUNC resolver cannot access gp pointer | Fixed Feb 2025 | High | SIGSEGV in IFUNC resolver for PIE objects; gp pointer computed with unrelocated address |

**Open correctness bugs:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| (no BZ) | RVV memset IFUNC selects vector path when RVV disabled via prctl | Open as of Feb 2026 | High | Process that calls prctl(PR_RISCV_V_VSTATE_CTRL_OFF) then memset() receives SIGILL; noted in merge commit 0b8a996f |

**Active patch series not yet merged:**

| Series | Author | Status | Scale | Notes |
|---|---|---|---|---|
| "[PATCH v5 00/18] riscv: Add RVV str*/mem* routines" | Yao Zihong (ISCAS/PLCT) | Under review, Feb 2026 | 75 files, 3328 lines | Covers memccpy, memchr, memcmp, memcmpeq, memcpy, memmove, memrchr, stpncpy, strcat, strchr, strcmp, strcpy, strlen, strncat, strncmp, strncpy, strnlen, strrchr |
| "[PATCH 00/12 -> v3 00/16] Support RISC-V Control Flow Integrity" | Jesse Huang (SiFive) | Under review, v3 Dec 2025 | 38 files, ~1336 lines | Zicfilp + Zicfiss; SSP in jmp_buf is ABI change; ucontext shadow stack described as "UNSAFE workaround" |
| "[RFC PATCH 0/5] riscv: Add libmvec routines" | Yao Zihong (ISCAS/PLCT) | RFC, Feb 2026 | 23 files, ~1765 lines | Initial RVV log/logf; licensing question (veclibm derivation); integration approach not yet approved |
| "[PATCH v3] RISC-V: Fix IFUNC resolver cannot access gp pointer" | Yangyu Chen | Under discussion, Jan 2025 | Small | Related to BZ #31317 / #32269 fix; edge case residual |
| "[PATCH v2] riscv: Use RISCV_HWPROBE_KEY_MISALIGNED_SCALAR_PERF" | Charlie Jenkins | Under review, May 2025 | Small | Better hwprobe key for misaligned access performance detection |
| "[RFC PATCH 0/1] riscv: Add Zilsd extension support for setjmp/longjmp on RV32" | Pincheng Wang | RFC, Jan 2026 | Small | RV32 only; Zilsd 64-bit load/store in setjmp |

---

## 12. Objections and Upstream Blockers

**Objections to the RVV string suite.** Earlier upstream review cycles for assembly string routines indicated a preference for simpler implementations before microarchitecture-tuned versions. Jeffrey Law (Qualcomm) explicitly requested a "dead-simple vector implementation" before tuning; he provided a reference loop as guidance. This is a process expectation, not a hard blocker. v5 of the 18-routine suite addresses prior review feedback.

**CFI ABI change.** Appending the shadow stack pointer (SSP) to `struct __jmp_buf_internal_tag` is a binary ABI change. This requires coordination with distributors and has been a recurring concern on libc-alpha for all architectures adding CFI. The ucontext shadow stack management is explicitly described by the patch author as "UNSAFE" in v3. These are concrete technical objections that must be resolved before merge.

**libmvec integration approach.** The RFC explicitly asks whether the integration approach is acceptable before investing in the full implementation. Licensing uncertainty (veclibm derivation) is a concrete blocker that requires legal clearance or a clean-room reimplementation.

**prctl/RVV memset bug.** The open SIGILL bug in merged RVV memset (prctl-disabled RVV) needs a fix before the 18-routine suite can safely extend the same IFUNC pattern to additional functions. A process that opts out of vector execution should not receive SIGILL from the C library.

**Sourceware Buildbot CI.** Both riscv64 builders are offline and have been failing. Without working CI, regressions are not detected between the time a patch is submitted and the time it lands. The absence of QEMU-based test execution in the canonical build script means there is no automated correctness gate for riscv64.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

**Control Flow Integrity (Zicfilp + Zicfiss).** A 38-file patch series (v3) is under review. The open issues are: (a) the ucontext SSP management is unsafe, (b) the jmp_buf ABI change needs distributor coordination, (c) test coverage for the full interaction with signals and setjmp/longjmp is incomplete per review feedback. RISE compilers WG issue #5 tracks this. SiFive (Jesse Huang) is the primary author. A Qualcomm engineer with glibc review experience accelerating this to merge is the clearest investment leverage point. Estimated effort: 3-5 person-weeks to bring v3 to merge-quality, assuming the ABI change is accepted upstream. The ABI question has no engineering resolution - it requires community consensus.

**RVV IFUNC prctl bug fix.** The open SIGILL bug in the merged RVV memset (prctl-disabled RVV not checked in resolver) is a correctness issue that blocks safe extension to other string functions. Fix effort: 1-2 person-weeks including upstream review cycle.

**libmvec RVV (log/logf and beyond).** The RFC is at an early stage with unresolved integration and licensing questions. Log and logf are the initial scope; a full libmvec (sin, cos, exp, etc.) implementation is multiple person-months. The atan2f spec2017/WRF case (RISE issue #66) is specifically noted as harder on RISC-V because the ISA has no scalar reciprocal estimator, requiring a vector unit trip and FP unit transfer. An investment here is a multi-quarter effort with unclear upstream acceptance timeline given the RFC status.

### 13.2 Performance Optimization

**RVV str*/mem* 18-routine suite.** v5 (Feb 2026) is in active review. Performance gains are documented: memcmp +54% on C920, +45% on SpacemiT X60; memccpy -49% time on SpacemiT X60. The primary bottleneck is reviewer bandwidth on libc-alpha. Assigning a Qualcomm engineer to drive review cycles and address feedback would be the highest-leverage action. Estimated effort to merge: 2-4 person-weeks of reviewer/author iteration, assuming no fundamental technical objections arise. The work is substantially done; it is in the review queue.

**hwprobe misaligned scalar perf key (RISCV_HWPROBE_KEY_MISALIGNED_SCALAR_PERF).** Small patch under review (May 2025). Affects memcpy path selection. Low effort, high correctness value.

### 13.3 CI/CD Infrastructure

Both sourceware.org riscv64 Buildbot builders are offline and all recent builds failed. There is no QEMU-based test execution for riscv64 in the canonical CI. This means riscv64 regressions are not detected until a distribution ships the release.

Required work: (a) restore and stabilize the Fedora and Ubuntu riscv64 Buildbot builders on sourceware.org infrastructure, (b) add QEMU user-mode test execution to at least one builder configuration, (c) investigate and fix the underlying test failures that caused the builders to go offline. Estimated effort: 3-6 person-weeks including coordination with Red Hat/sourceware.org infrastructure team.

RISE pre-commit CI is listed as covering glibc but no public dashboard or configuration details are available. This should be assessed before investing in new CI infrastructure to avoid duplication.

### 13.4 Ecosystem Enablement

Not applicable. glibc is a system library. It has no dependent package ecosystem in the sense of Python packages, npm packages, or Maven JARs that separately require riscv64 enablement. glibc itself is a prerequisite for nearly every other software package on Linux, so its correctness and performance directly affect the entire ecosystem, but there is no ecosystem section warranted here.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix prctl/RVV SIGILL in memset IFUNC resolver | 1-2 | PLCT/ISCAS or Qualcomm | Critical |
| Performance | Drive RVV str*/mem* 18-routine suite (v5) to merge | 2-4 | Qualcomm reviewer + PLCT author | High |
| CI/CD | Restore riscv64 Buildbot builders on sourceware.org; fix failing tests | 3-6 | Red Hat / Qualcomm infra | High |
| CI/CD | Add QEMU test execution to at least one riscv64 CI builder | 2-4 | Red Hat / Qualcomm infra | High |
| Functional | Complete RISC-V CFI (Zicfilp+Zicfiss) - resolve ucontext safety and ABI questions | 3-5 | SiFive + community consensus | Medium |
| Performance | hwprobe misaligned scalar perf key (small patch, under review) | 0.5 | Qualcomm reviewer | Medium |
| Performance | libmvec RVV initial (log/logf) - resolve licensing, integration approach, implement | 8-16 | PLCT/ISCAS + Qualcomm | Low |

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [bminor/glibc GitHub mirror (read-only, sourceware.org/git/glibc.git)](https://github.com/bminor/glibc)
- [commit 0b8a996f: riscv: Add RVV memset for both multiarch and non-multiarch builds](https://github.com/bminor/glibc/commit/0b8a996f44b5f4c02991f02cd12bf05b17db4576)
- [commit 47975914: riscv: Add vector registers to __SYSCALL_CLOBBERS](https://github.com/bminor/glibc/commit/47975914fb106b83c42bc0baf6435a0944a23d30)
- [commit fc6f074e: riscv: linux: Add support for getrandom vDSO](https://github.com/bminor/glibc/commit/fc6f074e0496fb8a8df491641165f4ed3cdaa3a3)
- [commit 8af8beb1: riscv: Correct __riscv_hwprobe function prototype BZ #32932](https://github.com/bminor/glibc/commit/8af8beb1c488dcfec754431c1626979276046545)
- [commit 720e8916: riscv: Add Zbkb optimized repeat_bytes helper](https://github.com/bminor/glibc/commit/720e89163702ffa1e921d926b6c36b53c3ccbee4)
- [commit a36814e1: riscv: align .preinit_array (bug 32228)](https://github.com/bminor/glibc/commit/a36814e1455093fc9ebfcdf6ef39bb0cf3d447da)
- [commit 4e24e4d9: Add NT_RISCV_TAGGED_ADDR_CTRL from Linux 6.13 to elf.h](https://github.com/bminor/glibc/commit/4e24e4d936b57f6e7809032f55cc95a4cf4d2396)
- [commit 273f8037: Fix RISC-V soft-float _FPU_SETCW for GCC 16 warnings](https://github.com/bminor/glibc/commit/273f80374aeb7d746352a098b23d9bb85e908ea8)
- [libc-alpha: [PATCH v5 00/18] riscv: Add RVV str*/mem* routines (Feb 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174800.html)
- [libc-alpha: [PATCH 00/12] Support RISC-V Control Flow Integrity v1 (Jun 2025)](https://sourceware.org/pipermail/libc-alpha/2025-June/167831.html)
- [libc-alpha: [RFC PATCH 0/5] riscv: Add libmvec routines (Feb 2026)](https://sourceware.org/pipermail/libc-alpha/2026-February/174950.html)
- [libc-alpha: [PATCH v2] RISC-V: Add vector registers to __SYSCALL_CLOBBERS (Sep 2025)](https://sourceware.org/pipermail/libc-alpha/2025-September/169804.html)
- [libc-alpha: [PATCH v3] riscv: Correct __riscv_hwprobe function prototype (Jun 2025)](https://sourceware.org/pipermail/libc-alpha/2025-June/167557.html)
- [libc-alpha: [PATCH RFC v2] RISCV: insert zimop instruction at the start (Jun 2025)](https://sourceware.org/pipermail/libc-alpha/2025-June/167600.html)
- [libc-alpha: [PATCH v3] RISC-V: Fix IFUNC resolver cannot access gp pointer (Jan 2025)](https://sourceware.org/pipermail/libc-alpha/2025-January/163560.html)
- [libc-alpha: [RFC PATCH 0/1] riscv: Add Zilsd extension support for setjmp/longjmp on RV32 (Jan 2026)](https://sourceware.org/pipermail/libc-alpha/2026-January/174323.html)
- [sourceware.org Buildbot API - glibc-ubuntu-riscv builder 293](https://builder.sourceware.org/buildbot/api/v2/builders/293)
- [sourceware.org Buildbot API - glibc-fedora-riscv builder 336](https://builder.sourceware.org/buildbot/api/v2/builders/336)
- [Debian package tracker: glibc](https://tracker.debian.org/pkg/glibc)
- [Debian libc6 sid package page](https://packages.debian.org/sid/libc6)
- [Debian buildd status for glibc/riscv64](https://buildd.debian.org/status/package.php?p=glibc&suite=sid)
- [Ubuntu Noble packages: glibc-tools (riscv64)](https://packages.ubuntu.com/search?keywords=glibc&suite=noble&searchon=names&section=all)
- [Arch Linux RISC-V port - core repository](https://archriscv.felixc.at/)
- [GNU FTP: glibc releases](https://ftp.gnu.org/gnu/glibc/)
- [RISE Project Dec 2024 end-of-year ecosystem update](https://riseproject.dev/2024/12/18/rise-2024-end-of-year-ecosystem-update/)
- [RISE compilers-and-toolchains-wg issue #47: mem* and str* in glibc implementation](https://github.com/riseproject-dev/compilers-and-toolchains-wg/issues/47)
- [RISE compilers-and-toolchains-wg issue #23: mem* and str* inline expansion in GCC](https://github.com/riseproject-dev/compilers-and-toolchains-wg/issues/23)
- [RISE compilers-and-toolchains-wg issue #66: Improve performance of WRF benchmark (atan2f)](https://github.com/riseproject-dev/compilers-and-toolchains-wg/issues/66)
- [RISE system-libraries-wg issue #2: glibc](https://github.com/riseproject-dev/system-libraries-wg/issues/2)
- [riseproject-dev/gcc-postcommit-ci (includes check-glibc-linux target)](https://github.com/riseproject-dev/gcc-postcommit-ci)
- [RISE Python wheel builder (manylinux riscv64 wheels)](https://riseproject.gitlab.io/python/wheel_builder/)
- [bminor/glibc sysdeps/riscv directory tree](https://github.com/bminor/glibc/tree/master/sysdeps/riscv)
- [bminor/glibc scripts/build-many-glibcs.py](https://raw.githubusercontent.com/bminor/glibc/master/scripts/build-many-glibcs.py)