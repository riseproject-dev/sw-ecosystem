---
title: micro-ROS
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="micro-ros" %}

# micro-ROS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for micro-ROS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

micro-ROS is an embedded-systems port of ROS 2 (Robot Operating System 2) for microcontrollers, providing a C client library (rcl/rclc), static-memory-friendly middleware (rmw_microxrcedds over eProsima's Micro-XRCE-DDS and Micro-CDR), and framework integrations for Arduino and ESP-IDF. The specific repository in scope, [micro-ROS/micro_ros_arduino](https://github.com/micro-ROS/micro_ros_arduino), is the Arduino-framework wrapper that ships precompiled static libraries (`libmicroros.a`) per supported board/core.

**Governance:** No independent foundation, charter, TSC, or CODEOWNERS/MAINTAINERS file exists in the repository. micro-ROS sits under the `micro-ROS` GitHub org as an outgrowth of the ROS 2 Embedded Working Group, nominally within the Open Source Robotics Alliance (OSRA) umbrella, but has no governance document of its own.

**Corporate sponsor:** `NOTICE` files in `micro_ros_arduino` and the sibling `micro_ros_espidf_component` list **eProsima** (Spain) as the sole corporate copyright holder. Commit history (830 commits) shows eProsima staff as the dominant human committers: Pablo Garrido (pablogs9, 145 commits), Anton Casas (7), Antonio Cuadros (6+); automated bots (`github-actions[bot]` 619, `mergify[bot]` 42) account for most raw commit volume via release syncing. eProsima's own site, `micro.vulcanexus.org`, offers "port micro-ROS to your platform" as a **paid commercial service**, indicating new architecture ports are largely a commercial offering rather than a community RFC process.

**License:** Apache-2.0 (matches core ROS 2).

**Community culture on new ports:** Formally permissive (standard PR + DCO in `CONTRIBUTING.md`, no explicit acceptance bar for new hardware/architecture), but resourcing is thin and centralized in eProsima. An informal two-tier board policy exists in the README: "Supported" boards (Portenta, OpenCR, Teensy, ESP32, maintained/tested by eProsima with CI) versus "Community contributed" boards (untested, no CI guarantee, credited to individual contributors). Unfunded architecture ports stall for years even when a lower-level dependency already has the needed support (see Section 2).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-03-31 | PR #52 "ESP32c3 support" merged into `micro-ROS/micro_ros_espidf_component` (sibling repo, not the Arduino wrapper in scope) - adds a 32-bit RISC-V-cored Espressif MCU (ESP32-C3), authored by Pablo Garrido (eProsima), co-authored by Antonio Cuadros, hardware-validated by Acuadros95 | [PR #52](https://github.com/micro-ROS/micro_ros_espidf_component/pull/52) |
| 2023-02-16 | PR #176 generalizes the RISC-V build-target list (`RISCV_TARGETS = "esp32c3" "esp32c6"`) in the ESP-IDF component's toolchain cmake, adding IDF5 support | Repo commit history, [micro_ros_espidf_component](https://github.com/micro-ROS/micro_ros_espidf_component) |
| 2023-12-10 | Issue #216 opened: "Can't create subscriber on ESP32-C3" - RISC-V-core-specific illegal-instruction crash, still open | [Issue #216](https://github.com/micro-ROS/micro_ros_espidf_component/issues/216) |
| 2024-08-21 | Issue #1820 opened in `micro_ros_arduino` requesting ESP32-C3/S3 (RISC-V-core) support; no maintainer response as of last comment (2024-10-16) | [Issue #1820](https://github.com/micro-ROS/micro_ros_arduino/issues/1820) |
| 2025-01-29 | PR #274 merged: initial ESP32-C6 (RISC-V-core) board support in `micro_ros_espidf_component`, gated by ESP-IDF >=5.0 requirement, backported to `rolling`/`humble` | [PR #274](https://github.com/micro-ROS/micro_ros_espidf_component/pull/274) |
| 2025-04-11 | Issue #288 opened and root-caused: a no-FPU float-division miscompilation on ESP32-C3/C6 RISC-V cores inside `rmw_microxrcedds`; fix identified in comments, no confirmed upstream merge visible | [Issue #288](https://github.com/micro-ROS/micro_ros_espidf_component/issues/288) |
| 2026-05-29 | Comment on Issue #216 links the #288 fix as the resolution, 16+ months after #216 was first reported; #216 remains formally open | [Issue #216](https://github.com/micro-ROS/micro_ros_espidf_component/issues/216) |

**Key contributors:** All RISC-V-related work found in the org is authored by eProsima staff (Pablo Garrido, Antonio Cuadros) or by community members reporting/diagnosing bugs (2b-t, Geibinger, Federico-Ciuffardi) with no confirmed maintainer merge closing the loop.

**Is it fully upstream?** No, and the scope is narrower than it appears. All RISC-V work found is confined to **32-bit RISC-V-cored Espressif MCUs (ESP32-C3/C6)** inside the sibling repo `micro-ROS/micro_ros_espidf_component`. The repository in scope for this report, `micro-ROS/micro_ros_arduino`, has **zero RISC-V history of any kind** - no commits, no source, no CI, no board entry - confirmed by a repo-wide `git grep -inE 'riscv|risc-v'` across all branches (main, humble, jazzy, kilted, rolling) and the full commit log, returning zero matches. Furthermore, none of this RISC-V-core MCU work is riscv64/Linux application-processor support; micro-ROS as a product line targets bare-metal 32-bit microcontrollers (ARM Cortex-M, AVR, Xtensa, and now some RV32 MCU cores), not 64-bit Linux systems.

## 3. Upstream Support Tier

There is no formal support-tier policy document (no PLATFORMS.md/SUPPORT.md); the supported-board list is inline in `README.md` with an informal "Supported" (eProsima-tested, CI-covered) versus "Community contributed" (untested) split. Neither tier includes any RISC-V target in `micro_ros_arduino`.

| Architecture | CI builds | CI tests | Upstream binary/library | Tier |
|---|---|---|---|---|
| ARM Cortex-M (m0/m3/m4/m7) | Yes (ci.yml, compile-only) | No (compile-only, no flash/execute) | Yes, precompiled `libmicroros.a` per core/FPU variant | Supported |
| Xtensa (ESP32 classic) | Yes (ci.yml, compile-only) | No | Yes, precompiled `libmicroros.a` (1769 object members) | Supported |
| NXP iMXRT/Teensy (mk20/mk64/mk66) | Yes (ci.yml, compile-only) | No | Yes, precompiled `libmicroros.a` per FPU variant | Supported |
| riscv64 (Linux, application-class) | No | No | No | Not applicable to this project's product line |
| RISC-V 32-bit MCU core (ESP32-C3/C6) | No (in `micro_ros_arduino`); N/A CI in sibling `micro_ros_espidf_component` | No | No `libmicroros.a` for RISC-V in `micro_ros_arduino`; community workaround exists via unofficial `micro_ros_platformio` project | Requested, unimplemented (Issue #1820) |

Even the project's own CI does not "test" in the conventional sense for any architecture - `ci.yml` only compiles (`arduino-cli compile`) fixed example sketches against fixed board FQBNs; there is no flash-and-execute test step for any target, ARM/AVR/Xtensa included. This caps the entire project's CI maturity below what a green/blue grade would normally require even on its supported architectures, independent of the riscv64 question.

## 4. Technical Architecture and RISC-V-Specific Subsystems

`micro_ros_arduino` does not ship source-level architecture branches; each supported target is a hand-built, precompiled `libmicroros.a` static archive under `src/<target>/`:

| Target directory | Contents | Verified format |
|---|---|---|
| `cortex-m0plus`, `cortex-m3`, `cortex-m4` | Single `libmicroros.a` (14.0-14.3 MB) | ARM |
| `cortex-m7` | 3 FPU-variant subfolders | ARM |
| `esp32` | `libmicroros.a` (22.2 MB, 1769 object members) | Verified via `file` on an extracted member: `ELF 32-bit LSB relocatable, Tensilica Xtensa` |
| `mk20dx256`/`mk64fx512`/`mk66fx1m0`, `imxrt1062` | `libmicroros.a` per FPU variant | ARM (Teensy) |
| `riscv` / `riscv64` / `riscv32` | Does not exist | N/A |

There is no `#ifdef __riscv` or `riscv64` guard anywhere in the repository (`search_code` for `__riscv repo:micro-ROS/micro_ros_arduino` and `riscv64 repo:micro-ROS/micro_ros_arduino` both return 0 results; local grep confirms 0 matches). This is not a stub or placeholder - the architecture concept is entirely absent from the source tree, the `extras/library_generation/*_toolchain.cmake` files, and the CI workflows. The `esp32_toolchain.cmake` used by this repo hard-codes `-mlongcalls`, an Xtensa-only GCC flag, confirming the one `esp32` blob covers classic ESP32/S2/S3 (Xtensa) only and cannot cover ESP32-C3/C6 (RISC-V cores).

Org-wide, the closest RISC-V reference is `RISCV_TARGETS = "esp32c3" "esp32c6"` in a toolchain-selector cmake file inside the **sibling** `micro-ROS/micro_ros_espidf_component` repo - a 32-bit MCU target list, not riscv64, and not part of this report's target repository.

No JIT, SIMD, crypto, or compression code paths are enabled in this build in the first place: `colcon.meta` disables the profiles that would normally require them (`RCUTILS_AVOID_DYNAMIC_ALLOCATION=ON`, `UCLIENT_PROFILE_UDP/TCP/DISCOVERY=OFF`). There is therefore no architecture-specific numerics/vector/crypto subsystem to compare across amd64/arm64/riscv64 for this project - the optimization-purpose modifier in Section 13 does not apply.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiled runtime library (`libmicroros.a`) | N/A (not a target board architecture for this repo) | N/A (not a target board architecture for this repo; project targets 32-bit MCU cores, not 64-bit application processors) | Does not exist |
| SIMD/crypto/JIT/compression paths | Disabled by build config for all targets | Disabled by build config for all targets | Disabled by build config for all targets (moot - no riscv64 target exists) |

## 5. Build System, Cross-Compilation, and Toolchain

`micro_ros_arduino` has no root `CMakeLists.txt` - it is not a CMake project from the consumer's perspective; it is an Arduino library distributed as precompiled static libraries generated by a separate colcon workspace (`extras/library_generation/`).

- **Toolchain files present:** `cortex_m0_toolchain.cmake`, `cortex_m3_toolchain.cmake`, `cortex_m4_toolchain.cmake`, `esp32_toolchain.cmake`, `kakutef7-m7_toolchain.cmake`, `opencr_toolchain.cmake`, `portenta-m4_toolchain.cmake`, `portenta-m7_toolchain.cmake`, `teensy32_toolchain.cmake`, `teensy35_toolchain.cmake`, `teensy4_toolchain.cmake`. No `riscv64.cmake` or `toolchain-riscv64.cmake` exists.
- **Default platform list** (`library_generation.sh`): `opencr1, teensy4, teensy32, teensy35, teensy36, cortex_m0, cortex_m3, cortex_m4, portenta-m7, kakutef7-m7, esp32`. No riscv64 entry.
- **Library regeneration** runs the Docker image `microros/micro_ros_static_library_builder:<distro>` (humble/jazzy/kilted/rolling) via `.github/workflows/library_generation.yml`; no `--platform` flag or architecture argument of any kind appears in this workflow.
- **No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, Azure Pipelines, or CircleCI config** exists anywhere in the repository tree.
- **QEMU usage:** none found anywhere in the repo's CI.
- **Known build failures for riscv64:** none documented, because there is no riscv64 build target to fail - the concept has never been attempted in this repository per the full commit history search (`git log --all -i -S"riscv"` across all branches returns zero matches).

**Exact build commands for riscv64 do not exist to report**, because micro-ROS/micro_ros_arduino has never targeted or documented RISC-V/riscv64 in any form.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

This comparison is not directly applicable in the conventional sense: micro-ROS as shipped by `micro_ros_arduino` does not target arm64 or amd64 as consumer platforms either - it targets 32-bit microcontroller cores (ARM Cortex-M, AVR, Xtensa). The relevant gap is therefore riscv64/RISC-V-MCU support versus the existing ARM/AVR/Xtensa MCU support, not a riscv64-vs-arm64-server comparison.

| Capability | ARM Cortex-M / Xtensa (existing) | RISC-V (any form) |
|---|---|---|
| Precompiled runtime library | Yes | No |
| CI compile coverage | Yes (compile-only, no execution) | No |
| Board/core listed in README | Yes | No |
| Community-requested support | N/A (already supported) | Yes, open since 2024-08-21, unresolved ([Issue #1820](https://github.com/micro-ROS/micro_ros_arduino/issues/1820)) |
| Known correctness issues | None found in this stack for ARM/Xtensa | Yes, in the sibling ESP-IDF component: a no-FPU float-division miscompilation crash on RISC-V cores (ESP32-C3/C6), root-caused in [Issue #288](https://github.com/micro-ROS/micro_ros_espidf_component/issues/288) |

**Functional gap:** A user cannot use `micro_ros_arduino` on any RISC-V-cored board (ESP32-C3/C6/H2/P4) at all; the only documented workaround is switching to the unofficial, separate `micro_ros_platformio` project (community-suggested in Issue #1820, not an eProsima/micro-ROS deliverable).

**Performance gap:** Not assessable - there is no riscv64/RISC-V build to benchmark against ARM/Xtensa. No quantitative micro-ROS RISC-V-vs-other-architecture benchmark data was found anywhere (see Section 11 methodology below); the project's own `micro-ROS/benchmarking` repository targets ARM microcontrollers exclusively (Olimex E407, STM32L152-Discovery) with no RISC-V reference.

**Security hardening gap:** Not assessable for the same reason - no RISC-V build exists to evaluate.

**NaN/floating-point semantics issue (confirmed, in a related repo):** [Issue #288](https://github.com/micro-ROS/micro_ros_espidf_component/issues/288) documents a specific floating-point-related crash: the expression `(int32_t)((float)timeout.i32 / (float)available_contexts)` inside `rmw_microxrcedds` triggers an illegal-instruction trap on ESP32-C3/C6 RISC-V cores (which lack a hardware FPU by default), while working fine on classic Xtensa ESP32 (which has one). The community-identified fix replaces the float division with plain integer division. This bug is in a sibling repository, not `micro_ros_arduino` itself, but demonstrates a real, confirmed RISC-V-specific floating-point semantics gap in the broader micro-ROS/eProsima stack.

## 7. CI/CD Infrastructure

**Does riscv64 CI exist? No, confirmed by reading the actual CI YAML files directly** (both a shallow clone at `/home/user/micro-ros/micro_ros_arduino` and an independent fresh clone at `/home/user/micro-ros-verify/micro_ros_arduino`, HEAD `dc256d6f`, dated 2025-09-30).

- **`.github/workflows/ci.yml`:** Trigger is `pull_request` on all branches only (no push, no workflow_dispatch, no schedule). Runner: `runs-on: ubuntu-24.04`, `container: ubuntu:24.04` - standard x86_64 GitHub-hosted, no QEMU setup, no cross-arch buildx, no self-hosted riscv64 runner. Job installs `arduino-cli` cores for OpenCR, `arduino:samd`, `arduino:sam`, `arduino:mbed_giga/rp2040/portenta/opta`, `arduino:renesas_uno`, `arduino:mbed_nano`, `esp32:esp32`, `teensy:avr@1.59.0`, `Seeeduino:samd` - all ARM/AVR/Xtensa, none RISC-V. Compiles fixed example sketches against fixed FQBNs (e.g., `esp32:esp32:esp32`, the original Xtensa target, not `esp32:esp32:esp32c3`).
- **`.github/workflows/library_generation.yml`:** Trigger is `workflow_dispatch` (manual) and daily `schedule` cron. Runner: `runs-on: ubuntu-latest` (x86). Runs `docker run microros/micro_ros_static_library_builder:<distro>` across ROS distro axis (humble/jazzy/kilted/rolling) - a distro axis, not an architecture axis. No `--platform`, no QEMU, no architecture argument.
- **No other CI system exists** in the repository (`git ls-tree -r HEAD` confirms no `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, Azure Pipelines, or CircleCI config anywhere).

**RISE runners?** No reference to `riseproject-dev` or any RISE RISC-V runner label anywhere in the workflow files or the repository.

**Hardware used:** Standard GitHub-hosted x86_64 runners (`ubuntu-24.04`/`ubuntu-latest`) for all CI. No hardware-in-the-loop testing of any kind is configured in this repo for any architecture (contrast with RISE's unrelated hardware-in-the-loop CI work for other projects, described in Section 12).

| | amd64 (CI host) | arm64 (target boards) | riscv64 |
|---|---|---|---|
| CI builds | Yes (as the runner architecture only, not a target) | Yes (compile-only, cross-compiled from x86 runner) | No |
| CI tests execution | No (compile-only for all targets, no flash/execute step) | No | No |
| CI publishes riscv64 artifact | N/A | N/A | No |

## 8. Distribution and Release Status

**No official riscv64 binaries exist anywhere, and this project does not distribute prebuilt platform binaries at all as a matter of design** - it is a source-distributed Arduino library, compiled on-device by the end user's Arduino/PlatformIO toolchain, with GitHub releases containing only generic auto-generated source archives (`.zip`/`.tar.gz`), no per-architecture binary assets of any kind, confirmed for v2.0.6 through v2.0.8 tags across humble/jazzy/kilted/rolling/iron.

- **PyPI:** No package named `micro-ros` exists. `https://pypi.org/pypi/micro-ros/json` returns HTTP 404 (verified directly). `https://pypi.org/simple/micro-ros/` and the normalized `micro_ros` spelling both return 404.
- **RISE Python wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/micro-ros/` redirects (HTTP 302) to the PyPI 404 above. Not listed among the 97 packages on [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/).
- **npm, Maven, OCI:** Not applicable - this project has no packages in these ecosystems (C/C++ Arduino library).
- **Ubuntu (all suites, all architectures):** No `micro-ros`, `python3-micro-ros`, or `libmicro-ros` package exists. Verified directly against `packages.ubuntu.com` for suite `resolute` (Ubuntu 26.04): raw HTML response contains `<p id="psearchnoresult">Sorry, your search gave no results</p>`; the search mechanism itself was sanity-checked against `bash` (returns real hits), confirming this is a genuine zero-result, not a broken query.
- **Debian, Fedora:** Not separately checked, but given the ROS build-farm distribution model (this project's dependencies are distributed via `packages.ros.org`, not the OS package archives) and the confirmed Ubuntu absence, an equivalent absence is expected [NEEDS VERIFICATION].
- **Arch Linux RISC-V:** The `archriscv.felixc.at` page was found to be a static status page with no functioning package-search capability (`?q=` parameter has no effect - byte-identical responses with and without it) - this channel could not actually be checked and should be treated as unexamined, not as a confirmed negative.

**What must a user do to get a working binary today?** There is none to get. A user wanting micro-ROS on any RISC-V-cored board must either (a) manually adapt the unofficial `micro_ros_platformio` project (community workaround suggested in [Issue #1820](https://github.com/micro-ROS/micro_ros_arduino/issues/1820), not an official micro-ROS deliverable), or (b) use the RISC-V-core support that exists only in the separate `micro_ros_espidf_component` repo (ESP-IDF framework, not Arduino), which itself has an outstanding correctness bug ([Issue #288](https://github.com/micro-ROS/micro_ros_espidf_component/issues/288)) that took over four years post-port to root-cause.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| `eProsima/Micro-CDR` | CDR serialization of numeric primitives (endianness-aware marshalling) | No CI found for riscv64 (`search_code "riscv"` -> 0 hits) | No riscv64 test evidence | Not an Ubuntu/apt package (built from source by ROS build farm) | No riscv64 issues open or closed (`search_issues` -> 0) |
| `eProsima/Micro-XRCE-DDS-Client` | XRCE-DDS transport/session client, framing/CRC | No riscv64 CI; `search_code "riscv"` -> 0 hits | None found | Not an Ubuntu package | One loosely related closed issue (#75, cross-compiling for Raspberry Pi), not riscv64-specific |
| `micro-ROS/rcutils` | Allocator abstraction (`rcutils_allocator_t`) | No riscv64 CI; `search_code "riscv"` -> 0 hits | None found | Not an Ubuntu package (ROS-repo only) | `search_issues "riscv64"` -> 0 |
| `micro-ROS/micro_ros_utilities` | Static memory-pool/type-introspection utilities | No riscv64 CI found | None found | Not an Ubuntu package | `search_issues "riscv64"` -> 0 |
| `micro-ROS/rcl` (fork) | Core ROS client library | No riscv64-specific CI found | None found | Not an Ubuntu package | `search_issues "riscv64"` -> 0 |
| `ros2/rclc` | C client library atop rcl | No riscv64 CI found | None found | Not an Ubuntu package | One unrelated open issue (#440, PIC on amd64), not riscv64 |
| `micro-ROS/rmw_microxrcedds` | RMW middleware layer over Micro-XRCE-DDS | Unresolved - repo path needs confirming for issue search | Could not query (repo path `micro-ROS/rmw-microxrcedds` rejected as not found) | Not an Ubuntu package; declared support matrix in `PLATFORM_SUPPORT.md` lists only amd64/amd32/arm64/arm32 - no riscv row | Unresolved pending repo path confirmation |
| `micro-ROS/rosidl_typesupport_microxrcedds` | Type-support codegen glue | None found | `search_issues "riscv64"` -> 0 | Not an Ubuntu package; `PLATFORM_SUPPORT.md` lists only amd64/amd32/arm64/arm32 | None found |

**Deep-dive on numerics-adjacent dependencies:** None of these dependencies enable a JIT, SIMD, crypto, or compression code path in this build configuration. `colcon.meta` explicitly disables the categories that would pull such dependencies in (`RCUTILS_AVOID_DYNAMIC_ALLOCATION=ON`, `RCUTILS_NO_THREAD_SUPPORT=ON`, `RCUTILS_NO_64_ATOMIC=ON`, `UCLIENT_PROFILE_UDP/TCP/DISCOVERY=OFF`). A repo-wide `search_code` for riscv/SIMD-adjacent terms across every dependency repo returned 0 hits, confirming no architecture-specific numeric/vector code path exists to assess in the first place.

**Note on the graph-database gap:** The `project-graph` MCP server failed to connect during this research (`CONNECTION_CLOSED`) for the planned Ubuntu 26.04 riscv64 SPARQL cross-check of these dependencies. This is a tooling/connectivity gap, not a confirmed negative, and is separately corroborated by the direct `packages.ubuntu.com` check in Section 8, which did return a definitive result for the top-level `micro-ros` package name.

**Cross-reference to `projects.yml`:** None of micro-ROS's actual dependencies (Micro-CDR, Micro-XRCE-DDS-Client, rclc, rcutils, eProsima, FastDDS, FastCDR, DDS) appear in this repository's tracked project scope (`/home/user/sw-ecosystem/projects.yml`); no cross-links to other `project-reports/<slug>.md` reports apply.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [micro_ros_espidf_component #216](https://github.com/micro-ROS/micro_ros_espidf_component/issues/216) | Can't create subscriber on ESP32-C3 | Open (since 2023-12-10, 2+ years) | High - correctness crash | Illegal-instruction crash at `rmw_wait` when a subscriber is created on a RISC-V-cored ESP32-C3; publisher-only examples work. A 2026-05-29 comment links Issue #288's fix as the likely resolution, but the thread is not formally closed. |
| [micro_ros_espidf_component #288](https://github.com/micro-ROS/micro_ros_espidf_component/issues/288) | Parameter server issue with ESP32c6 | Open (since 2025-04-11) | High - correctness crash, root cause identified | RISC-V no-FPU float-division miscompilation (`(int32_t)((float)timeout.i32 / (float)available_contexts)`) in `rmw_microxrcedds`; integer-division fix identified by the reporter but no confirmed upstream merge into `rmw_microxrcedds` is visible. |
| [micro_ros_arduino #1820](https://github.com/micro-ROS/micro_ros_arduino/issues/1820) | Any update plans for esp32S3 or esp32C3? | Open (since 2024-08-21) | Medium - feature request, no maintainer response | Confirms `micro_ros_arduino` has no native RISC-V-core support; community-only responses point to the unofficial `micro_ros_platformio` project as a workaround. |

**Correctness bugs highlighted separately:** Issues #216 and #288 are both confirmed, reproducible correctness bugs specific to RISC-V cores lacking a hardware FPU - this is the only concrete, technically substantiated RISC-V defect pattern found anywhere in the micro-ROS organization. No performance benchmark data (RISC-V vs. ARM/other) was found in any searched source: the project's own `micro-ROS/benchmarking` and `micro-ROS/benchmarking-results` repositories are ARM-only (Olimex E407, STM32L152-Discovery) and the latter is archived since June 2023 with results predating RISC-V relevance (OFERA project deliverables 2019-2021, an EU H2020 project unrelated to RISE). A WebSearch-suggested benchmark citation (arXiv 2307.04148) was directly fetched and verified to **not** mention micro-ROS at all - flagged as a false attribution to avoid propagating it.

## 12. Objections and Upstream Blockers

**Stated objections:** None found - no maintainer has stated an objection to RISC-V support. The absence is one of inaction/lack of resourcing, not stated technical opposition.

**Technical blockers:**
- ESP32-C3/C6 RISC-V cores lack a hardware FPU by default, which caused the confirmed float-division miscompilation bug (Issue #288) - this is a real, demonstrated technical hazard for any future RISC-V work in this stack, not merely a theoretical risk.
- ESP32-C6 required ESP-IDF >=5.0, creating a CI-matrix compatibility gate (resolved for that specific board via a CI exclude rule in PR #274, not a toolchain fix) - illustrating that even the already-merged RISC-V-core work required nontrivial CI accommodation.
- No riscv64 (application-class Linux) target exists in the product line at all - micro-ROS targets bare-metal MCUs exclusively.

**Organizational blockers:**
- Single-vendor maintenance model (eProsima) with new ports pitched as a paid commercial service, not a community-funded roadmap item.
- Issue #1820 (RISC-V-core support request in the Arduino wrapper) has zero maintainer engagement in over two years.
- No RISE (RISC-V Software Ecosystem) involvement of any kind was found - confirmed by checking the RISE blog (34 posts, none mention micro-ROS/ROS/robotics), RISE membership lists (no eProsima/ROS/micro-ROS), the RISE Python wheel builder (not listed), and the `riseproject-dev` GitHub org (no dedicated repo; only two internal candidate-tracking-list mentions inside this report repository itself, not evidence of funded work).

**Acceptance probability:** Low in the near term absent external funding or a dedicated contributor, given the multi-year unresolved status of the existing RISC-V-core request (#1820) and the multi-year gap between the RISC-V float bug's first report (#216, Dec 2023) and its root cause being identified and cross-linked (#288 fix noted May 2026).

## 13. Readiness Assessment

- **Color:** orange (base orange - no upstream riscv64 CI, and no downstream/distro package exists at all to apply the distribution floor)
- **Release provider:** none (no channel - upstream, RISE, distro, or third-party - publishes a riscv64 artifact for micro-ROS; the project does not even publish prebuilt binaries for its existing supported architectures, being a source-compiled Arduino library)
- **Optimization level:** not applicable - micro-ROS is a robotics communication middleware, not a speed-optimization library measured against a reference implementation; Section 2's optimization-purpose test does not trigger for this project.
- **Justification:** `micro-ROS/micro_ros_arduino` has zero riscv64 CI (confirmed by reading [`ci.yml`](https://github.com/micro-ROS/micro_ros_arduino/blob/main/.github/workflows/ci.yml) and [`library_generation.yml`](https://github.com/micro-ROS/micro_ros_arduino/blob/main/.github/workflows/library_generation.yml) directly - both build only ARM/AVR/Xtensa targets on standard x86_64 runners), zero riscv64 source or toolchain files, and no distribution channel (PyPI, Ubuntu, GitHub releases) ships any binary for this project on any architecture, riscv64 included, since it is source-distributed and compiled on-device. This rules out the distribution floor (there is nothing to floor against) and keeps the grade at base orange rather than yellow. The project's closest RISC-V-adjacent activity - 32-bit RISC-V MCU core (ESP32-C3/C6) support - exists only in the separate `micro_ros_espidf_component` repository, not in the Arduino wrapper covered by this report, and even there is affected by an unresolved correctness bug ([Issue #288](https://github.com/micro-ROS/micro_ros_espidf_component/issues/288)).
- **Pending work that could change the grade:** [Issue #1820](https://github.com/micro-ROS/micro_ros_arduino/issues/1820) (open community request for ESP32-C3/S3 support, no maintainer engagement) and the unresolved fix-escalation of [Issue #288](https://github.com/micro-ROS/micro_ros_espidf_component/issues/288) into `rmw_microxrcedds` are the only open threads that could move this grade, and neither has RISE or any funded-organization involvement attached. No RISE RFP, working group, or blog post references micro-ROS as funded or in-progress work.

## 14. Investment Analysis

**What RISE has already done or funded here: nothing.** Exhaustive checks (34 RISE blog posts, RISE member list, RISE Python wheel builder, `riseproject-dev` GitHub org repo search and org-wide code search, RISE RISC-V Runners usage) found zero RISE involvement, funding, or infrastructure use tied to micro-ROS. All sizing below is therefore full incremental work, not a delta on top of existing RISE investment.

### 14.1 Functional Enablement

Two separate tracks exist because the "RISC-V" concept splits across two different targets in this ecosystem:
- **RISC-V-core MCU support in `micro_ros_arduino`** (the repo in scope): propagate the existing ESP32-C3/C6 support from `micro_ros_espidf_component` up into the Arduino wrapper - add a `src/esp32c3`/`src/esp32c6` precompiled library target, a toolchain cmake file, and a board entry in the CI matrix and README. The float-division no-FPU bug (Issue #288) must be fixed/verified upstream in `rmw_microxrcedds` first, since it would otherwise reproduce in the Arduino wrapper too.
- **riscv64 (application-class Linux) support:** not applicable - this project does not target 64-bit Linux application processors as a platform category at all; there is no functional-enablement work item here distinct from the MCU-core track above.

### 14.2 Performance Optimization

Not applicable - no optimization-purpose code path exists in this stack (Section 4), and no riscv64/RISC-V build exists to benchmark against ARM/Xtensa in the first place.

### 14.3 CI/CD Infrastructure

Add an ESP32-C3/C6 (RISC-V-core) compile job to `micro_ros_arduino`'s `ci.yml`, mirroring the existing `esp32:esp32` compile-only pattern; no test-execution capability currently exists for any architecture in this CI, so parity with existing boards would still be compile-only, not a true test-passing tier. No riscv64 (Linux) CI is applicable given the project's MCU-only scope.

### 14.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale: this is a standalone embedded library with no dependent package ecosystem (no PyPI/npm/Maven consumers depend on riscv64 wheels of this project; it does not exist on PyPI at all).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify/land the Issue #288 float-division fix upstream in `rmw_microxrcedds` (root cause already identified in the issue thread) | 1-2 | eProsima (upstream maintainer) | High - blocks any RISC-V-core reliability claim |
| Functional | Propagate ESP32-C3/C6 support from `micro_ros_espidf_component` into `micro_ros_arduino` (toolchain cmake, precompiled lib target, board entry, README update) | 3-5 | eProsima or a funded contributor | Medium - addresses a 2+ year open community request (#1820) |
| CI/CD | Add ESP32-C3/C6 compile job to `micro_ros_arduino`'s `ci.yml` | 1 | eProsima or a funded contributor | Medium - depends on the functional item above landing first |
| CI/CD | Introduce flash-and-execute test coverage (currently absent for every architecture, not just RISC-V) | 4-8 | eProsima | Low relative to RISC-V specifically, but a prerequisite for any board - including a future RISC-V one - to reach blue/green under this grading model |
| Functional | riscv64 (Linux, application-class) support | N/A | N/A | Not applicable - outside this project's product scope as a bare-metal MCU library |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [micro-ROS/micro_ros_arduino repository](https://github.com/micro-ROS/micro_ros_arduino)
- [micro-ROS homepage](https://micro.ros.org/)
- [micro.vulcanexus.org (eProsima commercial port-hosting page)](https://micro.vulcanexus.org/)
- [micro_ros_arduino ci.yml](https://github.com/micro-ROS/micro_ros_arduino/blob/main/.github/workflows/ci.yml)
- [micro_ros_arduino library_generation.yml](https://github.com/micro-ROS/micro_ros_arduino/blob/main/.github/workflows/library_generation.yml)
- [Issue #1820: Any update plans for esp32S3 or esp32C3?](https://github.com/micro-ROS/micro_ros_arduino/issues/1820)
- [micro_ros_espidf_component repository](https://github.com/micro-ROS/micro_ros_espidf_component)
- [PR #52: ESP32c3 support](https://github.com/micro-ROS/micro_ros_espidf_component/pull/52)
- [PR #176: IDF5 support and RISC-V target generalization](https://github.com/micro-ROS/micro_ros_espidf_component)
- [PR #274: Initial support for the ESP32 C6 board](https://github.com/micro-ROS/micro_ros_espidf_component/pull/274)
- [Issue #216: Can't create subscriber on ESP32-C3](https://github.com/micro-ROS/micro_ros_espidf_component/issues/216)
- [Issue #288: Parameter server issue with ESP32c6](https://github.com/micro-ROS/micro_ros_espidf_component/issues/288)
- [micro-ROS/benchmarking repository](https://github.com/micro-ROS/benchmarking)
- [micro-ROS/benchmarking-results repository (archived)](https://github.com/micro-ROS/benchmarking-results)
- [PyPI micro-ros package JSON endpoint (404)](https://pypi.org/pypi/micro-ros/json)
- [PyPI micro-ros simple index (404)](https://pypi.org/simple/micro-ros/)
- [RISE Python wheel builder GitLab API endpoint for micro-ros](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/micro-ros/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu package search: micro-ROS, suite=resolute](https://packages.ubuntu.com/search?keywords=micro-ROS&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V status page](https://archriscv.felixc.at/)
- [riseproject.dev blog index](https://riseproject.dev/blog/)
- [riseproject.dev homepage (member list)](https://riseproject.dev/)
- [RISE blog: Tested on Real Silicon - Automating RISC-V Hardware-in-the-Loop](https://riseproject.dev/2025/09/01/tested-on-real-silicon-automating-risc-v-hardware-in-the-loop/)
- [rmw_microxrcedds PLATFORM_SUPPORT.md](https://github.com/micro-ROS/rmw_microxrcedds)
- [rosidl_typesupport_microxrcedds PLATFORM_SUPPORT.md](https://github.com/micro-ROS/rosidl_typesupport_microxrcedds)
- [arXiv 2307.04148 - Towards a RISC-V Open Platform for Next-generation Automotive ECUs (checked directly, does not mention micro-ROS)](https://arxiv.org/abs/2307.04148)