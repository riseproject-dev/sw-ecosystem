---
title: binexport
---

# binexport

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for binexport<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

binexport is Google's disassembler-metadata exporter, the front-end component of BinDiff. It converts disassembly and call/control-flow-graph data from three host disassemblers (IDA Pro, Binary Ninja, Ghidra) into a common protobuf-based `.BinExport` format, which BinDiff then consumes to diff two binaries. binexport does not implement its own disassembler; it is a thin exporter layer riding on top of each host tool's own architecture/instruction database.

**Governance:** binexport is a Google-owned project (`Copyright 2011-2026 Google LLC`), explicitly disclaimed in the README as "not an official Google product (experimental or otherwise), it is just code that happens to be owned by Google." There is no external foundation membership and no formal governance document (no MAINTAINERS, OWNERS, or CODEOWNERS file). Governance is de facto single-maintainer: all contributions require a signed Google Individual or Corporate CLA per `CONTRIBUTING.md`, and review is dominated by one person. It is Apache-2.0 licensed and traces to zynamics GmbH, acquired by Google in 2011.

**Top contributors** (from git log, 369+ of ~450 total commits analyzed):
- Christian Blichmann (`cblichmann`, Google) - 369 commits (~82%), de facto sole maintainer.
- `copybara-github` (24 commits) - Google's internal-to-GitHub sync bot; canonical development happens inside Google's internal monorepo and is mirrored out.
- Mike Hunhoff (`mike-hunhoff`, Google) - 6 commits.
- Richard Neal (`rmngoog`, Google) - 6 commits.
- Lukasz Kwiatek (`lkwiatek`, Google) - 4 commits.
- Remaining contributors are one-off external submissions (e.g. `xusheng6` from Vector 35/Binary Ninja) with 1-7 commits each; no sustained non-Google co-maintainer exists.

**Community culture on new ports:** All historical architecture additions (ARM, MIPS, PowerPC) were authored by the Google maintainer, not external contributors. There is no explicit tiering policy document for architectures. Given the single-maintainer model and the total absence of any RISC-V ask in the issue tracker, the project has taken no stance, supportive or resistant, because RISC-V has simply never been raised as a topic.

**Google's RISE relationship (corporate, not project-level):** Google LLC is a Premier Member of the RISE project (alongside Alibaba, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent), but this is a corporate-level membership. binexport, BinDiff, and zynamics do not appear anywhere in RISE's project or member lists, blog posts, or GitHub org.

## 2. Port History and Upstreaming Timeline

