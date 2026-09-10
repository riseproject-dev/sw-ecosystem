---
title: open62541 (OPC UA)
parent: Project Reports
color: yellow
dependencies:
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: Mbed TLS
    relation: runtime-dependency
    criticality: optional
  - name: LibreSSL
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="open62541-(opc-ua)" %}

# open62541 (OPC UA)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for open62541 (OPC UA)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

open62541 is a portable, open-source C99 implementation of the OPC UA (Open Platform Communications Unified Architecture) protocol stack, used for industrial automation and machine-to-machine communication. The project is dual-licensed under Mozilla Public License v2.0, with some plugins/examples under CC0.

**Governance:** No formal foundation or consortium governs the project; there is no MAINTAINERS, OWNERS, or CODEOWNERS file in the repository history (confirmed via `git log --all --diff-filter=A`). Governance is de facto centralized around **o6 Automation GmbH**, which the project's [README.md](https://github.com/open62541/open62541/blob/master/README.md) describes as employing the core contributors and providing commercial support. [CONTRIBUTING.md](https://github.com/open62541/open62541/blob/master/CONTRIBUTING.md) requires a CLA (via cla-assistant.io) before a first PR merges, and requires public API / architectural changes to be discussed with maintainers first.

**Corporate sponsors/contributors** (by commit volume and email domain): lead maintainer Julius Pfrommer (~6,600 commits, o6-automation.com); Andreas Ebner, Niels Beier (o6-automation.com); Stefan Profanter (745 commits, independent); Marwin Glaser, Chris Iatrou (Fraunhofer IOSB); Florian Palm, Christian von Arnim (RWTH Aachen / Uni Stuttgart, academic); Jannis Voelker (basysKom GmbH); other domains represented include Pilz GmbH, KEBA, Kalycito, HMS Networks, Linutronix, Wind River, Siemens, fortiss, KDAB, Texas Instruments, and Samsung. This matches the site's listed sponsors/partners: Fraunhofer IOSB, fortiss GmbH, basysKom GmbH, Wind River, HMS Networks, Linutronix, Hilscher, TU Dresden, RWTH Aachen, plus OSADL as a historical funding facilitator.

**Certification:** A reference server built with open62541 v1.4 is OPC Foundation-certified for the "Standard Server 2017" profile - a compliance certification, not an organizational/governance membership.

