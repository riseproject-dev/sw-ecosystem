---
title: Wabt
parent: Project Reports
color: orange
---

# Wabt

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Wabt<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Wabt (the WebAssembly Binary Toolkit) is a suite of tools for WebAssembly, including `wat2wasm` (assembler), `wasm2wat` (disassembler), `wasm-objdump`, `wasm-interp` (interpreter), `wasm-validate`, and `wasm2c` (WASM-to-portable-C translator). It is written in C++20 and lives under the `WebAssembly` GitHub organization, which also hosts the WebAssembly spec repositories. It carries no separate foundation charter, CLA-backed legal entity, or formal governance document beyond a generic pointer to the WebAssembly `design` repo's contributing guidelines. License is Apache 2.0.

There is no `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file in the repository. `SECURITY.md` states explicitly: "WABT is maintained by volunteers on a reasonable-effort basis" - the clearest governance signal available: informal, volunteer-driven, no SLA, no formal platform/architecture tier policy of any kind (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/`).

By commit volume (2620 total commits in full history), the project is dominated by Google/Chromium-affiliated maintainers: Ben Smith (binji@chromium.org, 1011+371 commits, de facto lead), Sam Clegg (sbc@chromium.org, 384), Derek Schuff (dschuff@chromium.org, 29), Ng Zhi An (zhin@chromium.org, 16), JF Bastien (jfb@chromium.org, 11). Secondary corporate contributors: Samsung (Zoltan Herczeg, 11 commits), Igalia (Asumu Takikawa, 14 commits). Academic contribution from Stanford (Keith Winstein, 105 commits).

Given the volunteer/"reasonable-effort" governance and the complete absence of a platform-tier policy, the project's posture toward new architecture support is informal and contribution-driven: patches are accepted opportunistically through ordinary PR review by the largely Google-affiliated maintainers, not through any structured RFC, tiering, or sponsorship process.

