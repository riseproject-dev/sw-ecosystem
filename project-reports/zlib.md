---
title: zlib
parent: Project Reports
color: blue
categories:
  - libraries
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="zlib" %}

# zlib

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-17<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for zlib (madler/zlib)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source.<br/>
Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

zlib is a portable, lossless data compression library implementing DEFLATE (RFC 1950/1951). It is written in portable C with no external library dependencies and exposes `deflate` and `inflate` plus the Adler-32 and CRC-32 checksums. It is embedded in language runtimes, operating systems, browsers and data pipelines, so its riscv64 behavior is inherited by a very large part of the software stack.

**Governance:** Solo-maintainer model. Mark Adler ([madler](https://github.com/madler)) is the de facto sole maintainer and repository owner and authored the large majority of the commits. Jean-loup Gailly, the original co-author, is not active on GitHub. The repository has no governance document, no MAINTAINERS file and no CODEOWNERS file. The project has no foundation affiliation (not Apache, CNCF or Linux Foundation). The `zlib-devel` mailing list is described on the [zlib homepage](https://zlib.net/) as being for contributors and testers.

**License:** zlib License (permissive). The README states the implementation is not covered by any patents.

**Corporate sponsors:** None identified. No company holds sustained maintainer representation. Large downstream consumers (distributions, Chromium, Cloudflare, Intel) have historically maintained forks rather than funding upstream, which is the origin of [zlib-ng](zlib-ng.md).

**RISE:** zlib is not a RISE Project member and no RISE blog post, funded work item or fork in the [riseproject-dev](https://github.com/riseproject-dev) organization covering zlib was found. [NEEDS VERIFICATION: the RISE Confluence wiki is not publicly readable]

**Culture toward new ports:** Correctness on new architectures is assumed because the code is portable C. Architecture-specific optimization is accepted slowly. s390x CRC-32 vector support (`contrib/crc32vx`) is present in the tree, and the AArch64 CRC32 instruction path exists in `crc32.c`. Power8/Power9 SIMD pull requests filed in 2019-2020 (for example #458, #459, #468, #478) were still open when this report was written [NEEDS VERIFICATION: current state not re-read]. Platform coverage in CI has recently been widened by contributors (BSD workflows with several architectures).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Before 2020 | zlib builds and runs on riscv64 through its portable C code; no dedicated work was needed | Pure-C codebase; no recorded event |
| 2025-10-28 | PR #1099 opened: RVV-accelerated Adler-32 by `leiwen2025` (zte-riscv), claiming a 7% decompression gain on SG2042 measured with lzbench | [PR #1099](https://github.com/madler/zlib/pull/1099) |
| 2025-12-25 | PR #1139 opened: "More tests", adds OpenBSD riscv64 (and aarch64, x86_64) to the CI matrix through vmactions | [PR #1139](https://github.com/madler/zlib/pull/1139) |
| 2026-01-28 | PR #1139 merged; the `riscv64` entry is present in `develop` | [others.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/others.yml) |
| 2026-02 | zlib 1.3.2 released; no riscv64 source changes [NEEDS VERIFICATION: exact date] | [zlib releases](https://github.com/madler/zlib/releases) |
| 2026-06-10 | PR #1267 opened and closed by its author the same day: duplicate RVV Adler-32 submission | [PR #1267](https://github.com/madler/zlib/pull/1267) |

The merge state of #1099 and #1267 could not be re-confirmed against the API at the time of writing: both were last known to be unmerged [NEEDS VERIFICATION].

**Is the port fully upstream?** The library needs no port, so there is nothing to upstream for correctness. The only riscv64-specific upstream content is the OpenBSD/riscv64 CI entry. There is no riscv64 source code, no `#ifdef __riscv` anywhere in the tree (confirmed by searching a fresh checkout of `develop`), and no Linux riscv64 job.

**Key contributors:**
- `Vollstrecker` (no confirmed corporate affiliation): author of the CI sweep that added OpenBSD riscv64 [NEEDS VERIFICATION: authorship of #1139].
- `leiwen2025` (zte-riscv organization): author of the RVV Adler-32 pull requests. [NEEDS VERIFICATION: employer]
- No contributor is known to be RISE-funded.

**Timeline comparison:** amd64 and arm64 have been supported since the library's origin and are covered by Linux CI. riscv64 on Linux has no upstream CI; riscv64 CI exists only on OpenBSD since January 2026.

---

## 3. Upstream Support Tier

zlib has no formal platform tier or porting policy. The tier of riscv64 is inferred from CI.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Official binary | No (source-only releases) | No | No |
| CI pipeline | Linux, Windows, macOS (native) | Linux (QEMU cross, `configure.yml`), OpenBSD, macOS | OpenBSD only (`others.yml`, VM emulation) |
| Linux CI | Yes | Yes | No |
| Release-blocking | Not formally defined; CI must pass for merges in practice | Same | Not formally defined |
| Formal tier | None | None | None |

Inferred tier: riscv64 is a best-effort target tested through a single non-Linux VM job. The Linux cross-compile matrix in `configure.yml` covers ARM, AArch64, PowerPC, PowerPC64, PowerPC64LE and s390x but not riscv64.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

zlib has no JIT, no cryptography and no garbage collector. The architecture-sensitive components are:

- **Adler-32** (`adler32.c`): scalar C only in mainline.
- **CRC-32** (`crc32.c`): a word-at-a-time path (braided implementation) for 64-bit targets, an AArch64 hardware CRC32 path guarded by `__ARM_FEATURE_CRC32`, and an s390x vector facility path in `contrib/crc32vx`. There is no riscv64 path.
- **Deflate `longest_match`** (`deflate.c`): portable C. An x86 assembly variant lives in `contrib/` and is opt-in.
- **Inflate** (`inflate.c`): portable C for all architectures.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Adler-32 | scalar | scalar | scalar (RVV intrinsics proposed in PR #1099, not in mainline) |
| CRC-32 | partial (word-at-a-time C) | partial (hardware CRC32 instruction via compiler feature) | scalar / word-at-a-time C, no Zbc or Zbkc path |
| longest_match | scalar by default (opt-in assembly in contrib) | scalar | scalar |
| inflate | scalar | scalar | scalar |

**Proposed ISA use (not merged):** PR #1099 uses RVV 1.0 intrinsics from `riscv_vector.h` (byte loads, zero-extension to 16 bits, index vector for positional weights, reductions). It was measured on a Sophgo SG2042. No Zba, Zbb or Zbc use exists in mainline, no `.S` files exist for riscv64 and there is no runtime dispatch infrastructure.

**ISA profile:** zlib targets no profile; it is built for whatever baseline the compiler is configured with (typically RVA20U64 or RVA22U64 distribution defaults). The build system has no profile option. Because the library has no riscv64 code, there is no divergence from the [RISE Optimization Guide](https://riseproject.dev) to report. Compiler-level flags such as `-march=rva23u64` apply but give limited gains on scalar byte-oriented code.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems:** `./configure` with `make`, and CMake. Both are upstream-supported.

**Native build on riscv64 Linux:**

```
./configure && make -j$(nproc) && make test
```

**Cross-compilation with configure** (the pattern used by the existing ARM/PPC/s390x jobs):

```
CHOST=riscv64-linux-gnu ./configure --warn
make -j$(nproc)
QEMU_RUN="qemu-riscv64 -L /usr/riscv64-linux-gnu" make test
```

The `configure.yml` jobs use the variables `chost`, `packages` and `qemu-run`; a riscv64 job would use `gcc-riscv64-linux-gnu`, `libc-dev-riscv64-cross` and `qemu-user`.

**Cross-compilation with CMake:**

```
cmake -S . -B build -DCMAKE_TOOLCHAIN_FILE=riscv64-linux-gnu.cmake -DCMAKE_BUILD_TYPE=Release
cmake --build build
```

No toolchain files are shipped upstream for any architecture, so the user supplies `riscv64-linux-gnu.cmake`.

**Compiler versions:** No minimum GCC or Clang version is documented. The code is plain C89/C99 with no intrinsics, so any compiler that targets riscv64 works (GCC 7 and Clang 9 were the first releases with usable riscv64 backends) [NEEDS VERIFICATION: no upstream statement of a lower bound]. Merging PR #1099 would raise the requirement to a compiler with RVV 1.0 intrinsics (GCC 14, Clang 17 for the ratified intrinsic API) [NEEDS VERIFICATION].

**QEMU:** Documented implicitly through `QEMU_RUN`. zlib's test suite is small (a few seconds), so QEMU user-mode overhead is negligible.

**Known build failures:** None recorded for riscv64 in the issue tracker or the OpenBSD CI job.

**ABI:** zlib exposes a plain C ABI with no psABI-sensitive constructs; no riscv64 ABI incompatibilities are known.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| deflate / inflate / gzip / raw | full | full | full |
| minizip / contrib | full | full | full |
| Accelerated CRC-32 | partial | full (hardware instruction) | missing |
| Accelerated Adler-32 | missing | missing | missing (RVV proposal pending) |
| Accelerated longest_match | partial (opt-in asm) | missing | missing |
| Runtime CPU dispatch | missing | partial (compile-time feature test) | missing |

**Functional gaps:** none. The library is pure portable C.

**Performance gaps:** Mainline zlib carries little SIMD for any architecture, so the gap to amd64 is small; the gap to arm64 is the CRC-32 hardware path. The only measured RISC-V datum is the +7% decompression claim for RVV Adler-32 on SG2042 in PR #1099 (lzbench), which is a contributor claim and not independently reproduced [NEEDS VERIFICATION]. For CRC-32, Zbc/Zbkc carry-less multiply folding (as used by [zlib-ng](zlib-ng.md)) is expected to give several-fold speedups on gzip-heavy workloads relative to the scalar loop [NEEDS VERIFICATION: no zlib benchmark]. No RISE benchmark data for zlib was found.

**Security hardening:** nothing riscv64-specific. Distribution toolchain defaults (stack protector, PIE, fortify) apply as for any C code.

**Floating point / NaN:** not applicable; zlib performs no floating-point arithmetic.

---

## 7. CI/CD Infrastructure

The CI definitions were read from the `develop` branch workflows (`c-std.yml`, `cmake.yml`, `configure.yml`, `contribs.yml`, `fuzz.yml`, `msys-cygwin.yml`, `others.yml`).

- The only riscv64 job is the `riscv64` matrix entry of the OpenBSD job in `others.yml`, using `vmactions/openbsd-vm@v1` with `arch: riscv64`. It installs cmake and runs `cmake . -B build -DZLIB_BUILD_MINIZIP=ON -DMINIZIP_ENABLE_BZIP2=ON`, `cmake --build build/` and `ctest --test-dir build`. It therefore builds and runs the test suite.
- The job runs inside an emulated VM on an x86 GitHub-hosted runner. It is not native hardware and does not use RISE runners.
- `configure.yml` has Linux QEMU jobs for ARM, AArch64, PowerPC, PowerPC64, PowerPC64LE and s390x, but no riscv64 job.
- No `.cirrus.yml`, `.gitlab-ci.yml` or Jenkinsfile is present.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI system | GitHub Actions (native) | GitHub Actions (QEMU user-mode, VM) | GitHub Actions (OpenBSD VM) |
| Runs tests | Yes | Yes | Yes (ctest) |
| Release-blocking | No formal policy | No formal policy | No formal policy |
| Pre-merge verification | Yes | Yes | Yes (OpenBSD only) |

**RISE runners:** not used and no request to adopt them was found. They would allow a native Linux job in a few lines of workflow. **Hardware used by contributors:** the SG2042 for the RVV Adler-32 PR. The RISE board farm availability of that board is [NEEDS VERIFICATION].

**Impact of the gap:** no riscv64 Linux regression has been recorded against zlib, so the lack of Linux CI has not caused a known bug. The risk is that future SIMD or build changes are untested on Linux riscv64.

---

## 8. Distribution and Release Status

**Upstream releases:** source tarballs and PGP signatures only. No binaries are published for any architecture. The `develop` branch reports version 1.4 in `zlib.h`; the last tagged release known to the author is 1.3.2 [NEEDS VERIFICATION].

| Channel | Package | riscv64 status |
|---|---|---|
| Ubuntu 26.04 (resolute) | `zlib1g`, `zlib1g-dev` | Present on riscv64 in the Ubuntu binary package index |
| Ubuntu 24.04 (noble) | `zlib1g` 1:1.3.dfsg-3.1ubuntu2 | Built for riscv64 [NEEDS VERIFICATION: re-checked from earlier research only] |
| Debian (sid / trixie) | `zlib` | Built for riscv64 [NEEDS VERIFICATION: tracker not reachable] |
| Arch Linux RISC-V | `zlib` 1:1.3.2-3 | Present [NEEDS VERIFICATION] |
| Fedora Rawhide | `zlib-ng-compat` provides `zlib` | [NEEDS VERIFICATION: not checked] |
| Alpine edge | `zlib` 1.3.2 | Present for riscv64 [NEEDS VERIFICATION] |
| PyPI | n/a | zlib is part of CPython; there is no standalone wheel. The RISE wheel index has no `zlib` package (the lookup redirects to PyPI) |

**Release provider:** distributions, not upstream. A user obtains a working binary with the distribution package manager (`apt install zlib1g`). A source build takes seconds on any riscv64 board.

---

## 9. Dependencies

zlib has no library dependencies. Build-time and runtime requirements are the platform toolchain and C library.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| [GCC](gcc.md) | C compiler (build) | yes | yes | yes (all distros) | GNU project |
| CMake | Alternate build system (build, optional) | yes | yes | yes (graph and distros) | Kitware |
| [glibc](glibc.md) | C runtime | yes | yes | yes (all distros) | GNU project |

Clang/LLVM is an equally valid compiler. The minizip contrib optionally uses bzip2 (`MINIZIP_ENABLE_BZIP2`), which is pure C and packaged on riscv64 distributions. No dependency has open riscv64 blockers known to the author. The [GCC](gcc.md) and [glibc](glibc.md) reports cover those projects in more detail.

The related fork [zlib-ng](zlib-ng.md) is a separate project, not a dependency of zlib. It ships RVV and Zbc code and runs riscv64 CI; it is the practical vehicle for RISC-V compression performance work.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1099](https://github.com/madler/zlib/pull/1099) | RVV-optimized Adler-32 | Unmerged as last known [NEEDS VERIFICATION] | Low (performance) | Opened 2025-10-28, little maintainer response |
| [#1267](https://github.com/madler/zlib/pull/1267) | Duplicate RVV Adler-32 PR | Closed by author [NEEDS VERIFICATION] | n/a | Opened 2026-06-10 |

No riscv64 correctness bug is known: no crash, wrong-result or test failure is recorded against riscv64. Performance and tooling issues are limited to the missing RVV and CRC-32 paths described above.

---

## 12. Objections and Upstream Blockers

**Stated objections:** none found. The maintainer has not commented publicly on RISC-V support that the author could find.

**Technical blockers:** none for correctness. Merging architecture code needs a runtime dispatch story: mainline zlib has none, and RVV code must handle hardware without the V extension or with differing VLEN.

**Organizational blockers:** single maintainer with a long review backlog for architecture SIMD patches (the Power8 precedent), no co-maintainer, and a large open issue count.

**Acceptance probability:** correctness-only changes and CI additions (such as the OpenBSD riscv64 job) are accepted. SIMD contributions have a low near-term probability of review based on the Power8 precedent; this is a judgment, not a stated policy.

---

## 13. Readiness Assessment

**Color:** blue (case: not applicable; upstream CI builds and tests riscv64 but upstream publishes no artifact)
**Release provider:** Linux distributions (Ubuntu, Debian, Arch Linux RISC-V); release provided by distributions, not upstream.

zlib is not an optimization-purpose project: its value is the DEFLATE format and API, which the portable C code delivers on riscv64. No optimization cap applies. Upstream CI in [others.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/others.yml) builds and runs `ctest` on OpenBSD riscv64, so the CI condition for blue is met, with two caveats: the job runs on OpenBSD, not Linux, and runs in a VM. Upstream publishes no binary artifacts for any architecture, which excludes green. The distribution floor does not apply because upstream CI exists. Ubuntu 26.04 riscv64 availability is confirmed in the package index.

**Pending work:** PR #1099 (RVV Adler-32) could add optimization code; adding a Linux job to `configure.yml` would remove the OpenBSD-only caveat. Neither changes the color.

---

## 14. Investment Analysis

RISE has no known work on zlib, so nothing is subtracted from the sizing.

**14.1 Functional enablement:** none required. zlib is functionally complete on riscv64 and distributions ship it.

**14.2 Performance optimization:** the RVV Adler-32 patch exists (PR #1099) and needs review, benchmarking on current hardware, and a dispatch decision. A Zbc/Zbkc CRC-32 folding path is new work, analogous to the AArch64 path, in C with intrinsics or inline assembly; zlib-ng's implementation is a design reference. The [RISE Optimization Guide](https://riseproject.dev) baseline would guide extension selection. Expected gain is workload dependent; see Section 6.

**14.3 CI/CD:** adding a Linux riscv64 job to `configure.yml` follows the existing pattern of six non-x86 jobs. A native job on RISE runners is possible if RISE capacity is available for this repository; QEMU user-mode is sufficient for a library of this size.

**14.4 Ecosystem enablement:** not applicable as a separate item. Downstream ecosystems already receive zlib from distributions.

**14.5 Summary**

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add Linux riscv64 QEMU job to `configure.yml` | 0.5 | Any contributor | High |
| Performance | Review and upstream RVV Adler-32 (PR #1099) | 2 | RISC-V vendor | Medium |
| Performance | Zbc/Zbkc CRC-32 path | 3 | RISC-V vendor | Medium |
| Performance | Runtime dispatch (hwcap) for RVV/Zbc | 1 | RISC-V vendor | Medium |
| Upstream engagement | Maintainer engagement on architecture patches | 1 (recurring) | RISC-V vendor | Low |

Total: about 7.5 person-weeks. The main risk is maintainer responsiveness, not engineering effort. If RISC-V compression performance is the goal, [zlib-ng](zlib-ng.md) is the more actionable target.

---

## 15. References

- [madler/zlib repository](https://github.com/madler/zlib)
- [zlib homepage](https://zlib.net/)
- [PR #1099 - RVV-optimized Adler-32](https://github.com/madler/zlib/pull/1099)
- [PR #1139 - More tests (OpenBSD riscv64 CI)](https://github.com/madler/zlib/pull/1139)
- [PR #1267 - RVV-optimized Adler-32 (duplicate)](https://github.com/madler/zlib/pull/1267)
- [zlib releases](https://github.com/madler/zlib/releases)
- [others.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/others.yml)
- [configure.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/configure.yml)
- [Ubuntu packages: zlib](https://packages.ubuntu.com/search?keywords=zlib&searchon=names&suite=resolute&section=all)
- [Debian tracker: zlib](https://tracker.debian.org/pkg/zlib)
- [Arch Linux RISC-V packages](https://archriscv.felixc.at/)
- [RISE Project blog](https://riseproject.dev/blog)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
