---
title: FastDDS (eProsima)
parent: Project Reports
color: yellow
dependencies:
  - name: Fast-CDR
    relation: runtime-dependency
    criticality: critical
  - name: foonathan_memory
    relation: runtime-dependency
    criticality: critical
  - name: Asio
    relation: runtime-dependency
    criticality: critical
  - name: TinyXML2
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: SQLite
    relation: runtime-dependency
    criticality: optional
  - name: Boost
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="fastdds-(eprosima)" %}

# FastDDS (eProsima)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for FastDDS (eProsima)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Fast-DDS (formerly Fast-RTPS) is a C++ implementation of the OMG Data Distribution Service (DDS) and RTPS (Real-Time Publish-Subscribe) standards, developed and maintained by [eProsima](https://fast-dds.docs.eprosima.com/), a private Spanish company. It is the default RMW (ROS Middleware) implementation for ROS 2, making it a foundational dependency for the robotics ecosystem.

**Governance:** Fast-DDS is a single-vendor open-source project. There is no independent foundation, TSC, or CNCF-style governance structure, and no `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository. It is licensed under Apache License 2.0; eProsima also sells a commercial "Pro" variant alongside the open-source release.

**Corporate contributors:** Analysis of the full 6,417-commit history (back to 2014-02-18) shows approximately 70%+ of commits from `@eprosima.com` addresses or eProsima staff using personal/noreply GitHub emails. Outside corporate contribution is minimal: `osrfoundation.org` (Open Source Robotics Foundation, maker of ROS 2, which depends on Fast-DDS) accounts for 20 commits, and `sony.com` accounts for 8 commits. Top individual committers (Gonzalo Rodriguez, Ricardo Gonzalez Moreno, Miguel Company, Pablo Mansanet, Santiago Munoz, Eduardo Ponz Segrelles, Mario Dominguez, Jose Luis Bueno, Jesus Poderoso) are all eProsima employees.

**Standards affiliation:** eProsima is an OMG member/vendor implementing the DDS/RTPS specifications, but OMG/DDS Foundation membership governs the specification, not this codebase.

**Community culture on new ports:** `CONTRIBUTING.md` states that community-driven platform support is welcomed at a "Tier 3 / Unofficial Support" level via GitHub Discussions, with a stated path to promote a platform to official Tier 1/2 status if "official support is wanted for any platform, architecture and/or compiler" -- contributors are directed to contact eProsima's support team for evaluation. In practice, zero RISC-V activity (no commits, no discussion threads, no roadmap mention) exists anywhere in the project as of 2026-09-08, so this process has never been invoked for RISC-V.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port has ever been started, requested, or discussed | `git log --all --grep="riscv"` (case-insensitive) across all 6,417 commits: 0 matches; GitHub issue/PR/commit/code search for `riscv`, `riscv64`, `RISC-V`: 0 genuine matches |

There is no port to trace. No first RISC-V commit, author, or date exists. The single search hit that surfaces on a `riscv` query is [Issue #1245, "Cross compiling FastRTPS \[8587\]"](https://github.com/eProsima/Fast-DDS/issues/1245), a 2020 report about cross-compiling for an **i586 (32-bit x86) Yocto/Poky target** against `foonathan::memory`; it is an unrelated false positive from semantic search matching "cross-compiling" wording, and contains no RISC-V terms in its body.

**Is it fully upstream?** Not applicable -- there is nothing upstream to be partial or complete. eProsima has not authored any RISC-V enablement work.

## 3. Upstream Support Tier

`PLATFORM_SUPPORT.md` defines a three-tier system:

- **Tier 1** -- full CI, nightly/packaging/perf testing, release-blocking bugs: amd64/arm64 on Ubuntu Noble/Jammy, macOS Sequoia, Windows 10/11.
- **Tier 2** -- periodic CI, best-effort fixes, requires a committed sponsoring entity.
- **Tier 3** -- community-reported "functional," no official testing: amd32, arm32, Debian Buster, Android 12/13, QNX 7.1.
- **riscv64 does not appear at any tier.** It is absent from the platform table entirely -- not even Tier 3.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Tier | 1 | 1 | not listed (absent from matrix) |
| Upstream CI builds | yes | yes | no |
| Upstream CI runs tests | yes | yes | no |
| Official binaries (eProsima) | source-archives only via GitHub Releases | source-archives only via GitHub Releases | none |
| QNX cross-build target | yes (`build_qnx/nto/x86_64/`) | yes (`build_qnx/nto/aarch64/`) | no directory exists |
| Documented in `QUALITY.md` | yes (Linux amd64) | yes (Linux-aarch64) | not listed |

Source: [PLATFORM_SUPPORT.md](https://github.com/eProsima/Fast-DDS/blob/master/PLATFORM_SUPPORT.md), confirmed by direct file read at commit `0f5c9b94e284b08c861eea43cffec54a0ee67341`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Fast-DDS is a portable C++ codebase with no per-architecture hand-tuned code for **any** architecture, not just RISC-V. Verified via GitHub code search against `eProsima/Fast-DDS`:

- `search_code query="__riscv"` -> 0 results.
- `NEON`, `AVX`, `SSE2`, `__builtin_ia32` -> 0 results (confirms no SIMD/intrinsics code paths exist for amd64 or arm64 either).
- The only architecture-scoped files in the repository are in `build_qnx/nto/{x86_64,aarch64}/` -- QNX Neutrino cross-build Makefiles that set `CMAKE_SYSTEM_PROCESSOR`. No `build_qnx/nto/riscv64/` directory exists.
- The sole "riscv" string match anywhere in the working tree is `thirdparty/boost/include/boost/predef/architecture/riscv.h`, a vendored Boost.Predef compile-time architecture-detection header shipped with every Boost checkout -- not FastDDS-authored code, and not evidence of any RISC-V enablement.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT / codegen | none (not applicable, no JIT in this project) | none | none |
| SIMD / vectorized paths | none found | none found | none found |
| Crypto acceleration | delegated to OpenSSL when `SECURITY`/TLS enabled | delegated to OpenSSL | delegated to OpenSSL (see Section 9) |
| Hand-written assembly | none found | none found | none found |
| QNX cross-build target | yes | yes | no |

**Conclusion:** This is not a case of a partial or stubbed RISC-V backend behind an `#ifdef __riscv` guard -- no such guard, file, or build target exists anywhere in the repository. Because FastDDS is a portable communication-middleware library rather than a math/crypto/compute-kernel library, it is **not an optimization-purpose project** under the readiness color model (Section 13); the absence of architecture-specific code does not by itself cap the CI-derived color.

