---
title: libgcrypt
parent: Project Reports
color: orange
dependencies:
  - name: libgpg-error
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: libcap
    relation: runtime-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libgcrypt" %}

# libgcrypt

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libgcrypt<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libgcrypt is a general-purpose cryptographic library that forms the cryptographic core of the GnuPG software suite. It provides symmetric ciphers (AES, ChaCha20, Camellia, etc.), hash functions (SHA-1, SHA-2, SHA-3/Keccak, BLAKE2, etc.), public-key algorithms (RSA, ECC, DSA), and supporting primitives (PRNG, GHASH/GCM, POLYVAL, Poly1305, CRC). The library is licensed LGPLv2.1+; helper utilities and documentation are GPLv2+.

libgcrypt is hosted on [dev.gnupg.org](https://dev.gnupg.org/source/libgcrypt), a Phabricator-style tracker, with development conducted via patches posted to the [gcrypt-devel@gnupg.org](mailto:gcrypt-devel@gnupg.org) mailing list. There is no GitHub pull-request workflow; the [gpg/libgcrypt](https://github.com/gpg/libgcrypt) GitHub repository is an explicitly unmaintained read-only mirror.

**Governance:** Development and maintenance authority rests with [g10 Code GmbH](https://g10code.com/), a German private company founded by Werner Koch (the original GnuPG author). The project was previously co-supported by GnuPG e.V. (a registered nonprofit association, VR11482 Amtsgericht Dusseldorf, founded 2017-02-08), which voted to dissolve on 2024-08-17; dissolution was registered 2025-02-19. As of 2025 the project is funded exclusively through g10 Code support contracts. Werner Koch retains final commit authority. No `MAINTAINERS` file exists in the repository.

**Key personnel:**

| Name | Affiliation | Role |
|---|---|---|
| Werner Koch | g10 Code GmbH | Founder, lead developer, release manager |
| Jussi Kivilinna | Independent (jussi.kivilinna@iki.fi) | SIMD/performance specialist; sole author of all RISC-V accelerated code, 2025-2026 |
| NIIBE Yutaka | Free Software Initiative of Japan (FSIJ) | KEM and miscellaneous contributions |
| Collin Funk | Independent | Packaging fix for RISC-V source tarball (2025-05) |

Historical AUTHORS entries show institutional affiliations from Intel, Bundesamt fur Sicherheit in der Informationstechnik (BSI), Red Hat, IBM, SUSE, and Alibaba Group, none specific to RISC-V work.

**Community stance on new ports:** There is no documented architecture-tier policy or formal RFC process for adding new architecture support. Architecture-specific acceleration follows a permissive, merit-based model: the generic C path is always compiled; accelerated SIMD paths are conditionally compiled and selected at runtime through the hardware-feature detection layer (hwf). New architecture code is accepted on maintainer review of patches submitted to the mailing list, with no governance vote required. The RISC-V port was added unilaterally by Jussi Kivilinna, consistent with precedent for ARM NEON and x86 AES-NI acceleration. No documented objections to the RISC-V port were found in any reviewed source.

**RISE involvement:** None. libgcrypt, GnuPG, and g10 Code do not appear in the RISE membership list ([riseproject.dev/members](https://riseproject.dev/members): Premier members Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General members Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin, Institute of Software CAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE). A systematic search of the RISE blog (35 posts, 2024-05 through 2026-09), the RISE GitHub organization's 26 repositories (including System Libraries WG and Security Software WG), and the RISE Python wheel-builder project found no libgcrypt-specific content and no funded or sponsored RISC-V work on this project.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the canonical repository at [dev.gnupg.org/source/libgcrypt](https://dev.gnupg.org/source/libgcrypt). There is no downstream fork or carried patch. No single master tracking ticket for a riscv64 port exists on dev.gnupg.org; the work proceeded as a sequence of mailing-list patch sets. All work is by Jussi Kivilinna unless noted.

| Date | Event | Source |
|---|---|---|
| 2024-06-19 | libgcrypt 1.11.0 released; first version to include any RISC-V detection infrastructure | [gnupg.org software page](https://gnupg.org/software/libgcrypt/) |
| 2025-01-06 | Kivilinna posts the initial 6-part patch series: hwf detection (`hwf-riscv.c`), CTZ bit-manipulation, GHASH Zbb+Zbc, vector-permute AES, ChaCha20 RVV intrinsics; benchmarked on SpacemiT K1 at 1600 MHz (ChaCha20: 10.67 to 3.41 ns/byte, roughly 3x) | [msg00143](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00143.html) through [msg00148](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00148.html) |
| 2025-01-27 | Entire initial batch committed upstream (e.g. [commit df9de2a5](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=df9de2a5e5a847fa4f11a923cf3397bf1cf7a562)) | Commit history |
| 2025-02-03 | Fix: GCC on riscv64 emitted conditional branches instead of constant-time carry logic in `mpi/longlong.h`; `CT_DEOPTIMIZE_VAR` macro introduced (architecture-generic inline-asm barrier, added specifically for this RISC-V codegen issue) | gcrypt-devel, February 2025 |
| 2025-05-17 | Collin Funk reports and fixes T7647: `simd-common-riscv.h` missing from the 1.11.1 release tarball, breaking all tarball-based RISC-V builds | [commit b100dd25](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=b100dd25eb6821d58851c2b802bfe9ef2f441228) |
| 2025-05-07 | libgcrypt 1.11.1 released; first release shipping the initial RISC-V acceleration batch | [gnupg.org](https://gnupg.org/software/libgcrypt/) |
| 2025-08-04 | libgcrypt 1.11.2 released (T7647 build fix) | [gnupg.org](https://gnupg.org/software/libgcrypt/) |
| 2025-08-07 | Second batch posted: AES via Zvkned ([msg00348](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00348.html)), SHA-256/SHA-512 via Zvknha/Zvknhb ([msg00346](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00346.html)), bithelp Zbb fix ([msg00344](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00344.html)). All explicitly stated as "tested against QEMU emulator as there is no actual HW available with these instructions yet" | gcrypt-devel, August 2025 |
| 2025-08-09 | AES-Zvkned committed upstream ([commit b000ab60](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=b000ab602531b2c29e93736afc1686dea8ed6782)) | Commit history |
| 2025-08-16 | CRC32/CRC24RFC2440 via Zbb+Zbc posted; SpacemiT K1 benchmarks: CRC32 3.01 to 0.275 ns/byte (~11x), CRC24RFC2440 3.11 to 0.394 ns/byte (~7.9x) | [msg00351](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00351.html) |
| 2025-08 | "Require RISC-V B extension for vector intrinsics implementations" - B (Bitmanip) made mandatory wherever V is used, aligning with the RVA22U64 profile | Commit history |
| 2025-09-20 | Sam James reports LTO builds silently mis-detect RISC-V vector-crypto intrinsic support; Kivilinna fixes by adding `-fno-lto` to the affected `configure.ac` probes | [msg00361](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00361.html) |
| 2026-01-29 | libgcrypt 1.12.0 released: first release shipping AES-Zvkned, SHA-256/512 vector crypto, GHASH-Zvkg, CRC, and POLYVAL/GCM-SIV acceleration for RISC-V | [gnupg.org](https://gnupg.org/software/libgcrypt/) |
| 2026-02-20 | libgcrypt 1.12.1 released | [gnupg.org](https://gnupg.org/software/libgcrypt/) |
| 2026-04-15 | libgcrypt 1.12.2 released | [gnupg.org](https://gnupg.org/software/libgcrypt/) |
| 2026-05-06 | Michael Neuling, testing on real hardware with VLEN != 128, reports a compile/correctness issue with `__riscv_vset_v_u32m1_u32m4` in the Zvkned AES backend; shares an informal candidate fix he describes as "Claude had a go at a fix that works for me" (hosted at a personal GitHub fork, not applied upstream) | [msg00507](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00507.html) |
| 2026-05-06/07 | Kivilinna lands the actual upstream fix the same day: switches to `vslideup`/`vslidedown` to correctly assemble m4 vector-register groups independent of VLEN; validated on qemu-riscv64 at VLEN 128/256/512/1024; Neuling gives `Tested-by` ("This works here. Thanks for the quick turnaround.") | [commit 3f684fc6](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=3f684fc6ab3ac98320e245a06b3563ad37ec56f5), [msg00511](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00511.html) |
| 2026-05-24 | Ubuntu Launchpad bug [#2154120](https://bugs.launchpad.net/ubuntu/+source/gnupg2/+bug/2154120) opened by Michael Neuling, tracking the real-world impact: GPG decrypt on non-128-bit-VLEN riscv64 hardware produced "encrypted message has been manipulated" false-positive integrity failures | Launchpad |
| 2026-06-19 | Ubuntu Stonking ships fix in libgcrypt20 1.12.2-1ubuntu1 | Launchpad bug #2154120 |
| 2026-07-01 | Ubuntu Resolute (26.04 LTS) ships fix in libgcrypt20 1.12.0-2ubuntu1, backporting commit 3f684fc6 as a Debian patch | Launchpad bug #2154120 |
| 2026-07-29 | Inline-asm memory-operand optimization posted for GCM/CRC, removing unnecessary `"memory"` clobbers; Zicclsm-gated alignment handling added | [msg00573](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00573.html) |
| 2026-08-26 | libgcrypt 1.12.3 released, including "avoid byte-wise load/store on RISC-V with Zicclsm" and "use unaligned vector memory access on RISC-V when supported" (RVA22U64/RVA23U64 march restructuring). Only release with a published numeric benchmark on real riscv64 silicon (SpacemiT K1, Camellia128: CBC 39.91 to 32.28 c/b, XTS 40.09 to 32.45 c/b, CFB 40.06 to 31.99 c/b, all ~1.24-1.25x) | NEWS, [msg00573](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00573.html) |
| 2026-09-25 | `tests/basic: add vector cluttering for riscv` (commit `b48416d`) - fills RISC-V vector registers v0-v31 with garbage before self-tests, specifically to catch the class of uninitialized/unwiped vector-register bug already seen twice (see Section 11) | Commit history |

The port is fully upstream; no known pending RISC-V patches sit outside the tree as of the research date. Current release is 1.12.3 (2026-08-26); 1.12.4 is unreleased/in progress.

---

## 3. Upstream Support Tier

libgcrypt has no formal architecture-tier policy. The project publishes no support matrix, does not distinguish tier-1 from tier-2 architectures, and does not designate release-blocking architectures. All acceleration is opt-in via the hwf runtime-detection layer; failure to detect an extension falls back to generic C. There is no CI at all for any architecture (Section 7), so "support tier" in practice is determined by the depth of architecture-specific code, not by any infrastructure guarantee.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hardware feature detection | Yes (hwf-x86.c, CPUID) | Yes (hwf-arm.c, AT_HWCAP) | Yes (hwf-riscv.c, AT_HWCAP + riscv_hwprobe syscall) |
| mpi/ assembly directory | Yes (mpi/amd64/) | Yes (mpi/aarch64/) | No, generic C fallback only |
| AES acceleration | Yes (AES-NI, VAES) | Yes (ARMv8-AES) | Yes (Zvkned, vector-permute fallback) |
| ChaCha20 acceleration | Yes (AVX2, SSSE3) | Yes (NEON) | Yes (RVV intrinsics) |
| GHASH/GCM acceleration | Yes (CLMUL, VPCLMULQDQ) | Yes (PMULL) | Yes (Zbb+Zbc, Zvkg) |
| SHA-256/SHA-512 acceleration | Yes (SHA-NI, AVX2) | Yes (ARMv8-SHA2) | Yes (Zvknha+Zvkb, Zvknhb+Zvkb) |
| SHA-3/Keccak acceleration | Yes (AVX2) | Yes (NEON) | Partial (Zbb ANDN+RORI only, no RVV path) |
| Poly1305 acceleration | Yes (AVX2, SSE2) | Yes (NEON) | No |
| CRC acceleration | Yes | Yes | Yes (Zbb+Zbc) |
| Bignum (mpi/) assembly | Yes | Yes | No |
| Formal tier designation | None | None | None |
| CI coverage | None | None | None |

riscv64 trails amd64 and arm64 in two areas: mpi/ bignum assembly and Poly1305 acceleration. Every other major symmetric-crypto primitive has a riscv64-accelerated path.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libgcrypt organizes architecture acceleration in `cipher/` using per-file C intrinsics or inline assembly, compiled with per-file `-march` flags. `mpi/` holds a separate set of architecture subdirectories for multiprecision-integer assembly (RSA, ECC, DSA); libgcrypt has no JIT backend.

**Hardware feature detection** (`src/hwf-riscv.c`, ~419 lines): detects extensions at runtime through three mechanisms, in order of preference: (1) `getauxval(AT_HWCAP)` / `/proc/self/auxv`, (2) the Linux `riscv_hwprobe` syscall (258), (3) compile-time toolchain macros as fallback. Feature flags: `HWF_RISCV_IMAFDC`, `HWF_RISCV_V`, `HWF_RISCV_B`, `HWF_RISCV_ZBB`, `HWF_RISCV_ZBC`, `HWF_RISCV_ZVKB`, `HWF_RISCV_ZVKG`, `HWF_RISCV_ZVKNED`, `HWF_RISCV_ZVKNHA`, `HWF_RISCV_ZVKNHB`. Vector code paths enforce a VLEN >= 128 guard.

**RISC-V cipher files** (all C intrinsics or inline assembly, no hand-written `.S` files, verified against a direct clone of `gpg/libgcrypt` at HEAD `0f1a1f9`, 2026-09-25):

| File | ISA extensions | Implements | Quality |
|---|---|---|---|
| `cipher/rijndael-riscv-zvkned.c` (1,636 lines) | Zvkned + V | AES-128/192/256: ECB, CBC, CFB, CTR, CTR32LE, OCB, XTS; `vaeskf1`/`vaeskf2` key expansion; VLEN-agnostic since the May 2026 fix | Partial - hand-tuned C intrinsics |
| `cipher/rijndael-vp-riscv.c` (285 lines) | V (vrgather) | Constant-time vector-permute AES fallback for hardware without Zvkned | Partial - C intrinsics |
| `cipher/chacha20-riscv-v.c` (569 lines) | V | ChaCha20 stream cipher, two-tier size dispatch | Partial - C intrinsics, no inline asm |
| `cipher/cipher-gcm-riscv-zbb-zbc.c` | Zbb + Zbc | GHASH/POLYVAL via `clmul`/`clmulh` + `rev8`; Karatsuba GF(2^128) multiply | Full - hand-tuned inline asm |
| `cipher/cipher-gcm-riscv-zvkg.c` | Zvkg + V | GHASH/POLYVAL via dedicated `vghsh` instruction | Partial - C intrinsics |
| `cipher/sha256-riscv-zvknha-zvkb.c` (197 lines) | Zvknha + Zvkb | Full 64-round SHA-256 via `vsha2cl`/`vsha2ch`/`vsha2ms` | Partial - C intrinsics, LLVM-bug fallback |
| `cipher/sha512-riscv-zvknhb-zvkb.c` (190 lines) | Zvknhb + Zvkb | Full 80-round SHA-512, u64m2 registers | Partial - C intrinsics |
| `cipher/crc-riscv-zbb-zbc.c` (514 lines) | Zbb + Zbc | CRC-32 and CRC-24-RFC2440; CLMUL polynomial folding, memory-operand optimized | Full - hand-tuned inline asm |
| `cipher/keccak.c` (inline, `USE_RISCV_ZBB`) | Zbb | SHA-3/Keccak permute via ANDN/RORI | Full - inline asm within existing file, no RVV path |
| `src/hwf-riscv.c` | - | Runtime feature detection | Full - complete, layered |
| `cipher/simd-common-riscv.h` | - | Shared RISC-V SIMD helper macros | Supporting header |

**What is absent for riscv64:**

- `mpi/riscv/` does not exist. `mpi/` has subdirectories for aarch64, amd64, arm, powerpc, sparc, etc., but `mpi/config.links` emits "No working assembler modules available" for `riscv64-*-*`. RSA, DSA, DH, and all ECC point/scalar arithmetic run on the portable `mpi/generic` C fallback. This is the single clearest gap in the riscv64 port - it affects every public-key operation.
- Poly1305: `cipher/poly1305.c` has x86, AArch64, and PPC paths; no RISC-V path.
- SHA-3/Keccak has Zbb acceleration only; no RVV (V-extension) permute path exists.
- No Zkr-based (CSR seed) entropy source was found.
- No hand-written `.S` assembly anywhere in the tree for RISC-V; every accelerated file uses C intrinsics or `asm volatile` inline blocks.

**Wiring:** every accelerated file is registered in `cipher/Makefile.am` with its own per-file `-march` flags, gated by `configure.ac` compile-time capability probes (`HAVE_GCC_INLINE_ASM_RISCV`, `HAVE_COMPATIBLE_CC_RISCV_VECTOR_INTRINSICS`, `HAVE_COMPATIBLE_CC_RISCV_VECTOR_CRYPTO_INTRINSICS`), and selected at runtime via `hwfeatures` bitmask checks with fallback chains (e.g. AES: Zvkned to vector-permute to generic C). This is a genuine tiered runtime-dispatch architecture matching the x86/ARM/PPC pattern, not a stub, with one clear scalar gap (MPI/bignum).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AES symmetric | AES-NI + VAES (asm) | ARMv8 AES intrinsics | Zvkned C intrinsics + vector-permute fallback |
| ChaCha20 | AVX2 + AVX512 | NEON | RVV C intrinsics |
| GHASH/GCM | PCLMULQDQ + VPCLMULQDQ | PMULL | Zbb+Zbc inline asm + Zvkg C intrinsics |
| SHA-256 | SHA-NI + AVX2 | ARMv8-SHA2 | Zvknha+Zvkb C intrinsics |
| SHA-512 | AVX2 | ARMv8-SHA512 | Zvknhb+Zvkb C intrinsics |
| SHA-3/Keccak | AVX2 | NEON | Zbb ANDN+RORI only, no vector path |
| Poly1305 | AVX2 + SSE2 | NEON | Not implemented |
| CRC | PCLMULQDQ | PMULL | Zbb+Zbc inline asm |
| Bignum (mpi/) | Hand-written asm | Hand-written asm | Generic C fallback |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autotools only (`configure.ac`, `AC_PREREQ([2.69])`, `Makefile.am`). There is no `CMakeLists.txt` and no Meson build anywhere in the tree; there are no `-DUSE_X=OFF`-style flags, since that is a CMake idiom this project does not use.

**Native build (no riscv64-specific flags required; extension detection is automatic via configure probes):**

```
./configure
make
make check
make install
```

**Cross-compilation:**

```
./configure --host=riscv64-linux-gnu --build=x86_64-linux-gnu \
  CC=riscv64-linux-gnu-gcc \
  PKG_CONFIG_LIBDIR=/path/to/riscv64/lib/pkgconfig
make
```

`autogen.sh` has no `--build-riscv64` convenience target (only `--build-w32`, `--build-w64`, amd64 are predefined).

**Disabling all RISC-V acceleration:**

```
./configure --disable-asm
```

Sets `try_asm_modules=no`, short-circuiting every RISC-V `AC_CACHE_CHECK` block in `configure.ac`. There are no per-extension flags such as `--disable-riscv-vector`; algorithm selection instead uses the generic `--enable-ciphers=...` / `--enable-digests=...` whitelists.

**Toolchain minimums:**

- **GCC/Clang effectively GCC 14+ (or an equivalent Clang).** The gate is a repeated header-macro check, not an `AC_PREREQ` version test: `#if !(defined(__riscv_v_intrinsic) && __riscv_v_intrinsic >= 12000)`. GCC 14 is the first release shipping RVV intrinsic API version 12000; GCC 13 fails the check and those files fall back to generic C. This gates two configure variables: `gcry_cv_cc_riscv_vector_intrinsics` (plain RVV: ChaCha20, vector-permute AES) and `gcry_cv_cc_riscv_vector_crypto_intrinsics` (Zvkned/Zvknha/Zvknhb/Zvkg: AES, SHA-256/512, GHASH).
- **GCC-14 unaligned-vector-load bug:** GCC 14 emits unaligned vector loads for RVV intrinsics; `configure.ac` probes for `-mstrict-align` support and applies it to plain-RVV files. A July/August 2026 follow-on (Zicclsm gating, see below) narrowed this from a blanket workaround to a conditional one.
- **GCC bug 121485** ([gcc.gnu.org/bugzilla/show_bug.cgi?id=121485](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=121485)): `__riscv_vaes*_vs` intrinsics emit LMUL `m1` instead of `m4`. Detected by compiling a test and grepping the assembly for `"m4"`; sets `HAVE_BROKEN_VAES_VS_INTRINSIC` if absent, with an inline-asm fallback in `rijndael-riscv-zvkned.c`.
- **LLVM issue #151814** ([github.com/llvm/llvm-project/issues/151814](https://github.com/llvm/llvm-project/issues/151814)): `__riscv_vsha2cl_*` emits `vsha2ch.vv` instead of `vsha2cl.vv`. Detected by grepping assembly for `"vsha2cl"`; sets `HAVE_BROKEN_VSHA2CL_INTRINSIC`, falling back to inline asm in the SHA-256 file.
- **LTO:** configure-time intrinsic checks originally used `AC_COMPILE_IFELSE` under `-flto`, which could silently mis-detect vector-crypto support on both GCC and Clang; fixed in two stages, first with `-fno-lto` on the affected probes (Sep 2025), then more robustly by switching to `AC_LINK_IFELSE` (commit `77b98375`, May 2026).

**`-march` scheme (current, from `cipher/Makefile.am`; supersedes the earlier single-flag-per-file scheme, which was replaced in 1.12.3, 2026-08-26):**

```
MARCH_RVA22U64_WITH_VEC = rv64imafdcv_zba_zbb_zbs
MARCH_RVA23U64_BASE     = MARCH_RVA22U64_WITH_VEC [+ _zicclsm if compiler supports it]
```

| Object file(s) | CFLAGS |
|---|---|
| `chacha20-riscv-v.c`, `rijndael-vp-riscv.c` | `-O2 -march=$(MARCH_RVA22U64_WITH_VEC) -mstrict-align` |
| `rijndael-riscv-zvkned.c` | `-O2 -march=$(MARCH_RVA23U64_BASE)_zvkned_zvkb` |
| `sha256-riscv-zvknha-zvkb.c`, `sha512-riscv-zvknhb-zvkb.c` | `-O2 -march=$(MARCH_RVA23U64_BASE)_zvknha_zvknhb_zvkb` |
| `cipher-gcm-riscv-zvkg.c` | `-O2 -march=$(MARCH_RVA23U64_BASE)_zvkg_zvkb` |

`-mstrict-align` is now applied only to the plain-RVV files (needed specifically for the SpacemiT K1, which lacks unaligned vector memory access and has no vector-crypto extensions); the vector-crypto files instead detect Zicclsm (`__riscv_zicclsm >= 1000000`) at configure time and use unaligned access when available. This Zicclsm work, and the parallel scalar-path fix (`bufhelp: avoid byte-wise load/store on RISC-V with Zicclsm`), landed in 1.12.3 and is the only RISC-V change with a published real-hardware benchmark (Section 2).

**QEMU:** the repository ships no Dockerfile and no CI configuration of any kind (verified by direct 404s against `Dockerfile`, `.gitlab-ci.yml`, `.github/workflows/ci.yml`, `.cirrus.yml`, and `build-aux/speedo.mk` on the canonical tree). There is no scripted QEMU procedure. The only record of QEMU use is prose in commit messages: the August 2025 Zvkned/Zvknha/Zvknhb batch states "validated using qemu-riscv64 as no physical hardware was available," and the May 2026 VLEN fix was validated with `qemu-riscv64 -cpu max,vlen={128,256,512,1024}`. All QEMU testing in the project is ad-hoc developer practice, not an automated harness. For external cross-build + `make check`, `qemu-user-static` + `binfmt-support` is the standard pattern and is known to run the full riscv64 test-vector suite successfully (Debian sid buildd shows 0 riscv64 test failures).

**Sole hard build dependency:** `libgpg-error >= 1.56` (`NEED_GPG_ERROR_VERSION=1.56`, checked via `AM_PATH_GPG_ERROR`).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| AES-128/192/256, all major modes | Yes | Yes | Yes (Zvkned + vector-permute) | None |
| AES VLEN>128 correctness | Yes | Yes | Yes (fixed 2026-05-07) | Was a correctness bug; now fixed, see Section 11 |
| ChaCha20 SIMD | Yes | Yes | Yes (RVV) | None |
| GHASH / AES-GCM | Yes | Yes | Yes (Zbb+Zbc, Zvkg) | None |
| SHA-256 | Yes | Yes | Yes (Zvknha; no real-hardware benchmark published) | Performance data on real Zvknha silicon not published |
| SHA-512 | Yes | Yes | Yes (Zvknhb; no real-hardware benchmark published) | Same |
| SHA-3 / Keccak | Yes (AVX2) | Yes (NEON) | Partial (Zbb only, no RVV path) | No RVV Keccak permute |
| Poly1305 | Yes | Yes | No | Missing; limits ChaCha20-Poly1305 AEAD throughput to the generic C Poly1305 path even where ChaCha20 itself uses RVV |
| CRC-32 / CRC-24 | Yes | Yes | Yes (Zbb+Zbc) | None |
| POLYVAL | Yes | Yes | Yes (Zbb+Zbc) | None |
| Bignum / MPI assembly | Yes | Yes | No (generic C) | Performance gap for all RSA, ECC, DSA operations |
| Constant-time MPI carries | Yes | Yes | Yes (`CT_DEOPTIMIZE_VAR`, fixed 2025-02-03) | Fixed; was a security-class issue |

**Performance gaps:** no cross-architecture benchmark (riscv64 vs arm64 vs amd64 on comparable silicon) is published anywhere in the project's commit history or mailing-list archive. The only published numbers are riscv64 before/after comparisons on a single SpacemiT K1 board (CRC32/CRC24 in the August 2025 patch, Camellia128 in the July/August 2026 Zicclsm patch).

Data not available: cross-architecture throughput comparison (amd64 vs arm64 vs riscv64 on equivalent or comparable silicon).

**Security hardening gaps:** the constant-time carry issue in `mpi/longlong.h` (GCC emitting conditional branches instead of `sltu` on riscv64) was fixed 2025-02-03. The VLEN>128 bug in Zvkned AES was a correctness error (wrong ciphertext on VLEN=256+ hardware), not itself a disclosed vulnerability, but it is the class of bug that manifests as silent data-integrity failure; it materialized in production as Ubuntu/Debian bug #2154120 (GPG decrypt false-positive "manipulated" errors) and was fixed upstream 2026-05-07. A related uninitialized-vector-register bug (OCB checksum corruption under QEMU's tail-agnostic all-ones policy, commit `69ca1d2`) was also found and fixed; see Section 11. No known open constant-time or correctness issues remain as of the research date.

---

## 7. CI/CD Infrastructure

libgcrypt has no CI configuration of any kind, for any architecture. This was confirmed through direct inspection, not inference:

- Repository root and full `browse/master` listing at [dev.gnupg.org/source/libgcrypt](https://dev.gnupg.org/source/libgcrypt/) contain only autotools build files and standard doc/license files; no CI config present.
- `.cirrus.yml` returns "Path Does Not Exist" on the canonical tree.
- The [gpg/libgcrypt](https://github.com/gpg/libgcrypt) GitHub mirror (explicitly flagged "Maintainers are not tracking this mirror") has no `.github/workflows/`, no `.cirrus.yml`, and no other CI config.
- Phabricator's own build system, Harbormaster, has no build plan configured for libgcrypt and no riscv/riscv64 reference at all.
- The `tests/` directory contains only manual unit-test programs (`t-*.c`) and one shell script, `basic_all_hwfeature_combinations.sh`, which exercises hardware-feature code paths on whatever machine runs it manually; nothing resembles an automated runner.
- A third-party, unofficial mirror ([gitlab.com/redhat-crypto/libgcrypt/libgcrypt-mirror](https://gitlab.com/redhat-crypto/libgcrypt/libgcrypt-mirror)) does carry a `.gitlab-ci.yml`, but it covers only Fedora/CentOS/Ubuntu on x86_64 and has no riscv64 job; it is not part of the canonical project and has no bearing on upstream release gating.

All RISC-V work has instead been validated through ad-hoc developer testing: the January 2025 batch was benchmarked on physical SpacemiT K1 hardware by Kivilinna; the August 2025 Zvkned/Zvknha/Zvknhb/Zvkg batch was QEMU-only, with no physical hardware available to the author at submission time; the May 2026 VLEN>128 fix was reported on real VLEN=256 hardware by Michael Neuling and validated on QEMU at VLEN 128/256/512/1024. Kivilinna has stated intent to add varied-VLEN test configurations to prevent recurrence of that class of bug, but no CI workflow exists yet to track or enforce it; the September 2026 "vector cluttering" self-test hardening (commit `b48416d`) is a step in that direction but is still a manual `make check` addition, not automated CI.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job | None | None | None |
| Test job | None | None | None |
| Sanitizer job | None | None | None |
| Hardware runner | None | None | None |
| QEMU runner | None | None | None |

No RISE CI runners are used; no RISE-funded work of any kind was found for libgcrypt (Section 1). The only systematic riscv64 build+test coverage comes from downstream distribution build systems (Debian buildd, Arch Linux RISC-V infrastructure), not from the project itself.

---

## 8. Distribution and Release Status

**Current upstream release:** 1.12.3 (2026-08-26). Source-only releases at [gnupg.org/ftp/gcrypt/libgcrypt/](https://gnupg.org/ftp/gcrypt/libgcrypt/); no official upstream binary packages for any architecture. 1.12.4 is unreleased/in progress as of the research date.

**Distribution binary packages:**

| Distribution | Package | riscv64 version | Status |
|---|---|---|---|
| Ubuntu 26.04 "resolute" | libgcrypt20, libgcrypt20-dev, libgcrypt-bin | 1.12.0-2 [ports] | Confirmed live; real `.deb` files present on `ports.ubuntu.com` (e.g. `libgcrypt20_1.12.0-2_riscv64.deb`, 650.3 kB). riscv64 is a ports-tier architecture in Ubuntu, not primary, and at fetch time lagged the amd64/arm64/i386 security rebuild (1.12.0-2ubuntu1.1) by one point release |
| Ubuntu "Stonking" | libgcrypt20 | 1.12.2-1ubuntu1 | Released 2026-06-19; includes the VLEN>128 backport |
| Ubuntu 24.04 "Noble" | libgcrypt20, libgcrypt20-dev | 1.10.3-2build1 | Predates all RISC-V acceleration (which starts at 1.11.1) |
| Debian sid | libgcrypt20 | 1.12.2-1 | Builds and tests pass on builder rv-osuosl-03 |
| Arch Linux RISC-V (archriscv) | libgcrypt | 1.12.4-1 | Confirmed live in `core/`: `libgcrypt-1.12.4-1-riscv64.pkg.tar.zst`, 782,605 bytes, last modified 2026-09-12, packager Felix Yan |

The riscv64 port's downstream packaging required a riscv64-specific backported correctness fix (the VLEN>128 AES bug, tracked as Ubuntu/Debian bug [#2154120](https://bugs.launchpad.net/ubuntu/+source/gnupg2/+bug/2154120), "Fix Released" for Resolute and Stonking) before it could ship a correct riscv64 binary at that version. That is a materially different posture from an architecture whose distro package is a straight, unmodified build of an upstream-tested release.

No PyPI package named `libgcrypt` exists (HTTP 404 on both `pypi.org/pypi/libgcrypt/json` and the RISE GitLab wheel-builder mirror, which redirects to the same 404); libgcrypt is a native C library with no Python distribution, so this is expected, not a gap. No npm, Maven, or OCI image distribution channels apply.

**To get a working riscv64 binary:** install `libgcrypt20` (or equivalent) from the distribution package manager; Ubuntu 26.04, Debian sid, and Arch Linux RISC-V all currently carry riscv64 builds with the VLEN fix included. Users on Ubuntu 24.04 (1.10.3) get a functional but unaccelerated-for-RISC-V build, since that version predates 1.11.1.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| libgpg-error | runtime-dependency, critical | Pass - v1.61-2 builds on Debian sid builder rv-osuosl-03; pure C, no riscv64-specific code | No known failures | v1.61-2 in Debian sid | Hard build-time requirement (`AM_PATH_GPG_ERROR`, >= 1.56); libgcrypt will not configure without it. No dedicated project status report exists yet for libgpg-error in this series, despite it being libgcrypt's sole critical external library dependency - a coverage gap worth flagging separately |
| GCC | build-dependency, critical | Effectively GCC 14+ required for the RVV/vector-crypto intrinsic paths (`__riscv_v_intrinsic >= 12000` header-macro gate); GCC 13 compiles but silently falls back to generic C for those files | GCC bug 121485 (`vaes*_vs` wrong LMUL) worked around via configure-time assembly grep and `HAVE_BROKEN_VAES_VS_INTRINSIC` fallback | N/A (toolchain, not a shipped artifact) | GCC-14's unaligned-vector-load behavior also required a `-mstrict-align` workaround, later narrowed by Zicclsm gating in 1.12.3 |
| LLVM | build-dependency, optional | Alternative supported toolchain (Clang); LTO builds under Clang previously mis-detected vector-crypto intrinsics (fixed via `-fno-lto` / `AC_LINK_IFELSE`) | LLVM issue [#151814](https://github.com/llvm/llvm-project/issues/151814) (`vsha2cl` emits `vsha2ch.vv`) worked around via configure-time assembly grep and inline-asm fallback in the SHA-256 file | N/A | Optional relative to GCC; both toolchains are actively supported and both have had RISC-V-specific bugs worked around in `configure.ac` |
| QEMU | test-dependency, critical | N/A (not a build dependency) | Was the *only* validation available for the August 2025 Zvkned/Zvknha/Zvknhb/Zvkg vector-crypto patches at submission time ("no actual HW available with these instructions yet"); the May 2026 VLEN fix was validated at VLEN 128/256/512/1024 via `qemu-riscv64 -cpu max,vlen=...` | N/A | Critical in practice: absent project CI (Section 7), QEMU is the sole mechanism by which RISC-V vector-crypto code paths receive any testing before release, and its tail-agnostic-register policy (`rvv_ta_all_1s`) was itself instrumental in surfacing the OCB checksum bug (Section 11) |
| Linux kernel | runtime-dependency, critical | N/A (not a build dependency) | N/A | Required at runtime | `src/hwf-riscv.c` depends on `getauxval(AT_HWCAP)`/`/proc/self/auxv` and the `riscv_hwprobe` syscall (258) for accurate extension detection (V, Zbb, Zbc, Zvkb, Zvkg, Zvkned, Zvknha, Zvknhb); full `riscv_hwprobe` coverage needs Linux 5.10+ (later for some vector-crypto flags). Without correct detection, libgcrypt silently falls back to generic C rather than failing, so a too-old kernel produces a correctness-safe but slow build |
| libcap | runtime-dependency, optional | [NEEDS VERIFICATION] - no independent riscv64-specific build/test evidence found in this research pass | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | Optional, off by default (`--with-capabilities` is opt-in in `configure.ac`); low priority since it is not exercised in a default build and not release-blocking for libgcrypt itself |
| glibc | runtime-dependency, optional | Pass - riscv64 port stable since glibc 2.27+ | Passes as part of glibc's own test suite | Ships with every current riscv64 distro (part of libc6) | Provides `pthread_create`/`pthread_mutex_*` (merged into libc since glibc 2.34) and the socket functions (`AC_SEARCH_LIBS`) libgcrypt optionally links against; no riscv64-specific gap. See the separate glibc status report for this project's own RISC-V posture |

libgcrypt's non-toolchain, non-system dependency surface is narrow: libgpg-error is the only external library it hard-links, and libgpg-error itself is pure C with no RISC-V-specific code and no further external library dependencies to recurse into. The jitter-entropy collector (`random/jitterentropy-*.c`) is vendored source, not an external package, so it is not a linkable dependency in the SPARQL/package sense and is excluded from the table above.

---

## 11. Known Bugs and Active Issues

libgcrypt has no GitHub Issues workflow and no Phabricator ticket tracker entries for RISC-V (searches of both returned no matches); RISC-V problems are fixed via direct mailing-list patch, not tracked tickets, except where they crossed into downstream distro bug trackers.

| ID / Reference | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [T7647](https://dev.gnupg.org/T7647) | `simd-common-riscv.h` missing from 1.11.1 release tarball | Fixed (1.11.2, 2025-08-04) | Critical (build-breaking for all tarball users) | Found and fixed by external contributor Collin Funk roughly 4 months after the initial batch landed |
| Zvkned VLEN>128 correctness | `rijndael-riscv-zvkned`: m4 grouping wrong when VLEN > 128 | Fixed ([commit 3f684fc6](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=3f684fc6ab3ac98320e245a06b3563ad37ec56f5), 2026-05-06/07) | High - wrong ciphertext/plaintext on real VLEN=256+ hardware | Root cause: `__riscv_vset`/`__riscv_vget` assumed VLEN=128; fixed via `vslideup`/`vslidedown`. Reported by Michael Neuling on real hardware; this is precisely the risk the code's own "QEMU only, no HW available" note (Section 2) flagged at submission |
| Downstream: gpg decrypt "manipulated" false positive | Launchpad [#2154120](https://bugs.launchpad.net/ubuntu/+source/gnupg2/+bug/2154120), Ubuntu/Debian | Fix Released (Resolute, Stonking; Questing unaffected) | High - silent GPG decrypt-integrity failure on non-128-bit-VLEN riscv64 | Real-world manifestation of the bug above; backports commit 3f684fc6 as a Debian patch; verified on QEMU at VLEN 128 and 256 with no regressions |
| OCB checksum corruption | `cipher/rijndael-vp-riscv.c`, `movdqa128_256` macro left the upper half of a 256-bit register unzeroed | Fixed (commit `69ca1d2`) | High - OCB authenticated-encryption checksum corruption | Surfaced specifically under QEMU's vector tail-agnostic "all-ones" policy (`rvv_ta_all_1s=true`); fixed by explicit zeroing via `vslideup` |
| Zbb CTZ version-check | `bithelp`: wrong `__riscv_zbb` version threshold for `_gcry_ctz_no_zero` | Fixed (Aug 2025) | Medium - could silently skip or wrongly apply the Zbb optimization path | Threshold should be `< 1000000`, not `< 2002000` |
| GCC-14 unaligned vector load | GCC 14 generates unaligned vector loads for RVV intrinsics | Workaround in place (`-mstrict-align`, narrowed by Zicclsm gating in 1.12.3) | Medium - faults on alignment-enforcing hardware if unaddressed | Not filed as a GCC bug; library compensates in its own CFLAGS |
| LLVM `vsha2cl` intrinsic | LLVM emits `vsha2ch.vv` instead of `vsha2cl.vv` | Workaround in place (`HAVE_BROKEN_VSHA2CL_INTRINSIC` + inline-asm fallback) | High - wrong hash output with affected LLVM versions | Reference: [LLVM issue #151814](https://github.com/llvm/llvm-project/issues/151814) |
| GCC-121485 `vaes*_vs` LMUL | GCC emits wrong LMUL (m1 instead of m4) | Workaround in place (`HAVE_BROKEN_VAES_VS_INTRINSIC`) | High - wrong ciphertext with affected GCC versions | Reference: [GCC Bugzilla #121485](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=121485) |
| configure LTO detection | `AC_COMPILE_IFELSE` under LTO silently mis-detects RISC-V vector-crypto support | Fixed in two stages (Sep 2025 `-fno-lto`, May 2026 `AC_LINK_IFELSE`, [commit 77b98375](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=77b98375ff4d6e9667ba6c8233e98e430d2c6988)) | Medium - LTO builds could silently enable/disable wrong code paths | Affects both GCC and Clang |
| Register spilling from `"memory"` clobber | Inline-asm load/store in GCM/CRC used a blanket `"memory"` clobber, forcing unnecessary spills | Fixed ([msg00573](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00573.html), Jul 2026) | Low - performance only | Switched to precise memory operands |
| Constant-time MPI carries | GCC on riscv64 replaced constant-time carry (`sltu`) with conditional branches | Fixed (Feb 2025, `CT_DEOPTIMIZE_VAR` macro) | High - broke constant-time guarantees for RSA/ECC | Affects `mpi/longlong.h`; security-class issue, now closed |

All identified RISC-V bugs are fixed as of the research date; no open RISC-V correctness or performance issue was found. The recurring pattern across the two most severe bugs (OCB checksum corruption, VLEN>128 AES) is uninitialized or mis-assumed vector-register state discovered only after code shipped without real-hardware or CI testing; the September 2026 vector-register-cluttering self-test (commit `b48416d`) is the project's first concrete step toward catching this class of bug before release, though it is still a manual test addition, not CI.

---

## 12. Objections and Upstream Blockers

No stated objections to the RISC-V port exist in any reviewed mailing-list archive or commit message. All RISC-V patches were applied without documented controversy. The acceptance model is: patches to gcrypt-devel@gnupg.org, reviewed and applied directly by Werner Koch or Jussi Kivilinna. Acceptance probability for further RISC-V work is high, given Kivilinna is both the project's SIMD/performance specialist and a trusted upstream contributor with sole authorship of the existing port.

**Technical blockers:**

- No physical hardware with Zvkned, Zvknha, or Zvknhb was available to the primary developer as of August 2025. The VLEN>128 bug, found nine months later by an external party on real hardware, demonstrates that QEMU-only development carries real correctness risk for this code. This is a process gap, not an upstream objection.
- No systematic regression testing exists for RISC-V; validation remains ad-hoc developer practice, and there is no CI of any kind for the project (Section 7).

**Organizational blockers:** none identified. g10 Code and Werner Koch have shown no resistance to architecture-specific performance work, and the RISC-V port proceeded without any governance friction.

---

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

**Justification:** libgcrypt ships no upstream CI of any kind (no GitHub Actions, GitLab CI, Travis, Cirrus, or Jenkinsfile in the canonical tree, confirmed by direct 404 checks against the GitHub mirror), so it cannot reach blue or green. riscv64 binaries are available only via downstream distro packaging (Ubuntu 26.04 "resolute" ports archive: `libgcrypt20`/`libgcrypt20-dev`/`libgcrypt-bin` 1.12.0-2; also Debian sid and Arch Linux RISC-V), and that packaging required a riscv64-specific backported fix for a real correctness bug (Launchpad [#2154120](https://bugs.launchpad.net/ubuntu/+source/gnupg2/+bug/2154120), "gpg buggy on RISC-V when vector length != 128B"), which triggers the "patched distribution" floor rather than the clean-build one. libgcrypt is a general-purpose, security-first crypto library rather than an optimization-purpose project: its generic-C fallback still delivers its core correctness value even without RISC-V acceleration, so the optimization-modifier does not apply and this color is decided purely on CI/release posture.

**Pending work that could change the grade:** the underlying VLEN>128 bug is already fixed upstream (commit `3f684fc6`, 2026-05-06/07) and the Ubuntu/Debian fix is "Fix Released" for Resolute and Stonking, so this is not an open defect, just evidence that upstream has no CI to have caught it pre-release. Kivilinna has stated intent to add varied-VLEN test configurations to prevent recurrence, but no CI workflow exists yet to track that intent. The most recent upstream RISC-V work is a July 2026 inline-asm memory-operand optimization patch and an August 2026 1.12.3 release adding Zicclsm-gated unaligned access; no RISE involvement or funded CI work was found for libgcrypt, so nothing currently in flight would move this grade without either upstream adding CI or a third party funding and landing it.

---

## 14. Investment Analysis

RISE has no prior involvement with libgcrypt (Section 1). All existing RISC-V work in the project was done by Jussi Kivilinna as an independent, unfunded-for-this-purpose contributor. Nothing sized below is already covered by RISE or any other funded effort.

### 14.1 Functional Enablement

Two functional gaps exist: (1) Poly1305 has no RISC-V acceleration, so ChaCha20-Poly1305 AEAD throughput is bottlenecked by the generic C Poly1305 path even where ChaCha20 itself uses RVV; (2) `mpi/` has no riscv64 assembly, so all RSA, ECDH, ECDSA, and EdDSA operations run on generic C bignum arithmetic - this is the single largest functional gap identified in the entire codebase review (Section 4).

### 14.2 Performance Optimization

The SHA-3/Keccak path has only Zbb (ANDN+RORI) acceleration; an RVV Keccak permute would likely deliver a further speedup, but no RISC-V RVV Keccak benchmark exists anywhere in the research data, so any specific multiplier is [NEEDS VERIFICATION]. The Zvknha/Zvknhb SHA-256/SHA-512 implementations and the Zvkg GHASH implementation have never had a published real-hardware benchmark (only QEMU correctness validation); real-silicon tuning (LMUL selection, unrolling factors) may leave throughput on the table, but the magnitude cannot be estimated from available data.

### 14.3 CI/CD Infrastructure

The project has no CI for any architecture, not just riscv64. A riscv64 build+test job, even a QEMU-based one on a standard Linux CI runner via `qemu-user-static`, would have caught both T7647 (missing tarball file) and the VLEN>128 correctness bug before release rather than after. Given upstream's mailing-list-only, no-CI-for-any-architecture governance model, it is unlikely g10 Code will build this infrastructure itself; an externally contributed CI pipeline (e.g., GitHub Actions on a mirror, or a RISE-hosted riscv64 runner) with results posted to gcrypt-devel would be consistent with how other architecture-specific contributions have been accepted historically (Section 12).

### 14.4 Ecosystem Enablement

Not applicable. libgcrypt is a standalone C library with no dependent package ecosystem requiring separate riscv64 enablement; downstream distribution packages (Debian, Ubuntu, Arch Linux) already build and ship riscv64 binaries directly from this single project. No ecosystem-tier investment is warranted (see Section 10 omission note above).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Implement `mpi/riscv64/` bignum assembly (add/sub/mul kernels for RSA/ECC, following the amd64/aarch64 pattern) | 6-10 | Specialist with bignum-asm expertise | High |
| Functional | Implement Poly1305 RISC-V vector acceleration (RVV C intrinsics, following the ChaCha20 pattern) | 3-4 | Kivilinna (ideal) or contractor | Medium |
| CI/CD | QEMU-based riscv64 build+test job (`qemu-user-static`, runs `make check`, reports to gcrypt-devel or a public dashboard); would directly address the gap the Readiness justification identifies | 2 | Infrastructure engineer | High |
| CI/CD | Real-hardware riscv64 CI runner with multi-VLEN coverage (nightly regression for the class of bug seen twice - OCB checksum, AES m4-grouping); requires RISC-V hardware with V and Zvkned | 3 | Infrastructure engineer + hardware access | High |
| Performance | RVV Keccak/SHA-3 permute (complement the existing Zbb-only path) | 3-4 | Kivilinna or contractor | Low |
| Performance | Real-hardware benchmarking and tuning of the Zvknha/Zvknhb SHA-256/SHA-512 and Zvkg GHASH paths (currently QEMU-validated only, never benchmarked on silicon) | 2-3 | Requires physical Zvknha/Zvkg hardware | Medium |

---

## 15. References

- [libgcrypt project homepage](https://gnupg.org/software/libgcrypt/)
- [libgcrypt canonical source repository (dev.gnupg.org)](https://dev.gnupg.org/source/libgcrypt)
- [libgcrypt GitHub mirror (gpg/libgcrypt, unmaintained)](https://github.com/gpg/libgcrypt)
- [GnuPG project tracker (dev.gnupg.org)](https://dev.gnupg.org/)
- [GnuPG bug T7647, missing simd-common-riscv.h in tarball](https://dev.gnupg.org/T7647)
- [g10 Code GmbH](https://g10code.com/)
- [commit df9de2a5, hwf: add detection of RISC-V (64-bit) hardware features](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=df9de2a5e5a847fa4f11a923cf3397bf1cf7a562)
- [commit b100dd25, fix missing simd-common-riscv.h in libgcrypt tarball](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=b100dd25eb6821d58851c2b802bfe9ef2f441228)
- [commit b000ab60, add RISC-V vector cryptography implementation of AES (Zvkned)](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=b000ab602531b2c29e93736afc1686dea8ed6782)
- [commit 5c9ce0cc (referenced via gcrypt-devel), configure.ac RISC-V vector crypto intrinsics bug checks without LTO](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00361.html)
- [commit 3f684fc6, rijndael-riscv-zvkned: fix m4 grouping when VLEN greater than 128](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=3f684fc6ab3ac98320e245a06b3563ad37ec56f5)
- [commit 77b98375, configure: use AC_LINK_IFELSE for intrinsics to fix LTO builds](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=77b98375ff4d6e9667ba6c8233e98e430d2c6988)
- [gcrypt-devel msg00143, chacha20: add RISC-V vector intrinsics implementation](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00143.html)
- [gcrypt-devel msg00144, hwf: add detection of RISC-V (64-bit) hardware features](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00144.html)
- [gcrypt-devel msg00145, add GHASH RISC-V/Zbc implementation](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00145.html)
- [gcrypt-devel msg00146, bithelp: add count trailing zero bits variant for RISC-V](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00146.html)
- [gcrypt-devel msg00148, add RISC-V vector permute AES](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00148.html)
- [gcrypt-devel msg00344, bithelp: fix __riscv_zbb check for _gcry_ctz_no_zero](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00344.html)
- [gcrypt-devel msg00346, add RISC-V vector cryptography implementations of SHA256 and SHA512](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00346.html)
- [gcrypt-devel msg00348, add RISC-V vector cryptography implementation of AES](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00348.html)
- [gcrypt-devel msg00351, add RISC-V Zbb+Zbc implementation of CRC](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00351.html)
- [gcrypt-devel msg00361, configure.ac: perform RISC-V vector crypto intrinsics bug checks without LTO](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00361.html)
- [gcrypt-devel msg00507, cipher:riscv: gate Zvkned AES backend on VLEN == 128 (bug report)](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00507.html)
- [gcrypt-devel msg00511, rijndael-riscv-zvkned: fix m4 grouping when VLEN greater than 128](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00511.html)
- [gcrypt-devel msg00573, riscv: use memory operands for inline assembly load/store](https://www.mail-archive.com/gcrypt-devel@gnupg.org/msg00573.html)
- [gcrypt-devel archive, July 2026, bufhelp Zicclsm patch with SpacemiT K1 benchmark table](https://lists.gnupg.org/pipermail/gcrypt-devel/2026-July/006155.html)
- [gcrypt-devel archive, August 2025, "tested against QEMU emulator" AES-Zvkned submission](https://lists.gnupg.org/pipermail/gcrypt-devel/2025-August/005930.html)
- [Launchpad bug #2154120, [SRU] gpg buggy on RISC-V when vector length /= 128B](https://bugs.launchpad.net/ubuntu/+source/gnupg2/+bug/2154120)
- [Ubuntu packages: libgcrypt20 in resolute](https://packages.ubuntu.com/search?keywords=libgcrypt&suite=resolute&searchon=names&section=all)
- [Ubuntu packages: libgcrypt20 in noble](https://packages.ubuntu.com/search?keywords=libgcrypt&suite=noble&searchon=names&section=all)
- [Debian package tracker: libgcrypt20](https://tracker.debian.org/pkg/libgcrypt20)
- [Arch Linux RISC-V port status](https://archriscv.felixc.at/)
- [GCC Bugzilla #121485, vaes*_vs intrinsics emit wrong LMUL](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=121485)
- [LLVM issue #151814, vsha2cl emits vsha2ch](https://github.com/llvm/llvm-project/issues/151814)
- [RISE Project members](https://riseproject.dev/members)
- [RISE Project blog](https://riseproject.dev/blog)