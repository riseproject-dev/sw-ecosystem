---
title: MoveIt 2
parent: Project Reports
color: orange
dependencies:
  - name: Eigen
    relation: build-dependency
    criticality: critical
  - name: OSQP
    relation: build-dependency
    criticality: critical
  - name: Boost
    relation: build-dependency
    criticality: optional
  - name: OpenMP
    relation: runtime-dependency
    criticality: optional
  - name: assimp
    relation: build-dependency
    criticality: optional
  - name: fmt
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" focus="moveit-2" %}

# MoveIt 2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for MoveIt 2<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

MoveIt 2 is a ROS 2 motion-planning framework for robotic manipulation, providing kinematics, collision checking, trajectory generation, and planning-scene management on top of ROS 2. It is written in C++17 with Python bindings, structured as a colcon/ament ROS 2 meta-workspace of roughly 15 sub-packages (`moveit_core`, `moveit_ros`, `moveit_planners`, etc.), each with its own `package.xml`/`CMakeLists.txt`.

**Governance:** MoveIt 2 has no formal foundation membership - it is not part of Open Robotics, the ROS Foundation, Linux Foundation, or any comparable body. Governance is de facto corporate stewardship: the project's own site states it is "brought to you by PickNik Robotics," which controls the primary documentation domain and the commercial "MoveIt Pro" product built on top of the open-source project. Review is nominally handled through a currently-disabled `.github/CODEOWNERS.disabled` file. `CONTRIBUTING.md` redirects to moveit.ai's contributing page, which describes PR/issue norms but no elected board, RFC process, or written governance charter. License is BSD-3-Clause.

**Corporate sponsors / maintainer affiliations** (from `package.xml` maintainer emails):
- **PickNik Robotics/AI** - dominant affiliation, 47 maintainer entries (Henning Kayser, Tyler Weaver, Nathan Brooks, and others); de facto lead organization.
- **Pilz GmbH** - 19 entries (Alexander Gutenkunst, Christian Henkel, Hagen Slusarek, Immanuel Martini), maintains `pilz_industrial_motion_planner`.
- **MoveIt Release Team** (googlegroups.com alias) - 24 entries, a shared release-management alias, not a single company.
- Academic/individual affiliations: Bielefeld University (Robert Haschke), TU Delft (G.A. van der Hoorn), UT Austin (Andy Zelenak, Blake Anderson), Southwest Research Institute (Jorge Nicho), Intrinsic.ai (Brandon Ong).
- Top all-time commit contributors: Ioan Sucan (2,234+368 commits, original author, ex-Willow Garage/Kitware), Robert Haschke (938, Bielefeld University), Dave Coleman (832, PickNik founder), E. Gil Jones (396), Henning Kayser (340, PickNik), Sachin Chitta (337, original co-creator).

**Community culture on new ports:** No formal tier policy and no documented community stance - positive or negative - on new hardware ports exists anywhere in the repository. The project has never needed one: it carries no architecture-conditional build logic of any kind (see Section 4), so "support" for any given architecture is inherited implicitly from ROS 2 and upstream dependency availability rather than from anything in this repo's own source or CI.

## 2. Port History and Upstreaming Timeline

No RISC-V port has ever been attempted or requested against this repository.