There is no port history to report. Exhaustive searching across GitHub issues (all 100+ issues, titles and full-text), pull requests (all 62 PRs, titles and full-text), commits, and code search returned zero matches for "riscv", "riscv64", "rv64", "rv32", or "risc-v" anywhere in the repository's history.

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port has ever been proposed, opened, or discussed | Confirmed via exhaustive `gh search issues/prs/commits` (9+ query variants), GitHub REST `/search/issues` and `/search/commits` (`total_count: 0` for all), GraphQL `search(type: ISSUE)` (`issueCount: 0`), and manual review of all 100 issues (#7-#166) and all 62 PRs (#11-#168) - [google/binexport](https://github.com/google/binexport) |

**Key contributors to a RISC-V port:** None exist. **Is it fully upstream?** Not applicable - no port exists in any form (not started, not stubbed, not partial).

## 3. Upstream Support Tier

There is no formal tier policy document in the repository. In practice, architecture support in binexport tracks whichever disassembler backend already implements the ISA, since binexport does not decode instructions itself for the IDA Pro and Binary Ninja backends (Ghidra backend is naturally architecture-agnostic; see Section 4).

**Evidence of tier status for RISC-V:**
- **CI:** No riscv64 runner or QEMU step in either `.github/workflows/cmake.yml` or `.github/workflows/gradle.yml`. Verified by direct GitHub MCP file fetch and case-insensitive grep for "riscv" against both raw files: zero matches.
- **Release-blocking:** Not applicable - releases are not gated on architecture-specific tests since no riscv64 target exists anywhere in the build or test matrix.
- **Official binaries:** No riscv64 release asset exists across all 20 releases / 66 total assets (verified via `gh api repos/google/binexport/releases --paginate`).
- **Core architecture enum:** `architectures.h` defines `enum class Architecture { kArm, kAArch64, kDex, kMsil, kX86Arch32, kX86Arch64 }` - no RISC-V member.

### Comparison table: amd64 vs arm64 vs riscv64

| Aspect | amd64/x86 | arm64/arm | riscv64 |
|---|---|---|---|
| Core `Architecture` enum entry (`architectures.h`) | `kX86Arch64` present | `kAArch64` present | Absent |
| IDA Pro dedicated parser | `metapc.cc` (553 lines) | `arm.cc` (494 lines) | None - falls to `ParseInstructionIdaGeneric` (`generic.cc`, 79-81 lines) |
| Binary Ninja architecture-name classifier | Matches `x86*` | Matches `arm*`/`aarch64`/`thumb` | Falls to `"GENERIC"` bucket |
| Ghidra `LanguageID`-derived name | Passthrough (works) | Passthrough (works) | Passthrough (would emit e.g. `"RISCV-64"`) but unrecognized downstream (see Section 4) |
| Reader-side `GetSupportedArchitecture()` | Recognizes `"x86-64"` | Recognizes `"aarch64"` | Any RISC-V string (`"riscv-64"`, `"generic-64"`) returns `std::nullopt` |
| CI coverage | `ubuntu-26.04`, `windows-2025` | `ubuntu-26.04-arm`, `windows-11-arm` (native) | None |
| GitHub Release binary | `BinExport-Linux.zip` (implicit x86_64) | Not separately named (bundled in same OS zips or via macOS/Windows-ARM native runners) | None |

## 4. Technical Architecture and RISC-V-Specific Subsystems

binexport is not a JIT, VM, or runtime; it has no SIMD codegen, crypto primitives, GC barriers, or ISA-specific assembly of its own. Its only "architecture-specific" surface is the instruction/metadata dispatch logic that classifies and (for two of three backends) semantically parses the target binary's instructions. This section covers that dispatch layer component by component.

**Dispatch mechanism per backend:**

- **IDA Pro backend** (`ida/flow_analysis.h`, `GetArchitecture()`): switches on `inf_get_procname()` string match: `"metapc"` -> x86, `"ARM"` -> ARM, `"PPC"` -> PowerPC, `"mipsb"/"mipsl"/"mipsr"/"mipsrl"/"r5900b"/"r5900l"` -> MIPS, `"dalvik"` -> Dalvik. Everything else, including IDA's own `riscv` processor module name, falls through to `kGeneric`, dispatching to `ParseInstructionIdaGeneric` (`ida/generic.cc`, 79-81 lines). This generic path parses whatever text IDA's UI line renderer produces via `GetOriginalIdaLine`/`GetMnemonic`, rather than semantically decoding operands/registers into typed `Expression`/`Operand` objects the way `ida/arm.cc`, `ida/mips.cc`, `ida/ppc.cc` do.
- **Binary Ninja backend** (`binaryninja/main_plugin.cc`, `GetArchitectureName()`, line ~82): string-prefix matches `x86*`, `arm*`/`aarch64`/`thumb`, `mips*`, `ppc*`; everything else including `riscv32`/`riscv64` maps to `"GENERIC"`. However, the core instruction-fetching loop (line ~401-420) calls Binary Ninja's own generic `Architecture::GetInstructionText()`/`GetInstructionInfo()` API for any architecture BN supports, so RISC-V instructions do get real disassembly text/operands from BN's own RISC-V plugin - but the exported `architecture_name` metadata field reads `"GENERIC-64"` rather than a proper RISC-V label.
- **Ghidra backend** (`java/.../BinExport2Builder.java`, `buildMetaInformation()`, line ~151-166): derives the architecture name mechanically from Ghidra's own `LanguageID` quad (`program.getLanguageID().toString().split(":", 4)`) with a `TODO(cblichmann): Canonicalize architecture names` comment - this path is architecture-agnostic and would emit Ghidra's actual RISC-V language ID (e.g. `RISCV-64`) verbatim, with no BinExport code change needed, since it only reads Ghidra's own processor/address-size string. The companion `IdaProMnemonicMapper.java` (used to normalize mnemonic casing for cross-tool diffing with BinDiff) has an `IdaProArchitecture` enum limited to `{ARM, DALVIK, METAPC, MIPS, PPC, GENERIC}` - no RISCV entry, so RISC-V mnemonics from Ghidra fall to `GENERIC` mnemonic-mapping (a no-op passthrough, same as `IdentityMnemonicMapper.java`).
- **Reader-side consumption** (`reader/flow_graph.cc`, `GetSupportedArchitecture()`): maps proto strings `"arm"/"aarch64"/"dex"/"msil"/"x86-32"/"x86-64"` to the enum; any other string, including a hypothetical `"riscv-64"` or the actual `"GENERIC-64"`/`"RISCV-64"` values the exporters would produce, returns `std::nullopt` - fully unrecognized on read-back.
- **`reader/instruction.cc`, `IsJumpInstruction()`**: a 6-line stub, `// TODO(b/114701180): Implement this function, at least for ARM and AArch64`, unconditionally returns `false` for every architecture, including the ones that are enumerated. This is a pre-existing generic gap, not RISC-V-specific.

**#ifdef / preprocessor guard search:** `ifdef __riscv repo:google/binexport` via GitHub code search returned 0 results. No preprocessor guard for RISC-V exists anywhere.

**TODO/FIXME comments:** None reference RISC-V. The only relevant stub (`IsJumpInstruction()`) predates any RISC-V consideration and doesn't cover the architectures that are already enumerated.

### Comparison table per component: amd64 vs arm64 vs riscv64

| Component | amd64/x86 | arm64/arm | riscv64 |
|---|---|---|---|
| Core `Architecture` enum (`architectures.h`), used by reader/BinDiff | Present (`kX86Arch64`) | Present (`kAArch64`) | **Missing** - no `kRiscv` entry |
| IDA Pro instruction parsing | Hand-tuned, dedicated (`metapc.cc`, 553 lines) | Hand-tuned, dedicated (`arm.cc`, 494 lines) | **Missing** - falls to `ParseInstructionIdaGeneric`, opaque text-scrape, no semantic structure |
| Binary Ninja instruction parsing | Classified by name; generic BN API does real decode | Classified by name; generic BN API does real decode | **Fallback only** - real decode happens by accident of BN's generic API, but mislabeled `"GENERIC-64"` |
| Ghidra instruction parsing | Classified via `LanguageID` passthrough | Classified via `LanguageID` passthrough | **Fallback only** - would emit correct `LanguageID` string by accident of Ghidra's own decode, not BinExport-added logic |
| Reader-side `GetSupportedArchitecture()` | Recognized | Recognized | **Missing** - unrecognized string returns `std::nullopt`, degrading any successfully-exported RISC-V data to unclassified on read-back |
| x86 NOP/noreturn heuristic (`x86_nop.cc`) | Present (x86-only by design) | N/A (also absent for ARM) | N/A (not evidence of RISC-V-specific neglect; ARM/MIPS/PPC lack it too) |

**Rating: missing, not partial or stub.** There is no evidence any RISC-V work was ever started - zero issues, zero PRs, zero commits, zero comments, zero TODOs referencing RISC-V, and zero dedicated source files. A stub would imply a placeholder was deliberately left; nothing was ever begun.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake, minimum version 3.20 (`cmake_minimum_required(VERSION 3.20)`), tested up to CMake policy version 4.0. `CMAKE_CXX_STANDARD 20` is hard-set in `cmake/CompileOptions.cmake`.

**Toolchain versions and why:** README's "Preparing the build environment" section specifies GCC 15 or "a recent version of Clang" on Linux/macOS. Data not available: no explicit minimum Clang version number or rationale comment is given anywhere in the repo for why GCC 15 specifically; the most plausible explanation is full C++20 support, but this is not stated in the source.

**Exact build commands:** Data not available: no `BUILDING.md`, `INSTALL`, or dedicated build-documentation file exists in the repo (confirmed 404/absent). Build configuration is inferred from CI: CMake + Ninja, `cmake "${GITHUB_WORKSPACE}" -G Ninja "-DCMAKE_BUILD_TYPE=Release" ...` followed by `cmake --build . --config Release`.

**Cross-compilation / toolchain files:** None exist. `cmake/` contains exactly 4 files: `BinExportDeps.cmake`, `BinExportOptions.cmake`, `CompileOptions.cmake`, `Util.cmake` - none reference CPU architecture/toolchain selection beyond a single Apple-Silicon-on-Windows-ARM64 check (`WIN32 AND CMAKE_SYSTEM_PROCESSOR MATCHES "^(aarch64|arm64|ARM64)$"` in `BinExportOptions.cmake`, used only to disable the Binary Ninja plugin target on Windows ARM64).

**QEMU usage:** None anywhere in the repo (workflows, docs, or scripts) - confirmed via full-text search of the tree, workflows, and `gh search code`.

**Docker:** The only Dockerfile in the repo is `kokoro/docker/debian9-clang/Dockerfile` (Debian Buster + Clang 15, x86_64 only, no arch flags). No riscv64 Dockerfile exists.

**Known build failures on riscv64:** Data not available - no riscv64 build has ever been attempted or reported in this repository (no issue, PR, or CI log references a riscv64 build attempt, successful or failed).

**Architecture-gating flags that exist:** only `-DBINEXPORT_ENABLE_IDAPRO=OFF` and `-DBINEXPORT_ENABLE_BINARYNINJA=OFF` (to skip building those plugin targets). No architecture-gating flags of any kind exist.

**Bottom line:** binexport has no riscv64 build story at all - no build docs, no toolchain file, no CI runner, no Docker image, no QEMU testing. Any riscv64 build today would be an untested, undocumented "should work if CMake/Clang/GCC 15 support the host" scenario, since the C++ build itself uses only standard, portable constructs (see Section 9 for dependency-level riscv64 status) - but this has zero project-level validation.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Feature matrix

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build on host | Yes (CI-verified) | Yes (CI-verified, native GitHub runner) | Untested (no CI, no reports of attempts) |
| Export RISC-V *target* binaries via IDA Pro | N/A | N/A | Generic text-scrape fallback only; no semantic operand/register decoding |
| Export RISC-V *target* binaries via Binary Ninja | N/A | N/A | Real instruction text/operands from BN's own plugin, but mislabeled `"GENERIC-64"` in exported metadata |
| Export RISC-V *target* binaries via Ghidra | N/A | N/A | Would emit correct Ghidra `LanguageID` (e.g. `RISCV-64`) with zero BinExport code changes, but... |
| Read back RISC-V-labeled `.BinExport` data | N/A | N/A | ...`GetSupportedArchitecture()` does not recognize any RISC-V string, so it returns `std::nullopt` on read-back regardless of exporter used |
| Run binexport itself on a riscv64 host | Yes (native, x86_64 host) | Yes (native, GitHub-hosted ARM64 runner) | Untested |

**Functional gaps (can't do X at all):**
- Cannot semantically decode RISC-V instructions via the IDA Pro backend (falls to opaque text capture).
- Cannot correctly label RISC-V architecture metadata via the IDA Pro or Binary Ninja backends (both emit `GENERIC`/`GENERIC-64`).
- Cannot read back any successfully-exported RISC-V `.BinExport` file as a recognized architecture on the reader/BinDiff side, since the reader's `GetSupportedArchitecture()` enum has no RISC-V mapping - this means even the Ghidra path, which produces a correct label at export time, degrades to unclassified data at read time.
- Mnemonic normalization for cross-tool (IDA-style) diffing (`IdaProMnemonicMapper.java`) does not cover RISC-V mnemonics; they pass through unmodified (`GENERIC` bucket), which may affect the accuracy of cross-tool BinDiff comparisons for RISC-V binaries specifically.

**Performance gaps:** Data not available: no RISC-V-specific performance benchmarks exist for binexport in any GitHub issue, PR, code search, release note, RISE blog post, or third-party benchmark article (see Section 7 methodology note: WebSearch tool returned empty results for all queries in one research pass, including sanity-check control queries, so absence of web-search hits is corroborated only via GitHub/direct-source data, not an independent web crawl).

**Security hardening gaps:** Data not available - no RISC-V-specific security hardening discussion (or any architecture-specific hardening discussion) was found in the repository.

**NaN / floating-point semantics issues:** Data not available - no NaN or floating-point-related RISC-V issue was found. A targeted search combining "nan"/"floating" with "riscv" against binexport and bindiff issues returned zero results.

## 7. CI/CD Infrastructure

**No riscv64 CI exists for google/binexport.** Confirmed via direct GitHub MCP file fetch of both workflow files, byte-for-byte, with a case-insensitive grep for "riscv" against both raw contents returning zero matches.

**`.github/workflows/cmake.yml`:**
- Trigger: `on: [push, pull_request]` (every push and PR, not gated).
- Runner matrix (fixed `include` list, 5 entries): `ubuntu-26.04`, `ubuntu-26.04-arm`, `macOS-26`, `windows-2025`, `windows-11-arm`.
- The `-arm` runners are GitHub-hosted **native** ARM64 (aarch64) runners for Linux/Windows - not RISC-V, not QEMU-emulated.
- No riscv64 entry, no QEMU/emulation setup step anywhere in the file.

**`.github/workflows/gradle.yml`:**
- Trigger: `push`, `pull_request`, `workflow_dispatch` (manual, with a `ghidra_version` input), and a monthly `schedule` cron.
- Single runner: `ubuntu-22.04` (x86_64).
- Matrix varies only over Ghidra plugin versions (`"latest","11.4.2","11.4.1","11.4"`), never over CPU architecture.

**Legacy Kokoro (Google-internal, pre-dates GitHub Actions):** `kokoro/java/build.sh`, `kokoro/java/dockerized_build.sh` (Docker, `gcr.io/zynamics-build/debian10-java11`), `kokoro/macos/build.sh` (`CMAKE_OSX_ARCHITECTURES=arm64;x86_64` only), `kokoro/ubuntu/build.sh`, `kokoro/ubuntu/dockerized_build.sh` (Docker, `gcr.io/zynamics-build/debian9-clang`), `kokoro/windows/build.bat` - none reference riscv.

**Other CI systems checked, none exist (404):** `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `azure-pipelines.yml`.

**RISE runners:** Not used. binexport has no relationship with the RISE project's CI infrastructure or RISE RISC-V runners (see Section 12 for the full RISE-relationship finding).

**Hardware used:** Not applicable - no riscv64 CI job exists to run on any hardware.

### Comparison table: amd64 vs arm64 vs riscv64

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions runner (cmake.yml) | `ubuntu-26.04`, `windows-2025` | `ubuntu-26.04-arm`, `windows-11-arm` (native) | None |
| GitHub Actions runner (gradle.yml) | `ubuntu-22.04` (implicit x86_64) | None | None |
| QEMU emulation | Not needed (native) | Not needed (native GitHub-hosted ARM64) | Not present at all |
| Kokoro legacy CI | Present (Ubuntu, macOS via `x86_64` in universal binary, Windows) | Present (macOS universal binary only) | Absent |
| Test execution on target arch | Yes (`ctest`) | Yes (`ctest`, native runner) | Not run anywhere |

## 8. Distribution and Release Status

**GitHub Releases:** Enumerated all 20 releases / 66 total release assets via `gh api repos/google/binexport/releases --paginate`. Zero assets contain "riscv" in the filename (case-insensitive scan). Latest release (`v12-20240417-ghidra_11.0.3`) assets: `BinExport-Linux.zip`, `BinExport-macOS.zip`, `BinExport-Windows.zip`, `BinExport_Ghidra-Java.zip`. Assets are not even architecture-qualified for x86_64 vs arm64 - they are generic OS bundles for the IDA/Binary Ninja plugin loaders (which presuppose those closed-source tools' own supported host platforms, none of which include riscv64) plus the Ghidra Java extension.

**PyPI:** `pypi.org/pypi/binexport/json` returns HTTP 404. Also checked `bin-export` and `binExport` variants: both 404. `pip index versions binexport` returns "No matching distribution found." `https://pypi.org/simple/binexport/` also 404s. No PyPI package named `binexport` exists at all.

**RISE wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/binexport/` returns an HTTP 302 redirect to the (404-ing) PyPI simple page. No riscv64 wheels present because there is nothing published for this project name upstream.

**Ubuntu:** `packages.ubuntu.com/search?keywords=binexport&suite=noble` returns "Sorry, your search gave no results." No `binexport` package in any Ubuntu suite.

**Debian:** `tracker.debian.org/pkg/binexport` returns HTTP 404. Cross-checked with `sources.debian.org/api/src/binexport/` (`{"error":404}`). No `binexport` source or binary package exists in Debian.

**Arch Linux / Arch Linux RISC-V (archriscv):** Fetched full directory listings of all 5 archriscv repos (`core`, `extra`, `unsupported`, `community`, `multilib`) and grepped case-insensitively for "binexport": zero matches in any repo. Cross-checked `.status/status.txt` (core: 294/296 packages built, extra: 14220/14909 built) and `blacklist.txt` (1098 lines): `binexport` appears in neither, meaning it isn't tracked as a build target, failing, or excluded - it simply doesn't exist as a candidate. Root cause: `binexport` doesn't exist in mainline x86_64 Arch Linux either (`archlinux.org/packages/?q=binexport` returns zero matches), and archriscv only ports packages that already exist upstream. AUR (`aur.archlinux.org/rpc/v5/search/binexport`) also returns zero results.

**Unofficial `python-binexport` wrapper** (community package, pure-Python protobuf wrapper around the `.BinExport` format, architecture-independent by construction): latest v0.4.5; checked all 17 historical releases, every one ships only a `py3-none-any` wheel plus sdist. No riscv64-specific artifact ever published, though this is moot for a pure-Python package.

### Summary table

| Channel | riscv64 available? | Evidence |
|---|---|---|
| Upstream source (architecture enum) | No | `architectures.h`: only Arm/AArch64/Dex/Msil/x86-32/x86-64 |
| GitHub Actions CI | No | No riscv64 matrix entry in either workflow file |
| GitHub Releases | No | 0/66 assets across all 20 releases contain "riscv" |
| PyPI (`binexport`) | N/A, package doesn't exist | 404 |
| PyPI (`python-binexport`, unofficial wrapper) | No riscv64-specific artifact (moot, pure Python) | 0/17 releases ship arch-specific artifacts |
| Debian | N/A, package doesn't exist | 404 on tracker and sources API |
| Ubuntu | N/A, package doesn't exist | 0 search hits |
| Arch Linux RISC-V (archriscv) | No | 0 matches in all 5 repos; absent from status.txt and blacklist.txt; doesn't exist even in mainline x86_64 Arch |
| AUR | No | 0 search results |

**What must a user do to get a working binary?** There is no path to an official riscv64 binexport binary today. A user would need to: (1) clone the repo, (2) manually configure CMake with a working GCC 15/Clang toolchain on a riscv64 host (untested, no known blockers at the C++ language level based on dependency analysis in Section 9, but zero validation exists), (3) build from source with no project-provided riscv64 toolchain file, and (4) accept that the IDA Pro and Binary Ninja plugin targets are moot on riscv64 since neither host application ships a riscv64 build (see Section 9) - leaving only the Ghidra/Java extension as a realistic riscv64 deployment target, which requires only a riscv64 JVM (OpenJDK has full riscv64 support) and does not require building the C++ core at all.

## 9. Dependencies

**Method:** binexport is a pure CMake C++ project (no setup.py/go.mod/Cargo.toml/package.json exist in the repo). Dependencies were extracted from `CMakeLists.txt` and `cmake/BinExportDeps.cmake`, which use CMake `FetchContent` to pull all major dependencies. A parallel Ghidra extension (`java/build.gradle`) depends on protobuf-java, supplied by the host Ghidra installation.

### Summary table

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Abseil-cpp (`abseil/abseil-cpp`) | Core C++ foundation (strings, containers, status, logging, CRC); linked into every binexport target | Builds; Debian sid riscv64 "Installed" (20260526.0-2) | 2 open SEGFAULTs on Debian riscv64 (`absl_hashtablez_sampler_test`, `absl_cordz_sample_token_test`, issue #2002, open since before 2026-08-07); passes on Ubuntu riscv64 | Source-only; distro-packaged | #1702 open (needs `-latomic` for sub-word atomics on GCC 11-12); #2002 open SEGFAULT, no upstream response; CRC32C Zbc/Zbkc hw-accel PR #1986 stalled on hardware access. Full status report: `project-reports/abseil-cpp.md` |
| Protocol Buffers (`protocolbuffers/protobuf`) | Wire format/codegen for `binexport2.proto`, linked as `protobuf::libprotobuf` | Builds from source with `-latomic` workaround; Debian sid riscv64 "Installed" (3.21.12-16) | No known riscv64-specific test failures in protobuf itself | No official riscv64 `protoc` binary exists (Maven Central, PyPI wheels, GitHub release assets all lack riscv64); maintainers have stated riscv64 "isn't on our roadmap" (2025-08) | 7 riscv64 issues/PRs (#4425, #12244, #12266, #14549, #17798, #23205, #23206), all closed, none merged. Full status report: `project-reports/protocol-buffers.md` |
| GoogleTest/GoogleMock (`google/googletest`) | Test framework for binexport's own test suite; fetched only when `BUILD_TESTING AND BINEXPORT_BUILD_TESTING` | Builds; Debian sid riscv64 "Installed" (1.17.0-1+b1) | 1 open issue #3756: `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (open since 2022, maintainer says riscv64 "not officially supported," cosmetic impact only) | Source-only; distro-packaged; latest upstream v1.18.0 (2026-08-10) | #3756 open, low severity, no fix planned; not independently reported in scope.yml |
| google/benchmark (`google/benchmark`) | Optional micro-benchmark harness, only fetched if `BINEXPORT_BUILD_BENCHMARK=ON` (default OFF) | Builds; riscv64 support upstream since 2019 (5 merged PRs); Debian sid "Installed" | No CI coverage at all upstream (confirmed absent), no known functional failures | Source-only | None open in benchmark itself; optional libpfm4 hw-counter backend has no RISC-V PMU port (non-blocking, feature off by default). Full status report: `project-reports/benchmark.md` |
| Vector35/binaryninja-api | Binary Ninja plugin API (git-tag `FetchContent`), pulled when `BINEXPORT_ENABLE_BINARYNINJA=ON` (default ON except Windows-ARM64) | SDK headers are architecture-agnostic C++; would compile on riscv64 | N/A - plugin cannot be loaded without the host app | No riscv64 release of Binary Ninja core exists; Vector35's own site lists only Linux x86_64 and Linux aarch64 installers | Product-support gap outside binexport's control; not in scope.yml |
| HexRaysSA/ida-sdk | Open-source IDA SDK C++ bindings (git-tag `FetchContent`), pulled when `BINEXPORT_ENABLE_IDAPRO=ON` and `BINEXPORT_IDASDK_OSS=ON` (both default ON, IDA 9.2+) | SDK headers are architecture-agnostic; would compile on riscv64 | N/A - plugin cannot be loaded without the host app | No riscv64 release of IDA Pro exists; Hex-Rays' system requirements list only x86-64/ARM64 for Linux, macOS, Windows | Product-support gap outside binexport's or the SDK's control; not in scope.yml |
| Boost (`boost_parts/`, vendored subset in-tree) | Header-only Boost subset (bind, mpl, spirit, multi_index, etc.), vendored directly, not fetched | Inherits binexport's own (currently absent) riscv64 build result | Same | Same | No dedicated tracking; not in scope.yml |
| Ghidra + protobuf-java (`java/` extension, Gradle-built) | Pure-Java BinExport extension for Ghidra; depends on `protobuf-java`/`protoc` auto-detected from host Ghidra install | Ghidra is JVM-based; OpenJDK has full riscv64 support (see `project-reports/openjdk.md`) - most portable path to riscv64 of all binexport's plugin targets | Not independently verified for this specific extension [NEEDS VERIFICATION] | `protobuf-java` ships as pure-Java/noarch on Maven Central - no riscv64 gap | None identified specific to the Ghidra path |

**Deep-dive: dependencies with numerics/build-relevant riscv64 issues.**

The two dependencies with real, tracked, open riscv64 problems are Abseil-cpp (open SEGFAULT #2002 in hashtable/cord sampling tests, open atomics-linking issue #1702 requiring `-latomic` on GCC 11-12) and Protocol Buffers (no official riscv64 binary/wheel anywhere; maintainers have repeatedly declined riscv64 support in closed PRs). Both already have full independent status reports in this repository (`project-reports/abseil-cpp.md`, `project-reports/protocol-buffers.md`) - detailed root-cause and remediation analysis for these two should be read there rather than duplicated here. GoogleTest and google/benchmark are lower-risk, test-only/optional dependencies with no blocking impact on a production build (benchmark is OFF by default; GoogleTest's one open riscv64 failure is cosmetic).

The IDA Pro and Binary Ninja SDKs are a fundamentally different class of gap: the SDK code itself is portable, but the proprietary host applications (IDA Pro, Binary Ninja) do not ship riscv64 builds at all, which caps any native-plugin deployment path to riscv64 regardless of what binexport or its C++ dependencies do. The Ghidra/Java extension path is the one realistic route for riscv64 users today, since it depends only on a JVM (OpenJDK riscv64 is first-class) and pure-Java protobuf.

**The most fundamental blocker sits in binexport itself, upstream of all dependencies:** no riscv64 CI job exists, and the `Architecture` enum has no RISC-V entry, so binexport cannot yet analyze RISC-V target binaries even if every dependency above were fully riscv64-clean.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [google/bindiff#34](https://github.com/google/bindiff/issues/34) | Bindiff unable to process statically linked binaries exported with BinExport from Ghidra (flow graph already attached error) | Open (filed 2024-02-15, last updated 2024-10-28) | Medium (generic Ghidra-export bug, not RISC-V-specific) | Reproduced with statically-linked OpenSSL on x86-64. One 2024-10-22 comment from third-party user `precurse` notes anecdotally: "I've noticed this with ESP32 binaries...Ghidra exports are completely unusable and I don't have the luxury of using IDA Pro to get support for Xtensa / RISCV architectures." Anecdotal aside only, not a filed RISC-V bug, no repro or investigation followed. |
| [google/binexport#143](https://github.com/google/binexport/issues/143) | Ghidra: Inconsistent exports for statically linked binaries | Open (filed 2024-10-28) | Medium | Maintainer (`cblichmann`) split from bindiff#34 into this repo. No RISC-V-specific content; same generic Ghidra static-binary export bug, reproduced with x86-64 OpenSSL. |
| [google/binexport#114](https://github.com/google/binexport/issues/114) | Create a registry of architecture/ISA names | Open (filed 2023-09-14), 0 comments, no linked PRs | Low (process/cleanup proposal) | Maintainer-filed general architecture-naming cleanup, references IDA's `names.cc` enum and suggests reusing LLVM target triples for a future format. Does not mention RISC-V. Zero follow-up activity in ~3 years. Closest thing to an "architecture extensibility" discussion in the repo, but not a RISC-V request. |

**Correctness bugs specific to RISC-V:** None exist. There are zero RISC-V-specific bugs, performance issues, or NaN/floating-point-semantics issues filed against google/binexport or google/bindiff. Exhaustive searches (label list, keyword combinations, code search) returned zero matching issues/PRs in either repo beyond the two incidental mentions above.

## 12. Objections and Upstream Blockers

**Stated objections:** None exist. No maintainer or contributor has ever stated an objection to RISC-V support, because the topic has never been raised in any issue, PR, or discussion.

**Technical blockers:**
1. Core `Architecture` enum (`architectures.h`) has no RISC-V entry - this is a small, mechanical addition but has never been made.
2. IDA Pro backend requires a dedicated `riscv.cc` parser (analogous to `arm.cc`/`mips.cc`/`ppc.cc`) to move beyond the generic text-scrape fallback; no such file exists and none has been proposed.
3. Reader-side `GetSupportedArchitecture()` needs a RISC-V string mapping to avoid discarding architecture identity on read-back, even for the Ghidra path where the exporter already produces a usable label.
4. `IdaProMnemonicMapper.java`'s `IdaProArchitecture` enum needs a RISCV entry for correct cross-tool mnemonic normalization.
5. No riscv64 CI runner exists on GitHub Actions to validate any of the above once implemented.
6. IDA Pro and Binary Ninja, as commercial host applications, do not ship riscv64 builds - this blocks any native-plugin testing/validation on real riscv64 hardware for two of the three backends regardless of binexport-side code changes (see Section 9).

**Organizational blockers:**
- Single de facto maintainer (Christian Blichmann/Google) reviews and approves all PRs; historically, new-architecture additions have all been authored by the maintainer directly rather than merged from external contributors, suggesting any external RISC-V PR would need to clear an unusually high bar for a first-time architecture contribution from outside Google.
- Canonical development occurs in Google's internal monorepo and is mirrored to GitHub via Copybara (`copybara-github`, 24 commits) - meaning any GitHub PR may need to be re-implemented or ported internally by a Googler rather than merged directly, which is a structural friction point for external contributions in general, not specific to RISC-V.

**Acceptance probability:** Given (a) no active resistance (RISC-V has simply never been raised), (b) a mechanical, well-understood path for the enum/parser additions, (c) precedent that the Ghidra path would need essentially zero core-logic change (since it already passes through Ghidra's `LanguageID`, which is riscv64-capable today via Ghidra's own RISC-V SLEIGH module), and (d) the pattern that all past architecture ports were maintainer-authored - a well-scoped, complete PR (enum entry + IDA `riscv.cc` parser + reader-side string mapping + mnemonic-mapper entry + CI runner) submitted by an external contributor with a signed CLA has a reasonable chance of acceptance, but would need to be complete and self-contained given the low historical external-contribution rate for new architectures. [NEEDS VERIFICATION: no explicit maintainer statement about willingness to accept an external riscv64 PR was found, since the topic has never come up.]

## 13. Investment Analysis

**RISE-funded work check:** No RISE blog post, RISE GitHub org repo (`riseproject-dev`, all 48-54 repos checked across both pages), or RISE working-group tracking issue mentions binexport in any form. The `security-software-wg` working group (the RISE group most plausibly adjacent to binary-analysis/reverse-engineering tooling) has exactly one tracked project, `rp016-opensbi-tee` (an OpenSBI TEE effort), unrelated to binexport. No RISE funding or work has been directed at binexport to date; the entire estimate below is unclaimed by RISE.

### 13.1 Functional Enablement

| Item | Description |
|---|---|
| Core enum entry | Add `kRiscv` (or similar) to `architectures.h`. Mechanical, ~1 line plus dependent switch-statement updates. |
| IDA Pro parser | Write `ida/riscv.cc`/`riscv.h` analogous to `ida/mips.cc` (317 lines) or `ida/arm.cc` (494 lines) - semantic decode of RISC-V base ISA operands/registers into typed `Expression`/`Operand` objects, replacing the generic text-scrape fallback. Requires familiarity with IDA SDK's RISC-V processor module output and the existing per-arch parser pattern. |
| Binary Ninja name classifier | Add `riscv32`/`riscv64` string-prefix match to `GetArchitectureName()` in `binaryninja/main_plugin.cc` (~1-line addition per architecture, following the existing pattern) so the metadata label is correct; instruction-level decode already works via BN's generic API. |
| Reader-side mapping | Add RISC-V string(s) to `GetSupportedArchitecture()` in `reader/flow_graph.cc` so exported RISC-V data (from any of the three backends) is recognized on read-back rather than degrading to `std::nullopt`. |
| Ghidra mnemonic mapper | Add a RISCV entry to `IdaProMnemonicMapper.java`'s `IdaProArchitecture` enum for correct mnemonic-casing normalization in cross-tool (BinDiff) comparisons. |
| Dependency fixes | Track/contribute to Abseil-cpp #2002 (open SEGFAULT) and #1702 (`-latomic` linking) upstream, since binexport links Abseil directly; no binexport-side workaround needed if upstream fixes land, but may require a temporary `-latomic` CMake flag in `cmake/CompileOptions.cmake` as a stopgap. |

### 13.2 Performance Optimization

No RISC-V-specific performance work is applicable at this stage - binexport has no SIMD/JIT/crypto codegen of its own to optimize (see Section 4). Performance work would only become relevant after functional enablement (13.1) lands, and would consist of profiling the new `riscv.cc` parser against real-world RISC-V binary corpora; no baseline exists to compare against today.

### 13.3 CI/CD Infrastructure

| Item | Description |
|---|---|
| Add riscv64 matrix entry to `.github/workflows/cmake.yml` | Requires a riscv64 GitHub-hosted or self-hosted runner (e.g. a RISE RISC-V runner, per the RISE "Announcing the RISE RISC-V Runners" 2026-03-24 blog post referenced in the research, though binexport has not adopted this). No GitHub-hosted native riscv64 runner exists at present [NEEDS VERIFICATION on current GitHub Actions riscv64 runner availability at time of implementation]. |
| Test binary corpus | Establish a small corpus of riscv64 ELF test binaries for `ctest` to validate the new parser end-to-end, analogous to existing per-arch test fixtures (exact fixture locations not enumerated in this research pass). |

### 13.4 Ecosystem Enablement

Not applicable - binexport has no dependent package ecosystem to enable (see Section 10 guidance; omitted below).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `kRiscv` to core `Architecture` enum + dependent switch statements | 0.5 | External contributor or Google maintainer | Critical |
| Functional | Write `ida/riscv.cc`/`riscv.h` semantic parser | 3-4 | Contributor familiar with IDA SDK + RISC-V ISA | Critical |
| Functional | Add Binary Ninja `riscv32`/`riscv64` name classifier | 0.25 | External contributor | High |
| Functional | Add reader-side `GetSupportedArchitecture()` RISC-V mapping | 0.25 | External contributor | Critical |
| Functional | Add Ghidra `IdaProMnemonicMapper` RISCV enum entry | 0.25 | External contributor | Medium |
| Functional | Upstream fixes/contributions to Abseil-cpp #2002, #1702 | 1-2 (contribution to a separate project; see `project-reports/abseil-cpp.md`) | External contributor | High |
| CI/CD | Add riscv64 CI matrix entry + runner provisioning | 1-2 | External contributor with CI access, needs maintainer merge approval | High |
| CI/CD | Build riscv64 ELF test-binary corpus for `ctest` | 1 | External contributor | Medium |
| Governance | Prepare complete, self-contained PR given single-maintainer review model and low historical external-architecture-contribution rate | 1 (process overhead, folded into above estimates) | External contributor | High |

**Total estimated effort: approximately 7.25-10.25 person-weeks** for full functional enablement plus basic CI validation, executed by a single contributor familiar with both the IDA SDK and RISC-V ISA. This estimate excludes IDA Pro/Binary Ninja host-application riscv64 support, which is outside binexport's control (Section 9), and excludes any RISE-funded work, since none has been directed at this project to date.

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [google/binexport GitHub repository](https://github.com/google/binexport)
- [google/binexport architectures.h](https://github.com/google/binexport/blob/main/architectures.h)
- [google/binexport issue #114 - Create a registry of architecture/ISA names](https://github.com/google/binexport/issues/114)
- [google/binexport issue #143 - Ghidra: Inconsistent exports for statically linked binaries](https://github.com/google/binexport/issues/143)
- [google/binexport PR #112 - Binary Ninja: Support mixed architectures](https://github.com/google/binexport/pull/112)
- [google/binexport .github/workflows/cmake.yml](https://github.com/google/binexport/blob/main/.github/workflows/cmake.yml)
- [google/binexport .github/workflows/gradle.yml](https://github.com/google/binexport/blob/main/.github/workflows/gradle.yml)
- [google/binexport releases](https://github.com/google/binexport/releases)
- [google/bindiff issue #34 - Bindiff unable to process statically linked binaries exported with BinExport from Ghidra](https://github.com/google/bindiff/issues/34)
- [riseproject.dev](https://riseproject.dev)
- [riseproject.dev/members](https://riseproject.dev/members/)
- [riseproject.dev blog](https://riseproject.dev/blog)
- [riseproject.dev - Stack-Clash Security Checker for RISC-V](https://riseproject.dev/blog/stack-clash-security-checker-for-risc-v)
- [riseproject.dev - Announcing the RISE RISC-V Runners](https://riseproject.dev/blog/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [riseproject-dev security-software-wg repository](https://github.com/riseproject-dev/security-software-wg)
- [PyPI - binexport search](https://pypi.org/simple/binexport/)
- [Debian package tracker - binexport](https://tracker.debian.org/pkg/binexport)
- [Ubuntu package search - binexport](https://packages.ubuntu.com/search?keywords=binexport)
- [Arch Linux RISC-V port](https://archriscv.felixc.at/)
- [Arch Linux package search - binexport](https://archlinux.org/packages/?q=binexport)
- [AUR search - binexport](https://aur.archlinux.org/rpc/v5/search/binexport)
- [project-reports/abseil-cpp.md - Abseil-cpp RISC-V ecosystem status report (this repository)](https://github.com/google/binexport)
- [project-reports/protocol-buffers.md - Protocol Buffers RISC-V ecosystem status report (this repository)](https://github.com/google/binexport)
- [project-reports/benchmark.md - google/benchmark RISC-V ecosystem status report (this repository)](https://github.com/google/binexport)