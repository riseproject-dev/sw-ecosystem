---
title: Protocol Buffers
parent: Project Reports
color: orange
dependencies:
  - name: Abseil
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: utf8_range
    relation: runtime-dependency
    criticality: critical
  - name: re2
    relation: runtime-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: JsonCpp
    relation: test-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Bazel
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="protocol-buffers" %}

# Protocol Buffers

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Protocol Buffers<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Protocol Buffers (protobuf) is Google's language-neutral, platform-neutral mechanism for serializing structured data. It is the wire format underlying gRPC and is embedded throughout Google's infrastructure and in a large share of the broader cloud-native ecosystem (Kubernetes, Hadoop, Spark). The C++ runtime (`libprotobuf`) plus the `upb` C "micro" runtime are the canonical implementations; language runtimes for Java, Python, Go, Rust, C#, Ruby, PHP, and Objective-C are maintained in the same repository or as thin wrappers around the C++/upb core.

**Governance:** Wholly owned and governed by Google LLC (copyright footer on [protobuf.dev](https://protobuf.dev/): "Copyright 2026 Google LLC. All Rights Reserved"; `LICENSE` file: "Copyright 2008 Google Inc."). License is a 3-clause BSD-style license. There is no public governance charter, no MAINTAINERS/OWNERS file, and no foundation (not CNCF, Apache, or Linux Foundation hosted). The only ownership artifact is `.github/CODEOWNERS`, which routes language subdirectories to Google-internal GitHub teams under the `protocolbuffers` org. `CONTRIBUTING.md` confirms a Google-internal-first model: "a protobuf team member will be assigned to review the pull request," and Googlers are instructed to "first create an internal CL" (google3) since breaking API changes "must usually be implemented in google3 first."

**Maintainers:** Of roughly 3,266 commits sampled over the trailing ~1 year, "Protobuf Team Bot" (the Piper-to-GitHub copybara sync bot) accounts for 1,667 (over 50%), meaning the true majority of code originates inside Google's internal `google3` codebase regardless of bot attribution. Named human committers in that window are overwhelmingly Google employees: Clayton Knittel, Samuel Benzaquen, Joshua Haberman (upb creator), Mike Kruskal, Hong Shin, Karen Wu, Mark Hansen, Rachel Goldfinger, Adam Cozzette, Tony Liao, Jie Luo, and others. No other company appears among top contributors. This is effectively a single-vendor project that accepts outside patches only as reviewed by Google staff.

**Community posture on new ports:** Consistently declined on resourcing/roadmap grounds, not technical grounds. Maintainer `zhangskz` closed the riscv64 tracking issue and its implementation PR in March 2024 citing internal release-process staffing and (at the time) the absence of manylinux riscv64 images. Maintainer `googleberg` stated in August 2024 (issue [#17798](https://github.com/protocolbuffers/protobuf/issues/17798)): "riscv64 is not a platform supported by the protobuf project... we currently don't want to expand the release process to include the additional overhead of releasing a riscv64 version." In August 2025 (PR [#23206](https://github.com/protocolbuffers/protobuf/pull/23206)) the same maintainer reiterated: "RISC-V isn't on our roadmap... As an unsupported platform, we wouldn't be testing RISC-V or guaranteeing that it stays unbroken. But if the changes to support aren't too extensive and you're willing to make the changes and deal with occasional breakages, we'll review and allow your changes." There is no PLATFORMS.md, SUPPORT.md, or docs/platforms directory; riscv64 support, where it exists at all in the build graph, arrived passively as a side effect of a Bazel platform-constraint-list update, not through an RFC or dedicated porting effort.

**RISE involvement:** Google LLC is a RISE Premier Member (alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent), but Protocol Buffers as a project has no direct RISE affiliation. All 35 posts on the [RISE Project blog](https://riseproject.dev/blog) were checked (including the one plausibly adjacent title, the IREE/object-detection post, fetched in full) and none mention Protocol Buffers or protoc. The [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) index lists 87 supported packages; protobuf is not among them, even though the underlying GitLab package registry (project 56254198) does separately host community-built riscv64 wheels for `protobuf` 7.35.1 (see Section 8). The 26-repo `riseproject-dev` GitHub org has no repository related to Protocol Buffers, and a GitHub search for "Protocol Buffers org:riseproject-dev" returns zero results.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2018-03-25 | First RISC-V issue: [#4425](https://github.com/protocolbuffers/protobuf/issues/4425), "Issues when cross-compiling for RISC-V" (protobuf v3.5.1). Undefined reference to `Release_CompareAndSwap` in atomic stubs. | [Issue #4425](https://github.com/protocolbuffers/protobuf/issues/4425) |
| 2018-04-16 | Issue #4425 closed; no fix documented in the thread. | [Issue #4425](https://github.com/protocolbuffers/protobuf/issues/4425) |
| 2023-03-16 | PR [#12244](https://github.com/protocolbuffers/protobuf/pull/12244), "feat: support riscv64," opened by `ernado` (draft), motivated by the Kubernetes build pipeline's need for riscv64. Author admitted unfamiliarity with the codebase and asked for build guidance. | [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244) |
| 2023-03-17 | Issue [#12266](https://github.com/protocolbuffers/protobuf/issues/12266), "Add riscv64 support," opened as the tracking ticket for PR #12244. | [Issue #12266](https://github.com/protocolbuffers/protobuf/issues/12266) |
| 2023-10-27 | Issue [#14549](https://github.com/protocolbuffers/protobuf/issues/14549), "Build fails on RISCV": linker error `undefined reference to __atomic_exchange_1` in abseil-cpp's `libabsl_log_internal_globals.a`. | [Issue #14549](https://github.com/protocolbuffers/protobuf/issues/14549) |
| 2023-11-02 | Issue #14549 closed. Maintainer `hlopko` deflected it as an abseil problem; community member `apcameron` subsequently posted a working CMake patch (`set(protobuf_LINK_LIBATOMIC true)` when `CMAKE_SYSTEM_PROCESSOR MATCHES "riscv"`) and asked for reopening, but the issue was not reopened and the patch was never merged. A second commenter (`Boring545`, 2024-07-16) confirmed the workaround works. | [Issue #14549](https://github.com/protocolbuffers/protobuf/issues/14549) |
| 2024-03-05 | PR #12244 and issue #12266 both closed by maintainer `zhangskz`, quoted in full: "Unfortunately, adding support for riscv64 would also require us to update our internal release process and images accordingly to compile for riscv64, which we are unlikely to be able to staff at the moment especially considering lack of support in manylinux currently: pypa/manylinux#1426... it appears Kubernetes itself does not officially support riscv64 either. Closing accordingly, but we can revisit this in the future if demand changes." | [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244), [Issue #12266](https://github.com/protocolbuffers/protobuf/issues/12266) |
| 2024-08-13 | Issue [#17798](https://github.com/protocolbuffers/protobuf/issues/17798), "Maven central protoc prebuilts for riscv64," filed by `DingliZhang`, citing that Ubuntu already packages protobuf for riscv64 while Maven-based projects (Hadoop, plugins) have no prebuilt `protoc`. | [Issue #17798](https://github.com/protocolbuffers/protobuf/issues/17798) |
| 2024-09-09/10 | Issue #17798 closed. Maintainer `googleberg`: "riscv64 is not a platform supported by the protobuf project... we currently don't want to expand the release process to include the additional overhead of releasing a riscv64 version," with openness to reconsidering given more demand and to reviewing external PRs. No artifact was ever published against this issue despite its "completed" state_reason - the thread's substance is a decline, not a resolution. | [Issue #17798](https://github.com/protocolbuffers/protobuf/issues/17798) |
| 2025-07-20 | pypa/manylinux#1743 merged, adding `manylinux_2_39_riscv64` and `musllinux_1_2_riscv64` images, resolving the manylinux blocker cited for closing PR #12244 (not a protobuf-side action). | [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244) (comment by `luhenry`, 2025-10-30) |
| 2025-08-21 | PR [#23205](https://github.com/protocolbuffers/protobuf/pull/23205), "feat(protoc): Adds support for building protoc on the RISC-V platform and provides protoc prebuilt binaries," opened by `zhanchangbao-sanechips` (Sanechips/ZTE), addressing #17798. Reporter built protoc natively on a Sophgo SG2042 RISC-V chip and used it to successfully build Hadoop and Spark. Closed same day by the author (branch `support-riscv` deleted) after the Google CLA bot notice; no maintainer review occurred. | [PR #23205](https://github.com/protocolbuffers/protobuf/pull/23205) |
| 2025-08-21 | PR [#23206](https://github.com/protocolbuffers/protobuf/pull/23206), a refiled duplicate of #23205 targeting the `3.20.x` release branch. | [PR #23206](https://github.com/protocolbuffers/protobuf/pull/23206) |
| 2025-08-25 | PR #23206 closed by `googleberg`: "I'm sorry, we don't accept external changes to release branches." | [PR #23206](https://github.com/protocolbuffers/protobuf/pull/23206) |
| 2025-08-27 | `googleberg` clarifies: "Protoc can be built using bazel... or cmake... RISC-V isn't on our roadmap... But if the changes to support aren't too extensive and you're willing to make the changes and deal with occasional breakages, we'll review and allow your changes." No follow-up PR against `main` has been filed by `zhanchangbao-sanechips` as of the research date. | [PR #23206](https://github.com/protocolbuffers/protobuf/pull/23206) |
| 2025-10-30 | `luhenry` comments on PR #12244 noting the manylinux blocker is resolved (pypa/manylinux#1743). No maintainer response on record. | [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244) |
| 2026-05-18 | `nickolaev` comments on issue #12266 asking to reconsider now that manylinux support has improved. Issue remains closed, not reopened. | [Issue #12266](https://github.com/protocolbuffers/protobuf/issues/12266) |
| 2026-05-20 | Commit `907dfa779067ecc265c1d16e7a46815e56202f12` ("Fasttable: Fix ODR errors and create dual staleness test"), authored by the Protobuf Team Bot (PiperOrigin-RevId: 918507979), updates `upb/BUILD`'s platform-constraint list to include `@platforms//cpu:riscv64` among nine 64-bit CPU platforms. This is incidental to a broader ODR bugfix, not a standalone riscv64 porting effort, and is the only "riscv" string in the repository. | `upb/BUILD` (git blame) |

**Status:** No riscv64-specific code has ever been merged into `protocolbuffers/protobuf`. All identified riscv64-tagged issues and PRs (#4425, #12266, #12244, #14549, #17798, #23205, #23206) are closed without landing any riscv64 implementation, toolchain file, CI job, or prebuilt artifact. The repository's only acknowledgment of riscv64 is a generic CPU-platform label in a Bazel `BUILD` file, introduced as a byproduct of an unrelated fix.

**Key contributors with RISC-V involvement:**
- `ernado` (affiliation unlisted): opened PR #12244, motivated by Kubernetes
- `DingliZhang` (affiliation unlisted): issue #17798, Maven Central request
- `apcameron`: identified and posted the working `-latomic` CMake fix for issue #14549 (never merged)
- `zhanchangbao-sanechips` (Sanechips/ZTE): PRs #23205 and #23206, the only submitter with a tested, working riscv64 protoc build (verified on Sophgo SG2042 hardware, verified downstream Hadoop/Spark builds)
- `luhenry`, `nickolaev`: 2025-10 and 2026-05 community prompts to reopen the tracking issue/PR now that the manylinux blocker is resolved; neither has drawn a maintainer response

## 3. Upstream Support Tier

No formal platform tier policy document (no PLATFORMS.md or SUPPORT.md) exists in the repository. [protobuf.dev's support page](https://protobuf.dev/) defines only a release-cadence tiering (Active Support vs. Maintenance Only, quarterly cadence), delegated per-language, with no unified CPU-architecture stance. Supported platforms are implicitly those tested in CI and shipped with prebuilt release artifacts.

| Criterion | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|-----------|---------------|-----------------|---------|
| CI build coverage | Yes | Yes | No |
| CI test coverage | Yes | Yes (emulation) | No |
| Release artifact (protoc .zip) | Yes (`protoc-36.2-linux-x86_64.zip`) | No (v36.2's Linux assets are x86_32/64, ppcle_64, s390_64; aarch64 only via osx) [NEEDS VERIFICATION - Linux aarch64 asset presence should be re-confirmed per release] | No |
| Maven Central artifact | Yes | Yes (historically) | No |
| PyPI native wheel | Yes | Yes (`manylinux2014_aarch64`) | No |
| Official Bazel platform/toolchain definition | Yes | Yes | No |
| Maintainer statement | First-class | First-class | "Not on our roadmap" (`googleberg`, Aug 2025) |

**Assessment:** riscv64 is unsupported upstream, with no formal path to support absent a change in Google's resourcing or a stronger customer-demand signal (explicitly: Cloud/Kubernetes adoption, per `zhangskz`/`googleberg`).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Protobuf has no JIT compiler and no garbage collector. Architecture-specific code is limited to SIMD-accelerated UTF-8 validation (in the vendored `utf8_range` dependency), an optimized parse dispatch table ("fasttable" in `upb`), musttail calling-convention hints, prefetch intrinsics, and atomic-operation linking requirements.

A direct repo-wide case-insensitive grep for `riscv` found exactly one hit (`upb/BUILD`, the platform-constraint list discussed above); a grep for `__riscv` / `__riscv64__` found zero hits anywhere in the source tree. No `arch/riscv/` directory, no `.S` assembly file referencing riscv, and no RVV intrinsic (`vfloat32m1_t` or similar) exists anywhere in the repository.

| Component | Description | amd64 | arm64 | riscv64 |
|-----------|-------------|-------|-------|---------|
| Architecture macro | Named arch detection, `stubs/platform_macros.h` | `GOOGLE_PROTOBUF_ARCH_X64` | `GOOGLE_PROTOBUF_ARCH_ARM64` | None - falls through to the generic path |
| Varint decode fast path (`parse_context.h`, `VarintParse`) | Inline bit-trick decoding | Partial: inline GCC asm (`RotRight7AndReplaceLowByte`, `btc` bit-test via `varint_shuffle.h`) | Full: hand-written UBFX/ORR/LSL bit-extraction algorithm, approximately 230 lines of documented ARM-specific bit tricks | Missing - uses the generic portable C `VarintParseSlow`/shuffle-mask fallback, the same path any unlisted architecture takes |
| upb "fasttable" decoder dispatch (`UPB_FASTTABLE_SUPPORTED`, `upb/port/def.inc`) | Lookup-table field dispatch using `preserve_none`/`musttail` attributes | Enabled (`__x86_64__`) | Enabled (`__AARCH64EL__` only, i.e. little-endian aarch64) | Missing - guard tests `__x86_64__ \|\| __AARCH64EL__` only; riscv64 falls to the slow/generic upb decoder despite being listed as "any_64bit" elsewhere in the Bazel config |
| TcParser musttail/tailcall (`PROTOBUF_MUSTTAIL`, `PROTOBUF_TAILCALL`, `port_def.inc`) | Tail-call dispatch in the C++ table-driven parser | Enabled | Enabled | Missing - macro is empty; guard is `__aarch64__ \|\| __x86_64__ \|\| _M_X64` only |
| Prefetch hints (`port.h`) | Inline prefetch in the parse loop | Enabled (x86 `prefetcht0`, clang >= 19) | No-op | No-op (shared gap with arm64, not riscv64-specific) |
| UTF-8 SIMD validation (`third_party/utf8_range`) | String-field UTF-8 validation | Full SIMD: `range-sse.c`, `range2-sse.c`, `lemire-sse.c` (SSE4.1), plus AVX2 variants | Full SIMD: `range-neon.c`, `range2-neon.c`, `lemire-neon.c` (ARM NEON, 64-bit only) | Scalar only: dispatch in `utf8_range.c` is `#if defined(__SSE4_1__) \|\| (defined(__ARM_NEON) && defined(__ARM_64BIT_STATE)) ... #else <scalar fallback>`; riscv64 takes the portable byte-at-a-time naive validator. A grep for `riscv`/`rvv`/`__riscv` inside `third_party/utf8_range` returns zero matches - no RVV path exists or is in progress |
| Varint SIMD (in progress, issue [#26931](https://github.com/protocolbuffers/protobuf/issues/26931)) [NEEDS VERIFICATION] | Vectorized encode/decode | Not addressed | SVE2 path under development; loop unrolling shows ~30% improvement, SVE2 projected ~2.5x encode / ~65% decode | Not mentioned; no RVV equivalent proposed |
| Sub-word atomic linking | `std::atomic<uint8_t>`/`uint16_t` operations | Hardware-native, no issue | Hardware-native, no issue | Requires explicit `-latomic` link; neither protobuf's nor abseil's CMake injects this automatically for riscv64 (see Section 5 and 9) |

**Summary:** riscv64 uses the scalar/generic C/C++ fallback for every performance-sensitive path in the codebase. This is functionally correct - it is the same code path 32-bit ARM, POWER, s390x, and any other unlisted platform share, and it is why distro packagers can build `protobuf-compiler` for riscv64 today - but it carries none of the x86_64/aarch64 hand-tuned optimizations: no SIMD UTF-8 validation, no bit-trick varint decode, no fasttable dispatch, no tail-call codegen. The correct characterization is "riscv64-specific code is absent," not "riscv64-specific code is a broken stub": there is no riscv64 implementation to be incomplete.

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems:** CMake (primary for C++ library builds) and Bazel (primary for CI and release-artifact generation). No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists anywhere in the repository.

**CMake minimum version:** `cmake_minimum_required(VERSION 3.16...3.26)` in the root `CMakeLists.txt`.

**C++ standard:** C++17 minimum, enforced with a `FATAL_ERROR` check in `CMakeLists.txt` if `CMAKE_CXX_STANDARD < 17`. No specific GCC/Clang minimum version number is documented anywhere in the repository for any architecture.

**Practical GCC minimum for riscv64 (community-observed, not upstream-stated):** GCC 11+ was used in the community riscv64 cross-compilation reported in abseil issue [#1702](https://github.com/abseil/abseil-cpp/issues/1702). GCC 12 was used in the native riscv64 build failure in issue [#14549](https://github.com/protocolbuffers/protobuf/issues/14549). The exact `riscv64-unknown-linux-gnu-g++` 12 toolchain that failed with `undefined reference to __atomic_exchange_1` is documented in that issue's linker error.

**Documented CMake build options** (root `CMakeLists.txt`; none are riscv-specific):
```
protobuf_INSTALL                    ON
protobuf_BUILD_TESTS                OFF
protobuf_BUILD_CONFORMANCE          OFF
protobuf_BUILD_EXAMPLES             OFF
protobuf_BUILD_PROTOBUF_BINARIES    ON
protobuf_BUILD_PROTOC_BINARIES      ON
protobuf_BUILD_LIBPROTOBUF          ON
protobuf_BUILD_LIBPROTOC            OFF
protobuf_BUILD_LIBUPB               ON
protobuf_DISABLE_RTTI               OFF
protobuf_ALLOW_CCACHE               OFF
protobuf_FORCE_FETCH_DEPENDENCIES   OFF
protobuf_LOCAL_DEPENDENCIES_ONLY    OFF
protobuf_USE_UNITY_BUILD            OFF
protobuf_BUILD_SHARED_LIBS          (platform default)
protobuf_WITH_ZLIB                  (platform default)
```

**Generic documented build/install sequence (`cmake/README.md`):**
```bash
cmake -S . -B build -DCMAKE_INSTALL_PREFIX=../install -DCMAKE_BUILD_TYPE=Release
cmake --build build --parallel 10
ctest --test-dir build --verbose
cmake --install build
```
None of these include a `-DCMAKE_SYSTEM_PROCESSOR=riscv64` or `-DCMAKE_TOOLCHAIN_FILE=...riscv...` option, because no such option or toolchain file exists upstream. No `cmake/riscv64.cmake` or equivalent toolchain file exists for any architecture.

**Native build on riscv64 (community pattern, not upstream-published):**
```bash
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_STANDARD=17 \
  -Dprotobuf_BUILD_TESTS=OFF \
  -Dprotobuf_LOCAL_DEPENDENCIES_ONLY=ON \
  -Dprotobuf_ABSL_PROVIDER=package \
  -DCMAKE_EXE_LINKER_FLAGS="-latomic" -DCMAKE_SHARED_LINKER_FLAGS="-latomic" \
  -G Ninja
cmake --build build --parallel $(nproc)
cmake --install build
```
The `-latomic` flags are required to avoid the sub-word atomic linker failure documented in issue #14549.

**Cross-compilation:** No upstream CMake toolchain file for riscv64 exists. PR [#23205](https://github.com/protocolbuffers/protobuf/pull/23205) used host triplet `riscv64-openEuler-linux-g++` and verified the ELF format as `elf64-littleriscv` when building protoc natively on a Sophgo SG2042. A `-DWITH_PROTOC=/path/to/host/protoc` flag is required to supply an x86_64 host protoc binary when cross-compiling, since the cross-compiled binary cannot execute on the build host - the same mechanism the upstream aarch64 cross-compilation CI job uses via `cross-compile-protoc@v5`.

**QEMU:** No QEMU-based riscv64 configuration exists anywhere in the repository (confirmed by a repo-wide grep for "qemu" returning zero hits). CI uses QEMU emulation for aarch64 via an `emulation:8.0.1-aarch64-*` container image; no equivalent riscv64 image is published or referenced. Community riscv64 work (PR #23205) used native hardware (Sophgo SG2042).

**Bazel toolchain:** No `linux-riscv_64` platform entry exists in `toolchain/platforms.bzl`, and no riscv64 cross-compilation toolchain config exists in `toolchain/toolchains.bazelrc` or `toolchain/cc_toolchain_config.bzl`. The sole Bazel-level reference to riscv64 is the `@platforms//cpu:riscv64` constraint-list entry in `upb/BUILD` described in Section 2 and 4, which is a platform-compatibility label, not a toolchain definition.

**Legacy autotools (protobuf v3.x, from issue #4425 and PR #23205):**
```bash
CC=riscv64-unknown-linux-gnu-gcc \
CXX=riscv64-unknown-linux-gnu-g++ \
./configure \
  --prefix=$RISCV \
  --target=riscv64-unknown-linux-gnu \
  --host=x86_64-pc-linux-gnu
```

**Critical, unresolved build defect:** riscv64 toolchains require explicit `-latomic` linkage for sub-word atomics (`uint8_t`, `uint16_t` compare-and-swap/exchange) that the compiler does not lower inline on this architecture, unlike x86_64 and aarch64 where these are hardware-native. The symptom (issue #14549) is a linker error:
```
undefined reference to `__atomic_exchange_1'
```
originating in `absl/log/libabsl_log_internal_globals.a(globals.cc.o)`. A community-supplied CMake fix exists (`apcameron`'s patch, quoted in Section 2) but was never merged into protobuf's own `CMakeLists.txt`; this defect remains present in the upstream build today.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---------|-------|-------|---------|----------|
| Library builds and installs | Yes | Yes | Yes (native and cross, with the `-latomic` workaround) | None |
| `protoc` compiler (source build) | Yes | Yes | Yes, from source; no prebuilt | Distribution |
| UPB fasttable parser | Enabled | Enabled (little-endian only) | Disabled | Performance |
| TcParser musttail dispatch | Enabled | Enabled | Disabled | Performance |
| UTF-8 validation SIMD | SSE4.1/AVX2 | ARM NEON | Scalar naive loop | Performance |
| Varint SIMD (future work) [NEEDS VERIFICATION] | Not addressed | SVE2 in progress (#26931) | Not proposed | Performance |
| Prefetch in parse loop | x86 `prefetcht0` | No-op | No-op | Performance (shared with arm64) |
| Named architecture macro | Yes | Yes | No | Minor (tooling) |
| Official prebuilt protoc binary | Yes | No, for current releases' Linux assets per the live v36.2 asset list (aarch64 appeared historically; current Linux assets are x86_32/64, ppcle_64, s390_64) [NEEDS VERIFICATION] | No | Distribution |
| Bazel platform definition | Yes | Yes | No | Build system |
| Cross-compilation toolchain | Yes | Yes | No (community-only) | Build system |
| CI-guaranteed correctness | Yes | Yes | No | Support |
| Sub-word atomic safety | Yes (hardware) | Yes (hardware) | Requires `-latomic` workaround, unmerged | Build reliability |

**Functional gap:** None confirmed at the correctness level once the `-latomic` workaround is applied. The library compiles and runs correctly on riscv64 when built with that flag; no open riscv64 correctness regression exists in the tracker (see Section 11).

**Performance gaps:** The fasttable decoder and musttail dispatch are the highest-impact gaps, since they optimize the hot field-dispatch loop in the C++/upb parsers. No published benchmark comparing protobuf encode/decode throughput on riscv64 versus x86_64 or aarch64 was found in any searched source: data not available. The utf8_range naive scalar fallback processes one byte per iteration versus 16 bytes per NEON/SSE4.1 iteration on arm64/amd64; the resulting throughput ratio for string-heavy workloads is architecturally plausible to be an order of magnitude, but exact figures are not available from research data.

**Security hardening gaps:** Data not available: no riscv64-specific hardening (CFI, stack-clash protection, pointer authentication equivalents) research was found for this project; this is consistent with the absence of any riscv64-specific code to harden.

**NaN / floating-point semantics:** Issue [#27446](https://github.com/protocolbuffers/protobuf/issues/27446) [NEEDS VERIFICATION - present only in the prior version of this assessment, not re-confirmed by this session's live research]: `MessageDifferencer::Equals(msg, msg)` reportedly returns `false` when the message contains NaN float/double fields, violating reflexivity. This affects all architectures equally and is not riscv64-specific; the live research pass for this report explicitly searched for riscv64-tagged NaN/floating-point issues and found none.

## 7. CI/CD Infrastructure

All 26 GitHub Actions workflow files in `.github/workflows/` were directly read/searched: `staleness_check.yml`, `janitor.yml`, `test_rust.yml`, `test_release_branches.yml`, `test_csharp.yml`, `release_bazel_module.yaml`, `test_runner.yml`, `test_php_ext.yml`, `test_objectivec.yml`, `test_python.yml`, `clear_caches.yml`, `staleness_refresh.yml`, `update_php_repo.yml`, `test_cpp.yml`, `test_java.yml`, `test_bazel.yml`, `scorecard.yml`, `test_ruby.yml`, `test_php.yml`, `test_upb.yml`, `publish_to_bcr.yaml`, `forked_pr_workflow_check.yml`, `test_hpb.yml`, `test_yaml.yml`, and three more making 26 total. A case-insensitive grep for `riscv|RISCV|RISC-V|risc-v` across all of them returns zero matches. This was independently corroborated via GitHub's code-search index (`riscv path:.github/workflows repo:protocolbuffers/protobuf` and `"RISC-V" repo:protocolbuffers/protobuf`, both zero results), confirming the absence is genuine and not a tooling gap - the same search index successfully finds the one true `riscv64` hit in `upb/BUILD`, proving the index is live against this repository. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

| CI axis | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Build job | Yes | Yes | No |
| Test job | Yes | Yes (QEMU emulation) | No |
| Release artifact job | Yes | Yes | No |
| Conformance test | Yes | Yes | No |
| QEMU emulation runner | n/a | Yes (`emulation:8.0.1-aarch64-*` image) | No image exists |
| RISE-hosted runner | n/a | n/a | None found |

All runners observed across every workflow are standard hosted runners (`ubuntu-latest`, `windows-latest`, `macos-latest`) or self-hosted x86 pools; no `linux/riscv64` QEMU/Docker multi-arch step was found anywhere. `test_runner.yml` uses only `ubuntu-latest`; `test_rust.yml` uses `ubuntu-22-4core` and `windows-2022`. No riscv64 runner of any kind is referenced in any workflow.

## 8. Distribution and Release Status

**GitHub Releases (official protoc prebuilt binaries):** Fetched the live releases page directly. Latest release v36.2 (alongside v36.1, v36.0, v36.0-rc2, v36.0-rc1) ships `protobuf-36.2.{bazel.tar.gz,tar.gz,zip}` plus `protoc-36.2-linux-{aarch_64,ppcle_64,s390_64,x86_32,x86_64}.zip` and `protoc-36.2-osx-aarch_64.zip`. No `riscv64` asset exists in this or any checked release.

**PyPI (`protobuf` package):** Fetched `https://pypi.org/pypi/protobuf/json` directly (the real package name; "protocol-buffers" does not exist on PyPI and 404s/redirects). Latest version 7.36.2 ships 8 files: `manylinux2014_{aarch64,s390x,x86_64}`, `macosx_10_9_universal2`, `win32`, `win_amd64`, a `py3-none-any` pure-Python wheel, and the sdist. No riscv64 wheel exists upstream. riscv64 users installing from PyPI directly receive the pure-Python `py3-none-any` wheel (no compiled C extension, no native performance) or must build the sdist from source.

**RISE community wheel builder:** The RISE GitLab wheel registry (project 56254198, `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/protobuf/`) hosts four riscv64 wheels independently of upstream PyPI: `protobuf-7.35.1-cp312-cp312-manylinux_2_31_riscv64.manylinux_2_39_riscv64.whl`, plus cp313 and two cp314 builds (`cp314` and `cp314t`). This wheel builder's own package index at [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/) does not list protobuf among its 87 titled packages even though the underlying registry serves it - a listing/registry discrepancy worth noting for anyone searching the documented index rather than querying the registry API directly.

**Maven Central (protoc artifact):** No `protoc-*-linux-riscv64.exe` artifact exists for any version. This was the explicit, unresolved subject of issue [#17798](https://github.com/protocolbuffers/protobuf/issues/17798) (closed September 2024 without a published artifact). PR [#23205](https://github.com/protocolbuffers/protobuf/pull/23205) produced a working riscv64 protoc binary on Sophgo SG2042 hardware and used it to compile Hadoop and Spark successfully, but the PR was not merged and no artifact reached Maven Central.

**Ubuntu 26.04 "resolute":** Verified live against `packages.ubuntu.com/resolute/protobuf-compiler` (HTTP 200): the architecture table explicitly lists a `riscv64` row with a working download link, version **protobuf-compiler 3.21.12-15ubuntu1**. Related binary packages (`libprotobuf-dev`, `libprotobuf32t64`, `libprotobuf-c-dev`, `libprotobuf-c1`, `python3-protobuf`, `librust-protobuf-dev`) are also listed for riscv64 in this suite, though riscv64-specific confirmation was performed only for `protobuf-compiler` itself; the rest are architecture-table listings, not individually re-verified downloads.

**Ubuntu 24.04 (noble):** `libprotobuf-dev` and `python3-protobuf`, version 3.21.12-8.2build1, are listed for riscv64. [NEEDS VERIFICATION against a source beyond the packages.ubuntu.com listing.]

**Debian unstable (sid):** `protobuf` 3.21.12-16 shows "Installed" status on riscv64, built by buildd node `rv-manda-03`.

**Important caveat on distro packaging quality:** Whether the Debian/Ubuntu riscv64 build is a clean, unpatched build of the upstream source, or carries distro-side patches (e.g., for the unresolved `-latomic` sub-word atomics defect in Section 5), is not established by any source in this research. [NEEDS VERIFICATION]. This uncertainty is the deciding factor in this project's readiness grade (Section 13): absent confirmation that the distro build is unpatched and otherwise representative of upstream, the existence of distro packages alone is not treated as equivalent to verified upstream riscv64 support.

**Arch Linux RISC-V:** Data not available - the archriscv.felixc.at search page did not expose a resolvable package-search endpoint in this session (`?q=protobuf`, `/riscv64/extra/`, `/repo`, `/extra/os/riscv64/*`, `/status` all 404'd or redirected without a usable listing). Expected to track upstream Arch given the port's general posture, but unconfirmed.

**What a user must do today to get a working riscv64 binary:**
1. Build protoc from source on riscv64 hardware, or cross-compile supplying a host protoc via `-DWITH_PROTOC`.
2. Add `-latomic` to CMake linker flags (GCC 11-12 toolchains fail without it).
3. For Java/Maven builds: build protoc from source and install locally; no prebuilt riscv64 Maven artifact exists.
4. For Python: either install the RISE wheel-builder's riscv64 wheel (cp312-cp314, protobuf 7.35.1) directly from GitLab project 56254198's package registry, or accept the `py3-none-any` pure-Python wheel from PyPI (no native extension).
5. On Debian/Ubuntu, install the distro-packaged `protobuf-compiler`/`libprotobuf-dev` (version 3.21.12, several major releases behind current upstream 36.x) with the patch-provenance caveat above in mind.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| **Abseil** (runtime-dependency, critical) | Core C++ foundation: strings, hashing, containers, CRC32C, synchronization, logging; linked directly into libprotobuf | Builds. `libabsl-dev`/`libabsl20260107` confirmed in Ubuntu 26.04 "resolute" riscv64 (`20260107.0-4`). Cross-compile with GCC 11-12 hits the `__atomic_exchange_1` undefined-reference failure unless `-latomic` is added. | Open SEGFAULT on Debian riscv64 with GCC 15.2 ([abseil #2002](https://github.com/abseil/abseil-cpp/issues/2002), open, no upstream response); passes on Ubuntu riscv64. | Source-only; distro `libabsl-dev` package is the real release channel, no official riscv64 binary release. | [abseil #1702](https://github.com/abseil/abseil-cpp/issues/1702) (open): `-latomic` not auto-injected for GCC 11 riscv64 cross-compiles. [abseil #1236](https://github.com/abseil/abseil-cpp/issues/1236) (open): ILP32E alignment issue, low severity. [abseil #1561](https://github.com/abseil/abseil-cpp/issues/1561) (closed, no real fix): "Riscv build of Protobuf fails due to abseil." CRC32C hardware acceleration via Zbc/Zbkc stalled in review ([abseil PR #1986](https://github.com/abseil/abseil-cpp/pull/1986)). |
| **zlib** (runtime-dependency, optional) | Optional wire-format message compression | Confirmed present on Ubuntu 24.04 (noble) riscv64 as `zlib1g`/`zlib1g-dev`; Debian sid riscv64 "Installed." Not independently re-confirmed for 26.04 "resolute" this session. [NEEDS VERIFICATION]. No riscv64 SIMD; falls back to portable C. | No known riscv64 test failures (zero riscv64-tagged GitHub issues on madler/zlib). | Source-only upstream; distro-packaged. | None open. |
| **utf8_range** (runtime-dependency, critical) | UTF-8 field validation, vendored in-tree at `third_party/utf8_range` | Builds on riscv64 via the generic scalar fallback. Direct source inspection shows this dependency has real SIMD backends (`lemire-avx2.c`, `lemire-sse.c`, `lemire-neon.c`, `range-avx2.c`, `range-sse.c`, `range-neon.c`, `range2-sse.c`, `range2-neon.c`) with dispatch gated on `__SSE4_1__`/`__ARM_NEON`; riscv64 takes the `#else` naive byte-at-a-time path. A grep for `riscv`/`rvv`/`__riscv` inside this dependency returns zero matches. | No riscv64-specific test issues found upstream (zero GitHub hits on protocolbuffers/utf8_range). | Ships embedded in the protobuf source tarball/release, not packaged independently; no standalone distro package exists. | None filed, but an undocumented SIMD-coverage gap exists: correctness is fine, performance is unaudited, no RVV path exists or is planned. |
| **re2** (runtime-dependency, optional) | Regex matching in protoc option parsing and TextFormat | Confirmed on Ubuntu 24.04 (noble) riscv64 as `libre2-10`/`libre2-dev`; Debian sid riscv64 builds `20251105-1+b1`. Not re-confirmed for 26.04 "resolute" this session. [NEEDS VERIFICATION]. | No riscv64-specific test failures (zero riscv64 issues on google/re2). | Source-only upstream; distro-packaged. | None open (inherits abseil's `-latomic` issue only transitively). |
| **googletest** (test-dependency, optional) | Test-only | Confirmed in Ubuntu 26.04 LTS riscv64, `1.17.0-1build1`, `arch: all`. | Open: [googletest #3756](https://github.com/google/googletest/issues/3756), `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (`GetThreadCount()` returns 0 instead of 1). Self-test failure; does not propagate to protobuf's own test results. | Source/`arch: all` only; no prebuilt riscv64 binary needed. | googletest #3756 (open, minor, non-blocking for protobuf). |
| **JsonCpp** (test-dependency, optional) | Conformance-test runner and TextFormat JSON codec, test-only | Pure C++, no architecture-specific code; zero riscv64-specific GitHub issues found. Presumed to build on riscv64 but not independently confirmed in Ubuntu 26.04 "resolute" this session. [NEEDS VERIFICATION]. | No riscv64-specific test issues found. | Source-only. | None found. |
| **CMake** (build-dependency, critical) | Primary alternative build system for the C++ library; minimum version 3.16-3.26 enforced in root `CMakeLists.txt` | CMake itself is broadly available on riscv64 via standard distro packaging (Debian/Ubuntu ship `cmake` for riscv64); no protobuf-specific CMake/riscv64 incompatibility beyond the unmerged `-latomic` gap described in Section 5. | n/a (build tool, not a tested library) | Distro-packaged. | None specific to CMake itself; the open defect is in protobuf's own CMake logic (sub-word atomics), not in CMake. |
| **Bazel** (build-dependency, critical) | Primary build system for CI and release-artifact generation | Bazel's own riscv64 support is independent of protobuf; protobuf's own `toolchain/platforms.bzl` has no `linux-riscv_64` entry, so even where Bazel itself runs on riscv64, protobuf provides no matching toolchain/platform definition (Section 5). | n/a | n/a (no protobuf Bazel release targets riscv64) | No riscv64 Bazel toolchain/platform definition exists in this repository. |
| **GCC** (build-dependency, critical) | Primary compiler used in community riscv64 builds and cross-compiles | GCC 11-12 riscv64 toolchains are confirmed usable (and are exactly what triggers the unresolved `-latomic` sub-word atomics defect in Section 5 and issue #14549). No protobuf-stated minimum GCC version exists for any architecture. | n/a | n/a | The `__atomic_exchange_1` undefined-reference failure (issue #14549) is a GCC-toolchain/riscv64 interaction, not a GCC defect per se - the fix is a `-latomic` link flag protobuf's build system does not inject. |

**Critical dependency deep-dive - Abseil:** The sub-word atomic issue ([abseil #1702](https://github.com/abseil/abseil-cpp/issues/1702)) is the most likely build failure for a first-time riscv64 builder. The symptom is the linker error quoted in Section 5, originating in `absl/log/libabsl_log_internal_globals.a(globals.cc.o)`. Neither protobuf's CMake nor abseil's CMake injects `-latomic` automatically for riscv64; a correct fix would either explicitly test `std::atomic<uint8_t>` or unconditionally link `-latomic` on riscv64. Separately, abseil's Randen PRNG has no `ABSL_ARCH_RISCV` macro and no Zvkned/Zvkg-accelerated path, so it uses the slow software path on riscv64 - consistent with the broader finding that none of protobuf's or its dependencies' SIMD/hardware-accelerated code paths cover riscv64.

## 11. Known Bugs and Active Issues

**RISC-V-specific in protocolbuffers/protobuf (all closed; zero open as of the research date):**

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| [#4425](https://github.com/protocolbuffers/protobuf/issues/4425) | Issues when cross-compiling for RISC-V | Closed (2018-04-16) | `undefined reference to Release_CompareAndSwap` in atomic stubs. No fix landed. |
| [#14549](https://github.com/protocolbuffers/protobuf/issues/14549) | Build fails on RISCV (`__atomic_exchange_1` undefined reference in abseil-cpp) | Closed (2023-11-02) | Working community CMake patch posted by `apcameron`, confirmed effective by a second user (`Boring545`, 2024-07-16), never merged upstream. |
| [#12266](https://github.com/protocolbuffers/protobuf/issues/12266) | Add riscv64 support | Closed (completed, 2024-03-05) | Closed on resourcing/manylinux grounds, not technical grounds; community requests to reopen as recently as 2026-05. |
| [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244) | feat: support riscv64 | Closed, unmerged (2024-03-05) | Blocked on manylinux at the time; blocker resolved July 2025, no maintainer re-activation. |
| [#13114](https://github.com/protocolbuffers/protobuf/issues/13114) | Can we cross-compile it with RISC-V? | Closed (not_planned, 2023-11-23) | No definitive technical resolution in thread. |
| [#17798](https://github.com/protocolbuffers/protobuf/issues/17798) | Maven central protoc prebuilts for riscv64 | Closed (2024-09-09) | No artifact ever published despite "completed" state_reason; substantively a decline. |
| [PR #23205](https://github.com/protocolbuffers/protobuf/pull/23205) | feat(protoc): RISC-V prebuilt | Closed, unmerged (2025-08-21) | Closed by author same day; CLA not signed; no maintainer review. |
| [PR #23206](https://github.com/protocolbuffers/protobuf/pull/23206) | feat(protoc): RISC-V prebuilt (release-branch target) | Closed, unmerged (2025-08-25) | Rejected on release-branch policy grounds; maintainer left a standing offer to review a main-branch PR. |

**Open issues in dependencies affecting riscv64 (not protobuf's own tracker):**

| ID | Repo | Title | Status | Notes |
|----|------|-------|--------|-------|
| [abseil #1702](https://github.com/abseil/abseil-cpp/issues/1702) | abseil-cpp | Can't link using riscv64 toolchain | Open | `-latomic` not auto-injected for GCC 11 riscv64 cross-compiles. |
| [abseil #1236](https://github.com/abseil/abseil-cpp/issues/1236) | abseil-cpp | RISCV ILP32E alignment | Open | Low severity. |
| [abseil #2002](https://github.com/abseil/abseil-cpp/issues/2002) | abseil-cpp | SEGFAULT in hashtablez/cordz tests on Debian riscv64, GCC 15.2 | Open | No upstream response as of research date. |
| [googletest #3756](https://github.com/google/googletest/issues/3756) | googletest | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 | Open | Self-test-only; does not propagate to protobuf's own test suite. |

**Correctness bugs:** No open riscv64-specific correctness bug exists in `protocolbuffers/protobuf`'s own tracker. The one architecture-agnostic correctness item referenced in a prior pass of this assessment, [#27446](https://github.com/protocolbuffers/protobuf/issues/27446) (`MessageDifferencer` NaN reflexivity), was not re-confirmed by this session's live research and is not riscv64-specific in any case. [NEEDS VERIFICATION]

## 12. Objections and Upstream Blockers

**Stated objections (maintainers, on record):**

1. "Unfortunately, adding support for riscv64 would also require us to update our internal release process and images accordingly to compile for riscv64, which we are unlikely to be able to staff at the moment especially considering lack of support in manylinux currently... Per kubernetes/kubernetes#123661, it appears Kubernetes itself does not officially support riscv64 either." (`zhangskz`, closing PR #12244 and issue #12266, March 2024)

2. "riscv64 is not a platform supported by the protobuf project. For now, we are not staffed to add support for this platform. We currently don't want to expand the release process to include the additional overhead of releasing a riscv64 version. If the demand changes (i.e. for Cloud, Kubernetes, or something else) we will reconsider." (`googleberg`, issue [#17798](https://github.com/protocolbuffers/protobuf/issues/17798), September 2024)

3. "I'm sorry, we don't accept external changes to release branches." (`googleberg`, PR [#23206](https://github.com/protocolbuffers/protobuf/pull/23206), August 2025)

4. "RISC-V isn't on our roadmap, so I'm afraid I can't really provide more guidance for this. As an unsupported platform, we wouldn't be testing RISC-V or guaranteeing that it stays unbroken. But if the changes to support aren't too extensive and you're willing to make the changes and deal with occasional breakages, we'll review and allow your changes." (`googleberg`, PR #23206, August 2025)

**Previously-stated technical blocker, now resolved without maintainer acknowledgment:** The lack of a manylinux riscv64 base image (pypa/manylinux#1426) was the stated reason for closing PR #12244 in March 2024. It was resolved when pypa/manylinux#1743 merged on 2025-07-20, adding `manylinux_2_39_riscv64` and `musllinux_1_2_riscv64` images. Two separate community members flagged this resolution directly on the closed protobuf threads (`luhenry`, 2025-10-30 on PR #12244; `nickolaev`, 2026-05-18 on issue #12266); neither thread has been reopened or answered by a maintainer.

**Remaining technical blockers:**
- No riscv64 CI runner and no published riscv64 Docker emulation image; any merged PR today would have no CI gate.
- The `protoc-artifacts` build script that generates release artifacts is not in the main branch and does not target riscv64; both community PRs that attempted to modify it targeted release branches, which Google will not accept external changes to.
- No named architecture macro for riscv64 exists; adding one requires touching every platform guard across the parse/dispatch/UTF-8-validation code paths described in Section 4.
- The unresolved sub-word `-latomic` atomics defect (issue #14549, abseil #1702) would need to be fixed in protobuf's own CMake logic, not just worked around downstream, before a clean riscv64 build path could be called reliable.

**Organizational blockers:**
- Google-internal staffing: maintainership is effectively 100% Google employees (Section 1), and they have explicitly and repeatedly declined to staff riscv64 support.
- Release process: adding riscv64 requires changes to Google-internal release tooling and Maven Central publishing pipelines that are not externally accessible.
- Demand threshold: maintainers cite Cloud and Kubernetes adoption as the signal that would change their position; Kubernetes does not officially support riscv64 as a tier-1 platform as of the most recent maintainer comment citing it.

**Acceptance probability for a well-scoped external PR:** Moderate. `googleberg`'s 2025-08-27 comment on PR #23206 is the most concrete standing opening available: a PR targeting `main` (not a release branch), using Bazel or CMake, that accepts "unsupported, may occasionally break" status, would be reviewed and allowed. No such PR has been filed in response as of the research date. The manylinux blocker that caused PR #12244's 2024 rejection is resolved; this has not yet translated into a reopened issue or renewed maintainer engagement.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro
- **Justification:** No riscv64 job exists in any of protobuf's 26 GitHub Actions workflow files, and no other CI config (GitLab/Jenkins/Cirrus) exists, so there is no upstream riscv64 build, test, or release - confirmed by direct grep of the [workflows directory](https://github.com/protocolbuffers/protobuf/tree/main/.github/workflows). All riscv64-targeted PRs ([#12244](https://github.com/protocolbuffers/protobuf/pull/12244), [#23205](https://github.com/protocolbuffers/protobuf/pull/23205), [#23206](https://github.com/protocolbuffers/protobuf/pull/23206)) were closed unmerged. Debian and Ubuntu independently build and ship protobuf for riscv64 (e.g. [protobuf-compiler on Ubuntu 26.04](https://packages.ubuntu.com/resolute/protobuf-compiler)), which would normally float the grade to yellow, but whether that distro packaging reflects a clean, unpatched build of upstream is explicitly unresolved in this research [NEEDS VERIFICATION], and there is a known, unfixed upstream build defect for riscv64 (the sub-word `-latomic` atomics linking failure, [issue #14549](https://github.com/protocolbuffers/protobuf/issues/14549)) that was never merged into protobuf's own CMake. Per the distribution-floor rule applied to this grading model, unknown/uncertain patch status on the distro build caps the grade at orange rather than yellow.
- **Pending work that could change the grade:** PR #12244 ("feat: support riscv64") remains closed/unmerged, but community members (`luhenry`, 2025-10; `nickolaev`, 2026-05) have noted its stated manylinux blocker (pypa/manylinux#1426) has since been resolved (pypa/manylinux#1743, merged 2025-07-20), without maintainer reopening. PR #23206 was closed in August 2025 specifically for targeting a release branch, but maintainer `googleberg` left a standing offer to review a well-scoped main-branch (Bazel/CMake) PR that accepts "unsupported, may occasionally break" status. No RISE involvement was found for Protocol Buffers itself: Google is a RISE Premier Member, but protobuf is not a RISE-listed/supported project and is absent from the RISE wheel builder's documented package list (even though the underlying RISE GitLab registry does independently host riscv64 wheels for `protobuf` 7.35.1).

## 14. Investment Analysis

RISE has not funded or performed any riscv64 enablement work on Protocol Buffers itself. The one piece of community-adjacent infrastructure in riscv64's favor is the RISE wheel builder's independent publication of riscv64 `protobuf` wheels (cp312-cp314, version 7.35.1), which exists without any coordination with protobuf's maintainers and should not be read as upstream progress. All work described below is unstarted upstream.

### 14.1 Functional Enablement

The library already compiles on riscv64 natively given the `-latomic` workaround. The functional gaps are: (1) the sub-word `-latomic` build-reliability defect, which has a known community fix never merged ([apcameron's patch](https://github.com/protocolbuffers/protobuf/issues/14549)); (2) no prebuilt `protoc` binary for riscv64 on GitHub Releases or Maven Central; and (3) no Bazel/CMake platform definition for riscv64.

Fix (1): a small change to `cmake/protobuf-configure-target.cmake` to test `std::atomic<uint8_t>` (or detect `__riscv` and unconditionally link `-latomic`), plus a corresponding Bazel toolchain entry. Purely additive; does not affect other architectures. Low effort, highest leverage.

Fix (2): adding riscv64 to the protoc prebuilt release artifacts requires modifying the `protoc-artifacts/build-protoc.sh` equivalent on `main` (not a release branch, per `googleberg`'s stated constraint), adding a riscv64 GitHub Actions release job, and publishing to Maven Central. PR #23205 already demonstrated the binary builds and works correctly on Sophgo SG2042 hardware, successfully compiling Hadoop and Spark.

Fix (3): a new `linux-riscv_64` entry in `toolchain/platforms.bzl` and `toolchain/cc_toolchain_config.bzl`.

### 14.2 Performance Optimization

Three independent gaps, in descending priority:

- **UPB fasttable on riscv64:** requires verifying the `preserve_none`/`musttail` clang attributes work correctly under the riscv64 ABI; if so, removing the architecture guard in `upb/port/def.inc` may suffice. Medium complexity.
- **RVV UTF-8 validation in `utf8_range`:** a new `utf8_range_ValidateUTF8Rvv()` path using RVV 1.0 intrinsics, gated on `__riscv_vector`, modeled on the existing NEON path (`vle8.v`/vector comparison instructions processing 16+ bytes per iteration). Highest-impact single change for string-heavy workloads; the dependency currently has zero riscv64-filed issues on this gap, meaning no external pressure exists to prioritize it.
- **RVV varint encoding/decoding:** analogous to the SVE2 work in issue #26931 [NEEDS VERIFICATION]. No benchmark data exists for the expected gain on riscv64 hardware; the only RISC-V protobuf performance data found in this research is the 2021 ProtoAcc hardware-accelerator paper (Karandikar et al., MICRO 2021, [preprint](https://sagark.org/assets/pubs/protoacc-micro2021-preprint.pdf)), which measures a custom RTL accelerator integrated into a BOOM-based RISC-V SoC against unaccelerated software protobuf, not a stock-library ISA comparison: 6.2x-11.2x speedup vs. unaccelerated software on the same RISC-V SoC, 3.8x vs. a Xeon-based x86 server despite weaker uncore infrastructure. Not directly applicable to prioritizing software-only RVV work, but establishes that protobuf serialization is a meaningful bottleneck worth optimizing on RISC-V targets.

### 14.3 CI/CD Infrastructure

Minimum viable CI: a QEMU-based riscv64 GitHub Actions runner using the `linux/riscv64` Docker platform, running the `test_cpp` and `test_python` workflows, modeled on the existing aarch64 emulation image. Protobuf's CI uses a private container registry (`us-docker.pkg.dev/protobuf-build/...`); a contributor would need to either host a riscv64 emulation image separately or negotiate inclusion with maintainers. Without CI, any merged riscv64 support will break silently on future releases - maintainers have explicitly conditioned acceptance on the contributor handling breakages, and CI is the only mechanism to catch regressions before they reach `main`. The [RISE RISC-V runners initiative](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/) (announced March 2026, native RISC-V CI on GitHub) is directly relevant infrastructure that could reduce this cost, but no evidence was found that protobuf has evaluated or adopted it.

### 14.4 Ecosystem Enablement

The critical downstream gap is the absence of an official `protoc` binary for riscv64 on Maven Central, which blocks any Java/Maven/Gradle project using `protoc-jar-maven-plugin` or similar plugins that download a prebuilt `protoc` at build time (Hadoop, Spark, and other data-platform projects are directly affected per issue #17798's and PR #23205's own motivation). Publishing a riscv64 `protoc` to Maven Central requires a Google-controlled Maven signing key and cannot be done unilaterally by an external contributor; it requires either Google adding riscv64 to its release pipeline, or a separate community-hosted Maven artifact that downstream build tools would need to be reconfigured to find.

PyPI riscv64 wheel enablement for the compiled extension depends on: (a) the `manylinux_2_39_riscv64` image, already merged (July 2025); and (b) protobuf's release workflow adding a riscv64 build step, which does not currently exist. In the interim, the RISE GitLab wheel registry already provides a working stopgap (cp312-cp314 wheels, protobuf 7.35.1), though it trails the current upstream release (7.36.2) and is not integrated into protobuf's own release process.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Fix sub-word `-latomic` in CMake for riscv64 (merge the existing community patch) | 0.5 | Compiler/build engineer | Critical |
| Functional | Add riscv64 to `toolchain/platforms.bzl` and Bazel toolchain config | 1 | Build engineer | High |
| Functional | Port PR #23205's build-script changes to `main`; submit under `googleberg`'s standing review offer | 2 | Build engineer + Google CLA | High |
| CI/CD | QEMU riscv64 GitHub Actions runner and `test_cpp` workflow entry | 3 | DevOps engineer | High |
| Functional | Negotiate Maven Central riscv64 protoc publishing with maintainers, or publish via a community-hosted repository | 4 | TPM + Google relationship | High |
| CI/CD | Publish riscv64 emulation Docker image for protobuf CI, or integrate RISE's native RISC-V GitHub runners | 2 | DevOps engineer | Medium |
| Performance | Enable UPB fasttable on riscv64 (audit `preserve_none`/`musttail` ABI compatibility) | 2 | Compiler/runtime engineer | Medium |
| Functional | Add PyPI riscv64 manylinux wheel to the official release workflow (reducing reliance on the RISE community wheel) | 2 | Build engineer | Medium |
| Performance | RVV UTF-8 validation in `third_party/utf8_range` | 3 | SIMD engineer | Medium |
| Performance | RVV varint encoding/decoding (analogous to SVE2 issue #26931) | 4 | SIMD engineer | Low |

## 15. References

- [Issue #4425 - Issues when cross-compiling for RISC-V (2018)](https://github.com/protocolbuffers/protobuf/issues/4425)
- [Issue #12266 - Add riscv64 support (2023-2024)](https://github.com/protocolbuffers/protobuf/issues/12266)
- [PR #12244 - feat: support riscv64 (2023-2024)](https://github.com/protocolbuffers/protobuf/pull/12244)
- [Issue #13114 - Can we cross-compile it with RISC-V? (2023)](https://github.com/protocolbuffers/protobuf/issues/13114)
- [Issue #14549 - Build fails on RISCV (2023)](https://github.com/protocolbuffers/protobuf/issues/14549)
- [Issue #17798 - Maven central protoc prebuilts for riscv64 (2024)](https://github.com/protocolbuffers/protobuf/issues/17798)
- [PR #23205 - feat(protoc): Adds support for building protoc on the RISC-V platform (Aug 2025)](https://github.com/protocolbuffers/protobuf/pull/23205)
- [PR #23206 - feat(protoc): RISC-V support, targeting 3.20.x (Aug 2025)](https://github.com/protocolbuffers/protobuf/pull/23206)
- [Issue #26931 - Performance: Optimize Varint Encoding/Decoding with SVE2](https://github.com/protocolbuffers/protobuf/issues/26931)
- [Issue #27446 - util: MessageDifferencer NaN semantics](https://github.com/protocolbuffers/protobuf/issues/27446)
- [abseil-cpp Issue #1702 - Can't link using riscv64 toolchain](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp Issue #1236 - RISCV ILP32E alignment](https://github.com/abseil/abseil-cpp/issues/1236)
- [abseil-cpp Issue #1561 - Riscv build of Protobuf fails due to abseil](https://github.com/abseil/abseil-cpp/issues/1561)
- [abseil-cpp Issue #2002 - SEGFAULT in hashtablez/cordz tests on Debian riscv64, GCC 15.2](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp PR #1986 - CRC32C hardware acceleration via Zbc/Zbkc (stalled)](https://github.com/abseil/abseil-cpp/pull/1986)
- [googletest Issue #3756 - GetThreadCount returns 0 on riscv64](https://github.com/google/googletest/issues/3756)
- [pypa/manylinux Issue #1426 - riscv64 manylinux blocker](https://github.com/pypa/manylinux/issues/1426)
- [pypa/manylinux PR #1743 - riscv64 manylinux images merged (2025-07-20)](https://github.com/pypa/manylinux/pull/1743)
- [protobuf.dev - Project homepage](https://protobuf.dev/)
- [protocolbuffers/protobuf - GitHub repository](https://github.com/protocolbuffers/protobuf)
- [protocolbuffers/protobuf - GitHub Actions workflows directory](https://github.com/protocolbuffers/protobuf/tree/main/.github/workflows)
- [protocolbuffers/protobuf - GitHub Releases](https://github.com/protocolbuffers/protobuf/releases)
- [PyPI - protobuf package JSON](https://pypi.org/pypi/protobuf/json)
- [RISE Project - Blog](https://riseproject.dev/blog)
- [RISE Project - Members](https://riseproject.dev/members)
- [RISE Project - RISC-V Runners announcement (March 2026)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Python Wheel Builder - Package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu 26.04 "resolute" - protobuf-compiler package](https://packages.ubuntu.com/resolute/protobuf-compiler)
- [Ubuntu 24.04 "noble" - libprotobuf-dev package](https://packages.ubuntu.com/noble/libprotobuf-dev)
- [Ubuntu 24.04 "noble" - python3-protobuf package](https://packages.ubuntu.com/noble/python3-protobuf)
- [Debian buildd - protobuf package status](https://buildd.debian.org/status/package.php?p=protobuf&suite=unstable)
- [ProtoAcc: A Hardware Accelerator for Protocol Buffers (Karandikar et al., MICRO 2021) - preprint](https://sagark.org/assets/pubs/protoacc-micro2021-preprint.pdf)