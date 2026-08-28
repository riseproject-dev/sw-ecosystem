---
title: BoringSSL
parent: Project Reports
categories:
  - libraries
  - browser
  - android
---

# BoringSSL
**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for BoringSSL
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

BoringSSL is Google's internal fork of OpenSSL, created in approximately 2014 to manage Google's accumulated patch set and reduce the maintenance burden of tracking upstream OpenSSL. The project is explicitly documented as "not intended for general use" with no API or ABI stability guarantees. Google makes all design decisions internally and updates all downstream consumers (Chrome, Android) on its own schedule.

**Governance:** No foundation affiliation. Google unilaterally controls the project. Code review occurs on Gerrit at [boringssl-review.googlesource.com](https://boringssl-review.googlesource.com). Bug tracking is on the Chromium issue tracker at [issues.chromium.org](https://issues.chromium.org), which requires Google authentication for most operations. The GitHub repository at [google/boringssl](https://github.com/google/boringssl) is a read-only mirror; it has `has_issues: false` and accepts no GitHub pull requests.

**Corporate maintainers:** All identified committers are Google employees:
- David Benjamin (davidben@google.com) - most active maintainer, handles X.509, TLS, PEM, reviews most external patches
- Adam Langley - original author, still active on ACVP/testing
- Xiangfei Ding - active on Rust/bssl-tls, P-256 assembly
- Rudolf Polzer - P-256 assembly, X.509
- Lily Chen - TLS handshake hints

**Community posture on new ports:** BoringSSL accepts minimally-invasive porting fixes from external contributors but does not prioritize new architecture work internally. The RISC-V port evidence (one external cleanup commit from StarFive with no follow-up assembly work from any party) confirms this posture. The `BUILDING.md` documents assembly support for x86, x86_64, ARM, and AArch64; all other architectures are implicitly generic C with no tier commitment or explicit mention. RISE membership: Google is a Premier Member of RISE, but BoringSSL is not listed as a RISE-supported project. A full review of all 27 RISE blog posts (May 2024 through June 2026) found zero mentions of BoringSSL. No RISE-funded patches, RFPs, or repositories for BoringSSL exist.

---

## 2. Port History and Upstreaming Timeline

All six RISC-V-related commits are on the main branch (no outstanding patches awaiting upstream acceptance). The port is fully upstreamed in the sense that there are no pending patches, but the port is a minimal compilation enablement with no optimization work.

| Date | Event | Source |
|---|---|---|
| 2021-02-25 | First RISC-V commit: `include/openssl/base.h` adds `#if defined(__riscv)` block setting `OPENSSL_32_BIT` or `OPENSSL_64_BIT`. Reviewed by David Benjamin and Adam Langley. | [commit 565226278d](https://github.com/google/boringssl/commit/565226278d6b863672bb5c3f24197d8bb6e58b50) |
| 2022-06-08 | Primary port commit: CMakeLists.txt and base.h updated for riscv64; adds `OPENSSL_RISCV64` identity macro. Author: Rebecca Chang Swee Fun (StarFive Technology). Reviewer: Adam Langley. | [commit 4566bb5fe5](https://github.com/google/boringssl/commit/4566bb5fe517f7f141b5fe935c559fc4311af35d) |
| 2022-08-02 | `NR_getrandom` syscall number (278) defined for riscv64 in `crypto/fipsmodule/rand/getrandom_fillin.h`, required for Android Keystore key generation on riscv64. Authors: Liu Cunyuan, Mao Han (Alibaba Linux). Reviewer: David Benjamin. | [commit 45aadce331](https://github.com/google/boringssl/commit/45aadce3311b6ed765fae4d7bdfa17a9a809623b) |
| 2022-08-24 | Header cleanup: consolidates duplicate `__riscv` detection blocks in `include/openssl/base.h`. Author: Rebecca Chang Swee Fun (StarFive Technology). Reviewer: David Benjamin. | [commit b2d3c10cdc](https://github.com/google/boringssl/commit/b2d3c10cdc8fb642a842db2c6061743b4604b0b5) |
| 2024-07-09 | `--qemu` flag added to `util/all_tests.go`, enabling QEMU user-mode test execution. Commit message states "no native RISC-V hardware available." Tests take approximately 20 minutes under qemu-riscv64. | [commit 8934b1ef08](https://github.com/google/boringssl/commit/8934b1ef0857bc08626a2206a6f5f718942c14fc) |
| 2024-08-17 | CIPD dependency on qemu-static (version 10.0.8) added for riscv64 checkouts, wiring QEMU into Google's internal CI toolchain bootstrap. References Chromium bug 342657857 (authentication-gated). | [commit f64d50dcd5](https://github.com/google/boringssl/commit/f64d50dcd59e1758d4472fe2c6f5a717288f2138) |

**Key contributors by organization:**
- StarFive Technology: Rebecca Chang Swee Fun (initial port + cleanup)
- Alibaba Linux: Liu Cunyuan, Mao Han (getrandom syscall)
- Google (unidentified): QEMU test runner and CI wiring

No RISC-V assembly contributions have been made by any organization.

---

## 3. Upstream Support Tier

BoringSSL has no published platform tier policy. The `BUILDING.md` documents four architectures (x86, x86_64, ARM, AArch64) as having assembly support; all others are undocumented.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compilation CI | Yes (multiple builders) | Yes (multiple builders) | Yes (Android cross-compile only) |
| Test execution CI | Yes | Yes | No (compile-only) |
| CI gate on commit | Yes | Yes | Yes (compile-only) |
| Assembly optimizations | Yes (x86_64, 23 asm files) | Yes (aarch64, 15 asm files) | No (0 asm files) |
| Official binary releases | No (source-only) | No (source-only) | No (source-only) |
| FIPS build support | Yes | Yes | No (FIPS module rejects riscv64) [NEEDS VERIFICATION] |
| Documented in BUILDING.md | Yes | Yes | No |
| Named support tier | None published | None published | None published |

The riscv64 CI consists of two mandatory, commit-gated LUCI builders (`android_riscv64_compile_only` and `android_riscv64_prefixed_compile`) that verify Android NDK cross-compilation on every commit to `refs/heads/main`. Both appear in `infra/config/generated/commit-queue.cfg` without the `includable_only` flag, making them required CQ gates. Neither runs tests.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

BoringSSL's performance-critical code consists of hand-tuned assembly for cryptographic primitives (AES, SHA, ChaCha20, elliptic curve operations, big-number arithmetic) and CPU feature detection to dispatch between implementations at runtime.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AES / AES-NI | Hand-tuned (15 BCM asm files for x86_64) | Hand-tuned (ARMv8 crypto extension) | Scalar C fallback (`aes_nohw`) |
| AES-GCM / GHASH | Hand-tuned (CLMUL, AVX) | Hand-tuned (pmull) | Scalar C fallback (`gcm_nohw`) |
| SHA-1 / SHA-256 / SHA-512 | Hand-tuned (SHA-NI, AVX2) | Hand-tuned (ARMv8 SHA ext) | Scalar C fallback |
| BigNum / Montgomery mult | Hand-tuned (ADX, mulx) | Hand-tuned | Scalar C fallback |
| P-256 (ECDSA/ECDH) | Hand-tuned (fiat ADX) | Hand-tuned | Scalar C fallback (generic fiat `p256_64.h`) |
| ChaCha20 | Hand-tuned (AVX, AVX2) | Hand-tuned (NEON) | Scalar C fallback |
| ChaCha20-Poly1305 | Hand-tuned | Hand-tuned | Scalar C fallback |
| Curve25519 (X25519/Ed25519) | Hand-tuned (fiat ADX) | Partial (arm asm) | Scalar C fallback (generic `curve25519_64.h`) |
| CPU feature detection | `crypto/cpu_intel.cc` | `crypto/cpu_aarch64_*.cc` (6 files) | None (no `cpu_riscv*.cc`) |
| RVV / RISC-V vector extensions | N/A | N/A | Not implemented |
| Zvkn / Zvksed / Zvksh (RISC-V crypto extensions) | N/A | N/A | Not implemented |

The `OPENSSL_RISCV64` macro is defined in `include/openssl/target.h` but has no downstream consumers in the current codebase. There is no dispatch infrastructure for RISC-V ISA extensions (Zvkb, Zkn, Zknd, Zkne, Zk) and no `<riscv_vector.h>` usage anywhere in the tree. The `gen/sources.json` canonical build file contains zero riscv entries; this was verified directly.

For comparison: OpenSSL has had extensive Zvk vector-crypto assembly since 2023 per the OpenSSL status report at `./libraries/openssl.md`. BoringSSL has none.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Required tools:**
- CMake >= 3.22 (CI uses 3.31.11 via CIPD `version:3@3.31.11.chromium.8`)
- Ninja (recommended) or Make
- C11 / C++17 compiler: GCC 6.1+ or recent Clang
- Go (most recent stable) -- for test tooling only
- Android NDK r29 (Chromium fork, CIPD package `infra/3pp/tools/android_ndk/linux-amd64 version:3@r29.chromium.1`) for Android cross-compilation

**Android cross-compilation (the only CI-verified path):**

Builder 1 (`android_riscv64_compile_only`, targets Android API 35):
```
cmake -GNinja -B build \
  -DCMAKE_TOOLCHAIN_FILE=${ANDROID_NDK}/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=riscv64 \
  -DANDROID_PLATFORM=android-35 \
  -DCMAKE_BUILD_TYPE=Release
ninja -C build
```

Builder 2 (`android_riscv64_prefixed_compile`, targets Android API 24):
```
cmake -GNinja -B build \
  -DCMAKE_TOOLCHAIN_FILE=${ANDROID_NDK}/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=riscv64 \
  -DANDROID_PLATFORM=android-24 \
  -DBORINGSSL_PREFIX=MY_CUSTOM_PREFIX
ninja -C build
```

Note: Builder 2 includes `-DANDROID_ARM_MODE=arm`, which is a copy-paste artifact with no effect on a riscv64 target.

**Native Linux riscv64 (no upstream-provided configuration):**

No `CMakeLists.txt` references to riscv exist. No upstream toolchain file for Linux riscv64 cross-compilation is provided. The correct approach, mirroring `util/32-bit-toolchain.cmake`, is:
```
cmake -B build \
  -DCMAKE_TOOLCHAIN_FILE=<user-provided riscv64-linux-gnu toolchain file> \
  -DCMAKE_BUILD_TYPE=Release \
  -GNinja
ninja -C build
```
Since no riscv64 assembly backend exists, no `-DOPENSSL_NO_ASM=1` flag is required; there are simply no riscv64 `.S` files to include.

**QEMU:** qemu-static 10.0.8 is available as a CIPD dependency (`infra/3pp/tools/qemu_static/linux-amd64 version:3@10.0.8+ds-0+deb13u1+b1`) but is gated by `checkout_riscv64: False` in `util/bot/DEPS` and is not wired into either CI builder. The `--qemu` flag in `util/all_tests.go` enables local test execution under QEMU; tests take approximately 20 minutes per the commit message.

**Known build failures:** None reported for the compile-only Android path. For native Linux riscv64 builds, no upstream tracking exists.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| AES-GCM hardware acceleration | Yes | Yes | No | Performance |
| SHA hardware acceleration | Yes | Yes | No | Performance |
| ChaCha20-Poly1305 SIMD | Yes | Yes | No | Performance |
| P-256 optimized field arithmetic | Yes | Yes | No | Performance |
| Curve25519 ADX implementation | Yes | Partial | No | Performance |
| CPU feature detection at runtime | Yes | Yes | No | Architecture |
| FIPS module build | Yes | Yes | No [NEEDS VERIFICATION] | Functional |
| getrandom() syscall | Yes | Yes | Yes (fixed 2022) | Resolved |
| Compilation without errors | Yes | Yes | Yes | Resolved |
| Test suite execution in CI | Yes | Yes | No | Infrastructure |

**Performance gap magnitude:** Data not available: no public benchmark comparing BoringSSL riscv64 vs arm64 or amd64 throughput (MB/s or ops/sec for AES-GCM, ChaCha20-Poly1305, SHA256, RSA, or ECDSA) exists in any publicly accessible source. The absence of any riscv64 assembly means the gap relative to arm64 and amd64 is determined entirely by the scalar C fallback performance of each primitive. Scalar AES (`aes_nohw`) is broadly understood to be significantly slower than hardware-accelerated paths, but no measured riscv64 figures are available from this research.

**Security hardening gaps:** No RISC-V-specific constant-time or side-channel hardening exists. The generic C fallback paths are used for all operations. The `OPENSSL_RISCV64` macro defined in `target.h` is unused in any crypto dispatch guard, so no riscv64-specific mitigations can be conditionally compiled in. This is equivalent to the posture on MIPS and LoongArch.

---

## 7. CI/CD Infrastructure

BoringSSL's primary CI runs on Google's LUCI infrastructure (ci.chromium.org), not GitHub Actions. The `.github/workflows/branch-time.yml` file is solely a mirror-staleness checker (runs on `ubuntu-latest` x86, checks sync lag between the GitHub mirror and `boringssl.googlesource.com`) and contains zero architecture-related jobs.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI system | LUCI (Google) | LUCI (Google) | LUCI (Google) |
| Compilation verified | Yes | Yes | Yes (Android NDK cross-compile) |
| Unit tests run | Yes | Yes | No |
| SSL tests run | Yes | Yes | No |
| Native hardware runner | Yes | Yes | No |
| QEMU-based test execution | N/A | N/A | Supported via `--qemu` flag; not wired into CI builders |
| CQ gate (commit-blocking) | Yes | Yes | Yes (compile-only) |
| GitHub Actions | Not primary | Not primary | Not applicable |
| RISE-provided runners | No | No | No |

The two riscv64 LUCI builders (`boringssl/try/android_riscv64_compile_only` and `boringssl/try/android_riscv64_prefixed_compile`) both appear in `infra/config/generated/commit-queue.cfg` without the `includable_only` flag, confirming they are mandatory CQ gates. Both run on `os:Ubuntu-24.04`, `cpu:x86-64` (cross-compilation hosts, not native riscv64 runners). Both have `run_ssl_tests:false` and `run_unit_tests:false`.

The CIPD toolchain for QEMU (qemu-static 10.0.8) is available in `util/bot/DEPS` behind the `checkout_riscv64: False` flag. Enabling this flag and wiring it into a CI builder would enable QEMU-based test execution, but no such builder has been created.

---

## 8. Distribution and Release Status

BoringSSL distributes no pre-compiled binaries through any channel. The project ships no versioned releases with binary artifacts; consumers are expected to vendor the source and compile it. GitHub releases for `google/boringssl` contain only auto-generated source tarballs.

| Distribution channel | riscv64 availability | Notes |
|---|---|---|
| github.com/google/boringssl releases | No | Source tarballs only; no architecture-specific binary artifacts |
| PyPI | No | No `boringssl` package exists on PyPI (HTTP 404) |
| RISE wheel builder | No | Redirects to PyPI (HTTP 404); 76-package list does not include BoringSSL |
| Debian sid (android-platform-external-boringssl) | Yes (qualified) | `android-libboringssl` 14.0.0+r45-3+b2 available for riscv64; this is the Android fork, not upstream BoringSSL |
| Ubuntu 24.04 (noble) | Yes (qualified) | `android-libboringssl` at 14.0.0+r11-4build1 for riscv64; same Android fork caveat |
| Standalone Debian package named `boringssl` | No | No such package exists in Debian |
| Arch Linux RISC-V (archriscv.felixc.at) | Not packaged | Query returned zero results |
| openSUSE / NixOS / FreeBSD | Unknown | No riscv64 build status data accessible from this research |

The Debian `android-platform-external-boringssl` source package builds `android-libboringssl` (610,880 bytes) for riscv64, built on host `rv-manda-02`. The `lld` build dependency does not list riscv64 in its architecture constraints (stops at `amd64 arm64 armel armhf i386 mips64el mipsel ppc64el`), suggesting a workaround or fallback linker was used [NEEDS VERIFICATION]. The `android-libboringssl-dbgsym` package for riscv64 is on version `13.0.0+r24-3` on Debian ports infrastructure, lagging the main archive version by one upstream release - indicating riscv64 is not a Tier-1 architecture even for this fork.

**What a user must do to get a working binary on riscv64:** Build from source using the cross-compilation approach described in Section 5, or install `android-libboringssl` from Debian/Ubuntu (Android fork only).

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| google/benchmark (vendored `third_party/benchmark`) | Microbenchmark harness for perf tests | Yes | Yes (past bugs fixed: CPU freq #1549 Feb 2023, type conversion #1802 Jun 2024) | Yes (cibuildwheel riscv64 active) | None known |
| google/googletest (vendored `third_party/googletest`) | Unit test framework | Yes | Partial -- `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (issue #3756, open since Feb 2022, labeled "not planned") | Yes | Open bug #3756 (thread count API); low impact for BoringSSL test coverage |
| fiat-crypto (vendored `third_party/fiat`) | Formally-verified finite-field arithmetic for Curve25519 and P-256 | Yes (generic C: `curve25519_64.h`, `p256_64.h`) | No riscv64-specific issues filed | N/A (data only) | No RISC-V assembly exists; pure-C path functional |
| wycheproof test vectors (vendored `third_party/wycheproof_testvectors`) | Known-answer cryptographic test vectors | N/A (JSON data) | N/A (JSON data) | N/A (JSON data) | None |
| libunwind (optional, system dep, non-Android) | Stack unwinding for sanitizer/profiling builds | Yes | C++ exception handling unreliable on riscv64 Linux (issue #531 closed "not planned"; PR #1032 open to disable C++ exceptions on RISC-V by default). FreeBSD 15 riscv64 incomplete (issue #857 open). | Partial | Not a blocker -- BoringSSL compiles with `-fno-exceptions -fno-rtti` universally |
| Threads / pthreads (system dep) | Thread synchronization | Yes | Yes | Ships in glibc and musl for riscv64 | None |
| golang.org/x/crypto (Go module, build tooling only) | Go crypto used by delocate, inject_hash tools (not C library runtime) | Yes (pure Go) | No riscv64 issues | Released | None |
| filippo.io/edwards25519 (Go module, build tooling only) | Edwards curve arithmetic in Go build tools (not C library runtime) | Yes (pure Go) | No riscv64 issues | Released | None |

No dependency blocks BoringSSL from building or running on riscv64. The googletest thread count bug (#3756) does not affect cryptographic test coverage. The libunwind C++ exception issue does not affect BoringSSL due to its `-fno-exceptions` build policy.

---

## 11. Known Bugs and Active Issues

No RISC-V-related issues exist in either the GitHub mirror (`google/boringssl`, which has `has_issues: false`) or the Chromium issue tracker component for BoringSSL. Zero open or closed issues mentioning riscv, riscv64, or RISC-V were found through any accessible search path.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| Chromium bug 342657857 | Unknown (authentication-gated) | Unknown | Unknown | Referenced by commit `f64d50dcd5`; likely the tracking issue for riscv64 CI toolchain setup; content inaccessible without Google authentication |

No correctness bugs, no performance regression reports, no FIPS build failures for riscv64 are publicly visible. The absence of a public tracker makes it impossible to confirm there are no undisclosed issues; all BoringSSL bug tracking is authentication-gated.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None publicly visible. The project does not solicit external contributors and has no public forum where objections to RISC-V work would be recorded.

**Technical blockers:**
- No CPU feature detection infrastructure for RISC-V. Adding RVV or Zvkn acceleration requires building `crypto/cpu_riscv.cc` (analogous to `cpu_aarch64_linux.cc`) to query the kernel for ISA extension support at runtime. This is prerequisite work before any assembly can be conditionally dispatched.
- No perlasm or assembly generation infrastructure for RISC-V. BoringSSL's assembly is generated via Perl scripts (perlasm); `build.json` defines perlasm targets only for `aarch64`, `arm`, `x86`, and `x86_64`. Adding riscv64 requires a new perlasm flavor or direct `.S` file authoring.
- FIPS module build status on riscv64 is unverified (authentication-gated). The FIPS module imposes additional constraints on assembly integrity checking that may reject riscv64 [NEEDS VERIFICATION].

**Organizational blockers:**
- Google controls all merge decisions. External patches require Gerrit review by Google employees. The StarFive and Alibaba contributions (2022) demonstrate that Google accepts correctness fixes from external contributors, but no external party has submitted RISC-V assembly to any project using Gerrit-based review at comparable scope.
- The project explicitly disclaims any commitment to external use. Any contribution that adds maintenance burden (e.g., a riscv64 assembly backend requiring ongoing correctness review) would need a strong justification and a committed external maintainer.
- Chromium bug 342657857 (inaccessible) may contain internal Google roadmap information; without access, the internal priority of riscv64 work is unknown.

**Acceptance probability for assembly contributions:** Moderate, given the precedent of StarFive and Alibaba contributions being accepted. The key requirement is a committed external maintainer willing to own the riscv64 assembly path and respond to review feedback. Google will not own the RISC-V assembly; the contributor organization must.

---

## 13. Investment Analysis

RISE has no existing BoringSSL RISC-V investment to account for. All work described below is unaddressed as of June 2026.

### 13.1 Functional Enablement

The basic compilation port is complete (2021-2022). One functional gap remains: the `getrandom` syscall number was fixed (2022), but FIPS module build support for riscv64 is unverified. If FIPS certification is required for the target use case, investigation and potential fixes are needed.

### 13.2 Performance Optimization

All crypto primitives use scalar C fallback. This is the primary gap relative to arm64 and amd64. Priority targets:

- **AES-GCM with Zvkn (RISC-V AES and GHASH extensions):** Highest impact. AES-GCM is the dominant cipher in TLS 1.3. The RISC-V Zvkn extension provides hardware AES and GHASH acceleration directly comparable to ARMv8 crypto extension.
- **ChaCha20-Poly1305 with RVV or scalar optimization:** Second highest impact. Used as TLS fallback and in certificate operations.
- **SHA-256 / SHA-512 with Zvksh:** Required for certificate verification throughput.
- **P-256 / Curve25519 field arithmetic with scalar optimization:** Moderate impact. The fiat-crypto C path is already well-optimized; assembly gains here are smaller than for symmetric crypto.
- **CPU feature detection (`crypto/cpu_riscv.cc`):** Zero-impact on performance directly, but is a prerequisite for all runtime dispatch work above.

### 13.3 CI/CD Infrastructure

Two compile-only CI builders exist and are commit-gated. The gap is test execution. QEMU 10.0.8 is already in the CIPD toolchain (`util/bot/DEPS`) behind `checkout_riscv64: False`. Enabling test execution requires flipping that flag and adding `run_unit_tests:true` / `run_ssl_tests:true` to the CI builder definition -- low-effort infrastructure work, but requires Google's cooperation to merge the LUCI config change.

### 13.4 Ecosystem Enablement

BoringSSL has no dependent package ecosystem in the sense of Section 10 (no PyPI packages, no npm packages, no Maven JARs). Downstream consumers (Chrome, Android) are Google-owned. No ecosystem enablement work applies here.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | FIPS module riscv64 build investigation and fix (if broken) | 2-4 | Contributor org | High |
| Functional | CPU feature detection (`crypto/cpu_riscv.cc`) for Zvkn/RVV dispatch | 2-3 | Contributor org | High (prerequisite for Performance items) |
| Performance | AES / AES-GCM with Zvkn (`Zknd`, `Zkne`, `Zknh` + `Zvkg` for GHASH) | 6-10 | Contributor org | Critical |
| Performance | ChaCha20-Poly1305 with RVV or scalar optimization | 4-6 | Contributor org | High |
| Performance | SHA-256 / SHA-512 with Zvksh | 3-5 | Contributor org | High |
| Performance | P-256 / Curve25519 scalar or vector field arithmetic | 4-8 | Contributor org | Medium |
| CI/CD | Enable QEMU-based test execution in LUCI builders (`checkout_riscv64: True`, tests enabled) | 1-2 | Google (LUCI config) | High |
| CI/CD | Native riscv64 hardware runner in LUCI Swarming | 2-4 | Google (infra) | Medium |

Total estimated contributor-owned effort: 22-38 person-weeks for full functional and performance parity with arm64. Google infrastructure work (CI enablement) is low-effort but requires Google's cooperation to merge. The critical path is: CPU feature detection -> AES-GCM assembly -> CI test enablement -> remaining symmetric crypto.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [commit 565226278d - Compile for RISC-V (2021-02-25)](https://github.com/google/boringssl/commit/565226278d6b863672bb5c3f24197d8bb6e58b50)
- [commit 4566bb5fe5 - Add support for RISC-V 64-bit architecture (2022-06-08)](https://github.com/google/boringssl/commit/4566bb5fe517f7f141b5fe935c559fc4311af35d)
- [commit 45aadce331 - Define NR_getrandom for riscv64 (2022-08-02)](https://github.com/google/boringssl/commit/45aadce3311b6ed765fae4d7bdfa17a9a809623b)
- [commit b2d3c10cdc - Clean up header to reuse __riscv definition (2022-08-24)](https://github.com/google/boringssl/commit/b2d3c10cdc8fb642a842db2c6061743b4604b0b5)
- [commit 8934b1ef08 - Add QEMU user option for running tests (2024-07-09)](https://github.com/google/boringssl/commit/8934b1ef0857bc08626a2206a6f5f718942c14fc)
- [commit f64d50dcd5 - riscv64 Add qemu-static CIPD dependency (2024-08-17)](https://github.com/google/boringssl/commit/f64d50dcd59e1758d4472fe2c6f5a717288f2138)
- [include/openssl/target.h - RISC-V architecture detection macros](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/include/openssl/target.h)
- [gen/sources.cmake - canonical assembly source list (zero riscv entries)](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/gen/sources.cmake)
- [infra/config/generated/cr-buildbucket.cfg - riscv64 LUCI builder definitions](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/infra/config/generated/cr-buildbucket.cfg)
- [infra/config/generated/commit-queue.cfg - riscv64 CQ gate configuration](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/infra/config/generated/commit-queue.cfg)
- [util/bot/DEPS - Android NDK r29 and QEMU 10.0.8 CIPD dependencies](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/util/bot/DEPS)
- [BUILDING.md - build prerequisites and supported platforms](https://raw.githubusercontent.com/google/boringssl/master/BUILDING.md)
- [Debian package android-libboringssl riscv64 download](https://packages.debian.org/sid/riscv64/android-libboringssl/download)
- [Ubuntu 24.04 android-boringssl package (riscv64)](https://packages.ubuntu.com/search?keywords=boringssl&suite=noble)
- [googletest issue #3756 - GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [libunwind issue #531 - C++ exception handling on riscv64 Linux](https://github.com/libunwind/libunwind/issues/531)
- [RISE Project member list](https://riseproject.dev)
- [BoringSSL upstream Gerrit code review](https://boringssl-review.googlesource.com)