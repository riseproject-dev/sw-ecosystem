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
  - name: bzip2
    relation: runtime-dependency
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

zlib is a portable, lossless data compression library implementing DEFLATE (RFC 1950/1951), written in C. It provides `deflate`, `inflate`, and the Adler-32 and CRC-32 checksums. The only external dependency is the C library.

**Governance:** Single-maintainer, BDFL-style. [zlib.net](https://zlib.net/) credits Jean-loup Gailly (compression) and Mark Adler (decompression), with the web pages maintained by Mark Adler. Mark Adler (madler) is the only committer: every one of the last 30 commits lists him as committer. The repository has no MAINTAINERS, OWNERS, CODEOWNERS, SUPPORT.md or PLATFORMS.md. A `zlib-devel` mailing list exists for contributors and testers. Contributions go through GitHub, and the 30 latest commits were all merged within days.

**License:** zlib license (permissive). Only the link on zlib.net and the LICENSE file were confirmed; the text was not opened.

**Current release:** zlib 1.4. zlib.net dates it 2026-11-04; the GitHub releases API shows it published 2026-11-05. The dates differ by one day, probably a timezone or publication-order difference.

**Corporate sponsors:** None listed on zlib.net. Security audits are credited to outside firms (7ASecurity, Trail of Bits), which are not sponsors. External contributors are one-off or occasional. Employer evidence exists only for Bhagirath Mehta (`@microsoft.com` author email on one commit) and Jason Gross (`@theorem.dev` email, bug credited to "Theorem"). No company holds sustained contributor representation.

**RISE membership:** zlib is not a RISE member. The [RISE members page](https://riseproject.dev/members/) (last updated 2026-01-09) lists Premier members Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive and Tenstorrent, and General members Akeana, Andes, ESWIN, BOSC, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT and ZTE. RISE tracks zlib-ng, the fork, as project SL_00_005 (see Section 14). Data not available: any RISE RFP or funded project for madler/zlib; searched the RISE blog index (about 38 post titles, none mention zlib), `riseproject.dev/?s=zlib`, and the RISE wiki (blocked by a cookie wall).

**Culture toward new ports:** No stated policy. No maintainer statement on RISC-V is known [NEEDS VERIFICATION: issues and PRs not fully reviewed, see Section 11]. Arch-specific code in the tree is accepted in small, self-contained forms: `contrib/crc32vx` (s390x), `contrib/gcc_gvmat64` (x86-64), and a compile-time ARM CRC32 path in `crc32.c`. A RISC-V port would most likely follow the `contrib/` or CI-matrix pattern; this is an inference, not stated policy. The existing assessment that Power8/Power9 SIMD PRs (#458, #459, #468, #478, filed 2019-2020) remain open without maintainer response, and that the repository has about 270 open issues, is [NEEDS VERIFICATION] (not re-checked).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-10-28 | PR #1099 opened: RVV-accelerated Adler-32 by leiwen2025 (zte-riscv org), claiming 7% decompression improvement on SG2042 via lzbench. [NEEDS VERIFICATION] | [PR #1099](https://github.com/madler/zlib/pull/1099) |
| 2025-11-17 | One comment on PR #1099 pinging madler; no maintainer response. [NEEDS VERIFICATION] | [PR #1099](https://github.com/madler/zlib/pull/1099) |
| 2025-12-25 | Commit c5c3b0b by Vollstrecker, "Check multiple architectures in *BSD workflows", adds `riscv64` to the OpenBSD CI matrix. It is the first and only commit introducing the string `riscv64` (`git log -S riscv64`). Linked to PR #1139 [NEEDS VERIFICATION: PR contents not reviewed]. | [PR #1139](https://github.com/madler/zlib/pull/1139) |
| 2026-01-28 | PR #1139 merged by madler. [NEEDS VERIFICATION] (previously gathered; the PR was unreadable in the latest research) | [PR #1139](https://github.com/madler/zlib/pull/1139) |
| 2026-06-10 | PR #1267 opened and self-closed same day: duplicate RVV Adler-32 submission. [NEEDS VERIFICATION] | [PR #1267](https://github.com/madler/zlib/pull/1267) |
| 2026-11-04/05 | zlib 1.4 released. No RISC-V source changes found. | [zlib.net](https://zlib.net/), [releases](https://github.com/madler/zlib/releases) |

**Is RISC-V fully upstream?** No. The only RISC-V content is a CI matrix entry. Searches of the repository for `riscv`, `riscv64`, `rvv`, `vfloat32m1_t` and `__riscv` return only `.github/workflows/others.yml`. At commit 99623ef there is no `__riscv` guard, assembly file, intrinsic, RVV or Zbc code anywhere. No commit messages mention "riscv" or "RISC-V".

**Key contributors:**
- Vollstrecker (Werner, werner@vollstreckernet.de): author of the multi-architecture BSD workflow commit. No corporate affiliation confirmed.
- leiwen2025 (zte-riscv org, ZTE): author of the unmerged RVV Adler-32 PR. [NEEDS VERIFICATION: exact employer]

## 3. Upstream Support Tier

No platform tier, support or PLATFORMS document exists. Platform support is informal, described by `README`, `FAQ` and top-level directories (`amiga`, `msdos`, `os400`, `qnx`, `watcom`, `win32`, plus `make_vms.com`).

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds in upstream CI | Yes (`cmake.yml`, `configure.yml`, `c-std.yml`) | Yes (`configure.yml` qemu-user, `c-std.yml`) | Yes, OpenBSD only (`others.yml`, emulated VM) |
| Tests in upstream CI | Yes | Yes | Yes, OpenBSD only (`ctest`) |
| Linux CI | Yes | Yes | No |
| Arch-specific source | contrib asm (opt-in), W=8 CRC path | ARM CRC32 path in `crc32.c` (lines 109-111) | None |
| Official prebuilt binaries | No (source only) | No | No |
| Distro packages | Yes | Yes | Yes |

The riscv64 job came from a broad multi-architecture BSD CI change, not a dedicated RISC-V effort. `configure.yml` cross-tests ARM (armel, armhf), AARCH64, PPC, PPC64, PPC64LE and S390X under qemu-user but has no riscv64 entry.

## 4. Technical Architecture and RISC-V-Specific Subsystems

zlib has no JIT, crypto or GC. Architecture-sensitive components are the checksums and the deflate/inflate inner loops. Upstream treats riscv64 as portable scalar C on every component.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Deflate longest_match | Partial: contrib asm `gvmat64.S` (570 lines), not built by default | Scalar | Scalar |
| Inflate fast | Scalar | Scalar | Scalar |
| CRC-32 | Scalar, W=8 braided | Partial: hardware CRC32 instructions, guarded by `__aarch64__ && __ARM_FEATURE_CRC32 && W==8`, compile-time only (runtime detection not checked) | Scalar, W=4 braided |
| Adler-32 | Scalar | Scalar | Scalar |
| SIMD / vector | Missing | Missing | Missing |

`crc32.c` line 89 selects an 8-byte word for `__x86_64__` or `__aarch64__`; all other targets, riscv64 included, use W=4. `contrib/crc32vx` was listed but not opened; it is presumed s390x vector code.

**Proposed, unmerged:** PR #1099 uses RVV intrinsics (`vsetvlmax_e8m4`, `vle8_v_u8m4`, `vzext_vf2_u16m8`, `vid_v_u16m8`, reduction to u32), 104 lines, tested on Sophgo SG2042. [NEEDS VERIFICATION: details come from earlier research; PR contents could not be re-read.] No Zba/Zbb code, `.S` files or SIMD dispatch exist in mainline.

**Fork reference (zlib-ng, not madler/zlib):** zlib-ng has `arch/riscv` with RVV paths for adler32, chunkmemset, compare256, longest_match, slide_hash and inflate_fast (per DeepWiki), plus Zbc CRC-32 (see Section 6). It was not examined directly.

## 5. Build System, Cross-Compilation, and Toolchain

Upstream has no riscv64-specific build documentation. Checked and absent (404): `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake`, `Dockerfile.riscv64`. `CMakeLists.txt` has zero "riscv" matches. The commands below are extrapolated from the generic recipes, not taken from the repo.

**configure (Debian/Ubuntu package names assumed):**
```
sudo apt-get install -y qemu-user gcc-riscv64-linux-gnu libc-dev-riscv64-cross
CHOST=riscv64-linux-gnu CC=riscv64-linux-gnu-gcc ./configure --warn
make -j2
QEMU_RUN="qemu-riscv64 -L /usr/riscv64-linux-gnu" make test
```
`configure` sets `CROSS_PREFIX="${CHOST}-"` when `CHOST` is set, and `Makefile.in` runs test binaries through `${QEMU_RUN}`. The existing CI adds static linking only for the ppc and s390x jobs.

**CMake:** requires `cmake_minimum_required(VERSION 3.15...3.31)`. Options per `README-cmake.md`: `ZLIB_BUILD_TESTING`, `ZLIB_BUILD_SHARED`, `ZLIB_BUILD_STATIC`, `ZLIB_BUILD_MINIZIP`, `ZLIB_INSTALL`, `ZLIB_PREFIX`, `MINIZIP_BUILD_SHARED`, `MINIZIP_BUILD_STATIC`, `MINIZIP_BUILD_TESTING`, `MINIZIP_ENABLE_BZIP2`, `MINIZIP_INSTALL`. Turn `MINIZIP_ENABLE_BZIP2` off if libbz2 is unavailable. There are no `-DUSE_X=OFF` arch flags. Cross-compile with your own toolchain file:
```
cmake -S . -B build -DCMAKE_TOOLCHAIN_FILE=riscv64.cmake -DCMAKE_BUILD_TYPE=Release
```
In that file set `CMAKE_SYSTEM_NAME` to `Linux`, `CMAKE_SYSTEM_PROCESSOR` to `riscv64`, `CMAKE_C_COMPILER` to `riscv64-linux-gnu-gcc`, and `CMAKE_CROSSCOMPILING_EMULATOR` to `qemu-riscv64;-L;/usr/riscv64-linux-gnu` so `ctest` runs.

**Toolchain minimums:** None stated upstream, and no RISC-V-specific reason for one was found. CI uses `gcc-14` on BSD and OmniOS jobs and `gcc-13` to `gcc-15` on macOS; these are not stated minimums.

**Known build failures on riscv64:** None found in readable sources. The OpenBSD riscv64 job runs cmake configure, build and ctest. Hidden issues (Section 11) could change this.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None identified. The scalar C code is portable, and the OpenBSD riscv64 job builds it and runs `ctest`.

**Performance gaps in madler/zlib:** riscv64 runs scalar C for all components. Against arm64 it lacks the hardware CRC32 path. Against amd64 it lacks the optional contrib longest_match assembly. No riscv64 benchmark of madler/zlib was found. The claimed 7% decompression gain from PR #1099 on SG2042 is [NEEDS VERIFICATION].

**Fork benchmark data (zlib-ng, not madler/zlib):**

zlib-ng [PR #1905](https://github.com/zlib-ng/zlib-ng/pull/1905) (Zbc CRC-32, by Ag-Cu, merged 2025-04-27), measured with `benchmark_crc32` on a "musebook" board that supports Zbc. No CPU model, clock, compiler or OS is given. The author claims "4x~7x speedup when data_len >= 16". Time per call in ns:

| Bytes | braid | generic_chorba | riscv (Zbc) |
|---|---|---|---|
| 1 | 16.2 | 17.5 | 24.2 |
| 8 | 50.0 | 51.9 | 57.3 |
| 12 | 73.6 | 85.7 | 89.6 |
| 16 | 86.4 | 98.3 | 24.7 |
| 32 | 179 | 191 | 30.7 |
| 64 | 263 | 308 | 40.3 |
| 512 | 1503 | 1050 | 181 |
| 4096 | 11298 | 6422 | 1306 |
| 32768 | 93140 | 56719 | 10479 |
| 262144 | 740223 | 395788 | 82844 |
| 4194304 | 11938022 | 8142963 | 1368543 |

Zbc is slower for 1, 8 and 12 bytes and faster from 16 bytes. At 4 MiB it is about 5.95x faster than generic_chorba and about 8.7x faster than braid (derived arithmetic, not stated in the PR).

zlib-ng [PR #1522](https://github.com/zlib-ng/zlib-ng/pull/1522) (slide_hash with RVV, merged 2023-06-23, SiFive FPGA p470 bitstream), RVV speedup over scalar: 7.727 (1024), 8.158 (2048), 8.529 (4096), 8.599 (8192), 8.150 (16384), 7.753 (32768).

zlib-ng [PR #1498](https://github.com/zlib-ng/zlib-ng/pull/1498) (compare256 with RVV, merged 2023-06-13, SiFive FPGA x280 bitstream), RVV speedup over scalar: 0.1754 (length 1), 0.4614 (8), 3.1771 (64), 11.6448 (256). RVV is slower than scalar for lengths 1 and 8.

Other zlib-ng RISC-V PRs: #1532 (RVV adler32, merged 2023-07-16) and #1921 (RVV chunkcopy, merged 2025-06-25) have no numbers in their bodies. #1904 adds a bash configure script for riscv, and #1999 fixes riscv hwcap detection. Data not available: any riscv64 vs arm64 zlib comparison for 2024-2026.

**Security hardening gaps:** Data not available: no riscv64-specific hardening or sanitizer information was found.

**Floating-point / NaN:** Not applicable. zlib performs no floating-point arithmetic. A search for "riscv nan floating" returned 0 results.

**FreeBSD/riscv64:** Previously reported as excluded from CI because "FreeBSD on riscv64 has no packages" (from PR #1139). [NEEDS VERIFICATION] The current `others.yml` has FreeBSD only for aarch64 and x86_64.

## 7. CI/CD Infrastructure

The riscv64 job is in `.github/workflows/others.yml` (workflow `anyVM-OSes`, commit 99623ef), line 106. It is the only workflow among seven that mentions riscv. Trigger is `on: [push, pull_request]`, with no `workflow_dispatch` or schedule.

```yaml
  openbsd:
    runs-on: ubuntu-latest
    name: OpenBSD - ${{ matrix.name }}
    strategy:
      fail-fast: false
      matrix:
        include:
          - name: aarch64
          - name: x86_64
          - name: riscv64
    steps:
    - uses: actions/checkout@v6
    - name: OpenBSD - ${{ matrix.name }}
      uses: vmactions/openbsd-vm@v1
      with:
        arch: ${{ matrix.name }}
        copyback: false
        sync: scp
        prepare: |
          pkg_add cmake
          bzip2
        run: |
          cmake . -B build -DZLIB_BUILD_MINIZIP=ON -DMINIZIP_ENABLE_BZIP2=ON
          cmake --build build/
          ctest --test-dir build
```

- The runner is x86_64 `ubuntu-latest`; the guest is an emulated OpenBSD VM (QEMU-based, inferred; the action source was not read).
- The `prepare` block has `bzip2` on its own line, so it runs as a command and likely does not install the package. The job also lacks `--output-on-failure`.
- Other jobs in the file: DragonflyBSD, FreeBSD (aarch64, x86_64), NetBSD (aarch64, x86_64), OmniOS, Solaris. OpenIndiana is commented out.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Workflow | `cmake.yml`, `configure.yml`, `c-std.yml`, `fuzz.yml`, `contribs.yml`, `msys-cygwin.yml` | `configure.yml`, `c-std.yml` | `others.yml` |
| OS | Linux, Windows, macOS | Linux | OpenBSD |
| Hardware | x86_64 runners | qemu-user | Emulated VM on x86_64 runner |
| Trigger | push, pull_request | push, pull_request | push, pull_request |
| Linux coverage | Yes | Yes | No |
| Build system tested | CMake, configure | configure | CMake |
| RISE runners | No (none found) | No | No |

`configure.yml` (the qemu-user cross workflow) has no riscv64 entry. `.gitlab-ci.yml`, `Jenkinsfile` and `.cirrus.yml` do not exist. RISE runner usage is unknown [NEEDS VERIFICATION].

## 8. Distribution and Release Status

**Upstream:** Source only. The GitHub releases API returned releases v1.4, v1.3.2, v1.3.1, v1.3 and v1.2.13 with no `assets` field, so no riscv64 binaries. An earlier survey reported six assets per release (source tarballs and `.asc` signatures); the API returned none, a discrepancy in asset listing that does not change the conclusion (no binaries). PyPI has no project named `zlib` (`https://pypi.org/pypi/zlib/json` returns 404). The RISE wheel index has no `zlib` entry (404).

**Distributions:**

| Distribution | Package | Version | riscv64 status |
|---|---|---|---|
| Ubuntu 26.04 (resolute) | zlib1g, zlib1g-dev | 1:1.3.dfsg+really1.3.1-1ubuntu3 | Present in ports pocket for armhf, ppc64el, riscv64, s390x; amd64, arm64, i386 at ...ubuntu3.2 in security |
| Ubuntu 24.04 (noble) | zlib1g, zlib1g-dev | 1:1.3.dfsg-3.1ubuntu2 | Present, including riscv64 [NEEDS VERIFICATION] |
| Debian sid | zlib | 1:1.3.dfsg+really1.3.2-3 | Installed on riscv64, builder rv-manda-03 [NEEDS VERIFICATION] |
| Arch Linux RISC-V | zlib, zlib-static | 1:1.3.2-3 | Built 2026-03-09 [NEEDS VERIFICATION]; latest Arch RISC-V page check was inconclusive |
| Alpine | zlib | edge 1.3.2-r0 (earlier research); riscv64 package page showed 1.4-r0 | Present; versions differ between sources |
| conda-forge | zlib-feedstock | n/a | [PR #92](https://github.com/conda-forge/zlib-feedstock/pull/92) "FEA: add riscv64", closed |

The project graph returned empty for the names `zlib`, `python3-zlib` and `libzlib`; this is a naming mismatch, since the Ubuntu package names are `zlib1g` and `zlib1g-dev`. The graph was not re-queried with those names.

**User action:** `apt install zlib1g zlib1g-dev` on Ubuntu or Debian, `pacman -S zlib` on Arch RISC-V. Alternatively build from source (Section 5).

## 9. Dependencies

zlib has no third-party library dependencies. `CMakeLists.txt` is plain C and uses only CMake and libc checks (`fseeko`, `off64_t`, `stdarg.h`, `unistd.h`, a visibility-attribute test). It has no JIT, SIMD, numerics, crypto, compression or allocator dependencies.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| glibc | Runtime dependency (critical): libc/POSIX APIs | Available | Not assessed | Ubuntu 26.04 riscv64 `libc6` found in graph | No known blockers; riscv64 issues not searched (not GitHub-hosted) |
| GCC | Build dependency (critical): C compiler | Not assessed directly; CI uses `gcc-14` on BSD/OmniOS jobs | Not assessed | Not assessed | No riscv-specific compiler minimum stated upstream |
| CMake | Build dependency (optional): 3.15 or newer | Used in the OpenBSD riscv64 CI job | Yes (`ctest`, OpenBSD) | Installed via `pkg_add` in CI | No known blockers |
| GNU make | Build dependency (optional): `./configure` + `make` path | Not exercised on riscv64 in upstream CI | Not exercised | Not assessed | The qemu-user riscv64 path is absent from CI |
| bzip2 | Runtime dependency (optional): minizip only, via `MINIZIP_ENABLE_BZIP2` | CI enables it, but the `prepare` step may not install it | Same | Not assessed | Stray `bzip2` line in `others.yml` (Section 7) |

**Related projects:** zlib-ng is a drop-in fork, not a dependency, tracked in `projects.yml` and at project-reports/zlib-ng.md. zlib-rs is also in `projects.yml` without a report. The `hasDependency` graph query was not run, since nothing beyond libc exists to enumerate.

zlib-ng riscv64 issues seen in web search (relevant to anyone evaluating the fork): [#941](https://github.com/zlib-ng/zlib-ng/issues/941) "riscv64 support in cmake is broken", and [#1936](https://github.com/zlib-ng/zlib-ng/issues/1936) (SIGILL in `riscv_check_features` when cross-building with `-static-pie`). Their states were not shown. [riscv-gnu-toolchain #943](https://github.com/riscv-collab/riscv-gnu-toolchain/issues/943) reports "Cannot find -lz" when cross-compiling the toolchain.

## 11. Known Bugs and Active Issues

Some issue and PR titles, states and dates are unknown [NEEDS VERIFICATION].

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1200](https://github.com/madler/zlib/issues/1200) | Unknown (hidden) | Unknown | Unknown | Matched "riscv" and "riscv64"; only hit for plain "riscv". Whether it is a tracking issue is unknown |
| [#143](https://github.com/madler/zlib/issues/143) | Unknown (hidden) | Unknown | Unknown | Matched "riscv64" |
| [#413](https://github.com/madler/zlib/issues/413) | Unknown (hidden) | Unknown | Unknown | Matched "riscv64" |
| [#416](https://github.com/madler/zlib/issues/416) | Unknown (hidden) | Unknown | Unknown | Matched "riscv64" |
| [PR #1139](https://github.com/madler/zlib/pull/1139) | Unknown (hidden) | Unverified | n/a | Matched "riscv64"; linked to OpenBSD riscv64 CI commit c5c3b0b |
| [PR #1099](https://github.com/madler/zlib/pull/1099) | Add RVV-optimized implementation for Adler32 | Open, no reviews [NEEDS VERIFICATION] | Low (performance) | Per the readiness grade, unmerged (ZTE) |
| [PR #1267](https://github.com/madler/zlib/pull/1267) | Duplicate of #1099 | Self-closed [NEEDS VERIFICATION] | n/a | Opened and closed 2026-06-10 |

Other counts: "riscv64 performance" returned 3 hidden results (#1200, #143, #874); "riscv64 bug" returned 14 hidden results. Whether any are open is unknown. These need manual review.

**Correctness bugs:** None confirmed. Data not available: no riscv64 correctness bug could be verified because all candidates were hidden.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. Data not available: Mark Adler's statements on RISC-V (no readable issue or PR discussion).

**Technical blockers:** None found for the scalar build. PR #1099 is reported as a complete implementation, not a stub [NEEDS VERIFICATION].

**Organizational blockers:** Single maintainer, no deputy reviewer, no documented review process for architecture contributions, and no corporate sponsor. PR #1099 has been open since 2025-10-28 with no reported response [NEEDS VERIFICATION].

**Acceptance probability:** Linux riscv64 CI addition (one matrix entry in `configure.yml`): likely, since the maintainer merged the multi-architecture BSD CI change. RVV Adler-32 (#1099): uncertain; no evidence of review. This is an assessment, not a stated position.

**Note on zlib-ng:** Optimized RISC-V work (RVV, Zbc) is merged in zlib-ng and tracked by RISE as SL_00_005, so engagement with zlib-ng is more actionable if RISC-V performance is the goal.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro

**Justification:** Upstream CI [others.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/others.yml) runs an OpenBSD riscv64 job (emulated VM, added in c5c3b0b / [PR #1139](https://github.com/madler/zlib/pull/1139)) that does a cmake build and ctest on every push and PR. That gives build and tests, but only on OpenBSD, with no Linux riscv64 job. Upstream ships source only; riscv64 binaries come from distros (Ubuntu zlib1g, Debian, Arch, Alpine). zlib is the reference DEFLATE implementation, so the optimization modifier does not apply.

**Pending work that could change the grade:**
- Unmerged RVV Adler-32 [PR #1099](https://github.com/madler/zlib/pull/1099) (ZTE).
- No qemu-riscv64 entry in `configure.yml`, so a Linux riscv64 CI job is still missing.
- Issues #1200, #143, #413 and #416 have unknown content [NEEDS VERIFICATION].
- No RISE involvement with madler/zlib; RISE work targets zlib-ng (SL_00_005).

## 14. Investment Analysis

RISE has no funded work on madler/zlib. RISE claims RVV optimizations for zlib-ng in its [December 2024 webinar](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf) ("Added RISC-V Vector optimizations to system libraries: bionic, dav1d, zlib-ng, XNNPACK"). Data not available: funding amount or recipient for zlib-ng (the wiki page [SL_00_005](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8586096/SL_00_005+-+zlib-ng) returned only a cookie banner). The RISE index also hosts the wheels `zlib-state` and `cmeel-zlib`, which are not madler/zlib. riseproject-dev has an `android_external_zlib` repo (created 2026-10-12, the Chromium/Android zlib fork), which is separate from madler/zlib.

Effort figures below are estimates, not measured data.

### 14.1 Functional Enablement

No work required for the scalar library. Distro packages exist.

### 14.2 Performance Optimization

- Review and rebase PR #1099 (RVV Adler-32) for upstream: existing code, no review so far.
- Implement Zbc CRC-32 for madler/zlib, following the zlib-ng PR #1905 approach (hand-off from fork data above).
- Add runtime hwcap detection if more than one vector path lands. Note zlib-ng issue #1936 (SIGILL in feature probing) as a hazard.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to `configure.yml` using the existing qemu-user pattern (Section 5). Fix the stray `bzip2` line in `others.yml`.

### 14.4 Ecosystem Enablement

Not applicable. zlib is a foundational system library with no dependent package ecosystem to enable separately.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 qemu-user job to `configure.yml` | 0.5 | Any contributor | High |
| CI/CD | Fix `bzip2` install line in `others.yml` | 0.1 | Any contributor | Low |
| Performance | Review, benchmark and upstream PR #1099 (RVV Adler-32) | 2 | RISC-V vendor | Medium |
| Performance | Zbc CRC-32 for madler/zlib | 3 | RISC-V vendor | Medium |
| Performance | Runtime hwcap dispatch for RVV/Zbc | 1 | Dependent on above | Medium |
| Upstream engagement | Engage maintainer on architecture PRs | 1 (recurring) | Interested vendor | Low |
| Verification | Read hidden issues #1200, #143, #413, #416 and PR #1139 with sufficient access | 0.2 | Report maintainer | High |

Total about 7.8 person-weeks, dominated by performance work that depends on maintainer responsiveness.

## 15. References

- [madler/zlib repository](https://github.com/madler/zlib)
- [zlib homepage](https://zlib.net/)
- [madler/zlib releases](https://github.com/madler/zlib/releases)
- [PR #1099: RVV Adler32](https://github.com/madler/zlib/pull/1099)
- [PR #1139](https://github.com/madler/zlib/pull/1139)
- [PR #1267: duplicate RVV Adler32](https://github.com/madler/zlib/pull/1267)
- [Issue #1200](https://github.com/madler/zlib/issues/1200)
- [Issue #143](https://github.com/madler/zlib/issues/143)
- [Issue #413](https://github.com/madler/zlib/issues/413)
- [Issue #416](https://github.com/madler/zlib/issues/416)
- [CI workflow: others.yml](https://github.com/madler/zlib/blob/develop/.github/workflows/others.yml)
- [CI workflow: configure.yml](https://raw.githubusercontent.com/madler/zlib/develop/.github/workflows/configure.yml)
- [zlib-ng PR #1905: Zbc CRC32](https://github.com/zlib-ng/zlib-ng/pull/1905)
- [zlib-ng PR #1904: riscv configure script](https://github.com/zlib-ng/zlib-ng/pull/1904)
- [zlib-ng PR #1522: slide_hash RVV](https://github.com/zlib-ng/zlib-ng/pull/1522)
- [zlib-ng PR #1498: compare256 RVV](https://github.com/zlib-ng/zlib-ng/pull/1498)
- [zlib-ng issue #941](https://github.com/zlib-ng/zlib-ng/issues/941)
- [zlib-ng issue #1936](https://github.com/zlib-ng/zlib-ng/issues/1936)
- [conda-forge zlib-feedstock PR #92](https://github.com/conda-forge/zlib-feedstock/pull/92)
- [riscv-gnu-toolchain issue #943](https://github.com/riscv-collab/riscv-gnu-toolchain/issues/943)
- [Ubuntu resolute zlib package search](https://packages.ubuntu.com/search?keywords=zlib&suite=resolute&searchon=names&section=all)
- [Debian buildd: zlib sid](https://buildd.debian.org/status/package.php?p=zlib&suite=sid)
- [Arch Linux RISC-V mirror: core repo](https://riscv.mirror.pkgbuild.com/repo/core/)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog](https://riseproject.dev/blog)
- [RISE webinar December 2024](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)
- [RISE wiki: SL_00_005 zlib-ng](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8586096/SL_00_005+-+zlib-ng)
- [RISE Python wheels index](https://pypi.riseproject.dev)
- [riseproject-dev/android_external_zlib](https://github.com/riseproject-dev/android_external_zlib)
