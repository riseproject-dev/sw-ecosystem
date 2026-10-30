---
title: Ninja
parent: Project Reports
color: yellow
dependencies:
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Python
    relation: build-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: re2c
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="ninja" %}

# Ninja

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-30<br/>
**Readiness:** yellow (clean-distro-build), release provider: distro<br/>
**Scope:** RISC-V (riscv64/linux) support status for Ninja<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Ninja is a small build system, written in portable C++17, that executes a pre-generated build graph. Higher-level generators such as CMake, Meson and GN produce its input. Evan Martin created it at Google for Chromium to fix slow incremental builds. It was announced around 2011 and moved to GitHub in 2013 ([Wikipedia](https://en.wikipedia.org/wiki/Ninja_(build_system)), [Wikidata](https://www.wikidata.org/wiki/Q28975257)). The license is Apache 2.0, per the same two sources. The [ninja-build.org](https://ninja-build.org/) pages fetched did not state a license.

- **Repository:** [ninja-build/ninja](https://github.com/ninja-build/ninja)
- **Governance:** No foundation, governance model, sponsor list or maintainer list was found on [ninja-build.org](https://ninja-build.org/) or in the Wikipedia entry. Ninja appears to be an independent, community-run project. This is an absence of evidence, not a confirmed fact. [NEEDS VERIFICATION]
- **Corporate maintainers:** Not determined. No MAINTAINERS, OWNERS or CODEOWNERS file was read, and the commit list was unavailable. Data not available: current maintainers and their employers.
- **RISE membership:** Ninja is not listed as a member or supported project on [riseproject.dev](https://riseproject.dev). RISE working groups exist for Compilers and Toolchains and for Developer Infrastructure, but Ninja is not named individually.
- **Platform scope:** The [manual](https://ninja-build.org/manual.html) says only that "Ninja currently works on Unix-like systems and Windows." Linux gets the most testing, and Mac OS X and FreeBSD are reported to work.
- **Community stance on new ports:** Data not available. The upstream issue and PR searches returned no riscv64 discussion, so no stance can be inferred.
- **Architecture-specific code:** None. Ninja has no JIT, SIMD or assembly, so a port is a recompile (see Section 4).

## 2. Port History and Upstreaming Timeline

No riscv64 port work exists upstream. No riscv64 issues, PRs or commits were found in ninja-build/ninja. Searches covered "riscv", "riscv64" and "risc-v" across issues, PRs and commits, and a grep of the local checkout at commit `3ccb2270e8ef5a84bb31c4651c0df84440f30362` (2026-10-18) found nothing. The checkout is shallow, so older history is not covered.

| Date | Event | Source |
|---|---|---|
| ~2011 / 2013 | Announced by Evan Martin at Google; moved to GitHub | [Wikipedia](https://en.wikipedia.org/wiki/Ninja_(build_system)) |
| 2023-04-05 | Issue #2284 "Linux aarch64 binaries" opened. Matched the `riscv64` search, but it is an aarch64 request. Its body mentions no riscv64, per a WebFetch summary (verbatim text unavailable) | [Issue #2284](https://github.com/ninja-build/ninja/issues/2284) |
| 2024-04-12 | Issue #2284 closed as completed, added to the 1.12.0 milestone | [Issue #2284](https://github.com/ninja-build/ninja/issues/2284) |
| 2025-06 | EESSI 2025.06 lists Ninja 1.13.0 for generic riscv64 | [EESSI](https://www.eessi.io/docs/available_software_riscv/detail/Ninja) |
| 2025-07-23 | Chimera Linux riscv64 package, ninja 1.13.1 | [Chimera Linux](https://pkgs.chimera-linux.org/package/current/main/riscv64/ninja) |
| 2026-03-24 | RISE announces native RISC-V GitHub runners (no Ninja mention) | [RISE blog](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) |
| 2026-08-26 | Cloud-V-10xE release includes a native riscv64 ninja-1.13.2 binary | [Cloud-V-10xE](https://github.com/Cloud-V-10xE/RISC-V-software/releases/tag/release-2026-08-26) |
| 2026-10-19 | RISE python-wheels issue #3524 "ninja riscv64 support" closed, moved to "Available Upstream" | [python-wheels #3524](https://github.com/riseproject-dev/python-wheels/issues/3524) |

- **Key contributors:** None identified for riscv64, because no riscv64-specific work exists.
- **Fully upstream?** Not applicable. There is nothing riscv64-specific to upstream. The code builds on riscv64 as ordinary C++, and the gap is infrastructure (CI and release binaries).
- **Older distro packages:** Ubuntu focal ships a riscv64 `ninja-build` 1.10.0 ([Ubuntu packages](https://packages.ubuntu.com/nl/focal/riscv64/ninja-build/download)). Debian sid also lists `ninja-build` for riscv64 ([Debian packages](https://packages.debian.org/zh-cn/sid/riscv64/ninja-build/filelist)).

## 3. Upstream Support Tier

- **Formal tier policy:** None found. The manual states only that Ninja works on Unix-like systems and Windows. PLATFORMS.md, SUPPORT.md and docs/platforms/ do not exist in the local checkout.
- **riscv64 evidence upstream:** No CI job, no release binaries (unverified, see Section 8), and no mention of riscv in the tree.
- **Effective tier for riscv64:** untested upstream. It is supported only by downstream distros building the unmodified source.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI (Linux) | Yes, `ubuntu-latest` and containers | Yes, native `ubuntu-24.04-arm` | None |
| Upstream CI (other OS) | macOS universal, Windows x64, AppVeyor | macOS arm64, Windows arm64 | None |
| Upstream release binaries | Yes (per issue #2284, Linux release binaries are x86-only) | Not provided as of 2023-04 (issue #2284); closed 2024-04-12 [NEEDS VERIFICATION on what shipped] | Unknown (release assets not listed) |
| Arch-specific source | None | None | None |

Source for CI: workflow files in the local clone ([.github/workflows](https://github.com/ninja-build/ninja/tree/master/.github/workflows)).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Ninja has no per-architecture source files. A search of the local checkout found no `.S` files, no inline asm and no SIMD intrinsics beyond the vendored headers below. `configure.py` branches on OS platform only, never on CPU architecture. A case-insensitive search for `riscv`, `__riscv` and `risc-v` returned nothing, and there are no `#ifdef __riscv` guards.

All architecture guards sit in two vendored third-party headers:

| Component | amd64 | arm64 | riscv64 | Quality on riscv64 |
|---|---|---|---|---|
| Core engine (graph, parser, scheduler, subprocess) | portable C++ | portable C++ | portable C++ | scalar, complete |
| `src/third_party/rapidhash/rapidhash.h` (64x64 to 128 multiply) | MSVC `_umul128` under `_M_X64`, else `__uint128_t` | MSVC `__umulh` path, else `__uint128_t` | `__uint128_t` when `__SIZEOF_INT128__` is defined, else a portable 32-bit-limb fallback | scalar, complete |
| `src/third_party/emhash/hash_table8.hpp` (prefetch) | `<xmmintrin.h>` and `_mm_prefetch` (MSVC only) | `__prefetch` (MSVC arm64 only) | `__builtin_prefetch` on GCC and Clang | scalar (compiler builtin), complete |
| Hand-tuned assembly or SIMD | none | none | none | missing, and not needed |
| JIT, crypto, GC barriers | none | none | none | not applicable |

- `rapidhash.h` also detects endianness through `__BYTE_ORDER__`.
- No ISA extension (RVV, Zbb, Zbc) is required or used.
- A search for `TODO|FIXME|not implemented|stub` in `src/` gave 9 generic hits (`clparser.cc`, `disk_interface.h`, `includes_normalize.h`, `subprocess-win32.cc` and two test files). None concerns architecture.
- Evidence for the riscv64 behavior is the compiler macros and the vendored headers' fallback paths, read from source. No riscv64 binary was run for this report.

## 5. Build System, Cross-Compilation, and Toolchain

Ninja has no riscv64-specific docs, toolchain files or Dockerfiles. `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake` and `cmake/toolchain-riscv64.cmake` do not exist. The build instructions are in the [README](https://github.com/ninja-build/ninja/blob/master/README.md).

**Native build commands (from the README, not documented specifically for riscv64):**

```
cmake -Bbuild-cmake -DBUILD_TESTING=OFF
cmake --build build-cmake
```
```
./configure.py --bootstrap
```

**Toolchain requirements (from the repository):**
- CMake 3.15 or newer (`cmake_minimum_required(VERSION 3.15)`).
- A C++17 compiler (`target_compile_features(... cxx_std_17)`, and `-std=c++17` in `configure.py`). The repository states no explicit GCC or Clang minimum.
- CI tests Rocky 8, Ubuntu 22.04 and 24.04 (GCC and Clang), Fedora 40 and Alpine edge with musl. GCC 8 is the effective floor, which is an inference from Rocky 8 and not stated by the repository.
- Python is needed only for `configure.py` and the optional `browse` tool.
- `re2c` is optional. If CMake finds re2c 2 or later it regenerates the lexers. Otherwise it uses the checked-in `src/lexer.cc` and `src/depfile_parser.cc`.

**Build flags:**
- `-DBUILD_TESTING=OFF` skips `ninja_test`. With testing on and no GTest available, CMake downloads googletest via FetchContent. That needs network access and can fail in cross or offline builds, so use `OFF` for riscv64 cross builds.
- `-DNINJA_BUILD_BINARY=ON|OFF` defaults to `ON`.
- `-DNINJA_FORCE_PSELECT=ON|OFF` defaults to `OFF`. Otherwise CMake detects `ppoll` and defines `USE_PPOLL=1` automatically.
- `-DNINJA_PYTHON=<interpreter>` sets the interpreter for the browse tool.
- `-DNINJA_CLANG_TIDY=ON|OFF` defaults to `OFF`.
- LTO is enabled automatically in Release builds when `check_ipo_supported` passes. If an LTO problem appears with a riscv64 cross toolchain, `-DCMAKE_INTERPROCEDURAL_OPTIMIZATION=OFF` is a possible workaround. It is untested and may not take effect, because the CMake file sets the Release-specific variable.

**Cross-compilation (suggested, not from Ninja docs, and not run).** The toolchain file below uses Debian's `riscv64-linux-gnu-g++` and `qemu-riscv64`.

```
# toolchain-riscv64.cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_FIND_ROOT_PATH /usr/riscv64-linux-gnu)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
```
```
cmake -S . -B build -G Ninja -DCMAKE_TOOLCHAIN_FILE=$PWD/toolchain-riscv64.cmake \
      -DCMAKE_BUILD_TYPE=Release -DBUILD_TESTING=OFF
cmake --build build
QEMU_LD_PREFIX=/usr/riscv64-linux-gnu qemu-riscv64 build/ninja --version
```

`configure.py --bootstrap` is unsuitable for cross builds. It builds a host `ninja` and then runs it, so a riscv64 binary would not run on an x86 host. Use CMake for cross builds, or run `configure.py` natively on riscv64 or under QEMU.

- **QEMU usage upstream:** none. `QEMU_LD_PREFIX` must point at the riscv64 sysroot for dynamically linked binaries.
- **Known build failures on riscv64:** none found. The PyPI wheels, Alpine, Ubuntu and Debian builds show it compiles on riscv64.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build graph execution, parsing, scheduling | Yes | Yes | Yes, by construction (portable C++); no riscv64 test run upstream |
| Hash table and hashing (rapidhash, emhash) | Yes | Yes | Yes, generic fallbacks |
| Test suite run in CI | Yes | Yes | No |
| Upstream binary release | Yes | Unknown after 2024-04 | Unknown |

- **Functional gaps:** none found. No feature depends on an architecture-specific path.
- **Performance gaps from missing SIMD:** none applicable, because Ninja has no SIMD code. No Ninja riscv64 benchmark was found for 2024 to 2026. The one OpenBenchmarking run involving a Meson/Ninja Mesa build on a StarFive VisionFive 2 failed with "ninja: command not found" and gives no timing ([result 2502116-NE-RISCVDEV102](https://openbenchmarking.org/result/2502116-NE-RISCVDEV102)). A secondary summary of Phoronix reporting says Fedora RISC-V builds are about 5x slower than x86_64 (Binutils 143 minutes against 29), as a whole-build figure that is not Ninja-specific ([pulse.bot](https://www.pulse.bot/hardware/blogs/current-risc-v-cpus-being-too-slow-causes-headaches-for-fedora-5x-slower-builds-50d3f4a8-26f8-44b3-9a21-ae04cb5d58b4)). It was not checked against the original article. [NEEDS VERIFICATION]
- **Security hardening gaps:** Data not available. No riscv64-specific hardening differences were searched.
- **NaN and floating-point semantics:** A search for "riscv nan floating" found no issues. No floating-point issue was found, which fits Ninja doing little floating-point work.

## 7. CI/CD Infrastructure

There is no riscv64 CI. This was confirmed by reading `.github/workflows/linux.yml`, `linux-musl.yml`, `macos.yml`, `windows.yml` and `appveyor.yml` in the local clone at commit `3ccb2270e8ef5a84bb31c4651c0df84440f30362`. `.gitlab-ci.yml`, `Jenkinsfile` and `.cirrus.yml` do not exist. No file in `.github/` or `appveyor.yml`, nor anywhere else in the checkout excluding `.git`, contains "riscv", "risc-v" or "qemu". All four workflows run on `pull_request` and `push`. `linux-musl.yml` also runs on `workflow_dispatch`. None has a `schedule` trigger.

| File | Runner | Architectures |
|---|---|---|
| `linux.yml` | `ubuntu-latest` and `ubuntu-24.04-arm`, with containers `fedora:40`, `rockylinux/rockylinux:8`, `ubuntu:22.04`, `ubuntu:24.04` | x86_64, aarch64 |
| `linux-musl.yml` | `ubuntu-24.04` with an `alpine:edge` container | x86_64 |
| `macos.yml` | `macos-14` | arm64 and x86_64 universal build |
| `windows.yml` | `windows-latest` | x64 and arm64 |
| `appveyor.yml` | Visual Studio 2017 and Ubuntu2204 images | x86_64 |

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native Linux CI | Yes | Yes (`ubuntu-24.04-arm`) | No |
| QEMU emulation | No | No | No |
| RISE runner used | No | No | No |

- **RISE runners:** RISE offers a native runner, `ubuntu-24.04-riscv`, on Scaleway EM-RV1 bare metal (one job per node, Kubernetes pods) ([announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)). Ninja itself is preinstalled in the runner images, which build it from source and pin it via `NINJA_VERSION` in `runner/images/versions-map.json` in [riscv-runner](https://github.com/riseproject-dev/riscv-runner). That content was seen through code-search snippets only. [NEEDS VERIFICATION] No evidence was found of the Ninja project using these runners.
- **Hardware used by Ninja CI for riscv64:** none.

## 8. Distribution and Release Status

| Channel | riscv64 | Version | Evidence |
|---|---|---|---|
| Upstream GitHub releases | Unknown | n/a | Release listing refused by the session; asset names not checked |
| PyPI `ninja` | Yes | 1.13.2 | `manylinux_2_31_riscv64` and `musllinux_1_2_riscv64` wheels ([PyPI](https://pypi.org/project/ninja/)); third-party packaging |
| Ubuntu 26.04 (resolute) | Yes | `ninja-build` 1.13.2-1 | Launchpad `getPublishedBinaries`, resolute/riscv64, Published ([Launchpad](https://launchpad.net/ubuntu/+source/ninja-build)) |
| Ubuntu focal | Yes | 1.10.0 | [Ubuntu packages](https://packages.ubuntu.com/nl/focal/riscv64/ninja-build/download) |
| Debian | Sid riscv64 listed; source package 1.13.2-1 in forky and sid, 1.12.1-1 in trixie | see left | [Debian filelist](https://packages.debian.org/zh-cn/sid/riscv64/ninja-build/filelist), [sources.debian.org](https://sources.debian.org/src/ninja-build/). Debian binary builds for the newer versions were not checked directly |
| Alpine v3.24 | Yes | 1.13.2-r1 | [Alpine packages](https://pkgs.alpinelinux.org/package/v3.24/community/riscv64/ninja-build) |
| Chimera Linux | Yes | 1.13.1 | [Chimera](https://pkgs.chimera-linux.org/package/current/main/riscv64/ninja) |
| EESSI 2025.06 | Yes | 1.13.0 | [EESSI](https://www.eessi.io/docs/available_software_riscv/detail/Ninja) |
| Cloud-V-10xE | Yes (prebuilt binary) | 1.13.2 | [release](https://github.com/Cloud-V-10xE/RISC-V-software/releases/tag/release-2026-08-26); third-party [NEEDS VERIFICATION] |
| RISE GitLab wheel index | Yes, stale | 1.11.1.1 to 1.11.1.3 | [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/packages/ninja.html); deprecated because PyPI now ships riscv64 wheels |
| Arch Linux RISC-V | Unknown | n/a | Index page listed no packages; repo listing connection reset |

- **RISE wheel index:** it tops out at 1.11.1.3 while PyPI carries 1.13.2. The RISE page itself marks its package deprecated for this reason.
- **What a user must do:** install `ninja-build` from Ubuntu, Debian or Alpine, or `pip install ninja` for a riscv64 wheel. Building from source needs only CMake and a C++17 compiler (Section 5).

## 9. Dependencies

Dependency research against the upstream manifest was limited. The data below comes from a local clone and distro evidence, and per-dependency riscv64 package status was not checked further.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| CMake | build-dependency, critical (3.15 or newer; `configure.py` is the CMake-free alternative) | Data not available: not checked in the research | Data not available | Data not available. The RISE December 2024 webinar slides list cmake among Python packages being built for riscv64 ([slides](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)) | Data not available |
| Python | build-dependency, optional (only for `configure.py` and the `browse` tool) | See status report at project-reports/python.md | See status report at project-reports/python.md | See status report at project-reports/python.md. [RISE reports](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/) Python now officially supports RISC-V | RISE has a Python RISC-V effort (same post) |
| GCC | build-dependency, critical (C++17 compiler; GCC 8 is the inferred floor) | Yes in practice: Ubuntu, Debian and Alpine build Ninja with it on riscv64 | Not tested upstream | Distro-provided | Data not available |
| LLVM | build-dependency, optional (Clang is an alternative compiler in the Ubuntu CI jobs) | Data not available | Data not available | Data not available | RISE Compilers and Toolchains working group exists ([RISE](https://riseproject.dev)) |
| googletest | test-dependency, optional (used when `BUILD_TESTING` is on; fetched via FetchContent if no GTest is found) | See status report at project-reports/googletest.md | See status report at project-reports/googletest.md | See status report at project-reports/googletest.md | Data not available |
| re2c | build-dependency, optional (regenerates lexers only when 2 or newer is found; checked-in generated files are used otherwise) | Data not available | Data not available | Data not available | Data not available |

- **Dependencies with JIT, SIMD, crypto or numerics:** none. All six are build or test tools, and Ninja links no runtime library beyond the C++ standard library.
- **Recursion:** Not performed. Data not available: transitive dependency trees for CMake, GCC and LLVM were not researched.
- **Risk:** Ninja's own build can drop re2c, Python and googletest, so the only critical dependencies are CMake and a C++17 compiler.

## 11. Known Bugs and Active Issues

No open riscv64 correctness or performance bugs were found in ninja-build/ninja. Searches for "riscv64 performance", "riscv64 bug" and "riscv nan floating" returned nothing riscv-specific. A broader "RISC-V build failure or slow" query returned 7 results. Issue read access was refused, so these are search-result summaries only.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2284](https://github.com/ninja-build/ninja/issues/2284) | Linux aarch64 binaries | Closed 2024-04-12 | Not applicable | Matched the `riscv64` search but is an aarch64 binaries request; false match |
| [#481](https://github.com/ninja-build/ninja/issues/481) | Murmur hash does unaligned memory accesses, breaking SPARC | Closed (2013) | Not applicable | SPARC, not RISC-V |
| [#956](https://github.com/ninja-build/ninja/issues/956) | rsp file directory separators with ARM cross compiler | Closed (2015) | Not applicable | Unrelated |
| [#2223](https://github.com/ninja-build/ninja/issues/2223) | Ninja randomly fails without logging anything | Open (updated 2026-05-21) | Unknown | No RISC-V link found |
| [#2112](https://github.com/ninja-build/ninja/issues/2112) | Buildroot ninja build error, file in wrong format | Open (2023) | Unknown | Looks like a host/target toolchain mix-up, not a RISC-V bug |

- **Correctness bugs on riscv64:** none found.

## 12. Objections and Upstream Blockers

- **Stated objections:** none. No riscv64 issue, PR or discussion exists upstream.
- **Technical blockers:** none found. The code is portable C++ and builds on riscv64 in several distros.
- **Organizational blockers:** Data not available: the maintainers' stance on adding a riscv64 CI job or release binaries was not determined, and no request has been made.
- **Acceptance probability:** Not assessed from evidence. A CI-only change touches only `.github/workflows` and carries no source risk, but the research found no maintainer statements to estimate acceptance. Upstream already runs native aarch64 on GitHub-hosted runners (`ubuntu-24.04-arm`), which is a precedent for adding a native-architecture job.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** Ninja has no riscv64 CI upstream. The workflows in [.github/workflows](https://github.com/ninja-build/ninja/tree/master/.github/workflows) and appveyor.yml cover x86_64, aarch64, macOS and Windows only, with no riscv, qemu or riscv64 runner. Distros ship it for riscv64 as unmodified portable C++, with no riscv64-specific code or patches found: [Ubuntu 26.04 ninja-build 1.13.2-1](https://launchpad.net/ubuntu/+source/ninja-build), Debian, Alpine, and [PyPI ninja 1.13.2 riscv64 wheels](https://pypi.org/project/ninja/) (third-party packaging). This is the clean-distro-build floor, so yellow. The release is provided by distros, not upstream. Ninja is not an optimization-purpose project, so no cap applies.
- **Pending work that could change the grade:**
  - There are no open upstream riscv64 issues or PRs. Issue #2284 is an aarch64 binaries request, a false match for the riscv64 search.
  - RISE involvement is indirect. RISE runs Ninja in its runner images, and its Python wheel builder has deprecated its own ninja wheels now that PyPI ships riscv64 ones (python-wheels #3524, closed 2026-10-19).
  - The packaging-diff check was not done directly, so the "unpatched" status rests on distros building it as plain upstream C++. Confirming it would settle yellow versus orange.
  - Upstream GitHub release assets were not listed.
  - Adding a riscv64 CI job (for example on RISE runners) running the test suite would move it to blue, and upstream-published riscv64 binaries would then move it to green.

## 14. Investment Analysis

**Prior RISE work (checked first, not re-sized):**
- RISE built riscv64 Python wheels for ninja (1.11.1.1 to 1.11.1.3). The package is now deprecated, because PyPI ships 1.13.2 riscv64 wheels. See the [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/packages/ninja.html).
- RISE preinstalls Ninja in the riscv64 runner images, built from source.
- No funded RISE work for Ninja itself was found.
- Wheel packaging and runner-image provisioning need no further investment.

**Effort figures below are estimates by the author, not derived from the research findings.**

### 14.1 Functional Enablement

No functional gap exists. The only work is a confirmation pass: run the upstream test suite natively on riscv64 and diff the Debian and Ubuntu packaging against upstream, to confirm "unpatched". That check would settle yellow versus orange.

### 14.2 Performance Optimization

No architecture-specific code exists to optimize, and no Ninja riscv64 benchmark exists. The only candidate is a measurement: a matched riscv64 versus arm64 build of one project with Ninja, as a baseline. No optimization work is justified without that data.

### 14.3 CI/CD Infrastructure

Add a native riscv64 job to `linux.yml` on a RISE runner (`ubuntu-24.04-riscv`) running the existing test suite. The work is to port an existing job definition and pin the runner label. This is the step that moves the grade to blue.

### 14.4 Ecosystem Enablement

Engage upstream on publishing riscv64 release binaries, then check the release asset list (not done in this research). This is the step from blue to green. No dependent package ecosystem work is needed beyond PyPI, which already ships wheels.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Run the test suite natively on riscv64 and diff distro packaging against upstream to confirm "unpatched" | 0.5 | RISE / distro-integration | Medium |
| Performance | Baseline Ninja build-time measurement, riscv64 versus arm64 | 1 | RISE / developer-infrastructure | Low |
| CI/CD | Upstream PR adding a native riscv64 job on RISE runners | 1 | RISE / developer-infrastructure | High |
| Ecosystem | Request upstream riscv64 release binaries and check the current GitHub release assets | 1 | RISE / maintainers | Medium |

## 15. References

- [Ninja repository](https://github.com/ninja-build/ninja)
- [Ninja homepage](https://ninja-build.org/)
- [Ninja manual](https://ninja-build.org/manual.html)
- [Ninja CI workflows](https://github.com/ninja-build/ninja/tree/master/.github/workflows)
- [Ninja README](https://github.com/ninja-build/ninja/blob/master/README.md)
- [Ninja issue #2284, Linux aarch64 binaries](https://github.com/ninja-build/ninja/issues/2284)
- [Ninja issue #481](https://github.com/ninja-build/ninja/issues/481)
- [Ninja issue #956](https://github.com/ninja-build/ninja/issues/956)
- [Ninja issue #2223](https://github.com/ninja-build/ninja/issues/2223)
- [Ninja issue #2112](https://github.com/ninja-build/ninja/issues/2112)
- [Ninja (build system), Wikipedia](https://en.wikipedia.org/wiki/Ninja_(build_system))
- [Ninja, Wikidata Q28975257](https://www.wikidata.org/wiki/Q28975257)
- [PyPI ninja](https://pypi.org/project/ninja/)
- [Launchpad ninja-build](https://launchpad.net/ubuntu/+source/ninja-build)
- [Ubuntu focal riscv64 ninja-build](https://packages.ubuntu.com/nl/focal/riscv64/ninja-build/download)
- [Debian sid riscv64 ninja-build filelist](https://packages.debian.org/zh-cn/sid/riscv64/ninja-build/filelist)
- [Debian sources ninja-build](https://sources.debian.org/src/ninja-build/)
- [Alpine v3.24 riscv64 ninja-build](https://pkgs.alpinelinux.org/package/v3.24/community/riscv64/ninja-build)
- [Chimera Linux riscv64 ninja](https://pkgs.chimera-linux.org/package/current/main/riscv64/ninja)
- [EESSI Ninja riscv64](https://www.eessi.io/docs/available_software_riscv/detail/Ninja)
- [Cloud-V-10xE RISC-V-software release 2026-08-26](https://github.com/Cloud-V-10xE/RISC-V-software/releases/tag/release-2026-08-26)
- [RISE wheel builder, ninja package](https://riseproject.gitlab.io/python/wheel_builder/packages/ninja.html)
- [RISE python-wheels issue #3524](https://github.com/riseproject-dev/python-wheels/issues/3524)
- [RISE riscv-runner](https://github.com/riseproject-dev/riscv-runner)
- [RISE project](https://riseproject.dev)
- [RISE announcement of RISC-V runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE: Python now officially supports RISC-V](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [RISE Webinar December 2024 slides](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)
- [OpenBenchmarking result 2502116-NE-RISCVDEV102](https://openbenchmarking.org/result/2502116-NE-RISCVDEV102)
- [Fedora RISC-V build times summary (pulse.bot)](https://www.pulse.bot/hardware/blogs/current-risc-v-cpus-being-too-slow-causes-headaches-for-fedora-5x-slower-builds-50d3f4a8-26f8-44b3-9a21-ae04cb5d58b4)