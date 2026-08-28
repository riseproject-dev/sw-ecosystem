---
title: autofdo
---

# autofdo

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for autofdo<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

AutoFDO ([google/autofdo](https://github.com/google/autofdo)) is a Google-maintained C++ toolchain that converts CPU profiling data (from Linux `perf`) into compiler-consumable profiles for feedback-directed optimization (FDO/AFDO) with GCC and LLVM/Clang. It includes `create_gcov` (GCOV-format profile generation), `create_llvm_prof` (LLVM sample-profile generation), `profile_merger`, `dump_gcov`, and the Propeller post-link code-layout optimizer (split into its own repo, `google/llvm-propeller`, as of 2025 Q1).

**Governance:** No foundation affiliation (not CNCF, not Linux Foundation, not LLVM Foundation despite tight LLVM integration). No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, or `GOVERNANCE.md` file exists in the repo. `CONTRIBUTING.md`/`CODE_OF_CONDUCT.md` are inherited Google org-wide defaults, not project-specific. License: Apache 2.0. Repo created 2014-04-01, still active (last push 2026-07-28 per research findings).

**De facto leadership:** Han Shen (Google, `shenhanc78`) is the top contributor (75+ commits) and the primary issue triager/responder, though with no formal title.

**Corporate contributors** (by commit count, cross-referenced via GitHub profile company field):

| Contributor | Commits | Company |
|---|---|---|
| shenhanc78 (Han Shen) | 75+7 | Google |
| danielcdh (Dehao Chen) | 52 | Google |
| wmi-11 (Wei Mi) | 30+16 | Google |
| dnovillo (Diego Novillo) | 19 | NVIDIA |
| erozenfeld (Eugene Rozenfeld) | 9 | Microsoft |
| kim-phillips-arm (Kim Phillips) | 8 | Arm |
| rlavaee (Rahman Lavaee) | 4 | Google |
| rwalkr (Robert Walker) | 4 | Arm Ltd |
| taewookoh (Taewook Oh) | 4 | Meta |
| kugan-nv | 4 | NVIDIA |
| mtrofin (Mircea Trofin) | 3 | Google |
| vapier (Mike Frysinger) | 2 | Gentoo |

Corporate mix is Google-dominated with meaningful NVIDIA, Arm, Meta, and Microsoft contributions, consistent with AutoFDO/Propeller being embedded in multiple vendors' production compiler pipelines.

**Community culture on new ports:** No evidence of resistance to a RISC-V port; equally, no evidence anyone has attempted one. The one substantive maintainer statement on cross-architecture applicability (issue [#152](https://github.com/google/autofdo/issues/152)) treats RISC-V as a hypothetical profile-*consumption* target, not a collection target, and frames the barrier as a hardware/architectural dependency (LBR) rather than a policy decision.

## 2. Port History and Upstreaming Timeline

There is no RISC-V port, attempted or completed, for autofdo itself.

| Date | Event | Source |
|---|---|---|
| 2022-11-14 | Issue #152 opened; user asks whether AutoFDO profiles apply to RISC-V | [google/autofdo#152](https://github.com/google/autofdo/issues/152) |
| 2022-11-21 | Maintainer shenhanc78 states AutoFDO profile *collection* is Intel-only (LBR); cross-arch *application* possible only if code paths are architecture-identical | [google/autofdo#152](https://github.com/google/autofdo/issues/152) |
| 2024-05-06 | Commit `623c777` adds Arm SPE (Statistical Profiling Extension) sample-reading support (PR #191) - the only architecture-extension commit in the project's history that is even adjacent to a non-x86 hardware profiling primitive | Research findings (commit search) |
| 2024-06-28 | Issue #196 opened; Debian packager `sergiodj` hits DWARF-parsing/OOM bugs using `create_gcov` (x86-64 host tool) against a `qemu-system-riscv64` binary | [google/autofdo#196](https://github.com/google/autofdo/issues/196) |
| 2024-08-08 | Contributor erozenfeld posts an inline (non-PR) patch diagnosing a `DW_UT_partial`/`DW_FORM_GNU_ref_alt` DWARF-reader gap; thread stalls awaiting a reproducer from `sergiodj` | [google/autofdo#196](https://github.com/google/autofdo/issues/196) |
| 2024-12-11 | `google/llvm-propeller` issue #269 opened: "Can propeller optimize RISCV binaries?" | [google/llvm-propeller#269](https://github.com/google/llvm-propeller/issues/269) |
| ~2024-12-11 | Maintainer dhoekwater answers "no, not currently," listing 4 missing pieces including the absence of a standard RISC-V branch-sampling extension | [google/llvm-propeller#269](https://github.com/google/llvm-propeller/issues/269) |
| 2024-11-22 | RISC-V Control Transfer Records (Smctr/Ssctr) extension ratified v1.0 - closest RISC-V analog to LBR | [riscv-control-transfer-records v1.0](https://github.com/riscv/riscv-control-transfer-records/releases/tag/v1.0) |
| 2025-12-06 | `llvm/llvm-project` PR #170992, "[RISCV] Add Propeller support for RISC-V," opened (small patch, Clang driver flag + `RISCVInstrInfo::insertNoop`), author reports success on real RISC-V hardware with SPEC CPU2017 `510.parest_r` | [llvm/llvm-project#170992](https://github.com/llvm/llvm-project/pull/170992) |
| 2025-12-09 - present | PR #170992 approved by two RISC-V LLVM maintainers (topperc, wangpc-pp: "LGTM") but stale/unmerged, `mergeable_state: dirty` (merge conflicts), no activity since 2026-03-26 | [llvm/llvm-project#170992](https://github.com/llvm/llvm-project/pull/170992) |

**Is it fully upstream? No.** Nothing RISC-V-related has ever been merged into `google/autofdo`. The only RISC-V-adjacent code progress anywhere in the AutoFDO/Propeller/BOLT family is the stalled, unmerged Propeller-for-RISC-V PR in the separate `llvm/llvm-project` repository, plus BOLT instrumentation-mode RISC-V support (also in `llvm/llvm-project`, not in `google/autofdo`).

## 3. Upstream Support Tier

**Formal tier policy:** None exists. `PLATFORMS.md`, `SUPPORT.md`, and `docs/platforms/` are all absent from the repo. There is no documented architecture-tiering scheme of any kind, for any architecture.

**Evidence-based tier assessment (inferred from CI, release artifacts, and build configuration, not from a stated policy):**

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build/test coverage | Yes (`ubuntu-22.04-8core`, both LLVM and GCOV tool modes) | No | No |
| Official GitHub release binaries | Yes (`create_llvm_prof-x86_64-*.zip`, all releases with assets) | No | No |
| `LLVM_TARGETS_TO_BUILD` (vendored LLVM backend) | Yes (`X86`) | Yes (`AArch64`) | No (absent from `CMakeLists.txt` line 267 default) |
| Hardware profile collection path (LBR/SPE-equivalent) | Yes (Intel LBR) | Partial (Arm SPE, added commit `623c777`/PR #191) | No (no ratified-and-Linux-supported branch-sampling extension) |
| `e_machine` ELF-reader awareness (`elf_reader.cc`) | Yes (`EM_386`) | Yes (`EM_ARM`) | No (`EM_RISCV` absent, falls to `default: break`) |
| Cache-line-size macro (`base/port.h`) | Yes (`__i386__`/`__x86_64__`) | Yes (`__arm__`, with sub-checks) | No (falls through to generic 64B default) |
| Distro packaging (downstream, not upstream) | Yes | Yes | Yes (Debian sid, Ubuntu noble - see Section 8), but from a pre-CMake 2019-era autotools build with LLVM support disabled |

**Conclusion:** riscv64 is entirely unsupported at the upstream tier. It has no CI, no release artifact, no LLVM backend enabled in the tool's own build, and no ELF/cache-line architecture awareness. The only riscv64 artifacts that exist are distro-packaging byproducts entirely outside upstream's control (Section 8).

## 4. Technical Architecture and RISC-V-Specific Subsystems

AutoFDO/Propeller's own source tree has zero RISC-V-specific code paths anywhere: no vector/RVV intrinsics, no `Zba`/`Zbb`/`Zicsr`-style extension handling, no `EM_RISCV` ELF machine constant, no riscv64 conditional compilation. This was confirmed by a full recursive tree listing (288 entries) grepped for `risc` (case-insensitive) plus targeted code searches for `riscv`, `riscv64`, `"risc-v"`, `"rv64"`, `zba`, `EM_RISCV`, `vfloat32m1_t`, `rvv` - all zero matches.

| Subsystem | File | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| ELF symbol reader (`e_machine` switch) | `util/symbolize/elf_reader.cc` (994 lines) | `EM_386` case (no-op) | `EM_ARM` case (clears Thumb bit on function symbols) | Absent - falls to `default: break` (functionally harmless no-op, but no dedicated handling) |
| Cache-line-size macro | `base/port.h` (relevant block ~L381-397) | `__i386__`/`__x86_64__` -> 64B | `__arm__` (with `__ARM_ARCH_5T__`/`__ARM_ARCH_7A__` sub-checks) -> 32B/64B; `__powerpc64__` -> 128B | Absent - falls through to generic 64B default |
| Vendored LLVM target backends | `CMakeLists.txt` line 267 | `X86` (enabled) | `AArch64` (enabled) | Absent - not in `LLVM_TARGETS_TO_BUILD` default |
| Propeller/AutoFDO disassembler | `mini_disassembler.cc` (139 lines) | Functional (X86 registered) | Functional (AArch64 registered) | Non-functional as built - architecture-generic LLVM-MC code (`TargetRegistry::lookupTarget`), but since RISCV isn't in the linked LLVM libs, it hits `"no target for triple"` at runtime for any riscv64 input binary |
| Hardware sample-profile collection (branch records) | Intel LBR (native) | Arm SPE (commit `623c777`, PR #191, "Sync AFDO/Propeller with internal and enable Arm SPE support") | None - RISC-V CTR (Smctr/Ssctr, ratified 2024-11-22) has no Linux kernel driver (confirmed: `torvalds/linux` `drivers/perf/` contains only `riscv_pmu.c`, `riscv_pmu_legacy.c`, `riscv_pmu_sbi.c`, no `riscv_ctr.c`) |
| ARM Statistical Profiling Extension decoder (submodule) | `third_party/perf_data_converter/src/quipper/arm_spe_decoder.cc` + `spe_sample_reader.cc`/`spe_pid_provider.h`/`spe_tid_pid_provider.cc` | N/A | Complete | No RISC-V equivalent exists or has been proposed |
| Disassembly flag | `profile_creator.cc` (`--disassemble_arm_branches`) | N/A | ARM-specific | No RISC-V counterpart |
| Test fixtures | `testdata/propeller_sample.arm.{bin,perfdata}` + golden files; `testdata/hierarchical_discriminator_test.x86_64` | x86_64 fixtures exist | ARM fixtures exist | No `.riscv.` fixtures exist |

**Quality assessment:** There is no "hand-tuned vs. scalar vs. missing" gradient to describe for riscv64 because there is no implementation at any quality level - the component is simply absent from every architecture-dispatch point in the codebase. The single structural blocker for even *processing* riscv64 target binaries (independent of collection) is `CMakeLists.txt` line 267 hardcoding `LLVM_TARGETS_TO_BUILD X86 AArch64`, which prevents the vendored LLVM's RISCV target backend (AsmParser/Desc/Disassembler/Info) from ever being compiled into `mini_disassembler` and the Propeller CFG builder.

## 5. Build System, Cross-Compilation, and Toolchain

**Documented build (README.md, verbatim, identical across all platforms - no architecture-specific guidance exists):**

```
$ sudo apt install libunwind-dev libgflags-dev libssl-dev libelf-dev protobuf-compiler cmake libzstd-dev clang g++
$ git clone --recursive --depth 1 https://github.com/google/autofdo.git
$ cd autofdo && mkdir build && cd build
$ cmake -DENABLE_TOOL=LLVM -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++ -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED=On ../
$ cmake -DENABLE_TOOL=GCOV -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++ -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED=On ../
$ make -j 4
```

CI's actual invocation (`.github/workflows/ci.yml`, x86_64 only):

```
cmake -DENABLE_TOOL=LLVM -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_COMPILER=clang++ -DCMAKE_C_COMPILER=clang -B build-llvm
cmake -DENABLE_TOOL=GCOV -DCMAKE_BUILD_TYPE=Release -DCMAKE_CXX_COMPILER=g++ -DCMAKE_C_COMPILER=gcc -B build-gcov
```

**No RISC-V build documentation exists anywhere.** Checked and confirmed absent: `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake` (there is no `cmake/` directory at all), any Dockerfile (none exist anywhere in the tree).

**Toolchain minimums:** Top-level `cmake_minimum_required(VERSION 3.10)`, `CMAKE_CXX_STANDARD 17`. The vendored `third_party/llvm-project` submodule is pinned at commit `9fde1a498f2dc97a737a3564cb427c6f2a7bfe6c` (2024-11-26), which itself requires CMake >= 3.20.0 (supersedes autofdo's own floor since it's `add_subdirectory()`'d in). `CMakeLists.txt` hard-verifies the submodule git hash against `CLANG_KNOWN_GIT_COMMIT_HASH` and calls `FATAL_ERROR` on mismatch - a different LLVM checkout cannot be silently substituted. The only combination actually exercised by CI is Ubuntu 22.04 defaults (GCC 11.4 / Clang 14); LLVM's own documented floor (Clang 5.0/GCC 7.4) is untested by autofdo's own CI.

**The theoretical fix for the LLVM-target gap** (untested, unverified, my inference from reading the CMake logic, not documented or CI-verified by anyone):

```
cmake -DENABLE_TOOL=LLVM -DLLVM_TARGETS_TO_BUILD="X86;AArch64;RISCV" ...
```

`LLVM_TARGETS_TO_BUILD` is a `CACHE STRING`, and the downstream linking loop (`foreach (tgt ${LLVM_TARGETS_TO_BUILD}) ... target_link_libraries(mini_disassembler LLVM${tgt}AsmParser LLVM${tgt}Desc LLVM${tgt}Disassembler LLVM${tgt}Info) ...`) is generic, so it should mechanically pick up the RISCV LLVM libraries if added. No issue or PR shows anyone having done this successfully.

**QEMU usage:** None in the repo's own build/test process. QEMU appears only in two user bug reports (issues #196 and, indirectly, #195) where `qemu-system-riscv64` is the *target binary being profiled* by autofdo's x86_64 host tooling - unrelated to building autofdo itself for a riscv64 target.

**Known build failures relevant to riscv64:** None directly (no one has documented attempting a riscv64 build of the current CMake-based tool). The Debian legacy-autotools riscv64 build (Section 8) produces a working binary but with LLVM support compiled out (`configure: WARNING: could not detect LLVM version 5 (or higher) libraries. Support for LLVM profiles disabled.`) because its Build-Depends omit any LLVM dev package.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hardware branch-record profile collection | Yes (Intel LBR, native) | Yes (Arm SPE, commit `623c777`) | No - no ratified extension with Linux driver support; CTR (Smctr/Ssctr) ratified Nov 2024 but zero kernel driver |
| `create_gcov` / `create_llvm_prof` processing of *own-arch* target binaries | Yes | Yes (implied via LLVM target enablement, not independently verified in these findings) | No - `LLVM_TARGETS_TO_BUILD` excludes `RISCV`, so `mini_disassembler`/Propeller cannot resolve a riscv64 target triple ("no target for triple") |
| `--use_lbr=false` fallback path (no edge counts, degraded profile) | Yes | Not directly evidenced | Would theoretically work for cross-arch profile *application* per issue #152, but yields no measured performance improvement per the same issue |
| DWARF debug-info parsing of `dwz`-processed binaries | Not evidenced as broken | Not evidenced as broken | Broken - issue #196, `DW_UT_partial` and `DW_FORM_GNU_ref_alt` unhandled in `util/symbolize/dwarf2reader.cc`; fix drafted inline but never merged |
| ELF `e_machine`-specific symbol adjustment | Yes (`EM_386`, no-op) | Yes (`EM_ARM`, Thumb-bit clearing) | No dedicated case (falls to harmless default) |
| Propeller post-link code-layout optimization | Yes | Not explicitly detailed in findings, but AArch64 is in the enabled LLVM target list | No - `google/llvm-propeller#269`, maintainer confirms "no, not currently"; blocked on 4 pieces: basic-block-address-map codegen, branch-profile hardware collection, profile-format conversion tooling, basic-block-sections codegen |

**Functional gaps:** RISC-V cannot do end-to-end AutoFDO profiling at all - not "with degraded performance," but literally cannot collect a branch-sampled profile on RISC-V hardware today, because no Linux-supported hardware primitive exists. Even the narrower processing-only path (feeding a riscv64 *target* binary into the x86-hosted tool) is non-functional because the vendored LLVM build excludes the RISCV target.

**Performance gaps:** No AutoFDO-specific performance benchmarks exist for RISC-V (see Section 13 research note). The closest available data point is ARM, not RISC-V: an LLVM Discourse post on enabling AutoFDO+Propeller on Arm via SPE reports Fleetbench `BM_Protogen_Arena` improving from a 9,271,691 ns baseline to 9,152,992 ns (AutoFDO-only) to 9,052,150 ns (AutoFDO+Propeller) - roughly 2.4% total improvement. This is cited only as an illustration of what a completed non-x86 port can look like; it is not a RISC-V measurement and should not be extrapolated as a RISC-V performance projection [NEEDS VERIFICATION - ARM figures are single-sourced from one Discourse post, and are not RISC-V data at all].

**Security hardening gaps:** Data not available: no search performed or findings returned on autofdo-specific security hardening (ASLR, stack protector, CFI) differentiated by architecture. Given the profiling-tool nature of autofdo, this is not identified in the research findings as an architecture-differentiated concern.

**NaN / floating-point semantics issues:** Data not available: no findings address floating-point semantics in autofdo (the tool operates on integer sample counts and ELF/DWARF metadata, not floating-point compute kernels), so this axis is not applicable to this project's function.

## 7. CI/CD Infrastructure

**riscv64 CI does not exist.** Confirmed by direct inspection of file content, not inference: the `.github/workflows` directory contains exactly two files, `ci.yml` and `create-release-build.yaml`. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `azure-pipelines.yml`, `.circleci/config.yml`, `appveyor.yml`, or `buildkite.yml` exist (all return 404). A repo-wide GitHub code search for `riscv`/`RISCV` returns 0 results across the entire repository, not just the workflow files.

**ci.yml (full content inspected):** Triggers on `push` (default branch), `pull_request` (opened/reopened/synchronize), `workflow_dispatch`. Runner: `ubuntu-22.04-8core` - a standard GitHub-hosted x86_64 runner, no `strategy:` matrix block at all (single linear job). Steps: checkout -> apt install deps -> cmake configure with clang (LLVM tool mode) -> make -> make test -> repeat cmake/make/test with gcc (GCOV tool mode). No QEMU, no cross-compilation flags, no `--target=riscv64`.

**create-release-build.yaml (full content inspected):** Triggers on tag push (`v*`) and `workflow_dispatch`. Runner: `ubuntu-22.04-8core` (same x86_64 runner). Builds `create_llvm_prof`, runs tests, packages as `create_llvm_prof-x86_64-${{github.ref_name}}.zip` - the artifact filename itself hardcodes `x86_64`.

**RISE runners:** None found. No RISE-branded CI runner (`riscv-runner`, `riscv-runner-app`, `riscv-runner-images`) references AutoFDO in any search performed against the `riseproject-dev` GitHub org (49 repos checked). No RFP/funded project (RP001-RP009 and others named in RISE blog posts) is described as AutoFDO-related.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GitHub Actions CI (build+test) | Yes (`ubuntu-22.04-8core`) | No | No |
| Release packaging CI | Yes (`create_llvm_prof-x86_64-*.zip`) | No | No |
| Cross-compile / QEMU CI lane | No (not needed, native) | No | No |
| RISE-funded/hosted CI | No | No | No |
| Downstream distro CI (Debian buildd, Ubuntu launchpad - external to this repo) | Yes | Yes | Yes (native riscv64 hardware, `rv-osuosl-03`; see Section 8) |

## 8. Distribution and Release Status

**GitHub Releases (upstream):** No riscv64 binary in any of the 13 releases (v0.11 through v0.30.1), verified via the full paginated Releases API. Only x86_64 zips (`create_llvm_prof-x86_64-*.zip`) or bare source tarballs (`0.19.tar.gz`/`0.19.zip`) exist; several older releases (v0.20.1, v0.20, 0.18, 0.17, 0.16, v0.15, v0.14, v0.13, v0.12, v0.11) have no attached assets at all.

**PyPI:** Not applicable. `pypi.org/pypi/autofdo/json` and `pypi.org/simple/autofdo/` both return HTTP 404 (confirmed via both WebFetch and raw curl) - autofdo has no PyPI project because it is a C++ toolchain, not a Python package.

**RISE GitLab PyPI wheel-builder proxy:** `gitlab.com/api/v4/projects/56254198/packages/pypi/simple/autofdo/` returns an HTTP 302 redirect to the same upstream PyPI 404. Not applicable, nothing published.

**Ubuntu (noble 24.04+):** riscv64 present and confirmed three ways: (1) package search page lists architecture `amd64 arm64 armhf ppc64el riscv64 s390x` for `autofdo` 0.19-3build3 (universe/devel); (2) the `Packages.gz` index for `binary-riscv64` on `ports.ubuntu.com` was parsed directly and confirms `Package: autofdo / Architecture: riscv64 / Version: 0.19-3build3`; (3) a direct HTTP HEAD request against the riscv64 ports mirror for a newer build (`autofdo_0.19-4build1_riscv64.deb`) returned HTTP 200 with Content-Length 723094 bytes, Last-Modified 2026-07-24.

**Debian (sid):** riscv64 present and confirmed three ways: (1) buildd status page shows riscv64 row "Installed," version 0.19-4, built on host `rv-osuosl-03` (real riscv64 hardware, not emulation); (2) the build log shows `"I: Built successfully"`, `Build-Time: 941`, finished 2025-12-04T09:45:08Z; (3) direct `curl -sIL` against two independent mirrors (`deb.debian.org` and `ftp.debian.org`) for `autofdo_0.19-4_riscv64.deb` both returned HTTP 200 with an identical Content-Length of 633108 bytes, matching the package page's independently reported size.

**Arch Linux RISC-V (archriscv.felixc.at):** Not present. A full crawl of the `extra/`, `core/`, `community/`, `unsupported/`, and `multilib/` repo sections (14,251 packages in `extra/` alone) found no package named `autofdo` anywhere - not a build failure, simply absent from the archriscv package set entirely (likely because it is not in upstream Arch's own repos either).

**Critical caveat (load-bearing for this section):** The Debian and Ubuntu riscv64 packages are **downstream distro packaging artifacts, not an upstream RISC-V port**. Both distros build `autofdo` from the frozen, pre-CMake **0.19** release using the legacy autotools build (`configure.ac`/`Makefile.am`, deleted from the git repo on 2020-10-28 in commit `dcb8315`, "Remove everything"; the actual current CMake-based tool has never been built for riscv64 by anyone, upstream or downstream). Debian's `debian/control` Build-Depends omit any LLVM dev package, so `configure` prints `"could not detect LLVM version 5 (or higher) libraries. Support for LLVM profiles disabled"` - the riscv64 `.deb` binaries that exist today are built **without** `HAVE_LLVM`, meaning real LLVM sample-profile writing is compiled out. They build only because Debian/Ubuntu's autobuilder policy compiles every "Architecture: any" package by default and nothing in autofdo's build system architecturally gates out riscv64 at the autotools/0.19 level - it is not evidence of a functioning, LLVM-capable, riscv64-validated AutoFDO toolchain.

**What a user must do to get a working binary today:** `apt install autofdo` on Debian sid or Ubuntu 24.04+ riscv64 yields a functional but LLVM-profile-disabled `create_gcov`/GCOV-mode binary from the 2019-era codebase. There is no path to a working `create_llvm_prof` (LLVM mode) on riscv64 via any official or distro channel; building from source requires manually patching `CMakeLists.txt` to add `RISCV` to `LLVM_TARGETS_TO_BUILD` (untested by anyone per these findings) and, even then, provides no way to *collect* a real branch-sampled profile on RISC-V hardware because no Linux kernel driver exists for the CTR extension.

## 9. Dependencies

**Method note (from research):** Identified via `CMakeLists.txt` and `.gitmodules` at HEAD `c9fa188b` (master, 2026-07-28): 5 git submodules plus `find_library`/`find_package` system dependencies, cross-checked against `project-reports/scope.yml` and Debian buildd riscv64 status.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Community/Blocking Issues |
|---|---|---|---|---|---|
| LLVM/llvm-project (vendored submodule, pinned Nov 2024, commit `9fde1a49`) | Statically-linked MC/disassembler/object backend (`LLVMMC`, `LLVMObject`, `LLVMTargetParser`, `LLVMDebugInfoDWARF`, `LLVMProfileData`) powering `mini_disassembler`, Propeller CFG builder, `create_llvm_prof`/`profile_merger`/`sample_merger` | Host build likely OK (Debian `llvm-toolchain-21` "Installed" on riscv64), but autofdo's own `CMakeLists.txt` hardcodes `LLVM_TARGETS_TO_BUILD X86 AArch64` - the RISCV target backend is never compiled in | No riscv64 CI at all; `mini_disassembler.cc` would return "no target for triple" for any riscv64 input object file - Propeller/AutoFDO cannot process RISC-V target binaries even where the host tool runs | No riscv64 binary artifacts; release pipeline hardcodes x86_64 naming | No open autofdo issue/PR requests adding `RISCV` to `LLVM_TARGETS_TO_BUILD`. Successor `google/llvm-propeller` carries forward the identical restriction. Debian's `llvm-toolchain-19` is currently FTBFS on all architectures incl. riscv64 (bug [#1142869](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1142869), abseil-ABI transition fallout, not RISC-V-specific) |
| Abseil-cpp (vendored submodule) | Core C++ foundation (strings, hashing, `absl::status`, containers) linked into `mini_disassembler`, `symbol_map`, `llvm_propeller_objects` | Builds on riscv64 (Debian sid "Installed") | 2 open SEGFAULTs on Debian riscv64 ([abseil/abseil-cpp#2002](https://github.com/abseil/abseil-cpp/issues/2002), open since 2026-02-03, no upstream response; passes on Ubuntu riscv64) | Source-only, no riscv64 binary releases | [abseil/abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702) (open): `-latomic` required for GCC-11.x cross-compile, not auto-injected |
| OpenSSL (system `libcrypto`, REQUIRED) | Directly called by bundled `perf_data_converter`/quipper for MD5/EVP build-ID digest hashing | Builds on riscv64 (Debian sid "Installed") | Intermittent CI flakiness ([#30880](https://github.com/openssl/openssl/issues/30880)) and a constant-time/AES-without-Zkn caveat ([#20980](https://github.com/openssl/openssl/issues/20980)) - neither touches autofdo's plain MD5/EVP usage | Debian/Ubuntu packages only, no official riscv64 upstream binaries | None blocking for autofdo's narrow MD5 usage |
| zlib (system `libz`, REQUIRED) | Linked into `quipper_perf` (perf.data decompression) and transitively into vendored LLVM | Builds on riscv64 (Debian sid "Installed") | No riscv64-specific failures found | Source-only, Debian/Ubuntu packages available | None found |
| zstd (`LLVM_ENABLE_ZSTD FORCE_ON`) | Pulled into vendored LLVM build for compressed-section/bitcode support | Builds on riscv64 | Historical linker issue on a StarFive VisionFive board ([facebook/zstd#3134](https://github.com/facebook/zstd/issues/3134), 2022, closed/resolved); no open riscv64 issues | `apt install zstd libzstd-dev` available on Debian/Ubuntu riscv64 | None currently open |
| elfutils/libelf (system, REQUIRED in both GCOV and LLVM modes) | ELF section/symbol-table access for `addr2line_lib`, `symbol_map`, `profile_merger` | Builds on riscv64 (Debian sid "Installed") | Debian `elfutils-debian-riscv` Buildbot worker offline since 2023 (infra gap; Ubuntu riscv64 builder active); an unrelated live-unwind FP-register gap in `riscv_initreg.c` is irrelevant to autofdo's static (non-ptrace) ELF parsing | Debian sid only, riscv64 not yet in Debian stable (bookworm) | None critical for autofdo's static-ELF usage |
| Protocol Buffers (system, REQUIRED) | Serializes `perf.data`->proto, Propeller CFG, options | Builds on riscv64 (Debian sid "Installed"); cross-compiling with GCC 11.x needs explicit `-latomic` (inherited via abseil-cpp) | No protobuf-core riscv64 test failures | Source-only, no official `protoc` riscv64 prebuilt ([protocolbuffers/protobuf#17798](https://github.com/protocolbuffers/protobuf/issues/17798), closed without resolving Maven Central riscv64 artifacts) | None release-blocking - autofdo always builds `protoc`/`libprotobuf` from source |

**Bundled/build-only dependencies** (not independently in `project-reports/scope.yml`):

| Dependency | riscv64 status | Notes |
|---|---|---|
| glog | Debian sid "Installed" on riscv64 | No open riscv64 GitHub issues found |
| gflags | Debian sid "Installed" on riscv64 | No open riscv64 GitHub issues found |
| googletest | Debian sid "Installed" on riscv64 | One open self-test failure ([google/googletest#3756](https://github.com/google/googletest/issues/3756), `GetThreadCountTest`) - test-infra only, not linked into shipped binaries |
| perf_data_converter/quipper | Not independently packaged; inherits riscv64 status from libcrypto/zlib/protobuf (all clean) | This is the actual code consuming `openssl/evp.h`+`openssl/md5.h`; no dedicated riscv64 issues found |

**Deep-dive: the LLVM dependency is the load-bearing one.** Every other dependency in the table builds and largely tests clean on riscv64 (modulo unrelated infra flakiness). The entire riscv64 gap for autofdo is concentrated in one line of its own build configuration (`CMakeLists.txt:267`, `LLVM_TARGETS_TO_BUILD X86 AArch64`) plus the absence of a Linux-kernel-supported hardware branch-sampling primitive on RISC-V - neither of which is a problem in any *dependency*, both are gaps in autofdo/Propeller's own code and in the RISC-V hardware/kernel ecosystem it depends on for its core function.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [google/autofdo#152](https://github.com/google/autofdo/issues/152) | "Unrecognized sample profile encoding format" | Open (since 2022-11-14, last activity 2022-11-21) | Low (design-discussion, not a crash) | Original encoding-format bug never root-caused; thread became a cross-architecture-applicability discussion. Maintainer statement: "AutoFDO profiles can only be collected for Intel CPUs, but binaries optimized by such profiles see similar performance improvement on both Intel and AMD platforms" and, on RISC-V specifically: profiles are "applicable to heterogeneous architectures, if the binary on RISCV architecture has the same execution path as on X86" - otherwise the compiler optimizes toward the wrong (x86) hot path and can regress the other architecture |
| [google/autofdo#195](https://github.com/google/autofdo/issues/195) | "use_lbr was enabled but range_count_map was empty!" | Open (since 2024-05-24, last activity 2025-06-18) | Medium (silently degrades profile quality; only 3-5% improvement reported by the original poster vs. expected higher) | Not RISC-V-specific (x86 LBR profiling), but cross-referenced by maintainer snehasish as sharing the same DWARF/debug-info root cause as #196. Four independent reporters (michaelrun, muween, danilaml, jakesteele) hit the same warning 2024-2025; `-fdebug-info-for-profiling` suggested as a workaround but not confirmed effective by any reporter; no fix merged |
| [google/autofdo#196](https://github.com/google/autofdo/issues/196) | "Cannot generate gcov data with `create_gcov`" | Open (since 2024-06-28, last activity 2024-08-08) | High for the specific riscv64-target-profiling use case (blocks the workflow entirely); the bug itself is a DWARF-parser correctness gap | **Correctness bug, root-caused but unfixed:** `util/symbolize/dwarf2reader.cc`'s `CompilationUnit::ReadHeader()` does not recognize `DW_UT_partial` compilation-unit type or `DW_FORM_GNU_ref_alt` DWARF form (emitted by the `dwz` DWARF-optimizer tool). Contributor erozenfeld posted a one-line inline patch (`+= DW_UT_partial` check) but it was **never submitted as a PR or merged** - verified by checking the current file at HEAD, which still only checks `DW_UT_compile`/`DW_UT_skeleton`/`DW_UT_split_compile`. Separately, large `perf.data` files (30+GB) cause `create_gcov` to be OOM-killed even on a 128-core/512GB host |
| [google/llvm-propeller#269](https://github.com/google/llvm-propeller/issues/269) | "Can propeller optimize RISCV binaries?" | Open (since 2024-12-11) | High (blocks the entire Propeller-on-RISC-V use case) | Maintainer dhoekwater: "Short answer: no, not currently." Lists 4 missing pieces: basic-block-address-map codegen support, branch-profile hardware collection, profile-format conversion tooling, basic-block-sections codegen for the optimized rebuild. States "there doesn't look to be a standard RISC-V extension for branch sampling." Follow-up comment (2025-01-22) points to RISC-V CTR (ratified Nov 2024) as the closest analog, but no confirmed shipping silicon or Linux driver exists |
| [llvm/llvm-project PR#170992](https://github.com/llvm/llvm-project/pull/170992) | "[RISCV] Add Propeller support for RISC-V" | Open, stalled | N/A (feature PR) | Small patch (+29/-1, 3 files). Author reports successful build/test on real RISC-V hardware using SPEC CPU2017 `510.parest_r`. Two RISC-V LLVM maintainers approved ("LGTM") in Dec 2025, but PR shows merge conflicts (`mergeable_state: dirty`) and no activity since 2026-03-26 - stale ~5 months as of 2026-08-14 |
| [llvm/llvm-project PR#213919](https://github.com/llvm/llvm-project/pull/213919) | "[BOLT][RISCV] Improve relocations, jump tables, and split-function handling" | Open (draft) | N/A (feature PR) | Adjacent post-link PGO tool (BOLT, not AutoFDO/Propeller directly); +2058/-187 across 35 files, explicitly WIP, to be split into smaller PRs |
| [llvm/llvm-project#100922](https://github.com/llvm/llvm-project/issues/100922) | "BOLT could not find corresponding %pcrel_hi on RISC-V" | Open | Medium | BOLT/RISC-V relocation bug |
| [llvm/llvm-project#135711](https://github.com/llvm/llvm-project/issues/135711) | "[BOLT][RISC-V] Segmentation Fault in Rewritten RISC-V Executable Due to Incorrect Symbol Relocation" | Open | High (crash/correctness) | BOLT/RISC-V correctness bug |
| [llvm/llvm-project#136588](https://github.com/llvm/llvm-project/issues/136588) | "[BOLT][RISCV] could not find corresponding %pcrel_hi" | Open | Medium | BOLT/RISC-V relocation bug, likely related to #100922 |
| [llvm/llvm-project#146542](https://github.com/llvm/llvm-project/issues/146542) | "[BUG][RISCV][BOLT] Incorrect GOT Relocation Handling in some case" | Open | High (correctness) | BOLT/RISC-V correctness bug |
| [llvm/llvm-project#133189](https://github.com/llvm/llvm-project/issues/133189) | "[RISCV] Issue in creating BOLT optimised Kernel" | Open | Medium | BOLT/RISC-V kernel build issue; maintainer WangJee clarifies only instrumentation mode works on RISC-V, not perf/LBR sampling |
| [llvm/llvm-project#141310](https://github.com/llvm/llvm-project/issues/141310) | "[BOLT] RISCV tests rely on relocations that are not guaranteed" | Open | Low (test-suite fragility) | |
| [llvm/llvm-project#145548](https://github.com/llvm/llvm-project/issues/145548) | "[RISCV][Instrumentation] Instrumentation for mysql failed" | Open | Medium | BOLT instrumentation-based PGO path failure on a real-world binary |

**Correctness bugs highlighted separately:** #196 (DWARF parser rejects valid `dwz`-processed debug info - has a drafted, unlanded fix) and the three BOLT/RISC-V relocation/symbol bugs (#135711, #136588, #146542) are genuine correctness defects, not missing features. None are AutoFDO/`google/autofdo`-repo bugs in the strict sense except #196; the BOLT bugs live in the adjacent `llvm/llvm-project` repo and affect a different (but pipeline-adjacent) post-link optimization tool.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer has expressed opposition to a RISC-V port. The tone throughout issue #152 and #196 is helpful and diagnostic (maintainers actively triage, root-cause, and propose fixes), just unresourced to completion.

**Technical blockers (primary, ranked by severity):**
1. **No RISC-V hardware branch-sampling primitive with Linux support.** AutoFDO's core profile-collection mechanism depends on LBR (Intel) or SPE (Arm, added via commit `623c777`). RISC-V's Control Transfer Records (Smctr/Ssctr) extension was ratified 2024-11-22 but has zero Linux kernel driver as of this research (confirmed by absence of `riscv_ctr.c` in `torvalds/linux` `drivers/perf/`, and independently by a third-party PMU survey stating "CTR is ratified but has no Linux consumer... no kernel driver publishes a `PERF_SAMPLE_BRANCH_STACK` on RISC-V yet," citing Linux v7.1-rc6, 2026-05-31). This is a kernel/hardware-ecosystem blocker, not something fixable inside autofdo's own repo.
2. **`CMakeLists.txt` line 267 hardcodes `LLVM_TARGETS_TO_BUILD X86 AArch64`.** This is fixable inside autofdo's own repo (a one-line CMake change), but no PR has ever attempted it, and doing so only enables riscv64 *target-binary processing*, not profile collection.
3. **DWARF-reader gap** (`DW_UT_partial`/`DW_FORM_GNU_ref_alt` unhandled) blocks processing of `dwz`-optimized binaries, which is common in distro-packaged RISC-V binaries. Fix drafted but unlanded (issue #196).
4. **Propeller's 4 stated missing pieces** per maintainer dhoekwater in `google/llvm-propeller#269`: basic-block-address-map codegen support, branch-profile hardware collection, profile-format conversion tooling, basic-block-sections codegen for the optimized rebuild.

**Organizational blockers:** No evidence of any. The blockers are purely technical/architectural (RISC-V PMU ecosystem immaturity) and resourcing (no one has prioritized the CMake fix or the DWARF fix to completion), not governance-related. AutoFDO has no formal RFC/RFP process visible in these findings, so there is no procedural gate to clear beyond a maintainer reviewing a PR.

**Acceptance probability:** For the narrow CMake `LLVM_TARGETS_TO_BUILD` fix and the DWARF-reader fix, acceptance probability is high if submitted as PRs - both are small, uncontroversial, and maintainers have already engaged substantively and constructively on the underlying issues. For full end-to-end AutoFDO profile *collection* on RISC-V, acceptance is not yet a live question because the prerequisite hardware/kernel capability (a CTR Linux driver) does not exist; this blocks the port at a layer below anything a PR to `google/autofdo` could address.

## 13. Investment Analysis

**RISE prior work check:** No RISE-funded or RISE-affiliated work on AutoFDO exists. Checked and confirmed absent: the full RISE blog post index (26-32 posts across the two research passes, 2024-05 through 2026-07), the on-site search (`riseproject.dev/?s=autofdo` returns "Sorry, no results were found"), the `riseproject.gitlab.io/python/wheel_builder/` package list (60+ packages, no "autofdo"), the `riseproject-dev` GitHub org (49 repos, including `compilers-and-toolchains-wg` with 86 issues - none mention AutoFDO/PGO/FDO/"profile"). The one RISE-funded project in the adjacent compiler-optimization space, "Project RP009: LLVM SPEC Optimization" (SpacemiT-X60 scheduling model, SLP vectorizer, IPRA), does not touch AutoFDO/PGO/FDO. Google is a RISE Premier Member, but this membership does not extend to any AutoFDO-specific institutional backing. **No prior/funded work needs to be excluded from the sizing below.**

### 13.1 Functional Enablement

Two independent, small, well-scoped fixes exist and are ready to be picked up:
- Add `RISCV` to `LLVM_TARGETS_TO_BUILD` in `google/autofdo`'s `CMakeLists.txt`, add CI coverage (currently zero riscv64 CI of any kind), and validate that `mini_disassembler`/Propeller CFG builder can actually resolve and process riscv64 target-binary triples end-to-end.
- Land the `DW_UT_partial`/`DW_FORM_GNU_ref_alt` DWARF-reader fix already drafted inline in issue #196 (needs a reproducer binary, a formal PR, and test coverage against `dwz`-processed binaries).

Beyond these, true functional enablement of AutoFDO's core value proposition (hardware-sampled branch-profile collection) on RISC-V is blocked on work outside `google/autofdo`'s repo entirely: a Linux kernel driver for RISC-V CTR (Smctr/Ssctr), plus `perf` tooling support to expose `PERF_SAMPLE_BRANCH_STACK` from that driver. This is a kernel/toolchain-ecosystem dependency, not something scoped to autofdo itself.

### 13.2 Performance Optimization

Not assessable with current data. No AutoFDO-specific RISC-V performance benchmarks exist anywhere in the research findings (GitHub, RISE, or general web search). Performance optimization work cannot be scoped until functional enablement (13.1) and the underlying CTR kernel driver exist, since there is currently no way to even collect a real RISC-V AutoFDO profile to optimize against.

### 13.3 CI/CD Infrastructure

Add a riscv64 lane to `.github/workflows/ci.yml` (currently a single x86_64-only job, no matrix strategy) covering both LLVM and GCOV tool-build modes. Given the vendored-LLVM-submodule build is CPU/memory-intensive (implied by the OOM-kill behavior seen even on a 128-core/512GB x86 host in issue #196, though that was for `perf.data` processing not compilation), this likely requires either QEMU emulation (slow) or access to real riscv64 CI hardware (RISE-style runner or equivalent).

### 13.4 Ecosystem Enablement

Not applicable in the traditional sense - see Section 10 note below. AutoFDO's "ecosystem" is the compilers that consume its profiles (GCC, LLVM/Clang), not a package ecosystem of plugins/extensions. Those compilers' own riscv64 status is out of scope for this report (see `project-reports/lldb.md` and other LLVM-adjacent reports in this repository for that angle, per the research findings' own cross-reference).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `RISCV` to `LLVM_TARGETS_TO_BUILD` in `CMakeLists.txt`; validate riscv64-target-binary processing end-to-end (Propeller CFG builder, `mini_disassembler`) | 1-2 | Compiler toolchain team | High |
| Functional | Land the drafted DWARF-reader fix for `DW_UT_partial`/`DW_FORM_GNU_ref_alt` (issue #196); obtain a clean reproducer, submit as formal PR with test coverage | 1 | Compiler toolchain team | Medium |
| Functional (ecosystem-blocking, outside this repo) | RISC-V CTR (Smctr/Ssctr) Linux kernel driver + `perf` `PERF_SAMPLE_BRANCH_STACK` support | 8-16 (kernel + perf-tools, cross-org effort, not scoped to autofdo) | Linux kernel RISC-V PMU maintainers / silicon vendors with CTR-capable hardware | Critical (blocks everything else) |
| CI/CD | Add riscv64 CI lane (build+test, both LLVM and GCOV modes) to `ci.yml`; determine QEMU vs. native-hardware runner strategy | 2-3 | Infra/CI team | Medium |
| Performance | Benchmark AutoFDO+Propeller impact on a riscv64 SPEC/Fleetbench-style workload once functional enablement lands | 2-4 (post-functional-enablement only) | Performance team | Low (blocked until 13.1 and CTR driver land) |

## 14. Updates
(No updates yet -- initial report dated 2026-06-17.)

## 15. References

- [google/autofdo repository](https://github.com/google/autofdo)
- [google/autofdo issue #152 - "Unrecognized sample profile encoding format"](https://github.com/google/autofdo/issues/152)
- [google/autofdo issue #195 - "use_lbr was enabled but range_count_map was empty!"](https://github.com/google/autofdo/issues/195)
- [google/autofdo issue #196 - "Cannot generate gcov data with create_gcov"](https://github.com/google/autofdo/issues/196)
- [google/autofdo README.md](https://github.com/google/autofdo/blob/master/README.md)
- [google/autofdo CMakeLists.txt](https://github.com/google/autofdo/blob/master/CMakeLists.txt)
- [google/autofdo docs/OptimizeClangO3WithPropeller.md](https://github.com/google/autofdo/blob/master/docs/OptimizeClangO3WithPropeller.md)
- [google/autofdo .github/workflows/ci.yml](https://github.com/google/autofdo/blob/master/.github/workflows/ci.yml)
- [google/llvm-propeller issue #269 - "Can propeller optimize RISCV binaries?"](https://github.com/google/llvm-propeller/issues/269)
- [llvm/llvm-project PR #170992 - "[RISCV] Add Propeller support for RISC-V"](https://github.com/llvm/llvm-project/pull/170992)
- [llvm/llvm-project PR #213919 - "[BOLT][RISCV] Improve relocations, jump tables, and split-function handling"](https://github.com/llvm/llvm-project/pull/213919)
- [llvm/llvm-project issue #100922 - BOLT %pcrel_hi on RISC-V](https://github.com/llvm/llvm-project/issues/100922)
- [llvm/llvm-project issue #135711 - BOLT RISC-V segfault](https://github.com/llvm/llvm-project/issues/135711)
- [llvm/llvm-project issue #136588 - BOLT RISCV %pcrel_hi](https://github.com/llvm/llvm-project/issues/136588)
- [llvm/llvm-project issue #146542 - BOLT RISCV GOT relocation](https://github.com/llvm/llvm-project/issues/146542)
- [llvm/llvm-project issue #133189 - RISCV BOLT optimised kernel issue](https://github.com/llvm/llvm-project/issues/133189)
- [llvm/llvm-project issue #141310 - BOLT RISCV test relocations](https://github.com/llvm/llvm-project/issues/141310)
- [llvm/llvm-project issue #145548 - RISCV instrumentation for mysql failed](https://github.com/llvm/llvm-project/issues/145548)
- [llvm/llvm-project PR #133882 - Initial instrumentation support for RISCV64](https://github.com/llvm/llvm-project)
- [RISC-V Control Transfer Records v1.0 release](https://github.com/riscv/riscv-control-transfer-records/releases/tag/v1.0)
- [LLVM Discourse - Enabling AutoFDO/Propeller optimizations on Arm with SPE](https://discourse.llvm.org/t/enabling-autofdo-propeller-optimizations-on-arm-with-spe/78980)
- [Ubuntu Packages - autofdo (noble)](https://packages.ubuntu.com/search?keywords=autofdo&suite=noble&searchon=names&section=all)
- [Debian Package Tracker - autofdo](https://tracker.debian.org/pkg/autofdo)
- [Debian Buildd - autofdo status](https://buildd.debian.org/status/package.php?p=autofdo)
- [Debian sources - autofdo 0.19-4](https://sources.debian.org/src/autofdo/0.19-4/)
- [Arch Linux RISC-V repository listing](https://archriscv.felixc.at/repo/extra/)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Project RSS feed](https://riseproject.dev/feed/)
- [RISE Project blog - Project RP009: LLVM SPEC Optimization](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [riseproject-dev/compilers-and-toolchains-wg](https://github.com/riseproject-dev/compilers-and-toolchains-wg)
- [abseil/abseil-cpp issue #2002 - riscv64 SEGFAULTs](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil/abseil-cpp issue #1702 - -latomic cross-compile requirement](https://github.com/abseil/abseil-cpp/issues/1702)
- [openssl/openssl issue #30880 - test_lhash flakiness](https://github.com/openssl/openssl/issues/30880)
- [openssl/openssl issue #20980 - AES without Zkn caveat](https://github.com/openssl/openssl/issues/20980)
- [facebook/zstd issue #3134 - VisionFive linker issue](https://github.com/facebook/zstd/issues/3134)
- [protocolbuffers/protobuf issue #17798 - Maven Central riscv64 artifacts](https://github.com/protocolbuffers/protobuf/issues/17798)
- [google/googletest issue #3756 - GetThreadCountTest failure](https://github.com/google/googletest/issues/3756)
- [Debian bug #1142869 - llvm-toolchain-19 FTBFS](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1142869)