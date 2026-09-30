---
title: BoringSSL
parent: Project Reports
color: yellow
dependencies:
  - name: fiat-crypto
    relation: runtime-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: benchmark
    relation: test-dependency
    criticality: optional
  - name: libunwind
    relation: runtime-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Bazel
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: Go
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: Android NDK
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="boringssl" %}

# BoringSSL

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for BoringSSL<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

BoringSSL is Google's internal fork of OpenSSL, created in approximately 2014 to manage Google's accumulated patch set and reduce the maintenance burden of tracking upstream OpenSSL. The project is explicitly documented as "not intended for general use" with no API or ABI stability guarantees. Google makes all design decisions internally and updates all downstream consumers (Chrome, Android) on its own schedule. There is no `MAINTAINERS.md` file at the repository root (confirmed by direct fetch, HTTP 404); maintainer identity has to be inferred from Gerrit/commit review history.

**Governance:** No foundation affiliation and no formal governance model or license statement on the project landing page. Google unilaterally controls the project. Code review occurs on Gerrit at [boringssl-review.googlesource.com](https://boringssl-review.googlesource.com). Bug tracking is on the Chromium issue tracker at [issues.chromium.org](https://issues.chromium.org), which requires Google authentication for most operations; security issues are routed through "the Chromium process." The GitHub repository at [google/boringssl](https://github.com/google/boringssl) is a read-only mirror; it has `has_issues: false` and accepts no GitHub pull requests.

**Corporate maintainers:** All identified committers are Google employees:
- David Benjamin (davidben@google.com) - most active maintainer, handles X.509, TLS, PEM, reviews most external patches
- Adam Langley - original author, authored the first RISC-V detection commit (2021-02-25), still active on ACVP/testing
- Xiangfei Ding - active on Rust/bssl-tls, P-256 assembly
- Rudolf Polzer - P-256 assembly, X.509
- Lily Chen - TLS handshake hints

**Community posture on new ports:** BoringSSL accepts minimally-invasive porting fixes from external contributors but does not prioritize new architecture work internally. The RISC-V port evidence (one external port commit from StarFive plus a header cleanup, and one syscall fix from Alibaba, with no follow-up assembly work from any party) confirms this posture. Internal Google interest in riscv64 assembly does exist but is unactioned: [google/android-riscv64 issue #36](https://github.com/google/android-riscv64/issues/36) ("external/boringssl: optimization"), opened February 2023 by Elliott Hughes (enh-google, Android bionic/toolchain maintainer at Google), states BoringSSL has no RISC-V assembler, references the "riscv-crypto v1.0.1-scalar" release, and argues effort should go straight to RISC-V vector-crypto instructions (Zvk*) rather than scalar ones, noting that equivalent patches were already upstreamed to OpenSSL. The issue has zero comments, no assignee, and no linked Gerrit CL as of this report.

The `BUILDING.md` documents assembly support for x86, x86_64, ARM, and AArch64; all other architectures are implicitly generic C with no tier commitment or explicit mention.

**RISE membership and involvement:** Google is a Premier Member of RISE (Linux Foundation-hosted), alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent (Premier tier); General members include Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software Chinese Academy of Sciences, Microchip, NextSilicon, Quintauris, SpacemiT, and ZTE. BoringSSL is not named anywhere on [riseproject.dev](https://riseproject.dev) or its members page, and is not listed as a RISE-supported project. A full review of all 35 RISE blog posts (May 2024 through September 2026, riseproject.dev/blog) found zero mentions of BoringSSL in any title or summary. No riseproject-dev GitHub organization repository is named or scoped to BoringSSL (an org-scoped GitHub search for "boringssl" under `riseproject-dev` returns zero results), and BoringSSL's own CI runs exclusively on Google's LUCI infrastructure with no RISE-provided runner usage. No RISE-funded patches or RFPs targeting BoringSSL exist. The only identified touchpoint is indirect: BoringSSL appears as a transitively statically-linked C++ dependency (pulled in via Bazel/`google-cloud-cpp`, `abseil-cpp`, and `grpc`) inside two unrelated Python wheels built by RISE's [python-wheels](https://github.com/riseproject-dev/python-wheels) project for riscv64 - `ydf` ([PR #2416](https://github.com/riseproject-dev/python-wheels/pull/2416)) and `runai-model-streamer-gcs` ([PR #2406](https://github.com/riseproject-dev/python-wheels/pull/2406)) - meaning RISE has compiled BoringSSL for riscv64 as an incidental build artifact, not as a funded or tracked BoringSSL work item. BoringSSL itself does not appear as a standalone package on the RISE Python wheel builder ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/), 89 packages listed as of this check; confirmed absent).

---

## 2. Port History and Upstreaming Timeline

Six RISC-V-related commits are merged to the main branch. Contrary to a "no outstanding patches" characterization, one trivial riscv64 detection patch remains formally open and unmerged in Gerrit: [CL 52485](https://boringssl-review.googlesource.com/c/boringssl/+/52485) ("Add detection for the riscv64 arch"), filed by external contributor Peter Membrey on 2022-05-10, a 2-line CMake `ARCH` detection patch with zero reviewer engagement in over three years (its only subsequent event is a 2025-01-22 automated master-to-main branch rename, not a review). It was never formally abandoned, but its functionality was independently re-implemented and merged as part of the real port (commit `4566bb5fe5`, below), leaving it an orphaned, functionally dead duplicate.

| Date | Event | Source |
|---|---|---|
| 2021-02-25 | First RISC-V commit: `include/openssl/base.h` adds `#if defined(__riscv)` block setting `OPENSSL_32_BIT` or `OPENSSL_64_BIT`. Author: Adam Langley (Google). Reviewed by David Benjamin. | [commit 565226278d](https://github.com/google/boringssl/commit/565226278d6b863672bb5c3f24197d8bb6e58b50) |
| 2022-06-08 | Primary port commit: CMakeLists.txt and base.h updated for riscv64; adds `OPENSSL_RISCV64` identity macro. Author: Rebecca Chang Swee Fun (StarFive Technology). Reviewer: Adam Langley. | [commit 4566bb5fe5](https://github.com/google/boringssl/commit/4566bb5fe517f7f141b5fe935c559fc4311af35d) |
| 2022-08-02 | `NR_getrandom` syscall number (278) defined for riscv64 in `crypto/fipsmodule/rand/getrandom_fillin.h`, required for Android Keystore key generation on riscv64. Authors: Liu Cunyuan, Mao Han (Alibaba Linux). Reviewer: David Benjamin. Gerrit: [CL 53765](https://boringssl-review.googlesource.com/c/boringssl/+/53765). | [commit 45aadce331](https://github.com/google/boringssl/commit/45aadce3311b6ed765fae4d7bdfa17a9a809623b) |
| 2022-08-24 | Header cleanup: consolidates duplicate `__riscv` detection blocks in `include/openssl/base.h`. Author: Rebecca Chang Swee Fun (StarFive Technology). Reviewer: David Benjamin. | [commit b2d3c10cdc](https://github.com/google/boringssl/commit/b2d3c10cdc8fb642a842db2c6061743b4604b0b5) |
| 2024-05-13 | Adds the two mandatory, compile-only riscv64 Android LUCI CI builders described in Section 7. Author: Aaron Knobloch (Google), reviewed by David Benjamin (3 patch sets, ~10 review comments, one failed tryjob dry run). Lands on the `infra/config` branch, not the source branch release tags are cut from. Gerrit: [CL 68267](https://boringssl-review.googlesource.com/c/boringssl/+/68267). | [commit 86c417e80f](https://boringssl.googlesource.com/boringssl/+/86c417e80f0315d345bb07226fabfa440cd09f86) |
| 2024-07-09 | `--qemu` flag added to `util/all_tests.go`, enabling QEMU user-mode test execution. Commit message states "no native RISC-V hardware available." Tests take approximately 20 minutes under qemu-riscv64. Gerrit: [CL 68887](https://boringssl-review.googlesource.com/c/boringssl/+/68887). | [commit 8934b1ef08](https://github.com/google/boringssl/commit/8934b1ef0857bc08626a2206a6f5f718942c14fc) |
| 2024-08-17 | CIPD dependency on qemu-static (version 10.0.8) added for riscv64 checkouts, wiring QEMU into Google's internal CI toolchain bootstrap. References Chromium bug 342657857 (authentication-gated). Gerrit: [CL 70273](https://boringssl-review.googlesource.com/c/boringssl/+/70273). | [commit f64d50dcd5](https://github.com/google/boringssl/commit/f64d50dcd59e1758d4472fe2c6f5a717288f2138) |

BoringSSL has no formal versioning policy; consumers are told to pin a commit, not a version. The `0.YYYYMMDD.0` tag scheme only begins 2024-09-13, so every commit above merged before that date shares the same earliest tag (`0.20240913.0`) as an ancestor, not because that tag specifically introduced it.

**Key contributors by organization:**
- Google: Adam Langley (first riscv detection macro, 2021-02-25); Aaron Knobloch (riscv64 CI builders, CL 68267); QEMU test runner and CI wiring (remaining authors unidentified)
- StarFive Technology: Rebecca Chang Swee Fun (initial port + header cleanup)
- Alibaba Linux: Liu Cunyuan, Mao Han (getrandom syscall)
- External, non-affiliated: Peter Membrey (CL 52485, open, unreviewed, functionally superseded)

No RISC-V assembly contributions have been made by any organization. No Gerrit changes for RVV/Zvkn/vector-crypto assembly exist (query `rvv OR zvkn OR vector riscv` against the Gerrit REST API returns zero results).

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
| FIPS build support | Yes | Yes | No [NEEDS VERIFICATION] - authentication-gated Chromium tracker prevents confirmation |
| Documented in BUILDING.md | Yes | Yes | No |
| Named support tier | None published | None published | None published |

The riscv64 CI consists of two mandatory, commit-gated LUCI builders (`android_riscv64_compile_only` and `android_riscv64_prefixed_compile`) that verify Android NDK cross-compilation on every commit to `refs/heads/main`. Both appear in `infra/config/generated/commit-queue.cfg` without the `includable_only` flag, making them required CQ gates, and both are wired to the `main-gitiles-trigger` in `infra/config/generated/luci-scheduler.cfg`, confirming they run automatically and are not dormant configuration. Neither runs tests.

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
| Perlasm / assembly-generation infra | Yes (`perlasm_x86_64` target) | Yes (`perlasm_aarch64` target) | Missing (no `perlasm_riscv64` target in `build.json`) |
| RVV / RISC-V vector extensions | N/A | N/A | Not implemented |
| Zvkn / Zvksed / Zvksh (RISC-V crypto extensions) | N/A | N/A | Not implemented |

The `OPENSSL_RISCV64` macro is defined in `include/openssl/target.h` purely as `#elif defined(__riscv) && __SIZEOF_POINTER__ == 8`, an architecture-detection macro with no downstream dispatch consumers anywhere in the codebase. There is no CPU-feature-detection infrastructure for RISC-V (no `crypto/cpu_riscv*.cc`, unlike the six `cpu_aarch64_*.cc` files for arm64) and no `<riscv_vector.h>` usage anywhere in the tree. The canonical `gen/sources.json` / `gen/sources.cmake` build manifest contains zero riscv entries; this was independently confirmed twice via direct decode of the raw file. Source-level inspection of `aes_nohw.cc`, `gcm_nohw.cc`, `sha256.cc`, `chacha.cc`, `p256-nistz.cc`, and the `curve25519/` directory found zero riscv-specific code, intrinsics, or file variants in any of them. Every performance-critical primitive rates as scalar-C or missing; none reach "partial" (C intrinsics) or "full" (hand-tuned assembly) - this is a bare compile-enablement port (an architecture macro plus a `getrandom` syscall-number fix), not a functional riscv64 implementation.

For comparison: OpenSSL has had extensive Zvk vector-crypto assembly since 2023 per the OpenSSL status report at `./libraries/openssl.md`. BoringSSL has none.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Required tools:**
- CMake >= 3.22 ("CMake 3.22 or later is required" per `BUILDING.md`). CI pins `3.31.11` via CIPD (`version:3@3.31.11.chromium.8`).
- C11 / C++17 compiler: GCC 6.1+ or recent Clang. This is BoringSSL's blanket C11/C++17-capable-compiler floor, not a riscv64-derived requirement - no riscv64 codepath imposes a stricter floor because riscv64 has zero assembly and zero riscv-conditional C code.
- Build tools generally must be "at most five years old, matching Abseil guidelines" (Go is exempt, see below).
- Go: "most recent stable version" (CI pins 1.27.0) - for test tooling only (`util/all_tests.go`, `delocate`, `inject_hash`) and Go-module dependencies, none of which are linked into libcrypto/libssl.
- Android NDK r29 (Chromium fork, CIPD package `infra/3pp/tools/android_ndk/linux-amd64 version:3@r29.chromium.1`) for Android cross-compilation - this NDK package itself runs on amd64 build hosts, cross-compiling to the riscv64 target.
- Bazel: BoringSSL's build definitions now center on `MODULE.bazel` plus vendored `third_party/`; there is no longer a root `DEPS`/gclient file (confirmed via direct clone, HEAD `98df68178dcf8a75b230503951b8a3b4f5c51aa6`, 2026-09-30).
- Ninja (recommended, `-GNinja`) or Make.

**Android cross-compilation (the only path BoringSSL's own CI verifies), verified byte-for-byte against `infra/config/main.star` lines 756-787:**

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
  -DANDROID_ARM_MODE=arm \
  -DANDROID_PLATFORM=android-24 \
  -DBORINGSSL_PREFIX=MY_CUSTOM_PREFIX
ninja -C build
```
`-DANDROID_ARM_MODE=arm` on the riscv64 builder is a genuine copy-paste artifact with no effect on a riscv64 target; confirmed still present.

**Native Linux riscv64 (no upstream-provided toolchain file):** `find . -iname "*toolchain*"` in the repository returns only `util/32-bit-toolchain.cmake` (x86 32-bit) and a vendored `third_party/benchmark/cmake/llvm-toolchain.cmake` - neither is riscv-related. The recommended approach, mirroring `util/32-bit-toolchain.cmake`'s pattern:
```
cmake -B build \
  -DCMAKE_TOOLCHAIN_FILE=<user-provided riscv64-linux-gnu.cmake> \
  -DCMAKE_BUILD_TYPE=Release \
  -GNinja
ninja -C build
```

**`-DUSE_X=OFF`-style flags:** No riscv64-specific CMake flags exist anywhere in the option surface. The only `USE_*` flag in the entire CMake build is `USE_CUSTOM_LIBCXX` (Clang-only, unrelated to architecture). `OPENSSL_NO_ASM` is moot for riscv64 since zero `.S`/asm sources exist for the architecture. No `-DUSE_RISCV`, `-DUSE_VECTOR_CRYPTO`, or similar flags exist anywhere in the tree.

**QEMU:** `util/all_tests.go` defines a Go single-dash flag, `-qemu` (`flag.String("qemu", "", "Optional, absolute path to a binary location for QEMU runtime.")`), used as `go run util/all_tests.go -qemu=/path/to/qemu-riscv64`, wrapping test binary invocation in `exec.Command`. CIPD dependency `infra/3pp/tools/qemu_static/linux-amd64` is pinned to `version:3@10.0.8+ds-0+deb13u1+b1` (`util/bot/DEPS`, ~line 166), gated behind `checkout_riscv64: False` (confirmed still `False`), so QEMU is not fetched or wired into either CI builder by default. A direct fetch of `infra/config/main.star` confirms zero occurrences of the string "qemu" anywhere in that file.

**Dockerfile:** none found. `find . -iname "*dockerfile*" -o -iname "*.dockerfile"` across the full repository returns zero results; BoringSSL's LUCI builders run directly on Swarming VMs (`os:Ubuntu-24.04`, `cpu:x86-64`), with no Docker/container reference anywhere in `infra/config/`.

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

**Performance gap magnitude:** Data not available: no source - public repository, blog, benchmark site, vendor page, or academic paper - reports BoringSSL riscv64 performance numbers (throughput, MB/s, ops/sec, or any comparison to amd64/arm64) for any primitive (AES-GCM, ChaCha20-Poly1305, SHA-256/512, RSA, ECDSA/P-256, X25519). This was checked via multiple independent search passes (general web search, Bing-HTML substitute queries, GitHub code search for "boringssl riscv64 benchmark" and "boringssl riscv64 vector crypto," the RISE blog's full 35-post listing, and academic-paper search) and confirmed null every time. Since no riscv64 assembly exists in BoringSSL, there is nothing architecture-specific to benchmark beyond the generic scalar-C fallback, consistent with the absence of any published numbers.

**Security hardening gaps:** No RISC-V-specific constant-time or side-channel hardening exists. The generic C fallback paths are used for all operations. The `OPENSSL_RISCV64` macro defined in `target.h` is unused in any crypto dispatch guard, so no riscv64-specific mitigations can be conditionally compiled in. This is equivalent to the posture on MIPS and LoongArch.

---

## 7. CI/CD Infrastructure

BoringSSL's primary CI runs on Google's LUCI infrastructure (ci.chromium.org), not GitHub Actions. The `.github/workflows/branch-time.yml` file is solely a mirror-staleness checker (runs on `ubuntu-latest` x86, checks sync lag between the GitHub mirror and `boringssl.googlesource.com`) and contains zero architecture-related jobs. BoringSSL is not a Linux-kernel project and has no `lore.kernel.org` presence, so that channel is not applicable either.

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

The two riscv64 LUCI builders (`boringssl/try/android_riscv64_compile_only` and `boringssl/try/android_riscv64_prefixed_compile`) both appear in `infra/config/generated/commit-queue.cfg` without the `includable_only` flag, confirming they are mandatory CQ gates, and are triggered on every commit via `infra/config/generated/luci-scheduler.cfg`'s `main-gitiles-trigger`. Both run on `os:Ubuntu-24.04`, `cpu:x86-64` (cross-compilation hosts, not native riscv64 runners) per `infra/config/generated/cr-buildbucket.cfg`, with properties `ANDROID_ABI:riscv64`, `ANDROID_PLATFORM: android-35`/`android-24`, and explicitly `run_ssl_tests:false` and `run_unit_tests:false`.

The CIPD toolchain for QEMU (qemu-static 10.0.8) is available in `util/bot/DEPS` behind the `checkout_riscv64: False` flag, and `infra/config/main.star` contains zero occurrences of "qemu" - independently confirmed by direct fetch of both files. Enabling this flag and wiring it into a CI builder would enable QEMU-based test execution, but no such builder has been created.

---

## 8. Distribution and Release Status

BoringSSL distributes no pre-compiled binaries through any channel. The project ships no versioned releases with binary artifacts; consumers are expected to vendor the source and compile it. GitHub releases for `google/boringssl` contain only auto-generated source tarballs.

| Distribution channel | riscv64 availability | Notes |
|---|---|---|
| github.com/google/boringssl releases | No | Source tarballs only; no architecture-specific binary artifacts |
| PyPI (`boringssl`) | No | A package named `boringssl` now exists on PyPI (owner "pyhacks," latest release `1.0.0.post1`, uploaded 2026-08-16), but it is an unofficial, unrelated third-party wrapper, not Google's project. It ships only a universal `py2.py3-none-any` wheel and an sdist - no `riscv64`/`manylinux` platform tags anywhere in its file list. |
| RISE wheel builder | No | 89-package list at [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/) does not include a standalone BoringSSL wheel; BoringSSL is only present incidentally as a statically-linked transitive dependency inside unrelated wheels (`ydf`, `runai-model-streamer-gcs`) built by `riseproject-dev/python-wheels` |
| Debian sid / Ubuntu 26.04 resolute (android-platform-external-boringssl) | Yes (qualified) | `android-boringssl`, `android-libboringssl`, and `android-libboringssl-dev` at `14.0.0+r45-3` are packaged for riscv64 (alongside amd64, arm64, armhf, ppc64el); this is the Android/AOSP fork, not upstream BoringSSL. No package named plain `boringssl`, `python3-boringssl`, or `libboringssl` exists for any architecture in resolute. |
| Debian sid (android-platform-external-boringssl) | Yes (qualified) | `android-libboringssl` 14.0.0+r45-3+b2 available for riscv64; same Android-fork caveat |
| Ubuntu 24.04 (noble) | Yes (qualified) | `android-libboringssl` at 14.0.0+r11-4build1 for riscv64; same Android-fork caveat |
| Standalone Debian/Ubuntu package named `boringssl` | No | No such package exists in Debian or Ubuntu 26.04 resolute; confirmed by direct `packages.ubuntu.com` fetch |
| Arch Linux RISC-V (archriscv.felixc.at) | Not packaged | Query returned zero listed packages/versions |
| openSUSE / NixOS / FreeBSD | Unknown | No riscv64 build status data accessible from this research |

The Debian `android-platform-external-boringssl` source package builds `android-libboringssl` (610,880 bytes) for riscv64, built on host `rv-manda-02`. The `lld` build dependency does not list riscv64 in its architecture constraints (stops at `amd64 arm64 armel armhf i386 mips64el mipsel ppc64el`), suggesting a workaround or fallback linker was used [NEEDS VERIFICATION]. The `android-libboringssl-dbgsym` package for riscv64 lags the main archive version by one upstream release on Debian ports infrastructure, indicating riscv64 is not a Tier-1 architecture even for this fork.

**What a user must do to get a working binary on riscv64:** Build from source using the cross-compilation approach described in Section 5, or install `android-libboringssl` / `android-boringssl` from Debian or Ubuntu (Android fork only, not upstream BoringSSL under its own name).

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes / Blocking Issues |
|---|---|---|---|---|---|
| fiat-crypto | runtime-dependency, critical | Yes - vendored as `third_party/fiat`, generates portable, formally-verified C (`curve25519_64.h`, `p256_64.h`) with no architecture-specific code needed | Data not available: no riscv64-specific fiat-crypto test results found in this research | N/A - vendored source, not independently released; no Debian/Ubuntu binary package exists for it (it is a Coq-based code generator, not typically packaged) | No known riscv64-specific issues found via source inspection; no `project-reports/fiat-crypto.md` exists yet in this repository |
| googletest | test-dependency, optional | Data not available: `project-graph` MCP server was unreachable (`CONNECTION_CLOSED`) throughout this research pass, so no independent riscv64 packaging confirmation was obtained | Partial - `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 ([google/googletest#3756](https://github.com/google/googletest/issues/3756), open since Feb 2022, labeled "not planned") | See `project-reports/googletest.md` | Build-time only, not shipped; the failure does not affect BoringSSL's own cryptographic test coverage |
| benchmark (Google Benchmark) | test-dependency, optional | Data not available: `project-graph` unreachable this pass | Historical bugs fixed (CPU-frequency #1549, Feb 2023; type-conversion #1802, Jun 2024); riscv64 wheel builds reported active via cibuildwheel in prior research | See `project-reports/benchmark.md` | Build-time only, not shipped |
| libunwind | runtime-dependency, optional | Data not available: `project-graph` unreachable this pass | C++ exception handling unreliable on riscv64 Linux ([libunwind/libunwind#531](https://github.com/libunwind/libunwind/issues/531), closed "not planned"; PR #1032 open to disable C++ exceptions on RISC-V by default); FreeBSD 15 riscv64 support incomplete (issue #857, open) | See `project-reports/libunwind.md` | Not a BoringSSL blocker - the library is built with `-fno-exceptions -fno-rtti` universally, so libunwind's exception-handling gap does not apply |
| CMake | build-dependency, critical | Yes, on the x86-64 LUCI build hosts (cross-compiling to the riscv64 target); confirmed >= 3.22 required, CI pins `3.31.11` via CIPD | N/A - build-host tool | N/A - build-host tool | Data not available: no dedicated investigation of CMake's own riscv64-native build/package status was performed in this research pass |
| Bazel | build-dependency, critical | Yes, on x86-64 LUCI hosts; BoringSSL's build definitions now center on `MODULE.bazel` plus vendored `third_party/` (confirmed - no root `DEPS`/gclient file exists any more) | N/A | N/A | Data not available: no dedicated riscv64-native Bazel-toolchain investigation was performed in this research pass |
| Ninja | build-dependency, optional | Yes, on x86-64 LUCI hosts (`-GNinja` used in both documented riscv64 build paths, Section 5) | N/A - build-host tool | N/A | Data not available: no dedicated riscv64-native Ninja investigation was performed |
| GCC | build-dependency, critical | Data not available: no dedicated riscv64-target GCC investigation was performed in this research pass | N/A | N/A | `BUILDING.md`'s stated floor (GCC 6.1+) is a blanket C11/C++17-capable-compiler requirement, not riscv64-derived, since no riscv64 codepath imposes a stricter version |
| Go | build-dependency, optional | Yes - pure Go tooling builds for any `GOARCH` including riscv64 | No riscv64-specific Go-tooling issues found | Released (CI pins ~1.27.0) | Used only for test tooling (`util/all_tests.go`, `delocate`, `inject_hash`) and Go-module dependencies (`golang.org/x/*`, `google.golang.org/api`); none are linked into libcrypto/libssl |
| QEMU | test-dependency, critical | N/A - test-execution tool, not part of the library build itself | qemu-static 10.0.8 CIPD toolchain (`version:3@10.0.8+ds-0+deb13u1+b1`) is present for riscv64 checkouts but gated behind `checkout_riscv64: False` and never invoked in `infra/config/main.star` (confirmed: zero "qemu" occurrences in that file) | N/A | This is the critical, currently-missing link between compile-only CI and real riscv64 test execution; see Sections 7 and 13 |
| Android NDK | build-dependency, critical | Yes - r29 Chromium-fork NDK (CIPD `android_ndk/linux-amd64`, `version:3@r29.chromium.1`) drives both mandatory riscv64 LUCI builders | N/A - compile-only builders | N/A | The only riscv64 build path BoringSSL's own CI verifies on every commit |
| Wycheproof test vectors (indirect, vendored) | test-dependency, optional | N/A - JSON data, no compiled code | N/A | N/A | Vendored as `third_party/wycheproof_testvectors`; architecture-agnostic data only, no riscv64-specific status applies; no `project-reports/wycheproof.md` exists yet |

No dependency blocks BoringSSL from building or running on riscv64. The googletest thread-count bug (#3756) does not affect cryptographic test coverage. The libunwind C++ exception issue does not affect BoringSSL due to its `-fno-exceptions` build policy. The build-tool dependencies (CMake, Bazel, Ninja, GCC, Go) run as host tools on the x86-64 LUCI Swarming VMs for every riscv64 build path this research identified; none were independently investigated for their own riscv64-native packaging status, which is recorded above as "Data not available" per this report's verification policy rather than assumed.

---

## 11. Known Bugs and Active Issues

No RISC-V-related correctness bugs exist in either the GitHub mirror (`google/boringssl`, which has `has_issues: false`) or any accessible tracker. Zero open or closed correctness issues mentioning riscv, riscv64, or RISC-V were found through any accessible search path, including a direct check of the Debian bug tracker for `android-platform-external-boringssl` (0 bugs mention "riscv").

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| Chromium bug 342657857 | Unknown (authentication-gated) | Unknown | Unknown | Referenced by commit `f64d50dcd5`; likely the tracking issue for riscv64 CI toolchain setup; content inaccessible without Google authentication |
| [google/android-riscv64#36](https://github.com/google/android-riscv64/issues/36) | "external/boringssl: optimization" | Open since 2023-02-02, zero comments, no assignee, no linked CL | Feature/optimization request, not a correctness bug | Opened by Elliott Hughes (Google); the sole open, named item requesting RISC-V vector-crypto assembly for BoringSSL; unchanged status across repeated re-checks in this research |
| Gerrit CL 52485 | "Add detection for the riscv64 arch" | Open (`status: NEW`), functionally dead | N/A - open patch, not a bug | See Section 2; trivial, unreviewed for 3+ years, superseded by commit `4566bb5fe5` |

No performance regression reports and no FIPS build failure reports for riscv64 are publicly visible. The absence of a public tracker (BoringSSL's real tracker, `issues.chromium.org`, is auth-gated) makes it impossible to confirm there are no undisclosed issues.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None publicly visible. The project does not solicit external contributors and has no public forum where objections to RISC-V work would be recorded. Conversely, there is unactioned demand for the work from within Google itself: [android-riscv64 issue #36](https://github.com/google/android-riscv64/issues/36) (Elliott Hughes, Google, Feb 2023) requests RISC-V vector-crypto assembly for BoringSSL and remains open with no BoringSSL Gerrit CL filed against it, indicating the blocker is contributor bandwidth/priority rather than opposition to the work. The fate of Gerrit CL 52485 - a trivial, correct patch left completely unreviewed for over three years - is further evidence that riscv64 is not an internal review priority, though in that specific case the functionality was independently delivered through other means.

**Technical blockers:**
- No CPU feature detection infrastructure for RISC-V. Adding RVV or Zvkn acceleration requires building `crypto/cpu_riscv.cc` (analogous to `cpu_aarch64_linux.cc`) to query the kernel for ISA extension support at runtime. This is prerequisite work before any assembly can be conditionally dispatched.
- No perlasm or assembly generation infrastructure for RISC-V. BoringSSL's assembly is generated via Perl scripts (perlasm); `build.json` defines perlasm targets only for `aarch64`, `arm`, `x86`, and `x86_64`. Adding riscv64 requires a new perlasm flavor or direct `.S` file authoring.
- FIPS module build status on riscv64 is unverified (authentication-gated). The FIPS module imposes additional constraints on assembly integrity checking that may reject riscv64 [NEEDS VERIFICATION].

**Organizational blockers:**
- Google controls all merge decisions. External patches require Gerrit review by Google employees. The StarFive and Alibaba contributions (2022) demonstrate that Google accepts correctness fixes from external contributors, but no external party has submitted RISC-V assembly to the project via Gerrit-based review at comparable scope.
- The project explicitly disclaims any commitment to external use. Any contribution that adds maintenance burden (e.g., a riscv64 assembly backend requiring ongoing correctness review) would need a strong justification and a committed external maintainer.
- Chromium bug 342657857 (inaccessible) may contain internal Google roadmap information; without access, the internal priority of riscv64 work is unknown.

**Acceptance probability for assembly contributions:** Moderate, given the precedent of StarFive and Alibaba contributions being accepted. The key requirement is a committed external maintainer willing to own the riscv64 assembly path and respond to review feedback. Google will not own the RISC-V assembly; the contributor organization must.

---

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** none
- **Optimization-purpose project:** No. BoringSSL is a general-purpose, security-first TLS/crypto library ("not intended for general use"), not a project whose stated value proposition is RISC-V-specific performance, so the optimization-purpose modifier and the associated optimization-level rating do not apply.

**Justification:** BoringSSL has two mandatory, commit-gated LUCI CI builders (`android_riscv64_compile_only`, `android_riscv64_prefixed_compile`) that verify riscv64 Android NDK cross-compilation on every commit ([commit-queue.cfg](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/infra/config/generated/commit-queue.cfg), [cr-buildbucket.cfg](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/infra/config/generated/cr-buildbucket.cfg)), but both are compile-only (`run_unit_tests:false`, `run_ssl_tests:false`) with no test execution and no QEMU wired in despite the qemu-static toolchain being available - a "build step, no tests" CI posture caps the grade at yellow regardless of release channel. No riscv64 (or any-architecture) binary release is published by upstream - BoringSSL is a source-only, vendored library by design - so release provider is `none`; the only riscv64 binary found anywhere is the differently-named `android-libboringssl` Debian/Ubuntu package, which is the AOSP fork, not upstream's own release.

**Pending work that could change the grade:** One open, unmerged, effectively dead Gerrit CL 52485 (trivial riscv64 CMake-detection duplicate, open since 2022-05-10, zero reviewer engagement, functionally superseded by the merged port in commit `4566bb5fe5`) - unlikely to change the grade if landed, since it duplicates existing functionality. An unactioned Google-internal request for RISC-V vector-crypto assembly ([google/android-riscv64#36](https://github.com/google/android-riscv64/issues/36), open since Feb 2023, no linked CL, no comments) shows latent demand but no committed work. No RISE Project investment exists (no blog coverage, no dedicated repo, no funded work, no runner usage) beyond incidental transitive-dependency compiles in unrelated wheel-builder packages (`ydf`, `runai-model-streamer-gcs`). The concrete next step that would raise the grade to blue is Google flipping `checkout_riscv64: True` and enabling `run_unit_tests`/`run_ssl_tests` on the existing riscv64 LUCI builders to wire in the already-present QEMU toolchain - low-effort but requires Google's own LUCI-config cooperation, not an external contribution.

---

## 14. Investment Analysis

RISE has no existing BoringSSL RISC-V investment to account for beyond the incidental transitive compiles noted in Section 1; all work described below is unaddressed as of this report.

### 14.1 Functional Enablement

The basic compilation port is complete (2021-2022). One functional gap remains: the `getrandom` syscall number was fixed (2022), but FIPS module build support for riscv64 is unverified. If FIPS certification is required for the target use case, investigation and potential fixes are needed. Reclaiming the dead Gerrit CL 52485 (formally abandoning it in favor of the merged equivalent) is a zero-effort housekeeping item, not a functional gap.

### 14.2 Performance Optimization

All crypto primitives use scalar C fallback. This is the primary gap relative to arm64 and amd64. Priority targets:

- **AES-GCM with Zvkn (RISC-V AES and GHASH extensions):** Highest impact. AES-GCM is the dominant cipher in TLS 1.3. The RISC-V Zvkn extension provides hardware AES and GHASH acceleration directly comparable to the ARMv8 crypto extension.
- **ChaCha20-Poly1305 with RVV or scalar optimization:** Second highest impact. Used as TLS fallback and in certificate operations.
- **SHA-256 / SHA-512 with Zvksh:** Required for certificate verification throughput.
- **P-256 / Curve25519 field arithmetic with scalar optimization:** Moderate impact. The fiat-crypto C path is already well-optimized; assembly gains here are smaller than for symmetric crypto.
- **CPU feature detection (`crypto/cpu_riscv.cc`):** Zero performance impact directly, but is a prerequisite for all runtime dispatch work above.

### 14.3 CI/CD Infrastructure

Two compile-only CI builders exist and are commit-gated. The gap is test execution. QEMU 10.0.8 is already in the CIPD toolchain (`util/bot/DEPS`) behind `checkout_riscv64: False`. Enabling test execution requires flipping that flag and adding `run_unit_tests:true` / `run_ssl_tests:true` to the CI builder definitions in `infra/config/main.star` - low-effort infrastructure work, but requires Google's cooperation to merge the LUCI config change.

### 14.4 Ecosystem Enablement

BoringSSL has no dependent package ecosystem of its own (no PyPI, npm, or Maven packages that consume it as a named dependency requiring separate riscv64 enablement). Downstream consumers (Chrome, Android) are Google-owned and build BoringSSL from vendored source. No ecosystem enablement work applies here.

### 14.5 Summary Table

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

Total estimated contributor-owned effort: 22-38 person-weeks for full functional and performance parity with arm64. Google infrastructure work (CI enablement) is low-effort but requires Google's cooperation to merge. The critical path is: CPU feature detection, then AES-GCM assembly, then CI test enablement, then remaining symmetric crypto.

---

## 15. References

- [commit 565226278d - Compile for RISC-V (2021-02-25)](https://github.com/google/boringssl/commit/565226278d6b863672bb5c3f24197d8bb6e58b50)
- [commit 4566bb5fe5 - Add support for RISC-V 64-bit architecture (2022-06-08)](https://github.com/google/boringssl/commit/4566bb5fe517f7f141b5fe935c559fc4311af35d)
- [commit 45aadce331 - Define NR_getrandom for riscv64 (2022-08-02)](https://github.com/google/boringssl/commit/45aadce3311b6ed765fae4d7bdfa17a9a809623b)
- [commit b2d3c10cdc - Clean up header to reuse __riscv definition (2022-08-24)](https://github.com/google/boringssl/commit/b2d3c10cdc8fb642a842db2c6061743b4604b0b5)
- [commit 86c417e80f - Add compile-only RISC-V Android builders (2024-05-13)](https://boringssl.googlesource.com/boringssl/+/86c417e80f0315d345bb07226fabfa440cd09f86)
- [commit 8934b1ef08 - Add QEMU user option for running tests (2024-07-09)](https://github.com/google/boringssl/commit/8934b1ef0857bc08626a2206a6f5f718942c14fc)
- [commit f64d50dcd5 - riscv64 Add qemu-static CIPD dependency (2024-08-17)](https://github.com/google/boringssl/commit/f64d50dcd59e1758d4472fe2c6f5a717288f2138)
- [Gerrit CL 52485 - Add detection for the riscv64 arch (open, unmerged)](https://boringssl-review.googlesource.com/c/boringssl/+/52485)
- [Gerrit CL 53765 - Define NR_getrandom for riscv64](https://boringssl-review.googlesource.com/c/boringssl/+/53765)
- [Gerrit CL 68267 - Add compile-only RISC-V Android builders](https://boringssl-review.googlesource.com/c/boringssl/+/68267)
- [Gerrit CL 68887 - Add QEMU user option for running tests](https://boringssl-review.googlesource.com/c/boringssl/+/68887)
- [Gerrit CL 70273 - Add qemu-static CIPD dependency for RISC-V checkouts](https://boringssl-review.googlesource.com/c/boringssl/+/70273)
- [include/openssl/target.h - RISC-V architecture detection macros](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/include/openssl/target.h)
- [gen/sources.cmake - canonical assembly source list (zero riscv entries)](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/gen/sources.cmake)
- [infra/config/generated/cr-buildbucket.cfg - riscv64 LUCI builder definitions](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/infra/config/generated/cr-buildbucket.cfg)
- [infra/config/generated/commit-queue.cfg - riscv64 CQ gate configuration](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/infra/config/generated/commit-queue.cfg)
- [util/bot/DEPS - Android NDK r29 and QEMU 10.0.8 CIPD dependencies](https://boringssl.googlesource.com/boringssl/+/refs/heads/main/util/bot/DEPS)
- [BUILDING.md - build prerequisites and supported platforms](https://raw.githubusercontent.com/google/boringssl/master/BUILDING.md)
- [Debian package android-libboringssl riscv64 download](https://packages.debian.org/sid/riscv64/android-libboringssl/download)
- [Ubuntu package search - android-boringssl / android-libboringssl (riscv64, resolute)](https://packages.ubuntu.com/search?keywords=BoringSSL&suite=resolute&searchon=names&section=all)
- [PyPI - boringssl 1.0.0.post1 (unofficial, unrelated third-party package)](https://pypi.org/project/boringssl/)
- [googletest issue #3756 - GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [libunwind issue #531 - C++ exception handling on riscv64 Linux](https://github.com/libunwind/libunwind/issues/531)
- [RISE Project - member list](https://riseproject.dev)
- [RISE python-wheels PR #2416 - ydf riscv64 wheel (transitively bundles BoringSSL)](https://github.com/riseproject-dev/python-wheels/pull/2416)
- [RISE python-wheels PR #2406 - runai-model-streamer-gcs riscv64 wheel (transitively bundles BoringSSL)](https://github.com/riseproject-dev/python-wheels/pull/2406)
- [RISE Python wheel builder index](https://riseproject.gitlab.io/python/wheel_builder/)
- [BoringSSL upstream Gerrit code review](https://boringssl-review.googlesource.com)
- [google/android-riscv64 issue #36 - external/boringssl: optimization (Feb 2023, open)](https://github.com/google/android-riscv64/issues/36)
- [Chromium-dev mailing list - Porting for riscv64 (2022-01-14, StarFive early bring-up)](https://groups.google.com/a/chromium.org/g/chromium-dev/c/CTSgJXER8mw)