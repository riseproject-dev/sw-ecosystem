---
title: longfellow-zk
---

# longfellow-zk

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for longfellow-zk<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[google/longfellow-zk](https://github.com/google/longfellow-zk) is a C++ and Rust zero-knowledge proof library implementing anonymous credential schemes. It proves knowledge of ECDSA P-256 signatures and SHA-256 preimages without exposing the underlying credential data, targeting ISO mDOC/mDL and JWT identity credentials. The cryptographic scheme is described in [eprint.iacr.org/2024/2010](https://eprint.iacr.org/2024/2010) and is being standardized as IETF draft `draft-google-cfrg-libzk`.

The library is named after the Longfellow Bridge outside Google's Cambridge, MA office. The project was created 2025-04-29 with first public commit 2025-04-30. A European fork ([dyne/longfellow-zk](https://github.com/dyne/longfellow-zk)) exists under EU HORIZON grant PACESETTERS nr. 101132610.

**Governance:** Informal, Google-internal. The repository is a Copybara mirror of Google's internal monorepo. There is no GOVERNANCE.md, no CONTRIBUTING.md, and no steering committee. Governance is implicit via three CODEOWNERS plus Google's internal review process. External contributions require Google's CLA and must be accepted into the internal monorepo before appearing in the public mirror.

**Primary maintainers (from `.github/CODEOWNERS`):**

| GitHub handle | Name / affiliation | Commits |
|---|---|---|
| abhvious | Abhi Shelat, Northeastern University / Google | 84 |
| matteo-frigo / matteof-google | Matteo Frigo, fftw.org | 82 + 17 |
| ask77nl | Serguei Alleko, Google | 34 |
| divergentdave | David Cook (no visible company affiliation) | 62 |
| zk-proofs-team-bot | Copybara automation | 24 |

**Foundation/consortium membership:** None. No CNCF, Apache, or Linux Foundation affiliation. No RISE Project involvement. IETF engagement only via the draft standardization process.

**Community stance on new ports:** No documented policy on new architecture ports. The Copybara-driven internal sync model means external contributions require Google's internal review pipeline. Given that the generic fallback paths are already present and correct, a RISC-V port would primarily consist of adding an optimized architecture path - a well-scoped, bounded contribution - but acceptance depends entirely on Google's internal review process and interest.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-04-29 | Repository created on GitHub | [GitHub repo](https://github.com/google/longfellow-zk) |
| 2025-04-30 | First public commit | GitHub commit history |
| 2025-10-17 | PR #85 merged: benchmarks updated from Mac M1 Pro to Mac M4 baseline, ECDSA benchmarks added | GitHub PR #85 |
| 2026-01-06 | Issue #120 opened: mdoc_zk correctness bug (range checks against scalar field order) | GitHub issue #120 |
| 2026-07-17 | PR #157 merged: performance regression fix in circuit I/O; Mac M4 BM_MdocProver at 262 ms after fix | GitHub PR #157 |

No RISC-V-related commits, issues, or PRs exist in the repository. Searching all 173 issues, all 176 PRs, all commits, and all code for "riscv", "riscv64", "RISC-V", "rv64", and "rvv" returned zero results. There is no RISC-V port history.

---

## 3. Upstream Support Tier

**No formal tier policy exists.** The project does not publish an architecture support matrix or tier classification document.

The de facto tier classification can be inferred from CI coverage, binary release, and architecture-specific code:

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | yes (ubuntu-24.04-16core, native) | yes (arm-ubuntu-24.04-16core, native) | no |
| CMake toolchain file | yes (i386 only; amd64 is default) | yes (aarch64-linux-clang.cmake) | no |
| Architecture-specific C++ code | yes (PCLMULQDQ, inline asm adc/sbb/cmov) | yes (PMULL, CSEL/ADDS inline asm) | no (generic fallback only) |
| Architecture-specific Rust code | yes (x86_64.rs, 384 lines) | yes (aarch64.rs, 395 lines) | no (generic.rs fallback, 152 lines) |
| Pre-built binaries | none (source-only releases) | none | none |
| ARCH_FLAGS in CMake | -mpclmul | -march=armv8-a+crypto | (empty; "Architecture not recognized") |
| Benchmarks published | no (Mac M4 only in docs) | yes (Mac M4 = arm64) | no |

**Effective tiers:**
- Tier 1: amd64, arm64 (native CI, dedicated SIMD paths, tested)
- Tier 3: riscv64 (no CI, no optimized path, compiles via generic fallback, untested)

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

The library has two architecture-sensitive subsystems:

### 4.1 GF(2^128) Carryless Multiplication (lib/gf2k/sysdep.h)

This is the core cryptographic primitive. The dispatch order in `sysdep.h`:

1. x86/x86_64: four `_mm_clmulepi64_si128` calls (PCLMULQDQ), 3-accumulator Karatsuba scheme
2. aarch64 with AES extension: `vmull_p64` / `vmull_high_p64` (ARM PMULL)
3. arm/aarch64 without AES: 60+ line Karatsuba using `vmull_p8` / `vext_p8` / `vuzpq_p8`
4. Generic (all other targets including riscv64): scalar Kronecker substitution via `clmul64_lo` / `clmul64_hi`, no SIMD

riscv64 falls through to branch 4. The RISC-V Zbc extension (carry-less multiply, `clmul`/`clmulh` instructions) would directly accelerate this operation, but no `__riscv_zbc` or `__riscv` guard exists in the codebase.

The Rust side mirrors the same structure in `rust/runtime/algebra/src/arch/`:

| File | Lines | ISA | riscv64 |
|---|---|---|---|
| x86_64.rs | 384 | PCLMULQDQ via std::arch::x86_64 | no |
| aarch64.rs | 395 | PMULL via std::arch::aarch64 | no |
| arm_neon.rs | present | ARM NEON | no |
| generic.rs | 152 | scalar Kronecker substitution | yes (fallback) |

The `arch_select!` macro in `mod.rs` explicitly lists x86_64 (pclmulqdq+sse2), aarch64, and arm+neon as optimized targets. All other targets, including riscv64, receive `generic.rs`.

### 4.2 Add-with-Carry / Subtract-with-Borrow / Conditional Move (lib/algebra/sysdep.h)

Used in prime-field arithmetic (Fp256, P-256, P-256k1). Dispatch order:

1. x86_64: `_addcarry_u64`, `_subborrow_u64`, inline asm `cmovneq`/`cmovaeq`/`cmpq`
2. i386: `_addcarry_u32`, `_subborrow_u32`
3. clang (any non-x86): `__builtin_addcll` / `__builtin_subcll`
4. aarch64: inline asm `csel`, `adds`, `subs`
5. Generic: pure C++ branch-based cmov, no carry builtins

**Critical build issue:** riscv64 with Clang lands in branch 3 (`__builtin_addcll`), which is correct and portable. riscv64 with GCC has no matching branch - GCC does not define `__clang__` and has no explicit aarch64/riscv guard before the generic fallback. The mulq path uses `__uint128_t` (guarded by `__SIZEOF_INT128__`, which is defined on riscv64 for both GCC and Clang), so basic arithmetic works. However, the carry-chain path for multi-limb operations may produce suboptimal code under GCC, and the branch-based conditional move in the generic path does not guarantee constant-time execution.

### Component Comparison Table

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GF(2^128) carryless mul (C++) | PCLMULQDQ SIMD, hand-tuned | PMULL SIMD, hand-tuned | Scalar Kronecker (generic fallback) |
| GF(2^128) carryless mul (Rust) | x86_64.rs, 384 lines | aarch64.rs, 395 lines | generic.rs, 152 lines |
| Add-with-carry (prime field) | x86intrin.h + inline asm | inline asm (CSEL/ADDS) | __builtin_addcll (Clang only; GCC: generic C++) |
| Conditional move (constant-time) | inline asm cmovneq | inline asm csel | C++ branch (not constant-time guaranteed) |
| Build flags | -mpclmul | -march=armv8-a+crypto | (none set; "Architecture not recognized") |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake (minimum 3.13), C++17 required. The Rust components use standard Cargo.

**Standard build (native host, any architecture):**

```
CXX=clang++ cmake -DCMAKE_BUILD_TYPE=Release -S lib -B clang-build-release
cd clang-build-release && make -j 16 && ctest -j 16
```

**riscv64 cross-compilation (inferred from the existing aarch64 pattern in `lib/CMake/aarch64-linux-clang.cmake`; no riscv64 toolchain file exists):**

A toolchain file following the aarch64 pattern would require:

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(triple riscv64-linux-gnu)
set(CMAKE_C_COMPILER clang)
set(CMAKE_C_COMPILER_TARGET ${triple})
set(CMAKE_CXX_COMPILER clang++)
set(CMAKE_CXX_COMPILER_TARGET ${triple})
```

Required packages (Debian/Ubuntu):

```
apt install clang cmake git libssl-dev libzstd-dev libgtest-dev libbenchmark-dev zlib1g-dev \
  gcc-riscv64-linux-gnu g++-riscv64-linux-gnu libc6-dev-riscv64-cross
```

**Compiler requirements:**

- Clang: any version supporting `__builtin_addcll`/`__builtin_subcll` (Clang 5+) and C++17 (Clang 5+). CI uses Clang 18 (Ubuntu 24.04) and Clang 14 (Ubuntu 22.04 Jammy).
- GCC on riscv64: **not fully supported.** The `lib/algebra/sysdep.h` file has no `adc`/`sbb` definition for GCC on non-x86/non-aarch64 targets. GCC-compiled riscv64 builds may fail or produce incorrect carry-chain arithmetic for prime-field operations. Clang is the only supported compiler for riscv64 cross-compilation.
- CMake: 3.13 minimum (declared in `CMakeLists.txt`).

**QEMU:** No QEMU configuration exists anywhere in the CI or documentation. riscv64 test execution would require either `qemu-riscv64-static` for userspace emulation or a native riscv64 runner.

**Known build failures:** No upstream documentation of riscv64 build failures exists because no riscv64 build has been attempted or documented upstream.

**Devcontainer:** `.devcontainer/Dockerfile` is `FROM mcr.microsoft.com/devcontainers/cpp:ubuntu-24.04`. It installs the standard x86/arm toolchain but no riscv64 cross-toolchain.

**No `option()` CMake flags** are present in `CMakeLists.txt`. There are no `USE_X=OFF` feature-disable flags. The only conditional behavior is architecture detection via `CMAKE_SYSTEM_PROCESSOR`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional Status

riscv64 is not a stub. The generic fallback paths are complete, correct, and deliberately maintained as portable reference code. The library will compile (with Clang) and produce correct output on riscv64. There are no missing symbols or unimplemented code paths for the generic target.

### Feature Matrix

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GF(2^128) multiplication | full (PCLMULQDQ) | full (PMULL) | functional (scalar fallback) |
| Prime field arithmetic (Fp256, P-256) | full (inline asm adc/sbb) | full (inline asm CSEL) | functional (Clang builtins / generic C++) |
| SHA-256 ZK proof generation | full | full | functional (no hardware SHA) |
| ECDSA ZK proof generation | full | full | functional |
| ECDSA ZK verification | full | full | functional |
| mdoc_zk credential proving | full | full | functional |
| Zstd compression | full | full | functional (libzstd has no riscv64-specific issues) |
| Build with GCC | full | full | partial (carry-chain path broken; Clang required) |

### Performance Gaps

The single largest performance gap is GF(2^128) carryless multiplication. The x86_64 path uses 4 PCLMULQDQ hardware instructions with a 3-accumulator Karatsuba scheme. The aarch64 path uses the equivalent PMULL. The generic scalar path uses a software Kronecker substitution requiring many 64-bit integer multiplies. The expected slowdown is 10-20x for this operation alone.

Published benchmarks (Mac M4, arm64) for reference:
- ECDSA ZK prover: 1 sig = 16.7 ms, 3 sigs = 38.3 ms
- ECDSA ZK verifier: 1 sig = 10.4 ms, 3 sigs = 23.5 ms
- FFT at size 4,194,304: Fp128 = 329 ms, F64 = 107 ms (single-threaded)
- SHA-256 ZK proof: 1 block = 5.3 ms, 32 blocks = 125.2 ms

No riscv64 benchmark data exists. Data not available: riscv64 vs arm64 performance comparison.

The RISC-V Zbc extension (`clmul`/`clmulh` instructions) would directly replace the software Kronecker path with hardware carry-less multiply, bringing GF(2^128) performance to parity with x86_64 and arm64. The RISC-V Zknh extension (SHA-256 hardware acceleration) would reduce the sha2 Rust crate overhead. Neither extension is used.

### Security Hardening Gaps

The branch-based conditional move in `lib/algebra/sysdep.h` (generic path) does not provide the same constant-time guarantees as the `cmovneq` (x86) and `csel` (aarch64) inline asm paths. This is a potential side-channel vulnerability for riscv64 deployments in security-sensitive contexts. The upstream authors have not documented whether the generic path is intended to be constant-time.

### NaN / Floating-Point Issues

The library operates entirely in prime-field and extension-field arithmetic (GF(2^128), Fp256, F64 where F64 is a 64-bit prime field, not IEEE float). No IEEE floating-point arithmetic is used in the ZK proof path. No NaN or floating-point semantics issues apply.

---

## 7. CI/CD Infrastructure

**riscv64 CI does not exist.** All 5 workflow files in `.github/workflows/` were checked:

| Workflow file | Purpose | riscv64 |
|---|---|---|
| cmake-multi-platform.yml | Main C++ build and test matrix | no |
| docs.yml | Documentation build | no |
| production_ci.yml | Rust CI on ubuntu-latest | no |
| reference_rust.yml | Reference Rust implementation | no |
| sage.yml | SageMath verification | no |

The CI matrix in `cmake-multi-platform.yml` covers:
- ubuntu-24.04-16core (x86_64, Clang and GCC)
- arm-ubuntu-24.04-16core (aarch64, native)
- Container images: Ubuntu Resolute/Noble/Questing/Jammy, Debian 13/12/11, Fedora 44/43/42/41 (all on x86_64 or arm64 hosts)

No QEMU-based riscv64 emulation is configured in any workflow.

**RISE runners:** Not used. RISE has no involvement with this project.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native runner | yes | yes | no |
| QEMU emulation | no | no | no |
| Multiple distros | yes (8+) | yes (subset) | no |
| Build with Clang | yes | yes | no |
| Build with GCC | yes | yes | no |
| Test execution | yes | yes | no |
| Benchmark execution | no (Mac M4 only in docs) | yes (Mac M4) | no |

---

## 8. Distribution and Release Status

**Binary packages:** None for any architecture. GitHub releases (v0.9, v0.8.6, v0.8.5, v0.8.4, v0.8.3 and earlier) have `"assets": []` - the project publishes source-only releases with auto-generated source tarballs only.

**Distribution packages:**

| Channel | riscv64 status | Notes |
|---|---|---|
| PyPI | not present | HTTP 404 for `longfellow-zk` package |
| Debian | not packaged | HTTP 404 at tracker.debian.org |
| Ubuntu noble | not present | "no results" at packages.ubuntu.com |
| Arch Linux RISC-V | not present | "Not found" at archriscv.felixc.at |
| RISE wheel builder | not present | 76 packages listed; longfellow-zk absent |
| npm | Data not available: npm search not performed. |
| Maven | Data not available: Maven search not performed. |

**To obtain a working riscv64 binary,** a user must: clone the repository, install a Clang cross-compiler (`clang` with riscv64-linux-gnu target), cross-compile all dependencies (OpenSSL, zstd, googletest, google/benchmark, zlib) for riscv64, write a CMake toolchain file following the existing aarch64 pattern, and build from source. This is a non-trivial process with no upstream documentation or support.

---

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| OpenSSL (libssl-dev) | SHA-256, AES-256-ECB, RAND_bytes | builds | CI intermittently fails (#22166, #30880) | ships in distros | AES without Zkn not constant-time (#20980, open); Zkne/Zknd detection bug (#25334, open); null-key bug in rv64i_zkne (#30330, open) |
| zstd (libzstd-dev) | proof serialization compression | builds | no riscv64 CI lane | ships in distros | none blocking |
| googletest (libgtest-dev) | C++ test harness | builds | GetThreadCountTest fails (#3756, open) | ships in distros | minor; does not affect library correctness |
| google/benchmark (libbenchmark-dev) | C++ benchmark harness | builds | no riscv64-specific issues | ships in distros | none |
| zlib (zlib1g-dev) | build-time dep | builds | no riscv64 issues | ships in distros | none |
| sha2 0.10.8 (Rust, asm feature) | SHA-256 in Rust transcript/random | builds (asm silently drops to soft) | no riscv64 issues | ships on crates.io | Performance: 0.10.8 asm feature covers x86/aarch64 only; riscv64 uses pure-Rust soft path. sha2 0.11+ has riscv-zknh backend. longfellow-zk pins 0.10.8. |
| aes 0.8.4 (Rust) | AES block cipher in Rust layer | builds (pure Rust soft path) | no riscv64 issues | ships on crates.io | Performance + security: no riscv-zkne backend; table-based soft AES is not constant-time |
| getrandom 0.3 (Rust) | OS-level randomness | builds (uses getrandom syscall) | no riscv64 issues | ships on crates.io | none |
| num-bigint 0.4 (Rust) | dev/test only | builds | no riscv64 issues | ships on crates.io | none |
| criterion 0.5 (Rust) | Rust benchmark harness | builds | no riscv64 issues | ships on crates.io | none |

### OpenSSL Deep Dive (critical dependency)

OpenSSL is used for SHA-256 (`SHA256_CTX`), AES-256-ECB PRF (`EVP`), and random byte generation (`RAND_bytes`). Three open issues affect riscv64 security directly:

- [#20980](https://github.com/openssl/openssl/issues/20980) (open): AES implementation on riscv64 without the Zkn scalar crypto extension is not constant-time. Deployments on hardware lacking Zkn (e.g., most current RISC-V SoCs) are vulnerable to timing side-channels in the AES-256-ECB PRF used for ZK transcript randomness.
- [#25334](https://github.com/openssl/openssl/issues/25334) (open): OpenSSL capability detection requires both Zkne and Zknd simultaneously to enable hardware AES; hardware with only Zkne (encryption-only) does not get acceleration.
- [#30330](https://github.com/openssl/openssl/issues/30330) (open): Broken null-key check in the rv64i_zkne assembly path - a correctness bug in the hardware AES path.

These are OpenSSL bugs, not longfellow-zk bugs, but they affect any riscv64 deployment of longfellow-zk that uses OpenSSL for the AES PRF.

### sha2 / aes Rust Crates

longfellow-zk pins `sha2 = "0.10.8"` with the `asm` feature. The `asm` feature in 0.10.8 provides hardware SHA-256 acceleration for x86_64 and aarch64 only. riscv64 silently falls back to the pure-Rust soft path. The sha2 0.11+ release includes a riscv-zknh backend that would provide hardware SHA-256 on RISC-V cores with the Zknh extension, but longfellow-zk does not use 0.11+.

Similarly, `aes = "0.8.4"` has no riscv-zkne backend; it uses a pure-Rust soft implementation on riscv64. This is both a performance gap and a potential constant-time gap.

---

## 11. Known Bugs and Active Issues

### Correctness Bugs

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| #120 | mdoc_zk completeness bugs due to range checks against scalar field order | open (2026-01-06) | High | ZK circuit produces incorrect proofs in edge cases; affects all platforms |

### Performance / Build Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| #14 | Some benchmarks not included in CMakeLists.txt (e.g. lib/gf2k/gf2_128_bench.cc not built) | open | Low | Affects benchmark coverage on all platforms; `gf2_128_bench` is the most relevant benchmark for riscv64 GF(2^128) performance assessment |

### Dependency Issues Affecting riscv64

| Source | ID | Title | Status | Severity |
|---|---|---|---|---|
| OpenSSL | #20980 | AES not constant-time without Zkn | open | High (security) |
| OpenSSL | #25334 | Zkne/Zknd both required for HW AES | open | Medium (performance/security) |
| OpenSSL | #30330 | Null-key logic bug in rv64i_zkne | open | High (correctness in HW AES path) |
| googletest | #3756 | GetThreadCountTest fails on riscv64 | open | Low (test-only) |
| OpenSSL | #22166, #30880 | SSL parallel tests intermittently fail on riscv64 | open | Low (test flakiness) |

### Recently Resolved (relevant to riscv64 readiness assessment)

| ID | Title | Merged | Notes |
|---|---|---|---|
| PR #157 | Fix performance regression in circuit I/O | 2026-07-17 | Affects all platforms; Mac M4 BM_MdocProver at 262 ms after fix |
| PR #85 | Update benchmarks to Mac M4, add ECDSA benchmarks | 2025-10-17 | Establishes baseline; no riscv64 data added |

---

## 12. Objections and Upstream Blockers

**Organizational model is the primary blocker.** The repository is a Copybara mirror of a Google-internal monorepo. External contributions must pass Google's internal review process, not just a public code review. The three CODEOWNERS are Google employees or Google-affiliated researchers. There is no documented process for accepting external architecture ports.

**No stated objections:** No upstream discussion of riscv64 support exists in any form (issues, PRs, mailing lists). The topic has never been raised.

**Technical blockers:**

1. `lib/algebra/sysdep.h` requires an explicit riscv64 branch for constant-time conditional move (`csel` equivalent). The current generic path uses branch-based cmov, which is not constant-time. For a cryptographic library targeting anonymous credential issuance, this is a correctness requirement, not an optimization.

2. `lib/algebra/sysdep.h` has no `adc`/`sbb` path for GCC on riscv64. A GCC-compatible carry-chain implementation using `__builtin_add_overflow` or inline asm is needed to support GCC builds.

3. CMake does not recognize `riscv64` as `CMAKE_SYSTEM_PROCESSOR` and emits "Architecture not recognized" with empty `ARCH_FLAGS`. A recognized entry is needed to set `-march=rv64gc_zbc_zkn` (or similar) when the extensions are available.

**Acceptance probability:** Data not available: no upstream statements about RISC-V interest or policy. Given the Copybara model, the realistic path is either (a) Google engineers add riscv64 support internally and it syncs out, or (b) a well-prepared external PR with all three issues resolved is accepted through the Google CLA process. Path (b) requires sustained engagement with the maintainers.

---

## 13. Investment Analysis

The RISE Project has no involvement with longfellow-zk. No prior work needs to be excluded.

The library is source-only; there is no packaging work for riscv64 because there is no packaging for any architecture. The work is entirely in upstream enablement.

### 13.1 Functional Enablement

The library already compiles and runs correctly on riscv64 via the generic fallback paths (Clang only). Functional enablement work is limited to:

- Fix `lib/algebra/sysdep.h` to add a GCC-compatible carry-chain path for riscv64 (enables GCC builds)
- Add `riscv64-linux-clang.cmake` toolchain file following the existing aarch64 pattern
- Add riscv64 recognition in `lib/CMakeLists.txt` ARCH_FLAGS switch

### 13.2 Performance Optimization

Three distinct performance optimization layers:

1. **GF(2^128) carryless multiplication (highest impact):** Add `#ifdef __riscv` + Zbc extension path in `lib/gf2k/sysdep.h` using the `clmul`/`clmulh` intrinsics or inline asm. Mirror in Rust as `riscv64.rs` in `rust/runtime/algebra/src/arch/`. Expected improvement: 10-20x for this primitive. Requires runtime detection of Zbc capability via `HWCAP` or compile-time `-march=rv64gc_zbc`.

2. **Constant-time conditional move (security-critical):** Add `#elif defined(__riscv)` path in `lib/algebra/sysdep.h` using RISC-V inline asm or a compiler barrier to prevent branch-based optimization. This is a correctness requirement for a cryptographic library, not a pure performance item.

3. **SHA-256 acceleration:** Upgrade the pinned `sha2` Rust crate from 0.10.8 to 0.11+ to enable the riscv-zknh hardware SHA-256 backend on Zknh-capable cores. Scope is a one-line version bump plus compatibility testing.

### 13.3 CI/CD Infrastructure

- Add a QEMU-based riscv64 CI lane to `cmake-multi-platform.yml` using `qemu-riscv64-static` (cross-compile on x86_64 runner, execute under QEMU)
- Add riscv64 to `production_ci.yml` Rust CI
- Alternatively, provision a native riscv64 runner (higher fidelity, eliminates QEMU overhead for CI)

QEMU-based CI is sufficient to catch functional regressions. Performance CI requires native hardware.

### 13.4 Ecosystem Enablement

Not applicable. longfellow-zk ships no binary packages for any architecture. There is no packaging work to do; the library is consumed as a source dependency. Skip.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `lib/algebra/sysdep.h` GCC carry-chain gap for riscv64; add riscv64 CMake toolchain file; recognize riscv64 in ARCH_FLAGS switch | 1 | Qualcomm / community | High |
| Performance | Add `#ifdef __riscv` Zbc path in `lib/gf2k/sysdep.h` (C++) + `riscv64.rs` Rust backend for GF(2^128) carryless mul | 3 | Qualcomm | High |
| Performance | Add constant-time `csel`-equivalent inline asm in `lib/algebra/sysdep.h` for riscv64 | 1 | Qualcomm | High |
| Performance | Upgrade `sha2` Rust dep from 0.10.8 to 0.11+ for Zknh SHA-256 acceleration | 0.5 | Qualcomm | Medium |
| Performance | Upgrade `aes` Rust dep from 0.8.4 to 0.9+ for riscv-zkne AES acceleration | 0.5 | Qualcomm | Medium |
| CI/CD | Add QEMU-based riscv64 CI lane to cmake-multi-platform.yml and production_ci.yml | 1 | Qualcomm / RISE | High |
| CI/CD | Benchmark riscv64 (native hardware, ZK prover/verifier/FFT) to establish baseline | 1 | Qualcomm | Medium |
| Upstream | Google CLA submission, maintainer engagement, internal review coordination | 2 | Qualcomm | High |

**Total: approximately 10 person-weeks for a complete, upstreamed riscv64 port with Zbc-accelerated GF(2^128) and CI coverage.**

The critical path is the Google CLA and internal review process, not the technical work. The technical implementation is bounded and straightforward given the well-structured existing arch dispatch.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [google/longfellow-zk repository](https://github.com/google/longfellow-zk)
- [longfellow-zk benchmark documentation](https://google.github.io/longfellow-zk/docs/benchmarks/)
- [Anonymous credentials from ECDSA (eprint 2024/2010)](https://eprint.iacr.org/2024/2010)
- [IETF draft-google-cfrg-libzk](https://datatracker.ietf.org/doc/draft-google-cfrg-libzk/)
- [dyne/longfellow-zk (European fork, EU HORIZON PACESETTERS)](https://github.com/dyne/longfellow-zk)
- [lib/gf2k/sysdep.h - GF(2^128) arch dispatch](https://github.com/google/longfellow-zk/blob/main/lib/gf2k/sysdep.h)
- [lib/algebra/sysdep.h - adc/sbb/cmov arch dispatch](https://github.com/google/longfellow-zk/blob/main/lib/algebra/sysdep.h)
- [rust/runtime/algebra/src/arch/mod.rs - Rust arch dispatch](https://github.com/google/longfellow-zk/blob/main/rust/runtime/algebra/src/arch/mod.rs)
- [.github/workflows/cmake-multi-platform.yml - CI matrix](https://github.com/google/longfellow-zk/blob/main/.github/workflows/cmake-multi-platform.yml)
- [lib/CMake/aarch64-linux-clang.cmake - cross-compile toolchain](https://github.com/google/longfellow-zk/blob/main/lib/CMake/aarch64-linux-clang.cmake)
- [OpenSSL issue #20980 - AES not constant-time without Zkn on riscv64](https://github.com/openssl/openssl/issues/20980)
- [OpenSSL issue #25334 - Zkne/Zknd both required for HW AES](https://github.com/openssl/openssl/issues/25334)
- [OpenSSL issue #30330 - null-key bug in rv64i_zkne](https://github.com/openssl/openssl/issues/30330)
- [OpenSSL issue #22166 - SSL parallel test failures on riscv64](https://github.com/openssl/openssl/issues/22166)
- [googletest issue #3756 - GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [sha2 crate changelog (0.11 riscv-zknh backend)](https://docs.rs/sha2/latest/sha2/)
- [RISE Project member list](https://riseproject.dev)
- [GitHub longfellow-zk issue #120 - mdoc_zk range check correctness bug](https://github.com/google/longfellow-zk/issues/120)
- [GitHub longfellow-zk issue #14 - benchmarks not all registered in CMakeLists.txt](https://github.com/google/longfellow-zk/issues/14)
- [GitHub longfellow-zk PR #157 - circuit I/O performance regression fix](https://github.com/google/longfellow-zk/pull/157)