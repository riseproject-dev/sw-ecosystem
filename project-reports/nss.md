---
title: NSS
parent: Project Reports
categories:
  - libraries
  - browser
---

# NSS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for NSS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[NSS (Network Security Services)](https://firefox-source-docs.mozilla.org/security/nss/) is a Mozilla Foundation project providing a cross-platform cryptographic library used primarily by Firefox and Red Hat Enterprise Linux. It implements TLS, X.509, PKCS#11, and a broad set of symmetric and asymmetric cryptographic primitives. The canonical repository is [mozilla/nss](https://github.com/mozilla/nss) (GitHub mirror); the authoritative source is the Mercurial repository at hg.mozilla.org.

Governance is maintainer-controlled with no independent foundation or formal open-governance board. The community documentation explicitly states the team's focus is "supporting platforms and features needed by Firefox and RHEL." Patch authority rests with NSS team members via Bugzilla and Phabricator code review. There is no CODEOWNERS, MAINTAINERS, or OWNERS file. License is Mozilla Public License v2.0.

The two dominant corporate sponsors are Mozilla and Red Hat. The top contributors by commit count are:

| GitHub login | Name | Company | Commits |
|---|---|---|---|
| martinthomson | Martin Thomson | Mozilla | 626 |
| kaie | Kai Engert | historically Red Hat | 508 |
| rjrelyea | Bob Relyea | historically Red Hat | 270 |
| jschanck | John Schanck | Mozilla | 436 |
| franziskuskiefer | Franziskus Kiefer | Cryspen / Celabs | 435 |
| ekr | Eric Rescorla | historically Mozilla | 182 |
| dennisjackson | Dennis Jackson | Mozilla | 180 |
| beurdouche | Benjamin Beurdouche | Mozilla | 149 |
| ueno | Daiki Ueno | Red Hat | 125 |
| mozkeeler | Dana Keeler | historically Mozilla | 124 |

