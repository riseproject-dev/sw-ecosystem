---
title: bloaty
parent: Project Reports
---

# bloaty

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for bloaty<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Bloaty is a size profiler for compiled binaries. It parses ELF, Mach-O, PE, and WebAssembly formats and attributes binary size to sections, symbols, compile units, and (for a subset of formats) inlined source lines, optionally augmented with instruction-level disassembly via the bundled Capstone library.

The project lives at [google/bloaty](https://github.com/google/bloaty) but the README explicitly disclaims official status: "This is not an official Google product." There is no foundation affiliation (not Linux Foundation, not Apache Software Foundation, not CNCF). Governance is informal: the repository has no MAINTAINERS, OWNERS, CODEOWNERS, GOVERNANCE.md, PLATFORMS.md, or SUPPORT.md file. All changes, including from long-time contributors, go through standard GitHub PR review, and every contributor must sign a Google CLA (individual or corporate, via `cla.developers.google.com`) before code merges. License is Apache-2.0.

The maintainer base is effectively Google-dominated with one significant independent contributor:
- **Joshua Haberman** (`haberman`) - original creator, 554 commits, merges nearly all PRs. Company field: Google.
- **Eric Rahm** (`EricRahm`) - 32 commits, the most active maintainer through 2025-2026 (DWARF/ELF crash fixes, closed issue #362). Company field: Google. GitHub bio reads "Android, Fuchsia, and RISC-V @google" [NEEDS VERIFICATION - self-reported profile bio, single source].
- **Saleem Abdulrasool** (`compnerd`) - 40 commits; authored the RISC-V-enabling PR under a `google.com` email address at the time (Google-affiliated at that point), though his public profile lists no company today. Independently known for LLVM/Swift-on-Windows work.
- **Ryan Mansfield** (`rjmansfield`) - 25 commits, the most active contributor in 2025-2026 (Mach-O/dSYM support, the DWARF5 fix that closed the RISC-V-relevant issue #362); no company listed on his GitHub profile, appears to be an independent/unaffiliated contributor.

There is no multi-vendor governance structure of any kind - decision-making is a small, informal Google-plus-one-independent-contributor group.

Community culture toward new architecture ports is lightweight and pragmatic, not process-heavy. `CONTRIBUTING.md` asks only that contributors open an issue first for anything taking more than 30 minutes, add tests, follow the Google C++ Style Guide, and sign the CLA. The RISC-V-enabling patch itself is the clearest illustration: a 50-line diff, opened and merged within 24 hours, with zero review comments.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-07-27 | [PR #237](https://github.com/google/bloaty/pull/237) "add support for RISC-V" opened by Saleem Abdulrasool (compnerd, Google) | [PR #237](https://github.com/google/bloaty/pull/237) |
| 2021-07-28 | PR #237 merged by Joshua Haberman (haberman), same-day turnaround, merge commit `53360fd9` squashing dev commit `90fa6839af4bba97aa1802534264c0d11d237fe6` | [PR #237](https://github.com/google/bloaty/pull/237) |
| 2022-06-29 | [Issue #311](https://github.com/google/bloaty/issues/311) opened (Android/ELF `-d inlines` regression, not RISC-V-specific, later becomes part of the fix chain relevant to RISC-V users) | [Issue #311](https://github.com/google/bloaty/issues/311) |
| 2023-09-06 | [Issue #362](https://github.com/google/bloaty/issues/362) opened against an ARM binary (`couldn't find abbreviation for code` crash) | [Issue #362](https://github.com/google/bloaty/issues/362) |
| 2024-08-17 | [PR #383](https://github.com/google/bloaty/pull/383) opened by Peter Edwards (peadar, Arista Networks) with a DWARF5 parsing fix; stalls on a maintainer request for tests | [PR #383](https://github.com/google/bloaty/pull/383) |
| 2025-09-14 | Commenter jefftrull confirms on Issue #362: "It would be great to have a fix for this (I observe it with a riscv toolchain)" - first direct RISC-V linkage | [Issue #362](https://github.com/google/bloaty/issues/362) |
| 2025-10-07 | Commenter cmorve-te diagnoses root cause: `DW_FORM_ref_udata` parsed as fixed 8-bit instead of ULEB128 | [Issue #362](https://github.com/google/bloaty/issues/362) |
| 2025-11-03 | rjmansfield revives PR #383's stalled work; EricRahm (new maintainer) authorizes a rebase with tests | [PR #383](https://github.com/google/bloaty/pull/383) |
| 2025-11-04 | [PR #440](https://github.com/google/bloaty/pull/440) opened by Ryan Mansfield, incorporating peadar's fix plus new regression tests | [PR #440](https://github.com/google/bloaty/pull/440) |
| 2025-11-05 | PR #440 merged by EricRahm (merge commit `c37548fa`); PR #383 closed as superseded; Issue #311 closed | [PR #440](https://github.com/google/bloaty/pull/440) |
| 2025-11-06 | Issue #362 closed by EricRahm, confirmed fixed by the RISC-V-toolchain reporter | [Issue #362](https://github.com/google/bloaty/issues/362) |

**Key contributors and organizations:**
- Saleem Abdulrasool (compnerd) - Google-affiliated at the time (PR #237)
- Joshua Haberman (haberman) - Google, merged PR #237
- Eric Rahm (EricRahm) - Google, closed Issue #362, merged PR #440
- Ryan Mansfield (rjmansfield) - independent, authored PR #440
- Peter Edwards (peadar) - Arista Networks, authored the original DWARF5 fix in PR #383
- jefftrull, cmorve-te - individual reporters/diagnosticians on Issue #362, no organizational affiliation found in findings

**Is it fully upstream?** PR #237 is merged into the `main` branch and is the entirety of RISC-V-specific work in the codebase's history - confirmed as the only RISC-V-related commit, PR, or issue via commit search, PR search, and issue-body search for "riscv"/"risc-v"/"rv32"/"rv64" across the project's full history. However, "upstream" here means default-branch HEAD only: bloaty has cut exactly two releases ever, v1.0 (2018-08-07) and v1.1 (2020-05-24), both of which predate PR #237 by more than a year. No release has shipped since 2020, so the RISC-V-enabling change (and the later DWARF5 fix in PR #440) exist only on `main`, never in a tagged/packaged release.

## 3. Upstream Support Tier

No formal tier policy exists anywhere in the repository - no PLATFORMS.md, no tiering language in README.md, CONTRIBUTING.md, or CHANGES.md. The closest signal is a source-code comment in `src/elf.cc`, adjacent to the ARM/AArch64/MIPS/PPC/SPARC Capstone mappings: "These aren't tested, but we include them on the off-chance that it will work." This reflects the project's general best-effort, untested-but-included stance toward secondary architectures. Notably, RISC-V is not even part of that "off-chance" group - it uses a separate, generic `default:` fallback path added specifically by PR #237, distinct from the named-but-untested architectures.

Evidence against any riscv64 tier commitment:
- No CI job of any kind exists for riscv64 (Section 7).
- No release has been cut since 2020, so "release-blocking" status is moot for every architecture, not just riscv64.
- No official prebuilt binaries exist for any architecture (Section 8) - the two GitHub releases contain only source tarballs.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Formal tier documentation | None (informal only) | None (falls under the "off-chance"/untested comment) | None (not even covered by the "off-chance" comment; uses a separate generic fallback) |
| CI coverage | Native (windows-latest, ubuntu-latest, both confirmed x86_64) | None | None |
| Official binaries | Source tarball only (v1.0, v1.1) | Source tarball only | Source tarball only; a riscv64 binary exists solely via an unofficial third-party Arch Linux port (Section 8) |
| Core size-profiling (ELF/DWARF/symbol/section) | Full | Full | Full |
| Instruction disassembly | Full | Present but explicitly marked "not tested" in source | Missing (no `EM_RISCV` mapping to Capstone) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Bloaty has no JIT, no hand-written SIMD, no cryptographic code, and no garbage-collector barriers - it is a static, read-only binary-format parser, so those categories do not apply. The only architecture-specific subsystem is the mapping from an ELF binary's `e_machine` field to a Capstone disassembler architecture/mode, and the disassembly cross-reference logic that consumes it.

**`ElfMachineToCapstone()`** (`src/elf.cc`, lines 793-843, verified by direct source read): a switch statement mapping `e_machine` to a Capstone `cs_arch`/`cs_mode` pair. It handles `EM_386`, `EM_X86_64`, `EM_ARM`, `EM_AARCH64`, `EM_MIPS`, `EM_PPC`, `EM_PPC64`, `EM_SPARC`, `EM_SPARCV9`. There is no `EM_RISCV` case - confirmed by repeated direct source reads and by GitHub code search (`EM_RISCV`, `CS_ARCH_RISCV`, `riscv`, `riscv64` all return zero matches in bloaty's own `.cc`/`.h` files). Any unrecognized `e_machine`, including RISC-V's `EM_RISCV` (=243), falls to `default: return false`, which disables disassembly but allows size/symbol attribution to proceed (this graceful-degradation behavior is exactly what PR #237 introduced in 2021, replacing a prior `THROWF` that crashed on unknown machine types).

The `EM_RISCV` constant itself is present in the vendored FreeBSD-derived header `third_party/freebsd_elf/elf_common.h` (line 308), along with the full `R_RISCV_*` relocation constant set (roughly 55 constants), but neither is ever referenced by bloaty's own source files - confirmed via grep of `e_machine`/`EM_` usage across `src/elf.cc` and `src/bloaty.cc`, which lists only the 9 architectures above.

**`DisassembleFindReferences()`** (`src/disassemble.cc`, line 44, verified by direct source read): hard-gated with `if (info.arch != CS_ARCH_X86) { return; }` - an explicit x86-only early return, by comment "x86 only for now." This means the cross-reference-following disassembly feature (used to resolve jump/call targets during disassembly) is unavailable for every non-x86 architecture, including arm64 and riscv64 alike, regardless of whether `ElfMachineToCapstone()` maps them.

**`TryGetJumpTarget()`** (`src/disassemble.cc`): switch statement with only a `CS_ARCH_X86` case; `default: return false` for everything else, again including arm64.

**The underlying disassembler backend already supports RISC-V.** Bloaty vendors Capstone as a git submodule (`third_party/capstone`, pinned at commit `accf4df6`, corresponding to v5.0.6). At that pinned commit, Capstone's `capstone.h` already defines `CS_ARCH_RISCV`, `CS_MODE_RISCV32`, `CS_MODE_RISCV64`, `CS_MODE_RISCVC`, backed by a full `arch/RISCV/` decoder tree, compiled in by default (`CAPSTONE_RISCV_SUPPORT` defaults ON in Capstone's own CMakeLists.txt). Wiring RISC-V into bloaty's disassembly path would require only a new `case EM_RISCV:` branch in `ElfMachineToCapstone()` - a change on the order of a few lines - but no one has submitted it in the more than 4 years since PR #237 shipped.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| ELF/DWARF/symbol/section size attribution | Full (architecture-agnostic logic) | Full (architecture-agnostic logic) | Full (architecture-agnostic logic; works incidentally, not via RISC-V-specific code) |
| `ElfMachineToCapstone()` mapping | Present (`EM_386`, `EM_X86_64`) | Present (`EM_ARM`, `EM_AARCH64`), marked "not tested" in source comment | Absent - no `EM_RISCV` case |
| Instruction disassembly (`--disassemble=FUNCTION`) | Works | Would work if mapping is correct (architecture-generic Capstone iteration path) | Does not work - `capstone_available` resolves false |
| Cross-reference/jump-target resolution (`-d disassemble` full mode) | Works (only architecture with a real case in `TryGetJumpTarget()`) | Does not work (falls to `default: return false`, same as riscv64) | Does not work (falls to `default: return false`) |
| Underlying Capstone decoder availability | Yes | Yes | Yes (vendored, compiled in, simply never dispatched to) |

## 5. Build System, Cross-Compilation, and Toolchain

There is no riscv64-specific build documentation, CI job, cross-compilation toolchain file, Dockerfile, or `-DUSE_X=OFF` flag anywhere in google/bloaty. The project has no cross-compilation infrastructure of any kind: no `cmake/` toolchain directory, no `.ci/docker/`, no `docker/` directory, no architecture-conditional CMake options. Confirmed absent by direct API listing (`.ci` and `cmake` paths both 404) and by code search (`filename:Dockerfile` returns zero hits; `qemu` returns zero hits repo-wide).

**Standard build** (from `README.md`, the only documented procedure, no architecture variants):
```sh
$ git submodule update --init --recursive
$ cmake -B build -G Ninja -S .
$ cmake --build build
$ cmake --build build --target install
```

`CMakeLists.txt` specifies `cmake_minimum_required(VERSION 3.5)` and `set(CMAKE_CXX_STANDARD 20)` (lines 1 and 8). No minimum GCC/Clang version is stated anywhere in the repository (README, CONTRIBUTING.md, tests/README.md, CHANGES.md) - the only hard constraint is C++20 language support, with no explicit version floor documented. CI itself (`.github/workflows/build.yml`) uses whatever compiler `ubuntu-latest`/`macos-latest`/`windows-latest` ships, unpinned.

**Build flags** (`CMakeLists.txt` `option()` declarations) are all generic, none architecture-specific: `BLOATY_ENABLE_ASAN` (OFF), `BLOATY_ENABLE_UBSAN` (OFF), `BLOATY_ENABLE_CMAKETARGETS` (ON), `BLOATY_ENABLE_BUILDID` (ON), `BLOATY_ENABLE_RE2` (ON), and five `BLOATY_PREFER_SYSTEM_*` toggles (abseil, capstone, protobuf, re2, zlib, zstd), all defaulting to prefer-system-if-found. None of these condition on architecture, and there is no riscv64 workaround flag - the disassembly-unavailable fallback (Section 4) is unconditional C++ logic, not a build-time option.

**QEMU:** not used anywhere in the repository (confirmed via repo-wide code search).

**Known build failures on riscv64:** none reported - no open GitHub issue documents a riscv64 build failure for bloaty itself. (Section 9 covers build friction in transitive dependencies, notably Abseil-cpp and Protocol Buffers.)

**Test fixtures:** `tests/testdata/` contains `linux-x86`, `linux-x86_64`, `macho`, `PE`, `wasm`, `dwarf5`, `fuzz_corpus`, and `misc` directories - no `linux-riscv64` directory exists, and the fixture-generation script (`tests/testdata/make_test_files.sh`) invokes the native `${CC:-cc}` with no cross-compilation logic.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Section/symbol/compile-unit size breakdown | Full | Full | Full |
| DWARF-based source-line attribution (`-d inlines`, `-d compileunits`) | Full | Full | Full (after PR #440 fixed the LEB128 parsing bug that a RISC-V-toolchain user hit; see Section 11) |
| Instruction-level disassembly (`--disassemble=FUNCTION`) | Full | Functional but explicitly "not tested" per source comment | Missing entirely - no `EM_RISCV` to `CS_ARCH_RISCV` mapping |
| Disassembly cross-reference / jump-target resolution | Full (only arch with a real `TryGetJumpTarget()` case) | Missing (x86-only gate) | Missing (x86-only gate) |
| CI build verification | Native x86_64 runner | None | None |

**Functional gaps:** RISC-V binaries cannot be disassembled by bloaty at all - `bloaty -d disassemble` or `--disassemble=FUNCTION` against a riscv64 target silently produces no instruction-level output, falling back to symbol/section-only attribution. This is a deliberate, by-design fallback (not a crash) dating to PR #237, but it has never been revisited to actually add RISC-V support to the disassembler dispatch, despite the vendored Capstone library already being capable.

**Performance gaps:** Data not available: no riscv64 vs arm64 or riscv64 vs amd64 performance/throughput benchmark data for running bloaty itself exists anywhere searched (GitHub issues/PRs, RISE Project blog, or general web search). Bloaty is a static analysis tool, not a runtime workload with a natural throughput metric, and no one has published such numbers.

**Security hardening gaps:** Data not available: no riscv64-specific hardening discussion (stack protector, CFI, PAC/BTI-equivalent) found in any bloaty issue, PR, or documentation.

**NaN / floating-point semantics issues:** Not applicable - bloaty performs no floating-point computation relevant to its core function (it is a binary-format parser and size aggregator, not a numerics library).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Confirmed by direct retrieval and grep of both CI configuration files in the repository - `.github/workflows/build.yml` (118 lines) and `.github/workflows/cifuzz.yml` (21 lines) are the only two CI files present (verified via `gh api repos/google/bloaty/contents/.github/workflows`); no `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/config.yml`, `appveyor.yml`, `.travis.yml`, or `azure-pipelines.yml` exist (all return 404).

`grep -ni "riscv" build.yml cifuzz.yml` returns zero matches in either file.

**`build.yml`** triggers on `push`/`pull_request` to `main` plus `workflow_dispatch`. Three jobs, all on GitHub-hosted x86 runners:
- `windows`: `runs-on: windows-latest`, matrix `{Win32, x64}` (an ARM64 matrix entry exists but is commented out)
- `macOS`: `runs-on: macos-latest`, matrix `{default, -fmodules}`
- `ubuntu`: `runs-on: ubuntu-latest`, matrix `{gcc, clang}`

**`cifuzz.yml`** triggers on `pull_request`, single job `Fuzzing` on `runs-on: ubuntu-latest`, matrix `sanitizer: [address, undefined]`, using `google/oss-fuzz` reusable actions.

No job in either file uses QEMU, binfmt_misc emulation, a self-hosted runner, or a RISE-provided runner. No RISE Project involvement of any kind was found for this project - not in the RISE blog (32 posts scanned, none mention bloaty), not in the `riseproject-dev` GitHub org (49 repositories, none named or referencing bloaty), and not in the RISE Python wheel_builder's list of 74 supported packages. Google LLC is itself a RISE Premier Member, but that corporate membership is unconnected to bloaty specifically.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job present | Yes (windows-latest, macos-latest, ubuntu-latest all x86_64/Intel or Apple Silicon native) | No dedicated job (ARM64 Windows matrix entry present but commented out/disabled) | No |
| QEMU/emulation | Not needed (native runners) | Not used | Not used |
| RISE-provided runner | No | No | No |
| Self-hosted runner | No | No | No |

## 8. Distribution and Release Status

**GitHub Releases:** exactly two releases exist in the project's history - v1.1 (2020-05-24) and v1.0 (2018-08-07), each shipping only a source tarball (`bloaty-1.1.tar.bz2`, `bloaty-1.0.tar.bz2`). Zero binary assets for any architecture in either release. This is a total absence of prebuilt binaries generally, not a riscv64-specific gap.

**PyPI:** not applicable. `https://pypi.org/pypi/bloaty/json` returns HTTP 404; bloaty is a C++ tool and has never been published as a Python package.

**RISE wheel builder:** not applicable, for the same reason - the GitLab PyPI-proxy project returns a redirect to the same 404 PyPI page.

**npm, Maven, OCI:** Data not available / not applicable - bloaty is a standalone C++ CLI binary with no package-manager distribution model in any of these ecosystems; no evidence was found of any such packaging attempt.

**Ubuntu 24.04 (noble):** not packaged at all ("Sorry, your search gave no results" on `packages.ubuntu.com`), any architecture.

**Debian:** not packaged at all - `tracker.debian.org/pkg/bloaty` returns HTTP 404, `packages.debian.org` search returns no results, and `sources.debian.org/api/src/bloaty/` returns `{"error": 404}`. No riscv64-specific gap; the package simply does not exist in Debian's archive for any architecture.

**Arch Linux (official, x86_64 only):** packaged in the `extra` repo, current version 1.1-26 (build date 2026-06-22), confirmed via `archlinux.org/packages/extra/x86_64/bloaty/json/`.

**Arch Linux RISC-V (unofficial third-party community port, archriscv.felixc.at):** this is the only channel among all sources checked that ships a working riscv64 binary. Verified by direct download: `bloaty-1.1-25-riscv64.pkg.tar.zst` (196,466 bytes) plus its `.sig` file, both HTTP 200, correct Zstandard magic bytes confirmed by byte inspection (not a stub/placeholder/redirect). The build-status tracker flags it only with a routine "DEP OUTDATED: protobuf" warning (not a build failure/FTBFS flag) - it is one package-release behind the official x86_64 tip (1.1-25 vs 1.1-26) due to a pending dependency rebuild, a normal rolling-release lag rather than brokenness. This port is explicitly unofficial: it is a separate, community-maintained project distinct from official Arch Linux, which supports only x86_64.

**What a user must do to get a working riscv64 binary today:** either (a) install the unofficial Arch Linux RISC-V port's prebuilt package from `archriscv.felixc.at`, or (b) build from source on a riscv64 host or via native compilation (no cross-compilation path is documented or supported), using the generic `cmake -B build -G Ninja -S . && cmake --build build` sequence with no architecture-specific flags required or available. There is no path to a prebuilt binary through any officially blessed channel (Google does not publish binaries for any architecture; Debian, Ubuntu, and PyPI do not carry the package at all).

| Channel | riscv64 available | Notes |
|---|---|---|
| GitHub Releases | No | Source tarball only, for any architecture; no release since 2020 |
| PyPI | Not applicable | Not a Python package |
| Ubuntu | No | Package absent for any architecture |
| Debian | No | Package absent for any architecture |
| Arch Linux (official) | No | x86_64 only |
| Arch Linux RISC-V (unofficial port) | Yes | `bloaty-1.1-25-riscv64.pkg.tar.zst`, verified working, one pkgrel behind x86_64 |

## 9. Dependencies

| Dependency | Role in bloaty | riscv64 Build | riscv64 Test | riscv64 Release | Community/notes |
|---|---|---|---|---|---|
| Capstone (`third_party/capstone`, pinned v5.0.6, commit `accf4df6`) | Disassembler backend for `-d disassemble` | Yes, `CAPSTONE_RISCV_SUPPORT=ON` by default; not in Capstone's own dedicated cross-build CI lane | No dedicated riscv64 CI in Capstone; portable C | Debian sid: installed (5.0.9-1) on riscv64 | RISC-V decoder exists but bloaty never dispatches to it (Section 4) |
| Protocol Buffers (`third_party/protobuf`) | Generates `bloaty.pb.cc`/`.h`, decodes protobuf-descriptor sections | No - maintainers state riscv64 "is not a platform supported by the protobuf project... not staffed to add support" per [issue #17798](https://github.com/protocolbuffers/protobuf/issues/17798) | No riscv64 CI | No official riscv64 release asset; Debian sid ships a community-packaged build, not upstream-blessed | See [project-reports/protocol-buffers.md](project-reports/protocol-buffers.md) |
| Abseil-cpp (`third_party/abseil-cpp`) | C++ foundation library (strings, containers), pulled transitively by protobuf/RE2 | Mostly yes, with friction: `-latomic` needed for sub-word atomics on some GCC riscv64 toolchains ([issue #1702](https://github.com/abseil/abseil-cpp/issues/1702), unresolved) | Two known test SEGFAULTs on Debian riscv64 + GCC 15.2 ([issue #2002](https://github.com/abseil/abseil-cpp/issues/2002), open, unresolved) | Source-only releases (any arch); Debian sid installed (20260526.0-2) on riscv64 | See [project-reports/abseil-cpp.md](project-reports/abseil-cpp.md) |
| RE2 (`third_party/re2`) | Regex engine for `--source-filter`/demangled-name matching (default ON) | Yes, portable C++; no riscv64-specific issues found | No dedicated riscv64 CI found | Debian sid installed (20251105-1+b1) on riscv64 | None found |
| zlib (`third_party/zlib`) | Decompresses compressed ELF sections/debug info | Yes, portable C; no dedicated Linux riscv64 CI lane | RVV-accelerated Adler32 PR open since Oct 2025, unreviewed | Source-only (any arch); Ubuntu/Debian/Arch/Alpine all ship riscv64 packages | See [project-reports/zlib.md](project-reports/zlib.md) |
| zstd (`third_party/zstd`) | Decompresses zstd-compressed debug sections/archive members | Yes - actively improved, riscv64 arch-detection fix merged Dec 2025 | RVV-specific QEMU CI added; one older closed contrib-build issue | Debian sid + Ubuntu 24.04 both ship riscv64 packages | See [project-reports/zstd.md](project-reports/zstd.md) - healthiest dependency for riscv64 |
| googletest (`third_party/googletest`) | Unit-test framework, build-time only, not linked into the shipped binary | Yes, portable C++ | One open flaky test on riscv64 ([issue #3756](https://github.com/google/googletest/issues/3756), open) - affects bloaty's own test suite only | Debian sid installed (1.17.0-1+b1) on riscv64 | Not in project-reports/scope.yml, no dedicated report |
| demumble (`nico/demumble`, vendored source) | Symbol demangling (Itanium C++, Rust, MSVC, D, Swift), compiled directly into `libbloaty` | Yes, pure portable C++, no architecture-conditional code found | Not applicable (no CI in this small vendored source) | Not applicable (source only, no package) | None found |

**Deep-dive - the one dependency relevant to the "SIMD/numerics" category (Capstone):** Capstone is bloaty's only dependency with architecture-specific decode logic. It already ships a complete RISC-V decoder backend (`CS_ARCH_RISCV`, `CS_MODE_RISCV32/64/C`) at the version bloaty vendors. The blocker is entirely on bloaty's side (missing `EM_RISCV` case in `ElfMachineToCapstone()`), not on Capstone's. No SIMD, JIT, or cryptographic dependency exists in bloaty's dependency tree.

**Overall dependency posture:** every dependency builds and is installable on riscv64 today (all confirmed present in Debian sid). The two genuine weak points are Protocol Buffers (upstream explicitly declines riscv64 support) and the unwired Capstone RISC-V dispatch inside bloaty's own code (not a dependency problem per se). Abseil-cpp contributes minor, known, non-blocking friction. zstd and zlib are non-issues.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #237](https://github.com/google/bloaty/pull/237) | add support for RISC-V | Merged (2021-07-28) | N/A (feature) | Generic "don't crash on unknown `e_machine`" fallback; enables size-only analysis for RISC-V binaries, does not add disassembly |
| [Issue #362](https://github.com/google/bloaty/issues/362) | `couldn't find abbreviation for code` with `-d compileunits` | Closed (2025-11-06) | Correctness bug | Originally reported against an ARM binary; independently reproduced by a RISC-V-toolchain user (jefftrull, 2025-09-14); root cause was a `DW_FORM_ref_udata` LEB128 parsing bug in `src/dwarf/attr.cc`, affecting any toolchain (GCC for RISC-V and ARM both) emitting that DWARF form |
| [PR #440](https://github.com/google/bloaty/pull/440) | Fix various issues with debug_lines parsing, and support DWARF5 (with tests) | Merged (2025-11-05) | Correctness fix | The actual fix that resolved Issue #362; not RISC-V-specific itself but closes the RISC-V-linked crash report |
| [PR #383](https://github.com/google/bloaty/pull/383) | Fix various issues with debug_lines parsing, and support DWARF5 | Closed, unmerged, superseded by #440 | N/A | Stalled 14+ months on a maintainer request for tests before being rebased and completed as PR #440 |
| [Issue #311](https://github.com/google/bloaty/issues/311) | `-d inlines` no longer works on Android shared library | Closed (2025-11-05) | Correctness bug (regression) | 3-year-old regression (2022 to 2025), same underlying fix as #440; not RISC-V-specific but part of the same fix chain |

**Correctness bugs highlighted separately:** Issue #362 (and its root-cause sibling Issue #311) are the only correctness bugs in bloaty's history with a documented RISC-V nexus - both are DWARF-parsing bugs affecting any architecture's toolchain output that uses the relevant DWARF forms, not RISC-V-specific defects. Both are now fixed on `main` (unreleased, per Section 2). No open correctness or performance bug specific to riscv64 exists as of this report - confirmed by exhaustive issue/PR search across all states for `riscv64`, `riscv`, `RISC-V`, `EM_RISCV`, `rv64`, `capstone`, and `disassembly disabled`.

**Structural gap not tracked as a bug:** the missing `EM_RISCV` case in `ElfMachineToCapstone()` (Section 4) has no open tracking issue. It is a source-level finding from this research, not a documented/acknowledged gap in bloaty's own issue tracker.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer has objected to RISC-V support in any issue, PR, or discussion - the original PR #237 was merged same-day with zero review comments.

**Technical blockers:** the disassembly gap (missing `EM_RISCV` to `CS_ARCH_RISCV` mapping) is a pure omission, not a stated technical blocker - the vendored Capstone dependency already supports RISC-V decode, so there is no upstream dependency blocker to clear. The `disassemble.cc` x86-only gates on cross-reference resolution apply equally to arm64, so they are not a RISC-V-specific blocker either - they represent unfinished generalization work with no architecture bias.

**Organizational blockers:** none specific to RISC-V. The general contribution process (CLA signature, issue-first for >30-minute changes, test requirement) is procedural and applies uniformly, as illustrated by PR #383's 14-month stall over a generic "please add tests" request unrelated to architecture.

**Acceptance probability:** high, based on precedent. The one RISC-V PR that has been submitted (#237) was merged within 24 hours with no review friction. The maintainers (Haberman, Rahm) and the most active current contributor (Mansfield) have shown they will merge well-scoped, tested patches quickly (PR #440 landed in 2 days once tests were added). A small, well-tested PR adding `case EM_RISCV: *arch = CS_ARCH_RISCV; *mode = CS_MODE_RISCV64; return true;` to `ElfMachineToCapstone()`, plus a `linux-riscv64` test fixture, would very likely be merged quickly given this track record - no one has simply submitted it yet.

## 13. Investment Analysis

**RISE Project prior work check:** RISE has funded no work on bloaty. Bloaty is not listed in `project-reports/scope.yml`'s RISE-tracked set, has zero mentions across all 32 RISE blog posts scanned, has no repository in the 49-repository `riseproject-dev` GitHub org, and is absent from the RISE Python wheel_builder's 74-package list (not applicable regardless, since bloaty is not a Python package). Google LLC's RISE Premier Membership is unconnected to bloaty specifically. All investment items below are therefore fully unaddressed - nothing to subtract for prior RISE funding.

### 13.1 Functional Enablement

Core size-profiling already works on riscv64 (architecture-agnostic ELF/DWARF logic, confirmed functional since PR #237 in 2021). The remaining functional gap is disassembly: add `case EM_RISCV:` to `ElfMachineToCapstone()` in `src/elf.cc`, mapping to `CS_ARCH_RISCV`/`CS_MODE_RISCV64` (and `CS_MODE_RISCV32` for 32-bit targets), plus a `linux-riscv64` test fixture directory under `tests/testdata/`. This is a small, well-scoped change modeled directly on the existing amd64/arm64 cases already in the same function. Cross-reference/jump-target resolution (`disassemble.cc`) would remain unavailable for riscv64, consistent with its current unavailability for arm64 as well - extending it is a separate, larger, non-RISC-V-specific generalization effort that would benefit arm64 equally.

### 13.2 Performance Optimization

Not applicable in any meaningful sense - bloaty is a size-analysis CLI tool, not a computational workload with SIMD/vectorization opportunities. No performance optimization work is identified as a distinct investment area.

### 13.3 CI/CD Infrastructure

No riscv64 CI exists (Section 7). Adding a riscv64 job to `.github/workflows/build.yml` would require either a native riscv64 GitHub-hosted runner (not offered by GitHub as of this report) or a RISE-provided/self-hosted riscv64 runner (RISE announced "RISE RISC-V Runners: free, native RISC-V CI on GitHub" per a 2026-03-24 blog post, per the RISE blog findings above, though no evidence was found that bloaty has adopted this). Given the project's minimal existing CI footprint (2 workflow files, no cross-compilation matrix for any architecture beyond native x86/Apple Silicon), this would be a straightforward addition once the functional disassembly gap (13.1) is closed, so there is something to test.

### 13.4 Ecosystem Enablement

Not applicable - bloaty has no dependent package ecosystem (it is a standalone CLI tool with no plugin/extension model, no npm/PyPI/Maven presence). Section 10 is omitted per the report's scope rules.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `EM_RISCV` case to `ElfMachineToCapstone()` in `src/elf.cc`, wire to existing vendored Capstone RISC-V backend | 0.5-1 | Any contributor familiar with C++/ELF | High |
| Functional | Add `linux-riscv64` test fixtures under `tests/testdata/`, following existing `linux-x86`/`linux-x86_64` pattern | 0.5-1 | Any contributor | Medium |
| CI | Add riscv64 job to `.github/workflows/build.yml` (RISE runner or self-hosted) | 0.5-1 | Contributor with CI/RISE-runner access | Medium |
| Functional (stretch) | Generalize `disassemble.cc` cross-reference/jump-target resolution beyond x86-only (benefits arm64 equally, not RISC-V-specific) | 2-4 | Contributor with Capstone/disassembly expertise | Low |
| Distribution | Engage with unofficial Arch RISC-V port maintainers or pursue official Debian/Ubuntu packaging (blocked partly by Protocol Buffers riscv64 status, see project-reports/protocol-buffers.md) | Not sized - dependent on Protocol Buffers upstream resolution, outside bloaty's control | N/A | Low |

Given bloaty's narrow, single-purpose scope, total realistic investment to close the functional gap and add CI is on the order of 1.5-3 person-weeks, substantially smaller than typical runtime/toolchain ports, because the enabling groundwork (generic size-profiling, vendored Capstone RISC-V decoder) already exists and only needs to be connected.

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [google/bloaty repository](https://github.com/google/bloaty)
- [PR #237 - add support for RISC-V](https://github.com/google/bloaty/pull/237)
- [Issue #362 - couldn't find abbreviation for code](https://github.com/google/bloaty/issues/362)
- [PR #440 - Fix various issues with debug_lines parsing, and support DWARF5 (with tests)](https://github.com/google/bloaty/pull/440)
- [PR #383 - Fix various issues with debug_lines parsing, and support DWARF5](https://github.com/google/bloaty/pull/383)
- [Issue #311 - -d inlines no longer works on Android shared library](https://github.com/google/bloaty/issues/311)
- [src/elf.cc on main](https://github.com/google/bloaty/blob/main/src/elf.cc)
- [src/disassemble.cc on main](https://github.com/google/bloaty/blob/main/src/disassemble.cc)
- [third_party/freebsd_elf/elf_common.h on main](https://github.com/google/bloaty/blob/main/third_party/freebsd_elf/elf_common.h)
- [.github/workflows/build.yml on main](https://github.com/google/bloaty/blob/main/.github/workflows/build.yml)
- [.github/workflows/cifuzz.yml on main](https://github.com/google/bloaty/blob/main/.github/workflows/cifuzz.yml)
- [CMakeLists.txt on main](https://github.com/google/bloaty/blob/main/CMakeLists.txt)
- [Capstone (aquynh/capstone) at pinned commit accf4df6](https://github.com/aquynh/capstone/blob/accf4df62f1fba6f92cae692985d27063552601c/include/capstone/capstone.h)
- [Capstone CMakeLists.txt at pinned commit accf4df6](https://github.com/aquynh/capstone/blob/accf4df62f1fba6f92cae692985d27063552601c/CMakeLists.txt)
- [Protocol Buffers issue #17798](https://github.com/protocolbuffers/protobuf/issues/17798)
- [Protocol Buffers issue #14549](https://github.com/protocolbuffers/protobuf/issues/14549)
- [Abseil-cpp issue #1702](https://github.com/abseil/abseil-cpp/issues/1702)
- [Abseil-cpp issue #2002](https://github.com/abseil/abseil-cpp/issues/2002)
- [zstd PR #4525](https://github.com/facebook/zstd/pull/4525)
- [zstd PR #4435](https://github.com/facebook/zstd/pull/4435)
- [zstd issue #3134](https://github.com/facebook/zstd/issues/3134)
- [googletest issue #3756](https://github.com/google/googletest/issues/3756)
- [zlib PR #1099](https://github.com/madler/zlib/pull/1099)
- [Arch Linux RISC-V build status tracker](https://archriscv.felixc.at/.status/status.htm)
- [Arch Linux RISC-V extra repo listing](https://archriscv.felixc.at/repo/extra/)
- [Arch Linux official x86_64 bloaty package](https://archlinux.org/packages/extra/x86_64/bloaty/)
- [Debian package tracker (bloaty, 404 - not packaged)](https://tracker.debian.org/pkg/bloaty)
- [Debian package search (bloaty, no results)](https://packages.debian.org/search?keywords=bloaty)
- [Ubuntu package search (bloaty, no results)](https://packages.ubuntu.com/search?keywords=bloaty&suite=noble&searchon=names&section=all)
- [PyPI JSON API (bloaty, 404)](https://pypi.org/pypi/bloaty/json)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Python wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub org](https://github.com/orgs/riseproject-dev/repositories)
- [Homebrew bloaty formula](https://raw.githubusercontent.com/Homebrew/homebrew-core/master/Formula/b/bloaty.rb)
