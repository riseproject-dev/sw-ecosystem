---
title: emscripten
parent: Project Reports
color: yellow
dependencies:
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Binaryen
    relation: runtime-dependency
    criticality: critical
  - name: Node.js
    relation: test-dependency
    criticality: critical
  - name: mimalloc
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="emscripten" %}

# emscripten

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for emscripten<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Emscripten is a C/C++-to-WebAssembly compiler toolchain built on LLVM/Clang (compiler front end and codegen) and Binaryen (wasm-to-wasm optimizer, invoked as `wasm-opt` post-link). It compiles source code to `wasm32`/`wasm64` bytecode only; it does not compile to native machine code for any hardware instruction set (x86, ARM, RISC-V, or otherwise). This distinction matters throughout this report: "RISC-V support" for Emscripten cannot mean "RISC-V as a compilation target" the way it would for GCC or LLVM's native backends. The only meaningful axis is riscv64 as a **host platform** for running the Emscripten toolchain itself, comparable to existing arm64-host support in `emsdk`.

**Governance.** No formal foundation membership: [emscripten.org](https://emscripten.org/) makes no mention of OpenJS Foundation, Linux Foundation, or any umbrella body. The project is governed informally under the `emscripten-core` GitHub organization. No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository (checked root and `.github/`). `CONTRIBUTING.md` links to [emscripten.org's contributing docs](https://emscripten.org/docs/contributing/contributing.html), which document no formal commit-access policy or maintainer list. The closest thing to a governance document is `docs/process.md`, which describes an informal process: PRs land after review plus green CI, and contributors without commit access have approved PRs landed by someone who has it.

**License.** Dual-licensed under MIT and the University of Illinois/NCSA Open Source License, the latter chosen specifically so code could be upstreamed into LLVM (which uses that license). Copyright is attributed per-contributor via the `AUTHORS` file.

**Corporate sponsors.** Emscripten was created at Mozilla by Alon Zakai; his own `AUTHORS` entry now reads "copyright owned by Mozilla Foundation and Google, Inc.," reflecting his move to Google. The project today is overwhelmingly Google-maintained: the most active current committers (sbc100/Sam Clegg, dschuff/Derek Schuff, aheejin/Heejin Ahn, tlively/Thomas Lively) all carry `@chromium.org`/`@google.com` addresses with "copyright owned by Google, Inc./LLC," and sbc100/dschuff account for the majority of recent `main` commit activity. Mozilla Foundation remains a historical/founding sponsor (~15+ `AUTHORS` entries including Luke Wagner, Ehsan Akhgari, Nick Desaulniers, Yury Delendik). Microsoft has several current contributors doing .NET/Blazor-related work (Timothy Trindle, Zoltan Varga, Kenneth Pouncey, and others). Intel has a recurring contributor base (Robert Bragg, Ningxin Hu, Jiajie Hu, Petr Penzin, Andrew Brown, Le Yao). Igalia (Andy Wingo) and historically Meta (Daniel Baulig) each have at least one attributed contributor. Two recent top committers, guybedford and brendandahl, appear heavily in recent `main` history but have no `AUTHORS` entry, so their current corporate affiliation is not documented in-repo [NEEDS VERIFICATION].

**Community stance on RISC-V.** No discussion, RFC, or documented position on RISC-V could be found anywhere in the repository, issue tracker, or community channels searched. This is a non-issue for the project by design (RISC-V is out of scope as a compilation target), not a rejected or deferred request.

## 2. Port History and Upstreaming Timeline

Data not available: no riscv64 port milestone timeline exists because no riscv64 port work has ever been undertaken in `emscripten-core/emscripten` or `emscripten-core/emsdk`. `mcp__github__search_commits` for "riscv" and "RISC-V" scoped to `repo:emscripten-core/emscripten` returned zero results, independently confirmed via GitHub web commit search - no commit message in the project's history mentions RISC-V. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exist in the repository.

The only "riscv" occurrences in the working tree that touch anything resembling a change are:
- `system/lib/update_musl.py` - a static list of upstream musl's supported architecture directories (including `riscv32`, `riscv64`), used when mechanically vendoring musl source; not an Emscripten feature.
- `system/lib/llvm-libc/config/linux/riscv/exclude.txt` - an upstream llvm-libc per-architecture config file, last touched by a bulk "Update llvm-libc from LLVM 21.1.8 to 22.1.8" sync (PR #27374, author aheejin, approximately July 2026) - a wholesale library-version bump, not a riscv-specific change.

There is no "first RISC-V commit," no tracking issue, and no upstreaming timeline to report.

## 3. Upstream Support Tier

No formal tier policy exists for hardware ports, because the concept does not apply: Emscripten targets WebAssembly only, never a native ISA. x86, ARM, and RISC-V are equally out of scope as *compilation targets*. The only tier structure that exists in the project concerns **host platforms** for the prebuilt Emscripten SDK toolchain (LLVM/Clang, Binaryen, Node.js), managed via `emsdk`.

`emsdk.py`'s own canonical release manifest (`get_emscripten_releases_tot()`) hardcodes the complete, exhaustive list of published host platforms:
```python
all_platforms = [
  ('linux', '', 'tar.xz'),        # linux x86_64
  ('linux', '-arm64', 'tar.xz'),  # linux arm64
  ('mac', '', 'tar.xz'),          # mac x86_64
  ('mac', '-arm64', 'tar.xz'),    # mac arm64
  ('win', '', 'zip'),             # windows x86_64
]
```
Five platforms, zero riscv64 entries. This is the project's own authoritative manifest of what it builds and ships. Separately, `emsdk.py`'s host-architecture detection code recognizes only `x86_64`/`amd64` -> `x86_64`, `x86` (ending in `86`) -> `x86`, `aarch64`/`arm64` -> `arm64`, and `arm*` -> `arm`; any other value (including `riscv64`) falls to `exit_with_error('unknown machine architecture: ' + machine)`. Running `./emsdk install latest` on a riscv64 host fails immediately with this error - there is no fallback source-build path documented.

| Architecture | Upstream CI: build | Upstream CI: test | Upstream release artifact |
|---|---|---|---|
| amd64 (x86_64) | yes (`ubuntu-latest` / `ubuntu-lts` docker image, GitHub Actions + CircleCI) | yes (full CircleCI matrix: core tests, wasm64, browser/engine tests) | yes (emsdk GCS linux-x86_64, mac-x86_64, and win-x86_64 tarballs) |
| arm64 | yes (`linux-arm64` `arm.medium` machine executor; `mac-arm64` `m4pro.medium`; `windows-11-arm` for the pylauncher build) | yes (`test-linux-arm64`, `test-mac-arm64` CircleCI jobs) | yes (emsdk GCS linux-arm64 and mac-arm64 tarballs) |
| riscv64 | no | no | no - absent from the `all_platforms` manifest; host-arch detection rejects riscv64 outright |

Source: [`.circleci/config.yml`](https://github.com/emscripten-core/emscripten/blob/main/.circleci/config.yml) (1387 lines, read in full) and [`.github/workflows/`](https://github.com/emscripten-core/emscripten/tree/main/.github/workflows) (6 files, read in full); `emsdk.py` in [`emscripten-core/emsdk`](https://github.com/emscripten-core/emsdk).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Emscripten has no JIT (it is an ahead-of-time LLVM-to-wasm compiler), no `arch/riscv/` directory, and zero riscv references anywhere in its own driver/tooling code (`emcc.py`, `tools/`, `src/`) - confirmed via `grep -rniI riscv tools src emcc.py`, zero matches. There is no RISC-V-targeting codegen, SIMD dispatch, or assembly anywhere in Emscripten's own source, because Emscripten only ever emits `wasm32`/`wasm64` bytecode regardless of the host CPU.

All riscv-related material in the repository lives inside vendored, wholesale-copied third-party source trees under `system/lib/` - full upstream multi-architecture copies of llvm-libc, compiler-rt, libunwind, openmp, musl, and mimalloc, pulled in by mechanical sync scripts (e.g. `system/lib/update_llvm_libc.py`) rather than authored by the Emscripten project. Decisively, this vendored riscv code is **structurally unreachable** in any Emscripten build: `system/lib/llvm-libc/src/__support/macros/properties/architectures.h` gates `LIBC_TARGET_ARCH_IS_ANY_RISCV` behind the compiler predefining `__riscv`, while `LIBC_TARGET_ARCH_IS_WASM` is gated behind `__wasm__`. These are mutually exclusive `#elif` branches, and Emscripten's compiler always targets `wasm32-unknown-emscripten`/`wasm64-unknown-emscripten`, which always defines `__wasm__` and never `__riscv`. The riscv branch can never be selected by any Emscripten build, for any target Emscripten supports.

Dedicated `riscv/` directories under vendored llvm-libc:

| Path | Lines | Purpose | ISA extensions | Quality |
|---|---|---|---|---|
| `system/lib/llvm-libc/src/string/memory_utils/op_riscv.h` | 88 | Scalar compare/load building blocks for memcmp-style ops. Header comment literally says "This file provides x86 specific building blocks" - an upstream copy-paste artifact. | None | Complete (as upstream code) but mislabeled |
| `.../riscv/inline_memcpy.h` | 34 | Dispatches to generic `aligned_access_64bit`/`32bit` | None | Trivial forward, no riscv-specific optimization |
| `.../riscv/inline_memmove.h` | 28 | Forwards to generic byte-per-byte memmove | None | Stub-like, weakest tier available in the tree |
| `.../riscv/inline_memcmp.h` / `inline_bcmp.h` | 34 each | Forward to generic aligned-access implementations | None | Stub-like |
| `.../FPUtil/riscv/FEnvImpl.h` | 180 | fenv get/set via inline `frrm`/`fsrm`/`frflags`/`fsflags` asm | Base F/D | Complete |
| `.../FPUtil/riscv/sqrt.h` | 45 | sqrt via `fsqrt` inline asm | Base F/D | Complete |
| `.../OSUtil/linux/riscv/syscall.h` | 111 | Inline `ecall` syscall wrappers | Base ISA only | Complete |
| Config manifests (`config/linux/riscv/*`, `config/baremetal/riscv/*`) | ~2400 total lines | Build-config data listing libc entrypoints for a native riscv64 build | N/A | Complete config data, not code |

No RVV (RISC-V Vector extension) intrinsics or code exist anywhere in the repository: searches for `vfloat32m1_t` returned zero results, and searches for `rvv` returned only two false positives (a base64-encoded SVG logo and an npm package hash).

For context (not because it is reachable), comparing the same vendored llvm-libc `memory_utils` tree across architectures:

| Architecture | Files | Total lines | Hand-tuned? | `strlen` present? |
|---|---|---|---|---|
| x86_64 | 6 | 763 | yes - SSE2/AVX, `op_x86.h` | yes |
| aarch64 | 6 | 512 | yes - NEON-eligible generic-vector types, cache-line-tuned thresholds | yes |
| riscv | 5 | 164 | no - scalar word-at-a-time C only; memmove falls to naive byte-per-byte | no - missing entirely |

Even judged purely as inert upstream code (irrelevant to Emscripten's actual output), the riscv tier is the weakest of the three present in this vendored tree - scalar-at-best, with `memmove` and `strlen` falling to the most primitive generic fallback or missing outright.

Other multi-arch vendored files carry `#ifdef __riscv` branches (compiler-rt sanitizer syscall trampolines, libunwind DWARF register numbering, openmp `KMP_ARCH_RISCV64` platform gating, musl ELF relocation constants, mimalloc `MI_ARCH_RISCV*` detection and `sys/hwprobe.h` usage) - all inherited verbatim from upstream, none authored by Emscripten, none exercised when Emscripten compiles to wasm.

## 5. Build System, Cross-Compilation, and Toolchain

No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exist anywhere in `emscripten-core/emscripten`. Emscripten is a Python-based compiler driver (`emcc.py`, `emsdk.py`), not a CMake project - the only `CMakeLists.txt` files present are inside `test/` (third-party test fixtures such as Bullet, Poppler, FreeType). The one CMake toolchain file the project ships, [`cmake/Modules/Platform/Emscripten.cmake`](https://github.com/emscripten-core/emscripten/blob/main/cmake/Modules/Platform/Emscripten.cmake), is for *other* projects cross-compiling *to* WebAssembly via `emcc` - it hardcodes `EMSCRIPTEN_SYSTEM_PROCESSOR` to `x86` by default, with no riscv64 option.

No riscv64 Dockerfile exists: `mcp__github__search_code` for `riscv repo:emscripten-core/emscripten filename:Dockerfile` returned zero results, and there is no `Dockerfile` at all in the main repo. `emsdk` has exactly one Dockerfile (`docker/Dockerfile`, a plain `ubuntu:noble` two-stage build) with zero architecture-specific logic.

No QEMU documentation or usage exists for riscv64. The only QEMU references in the codebase are for s390x (big-endian) test cross-compilation (`test/test_core.py:10112`, `test/common.py:297` - e.g. `sudo apt install -y qemu-user libc6-s390x-cross`). Nothing analogous exists for riscv64.

**The disqualifying fact for build-from-source or install-on-riscv64 workflows:** `emsdk.py`'s host-architecture detection recognizes only `x86`, `x86_64`, `arm`, and `arm64`; any other `platform.machine()` value (riscv64 included) hits `exit_with_error('unknown machine architecture: ' + machine)`. There is no documented from-source build path for a riscv64 host, no toolchain version minimums documented for riscv64, and no `-DUSE_X=OFF`-style riscv64 build flags anywhere.

The 39-83 "riscv64"/"riscv" code-search hits found across the repository are confined entirely to `system/lib/*` vendored sources (musl `WHATSNEW`, compiler-rt sanitizer files, openmp `kmp_platform.h`, llvm-libc riscv config/code directories) plus two unrelated GNU autoconf `config.guess`/`config.sub` files bundled inside third-party test fixtures (`test/third_party/freetype`, `test/third_party/poppler`) - standard architecture-triple boilerplate, unrelated to Emscripten's own build system.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 host | arm64 host | riscv64 host |
|---|---|---|---|
| `emsdk install` (official toolchain fetch) | yes | yes | no - hard failure, unrecognized host architecture |
| Install via Ubuntu apt (`emscripten` package) | yes | yes | package installs (`Architecture: all`), but end-to-end functionality is unverified in this research since it depends on the system's separately-packaged clang/LLVM, Binaryen, and Node.js being functional on riscv64 |
| Upstream CI test-suite execution | yes | yes | none - no riscv64 job exists |
| Compile C/C++ to wasm32/wasm64 (the core product) | validated by CI | validated by CI | never exercised by upstream CI; the compile pipeline itself is host-arch-agnostic Python/LLVM-IR logic, so it would plausibly work, but this has never been confirmed |
| Execute compiled wasm via Node/V8 for the dev/test loop | yes | yes | exposed to open, riscv64-specific V8 correctness bugs (see below) |

**Functional gap.** The complete, primary functional gap is that the official `emsdk` toolchain installer cannot be used on a riscv64 host at all - this is a hard failure in host-arch detection, not a partial degradation.

**Compile-target gap.** Not applicable. Emscripten never compiles *to* RISC-V machine code for any host (amd64 or arm64 included), so there is no target-side gap to measure against those architectures - the concept simply does not exist for this project.

**Performance gap.** No quantifiable data exists. No benchmark of Emscripten's output on riscv64 hosts was found in GitHub, web search, or the RISE blog (see Section 11). This is also not a traditional "missing SIMD" gap in the way it would be for a native-code project, since Emscripten's own code has no host-architecture-specific fast paths to begin with (WebAssembly SIMD is architecture-neutral by design of the wasm spec).

**Security hardening gap.** Vendored `sanitizer_common` code carries `SANITIZER_RISCV64` guards for ASan/LSan shadow-memory (Sv39) mapping, but as with all vendored riscv code, this is inert unless a native riscv64 sanitizer runtime is built - no data was found on whether ASan-instrumented wasm output behaves correctly when executed via a riscv64 host.

**NaN / floating-point semantics.** [WebAssembly/design#646 "RISC-V and NaNs"](https://github.com/WebAssembly/design/issues/646) (closed) documents that RISC-V hardware generates NaN as an all-ones bit pattern, differing from the canonical NaN representation used by ARM/MIPS/PowerPC/x86 - a potential conflict with wasm's NaN-canonicalization rules. The same discussion notes RISC-V's IEEE 754-2008 exemptions for `min`/`max`/conversion operations, concluding these "could be added to wasm without significant practical cost." This is a general WebAssembly-spec-level discussion, not an issue filed against `emscripten-core/emscripten`, and there is no evidence it represents an active, unresolved defect specific to Emscripten.

**Downstream runtime risk (not Emscripten's own code).** Emscripten's own test/dev workflow shells out to Node.js (which embeds V8) to execute compiled wasm output. Two open, riscv64-specific V8 correctness bugs were found in this research: one described as an illegal-instruction crash when vector instructions are detected by V8 (RVV/SIMD codegen, reported with 36 comments), and one described as a SIGILL in the JS-to-wasm wrapper caused by lazy compilation entering unpopulated code pages (opened 2026-09-01, still open at time of writing) [NEEDS VERIFICATION - single-source finding, no URL captured, issue tracker not independently re-confirmed in this session]. If accurate, these bugs sit directly in the JS-to-wasm and SIMD codegen paths that Emscripten-produced wasm binaries exercise, meaning Emscripten's own riscv64 dev-loop is exposed to upstream V8 defects independent of anything in Emscripten's own code.

## 7. CI/CD Infrastructure

**GitHub Actions** (6 files, all read in full):

| File | Trigger | Runners | riscv? |
|---|---|---|---|
| `ci.yml` | push to `main`, all PRs, tag creation | `ubuntu-latest`, `windows-latest`, `windows-11-arm` | none |
| `rebaseline-tests.yml` | `workflow_dispatch` only | `ubuntu-latest` | none |
| `scorecards.yml` | push to `main`, weekly schedule, branch-protection-rule | `ubuntu-latest` | none |
| `tag-release.yml` | `workflow_dispatch` only | `ubuntu-latest` | none |
| `update-emsdk.yml` | `workflow_dispatch`, daily schedule | `ubuntu-latest` | none |
| `update-website.yml` | push to `main`, `workflow_dispatch` | `ubuntu-latest` | none |

No file contains the string "riscv" in any form, case-insensitive.

**CircleCI** ([`.circleci/config.yml`](https://github.com/emscripten-core/emscripten/blob/main/.circleci/config.yml), 1387 lines, read in full - this is the project's actual primary test-matrix CI, wired to the `build-test` workflow on every push/PR). Executors: `linux-node` (docker, x86_64), `ubuntu-lts` (docker `emscripten/emscripten-ci:jammy.v2`, x86_64), `linux-arm64` (`arm.medium` machine executor), `mac-arm64` (`m4pro.medium`, Apple Silicon), plus Windows via the `circleci/windows@5.0` orb. Job matrix includes linting, `build-linux`, `test-core0/2/3`, `test-wasm64-*`, browser tests (Chrome/Firefox), engine tests (Bun/Deno/JSC/SpiderMonkey/Node), `test-windows*`, `test-mac-arm64`, and `test-linux-arm64`. A case-insensitive `grep -rniE "riscv" .github/workflows/ .circleci/` returns zero matches in every file.

| Architecture | CI system | Runner / executor | Test execution | RISE runners used |
|---|---|---|---|---|
| amd64 | GitHub Actions + CircleCI | `ubuntu-latest`; `ubuntu-lts` docker; `linux-node` docker | full matrix | no |
| arm64 | GitHub Actions + CircleCI | `windows-11-arm`; `linux-arm64` (`arm.medium`); `mac-arm64` (`m4pro.medium`) | yes (`test-linux-arm64`, `test-mac-arm64`) | no |
| riscv64 | none | none | none | no - no reference to `riseproject-dev` or a RISE runner label found anywhere in CI files |

No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, or `azure-pipelines*` exist anywhere in the repository.

## 8. Distribution and Release Status

**GitHub Releases.** Checked the most recent releases (6.0.9 down through visible 6.0.0). Each shows only the standard GitHub auto-generated `Source code (zip)`/`Source code (tar.gz)` archives - no uploaded platform binaries of any kind, for any architecture. Emscripten distributes prebuilt toolchains via `emsdk`, not GitHub release assets.

**emsdk / Google Cloud Storage.** The actual prebuilt LLVM/Clang, Binaryen, and Node.js binaries are fetched by `emsdk` from GCS per the `all_platforms` manifest documented in Section 3: five platforms (linux x86_64, linux arm64, mac x86_64, mac arm64, windows x86_64), zero riscv64.

**PyPI.** No package named `emscripten` exists (`https://pypi.org/pypi/emscripten/json` and `https://pypi.org/simple/emscripten/` both return HTTP 404).

**RISE GitLab wheel builder** ([project 56254198](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/emscripten/)). Returns an HTTP 302 redirect to the same 404 PyPI page - no package by this name is present in the RISE builder's index.

**Arch Linux RISC-V port.** [`archriscv.felixc.at`](https://archriscv.felixc.at/?q=emscripten) returns no package-specific result for "emscripten" - only the port's generic landing content.

**Ubuntu 26.04 "resolute."** [`packages.ubuntu.com/resolute/emscripten`](https://packages.ubuntu.com/resolute/emscripten) lists `emscripten` 3.1.69+dfsg-4 and `emscripten-doc` 3.1.69+dfsg-4, both **Architecture: all** (a single generic download entry, no per-architecture binary), confirmed consistently across jammy/noble/questing/resolute/stonking suites. `node-quickjs-emscripten` 0.23.0+dfsg-5 also appears but is an unrelated binding package, not the compiler itself. Because the package is `Architecture: all`, it contains no compiled, architecture-conditional build output - there is structurally nothing for a riscv64-specific patch to apply to, and no riscv64-specific patches were found or would be expected. This satisfies a clean (unpatched) distribution build in the sense that the identical package content installs on riscv64 as on every other architecture Ubuntu supports.

**What a riscv64 user must do to get a working toolchain today.** The official `emsdk` path is unavailable (hard failure in host-architecture detection, Section 3/5). The only viable path found is the Ubuntu apt package (`apt install emscripten`), which installs identically on riscv64 but depends on the system's separately-packaged clang/LLVM, Binaryen (`wasm-opt`), and Node.js being functional on riscv64 hardware - none of which have confirmed upstream riscv64 CI validation in the dependency research performed (Section 9). No verified end-to-end "install, compile, and execute a wasm binary" report for riscv64 was found in any source consulted.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| [LLVM/Clang](https://github.com/llvm/llvm-project) | Compiler/codegen backend (`emcc`/`em++` are Clang drivers targeting wasm32/64); version-pinned via `emsdk` DEPS | De facto core target, actively maintained (SiFive et al.), but not in LLVM's required pre-merge gate (unlike x86_64/AArch64) | QEMU-only CI, not release-blocking | No official binary release differentiation by architecture | Active open RISC-V backend bug stream, e.g. issues referenced as missed-optimization, a loop-carried WAR hazard, an ISel crash, and a relaxation-relocation bug [NEEDS VERIFICATION - specific issue identifiers not independently re-confirmed] |
| [Binaryen / wasm-opt](https://github.com/WebAssembly/binaryen) | Wasm-to-wasm optimizer invoked post-link by `emcc`; version pinned (`EXPECTED_BINARYEN_VERSION = 132` in `tools/building.py`) | No riscv64-specific issues found at all (4 total search hits, none about riscv64) | No riscv64 CI evidence found | No riscv64 release artifacts found | Appears simply untracked for riscv64, consistent with being portable host C++ with no architecture-specific codegen |
| Node.js / V8 (embeds [v8/v8](https://v8.dev/)) | JS/wasm runtime used to execute and test Emscripten's build output throughout `test/`, `emrun`, and the dev workflow | Node.js has an active riscv64 label (64 issues found); V8's own CI runs riscv64 only under a simulator on x86-64 workers, not native hardware or QEMU | Multiple live, open, riscv64-only wasm-execution correctness bugs (illegal-instruction crash on vector-instruction detection; SIGILL in the JS-to-wasm wrapper from lazy compilation) [NEEDS VERIFICATION - no URL captured] | No official Node.js riscv64 binary releases - only `unofficial-builds.nodejs.org` tarballs; no standalone V8 package in any distro checked | Directly relevant to Emscripten's own dev/test loop, since it shells out to Node to run compiled wasm |
| [mimalloc](https://github.com/microsoft/mimalloc) | One of three selectable Emscripten memory allocators (`system/lib/mimalloc`, `-sMALLOC=mimalloc`) | Builds, with SV39 mmap-alignment fallback warnings ([microsoft/mimalloc#939](https://github.com/microsoft/mimalloc/issues/939)); two technically-sound fix PRs ([#1299](https://github.com/microsoft/mimalloc/pull/1299) runtime VA detection, [#1319](https://github.com/microsoft/mimalloc/pull/1319) TLS/atomic-yield fastpath) stalled awaiting single-maintainer review | No upstream riscv64 CI at all | Debian sid ships 3.3.2; Ubuntu 24.04 noble ships only 2.1.2, two major versions behind | PR-review bottleneck is the practical blocker, not a technical one |
| [zlib](https://github.com/madler/zlib) | Compression port (`tools/ports/zlib.py`); also required transitively by LLVM's `LLVM_ENABLE_ZLIB` | Builds cleanly, pure portable C | OpenBSD-riscv64 CI via QEMU; riscv64 absent from the Linux cross-compile CI matrix | Present in Ubuntu noble, Debian sid, Arch Linux RISC-V, Alpine edge | An RVV Adler32 performance PR ([#1099](https://github.com/madler/zlib/pull/1099)) has sat unmerged 8+ months with no maintainer response - a long-standing pattern, not riscv64-specific dysfunction |

**Cross-cutting finding.** The most consequential dependency risk for Emscripten specifically is the Node.js/V8 wasm-execution bug pair: both reportedly open, riscv64-only, and sitting exactly on the JS-wasm boundary and vector/SIMD codegen paths that Emscripten-produced wasm binaries exercise when run under `node` - meaning Emscripten's own riscv64 dev/test workflow is exposed to upstream V8 correctness risk on riscv64 hardware, independent of anything in Emscripten's own code [NEEDS VERIFICATION per above].

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-specific issue or PR exists in `emscripten-core/emscripten` or `emscripten-core/emsdk` | N/A | N/A | Confirmed via exhaustive, repeated searching: literal and semantic `search_issues`/`search_pull_requests`/`search_commits`/`search_code` queries across multiple passes, all returning either zero results or false-positive substring matches on "risc" (e.g. `[@esbuild/linux-riscv64](https://github.com/emscripten-core/emscripten/issues/22657)` as an incidental npm dependency path, or a user cross-compiling `riscv-gnu-toolchain` *using* Emscripten in [issue #12204](https://github.com/emscripten-core/emscripten/issues/12204)) |
| #23977 | `[deps]: Bump the development-dependencies group across 1 directory with 5 updates` | Closed | N/A | Routine Dependabot PR; matched the search substring "riscv64" only incidentally via an unrelated dependency path in the diff. [PR link](https://github.com/emscripten-core/emscripten/pull/23977) |
| WebAssembly/design#646 | "RISC-V and NaNs" | Closed | Informational | General wasm-spec discussion of RISC-V's all-ones NaN representation and IEEE 754-2008 min/max exemptions; not filed against Emscripten. [Issue link](https://github.com/WebAssembly/design/issues/646) |
| V8 (repo unconfirmed) #64538 | Illegal instruction crash when vector instructions detected by V8 | Open, reportedly 36 comments | Correctness (downstream) | riscv64-only SIGILL on RVV/SIMD codegen; affects execution of Emscripten-produced wasm on riscv64+Node [NEEDS VERIFICATION - no URL captured] |
| V8 (repo unconfirmed) #65724 | SIGILL in JS-to-wasm wrapper - lazy compilation enters unpopulated code pages | Open (opened 2026-09-01) | Correctness (downstream) | Same category of risk as above [NEEDS VERIFICATION - no URL captured] |
| microsoft/mimalloc#939 | SV39 mmap-alignment fallback warnings on riscv64 | Open | Build/runtime quality | Root cause identified, workaround exists; [issue link](https://github.com/microsoft/mimalloc/issues/939) |

**Correctness bugs highlighted separately:** the two V8 issues above are the only correctness-affecting bugs found anywhere in this research chain that would concretely affect Emscripten-produced wasm output running on riscv64 hardware. No correctness bug exists in Emscripten's own code for riscv64, because no riscv64-specific code path exists in Emscripten's own code to be incorrect.

## 12. Objections and Upstream Blockers

**Stated objections.** None found. No discussion, RFC, GitHub issue, or maintainer commentary - for or against riscv64 host support - exists in `emscripten-core/emscripten` or `emscripten-core/emsdk`, or in any web search performed.

**Technical blockers.** `emsdk.py`'s host-architecture detection hard-fails on riscv64 (`exit_with_error('unknown machine architecture: ' + machine)`), which structurally blocks anyone attempting to install or use `emsdk` on a riscv64 host without first patching the detection code. No riscv64 CI infrastructure exists to extend - unlike some other RISE-tracked projects, this repository shows no reference to RISE RISC-V Runners or any riscv64 CI hardware anywhere in its CI configuration.

**Organizational blockers.** None documented. There is no evidence of a rejected proposal, a deferred decision, or maintainer resistance - the absence of riscv64 support appears to be simple lack of demand or attention rather than an active decision.

**Acceptance probability.** Data not available: cannot be assessed from the material gathered, since there is no open request, RFC, or maintainer commentary either for or against riscv64 host support. This is a data gap, not evidence of receptiveness or hostility toward such a contribution.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro (Ubuntu)
- **Justification:** Emscripten has no upstream riscv64 CI of any kind, confirmed by a full read of every workflow file in `.github/workflows/` and the 1387-line [`.circleci/config.yml`](https://github.com/emscripten-core/emscripten/blob/main/.circleci/config.yml) - no riscv64 executor, job, or QEMU step exists anywhere, and `emsdk.py`'s own host-architecture detection explicitly rejects riscv64 (`exit_with_error('unknown machine architecture: ' + machine)`), with its authoritative `all_platforms` release manifest listing exactly five platforms, none of them riscv64. With no upstream CI, the distribution floor applies: Ubuntu 26.04 "resolute" ships `emscripten` 3.1.69+dfsg-4 as `Architecture: all` ([packages.ubuntu.com/resolute/emscripten](https://packages.ubuntu.com/resolute/emscripten)), the same unmodified content installed on every architecture including riscv64, with no riscv64-specific patches (none are structurally possible for an `Architecture: all` package). This is a clean, unpatched distro build with no upstream CI evidence - the definition of the yellow / `clean-distro-build` floor.
- **Optimization gap:** N/A. Emscripten is not an optimization-purpose project under the modifier's test (it would still deliver its core value - compiling C/C++ to WebAssembly - identically regardless of host-CPU-specific code paths, since it has none; wasm SIMD output is architecture-neutral by design of the wasm specification). The Step 2 modifier does not apply and does not cap this color.
- **Pending work that could change the grade:** No RISE involvement, funded project, or blog post mentions Emscripten anywhere (confirmed via RISE's own site search, its full 34-post blog sitemap, and a listing of all 25 repos in the `riseproject-dev` GitHub organization). No open PR in `emscripten-core/emscripten` or `emscripten-core/emsdk` addresses riscv64. The most plausible path to blue or green would be (a) adding a riscv64 branch to `emsdk.py`'s host-architecture detection and an `all_platforms` entry backed by an actual GCS-hosted riscv64 build of LLVM/Binaryen/Node, and (b) standing up riscv64 CI (build plus test) on the existing `linux-arm64` CircleCI job as a template - neither of which has any tracked upstream or RISE activity today.

## 14. Investment Analysis

RISE has done no work on Emscripten to date (Section 1, Section 13) - no funded project, blog post, wiki page, or repository ties RISE to Emscripten or WebAssembly. All scope below is therefore unclaimed and needs full sizing; nothing is already covered.

### 14.1 Functional Enablement
- Add a riscv64 branch to `emsdk.py`'s host-architecture detection (currently hard-fails with `exit_with_error('unknown machine architecture: ' + machine)`).
- Obtain or build riscv64 binaries of the three components `emsdk` fetches - LLVM/Clang, Binaryen, and Node.js - and add a sixth entry to the `all_platforms` manifest, mirroring the existing `('linux', '-arm64', 'tar.xz')` pattern.
- Validate end to end on riscv64 hardware: install via `emsdk`, compile a nontrivial C/C++ program to wasm, execute it via Node, and confirm output correctness - no such validation currently exists anywhere.

### 14.2 Performance Optimization
Not meaningfully applicable to Emscripten's own code, since it has no host-architecture-specific fast paths to add (wasm SIMD is architecture-neutral by wasm-spec design). Any performance-relevant work would target the downstream dependencies that do have riscv64-specific gaps: the reported V8 SIMD/RVV codegen bugs affecting wasm execution ([NEEDS VERIFICATION], Section 9/11), and the stalled mimalloc riscv64 fastpath PRs ([#1299](https://github.com/microsoft/mimalloc/pull/1299), [#1319](https://github.com/microsoft/mimalloc/pull/1319)).

### 14.3 CI/CD Infrastructure
Add a riscv64 executor/job to [`.circleci/config.yml`](https://github.com/emscripten-core/emscripten/blob/main/.circleci/config.yml), using the existing `linux-arm64` job (`arm.medium` machine executor, `test-linux-arm64`) as the template for both build and test-suite execution. Would require either a self-hosted riscv64 runner or an emulated (QEMU) executor, since CircleCI has no native riscv64 offering evidenced in this repository; RISE's own RISC-V Runners infrastructure (referenced in RISE's blog under "RISE RISC-V Runners - free native RISC-V CI on GitHub Actions") is not currently wired into this repository's CI in any way found in this research.

### 14.4 Ecosystem Enablement
Not applicable - no dependent package ecosystem requiring separate riscv64 enablement was identified for this project in the research performed (see Section 10 omission rationale below).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Patch `emsdk.py` host-architecture detection to recognize riscv64 | 0.5-1 | Emscripten/emsdk maintainer or external contributor | High |
| Functional | Produce/host riscv64 builds of LLVM/Clang, Binaryen, Node.js for `emsdk`'s GCS release channel | Data not available - depends on whether riscv64 builds of these three components already exist elsewhere for reuse; not sized without that data | Emscripten release infra owner (Google) or RISE build farm | High |
| Functional | End-to-end validation on riscv64 hardware (install, compile, run, verify output) | 1-2 | QA/porting engineer | High |
| CI/CD | Add riscv64 build+test job to `.circleci/config.yml` mirroring `test-linux-arm64` | 1-2 (plus runner provisioning, unscoped) | CI infrastructure owner | Medium |
| Dependency risk | Track/escalate the reported V8 riscv64 SIMD/JS-wasm-wrapper correctness bugs [NEEDS VERIFICATION] | N/A (tracking only, not Emscripten-owned work) | V8/Node.js upstream | Medium |
| Dependency risk | Support mimalloc riscv64 fastpath PR review (#1299, #1319) | N/A (tracking only, not Emscripten-owned work) | mimalloc upstream | Low |

## 15. Updates
(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [emscripten-core/emscripten](https://github.com/emscripten-core/emscripten)
- [Emscripten homepage](https://emscripten.org/)
- [Emscripten contributing docs](https://emscripten.org/docs/contributing/contributing.html)
- [emscripten-core/emsdk](https://github.com/emscripten-core/emsdk)
- [Issue #22657 - MainModuleFactory function implementation missing](https://github.com/emscripten-core/emscripten/issues/22657)
- [Issue #16678 - setjmp/longjmp jumping across stacks](https://github.com/emscripten-core/emscripten/issues/16678)
- [Issue #12204 - Using getrusage results in "_memset is not defined"](https://github.com/emscripten-core/emscripten/issues/12204)
- [PR #23977 - deps bump (Dependabot)](https://github.com/emscripten-core/emscripten/pull/23977)
- [.circleci/config.yml](https://github.com/emscripten-core/emscripten/blob/main/.circleci/config.yml)
- [.github/workflows directory](https://github.com/emscripten-core/emscripten/tree/main/.github/workflows)
- [cmake/Modules/Platform/Emscripten.cmake](https://github.com/emscripten-core/emscripten/blob/main/cmake/Modules/Platform/Emscripten.cmake)
- [WebAssembly/design issue #646 - RISC-V and NaNs](https://github.com/WebAssembly/design/issues/646)
- [WebAssembly/binaryen](https://github.com/WebAssembly/binaryen)
- [llvm/llvm-project](https://github.com/llvm/llvm-project)
- [microsoft/mimalloc issue #939](https://github.com/microsoft/mimalloc/issues/939)
- [microsoft/mimalloc PR #1299](https://github.com/microsoft/mimalloc/pull/1299)
- [microsoft/mimalloc PR #1319](https://github.com/microsoft/mimalloc/pull/1319)
- [madler/zlib PR #1099](https://github.com/madler/zlib/pull/1099)
- [PyPI emscripten package JSON (404)](https://pypi.org/pypi/emscripten/json)
- [PyPI emscripten simple index (404)](https://pypi.org/simple/emscripten/)
- [RISE GitLab wheel builder PyPI index for emscripten](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/emscripten/)
- [RISE wheel_builder page](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu resolute package search for emscripten](https://packages.ubuntu.com/search?keywords=emscripten&suite=resolute&searchon=names&section=all)
- [Ubuntu resolute emscripten package page](https://packages.ubuntu.com/resolute/emscripten)
- [Arch Linux RISC-V port search for emscripten](https://archriscv.felixc.at/?q=emscripten)
- [RISE project blog](https://riseproject.dev/blog)
- [RISE project blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE project homepage](https://riseproject.dev/)
- [RISE - Project RP009: LLVM SPEC Optimization](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [RISE - A Glimpse Into V8 Development for RISC-V](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [RISE - Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)