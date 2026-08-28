---
title: zlib
categories:
  - libraries
---

# zlib

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for zlib
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

zlib is a portable, lossless data compression library implementing the DEFLATE algorithm (RFC 1950/1951). It is written in portable C with no external library dependencies. The library provides two core functions: `deflate` (compression) and `inflate` (decompression), plus Adler-32 and CRC-32 checksum primitives. It is ubiquitous in system software, language runtimes, and data pipelines.

**Governance:** Solo-maintainer benevolent-dictator model. Mark Adler (GitHub: `madler`, approximately 672 of roughly 730 total commits) is the de facto sole maintainer and repository owner. Jean-loup Gailly is the original co-author of the compression half but is no longer active on GitHub. There is no governance document, no MAINTAINERS file, no CODEOWNERS file, and no steering committee. The project has no foundation affiliation (not Apache, CNCF, or Linux Foundation). The mailing list `zlib-devel` is described as "for contributors and testers only."

**License:** The zlib License (permissive, non-copyleft). The README explicitly states the implementation is "not covered by any patents."

**Corporate sponsors:** None. Mark Adler is a retired engineer (formerly JPL/NASA, later Google). No current corporate employer is listed on his GitHub profile. The contributor `nmoinvaz` (10 commits) is affiliated with `@snxd`. No company holds sustained contributor representation.

**RISE membership:** zlib is not a RISE Project member. No RISE blog posts, funded projects, or RFPs covering zlib were found across 27 blog posts from May 2024 through June 2026.

