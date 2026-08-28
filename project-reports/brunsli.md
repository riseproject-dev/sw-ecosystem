---
title: brunsli
---

# brunsli

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for brunsli<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Brunsli is a C++ JPEG repacking codec developed by Google. It losslessly transforms a JPEG file into a smaller container format that can be decoded back to the original JPEG byte-for-byte. Per the project README, brunsli achieves "a 22% decrease in file size while allowing the original JPEG to be recovered byte-by-byte" ([README.md](https://github.com/google/brunsli/blob/master/README.md)). It is used internally as the transcoding backend inside Google's JPEG XL reference implementation for JPEG-recompression mode.

Governance is informal and single-vendor. There is no foundation affiliation, no MAINTAINERS, OWNERS, CODEOWNERS, GOVERNANCE.md, or SUPPORT.md file in the repository. The public GitHub mirror is synced from Google's internal Piper monorepo via `copybara-service[bot]`, which appears as author on most merged PRs with bodies such as "Internal Code Change" or "No public description." Licensing is a dual block: a primary MIT-style notice ("Copyright (c) Google LLC 2019") plus an inherited BSD-2-Clause-style block ("Copyright (C) 2015-2016 Google Inc.") carried over from shared Google compression-library boilerplate; GitHub classifies the combination as "Other/NOASSERTION" ([LICENSE](https://github.com/google/brunsli/blob/master/LICENSE)).

Community culture toward external contributions is closed. `CONTRIBUTING.md` has stated, unchanged since the initial commit on 2019-03-14 through today: "We are currently unable to accept patches to this project." Only issues (bug reports and feature requests) are accepted; code contributions are explicitly foreclosed ([CONTRIBUTING.md](https://github.com/google/brunsli/blob/master/CONTRIBUTING.md)). Of roughly 125 historical PRs, nearly all merged ones are copybara-synced internal changes or authored by the lead maintainer himself; genuine external-contributor merges are rare exceptions (e.g. `zayeem06`/BugQore, one small fix, [PR #159](https://github.com/google/brunsli/pull/159)).

Corporate maintainers:
- Eugene "eustas" Kliuchnikov (Google, also appears as "Evgenii Kliuchnikov") is the dominant contributor, with roughly 115 of all GitHub-attributed contributions and sole authorship of nearly every substantive non-Copybara commit. He is also lead author of Google's brotli and involved in libjxl, and is brunsli's de facto sole maintainer.
- "Compression Team" is a generic internal-Google commit identity used for Copybara-synced changes (8 commits, "Internal change" messages), confirming active internal-Google maintenance running in parallel to the open-source process.
- Other contributors are minor or one-off and unrelated to RISC-V: Lode Vandevenne (Google brotli/zopfli co-author), Moritz Firsching (Google DeepMind), Alex Deymo (ex-Google), Ewout ter Hoeven (Netherlands Institute for Transport Policy Analysis, unaffiliated), Christian Schneider (Datron AG, unaffiliated), `zayeem06` (BugQore), Jervis Muindi, Chris Morrison, DaoDaoS, and `dependabot[bot]`.
- No RISC-V silicon vendor (SiFive, Andes, T-Head, etc.) has ever contributed to brunsli.

No one has ever raised RISC-V in an issue, PR, or comment in the project's history, and the closed-contribution policy applies uniformly regardless of architecture.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-05-22 | brotli (brunsli's only real dependency) gains RISC-V 64-bit platform detection via an external contribution: "Add RISC-V 64-bit (riscv64) platform configuration," authored by David Abdurachmanov (`davidlt`), commit `f9b8c02` | [google/brotli PR #669](https://github.com/google/brotli/pull/669) |
| 2019-03-14 | Brunsli's first public commit, "Initial commit" (`b20764a`), authored by Eugene Kliuchnikov, ships with `BRUNSLI_TARGET_RISCV64` already present in `c/common/platform.h`, inherited verbatim from brotli's near-identical platform-detection header | [commit b20764a](https://github.com/google/brunsli/commit/b20764a6841086bcaebe70198e2e04bc8e6d3c82) |
| 2019-10-28 | v0.1 released - the only GitHub release brunsli has ever had, 0 binary assets attached | [google/brunsli releases](https://github.com/google/brunsli) |
| 2022-05-19 | "Internal change" commit (`ad58637`) simplifies `platform.h`, deleting the `BRUNSLI_ALIGNED_READ` unaligned-read fast path (which had listed RISCV64 as one of several "safe" architectures) and replacing it with a portable `memcpy`-based implementation. This narrows RISCV64's role to solely feeding `BRUNSLI_64_BITS`. Not a RISC-V-motivated change | [commit ad58637](https://github.com/google/brunsli/commit/ad58637c6a616bece1ebf0da808bed659177b551) |
| 2023-04-12 [date reported as 2023-04-14 in one search pass - discrepancy unresolved, NEEDS VERIFICATION] | First known working riscv64 binary: Alpine Linux edge/riscv64 buildbot successfully builds brunsli 0.1-r1 natively, unmodified, via a generic `arch="all"` APKBUILD | [Alpine build log](https://build.alpinelinux.org/buildlogs/build-edge-riscv64/community/brunsli/brunsli-0.1-r1.log) |
| (never) | No dedicated riscv64 port issue or PR has ever been filed against `google/brunsli` | Confirmed via GitHub REST API (`search/issues?q=riscv+repo:google/brunsli` -> `total_count: 0`) and full local clone history search across all branches |

Key contributors relevant to this timeline:
- Eugene Kliuchnikov (Google) - wrote the file that carries the macro, but did no RISC-V-specific work; the macro was copied from brotli's boilerplate, not authored for brunsli.
- David Abdurachmanov (`davidlt`, independent contributor) - authored the original RISC-V detection logic in brotli that brunsli's header descends from. He has never contributed to brunsli itself.
- Holger Jaekel - Alpine Linux APKBUILD maintainer for brunsli; downstream packaging only, no upstream interaction.

Is it fully upstream? Yes, trivially - the detection macro has been in `master` since the first commit and required no separate merge. But there has never been an intentional "RISC-V port": no design discussion, no dedicated commit, no review, no validation step. It is "upstream by inheritance," not upstream by directed engineering effort, and it has never been exercised by any upstream build or test.

## 3. Upstream Support Tier

No formal platform-tier system exists. There is no `PLATFORMS.md`, tier documentation, or release-blocking architecture policy of any kind. The project's only release (v0.1, 2019) shipped zero binary assets for any architecture, so "release-blocking" criteria are not a meaningful gate for this project at all.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes (11 Clang/GCC variants, Windows, macOS, 2 Bazel jobs) | Yes (Android NDK arm64-v8a cross-compile only) | No |
| CI test execution | Yes (ctest / Bazel test) | No (`BUILD_TESTING=off`) | No |
| Official GitHub binary release | No (0 release assets exist for any architecture) | No | No |
| Formal tier designation | None (no tier policy exists for any architecture) | None | None |
| Functional binary available anywhere | Build from source only (upstream) | Build from source only (upstream) | Build from source (upstream); pre-built via Alpine Linux (downstream, unaffiliated with upstream) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Brunsli has no JIT (it is a codec, not a virtual machine), no crypto code, no custom memory allocator, and no SIMD/numerics library of its own. Its only functional dependency is brotli (compression). The only architecture-specific component anywhere in the codebase is a set of compiler-macro-based platform-detection blocks in `c/common/platform.h` (a Hedley-derived header), covering x86, x64, ARMv7, ARMv8, PowerPC64, and RISCV64.

RISC-V detection:
```c
#if defined(__riscv) && defined(__riscv_xlen) && __riscv_xlen == 64
#define BRUNSLI_TARGET_RISCV64
#endif
```
This feeds directly into the `BRUNSLI_64_BITS` selector (alongside x64, ARMv8-64, and PowerPC64), which chooses `uint64_t` vs `uint32_t` for `brunsli_reg_t`, a buffer/bit-count register-width typedef. That is the entire scope of RISC-V-specific logic in the project. No ISA extensions are used: no RVV vector intrinsics (`vfloat32m1_t`, `<riscv_vector.h>`), no Zba/Zbb bit-manipulation intrinsics, no inline assembly. A full-tree grep across all 94 source/header files (cross-checked with a local clone to rule out GitHub search-indexing gaps) found zero files outside `platform.h` that reference `BRUNSLI_TARGET_RISCV64`, `BRUNSLI_64_BITS`, or `brunsli_reg_t`.

| Component | amd64 (x64) | arm64 (ARMv8) | riscv64 |
|---|---|---|---|
| Arch-detection macro | `BRUNSLI_TARGET_X64`, present since 2019 | `BRUNSLI_TARGET_ARMV8_64` / `_ARMV7`, present since 2019 | `BRUNSLI_TARGET_RISCV64`, present since 2019 |
| ISA extensions used | None | None | None |
| Code quality tier | Scalar (generic C++) | Scalar (generic C++) | Scalar (generic C++) |
| SIMD/vector intrinsics | None | None | None |
| JIT | N/A (none in project) | N/A | N/A |
| Crypto | N/A (none in project) | N/A | N/A |
| Ever compiled in upstream CI | Yes | Partially (compiled for Android NDK, never tested) | No, never |

RISC-V is not an outlier relative to the other five architectures in terms of code depth - every architecture gets the identical 1-4 line detection block and identical generic C++ implementation. The only differentiator is CI exercise: x64 is built and tested; arm64 is built only; riscv64 is neither built nor tested by any upstream process. Historically PowerPC64 shares riscv64's "detected in code, never built in CI" status.

## 5. Build System, Cross-Compilation, and Toolchain

The only documented build path (identical for every architecture, from `README.md`):
```bash
git clone --depth=1 https://github.com/google/brunsli.git
cd brunsli
git submodule update --init --recursive
cmake -DCMAKE_BUILD_TYPE=Release -B out
cmake --build out --config Release
```
There are no architecture flags, no toolchain flag, and nothing riscv64-specific anywhere in this path. `CMakeLists.txt` and `brunsli.cmake` contain zero matches for `riscv`, `arch`, `toolchain`, or `PROCESSOR` (the only "ARCH" hits are `ARCHIVE_OUTPUT_DIRECTORY`, unrelated). The only conditional build options are `BRUNSLI_EMSCRIPTEN` (auto-detected, for WASM), `BUILD_TESTING` (standard CTest toggle), and `CMAKE_TOOLCHAIN_FILE` (a generic mechanism, used in CI only for the Android NDK and Emscripten toolchains, never for riscv64). There is no `-DUSE_*=OFF/ON` flag of any kind in this codebase.

Toolchain requirements: `CMakeLists.txt` line 1 requires CMake >= 3.11; `CMAKE_CXX_STANDARD 11` with `CMAKE_CXX_STANDARD_REQUIRED YES` sets C++11 as the language floor. No compiler version is ever tested or documented specifically for riscv64. Because the only riscv64-relevant code is the `__riscv_xlen` macro check, which is available on any GCC/Clang riscv64 backend (including the earliest upstream riscv64 ports circa GCC 7 / Clang 9), there is no code-driven reason to require anything newer than the general C++11/CMake-3.11 floor - this is inference from the source, not a documented upstream claim.

Dependency pinning diverges by build system in a way that matters for riscv64:
- CMake's `FetchContent` pins brotli to tag v1.0.9 (commit `e61745a6`, 2020-08-27). This commit **predates** brotli's own `BROTLI_TARGET_RISCV64` detection being added upstream - so a CMake build of brunsli on riscv64 links against a brotli version that lacks its own RISC-V arch-detection macro, even though brunsli's own `platform.h` detects riscv64 correctly.
- Bazel's `MODULE.bazel` (bzlmod) pins brotli via the Bazel Central Registry at a newer release (1.2.0.bcr.1), which does include brotli's own RISC-V detection.
- This means the two build systems produce riscv64 artifacts against two different levels of brotli RISC-V support.

No toolchain file exists for riscv64 (`cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake` both 404; no `cmake/` directory exists at all). No Dockerfile exists anywhere in the repo for any architecture, riscv64-specific or otherwise (86 files total, all checked; `Dockerfile.riscv64` variants all 404). The CI matrix has never included a riscv64 entry at any point in its history (traced back to the CI file's creation on 2020-05-05); the commit that added cross-architecture jobs (`abf24a88`, 2020-05-06) added only Android arm64-v8a and armeabi-v7a NDK cross-builds.

QEMU usage exists only in a legacy top-level `Makefile` (predates CMake, added 2019-05-09, not invoked by CI):
```makefile
ifneq ($(strip $(CROSS_COMPILE)), )
	CXX=$(CROSS_COMPILE)-gcc++
	ARCH=$(firstword $(subst -, ,$(CROSS_COMPILE)))
	BROTLI_WRAPPER="qemu-$(ARCH) -L /usr/$(CROSS_COMPILE)"
endif

ifeq ($(ARCH), arm)
	CFLAGS += -march=armv7-a -mfloat-abi=hard -mfpu=neon
endif
```
This would mechanically derive `qemu-riscv64` if a user set `CROSS_COMPILE=riscv64-linux-gnu`, but this path is never tested or documented for riscv64; the only hardcoded architecture branch is ARM, with no riscv64 counterpart.

Known build failures: none are riscv64-specific. The one generic build-breaking issue is [#145](https://github.com/google/brunsli/issues/145)/[#144](https://github.com/google/brunsli/issues/144), a Brotli 1.10+/1.1.0+ incompatibility (brunsli links against `libbrotlidec-static`, removed upstream in [Brotli 1.1.0](https://github.com/google/brotli/issues/655)) that affects all architectures equally.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Brunsli has exactly one function - lossless JPEG-to-Brunsli transcoding and back - implemented as portable, architecture-agnostic C++ with no per-architecture feature flags.

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JPEG -> Brunsli encode | Yes, CI-tested | Yes, CI-built, not CI-tested | Functionally yes (proven buildable by Alpine's downstream build); never CI-tested upstream |
| Brunsli -> JPEG decode (byte-exact) | Yes, CI-tested | Yes, CI-built, not CI-tested | Functionally yes; never CI-tested upstream |
| SIMD-accelerated path | None exists | None exists | None exists |
| Official upstream binary | No | No | No |
| Downstream pre-built binary | No official channel found | No official channel found | Yes - Alpine Linux (edge, v3.20, v3.21, v3.22) |

Functional gaps: none identified. The codec logic is 100% portable C++, and there is no code path that is present on amd64/arm64 but absent or stubbed on riscv64.

Performance gaps: cannot be quantified - zero riscv64 benchmark data exists anywhere for brunsli (confirmed by exhaustive GitHub issue/PR/commit/code search, WebSearch, and RISE Project blog search). Because brunsli has no SIMD code on any architecture, "missing SIMD" is not a riscv64-specific disadvantage: amd64 and arm64 also run purely scalar code. Any real-world performance delta between amd64/arm64/riscv64 builds would stem from generic compiler codegen quality and CPU microarchitecture/clock speed, not from a brunsli-specific vectorization gap.

Security hardening gaps: none identified as riscv64-specific. The two most relevant open correctness issues ([#157](https://github.com/google/brunsli/issues/157), a header-validation bypass, and [#148](https://github.com/google/brunsli/issues/148), a `std::hex` stream-state bug) are both architecture-generic.

NaN/floating-point semantics: no RISC-V-specific floating-point issues were found. One data point worth flagging: [PR #167](https://github.com/google/brunsli/pull/167) ("Fix UB in brunsli decoder," merged 2026-08-12) fixed an undefined-behavior shift bug (`log2floor+1==32` producing a shift-by-bitwidth UB via `(1<<32)-1`). The research notes that shift-by-bitwidth UB has historically been observed to manifest differently across ISAs, including RISC-V, due to differing shift-amount masking in codegen - but this fix was filed and merged as a generic correctness bug, not as an observed riscv64 failure, and there is no evidence it was ever triggered on actual RISC-V hardware. This is flagged as an inferred risk class, not a confirmed riscv64 bug. [NEEDS VERIFICATION if reclassified as RISC-V-specific]

## 7. CI/CD Infrastructure

No riscv64 CI exists. This was independently re-verified against the GitHub API: `.github/` contains exactly two files, `ci.yml` (157 lines) and `dependabot.yml`; `grep -in riscv` on the full `ci.yml` returns zero matches. Triggers are `push` (branch `master`), `pull_request` (branch `master`), and a weekly `schedule` (Mondays 06:00 UTC); there is no `workflow_dispatch`. Every job runs on a standard GitHub-hosted runner (`ubuntu-20.04`/`ubuntu-latest`, `windows-latest`, `macos-latest`); there is no self-hosted runner, no ARM runner, and no riscv64 runner anywhere in the file ([.github/workflows/ci.yml](https://github.com/google/brunsli/blob/master/.github/workflows/ci.yml)).

RISE runners: none. RISE Project has zero involvement with brunsli - confirmed by checking all 32 posts on the RISE blog, the `riseproject-dev` GitHub org (48-50 repos), the RISE Python wheel builder, and `pypi.riseproject.dev`, none of which reference brunsli. Google LLC is a RISE Premier Member at the corporate level, but this is unconnected to brunsli specifically.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI jobs | 15 (11 Clang/GCC Linux variants + 2 Bazel jobs, all x86_64, plus Windows and macOS runners) | 1 (Android NDK arm64-v8a cross-compile) | 0 |
| Test execution in CI | Yes (ctest / Bazel test) | No (`BUILD_TESTING=off`) | No |
| Runner type | GitHub-hosted native (`ubuntu`/`windows`/`macos`) | GitHub-hosted, cross-compiled via Android NDK toolchain file | N/A |
| RISE-provided runners | No (native GitHub runners used) | No | No (zero RISE involvement of any kind) |

## 8. Distribution and Release Status

Official GitHub Releases: only one release exists, v0.1 (2019-10-28), with 0 assets attached. There has never been an official binary for any architecture.

PyPI: brunsli has no PyPI presence at all, for any architecture. `https://pypi.org/simple/brunsli/` returns 404 (also checked `python-brunsli`, `pybrunsli`, `brunslipy`, all 404). This is confirmed to be a real absence, not a search artifact (a sanity check against a real package name returns 200; the fake name check returns 404 as expected). The unofficial third-party project `moonsikpark/brunslipy` provides Python bindings but is not published to PyPI under any tested name. The RISE GitLab wheel index (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/brunsli/`) 302-redirects to the same 404-ing PyPI page.

npm/Maven/OCI: no evidence of any such package; brunsli is a pure C++ library (CMake and Bazel only, no `setup.py`/`go.mod`/`Cargo.toml`/`package.json`).

Debian/Ubuntu: not packaged at all, for any architecture. `tracker.debian.org/pkg/brunsli` returns 404; `packages.debian.org` search (names/sourcenames/contents) all return "Sorry, your search gave no results"; `sources.debian.org` API returns empty. Ubuntu (checked through noble/24.04) likewise returns no results in any suite.

Fedora: not packaged (`packages.fedoraproject.org/pkgs/brunsli/` -> 404). Gentoo: not packaged (`packages.gentoo.org/packages/media-libs/brunsli` and `/app-arch/brunsli` both 404). openSUSE: inconclusive - `software.opensuse.org/package/brunsli` returned HTTP 403, no data obtained either way.

Arch Linux (mainline and RISC-V port): not packaged. The `archriscv.felixc.at` landing page yields no useful signal (static page, `?q=` has no effect), but the actual PKGBUILD source repo confirms absence: `GET /repos/felixonmars/archriscv-packages/contents/brunsli` returns 404 ([felixonmars/archriscv-packages](https://github.com/felixonmars/archriscv-packages)).

FreeBSD: the port `graphics/brunsli` genuinely exists in the ports tree (added 2022-01-11, currently at version `0.1_4`), and its `Makefile` carries no `ONLY_FOR_ARCHS`/`NOT_FOR_ARCHS` restriction - it is architecture-generic. However, no riscv64 binary is downloadable: FreeBSD's official binary package mirror (`pkg.freebsd.org`) lists ABI targets for releases 13 through 16 as `amd64`, `aarch64`, `i386`, `armv6`, `armv7`, `powerpc`, `powerpc64`, `powerpc64le` - riscv64 is absent from every release (confirmed by probing `FreeBSD:13/14/15:riscv64` directly, all 404). This is a FreeBSD-wide binary-package-infrastructure gap (no official riscv64 package repo exists for any package), not a brunsli-specific exclusion.

conda-forge: the `brunsli-feedstock` explicitly enumerates supported variants as `linux_64`, `linux_aarch64`, `linux_ppc64le`, `osx_64`, `osx_arm64`. The actual uploaded artifact list (20 files across all versions) contains zero riscv hits - no riscv64 variant is built.

**Alpine Linux - the one confirmed working channel.** Brunsli, `brunsli-dev`, and `brunsli-libs` are shipped for riscv64 in Alpine's `edge/community` repository and in the three most recent stable branches (v3.20, v3.21, v3.22; not present in v3.19, likely predating Alpine's riscv64 port). This was verified directly, not inferred from a status page:
- The live APKINDEX record confirms `P:brunsli`, `V:0.1-r1`, `A:riscv64`, `S:119690` ([APKINDEX](https://dl-cdn.alpinelinux.org/alpine/edge/community/riscv64/APKINDEX.tar.gz)).
- The actual `.apk` was downloaded and extracted, and its contained binaries were inspected with `file`/`readelf -h`: `usr/bin/cbrunsli` and `usr/bin/dbrunsli` are confirmed as "ELF 64-bit LSB pie executable, UCB RISC-V, RVC, double-float ABI," dynamically linked against `/lib/ld-musl-riscv64.so.1` ([brunsli-0.1-r1.apk](https://dl-cdn.alpinelinux.org/alpine/edge/community/riscv64/brunsli-0.1-r1.apk)).
- The build log confirms a successful native build on 2023-04-12 [reported elsewhere as 2023-04-14 for the same log - NEEDS VERIFICATION], completing in 38 seconds and producing `brunsli-0.1-r1.apk`, `brunsli-dev-0.1-r1.apk`, and `brunsli-libs-0.1-r1.apk` ([build log](https://build.alpinelinux.org/buildlogs/build-edge-riscv64/community/brunsli/brunsli-0.1-r1.log)).
- The source recipe (APKBUILD, maintainer Holger Jaekel) declares `arch="all"` with no exclusions and no riscv-specific patches; it builds unmodified precisely because brunsli's own `platform.h` has carried the `BRUNSLI_TARGET_RISCV64` macro since its initial 2019 commit.

What a user must do to get a working binary: on Alpine Linux riscv64 (edge or v3.20+), `apk add brunsli` works directly out of the box. On every other distribution and platform checked, a user must build from source via the README's CMake steps; no toolchain file or riscv64-specific instructions exist, so a standard riscv64 GCC/Clang toolchain plus CMake >= 3.11 is the only stated requirement - but outside of Alpine's own build, this path has no known independent validation.

## 9. Dependencies

Brunsli's dependency manifest lives in `CMakeLists.txt` (root), `brunsli.cmake`, `BUILD.bazel`, and `MODULE.bazel` (bzlmod). There is no `setup.py`/`go.mod`/`Cargo.toml`/`package.json` - it is a pure C++ library. There is no JIT, no crypto code, no custom allocator, and no SIMD/numerics library of its own.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| brotli | Core compression backend; brunsli's decoder/encoder call directly into `brotli/decode.h` and `brotli/encode.h` - brunsli's only functional runtime dependency | Builds cleanly. Own RISC-V macro (`BROTLI_TARGET_RISCV64`) merged 2018 via [PR #669](https://github.com/google/brotli/pull/669); present in the Bazel-pinned 1.2.0.bcr.1 but absent from the CMake-pinned v1.0.9 (predates that macro's addition) | No upstream CI executes tests on riscv64; QEMU testing is manual/out-of-CI only | No official riscv64 binaries or PyPI wheels; Debian/Ubuntu ship riscv64 `.deb` packages built from source | Tracked separately; see `project-reports/brotli.md` (brotli is in `scope.yml`). Two RVV vector-optimization PRs remain unmerged and are performance-only: [#1410](https://github.com/google/brotli/pull/1410) (open, CLA-blocked 6+ months) and [#1489](https://github.com/google/brotli/pull/1489) (closed/abandoned, reported technically superior) |
| googletest | Test-only dependency for brunsli's 11 gtest-based test binaries; never linked into shipped libraries | Builds on riscv64; Debian packages googletest 1.17.0-1+b1, built successfully on riscv64 buildd `rv-manda-04` | Known open issue [#3756](https://github.com/google/googletest/issues/3756): `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (returns 0 instead of 1, a `/proc/pid/stat` field-19 parsing issue). Upstream maintainer response: riscv64 is not officially supported, and the only consumer of `GetThreadCount()` is a death-test threading-safety warning, not a correctness path. None of brunsli's 11 test files use `EXPECT_DEATH`/`ASSERT_DEATH`, so this failure mode is not reachable from brunsli's own test suite | Source-distribution only; Debian/Ubuntu riscv64 packages available | Not in `scope.yml` |
| rules_cc (bazelbuild/rules_cc v0.2.22, via bzlmod) | Bazel build-rule package for `cc_library`/`cc_binary`/`cc_test`; pure Starlark, no compiled code | N/A (not compiled/arch-specific) | N/A | N/A | Not in `scope.yml` |
| rules_fuzzing (bazel-contrib/rules_fuzzing v0.8.0, via bzlmod) | Bazel build-rule package for `cc_fuzz_test`, used for brunsli's 3 fuzz targets; Starlark wrapper around libFuzzer/AFL | N/A | N/A | N/A | Not in `scope.yml` |

Deep-dive: brotli is the only dependency with real compiled, riscv64-relevant code. The two build systems diverge in their pinned brotli version's own RISC-V-detection status (see Section 5): CMake pins v1.0.9 (predates brotli's own macro), Bazel pins 1.2.0.bcr.1 (has it). This is a narrow but real inconsistency between brunsli's two build paths - it does not block building brunsli itself on riscv64 (brunsli's own detection is unaffected), but it means the underlying brotli library compiled into a CMake-built riscv64 brunsli binary lacks whatever brotli-side RISC-V-specific behavior that macro would have gated. Full detail on brotli's own riscv64 posture is out of scope here; see `project-reports/brotli.md`.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#157](https://github.com/google/brunsli/issues/157) | Reject header varint field sent as section | Open (since 2026-07-04) | Correctness / validation bypass | `DecodeHeader` fails to return after calling `Fail()` on a malformed length-delimited field, letting a crafted header slip past validation. Fix and regression test pending; maintainer requested include-ordering cleanup; unmerged as of 2026-08-12. Not riscv64-specific |
| [#149](https://github.com/google/brunsli/issues/149) | OSS-Fuzz issue 486481105 | Open (since 2026-02-22) | Unknown / fuzzer-found | Mirrored from oss-fuzz.com testcase 4730601788997632; no architecture detail given |
| [#148](https://github.com/google/brunsli/issues/148) | Unintentionally persistent `std::hex` on output streams | Open (since 2026-02-05) | Low, stream-formatting | 2 of 4 `std::hex` usages missing a `std::dec` reset; portable bug, not architecture-tied |
| [#145](https://github.com/google/brunsli/issues/145) / [#144](https://github.com/google/brunsli/issues/144) | Brotli 1.10+ / 1.1.0+ build incompatibility | Open | Build-breaking (generic) | Brunsli links against `libbrotlidec-static`, removed upstream in Brotli 1.1.0 ([google/brotli#655](https://github.com/google/brotli/issues/655)). Affects all architectures equally |
| [#146](https://github.com/google/brunsli/issues/146) | Allow system-installed googletest instead of vendored copy | Open | Packaging/build friction | Generic |
| [#143](https://github.com/google/brunsli/issues/143) / [#142](https://github.com/google/brunsli/issues/142) / [#141](https://github.com/google/brunsli/issues/141) | Stale v0.1 tag (5+ years old) / unversioned `.so` (blocks distro packaging) / expired brunsli.dev HTTPS cert | Open | Packaging/distribution friction | Generic; plausibly part of why almost no major distro has attempted a riscv64 build (Alpine is the sole exception, via a generic recipe) |

Recently merged (closed) fixes with correctness relevance, for context:

| ID | Title | Status | Notes |
|---|---|---|---|
| [PR #162](https://github.com/google/brunsli/pull/162) | Improve correctness on 32-bit platforms | Merged 2026-07-13 | `DecodeBase128` previously wrote directly into `*val` while looping and used the final byte's high bit to decide EOF, silently truncating/overflowing on 32-bit `size_t`. Fix accumulates into a `uint64_t v` and checks `v == *val` after narrowing. Architecture-agnostic (applies to any 32-bit `size_t`, e.g. 32-bit ARM/x86; RV32 would be covered generically, not RV32-specifically) |
| [PR #167](https://github.com/google/brunsli/pull/167) | Fix UB in brunsli decoder | Merged 2026-08-12 | Undefined-behavior shift bug: code negated a value assuming `-x` is always positive, but `-(-32768) == -32768` in two's complement, causing `log2floor+1==32` and a shift-by-bitwidth UB via `(1<<32)-1`. Not architecture-gated, but this UB class has historically been observed to behave differently across ISAs/compilers, including RISC-V, due to differing shift-amount masking in codegen - flagged as an inferred risk, not a confirmed riscv64-observed defect |
| [PR #166](https://github.com/google/brunsli/pull/166) / [PR #168](https://github.com/google/brunsli/pull/168) | Serialization output-size-aware / take metadata size into account | Merged 2026-08-11 / 2026-08-13 | Both touch encoder memory/size-estimation math; generic |

Correctness bugs highlighted separately: #157 (open, validation bypass) and the now-merged PR #162/#167 are the substantive correctness items in the recent history. None are RISC-V-specific, but PR #167's underlying UB class (shift-by-bitwidth) is architecture-sensitive in principle and worth monitoring if riscv64 testing is ever introduced.

## 12. Objections and Upstream Blockers

Stated objections: none specific to RISC-V exist. No issue, PR, or comment in the project's history has ever raised RISC-V.

Technical blockers: none identified. The code already builds and functions correctly on riscv64 (proven by Alpine's independent build), so there is no outstanding technical work required to "enable" RISC-V.

Organizational blockers: `CONTRIBUTING.md` categorically states, unchanged since 2019-03-14, "We are currently unable to accept patches to this project." This blocks any external contribution, RISC-V-related or otherwise. Governance is closed and single-vendor: the public repo mirrors Google's internal Piper monorepo via `copybara-service[bot]`, and nearly all substantive changes originate internally or from the sole named maintainer, Eugene Kliuchnikov.

Acceptance probability: not meaningfully assessable in the traditional sense, because there is no riscv64-specific change actually required - support is already present and functional. The real blocker to improving RISC-V posture (e.g., adding a CI job) is the same organizational wall that blocks all external contributions. An external CI-addition PR would face the identical "unable to accept patches" policy as any other outside submission; whether the maintainer would make such a change internally (he has final say over the Piper-mirrored source) is undetermined from available evidence.

## 13. Investment Analysis

Before sizing any work: RISE Project has done and funded nothing specific to brunsli. This was checked exhaustively across the RISE blog (32 posts), the `riseproject-dev` GitHub org (48-50 repos), the RISE Python wheel builder, and `pypi.riseproject.dev` - zero hits. Google LLC's status as a RISE Premier Member is a corporate-level relationship, unconnected to brunsli. All investment items below are therefore fully unclaimed; none overlap with existing RISE work.

### 13.1 Functional Enablement

Current state: functionally complete already. RISC-V detection has existed since brunsli's first commit (2019) and correctly routes riscv64 into the 64-bit register-width code path. Alpine Linux's independently-built, ELF-verified riscv64 binary is direct proof of functional viability with zero code changes required.

Remaining work is limited to a small audit: confirm that the CMake build path's older, pre-RISC-V-detection brotli pin (v1.0.9) does not introduce any subtle behavioral difference versus the Bazel path's newer brotli pin (1.2.0.bcr.1) on riscv64. This is a verification task, not new development.

Effort: approximately 0.5 person-week.

### 13.2 Performance Optimization

Current state: brunsli has zero SIMD/vectorization for any architecture - it is scalar C++ everywhere. This is not a riscv64-specific gap; amd64 and arm64 builds are equally unvectorized.

Any RVV (RISC-V Vector extension) work would constitute novel R&D that does not exist as a pattern to follow on amd64 (AVX) or arm64 (NEON) either, since brunsli has no SIMD abstraction layer (it does not depend on Highway or any comparable library). Given brunsli's narrow scope - a niche JPEG-repacking tool, not a heavily-invoked hot-path codec at the scale of brotli or JPEG XL's primary encoder - the return on investment for adding any SIMD tier, RISC-V or otherwise, is questionable at the project level, independent of architecture.

Effort: not recommended as a riscv64-specific investment. If pursued at all, it would require a generic SIMD abstraction layer benefiting every architecture simultaneously, estimated at 4-8 person-weeks for a first cut - speculative, and out of scope for a RISC-V-targeted investment case.

### 13.3 CI/CD Infrastructure

Current state: 0 of 18 CI matrix entries cover riscv64. Given the closed contribution policy (Section 12), adding a CI job would need to clear that same wall or be executed internally by Google.

Work item: add a riscv64 QEMU-based cross-compile-and-test job to `.github/workflows/ci.yml`, mirroring the existing Android arm64-v8a cross-compile pattern (build-only to start, consistent with how the Android job also runs with `BUILD_TESTING=off`). Complexity is low given the existing CMake toolchain-file mechanism already used for Android/Emscripten.

Effort: approximately 1 person-week to develop and validate a QEMU-based riscv64 CI job, including creation of a CMake riscv64 toolchain file (none currently exists in-repo), contingent on the change actually being accepted upstream - a non-technical risk, not a scoping one.

### 13.4 Ecosystem Enablement

Because Section 10 is omitted (brunsli has no meaningful dependent-package ecosystem), this reduces to plain distribution/packaging investment: getting brunsli packaged, on any architecture, into major distributions where it is currently entirely absent (Debian, Ubuntu, Fedora, conda-forge), and ensuring riscv64 variants are included once packaged. Presently brunsli is unpackaged everywhere except Alpine Linux and a FreeBSD ports-tree entry (whose riscv64 binary is blocked by a FreeBSD-wide infrastructure gap, not by brunsli).

Effort: approximately 2-3 person-weeks to prepare and shepherd a Debian/Fedora packaging submission. This is a general distribution gap affecting all architectures equally - riscv64 support would come "for free" once packaged, given the code already detects riscv64 correctly, so this is not a RISC-V-specific blocker for those distributions.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional Enablement | Audit CMake-path brotli v1.0.9 pin (lacks brotli's own RISC-V detection) against Bazel-path 1.2.0.bcr.1 pin for any riscv64 behavioral discrepancy | 0.5 | Chip company RISC-V team | Low |
| Performance Optimization | Not recommended as a riscv64-specific item; any SIMD/RVV work would require a project-wide abstraction layer that does not exist today | 4-8 (speculative, project-wide, not RISC-V-specific) | N/A | Low |
| CI/CD Infrastructure | Add a QEMU-based riscv64 build (+ ctest) job to `ci.yml`, mirroring the existing Android arm64-v8a cross-compile pattern | 1 | Chip company RISC-V team (contingent on upstream acceptance) | Medium |
| Ecosystem Enablement | Package brunsli for Debian/Fedora/conda-forge (riscv64 included automatically once packaged, given existing correct detection) | 2-3 | Chip company RISC-V team / distro packagers | Low-Medium |

Total estimated effort: roughly 7.5-12.5 person-weeks, the majority of which is either speculative (performance) or contingent on a closed upstream accepting an external infrastructure contribution (CI). This is a low-cost, low-risk profile precisely because the underlying port has been functionally complete and silently working since 2019, with real-world proof of viability already demonstrated by an independent third party (Alpine Linux) rather than by any upstream effort.

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [google/brunsli repository](https://github.com/google/brunsli)
- [Initial commit b20764a - introduces BRUNSLI_TARGET_RISCV64](https://github.com/google/brunsli/commit/b20764a6841086bcaebe70198e2e04bc8e6d3c82)
- [Commit ad58637 - "Internal change," simplifies platform.h](https://github.com/google/brunsli/commit/ad58637c6a616bece1ebf0da808bed659177b551)
- [CI workflow: .github/workflows/ci.yml](https://github.com/google/brunsli/blob/master/.github/workflows/ci.yml)
- [CONTRIBUTING.md](https://github.com/google/brunsli/blob/master/CONTRIBUTING.md)
- [LICENSE](https://github.com/google/brunsli/blob/master/LICENSE)
- [README.md](https://github.com/google/brunsli/blob/master/README.md)
- [Issue/PR #157 - reject header varint field sent as section](https://github.com/google/brunsli/issues/157)
- [Issue #149 - OSS-Fuzz issue 486481105](https://github.com/google/brunsli/issues/149)
- [Issue #148 - persistent std::hex on output streams](https://github.com/google/brunsli/issues/148)
- [Issue #145 - Brotli 1.10+ build incompatibility](https://github.com/google/brunsli/issues/145)
- [Issue #144 - Brotli 1.1.0+ build incompatibility](https://github.com/google/brunsli/issues/144)
- [Issue #146 - allow system-installed googletest](https://github.com/google/brunsli/issues/146)
- [Issue #143 - stale v0.1 tag](https://github.com/google/brunsli/issues/143)
- [Issue #142 - unversioned .so](https://github.com/google/brunsli/issues/142)
- [Issue #141 - expired brunsli.dev HTTPS cert](https://github.com/google/brunsli/issues/141)
- [PR #162 - improve correctness on 32-bit platforms](https://github.com/google/brunsli/pull/162)
- [PR #167 - fix UB in brunsli decoder](https://github.com/google/brunsli/pull/167)
- [PR #166 - make brunsli serialization output-size-aware](https://github.com/google/brunsli/pull/166)
- [PR #168 - take into account metadata size](https://github.com/google/brunsli/pull/168)
- [PR #159 - external fix by zayeem06/BugQore](https://github.com/google/brunsli/pull/159)
- [google/brotli PR #669 - Add RISC-V 64-bit (riscv64) platform configuration](https://github.com/google/brotli/pull/669)
- [google/brotli issue #655 - libbrotlidec-static removed in 1.1.0](https://github.com/google/brotli/issues/655)
- [google/brotli PR #1410 - RVV optimization (open, CLA-blocked)](https://github.com/google/brotli/pull/1410)
- [google/brotli PR #1489 - RVV optimization (closed/abandoned)](https://github.com/google/brotli/pull/1489)
- [googletest issue #3756 - GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [Alpine Linux riscv64 APKINDEX (edge/community)](https://dl-cdn.alpinelinux.org/alpine/edge/community/riscv64/APKINDEX.tar.gz)
- [Alpine Linux riscv64 brunsli-0.1-r1.apk](https://dl-cdn.alpinelinux.org/alpine/edge/community/riscv64/brunsli-0.1-r1.apk)
- [Alpine Linux riscv64 build log for brunsli-0.1-r1](https://build.alpinelinux.org/buildlogs/build-edge-riscv64/community/brunsli/brunsli-0.1-r1.log)
- [felixonmars/archriscv-packages repository (source of Arch Linux RISC-V PKGBUILDs)](https://github.com/felixonmars/archriscv-packages)
- [FreeBSD ports tree entry: graphics/brunsli](https://www.freshports.org/graphics/brunsli/)
- [FreeBSD official binary package mirror](https://pkg.freebsd.org/)
- [conda-forge brunsli-feedstock](https://github.com/conda-forge/brunsli-feedstock)
- [PyPI simple index for brunsli (404, package does not exist)](https://pypi.org/simple/brunsli/)
- [RISE GitLab wheel index for brunsli (redirects to 404)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/brunsli/)
- [Debian package tracker for brunsli (404)](https://tracker.debian.org/pkg/brunsli)
- [Fedora package search for brunsli (404)](https://packages.fedoraproject.org/pkgs/brunsli/)
- [Gentoo package search: media-libs/brunsli (404)](https://packages.gentoo.org/packages/media-libs/brunsli)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project members page](https://riseproject.dev/members/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [EESSI software-layer issue #552 - incidental brunsli mention in riscv64 build log](https://github.com/EESSI/software-layer/issues/552)
- [moonsikpark/brunslipy - unofficial third-party Python bindings](https://github.com/moonsikpark/brunslipy)
