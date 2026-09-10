---
title: Edge Impulse ROS Integration
parent: Project Reports
color: orange
dependencies:
  - name: NumPy
    relation: runtime-dependency
    criticality: critical
  - name: OpenCV
    relation: runtime-dependency
    criticality: critical
  - name: PyAudio
    relation: runtime-dependency
    criticality: critical
  - name: Edge Impulse Linux SDK (Python)
    relation: runtime-dependency
    criticality: critical
  - name: ROS 2
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="edge-impulse-ros-integration" %}

# Edge Impulse ROS Integration

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Edge Impulse ROS Integration<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

`edgeimpulse/edgeimpulse-ros` ("edgeimpulse_ros") is a ROS 2 integration package that wraps Edge Impulse's Linux inference runner for use inside ROS 2 robotics pipelines: it subscribes to `sensor_msgs/Image`, runs classification/object-detection through the externally pip-installed `edge_impulse_linux` package (which in turn invokes a `.eim` model binary), and republishes results as `vision_msgs`. It is implemented as a pure-Python `ament_python` ROS 2 package - there is no `CMakeLists.txt`, no C/C++ source, and no compiled extension anywhere in the repository ([repository](https://github.com/edgeimpulse/edgeimpulse-ros)).

**Governance and maintainership:** the repository has no `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `GOVERNANCE`, `PLATFORMS.md`, `SUPPORT.md`, or `CONTRIBUTING.md` file. `package.xml` lists the maintainer as **"Edge Impulse" `<hello@edgeimpulse.com>`** - a corporate maintainer, not an individual or committee. All 16 commits in the repository's full history were authored by a single person, **Moe Sani** (`fattahi.m91@gmail.com` / `50625788+moe-sani@users.noreply.github.com`), who also self-merged both merged PRs (#1, #2). There is no maintainer team, no CODEOWNERS-based review structure, and no documented policy on accepting new platform ports. License is Clear BSD (BSD-3-Clause-Clear), copyright "EdgeImpulse Inc."

**Corporate sponsor:** Edge Impulse Inc. (a commercial edge-ML platform vendor). Not affiliated with RISE or any other RISC-V foundation.

**Community culture on new ports:** undocumented. There is no CONTRIBUTING guide, no port-request process, and no roadmap document addressing CPU architecture at all. The only "roadmap" language in the README concerns ROS 2 distro support (Humble is "on the roadmap"), not architecture.

**RISE relationship:** `edgeimpulse-ros` / Edge Impulse is **not** a RISE member. RISE's member list (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) does not include Edge Impulse ([riseproject.dev/members](https://riseproject.dev/members/)). The project's only trace inside RISE is an unactioned backlog entry in `riseproject-dev/sw-ecosystem`'s internal report queue (`project-reports/.queue.yml`) - not funded work, not a RISE-owned repo, not a published finding.

## 2. Port History and Upstreaming Timeline

No RISC-V port exists, has ever been proposed, or has ever been discussed in this repository.

| Date | Event | Source |
|---|---|---|
| 2026-02-10 | Repository created | [GitHub repo metadata](https://github.com/edgeimpulse/edgeimpulse-ros) |
| 2026-02-16 | PR #1 "Develop" merged | Repository PR history |
| 2026-07-03 | Release v1.0.0 published (0 release assets) | GitHub Releases API |
| 2026-07-06 | PR #2 "Develop 2" merged; Release v2.0.0-beta published (0 release assets) | Repository PR history; GitHub Releases API |
| 2026-08-13 | PR #3 "Ingestion" opened (still open) | Repository PR history |

**Key contributors:** Moe Sani (Edge Impulse) - sole contributor across all 16 commits.

**Is it fully upstream?** Not applicable - there is no RISC-V port to be upstream or out-of-tree. A full-history search (`git log --all -S"riscv"` / `-S"risc-v"` across all commits, branches, and both tags v1.0.0/v2.0.0-beta) returns zero hits, and a repository-wide case-insensitive grep for "riscv" across the working tree returns zero matches. Independently confirmed via `mcp__github__search_issues`, `search_pull_requests`, `search_commits`, and `search_code` for "riscv", "riscv64", and "RISC-V" against `edgeimpulse/edgeimpulse-ros` - all `total_count: 0`.

## 3. Upstream Support Tier

No formal tier policy exists. No `PLATFORMS.md`, `SUPPORT.md`, or equivalent document defines supported architectures; the only stated requirement in the README is ROS 2 distribution (Jazzy or Rolling; Humble "on the roadmap" via an untested legacy `vision_msgs` fallback).

| Architecture | CI builds | CI tests | Official binaries | Notes |
|---|---|---|---|---|
| amd64 (x86_64) | Yes (`ubuntu-latest` runner) | Yes | No (0 release assets on any release) | Sole architecture exercised by CI |
| arm64 | No dedicated CI job | No | No | Referenced only informally in Edge Impulse's broader marketing (Raspberry Pi/Jetson deployments per the [Edge Impulse blog](https://www.edgeimpulse.com/blog/announcing-edgeimpulse_ros-edge-ai-perception-native-in-ros-2/)), not exercised by this repo's CI |
| riscv64 | No | No | No | Zero references anywhere in code, CI, issues, PRs, or commit history |

Evidence: the only CI configuration in the repository is [`workflows/ci.yml`](https://github.com/edgeimpulse/edgeimpulse-ros/blob/main/workflows/ci.yml), which runs solely on `ubuntu-latest` (x86_64 GitHub-hosted runner) across a `[jazzy, rolling]` ROS-distro matrix with no architecture dimension of any kind.

## 4. Technical Architecture and RISC-V-Specific Subsystems

The complete source tree (`src/edgeimpulse_ros/`) is 6 files totaling 1,129 lines: `__init__.py` (10), `conversions.py` (204), `edgeimpulse_detector.py` (419), `image_utils.py` (261), `model_runner.py` (147), `nv12_publisher.py` (88). This is pure Python glue code - a ROS 2 node wrapping camera input, calling out to `edge_impulse_linux` for inference, and republishing `vision_msgs`. It contains:

- No JIT
- No SIMD/vectorized code
- No cryptography
- No hand-written assembly
- No GC barriers (Python-managed memory)
- No `#ifdef`-style architecture guards of any kind (there is no C/C++ build step in which such guards could exist)