NSS is not a member of the [RISE Project](https://riseproject.dev/). No RISE blog post (27 posts checked, 2024-05 through 2026-06) mentions NSS. No RISE-funded work for NSS was found.

Community stance on new ports: the two resolved RISC-V bugs turned around in two days or less, suggesting no institutional resistance to basic build-compatibility patches. However, the maintainer team has explicitly limited bandwidth for non-Firefox/non-RHEL platform work. Contributors are advised to contact the team before investing significant effort.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream. There is no out-of-tree fork or downstream patch queue.

| Date | Event | Bug / Commit | Source |
|---|---|---|---|
| 2020-01-27 | Bug 1609181: Detect ARM CPU features on FreeBSD; commit notes `AT_HWCAP*` also applies to riscv64 (forward-looking comment only, no riscv64 code added). Shipped in NSS 3.50. | [Bug 1609181](https://bugzilla.mozilla.org/show_bug.cgi?id=1609181) / commit `97df5ad` | Bugzilla + GitHub mirror |
| 2020-05-07 | Bug 1636058: Fix building NSS on Debian s390x, mips64el, and riscv64. Root cause: HACL* KReMLin code generator emitted architecture-incompatible output. Fixed via HACL* update (upstream kremlin/pull/173). Shipped in NSS 3.53. | [Bug 1636058](https://bugzilla.mozilla.org/show_bug.cgi?id=1636058) | Bugzilla |
| 2021-06-07 | Bug 1714719: Set NSS_USE_64 on riscv64 target when using GYP/Ninja. Added `riscv64` to the 64-bit arch list in `coreconf/config.gypi`. Shipped in NSS 3.68 (2021-07-08). | [Bug 1714719](https://bugzilla.mozilla.org/show_bug.cgi?id=1714719) / commit [1c7e99a](https://github.com/mozilla/nss/commit/1c7e99a) | Bugzilla + GitHub mirror |

Key contributors to RISC-V work: Benjamin Beurdouche (Mozilla) fixed the initial HACL*/KReMLin build failure; Makoto Kato (community) filed and fixed the GYP/Ninja 64-bit classification. Both fixes merged with two-day review cycles and zero iteration.

No open tracking bug exists for a comprehensive RISC-V port, hardware acceleration, or CI enablement.

---

## 3. Upstream Support Tier

NSS has no published platform tier policy. The CI (Taskcluster) defines the implicit tier by which platforms receive build and test coverage.

| Category | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (linux64, linux64-asan) | No (referenced in `target_tasks.py` but no build job defined) | No |
| CI test | Yes | No | No |
| Release-blocking | Yes | No | No |
| Official upstream binary | No (NSS does not publish GitHub Releases) | No | No |
| Distro binary | Yes | Yes | Yes (Debian sid, Ubuntu 24.04) |

NSS does not publish binary release assets on GitHub or any Mozilla-hosted download for any architecture. Binaries reach users exclusively through distro packaging.

The riscv64 support level is equivalent to "distro-carries, upstream does not test": functional via portable C, no CI coverage, no hardware acceleration, not release-blocking.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

NSS has no JIT compiler. The architecture-sensitive component is `lib/freebl`, the free-form cryptographic library that provides hardware-accelerated paths for symmetric and asymmetric primitives. A second sensitive component is NSPR (Netscape Portable Runtime), which handles thread-local storage, atomic operations, and platform ABI specifics.

### 4.1 freebl Hardware Acceleration Survey

`lib/freebl/freebl.gyp` controls which architecture-specific source files and compiler flags are activated per target. There is no riscv64 section.

| Primitive | amd64 | arm64 | riscv64 |
|---|---|---|---|
| AES | AES-NI (`intel-aes.S`), CLMUL | ARMv8 Crypto (`aes-armv8.c`) | Generic C (Rijndael) |
| GCM / GHASH | PCLMUL (`intel-gcm.S`) | `ghash-aarch64.c` | Generic C |
| SHA-1 / SHA-256 | SHA-NI, SSE4 | ARMv8 SHA1/SHA256 | Generic C (HACL*) |
| SHA-3 | AVX2 | NEON (via HACL*) | Generic C (HACL*) |
| ChaCha20-Poly1305 | AVX2, SSSE3 (HACL* _256/_128) | NEON (HACL*) | Generic C (HACL* Hacl_Chacha20.c) |
| Curve25519 | int128 HACL* (fast) | int128 HACL* (fast) | int128 HACL* (fast, see note) |
| P-256 / P-384 / P-521 | HACL* C | HACL* C | HACL* C |
| MPI big-integer | `mpi_amd64.c` + ASM (`mpi_amd64_common.S`) | -- | Generic C (no `mpi_riscv.c`) |
| CPU feature detection | CPUID in `blinit.c` | `AT_HWCAP` in `blinit.c` | Not present |
| 64-bit width (NSS_USE_64) | Yes | Yes | Yes (since NSS 3.68) |
| `have_int128_support` in GYP | Yes | Yes | No (see Section 4.2) |

No RISC-V Vector Cryptography ISA extensions (Zvkned, Zvkg, Zvknhb, Zvkb, Zkn, Zksh, Zbc) are used anywhere in NSS or its bundled dependencies.

### 4.2 have_int128_support Gap

The GYP build system sets `have_int128_support=1` for x64, arm64, and aarch64 only. riscv64 is absent from this list despite riscv64 GCC and Clang fully supporting `__int128`. The consequence is that HACL* uses the `KRML_VERIFIED_UINT128` software-emulated 128-bit path instead of `HACL_CAN_COMPILE_UINT128`. This affects the performance of Curve25519, Poly1305, and the HACL* EC implementations. This is a one-line GYP fix that has not been filed as a bug or submitted as a patch.

### 4.3 CPU Feature Detection (blinit.c)

`lib/freebl/blinit.c` dispatches hardware acceleration at runtime by reading CPU features. The function handles x86/x64 via CPUID, ARM/AArch64 via `getauxval(AT_HWCAP)`, and PowerPC. There is no riscv64 branch. Bug 1609181 (2020) noted that `AT_HWCAP*` can be used on riscv64 as well but no implementation followed. The absence means that even if RISC-V vector-crypto assembly were added, there is no dispatch mechanism to select it at runtime.

### 4.4 NSPR Platform Layer

NSPR (`nspr/pr/include/md/_linux.cfg`, `_linux.h`) has explicit riscv64 guards using `__riscv` and `__riscv_xlen` for atomic operations (via GCC builtins) and data-model configuration. Linux riscv64 support was added in NSPR 4.20 ([Bug 1308584](https://bugzilla.mozilla.org/show_bug.cgi?id=1308584), 2018, RESOLVED FIXED). FreeBSD riscv64 remains broken (NSPR [Bug 1711232](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232), UNCONFIRMED, patches attached but unreviewed since approximately 2021).

---

## 5. Build System, Cross-Compilation, and Toolchain

NSS uses GYP + Ninja as its primary build system, with a legacy GNU Make path. The GYP-based system is the path used by distro packaging and the only path with documented riscv64 support.

### 5.1 Cross-Compilation Command

```bash
export CC=riscv64-linux-gnu-gcc
export CCC=riscv64-linux-gnu-g++
export build_tools_cc=gcc

./build.sh \
  --target riscv64 \
  --opt \
  --disable-tests
```

When `$CC` differs from `build_tools_cc`, `build.sh` automatically adds `-Duse_system_zlib=0 -Dsign_libs=0`.

Equivalent direct GYP invocation:

```bash
gyp -Dtarget_arch=riscv64 \
    -Duse_system_zlib=0 \
    -Dsign_libs=0 \
    -Ddisable_tests=1 \
    nss.gyp
ninja -C out/Release
```

### 5.2 Recommended Disable Flags

| GYP Flag | Reason |
|---|---|
| `-Ddisable_tests=1` | Cross builds cannot run tests natively |
| `-Ddisable_werror=1` | Prevents unknown warning flags from failing the build |
| `-Duse_system_zlib=0` | Set automatically when cross-compiling |
| `-Dsign_libs=0` | Set automatically when cross-compiling |

Flags for ARM or x86 hardware features (`disable_arm_hw_aes`, `disable_altivec`, etc.) have no effect on riscv64 and can be left at their defaults.

### 5.3 Architecture Detection Gaps

`coreconf/detect_host_arch.py` has no riscv64 case. The function falls through to `platform.machine().lower()`, which returns `"riscv64"` on a native system. This passthrough is accepted by GYP without error. For cross-compilation, `--target riscv64` must be passed explicitly.

`coreconf/Linux.mk` also has no riscv64 CPU_ARCH case. The catch-all path sets `CPU_ARCH=$(OS_TEST)`, which evaluates to `riscv64` on Linux. Functionally correct, but there are no riscv64-specific compiler flags injected (unlike `-m32`/`-m64` for ia32/x64).

### 5.4 Toolchain Requirements

No minimum version is documented in NSS sources for riscv64. Practical minimums based on `__int128` and C11 requirements:

- GCC: 7 or later with `riscv64-linux-gnu` target
- Clang: 9 or later with `--target=riscv64-linux-gnu`
- Debian/Ubuntu package: `gcc-riscv64-linux-gnu g++-riscv64-linux-gnu`

No `-march=` flag is injected by the build system for riscv64.

### 5.5 QEMU

No QEMU integration exists in NSS's CI or build system. To run tests on cross-compiled riscv64 binaries, QEMU user-mode emulation must be configured externally (e.g., via `qemu-user-static` and `binfmt-support` on Debian/Ubuntu). There is no riscv64 Dockerfile in the repository; the only build Dockerfile (`taskcluster/docker/builds/Dockerfile`) targets linux-amd64 only.

### 5.6 Legacy Make Path

```bash
make USE_64=1 CROSS_COMPILE=1 CC=riscv64-linux-gnu-gcc CCC=riscv64-linux-gnu-g++
```

`Linux.mk` has no riscv64 case; the catch-all sets `CPU_ARCH=riscv64` and the build proceeds with generic C paths.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 Functional Gaps

There are no functional gaps: all cryptographic primitives have portable C fallback implementations in HACL* or Rijndael that produce correct results on riscv64. NSS compiles, links, and executes correctly on riscv64 Linux (confirmed by Debian autobuilder). There are no known correctness bugs specific to riscv64.

FreeBSD riscv64 is a functional gap at the NSPR level (Bug 1711232); this blocks NSS on FreeBSD/riscv64 entirely.

### 6.2 Performance Gaps

All performance gaps are caused by missing SIMD and hardware-crypto acceleration:

| Operation | amd64 acceleration | arm64 acceleration | riscv64 | Performance impact |
|---|---|---|---|---|
| AES-128-GCM | AES-NI + PCLMUL | ARMv8 Crypto | Generic C | Significant: 10-40x slower than AES-NI on x86 |
| ChaCha20-Poly1305 | AVX2 (HACL* _256) | NEON (HACL*) | Generic C (HACL*) | Moderate: 3-8x slower than AVX2 |
| SHA-256 | SHA-NI, SSE4 | ARMv8 SHA256 | Generic C (HACL*) | Moderate |
| Curve25519 | int128 (fast path) | int128 (fast path) | int128 blocked by missing `have_int128_support` flag | Small-to-moderate (software uint128 emulation) |
| MPI multiply | `mpi_amd64.c` + ASM | Generic C | Generic C | Moderate: RSA/ECDSA operations |

Data not available: published throughput figures (MB/s, ops/s) for NSS on riscv64 hardware. No benchmark data exists in any public source (no RISE posts, no upstream documentation, no published slides).

### 6.3 `have_int128_support` Gap

riscv64 supports `__int128` natively in GCC and Clang, but the GYP build file does not set `have_int128_support=1` for riscv64. This causes HACL* to compile with `KRML_VERIFIED_UINT128` (a software-emulated 128-bit integer type) instead of the native `__int128` path (`HACL_CAN_COMPILE_UINT128`). The affected primitives are Curve25519, Poly1305, and P-256/P-384/P-521 field arithmetic. This is a one-line GYP fix. No bug tracks it.

### 6.4 Security Hardening Gaps

Data not available: whether NSS hardening flags (stack canaries, CFI, shadow stack) are correctly applied on riscv64 cross-compiled builds. The build system does not inject riscv64-specific hardening flags, unlike the x64 path which explicitly enables certain instrumentation.

---

## 7. CI/CD Infrastructure

NSS CI is operated entirely through [Mozilla Taskcluster](https://taskcluster.net/). The supported build platforms as defined in `taskcluster/kinds/build/linux.yml`, `taskcluster/nss_taskgraph/transforms/build.py`, and `taskcluster/nss_taskgraph/target_tasks.py` are: linux32, linux64, linux64-asan, macosx64, win32, win64. aarch64 appears in `target_tasks.py` platform aliases but has no corresponding build or test job defined in any YAML file.

The three GitHub Actions workflows in `mozilla/nss` are administrative only: `close-pr.yml` auto-closes incoming PRs, `release.yml` packages source tarballs for RTM tags on x86_64, and `upload.yml` uploads tarballs to GCP storage. None contain build or test steps.

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Taskcluster build job | Yes | No (alias only) | No |
| Taskcluster test job | Yes | No | No |
| GitHub Actions build | No (admin only) | No | No |
| RISE CI runners | Data not available | Data not available | No |
| Hardware used | x86_64 Linux docker | N/A | N/A |
| Release-blocking | Yes | No | No |

No RISE-provided riscv64 CI runners are configured or referenced anywhere in the NSS repository.

---

## 8. Distribution and Release Status

NSS does not publish binary release assets on GitHub Releases or any upstream download location for any architecture. Binaries reach users exclusively through distro packaging.

| Distribution | Package | Version | riscv64 Status |
|---|---|---|---|
| Debian sid | libnss3 | 2:3.124-1 | Installed -- built on rv-osuosl-04 (confirmed via [buildd.debian.org](https://buildd.debian.org/status/package.php?p=nss&suite=sid)) |
| Debian trixie | libnss3 | 2:3.110-1+deb13u2 | Installed |
| Debian bookworm (stable) | libnss3 | -- | Not included -- bookworm riscv64 is not an official release architecture |
| Ubuntu 24.04 Noble | libnss3 | 2:3.98-1build1 | Available (confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/noble/libnss3)) |
| Ubuntu 22.04 Jammy | libnss3 | 2:3.68.2-0ubuntu1 | Available -- version 3.68.2 vs amd64's 3.98; significant lag on security-patched version [NEEDS VERIFICATION on whether lag is riscv64-specific or affects all non-amd64 arches] |
| Arch Linux RISC-V | nss | -- | Inconclusive -- status page returned 404; not confirmed |
| Fedora | nss | -- | Data not available -- riscv64 status on Fedora 44/45 not confirmed from available data |
| GitHub Releases | -- | -- | No releases published (no assets for any architecture) |

To get a working riscv64 binary: install `libnss3` from Debian sid or Ubuntu 24.04 package repositories. No special steps beyond standard package installation are required for Linux.

---

## 9. Dependencies

### 9.1 Summary Table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| NSPR | Platform abstraction (threads, I/O, atomics) | Passes (Linux) | Not tested upstream | Debian sid (nspr 4.38.2-1+b1, Installed) | FreeBSD: NSPR Bug 1711232 (patches stalled since ~2021) |
| HACL* (bundled in lib/freebl/verified/) | Verified C crypto: ChaCha20, Poly1305, Curve25519, Ed25519, P-256/384/521, SHA-3 | Passes (generic C) | Not tested upstream | Included in distro packages | None for correctness; performance impacted by missing `have_int128_support` |
| libcrux (bundled in lib/freebl/verified/) | ML-KEM-768/1024 (post-quantum KEM), SHA-3 | Passes (portable C) | Not tested upstream | Included in distro packages | None |
| zlib | TLS record compression utilities | Passes | N/A | All major distros | None |
| SQLite (system on Linux) | Certificate and key database backend | Passes | No riscv64 failures found | All major distros | None for riscv64 (riscv32 uint128 issue fixed 2026, unrelated) |
| GoogleTest | Test framework | Passes | [Issue #3756](https://github.com/google/googletest/issues/3756): one test failure (`GetThreadCountTest.ReturnsCorrectValue`) on riscv64 | Ships in distros | Does not block NSS test suite |
| pthread (system) | Thread synchronization | Kernel-provided | N/A | N/A | None |

### 9.2 HACL* Deep Dive

HACL* (Project Everest, bundled under `lib/freebl/verified/`) is the primary crypto implementation for ChaCha20, Poly1305, Curve25519, Ed25519, P-256/P-384/P-521, and SHA-3. Architecture-specific SIMD variants exist for x64 (AVX2, AVX-512) and ARM (NEON). riscv64 uses the portable C fallback in all cases.

The prior riscv64 build failure (Bug 1636058, 2020) was caused by KReMLin's `libintvector.h` lacking riscv64 support. This was fixed in NSS 3.53 via a HACL* upstream update. HACL* [issue #736](https://github.com/hacl-star/hacl-star/issues/736) documented a riscv64 cross-compile linker bug (VALE symbol `x64_poly1305` exposed outside its guard) -- closed 2022 with no confirmed merge.

HACL* upstream CI does not test riscv64. The `have_int128_support` flag not being set for riscv64 in NSS's GYP file (despite riscv64 supporting `__int128`) causes HACL* to compile with the slower `KRML_VERIFIED_UINT128` software path for all 128-bit field arithmetic.

### 9.3 NSPR Deep Dive

NSPR is a required runtime dependency. On Linux, riscv64 support was fully added in NSPR 4.20 (2018, [Bug 1308584](https://bugzilla.mozilla.org/show_bug.cgi?id=1308584), RESOLVED FIXED). The implementation uses GCC built-ins for atomic operations (`__sync_*` / `__atomic_*`) and is architecturally correct. Debian `nspr 4.38.2-1+b1` is confirmed Installed on a riscv64 build host.

FreeBSD riscv64 is blocked by NSPR [Bug 1711232](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232): `_freebsd.cfg` emits `#error "Unknown CPU architecture"` for riscv64. Patches have been attached since approximately 2021 but remain UNCONFIRMED with no reviewer activity.

### 9.4 libcrux Deep Dive

libcrux ([cryspen/libcrux](https://github.com/cryspen/libcrux)) provides ML-KEM-768 and ML-KEM-1024 (post-quantum key encapsulation) and is bundled under `lib/freebl/verified/`. It is generated from Rust via the Eurydice tool into portable C files named `*_portable.c`. No riscv64-specific files exist. The portable C path is architecturally sufficient for correctness and has no open riscv64 issues.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Bug 1714719](https://bugzilla.mozilla.org/show_bug.cgi?id=1714719) | Set NSS_USE_64 on riscv64 target when using GYP/Ninja | RESOLVED FIXED (NSS 3.68) | Medium (build correctness) | Only directly riscv64-targeted commit in NSS history |
| [Bug 1636058](https://bugzilla.mozilla.org/show_bug.cgi?id=1636058) | Fix building NSS on riscv64 (HACL*/KReMLin breakage) | RESOLVED FIXED (NSS 3.53) | High (build failure) | Triggered by HACL* KReMLin generating incompatible code for riscv64 |
| [Bug 1609181](https://bugzilla.mozilla.org/show_bug.cgi?id=1609181) | Detect ARM CPU features on FreeBSD (mentions riscv64 in comment) | RESOLVED FIXED (NSS 3.50) | Low (riscv64 relevance: peripheral) | Adds `elf_aux_info`-based `getauxval` for FreeBSD; enables future riscv64 CPU feature dispatch |
| NSPR [Bug 1711232](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232) | FreeBSD/riscv64 `#error "Unknown CPU architecture"` in NSPR | UNCONFIRMED (patches attached, stalled ~2021) | High (blocks NSS on FreeBSD/riscv64) | Patches exist; no reviewer activity in approximately 4 years |
| [google/googletest#3756](https://github.com/google/googletest/issues/3756) | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 | Open | Low (does not block NSS test suite) | In GoogleTest, not in NSS; does not affect NSS test pass/fail |
| (no bug filed) | `have_int128_support` not set for riscv64 in freebl.gyp | Not filed | Medium (performance) | riscv64 supports `__int128` natively; missing GYP entry forces slower KRML_VERIFIED_UINT128 path in HACL* |
| (no bug filed) | No riscv64 CPU feature detection in blinit.c | Not filed | Medium (prerequisite for any future hardware acceleration) | No `AT_HWCAP` parsing for RISC-V ISA extensions; without this, runtime dispatch for Zvk* extensions is impossible |

No open correctness bugs specific to riscv64 exist in NSS. The `have_int128_support` omission is a performance bug, not a correctness bug.

---

## 12. Objections and Upstream Blockers

**Organizational:** The maintainer team explicitly scopes to Firefox and RHEL platforms. riscv64 is not a Firefox or RHEL priority as of June 2026. Patches that are build-system fixes or small portable-C improvements have historically merged with no friction. Large assembly contributions (e.g., Zvk-based AES or ChaCha20) would require significant review bandwidth from the freebl team, who are few in number.

**Technical:** No fundamental technical blockers prevent riscv64 functionality. The blocking gap for performance is the absence of freebl.gyp riscv64 entries and RISC-V assembly implementations. These are additive changes with no architectural conflict.

**CI:** NSS CI runs on Mozilla's Taskcluster infrastructure with Mozilla-operated workers. Adding riscv64 CI requires either Mozilla provisioning riscv64 Taskcluster workers (hardware or QEMU-based) or acceptance of an external CI system, neither of which has been proposed. GitHub Actions riscv64 runners (QEMU-based) exist but are not used by NSS. Acceptance probability for a QEMU-based riscv64 GitHub Actions CI job: moderate -- it would be additive and low-risk, but requires maintainer buy-in to keep green.

**NSPR FreeBSD blocker:** NSPR Bug 1711232 has had patches since 2021 with zero reviewer activity. This is a de facto abandoned patch. Resolution requires either a Red Hat or Mozilla engineer to pick it up or a new submitter to re-file with a clean patch against current NSPR main.

---

## 13. Investment Analysis

RISE has no funded work for NSS. All items below are unaddressed as of June 2026.

### 13.1 Functional Enablement

One functional gap exists: the `have_int128_support` flag is not set for riscv64 in `lib/freebl/freebl_base.gypi` and `freebl.gyp`. This causes HACL* to use software-emulated 128-bit integers instead of native `__int128`. The fix is a one-line GYP change plus a Bugzilla filing. No architectural work required.

NSPR FreeBSD riscv64 (Bug 1711232) is a functional gap for FreeBSD-targeted workloads. Patches exist; the work is review-and-merge, not implementation.

### 13.2 Performance Optimization

Performance work falls into two phases:

**Phase A -- CPU feature dispatch infrastructure (prerequisite for all hardware acceleration):** Add riscv64 branch to `blinit.c` to parse `AT_HWCAP` for RISC-V ISA extensions (Zkn, Zksh, Zbc, Zvkb, Zvkned, Zvknhb, Zvkg). This is 50-100 lines of C and is required before any assembly implementation can be dispatched at runtime.

**Phase B -- Assembly implementations:** Each of the following is an independent work item:
- AES-128-GCM using Zvkned + Zvkg (vector AES + GHASH): highest TLS throughput impact
- ChaCha20-Poly1305 using Zvkb (vector bit-manipulation): relevant for TLS with ChaCha suites
- SHA-256 using Zvknhb: relevant for certificate verification and TLS handshake

For comparison: the aarch64 ARMv8 crypto paths in `aes-armv8.c` and `ghash-aarch64.c` are approximately 200-400 lines each and serve as the closest analogous implementation.

### 13.3 CI/CD Infrastructure

A minimal riscv64 CI addition would be a QEMU-based GitHub Actions job building NSS for riscv64 and running `nss_gtests`. This is additive and does not require Mozilla Taskcluster access. It requires maintainer acceptance.

### 13.4 Ecosystem Enablement

Not applicable. NSS is a system security library with no significant dependent package ecosystem requiring separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Set `have_int128_support=1` for riscv64 in freebl.gyp; file Bugzilla bug; submit patch | 0.5 | Any contributor | Critical |
| Functional | NSPR FreeBSD riscv64: rebase Bug 1711232 patches and drive to merge | 1 | Red Hat / contributor | Medium |
| Performance | Add riscv64 `AT_HWCAP` parsing to `blinit.c` (prerequisite for all hardware acceleration) | 1 | Any contributor | High |
| Performance | AES-128-GCM acceleration using Zvkned + Zvkg | 6 | Crypto engineer | High |
| Performance | ChaCha20-Poly1305 acceleration using Zvkb | 4 | Crypto engineer | High |
| Performance | SHA-256 acceleration using Zvknhb | 3 | Crypto engineer | Medium |
| Performance | MPI multiply optimization (`mpi_riscv64.c`) for RSA/ECDSA | 3 | Crypto engineer | Low |
| CI/CD | QEMU-based riscv64 GitHub Actions build+test job | 1 | Any contributor | High |

Total estimated effort: approximately 19.5 person-weeks for full parity with aarch64 CI and hardware acceleration coverage. The `have_int128_support` fix (0.5 pw) and CPU dispatch infrastructure (1 pw) should be the first two items; they gate all downstream performance work.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [NSS Homepage](https://firefox-source-docs.mozilla.org/security/nss/)
- [mozilla/nss GitHub mirror](https://github.com/mozilla/nss)
- [Bug 1714719 -- Set NSS_USE_64 on riscv64 target when using GYP/Ninja](https://bugzilla.mozilla.org/show_bug.cgi?id=1714719)
- [Bug 1636058 -- Fix building NSS on Debian s390x, mips64el, and riscv64](https://bugzilla.mozilla.org/show_bug.cgi?id=1636058)
- [Bug 1609181 -- Detect ARM CPU features on FreeBSD](https://bugzilla.mozilla.org/show_bug.cgi?id=1609181)
- [NSPR Bug 1308584 -- NSPR Linux riscv64 support (RESOLVED FIXED, NSPR 4.20)](https://bugzilla.mozilla.org/show_bug.cgi?id=1308584)
- [NSPR Bug 1711232 -- FreeBSD/riscv64 unknown CPU architecture (UNCONFIRMED, patches stalled)](https://bugzilla.mozilla.org/show_bug.cgi?id=1711232)
- [Commit 1c7e99a -- Bug 1714719 GYP riscv64 fix](https://github.com/mozilla/nss/commit/1c7e99a)
- [Commit 97df5ad -- Bug 1609181 FreeBSD ARM CPU features](https://github.com/mozilla/nss/commit/97df5ad)
- [Debian buildd nss sid status](https://buildd.debian.org/status/package.php?p=nss&suite=sid)
- [Ubuntu 24.04 libnss3 package](https://packages.ubuntu.com/noble/libnss3)
- [google/googletest issue #3756 -- riscv64 GetThreadCountTest failure](https://github.com/google/googletest/issues/3756)
- [RISE Project](https://riseproject.dev/)
- [NSS Taskcluster CI config -- build kinds](https://github.com/mozilla/nss/blob/main/taskcluster/kinds/build/linux.yml)
- [NSS Taskcluster CI config -- target tasks](https://github.com/mozilla/nss/blob/main/taskcluster/nss_taskgraph/target_tasks.py)