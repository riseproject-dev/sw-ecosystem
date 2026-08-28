---
title: xz
parent: Project Reports
categories:
  - libraries
---

# xz

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for xz (XZ Utils / liblzma)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

xz (XZ Utils) is a lossless data compression toolset built around the LZMA2 algorithm. It ships two primary components: the `xz` command-line tool and `liblzma`, a C library exposing the full compression/decompression pipeline. liblzma is used by virtually every Linux distribution as a core system library (initrd compression, RPM/DEB package payloads, kernel module compression).

The project is hosted at [tukaani-project/xz](https://github.com/tukaani-project/xz) with homepage at [tukaani.org/xz](https://tukaani.org/xz/).

**Governance:** Solo maintainer structure under the Tukaani Project, maintained by Lasse Collin (lasse.collin@tukaani.org). There is no foundation, no steering committee, and no formal governance document. Patch contributors include engineers from Red Hat, Google, and IBM in a non-core capacity.

**Corporate sponsors:** None publicly listed.

**Security note:** A backdoor (CVE-2024-3094) was introduced by former co-maintainer Jia Tan (jiat0218@gmail.com) in versions 5.6.0 and 5.6.1 (February-March 2024). Jia Tan has been removed. All versions 5.6.2 and later are clean. The current stable release is 5.8.3.

**Community stance on new architecture ports:** xz accepts new architecture-specific filters (BCJ filters) on technical merit. The RISC-V filter was developed and merged by the maintainers themselves with design input from Igor Pavlov (7-zip.org) and contributions from independent contributor Chien Wong (m@xv97.com). No gatekeeping policy exists beyond correctness and code quality review.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the main branch of [tukaani-project/xz](https://github.com/tukaani-project/xz). There is no downstream fork or vendor-specific branch.

| Date | Event | Source |
|------|-------|--------|
| 2023-09-23 | Enabled `TUKLIB_FAST_UNALIGNED_ACCESS` autodetection for RISC-V via `__riscv_misaligned_fast` macro in `m4/tuklib_integer.m4`. Note in commit: "not in any stable compiler release yet." | [commit 2f81ac8](https://github.com/tukaani-project/xz/commit/2f81ac8) |
| 2024-01-22 | Test vectors for RISC-V filter added (100% code coverage for riscv.c). | [commit e2870db](https://github.com/tukaani-project/xz/commit/e2870db) |
| 2024-01-23 | RISC-V BCJ filter (`LZMA_FILTER_RISCV`, ID 0x0B) added. 742 lines across 9 files. Supports RV32/RV64, little/big endian, JAL and AUIPC+inst2 pairs. | [commit 440a2ec](https://github.com/tukaani-project/xz/commit/440a2ec) |
| 2024-01-23 | Filter switched to byte-by-byte memory access for portability. | [commit 50255fe](https://github.com/tukaani-project/xz/commit/50255fe) |
| 2024-01-26 | First release containing RISC-V BCJ filter: v5.5.1alpha. | [GitHub releases](https://github.com/tukaani-project/xz/releases) |
| 2024-02-17 | Removed implementation-defined behavior (signed right-shift) in riscv.c. | [commit f1d6b88](https://github.com/tukaani-project/xz/commit/f1d6b88) |
| 2024-02-25/26 | PR [#87](https://github.com/tukaani-project/xz/pull/87) merged: added `--riscv` to man page filter list. Authored by Chien Wong, submitted by ivq, merged by JiaT75. | [PR #87](https://github.com/tukaani-project/xz/pull/87) |
| 2024-10-08 | Issue [#146](https://github.com/tukaani-project/xz/issues/146) opened requesting `TUKLIB_FAST_UNALIGNED_ACCESS` always enabled for riscv64; closed without comment (autodetection already existed via `__riscv_misaligned_fast`). | [issue #146](https://github.com/tukaani-project/xz/issues/146) |
| 2025-01-20 | Raw BCJ filter API (`lzma_bcj_riscv_encode` / `lzma_bcj_riscv_decode`) added alongside ARM64 and x86 raw APIs. Described as "primarily for erofs-utils." | [commit a831bc1](https://github.com/tukaani-project/xz/commit/a831bc1) |
| 2025-03-25 | v5.8.0 released; NEWS documents "Encoder speed improved for those 64-bit RISC-V processors that support fast unaligned access." First stable release with raw BCJ API. | [GitHub releases](https://github.com/tukaani-project/xz/releases) |
| 2026-03-xx | v5.8.3 released (current stable). | [GitHub releases](https://github.com/tukaani-project/xz/releases) |

**Key contributors:**
- Lasse Collin (Tukaani Project, independent): unaligned access detection, filter bug fixes, raw API
- Jia Tan (personal, no corporate affiliation declared): initial BCJ filter commit (removed from project after CVE-2024-3094)
- Chien Wong (m@xv97.com, independent): initial filter implementation and test files
- Igor Pavlov (7-zip.org): filter design contributions

---

## 3. Upstream Support Tier

xz has no formal tier policy. Evidence by analogy with other architectures:

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| BCJ filter implemented | yes (x86.c) | yes (arm64.c) | yes (riscv.c, largest filter in the project) |
| Unaligned access optimization | yes | yes (`__ARM_FEATURE_UNALIGNED`) | yes (`__riscv_misaligned_fast`, compiler-dependent) |
| Hardware CRC acceleration | yes (CLMUL) | yes (`crc32_arm64.h`) | no |
| CI runner (upstream) | yes (`ubuntu-latest`) | yes (`ubuntu-24.04-arm`) | no |
| Official pre-built binaries | no (source only, Windows .7z) | no | no |
| Distro packages (Debian sid) | yes | yes | yes (built on rv-osuosl-02) |
| Release-blocking | amd64 failures block release | arm64 failures block release | riscv64 not tested upstream |

The RISC-V BCJ filter is at functional parity with x86 and arm64 BCJ filters. The two gaps relative to those architectures are: (1) no hardware-accelerated CRC path and (2) no upstream CI runner. Neither constitutes a correctness regression; both are optimization and quality gaps.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

xz's compression pipeline is pure software LZMA2. There is no JIT compiler, no garbage collector, and no runtime dispatch infrastructure. Architecture-specific components are confined to: (a) BCJ pre-filters that improve compression ratio for native binaries, (b) hardware CRC acceleration for integrity checking, and (c) unaligned memory access optimization for the inner encoder/decoder loop.

### 4.1 BCJ Filter (`src/liblzma/simple/riscv.c`)

A Branch/Call/Jump filter that converts PC-relative addresses to absolute addresses before LZMA2 compression, improving compression ratio on RISC-V ELF binaries.

- File size: 27,176 bytes -- the largest BCJ filter in the project (next largest is arm64.c at 4,620 bytes, then x86.c at 3,898 bytes)
- Filter ID: `LZMA_FILTER_RISCV` = 0x0B; CLI flag: `--riscv`
- Supports: RV32 and RV64, little and big endian
- Instruction patterns handled: JAL (rd=ra/t0), AUIPC+JALR, AUIPC+ADDI, AUIPC+load, AUIPC+store, LPAD (Zicfilop, AUIPC rd=x0), floating-point load/store pairs (Zfh, F, D, Q). C.JAL (16-bit compressed) is explicitly excluded.
- No RVV, no Zba/Zbb/Zbc bitmanip, no assembly
- Both encoder and decoder fully implemented; raw API (`lzma_bcj_riscv_encode` / `lzma_bcj_riscv_decode`) added January 2025
- 100% code coverage via test vectors

### 4.2 CRC32/CRC64 Integrity Checking (`src/liblzma/check/`)

| File | Architecture | Method |
|------|-------------|--------|
| crc32_x86.S, crc64_x86.S | x86 | hand-written assembly |
| crc_x86_clmul.h | x86 | CLMUL intrinsics |
| crc32_arm64.h | ARM64 | CRC intrinsics |
| crc32_loongarch.h | LoongArch | intrinsics |
| riscv64 | **absent** | falls back to generic C table |

No `crc_riscv.h`, no `crc32_riscv.S`, no Zbc (carry-less multiply) or Zvksh (vector SHA) path. This is a performance gap only; the scalar C table implementation is correct.

### 4.3 Unaligned Memory Access (`m4/tuklib_integer.m4`, `cmake/tuklib_integer.cmake`)

- When `__riscv_misaligned_fast` is defined by the compiler, `TUKLIB_FAST_UNALIGNED_ACCESS` is enabled, allowing 16/32/64-bit word reads in the encoder/decoder hot paths without byte-by-byte fallback.
- The macro requires a recent toolchain (it was "not in any stable compiler release" as of September 2023 when the detection was added).
- On hardware that supports fast unaligned access but where the toolchain does not define `__riscv_misaligned_fast`, the build silently falls back to byte-by-byte access with no error or warning.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| BCJ filter | x86.c (3,898 bytes) | arm64.c (4,620 bytes) | riscv.c (27,176 bytes) |
| CRC hardware acceleration | CLMUL + assembly | CRC intrinsics | none (scalar C table) |
| Unaligned access optimization | always enabled | `__ARM_FEATURE_UNALIGNED` (reliable) | `__riscv_misaligned_fast` (compiler-dependent) |
| Raw BCJ filter API | yes (5.8.0+) | yes (5.8.0+) | yes (5.8.0+) |
| JIT/SIMD | none | none | none |

---

## 5. Build System, Cross-Compilation, and Toolchain

xz supports two build systems: Autotools and CMake (3.20 minimum). CMake is the recommended path for cross-compilation.

**Autotools cross-compilation for riscv64-linux-gnu:**

```sh
./configure \
  --build=x86_64-pc-linux-gnu \
  --host=riscv64-linux-gnu \
  CC=riscv64-linux-gnu-gcc \
  CFLAGS="-O2"
make
```

To build tests without running them (standard cross-compile practice):

```sh
make check TESTS=
```

**CMake cross-compilation:** No upstream toolchain file for riscv64 exists in the repository. A minimal toolchain file must be supplied by the caller:

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```

```sh
cmake -B build-riscv64 \
  -DCMAKE_TOOLCHAIN_FILE=toolchain-riscv64.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_SHARED_LIBS=OFF \
  -DXZ_THREADS=posix \
  -DXZ_CLMUL_CRC=OFF \
  -DXZ_ARM64_CRC32=OFF \
  -DXZ_LOONGARCH_CRC32=OFF \
  -DXZ_ASM_I386=OFF \
  .
cmake --build build-riscv64
```

The arch-specific CRC flags (`XZ_CLMUL_CRC`, `XZ_ARM64_CRC32`, `XZ_LOONGARCH_CRC32`) are harmless if left ON when cross-compiling to riscv64 (they will autodetect as absent), but disabling them explicitly avoids spurious configure warnings.

**Unaligned access override:**

```sh
# Force enable (for hardware known to support fast unaligned access, e.g., Spacemit X60):
cmake ... -DTUKLIB_FAST_UNALIGNED_ACCESS=ON
# Autotools equivalent:
./configure ... --enable-unaligned-access
```

**Toolchain version requirements:** C99 compiler required (GCC 2.x explicitly excluded). No documented minimum GCC version for riscv64 specifically. GCC 8+ is recommended in practice for full RV64GC support; `__riscv_misaligned_fast` macro support requires a recent GCC (exact minimum version not documented upstream). [NEEDS VERIFICATION]

**QEMU:** No upstream QEMU CI or documentation. For testing riscv64 builds on an x86-64 host:

```sh
qemu-riscv64-static ./build-riscv64/src/xz/xz --version
qemu-riscv64-static ./build-riscv64/tests/test_check
```

**Known build failures:** Issue [#180](https://github.com/tukaani-project/xz/issues/180) (closed May 2025): `ld.lld` on Gentoo LLVM profiles rejected undefined `lzma_bcj_riscv_encode` and `lzma_bcj_riscv_decode` symbols in the liblzma version script. Workaround: add `-Wl,--undefined-version`. The issue was closed; the fix is present in 5.8.x.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---------|-------|-------|---------|----------|
| LZMA2 compression/decompression | full | full | full | none |
| BCJ filter for native binaries | full (x86.c) | full (arm64.c) | full (riscv.c) | none |
| Raw BCJ filter API | yes (5.8.0+) | yes (5.8.0+) | yes (5.8.0+) | none |
| Multi-threaded compression (pthreads) | yes | yes | yes | none |
| Hardware CRC32 acceleration | yes (CLMUL) | yes (CRC intrinsics) | no (scalar C table) | performance |
| Hardware CRC64 acceleration | yes (CLMUL) | no | no | performance |
| Unaligned access in encoder hot path | always | always (`__ARM_FEATURE_UNALIGNED`) | conditional (`__riscv_misaligned_fast`) | performance |
| Linux Landlock sandboxing | yes | yes | yes (kernel 5.13+) | none |
| NLS (translated messages) | yes | yes | yes | none |

**Functional gaps:** None. xz compresses and decompresses all LZMA/LZMA2/XZ data correctly on riscv64.

**Performance gaps:**

1. CRC throughput: The scalar C table implementation for CRC32/CRC64 is substantially slower than CLMUL (x86) or ARM64 CRC hardware. Magnitude: Data not available -- no published riscv64 vs amd64 benchmark figures were found in any accessible source. The LoongArch CRC intrinsics commit noted a "15% compression speed improvement" for that architecture, suggesting the CRC path is a meaningful fraction of total runtime [NEEDS VERIFICATION for magnitude on riscv64].

2. Unaligned access: On riscv64 targets where `__riscv_misaligned_fast` is not defined (older toolchain or hardware that does not advertise fast unaligned access), the encoder/decoder inner loop uses byte-by-byte reads. This affects integer hot paths in LZMA2 but the exact throughput impact is not quantified in any accessible source.

**Security hardening:** No riscv64-specific gaps. Landlock sandboxing applies to the xz CLI and works on riscv64 kernels >= 5.13.

---

## 7. CI/CD Infrastructure

**Upstream CI:** GitHub Actions, [ci.yml](https://github.com/tukaani-project/xz/blob/master/.github/workflows/ci.yml). Runner matrix:

```yaml
os: [ubuntu-latest, ubuntu-24.04-arm, macos-latest]
```

- `ubuntu-latest`: x86-64
- `ubuntu-24.04-arm`: ARM64 (native)
- `macos-latest`: ARM64 (Apple Silicon)

All 11 workflow files (`ci.yml`, `cifuzz.yml`, `coverity.yml`, `dragonflybsd.yml`, `freebsd.yml`, `haiku.yml`, `msvc.yml`, `msys2.yml`, `netbsd.yml`, `openbsd.yml`, `solaris.yml`) were searched for "riscv". Zero hits across all files.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI runner | yes (ubuntu-latest) | yes (ubuntu-24.04-arm) | no |
| QEMU emulation in CI | no | no | no |
| Cross-compilation in CI | no | no | no |
| RISE CI runners used | no | no | no |
| Trigger | push to master | push to master | N/A |

**RISE involvement:** None. xz does not appear in any RISE Project blog post (27 posts, May 2024 - June 2026 scanned). xz is not in the RISE wheel builder package list (78 packages). Neither xz nor the Tukaani Project appears in any RISE member list. xz is not among the projects using RISE RISC-V CI runners.

The RISC-V BCJ filter test vectors (`e2870db`) run on the x86-64 and ARM64 CI runners as part of the standard test suite. The filter is validated as a software transformation (encode then decode, verify round-trip), not on native riscv64 hardware. This is sufficient for correctness but does not test native execution performance or ABI behavior on riscv64.

---

## 8. Distribution and Release Status

**Upstream binaries for riscv64:** None. The GitHub releases page for v5.8.3 contains 13 assets: Windows `.7z`/`.zip` bundles, source tarballs (`.tar.bz2`, `.tar.gz`, `.tar.xz`), and PGP signatures. No pre-built Linux binaries for any architecture, including riscv64.

**Distribution packages:**

| Distribution | Version | riscv64 status | Notes |
|---|---|---|---|
| Debian sid | 5.8.3-1 | Installed | Built on build server rv-osuosl-02. Source: [buildd.debian.org](https://buildd.debian.org/status/package.php?p=xz-utils&suite=sid) |
| Ubuntu 24.04 Noble | 5.6.1+really5.4.5-1 | Available in ports | riscv64 version is in the Ubuntu ports archive (not main). Source: [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=xz&suite=noble) |
| Arch Linux RISC-V | 5.8.3-1 | Available | xz-5.8.3-1-riscv64.pkg.tar.zst, 908,833 bytes, dated 2026-04-11, signed. Source: [archriscv.felixc.at/repo/core/](https://archriscv.felixc.at/repo/core/) |

**What a user must do to get a working binary:** Install from a distribution package manager (`apt install xz-utils` on Debian/Ubuntu, package manager on Arch RISC-V). No pre-built binaries are available from upstream; cross-compilation from source is required for embedded or custom riscv64 targets.

---

## 9. Dependencies

xz is largely self-contained for its compression core. External dependencies are: threading (pthreads via glibc), hashing (glibc internal SHA-256, or libmd on BSD), internationalization (gettext/libintl), and optional sandboxing (Linux Landlock via kernel syscalls).

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| glibc / pthreads | Multi-threaded compression | yes | yes (Debian/Ubuntu CI) | yes (Debian sid 5.8.3-1) | riscv64 is a tier-1 glibc arch since 2.27. All riscv64 glibc releases are >= 2.27, so the librt fallback (clock_gettime on glibc < 2.17) is never needed. |
| libintl / gettext | NLS (translated xz CLI messages) | yes | no riscv64-specific test gap reported | yes (Debian sid) | Standard glibc provides libintl inline on Linux. |
| Linux Landlock (kernel) | Optional sandboxing for xz CLI | yes (kernel >= 5.13) | depends on test kernel version | available | Gracefully disabled at runtime if syscalls are absent. |
| libmd (BSD only) | External SHA-256 on FreeBSD/Solaris | N/A on Linux | N/A | N/A | Not relevant for riscv64/Linux targets. |
| TUKLIB_FAST_UNALIGNED_ACCESS (build-time) | Unaligned word reads in encoder hot path | conditional: requires `__riscv_misaligned_fast` in toolchain | no riscv64 upstream CI | enabled when toolchain defines the macro | Fallback to byte-by-byte is always safe and correct. |
| Hardware CRC (arch-specific, not a library) | Fast CRC32/CRC64 integrity check | no RISC-V path | no | no | Scalar C table fallback is correct. Gap vs x86/ARM64/LoongArch. |

No second-level or third-level dependency has a documented riscv64 blocker.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#146](https://github.com/tukaani-project/xz/issues/146) | Enable `TUKLIB_FAST_UNALIGNED_ACCESS` for RISC-V | Closed (Oct 2024) | Performance | Autodetection via `__riscv_misaligned_fast` already existed from Sep 2023. Issue opened by user unaware of prior work. Closed without comment. |
| [#180](https://github.com/tukaani-project/xz/issues/180) | xz-utils-5.8.1 fails to build on Gentoo LLVM profiles | Closed (May 2025) | Build correctness | `ld.lld` rejected undefined `lzma_bcj_riscv_encode`/`lzma_bcj_riscv_decode` in version script. Workaround applied. Fixed in 5.8.x. |

No open correctness bugs specific to riscv64 exist in the issue tracker as of June 2026.

**Latent performance gap (no open issue):** No hardware CRC acceleration for RISC-V exists (no `crc_riscv.h` or `crc32_riscv.S`). Architectures with hardware CRC (x86 CLMUL, ARM64 CRC, LoongArch) outperform the scalar C table fallback. No upstream issue tracks this.

---

## 12. Objections and Upstream Blockers

No documented objections to riscv64 support exist. All submitted RISC-V work was merged by maintainers without objection. The BCJ filter was committed directly by a maintainer (Jia Tan) without requiring a PR; the only PR (#87) was a documentation fix that merged in one day.

The project's security posture post-CVE-2024-3094 means Lasse Collin is now sole maintainer. Patch review may be slower than before due to single-maintainer bandwidth. This is not a riscv64-specific issue.

No organizational blockers. No tiering policy that would exclude riscv64 from CI or releases.

---

## 13. Investment Analysis

RISE has no involvement in xz. All riscv64 work to date was contributed by independent developers (Chien Wong, Lasse Collin, Jia Tan) without RISE funding or RISE CI infrastructure.

### 13.1 Functional Enablement

No functional gaps exist. xz compresses and decompresses correctly on riscv64. The BCJ filter is fully implemented and production-grade. No investment required.

### 13.2 Performance Optimization

Two performance gaps exist:

**Gap 1: Hardware CRC acceleration.** All peer architectures (x86 via CLMUL, ARM64 via CRC intrinsics, LoongArch via intrinsics) have hardware-accelerated CRC32/CRC64 paths. RISC-V falls back to scalar C table. The Zbc (carry-less multiply) extension is the RISC-V equivalent of CLMUL; Zvksh provides vector SHA. Implementing a `crc_riscv.h` using Zbc intrinsics is a well-scoped, self-contained task with clear prior art in `crc_x86_clmul.h` (538 lines) and `crc32_loongarch.h`.

**Gap 2: Reliable unaligned access detection.** `TUKLIB_FAST_UNALIGNED_ACCESS` on riscv64 depends on `__riscv_misaligned_fast` being defined by the toolchain. This macro requires a recent compiler and hardware that advertises fast unaligned access. On hardware (e.g., Spacemit X60, SiFive P670) that supports fast unaligned access but where the toolchain does not yet define this macro, the build silently degrades. Adding a CMake option to force-enable it for known-good hardware profiles, or documenting the toolchain version threshold, would eliminate this silent degradation.

### 13.3 CI/CD Infrastructure

No riscv64 CI runner exists upstream. All riscv64 testing is performed by downstream distributions (Debian, Arch Linux RISC-V). Adding a RISE-hosted riscv64 runner to `ci.yml` would close this gap. Scope: modify the `os` matrix in `ci.yml` to include a riscv64 GitHub Actions runner. This is a small configuration change; the main cost is runner availability and maintainer buy-in from Lasse Collin.

### 13.4 Ecosystem Enablement

Not applicable. xz is a system library with no dependent package ecosystem requiring separate enablement. Downstream packages consume liblzma as a build dependency; their riscv64 status is independent of xz's own packaging.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Implement hardware CRC acceleration for RISC-V (Zbc intrinsics in `crc_riscv.h`) | 2-3 | Contributor + Lasse Collin review | High |
| Performance | Document minimum toolchain version for `__riscv_misaligned_fast` or add CMake override for known-good hardware | 0.5 | Contributor | Medium |
| CI/CD | Add riscv64 runner to upstream `ci.yml` via RISE infrastructure | 1 | RISE infra + Lasse Collin sign-off | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [tukaani-project/xz GitHub repository](https://github.com/tukaani-project/xz)
- [XZ Utils homepage](https://tukaani.org/xz/)
- [commit 2f81ac8 -- RISC-V unaligned access detection](https://github.com/tukaani-project/xz/commit/2f81ac8)
- [commit 440a2ec -- RISC-V BCJ filter](https://github.com/tukaani-project/xz/commit/440a2ec)
- [commit 50255fe -- byte-by-byte access in RISC-V filter](https://github.com/tukaani-project/xz/commit/50255fe)
- [commit f1d6b88 -- remove implementation-defined behavior in RISC-V filter](https://github.com/tukaani-project/xz/commit/f1d6b88)
- [commit e2870db -- RISC-V filter test vectors](https://github.com/tukaani-project/xz/commit/e2870db)
- [commit a831bc1 -- raw RISC-V BCJ filter API](https://github.com/tukaani-project/xz/commit/a831bc1)
- [PR #87 -- RISC-V missing from man page filter list](https://github.com/tukaani-project/xz/pull/87)
- [Issue #146 -- TUKLIB_FAST_UNALIGNED_ACCESS for RISC-V](https://github.com/tukaani-project/xz/issues/146)
- [Issue #180 -- lld build failure on Gentoo LLVM profiles](https://github.com/tukaani-project/xz/issues/180)
- [GitHub Actions CI workflow](https://github.com/tukaani-project/xz/blob/master/.github/workflows/ci.yml)
- [GitHub releases -- v5.8.3 assets](https://github.com/tukaani-project/xz/releases)
- [Debian buildd -- xz-utils sid](https://buildd.debian.org/status/package.php?p=xz-utils&suite=sid)
- [Ubuntu 24.04 packages -- xz-utils](https://packages.ubuntu.com/search?keywords=xz&suite=noble)
- [Arch Linux RISC-V core repository](https://archriscv.felixc.at/repo/core/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)