A repo-wide case-insensitive grep for `riscv|riscv64|arm64|aarch64|amd64|x86_64` across all files (docs, launch files, config, tests, `package.xml`, `setup.py`, `CHANGELOG.rst`, `README.md`) returns zero matches. A `TODO|FIXME|stub|not implement` sweep across all `.py` files also returns zero matches - there is no half-written or stubbed architecture-specific code path, because none was ever started.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Camera-to-inference pipeline | Missing (generic Python, no arch-specific code) | Missing (generic Python, no arch-specific code) | Missing (generic Python, no arch-specific code) |
| Inference execution | Delegated entirely to external `edge_impulse_linux` / `.eim` binary (not vendored in this repo) | Same | Same - and the `.eim` binary itself has no riscv64 build (see Section 9) |

This project is **not** an optimization-purpose project under the readiness framework used in Section 13 (it is an integration/glue layer, not a library whose value proposition is architecture-specific performance), so the Step 2 optimization modifier does not apply.

## 5. Build System, Cross-Compilation, and Toolchain

No compiled/native build system exists. The package is `ament_python`-based; the only build commands, from the README, are:

```bash
cd ~/ros2_ws
colcon build --packages-select edgeimpulse_ros
source install/setup.bash
```

Dependencies, per `package.xml`/README: `ros-$ROS_DISTRO-vision-msgs`, `ros-$ROS_DISTRO-diagnostic-msgs`, `python3-opencv`, `python3-numpy`, `portaudio19-dev`, plus a manual `pip install --user --break-system-packages edge_impulse_linux pyaudio` (the README notes `edge_impulse_linux` is explicitly **not** resolvable via rosdep).

