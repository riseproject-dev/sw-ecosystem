---
title: elfconv
parent: Project Reports
color: orange
dependencies:
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Remill
    relation: build-dependency
    criticality: critical
  - name: Intel XED
    relation: build-dependency
    criticality: critical
  - name: glog
    relation: build-dependency
    criticality: optional
  - name: gflags
    relation: build-dependency
    criticality: optional
  - name: emscripten
    relation: build-dependency
    criticality: critical
  - name: wasi-sdk
    relation: build-dependency
    criticality: critical
---

# elfconv

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for elfconv<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="elfconv" %}

## 1. Project Overview

elfconv ([yomaytk/elfconv](https://github.com/yomaytk/elfconv)) is an ahead-of-time (AOT) binary translator that lifts Linux/ELF binaries to WebAssembly. It currently supports only **AArch64** as a source ELF architecture, with **x86-64 support "under development"** per the README. It is built on a fork of [Remill](https://github.com/lifting-bits/remill) (Trail of Bits) to lift machine code to LLVM IR, which is then compiled to WebAssembly via Emscripten or WASI-SDK and run in a browser or a WASI runtime (WasmEdge / Wasmtime).

**Governance:** Single-maintainer personal project. Of 865 total commits, 829 (520 + 309, same person under two git identities) belong to yomaytk (Masashi Yoshimura); the next largest contributor is nanana37 (19 commits, Keio University SSLab email). No MAINTAINERS, OWNERS, CODEOWNERS, GOVERNANCE, PLATFORMS.md, or SUPPORT.md file exists at the elfconv repo root; the only CODEOWNERS file in the tree belongs to the vendored `backend/remill` submodule. License: Apache 2.0.

**Corporate sponsorship:** No formal sponsorship. One commit (of 865) carries an `@hco.ntt.co.jp` (NTT Corporation) email address (Akihiro Suda), and elfconv has been covered on NTT's "nttlabs" Medium channel by the maintainer himself ([elfconv: an experimental AOT compiler...](https://medium.com/nttlabs/elfconv-an-experimental-aot-compiler-that-translates-linux-aarch64-elf-binary-to-webassembly-0d47b1b2d50b)). This suggests informal NTT research-lab interest but no declared official sponsorship (no SPONSORS file, no funding badge, no OpenCollective/GitHub Sponsors link).

**Foundation / RISE membership:** None. elfconv does not appear on riseproject.dev's premier or general member lists, has no RISE blog coverage, and is not present in the `riseproject-dev` GitHub organization (49 repos enumerated across both pages, none named elfconv).

**Community stance on new ports:** The README's "Contributing" section explicitly solicits help with "Instruction Support - Implement missing AArch64 instructions or advance x86-64 instruction support" and syscall/testing work. There is no open issue, discussion, or roadmap item requesting or tracking a RISC-V port of any kind.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V port work has ever occurred in elfconv | `git log --all --grep="riscv"` over 865 commits returns 0 matches |
| N/A | No RISC-V tracking issue, PR, or discussion exists | `search_issues`/`search_pull_requests` for "riscv", "riscv64", "rv64", "RISC-V" against `yomaytk/elfconv` all return 0 genuine matches (see below) |
| Historical (pre-elfconv) | Predecessor project **MyAOT** ([AkihiroSuda/myaot](https://github.com/AkihiroSuda/myaot)) translated Linux/**riscv32** ELF to x86-64/Mach-O/Wasm | elfconv [README.md](https://github.com/yomaytk/elfconv/blob/main/README.md) Acknowledgement section |

elfconv's single RISC-V-adjacent reference anywhere in its history is genealogical: the README credits MyAOT as elfconv's predecessor, describing MyAOT (not elfconv) as translating Linux/riscv32 ELF binaries. That riscv32 input capability was **not carried forward** into elfconv when it was rebuilt targeting AArch64. There is no "first RISC-V commit" to elfconv because no such commit exists. elfconv is not upstream for RISC-V in any sense: it has no RISC-V support to upstream.

The one issue-search hit that semantically matched "riscv64" is a false positive: [Issue #122 "AArch64 instrtuctions with no test is implemented"](https://github.com/yomaytk/elfconv/issues/122) (open, filed 2025-05-07), which lists untested AArch64 SIMD/FP instructions (USHR, ADC, FDIV, FCSEL, UCVTF, SCVTF, FRINTA, FCVTAS) and contains no RISC-V content in title, body, or comments.

## 3. Upstream Support Tier

No formal tier policy exists (no PLATFORMS.md/SUPPORT.md, no documented criteria for supported architectures). Support tiers are implicit, defined entirely by the CI matrix and release asset list.

| | amd64 | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI builds | Yes (`ubuntu-22.04`, native) | Yes (`ubuntu-22.04-arm`, native) | No |
| CI tests | Yes (`build-and-test` job) | Yes (`build-and-test` and `browser-test` jobs) | No |
| Release binaries | Yes, all 3 releases (v0.1.0, v0.2.0, v1.0.0) | Yes, all 3 releases | No |
| Role | Secondary lift target (x86-64 "under development") | Primary lift target (only fully supported ELF input arch) | Not applicable - not an ELF input target, not a build host target |

Note: elfconv's CI matrices use only **native, non-QEMU GitHub-hosted runners** (`ubuntu-22.04` for amd64, `ubuntu-22.04-arm` for arm64) - there is no cross-compilation or emulation infrastructure of any kind in this project, for any architecture.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Direct filesystem inspection of the local clone (`/home/user/yomaytk/elfconv`, HEAD `8bfe8086`) of `backend/remill/lib/Arch/` shows the complete architecture inventory:

```
AArch32/   AArch64/   PPC/   SPARC32/   SPARC64/   X86/   Sleigh/ (generic backend)
```

No `RISCV/`, `riscv/`, `RV64/`, or `RV32/` directory exists anywhere in the repository. A full-repo search (`find ... -iname "*riscv*"`, excluding `.git`) returns zero files.

| Component | amd64 (X86 backend) | arm64 (AArch64 backend) | riscv64 |
|---|---|---|---|
| Lifter/instruction semantics | Full - 40 files, 15,833 LOC (inherited/legacy target, used for host build and differential testing) | Full - 24 files, 139,943 LOC (primary elfconv target, hand-tuned) | Missing - 0 files, 0 LOC, no directory |
| Header/include coverage | 4 files under `include/remill/Arch/X86` | 5 files under `include/remill/Arch/AArch64` | None |
| Generic Sleigh (Ghidra-spec-driven) backend | Wired: `X86Arch.cpp` | Wired: `AArch64Arch.cpp`/`AArch32Arch.cpp`/`Thumb2Arch.cpp` | Not wired; and no `.sla`/`.slaspec`/`.pspec`/`.cspec`/`.ldefs` spec files of any kind are vendored in the repo, so even the generic Sleigh path carries no RISC-V capability |
| Build flag | `ECV_X86` / `CMAKE_ELFCONV_X86_BUILD` | `ECV_AARCH64` / `CMAKE_ELFCONV_AARCH64_BUILD` | None - no `ECV_RISCV`/`ELFCONV_RISCV` flag exists anywhere in the build system |

A `grep -rliE "riscv|RV64|RV32"` scan across the whole tree surfaces two files (`RemillOperators.h`, `Operators.h`), both false positives - the matches are macro names such as `UClearV64`, `SClearV64`, `UClearV32` (vector-register-clear macros), not RISC-V references. Zero genuine `#ifdef __riscv` guards exist anywhere in the codebase.

**Bottom line:** riscv64 support in elfconv is not a partial or stub implementation - there is no implementation to grade. This applies both to riscv64 as an ELF *input* (lifting) target and to riscv64 as a *host* build/execution platform: neither has ever been attempted, coded, or discussed.

## 5. Build System, Cross-Compilation, and Toolchain

Toolchain (from root `Dockerfile`): Ubuntu 22.04 (jammy) base; LLVM/Clang **16** (`clang-16`, `lld-16`, `llvm-16-dev`, `libclang-16-dev`) from apt.llvm.org; CMake **3.22.1** (pinned exact release, sha256-verified); Ninja; **Emscripten 4.0.9**; **WASI-SDK 24.0**; WasmEdge (latest, via upstream install script); Wasmtime (latest, via upstream install script). Root `CMakeLists.txt` requires `cmake_minimum_required(VERSION 3.21)` and `CMAKE_CXX_STANDARD 20`.

Build commands (only two architecture switches exist, both non-RISC-V):
```bash
# Docker build (AArch64 target)
docker build . --build-arg ECV_AARCH64=1
# Docker build (x86-64 target)
docker build . --build-arg ECV_X86=1
```
Internally, `scripts/build.sh` reads only `ELFCONV_AARCH64` / `ELFCONV_X86` env vars (mutually exclusive) and runs a CMake superbuild:
```bash
cmake -DCMAKE_INSTALL_PREFIX=... -DCMAKE_PREFIX_PATH="<deps>;/usr/lib/llvm-16" \
      -DREMILL_BUILD_SPARC32_RUNTIME=OFF -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++ \
      -DCMAKE_ELFLIFT_STATIC_LINK=<release-bool> \
      -DCMAKE_ELFCONV_AARCH64_BUILD=<0|1> -DCMAKE_ELFCONV_X86_BUILD=<0|1> -GNinja <root>
cmake --build . -- -j$(nproc)
```
`scripts/README.md` documents wasm targets only as `TARGET=aarch64-wasm|aarch64-wasi32|aarch64-native` - no riscv64 target value exists in any form.

**No riscv64 cross-compilation infrastructure exists**: no `cmake/` directory (hence no `cmake/riscv64.cmake` or toolchain file), no riscv64 Dockerfile (`search_code` for `riscv64 repo:yomaytk/elfconv filename:Dockerfile` returns 0 results; only one Dockerfile exists in the whole repo, AArch64/x86-64 only), and **no QEMU usage anywhere** in the repository (`grep -rn "qemu" -i` across all `.sh`, `.md`, `Dockerfile`, `.txt` files returns nothing).

Data not available: riscv64 host-build attempt logs or known-failure reports, because no such attempt is documented anywhere upstream.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| ELF input lifting | Under development (partial, per README) | Full (primary target) | Not applicable - not a lift target |
| Wasm output (Emscripten) | N/A (lift target only, not verified as output arch) | Yes, benchmarked (see Section 11) | N/A |
| Wasm output (WASI) | N/A | Yes, benchmarked | N/A |
| CI build | Yes | Yes | No |
| CI test | Yes | Yes | No |
| Release binary | Yes | Yes | No |
| Host build documented | Yes (Dockerfile `ECV_X86=1`) | Yes (Dockerfile `ECV_AARCH64=1`) | No - no build flag, no documentation, no toolchain file |

**Functional gap:** elfconv cannot be built for a riscv64 host today by any documented, supported path - there is no build flag, no Dockerfile variant, no CI job, and no cross-compilation toolchain file. Separately, and independently of host architecture, elfconv has no RISC-V ELF-lifting capability at all - it cannot translate RISC-V binaries regardless of what host it runs on.

**Performance gap:** Not applicable in the conventional SIMD/scalar-fallback sense, since there is no riscv64 code path to compare against amd64/arm64 hand-tuning. See Section 11 for the AArch64-only performance data that does exist.

**Security hardening gap:** Data not available: no riscv64 build exists to assess for hardening flags, ASLR, stack protector configuration, or similar.

**NaN / floating-point semantics:** No open issue matched "nan" or floating-point-exception keywords in the tracker. [Issue #122](https://github.com/yomaytk/elfconv/issues/122) lists several untested AArch64 floating-point instructions (FSUB, FDIV, FCSEL, UCVTF, SCVTF, FRINTA, FCVTAS) that could harbor undiscovered correctness bugs, but this is an AArch64-only concern with no RISC-V dimension since no RISC-V lifting exists.

## 7. CI/CD Infrastructure

Only two CI configuration files exist in the entire repository (confirmed via `find .github -type f`, plus absence of `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, CircleCI, Travis, or Azure Pipelines configs): [`.github/workflows/build-image.yml`](https://github.com/yomaytk/elfconv/blob/main/.github/workflows/build-image.yml) ("Build Image") and [`.github/workflows/tests.yml`](https://github.com/yomaytk/elfconv/blob/main/.github/workflows/tests.yml) ("Test"), plus `.github/dependabot.yml`.

**`build-image.yml`:** Triggers on push/PR to `main` (path-filtered to `Dockerfile` and the workflow itself) and `workflow_dispatch`. Matrix: exactly two entries, `ubuntu-22.04-arm` (arch: arm64, `ECV_AARCH64=1`) and `ubuntu-22.04` (arch: amd64, `ECV_X86=1`). Both are native GitHub-hosted runners - no QEMU for either architecture.

**`tests.yml`:** Triggers on push/PR to `main` (paths-ignore docs/md). `build-and-test` job matrix: AArch64 (`ubuntu-22.04-arm`) and AMD64 (`ubuntu-22.04`) only. `browser-test` job: fixed `ubuntu-22.04-arm` runner, matrix over demo projects (hello, bash), builds with `ECV_AARCH64=1` only, no architecture dimension.

A case-insensitive `grep -in "riscv"` on both files returns exit code 1 (zero matches) on each - not in matrix entries, comments, build-arg strings, or step names.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes | Yes | No |
| Runner type | Native (`ubuntu-22.04`) | Native (`ubuntu-22.04-arm`) | N/A |
| QEMU used | No | No | N/A |
| RISE runners referenced | No | No | No |
| Release-blocking | Implied (both archs gate `main`) | Implied | N/A |

**RISE runners:** No reference to `riseproject-dev` or RISE runner labels found anywhere in either workflow file, and elfconv has no presence in the `riseproject-dev` GitHub organization (verified: 49 repos enumerated, none named elfconv).

## 8. Distribution and Release Status

**GitHub Releases** (`yomaytk/elfconv`, 3 releases, full asset lists enumerated):

| Release | Date | Assets |
|---|---|---|
| v1.0.0 | 2026-03-30 | `elfconv-v1.0.0-linux-aarch64.tar.gz`, `elfconv-v1.0.0-linux-amd64.tar.gz`, `SHA256SUM`, source zip/tar.gz |
| v0.2.0 | 2025-07-31 | `elfconv-v0.2.0-linux-amd64.tar.gz`, `elfconv-v0.2.0-linux-arm64.tar.gz`, `SHA256SUM`, source zip/tar.gz |
| v0.1.0 | 2024-03-29 | `elfconv-v0.1.0-linux-amd64.tar.gz`, `elfconv-v0.1.0-linux-arm64.tar.gz`, `SHA256SUM`, source zip/tar.gz |

No asset in any release, across all 3 tags, contains "riscv" or "riscv64" in its filename. Re-verified independently twice via direct fetch of the `releases/expanded_assets/<tag>` fragments.

**PyPI:** `https://pypi.org/pypi/elfconv/json` returns **HTTP 404** - no project named `elfconv` exists on PyPI at all (re-verified via WebFetch and raw curl). `https://pypi.org/simple/elfconv/` also 404.

**RISE Python wheel builder:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/elfconv/` redirects (302) to the 404 PyPI simple index - no elfconv package in the RISE GitLab project either.

**Ubuntu 26.04 (Resolute):** `https://packages.ubuntu.com/search?keywords=elfconv&suite=resolute&searchon=names&section=all` returns "Sorry, your search gave no results" - no `elfconv` package exists in Ubuntu 26.04 on any architecture, re-verified via WebFetch and raw curl.

**Arch Linux RISC-V port** (`archriscv.felixc.at`): No listing found for `elfconv` via the site's search query, and zero matches in a raw crawl of the riscv64 repo listing directory.

**What a user must do to get a working binary:** Today, on any architecture (amd64, arm64, or riscv64), a user must either download the pre-built amd64/arm64 GitHub Release tarball, or build from source via Docker (`ECV_AARCH64=1` or `ECV_X86=1`) on an amd64 or arm64 host. There is no path - documented or otherwise - to a riscv64 elfconv binary, whether self-built or distributed.

Note: the project-graph MCP server (which would query the authoritative Ubuntu package graph) was unreachable (`CONNECTION_CLOSED`) throughout this research effort. The Ubuntu 26.04 "no package" conclusion rests on live `packages.ubuntu.com` scraping (verified twice, consistent both times), not on the graph database as would normally be preferred - flagged as an open verification gap, not a graph-confirmed result.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| LLVM | Build-dependency, critical - core codegen backend; Remill lifts machine code to LLVM IR, elfconv links MCJIT/interpreter/multiple target codegens | riscv64 is a first-class upstream LLVM target/host; LLVM routinely self-hosts on riscv64 | Full upstream buildbot/CI coverage of the RV target | Debian/Ubuntu have shipped `llvm-16` for riscv64 in recent cycles [NEEDS VERIFICATION] | 801 open upstream LLVM issues match "riscv64", all RISC-V **target-codegen** bugs (e.g. missed optimizations, loop-carried hazards), none are riscv64-host-build blockers |
| Remill | Build-dependency, critical - the vendored (`backend/remill`) lifting engine elfconv wraps; source-vendored, not a packaged dependency | No riscv64-host build issues found; not applicable as a package (source-only) | No CI evidence of riscv64-host testing | Source-only, no releases | Remill issue #757 "Add RISC-V Architecture Support" (lifting RISC-V as a target ISA, not host portability) was closed as **not planned** - caps elfconv's future RISC-V-input scope regardless of host portability |
| Intel XED | Build-dependency, critical - x86 instruction encoder/decoder; `find_package(XED CONFIG REQUIRED)` is unconditional in Remill's CMakeLists, so required even for AArch64-only elfconv builds | Zero riscv-tagged issues found (searched "riscv" and "riscv64") - untested territory, no confirmed support or failure | None found | Not distro-packaged; built from source via superbuild, so riscv64 host build success is unverified | No issues reported either way |
| glog | Build-dependency, optional - logging throughout Remill/elfconv | Portable CMake C++ library; only arm64/QNX build issues found, nothing riscv-specific | Data not available | Data not available | No riscv-related issues found |
| gflags | Build-dependency, optional - CLI flag parsing | Zero riscv-related issues at all - strong portability signal | Data not available | Data not available | No riscv-related issues found |
| emscripten | Build-dependency, critical - Wasm toolchain for the browser target (`TARGET=aarch64-wasm`), installed via `emsdk install 4.0.9` | emsdk distributes prebuilt LLVM+Binaryen+Node tarballs per host; upstream's published host matrix (Linux x86_64/arm64, macOS, Windows) has historically had no riscv64 host tarballs; no riscv64 issues found in the emsdk tracker | Likely untested on riscv64 hosts | Likely gap - a riscv64 host would probably need to build emscripten's LLVM fork from source rather than `emsdk install` | Most likely actual toolchain gap identified in this research |
| wasi-sdk | Build-dependency, critical - Wasm/WASI toolchain for `TARGET=aarch64-wasi32`, installed as a prebuilt tarball (v24) | Upstream issue #607 "Add riscv64 host platform support" exists and is **closed** (positive signal) but the current release's asset list for a `riscv64-linux` tarball was not directly confirmed [NEEDS VERIFICATION] | Unconfirmed | Unconfirmed for the pinned v24 | Recommend verifying wasi-sdk-24+ release assets directly |
| WasmEdge (indirect, via Dockerfile install script) | WASI runtime used to execute elfconv's Wasm output | Closed issues indicate riscv64 build support was added (#3625, #1694) | Closed issue #1708 indicates a prior riscv64 AOT-mode runtime bug was fixed | Plausible given closed cross-compile-CI issue, but asset list not confirmed | Best-supported runtime dependency for riscv64 among those checked |
| Wasmtime (indirect, via Dockerfile install script) | Alternate Wasm runtime installed but not the one used in the documented Usage flow | riscv64 (Cranelift) backend present but immature: 108 issues match riscv64, several **open** correctness bugs (#12195, #11050, #13959, #9186) | Multiple open Cranelift riscv64 bugs, not release-blocking-clean | riscv64 release artifacts exist upstream | Backend maturity lags x86_64/aarch64 |
| binutils-dev / libiberty-dev (indirect, apt) | ELF/DWARF parsing tooling used by Remill/elfconv | In scope of separate project tracking (GNU binutils); not yet independently verified here | Data not available | Data not available | No riscv-specific issue found via this research pass |
| libelf-dev / libdwarf-dev (indirect, apt) | ELF/DWARF parsing | Long-established Debian/Ubuntu riscv64-port packages historically, unverified in this pass [NEEDS VERIFICATION] | Data not available | Data not available | Not independently searched as standalone GitHub projects |
| liblzma-dev / zlib1g-dev (indirect, apt) | Compression, linked transitively via the LLVM/binutils toolchain | Data not available in this research pass | Data not available | Data not available | Tracked separately per standard xz/zlib riscv64 status |
| xterm-pty (indirect, git submodule) | Browser-side terminal emulator (pure JavaScript) for the interactive demo | Architecture-irrelevant - pure JS, no native build, runs client-side only | n/a | n/a | Not a build-time concern for any host architecture |

**Deep-dive - LLVM (critical, JIT/codegen dependency):** riscv64 is a first-class, actively maintained LLVM host and target; this is the strongest dependency in the chain for a hypothetical riscv64 port. The 801 open riscv64-tagged issues found in upstream LLVM are RISC-V-target-codegen quality bugs (i.e., bugs in code LLVM *generates for* RISC-V), not bugs that would block LLVM itself *running on* a riscv64 host.

**Deep-dive - Remill (critical, lifting engine):** Remill's own upstream tracker shows an explicit, closed-as-not-planned request to add RISC-V as a lifting *target* architecture ([#757](https://github.com/lifting-bits/remill/issues/757) referenced in research). This is orthogonal to riscv64 host portability but forecloses the most direct path to elfconv someday lifting RISC-V binaries via its current Remill fork.

**Deep-dive - emscripten (critical, Wasm toolchain):** This is the dependency most likely to be an actual blocker for a riscv64 *host* build, since `emsdk install` relies on prebuilt tarballs and historically has not published a riscv64 host tarball. A riscv64 port would likely require building Emscripten's LLVM fork from source rather than using the standard installer.

## 10. Ecosystem Status

Not applicable. elfconv is a standalone AOT binary-translation tool with no dependent package ecosystem (no npm/PyPI/Maven consumers depend on it as a library; it is not itself published as a package on any registry). Section omitted per instructions.

## 11. Known Bugs and Active Issues

Repo-wide, only 2 open issues carry the `bug` label:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#151](https://github.com/yomaytk/elfconv/issues/151) | Remill bug parsing CALL instruction | Open (filed 2025-09-04) | Correctness | Lifting an AArch64 HLS parser binary hits unrecognized AArch64 system registers, unsupported NEON load-multiple instructions (LD1/LD2 variants), and a fatal check failure in `remill::TraceLifter::Impl::Lift()` on a floating-point-typed call instruction |
| [#105](https://github.com/yomaytk/elfconv/issues/105) | Many warnings of the implicit conversion happen when building elfconv | Open (filed 2025-04-08), also `good first issue` | Low (latent risk) | `-Wsign-conversion` warnings in Remill's `Operators.h` (e.g. `uint32_t` -> `int`); not currently fatal |

Related, not labeled `bug`: [#122](https://github.com/yomaytk/elfconv/issues/122) "AArch64 instructions with no test is implemented" (open, `help wanted`/`good first issue`) - 12 untested AArch64 instructions, several floating-point (FSUB, FDIV, FCSEL, UCVTF, SCVTF, FRINTA, FCVTAS), that could harbor undiscovered correctness bugs.

**Correctness bugs highlighted:** #151 is the most severe open item - a fatal lifter crash on real-world binaries containing certain NEON/system-register instructions. It is AArch64-specific and has no RISC-V dimension since no RISC-V lifting path exists.

No open issue matches "riscv"/"riscv64" content-wise, and none matches "nan"/floating-point-exception keywords specifically.

## 12. Objections and Upstream Blockers

**Stated objections:** None explicit regarding RISC-V specifically - the topic has simply never come up in 865 commits, any issue, or any PR.

**Technical blockers:**
- elfconv has no RISC-V ELF-lifting code path (Section 4); adding one would require a full new Remill architecture backend (AArch64's backend alone is 139,943 LOC), a substantial undertaking.
- Remill's own upstream maintainers closed the equivalent request (#757, add RISC-V as a lift target) as not planned, meaning elfconv cannot lean on upstream Remill for this work and would need to develop and maintain a RISC-V lifter independently (or via the unused generic Sleigh/Ghidra-spec backend, for which no spec files are currently vendored).
- Separately, no riscv64 *host* build has ever been attempted; the emscripten dependency in particular likely requires from-source toolchain builds absent from the standard `emsdk install` flow (Section 9).

**Organizational blockers:**
- Single-maintainer project with no governance process for evaluating or accepting new architecture ports.
- No RISE involvement, no foundation backing, no corporate roadmap commitment to RISC-V (Section 1).
- The stated contribution roadmap prioritizes finishing AArch64 instruction coverage and advancing x86-64 support - RISC-V is not on the maintainer's stated agenda in any documented form.

**Acceptance probability:** Low, absent an external contributor or funded initiative. There is no technical objection to RISC-V being raised and rejected - the topic has simply never been proposed. A well-scoped external PR (e.g., adding riscv64 to the host-build CI matrix, or a RISC-V Remill backend) would have no known standing objection to overcome, but also no signal that the maintainer would prioritize reviewing or merging it given the current AArch64/x86-64-focused roadmap.

## 13. Readiness Assessment

- **Color:** orange (no upstream CI)
- **Release provider:** none
- **Justification:** elfconv has no upstream riscv64 CI (only `ubuntu-22.04-arm` and `ubuntu-22.04` native runners exist in [`build-image.yml`](https://github.com/yomaytk/elfconv/blob/main/.github/workflows/build-image.yml) and [`tests.yml`](https://github.com/yomaytk/elfconv/blob/main/.github/workflows/tests.yml)), no riscv64 release artifact in any of its 3 GitHub Releases, and no riscv64 distribution package anywhere checked (not on PyPI, not in Ubuntu 26.04 resolute, not in the Arch Linux RISC-V port). Per the color model's non-negotiable rule, "no CI and no distro package" defaults to orange, not red or grey, absent positive evidence the project is broken on riscv64 - and no such evidence exists because riscv64 has never been attempted. This is not an optimization-purpose project (it is a binary-translation correctness/functionality tool, not a performance-differentiator library), so the Step 2 optimization modifier does not apply and `optimization_gap` is N/A.
- **Pending work that could change the grade:** None identified. No open PR, issue, or discussion proposes riscv64 CI, a riscv64 build, or RISC-V lifting support. No RISE involvement of any kind was found (not in the RISE blog, wheel builder, or `riseproject-dev` org). The only lever that would move this project off orange is either (a) a riscv64 host-build CI job being added and passing (-> yellow if build-only, blue if tests also pass and no release, green if upstream also ships a riscv64 release binary), or (b) a distro packaging elfconv for riscv64 from unpatched source (-> yellow floor). Neither shows any sign of happening based on current maintainer priorities (Section 1, Section 12).

## 14. Investment Analysis

RISE has done no work on elfconv: it is absent from the RISE blog, the RISE Python wheel builder, and the `riseproject-dev` GitHub organization (49 repos checked, none named elfconv). No RISE funding, runner usage, or contribution of any kind was found. All investment below is therefore unclaimed and would need to be initiated from scratch.

### 14.1 Functional Enablement

Two separable problems exist:
1. **riscv64 host build** - get elfconv's existing AArch64-lift-to-Wasm pipeline building and running on a riscv64 machine. This requires: verifying/patching LLVM 16, Remill, Intel XED, glog, gflags for riscv64 host builds (largely low-risk per Section 9, except XED and Remill which are unverified); and resolving the emscripten `emsdk install` gap (likely requires building Emscripten's LLVM fork from source for a riscv64 host, since no prebuilt riscv64 host tarball is confirmed to exist upstream).
2. **RISC-V as an ELF lift target** - a substantially larger effort: writing a new Remill architecture backend for RISC-V (comparable in scope to the existing 139,943-LOC AArch64 backend), given that upstream Remill closed the equivalent feature request as not planned.

### 14.2 Performance Optimization

Not applicable at this stage - there is no riscv64 build to optimize. Once a riscv64 host build exists, elfconv's own benchmark methodology (Issue #116, Issue #65, comparing lifted-Wasm throughput against native-compiled and QEMU baselines) could be extended to a riscv64 host to characterize any host-architecture-specific slowdown, but this is downstream of functional enablement.

### 14.3 CI/CD Infrastructure

Adding a third matrix entry (riscv64) to both `build-image.yml` and `tests.yml`, most likely via QEMU emulation (no riscv64-native GitHub-hosted runner class is used by this project for any architecture today) or a RISE-provided riscv64 runner if access were arranged.

### 14.4 Ecosystem Enablement

Not applicable (Section 10) - elfconv has no dependent package ecosystem to enable.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify/fix riscv64 host build of LLVM 16, Intel XED, Remill (source-vendored), glog, gflags dependencies | 2-4 | TBD | High |
| Functional | Resolve emscripten (emsdk) riscv64 host toolchain gap (likely from-source LLVM-fork build) | 3-6 | TBD | High |
| Functional | Confirm/finish wasi-sdk riscv64 host tarball availability for pinned v24 | 0.5-1 | TBD | Medium |
| Functional | Full RISC-V Remill lifting backend (RISC-V as ELF input architecture) | 20+ (comparable to existing AArch64 backend scope) | TBD | Low (not aligned with maintainer's stated roadmap; large, speculative scope) |
| CI/CD | Add riscv64 matrix entry to `build-image.yml` and `tests.yml` (QEMU or RISE runner) | 1-2 | TBD | Medium |
| Ecosystem | N/A | N/A | N/A | N/A |

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [yomaytk/elfconv repository](https://github.com/yomaytk/elfconv)
- [elfconv README.md](https://github.com/yomaytk/elfconv/blob/main/README.md)
- [Issue #122 - AArch64 instrtuctions with no test is implemented](https://github.com/yomaytk/elfconv/issues/122)
- [Issue #151 - Remill bug parsing CALL instruction](https://github.com/yomaytk/elfconv/issues/151)
- [Issue #105 - Many warnings of the implicit conversion happen when building elfconv](https://github.com/yomaytk/elfconv/issues/105)
- [Issue #116 - Performance Comparison](https://github.com/yomaytk/elfconv/issues/116)
- [Issue #65 - performance test](https://github.com/yomaytk/elfconv/issues/65)
- [.github/workflows/build-image.yml](https://github.com/yomaytk/elfconv/blob/main/.github/workflows/build-image.yml)
- [.github/workflows/tests.yml](https://github.com/yomaytk/elfconv/blob/main/.github/workflows/tests.yml)
- [elfconv GitHub Releases](https://github.com/yomaytk/elfconv/releases)
- [PyPI JSON API for elfconv (404, project does not exist)](https://pypi.org/pypi/elfconv/json)
- [RISE GitLab wheel builder project (elfconv, redirects to empty PyPI index)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/elfconv/)
- [Ubuntu 26.04 (resolute) package search for elfconv](https://packages.ubuntu.com/search?keywords=elfconv&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=elfconv)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [AkihiroSuda/myaot (elfconv's predecessor project)](https://github.com/AkihiroSuda/myaot)
- [elfconv: an experimental AOT compiler that translates Linux/AArch64 ELF binary to WebAssembly (NTT Labs Medium)](https://medium.com/nttlabs/elfconv-an-experimental-aot-compiler-that-translates-linux-aarch64-elf-binary-to-webassembly-0d47b1b2d50b)
- [FOSDEM 2024 - elfconv slides](https://archive.fosdem.org/2024/events/attachments/fosdem-2024-2254-elfconv-aot-compiler-that-translates-linux-aarch64-elf-binary-to-webassembly/slides/22894/fosdem2024-elfconv_2_8cClxDY.pdf)
- [LLVM Dev Meeting 2025 - lifting machine code to high-performance LLVM IR slides](https://llvm.org/devmtg/2025-06/slides/quick-talk/yoshimura-ir.pdf)
- [Remill (lifting-bits/remill) repository](https://github.com/lifting-bits/remill)