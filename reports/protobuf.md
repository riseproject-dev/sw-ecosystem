---
title: Protocol Buffers
categories:
  - libraries
---

# Protocol Buffers

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for Protocol Buffers
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

Protocol Buffers (protobuf) is Google's language-neutral, platform-neutral mechanism for serializing structured data. It is the wire format underlying gRPC and is embedded in virtually every large-scale distributed system built at Google or on top of Google infrastructure. The C++ runtime (`libprotobuf`) is the canonical implementation; language runtimes for Java, Python, Go, Rust, C#, Ruby, PHP, Objective-C, and others are maintained in the same repository or as thin wrappers around the C++ core.

**Governance:** Google-owned, no external foundation governance. The copyright footer on [protobuf.dev](https://protobuf.dev/) reads "2026 Google LLC All Rights Reserved." There is no steering committee, no foundation membership, and no neutral governance body. All contributions require the Google CLA via [cla.developers.google.com](https://cla.developers.google.com). The license is BSD-3-Clause (SPDX ID listed as NOASSERTION in GitHub metadata because the LICENSE file predates standardized identifiers).

**Maintainers:** The CODEOWNERS file assigns ownership by language subdirectory to GitHub teams under the `protocolbuffers` org. Top contributors by commit count are haberman (Joshua Haberman, Google, approximately 2,970 contributions), protobuf-github-bot and protobuf-team-bot (Google automation, approximately 3,549 and 1,679 contributions respectively), and mkruskal-google (Mike Kruskal, listed under the `@protocolbuffers` org, approximately 1,147 contributions). Other active contributors (xfxyjwf, TeBoring/Paul Yang, jskeet, deannagarcia, thomasvl, jtattermusch) are predominantly Google or protobuf-org engineers. Effectively 100% of active maintainership is Google-internal. External contributors exist but no external maintainers hold merge authority.

**Community posture on new ports:** The maintainer stance toward RISC-V support has been consistently negative. In August 2024 (issue [#17798](https://github.com/protocolbuffers/protobuf/issues/17798)), maintainer googleberg stated: "riscv64 is not a platform supported by the protobuf project. For now, we are not staffed to add support for this platform. We currently don't want to expand the release process to include the additional overhead of releasing a riscv64 version. If the demand changes (i.e. for Cloud, Kubernetes, or something else) we will reconsider." In August 2025 (PR [#23206](https://github.com/protocolbuffers/protobuf/pull/23206)), the same maintainer stated: "RISC-V isn't on our roadmap, so I'm afraid I can't really provide more guidance. As an unsupported platform, we wouldn't be testing RISC-V or guaranteeing that it stays unbroken. But if the changes to support aren't too extensive and you're willing to make the changes and deal with occasional breakages, we'll review and allow your changes."

**RISE involvement:** Google is a Premier RISE Member. Protocol Buffers itself has no direct RISE affiliation. The RISE Project blog (27 posts checked) contains no mention of Protocol Buffers or protoc. The RISE wheel builder ([riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/)) lists 75 packages; protobuf is not among them.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2018-03-25 | First RISC-V issue: #4425 "Issues when cross-compiling for RISC-V" (user zhoutwo, protobuf v3.5.1, cross-compiling for a Zynq FPGA). Undefined reference to `Release_CompareAndSwap` in atomic stubs. | [Issue #4425](https://github.com/protocolbuffers/protobuf/issues/4425) |
| 2018-04-16 | Issue #4425 closed with no resolution documented. | [Issue #4425](https://github.com/protocolbuffers/protobuf/issues/4425) |
| 2023-03-16 | PR #12244 "feat: support riscv64" opened by ernado, motivated by Kubernetes build pipeline needs. | [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244) |
| 2023-03-17 | Issue #12266 "Add riscv64 support" opened as tracking ticket for PR #12244. | [Issue #12266](https://github.com/protocolbuffers/protobuf/issues/12266) |
| 2023-10-27 | Issue #14549 "Build fails on RISCV" -- linker error `undefined reference to __atomic_exchange_1` in abseil-cpp when building on riscv64. Labels: "help wanted, platform related." | [Issue #14549](https://github.com/protocolbuffers/protobuf/issues/14549) |
| 2023-11-02 | Issue #14549 closed. No fix landed upstream. | [Issue #14549](https://github.com/protocolbuffers/protobuf/issues/14549) |
| 2024-03-05 | PR #12244 closed by zhangskz (Member). Stated reasons: internal release process complexity, no manylinux riscv64 image at that time (referenced pypa/manylinux#1426). Kubernetes did not officially support riscv64 at the time. | [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244) |
| 2024-08-13 | Issue #17798 "Maven central protoc prebuilts for riscv64" -- DingliZhang requests official riscv64 protoc binary on Maven Central, citing Hadoop and Maven plugin toolchains. Offers hardware testing assistance. | [Issue #17798](https://github.com/protocolbuffers/protobuf/issues/17798) |
| 2024-09-09 | Issue #17798 closed. No artifact published, no resolution comment. | [Issue #17798](https://github.com/protocolbuffers/protobuf/issues/17798) |
| 2025-07-20 | Upstream blocker resolved: pypa/manylinux#1743 merged, adding `manylinux_2_39_riscv64` and `musllinux_1_2_riscv64` images. (Not a protobuf action; this is a dependency milestone.) | [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244) (luhenry comment, 2025-10-30) |
| 2025-08-21 | PR #23205 "feat(protoc): Adds support for building protoc on the RISC-V platform and provides protoc prebuilt binaries" -- zhanchangbao-sanechips (Sanechips/ZTE). Adds riscv64 to `protoc-artifacts/build-protoc.sh`. Prebuilt binary tested on Sophgo SG2042; Hadoop and Spark compiled successfully on riscv64 using it. Closed by author same day due to unsigned Google CLA. No maintainer review. | [PR #23205](https://github.com/protocolbuffers/protobuf/pull/23205) |
| 2025-08-21 | PR #23206 re-submission of #23205, targeting the 3.20.x release branch. | [PR #23206](https://github.com/protocolbuffers/protobuf/pull/23206) |
| 2025-08-25 | PR #23206 closed by maintainer googleberg: "we don't accept external changes to release branches." | [PR #23206](https://github.com/protocolbuffers/protobuf/pull/23206) |
| 2025-08-27 | Maintainer googleberg confirms RISC-V is not on the roadmap but offers to review a well-scoped PR targeting main if contributor handles occasional breakages. | [PR #23206](https://github.com/protocolbuffers/protobuf/pull/23206) |
| 2025-10-30 | luhenry bumps PR #12244, noting the manylinux riscv64 blocker has been resolved upstream. No maintainer response on record. | [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244) |

**Status:** No RISC-V support has been merged into the main branch. All seven RISC-V-related issues and pull requests were closed without merging any riscv64-specific code.

**Key contributors with RISC-V involvement:**
- ernado (affiliation unlisted): opened PR #12244, motivated by Kubernetes
- DingliZhang (affiliation unlisted): issue #17798, Maven Central request
- zhanchangbao-sanechips (Sanechips/ZTE): PR #23205 and #23206, prebuilt protoc on Sophgo SG2042
- luhenry (Qualcomm RISE): PR #12244 comment noting manylinux blocker resolution

---

## 3. Upstream Support Tier

Protocol Buffers has no formal platform tier policy document (no PLATFORMS.md or SUPPORT.md exists in the repository). Supported platforms are implicitly those tested in CI and provided with prebuilt release artifacts.

**Implicit tier evidence:**

| Criterion | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|-----------|---------------|-----------------|---------|
| CI build coverage | Yes -- multiple workflow files | Yes -- emulation via QEMU container; aarch64 partially disabled in test_java.yml (b/395623141) | No |
| CI test coverage | Yes | Yes (emulation) | No |
| Release artifact (protoc .zip) | Yes | Yes | No |
| Maven Central artifact | Yes | Yes | No |
| PyPI native wheel | Yes | Yes | No |
| Official toolchain definition (Bazel platforms.bzl) | Yes | Yes | No |
| Maintainer statement | First-class | First-class | "Not on our roadmap" (googleberg, Aug 2025) |

**Assessment:** riscv64 is unsupported with no path to formal support absent a significant change in Google's resourcing or customer demand signal.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Protobuf has no JIT compiler and no garbage collector. Architecture-specific code is limited to: SIMD-accelerated UTF-8 validation, an optimized parse dispatch table (fasttable), musttail calling-convention hints, prefetch intrinsics, and atomic operation linking. All performance-critical paths are restricted to x86_64 and aarch64.

| Component | Description | amd64 | arm64 | riscv64 | ISA Extensions |
|-----------|-------------|-------|-------|---------|----------------|
| Architecture macro | Named arch detection in `stubs/platform_macros.h` | `GOOGLE_PROTOBUF_ARCH_X64` | `GOOGLE_PROTOBUF_ARCH_ARM64` | None (falls through to generic GCC `__LP64__` path) | n/a |
| UPB fasttable decoder | Lookup-table-driven field dispatch; reduces branch mispredictions in the hot parse loop. `UPB_FASTTABLE_SUPPORTED` in `upb/port/def.inc` | Enabled | Enabled (little-endian only, after [PR #27477](https://github.com/protocolbuffers/protobuf/pull/27477) merged May 2026) | Disabled (`UPB_FASTTABLE_SUPPORTED = 0`) | `preserve_none`, `musttail` attributes |
| TcParser musttail/tailcall | `PROTOBUF_MUSTTAIL` and `PROTOBUF_TAILCALL` in `port_def.inc` enable optimized tail-call dispatch in the C++ table-driven parser | Enabled | Enabled | Disabled (macro is empty) | Compiler attribute |
| Prefetch hints | `PROTOBUF_PREFETCH_WITH_OFFSET` in `port_def.inc` -- inline x86 `prefetcht0` ASM in the parse loop | Enabled | No-op | No-op | x86 prefetch |
| UTF-8 SIMD validation | `third_party/utf8_range/utf8_range.c` -- SIMD dispatch for string field validation | SSE4.1 | ARM NEON (64-bit only) | Naive byte-by-byte scalar C loop | SSE4.1 / NEON; no RVV path |
| ARM64 hand-written ASM | `UPB_ARM64_ASM` macro in `upb/port/def.inc` | n/a | Enabled | No equivalent | ARM64 |
| Varint SIMD (in-progress) | Issue [#26931](https://github.com/protocolbuffers/protobuf/issues/26931) (open, April 2026): loop unrolling shows approximately 30% improvement on ARM64; SVE2 intrinsics projected at approximately 2.5x encode and approximately 65% decode improvement | Not addressed in this issue | SVE2 path under development | Not mentioned; no RVV equivalent proposed | ARM SVE2 |
| Atomic linking fix | CMake auto-detects missing `int64_t` atomics and links `-latomic` (commit d023ab2, May 2025) | Not needed | Not needed | Partial (covers int64_t; does not cover sub-word `uint8_t` atomics in abseil, which is a separate failure mode) | n/a |

**Summary:** riscv64 uses the scalar C fallback for every performance path. Every SIMD, tail-call, prefetch, and fasttable optimization is either absent or explicitly restricted to x86_64 and aarch64le by source-code guards.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems:** CMake (primary for C++ library builds) and Bazel (primary for CI and release artifact generation).

**CMake minimum version:** 3.16 (enforced in CMakeLists.txt). Recommended: 3.22+ (per cmake/README.md).

**C++ standard:** C++17 mandatory, enforced via `target_compile_features(... cxx_std_17)` in `cmake/protobuf-configure-target.cmake`. C++20 is also tested in CI.

**Practical GCC minimum for riscv64:** GCC 11+. GCC 11.3.0 was used in the community riscv64 cross-compilation reported in abseil issue [#1702](https://github.com/abseil/abseil-cpp/issues/1702). GCC 12 was used in the native riscv64 build failure in issue [#14549](https://github.com/protocolbuffers/protobuf/issues/14549). No official statement on minimum GCC version exists.

**Native build on riscv64 (recommended):**

```bash
cmake -S . -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_STANDARD=17 \
  -Dprotobuf_BUILD_TESTS=OFF \
  -Dprotobuf_LOCAL_DEPENDENCIES_ONLY=ON \
  -Dprotobuf_ABSL_PROVIDER=package \
  -G Ninja
cmake --build build --parallel $(nproc)
cmake --install build
```

**Cross-compilation from x86_64:** No upstream CMake toolchain file for riscv64 exists. The community pattern (from abseil issue [#1702](https://github.com/abseil/abseil-cpp/issues/1702)) requires a separate toolchain file. The `-DWITH_PROTOC=/path/to/host/protoc` flag is required to supply an x86_64 protoc binary, since the cross-compiled binary cannot run on the build host. This is the same mechanism used by the upstream aarch64 cross-compilation CI job via `cross-compile-protoc@v5`.

PR [#23205](https://github.com/protocolbuffers/protobuf/pull/23205) used host triplet `riscv64-openEuler-linux-g++` and ELF format check `elf64-littleriscv` when building protoc natively on a Sophgo SG2042.

**Critical linker issue:** riscv64 requires `-latomic` for sub-word atomic operations (`uint8_t`, `uint16_t`). The upstream CMake fix (commit d023ab2, May 2025) tests only `std::atomic<int64_t>`. On riscv64 with the A extension, 64-bit atomics are hardware-native, so `protobuf_LINK_LIBATOMIC` evaluates to false, and the sub-word atomic problem in abseil-cpp persists. Workaround for cross-compilation:

```
-DCMAKE_EXE_LINKER_FLAGS="-latomic" -DCMAKE_SHARED_LINKER_FLAGS="-latomic"
```

**Bazel toolchain:** `toolchain/platforms.bzl` enumerates supported platforms: `linux-aarch_64`, `linux-ppcle_64`, `linux-s390_64`, `linux-x86_32`, `linux-x86_64`, macOS, Windows. `linux-riscv_64` is absent. No cross-compilation toolchain config for riscv64 exists in `toolchain/toolchains.bazelrc` or `toolchain/cc_toolchain_config.bzl`.

**QEMU:** No QEMU-based riscv64 configuration exists upstream. The CI uses QEMU emulation for aarch64 (via an `emulation:8.0.1-aarch64-*` Docker image), but no equivalent riscv64 image is published or referenced. Community riscv64 builds use native hardware (Sophgo SG2042 confirmed in PR [#23205](https://github.com/protocolbuffers/protobuf/pull/23205)) or cross-compilation.

**Autotools (legacy, protobuf v3.x):** From issue [#4425](https://github.com/protocolbuffers/protobuf/issues/4425) (2018, v3.5.1) and PR [#23205](https://github.com/protocolbuffers/protobuf/pull/23205) (2025, v3.20.x):

```bash
CC=riscv64-unknown-linux-gnu-gcc \
CXX=riscv64-unknown-linux-gnu-g++ \
./configure \
  --prefix=$RISCV \
  --target=riscv64-unknown-linux-gnu \
  --host=x86_64-pc-linux-gnu
```

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---------|-------|-------|---------|----------|
| Library builds and installs | Yes | Yes | Yes (native and cross) | None |
| `protoc` compiler (source build) | Yes | Yes | Yes (from source; no prebuilt) | Distribution gap |
| UPB fasttable parser | Enabled | Enabled (LE only) | Disabled | Performance |
| TcParser musttail dispatch | Enabled | Enabled | Disabled | Performance |
| UTF-8 validation SIMD | SSE4.1 | ARM NEON | Scalar naive loop | Performance |
| Varint SIMD (future) | Planned | SVE2 in progress (#26931) | Not proposed | Performance |
| Prefetch in parse loop | x86 prefetcht0 | No-op | No-op | Performance |
| Named architecture macro | Yes | Yes | No | Minor (tooling) |
| Official prebuilt protoc | Yes | Yes | No | Distribution |
| Bazel platform definition | Yes | Yes | No | Build system |
| Cross-compilation toolchain | Yes | Yes | No (community only) | Build system |
| CI-guaranteed correctness | Yes | Yes | No | Support |
| Sub-word atomic safety | Yes (hardware) | Yes (hardware) | Requires -latomic workaround | Build reliability |

**Functional gap:** None confirmed. The library compiles and functions correctly on riscv64 when built natively with `-latomic` or with the workaround. No correctness-level riscv64 regression is documented in the tracker as open.

**Performance gaps:** The fasttable decoder and musttail dispatch are the highest-impact gaps. These optimize the hot field-dispatch loop. Exact throughput delta vs aarch64 or amd64 on riscv64 hardware is not available: data not available (no published benchmark comparing protobuf encode/decode throughput on riscv64 versus x86_64 or aarch64 was found in any searched source).

The utf8_range naive scalar fallback processes one byte at a time. On aarch64, the NEON path processes 16 bytes per cycle. The throughput ratio for string-heavy workloads (UTF-8 validation dominates) would be roughly 16x in the worst case, but exact figures are not available from research data.

**NaN semantics:** Issue [#27446](https://github.com/protocolbuffers/protobuf/issues/27446) (open, May 2026): `MessageDifferencer::Equals(msg, msg)` returns `false` when the message contains NaN float/double fields, violating reflexivity. This affects all architectures equally; riscv64 has no unique exposure. Maintainers consider the current behavior intentional.

---

## 7. CI/CD Infrastructure

All 26 workflow files in `.github/workflows/` were read directly from the main branch. No file contains any occurrence of "riscv", "riscv64", "linux/riscv64", or "RISCV". No `.gitlab-ci.yml`, `.cirrus.yml`, or `Jenkinsfile` exists in the repository root.

| CI axis | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Build job | Yes | Yes | No |
| Test job | Yes | Yes (QEMU emulation; partially disabled in test_java.yml per b/395623141) | No |
| Release artifact job | Yes | Yes | No |
| Conformance test | Yes | Yes | No |
| Bazel presubmit (.bazelci/presubmit.yml) | Yes (debian12, ubuntu2404) | No explicit job | No |
| QEMU emulation runner | n/a | Yes (emulation:8.0.1-aarch64-*) | No image exists |
| RISE-hosted runner | Unknown | Unknown | No |

The CI test matrix in `test_cpp.yml` tests x86_64, aarch64, and linux/386. The `test_runner.yml` uses only `ubuntu-latest`. The `test_rust.yml` uses `ubuntu-22-4core` and `windows-2022`. No riscv64 runner of any kind is referenced in any workflow file.

---

## 8. Distribution and Release Status

**GitHub Releases (official protoc prebuilt binaries):**

The five most recent releases (v35.1, v35.0, v34.2, v35.0-rc2 checked) provide Linux protoc prebuilts for: `linux-aarch_64`, `linux-ppcle_64`, `linux-s390_64`, `linux-x86_32`, `linux-x86_64`. No `linux-riscv64` asset exists in any release.

**PyPI (`protobuf` package, version 7.35.1):**

Wheels: `manylinux2014_aarch64`, `manylinux2014_s390x`, `manylinux2014_x86_64`, `macosx_10_9_universal2`, `win32`, `win_amd64`, plus `py3-none-any` (pure Python fallback). No riscv64-specific wheel exists. riscv64 users receive the pure-Python `py3-none-any` wheel, which lacks the compiled C extension (slower; no native performance; no fasttable).

**Maven Central (protoc artifact):**

No `protoc-*-linux-riscv64.exe` artifact on Maven Central for any version. This was the explicit subject of issue [#17798](https://github.com/protocolbuffers/protobuf/issues/17798) (filed August 2024, closed September 2024 without resolution). PR [#23205](https://github.com/protocolbuffers/protobuf/pull/23205) produced a working riscv64 protoc binary on Sophgo SG2042 and used it to compile Hadoop and Spark successfully, but the PR was not merged.

**Ubuntu 24.04 (noble):**

`libprotobuf-dev` version 3.21.12-8.2build1 and `python3-protobuf` version 3.21.12-8.2build1 are available for riscv64 via the Ubuntu package archive. [NEEDS VERIFICATION against a second source beyond the packages.ubuntu.com listing.] These are Debian-maintained packages, not upstream official binaries. Version 3.21.12 is from 2022 and is 13+ major releases behind upstream v35.x.

**Debian unstable (sid):**

`protobuf` version 3.21.12-16 shows "Installed" status on riscv64, built by buildd node `rv-manda-03`. Same version caveat as Ubuntu.

**Arch Linux RISC-V:**

Data not available: the archriscv.felixc.at search page did not render package listings in fetched content; the riscv64 mirror at `riscv.mirror.pkgbuild.com/extra/os/riscv64/` returned 404. Expected to be present given Arch RISC-V's general posture of tracking upstream Arch, but this could not be confirmed.

**What a user must do to get a working riscv64 binary:**

1. Build protoc from source on riscv64 hardware (or cross-compile, supplying a host protoc via `-DWITH_PROTOC`).
2. Add `-latomic` to linker flags if using GCC 11.x toolchains.
3. For Java/Maven builds: build protoc from source and install locally; the Maven plugin cannot download a prebuilt riscv64 artifact.
4. For Python: the `py3-none-any` wheel installs without issue but lacks the native C extension.

---

## 9. Dependencies

| Dependency | Version | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|---------|------|--------------|-------------|-----------------|-----------------|
| abseil-cpp | 20250512.1 | Core C++ foundation: strings, hashing, containers, CRC32C, synchronization, logging; directly linked into libprotobuf | Builds. Debian sid `20260107.0-5` installed. Cross-compile with GCC 11.x hits `__atomic_exchange_1` unless -latomic is added. | SEGFAULT in `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` on Debian riscv64 with GCC 15.2 ([issue #2002](https://github.com/abseil/abseil-cpp/issues/2002), open since 2026-02-03, no upstream response). Passes on Ubuntu riscv64. | Source-only; no riscv64 binary releases | [#1702](https://github.com/abseil/abseil-cpp/issues/1702) (open): -latomic required for cross-compile with GCC 11 but not injected automatically. [#2002](https://github.com/abseil/abseil-cpp/issues/2002) (open): test SEGFAULT on Debian riscv64. CRC32C hw acceleration (Zbc/Zbkc) pending internal review ([PR #1986](https://github.com/abseil/abseil-cpp/pull/1986), stalled). |
| zlib | 1.3.1 | Optional wire-format message compression | Builds cleanly. Debian sid `1:1.3.dfsg+really1.3.2-3` installed. No riscv64 SIMD (falls back to portable C). | No known failures. | Source-only. | None blocking. |
| utf8_range | bundled in-tree (third_party/) | UTF-8 validation for string fields | Builds on riscv64: pure portable C, no architecture-specific code. | No known failures. | Distributed as part of protobuf source tarball. | None. No RVV path exists or is planned. |
| re2 | 2024-07-02 | Regex matching in protoc option parsing and TextFormat | Builds. Debian sid `20251105-1` installed. | No known failures. | Source-only. | None. |
| googletest | 1.17.0 | Test-only dependency | Builds. Debian sid `1.17.0-1+b1` installed. | [Issue #3756](https://github.com/google/googletest/issues/3756) (open, 2022-02-05): `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 -- `GetThreadCount()` returns 0 instead of 1. This is a gtest self-test failure, not a protobuf test. | Source-only. | Minor: does not propagate to protobuf tests. Not blocking. |
| jsoncpp | 1.9.6 | Conformance test runner and TextFormat JSON codec | Builds. Pure C++, no architecture-specific code. | No known failures. | Source-only. | None. |

**Critical dependency deep-dive -- abseil-cpp:**

The sub-word atomic issue ([#1702](https://github.com/abseil/abseil-cpp/issues/1702)) is the most likely build failure for first-time riscv64 builders. The symptom is a linker error:

```
undefined reference to `__atomic_exchange_1'
```

originating in `absl/log/libabsl_log_internal_globals.a(globals.cc.o)`. The fix is `-latomic`, but neither protobuf's CMake nor abseil's CMake injects this automatically for riscv64. The protobuf CMake fix (d023ab2) only checks `int64_t` atomics and does not resolve the `uint8_t`/`uint16_t` case. A correct fix would explicitly check `std::atomic<uint8_t>` or simply unconditionally link `-latomic` on riscv64.

The Randen PRNG in abseil uses a slow software path on riscv64 (no `ABSL_ARCH_RISCV` macro; no Zvkned/Zvkg accelerated path).

---

## 11. Known Bugs and Active Issues

**RISC-V-specific (all closed):**

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| [#4425](https://github.com/protocolbuffers/protobuf/issues/4425) | Issues when cross-compiling for RISC-V | Closed (Apr 2018) | Undefined reference to `Release_CompareAndSwap` in atomic stubs. No fix landed. |
| [#14549](https://github.com/protocolbuffers/protobuf/issues/14549) | Build fails on RISCV | Closed (Nov 2023) | `__atomic_exchange_1` undefined reference in abseil. Closed without upstream fix. CMake partial mitigation landed later (d023ab2, May 2025). |
| [#17798](https://github.com/protocolbuffers/protobuf/issues/17798) | Maven central protoc prebuilts for riscv64 | Closed (Sep 2024) | No artifact published. No maintainer resolution comment. |
| [PR #12244](https://github.com/protocolbuffers/protobuf/pull/12244) | feat: support riscv64 | Closed (Mar 2024) | Blocked on manylinux; blocker now resolved (July 2025). No re-activation from maintainers. |
| [PR #23205](https://github.com/protocolbuffers/protobuf/pull/23205) | feat(protoc): RISC-V prebuilt | Closed (Aug 2025) | CLA not signed; author closed same day. No maintainer review. |
| [PR #23206](https://github.com/protocolbuffers/protobuf/pull/23206) | feat(protoc): RISC-V prebuilt | Closed (Aug 2025) | Targeted release branch; maintainer rejected. |

**Open issues affecting riscv64 (architecture-agnostic but relevant):**

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| [#26931](https://github.com/protocolbuffers/protobuf/issues/26931) | Performance: Optimize Varint Encoding/Decoding (SVE2) | Open (Apr 2026) | ARM SVE2 only; no RVV equivalent proposed. Loop unrolling shows approximately 30% on ARM64; SVE2 projected at approximately 2.5x encode. riscv64 receives no benefit. |
| [#27446](https://github.com/protocolbuffers/protobuf/issues/27446) | util: MessageDifferencer treats NaN as not equal to itself | Open (May 2026) | Correctness issue: `Equals(msg, msg)` returns false on NaN float fields. Affects all architectures. Maintainers consider behavior intentional. |

**No open RISC-V-specific correctness bugs exist in the tracker as of the research data.**

---

## 12. Objections and Upstream Blockers

**Stated objections (from maintainers, on record):**

1. "riscv64 is not a platform supported by the protobuf project. For now, we are not staffed to add support for this platform." (googleberg, issue [#17798](https://github.com/protocolbuffers/protobuf/issues/17798), August 2024)

2. "We currently don't want to expand the release process to include the additional overhead of releasing a riscv64 version. If the demand changes (i.e. for Cloud, Kubernetes, or something else) we will reconsider." (googleberg, issue [#17798](https://github.com/protocolbuffers/protobuf/issues/17798), August 2024)

3. "RISC-V isn't on our roadmap, so I'm afraid I can't really provide more guidance. As an unsupported platform, we wouldn't be testing RISC-V or guaranteeing that it stays unbroken. But if the changes to support aren't too extensive and you're willing to make the changes and deal with occasional breakages, we'll review and allow your changes." (googleberg, PR [#23206](https://github.com/protocolbuffers/protobuf/pull/23206), August 2025)

**Previously-stated technical blockers (now resolved):**

- No manylinux riscv64 base image: Was the stated reason for closing PR #12244 in March 2024 (referenced pypa/manylinux#1426). Resolved: pypa/manylinux#1743 was merged July 20, 2025, adding `manylinux_2_39_riscv64` and `musllinux_1_2_riscv64`. The maintainers have not acknowledged this resolution or reopened the discussion on their own.

**Remaining technical blockers:**

- No riscv64 CI runner and no published Docker image for riscv64 emulation. Any merged PR would have no CI gate and would be vulnerable to accidental breakage on each release.
- The `build-protoc.sh` script that generates release artifacts does not target riscv64 and is not in the main branch; it lives in a `protoc-artifacts` subdirectory that community PRs attempted to modify but targeted release branches.
- No named architecture macro for riscv64; every platform guard in the codebase would need updating.

**Organizational blockers:**

- Google-internal staffing: all maintainers are Google employees and have explicitly declined to staff riscv64 support.
- Release process: adding riscv64 requires changes to Google-internal release tooling and Maven Central publishing pipelines that are not externally accessible.
- Demand threshold: maintainers cite Cloud and Kubernetes adoption as the signal that would change their position. Kubernetes does not officially support riscv64 as a tier-1 platform.

**Acceptance probability for a well-scoped external PR:**

Moderate for a PR that: targets `main` (not a release branch), adds riscv64 to CI using QEMU emulation, signs the Google CLA, includes the -latomic fix for sub-word atomics, and is accompanied by a commitment to maintain it. The maintainer offer in PR [#23206](https://github.com/protocolbuffers/protobuf/pull/23206) is the most concrete opening available. The manylinux blocker that caused PR #12244 to be rejected is now resolved (July 2025).

---

## 13. Investment Analysis

RISE has done nothing for Protocol Buffers on riscv64. All work described below is unstarted.

### 13.1 Functional Enablement

The library already compiles on riscv64 natively. The functional gaps are: (1) the sub-word `-latomic` build reliability issue, (2) no prebuilt `protoc` binary for riscv64, and (3) no Bazel/CMake platform definition for riscv64.

Fix (1): A one-line change to `cmake/protobuf-configure-target.cmake` to test `std::atomic<uint8_t>` (or detect `__riscv` and unconditionally link `-latomic`) and a corresponding Bazel toolchain entry. This removes the most common first-time build failure. The change is purely additive; it does not affect other architectures.

Fix (2): Adding riscv64 to the protoc prebuilt release artifacts requires modifying `protoc-artifacts/build-protoc.sh` (or its equivalent on main), adding a GitHub Actions release job for riscv64, and publishing the artifact to Maven Central. PR [#23205](https://github.com/protocolbuffers/protobuf/pull/23205) demonstrated that the binary builds and works correctly on Sophgo SG2042 hardware, successfully compiling Hadoop and Spark from source.

Fix (3): A new `linux-riscv_64` entry in `toolchain/platforms.bzl` and `toolchain/cc_toolchain_config.bzl`.

### 13.2 Performance Optimization

Three independent performance gaps exist, in descending priority:

- **UPB fasttable on riscv64:** Requires verifying that the `preserve_none` and `musttail` clang attributes work correctly with the riscv64 ABI. If they do, removing the architecture guard in `upb/port/def.inc` may be sufficient. If not, the fasttable entry-dispatch path needs an riscv64-aware calling convention. This is medium complexity.

- **RVV UTF-8 validation in `utf8_range`:** A new `utf8_range_ValidateUTF8Rvv()` path using RVV 1.0 intrinsics, gated on `__riscv_vector`. The ARM NEON path is the model; the RISC-V port would process 16 bytes per iteration using `vle8.v`/vector comparison instructions. This is the highest-impact change for string-heavy workloads.

- **RVV varint encoding/decoding:** Analogous to the SVE2 work in issue [#26931](https://github.com/protocolbuffers/protobuf/issues/26931). No benchmark data exists for the expected gain on riscv64 hardware.

### 13.3 CI/CD Infrastructure

Minimum viable CI: a QEMU-based riscv64 GitHub Actions runner using the `linux/riscv64` Docker platform, running the `test_cpp` and `test_python` workflows. A pre-built `us-docker.pkg.dev/protobuf-build/containers/test/linux/emulation:riscv64-*` image (modeled on the existing aarch64 emulation image) would be needed. The protobuf project uses a private container registry; the contributor would need to either host images separately or negotiate with maintainers.

Without CI, any merged riscv64 support will break silently on future releases. Maintainers have explicitly conditioned their acceptance on the contributor handling breakages; CI is the mechanism to catch them before they reach main.

### 13.4 Ecosystem Enablement

The critical downstream gap is the absence of an official `protoc` binary for riscv64 on Maven Central. This blocks any Java/Maven/Gradle project that uses `protoc-jar-maven-plugin` or similar plugins that download a prebuilt `protoc` at build time. Hadoop, Spark, and other data platform projects (which are themselves targets in this repository's scope) are affected.

Publishing a riscv64 `protoc` to Maven Central requires a Google-controlled Maven signing key. This cannot be done by an external contributor unilaterally. It requires either Google to add riscv64 to their release pipeline or a separate community-hosted Maven artifact (which tools would need to be configured to find).

PyPI riscv64 wheel enablement depends on: (a) the `manylinux_2_39_riscv64` manylinux image being accepted (it was merged in July 2025), and (b) the protobuf release workflow adding a riscv64 build step. The pure-Python fallback already works; the gap is the compiled C extension wheel for performance-sensitive applications.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Fix sub-word -latomic in CMake for riscv64 | 0.5 | Compiler/build engineer | Critical |
| Functional | Add riscv64 to toolchain/platforms.bzl and Bazel toolchain config | 1 | Build engineer | High |
| Functional | Add riscv64 to build-protoc.sh / main branch release job; submit PR targeting main | 2 | Build engineer + Google CLA | High |
| CI/CD | QEMU riscv64 GitHub Actions runner and test_cpp workflow entry | 3 | DevOps engineer | High |
| Functional | Negotiate Maven Central riscv64 protoc publishing with protobuf maintainers or publish via community repository | 4 | TPM + Google relationship | High |
| CI/CD | Publish riscv64 emulation Docker image for protobuf CI | 2 | DevOps engineer | Medium |
| Performance | Enable UPB fasttable on riscv64 (audit preserve_none/musttail ABI compat) | 2 | Compiler/runtime engineer | Medium |
| Functional | Add PyPI riscv64 manylinux wheel to release workflow | 2 | Build engineer | Medium |
| Performance | RVV UTF-8 validation in third_party/utf8_range | 3 | SIMD engineer | Medium |
| Performance | RVV varint encoding/decoding (analogous to SVE2 issue #26931) | 4 | SIMD engineer | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Issue #4425 -- Issues when cross-compiling for RISC-V (2018)](https://github.com/protocolbuffers/protobuf/issues/4425)
- [Issue #12266 -- Add riscv64 support (2023)](https://github.com/protocolbuffers/protobuf/issues/12266)
- [PR #12244 -- feat: support riscv64 (opened Mar 2023, closed Mar 2024)](https://github.com/protocolbuffers/protobuf/pull/12244)
- [Issue #14549 -- Build fails on RISCV (2023)](https://github.com/protocolbuffers/protobuf/issues/14549)
- [Issue #17798 -- Maven central protoc prebuilts for riscv64 (2024)](https://github.com/protocolbuffers/protobuf/issues/17798)
- [PR #23205 -- feat(protoc): Adds support for building protoc on the RISC-V platform (Aug 2025, closed same day)](https://github.com/protocolbuffers/protobuf/pull/23205)
- [PR #23206 -- feat(protoc): Adds support for building protoc on the RISC-V platform, targeting 3.20.x (Aug 2025)](https://github.com/protocolbuffers/protobuf/pull/23206)
- [Issue #26931 -- Performance: Optimize Varint Encoding/Decoding with SVE2 (Apr 2026)](https://github.com/protocolbuffers/protobuf/issues/26931)
- [PR #27477 -- Restrict fasttable to aarch64 little-endian (merged May 2026)](https://github.com/protocolbuffers/protobuf/pull/27477)
- [Issue #27446 -- MessageDifferencer NaN semantics (May 2026)](https://github.com/protocolbuffers/protobuf/issues/27446)
- [abseil-cpp Issue #1702 -- -latomic required for riscv64 cross-compile with GCC 11](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp Issue #2002 -- SEGFAULT in hashtablez/cordz tests on Debian riscv64 GCC 15.2](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp PR #1986 -- CRC32C hardware acceleration via Zbc/Zbkc (stalled)](https://github.com/abseil/abseil-cpp/pull/1986)
- [googletest Issue #3756 -- GetThreadCount returns 0 on riscv64](https://github.com/google/googletest/issues/3756)
- [protobuf.dev -- Project homepage](https://protobuf.dev/)
- [protocolbuffers/protobuf -- GitHub repository](https://github.com/protocolbuffers/protobuf)
- [RISE Project -- Blog (no protobuf content found)](https://riseproject.dev/blog)
- [RISE Python Wheel Builder -- Package index (protobuf absent)](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu 24.04 libprotobuf-dev package](https://packages.ubuntu.com/noble/libprotobuf-dev)
- [Ubuntu 24.04 python3-protobuf package](https://packages.ubuntu.com/noble/python3-protobuf)
- [Debian buildd -- protobuf package status](https://buildd.debian.org/status/package.php?p=protobuf&suite=unstable)
- [PyPI -- protobuf 7.35.1](https://pypi.org/project/protobuf/7.35.1/)