**Community stance on new ports:** [`arch/README.md`](https://github.com/open62541/open62541/blob/master/arch/README.md) documents a path for adding new **operating system** ports (implement `clock.c`, fork/adjust the EventLoop, wire into `ua_config_default.c` and CMake). Porting in this project is scoped to OSes, not CPU ISAs - the `arch/` directory contains `posix`, `win32`, `freertos`, `lwip`, `zephyr`, `common`, with no ISA-named directories. No RISC-V-specific stance, request, or roadmap item was found anywhere in the repo, README, or website content.

**RISE membership:** Neither open62541 nor the OPC Foundation appears on [riseproject.dev's member list](https://riseproject.dev/) (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE). open62541 is not a RISE member, and no RISE blog post, wheel-builder entry, or funded work item was found referencing it.

## 2. Port History and Upstreaming Timeline

**No RISC-V-specific port or commit exists in open62541's history.** Exhaustive search of the full commit history (`git log --all --grep="riscv|risc-v|rv32|rv64"`, `git log --all -S"riscv"` / `-S"risc-v"` content pickaxe across all diffs/branches, and the GitHub commit search API) returned zero hits. No file in the repository, including all `.github/workflows/*.yml` CI configs, mentions RISC-V.

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V-specific commit, PR, or issue has ever been filed | Exhaustive `git log`/GitHub search, zero hits |

**Why:** open62541's [`arch/README.md`](https://github.com/open62541/open62541/blob/master/arch/README.md) states the core library "supports all 32/64bit CPU instruction sets" - little-endian/IEEE-754 architectures get an optimized encode/decode path, everything else (including RISC-V) falls back to a generic, portable implementation. No architecture-specific porting was ever required, so no RISC-V port commit has needed to happen. Since Linux, Zephyr, and FreeRTOS (the project's Tier-1 OSes) all run on RISC-V hardware, RISC-V is implicitly supported today through those OS ports and the generic encoding fallback, without any dedicated architecture-port commit.

**Is it fully upstream?** Not applicable in the conventional sense - there is nothing to upstream because no architecture-specific code was ever needed. The project builds identically on riscv64 as on any other architecture using the same generic C99 code.

## 3. Upstream Support Tier

open62541's documented tier policy (`arch/README.md`, "Adding New Operating Systems") is **OS-based, not CPU-ISA-based**:

- **Tier 1** (full CI coverage, maintainer bug-fix commitment across stable/oldstable): Linux, Windows, macOS, Zephyr, FreeRTOS
- **Tier 2** (known to work, no CI, current-stable fixes only): BSD
- **Tier 3** (no CI/manual-test access, limited review): QNX, VxWorks

There is no CPU-ISA tier of any kind - amd64, arm64, and riscv64 are not differentiated anywhere in the project's own support documentation.

**Evidence:** All Linux CI (`.github/workflows/build_linux.yml`) runs natively on `ubuntu-22.04/24.04/26.04` x86_64 GitHub-hosted runners; one job builds 32-bit x86 via `gcc-multilib` (not a different CPU architecture). No arm/aarch64/riscv/ppc/s390 cross-arch job exists in any workflow, so **arm64 receives zero upstream CI exercise either** - it is not a case of riscv64 lagging behind a well-covered arm64.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI build | Yes (native x86_64 runners) | No | No |
| Upstream CI test execution | Yes | No | No |
| Upstream release binary | No (source-only releases for all architectures) | No | No |
| Distro package (Ubuntu 26.04 resolute) | Yes | Yes | Yes (`libopen62541-1.4`, `-dev`) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

**Confirmed: no architecture-specific (per-CPU-ISA) code exists for any architecture, not just riscv64.** Source-level verification against a full clone (`open62541/open62541` @ `01f44054`):

- `grep -rliE "riscv"`: 0 matches, anywhere in the repository.
- `grep -rn "__riscv"` (the standard RISC-V compiler predefine): 0 matches.
- Control comparison, same searches for `aarch64|arm64`, `x86_64|amd64`, and guards `__aarch64__`, `__x86_64__`, `__arm__`, `__i386__`: **0 matches for any of them, anywhere in the codebase.**
- No `.s`/`.S` assembly files anywhere in the repo.
- No SIMD/intrinsics headers (`immintrin.h`, `xmmintrin.h`, `arm_neon.h`, `__SSE__`, `__AVX__`): 0 matches.
- `CMakeLists.txt` / `tools/cmake/*.cmake`: no `CMAKE_SYSTEM_PROCESSOR` branching, no `-march=`/`-mtune=` flags.

The `arch/` directory (`arch/posix`, `arch/win32`, `arch/freertos`, `arch/lwip`, `arch/zephyr`, `arch/common`) is an **OS/RTOS network-stack abstraction** (POSIX sockets/epoll, Win32 IOCP, FreeRTOS+lwIP, Zephyr net), not a CPU-ISA abstraction. A RISC-V Linux target compiles the identical `arch/posix/*.c` files (clock, eventloop TCP/UDP/interrupt, HTTP parser, ~11,100 lines total) as amd64, arm64, ppc64el, and s390x Linux targets.

There is no JIT, no SIMD dispatch, and no GC (open62541 is a manually memory-managed C library with no garbage collector). The only external-crypto-dependent components (OpenSSL/Mbed TLS/LibreSSL for PubSub/SecureChannel security policies) are optional plugin backends, gated behind CMake options and off by default; open62541's own code does not implement crypto primitives.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Event loop (TCP/UDP/interrupt) | Full - plain portable C, no ISA branching | Full - identical file | Full - identical file |
| Clock | Full - plain C | Full - identical file | Full - identical file |
| Encode/decode fast path | Optimized for little-endian/IEEE-754 (applies equally to little-endian riscv64) | Same | Same (RISC-V is little-endian, IEEE-754) |
| Crypto (optional OpenSSL/Mbed TLS/LibreSSL plugins) | Delegated to linked library, not open62541 code | Same | Same |
| SIMD/intrinsics optimizations | None exist | None exist | None exist |

**Bottom line:** This is not a riscv64 stub sitting alongside full amd64/arm64 ports - it is a single portable-C implementation with zero CPU-architecture branching for any target. The project's own claim of architecture independence via portable C plus a plugin system is accurate and verified at the source level, not merely from documentation.

## 5. Build System, Cross-Compilation, and Toolchain

**No RISC-V build documentation, toolchain file, Dockerfile, or CI job exists anywhere in the repository.** Verified three ways: full-text case-insensitive grep across the entire clone, a directory/filename search for `*riscv*`, and a GitHub code-search API query (`riscv org:open62541`) - all zero matches.

- **Build docs:** No `BUILDING.md` or `INSTALL` file exists at repo root. The build doc is [`doc/building.rst`](https://github.com/open62541/open62541/blob/master/doc/building.rst) (reStructuredText), covering Debian/Ubuntu, Visual Studio, MinGW, OS X, OpenBSD, and Debian packaging. No architecture-specific or cross-compilation section for any target, ARM or RISC-V.
- **Cross-compilation guide:** Does not exist (`docs/cross-compilation.md` not present).
- **Toolchain files:** No `cmake/riscv64.cmake` or equivalent. The only `.cmake` toolchain-adjacent files are `arch/freertos/freertos.cmake` and `arch/zephyr/zephyr.cmake` (RTOS integration glue), plus standard `Find*.cmake` modules (FindCheck, FindLWIP, Findlibwebsockets, FindLibreSSL, FindMbedTLS, FindValgrind, FindGcov, Findcodecov, FindSphinx). None reference RISC-V or `CMAKE_TOOLCHAIN_FILE`.
- **Docker:** `tools/docker/Dockerfile` and `TinyDockerfile` are Alpine-based native builds only - no `--platform` cross-arch args, no QEMU, no riscv64 base image, no `Dockerfile.riscv64`.
- **CMakeLists.txt:** No `riscv`, no `CMAKE_SYSTEM_PROCESSOR` check, no `CMAKE_TOOLCHAIN_FILE` handling.
- **QEMU:** No mention anywhere in the repo (docs, CI workflows, scripts).
- **Toolchain minimums:** No exact GCC/Clang minimum version documented anywhere. Only stated requirement is C99 (`README.md`: "the core library has no dependencies besides the C99 standard headers"). No compiler-version guard exists in CMakeLists.txt.
- **Generic size-minimization flags** (apply to any target, not RISC-V-specific): `-DUA_NAMESPACE_ZERO=MINIMAL`, `-DUA_LOGLEVEL=` above 600, `-DUA_ENABLE_TYPEDESCRIPTION=OFF`, `-DUA_ENABLE_STATUSCODE_DESCRIPTIONS=OFF`, `-DCMAKE_BUILD_TYPE=MinSizeRel`, `-DBUILD_SHARED_LIBS=ON/OFF`, `-DUA_MULTITHREADING=`, `-DUA_ENABLE_ENCRYPTION=OFF|MBEDTLS|OPENSSL|LIBRESSL`.

**Conclusion:** Any riscv64 build must be assembled from the project's generic CMake/C99 cross-compilation support (standard `CMAKE_TOOLCHAIN_FILE` mechanism, not provided by this repo), with no upstream-documented commands, flags, or QEMU test setup to cite. Ubuntu's own autobuilder infrastructure is the only demonstrated working riscv64 build path (Section 8).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because the codebase has no per-architecture code paths, there is no *functional* feature gap between riscv64, arm64, and amd64 at the open62541 level - all three build the same generic C source. No SIMD-derived performance gap exists because no architecture (including amd64/arm64) has SIMD optimizations to lose.

| Aspect | amd64/arm64 | riscv64 | Gap |
|---|---|---|---|
| Functional feature set | Full | Full (identical source) | None found |
| Performance (SIMD-derived) | No SIMD path exists | No SIMD path exists | None (parity by omission) |
| Security hardening (core library) | Same generic C | Same generic C | None found |
| NaN / floating-point semantics | Not architecture-differentiated in open62541 code | Same | No architecture-specific issues found; searches for "riscv nan floating" in GitHub Issues returned 0 hits |

**Real-world gaps found are OS/toolchain-level, not riscv64-specific, and concentrate on ESP32-P4 (a RISC-V SoC) FreeRTOS/lwIP embedded targets** (see Section 11): a CMake export failure when building `freertos-lwip` amalgamations (fixed), a namespace-zero deadlock report that stalled for lack of a reproducer, and a RAM-placement (flash vs. PSRAM) constraint issue actively being resolved via PR #7950. These are FreeRTOS/lwIP-architecture issues that happen to have been reported by users targeting RISC-V hardware (ESP32-P4/S3), not core-library riscv64 gaps.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Confirmed by direct inspection of the full repository tree (not just search-tool queries): all 15 files under [`.github/workflows/`](https://github.com/open62541/open62541/tree/master/.github/workflows) (`build_linux.yml`, `build_macos.yml`, `build_windows.yml`, `build_zephyr.yml`, `cifuzz.yml`, `clang-tidy.yml`, `codeql.yml`, `coverity.yml`, `dependent-issues.yml`, `doc_upload.yml`, `docker.yml`, `interop_tests.yml`, `rebase.yml`, `release.yml`, `valgrind.yml`) were read and grepped for `riscv`/`risc-v` in any casing - zero matches. No `.gitlab-ci.yml`, `.cirrus.yml`, or Jenkinsfile exists in the repository at all.

No riscv-related job, step, matrix entry, label, or `workflow_dispatch` input exists in any workflow file. No RISE runner references (`riseproject-dev` org, RISE runner labels) appear anywhere.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (native `ubuntu-22.04/24.04/26.04` runners) | No | No |
| CI test execution | Yes | No | No |
| RISE runners used | No | No | No |
| Native hardware / QEMU / cloud VM | Native GitHub-hosted x86_64 | N/A | N/A |

The only genuine riscv64 signal found anywhere in this investigation is **external to open62541's own CI/release pipeline**: Ubuntu 26.04 "resolute" builds `libopen62541-1.4` for riscv64 as part of its own distro archive pipeline (Section 8) - that is Ubuntu's packaging infrastructure, not CI configured or run by the open62541 project.

## 8. Distribution and Release Status

**Upstream GitHub Releases ship no architecture-specific binaries at all, for any architecture.** The five most recent releases (v1.5.8, v1.4.20, v1.3.21, v1.5.7, v1.4.19, checked via `releases/expanded_assets/<tag>`) each ship only `open62541.c`, `open62541.h`, and auto-generated source zip/tar.gz archives. There is no riscv64 asset because there is no architecture-specific asset of any kind.

- **PyPI:** `https://pypi.org/pypi/open62541-(opc-ua)/json` -> HTTP 404. Package does not exist on PyPI (open62541 is a C library, not distributed via pip).
- **RISE wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/open62541-(opc-ua)/`): 302-redirects to pypi.org's simple index, which itself 404s. No riscv64 wheel.
- **Arch Linux RISC-V** (`archriscv.felixc.at`): open62541 is not listed. No Arch riscv64 package.
- **Ubuntu 26.04 (resolute)**, [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=open62541%20(OPC%20UA)&suite=resolute&searchon=names&section=all): three real packages found - `libopen62541-1.4`, `libopen62541-1.4-dev`, `libopen62541-1.4-tools`. The runtime library and dev package build for architectures **amd64 arm64 armhf ppc64el riscv64 s390x** (universe section); `libopen62541-1.4-tools` is architecture-independent (`all`). This was cross-checked and confirmed live via the project graph (corrected SPARQL query using the real package name) and a direct fetch of packages.ubuntu.com, which agree exactly.

**What a user must do to get a working riscv64 binary today:** install `libopen62541-1.4` / `libopen62541-1.4-dev` from Ubuntu 26.04's universe repository on riscv64 hardware or in a riscv64 chroot/container, or build the amalgamated `open62541.c`/`open62541.h` (or a full CMake build) from upstream source using a standard riscv64 GCC/Clang cross-toolchain - no upstream-provided toolchain file or documented cross-build recipe exists (Section 5), so this must be assembled from generic CMake mechanisms.

## 9. Dependencies

open62541 is a portable C99 library with **no mandatory external runtime dependencies** - it vendors its own XML tokenizer (`deps/yxml.c`) and an optional MQTT client (`deps/mqtt-c`, submodule). The only dependencies matching JIT/SIMD/numerics/crypto/compression/allocator categories are optional, off-by-default encryption backends and an optional compression library for HTTP/WebSocket transport.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| OpenSSL (`UA_ENABLE_ENCRYPTION=OPENSSL`) | PubSub/SecureChannel crypto backend | Green - native `linux64-riscv64` target upstream, RV64GC + Zvk vector-crypto merged | Mostly green, QEMU-only - no native riscv64 GitHub Actions runner upstream; `test_lhash` occasionally fails ([openssl#30880](https://github.com/openssl/openssl/issues/30880), open) | Green - Debian sid, Ubuntu 24.04/26.04, Arch RISC-V all ship current riscv64 builds | Unresolved: AES T-table fallback (used on silicon lacking Zkn/Zvkned, likely most deployed riscv64 hardware) not constant-time ([openssl#31080](https://github.com/openssl/openssl/pull/31080), [#31082](https://github.com/openssl/openssl/pull/31082), open); musl `RISCV_HAS_ZBB()` detection broken ([openssl#28118](https://github.com/openssl/openssl/issues/28118), open) |
| Mbed TLS (`UA_ENABLE_ENCRYPTION=MBEDTLS`, open62541's recommended backend) | Default/preferred crypto backend | Green - pure C, no arch-specific asm required | Green (indirect) - no riscv64-specific open correctness issues found; no dedicated upstream riscv64 CI job identified | Green - available in Debian sid, Ubuntu 24.04/26.04 riscv64 | None open/blocking found. Gap: no dedicated riscv64 status report exists yet for Mbed TLS in this project's tracked scope. |
| LibreSSL (`UA_ENABLE_ENCRYPTION=LIBRESSL`, marked EXPERIMENTAL by open62541 itself) | Alternate/experimental crypto backend | Data not available: no riscv64-specific LibreSSL build notes found | Thin coverage - only 2 historical issues found (`libressl/portable`), both closed and ARM-related | Not tracked in Ubuntu archive under this name | open62541 itself labels this backend experimental - lowest-confidence path regardless of LibreSSL's own architecture status |
| zlib (`UA_ENABLE_LWS=ON`, via libwebsockets) | Optional HTTP/WS compression | Green - pure portable C, no arch-specific code path | Green but thin - only CI coverage is OpenBSD/riscv64 via QEMU (`vmactions`), not in the Linux riscv64 cross-compile matrix | Green - Debian sid, Ubuntu 24.04/26.04, Arch RISC-V, Alpine all ship current riscv64 builds | No correctness bugs; unmerged RVV-accelerated Adler32 PR ([madler/zlib#1099](https://github.com/madler/zlib/pull/1099), open since Oct 2025, zero maintainer response) - performance only, not blocking |

**Other dependencies, out of scope for the deep-dive table:** libwebsockets (`UA_ENABLE_LWS`, optional transport, packaged for Ubuntu 26.04 riscv64 as `libwebsockets-dev`/`libwebsockets19t64`); `mqtt-c` (vendored submodule, no separate riscv64 status); lwIP (embedded TCP/IP stack for non-POSIX targets, architecture-agnostic); `yxml` (vendored, open62541 does not depend on libxml2); Check/Valgrind (build-time test tooling only, `check` is present in Ubuntu 26.04 riscv64); Python3 (build-time code generation only, architecture-independent).

**Headline assessment:** open62541 itself carries no riscv64-specific code and no known riscv64 issues. Its riscv64 risk surface is entirely inherited from optional dependencies. OpenSSL is the only dependency with a currently open, security-relevant riscv64 gap (non-constant-time AES fallback on hardware lacking Zkn/Zvkned). Mbed TLS, open62541's own recommended backend, shows no comparable open issue.

## 11. Known Bugs and Active Issues

No issue in `open62541/open62541` mentions "riscv" in any form (confirmed via both semantic and exact-term GitHub issue search, `total_count: 0`). The RISC-V-adjacent activity that does exist is concentrated on ESP32-P4 (a RISC-V Espressif SoC) via the `freertos-lwip` architecture:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#7950](https://github.com/open62541/open62541/pull/7950) | Add const option for generated UA_DataType | Open (favored solution) | Medium - RAM/flash placement, not correctness | User `diplfranzhoepfinger` confirms it works cleanly on real ESP32-P4/RISC-V hardware and requests priority merge; blocking on maintainer review |
| [#8323](https://github.com/open62541/open62541/pull/8323) | Optionally place generated members arrays in external RAM | Closed (superseded by #7950) | N/A | Author closed it in favor of the simpler, zero-cost #7950 approach |
| [#7428](https://github.com/open62541/open62541/issues/7428) | Is the FreeRTOS/LwIP architecture available again? | Closed, reopen-pending-info | Medium - reported deadlock, unresolved | Reporter (bregentzen) described a deadlock adding namespace 0 on ESP32-S3; maintainer jpfr requested a stack trace that was never supplied; issue closed pending that info |
| [#8056](https://github.com/open62541/open62541/issues/8056) | freertos-lwip CMake export failure with external FreeRTOS | Closed, fixed | Low - build-only | Same CMake export error independently hit in #7428; fixed by PR #8187 |
| [#8187](https://github.com/open62541/open62541/pull/8187) | fix(cmake): allow freertos-lwip amalgamation to generate | Merged 2026-07-12 | Low | Fixes #8056; kept library install while dropping only the CMake export set for FreeRTOS builds |
| [#4867](https://github.com/open62541/open62541/issues/4867) | Little Endian on ARM missing condition | Open (filed 2021-12-22) | Low, non-RISC-V | Endianness-detection macro misses `__ARMEL__`; representative of the class of compiler/arch-detection gap that would also need auditing for RISC-V toolchains, but not itself RISC-V-related |

**Correctness bugs highlighted separately:** the namespace-zero deadlock reported informally in #7428 is the only correctness-class defect touching RISC-V (ESP32-P4/S3) hardware found in this investigation, and it remains **unresolved and unreproduced** - the maintainer's request for a stack trace was never answered before the issue was closed.

## 12. Objections and Upstream Blockers

**No RISC-V-specific objection exists.** No maintainer statement, issue, or PR was found expressing reluctance to support RISC-V - unsurprising given the core library requires no RISC-V-specific code to work at all (Section 4).

**Technical blockers:**
- The namespace-zero deadlock reported in [#7428](https://github.com/open62541/open62541/issues/7428) on ESP32-S3/P4 (FreeRTOS/lwIP architecture) is unresolved for lack of a reproducer/stack trace.
- PR [#7950](https://github.com/open62541/open62541/pull/7950) (const-qualifying generated type arrays for flash placement, directly benefiting RISC-V/Xtensa Espressif embedded targets) is open and unmerged, pending maintainer (jpfr) review.

**Organizational blockers:** None identified. o6 Automation GmbH is positioned as the commercial channel for funded porting/integration work ("Contact o6 if you need commercial support... including porting or integration of open62541 for your specific needs" - CONTRIBUTING.md), but no RISC-V-specific engagement with o6 was found.

**Acceptance probability:** High for any future RISC-V-specific contribution, given the project's stated openness to outside contributions (CLA-gated PR process) and the complete absence of any recorded objection. The primary blocker to a formal "RISC-V support" milestone is that none has ever been proposed - not that one was rejected.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** Ubuntu (distro-provided; no upstream riscv64 release channel exists for any architecture)
- **Optimization gap:** N/A - open62541 is not an optimization-purpose project (no SIMD/JIT/vectorization exists for any architecture, Section 4).
- **Justification:** open62541 has no upstream riscv64 CI (all 15 GitHub Actions workflow files checked, zero riscv/riscv64 references - [`.github/workflows/`](https://github.com/open62541/open62541/tree/master/.github/workflows)) and no upstream release artifacts for any architecture (releases ship only amalgamated source). The distribution floor applies: Ubuntu 26.04 (resolute) builds `libopen62541-1.4` and `libopen62541-1.4-dev` for riscv64 from unmodified upstream source, with no riscv64-specific patches required, because the codebase has zero per-CPU-ISA branching for any architecture ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=open62541%20(OPC%20UA)&suite=resolute&searchon=names&section=all), cross-checked against the project graph). This is a clean, unpatched distro build -> yellow.
- **Pending work that could change the grade:** PR [#7950](https://github.com/open62541/open62541/pull/7950) (open, active, ESP32-P4/RISC-V-motivated flash-placement fix) is the only in-flight item with a direct RISC-V user in the loop, but it does not affect the CI/release posture that determines this color. No RISE involvement of any kind was found (not a member, no blog post, no wheel-builder entry, no funded work), so no RISE-driven upgrade path currently exists. Upstream adding a riscv64 CI job (even build-only) would move the grade to yellow via Step 1 directly rather than the distribution floor; adding a riscv64 CI job that also runs tests would move it to blue, since open62541 still would not publish its own riscv64 release artifact (it never publishes prebuilt binaries for any architecture).

## 14. Investment Analysis

RISE has not funded or performed any work on open62541 (Section 1: not a member, no blog post, no wheel-builder entry, no funded work found in any riseproject-dev repository, code search, or issue search across 11 relevant working-group repos). All sizing below is therefore net-new.

### 14.1 Functional Enablement

No functional gap exists to close at the core-library level - open62541 already builds and runs correctly on riscv64 via its portable C99 code and Ubuntu's distro build. The only functional item with an open riscv64-adjacent user report is the ESP32-P4/S3 FreeRTOS/lwIP namespace-zero deadlock ([#7428](https://github.com/open62541/open62541/issues/7428)), which needs a reproducer and root-cause fix.

### 14.2 Performance Optimization

Not applicable as a distinct RISC-V gap: open62541 has no SIMD/architecture-specific optimization for any architecture (Section 4), so there is no "catch up to arm64/amd64" optimization backlog. Any future encode/decode fast-path work (RVV or otherwise) would be new capability for all architectures, not a RISC-V-specific gap.

### 14.3 CI/CD Infrastructure

The highest-leverage investment: add a riscv64 job to [`build_linux.yml`](https://github.com/open62541/open62541/blob/master/.github/workflows/build_linux.yml) (native or QEMU-based, matching the pattern already used by dependencies like OpenSSL's `ubuntu-latest` + `qemu-user` approach) that both builds and runs the existing test suite. This alone would move the project from yellow (distribution floor) to blue per the color model, since no upstream riscv64 release artifact would exist regardless (the project ships source-only releases for every architecture).

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report instructions. open62541 is a standalone C library with no dependent package ecosystem (no PyPI/npm/Maven package, consumed via CMake `find_package`/vendored source by embedding applications).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Reproduce and fix the ESP32-P4/S3 FreeRTOS/lwIP namespace-zero deadlock ([#7428](https://github.com/open62541/open62541/issues/7428)) | 1-2 | Upstream (needs a RISC-V hardware reproducer) | Medium |
| Functional | Review and land PR [#7950](https://github.com/open62541/open62541/pull/7950) (const-qualify generated type arrays for flash placement on RISC-V/Xtensa Espressif) | 0.5 (review only; implementation already done by contributor) | Upstream maintainer (jpfr) | Medium |
| CI/CD | Add riscv64 build+test job to `build_linux.yml` (QEMU-based, following the OpenSSL CI pattern) | 1 | Upstream, or third-party PR | High |
| CI/CD | If a riscv64 CI job is added, evaluate adding a native RISE-hosted riscv64 runner for full-speed test execution | 1 | RISE (if the project were engaged) | Low (contingent on prior item landing) |
| Dependency | Commission a dedicated riscv64 status report for Mbed TLS (open62541's recommended crypto backend), currently missing from this project's tracked scope | 0.5 | Internal (this project's report-tracking process) | Medium |
| Dependency | Track resolution of OpenSSL's non-constant-time AES T-table fallback on riscv64 hardware lacking Zkn/Zvkned ([openssl#31080](https://github.com/openssl/openssl/pull/31080)) since this affects open62541 deployments using `UA_ENABLE_ENCRYPTION=OPENSSL` | N/A (upstream OpenSSL work, monitor only) | External (OpenSSL project) | Medium (security-relevant for encrypted PubSub/SecureChannel deployments) |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [open62541/open62541 GitHub repository](https://github.com/open62541/open62541)
- [open62541.org homepage](https://www.open62541.org/)
- [open62541 README.md](https://github.com/open62541/open62541/blob/master/README.md)
- [open62541 CONTRIBUTING.md](https://github.com/open62541/open62541/blob/master/CONTRIBUTING.md)
- [open62541 arch/README.md](https://github.com/open62541/open62541/blob/master/arch/README.md)
- [open62541 doc/building.rst](https://github.com/open62541/open62541/blob/master/doc/building.rst)
- [open62541 .github/workflows/ directory](https://github.com/open62541/open62541/tree/master/.github/workflows)
- [open62541 CMakeLists.txt](https://github.com/open62541/open62541/blob/master/CMakeLists.txt)
- [PR #7950 - Add const option for generated UA_DataType](https://github.com/open62541/open62541/pull/7950)
- [PR #8323 - Optionally place generated members arrays in external RAM (closed, superseded)](https://github.com/open62541/open62541/pull/8323)
- [Issue #7428 - Is the FreeRTOS/LwIP architecture available again?](https://github.com/open62541/open62541/issues/7428)
- [Issue #8056 - freertos-lwip CMake export failure](https://github.com/open62541/open62541/issues/8056)
- [PR #8187 - fix(cmake): allow freertos-lwip amalgamation to generate](https://github.com/open62541/open62541/pull/8187)
- [Issue #4867 - Little Endian on ARM missing condition](https://github.com/open62541/open62541/issues/4867)
- [Ubuntu packages.ubuntu.com - open62541 (OPC UA), suite=resolute](https://packages.ubuntu.com/search?keywords=open62541%20(OPC%20UA)&suite=resolute&searchon=names&section=all)
- [PyPI open62541-(opc-ua) JSON API (404, package does not exist)](https://pypi.org/pypi/open62541-(opc-ua)/json)
- [RISE Python wheel builder simple index for open62541-(opc-ua)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/open62541-(opc-ua)/)
- [Arch Linux RISC-V package tracker](https://archriscv.felixc.at/)
- [riseproject.dev homepage and member list](https://riseproject.dev/)
- [RISE Python wheel builder full package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [OpenSSL issue #30880 - test_lhash riscv64 failure](https://github.com/openssl/openssl/issues/30880)
- [OpenSSL PR #31080 - AES T-table constant-time fix](https://github.com/openssl/openssl/pull/31080)
- [OpenSSL PR #31082 - related constant-time fix](https://github.com/openssl/openssl/pull/31082)
- [OpenSSL issue #28118 - musl RISCV_HAS_ZBB() detection broken](https://github.com/openssl/openssl/issues/28118)
- [zlib PR #1099 - RVV-accelerated Adler32 (open, unreviewed)](https://github.com/madler/zlib/pull/1099)
- [IEEE INDIN 2025 - Comparative Evaluation of open62541 OPC UA Servers on Embedded Devices](https://ieeexplore.ieee.org/document/11279152/)
- [/home/user/sw-ecosystem/project-reports/openssl.md - existing OpenSSL riscv64 report]
- [/home/user/sw-ecosystem/project-reports/zlib.md - existing zlib riscv64 report]
- [/home/user/sw-ecosystem/projects.yml - project tracking metadata]
- Local clone used for source-level verification: `/home/user/open62541/open62541` (shallow, HEAD `01f44054eaacfecc6ef431934982c970ff3ef50f`)
