---
title: Nav2
parent: Project Reports
color: orange
dependencies:
  - name: Eigen
    relation: build-dependency
    criticality: critical
  - name: OpenCV
    relation: build-dependency
    criticality: optional
  - name: nlohmann/json
    relation: build-dependency
    criticality: optional
  - name: yaml-cpp
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="nav2" %}

# Nav2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Nav2<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Nav2 (ROS-Navigation2) is the navigation stack for ROS 2 robots: costmaps, path planners, controllers, behavior-tree-based task execution, localization glue, and a map server. It is a C++/Python colcon/ament_cmake workspace of roughly 35 sub-packages, not a single monolithic CMake project.

Nav2 has no formal foundation governance. It is led commercially by **Open Navigation LLC**, a company founded by lead maintainer Steve Macenski, which "provides project leadership, maintenance, development, and support services to the Nav2 & ROS community" per the repository README and the docs.nav2.org footer. There is no steering committee, no documented RFC process, and no `PLATFORMS.md`/`SUPPORT.md`/governance file anywhere in the repository.

License is dual: Apache-2.0 (most packages, per `package.xml`) and LGPL-2.1-or-later (root `LICENSE`). Contributions require DCO sign-off and land under Apache-2.0.

Corporate affiliations found in `package.xml` maintainer emails and commit history: Intel (Carl Delsey, Michael Jeronimo, Carlos Orduno, Mohammad Haghighipanah), Samsung (Alexey Merzlyakov), Open Robotics (Chris Lalancette), Logivations (Tony Najjar, 2nd-highest committer), Metro Robots (David V. Lu!!), Robotech Vision (Matej Vargovcik). README-listed sponsors of Open Navigation's maintenance work: Dexory, Nvidia, AMD, Polymath Robotics, Stereolabs, 3Laws Robotics, Staer. Top committer by a wide margin is Steve Macenski (569 of ~2010 sampled commits).