There are no toolchain version requirements (none needed for pure Python), no `-DUSE_X=OFF`-style build flags, no riscv64 cross-compilation toolchain file, and no Dockerfile of any kind in the repository (checked: `.ci/docker/`, `docker/`, `Dockerfile.riscv64` - none exist). No QEMU usage anywhere. No known build failures are documented because riscv64 has never been attempted.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Package builds via `colcon build` | Yes (only arch exercised by CI) | Presumed yes [NEEDS VERIFICATION - not exercised by this repo's CI] | Unverified - no CI, no reports of anyone attempting it |
| Camera image ingestion / `vision_msgs` publishing | Yes | Yes (pure Python, no arch dependency) | Yes in principle (pure Python code has no arch dependency), but blocked by unavailable runtime dependencies (Section 9) |
| Actual model inference (the package's core function) | Yes, via `edge_impulse_linux`/`.eim` | Yes, via `edge_impulse_linux`/`.eim` (Edge Impulse markets ARM boards such as Raspberry Pi/Jetson) | **No** - the `.eim` inference binary has no riscv64 build, CI, or release for any purpose (Section 9) |
| Runs on official ROS 2 distribution binaries | Yes | Yes | **No** - ROS 2 core itself has no official riscv64 release path (Section 9) |

**Functional gap:** the node cannot perform its core function (running inference) on riscv64 today, because its hard runtime dependency (`edge_impulse_linux` -> `.eim` binary) has no riscv64 build anywhere, and its execution substrate (ROS 2 core) also has no official riscv64 release.

**Performance gap:** not assessable - the package does not run on riscv64 at all today, so no performance delta can be measured.

**Security hardening gap:** no data found either confirming or denying riscv64-specific hardening gaps for this package; it inherits whatever posture ROS 2 core and OpenSSL (via DDS-Security) provide. Data not available: riscv64-specific security assessment of this integration package itself, and given it never runs on riscv64 the question is moot at present.

**NaN/floating-point semantics:** no arch-specific floating-point code exists in this repository (pure Python, delegates numerics to NumPy/OpenCV/the external inference binary). Data not available: no riscv64-specific floating-point issue was found for this package itself.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist? No.** Verified by directly reading the complete CI configuration - the only CI file present in the repository, at the non-standard top-level path `workflows/ci.yml` (not `.github/workflows/ci.yml` - a `.github/workflows/ci.yml` briefly co-existed at commit `0e4cd31` with byte-identical content before being deleted at HEAD `b46fd0e`; note that path means GitHub Actions does not execute the current `workflows/ci.yml` at all):

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
  workflow_dispatch:

jobs:
  build-and-test:
    name: ${{ matrix.ros_distribution }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        ros_distribution: [ jazzy, rolling ]
    container:
      image: ros:${{ matrix.ros_distribution }}-ros-base
    steps:
      - name: Check out the repository
        uses: actions/checkout@v4
      - name: Build and test edgeimpulse_ros
        uses: ros-tooling/action-ros-ci@v0.3
        with:
          package-name: edgeimpulse_ros
          target-ros2-distro: ${{ matrix.ros_distribution }}
```

No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/config.yml`, `.travis.yml`, or `azure-pipelines.yml` exist. No RISE runner usage (`riscv-runner`, `riscv-runner-images`, `board-farm`, `riscv-runner-sample`) was found anywhere in connection with Edge Impulse or ROS.

| Architecture | CI build | CI test | Runner |
|---|---|---|---|
| amd64 | Yes | Yes | GitHub-hosted `ubuntu-latest` |
| arm64 | No dedicated job | No | N/A |
| riscv64 | No | No | N/A |

## 8. Distribution and Release Status

**No official binaries exist for riscv64 - or for any architecture.** GitHub Releases for this repository (fetched via `api.github.com` directly since `mcp__github__list_releases` was access-denied for this unattached repo in-session):
- **v2.0.0-beta** (published 2026-07-06): `assets: []`
- **v1.0.0** (published 2026-07-03): `assets: []`

Both releases carry zero uploaded binary assets of any kind - this project has never shipped a compiled/packaged binary release for any architecture.

- **PyPI:** `https://pypi.org/pypi/edge-impulse-ros-integration/json` returns **HTTP 404 Not Found** - the package does not exist on PyPI under this name at all, on any architecture.
- **RISE GitLab wheel mirror:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-ros-integration/` 302-redirects to PyPI's simple index, which itself 404s.
- **Ubuntu 26.04 (resolute):** project-graph SPARQL query filtering for `"edge impulse ros integration"`, `"python3-edge-impulse-ros-integration"`, `"libedge-impulse-ros-integration"` on riscv64 in suite `resolute` returns **0 bindings**. Cross-checked against [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=Edge%20Impulse%20ROS%20Integration&suite=resolute&searchon=names&section=all) - "no packages found."
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/)): no matching package found.

**What a user must do to get a working build today:** there is no distribution channel to install from on any architecture. A user must build from source via `colcon build` regardless of architecture, and on riscv64 would additionally need to solve the two upstream blockers in Section 9 (a working ROS 2 core build and a riscv64 build of the Edge Impulse inference binary) before the package could run at all.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| NumPy (`python3-numpy`) | Backs `edge_impulse_linux`'s shared-memory buffers and array marshalling | Found in Ubuntu 26.04 riscv64 (resolute). Upstream riscv64 wheel-build CI merged May 2026 ([numpy/numpy#31488](https://github.com/numpy/numpy)); RVV1.0 vectorized kernels still open, scalar fallback today ([#26200](https://github.com/numpy/numpy/issues/26200)) | Upstream riscv64 CI runs but has open failures: [#32461](https://github.com/numpy/numpy/issues/32461), [#32376](https://github.com/numpy/numpy/issues/32376) (both open, reported Aug 2026) | No manylinux riscv64 wheel on PyPI yet ([#30216](https://github.com/numpy/numpy/issues/30216) open); Ubuntu archive path works | See `project-reports/numpy.md` |
| OpenCV (`python3-opencv`) | Camera-image path - core function of this integration (Image topic to `.eim` classifier) | Found in Ubuntu 26.04 riscv64 (resolute): `python3-opencv`, `libopencv-dev`. RVV HAL merged mainline | Upstream riscv64 CI gates merges but has open accuracy regressions: [opencv/opencv#27279](https://github.com/opencv/opencv/issues/27279), [#27281](https://github.com/opencv/opencv/issues/27281), [#19844](https://github.com/opencv/opencv/issues/19844) (GAPI fails on RISC-V) | No `opencv-python` riscv64 wheel on PyPI; Ubuntu `python3-opencv` fills the gap | See `project-reports/opencv.md` (readiness: blue) |
| Edge Impulse `.eim` inference runtime (Inferencing SDK C++ / TFLite Micro / ruy / gemmlowp, invoked via the pip-installed `edge_impulse_linux` package) | The actual ML inference engine - the reason this ROS node exists. Not in `edgeimpulse-ros`'s own manifest but the hard transitive dependency that determines whether the node can function | Not found - no `.eim`/inferencing-sdk artifact exists in Ubuntu 26.04 riscv64 under any name. Its own sub-dependencies (`libflatbuffers-dev`, `libruy-dev`, `libgemmlowp-dev`, `libkissfft-dev`) are individually packaged for riscv64 in resolute, so nothing transitively blocks a from-source build, but no named riscv64 porting target, no CI, and no releases exist upstream for any architecture | No CI at all in `edgeimpulse/inferencing-sdk-cpp` (any arch); TFLite Micro upstream has RVV kernel work only for **riscv32** ([tensorflow/tflite-micro#3280](https://github.com/tensorflow/tflite-micro/pull/3280), unreviewed since Jan 2026), not riscv64 | Zero GitHub releases for any architecture; no PyPI/Ubuntu/Debian/Fedora/Arch package under any name | See `project-reports/edge-impulse-inferencing-sdk-(c++).md` (readiness: orange) and `project-reports/edge-impulse-linux-sdk-(python).md` (readiness: green - the pure-Python glue layer is fine, the gap is entirely in the native `.eim` layer) |
| ROS 2 core stack (`rclpy`/`rcl`, default RMW Fast-DDS, DDS-Security via OpenSSL, allocators TLSF/foonathan_memory) | Base robotics middleware the package runs on top of - pub/sub transport, discovery, optional crypto, deterministic allocation | Not found for ROS 2 itself (`ros-jazzy-ros-base`/`ros-rolling-ros-base` absent from resolute riscv64 - no ROS 2 package exists in the Ubuntu archive under any name/arch). Found for Fast-DDS (`libfastdds3.3`, `libfastdds-dev`, `fastdds-tools`) and OpenSSL (`libssl-dev`) individually in resolute riscv64 | ROS 2 itself: no official riscv64 CI/test (no REP 2000 tier exists for RISC-V). Fast-DDS: no upstream riscv64 CI, but Debian buildd shows riscv64 autopkgtest pass. OpenSSL: native riscv64 CI runs, but AES T-table fallback is not constant-time on hardware lacking Zkn/Zvkned extensions (open fixes [openssl/openssl#31080](https://github.com/openssl/openssl/pull/31080), [#31082](https://github.com/openssl/openssl/pull/31082)) | ROS 2: no official riscv64 binary on any channel - build from source required, blocked on [ros2/Mimick#31](https://github.com/ros2/Mimick/pull/31) (open/unmerged since 2024-02-09 despite external validation). Fast-DDS: Ubuntu/Debian ship clean unpatched riscv64 builds | See `project-reports/ros-2.md` (readiness: orange, blocking: unmerged `Mimick#31`) and `project-reports/fastdds-(eprosima).md` (readiness: yellow) |

`vision_msgs`, `diagnostic_msgs`, `sensor_msgs`, `std_msgs`, `launch`, `launch_ros` are pure message/tooling packages with no JIT/SIMD/numerics/crypto/compression/allocator surface and are excluded from the deep dive above.

**Deep-dive conclusion:** `edgeimpulse-ros`'s own declared manifest (ROS message packages, NumPy, OpenCV) is largely fine on riscv64 today - the Ubuntu 26.04 (resolute) archive ships riscv64 builds of everything it directly asks for. The two real blockers sit one layer down and are not visible in the package's own manifest: (1) ROS 2 itself has no official riscv64 build/release path, blocked on the long-stalled `ros2/Mimick#31`; (2) the Edge Impulse `.eim` inference binary this node calls at runtime has no riscv64 build anywhere - no CI, no releases, for any architecture.

Note: Section 10 (Ecosystem Status) is omitted. `edgeimpulse-ros` is a standalone ROS integration package with no significant dependent package ecosystem (npm/PyPI/Maven consumers building atop it) - its own dependency footprint is fully covered in Section 9.

## 11. Known Bugs and Active Issues

| ID | title | status | severity | notes |
|---|---|---|---|---|
| - | No riscv64-related issues or PRs exist | N/A | N/A | The repository has 0 standalone issues total and 3 PRs total (#1 "Develop" merged 2026-02-16, #2 "Develop 2" merged 2026-07-06, #3 "Ingestion" open since 2026-08-13); none of the three PRs reference RISC-V/riscv64 in title, body, commits, or diff, confirmed via `search_pull_requests` and `search_code` (`total_count: 0` for both) |

No correctness bugs specific to riscv64 exist to highlight, because the package has never been run on riscv64.

## 12. Objections and Upstream Blockers

**Stated objections:** none found - RISC-V has never been discussed in this repository (no issue, no PR comment, no commit message references it).

**Technical blockers:**
1. ROS 2 core has no official riscv64 release path, blocked on unmerged [ros2/Mimick#31](https://github.com/ros2/Mimick/pull/31).
2. The Edge Impulse `.eim` inference binary (the package's actual inference engine, produced by Edge Impulse's separate Inferencing SDK C++ / EON compiler) has no riscv64 build, CI, or release for any architecture.

**Organizational blockers:** single de facto maintainer (an Edge Impulse engineer), no governance structure, no documented process for accepting new platform ports, and no RISE membership or funding relationship to drive the work.

**Acceptance probability:** cannot be assessed from available data - there is no precedent (no architecture-specific PR of any kind has ever been submitted to this repository, for riscv64 or otherwise) to gauge how the sole maintainer would respond to one. Data not available: no maintainer statement on RISC-V, ARM, or multi-architecture support policy was found anywhere.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI, no distro or PyPI package exists at all to apply a distribution floor)
- **Release provider:** none
- Not an optimization-purpose project - the Step 2 modifier (optimization level: full/partial/minimal/absent) does not apply and is omitted from the header.
- **Justification:** The repository's only CI workflow ([workflows/ci.yml](https://github.com/edgeimpulse/edgeimpulse-ros/blob/main/workflows/ci.yml)) runs exclusively on `ubuntu-latest` (x86_64) across a ROS-distro matrix, with no riscv64 runner, QEMU step, or architecture dimension, and no riscv64 references exist anywhere in the repo's 16-commit history, 3 PRs, or 0 issues. No distribution floor applies to lift this above orange because no package exists under any plausible name on PyPI ([404](https://pypi.org/pypi/edge-impulse-ros-integration/json)) or in the Ubuntu 26.04 resolute riscv64 archive (0 bindings via project-graph query and [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=edge-impulse-ros-integration&suite=resolute&searchon=names&section=all)). This is orange rather than red because there is no positive evidence of breakage - only a total absence of riscv64 build/CI/package evidence - and orange rather than grey because sufficient data exists to be confident of that absence (multiple independent zero-result channels checked).
- **Pending work that could change the grade:** the project appears only as an unactioned entry in RISE's internal report-authoring backlog (`riseproject-dev/sw-ecosystem/project-reports/.queue.yml`) - no RISE blog post, funding, or runner usage was found. Even if this package's own CI were extended to riscv64, its grade would remain capped by its two hard runtime dependencies: ROS 2 core (orange, blocked on `ros2/Mimick#31`) and the Edge Impulse `.eim` inference binary (orange, no riscv64 build for any purpose).

## 14. Investment Analysis

RISE has not funded, ported, or otherwise engaged with this project beyond listing it in an internal backlog queue awaiting a readiness report (no work product exists to avoid re-sizing).

### 14.1 Functional Enablement

The package's own code requires no functional porting work (it is pure Python with no architecture-specific paths). The functional blockers are entirely upstream of this repository:
1. Resolve ROS 2 core's riscv64 release path (dependent on [ros2/Mimick#31](https://github.com/ros2/Mimick/pull/31) merging) - this is a prerequisite shared across every ROS 2 package, not specific to `edgeimpulse-ros`.
2. Produce a riscv64 build of the Edge Impulse Inferencing SDK C++ / `.eim` output (tracked separately in `project-reports/edge-impulse-inferencing-sdk-(c++).md`, readiness orange) - also a prerequisite shared by every Edge Impulse deployment target, not specific to this ROS wrapper.

Once both are solved, adding a riscv64 CI job to `workflows/ci.yml` (add a runner/QEMU matrix entry) is a small, low-risk, single-file change specific to this repo.

### 14.2 Performance Optimization

Not applicable - this is an integration/glue package with no compute-intensive code of its own; all performance characteristics are inherited from OpenCV, NumPy, and the Edge Impulse inference binary, each tracked in its own report.

### 14.3 CI/CD Infrastructure

Add a riscv64 matrix entry to `workflows/ci.yml` using `ros-tooling/action-ros-ci@v0.3` on a riscv64-capable runner (RISE board farm or QEMU) once the two upstream functional blockers (Section 14.1) are resolved - premature before then, since the job would only fail on unavailable dependencies rather than test this package's own code.

### 14.4 Ecosystem Enablement

Not applicable - `edgeimpulse-ros` itself has no dependent package ecosystem; its own dependency chain is analyzed in Section 9.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Resolve ROS 2 core riscv64 release path (external prerequisite, tracked in `project-reports/ros-2.md`) | Not sized here - tracked against the ROS 2 project, not this repo | ROS 2 upstream / RISE | Critical (blocks all ROS 2 packages, not just this one) |
| Functional | Produce riscv64 build of Edge Impulse Inferencing SDK C++ / `.eim` output (external prerequisite, tracked in `project-reports/edge-impulse-inferencing-sdk-(c++).md`) | Not sized here - tracked against that project | Edge Impulse upstream | Critical (blocks the node's core function) |
| CI/CD | Add riscv64 matrix entry to `workflows/ci.yml` (single-file change, once above two are solved) | 0.5 | Edge Impulse (repo maintainer: Moe Sani) | Medium (trivial once prerequisites are met; low priority until then) |
| Functional | File/track a riscv64 support request with Edge Impulse (no existing issue tracker entry) | 0.1 (a single issue filing) | RISE / requester | Low (no technical content, just visibility) |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [edgeimpulse/edgeimpulse-ros repository](https://github.com/edgeimpulse/edgeimpulse-ros)
- [workflows/ci.yml (sole CI configuration)](https://github.com/edgeimpulse/edgeimpulse-ros/blob/main/workflows/ci.yml)
- [PyPI JSON API - edge-impulse-ros-integration (404)](https://pypi.org/pypi/edge-impulse-ros-integration/json)
- [Ubuntu package search, suite=resolute](https://packages.ubuntu.com/search?keywords=Edge%20Impulse%20ROS%20Integration&suite=resolute&searchon=names&section=all)
- [RISE GitLab PyPI wheel mirror](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-ros-integration/)
- [Arch Linux RISC-V port tracker](https://archriscv.felixc.at/)
- [riseproject.dev members](https://riseproject.dev/members/)
- [riseproject.dev blog](https://riseproject.dev/blog/)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [ros2/Mimick#31 (unmerged, blocks ROS 2 riscv64 release)](https://github.com/ros2/Mimick/pull/31)
- [numpy/numpy#31488 (riscv64 wheel-build CI)](https://github.com/numpy/numpy)
- [numpy/numpy#26200 (RVV1.0 vectorized kernels, open)](https://github.com/numpy/numpy/issues/26200)
- [numpy/numpy#32461](https://github.com/numpy/numpy/issues/32461)
- [numpy/numpy#32376](https://github.com/numpy/numpy/issues/32376)
- [numpy/numpy#30216 (no manylinux riscv64 wheel)](https://github.com/numpy/numpy/issues/30216)
- [opencv/opencv#27279](https://github.com/opencv/opencv/issues/27279)
- [opencv/opencv#27281](https://github.com/opencv/opencv/issues/27281)
- [opencv/opencv#19844 (GAPI fails on RISC-V)](https://github.com/opencv/opencv/issues/19844)
- [tensorflow/tflite-micro#3280 (RVV kernels, riscv32 only)](https://github.com/tensorflow/tflite-micro/pull/3280)
- [openssl/openssl#31080](https://github.com/openssl/openssl/pull/31080)
- [openssl/openssl#31082](https://github.com/openssl/openssl/pull/31082)
- [Edge Impulse blog: Announcing edgeimpulse_ros](https://www.edgeimpulse.com/blog/announcing-edgeimpulse_ros-edge-ai-perception-native-in-ros-2/)
- riseproject-dev/sw-ecosystem internal backlog: `project-reports/.queue.yml` (internal repository, not publicly linkable)
- `project-reports/numpy.md` (internal report, referenced for NumPy riscv64 status)
- `project-reports/opencv.md` (internal report, readiness: blue)
- `project-reports/edge-impulse-inferencing-sdk-(c++).md` (internal report, readiness: orange)
- `project-reports/edge-impulse-linux-sdk-(python).md` (internal report, readiness: green)
- `project-reports/ros-2.md` (internal report, readiness: orange)
- `project-reports/fastdds-(eprosima).md` (internal report, readiness: yellow)