**Culture toward new ports:** The project's acceptance pattern for architecture-specific optimizations is conservative. s390x CRC-32 vectorization was merged in release 1.3.2 (February 2026), demonstrating that arch-specific work is accepted when it is clean and demonstrates clear value. However, Power8/Power9 SIMD PRs filed in December 2019 remain open as of June 2026 with no maintainer response -- a six-year backlog. The repository has 270 open issues. The pattern strongly suggests that correctness on new architectures is assumed (pure C), and SIMD performance work is accepted slowly if at all.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Pre-2020 | zlib builds and runs on riscv64 via portable C; no dedicated effort required | Implied by pure-C codebase; no recorded event |
| 2025-10-28 | PR #1099 opened: RVV-accelerated Adler32 by leiwen2025 (zte-riscv org), claiming 7% decompression improvement on SG2042 via lzbench | [PR #1099](https://github.com/madler/zlib/pull/1099) |
| 2025-11-17 | Single comment on PR #1099 pinging madler; no maintainer response | [PR #1099](https://github.com/madler/zlib/pull/1099) |
| 2025-12-25 | PR #1139 opened: "More tests" adds OpenBSD/riscv64 to CI matrix via vmactions | [PR #1139](https://github.com/madler/zlib/pull/1139) |
| 2026-01-28 | PR #1139 merged by madler: OpenBSD riscv64 CI target now active in develop branch | [PR #1139](https://github.com/madler/zlib/pull/1139) |
| 2026-02-17 | zlib v1.3.2 released; CI workflow change included; no riscv64 source code changes | [zlib releases](https://github.com/madler/zlib/releases) |
| 2026-06-10 | PR #1267 opened and self-closed same day (9 seconds): duplicate RVV Adler32 submission by same author; branch deleted next day | [PR #1267](https://github.com/madler/zlib/pull/1267) |

**Is RISC-V fully upstream?** No. The only merged RISC-V content is a CI matrix entry for OpenBSD/riscv64 (workflow file, not library source). There is no RISC-V source code, no architecture-specific optimization, and no RISC-V entry in the Linux cross-compilation CI matrix. Zero RISC-V commits exist in any merged branch.

**Key contributors:**
- Vollstrecker (no confirmed corporate affiliation): added OpenBSD/riscv64 CI target.
- leiwen2025 (zte-riscv org, ZTE): authored the unmerged RVV Adler32 PR. Fork list includes `isa-l`, `ceph`, and `hadoop`, suggesting a storage/HPC background. [NEEDS VERIFICATION: exact employer within ZTE ecosystem]

---

## 3. Upstream Support Tier

zlib has no formal tier or platform support policy. No document defines tiers, support levels, or testing requirements for any architecture.

**Evidence by architecture:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds in upstream CI | Yes (`cmake.yml`, `configure.yml`) | Yes (`configure.yml`: AARCH64 cross + QEMU) | Yes (OpenBSD only, `others.yml`, QEMU emulation via vmactions) |
| Linux cross-compile CI | Yes (native) | Yes (QEMU) | No |
| Release-blocking CI | Yes | Yes | No |
| Architecture-specific source code | Yes (contrib assembly for longest_match; 64-bit word path in crc32.c) | Yes (3 lines CRC32 hardware instruction in crc32.c) | No |
| Official prebuilt binaries | No (source-only releases) | No | No |
| Distro packages | Yes | Yes | Yes |

The riscv64 CI target (OpenBSD via vmactions) was added as part of a broad platform coverage sweep, not as a dedicated RISC-V investment. The more telling signal: `configure.yml` has a QEMU-based cross-compilation pattern for ARM, AARCH64, PPC, PPC64LE, and S390X but omits riscv64 entirely.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

zlib has no JIT backend, no crypto primitives, and no garbage collector. The architecture-sensitive components are:

- **Adler-32 checksum** (`adler32.c`): used in zlib stream headers (inflate/deflate). Pure C scalar implementation only in mainline. An unmerged RVV implementation exists in PR #1099.
- **CRC-32 checksum** (`crc32.c`): used for gzip-compatible streams. Has a 64-bit word-at-a-time path for x86_64, hardware CRC32 instruction path for aarch64, and a VX hardware path for s390x (via `contrib/crc32vx/`). No RISC-V path.
- **Deflate longest_match** (`deflate.c`): the most CPU-intensive function in compression. x86_64 hand-written assembly exists in `contrib/gcc_gvmat64/gvmat64.S` (opt-in, not default). No arm64 or riscv64 equivalent.
- **Inflate** (`inflate.c`): decompression inner loop. No architecture-specific code for any platform.

**Per-component quality table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Adler-32 | Scalar C | Scalar C | Scalar C (RVV intrinsics proposed in PR #1099, not merged) |
| CRC-32 | 64-bit word-at-a-time | Hardware instruction (`__ARM_FEATURE_CRC32`) | Scalar C |
| longest_match (deflate) | Hand-written x86_64 assembly (contrib, opt-in) | Scalar C | Scalar C |
| Inflate inner loop | Scalar C | Scalar C | Scalar C |

**RISC-V ISA extensions proposed (not merged):**
PR #1099 uses RVV intrinsics (`riscv_vector.h`): `vsetvlmax_e8m4`, `vle8_v_u8m4` (LMUL=4 element-width-8 load), `vzext_vf2_u16m8` (zero-extend u8 to u16), `vid_v_u16m8` (vector index for positional weights), and vector reduction to u32. Requires the V extension. Tested on Sophgo SG2042. No Zba/Zbb bit-manipulation extensions, no `.S` assembly files, no SIMD dispatch infrastructure in mainline.

The `#ifdef __riscv` pattern does not appear anywhere in the repository across any source file.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems:** `./configure` + `make` (autoconf-style) and CMake. Both are supported upstream.

**Cross-compilation via `./configure`:**

```
CHOST=riscv64-linux-gnu \
CC=riscv64-linux-gnu-gcc \
./configure --warn
make -j$(nproc)
QEMU_RUN="qemu-riscv64 -L /usr/riscv64-linux-gnu" make test
```

The `Makefile.in`-generated Makefile prefixes each test binary invocation with `${QEMU_RUN}`. This pattern is identical to the existing ARM, AARCH64, PPC, PPC64LE, and S390X cross-compilation jobs in `configure.yml` -- riscv64 simply has not been added to that matrix.

**Cross-compilation via CMake:**

```
cmake -S . -B build \
    -DCMAKE_TOOLCHAIN_FILE=riscv64-linux-gnu.cmake \
    -DCMAKE_BUILD_TYPE=Release \
    -DZLIB_BUILD_MINIZIP=ON
cmake --build build
```

No CMake cross-compilation examples exist in the upstream repository for any architecture. The standard `-DCMAKE_TOOLCHAIN_FILE` approach applies. No riscv64-specific `-DUSE_X=OFF` flags exist; there are no optional SIMD/arch features to disable in the library.

**Toolchain version requirements:** No explicit minimum GCC or Clang version is documented for any architecture. The code uses standard C89/C99. Any GCC or Clang version supporting `riscv64-linux-gnu` targets is sufficient (GCC >= 7.0, Clang >= 6.0). [NEEDS VERIFICATION: lower bound not stated by upstream]

**Known build failures on riscv64:** None. The OpenBSD/riscv64 vmactions CI (merged 2026-01-28) runs cmake configure, cmake build, and ctest without recorded failures. No riscv64-specific build issues exist in the issue tracker.

**Native build (OpenBSD riscv64):** The `others.yml` CI workflow uses `vmactions/openbsd-vm@v1` with `arch: riscv64` on an ubuntu-latest host. The vmactions project uses QEMU under the hood for riscv64 OpenBSD. The test pipeline is: `cmake . -B build -DZLIB_BUILD_MINIZIP=ON -DMINIZIP_ENABLE_BZIP2=ON && cmake --build build/ && ctest --test-dir build`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None. zlib is pure portable C. Every feature -- compression, decompression, gzip streams, zlib streams, raw deflate, minizip -- works on riscv64 with no functional gaps.

**Performance gaps:**

| Function | amd64 delta vs scalar | arm64 delta vs scalar | riscv64 delta vs scalar |
|---|---|---|---|
| Adler-32 | Minimal (no SIMD in mainline; zlib-ng has SSE2/AVX2) | Minimal (no NEON in mainline) | 0% (pure scalar; RVV unmerged PR claims +7% on SG2042) |
| CRC-32 | Moderate (64-bit word path, ~2x over byte loop) | Large (hardware instruction, depends on CPU generation) | 0% (pure scalar byte loop) |
| longest_match | Large (hand-written assembly in contrib; large but opt-in) | 0% (no opt-in equivalent) | 0% |
| inflate | 0% (no SIMD in mainline for any arch) | 0% | 0% |

The riscv64 CRC-32 gap is material: aarch64 uses a hardware CRC32 instruction (available on most modern cores), while riscv64 falls to the byte-at-a-time scalar loop. The Adler-32 gap is modest: +7% decompression impact claimed by leiwen2025 on SG2042 for the unmerged RVV patch.

**Security hardening gaps:** None specific to riscv64. No architecture-specific sanitizer exclusions or hardening flags are documented.

**Floating-point / NaN:** Not applicable. zlib performs no floating-point arithmetic.

**FreeBSD/riscv64:** Explicitly excluded from CI in PR #1139 due to "FreeBSD on riscv64 has no packages." [NEEDS VERIFICATION: current status of FreeBSD riscv64 package availability]

---

## 7. CI/CD Infrastructure

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI workflow | `cmake.yml`, `configure.yml`, `c-std.yml`, `fuzz.yml` | `configure.yml` (QEMU cross-compile) | `others.yml` (OpenBSD via vmactions) |
| OS | Linux, Windows, macOS | Linux (cross-compile) | OpenBSD |
| Hardware | Native x86 runners | QEMU (user-mode) | QEMU via vmactions |
| Trigger | push, pull_request | push, pull_request | push, pull_request |
| Linux coverage | Yes | Yes | No |
| Build system tested | CMake + configure | configure | CMake |
| Release-blocking | Yes | Yes | No |
| RISE runners | No | No | No |

The riscv64 CI target is:
- Active (triggers on push and pull_request)
- OpenBSD-only, not Linux
- QEMU-emulated (vmactions/openbsd-vm@v1 uses QEMU for riscv64)
- Added incidentally via PR #1139 as part of a broad platform sweep
- Not in the Linux cross-compilation matrix (`configure.yml`)

No RISE runners are used. No Cirrus CI, GitLab CI, or Jenkins configurations exist in the repository (`.cirrus.yml`, `.gitlab-ci.yml`, and `Jenkinsfile` all return 404).

---

## 8. Distribution and Release Status

**Upstream releases:** madler/zlib ships source-only releases. Releases v1.3.2, v1.3.1, v1.3, v1.2.13 each have six assets: source tarballs (`.tar.gz`, `.tar.xz`, `.zip`) and PGP signatures (`.asc`). No prebuilt binaries are distributed upstream for any architecture.

**Distribution packages:**

| Distribution | Package | Version | riscv64 status |
|---|---|---|---|
| Ubuntu 24.04 (noble) | zlib1g | 1:1.3.dfsg-3.1ubuntu2 | Present; arch list: amd64, arm64, armhf, i386, ppc64el, riscv64, s390x |
| Ubuntu 24.04 (noble) | zlib1g-dev | 1:1.3.dfsg-3.1ubuntu2 | Present; same arch list |
| Debian sid | zlib | 1:1.3.dfsg+really1.3.2-3 | "Installed" on riscv64, builder rv-manda-03, ~85 days ago |
| Arch Linux RISC-V | zlib | 1:1.3.2-3 | zlib-1:1.3.2-3-riscv64.pkg.tar.zst (83,409 bytes, 2026-03-09) |
| Arch Linux RISC-V | zlib-static | 1:1.3.2-3 | zlib-static-1:1.3.2-3-riscv64.pkg.tar.zst (137,298 bytes, 2026-03-09) |
| Alpine Linux (edge) | zlib | 1.3.2-r0 | Present for riscv64 (built 2026-03-05) |

**What a user must do to get a working binary:** Install from their distribution's package manager (`apt install zlib1g` on Ubuntu/Debian, `pacman -S zlib` on Arch RISC-V). No additional steps required. The library builds cleanly from source for any user who wants to compile it.

**PyPI:** Not applicable. Python's `zlib` module is part of the CPython standard library and is not distributed as a standalone PyPI wheel. `https://pypi.org/pypi/zlib/json` returns HTTP 404.

---

## 9. Dependencies

zlib has no external library dependencies. Its only build-time dependencies are the standard C toolchain (compiler, make/cmake) and the C standard library.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| libc (glibc) | C runtime | Fully supported | Yes (Debian/Ubuntu CI) | Debian sid, Ubuntu noble | No blockers |
| gcc / clang | C compiler (build-time) | Both support riscv64 targets | N/A | Shipped in all major distros | No blockers |
| cmake 3.x | Build system (build-time) | Fully supported | N/A | Released | No blockers |
| autoconf / make | Alternate build system (build-time) | Fully supported | N/A | Released | No blockers |

**zlib-ng** (the SIMD-enhanced fork, a separate project) is a drop-in replacement with active RISC-V work: RVV optimizations for adler32, chunkset, compare256, and slide_hash; Zbc carry-less multiply for CRC32. CI uses QEMU-based cross-compilation (GCC and Clang jobs; corpora tests skipped on RISC-V for speed). PR #2152 fixed a ZBC-only (no RVV) build failure; no open RISC-V blocking issues as of June 2026. zlib-ng is tracked separately and is not a dependency of madler/zlib.

---

## 11. Known Bugs and Active Issues

| ID | Title | State | Severity | Notes |
|---|---|---|---|---|
| [#1099](https://github.com/madler/zlib/pull/1099) | Add RVV-optimized implementation for Adler32 | Open (PR, no reviews) | Low (performance, not correctness) | Open since 2025-10-28; zero maintainer response; one comment pinging madler on 2025-11-17 |
| [#1267](https://github.com/madler/zlib/pull/1267) | Add RVV-optimized implementation for Adler32 (duplicate) | Closed/self-withdrawn | N/A | Opened and closed 2026-06-10; branch deleted next day; duplicate of #1099 |

No riscv64-specific correctness bugs exist in the issue tracker. No floating-point issues exist (the library performs no floating-point arithmetic). The open Power8 SIMD PRs (#458, #459, #468, #478, filed 2019-2020) are not riscv64-relevant but demonstrate the maintainer's pattern of leaving architecture SIMD work unreviewed indefinitely.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. Mark Adler has not publicly commented on RISC-V support or the RVV Adler32 PR. The absence of any comment for eight months is itself informative.

**Technical blockers:**
- No technical blockers for correctness on riscv64. The library builds and tests pass.
- The unmerged RVV Adler32 PR (#1099) is a complete, working implementation (104 lines, verified on SG2042), not a stub. It is not blocked by technical issues but by maintainer attention.

**Organizational blockers:**
- Solo maintainer with a demonstrated pattern of not reviewing architecture SIMD contributions (Power8 PRs open since 2019).
- No co-maintainer, no deputy reviewer, no documented review process for architecture contributions.
- 270 open issues as of June 2026.

**Acceptance probability for RVV Adler32 PR #1099:** Low in the near term based on the Power8 precedent (six years, no response). Medium in the longer term if upstream maintainer succession occurs or if distribution maintainers apply pressure. The s390x CRC-32 merge in 2026 shows the maintainer will act when sufficiently motivated.

**Note on zlib-ng:** Many downstream consumers of zlib have migrated to zlib-ng precisely because madler/zlib is slow to accept architecture optimizations. If RISC-V performance is the priority, engaging with zlib-ng is more actionable than investing in madler/zlib upstreaming.

---

## 13. Investment Analysis

RISE has no involvement with zlib. No funded work exists to subtract from the sizing.

### 13.1 Functional Enablement

No work required. zlib is functionally complete on riscv64. Distro packages are available and tested.

### 13.2 Performance Optimization

The RVV Adler32 implementation (PR #1099) is already written and tested by leiwen2025 (zte-riscv). The gap is upstream acceptance, not implementation. A CRC-32 optimization using the Zbc extension (carry-less multiply) does not yet exist for madler/zlib (it exists in zlib-ng). The performance delta for CRC-32 on riscv64 vs aarch64 is material for gzip-heavy workloads.

Remaining work if upstream acceptance is pursued:
- Review and polish PR #1099 (RVV Adler32): the implementation is complete but has had no code review.
- Implement CRC-32 via Zbc extension (analogous to aarch64 `__ARM_FEATURE_CRC32` path).
- Add SIMD dispatch infrastructure (runtime HWCAP detection) if multiple SIMD paths are merged.

### 13.3 CI/CD Infrastructure

Adding Linux/riscv64 cross-compilation to `configure.yml` requires a one-line matrix addition and follows the established pattern of the existing five non-x86 architectures in that workflow. This is the lowest-effort action available.

### 13.4 Ecosystem Enablement

Not applicable. zlib has no dependent package ecosystem to enable separately; it is a foundational system library.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 cross-compile target to `configure.yml` (Linux/QEMU) | 0.5 | Any contributor | High |
| Performance | Review, benchmark, and upstream PR #1099 (RVV Adler32) | 2 | RISC-V vendor or Qualcomm | Medium |
| Performance | Implement CRC-32 via Zbc extension (new work, analogous to aarch64 path) | 3 | RISC-V vendor or Qualcomm | Medium |
| Performance | Add SIMD dispatch infrastructure (HWCAP runtime detection for RVV/Zbc) | 1 | Dependent on above | Medium |
| Upstream engagement | Direct engagement with madler to unblock architecture SIMD PRs | 1 (recurring) | Qualcomm or distribution maintainer | Low |

Total: approximately 7.5 person-weeks, with the CI addition being trivially actionable immediately. The largest risk is not implementation effort but maintainer responsiveness; zlib-ng should be evaluated as an alternative investment target if near-term RISC-V performance impact is required.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [madler/zlib repository](https://github.com/madler/zlib)
- [zlib homepage](https://zlib.net/)
- [PR #1099: Add RVV-optimized implementation for Adler32](https://github.com/madler/zlib/pull/1099)
- [PR #1139: More tests (OpenBSD riscv64 CI)](https://github.com/madler/zlib/pull/1139)
- [PR #1267: Add RVV-optimized implementation for Adler32 (duplicate, closed)](https://github.com/madler/zlib/pull/1267)
- [zlib releases (v1.3.2, v1.3.1, v1.3, v1.2.13)](https://github.com/madler/zlib/releases)
- [CI workflow: others.yml (raw)](https://raw.githubusercontent.com/madler/zlib/develop/.github/workflows/others.yml)
- [CI workflow: configure.yml (raw)](https://raw.githubusercontent.com/madler/zlib/develop/.github/workflows/configure.yml)
- [CI workflow: cmake.yml (raw)](https://raw.githubusercontent.com/madler/zlib/develop/.github/workflows/cmake.yml)
- [Ubuntu 24.04 Noble: zlib package search](https://packages.ubuntu.com/search?keywords=zlib&suite=noble&searchon=names&section=all)
- [Debian buildd: zlib sid riscv64 status](https://buildd.debian.org/status/package.php?p=zlib&suite=sid)
- [Arch Linux RISC-V mirror: core repo](https://riscv.mirror.pkgbuild.com/repo/core/)
- [RISE Project blog](https://riseproject.dev/blog)