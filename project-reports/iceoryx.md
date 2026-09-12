---
title: Iceoryx
parent: Project Reports
color: yellow
dependencies:
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: libacl
    relation: runtime-dependency
    criticality: optional
  - name: ncurses
    relation: runtime-dependency
    criticality: optional
  - name: cpptoml
    relation: runtime-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="iceoryx" %}

# Iceoryx

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Iceoryx<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Iceoryx (`eclipse-iceoryx/iceoryx`) is a portable C++17 zero-copy, shared-memory inter-process communication (IPC) middleware for safety-critical and automotive systems. It is an [Eclipse Foundation](https://projects.eclipse.org/projects/technology.iceoryx) project, licensed **Apache-2.0** (with `iceoryx_platform`, `iceoryx_hoofs`, `tools/ci`, and `tools/scripts` dual-licensed Apache-2.0 OR MIT per `NOTICE.md`/`CONTRIBUTING.md`).

Governance: `GOVERNANCE.md` states the project sits under the Eclipse **OpenADx** working group, but that working group is no longer active; the project's live Eclipse listing places it under **Eclipse Software Defined Vehicle** and **Internet of Things (IoT)** working groups instead. Contribution requires a signed Eclipse Contributor Agreement (ECA); no MAINTAINERS/CODEOWNERS file exists in-repo, the maintainer list of record lives at [projects.eclipse.org/projects/technology.iceoryx/who](https://projects.eclipse.org/projects/technology.iceoryx/who).

Corporate sponsors, by commit volume and email domain in `git shortlog`: **Apex.AI** (Christian Eltzschig, Mathias Kraus, Simon Hoinkis, Dietrich Kronke, Marika Lehmann, Matthias Killat, ~1600-1200 commits for the top three) and **Robert Bosch GmbH** (several of the same individuals also commit from `@de.bosch.com`/`@in.bosch.com` addresses, indicating Bosch origin/co-backing alongside Apex.AI). Current Eclipse project leads: Christian Eltzschig, Mathias Kraus, Michael Poehnl. Downstream/ecosystem users per the README: ROS 2 (`rmw_iceoryx`), Continental AG (Eclipse eCAL), ETAS GmbH (RTA-VRTE/AUTOSAR Adaptive), ZettaScale Technology (Cyclone DDS), Apex.AI (Apex.Ida), AVIN Systems. Static analysis partnership with **Axivion** (AUTOSAR/CERT C++/MISRA) supports ASIL-D safety ambitions.

**Critical context on community culture toward new ports:** the README carries a top banner (added circa 2026) stating that classic iceoryx is now **in maintenance mode**, taking security fixes only, with no further major releases; "maintainers' focus has shifted to **iceoryx2**" (the Rust rewrite), which the maintainers say "runs on more platforms." Classic iceoryx will reach EOL shortly after iceoryx2 reaches v1.0. Any RISC-V port proposal against classic iceoryx would likely be redirected by maintainers toward iceoryx2. No RISC-V port work has occurred in either repository (Section 2).

## 2. Port History and Upstreoming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V-related commit, issue, or PR has ever been filed | Full-history clone (`git log --all --grep -i riscv`), zero matches; GitHub search API (issues/PRs/commits/code, `total_count: 0` on every query) |

No RISC-V port work has ever been proposed, opened, or merged against `eclipse-iceoryx/iceoryx`. There are no key contributors to name because no port effort exists. The project is **not** upstreamed for RISC-V, and there is no in-flight work to track.

The same is true of the Rust successor `eclipse-iceoryx/iceoryx2`: GitHub search for `riscv`/`risc-v` returns zero issues and zero PRs. The only "riscv" string found anywhere across both repositories is an incidental line in `iceoryx2-ffi/python/poetry.lock` naming a `maturin-1.9.3-py3-none-manylinux_2_39_riscv64.whl` build-tool dependency wheel filename - generic PyPI packaging metadata for the `maturin` tool itself, not evidence of an iceoryx2 riscv64 port, build, or test.

## 3. Upstream Support Tier

Iceoryx has no formal per-architecture support tier system. The README's "Supported Platforms" table lists only **Linux, QNX, macOS, Windows 10, FreeBSD (Unix)**, rated on two feature axes (shared-memory access rights, CLI parsing) - there is no architecture/ISA column at all. The README states "in general unix platforms should work... but we only test FreeBSD on our CI" - an informal "should probably work, untested" stance that RISC-V would fall under today. Separately, `QUALITY_DECLARATION.md` tracks quality levels (5 down to 1+, derived from ROS REP-2004) per CMake target x OS, not per CPU architecture - there is no formal mechanism for a new ISA to "enter" a support tier.

No riscv64 job is release-blocking (none exists), and no official riscv64 binaries are published by upstream (Section 8).

**Comparison table: amd64 vs arm64 vs riscv64**

| Aspect | amd64/x86_64 | aarch64/arm64 | riscv64 |
|---|---|---|---|
| Upstream CI (GitHub Actions) | Yes - primary target (`ubuntu-24.04`, `ubuntu-22.04`, `windows-latest`, `macos-latest`) | No active job (a disabled Cirrus CI `arm_container` job exists, see Section 7) | None |
| Upstream release artifact | Source archives only (no custom binaries; see Section 8) | Same | Same (none) |
| Distro package (Ubuntu 26.04 resolute) | Yes | Yes | Yes (unmodified upstream source) |
| ISA-specific source code | None (no per-ISA files for any architecture) | None | None |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Iceoryx is **not** an optimization-purpose project (Step 2 of the readiness color model does not apply): it is a shared-memory IPC middleware, not a SIMD/JIT/crypto/compression performance library. It implements its own lock-free relative-pointer allocator and TLSF-style memory management internally, with no third-party numerics/SIMD/crypto/compression/JIT dependency anywhere in the tree.

Direct repository inspection (clone at HEAD `9f9fb0d359f1805cdd38006c8aba6af6dbc2209e`) confirms the project has **zero architecture-specific (ISA-level) source code for any CPU architecture**, not just RISC-V:

- `grep -rIni "riscv"` (entire repo): 0 matches. `grep -rIni "\brv64\b|\brv32\b"`: 0 matches.
- `__riscv`: 0 matches. `__aarch64__`: 0 matches in conditional source code (only incidental mentions in a QNX cross-toolchain CMake file and CI/doc text). `__x86_64__`: 0 matches in conditional source code (same pattern).
- No SIMD/intrinsics/assembly anywhere: `grep` for `simd|intrinsic|__builtin_|xmmintrin|immintrin|arm_neon` and `find` for `*.s`/`*.asm` files returned nothing (the only "intrinsic"-adjacent hits are compiler intrinsics like `__FILE__`/`__LINE__`, unrelated to CPU ISA).
- `iceoryx_hoofs/concurrent/sync/include/iox/atomic.hpp` is a passthrough to `iceoryx_platform/generic/include/iceoryx_platform/atomic.hpp`, which wraps `std::atomic` directly - no hand-written lock-free atomics per architecture.

The `iceoryx_platform/` abstraction layer is organized **by operating system, not by CPU ISA**: `iceoryx_platform/{linux, mac, win, qnx, freertos, unix, generic, minimal_posix}/`. There is no `amd64/`, `arm64/`, or `riscv64/` source tree for any architecture.

**Comparison table per component (amd64 vs arm64 vs riscv64)**

| Component | amd64/x86_64 | aarch64/arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned/ISA-specific code (any kind) | Missing (none exists for any arch) | Missing (none exists) | Missing (none exists) |
| Compiles/runs via portable C++17/POSIX | Yes (works, untuned) | Yes (works, untuned) | Yes in principle - no source blocker found, but zero CI verification and zero toolchain file in-repo |

**Conclusion:** this is not a case of "riscv64 is a stub while amd64/arm64 are complete." No architecture gets ISA-specific source in this project; portability is achieved entirely through the compiler/OS abstraction layer. riscv64's only meaningful gap versus arm64 or amd64 is operational (no CI, no toolchain file, no test evidence), not code-level.

## 5. Build System, Cross-Compilation, and Toolchain

Standard build (documented in `doc/website/getting-started/installation.md`):
```
cmake -Bbuild -Hiceoryx_meta
cmake --build build
sudo cmake --build build --target install
```
Toolchain minimums: CMake >= 3.16, GCC >= 8.3, Clang >= 9.0, MSVC (VS2019+). No architecture-specific minimum is documented for any ISA - these are the only stated version floors, justified only by general C++17 support requirements.

There is **no riscv64 toolchain file** anywhere in the repository (`tools/toolchains/` contains only `qnx/qnx_sdp70_aarch64le.cmake` and `qnx_sdp70_x86_64.cmake`, for QNX cross-compilation). There is **no `Dockerfile.riscv64`** or riscv-flavored Dockerfile in `tools/docker/`. There is **no QEMU usage** anywhere in the repository (`grep -ril qemu` returns 0 matches).

The only documented mechanism for adding a new architecture or OS is `-DIOX_PLATFORM_PATH=/path/to/custom/platform` (see [`doc/website/advanced/custom-iceoryx-platform.md`](https://github.com/eclipse-iceoryx/iceoryx/blob/main/doc/website/advanced/custom-iceoryx-platform.md)), which requires implementing the `iceoryx_platform` HAL headers/sources plus `cmake/IceoryxPlatformSettings.cmake` (`ICEORYX_CXX_STANDARD >= 17`). Since the platform layer abstracts OS syscalls rather than CPU ISA, a RISC-V Linux target would most likely reuse the existing `linux` platform folder unmodified - the gap is purely a lack of CI coverage/testing/documentation, not a missing abstraction layer. This is inference from build-system structure, not a tested/confirmed build path; it carries no direct source and should be treated as [NEEDS VERIFICATION].

No known riscv64 build failures are documented anywhere (issue tracker, CI logs, or docs), because riscv64 has never been built or tested by anyone upstream.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Full middleware feature set (RouDi daemon, posh, hoofs, binding_c, introspection) | Yes, tested in CI | Not exercised in active CI (see Section 7) | Not exercised in any CI; unverified |
| TOML dynamic configuration (`cpptoml`, header-only) | Yes | Yes (architecture-agnostic) | Presumed yes (architecture-agnostic C++11 header-only library) - unverified |
| ACL-based shared-memory permissions (`libacl`, optional) | Yes | Yes | Presumed yes (standard architecture-independent Debian/Ubuntu package `libacl1-dev`) - unverified |
| Introspection CLI (`ncurses`) | Yes | Yes | Presumed yes (architecture-independent GNU package) - unverified |

No functional gaps ("can't do X at all") were identified because no one has attempted to run Iceoryx on riscv64 and reported the result, positively or negatively. Data not available: any performance-gap analysis (no SIMD/hand-tuned code exists for any architecture in this project, so there is no missing-SIMD delta to measure; Section 4). Data not available: security hardening gap data specific to riscv64. Data not available: NaN/floating-point semantics issues specific to Iceoryx on riscv64 - none reported.

One tangential correctness-bug analogue was found for a different weak-memory-order architecture: [issue #2006, "Suspected missing memory barrier on Aarch64"](https://github.com/eclipse-iceoryx/iceoryx/issues/2006) (closed, Aug 2023) - chunk-allocation errors on Apple M1 traced to a possibly missing memory barrier under ARM's weaker memory ordering, which disappeared under x86 emulation (TSO). RISC-V's RVWMO memory model is also weaker than x86 TSO, so this class of bug is plausible on riscv64 by analogy, but no one has reported it there - this is speculative, not evidenced, and is flagged [NEEDS VERIFICATION].

## 7. CI/CD Infrastructure

**No riscv64 CI exists**, confirmed by directly reading every CI configuration file in the repository at HEAD `9f9fb0d359f1805cdd38006c8aba6af6dbc2209e`:

| File | Trigger | Runners | riscv64? |
|---|---|---|---|
| `.github/workflows/build-test.yml` | `push` (main), `pull_request` (main/release*/iox-*) | `ubuntu-24.04`, `ubuntu-22.04`, `windows-latest` (x3: MSVC/MinGW/32-bit), `macos-latest`, FreeBSD-in-VirtualBox-on-`ubuntu-24.04` | No |
| `.github/workflows/nightly.yml` | `schedule` (`0 6 * * 1-5`), `workflow_dispatch` | `macos-latest`, `ubuntu-24.04` | No |
| `.github/workflows/release_build_publish.yml` | `workflow_dispatch` only | `ubuntu-24.04` | No |
| `.github/workflows/changelog.yml` | `workflow_dispatch` only | `ubuntu-latest` | No |
| `.github/workflows/lint_pull_request.yml` | `pull_request` (main/release*/iox-*) | `ubuntu-24.04` | No |
| `.cirrus.yaml` | (present but its entire pipeline is disabled: `only_if: false && (...)`) | Would include a native-hardware `arm_container` aarch64 job if active | No (and the one native-hardware ARM job is currently disabled) |

No `.gitlab-ci.yml`, `Jenkinsfile` exists. Repo-wide `grep -rIni "riscv" --exclude-dir=.git .` returns zero matches (sanity-checked against `grep -rIn "ubuntu-24.04" .github/workflows/` returning 17 matches, confirming grep functions correctly on this checkout).

No RISE RISC-V CI runners are referenced anywhere in the repository. No RISE (riseproject.dev) involvement of any kind was found - Iceoryx is not a RISE member project, has no RISE blog coverage, is not in the RISE Python wheel builder (Iceoryx has no PyPI package at all), and has no RISE-tracked repository (confirmed via the RISE blog full post listing, the `riseproject-dev` GitHub org repo/code search, and the RISE members page).

**Comparison table: amd64 vs arm64 vs riscv64**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Active CI job | Yes (primary target across all 5 active workflows) | No (only a disabled Cirrus CI native-hardware job) | No |
| Test execution in CI | Yes | N/A (job disabled) | N/A (no job exists) |
| Release-blocking | Yes (build-test.yml gates PR merge on main/release*/iox-*) | No | No |

## 8. Distribution and Release Status

**Upstream GitHub Releases:** No riscv64 binaries. GitHub Releases pages for recent tags (v2.0.8, v2.0.7, v2.0.6, v2.0.5, v2.0.3, v2.0.2, v1.0.3, v2.0.1, v2.0.0, v1.0.2) show only "Assets 2" per release - consistent with GitHub's two auto-generated default assets (source .zip/.tar.gz), not custom platform binaries for any architecture, riscv64 included. Direct API/asset-filename verification was blocked in this research session by GitHub API scope restrictions and JS-rendered release pages, so this is inferred from the asset-count pattern rather than filename-level confirmation - flagged [NEEDS VERIFICATION] at the filename level, though corroborated independently across multiple research passes.

**PyPI:** N/A. No package named `iceoryx` exists on PyPI (`https://pypi.org/pypi/iceoryx/json` returns HTTP 404) - expected, since Iceoryx is a C++ library, not a Python package. The RISE wheel-builder mirror (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/iceoryx/`) redirects to the same PyPI 404.

**Linux distributions:**
- **Ubuntu 26.04 (resolute):** [Confirmed live via packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Iceoryx&suite=resolute&searchon=names&section=all) - 14 iceoryx-related binary packages exist at version `2.0.6+dfsg-2`. 13 of the 14 (all except the architecture-independent `iceoryx-doc`) list architectures as `amd64 arm64 ppc64el riscv64 s390x`, including `iceoryx`, `libiceoryx-hoofs2`, `libiceoryx-posh2`, `libiceoryx-binding-c2`, `libiceoryx-platform2`, `libiceoryx-introspection2`, `libiceoryx-posh-gateway2`, `libiceoryx-posh-roudi2`, `libiceoryx-posh-config2`, plus matching `-dev` packages. This is a Debian-archive rebuild of unmodified upstream source under Debian's standard multi-arch policy - not an upstream-published artifact, and not evidence of upstream CI, testing, or intent.
- **Arch Linux RISC-V (archriscv):** Inconclusive - the intended query endpoints (`archriscv.felixc.at/?q=iceoryx`, `archriscv.felixc.at/riscv64/extra/`) returned no queryable package data (static info page / 404 respectively). Data not available.
- **Debian/Fedora:** Data not available: not directly queried in this research pass beyond the Ubuntu check.

**What a user must do to get a working binary today:** install the Ubuntu 26.04 (resolute) `iceoryx`/`libiceoryx-*` packages via `apt`, which are riscv64-native and built from unpatched upstream source. There is no upstream-published riscv64 binary, container image, or wheel of any kind; the only verified riscv64 binary channel is Ubuntu's distro archive.

## 9. Dependencies

Iceoryx has an unusually small dependency surface (self-contained memory allocator, no external SIMD/numerics/crypto/compression/JIT library):

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| glibc / pthreads (Threads, libatomic, librt) | Core threading (NPTL), atomics, POSIX rt; linked by `iceoryx_platform` on every Linux build | Fully upstream, first-class in glibc riscv64 port (per `project-reports/glibc.md`) | Working; report notes riscv64 CI buildbots currently offline (infra gap, not code gap) | Shipped in every distro incl. Ubuntu | Active, no known riscv64 blockers |
| libacl (POSIX ACLs, `IOX_PLATFORM_FEATURE_ACL`) | Optional Linux-only feature for shared-memory segment permissions; can be disabled via `acl_feature_off.cpp` fallback | Not GitHub-hosted (Savannah/GitLab); not directly searched this pass | No riscv64-specific issues found | Standard Debian/Ubuntu package (`libacl1-dev`), architecture-independent C | None found |
| ncurses / Curses | Optional, only for `tools/introspection` CLI (not core middleware) | Not directly searched this pass; GNU project, arch-independent | No known issues | Standard Ubuntu package (`libncurses-dev`) | None found |
| cpptoml (`skystrife/cpptoml`) | Required when `TOML_CONFIG=ON` (default ON); parses RouDi's dynamic TOML config; vendored at pinned tag `v0.1.1` via CMake `ExternalProject`, not fetched from apt | Header-only C++11, architecture-agnostic; last release 2016 | `search_issues "riscv64 riscv risc-v" repo:skystrife/cpptoml` -> 0 results | Trivially portable, no known riscv64 gap | Effectively unmaintained (risk is abandonment, not riscv64-specific) |
| googletest (`google/googletest`) | Build/test-only; `iceoryx_hoofs_testing`/`iceoryx_posh_testing` fetch `v1.14.0` via `ExternalProject`; not linked into shipped binaries | Package generally available; falls through to the generic Linux path | 0 open riscv64 issues today, but tracked issue [#3756](https://github.com/google/googletest/issues/3756): `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (`GetThreadCount()` returns 0, no `#ifdef __riscv` guard in `gtest-port.cc`) | Available on all arches | Known-but-unfixed upstream bug; could cause spurious test failures if iceoryx's own test suites exercise that gtest internal, but does not affect the shipped iceoryx binary |
| Doxygen | Docs generation only (`BUILD_DOC`), never linked/shipped | N/A to runtime riscv64 status | - | Ubuntu package present on all arches | None |
| ament_cmake / launch_testing_ament_cmake | Optional, only for `iceoryx_integrationtest` under ROS 2 | Not investigated (out of scope) | - | - | Not assessed |

**Note on verification limits:** the `project-graph` MCP server was unreachable for the entirety of this research (`CONNECTION_CLOSED`), so transitive dependency-graph queries and programmatic Ubuntu package confirmation for `cpptoml`/`libacl`/`ncurses` could not be run; the glibc and googletest rows draw on existing tracked reports (`project-reports/glibc.md`, `project-reports/googletest.md`); other rows are inference from package characteristics (architecture-independent C/C++), not verified graph results, and are flagged [NEEDS VERIFICATION] accordingly.

**No blocking dependency issues were found** for riscv64 across Iceoryx's actual dependency set. The one documented defect (`googletest` #3756) is test-infrastructure-only and does not block a shipped riscv64 binary.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue or PR has ever been filed against `eclipse-iceoryx/iceoryx` or `eclipse-iceoryx/iceoryx2` | N/A | N/A | Confirmed via GitHub search API (`total_count: 0` across issues, PRs, commits, code, in both repos) |
| [google/googletest#3756](https://github.com/google/googletest/issues/3756) | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 | Open (dependency, not Iceoryx itself) | Low (test-infra only) | `GetThreadCount()` returns 0 on riscv64; could cause spurious CI test failures if Iceoryx's own hoofs/posh suites exercise this gtest internal |
| [eclipse-iceoryx/iceoryx#2006](https://github.com/eclipse-iceoryx/iceoryx/issues/2006) | Suspected missing memory barrier on Aarch64 | Closed (Aug 2023) | Correctness (not riscv64) | Included as an analogue: a weak-memory-order correctness bug found on ARM; RISC-V's RVWMO is also weaker than x86 TSO, so this class of bug is plausible but unreported on riscv64 - speculative, [NEEDS VERIFICATION] |
| [eclipse-iceoryx/iceoryx#549](https://github.com/eclipse-iceoryx/iceoryx/issues/549) | Slow performance on yocto builds | Closed (2021) | Performance (not riscv64) | ~2ms latency on Yocto/qemux86 vs ~5us on native Ubuntu x86_64; unrelated to RISC-V, included as the closest cross-platform performance-regression precedent in the tracker |

No correctness bugs specific to riscv64 exist because riscv64 has never been tested by anyone upstream (positive or negative evidence is both absent).

## 12. Objections and Upstream Blockers

**Stated objections:** none found - because no RISC-V port has ever been proposed, no maintainer has ever had occasion to accept or reject one.

**Technical blockers:** none identified at the source level. The project's architecture-agnostic POSIX/C++17 design (Section 4) presents no known technical obstacle to a riscv64 Linux build; the `IOX_PLATFORM_PATH` mechanism (Section 5) is generic and would likely require no new abstraction-layer code, only a build/CI setup effort.

**Organizational blockers:** the project's "maintenance mode" status (Section 1) is the primary practical blocker. The README explicitly states classic iceoryx takes only security fixes and no new major releases, with maintainer effort redirected to iceoryx2. A RISC-V CI/build enablement PR against classic iceoryx would likely be steered by maintainers toward iceoryx2 instead, per the stated project direction - though this is an inference from the maintenance-mode banner, not a direct maintainer statement about RISC-V specifically, and is flagged [NEEDS VERIFICATION].

**Acceptance probability:** Data not available - no historical precedent exists (no ARM/aarch64 CI enablement PR was ever merged either; the one native-hardware ARM job in `.cirrus.yaml` is disabled) to gauge how receptive maintainers would be to a new-architecture CI contribution. The absence of any precedent for adding a new architecture to active CI is itself a data point suggesting such a contribution has not been a maintainer priority for any ISA, not RISC-V specifically.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro (Ubuntu)
- **Optimization gap:** N/A - Iceoryx is not an optimization-purpose project per the color model's test (it is a correctness/functionality-oriented IPC middleware with no SIMD/JIT/crypto/compression differentiator; Section 4 confirms zero ISA-specific code for any architecture, so there is no optimization coverage question to assess).
- **Justification:** No upstream riscv64 CI exists in `eclipse-iceoryx/iceoryx` - confirmed by directly reading all five active GitHub Actions workflow files (`.github/workflows/build-test.yml`, `nightly.yml`, `release_build_publish.yml`, `changelog.yml`, `lint_pull_request.yml`) plus the disabled `.cirrus.yaml`, none of which reference riscv64 in any form (Section 7). Applying the distribution floor: Ubuntu 26.04 (resolute) ships 13 riscv64 iceoryx binary packages built from **unmodified, unpatched upstream source** ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Iceoryx&suite=resolute&searchon=names&section=all), Section 8), which per the color model upgrades the project from "no CI" to **yellow (clean-distro-build)** rather than orange, since no riscv64-specific patches were needed to build it. `release_provider` is `Ubuntu`, not upstream, since eclipse-iceoryx itself publishes no riscv64 artifact anywhere.
- **Pending work that could change the grade:** None found. No open PRs, no RISE involvement (Section 7), and no in-flight upstream CI or release work exists for riscv64 in either `eclipse-iceoryx/iceoryx` or its Rust successor `eclipse-iceoryx/iceoryx2`. The only path to blue or green would be upstream adding a riscv64 CI job that builds and runs tests (blue), then publishing a riscv64 release artifact directly (green) - neither is in progress. The project's maintenance-mode status (Section 1/12) makes such work on classic iceoryx unlikely; any future investment would more plausibly target iceoryx2, which currently has an identical zero-riscv64-history profile.

## 14. Investment Analysis

RISE has not funded, tracked, or otherwise touched Iceoryx in any capacity (Section 7): it is not a RISE member project, has no RISE blog coverage, no RISE runner CI usage, and is not in the RISE Python wheel builder. It appears only as an unexercised dependency noted in an internal ROS 2 project report and as an unauthored backlog entry, per this workspace's own tracking data. All work items below are therefore fully unclaimed - nothing to subtract for prior RISE investment.

### 14.1 Functional Enablement

Core technical risk is low (Section 4: architecture-agnostic POSIX/C++17 code, no per-ISA source anywhere). The work is almost entirely CI/build enablement, not porting:
- Add a riscv64 job to `.github/workflows/build-test.yml` (native runner or QEMU), mirroring the existing `ubuntu-24.04`/`ubuntu-22.04` jobs.
- Validate the full test suite (hoofs, posh, binding_c, introspection) passes on riscv64; investigate/patch around known dependency defects (e.g. googletest #3756's `GetThreadCount()` riscv64 bug, Section 9) if it surfaces in CI.
- Confirm `IOX_PLATFORM_PATH`/existing `linux` platform folder works unmodified on riscv64 (Section 5) - expected to require no new HAL code, but unverified until actually built and run.

### 14.2 Performance Optimization

Not applicable in the traditional sense - Iceoryx has no ISA-specific hot-path code for any architecture (Section 4), so there is no "port the SIMD kernel" work analogous to optimization-purpose libraries. Any performance work would be limited to standard scalar-code profiling/tuning common to any new target, not RISC-V-specific optimization.

### 14.3 CI/CD Infrastructure

- Stand up a riscv64 CI job (native RISC-V runner preferred over QEMU, given the project's safety-critical/low-latency IPC use case where emulation could mask real timing/memory-ordering behavior - see the ARM memory-barrier issue #2006 analogue, Section 6/11).
- No RISE RISC-V runner relationship currently exists to leverage (Section 7) - this would need to be established fresh, either via RISE's published runner program or independent hardware.
- Enable the currently-disabled `.cirrus.yaml` native-hardware ARM job as a template/precedent check before or alongside riscv64 enablement, since neither ARM nor RISC-V currently has active non-x86 CI.

### 14.4 Ecosystem Enablement

Section 10 omitted per instructions: Iceoryx is a standalone C++ IPC middleware/system library with no dependent package ecosystem (no PyPI/npm/Maven consumers requiring separate riscv64 enablement) - its only "ecosystem" role is as an optional dependency of ROS 2 (`rmw_iceoryx`), which is out of scope for this report.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 job to `build-test.yml` (build + full test suite: hoofs, posh, binding_c, introspection) | 1-2 | Upstream contributor / sponsor engineer | High |
| Functional | Investigate/patch around googletest #3756 (`GetThreadCount()` riscv64 bug) if it blocks CI | 0.5-1 | Upstream contributor | Medium |
| Functional | Validate `IOX_PLATFORM_PATH`/`linux` platform folder on riscv64 hardware end-to-end (RouDi daemon, shared-memory IPC, ACL feature) | 1-2 | Upstream contributor | High |
| CI/CD | Provision native riscv64 CI runner (or QEMU fallback) and integrate into GitHub Actions | 1-2 | Infra/DevOps | High |
| CI/CD | Investigate weak-memory-order correctness risk on riscv64 (RVWMO), by analogy to closed ARM issue #2006 | 1 | Upstream contributor | Medium |
| Release | Publish riscv64 release artifact/binary directly from upstream (currently only Ubuntu provides one) | 0.5-1 (once CI above exists) | Upstream maintainer | Medium |
| Organizational | Engage Eclipse iceoryx maintainers on RISC-V priority given stated "maintenance mode" status; determine whether effort should target iceoryx2 instead | 0.5 (outreach) | Sponsor/engineering lead | High (gates all other work) |

## 15. Updates

(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [eclipse-iceoryx/iceoryx repository](https://github.com/eclipse-iceoryx/iceoryx)
- [Iceoryx homepage](https://iceoryx.io/)
- [Eclipse iceoryx project page](https://projects.eclipse.org/projects/technology.iceoryx)
- [Eclipse iceoryx maintainers/committers](https://projects.eclipse.org/projects/technology.iceoryx/who)
- [.github/workflows/build-test.yml](https://github.com/eclipse-iceoryx/iceoryx/blob/main/.github/workflows/build-test.yml)
- [.github/workflows/nightly.yml](https://github.com/eclipse-iceoryx/iceoryx/blob/main/.github/workflows/nightly.yml)
- [.github/workflows/release_build_publish.yml](https://github.com/eclipse-iceoryx/iceoryx/blob/main/.github/workflows/release_build_publish.yml)
- [.github/workflows/changelog.yml](https://github.com/eclipse-iceoryx/iceoryx/blob/main/.github/workflows/changelog.yml)
- [.github/workflows/lint_pull_request.yml](https://github.com/eclipse-iceoryx/iceoryx/blob/main/.github/workflows/lint_pull_request.yml)
- [doc/website/advanced/custom-iceoryx-platform.md](https://github.com/eclipse-iceoryx/iceoryx/blob/main/doc/website/advanced/custom-iceoryx-platform.md)
- [doc/website/getting-started/installation.md](https://github.com/eclipse-iceoryx/iceoryx/blob/main/doc/website/getting-started/installation.md)
- [GOVERNANCE.md](https://github.com/eclipse-iceoryx/iceoryx/blob/main/GOVERNANCE.md)
- [NOTICE.md](https://github.com/eclipse-iceoryx/iceoryx/blob/main/NOTICE.md)
- [QUALITY_DECLARATION.md](https://github.com/eclipse-iceoryx/iceoryx/blob/main/QUALITY_DECLARATION.md)
- [Ubuntu resolute package search: Iceoryx](https://packages.ubuntu.com/search?keywords=Iceoryx&suite=resolute&searchon=names&section=all)
- [PyPI JSON API: iceoryx (404, no package)](https://pypi.org/pypi/iceoryx/json)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE project blog](https://riseproject.dev/blog/)
- [RISE members page](https://riseproject.dev/members/)
- [eclipse-iceoryx/iceoryx issue #2006: Suspected missing memory barrier on Aarch64](https://github.com/eclipse-iceoryx/iceoryx/issues/2006)
- [eclipse-iceoryx/iceoryx issue #549: Slow performance on yocto builds](https://github.com/eclipse-iceoryx/iceoryx/issues/549)
- [eclipse-iceoryx/iceoryx issue #2055: 'convert' is broken for edge cases](https://github.com/eclipse-iceoryx/iceoryx/issues/2055)
- [eclipse-iceoryx/iceoryx PR #2135: Fix convert edge cases](https://github.com/eclipse-iceoryx/iceoryx/pull/2135)
- [google/googletest issue #3756: GetThreadCountTest.ReturnsCorrectValue fails on riscv64](https://github.com/google/googletest/issues/3756)
- [eclipse-iceoryx/iceoryx2 discussion #435: Benchmarks for iceoryx2 vs other IPC strategies](https://github.com/eclipse-iceoryx/iceoryx2/discussions/435)
- [eclipse-iceoryx/iceoryx2 repository](https://github.com/eclipse-iceoryx/iceoryx2)
- Internal: `project-reports/glibc.md` (riscv64 glibc status, used for Section 9)
- Internal: `project-reports/googletest.md` (riscv64 googletest status, used for Section 9)
- Internal: `riseproject-dev/sw-ecosystem` repository, `project-reports/ros-2.md` and `project-reports/.queue.yml` (Iceoryx tracking status within RISE's workspace)
