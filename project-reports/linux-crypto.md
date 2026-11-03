---
title: Linux crypto
parent: Project Reports
color: yellow
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: OpenSBI
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: Perl
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="linux-crypto" %}

# Linux crypto

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-03<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for Linux crypto<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Linux crypto is the kernel cryptography subsystem. It has three parts relevant here:
- The CRYPTO API (`crypto/`, `drivers/crypto/`, `arch/*/crypto/`).
- The CRYPTO LIBRARY (`lib/crypto/`). Architecture-optimized code is increasingly migrated here.
- The CRC library (`lib/crc/`).

Documentation index: [Linux Kernel Crypto API](https://docs.kernel.org/crypto/index.html). Source of record: [torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git). This report reads the shared clone at HEAD `05441d697f7f` (v7.4-rc1-132, 2026-11-03). git.kernel.org and lore.kernel.org were not accessible to web fetches, so mailing-list coverage is partial.

Governance:
- No foundation owns the subsystem. It is part of the kernel, governed by the maintainer hierarchy under Linus Torvalds. The docs.kernel.org crypto index has no governance or foundation text.
- License: the kernel is GPL-2.0, and the riscv `patch-acceptance.rst` carries `SPDX-License-Identifier: GPL-2.0`. Per-file licensing of the crypto code was not checked [NEEDS VERIFICATION]. The commit message of `eb24af5d7a05` states the OpenSSL-derived assembly is dual-licensed for kernel reuse.
- There is no kernel tracking issue for the riscv64 crypto port. None would be expected, since the RISC-V port has been mainline since 4.15 [NEEDS VERIFICATION, single source]. The nearest tracking item is the original series cover letter, [PATCH 00/12] RISC-V: provide some accelerated cryptography implementations using vector extensions ([lore](https://lore.kernel.org/all/20231025183644.8735-1-jerry.shih@sifive.com/T/)).

Maintainers (MAINTAINERS at HEAD):

| Entry | Covers | Maintainers |
|---|---|---|
| CRYPTO API | `crypto/`, `drivers/crypto/`, `arch/*/crypto/` (includes leftover SM4 glue) | Herbert Xu, David S. Miller |
| CRYPTO LIBRARY | `lib/crypto/` (all riscv optimized code except SM4) | Eric Biggers, Jason A. Donenfeld, Ard Biesheuvel. Tree: `ebiggers/linux.git`, branches `libcrypto-next`, `libcrypto-fixes` |
| RISC-V ARCHITECTURE | `arch/riscv/` | Paul Walmsley, Palmer Dabbelt, Albert Ou. Reviewer: Alexandre Ghiti |

- There is no dedicated "RISC-V crypto" MAINTAINERS entry. I did not read the CRC library entry for `lib/crc/`.
- Two threads propose dropping Albert Ou from the RISC-V entry as inactive (Dec 2024 and Nov 2025, [thread](https://lkml.iu.edu/hypermail/linux/kernel/2511.3/01608.html)). Outcome not verified; he is still listed at HEAD.
- Employers of Herbert Xu and Ard Biesheuvel are not shown in MAINTAINERS [NEEDS VERIFICATION].

Sponsors and RISE:
- RISE (riseproject.dev) does not name Linux crypto as a funded project.
- Commit authorship shows contributions from Google (Eric Biggers until about April 2025, then a kernel.org address), SiFive, VRULL, ISCAS, Red Hat, Microchip, Intel, Rivos, Huawei and RISCStar (see Section 2).
- Of these, Google, SiFive, Red Hat, Microchip, ISCAS and SpacemiT are on the RISE members page. Qualcomm and Canonical are also members.

Community stance on new ports:
- There is no "new port" process, because RISC-V is mainline.
- The riscv crypto acceleration was welcomed and merged through Herbert Xu's crypto tree, then migrated to the library tree.
- I found no riscv-specific crypto policy statement and no sign of hostility toward riscv.
- The one standing rule is `Documentation/arch/riscv/patch-acceptance.rst`: extensions must be Frozen or Ratified, and churn is disfavored (Section 3).

## 2. Port History and Upstreaming Timeline

Dates are committer dates from the clone unless noted. Release tags were resolved with `git merge-base --is-ancestor` against the clone tags (v6.7 through v7.3), except where marked.

| Date | Event | Source |
|---|---|---|
| 2023-10-06 | Eric Biggers reviews Jerry Shih's (SiFive) "v4" vector crypto series. He objects to `.word`-generated instructions in `riscv.pm` and asks whether assembler support can be relied on. | [linux-riscv archive](https://lists.infradead.org/pipermail/linux-riscv/2023-October/041493.html) [NEEDS VERIFICATION: URL not confirmed] |
| 2023-10-25 | Jerry Shih posts [PATCH 00/12] with AES, ChaCha20, GHASH, SHA-2, SM3 and SM4 using Zvk*. The version numbering of this series differs between sources [NEEDS VERIFICATION]. | [lore](https://lore.kernel.org/all/20231025183644.8735-1-jerry.shih@sifive.com/T/) |
| 2023-11-30 | Zkr `CSR_SEED` seed source via `arch_get_random_seed_longs` (`102434010592`, Samuel Ortiz, Rivos), first in v6.8-rc1. | Clone `git log` |
| 2023-12 | v3 of the series. | [lkml](https://lkml.iu.edu/hypermail/linux/kernel/2312.0/04506.html) |
| 2024-01-21/22 | Eric Biggers' reworked series is committed by Palmer Dabbelt. The build hook (`178f3856436c`, Heiko Stuebner, VRULL) plus AES-ECB/CBC/CTR/XTS, ChaCha20, GHASH, SHA-224/256, SHA-384/512, SM3 and SM4 (Jerry Shih). All first in v6.9, released 2024-05-12. | Clone; [lkml v2](https://lkml.iu.edu/hypermail/linux/kernel/2401.0/04439.html) |
| 2024-03-20 | Parallel AES-CBC decrypt (`da215b089b5d`) and AES-CBC-CTS (`c70dfa4a2723`) committed (authored Feb 2024). Both in v6.9. | Clone |
| 2024-06-21 | First Zbc CRC32 (`a43fe27d6503`, Xiao Wang, Intel), merged for 6.11. | Clone `git log` [NEEDS VERIFICATION: tag not resolved in fetch pass] |
| 2025-03-10 | Eric Biggers' Zbc CLMUL template and CRC32, CRC-T10DIF, CRC64 (`bbe2610bc5ad`, `72acff5f8185`, `8bf3e17898eb`, `511484fa881e`). Tested-by Bjorn Topel, Acked-by Alexandre Ghiti. v6.15. | Clone |
| 2025-03-25 | Vector crypto extension validation checks (`38077ec8fc11`, Conor Dooley, Microchip). v6.15. | Clone |
| 2025-04-07 / 05-05 | ChaCha20 (`ceba0eda8313`) and SHA-256 (`bf52d93865bd`) converted to library interfaces. v6.16. | Clone |
| 2025-04-11 | vDSO getrandom for riscv (`ee0d03053e70`, Xi Ruoyao), v6.16-rc1. | Clone `git describe --contains` |
| 2025-06-07 | CRC code moved to `lib/crc/` (`b5943815e63b`), v6.17-rc1. | Clone `git log` |
| 2025-06-30 | `arch/riscv/lib/crypto/` moved into `lib/crypto/` (`daed4fcf04db`); SHA-512 migrated to the library (`b59059a22c5a`). v6.17. | Clone |
| 2025-08-29 | Poly1305 imported from OpenSSL/CRYPTOGAMS (`bef9c7559869`, Zhihang Shao and Chunyan Zhang, ISCAS). v6.18. | Clone |
| 2025-11-30 | Vivian Wang (ISCAS) reports a boot-time `chacha_zvkb` selftest crash without misaligned vector support. | [lkml](https://lkml.iu.edu/hypermail/linux/kernel/2511.3/04197.html); [linux-riscv](https://lists.infradead.org/pipermail/linux-riscv/2025-November/081584.html) |
| 2025-12-09 | ChaCha s0/fp fix (`43169328c7b4`) and the `RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS` dependency (`1cd5bb6e9e02`). v6.19. | Clone; [Link trailer](https://lore.kernel.org/r/20251206213750.81474-1-ebiggers@kernel.org) |
| 2025-12-14 | `.gitignore` for `poly1305-core.S` (`5a0b18825068`, Charles Mirabile, Red Hat). v6.19. | Clone |
| 2026-01-05 | Zk bundled extension fix adds Zknh (`8632180daf73`, Guodong Xu, RISCstar). v6.19. | Clone |
| 2026-01-12 | AES block cipher migrated to the library (`a4e573db06a4`). v7.0. | Clone |
| 2026-03-18 / 03-20 | GHASH (`af413d71f09d`) and SM3 (`5f6bbba5e9bb`) migrated to the library. v7.1 for GHASH. SM3 is listed as v7.1 in one finding and "not checked" in another [NEEDS VERIFICATION]. | Clone |
| 2026-05-06 | Zbkb `rev8`/`brev8` bit reversal (`e8620bd7e5e0`, Jinjie Ruan, Huawei). Tag not read [NEEDS VERIFICATION]. | Clone |
| 2026-05-14 | `min_t` to `min` cleanup (`fc2d791a43d3`, Thorsten Blum). One finding says v7.2; another says the tag was not checked [NEEDS VERIFICATION]. | [linux-riscv](https://lists.infradead.org/pipermail/linux-riscv/2026-May/091375.html) |
| 2026-09-27 | AES-ECB, CBC, CTR, XTS migrated to the library (`00e767a6d2f2`, `bd888e3dc9e0`, `f083f8de5290`, `69897f5e8552`). v7.4-rc1 confirmed for XTS only. | Clone; [patch link](https://patch.msgid.link/20260927224418.109759-21-ebiggers@kernel.org) |

Key contributors:

| Contributor | Org | Commits in `arch/riscv/crypto` + `lib/crypto/riscv` |
|---|---|---|
| Eric Biggers | Google, then kernel.org | 31 |
| Jerry Shih | SiFive | 7 |
| Herbert Xu | personal domain | 6 |
| Heiko Stuebner | VRULL | 1 |
| Charles Mirabile | Red Hat | 1 |
| Vivian Wang | ISCAS | 1 |
| Zhihang Shao | ISCAS-related, gmail address | 1 |
| Thorsten Blum | linux.dev | 1 |
| Nathan Chancellor | kernel.org | 1 |

Is it fully upstream? Yes for everything that exists. All commits above are in mainline, and none depends on an out-of-tree patch. Only the SM4 glue remains in `arch/riscv/crypto/` and has not yet been migrated to the library. I found no open or unmerged riscv64 crypto series for 2026, but this is a lower bound because lore search was not accessible.

## 3. Upstream Support Tier

The kernel has no formal tier policy. The governing rule is `Documentation/arch/riscv/patch-acceptance.rst`:
- Maintainers disapprove of churn and prefer well-reviewed, tested code.
- New extensions are accepted only if the spec is Frozen or Ratified. Draft-extension code stays in developers' own trees.
- Custom vendor extensions carry extra restrictions. That passage was cut off in the read.
- Patchwork automation builds and tests patches against riscv for-next, fixes and master. Failing patches are unlikely to be applied.

Evidence for riscv64 crypto:
- Official binaries: none separate. The code ships in the mainline kernel, released by kernel.org (Section 8).
- CI: no riscv64 crypto-specific CI found (Section 7).
- Release-blocking: no evidence of riscv64 crypto failures blocking releases. Data not available: no KernelCI, LKFT or syzbot results were retrievable.
- The vector crypto Zvk* extensions were ratified before the 2024 merge. I did not verify the date [NEEDS VERIFICATION].

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In mainline | Data not available: not searched | Data not available: not searched | Yes, riscv64 vector crypto since v6.9 |
| Accelerated SHA-3, SHA-1, MD5, Curve25519, BLAKE2, POLYVAL | Present, per the grade note comparing gaps vs arm64/x86 [NEEDS VERIFICATION] | Present, same note [NEEDS VERIFICATION] | None found |
| Dedicated crypto CI | Data not available: not searched | Data not available: not searched | None found |
| Generic KUnit crypto tests | Run if a CI invokes them (config is arch-generic) | Same | Same, but the in-tree QEMU config uses `-cpu rv64`, so only C fallbacks run |
| Dedicated MAINTAINERS entry | Data not available | Data not available | No; falls under CRYPTO API, CRYPTO LIBRARY, RISC-V ARCHITECTURE |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Algorithm code is hand-written assembly with C dispatch headers. Most vector assembly derives from OpenSSL (openssl/openssl#21923), reworked into `.S` files that use the assembler instead of `.word` encodings (`eb24af5d7a05`). Dispatch uses static keys and `kernel_vector_begin()`, with a generic C fallback (`lib/crypto/riscv/aes.h`).

| Component | Location | ISA extensions | Quality | Notes |
|---|---|---|---|---|
| AES block, ECB, CBC, CBC-CTS, CTR | `lib/crypto/riscv/aes-riscv64-zvkned*.S`, `aes.h` | Zvkned, plus Zvkb variant | Hand-written assembly | Keys `have_zvkned`, `have_zvkned_zvkb`. Requires VLEN >= 128. |
| AES-XTS | `aes-riscv64-zvkned-zvbb-zvkg.S` | Zvkned, Zvbb, Zvkg | Hand-written assembly | Key `have_xts`. Requires VLEN >= 128 and < 2048. |
| ChaCha20/12 | `chacha-riscv64-zvkb.S` | Zvkb | Hand-written assembly | `nrounds` parameter covers ChaCha12. |
| GHASH | `ghash-riscv64-zvkg.S` | Zvkg | Hand-written assembly | Open improvements per commit: more parallelism, optimized multiply, direct POLYVAL support. |
| SHA-224/256 | `sha256-riscv64-zvknha_or_zvknhb-zvkb.S` | Zvknha or Zvknhb, Zvkb | Hand-written assembly | |
| SHA-384/512 | `sha512-riscv64-zvknhb-zvkb.S` | Zvknhb, Zvkb | Hand-written assembly | |
| SM3 | `sm3-riscv64-zvksh-zvkb.S` | Zvksh, Zvkb | Hand-written assembly | |
| SM4 | `arch/riscv/crypto/sm4-riscv64-*` | Zvksed, Zvkb | Hand-written assembly | Only algorithm still using the skcipher glue in `arch/riscv/crypto/`. |
| Poly1305 | `poly1305-riscv.pl` | None (scalar) | Perl-generated assembly (CRYPTOGAMS) | Needs `perl` at build time. `default y if RISCV`, no extension gate. |
| CRC32, CRC-T10DIF, CRC64 | `lib/crc/riscv/` | Zbc (carry-less multiply), RV64 for CRC64 | C template with CLMUL folding | `default y if RISCV && RISCV_ISA_ZBC`. No Zvbc. |
| Entropy | `arch/riscv/include/asm/archrandom.h` | Zkr (`CSR_SEED`) | C | `arch_get_random_longs` returns 0. Early-boot variant for KASLR. No SBI RNG path found. |
| vDSO getrandom | `arch/riscv/kernel/vdso/vgetrandom-chacha.S` | base ISA | Assembly | v6.16-rc1. |
| Bit reversal | `arch/riscv/include/asm/bitrev.h` | Zbkb (`brev8`), Zbb or Zbkb (`rev8`) | Alternatives-patched C | Replaces the table lookup in `lib/bitrev.c`. |
| SoC hardware engines | `drivers/crypto/starfive/`, `drivers/char/hw_random/jh7110-trng.c` | n/a | Vendor drivers | StarFive JH7110 AES, hash, RSA and TRNG. No Sophgo, T-Head, Canaan or SpacemiT drivers by name [NEEDS VERIFICATION]. |

Gating:
- The vector crypto library entries are `default y` only if `RISCV && 64BIT && TOOLCHAIN_HAS_VECTOR_CRYPTO && RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS`.
- `RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS` depends on `NONPORTABLE`, and its help text warns of much slower or non-working behavior on hardware without fast vector unaligned access.
- `arch/riscv/lib/` holds only non-crypto helpers (`csum.c`, `strlen.S`, `memcpy.S`).
- No crypto-specific `testmgr` riscv code exists. The `CRYPTO_MANAGER_EXTRA_TESTS` path is generic.

Per-component comparison:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AES, ChaCha, GHASH, SHA-256/512, SM3, SM4, Poly1305 | Data not available: not searched | Data not available: not searched | Present (above) |
| SHA-3/Keccak, SHA-1, MD5, Curve25519, BLAKE2, POLYVAL | Present per grade note [NEEDS VERIFICATION] | Present per grade note [NEEDS VERIFICATION] | Missing |
| Scalar crypto (Zkn/Zks, Zknd, Zkne, Zknh) AES or SHA-2 | n/a | n/a | Missing. All AES is vector (Zvkned). |
| CRC acceleration | Data not available | Data not available | Zbc scalar; no Zvbc |

## 5. Build System, Cross-Compilation, and Toolchain

The kernel builds with Kbuild and Kconfig. No cmake, configure script or Dockerfile exists in the tree.

GNU cross-build:
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- defconfig
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc) Image modules
```
LLVM cross-build (`llvm.rst` lists riscv as supported):
```
make ARCH=riscv LLVM=1 defconfig
make ARCH=riscv LLVM=1 -j$(nproc) Image modules
```
Native riscv64 build: `make defconfig && make -j$(nproc)`. The boot image is `arch/riscv/boot/Image`. Debian cross package names `gcc-riscv64-linux-gnu` and `binutils-riscv64-linux-gnu` were assumed, not verified [NEEDS VERIFICATION].

Minimum tool versions (`scripts/min-tool-version.sh`, `changes.rst`; generic, not riscv-specific):

| Tool | Minimum |
|---|---|
| GCC | 8.1.0 |
| Clang/LLVM | 17.0.1 |
| binutils | 2.30 |
| GNU make | 4.0 |
| bash | 4.2 |
| Python | 3.9 |
| perl | no minimum listed; required to generate `poly1305-core.S` |

Why the effective riscv requirements are higher (Kconfig probes in `arch/riscv/Kconfig`):
- **Vector (`TOOLCHAIN_HAS_V`):** needs `-march=rv64imv`, `.option arch` support, and LLD or `LD_VERSION >= 23800` (binutils 2.38).
- **Zba, Zbb, Zbc, Zbkb:** each needs the matching `-march` string plus LLD or `LD_VERSION >= 23900` (binutils 2.39).
- **Vector crypto (`TOOLCHAIN_HAS_VECTOR_CRYPTO`):** an assembler probe that `.option arch, +v, +zvkb` assembles, and it depends on `AS_HAS_OPTION_ARCH`.
  - The Kconfig comment says LLVM added all vector crypto extensions at once. Binutils added all except Zvkb first, so the probe tests Zvkb.
  - The exact GCC, binutils and LLVM release numbers are not in the tree. Data not available: not searched outside the tree.
- **Zicsr/Zifencei:** `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` applies for GNU assembler 2.36 or newer. `TOOLCHAIN_NEEDS_OLD_ISA_SPEC` passes `-misa-spec=2.2` for GCC older than 11.3.0.
- A toolchain without Zvk* assembler support skips the vector crypto code silently, with no build error.

To build the vector crypto code:
- Set `CONFIG_NONPORTABLE=y` and `CONFIG_RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS=y`.
- Use a toolchain that passes the vector crypto probe.
- `CONFIG_CRYPTO_SM4_RISCV64` has the same dependencies.

Other Kconfig notes:
- `CONFIG_RISCV_ISA_V` also needs `FPU`.
- `RISCV_ISA_ZBC` needs `MMU`.
- `KBUILD_CFLAGS_MODULE += -mno-relax`.
- With Clang, `HAVE_LD_DEAD_CODE_DATA_ELIMINATION` is off with LLD.
- Dynamic ftrace needs `AS_IS_GNU || (AS_IS_LLVM && (LD_IS_LLD || LD_VERSION >= 23600))`.
- A symbol conditional on `LLD_VERSION < 180000` exists near line 259; I did not read what it controls.

QEMU usage (`tools/testing/kunit/qemu_configs/riscv.py`):
- It runs `qemu-system-riscv64 -machine virt -cpu rv64 -bios /usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin` with kernel `arch/riscv/boot/Image` and command line `console=ttyS0`.
- The script exits if OpenSBI is missing; the fix is to install `qemu-system-riscv`.
- KUnit command (composed from the docs and config, not executed):
  ```
  ./tools/testing/kunit/kunit.py run --arch=riscv --cross_compile=riscv64-linux-gnu- --kunitconfig=lib/crypto/.kunitconfig
  ```
- The `rv64` CPU has no Zvk*/Zk*, so this exercises only the C fallbacks. Exercising the assembly needs a `--qemu_args` override with `-cpu` extension properties (the exact QEMU property names were not verified [NEEDS VERIFICATION]) and the Kconfig gates above. `lib/crypto/.kunitconfig` sets neither `NONPORTABLE` nor the unaligned-access option.

Known build failures:
- No open build failure was found.
- Fixed items: missing `.gitignore` for generated `poly1305-core.S` (`5a0b18825068`), and a zvkb check for tip-of-tree clang (`886516fae2b7`, 2024-01-27, Eric Biggers).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 | Gap vs arm64/amd64 |
|---|---|---|
| AES (ECB, CBC, CBC-CTS, CTR, XTS, block) | Present (Zvkned) | No scalar Zkn AES path; vector-only |
| AES-GCM | GHASH accelerated (Zvkg); no combined AES-GCM routine found | AES-GCM acceleration listed as a mailing-list-only item not checked [NEEDS VERIFICATION] |
| ChaCha20, GHASH, SHA-2, SM3, SM4 | Present | None identified |
| Poly1305 | Present, scalar | Scalar only; vector variant not merged |
| SHA-3/Keccak, SHA-1, MD5 | Missing | Present on arm64/x86 per grade note [NEEDS VERIFICATION] |
| Curve25519, BLAKE2, POLYVAL | Missing | Same |
| CRC32, CRC-T10DIF, CRC64 | Zbc scalar CLMUL | No Zvbc; Biggers said Zvbc "would need to be shown to be worthwhile over just using Zbc" |
| HW RNG | Zkr seed source; JH7110 TRNG | No SBI-based RNG path found [NEEDS VERIFICATION] |

Functional gaps:
- Hardware without Zvk* gets only generic C code, except Poly1305 (scalar asm) and CRC (Zbc).
- Hardware with only emulated or no vector misaligned access gets no vector crypto acceleration at all, because of `RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS`.
  - Commit `1cd5bb6e9e02` says the restriction is Kconfig-time because per-CPU runtime detection is fragmented.
  - Andreas Schwab objected. Biggers replied that per-CPU differences make a runtime check infeasible today.
  - Hardware that supports misaligned vector access but does not select the option is also excluded.

Performance gaps:
- No kernel-level riscv64 vs arm64 or amd64 benchmark was found. No tcrypt, dm-crypt, fscrypt or WireGuard numbers were retrievable.
- Poly1305 (Andy Polyakov, [linux-riscv, 2025-07](https://lists.infradead.org/pipermail/linux-riscv/2025-July/074456.html)):

  | Variant | Hardware | Result |
  |---|---|---|
  | Scalar | SiFive U74 (JH7100/JH7110) | 1.8 cycles/byte, same with or without Zbb |
  | Vector | SpacemiT X60 | 1.3 cycles/byte, 2.5x over scalar. Only on a 256-bit vector unit; does not yet scale with vlenb. |

  - The merged code (`bef9c7559869`) is scalar. Its commit message claims 2 to 2.5x over the generic implementation on SpacemiT X60. The baselines differ from the thread's (generic vs scalar asm), and the vector variant is not in the tree. The two sources do not align and the merged-code gain on X60 is single-source [NEEDS VERIFICATION].
- Scalar GHASH RFC ([linux-riscv, 2025-04](https://lists.infradead.org/pipermail/linux-riscv/2025-April/069173.html), Qingfang Deng) gave no numbers. It noted GCC emits slow byte-wise unaligned loads unless tuned for a specific CPU, and that `get_unaligned_be64()` does not generate `rev8` even with Zbb. Status unknown.
- Userspace OpenSSL numbers, not kernel, as hardware-capability indicators only:
  - SpacemiT K3: AES-128-GCM 2372.7 MB/s single-thread with 16 KB blocks (OpenSSL 3.5.5, Bianbu kernel 6.18.3). For comparison, RK3588 Cortex-A76 got 2185.7 MB/s and Pine64 Star64 got 21.7 MB/s.
  - K3 with `OPENSSL_riscvcap` restricted to rv64gc: 68.8 MB/s, a 34.5x gap. Source: [tinycomputers.io K3 review](https://tinycomputers.io/posts/spacemit-k3-pico-itx-review.html) [NEEDS VERIFICATION, single source].
  - OpenBenchmarking result IDs [2404124-NE-OPENSSLRI42](https://openbenchmarking.org/result/2404124-NE-OPENSSLRI42&export=html&gru) (Scaleway EM-RV1), [2406243-NE-OPENSSL0637](https://openbenchmarking.org/result/2406243-NE-OPENSSL0637) (Sophgo Mango) and [2402208-NE-Y9951148071](https://openbenchmarking.org/result/2402208-NE-Y9951148071) (Exaleap NB2, one run exited non-zero) exist, but I did not extract per-test figures.
- The `CRYPTO_LIB_BENCHMARK` option exists in `lib/crypto/tests/Kconfig` but no output from it was found for riscv64.

Security hardening gaps:
- Data not available for constant-time or side-channel review of the riscv assembly.
- GhostWrite (T-Head XuanTie C910/C920) is a hardware flaw. The only mitigation is disabling vector, with up to 77% overhead reported [NEEDS VERIFICATION]. Vector crypto is unusable on those cores. No CVE ID or kernel patch was found. Sources: [Tom's Hardware](https://www.tomshardware.com/pc-components/cpus/ghostwrite-vulnerability-exploits-architectural-bug-in-risc-v-cpu-to-gain-root-access), [The Hacker News](https://thehackernews.com/2024/08/ghostwrite-new-t-head-cpu-bugs-expose.html).

NaN and floating-point semantics: not applicable to this subsystem. No findings relate to it.

## 7. CI/CD Infrastructure

No riscv64-specific crypto CI exists. Evidence:
- The tree has no `.github`, `.gitlab-ci.yml`, `.travis.yml`, `.circleci`, `.cirrus.yml`, `Jenkinsfile` or KernelCI configuration. A tree-wide search for CI-style filenames matched nothing.
- `lib/crypto/.kunitconfig` and `lib/crc/.kunitconfig` are architecture-generic. The first sets `CONFIG_KUNIT=y` and `CONFIG_CRYPTO_LIB_ENABLE_ALL_FOR_KUNIT=y` with per-algorithm tests. The second sets `CRC_ENABLE_ALL_FOR_KUNIT` and `CRC_KUNIT_TEST`.
- The riscv QEMU KUnit config uses `-cpu rv64`, which has no Zvk*/Zk*/Zbc (Section 5).
- `arch/riscv/configs/defconfig` has only `CONFIG_CRYPTO_USER_API_HASH=y` and `CONFIG_CRYPTO_DEV_VIRTIO=y` for crypto. It sets neither `CRYPTO_SELFTESTS` nor `KUNIT`.
- `tools/testing/selftests/riscv/` has abi, cfi, hwprobe, mm, sigreturn and vector. No crypto test is there.
- `tools/testing/kunit/configs/all_tests.config` mentions crypto in one line, `CONFIG_CRYPTO_LIB_ENABLE_ALL_FOR_KUNIT=y`, with no riscv entries.
- I did not read any `lib/crypto/tests/*_kunit.c` file, so the absence of riscv-specific tests there is unverified [NEEDS VERIFICATION].

External CI:
- The RISE Linux Kernel Pre-Commit CI builds riscv kernels on the RISE Build Farm (Hetzner), scraping the list through Patchwork. Sponsors are Bjorn Topel (Rivos) and Conor Dooley (Microchip). The wiki page is archived. The migrated document `developer-infrastructure-wg/docs/build-farm/linux-kernel-ci.md` was not read, so whether it exercises crypto or CRC self-tests is unknown.
- The RISE RP012 board farm Phase 1 boots OpenSBI, U-Boot and Linux on the Banana Pi BPI-F3 using LAVA. Phase 2 covers the SiFive Premier P550. The 2026 RVI Summit deck lists K230, BPI-F3, Orange Pi RV2 and K3 at OSU-OSL and Scaleway.
- RISE RISC-V runners ran over 13,000 jobs for 197 repos across 87 orgs between 2026-03-19 and 2026-05-06 ([post](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)). Users are userspace projects. No kernel crypto CI runs on them.
- KernelCI, LKFT, 0-day and syzbot: results not retrievable. `docs.kernelci.org` returned no mention of riscv, KUnit or crypto tests. [NEEDS VERIFICATION]

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI config | None (same tree) | None (same tree) | None |
| Crypto KUnit runs hardware-accelerated paths | Data not available | Data not available | No; `-cpu rv64` runs C fallbacks only |
| Pre-merge build CI | Data not available | Data not available | RISE and Patchwork builds |
| Real-hardware crypto tests | Data not available | Data not available | None evidenced |

## 8. Distribution and Release Status

- Linux crypto has no standalone binary or package. riscv64 support is in the kernel source (`lib/crypto/riscv`, `lib/crc/riscv`, `arch/riscv/crypto`) and ships in kernel releases by kernel.org (upstream release provider).
- PyPI: `https://pypi.org/pypi/linux-crypto/json` returned HTTP 404. The RISE wheel builder index redirected to PyPI and also returned 404. No PyPI `linux-crypto` project exists; this is not a relevant channel.
- Ubuntu 26.04: riscv64 availability was not checked, and a package named "Linux crypto" is not expected [NEEDS VERIFICATION].
- Distro kernel configs: not checked [NEEDS VERIFICATION]. Whether any distro riscv64 kernel sets `RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS` (and so builds the vector crypto code) is unknown.
- Related evidence: Bianbu kernel `6.18.3-5-spacemit-generic` was used for the K3 OpenSSL run and the libgcrypt bug report.

What a user must do to get a working accelerated build:
1. Run kernel v6.9 or newer (library-based layout needs v6.17 or newer; AES library needs v7.0 or newer).
2. Use a toolchain passing the `TOOLCHAIN_HAS_VECTOR_CRYPTO` probe.
3. Enable `CONFIG_NONPORTABLE=y` and `CONFIG_RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS=y` on hardware with efficient vector unaligned access.
4. Run on hardware advertising the Zvk*, Zbc or Zkr extensions. The relevant platform firmware must expose them (OpenSBI/device tree).

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | community |
|---|---|---|---|---|---|
| Linux kernel | runtime-dependency, critical. Host tree for `arch/riscv/crypto`, `lib/crypto/riscv`, `lib/crc/riscv` | Mainline riscv64 | KUnit and `CRYPTO_MANAGER_EXTRA_TESTS` exist; riscv64 coverage unverified [NEEDS VERIFICATION] | Mainline and stable releases | kernel.org |
| OpenSBI | runtime-dependency, critical. Firmware; Zvk*/Zk* discovered via device tree/hwprobe; OpenSBI 1.7+ emulates misaligned vector access by default | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | RISE System Firmware WG; OpenSBI interrupt handling post 2026-07-16 (not crypto) |
| GCC | build-dependency, critical. C compiler (minimum 8.1.0) | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | See project-reports/gcc.md |
| LLVM | build-dependency, optional. Alternative assembler and linker; Clang 17.0.1 or newer | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | See project-reports/llvm.md |
| GNU binutils | build-dependency, critical. Gate for `TOOLCHAIN_HAS_VECTOR_CRYPTO` and `TOOLCHAIN_HAS_ZB*` | Native riscv64 binutils exists [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | [NEEDS VERIFICATION] | Zb* checks need binutils 2.39 (`LD_VERSION >= 23900`) unless LLD is used |
| Perl | build-dependency, optional. `lib/crypto/Makefile` runs `poly1305-riscv.pl` via `$(PERL)` to generate `poly1305-core.S` | Data not available: no riscv64 perl check was run | Data not available | Data not available | No minimum listed in `changes.rst` |
| QEMU | test-dependency, optional. Non-hardware test platform for Zvk*, Zk*, Zbc | [NEEDS VERIFICATION] | KUnit config uses `-cpu rv64` | [NEEDS VERIFICATION] | RISE RP005 funds QEMU TCG performance for V and Zvk; see project-reports/qemu.md |

The project graph tool was unavailable in this session, so every row's graph data point is "not found (tool unavailable)". It reflects a missing tool, not a missing package. No Ubuntu 26.04 riscv64 availability was checked.

Deep-dive on dependencies:
- **GNU binutils / LLVM (assembler):** the vector crypto probe tests only `.option arch, +v, +zvkb`. Because the check is a Kconfig probe, an old assembler silently drops all vector crypto, which is the main toolchain failure mode.
- **OpenSBI:** the November 2025 crash arose because OpenSBI 1.7+ emulates misaligned vector accesses by default, while Linux disables that emulation via SBI FWFT and has none of its own. The kernel defines `CSR_SEED` (0x015) in `arch/riscv/include/asm/csr.h`. Zkr access from S-mode depends on `mseccfg` setup, which was not checked.
- **QEMU:** the only test platform in the tree defaults to a CPU without crypto extensions. RISE RP005 QEMU TCG speedups for V and Zvk could help the kernel code under emulation, but the sources do not tie them to the kernel.
- **Perl:** perl is required only for Poly1305 on riscv.
- Cross-references (out of scope): project-reports/openssl.md, project-reports/libgcrypt.md, project-reports/wireguard.md. The "Linux Vector" report covers vector state handling.

## 11. Known Bugs and Active Issues

Kernel bugs are tracked by thread and commit, not issue number. No open numbered kernel RISC-V crypto bug was found. lore search was blocked, so unmerged reports may exist.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [lkml 2511.3/04197](https://lkml.iu.edu/hypermail/linux/kernel/2511.3/04197.html); `1cd5bb6e9e02` | Vector crypto boot crash without misaligned vector support | Fixed v6.19 (Kconfig gate), `Cc: stable` | High (boot panic) | Reproduced on 6.17.9, 6.18-rc1, 6.18-rc7. Boot-time `chacha_zvkb` selftest crash on `vlsseg8e32.v`, Spike without `--misaligned`. Present since `bb54668837a0`. Reported-by Vivian Wang; commit carries Closes link to lore message `b3cfcdac-0337-4db0-a611-258f2868855f@iscas.ac.cn`. Stable backport status not verified. |
| `43169328c7b4` | `chacha_zvkb` clobbers s0/fp, so no stack trace on crash | Fixed v6.19, `Cc: stable` | Medium | Fixes `bb54668837a0`. |
| `5a0b18825068` | Missing `.gitignore` for `poly1305-core.S` | Fixed v6.19 | Low | Build hygiene. |
| `8632180daf73` | Zk bundled extension missing Zknh | Fixed v6.19 | Medium (cpufeature correctness) | Fixes `0d8295ed975b`. |
| Optimized code disabled by default | SHA-512, AES, GHASH, SM3, XTS were not enabled by default | Fixed per algorithm by library migration (v6.17, v7.0, v7.1, v7.4) | Medium | Still gated by `NONPORTABLE` + `RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS` (Section 6). |
| Runtime detection of vector unaligned access | Kconfig-only restriction; Andreas Schwab objected | Open design gap | Medium | Biggers: runtime check infeasible today. |
| [RISE #133](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/133) | Poly1305 optimization, vector and non-vector | Todo, no assignee, no linked patches | Low | Opened 2026-07-17; Updates field dated 2024-01-25. Scalar Poly1305 has already merged (`bef9c7559869`), so the tracker appears stale or covers only the vector variant. |
| [RISE #100](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/100) | CRC-T10DIF using Zbc | Tracker shows In Progress | Low | Already merged in v6.15 (`8bf3e17898eb`). Tracker is stale [NEEDS VERIFICATION]. |
| GHASH scalar RFC (2025-04) | Qingfang Deng | Status unknown | Low | Not found merged. |
| [Ubuntu bug 2154120](https://lists.snapcraft.io/archives/foundations-bugs/2026-May/549174.html) | libgcrypt/gpg fails when VLEN is not 128 | Userspace, not kernel | Medium | SpacemiT K3 (VLEN=256) and QEMU `-cpu max,vlen=256`. Fix: [libgcrypt commit 3f684fc6](https://github.com/gpg/libgcrypt/commit/3f684fc6ab3ac98320e245a06b3563ad37ec56f5). Ubuntu: Confirmed for Resolute and Stonking, Invalid for Questing. Belongs to the libgcrypt report. |
| GhostWrite | T-Head C910/C920 hardware flaw | No kernel fix found | High (hardware) | See Section 6. |

Correctness bugs: the crash (row 1), the Zknh omission (row 4) and the fp clobber (row 2) are the correctness-class items, and all are fixed in v6.19. CVE-2026-53312 (RISC-V IOMMU invalidation overflow) is not crypto and is out of scope.

## 12. Objections and Upstream Blockers

Stated objections:
- Eric Biggers (Oct 2023) objected to `.word`-generated crypto instructions in `riscv.pm`. Resolved: the merged code uses regular `.S` files and the assembler (`eb24af5d7a05`).
- Ard Biesheuvel noted that a `cra_alignmask` workaround would not cover library-interface callers, and suggested requiring Zicclsm and Zvkb. The merged fix used a Kconfig dependency instead.
- Andreas Schwab objected to the Kconfig-only restriction. Biggers' stated reply is above. Unresolved, but the code is merged.

Technical blockers:
- No runtime-detectable "efficient vector unaligned access" signal per CPU, which is the stated reason for the Kconfig gate. Until it exists, hardware with only emulated misaligned vector access gets no acceleration.
- Any new vector assembly competes with Biggers' library-first direction (arch code goes in `lib/crypto/`).
- Biggers noted Zvbc CRC "would need to be shown to be worthwhile over just using Zbc", so a Zvbc patch needs benchmark evidence.

Organizational blockers:
- No dedicated RISC-V crypto maintainer. Review load sits with the CRYPTO LIBRARY maintainers, and Eric Biggers authored 31 of the commits in these paths.
- Patch acceptance requires ratified specs and discourages churn (Section 3).
- No RISE funding for kernel crypto was found, though RISE Kernel & Virtualization WG issues track Poly1305 and Zbc CRC work.
- No governance obstacle to riscv64 was found.

Acceptance probability for new riscv64 crypto patches: no refusal of any riscv64 crypto patch was found, and Biggers and Biesheuvel reviewed or acked most migrations. I did not find evidence to quantify a probability. Unmerged series cannot be ruled out because lore search was blocked.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream
- **Optimization-purpose project:** no

Justification: mainline Linux has shipped riscv64 crypto since v6.9 (arch/riscv/crypto, now mostly lib/crypto/riscv with Zvk*, Zbc CRC and Zkr), released by kernel.org. There is no crypto-specific riscv64 CI: [lib/crypto/.kunitconfig](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/lib/crypto/.kunitconfig) is generic, and the [KUnit QEMU riscv config](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/tools/testing/kunit/qemu_configs/riscv.py) uses `-cpu rv64`, which has no Zvk*/Zk*, so only the C fallbacks run. The riscv defconfig does not enable KUnit or CRYPTO_SELFTESTS. Only RISE and Patchwork pre-commit riscv kernel builds are evidenced, so the grade is yellow for build-only coverage. KernelCI, LKFT and syzbot could not be checked (lore and git.kernel.org was not accessible) and distro kernel configs were not checked, so confidence is medium-low. No stored report existed for this subsystem.

Pending work that could change the grade:
- Open gaps vs arm64/x86: no SHA-3/Keccak, SHA-1, MD5, Curve25519, BLAKE2 or POLYVAL riscv code, and no Zvbc CRC.
- SM4 glue is still in `arch/riscv/crypto` and not yet migrated to `lib/crypto`.
- All vector-crypto code is gated on `RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS` (commit `1cd5bb6e9e02`, fix for the Nov 2025 chacha_zvkb boot crash), so hardware with only emulated or no misaligned vector access gets no acceleration.
- No open unmerged riscv64 crypto series was found, but lore search was blocked.
- No RISE funding or work on kernel crypto was found. RISE funds adjacent kernel pre-commit CI, the board farm and QEMU Zvk TCG speedups.
- The grade could rise to blue or green if KernelCI, LKFT or RISE CI is confirmed to run the lib/crypto and lib/crc KUnit tests on riscv64 with Zvk*/Zbc enabled (for example QEMU with `-cpu` extension flags, or real hardware such as the SpacemiT K1/K3).

## 14. Investment Analysis

Already covered by others (not sized): vector crypto and Zbc CRC are merged, the library migration is driven by Eric Biggers, and scalar Poly1305 has merged from ISCAS. RISE already funds the kernel pre-commit build CI, the RP012 board farm, QEMU TCG Zvk speedups (RP005) and TH1520 mainline work. RISE tracks Poly1305 (#133) and benchmarking (#141) in the Kernel & Virtualization WG. Effort figures below are my planning estimates, not sourced from the research.

### 14.1 Functional Enablement
- Add riscv64 assembly for SHA-3/Keccak, and optionally SHA-1, MD5, BLAKE2, Curve25519 and POLYVAL. These exist on arm64/x86 per the grade note. The GHASH commit message lists direct POLYVAL support as a wanted improvement.
- Migrate SM4 from `arch/riscv/crypto` to `lib/crypto`.
- Confirm the status of the 2025-04 scalar GHASH RFC and any other unmerged series once lore is reachable.
- Solving the vector-unaligned runtime-detection gap requires an upstream design agreed with the RISC-V and CRYPTO LIBRARY maintainers, so the estimate carries high uncertainty.

### 14.2 Performance Optimization
- Produce first kernel-level numbers (`CRYPTO_LIB_BENCHMARK`, tcrypt, dm-crypt) on SpacemiT K1/K3 and other Zvk* silicon. None exist today, and this overlaps RISE #141.
- Vector Poly1305 (RISE #133). Polyakov's thread shows 1.3 cycles/byte on X60 but only on a 256-bit vector unit, so VLEN scaling work is needed.
- Evaluate Zvbc CRC only if benchmarks show a gain over Zbc.
- Improve GHASH parallelism per the commit message's open items.

### 14.3 CI/CD Infrastructure
- Highest-value item for the grade. Run `lib/crypto/.kunitconfig` and `lib/crc/.kunitconfig` on riscv64 with `NONPORTABLE`, `RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS` and the Zvk*/Zbc extensions enabled, under QEMU (`--qemu_args`, with property names to be verified) and on board-farm hardware (K3, BPI-F3).
- First confirm whether KernelCI, LKFT, or the RISE kernel CI document `linux-kernel-ci.md` already do this.
- Add a toolchain-matrix job so that a build without Zvk* assembler support is detected rather than silently skipping the code.

### 14.4 Ecosystem Enablement
- No dependent package ecosystem (Section 10 omitted). The ecosystem-adjacent item is auditing distro riscv64 kernel configs for `RISCV_EFFICIENT_VECTOR_UNALIGNED_ACCESS` and `NONPORTABLE`, since acceleration is off otherwise.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Confirm existing KernelCI/LKFT/RISE kernel CI coverage of crypto and CRC KUnit on riscv64 | 1 to 2 | Internal kernel team with RISE Developer Infrastructure WG | Critical |
| CI/CD | Add riscv64 KUnit job with Zvk*/Zbc enabled (QEMU and board farm) | 4 to 6 | RISE Developer Infrastructure WG | Critical |
| Functional | Audit distro riscv64 kernel configs for the unaligned-vector gate | 1 to 2 | Distro integration team | High |
| Performance | Kernel-level crypto and CRC benchmarks on K1/K3 and other Zvk* silicon | 3 to 5 | Internal kernel team with RISE #141 | High |
| Functional | Runtime or per-CPU detection of efficient vector unaligned access, replacing the Kconfig gate | 8 to 16 | Upstream (Biggers, Biesheuvel, RISC-V maintainers) | High |
| Functional | SHA-3/Keccak riscv64 assembly | 4 to 8 | Upstream CRYPTO LIBRARY contributors | Medium |
| Performance | Vector Poly1305 with VLEN scaling (RISE #133) | 4 to 6 | RISE Kernel & Virtualization WG | Medium |
| Functional | SHA-1, MD5, BLAKE2, Curve25519, POLYVAL riscv64 code | 8 to 16 | Upstream contributors | Low to Medium |
| Functional | Migrate SM4 glue to `lib/crypto` | 1 to 2 | Upstream CRYPTO LIBRARY | Low |
| Performance | Zvbc CRC, only if benchmarks justify | 3 to 5 | Upstream contributors | Low |

## 15. References

- [Linux Kernel Crypto API documentation](https://docs.kernel.org/crypto/index.html)
- [torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [lib/crypto/.kunitconfig](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/lib/crypto/.kunitconfig)
- [KUnit QEMU riscv config](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/tree/tools/testing/kunit/qemu_configs/riscv.py)
- [Linux kernel LLVM build documentation](https://docs.kernel.org/kbuild/llvm.html)
- [PATCH 00/12 RISC-V: provide some accelerated cryptography implementations using vector extensions (lore, 2023-10-25)](https://lore.kernel.org/all/20231025183644.8735-1-jerry.shih@sifive.com/T/)
- [PATCH v3 00/12 (lkml, 2023-12)](https://lkml.iu.edu/hypermail/linux/kernel/2312.0/04506.html)
- [PATCH v2 00/12 RISC-V crypto with reworked asm files (lkml, 2024-01)](https://lkml.iu.edu/hypermail/linux/kernel/2401.0/04439.html)
- [RFC: RISC-V cryptography accelerations (LWN)](https://lwn.net/Articles/922521/)
- [LWN article 953765](https://lwn.net/Articles/953765/)
- [linux-riscv October 2023 archive message](https://lists.infradead.org/pipermail/linux-riscv/2023-October/041493.html)
- [lkml report: crypto_zvkb crashes on selftest if no misaligned vector support](https://lkml.iu.edu/hypermail/linux/kernel/2511.3/04197.html)
- [linux-riscv report, 2025-11](https://lists.infradead.org/pipermail/linux-riscv/2025-November/081584.html)
- [Commit 1cd5bb6e9e02 patch link](https://lore.kernel.org/r/20251206213750.81474-1-ebiggers@kernel.org)
- [Thorsten Blum min_t cleanup, linux-riscv 2026-05](https://lists.infradead.org/pipermail/linux-riscv/2026-May/091375.html)
- [AES library migration patch link (2026-09-27)](https://patch.msgid.link/20260927224418.109759-21-ebiggers@kernel.org)
- [Poly1305 benchmark thread, Andy Polyakov, linux-riscv 2025-07](https://lists.infradead.org/pipermail/linux-riscv/2025-July/074456.html)
- [Scalar GHASH RFC, linux-riscv 2025-04](https://lists.infradead.org/pipermail/linux-riscv/2025-April/069173.html)
- [MAINTAINERS: Drop Albert Ou from RISC-V heading](https://lkml.iu.edu/hypermail/linux/kernel/2511.3/01608.html)
- [Ubuntu bug 2154120 (foundations-bugs, 2026-05)](https://lists.snapcraft.io/archives/foundations-bugs/2026-May/549174.html)
- [libgcrypt commit 3f684fc6](https://github.com/gpg/libgcrypt/commit/3f684fc6ab3ac98320e245a06b3563ad37ec56f5)
- [tinycomputers.io SpacemiT K3 review](https://tinycomputers.io/posts/spacemit-k3-pico-itx-review.html)
- [OpenBenchmarking 2404124-NE-OPENSSLRI42](https://openbenchmarking.org/result/2404124-NE-OPENSSLRI42&export=html&gru)
- [OpenBenchmarking 2406243-NE-OPENSSL0637](https://openbenchmarking.org/result/2406243-NE-OPENSSL0637)
- [OpenBenchmarking 2402208-NE-Y9951148071](https://openbenchmarking.org/result/2402208-NE-Y9951148071)
- [GhostWrite, Tom's Hardware](https://www.tomshardware.com/pc-components/cpus/ghostwrite-vulnerability-exploits-architectural-bug-in-risc-v-cpu-to-gain-root-access)
- [GhostWrite, The Hacker News](https://thehackernews.com/2024/08/ghostwrite-new-t-head-cpu-bugs-expose.html)
- [RISE Project](https://riseproject.dev)
- [RISE members](https://riseproject.dev/members/)
- [RISE RISC-V runners six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE Kernel & Virtualization WG issue 133 (Poly1305)](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/133)
- [RISE Kernel & Virtualization WG issue 100 (CRC-T10DIF Zbc)](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/100)
- [RISE Kernel & Virtualization WG issue 141 (Benchmarking)](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/141)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [RISE Linux Kernel Pre-Commit CI wiki page](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8588931/RISE+Linux+Kernel+Pre-Commit+CI)
- [Original ebiggers vector crypto patch (lore)](https://lore.kernel.org/linux-crypto/20240102064743.220490-10-ebiggers@kernel.org/)
- [linux-riscv mirror commit 67daf842](https://github.com/linux-riscv/linux-riscv/commit/67daf84203a02cf004e7c3faed8b654817326e26)
- [kernelconfig.io CRYPTO_AES_RISCV64](https://kernelconfig.io/config_crypto_aes_riscv64)
- [wireguard-linux lib/crypto/riscv tree](https://git.zx2c4.com/wireguard-linux/plain/lib/crypto/riscv/)
- Local kernel clone (HEAD `05441d697f7f`), used for MAINTAINERS, Kconfig, Makefiles, `patch-acceptance.rst` and git history.