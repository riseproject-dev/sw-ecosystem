---
title: llvm-propeller
parent: Project Reports
---

# llvm-propeller

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for llvm-propeller<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

llvm-propeller is a profile-guided post-link optimizer for ELF binaries. It uses Linux perf branch-stack profiles to reconstruct a control-flow graph, then reorders basic blocks and functions to reduce instruction-cache pressure and iTLB misses. The tool operates in two passes: an instrumented binary build (emitting a basic block address map) followed by a profile-driven relink using LLVM's lld. It is conceptually similar to BOLT but prioritizes low memory and low time overhead for continuous integration workflows.

The published x86 benchmark (Clang self-compilation on Intel Skylake hardware) shows -20% cycle reduction, -53% L1-icache-misses, and -17% elapsed time versus an O3 baseline. All published data is x86-only.

**Governance.** The repository is hosted at [github.com/google/llvm-propeller](https://github.com/google/llvm-propeller) under the `google` GitHub organization. License is Apache-2.0. AUTHORS lists only "Google Inc." There is no OWNERS/CODEOWNERS/MAINTAINERS file, no steering committee, no governance document, and no foundation affiliation. Governance is Google-internal maintainer-driven. The project is not a member of RISE or RISC-V International.

**Corporate sponsors.** Google is the sole corporate sponsor. All 13 contributors carry `@google.com` email addresses, with one partial exception (2 commits from an external contributor). The project uses a team bot account `propeller-dev@google.com` for automated LLVM upstream sync commits.

**Community culture on new ports.** The project has never accepted an external port contribution. There is no documented tier policy, no platform support matrix, and no public roadmap. The maintainer's response to [issue #269](https://github.com/google/llvm-propeller/issues/269) (RISC-V inquiry, Dec 2024) was informative but noncommittal: they identified the four required work items without expressing any intent to implement them or accepting external contributions for that purpose.

**Repository health.** 539 stars, 48 forks; active development through August 2026, including LLVM syncs and feature work (code prefetch directives, post-link frequencies, cloning improvements). 37 open issues.

---

## 2. Port History and Upstreaming Timeline

No RISC-V port exists or has ever been started.

| Date | Event | Source |
|---|---|---|
| 2022-10-19 | Repository created by Han Shen (Google); x86_64-only from inception | [initial commit, google/llvm-propeller](https://github.com/google/llvm-propeller) |
| 2024-12-11 | Issue #269 filed: "Can propeller optimize RISCV binaries?" | [issue #269](https://github.com/google/llvm-propeller/issues/269) |
| 2024-12-16 | Maintainer dhoekwater responds: "Short answer: no, not currently." Identifies 4 blockers. | [issue #269 comment](https://github.com/google/llvm-propeller/issues/269) |
| 2025-01-22 | Community commenter bcstrongx notes RISC-V Smctr/Ssctr (CTR) ISA extension ratified v1.0; notes no hardware is yet available | [issue #269 comment](https://github.com/google/llvm-propeller/issues/269) |

A full scan of all 319 commits found zero mentions of "riscv", "risc-v", or "risc_v" in any commit message. GitHub code search for `riscv repo:google/llvm-propeller` returned 0 results. There is no tracking issue, no milestone, no assigned PR, and no development branch for a RISC-V port.

---

## 3. Upstream Support Tier

There is no documented tier policy. The project publishes no platform support matrix.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI (automated build+test) | Yes - all CI runs on ubuntu-22.04-16core x86_64 | No CI runner; ARM testdata exists in repo | No |
| Release binaries | No (zero releases on any channel) | No | No |
| Perf profile collection | Full (LBR via perf) | Full (Arm SPE via perf) | Not possible (no shipping hardware with CTR) |
| Basic block address map emission | Supported in Clang (`-fbasic-block-address-map`) | Supported in Clang | Not supported in Clang |
| Optimized relink | Supported (`-fbasic-block-sections=list`) | Supported | Not supported in Clang |
| Architecture code in repo | Full | Partial (thunk reading, instruction size, SPE decoding, ARM testdata) | None |

The CI workflow file (`.github/workflows/ci.yaml`) contains a comment that reads: "Currently, we only have builds on Ubuntu 22.04 for x86_64." No matrix builds, no QEMU, no cross-compilation.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

llvm-propeller has four architecture-specific subsystems. All are absent for riscv64.

**4.1 Branch profile collection (hardware sampling)**

The instrumentation phase collects branch stacks from the Linux `perf` subsystem. On x86_64, this uses Intel Last Branch Record (LBR) entries. On AArch64, this uses Arm Statistical Profiling Extension (SPE) via `arm_spe_0`. The codebase contains six SPE-specific source files (`propeller/spe_tid_pid_provider.cc`, `propeller/perfdata_reader.cc`, etc.) that call `quipper::ArmSpeDecoder` directly.

For riscv64: no hardware branch-sampling mechanism is available on shipping hardware. The RISC-V Control Transfer Record (CTR) extensions (Smctr/Ssctr) were ratified at v1.0 in January 2025, but as of the research date no hardware implementing CTR exists and no software support for CTR has been added to the kernel, perf, or Propeller.

**4.2 Basic block address map (BBAM) emission**

Propeller requires binaries compiled with `-fbasic-block-address-map` to embed a `.llvm_bb_addr_map` section. In LLVM's clang driver (`clang/lib/Driver/ToolChains/Clang.cpp`, lines 6299-6329), this flag is gated to X86 and AArch64 targets only. riscv64 is not in that gate. The maintainer confirmed this in [issue #269](https://github.com/google/llvm-propeller/issues/269) and noted the exact file and line numbers required for a fix.

**4.3 Thunk symbol reading**

`propeller/binary_content.cc` `ReadThunkSymbols()` returns an empty map for any architecture that is not `llvm::Triple::aarch64`. This handles AArch64 linker-inserted thunks (`__AArch64ADRPThunk_`, `__AArch64AbsLongThunk_`). No equivalent exists for riscv64; RISC-V linker thunks are a separate class and are unhandled.

**4.4 Instruction size detection**

`propeller/frequencies_branch_aggregator.cc` `GetInstructionSize()` returns a fixed 4 bytes for `llvm::Triple::aarch64`. riscv64 has variable instruction width (4 bytes standard, 2 bytes with RISC-V Compressed/RVC extension) and requires separate handling. No branch for riscv64 exists.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Branch profile collection | Full (LBR) | Full (SPE, 6 source files) | Missing - no hardware, no software |
| BBAM emission (Clang flag) | Supported | Supported | Not supported in Clang |
| Thunk symbol reading | N/A (no thunks) | Implemented | Missing |
| Instruction size detection | Implicit (variable-length x86 handled generically) | Implemented (fixed 4) | Missing (RVC requires variable-width handling) |
| Optimized relink flag | Supported | Supported | Not supported in Clang |
| Test binaries | Present (sample.x86.bin, multiple LBR perfdata) | Present (sample.arm.bin, sample.arm.perfdata) | None |

The generic ELF reading, CFG construction, and code-layout logic (the majority of the codebase) uses LLVM's generic ELF object APIs and is theoretically architecture-agnostic. However, all four architecture-specific gates listed above must be implemented before the tool is functional on riscv64.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems.** The project supports both CMake/Ninja and Bazel.

CMake minimum version: 3.24. C++ standard: C++20. Required compiler: Clang 19 or newer (CI uses clang-20; GCC is not supported). System dependencies: `libelf-dev`, `libssl-dev`, `libzstd-dev`, `ninja-build`. LLVM is fetched automatically at build time, pinned to commit `db9b595ae3b30d67bd4068f80c651f97eb4dea2d`.

The CMake configuration (`CMake/LLVM/LLVM.cmake`) sets `LLVM_TARGETS_TO_BUILD X86 AArch64`. RISC-V is not in this list. A riscv64 build would require at minimum adding `RISCV` to `LLVM_TARGETS_TO_BUILD`; however, even with that change, the tool would not function because the four architecture-specific subsystems described in Section 4 are absent.

The Bazel configuration (`llvm_ext.bzl`) targets only `["AArch64", "X86"]`. The same gap applies.

**Cross-compilation.** No cross-compilation toolchain files, no Dockerfiles, no QEMU configuration, and no cross-compilation documentation exist anywhere in the repository. There is no `-DCMAKE_TOOLCHAIN_FILE` usage, no `--platforms` Bazel flag usage for non-host targets, and no `target_compatible_with = ["@platforms//cpu:riscv64"]` anywhere in any BUILD file.

**Known build failures for riscv64.** No build has been attempted. The LLVM dependency (built with X86 and AArch64 targets only) would not emit riscv64 codegen or support the required Clang driver flags even if a riscv64 host build were otherwise attempted.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| Profile collection from hardware | Full | Full | None | Functional - no shipping hardware with CTR |
| Clang instrumentation pass | Full | Full | None | Functional - Clang driver gate missing |
| Profile processing | Full | Full | None | Functional - dependent on above |
| Final optimized relink | Full | Full | None | Functional - Clang driver gate missing |
| Thunk handling | N/A | Partial | None | Functional |
| RVC (2-byte instruction) handling | N/A | N/A | None | Functional |
| CI validation | Full | None | None | Quality |
| Test coverage | Full | Partial | None | Quality |

**Performance gaps.** Data not available: no riscv64 performance measurements exist or can exist until the functional gaps are resolved.

**Security hardening gaps.** Not applicable - llvm-propeller is a build-time optimization tool with no runtime security surface.

**Floating-point/NaN semantics.** Not applicable - the tool operates on ELF metadata and branch profile data, not floating-point values.

The complete absence of riscv64 support is not a gap in a specific feature - it is a pre-functional state. The tool produces no output for riscv64 inputs.

---

## 7. CI/CD Infrastructure

No riscv64 CI exists.

The single CI workflow file (`.github/workflows/ci.yaml`) runs exclusively on `ubuntu-22.04-16core` (x86_64 GitHub Actions runner). The file contains no occurrence of "riscv" and includes the comment: "Currently, we only have builds on Ubuntu 22.04 for x86_64."

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job | Yes | No | No |
| Test job | Yes | No | No |
| QEMU emulation | No | No | No |
| RISE build farm runners | No | No | No |
| Self-hosted runners | No | No | No |

RISE has no involvement with llvm-propeller. A search of all 33 riseproject.dev blog posts (2024-05-15 through 2026-08-18) found zero mentions of "llvm-propeller" or "propeller". The RISE GitLab org (riseproject-dev) has no repository for llvm-propeller. The RISE PyPI wheel builder index does not include llvm-propeller. RISE has funded other LLVM work (RP009 scheduling model for SpacemiT-X60 via Igalia, LLVM CI infrastructure via Igalia/Alex Bradbury) but has no funded work specifically for llvm-propeller.

---

## 8. Distribution and Release Status

llvm-propeller has zero formal releases on any channel.

| Channel | Status |
|---|---|
| GitHub Releases (google/llvm-propeller) | Zero releases (gh api returns empty array) |
| PyPI | HTTP 404 - package does not exist |
| RISE wheel builder (GitLab PyPI index) | HTTP 302 redirects to PyPI; resolves to 404 |
| Ubuntu Noble packages | Zero results |
| Debian tracker | HTTP 404 - source package does not exist |
| Arch Linux RISC-V (archriscv.felixc.at) | Zero results |

The project is a C++ source-only tool. To obtain a working binary a user must clone the repository, satisfy all build dependencies (Clang 19+, LLVM built from the pinned commit, libelf, libssl, libzstd, CMake 3.24+, Ninja), and build from source on an x86_64 machine. No riscv64 binary can be produced because the tool does not support riscv64 targets regardless of host architecture.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking for riscv64 port |
|---|---|---|---|---|---|
| LLVM/Clang (pinned commit db9b595) | Codegen back-end; `-fbasic-block-address-map`; `-fbasic-block-sections=list`; ELF parsing | Builds (RISC-V is a supported LLVM target) | Open issues: miscompile at -O2 (#80792), LSan false leaks (#216580), CIR NPE (#215017) on riscv64 | No riscv64 prebuilt tarballs in official releases | CRITICAL BLOCKER: BBAM flag and basic-block-sections flag not wired for RISC-V in Clang driver |
| abseil-cpp v20260107.1 | Base utility library (strings, containers, synchronization) | Builds with caveats: linker error with riscv64 cross-toolchain (issue #1702, open) | SEGFAULT in hashtablez_sampler and cordz_sample_token tests on Debian riscv64 (issue #2002, open) | Source-only | Minor: linker error (#1702) blocks cross-builds; native builds may work |
| perf_data_converter / quipper (commit f9eb05f) | Parses Linux perf.data; extracts branch stacks | Unknown - no riscv64 CI in repo | No riscv64-specific results | Source-only | Indirect blocker: the branch-stack data it processes cannot be collected on riscv64 hardware regardless |
| Protocol Buffers v33.4 | Wire-format serialization for Propeller profiles | Builds (riscv64 support added, issue #12266 closed) | Passes | No riscv64 prebuilt protoc | None blocking |
| googletest v1.17.0 | Test harness (build/test only, not runtime) | Builds | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (issue #3756, open) | Source-only | Non-blocking for production |
| zstd v1.5.2 (LLVM sub-dependency) | Compressed debug/bitcode sections | Builds (all past riscv64 issues closed) | No open failures | Source builds work | None |
| zlib-ng v2.0.7 (LLVM sub-dependency) | Compression for LLVM bitcode | Builds | No open failures | Source-only | None |
| libelf (system dependency) | Reads ELF symbol tables and section headers | Builds and ships in all major Linux distros for riscv64 | Tested as part of elfutils | Available in Debian/Ubuntu/Fedora for riscv64 | None |
| OpenSSL/libcrypto (system dependency) | Cryptographic primitives (hash checks on profile data) | Builds; AES constant-time issue without Zkn extensions (#20980, open) | Occasional CI flakiness on riscv64 (#22166, #30880) | Available in all major distros for riscv64 | Non-blocking for build; security note on AES without Zkn |

**Critical dependency deep-dive: LLVM/Clang**

This is the only dependency that is a hard functional blocker. The issue is not build failure - LLVM builds and supports RISC-V as a codegen target. The issue is that two Clang driver flags are gated behind `ArchSupportsBasicBlockSections()` which returns true only for X86 and AArch64:

- `-fbasic-block-address-map`: required to produce the annotated binary for profile collection
- `-fbasic-block-sections=list`: required to consume Propeller profiles and emit the optimized binary

The maintainer in [issue #269](https://github.com/google/llvm-propeller/issues/269) pointed to `clang/lib/Driver/ToolChains/Clang.cpp` lines 6299-6329 in llvm-project as the exact modification point. This change would need to be upstreamed to llvm-project, not to google/llvm-propeller. Additional validation of RISC-V-specific linker behavior with basic-block-sections would be required after the driver change, as the maintainer noted that RISC-V-specific details may cause regressions.

Existing reports for overlapping dependencies: [abseil-cpp](../abseil-cpp.md), [protocol-buffers](../protocol-buffers.md), [googletest](../googletest.md), [zstd](../zstd.md), [zlib-ng](../zlib-ng.md), [openssl](../openssl.md), [lldb](../lldb.md) (covers llvm-project), [elfutils](../elfutils.md).

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity for riscv64 |
|---|---|---|---|
| [#269](https://github.com/google/llvm-propeller/issues/269) | Can propeller optimize RISCV binaries? | Open | Critical - documents all four functional blockers |
| [#345](https://github.com/google/llvm-propeller/issues/345) | Processing profile for Linux Kernel fails with LTO builds ("Fewer than 0.05% recorded jumps are converted into CFG edges, probably because of source drift") | Open | Not riscv64-specific; general correctness issue |
| [#372](https://github.com/google/llvm-propeller/issues/372) | ARM64 propeller produces no data in cc_profile.txt and ld_profile.txt | Open | Not riscv64-specific; AArch64 regression |
| [#362](https://github.com/google/llvm-propeller/issues/362) | No plan yet for stale profile support | Open | Not riscv64-specific; affects all platforms |
| [#3](https://github.com/google/llvm-propeller/issues/3) | No performance improvement observed for built-in tests (filed 2019, never closed) | Open | Not riscv64-specific; longstanding validation gap |
| [#8](https://github.com/google/llvm-propeller/issues/8) | Failed to find mmap entries in perf.data for binaries | Open | Not riscv64-specific; perf data parsing bug |

No correctness bugs specific to riscv64 have been filed because the tool has never been run on riscv64.

---

## 12. Objections and Upstream Blockers

**Blocker 1 (Critical): No hardware branch-sampling mechanism on shipping riscv64 hardware.**
The entire Propeller pipeline depends on hardware branch-stack profiles. On x86, this is Intel LBR. On AArch64, this is Arm SPE or BRBE. The RISC-V equivalent, the Control Transfer Record extension (Smctr/Ssctr), was ratified at v1.0 in January 2025, but no shipping silicon implements it. Until CTR hardware exists, profile collection cannot be performed on real riscv64 hardware. Dynamic instrumentation (e.g., Intel PT or similar) was noted as a possible workaround in issue #269 but explicitly described as having no single blessed approach.

**Blocker 2 (Critical): Clang driver gates on `-fbasic-block-address-map` and `-fbasic-block-sections=list`.**
These flags require changes to `llvm/llvm-project`, not to `google/llvm-propeller`. The change must be upstreamed to LLVM, reviewed by LLVM maintainers, and validated against RISC-V-specific linker and assembler behavior. The maintainer described the driver change as "fairly simple" but noted that RISC-V-specific correctness issues in the optimized build are unknown and may require additional work.

**Blocker 3 (High): No standalone profile processing tools.**
As of the maintainer's Dec 2024 response, no standalone tool for generating Propeller profiles from taken/not-taken branch data existed. The maintainer stated they planned to add such tools "in the next few months" but no follow-up commit or issue update confirming completion was found in the research. [NEEDS VERIFICATION: whether standalone profile processing tools were delivered in 2025Q1 as indicated]

**Blocker 4 (High): RISC-V-specific correctness in basic-block-sections.**
The maintainer explicitly noted that even after the Clang driver change, "there may be RISC-V-specific details that cause the Propeller-optimized build to regress performance or otherwise fail to compile." The RVC (compressed instructions) interaction with basic-block alignment, jump relaxation, and section splitting in lld is unvalidated.

**Organizational blockers.**
The project is Google-internal with no history of accepting external port contributions. There is no CODEOWNERS file. No maintainer has expressed intent to implement riscv64 support. There is no indication that Google has RISC-V hardware deployment use cases that would motivate this work internally.

**Acceptance probability.** Upstreaming Clang driver changes to llvm-project for RISC-V basic-block-address-map has a reasonable probability of acceptance given LLVM's active RISC-V backend community. Upstreaming Propeller-specific changes to `google/llvm-propeller` faces a higher bar given the Google-internal governance model, but the project is Apache-2.0 and has accepted external commits in the past (marginally). The primary constraint is the hardware sampling gap, which cannot be resolved by software alone until CTR silicon is available.

---

## 13. Investment Analysis

RISE has no existing funded work on llvm-propeller. All work items below are net-new.

### 13.1 Functional Enablement

The minimum viable riscv64 path requires three software-side changes before any hardware profiling is possible:

1. **Upstream Clang driver changes for `-fbasic-block-address-map` on RISC-V.** Modify `clang/lib/Driver/ToolChains/Clang.cpp` to enable the flag for RISC-V targets. Requires functional validation with lld and the RISC-V assembler, including RVC interaction. Target: llvm-project upstream.

2. **Upstream Clang driver changes for `-fbasic-block-sections=list` on RISC-V.** Same target. May surface RISC-V-specific linker and section-alignment issues. Requires test suite validation on riscv64.

3. **Architecture-specific additions in llvm-propeller.** Add riscv64 paths to `GetInstructionSize()` (handling RVC 2-byte instructions), `ReadThunkSymbols()` (RISC-V linker-inserted thunks), and test binaries/perfdata. Requires llvm-propeller maintainer buy-in.

These three items enable a functional instrumented build and profile-driven relink on riscv64 - but profile collection from real hardware remains blocked until CTR silicon is available.

4. **Software-based branch profile collection (workaround pending CTR hardware).** Evaluate Intel PT or dynamic binary instrumentation (e.g., DynamoRIO, Frida) as a profile source. Implement a profile adapter in perf_data_converter/quipper or standalone. This is speculative until a preferred approach is identified.

### 13.2 Performance Optimization

Data not available: no riscv64 benchmark baseline exists. Performance optimization work is not applicable until functional enablement is complete. Once functional, the primary optimization lever is profile quality (which depends on hardware CTR availability) and potential RVC-aware basic-block alignment tuning in lld.

### 13.3 CI/CD Infrastructure

Add riscv64 build and instrumented-binary test jobs to `.github/workflows/ci.yaml`. Given no riscv64 profile collection is possible without CTR hardware, CI can only validate the instrumented-binary build phase (BBAM section present in output ELF) and the profile-driven relink phase using synthetic or pre-captured profiles. RISE build farm (Scaleway) runners are available for native riscv64 builds.

### 13.4 Ecosystem Enablement

Not applicable. llvm-propeller has no downstream package ecosystem - it is a build-time optimization tool invoked directly in build pipelines. Enablement is measured by whether major riscv64 Linux distributions integrate it into their compiler toolchain workflows, not by package count.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Upstream Clang driver: `-fbasic-block-address-map` for RISC-V (llvm-project) | 3-5 | LLVM RISC-V backend contributor (e.g., Igalia, SiFive) | Critical |
| Functional | Upstream Clang driver: `-fbasic-block-sections=list` for RISC-V with lld validation (llvm-project) | 4-8 | LLVM RISC-V backend contributor | Critical |
| Functional | llvm-propeller: RVC-aware `GetInstructionSize()`, thunk handling, riscv64 test binaries | 2-4 | Propeller contributor (requires Google maintainer review) | High |
| Functional | Software branch profile collection workaround (CTR not yet available) | 8-16 | Research - no clear approach identified | Low (blocked on approach selection) |
| CI/CD | Add riscv64 build + instrumented-binary phase CI jobs; integrate RISE build farm runners | 2-3 | RISE infrastructure | Medium |
| Functional | Validate and fix RISC-V basic-block-sections interaction with RVC and lld jump relaxation | 4-8 | LLVM lld/RISC-V contributor | High (required for correctness) |

The hardware dependency (CTR silicon) is not addressable through software investment. Any investment in Propeller for riscv64 before CTR hardware is available produces a tool that can reorder basic blocks using synthetic or emulated profiles, which is of limited production value. The recommended near-term investment is the Clang driver changes (items 1-2) and llvm-propeller architecture additions (item 3), totaling approximately 9-17 person-weeks, as these unblock the software-side work and position for rapid deployment once CTR hardware ships.

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [llvm-propeller repository (google/llvm-propeller)](https://github.com/google/llvm-propeller)
- [Issue #269: Can propeller optimize RISCV binaries?](https://github.com/google/llvm-propeller/issues/269)
- [Issue #345: Processing profile for Linux Kernel fails with LTO builds](https://github.com/google/llvm-propeller/issues/345)
- [Issue #372: ARM64 propeller produces no data in cc_profile.txt and ld_profile.txt](https://github.com/google/llvm-propeller/issues/372)
- [Issue #362: No plan yet for stale profile support](https://github.com/google/llvm-propeller/issues/362)
- [Issue #3: No performance improvement observed for built-in tests](https://github.com/google/llvm-propeller/issues/3)
- [Issue #8: Failed to find mmap entries in perf.data for binaries](https://github.com/google/llvm-propeller/issues/8)
- [RISC-V Control Transfer Records ISA extension v1.0 release](https://github.com/riscv/riscv-control-transfer-records/releases/tag/v1.0)
- [Propeller RFC on llvm-dev mailing list (2019)](https://lists.llvm.org/pipermail/llvm-dev/2019-September/135393.html)
- [abseil-cpp issue #1702: linker error with riscv64 cross-toolchain](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp issue #2002: SEGFAULT in tests on Debian riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [googletest issue #3756: GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [OpenSSL issue #20980: AES not constant-time without Zkn extensions](https://github.com/openssl/openssl/issues/20980)
- [RISE project RP009: LLVM RISC-V spec optimization (Igalia)](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [RISE project: Igalia RISC-V LLVM CI infrastructure](https://riseproject.dev/2024/10/15/working-with-igalia-to-improve-risc-v-llvm-continuous-integration/)
- [RISE project member list](https://riseproject.dev/members/)