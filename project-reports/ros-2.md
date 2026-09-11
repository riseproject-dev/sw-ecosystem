---
title: ROS 2
parent: Project Reports
color: orange
dependencies:
  - name: FastDDS (eProsima)
    relation: build-dependency
    criticality: critical
  - name: Fast-CDR
    relation: build-dependency
    criticality: optional
  - name: foonathan_memory
    relation: build-dependency
    criticality: optional
  - name: CycloneDDS
    relation: build-dependency
    criticality: optional
  - name: Iceoryx
    relation: build-dependency
    criticality: optional
  - name: TLSF
    relation: build-dependency
    criticality: optional
  - name: Eigen
    relation: build-dependency
    criticality: optional
  - name: OpenSSL
    relation: build-dependency
    criticality: optional
  - name: zstd
    relation: build-dependency
    criticality: optional
  - name: LZ4
    relation: build-dependency
    criticality: optional
  - name: yaml-cpp
    relation: build-dependency
    criticality: optional
  - name: libyaml
    relation: build-dependency
    criticality: optional
  - name: spdlog
    relation: build-dependency
    criticality: optional
  - name: MCAP
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="ros-2" %}

# ROS 2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for ROS 2<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

ROS 2 (Robot Operating System 2) is the standard middleware/runtime framework for robotics software, providing pub/sub messaging (via DDS), services, actions, a component/node lifecycle model, and tooling (launch, bag recording, parameter management) used across industrial, research, and autonomous-systems robotics. [ros2/ros2](https://github.com/ros2/ros2) is a meta-repository: it contains no implementation source code itself, only a manifest (`ros2.repos`) pinning ~150-200 constituent package repositories (rclcpp, rcl, rmw, rmw_fastrtps, rmw_cyclonedds, etc.) plus build-tooling files (`pixi.toml`, `pixi.lock`) and CI workflows.

**Governance:** The legal entity is the Open Source Robotics Foundation (OSRF), renamed Open Robotics in 2017, which retains ultimate authority via its Board of Directors. Day-to-day governance since March 18, 2024 runs through the **Open Source Robotics Alliance (OSRA)**, a membership organization modeled on the Linux Foundation/Eclipse Foundation, covering ROS, Gazebo, Open-RMF, and shared infrastructure. Structure: a cross-project Technical Governance Committee (TGC) over per-project Project Management Committees (PMC); the ROS PMC has 16 voting members and 12 non-voting committers, meeting weekly (Tuesdays 17:00 UTC), open to community observation. Interim ROS Project Leader: Michael Carroll (Intrinsic/KUKA). License: Apache License 2.0 for core ROS 2, mixed OSS licenses across the wider ecosystem.

**Corporate sponsors (OSRA membership, launched March 2024):**

| Tier | Members |
|---|---|
| Platinum | Intrinsic (Google), NVIDIA, Qualcomm Technologies |
| Gold | Apex.AI, Zettascale |
| Silver | Clearpath Robotics, Ekumen, eProsima, PickNik |
| Associate | Silicon Valley Robotics |
| Supporting | Canonical, Open Navigation |
| Incoming | Bosch, ROS-Industrial |

Corporate-affiliated maintainers visible in recent `ros2/ros2` commit history include Alejandro Hernandez Cordero (Intrinsic), Miguel Company (eProsima), Michael Carroll (Intrinsic.ai), William Woodall and Addisu Z. Taddese (Open Robotics), and Tomoya Fujita (Sony); Chen Lihui (Sony) and Miaofei Mei (Amazon) were welcomed as ROS 2 core maintainers per a January 2021 Discourse announcement.

**Community culture on new ports:** No REP (ROS Enhancement Proposal), roadmap item, or OSRA statement addresses RISC-V. Support for new architectures is entirely community-driven, not officially sanctioned or tested. A forum moderator on the Open Robotics Discourse explicitly stated they did not know the official status of ROS on RISC-V ([Installing ROS2 humble on RISC-V Ubuntu](https://discourse.openrobotics.org/t/installing-ros2-humble-on-risc-v-ubuntu/35988)).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-08-30 | `rmw_cyclonedds`: `-latomic` link fix for RISC-V/GCC merged, backported to foxy and galactic | [ros2/rmw_cyclonedds#332](https://github.com/ros2/rmw_cyclonedds/pull/332) |
| 2022-09 | "Robotics MCU" RISC-V + ROS 2 sub-project announced under the ROS 2 Hardware Acceleration Working Group | [Open Robotics Discourse](https://discourse.openrobotics.org/t/robotics-mcu-a-robotics-microcontroller-unit-mcu-powered-by-risc-v-and-ros-2/27448) |
| 2024-02-08 | Tracking issue filed: Mimick (test-mocking library) blocks riscv64 builds | [ros2/Mimick#30](https://github.com/ros2/Mimick/issues/30) |
| 2024-02-09 | "Add RISC-V 64 Support" PR opened against Mimick, cherry-picks a gnu_hash symbol-lookup fix required for riscv64 binaries | [ros2/Mimick#31](https://github.com/ros2/Mimick/pull/31) |
| 2024-02-13 | Acceleration Robotics + Microchip integrate ROS 2 Humble onto the PolarFire SoC FPGA (Icicle Kit), first RISC-V SoC/FPGA with ROS 2 support, ~60K LOC contributed to the community `ros/meta-ros` Yocto layer (not `ros2/ros2`) | [riscv.org blog](https://riscv.org/blog/integrating-ros-2-with-microchips-polarfire-soc-fpga/) |
| 2024-02-26 | Maintainer opens a throwaway CI-validation PR to run the full ROS 2 CI matrix against the Mimick riscv64 patch | [ros2/mimick_vendor#36](https://github.com/ros2/mimick_vendor/pull/36) |
| 2025-01-29 | Independent community user (LucienMorey) reports running the unmerged Mimick patch in production for approximately 5 months, asks for merge status | [ros2/Mimick#31 comment](https://github.com/ros2/Mimick/pull/31) |
| 2025-03-12 | Maintainer (mjcarroll) states the PR "fell out of the top of my review queue" and proposes resolving conflicts and re-running CI; no further activity recorded since | [ros2/Mimick#31 comment](https://github.com/ros2/Mimick/pull/31) |
| 2026-06-17 | This report's queue entry logged (RISE internal candidate-tracking) | `project-reports/.queue.yml` (this workspace) |

**Key contributors:** ziyao233 (author of the Mimick riscv64 fix, independent contributor), romancardenas (filed the tracking issue, independently built and verified full ROS 2 on riscv64), LucienMorey (independent 5+ month production validation), mjcarroll (Intrinsic.ai, ROS 2 core maintainer and PR assignee), guillaume-pais-siemens (Siemens, authored the merged `rmw_cyclonedds` `-latomic` fix, consistent with Siemens' separately documented `isar-riscv` ROS 2 build effort).

**Is it fully upstream?** No. The only riscv64 fix that has actually merged and shipped in a released ROS 2 distro is the `rmw_cyclonedds` `-latomic` linking fix (2021, backported to foxy/galactic). The blocking dependency for a riscv64 build of ROS 2 as a whole - `ros2/Mimick#31` - remains open and unmerged as of this report, over 2.5 years after submission, despite being externally verified working and CI-validated. There is no dedicated riscv64 tracking issue in `ros2/ros2` itself; the entire effort lives in the `ros2/Mimick` and `ros2/mimick_vendor` dependency repos, which most users would not think to search.

## 3. Upstream Support Tier

ROS 2's formal platform tier policy is documented in **REP 2000**. Tiers are defined as: Tier 1 (continuous CI, prioritized bug fixes), Tier 2 (periodic CI, best-effort fixes), Tier 3 (community-reported only, no formal testing, requires up-to-date install docs). Officially supported architectures across Humble, Iron, Jazzy, Kilted, and Rolling are **amd64, arm64, and arm32 only**. **No RISC-V tier exists in any ROS 2 distribution**, not even Tier 3 ([ros-infrastructure/rep](https://github.com/ros-infrastructure/rep)).

Evidence: no riscv64 CI job exists in any of the four `ros2/ros2` GitHub Actions workflows (read in full - see Section 7); no riscv64 release-blocking gate exists because no riscv64 CI exists to gate; no official riscv64 binaries are published (see Section 8).

**Comparison table: amd64 vs arm64 vs riscv64**

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| REP 2000 tier | Tier 1 | Tier 1/2 (varies by distro) | Not listed |
| CI runner in `ros2/ros2` | `ubuntu-latest` (pixi-lock, pr, mirror workflows) | `ubuntu-24.04-arm` (pixi-lock matrix) | None |
| Jenkins packaging job (`ci.ros2.org`) | `packaging_linux` | `packaging_linux-aarch64` | None |
| Release assets (Lyrical/Jazzy/Humble) | Yes (amd64/x86_64 tarballs) | Yes (aarch64 tarballs) | No |

## 4. Technical Architecture and RISC-V-Specific Subsystems

`ros2/ros2` itself contains no implementation code of any kind - it is an 8-file, ~1,008-line manifest/CI-config repository (`ros2.repos`, four workflow YAML files, three shell scripts, `README.md`). A code search for `#ifdef __riscv repo:ros2/ros2` returns zero results, confirming there are no architecture guards anywhere in the repo, for any architecture, because there is no implementation source to guard. Architecture-specific components (SIMD, crypto, memory allocators) live in ROS 2's constituent dependency repositories, not in `ros2/ros2`.

**Comparison table: amd64 vs arm64 vs riscv64 (at the `ros2/ros2` meta-repo level)**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Implementation source files in `ros2/ros2` | 0 (none exist for any arch) | 0 | 0 |
| CI runner support | Yes | Yes | No |
| Jenkins packaging job | Yes | Yes | No |
| Published release binary | Yes | Yes | No |

The requested per-architecture "hand-tuned/intrinsics/scalar/missing" rating does not meaningfully apply to `ros2/ros2`: what differs by architecture at this level is purely CI/release coverage, not source-code implementation quality. Genuine architecture-specific subsystems (DDS transport, crypto, compression, numerics) are analyzed per-dependency in Section 9.

## 5. Build System, Cross-Compilation, and Toolchain

`ros2/ros2` publishes no riscv64-specific build documentation. The only cross-compilation document in the official documentation source (`ros2/ros2_documentation`, file `source/Developer-Tools/Build/About-Cross-Compilation.rst`) is a generic overview page: it names reasons to cross-compile (machine mismatch, `-mcpu=`/`-mfpu=` tuning, custom filesystems) and points to `docker buildx` for multi-platform images, but contains **no toolchain file, no cmake/configure invocation, no GCC/Clang version numbers, no `-DUSE_X=OFF` flags, and no QEMU instructions**.

No `BUILDING.md`, `INSTALL`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, or `Dockerfile` for riscv64 exists anywhere in `ros2/ros2`. `ros-tooling/cross_compile` (Open Robotics' own deprecated cross-compilation CLI, supporting armhf/aarch64/x86) has zero riscv references and no riscv64 `TargetArch` entry.

**Known build failure and workaround (community-sourced, not officially documented):**
- GCC does not automatically link `libatomic` on RISC-V; `rmw_cyclonedds_cpp` requires it. Fixed and merged: [ros2/rmw_cyclonedds#332](https://github.com/ros2/rmw_cyclonedds/pull/332).
- The `Mimick` test-mocking library's symbol lookup breaks on riscv64 binaries because RISC-V binaries use GNU-hash symbol tables, and Mimick's lookup only supported traditional hash tables. Fix exists but is unmerged: [ros2/Mimick#31](https://github.com/ros2/Mimick/pull/31).
- Community members who have built ROS 2 from source on riscv64 report using QEMU-based Debian sid/Ubuntu riscv64 images with the unmerged Mimick patch applied manually ([Discourse: Installing ROS2 humble on RISC-V Ubuntu](https://discourse.openrobotics.org/t/installing-ros2-humble-on-risc-v-ubuntu/35988)).
- Siemens' `isar-riscv` project documents a Yocto/isar-based build producing ROS 2 Foxy `.deb` packages for riscv64, including QEMU-based image builds: [siemens/isar-riscv ROS2.md](https://github.com/siemens/isar-riscv/blob/main/doc/ROS2.md).

There is no exact, upstream-published, reproducible riscv64 build command sequence for ROS 2.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Official REP 2000 tier | Yes | Yes | No tier |
| CI-validated build | Yes | Yes | No (upstream); yes, unofficially, per community reports |
| CI-validated test suite | Yes | Yes | No |
| Official release binary | Yes | Yes | No |
| DDS middleware (`rmw_cyclonedds`) link correctness | Yes | Yes | Yes (fix merged 2021) |
| DDS middleware (`rmw_fastrtps`) riscv64 CI | Yes | Yes | No riscv64 CI in eProsima Fast-DDS/Fast-CDR (generic C++17, no arch-specific asm) |
| Test infrastructure (Mimick mocking library) | Yes | Yes | No (blocking PR unmerged) |
| Documented cross-compilation path | Yes (generic) | Yes (generic) | No riscv64-specific instructions |

**Functional gaps:** ROS 2 cannot currently be built end-to-end from official, unmodified upstream tooling on riscv64, because the test-mocking dependency (Mimick) fails at the symbol-lookup level on riscv64 binaries and its fix is unmerged. Users who want a working riscv64 build must manually apply the unmerged patch or rely on third-party Yocto (Siemens isar-riscv) or FPGA-integration (Acceleration Robotics/meta-ros) build paths.

**Performance gaps:** Data not available: no quantitative ROS 2 riscv64-vs-arm64 or riscv64-vs-amd64 benchmark data (throughput, latency, CPU%) was found on any channel searched (RISE blog, GitHub, WebSearch). The one qualitative data point available is negative: Acceleration Robotics/PlanV's "Robotics MCU" project found that "the performance obtained in RISC-V soft-core based ROS 2 implementations explored was not bringing much value on top of existing CPU implementations of ROS 2," and the project was subsequently redirected toward an FPGA-based implementation instead ([news.accelerationrobotics.com](https://news.accelerationrobotics.com/acceleration-robotics-planv-robotics-mcu-ros2-riscv/)). No exact figures were recoverable from that source. [NEEDS VERIFICATION - single source, and the source page itself could not be directly fetched in this session (connection reset); the claim rests on a WebSearch-surfaced summary of that page].

**Security hardening gaps:** ROS 2's SROS2 (DDS-Security) crypto backend is OpenSSL, which has active riscv64 support (dedicated ASM AES, GCM via Zbb/Zbc, riscv64 CI) but a flagged open issue: the AES T-table fallback path is not constant-time on hardware lacking the Zkn/Zvkned crypto extensions, which describes most current riscv64 silicon; fix PRs [#31080](https://github.com/openssl/openssl/pull/31080) and [#31082](https://github.com/openssl/openssl/pull/31082) were open as of mid-2026 per `project-reports/openssl.md`. This is a dependency-level gap, not a ROS 2-specific one, but it directly affects SROS2 security on riscv64 hardware.

**NaN / floating-point semantics issues:** Data not available: no RISC-V floating-point/NaN semantics issue specific to ROS 2 was found in any search of `ros2/ros2` or the broader `ros2` GitHub org.

## 7. CI/CD Infrastructure

**No riscv64 CI exists anywhere in `ros2/ros2`.** All four GitHub Actions workflow files were read in full directly from a clone of the repository (HEAD `f4c29669ecba5517fe14d482b8878769078ea91f`, 2026-09-01):

1. **`mirror-rolling-to-master.yaml`** - mirrors the `rolling` branch to `master` on push. `runs-on: ubuntu-latest`. No build/test, no riscv reference.
2. **`pr.yaml`** ("ROS 2 Repos Check") - lints/validates `ros2.repos` YAML on pull requests. `runs-on: ubuntu-latest`. No riscv reference.
3. **`pixi-lock.yaml`** - validates the pixi lockfile solve. Jobs run on `ubuntu-latest`, or on a matrix (`install` job) whose runner is selected by `.github/scripts/pixi-lock-matrix.sh`, which maps `linux-64 -> ubuntu-latest`, `linux-aarch64 -> ubuntu-24.04-arm`, `win-64 -> windows-latest`, `osx-64 -> macos-15-intel`, `osx-arm64 -> macos-latest`, and explicitly errors ("No runner is mapped for platform") for anything else. `pixi.toml` declares `platforms = ["win-64", "linux-64"]` only - even `linux-aarch64` is not an active target today, let alone riscv64.
4. **`release-nightlies.yaml`** - republishes Jenkins (ci.ros2.org) nightly binaries as GitHub Releases, triggered hourly (`schedule`) and by `workflow_dispatch`. `runs-on: ubuntu-latest`. Job names pulled from Jenkins: `packaging_linux`, `packaging_windows`, `packaging_linux-rhel`, `packaging_linux-aarch64` - aarch64, not riscv64. The artifact-naming logic branches only on `aarch64` vs default `amd64`; there is no riscv branch.

A repository-wide, case-insensitive `grep -rni "riscv" .` across the entire `ros2/ros2` working tree returned **zero matches**. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repo. The Jenkins instance at `ci.ros2.org`, referenced by `release-nightlies.yaml` but external to this repo, could not be inspected directly in this session.

No RISE RISC-V Runners are referenced anywhere in `ros2/ros2` or the wider `ros2` GitHub org.

**Comparison table: amd64 vs arm64 vs riscv64**

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions CI runner | `ubuntu-latest` | `ubuntu-24.04-arm` (pixi-lock matrix only) | None |
| Jenkins packaging job (ci.ros2.org) | `packaging_linux` | `packaging_linux-aarch64` | None |
| pixi.toml declared platform | Yes (`linux-64`) | No (not declared, despite CI runner existing) | No |
| RISE runner usage | N/A | N/A | None found |

## 8. Distribution and Release Status

**No official riscv64 binaries exist for ROS 2 on any channel checked.**

- **GitHub Releases:** The three most recent release trains were checked via the public release-asset listing (GitHub API access to `ros2/ros2` is blocked for this session's tooling; verified via the public web UI's `/releases/expanded_assets/<tag>` fragments):
  - `release-lyrical-20260807` ("Lyrical Luth - Patch Release 2"): rhel10-x86_64, ubuntu2604-aarch64, ubuntu2604-x86_64, Windows-AMD64, source archives. No riscv64.
  - `release-jazzy-20260618` ("Jazzy Jalisco - Patch Release 8"): linux-noble-amd64, linux-noble-arm64, rhel9-amd64, source archives. No riscv64.
  - `release-humble-20260220` ("Humble Hawksbill - Patch Release 14"): linux-centos-amd64, linux-jammy-amd64, linux-jammy-arm64, windows-release-amd64, source archives. No riscv64.
- **PyPI:** the package name "ros-2" does not exist on PyPI at all (`https://pypi.org/pypi/ros-2/json` returns HTTP 404, confirmed independently via `https://pypi.org/simple/ros-2/`). This is consistent with ROS 2 not being pip-distributed upstream, not a riscv64-specific gap.
- **RISE GitLab wheel mirror:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/ros-2/` redirects to the same 404 PyPI page. No package found.
- **Ubuntu 26.04 (resolute):** `packages.ubuntu.com` search for "ros2" and "ros-2" (name search, suite=resolute) returns zero results - "Sorry, your search gave no results." No ROS 2 package exists under any plausible name in this suite, on any architecture, not merely riscv64.
- **Arch Linux RISC-V (archriscv.felixc.at):** no ROS 2 package found for queries "ros2" or "ros 2".
- **Ubuntu package graph (project-graph MCP SPARQL query):** could not be verified - the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) on every attempt across multiple research passes this session. This is a tooling failure and should be treated as unknown/unchecked, not as confirming absence, though the direct `packages.ubuntu.com` search above independently confirms no ROS 2 package exists in resolute.

**What a user must do to get a working binary today:** There is no path to an official riscv64 binary. To run ROS 2 on riscv64, a user must either (a) build from source, manually applying the unmerged `ros2/Mimick#31` patch to work around the test-mocking library's symbol-lookup failure, following community-documented steps on the Open Robotics Discourse, or (b) use a third-party build pipeline such as Siemens' `isar-riscv` Yocto layer (produces Foxy `.deb` packages) or Acceleration Robotics' `meta-ros` Yocto integration for the Microchip PolarFire SoC FPGA. Neither is an Open Robotics-sanctioned release channel.

## 9. Dependencies

`ros2/ros2` has no single build manifest; dependencies were identified by parsing `ros2.repos` (rolling branch, commit `f4c2966`) plus `package.xml` files in `ros2/rosbag2`, focused on SIMD/numerics, crypto, compression, and memory-allocator categories (ROS 2 core has no JIT backends).

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| eProsima Fast-DDS | Default RMW middleware (`rmw_fastrtps`), DDS transport | No riscv64 CI job in ~30 workflow files (ubuntu/mac/windows only); generic C++17/CMake | Not exercised on riscv64 in CI | No official riscv64 binaries | 0 open riscv64 issues found |
| eProsima Fast-CDR | CDR wire-format serialization for Fast-DDS | No riscv CI workflow | Not exercised | Built alongside Fast-DDS | 0 riscv64 issues |
| eProsima foonathan_memory_vendor | Vendored pool/arena allocator for Fast-DDS internals | Portable C++, no riscv CI | Not exercised | Source-vendored only | 0 riscv64 issues (1 unrelated QNX hit) |
| Eclipse Cyclone DDS | Alternative RMW middleware (`rmw_cyclonedds`), default in several distros | No riscv CI job | Not exercised | No official riscv64 release binaries | 0 riscv64 issues (1 unrelated ARM64 hit); note the ROS-side `-latomic` fix ([#332](https://github.com/ros2/rmw_cyclonedds/pull/332)) is on the ROS wrapper, not Cyclone DDS itself |
| Eclipse iceoryx | Zero-copy shared-memory transport for large-message intra-host performance | No riscv job in any workflow | Not exercised | No riscv64 release artifacts | 0 riscv64 issues |
| Eigen (`ros2/eigen3_cmake_module`) | Header-only linear-algebra/SIMD numerics (tf2, perception, planning) | RVV1.0 backend merged to master 2025-11-20, requires opt-in `-DEIGEN_RISCV64_USE_RVV10`, not auto-detected | Native SpacemiT K3 CI runner, but `allow_failure: true` (non-gating) | Not shipped in any release (3.4.1, 5.0.1 predate the RVV work) | GCC-14 vector-bits flag bug fixed; missing tail-optimization (issue #3086, ~2x slowdown estimated). Full detail: `project-reports/eigen.md` |
| TLSF (`ros2/tlsf`) | Real-time deterministic allocator for rcl/rclcpp | No CI files at all in the repo | Not independently tested | Source-only | 0 riscv64 issues |
| OpenSSL | DDS-Security crypto backend for SROS2 | Active riscv64 support: ASM AES, GCM via Zbb/Zbc, capability detection, riscv64 CI (FIPS excluded) | Tested in upstream CI on native riscv64 runners; occasional flakes (#30880) | Regular tagged releases include riscv64-capable source | 66 riscv64-tagged issues. Open: musl extension detection (#28118), SHA256 perf (#28664), Zknd/Zkne AES requirement (#25334). **Critical: AES T-table fallback not constant-time on most current riscv64 silicon**, fixes open (#31080/#31082). Full detail: `project-reports/openssl.md` |
| zstd | Compression for `rosbag2_compression_zstd` and MCAP storage | Best-effort community support; no dedicated riscv64 CI runner | Build-time checks only | No riscv64 prebuilt binaries or PyPI wheel | 5 riscv64 issues: open RFEs for RVV-accelerated XXH3 (#4471) and unaligned access (#4546). Full detail: `project-reports/zstd.md` |
| LZ4 | Compression for `rosbag2` | Functionally complete per existing report | Passes full test suite under QEMU | Ships in major distros; no PyPI wheel | 1 closed riscv64 issue, no blocker. Full detail: `project-reports/lz4.md` |
| yaml-cpp (`ros2/yaml_cpp_vendor`) | YAML parsing for parameter/launch files | No riscv-specific code paths (pure portable C++) | Not independently verified | Source-vendored | 0 riscv64 issues |
| libyaml (`ros2/libyaml_vendor`) | C YAML parser for `rcl_yaml_param_parser` | Pure portable C, no arch-specific code | Not independently verified | Source-vendored; packaged generally as `libyaml-dev` | 0 riscv64 issues |
| spdlog (`ros2/spdlog_vendor`) | Logging backend for `rcl_logging_spdlog` | No riscv CI; portable C++ | Not independently verified | Source-vendored | 0 riscv64 issues (1 unrelated ARM64 CI hit) |
| MCAP (`foxglove/mcap`, via `mcap_vendor`) | ROS 2 bag storage format | No riscv CI found | Not independently verified | No riscv64 release binaries found | 0 riscv64 issues |

**Deep-dive: critical dependencies with SIMD/crypto/numerics content**

- **OpenSSL** has the deepest and most actively maintained riscv64 support of any ROS 2 dependency, but carries a real open security gap: the AES fallback path used on hardware lacking Zkn/Zvkned crypto extensions (most current riscv64 silicon) is not constant-time, directly relevant to SROS2's DDS-Security encryption/authentication plugins. See `project-reports/openssl.md` for full detail.
- **Eigen** has real RVV1.0 work merged to master but it is unreleased, opt-in, and non-release-gating (`allow_failure: true`); no ROS 2 release currently benefits from it since ROS 2 depends on tagged Eigen releases that predate the RVV backend. See `project-reports/eigen.md`.
- **The DDS middleware stack itself (Fast-DDS, Fast-CDR, Cyclone DDS, iceoryx, foonathan::memory, TLSF) shows no evidence of riscv64-specific testing, CI, or reported issues at all.** This most likely means these portable-C++ libraries build fine as generic code, but this is genuinely unverified upstream - a gap worth flagging since none of these are currently tracked as standalone projects in this workspace's `projects.yml`.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [ros2/Mimick#31](https://github.com/ros2/Mimick/pull/31) | Add RISC-V 64 Support | Open, unmerged since 2024-02-09 | Blocking (test infrastructure) | Externally verified working (romancardenas built full ROS 2; LucienMorey ran 5+ months in production); CI-validated via #36; blocked purely on maintainer review bandwidth and merge conflicts, not technical objection |
| [ros2/Mimick#30](https://github.com/ros2/Mimick/issues/30) | Support for RISC-V 64 | Open, tracking issue since 2024-02-08 | Blocking (tracks #31) | Requests merge of #31 to unblock riscv64 builds |
| [ros2/mimick_vendor#36](https://github.com/ros2/mimick_vendor/pull/36) | Update SHA to test ros2/Mimick#31 | Closed (throwaway CI-validation, not a permanent change) | N/A | Confirms #31 passes ROS 2's full CI matrix (Linux, Linux-aarch64, Windows) on other platforms |
| [ros2/rmw_cyclonedds#332](https://github.com/ros2/rmw_cyclonedds/pull/332) | add -latomic for RISC-V | Merged 2021-08-30, backported to foxy/galactic | Correctness (build-blocking without fix) | The one riscv64 fix that has actually shipped in a released ROS 2 distro |

**Correctness bugs:** No open, RISC-V-specific correctness or performance bug is on file against `ros2/ros2` itself - exhaustive search (`riscv64 performance`, `riscv nan floating`, `riscv`, `riscv64 bug`, all scoped to `repo:ros2/ros2`) returned zero genuine hits (two apparent matches, #260 and #1059, are false positives on "arch64" semantic matching for unrelated ARM issues). The `Mimick#31` gap is a build/test-infrastructure blocker, not a runtime correctness bug in ROS 2 itself.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer or PMC member has stated a technical objection to RISC-V support. The blocker is explicitly framed by the assignee as a bandwidth/scheduling issue: "this fell out of the top of my review queue. I think the best thing here is to resolve the conflicts, then I can bump the SHA in the vendor package and run it through CI again" ([ros2/Mimick#31](https://github.com/ros2/Mimick/pull/31), comment by mjcarroll, 2025-03-12).

**Technical blockers:**
1. `ros2/Mimick#31` has merge conflicts requiring a rebase against upstream Mimick before it can be merged.
2. Even once Mimick is fixed, no CI or release infrastructure exists in `ros2/ros2` to build, test, or publish riscv64 artifacts - merging Mimick unblocks source builds only, not an official binary release path.
3. No REP 2000 tier entry exists for RISC-V in any distribution; even Tier 3 (community-reported, install-docs-only) has not been formally added, despite the bar being low enough to be achievable per the community discussion.

**Organizational blockers:** OSRA/TGC/PMC governance has no stated roadmap item for RISC-V. No OSRA sponsor tier member (Intrinsic/Google, NVIDIA, Qualcomm, Apex.AI, Zettascale, Clearpath, Ekumen, eProsima, PickNik, Canonical, Bosch, ROS-Industrial) has been observed sponsoring or funding riscv64 work in `ros2/ros2` or its core dependency repos, based on the sources reviewed for this report.

**Acceptance probability:** The path to a merged fix for the sole hard blocker (`Mimick#31`) is narrow and low-effort - a rebase plus a re-run of existing CI - and has already been independently validated by two community members over an extended period. This suggests high technical acceptance probability if maintainer time is allocated, but there has been no forward motion since March 12, 2025 (over 18 months as of this report), and no organizational commitment to prioritize it exists.

## 13. Readiness Assessment

- **Color:** orange (plain Step-1 "no upstream riscv64 CI"; the distribution floor does not apply because no distribution ships any ROS 2 package under any name, so there is nothing to upgrade)
- **Release provider:** none (no riscv64 artifact is published by upstream, RISE, any Linux distribution, or any consumable third-party channel; Siemens' `isar-riscv` is a Yocto build recipe a user must build themselves, not a published binary release)
- **Justification:** All four GitHub Actions workflows in [ros2/ros2](https://github.com/ros2/ros2) were read in full and contain zero riscv64 references, and `pixi.toml` declares build platforms as `["win-64", "linux-64"]` only. The three most recent release trains (Lyrical, Jazzy, Humble) ship no riscv64 asset ([release pages](https://github.com/ros2/ros2/releases)), and [REP 2000](https://github.com/ros-infrastructure/rep) lists only amd64, arm64, and arm32 as supported architectures across all current distributions, with no RISC-V tier at any level.
- **Pending work that could change the grade:** merging [ros2/Mimick#31](https://github.com/ros2/Mimick/pull/31) (rebase + CI re-run, technically validated and independently production-tested) would unblock riscv64 source builds and is the single highest-leverage pending item. No RISE Project involvement of any kind was found - no blog posts, no wheel-builder entries, no dedicated repository, no funded work, no runner usage anywhere in the `riseproject-dev` GitHub org or on `riseproject.dev`. ROS 2 sits only on RISE's internal "to research" queue (`project-reports/.queue.yml`) with no prior report and no funded engagement to date.

## 14. Investment Analysis

**What RISE has already done or funded here: nothing.** Exhaustive checks of the RISE blog (36 posts enumerated via sitemap, none mention ROS/ROS 2/robotics), the RISE Python wheel builder (89 packages listed, no ROS 2/ros2/micro-ros entry), the `riseproject-dev` GitHub org (25 repos, none dedicated to ROS 2/robotics; org-wide code search returns only this workspace's own internal tracking files), and `riseproject.dev/members` (no Open Robotics, OSRA, or ROS-affiliated organization listed) all confirm zero RISE engagement. This matches the identical conclusion independently reached for the adjacent micro-ROS project in `project-reports/micro-ros.md` (readiness: orange), which states plainly: "What RISE has already done or funded here: nothing." All investment items below represent genuinely unfunded, un-started work.

### 14.1 Functional Enablement

The highest-leverage, lowest-effort item is completing the one known blocking dependency fix: rebasing and merging [ros2/Mimick#31](https://github.com/ros2/Mimick/pull/31), which is already written, externally validated (two independent community users, one with 5+ months of production use), and CI-validated on other platforms via [ros2/mimick_vendor#36](https://github.com/ros2/mimick_vendor/pull/36). This requires upstream maintainer engagement (the PR is not RISE's to merge unilaterally), but RISE could fund or directly contribute the rebase work and actively engage `mjcarroll`/the ROS PMC to prioritize review. Beyond Mimick, a full riscv64 build has never been validated end-to-end against official ROS 2 CI - establishing that baseline (build + core test suite for a representative distro, e.g. rolling or jazzy) is unstarted work.

### 14.2 Performance Optimization

Not applicable as a primary investment area yet - functional enablement is the prerequisite. Downstream numerics (Eigen RVV1.0, unreleased/opt-in) and crypto (OpenSSL, active but with an open constant-time gap) are tracked separately in their own project reports and are not ROS 2-specific investment items. The one available signal on ROS 2 RISC-V performance is negative and unquantified (Acceleration Robotics/PlanV's soft-core conclusion, Section 6) - before investing in ROS 2-specific performance work, a first step would be establishing real benchmark numbers, since none currently exist publicly.

### 14.3 CI/CD Infrastructure

No riscv64 CI exists in `ros2/ros2` at all. Standing up CI (build plus test) for even one distro/branch (e.g. rolling) on riscv64 - potentially using RISE RISC-V Runners - would be new, unfunded infrastructure work, contingent on the Mimick blocker being resolved first (otherwise the test phase cannot pass). This is a multi-repo effort in practice, since `ros2/ros2`'s own CI (pixi-lock, repos-check) does not exercise package builds at all; the actual build/test CI lives in each constituent package repo and ultimately in the Jenkins instance at `ci.ros2.org`, which was not inspectable in this session.

### 14.4 Ecosystem Enablement

Section 10 is omitted for this report: ROS 2 is a middleware/runtime framework, not a package ecosystem with a large dependent-package graph in the sense (Python/npm/Maven/Kubernetes-operator packages) that Section 10 is scoped to cover.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Rebase and drive [ros2/Mimick#31](https://github.com/ros2/Mimick/pull/31) to merge (upstream engagement + rebase) | 1-2 | RISE-funded contributor + upstream (mjcarroll/ROS PMC) | Critical |
| Functional | Validate end-to-end riscv64 build of a representative ROS 2 distro (rolling) post-Mimick-merge, against official CI tooling | 2-3 | RISE-funded contributor | High |
| CI/CD | Stand up riscv64 CI (build + test) for `ros2/ros2` constituent core packages, potentially using RISE RISC-V Runners | 3-5 | RISE-funded contributor + upstream review | High |
| CI/CD | Investigate and, if feasible, propose adding riscv64 as a Tier 3 REP 2000 platform once a working build exists | 1 | RISE-funded contributor + upstream (ROS PMC) | Medium |
| Performance | Establish baseline ROS 2-on-riscv64 benchmark data (none currently exists publicly) | 2 | RISE-funded contributor | Medium |
| Dependency | Confirm/establish riscv64 CI status for the untested-but-unflagged DDS middleware stack (Fast-DDS, Fast-CDR, Cyclone DDS, iceoryx, foonathan::memory, TLSF) - none currently tracked in `projects.yml` | 1-2 | RISE-funded contributor | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [ros2/ros2 GitHub repository](https://github.com/ros2/ros2)
- [ros2/ros2 GitHub Actions workflows](https://github.com/ros2/ros2/tree/rolling/.github/workflows)
- [ros2/ros2 pixi.toml](https://github.com/ros2/ros2/blob/rolling/pixi.toml)
- [ros2/ros2 ros2.repos manifest](https://github.com/ros2/ros2/blob/rolling/ros2.repos)
- [ros2/ros2 GitHub Releases](https://github.com/ros2/ros2/releases)
- [ros2/Mimick#31 - Add RISC-V 64 Support](https://github.com/ros2/Mimick/pull/31)
- [ros2/Mimick#30 - Support for RISC-V 64](https://github.com/ros2/Mimick/issues/30)
- [ros2/mimick_vendor#36 - Update SHA to test ros2/Mimick#31](https://github.com/ros2/mimick_vendor/pull/36)
- [ros2/rmw_cyclonedds#332 - add -latomic for RISC-V](https://github.com/ros2/rmw_cyclonedds/pull/332)
- [ros2/ros2_documentation - About-Cross-Compilation.rst](https://github.com/ros2/ros2_documentation)
- [ros-infrastructure/rep (REP 2000, platform tier policy)](https://github.com/ros-infrastructure/rep)
- [Open Robotics Discourse - Installing ROS2 humble on RISC-V Ubuntu](https://discourse.openrobotics.org/t/installing-ros2-humble-on-risc-v-ubuntu/35988)
- [Open Robotics Discourse - Robotics MCU: a Robotics Microcontroller Unit powered by RISC-V and ROS 2](https://discourse.openrobotics.org/t/robotics-mcu-a-robotics-microcontroller-unit-mcu-powered-by-risc-v-and-ros-2/27448)
- [RISC-V International blog - Integrating ROS 2 with Microchip's PolarFire SoC FPGA](https://riscv.org/blog/integrating-ros-2-with-microchips-polarfire-soc-fpga/)
- [Siemens isar-riscv - ROS2.md](https://github.com/siemens/isar-riscv/blob/main/doc/ROS2.md)
- [Acceleration Robotics - A robotics microcontroller unit (MCU) with ROS 2 and RISC-V](https://news.accelerationrobotics.com/acceleration-robotics-planv-robotics-mcu-ros2-riscv/) [NEEDS VERIFICATION - source page unreachable directly in this session, connection reset; content relayed via WebSearch summary only]
- [PyPI - ros-2 package JSON (404, package does not exist)](https://pypi.org/pypi/ros-2/json)
- [Ubuntu packages.ubuntu.com - resolute suite search](https://packages.ubuntu.com/search?keywords=ros2&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port search](https://archriscv.felixc.at/?q=ros2)
- [RISE Project blog index (sitemap)](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- `project-reports/eigen.md` (this workspace)
- `project-reports/openssl.md` (this workspace)
- `project-reports/zstd.md` (this workspace)
- `project-reports/lz4.md` (this workspace)
- `project-reports/micro-ros.md` (this workspace, adjacent project corroboration)
