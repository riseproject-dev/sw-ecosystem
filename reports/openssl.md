---
title: OpenSSL
categories:
  - libraries
---

# OpenSSL

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenSSL<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[OpenSSL](https://www.openssl.org/) is the dominant open-source TLS/cryptographic library. It underpins the majority of Linux userspace TLS stacks, package managers, language runtimes (Python, Ruby, Node.js), and critical infrastructure software. Any RISC-V platform targeting production workloads requires a functional, performant OpenSSL.

**Repository:** [openssl/openssl](https://github.com/openssl/openssl)
**License:** Apache License 2.0
**Latest releases (all published 2026-06-09):** openssl-4.0.1, openssl-3.6.3, openssl-3.5.7, openssl-3.4.6, openssl-3.0.21
**Governance:** Multi-entity structure. The OpenSSL Foundation (nonprofit) holds mission and funding. The OpenSSL Corporation delivers commercial support. The library project itself is governed by 26 elected committers with a Business Advisory Committee and Technical Advisory Committee. Board of Directors: Matt Caswell, Richard Levitte, Tomas Mraz.
**Premier sponsors:** OpenSSL Corporation, Cisco, Sovereign Tech Fund, FLOSS/fund, Nominet.

---

## 2. Port History and Upstreaming Timeline

The RISC-V port of OpenSSL began in early 2022 and has been active since.

**First RISC-V commit:** May 19, 2022. [PR #17640](https://github.com/openssl/openssl/pull/17640) was opened February 4, 2022 and merged May 19, 2022 by paulidale (Paul Dale). Author: Henry Brausen (henry.brausen@vrull.eu). Reviewers: Philipp Tomsich (vrull.eu), Tomas Mraz, Paul Dale.

The initial merge introduced four commits: linux64-riscv64 ASM target support, a four-table AES implementation in RV64I assembly, a RISC-V CPUID stub with `OPENSSL_riscvcap` env variable, carry-less-multiplication GCM via Zbb/Zbc, and BSWAP routines via Zbb `rev8`.

**Subsequent major milestones (all merged unless noted):**

| Year | Event |
|------|-------|
| 2022 | AES RV32 Zkn ([#18308](https://github.com/openssl/openssl/pull/18308)), AES RV64 Zkn ([#18197](https://github.com/openssl/openssl/pull/18197)), SM3 Zksh ([#18287](https://github.com/openssl/openssl/pull/18287)), GCM GHASH ([#20078](https://github.com/openssl/openssl/pull/20078)) |
| 2023 | Full Zvk vector crypto suite -- Zvkned/Zvkg/Zvksh/Zvksed/Zvknha/Zvknhb/Zvbc/Zvbb ([#21923](https://github.com/openssl/openssl/pull/21923)), dual-licensing cleanup ([#21018](https://github.com/openssl/openssl/pull/21018), [#20649](https://github.com/openssl/openssl/pull/20649), [#21357](https://github.com/openssl/openssl/pull/21357)) |
| 2024 | ChaCha20 vector-only ([#24069](https://github.com/openssl/openssl/pull/24069)), hwprobe syscall for capability detection ([#24172](https://github.com/openssl/openssl/pull/24172)), vlenb symbol for assembler ([#25539](https://github.com/openssl/openssl/pull/25539)), musl riscv64 fix ([#25787](https://github.com/openssl/openssl/pull/25787)), SM2 RV64 asm ([#25918](https://github.com/openssl/openssl/pull/25918)) |
| 2025 | Montgomery multiplication RV64GC ([#27926](https://github.com/openssl/openssl/pull/27926)), SHA512 RVV ([#29263](https://github.com/openssl/openssl/pull/29263)), SM3 vector crypto ([#29264](https://github.com/openssl/openssl/pull/29264)) |
| 2026 | Montgomery squaring RV64GC ([#29440](https://github.com/openssl/openssl/pull/29440)), AES-GCM dispatch fixes ([#30714](https://github.com/openssl/openssl/pull/30714), [#30713](https://github.com/openssl/openssl/pull/30713)), SM4-CBC instruction reordering ([#29544](https://github.com/openssl/openssl/pull/29544)), cpuid BIO_snprintf refactor ([#30557](https://github.com/openssl/openssl/pull/30557)) |

**Primary RISC-V contributors since 2022:**

| Contributor | Affiliation | Contribution area |
|---|---|---|
| Henry Brausen | vrull.eu | Original port author |
| Philipp Tomsich | vrull.eu | Original reviewer |
| ZenithalHourlyRate / Hongren Zheng | Google / Tsinghua | Vector crypto extensions, CI |
| Christoph Mullner (cmuellner) | (independent / upstream) | hwprobe detection, April 2026 fixes burst |
| cxx194832 | (unknown) | SHA512 RVV optimization (Nov 2025) |
| HeliC829 / Julian Zhu | ISCAS | ChaCha20, Poly1305, SHA3 |
| zl523856 | OpenAnolis / Alibaba-ZTE | SM4-XTS, SM4-CBC |

No master tracking issue exists for RISC-V work. OpenSSL does not maintain an umbrella ticket; all work is tracked through individual PRs.

---

## 3. Upstream Support Tier

OpenSSL does not publish a formal platform support tier document (no PLATFORMS.md in the repository). The practical evidence indicates RISC-V is treated as a first-class supported target:

- Bug fixes are backported across all active stable branches (3.4, 3.5, 3.6, 4.0, master).
- A dedicated named CI workflow (`riscv-more-cross-compiles.yml`) exists covering 13 extension-specific configurations.
- The `severity: fips change` label is applied to RISC-V PRs that touch security-critical code paths, indicating the same scrutiny level as other architectures.
- The project accepts RISC-V contributions under the standard committer review process.
- 36 RISC-V architecture-specific files are present in the repository (source files only; does not count build.info entries).

**RISE Project involvement:** The RISE Project ([riseproject.dev](https://riseproject.dev)) has no blog posts, funded work, repositories, or documented involvement with OpenSSL. All 27 RISE blog posts from May 2024 through June 2026 were reviewed; none mention OpenSSL. RISE does not appear as a co-author or funder on any OpenSSL RISC-V PR. However, several organizations that contribute to OpenSSL RISC-V are RISE members: ISCAS (General Member), Alibaba DAMO Academy (Premier Member), ZTE (General Member). This is indirect alignment, not direct RISE funding.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Runtime CPU Feature Detection

Three files implement the detection infrastructure:

**`crypto/riscvcap.c`** -- CPU feature detection, runtime capability dispatch. Implements `OPENSSL_cpuid_setup()` as a constructor that runs at library load. Detection sources in priority order: (1) `OPENSSL_riscvcap` env var (parses arch strings like `rv64gc_zba_zbb`), (2) Linux `riscv_hwprobe` syscall (Linux 6.4+), (3) `getauxval(AT_HWCAP)`. Calls `riscv_vlen_asm()` to measure actual VLEN if vector support is detected.

**`crypto/riscv64cpuid.pl`** and **`crypto/riscv32cpuid.pl`** -- Perlasm generators for three utility routines each: `CRYPTO_memcmp` (constant-time), `OPENSSL_cleanse` (secure zero), `riscv_vlen_asm` (reads CSR `0xc22` = `vlenb`, returns VLEN in bits). ISA: RV64I/RV32I base only.

**`include/arch/riscv_arch.h`** -- Architecture header. Defines `OPENSSL_riscvcap_P[]` capability array, `RISCV_HAS_xxx()` check macros, combination macros (e.g. `RISCV_HAS_ZVKB_AND_ZVKNHA()`), and `riscv_vlen()` accessor.

**`include/arch/riscv_arch.def`** -- X-macro definition file listing all 24 tracked ISA extensions:

| Extension | Category |
|---|---|
| ZBA, ZBB, ZBC, ZBS | Bit-manipulation |
| ZBKB, ZBKC, ZBKX | Scalar crypto support |
| ZKND, ZKNE | Scalar AES decrypt/encrypt |
| ZKNH | Scalar SHA |
| ZKSED | Scalar SM4 |
| ZKSH | Scalar SM3 |
| ZKR | Entropy source (no hwprobe mapping) |
| ZKT | Scalar crypto group |
| V | Vector base |
| ZVBB | Vector bit-manipulation |
| ZVBC | Vector carry-less multiply |
| ZVKB | Vector crypto bit-manipulation |
| ZVKG | Vector GCM |
| ZVKNED | Vector AES |
| ZVKNHA, ZVKNHB | Vector SHA-256, SHA-512 |
| ZVKSED | Vector SM4 |
| ZVKSH | Vector SM3 |

### 4.2 Cryptographic Primitives Implemented

**AES** (6 assembly files):

| File | ISA requirements |
|---|---|
| `aes-riscv64.pl` | RV64I table-based (baseline) |
| `aes-riscv64-zkn.pl` | RV64I + Zkne + Zknd |
| `aes-riscv32-zkn.pl` | RV32I + Zkne + Zknd + (opt) Zbkb |
| `aes-riscv64-zvkned.pl` | RV64I + V (VLEN>=128) + Zvkned |
| `aes-riscv64-zvkb-zvkned.pl` | RV64I + V (VLEN>=128) + Zvkb + Zvkned + Zicclsm |
| `aes-riscv64-zvbb-zvkg-zvkned.pl` | RV64I + V (VLEN>=128) + Zvbb + Zvkg + Zvkned + Zicclsm (AES-XTS) |

Note: AES-192 has a known limitation with Zvkned key scheduling (hardware encryption, software key generation). AES-128 and AES-256 are fully accelerated.

Provider dispatch files cover CBC, ECB, CTR, GCM, CCM modes for both RV32 and RV64, with three-tier fallback: vector crypto > scalar Zkn > generic C.

**SHA-2** (4 assembly files):

| File | ISA requirements |
|---|---|
| `sha256-riscv64-zbb.pl` | RV64I + Zbb |
| `sha256-riscv64-zvkb-zvknha_or_zvknhb.pl` | RV64I + V (VLEN>=128) + Zvkb + Zvknha/b |
| `sha512-riscv64-zbb.pl` | RV64I + Zbb |
| `sha512-riscv64-zvkb-zvknhb.pl` | RV64I + V (VLEN>=128) + Zvkb + Zvknhb |

Dispatcher selects: vector crypto (Zvkb + Zvknha/b) > Zbb > generic C.

**GCM/GHASH** (3 assembly files): Zbc scalar (with Zbb or Zbkb variants), Zvbc vector, Zvkg vector. A combined AES-GCM path (`aes-gcm-riscv64-zvkb-zvkg-zvkned.pl`) provides the highest-performance AES-128/256 GCM.

**ChaCha20**: `chacha-riscv64-v-zbb.pl` (V + Zbb + optional Zvkb). Dispatcher guards on `len > CHACHA_BLK_SIZE && RISCV_HAS_ZBB() && riscv_vlen() >= 128`.

**SM3** (2 assembly files): Zbb scalar, V+Zvkb+Zvksh vector.

**SM4** (1 assembly file merged): V+Zvkb+Zvksed vector. Scalar Zksed PR ([#30735](https://github.com/openssl/openssl/pull/30735)) is open as of June 2026.

**Big Number / Montgomery arithmetic**: `riscv64-mont.pl` -- Montgomery multiplication `bn_mul_mont` and optimized squaring `bn_sqr8x_mont`. ISA: RV64I + M. No vector or crypto extensions required.

**Elliptic Curve SM2**: `ecp_sm2p256-riscv64.pl` -- SM2 P-256 finite field arithmetic (Generalized Mersenne reduction). ISA: RV64I + M + Zba.

**SHA-3**: No merged optimized implementation. [PR #29970](https://github.com/openssl/openssl/pull/29970) (Keccak-1600 via Zbb) is open with correctness review concerns (alignment bug). [PR #29567](https://github.com/openssl/openssl/pull/29567) and [#29498](https://github.com/openssl/openssl/pull/29498) were closed without merging.

**Poly1305**: No merged optimized implementation. [PR #31182](https://github.com/openssl/openssl/pull/31182) (dot-asm port, RVV) is open as of May 2026.

**MD5**: `md5-riscv64-zbb.pl` exists (referenced in issue [#29357](https://github.com/openssl/openssl/issues/29357) context).

**RSA**: Accelerated via the Montgomery arithmetic backend above. No RSA-specific assembly beyond `riscv64-mont.pl`.

**Perlasm helper**: `crypto/perlasm/riscv.pm` encodes all scalar Zkn instructions, Zbb/Zbkb, full RVV base, and all Zvk vector crypto instructions. Also provides pure-RV64I software fallbacks for brev8, orn, roriw.

### 4.3 Extension Coverage Summary

| Category | Extensions with merged code |
|---|---|
| Scalar bit-manipulation | Zba, Zbb, Zbc, Zbkb |
| Scalar AES | Zknd, Zkne |
| Scalar hash | Zknh (via dispatcher), Zksh |
| Scalar SM4 | Zksed (tracked but scalar asm open in [#30735](https://github.com/openssl/openssl/pull/30735)) |
| Vector base | V (VLEN >= 128 required throughout) |
| Vector bit-manipulation | Zvbb, Zvkb |
| Vector carry-less multiply | Zvbc |
| Vector GCM | Zvkg |
| Vector AES | Zvkned |
| Vector SHA | Zvknha, Zvknhb |
| Vector SM3 | Zvksh |
| Vector SM4 | Zvksed |

ZBKC, ZBKX, ZKR, ZKT are tracked in `riscv_arch.def` but have no dedicated assembly implementations.

---

## 5. Build System, Cross-Compilation, and Toolchain

OpenSSL uses a Perl-based `./Configure` build system. There is no CMakeLists.txt. All RISC-V targets are declared in `Configurations/10-main.conf`:

```
linux64-riscv64: inherits linux-generic64, perlasm_scheme=linux64, asm_arch=riscv64
linux32-riscv32: inherits linux-latomic, perlasm_scheme=linux32, asm_arch=riscv32
BSD-riscv64:     inherits BSD-generic64, perlasm_scheme=linux64, asm_arch=riscv64
BSD-riscv32:     inherits BSD-generic32, perlasm_scheme=linux32, asm_arch=riscv32
```

`linux32-riscv32` inherits `linux-latomic` (adds `-latomic` for 32-bit atomic operations).

**Native build on a riscv64 host:**

```
./config
make -j$(nproc)
make test
```

**Cross-compilation from x86_64:**

```
./Configure linux64-riscv64 \
    --cross-compile-prefix=riscv64-linux-gnu- \
    --prefix=/usr/local
make -j$(nproc)
```

**Capability override for testing:**

```
OPENSSL_riscvcap=RV64GC_ZBA_ZBB_ZBC_ZBS_ZKT_V make test HARNESS_JOBS=4
```

**Assembler requirements:** GNU assembler supports rv64gc fully. ISA extension encoding for the Zvk suite requires binutils >= 2.38. OpenSSL CI uses `ubuntu-latest` with the `binutils-riscv64-linux-gnu` cross-toolchain without issues. Older binutils (< 2.38, e.g. Ubuntu 20.04) will fail to assemble vector crypto paths.

**Disabling assembly:**

```
./Configure linux64-riscv64 no-asm --cross-compile-prefix=riscv64-linux-gnu-
```

**FIPS module:** All riscv64 CI configurations use `fips: no`. The FIPS provider is not tested for riscv64 [NEEDS VERIFICATION that FIPS provider builds correctly on riscv64].

**RV32 cross-compilation limitation:** No Ubuntu package provides an RV32 cross-compiler. Confirmed by [PR #30733](https://github.com/openssl/openssl/pull/30733) author (cmuellner, 2026-04-08): "There is no Ubuntu package for a riscv32 cross-compiler." This is a practical gap for embedded RISC-V targets.

**Cross-compilation with `no-deprecated` flag (open bug):** [Issue #29357](https://github.com/openssl/openssl/issues/29357) (opened 2025-12-09, open as of June 2026): `linux64-riscv64` cross-compilation fails when `no-deprecated` is specified. Root cause: `crypto/md5/md5_riscv.c` and `crypto/sha/sha_riscv.c` reference deprecated public type names (`MD5_CTX`, `SHA256_CTX`, `SHA512_CTX`). All other architectures are unaffected. Fix candidate [PR #30763](https://github.com/openssl/openssl/pull/30763) is open. Affects all branches: 3.4, 3.5, 3.6, 4.0, master.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Data not available: No cross-architecture `openssl speed` comparison (riscv64 vs. arm64 vs. amd64) was found in any RISE publication, OpenSSL PR, or publicly indexed benchmark report. All benchmarks in upstream PRs are within-architecture before/after comparisons on FPGA or hardware simulation platforms.

The following gap analysis is therefore based on which algorithm/extension combinations have merged optimized implementations, not on measured throughput ratios.

**Coverage gaps on riscv64 relative to what the ISA supports:**

| Algorithm | arm64 status | riscv64 status | Gap |
|---|---|---|---|
| AES-128/256 CBC/ECB/CTR/GCM | Accelerated (CE) | Accelerated (Zvkned, Zkne) | None for baseline modes |
| AES-192 GCM | Accelerated | Partial: Zvkned key schedule falls back to software | AES-192 Zvkned key schedule not implemented |
| AES-XTS | Accelerated | Merged (Zvbb+Zvkg+Zvkned) | None |
| SHA-256/512 | Accelerated (SHA CE) | Accelerated (Zvknha/b) | None |
| SHA-3/Keccak | Data not available | No merged optimization; open PR #29970 with correctness issues | Gap -- no merged SHA-3 optimization |
| ChaCha20 | Accelerated (NEON) | Vector (V+Zbb) merged; dot-asm Zbb version in open PR #30787 | Open PR only |
| Poly1305 | Accelerated | No merged optimization; open PR #31182 | Gap -- no merged Poly1305 optimization |
| SM3 | Data not available | Accelerated (Zvksh) | None |
| SM4 | Data not available | Vector (Zvksed) merged; scalar Zksed open in PR #30735 | Scalar Zksed not yet merged |
| RSA (Montgomery) | Accelerated | Merged (RV64GC) | None for RV64 |
| ECDH P-256/P-384 | Accelerated | Data not available: no riscv64-specific EC P-256/P-384 assembly found | Likely gap -- no vector or scalar EC acceleration beyond SM2 |
| ECDH SM2 | N/A | Merged (RV64I+M+Zba) | None |
| AES-CCM | Accelerated | Dispatch exists (Zvkned) | None |
| GHASH | Accelerated | Accelerated (Zvkg, Zvbc, Zbc) | None |

**AES constant-time security gap (critical):** The AES T-table fallback path (used when neither Zknd/Zkne nor Zvkned is available) is not constant-time. This affects all riscv64 hardware without Zkn or Zvkned extensions, which is the majority of deployed riscv64 silicon (SG2042, TH1520, JH7110, SpacemiT K1 all lack these extensions [NEEDS VERIFICATION per-chip extension support]). Fix PRs [#31080](https://github.com/openssl/openssl/pull/31080) and [#31082](https://github.com/openssl/openssl/pull/31082) are open as of June 2026 per the dependency analysis findings.

---

## 7. CI/CD Infrastructure

OpenSSL uses GitHub Actions only. No Jenkinsfile, .gitlab-ci.yml, or .cirrus.yml exists in the repository.

### 7.1 Baseline cross-compile (unconditional)

File: `.github/workflows/cross-compiles.yml`
Trigger: Every pull_request and push (no conditional guard).
Runner: `ubuntu-latest` (x86_64).
Configuration: `riscv64-linux-gnu` / `linux64-riscv64`, FIPS disabled, no extension-specific flags, no `qemucpu` override.
Tests: Full suite on push (excluding `test_afalg`); `test_evp*` only on pull_request. All via `qemu-user`.

### 7.2 Extension-specific matrix (conditionally triggered)

File: `.github/workflows/riscv-more-cross-compiles.yml`
Trigger: pull_request OR push, subject to a hard `if:` condition. The job runs only when:
- PR title contains `riscv` or `RISC-V`, OR
- PR body contains `[riscv ci]`, OR
- Commit message contains `[riscv ci]`, OR
- Nightly cron (`35 02 * * *`) on `openssl/openssl`, OR
- Manual `workflow_dispatch`.

On a plain push or plain PR that does not match these conditions, the job is skipped entirely.

Runner: `ubuntu-latest` (x86_64). All execution via QEMU user-mode emulation.

**13 matrix configurations:**

| # | Extensions tested | VLEN |
|---|---|---|
| 1 | Zbb, Zbc, Zbkb, Zknd, Zkne | N/A |
| 2 | Zbc, Zbb | N/A |
| 3 | Zbc only | N/A |
| 4 | V, Zbb (no Zvbb/Zvkb) | 128 |
| 5 | V, Zvkg (no Zvbb, QEMU 8.2.2 workaround) | 128 |
| 6 | V, Zvkb, Zvbc (no Zvkg, QEMU 8.2.2 workaround) | 128 |
| 7 | V, Zvkned (no Zvbb/Zvkb/Zvkg) | 128 |
| 8 | All scalar+vector extensions | 128 |
| 9 | All scalar+vector extensions | 256 |
| 10 | All scalar+vector extensions | 512 |
| 11 | Zbb, Zbkb, Zknh, Zksh (inline asm path, -march= flag) | N/A |
| 12 | Zbb, no V -- hwprobe detection (no OPENSSL_riscvcap override) | N/A |
| 13 | V, Zvkned -- hwprobe detection (no OPENSSL_riscvcap override) | 128 |

Rows 12-13 test the `riscv_hwprobe` syscall-based runtime detection path. Note: QEMU 8.2.2 does not report ZVKNED via hwprobe; this is documented as a known limitation in the workflow file.

FIPS: all 13 rows have `fips: no`. No FIPS testing for riscv64 in any workflow.

### 7.3 Main CI matrix

`.github/workflows/ci.yml` contains zero references to riscv. RISC-V is entirely absent from the main CI matrix.

### 7.4 Native hardware runners

There are no native riscv64 GitHub Actions runners in the openssl/openssl repository. All riscv64 testing uses `ubuntu-latest` (x86_64) with QEMU user-mode emulation.

[PR #27240](https://github.com/openssl/openssl/pull/27240) ("Add riscv64 runner") was closed in 2025. The workflow files confirm no riscv64 runner label is in use.

**Implication:** All riscv64 CI results are QEMU-emulated. QEMU does not model cache behavior, pipeline timing, or memory latency. Performance regressions on real hardware are not caught by CI. Certain race conditions reproducible on real multi-core hardware (e.g. issue [#22166](https://github.com/openssl/openssl/issues/22166)) cannot be reliably reproduced or caught in QEMU.

---

## 8. Distribution and Release Status

**Upstream releases:** OpenSSL upstream publishes source-only releases (tarballs + signatures). No prebuilt binary assets exist for any architecture in GitHub releases. This is consistent across all releases examined: openssl-3.0.21, openssl-3.4.6, openssl-3.5.7, openssl-3.6.3, openssl-4.0.1.

**Debian:** `openssl 3.6.3-1` is present in Debian sid (unstable) with status `Installed` on riscv64, built on buildd host `rv-manda-01`. `openssl_3.5.6-1~deb13u2_riscv64.deb` is available in Debian trixie security updates. Direct download URLs from ftp.us.debian.org, ftp.debian.org, ftp.cn.debian.org confirmed.

**Ubuntu 24.04 (Noble):** Of 65 OpenSSL-related packages searched, the core `openssl` package supports riscv64. Only two of the 65 exclude riscv64: `openssl-ibmca` (s390x only) and `openssl-pkcs11-sign-provider` (no riscv64). All other packages either explicitly list riscv64 or are architecture-independent.

**Arch Linux RISC-V:** Two packages found in the core repository: `openssl-1.1-1.1.1.w-2-riscv64.pkg.tar.zst` (legacy 1.1 branch) and `openssl-3.6.3-1-riscv64.pkg.tar.zst`. Both filenames contain `riscv64` explicitly.

**PyPI:** The `openssl` PyPI package does not exist (404). The relevant binding (`pyOpenSSL` v26.3.0) ships pure Python only (`none-any.whl`) with no compiled wheels for any architecture. Not relevant to the assessment.

**Release cadence:** OpenSSL does not ship riscv64 prebuilt binaries upstream. All deployment on riscv64 goes through Linux distribution packaging. The three active distros confirmed above (Debian, Ubuntu, Arch RISC-V) all carry current versions.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| glibc | Runtime C library; `riscv_hwprobe` syscall for ISA detection | Green | Mostly green (SIGILL in `__memset_vector` when RVV disabled via `prctl()`) | Green | `hwprobe` prototype fixed May 2025 (BZ #32932); vector register syscall clobber fixed Sep 2025 |
| Perl 5 + Text::Template | Build system only (perlasm) | Green | Green | Green | None |
| GNU assembler (binutils) | Assembles all perlasm-generated crypto .S files | Green (requires >= 2.38 for Zvk) | Green | Green | Binutils < 2.38 (Ubuntu 20.04) cannot assemble Zvk paths |
| zlib | Optional TLS compression | Green | Green | Green | None |
| brotli | Optional certificate compression | Green | Green | Green | None |
| zstd | Optional certificate compression | Mostly green | Mostly green | Green | Open: [facebook/zstd#4622](https://github.com/facebook/zstd/issues/4622) -- `huf_decompress` 4-way loop not enabled on riscv64; decompression throughput impact, not a correctness or build blocker |
| musl libc | Alternative runtime C library | Broken for ISA detection | Broken | N/A | [Issue #28118](https://github.com/openssl/openssl/issues/28118): `RISCV_HAS_ZBB()` returns false on musl; optimized paths silently skipped; no fix merged as of July 2025 |

---

## 10. Ecosystem Status

**RISE Project:** No direct involvement with OpenSSL. Confirmed by scanning all 27 RISE blog posts (May 2024 through June 2026), all 30 repos in the RISE GitHub org, and the RISE Python wheel builder index. OpenSSL does not appear in any RISE deliverable, blog post, or project repository.

The RISE runners announcement (May 12, 2026) identifies `pq-code-package` (post-quantum crypto) and `pyca cryptography` as projects using RISE CI runners -- these are crypto-adjacent, but neither is OpenSSL.

**Key contributing organizations (identified from PR authorship):**

| Organization | RISE membership | Contribution |
|---|---|---|
| ISCAS | General Member | ChaCha20 ([#30787](https://github.com/openssl/openssl/pull/30787)), Poly1305 ([#31182](https://github.com/openssl/openssl/pull/31182)), SHA3 ([#29970](https://github.com/openssl/openssl/pull/29970)) |
| Alibaba DAMO Academy + ZTE (OpenAnolis) | Premier Member (Alibaba), General Member (ZTE) | SM4-XTS ([#30633](https://github.com/openssl/openssl/pull/30633)), SM4-CBC ([#29544](https://github.com/openssl/openssl/pull/29544)) |
| vrull.eu | Not a RISE member | Original port (2022) |
| Google / Tsinghua | Google is RISE Premier Member | Vector crypto extensions, CI ([#24403](https://github.com/openssl/openssl/pull/24403)) |

**AI contribution strain (June 2026):** The OpenSSL Foundation flagged that AI-generated contributions are straining the GitHub issue backlog. This is a governance signal that review bandwidth is constrained.

---

## 11. Known Bugs and Active Issues

### Critical -- Security

**No issue number assigned in findings for AES T-table constant-time gap:** The AES T-table fallback path (used when Zkn and Zvkned are both absent) leaks key material via cache side-channels. Fix PRs [#31080](https://github.com/openssl/openssl/pull/31080) and [#31082](https://github.com/openssl/openssl/pull/31082) are open as of June 2026. This affects all riscv64 hardware without Zkn or Zvkned. Severity: critical for any riscv64 deployment handling sensitive data in environments where Zkn/Zvkned are absent.

### High -- Reliability

**[Issue #22166](https://github.com/openssl/openssl/issues/22166)** -- "SSL related tests are failing with high HARNESS_JOBS on riscv64"
Opened: September 2023. Labels: `triaged: bug`, `backlog fix`, `help wanted`.
Root cause: Race condition or resource exhaustion in TLSProxy under high parallelism. Failures appear at `HARNESS_JOBS >= 38`, hangs at >= 50. Affects SG2042, TH1520, JH7110, and QEMU. No fix merged.
Impact: Blocks reliable CI at scale on multi-core riscv64 hardware.

### Medium -- Correctness

**[Issue #28118](https://github.com/openssl/openssl/issues/28118)** -- "Riscv extension detection is broken on musl (Zbb incorrectly not detected)"
Opened: 2025-07-29. Labels: `triaged: bug`, `help wanted`.
Root cause: `__NR_riscv_hwprobe` define absent in musl environments; `RISCV_HAS_ZBB()` and related macros return false. Optimized paths (Zbb-accelerated ChaCha20, etc.) silently fall back to generic C. Workaround: set `OPENSSL_riscvcap` manually. No PR exists. Last activity: August 2025. Affects OrangePi RV2 (confirmed), likely all musl-based riscv64 deployments.

**[Issue #29357](https://github.com/openssl/openssl/issues/29357)** -- "linux64-riscv64 cross-compilation fails with no-deprecated option"
Opened: 2025-12-09. Open on all branches (3.4, 3.5, 3.6, 4.0, master).
Root cause: `crypto/md5/md5_riscv.c` and `crypto/sha/sha_riscv.c` use deprecated public types excluded by `no-deprecated`. No other architecture affected. Fix candidate [PR #30763](https://github.com/openssl/openssl/pull/30763) open but not merged.

**[Issue #26989](https://github.com/openssl/openssl/issues/26989)** -- "RISC-V rv32 zksed SM4 fails: key setup failed"
Opened: 2025-03-06. Labels: `triaged: feature`, `help wanted`.
Root cause: `rvi_zksed_set_encrypt_key` assembly never sets `a0` return value before `ret`. On RV32 with high-address pointer (e.g. `0x80000000`), `bltz` comparison on `a0` treats the pointer as a negative signed value; key setup returns false failure. SM4 is non-functional on RV32+Zksed. Fix is `li a0, 0` before `ret`, but no PR has been submitted. The affected code ([PR #18285](https://github.com/openssl/openssl/pull/18285)) is itself unmerged (draft, last updated 2026-04-09), so this is a pre-merge bug.

**[PR #30733](https://github.com/openssl/openssl/pull/30733)** -- "riscv: fix RV32 issues found during validation"
Opened: 2026-04-08 by cmuellner. Labels: `approval: review pending`, `severity: fips change`.
Three RV32 fixes: `size_t` format specifier, AES-XTS function-pointer assignment under strict builds, documentation example. Stale since April 2026; automated stale notice issued June 10, 2026 (61 days without committer action).

### Medium -- Performance (open PRs pending review)

**[PR #30501](https://github.com/openssl/openssl/pull/30501)** -- "riscv: Add lpad instructions for CFI support (Zicfilp)"
Opened: 2026-03-19. Labels: `approval: review pending`, `triaged: feature`, `severity: fips change`.
Reviewer cmuellner identified missing `lpad` on multiple global symbols (`rv64i_zvksed_sm4_cbc_encrypt`, `rv64i_zvksed_sm4_cbc_decrypt`, `riscv_vlen_asm`, functions in `riscv64-mont.pl`, `ecp_sm2p256-riscv64.pl`, and several SHA/SM3/MD5 files) and spurious `lpad` on local branch targets (20 unnecessary insertions in `aes-riscv64-zvkned.pl`). PR must be revised before merge. Stale notice issued May 24, 2026.

**[PR #29970](https://github.com/openssl/openssl/pull/29970)** -- "riscv: support sha3 perf optimization (Keccak-1600 via Zbb)"
Opened: 2026-02-10 by cxx194832. Labels: `approval: review pending`, `severity: fips change`.
Open review issues: alignment not guaranteed (may trap or be slow on real hardware), `.balign` / `.p2align` duplication, URL typo in license header, CI workflow not updated. Commit hygiene addressed (rebased May 2026). Stale notice June 9, 2026. No committer approval.

**[PR #30787](https://github.com/openssl/openssl/pull/30787)** -- "RISC-V: Port dot-asm ChaCha20 assembly implementation with rv64gc and zbb"
Opened: 2026-04-12. 2 approvals. Open as of June 2026. ~2.25x speedup vs. C baseline at large blocks on hardware (see Section 12).

**[PR #31182](https://github.com/openssl/openssl/pull/31182)** -- "RISC-V: Port dot-asm poly1305 assembly implementation"
Opened: 2026-05-14. Open as of June 2026. ~2x speedup at large blocks for RVV path.

**[PR #30633](https://github.com/openssl/openssl/pull/30633)** -- "Performance optimization of SM4-XTS encryption and decryption on RISC-V"
Opened: 2026-03-31. Security review concerns pending: VLEN > 512 buffer overread, GF multiplier overflow at VLEN=2048.

### Low -- Functional

**[PR #30735](https://github.com/openssl/openssl/pull/30735)** -- "riscv: add scalar Zksed SM4 support"
Opened: 2026-04-08. Open as of June 2026. Adds scalar Zksed path currently missing from mainline.

**[Issue #29453](https://github.com/openssl/openssl/issues/29453)** -- "RISCV: Use intrinsic function instead of inline assembly"
Opened: 2025-12-19. Feature request. No implementation.

---

## 12. Objections and Upstream Blockers

**Blocker 1 (Security, unresolved): AES T-table is not constant-time on hardware without Zkn/Zvkned.**
This is the highest-priority open issue for any riscv64 production deployment of OpenSSL. PRs [#31080](https://github.com/openssl/openssl/pull/31080) and [#31082](https://github.com/openssl/openssl/pull/31082) are open. Without a CLA-covered contributor pushing these to merge, any riscv64 deployment without hardware AES acceleration leaks AES key material through cache timing. The majority of deployed riscv64 silicon falls into this category.

**Blocker 2 (Reliability, unresolved): SSL test hangs at high parallelism.**
[Issue #22166](https://github.com/openssl/openssl/issues/22166) has been open since September 2023 with label `backlog fix`. On multi-core riscv64 hardware running the full SSL test suite with `HARNESS_JOBS >= 38`, tests hang or fail non-deterministically. This prevents any automated regression testing at scale on high-core-count riscv64 boards (e.g. SG2042 with 64 cores).

**Blocker 3 (Correctness, low severity): musl extension detection broken.**
[Issue #28118](https://github.com/openssl/openssl/issues/28118) has been open since July 2025. Any riscv64 deployment on Alpine Linux or other musl-based distributions will run at generic C performance with all hardware acceleration silently disabled. No PR exists.

**Blocker 4 (CI, structural): No native riscv64 CI runners.**
All RISC-V CI uses QEMU. Performance regressions, hardware-specific race conditions, and VLEN detection on real silicon are not caught. This is a structural gap compared to arm64 (which has native runners).

**Blocker 5 (Build, medium): no-deprecated cross-compile failure affects all branches.**
[Issue #29357](https://github.com/openssl/openssl/issues/29357) blocks `no-deprecated` builds on all supported branches. Fix PR exists ([#30763](https://github.com/openssl/openssl/pull/30763)) but is not merged.

**Objection: No FIPS testing.**
All riscv64 CI configurations set `fips: no`. Any customer requiring FIPS-validated OpenSSL on riscv64 has no CI coverage and no documented status.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

Three functional gaps exist that block deployment or correctness on riscv64:

1. AES constant-time fallback (security critical, fix PRs open).
2. musl extension detection (silently broken, no PR).
3. `no-deprecated` cross-compile failure (affects all branches, fix PR open but unreviewed).

The SM4 scalar Zksed path ([PR #30735](https://github.com/openssl/openssl/pull/30735)) is a functional gap on scalar-only hardware.

SHA-3 has no merged optimized implementation despite two closed failed attempts and one open PR with correctness issues.

### 13.2 Performance Optimization

Measured benchmark results from upstream PRs (all on RISC-V hardware or FPGA, not cross-architecture comparisons):

| Algorithm | Improvement | Platform | Source |
|---|---|---|---|
| SHA-512 (RVV) | ~5.1x | Xuantie C930 FPGA, VLEN256 | [PR #29263](https://github.com/openssl/openssl/pull/29263) |
| SM3 (Zvksh) | ~2.68x | C930 FPGA | [PR #29264](https://github.com/openssl/openssl/pull/29264) |
| SM4-XTS encrypt (Zvbb+Zvkg+Zvksed, 8KB) | ~4.2x | HW simulation | [PR #30633](https://github.com/openssl/openssl/pull/30633) |
| ChaCha20 (rv64gc+Zbb, 8KB) | ~2.25x vs. C baseline | Unspecified HW | [PR #30787](https://github.com/openssl/openssl/pull/30787) |
| Poly1305 (RVV, 8KB) | ~2x vs. C | Unspecified HW | [PR #31182](https://github.com/openssl/openssl/pull/31182) |
| RSA-2048 sign | +5.77% | RISC-V (RV64GC) | [PR #29440](https://github.com/openssl/openssl/pull/29440) |
| RSA-2048 verify | +10.66% | RISC-V (RV64GC) | [PR #29440](https://github.com/openssl/openssl/pull/29440) |
| SHA3-256 (Zbb, 8KB) | +15% | C950 FPGA 1GHz | [PR #29970](https://github.com/openssl/openssl/pull/29970) |

Five performance PRs are open and awaiting merge: ChaCha20 Zbb ([#30787](https://github.com/openssl/openssl/pull/30787)), Poly1305 RVV ([#31182](https://github.com/openssl/openssl/pull/31182)), SM4-XTS ([#30633](https://github.com/openssl/openssl/pull/30633)), SHA3 Zbb ([#29970](https://github.com/openssl/openssl/pull/29970)), AES-128-XTS small-packet ([#30552](https://github.com/openssl/openssl/pull/30552)). The SM4-XTS PR has security review concerns; the SHA3 PR has an alignment correctness issue; the others have approvals but no committer merge action.

P-256/P-384 ECDH has no riscv64-specific optimization. ECDH is a dominant workload in TLS handshakes; this is a material performance gap vs. aarch64.

### 13.3 CI/CD Infrastructure

The structural absence of native riscv64 runners is the highest-leverage CI investment. All current CI is QEMU-based and catches compilation errors and functional regressions but not performance regressions or hardware-specific race conditions. Adding native riscv64 GitHub Actions runners (e.g. via RISE runner infrastructure) would close this gap. This requires either upstream negotiation with the OpenSSL project or contributing a self-hosted runner configuration.

A secondary investment is extending the FIPS test matrix to riscv64. Currently zero FIPS CI coverage exists for any riscv64 configuration.

### 13.4 Ecosystem Enablement

The musl detection bug ([Issue #28118](https://github.com/openssl/openssl/issues/28118)) is an unowned fix that affects Alpine Linux and other musl-based riscv64 deployments. The fix is small (define `__NR_riscv_hwprobe` ourselves if absent, or add `AT_HWCAP` fallback) but requires a CLA-covered contributor.

The `no-deprecated` cross-compile bug ([Issue #29357](https://github.com/openssl/openssl/issues/29357)) has a fix PR open but no committer has merged it. Nudging this through review would unblock all affected branches.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix AES T-table constant-time gap (PRs [#31080](https://github.com/openssl/openssl/pull/31080), [#31082](https://github.com/openssl/openssl/pull/31082)) | 2-4 (review + fix + test) | Open (CLA required) | Critical |
| Functional | Fix musl extension detection ([Issue #28118](https://github.com/openssl/openssl/issues/28118)) | 1-2 | Open (unowned) | High |
| Functional | Fix `no-deprecated` cross-compile ([Issue #29357](https://github.com/openssl/openssl/issues/29357), [PR #30763](https://github.com/openssl/openssl/pull/30763)) | 0.5 (review push) | Open (fix exists) | High |
| Functional | SHA-3 Keccak-1600 Zbb optimization ([PR #29970](https://github.com/openssl/openssl/pull/29970), fix alignment + rebase) | 1-2 | cxx194832 / ISCAS | Medium |
| Functional | SM4 scalar Zksed ([PR #30735](https://github.com/openssl/openssl/pull/30735)) | 1 (review) | cmuellner / openssl committer | Medium |
| Functional | CFI lpad for all global asm symbols ([PR #30501](https://github.com/openssl/openssl/pull/30501), address cmuellner review) | 2-3 | phoebesv / committer | Medium |
| Functional | RV32 portability fixes ([PR #30733](https://github.com/openssl/openssl/pull/30733)) | 0.5 (committer merge) | openssl committer | Low |
| Performance | ChaCha20 Zbb ([PR #30787](https://github.com/openssl/openssl/pull/30787), 2 approvals) | 0.5 (committer merge) | openssl committer | High |
| Performance | Poly1305 RVV ([PR #31182](https://github.com/openssl/openssl/pull/31182)) | 1-2 (review + merge) | HeliC829 / committer | High |
| Performance | SM4-XTS ([PR #30633](https://github.com/openssl/openssl/pull/30633), fix security issues) | 2-3 (fix buffer overread + review) | zl523856 / committer | Medium |
| Performance | AES-128-XTS small-packet ([PR #30552](https://github.com/openssl/openssl/pull/30552), 4 approvals) | 0.5 (committer merge) | openssl committer | Medium |
| Performance | P-256/P-384 ECDH riscv64 scalar or vector optimization | 8-16 (new implementation) | No current owner | Medium |
| CI/CD | Native riscv64 GitHub Actions runner | 4-8 (infrastructure setup, upstream negotiation) | RISE or Qualcomm | High |
| CI/CD | FIPS provider testing on riscv64 | 2-4 | OpenSSL committer | Medium |
| CI/CD | Fix SSL test parallelism hang ([Issue #22166](https://github.com/openssl/openssl/issues/22166)) | 4-8 (root cause diagnosis on real hardware) | Open (labeled backlog) | High |
| Ecosystem | Publish riscv64 vs. arm64 vs. amd64 benchmark comparison | 2-4 (test infrastructure + reporting) | No current owner | Medium |

---

## 14. Updates

(No updates yet -- initial report dated 2026-06-17.)

---

## 15. References

- [OpenSSL GitHub repository](https://github.com/openssl/openssl)
- [OpenSSL Foundation](https://openssl.foundation)
- [OpenSSL Library project](https://www.openssl.org/)
- [OpenSSL releases](https://github.com/openssl/openssl/releases)
- [riscv-more-cross-compiles.yml](https://github.com/openssl/openssl/blob/master/.github/workflows/riscv-more-cross-compiles.yml)
- [cross-compiles.yml](https://github.com/openssl/openssl/blob/master/.github/workflows/cross-compiles.yml)
- [include/arch/riscv_arch.def](https://github.com/openssl/openssl/blob/master/include/arch/riscv_arch.def)
- [include/arch/riscv_arch.h](https://github.com/openssl/openssl/blob/master/include/arch/riscv_arch.h)
- [crypto/riscvcap.c](https://github.com/openssl/openssl/blob/master/crypto/riscvcap.c)
- [Configurations/10-main.conf](https://github.com/openssl/openssl/blob/master/Configurations/10-main.conf)
- [PR #17640 - Initial RISC-V port](https://github.com/openssl/openssl/pull/17640)
- [PR #21923 - Full Zvk vector crypto suite](https://github.com/openssl/openssl/pull/21923)
- [PR #24172 - hwprobe syscall capability detection](https://github.com/openssl/openssl/pull/24172)
- [PR #29263 - SHA512 RVV](https://github.com/openssl/openssl/pull/29263)
- [PR #29264 - SM3 vector crypto](https://github.com/openssl/openssl/pull/29264)
- [PR #29440 - Montgomery squaring RV64GC](https://github.com/openssl/openssl/pull/29440)
- [PR #29544 - SM4-CBC instruction reordering](https://github.com/openssl/openssl/pull/29544)
- [PR #29970 - SHA3 Keccak-1600 Zbb](https://github.com/openssl/openssl/pull/29970)
- [PR #30501 - CFI lpad Zicfilp](https://github.com/openssl/openssl/pull/30501)
- [PR #30633 - SM4-XTS RVV](https://github.com/openssl/openssl/pull/30633)
- [PR #30713 - hwprobe CI coverage fix](https://github.com/openssl/openssl/pull/30713)
- [PR #30714 - AES-GCM VLEN guard fix](https://github.com/openssl/openssl/pull/30714)
- [PR #30733 - RV32 portability fixes](https://github.com/openssl/openssl/pull/30733)
- [PR #30735 - Scalar Zksed SM4](https://github.com/openssl/openssl/pull/30735)
- [PR #30787 - ChaCha20 rv64gc+Zbb](https://github.com/openssl/openssl/pull/30787)
- [PR #31182 - Poly1305 RVV](https://github.com/openssl/openssl/pull/31182)
- [Issue #22166 - SSL tests hang at high HARNESS_JOBS](https://github.com/openssl/openssl/issues/22166)
- [Issue #26989 - RV32 SM4 key setup failure](https://github.com/openssl/openssl/issues/26989)
- [Issue #28118 - musl Zbb detection broken](https://github.com/openssl/openssl/issues/28118)
- [Issue #29357 - no-deprecated cross-compile failure](https://github.com/openssl/openssl/issues/29357)
- [Debian buildd riscv64 status](https://buildd.debian.org/status/package.php?p=openssl&suite=sid)
- [Ubuntu 24.04 openssl package](https://packages.ubuntu.com/noble/openssl)
- [Arch Linux RISC-V core repository](https://archriscv.felixc.at/repo/core/)
- [RISE Project](https://riseproject.dev)