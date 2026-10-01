---
title: OpenSSL
parent: Project Reports
color: blue
dependencies:
  - name: Perl
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: musl
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: brotli
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="openssl" %}

# OpenSSL

**Author:** Ludovic HENRY <mail@ludovic.dev><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenSSL<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[OpenSSL](https://www.openssl.org/) is the dominant open source TLS/cryptographic library and underpins the majority of Linux userspace TLS stacks, package managers, and language runtimes. Any RISC-V platform targeting production workloads requires a functional, performant OpenSSL.

**Repository:** [openssl/openssl](https://github.com/openssl/openssl)
**License:** Apache License 2.0 (since OpenSSL 3.0)
**Build system:** Perl-driven `./Configure`/`./config`, not CMake, setuptools, Cargo, Go modules, or npm. There is no `CMakeLists.txt` anywhere in the tree.

**Governance:** No single "OpenSSL Foundation" the way Linux or Apache have one foundation. Governance is split across two co-equal legal entities per openssl-library.org and the project's `funding.json`: the **OpenSSL Software Foundation** (est. 2014, non-commercial/community focus, funded by donations and grants) and the **OpenSSL Corporation** (OpenSSL Software Services Inc, commercial support/enterprise focus), sharing one mission statement and funding the same engineering team. There is no `MAINTAINERS`/`OWNERS` file in the repository; `.github/CODEOWNERS` only scopes `/.github/workflows/` to a single CI owner. Day-to-day code decisions are governed by roughly 27-34 elected **Committers** (2+ approvals required to merge), with a **Foundation Advisory Committee** elected annually (most recent election September 2026) above that. Prior reporting cycles identified a Board of Directors (Matt Caswell, Richard Levitte, Tomas Mraz) [NEEDS VERIFICATION, not re-confirmed against a second source this cycle].

**Technical policies** (openssl-library.org/policies/technical/) cover Branch Policy, Design Process, Coding Style, Documentation Policy, a dedicated "Policy for Accepting Assembler Optimisations," API compatibility in minor releases, Release Requirements, Stable Release Updates, and Testing. No published platform/architecture "tier" document (no `PLATFORMS.md`, no `docs/platforms/`) was found.

**Corporate sponsors:** Sponsorship tiers are Premier ($100k+/yr), Platinum ($50k+), Gold ($25k+), Silver ($10k+), Bronze ($5k+), Copper (<$5k), plus individual "Code Protector" donors. **Cisco** is listed as a Premier Sponsor; **Nominet** and **Sovereign Tech Fund** are also listed supporters. Commit-email domains show active corporate contributors beyond the Foundation payroll, e.g. Timo Keller (`@linux.ibm.com`, IBM) and Mounir Idrassi (`@idrix.fr`, Idrix); core reviewers such as Tomas Mraz, Paul "Pauli" Dale, Richard Levitte, Bob Beck, Jakub Zelenka, and Ryan Hooper commit from `@openssl.org`/`@openssl.foundation` addresses, i.e. they are paid directly by the Foundation/Corporation rather than a third-party vendor.

**Community stance on new ports:** `CONTRIBUTING.md` is explicit that review bandwidth, not code quality, is the project's bottleneck: contributors are asked to keep to 3-4 open PRs at a time, avoid bundling unrelated changes, and open a discussion issue first for large contributions. New-architecture work, including RISC-V, goes through the same 2-approver Committer review and CLA process as everything else, with no formal or expedited new-platform onboarding track. The clearest evidence of this is the three-month governance delay (described in Section 2) the very first riscv64 patch encountered purely because it targeted a bugfix-only stable branch, not because of any technical objection.

---

## 2. Port History and Upstreaming Timeline

**Origin of the port:** The first RISC-V commit, "Add riscv64 target," was authored **2021-03-29** by **luyahan** (`yahan@iscas.ac.cn`, Institute of Software, Chinese Academy of Sciences -- ISCAS) and merged to `master` **2021-04-01** via [PR #14723](https://github.com/openssl/openssl/pull/14723), reviewed by Richard Levitte, Paul Dale, and Tomas Mraz. This was a bare `linux64-riscv64` Configure-target addition with no assembly or algorithm code.

A companion backport, [PR #14724 "Add riscv64 target for OpenSSL_1_1_1"](https://github.com/openssl/openssl/pull/14724) (same author), illustrates the project's governance process rather than any technical resistance to RISC-V: reviewer t8m flagged that the 1.1.1 branch is bug-fix-only and the change needed an OTC/OMC (Technical/Management Committee) exception; paulidale cited precedent ([PR #12369](https://github.com/openssl/openssl/pull/12369)) for allowing similar config-only additions; the change sat on "hold: need omc decision" from late March to late June 2026; paulidale confirmed "the vote has passed, this can be merged to 1.1.1" on 2026-06-27; and it merged 2026-06-29 after the mandatory 24-hour grace period. No technical objection was raised at any point -- the entire three-month delay was process, not correctness.

| Date | Event | Source |
|---|---|---|
| 2021-03-29 / 2021-04-01 | `linux64-riscv64` Configure target added (config-only, no asm) | [PR #14723](https://github.com/openssl/openssl/pull/14723) |
| 2021-04-25 | `config` script auto-detection for `linux64-riscv64` | Andreas Schwab, SUSE (commit search) |
| 2021-06-29 | Backported to OpenSSL_1_1_1-stable after OMC vote | [PR #14724](https://github.com/openssl/openssl/pull/14724) |
| 2021-12-18 | `BSD-riscv64` / `BSD-riscv32` targets added | Piotr Kubaj, FreeBSD project |
| 2022-01-28 onward / merged 2022-05-19 | riscv64 asm architecture hookup and four-table generic RV64I AES assembly, reviewed by Philipp Tomsich (vrull.eu) | [PR #17640](https://github.com/openssl/openssl/pull/17640) |
| 2022-04-30 | Scalar crypto extension capability detection | Hongren "Zenithal" Zheng |
| 2022-06-10 | AES RISC-V64 Zkn asm | [PR #18197](https://github.com/openssl/openssl/pull/18197) |
| 2022-06-22 | SM3 Zksh inline asm | [PR #18287](https://github.com/openssl/openssl/pull/18287) |
| 2022-07-19 | Zbkb/Zbb bswap handling | marcfedorow, CloudBear |
| 2023-01-17/18 | Capability-macro cleanup, GCM/clmul simplification | Christoph Mullner (cmuellner), vrull.eu |
| 2023-03-16 | GCM `.ghash()` implementation | [PR #20078](https://github.com/openssl/openssl/pull/20078) |
| 2023-10-26 | Full Zvk vector-crypto suite (Zvkned/Zvkg/Zvksh/Zvksed/Zvknha/Zvknhb/Zvbc/Zvbb) | [PR #21923](https://github.com/openssl/openssl/pull/21923), first shipped in 3.3.0 |
| 2023-12-12 | riscv64/riscv32 detection fix, backported to 3.2 | [PR #22881](https://github.com/openssl/openssl/pull/22881), shipped 3.2.1 |
| 2024-05-08 / 2024-05-09 | ChaCha20 vector-only implementation; hwprobe syscall capability detection | [PR #24069](https://github.com/openssl/openssl/pull/24069), [PR #24172](https://github.com/openssl/openssl/pull/24172) |
| 2024-10-28 | musl riscv64 build fix, backported to 3.4 | [PR #25787](https://github.com/openssl/openssl/pull/25787), shipped 3.4.1 |
| 2025-09-08 | SM2 implementation in generic riscv64 asm | [PR #25918](https://github.com/openssl/openssl/pull/25918) |
| 2025-03-28 | SHA-256 and SHA-512 optimized via Zbb | merged to master (est. first shipped 3.6.0) |
| 2025-05-06 | Generic optimized SHA-256 for rv64gc | [PR #27381](https://github.com/openssl/openssl/pull/27381) |
| 2025-07-07 | SM3 optimized via Zbb | [PR #27709](https://github.com/openssl/openssl/pull/27709) |
| 2025-08-13 | MD5 assembly, rv64gc and Zbb | [PR #27990](https://github.com/openssl/openssl/pull/27990) |
| 2025-10-01 | ChaCha20 unaligned-data crash fix, backported to 3.4/3.5/3.6 | [PR #28684](https://github.com/openssl/openssl/pull/28684), [PR #28733](https://github.com/openssl/openssl/pull/28733) |
| 2025-10-06 | SM2 carry bug in modulo reduction fixed | [PR #28746](https://github.com/openssl/openssl/pull/28746) |
| 2025-12-23 / 2025-12-31 | SHA-512 and SM3 performance optimized with RISC-V Vector Crypto (RVV) | [PR #29263](https://github.com/openssl/openssl/pull/29263), [PR #29264](https://github.com/openssl/openssl/pull/29264) |
| 2026-07-20 | SM2 RISC-V64 crash fix (functions emitted into `.rodata`), backported to 4.0 | [PR #31874](https://github.com/openssl/openssl/pull/31874), shipped 4.0.2 |
| 2026-09-07 | EC `ecp_nistz256` RISC-V64 assembly closed unmerged after review concerns, despite measured 1.78x-6.9x gains | [PR #31873](https://github.com/openssl/openssl/pull/31873) |

**Primary contributors and affiliations identified across both commit history and PR authorship:** luyahan (ISCAS, origin of the Configure target), Henry Brausen and Philipp Tomsich (vrull.eu, original AES assembly and ongoing scalar/vector crypto extension work), Christoph Mullner / cmuellner (vrull.eu, capability detection, CI, RV32 fixes, CFI review), Hongren "Zenithal" Zheng (ZenithalHourlyRate, scalar capability detection, AES Zkn, public benchmark gist), marcfedorow (CloudBear), Andreas Schwab (SUSE), Piotr Kubaj (FreeBSD project), Matt Caswell (musl build fix), mattcaswell, cxx194832 and ISCAS-affiliated contributors (SHA-3, ChaCha20, Poly1305 dot-asm ports), and zl523856 / OpenAnolis-Alibaba-ZTE (SM4-XTS, SM4-CBC).

**Is it fully upstream?** Yes -- all shipping riscv64 code lives in `openssl/openssl` master and is backported through the normal stable-branch process; there is no out-of-tree or vendor-only fork required for core functionality. No single master/meta tracking issue exists for the riscv64 port overall; work is coordinated through roughly 80 individual algorithm/extension PRs and ad hoc bug issues rather than a pinned tracking issue or GitHub Project board. The three strongest tracking-issue candidates were checked and ruled out: [#20091 "Expand our RISC-V testing"](https://github.com/openssl/openssl/issues/20091) (a CI-coverage request, closed 2026-03-25), [#11073 "RISC-V arch support?"](https://github.com/openssl/openssl/issues/11073) (a 2020 support question, closed within days), and [Discussion #23336](https://github.com/openssl/openssl/discussions/23336) (a user build-support thread).

---

## 3. Upstream Support Tier

OpenSSL does not publish a formal platform support tier document. The practical evidence treats riscv64 as a first-class, actively maintained target:

- Bug fixes are routinely backported across all active stable branches (3.4, 3.5, 3.6, 4.0, master) -- see [PR #25787](https://github.com/openssl/openssl/pull/25787), [PR #28684](https://github.com/openssl/openssl/pull/28684)/[#28733](https://github.com/openssl/openssl/pull/28733), and [PR #31874](https://github.com/openssl/openssl/pull/31874).
- A dedicated named CI workflow (`riscv-more-cross-compiles.yml`) exercises 13 ISA-extension-specific configurations under QEMU, and a nightly job (`os-zoo.yml`) runs on a real, non-emulated riscv64 self-hosted runner (see Section 7).
- riscv64 assembly sources are included in the FIPS module source/checksum manifest (`providers/fips.module.sources`, `providers/fips-sources.checksums`), i.e. RISC-V code is FIPS-module-boundary-eligible even though no CI leg currently runs FIPS self-tests end to end on riscv64 (Section 7, Section 13).
- The project accepts RISC-V contributions under the standard committer review process -- no expedited path, but also no special barrier.

**Comparison with amd64/arm64:** Both amd64 and arm64 have native, non-emulated GitHub-hosted runners in OpenSSL's main CI matrix (`ci.yml`) running on every commit with FIPS coverage. riscv64 has no presence at all in `ci.yml`; its coverage comes entirely from the two QEMU-based workflows plus the nightly native-hardware `os-zoo.yml` job, which only fires on cron or manual dispatch, never on push or pull_request. This is a structural gap: amd64/arm64 get continuous native-hardware signal on every change, riscv64 gets continuous QEMU signal on every change plus nightly native-hardware signal, not change-gated native signal.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

OpenSSL has no `arch/riscv/` directory and no JIT (OpenSSL has no JIT anywhere in the project). RISC-V support follows OpenSSL's existing per-algorithm pattern: `crypto/<alg>/asm/*-riscv64*.pl` Perl "perlasm" generators that emit `.S`/`.s` GNU assembler files at build time, small C dispatch shims named `*_riscv.c`, and a shared capability-detection layer. All RISC-V code is hand-written assembly (scalar and RVV vector-crypto), not C intrinsics -- a code search for `vfloat32m1_t` (an RVV-intrinsic type) returned zero hits in the repository.

### 4.1 Capability detection infrastructure

| Path | Lines | Purpose |
|---|---|---|
| `crypto/riscvcap.c` | 157 | Runtime feature detection: Linux `riscv_hwprobe` syscall + `OPENSSL_riscvcap` env-var override, `OPENSSL_cpuid_setup()` constructor, `riscv_vlen()` (reads VLEN via the `vlenb` CSR) |
| `include/arch/riscv_arch.h` | 130 | X-macro machinery generating `RISCV_HAS_<EXT>()` predicates and combination macros (e.g. `RISCV_HAS_ZBB_AND_ZBC()`) |
| `include/arch/riscv_arch.def` | 61 | X-macro table of 24 tracked ISA extensions mapped to hwprobe key/bit |
| `crypto/riscv64cpuid.pl` / `crypto/riscv32cpuid.pl` | 106 each | Perlasm: `CRYPTO_memcmp` (constant-time), `OPENSSL_cleanse`, `riscv_vlen_asm` |
| `crypto/perlasm/riscv.pm` | 1132 | Shared perlasm helper emitting all scalar/vector instruction encodings used by the generators below |

Tracked extensions: Zba, Zbb, Zbc, Zbs (bitmanip); Zbkb, Zbkc, Zbkx, Zknd, Zkne, Zknh, Zksed, Zksh, Zkr, Zkt (scalar crypto); V, Zvbb, Zvbc, Zvkb, Zvkg, Zvkned, Zvknha, Zvknhb, Zvksed, Zvksh (vector/vector-crypto). ZBKC, ZBKX, ZKR, ZKT are tracked in `riscv_arch.def` but have no dedicated assembly implementation. Detection priority: `OPENSSL_riscvcap` env override, then the Linux `riscv_hwprobe` syscall (kernel >= 6.5 for ZBA/ZBB/ZBS, >= 6.8 for ZBC/ZBKB/ZBKC/ZBKX/ZKND/ZKNE/ZKNH and related, per `doc/man3/OPENSSL_riscvcap.pod`), falling back to `getauxval(AT_HWCAP)`.

### 4.2 Cryptographic primitives implemented

| Algorithm | File(s) | ISA requirements | Status |
|---|---|---|---|
| AES (scalar baseline) | `aes-riscv64.pl` | RV64I only | Complete |
| AES (scalar crypto ext) | `aes-riscv64-zkn.pl`, `aes-riscv32-zkn.pl` | Zknd/Zkne (+ Zbkb on RV32) | Complete |
| AES (vector, ECB/CBC/CTR) | `aes-riscv64-zvkned.pl`, `aes-riscv64-zvkb-zvkned.pl` | V + Zvkned (+ Zvkb) | Complete |
| AES-XTS (vector) | `aes-riscv64-zvbb-zvkg-zvkned.pl` | V + Zvbb + Zvkg + Zvkned | Complete |
| Montgomery mul/sqr (RSA/DH) | `riscv64-mont.pl` (1879 lines) | RV64I + M | Complete |
| SM2 P-256 field arithmetic | `ecp_sm2p256-riscv64.pl` | RV64I + M + Zba | Complete |
| GHASH/GCM | `ghash-riscv64.pl`, `ghash-riscv64-zvkg.pl`, `ghash-riscv64-zvkb-zvbc.pl`, fused `aes-gcm-riscv64-zvkb-zvkg-zvkned.pl` | Zbc (scalar) or Zvkg/Zvbc (vector) | Complete |
| SHA-256/SHA-512 (scalar) | `sha256-riscv64-zbb.pl`, `sha512-riscv64-zbb.pl` | RV64I + Zbb | Complete |
| SHA-256/SHA-512 (vector) | `sha256-riscv64-zvkb-zvknha_or_zvknhb.pl`, `sha512-riscv64-zvkb-zvknhb.pl` | V + Zvkb + Zvknha/Zvknhb | Complete |
| SM3 | `sm3-riscv64-zbb.pl` (scalar), `sm3-riscv64-zvksh.pl` (vector) | Zbb / V+Zvkb+Zvksh | Complete |
| SM4 | `sm4-riscv64-zvksed.pl` (vector) | V + Zvkb + Zvksed | Complete (vector); scalar Zksed path still open, [PR #30735](https://github.com/openssl/openssl/pull/30735) |
| MD5 | `md5-riscv64-zbb.pl` | RV64I + Zbb | Complete |
| ChaCha20 | `chacha-riscv64-v-zbb.pl` | V + Zbb (+ optional Zvkb) | Complete (dot-asm port still open, [PR #30787](https://github.com/openssl/openssl/pull/30787)) |
| SHA-3/Keccak | none merged | targeted: Zbb | No merged implementation; see gap analysis |
| Poly1305 | none merged (dot-asm RVV port open) | targeted: RVV | No merged implementation; see gap analysis |
| EC P-256 (`ecp_nistz256`) | none merged | targeted: RV64I | Attempted and closed unmerged, [PR #31873](https://github.com/openssl/openssl/pull/31873) |
| Curve448 | none merged (two open PRs) | targeted: RVV | [PR #32847](https://github.com/openssl/openssl/pull/32847), [PR #32835](https://github.com/openssl/openssl/pull/32835), both open |

C dispatch shims (pick the asm variant at runtime based on detected capabilities) exist for SHA (`crypto/sha/sha_riscv.c`), SM3, MD5, ChaCha20, and the AES/SM4 cipher providers (`providers/implementations/ciphers/cipher_aes_hw_rv64i.c`, `cipher_aes_hw_rv32i.c`, and the SM4 `.inc` variants for GCM/CCM/XTS). None of the implemented paths are stubs; every file above implements a working primitive.

### 4.3 Comparison with amd64/arm64

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AES | AES-NI | Crypto Extension (CE) | Zkn (scalar) / Zvkned (vector); AES-192 Zvkned key schedule falls back to software [NEEDS VERIFICATION] |
| SHA-256/512 | SHA extensions / AVX2 | SHA CE | Zbb (scalar) / Zvknha-Zvknhb (vector) |
| GHASH/GCM | PCLMULQDQ | PMULL | Zbc / Zvkg / Zvbc |
| ChaCha20/Poly1305 | AVX2/AVX-512 | NEON | ChaCha20: V+Zbb (merged); Poly1305: no merged optimization |
| SHA-3 | AVX2/AVX-512 | Data not available | No merged optimization; two closed-unmerged attempts, one active successor PR |
| RSA/DH (Montgomery) | AVX2/ADX | NEON | RV64GC-only, merged |
| EC P-256/P-384 | AVX2/ADX dedicated asm | NEON dedicated asm | No merged riscv64-specific asm; one serious attempt closed unmerged |

---

## 5. Build System, Cross-Compilation, and Toolchain

OpenSSL uses a Perl-based `./Configure`/`./config` build system. There is no CMakeLists.txt, no `cmake/riscv64.cmake` toolchain file, and no riscv64 Dockerfile anywhere in the repository (confirmed by exhaustive search of `.ci/docker/`, `docker/`, and a content search for `riscv64 filename:Dockerfile`). CI runs directly on GitHub-hosted `ubuntu-latest` runners with cross-toolchain `apt` packages, not containers.

**Configure targets** (`Configurations/10-main.conf`):
```
linux64-riscv64: inherits linux-generic64, perlasm_scheme=linux64, asm_arch=riscv64
linux32-riscv32: inherits linux-latomic,    perlasm_scheme=linux32, asm_arch=riscv32
BSD-riscv64:     inherits BSD-generic64,    perlasm_scheme=linux64, asm_arch=riscv64
BSD-riscv32:     inherits BSD-generic32,    perlasm_scheme=linux32, asm_arch=riscv32
```
`android-riscv64` is also defined (`Configurations/15-android.conf`). `util/perl/OpenSSL/config.pm` autodetects `riscv64-*-linux*` and maps it to `linux64-riscv64`.

**Native build on a riscv64 host:**
```
./config
make -j$(nproc)
make test
```

**OpenSSL's own native CI job** (`os-zoo.yml`, `linux-riscv64`, on a real self-hosted riscv64 runner):
```
./config enable-fips enable-ec_nistp_64_gcc_128 enable-md2 enable-rc5 enable-trace
make -j8
OPENSSL_riscvcap=RV64GC_ZBA_ZBB_ZBC_ZBS_ZKT_V make test HARNESS_JOBS=4 LHASH_WORKERS=16
```

**Cross-compilation from x86_64** (`cross-compiles.yml` pattern):
```
apt-get install gcc-riscv64-linux-gnu libc6-dev-riscv64-cross
./config --banner=Configured --strict-warnings --cross-compile-prefix=riscv64-linux-gnu- linux64-riscv64
make -j4
QEMU_CPU="rv64,v=true,vext_spec=v1.0" QEMU_LD_PREFIX=/usr/riscv64-linux-gnu make test
```
The `vext_spec=v1.0` pin exists specifically to silence a QEMU "vector version is not specified" stderr warning that otherwise breaks tests parsing stderr output.

**Disabling assembly:**
```
./Configure linux64-riscv64 no-asm --cross-compile-prefix=riscv64-linux-gnu-
```
There is no `-DUSE_X=OFF`-style CMake flag convention since OpenSSL is not CMake-based; the closest equivalents are `no-asm`, `no-shared`, `enable-fips`/no fips flag, and feature toggles such as `enable-ec_nistp_64_gcc_128`, `enable-md2`, `enable-rc5`, `enable-trace`, `enable-lms`. Runtime (not build-time) capability gating is via the `OPENSSL_riscvcap` environment variable.

**Toolchain/version requirements:** No explicit minimum GCC/Clang/binutils version is pinned in-repo for riscv64 (no `NOTES-RISCV.md`, no version-gate comments found in `crypto/perlasm/riscv.pm`, `crypto/riscv64cpuid.pl`, or `include/arch/riscv_arch.def`). CI simply installs Ubuntu's `gcc-riscv64-linux-gnu`/`libc6-dev-riscv64-cross` packages at whatever version ships with `ubuntu-latest`. The practical constraint is that the assembler must accept the ISA extension mnemonics used (`_zvkned`, `_zvbb`, `_zvksh`, `_zksed`, etc.) -- a binutils/GCC-integrated-assembler capability rather than a documented minimum.

**QEMU-specific caveat (load-bearing for CI):** Ubuntu 24.04's QEMU 8.2.2 (the version `ubuntu-latest` ships) does not correctly report `ZVKB`/most `Zvk*` vector-crypto extensions via `-cpu` flags or hwprobe; workflow comments explicitly document this workaround ("do not use zvkb flag for qemucpu as ubuntu-latest (24.04) uses QEMU 8.2.2 ... Should be zvkg=true, zvbb=false, zvkb=false") with a TODO to tighten detection "once CI moves to a newer QEMU."

**RV32 cross-compilation limitation:** No Ubuntu package provides an RV32 cross-compiler, per [PR #30733](https://github.com/openssl/openssl/pull/30733) author cmuellner (2026-04-08): "There is no Ubuntu package for a riscv32 cross-compiler." This is a practical gap for embedded RISC-V targets.

**Known build failure:** [Issue #29357](https://github.com/openssl/openssl/issues/29357), open 2025-12-09 through at least 2026-07-23: `linux64-riscv64` cross-compilation fails when `no-deprecated` is specified, because `crypto/md5/md5_riscv.c` and `crypto/sha/sha_riscv.c` reference deprecated public type names (`MD5_CTX`, `SHA256_CTX`, `SHA512_CTX`). Affects all active branches. Fix candidate [PR #30763](https://github.com/openssl/openssl/pull/30763) is open as of the latest check.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Data not available: no cross-architecture `openssl speed` comparison (riscv64 vs. arm64 vs. amd64) was found in any RISE publication, OpenSSL PR, or OpenBenchmarking.org dataset; OpenBenchmarking's public OpenSSL dataset (2,560 results, latest run Oct 2025) covers x86_64 and aarch64 only, with no riscv64 entries. All available riscv64 benchmark data (Section 14) is within-architecture, before/after (baseline-C vs. optimized-assembly) comparison on a single SoC, not head-to-head against arm64/amd64 hardware.

**Functional gaps:**

| Algorithm | arm64 status | riscv64 status | Gap |
|---|---|---|---|
| AES-128/256 CBC/ECB/CTR/GCM | Accelerated (CE) | Accelerated (Zvkned, Zkne) | None for baseline modes |
| AES-192 | Accelerated | Zvkned key schedule reportedly falls back to software [NEEDS VERIFICATION] | Possible partial gap |
| AES-XTS | Accelerated | Merged (Zvbb+Zvkg+Zvkned) | None |
| SHA-256/512 | Accelerated (SHA CE) | Accelerated (Zvknha/b, Zbb) | None |
| SHA-3/Keccak | Data not available | No merged optimization; original [PR #29970](https://github.com/openssl/openssl/pull/29970) carries an unresolved alignment concern and was closed/reopened, successor pair [PR #32607](https://github.com/openssl/openssl/pull/32607)/[#32606](https://github.com/openssl/openssl/pull/32606) open/closed as of Aug 2026 | Gap -- no merged SHA-3 optimization |
| ChaCha20 | Accelerated (NEON) | Vector (V+Zbb) merged; dot-asm Zbb port open, [PR #30787](https://github.com/openssl/openssl/pull/30787), 2 approvals pending merge | Minor -- further optimization pending |
| Poly1305 | Accelerated | No merged optimization; dot-asm RVV port open, [PR #31182](https://github.com/openssl/openssl/pull/31182) | Gap -- no merged Poly1305 optimization |
| SM3 | Data not available | Accelerated (Zvksh) | None |
| SM4 | Data not available | Vector (Zvksed) merged; scalar Zksed open, [PR #30735](https://github.com/openssl/openssl/pull/30735); perf-only PRs open for CBC/XTS | Scalar path not yet merged |
| RSA/DH (Montgomery) | Accelerated | Merged (RV64GC) | None for RV64 |
| EC P-256/P-384 | Accelerated | No merged riscv64-specific asm; [PR #31873](https://github.com/openssl/openssl/pull/31873) (`ecp_nistz256`, 6.9x ECDSA sign / 1.78x verify / 2.5x ECDH measured on SG2044) closed unmerged 2026-09-07 after review concerns | Material gap -- real attempt exists but is not merged |
| Curve448 | Data not available | No merged implementation; two open RVV PRs, [#32847](https://github.com/openssl/openssl/pull/32847), [#32835](https://github.com/openssl/openssl/pull/32835) | Gap, in progress |
| GHASH | Accelerated | Accelerated (Zvkg, Zvbc, Zbc) | None |

**Security hardening gap (critical):** The AES scalar fallback path used when neither Zkn nor Zvkned is available is **not constant-time**, per [Issue #20980 "AES for RISC-V without Zkn extensions is not constant time"](https://github.com/openssl/openssl/issues/20980) (opened 2023-05-17). Fix PRs [#31080](https://github.com/openssl/openssl/pull/31080) ("make riscv64 no-Zkn fallback constant time") and [#31082](https://github.com/openssl/openssl/pull/31082) ("make riscv64 no-clmul GHASH fallback constant time") remain open. This affects any riscv64 silicon lacking the Zkn/Zvkned/Zbc extensions, which is a meaningful share of currently deployed RISC-V hardware.

**Capability-coupling bug (performance-relevant):** [Issue #25334](https://github.com/openssl/openssl/issues/25334), open since 2024-08-30: AES only takes the fast Zkn path when **both** `_zknd` and `_zkne` are present in `OPENSSL_riscvcap`; with only one set, it silently falls back to the slow path (measured >5x regression, ~8,046 KB/s vs. ~1,517 KB/s for AES-128-ECB). No linked PR.

**musl-specific gap:** [Issue #28118 "Riscv extension detection is broken on musl"](https://github.com/openssl/openssl/issues/28118) (open since 2025-07-29): `RISCV_HAS_ZBB()` wrongly returns false under musl libc, silently disabling the Zbb-accelerated ChaCha20 path (and likely others). This is the third of three related musl capability-detection incidents (Section 9/11). No PR exists.

**NaN/floating-point semantics:** Data not available: no issue matching riscv-specific floating point/NaN handling was found; OpenSSL's RISC-V code is integer/bitmanip/vector-crypto only, with no floating-point-sensitive numerics identified.

---

## 7. CI/CD Infrastructure

OpenSSL uses GitHub Actions exclusively -- `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` do not exist in the repository. Of 32 workflow files, exactly 3 reference riscv in any form.

| File | Trigger | Runner | FIPS |
|---|---|---|---|
| `cross-compiles.yml` | Every `pull_request` and `push`, unconditional | `ubuntu-latest` + QEMU user-mode (one riscv64 leg among many arches) | `fips: no` |
| `riscv-more-cross-compiles.yml` | `pull_request`/`push` gated on PR title containing "riscv"/"RISC-V", PR body or commit message containing `[riscv ci]`, nightly cron (`35 02 * * *`), or manual dispatch | `ubuntu-latest` + QEMU user-mode, 13-leg extension matrix | `fips: no` on every leg |
| `os-zoo.yml`, job `linux-riscv64` | `schedule` (`50 02 * * *`) or manual `workflow_dispatch` only, never `push`/`pull_request` | `runs-on: linux-riscv64` -- a real self-hosted riscv64 runner label, not QEMU | builds with `enable-fips` directly in its `./config` invocation (distinct from the `fips:` matrix flag used by the other two files) |

A 2026-09-18 commit (`0dcf16644d`, "CI: treat `[aarch64 ci]`/`[riscv ci]` in a PR body as a full-test opt-in") formalizes the tag-based opt-in mechanism for the extension matrix.

**Test depth:** `cross-compiles.yml` runs EVP-only tests on ordinary PRs, the full suite on push or PRs labeled "extended tests." `riscv-more-cross-compiles.yml` runs EVP-subset tests on ordinary PRs and the full suite on push/schedule/`[riscv ci]`-tagged PRs. `os-zoo.yml`'s native job runs `make test` in full, nightly, on real hardware.

**13-leg extension matrix** (`riscv-more-cross-compiles.yml`) sweeps scalar crypto (Zbb/Zbc/Zbkb/Zknd/Zkne), vector/vector-crypto (V, Zvkg, Zvkb+Zvbc, Zvkned) at VLEN 128/256/512, an inline-asm `-march=` path, and two hwprobe-detection-path legs (no `OPENSSL_riscvcap` override, relying on the runtime syscall). A documented QEMU 8.2.2 limitation (it misreports `ZVKB`/most `Zvk*` extensions) forces several legs to avoid flags QEMU cannot emulate correctly.

**No native riscv64 presence in the main CI matrix:** `.github/workflows/ci.yml`, which gates amd64/arm64 on every commit, contains zero riscv references. All riscv64 signal on ordinary pushes/PRs is QEMU-emulated; real-hardware signal exists only via the nightly, non-change-gated `os-zoo.yml` job. QEMU does not model cache behavior, pipeline timing, or memory latency, so hardware-specific race conditions (Section 11) and performance regressions on real silicon are not reliably caught by the per-PR workflows.

**No riscv64 GitHub-hosted runner exists** -- GitHub does not offer one. The `linux-riscv64` label in `os-zoo.yml` is self-hosted hardware, consistent with [PR #27240 "Add riscv64 CI runner"](https://github.com/openssl/openssl/pull/27240)'s closure history in the earlier cycle of this report.

**RISE runner usage:** No evidence was found that OpenSSL's riscv64 CI uses RISE's free native RISC-V runner infrastructure (announced on the RISE blog, [March 2026](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)). The only tracked RISE item for OpenSSL ([riseproject-dev/system-libraries-wg#3](https://github.com/riseproject-dev/system-libraries-wg/issues/3)) is explicitly blocked on a Simulator/Emulator WG dependency, not runner infrastructure.

**Comparison table:**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Main CI (`ci.yml`), every commit | Native GitHub-hosted | Native GitHub-hosted | Not present |
| Cross-compile matrix | N/A (native) | Included | Included, QEMU-emulated |
| Extension-specific matrix | N/A | Not identified | 13-leg QEMU matrix, opt-in trigger |
| Native-hardware nightly job | N/A | Not identified for this comparison | `os-zoo.yml`, `linux-riscv64`, self-hosted, nightly/manual only |
| FIPS coverage | Yes, main CI | Yes, main CI | No on QEMU legs (`fips: no`); native nightly job builds `enable-fips` but FIPS self-test execution during `make test` is not separately confirmed |

---

## 8. Distribution and Release Status

**Upstream GitHub releases:** OpenSSL publishes **source tarballs only** for every architecture -- there is no riscv64-specific gap, because there are no architecture-specific binary release assets for any platform. Direct API confirmation of the release-asset listing was blocked in this research cycle by session repository-access restrictions (`GitHub access to this repository is not enabled for this session`), but this is consistent with established project practice and with every prior cross-check. Consumable riscv64 binaries come entirely from Linux distribution packaging of unmodified upstream source.

**Ubuntu:** `openssl` version **3.5.5-1ubuntu3** is built for riscv64 in Ubuntu 26.04 "resolute" (confirmed directly via `packages.ubuntu.com`, both the package page listing riscv64 among armhf/ppc64el/riscv64/s390x "ports" architectures, and the architecture-specific file list at `/resolute/riscv64/openssl/filelist`). Many related packages (`libcrypt-openssl-*-perl`, `librust-openssl-*-dev`, `libengine-*-openssl`) also build for riscv64 in the same suite.

**Debian:** `openssl 3.6.3-1` is present in Debian sid (unstable), status `Installed` on riscv64 (buildd host `rv-manda-01`); `openssl_3.5.6-1~deb13u2_riscv64.deb` is available in Debian trixie security updates.

**Arch Linux RISC-V** (archriscv.felixc.at): `[core]/openssl-3.6.5-1-riscv64.pkg.tar.zst` was built **2026-09-30**, one day before this report's cutoff, per the port's live build-status feed (`.status/lastupdate.txt`), with the `[core]` repo showing 294/299 (98.33%) packages built for riscv64. This is a rolling, actively maintained package, not a stale snapshot.

**PyPI:** No PyPI package literally named `openssl` exists (HTTP 404 on both `pypi.org/pypi/openssl/json` and `pypi.org/simple/openssl/`). The related binding `pyOpenSSL` ships pure Python only with no compiled wheels for any architecture. Not materially relevant since OpenSSL is a C library, not a Python-distributed package.

**RISE wheel builder** (GitLab project, PyPI-compatible simple index): also has no `openssl` package (redirects to the same 404 on pypi.org), consistent with the PyPI finding.

**What a user must do to get a working riscv64 binary:** install from an active distro's riscv64 ports repository (Ubuntu resolute, Debian sid/trixie, Arch RISC-V core) or build from upstream source using the `linux64-riscv64` Configure target; there is no official upstream binary artifact for any architecture.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes / blocking issues |
|---|---|---|---|---|---|
| Perl | build-dependency, critical | Green. Pure interpreted language, architecture-independent; ships on every riscv64 distro | Green (not arch-specific) | Green | `search_issues riscv64 repo:Perl/perl5` returned no riscv64-specific open report |
| GNU binutils | build-dependency, critical | Green. riscv64 backend (as/ld/objdump) supported upstream; requires >= 2.38 to assemble the Zvk vector-crypto instruction set used by several OpenSSL `.pl` generators | Not independently verified this cycle | Shipped via `binutils-riscv64-linux-gnu` in Debian/Ubuntu | Canonical development happens on sourceware.org mailing lists/Bugzilla, not GitHub Issues; the `bminor/binutils-gdb` GitHub mirror has no usable issue tracker for cross-checking riscv64 status |
| glibc | runtime-dependency, critical | Green. Builds on riscv64; official Debian/Ubuntu/Arch RISC-V ports | Ambiguous -- Sourceware Buildbot riscv64 builders (293/336 reported) show "build successful," but whether `make check` executes under QEMU vs. cross-compile-only is unconfirmed; an open correctness bug reports SIGILL when RVV is `prctl()`-disabled then `memset()` is called (since a December 2025 RVV `memset` merge) [NEEDS VERIFICATION] | Source-only upstream, consumed via distro riscv64 ports | No dedicated project report exists for glibc in this research set to cross-reference further |
| musl | runtime-dependency, critical | Green for the base build; OpenSSL's own riscv64-musl build was fixed in [PR #25787](https://github.com/openssl/openssl/pull/25787) (2024) | **Broken for capability detection**: `RISCV_HAS_ZBB()` and related macros incorrectly return false under musl, silently disabling optimized paths ([Issue #28118](https://github.com/openssl/openssl/issues/28118), open since 2025-07-29, no PR) | Alpine Linux (musl-based) ships riscv64 | Third musl-related incident after [Issue #25772](https://github.com/openssl/openssl/issues/25772) -> [PR #25787](https://github.com/openssl/openssl/pull/25787) (missing `__NR_riscv_hwprobe` define) -- fixes have been point patches, not a systemic rewrite of the capability-detection subsystem |
| zlib | runtime-dependency, optional | Green. No external dependencies of its own; builds cleanly on riscv64 | Green, covered by Debian/Ubuntu CI | Debian sid, Ubuntu noble/resolute ship it | Open, unreviewed RVV-optimized Adler32 PR (zlib #1099) with no maintainer response since 2025-11; no riscv64 correctness bugs |
| brotli | runtime-dependency, optional | Green. Base riscv64 port upstream since 2018; builds from unmodified source | No riscv64 CI job exists in any of brotli's 8 GitHub Actions workflows | Debian sid, Alpine edge, Chimera ship it; no official binary release artifacts | No RVV optimization merged; CMake cross-compile auto-detection has no `riscv64-linux-gnu-*` branch, so QEMU test-wrapping is not automatic |
| zstd | runtime-dependency, optional | Green | Green, QEMU CI since zstd PR #4502 | Shipped Debian/Ubuntu | Two riscv64 correctness bugs already fixed upstream (`ZSTD_row_getRVVMask()` silent corruption, `__64BIT__` misdetection); none open |
| QEMU | test-dependency, critical | N/A (QEMU itself is not built as part of OpenSSL; it is the execution vehicle for riscv64 CI) | QEMU user-mode (`qemu-user`) is how both `cross-compiles.yml` and `riscv-more-cross-compiles.yml` execute riscv64 test binaries on `ubuntu-latest` x86 runners; Ubuntu 24.04 ships QEMU 8.2.2, which **misreports `ZVKB` and most `Zvk*` vector-crypto extensions**, forcing several CI legs to work around flags QEMU cannot emulate correctly, with an open TODO to tighten detection "once CI moves to a newer QEMU" | N/A | This is the single most consequential dependency for CI fidelity: every per-PR riscv64 signal in OpenSSL's CI runs through this specific QEMU version's emulation accuracy, not real silicon |

**project-graph cross-check:** Not performed -- the `project-graph` MCP server was unreachable (`CONNECTION_CLOSED`) throughout this research cycle. Ubuntu/Debian/Arch riscv64 package availability above was confirmed via direct `packages.ubuntu.com` and distro-site fetches instead, not via the graph database; re-running the graph query once that server is reachable would add a second, independent confirmation channel for these same facts.

---

## 11. Known Bugs and Active Issues

### Critical -- Security

| ID | Title | Status | Notes |
|---|---|---|---|
| [#20980](https://github.com/openssl/openssl/issues/20980) | AES for RISC-V without Zkn extensions is not constant time | Open since 2023-05-17 | Root issue underlying fix PRs below; a cache-timing side channel on hardware without Zkn/Zvkned |
| [#31080](https://github.com/openssl/openssl/pull/31080) | aes: make riscv64 no-Zkn fallback constant time | Open | Fix for #20980, still unmerged |
| [#31082](https://github.com/openssl/openssl/pull/31082) | modes: make riscv64 no-clmul GHASH fallback constant time | Open | Companion fix for GHASH |

### High -- Reliability

| ID | Title | Status | Notes |
|---|---|---|---|
| [#30880](https://github.com/openssl/openssl/issues/30880) | test_lhash occasionally failing on linux-riscv64 CI (OS Zoo CI) | Open since 2026-04-17 | Flaky failure specific to the native riscv64 self-hosted runner |
| [#28118](https://github.com/openssl/openssl/issues/28118) | Riscv extension detection is broken on musl | Open since 2025-07-29 | See Section 9; no PR |
| [#25334](https://github.com/openssl/openssl/issues/25334) | Both _zknd and _zkne must be presented simultaneously in OPENSSL_riscvcap to speed up AES | Open since 2024-08-30 | >5x performance regression when caps are set independently; no PR |

### Medium -- Correctness / Performance (open)

| ID | Title | Status | Notes |
|---|---|---|---|
| [#30330](https://github.com/openssl/openssl/issues/30330) | rv64i_zkne_set_encrypt_key logic for checking for null keys is backwards | Likely fixed | Matches [PR #30333](https://github.com/openssl/openssl/pull/30333) "riscv: aes: fix checks on null keys," merged 2026-03-13 -- treat #30330 as resolved pending final closure confirmation |
| [#29453](https://github.com/openssl/openssl/issues/29453) | RISCV: Use intrinsic function instead of inline assembly | Open since 2025-12-19 | Portability/codegen request, not a correctness bug |
| [#28664](https://github.com/openssl/openssl/issues/28664) | [RISC-V] Further optimization for SHA256 performance | Open since 2025-09-25 | Further gains found on real hardware beyond the initial +116-122% improvement from [PR #27381](https://github.com/openssl/openssl/pull/27381) |
| [#29135](https://github.com/openssl/openssl/issues/29135) | Performance Optimization of SM4-CBC Encryption and Decryption under RISC-V Architecture | Open since 2025-11-13 | |
| [#29269](https://github.com/openssl/openssl/issues/29269) | Additional architecture specific testing | Open since 2025-11-30 | Broader testing-coverage request |
| [#29522](https://github.com/openssl/openssl/issues/29522) | Consider adding compile-time detection of RISC-V ISA extensions (Zvkned, Zvkb) | Status ambiguous -- one source lists it closed, another lists it open/"help wanted" | Discrepancy noted; related to the same `riscv_arch.h` architectural gap as #28118 |
| [#32022](https://github.com/openssl/openssl/pull/32022) | riscv64: fix slow MD5 computation when input is misaligned | Open | |
| [#30501](https://github.com/openssl/openssl/pull/30501) | riscv: Add lpad instructions for CFI support (Zicfilp) | Open | Reviewer identified missing/spurious `lpad` insertions across multiple assembly files; stale notice issued |
| [#30733](https://github.com/openssl/openssl/pull/30733) | riscv: fix RV32 issues found during validation | Open | `size_t` format specifier, AES-XTS function-pointer assignment under strict builds; stale notice issued |

### Recently fixed / closed (context)

[#28731 SM2 CI regression](https://github.com/openssl/openssl/issues/28731) (closed, a side-channel fix for ARM modular inversion had broken RISC-V SM2 correctness), [#28550 intermittent deadlock in riscv64 CI job](https://github.com/openssl/openssl/issues/28550) (closed; root cause traced via [PR #26898](https://github.com/openssl/openssl/pull/26898) to a generic RCU/memory-ordering defect that riscv64's weaker memory model exposed first, not a riscv64-only bug), [#24070 chacha_internal_test failed with Zvkb](https://github.com/openssl/openssl/issues/24070) (closed 2024), [#32229 some CI tests fail on the RISC-V runner](https://github.com/openssl/openssl/issues/32229) (closed 2026-08), [#29357 no-deprecated cross-compile failure](https://github.com/openssl/openssl/issues/29357) (open, see Section 5), [#26989 RV32 Zksed SM4 key setup failure](https://github.com/openssl/openssl/issues/26989) (closed; root cause was `rvi_zksed_set_encrypt_key` never setting `a0` before `ret`, and the affected PR #18285 was itself never merged), [#20091 Expand our RISC-V testing](https://github.com/openssl/openssl/issues/20091) (closed 2026-03-25; resulted in the current QEMU extension matrix).

---

## 12. Objections and Upstream Blockers

**Blocker 1 (Security, unresolved):** The AES scalar fallback is not constant-time on hardware lacking Zkn/Zvkned ([#20980](https://github.com/openssl/openssl/issues/20980)). Fix PRs [#31080](https://github.com/openssl/openssl/pull/31080) and [#31082](https://github.com/openssl/openssl/pull/31082) remain open with no stated merge blocker beyond normal review queue -- this is the highest-priority unresolved item for any riscv64 deployment handling sensitive key material without hardware AES acceleration.

**Blocker 2 (Correctness, musl, structural):** Three separate musl capability-detection incidents ([#25772](https://github.com/openssl/openssl/issues/25772) -> [PR #25787](https://github.com/openssl/openssl/pull/25787), then [#28118](https://github.com/openssl/openssl/issues/28118)) against the same `include/arch/riscv_arch.h` subsystem suggest point patches rather than a systemic fix. Issues [#29453](https://github.com/openssl/openssl/issues/29453) (intrinsics vs. inline asm) and [#29522](https://github.com/openssl/openssl/issues/29522) (compile-time detection) are pushing toward a more durable architectural fix but neither has a merged PR.

**Blocker 3 (CI, structural):** No riscv64 presence in the main `ci.yml` matrix that gates amd64/arm64 on every commit. All per-PR riscv64 signal is QEMU-emulated on a QEMU version (8.2.2, Ubuntu 24.04) with documented vector-crypto-extension reporting bugs; genuine native-hardware signal exists only via a nightly, non-change-gated job.

**Blocker 4 (FIPS, structural):** All QEMU-based riscv64 CI legs explicitly set `fips: no`. The native `os-zoo.yml` job does build with `enable-fips`, but this is a build-time flag in that job's `./config` invocation, not a `fips:` matrix variable, and no finding confirms FIPS self-tests are exercised as part of `make test` on that job specifically. Net effect: FIPS-validated riscv64 OpenSSL has no clearly confirmed, continuous CI coverage [NEEDS VERIFICATION].

**Blocker 5 (EC performance, structural):** [PR #31873](https://github.com/openssl/openssl/pull/31873), a serious `ecp_nistz256` riscv64 assembly implementation with measured 1.78x-6.9x gains and a validated test methodology (130 tests plus a 2064-vector field-arithmetic cross-check against a big-integer oracle), was closed unmerged after 30 days of inactivity and unaddressed review concerns. This is the single largest "nearly there" opportunity identified in this research cycle -- reviving and merging it would close OpenSSL's most visible riscv64 EC performance gap.

**Organizational blocker:** Review bandwidth, not technical disagreement, is the recurring theme -- `CONTRIBUTING.md` states this explicitly, and it is corroborated by the stale-notice pattern on [#30501](https://github.com/openssl/openssl/pull/30501), [#29970](https://github.com/openssl/openssl/pull/29970), and [#31873](https://github.com/openssl/openssl/pull/31873), plus the OpenSSL Foundation's separately noted concern (identified in a prior research cycle) that AI-generated contributions are straining the issue backlog [NEEDS VERIFICATION, single source].

**RISE involvement:** Minimal and indirect. OpenSSL is not a RISE member project, has no RISE blog coverage, and is not listed in the RISE wheel builder. The only tracked item, [riseproject-dev/system-libraries-wg#3 "OpenSSL"](https://github.com/riseproject-dev/system-libraries-wg/issues/3) (open, created 2026-07-15), references VRULL/SiFive vector-crypto patches and is marked **Blocked**, with no assignee and no linked PRs, dependent on the Simulator/Emulator WG. A related open issue, [riseproject-dev/language-runtimes-wg#57](https://github.com/riseproject-dev/language-runtimes-wg/issues/57), requests adding `linux-riscv64` to `org.wildfly.openssl:wildfly-openssl`'s supported-platform matrix -- this is about a downstream Java binding, not OpenSSL itself. ISCAS, the employer of the port's original author (luyahan), is itself a RISE General Member, which is an indirect link but does not make OpenSSL a RISE-funded project.

---

## 13. Readiness Assessment

- **Color:** blue (n/a -- no sub-case applies to blue)
- **Release provider:** distro

OpenSSL's upstream CI both builds riscv64 and executes the test suite: [`riscv-more-cross-compiles.yml`](https://github.com/openssl/openssl/blob/master/.github/workflows/riscv-more-cross-compiles.yml) (13 extension-matrix QEMU legs, EVP-subset tests on ordinary PRs, full suite on push/schedule/`[riscv ci]`-tagged PRs) and `cross-compiles.yml` (one riscv64 QEMU leg) both run `make test`-equivalent steps, and [`os-zoo.yml`](https://github.com/openssl/openssl/blob/master/.github/workflows/os-zoo.yml)'s `linux-riscv64` job additionally runs `make test` nightly on a native, non-QEMU, riscv64 self-hosted runner. Upstream publishes only source tarballs for every architecture (no riscv64-specific release gap), with the consumable riscv64 binary coming from Debian/Ubuntu/Arch RISC-V packaging of unmodified upstream source -- so per the color model this is "CI build yes / CI test yes / upstream artifact no" = blue, matching sibling C libraries such as zlib and zstd rather than a downstream-only orange grade.

**Pending work that could change the grade:**

- Open, security-relevant riscv64 PRs: AES scalar-fallback constant-time fixes ([#31080](https://github.com/openssl/openssl/pull/31080), [#31082](https://github.com/openssl/openssl/pull/31082), still open).
- Scalar SM4 Zksed ([#30735](https://github.com/openssl/openssl/pull/30735)), SHA-3 Keccak via Zbb with unresolved alignment concerns ([#29970](https://github.com/openssl/openssl/pull/29970)), ChaCha20 dot-asm ([#30787](https://github.com/openssl/openssl/pull/30787), 2 approvals pending merge), Poly1305 dot-asm ([#31182](https://github.com/openssl/openssl/pull/31182)) -- all open.
- Open correctness/perf issues: musl Zbb/hwprobe detection broken ([#28118](https://github.com/openssl/openssl/issues/28118), no PR yet), `no-deprecated` cross-compile failure on all branches ([#29357](https://github.com/openssl/openssl/issues/29357), fix PR [#30763](https://github.com/openssl/openssl/pull/30763) open), flaky riscv64 CI ([#30880](https://github.com/openssl/openssl/issues/30880) open, [#32229](https://github.com/openssl/openssl/issues/32229) closed), SHA-256 further optimization ask ([#28664](https://github.com/openssl/openssl/issues/28664)).
- No FIPS testing on any riscv64 CI leg via the `fips:` matrix flag (`fips: no` on every QEMU leg across both `cross-compiles.yml` and `riscv-more-cross-compiles.yml`). Note: the native `os-zoo.yml` job does pass `enable-fips` to its `./config` call, a distinction from the matrix-driven `fips: no` legs; whether FIPS self-tests are actually exercised by that job's `make test` step was not independently confirmed this cycle, so this should be read as "no confirmed FIPS CI coverage" rather than a flat contradiction.
- RISE Project involvement is minimal/indirect: OpenSSL is not a RISE member project, has no RISE blog coverage or wheel listing, and the only tracked item is a blocked planning issue ([riseproject-dev/system-libraries-wg#3](https://github.com/riseproject-dev/system-libraries-wg/issues/3), status Blocked, no assignee/PRs) referencing VRULL/SiFive vector-crypto patches.
- [PR #31873](https://github.com/openssl/openssl/pull/31873) (EC P-256 assembly, measured 1.78x-6.9x gains) closed unmerged after review concerns -- reviving it would close OpenSSL's largest remaining riscv64 performance gap but does not itself change the blue grade, since the grade already reflects CI build+test coverage rather than feature completeness.

---

## 14. Investment Analysis

Before sizing work: RISE has not funded or completed any OpenSSL-specific engineering. Its only tracked item ([system-libraries-wg#3](https://github.com/riseproject-dev/system-libraries-wg/issues/3)) is a blocked planning issue with no assignee or linked PRs, so none of the items below should be treated as already covered by RISE.

### 14.1 Functional Enablement

Three functional gaps materially affect correctness or build success on riscv64:

1. AES constant-time fallback gap (security-critical, fix PRs open: [#31080](https://github.com/openssl/openssl/pull/31080), [#31082](https://github.com/openssl/openssl/pull/31082)).
2. musl extension detection silently broken ([#28118](https://github.com/openssl/openssl/issues/28118), no PR).
3. `no-deprecated` cross-compile failure on all branches ([#29357](https://github.com/openssl/openssl/issues/29357), fix PR [#30763](https://github.com/openssl/openssl/pull/30763) open but unmerged).

SM4 scalar Zksed ([#30735](https://github.com/openssl/openssl/pull/30735)) remains a functional gap on scalar-only hardware lacking vector support. SHA-3 has no merged optimized implementation despite two closed/superseded attempts and an active successor PR pair.

### 14.2 Performance Optimization

Measured upstream benchmark data (all riscv64-only before/after comparisons on specific hardware, not cross-architecture):

| Algorithm | Improvement | Platform | Source |
|---|---|---|---|
| EC P-256 (`ecp_nistz256`) ECDSA sign | ~6.9x | SG2044, openEuler, XuanTie C920, no crypto ext | [PR #31873](https://github.com/openssl/openssl/pull/31873) (closed unmerged) |
| EC P-256 ECDH | ~2.5x | same | [PR #31873](https://github.com/openssl/openssl/pull/31873) |
| EC P-256 ECDSA verify | ~1.78x | same | [PR #31873](https://github.com/openssl/openssl/pull/31873) |
| SHA-384/SHA-512 round interleaving | +7.6% to +36.5% (saturates at large block sizes) | SpacemiT K3, VLEN=256 | [PR #32575](https://github.com/openssl/openssl/pull/32575) |
| AES-128-CBC encryption | +17.7% to +32.0% (64B-16384B, 16B flat) | SpacemiT K3 (X100), VLEN=256 | [PR #32583](https://github.com/openssl/openssl/pull/32583) |
| AES-128-XTS small-packet decryption | +13% (vlen=128 sim), +15% (A100, vlen=256), 16B packets only | HW simulation + SpacemiT A100 | [PR #30552](https://github.com/openssl/openssl/pull/30552) |
| SHA-256 (hand asm vs. C+rv64gc) | +116% to +122% | rv64gc | [PR #27381](https://github.com/openssl/openssl/pull/27381) |
| AES (Zknd/Zkne vs. pure C) | 2.7x-5x (up to ~9.5x for AES-ECB) | 100MHz Rocket Chip FPGA (not representative of real silicon) | community gist, ZenithalHourlyRate |
| Montgomery/RSA (RV64GC) | "significant acceleration across all RSA operations" (no exact figure) vs. none | SpacemiT X60 | [Issue #27926](https://github.com/openssl/openssl/issues/27926) |
| SpacemiT 3.5 suite: AES-CBC 16KiB | 1.52x-1.71x by key size | SpacemiT X100, VLEN=256 | spacemit-com/openssl PR #1 |
| SpacemiT 3.5 suite: SHA-256/SHA-512 16KiB | 1.84x / 1.19x | same | spacemit-com/openssl PR #1 |
| SpacemiT 3.5 suite: SM2 sign/verify | ~1.0x (a prior 6.7x claim was reverted for a security issue -- input-dependent branching in the field reducer) | same | spacemit-com/openssl PR #1 |

Open performance PRs awaiting merge: ChaCha20 dot-asm ([#30787](https://github.com/openssl/openssl/pull/30787), 2 approvals), Poly1305 dot-asm ([#31182](https://github.com/openssl/openssl/pull/31182)), SM4-XTS ([#30633](https://github.com/openssl/openssl/pull/30633), security review concerns re: VLEN>512 buffer overread and GF multiplier overflow at VLEN=2048), Curve448 vectorization ([#32847](https://github.com/openssl/openssl/pull/32847), [#32835](https://github.com/openssl/openssl/pull/32835)), SHA-3 scalar optimization ([#32607](https://github.com/openssl/openssl/pull/32607)).

P-256/P-384 ECDH has the largest confirmed-but-unmerged opportunity: real benchmark data exists ([PR #31873](https://github.com/openssl/openssl/pull/31873)) but the PR was closed for inactivity/review concerns, not technical rejection.

### 14.3 CI/CD Infrastructure

The structural absence of riscv64 from the main `ci.yml` matrix (Section 7) is the highest-leverage CI investment: adding a change-gated native riscv64 runner (e.g. via RISE runner infrastructure, which OpenSSL does not currently use) would close the gap between QEMU-only per-PR signal and the nightly-only native-hardware signal that exists today. A secondary investment is extending confirmed FIPS test execution to a riscv64 CI leg -- currently only a build-time `enable-fips` flag on the native nightly job, with no confirmed FIPS self-test execution in CI output.

### 14.4 Ecosystem Enablement

Section 10 is omitted: OpenSSL is a system library consumed by a vast ecosystem of other software, but it does not itself have a dependent package ecosystem (Python/npm/Maven/Kubernetes-operator style) that requires separate riscv64 enablement work -- OpenSSL's own riscv64 readiness is the enabling factor for those downstream consumers, not the other way around.

The musl capability-detection bug ([#28118](https://github.com/openssl/openssl/issues/28118)) is a small, unowned fix (define `__NR_riscv_hwprobe` or add an `AT_HWCAP` fallback) that affects Alpine Linux and other musl-based riscv64 deployments; it requires only a CLA-covered contributor. The `no-deprecated` cross-compile bug ([#29357](https://github.com/openssl/openssl/issues/29357)) already has a fix PR ([#30763](https://github.com/openssl/openssl/pull/30763)) open and unmerged -- pushing it through review is a low-cost, high-leverage action.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Push AES T-table constant-time fix through review and merge ([#31080](https://github.com/openssl/openssl/pull/31080), [#31082](https://github.com/openssl/openssl/pull/31082)) | 2-4 (review + fix + test) | Open, CLA required | Critical |
| Functional | Fix musl extension detection ([#28118](https://github.com/openssl/openssl/issues/28118)) | 1-2 | Open, unowned | High |
| Functional | Push `no-deprecated` cross-compile fix through review ([#29357](https://github.com/openssl/openssl/issues/29357), [#30763](https://github.com/openssl/openssl/pull/30763)) | 0.5 (review push) | Open, fix exists | High |
| Functional | Fix `_zknd`/`_zkne` independent-capability coupling ([#25334](https://github.com/openssl/openssl/issues/25334)) | 1-2 | Open, unowned, no PR | High |
| Functional | Revive EC P-256 `ecp_nistz256` assembly ([PR #31873](https://github.com/openssl/openssl/pull/31873)), address review concerns, resubmit | 3-5 (address review + re-verify) | Open, prior author or new contributor | High |
| Functional | SM4 scalar Zksed ([#30735](https://github.com/openssl/openssl/pull/30735)) | 1 (review) | Open, committer review | Medium |
| Functional | SHA-3 Keccak-1600 optimization, resolve alignment concern ([#29970](https://github.com/openssl/openssl/pull/29970)/[#32607](https://github.com/openssl/openssl/pull/32607) lineage) | 1-2 | ISCAS / committer | Medium |
| Functional | CFI `lpad` coverage fixes ([#30501](https://github.com/openssl/openssl/pull/30501)) | 2-3 | Open, committer review | Medium |
| Functional | RV32 portability fixes ([#30733](https://github.com/openssl/openssl/pull/30733)) | 0.5 (committer merge) | Open, committer review | Low |
| Performance | Merge ChaCha20 dot-asm, already at 2 approvals ([#30787](https://github.com/openssl/openssl/pull/30787)) | 0.5 (committer merge) | Open, committer review | High |
| Performance | Merge Poly1305 dot-asm RVV ([#31182](https://github.com/openssl/openssl/pull/31182)) | 1-2 (review + merge) | Open, committer review | High |
| Performance | Resolve SM4-XTS security concerns and merge ([#30633](https://github.com/openssl/openssl/pull/30633)) | 2-3 (fix buffer overread + review) | Open, committer review | Medium |
| CI/CD | Add a change-gated native riscv64 runner to the main CI matrix | 4-8 (infrastructure setup, upstream negotiation; consider RISE runners) | No current owner / RISE | High |
| CI/CD | Confirm and, if absent, add FIPS self-test execution to a riscv64 CI leg | 2-4 | Open, committer | Medium |
| CI/CD | Diagnose and fix the flaky `test_lhash` failure on `linux-riscv64` ([#30880](https://github.com/openssl/openssl/issues/30880)) | 2-4 | No current owner | Medium |
| Ecosystem | Publish a riscv64 vs. arm64 vs. amd64 benchmark comparison (none currently exists anywhere) | 2-4 (test infrastructure + reporting) | No current owner | Medium |

---

## 15. References

- [OpenSSL GitHub repository](https://github.com/openssl/openssl)
- [OpenSSL homepage](https://www.openssl.org/)
- [OpenSSL Foundation](https://openssl.foundation)
- [riscv-more-cross-compiles.yml](https://github.com/openssl/openssl/blob/master/.github/workflows/riscv-more-cross-compiles.yml)
- [cross-compiles.yml](https://github.com/openssl/openssl/blob/master/.github/workflows/cross-compiles.yml)
- [os-zoo.yml](https://github.com/openssl/openssl/blob/master/.github/workflows/os-zoo.yml)
- [include/arch/riscv_arch.def](https://github.com/openssl/openssl/blob/master/include/arch/riscv_arch.def)
- [include/arch/riscv_arch.h](https://github.com/openssl/openssl/blob/master/include/arch/riscv_arch.h)
- [crypto/riscvcap.c](https://github.com/openssl/openssl/blob/master/crypto/riscvcap.c)
- [Configurations/10-main.conf](https://github.com/openssl/openssl/blob/master/Configurations/10-main.conf)
- [doc/man3/OPENSSL_riscvcap.pod](https://github.com/openssl/openssl)
- [PR #14723 - Add riscv64 target](https://github.com/openssl/openssl/pull/14723)
- [PR #14724 - Add riscv64 target for OpenSSL_1_1_1](https://github.com/openssl/openssl/pull/14724)
- [PR #17640 - Implementations of AES and GCM for RISC-V](https://github.com/openssl/openssl/pull/17640)
- [PR #21923 - Full Zvk vector crypto suite](https://github.com/openssl/openssl/pull/21923)
- [PR #24172 - hwprobe syscall capability detection](https://github.com/openssl/openssl/pull/24172)
- [PR #25787 - Fix builds on riscv64 using musl](https://github.com/openssl/openssl/pull/25787)
- [PR #27381 - Generic optimized SHA-256 for rv64gc](https://github.com/openssl/openssl/pull/27381)
- [PR #29263 - SHA512 performance optimized by RISC-V RVV](https://github.com/openssl/openssl/pull/29263)
- [PR #29264 - SM3 performance optimized with RISC-V Vector Crypto](https://github.com/openssl/openssl/pull/29264)
- [PR #29970 - riscv: support sha3 perf optimization](https://github.com/openssl/openssl/pull/29970)
- [PR #30501 - CFI lpad instructions (Zicfilp)](https://github.com/openssl/openssl/pull/30501)
- [PR #30552 - AES-128-XTS small-packet decryption optimization](https://github.com/openssl/openssl/pull/30552)
- [PR #30633 - SM4-XTS performance optimization](https://github.com/openssl/openssl/pull/30633)
- [PR #30733 - RV32 portability fixes](https://github.com/openssl/openssl/pull/30733)
- [PR #30735 - Scalar Zksed SM4 support](https://github.com/openssl/openssl/pull/30735)
- [PR #30763 - no-deprecated cross-compile fix](https://github.com/openssl/openssl/pull/30763)
- [PR #30787 - ChaCha20 dot-asm, rv64gc+zbb](https://github.com/openssl/openssl/pull/30787)
- [PR #31080 - AES no-Zkn fallback constant time](https://github.com/openssl/openssl/pull/31080)
- [PR #31082 - GHASH no-clmul fallback constant time](https://github.com/openssl/openssl/pull/31082)
- [PR #31182 - Poly1305 dot-asm RVV](https://github.com/openssl/openssl/pull/31182)
- [PR #31873 - EC ecp_nistz256 RISC-V64 assembly](https://github.com/openssl/openssl/pull/31873)
- [PR #31874 - Fix SM2 RISC-V64 crash from .rodata emission](https://github.com/openssl/openssl/pull/31874)
- [PR #32575 - SHA-512 round interleaving](https://github.com/openssl/openssl/pull/32575)
- [PR #32583 - AES-128-CBC encryption performance](https://github.com/openssl/openssl/pull/32583)
- [PR #32835 - Curve448 constant_time_lookup RVV](https://github.com/openssl/openssl/pull/32835)
- [PR #32847 - Curve448 field helpers RVV](https://github.com/openssl/openssl/pull/32847)
- [Issue #20980 - AES for RISC-V without Zkn extensions is not constant time](https://github.com/openssl/openssl/issues/20980)
- [Issue #22166 - SSL tests hang at high HARNESS_JOBS on riscv64](https://github.com/openssl/openssl/issues/22166)
- [Issue #25334 - _zknd and _zkne must be presented simultaneously](https://github.com/openssl/openssl/issues/25334)
- [Issue #26989 - RV32 Zksed SM4 key setup failure](https://github.com/openssl/openssl/issues/26989)
- [Issue #28118 - musl Zbb detection broken](https://github.com/openssl/openssl/issues/28118)
- [Issue #29357 - no-deprecated cross-compile failure](https://github.com/openssl/openssl/issues/29357)
- [Issue #30880 - test_lhash flaky on linux-riscv64 CI](https://github.com/openssl/openssl/issues/30880)
- [riseproject-dev/system-libraries-wg#3 - OpenSSL (blocked)](https://github.com/riseproject-dev/system-libraries-wg/issues/3)
- [riseproject-dev/language-runtimes-wg#57 - Port wildfly-openssl to linux-riscv64](https://github.com/riseproject-dev/language-runtimes-wg/issues/57)
- [RISE Project](https://riseproject.dev)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu resolute openssl package](https://packages.ubuntu.com/resolute/openssl)
- [Debian buildd riscv64 status](https://buildd.debian.org/status/package.php?p=openssl&suite=sid)
- [Arch Linux RISC-V core repository status](https://archriscv.felixc.at/.status/lastupdate.txt)
- [Benchmark of OpenSSL AES for RISC-V 64 (community gist)](https://gist.github.com/ZenithalHourlyRate/7b5175734f87acb73d0bbc53391d7140)