---
title: zlib
parent: Project Reports
color: blue
dependencies:
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: GNU make
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="zlib" %}

# zlib

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-11-17<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for zlib<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

zlib is a portable, lossless compression library implementing DEFLATE (RFC 1950/1951), written in portable C. It provides `deflate`, `inflate`, and Adler-32 and CRC-32 checksum primitives. The root `CMakeLists.txt` declares `LANGUAGES C` and has no `find_package` or `FetchContent` calls, so the only inputs are a C toolchain, libc and a build tool. Source: [madler/zlib](https://github.com/madler/zlib), commit 99623ef on `develop`.

**Governance:** Single-maintainer project. [zlib.net](https://zlib.net/) names no foundation, fiscal host or steering body. The library was written by Jean-loup Gailly (compression) and Mark Adler (decompression). Of the 30 most recent commits, about 20 are authored by Mark Adler (personal address) and he is the committer on all of them. The rest are one-off external contributors with 1-2 commits each. The only visible corporate address is one Microsoft commit, a drive-by fix. The root listing has no MAINTAINERS, OWNERS, CODEOWNERS, PLATFORMS.md or SUPPORT.md, and `.github/` contains only `workflows/`. Questions go to Mark by email; the `zlib-devel` list is for contributors and testers of new versions.

**License:** zlib license (permissive, BSD-style). [NEEDS VERIFICATION: I did not open the LICENSE file; this is the standard zlib license per [zlib.net](https://zlib.net/zlib_license.html).]

**Sponsors:** No sponsor list found. zlib.net credits security findings to Trail of Bits, 7ASecurity, Theorem and Oculytic; these are auditors and reporters, not sponsors or maintainers.

**RISE membership:** zlib is not a member. The [RISE members page](https://riseproject.dev/members/) (updated 2026-01-09) lists 8 premier members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and 13 general members (including Canonical, SpacemiT and ZTE). Neither zlib nor Mark Adler appears.

**Culture toward new ports:** No written policy. Upstream accepts small platform and build fixes (the 1.4 release notes list Android, AIX, PowerPC, s390x and ARM64 Windows work, and no RISC-V). The one RISC-V source PR has been open for about a year with 1 comment and no merge (see Section 2). This is a single data point; the PR comment thread was not read in full. The existing claims that s390x CRC-32 vector code merged in 1.3.2 and that Power8 SIMD PRs from 2019 are still unreviewed are [NEEDS VERIFICATION]: the live research did not re-check them.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-10-28 | PR #1099 opened: RVV-optimized Adler32 by leiwen2025. Author reports a 7% decompression speedup on SG2042 using lzbench. Still open, 1 comment, last updated 2025-11-18, no merge. | [PR #1099](https://github.com/madler/zlib/pull/1099) |
| 2025-12-25 | PR #1139 "More tests" opened by Vollstrecker: CI on DragonflyBSD, FreeBSD, NetBSD, OpenBSD (aarch64, x86_64, riscv64), OmniOS, OpenIndiana, Solaris. FreeBSD on riscv64 excluded because it has no packages. | [PR #1139](https://github.com/madler/zlib/pull/1139) |
| 2026-01-28 | Mark Adler comments "Applied. Thanks." and closes PR #1139. The GitHub API shows `merged:false`, but the commits were applied individually to `develop` (committer dates 2026-01-28 02:07-02:16Z). The OpenBSD riscv64 matrix entry is at `others.yml:106` on `develop`. | [PR #1139](https://github.com/madler/zlib/pull/1139) |
| 2026-03-29 | Follow-up commit `bc406b9` switches the vmactions jobs to `sync: scp`. | commit history of `others.yml` |
| 2026-06-10 | PR #1267 (same title and body as #1099) opened and closed the same day; apparent duplicate or retry. | [PR #1267](https://github.com/madler/zlib/pull/1267) |
| 2026-11-04 | Release 1.4. Notes list Android, AIX, PowerPC, s390x and ARM64 Windows platform work; no RISC-V. | [zlib.net](https://zlib.net/) |

Discrepancy: PR #1139 is "closed, unmerged" in the API but its content is on `develop`. Which release first contains the riscv64 CI entry was not determined; it is CI-only and does not change library source.

**Is RISC-V fully upstream?** No. The only RISC-V content is one CI matrix entry. Code search for `riscv`, `riscv64`, `rvv`, `vfloat32m1_t` and `__riscv` finds one hit (`.github/workflows/others.yml`) or none, and the whole tree contains only `others.yml:106`. There are no RISC-V commits (commit search for `riscv` finds none) and no RISC-V issues.

**Contributors:** Vollstrecker (CI author, no corporate affiliation found). leiwen2025 (author of #1099 and #1267). The existing assertion that leiwen2025 belongs to the `zte-riscv` org at ZTE is [NEEDS VERIFICATION]; the live findings state no company affiliation.

## 3. Upstream Support Tier

zlib has no documented platform tier or support policy. It is built for "virtually any computer hardware and operating system"; platform support lives in per-platform root directories (amiga, msdos, os400, qnx, watcom, win32).

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds in upstream CI | Yes (`cmake.yml`, `configure.yml`) | Yes (`configure.yml` QEMU user-mode; OpenBSD VM) | Yes, OpenBSD VM only (`others.yml`) |
| Linux CI | Yes | Yes (QEMU) | No |
| Tests run in CI | Yes | Yes | Yes (`ctest` in the OpenBSD VM) |
| Release-blocking | Not documented | Not documented | Not documented |
| Arch-specific source | Yes (`contrib/gcc_gvmat64/gvmat64.S`, `W=8` in `crc32.c`) | Yes (`ARMCRC32` path in `crc32.c`) | None |
| Official binaries | No (source-only) | No | No |
| Distro packages | Yes | Yes | Yes |

## 4. Technical Architecture and RISC-V-Specific Subsystems

zlib has no JIT, crypto or GC. Arch-relevant components:

- **Adler-32** (`adler32.c`): scalar C. RVV version proposed in unmerged PR #1099.
- **CRC-32** (`crc32.c`): `crc32.c:89` selects word size `W=8` for `__x86_64__` or `__aarch64__`; other architectures, riscv64 included, get `W=4`. `crc32.c:109` defines `ARMCRC32` when `__aarch64__` and `__ARM_FEATURE_CRC32` are set and `W==8`. s390x has a vector CRC in `contrib/crc32vx/` (`crc32_vx.c` 254 lines, `crc32_vx_hooks.h` 9, `CMakeLists.txt` 67).
- **longest_match:** amd64 assembly in `contrib/gcc_gvmat64/gvmat64.S` (570 lines, optional contrib). No arm64 or riscv64 equivalent.
- **Inflate:** portable C on all platforms.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Deflate/inflate core | scalar C | scalar C | scalar C |
| longest_match assembly (contrib) | full (optional) | missing | missing |
| CRC-32 | scalar, 8-byte word C (`W=8`) | partial (hardware CRC32 when compiler targets it) | scalar, 4-byte word C (`W=4`) |
| Adler-32 | scalar C | scalar C | scalar C (RVV in PR #1099, unmerged) |
| SIMD (SSE, AVX, NEON, RVV) | missing | missing | missing |

The repository has no `arch/` directory, no riscv `.S` files, no JIT backend, and no SIMD dispatch infrastructure. PR #1099 uses RVV intrinsics and was benchmarked on SG2042; its instruction-level detail (specific intrinsics, 104 lines) comes from the existing analysis only and is [NEEDS VERIFICATION]. In practice riscv64 builds and runs through portable C; I did not execute it.

## 5. Build System, Cross-Compilation, and Toolchain

zlib has no riscv64-specific build documentation, toolchain file, Dockerfile or compiler minimum. Files checked and absent: `README.md` (repo has `README` and `README-cmake.md`), `BUILDING.md`, `INSTALL`, `docs/building.md`, `cmake/riscv64.cmake`, `Dockerfile.riscv64`. A grep for `riscv`, `qemu`, `cross`, `toolchain` in `CMakeLists.txt`, `configure`, `README`, `README-cmake.md` found no riscv mention.

**CMake** (from `README-cmake.md`): `cmake -S . -B build -D CMAKE_BUILD_TYPE=Release`. `CMakeLists.txt` sets `cmake_minimum_required(VERSION 3.15...3.31)`. Options: `ZLIB_BUILD_TESTING`, `ZLIB_BUILD_SHARED`, `ZLIB_BUILD_STATIC`, `ZLIB_BUILD_MINIZIP`, `ZLIB_INSTALL`, `ZLIB_PREFIX`, and `MINIZIP_BUILD_SHARED`, `MINIZIP_BUILD_STATIC`, `MINIZIP_BUILD_TESTING`, `MINIZIP_ENABLE_BZIP2`, `MINIZIP_INSTALL`. There are no `USE_*` or riscv-specific switches.

**configure:** honours `CHOST`, which becomes `CROSS_PREFIX="${CHOST}-"` and selects `${CROSS_PREFIX}gcc`, `ar`, `ranlib`, `nm`. `Makefile.in` runs tests through `QEMU_RUN`.

**QEMU pattern** in `configure.yml` (arm, armhf, aarch64, ppc, ppc64, ppc64le, s390x; no riscv64):
```
apt-get install qemu-system qemu-user gcc-<triple> libc-dev-<arch>-cross
CC=<triple>-gcc CHOST=<triple> ./configure --warn
make -j2
QEMU_RUN="qemu-<arch> -L /usr/<triple>" make test
```
A riscv64 equivalent would use `gcc-riscv64-linux-gnu`, `libc-dev-riscv64-cross` and `qemu-riscv64 -L /usr/riscv64-linux-gnu`. This is extrapolated from the pattern; it is not in the repo and I did not run it.

**Toolchain versions:** No GCC or Clang minimum is documented. The only stated requirement is CMake 3.15. The existing report's lower bounds (GCC 7, Clang 6) are not from upstream [NEEDS VERIFICATION].

**Known build failures on riscv64:** none found in madler/zlib. `riscv64 repo:madler/zlib` issue search returned #1200 (s390x musl build failure), #143 (32-bit cross-compile), #413 (Windows amd64 asm), #416 (arm64 implicit declaration); none concern RISC-V.

**Observed CI oddity:** in `others.yml` the `prepare:` block reads `pkg_add cmake` followed by a bare `bzip2` line, probably a typo for `pkg_add bzip2`. I did not test its effect; if bzip2 is missing, `-DMINIZIP_ENABLE_BZIP2=ON` may fail or be ignored.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** none found. The library is portable C; the riscv64 OpenBSD CI builds and runs `ctest`.

**Performance gaps:** upstream has no RISC-V benchmark data. All RISC-V numbers found are from zlib-ng, a separate project:

- [zlib-ng PR #1905](https://github.com/zlib-ng/zlib-ng/pull/1905) (CRC32 with Zbc, merged 2025-04-27, tested on a "musebook"; no compiler, flags or core model given). Author reports "4x~7x speedup when data_len >= 16". Times in ns:

| Bytes | generic_chorba | braid | riscv (Zbc) |
|---|---|---|---|
| 1 | 17.5 | 16.2 | 24.2 |
| 8 | 51.9 | 50.0 | 57.3 |
| 12 | 85.7 | 73.6 | 89.6 |
| 16 | 98.3 | 86.4 | 24.7 |
| 64 | 308 | 263 | 40.3 |
| 4096 | 6422 | 11298 | 1306 |
| 4194304 | 8142963 | 11938022 | 1368543 |

At 4 MiB, Zbc is about 5.9x faster than Chorba and 8.7x faster than braid. For 1 to 12 bytes Zbc is slower. [NEEDS VERIFICATION: single source.]

- [zlib-ng PR #1522](https://github.com/zlib-ng/zlib-ng/pull/1522) (`slide_hash` RVV, merged 2023-06-23, SiFive p470 FPGA): speedup over scalar 7.7x (1024) to 8.6x (8192).
- [zlib-ng PR #1532](https://github.com/zlib-ng/zlib-ng/pull/1532) (`adler32` RVV, merged 2023-07-16, same FPGA): speedup 1.6x to 1.8x.
- The 7% SG2042 decompression figure for the unmerged madler/zlib RVV Adler32 PR #1099 is the only upstream-zlib number, and comes from the PR author.

No riscv64-versus-arm64 zlib benchmark was found (RISE blog and web searches).

**Security hardening gaps:** none found. **Floating point / NaN:** not applicable; zlib has no floating-point hot paths, and a `riscv nan floating` search on madler/zlib returned nothing.

**FreeBSD/riscv64:** excluded from CI in PR #1139 because it has no packages [NEEDS VERIFICATION: current package status not checked].

## 7. CI/CD Infrastructure

The repository has seven workflows (`c-std.yml`, `cmake.yml`, `configure.yml`, `contribs.yml`, `fuzz.yml`, `msys-cygwin.yml`, `others.yml`) at commit 99623ef. `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml` and `.travis.yml` return 404. Only `others.yml` (workflow `anyVM-OSes`) contains "riscv".

- **Triggers:** `on: [push, pull_request]`; no schedule, no `workflow_dispatch`.
- **Runner:** `ubuntu-latest` (x86). The `vmactions/openbsd-vm@v1` action boots an OpenBSD guest for `arch: ${{ matrix.name }}`. The job is emulated, not native riscv64 hardware. The workflow does not name QEMU. [NEEDS VERIFICATION: the emulator used by the action was not checked.]
- **Job (`openbsd`, lines 97-122):** matrix `aarch64`, `x86_64`, `riscv64` (line 106), `fail-fast: false`. Steps: `cmake . -B build -DZLIB_BUILD_MINIZIP=ON -DMINIZIP_ENABLE_BZIP2=ON`, `cmake --build build/`, `ctest --test-dir build`.
- I did not check whether the job has run or passed.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Workflow | `cmake.yml`, `configure.yml`, `c-std.yml`, `fuzz.yml` | `configure.yml`, `c-std.yml`, `others.yml` | `others.yml` |
| OS | Linux and others | Linux (QEMU), OpenBSD | OpenBSD only |
| Hardware | x86 runners | QEMU user-mode; emulated VM | emulated VM |
| Linux coverage | Yes | Yes | No |
| Build system tested | CMake, configure | configure, CMake | CMake |
| RISE runners | No | No | No |

[RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) are not used by madler/zlib; no zlib-specific runner usage was found.

## 8. Distribution and Release Status

**Upstream releases:** source-only. Releases v1.4, v1.3.2, v1.3.1, v1.3 and v1.2.13 ship `.tar.gz`, `.tar.xz`, `.zip` and `.asc` signatures; no filename contains "riscv". No riscv64 binaries from upstream.

| Channel | Finding | riscv64 |
|---|---|---|
| Ubuntu 26.04 (resolute) `zlib1g`, `zlib1g-dev` | Project graph returns both for resolute/riscv64; [package page](https://packages.ubuntu.com/resolute/zlib1g) links `riscv64/zlib1g/download` | Yes |
| Ubuntu 26.04 `zlib`, `python3-zlib`, `libzlib` | No such package names | No |
| Debian sid `zlib` | 1:1.3.dfsg+really1.3.2-3, installed on riscv64 (builder rv-manda-03) [NEEDS VERIFICATION: single source] | Yes |
| Arch Linux RISC-V `zlib`, `zlib-static` | 1:1.3.2-3, built 2026-03-09 per the [RISE-era mirror listing](https://riscv.mirror.pkgbuild.com/repo/core/) [NEEDS VERIFICATION: archriscv.felixc.at could not be queried in a second check] | Likely yes |
| Alpine edge `zlib` | 1.3.2-r0, built 2026-03-05 [NEEDS VERIFICATION: single source; Alpine riscv64 pages also surfaced in web search] | Yes |
| PyPI `zlib` | HTTP 404; no such project. Python's `zlib` module ships in CPython. The RISE index lists only unrelated `zlib-state` and `cmeel-zlib` | N/A |
| conda-forge | [zlib-feedstock PR #92](https://github.com/conda-forge/zlib-feedstock/pull/92) "FEA: add riscv64" closed 2026-05-19, unmerged: maintainers want the riscv64 compiler and migrator first, and rejected zig as compiler | Not yet via this PR |
| RISE Mirror (Rocky 10) | hosts riscv64 `zlib-ng` 2.2.3 RPMs (zlib-ng, not zlib) | zlib-ng only |

I did not confirm `zlib1g-dev` page-level riscv64 build separately, but the project graph returned it for resolute/riscv64.

**What a user must do:** install the distro package (`apt install zlib1g zlib1g-dev` on Ubuntu/Debian) or build from source with CMake or `./configure`. No further steps.

## 9. Dependencies

zlib has no external library dependencies. The graph query for transitive dependencies was not run because the manifest lists none. No dependency appears in `projects.yml`, so no dependency reports apply.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| glibc | runtime-dependency (critical); libc used via `off64_t`, `fseeko`, `stdarg.h`, `unistd.h` checks | Packaged in Ubuntu 26.04 riscv64 (`libc6`, `libc6-dev`, project graph) | Not checked upstream | Distro-provided | No blockers found; I did not search glibc issues for riscv64 |
| GCC | build-dependency (critical); C compiler | [NEEDS VERIFICATION: no GCC-specific graph result in the findings; riscv64 cross toolchain `gcc-riscv64-linux-gnu` named only by extrapolation] | Not checked | Not checked | No blockers found |
| CMake | build-dependency (optional); `configure` is an alternative | Packaged in Ubuntu 26.04 riscv64 (project graph); CI installs `cmake` in OpenBSD riscv64 VM | Used by `ctest` in OpenBSD riscv64 CI | Distro-provided | No blockers found; I did not search CMake issues for riscv64 |
| GNU make | build-dependency (optional); used by `configure` flow | Data not available: no graph or package query run for make | Not checked | Not checked | None found |

No SIMD, JIT, crypto or allocator dependencies. **Related forks (not dependencies):** zlib-ng has RVV code for adler32, chunkmemset, compare256, longest_match, slide_hash and inflate_fast, and Zbc for crc32 (per DeepWiki, [NEEDS VERIFICATION]). zlib-rs has no report.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1099](https://github.com/madler/zlib/pull/1099) | Add RVV-optimized implementation for Adler32 | Open PR | Low (performance) | Opened 2025-10-28; 1 comment; no merge |
| [#1267](https://github.com/madler/zlib/pull/1267) | Same title (duplicate) | Closed | N/A | Opened and closed 2026-06-10 |
| [#1139](https://github.com/madler/zlib/pull/1139) | More tests (OpenBSD riscv64 CI) | Closed (API: unmerged; commits applied) | N/A | See Section 2 |

No RISC-V correctness bugs exist in madler/zlib. `riscv64 bug` searches returned no RISC-V issues.

**zlib-ng RISC-V bugs (separate project, for context; all closed unless noted):**

| Issue | Date | Problem |
|---|---|---|
| [#941](https://github.com/zlib-ng/zlib-ng/issues/941) | 2021-05-02 | riscv64 cmake support broken; fixed by PR #942 |
| #1670 | 2024-02-16 | Unaligned read in RVV chunkset; closed 2026-07-15 |
| #1705 | 2024-03-27 | RVV enabled accidentally, SIGILL on older kernels |
| [#1936](https://github.com/zlib-ng/zlib-ng/issues/1936) | 2025-07-11 | SIGILL in `riscv_check_features` (`riscv_features.c:70`) cross-built with `-static-pie`; closed 2025-08-29 without a fix when reporter could not reproduce on newer images. Root cause: inline `vsetvli`/`csrr vtype` probe traps on kernels/CPUs without RVV |
| #1997 | 2025-11-08 | Zbc detection used undefined `HWCAP_ISA_ZBC`; closed 2026-05-13 |
| #2148 | 2026-02-11 | 2.3.3 build error, `crc32_riscv64_zbc` undeclared (Fedora riscv64); closed |
| #1769 | 2024-08-26 | "SSH connection to RISCV failed"; closed |

Open zlib-ng PRs mentioning riscv in passing: #1945, #2215, #2330, #2247, #2432, #2477, #2490, #2500, #2512 (not reviewed). The existing claim that zlib-ng PR #2152 fixed a Zbc-only build failure is [NEEDS VERIFICATION].

## 12. Objections and Upstream Blockers

**Stated objections:** none found. I did not read the full PR #1099 comment thread, so maintainer statements there are unconfirmed.

**Technical blockers:** none for correctness. PR #1099 is a complete implementation by the author's account, with no review recorded.

**Organizational blockers:** single maintainer, no documented review process or policy for architecture contributions; PR #1099 has had no merge for about a year.

**Acceptance probability for #1099:** low in the near term, based on one year of no merge. The evidence is thin (one data point). A prerequisite for any RISC-V code would be a Linux riscv64 CI job, which is a one-line QEMU matrix addition.

**zlib-ng:** the real RISC-V optimization work (RVV, Zbc) is in zlib-ng, a separate project. If RISC-V performance is the priority, zlib-ng is the more actionable target. [zlib-ng PR #1904](https://github.com/zlib-ng/zlib-ng/pull/1904) (merged 2025-05-01) added riscv configure support and RVV detection.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro

**Justification:** Upstream CI builds and tests riscv64: the `openbsd` job in [others.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/others.yml) (line 106, `riscv64`) runs cmake, build and ctest in an emulated OpenBSD VM on every push and PR. It is OpenBSD only, with no Linux riscv64 job. Upstream releases are source-only, and riscv64 binaries come from distros (Ubuntu 26.04 `zlib1g`/`zlib1g-dev`, Debian, Arch, Alpine): release provided by distro, not upstream. zlib is a portable-C reference implementation whose value is not RISC-V speed, so the optimization cap does not apply.

**Pending work that could change the grade:**
- RVV Adler32 PR [madler/zlib#1099](https://github.com/madler/zlib/pull/1099) (leiwen2025, ZTE-linked [NEEDS VERIFICATION]) open since 2025-10-28 with no maintainer response. Duplicate #1267 was self-closed.
- Adding riscv64 to the QEMU matrix in `configure.yml` would be a one-line Linux CI improvement.
- RISE has no direct zlib work: only an open zlib-ng tracking issue ([system-libraries-wg#5](https://github.com/riseproject-dev/system-libraries-wg/issues/5), opened 2026-07-15, empty body, milestone "future") and an Android zlib fork ([android_external_zlib](https://github.com/riseproject-dev/android_manifest), created 2026-10-12, branch `android-17`).

## 14. Investment Analysis

RISE involvement: no zlib work found. The only RISE items are the zlib-ng issue and Android fork above, with no scope, vendor or amount recorded. The [Conda post](https://riseproject.dev/2026/10/30/bringing-the-conda-ecosystem-to-risc-v/) mentions zlib once as part of Python's base stack. No sizing is subtracted. Effort figures below are estimates, not measured data.

### 14.1 Functional Enablement

None required. zlib builds and is packaged for riscv64 in distros.

### 14.2 Performance Optimization

PR #1099 (RVV Adler32) is already written; the gap is upstream acceptance. A Zbc CRC-32 path for madler/zlib does not exist (it exists in zlib-ng, PR #1905). Work if pursued: review and benchmark #1099; add Zbc CRC-32; add runtime detection. Note the zlib-ng #1936 and #1997 history: unconditional RVV probes and wrong HWCAP use caused SIGILL and misdetection, so any detection code should use `riscv_hwprobe`.

### 14.3 CI/CD Infrastructure

Add riscv64 to the `configure.yml` QEMU matrix, following the existing pattern for arm, aarch64, ppc, ppc64, ppc64le and s390x. Fix the bare `bzip2` line in `others.yml`. RISE RISC-V runners could provide native CI.

### 14.4 Ecosystem Enablement

Not applicable. zlib has no dependent package ecosystem to enable separately.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 Linux QEMU job to `configure.yml` | 0.5 | Any contributor | High |
| CI/CD | Fix `bzip2` prepare line in `others.yml` | 0.1 | Any contributor | Low |
| Performance | Review, benchmark and push PR #1099 (RVV Adler32) | 2 | RISC-V vendor | Medium |
| Performance | Zbc CRC-32 for madler/zlib | 3 | RISC-V vendor | Medium |
| Performance | Runtime detection (hwprobe) for RVV/Zbc | 1 | Dependent on above | Medium |
| Upstream engagement | Engage maintainer on SIMD PRs | 1 (recurring) | Interested vendor | Low |

Total: about 7.5 person-weeks. The largest risk is maintainer responsiveness; zlib-ng is the alternative target.

## 15. References

- [madler/zlib repository](https://github.com/madler/zlib)
- [zlib homepage](https://zlib.net/)
- [PR #1099: RVV Adler32](https://github.com/madler/zlib/pull/1099)
- [PR #1139: More tests (OpenBSD riscv64 CI)](https://github.com/madler/zlib/pull/1139)
- [PR #1267: duplicate RVV Adler32](https://github.com/madler/zlib/pull/1267)
- [CI workflow: others.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/others.yml)
- [CI workflow: configure.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/configure.yml)
- [madler/zlib releases](https://github.com/madler/zlib/releases)
- [Ubuntu 26.04 zlib1g package page](https://packages.ubuntu.com/resolute/zlib1g)
- [Arch Linux RISC-V mirror: core repo](https://riscv.mirror.pkgbuild.com/repo/core/)
- [Debian buildd: zlib sid](https://buildd.debian.org/status/package.php?p=zlib&suite=sid)
- [zlib-ng PR #1904: riscv configure support](https://github.com/zlib-ng/zlib-ng/pull/1904)
- [zlib-ng PR #1905: Zbc CRC32](https://github.com/zlib-ng/zlib-ng/pull/1905)
- [zlib-ng PR #1522: slide_hash RVV](https://github.com/zlib-ng/zlib-ng/pull/1522)
- [zlib-ng PR #1532: adler32 RVV](https://github.com/zlib-ng/zlib-ng/pull/1532)
- [zlib-ng issue #941](https://github.com/zlib-ng/zlib-ng/issues/941)
- [zlib-ng issue #1936](https://github.com/zlib-ng/zlib-ng/issues/1936)
- [conda-forge zlib-feedstock PR #92](https://github.com/conda-forge/zlib-feedstock/pull/92)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog: Bringing the Conda Ecosystem to RISC-V](https://riseproject.dev/2026/10/30/bringing-the-conda-ecosystem-to-risc-v/)
- [RISE system-libraries-wg issue #5: zlib-ng](https://github.com/riseproject-dev/system-libraries-wg/issues/5)
- [riseproject-dev/android_manifest](https://github.com/riseproject-dev/android_manifest)
- [RISE webinar December 2024 (PDF)](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)
