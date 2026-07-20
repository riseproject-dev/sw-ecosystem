---
title: libgcrypt
categories:
  - libraries
---

# libgcrypt

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libgcrypt
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libgcrypt is a general-purpose cryptographic library that forms the cryptographic core of the GnuPG software suite. It provides symmetric ciphers (AES, ChaCha20, etc.), hash functions (SHA-1, SHA-2, SHA-3, BLAKE2, etc.), public-key algorithms (RSA, ECC, DSA), and supporting primitives (PRNG, GHASH/GCM, Poly1305, CRC). The library is licensed LGPLv2.1+; helper utilities and documentation are GPLv2+.

**Governance:** Development and maintenance authority rests with [g10 Code GmbH](https://g10code.com/), a German private company founded by Werner Koch (the original GnuPG author). The project was previously co-supported by GnuPG e.V. (a registered nonprofit association, VR11482 Amtsgericht Dusseldorf, founded 2017-02-08), which voted to dissolve on 2024-08-17; dissolution was registered 2025-02-19. As of 2025, the project is funded exclusively through g10 Code support contracts. Werner Koch retains final commit authority. All patch submissions go to the [gcrypt-devel@gnupg.org](mailto:gcrypt-devel@gnupg.org) mailing list; there is no GitHub pull request workflow.

**Key personnel:**

| Name | Affiliation | Role |
|---|---|---|
| Werner Koch | g10 Code GmbH | Founder, lead developer, release manager |
| Jussi Kivilinna | Independent (jussi.kivilinna@iki.fi) | SIMD/performance specialist; authored all RISC-V accelerated code 2025-2026 |
| NIIBE Yutaka | FSIJ (gniibe@fsij.org) | KEM and miscellaneous contributions |
| Collin Funk | Independent | Packaging fix for RISC-V source tarball (2025-05) |

**Community stance on new ports:** There is no documented architecture tier policy or formal RFC process for adding new architecture support. Architecture-specific acceleration follows a permissive, merit-based model: the generic C path is always compiled; accelerated SIMD paths are conditionally compiled and selected at runtime through the hardware-feature detection layer (hwf). New architecture code is accepted on Werner Koch's review of patches submitted to the mailing list. The RISC-V port was added unilaterally by Jussi Kivilinna without a governance vote, consistent with how ARM NEON and x86 AES-NI accelerations were added.

**RISE involvement:** None. No RISE blog posts, funded projects, or organizational membership mention libgcrypt.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the canonical repository at [git.gnupg.org](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git). There is no downstream fork or pending carry-forward patch. All work is by Jussi Kivilinna unless noted.

| Date | Event | Source |
|---|---|---|
| 2024-06-19 | libgcrypt 1.11.0 released; first version to include any RISC-V detection infrastructure | [gnupg.org release notes](https://gnupg.org/software/libgcrypt/) |
| 2025-01-01 to 2025-01-02 | Kivilinna authors the initial batch: hwf detection (hwf-riscv.c), AES vector-permute, ChaCha20 RVV, GHASH Zbb+Zbc, SHA-3 Zbb, CTZ Zbb -- all benchmarked on SpacemiT K1 at 1600 MHz | [commit df9de2a5](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=df9de2a5e5a847fa4f11a923cf3397bf1cf7a562) et al. |
| 2025-01-27 | Entire initial batch committed upstream | same commits above |
| 2025-02-03 | Fix: GCC on riscv64 emits conditional branches for constant-time carry in mpi/longlong.h; CT_DEOPTIMIZE_VAR macro introduced | [gcrypt-devel Feb 2025](https://lists.gnupg.org/pipermail/gcrypt-devel/2025-February.txt) |
| 2025-05-17 | Collin Funk reports and fixes T7647: simd-common-riscv.h missing from release tarball, causing build failure for all tarball users | [commit b100dd25](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=b100dd25eb6821d58851c2b802bfe9ef2f441228) |
| 2025-05-20 | libgcrypt 1.11.1 released; first release shipping all initial RISC-V acceleration | [gnupg.org](https://gnupg.org/software/libgcrypt/) |
| 2025-08-04 | libgcrypt 1.11.2 released | [gnupg.org](https://gnupg.org/software/libgcrypt/) |
| 2025-08-05 to 2025-08-20 | Second batch: AES Zvkned (rijndael-riscv-zvkned.c), SHA-256 Zvknha+Zvkb, SHA-512 Zvknhb+Zvkb, GCM Zvkg, CRC Zbb+Zbc, POLYVAL Zbb+Zbc; GCC-14 -mstrict-align workaround; LLVM broken-intrinsic workaround; HWF_RISCV_ZVKG mapping bug fix | [gcrypt-devel Aug 2025](https://lists.gnupg.org/pipermail/gcrypt-devel/2025-August.txt), [commit b000ab60](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=b000ab602531b2c29e93736afc1686dea8ed6782) |
| 2025-08-09 | AES Zvkned committed upstream; misses 1.11.2 by 5 days | [commit b000ab60](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=b000ab602531b2c29e93736afc1686dea8ed6782) |
| 2025-09-17 | Fix: HWF_RISCV_ZVKG hardware-feature string mapping copy-paste error | [gcrypt-devel Sep 2025](https://lists.gnupg.org/pipermail/gcrypt-devel/2025-September.txt) |
| 2025-09-20 to 2025-09-24 | Fix: configure.ac LTO + RISC-V vector crypto intrinsics detection incorrect; -fno-lto added for affected configure checks | [commit 5c9ce0cc](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=5c9ce0cc51d9fdbd8d859756a26ab42c8a89333a) |
| 2025-12-29 | Zvkned AES-192 key setup and decryption loop optimizations authored | [commit ef372b48](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=ef372b484e0f0876a6657f5ca692c101b8c113bd), [commit 4c9d7a3b](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=4c9d7a3ba939255d78320d887eb648410949071d) |
| 2026-01-02 | Both Zvkned optimizations committed upstream | same commits |
| 2026-01-29 | libgcrypt 1.12.0 released; first release shipping AES Zvkned, SHA-256/512 vector crypto, all Aug 2025 work | [gnupg.org](https://gnupg.org/software/libgcrypt/) |
| 2026-05-06 | Kivilinna fixes Zvkned AES m4-grouping bug when VLEN > 128; reported by Michael Neuling on real VLEN=256 hardware | [commit 3f684fc6](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=3f684fc6ab3ac98320e245a06b3563ad37ec56f5) |
| 2026-05-07 | VLEN>128 fix committed; Tested-by from Neuling same day | [gcrypt-devel May 2026](https://lists.gnupg.org/pipermail/gcrypt-devel/2026-May.txt) |
| 2026-05-12 | configure: switch to AC_LINK_IFELSE for RISC-V vector crypto intrinsic checks to fix LTO builds more broadly | [commit 77b98375](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=77b98375ff4d6e9667ba6c8233e98e430d2c6988) |

The port is fully upstream. No known pending RISC-V patches exist on the mailing list as of the research date.

---

## 3. Upstream Support Tier

libgcrypt has no formal architecture tier policy. The project does not publish a support matrix, does not distinguish between tier-1 and tier-2 architectures, and does not designate release-blocking architectures. All architecture acceleration is opt-in via the hwf runtime detection layer; failure to detect an extension causes automatic fallback to generic C.

There is no CI at all for any architecture (see Section 7). "Support tier" is therefore determined by the presence and completeness of architecture-specific code rather than any infrastructure guarantee.

Comparing the three architectures by code depth:

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hardware feature detection | Yes (hwf-x86.c; CPUID) | Yes (hwf-arm.c; AT_HWCAP) | Yes (hwf-riscv.c; AT_HWCAP + riscv_hwprobe syscall) |
| mpi/ assembly directory | Yes (mpi/amd64/) | Yes (mpi/aarch64/) | No -- generic C fallback only |
| AES acceleration | Yes (AES-NI, VAES) | Yes (ARMv8-AES) | Yes (Zvkned, vector permute; VLEN>=128) |
| ChaCha20 acceleration | Yes (AVX2, SSSE3) | Yes (NEON) | Yes (RVV) |
| GHASH/GCM acceleration | Yes (CLMUL, VPCLMULQDQ) | Yes (PMULL) | Yes (Zbb+Zbc, Zvkg) |
| SHA-256/SHA-512 acceleration | Yes (SHA-NI, AVX2) | Yes (ARMv8-SHA2) | Yes (Zvknha+Zvkb, Zvknhb+Zvkb) |
| SHA-3/Keccak acceleration | Yes (AVX2) | Yes (NEON) | Partial (Zbb ANDN+RORI only; no RVV path) |
| Poly1305 acceleration | Yes (AVX2, SSE2) | Yes (NEON) | No |
| CRC acceleration | Yes | Yes | Yes (Zbb+Zbc) |
| Bignum (mpi/) assembly | Yes (amd64/) | Yes (aarch64/) | No |
| Formal tier designation | None (project has no tier policy) | None | None |
| CI coverage | None | None | None |

riscv64 is behind amd64 and arm64 in two specific areas: mpi/ bignum assembly and Poly1305 acceleration. All other major symmetric crypto primitives are covered.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libgcrypt organizes architecture acceleration in the cipher/ directory using per-file C intrinsics or inline assembly, compiled with per-file -march flags. There is a separate mpi/ directory for multiprecision integer assembly (used by RSA, ECC, DSA), where architecture subdirectories contain hand-written assembly for bignum add/sub/mul. libgcrypt has no JIT backend.

**Hardware feature detection** (`src/hwf-riscv.c`, ~270 lines): Detects extensions at runtime via three mechanisms in order of preference: (1) getauxval(AT_HWCAP) or /proc/self/auxv, (2) Linux riscv_hwprobe syscall (syscall 258), (3) compile-time toolchain macros (__riscv_zbb, __riscv_v, etc.) as fallback. Feature flags: HWF_RISCV_IMAFDC, HWF_RISCV_V, HWF_RISCV_ZBB, HWF_RISCV_ZBC, HWF_RISCV_ZVKB, HWF_RISCV_ZVKG, HWF_RISCV_ZVKNED, HWF_RISCV_ZVKNHA, HWF_RISCV_ZVKNHB. Enforces VLEN >= 128 guard on vector code paths.

**RISC-V cipher files (all C intrinsics or inline assembly, no hand-written .S files):**

| File | ISA Extensions | What it implements | Implementation quality |
|---|---|---|---|
| `cipher/rijndael-riscv-zvkned.c` | Zvkned + V | AES-128/192/256: ECB, CBC, CFB, CTR, CTR32LE, OCB, XTS; 4-block parallel LMUL=m4; vaeskf1/vaeskf2 key expansion | C intrinsics via riscv_vector.h; hand-tuned (loop unrolling, stack elimination, VLEN>128 fix) |
| `cipher/rijndael-vp-riscv.c` | V (vrgather) | Constant-time AES via vector-permute technique; SIMD128 and SIMD256 paths; all modes | C intrinsics; software fallback for hardware without Zvkned |
| `cipher/chacha20-riscv-v.c` | V | ChaCha20 stream cipher; variable-length (4+ blocks) and 128-bit fixed paths | C intrinsics; two-tier size dispatch |
| `cipher/cipher-gcm-riscv-zbb-zbc.c` | Zbb + Zbc | GHASH and POLYVAL for AES-GCM via clmul/clmulh carry-less multiply + rev8 byte-reverse | Inline asm (.option arch, +zbb,+zbc); Karatsuba GF(2^128) multiplication |
| `cipher/cipher-gcm-riscv-zvkg.c` | Zvkg + V | GHASH and POLYVAL via __riscv_vghsh_vv_u32m1 dedicated instruction; VLEN>=128 required | C intrinsics |
| `cipher/sha256-riscv-zvknha-zvkb.c` | Zvknha + Zvkb | Full 64-round SHA-256 with vsha2cl/vsha2ch/vsha2ms instructions | C intrinsics; broken-compiler fallback path for LLVM vsha2cl bug |
| `cipher/sha512-riscv-zvknhb-zvkb.c` | Zvknhb + Zvkb | Full 80-round SHA-512 with u64m2 vector registers | C intrinsics; same structure as SHA-256 |
| `cipher/crc-riscv-zbb-zbc.c` | Zbb + Zbc | CRC-32 and CRC-24-RFC2440 (OpenPGP); CLMUL polynomial folding + rev8; riscv_xlen==64 guard | Inline asm; ~375 lines |
| `cipher/keccak.c` (inline sections) | Zbb | SHA-3/Keccak permute using ANDN and RORI instructions; no RVV path | Inline asm within existing keccak.c; not a separate file |

**What is absent for riscv64:**

- `mpi/riscv/` directory: does not exist. The mpi/ tree has subdirectories for aarch64, amd64, arm, powerpc, sparc, etc. riscv64 uses the generic C fallback for all multiprecision integer operations (RSA, ECDH, ECDSA, EdDSA). This is a performance gap only, not a correctness issue.
- Poly1305 RISC-V acceleration: cipher/poly1305.c contains x86, AArch64, and PPC paths; no RISC-V path.
- SHA-3/Keccak RVV path: Zbb acceleration exists but there is no vector (V extension) Keccak path.
- Random/entropy (Zkr extension): no riscv_seed or CSR-based entropy source support found.
- Hand-written assembly (.S files): all RISC-V code uses C intrinsics or inline asm; no .S files.

**Comparison table by component:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AES symmetric | AES-NI + VAES (hand-tuned asm) | ARMv8 AES intrinsics | Zvkned C intrinsics + vector-permute fallback |
| ChaCha20 | AVX2 + AVX512 | NEON | RVV C intrinsics |
| GHASH/GCM | PCLMULQDQ + VPCLMULQDQ | PMULL | Zbb+Zbc inline asm + Zvkg C intrinsics |
| SHA-256 | SHA-NI + AVX2 | ARMv8-SHA2 | Zvknha+Zvkb C intrinsics |
| SHA-512 | AVX2 | ARMv8-SHA512 | Zvknhb+Zvkb C intrinsics |
| SHA-3/Keccak | AVX2 | NEON | Zbb ANDN+RORI (partial; no vector path) |
| Poly1305 | AVX2 + SSE2 | NEON | Not implemented |
| CRC | PCLMULQDQ | PMULL | Zbb+Zbc inline asm |
| Bignum (mpi/) | Hand-written asm | Hand-written asm | Generic C fallback |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autotools (autoconf/automake). No CMake. No Meson.

**Standard native build (riscv64 host):**

```
./configure
make
make check
make install
```

No riscv64-specific configure flags are required. RISC-V extension detection (V, Zbb, Zbc, Zvkned, Zvknha, Zvknhb, Zvkg) is automatic via configure probes.

**Cross-compilation:**

```
./configure --host=riscv64-linux-gnu --build=x86_64-linux-gnu \
  CC=riscv64-linux-gnu-gcc \
  PKG_CONFIG_LIBDIR=/path/to/riscv64/lib/pkgconfig
make
```

The autogen.sh has no built-in --build-riscv64 shortcut (only --build-w32, --build-w64, amd64 are defined).

**Disabling all RISC-V acceleration:**

```
./configure --disable-asm
```

This sets try_asm_modules=no and skips every RISC-V detection block in configure.ac. There are no individual --disable-riscv-vector or --disable-riscv-crypto flags. Per-algorithm selection uses --enable-ciphers / --enable-digests whitelists.

**Toolchain requirements:**

- **GCC >= 14 is effectively required for vector intrinsics.** The configure.ac checks `__riscv_v_intrinsic >= 12000`, a header macro version shipped by GCC 14+. GCC 13 ships an older RVV intrinsic API and fails this check. Affected files: chacha20-riscv-v.c, rijndael-vp-riscv.c, rijndael-riscv-zvkned.c, sha256-riscv-zvknha-zvkb.c, sha512-riscv-zvknhb-zvkb.c, cipher-gcm-riscv-zvkg.c. There is no explicit AC_PREREQ version gate; detection is via the header macro.
- **GCC 14 bug: -mstrict-align required.** GCC 14 generates unaligned vector loads for RVV intrinsics, which fault on hardware enforcing alignment. configure.ac probes for -mstrict-align support (gcry_cv_cc_riscv_mstrict_align) and adds it to per-file CFLAGS for all RISC-V vector files when available. See [gcrypt-devel Aug 2025](https://lists.gnupg.org/pipermail/gcrypt-devel/2025-August.txt).
- **GCC bug 121485: __riscv_vaes*_vs intrinsics emit wrong LMUL.** Symptom: vsetvli emits m1 instead of m4 for vaes*_vs_u32m1_u32m4 intrinsics. configure.ac compiles a test and greps assembly for "m4"; sets HAVE_BROKEN_VAES_VS_INTRINSIC if broken. Affected: rijndael-riscv-zvkned.c. Reference: [gcc.gnu.org/bugzilla/show_bug.cgi?id=121485](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=121485).
- **LLVM bug: __riscv_vsha2cl_* emits vsha2ch.vv instead of vsha2cl.vv.** configure.ac greps assembly for "vsha2cl"; sets HAVE_BROKEN_VSHA2CL_INTRINSIC. Affected file falls back to inline asm. Reference: [llvm/llvm-project/issues/151814](https://github.com/llvm/llvm-project/issues/151814).
- **LTO builds:** Require -fno-lto for configure-time intrinsic checks (added Sep 2025, further hardened May 2026 via AC_LINK_IFELSE). Without these fixes, LTO could silently enable or disable RISC-V vector crypto paths depending on optimizer behavior.

**march strings used in per-file CFLAGS (from configure.ac):**

| Files | CFLAGS march |
|---|---|
| chacha20-riscv-v.c, rijndael-vp-riscv.c | -O2 -march=rv64imafdcv_zba_zbb_zbs -mstrict-align |
| rijndael-riscv-zvkned.c | -O2 -march=rv64imafdcv_zba_zbb_zbs_zvkned -mstrict-align |
| sha256-riscv-zvknha-zvkb.c, sha512-riscv-zvknhb-zvkb.c | -O2 -march=rv64imafdcv_zba_zbb_zbs_zvknha_zvknhb_zvkb -mstrict-align |
| cipher-gcm-riscv-zvkg.c | -O2 -march=rv64imafdcv_zba_zbb_zbs_zvkg -mstrict-align |

**QEMU:** The project provides no Dockerfile, no CI configuration, and no QEMU invocation scripts. The Aug 2025 Zvkned commit message explicitly states "validated using qemu-riscv64 as no physical hardware was available." All QEMU usage in the project's own development is ad-hoc developer practice with no documented procedure. For cross-build + test with qemu-user-static, the standard external pattern (apt binfmt-support + qemu-user-static) works; make check exercises all 39 test vectors correctly (Debian sid shows 0 failures on riscv64, versus 6 on hppa).

**RISC-V single external dependency required at build time:** libgpg-error >= 1.56. Available on riscv64 at v1.61-2 in Debian sid.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix (functional coverage):**

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| AES-128/192/256 all major modes | Yes | Yes | Yes (Zvkned + vector-permute) | None |
| AES-128/192/256 VLEN>128 correct | Yes | Yes | Yes (fixed 2026-05) | Was correctness bug; now fixed |
| ChaCha20 SIMD | Yes | Yes | Yes (RVV) | None |
| GHASH / AES-GCM | Yes | Yes | Yes (Zbb+Zbc, Zvkg) | None |
| SHA-256 | Yes | Yes | Yes (Zvknha; QEMU-validated only) | Performance data on real Zvknha HW not published |
| SHA-512 | Yes | Yes | Yes (Zvknhb; QEMU-validated only) | Same |
| SHA-3 / Keccak | Yes (AVX2) | Yes (NEON) | Partial (Zbb only; no RVV path) | No RVV Keccak; ~2.2x vs expected ~5-10x with RVV |
| Poly1305 | Yes | Yes | No | Missing; functional gap for ChaCha20-Poly1305 AEAD acceleration |
| CRC-32 / CRC-24 | Yes | Yes | Yes (Zbb+Zbc) | None |
| POLYVAL | Yes | Yes | Yes (Zbb+Zbc) | None |
| Bignum / MPI assembly | Yes | Yes | No (generic C) | Performance gap for all public-key operations (RSA, ECC) |
| Constant-time MPI carries | Yes | Yes | Yes (CT_DEOPTIMIZE_VAR macro, 2025-02) | Fixed; was security-class issue |

**Performance gaps vs arm64 and amd64:**

No cross-architecture comparison benchmarks are published in any commit message or mailing list post. The published numbers are all riscv64 before/after comparisons on SpacemiT K1 (RV64GCV, 1600 MHz). Absolute throughput comparison against ARM Cortex-A or x86 Alder Lake is not available from the research data.

Data not available: Cross-architecture throughput comparison (amd64 vs arm64 vs riscv64 on equivalent or comparable silicon).

**Security hardening gaps:**

- Constant-time carry in mpi/longlong.h was broken on riscv64 (GCC emitted conditional branches for sltu); fixed 2025-02-03 via CT_DEOPTIMIZE_VAR macro. No known open constant-time issues as of the research date.
- The VLEN>128 bug in Zvkned AES was a correctness error (wrong ciphertext on VLEN=256 hardware), not a security vulnerability, but is the category of error that could manifest as a padding oracle or data corruption. Fixed 2026-05-07.

---

## 7. CI/CD Infrastructure

libgcrypt has no CI configuration of any kind in its repository. The repository root contains only autotools build files (configure.ac, Makefile.am, autogen.sh). There is no .gitlab-ci.yml, no .github/ directory, no Jenkinsfile, no Travis CI config, and no test-farm integration. The GnuPG project infrastructure at dev.gnupg.org runs a Phabricator instance but no CI pipelines.

All RISC-V work was developed with ad-hoc developer testing:
- January 2025 batch: benchmarked on physical SpacemiT K1 hardware by Kivilinna.
- August 2025 Zvkned/Zvknha/Zvknhb batch: tested on qemu-riscv64 only; no physical hardware available (stated in commit b000ab60).
- May 2026 VLEN>128 fix: reported and tested on real VLEN=256 hardware (SpacemiT X60 / Banana BPI-F3 or Tenstorrent Ascalon) by Michael Neuling; confirmed correct on QEMU at VLEN 128/256/512/1024.

No RISE CI runners are used. No automated riscv64 build or test job exists anywhere in the project's infrastructure.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job | None | None | None |
| Test job | None | None | None |
| Sanitizer job | None | None | None |
| Hardware runner | None | None | None |
| QEMU runner | None | None | None |

The only systematic riscv64 build+test coverage comes from downstream distribution build systems (Debian buildd rv-osuosl-03, Arch Linux RISC-V infrastructure), not from the project itself.

---

## 8. Distribution and Release Status

**Current upstream release:** 1.12 (as listed in the repository README). The canonical download location is [gnupg.org/ftp/gcrypt/libgcrypt/](https://gnupg.org/ftp/gcrypt/libgcrypt/). Source-only releases; no official upstream binary packages for any architecture.

**Distribution binary packages:**

| Distribution | Package name | riscv64 version | Status |
|---|---|---|---|
| Debian sid | libgcrypt20 | 1.12.2-1 | "Installed" on builder rv-osuosl-03; 0 test failures |
| Debian sid | libgcrypt20-dev | 1.12.2-1 | Available |
| Ubuntu 24.04 (Noble) | libgcrypt20 | 1.10.3-2build1 | Available; listed explicitly alongside arm64, armhf, ppc64el, s390x |
| Ubuntu 24.04 (Noble) | libgcrypt20-dev | 1.10.3-2build1 | Available |
| Arch Linux RISC-V | libgcrypt | 1.12.2-1 | In core repo; filename libgcrypt-1.12.2-1-riscv64.pkg.tar.zst; packager Felix Yan |

No PyPI package named "libgcrypt" exists (HTTP 404). libgcrypt is a C library with no Python/PyPI distribution. No npm, Maven, or OCI image distribution channels apply.

To get a working riscv64 binary: install libgcrypt20 from the distribution package manager. No special steps are required. The 1.10.3 version in Ubuntu 24.04 predates all RISC-V acceleration (that landed in 1.11.1); users needing accelerated RISC-V paths require Debian sid (1.12.2-1) or a build from source.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| libgpg-error >= 1.56 | Hard required: error codes, threading flags, gpgrt runtime | PASS (v1.61-2, Debian sid rv-osuosl-03) | No known failures | v1.61-2 in Debian sid | No RISC-V assembly in libgpg-error; pure C |
| pthreads (glibc libpthread) | Threading (pthread_create, pthread_mutex) | PASS (glibc 2.27+ has riscv64) | Passes as part of glibc test suite | All current riscv64 distros | See glibc status report |
| Linux kernel headers (sys/auxv.h, sys/random.h) | getauxval() for hwf detection; getrandom() for entropy | PASS (present on all riscv64 Linux >= 5.0) | N/A (headers only) | All current riscv64 distros | AT_HWCAP and riscv_hwprobe syscall 258 both work on Linux 5.10+ |

**Depth of dependency analysis:** libgcrypt's only non-system external library dependency is libgpg-error, which itself has no external library dependencies and no RISC-V-specific code. There are no SIMD or JIT-dependent transitive dependencies to recurse into.

**In-scope cross-reference:** glibc (pthreads + kernel header integration) -- see [./libraries/glibc.md].

---

## 11. Known Bugs and Active Issues

All identified RISC-V bugs are fixed. No open RISC-V correctness or performance issues are known as of June 2026.

| ID / Reference | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [T7647](https://dev.gnupg.org/T7647) | simd-common-riscv.h missing from 1.11.1 release tarball | Fixed (1.11.2, 2025-08-04) | Critical (build-breaking for all tarball users) | Fatal compile error on any riscv64 build from tarball; external contributor Collin Funk found and fixed it ~4 months after initial batch landed |
| Zvkned VLEN>128 correctness | rijndael-riscv-zvkned: m4 grouping wrong when VLEN > 128 | Fixed ([commit 3f684fc6](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=3f684fc6ab3ac98320e245a06b3563ad37ec56f5), 2026-05-07) | High (wrong ciphertext on VLEN=256 hardware) | Blocks 1-3 of every 4-block batch computed incorrectly on CPUs with VLEN=256 (SpacemiT X60, Tenstorrent Ascalon); root cause: __riscv_vset/__riscv_vget assume VLEN=128; replaced with vslideup/vslidedown |
| Zbb CTZ version check | bithelp: wrong __riscv_zbb version threshold for _gcry_ctz_no_zero | Fixed (Aug 2025) | Medium (incorrect Zbb path enable/disable) | Threshold `< 2002000` should be `< 1000000`; could silently skip or apply Zbb optimization |
| GCC-14 unaligned vector load | GCC-14 generates unaligned vector loads for RVV intrinsics | Workaround committed (Aug 2025, -mstrict-align) | Medium (fault on alignment-enforcing hardware) | Not a GCC bug report outcome; library adds -mstrict-align to its own CFLAGS |
| LLVM vsha2cl intrinsic | LLVM emits vsha2ch.vv instead of vsha2cl.vv | Workaround committed (Aug 2025, HAVE_BROKEN_VSHA2CL_INTRINSIC guard) | High (wrong hash output with affected LLVM) | Inline asm fallback in sha256-riscv-zvknha-zvkb.c; upstream LLVM issue [llvm/llvm-project/issues/151814](https://github.com/llvm/llvm-project/issues/151814) |
| GCC-121485 vaes*_vs LMUL | GCC emits wrong LMUL (m1 instead of m4) for vaes*_vs intrinsics | Workaround committed (configure probe HAVE_BROKEN_VAES_VS_INTRINSIC) | High (wrong ciphertext with affected GCC) | Reference: [gcc.gnu.org/bugzilla/show_bug.cgi?id=121485](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=121485) |
| configure LTO detection | AC_COMPILE_IFELSE with LTO silently mis-detects RISC-V vector crypto | Fixed ([commit 5c9ce0cc](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=5c9ce0cc51d9fdbd8d859756a26ab42c8a89333a) Sep 2025, [commit 77b98375](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=77b98375ff4d6e9667ba6c8233e98e430d2c6988) May 2026) | Medium (LTO builds enable wrong code paths) | Affects builds with -flto; GCC and Clang both affected; two-phase fix |
| HWF_RISCV_ZVKG string mapping | Copy-paste error: HWF_RISCV_ZVKNED mapped to "riscv-zvkg" string | Fixed (Sep 2025) | Medium (Zvkg acceleration never selected at runtime) | hwfeatures.c copy-paste from Zvkned entry |
| Constant-time MPI carries | GCC on riscv64 replaces constant-time carry (sltu) with conditional branches | Fixed (Feb 2025, CT_DEOPTIMIZE_VAR macro) | High (breaks constant-time guarantees for RSA/ECC) | Affects mpi/longlong.h add_ssaaaa/sub_ddmmss on riscv64; security-class issue now closed |

---

## 12. Objections and Upstream Blockers

No stated objections to the RISC-V port exist in any reviewed mailing list archive or commit message. All RISC-V patches were applied without documented controversy. The acceptance model is: patches to gcrypt-devel@gnupg.org, reviewed and applied by Werner Koch or Jussi Kivilinna directly. Acceptance probability for further RISC-V work is high given that Kivilinna is both the performance specialist and a trusted upstream contributor.

**Technical blockers:**

- No physical hardware with Zvkned, Zvknha, or Zvknhb was available to the primary developer as of August 2025. The VLEN>128 bug (found May 2026 by an external party on real hardware) demonstrates that QEMU-only development carries real correctness risk. This is a process gap, not an upstream objection.
- No systematic regression testing on RISC-V. All validation is ad-hoc.

**Organizational blockers:**

- None identified. g10 Code and Werner Koch have shown no resistance to architecture-specific performance work.

---

## 13. Investment Analysis

RISE has no prior involvement with libgcrypt. All existing RISC-V work in the project was done by Jussi Kivilinna as an independent contributor.

### 13.1 Functional Enablement

Two functional gaps exist: (1) Poly1305 has no RISC-V acceleration -- ChaCha20-Poly1305 AEAD throughput is limited by the Poly1305 generic C path even when ChaCha20 uses RVV. (2) mpi/ has no riscv64 assembly -- all RSA, ECDH, ECDSA, and EdDSA operations use generic C bignum arithmetic.

### 13.2 Performance Optimization

The SHA-3/Keccak path has only Zbb (ANDN+RORI) acceleration; an RVV Keccak permute would likely deliver an additional 2-4x [NEEDS VERIFICATION -- no RISC-V RVV Keccak benchmark exists in the research data]. The Zvknha/Zvknhb SHA-256/SHA-512 implementations were validated on QEMU only; real-hardware tuning (LMUL selection, unrolling factors) may leave throughput on the table.

### 13.3 CI/CD Infrastructure

The project has no CI for any architecture. A riscv64 build+test job (even QEMU-based via qemu-user-static and a standard Linux CI runner) would catch regressions like T7647 (missing tarball file) and the VLEN>128 correctness bug before they reach release. The project's upstream governance makes it unlikely that g10 Code will add CI infrastructure itself; contributions in the form of an external CI pipeline (e.g., GitHub Actions on a mirror) with results posted to the mailing list would be consistent with precedent in similar projects.

### 13.4 Ecosystem Enablement

libgcrypt has no dependent package ecosystem that requires separate enablement. Downstream distribution packages (Debian, Ubuntu, Arch Linux) are already building and shipping riscv64 binaries. No ecosystem investment is warranted.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Implement Poly1305 RISC-V vector acceleration (RVV C intrinsics, following ChaCha20 pattern) | 3-4 | Kivilinna (ideal) or contractor | High |
| Functional | Implement mpi/riscv64/ bignum assembly (add, sub, mul for RSA/ECC; follow amd64 pattern) | 6-10 | Specialist (bignum asm expertise required) | Medium |
| Performance | RVV Keccak/SHA-3 permute (RVV path to complement existing Zbb path) | 3-4 | Kivilinna or contractor | Medium |
| Performance | Real-hardware tuning of Zvknha/Zvknhb SHA-256/SHA-512 (LMUL, unrolling) on silicon with vector crypto | 2-3 | Requires physical Zvknha hardware | Medium |
| CI/CD | QEMU-based riscv64 build+test job (qemu-user-static; runs make check; reports to mailing list or public dashboard) | 2 | Infrastructure engineer | High |
| CI/CD | Real-hardware riscv64 CI runner (nightly bench-slope regressions; VLEN>128 correctness; requires RISC-V hardware with V and Zvkned) | 3 | Infrastructure engineer + hardware access | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libgcrypt project homepage](https://gnupg.org/software/libgcrypt/)
- [libgcrypt canonical git repository (gitweb)](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git)
- [libgcrypt GitHub mirror (gpg/libgcrypt)](https://github.com/gpg/libgcrypt)
- [GnuPG project tracker (dev.gnupg.org)](https://dev.gnupg.org/)
- [GnuPG bug T7647 - missing simd-common-riscv.h in tarball](https://dev.gnupg.org/T7647)
- [g10 Code GmbH](https://g10code.com/)
- [commit df9de2a5 - hwf: add detection of RISC-V (64-bit) hardware features](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=df9de2a5e5a847fa4f11a923cf3397bf1cf7a562)
- [commit 8dbee93a - chacha20: add RISC-V vector intrinsics implementation](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=8dbee93ac2f1bba095a0519a6e0656319cfddfa4)
- [commit 0f1fec12 - Add GHASH RISC-V Zbb+Zbc implementation](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=0f1fec12b0e9c952afaf78d3c973df41627cb3ff)
- [commit 1a660068 - Add SHA3 acceleration for RISC-V Zbb extension](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=1a660068ba5b58861de2c71b119ae2b6b6db0263)
- [commit b100dd25 - Fix missing simd-common-riscv.h in libgcrypt tarball](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=b100dd25eb6821d58851c2b802bfe9ef2f441228)
- [commit b000ab60 - Add RISC-V vector cryptography implementation of AES (Zvkned)](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=b000ab602531b2c29e93736afc1686dea8ed6782)
- [commit 5c9ce0cc - configure.ac: RISC-V vector crypto intrinsics bug checks without LTO](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=5c9ce0cc51d9fdbd8d859756a26ab42c8a89333a)
- [commit ef372b48 - rijndael-riscv-zvkned: optimize aes192 key setup](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=ef372b484e0f0876a6657f5ca692c101b8c113bd)
- [commit 4c9d7a3b - rijndael-riscv-zvkned: optimize do_prepare_decryption](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=4c9d7a3ba939255d78320d887eb648410949071d)
- [commit 3f684fc6 - rijndael-riscv-zvkned: fix m4 grouping when VLEN greater than 128](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=3f684fc6ab3ac98320e245a06b3563ad37ec56f5)
- [commit 77b98375 - configure: use AC_LINK_IFELSE for intrinsics to fix LTO builds](https://git.gnupg.org/cgi-bin/gitweb.cgi?p=libgcrypt.git;a=commit;h=77b98375ff4d6e9667ba6c8233e98e430d2c6988)
- [gcrypt-devel mailing list, January 2025 - initial RISC-V patch series with SpacemiT K1 benchmarks](https://lists.gnupg.org/pipermail/gcrypt-devel/2025-January.txt)
- [gcrypt-devel mailing list, February 2025 - MPI constant-time carry fix](https://lists.gnupg.org/pipermail/gcrypt-devel/2025-February.txt)
- [gcrypt-devel mailing list, August 2025 - Zvkned/Zvknha/Zvknhb/Zvkg/CRC patch series](https://lists.gnupg.org/pipermail/gcrypt-devel/2025-August.txt)
- [gcrypt-devel mailing list, September 2025 - LTO fix and Zvkg mapping fix](https://lists.gnupg.org/pipermail/gcrypt-devel/2025-September.txt)
- [gcrypt-devel mailing list, May 2026 - VLEN>128 bug fix](https://lists.gnupg.org/pipermail/gcrypt-devel/2026-May.txt)
- [Debian package tracker: libgcrypt20](https://tracker.debian.org/pkg/libgcrypt20)
- [Debian buildd status: libgcrypt20](https://buildd.debian.org/status/package.php?p=libgcrypt20)
- [Ubuntu 24.04 (Noble) package: libgcrypt20](https://packages.ubuntu.com/search?keywords=libgcrypt&suite=noble&searchon=names&section=all)
- [Arch Linux RISC-V port status](https://archriscv.felixc.at/)
- [GCC Bugzilla #121485 - vaes*_vs intrinsics emit wrong LMUL](https://gcc.gnu.org/bugzilla/show_bug.cgi?id=121485)
- [LLVM issue #151814 - vsha2cl emits vsha2ch](https://github.com/llvm/llvm-project/issues/151814)