## 5. Build System, Cross-Compilation, and Toolchain

**No riscv64 build documentation exists from eProsima.** Confirmed by direct inspection at commit `0f5c9b94e284b08c861eea43cffec54a0ee67341`:

- No `cmake/riscv64.cmake` or any `cmake/toolchain-*.cmake` file exists (checked `cmake/modules/`, `cmake/common/`, `cmake/packaging/`, `cmake/testing/`).
- No `INSTALL`, `BUILDING.md`, `docs/building.md`, or `docs/cross-compilation.md` exist in the repo.
- Top-level `CMakeLists.txt` (`cmake_minimum_required(VERSION 3.22)`, `project(fastdds VERSION 3.6.2.0)`) has no riscv conditionals. Generic size/dependency-trimming flags exist (`-DSECURITY=OFF`, `-DNO_TLS=ON`, `-DSQLITE3_SUPPORT=OFF`, `-DSHM_TRANSPORT_DEFAULT=OFF`, `-DCOMPILE_EXAMPLES=OFF`) but none are riscv-specific or riscv-documented.
- No QEMU reference exists anywhere in the repository (grep across all workflows and scripts returned nothing).
- No `Dockerfile.riscv64` or `docker/` directory containing riscv content exists (the repo has no top-level `docker/` directory at all).
- Documented Tier-1 compiler minimums (arch-agnostic, since no riscv64 tier exists): GCC 13.2, Clang 16, MSVC v142 (VS2019). GCC 12 is substituted for GCC 13 in ThreadSanitizer CI due to false positives on Fast-DDS synchronization calls -- this is unrelated to riscv64.

