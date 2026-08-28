---
title: shaderc
parent: Project Reports
---

# shaderc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for shaderc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

shaderc is a collection of tools and libraries for GLSL/HLSL shader compilation to SPIR-V, developed and maintained by Google. Its primary components are `glslc` (a command-line compiler with GCC/Clang-like interface) and `libshaderc` (a C API library). It delegates front-end parsing to [glslang](https://github.com/KhronosGroup/glslang) and SPIR-V optimization and validation to [SPIRV-Tools](https://github.com/KhronosGroup/SPIRV-Tools). The output is SPIR-V binary, a portable intermediate representation consumed by GPU drivers implementing Vulkan and other graphics APIs.

The project is copyright Google Inc. under Apache-2.0. The README states: "This is not an official Google product (experimental or otherwise), it is just code that happens to be owned by Google." There is no formal foundation or standards body affiliation. The project depends on Khronos Group standards (SPIR-V, Vulkan) but is not a Khronos member project.

**Governance:** Single-maintainer, Google-internal. Dominant active maintainer is David Neto (dneto0, Google), with 480 commits and nearly all recent activity (dependency rolls, feature work, CI). Ryan Harrison (zoddicus, Google) contributed 188 commits historically (2019-2021). Lei Zhang (antiagainst, now AMD AI Group, was Google at time of contributions) wrote 139 commits as a founding contributor. Contributor credits include Mark Adams (marka@nvidia.com, NVIDIA) and Jason Ekstrand (Intel at time of contribution). Contributions require a Google CLA.

**Community culture on new ports:** The CONTRIBUTING.md instructs contributors to open an issue to discuss larger contributions first. There is no stated policy on new platform ports and no community discussion about RISC-V has occurred. Because the project is architecture-agnostic at the source level, RISC-V support is primarily a build infrastructure matter rather than a code change matter. No one has requested or contributed it upstream.

**RISE involvement:** None. Google LLC is a RISE Premier Member, but there is no RISE-funded project, blog post, or working-group engagement for shaderc. The RISE working group categories do not include a graphics or GPU toolchain group.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| (no date) | No RISC-V issue, PR, or commit exists in google/shaderc | GitHub API search: 0 results for "riscv", "riscv64", "risc-v" across issues, PRs, and commits |
| 2026-03 | Debian sid package shaderc 2026.3-1 built successfully on riscv64 (rv-osuosl-01) | [Debian buildd](https://buildd.debian.org/pkg/shaderc) |
| 2023 | Ubuntu 24.04 Noble ships libshaderc1 and libshaderc-dev 2023.8-1build1 with riscv64 as a supported architecture | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=shaderc&suite=noble) |

There is no upstream port history. No contributor from any organization has submitted RISC-V work to google/shaderc. RISC-V availability exists solely because Debian and Ubuntu maintainers build the package on their riscv64 build daemons from unmodified upstream source.

## 3. Upstream Support Tier

shaderc has no documented tier policy for architectures. The README states that configurations outside the CI matrix are "untested and unsupported."

The CI matrix (Google Kokoro) tests: Linux x86-64 (Clang and GCC, multiple build types), macOS (Clang), Windows (VS2022 amd64), and Android (armeabi-v7a and x86 via NDK). No riscv64 target exists in any CI configuration.

| Property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | Yes (Kokoro: Linux/macOS/Windows) | No | No |
| Official binary releases | No (Google publishes no releases) | No | No |
| Release-blocking | N/A | N/A | N/A |
| Upstream tier label | Untested/unsupported outside CI | Untested/unsupported | Untested/unsupported |
| Distribution package | Yes | Yes | Yes (Debian, Ubuntu) |

No arm64 upstream CI exists either. Both arm64 and riscv64 are in the same tier: not covered by upstream CI, but packaged by distributions.

## 4. Technical Architecture and RISC-V-Specific Subsystems

shaderc is a pure portable C++17 compiler frontend. It performs text and IR transformations only. There is no JIT, no native code emission, no SIMD vectorization, no assembly, and no platform ABI dependency. The output (SPIR-V) is a portable intermediate representation for GPU drivers, not a CPU ISA.

A full scan of the 225 files in google/shaderc found:
- Zero `.S` or `.asm` assembly files
- Zero `#ifdef __riscv`, `#ifdef __aarch64__`, `#ifdef __x86_64__`, or `#ifdef __arm__` guards
- No `arch/` subdirectory
- No SIMD intrinsics, no JIT backends, no platform dispatch code
- The only architecture references are three Kokoro CI shell scripts for Android armeabi-v7a and Android x86 cross-compilation targets

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GLSL front-end parsing | scalar C++ | scalar C++ | scalar C++ |
| HLSL front-end parsing | scalar C++ | scalar C++ | scalar C++ |
| SPIR-V optimizer (SPIRV-Tools) | scalar C++ | scalar C++ | scalar C++ |
| SPIR-V validator | scalar C++ | scalar C++ | scalar C++ |
| glslc CLI | scalar C++ | scalar C++ | scalar C++ |
| libshaderc C API | scalar C++ | scalar C++ | scalar C++ |

riscv64 is not behind amd64 or arm64 on any architectural dimension. The absence of arch-specific code is by design, not by omission.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake (minimum 3.22.1) with Ninja. Python 3.x is required for `utils/git-sync-deps` (which populates `third_party/glslang`, `third_party/spirv-tools`, `third_party/spirv-headers`) and for the license checker.

**Toolchain requirements:**

| Requirement | Minimum | Notes |
|---|---|---|
| CMake | 3.22.1 | Raised from 3.17.2 in v2023.1 |
| C++ standard | C++17 | Required since v2023.3 |
| GCC | 13+ | CHANGES lists GCC 13 as tested minimum for v2025.1; CI uses GCC 15 |
| Clang | 13+ | CHANGES lists Clang 13 as tested minimum for v2025.1 |
| Python | 3.x | For git-sync-deps and license checker |
| Ninja | 1.10.0 | Used by CI |

**Standard native build:**

```sh
git clone https://github.com/google/shaderc $SOURCE_DIR
cd $SOURCE_DIR
./utils/git-sync-deps
mkdir build && cd build
cmake -GNinja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_INSTALL_PREFIX=/usr/local \
  $SOURCE_DIR
ninja
ninja install
```

**Cross-compilation for riscv64:** No riscv64 toolchain file exists in the repository. The only supplied cross-compilation file is `cmake/linux-mingw-toolchain.cmake` (Linux to Windows/MinGW). A riscv64 toolchain file must be created manually. Invoke with:

```sh
cmake -GNinja \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/riscv64-linux-gnu-toolchain.cmake \
  -DSHADERC_SKIP_TESTS=ON \
  $SOURCE_DIR
```

`SHADERC_SKIP_TESTS=ON` is required for cross-compilation because tests require execution on the target.

**QEMU:** No QEMU usage is documented in the build system or CI. CI runs entirely native on x86-64 hosts. No emulation layer is described or required for any supported configuration.

**Known build failures on riscv64:** None reported. Debian buildd successfully builds 2026.3-1 on rv-osuosl-01 in approximately 10 minutes.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because shaderc has no architecture-specific code, there are no functional gaps between riscv64 and amd64/arm64.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GLSL compilation | Full | Full | Full |
| HLSL compilation | Full | Full | Full |
| SPIR-V optimization | Full | Full | Full |
| SPIR-V validation | Full | Full | Full |
| glslc CLI | Full | Full | Full |
| libshaderc C API | Full | Full | Full |
| WGSL output (optional, off by default) | Full (if enabled) | Full (if enabled) | Full (if enabled) |

**Performance gaps:** Data not available: no benchmark comparing shader compilation throughput on riscv64 vs arm64 or amd64 has been published. Web searches for "shaderc riscv64 benchmark" and "shaderc RISC-V performance" returned zero results.

**Floating-point semantics:** shaderc manipulates SPIR-V IR, not floating-point values on the host CPU. Host floating-point behavior does not affect correctness of the compiled output. No NaN or floating-point handling issues specific to riscv64 have been reported.

**Security hardening gaps:** Data not available: no analysis of CFI, stack protection, or sanitizer coverage on riscv64 has been published for shaderc.

## 7. CI/CD Infrastructure

The upstream CI consists of:
1. One GitHub Actions workflow (`autoroll.yml`): a dependency-update bot that runs on `ubuntu-latest` (x86-64), creates dependency-roll PRs, and triggers Kokoro CI with the `kokoro:run` label. This contains no build or test logic.
2. Google Kokoro CI (19 configurations in `kokoro/`): the actual build and test pipeline. All Linux jobs use a `ubuntu-24.04-amd64` Docker image (`us-east4-docker.pkg.dev/shaderc-build/radial-docker/ubuntu-24.04-amd64/cpp-builder`).

| CI property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI exists | Yes (Kokoro: Linux/macOS/Windows) | No | No |
| GitHub Actions build | No (only autoroll bot) | No | No |
| RISE runners | No | No | No |
| Hardware used | Ubuntu 24.04 amd64 (Docker) | N/A | N/A |
| Test execution | Yes | No | No |
| Release-gating | No public releases | N/A | N/A |

No riscv64 CI runner of any kind exists upstream. Correctness on riscv64 is validated only by Debian's buildds, not by shaderc's own CI infrastructure.

## 8. Distribution and Release Status

**Upstream binaries:** None. Google publishes no GitHub releases for shaderc. The GitHub releases page confirms: "There aren't any releases here." No riscv64 binary assets exist from upstream.

**PyPI:** The package `shaderc` does not exist on PyPI (HTTP 404). No wheel files exist for any architecture.

**RISE wheel builder:** Not present. The RISE wheel builder package list (80+ packages) does not include shaderc. The RISE wheel builder redirects to PyPI for shaderc, which returns 404.

**Debian:**
- Debian sid (unstable): shaderc 2026.3-1 confirmed built on riscv64, buildd server rv-osuosl-01, status "Installed", build time approximately 10 minutes.
- Packages: `libshaderc1`, `libshaderc-dev`, `libshaderc1-dbgsym` all include riscv64.
- Source: [Debian package tracker](https://tracker.debian.org/pkg/shaderc)

**Ubuntu:**
- Ubuntu 24.04 Noble: `libshaderc1` and `libshaderc-dev` version 2023.8-1build1 list riscv64 as a supported architecture alongside amd64, arm64, armhf, i386, ppc64el, and s390x. [NEEDS VERIFICATION: the Ubuntu packages page lists riscv64; a second confirmation from an Ubuntu buildd log was not obtained.]
- Ubuntu 25.10 (questing), 26.04 (resolute), and later: riscv64 is listed as a supported architecture. [NEEDS VERIFICATION: confirmed from packages.ubuntu.com listing; individual buildd status not verified.]

**Arch Linux RISC-V (archriscv.felixc.at):** Inconclusive. The search page returned no results for shaderc. Cannot confirm or refute availability.

**What a user must do to get a working riscv64 binary:** Install from the Debian or Ubuntu package manager (`apt install libshaderc-dev`), or build from source using the standard CMake procedure on a riscv64 host. No cross-compilation or QEMU is required for a native riscv64 build.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| glslang | GLSL/HLSL front-end, emits SPIR-V | Builds (Debian sid 16.4.0-1, rv-manda-02, Installed) | No upstream riscv64 CI; no riscv64 issues | No upstream releases; Debian/Ubuntu packaged | None open |
| SPIRV-Tools | SPIR-V optimizer, validator, assembler/disassembler | Builds (Debian sid 2026.3~rc1-1, rv-manda-02, Installed) | No upstream riscv64 CI | No upstream releases; Debian packaged | None open |
| SPIRV-Headers | SPIR-V specification headers | Architecture-independent (arch: all) | N/A | All architectures | None |
| abseil-cpp | Base libraries (containers, CRC32C, stack walking, time); required by re2 | Builds (Debian sid 20260526.0-2, rv-osuosl-02, Installed) | Two test SEGFAULTs on riscv64 with GCC 15: absl_hashtablez_sampler_test and absl_cordz_sample_token_test | Debian/Ubuntu packaged | Debian bug #1126886 / upstream issue #2002 (open, unresolved since Feb 2026). PR #1986 (CRC32C Zbc/Zbkc hw acceleration) open and unmerged. |
| re2 | Regular expression matching; depends on abseil | Builds (Debian sid 20251105-1+b1, rv-osuosl-02, Installed) | No riscv64-specific issues | Debian packaged | None; inherits abseil-cpp test concern transitively |
| googletest | Unit test framework (test-only) | Builds (Debian sid 1.18.0-1, rv-manda-01, Installed) | One open test failure: GetThreadCountTest.ReturnsCorrectValue returns 0 instead of 1 on riscv64 (issue #3756, open since 2022) | Debian packaged | issue #3756 (non-blocking for production; affects only internal port tests) |
| effcee | FileCheck-style matching (test-only) | No riscv64 issues; builds with SPIRV-Tools | No riscv64 CI | No separate releases; vendored | None reported |
| Python (interpreter) | Build scripts | Available on riscv64 | N/A | Available | None |

**abseil-cpp deep-dive:** This is the most significant transitive concern. Two tests SEGFAULT specifically on Debian riscv64 with GCC 15 (upstream abseil issue #2002, open since February 2026, severity downgraded to "important" but unresolved). This does not prevent the package from being installed or shaderc from building, but means the abseil test suite does not fully pass on riscv64. Additionally, open PR #1986 (CRC32C hardware acceleration via Zbc/Zbkc extensions) is unmerged, leaving riscv64 with software-only CRC32C. For shaderc's use of abseil (via re2), neither issue is expected to affect shader compilation correctness.

**googletest deep-dive:** Issue #3756 (thread count test failure on riscv64, open since 2022) does not affect production builds of shaderc. It would surface only when running the shaderc test suite on riscv64.

**glslang and SPIRV-Tools:** No riscv64 issues in either upstream tracker. Both build successfully on Debian riscv64 buildds. Neither has upstream riscv64 CI, so correctness depends on Debian's buildds alone.

## 11. Known Bugs and Active Issues

**RISC-V-specific bugs:** None. Zero issues or PRs in google/shaderc mention riscv, risc-v, or riscv64.

**Architecture-neutral open bugs (selected):**

| ID | Title | Status | Notes |
|---|---|---|---|
| [#1590](https://github.com/google/shaderc/issues/1590) | ollama compile failure with 'Invalid capability operand: 5447' | Open (Aug 2026) | Affects SPIR-V capability handling; not arch-specific |
| [#1586](https://github.com/google/shaderc/issues/1586) | Invalid capability operand: 5447 | Open (Jul 2026) | Related to #1590 |
| [#1559](https://github.com/google/shaderc/issues/1559) | glslc segfaults on simple GL_EXT_descriptor_heap compute shader | Open (May 2026) | Crash; not arch-specific |
| [#1540](https://github.com/google/shaderc/issues/1540) | 16-bit bitshift validation errors with optimization | Open (Mar 2026) | Correctness; not arch-specific |
| [#1517](https://github.com/google/shaderc/issues/1517) | shaderc internal error: ID OpVariable Scalar boolean must be in a Block | Open (Sep 2025) | Bug-labeled |
| [#1497](https://github.com/google/shaderc/issues/1497) | Aggressive specialization constant folding problem | Open (May 2025) | Correctness/optimization boundary |
| [#1403](https://github.com/google/shaderc/issues/1403) | Optimization issue when specifying --target-env | Open (Mar 2024) | May affect output quality |
| [#1063](https://github.com/google/shaderc/issues/1063) | Internal error using atomics on inout function parameter | Open | Bug-labeled |
| [#1045](https://github.com/google/shaderc/issues/1045) | Assembling spvasm doesn't use target env version | Open | Bug-labeled |
| [#612](https://github.com/google/shaderc/issues/612) | Fix test breakage in shaderc_util_compiler | Open | Bug-labeled |
| [#601](https://github.com/google/shaderc/issues/601) | Optimizer pass failing on simple HLSL repro case | Open | Bug-labeled |

None of these bugs are architecture-specific. All are GLSL/HLSL/SPIR-V compilation correctness issues affecting all platforms equally.

## 12. Objections and Upstream Blockers

**Technical blockers:** None. shaderc has no architecture-specific code. It builds on riscv64 without modification. The Debian buildd confirms this for versions through 2026.3-1.

**Organizational blockers:** None stated. No community objection to riscv64 support exists because no one has asked for it. The single dominant maintainer (David Neto, Google) would need to accept a CI addition PR, but no such PR has been submitted.

**Stated objections:** None. Zero issues or discussions about RISC-V exist in the tracker.

**Acceptance probability for a riscv64 CI PR:** High, conditional on hardware availability. The project already accepts Android arm cross-compilation CI. A riscv64 CI addition would require either QEMU-based emulation on an existing Linux runner or a dedicated riscv64 runner. Given Google's role as a RISE Premier Member and the project's architecture-agnostic nature, there is no technical reason to reject such a PR. The barrier is operational (runner availability, CI cost) rather than technical or policy-based.

## 13. Investment Analysis

### 13.1 Functional Enablement

No functional enablement work is required. shaderc builds and runs correctly on riscv64 without modification. Debian 2026.3-1 and Ubuntu 24.04 provide working packages. No code changes to shaderc itself are needed.

### 13.2 Performance Optimization

Data not available: no benchmark data exists for shaderc on riscv64. Because shaderc is a scalar C++ compiler frontend with no SIMD paths, performance on riscv64 vs amd64 or arm64 will track general CPU throughput and memory bandwidth. No RVV or other RISC-V extension would benefit shader compilation (the hot paths are in string processing, hash tables, and IR traversal, all via abseil and glslang internals). The open abseil PR #1986 (CRC32C Zbc/Zbkc hardware acceleration) could provide minor benefit if merged, but CRC32C is not on the critical path for shader compilation.

Estimated performance optimization investment: low return, not recommended unless baseline benchmarks show a specific bottleneck.

### 13.3 CI/CD Infrastructure

The primary gap is the absence of upstream riscv64 CI. Adding a riscv64 CI job would provide continuous correctness assurance and early detection of regressions.

Options:
1. QEMU-based emulation on an existing Linux runner: lowest cost to implement, higher per-run latency (QEMU is 5-10x slower than native for compiler workloads). Feasible for a correctness-only CI lane.
2. Native riscv64 runner via RISE infrastructure: higher setup cost, better signal quality.

A QEMU-based GitHub Actions workflow adding riscv64 to the CI matrix is approximately 1 person-week of work (write the workflow YAML, verify builds and tests pass under QEMU, submit PR). Native runner setup depends on RISE infrastructure availability.

### 13.4 Ecosystem Enablement

Not applicable. shaderc has no dependent package ecosystem that requires separate riscv64 enablement. It is a C library and CLI tool; downstream consumers (Vulkan implementations, game engines, shader compilation pipelines) will build shaderc from source or use the distribution package.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 CI (QEMU-based GitHub Actions) | 1 | Google or community | Medium |
| CI/CD | Add riscv64 native CI runner (RISE hardware) | 2-3 | RISE + Google | Low |
| Dependencies | Resolve abseil-cpp riscv64 SEGFAULT (issue #2002) | External (abseil team) | Google abseil team | Medium (affects test suite completeness) |
| Dependencies | Land abseil CRC32C Zbc/Zbkc PR #1986 | External (abseil team) | Contributor + Google | Low |
| Performance | Baseline benchmarks for shader compilation on riscv64 | 1 | Any | Low |

No functional enablement investment is needed. The project works on riscv64 today.

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

## 15. References

- [google/shaderc repository](https://github.com/google/shaderc)
- [shaderc CONTRIBUTING.md](https://github.com/google/shaderc/blob/main/CONTRIBUTING.md)
- [Debian shaderc package tracker](https://tracker.debian.org/pkg/shaderc)
- [Debian buildd status for shaderc riscv64](https://buildd.debian.org/status/package.php?p=shaderc&suite=sid)
- [Ubuntu 24.04 Noble shaderc packages](https://packages.ubuntu.com/search?keywords=shaderc&suite=noble)
- [shaderc Kokoro CI configuration directory](https://github.com/google/shaderc/tree/main/kokoro)
- [shaderc autoroll GitHub Actions workflow](https://github.com/google/shaderc/blob/main/.github/workflows/autoroll.yml)
- [shaderc root Dockerfile](https://github.com/google/shaderc/blob/main/Dockerfile)
- [KhronosGroup/glslang](https://github.com/KhronosGroup/glslang)
- [KhronosGroup/SPIRV-Tools](https://github.com/KhronosGroup/SPIRV-Tools)
- [KhronosGroup/SPIRV-Headers](https://github.com/KhronosGroup/SPIRV-Headers)
- [abseil-cpp riscv64 SEGFAULT upstream issue #2002](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp CRC32C Zbc/Zbkc PR #1986](https://github.com/abseil/abseil-cpp/pull/1986)
- [googletest riscv64 thread count test failure issue #3756](https://github.com/google/googletest/issues/3756)
- [RISE Project member list](https://riseproject.dev)
- [shaderc issue #1590 - Invalid capability operand](https://github.com/google/shaderc/issues/1590)
- [shaderc issue #1559 - glslc segfault on descriptor heap shader](https://github.com/google/shaderc/issues/1559)
- [shaderc issue #1540 - 16-bit bitshift validation errors](https://github.com/google/shaderc/issues/1540)
- [shaderc issue #1517 - internal error on OpVariable boolean](https://github.com/google/shaderc/issues/1517)
- [shaderc issue #1497 - aggressive specialization constant folding](https://github.com/google/shaderc/issues/1497)
- [shaderc issue #1403 - optimization issue with --target-env](https://github.com/google/shaderc/issues/1403)