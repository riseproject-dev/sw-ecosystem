---
title: Autoware
parent: Project Reports
color: orange
---

# Autoware

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Autoware<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Autoware is described by the Autoware Foundation as "the world's leading open-source software project for autonomous driving," built on ROS 2. It provides the full autonomous-vehicle software stack: perception (camera/LiDAR DNN inference), localization, planning, and control.

**License:** Apache License 2.0, copyright 2021 The Autoware Foundation, confirmed from `LICENSE`/`NOTICE` in [autowarefoundation/autoware](https://github.com/autowarefoundation/autoware).

**Governance:** The Autoware Foundation is a nonprofit steward with a tiered membership structure feeding a Technical Steering Committee (TSC), chaired by Ryohsuke Mitsudome (TIER IV), a separate Strategic Planning Committee (SPC) chaired by Johannes Betz (TU Munich), and a Board of Directors chaired by Yang Zhang. Membership tiers: Premium (23 members, one TSC voting seat each), Industry & Government (41), Academic & Non-Profit (16), Affiliated Organizations (10), Centers of Excellence (25). No formal, publicly documented process for approving new platform/architecture ports was found on [autoware.org](https://autoware.org/).

**Corporate sponsors / maintainers:**
- **TIER IV** is the founding/originating company and dominates `.github/CODEOWNERS` and the TSC chair.
- **Autoware Foundation staff** (Mete Fatih Cirit, `mfc@autoware.org`) is the single largest recent committer (97 of the last 200 commits) and a CODEOWNERS entry.
- **Renesas Electronics** is the most recently announced Premium member (per the autoware.org homepage, dated Sept 2026), joining "to accelerate production-ready end-to-end AI for ADAS/AD."
- Other TSC/technology-partner member companies: AMD, Arm, AWS, Hesai Technology, NXP, Astemo, Hitachi, Autocore, AuveTech, Inceptio Technology, ITRI, MORAI, Multicoreware, NATIX, Neolix, PopcornSAR, Robotec.AI, TREEZE, The CAR Lab, plus academic partners (University of Tokyo, Nagoya University, MIT-affiliated Indy Autonomous Challenge).
- No RISC-V silicon vendor is a Premium or TSC member. RISC-V International (via SiFive's Krste Asanovic) is listed only as a member/architecture-partner organization of the Foundation's governance alliance - a business/governance relationship, not a technical contribution.

**Community culture on new ports:** No PLATFORMS.md/SUPPORT.md file exists in the repository, and `.github/CODEOWNERS` has no platform-tier structure. Official docs ([docs.autoware.org/main/installation](https://docs.autoware.org/main/installation)) state supported CPU architectures are only amd64 and arm64. Even the far more mature arm64 target is being actively pared back for cost/complexity (see Section 3), suggesting a resource-constrained, amd64-first testing posture that a hypothetical RISC-V port would face even more acutely.

## 2. Port History and Upstreaming Timeline

No RISC-V port history exists. Exhaustive search of GitHub Issues, Pull Requests, commits, and code search across `autowarefoundation/autoware` and the entire `autowarefoundation` GitHub organization returned zero genuine RISC-V references.

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V-related issue, PR, or commit has ever been opened | [search_issues/search_pull_requests/search_commits, 0 results](https://github.com/autowarefoundation/autoware) |
| N/A | No master tracking issue for a riscv64 port exists | Confirmed by exhaustive issue/PR search, org-wide |

The only lexical hit across all searches was PR [#1982 "crossbuild dockerhub"](https://github.com/autowarefoundation/autoware/pull/1982) (closed 2019-05-20), a DockerHub automated-build-hook PR for the ARM/armhf era. Its title, body, and full diff contain zero occurrences of "riscv" - it is a search-index false positive (matched on "riscv64" tokenization artifacts), not a genuine RISC-V reference, and is excluded from any RISC-V port history.

**Key contributors:** None - there is no RISC-V port effort to attribute to any contributor or organization.

**Is it fully upstream?** Not applicable - there is nothing upstream to be "fully" or "partially" merged. A RISC-V port does not exist in any form (no branch, no draft PR, no design document found).

## 3. Upstream Support Tier

**Formal tier policy:** None found. No document defines a tier system for architecture support; official docs simply list amd64 and arm64 as the supported CPU architectures ([docs.autoware.org/main/installation](https://docs.autoware.org/main/installation)).

**Evidence (CI, release-blocking, official binaries):**
- CI: the docker build pipeline (`docker-build-and-push.yaml` -> `docker-build-pipeline.yaml` -> `docker-build.yaml` -> `docker-manifest.yaml`) builds and pushes images for exactly two platforms: `amd64` (`runs-on: ubuntu-24.04`) and `arm64` (`runs-on: ubuntu-24.04-arm`, a native Arm runner - no QEMU/`docker/setup-qemu-action` used anywhere).
- Release-blocking: arm64 CI is itself being trimmed for cost/complexity - PR #7306 "trim the PR matrix to the amd64 main legs" and `autoware_core` PR #636 (2025-11-26) "Add Jazzy Support to GitHub Actions Workflows (Excluding ARM64)" both show arm64 losing coverage even as a second-class target.
- Official binaries: only Docker images for amd64/arm64 are pushed via the pipeline above; no PyPI, no Ubuntu/Debian, no Arch package exists for Autoware at all (see Section 8).

**Comparison table:**

| Architecture | CI builds | CI tests | Native or QEMU | Official release artifact |
|---|---|---|---|---|
| amd64 | yes | yes | native (`ubuntu-24.04`) | Docker image (via docker-manifest.yaml) |
| arm64 | yes (being trimmed) | yes | native (`ubuntu-24.04-arm`) | Docker image (via docker-manifest.yaml) |
| riscv64 | no | no | N/A - no CI target exists | none |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Autoware itself (`autowarefoundation/autoware`) is a thin meta-repo (Ansible playbooks + Dockerfiles + `.repos` manifests, no compiled code at the top level). The actual compiled/architecture-specific code lives in the ~150+ downstream packages pulled via `repositories/autoware.repos` (primarily `autowarefoundation/autoware_universe` and `autowarefoundation/autoware_core`), both of which returned zero RISC-V hits under exhaustive code search (`riscv`, `riscv64`, `rvv`, `RVV`, `__riscv`, `vfloat32m1_t`, `zba` all returned 0 matches).

Autoware itself contains no JIT, no hand-written SIMD, and no RISC-V/arm64/amd64 assembly of its own. Its architecture-sensitivity comes entirely through its dependency tree:

| Component | Role | riscv64 implementation exists | ISA extensions | Quality |
|---|---|---|---|---|
| CUDA/TensorRT DNN inference (perception stack: `autoware_lidar_centerpoint`, `autoware_tensorrt_yolox`, `autoware_bevfusion`, etc.) | JIT GPU-kernel compilation for nearly every DNN perception node | No - NVIDIA ships no riscv64 CUDA/TensorRT target at all | N/A (closed-source vendor toolkit) | missing |
| Eigen3 (via OpenCV/PCL/planning/control numerics) | Linear algebra core | Header-only, architecture-independent by design, but absent from the Ubuntu 26.04 riscv64 package graph [NEEDS VERIFICATION] | N/A (portable C++ templates) | scalar/portable |
| OpenCV (camera perception, yabloc localization) | SIMD/JIT dispatch | Yes - RVV universal-intrinsics backend since 2021-22 | RVV | 2 open riscv64/RVV accuracy regressions on the 5.x branch (issues #27279, #27281) - see Section 9 |
| PCL (NDT scan matcher, ground segmentation) | SIMD numerics | Scalar fallback works; SSE/AVX-to-RVV migration of `sample_consensus::countWithinDistance` not yet merged (issue #6385) | RVV (incomplete) | scalar fallback, SIMD migration in progress |

**Comparison table (perception DNN inference, the dominant architecture-specific subsystem):**

| Architecture | GPU inference backend | Status |
|---|---|---|
| amd64 | NVIDIA CUDA/TensorRT | full - primary target |
| arm64 | NVIDIA CUDA/TensorRT (Jetson) | full - GPU-vendor-backed embedded target |
| riscv64 | none | missing - no RISC-V GPU accelerator ecosystem equivalent to Jetson exists |

Since the DNN perception stack has no CPU-only fallback path in Autoware, this is the single largest structural blocker to any RISC-V port, independent of whether the rest of the codebase (planning, control, localization, general C++) would compile.

## 5. Build System, Cross-Compilation, and Toolchain

Autoware's top-level repo contains no `CMakeLists.txt`, no `cmake/` directory, and no `BUILDING.md`/cross-compilation doc - actual CMake logic lives in the downstream `autoware_universe`/`autoware_core` repos, which also returned zero riscv hits.

**Toolchain:** No dedicated toolchain file or explicit compiler-version pin exists. The build uses whatever compiler ships in the official ROS Docker base image (`ros:${ROS_DISTRO}-ros-base`, distros `humble`/`jazzy`), plus `ccache` wired in via the `build_tools` Ansible role (`ansible/roles/build_tools/tasks/main.yaml`). Since official `ros:*-ros-base` images are themselves published only for `linux/amd64` and `linux/arm64`, **there is no upstream ROS base image for riscv64 to build from in the first place** - this is the root build-system blocker, more fundamental than any single dependency's CMake flags.

**Dockerfiles:** `docker/base.Dockerfile`, `docker/base-cuda.Dockerfile`, `docker/core.Dockerfile`, `docker/universe.Dockerfile`, `docker/universe-cuda.Dockerfile` - all four target only amd64/arm64 ROS base images; no `--platform=linux/riscv64` anywhere.

**QEMU usage:** None. Cross-arch CI builds use native `ubuntu-24.04-arm` GitHub-hosted runners for arm64, not QEMU emulation, and there is no riscv64 equivalent runner in use.

**Known build failures:** Not applicable - no riscv64 build has ever been attempted in CI, so there is no failure log to cite. A build would first require a riscv64 ROS base image, which does not exist upstream.

**`-DUSE_X=OFF` flags for riscv64:** None found - no architecture-conditional CMake options exist anywhere searched (they would live in individual `autoware_universe`/`autoware_core` package `CMakeLists.txt` files, none of which contain riscv references).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| ROS 2 base image availability | yes (`ros:*-ros-base`) | yes (`ros:*-ros-base`) | no upstream image |
| CUDA/TensorRT DNN perception | yes | yes (Jetson) | no vendor support at all |
| Docker image published | yes | yes | no |
| CI build | yes | yes | no |
| CI test execution | yes | yes | no |
| OpenCV RVV backend (dependency) | n/a (uses AVX/SSE) | n/a (uses NEON) | yes, but 2 open accuracy regressions (#27279, #27281) |
| PCL SIMD (dependency) | AVX/SSE | NEON | scalar fallback only (RVV migration incomplete, issue #6385) |

**Functional gaps:** The entire camera/LiDAR DNN perception stack (centerpoint, YOLOX, BEVFusion, StreamPETR, PTv3, BEVFormer/BEVDet, VAD) cannot run at all on riscv64 - there is no CPU-only fallback path in Autoware's architecture, and NVIDIA publishes no riscv64 CUDA/TensorRT target.

**Performance gaps:** Not measurable - no riscv64 build of Autoware or its dependency stack has been produced to benchmark. Data not available: no benchmark comparing Autoware on riscv64 vs arm64/amd64 was found anywhere (GitHub, web search, RISE Project blog).

**Security hardening gaps:** Data not available: no riscv64-specific security hardening documentation or issue was found for Autoware.

**NaN / floating-point semantics issues:** Data not available: targeted search for "riscv nan floating" issues in `autowarefoundation/autoware` and `autowarefoundation/autoware_universe` returned 0 results.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist? No.** Verified by reading all 29 files in `.github/workflows/` plus `.github/actions/free-disk-space/action.yaml`, `.github/sync-files.yaml`, and root `.webauto-ci.yaml`, and confirming the absence of `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` anywhere in the repository. Independently corroborated via GitHub code search (`riscv repo:autowarefoundation/autoware` -> 0 results; sanity-checked against a working `arm64 repo:autowarefoundation/autoware path:.github/workflows` query that correctly returned 8 real hits, confirming the search index is not silently failing).

**RISE runners?** No - no reference to `riseproject-dev` or RISE runner labels anywhere in the workflows.

**Hardware used:** amd64 CI runs on `ubuntu-24.04` (GitHub-hosted); arm64 CI runs on `ubuntu-24.04-arm` (GitHub-hosted, native Arm silicon, no QEMU).

**Comparison table:**

| Architecture | CI exists | Build step | Test step | Runner type | Release-blocking |
|---|---|---|---|---|---|
| amd64 | yes | yes | yes | native (`ubuntu-24.04`) | yes |
| arm64 | yes | yes | yes | native (`ubuntu-24.04-arm`) | yes (but coverage being trimmed - PR #7306) |
| riscv64 | no | no | no | none | no |

## 8. Distribution and Release Status

**Official binaries for riscv64:** None found across every channel checked.

- **GitHub Releases:** Most recent releases are 1.9.0 (2024-07-16), 1.8.0 (2024-05-04), 1.7.1 (2024-02-18), 1.7.0 (2024-02-17), 1.6.0 (2024-02-03). The [1.9.0 release](https://github.com/autowarefoundation/autoware/releases/tag/1.9.0) carries exactly two assets - `1.9.0.zip` and `1.9.0.tar.gz` - GitHub's auto-generated source archives. There are no custom-uploaded binaries for any architecture, riscv64 included. Confirmed independently via the `expanded_assets` endpoint.
- **PyPI:** `https://pypi.org/pypi/autoware/json` returns HTTP 404 - no package named `autoware` exists on PyPI at all.
- **Ubuntu 26.04 (resolute):** Both the project graph database query (0 bindings for `autoware`/`python3-autoware`/`libautoware` on riscv64) and a live search on [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=Autoware&suite=resolute&searchon=names&section=all) ("Sorry, your search gave no results") confirm no `autoware` package exists in Ubuntu for any architecture.
- **RISE wheel builder (GitLab):** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/autoware/` redirects to the (404-ing) PyPI URL - no `autoware` package published there.
- **Arch Linux RISC-V (archriscv.felixc.at):** No package listing containing "autoware"; `/packages/` path returned HTTP 404.

**What must a user do to get a working binary?** There is no path to a working Autoware binary on riscv64 today. A user would need to: (1) build or obtain a riscv64 ROS 2 base image (none published upstream), (2) verify/patch the entire `autoware_universe`/`autoware_core` dependency tree builds on riscv64, and (3) solve the CUDA/TensorRT perception-stack dependency, for which no riscv64 target exists from NVIDIA at any layer - meaning full DNN-based perception would be unavailable regardless of build success elsewhere.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Eigen3 | Numerics - linear algebra core (control, planning, localization, perception) | Header-only, architecture-independent by design, but absent from the Ubuntu 26.04 riscv64 package graph (0 rows for `libeigen3-dev`) [NEEDS VERIFICATION] | No riscv64-tagged issues found | Not shipped for riscv64 in Ubuntu 26.04 per graph query - likely an archive/buildd gap rather than a technical blocker [NEEDS VERIFICATION] | See project-reports/eigen.md |
| OpenCV | SIMD/JIT - camera perception, yabloc visual localization | Yes - packaged in Ubuntu 26.04 riscv64 (resolute) | RVV universal-intrinsics backend since 2021-22; QEMU RISC-V CI since 2023-10; 2 open riscv64/RVV accuracy regressions on the 5.x branch (Remap #27279, WarpPerspective #27281), plus open G-API failure #19844 | Shipped in Ubuntu 26.04 riscv64 | See project-reports/opencv.md (readiness: blue/partial) |
| PCL | SIMD/numerics - NDT scan matcher, ground segmentation, clustering | Yes - packaged in Ubuntu 26.04 riscv64 (resolute) | Builds (scalar fallback); open issue #6385 tracks SSE/AVX-to-RVV migration of `sample_consensus::countWithinDistance`, not yet merged | Shipped in Ubuntu 26.04 riscv64 | Not in projects.yml, no existing report |
| Boost | General C++ utility | Yes - packaged in Ubuntu 26.04 riscv64 | Mature/portable, no riscv64 issues found | Shipped | In projects.yml, no report file yet |
| CUDA Toolkit / TensorRT (NVIDIA) | JIT GPU-kernel/inference compilation - hard dependency of nearly every DNN perception node | No - `nvidia-cuda-toolkit` absent from Ubuntu 26.04 riscv64 (0 rows) | 0 riscv64-tagged issues (core toolkit is closed source, not on GitHub) | Not released for riscv64 by NVIDIA at all - no riscv64 target exists in NVIDIA's platform matrix | Largest structural gap; in projects.yml as "CUDA" but no report file exists yet |
| OSQP | Numerics - QP solver for planning/control | N/A - source-vendored (`osqp_vendor`), no Ubuntu package for any architecture | 0 riscv64-tagged issues - untested rather than known-broken | N/A (source-vendored regardless of arch) | Not gated by Ubuntu archive; not in projects.yml |
| Sophus | Numerics - Lie-group math (header-only, built on Eigen), used by yabloc localization | N/A - source-vendored, no Ubuntu package for any arch | 0 riscv64-tagged issues | N/A (source-vendored) | Inherits Eigen's riscv64 status; not in projects.yml |
| fmt | Formatting utility | Yes - packaged in Ubuntu 26.04 riscv64 | No issues found | Shipped | Not in projects.yml |
| yaml-cpp | Parameter/config parsing | Yes - packaged in Ubuntu 26.04 riscv64 | - | Shipped | Not in projects.yml |
| GeographicLib | Numerics - geodesy/coordinate conversions (localization) | Yes - packaged in Ubuntu 26.04 riscv64 | - | Shipped | Not in projects.yml |
| zlib / zstd / lz4 | Compression - rosbag2 storage, PCL/OpenCV codecs (transitive) | Yes - packaged in Ubuntu 26.04 riscv64 | - | Shipped | See project-reports/zlib.md, project-reports/zstd.md, project-reports/lz4.md |

**Deep-dive on critical dependencies:**

- **CUDA/TensorRT** is the dominant blocker. Autoware's perception stack is built almost entirely around NVIDIA GPU inference with no CPU fallback; since NVIDIA ships no riscv64 CUDA/TensorRT at all, this is a vendor-ecosystem gap that cannot be closed by Ubuntu packaging or upstream Autoware OSS work - it requires NVIDIA (or a substitute inference backend) to target riscv64 first.
- **OpenCV** has real, currently-open RVV correctness gaps (issues #27279, #27281 on the 5.x branch) even though it is packaged for riscv64 - a riscv64 Autoware build using OpenCV's Remap/WarpPerspective on this branch would inherit those regressions.
- **PCL**'s SIMD kernels are not yet vectorized for riscv64 (scalar fallback works, but issue #6385 shows the RVV migration is incomplete) - a functional but slower NDT/ground-segmentation path.
- **Eigen3**'s apparent absence from the Ubuntu 26.04 riscv64 package graph is anomalous for a header-only, architecture-independent library and most likely reflects an archive/buildd gap rather than a real technical blocker [NEEDS VERIFICATION] - worth confirming directly against Debian's riscv64 buildd logs.

## 11. Known Bugs and Active Issues

No RISC-V-related issues exist in `autowarefoundation/autoware` or `autowarefoundation/autoware_universe` (targeted queries for "riscv64 performance", "riscv64 bug", "riscv nan floating", and plain "riscv" scoped to both repos all returned 0 results).

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue exists in Autoware itself | N/A | N/A | Confirmed by exhaustive issue search |
| [opencv#27279](https://github.com/opencv/opencv/issues/27279) | Remap RVV accuracy regression | open | correctness (dependency, not Autoware itself) | Affects OpenCV 5.x on riscv64; Autoware depends on OpenCV for camera perception |
| [opencv#27281](https://github.com/opencv/opencv/issues/27281) | WarpPerspective RVV accuracy regression | open | correctness (dependency, not Autoware itself) | Same OpenCV branch as above |
| [opencv#19844](https://github.com/opencv/opencv/issues/19844) | G-API failure | open | unclear (dependency, not Autoware itself) | Referenced in dependency research; severity not independently assessed |
| [pcl#6385](https://github.com/PointCloudLibrary/pcl/issues/6385) | SSE/AVX to RVV migration of `sample_consensus::countWithinDistance` not merged | open | performance (dependency, not Autoware itself) | PCL used by Autoware's NDT scan matcher and ground segmentation |

**Correctness bugs highlighted separately:** The two open OpenCV RVV accuracy regressions (#27279, #27281) are correctness issues, not merely performance gaps - they would affect visual output correctness (Remap, WarpPerspective) if Autoware's camera perception ran on riscv64 using that OpenCV branch. No correctness bug in Autoware's own code exists because no riscv64 build of Autoware's own code has ever been produced.

## 12. Objections and Upstream Blockers

**Stated objections:** None found - there is no recorded discussion (issue, PR, discussion thread, mailing list, or foundation communication) in which anyone at Autoware Foundation or TIER IV has stated a position for or against riscv64 support.

**Technical blockers:**
1. No upstream ROS 2 base image (`ros:*-ros-base`) is published for riscv64 - the root build-system blocker, since Autoware's Docker-based build/deploy model depends on it.
2. NVIDIA CUDA/TensorRT has no riscv64 target at all - blocks essentially the entire DNN-based perception stack (LiDAR/camera detection, traffic-light classification) with no CPU-only fallback in Autoware's architecture.
3. Even the far more mature arm64 target - which has GPU-vendor backing via NVIDIA Jetson - is currently having its CI coverage trimmed for cost/complexity (PR #7306, `autoware_core` PR #636), indicating a resource-constrained, amd64-first testing posture that would make a new architecture port even harder to sustain.
4. Open RVV correctness regressions in a key dependency (OpenCV 5.x, issues #27279/#27281) and an incomplete RVV SIMD migration in another (PCL #6385) mean that even if the CUDA blocker were solved, dependency-level correctness/performance gaps remain.

**Organizational blockers:**
1. No RISC-V silicon vendor is a Premium or TSC member of the Autoware Foundation - RISC-V International/SiFive appear only as a governance alliance partner, not a technical contributor with engineering resources committed to a port.
2. No community RFC, tracking issue, or draft PR exists to indicate any latent demand or in-progress effort.
3. RISE Project has no involvement with Autoware: not listed among RISE's 20 Premier/General members, no RISE blog post about Autoware, no RISE wheel-builder entry, no RISE-funded work. The only trace of "Autoware" anywhere in RISE's public/org surface is an unactioned entry in this repository's own internal report-authoring backlog queue (`project-reports/.queue.yml`), which is not evidence of any actual RISE-Autoware collaboration.

**Acceptance probability:** Low in the near term. A RISC-V port would need to be entirely community-driven from scratch, would require solving the ROS 2 base-image gap and the CUDA/TensorRT perception-stack gap (the latter outside Autoware's or even the Autoware Foundation's control, since it depends on NVIDIA), and has no current vendor or foundation-level sponsor. Even Autoware's second architecture (arm64), which has full GPU-vendor support via Jetson, is presently having its CI investment reduced rather than expanded.

## 13. Readiness Assessment

- **Color:** orange (no color_case subtype cleanly applies: the project has no upstream riscv64 CI and no riscv64 artifact from any provider, but it is also not a case of a distro shipping a patched/unpatched package, since no distribution ships Autoware for any architecture at all)
- **Release provider:** none
- **Optimization gap:** N/A - Autoware is a full autonomous-driving software framework (perception, planning, control, localization), not a project whose primary purpose is to outperform a reference implementation, so the Step 2 optimization-coverage modifier does not apply.
- **Justification:** All 29 GitHub Actions workflows in [autowarefoundation/autoware](https://github.com/autowarefoundation/autoware) were read directly; the docker build pipeline ([docker-build.yaml](https://github.com/autowarefoundation/autoware/blob/main/.github/workflows/docker-build.yaml)) builds and pushes images only for amd64 and native arm64 runners, with no riscv64 target anywhere in the matrix. No riscv64 binary, package, or release artifact exists in any channel checked - GitHub Releases (source archives only, [1.9.0 assets](https://github.com/autowarefoundation/autoware/releases/tag/1.9.0)), PyPI (404), Ubuntu 26.04 (no results), or Arch RISC-V (404). This is a confirmed, exhaustively verified absence, not a data gap, which places the project at orange per the color model's "no upstream CI" primary grade; the distribution floor cannot raise it because no distribution ships the package at all.
- **Pending work that could change the grade:** None found. No open PR, no tracking issue, no RISE involvement (Autoware is not listed as a RISE member or project, and the only "Autoware" trace in RISE's surface is an unactioned entry in this repository's own internal report backlog, not evidence of funded work). Absent a new upstream riscv64 ROS 2 base image and a resolution to the CUDA/TensorRT gap, no change to this grade is foreseeable from current signals.

## 14. Investment Analysis

RISE has done no work on Autoware and has not funded any Autoware-related effort (Section 12) - none of the sizing below overlaps with existing RISE investment.

### 14.1 Functional Enablement

The critical path is: (1) a riscv64 ROS 2 base image (upstream `ros:*-ros-base` does not currently publish one - this is itself a large, cross-project dependency outside Autoware's control, not sized here as an Autoware-specific task), (2) verification/fixing of the `autoware_universe`/`autoware_core` package tree (~150+ packages) against riscv64, and (3) a resolution for the CUDA/TensorRT-dependent perception stack, which has no CPU-only fallback and is blocked on NVIDIA (also outside Autoware's control - not sizeable as Autoware engineering work).

### 14.2 Performance Optimization

Not applicable at this stage - functional enablement has not begun, so no RISC-V-specific performance optimization work exists to size. Once/if a functional build exists, dependency-level RVV gaps (OpenCV #27279/#27281, PCL #6385) would need separate upstream-dependency investment, not Autoware-specific work.

### 14.3 CI/CD Infrastructure

Adding a riscv64 CI target would follow the existing amd64/arm64 pattern (`docker-build.yaml` reusable workflow), but is blocked until a working riscv64 base image and dependency tree exist to build from.

### 14.4 Ecosystem Enablement

Not applicable - Autoware has no dependent package ecosystem of its own that third parties build on top of.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Investigate/produce a riscv64 ROS 2 base image dependency (cross-project prerequisite, not solely Autoware's scope) | Data not available: no scoping study found; effort depends entirely on upstream ROS 2 riscv64 status, which was not researched in this report | Unclear - likely upstream ROS 2, not Autoware Foundation | Critical (blocks everything else) |
| Functional | Audit and fix `autoware_universe`/`autoware_core` (~150+ packages) for riscv64 build compatibility | Data not available: no package-by-package build attempt has been made; sizing requires an actual build pass to identify failures | Autoware Foundation / community | High |
| Functional | Resolve or work around the CUDA/TensorRT perception-stack dependency for riscv64 | Data not available: outside Autoware's control; depends on NVIDIA's own riscv64 roadmap, which was not researched here | NVIDIA (external) | Critical (blocks perception subsystem entirely) |
| Dependency | Fix OpenCV RVV accuracy regressions (#27279, #27281) upstream | Data not available: sizing not in scope of this report; tracked in OpenCV's own project-reports/opencv.md | OpenCV upstream | Medium (only relevant once Autoware itself builds) |
| Dependency | Complete PCL RVV SIMD migration (#6385) upstream | Data not available: sizing not in scope of this report | PCL upstream | Medium (only relevant once Autoware itself builds) |
| CI/CD | Add riscv64 target to docker-build.yaml pipeline | Data not available: trivial relative to functional blockers once a working base image and dependency tree exist, but no concrete estimate was researched | Autoware Foundation | Low (sequenced after functional enablement) |

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [autowarefoundation/autoware (GitHub)](https://github.com/autowarefoundation/autoware)
- [Autoware Foundation homepage](https://autoware.org/)
- [Autoware installation docs - supported architectures](https://docs.autoware.org/main/installation)
- [docker-build.yaml workflow](https://github.com/autowarefoundation/autoware/blob/main/.github/workflows/docker-build.yaml)
- [PR #1982 "crossbuild dockerhub" (false-positive check)](https://github.com/autowarefoundation/autoware/pull/1982)
- [GitHub Release 1.9.0](https://github.com/autowarefoundation/autoware/releases/tag/1.9.0)
- [GitHub Release 1.9.0 expanded assets](https://github.com/autowarefoundation/autoware/releases/expanded_assets/1.9.0)
- [PyPI project lookup for "autoware" (404)](https://pypi.org/pypi/autoware/json)
- [Ubuntu package search for "Autoware" on resolute (26.04)](https://packages.ubuntu.com/search?keywords=Autoware&suite=resolute&searchon=names&section=all)
- [RISE Project GitLab PyPI wheel index for "autoware"](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/autoware/)
- [Arch Linux RISC-V unofficial repository (archriscv.felixc.at)](https://archriscv.felixc.at/)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project blog post - Industry Cooperation at RISC-V Summit Europe 2026](https://riseproject.dev/2026/06/26/industry-cooperation-takes-center-stage-at-risc-v-summit-europe-2026/)
- [RISE Python wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)
- [OpenCV issue #27279 - Remap RVV accuracy regression](https://github.com/opencv/opencv/issues/27279)
- [OpenCV issue #27281 - WarpPerspective RVV accuracy regression](https://github.com/opencv/opencv/issues/27281)
- [OpenCV issue #19844 - G-API failure](https://github.com/opencv/opencv/issues/19844)
- [PCL issue #6385 - SSE/AVX to RVV migration of sample_consensus::countWithinDistance](https://github.com/PointCloudLibrary/pcl/issues/6385)
- [autoware_core PR #636 - Add Jazzy Support Excluding ARM64](https://github.com/autowarefoundation/autoware_core)
- [ansible/roles/build_tools - ccache/toolchain provisioning](https://github.com/autowarefoundation/autoware/tree/main/ansible/roles/build_tools)
- [docker/docker-bake.hcl](https://github.com/autowarefoundation/autoware/blob/main/docker/docker-bake.hcl)
- Local clone used for verification: `/home/user/autowarefoundation/autoware` (shallow, main branch, commit 3354a273fc2f374e99fb3a759f6f4ab2947b5ada)

---

Report file written to: `/tmp/claude-0/-home-user-sw-ecosystem/c494527f-69d2-59f4-ae6c-608a75f951db/scratchpad/autoware-report.md`
