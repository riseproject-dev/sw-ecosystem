---
title: CycloneDDS
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: Iceoryx
    relation: runtime-dependency
    criticality: optional
  - name: Iceoryx2
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" focus="cyclonedds" %}

# CycloneDDS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for CycloneDDS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

CycloneDDS is an implementation of the OMG Data Distribution Service (DDS) specification, written in portable C, used primarily as the default middleware for ROS 2 (via `rmw_cyclonedds`). It is an **incubating project under the Eclipse Foundation** (IoT working group), dual-licensed **Eclipse Public License 2.0 / Eclipse Distribution License 1.0** (SPDX: `EPL-2.0 OR BSD-3-Clause`).

Governance follows the Eclipse Development Process: write access is restricted to elected Committers; non-committer contributions require a signed Eclipse Contributor Agreement (ECA) plus DCO sign-off; changes land via PR with required peer review and passing CI; documentation updates are required alongside code per `CYCLONEDDS_QUALITY_DECLARATION.md` (written against ROS's REP-2004).

Listed sponsors on [cyclonedds.io](https://cyclonedds.io/): Eclipse Foundation, ZettaScale Technology, ADLINK Technology. By commit volume (3,819 commits, full unshallowed history), contribution is concentrated at:
- Erik Boasson (`eb@ilities.com`) - ~2,070 commits, project creator/lead
- Dennis Potman - 682 commits combined across `@adlinktech.com` and `@zettascale.tech` (reflecting the ADLINK -> ZettaScale transition)
- Jeroen Koekkoek (`@koekkoek.nl`) - 239 commits
- Matthias Killat (`@apex.ai`) - 88 commits
- Chris Lalancette (`@openrobotics.org`) - 26 commits, ROS 2 integration tie-in

Net: governance and code contribution are effectively concentrated in **ZettaScale Technology** (the DDS team spun out of ADLINK, now primary corporate steward) and predecessor **ADLINK Technology**, with secondary contributions from **Apex.AI** and **Open Robotics**.

No written community stance on new architecture ports was found. RISC-V has never been raised in any issue, PR, or discussion thread in the repository - the topic appears simply not to have come up, not to have been rejected.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64-related commit, PR, issue, or discussion exists in project history | `git log --all -i --grep='riscv'` and `git log --all -i -S'riscv'` on the full unshallowed clone (3,819 commits) - both zero matches |

There is no RISC-V port, no first RISC-V commit, and no upstreaming timeline to report. Confirmed via:
- `mcp__github__search_issues`, `mcp__github__search_pull_requests`, `mcp__github__search_commits`, `mcp__github__search_code` (queries: `riscv`, `riscv64`, `risc-v`, `RV64`, `sifive`, `__riscv`) against [eclipse-cyclonedds/cyclonedds](https://github.com/eclipse-cyclonedds/cyclonedds) - all returned `total_count: 0`.
- Full-repository case-insensitive `git grep -i "riscv"` on local clone (HEAD `5e95c750b316e2473bf1b082c5da289f0a85aa79`) - zero matches anywhere in source, docs, CMake, or CI config.

**Is it fully upstream?** There is no port to be upstream or not. The only functioning riscv64 artifact known to exist is a downstream Ubuntu build of unmodified upstream source (see Section 8), which upstream has never acknowledged, tracked, or validated.

## 3. Upstream Support Tier

Official tier policy per `docs/manual/installation/platforms.rst` (per ROS REP-2004 Quality Declaration, matching ROS 2's REP-2000 tier-1 set):
- **Tier 1**: Linux, macOS, Windows (CI covers Ubuntu 22.04/24.04 gcc/clang, macOS 14, Windows Server)
- **Secondary/caveated support**: FreeRTOS, QNX, OpenIndiana/Solaris
- `ports/` directory contains: `android`, `freertos-posix`, `mingw-w64`, `qnx`, `rtx64`, `solaris2.6`, `vxworks`, `zephyr` - **no riscv entry**.
- RISC-V/riscv64 is not listed at all in the platform support docs, not even as experimental.

Notably the project already runs on exotic combinations like Solaris 2.6 on SPARCv8, cited in the Quality Declaration as evidence of broad old-platform support, suggesting the portable C/`ddsrt` abstraction layer is not architecture-locked, even though no one has contributed a RISC-V-specific port or CI leg.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Formal tier | Tier 1 | Not explicitly enumerated by arch (OS-level tiering only) | Not listed at any tier |
| Upstream CI | Yes (`ubuntu-22.04`/`ubuntu-24.04` runners) | No dedicated arm64 job found in CI | No |
| Release-blocking | Yes (push/workflow_dispatch triggers) | N/A | N/A |
| Official binaries | Source-only (GitHub Releases ship tar.gz/zip only, no binaries for any arch) | Source-only | Source-only; distro-built only (Ubuntu, unpatched) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

CycloneDDS has **no architecture-specific hot-path code for any ISA** - no SIMD, no JIT, no hand-written assembly, anywhere in the codebase, for amd64, arm64, or riscv64 alike. This was confirmed by:
- File inventory: `*arm*` (1 file: `atomics/arm.h`), `*x86*` (4 files, all toolchain/CI config not source), `*riscv*` (0 files), `*amd64*` (0 files outside Windows/MSVC linker flags).
- Arch-guarded source search: x86/amd64 guards (`__x86_64__`, `_M_X64`) appear in 4 files (`atomics/gcc.h`, `atomics/msvc.h`, `idlpp/system.c`, `ddsi_sysdeps.c`); arm/aarch64 guards in 3 files; **riscv guards (`__riscv`) in 0 files**.
- GitHub code search for `riscv` and `__riscv` in `repo:eclipse-cyclonedds/cyclonedds` - 0 results.
- No SIMD intrinsics anywhere (`immintrin`, `arm_neon`, `_mm_` - all zero hits); MD5/CRC and all other operations are plain scalar portable C on every architecture including amd64 and arm64.

The only ISA-conditional logic in the entire codebase is the atomics abstraction layer (`src/ddsrt/include/dds/ddsrt/atomics/{arm,gcc,msvc,sun}.h`). `gcc.h` (984 lines) is the path any GCC/Clang riscv64 build takes: dispatch is **by compiler**, not by CPU (`#if __GNUC__ >= 4.1 -> gcc.h`), and it uses portable `__sync_*`/`__atomic_*` builtins for every operation. The only ISA-specific branch inside it is `!(defined __i386__ || __x86_64__ ...)`, which routes every non-x86 architecture (arm64, ppc, s390, mips, sparc, riscv64) into the same generic, conservative full-memory-fence path. No `#ifdef __riscv` is needed or present - riscv64 rides the identical generic path as arm64.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Atomics / memory ordering | Partial (C intrinsics, x86-specific fence micro-optimization) | Partial (C intrinsics, generic fence path) | Partial (C intrinsics, generic fence path) - identical tier to arm64 |
| SIMD-accelerated hashing/CRC | Scalar (none exist for any arch) | Scalar (none exist) | Scalar (none exist) - parity |
| OS/POSIX layer (threads, sockets, time, fs) | Full (glibc/POSIX, arch-agnostic) | Full | Full - arch-agnostic, riscv64 rides the same POSIX code path |
| Hand-written asm / ISA fast path | None anywhere | None anywhere | None anywhere |
| Toolchain/port files (`ports/`) | N/A (native) | Present (QNX aarch64le) | Missing - no `ports/riscv64.cmake` exists |
| CI build/test coverage | Full | None found (no dedicated arm64 job in CI matrix) | Missing |

**Conclusion:** This is not a riscv64 "stub" - there is no riscv64-specific code to be incomplete, because CycloneDDS's only ISA-conditional logic is written generically against GCC/Clang compiler builtins and automatically covers any GCC-supported target, riscv64 included, at parity with arm64. The verified gap for riscv64 is process, not code: zero CI, zero upstream tracking, zero upstream-published binaries.

## 5. Build System, Cross-Compilation, and Toolchain

No riscv64-specific build documentation, CMake toolchain file, or Dockerfile exists anywhere in the repository. Verified via `grep -rIln "riscv"` across the full working tree (zero matches), and inspection of `docs/manual/installation/*.rst`, `CMakeLists.txt`, and all `cmake/`/`ports/` files.

**Generic build** (per `docs/manual/installation/installation.dds_core.rst`), the only path available for riscv64 today:
```sh
git clone https://github.com/eclipse-cyclonedds/cyclonedds.git
cd cyclonedds
mkdir build && cd build
cmake -DCMAKE_INSTALL_PREFIX=<install-location> -DBUILD_EXAMPLES=ON ..
cmake --build . --parallel
cmake --build . --target install
```
Options: `-DENABLE_SSL=NO` (disable OpenSSL), `-DCMAKE_BUILD_TYPE=<Debug|Release|RelWithDebInfo|MinSizeRel>` (default `RelWithDebInfo`), `-DBUILD_TESTING=OFF`, `-DENABLE_LTO=OFF`.

**Toolchain requirements**: CMake >= 3.10 per doc prose, but `CMakeLists.txt` itself enforces `cmake_minimum_required(VERSION 3.16)` - 3.16 is the actual floor. C99 required if CMake < 3.21 or MSVC; otherwise C23 (`CMAKE_C_STANDARD 23`, not strict). No specific minimum GCC/Clang version is documented anywhere in the repo, for any platform.

**Cross-compiling mechanics** (`CMakeLists.txt` lines 26-79): when `CMAKE_CROSSCOMPILING` is set, `BUILD_IDLC` and `BUILD_DDSPERF` default to OFF, because `idlc` is a native code-generator tool that must run on the *host*. The documented pattern: build a native shared-library host build first, then cross-compile the target build with `-DCMAKE_CROSSCOMPILING=1 -DCMAKE_SYSTEM_NAME=<target-OS> -DCMAKE_PREFIX_PATH=<path to host build>` so the target build finds a host-built `idlc`.

No riscv64 toolchain file (e.g. `riscv64.cmake`) exists upstream. By the pattern of the existing `ports/mingw-w64/mingw-w64-x86_64.cmake` (12 lines: sets `CMAKE_SYSTEM_NAME`, `CMAKE_SYSTEM_PROCESSOR`, cross-compiler paths, `CMAKE_FIND_ROOT_PATH*`), a hand-written `riscv64.cmake` would need to be authored from scratch.

**QEMU usage**: none found anywhere in the repo (no CI job, no docs, no scripts).

**Known build failures on riscv64**: none documented, because no one has run the build on riscv64 within any tracked/reported context. Ubuntu's own Launchpad buildd infrastructure has successfully built the unmodified upstream source for riscv64 across multiple releases (see Section 8), which is positive indirect evidence the generic build path works, but this was not validated by upstream itself.

**Dockerfiles**: `scripts/docker/Dockerfile` and `scripts/docker/DockerfileCycloneDds` both `FROM ubuntu:jammy`/`ubuntu:cyclonedds`, x86_64 only, no architecture parameterization, no riscv64 variant.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core DDS runtime (`libddsc`) | Full, CI-tested | Full source support, no dedicated CI leg found | Builds via Ubuntu's unpatched packaging (Section 8); never CI-tested upstream |
| TLS/DDS-Security (OpenSSL-backed) | Full | Full | Depends on OpenSSL riscv64 status - OpenSSL has dedicated riscv64 CI (see Section 9), so this dependency chain is plausible, but never exercised together with CycloneDDS on riscv64 |
| Zero-copy shared-memory transport (Iceoryx PSMX) | Full | Full (Iceoryx packaged) | Iceoryx1 packaged for Ubuntu riscv64 via Debian, but upstream Iceoryx has zero riscv64 CI/footprint (see Section 9) - unverified chain |
| Zero-copy shared-memory transport (Iceoryx2, Rust) | Full | Full | No Ubuntu package exists at all; only route is `cargo build` from source; Rust target `riscv64gc-unknown-linux-gnu` is Tier 2 with Host Tools, but iceoryx2 itself has zero riscv mentions in source/CI |
| Python bindings (PyPI `cyclonedds`) | Wheel available | Wheel available (`macosx_11_0_arm64`) | No wheel; must build from source, no documented procedure |
| C++ bindings | Built and tested in CI (`cxx_bindings.yml`, ubuntu-22.04) | Not CI-tested | Not CI-tested |

**Functional gaps:** No functionality is known to be unavailable on riscv64 - the codebase is architecture-generic C with no missing per-arch stubs. The gap is entirely a validation gap: nothing has ever been built or run on riscv64 within any process upstream controls or observes.

**Performance gaps:** Not assessable - no SIMD paths exist for any architecture (Section 4), so there is no "missing SIMD" delta to measure; amd64/arm64/riscv64 are architecturally at parity for compute-path performance in this codebase. No riscv64 benchmark data exists (Section 12 below documents the exhaustive, unsuccessful search).

**Security hardening gaps:** Not assessable from available data. No riscv64-specific hardening (or lack thereof) is documented anywhere; this would need to be evaluated at the OpenSSL/Iceoryx dependency layer rather than in CycloneDDS itself.

**NaN / floating-point semantics issues:** None found. Zero GitHub issues (open or closed) in the repository mention RISC-V/riscv64/risc-v in any form - confirmed via exact-text GitHub search (`repo:eclipse-cyclonedds/cyclonedds riscv` -> 0 matches; `risc-v` variant -> 0 matches).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified by reading all 5 GitHub Actions workflow files in full, byte for byte, on the live default branch (`master`, HEAD `5e95c750b316e2473bf1b082c5da289f0a85aa79`):

| File | Job | `runs-on` values (all matrix entries) |
|---|---|---|
| [`linux.yml`](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/.github/workflows/linux.yml) | `cycloneDDS_linux` | `ubuntu-22.04`, `ubuntu-24.04` (x9 configs) |
| [`macos.yml`](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/.github/workflows/macos.yml) | `cycloneDDS_macos` | `macos-14` (x3 configs) |
| [`windows.yml`](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/.github/workflows/windows.yml) | `cycloneDDS_windows` | `windows-latest` (x4 configs) |
| [`cxx_bindings.yml`](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/.github/workflows/cxx_bindings.yml) | `cxx_bindings` | `ubuntu-22.04` |
| [`python_bindings.yml`](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/.github/workflows/python_bindings.yml) | `python_bindings` | `ubuntu-24.04` |

Every `os:`/`runs-on:` value is a stock GitHub-hosted x86_64 runner. No `arm`, no `riscv`, no self-hosted runner label, no QEMU setup step (`docker/setup-qemu-action` or equivalent - absent from all 5 files), no cross-arch container build. The one `crosscompiling: true` flag (in `linux.yml`'s "static release iceoryx" config) only re-derives the same OS/arch the runner already is (`ubuntu-24.04`, x86_64) via `-DCMAKE_SYSTEM_NAME=$RUNNER_OS` - it is not a riscv64 cross-compile and mentions no architecture at all.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist anywhere in the repo.

Trigger conditions (identical across all 5 files):
```yaml
on:
  push:
    branches: "*"
  workflow_dispatch:
```
`pull_request` is commented out repo-wide ("Disable for now, we are testing a lot"); only `push` and manual `workflow_dispatch` trigger CI.

No RISE RISC-V runner references (`riseproject-dev`, `ubuntu-24.04-riscv` labels, etc.) found anywhere in CI config.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes | No dedicated arm64 job found | No |
| CI test | Yes | No | No |
| CI release-blocking | Push/dispatch triggered | N/A | N/A |
| Runner type | GitHub-hosted x86_64 | N/A | N/A |
| RISE runner usage | N/A | N/A | None |

## 8. Distribution and Release Status

**GitHub Releases** ship source archives only (`.zip`, `.tar.gz`) for every version checked (`11.0.1`, `0.10.5`) - no prebuilt binaries of any architecture exist at all. Confirmed via [expanded_assets/11.0.1](https://github.com/eclipse-cyclonedds/cyclonedds/releases/expanded_assets/11.0.1) and [expanded_assets/0.10.5](https://github.com/eclipse-cyclonedds/cyclonedds/releases/expanded_assets/0.10.5).

**PyPI** (`cyclonedds` package): wheel filenames cover `macosx_11_0_arm64`, `macosx_10_9_x86_64`, `macosx_10_13_x86_64`, `manylinux_2_17_x86_64.manylinux2014_x86_64`, `musllinux_1_1_x86_64`, `win_amd64` (cp310-cp313), plus sdist. **No riscv64 wheel.** Confirmed via direct `curl` of [pypi.org/pypi/cyclonedds/json](https://pypi.org/pypi/cyclonedds/json).

**RISE GitLab wheel mirror**: `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/cyclonedds/` 302-redirects to `pypi.org/simple/cyclonedds/` - no separate RISE-built riscv64 wheels are being served; it just forwards to upstream PyPI (same result as above).

**Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at/?q=cyclonedds)): no listing for cyclonedds at all.

**Ubuntu/Debian - the only channel with a real riscv64 binary.** Confirmed at the strongest evidentiary level via the actual archive pool directory listing at `ports.ubuntu.com/pool/universe/c/cyclonedds/`, not just the `packages.ubuntu.com` search page:
- Named, dated `.deb` files with riscv64 in the filename exist across five build generations: `0.8.2-5` (2022-01-27), `0.10.4-1.1build3` (2024-04-15), `0.10.5-1` (2024-05-18), `0.10.5-1build1` (2026-01-17), `0.10.5-1build2` (2026-07-24, "Stonking Stingray").
- Packages built: **`cyclonedds-dev`, `cyclonedds-tools`, `libcycloneddsidl0t64`, and `libddsc0t64`** (the core DDS runtime library) - all four confirmed present for riscv64 as of the latest build.
- `cyclonedds-doc` is arch:all (docs only, not arch-specific).
- Also confirmed via [packages.ubuntu.com search for Ubuntu 26.04 "resolute"](https://packages.ubuntu.com/search?keywords=CycloneDDS&suite=resolute&searchon=names&section=all): `cyclonedds-dev` 0.10.5-1build1 - amd64 arm64 armhf ppc64el **riscv64** s390x (and likewise for `cyclonedds-tools`, `libcycloneddsidl0t64`).
- These builds are of **unmodified upstream source**: no `ports/riscv64` toolchain file, no riscv-specific CMake branch, and no riscv-specific patches were found in the packaging diff. This is a clean, unpatched distro build.
- No `python3-cyclonedds` Ubuntu binary package was found - only the C library/tools are packaged; the PyPI Python bindings lack riscv64 wheels entirely (Section above).

**What a user must do to get a working binary today:** On Ubuntu 24.04+/26.04 (or Debian riscv64 ports), `apt install cyclonedds-dev cyclonedds-tools` installs a working native riscv64 build of the core library and CLI tools. For the Python bindings, or for any use case requiring an upstream-published artifact, the user must build from source (Section 5) - there is no upstream binary distribution channel for riscv64 at all.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| OpenSSL | TLS transport + DDS-Security auth/encryption. Optional (`ENABLE_SSL=AUTO`). | Green - Ubuntu 26.04 riscv64 (`libssl-dev` 3.5.5-1ubuntu3); upstream has dedicated riscv64 CI since 2022 (13-way scalar+vector matrix) | Green under QEMU; no native riscv64 hardware runners upstream (structural gap) | Green - Debian sid, Ubuntu 24.04/26.04, Arch Linux RISC-V all ship riscv64 builds | Active upstream riscv64 maintenance |
| Eclipse Iceoryx (`iceoryx_hoofs`+`iceoryx_posh`) | Shared-memory zero-copy transport backing legacy C++ PSMX plugin. Optional (`ENABLE_ICEORYX=AUTO`). | Ubuntu 26.04 riscv64 package exists (`libiceoryx-hoofs-dev`/`libiceoryx-posh-dev`, v2.0.6+dfsg-2), but upstream has zero riscv64 footprint: no "riscv" string anywhere in source, CI matrix is `ubuntu-24.04`/`ubuntu-22.04`/windows/macos only, 0 riscv64 issues found | No CI evidence either way upstream | Ubuntu/Debian riscv64 .deb exists but is the older 2.0.6 line vs. current upstream 2.95.8 | No dedicated project report exists for Iceoryx in this research corpus |
| Eclipse Iceoryx2 (Rust, `iceoryx2-c` FFI) | Newer shared-memory IPC layer, explicitly preferred over Iceoryx1 per a `src/CMakeLists.txt` comment. Optional (`ENABLE_ICEORYX2=AUTO`). | Not found in Ubuntu 26.04 riscv64 - no `iceoryx2` package exists in Ubuntu; distributed via crates.io, not apt. Rust target `riscv64gc-unknown-linux-gnu` is Tier 2 with Host Tools, so from-source build is plausible, but repo has zero riscv mentions in source/CI; CI OS matrix natively tests aarch64 (`ubuntu-24.04-arm`) but never riscv64 | No evidence of any riscv64 testing, upstream or downstream | Not distributed via any Linux distro; only route is `cargo build`/CMake-from-source | Largest unknown of the three dependencies - no packaging signal at all |

**Deep-dive - OpenSSL** (only dependency with crypto/numerics relevance): actively riscv64-maintained upstream, packaged in Ubuntu 26.04 riscv64. Known open issues affecting riscv64 (per this project's OpenSSL-specific research, cited for completeness): AES T-table not constant-time without Zkn/Zvkned extensions (critical, fix PRs #31080/#31082 open) [NEEDS VERIFICATION - PR numbers sourced from a separate OpenSSL-focused research pass not independently re-verified in this CycloneDDS-scoped session]; SSL test hangs at `HARNESS_JOBS>=38` (#22166, open since 2023) [NEEDS VERIFICATION]; musl Zbb detection broken (#28118) [NEEDS VERIFICATION]; `no-deprecated` cross-compile fails (#29357, fix PR open) [NEEDS VERIFICATION].

**Note on dependency graph tooling:** The project-graph MCP server failed to connect (`CONNECTION_CLOSED`, confirmed on repeated attempts) - this is a connection failure, not evidence of absence. The "found/not found" calls above rest on live `packages.ubuntu.com`/`ports.ubuntu.com` lookups rather than the ontology-backed dependency graph, and the transitive dependency chain query was not performed. This should be re-run once project-graph is reachable.

**CycloneDDS's own atomics abstraction** falls through to the generic GCC/Clang `__atomic`/`__sync` builtins path for riscv64 (Section 4) - a favorable sign, no missing arch backend.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | *No riscv64-related issue or PR exists in this repository* | N/A | N/A | Confirmed via `mcp__github__search_issues`/`search_pull_requests`/`search_commits`/`search_code` (queries: `riscv`, `riscv64`, `risc-v`, `RV64`, `sifive`, `__riscv`) against [eclipse-cyclonedds/cyclonedds](https://github.com/eclipse-cyclonedds/cyclonedds) - all `total_count: 0` |

The only tangentially related item found in exhaustive searching: [Issue #1366](https://github.com/eclipse-cyclonedds/cyclonedds/issues/1366) - "How can I do Cross Compile for ARM64" - closed 2022-08-31, opened 2022-08-11. About cross-compiling for ARM64 (idlc build errors), **unrelated to RISC-V**, included only for completeness as the sole architecture-porting issue in the tracker.

**Correctness bugs:** None exist to report - zero riscv64 issues means zero riscv64 correctness/NaN/floating-point bugs are documented, open or closed.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer, issue, or PR contains any statement for or against riscv64 support - the topic has never been raised in the project's history.

**Technical blockers:** None identified. The codebase is architecture-generic C with no missing per-arch abstraction for riscv64 (Section 4); Ubuntu's own unpatched build succeeding is positive evidence against a build blocker existing.

**Organizational blockers:** The practical blocker is that no one - not the Eclipse Foundation, not ZettaScale, not any RISE-adjacent party - has proposed or contributed a riscv64 CI leg. Any new platform support would go through the standard PR + peer review + CI + doc-update process gated by Eclipse Committers (per `CONTRIBUTING.md`/Quality Declaration), but no such PR has ever been opened.

**RISE Project involvement:** None found. Exhaustively checked: [riseproject.dev/blog](https://riseproject.dev/blog) RSS feed (9 posts, Mar-Aug 2026, none mention CycloneDDS/DDS/middleware), [riseproject.dev/members/](https://riseproject.dev/members/) (CycloneDDS/Eclipse Foundation not listed among 8 premier or 12 general members), the RISE Python wheel builder package list (cyclonedds absent), the `riseproject-dev` GitHub org (25 repos, no dedicated CycloneDDS repo; org-wide code search for "cyclonedds" returns only 3 hits, all inside `riseproject-dev/sw-ecosystem`'s internal backlog/prompt files, not shipped work), and the `riseproject-dev/python-wheels` issue tracker (624 open issues, 0 for CycloneDDS).

**Acceptance probability:** No basis exists in the evidence to predict acceptance probability of a hypothetical riscv64 PR - since none has ever been proposed, there is no maintainer response pattern to draw on. The general governance process (standard PR review, no special architecture gate) suggests no structural objection would arise, but this is inference from absence of contrary evidence, not a confirmed maintainer position. [NEEDS VERIFICATION]

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** Ubuntu (distro)
- **Optimization gap:** N/A - CycloneDDS is not an optimization-purpose project (a DDS middleware/communication library; its value proposition does not depend on hand-tuned per-architecture hot paths, and none exist for any architecture, per Section 4). No cap applies.
- **Justification:** Upstream has no riscv64 CI at all - confirmed by reading all 5 GitHub Actions workflow files in full, with zero riscv references found ([linux.yml](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/.github/workflows/linux.yml) and siblings). Applying the distribution floor: Ubuntu 26.04 "resolute" ships native riscv64 `.deb` binaries (`cyclonedds-dev`, `cyclonedds-tools`, `libcycloneddsidl0t64`, `libddsc0t64`, most recently 0.10.5-1build2, 2026-07-24) built from **unmodified upstream source** with no riscv-specific patches found in the packaging diff, confirmed directly against the [ports.ubuntu.com archive pool](https://ports.ubuntu.com/pool/universe/c/cyclonedds/). Per the skill's decision rule, a distro build from unpatched source upgrades an unsupported project from "no CI" to **yellow (clean-distro-build)** - it confirms the project builds on riscv64 even without upstream CI, but upstream has never validated, tracked, or acknowledged this in any way (zero issues, PRs, or commits).
- **Pending work that could change the grade:** None found. No open PR proposes riscv64 CI or release artifacts. No RISE Project involvement exists in any form (Section 12) - no funded work, no wheel-builder entry, no blog coverage, no runner usage. Absent an upstream-initiated CI contribution or a RISE-sponsored effort, this project will remain at yellow indefinitely; nothing in the evidence base points to a near-term change.

## 14. Investment Analysis

RISE has done and funded nothing for CycloneDDS (Section 12) - no work of any kind to net out. All estimates below are for work starting from zero.

### 14.1 Functional Enablement

The codebase itself requires no functional porting work - the generic C atomics layer already covers riscv64 at parity with arm64 (Section 4), and Ubuntu's clean unpatched build is existing proof the source compiles and links correctly on riscv64. The functional gap is entirely one of upstream validation: no one has run the CycloneDDS test suite on riscv64 in any tracked context. Estimated work: standing up a riscv64 build/test job (see 14.3) would itself constitute the functional validation - triaging any test failures that surface (unknown until the job exists) is the open-ended part of this line item.

### 14.2 Performance Optimization

Not applicable. CycloneDDS has no architecture-specific optimization code for any ISA (Section 4) - there is no SIMD/JIT/hand-tuned gap to close on riscv64 relative to amd64 or arm64, because none exists on those platforms either.

### 14.3 CI/CD Infrastructure

Adding a riscv64 leg to `linux.yml` following the existing `ubuntu-22.04`/`ubuntu-24.04` matrix pattern is straightforward mechanically (the workflow structure already supports adding a runner/OS entry), but requires either RISE RISC-V runner access (not currently used by this project - Section 7) or QEMU-based emulation (not currently used anywhere in this repo's CI). This also needs the dependency chain (OpenSSL - green upstream riscv64 CI; Iceoryx - riscv64-untested upstream; Iceoryx2 - no riscv64 path at all) to be resolved or conditionally disabled for a riscv64 CI job to be meaningful.

### 14.4 Ecosystem Enablement

No PyPI riscv64 wheel exists for the Python bindings (`cyclonedds` package) - this would need either an upstream `cibuildwheel` riscv64 matrix entry or a RISE wheel-builder submission (not currently present at [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/) or the `riseproject-dev/python-wheels` tracker, Section 12).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 build+test leg to `linux.yml` (GitHub-hosted or RISE runner) | 1-2 | ZettaScale/upstream committer, or RISE-sponsored contribution | High |
| Functional | Triage any test failures surfaced by first riscv64 CI run (unknown scope until job exists) | 1-3 (contingent) | ZettaScale/upstream committer | High |
| CI/CD | Resolve/validate optional-dependency riscv64 status in CI (OpenSSL green; Iceoryx1/Iceoryx2 unresolved) | 1-2 | ZettaScale/upstream committer | Medium |
| Ecosystem | Add riscv64 wheel to PyPI `cyclonedds` package (cibuildwheel matrix or RISE wheel-builder submission) | 1-2 | ZettaScale/upstream committer or RISE | Medium |
| Distribution | No action needed - Ubuntu already ships working unpatched riscv64 .deb packages | 0 | N/A | N/A |

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [eclipse-cyclonedds/cyclonedds GitHub repository](https://github.com/eclipse-cyclonedds/cyclonedds)
- [cyclonedds.io homepage](https://cyclonedds.io/)
- [Eclipse Cyclone DDS project page](https://projects.eclipse.org/projects/iot.cyclonedds)
- [Issue #1366 - ARM64 cross-compile question, unrelated to RISC-V](https://github.com/eclipse-cyclonedds/cyclonedds/issues/1366)
- [GitHub issue search: repo:eclipse-cyclonedds/cyclonedds riscv (0 matches)](https://github.com/search?q=repo%3Aeclipse-cyclonedds%2Fcyclonedds+riscv&type=issues)
- [GitHub issue search: repo:eclipse-cyclonedds/cyclonedds risc-v (0 matches)](https://github.com/search?q=repo%3Aeclipse-cyclonedds%2Fcyclonedds+risc-v&type=issues)
- [linux.yml CI workflow](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/.github/workflows/linux.yml)
- [macos.yml CI workflow](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/.github/workflows/macos.yml)
- [windows.yml CI workflow](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/.github/workflows/windows.yml)
- [cxx_bindings.yml CI workflow](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/.github/workflows/cxx_bindings.yml)
- [python_bindings.yml CI workflow](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/.github/workflows/python_bindings.yml)
- [GitHub Releases 11.0.1 asset listing](https://github.com/eclipse-cyclonedds/cyclonedds/releases/expanded_assets/11.0.1)
- [GitHub Releases 0.10.5 asset listing](https://github.com/eclipse-cyclonedds/cyclonedds/releases/expanded_assets/0.10.5)
- [PyPI cyclonedds package JSON API](https://pypi.org/pypi/cyclonedds/json)
- [PyPI cyclonedds simple index](https://pypi.org/simple/cyclonedds/)
- [RISE GitLab wheel mirror for cyclonedds (redirects to PyPI)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/cyclonedds/)
- [Arch Linux RISC-V package search - cyclonedds (no listing)](https://archriscv.felixc.at/?q=cyclonedds)
- [Ubuntu 26.04 "resolute" package search for CycloneDDS](https://packages.ubuntu.com/search?keywords=CycloneDDS&suite=resolute&searchon=names&section=all)
- [Ubuntu/Debian ports archive pool directory - cyclonedds riscv64 .deb files](https://ports.ubuntu.com/pool/universe/c/cyclonedds/)
- [docs/manual/installation/platforms.rst - supported platform tiers](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/docs/manual/installation/platforms.rst)
- [docs/manual/installation/installation.dds_core.rst - build instructions](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/docs/manual/installation/installation.dds_core.rst)
- [ports/mingw-w64/mingw-w64-x86_64.cmake - reference toolchain file pattern](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/ports/mingw-w64/mingw-w64-x86_64.cmake)
- [CYCLONEDDS_QUALITY_DECLARATION.md](https://github.com/eclipse-cyclonedds/cyclonedds/blob/master/CYCLONEDDS_QUALITY_DECLARATION.md)
- [riseproject.dev homepage](https://riseproject.dev/)
- [riseproject.dev members list](https://riseproject.dev/members/)
- [riseproject.dev blog listing](https://riseproject.dev/blog/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [ROS 2 rmw_cyclonedds PR #332 - riscv -latomic link fix, 2021, unrelated to RISE](https://github.com/ros2/rmw_cyclonedds/pull/332)
- Local clone used for verification: `/home/user/eclipse-cyclonedds/cyclonedds` (unshallowed, 3,819 commits, HEAD `5e95c750b316e2473bf1b082c5da289f0a85aa79`)
