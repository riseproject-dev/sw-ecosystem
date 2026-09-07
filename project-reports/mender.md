---
title: Mender
parent: Project Reports
color: orange
---

# Mender

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Mender<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Mender ([mender.io](https://mender.io/), repository [mendersoftware/mender](https://github.com/mendersoftware/mender)) is an over-the-air (OTA) software update manager for embedded Linux and IoT devices. The current codebase is a C++ (CMake-based) client/daemon; an earlier Go-based client is the legacy implementation still reflected in some downstream packaging naming. Core functions: artifact download and verification, atomic dual-partition (A/B) rootfs updates, device authentication, and a state-machine-driven update workflow, with integrations for Yocto Project and Debian-family Linux, plus an experimental Zephyr RTOS path.

**Governance:** Mender is **not** governed by a neutral foundation. There is no Linux Foundation, CNCF, or Eclipse Foundation membership found on mender.io, in the repository, or on docs.mender.io. Governance, roadmap, and merge authority sit entirely with **Northern.tech AS** (est. 2008, also maker of CFEngine). `CONTRIBUTING.md` refers generically to "the maintainers of Mender" with no published steering committee or charter; the only "Linux Foundation" text found in the repo is boilerplate Developer Certificate of Origin (DCO v1.1) text, not a membership claim.

**License:** Apache License 2.0, copyright Northern.tech AS (confirmed in `README.md` and `LICENSE`).

**Corporate sponsors / contributors:** Full commit history (4,412 commits, first commit 2015-12-07 through 2026-09-03) shows the overwhelming majority of commits from `@northern.tech` / `@mender.io` / legacy `@cfengine.com` addresses (Kristian Amlie, Lluis Campos, Ole Orhagen, Marcin Pasinski, Fabio Tranchitella, Alf Rune, Michal Kopczan, among others - all Northern.tech employees). A smaller cluster of commits comes from `rndity.com` / `open-rnd.pl` (Maciej Borzecki), a Polish embedded-Linux consultancy contracted by Northern.tech. No commits from independent silicon vendors, cloud hyperscalers, or foundation-style corporate members were found. `CODEOWNERS` names only an internal GitHub team (`@mendersoftware/client-dependabot-reviewers`) for dependency files - no broader maintainer roster is published.

**RISE membership:** Fetched [riseproject.dev/members](https://riseproject.dev/members/) directly - neither Mender nor Northern.tech appears in either the Premier tier (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) or the General tier (12 members including Canonical, Microchip, Andes, ZTE).

**Community culture on new ports:** There is no formal architecture-tier policy document (no `PLATFORMS.md`/`SUPPORT.md` in the repo). docs.mender.io states the client "can be compiled for a wide variety of architectures," but **officially supported** targets are limited to Debian-family Linux, Yocto Project, and Zephyr OS. New hardware/platform ports are explicitly pushed to the community ("Board integrations" category on the [Mender Hub forum](https://hub.mender.io/)) rather than accepted as core-supported architectures; verified/official support for a new platform is offered only as a paid professional-services engagement through Northern.tech.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2015-12-07 | First commit ("Mender client is born!") | Full commit history, `mendersoftware/mender` |
| N/A | No RISC-V-related commit exists at any point in history | `git log --all --grep -i "riscv"` across full history returned zero commits |

**Key contributors:** All commits are from Northern.tech AS employees or its contracted consultancy RND-ITY/OpenRND (rndity.com). No independent RISC-V-focused contributor or organization has ever committed to this repository.

**Is it fully upstream?** There is no RISC-V port to speak of, upstream or otherwise, inside `mendersoftware/mender`. A `git log --all --grep` (case-insensitive, "riscv"/"risc-v") across the entire history returns zero commits. No `riscv*.cmake` toolchain file exists (only `cmake/aarch64.cmake` and `cmake/qnx.cmake`). No file or path in the current tree or history references RISC-V in any form. The only riscv64 artifacts that exist anywhere are downstream Debian/Ubuntu packages built without any Mender-side engineering request or acknowledgment (see Section 8).

## 3. Upstream Support Tier

There is no formal architecture-tier policy document. The closest statement is docs.mender.io's list of officially supported platforms: Debian-family Linux, Yocto Project, and Zephyr OS. riscv64 is not among them. Evidence gathered:

- No riscv64 CI job exists (Section 7).
- No riscv64 release-blocking test exists (there is no riscv64 test at all).
- No official riscv64 binaries are published by Northern.tech (GitHub Releases contain only source tarballs, see Section 8).

**Comparison table: amd64 vs arm64 vs riscv64**

| Architecture | Upstream CI | Official binaries | Documented cross-compile path | Support tier |
|---|---|---|---|---|
| amd64 (x86_64) | Yes (all `.gitlab-ci.yml` jobs run on x86_64 containers/runners) | Native build target; implicit default toolchain | N/A (host default) | Officially supported (Debian-family Linux) |
| arm64 (aarch64) | No dedicated CI job; toolchain file exists but is never exercised by CI | None from GitHub Releases; distro packages exist | Yes - documented in `README.md` with `cmake/aarch64.cmake` | Supported via Yocto/Debian-family cross-compile, but the toolchain path itself is CI-unvalidated |
| riscv64 | None | None from GitHub Releases; distro packages exist downstream only | No - not mentioned anywhere in `README.md` or docs | Not officially supported; community-only, no dedicated toolchain file |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Mender's C++ client is a portable state-machine/artifact-management application (artifact parsing via libarchive, HTTP/TLS via Boost.Asio/Beast and OpenSSL, IPC via D-Bus) with **no per-architecture algorithm implementations of any kind** - not hand-tuned, not intrinsics-based, not even a scalar-fallback split by architecture. Confirmed by:

- `mcp__github__search_code` (GitHub's index): `__riscv` -> 0 hits, `riscv64` -> 0 hits, `filename:*_riscv64.go` -> 0 hits.
- Local repository-wide `grep -rniE "riscv|risc-v"` -> 0 matches.
- `grep` for `__aarch64__`, `__x86_64__`, `cpuid`, `__attribute__((target`, `intrinsic`, `SIMD`, or inline `__asm__` across all `.c/.cpp/.h/.hpp` files -> 0 hits. There are **zero architecture-conditional code guards of any kind**, for any architecture, in this codebase.

**File-by-file comparison (amd64 vs arm64 vs riscv64):**

| Arch | Dedicated file(s) | Content | Lines |
|---|---|---|---|
| amd64/x86_64 | none | Implicit native/host build - no toolchain file needed; referenced only as a `${CMAKE_SYSTEM_NAME}-${CMAKE_SYSTEM_PROCESSOR}` string in `cmake/dist-package.cmake` for the device-type string | 0 |
| arm64/aarch64 | `cmake/aarch64.cmake` | Sets `CMAKE_SYSTEM_PROCESSOR aarch64`, points `CMAKE_C_COMPILER`/`CMAKE_CXX_COMPILER` at `aarch64-linux-gnu-gcc`/`g++`, sets a pkg-config libdir. Pure compiler-selection config, no algorithmic code | 7 |
| riscv64 | none | No toolchain file, no build target, no CI job, no CMake option, no documentation, no GitHub issue/PR/commit | 0 |

**Rating (full / partial / scalar / missing):**

- **amd64:** N/A as a "component" - implicit native host toolchain, zero dedicated source or build files. No hand-tuning, no intrinsics; the whole binary is architecture-agnostic C++.
- **arm64:** missing, as an "implementation." The single artifact is a 7-line CMake cross-compiler toolchain stub (compiler binary names plus a pkg-config path) with no source code and no arch-tuned logic. Per Section 7, `.gitlab-ci.yml` builds only on x86_64 runners, so this toolchain file is CI-unvalidated.
- **riscv64:** missing. Zero presence of any kind - no toolchain file, no source guard, no CI job, no documentation, no tracking issue, no commit, no PR. This is not a stub (a stub implies a placeholder that exists but does nothing); riscv64 simply does not appear in this repository in any form.

The premise of an "architecture-conditional implementation quality" comparison (as would apply to a JIT, SIMD, or crypto library) does not apply to Mender - the codebase has no per-arch code paths, intrinsics, or assembly for any architecture, including its two most-used targets (amd64, arm64). Mender is not an optimization-purpose project.

## 5. Build System, Cross-Compilation, and Toolchain

**Requirements** (per `README.md` "Installing from source"): a C++ compiler, cmake, `libarchive-dev`, `libboost-all-dev`, `liblmdb-dev`, `libdbus-1-dev`, `libssl-dev`, `libsystemd-dev`. No minimum GCC/Clang version is stated anywhere in the repository. `cmake_minimum_required(VERSION 3.14)` is the only stated toolchain-version floor, needed for `FetchContent_MakeAvailable` when `MENDER_DOWNLOAD_BOOST=ON`; without that option, cmake 3.13 or older "possibly" works per the CMakeLists.txt comment. No compiler version floor is documented at all.

**Native build:**
```
cmake -DCMAKE_INSTALL_PREFIX:PATH=/usr ..
make
sudo make install
```

**Cross-compilation section of README.md** covers exactly two targets - aarch64 and QNX (experimental) - and states explicitly: "Generic cross-compilation procedures using cmake apply. During the current, early stage of development using a higher, cross-compilation aware build system such as Yocto is advisable."

**aarch64** (the only real Linux cross-target with a dedicated toolchain file besides QNX):
```
sudo dpkg --add-architecture arm64
sudo apt update && sudo apt install git crossbuild-essential-arm64 cmake libarchive-dev:arm64 liblmdb++-dev:arm64 libboost-log-dev:arm64 libssl-dev:arm64 libdbus-1-dev:arm64 libsystemd-dev:arm64
cmake -DCMAKE_TOOLCHAIN_FILE=cmake/aarch64.cmake -B build .
cmake --build build
```

`cmake/aarch64.cmake` content:
```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR aarch64)
set(CMAKE_C_COMPILER aarch64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER aarch64-linux-gnu-g++)
set(ENV{PKG_CONFIG_LIBDIR} "/usr/lib/aarch64-linux-gnu/pkgconfig")
```

**QNX** (aarch64 only, experimental/unsupported):
```
cmake .. -DCMAKE_TOOLCHAIN_FILE=../cmake/qnx.cmake -DMENDER_USE_DBUS=OFF -DMENDER_EMBED_MENDER_AUTH=ON -DMENDER_USE_LMDB=OFF
```

**No riscv64 toolchain file exists.** If riscv64 is needed today, the only documented path is the generic guidance to use Yocto (meta-mender) as a cross-compilation-aware layer, or to hand-write a `cmake/riscv64.cmake` toolchain file analogous to `cmake/aarch64.cmake` (swapping in a `riscv64-linux-gnu-gcc`/`g++` toolchain) - that would be new work, not something documented in the repository.

**QEMU usage:** None. The only "qemu" string match in the repository is the Yocto machine-name fixture `qemux86-64` used in tests, unrelated to real QEMU execution or RISC-V.

**Known build failures (community-reported, non-GitHub):** A Mender Hub forum thread, ["Cross compile mender-client for riscv64 architecture using yocto"](https://hub.mender.io/t/cross-compile-mender-client-for-riscv64-arhitecture-using-yocto/5526), documents a user's riscv64 cross-compile attempt via Yocto Dunfell with Go 1.14.1, hitting a linker error (`undefined reference to '_cgo_sys_thread_start'`), fixed by upgrading to Yocto Kirkstone. The same thread also documents unrelated HiFive Unmatched board issues: partition layout conflicts (FSBL/BBL/kernel/rootfs with static UUIDs vs. Mender's default layout, worked around via `MENDER_EXTRA_PARTS`), a data-partition auto-resize loop (fixed by disabling `mender-growfs-data`), and a U-Boot environment read failure due to `fw_printenv` misconfiguration. This is a support forum thread, not a tracked GitHub issue, and no upstream PR resulted from it.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native build | Yes (default host) | Not applicable natively; cross-compiled | Not documented; would require a hand-written toolchain file |
| Documented cross-compile | N/A | Yes (`README.md`, `cmake/aarch64.cmake`) | No |
| Upstream CI build | Yes (all `.gitlab-ci.yml` jobs) | No | No |
| Upstream CI test | Yes | No | No |
| Official binary/package | No (source tarball only in GitHub Releases) | No (source tarball only) | No |
| Downstream distro package | Yes (Ubuntu, Debian) | Yes (Ubuntu, Debian) | Yes (Ubuntu, Debian - see Section 8) |
| Officially supported (docs.mender.io) | Yes (Debian-family Linux) | Implicit via Yocto/Debian-family | No |

**Functional gaps:** None identified that are riscv64-specific, because Mender has no architecture-specific code paths for any architecture (Section 4). Whatever functional gaps exist (e.g., D-Bus dependency on Linux builds, QNX build disabling D-Bus/LMDB) apply uniformly regardless of CPU architecture.

**Performance gaps:** Not applicable in the sense of "missing SIMD" - Mender has no SIMD code for any architecture. Any performance delta on riscv64 vs. amd64/arm64 would derive entirely from riscv64 hardware characteristics and its dependency chain (OpenSSL, libarchive, zlib, zstd, xz - see Section 9), not from Mender's own code.

**Security hardening gaps:** Data not available: no repository-level or CI-level hardening flags specific to riscv64 were found or searched for (no riscv64 build path exists to harden). The most relevant security-adjacent finding is transitive: OpenSSL's unresolved AES T-table side-channel gap on riscv64 hardware lacking Zkn/Zvkned extensions (see Section 9) would affect a hypothetical riscv64 Mender build's TLS/crypto operations, since Mender links OpenSSL directly.

**NaN / floating-point semantics issues:** Data not available. No performance benchmarks, correctness bugs, or NaN/floating-point issues for Mender on RISC-V were found in any searched source (GitHub issues/PRs/commits in `mendersoftware/mender`, web search, or the [riseproject.dev blog](https://riseproject.dev/blog)). Mender's own codebase performs no floating-point-heavy or NaN-sensitive computation relevant to update-management logic.

## 7. CI/CD Infrastructure

**No riscv64 CI exists for `mendersoftware/mender`, on GitHub Actions or GitLab CI, period.** Verified directly against the cloned repository (HEAD `dbbcf8bc9c1121bce0d539c1d7e0000dd41d64ad`):

- `.github/workflows/` **does not exist** in this repository (confirmed by directory listing: only `.github/stale.yml`, an unrelated stale-issue bot config, exists under `.github/`).
- No `Jenkinsfile`, no `.cirrus.yml` anywhere in the repository.
- `.gitlab-ci.yml` (189 lines, full content read directly) defines stages `test` and `publish`, with jobs `build-with-libc++`, `test:no-tests`, `test:unit`, `test:backward-compat`, `test:dependencies-download`, `test:static:{asan,threadsan,undefinedsan,release,no-dbus}`, `test:modules-artifact-gen`, `test:update-modules`, `test:docker`. All jobs run on `registry.gitlab.com/northern.tech/mender/mender-test-containers/*` or `debian:12`/`docker:27.3` images, tagged `k8s` or `hetzner-amd-beefy` runners. There is no architecture matrix, no QEMU usage, and no riscv64 runner or target of any kind.
- Repository-wide case-insensitive grep for "riscv" across every tracked file returns zero matches.

**RISE runners:** Not used. No reference to `riseproject-dev` runner labels or RISE infrastructure exists in `.gitlab-ci.yml` or anywhere in the repository.

**Comparison table: amd64 vs arm64 vs riscv64**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (all jobs) | No | No |
| CI tests | Yes (unit, static analyzers, backward-compat, docker) | No | No |
| Release-blocking | Yes (all listed jobs must pass) | N/A (no job exists) | N/A (no job exists) |
| Hardware/emulation | Native x86_64 containers/runners (`k8s`, `hetzner-amd-beefy`) | N/A | N/A |
| RISE runner usage | No | No | No |

## 8. Distribution and Release Status

**GitHub Releases (`mendersoftware/mender`):** Checked the two most recent releases via GitHub's public `releases/expanded_assets/<tag>` fragment endpoint (the GitHub MCP `list_releases` tool could not be used because the repository was not attached to this session with API-enabling access):
- **5.1.0** (latest, published 2026-05-12): assets = `mender-5.1.0.tar.gz`, source zip, source tar.gz. No riscv64/riscv in any filename.
- **qnx-preview-v1** (prerelease, 2026-06-09): assets = `mender-qnx-preview-v1.tar.gz`, `qnx-preview-v1.zip`, `qnx-preview-v1.tar.gz`. QNX-specific, no riscv64/riscv in any filename.
- Conclusion: no architecture-specific binaries for any architecture are published in GitHub Releases - only source tarballs. This is a residual gap not re-verified via the authenticated API in the final adversarial pass, but consistent across two independent checks.

**PyPI** (`https://pypi.org/pypi/mender/json`): A package named `mender` exists (latest 0.0.5), but all 10 files across all 5 published versions (0.0.1-0.0.5) are `py3-none-any` wheels plus sdist tarballs - pure Python, architecture-agnostic, and almost certainly an unrelated project sharing the name "mender" rather than mendersoftware's OTA client. Not evidence either way about the riscv64 status of the actual Mender OTA client.

**RISE Python wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/mender/`): 302-redirects to public PyPI - this GitLab project does not host its own `mender` index. No independent RISE involvement.

**Ubuntu 26.04 ("resolute") and other suites - CONFIRMED at build-farm ground truth.** Verified through three independent layers:
1. `packages.ubuntu.com/resolute/riscv64/mender-client` (raw HTML fetched directly): real package page, "Package: mender-client (3.4.0+ds1-5build4) [ports] [universe]," populated download table (Package Size 3,692.2 kB, Installed Size 11,214.0 kB).
2. `mender-artifact` riscv64 page: same pattern, version 3.9.0+ds1-2build1, 4,401.3 kB.
3. **Launchpad API** (`getPublishedBinaries` for `mender-client` in `ubuntu/resolute/riscv64`): returns `status: "Published"`, component `universe`, `Release` pocket, with a linked build record. That build record (`+build/32177191`) shows `"buildstate": "Successfully built"`, `"arch_tag": "riscv64"`, built on `builder_link: .../builders/bos03-riscv64-014` (a named riscv64 builder in Canonical's build farm), with build log, `.changes`, and `.buildinfo` URLs present.

riscv64 builds of `mender-client` are also present in jammy, noble, and questing per suite links on the same page. `mender-cli` and `mender-connect` are also listed as riscv64-available in Ubuntu package search results. Debian sid/experimental also carries `mender-client`/`mender-artifact` riscv64 builds.

**Patch status [NEEDS VERIFICATION]:** Whether the Debian/Ubuntu packaging applies riscv64-specific patches versus building unmodified upstream source was not directly checked against the `debian/patches/` directory in this research pass. The working inference - that Go's/C++'s native `linux/riscv64` toolchain support makes this an unpatched, "just works" cross-compile - is plausible given the absence of any Mender-side riscv64 engineering, but is not confirmed by inspecting the packaging diff itself.

**What a user must do to get a working binary today:** Install from Ubuntu (jammy/noble/questing/resolute) or Debian sid/experimental via `apt install mender-client mender-artifact mender-cli mender-connect` on a riscv64 system - this works because these distributions build and publish riscv64 binaries themselves. There is no upstream (Northern.tech-provided) riscv64 binary, container image, or release asset. Building from source requires hand-writing a `cmake/riscv64.cmake` toolchain file (none is provided) or using Yocto/meta-mender as the cross-compilation layer, per the community forum experience in Section 5.

**Arch Linux RISC-V port** (`archriscv.felixc.at/?q=mender`): No results. Confirmed absence.

## 9. Dependencies

Dependency manifest sourced from `CMakeLists.txt` / `src/**/CMakeLists.txt` (the current CMake-based C++ client has no go.mod/setup.py/package.json - it is pure CMake/C++).

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Community/notes |
|---|---|---|---|---|---|
| OpenSSL | Crypto (artifact signing/verification, TLS) | Confirmed - dedicated CI workflow with riscv64 extension configs per prior project research | Passes generally; flaky `test_lhash` on riscv64 CI ([issue #30880](https://github.com/openssl/openssl/issues/30880), open, May 2026) | Debian sid, Ubuntu 24.04 core package, Arch RISC-V all ship riscv64 | **Critical open gap:** AES T-table side-channel leak on hardware lacking Zkn/Zvkned, fix PRs [#31080](https://github.com/openssl/openssl/pull/31080) and [#31082](https://github.com/openssl/openssl/pull/31082) still open as of June 2026. Also: SSL test races at high job counts ([issue #22166](https://github.com/openssl/openssl/issues/22166), unfixed since 2023), Zbb feature-detection broken on musl ([issue #28118](https://github.com/openssl/openssl/issues/28118)) |
| libarchive | Artifact tar container (read/write) | `libarchive-dev` riscv64 confirmed continuously since Ubuntu Jammy 22.04 through Plucky 25.04 (3.7.7) | No riscv64-specific bugs found | Ubuntu (22.04-25.04+), presumed 26.04 given unbroken history | No open riscv64 issues found |
| zlib | Transitive via libarchive; gzip Artifact compression (default on) | Ubuntu 24.04 `zlib1g`/`-dev` riscv64 confirmed; Alpine edge riscv64 confirmed | No riscv64 correctness bugs; only a stalled RVV-optimized Adler32 PR ([#1099](https://github.com/madler/zlib/pull/1099), unreviewed since Oct 2025) | Debian sid, Ubuntu, Arch RISC-V, Alpine all ship riscv64 | Upstream CI has no Linux riscv64 cross-compile job (optimization gap only, not correctness) |
| xz / liblzma | Transitive via libarchive; lzma Artifact compression (default on) | Debian sid, Ubuntu ports, Arch RISC-V riscv64 confirmed | No open riscv64 correctness bugs; prior riscv64 issues closed/fixed | Distro packages only | No hardware CRC acceleration for riscv64 (performance gap, not correctness); no upstream CI runner |
| zstd | Transitive via libarchive; zstd Artifact compression (default on) | Ubuntu 24.04 riscv64 confirmed (`zstd`, `libzstd1`, `libzstd-dev`); Debian sid riscv64 official port | **Correctness bug, fixed upstream:** RVV codepath had a silent-corruption bug where riscv64 was not even recognized as 64-bit before the fix, silently using 32-bit paths through v1.5.7 ([PR #4525](https://github.com/facebook/zstd/pull/4525), merged Dec 2025); another RVV mask bug fixed Sep 2025 | Ubuntu/Debian riscv64 packages currently ship v1.5.5-1.5.7 - **predating the 64-bit-detection fix** | 6+ open, unreviewed riscv64 performance PRs (RVV intrinsics, `-mno-strict-align`, prefetch) with little maintainer engagement |
| Boost (log, asio, beast) | Async I/O and structured logging | `libboost-dev` 1.83.0.1ubuntu2 riscv64 confirmed on Ubuntu Noble 24.04 | Boost.Context riscv64 assembly gaps now resolved ([boostorg/context#243](https://github.com/boostorg/context/issues/243), closed; [#306](https://github.com/boostorg/context/issues/306), closed) - not required by Mender's direct asio/beast/log usage in any case | Ubuntu ships riscv64 boost packages | No open riscv64 issues found on boostorg/boost itself |
| D-Bus (libdbus-1) | IPC transport (Linux builds only) | `libdbus-1-dev` riscv64 confirmed continuously since Ubuntu Focal 20.04 through Noble 24.04 | Not investigated (dbus is hosted on freedesktop.org GitLab, not GitHub) | Ubuntu ships riscv64 packages across releases | Low architectural risk - no SIMD/crypto/JIT surface |
| GoogleTest | Test framework only, not shipped in production binary | Debian sid riscv64 build confirmed; Ubuntu 26.04 explicitly lists riscv64 (1.17.0-1build1) | One open cosmetic bug: `GetThreadCountTest` fails on riscv64 ([issue #3756](https://github.com/google/googletest/issues/3756), open since 2022, maintainer declined to fix; riscv64 is unofficially supported) | Source-only upstream releases; distro packaging covers riscv64 | Build-time only dependency, low priority |

**Summary assessment:** No hard riscv64 blocker exists in Mender's dependency chain - every direct and transitive critical dependency is present in Ubuntu's riscv64 archive across multiple recent releases, and none has an open build-blocking issue. The one genuine correctness risk is zstd's now-fixed 32-bit-codepath bug: distro-packaged zstd (1.5.5-1.5.7, what Ubuntu 24.04/Debian sid currently ship) predates that fix, so a riscv64 Mender build linking against system zstd may silently run degraded/incorrect codepaths until distros pick up v1.6.0+. This is worth flagging specifically because Mender enables zstd Artifact compression by default. OpenSSL's unresolved AES side-channel gap on riscv64 hardware without Zkn/Zvkned is the most severe security finding, though it is an OpenSSL-level issue, not Mender-specific.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue, PR, or commit exists in `mendersoftware/mender` | N/A | N/A | Confirmed by `search_issues`, `search_pull_requests`, and `search_commits` for "riscv", "riscv64", "risc-v", "RISC-V" - 0 genuine results in every query variant |
| [PR #1420](https://github.com/mendersoftware/mender/pull/1420) | chore: bump golang.org/x/sys from 0.12.0 to 0.13.0 (dependabot) | Closed, unmerged - Dependabot auto-closed it because the target version became stale before merge | False positive | Only surfaced via keyword search because the linked upstream `golang.org/x/sys` changelog mentions "unix: update riscv_hwprobe constants" in one unrelated changelog line; not connected to Mender's own RISC-V support in any way |
| [zstd #4525](https://github.com/facebook/zstd/pull/4525) | Fix riscv64 64-bit detection / silent 32-bit codepath | Merged Dec 2025 | Correctness (transitive dependency) | Not yet propagated into distro-packaged zstd versions that Mender links against (Section 9) |
| [OpenSSL #30880](https://github.com/openssl/openssl/issues/30880) | Flaky `test_lhash` on riscv64 CI | Open, May 2026 | Low (transitive dependency, test flakiness) | See Section 9 |
| [OpenSSL #31080](https://github.com/openssl/openssl/pull/31080) / [#31082](https://github.com/openssl/openssl/pull/31082) | AES T-table side-channel fix for riscv64 lacking Zkn/Zvkned | Open, June 2026 | **High (security, transitive dependency)** | See Section 9 |
| [Mender Hub forum thread](https://hub.mender.io/t/cross-compile-mender-client-for-riscv64-arhitecture-using-yocto/5526) | Cross-compile mender-client for riscv64 via Yocto | Community thread, not a tracked issue | N/A | Documents build/deployment friction (Go linker error on old Yocto, partition layout conflicts on HiFive Unmatched); no upstream PR resulted |

**Correctness bugs highlighted separately:** The zstd 32-bit-codepath silent corruption bug ([PR #4525](https://github.com/facebook/zstd/pull/4525)) is the only genuine correctness concern identified in Mender's riscv64 dependency chain, and it sits in a transitive dependency (zstd, pulled in via libarchive for Artifact compression), not in Mender's own code. No correctness bug in Mender's own codebase was found or is possible to find, since no riscv64 code path exists in Mender itself.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. There is no GitHub issue, PR, or maintainer statement rejecting or objecting to riscv64 support - because no one has ever proposed it. The absence is one of total silence, not documented refusal.

**Technical blockers:** None identified at the Mender codebase level - the client is portable POSIX/CMake C++ with no architecture-specific code (Section 4), so no code-level blocker exists. The main practical blocker is the complete absence of a `cmake/riscv64.cmake` toolchain file and any riscv64 CI job, meaning a first riscv64 port would require someone to author and validate both from scratch. Community-reported friction (Mender Hub forum thread, Section 5) involved Yocto/Go toolchain version mismatches on an older Yocto release (Dunfell), resolved by upgrading Yocto - not a fundamental blocker.

**Organizational blockers:** Mender's community-driven policy for new architecture support means official riscv64 support would require either (a) a community member submitting and maintaining a `cmake/riscv64.cmake` file plus CI coverage with no guarantee of merge priority given the single-vendor governance model, or (b) a customer commissioning Northern.tech's paid professional-services engagement to add and certify a new platform. There is no open funding or roadmap commitment from Northern.tech for riscv64 found in any source.

**Acceptance probability:** Data not available for a quantified estimate. Qualitatively: low-to-moderate near-term probability absent external funding or a paying customer, given (a) zero historical engagement with the topic in nearly a decade of commit history, (b) a governance model that has never accepted an externally-driven new-architecture port without a professional-services contract, and (c) no RISE involvement or membership to date. The technical barrier itself is low (portable C++ codebase, aarch64 precedent shows the process), which would make acceptance fast once someone submits a PR with an accompanying toolchain file and CI job, but nothing found in this research suggests anyone is currently doing so.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro (Ubuntu jammy/noble/questing/resolute and Debian sid/experimental ship `mender-client`, `mender-artifact`, `mender-cli`, `mender-connect` for riscv64; no upstream Northern.tech release exists)
- Optimization level: not applicable - Mender is not an optimization-purpose project (no SIMD/JIT/numerics differentiator; see Section 4).
- **Justification:** No upstream riscv64 CI exists on either GitHub Actions (absent entirely) or GitLab CI (`.gitlab-ci.yml` runs exclusively on x86_64 containers/runners with no architecture matrix) - see [.gitlab-ci.yml](https://github.com/mendersoftware/mender/blob/main/.gitlab-ci.yml). No upstream release artifact exists for any architecture beyond source tarballs (GitHub Releases 5.1.0, qnx-preview-v1). The distribution floor applies because Ubuntu and Debian independently build and successfully publish riscv64 binaries, confirmed at build-farm ground truth via the Launchpad API (`buildstate: Successfully built`, builder `bos03-riscv64-014`). However, whether that distro packaging applies riscv64-specific patches versus building unmodified upstream source was not directly verified against the `debian/patches/` directory in this research pass [NEEDS VERIFICATION] - per the color model's rule that unverified patch status caps the grade at orange rather than yellow, orange is the correct classification rather than a "clean-distro-build" yellow.
- **Pending work that could change the grade:** None identified. No open PR, no open issue, no RISE blog post, and no RISE membership or working-group activity involving Mender was found anywhere ([riseproject.dev/blog](https://riseproject.dev/blog), [riseproject.dev/members](https://riseproject.dev/members/), GitHub org `riseproject-dev`). Confirming the Debian/Ubuntu packaging is patch-free would be the fastest path to potentially upgrading this to yellow (`clean-distro-build`); actual upstream CI plus a maintained `cmake/riscv64.cmake` toolchain file would be required to reach blue or green.

## 14. Investment Analysis

RISE has done or funded **no work on Mender** - no blog coverage, no membership, no wheel-builder listing, no GitHub org repo, confirmed by exhaustive search of [riseproject.dev/blog](https://riseproject.dev/blog) (all 34 posts), the site's native search (`?s=Mender`, 0 results), [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/) (Mender not listed), and the `riseproject-dev` GitHub org (25 repos, none Mender-related). All investment items below are therefore sized from a zero baseline.

### 14.1 Functional Enablement

- Author and validate a `cmake/riscv64.cmake` toolchain file analogous to the existing `cmake/aarch64.cmake` (compiler binary names, pkg-config libdir for riscv64-linux-gnu).
- Verify the full dependency chain (OpenSSL, libarchive, Boost, D-Bus, zlib/xz/zstd via libarchive) links and functions correctly on riscv64 hardware or QEMU, given no Mender-side riscv64 testing has ever been performed.
- Update `README.md` cross-compilation section to document the new riscv64 path, mirroring the aarch64 documentation.
- Engage with the Mender Hub community thread author(s) and/or Northern.tech to determine whether a PR would be accepted without a professional-services contract.

### 14.2 Performance Optimization

Not applicable as a distinct workstream - Mender has no architecture-specific optimization code for any architecture (Section 4). Any performance work would occur at the dependency level (e.g., ensuring distro-packaged zstd on riscv64 is upgraded past v1.6.0 to pick up the 64-bit-detection correctness fix, or tracking OpenSSL's AES side-channel fix for riscv64 hardware without Zkn/Zvkned), not inside Mender itself.

### 14.3 CI/CD Infrastructure

- Add a riscv64 job to `.gitlab-ci.yml` (or a new `.github/workflows/` file, since none currently exists at all) that cross-compiles the client and, ideally, runs the existing `test:unit` suite under QEMU or on native riscv64 hardware/RISE runners.
- No RISE runner integration currently exists to build on - this would be new infrastructure work, not a configuration change to an existing riscv64 job.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted because Mender has no dependent package ecosystem (no Python/npm/Maven/Kubernetes-operator consumers depend on a Mender package needing separate riscv64 enablement). Mender is a standalone client/daemon tool.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Author and validate `cmake/riscv64.cmake` toolchain file | 1-2 | Community contributor or Northern.tech | High |
| Functional | Validate full dependency chain on riscv64 hardware/QEMU (first-time testing) | 2-4 | Community contributor or Northern.tech | High |
| Functional | Update README cross-compilation documentation | 0.5 | Community contributor | Medium |
| CI/CD | Add riscv64 build (and ideally test) job to `.gitlab-ci.yml` | 1-2 | Northern.tech (owns CI config) | Medium |
| Dependency tracking | Monitor distro zstd version for the v1.6.0 64-bit-detection fix propagation | 0.25 (ongoing) | Distro packaging teams / Mender maintainers | Low |
| Organizational | Determine Northern.tech's acceptance path for a community-submitted riscv64 PR (issue filed, forum outreach) | 0.5 | Whoever sponsors this work | High (blocks all other items until resolved) |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [mendersoftware/mender GitHub repository](https://github.com/mendersoftware/mender)
- [mender.io homepage](https://mender.io/)
- [.gitlab-ci.yml](https://github.com/mendersoftware/mender/blob/main/.gitlab-ci.yml)
- [PR #1420 - chore: bump golang.org/x/sys (false positive)](https://github.com/mendersoftware/mender/pull/1420)
- [Mender Hub forum thread - Cross compile mender-client for riscv64 architecture using yocto](https://hub.mender.io/t/cross-compile-mender-client-for-riscv64-arhitecture-using-yocto/5526)
- [Ubuntu package search - Mender, suite resolute](https://packages.ubuntu.com/search?keywords=Mender&suite=resolute&searchon=names&section=all)
- [packages.ubuntu.com - mender-client (resolute, riscv64)](https://packages.ubuntu.com/resolute/riscv64/mender-client)
- [PyPI - mender package JSON API](https://pypi.org/pypi/mender/json)
- [RISE GitLab PyPI mirror for mender (redirects to public PyPI)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/mender/)
- [Arch Linux RISC-V package search - mender](https://archriscv.felixc.at/?q=mender)
- [riseproject.dev/members](https://riseproject.dev/members/)
- [riseproject.dev/blog](https://riseproject.dev/blog)
- [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [OpenSSL issue #30880 - flaky test_lhash on riscv64](https://github.com/openssl/openssl/issues/30880)
- [OpenSSL PR #31080 - AES T-table side-channel fix](https://github.com/openssl/openssl/pull/31080)
- [OpenSSL PR #31082 - AES T-table side-channel fix](https://github.com/openssl/openssl/pull/31082)
- [OpenSSL issue #22166 - SSL test races at high job counts](https://github.com/openssl/openssl/issues/22166)
- [OpenSSL issue #28118 - Zbb feature-detection broken on musl](https://github.com/openssl/openssl/issues/28118)
- [zlib PR #1099 - RVV-optimized Adler32 (stalled)](https://github.com/madler/zlib/pull/1099)
- [zstd PR #4525 - riscv64 64-bit detection fix](https://github.com/facebook/zstd/pull/4525)
- [boostorg/context issue #243 - Asm parts not compiled on riscv64 (closed)](https://github.com/boostorg/context/issues/243)
- [boostorg/context issue #306 - Boost context support for riscv64 (closed)](https://github.com/boostorg/context/issues/306)
- [googletest issue #3756 - GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
