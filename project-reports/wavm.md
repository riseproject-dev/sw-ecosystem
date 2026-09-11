---
title: WAVM
parent: Project Reports
color: orange
dependencies:
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: LMDB
    relation: runtime-dependency
    criticality: optional
  - name: BLAKE2
    relation: runtime-dependency
    criticality: optional
  - name: libunwind
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="wavm" %}

# WAVM

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for WAVM<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

WAVM (WebAssembly Virtual Machine) is a standalone, ahead-of-time and JIT WebAssembly execution engine built on LLVM. It is written in C++, is BSD-3-Clause licensed, and is hosted at [github.com/WAVM/WAVM](https://github.com/WAVM/WAVM), with a features page at [wavm.github.io](https://wavm.github.io/).

**Governance:** WAVM has no foundation backing and no formal governance structure. There is no MAINTAINERS, OWNERS, CODEOWNERS, or GOVERNANCE file across its full commit history (2,402 commits, 2015-08-20 to 2026-04-04). It is a de facto single-maintainer (BDFL) project under the GitHub org "WAVM." The copyright is held personally by Andrew Scheidecker, not assigned to a company or foundation. WAVM is not part of the Bytecode Alliance, CNCF, or Linux Foundation, and is not a RISE project.

**Corporate sponsorship:** By all-time commit count, the project is 93% authored by Andrew Scheidecker (personal project; his day job is at Epic Games per his GitHub profile, but WAVM itself carries no Epic sponsorship signal). Remaining contributions are drive-by: Wanming Lin (67 commits, intel.com, SIMD spec-test work 2019-2020), Benjamin C Meyer (47 commits, no identifiable employer), Douglas Crosher (19 commits, no identifiable employer), Piotr Sikora (6 commits, google.com), and Syrus Akbary (3 commits, CEO/founder of Wasmer Inc., a competing runtime). This is effectively a single-maintainer hobby project with occasional patches from engineers at Intel, Google, and Wasmer, and no sustained corporate sponsorship.

**Community culture on new ports:** The maintainer has accepted community-driven architecture work before -- the AArch64 port was completed via issues such as #377 "arm windows support," #350 "Building on arm64," and #340 "arm64 alignment" -- showing willingness to merge new-port contributions when someone does the work. Bandwidth is limited, however: a request for prebuilt aarch64 packages (#253) was closed "not planned." No RISC-V proposal, RFC, or roadmap item has ever been raised in the project's history. A CNCF SIG-Runtime co-chair invited WAVM to present in Feb 2021 (issue #303), with no recorded follow-up.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| n/a | No RISC-V port has ever been started, proposed, or discussed | `git log --all --grep="riscv" -i` (0 matches); GitHub issue/PR/commit/code search for "riscv"/"riscv64" scoped to `repo:WAVM/WAVM` (0 matches across all four search types) |

There is no port to describe. No RISC-V-tagged issue, pull request, commit, or tracking issue exists in WAVM/WAVM at any point in the project's 2,402-commit, 11-year history. The only "riscv" string occurrences anywhere in the repository are (a) provenance comments in WebAssembly spec test files ([`Test/WebAssembly/spec/float_misc.wast`](https://github.com/WAVM/WAVM/blob/main/Test/WebAssembly/spec/float_misc.wast), `float_exprs.wast`, and duplicates under `threads/`, `memory64/`, `multi-memory/`) citing `riscv/riscv-tests` as the historical origin of certain floating-point edge-case test vectors, unrelated to WAVM's own architecture support, and (b) generic `#if defined(__riscv)` branches inherited from vendored LLVM `libunwind` source under `ThirdParty/libunwind` (not WAVM-authored code).

Key contributors with corporate affiliation are listed in Section 1; none has touched RISC-V-related work. This project is **not** fully upstream on RISC-V because no RISC-V support exists upstream at all -- there is nothing to be "upstream" of.

## 3. Upstream Support Tier

[`Doc/Building.md`](https://github.com/WAVM/WAVM/blob/main/Doc/Building.md) and a `PortabilityMatrix.md` document (referenced in research findings; not independently re-fetched this session) define an informal 3-tier support scheme: "Supported, tested in CI," "Supported, manually tested," and "Possibly works, but not tested." Only x86-64 and AArch64 (Windows/Linux/macOS) are listed, both at the top CI tier. **RISC-V appears at no tier at all** -- not even "possibly works." The project [README](https://github.com/WAVM/WAVM) states explicitly: "WAVM... functions on x86-64 and AArch64 systems across Windows, macOS, and Linux." WAVM also requires a 64-bit virtual address space, which would technically qualify RV64 (not RV32) if a port existed.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in support matrix | yes, top tier (CI-tested) | yes, top tier (CI-tested) | not listed at any tier |
| CI-tested | yes | yes | no |
| Release-blocking CI | yes | yes | N/A (no CI exists) |
| Official binaries published | yes | yes | no |

## 4. Technical Architecture and RISC-V-Specific Subsystems

WAVM's JIT backend (`LLVMJIT`) is architecture-specific compiled code, not a generic interpreter. Source-level inspection (`mcp__github__search_code` against `WAVM/WAVM` @ `4e82bb9`) shows RISC-V is not a stub or partial fallback -- there is no extension point for it anywhere in the codebase.

**JIT target/codegen.** [`Include/WAVM/LLVMJIT/LLVMJIT.h`](https://github.com/WAVM/WAVM/blob/main/Include/WAVM/LLVMJIT/LLVMJIT.h) defines:
```cpp
enum class TargetArch
{
    x86_64,
    aarch64
};
```
Two enumerators only. Every consumer switches exhaustively on exactly these two, with no `default` case that could silently degrade to a generic path:
- `Lib/LLVMJIT/LLVMJIT.cpp` `asString(TargetArch)` -- `case x86_64 / case aarch64 / default: WAVM_UNREACHABLE()`.
- `Programs/wavm/wavm-compile.cpp` `parseArch()` -- the `--triple`/`--arch` CLI flag recognizes only the strings `"x86_64"` and `"aarch64"`.
- `Lib/LLVMJIT/Disassembler.cpp` -- instruction-length/alignment logic branches on `aarch64` (fixed 4-byte) vs. else (x86 variable-length), no third branch.
- `Lib/LLVMJIT/EmitMem.cpp` -- bounds-check codegen branches on `targetArch == llvm::Triple::aarch64` vs. else (x86 path).
- `Lib/ObjectLinker/ObjectLinkerPrivate.h` -- `enum class Arch { x86_64, aarch64 };`, same closed set.

**CPU feature detection.** [`Include/WAVM/Platform/CPU.h`](https://github.com/WAVM/WAVM/blob/main/Include/WAVM/Platform/CPU.h) defines `WAVM_CPU_ARCH_X86`/`WAVM_CPU_ARCH_ARM` via `#if defined(__x86_64__) ... #elif defined(__aarch64__)`, with **no `#elif defined(__riscv)` branch**. On riscv64 these macros would be left undefined, and downstream code (`Lib/Platform/POSIX/CPUPOSIX.cpp`, `Lib/LLVMJIT/LLVMJIT.cpp`'s `#if WAVM_CPU_ARCH_X86 ... #elif WAVM_CPU_ARCH_ARM`) would hit undefined-macro conditionals -- the code would not compile on riscv64 without upstream header changes first, not merely run unoptimized.

**Exception unwinding.** `Lib/Platform/POSIX/UnwindPOSIX.cpp` and `Lib/Platform/POSIX/EHFrameDecode.cpp` gate register-mapping and compact-unwind-encoding logic on `#if defined(__x86_64__) ... #elif defined(__aarch64__)`, with no riscv64 arm.

**Debug trap / low-level intrinsics.** x86_64 uses inline `int3`; aarch64 uses inline `.inst 0xe7f001f0`. No riscv64 equivalent exists.

**SIMD-related code within WAVM's own tree:** none is architecture-conditional beyond the x86/ARM split above; WAVM does not itself implement RVV-specific WebAssembly SIMD lowering (WebAssembly `v128` codegen for riscv64 would require new LLVM lowering work in `EmitNumeric.cpp`/`EmitConvert.cpp`, which currently branch only on `llvm::Triple::x86_64`).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT `TargetArch` enum / codegen backend | full (hand-tuned, native LLVM target) | full (hand-tuned, native LLVM target) | missing -- 0 files, 0 enumerator, 0 switch arms |
| CPU feature detection macros | full (`__builtin_cpu_supports`/`__cpuid`) | full | missing -- undefined macro, would fail to compile |
| Exception unwinding / EH-frame decode | full (hand-tuned register table) | full (hand-tuned register table) | missing |
| Debug trap / low-level intrinsics | full (inline asm) | full (inline asm) | missing |

**Conclusion:** riscv64 is entirely unimplemented at every layer of WAVM's own code (build system, CPU/arch abstraction macros, JIT `TargetArch` enum, CLI target parsing, exception handling) -- not a partial C-intrinsics fallback, and not a scalar/generic fallback path. There is no `#ifdef __riscv` guard or placeholder anywhere in `Lib/` or `Include/`.

## 5. Build System, Cross-Compilation, and Toolchain

Per [`Doc/Building.md`](https://github.com/WAVM/WAVM/blob/main/Doc/Building.md), the documented toolchain requirements are: CMake >= 3.16; LLVM >= 20.0 (LLVM 21.x with WAVM-specific patches, distributed as "WAVM-LLVM," is recommended); Visual Studio 2022+ on Windows. GCC/Clang are described as "known to compile WAVM correctly" with no exact minimum versions given for either. The root `CMakeLists.txt` requires `find_package(LLVM REQUIRED CONFIG)`, and `LLVMJIT` links `support, core, passes, orcjit, DebugInfoDWARF, AllTargetsAsmParsers` plus WAVM's own JIT depends on LLVM's `JITLink` for in-process code generation/execution.

There is no `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake` file; the `cmake/` directory contains only `DetectSyncPrimitiveSizes.cmake` and `DetectUnwindStateSizes.cmake`. The root `Dockerfile` builds a single x86_64-only image (`FROM ubuntu:18.04`, installing `llvm-6.0` and building with `cmake -G Ninja ... && ninja`). No QEMU reference exists anywhere in build docs, `CMakeLists.txt`, `Dockerfile`, or the CI workflow. No documented cross-compilation path to riscv64 exists at all -- there is no `-DWAVM_ENABLE_RUNTIME=OFF`-style workaround that would produce a working riscv64 JIT runtime (that flag disables the JIT entirely, leaving only parse/validate functionality, and is the closest thing to an "unsupported architecture" build mode).

Given the closed `TargetArch` enum and undefined CPU-arch macros described in Section 4, a from-scratch riscv64 build would fail at multiple points before reaching link time, not merely produce an unoptimized binary.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Parse/validate WASM modules | yes | yes | Data not available: WAVM has a `-DWAVM_ENABLE_RUNTIME=OFF` mode that is architecture-generic in principle, but no build or test evidence exists confirming it compiles or runs on riscv64 -- the CPU-arch macro gap in Section 4 would need resolving first |
| JIT compile and execute WASM | yes | yes | no -- `TargetArch` enum has no riscv64 member; cannot select riscv64 as a JIT target |
| AOT compile (`wavm-compile`) to riscv64 object code | yes (to x86_64) | yes (to aarch64) | no -- `parseArch()` CLI parser does not recognize `"riscv64"` |
| Exception handling / stack unwinding | yes | yes | no -- no register-mapping table in `UnwindPOSIX.cpp`/`EHFrameDecode.cpp` |
| Official CI test coverage | yes | yes | no |
| Official release binaries | yes | yes | no |

**Functional gap:** WAVM cannot be used as a WASM runtime on riscv64 at all -- this is a complete functional gap, not a performance gap. There is no partially-working riscv64 build to benchmark or harden.

**Performance gap:** not applicable -- no functional riscv64 build exists to measure.

**Security hardening gap:** not applicable -- no functional riscv64 build exists to assess.

**NaN / floating-point semantics:** The only RISC-V-adjacent content in the repository concerns WebAssembly spec-test provenance, not WAVM's own float semantics: the `.wast` comments in `Test/WebAssembly/spec/float_misc.wast` and `float_exprs.wast` cite `github.com/riscv/riscv-tests` as the historical source of certain `f32.sqrt`/`f64.sqrt` edge-case and subnormal-recoding test vectors used in the *upstream WebAssembly* spec test suite (inherited by WAVM as part of that suite, not authored by WAVM). This is unrelated to any RISC-V NaN-bit-pattern determinism question WAVM itself would face, since WAVM has no RISC-V codegen to exhibit such an issue in the first place. A related but separate spec-level discussion exists at [WebAssembly/design#646 "RISC-V and NaNs"](https://github.com/WebAssembly/design/issues/646), which concerns WebAssembly's NaN semantics relative to RISC-V FP hardware in general, not WAVM specifically.

## 7. CI/CD Infrastructure

WAVM/WAVM's only CI file is [`.github/workflows/build.yml`](https://github.com/WAVM/WAVM/blob/main/.github/workflows/build.yml) (701 lines), verified by direct read of a local clone at HEAD `4e82bb9fecf9c1bdb4d00f96fa89063ee4382d09`. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, or `azure-pipelines.yml` exists at the repository root.

- **Triggers:** `push` (branches: master, tags: v*), `pull_request` (branches: master), `schedule` (nightly cron `0 6 * * *`), `workflow_dispatch`.
- **Runners:** `ubuntu-latest` (linux x64), `ubuntu-24.04-arm` (linux aarch64, container `ghcr.io/wavm/builder-linux-aarch64`), `windows-latest` (windows x64), `windows-11-arm` (windows arm64), `macos-latest` (macos arm64 native + x64 via Rosetta cross-compile).
- **riscv string search:** `grep -rin "riscv" .github/` returns zero matches, confirmed independently in this session.
- **QEMU/emulation:** no `qemu` string anywhere in the file; every `--target-arch` invocation is `--target-arch x64` (unrelated to a riscv64 target).
- **Job list:** `check-nightly`, `lint`, plus the linux-aarch64/windows/macos/linux-x64 build-test-package matrix, `coverage-merge`, `publish` -- five architecture families total, no sixth riscv64 entry in any matrix or `needs:` chain.
- **RISE runners:** no reference to `riseproject-dev` or any RISE runner label anywhere in the workflow file.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes | yes | no |
| CI runs tests | yes | yes | no (no job exists) |
| CI publishes release artifact | yes | yes | no |
| Release-blocking | yes | yes | N/A |
| Runner type | GitHub-hosted (`ubuntu-latest`) | GitHub-hosted (`ubuntu-24.04-arm`) | none |

**No riscv64 CI -- build, test, or otherwise -- exists for WAVM/WAVM as of commit `4e82bb9` (2026-04-04).**

## 8. Distribution and Release Status

No official riscv64 binary of WAVM exists through any channel checked:

- **GitHub Releases:** [releases page](https://github.com/WAVM/WAVM/releases), 10 releases listed, most recent `nightly/2026-04-05`. Its [expanded asset list](https://github.com/WAVM/WAVM/releases/expanded_assets/nightly%2F2026-04-05) has 11 assets: `wavm-nightly-2026-04-05-linux-x64.{deb,rpm,tar.gz}`, `wavm-nightly-2026-04-05-macos-{arm64,x64}.tar.gz`, `wavm-nightly-2026-04-05-windows-{arm64,x64}.{exe,zip}`, plus source archives. No riscv64/riscv asset. An older release (`nightly/2022-05-14`) was spot-checked and also has no riscv asset.
- **PyPI:** `https://pypi.org/pypi/wavm/json` returns **HTTP 404** -- no package named `wavm` exists on PyPI at all, under any architecture.
- **RISE GitLab wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wavm/` redirects to the (404) PyPI page -- no `wavm` entry in the RISE builder's index. WAVM is also not among the 86 packages listed at [`riseproject.gitlab.io/python/wheel_builder`](https://riseproject.gitlab.io/python/wheel_builder/).
- **Ubuntu 26.04 (resolute):** [`packages.ubuntu.com` search](https://packages.ubuntu.com/search?keywords=WAVM&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" -- no `wavm`, `python3-wavm`, or `libwavm` package exists in resolute for any architecture.
- **Arch Linux RISC-V (archriscv):** [`archriscv.felixc.at/?q=wavm`](https://archriscv.felixc.at/?q=wavm) shows no entry for "wavm."
- **Project-graph database:** unresolved -- the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) for the full research session, so the Ubuntu 26.04 package-graph cross-check could not be run. This is a connection failure, not a corroborating or contradicting data point; the direct `packages.ubuntu.com` search above independently confirms the same negative result via a different channel.

**What a user must do to get a working riscv64 binary today:** There is none available through any packaging or release channel. A user would have to port WAVM's `TargetArch` enum, CPU-arch detection macros, JIT codegen paths, and unwinder register tables to riscv64 from scratch, then build from source -- effectively new upstream development work, not a build/packaging exercise.

## 9. Dependencies

WAVM has exactly one external, system-level dependency: LLVM (`find_package(LLVM REQUIRED CONFIG)`, version >= 20, in the root `CMakeLists.txt`). Three additional libraries live under `ThirdParty/` as vendored/bundled source (no `find_package`/`FetchContent` fetch mechanism), not build-time external dependencies, but are reported since they map onto JIT/crypto/unwind categories relevant to riscv64 readiness.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| LLVM (llvm/llvm-project) | JIT backend, `find_package(LLVM REQUIRED CONFIG)` >= 20.0; `LLVMJIT` depends on JITLink (`llvm/lib/ExecutionEngine/JITLink/riscv.cpp`) | Yes, complete -- riscv64 codegen (RV32/RV64, RVV 1.0), JITLink relocation support, and LLD are full/first-tier per the project's own LLVM report | Partial -- riscv64 is not in LLVM's required pre-merge CI gate; only `libc/**`-scoped QEMU CI runs on riscv64. No riscv64-specific WAVM+LLVM JIT test evidence found | No official upstream riscv64 release binaries from LLVM.org; distros ship their own riscv64 `llvm-*` builds | 801 open riscv64-tagged issues in llvm-project generally (relevant risk surface for JIT-compiled output), none WAVM-specific. See `project-reports/llvm.md` (readiness: yellow) for full detail |
| liblmdb / LMDB (vendored, `ThirdParty/liblmdb`, upstream LMDB/lmdb) | Memory-mapped storage backing WAVM's `ObjectCache` (compiled-module cache) | Architecture-portable C, relies only on POSIX `mmap`; no arch-specific code paths seen; no known riscv64 build blockers | No riscv64-specific test reports found | Packaged broadly (Debian/Ubuntu `liblmdb-dev` has shipped on riscv64 in Debian unstable for some time [NEEDS VERIFICATION for Ubuntu 26.04 specifically -- not queried due to project-graph outage]) | 0 riscv64 issues found via search on `LMDB/lmdb`; not in `projects.yml` |
| BLAKE2 (vendored, `ThirdParty/BLAKE2`, upstream BLAKE2/BLAKE2) | Crypto/hashing -- `blake2b()` hashes WASM module bytes as the `ObjectCache` lookup key | WAVM's own `CMakeLists.txt` dispatches by `CMAKE_SYSTEM_PROCESSOR`: `x86_64` gets SSE sources, `aarch64` gets NEON sources, everything else (including riscv64) falls through to the portable `ref/` scalar C implementation -- builds fine, no vector acceleration | No riscv64-specific test evidence | N/A (vendored, not independently released by WAVM) | 1 issue found (#46, closed, SPARC porting, unrelated/stale); no riscv64-specific bugs reported |
| libunwind (vendored, `ThirdParty/libunwind`, forked from llvm/llvm-project release/21.x per `PROVENANCE.txt`, commit `2078da4`) | Stack unwinding -- built as `WAVMUnwind`, linked `--whole-archive` on Linux targets to supply `_Unwind_*` symbols | The vendored fork's `src/config.h` explicitly includes `__riscv` in its supported-architecture `#if`, and contains riscv-aware files (`UnwindCursor.hpp`, `Registers.hpp`, `assembly.h`, `UnwindRegistersSave/Restore.S`) -- should build on riscv64 | No riscv64-specific test evidence for this exact fork/branch | Tracks whatever LLVM 21.x ships; not independently released | None riscv64-specific found for this fork. Caveat: `project-reports/libunwind.md` documents a *different, unrelated* codebase (the nongnu.org/HP-lineage `libunwind/libunwind`, not the llvm-project fork WAVM vendors) -- only loosely applicable |

The libunwind dependency is the only one of the four with confirmed riscv64-aware source, and even there no riscv64-specific test evidence exists for WAVM's exact vendored fork. Critically, none of this matters for overall readiness: even if all four dependencies were fully riscv64-clean, **WAVM's own code (Section 4) has no riscv64 target at all**, so the dependency chain is not the blocker -- WAVM's own JIT/CPU-arch abstraction layer is.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| -- | -- | N/A | -- | No riscv64-related issue, PR, or bug has ever been filed against WAVM/WAVM. Exhaustive searches (`search_issues`, `search_pull_requests`, `search_commits`, `search_code`, all scoped to `repo:WAVM/WAVM`, for "riscv" and "riscv64") returned zero results across every query. |

Two semantically-similar but unrelated AArch64 issues surfaced during fuzzy/semantic search and are noted only to show they were checked and excluded: [#350 "Building on arm64"](https://github.com/WAVM/WAVM/issues/350) (closed) and [#340 "arm64 alignment"](https://github.com/WAVM/WAVM/issues/340) (closed). Neither mentions RISC-V.

**No correctness bugs exist to highlight** because no riscv64 code path exists for a bug to manifest in.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer has stated opposition to a RISC-V port.

**Technical blockers:**
1. `LLVMJIT::TargetArch` is a closed two-member enum (`x86_64`, `aarch64`) with no extension point -- adding riscv64 requires enum changes plus every exhaustive `switch`/`if-else` consumer across `Lib/LLVMJIT/` and `Lib/ObjectLinker/`.
2. `WAVM_CPU_ARCH_X86`/`WAVM_CPU_ARCH_ARM` preprocessor macros in `Include/WAVM/Platform/CPU.h` have no riscv branch, meaning current code would fail to compile on riscv64 (undefined-macro conditionals), not merely run unoptimized.
3. No riscv64 register-mapping tables exist in `Lib/Platform/POSIX/UnwindPOSIX.cpp` or `EHFrameDecode.cpp` for exception handling.
4. No riscv64 debug-trap intrinsic exists (`Defines.h`).
5. The upstream dependency (LLVM) has full riscv64 codegen support (Section 9), so this is not the limiting factor -- WAVM's own architecture abstraction layer is.

**Organizational blockers:** WAVM is a single-maintainer (BDFL) project with no dedicated funding, no foundation membership, and no RISE involvement (confirmed: not in RISE blog posts, not in the RISE wheel builder, no `riseproject-dev` GitHub references beyond this report's own project queue entry). The maintainer has previously closed a "not planned" request for additional prebuilt packages (#253), suggesting limited bandwidth for new architecture/packaging work even for already-supported architectures.

**Acceptance probability:** The maintainer's track record shows willingness to accept community-contributed new-architecture ports (the AArch64 port was completed this way), so a well-executed, complete riscv64 PR (enum extension, CPU macros, unwind tables, CI job) would plausibly be reviewable and mergeable. However, no one has proposed or attempted this work to date, and the project's low commit velocity and single-maintainer nature mean review turnaround and long-term maintenance of a new port are uncertain. [NEEDS VERIFICATION: no direct maintainer statement on RISC-V exists to confirm acceptance likelihood; this is an inference from AArch64 precedent only.]

## 13. Readiness Assessment

- **Color:** orange (unknown color_case sub-type does not cleanly apply)
- **Release provider:** none
- **Optimization gap:** N/A -- WAVM is a general-purpose WebAssembly language runtime, not an optimization-purpose project under the Step 2 test (a JIT runtime with no RISC-V backend at all does not "deliver reduced value from a missing SIMD/scalar fallback" -- it delivers zero value on riscv64 because it does not build or run there at all; this places it alongside "general-purpose language runtimes," which the skill's Step 2 explicitly excludes from the optimization-purpose modifier).
- **Justification:** No upstream riscv64 CI exists -- confirmed by direct read of the repository's only CI file, [`.github/workflows/build.yml`](https://github.com/WAVM/WAVM/blob/main/.github/workflows/build.yml) (five architecture families covered: linux x64/aarch64, windows x64/arm64, macos arm64/x64; zero riscv64 references). The distribution floor does not apply and cannot upgrade the color, because no Linux distribution ships a `wavm` package at all, patched or unpatched, for any architecture -- confirmed via [Ubuntu 26.04 package search](https://packages.ubuntu.com/search?keywords=WAVM&suite=resolute&searchon=names&section=all) ("Sorry, your search gave no results") and [Arch RISC-V unofficial repo](https://archriscv.felixc.at/?q=wavm) (no entry). This is a known state (confirmed absence of CI, releases, distro packages, and any riscv64-aware source code in WAVM's own tree -- Section 4), not an unknown-unknown, so grey does not apply; and there is no confirmed *broken* riscv64 build to point to (nothing has ever been attempted), so red does not apply either. Orange is the correct primary grade per Step 1's "no upstream CI" row.
- **Pending work:** None. No open PR, no open issue, no RISE involvement, and no maintainer roadmap item touches RISC-V. There is nothing in flight that could change this grade; a change would require someone to originate the work from scratch.

## 14. Investment Analysis

RISE has done no work on WAVM and has funded nothing related to it -- confirmed absence across the RISE blog, the RISE wheel builder listing, and GitHub searches scoped to `org:riseproject-dev` (the only hit is this report's own queue entry in `riseproject-dev/sw-ecosystem`). All sizing below is therefore for work not yet covered by anyone.

### 14.1 Functional Enablement

Requires, at minimum: (1) extend `LLVMJIT::TargetArch` and `ObjectLinkerPrivate::Arch` enums to add `riscv64`, and update every exhaustive consumer in `Lib/LLVMJIT/` (`LLVMJIT.cpp`, `Disassembler.cpp`, `EmitMem.cpp`, `EmitNumeric.cpp`, `EmitConvert.cpp`) and `Programs/wavm/wavm-compile.cpp`'s `parseArch()`/`archToString()`; (2) add a `#elif defined(__riscv)` branch to `Include/WAVM/Platform/CPU.h` and implement corresponding feature-detection in `Lib/Platform/POSIX/CPUPOSIX.cpp`; (3) add riscv64 register-mapping tables to `Lib/Platform/POSIX/UnwindPOSIX.cpp` and `EHFrameDecode.cpp`; (4) add a riscv64 debug-trap intrinsic; (5) validate against WAVM's existing WebAssembly spec test suite on real or emulated riscv64 hardware. LLVM's own riscv64 JIT/JITLink support is already mature (Section 9), which reduces but does not eliminate this scope -- the WAVM-side abstraction layer is entirely greenfield work.

### 14.2 Performance Optimization

Not applicable until functional enablement (14.1) exists. Once a functional JIT backend exists, BLAKE2's `ThirdParty/BLAKE2` vendored copy would fall back to scalar C on riscv64 (Section 9) unless a riscv64 vector path is added -- low priority relative to JIT enablement, since BLAKE2 is used only for `ObjectCache` key hashing, not a runtime hot path for executing WASM.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to `.github/workflows/build.yml`, modeled on the existing `ubuntu-24.04-arm` job -- would need either native riscv64 GitHub-hosted runners (not currently offered by GitHub Actions as of this research) or a self-hosted/RISE-provided riscv64 runner, plus a container image analogous to `ghcr.io/wavm/builder-linux-aarch64`. This is meaningful and cannot proceed until 14.1 produces a buildable target.

### 14.4 Ecosystem Enablement

Not applicable -- WAVM has no dependent package ecosystem (it is a standalone runtime/CLI tool, not a library with npm/PyPI/Maven consumers to re-enable). Section 10 is omitted per report instructions.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `riscv64` to `TargetArch`/`Arch` enums and all exhaustive switch consumers in `Lib/LLVMJIT/`, `Lib/ObjectLinker/`, `Programs/wavm/wavm-compile.cpp` | Data not available: no prior port-effort estimate found; scope is comparable in kind to the historical AArch64 port (Section 1) but no effort/duration data for that port was found either -- [NEEDS VERIFICATION] | Unclaimed -- no owner exists | Critical (blocking for any other work) |
| Functional | Add `#elif defined(__riscv)` to `CPU.h` and implement `CPUPOSIX.cpp` riscv64 feature detection | Data not available: no estimate found | Unclaimed | Critical |
| Functional | Add riscv64 register-mapping tables to `UnwindPOSIX.cpp`/`EHFrameDecode.cpp` | Data not available: no estimate found | Unclaimed | High |
| CI/CD | Add riscv64 job to `.github/workflows/build.yml` (runner/container TBD) | Data not available: no estimate found | Unclaimed | High (after functional enablement) |
| Distribution | Publish riscv64 GitHub release assets once CI job exists | Data not available: no estimate found | Unclaimed | Medium |
| Performance | Add riscv64 vector path to vendored BLAKE2 (currently scalar fallback) | Data not available: no estimate found | Unclaimed | Low |

## 15. Updates

(No updates yet -- initial report dated 2026-09-10.)

## 16. References

- [WAVM/WAVM GitHub repository](https://github.com/WAVM/WAVM)
- [WAVM homepage](https://wavm.github.io/)
- [WAVM releases page](https://github.com/WAVM/WAVM/releases)
- [WAVM latest release assets (nightly/2026-04-05)](https://github.com/WAVM/WAVM/releases/expanded_assets/nightly%2F2026-04-05)
- [`.github/workflows/build.yml`](https://github.com/WAVM/WAVM/blob/main/.github/workflows/build.yml)
- [`Doc/Building.md`](https://github.com/WAVM/WAVM/blob/main/Doc/Building.md)
- [`Include/WAVM/LLVMJIT/LLVMJIT.h`](https://github.com/WAVM/WAVM/blob/main/Include/WAVM/LLVMJIT/LLVMJIT.h)
- [`Lib/ObjectLinker/ObjectLinkerPrivate.h`](https://github.com/WAVM/WAVM/blob/main/Lib/ObjectLinker/ObjectLinkerPrivate.h)
- [`Include/WAVM/Platform/CPU.h`](https://github.com/WAVM/WAVM/blob/main/Include/WAVM/Platform/CPU.h)
- [Test/WebAssembly/spec/float_misc.wast](https://github.com/WAVM/WAVM/blob/main/Test/WebAssembly/spec/float_misc.wast)
- [Issue #350 "Building on arm64" (closed)](https://github.com/WAVM/WAVM/issues/350)
- [Issue #340 "arm64 alignment" (closed)](https://github.com/WAVM/WAVM/issues/340)
- [Issue #253 (prebuilt aarch64 packages, closed not planned) -- referenced in research, not independently re-fetched]
- [Issue #303 (CNCF SIG-Runtime invitation, no follow-up) -- referenced in research, not independently re-fetched]
- [PyPI JSON API for `wavm` (404 -- package does not exist)](https://pypi.org/pypi/wavm/json)
- [RISE GitLab PyPI wheel index for `wavm` (redirects to 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wavm/)
- [RISE Python wheel builder package list (WAVM absent)](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu 26.04 resolute package search for WAVM (no results)](https://packages.ubuntu.com/search?keywords=WAVM&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V (archriscv) package search for wavm (no entry)](https://archriscv.felixc.at/?q=wavm)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project members list](https://riseproject.dev/members/)
- [WebAssembly/design#646 "RISC-V and NaNs"](https://github.com/WebAssembly/design/issues/646)
- [Frank Denis, "Performance of WebAssembly runtimes in 2026" (June 23, 2026)](https://00f.net/2026/06/23/webassembly-runtimes-2026/)
- [Phoronix: "Wasmer 3.2 RISC-V support"](https://www.phoronix.com/news/Wasmer-3.2) -- contrast reference, not a WAVM source
- `project-reports/llvm.md` (internal report, referenced for LLVM's own riscv64 CI/readiness status)
- `project-reports/libunwind.md` (internal report, referenced with caveat -- covers the unrelated nongnu.org libunwind fork, not the llvm-project fork WAVM vendors)
- Local clone used for direct verification: `/home/user/wavm/wavm` (shallow clone, HEAD `4e82bb9fecf9c1bdb4d00f96fa89063ee4382d09`)
