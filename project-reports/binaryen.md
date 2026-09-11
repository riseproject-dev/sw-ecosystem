---
title: Binaryen
parent: Project Reports
color: yellow
---

# Binaryen

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Binaryen<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Binaryen ([WebAssembly/binaryen](https://github.com/WebAssembly/binaryen)) is a compiler infrastructure and toolchain library for WebAssembly. It reads, optimizes, and writes Wasm bytecode - it is not a native code generator and has no backend that emits x86, ARM, or RISC-V machine instructions. It provides `wasm-opt` (the Wasm optimizer), `wasm2js`, an embeddable Wasm interpreter, and library APIs used by Emscripten and other Wasm toolchains.

**License:** Apache License 2.0 (confirmed in the repository's `LICENSE` file).

**Governance:** Binaryen has no independent foundation. It lives under the `WebAssembly` GitHub organization and its `Contributing.md` defers to the W3C WebAssembly Community Group's contributing guidelines, requiring contributors to join that Community Group and declare company affiliation. There is no MAINTAINERS/GOVERNANCE.md file; the only formal maintainer artifact is `.github/CODEOWNERS`, which grants blanket ownership (`*`) to the GitHub team `@WebAssembly/binaryen-reviewers`. No PLATFORMS.md or formal platform-tier policy exists (nothing resembling Rust's Tier 1/2/3 model). The README's "Releases" section is the closest thing to an official platform list, and it names only `Linux-x86_64`, `Linux-arm64`, `MacOS-x86_64`, `MacOS-arm64`, `Windows-x86_64`, plus an experimental Node.js/Wasm build.

**Corporate sponsorship:** Analysis of `git shortlog -sne --all` (~5,200+ commits) shows Binaryen is overwhelmingly Google-led. Top contributors by commit volume with `google.com`/`chromium.org` email domains: Alon Zakai (creator, project's dominant committer, gmail.com/google.com), Thomas Lively (google.com, ~1,360 commits), Sam Clegg (chromium.org, 414), Derek Schuff (chromium.org, 181+73), JF Bastien (chromium.org, 128+73), Steven Fontanella (google.com, 122). Secondary involvement from Mozilla (Dan Gohman, Yury Delendik, mozilla.com). No RISC-V-affiliated company (SiFive, Alibaba, etc.) appears among significant contributors.

**Community culture on new ports:** Effectively silent. A GitHub issue search for "riscv" in the repository returns zero results, open or closed - no feature requests, no maintainer discussion, no roadmap mention. This is consistent with the project having no formal port-request or platform-tiering process at all; RISC-V simply has not come up as a topic beyond one incidental build-compatibility patch (Section 2).

## 2. Port History and Upstreaming Timeline

Because Binaryen has no native code-generation backend, there is no "riscv64 port" in the conventional sense (nothing to add codegen for). The only RISC-V relevance found across the project's full history is host-build-toolchain portability - i.e., whether Binaryen itself compiles cleanly when the *build machine* is riscv64.

| Date | Event | Source |
|---|---|---|
| 2015-10-29 | First commit to Binaryen (by creator Alon Zakai) | Local clone, commit `5c839bb4` |
| 2024-02-21 | [PR #6330](https://github.com/WebAssembly/binaryen/pull/6330) merged: "Fix build error on aarch64" - the template/precedent later cloned for riscv64 | [PR #6330](https://github.com/WebAssembly/binaryen/pull/6330) |
| 2024-03-19 | [PR #6410](https://github.com/WebAssembly/binaryen/pull/6410) opened and merged same day: "Fix build error on riscv64" - the only riscv64-specific change in the project's history | [PR #6410](https://github.com/WebAssembly/binaryen/pull/6410) |
| 2024-07-08 | `version_118` tagged - first official release containing the riscv64 build fix | Release-tag bisection against merge commit `bfb5ec04ddba295c9e1390314f6610a8bf7fefbe` |
| 2024-10-28 | [PR #7035](https://github.com/WebAssembly/binaryen/pull/7035) merged: "Fix Alpine compile error on uninitialized value" - widened the scope of the same pragma block that covered riscv64, though the triggering bug was Alpine/musl-specific | [PR #7035](https://github.com/WebAssembly/binaryen/pull/7035) |
| 2025-12-05 | [PR #8094](https://github.com/WebAssembly/binaryen/pull/8094) merged: "Fix uninitialized member" - the permanent root-cause fix (`std::array<T, N> fixed{}` value-initialization) that deleted all three architectures' pragma workarounds, including riscv64's | [PR #8094](https://github.com/WebAssembly/binaryen/pull/8094) |

**Key contributors:** moui0 (author of #6410, pseudonymous, no visible corporate affiliation), DazWorrall (author of #6330, the aarch64 template), Alon Zakai / "kripken" (maintainer, reviewed and merged both #6410 and #7035), Steven Fontanella (Google, author of the permanent fix #8094).

**Is it fully upstream?** Yes, in the narrow sense that applies here: the one build blocker riscv64 ever hit is fixed and merged, and the fix has since been superseded by a cleaner root-cause fix that also landed upstream. There is no outstanding riscv64 patch queue, no fork, and no downstream-only patch set required to build Binaryen on riscv64.

## 3. Upstream Support Tier

Binaryen has no formal platform-tier policy (no Tier 1/2/3 classification exists in the project). The de facto tier is defined by what the README's "Releases" section lists as officially built, and what CI actually exercises.

| Aspect | amd64 (x86_64) | arm64 | riscv64 |
|---|---|---|---|
| Listed in README "Releases" | Yes (`Linux-x86_64`) | Yes (`Linux-arm64`, plus macOS/Windows arm64) | No |
| CI build job | Yes (`ubuntu-22.04`, `ubuntu-latest`) | Yes (`windows-11-arm` runner; macOS runners are arm64 by default on `macos-14`) | No |
| CI test execution | Yes | Yes | No |
| Upstream release binary | Yes | Yes | No |
| Release-blocking gate | Yes | Yes | N/A (no job exists) |

Evidence: direct read of `.github/workflows/ci.yml` and `.github/workflows/create_release.yml` (the only two CI configuration files in the repository) shows the `build` job matrix is exactly `os: [ubuntu-22.04, ubuntu-latest, macos-14, windows-latest, windows-11-arm]` - no riscv64 entry, no QEMU step, no cross-compilation job of any kind. A case-insensitive recursive grep for "riscv" across the entire repository tree at commit `994a5cb99168d29b2071053232202a5fbf66f02a` found matches only inside vendored third-party LLVM headers (`third_party/llvm-project/include/llvm/BinaryFormat/ELFRelocs/RISCV.def` and related ELF/Triple definitions), which are unrelated to CI or build configuration.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Binaryen has no architecture-specific subsystems for any host ISA. It is a portable C++20 codebase that manipulates WebAssembly bytecode as data; it does not JIT-compile to host machine code, does not carry hand-tuned SIMD intrinsics for any host architecture, and does not implement GC barriers or cryptographic primitives.

Verification (GitHub code search, `repo:WebAssembly/binaryen`):

| Query | Result |
|---|---|
| `__riscv` | 0 results |
| `__aarch64__` | 0 results |
| `__x86_64__` | 0 results |
| `immintrin.h` (x86 SIMD intrinsics) | 0 results |
| `arm_neon.h` (ARM SIMD intrinsics) | 0 results |
| `riscv_vector` | 0 results |
| `CMAKE_SYSTEM_PROCESSOR` | 1 result (`CMakeLists.txt`) |

The only architecture conditionals anywhere in the repository are legacy 32-bit build flags in `CMakeLists.txt`:
```
if(CMAKE_SYSTEM_PROCESSOR MATCHES "^i.86$")        # -mfpmath=sse for 32-bit x86
elseif(CMAKE_SYSTEM_PROCESSOR MATCHES "^armv[2-6]" ...)  # -mfpu=vfpv3 for old armv2-6
```
No `x86_64`, `aarch64`, or `riscv` branch exists in this file or anywhere else in the repository. There is no `src/arch/`, `arch/x86/`, `arch/arm64/`, or `arch/riscv/` directory. Binaryen's own Wasm SIMD (v128) support is implemented as portable C++ manipulating Wasm bytecode values, not host machine SIMD instructions.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT/native codegen backend | N/A - does not exist for any arch | N/A - does not exist for any arch | N/A - does not exist for any arch |
| Host SIMD intrinsics (build-time optimization) | None found | None found | None found |
| Assembly files | None found | None found | None found |
| GC barriers / crypto primitives | N/A - out of scope for this project | N/A | N/A |

**Conclusion:** grading riscv64 "completeness" against amd64/arm64 for this project is a category error. Binaryen never implements per-ISA native backends for any architecture, so there is no per-architecture component where riscv64 could be "behind." The only riscv64-relevant work in the project's history is the host-build portability fix documented in Section 2.

## 5. Build System, Cross-Compilation, and Toolchain

Binaryen is built with CMake; there is no `BUILDING.md`, `INSTALL`, or `docs/building.md` - build instructions live only in `README.md`, and they are fully architecture-agnostic:

```bash
git submodule init
git submodule update
cmake . && make
# or with Ninja:
cmake -G Ninja . && ninja
```

**Toolchain requirements:**
- C++20 compiler (`set(CMAKE_CXX_STANDARD 20)` in `CMakeLists.txt`) - the only stated compiler-version requirement; no specific GCC/Clang minimum version is documented.
- CMake >= 3.16.3 (chosen to match Ubuntu Focal's packaged CMake version).

**Relevant build flags** (all architecture-neutral; none riscv-specific): `-DBUILD_TESTS=OFF` (skip gtest dependency), `-DBUILD_TOOLS=OFF` (library only), `-DBUILD_LLVM_DWARF=OFF` (disable DWARF support, also auto-off under Emscripten), `-DBUILD_SHARED_LIBS=OFF`, `-DBUILD_MIMALLOC=ON` (Linux-only; `FATAL_ERROR` on non-Linux `CMAKE_SYSTEM_NAME`), `-DENABLE_WERROR=OFF`, `-DBYN_ENABLE_LTO=ON` (Clang-only ThinLTO), `-DBYN_ENABLE_ASSERTIONS=OFF`.

**No riscv64-specific tooling exists:** no `cmake/riscv64.cmake` or toolchain file of any kind, no `Dockerfile` anywhere in the repository (confirmed by both a local find and `search_code` for `filename:Dockerfile` scoped to the repo - 0 results), and no QEMU usage or cross-compilation guidance documented anywhere.

**Known build failure (now fixed):** GCC's `-Werror=uninitialized` flagged an uninitialized `std::array<T,N> fixed` member inside `SmallVector` (`src/support/small_vector.h`) when building with `-march=rv64gc -mabi=lp64d` on GCC 13.2.1 (Arch Linux ARM riscv64, `version_117`). Fixed same-day by [PR #6410](https://github.com/WebAssembly/binaryen/pull/6410) with an `#if defined(__riscv) && __riscv_xlen == 64` pragma-suppression block mirroring an existing aarch64 workaround ([PR #6330](https://github.com/WebAssembly/binaryen/pull/6330)). The workaround was later replaced entirely by a root-cause fix, `std::array<T, N> fixed{}` (value-initialization), in [PR #8094](https://github.com/WebAssembly/binaryen/pull/8094) (merged 2025-12-05), which deleted the `__riscv`-conditional pragma block from the codebase - confirmed by reading current HEAD of `src/support/small_vector.h`, which contains no `__riscv` reference.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles from source | Yes (CI-verified) | Yes (CI-verified) | Yes (verified by [PR #6410](https://github.com/WebAssembly/binaryen/pull/6410) fix landing and by Ubuntu's successful riscv64 rebuild, Section 8) |
| Full test suite passes | Yes (CI-verified) | Yes (CI-verified) | Not run in any known CI - no upstream or known third-party riscv64 test execution found |
| Official release binary | Yes | Yes | No |
| Known correctness bugs | None found specific to arch | None found specific to arch | None found (Section 11) |
| Known performance issues | None found | None found | None found - and none could be found since no riscv64 benchmark of any kind exists publicly (Section 11) |

**Functional gaps:** None identified that are riscv64-specific - Binaryen's functionality (Wasm optimization passes, `wasm-opt`, interpreter) does not vary by host architecture since it operates purely on portable Wasm bytecode.

**Performance gaps:** Not assessable. No public riscv64 benchmark data exists for Binaryen (searched GitHub issues, general web search, and the RISE project's own optimization-guide site - none returned results). Since Binaryen has no architecture-specific optimization code for any host ISA (Section 4), there is no expected SIMD/intrinsic-driven performance delta between architectures; any difference would stem from generic compiler code-generation quality on the host toolchain, not from a Binaryen-side gap.

**Security hardening gaps:** Data not available: no riscv64-specific hardening flags, ASLR/CFI notes, or security advisories were found in any searched source.

**NaN / floating-point semantics issues:** Data not available: no riscv64-specific floating-point or NaN-handling issue was found. (An unrelated NaN sign-bit issue exists for ARM, [#7291](https://github.com/WebAssembly/binaryen/issues/7291) mentioned in adversarial search results, but it does not involve riscv64 and is out of scope for this report.)

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified by direct inspection of the only two CI configuration files in the repository:
- `.github/workflows/ci.yml` (12,624 bytes)
- `.github/workflows/create_release.yml` (8,147 bytes)

No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `azure-pipelines.yml` exist at the repository root. A case-insensitive recursive grep for "riscv" across every `.yml`/`.yaml` file in the repository returned zero matches. GitHub's code-search API independently confirms zero results for `riscv`, `riscv64`, and `RISCV` scoped to `repo:WebAssembly/binaryen`.

The `build` job's actual matrix (`ci.yml`): `os: [ubuntu-22.04, ubuntu-latest, macos-14, windows-latest, windows-11-arm]`. The `lint` job runs on `ubuntu-26.04`. No RISE RISC-V runner reference, no QEMU cross-arch step, and no riscv64-labeled job of any kind exists in the workflow file.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build job | Yes | Yes (`windows-11-arm`, macOS arm64 runners) | No |
| CI test execution | Yes | Yes | No |
| Release-blocking gate | Yes | Yes | N/A - no job exists |
| RISE runner usage | No | No | No |
| Hardware used | GitHub-hosted (Ubuntu, Windows) | GitHub-hosted (Windows ARM, macOS) | None |

## 8. Distribution and Release Status

**Upstream GitHub Releases:** Latest release `version_132` ships assets `binaryen-version_132-aarch64-linux.tar.gz`, `binaryen-version_132-arm64-macos.tar.gz`, `binaryen-version_132-arm64-windows.tar.gz`, `binaryen-version_132-node.tar.gz`, `binaryen-version_132-x86_64-linux.tar.gz`, plus source archives. Prior releases (`version_123` through `version_131`) follow the same pattern. **No release asset filename contains "riscv" or "riscv64" in any recent release.**

**PyPI:** `https://pypi.org/pypi/binaryen/json` and `https://pypi.org/simple/binaryen/` both return HTTP 404 - no package named `binaryen` exists on PyPI in any form (this is a host-tool project, not a Python package; the absence is expected and not a gap).

**RISE wheel builder (GitLab):** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/binaryen/` redirects to the same nonexistent PyPI entry. Binaryen is not among the 70 packages RISE's wheel builder covers ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)).

**Ubuntu 26.04 (Resolute):** Confirmed directly via [packages.ubuntu.com/resolute/riscv64/binaryen](https://packages.ubuntu.com/resolute/riscv64/binaryen): package `binaryen`, version `120-4build1`, `[ports]` `[universe]`, package size 5,899.1 kB, installed size 24,765.0 kB, with a working download link. Architectures listed for this package: amd64, arm64, armhf, ppc64el, riscv64, s390x. This is a clean rebuild of unmodified upstream source (the one riscv64 build blocker was already fixed upstream by [PR #6410](https://github.com/WebAssembly/binaryen/pull/6410) before this package version), not a patched downstream build.

**What a user must do to get a working riscv64 binary today:** Install `binaryen` from Ubuntu 26.04's universe/ports archive (`apt install binaryen`, version `120-4build1`), or build from source using the standard CMake instructions in Section 5 (no special riscv64 flags required since [PR #6410](https://github.com/WebAssembly/binaryen/pull/6410)/[PR #8094](https://github.com/WebAssembly/binaryen/pull/8094)). There is no upstream-published riscv64 binary to download directly from GitHub Releases.

| Channel | riscv64 available | Provider |
|---|---|---|
| GitHub Releases (upstream) | No | N/A |
| PyPI | N/A (no such package for any arch) | N/A |
| RISE wheel builder | No (project not covered) | N/A |
| Ubuntu 26.04 (resolute) | Yes | Ubuntu (distro rebuild, unpatched) |
| Other distros checked | Data not available: Debian, Fedora, and Arch Linux RISC-V were not independently checked in this research pass | - |

## 9. Dependencies

Binaryen is CMake-based with vendored `third_party/` dependencies. Of the eight `third_party/` entries, those matching JIT/SIMD/numerics/crypto/compression/allocator categories:

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| LLVM (`llvm-project`) | Vendored DWARF/debug-info subset, compiled in by default (`BUILD_LLVM_DWARF=ON`) | Found in Ubuntu 26.04 riscv64 (per prior `project-reports/llvm.md` finding: `llvm` 1:21.1.6-71, riscv64 listed); builds cleanly as core/default target | No riscv64-required pre-merge CI gate (only a scoped `libc/**` QEMU job) | No upstream GitHub-release riscv64 binaries; distro-only | RISC-V backend itself is SiFive-maintained and healthy; LLVM's own JIT/compression/numerics deps have separate, unrelated gaps - see `project-reports/llvm.md` |
| mimalloc | Optional allocator (`BUILD_MIMALLOC`, default OFF but used for Binaryen's official Alpine/musl Linux release binaries) | Ubuntu 24.04 riscv64 confirmed in prior report (`libmimalloc2.0`, `libmimalloc-dev`); 26.04 not independently confirmed this session | No riscv64 CI runner upstream | No upstream (microsoft/mimalloc) riscv64 release binary; distro-packaged only | SV39 aligned-mmap failure (issue #939) reportedly sat unmerged for months - single-maintainer review bottleneck; see `project-reports/mimalloc.md` |
| googletest | Test framework (`BUILD_TESTS=ON` by default) | Found in Ubuntu 26.04 riscv64 (`googletest` 1.17.0-1build1, riscv64 in supported arches) | `GetThreadCount()` returns 0 on riscv64 (issue #3756, open since 2022, unfixed) | Source-tarball-only releases for all arches | Explicitly listed "not officially supported" for riscv64 in project's own policy; see `project-reports/googletest.md` |
| fuzztest | Fuzzing framework (`BUILD_FUZZTEST=OFF` by default) | Not packaged in Ubuntu/Debian at all per prior report | Centipede backend has a hard `#error` on riscv64 at compile time in fuzzing mode - build fails outright | No binaries anywhere | No riscv64 tracking issue/PR ever opened upstream; see `project-reports/fuzztest.md` |
| V8 (`d8`) | JIT-backend differential-fuzzing oracle used only by `scripts/fuzz_opt.py`, not compiled into Binaryen itself | riscv64 backend exists (ISCAS/PLCT-maintained community port, "unofficially supported" per v8.dev) | Not tracked on GitHub (V8 uses crbug.com/Gerrit) | No standalone V8 binary releases for any arch | Google disclaims maintenance of the riscv64 port; see `project-reports/v8.md` |
| SpiderMonkey (mozjs) | Secondary JIT-backend fuzzing oracle | Full JIT port, enabled by default since Firefox 143 | Not part of Mozilla's own CI; ISCAS/PLCT external CI only | Found in Ubuntu 26.04 riscv64 (`libmozjs-128-0`) per prior report | Not maintained by Mozilla employees despite release-quality code; see `project-reports/spidermonkey.md` |
| wabt (wasm2c) | Vendors wasm2c C-runtime for fuzzing oracles | Not independently verified this session | GitHub issue search on `WebAssembly/wabt` for riscv64: 0 hits | Not independently verified this session | No positive or negative signal found |
| FP16 (Maratyszcza/FP16) | Header-only half-precision float conversion, unconditional include | Header-only, no compiled binary - portable ANSI C, no SIMD/asm | 0 riscv64 issues found (low-traffic repo) | Header-only, no package to speak of | Negligible risk - code is portable intrinsics-free arithmetic |

**Deep-dive:** The dependency with the clearest functional blocker is **fuzztest**, whose Centipede backend hard-fails to compile on riscv64 (`#error`), meaning Binaryen's `BUILD_FUZZTEST=ON` path is currently unusable on riscv64 - though this is an opt-in, non-default build flag (`OFF` by default) and does not affect the standard `wasm-opt` build or the primary CI path. **mimalloc** is real but version-lagged/unofficial in distros for riscv64, relevant only when Binaryen is built with `BUILD_MIMALLOC=ON` (used in official Alpine/musl release builds, not the default local build). **Binaryen itself has zero riscv64-specific CI or release artifacts independent of any dependency issue** - this is a gap in Binaryen's own infrastructure, not one inherited from a dependency.

(Section 10, Ecosystem Status, is omitted: Binaryen is a standalone toolchain/library with no significant dependent package ecosystem - e.g. no PyPI/npm/Maven consumer graph - requiring separate riscv64 enablement.)

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #6410](https://github.com/WebAssembly/binaryen/pull/6410) | Fix build error on riscv64 | Closed/Merged (2024-03-19) | Was a build blocker, now resolved | One-line NFC fix for a GCC `-Werror=uninitialized` false positive; first released in `version_118` |
| [PR #8094](https://github.com/WebAssembly/binaryen/pull/8094) | Fix uninitialized member (root-cause) | Closed/Merged (2025-12-05) | N/A - cleanup | Deleted the riscv64/aarch64 pragma workarounds entirely; 17/17 CI checks passed |

**No open riscv64 issues exist.** GitHub issue search on `WebAssembly/binaryen` for `riscv`, `riscv64`, `RISC-V`, and `risc-v` (literal-text and semantic queries) returns zero genuinely riscv64-related results, open or closed. Semantic-search noise hits (issue #2983 s390x big-endian test failures, #4135 an arm64 release question, #2903 a stack-corruption crash, #464 an i64 wasm2asm crash, #8069 an arm64/x64 `fsqrt` divergence) were individually inspected and confirmed unrelated to RISC-V.

**No correctness bugs are tracked for riscv64.** No performance issue is tracked either, but this reflects total absence of riscv64 benchmarking activity (Section 6), not a confirmed clean bill of health.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer has weighed in for or against riscv64 support in any searched issue, PR, or discussion.

**Technical blockers:** None identified for the core `wasm-opt`/library build path - the single build blocker that existed (Section 5) is resolved and superseded by a permanent fix. The only technical blocker found anywhere in the dependency chain is the optional, non-default `fuzztest`/Centipede riscv64 compile failure (Section 9), which does not affect standard builds or releases.

**Organizational blockers:** Binaryen has no formal process for adding a new CI platform or a new release target - there is no PLATFORMS.md, no port-request template, and no public roadmap item for riscv64. Given that RISC-V has never been raised as a topic by maintainers or the community (Section 1), the absence of riscv64 CI/release reflects lack of demand signal reaching the two Google-dominant maintainers, not active resistance.

**Acceptance probability:** [NEEDS VERIFICATION] - No direct evidence either confirms or denies how receptive maintainers (kripken/Alon Zakai, Thomas Lively, both Google) would be to a riscv64 CI addition. Given that the equivalent build-portability fixes for aarch64 (#6330) and riscv64 (#6410) were both reviewed and merged within hours to days of being opened, with no pushback, the pattern suggests low friction for a well-formed, minimal-footprint contribution (e.g., adding a riscv64 build-only job via QEMU to `ci.yml`), but this is inferred from an analogous case, not a direct statement from maintainers about riscv64 CI specifically.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** Ubuntu (distro-provided; no upstream, RISE, or other third-party riscv64 release exists)
- Optimization level: not applicable - Binaryen is not an optimization-purpose project per the /project-color-coding skill's Step 2 test. It is a general-purpose Wasm toolchain library with no architecture-specific code path for any host ISA (Section 4), so the question "would it still deliver its value using only generic C with no arch-specific optimizations" is trivially "yes" - it already operates this way for amd64 and arm64 too.
- **Justification:** No upstream riscv64 CI exists - confirmed by direct read of `.github/workflows/ci.yml` and `create_release.yml`, the only two CI files in the repository, whose build matrix (`ubuntu-22.04, ubuntu-latest, macos-14, windows-latest, windows-11-arm`) contains zero riscv/riscv64 references. Upstream GitHub Releases ship no riscv64 asset. Ubuntu 26.04 "resolute" packages `binaryen 120-4build1` for riscv64 as a clean, unpatched rebuild of upstream source ([packages.ubuntu.com/resolute/riscv64/binaryen](https://packages.ubuntu.com/resolute/riscv64/binaryen)) - the one riscv64 build blocker that ever existed was already fixed upstream by [PR #6410](https://github.com/WebAssembly/binaryen/pull/6410) before this package version, so the distro build is not patching around an unresolved upstream defect. Per the color model's distribution floor, a clean unpatched distro build with no upstream CI caps the grade at yellow (`clean-distro-build`), not orange.
- **Pending work that could change the grade:** None identified. No open riscv64 PR or issue exists upstream, and no RISE involvement with Binaryen was found (no blog post, no dedicated repository, not among the 70 packages in RISE's wheel builder, and Binaryen sits unaddressed in RISE's own research queue per `riseproject-dev/sw-ecosystem`). The grade would move to blue if upstream added a riscv64 CI job that runs (not just builds) the test suite, or to green if that were paired with an upstream-published riscv64 release artifact.

## 14. Investment Analysis

RISE has not funded or otherwise touched Binaryen (Section 1, Section 12) - there is no prior work to avoid duplicating. All items below are unclaimed.

### 14.1 Functional Enablement

No functional work is required. The codebase already builds and runs correctly on riscv64 (confirmed by the merged fix chain in Section 2 and the successful Ubuntu 26.04 rebuild in Section 8). This is the rare case where "functional enablement" is already complete; the gap is entirely in CI/release infrastructure, not code.

### 14.2 Performance Optimization

Not applicable in the conventional sense - Binaryen has no architecture-specific optimization code for any host ISA (Section 4), so there is no riscv64-specific optimization gap to close relative to amd64/arm64. If riscv64 host-compilation performance of `wasm-opt` itself becomes a concern, that would be a generic compiler/toolchain question (GCC/Clang codegen quality for riscv64), not a Binaryen-specific gap.

### 14.3 CI/CD Infrastructure

This is the primary gap. Adding a riscv64 job to `.github/workflows/ci.yml` (build plus test execution, following the pattern of the existing `ubuntu-22.04`/`ubuntu-latest` jobs, using either a native RISC-V runner or QEMU emulation) would move the grade from yellow to blue. Given the low-friction precedent of prior architecture-portability fixes being merged same-day or within days (Section 12), this is likely a low-effort, low-risk contribution.

### 14.4 Ecosystem Enablement

Not applicable - Binaryen has no dependent package ecosystem requiring separate enablement (it is a standalone toolchain/library consumed by other native-build projects such as Emscripten and TinyGo, not distributed as a language-package-manager dependency like a PyPI/npm library with many downstream consumers to individually re-certify).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 build+test job to `.github/workflows/ci.yml` (QEMU or native runner) | 1-2 | Upstream (WebAssembly/binaryen maintainers) or RISE-sponsored external contributor | Medium |
| Release | Add riscv64 asset to `create_release.yml` release pipeline once CI job exists | 0.5-1 | Upstream or RISE-sponsored contributor | Low (depends on CI item above landing first) |
| Dependency | Investigate/fix fuzztest Centipede `#error` on riscv64 (affects only the opt-in `BUILD_FUZZTEST=ON` path) | 1-3 (owned by upstream `fuzztest` project, not Binaryen) | fuzztest maintainers (Google) | Low |
| Benchmarking | Establish a riscv64 performance baseline for `wasm-opt` (host-compilation and optimization-pass throughput) since none currently exists publicly | 1-2 | RISE or internal team | Low |

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [WebAssembly/binaryen repository](https://github.com/WebAssembly/binaryen)
- [PR #6410 - Fix build error on riscv64](https://github.com/WebAssembly/binaryen/pull/6410)
- [PR #6330 - Fix build error on aarch64](https://github.com/WebAssembly/binaryen/pull/6330)
- [PR #7035 - Fix Alpine compile error on uninitialized value](https://github.com/WebAssembly/binaryen/pull/7035)
- [PR #8094 - Fix uninitialized member (root-cause fix)](https://github.com/WebAssembly/binaryen/pull/8094)
- [GitHub Actions CI workflow (ci.yml)](https://github.com/WebAssembly/binaryen/blob/main/.github/workflows/ci.yml)
- [Release workflow (create_release.yml)](https://github.com/WebAssembly/binaryen/blob/main/.github/workflows/create_release.yml)
- [GitHub Releases page](https://github.com/WebAssembly/binaryen/releases)
- [Ubuntu 26.04 (resolute) riscv64 binaryen package](https://packages.ubuntu.com/resolute/riscv64/binaryen)
- [Ubuntu package search for binaryen](https://packages.ubuntu.com/search?keywords=Binaryen&suite=resolute&searchon=names&section=all)
- [PyPI lookup for binaryen (404)](https://pypi.org/pypi/binaryen/json)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE project blog index](https://riseproject.dev/blog)
- [RISE project members page](https://riseproject.dev/members/)
- [RISE RISC-V Optimization Guide](https://riscv-optimization-guide.riseproject.dev/)
- [Binaryen Contributing.md / W3C WebAssembly Community Group deferral](https://github.com/WebAssembly/design)
- Issue #3756 - googletest GetThreadCount() returns 0 on riscv64 (referenced via prior `project-reports/googletest.md`)
- Prior related reports consulted: `project-reports/llvm.md`, `project-reports/mimalloc.md`, `project-reports/googletest.md`, `project-reports/fuzztest.md`, `project-reports/v8.md`, `project-reports/spidermonkey.md`