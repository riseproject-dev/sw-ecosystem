---
title: Bionic
parent: Project Reports
categories:
  - libraries
  - android
---

# Bionic

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Android Bionic<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Android Bionic is the C library, math library, and dynamic linker shipped with Android. It replaces glibc and provides the ABI foundation for all native Android code. The project is hosted exclusively on Google infrastructure at [android.googlesource.com/platform/bionic](https://android.googlesource.com/platform/bionic) and is governed entirely by Google. All OWNERS-file entries are Google employees. There is no independent foundation, technical steering committee, or external maintainer with commit authority.

License: BSD 2-clause for core AOSP-authored files. BSD 3-clause for SiFive-authored RISC-V string assembly (`memcpy.S` and related). Upstream-ported BSD components (FreeBSD, OpenBSD, NetBSD) carry their original 2- or 3-clause BSD licenses. There is no Apache 2.0 umbrella for this library.

The dominant maintainer is Elliott Hughes (enh@google.com, Google). Additional OWNERS are Christopher Ferris, Dan Albert, Ryan Prichard, and three other Google employees. All external contributions require Code-Review+2 from a listed Google owner before submission.

---

## 2. Port History and Upstreaming Timeline

The riscv64 port originated with a monolithic RFC submitted by a team from Alibaba ([Change #2142912](https://android-review.googlesource.com/c/platform/bionic/+/2142912), filed 2022-06-30, 85+ patch sets, abandoned 2022-11-30). Elliott Hughes declined to merge it as a single patch due to binary blob policy and code style, and instead broke it into individually reviewable changes starting October 2022.

The original RFC carries Signed-off-by credits from: Mao Han, Xia Lifang, Chen Guoyin, Wang Chen, and Lu Xufan (all Alibaba). The split changes preserve these SOB chains. The Alibaba team expressed concern in the RFC review thread that attribution be preserved; Elliott Hughes acknowledged this and kept SOB chains in all derived commits.

**Foundation phase (Oct-Nov 2022):**

| Change | Title | Merged |
|---|---|---|
| [2237209](https://android-review.googlesource.com/c/platform/bionic/+/2237209) | Add riscv64 to the list of uapi architectures | 2022-09-30 |
| [2239865](https://android-review.googlesource.com/c/platform/bionic/+/2239865) | Initial import of the risc-v uapi headers | 2022-10-01 |
| [2240295](https://android-review.googlesource.com/c/platform/bionic/+/2240295) | Add riscv64 to the map files | 2022-10-04 |
| [2245796](https://android-review.googlesource.com/c/platform/bionic/+/2245796) | riscv64 syscall stub and seccomp filter generation | 2022-10-14 |
| [2246833](https://android-review.googlesource.com/c/platform/bionic/+/2246833) | riscv64 TLS support | 2022-10-12 |
| [2254947](https://android-review.googlesource.com/c/platform/bionic/+/2254947) | riscv64: add bionic assembler and string functions | 2022-10-15 |
| [2256273](https://android-review.googlesource.com/c/platform/bionic/+/2256273) | riscv64: fenv implementation | 2022-10-15 |
| [2258484](https://android-review.googlesource.com/c/platform/bionic/+/2258484) | riscv64 setjmp | 2022-10-18 |
| [2264528](https://android-review.googlesource.com/c/platform/bionic/+/2264528) | riscv64: build the linker | 2022-10-22 |
| [2298684](https://android-review.googlesource.com/c/platform/bionic/+/2298684) | Add a hack for a RISC-V bug (frame pointer ABI) | 2022-11-11 |

**Hardening and optimization phase (2023):**

| Change | Title | Merged |
|---|---|---|
| [2427910](https://android-review.googlesource.com/c/platform/bionic/+/2427910) | riscv64 SCS (Shadow Call Stack) support | 2023-03-21 |
| [2526530](https://android-review.googlesource.com/c/platform/bionic/+/2526530) | setjmp.h: increase riscv64 jmp_buf size | 2023-04-07 |
| [2526531](https://android-review.googlesource.com/c/platform/bionic/+/2526531) | riscv64: switch from x18 to gp for shadow call stack | 2023-04-13 |
| [2562193](https://android-review.googlesource.com/c/platform/bionic/+/2562193) | Add SYS_riscv_flush_icache | 2023-04-25 |
| [2586065](https://android-review.googlesource.com/c/platform/bionic/+/2586065) | riscv64: fix return value when errno is 4095 | 2023-05-11 |
| [2606625](https://android-review.googlesource.com/c/platform/bionic/+/2606625) | Implement RVV version mem* and str* for riscv64 (SiFive) | 2023-06-08 |
| [2657071](https://android-review.googlesource.com/c/platform/bionic/+/2657071) | Add riscv_hwprobe to the seccomp allowlist | 2023-07-13 |
| [2679530](https://android-review.googlesource.com/c/platform/bionic/+/2679530) | riscv64: add sys/hwprobe.h | 2023-07-27 |
| [2681597](https://android-review.googlesource.com/c/platform/bionic/+/2681597) | riscv64: use vdso for __riscv_hwprobe() | 2023-07-29 |
| [2695693](https://android-review.googlesource.com/c/platform/bionic/+/2695693) | riscv64: fix ifuncs, align calling convention with glibc | 2023-08-22 |
| [2719577](https://android-review.googlesource.com/c/platform/bionic/+/2719577) | riscv64: increase jmp_buf size (second increase) | 2023-08-22 |
| [2752785](https://android-review.googlesource.com/c/platform/bionic/+/2752785) | Add the risc-v TLSDESC relocations | 2023-09-15 |

**Cleanup and stabilization phase (2024-2025):**

| Change | Title | Merged |
|---|---|---|
| [3047343](https://android-review.googlesource.com/c/platform/bionic/+/3047343) | [RISC-V] Add misaligned load store tests | 2024-04-20 |
| [3094537](https://android-review.googlesource.com/c/platform/bionic/+/3094537) | Add riscv64 implementation of __get_bionic_tcb_for_thread() | 2024-05-17 |
| [3199470](https://android-review.googlesource.com/c/platform/bionic/+/3199470) | libc.map.txt: remove the two riscv64 special cases | 2024-07-30 |
| [3279653](https://android-review.googlesource.com/c/platform/bionic/+/3279653) | Use new riscv unistd names for syscall definition | 2024-09-24 |
| [3408180](https://android-review.googlesource.com/c/platform/bionic/+/3408180) | libc: remove riscv64 mem*/str* ifuncs and fallbacks | 2024-12-11 |
| [3472473](https://android-review.googlesource.com/c/platform/bionic/+/3472473) | Clean up the riscv64 assembler slightly | 2025-01-31 |
| [3472474](https://android-review.googlesource.com/c/platform/bionic/+/3472474) | riscv64: remove unused file | 2025-01-31 |

The last meaningful merge is from January 2025. Activity since then has been quiet. No master tracking issue exists. The original RFC (#2142912) was the umbrella; it was abandoned once the atomic changes landed. No Google Issue Tracker bug is publicly accessible.

**First release:** Android 14 (API 34, released October 2023) was the first Android version with official riscv64 support. All foundation changes merged between September 2022 and August 2023 shipped in Android 14.

---

## 3. Upstream Support Tier

AOSP publishes no formal architecture tier policy analogous to Rust or LLVM tier definitions. Architectures present in the tree (arm, arm64, x86, x86_64, riscv64) are implicitly supported by Google product decisions. The riscv64 port was initiated and is maintained by an internal Google engineer.

The NDK riscv64 ABI is explicitly described as provisional. NDK r27 (2024) was the first release to include a riscv64 sysroot; the release notes state: "A RISC-V sysroot (AKA riscv64, or rv64) has been added. It is **not** supported." Its stated purpose is OS vendor bringup only. `meta/abis.json` sets `"default": false` for riscv64.

In short: the architecture is in the tree as first-class source code, but the NDK ABI contract for riscv64 is not finalized and ABI breaks remain possible.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 libc core assembly (`libc/arch-riscv64/bionic/`, 5 files)

All 5 files are hand-written RISC-V assembly:

- **`syscall.S`**: shuffles C args into RISC-V registers (a7 = syscall number, a0-a5 = arguments), issues `ecall`, routes errors via `__set_errno_internal`. riscv64 was the first primary-only architecture in Bionic (no 32-bit companion) and the first that post-dates the kernel's 64-bit time syscall work, requiring special-casing in the seccomp filter and syscall stub generators.

- **`setjmp.S`**: saves 29 words -- ra, sp, gp, s0-s11, fs0-fs11, and signal mask. Uses XOR cookie mangling and a checksum. Shadow Call Stack (SCS): only the low bits of gp are saved, deliberately avoiding storing a full SCS pointer gadget. The jmp_buf was enlarged twice: once to accommodate the x18-to-gp SCS register switch ([#2526530](https://android-review.googlesource.com/c/platform/bionic/+/2526530)), and once proactively in anticipation of future Zsslpcfi hardware SCS requirements ([#2719577](https://android-review.googlesource.com/c/platform/bionic/+/2719577)). The commit message for the second increase notes: "musl and glibc only have the minimum needed (which I think means they'll need an ABI break to support SCS unless they just use a callee-saved general purpose register), but since we can't do ABI breaks after we ship, let's play it safe."

- **`__bionic_clone.S`**: implements `clone(2)`, sets up child stack, pushes fn and arg, issues `ecall`, zeroes fp and ra in child then tail-calls `__start_thread`.

- **`vfork.S`**: temporarily sets `cached_pid_=0` and `vforked_=1` in TLS, issues `clone(CLONE_VM|CLONE_VFORK|SIGCHLD)` via `ecall`.

- **`_exit_with_stack_teardown.S`**: issues `munmap` then `exit` syscall; ignores munmap failure.

**Frame pointer ABI note:** Change [#2298684](https://android-review.googlesource.com/c/platform/bionic/+/2298684) added a workaround for the RISC-V frame record layout, in which the frame pointer points past both saved values (return address at `frame[-1]`, previous FP at `frame[-2]`), differing from most other architectures. The commit message states: "I can't find this documented anywhere, other than people observing that RISC-V appears to behave in this way." The reviewer (Lifang Xia, Alibaba) pointed to [psABI issue #18](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/issues/18) and noted that GCC 7.2 already implemented this convention. The LLVM workaround reference is [D87579](https://reviews.llvm.org/D87579).

### 4.2 Shadow Call Stack register evolution

The SCS register was initially x18, chosen due to LLVM constraints at the time. It was switched to gp (x3) in April 2023 ([#2526531](https://android-review.googlesource.com/c/platform/bionic/+/2526531)) because gp is effectively unused in the Android RISC-V ABI (the kernel does not touch it, and Android does not use GP relaxation). This freed x18 for application code. The switch required a compiler change; the commit message notes: "untested, obviously, for lack of a suitable compiler."

### 4.3 RVV-optimized string functions (`libc/arch-riscv64/string/`, 15 files)

All 15 files are hand-written RISC-V Vector (RVV) assembly, co-credited to SiFive, Inc. (2023). The contribution originates from [sifive/sifive-libc](https://github.com/sifive/sifive-libc) under BSD 3-clause license. They were introduced in [#2606625](https://android-review.googlesource.com/c/platform/bionic/+/2606625) by Yun Hsiang (SiFive).

These implementations are compiled unconditionally when the V extension is enabled. There is no IFUNC dispatch for riscv64 in `bionic_ifuncs.h`; RISC-V falls into the default empty-args case (no hwcap argument passed to resolvers, unlike aarch64). The ifunc resolver calling convention was corrected in [#2695693](https://android-review.googlesource.com/c/platform/bionic/+/2695693) to match glibc: first argument is hwcap, second is null. That commit notes: "I actually went away and looked at a sample of top apps to see how many are using ifuncs currently. The result? Zero."

Key RVV techniques used:

| Function | Technique |
|---|---|
| `memcpy`, `memset` | `vsetvli` + `vle8.v`/`vse8.v`, LMUL=8; includes `__memcpy_chk`, `__memset_chk` |
| `memchr` | `vle8ff.v` (fault-only-first load), `vmseq.vx`, `vfirst.m` |
| `strlen` | `vle8ff.v`, `vmseq.vi`, `vfirst.m`, `csrr vl` |
| `strcmp` | Progressive LMUL ramp-up (mf2 to m4); dual `vfirst.m` for null vs. mismatch |
| `strcpy` | Fault-first load + `vmsif.m` masked store |
| `memcmp` | `vmsne.vv` + `vfirst.m` to find first differing byte |
| `stpcpy`, `strcat`, `strchr`, `strncat`, `strncmp`, `strncpy`, `strnlen` | Dedicated `.S` files using same RVV pattern |

### 4.4 Dynamic linker (`linker/arch/riscv64/`, 2 files)

- **`begin.S`**: linker entry point. Sets `.cfi_undefined ra`, passes `sp` to `__linker_init`, jumps to the returned entry point.

- **`tlsdesc_resolver.S`**: implements the RISC-V TLSDESC (TLS Descriptor) protocol with four entry points (`tlsdesc_resolver_static`, `tlsdesc_resolver_dynamic`, `tlsdesc_resolver_dynamic_slow_path`, `tlsdesc_resolver_unresolved_weak`). The slow path spills 35 general-purpose registers plus all RVV vector registers (`v0`, `v8`, `v16`, `v24` via `vlenb`-scaled offsets) before calling `__tls_get_addr`.

TLSDESC relocation types were added in [#2752785](https://android-review.googlesource.com/c/platform/bionic/+/2752785) after the RISC-V psABI standardized them ([psABI issue #94](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/issues/94)). This resolved [android-riscv64#3](https://github.com/google/android-riscv64/issues/3).

Full relocation coverage verified: `R_RISCV_64`, `R_RISCV_JUMP_SLOT`, `R_RISCV_RELATIVE`, `R_RISCV_IRELATIVE`, `R_RISCV_COPY`, all TLS variants (`DTPMOD64`, `DTPREL64`, `TPREL64`), and `TLSDESC`.

### 4.5 libm (`libm/fenv-riscv64.c`)

Implements all `fenv.h` functions via inline RISC-V CSR instructions (`frcsr`/`fscsr`, `frflags`/`fsrm`/`frrm`). `feenableexcept` correctly returns -1 (RISC-V hardware has no FP trap-on-exception support). `fegetexcept` returns 0. Higher-level math functions (`fma`, `fmax`, `fmin`, `llrint`, `lround`, `round` family) are handled via clang compiler builtins, the same policy used for arm64.

There is no equivalent of `libarm-optimized-routines` for RISC-V. The generic C math from FreeBSD/NetBSD is used for functions not covered by clang builtins.

### 4.6 Kernel UAPI headers (`libc/kernel/uapi/asm-riscv/asm/`, 39 files)

Auto-generated from the Linux kernel. Notable entries:

- **`hwcap.h`**: `COMPAT_HWCAP_ISA_*` bits (I, M, A, F, D, C, V).
- **`hwprobe.h`**: `struct riscv_hwprobe` with 48+ `RISCV_HWPROBE_EXT_*` constants (Zba, Zbb, Zbs, V, Zvbb, Zvkb, Zfh, ZTSO, ZACAS, etc.) and misaligned access performance keys.
- **`ptrace.h`**: RISC-V ptrace register layout.
- **`unistd_64.h`**: riscv64 syscall numbers.
- **`elf.h`**: riscv64 ELF machine and relocation types.
- **`sigcontext.h`**, **`ucontext.h`**: signal frame register save layout.

`__riscv_hwprobe()` was moved to the vDSO in [#2681597](https://android-review.googlesource.com/c/platform/bionic/+/2681597) to avoid a full syscall round-trip for capability probes.

One unique syscall entry in `SYSCALLS.TXT`:
```
__riscv_flush_icache:riscv_flush_icache(void*, void*, unsigned long) riscv64
```

### 4.7 API additions (Android V / API 35)

- `__riscv_flush_icache(void* start, void* end, unsigned long flags)` in `<sys/cachectl.h>`. The range is currently ignored per a Linux 6.12 note. Flag: `SYS_RISCV_FLUSH_ICACHE_LOCAL = 1UL`.
- `__riscv_hwprobe(struct riscv_hwprobe* pairs, size_t pair_count, size_t cpu_count, unsigned long* cpus, unsigned int flags)` in `<sys/hwprobe.h>`.
- `__riscv_hwprobe_t` function pointer typedef for use in riscv64 ifunc resolvers.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build system

Android Bionic uses Soong (`Android.bp` files) exclusively. There are no `CMakeLists.txt`, no `configure` scripts, and no `-DUSE_X=OFF` flags anywhere in the repository. The build is driven via:

```
source build/envsetup.sh
lunch <target>
mm
```

The NDK's `android.toolchain.cmake` contains one riscv64 line:
```cmake
elseif(ANDROID_TOOLCHAIN_NAME MATCHES "^riscv64-")
  set(CMAKE_ANDROID_ARCH_ABI riscv64)
```
This is for NDK users building third-party code, not for building Bionic itself.

### 5.2 Toolchain

Android is Clang/LLVM-only. GCC was fully removed before riscv64 was added; NDK r23 removed `libgcc` entirely, replacing it with LLVM's `libunwind` and `libclang_rt`. No GCC minimum version applies.

NDK versions and their clang tags:
- NDK r27 / r27c: `clang-r522817` / `clang-r522817c`
- NDK r28: `clang-r530567b`

No explicit Clang minimum version is documented in the Bionic repository for riscv64. The Android LLVM toolchain follows LLVM main with approximately 3-4 updates per year.

Known LLVM bug for riscv64: frame pointer addresses were implemented incorrectly. Bionic applies a `-16` byte offset workaround in `android_unsafe_frame_pointer_chase.cpp`. Reference: [LLVM D87579](https://reviews.llvm.org/D87579).

Shadow Call Stack is enabled for riscv64 in tests via:
```
riscv64: {
    cflags: ["-fsanitize=shadow-call-stack"],
}
```

### 5.3 riscv64 source layout in build files

`libc/Android.bp` references:
- `arch-riscv64/bionic/`: `__bionic_clone.S`, `_exit_with_stack_teardown.S`, `setjmp.S`, `syscall.S`, `vfork.S`
- `arch-riscv64/string/`: 15 RVV assembly files
- Version script: `libc.riscv64.map`

`linker/Android.bp`:
```
riscv64: {
    srcs: [":linker_sources_riscv64"],
}
```
Files: `arch/riscv64/begin.S`, `arch/riscv64/tlsdesc_resolver.S`, `arch/riscv64/linker_wrapper_begin.S`. Uses `linker.generic.map` version script (same as arm64/x86/x86_64).

### 5.4 Page size

riscv64 does not support 16 KiB page sizes in the NDK (unlike arm64 and x86_64, which gained 16 KiB support in NDK r27/r28).

### 5.5 Host testing

The `build/run-on-host.sh` script gates its logic on `TARGET_ARCH = x86 -o TARGET_ARCH = x86_64`. For any other `TARGET_ARCH`, including riscv64, it prints `"$0 not supported on TARGET_ARCH=$TARGET_ARCH"` and exits. No QEMU invocation or riscv64 emulator setup script exists anywhere in the repository.

### 5.6 Infrastructure Dockerfile

The NDK provides one Dockerfile (`infra/docker/Dockerfile`) based on Ubuntu 14.04 (Trusty). It installs only `bison`, `build-essential`, `curl`, `flex`, `git`, `make`, `pbzip2`, `python`, `python-pip`, `texinfo`, `uuid-runtime`, and `zip`. It contains no riscv64 toolchain packages, no QEMU, and no cross-compiler. It predates riscv64 support and has not been updated.

---

## 6. Feature Coverage and Gap Analysis vs. arm64 and amd64

| Feature | arm64 | amd64 | riscv64 | Notes |
|---|---|---|---|---|
| Syscall stub | Hand-written asm | Hand-written asm | Hand-written asm | Full parity |
| setjmp/longjmp | Hand-written asm | Hand-written asm | Hand-written asm | Full parity; cookie mangling present on all three |
| Shadow Call Stack | x18 register | N/A | gp (x3) | riscv64 uses gp after April 2023 switch |
| Hardware SCS | Via Pointer Authentication (future) | N/A | Via Zsslpcfi (future) | Neither is deployed; both tracked as open issues |
| RVV/NEON/SSE string ops | NEON in libarm-optimized-routines | SSE/AVX via generic | RVV in arch-riscv64/string/ | SiFive-contributed; 15 functions covered |
| IFUNC dispatch | hwcap passed to resolvers | hwcap passed | hwcap passed (fixed Aug 2023) | Fixed in #2695693; zero top apps use ifuncs on any arch as of Aug 2023 |
| TLSDESC | Full | Full | Full (since Sep 2023) | Required psABI standardization before implementation |
| vDSO for hwprobe | N/A | N/A | Yes (since Jul 2023) | RISC-V-specific capability query mechanism |
| fenv (FP trap-on-exception) | Supported | Supported | Not supported (hardware limitation) | feenableexcept returns -1; correctly documented |
| `__memcmp16` (String.compareTo) | Hand-written asm | Hand-written asm | Portable C fallback | Open bug [android-riscv64#161](https://github.com/google/android-riscv64/issues/161) |
| libm optimized routines | libarm-optimized-routines | Arch-tuned | FreeBSD/NetBSD generic C | No RISC-V equivalent of libarm-optimized-routines |
| 16 KiB page size | Yes (NDK r27+) | Yes | No | Not supported |
| LTO ABI correctness | OK | OK | Bug (open, #61) | -mcpu/-march not correctly propagated during LTO |

---

## 7. CI/CD Infrastructure

No riscv64 CI is evidenced in any CI configuration file in the repository. The following files were examined and contain no riscv64 references:

- `/TEST_MAPPING`: lists three test groups (`presubmit`, `hwasan-presubmit`, `kernel-presubmit`) with 16+ architecture-neutral test suite names. No riscv64 architecture tag, no riscv64-specific runner.
- `/PREUPLOAD.cfg`: only `clang_format`, an AOSP SHA validation hook, and a notice updater.
- `/build/run-on-host.sh`: explicitly handles only x86 and x86_64; riscv64 causes an immediate exit.
- `/build/` directory: three files total (`coverage.sh`, `NOTICE`, `run-on-host.sh`). No CI pipeline files.
- No `.github/` directory exists (returns 404).
- `ci.android.com`: no riscv64 build targets visible.

The riscv64 architecture source code in `libc/arch-riscv64/` is not CI. No dedicated riscv64 CI configuration, no riscv64-specific TEST_MAPPING entries, and no riscv64 presubmit build targets were found in any configuration file.

Testing known to occur: basic functionality verified on Cuttlefish (QEMU-based Android emulator). QEMU >= 8.1 is required; QEMU 9.0 fixes the V extension; QEMU 9.2 adds speedups for V. Boot to Android home screen takes approximately 10 minutes even on fast Xeon hardware. No physical hardware CI is documented.

---

## 8. Distribution and Release Status

**In Android:** riscv64 is a first-class source target in AOSP `main` since October 2022. Android 14 (API 34, October 2023) was the first release with official riscv64 support. NDK r27 (2024) was the first NDK release with a riscv64 sysroot; it is explicitly marked unsupported and not built by default.

**As a standalone package in Linux distributions:** Android Bionic does not exist as a standalone binary package in PyPI, Debian, Ubuntu, Arch Linux RISC-V, or Repology. The only packaged form is `android-bionic-uapi` in GNU Guix (version 7.1.2_r36), which is a headers-only package copying `libc/kernel/uapi` headers. It produces no compiled binary for any architecture, including riscv64. GNU Guix does not officially support riscv64 as a host system in its mainline distribution.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build Status | Key Notes |
|---|---|---|---|
| libc (Bionic) | Core C library | Builds; dedicated arch-riscv64/ assembly | NDK ABI not finalized; ABI breaks still possible |
| libm (Bionic) | Math library | Builds; fenv-riscv64.c with CSR inline asm | No libarm-optimized-routines equivalent; generic C math |
| libdl (Bionic) | Dynamic linker interface | Builds; same ABI as other arches | No riscv64-specific issues |
| linker/linker64 | ELF dynamic linker | Builds; begin.S + tlsdesc_resolver.S | TLS descriptor ABI correctness depends on toolchain alignment |
| libstdc++ (Bionic) | Minimal C++ ABI | Builds (pure C++, no arch asm) | No riscv64-specific issues |
| llvm-libc | Selected libc function implementations | Builds; included as whole_static_libs | LLVM libc riscv64 support not listed in official platform docs; gaps possible [NEEDS VERIFICATION] |
| Scudo (LLVM compiler-rt) | Default hardened allocator | Builds via generic Linux platform layer | No riscv64-specific tuning; allocator parameters may not be optimal |
| jemalloc (libjemalloc5) | Alternate allocator | Builds via generic GCC atomic backends | quantum size and vaddr bits must be validated for riscv64 |
| GWP-ASan | Guard-page heap sampler | Builds (pure C++, platform-agnostic) | PerfectlyRightAlign option noted as potentially architecture-incompatible [NEEDS VERIFICATION] |
| libunwind (LLVM) | Stack unwinding | Builds; REGISTERS_RISCV defined | Official docs do not list riscv64 as supported; relies on DWARF metadata |
| zlib | Compression (APK/ZIP loading) | Builds (pure C, no arch exclusions) | No RVV optimizations; generic C only |
| libbase (Android platform) | Utility library; used by linker | Builds via generic rules | No riscv64-specific issues |
| liblog (Android) | Logging; used by linker internals | Builds (no arch exclusions in Android.bp) | No riscv64-specific issues |
| Linux kernel UAPI headers | Syscall interface | 39 files in libc/kernel/uapi/asm-riscv/ | Header set leaner than arm64; specialized subsystem headers may be missing |
| libarm-optimized-routines | High-performance ARM string/math | Not applicable (ARM-only) | riscv64 uses arch-riscv64/string/ instead |
| ICU / libicu4x_bionic | Unicode/timezone (Rust FFI) | Builds; riscv64 listed as Rust FFI target | ICU4C does not list riscv64 as officially tested; correctness not formally validated [NEEDS VERIFICATION] |

---

## 10. Ecosystem Status

### RISE Project

Google is a Premier Member of the RISE Project (riseproject.dev) with a Governing Board seat. SiFive and DAMO Academy (Alibaba) are also Premier Members. Andes Technology, ByteDance, Canonical, ISCAS, and others are General Members.

Android Bionic does not appear in any RISE blog post (all 27 posts checked, May 2024 through June 2026). It does not appear in any of the 16 funded RFP projects (RP001-RP016). The System Libraries Working Group (elected lead: Ruinland Chuan-Tzu Tsai, Andes Technology) lists "Android, C runtimes, musl-libc, glibc, Linux/FreeBSD, and Linux distribution bootstrapping" as its scope, which covers Bionic. No dedicated Android Bionic funding or deliverable is publicly documented. This WG is being consolidated into an "Enablement/Optimization WG" effective June 25, 2026.

### Contributor origins

| Organization | Contribution |
|---|---|
| Google (Elliott Hughes lead) | All OWNERS-file authority; majority of merged changes |
| Alibaba (Mao Han, Xia Lifang, et al.) | Original RFC and SOB chain attribution; errno=4095 fix |
| SiFive (Yun Hsiang) | RVV-optimized string functions (15 files, BSD 3-clause) |
| ISCAS | Listed in SOB chains of foundation commits |
| Paul Kirth | TLS Descriptor prototype (2024) |
| George Burgess IV (Google) | Removal of riscv64 ifunc fallback overhead (Dec 2024) |

---

## 11. Known Bugs and Active Issues

### Open issues at [github.com/google/android-riscv64](https://github.com/google/android-riscv64)

| Issue | Title | Category |
|---|---|---|
| [#167](https://github.com/google/android-riscv64/issues/167) | Support vector regalloc for RISC-V backend in ART | Performance (ART) |
| [#165](https://github.com/google/android-riscv64/issues/165) | ART: revisit intrinsics to use V and B | Performance (ART) |
| [#161](https://github.com/google/android-riscv64/issues/161) | ART: implement custom `__memcmp16`? | Performance gap -- `String.compareTo()` uses portable C fallback on riscv64; all other architectures have hand-written asm |
| [#153](https://github.com/google/android-riscv64/issues/153) | Implement MethodHandleInvokeExact intrinsic for riscv64 | Correctness/Performance (ART) |
| [#148](https://github.com/google/android-riscv64/issues/148) | ART: Implement optimizations with Zbs extension | Performance (ART) |
| [#147](https://github.com/google/android-riscv64/issues/147) | ART: implement BitstringTypeCheck for RISC-V | Correctness (ART) |
| [#141](https://github.com/google/android-riscv64/issues/141) | ART: unimplemented intrinsics | Performance gap -- full list in `code_generator_riscv64.h` under `UNIMPLEMENTED_INTRINSIC_LIST_RISCV64`; these fall back to slower non-optimized paths |
| [#62](https://github.com/google/android-riscv64/issues/62) | Enable -msave-restore at -Oz | Code-size/performance (compiler) |
| [#61](https://github.com/google/android-riscv64/issues/61) | Fix ABI and mcpu/march for LTO | Correctness bug (labeled `bug`) -- references LLVM patches D132843, D71387, D72245, D102582, D106347 |
| [#60](https://github.com/google/android-riscv64/issues/60) | Investigate the status of SLP vectorizer | Performance (compiler vectorization) |
| [#59](https://github.com/google/android-riscv64/issues/59) | frameworks/av: optimization | Performance (media framework) |
| [#58](https://github.com/google/android-riscv64/issues/58) | Fix platform:Android bugs in llvm-project | Correctness/Performance (labeled `bug`) |
| [#53](https://github.com/google/android-riscv64/issues/53) | kernel: crypto optimization | Performance (kernel/security) |
| [#39](https://github.com/google/android-riscv64/issues/39) | external/skia: optimization | Performance |
| [#37](https://github.com/google/android-riscv64/issues/37) | external/libpng: optimization | Performance |
| [#36](https://github.com/google/android-riscv64/issues/36) | external/boringssl: optimization | Performance |
| [#35](https://github.com/google/android-riscv64/issues/35) | external/libjpeg-turbo: optimization | Performance |
| [#34](https://github.com/google/android-riscv64/issues/34) | external/libmpeg2: optimization | Performance |
| [#33](https://github.com/google/android-riscv64/issues/33) | external/libhevc/: optimization | Performance |
| [#32](https://github.com/google/android-riscv64/issues/32) | external/libavc/: optimization | Performance |
| [#29](https://github.com/google/android-riscv64/issues/29) | external/flac/: need V optimization | Performance (V extension) |
| [#15](https://github.com/google/android-riscv64/issues/15) | security: hardware CFI ("landing pads") support | Correctness/Security (ABI) |
| [#14](https://github.com/google/android-riscv64/issues/14) | security: hardware shadow call stack | Correctness/Security |
| [#13](https://github.com/google/android-riscv64/issues/13) | external/aac: inline assembler | Performance |
| [#5](https://github.com/google/android-riscv64/issues/5) | bionic/tests/sys_ptrace_test.cpp: add instruction writing > 64 bits | Correctness (test gap) |

### Recently closed issues relevant to Bionic

| Issue | Title | Notes |
|---|---|---|
| [#162](https://github.com/google/android-riscv64/issues/162) | Structure accesses with NDK r27 produce more instructions than expected | Missed optimization: 3-byte struct read generates 3x lbu instead of 1x lhu + 1x lbu; LLVM backend not exploiting `zbb` |
| [#160](https://github.com/google/android-riscv64/issues/160) | `$x.*` symbol in libc.so | `$x.0` at 6.37% cpu-cycles in profiling; compiler mapping symbols obscure real hotspot names |
| [#111](https://github.com/google/android-riscv64/issues/111) | clang driver: enable fast unaligned access for android | Fast unaligned access was not enabled by default |
| [#8](https://github.com/google/android-riscv64/issues/8) | what's the ifunc story? hwcap.h | Linux kernel hwcap.h lacked V extension bit at filing; ifunc dispatch fragmented by Zb* sub-extension proliferation |

### Only open Gerrit change for riscv64

[Change #2320311](https://android-review.googlesource.com/c/platform/bionic/+/2320311) -- "Disable Rust dep." (topic: riscv). Created 2022-11-29. Status: New/WIP. Last activity: 2024-06-10. Owner: Ulya Trofimovich (Google). One unresolved comment from Elliott Hughes asking whether the change is still needed. The reviewer (Xin Li) removed themselves in June 2024 and activity ceased. This is a one-line change to `apex/Android.bp` disabling a Rust dependency; the motivation may no longer apply.

### Benchmark data

No public benchmark numbers with exact figures exist for Android Bionic on riscv64. The only performance-adjacent quantitative data found:

- QEMU emulation: boot to Android home screen takes approximately 10 minutes on fast Xeon hardware. QEMU >= 8.1 required; QEMU 9.0 fixes the V extension; QEMU 9.2 adds V speedups.
- Profiling artifact ([#160](https://github.com/google/android-riscv64/issues/160)): `$x.0` consumed 6.37% of cpu-cycles from `libc.so` during cpu-cycles profiling. The symbol is a compiler-generated mapping symbol, not a real function name. This represents a profiling infrastructure gap, not a benchmark result.
- No arm64 vs. riscv64 comparative benchmark data is publicly available from any accessible source.

Data not available: riscv64 vs. arm64 performance comparison for any libc function (memcpy, strlen, strcmp, or others). Data not available: riscv64 vs. arm64 application-level performance for any Android workload.

---

## 12. Objections and Upstream Blockers

**1. NDK ABI not finalized.** The Android NDK riscv64 ABI is explicitly described as provisional. ABI breaks are acknowledged as possible. Application binaries built today may be ABI-incompatible with future Android riscv64 releases. This is the single largest blocking item for production deployment. Tracked at [github.com/google/android-riscv64](https://github.com/google/android-riscv64).

**2. No CI for riscv64.** No CI configuration file in the repository targets riscv64. The only on-host build/test script (`run-on-host.sh`) explicitly exits for non-x86 targets. There are no riscv64 build targets on `ci.android.com`. Regressions can merge undetected.

**3. LTO ABI correctness bug (open, labeled `bug`, [#61](https://github.com/google/android-riscv64/issues/61)).** `-mcpu`/`-march` flags are not correctly propagated during LTO. This is a build-system/compiler interaction bug that can silently produce incorrect binaries when LTO is enabled.

**4. `__memcmp16` missing asm ([#161](https://github.com/google/android-riscv64/issues/161), open).** `String.compareTo()` uses a portable C fallback on riscv64. All other architectures have hand-written assembler. This is a measurable performance gap for Java string-heavy workloads.

**5. Unimplemented ART intrinsics ([#141](https://github.com/google/android-riscv64/issues/141), open).** The full list lives in `code_generator_riscv64.h` under `UNIMPLEMENTED_INTRINSIC_LIST_RISCV64`. These fall back to slower non-optimized paths. The gap is larger than on arm64 or x86_64.

**6. Hardware security features not deployed.** Hardware CFI via Zisslpcfi landing pads ([#15](https://github.com/google/android-riscv64/issues/15)) and hardware Shadow Call Stack via Zsslpcfi ([#14](https://github.com/google/android-riscv64/issues/14)) are open with no target date. The current software SCS via gp register is a stop-gap.

**7. QEMU-only testing.** No physical hardware CI path exists. QEMU 9.0+ is required for correct V extension behavior. Emulator boot time is approximately 10 minutes. Results on real hardware may differ substantially.

**8. No RISC-V libm optimization library.** `libarm-optimized-routines` provides highly tuned math and string routines for arm64. There is no equivalent for riscv64. Math performance relies on FreeBSD/NetBSD generic C and clang builtins.

**9. Profiling infrastructure gap.** Compiler-generated `$x.*` mapping symbols in `libc.so` obscure real function names during cpu-cycles profiling ([#160](https://github.com/google/android-riscv64/issues/160)). This makes hotspot analysis unreliable.

**10. Google-controlled governance.** All OWNERS-file entries are Google employees. External contributors cannot merge without Google Code-Review+2. There is no path for non-Google parties to hold commit authority regardless of contribution volume or quality.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The core Bionic riscv64 port is complete. The five essential libc assembly files (syscall, setjmp, clone, vfork, exit), the dynamic linker entry and TLSDESC resolver, and all fenv functions are present and production-quality. Functional gaps relative to arm64 are confined to ART intrinsics and `__memcmp16`. No functional blocker exists for running Android on riscv64 hardware today -- the NDK ABI being provisional is a stability/compatibility risk, not an execution blocker.

Investment required for functional parity: implement `__memcmp16` in RVV assembly (closes [#161](https://github.com/google/android-riscv64/issues/161)); address unimplemented ART intrinsics ([#141](https://github.com/google/android-riscv64/issues/141)). Neither item is in Bionic directly -- `__memcmp16` lives in ART, and the intrinsics are in ART's code generator.

### 13.2 Performance Optimization

Identified performance gaps with no current owner:

1. No RISC-V equivalent of `libarm-optimized-routines` for math functions. Generic C math is measurably slower than NEON-tuned routines for trigonometric, exponential, and rounding functions.
2. `__memcmp16` portable C fallback vs. hand-written asm (quantitative gap: data not available).
3. Unimplemented ART intrinsics (quantitative gap: data not available).
4. Profiling infrastructure gap (`$x.*` symbols) prevents identifying and fixing additional hotspots in `libc.so`.
5. SLP vectorizer effectiveness ([#60](https://github.com/google/android-riscv64/issues/60)) -- not yet characterized.
6. zlib has no RVV optimizations. Generic C only.
7. Multiple media/codec libraries have open optimization issues: boringssl ([#36](https://github.com/google/android-riscv64/issues/36)), libjpeg-turbo ([#35](https://github.com/google/android-riscv64/issues/35)), libmpeg2 ([#34](https://github.com/google/android-riscv64/issues/34)), libhevc ([#33](https://github.com/google/android-riscv64/issues/33)), libavc ([#32](https://github.com/google/android-riscv64/issues/32)), flac ([#29](https://github.com/google/android-riscv64/issues/29)), libpng ([#37](https://github.com/google/android-riscv64/issues/37)).

### 13.3 CI/CD Infrastructure

No riscv64 CI exists. This is the highest-risk structural gap: the architecture has no automated regression detection. Any change to Bionic can silently break riscv64. Establishing even a build-only CI for riscv64 would provide a meaningful regression signal. A test-execution CI requires either physical hardware or a maintained QEMU integration (QEMU 9.0+ for V extension correctness).

This is unlikely to be addressed by Google for a non-product architecture. It is a direct investment opportunity for a company with riscv64 hardware.

### 13.4 Ecosystem Enablement

The RISE System Libraries WG covers Android/Bionic in its stated scope, but no funded project exists. SiFive has already demonstrated the pattern: contributing production-quality RVV string assembly (15 files) that was accepted and merged. This is the established contribution model.

The LTO ABI correctness bug ([#61](https://github.com/google/android-riscv64/issues/61)) is a compiler/build-system issue that benefits all Android riscv64 users. It has LLVM patch references (D132843 et al.) but is still open.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix LTO ABI / -mcpu/-march propagation ([#61](https://github.com/google/android-riscv64/issues/61)) | 4-8 | LLVM/Bionic | Critical |
| Functional | Implement `__memcmp16` in RVV asm ([#161](https://github.com/google/android-riscv64/issues/161)) | 1-2 | ART/Bionic | High |
| Functional | Implement unimplemented ART intrinsics ([#141](https://github.com/google/android-riscv64/issues/141)) | 8-16 | ART | High |
| Functional | Hardware CFI / Zsslpcfi support ([#15](https://github.com/google/android-riscv64/issues/15), [#14](https://github.com/google/android-riscv64/issues/14)) | 8-20 | Bionic/compiler/kernel | High (long-lead) |
| Performance | RVV-optimized libm routines (equivalent of libarm-optimized-routines) | 12-24 | Bionic/libm | High |
| Performance | Fix `$x.*` profiling symbol gap in libc.so ([#160](https://github.com/google/android-riscv64/issues/160)) | 1-2 | LLVM/Bionic | Medium |
| Performance | RVV-optimized zlib | 4-8 | External (zlib/upstream) | Medium |
| Performance | boringssl RVV optimization ([#36](https://github.com/google/android-riscv64/issues/36)) | 4-8 | External/Bionic | Medium |
| Performance | libjpeg-turbo RVV optimization ([#35](https://github.com/google/android-riscv64/issues/35)) | 4-8 | External/Bionic | Medium |
| Performance | Media codec library optimizations (#32, #33, #34, #37, #29) | 20-40 total | External libraries | Low-Medium |
| Performance | SLP vectorizer characterization ([#60](https://github.com/google/android-riscv64/issues/60)) | 2-4 | LLVM | Medium |
| CI/CD | Establish riscv64 build CI (compile-only) | 3-6 | Google/chip company | Critical |
| CI/CD | Establish riscv64 test CI on hardware or QEMU 9.2+ | 8-16 | chip company with hardware | High |
| CI/CD | Extend `run-on-host.sh` to support riscv64 | 1-2 | Bionic | Medium |
| Ecosystem | Close android-riscv64#61 upstream LLVM patches | 4-8 | LLVM toolchain team | Critical |
| Ecosystem | NDK riscv64 ABI finalization | Data not available: no public timeline or tracking issue found | Google internal | Blocking |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Android Bionic repository](https://android.googlesource.com/platform/bionic)
- [Android Bionic Gerrit review](https://android-review.googlesource.com/q/project:platform/bionic+topic:riscv)
- [google/android-riscv64 issue tracker](https://github.com/google/android-riscv64/issues)
- [RFC #2142912 -- Add riscv64 support (abandoned)](https://android-review.googlesource.com/c/platform/bionic/+/2142912)
- [Change #2245796 -- riscv64 syscall stub and seccomp filter generation](https://android-review.googlesource.com/c/platform/bionic/+/2245796)
- [Change #2254947 -- riscv64: add bionic assembler and string functions (first commit)](https://android-review.googlesource.com/c/platform/bionic/+/2254947)
- [Change #2298684 -- Add a hack for a RISC-V bug (frame pointer)](https://android-review.googlesource.com/c/platform/bionic/+/2298684)
- [Change #2427910 -- riscv64 SCS support](https://android-review.googlesource.com/c/platform/bionic/+/2427910)
- [Change #2526531 -- riscv64: switch from x18 to gp for shadow call stack](https://android-review.googlesource.com/c/platform/bionic/+/2526531)
- [Change #2606625 -- Implement RVV version mem* and str* for riscv64 (SiFive)](https://android-review.googlesource.com/c/platform/bionic/+/2606625)
- [Change #2681597 -- riscv64: use vdso for __riscv_hwprobe()](https://android-review.googlesource.com/c/platform/bionic/+/2681597)
- [Change #2695693 -- riscv64: fix ifuncs, improve the ifunc tests](https://android-review.googlesource.com/c/platform/bionic/+/2695693)
- [Change #2752785 -- Add the risc-v TLSDESC relocations](https://android-review.googlesource.com/c/platform/bionic/+/2752785)
- [Change #3408180 -- libc: remove riscv64 mem*/str* ifuncs and fallbacks](https://android-review.googlesource.com/c/platform/bionic/+/3408180)
- [Change #2320311 -- Disable Rust dep. (only open riscv64 WIP change)](https://android-review.googlesource.com/c/platform/bionic/+/2320311)
- [android-riscv64#61 -- Fix ABI and mcpu/march for LTO](https://github.com/google/android-riscv64/issues/61)
- [android-riscv64#161 -- ART: implement custom __memcmp16?](https://github.com/google/android-riscv64/issues/161)
- [android-riscv64#141 -- ART: unimplemented intrinsics](https://github.com/google/android-riscv64/issues/141)
- [android-riscv64#160 -- $x.* symbol in libc.so](https://github.com/google/android-riscv64/issues/160)
- [LLVM D87579 -- RISC-V frame pointer workaround](https://reviews.llvm.org/D87579)
- [RISC-V psABI issue #18 -- frame pointer convention](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/issues/18)
- [RISC-V psABI issue #94 -- TLSDESC relocations](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/issues/94)
- [RISE Project working group election results (March 2025)](https://riseproject.dev/2025/03/31/working-group-lead-election-results/)
- [sifive/sifive-libc (source of RVV string contributions)](https://github.com/sifive/sifive-libc)