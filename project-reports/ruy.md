---
title: ruy
parent: Project Reports
color: orange
dependencies:
  - name: cpuinfo
    relation: runtime-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="ruy" %}

# ruy

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Optimization level:** absent<br/>
**Scope:** RISC-V (riscv64/linux) support status for ruy<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

ruy is a dense matrix multiplication library optimized for neural network inference, developed and published by Google under the [google/ruy](https://github.com/google/ruy) GitHub repository. Its design goal is high-throughput Int8 and Float32 matrix-matrix multiply on ARM and x86 hardware, historically serving as a GEMM backend for TensorFlow Lite / LiteRT. The repository carries the disclaimer "This is not an officially supported Google product."

Per public knowledge, ruy was archived by Google in 2023 in favor of XNNPACK [NEEDS VERIFICATION - not independently confirmed via the GitHub API's archived-repository flag this session, but consistent with the complete absence of any architecture-port activity, CI additions, or new-platform discussion in the commit/issue/PR history through 2026]. There is no foundation affiliation and ruy is not a RISE Project member; Google LLC does hold a RISE Premier Membership, but that is a corporate membership unrelated to ruy specifically, and ruy is not named anywhere on [riseproject.dev](https://riseproject.dev).

Governance: no `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repo, no governance charter, no technical steering committee. Contributions require a signed Google CLA and code review, under [Google's Open Source Community Guidelines](https://opensource.google/conduct/). License: Apache-2.0.

**Top contributors** (full 571-commit history, 2019-04-08 through 2026-07-22, per `git log --all` on the local clone):

- Benoit Jacob - 307 commits - Google
- Alex Stark - 75 commits - Google
- T.J. Alumbaugh - 53 commits - Google
- "Ruy Contributors" (ruy-eng@google.com, squashed/automated commits) - 47 commits - Google
- Sean Silva - 19 commits - Google
- Renjie Liu, Dayeong Lee, Petr Hosek, Chao Mei, Jared Duke, Geoffrey Martin-Noble, Ben Vanik - Google, single-digit commits each
- Nishidha, Kazuaki Ishizaki - IBM, minor contributions (consistent with PPC support)
- Keichi Takahashi, stha09 - independent/unaffiliated, minor contributions

This is effectively a single-vendor (Google) project with occasional outside patches; there is no multi-company maintainer structure. New architecture ports require adding a platform-detection macro in `platform.h` and contributing optimized kernel/pack routines. There is no stated policy on accepting third-party architecture backends, and no community discussion of a RISC-V port has occurred at any point in the project's history.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2021-02-09 | PR #227 ("Simplify quantized multiplier") merged, authored by GeorgeARM. This PR matches a lexical search for "riscv" but is unrelated to RISC-V - it concerns NEON quantized-multiplier rounding behavior only | [PR #227](https://github.com/google/ruy/pull/227) |
| 2026-10-01 | No RISC-V port exists. Full-history searches of commit messages, diffs, issues, and PRs for "riscv", "risc-v", "rv64", "rvv" return zero matches. `ruy/platform.h` defines no `RUY_PLATFORM_RISCV` macro | This report |

No RISC-V porting effort has ever been initiated, proposed, or discussed for ruy. There is no first-riscv-commit date or author to report, and no master/tracking issue for a riscv64 port exists in the repository. ruy is not fully upstream on RISC-V in any sense - it builds and runs correctly via its generic scalar fallback, but has zero RISC-V-specific engineering.

## 3. Upstream Support Tier

ruy has no formal tier or support-level policy document; no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exist. ARM is the primary and highest-supported architecture (dedicated NEON kernels for arm32 and arm64), x86/x86-64 has AVX, AVX2+FMA, and AVX-512 paths. All other architectures, including RISC-V and PPC, use the generic scalar fallback (`Path::kStandardCpp`).

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI | None (no CI config exists in the repo at all) | None | None |
| Optimized path | kAvx, kAvx2Fma, kAvx512 | kNeon, kNeonDotprod | None - kStandardCpp only |
| Official binary from upstream | None (source-only, no GitHub releases) | None (source-only) | None (source-only) |
| Distro binary package | libruy-dev (Ubuntu, Debian) | libruy-dev (Ubuntu, Debian) | libruy-dev (Ubuntu 26.04 resolute, Debian sid) |
| Release-blocking status | Not applicable (no release mechanism) | Not applicable | Not applicable |

The upstream project publishes no binary releases for any architecture: the [GitHub releases page](https://github.com/google/ruy/releases) is confirmed empty ("There aren't any releases here"). All distribution is source-only from upstream; binary packages are produced entirely by Debian/Ubuntu maintainers.

## 4. Technical Architecture and RISC-V-Specific Subsystems

ruy's architecture-specific code is organized into three layers: platform-detection macros (`platform.h`), execution-path selection (`path.h`), and kernel/pack implementation files (`kernel_*.cc`, `pack_*.cc`).

**Platform detection (`ruy/platform.h`):** defines macros for `RUY_PLATFORM_X86`, `RUY_PLATFORM_ARM_32`, `RUY_PLATFORM_ARM_64`/`RUY_PLATFORM_ARM`, `RUY_PLATFORM_NEON`, `RUY_PLATFORM_PPC`, `RUY_PLATFORM_APPLE`, `RUY_PLATFORM_FUCHSIA`, `RUY_PLATFORM_EMSCRIPTEN`, plus x86 feature flags (`AVX`, `AVX2_FMA`, `AVX512`). There is no `RUY_PLATFORM_RISCV` macro and no `#ifdef __riscv` anywhere in the repository, verified by a case-insensitive recursive grep across the full source tree (zero matches for "riscv", "rv32", "rv64", "rvv", "__riscv").

**Execution path selection (`ruy/path.h`):** the `Path` enum adds optimized values only inside `#if RUY_PLATFORM_ARM` (`kNeon`, `kNeonDotprod`) and `#if RUY_PLATFORM_X86` (`kAvx`, `kAvx2Fma`, `kAvx512`). No equivalent block exists for RISC-V. Notably, PPC is also *detected* in `platform.h` but gets no dedicated `Path` either - PPC and riscv64 both fall through to the same generic `Path::kStandardCpp`.

**Kernel/pack file inventory** (`ruy/` directory, measured on HEAD `2264753777198e4393fb83c44c693462d57a2be1`):

| Architecture | Files | Notable size | Count |
|---|---|---|---|
| x86 (SSE/AVX/AVX2+FMA/AVX512) | kernel_avx.cc (67,572 B), kernel_avx2_fma.cc (48,673 B), kernel_avx512.cc (61,121 B), kernel_x86.h (35,219 B), pack_avx.cc (35,718 B), pack_avx2_fma.cc (30,381 B), pack_avx512.cc (45,231 B), pack_x86.h (30,192 B), plus 3 have_built_path_for_avx* runtime-detection shims | - | 11 files |
| ARM (32/64-bit NEON) | kernel_arm.h (8,785 B), kernel_arm32.cc (96,802 B), kernel_arm64.cc (390,730 B), pack_arm.h (26,003 B), pack_arm.cc (98,840 B) | kernel_arm64.cc is the single largest source file in the repository, hand-written NEON/NeonDotprod intrinsics and inline assembly tuned for multiple microarchitectures (A55-class in-order, A73/A75 out-of-order) | 5 files |
| PPC | none | falls back to scalar despite being detected in platform.h | 0 files |
| riscv64 | none | no kernel_riscv*, pack_riscv*, kernel_rvv*, or any analog | 0 files |

The generic fallback itself (`kernel_common.h`, 303 lines; `pack_common.h`, 143 lines, implementing `Path::kStandardCpp`) is a complete, correct scalar C++ reference implementation with no stub markers - this is why distro builds of `libruy-dev` succeed on riscv64 even with zero architecture-specific code. On riscv64, `kernel_common.h`'s optimized parameter structs compile only as the generic path, since all ARM/x86-gated structs are excluded by their `#if RUY_PLATFORM_NEON_64 || RUY_PLATFORM_NEON_32 || RUY_PLATFORM_X86` guards.

There is no JIT compiler, crypto subsystem, compression, or GC-barrier code in ruy. The SIMD matrix-multiply kernel is the only subsystem requiring architecture-specific implementation.

## 5. Build System, Cross-Compilation, and Toolchain

ruy supports both CMake (>=3.13, requires C++14) and Bazel.

**Architecture conditionals in the build system:**
- `CMakeLists.txt` (root, 4.6 KB): grepped for "riscv" - zero matches. No riscv64-specific flags anywhere in `cmake/ruy_cc_library.cmake`, `ruy_cc_binary.cmake`, `ruy_cc_test.cmake`, `ruy_add_all_subdirs.cmake`, `ruy_include_directories.cmake`, `bazel_to_cmake.py`/`.sh`, or `ruyConfig.cmake.in`.
- `BUILD` (Bazel): `select()` clauses exist for `armv7`, `x86_64`, `ppc`, `s390x`, `fuchsia`. No `riscv64` select clause.
- No `cmake/riscv64.cmake`, no `cmake/toolchain-riscv64.cmake`, no `Dockerfile.riscv64`, no `.ci/` directory, no QEMU scripts anywhere in the repo.

**Cross-compilation for riscv64:** no ruy-provided toolchain file exists; a standard `riscv64-linux-gnu` cross-compiler is sufficient since no riscv64 SIMD intrinsics are required:

```
cmake -DCMAKE_TOOLCHAIN_FILE=<riscv64-linux-gnu.cmake> \
      -DRUY_MINIMAL_BUILD=ON \
      -DRUY_FIND_CPUINFO=OFF \
      -DCPUINFO_BUILD_BENCHMARKS=OFF \
      -DCPUINFO_BUILD_UNIT_TESTS=OFF \
      -DCPUINFO_BUILD_MOCK_TESTS=OFF \
      -B build-riscv64 .
cmake --build build-riscv64
```

`RUY_MINIMAL_BUILD=ON` disables googletest-download logic for cross-compilation. The `third_party/cpuinfo` submodule must be initialized before building (`git submodule update --init`). The only build options ruy itself exposes (`RUY_MINIMAL_BUILD`, `RUY_PROFILER`, `RUY_ENABLE_INSTALL`, `RUY_FIND_CPUINFO`) are architecture-agnostic; none are riscv-specific. The `RUY_OPT_SET` compile-time bitmask controlling intrinsics/ASM/tuning has no effect on riscv64 since no architecture-specific path compiles there.

**Toolchain version requirements:** none stated for riscv64 specifically. Any GCC or Clang supporting C++14 and the `riscv64-linux-gnu` target suffices, because there is no riscv64 intrinsics surface to require a minimum compiler version.

**Known build failures on riscv64:** none reported in google/ruy's own tracker. Ubuntu 26.04 "resolute" successfully builds and ships `libruy-dev` for riscv64 (see Section 8), confirming the CMake build completes cleanly. Separately, when ruy is vendored as a statically-linked dependency inside CTranslate2's riscv64 build (RISE's `python-wheels` PR #873), the *pinned cpuinfo submodule* (not ruy itself) required a downstream patch for a missing `syscall()` declaration on riscv64, since cpuinfo's pinned commit predates riscv64 recognition - this is a cpuinfo-side issue, not a ruy build defect (see Section 9). A separately-circulated web-search claim describing a "cpuinfo/_GNU_SOURCE/syscall/GCC 14" issue specifically inside google/ruy's own issue tracker was checked directly against GitHub's search API (scoped `repo:google/ruy`, terms `GNU_SOURCE`, `cpuinfo`, `syscall`, `GCC 14`) and found to be fabricated - no such issue, PR, or commit exists in google/ruy; this claim is disregarded.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Optimized Int8 matmul kernel | Yes (AVX2+FMA, AVX-512) | Yes (NEON, NEON dotprod) | No - scalar fallback only |
| Optimized Float32 matmul kernel | Yes | Yes | No - scalar fallback only |
| Runtime SIMD path detection | Yes (cpuinfo + have_built_path probes) | Yes | No - cpuinfo reports no ARM/x86 path available, so kStandardCpp is selected |
| Platform detection macro | RUY_PLATFORM_X86 | RUY_PLATFORM_ARM | None |
| Microarchitecture tuning | Yes (AVX-512 Skylake-X, etc.) | Yes (A55-class vs A73/A75 variants) | None |
| Correctness (scalar fallback) | Yes | Yes | Yes |

**Functional gaps:** none. `Path::kStandardCpp` is a complete and correct implementation for every operation ruy supports; it produces correct results on riscv64.

**Performance gaps:** severe. `kStandardCpp` is an unvectorized scalar triple-loop C++ fallback. The only ARM performance data published in ruy's own tracker ([issue #323](https://github.com/google/ruy/issues/323), still open, one comment) reports approximately 10 GOPs (Raspberry Pi 4, aarch64 NEON, 1.5 GHz) and approximately 40 GOPs (Pixel 4, aarch64 NEON, 2.84 GHz) for a 512x512x512 Int8 matmul. Data not available: a quantitative riscv64-kStandardCpp-vs-arm64-kNeon throughput comparison on equivalent silicon - no such figure exists in google/ruy's tracker or elsewhere found in this research.

The only concrete RISC-V performance numbers found trace to third-party, non-ruy-upstream work: a RISC-V porting-contest repository (`rv2036/rvspoc-S2602-litert`) ports LiteRT (TFLite's successor) to RISC-V by bypassing or minimizing ruy's GEMM path with custom RVV 1.0 kernels, not by modifying ruy itself. Submission #1 (QEMU, RVV vlen=256 vs scalar RV64GC baseline) reports: MobileNetV1 FP32 2.35x, MobileNetV1 INT8 2.87x, MobileNetV2 FP32 1.95x, MobileNetV2 INT8 3.58x, EfficientDet-Lite0 INT8 3.39x (average ~2.8x across 5 models), with ruy retained only as a correctness fallback on layout mismatch, not as the hot path. Submission #6 reports MobileNetV1 FP32 1.17x/uint8 5.48x, MobileNetV2 FP32 1.40x/uint8 5.96x, EfficientDet-Lite0 25.89x. Both are QEMU-emulated (the authors explicitly caveat QEMU is "~30-100x slower than real hardware," so absolute timings are not meaningful) and neither includes an arm64 comparison point. These numbers characterize downstream LiteRT RVV kernels replacing ruy, not an improvement to ruy itself [NEEDS VERIFICATION - single-source hackathon submission, not independently reproduced].

**Security hardening gaps:** data not available - no security hardening analysis for any architecture was found in this research.

**NaN / floating-point semantics:** no riscv64-specific floating-point correctness issues are reported anywhere (ruy's own tracker, or general web search for RISC-V NaN-boxing bugs, which surfaced only unrelated bugs in other projects such as XiangShan, CVA6, and the riscv-v-spec repo). The `kStandardCpp` path uses portable C++ arithmetic.

## 7. CI/CD Infrastructure

google/ruy has **no CI configuration of any kind** for any architecture, confirmed by direct repository-tree inspection (not search summaries): the repository contains no `.github` directory at all (`ls .github` returns "No such file or directory"), hence no `.github/workflows/` and zero GitHub Actions workflow files. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, or `azure-pipelines*` exists anywhere in the tree. This was independently re-verified via an adversarial pass and corroborated by GitHub's code-search API (`search_code("repo:google/ruy path:.github/workflows")` returns `total_count: 0`).

This directly contradicts an earlier characterization of the project as running three Google org-level injected workflows (CodeQL, GitHub Actions Scan, Google GitHub Admin Security Scan) visible only on the GitHub Actions tab rather than committed to the repo tree [NEEDS VERIFICATION - that claim comes from a single source and was not re-confirmed this session by fetching the live Actions tab; it is not necessarily inconsistent with "no `.github/workflows` files," since org-mandated scans can run without being defined in the repository's own tree, but it could not be independently corroborated here]. What is certain, confirmed by repo-tree inspection, is that there is no riscv64 (or any architecture) build-and-test CI committed to google/ruy.

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | No | No | No |
| Test CI | No | No | No |
| QEMU-based cross-CI | No | No | No |
| RISE runner | No | No | No (indirectly: see below) |
| Hardware CI | No | No | No |

The only riscv64 build pipeline touching ruy's code at all is downstream and external to google/ruy: RISE's `riseproject-dev/python-wheels` repository builds a riscv64 wheel for CTranslate2 (PR #873, "ctranslate2: add build-ctranslate2.yml for riscv64 wheels," merged 2026-09-06, author luhenry) in which ruy is statically linked as the CPU GEMM backend ("Ruy only, no OpenBLAS," covering both float32 and int8). This build does run on RISE's native riscv64 CI infrastructure (job timeout raised to 480 minutes to accommodate the full C++ compile plus three Python interpreter test passes) and exercises ruy's scalar kernel path during CTranslate2's own test suite (160 passed, 7 skipped, 4 deselected - two deselections specifically due to numeric precision divergence in ruy's scalar kernels exceeding tolerance by ~0.004). This is CI for CTranslate2, not for ruy itself, and it is not reflected anywhere in google/ruy's own repository or issue tracker ([Issue #1155](https://github.com/riseproject-dev/python-wheels/issues/1155) tracks it on the CTranslate2 side).

Separately, the only riscv64 build of ruy proper that exists is the Debian/Ubuntu autobuilder infrastructure build of `libruy-dev`, a downstream distribution build not controlled by or visible to google/ruy.

## 8. Distribution and Release Status

**Upstream:** no binary releases for any architecture. The [GitHub releases page](https://github.com/google/ruy/releases) is confirmed empty ("There aren't any releases here"). No PyPI package named `ruy` exists (`pypi.org/pypi/ruy/json` returns HTTP 404, independently re-confirmed). The RISE GitLab PyPI mirror also has no `ruy` package (redirects to `pypi.org/simple/ruy/`, which itself 404s).

**Ubuntu 26.04 "resolute":** `libruy-dev` version `0.0.0~git20230215.21a85fe-3` is available with a riscv64 binary, confirmed directly on the [package detail page](https://packages.ubuntu.com/resolute/libruy-dev): architectures amd64, arm64, armhf, ppc64el, riscv64, s390x. Download size 138.6 kB, installed size 996.0 kB. This was independently re-verified adversarially (direct curl, not trusted from a prior search) and could not be refuted - a live, working download link exists at [packages.ubuntu.com/resolute/riscv64/libruy-dev/download](https://packages.ubuntu.com/resolute/riscv64/libruy-dev/download). The source package `ruy` is maintained by the Debian Deep Learning Team (Dylan Aissi), built from an unpatched upstream git snapshot (`21a85fe`, dated 2023-02-15), with changelog entries showing active maintenance through September 2025.

**Debian sid/testing:** `libruy-dev` is built and installed on the Debian riscv64 buildd infrastructure, per the [Debian package tracker](https://tracker.debian.org/pkg/ruy).

**Arch Linux:** not packaged in Arch Linux main repos, and confirmed absent from the Arch RISC-V port (`archriscv.felixc.at/?q=ruy` lists no `ruy`/`libruy` entry).

**What a user must do to get a working riscv64 binary:** on Ubuntu 26.04 or Debian sid, `apt install libruy-dev` installs the riscv64 package directly. On other distributions, building from source with a standard `riscv64-linux-gnu` toolchain is required (Section 5); this produces correct, scalar-only results.

**Indirect riscv64 distribution via CTranslate2:** ruy is not published independently by RISE, but it is vendored statically inside RISE's riscv64 wheel builds for CTranslate2 (`ctranslate2-v4.8.1`, released 2026-09-07, and `ctranslate2-v4.8.2`, released 2026-09-17, both on [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels)). This is the one channel through which a riscv64 build of ruy's code reaches an end user via RISE infrastructure, but it is not a standalone ruy release and ruy does not appear by name on RISE's [wheel builder page](https://riseproject.gitlab.io/python/wheel_builder/).

## 9. Dependencies

### Summary Table

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| cpuinfo | runtime-dependency, critical. CPU feature/ISA detection; selects ruy's execution path at runtime | Yes - upstream CI (`build.yml`) builds riscv64 on every PR/push via QEMU (`cmake-linux-qemu`) and Android NDK cross-compile; also present as `cpuinfo`/`libcpuinfo0`/`libcpuinfo-dev` in Ubuntu 26.04 resolute (v0.0~git20250905.877328f-1) | No - CI is build-only; `ctest` is never invoked for any platform in upstream CI | No tagged GitHub releases for any architecture (source-only); Debian sid and Ubuntu 26.04 resolute carry distro-built git-snapshot packages | Open: [pytorch/cpuinfo#397](https://github.com/pytorch/cpuinfo/issues/397) - riscv64 ISA extension detection incomplete (only Zfh/Zvfh), vendor/uarch returns "unknown," sysfs cache detection incomplete. Not currently blocking ruy, since ruy has no riscv64 SIMD path to dispatch to |
| googletest | test-dependency, optional. Test framework only, not linked into ruy's shipped library | Compiles cleanly on riscv64; Debian sid ships `googletest` 1.18.0-1 as an `arch:all` source/CMake/headers package, with an actual riscv64 build confirmed on Debian buildd host `rv-manda-01` | Partial - the library's own self-test `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64; no other riscv64-specific build/test CI exists upstream (only CodeQL + pages-deploy workflows) | Source-tarball-only releases for all architectures; Debian/Ubuntu package as `arch:all` (header/CMake-only) | Open, unresolved since 2022: [google/googletest#3756](https://github.com/google/googletest/issues/3756) - `GetThreadCount()` returns 0 on riscv64 (reads `/proc/<pid>/stat` field 19). Assigned to derekmauro, no active fix. Does not affect ruy's own test correctness unless ruy's tests exercise thread-count APIs directly |

No JIT, crypto, compression, or allocator dependencies exist. ruy's only architecture-sensitive subsystem is its self-contained SIMD matmul kernel - it depends on no external SIMD/numerics library.

### cpuinfo Deep-Dive

cpuinfo is the critical runtime dependency that determines which ruy execution path is selected. Its riscv64 ISA-detection gap ([#397](https://github.com/pytorch/cpuinfo/issues/397), re-verified open as of 2026-10-01) means vendor/microarchitecture identification returns "unknown" and only Zfh/Zvfh extensions are currently detected. The practical consequence today: cpuinfo correctly reports that no ARM or x86 SIMD path is available on riscv64, so ruy selects `kStandardCpp` - this is correct behavior given ruy has no RVV path to dispatch to, so the dependency is not currently blocking. It would become load-bearing if/when a RISC-V RVV kernel were ever added to ruy, since correct runtime dispatch to that kernel would require complete and reliable ISA-extension data from cpuinfo. Separately, downstream integration work (RISE's CTranslate2 riscv64 wheel, PR #873) needed to patch cpuinfo's pinned submodule for a missing `syscall()` declaration on riscv64, since the pinned commit predates riscv64 recognition in cpuinfo upstream - this is a packaging/vendoring issue in the downstream consumer, not evidence of a defect in ruy's own code.

### googletest

[Issue #3756](https://github.com/google/googletest/issues/3756) (open since 2022-02-07, no update since) reports that `GetThreadCountTest.ReturnsCorrectValue` returns 0 instead of the expected value on riscv64. This affects googletest's own self-tests. It does not affect ruy's test correctness unless ruy's own test suite exercises thread-count APIs directly; no evidence of that was found in this research. No active fix is in progress upstream.

## 11. Known Bugs and Active Issues

**riscv64-specific issues in google/ruy:** none. Direct GitHub search (`riscv in:title,body`, scoped to `repo:google/ruy`) returns zero results, and PR search for "riscv" surfaces only the unrelated #227 (Section 2).

**Open issues in google/ruy (all architectures):** nine open issues as of 2026-10-01 (#378, #366, #352, #346, #333, #328, #323, #321, #317), covering Windows ARM64 cpuinfo link failures, build/CMake questions, NEON/aarch64 questions, and an `Eigen::half` compile error. None concern RISC-V.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [cpuinfo #397](https://github.com/pytorch/cpuinfo/issues/397) | riscv/linux: complete ISA extension, vendor/uarch, and cache support | Open | High (for any future ruy riscv kernel dispatch) | Proposes adding 28 ISA extensions and T-Head/SpacemiT vendor detection; not yet reviewed |
| [googletest #3756](https://github.com/google/googletest/issues/3756) | GetThreadCountTest returns 0 on riscv64 | Open | Low (does not affect ruy correctness) | Assigned to derekmauro; open since 2022; no fix in progress |

No correctness bugs affect ruy on riscv64 itself. The scalar `kStandardCpp` path produces correct results, confirmed indirectly by CTranslate2's riscv64 test suite passing (160/171, with deselections only for numeric-precision tolerance on scalar kernels, not correctness failures).

## 12. Objections and Upstream Blockers

**No stated objections:** no maintainer has expressed opposition to a RISC-V port; the topic appears simply never to have been raised in six-plus years of project history.

**Technical blockers:**

1. The library's optimized-kernel infrastructure (path selection, pack routines, kernel dispatch) is built entirely around ARM and x86 SIMD models. Adding RVV support requires a new `RUY_PLATFORM_RISCV` macro, new `Path` enum values, new `kernel_riscv*.cc`/`pack_riscv*.cc` files, and RVV intrinsic kernels. This is non-trivial: the arm64 kernel alone is 390,730 bytes of hand-tuned NEON intrinsics/assembly across multiple microarchitecture-tuned variants (Section 4).
2. cpuinfo #397 should be resolved before any future RVV dispatch path in ruy could rely on correct runtime ISA detection (Section 9).

**Organizational blockers:** the project is effectively single-vendor (Google), driven historically by TFLite/LiteRT deployment needs, and per public knowledge was archived in 2023 in favor of XNNPACK [NEEDS VERIFICATION, as noted in Section 1] - consistent with the complete absence of ongoing architecture-port activity of any kind (not just RISC-V; PPC also receives no dedicated kernel despite being detected). There is no evidence of a maintainer or external contributor currently positioned to own long-term maintenance of a new architecture-specific kernel.

**Acceptance probability:** data not available - no maintainer has commented on the likelihood of accepting an external RISC-V patch, and the issue tracker provides no signal either way. The Apache-2.0 license and CLA-based contribution model present no formal barrier, but the archived/inactive status of the project (if confirmed) would be the dominant factor governing whether any new kernel contribution could be merged at all. [NEEDS VERIFICATION]

## 13. Readiness Assessment

- **Color:** orange (optimization-absent)
- **Release provider:** distro
- **Optimization level:** absent

**Justification:** google/ruy has no upstream CI of any kind (no `.github/workflows`, confirmed by repo-tree inspection and GitHub code search, [github.com/google/ruy](https://github.com/google/ruy)), so the CI-based primary grade would be yellow via the clean-distro-build floor (Ubuntu 26.04 "resolute" ships `libruy-dev` for riscv64 built from an unpatched upstream git snapshot, [packages.ubuntu.com/resolute/libruy-dev](https://packages.ubuntu.com/resolute/libruy-dev)). ruy's stated purpose is accelerated Int8/Float32 matmul kernels for NN inference (a kernel-library optimization-purpose project), and it has zero RISC-V-specific code anywhere (`ruy/platform.h` defines no `RUY_PLATFORM_RISCV`, there are no `kernel_riscv*`/`pack_riscv*` files, confirmed by full source-tree grep, [github.com/google/ruy/blob/master/ruy/platform.h](https://github.com/google/ruy/blob/master/ruy/platform.h)); riscv64 runs only the generic scalar `kStandardCpp` fallback. Per the project-color-coding skill's optimization modifier, "absent" RISC-V optimization caps the color at orange, overriding the yellow distro-floor grade.

**Pending work that could change the grade:** no RVV/RISC-V kernel work is underway in google/ruy itself (no open issues/PRs mention riscv). ruy is consumed as a scalar-only GEMM fallback inside CTranslate2's riscv64 wheel built by RISE's `riseproject-dev/python-wheels` PR #873 (merged 2026-09-06), but that is downstream integration, not upstream ruy optimization work. Its critical runtime dependency cpuinfo has an open riscv64 ISA-detection gap ([pytorch/cpuinfo#397](https://github.com/pytorch/cpuinfo/issues/397)) that would need resolving before any future RVV dispatch path in ruy could work correctly. A project-graph database cross-check was not performed this session (MCP connection failure, `CONNECTION_CLOSED`) and should be re-run once that server reconnects.

## 14. Investment Analysis

RISE has not funded any ruy-specific work, nor is there a dedicated RISE repository, blog post, or runner usage targeting ruy by name. RISE's only touchpoint with ruy is incidental: ruy ships as CTranslate2's statically-linked, scalar-only CPU GEMM backend in the riscv64 wheel built by `riseproject-dev/python-wheels` PR #873.

### 14.1 Functional Enablement

ruy already functions correctly on riscv64 via the `kStandardCpp` scalar fallback path, confirmed both by Ubuntu 26.04's clean distro build and by CTranslate2's riscv64 test suite passing against it. No functional enablement work is required.

### 14.2 Performance Optimization

The dominant gap is the total absence of RVV (RISC-V Vector) kernels. Required work:

1. Add a `RUY_PLATFORM_RISCV` macro to `platform.h` with `__riscv` detection.
2. Add `kRvv` (or equivalent) `Path` values to `path.h` and integrate into the default architecture-path selection.
3. Implement `kernel_riscv64.cc` with RVV intrinsics for Int8 and Float32 matmul. The arm64 kernel is the closest existing analog at 390,730 bytes of hand-tuned NEON intrinsics/assembly across multiple microarchitecture variants; an RVV implementation using scalable vector intrinsics may be more concise due to RVV's architecture-agnostic vector-length model, but baseline kernel work is still substantial. Third-party RVV GEMM work exists only outside ruy (the `rv2036/rvspoc-S2602-litert` contest submissions implement RVV kernels in LiteRT's `cpu_backend_gemm` layer, bypassing ruy rather than extending it, and report 1.17x-5.96x speedups over scalar RV64GC under QEMU emulation - not directly reusable as a ruy kernel without adaptation, and not validated on real hardware).
4. Implement `pack_riscv.cc` for riscv64 pack routines.
5. Resolve cpuinfo #397 upstream so RISC-V ISA data is reliable enough to drive runtime dispatch.
6. Add upstream CI (QEMU-based at minimum, since no CI of any kind currently exists for any architecture) once kernels exist, to prevent regression.

### 14.3 CI/CD Infrastructure

The upstream repository has zero committed CI for any architecture, not just riscv64 (Section 7). Before riscv64-specific CI is meaningful, the project would need any build-and-test CI at all. A QEMU-based build-and-test workflow (e.g., `riscv64/ubuntu:24.04` container) is the minimal viable addition, and could reuse infrastructure patterns already proven on RISE's native riscv64 runners (demonstrated usable for C++ builds in PR #873, albeit for CTranslate2, not ruy).

### 14.4 Ecosystem Enablement

Not applicable. ruy has no dependent package ecosystem of its own requiring separate riscv64 enablement; it is consumed as a statically-linked C++ library inside other projects (TFLite/LiteRT historically, CTranslate2 currently via RISE's wheel build).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Implement RVV Int8 matmul kernel (kernel_riscv64.cc) | 6-10 | Contributor with ruy/NEON kernel experience | High |
| Performance | Implement RVV Float32 matmul kernel | 3-5 | Same | High |
| Performance | Implement riscv64 pack routines (pack_riscv.cc) | 2-4 | Same | High |
| Performance | Add platform detection macro and Path enum entry | 0.5 | Same | High |
| Dependency | Resolve cpuinfo #397 (ISA extension detection) | 2-4 | cpuinfo contributor | High |
| CI/CD | Add any build-and-test CI (none exists today for any architecture), then a QEMU riscv64 job | 1.5 | Same or CI specialist | Medium |
| Performance | Microarchitecture tuning for specific RISC-V cores | 4-8 | Hardware vendor or performance engineer | Low (post-baseline) |

Total estimated effort for baseline RVV optimization: 16.5-27.5 person-weeks, assuming a contributor already familiar with ruy's kernel infrastructure and RVV intrinsics programming. This estimate carries additional organizational risk given the project's apparent archived/maintenance-only status [NEEDS VERIFICATION, Section 1], which may affect whether such a contribution could be merged upstream at all regardless of engineering effort.

## 15. References

- [google/ruy repository](https://github.com/google/ruy)
- [ruy/platform.h - platform detection macros](https://github.com/google/ruy/blob/master/ruy/platform.h)
- [ruy/path.h - execution path enum](https://github.com/google/ruy/blob/master/ruy/path.h) (referenced via local clone; path not independently re-fetched this session)
- [ruy/CMakeLists.txt - build system](https://github.com/google/ruy/blob/master/CMakeLists.txt)
- [ruy GitHub releases (empty)](https://github.com/google/ruy/releases)
- [ruy PR #227 - unrelated lexical match, NEON quantized multiplier](https://github.com/google/ruy/pull/227)
- [ruy issue #323 - ARM performance benchmarks](https://github.com/google/ruy/issues/323)
- [cpuinfo issue #397 - riscv/linux ISA detection incomplete](https://github.com/pytorch/cpuinfo/issues/397)
- [googletest issue #3756 - GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [libruy-dev in Ubuntu 26.04 resolute (packages.ubuntu.com)](https://packages.ubuntu.com/resolute/libruy-dev)
- [libruy-dev in Debian tracker](https://tracker.debian.org/pkg/ruy)
- [RISE python-wheels PR #873 - ctranslate2 riscv64 wheel build using ruy as CPU backend](https://github.com/riseproject-dev/python-wheels/pull/873)
- [RISE python-wheels issue #1155 - ctranslate2 riscv64 support tracking issue](https://github.com/riseproject-dev/python-wheels/issues/1155)
- [RISE python-wheels repository](https://github.com/riseproject-dev/python-wheels)
- [RISE wheel builder listing](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE project member list](https://riseproject.dev)
- [rv2036/rvspoc-S2602-litert PR #1 - LiteRT RISC-V port + RVV 1.0 optimization](https://github.com/rv2036/rvspoc-S2602-litert/pull/1)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=ruy)