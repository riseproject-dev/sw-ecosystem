---
title: OpenThread
parent: Project Reports
color: orange
dependencies:
  - name: Mbed TLS
    relation: runtime-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: gRPC
    relation: test-dependency
    criticality: optional
  - name: Protocol Buffers
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="openthread" %}

# OpenThread

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenThread<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

OpenThread ([github.com/openthread/openthread](https://github.com/openthread/openthread)) is a portable C/C++ implementation of the Thread mesh-networking protocol (IEEE 802.15.4-based) for embedded/IoT devices, originally released by Nest Labs and now run by Google. It is BSD 3-Clause licensed (`LICENSE`, copyright "The OpenThread Authors", 2016-origin). It is a Thread Certified Component, meaning the Thread Group governs the underlying protocol specification (currently 1.4.0), not the codebase itself.

There is no separate foundation (it is not a Linux Foundation or CNCF project). Governance is a standard Google-run open-source model: fork-and-pull PRs gated by a Google CLA ([cla.developers.google.com](https://cla.developers.google.com)). No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the main repo.

Top committers by volume, all Google-affiliated: Abtin Keshavarzian (`abtink@google.com`, 901 commits, apparent lead maintainer), Jonathan Hui (`jonhui@google.com`, 521 commits), Yakun Xu, Zhanglong Xia, Li Cao, Yang Song. Esko Dijk (independent) is one of the few non-Google top contributors. The `AUTHORS` file lists corporate copyright holders including Nest Labs, Microsoft, Nordic Semiconductor, Texas Instruments, NXP Semiconductors, Synopsys, Cascoda, and Silicon Laboratories. The README's sponsor banner lists 20+ silicon/product companies: Amazon, Aqara, ARM, Beken, Cascoda, Eero, Espressif, Google, Infineon, MMB Networks, Nabu Casa, Nanoleaf, Nordic, NXP, Qorvo, Qualcomm, Samsung, Silicon Labs, STMicroelectronics, Synopsys, Telink Semiconductor, Texas Instruments, and Zephyr Project.

**Community culture on new ports:** there is no formal platform-tier acceptance policy (no `PLATFORMS.md`/`SUPPORT.md`). `examples/platforms/` in the core repo contains only `simulation`, `zephyr`, and `utils`. Vendor-specific SoC ports live in separate satellite repos under the `openthread` GitHub org (e.g. `ot-nrf528xx`, `ot-efr32`, `ot-nxp`, `ot-qorvo`, `ot-cc13x2-cc26x2`, `ot-cc2538`, `ot-esp32`, `ot-b91`, `ot-samr21`, `ot-kw41z`, `ot-ifx`, `ot-realtek`), typically created and owned by the sponsoring vendor. Several are now archived (`ot-esp32`, `ot-cc13x2-cc26x2`, `ot-samr21`, `ot-kw41z`), indicating maintenance lapses once vendor sponsorship winds down.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64-specific commit, PR, or issue exists in `openthread/openthread` | Confirmed via `mcp__github__search_issues`, `search_pull_requests`, `search_commits`, and `search_code` against `repo:openthread/openthread`, all returning 0 results across multiple independent passes |
| 2021-05-18 | First commit (`5cd1b46`, "Initial commit.") to `openthread/ot-b91`, a separate downstream repo targeting the Telink B91 SoC (RISC-V32/Andes D25F core), by Yiyang Tian (`yiyang.tian@telink-semi.com`), a Telink Semiconductor engineer | [openthread/ot-b91](https://github.com/openthread/ot-b91) commit history, local clone HEAD `f2813c0f` |
| 2021-06-09 | `openthread/ot-b91` repository created on GitHub | GitHub repository metadata |

`ot-b91` contributor breakdown is dominated by `dependabot[bot]` (1,112 automated submodule-bump commits), with a small number of human commits from Jonathan Hui (Google, 11), Zhanglong Xia (Google, 1), and the original Telink author. No commit matching "riscv"/"RISC-V" in commit-message text was found anywhere in the `openthread` GitHub org (0 hits via commit-message search) - all RISC-V evidence in `ot-b91` is in code/config content (CMake toolchain files, headers, linker scripts), not commit messages.

**Is it fully upstream?** No. There is no RISC-V port in `openthread/openthread` (the core repo). The only RISC-V-targeting code in the `openthread` org lives in `ot-b91`, a vendor-authored, dependabot-maintained satellite platform-port repository, not integrated into or actively developed by the core Google maintainer team. There is no master tracking issue for a riscv64 (or riscv32) port in the core repo.

## 3. Upstream Support Tier

No formal tier policy document exists (no `PLATFORMS.md`, `SUPPORT.md`, or documented "Tier 1/2/community" system). CI variance in `openthread/openthread` is organized by platform configuration (posix/simulation/toranj/nexus/etc.), not by CPU ISA - there is no ISA-gated build matrix for amd64/arm64/riscv64 in the sense of an explicit tier system.

| Arch | Upstream CI | Test execution | Official release artifact |
|---|---|---|---|
| amd64 | Present (general workflow runs; `docker.yml` explicitly builds `linux/amd64`) | Yes (`unit.yml`, `posix.yml`, `simulation.yml`, etc. execute against the general CI matrix) | Docker images tagged `linux/amd64` |
| arm64 | Present (`docker.yml` explicitly targets `linux/arm64`) | Data not available: findings did not confirm arm64-specific test execution beyond the Docker multi-arch build step | Docker images tagged `linux/arm64` |
| riscv64 | Absent - confirmed by direct reading of every CI workflow file in `.github/workflows/` (19 files, case-insensitive grep for "riscv"/"riscv64"/"RISC-V"/"RISCV", zero matches); no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repo | No | None found in any channel checked (Section 8) |

Note: earlier research passes cited "18" CI workflow files; a later, independent verification pass explicitly recounted the same directory and found 19 files totaling 3,104 lines (`build.yml`, `codeql.yml`, `docker.yml`, `fuzz.yml`, `makefile-check.yml`, `monthly-release.yml`, `nexus.yml`, `otbr-posix-dind.yml`, `otbr.yml`, `otci.yml`, `otns.yml`, `posix.yml`, `scorecards.yml`, `simulation.yml`, `size-check.yml`, `size-report.yml`, `toranj.yml`, `unit.yml`, `version.yml`). This is a discrepancy between two research passes (both citing the same file list); the file-name enumeration itself is consistent across both, and the riscv-related conclusion (zero matches) is identical in both passes.

## 4. Technical Architecture and RISC-V-Specific Subsystems

OpenThread has no JIT, no in-tree SIMD, and no in-tree cryptography implementation - cryptography is delegated entirely to the Mbed TLS submodule (Section 9), external to this repo's scope.

A full-repository grep for ISA-conditional guards (`__riscv`, `__x86_64__`, `__aarch64__`, `__arm__`, `__ARM_NEON`, `__SSE`, `__AVX`, `__amd64`) across `src/`, `include/`, and `examples/` returned **zero matches everywhere**. The Thread protocol core (`src/core`), the POSIX/RCP host platform (`src/posix`), the CLI, the NCP layer, and `examples/platforms/{simulation,utils,zephyr}` contain no CPU-ISA-conditional code at all, for any architecture. This was independently confirmed via GitHub's live code-search index: `__riscv repo:openthread/openthread` (0), `riscv64 repo:openthread/openthread` (0), `__aarch64__ repo:openthread/openthread` (0), `__x86_64__ repo:openthread/openthread` (1 hit).

The single architecture-conditional block in the entire repository is in `tools/spi-hdlc-adapter/spi-hdlc-adapter.c` (a standalone Linux userspace SPI-to-HDLC bridge daemon, not part of the Thread protocol stack), lines 344-352:
```c
#if defined(__x86_64__)
    stack[1] = (void *)uc->uc_mcontext.gregs[REG_RIP];
#elif defined(__i386__)
    stack[1] = (void *)uc->uc_mcontext.gregs[REG_EIP];
#elif defined(__arm__)
    stack[1] = (void *)uc->uc_mcontext.arm_ip;
#else
#warning TODO: Add this arch to signal_critical
#endif
```
This patches a debug backtrace's fault-address pointer inside a SIGSEGV/SIGBUS crash handler. Both riscv64 and arm64/aarch64 fall to the identical `#else`/`#warning` path - riscv64 is not singled out for worse treatment; it is simply unenumerated, exactly as arm64 is here.

`CMakeLists.txt` (root), `CMakePresets.json`, and `src/posix/CMakeLists.txt` contain no `CMAKE_SYSTEM_PROCESSOR` gating or architecture allowlist - nothing in the build system structurally blocks a riscv64 target from configuring or building.

**Conclusion:** there is no "riscv64 implementation" to grade as full/partial/scalar, because no architecture-specific implementation surface exists for any architecture in `openthread/openthread`. This reflects the project's design: MCU/ISA-specific code lives in downstream platform repos (`ot-*`), not in the core repo.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Thread protocol core (`src/core`) | Generic C++, no ISA-specific code | Generic C++, no ISA-specific code | Generic C++, no ISA-specific code |
| POSIX/RCP host platform (`src/posix`) | Generic, no ISA branches | Generic, no ISA branches | Generic, no ISA branches (untested upstream) |
| Crypto (Mbed TLS backend) | External submodule, out of this repo's scope | External submodule, out of this repo's scope | External submodule, out of this repo's scope; Ubuntu 26.04 riscv64 packages exist (Section 9) |
| `tools/spi-hdlc-adapter` debug backtrace | Precise (`REG_RIP` resolved) | Falls to `#else`/`#warning` (same as riscv64) | Falls to `#else`/`#warning` (same as arm64); degrades one debug line only, does not block build or operation |

## 5. Build System, Cross-Compilation, and Toolchain

Build entry points: `./script/bootstrap` then `./script/cmake-build <platform> [-D...]`, or raw `cmake -GNinja -DOT_PLATFORM=<platform> ..` (as shown in `etc/docker/environment/Dockerfile`). `OT_PLATFORM` branches only on `posix`, `external`, `nexus`, or an `examples/platforms/<OT_PLATFORM>` subdirectory - whose contents are limited to `simulation`, `zephyr`, and `utils`. No silicon-vendor RISC-V port exists in the core repo's build tree.

No `BUILDING.md`, `INSTALL`/`INSTALL.md`, or `docs/` directory exists in this repo (`doc/` contains only Doxygen config and images); the README points to [openthread.io](https://openthread.io/) for build documentation. No `cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake`, or any riscv-named toolchain file exists.

Two Dockerfiles exist in the repo (`etc/docker/environment/Dockerfile`, `tools/harness-simulation/posix/etc/Dockerfile`); neither references riscv or cross-compilation. The environment Dockerfile is `FROM ubuntu:22.04` and builds the `simulation` platform natively. `.github/workflows/docker.yml`'s build matrix targets only `linux/amd64` and `linux/arm64` - no riscv64 target.

No known riscv64 build failures are documented, because no riscv64 build has ever been attempted or tracked upstream. Data not available: no riscv64 toolchain version requirement exists, because no riscv64 target is defined anywhere in the build system.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** none identified that are specific to riscv64. The codebase has no architecture branch that would functionally exclude riscv64. The only degraded behavior tied to an unlisted architecture (which includes riscv64 and arm64/aarch64 identically) is the single debug-backtrace line described in Section 4.

**Performance gaps:** Data not available: no riscv64 benchmark data (throughput, latency, memory footprint) exists in any channel searched - GitHub issue search on `openthread/openthread` for "riscv64 performance" and "riscv nan floating" returned 0 results, web searches for "OpenThread riscv64 benchmark" surfaced no on-topic results, and [riseproject.dev/blog](https://riseproject.dev/blog/) contains no post mentioning OpenThread.

**Security hardening gaps:** Data not available: no riscv64-specific hardening analysis was found. Crypto is delegated entirely to the Mbed TLS submodule; its only riscv-related historical issue, [Mbed-TLS/mbedtls#3066](https://github.com/Mbed-TLS/mbedtls/issues/3066) ("Hardening flag causes crash on 32-bit RISC-V systems", closed 2020), is RV32-specific and does not apply to riscv64.

**NaN/floating-point semantics:** Data not available: a GitHub issue search for "riscv nan floating" scoped to `openthread/openthread` returned 0 results. No floating-point/NaN bug tied to RISC-V was found for OpenThread.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Protocol/functional coverage | Full (reference platform for posix/simulation CI) | Full (Docker image published) | Data not available: unbuilt/untested upstream; no functional gap identified in source |
| Debug backtrace precision (`spi-hdlc-adapter`) | Full (`REG_RIP` resolved) | Degraded (`#warning` fallback) | Degraded (`#warning` fallback, same as arm64) |
| Performance benchmarks | Data not available in findings | Data not available in findings | Data not available: no riscv64 benchmark data found anywhere searched |

## 7. CI/CD Infrastructure

All 19 workflow files in `.github/workflows/` were read in full and grepped case-insensitively for "riscv"/"riscv64"/"RISC-V"/"RISCV": `build.yml`, `codeql.yml`, `docker.yml`, `fuzz.yml`, `makefile-check.yml`, `monthly-release.yml`, `nexus.yml`, `otbr-posix-dind.yml`, `otbr.yml`, `otci.yml`, `otns.yml`, `posix.yml`, `scorecards.yml`, `simulation.yml`, `size-check.yml`, `size-report.yml`, `toranj.yml`, `unit.yml`, `version.yml`. **Zero matches in any file.** No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository tree.

No RISE runner reference of any kind was found. An org-wide search of `riseproject-dev`'s 25 repositories found exactly one mention of "OpenThread" - a line in `riseproject-dev/sw-ecosystem/project-reports/.queue.yml` listing it as a queued research item (the task-tracking file behind this report), not evidence of RISE technical involvement.

`docker.yml` builds container images for `linux/amd64` and `linux/arm64` only.

| Arch | Upstream CI exists | Test execution | RISE runner used | Hardware |
|---|---|---|---|---|
| amd64 | Yes | Yes | No | Data not available: exact runner labels not confirmed in findings |
| arm64 | Yes (`docker.yml` `linux/arm64` build target) | Data not available beyond the Docker build step | No | Data not available |
| riscv64 | No | No | No | N/A |

## 8. Distribution and Release Status

OpenThread ships **no compiled binaries for any architecture, on any channel**. It is a source-only embedded SDK meant to be cross-compiled into vendor firmware.

- **GitHub releases:** `v2026.09.0`, `v2026.08.0`, `v2026.07.0`, `v2026.06.0` all carry zero attached binary assets. The release-assets endpoint for `v2026.09.0` shows only GitHub's auto-generated source archives (`v2026.09.0.zip`, `v2026.09.0.tar.gz`) - neither riscv64-named nor a compiled artifact.
- **PyPI:** [pypi.org/pypi/openthread/json](https://pypi.org/pypi/openthread/json) returns HTTP 404 - no package named `openthread` exists.
- **RISE wheel builder:** [gitlab.com/api/v4/projects/56254198/packages/pypi/simple/openthread/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/openthread/) redirects to the PyPI 404 above.
- **Ubuntu 26.04 ("resolute"):** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=OpenThread&suite=resolute&searchon=names&section=all) returns only `libopenthreads-dev` and `libopenthreads21` (3.6.5+dfsg1-11build3, architectures including riscv64) - a **name collision** with the unrelated "OpenThreads" C++ thread-abstraction library (OpenSceneGraph lineage), not the Thread networking project. No genuine `openthread`, `python3-openthread`, or `libopenthread` package exists for any architecture in this suite. A project-graph SPARQL query against Ubuntu 26.04 riscv64 for these exact package names returned zero rows.
- **Arch Linux RISC-V (archriscv):** front-page search for "openthread" returned no listing; a direct `riscv64/extra/` path returned 404.

**What a user must do to get a working binary:** clone the source, obtain a riscv64 GCC/Clang cross-toolchain (or a native compiler on a riscv64 Linux host, or the Zephyr RTOS SDK for an embedded riscv64 target), and build via CMake (`./script/cmake-build <platform>` or a Zephyr `west build`) themselves. No upstream-provided riscv64 artifact exists in any channel checked.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| [Mbed TLS](https://github.com/Mbed-TLS/mbedtls) (git submodule, `third_party/mbedtls/repo`, pinned `e185d7f`) | Sole cryptographic backend (TLS/DTLS, AES, ECC, SHA, PSA Crypto API) for Thread commissioning, DTLS, and mesh security. Blocking dependency. | Ubuntu 26.04 riscv64 packages present: `libmbedtls-dev`, `libmbedtls21`, `libmbedcrypto16`, `libmbedx509-7` | No open riscv64 issues in `Mbed-TLS/mbedtls`. One closed historical issue, [#3066](https://github.com/Mbed-TLS/mbedtls/issues/3066) ("Hardening flag causes crash on 32-bit RISC-V systems", closed 2020) - RV32-specific, not riscv64 | Ubuntu 26.04 ships current packages; upstream release status not independently queryable this session | None open and blocking |
| [GoogleTest/GoogleMock](https://github.com/google/googletest) (via `find_package(GTest CONFIG REQUIRED)`) | Test framework for OpenThread's native unit test suite. Test-only, not shipped in production firmware. | Ubuntu 26.04 riscv64 packages present: `libgtest-dev`, `libgmock-dev` | One open riscv64 issue: [google/googletest#3756](https://github.com/google/googletest/issues/3756) "GetThreadCountTest.ReturnsCorrectValue fails on risc-v64" (open since 2022) - a flaky/failing test, not a build blocker | N/A (library) | Open but non-blocking for build |
| [gRPC](https://github.com/grpc/grpc) (via `find_package(gRPC CONFIG REQUIRED)`) | RPC transport for the `nexus` test/simulation harness. Test-only. | Ubuntu 26.04 riscv64 packages present: `libgrpc-dev`, `libgrpc++-dev` | Historical riscv64 issues, all closed: [#41591](https://github.com/grpc/grpc/issues/41591), [#37791](https://github.com/grpc/grpc/issues/37791), [#35839](https://github.com/grpc/grpc/issues/35839) | Ubuntu 26.04 packages available | None open |
| [Protocol Buffers](https://github.com/protocolbuffers/protobuf) (via `find_package(Protobuf REQUIRED)`) | Message serialization for the `nexus` gRPC-based test harness. Test-only. | Ubuntu 26.04 riscv64 packages present: `libprotobuf-dev`, `protobuf-compiler`, `libprotoc-dev` | Historical riscv64 issues, all closed: [#12266](https://github.com/protocolbuffers/protobuf/issues/12266), [#14549](https://github.com/protocolbuffers/protobuf/issues/14549), [#17798](https://github.com/protocolbuffers/protobuf/issues/17798), [#13114](https://github.com/protocolbuffers/protobuf/issues/13114), [#4425](https://github.com/protocolbuffers/protobuf/issues/4425) | Ubuntu 26.04 packages available | None open |

No SIMD, JIT, numerics, compression, or memory-allocator dependencies exist in OpenThread's manifest; Mbed TLS (crypto) is the only category match among architecture-sensitive dependencies. All four dependencies above resolve cleanly on Ubuntu 26.04 riscv64, with only one open (non-blocking, test-tooling-only) riscv64 issue across all of them.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-specific issue, PR, or commit exists in `openthread/openthread` | N/A | N/A | Confirmed via multiple independent GitHub search passes (`search_issues`, `search_pull_requests`, `search_commits`, `search_code`), each returning 0 results, including a final independent verification pass |
| [openthread/openthread#11917](https://github.com/openthread/openthread/pull/11917) | "[mac] Add public default constructor to ExtAddress" | False-positive match on a fuzzy "RISC-V" search | N/A | Not RISC-V related; a C++ CRTP/constructor-visibility fix for `Mac::ExtAddress`, surfaced only via loose lexical matching on the hyphenated term |
| [google/googletest#3756](https://github.com/google/googletest/issues/3756) | `GetThreadCountTest.ReturnsCorrectValue` fails on risc-v64 | Open (since 2022) | Low - test-tooling dependency only, not part of shipped OpenThread firmware | Dependency-level issue, not an OpenThread bug (Section 9) |

**Correctness bugs:** none identified for OpenThread itself on riscv64 - there is nothing to report, positive or negative, because no riscv64 build of OpenThread has ever been exercised or tracked upstream.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No riscv64 tracking issue exists in which objections could have been recorded.

**Technical blockers:** none identified. Section 4 established that no ISA-specific code exists anywhere in `openthread/openthread` to be adapted for riscv64; the build system has no architecture allowlist blocking a riscv64 target. The only gap is validation (CI coverage and testing), not missing implementation.

**Organizational blockers:** no formal platform-tier acceptance process exists in the core repo (Section 1, Section 3). New SoC/ISA ports are conventionally created as independent satellite repos (`ot-<chip>`) by the sponsoring vendor rather than merged into the core repo - so a "riscv64 port" in the sense of a core-repo CI addition has no established precedent to follow. The existing riscv32 vendor port (`ot-b91`) illustrates the actual community pattern: vendor-authored, dependabot-maintained, with only light touch from Google core maintainers (Section 2).

**Acceptance probability:** [NEEDS VERIFICATION] - the project accepts platform and CI contributions via CLA-gated PRs from vendors and community members routinely (per the `AUTHORS` file's broad corporate contributor list and the satellite-repo pattern for new platforms), which suggests a riscv64 CI addition to the core repo would plausibly be accepted if submitted. This is an inference from observed governance pattern, not a stated upstream position, and is corroborated by only one source category (contributor/governance pattern), not a second independent confirmation.

## 13. Readiness Assessment

- **Color:** orange (no-upstream-ci, no-distro-package)
- **Release provider:** none
- **Optimization gap:** N/A - OpenThread is a portable networking protocol stack, not an optimization-purpose project (no JIT/SIMD/numerics differentiator); the Step 2 optimization modifier does not apply.
- **Justification:** `openthread/openthread` has no upstream riscv64 CI of any kind (zero references across all 19 `.github/workflows/*.yml` files, verified by direct file read: [`.github/workflows/`](https://github.com/openthread/openthread/tree/main/.github/workflows)), no riscv64 test execution, and no riscv64 release artifact in any channel checked - GitHub releases carry no binary assets at all ([releases](https://github.com/openthread/openthread/releases)), there is no PyPI package ([pypi.org/pypi/openthread/json](https://pypi.org/pypi/openthread/json) returns 404), and no genuine Ubuntu/Debian/Arch package exists under this name (the only riscv64-tagged Ubuntu hits, `libopenthreads-dev`/`libopenthreads21`, are an unrelated project via name collision). Per the color model's Step 1 table, "no upstream CI, no test, no release" defaults to orange rather than red, because there is positive evidence against breakage: a full-repository grep confirms zero ISA-specific code exists anywhere in the codebase for any architecture (Section 4), meaning there is no known technical reason riscv64 would fail to build - the gap is entirely a validation gap (no CI has ever attempted it), not a confirmed-broken state, and not a total absence of reasoning basis that would justify grey/unknown.
- **Pending work that could change the grade:** none identified. There is no open PR, issue, or RISE engagement touching riscv64 for `openthread/openthread`. The only RISC-V activity in the `openthread` GitHub org is the unrelated, vendor-owned `ot-b91` platform-port repo (Section 2), which does not affect the core repo's CI/release posture. Adding a riscv64 job to the existing CI matrix (mirroring the `linux/arm64` pattern already present in `docker.yml`) would be sufficient to move this to blue, given the codebase's architecture-neutral design.

## 14. Investment Analysis

RISE has no recorded involvement with OpenThread (Section 2, Section 7): it is not a RISE Project member, has no RISE blog coverage, no RISE-funded work, and no RISE runner usage was found anywhere searched. No prior work exists to net out of the estimates below.

### 14.1 Functional Enablement

No functional/porting work is required: Section 4 confirms zero ISA-specific code exists anywhere in the repository, so there is no riscv64-specific implementation to write. The only enablement task is validating that the existing portable C++ codebase actually configures, builds, and passes its test suite on riscv64 - a verification exercise, not a development exercise.

### 14.2 Performance Optimization

Not applicable. OpenThread is not a compute- or SIMD-bound project (Section 6); there is no optimization surface to invest in, consistent with the "N/A" optimization-gap determination in Section 13.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to the relevant workflows (at minimum `build.yml`, `posix.yml`, `unit.yml`, `simulation.yml`), and extend `docker.yml`'s multi-arch image build to include `linux/riscv64` alongside the existing `linux/amd64`/`linux/arm64` targets (Section 5, Section 7). Given the total absence of ISA-specific code, this is expected to be a low-risk, low-effort addition, contingent on runner availability (e.g. via QEMU-based emulation, matching the pattern likely already used for `linux/arm64` in `docker.yml`, or native riscv64 hardware).

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report's own inclusion rule: OpenThread is a standalone embedded SDK with no PyPI package (confirmed 404), no npm package, and no dependent package ecosystem identified in the research findings.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify a riscv64 POSIX/simulation build configures and compiles cleanly (no code changes expected per Section 4) | 1 | Upstream OpenThread maintainer or contributor | High |
| Functional | Run the existing unit/posix/simulation test suites on riscv64 and triage any failures | 1-2 | Upstream OpenThread maintainer or contributor | High |
| CI/CD | Add a riscv64 job to `build.yml`/`posix.yml`/`unit.yml`/`simulation.yml`, mirroring existing amd64/arm64 jobs | 1-2 | Upstream OpenThread maintainer, or RISE if it chooses to engage | Medium |
| CI/CD | Extend `docker.yml` multi-arch image build to `linux/riscv64` | 0.5-1 | Upstream OpenThread maintainer | Medium |
| Dependency | Monitor open `google/googletest#3756` riscv64 test flake (test-tooling only, non-blocking) | 0.25 (monitoring) | N/A - track upstream | Low |

Effort figures above are engineering estimates based on the technical facts established in this report (zero ISA-specific code, all four dependencies already available on riscv64 Ubuntu, no known build blockers); they are not drawn from any upstream project-planning document, since none exists.

## 15. Updates

(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [openthread/openthread repository](https://github.com/openthread/openthread)
- [openthread/openthread CI workflows](https://github.com/openthread/openthread/tree/main/.github/workflows)
- [openthread/openthread releases](https://github.com/openthread/openthread/releases)
- [openthread/openthread PR #11917 (false-positive RISC-V search match)](https://github.com/openthread/openthread/pull/11917)
- [openthread/ot-b91 repository (Telink B91 RISC-V32 platform port)](https://github.com/openthread/ot-b91)
- [OpenThread homepage](https://openthread.io/)
- [Mbed-TLS/mbedtls repository](https://github.com/Mbed-TLS/mbedtls)
- [Mbed-TLS/mbedtls issue #3066 (RV32 hardening crash, closed)](https://github.com/Mbed-TLS/mbedtls/issues/3066)
- [google/googletest repository](https://github.com/google/googletest)
- [google/googletest issue #3756 (open riscv64 test flake)](https://github.com/google/googletest/issues/3756)
- [grpc/grpc repository](https://github.com/grpc/grpc)
- [grpc/grpc issue #41591 (closed)](https://github.com/grpc/grpc/issues/41591)
- [grpc/grpc issue #37791 (closed)](https://github.com/grpc/grpc/issues/37791)
- [grpc/grpc issue #35839 (closed)](https://github.com/grpc/grpc/issues/35839)
- [protocolbuffers/protobuf repository](https://github.com/protocolbuffers/protobuf)
- [protocolbuffers/protobuf issue #12266 (closed)](https://github.com/protocolbuffers/protobuf/issues/12266)
- [protocolbuffers/protobuf issue #14549 (closed)](https://github.com/protocolbuffers/protobuf/issues/14549)
- [protocolbuffers/protobuf issue #17798 (closed)](https://github.com/protocolbuffers/protobuf/issues/17798)
- [protocolbuffers/protobuf issue #13114 (closed)](https://github.com/protocolbuffers/protobuf/issues/13114)
- [protocolbuffers/protobuf issue #4425 (closed)](https://github.com/protocolbuffers/protobuf/issues/4425)
- [PyPI JSON API for "openthread" (404, no package exists)](https://pypi.org/pypi/openthread/json)
- [RISE Python wheel builder simple index for "openthread" (redirects to PyPI 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/openthread/)
- [Ubuntu package search for "OpenThread" on resolute suite](https://packages.ubuntu.com/search?keywords=OpenThread&suite=resolute&searchon=names&section=all)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [riseproject-dev/sw-ecosystem project-reports queue file (source of the OpenThread research task)](https://github.com/riseproject-dev/sw-ecosystem)