**Evidence riscv64 builds do happen, outside eProsima's control:**
- Debian/Ubuntu build `fastdds` for riscv64 from source as part of the standard Debian riscv64 port, using stock `debian/rules` + CMake with no eProsima-authored toolchain file (see Section 8).
- A third-party, unaffiliated hobby-OS project (`Ivans-11/Starry-FastDDS`) cross-compiles Fast-DDS to riscv64 for a research kernel using a musl-based riscv64 GCC cross toolchain. This is unofficial and not authoritative FastDDS guidance.

**Known build failures on riscv64:** None documented, because no first-party riscv64 build has ever been attempted or reported to eProsima. The one cross-compilation failure on record (Issue #1245, `foonathan::memory` node-size introspection breaking under cross-compilation) targeted i586/Yocto, not riscv64, but flags a category of risk (foonathan_memory's `FOONATHAN_MEMORY_NO_NODE_SIZE` cross-compile stub) worth spot-checking if Fast-DDS is cross-compiled to riscv64 rather than built natively, as Debian's build farm does.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core DDS/RTPS pub-sub | yes, Tier 1 tested | yes, Tier 1 tested | builds via distro (unverified by upstream CI) |
| DDS-Security / TLS | yes, Tier 1 | yes, Tier 1 | dependent on OpenSSL riscv64 support (see project-reports/openssl.md); not independently tested for FastDDS |
| Shared-memory transport | yes, default ON | yes, default ON | not independently verified |
| Discovery Server persistence (SQLite) | yes | yes | dependent on SQLite3 riscv64 (fully portable C, no known riscv64 bugs per project-reports/sqlite.md) |
| QNX cross-build | yes | yes | no target exists |

**Functional gaps:** No riscv64-specific functional gap is documented, because no one has exercised the full feature matrix on riscv64 and reported results. This is an absence-of-evidence gap, not a confirmed functional deficiency.

**Performance gaps:** No RISC-V-specific performance benchmark data exists for Fast-DDS from any source searched (eProsima's own performance pages, arXiv literature, GitHub issues, riseproject.dev). eProsima's official performance comparisons (Fast DDS vs Cyclone DDS, Fast DDS vs OpenDDS) and its own [benchmarking repository](https://github.com/eProsima/benchmarking) cover only x86_64 and one Raspberry Pi 3B+ (ARM) test -- no RISC-V data at all. Since FastDDS has no hand-tuned SIMD/intrinsics code for any architecture (Section 4), there is no missing-SIMD performance delta specific to riscv64 to characterize -- performance on riscv64, whatever it is, would come primarily from the compiler and the underlying OS/silicon, not from a missing FastDDS code path.

**Security hardening gaps:** Data not available: no riscv64-specific security testing, fuzzing, or hardening analysis for Fast-DDS was found. The one closed security-relevant issue on record (#1337, stack-buffer-overflow in `CDRMessage::readUInt32`, fixed 2020) was found and fixed on x86_64, with no riscv64 angle.

**NaN / floating-point semantics issues:** Data not available: no RISC-V floating-point/NaN/denormal issue was found in any search (`RISC-V floating point NaN denormal repo:eProsima/Fast-DDS` returned zero results).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified two independent ways: (1) GitHub code/issue/PR/commit search returning zero hits, and (2) a direct clone of `eProsima/fast-dds` at commit `0f5c9b94e284b08c861eea43cffec54a0ee67341` with a manual `grep -rniE "riscv|risc-v"` across all 27 `.github/workflows/*.yml` files plus the entire repository tree.

**Workflow files present (27 total):** `linters.yml`, `mac-ci.yml`, `mirror.yml`, `nightly-mac-{2.14.x,3.2.x,master}.yml`, `nightly-sanitizers-{2.14.x,3.2.x,master}.yml`, `nightly-ubuntu-{2.14.x,3.2.x,master}.yml`, `nightly-windows-{2.14.x,3.2.x,master}.yml`, `reusable-mac-ci.yml`, `reusable-sanitizers-ci.yml`, `reusable-ubuntu-ci.yml`, `reusable-windows-ci.yml`, `sanitizers-ci.yml`, `ubuntu-ci.yml`, `weekly-mac-2.6.x.yml`, `weekly-sanitizers-2.6.x.yml`, `weekly-ubuntu-{2.14.x,2.6.x}.yml`, `weekly-windows-2.6.x.yml`, `windows-ci.yml`.

**Result:** `grep -rniE "riscv|risc-v" .github/workflows/` returns zero matches. The only two "riscv" string matches in the entire repository are inert C preprocessor macros inside vendored Boost headers (`thirdparty/boost/include/boost/predef/architecture/riscv.h`, `thirdparty/boost/include/boost/predef/other/endian.h`), unrelated to CI.

**Runners:** every `runs-on:` line resolves to standard GitHub-hosted x86_64 runners (`ubuntu-24.04`, `ubuntu-22.04`, `macos-15-intel`, `windows-2022`). No self-hosted riscv64 runner label, no QEMU cross-arch step, no `linux/riscv64` platform string anywhere.

**No RISE runners used.** No RISE Project involvement was found anywhere (Section 12).

**No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml`** exist at the repository root.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes | yes | no |
| CI runs tests | yes | yes | no |
| CI release-blocking | yes (Tier 1) | yes (Tier 1) | no CI at all |
| Runner type | GitHub-hosted native | GitHub-hosted native | none |
| RISE runners used | no | no | no |

Source: [.github/workflows/](https://github.com/eProsima/Fast-DDS/tree/master/.github/workflows), read directly at commit `0f5c9b94e284b08c861eea43cffec54a0ee67341`.

## 8. Distribution and Release Status

**Upstream (eProsima):**
- **GitHub Releases:** only auto-generated source archives (`.zip`, `.tar.gz`) are attached to tags (e.g. v2.6.12, v3.2.5, v3.6.2, v3.4.3, v3.6.1, v3.6.0, v3.2.4, v3.5.0, v2.14.6, v3.4.2). No compiled binaries of any architecture exist on GitHub Releases -- this channel carries zero riscv64 (and zero amd64/arm64) prebuilt artifacts.
- **PyPI:** `fastdds-eprosima` returns HTTP 404 at both `https://pypi.org/pypi/fastdds-eprosima/json` and `https://pypi.org/simple/fastdds-eprosima/`. No package exists on PyPI under this name at all.
- **RISE Python Wheel Builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/fastdds-eprosima/` 302-redirects to the same nonexistent PyPI page. FastDDS/eProsima is absent from the [full 84-package wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/).
- **Arch Linux RISC-V port:** no `fastdds` package found on [archriscv.felixc.at](https://archriscv.felixc.at/?q=fastdds).

**Distro packaging (downstream, not eProsima-authored):**
- **Ubuntu 26.04 "resolute":** `libfastdds3.3`, `libfastdds-dev`, `libfastdds-doc`, `fastdds-tools`, `fastddsgen` are all packaged. Confirmed at [packages.ubuntu.com/resolute/riscv64/libfastdds3.3](https://packages.ubuntu.com/resolute/riscv64/libfastdds3.3) (version `3.3.0+ds-3ubuntu1`, riscv64, 3,377.0 kB, ports/universe archive) and [packages.ubuntu.com/resolute/riscv64/fastdds-tools](https://packages.ubuntu.com/resolute/riscv64/fastdds-tools) (same version, 130.2 kB, with a working per-arch filelist).
- **Debian:** [buildd.debian.org status page](https://buildd.debian.org/status/package.php?p=fastdds) shows riscv64 = version `3.3.0+ds-3+b1`, status **Installed** (successfully built), alongside amd64/arm64/armhf/ppc64el/s390x. [tracker.debian.org/pkg/fastdds](https://tracker.debian.org/pkg/fastdds) confirms the upstream VCS mapping to `github.com/eProsima/Fast-DDS.git` and shows riscv64 autopkgtest = **Pass**.
- **Patch status:** No riscv64-specific patches were identified in either the Debian or Ubuntu packaging diffs -- the build is from unmodified upstream source using standard CMake, packaged by the distro's own buildd infrastructure. This is a **clean, unpatched distro build**, not a patched/downstream-only port.

**What a user must do to get a working binary:** Install from Ubuntu 26.04 (resolute) or Debian sid/experimental via `apt install libfastdds-dev fastdds-tools` on riscv64 hardware/QEMU with ports/universe enabled. There is no eProsima-published riscv64 binary of any kind; users on other distros or wanting an eProsima-official artifact must build from source themselves, with no toolchain guidance provided (Section 5).

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| Fast-CDR (eProsima) | Required -- CDR/XCDR serialization | Ubuntu 26.04 riscv64: `libfastcdr2` 2.3.5-1, universe | not independently verified | Ubuntu universe | No riscv64 issues found (`search_issues "riscv" repo:eProsima/Fast-CDR` -> 0) |
| foonathan_memory_vendor | Required -- STL-compatible node/array allocator | Ubuntu 26.04 riscv64: `libfoonathan-memory0.7.4` 0.7.4-3, universe | not independently verified | Ubuntu universe | Historical i586 cross-compile issue (#1245) against node-size introspection; no riscv64-specific issue found (`search_issues "riscv" repo:foonathan/memory` -> 0) |
| Asio (chriskohlhoff) | Required -- networking/event loop | Ubuntu 26.04 riscv64: `libasio-dev` 1:1.30.2-1build1, universe | not independently verified | Ubuntu universe | No riscv64 issues found |
| TinyXML2 | Required -- XML QoS/profile parsing | Ubuntu 26.04 riscv64: `libtinyxml2-dev`, riscv64 listed | not independently verified | Ubuntu | No riscv64 issues found |
| OpenSSL | Required when `SECURITY`/TLS enabled | Ubuntu 26.04 riscv64: `libssl-dev` 3.5.5-1ubuntu3, riscv64 listed | Green on mainline crypto paths; QEMU-only CI, no native riscv64 runner (per project-reports/openssl.md) | Debian sid, Ubuntu, Arch RISC-V all current | Open AES T-table constant-time gap (critical, PRs #31080/#31082 unmerged); musl `RISCV_HAS_ZBB()` detection broken (#28118); `no-deprecated` cross-compile failure (#29357, fix PR #30763 unmerged); SSL test hangs at high parallelism (#22166, since 2023) -- see project-reports/openssl.md |
| SQLite3 | Optional (`SQLITE3_SUPPORT`) -- discovery-server persistence | Ubuntu 26.04 riscv64: `libsqlite3-dev` 3.46.1-9, riscv64 listed | Fully green, pure portable C, only known riscv-specific bug (`__uint128_t` guard on riscv32) fixed/backported April 2026 (per project-reports/sqlite.md) | Green across Debian, Ubuntu, Arch RISC-V, Fedora | No open riscv64 bugs; no upstream CI at all for this project, regressions caught only via distro build farms |
| Boost (`ThirdpartyBoost`) | Conditionally required (e.g. `boost::interprocess`) | Ubuntu 26.04 riscv64: `libboost-dev`, riscv64 listed | not independently verified | Ubuntu | Two `search_issues "riscv64" repo:boostorg/boost"` hits were false positives (unrelated ppc64le and Docker-date-bug issues); Boost is in `projects.yml` scope but has no existing `project-reports/boost.md` -- a gap in this repo's coverage |
| nlohmann-json | Vendored in-tree | N/A (header-only) | N/A | N/A | none |
| filewatch | Vendored in-tree | N/A | N/A | N/A | none |
| android-ifaddrs | Android-only shim | N/A | N/A | N/A | none |

**Deep-dive:** The only dependency with real riscv64-specific engineering surface is **OpenSSL**, which enters the build only when `SECURITY`/TLS is enabled. OpenSSL on riscv64 has extensive RVV/Zvk crypto acceleration but also real open gaps -- an unmerged AES T-table constant-time fix and a broken musl `Zbb` detection macro (see [project-reports/openssl.md](project-reports/openssl.md) for the full assessment). None of Fast-DDS's other dependencies (Asio, TinyXML2, foonathan_memory, Fast-CDR) has any SIMD/JIT/assembly code of its own; SQLite is portable C with a single historical riscv32 bug, already fixed.

**Bottom line:** the strongest positive signal for Fast-DDS on riscv64 is that Launchpad's Ubuntu build farm has already successfully compiled Fast-DDS *and* its entire dependency chain (Fast-CDR, foonathan_memory, Asio, TinyXML2, OpenSSL, SQLite3, Boost) natively on riscv64 -- this is a working, if downstream-provided, build.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64 issue, PR, or commit exists in eProsima/Fast-DDS | -- | -- | Confirmed by exhaustive GitHub issue/PR/commit/code search (`riscv`, `riscv64`, `risc-v`, `"RISC-V"`) all returning zero genuine matches |
| [#1245](https://github.com/eProsima/Fast-DDS/issues/1245) | Cross compiling FastRTPS \[8587\] | closed (2020, unrelated to riscv64) | N/A -- false-positive search hit | i586/Yocto cross-compile failure against `foonathan::memory` node-size symbols; flags a category of cross-compilation risk worth spot-checking if riscv64 builds are ever cross-compiled rather than native |

**Correctness bugs:** None found or reported for riscv64, because no riscv64 testing of any kind (upstream CI, community report, issue) has ever occurred against Fast-DDS. This is an evidence gap, not a clean bill of health.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No eProsima statement, issue, or documentation opposes a RISC-V port.

**Technical blockers:** None identified specifically for Fast-DDS itself -- the codebase is portable C++ with no architecture-specific code (Section 4). The only technical risk flagged is the historical foonathan_memory cross-compilation node-size issue (#1245), which predates RISC-V and targeted i586, but represents a class of risk if Fast-DDS is cross-compiled (rather than natively built, as Debian/Ubuntu do) to riscv64.

**Organizational blockers:** Per `CONTRIBUTING.md`, promotion to official Tier 1/2 status requires a "committed sponsoring entity" for Tier 2, and community demonstration at Tier 3 first. No entity -- community or corporate -- has initiated this process for RISC-V. eProsima is a single-vendor, commercially-driven company (Section 1); without a paying customer or RISE-style funded initiative requesting riscv64, there is no organizational driver to add it to `PLATFORM_SUPPORT.md`.

**RISE Project involvement:** None found. Checked against the [RISE member roster](https://riseproject.dev/members/) (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, ESWIN, ISCAS-affiliated BOSC, Canonical, Douyin, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) -- neither eProsima nor Fast-DDS is a member. Checked the complete published RISE RFP-funded project list (RP001-RP016: Go runtime, FFmpeg, libjpeg-turbo, Rust, QEMU TCG, LLVM testing, OpenOCD, GCC SPEC2017, LLVM Spec optimization, EFI IOMMU DXE Driver x2, Python package support, Linux Kernel CI, PyTorch ATen ops, Llama.cpp/GGML, OpenSBI TEE) -- no FastDDS/eProsima entry. Checked all 34 posts in the [RISE blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml) (May 2024-Aug 2026) -- no FastDDS/eProsima mention. Checked the `riseproject-dev` GitHub org (25 repos: working groups, `riscv-runner*`, `board-farm`, `pypi-proxy`, `python-wheels`, and this research repo) -- no FastDDS/eProsima-specific repo exists.

**Acceptance probability:** Given (1) a documented, open community-contribution pathway in `CONTRIBUTING.md`, (2) no technical blocker in the codebase itself, and (3) an already-working Ubuntu/Debian downstream build proving the code compiles cleanly on riscv64 -- the probability of upstream acceptance for a well-formed Tier 3 contribution (a CI job added by a contributor, following the stated process) is reasonably high **if someone initiates it**. The blocker is entirely a lack of initiation, not resistance.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro (Debian/Ubuntu)
- **Justification:** Fast-DDS has no upstream riscv64 CI of any kind -- confirmed by reading all 27 [`.github/workflows/*.yml`](https://github.com/eProsima/Fast-DDS/tree/master/.github/workflows) files at commit `0f5c9b94e284b08c861eea43cffec54a0ee67341`, zero riscv matches, and by `PLATFORM_SUPPORT.md` omitting riscv64 from its tier matrix entirely. Under the distribution floor rule, this would leave the project at orange, except that Debian and Ubuntu both build and ship `fastdds`/`libfastdds` for riscv64 from **unmodified upstream source** with no riscv64-specific patches identified in the packaging diff -- confirmed via [buildd.debian.org](https://buildd.debian.org/status/package.php?p=fastdds) (riscv64: Installed, autopkgtest Pass) and [packages.ubuntu.com](https://packages.ubuntu.com/resolute/riscv64/libfastdds3.3) (riscv64, version 3.3.0+ds-3ubuntu1, ports/universe). A clean, unpatched distro build upgrades the project from orange to **yellow** per the distribution-floor rule.
- **Optimization gap:** N/A -- Fast-DDS is a communication middleware library, not an optimization-purpose project (Section 4 confirms no SIMD/JIT/assembly exists for any architecture, so this is not a RISC-V-specific deficiency but a characteristic of the whole codebase).
- **Pending work that could change the grade:** None identified. No open PR, no RISE involvement, and no community Tier-3 contribution attempt exists anywhere. The grade would move to blue or green only if (a) eProsima or a community contributor added a riscv64 CI job that runs the test suite (-> blue if no upstream binary release follows, or green if eProsima also publishes a riscv64 release artifact), or (b) RISE or another third party funds and lands such CI. As of 2026-09-08, no such initiative is underway.

## 14. Investment Analysis

RISE has not funded or performed any work on Fast-DDS/eProsima (Section 12) -- there is no existing RISE investment to net out. All items below are unclaimed.

### 14.1 Functional Enablement

Fast-DDS already builds and passes Debian's riscv64 autopkgtest from unmodified source, so no functional-enablement blocker exists at the code level. The work needed is process, not code: add a riscv64 job to eProsima's own CI (most naturally to `reusable-ubuntu-ci.yml`, following the existing matrix pattern) and run the existing `ctest`/Python test suite on riscv64 (native runner or QEMU), to convert a proven-but-untracked distro build into a tracked, upstream-verified one.

### 14.2 Performance Optimization

Not applicable in the SIMD/intrinsics sense -- Fast-DDS has no architecture-specific hot paths on any platform (Section 4), so there is no RISC-V optimization gap to close relative to amd64/arm64. Any performance work would be generic (compiler flags, allocator tuning) rather than RISC-V-specific, and no baseline riscv64 performance data exists yet to identify whether a gap is even present (Section 6).

### 14.3 CI/CD Infrastructure

This is the primary gap. Adding a riscv64 leg to the existing `reusable-ubuntu-ci.yml` reusable workflow (used by `ubuntu-ci.yml`, `weekly-ubuntu-*.yml`, `nightly-ubuntu-*.yml`) is the highest-leverage single change: it would immediately move the color from yellow to blue (test execution without an upstream release) or, combined with 14.4, to green. This would require either RISE-hosted riscv64 runners or QEMU-based emulation in GitHub Actions, following the same reusable-workflow matrix pattern already used for `os-image` across amd64 runners.

### 14.4 Ecosystem Enablement

Not applicable as a distinct workstream -- Fast-DDS is a standalone C++ library/toolset with no dependent package ecosystem requiring separate riscv64 enablement (Section 10 omitted; see note below). The relevant "ecosystem" consideration is ROS 2, which depends on Fast-DDS as its default RMW; ROS 2's own riscv64 readiness is out of scope for this report.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 build+test leg to `reusable-ubuntu-ci.yml`, wired through `ubuntu-ci.yml`/`weekly-ubuntu-*.yml`/`nightly-ubuntu-*.yml` | 1-2 | eProsima (with RISE runner support if native hardware desired) | High |
| Functional | Verify full feature matrix (DDS-Security/TLS, shared-memory transport, Discovery Server persistence) on riscv64; add to `PLATFORM_SUPPORT.md` as Tier 3 initially | 1-2 | eProsima or community contributor | Medium |
| Distribution | Publish an eProsima-official riscv64 release artifact (binary or Docker image) once CI passes, to move release_provider from distro to upstream | 1 | eProsima | Medium |
| Cross-compile risk | Re-verify foonathan_memory node-size introspection (per #1245 precedent) if any future riscv64 build path uses cross-compilation rather than native build | 0.5 | eProsima or community contributor | Low |
| Coverage gap | Generate `project-reports/boost.md` for the Boost dependency, currently missing from this repo's tracked reports despite being in `projects.yml` scope | 0.5 | RISE research team | Low |

## 15. Updates

(No updates yet -- initial report dated 2026-09-08.)

## 16. References

- [Fast-DDS repository](https://github.com/eProsima/Fast-DDS)
- [Fast-DDS documentation homepage](https://fast-dds.docs.eprosima.com/)
- [PLATFORM_SUPPORT.md](https://github.com/eProsima/Fast-DDS/blob/master/PLATFORM_SUPPORT.md)
- [CONTRIBUTING.md](https://github.com/eProsima/Fast-DDS/blob/master/CONTRIBUTING.md)
- [.github/workflows/ directory](https://github.com/eProsima/Fast-DDS/tree/master/.github/workflows)
- [Issue #1245 - Cross compiling FastRTPS](https://github.com/eProsima/Fast-DDS/issues/1245)
- [Ubuntu resolute riscv64: libfastdds3.3](https://packages.ubuntu.com/resolute/riscv64/libfastdds3.3)
- [Ubuntu resolute riscv64: fastdds-tools](https://packages.ubuntu.com/resolute/riscv64/fastdds-tools)
- [Debian buildd status: fastdds](https://buildd.debian.org/status/package.php?p=fastdds)
- [Debian package tracker: fastdds](https://tracker.debian.org/pkg/fastdds)
- [PyPI: fastdds-eprosima (404, package does not exist)](https://pypi.org/pypi/fastdds-eprosima/json)
- [RISE Python Wheel Builder listing](https://riseproject.gitlab.io/python/wheel_builder/)
- [Arch Linux RISC-V port search](https://archriscv.felixc.at/?q=fastdds)
- [RISE Project member roster](https://riseproject.dev/members/)
- [RISE blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [eProsima Fast DDS performance comparisons](https://www.eprosima.com/developer-resources/performance/)
- [eProsima benchmarking repository](https://github.com/eProsima/benchmarking)
- [project-reports/openssl.md](project-reports/openssl.md) (dependency deep-dive: OpenSSL riscv64 status)
- [project-reports/sqlite.md](project-reports/sqlite.md) (dependency deep-dive: SQLite3 riscv64 status)
- [Ivans-11/Starry-FastDDS (unofficial third-party riscv64 cross-compile)](https://github.com/Ivans-11/Starry-FastDDS)