Wabt has no JIT backend and no per-architecture code generator: `wasm2c` emits portable C, and the interpreter (`wasm-interp`) is a portable C++ bytecode interpreter. This structurally means there is no architecture-specific "port" comparable to a JIT compiler's backend.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2026-08-16 | First and only riscv-related commit: `6feb2ff904fdf489cb8ed8477adc996e27d187a0` by Shravan Narayan, "wasm2c: Optimize force_read performance" - adds `#elif defined(__riscv) && defined(__riscv_flen) && (__riscv_flen >= 32)` branch to a multi-architecture inline-asm register-constraint macro in `src/template/wasm2c.declarations.c` | Local clone, commit `e177dbe` (see PR/commit table below) |
| 2026-08-21 | Follow-up commit `c886b0a742903a51f481a0c6e96d163f09d4caf0`, same author, "wasm2c: missing guard force_read error with escape hatch," touching the equivalent SIMD template | Local clone |
| 2023-07-30 | [PR #2274](https://github.com/WebAssembly/wabt/pull/2274) merged (MIPS clang fix), includes a cross-architecture comparison table listing riscv32/riscv64 as already working with both gcc/clang constraints - no fix needed for RISC-V | [PR #2274](https://github.com/WebAssembly/wabt/pull/2274) |

Key contributor: Shravan Narayan (shravanrn@gmail.com, personal email, no corporate affiliation identified in commit metadata) - author of both riscv-touching commits, both of which are general multi-architecture portability patches, not a dedicated RISC-V port effort.

**Is it fully upstream?** There is no separate "RISC-V port" to be upstream or not - the two riscv preprocessor branches described above are already merged to `main` and included in tagged releases (verified: commit `70b1c9d2652bae15785ceb449fda44fe31bbe0d5`, the PR #2274 merge, is included in tag 1.0.36). No outstanding riscv64-specific PR exists, open or closed.

## 3. Upstream Support Tier

No formal tier policy exists in the repository (no `PLATFORMS.md`/`SUPPORT.md`/`docs/platforms/`, confirmed by direct search of the tree). Support tiers must be inferred from CI and release evidence.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI build+test | Yes (`ubuntu-latest`, `macos-latest`, `windows-latest`) | Yes (`ubuntu-22.04-arm`, `macos-14`) | No |
| Release-blocking CI | Yes | Yes | N/A - no job exists |
| Official upstream binary | Yes (`wabt-1.0.41-linux-x64.tar.gz`) | Yes (`wabt-1.0.41-linux-arm64.tar.gz`, `wabt-1.0.41-macos-arm64.tar.gz`) | No |
| Distro package | Yes | Yes | Yes (Debian/Ubuntu only; absent on Arch riscv64) |

Source: [WebAssembly/wabt releases](https://github.com/WebAssembly/wabt/releases), `.github/workflows/build.yml` and `build_release.yml` read directly from local clone.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Wabt has no architecture-specific backend, JIT, or codegen subsystem of any kind. The only "architecture-specific" code in the entire project is two one-line preprocessor branches used for compiler-portability, not optimization:

**`src/template/wasm2c.declarations.c:207`** (part of `FORCE_READ_FLOAT_CONSTRAINT`, a macro that forces a float read at a specific point via inline asm so the compiler cannot eliminate an out-of-bounds-trap-adjacent load under guard-page memory checking):
```c
#elif defined(__riscv) && defined(__riscv_flen) && (__riscv_flen >= 32)
#define FORCE_READ_FLOAT_CONSTRAINT "f"
```
ISA extension checked: base RISC-V "F" (single-precision float ABI capability) via `__riscv_flen`. No RVV, no Zba/Zbb.

**`src/template/wasm2c_simd.declarations.c:9`** (analogous macro for `--enable-simd` builds, `SIMD_FORCE_READ`):
```c
#elif defined(__riscv)
#define SIMD_FORCE_READ(var) __asm__("" ::"vr"(var));
```
This forces a 128-bit SIMD value into a RISC-V vector register class (`"vr"` constraint) purely to block dead-code elimination of an associated bounds check. It is not RVV intrinsic code - no `vfloat32m1_t`, `vsetvl`, or `<riscv_vector.h>` usage exists anywhere in the repository (confirmed by zero-hit searches for `vfloat32m1_t` and `rvv`).

All actual SIMD math (loads, stores, lane ops, shuffles, extmul, narrow) in `wasm2c_simd.declarations.c` is delegated wholesale to `simde_wasm_*` calls from the external `third_party/simde` submodule (SIMD Everywhere), identically for every consuming architecture. Wabt does not implement per-architecture SIMD itself for any target, so riscv64 is not "behind" amd64 or arm64 in this respect - none of the three have wabt-authored SIMD code.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT/codegen backend | none (n/a - wabt has none) | none | none |
| Force-read register constraint (portability shim) | scalar, 1 line, `"x"` | scalar, 1 line, `"w"` | scalar, 1 line, `"f"`/`"vr"` |
| SIMD math implementation | external simde | external simde | external simde |
| Crypto (SHA-256 for type-signature hashing) | OpenSSL or PicoSHA2 fallback | OpenSSL or PicoSHA2 fallback | OpenSSL or PicoSHA2 fallback (arch-agnostic C) |

Source: local clone `/home/user/webassembly/wabt`, commit `e177dbe`, files `src/template/wasm2c.declarations.c`, `src/template/wasm2c_simd.declarations.c`, and `.gitmodules`.

## 5. Build System, Cross-Compilation, and Toolchain

No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists in the repository - only `README.md` with generic, architecture-agnostic build instructions.

Toolchain requirements:
- `cmake_minimum_required(VERSION 3.16)` (`CMakeLists.txt:17`)
- `set(CMAKE_CXX_STANDARD 20)`, `CMAKE_CXX_STANDARD_REQUIRED ON` (`CMakeLists.txt:22-23`) - requires a C++20-capable compiler (in practice GCC >= 10 or Clang >= 10); no version check is enforced beyond the language-standard flag itself.

The only cross-compilation precedent in the entire project is `scripts/TC-s390x.cmake`, a CMake toolchain file used by the (currently disabled) `build-cross` CI job. No `scripts/TC-riscv64.cmake` exists. QEMU usage in this project is limited to running cross-built test binaries under emulation (`docker/setup-qemu-action`, `QEMU_LD_PREFIX`) for the s390x job - not used for compilation itself, and not present for riscv64 at all.

A DIY riscv64 cross-build would require authoring an equivalent toolchain file and running, e.g.:
```
cmake -S . -B out -G Ninja \
  -DCMAKE_C_COMPILER=riscv64-linux-gnu-gcc \
  -DCMAKE_CXX_COMPILER=riscv64-linux-gnu-g++ \
  -DCMAKE_SYSTEM_NAME=Linux \
  -DCMAKE_SYSTEM_PROCESSOR=riscv64 \
  -DBUILD_TESTS=OFF -DWERROR=OFF
cmake --build out
```
This is unverified/DIY - no official riscv64 CI, Docker image, or documentation backs it, and even the one cross-arch precedent (s390x) is currently disabled in CI due to an unrelated test failure ([issue #2655](https://github.com/WebAssembly/wabt/issues/2655)).

No known riscv64 build failures were found in issue search (zero issues mention riscv/riscv64 at all).

Source: local clone, `CMakeLists.txt`, `scripts/TC-s390x.cmake`, `.github/workflows/build.yml`.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| wat2wasm / wasm2wat / wasm-objdump / wasm-validate (text/binary tools) | Full, CI-tested | Full, CI-tested | Untested upstream; presumed functional (portable C++, no arch-gated logic) |
| wasm-interp (interpreter) | Full, CI-tested | Full, CI-tested | Untested upstream |
| wasm2c (C code generation) | Full, CI-tested, incl. SIMD/guard-page modes | Full, CI-tested | Untested upstream; the two riscv preprocessor branches exist specifically to support this mode correctly, but no CI verifies it |
| WASI support (`WITH_WASI`, optional) | Tested (Docker leg) | Not confirmed in CI matrix per workflow read | Untested; depends on `uvwasi`/`libuv`, which have no riscv64-specific issues on file but also no confirmed riscv64 testing |

No functional gaps ("cannot do X at all") were identified - wabt has no architecture-specific feature flags. The gap is entirely one of **verification**, not functionality: nothing confirms via upstream CI that riscv64 output is correct.

Performance gap: not assessable. No riscv64 benchmark data exists for wabt or wasm2c anywhere searched (GitHub, general web, RISE blog). The one concrete wasm2c performance data point found is architecture-agnostic (x86 only, from a third-party blog, not RISE): wasm2c's slowdown vs. native was 1.89x (2024) to 1.71x (2026) per [Frank Denis's WebAssembly runtimes benchmark series](https://00f.net/2026/06/23/webassembly-runtimes-2026/); this source does not mention RISC-V.

Security hardening gaps: not assessable from available data - no riscv64-specific ASAN/UBSAN/sanitizer CI runs exist (the `sanitize` job in `build.yml` runs on `ubuntu-24.04` only).

NaN / floating-point semantics: this is a documented cross-architecture risk class in wabt generally (SIMD NaN bit-pattern divergence has caused real bugs on mips64el, ARM, and POWER8 - see Section 11), but **no riscv64-specific NaN issue has ever been filed or tested**, so whether wabt's SIMD NaN handling is correct on riscv64 is unknown, not confirmed-good.

## 7. CI/CD Infrastructure

**Verdict: no riscv64 CI exists in WebAssembly/wabt.** Confirmed by reading all four workflow files directly (`.github/workflows/build.yml`, `build_release.yml`, `build_source_release.yml`, `wabt-cifuzz.yml`) and grepping them case-insensitively for `riscv`, `risc-v`, `rv64`, `rv32` - zero matches in any file.

| File | Job | Trigger | Runner |
|---|---|---|---|
| build.yml | lint | push(main), pull_request, tag create | ubuntu-latest |
| build.yml | build | same | matrix: ubuntu-latest, macos-latest, windows-latest |
| build.yml | emscripten | same | ubuntu-latest (Docker) |
| build.yml | wasi | same | ubuntu-latest (Docker, wasi-sdk) |
| build.yml | sanitize | same | ubuntu-24.04 |
| build.yml | build-wasm2c-memchecked | same | ubuntu-latest |
| build.yml | build-min-cmake | same | ubuntu-latest |
| build.yml | build-rlbox | same | ubuntu-latest |
| build.yml | build-cross | same | ubuntu-latest, `matrix.arch: [s390x]`, **disabled** (`if: ${{ false }}`), blocked on [#2655](https://github.com/WebAssembly/wabt/issues/2655) |
| build_release.yml | build | release created | ubuntu-22.04 (x86_64), ubuntu-22.04-arm (aarch64), macos-14 (aarch64), windows-latest (x86_64) |
| build_source_release.yml | build | release created | ubuntu-latest |
| wabt-cifuzz.yml | Fuzzing | pull_request | ubuntu-latest (OSS-Fuzz) |

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes | Yes | No |
| CI test | Yes | Yes | No |
| Release CI | Yes | Yes | No |
| RISE runner usage | No | No | No - no reference to `riseproject-dev` or RISE runner labels anywhere in any workflow |
| Native vs QEMU | Native | Native (GitHub-hosted arm64 runners) | N/A - no job |

There is no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` anywhere in the repository - GitHub Actions is the sole CI system. No hardware of any kind (native or QEMU-emulated) runs riscv64 jobs for this project.

Source: local clone `.github/workflows/*.yml`, direct file reads.

## 8. Distribution and Release Status

No official upstream riscv64 binary exists. [GitHub Releases](https://github.com/WebAssembly/wabt/releases) (checked 1.0.41 down to 1.0.37) publish only: `wabt-<ver>-linux-arm64.tar.gz`, `wabt-<ver>-linux-x64.tar.gz`, `wabt-<ver>-macos-arm64.tar.gz`, `wabt-<ver>-wasi.tar.gz`, `wabt-<ver>-windows-x64.tar.gz`, plus a source tarball. No filename contains "riscv" in any recent release.

**PyPI**: a package named `wabt` exists ([pypi.org/pypi/wabt/json](https://pypi.org/pypi/wabt/json)) but this is a separate, unofficial, stale pure-Python wrapper (`py3-none-any` wheel, last version 0.1.2), not the upstream WebAssembly/wabt project, and not architecture-specific at all.

**Debian unstable**: riscv64 `.deb` package confirmed present ([packages.debian.org/unstable/wabt](https://packages.debian.org/unstable/wabt)), version `1.0.41+dfsg+~cs1.0.39-2`, alongside alpha, amd64, arm64, armhf, hppa, i386, ia64, loong64, m68k, ppc64, ppc64el, s390x, sh4, sparc64, x32.

**Ubuntu 26.04 "resolute"**: riscv64 package confirmed present ([packages.ubuntu.com/resolute/wabt](https://packages.ubuntu.com/resolute/wabt)), inherited from Debian.

**Arch Linux RISC-V port**: no `wabt` package exists at all ([archriscv.felixc.at/?q=wabt](https://archriscv.felixc.at/?q=wabt) returns zero results).

**Patch status of the Debian/Ubuntu riscv64 build**: not independently verified against the `debian/patches/` directory in this research pass - the version string (`+dfsg+~cs1.0.39-2`) reflects a standard DFSG repack and component substitution, not confirmed evidence of riscv64-specific patching. Per the color-coding methodology, unknown patch status is treated conservatively (does not qualify for the "clean unpatched build" yellow floor). [NEEDS VERIFICATION: whether Debian's wabt packaging carries riscv64-specific patches.]

**What a user must do today to get a working riscv64 wabt binary**: install via `apt` on Debian unstable or Ubuntu 26.04 (resolute). There is no upstream-provided binary; using wabt on any other riscv64 Linux distribution (including Arch) requires building from source with a self-authored cross-toolchain configuration (see Section 5), which is entirely unverified by any CI.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| simde (simd-everywhere/simde) | Vendored submodule; emulates WASM SIMD128 for wasm2c-generated C on any host ISA | Header-only, builds on any C compiler; not independently riscv64-gated | Open upstream issues: [#1352](https://github.com/simd-everywhere/simde/issues/1352) "Remove references to `__riscv_zvlsseg`", [#1087](https://github.com/simd-everywhere/simde/issues/1087) "add optimized implementations using RISC-V vector intrinsics" (unfinished RVV path; generic scalar fallback works) | Not a distro-packaged dependency (header-only) | RVV-optimized path incomplete/in progress upstream; scalar fallback functional |
| OpenSSL | Optional crypto backend for SHA-256 hashing of generated type signatures; falls back to PicoSHA2 if absent | Data not available: not directly queried in this pass (see project-reports/openssl.md if present in this corpus) | Active riscv64 CI churn reported upstream (open issues re: flaky riscv64 test runner, incomplete intrinsics, extension-detection bug on musl) [NEEDS VERIFICATION - see openssl-specific report] | N/A here | Active riscv64 work upstream but not issue-free |
| PicoSHA2 (okdshin/PicoSHA2) | Header-only fallback SHA-256, always vendored | Portable C++, no arch-specific code | No riscv64 issues found | Vendored header, not a distro package | None found |
| libuv (via uvwasi) | Only pulled in when `WITH_WASI=ON` (default OFF) | Data not available: no riscv64-specific libuv issues found (closest are ppc64le and Darwin ARM64 reports) | Data not available | Data not available | Very low non-x86/arm64 issue volume overall - untested rather than known-broken |
| uvwasi (nodejs/uvwasi) | WASI syscall shim, thin wrapper over libuv | Not separately assessed | Not separately assessed | Not separately assessed | None known |
| googletest | Test-only dependency (`BUILD_TESTS=ON` default); not shipped in wabt binaries | Does not affect shipped riscv64 binaries | N/A to wabt's own riscv64 status | N/A | Separate report, if present in corpus |
| ply (dabeaz/ply) | Build-time Python code generator (parser/lexer tables) | Architecture-independent (pure Python) | N/A | N/A | Not a riscv64 concern |

Note: `project-graph` MCP connectivity failed repeatedly during this research (`CONNECTION_CLOSED`), so no SPARQL-based Ubuntu package-graph cross-check could be run for these dependencies beyond the direct package-page fetches already reported in Section 8. This is a tooling gap, not a confirmed absence of packages.

Wabt's dependency graph is otherwise small: no JIT backend, no numerics library (BLAS/Eigen-class), no compression library, and no dedicated memory allocator dependency exists.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2543](https://github.com/WebAssembly/wabt/issues/2543) | mips test/interp/simd-binary.txt simd-unary.txt test failures | Open (2025-02-17) | Not RISC-V | Mentions riscv64 only as a control point ("tests pass on other architectures... even armel, s390x, riscv64"); no riscv64 bug |
| [#2655](https://github.com/WebAssembly/wabt/issues/2655) | test/wasm2c/spec/memory64/memory_copy.txt failing on s390x | Open | Not RISC-V | Blocks the only cross-arch CI job (s390x); no riscv64 equivalent job to be blocked |
| [#2240](https://github.com/WebAssembly/wabt/issues/2240) | wasm2c/spec/simd_address.txt fails on non-x86 | Open | Not confirmed RISC-V-specific | Generic non-x86 SIMD-address issue; riscv64 status within this issue not stated |
| [#2118](https://github.com/WebAssembly/wabt/issues/2118) | relaxed_madd_nmadd.txt fails on ARM64/Power8/s390x | Closed 2024-09-13 | Not RISC-V | Zero RISC-V mentions in body/comments |
| [#1365](https://github.com/WebAssembly/wabt/issues/1365) | skip-stack-guard-page.txt fails on 32-bit ARM | Open | Not RISC-V | No RISC-V content |
| [#1063](https://github.com/WebAssembly/wabt/issues/1063) | 247 test failures on big-endian arches (ppc64, s390x) | Closed 2020-12-07 | Not RISC-V (little-endian, out of scope) | No RISC-V content |

**Correctness bugs, riscv64-specific: none found.** Zero issues in WebAssembly/wabt mention riscv or riscv64 at all as a subject of a bug report (confirmed by literal-text repo-scoped search returning `total_count: 0`). This is a coverage gap, not a clean bill of health: the project's test-failure pattern on other non-x86 architectures (NaN bit-pattern divergence in SIMD tests, on mips64el/ARM/POWER8) suggests riscv64 simply has not been exercised by anyone who would file a bug, rather than confirmed passing.

## 12. Objections and Upstream Blockers

No stated objections to riscv64 support were found - there is no record of any maintainer discussion, RFC, or issue expressing reluctance about RISC-V. No technical blocker was identified either: the codebase's only riscv-relevant lines (Section 4) already compile correctly per the PR #2274 compatibility table, which shows riscv32/riscv64 fully supported under both gcc and clang for the relevant inline-asm constraints ([PR #2274](https://github.com/WebAssembly/wabt/pull/2274)).

Organizational blocker: the project is volunteer-maintained on a "reasonable-effort basis" with no formal architecture-tier process (Section 1), meaning any riscv64 CI addition depends entirely on someone (community contributor or corporate sponsor) submitting and championing a PR through ordinary review - there is no committed roadmap slot for it.

Acceptance probability: assessed as high if a well-formed PR were submitted, based on precedent - the existing s390x cross-CI job (`build-cross`) demonstrates the maintainers already accept a QEMU-based cross-architecture CI pattern in principle, and the two existing riscv preprocessor branches were merged without objection. The primary practical obstacle is that no one has done the work, not that the work would be resisted.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro (Debian/Ubuntu; not upstream)
- **Optimization gap:** N/A - wabt is not an optimization-purpose project (it is a portable text/binary WebAssembly toolkit whose value is not defined by architecture-specific performance tuning; its wasm2c-generated code is portable C by design, and SIMD execution is delegated wholesale to the external simde library for every architecture equally).
- **Justification:** Upstream WebAssembly/wabt has zero riscv64 CI - confirmed by reading all four GitHub Actions workflow files directly, with a case-insensitive grep for "riscv"/"risc-v"/"rv64"/"rv32" across all of them returning no matches ([`.github/workflows/build.yml`](https://github.com/WebAssembly/wabt/blob/main/.github/workflows/build.yml)). The sole cross-architecture CI job in the entire project targets s390x only and is currently disabled ([issue #2655](https://github.com/WebAssembly/wabt/issues/2655)). No upstream GitHub Release publishes a riscv64 binary ([releases page](https://github.com/WebAssembly/wabt/releases)). Per the distribution floor rule, riscv64 availability rests entirely on Debian/Ubuntu shipping a riscv64 `.deb` built from wabt's source ([packages.debian.org/unstable/wabt](https://packages.debian.org/unstable/wabt), [packages.ubuntu.com/resolute/wabt](https://packages.ubuntu.com/resolute/wabt)); since the patch status of that packaging was not independently verified in this research pass, the conservative "patched/unknown" floor applies, yielding orange rather than yellow.
- **Pending work that could change the grade:** none identified. No open PR proposes riscv64 CI for wabt, no RISE involvement exists for this project (not listed as a RISE member/project, no RISE blog posts, no RISE wheel-builder or riseproject-dev repo mention), and no tracking issue exists to monitor. Verifying the Debian packaging patch status ([NEEDS VERIFICATION], Section 8) could confirm or rule out an upgrade to yellow (`clean-distro-build`) without requiring any new engineering work.

## 14. Investment Analysis

RISE has not funded or performed any work on this project - confirmed by the absence of any RISE blog post, RISE member/project listing, RISE wheel-builder inclusion, or riseproject-dev repository referencing wabt (Sections 1, 12). All investment items below are therefore fully unaddressed and available for sizing.

### 14.1 Functional Enablement

The codebase itself requires effectively no functional changes: the only riscv-relevant lines already work correctly (confirmed by [PR #2274](https://github.com/WebAssembly/wabt/pull/2274)'s gcc/clang constraint compatibility table). The functional-enablement task is verification, not porting: author a `scripts/TC-riscv64.cmake` toolchain file (modeled on the existing `scripts/TC-s390x.cmake`) and confirm the full test suite (`run-tests`, `run-unittests`) passes under cross-compilation plus QEMU, or natively on riscv64 hardware/CI runner.

### 14.2 Performance Optimization

Not applicable as a distinct work item - wabt is not an optimization-purpose project and has no per-architecture hot paths of its own (SIMD execution is delegated to simde for all architectures uniformly). Any performance gap traces to simde's own RVV coverage, which is a separate upstream project with open issues ([simde #1087](https://github.com/simd-everywhere/simde/issues/1087)) outside wabt's control.

### 14.3 CI/CD Infrastructure

The concrete, well-scoped work item: add a riscv64 leg to `build.yml`, following the existing `build-cross` (s390x) job pattern - QEMU setup via `docker/setup-qemu-action`, a `g++-riscv64-linux-gnu` cross-compiler install, a new `scripts/TC-riscv64.cmake` toolchain file, and `run-tests`/`run-unittests` execution under `QEMU_LD_PREFIX`. Given the existing s390x job as a working template, this is a small, well-understood task for a contributor already familiar with wabt's build system.

### 14.4 Ecosystem Enablement

Not applicable - wabt has no dependent package ecosystem (it is a standalone toolkit; see Section 10 omission rationale).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Verify Debian/Ubuntu riscv64 packaging is unpatched (check `debian/patches/`); if unpatched, grade upgrades to yellow with zero engineering work | <1 | Any contributor / RISE distro-integration WG | Low |
| Functional | Author `scripts/TC-riscv64.cmake` and run full test suite once (native riscv64 hardware or QEMU) to confirm correctness | 1-2 | Community contributor or RISE-funded engineer | Medium |
| CI/CD | Add riscv64 leg to `build.yml` `build-cross` job (QEMU + cross g++ + toolchain file), enable as release-blocking once green | 1-2 | Community contributor or RISE-funded engineer | Medium |
| CI/CD | Investigate and fix the currently-disabled s390x job (#2655) as a template/precedent-setting exercise before adding riscv64 | 1 | Community contributor | Low (not RISC-V-specific but de-risks the pattern) |
| Performance | None - no wabt-specific optimization surface exists | 0 | N/A | N/A |

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [WebAssembly/wabt repository](https://github.com/WebAssembly/wabt)
- [WebAssembly/wabt releases](https://github.com/WebAssembly/wabt/releases)
- [WebAssembly/wabt build.yml workflow](https://github.com/WebAssembly/wabt/blob/main/.github/workflows/build.yml)
- [Issue #2543 - mips SIMD test failures](https://github.com/WebAssembly/wabt/issues/2543)
- [Issue #2655 - s390x memory_copy.txt failure, blocks build-cross job](https://github.com/WebAssembly/wabt/issues/2655)
- [Issue #2240 - wasm2c SIMD address fails on non-x86](https://github.com/WebAssembly/wabt/issues/2240)
- [Issue #2118 - relaxed-SIMD FMA test failures on ARM64/Power8/s390x](https://github.com/WebAssembly/wabt/issues/2118)
- [Issue #1365 - stack guard page test fails on 32-bit ARM](https://github.com/WebAssembly/wabt/issues/1365)
- [Issue #1043 - SIMD unary test fails on ARM/POWER8](https://github.com/WebAssembly/wabt/issues/1043)
- [Issue #1063 - 247 test failures on big-endian architectures](https://github.com/WebAssembly/wabt/issues/1063)
- [PR #2274 - wasm2c force-read constraint fix for MIPS/clang, includes riscv32/riscv64 compatibility table](https://github.com/WebAssembly/wabt/pull/2274)
- [Debian unstable wabt package (riscv64 confirmed)](https://packages.debian.org/unstable/wabt)
- [Ubuntu 26.04 (resolute) wabt package (riscv64 confirmed)](https://packages.ubuntu.com/resolute/wabt)
- [Arch Linux RISC-V port package search (wabt not found)](https://archriscv.felixc.at/?q=wabt)
- [PyPI wabt package metadata (unofficial pure-Python wrapper)](https://pypi.org/pypi/wabt/json)
- [simde issue #1087 - RISC-V vector intrinsics optimization incomplete](https://github.com/simd-everywhere/simde/issues/1087)
- [simde issue #1352 - remove references to __riscv_zvlsseg](https://github.com/simd-everywhere/simde/issues/1352)
- [Performance of WebAssembly runtimes in 2026 - 00f.net (architecture-agnostic wasm2c benchmark, no RISC-V data)](https://00f.net/2026/06/23/webassembly-runtimes-2026/)
- [RISE Project RISC-V Runners announcement (unrelated to wabt)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [nervosnetwork/wasm-secp256k1-test - third-party usage of wasm2c targeting riscv64, no performance data](https://github.com/nervosnetwork/wasm-secp256k1-test)