| Date | Event | Source |
|---|---|---|
| N/A | No riscv/riscv64 commit exists anywhere in the full 9,517-commit history (pickaxe search on "riscv" across messages and diff content, from the first commit 2011-10-11 to HEAD) | [moveit/moveit2 repository](https://github.com/moveit/moveit2), local full-history clone, HEAD `797bdeff95c75158bc3b969330456d131dcf27c1` |
| N/A | No riscv/riscv64-tagged issue or PR has ever been opened | GitHub API `search_issues`/`search_pull_requests`/`search_commits` for "riscv" and "riscv64" against `repo:moveit/moveit2`, all returning `total_count: 0` |

There are no key contributors to a RISC-V port because no such effort exists. Since no port has been attempted, the "is it fully upstream" question does not apply: there is nothing to be upstream or out-of-tree.

## 3. Upstream Support Tier

**Formal tier policy:** None found. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists in the repository, and no architecture support matrix is published on moveit.ai or moveit.picknik.ai.

**Evidence:**
- CI: all 7 GitHub Actions workflows (`ci.yaml`, `docker.build.yaml`, `docker.yaml`, `docker_lint.yaml`, `format.yaml`, `prerelease.yaml`, `sonar.yaml`) run exclusively on `ubuntu-latest`/`ubuntu-22.04` GitHub-hosted x86_64 runners. No `platforms:`, `qemu`, or buildx multi-arch arguments appear anywhere; `docker/build-push-action` calls carry no `platforms` key, so Docker builds target only the host runner's native architecture. Confirmed by direct grep of all 7 workflow files (case-insensitive "riscv": zero matches) - [.github/workflows/ci.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/ci.yaml) and the other six workflows in the same directory.
- Release-blocking: not applicable - there is no riscv64 job of any kind to gate merges on.
- Official binaries: none exist for any architecture. The GitHub Releases page states verbatim "There aren't any releases here" - [moveit/moveit2 releases](https://github.com/moveit/moveit2/releases).

**Comparison table: amd64 vs arm64 vs riscv64**

| Architecture | Upstream CI build | Upstream CI test | Upstream release artifact | Distro package (Ubuntu 26.04 resolute) |
|---|---|---|---|---|
| amd64 | Yes (native, `ubuntu-latest`) | Yes | No GitHub Releases published | No `moveit`/`moveit-2` package found in resolute for any arch |
| arm64 | Data not available: no arm64 job or cross-build target found in any of the 7 workflow files | Data not available | No GitHub Releases published | No `moveit`/`moveit-2` package found in resolute for any arch |
| riscv64 | No | No | No | No `moveit`/`moveit-2` package found in resolute for any arch |

Note: MoveIt 2 is normally consumed via the ROS 2 buildfarm (`ros-<distro>-moveit` apt packages from ROS package repositories), not via the Ubuntu main archive or GitHub Releases. That buildfarm's riscv64 tier status was outside the scope of the sources checked in this research and was not queried - see Section 8.

## 4. Technical Architecture and RISC-V-Specific Subsystems

MoveIt 2 contains **no architecture-specific code of any kind**, for any architecture. This was verified directly, not inferred:

- Repo-wide grep for "riscv" (entire working tree): zero matches.
- Grep for CPU-architecture preprocessor guards (`__x86_64__`, `__aarch64__`, `__arm__`, `__riscv`, `_M_X64`, `_M_ARM`) across all `.cpp`/`.h`/`.hpp` files: zero matches.
- GitHub code search (`repo:moveit/moveit2`) for `__riscv`, `__aarch64__`, `__x86_64__`, `immintrin.h`, `arm_neon.h`, `CMAKE_SYSTEM_PROCESSOR`: zero results for every query.
- No `arch/riscv/` directory, no `.S` assembly files, no JIT backend, no SIMD-intrinsics headers, no `CMAKE_SYSTEM_PROCESSOR`/`PROCESSOR MATCHES` conditionals in any `CMakeLists.txt`.

MoveIt 2 is application/middleware-level C++ that delegates all numerics (linear algebra, collision detection, kinematics, trajectory optimization) to external dependencies - Eigen, FCL, OMPL, Orocos KDL, Bullet - which perform their own internal architecture dispatch invisible to MoveIt's own source. MoveIt 2 is therefore **not itself an optimization-purpose project** in the sense of Section 13's color model: its own code has no hot-path SIMD/JIT/crypto subsystem to grade. Its RISC-V viability depends entirely on whether its dependencies build and run correctly on riscv64 (see Section 9), not on any code in this repository.

**Comparison table per component**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD/vectorization | None in MoveIt's own source (delegated to Eigen) | None in MoveIt's own source (delegated to Eigen) | None in MoveIt's own source (delegated to Eigen) |
| JIT | Not present | Not present | Not present |
| Cryptography | Not present | Not present | Not present |
| Hand-written assembly | Not present | Not present | Not present |
| GC barriers | Not applicable (C++, no managed GC) | Not applicable | Not applicable |

## 5. Build System, Cross-Compilation, and Toolchain

No riscv64-specific build documentation, toolchain files, CMake flags, or Dockerfiles exist in the repository. Verified directly:

- `grep -ril riscv .` across the entire repo tree: zero matches.
- No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists; the `README.md` itself contains no architecture/cross-compilation section.
- No root `CMakeLists.txt` exists (this is a colcon/ament multi-package workspace, not a single-CMake project); no `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake`; no `cmake/` directory at all.
- Only five Dockerfiles exist, all under `.docker/` (`source`, `ci-testing`, `ci`, `release`, `tutorial-source`), all `FROM ros:${ROS_DISTRO}-ros-base` or chained `moveit/moveit2:*` base images - none arch-specific, and no `TARGETARCH`/`platform` logic in `docker.yaml` or `docker.build.yaml`.
- GitHub code search `riscv64 repo:moveit/moveit2 filename:Dockerfile`: zero results.

MoveIt 2 is built exclusively via the standard ROS 2 `colcon build` workflow on whatever architectures the upstream ROS 2 distribution's binaries or source build support. No exact riscv64 cmake/configure commands, toolchain version requirements, or QEMU usage exist to document, because none of this build-time architecture logic exists in the repository.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because MoveIt 2 carries zero architecture-conditional code, there is no per-architecture feature matrix to construct at the source level - every feature that builds on amd64 would build identically on any architecture where the ROS 2 toolchain and dependency stack (Eigen, FCL, OMPL, KDL, Bullet, OSQP, Ruckig) are available. No functional gaps, performance gaps, security-hardening gaps, or NaN/floating-point semantics issues specific to riscv64 were identified, because:

- No riscv64 build of MoveIt 2 has been produced or tested anywhere that was found (Section 8).
- No riscv64 issue, bug report, or benchmark exists for MoveIt 2 (Section 11).

Data not available: no riscv64-vs-arm64 or riscv64-vs-amd64 performance comparison for MoveIt 2 exists in any source checked (GitHub issues/PRs, web search, riseproject.dev blog).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Confirmed by direct inspection of all CI configuration in the repository:

- Grep for "riscv" (case-insensitive) across all 7 GitHub Actions workflow files: zero matches.
- Repo-wide grep for "riscv" (entire working tree, not just `.github/`): zero matches.
- No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `azure-pipelines.yml` exists anywhere in the repo.
- No RISE runner references (`riseproject-dev`, RISE runner labels) found anywhere in the CI configuration.

| Workflow | `on:` triggers | `runs-on` |
|---|---|---|
| [ci.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/ci.yaml) | `workflow_dispatch`, `pull_request`, `merge_group`, `push` (main) | `ubuntu-latest` |
| [docker.build.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/docker.build.yaml) | `workflow_call` (reusable) | `ubuntu-latest` |
| [docker.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/docker.yaml) | `schedule` (weekly), `workflow_dispatch`, `push`, `pull_request` (path-filtered) | `ubuntu-latest` |
| [docker_lint.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/docker_lint.yaml) | `workflow_dispatch`, `push`/`pull_request` (path-filtered) | `ubuntu-latest` |
| [format.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/format.yaml) | `workflow_dispatch`, `pull_request`, `merge_group`, `push` (main) | `ubuntu-22.04` |
| [prerelease.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/prerelease.yaml) | `workflow_dispatch` only | `ubuntu-latest` |
| [sonar.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/sonar.yaml) | `push` (any branch) | `ubuntu-latest` |

**Hardware used:** GitHub-hosted x86_64 runners exclusively - no self-hosted or riscv64-labeled runner appears anywhere.

**Comparison table: amd64 vs arm64 vs riscv64**

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (native, all 7 workflows) | Data not available: no arm64 job or cross-build target found | No |
| CI test | Yes | Data not available | No |
| CI release-blocking | N/A (no releases published) | N/A | N/A |
| RISE runners used | No | No | No |

## 8. Distribution and Release Status

**No official riscv64 binaries or packages exist for MoveIt 2 through any channel checked:**

- **GitHub Releases:** No releases exist at all for `moveit/moveit2` - the releases page states "There aren't any releases here" - [moveit/moveit2 releases](https://github.com/moveit/moveit2/releases). Zero release assets of any architecture.
- **PyPI:** No package named `moveit-2` or `moveit2` exists (`https://pypi.org/pypi/moveit-2/json` and the no-hyphen variant both return HTTP 404).
- **RISE Python wheel builder (GitLab package registry):** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/moveit-2/` redirects to the public PyPI index (which 404s) - no package registered.
- **Ubuntu 26.04 (resolute), packages.ubuntu.com:** search for "moveit" returns "Sorry, your search gave no results" - no `moveit`-named package exists for any architecture, not just riscv64.
- **Arch Linux RISC-V port** (`archriscv.felixc.at`): no `moveit`/`moveit2` package listed.

MoveIt 2 is distributed exclusively as ROS 2 source/binary packages through the ROS package index (apt via ROS build farm repositories, e.g. `ros-<distro>-moveit`). **This channel was outside the scope of the sources checked here and was not queried** - its riscv64 tier status is Data not available: the ROS 2 buildfarm's riscv64 support tier for MoveIt 2 packages was not confirmed in either direction.

**What a user must do to get a working binary today:** build from source via `colcon build` against a ROS 2 distribution and dependency stack that itself builds on riscv64, since no prebuilt binary of any kind (ROS buildfarm status aside) was confirmed to exist for this architecture.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/issues |
|---|---|---|---|---|---|
| Eigen | Core linear algebra (kinematics, collision math) | N/A - header-only, `Architecture: all` in Ubuntu resolute | N/A | Ships in resolute universe | None found |
| FCL | Collision/proximity queries | Yes - `libfcl-dev` present for riscv64 in Ubuntu resolute | Data not available (no autopkgtest data) | Shipped | 0 riscv64 issues found |
| OctoMap | Occupancy-map representation | Yes - `liboctomap-dev` present for riscv64 in resolute | Data not available | Shipped | 0 riscv64 issues found |
| OMPL | Sampling-based motion planning backend | Yes - `libompl-dev` present for riscv64 in resolute | Data not available | Shipped | 0 riscv64 issues found |
| Orocos KDL | Kinematics/dynamics | Yes - `liborocos-kdl-dev` present for riscv64 in resolute | Data not available | Shipped | 0 riscv64 issues found |
| Bullet (bullet3) | Alternate collision/physics backend | Yes - `libbullet-dev` present for riscv64 in resolute | Data not available | Shipped | 0 riscv64 issues found |
| Boost | Utility/serialization layer | Yes - `libboost-dev` present for riscv64 in resolute | Data not available | Shipped | 0 genuine riscv64 issues (one semantic false-positive about CPU register allocation, unrelated to RISC-V) |
| OpenMP (LLVM) | Parallel-loop runtime | Yes - `libomp-dev` present for riscv64 in resolute | Data not available | Shipped | Not checked directly (rate-limited); upstream LLVM/OpenMP riscv64 support is well-established |
| OSQP (`osqp_vendor`) | Quadratic-programming solver for trajectory processing/servo | No Ubuntu package - built from source at colcon-build time via vendor wrapper | Data not available | N/A (source-vendored) | 0 riscv64 issues found |
| Ruckig | Online trajectory smoothing | No Ubuntu package - likely built from source/fetched at build time | Data not available | N/A | 0 riscv64-specific issues (one unrelated closed aarch64 issue) |
| assimp | Mesh importer | Yes - `libassimp-dev` present for riscv64 in resolute | Data not available | Shipped | 0 riscv64 issues found |
| fmt | Formatting library | Yes - `libfmt-dev` present for riscv64 in resolute | Data not available | Shipped | Only an unrelated closed ARM32 segfault issue |

**Deep-dive:** No dependency in this table involves JIT, cryptography, or hand-written SIMD assembly at the MoveIt-integration level; Eigen is the one numerics-critical dependency used pervasively, and it ships as an architecture-independent (`Architecture: all`) header-only package in Ubuntu resolute, so there is no compiled Eigen binary to fail on riscv64. The two genuine open questions are **OSQP** and **Ruckig**, both pulled in via ROS "vendor" wrapper packages that compile from source rather than via apt - their riscv64 build/run status is unverified in either direction: no riscv64 CI logs were found for either, and no riscv64-specific issue exists on their trackers. Every dependency that *is* distributed as an Ubuntu archive binary (Eigen, FCL, OctoMap, OMPL, Orocos KDL, Bullet, Boost, OpenMP, assimp, fmt) is already built and shipped for riscv64 in Ubuntu 26.04 resolute, and none showed a riscv64-specific open issue upstream. The `project-graph` MCP server was unreachable (`CONNECTION_CLOSED`) throughout this research, so the transitive `hasDependency` chains behind these packages were not confirmed via the authoritative graph database - this should be re-run when the server reconnects.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | - | N/A | - | No riscv64-related issue, PR, or commit exists anywhere in `moveit/moveit2`. Confirmed via `search_issues`, `search_pull_requests`, `search_code`, and `search_commits` for both "riscv" and "riscv64" - all returned `total_count: 0` |

No correctness bugs, NaN/floating-point reports, or performance issues tied to riscv64 exist to highlight, because none have ever been filed. The only tangentially related item found in the repository's discussion history is an unrelated ARM64 (not RISC-V) thread, "Running moveit on aarch64 ros 2 humble" - [moveit/moveit2 discussion #2558](https://github.com/orgs/moveit/discussions/2558).

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer, issue, or PR expresses either support for or opposition to a riscv64 port.

**Technical blockers:** None specific to MoveIt 2's own source, since it carries no architecture-conditional code (Section 4). The practical blocker is upstream: whether the ROS 2 distribution and dependency stack (particularly OSQP and Ruckig, the two source-vendored numerics dependencies with unverified riscv64 build status) function correctly on riscv64 - a question this research could not fully resolve for the two vendored packages.

**Organizational blockers:** MoveIt 2 has no CI infrastructure of any kind that runs on non-x86_64 architectures (Section 7), so even a working riscv64 build could not be continuously validated without new CI investment. There is no RISE involvement (Section 13) to draw on for runners or funded work.

**Acceptance probability:** Data not available - no prior riscv64 port attempt exists to gauge maintainer receptiveness against. Given the complete absence of architecture-conditional logic in the codebase, a functional riscv64 build is plausible with no source changes required to MoveIt 2 itself, contingent entirely on the ROS 2 buildfarm and the OSQP/Ruckig vendor builds succeeding on riscv64 - neither of which was confirmed here.

## 13. Readiness Assessment

- **Color:** orange (base case: no upstream riscv64 CI, and no confirmed upstream or distribution riscv64 release channel)
- **Release provider:** none
- **Optimization level:** not applicable - MoveIt 2 is not an optimization-purpose project under the color model's test (it is a motion-planning application framework that delegates numerics to external dependencies such as Eigen/FCL/OMPL/Bullet/KDL rather than itself existing to outperform a simpler reference implementation; see Section 4)
- **Justification:** All 7 GitHub Actions workflows run exclusively on `ubuntu-latest`/`ubuntu-22.04` x86_64 runners with no riscv64 job, no multi-arch/QEMU targeting, and no riscv64 reference anywhere in the workflow files - [.github/workflows/ci.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/ci.yaml). No upstream GitHub Releases exist at all ("There aren't any releases here" - [moveit/moveit2 releases](https://github.com/moveit/moveit2/releases)), and no `moveit`-named package was found in Ubuntu 26.04 resolute for any architecture, so the distribution floor (which would otherwise upgrade to yellow on a clean unpatched distro build) cannot be applied - there is no distro package to check patch status against. The project's own source has zero architecture-conditional code (Section 4), which means the orange rating reflects an absence of validation infrastructure and release channels rather than any known technical defect - riscv64 support has simply never been tested or shipped, upstream or downstream.
- **Pending work that could change the grade:** None identified. No open PR, issue, or RISE-funded initiative addresses MoveIt 2 riscv64 support - confirmed via GitHub API search (zero results across issues/PRs/commits/code) and a full review of RISE's blog, member list, wheel builder package list, and the `riseproject-dev` GitHub org (25 repos, none MoveIt-related). The single most consequential unresolved item is the ROS 2 buildfarm's riscv64 tier status for `ros-<distro>-moveit` packages, which falls outside the sources checked in this research (Section 8) and should be queried directly (e.g. via the ROS build farm's own status pages) before revising this grade.

## 14. Investment Analysis

**RISE involvement check:** No RISE involvement with MoveIt 2 was found across any channel - the RISE blog (riseproject.dev/blog), RISE member/partner lists, the RISE Python wheel builder package list (~70 packages, no robotics packages), and the full `riseproject-dev` GitHub org (25 repos, all RISC-V infra/tooling, none MoveIt-related) were all checked and none reference MoveIt 2. No work has been funded or completed by RISE for this project; the full investment scope below is unaddressed.

### 14.1 Functional Enablement

No riscv64 build of MoveIt 2 or its ROS 2 dependency stack has been confirmed to exist. Priority work: (1) confirm/establish the ROS 2 buildfarm's riscv64 tier status for the underlying distro (data not available from sources checked), (2) verify the two source-vendored numerics dependencies (OSQP, Ruckig) build and run correctly on riscv64 - both are unverified in either direction, (3) perform an end-to-end `colcon build` of the MoveIt 2 workspace on riscv64 hardware or QEMU to surface any latent build issues, since none of this has ever been attempted (Section 2).

### 14.2 Performance Optimization

Not applicable in the traditional SIMD/JIT-tuning sense - MoveIt 2's own source has no architecture-specific hot paths (Section 4). Any performance work would target the underlying numerics dependencies (Eigen, FCL, OMPL, Bullet), which are out of scope for this project's own repository and already ship as riscv64 binaries in Ubuntu 26.04 resolute (Section 9). Data not available: no riscv64-vs-arm64/amd64 performance benchmark for MoveIt 2 exists to establish a baseline gap.

### 14.3 CI/CD Infrastructure

No riscv64 CI exists (Section 7). Establishing it would require adding a riscv64 job to `ci.yaml` (via native riscv64 runners or QEMU-based emulation) and to the Docker build workflows (`docker.yaml`/`docker.build.yaml`, adding a `platforms:` argument to `docker/build-push-action`). No RISE runner infrastructure is currently used by this project and would need to be requested/onboarded if pursued via RISE.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per instructions, since MoveIt 2 is a standalone ROS 2 application framework, not a project with a significant dependent package ecosystem (npm, PyPI, Maven, or similar) that itself needs riscv64 enablement across many downstream packages.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Confirm ROS 2 buildfarm riscv64 tier status for the target distro | Data not available: effort not sizeable without first confirming current buildfarm status | Data not available | High |
| Functional | Verify/fix OSQP and Ruckig vendor builds on riscv64 | Data not available: no riscv64 build attempt data exists to size from | Data not available | High |
| Functional | End-to-end `colcon build` validation of the MoveIt 2 workspace on riscv64 | Data not available: no prior attempt to size against | Data not available | High |
| CI/CD | Add riscv64 job to `ci.yaml` and Docker build workflows | Data not available: no comparable arm64 job exists in this repo to use as a sizing reference | Data not available | Medium |
| Performance | Benchmark MoveIt 2 on riscv64 vs arm64/amd64 once a working build exists | Data not available: contingent on functional enablement completing first | Data not available | Low |

Effort estimates are marked "Data not available" throughout because no prior riscv64 build, CI, or benchmark attempt exists anywhere in the sources checked (GitHub API, web search, RISE channels, CI workflow files) to derive a sizing baseline from - assigning person-week estimates without such a reference would not be evidence-based.

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [moveit/moveit2 repository](https://github.com/moveit/moveit2)
- [MoveIt 2 homepage (PickNik)](https://moveit.picknik.ai/)
- [moveit/moveit2 releases page](https://github.com/moveit/moveit2/releases) ("There aren't any releases here")
- [.github/workflows/ci.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/ci.yaml)
- [.github/workflows/docker.build.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/docker.build.yaml)
- [.github/workflows/docker.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/docker.yaml)
- [.github/workflows/docker_lint.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/docker_lint.yaml)
- [.github/workflows/format.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/format.yaml)
- [.github/workflows/prerelease.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/prerelease.yaml)
- [.github/workflows/sonar.yaml](https://github.com/moveit/moveit2/blob/main/.github/workflows/sonar.yaml)
- [moveit/moveit2 discussion #2558 - "Running moveit on aarch64 ros 2 humble"](https://github.com/orgs/moveit/discussions/2558)
- [PyPI moveit-2 package JSON (404)](https://pypi.org/pypi/moveit-2/json)
- [RISE Python wheel builder package registry proxy for moveit-2 (redirects to PyPI, 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/moveit-2/)
- [Ubuntu 26.04 (resolute) package search for "moveit"](https://packages.ubuntu.com/search?keywords=moveit&searchon=names&suite=resolute&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=moveit%202)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- CONTRIBUTING.md, CODEOWNERS.disabled, and all `package.xml` maintainer manifests in `moveit/moveit2` (read from local clone, HEAD `797bdeff95c75158bc3b969330456d131dcf27c1`, dated 2026-09-02)
- `LICENSE.txt` in `moveit/moveit2` (BSD-3-Clause)