**Community stance on new ports:** No documented policy exists because the topic has essentially never arisen. The one data point (see Section 2) is the lead maintainer's direct statement that RISC-V is "not an officially supported architecture in ROS-land," combined with a willingness to review a community-submitted PR but no commitment of maintainer effort.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-01-15 | `nav2_mppi_controller` rewritten from xtensor/xsimd to Eigen for a 45-50% performance improvement (commit `a33e8d2b`); this incidentally removed the hardcoded `-mtune=generic` flag and the xsimd dependency that would later be reported as broken on RISC-V. No RISC-V intent is stated in the commit. | Local clone, commit `a33e8d2b` |
| 2025-01-23 | Issue [#4872](https://github.com/ros-navigation/navigation2/issues/4872) opened: `nav2_mppi_controller` fails to build on a VisionFive 2 (RISC-V) board under ROS 2 Jazzy, due to `-mtune=generic` not being recognized by riscv64-linux-gnu-gcc, and (after working around that) xsimd having no RISC-V backend. | [Issue #4872](https://github.com/ros-navigation/navigation2/issues/4872) |
| 2025-01-24 | Maintainer @SteveMacenski replies: RISC-V is "not an officially supported architecture in ROS-land," offers to review/merge a PR, questions whether MPPI can run real-time without SIMD, and points to the `main` branch's Eigen-based rewrite as a possible fix. | [Issue #4872](https://github.com/ros-navigation/navigation2/issues/4872) |
| 2025-02-08 / 2025-02-27 | Follow-up exchange; reporter states RISC-V toolchain support "isn't there yet" and MPPI isn't a priority for their group. | [Issue #4872](https://github.com/ros-navigation/navigation2/issues/4872) |
| 2025-03-01 | Issue closed as completed by @SteveMacenski: "I wouldn't consider this to be a 'bug' to fix since there aren't users of this work that require it." No PR was ever filed. | [Issue #4872](https://github.com/ros-navigation/navigation2/issues/4872) |

**Key contributors to the (nonexistent) port:** None. The only individual involved is the issue reporter, @ahmadSum1 (external, association: NONE), whose patch was never submitted as a PR.

**Is it fully upstream?** No. There is no RISC-V port, upstream or otherwise. The build failure the one reporter hit may have been incidentally resolved by the unrelated Eigen rewrite, but this has never been verified by anyone on real or emulated riscv64 hardware.

## 3. Upstream Support Tier

No formal tier policy document exists (no `PLATFORMS.md`, `SUPPORT.md`, or equivalent). Evidence of the de facto tier is entirely negative: zero riscv64 CI jobs, zero riscv64 release artifacts, and a maintainer statement that RISC-V is not an officially supported ROS architecture.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (ubuntu-latest/ubuntu-24.04 runners, all 4 workflows) | Data not available: no arm64-labeled CI job found in the 4 workflow files read | No |
| CI tests | Yes | Data not available: same as above | No |
| Official binary release | Via ROS 2 apt repo (`ros-jazzy-navigation2` present in `binary-amd64` index) | Via ROS 2 apt repo (`ros-jazzy-navigation2` present in `binary-arm64` index) | No -- the ROS 2 apt repo's `Architectures:` line lists only `i386 amd64 arm64 armhf`; `dists/noble/main/binary-riscv64/Packages` returns HTTP 404 |
| Maintainer-acknowledged support | Yes (primary target) | Implied by apt repo presence, not independently confirmed by CI evidence in this research | Explicitly "not an officially supported architecture" per @SteveMacenski, [Issue #4872](https://github.com/ros-navigation/navigation2/issues/4872) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

A repo-wide grep for architecture macros and intrinsics (`__x86_64__|__aarch64__|__arm__|__ARM_NEON|immintrin|arm_neon|xsimd|__riscv|mtune|march=|mfma|avx|sse[0-9]|neon`) across all C/C++/CMake files returned **exactly one hit in the whole repository**: `nav2_mppi_controller/CMakeLists.txt`. This was cross-checked against GitHub's own code-search index, which independently returns zero results for `riscv`, `__riscv`, `xsimd`, and `SSE OR AVX OR NEON` in `ros-navigation/navigation2`.

That one file contains a compiler-flag probe, not an architecture branch:
```cmake
include(CheckCXXCompilerFlag)
check_cxx_compiler_flag("-mfma" COMPILER_SUPPORTS_FMA)
if(COMPILER_SUPPORTS_FMA)
  add_compile_options(-mfma)
endif()
```
On amd64 this probe typically succeeds and adds `-mfma`. On arm64 and riscv64 the flag is not recognized, the probe fails, and the block is a no-op -- both non-x86 architectures fall through to the same generic `-O3` path. There is no riscv64-specific branch to grade because there is no architecture-specific branching in Nav2's own source at all, for any architecture.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `nav2_mppi_controller` FMA flag | Partial (single optional compiler flag) | Scalar (probe fails, `-O3` only) | Scalar (probe fails, `-O3` only) |
| Costmap, planners, controllers, behavior-tree nodes, localization glue | Scalar (generic C++/Eigen, compiler auto-vectorization only) | Scalar | Scalar |

No JIT, no hand-written SIMD intrinsics, no crypto, and no assembly exist anywhere in Nav2's own codebase for any architecture. Any real vectorized numerics come from third-party dependencies (Eigen, OpenCV) -- see Section 9.

## 5. Build System, Cross-Compilation, and Toolchain

Nav2 builds via **colcon + ament_cmake** (standard ROS 2 workspace conventions), not a single top-level `CMakeLists.txt`. No `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, or `cmake/toolchain-riscv64.cmake` exists in the repository. No `CMAKE_TOOLCHAIN_FILE` or `CMAKE_SYSTEM_PROCESSOR` reference exists repo-wide.

Only 3 Dockerfiles exist (`./Dockerfile`, `./tools/source.Dockerfile`, `./tools/distro.Dockerfile`), all generic and parameterized only by `FROM_IMAGE` (default `ros:rolling`); none reference riscv64, QEMU, or cross-compilation. No riscv64 Dockerfile exists.

Build instructions live externally at `docs.nav2.org/development_guides/build_docs/index.html`, outside the repository; that page was not fetched in this research pass.

**Known build failure on riscv64 (from source):** Building `nav2_mppi_controller` on a VisionFive 2 (Ubuntu 24.04, ROS 2 Jazzy, riscv64-linux-gnu-gcc-11/13) fails with `cc1plus: error: unknown cpu 'generic' for '-mtune'`, because `-mtune=generic` is an x86-oriented value CMake's compiler-flag detection hardcoded (pre-2025-01-15 code). Working around that surfaced a second failure: xsimd (xtensor's SIMD backend) has no RISC-V code-generation backend at all, breaking `noise_generator.cpp`/`optimizer.cpp` compilation. Source: [Issue #4872](https://github.com/ros-navigation/navigation2/issues/4872). This failure was reported against an older/release-branch snapshot; the `main` branch had already replaced xtensor/xsimd with Eigen 8 days before the report was filed (commit `a33e8d2b`), but **no one has verified on riscv64 whether that removes the failure** -- this is an open, unverified assumption, not a confirmed fix.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Builds from source | Yes (CI-verified) | Yes (CI-verified for supported ROS distros per apt repo presence) | Untested by upstream CI; one user report of a build failure on an older codebase revision, unverified against current `main` |
| Runs test suite | Yes | Data not available: no arm64-specific CI job found in the 4 workflow files | Never run, no CI job exists |
| Official binary package | Yes (`ros-jazzy-navigation2` in ROS 2 apt repo) | Yes (`ros-jazzy-navigation2` in ROS 2 apt repo) | No -- ROS 2 apt repo does not define a riscv64 architecture slot at all |
| Real-time MPPI controller performance | Full SIMD path via Eigen (post-rewrite) | Data not available: not benchmarked in this research | Data not available: no benchmark exists anywhere (see below); maintainer explicitly questioned whether MPPI can run real-time without SIMD acceleration, [Issue #4872](https://github.com/ros-navigation/navigation2/issues/4872) |

**Performance gaps:** No quantitative benchmark data for Nav2 on riscv64 exists anywhere -- not in the project's own issues/PRs, not from RISE, and not in general web search results (searches for "Nav2 riscv64 benchmark", "Nav2 riscv performance", and similar returned only generic non-Nav2 RISC-V hardware benchmarks, e.g. Phoronix VisionFive 2 reviews). The one substantive technical concern on record is the maintainer's own doubt (Section 2) that MPPI can hit 30+Hz real-time control without SIMD acceleration -- and Nav2 itself has zero riscv64-specific SIMD code (Section 4), so if that doubt is correct, riscv64 users depending on generic scalar Eigen code generation may see materially degraded MPPI throughput relative to amd64/arm64. This is inference from the maintainer's stated concern, not a measured result -- **[NEEDS VERIFICATION]**.

**Security hardening / NaN-FP semantics issues:** Data not available: no RISC-V-specific security hardening or floating-point semantics issue was found in any search performed (issue search, code search, CI review).

## 7. CI/CD Infrastructure

Confirmed by cloning `ros-navigation/navigation2` (HEAD `45802a0d54e98f84bac9aa28d252ceaeeb97d34d`) and reading every workflow file directly, cross-checked against a second independent clone/read pass in this research.

**Workflow files (4 total, no others exist):**

| File | Trigger | Runner | riscv64/QEMU/arch mention |
|---|---|---|---|
| [`bt_nodes_validation.yml`](https://github.com/ros-navigation/navigation2/blob/main/.github/workflows/bt_nodes_validation.yml) | `pull_request` (main, jazzy) | `ubuntu-24.04` | none |
| [`build_main_against_distros.yml`](https://github.com/ros-navigation/navigation2/blob/main/.github/workflows/build_main_against_distros.yml) | `workflow_dispatch`, `pull_request` (main) | `ubuntu-latest`, matrix `ros_distro: [jazzy, lyrical]` | none |
| [`lint.yml`](https://github.com/ros-navigation/navigation2/blob/main/.github/workflows/lint.yml) | `pull_request` | `ubuntu-latest` | none |
| [`update_ci_image.yaml`](https://github.com/ros-navigation/navigation2/blob/main/.github/workflows/update_ci_image.yaml) | `schedule` (daily), `push` (main/lyrical/jazzy/humble) | `ubuntu-latest` | none |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository. A repo-wide grep for `riscv|rv64|qemu|cross_compil|CMAKE_TOOLCHAIN_FILE|CMAKE_SYSTEM_PROCESSOR` returned zero real hits (one incidental substring match inside a vendored third-party header, unrelated to RISC-V). No RISE runner labels or references to `riseproject-dev` appear anywhere in the workflow files.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes (all 4 workflows, native GitHub-hosted runners) | No dedicated arm64 CI job found in these 4 workflows | No -- confirmed zero riscv64 CI jobs, no QEMU, no cross-compile step |
| Hardware | GitHub-hosted x86 runners | N/A | N/A |
| RISE runners in use | No | No | No |

## 8. Distribution and Release Status

**GitHub releases:** Confirmed by inspecting the 5 most recent releases (1.5.1, 1.5.0, 1.3.13, 1.3.12, 1.3.11) -- each has exactly 2 assets, both GitHub-autogenerated source archives (`.zip`, `.tar.gz`). No binary/wheel/deb assets exist for any architecture, riscv64 included.

**PyPI:** `https://pypi.org/pypi/nav2/json` returns HTTP 404. No PyPI package named `nav2` exists (Nav2 is distributed as a ROS 2 C++/Python package via ROS apt repositories, not standalone PyPI wheels). The RISE GitLab PyPI proxy (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/nav2/`) redirects to the same nonexistent PyPI page.

**Ubuntu 26.04 (resolute):** Zero results for `nav2`, `python3-nav2`, `navigation2`, or `libnav2` -- Nav2 is not packaged in Ubuntu main archive under any name, for any architecture.

**Debian:** `packages.debian.org` search for `navigation2` across all suites/sections returns zero results. No `ros-*-navigation2` package exists in Debian.

**Arch Linux RISC-V (archriscv.felixc.at):** The full package status page (`.status/status.htm`, 5,471 lines) was grepped directly (the site has no `?q=` search endpoint, contrary to an earlier, invalid check method used in prior research passes) -- zero matches for `nav2` or `navigation`.

**Official ROS 2 apt repository (`packages.ros.org`) -- the actual distribution channel Nav2 ships through:** This is the decisive check. The `Architectures:` line in the Release files for both `jammy` (Humble) and `noble` (Jazzy) lists **`i386 amd64 arm64 armhf`** only -- riscv64 is not declared as an architecture at all. `dists/noble/main/binary-riscv64/Packages` returns HTTP 404 (index does not exist), while `dists/noble/main/binary-amd64/Packages` and `dists/noble/main/binary-arm64/Packages` both return HTTP 200 and contain `ros-jazzy-navigation2`.

**What a user must do to get a working binary today:** There is none available. A riscv64 user must build Nav2 and its full dependency chain from source via `rosinstall_generator`/`vcs import`/`colcon build`, and per Section 5 may hit the (possibly-resolved-by-accident, never-verified) `-mtune`/xsimd build failure along the way.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Eigen | Linear algebra backbone (`nav2_costmap_2d`, `nav2_mppi_controller`, `nav2_constrained_smoother`, `nav2_smac_planner`, `nav2_map_server`) | Available on Ubuntu 26.04 riscv64 (`libeigen3-dev`, `Architecture: all`, header-only). RVV backend merged to Eigen `master` (Nov 2025) but not in any tagged release, opt-in via `-DEIGEN_RISCV64_USE_RVV10` | Native SpacemiT K3 CI exists, but every riscv64 CI job has `allow_failure: true` (non-blocking) | No versioned Eigen release contains the RVV backend | Open issue #3086 (masked partial-packet tails absent on RVV); `allow_failure:true` masked a broken CI flag for 7 months (MR !2658). See existing report `project-reports/eigen.md` |
| Ceres Solver | Nonlinear least-squares optimizer for `nav2_constrained_smoother` | Available on Ubuntu 26.04 riscv64 (`libceres-dev` 2.2.0+dfsg-4.1ubuntu3, ports/universe) | No dedicated riscv64 CI found upstream | Distro-packaged only, no upstream riscv64 release channel | Zero riscv64-specific GitHub issues found for `ceres-solver/ceres-solver` |
| OMPL | Sampling-based motion planning for `nav2_smac_planner` | Available on Ubuntu 26.04 riscv64 (`libompl-dev` 1.6.0+ds1-7, ports/universe) | No dedicated upstream riscv64 CI found | Distro-packaged only | One architecture issue found (#1416, PowerPC, unrelated to riscv64); zero riscv64-specific issues in `ompl/ompl` |
| OpenCV (via `vision_opencv`) | Vision pipeline integration when built alongside Nav2 | Available on Ubuntu 26.04 riscv64 (`python3-opencv` 4.10.0+dfsg-7ubuntu5, `libopencv-*` 410 family); RISE also publishes riscv64 PyPI wheels | Self-hosted riscv64 CI (QEMU RVV1.0 + real hardware nightly), PR-gating, currently passing | No upstream-published riscv64 binary (GitHub Releases and mainline PyPI both lack riscv64); RISE and Ubuntu fill the gap | RVV path for `warpPerspective`/`remap` deliberately disabled since PR #28144 (open accuracy regressions #27279/#27280/#27281; fix PR #29047 still open). See existing report `project-reports/opencv.md` (color: blue) |
| BehaviorTree.CPP | Execution engine for `nav2_behavior_tree`, `nav2_bt_navigator`; embedded ExprTk-based expression evaluator (closest thing to a JIT-like component in Nav2's dependency set) | Not an Ubuntu-packaged library (distributed via ROS apt repos / vendored source); riscv64 build status not independently confirmed this research pass -- **[NEEDS VERIFICATION]** | No riscv64-specific CI found; portable C++, no architecture-gated code | Distributed through ROS 2 build farm binary packages (`ros-<distro>-behaviortree-cpp`); riscv64 coverage there not confirmed -- **[NEEDS VERIFICATION]** | Zero riscv64 issues found in `BehaviorTree/BehaviorTree.CPP` |
| Boost | Transitive dependency via `orocos-kdl`/`geometry2`/OMPL | Available on Ubuntu 26.04 riscv64 (`libboost-dev` 1.90.0.1ubuntu3 -> `libboost1.90-dev`, ports) | Mature, long-standing riscv64 Debian/Ubuntu port | Fully packaged | None identified specific to Nav2's usage |
| nlohmann-json | JSON parsing in `nav2_smac_planner` | Available on Ubuntu 26.04 riscv64, header-only | N/A (header-only) | Fully packaged | None found |
| yaml-cpp (via `yaml_cpp_vendor`) | YAML config parsing in `nav2_map_server` | Available on Ubuntu 26.04 riscv64 (0.8.0+dfsg-9, ports) | No arch-specific code | Fully packaged | None found |
| GraphicsMagick | Map image decode in `nav2_map_server` | Available on Ubuntu 26.04 riscv64 (1.4+really1.3.46-2, ports/universe) | No arch-specific code | Fully packaged | None directly found; underlying `libjpeg-turbo` on riscv64 ships pre-RVV/unaccelerated per the methodology used for the OpenCV report, but this is not Nav2-blocking |

**Assessment:** Nav2's dependency chain has no hard riscv64 build blocker today. Every packaged dependency checked installs cleanly on Ubuntu 26.04 riscv64. However, the two dependencies doing real vectorized numeric/image work (Eigen, OpenCV) both carry open, tracked correctness/performance caveats on riscv64 (masked CI failures on Eigen, disabled RVV image-warp paths on OpenCV) that would propagate into Nav2's costmap, smoother, and controller code paths if and when those RVV-accelerated paths are exercised.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#4872](https://github.com/ros-navigation/navigation2/issues/4872) | `-mtune=generic` on RISC-V is not recognized | Closed (2025-03-01, `completed`) | Build-blocking (confirmed on the code revision tested) | `nav2_mppi_controller` fails to compile on riscv64 due to a hardcoded x86 `-mtune=generic` flag plus xsimd having no RISC-V backend. Reporter's patch attached to the issue, never submitted as a PR. Closed by maintainer as low-priority, not because it was fixed and verified. |

This is the **only** RISC-V-related item in the entire repository's history -- zero PRs (confirmed via `search_pull_requests` for `riscv` and `riscv64`, both 0 results) and zero commits (confirmed via `search_commits`, 0 results) reference RISC-V.

**Correctness bug, highlighted separately:** #4872 is a build-correctness gap, not a runtime-correctness bug -- the affected code path (xtensor/xsimd in `nav2_mppi_controller`) fails to compile at all on riscv64 rather than compiling and misbehaving at runtime. Whether the later Eigen-based rewrite of MPPI resolves this is unverified.

## 12. Objections and Upstream Blockers

**Stated objection (maintainer, direct quote):** "This is not an officially supported architecture in ROS-land... I wouldn't consider this to be a 'bug' to fix since there aren't users of this work that require it." ([Issue #4872](https://github.com/ros-navigation/navigation2/issues/4872), 2025-03-01)

**Technical blocker:** The reported build failure (`-mtune=generic`, xsimd) has no merged fix. Its status against current `main` is unverified.

**Organizational blocker:** Nav2's governance is a single commercial entity (Open Navigation LLC) rather than an open foundation with a documented contribution/tier RFC process. There is no PLATFORMS.md/SUPPORT.md and no evidence of any process, formal or informal, for proposing new architecture ports. Any RISC-V port would go through ad hoc PR review with the lead maintainer rather than a documented pathway.

**Acceptance probability:** The maintainer has explicitly stated willingness to review/merge a PR that fixes the compiler-flag issue. This is a low bar to clear technically (the CMake `-mtune`/xsimd fix is a small, self-contained change per the reporter's own patch), but no one has done it since the issue closed in March 2025, and there is no indication of any RISE or third-party effort in progress (Section 12 continues in Section 13/14).

## 13. Readiness Assessment

- **Color:** orange (base orange -- no upstream riscv64 CI and no distro package of any kind; none of the skill's defined orange sub-types (`downstream-only`, `optimization-absent`) cleanly applies since no distribution ships Nav2 for riscv64 at all)
- **Release provider:** none
- **Justification:** All 4 upstream GitHub Actions workflows run exclusively on x86 `ubuntu-latest`/`ubuntu-24.04` GitHub-hosted runners with no riscv64 job, QEMU step, or cross-compile target ([`.github/workflows/`](https://github.com/ros-navigation/navigation2/tree/main/.github/workflows)). The distribution floor does not apply because no distribution ships Nav2 for riscv64 either: Ubuntu 26.04 resolute, Debian, and Arch Linux RISC-V all return zero results, and the project's own official distribution channel -- the ROS 2 apt repository at `packages.ros.org` -- does not even declare riscv64 as an architecture (`Architectures: i386 amd64 arm64 armhf`; `dists/noble/main/binary-riscv64/Packages` returns HTTP 404). Nav2 is therefore not red (no confirmed, currently-broken riscv64 build against present `main` exists -- the one build failure on record, [#4872](https://github.com/ros-navigation/navigation2/issues/4872), was reported against a pre-Eigen-rewrite revision and was never re-verified) and not grey (this is not an unknown-unknown; the absence of CI, packages, and RISC-V code is exhaustively confirmed, not merely unsearched).
- Not an optimization-purpose project by the skill's test: Nav2 is a robotics application/middleware stack whose value (path planning, obstacle avoidance, behavior execution) does not depend on Nav2's own code being architecture-optimized -- it would deliver the same functional value on generic scalar riscv64 code as it does on amd64/arm64 scalar fallback paths. Optimization level is therefore omitted per the skill's rules.
- **Pending work that could change the grade:** None identified. No open PR exists to fix [#4872](https://github.com/ros-navigation/navigation2/issues/4872) (confirmed via `search_pull_requests`, 0 results). No RISE Project involvement exists -- Nav2 is not mentioned in any of RISE's 34 blog posts, is not in the RISE Python wheel builder's package list, and no RISE member organization is tied to Nav2/ROS/Open Navigation LLC. Nav2 appears only as an unprocessed queue entry in this repository's own `.queue.yml`, with no prior report and no tracked upstream effort.

## 14. Investment Analysis

RISE has done no work on Nav2 -- confirmed absence across all 34 RISE blog posts, the RISE Python wheel builder package list, and RISE's member roster. Nothing below is already covered by RISE funding or infrastructure.

### 14.1 Functional Enablement

The immediate, low-cost item is finishing what the original reporter started: fix the hardcoded x86 `-mtune=generic` flag and the xsimd/x86-SIMD-detection logic in `nav2_mppi_controller/CMakeLists.txt` to branch correctly by architecture, and verify whether the later Eigen-based MPPI rewrite already sidesteps the xsimd dependency entirely on riscv64 (this needs actual build verification on riscv64 hardware or QEMU, not assumption). Beyond that single package, the rest of Nav2 has zero architecture-specific code (Section 4), so a from-source build across the remaining ~34 packages is plausible without code changes -- the primary functional-enablement task is establishing and running that build at all, since it has never been attempted or verified by anyone associated with the project.

### 14.2 Performance Optimization

No riscv64 performance data exists to optimize against (Section 6). The maintainer's own stated concern -- that MPPI's real-time performance depends on SIMD and may not hit 30+Hz without it -- is the only signal on record, and it is unverified. Before any optimization investment, a first task is establishing a baseline benchmark of `nav2_mppi_controller` (and other compute-heavy nodes: costmap updates, `nav2_smac_planner`) on real or emulated riscv64 hardware to determine whether generic scalar Eigen code generation is actually a bottleneck.

### 14.3 CI/CD Infrastructure

Zero riscv64 CI exists. Standing up a riscv64 job in `build_main_against_distros.yml` (the existing distro-matrix workflow) would be the natural integration point, but no RISE runner or hardware is currently wired into this project -- this would need to be requested/set up from scratch, referencing the RISE RISC-V Runners program mentioned in RISE's own blog history (not yet applied to Nav2).

### 14.4 Ecosystem Enablement

Section 10 is omitted: Nav2 is a standalone ROS 2 navigation stack, not distributed as a package with a dependent plugin/extension ecosystem that itself needs separate riscv64 enablement (its own dependencies are covered in Section 9, not a downstream ecosystem depending on Nav2).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `nav2_mppi_controller` CMake `-mtune`/xsimd architecture branching (extend the reporter's patch from #4872) and verify against current `main`'s Eigen-based MPPI rewrite | 1-2 | Upstream / community PR (maintainer has stated willingness to review) | High |
| Functional | Establish and document a full from-source riscv64 build of the ~35-package Nav2 workspace (no CI or distro precedent exists) | 2-4 | Upstream or third-party (RISE) | High |
| Performance | Baseline-benchmark `nav2_mppi_controller` and costmap/planner hot paths on riscv64 hardware or QEMU to test the maintainer's real-time-without-SIMD concern | 2-3 | Third-party / RISE | Medium |
| CI/CD | Add a riscv64 job to `build_main_against_distros.yml` using RISE RISC-V runners, build-only initially, test-execution once functional enablement lands | 1-2 | RISE (runner infrastructure) + upstream (workflow change) | Medium |
| Distribution | Work with ROS 2 build farm / apt infrastructure to add a riscv64 architecture slot (currently absent entirely from `packages.ros.org`) | Data not available: scope depends on ROS 2 build farm infrastructure decisions outside Nav2's own repository -- effort not sizeable from this research | ROS 2 build farm maintainers (outside Nav2's control) | Low (blocked on external infrastructure decision) |

## 15. Updates

(No updates yet -- initial report dated 2026-09-08.)

## 16. References

- [Issue #4872 - "-mtune=generic on RISC-V is not recognized"](https://github.com/ros-navigation/navigation2/issues/4872)
- [ros-navigation/navigation2 repository](https://github.com/ros-navigation/navigation2)
- [Nav2 documentation site (docs.nav2.org)](https://docs.nav2.org/)
- [`bt_nodes_validation.yml`](https://github.com/ros-navigation/navigation2/blob/main/.github/workflows/bt_nodes_validation.yml)
- [`build_main_against_distros.yml`](https://github.com/ros-navigation/navigation2/blob/main/.github/workflows/build_main_against_distros.yml)
- [`lint.yml`](https://github.com/ros-navigation/navigation2/blob/main/.github/workflows/lint.yml)
- [`update_ci_image.yaml`](https://github.com/ros-navigation/navigation2/blob/main/.github/workflows/update_ci_image.yaml)
- [PyPI JSON API for "nav2" (404)](https://pypi.org/pypi/nav2/json)
- [RISE GitLab PyPI proxy for "nav2"](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/nav2/)
- [Ubuntu package search, "Nav2", suite resolute](https://packages.ubuntu.com/search?keywords=Nav2&suite=resolute&searchon=names&section=all)
- [Debian package tracker search, "navigation2"](https://tracker.debian.org/pkg/navigation2)
- [Arch Linux RISC-V port status page](https://archriscv.felixc.at/)
- [ROS 2 apt repository, noble binary-amd64 index (contains ros-jazzy-navigation2)](http://packages.ros.org/ros2/ubuntu/dists/noble/main/binary-amd64/Packages)
- [ROS 2 apt repository, noble binary-arm64 index (contains ros-jazzy-navigation2)](http://packages.ros.org/ros2/ubuntu/dists/noble/main/binary-arm64/Packages)
- [ROS 2 apt repository, noble binary-riscv64 index (404, does not exist)](http://packages.ros.org/ros2/ubuntu/dists/noble/main/binary-riscv64/Packages)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project RSS feed](https://riseproject.dev/feed/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/sw-ecosystem project-reports queue entry for Nav2](https://github.com/riseproject-dev/sw-ecosystem)
- [existing project report: Eigen](project-reports/eigen.md)
- [existing project report: OpenCV](project-reports/opencv.md)
- [Phoronix - StarFive VisionFive 2 Quad-Core RISC-V Performance Benchmarks](https://www.phoronix.com/review/visionfive2-riscv-benchmarks)
```

Note on data gaps carried into the report: BehaviorTree.CPP's riscv64 packaging status through the ROS build farm, arm64 CI-job existence in Nav2's own workflows, and quantitative MPPI real-time performance impact are all marked `[NEEDS VERIFICATION]` or "Data not available" per the sourcing rules, since the supplied research did not settle them.
