---
title: Bionic
parent: Project Reports
color: orange
dependencies:
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: libunwind
    relation: runtime-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: jemalloc
    relation: runtime-dependency
    criticality: optional
  - name: ICU
    relation: runtime-dependency
    criticality: optional
  - name: LLVM libc
    relation: runtime-dependency
    criticality: optional
  - name: Scudo
    relation: runtime-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="bionic" %}

# Bionic

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Bionic<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Android Bionic is the C library, math library, and dynamic linker shipped with Android. It replaces glibc and provides the ABI foundation for all native Android code. The project is hosted exclusively on Google infrastructure at [android.googlesource.com/platform/bionic](https://android.googlesource.com/platform/bionic) and is governed entirely by Google as part of AOSP. There is no independent foundation, technical steering committee, or CLA-based external maintainer program, and no `MAINTAINERS` file. Governance runs through a Gerrit `OWNERS` file requiring Code-Review+2 from a listed Google owner before any change can merge.

License: BSD 2-clause for core AOSP-authored files. BSD 3-clause for SiFive-authored RISC-V string assembly (`memcpy.S` and related). Upstream-ported BSD components (FreeBSD, OpenBSD, NetBSD) carry their original 2- or 3-clause BSD licenses. There is no Apache 2.0 umbrella for this library.

**Current OWNERS-file authority (verified directly against the live file):**

| Person | Email | Company | Scope |
|---|---|---|---|
| Elliott Hughes | enh@google.com | Google | Full owner (dominant maintainer) |
| Christopher Ferris | cferris@google.com | Google | Full owner |
| Chia-hung Duan | chiahungduan@google.com | Google | Full owner |
| Dan Albert | danalbert@google.com | Google | Full owner |
| Ryan Prichard | rprichard@google.com | Google | Full owner |
| Yabin Cui | yabinc@google.com | Google | Full owner |
| Florian Mayer | fmayer@google.com | Google | Per-file only (`docs/mte.md`) |
| Peter Collingbourne | pcc@google.com | Google | Per-file only (`docs/mte.md`) |

100 percent of OWNERS-file authority sits with Google employees. No non-Google company holds commit or review authority.

**Non-owner corporate contributors to the riscv64 port** (contribution only, no merge authority): Alibaba/DAMO Academy (original RFC and the SOB-chain patches that followed it: Mao Han, Xia Lifang, Chen Guoyin, Wang Chen, Lu Xufan) and SiFive (15-file RVV string-assembly contribution, BSD 3-clause, credited to Yun Hsiang).

**Community culture on new ports:** entirely Google-internal decision-making. There is no external review board or foundation process for accepting a new Bionic architecture port. The Alibaba RFC is the precedent for the actual mechanism: an outside company can propose a port, but Google unilaterally decides the acceptance terms (here, forcing a rewrite from an 85+ patch-set monolithic RFC into atomic, individually reviewable Gerrit changes under Google review) and retains all merge authority throughout.

Google itself is a Premier Member of the RISE Project (riseproject.dev/members), alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent. The RISE System Libraries Working Group (now consolidated into an "Enablement and Optimization Working Group") lists "Android, C runtimes" in scope, but no funded RISE RFP deliverable names Bionic specifically. See Section 12 for the full detail on this, including a one-line tracking stub that should not be read as an independent RISE commitment.

## 2. Port History and Upstreaming Timeline

The riscv64 port originated with a monolithic RFC submitted by a team from Alibaba ([Change #2142912](https://android-review.googlesource.com/c/platform/bionic/+/2142912), filed 2022-06-30, 85+ patch sets). Elliott Hughes declined to merge it as a single patch due to binary-blob policy and code-style concerns, and instead broke it into individually reviewable changes starting October 2022; the RFC itself was abandoned 2022-11-30. The Alibaba team's Signed-off-by attribution (Mao Han, Xia Lifang, Chen Guoyin, Wang Chen, Lu Xufan) was preserved across the split, derived commits, after the Alibaba team raised the point in the RFC review thread and Hughes agreed.

Gerrit change statuses below were independently re-verified this cycle against the Gerrit REST API (`android-review.googlesource.com/changes/<id>/detail`); a handful of `merged_at` dates in earlier reporting were off by one to three days from Gerrit's actual `submitted` timestamp and are corrected here.

**Foundation phase (Sept-Nov 2022):**

| Change | Title | Merged |
|---|---|---|
| [2237209](https://android-review.googlesource.com/c/platform/bionic/+/2237209) | Add riscv64 to the list of uapi architectures | 2022-09-30 |
| [2239865](https://android-review.googlesource.com/c/platform/bionic/+/2239865) | Initial import of the risc-v uapi headers | 2022-10-03 |
| [2240295](https://android-review.googlesource.com/c/platform/bionic/+/2240295) | Add riscv64 to the map files | 2022-10-05 |
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
| [2657071](https://android-review.googlesource.com/c/platform/bionic/+/2657071) | Add riscv_hwprobe to the seccomp allowlist | 2023-07-14 |
| [2679530](https://android-review.googlesource.com/c/platform/bionic/+/2679530) | riscv64: add sys/hwprobe.h | 2023-07-28 |
| [2681597](https://android-review.googlesource.com/c/platform/bionic/+/2681597) | riscv64: use vdso for __riscv_hwprobe() | 2023-08-01 |
| [2695693](https://android-review.googlesource.com/c/platform/bionic/+/2695693) | riscv64: fix ifuncs, align calling convention with glibc | 2023-08-22 |
| [2719577](https://android-review.googlesource.com/c/platform/bionic/+/2719577) | riscv64: increase jmp_buf size (second increase) | 2023-08-22 |
| [2752785](https://android-review.googlesource.com/c/platform/bionic/+/2752785) | Add the risc-v TLSDESC relocations | 2023-09-15 |

**Cleanup and stabilization phase (2024-2025):**

| Change | Title | Merged |
|---|---|---|
| [3047343](https://android-review.googlesource.com/c/platform/bionic/+/3047343) | [RISC-V] Add misaligned load store tests | 2024-04-24 |
| [3094537](https://android-review.googlesource.com/c/platform/bionic/+/3094537) | Add riscv64 implementation of __get_bionic_tcb_for_thread() | 2024-05-20 |
| [3199470](https://android-review.googlesource.com/c/platform/bionic/+/3199470) | libc.map.txt: remove the two riscv64 special cases | 2024-08-01 |
| [3279653](https://android-review.googlesource.com/c/platform/bionic/+/3279653) | Use new riscv unistd names for syscall definition | 2024-09-24 |
| [3408180](https://android-review.googlesource.com/c/platform/bionic/+/3408180) | libc: remove riscv64 mem*/str* ifuncs and fallbacks | 2024-12-12 |
| [3472473](https://android-review.googlesource.com/c/platform/bionic/+/3472473) | Clean up the riscv64 assembler slightly | 2025-02-03 |
| [3472474](https://android-review.googlesource.com/c/platform/bionic/+/3472474) | riscv64: remove unused file | 2025-02-01 |

The last merged riscv64-topic commit to `platform/bionic` is from February 2025. All 30 merged changes above are confirmed still `MERGED` in Gerrit, with none reverted or reopened.

**The only open riscv64-topic Gerrit change** is [#2320311](https://android-review.googlesource.com/c/platform/bionic/+/2320311), "Disable Rust dep.", a one-line change to `apex/Android.bp`. Owner: Ulya Trofimovich (Google). Created 2022-11-29. Confirmed via direct Gerrit REST fetch: status is still `NEW`/work-in-progress, last updated 2024-06-10, with no activity since. Full comment thread: Elliott Hughes asked on 2022-11-30 "do you still need this? (crash_dump isn't rust, so i'm a bit confused about what needs to be fixed here...)"; Trofimovich replied on 2023-01-19 "Not sure, I needed it to progress with the build a long time ago. I'll reevaluate this."; reviewer Xin Li set Presubmit-Ready+1 on 2023-07-12 and then removed themselves as reviewer on 2024-06-10, clearing that vote. The question was never conclusively answered and the change has sat unmerged and unresolved for over two years.

No master or umbrella tracking issue for the riscv64 Bionic port exists. The original RFC (#2142912) was the closest thing to one and was abandoned once split into atomic changes.

**First release:** Android 14 (API 34, released October 2023) was the first Android version with official riscv64 support. All foundation-phase changes merged between September 2022 and August 2023 shipped in Android 14. Merges landing near the Android 15 (~Oct 2024) and Android 16 (~mid-2025) branch cuts are noted [NEEDS VERIFICATION] for exact ship version, since "first release" here means "first AOSP platform version whose source tree contains the commit," not a shipping consumer device, and no branch-manifest cross-check was performed.

## 3. Upstream Support Tier

AOSP publishes no formal architecture-tier policy analogous to Rust or LLVM tier definitions. Architectures present in the tree (arm, arm64, x86, x86_64, riscv64) are implicitly supported by Google product decisions, and the riscv64 port was initiated and is maintained by an internal Google engineer (Elliott Hughes) as first-class in-tree source.

The NDK riscv64 ABI, however, is explicitly provisional. NDK r27 (2024) was the first release to include a riscv64 sysroot; its release notes state: "A RISC-V sysroot (AKA riscv64, or rv64) has been added. It is **not** supported." Its stated purpose is OS-vendor bringup only, and `meta/abis.json` sets `"default": false` for riscv64.

| Dimension | amd64/x86_64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree source | Yes | Yes | Yes |
| Official first-class architecture | Yes | Yes | Yes (source-level) |
| NDK sysroot supported | Yes | Yes | No (explicitly marked unsupported) |
| ABI finalized | Yes | Yes | No |
| 16 KiB page size | Yes (NDK r27+) | Yes (NDK r27+) | No |
| riscv64 CI gating merges | n/a | n/a | No (Section 7) |

The architecture is in the tree as first-class source code, but the NDK ABI contract for riscv64 is not finalized and ABI breaks remain possible for anything built against it today.

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 libc core assembly (`libc/arch-riscv64/bionic/`, 5 files)

Directory listing independently re-verified this cycle against `android.googlesource.com/platform/bionic/+/master/libc/arch-riscv64/bionic/`; contents unchanged. All 5 files are hand-written RISC-V assembly:

- **`syscall.S`**: shuffles C args into RISC-V registers (a7 = syscall number, a0-a5 = arguments), issues `ecall`, routes errors via `__set_errno_internal`. riscv64 was the first primary-only architecture in Bionic (no 32-bit companion) and the first that post-dates the kernel's 64-bit time syscall work, requiring special-casing in the seccomp filter and syscall stub generators.
- **`setjmp.S`**: saves 29 words (ra, sp, gp, s0-s11, fs0-fs11, and signal mask). Uses XOR cookie mangling and a checksum. Shadow Call Stack (SCS): only the low bits of gp are saved, deliberately avoiding storing a full SCS pointer gadget. The jmp_buf was enlarged twice: once for the x18-to-gp SCS register switch ([#2526530](https://android-review.googlesource.com/c/platform/bionic/+/2526530)), and once proactively for future Zisslpcfi hardware SCS requirements ([#2719577](https://android-review.googlesource.com/c/platform/bionic/+/2719577)). The commit message for the second increase: "musl and glibc only have the minimum needed... but since we can't do ABI breaks after we ship, let's play it safe."
- **`__bionic_clone.S`**: implements `clone(2)`, sets up child stack, pushes fn and arg, issues `ecall`, zeroes fp and ra in child then tail-calls `__start_thread`.
- **`vfork.S`**: temporarily sets `cached_pid_=0` and `vforked_=1` in TLS, issues `clone(CLONE_VM|CLONE_VFORK|SIGCHLD)` via `ecall`.
- **`_exit_with_stack_teardown.S`**: issues `munmap` then `exit` syscall; ignores munmap failure.

**Frame pointer ABI note:** Change [#2298684](https://android-review.googlesource.com/c/platform/bionic/+/2298684) added a workaround for the RISC-V frame record layout, in which the frame pointer points past both saved values (return address at `frame[-1]`, previous FP at `frame[-2]`). The commit message states: "I can't find this documented anywhere, other than people observing that RISC-V appears to behave in this way." The reviewer (Lifang Xia, Alibaba) pointed to [psABI issue #18](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/issues/18) and noted GCC 7.2 already implemented this convention. LLVM's corresponding workaround is [D87579](https://reviews.llvm.org/D87579).

### 4.2 Shadow Call Stack register evolution

The SCS register was initially x18, constrained by LLVM at the time. It was switched to gp (x3) in April 2023 ([#2526531](https://android-review.googlesource.com/c/platform/bionic/+/2526531)) because gp is effectively unused in the Android RISC-V ABI, freeing x18 for application code.

### 4.3 RVV-optimized string functions (`libc/arch-riscv64/string/`, 15 files)

Directory listing re-verified this cycle; contents unchanged (15 files: `memchr.S`, `memcmp.S`, `memcpy.S`, `memmove.S`, `memset.S`, `stpcpy.S`, `strcat.S`, `strchr.S`, `strcmp.S`, `strcpy.S`, `strlen.S`, `strncat.S`, `strncmp.S`, `strncpy.S`, `strnlen.S`). All are hand-written RISC-V Vector (RVV) assembly, contributed by SiFive, Inc. (originating from [sifive/sifive-libc](https://github.com/sifive/sifive-libc), BSD 3-clause), introduced in [#2606625](https://android-review.googlesource.com/c/platform/bionic/+/2606625) by Yun Hsiang.

These implementations are compiled unconditionally (confirmed via `libc/Android.bp`: a plain `srcs:` list for the riscv64 block, with no cflags/march conditionals and no runtime dispatch mechanism). There is no IFUNC dispatch for riscv64 in `bionic_ifuncs.h`; the ifunc resolver calling convention was corrected in [#2695693](https://android-review.googlesource.com/c/platform/bionic/+/2695693) to match glibc (hwcap as first argument, null as second). That commit's author notes: "I actually went away and looked at a sample of top apps to see how many are using ifuncs currently. The result? Zero."

Key RVV techniques used:

| Function | Technique |
|---|---|
| memcpy, memset | vsetvli + vle8.v/vse8.v, LMUL=8; includes __memcpy_chk, __memset_chk |
| memchr | vle8ff.v (fault-only-first load), vmseq.vx, vfirst.m |
| strlen | vle8ff.v, vmseq.vi, vfirst.m, csrr vl |
| strcmp | Progressive LMUL ramp-up (mf2 to m4); dual vfirst.m for null vs. mismatch |
| strcpy | Fault-first load + vmsif.m masked store |
| memcmp | vmsne.vv + vfirst.m to find first differing byte |
| stpcpy, strcat, strchr, strncat, strncmp, strncpy, strnlen | Dedicated .S files using the same RVV pattern |

No dedicated V-extension variant sits outside this scalar/RVV-hybrid set; further vector-extension enablement (beyond what these 15 files already cover) is tracked as open work ([android-riscv64#92](https://github.com/google/android-riscv64/issues/92)).

### 4.4 Dynamic linker (`linker/arch/riscv64/`, 2 files)

Directory listing re-verified this cycle; contents unchanged.

- **`begin.S`**: linker entry point. Sets `.cfi_undefined ra`, passes `sp` to `__linker_init`, jumps to the returned entry point.
- **`tlsdesc_resolver.S`**: implements the RISC-V TLSDESC protocol with four entry points (`tlsdesc_resolver_static`, `tlsdesc_resolver_dynamic`, `tlsdesc_resolver_dynamic_slow_path`, `tlsdesc_resolver_unresolved_weak`). The slow path spills 35 general-purpose registers plus all RVV vector registers (v0, v8, v16, v24 via vlenb-scaled offsets) before calling `__tls_get_addr`.

TLSDESC relocation types were added in [#2752785](https://android-review.googlesource.com/c/platform/bionic/+/2752785) after the RISC-V psABI standardized them ([psABI issue #94](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/issues/94)), resolving [android-riscv64#3](https://github.com/google/android-riscv64/issues/3). Full relocation coverage: R_RISCV_64, R_RISCV_JUMP_SLOT, R_RISCV_RELATIVE, R_RISCV_IRELATIVE, R_RISCV_COPY, all TLS variants (DTPMOD64, DTPREL64, TPREL64), and TLSDESC.

### 4.5 libm (`libm/fenv-riscv64.c`)

Implements all `fenv.h` functions via inline RISC-V CSR instructions (frcsr/fscsr, frflags/fsrm/frrm). `feenableexcept` correctly returns -1 (RISC-V hardware has no FP trap-on-exception support). `fegetexcept` returns 0. Higher-level math functions (fma, fmax, fmin, lrint, llrint, lround, round) are handled via clang compiler builtins, matching arm64 policy. There is no equivalent of `libarm-optimized-routines` for RISC-V; generic C math from FreeBSD/NetBSD is used for functions not covered by clang builtins.

### 4.6 Kernel UAPI headers (`libc/kernel/uapi/asm-riscv/asm/`, 39 files)

Auto-generated from the Linux kernel. Notable entries: `hwcap.h` (COMPAT_HWCAP_ISA_* bits for I, M, A, F, D, C, V), `hwprobe.h` (struct riscv_hwprobe with 48+ RISCV_HWPROBE_EXT_* constants including Zba, Zbb, Zbs, V, Zvbb, Zvkb, Zfh, ZTSO, ZACAS), `ptrace.h`, `unistd_64.h`, `elf.h`, `sigcontext.h`, `ucontext.h`. `__riscv_hwprobe()` was moved to the vDSO in [#2681597](https://android-review.googlesource.com/c/platform/bionic/+/2681597) to avoid a full syscall round-trip. One unique SYSCALLS.TXT entry: `__riscv_flush_icache:riscv_flush_icache(void*, void*, unsigned long) riscv64`.

### 4.7 API additions (Android V / API 35)

`__riscv_flush_icache(void* start, void* end, unsigned long flags)` in `<sys/cachectl.h>`; `__riscv_hwprobe(struct riscv_hwprobe* pairs, size_t pair_count, size_t cpu_count, unsigned long* cpus, unsigned int flags)` in `<sys/hwprobe.h>`; `__riscv_hwprobe_t` function-pointer typedef for riscv64 ifunc resolvers. `docs/status.md` mentions riscv64 exactly once, for these two additions.

### 4.8 Known open correctness gap: page-fault read/write disambiguation

[android-riscv64#118](https://github.com/google/android-riscv64/issues/118) (open): the kernel cannot distinguish read vs. write for page faults on riscv64. x86_64, i386, ARM, and AArch64 all extract fault-type from architecture registers; riscv64 has no equivalent path and falls through to `ReadOrWrite::UNKNOWN`. Referenced Gerrit change: [system/core/+/2812873](https://android-review.googlesource.com/c/platform/system/core/+/2812873). This is a genuine platform-level correctness gap, not merely a performance item.

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build system

Android Bionic uses Soong (`Android.bp` files) exclusively. There is no CMakeLists.txt, no configure script, and no `-DUSE_X=OFF`-style flag anywhere in the repository (re-confirmed by direct fetch this cycle). The build is driven via:

```
source build/envsetup.sh
lunch aosp_cf_x86_64_phone-trunk_staging-userdebug
cd bionic
mm
```

For wide-impact changes: `make checkbuild` ("a regular make will not build the entire tree; just the minimum number of projects" required). The NDK's `android.toolchain.cmake` contains one riscv64-relevant line (`elseif(ANDROID_TOOLCHAIN_NAME MATCHES "^riscv64-") set(CMAKE_ANDROID_ARCH_ABI riscv64)`) for third-party NDK consumers building against Bionic, not for building Bionic itself.

### 5.2 Toolchain

Android is Clang/LLVM-only. GCC was fully removed before riscv64 was added; NDK r23 removed `libgcc` entirely, replacing it with LLVM's `libunwind` and `libclang_rt`, so no GCC minimum version applies at all. NDK toolchain tags: NDK r27/r27c use `clang-r522817`/`clang-r522817c`; NDK r28 uses `clang-r530567b`. No explicit minimum Clang version string is documented in the Bionic repository for riscv64; version pinning happens indirectly via these NDK toolchain prebuilt tags rather than a documented minimum.

Known LLVM bug for riscv64: frame pointer addresses were implemented incorrectly. Bionic applies a -16 byte offset workaround in `android_unsafe_frame_pointer_chase.cpp` ([LLVM D87579](https://reviews.llvm.org/D87579)). Shadow Call Stack is enabled for riscv64 in tests via `cflags: ["-fsanitize=shadow-call-stack"]`.

### 5.3 riscv64 source layout in build files

`libc/Android.bp`: `arch-riscv64/bionic/` (5 files) and `arch-riscv64/string/` (15 RVV files); version script `libc.riscv64.map`. `linker/Android.bp`: `riscv64: { srcs: [":linker_sources_riscv64"] }`, mapping to `arch/riscv64/begin.S`, `arch/riscv64/tlsdesc_resolver.S`, `arch/riscv64/linker_wrapper_begin.S`; uses the shared `linker.generic.map` version script (same as arm64/x86/x86_64).

### 5.4 Page size

riscv64 does not support 16 KiB page sizes in the NDK, unlike arm64 and x86_64, which gained 16 KiB support in NDK r27/r28.

### 5.5 Host testing and QEMU

`build/run-on-host.sh` (the only host-execution script in the repository) has exactly one `TARGET_ARCH` conditional: `if [ ${TARGET_ARCH} = x86 -o ${TARGET_ARCH} = x86_64 ]`. Any other value, including riscv64, causes it to print `"$0 not supported on TARGET_ARCH=$TARGET_ARCH"` and exit; this was re-confirmed by direct fetch this cycle. No QEMU invocation or riscv64 emulator setup script exists anywhere in the Bionic repository itself. QEMU is used only indirectly, via Cuttlefish, for riscv64 Android emulation testing outside Bionic's own tree: QEMU >= 8.1 is required, QEMU 9.0 fixes the V extension, and QEMU 9.2 adds V-extension speedups. This is inferred from external Cuttlefish/emulator context, not documented inside the Bionic repo.

### 5.6 Infrastructure Dockerfile

The NDK provides one Dockerfile (`infra/docker/Dockerfile`), based on Ubuntu 14.04 (Trusty), installing only bison, build-essential, curl, flex, git, make, pbzip2, python, python-pip, texinfo, uuid-runtime, and zip. It contains no riscv64 toolchain, no QEMU, and no cross-compiler, and predates riscv64 support.

## 6. Feature Coverage and Gap Analysis vs. arm64 and amd64

| Feature | arm64 | amd64 | riscv64 | Notes |
|---|---|---|---|---|
| Syscall stub | Hand-written asm | Hand-written asm | Hand-written asm | Full parity |
| setjmp/longjmp | Hand-written asm | Hand-written asm | Hand-written asm | Full parity; cookie mangling present on all three |
| Shadow Call Stack | x18 register | N/A | gp (x3) | riscv64 uses gp after April 2023 switch |
| Hardware SCS | Via Pointer Authentication (future) | N/A | Via Zisslpcfi (future) | Neither is deployed; both tracked as open issues (#14, #15) |
| String/mem ops | NEON in libarm-optimized-routines | SSE/AVX via generic | RVV in arch-riscv64/string/ | SiFive-contributed; 15 functions covered |
| IFUNC dispatch | hwcap passed to resolvers | hwcap passed | hwcap passed (fixed Aug 2023) | Fixed in #2695693; measured zero top apps using ifuncs on any arch as of Aug 2023 |
| TLSDESC | Full | Full | Full (since Sep 2023) | Required psABI standardization before implementation |
| vDSO for hwprobe | N/A | N/A | Yes (since Jul 2023) | RISC-V-specific capability query mechanism |
| fenv (FP trap-on-exception) | Supported | Supported | Not supported (hardware limitation) | feenableexcept returns -1; correctly documented behavior, not a bug |
| __memcmp16 (String.compareTo) | Hand-written asm | Hand-written asm | Portable C fallback | Open, [android-riscv64#161](https://github.com/google/android-riscv64/issues/161) |
| Page-fault read/write disambiguation | Supported | Supported | Not supported | Open, [android-riscv64#118](https://github.com/google/android-riscv64/issues/118); falls through to UNKNOWN |
| libm optimized routines | libarm-optimized-routines | Arch-tuned | FreeBSD/NetBSD generic C | No RISC-V equivalent of libarm-optimized-routines |
| 16 KiB page size | Yes (NDK r27+) | Yes | No | Not supported |
| LTO ABI correctness | OK | OK | Bug (open, [#61](https://github.com/google/android-riscv64/issues/61)) | -mcpu/-march not correctly propagated during LTO |
| Rust build-flag parity | Full CPU-variant LD flags | Full | Partial (fixed, closed Aug 2025) | [android-riscv64#166](https://github.com/google/android-riscv64/issues/166): C/C++ builds got CPU-variant flags, Rust LinkFlags initially only got arch-level flags |

Data not available: quantitative delta for any function pair (memcpy, strlen, strcmp) between riscv64 and arm64.

## 7. CI/CD Infrastructure

No riscv64-specific CI exists in the Bionic source repository, confirmed by direct fetch of every relevant file, re-verified across multiple independent passes this cycle with matching results each time:

- **`TEST_MAPPING`**: three top-level keys only (`presubmit`, `hwasan-presubmit`, `kernel-presubmit`), no riscv64 or architecture-specific tags of any kind.
- **`PREUPLOAD.cfg`**: only `clang_format`, an AOSP SHA-verification hook, and `tools/update_notice.sh`; no architecture-specific hooks.
- **`build/run-on-host.sh`**: the only `TARGET_ARCH` conditional gates on x86/x86_64; riscv64 falls through unhandled and exits.
- **`/build/` directory**: three files total (`coverage.sh`, `NOTICE`, `run-on-host.sh`); no CI pipeline files.
- **Repository root listing**: no `.github/`, no `.gitlab-ci.yml`, no `Jenkinsfile`, no buildbot configuration of any kind.
- **lore.kernel.org**: Bionic has no LKML/lore.kernel.org presence at all; it is not a kernel-mailing-list project.
- **External CI search**: a WebSearch substitute for "Bionic riscv64 CI buildbot jenkins gitlab" surfaced only an unrelated `bionic-build-status` Jenkins mailing list from 2015-2016 (pre-riscv64 era, referencing flounder/grouper/hammerhead Nexus devices on arm/arm64/x86 only). No riscv64 CI system for Bionic exists anywhere it was possible to check.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Presubmit/CI gating | Yes (TEST_MAPPING) | Yes (TEST_MAPPING) | No |
| Host-execution test script support | Yes | No (also not in run-on-host.sh's x86/x86_64 gate) | No |
| External buildbot/Jenkins/GitLab CI | Unknown, not the focus of this report | Unknown | None found |
| ci.android.com build-only column | Presumed yes | Presumed yes | [NEEDS VERIFICATION] -- page is JS-rendered, could not be fetched directly |

**Unresolved point:** whether `ci.android.com`'s branch grid currently runs an `aosp_cf_riscv64_phone` build-only column. This page renders via JavaScript and returns no static content via direct fetch across every attempt made this cycle, so it is correctly left [NEEDS VERIFICATION] rather than asserted either way. A 2023-10 Google Open Source blog post says canary builds "will soon be available on Android's public CI" (future tense) and gives a local `lunch aosp_cf_riscv64_phone-userdebug` build command; this is a local-build instruction, not confirmed evidence of an active CI pipeline.

Testing known to occur: functional verification on Cuttlefish (QEMU-based Android emulator). QEMU >= 8.1 required; QEMU 9.0 fixes the V extension; QEMU 9.2 adds V-extension speedups. Boot to Android home screen takes approximately 10 minutes even on fast Xeon hardware. No physical hardware CI is documented. [android-riscv64#163](https://github.com/google/android-riscv64/issues/163) (open) reports Cuttlefish crashing with signal 11 on GCP Debian 11 VMs (suspected EGL/Vulkan/display driver incompatibility) -- an infrastructure issue, not Bionic code, but one that blocks the QEMU/Cuttlefish validation path Bionic testing relies on.

## 8. Distribution and Release Status

**In Android:** riscv64 is a first-class source target in AOSP `main` since October 2022. Android 14 (API 34, October 2023) was the first release with official riscv64 support. NDK r27 (2024) was the first NDK release with a riscv64 sysroot; it is explicitly marked "not supported," intended for OS-vendor bringup only (`meta/abis.json` sets `"default": false`).

**As a standalone package in Linux distributions:** confirmed via direct package-index checks that Android Bionic does not exist as a standalone binary package anywhere:

- **Ubuntu 26.04 "resolute"**: no package literally named `bionic`, `python3-bionic`, or `libbionic` exists (checked via the official package search and confirmed by direct curl after two WebFetch 503s). The only name matches are unrelated wallpaper-theme packages whose names merely end in `-bionic`, referencing Ubuntu 18.04's "Bionic Beaver" codename: `budgie-wallpapers-bionic`, `ubuntu-mate-wallpapers-bionic`, `ubuntu-wallpapers-bionic`, `ubuntukylin-wallpapers-bionic`, `ubuntustudio-wallpapers-bionic`, `xubuntu-community-wallpapers-bionic`, `xubuntu-wallpapers-bionic`. One of these (`ubuntu-wallpapers-bionic`) was checked directly: its only build is `Architecture: all`, not riscv64-specific and not the same project.
- **Arch Linux RISC-V** (archriscv.felixc.at): no listing for a "bionic" package of any kind.
- **PyPI**: `bionic` resolves to Uber's unrelated Python dataflow-orchestration framework (latest 0.11.1, pure-Python wheels/sdist, no platform-specific tags, no riscv64 in any filename). This is a name collision, not evidence about Android Bionic.
- **GNU Guix**: the only packaged form anywhere is `android-bionic-uapi` (version 7.1.2_r36), which is headers-only, copying `libc/kernel/uapi` headers, and produces no compiled binary for any architecture including riscv64. Guix does not officially support riscv64 as a host system in its mainline distribution either.

There is no channel, upstream or downstream, where a riscv64 Bionic binary can be obtained today. A user who wants working riscv64 Bionic must build AOSP `main` from source and target `aosp_cf_riscv64_phone`, running under Cuttlefish/QEMU; there is no installable package or prebuilt image path.

## 9. Dependencies

| Dependency | Role | Relation | Criticality | riscv64 Status |
|---|---|---|---|---|
| LLVM | Sole compiler/toolchain (GCC fully removed) | Build-dependency | Critical | Builds; open LTO ABI/-mcpu/-march propagation bug ([android-riscv64#61](https://github.com/google/android-riscv64/issues/61)); frame-pointer bug worked around in Bionic itself ([LLVM D87579](https://reviews.llvm.org/D87579)) |
| libunwind | Stack unwinding for linker/exception handling; REGISTERS_RISCV defined | Runtime-dependency | Critical | Builds; official LLVM docs do not list riscv64 as officially supported, relies on DWARF metadata [NEEDS VERIFICATION] |
| Linux kernel | Syscall ABI / UAPI headers (39 files in libc/kernel/uapi/asm-riscv/) | Runtime-dependency | Critical | riscv64 UAPI header set leaner than arm64; some subsystem headers possibly missing; page-fault read/write type not exposed to userspace ([android-riscv64#118](https://github.com/google/android-riscv64/issues/118), open) |
| zlib | Compression (APK/ZIP loading) | Runtime-dependency | Optional | Builds (pure C, no arch exclusions); no RVV optimizations, generic C only, no known correctness blockers |
| jemalloc | Alternate heap allocator for low-memory configs | Runtime-dependency | Optional | Builds via generic GCC atomic backends; quantum-size/vaddr-bits assumptions for riscv64 not formally validated [NEEDS VERIFICATION]; open, unresolved upstream question on Scudo-vs-jemalloc tuning ([android-riscv64#164](https://github.com/google/android-riscv64/issues/164), closed without resolution) |
| ICU | Unicode/timezone data, via libicu4x_bionic Rust FFI | Runtime-dependency | Optional | Builds; ICU4C does not list riscv64 as officially tested, correctness not formally validated [NEEDS VERIFICATION] |
| LLVM libc | Selected libc function implementations, linked as whole_static_libs | Runtime-dependency | Optional | Builds; riscv64 support not documented in official LLVM-libc platform docs, gaps possible [NEEDS VERIFICATION] |
| Scudo | Default hardened allocator (part of LLVM compiler-rt) | Runtime-dependency | Critical | Builds via generic Linux platform layer; no riscv64-specific tuning, allocator parameters not validated as optimal; subject of the same open jemalloc-comparison question above |
| Rust | Used for select components (e.g. crash_dump-adjacent build config) | Build-dependency | Optional | riscv64 C/C++ builds get CPU-variant compiler flags but Rust's LinkFlags historically only got architecture-level flags, a parity gap ([android-riscv64#166](https://github.com/google/android-riscv64/issues/166), closed 2025-08-26); separately, an open Gerrit change ([#2320311](https://android-review.googlesource.com/c/platform/bionic/+/2320311)) proposes disabling a Rust dependency for riscv64 apex builds, unresolved since 2022 |
| QEMU | Emulation backend for Cuttlefish-based riscv64 Android testing | Test-dependency | Critical | QEMU >= 8.1 required; 9.0 fixes the V extension; 9.2 adds V-extension speedups; Cuttlefish itself has an open GCP/Debian-11 crash bug ([android-riscv64#163](https://github.com/google/android-riscv64/issues/163)) that blocks this validation path on that specific host configuration |
| googletest | Test framework for bionic unit tests (e.g. sys_ptrace_test.cpp) | Test-dependency | Critical | Builds and runs under Cuttlefish/QEMU; specific riscv64 test-coverage gap open ([android-riscv64#5](https://github.com/google/android-riscv64/issues/5), needs an instruction writing >64 bits) |

**Additional dependencies identified via source/build-file inspection, not in the direct-dependency list above but load-bearing for the port:** `libbase` and `liblog` (Android platform utility libraries used by the linker, build via generic rules, no riscv64-specific issues found); `libarm-optimized-routines` (not applicable to riscv64; it is ARM-only, and riscv64 uses `arch-riscv64/string/` instead, meaning there is no RVV-optimized-routines equivalent for the functions this library would otherwise cover on arm64 -- see Section 13.2).

A dependency-graph query against Ubuntu 26.04 riscv64 package availability and transitive `hasDependency` chains for each of the above was planned for this cycle but the project-graph MCP server was unreachable (`CONNECTION_CLOSED`) every time it was attempted. This is a tool/connection failure, not an empty result, and should be re-run once that server is reachable rather than treated as "no riscv64 packages found" for any of the above.

## 11. Known Bugs and Active Issues

**Tracker status:** 60 open issues on [github.com/google/android-riscv64](https://github.com/google/android-riscv64/issues) as of 2026-09-30; no open issue postdates 2025-09-11 (#167 is the newest).

### Correctness bugs, open

| Issue | Title | Notes |
|---|---|---|
| [#118](https://github.com/google/android-riscv64/issues/118) | Kernel: can't distinguish read vs. write for page faults on rv64 | x86_64/i386/ARM/AArch64 all extract fault-type from arch registers; riscv64 has no equivalent, falls through to ReadOrWrite::UNKNOWN. References Gerrit [system/core/+/2812873](https://android-review.googlesource.com/c/platform/system/core/+/2812873) |
| [#61](https://github.com/google/android-riscv64/issues/61) | Fix ABI and -mcpu/-march propagation for LTO | Labeled bug, llvm. References LLVM patches D132843, D71387, D72245, D102582, D106347 |
| [#58](https://github.com/google/android-riscv64/issues/58) | Fix platform:Android bugs in llvm-project | Labeled bug, llvm |
| [#15](https://github.com/google/android-riscv64/issues/15) | Hardware CFI (Zisslpcfi landing pads) not supported | Security/correctness (ABI) |
| [#14](https://github.com/google/android-riscv64/issues/14) | Hardware Shadow Call Stack not supported | Security/correctness |
| [#112](https://github.com/google/android-riscv64/issues/112) | Add CTS test for Zimop | Test-coverage gap for "may-be-operation" instructions |
| [#5](https://github.com/google/android-riscv64/issues/5) | bionic sys_ptrace_test.cpp needs an instruction writing >64 bits | Test-coverage gap |

### Performance bugs and gaps, open

| Issue | Title |
|---|---|
| [#167](https://github.com/google/android-riscv64/issues/167) | Support vector regalloc for RISC-V backend in ART |
| [#165](https://github.com/google/android-riscv64/issues/165) | ART: revisit intrinsics to use V and B extensions |
| [#161](https://github.com/google/android-riscv64/issues/161) | ART: implement custom __memcmp16 (portable-C fallback vs. hand-written asm on all other arches) |
| [#153](https://github.com/google/android-riscv64/issues/153) | Implement MethodHandleInvokeExact intrinsic for riscv64 |
| [#148](https://github.com/google/android-riscv64/issues/148) | ART: implement optimizations with Zbs extension |
| [#147](https://github.com/google/android-riscv64/issues/147) | ART: implement BitstringTypeCheck for RISC-V |
| [#141](https://github.com/google/android-riscv64/issues/141) | ART: unimplemented intrinsics (full list in code_generator_riscv64.h, UNIMPLEMENTED_INTRINSIC_LIST_RISCV64) |
| [#140](https://github.com/google/android-riscv64/issues/140) | external/brotli: optimization ("impossible?") |
| [#71](https://github.com/google/android-riscv64/issues/71) | Enable V/vector-crypto in clang driver defaults once working in Cuttlefish |
| [#69](https://github.com/google/android-riscv64/issues/69) | LLVM function multi-versioning for riscv64 |
| [#68](https://github.com/google/android-riscv64/issues/68) | Binary-size/fixup analysis, aosp aarch64 vs riscv64 (proposal only, no data yet) |
| [#67](https://github.com/google/android-riscv64/issues/67) | Compiler-stats comparison aarch64 vs riscv64: spill counts, inlining (proposal only, no data yet) |
| [#66](https://github.com/google/android-riscv64/issues/66) | external/libaom: optimization |
| [#62](https://github.com/google/android-riscv64/issues/62) | Enable -msave-restore at -Oz |
| [#60](https://github.com/google/android-riscv64/issues/60) | Investigate the status of SLP vectorizer |
| [#59](https://github.com/google/android-riscv64/issues/59) | frameworks/av: optimization |
| [#53](https://github.com/google/android-riscv64/issues/53) | Kernel: crypto optimization |
| [#39](https://github.com/google/android-riscv64/issues/39) | external/skia: optimization |
| [#37](https://github.com/google/android-riscv64/issues/37) | external/libpng: optimization |
| [#36](https://github.com/google/android-riscv64/issues/36) | external/boringssl: optimization |
| [#35](https://github.com/google/android-riscv64/issues/35) | external/libjpeg-turbo: optimization |
| [#34](https://github.com/google/android-riscv64/issues/34) | external/libmpeg2: optimization |
| [#33](https://github.com/google/android-riscv64/issues/33) | external/libhevc: optimization |
| [#32](https://github.com/google/android-riscv64/issues/32) | external/libavc: optimization |
| [#29](https://github.com/google/android-riscv64/issues/29) | external/flac: need V optimization |
| [#13](https://github.com/google/android-riscv64/issues/13) | external/aac: inline assembler |
| [#2](https://github.com/google/android-riscv64/issues/2) | Scudo CRC32 optimization |
| [#163](https://github.com/google/android-riscv64/issues/163) | Cuttlefish fails with signal 11 on GCP Debian 11 (infra, blocks the QEMU/Cuttlefish validation path, not Bionic code itself) |

### Profiling/tooling/documentation, open (lower severity, still tracked)

[#97](https://github.com/google/android-riscv64/issues/97) (what PMUs would be useful for simpleperf); [#100](https://github.com/google/android-riscv64/issues/100)-[#103](https://github.com/google/android-riscv64/issues/103) (NDK docs gaps: ABI/cpu-features guides, CDD, not yet updated for riscv64); [#75](https://github.com/google/android-riscv64/issues/75) (kernel: missing hardware breakpoint support); [#70](https://github.com/google/android-riscv64/issues/70) (CTS test for core-feature homogeneity).

### Recently closed issues relevant to Bionic

| Issue | Title | Opened | Closed status | Notes |
|---|---|---|---|---|
| [#168](https://github.com/google/android-riscv64/issues/168) | Prebuilt android OS Image for RISCV | 2025-10-04 | Closed | User support request for a flashable image for the Banana Pi BPI-F3; not a Bionic code issue |
| [#166](https://github.com/google/android-riscv64/issues/166) | Missing CPU Variant LD flags in Rust LinkFlags | 2025-08-26 | Closed | riscv64 C/C++ builds get CPU-variant compiler flags but Rust's LinkFlags only got architecture-level flags; reporter MrArtemSid points at riscv64_device.go |
| [#164](https://github.com/google/android-riscv64/issues/164) | Question about malloc performance | 2025-04-08 | Closed, no resolution visible | Alibaba contributor (MaoHan001) compares Scudo vs. jemalloc (memset overhead, prefetching, mmap frequency) and asks about tuning Scudo's zero_contents; directly relevant to Section 9's allocator discussion |
| [#162](https://github.com/google/android-riscv64/issues/162) | Structure accesses with NDK r27 produce more instructions than expected | Closed | Missed optimization: 3-byte struct read generates 3x lbu instead of 1x lhu + 1x lbu; LLVM backend not exploiting Zbb |
| [#160](https://github.com/google/android-riscv64/issues/160) | $x.* symbol in libc.so | 2025-03-06 | Closed | simpleperf cpu-cycles profile showed $x.0 at 6.37%, __svfscanf at 3.71%, $x.5 at 1.48%; $x.* entries are compiler-generated mapping symbols, not real functions, so this is a profiling-infrastructure gap, not an identified hotspot |
| [#111](https://github.com/google/android-riscv64/issues/111) | clang driver: enable fast unaligned access for android | Closed | Fast unaligned access was not enabled by default |
| [#8](https://github.com/google/android-riscv64/issues/8) | What's the ifunc story? hwcap.h | Closed | Linux kernel hwcap.h lacked the V extension bit at filing; ifunc dispatch fragmented by Zb* sub-extension proliferation |

### Only open Gerrit change for riscv64

[Change #2320311](https://android-review.googlesource.com/c/platform/bionic/+/2320311), "Disable Rust dep." (topic: riscv). Confirmed still `NEW`/work-in-progress as of its last update (2024-06-10), unmerged, with the reviewer's own uncertainty about whether it is still needed left unresolved. See Section 2 for the full comment thread.

### Benchmark data

No comparative arm64-vs-riscv64 or absolute-throughput benchmark suite exists publicly for Bionic. The only quantitative performance data found anywhere, across multiple independent search passes:

- **simpleperf profiling breakdown** ([#160](https://github.com/google/android-riscv64/issues/160)): a cpu-cycles report of `libc.so` showed `$x.0` at 6.37 percent, `__svfscanf` at 3.71 percent, `$x.5` at 1.48 percent. Since `$x.*` entries are compiler-generated mapping symbols rather than real functions, this is evidence of a profiling-infrastructure gap, not an identified, attributable hotspot.
- **Cuttlefish/QEMU boot time**: approximately 10 minutes to boot to the Android home screen on fast Xeon hardware. QEMU >= 8.1 required; 9.0 fixes the V extension; 9.2 adds V-extension speedups.
- **Malloc allocator comparison** ([#164](https://github.com/google/android-riscv64/issues/164)): qualitative only, no percentages or timing numbers. Reporter describes three scenarios comparing Scudo vs. jemalloc (Scudo's memset-on-init overhead for large allocations; jemalloc's better prefetching on contiguous access; Scudo's advantage with many small allocations due to jemalloc's mmap-induced page faults).

Data not available: riscv64 vs. arm64 performance comparison for any specific libc function (memcpy, strlen, strcmp, or others). Data not available: riscv64 vs. arm64 application-level performance for any Android workload. No RISE Project blog post (35 posts checked, spanning 2024-05-15 through 2026-09-28) is dedicated to Bionic or contains Bionic-specific benchmark data.

## 12. Objections and Upstream Blockers

**1. NDK ABI not finalized.** Explicitly provisional per NDK release notes; ABI breaks are acknowledged as possible. Application binaries built today may be ABI-incompatible with future Android riscv64 releases. This is the single largest blocking item for production deployment.

**2. No CI for riscv64.** No CI configuration file in the repository targets riscv64 (Section 7). The only on-host build/test script explicitly exits for non-x86 targets. Regressions can merge undetected; the only detection mechanism is manual Cuttlefish/QEMU testing.

**3. LTO ABI correctness bug** (open, labeled bug, [#61](https://github.com/google/android-riscv64/issues/61)). -mcpu/-march flags are not correctly propagated during LTO, a build-system/compiler interaction bug that can silently produce incorrect binaries when LTO is enabled.

**4. Page-fault read/write disambiguation missing** (open, [#118](https://github.com/google/android-riscv64/issues/118)). A genuine platform-level correctness gap versus every other supported architecture, not merely a performance shortfall.

**5. __memcmp16 missing asm** (open, [#161](https://github.com/google/android-riscv64/issues/161)). String.compareTo() uses a portable C fallback on riscv64; every other architecture has hand-written assembler. A measurable performance gap for Java string-heavy workloads.

**6. Unimplemented ART intrinsics** (open, [#141](https://github.com/google/android-riscv64/issues/141)). The gap is larger than on arm64 or x86_64; these fall back to slower non-optimized paths.

**7. Hardware security features not deployed.** Hardware CFI via Zisslpcfi landing pads ([#15](https://github.com/google/android-riscv64/issues/15)) and hardware Shadow Call Stack via Zisslpcfi ([#14](https://github.com/google/android-riscv64/issues/14)) are open with no target date; the current software SCS via the gp register is a stop-gap.

**8. QEMU-only testing, and the validation path itself is unreliable.** No physical hardware CI path exists. QEMU 9.0+ is required for correct V extension behavior. Boot time is approximately 10 minutes. Cuttlefish itself is failing on at least one common cloud host configuration ([#163](https://github.com/google/android-riscv64/issues/163), open, GCP Debian 11), meaning the primary validation mechanism for riscv64 changes has its own open reliability gap.

**9. No RISC-V libm optimization library.** `libarm-optimized-routines` provides highly tuned math and string routines for arm64; there is no equivalent for riscv64. Math performance relies on FreeBSD/NetBSD generic C and clang builtins.

**10. Profiling infrastructure gap.** Compiler-generated $x.* mapping symbols in libc.so obscure real function names during cpu-cycles profiling ([#160](https://github.com/google/android-riscv64/issues/160)), making hotspot analysis unreliable until fixed.

**11. Google-controlled governance, single point of contribution risk.** All OWNERS-file entries are Google employees (Section 1). External contributors, including the companies that have already contributed substantial riscv64 code (Alibaba, SiFive), cannot merge without Google Code-Review+2. There is no path for a non-Google party to hold commit authority regardless of contribution volume or quality. The one open Gerrit change ([#2320311](https://android-review.googlesource.com/c/platform/bionic/+/2320311)) has sat unresolved for over two years partly because of exactly this dynamic: the non-Google submitter never got a clear answer from the Google owner and no third party can force resolution.

**12. RISE involvement is nominal, not substantive.** The System Libraries Working Group's stated scope covers "Android, C runtimes," and its elected lead (Ruinland Chuan-Tzu Tsai, Andes Technology) has a stated background in Android and C-runtime work, but no funded RISE RFP deliverable names Bionic specifically. A tracking stub exists (`riseproject-dev/system-libraries-wg` issue #1, titled "bionic," body text "Android's C library.", status "Done") but it contains no technical content, no linked PRs, and no scope beyond the one sentence; its author's GitHub handle is consistent with this report's own byline, so it should not be read as an independent RISE commitment to Bionic without further corroboration. No RISE blog post (35 checked) covers Bionic.

## 13. Readiness Assessment

- **Color:** orange (no-upstream-ci-no-distro)
- **Release provider:** none

No riscv64 upstream CI exists: `TEST_MAPPING` has no riscv64/architecture tags, `PREUPLOAD.cfg` has no arch-specific hooks, and the only host-execution script, [`build/run-on-host.sh`](https://android.googlesource.com/platform/bionic/+/refs/heads/main/build/run-on-host.sh), gates on `TARGET_ARCH = x86 -o TARGET_ARCH = x86_64` and exits unsupported for riscv64, confirmed by direct fetch of the repo root; no `.github/`/CI config of any kind exists. No distribution ships a compiled riscv64 Bionic package to trigger the distro floor: Ubuntu 26.04 "resolute" has no `bionic`/`python3-bionic`/`libbionic` package (only unrelated `*-wallpapers-bionic` theme packages), and the only packaged form anywhere is GNU Guix's `android-bionic-uapi`, which is headers-only and produces no compiled binary. Google's own NDK r27 riscv64 sysroot exists but is explicitly documented as "not supported" (OS-vendor bringup only, `meta/abis.json` sets `default: false`), so it does not count as a consumable upstream release either, hence `release_provider: none` rather than `upstream`. This is not "broken" (extensive, functional riscv64 source exists and boots under Cuttlefish/QEMU) and not "unknown" (thoroughly researched), so red and grey are both ruled out, leaving orange as the correct primary grade. Neither of the two listed orange subtypes applies exactly: no distro packages Bionic at all, so "downstream-only" does not apply, and Bionic is not an optimization-purpose project (its value proposition is being the platform C library, not out-competing a reference implementation on speed), so "optimization-absent" does not apply either. This is the base Step-1 "no upstream CI, no test, no release" row.

**Pending work that could change the grade:** [android-riscv64#61](https://github.com/google/android-riscv64/issues/61) (LTO ABI/-mcpu propagation bug, open) is the most CI/toolchain-adjacent open issue that, if resolved alongside an actual CI gate being stood up, would move the grade. Whether `ci.android.com` runs a build-only `aosp_cf_riscv64_phone` column remains [NEEDS VERIFICATION] (JS-rendered page, not independently confirmable); if it does and can be verified, that would materially change the CI finding. The RISE Project System Libraries Working Group lists "Android, C runtimes" in scope and Google is a RISE Premier Member, but no funded RFP deliverable names Bionic specifically; the bare one-line tracking stub (`riseproject-dev/system-libraries-wg` issue #1) has status "Done" but no technical content and should not be read as an independent RISE commitment without further corroboration. No master/umbrella riscv64-CI tracking issue exists; the closest historical analog (RFC #2142912) was abandoned once split into atomic Gerrit changes.

## 14. Investment Analysis

RISE's demonstrated contribution model for this project is direct code contribution by member companies rather than RFP-funded work: SiFive's 15-file RVV string-assembly contribution is the precedent, already accepted and merged. No RISE-funded deliverable currently covers any of the gaps below, so none of this sizing double-counts RISE-covered work.

### 14.1 Functional Enablement

The core Bionic riscv64 port is complete. The five essential libc assembly files (syscall, setjmp, clone, vfork, exit), the dynamic linker entry and TLSDESC resolver, and all fenv functions are present and production-quality. Functional gaps relative to arm64 are confined to: the page-fault read/write disambiguation gap in the kernel-facing path ([#118](https://github.com/google/android-riscv64/issues/118)), ART intrinsics, and __memcmp16. No functional blocker prevents running Android on riscv64 hardware today; the NDK ABI being provisional is a stability/compatibility risk, not an execution blocker. `__memcmp16` and the ART intrinsics live outside Bionic itself, in ART's code generator.

### 14.2 Performance Optimization

Identified performance gaps with no current owner: no RISC-V equivalent of `libarm-optimized-routines` for math functions; `__memcmp16` portable-C fallback vs. hand-written asm (quantitative gap: data not available); unimplemented ART intrinsics (quantitative gap: data not available); the $x.* profiling-symbol gap that prevents identifying further hotspots in libc.so; SLP vectorizer effectiveness ([#60](https://github.com/google/android-riscv64/issues/60)), not yet characterized; zlib has no RVV optimizations; multiple media/codec libraries have open optimization issues (boringssl #36, libjpeg-turbo #35, libmpeg2 #34, libhevc #33, libavc #32, flac #29, libpng #37, skia #39, libaom #66, brotli #140, AAC #13).

### 14.3 CI/CD Infrastructure

No riscv64 CI exists. This is the highest-risk structural gap: the architecture has no automated regression detection, and the informal validation path that does exist (Cuttlefish/QEMU) itself has an open reliability bug on a common cloud host ([#163](https://github.com/google/android-riscv64/issues/163)). Establishing even a build-only CI for riscv64 would provide a meaningful regression signal; a test-execution CI requires either physical hardware or a maintained QEMU 9.2+ integration. This is unlikely to be addressed by Google for a non-shipping-product architecture and is a direct investment opportunity for a company with riscv64 hardware.

### 14.4 Ecosystem Enablement

The RISE System Libraries WG covers Android/Bionic in its stated scope, but no funded project exists (Section 12). SiFive has already demonstrated the effective pattern: contributing production-quality RVV string assembly (15 files) that was accepted and merged under Google's OWNERS-gated review. This is the established, and currently only proven, contribution model for outside parties. The LTO ABI correctness bug ([#61](https://github.com/google/android-riscv64/issues/61)) is a compiler/build-system issue that benefits all Android riscv64 users; it has LLVM patch references (D132843 et al.) but remains open.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix LTO ABI / -mcpu/-march propagation ([#61](https://github.com/google/android-riscv64/issues/61)) | 4-8 | LLVM/Bionic | Critical |
| Functional | Fix page-fault read/write disambiguation on riscv64 ([#118](https://github.com/google/android-riscv64/issues/118)) | 2-4 | Kernel/Bionic | High |
| Functional | Implement __memcmp16 in RVV asm ([#161](https://github.com/google/android-riscv64/issues/161)) | 1-2 | ART/Bionic | High |
| Functional | Implement unimplemented ART intrinsics ([#141](https://github.com/google/android-riscv64/issues/141)) | 8-16 | ART | High |
| Functional | Hardware CFI / Zisslpcfi support ([#15](https://github.com/google/android-riscv64/issues/15), [#14](https://github.com/google/android-riscv64/issues/14)) | 8-20 | Bionic/compiler/kernel | High (long-lead) |
| Performance | RVV-optimized libm routines (equivalent of libarm-optimized-routines) | 12-24 | Bionic/libm | High |
| Performance | Fix $x.* profiling symbol gap in libc.so ([#160](https://github.com/google/android-riscv64/issues/160)) | 1-2 | LLVM/Bionic | Medium |
| Performance | RVV-optimized zlib | 4-8 | External (zlib upstream) | Medium |
| Performance | boringssl RVV optimization ([#36](https://github.com/google/android-riscv64/issues/36)) | 4-8 | External/Bionic | Medium |
| Performance | libjpeg-turbo RVV optimization ([#35](https://github.com/google/android-riscv64/issues/35)) | 4-8 | External/Bionic | Medium |
| Performance | Media codec library optimizations (#32, #33, #34, #37, #29, #66, #140) | 24-48 total | External libraries | Low-Medium |
| Performance | SLP vectorizer characterization ([#60](https://github.com/google/android-riscv64/issues/60)) | 2-4 | LLVM | Medium |
| CI/CD | Establish riscv64 build CI (compile-only) | 3-6 | Google/chip company | Critical |
| CI/CD | Fix Cuttlefish/GCP crash blocking QEMU validation ([#163](https://github.com/google/android-riscv64/issues/163)) | 2-4 | Cuttlefish/infra | Critical |
| CI/CD | Establish riscv64 test CI on hardware or QEMU 9.2+ | 8-16 | Chip company with hardware | High |
| CI/CD | Extend run-on-host.sh to support riscv64 | 1-2 | Bionic | Medium |
| Ecosystem | Close android-riscv64#61 upstream LLVM patches | 4-8 | LLVM toolchain team | Critical |
| Ecosystem | NDK riscv64 ABI finalization | Data not available: no public timeline or tracking issue found | Google internal | Blocking |

## 15. References

- [Android Bionic repository](https://android.googlesource.com/platform/bionic)
- [Android Bionic Gerrit review, topic:riscv](https://android-review.googlesource.com/q/project:platform/bionic+topic:riscv)
- [google/android-riscv64 issue tracker](https://github.com/google/android-riscv64/issues)
- [RFC #2142912, Add riscv64 support (abandoned)](https://android-review.googlesource.com/c/platform/bionic/+/2142912)
- [Change #2237209, Add riscv64 to the list of uapi architectures](https://android-review.googlesource.com/c/platform/bionic/+/2237209)
- [Change #2245796, riscv64 syscall stub and seccomp filter generation](https://android-review.googlesource.com/c/platform/bionic/+/2245796)
- [Change #2254947, riscv64: add bionic assembler and string functions (first commit)](https://android-review.googlesource.com/c/platform/bionic/+/2254947)
- [Change #2298684, Add a hack for a RISC-V bug (frame pointer)](https://android-review.googlesource.com/c/platform/bionic/+/2298684)
- [Change #2427910, riscv64 SCS support](https://android-review.googlesource.com/c/platform/bionic/+/2427910)
- [Change #2526531, riscv64: switch from x18 to gp for shadow call stack](https://android-review.googlesource.com/c/platform/bionic/+/2526531)
- [Change #2606625, Implement RVV version mem*/str* for riscv64 (SiFive)](https://android-review.googlesource.com/c/platform/bionic/+/2606625)
- [Change #2681597, riscv64: use vdso for __riscv_hwprobe()](https://android-review.googlesource.com/c/platform/bionic/+/2681597)
- [Change #2695693, riscv64: fix ifuncs, align calling convention](https://android-review.googlesource.com/c/platform/bionic/+/2695693)
- [Change #2752785, Add the risc-v TLSDESC relocations](https://android-review.googlesource.com/c/platform/bionic/+/2752785)
- [Change #3408180, libc: remove riscv64 mem*/str* ifuncs and fallbacks](https://android-review.googlesource.com/c/platform/bionic/+/3408180)
- [Change #2320311, Disable Rust dep. (only open riscv64 WIP change)](https://android-review.googlesource.com/c/platform/bionic/+/2320311)
- [android-riscv64#5, sys_ptrace_test.cpp needs an instruction writing >64 bits](https://github.com/google/android-riscv64/issues/5)
- [android-riscv64#61, Fix ABI and mcpu/march for LTO](https://github.com/google/android-riscv64/issues/61)
- [android-riscv64#92, Enable v extension](https://github.com/google/android-riscv64/issues/92)
- [android-riscv64#118, Kernel: can't distinguish read vs write for page faults on rv64](https://github.com/google/android-riscv64/issues/118)
- [android-riscv64#140, external/brotli optimization](https://github.com/google/android-riscv64/issues/140)
- [android-riscv64#141, ART: unimplemented intrinsics](https://github.com/google/android-riscv64/issues/141)
- [android-riscv64#160, $x.* symbol in libc.so](https://github.com/google/android-riscv64/issues/160)
- [android-riscv64#161, ART: implement custom __memcmp16?](https://github.com/google/android-riscv64/issues/161)
- [android-riscv64#163, Cuttlefish fails with signal 11 on GCP Debian 11](https://github.com/google/android-riscv64/issues/163)
- [android-riscv64#164, Question about malloc performance](https://github.com/google/android-riscv64/issues/164)
- [android-riscv64#166, Missing CPU Variant LD flags in Rust LinkFlags](https://github.com/google/android-riscv64/issues/166)
- [android-riscv64#168, Prebuilt android OS Image for RISCV](https://github.com/google/android-riscv64/issues/168)
- [LLVM D87579, RISC-V frame pointer workaround](https://reviews.llvm.org/D87579)
- [RISC-V psABI issue #18, frame pointer convention](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/issues/18)
- [RISC-V psABI issue #94, TLSDESC relocations](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/issues/94)
- [RISE Project members](https://riseproject.dev/members)
- [RISE Project, Working Group Lead Election Results (2025-03-31)](https://riseproject.dev/2025/03/31/working-group-lead-election-results/)
- [RISE Project, Working Group Elections Results (2026-05-04)](https://riseproject.dev/2026/05/04/rise-project-working-group-elections-results/)
- [RISE Project, RISE Working Groups Move Their Project Tracking to GitHub (2026-07-30)](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/)
- [riseproject-dev/system-libraries-wg, issue #1 "bionic"](https://github.com/riseproject-dev/system-libraries-wg/issues/1)
- [sifive/sifive-libc (source of RVV string contributions)](https://github.com/sifive/sifive-libc)
- [Android and RISC-V: what you need to know (Google Open Source blog, 2023-10)](https://opensource.googleblog.com/2023/10/android-and-risc-v-what-you-need-to-know.html)