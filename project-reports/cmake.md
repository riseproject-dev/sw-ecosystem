---
title: CMake
parent: Project Reports
color: orange
dependencies:
  - name: libcurl
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: nghttp2
    relation: runtime-dependency
    criticality: optional
  - name: libarchive
    relation: runtime-dependency
    criticality: critical
  - name: libuv
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: critical
  - name: zstd
    relation: runtime-dependency
    criticality: critical
  - name: xz
    relation: runtime-dependency
    criticality: critical
  - name: bzip2
    relation: runtime-dependency
    criticality: optional
  - name: expat
    relation: runtime-dependency
    criticality: critical
  - name: JsonCpp
    relation: runtime-dependency
    criticality: critical
  - name: RHash
    relation: runtime-dependency
    criticality: critical
  - name: cppdap
    relation: runtime-dependency
    criticality: optional
  - name: ncurses
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: GNU make
    relation: build-dependency
    criticality: optional
  - name: Ninja
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="cmake" %}

# CMake

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-30<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for CMake<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

CMake is a cross-platform build-system generator. It is portable C++ with a `bootstrap` script and a CMake-based build. Upstream is [gitlab.kitware.com/cmake/cmake](https://gitlab.kitware.com/cmake/cmake), mirrored read-only at [Kitware/CMake on GitHub](https://github.com/Kitware/CMake). The newest upstream tag found is `v4.5.0-rc2`, dated 2026-10-28, per the [tags Atom feed](https://gitlab.kitware.com/cmake/cmake/-/tags?format=atom).

- **License:** BSD 3-clause. [CONTRIBUTING.rst](https://raw.githubusercontent.com/Kitware/CMake/master/CONTRIBUTING.rst) presumes contributions are offered under it, with no CLA or copyright assignment.
- **Governance:** Vendor-led by Kitware, with community contributions through merge requests. CONTRIBUTING.rst says "Kitware maintains and supports CMake, working alongside an active community of outside contributors." The [cmake.org](https://cmake.org/) homepage names no foundation or governance body. Under "CMake Contributors" it lists Kitware Inc., the National Library of Medicine, the National Alliance for Medical Image Computing, Sandia National Laboratories and the Advanced Simulation and Computing program. Development is discussed on discourse.cmake.org.
- **Maintainers:** Kitware is the only corporate maintainer confirmed. No MAINTAINERS file was read. Brad King, a Kitware maintainer [NEEDS VERIFICATION], is the maintainer who replies in the riscv64 threads.
- **RISE:** Kitware is not a member. The [RISE members page](https://riseproject.dev/members/) lists 8 Premier and 12 General members, and neither Kitware nor CMake appears. The sponsorship-level table did not render, so a separate sponsor list could not be checked.
- **Culture on new ports:** Welcoming, with no formal process. CONTRIBUTING.rst says "Anyone is welcome to provide testing machines" to keep support for their platforms working. Merge requests target `master` and follow the CMake Review Process. Contributors must follow CMake's AI policy.
- **Stance on toolchain problems:** Maintainers consistently decline to work around toolchain or distro defects in the build system (see Section 12).

## 2. Port History and Upstreaming Timeline

CMake has no riscv64 port to upstream, because it is portable C++. No master or tracking issue for riscv64 exists. RISC-V-related upstream work consists of small recognition and platform items, listed below. Dates are creation or merge dates.

| Date | Event | Source |
|---|---|---|
| 2016-09-08 | Issue #16290 "Support RISC-V" opened by rwmj (Red Hat), attaching a patch that adds RISC-V as a little-endian architecture. The patch belonged to KWIML, so it was applied upstream as utils/kwiml@12f000d5 and imported into CMake. Closed 2016-09-09, milestone 3.7.0, commit f2c98e12. | [Issue #16290](https://gitlab.kitware.com/cmake/cmake/-/work_items/16290) |
| 2016-09-27 | Fedora/AlmaLinux patch "Backport upstream RISC-V support" for CMake 3.6.1 shows the KWIML change predates it. | [AlmaLinux commit](https://git.almalinux.org/rpms/cmake/commit/61e3e8f15d214e3c4ae39b6c7747aa49d2367d89) |
| 2019-07-09 | MR !3510 "IAR: Add support for the RISC-V compiler" merged, in 3.15.0. Commit c2421878 is by Stefan Andersson, committed by Brad King on 8 Jul 2019. | [MR !3510](https://gitlab.kitware.com/cmake/cmake/-/merge_requests/3510) |
| 2020-07-01 | Issue #20895 "-latomic is needed on RISCV" opened by xnox (Ubuntu). | [Issue #20895](https://gitlab.kitware.com/cmake/cmake/-/work_items/20895) |
| 2020-07-07 | MR !4980 (xnox, `-latomic` for riscv64 in `Platform/Linux.cmake`) closed unmerged. | [MR !4980](https://gitlab.kitware.com/cmake/cmake/-/merge_requests/4980) |
| 2021-05-02 | Issue #22138 (two-level glibc lib paths, `lib64/lp64d`) opened by yixun.lan (Gentoo). Still open. | [Issue #22138](https://gitlab.kitware.com/cmake/cmake/-/work_items/22138) |
| 2021-09-23 | MR !6551 merged, fixing an IAR RISC-V binutils/assembler detection regression from 3.21 (issue #22658). Milestone 3.22.0. | [Issue #22658](https://gitlab.kitware.com/cmake/cmake/-/work_items/22658), [MR !6551](https://gitlab.kitware.com/cmake/cmake/-/merge_requests/6551) |
| 2021-10-20 | MR !6630 merged, adding the `Generic-ELF` platform module (`.elf` suffix, bare-metal Arm and RISC-V). Milestone 3.23.0. | [Issue #22756](https://gitlab.kitware.com/cmake/cmake/-/work_items/22756), [MR !6630](https://gitlab.kitware.com/cmake/cmake/-/merge_requests/6630) |
| 2021-12-16 | #20895 closed in favour of the more general #23021 (open). | [Issue #23021](https://gitlab.kitware.com/cmake/cmake/-/work_items/23021) |
| 2022-02-14 | #23222 (LLVM x86_64 to RISC-V cross-build, `CMAKE_CROSSCOMPILING`) closed. Maintainers said the variable is not a reliable indicator that binaries will run on the host. | [Issue #23222](https://gitlab.kitware.com/cmake/cmake/-/work_items/23222) |
| 2024-09-05 | #26266 (riscv64 bootstrap link error) closed. Cause was a non-upstream MacPorts patch. | [Issue #26266](https://gitlab.kitware.com/cmake/cmake/-/work_items/26266) |
| 2025-01-08 | #26588 (riscv64 snap request) closed the same day. The snap is not maintained by Kitware. | [Issue #26588](https://gitlab.kitware.com/cmake/cmake/-/work_items/26588) |
| 2025-04-09 | MR !10622 merged, adding the `riscv64-linux-android` target, in 4.1.0. | [MR !10622](https://gitlab.kitware.com/cmake/cmake/-/merge_requests/10622) |
| 2025-10-20 | #27322 (documentation list of `CMAKE_SYSTEM_PROCESSOR` values, includes `riscv64.*`) opened. Still open. | [Issue #27322](https://gitlab.kitware.com/cmake/cmake/-/work_items/27322) |
| 2026-10-15 | #28174 "Four tests fail on Fedora RISC-V builders" opened by hrw (Fedora). Still open. | [Issue #28174](https://gitlab.kitware.com/cmake/cmake/-/work_items/28174) |

**Key contributors:**
- rwmj (Red Hat): the original RISC-V endianness patch.
- xnox / Dimitri John Ledkov (Ubuntu): the `-latomic` work.
- yixun.lan (Gentoo): the lp64d library path proposal.
- hrw / Marcin Juszkiewicz (Fedora): the riscv64 test failures.
- Stefan Andersson (IAR): compiler detection.
- jwillikers: the Generic-ELF module.
- truboxl: the Android riscv64 target.

**Is it fully upstream?** Recognition items are upstream: KWIML endianness since 3.7, IAR since 3.15, Generic-ELF in 3.23, and Android riscv64 in 4.1. The `-latomic` handling is not upstream. It lives only on the [xnox riscv64 fork branch](https://gitlab.kitware.com/xnox/cmake/-/commits/riscv64). The `lp64d` find_package handling is not upstream.

**Issues that look RISC-V-related but are not.** These were identified by reading the threads directly.
- #24145 is not RISC-V. It concerns IAR Functional Safety assemblers for RL78, RX and RH850, and was fixed by MR !7903 in 3.25.0.
- #26266 is not a CMake bug.
- #28200 is only incidentally RISC-V.

## 3. Upstream Support Tier

**Formal tier policy:** None. CONTRIBUTING.rst has no tiered platform-support policy. Support is kept working through integration testing on dedicated machines that report to the CMake CDash page. Whether any riscv64 machine submits to CDash was not checked.

**Evidence:**
- Upstream CI has no riscv64 job (Section 7).
- Kitware publishes no riscv64 binary. In #26588 craig.scott states the CMake snap is maintained privately by him, that supported platforms were reduced to x86_64 and aarch64 "the only ones with official packages", and that he has no interest in expanding beyond official packages.
- Release tags are published, but no riscv64 binary assets were found. The GitHub mirror API returned 403, so mirror release assets were not checked.
- Whether riscv64 results are release-blocking: Data not available. No release policy was found.

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream GitLab CI | Yes (x86_64 jobs, about 306 mentions) | Yes (Linux aarch64 jobs, macOS arm64) | None |
| Kitware official packages | Yes (per #26588) | Yes (per #26588) | None |
| PyPI wheel | Yes | Yes | Yes (4.4.4), built by cmake-python-distributions, not Kitware |
| Distro packages | Data not available | Data not available | Ubuntu, Arch, Alpine (Section 8) |
| Formal tier | None | None | None |

## 4. Technical Architecture and RISC-V-Specific Subsystems

A code search found no `arch/riscv/` directory, no `.S` assembly files, no JIT backends and no SIMD dispatch in CMake. The source tree could not be searched directly: the GitLab pages returned 403 and the GitHub code search was blocked. The conclusion rests on targeted file checks and web searches, and the bundled `Utilities/` third-party trees were not inspected for RISC-V code. The hand-tuned / intrinsics / scalar / missing quality scale therefore mostly does not apply.

RISC-V-relevant code is limited to compiler, ABI and platform detection:

| Component | amd64 | arm64 | riscv64 | Quality on riscv64 and evidence |
|---|---|---|---|---|
| Core C++ (generators, bootstrap) | Portable C++ | Portable C++ | Portable C++ | Scalar. No arch-specific code. |
| KWIML endianness (`Utilities/KWIML/include/kwiml/abi.h`) | Data not available | Data not available | `__riscv` / `__riscv__` sets little-endian | Full. Detection only. Added via [#16290](https://gitlab.kitware.com/cmake/cmake/-/work_items/16290). |
| IAR compiler id (`Modules/CMakePlatformId.h.in`, `Compiler/IAR-DetermineCompiler.cmake`) | n/a | n/a | `__ICCRISCV__` maps to `ARCHITECTURE_ID "RISCV"`. No `__riscv` match. | Full for IAR only. See [CMakePlatformId.h.in](https://gitlab.kitware.com/cmake/cmake/blob/79a21ba6804ea501365386ee2616441c9660f3ed/Modules/CMakePlatformId.h.in). |
| `CMAKE_SYSTEM_PROCESSOR` | Passed through from `uname -m` | Passed through | Passed through, no special case | Full. |
| Linux `-latomic` | n/a | n/a | Not added. `Platform/Linux.cmake` and `Linux-GNU.cmake` have no `riscv` or `atomic` lines. | Missing, by maintainer decision. |
| `find_package` lib path search | `lib64` etc. | `lib/ARCH`, `lib64` etc. | Misses `lib64/lp64d` | Missing ([#22138](https://gitlab.kitware.com/cmake/cmake/-/work_items/22138)). |
| CPack DEB architecture | Uses `dpkg --print-architecture` | Same | Same | Full by delegation. |
| CPack RPM architecture | Data not available | Data not available | Not verified: the `CPackRPM.cmake` fetch returned 404 | Unverified. |
| Android ABI | Data not available | Data not available | `riscv64-linux-android`, NDK r27+ sysroot, system version forced to at least 35 | Full ([MR !10622](https://gitlab.kitware.com/cmake/cmake/-/merge_requests/10622)). The NDK says the RISC-V sysroot "is not supported". |
| Bare-metal | n/a | n/a | `Generic-ELF` module | Full ([MR !6630](https://gitlab.kitware.com/cmake/cmake/-/merge_requests/6630)). |
| Bundled libs (libarchive, zlib, zstd, curl, expat, librhash, libuv and others) | Generic C paths | Generic C paths | Generic C paths | Scalar. Not inspected for RISC-V code. |

No ISA extensions (RVV, Zbb, etc.) are used by CMake itself. Data not available on whether the bundled libraries enable any extension on riscv64.

## 5. Build System, Cross-Compilation, and Toolchain

**Native build on a riscv64 host.** These commands come from CMake's README and are generic. CMake's own docs contain no RISC-V or QEMU instructions.

```
./bootstrap && make && sudo make install
mkdir build && cd build && ../bootstrap && make
./bootstrap -- -DCMAKE_USE_OPENSSL=OFF
cmake -G Ninja -B build -S . && cmake --build build && ctest --test-dir build
```

- **Bootstrap options:** `--parallel=n`, `--generator=Ninja`, `--prefix=...`, `--system-libs`, `--no-system-libs` (the default, which builds the bundled libraries), `--enable-ccache`, `--no-debugger`, `--init=FILE`.
- **Environment:** `bootstrap` reads `CC`, `CXX`, `CFLAGS`, `CXXFLAGS` and `LDFLAGS`. It has no cross-compile support and detects the host with `uname`.
- **Minimal riscv64 build:** use `--no-debugger` or `-DCMake_ENABLE_DEBUGGER=OFF` if cppdap or jsoncpp causes trouble.

**Toolchain minimums.**
- A C++11 compiler is required. The requirement is checked via `std::unique_ptr`, and CMake keeps building on older toolchains. `bootstrap` and CMakeLists.txt try C++17, then C++14, then C++11. C defaults to C11 and falls back to C99.
- No hard GCC or Clang minimum is stated. The only version checks gate warning flags (GCC 4.2+, Clang 3.0+).
- `cmake_minimum_required` is 3.13, which matters when building with an existing CMake.

**Dependency defaults.** Most `CMAKE_USE_SYSTEM_*` options default to OFF, so bundled copies are used (LIBARCHIVE, EXPAT, CPPDAP, FORM, LIBRHASH, LIBUV, KWIML; CURL is ON on Apple). ZLIB, BZIP2, ZSTD and LIBLZMA are forced ON when libarchive is system-provided. NGHTTP2 is forced ON when curl is system-provided.

**Dev container.** `.devcontainer/Dockerfile` uses base image `ubuntu:26.04`. It is not riscv64. That Ubuntu publishes riscv64 packages suggests it may work with `--platform linux/riscv64` under QEMU binfmt, but this is an untested inference.

**QEMU.**
- CMake documents no QEMU usage.
- The [RISE wheel_builder cmake page](https://riseproject.gitlab.io/python/wheel_builder/packages/cmake.html) says the wheels were built under qemu-user, and that Module.ExternalData is disabled because it is flaky and appears to race under qemu-user.
- [QEMU issue #3224](https://gitlab.com/qemu-project/qemu/-/issues/3224) reports "Illegal instruction in memset under qemu-user for riscv64", at a `vse64.v` store in glibc `memset`. It hits in about half of runs of `cmake --system-information`, compiler ABI detection and CMake bootstrap, and does not reproduce under qemu-system. The reporter attributes it to qemu-user vector handling. Open or closed status was not determined. Workarounds are preloading a scalar-only memset/memcpy, which avoids it about 99% of the time, or running under gdb. [NEEDS VERIFICATION] (single source)

**Known build failures.**
- Bootstrap link failure with clang on riscv64 ([#26266](https://gitlab.kitware.com/cmake/cmake/-/work_items/26266)). The cause was a non-upstream MacPorts patch, and dropping the patch fixed it.
- Downstream builds fail on missing atomics without `-latomic` (see [#20895](https://gitlab.kitware.com/cmake/cmake/-/work_items/20895) and [#23021](https://gitlab.kitware.com/cmake/cmake/-/work_items/23021)). A Nixpkgs commit "cmake: fix risc-v build failure" is reported as fixing a riscv64 CMake build failing on missing atomics with gcc 12; this is a search snippet that was not opened [NEEDS VERIFICATION].

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Configure/generate/build | Yes | Yes | Yes, via distro and PyPI builds |
| Test suite passes | Upstream CI | Upstream CI | 4 of 764 fail on Fedora Koji ([#28174](https://gitlab.kitware.com/cmake/cmake/-/work_items/28174)) |
| Auto `-latomic` | No (not needed) | No ([#21174](https://gitlab.kitware.com/cmake/cmake/-/work_items/21174) closed as not CMake's job) | No |
| `find_package` multi-level lib dirs | n/a | n/a | Gap ([#22138](https://gitlab.kitware.com/cmake/cmake/-/work_items/22138)) |
| Official Kitware binary | Yes | Yes | No |
| PyPI wheel | Yes | Yes | Yes |
| Debugger (cppdap) | Data not available | Data not available | Optional; Ubuntu `cmake` package does not depend on it |

**Functional gaps (cannot do X at all):**
- No official riscv64 binary or snap.
- No automatic `-latomic`. Projects must link it themselves or use a toolchain whose spec file adds it.
- `find_package` does not find packages under `lib64/lp64d` unless a `lib*` fallback matches.

**Performance gaps.** Data not available: no CMake-specific benchmark (configure/generate time or build time) on riscv64 was found, and no SIMD paths exist to be missing. Indirect data points only:
- The Fedora headline "Current RISC-V CPUs Being Too Slow Causes Headaches For Fedora: ~5x Slower Builds" ([Phoronix via pulse.bot mirror](https://www.pulse.bot/hardware/news/current-risc-v-cpus-being-too-slow-causes-headaches-for-fedora-5x-slower-builds-50d3f4a8-26f8-44b3-9a21-ae04cb5d58b4/)). The article body was unread, so the "~5x" is from the headline only and is not tied to CMake. [NEEDS VERIFICATION]
- A Rust (not CMake) compile on an Orange Pi RV2 averaged 650.60 s versus 62.35 s on an Orange Pi 5 Max, about 10x ([tinycomputers.io](https://tinycomputers.io/posts/the-orangepi-rv2.html)). The boards differ in core count and clocks, so the comparison is uncontrolled.
- CMake test time on the Fedora riscv64 Koji builder was 2849 s total for 764 tests (taskID 382797, [#28174](https://gitlab.kitware.com/cmake/cmake/-/work_items/28174)). No arm64 or amd64 baseline was given.

**Security hardening gaps.** Data not available: no riscv64-specific hardening issue for CMake was found in the searches run.

**NaN / floating-point semantics.** Data not available: no issue was found, and no numeric kernels were identified in CMake.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist? No.** All of `.gitlab-ci.yml` and its six includes (`rules.yml`, `artifacts.yml`, `os-linux.yml`, `os-macos.yml`, `os-windows.yml`, `upload.yml`) were read, along with all 437 files under `.gitlab/`. A case-insensitive search for `riscv`, `risc-v` and `rv64` matched only three IAR toolchain packaging files:
- `.gitlab/ci/iar-env.sh`
- `.gitlab/ci/iar.ps1`
- `.gitlab/ci/repackage/iar.ps1`

These package IAR's RISC-V compiler for CI. They define no riscv64 job, runner, image or target. No QEMU or binfmt files exist. See [.gitlab-ci.yml](https://gitlab.kitware.com/cmake/cmake/-/raw/master/.gitlab-ci.yml) and [os-linux.yml](https://gitlab.kitware.com/cmake/cmake/-/raw/master/.gitlab/os-linux.yml).

**GitHub Actions.** An earlier check could not see the `.github` folder, but a later API tree listing shows a single file, `.github/pull_request_template.md`. There is no `.github/workflows`, so no GitHub Actions CI exists on the mirror. The two checks agree that no riscv64 CI exists.

**RISE runners.** RISE offers free native RISC-V GitHub Actions runners (`runs-on: ubuntu-24.04-riscv`), announced in the [2026-03-24 post](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/). The RISE PyTorch CI runs on Scaleway EM-RV1 hardware under that label. No CMake usage of these runners was found. CMake's CI is on GitLab and the GitHub repo is a mirror, so the runners are not directly applicable (inference).

**Existing external riscv64 testing:** Fedora RISC-V Koji builders ([#28174](https://gitlab.kitware.com/cmake/cmake/-/work_items/28174)), Ubuntu and Debian package builds, and MacPorts. These are not CMake's own CI.

**Not checked:** CDash dashboard submissions and private runners. A riscv64 machine submitting to CDash would not show up in the repo files.

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linux CI jobs | Yes (x86_64, including v3) | Yes (`.linux_release_aarch64`, `.debian13_aarch64`, CUDA aarch64) | None |
| Other platforms in CI | macOS, Windows, i386, Android | macOS arm64 | None (IAR toolchain packaging only) |
| Emulation (QEMU) | None | None | None |
| Native hardware | GitLab runners | GitLab runners | None |

## 8. Distribution and Release Status

| Channel | riscv64 status | Evidence |
|---|---|---|
| Upstream binaries (Kitware) | None | [#26588](https://gitlab.kitware.com/cmake/cmake/-/work_items/26588); no riscv64 assets found among tags |
| PyPI `cmake` | Yes, 4.4.4: `manylinux_2_31_riscv64` and `musllinux_1_2_riscv64` wheels | [PyPI JSON](https://pypi.org/pypi/cmake/json), [PyPI project](https://pypi.org/project/cmake/) |
| RISE wheel_builder index | 16 riscv64 wheels, 3.27.7 to 4.0.3. Package deprecated in favour of PyPI. | [RISE cmake page](https://riseproject.gitlab.io/python/wheel_builder/packages/cmake.html) |
| Ubuntu 26.04 (resolute) | `cmake` and `cmake-data` 4.2.3-2ubuntu2, riscv64, main. No `python3-cmake` or `libcmake` package. | [Ubuntu ports index](http://ports.ubuntu.com/ubuntu-ports/dists/resolute/main/binary-riscv64/Packages.xz), confirmed through the Launchpad API |
| Ubuntu earlier | Built for riscv64 since Focal (3.16.3); Mantic has 3.27.4 | [Focal](https://answers.launchpad.net/ubuntu/focal/riscv64/cmake), [Mantic](https://answers.launchpad.net/ubuntu/mantic/riscv64/cmake) |
| Arch Linux RISC-V | Three mirrors read: 4.4.5-1, 4.4.4-1, and 4.2.3-1 (the Felix mirror lags) | `extra.db` repo databases, three mirrors |
| Alpine | v3.20 riscv64 ships 3.29.3 [NEEDS VERIFICATION] | Alpine package page |
| Debian | Source `cmake` 4.4.4-1 in experimental. riscv64 binary not checked. | Not counted as evidence |
| Fedora | Builds on the riscv64 Koji ([#28174](https://gitlab.kitware.com/cmake/cmake/-/work_items/28174)), package availability not checked | |
| Snap | None; request closed | [#26588](https://gitlab.kitware.com/cmake/cmake/-/work_items/26588) |
| RISE developer images | List cmake-4.3.2 among turn-key toolchains for K230, BPI F3, Orange Pi RV2 and K3 boards [NEEDS VERIFICATION] | [RVI Summit EU 2026 slides](https://riseproject.dev/wp-content/uploads/sites/25/2026/06/RVI-Summit-EU-2026-Ludovic-Nathan.pdf) |

**What a user must do to get a working binary:**
- **Distro package:** `apt install cmake` on Ubuntu 26.04 gives 4.2.3, two minor versions behind PyPI's 4.4.4 and behind upstream 4.5.0-rc2.
- **PyPI:** `pip install cmake` gives 4.4.4 from a native riscv64 wheel.
- **Source:** `./bootstrap && make && make install`.

## 9. Dependencies

The Ubuntu `cmake` package depends on libarchive13t64, libcurl4t64, libexpat1, libjsoncpp26, librhash1, libuv1t64 and zlib1g. All seven are in resolute main for riscv64, so CMake is installable on Ubuntu 26.04 riscv64 today. The "graph" data point below comes from the Ubuntu ports archive index. Status for the first eight rows (libcurl, OpenSSL, nghttp2, zlib, bzip2, xz, zstd, expat) comes from existing project reports. For the rest, the status is "not assessed", not "known bad".

| Name | Role in CMake | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| libcurl | HTTP(S) for `file(DOWNLOAD)`, CTest submission, ExternalProject. Critical. | Pass (CI plus distro) | Partial: randomized subset on a FreeBSD VM only | Source-only upstream. Ubuntu resolute 8.18.0-1ubuntu2. | FreeBSD riscv64 CI re-enable (PR #22814) merged but unreleased. |
| OpenSSL | TLS for libcurl (`CMAKE_USE_OPENSSL`). Optional. | Pass | QEMU workflows on every change, nightly native `os-zoo.yml` | Ubuntu 3.5.5-1ubuntu3 | Issue #29357: `no-deprecated` cross-build fails on `linux64-riscv64` (fix PR #30763 open). No merged riscv64 P-256 assembly. |
| nghttp2 | HTTP/2 for libcurl. Optional. | Pass, no patches needed | None: riscv64 not in upstream CI | Ubuntu 1.68.0-2 | Gap is CI only. |
| libarchive | Tar, zip and 7z read/write, CPack. Critical. | Pass in Ubuntu | Not assessed | Ubuntu 3.8.5-1ubuntu2 | No report file. Upstream CI not assessed. |
| libuv | Async process and stream handling (`cmUVProcessChain`). Critical. | Pass in Ubuntu | Not assessed | Ubuntu 1.51.0-2ubuntu1 | No report file. |
| zlib | Compression. Critical. | Pass | OpenBSD riscv64 CI (QEMU); no Linux riscv64 CI | Ubuntu 1.3.1 dfsg | No riscv64 optimizations merged (RVV Adler32 PR unmerged). |
| zstd | zstd codec in libarchive and CMake. Critical. | Pass | QEMU user-space in upstream CI | Ubuntu 1.5.7+dfsg-3 | PR #4596 (Zicclsm unaligned access, +74% on SG2044) stalled. |
| xz | LZMA codec in libarchive (liblzma). Critical. | Pass | Partial: RISC-V BCJ round-trip tests on x86-64 and arm64 CI only | 5.8.0+ has the RISC-V BCJ filter. Ubuntu 5.8.3-1. | No riscv64 CRC acceleration and no upstream riscv64 CI runner. |
| bzip2 | bz2 codec in libarchive. Optional. | Pass (portable C89) | No upstream CI; Debian and Ubuntu builders only | Ubuntu 1.0.8-6build2 | Existing report rates it yellow (clean-distro-build). |
| expat | XML parsing (`cmXMLParser`, CTest, CPack). Critical. | Pass | Pass: QEMU build-and-test CI on every push since PR #1337 | R_2_8_4 was the first release with riscv64 CI. Ubuntu ships 2.7.4, which predates it. | Existing report rates it blue. |
| JsonCpp | JSON for presets, file-API and the CMake server. Critical. | Pass in Ubuntu | Not assessed | Ubuntu 1.9.6-5 | No report file. |
| RHash | Hashing (`cmCryptoHash`, `file(<HASH>)`), packaged as librhash. Critical. | Pass in Ubuntu | Not assessed | Ubuntu 1.4.6-1.1 | Not in `projects.yml`, no report. |
| cppdap | Debug Adapter Protocol server, only with `CMake_ENABLE_DEBUGGER`. Optional. | Pass in Ubuntu (dev package only, universe, 1.58.0a-6build1) | Not assessed | Ubuntu ships it. The Ubuntu `cmake` package does not depend on it. | Not in `projects.yml`, no report. |
| ncurses | Optional runtime dependency. | Data not available: not covered in the dependency research. | Data not available | Data not available | Searched: Ubuntu archive index and CMake dependency lists, which did not cover ncurses. |
| GCC | Build dependency (C++11 compiler required). Critical. | Data not available for CMake-specific build results. Dev container installs `g++`. | Data not available | RISE developer images list gcc-16.1 [NEEDS VERIFICATION] | |
| LLVM | Build dependency (Clang), optional. | Bootstrap on riscv64 with clang failed once for a non-upstream-patch reason ([#26266](https://gitlab.kitware.com/cmake/cmake/-/work_items/26266)) | Data not available | RISE developer images list clang-21.1.8 [NEEDS VERIFICATION] | |
| GNU make | Build dependency (`./bootstrap && make`). Optional. | Data not available | Data not available | Data not available | |
| Ninja | Build dependency, optional generator. | Data not available | Data not available | RISE wheel_builder lists ninja among foundational Python packages (RISE Dec 2024 webinar) [NEEDS VERIFICATION] | |

**Additional bundled or indirect dependencies:**
- **llpkgc:** package-config parsing, bundled in-tree, no Ubuntu package. Builds with CMake.
- **KWIML:** portability macros, bundled in-tree.
- **libuuid:** used only for the WiX generator on Windows and Cygwin, not relevant on Linux.

**Deep-dive (crypto, SIMD, numerics).** CMake itself has none, but its dependencies carry the riscv64-specific code. Recursion is two levels deep: libcurl pulls in OpenSSL and nghttp2, and libarchive pulls in zlib, bzip2, xz and zstd.
- **OpenSSL:** no merged riscv64 P-256 assembly. This matters for TLS throughput only, which is not a CMake hot path (no data on whether it matters).
- **zlib and zstd:** riscv64 optimizations are unmerged or stalled (zlib RVV Adler32, zstd PR #4596). Data not available on whether archive compression speed matters for CMake users.
- **xz:** the RISC-V BCJ filter exists in 5.8.0+, with no CRC acceleration.
- **Bundled copies:** most deps are bundled by default, so the riscv64 status of the bundled copies is what CMake users get unless `--system-libs` is used. The bundled trees were not inspected.

## 11. Known Bugs and Active Issues

Section 10 is omitted. CMake is a standalone tool with no dependent package ecosystem that must itself be enabled on riscv64.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#28174](https://gitlab.kitware.com/cmake/cmake/-/work_items/28174) | Four tests fail on Fedora RISC-V builders | Open | Low | 4 of 764 fail (RunCMake.Make, RunCMake.BuildDepends, Qt6Autogen.RerunMocBasic, Qt6Autogen.RerunRccDepends). brad.king traced them to filesystem timestamp granularity or clock drift. Same on btrfs and ext4. Reporter does not want a skip list. No fix yet. |
| [#22138](https://gitlab.kitware.com/cmake/cmake/-/work_items/22138) | find_package: two level lib path support for RISC-V | Open | Medium | Misses `lib64/lp64d`. Proposal to use `CMAKE_INSTALL_LIBDIR` softly rejected because that variable controls installation, not finding. No alternative proposed. Gentoo bugs 781134 and 780846. |
| [#23021](https://gitlab.kitware.com/cmake/cmake/-/work_items/23021) | Improve support for C11/atomic | Open | Medium | Successor to #20895. On riscv64, `-latomic` is auto-added by gcc only when `-pthread` is on the command line (Debian sid repro). Maintainers say fix is toolchain-side or project-side. |
| [#26037](https://gitlab.kitware.com/cmake/cmake/-/work_items/26037) | FindOpenMP: transitive dependency on -latomic | Open | Low | Reported on x86_64 with clang 18, not riscv64. Related to #23021. |
| [#27322](https://gitlab.kitware.com/cmake/cmake/-/work_items/27322) | Document known `CMAKE_SYSTEM_PROCESSOR` values | Open | Low | Documentation request. Maintainers say CMake does not "know" processors and prefer `CMAKE_<LANG>_COMPILER_ARCHITECTURE_ID` (public since 4.1). |
| [#20895](https://gitlab.kitware.com/cmake/cmake/-/work_items/20895) | -latomic needed on RISCV | Closed 2021-12-16 | Medium (historical) | Closed in favour of #23021. Broke opendht, rocksdb and mariadb on Ubuntu. |
| [#28200](https://gitlab.kitware.com/cmake/cmake/-/work_items/28200) | 4.5.0-rc1: APPLE/UNIX keep host values when cross-compiling from macOS | Closed 2026-10-24 | Low | Fixed by MR !12701. Broke LLVM compiler-rt bare-metal riscv32/riscv64 builds on macOS hosts. RISC-V link is incidental. |
| [QEMU #3224](https://gitlab.com/qemu-project/qemu/-/issues/3224) | Illegal instruction in memset under qemu-user for riscv64 | Status not determined | Medium for qemu-user CI | Emulator bug that surfaces in CMake runs. Not a CMake defect. |

**Correctness bugs.** None in CMake core logic. The only riscv64-specific failures are test-robustness failures (#28174) and an emulator bug (QEMU #3224). The `lp64d` find_package gap (#22138) is a functional gap that makes packages undiscoverable.

**Downstream CMake-script bugs (not CMake core):** llama.cpp [#17282](https://github.com/ggml-org/llama.cpp/issues/17282) builds a wrong vector `-march` string, and Capstone [#2887](https://github.com/capstone-engine/capstone/issues/2887) breaks when RISC-V support is disabled. Their open or closed status was not verified.

**Cause of #28174.** The reporter attributes the failures to slow hardware making tests behave differently, while brad.king's log analysis points to timestamp granularity or clock drift. Both are consistent with a test-robustness or builder cause rather than RISC-V logic.

## 12. Objections and Upstream Blockers

**Stated objections (all from brad.king unless noted):**
- On `-latomic` ([#20895](https://gitlab.kitware.com/cmake/cmake/-/work_items/20895)): "Hard-coding `-latomic` in the build system is basically Option 5 in riscv-gcc issue 12 which no one there liked. I don't think we should do that... That should be fixed by the platform/distro/toolchain and not the build system. That `-latomic` is also hard-coded for Android is not a good precedent."
- On ARM ([#21174](https://gitlab.kitware.com/cmake/cmake/-/work_items/21174)): "CMake should not unconditionally add `-latomic` just in case a project needs it... CMake cannot know." Projects should detect it with `try_compile`.
- On #23021: the hard part is detecting need without adding a `try_compile` cost to every project. riscv-gcc "was resolved by adding `--as-needed -latomic` to the compiler's spec file".
- On `lp64d` ([#22138](https://gitlab.kitware.com/cmake/cmake/-/work_items/22138)): `CMAKE_INSTALL_LIBDIR` "is meant to control installation of things, not finding of things. Not all projects include `GNUInstallDirs`."
- craig.scott on `CMAKE_SYSTEM_PROCESSOR` ([#27322](https://gitlab.kitware.com/cmake/cmake/-/work_items/27322)): don't rely on it.

**Technical blockers.**
- Detecting whether `-latomic` is needed without a per-project `try_compile` cost (design open in #23021).
- Finding libraries under two-level glibc paths without relying on `GNUInstallDirs`. No alternative has been proposed.
- Test timing and timestamp assumptions on slow riscv64 builders (#28174).

**Organizational blockers.**
- Kitware is not a RISE member and there is no funded RISC-V work.
- There is no tiered support policy, so no mechanism requires riscv64 CI.
- The snap maintainer limits platforms to those with official packages.

**Acceptance probability (assessment, based on the stated positions above).**
- Auto `-latomic`: low. The position has been consistent across four issues and one rejected MR.
- `lp64d` search: unknown. The approach was criticized but the problem was not rejected, so a patch that avoids `CMAKE_INSTALL_LIBDIR` has an open path.
- Test-robustness fixes for #28174: likely if a root cause is shown. brad.king engaged with the logs.
- Documentation for #27322: uncertain. Maintainers prefer pointing to `CMAKE_<LANG>_COMPILER_ARCHITECTURE_ID`.
- Hosting a riscv64 CI machine: CONTRIBUTING.rst invites it ("Anyone is welcome to provide testing machines").

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro
- **Optimization-purpose project:** no. No riscv64 optimization is needed because CMake is not an optimization-purpose project.
- **Justification:**
  - Upstream CI has no riscv64 job. [.gitlab-ci.yml](https://gitlab.kitware.com/cmake/cmake/-/raw/master/.gitlab-ci.yml) and [os-linux.yml](https://gitlab.kitware.com/cmake/cmake/-/raw/master/.gitlab/os-linux.yml) cover only x86_64, aarch64, i386 and sparc64, and Kitware publishes no riscv64 binary.
  - The distribution floor applies. Ubuntu ships cmake 4.2.3 for riscv64 in resolute, and PyPI has riscv64 wheels for 4.4.4, built by [cmake-python-distributions](https://pypi.org/project/cmake/) and not by Kitware.
  - The riscv64 patch status of the distro packaging was not checked, so the rule for unknown patch status gives orange (downstream-only) and not yellow (clean-distro-build).
  - It is not red. CMake builds and runs on riscv64, and the open items are small ([#28174](https://gitlab.kitware.com/cmake/cmake/-/work_items/28174), [#22138](https://gitlab.kitware.com/cmake/cmake/-/work_items/22138)).
- **Confidence:** medium. The Kitware GitLab main page returned 403, so the CI check rests on the raw files. The GitHub mirror has no workflows directory per the API listing.

**Pending work that could change the grade.** Four open items, all unresolved:
1. Issue #28174: 4 of 764 tests fail on Fedora riscv64 Koji builders. brad.king traced them to filesystem timestamp granularity or clock drift, so the cause is test robustness or the builders, not RISC-V logic.
2. Issue #22138: find_package misses the two-level glibc lib paths on RISC-V (lib64/lp64d). It is open with a soft rejection and no alternative proposed.
3. Issue #23021: maintainers will not auto-add `-latomic` on riscv64 and want the fix in the toolchain or in project code. The earlier xnox MR !4980 was closed unmerged.
4. Issue #27322: open request for a documentation list of `CMAKE_SYSTEM_PROCESSOR` values.

Upgrade paths:
- If the Debian and Ubuntu cmake packaging is confirmed free of riscv64-specific patches, the grade moves to yellow (clean-distro-build).
- A riscv64 job in Kitware CI that runs the tests, including community-contributed CDash machines, would move it to blue.

RISE involvement is none for CMake itself. There is no CMake-specific RISE project and no funded work, and the RISE wheel_builder cmake package is deprecated at 4.0.3 in favour of upstream PyPI wheels. Kitware is not a RISE member. Kitware's CONTRIBUTING.rst says anyone may provide testing machines.

## 14. Investment Analysis

**RISE coverage check before sizing.**
- RISE built riscv64 cmake wheels (3.27.7 to 4.0.3), and that package is now deprecated because PyPI publishes newer riscv64 wheels. No further wheel work is needed.
- RISE's only project touching CMake is RP020 (SpeexDSP, 40,000 EUR). It adds Meson next to the existing CMake and does not change CMake.
- RISE runners and developer images exist (Section 7 and Section 8), so CI hardware is available but unused for CMake.

Effort figures below are my estimates for sizing, not measured data.

### 14.1 Functional Enablement

- **#28174 root cause.** Reproduce on riscv64 hardware or Koji. Determine whether timestamp granularity or clock drift is the builder environment or a test assumption. Upstream a test-robustness fix if it is a test issue.
- **#22138 find_package.** Propose an alternative that does not use `CMAKE_INSTALL_LIBDIR`, for example searching the multiarch and ABI subdirectories glibc uses. This needs maintainer agreement first.
- **`-latomic`.** Do not pursue a CMake change. Confirm the gcc spec file behaviour on current toolchains and, where needed, fix it in downstream projects.
- **Documentation (#27322).** Contribute riscv64 text, aligning with the maintainers' preference for `CMAKE_<LANG>_COMPILER_ARCHITECTURE_ID`.

### 14.2 Performance Optimization

No CMake-specific riscv64 performance problem has been demonstrated, and CMake has no arch-specific kernels. Work is limited to taking a baseline: measure configure, generate and test-suite time on a riscv64 board against arm64. Optimization of bundled library paths (zlib, zstd, xz) is tracked in those projects' reports and is not sized here.

### 14.3 CI/CD Infrastructure

Stand up a riscv64 machine that submits to CMake's CDash, as CONTRIBUTING.rst invites, or contribute a Kitware GitLab runner. RISE runners are GitHub Actions only and do not apply directly. Include a timing-tolerant configuration, since #28174 shows slow-builder test failures.

### 14.4 Ecosystem Enablement

Section 10 is omitted. The remaining work is to verify the Debian and Ubuntu cmake packaging for riscv64-specific patches, which moves the grade to yellow. Also assess the unassessed dependencies (libarchive, JsonCpp, libuv, RHash, cppdap) with project reports.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify Debian/Ubuntu cmake packaging has no riscv64-specific patches (grade to yellow) | 1 | Our team | High |
| Functional | Root-cause and fix #28174 test failures upstream | 2 to 3 | Our team with Fedora RISC-V and Kitware | Medium |
| Functional | Alternative design and patch for #22138 `lp64d` find_package | 2 | Our team with Kitware review | Medium |
| Functional | Riscv64 text for CMAKE_SYSTEM_PROCESSOR docs (#27322) | 1 | Our team | Low |
| Performance | Baseline CMake configure/generate/test time, riscv64 vs arm64 | 1 | Our team | Low |
| CI/CD | riscv64 CDash machine or GitLab runner, with timing-tolerant setup | 3 to 4 | Our team with Kitware, RISE Developer Infrastructure WG | High |
| Ecosystem | Assess libarchive, JsonCpp, libuv, RHash, cppdap on riscv64 | 2 | Our team | Medium |
| Total | | 12 to 14 | | |

## 15. References

- [CMake repository, GitLab](https://gitlab.kitware.com/cmake/cmake)
- [CMake homepage](https://cmake.org/)
- [Kitware/CMake GitHub mirror](https://github.com/Kitware/CMake)
- [CMake .gitlab-ci.yml](https://gitlab.kitware.com/cmake/cmake/-/raw/master/.gitlab-ci.yml)
- [CMake .gitlab/os-linux.yml](https://gitlab.kitware.com/cmake/cmake/-/raw/master/.gitlab/os-linux.yml)
- [CMake tags Atom feed](https://gitlab.kitware.com/cmake/cmake/-/tags?format=atom)
- [CONTRIBUTING.rst](https://raw.githubusercontent.com/Kitware/CMake/master/CONTRIBUTING.rst)
- [Issue #16290, Support RISC-V](https://gitlab.kitware.com/cmake/cmake/-/work_items/16290)
- [Issue #20895, -latomic on RISCV](https://gitlab.kitware.com/cmake/cmake/-/work_items/20895)
- [Issue #21174, -latomic on ARM](https://gitlab.kitware.com/cmake/cmake/-/work_items/21174)
- [Issue #22138, find_package two level lib path](https://gitlab.kitware.com/cmake/cmake/-/work_items/22138)
- [Issue #22658, IAR RISC-V binutils detection](https://gitlab.kitware.com/cmake/cmake/-/work_items/22658)
- [Issue #22756, Bare metal Arm / RISC-V / ELF platform module](https://gitlab.kitware.com/cmake/cmake/-/work_items/22756)
- [Issue #23021, Improve support for C11/atomic](https://gitlab.kitware.com/cmake/cmake/-/work_items/23021)
- [Issue #23222, cmake breaks llvm's cross compilation](https://gitlab.kitware.com/cmake/cmake/-/work_items/23222)
- [Issue #24145, IAR ASM architecture ID](https://gitlab.kitware.com/cmake/cmake/-/work_items/24145)
- [Issue #26037, FindOpenMP transitive -latomic](https://gitlab.kitware.com/cmake/cmake/-/work_items/26037)
- [Issue #26266, riscv64 bootstrap error](https://gitlab.kitware.com/cmake/cmake/-/work_items/26266)
- [Issue #26588, Missing RISC-V snap](https://gitlab.kitware.com/cmake/cmake/-/work_items/26588)
- [Issue #27322, CMAKE_SYSTEM_PROCESSOR documentation](https://gitlab.kitware.com/cmake/cmake/-/work_items/27322)
- [Issue #28174, Four tests fail on Fedora RISC-V builders](https://gitlab.kitware.com/cmake/cmake/-/work_items/28174)
- [Issue #28200, APPLE/UNIX keep host values](https://gitlab.kitware.com/cmake/cmake/-/work_items/28200)
- [MR !3510, IAR RISC-V compiler](https://gitlab.kitware.com/cmake/cmake/-/merge_requests/3510)
- [MR !4980, Platform/Linux -latomic on RISCV64](https://gitlab.kitware.com/cmake/cmake/-/merge_requests/4980)
- [MR !6551, IAR assembler detection for RISC-V](https://gitlab.kitware.com/cmake/cmake/-/merge_requests/6551)
- [MR !6630, Generic-ELF platform module](https://gitlab.kitware.com/cmake/cmake/-/merge_requests/6630)
- [MR !10622, Android riscv64-linux-android](https://gitlab.kitware.com/cmake/cmake/-/merge_requests/10622)
- [xnox riscv64 branch](https://gitlab.kitware.com/xnox/cmake/-/commits/riscv64)
- [CMakePlatformId.h.in](https://gitlab.kitware.com/cmake/cmake/blob/79a21ba6804ea501365386ee2616441c9660f3ed/Modules/CMakePlatformId.h.in)
- [IAR-DetermineCompiler.cmake](https://gitlab.kitware.com/cmake/cmake/blob/395cbee2fce5a450d7909b218474dadbdb804d68/Modules/Compiler/IAR-DetermineCompiler.cmake)
- [KWIML abi.h](https://raw.githubusercontent.com/Kitware/CMake/master/Utilities/KWIML/include/kwiml/abi.h)
- [AlmaLinux cmake RISC-V backport commit](https://git.almalinux.org/rpms/cmake/commit/61e3e8f15d214e3c4ae39b6c7747aa49d2367d89)
- [PyPI cmake project](https://pypi.org/project/cmake/)
- [PyPI cmake JSON](https://pypi.org/pypi/cmake/json)
- [RISE wheel_builder cmake page](https://riseproject.gitlab.io/python/wheel_builder/packages/cmake.html)
- [Ubuntu resolute riscv64 main Packages index](http://ports.ubuntu.com/ubuntu-ports/dists/resolute/main/binary-riscv64/Packages.xz)
- [Launchpad Ubuntu Focal riscv64 cmake](https://answers.launchpad.net/ubuntu/focal/riscv64/cmake)
- [Launchpad Ubuntu Mantic riscv64 cmake](https://answers.launchpad.net/ubuntu/mantic/riscv64/cmake)
- [RISE members](https://riseproject.dev/members/)
- [RISE runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE SpeexDSP post](https://riseproject.dev/2026/10/13/accelerating-audio-processing-with-speexdsp-optimizations-for-risc-v/)
- [RVI Summit EU 2026 slides](https://riseproject.dev/wp-content/uploads/sites/25/2026/06/RVI-Summit-EU-2026-Ludovic-Nathan.pdf)
- [QEMU issue #3224](https://gitlab.com/qemu-project/qemu/-/issues/3224)
- [llama.cpp issue #17282](https://github.com/ggml-org/llama.cpp/issues/17282)
- [Capstone issue #2887](https://github.com/capstone-engine/capstone/issues/2887)
- [Orange Pi RV2 compile benchmark](https://tinycomputers.io/posts/the-orangepi-rv2.html)
- [Phoronix Fedora slow builds headline (pulse.bot mirror)](https://www.pulse.bot/hardware/news/current-risc-v-cpus-being-too-slow-causes-headaches-for-fedora-5x-slower-builds-50d3f4a8-26f8-44b3-9a21-ae04cb5d58b4/)