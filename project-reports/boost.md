---
title: Boost
parent: Project Reports
color: yellow
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: bzip2
    relation: runtime-dependency
    criticality: optional
  - name: xz
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: ICU
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: Python
    relation: runtime-dependency
    criticality: optional
  - name: Open MPI
    relation: runtime-dependency
    criticality: optional
  - name: libiconv
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="boost" %}

# Boost

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Boost<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Boost is a collection of C++ libraries distributed as a superproject at [boostorg/boost](https://github.com/boostorg/boost) (homepage: [boost.org](https://www.boost.org/)). At the inspected HEAD (a71862f) the superproject version is 1.93.0. Architecture-specific code is not in the superproject. It lives in sub-repositories: `boostorg/context` (assembly), `boostorg/predef` (architecture detection), `boostorg/atomic`, `boostorg/build` (b2) and `boostorg/config`.

Governance:
- boost.org names no foundation as owner or overseer. It does not mention the Software Freedom Conservancy.
- boost.org lists C++ Alliance people: Rene Ferdinand Rivera Morell (Board Member), Mark Cooper (CMO), and Joaquin M Lopez Munoz and Alan de Freitas (Software Engineers). The ownership relationship between the C++ Alliance and Boost was not verified. Data not available: a statement of foundation or fiscal-sponsor status on boost.org.
- Libraries have individual maintainers. Release managers approve changes after a release closes. Library acceptance is by public peer review. The site names Peter Dimov (Boost.System maintainer) and Beman Dawes (author).
- License: Boost Software License (BSL-1.0), a permissive one-paragraph license that requires attribution in source but not in binaries.

Corporate sponsors: boost.org lists none. Microsoft, Adobe and Citigroup appear only as organisations that have used the license. Data not available: a top-contributor ranking and MAINTAINERS/CODEOWNERS contents.

Community stance on new ports: no explicit policy was found. RISC-V support arrived as small contributions from individuals (build-system architecture definition, predef detection, an atomic pause instruction) and was merged with no visible sponsorship requirement. This is inferred from the commit pattern, not from a stated policy.

RISE relationship: Boost is not a RISE member. See [RISE members](https://riseproject.dev/members/), which lists 8 Premier and 12 General members, and neither Boost nor the C++ Alliance is among them.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019 | boostorg/context issue #86 "have a plan to support riscv platform?" opened and later closed | [context #86](https://github.com/boostorg/context/issues/86) |
| 2019-04-16 | Andreas Schwab: "Define the riscv architecture feature (#424)" in boostorg/build. Earliest RISC-V commit found in the org. | GitHub commit search, org:boostorg (14 matches) |
| 2019-08-03 | Andreas Schwab: "Add detection of RISC-V from `__riscv` (#97)" in boostorg/predef | GitHub commit search |
| 2019-08-03 | Thomas Petazzoni: "Add RISC-V endian detection (#100)" in boostorg/predef | GitHub commit search |
| 2019-08-04 | Rene Rivera: "Start of 1.11 version. Add missing (c) for riscv.h" in boostorg/predef | GitHub commit search |
| 2019-12 | Debian bug report asks to enable Boost.Context on riscv64 for boost1.71 | [debian-riscv list](https://lists.debian.org/debian-riscv/2019/12/msg00007.html) |
| 2023-10-23 | boostorg/context #243 "Asm parts are not compiled when building boost 1.83 on riscv64 linux" closed | [context #243](https://github.com/boostorg/context/issues/243) |
| 2023-10-24 | XieJiSS: "Implement pause support for RISC-V" in boostorg/atomic | GitHub commit search |
| 2025-07-15 | boostorg/context #306 "Boost context support for riscv64" closed | [context #306](https://github.com/boostorg/context/issues/306) |
| 2026-04-13 | Ubuntu libboost-dev 1.90.0.1ubuntu3 published for resolute riscv64 | Launchpad `getPublishedBinaries` |

Key contributors: Andreas Schwab (build, predef; commonly associated with SUSE, employer not verified here), Thomas Petazzoni (predef), Rene Rivera (predef), XieJiSS (atomic). Employer data for all of them is not available.

Is it fully upstream? The riscv64 code for build, predef, atomic and context is present in the upstream sub-repositories (see Section 4). The superproject `boostcpp.jam` lists `riscv` in `.deducible-architectures`. The exact date the context riscv64 assembly landed upstream is not available in the findings. An openSUSE [riscv-support.patch](https://src.opensuse.org/rpm/boost/src/commit/28fa5388eaf03cb5627d80a8e80f112d26717ede16f4b145ed4d9b84c3a1e8b8/riscv-support.patch) adds a RISC-V architecture header to Boost.Predef. Whether it is still needed against current upstream was not checked. [NEEDS VERIFICATION]

## 3. Upstream Support Tier

Formal tier policy: not found. No `PLATFORMS.md`, `SUPPORT.md` or `docs/platforms/` was located. The boost.org site tagline says Boost works "across all platforms, compilers, and C++ standards", which implies no formal tier list. Data not available: a platform-tier file in the repository (only partially searched).

Evidence for riscv64:
- Upstream ships source tarballs only (see Section 8). Official riscv64 binaries do not exist.
- No riscv64 job in the superproject CI. The only riscv64 CI found in the ecosystem is a QEMU job in boostorg/context (Section 7).
- riscv64 is not release-blocking, as no CI gate exists for it in the superproject.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Superproject CI | Yes (x86_64) | Yes (`ubuntu-24.04-arm`, plus Windows arm64 job) | None |
| Library-level CI | Yes | QEMU in boostorg/build (arm64, armhf) | QEMU in boostorg/context only |
| Official binaries | None (source only) | None (source only) | None (source only) |
| Distro packages | Not examined | Not examined | Yes (Section 8) |
| Formal tier | Not stated | Not stated | Not stated |

## 4. Technical Architecture and RISC-V-Specific Subsystems

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Boost.Context assembly (jump/make/ontop) | x86_64 is the CMake fallback architecture; file counts not determined | Present; open Windows ARM64 issues #254, #296 imply support | Present: `jump_`, `make_`, `ontop_riscv64_sysv_elf_gas.S` (sysv ABI, ELF, gas) |
| Boost.Predef | Not examined | Not examined | `BOOST_ARCH_RISCV` detected via `__riscv`; endian detection added |
| Boost.Atomic | Not examined | Not examined | pause instruction implemented (2023-10-24) |
| b2 build system | Not examined | Not examined | `riscv` architecture feature, vcpkg `riscv64-linux` triplet, `OSPLAT=RISCV64` in `jam.h` |
| SIMD / vector | Not examined | Not examined | None found in the superproject: code search for `rvv` and `vfloat32m1_t` returned 0 results |
| JIT | Not applicable (none found) | Not applicable | Not applicable |
| Crypto | Data not available: Boost has no crypto subsystem in the findings; OpenSSL is an external optional dependency | Same | Same |

Boost.Context details:
- `CMakeLists.txt` accepts `riscv64` in `BOOST_CONTEXT_ARCHITECTURE`.
- `Jamfile.v2` selects the assembly for `<architecture>riscv` with `address-model=64`.
- The ABI defaults to sysv and the assembler to gas.

Assembly quality: the files are hand-written assembly by name. The ISA extensions used, line counts and any TODO/stub status were not determined (the file fetch step was blocked). Data not available: a completeness scan of the riscv64 assembly.

Two code-search results are worth recording. The superproject `boostcpp.jam` is the only file matching `riscv`, and `#ifdef __riscv` returned 0 results. These searches ran against the superproject only, and the sub-repositories hold the arch code.

## 5. Build System, Cross-Compilation, and Toolchain

Boost has no riscv64-specific build documentation and no Dockerfile. The following was checked in a shallow clone of boostorg/boost: `README.md` has no build instructions, `INSTALL` points to the getting-started page, and no `BUILDING.md`, `cross-compilation.md`, `cmake/riscv64.cmake` or `Dockerfile.riscv64` exists. The commands below are assembled from upstream CI and docs. Nothing was run, so the riscv64 invocations are unverified. [NEEDS VERIFICATION]

Native b2 (from the superproject CI, `-j3` kept):

    ./bootstrap.sh
    ./b2 -j3 --prefix=$HOME/.local install

Native CMake (from the `cmake-install-posix` CI job):

    mkdir __build__ && cd __build__
    cmake -DBUILD_SHARED_LIBS=ON -DCMAKE_INSTALL_PREFIX=~/.local ..
    cmake --build . -j 3
    cmake --build . -j 3 --target install

Tests (from CI):

    cmake -DBUILD_TESTING=ON ..
    cmake --build . -j 3 --target tests-quick
    ctest --output-on-failure --no-tests=error -j 3

Cross-compilation with b2: the b2 docs show only an ARM example (`toolset=gcc-arm`). For riscv64, add `using gcc : riscv : riscv64-linux-gnu-g++ ;` to `user-config.jam` and run `b2 toolset=gcc-riscv target-os=linux architecture=riscv address-model=64`. The compiler name and the architecture/address-model flags are substitutions, not documented. b2 itself must be built for the host.

Cross-compilation with CMake: no toolchain file ships with Boost. You write one with `CMAKE_SYSTEM_NAME Linux`, `CMAKE_SYSTEM_PROCESSOR riscv64` and the riscv64 cross compilers. Boost.Context auto-detects riscv64 only if `CMAKE_SYSTEM_PROCESSOR` is exactly `riscv64`. Otherwise it falls back to `x86_64`. Force it with `-DBOOST_CONTEXT_ARCHITECTURE=riscv64`.

Toolchain versions:
- The superproject `CMakeLists.txt` declares `cmake_minimum_required(VERSION 3.8...3.16)` and project `Boost VERSION 1.93.0 LANGUAGES CXX`. The main logic is in the `boostorg/cmake` submodule (`tools/cmake/include/BoostRoot.cmake`).
- No exact GCC or Clang minimum is stated for the superproject, and none for riscv64. `boost/config` `gcc.hpp` uses cut-offs of GCC below 7 for one workaround and Clang 4. Each library sets its own C++ standard in `meta/libraries.json` (`context` is C++11).
- Data not available: riscv64-specific compiler minimums and the reason for them.

Disable flags (no `-DUSE_X=OFF` style flags):
- CMake: `-DBOOST_EXCLUDE_LIBRARIES="a;b"`, `-DBOOST_INCLUDE_LIBRARIES="..."`, `-DBOOST_ENABLE_MPI=OFF` and `-DBOOST_ENABLE_PYTHON=OFF` (both default OFF when Boost is top-level), `-DBOOST_SKIP_INSTALL_RULES`.
- b2: `--without-<lib>` (for example `--without-mpi`), `--with-<lib>`.
- Nothing riscv-specific is disabled anywhere in the CI.

QEMU usage: the boostorg/context `multi.yml` installs `qemu-user-static`, then runs `docker run --platform linux/riscv64 ... debian:experimental`. Inside it runs `apt-get install g++`, `./bootstrap.sh`, `./b2 libs/config/test//print_config_info`, and `./b2 libs/context/test`.

Known build failures:
- [context #243](https://github.com/boostorg/context/issues/243): asm parts not compiled when building boost 1.83 on riscv64 Linux (closed 2023-10-23).
- Downstream: a python-wheels patch for `ray` ("Build boost.context's riscv64 assembly") and a patch for `rdkit` ("Teach the vendored Conan boost recipe about riscv64") show bundled Boost copies needing riscv64 fixes. The `stpyv8` patch drops the `boost_system` link because Boost 1.89 removed it. That last one is not riscv-specific.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Context / Coroutine / Fiber (context switching) | Supported | Supported | Supported via riscv64 asm; tested in upstream context QEMU CI |
| Architecture detection (Predef) | Not examined | Not examined | Supported |
| Atomic pause | Not examined | Not examined | Implemented |
| Build via b2 | Yes | Yes | Yes (architecture feature exists) |
| Build via CMake | Yes | Yes | Yes; needs explicit architecture if the processor name differs |
| Vector (RVV) optimizations | Not examined | Not examined | None found in the superproject |

Functional gaps: none found. No open riscv64 issues were found in boostorg/boost, boostorg/context or boostorg/predef. The three context riscv64 issues (#86, #243, #306) are all closed.

Performance gaps: Data not available. No Boost-specific riscv64 benchmark was found in two web searches or in the RISE material. [CodSpeedHQ/boost-benches](https://github.com/CodSpeedHQ/boost-benches) is the closest suite (Google Benchmark; string, container, utility, optional, spirit, multiindex, graph and serialization suites), but it publishes no riscv64 or arm64 results. No riscv64 vs arm64 Boost comparison exists in the findings.

Security hardening gaps: Data not available. Nothing about hardening on riscv64 was searched.

NaN and floating-point semantics: Data not available. A search for "riscv nan floating" in boostorg/boost returned 0 results, which is not evidence of absence.

## 7. CI/CD Infrastructure

The superproject CI at HEAD a71862f runs x86_64, `ubuntu-24.04-arm` and macOS. There is no riscv64 job. The only riscv64 CI confirmed from file contents is the boostorg/context QEMU job described in Section 5. It runs `./b2 libs/context/test` on `debian:experimental` under `qemu-user-static`, and covers one library out of roughly 180.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Superproject CI | Yes | Yes (`ubuntu-24.04-arm`) | None |
| Hardware | GitHub-hosted | GitHub-hosted arm runner | None (QEMU emulation in context only) |
| boostorg/build QEMU workflow | Not examined | armhf, arm64, ppc64el | Not included |
| boostorg/config QEMU | Not examined | aarch64 | Not included (aarch64, s390x, ppc64le only) |
| boostorg/context | Yes | Not stated | QEMU, `libs/context/test` only |
| RISE runners (`ubuntu-24.04-riscv`) | No | No | No usage found |

Caveats:
- A `posix-riscv64` job with toolset `gcc-riscv64` in `boostorg/uuid` is reported by a single source, and the file was not read. [NEEDS VERIFICATION] The readiness grade counts only the context job as confirmed.
- Whether the context riscv64 job is required for merge was not verified.
- The CircleCI image `cppalliance/boost_superproject_build:26.04-v1` is an x86 release image whose contents were not checked.
- The CI files at `.gitlab-ci.yml`, `Jenkinsfile` and `.cirrus.yml` were not confirmed. Other CI systems (Drone, AppVeyor) were not checked.

## 8. Distribution and Release Status

Upstream releases: source tarballs only (per the readiness grade). Data not available: GitHub release asset listing for boostorg/boost (asset names were not retrieved).

Language channels:
- PyPI `boost` is an unrelated package (version 0.1, sdist only). It is not the Boost C++ libraries.
- The RISE wheel index has no own `boost` package and redirects to PyPI.
- The [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) does not list Boost among its 75 packages. The `riseproject-dev/python-wheels` repo has `cmeel-boost` and `boost-histogram` package definitions.

Distribution packages with riscv64:

| Distro | Version | Source |
|---|---|---|
| Ubuntu 26.04 (resolute) | libboost-dev 1.90.0.1ubuntu3 (published 2026-04-13); libboost1.90-dev 1.90.0-6ubuntu1; libboost-python1.90.0 1.90.0-6ubuntu1. `python3-boost` does not exist. | Launchpad `getPublishedBinaries` |
| Ubuntu noble | 1.83 ([libboost-wave1.83.0](https://launchpad.net/ubuntu/noble/riscv64/libboost-wave1.83.0/1.83.0-2.1ubuntu2)); [test rebuild of 1.83.0-2.1ubuntu3](https://launchpad.net/ubuntu/+archive/test-rebuild-20240502-noble-gcc/+build/28297296) | Launchpad |
| Arch Linux RISC-V | boost 1.92.0-1 and boost-libs 1.92.0-1 (`extra`); Boost is not in the archriscv-packages blacklist | archriscv.felixc.at repo listing |
| Alpine | [boost1.84-libs](https://pkgs.alpinelinux.org/package/v3.23/main/riscv64/boost1.84-libs) (v3.23 main); [boost1.89-dev](https://pkgs.alpinelinux.org/package/edge/testing/riscv64/boost1.89-dev) (edge testing) | pkgs.alpinelinux.org |
| Debian ports | [libboost1.81-dev](https://packages-picconi.debian.org/sid/riscv64/libboost1.81-dev/download) | Debian |
| Fedora | 1.83 RPM on [riscv-koji](https://riscv-koji.fedoraproject.org/koji/rpminfo?rpmID=8865) | Fedora Koji |
| Rocky 10 | boost-b2-1.83.0-5.el10.riscv64.rpm (mirror listing) | [mirrors.mit.edu](https://mirrors.mit.edu/rocky/10/CRB/riscv64/kickstart/Packages/b) |

The Ubuntu 26.04 and Arch packages above come from direct queries. The Alpine, Debian, Fedora and Ubuntu noble entries were reported from search results and not re-checked. An [AUR package](https://aur.archlinux.org/packages/android-riscv64-boost) builds Boost for Android riscv64.

What a user must do: install the distro package on a distro with riscv64 support (for example the Ubuntu 26.04 `libboost-dev` or the Arch RISC-V `boost` package). Otherwise build from the source tarball using the commands in Section 5. Whether Debian or Ubuntu carry riscv64-specific patches was not checked.

## 9. Dependencies

Boost is a source library set. Most dependencies are optional and enabled per library. Roles are from general knowledge of Boost's optional external libraries and were not parsed from the manifest, because the manifest fetch was blocked. All role entries are [NEEDS VERIFICATION]. Status columns for rows with a report come from the local sw-ecosystem reports in `project-reports/`. The project graph tool was unavailable, so no graph data exists for any row.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community and report |
|---|---|---|---|---|---|
| GCC | Build dependency (critical). The context QEMU job installs `g++` on `debian:experimental`. | Builds Boost.Context under QEMU | Data not available | Data not available | No report read; no GCC minimum stated by Boost |
| CMake | Build dependency (optional). Superproject minimum is 3.8...3.16. | Data not available | Data not available | Data not available | No report read |
| zlib | Boost.Iostreams compression | Portable C, builds | Upstream CI covers OpenBSD/riscv64 only (PR #1139); no Linux riscv64 CI | v1.3.2 has no riscv64 source changes; distros ship it | project-reports/zlib.md (blue) |
| bzip2 | Boost.Iostreams compression | Portable C89, builds | No upstream CI | Distro-shipped | project-reports/bzip2.md (yellow) |
| xz | Boost.Iostreams compression | Builds; RISC-V BCJ filter present | Round-trip tests on x86-64/ARM64 CI, not native riscv64 | No upstream riscv64 binaries; Debian sid 5.8.3-1 | project-reports/xz.md (yellow) |
| zstd | Boost.Iostreams compression | Builds | QEMU user-mode CI | Debian 1.5.7+dfsg-3+b2 | project-reports/zstd.md (blue) |
| ICU | Boost.Locale Unicode backend | Builds, scalar C fallback | CI does not test riscv64 | No upstream riscv64 binaries | project-reports/icu.md (yellow) |
| OpenSSL | Boost.Asio / Beast SSL | Builds; riscv64 target since 2021 | QEMU CI plus nightly native job | Upstream source releases carry riscv64 | project-reports/openssl.md (blue) |
| Python | Boost.Python (default OFF as top-level) | PEP 11 Tier 3 for riscv64 from CPython 3.16 | 4 RISC-V buildbots pass | No upstream riscv64 binaries; consumed via distros | project-reports/python.md (blue) |
| Open MPI | Boost.MPI (default OFF as top-level) | Data not available | Data not available | Data not available | In `projects.yml`; no report file |
| libiconv | Boost.Locale alternative backend | Data not available | Data not available | Data not available | Not in `projects.yml` |
| LZ4 (additional, unconfirmed for Boost) | Possible compression backend | Builds; detection merged in v1.10.0 | QEMU CI includes riscv64 | v1.10.0 has detection only; Zicclsm fix (#1648) unreleased | project-reports/lz4.md (yellow) |
| Boost.Context asm backend (internal) | Boost.Context / Coroutine / Fiber | Covered in Section 4 | Context QEMU CI | Part of the Boost release | No separate report |

Deep-dive on dependencies with SIMD, crypto or JIT:
- zstd: [PR #4596](https://github.com/facebook/zstd/pull/4596) (Zicclsm unaligned access, +74% on SG2044) is awaiting a maintainer. It affects performance only.
- LZ4: RVV performance PRs (#1678 and others) are unmerged.
- OpenSSL: no merged riscv64-specific EC P-256/P-384 assembly and no FIPS self-test leg.
- Python: JIT and perf trampoline are unimplemented on riscv64.
- ICU: scalar C fallback only; CI does not test riscv64.

Recursion to 2-3 levels was not done for any dependency. Data not available: transitive dependency analysis (the manifest was not parsed and the graph tool was unavailable).

## 11. Known Bugs and Active Issues

No open riscv64 issue was found in boostorg/boost, boostorg/context or boostorg/predef.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [context #306](https://github.com/boostorg/context/issues/306) | Boost context support for riscv64 | Closed 2025-07-15 | Functional (resolved) | Closure rationale not read |
| [context #243](https://github.com/boostorg/context/issues/243) | Asm parts are not compiled when building boost 1.83 on riscv64 linux | Closed 2023-10-23 | Functional (resolved) | Asm was silently not built |
| [context #86](https://github.com/boostorg/context/issues/86) | have a plan to support riscv platform? | Closed (2019) | Informational | Pre-dates the port |
| [boost #474](https://github.com/boostorg/boost/issues/474) | RISC degradation bug in 1.71.0.0ubuntu2 | Closed 2021-01-30 | Not RISC-V (probable) | Two sources describe it differently: a performance regression report against Ubuntu's 1.71 package, and an arm/v7 date bug. Both say it is unrelated to RISC-V, but the body was not read. |
| [boost #460](https://github.com/boostorg/boost/issues/460) | Configure error on ppc64le GNU/Linux | Open | Not RISC-V | Matched only by fuzzy search |
| [boost #983](https://github.com/boostorg/boost/issues/983) | aarch64-w64-mingw32 `winfib` build fails with undefined `jump_fcontext` | Open | Not RISC-V | Context-related on another architecture |

Correctness bugs: none found for riscv64. Issue bodies for #474 and #460 could not be read; relevance was judged from titles only.

## 12. Objections and Upstream Blockers

Stated objections: none found. No RISC-V-related objection or rejected PR was found in the searches (PR searches for "riscv" and "riscv64" in boostorg/boost returned 0 results).

Technical blockers: none identified. Two items remain unverified: the completeness of the context riscv64 assembly, and whether any distro carries riscv64-specific patches (Debian/Ubuntu).

Organisational blockers:
- No riscv64 CI job in the superproject, and no RISE runner usage.
- No RISE involvement. RISE's small-projects funding tier of 500 euros for adding linux-riscv64 to CI exists, and no Boost award was found. RISE's blog, runner announcements ([runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), [six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)) and the GitHub org search did not mention Boost. The blog feed covers only about the 10 most recent posts.
- Upstream riscv64 binaries are not realistic for a source-distributed library.

Acceptance probability: small riscv64 contributions have been merged without sponsorship requirements (Section 1). A CI-job PR would likely be accepted, but no maintainer statement exists. This is an inference. [NEEDS VERIFICATION]

## 13. Readiness Assessment

- **Color:** yellow (partial-ci-context-only: no superproject riscv64 CI; QEMU test job only in boostorg/context; closest standard case is clean-distro-build, distro patch status unchecked)
- **Release provider:** distro

Justification: the boostorg/boost superproject CI (x86_64, ubuntu-24.04-arm, macOS) has no riscv64 job. The only riscv64 CI found is the QEMU job in [boostorg/context multi.yml](https://github.com/boostorg/context/blob/develop/.github/workflows/multi.yml), which runs `./b2 libs/context/test` on debian:experimental for one library out of roughly 180. Upstream ships only source tarballs. riscv64 builds come from distros ([Ubuntu 26.04 libboost1.90](https://launchpad.net/ubuntu/+source/boost1.90), Arch RISC-V 1.92, Alpine, Debian, Fedora). riscv64 code is upstream in context (asm), predef (`BOOST_ARCH_RISCV`), build and atomic, and context issues #243 and #306 are closed. It is yellow rather than blue because the test suite does not run on riscv64 for Boost as a whole, and rather than orange because the one arch-specific component is tested upstream and distros build it. Confidence is medium. The CI facts come from a shallow clone of the repositories, and no live spot-check was run.

Pending work that could change the grade:
- No open riscv64 issues or PRs were found in boostorg/boost, boostorg/context or boostorg/predef.
- No RISE involvement found. Downstream RISE work only patches Boost as bundled in other projects (python-wheels patches for ray and rdkit).
- A riscv64 job in the superproject CI, ideally on RISE runners (`ubuntu-24.04-riscv`) running the quick test target, would raise this to blue. The release provider would remain the distros.
- Not verified: whether Debian or Ubuntu carry riscv64-specific patches (the grade would drop to orange if they do), the GitHub release assets, and whether the context riscv64 job is required for merge.

## 14. Investment Analysis

RISE check before sizing: no RISE work or funding for Boost was found (Sections 1 and 12). Downstream python-wheels patches exist for packages that bundle Boost (ray, rdkit, stpyv8, ompl) and are not counted here. The effort figures below are planning estimates by the author, not data from the research. They are [NEEDS VERIFICATION] by the team that would do the work.

### 14.1 Functional Enablement

- Audit the Boost.Context riscv64 assembly (`jump_`, `make_`, `ontop_`) for completeness, ISA extensions and stubs; none of this was determined.
- Confirm Debian and Ubuntu carry no riscv64-specific Boost patches. This decides whether the grade is yellow or orange.
- Document riscv64 cross-compilation (b2 and a CMake toolchain file), which does not exist today.
- Check `boostorg/uuid` `posix-riscv64` job and the atomic backends.

### 14.2 Performance Optimization

- No Boost riscv64 benchmark exists. Run [boost-benches](https://github.com/CodSpeedHQ/boost-benches) on riscv64 and arm64 hardware to establish a baseline before scoping any RVV work.
- No SIMD work can be sized until the baseline exists.

### 14.3 CI/CD Infrastructure

- Add a riscv64 job to the superproject CI on RISE runners (`ubuntu-24.04-riscv`) running the quick test target (`tests-quick`). This is the change that moves the grade to blue.
- Confirm whether the context riscv64 job is required for merge.

### 14.4 Ecosystem Enablement

Section 10 is omitted: Boost is a library set with no dependent package ecosystem that must itself be enabled. Dependency gaps are limited to Open MPI and libiconv, for which no riscv64 data was found. Add reports for both.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 job to superproject CI on RISE runners (quick test target) | 2 | RISE / Boost CI maintainers | High |
| Functional | Verify no riscv64-specific patches in Debian and Ubuntu Boost packages | 0.5 | RISE distro-integration WG | High |
| Functional | Audit Boost.Context riscv64 asm (extensions, stubs, line counts) | 1 | RISE system-libraries WG | Medium |
| Functional | Document riscv64 native and cross builds, provide a CMake toolchain file | 1 | RISE / Boost docs | Medium |
| Performance | Baseline Boost benchmark suite on riscv64 vs arm64 | 2 | RISE | Medium |
| CI/CD | Confirm context riscv64 CI is required for merge; verify uuid riscv64 job | 0.25 | RISE | Low |
| Ecosystem | Write riscv64 reports for Open MPI and libiconv | 1 | RISE | Low |

## 15. References

- [boostorg/boost repository](https://github.com/boostorg/boost)
- [Boost homepage](https://www.boost.org/)
- [boostorg/boost issue #474](https://github.com/boostorg/boost/issues/474)
- [boostorg/boost issue #460](https://github.com/boostorg/boost/issues/460)
- [boostorg/boost issue #983](https://github.com/boostorg/boost/issues/983)
- [boostorg/context issue #306](https://github.com/boostorg/context/issues/306)
- [boostorg/context issue #243](https://github.com/boostorg/context/issues/243)
- [boostorg/context issue #86](https://github.com/boostorg/context/issues/86)
- [boostorg/context multi.yml](https://github.com/boostorg/context/blob/develop/.github/workflows/multi.yml)
- [Debian riscv list, Dec 2019: enable Boost.Context on riscv64](https://lists.debian.org/debian-riscv/2019/12/msg00007.html)
- [openSUSE riscv-support.patch](https://src.opensuse.org/rpm/boost/src/commit/28fa5388eaf03cb5627d80a8e80f112d26717ede16f4b145ed4d9b84c3a1e8b8/riscv-support.patch)
- [php-src commit 70b02d75f2](https://github.com/php/php-src/commit/70b02d75f2)
- [Ubuntu boost1.90 source package](https://launchpad.net/ubuntu/+source/boost1.90)
- [Ubuntu noble riscv64 libboost-wave1.83.0](https://launchpad.net/ubuntu/noble/riscv64/libboost-wave1.83.0/1.83.0-2.1ubuntu2)
- [Ubuntu noble test rebuild, libboost1.83-dev riscv64](https://launchpad.net/ubuntu/+archive/test-rebuild-20240502-noble-gcc/+build/28297296)
- [Alpine edge testing riscv64 boost1.89-dev](https://pkgs.alpinelinux.org/package/edge/testing/riscv64/boost1.89-dev)
- [Alpine v3.23 riscv64 boost1.84-libs](https://pkgs.alpinelinux.org/package/v3.23/main/riscv64/boost1.84-libs)
- [Alpine v3.23 riscv64 boost-dev](https://pkgs.alpinelinux.org/package/v3.23/main/riscv64/boost-dev)
- [Debian sid riscv64 libboost1.81-dev](https://packages-picconi.debian.org/sid/riscv64/libboost1.81-dev/download)
- [Fedora riscv-koji Boost RPM](https://riscv-koji.fedoraproject.org/koji/rpminfo?rpmID=8865)
- [Rocky 10 riscv64 package listing](https://mirrors.mit.edu/rocky/10/CRB/riscv64/kickstart/Packages/b)
- [AUR android-riscv64-boost](https://aur.archlinux.org/packages/android-riscv64-boost)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog](https://riseproject.dev/blog/)
- [RISE RISC-V runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V runners, six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [CodSpeedHQ/boost-benches](https://github.com/CodSpeedHQ/boost-benches)
- [facebook/zstd PR #4596](https://github.com/facebook/zstd/pull/4596)
- [riseproject-dev/sw-ecosystem](https://github.com/riseproject-dev/sw-ecosystem) (projects.yml and project-reports/ for zlib, bzip2, xz, zstd, ICU, OpenSSL, Python, LZ4)