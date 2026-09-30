---
title: Abseil
parent: Project Reports
color: yellow
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Bazel
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="abseil-cpp" %}

# Abseil

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for Abseil<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[Abseil](https://abseil.io/) (repository [abseil/abseil-cpp](https://github.com/abseil/abseil-cpp)) is Google's collection of C++ foundation libraries covering containers, strings, synchronization primitives, hashing, CRC, random number generation, debugging utilities, and time. It is a direct extraction from Google's internal Piper monorepo, exported to GitHub. The most recent tagged releases found during this research are `20260817.0`, `20260526.0` (with a `20260526.rc1` release candidate), `20260107.1`, and `20250814.2`.

**Governance:** Google Inc. holds sole copyright and sole merge authority. Per the repository's CONTRIBUTING.md, "the current members of the Abseil engineering team are the only committers at present." All changes originate in Google's internal Piper repository and are exported to GitHub through a Copybara-based synchronization process. External contributors submit GitHub pull requests, but no external contributor has commit rights; a PR is only merged if a Google-affiliated Abseil team member converts it to an internal Google CL, reviews it internally, and exports the result. PRs that never receive internal adoption stall indefinitely or are closed unmerged.

**License:** Apache 2.0.

**Corporate sponsors:** Google Inc. exclusively. No co-maintaining companies were found, and Abseil is not under any external foundation (no Linux Foundation, Apache Software Foundation, CNCF, or OpenSSF affiliation).

**RISE Project membership:** None. Abseil is not a RISE working-group deliverable, has no RISE-funded engineering effort, and no dedicated RISE-org repository targets it (a GitHub search for `Abseil org:riseproject-dev` returns zero repositories). RISE's involvement is indirect and consumer-side only:
- The [`riseproject-dev/python-wheels`](https://github.com/riseproject-dev/python-wheels) repository statically links abseil-cpp as a bundled C++ dependency into several riscv64 Python wheels it builds (`dm-tree`, `grain`, `pytorch-tokenizers`, `runai-model-streamer-gcs`, `ydf`, and others). RISE does not modify abseil-cpp itself in these builds, and Abseil does not appear on the [RISE Python wheel builder's supported-package list](https://riseproject.gitlab.io/python/wheel_builder/) (checked 2026-09-30: no "abseil" entry among its roughly 89 listed packages), consistent with it being bundled rather than shipped as a standalone wheel.
- One RISE blog post references Abseil directly: ["PyTorch is available on riscv64!"](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/) (2026-08-18, author Ludovic Henry, Qualcomm). It notes, among several compiler-version incompatibilities hit while enabling PyTorch on riscv64, that "abseil's subword-atomics `static_assert` fails on GCC 13, which breaks sentencepiece." No issue number, PR link, or fix is given in the post, and this defect does not appear to be tracked anywhere in `abseil/abseil-cpp`'s issue tracker; it is distinct from the `-latomic` linker issue tracked as [#1702](https://github.com/abseil/abseil-cpp/issues/1702) (that one affects GCC 11-12). [NEEDS VERIFICATION: whether this GCC 13 static_assert failure was ever filed against abseil/abseil-cpp or GCC.] Because this blog post's author shares a name and employer with this report's author, it is flagged here for appropriate scrutiny as a primary-source claim rather than independent third-party corroboration.
- Of the 35 posts in the RISE blog sitemap (2024-05-15 through 2026-09-28), only the one above mentions Abseil; two other posts that could plausibly reference it ("Python Now Officially Supports RISC-V", 2026-08-24, and "Easy installation of binary Python packages on riscv64 devices", 2025-05-14) do not.
- No RISE CI runner usage and no RISE-funded engineering effort on abseil-cpp itself was found.

RISE's [member roster](https://riseproject.dev/members/) (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) and working groups (Compilers & Toolchains, System Libraries, Kernel & Virtualization, Language Runtimes, Developer Infrastructure, Linux Distro Integration, Simulators/Emulators, System Firmware, Security Software, AI/ML) include no dedicated Abseil project or working group.

**Community stance on new ports:** The governance model creates a structural barrier for community-contributed architecture work: a patch is accepted only if a Google engineer internally champions and re-exports it. The 2023-2024 RDCYCLE/RDTIME series ([PR #1550](https://github.com/abseil/abseil-cpp/pull/1550), [PR #1631](https://github.com/abseil/abseil-cpp/pull/1631)) and the 2024-2025 warning-fix series ([PR #1783](https://github.com/abseil/abseil-cpp/pull/1783), [PR #1788](https://github.com/abseil/abseil-cpp/pull/1788), [PR #1929](https://github.com/abseil/abseil-cpp/pull/1929)) illustrate the pattern: two of the three RDCYCLE/RDTIME PRs were never merged, while the warning fixes, which had a direct internal Google consumer (V8, Chromium builds targeting RISC-V), merged in 0 to 15 days. [PR #1986](https://github.com/abseil/abseil-cpp/pull/1986) (CRC32C hardware acceleration) has been internally adopted since 2026-01-05 but remains blocked on Google obtaining RISC-V hardware for internal verification, with no further public activity as of 2026-09-30. There is no stated objection to RISC-V as an architecture anywhere in the issues, PRs, or CONTRIBUTING.md reviewed; the blocker is consistently internal resourcing, not policy.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-02-21 | First RISC-V commit: `GetProgramCounter()` reads the PC from signal context. Contributed by Khem Raj (OpenEmbedded/Yocto). | [PR #621](https://github.com/abseil/abseil-cpp/pull/621) |
| 2021-08-19 | `stacktrace_riscv-inl.inc` added: RISC-V 32/64 call-stack unwinding, modeled on the AArch64 implementation. Contributed by Saleem Abdulrasool (compnerd). | Internal Copybara export |
| 2021-09-10 | `UnscaledCycleClock` RISC-V implementation added, using the RDCYCLE instruction. | Internal Copybara export |
| 2022-04-05 | VDSO symbol name fix for RISC-V unwinding. | Internal Copybara export |
| 2022-06-08 | Stack-trace frame-pointer walk correction on RISC-V. | Internal Copybara export |
| 2022-07-29 | Bug filed: RISC-V ILP32E ABI does not mandate 16-byte stack alignment; abseil's stack walker assumes it does. Still open. | [Issue #1236](https://github.com/abseil/abseil-cpp/issues/1236) |
| 2022-07-29 | `STRICT_UNWINDING` honored on RISC-V. | Internal Copybara export |
| 2022-08-04 | Alternate signal-stack handling added on RISC-V. | Internal Copybara export |
| 2023-10-20 to 2024-04-08 | [PR #1550](https://github.com/abseil/abseil-cpp/pull/1550) (author "marv") proposes replacing RDCYCLE with RDTIME; closed unmerged, abandoned without internal adoption. | GitHub |
| 2024-02-29 to 2024-03-19 | [PR #1631](https://github.com/abseil/abseil-cpp/pull/1631) (aurel32, Debian), a second independent attempt at RDCYCLE to RDTIME, tested on a VisionFive 2 board; closed in favor of #1644. | GitHub |
| 2024-03-22 | [PR #1644](https://github.com/abseil/abseil-cpp/pull/1644) merged: `UnscaledCycleClock` RISC-V support removed outright. Linux 6.6 made RDCYCLE privileged; RDTIME has no reliable userland frequency-scaling API and is non-monotonic across cores. RISC-V now falls back to `std::chrono::steady_clock` (VDSO RDTIME under the hood). Maintainer derekmauro (Google) opened an internal tracking bug (b/330872512) for affected internal teams. | [PR #1644](https://github.com/abseil/abseil-cpp/pull/1644) |
| 2024-05-30 to 2024-06-10 | [Issue #1684](https://github.com/abseil/abseil-cpp/issues/1684): `NegativeNaN` test fails on riscv64 (Fedora, GCC 14/Clang 18) because RISC-V hardware canonicalizes NaN sign bits. Closed/fixed upstream. | GitHub |
| 2024-07-05 | Bug filed: shared-library builds on a Bootlin riscv64 GCC 11.3 cross-toolchain fail to link with undefined references to `__atomic_exchange_1`/`__atomic_compare_exchange_1` because Abseil's build does not add `-latomic`. Still open, no activity in 2+ years. | [Issue #1702](https://github.com/abseil/abseil-cpp/issues/1702) |
| 2024-11-06 | [PR #1783](https://github.com/abseil/abseil-cpp/pull/1783) merged same day: fixes implicit signed/unsigned and precision-loss warnings in RISC-V inlines, motivated by strict-mode V8 RISC-V builds. | GitHub |
| 2024-12-03 | [PR #1788](https://github.com/abseil/abseil-cpp/pull/1788) merged: fixes a `-Wsign-conversion` warning (`long` to `uintptr_t`) in the RISC-V stack-unwinding code. | GitHub |
| 2025-09-02 | [PR #1929](https://github.com/abseil/abseil-cpp/pull/1929) merged same day: fixes a `-Wshorten-64-to-32` warning in `stacktrace_riscv-inl.inc`, motivated by Chromium's warnings-as-errors RISC-V build. | GitHub |
| 2025-12-25 | [PR #1986](https://github.com/abseil/abseil-cpp/pull/1986) opened: hardware-accelerated CRC32C for RISC-V using Zbc/Zbkc `clmul`/`clmulh`. Converted to an internal Google CL on 2026-01-05; still open, blocked on hardware access, no further public activity as of 2026-09-30. | [PR #1986](https://github.com/abseil/abseil-cpp/pull/1986) |
| 2026-02-03 | Bug filed: `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` SEGFAULT on Debian unstable riscv64 (GCC 15.2, CMake 4.2.3, abseil 20260107.0); does not reproduce on Ubuntu riscv64. Still open, no upstream response, forwarded as [Debian bug #1126886](http://www.mail-archive.com/debian-bugs-dist@lists.debian.org/msg2119363.html). | [Issue #2002](https://github.com/abseil/abseil-cpp/issues/2002) |
| 2026-09-04 to 2026-09-27 | [Issue #2153](https://github.com/abseil/abseil-cpp/issues/2153) / [PR #2154](https://github.com/abseil/abseil-cpp/pull/2154): a bare-metal ELF (`<link.h>`-less) `ElfW` portability fix touching ppc64/s390x/mips64/loongarch64 pointer-width handling. Reviewed and confirmed **not RISC-V specific**; it is not counted as RISC-V port work here despite surfacing in "riscv" keyword searches. | GitHub |

No new RISC-V-touching commit landed between the prior reporting cycle (2026-07-20) and 2026-09-30 other than the non-RISC-V-specific #2154.

**Key contributors with affiliations:**

| Contributor | Affiliation | Contributions |
|---|---|---|
| Khem Raj (kraj) | OpenEmbedded/Yocto | Initial `GetProgramCounter()` RISC-V support |
| Saleem Abdulrasool (compnerd) | LLVM/ClangBuiltLinux | `stacktrace_riscv-inl.inc` full port, frame-pointer and signal-stack fixes |
| aurel32 | Debian | RDCYCLE removal and RDTIME investigation, tested on VisionFive 2 hardware |
| apavlyutkin | Google-affiliated (inferred from same-day merge) | Warning fixes for V8 RISC-V builds |
| luyahan | Community | Sign-conversion warning fix |
| kxxt | Community (Chromium/Arch context) | Shorten-64-to-32 warning fix |
| PeterPtroc | Community | CRC32C hardware-acceleration PR (open) |
| derekmauro | Google (maintainer) | Reviews and internal-CL conversion for RISC-V contributions |

**Is it fully upstream?** The core RISC-V port (stack unwinding, `GetProgramCounter`) is fully upstream and merged. Google maintains an internal-only patch related to `UnscaledCycleClock` that has not been exported (noted by derekmauro in PR #1644's discussion). The CRC32C hardware acceleration (PR #1986) is in internal Google review, unmerged. Three open correctness/portability bugs (#1702, #1236, #2002) have no upstream fix.

## 3. Upstream Support Tier

**Formal tier policy:** Abseil follows only Google's [Foundational C++ Support Policy](https://github.com/google/oss-policies-info/blob/main/foundational-cxx-support-matrix.md), which lists supported OS and compiler versions but no CPU architecture. There is no `PLATFORMS.md`, `SUPPORT.md`, or equivalent file in the repository defining architecture tiers.

**Practical tier evidence**, confirmed by direct inspection of a shallow clone of `abseil/abseil-cpp` (HEAD `0057e68`, 2026-09-30), re-verified independently twice in this research cycle:

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated CI job (`ci/*.sh`) | Yes (multiple: GCC/Clang, Bazel/CMake, ASAN, TSAN) | Yes (`linux_arm_clang-latest_libcxx_bazel.sh`) | No |
| Docker container in `ci/linux_docker_containers.sh` | Yes (`LINUX_CLANG_LATEST_CONTAINER`, `LINUX_GCC_LATEST_CONTAINER`, etc.) | Yes (`LINUX_ARM_CLANG_LATEST_CONTAINER`) | No |
| GitHub Actions workflows | None exist for any architecture (`.github/workflows/` does not exist at all; CI runs on internal Google Kokoro) | None | None |
| Official binary releases via GitHub | No (source-only tarballs, all architectures) | No | No |
| `StackTraceWorksForTest()` returns true | Yes | Yes | Yes |
| Mentioned in the Foundational C++ Support Policy | No explicit architecture list | No explicit architecture list | No explicit architecture list |

RISC-V is an unsupported architecture in the formal sense: source code exists and has been accepted, but there is no CI of any kind gating it, and the project ships source only for every architecture, so "official binary" is not a meaningful category anywhere.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Abseil has no dedicated RISC-V architecture backend: no `arch/riscv/` directory, no assembly (`.S`/`.s`) files, no JIT, and no RVV/Zba/Zbb/Zbc/Zbs intrinsics in mainline (a repo-wide search for `vfloat32m1_t`, `rvv`, and vector-crypto identifiers found zero real hits; the only "rvv"/"zba" text matches were an unrelated base64 test string and a `HashtablezBarrier`/punycode literal). Its RISC-V support consists of generic C++ `#if defined(__riscv)` branches enabling existing stack-unwinding and signal-handling logic to compile and run, plus a proposed (unmerged) hardware CRC32C path. Eleven files touch `__riscv`, all C++ preprocessor guards, none assembly:

| Component | riscv64 status | ISA extensions used | Notes |
|---|---|---|---|
| Stack unwinding (`absl/debugging/internal/stacktrace_riscv-inl.inc`, 208 lines) | **Full, hand-tuned** | Base RV integer ABI only (walks `fp`/`x8`/`s0` per RISC-V ELF psABI) | Comparable in scope to `stacktrace_powerpc-inl.inc` (277 lines); larger than `stacktrace_arm-inl.inc` (148 lines). Has an open TODO tied to issue #1236 (ILP32E alignment). `stacktrace_test.cc` explicitly skips one test on RISC-V citing "a pre-existing failure," a known unresolved test-skip, not a fix. |
| Program-counter extraction (`absl/debugging/internal/examine_stack.cc`) | **Full** | None | `#elif defined(__riscv)` reads `context->uc_mcontext.__gregs[REG_PC]`, at parity with x86_64/aarch64/arm/powerpc64/loongarch. |
| Stack-consumption tooling (`stack_consumption.h`/`.cc`) | **Full** | None | Enables `ABSL_INTERNAL_HAVE_DEBUGGING_STACK_CONSUMPTION` and hardcodes `kStackGrowsDown = true` on Linux/riscv. |
| `mmap` syscall selection (`absl/base/internal/direct_mmap.h`) | **Full for rv32, not needed for riscv64** | None | Only rv32 (`__riscv_xlen == 32`) gets the special `mmap2` path; riscv64 uses the normal `mmap` path like amd64/arm64, so there is no riscv64-specific gap here. |
| Cycle clock (`absl/base/internal/unscaledcycleclock.{h,cc}`) | **Missing** | N/A | `unscaledcycleclock_config.h`'s supported-arch list is `__i386__ \|\| __x86_64__ \|\| __aarch64__ \|\| __powerpc__ \|\| __ppc__ \|\| _M_IX86 \|\| _M_X64`; RISC-V is absent. Removed by [PR #1644](https://github.com/abseil/abseil-cpp/pull/1644); RISC-V now uses the portable `std::chrono::steady_clock` (VDSO RDTIME) fallback. |
| CRC32C hardware acceleration (`absl/crc/internal/`) | **Missing from mainline** | Zbc/Zbkc proposed, unmerged | No `riscv`, `Zbc`, `Zbkc`, or `riscv_hwprobe` string anywhere in `absl/crc/internal/` on `master`. `crc32_x86_arm_combined_simd.h` and `crc_x86_arm_combined.cc` branch only on `__x86_64__`/`__aarch64__`; RISC-V falls through to the portable table-based `crc.cc` implementation. [PR #1986](https://github.com/abseil/abseil-cpp/pull/1986) (open, see Section 2) would close this gap. |
| Non-temporal memcpy (`absl/.../non_temporal_memcpy.h`) | **Missing** | N/A | Branches only on `__SSE3__ \|\| __aarch64__ \|\| (MSVC && AVX)`; RISC-V uses the generic scalar-copy fallback. |
| CPU feature detection (`absl/base/internal/cpu_detect.cc`) | **Missing** | N/A | Only `__x86_64__`/`_M_X64` and `__aarch64__` branches exist; no `riscv_hwprobe` call in mainline (only in the unmerged #1986). |
| Randen PRNG hardware AES / `ABSL_ARCH_*` taxonomy (`absl/random/internal/platform.h`, `randen_detect.cc`) | **Not enumerated** | N/A | The architecture-taxonomy header defines `ABSL_ARCH_X86_64`, `X86_32`, `AARCH64`, `ARM`, `PPC` only; there is no `ABSL_ARCH_RISCV` macro. `randen_detect.cc` checks the same four families. On RISC-V, `RandenHwAes` never activates; the portable `randen_slow` path is always used, regardless of whether Zvkned/Zvkg vector-crypto extensions are present. |
| Cache line size | **Fallback (64, correct value, but no `__riscv` guard)** | N/A | Same numeric result as amd64/arm64 but arrived at generically rather than via architecture detection, because `ABSL_ARCH_RISCV` does not exist. |

**Sub-word atomics:** RISC-V lacks native byte/halfword atomic instructions; GCC and Clang synthesize them as libcalls to `__atomic_*_1` helpers in `libatomic`. Abseil's CMake build does not link `-latomic` automatically, so shared-library builds using sub-word atomics (used by `absl_log_internal_globals`/`absl_log_internal_message`) fail to link on riscv64 with GCC 11-12 toolchains such as Bootlin's. This is [issue #1702](https://github.com/abseil/abseil-cpp/issues/1702), open since 2024-07-05 with no upstream fix.

**Component comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Stack unwinding | Hand-tuned (dedicated file, 411 lines) | Hand-tuned (dedicated file, 304 lines) | Hand-tuned (dedicated file, 208 lines) |
| GetProgramCounter | Dedicated `__x86_64__` branch | Dedicated `__aarch64__` branch | Dedicated `__riscv` branch |
| Cycle clock | `rdtsc` inline asm | `cntvct_el0` inline asm | std::chrono fallback (RDCYCLE support removed 2024-03-22) |
| CRC32C hw accel | PCLMUL (x86-only) | PMULL/VMULL (AArch64) | Software fallback; Zbc/Zbkc PR #1986 open, unmerged |
| Randen hw AES path | AES-NI + SSE4 | NEON + ARMv8 crypto | Software fallback (`randen_slow`); no `ABSL_ARCH_RISCV` macro exists |
| Non-temporal memcpy | SSE3/AVX intrinsics | NEON intrinsics | Generic scalar fallback |
| int128 | Compiler intrinsic | Compiler intrinsic | Compiler intrinsic |
| Sub-word atomics in shared libs | No extra link flags | No extra link flags | Requires `-latomic` on GCC 11-12 (issue #1702, unfixed) |

**Bottom line:** the one component that matters most for basic correctness, stack unwinding and crash symbolization, is a genuine, hand-written, RISC-V-specific implementation, not a stub, and is of comparable scope to the ppc64 and arm32 ports. Every performance-sensitive surface (cycle clock, CRC32C hardware acceleration, non-temporal memcpy, CPU feature detection, Randen hardware AES) is missing and silently falls back to portable/scalar C++. On top of that, two multi-year-old correctness bugs remain open (the `-latomic` linker failure and the sampler-test SEGFAULT), so riscv64 is not merely "less optimized" than amd64/arm64, it also has known unfixed defects.

## 5. Build System, Cross-Compilation, and Toolchain

**Minimum toolchain versions** (from Google's [Foundational C++ Support Policy](https://github.com/google/oss-policies-info/blob/main/foundational-cxx-support-matrix.md), architecture-agnostic):

| Tool | Minimum |
|---|---|
| GCC | 10 |
| Clang | 14.0.0 |
| CMake | 3.22 (policy doc); 3.16 (`CMake/README.md`'s `cmake_minimum_required`) |
| C++ standard | C++17 |

No riscv64-specific version floor is documented anywhere. Confirmed absent from the repository by direct file-tree inspection and full commit-history search (`git log --all -- <path>` returns nothing for any of these): `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, any `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake` (there is no `cmake/` toolchain-files directory at all; the existing `CMake/` directory holds only `AbseilDll.cmake`, `AbseilHelpers.cmake`, `abslConfig.cmake.in`, `README.md`, and a Googletest install-test subfolder), and any `Dockerfile.riscv64` or `docker/`/`.ci/docker/` directory. A GitHub code search for `riscv64 repo:abseil/abseil-cpp filename:Dockerfile` returned zero results.

**Only real build documentation in-repo (`CMake/README.md`)**, generic and architecture-agnostic:

```
cd path/to/abseil-cpp
mkdir build && cd build
cmake -DABSL_BUILD_TESTING=ON -DABSL_USE_GOOGLETEST_HEAD=ON ..
make -j
ctest
```

Traditional install flow:

```
cmake -S /source/googletest -B /build/googletest -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/installation/dir -DBUILD_GMOCK=ON
cmake --build /build/googletest --target install
cmake -S /source/abseil-cpp -B /build/abseil-cpp -DCMAKE_PREFIX_PATH=/installation/dir -DCMAKE_INSTALL_PREFIX=/installation/dir -DABSL_ENABLE_INSTALL=ON -DABSL_USE_EXTERNAL_GOOGLETEST=ON -DABSL_FIND_GOOGLETEST=ON
cmake --build /temporary/build/abseil-cpp
```

None of the project's own `option()` flags (`ABSL_PROPAGATE_CXX_STD`, `ABSL_USE_SYSTEM_INCLUDES`, `ABSL_MSVC_STATIC_RUNTIME`, `ABSL_BUILD_TESTING`, `ABSL_BUILD_TEST_HELPERS`, `ABSL_USE_EXTERNAL_GOOGLETEST`, `ABSL_USE_GOOGLETEST_HEAD`, `ABSL_BUILD_MONOLITHIC_SHARED_LIBS`) are architecture-specific. The README states, "Currently, we only run our tests with CMake in a Linux environment, but we are working on the rest of our supported platforms," so even CMake CI coverage is limited generally, let alone for riscv64.

**Recommended native riscv64 build** (host build, no toolchain file needed):

```bash
cmake -S abseil-cpp -B build \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_STANDARD=17 \
  -DABSL_ENABLE_INSTALL=ON \
  -DABSL_BUILD_TESTING=OFF
cmake --build build -j$(nproc)
cmake --install build
```

`-DABSL_BUILD_TESTING=OFF` is recommended because two tests SEGFAULT on Debian riscv64 (issue #2002) and no riscv64 QEMU wrapper is provided by the project.

**Cross-compilation from an x86_64 host** requires a user-supplied CMake toolchain file (none is provided by Abseil):

```cmake
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
set(CMAKE_SYSROOT /path/to/sysroot)
```

```bash
cmake -S abseil-cpp -B build \
  -DCMAKE_TOOLCHAIN_FILE=/path/to/riscv64-toolchain.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DCMAKE_CXX_STANDARD=17 \
  -DABSL_ENABLE_INSTALL=ON \
  -DABSL_BUILD_TESTING=OFF \
  -DCMAKE_EXE_LINKER_FLAGS="-latomic" \
  -DCMAKE_SHARED_LINKER_FLAGS="-latomic"
```

The `-latomic` flags work around issue #1702 for GCC 11-12 riscv64 toolchains; they may not be necessary with GCC 13+ or Clang.

**Bazel:** Abseil's own CI uses Bazel, but no `platforms/riscv64` target or toolchain configuration exists in the repository for any consumer. Bazel cross-compilation for riscv64 requires a user-supplied platform and toolchain configuration.

**QEMU:** No official QEMU instructions or CMake wrapper are provided anywhere in the repository. The one `qemu` string match in the tree (`absl/log/internal/test_helpers.cc`) is an unrelated Android/aarch64 QEMU death-test quirk.

**Known build/link/test failures on riscv64:**

- Undefined reference to `__atomic_exchange_1`/`__atomic_compare_exchange_1` when linking shared libraries with a Bootlin riscv64 GCC 11.3 cross-toolchain; workaround `-latomic`. [Issue #1702](https://github.com/abseil/abseil-cpp/issues/1702), no upstream fix, open since 2024-07-05.
- Two test SEGFAULTs (`absl_hashtablez_sampler_test`, `absl_cordz_sample_token_test`) on Debian unstable riscv64 with GCC 15.2/CMake 4.2.3; does not reproduce on Ubuntu riscv64. [Issue #2002](https://github.com/abseil/abseil-cpp/issues/2002), no upstream response, open since 2026-02-03.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---|---|---|---|---|
| Stack unwinding | Full | Full | Full | None |
| GetProgramCounter (signal context) | Full | Full | Full | None |
| Cycle clock (raw cycles) | Full (rdtsc) | Full (cntvct_el0) | Missing (std::chrono fallback) | Performance: internal profiling/backoff paths degrade |
| CRC32C hardware acceleration | Full (PCLMUL) | Full (PMULL) | Missing (PR #1986 open, unmerged) | Performance |
| Randen PRNG hardware AES | Full (AES-NI) | Full (ARMv8 crypto) | Missing, and not even architecturally recognized (`ABSL_ARCH_RISCV` does not exist) | Performance |
| Non-temporal memcpy | Full (SSE3/AVX) | Full (NEON) | Missing (scalar fallback) | Performance |
| CPU feature detection | Full (cpuid) | Full (hwcap) | Missing (no `riscv_hwprobe` in mainline) | Functional prerequisite for future hardware paths |
| Sub-word atomics in shared libs | No extra flags | No extra flags | Requires `-latomic` on GCC 11-12 (issue #1702, unfixed) | Build friction / functional |
| int128 | Compiler intrinsic | Compiler intrinsic | Compiler intrinsic | None |

**Functional gaps:**

- No `ABSL_ARCH_RISCV` macro anywhere in `absl/random/internal/platform.h`. Even on a future system with Zvkned/Zvkg vector-crypto extensions, the Randen hardware AES path can never activate without first adding this macro and a corresponding detection call in `randen_detect.cc`. This is a prerequisite gap, not merely a missing optimization.
- Cycle clock removal means any Abseil-internal consumer of `UnscaledCycleClock` (profiling, some spinlock backoff implementations) degrades to `clock_gettime(CLOCK_MONOTONIC)` on RISC-V rather than reading a raw cycle counter. This is a correctness-preserving degradation, not a computation-correctness bug.
- Two open correctness bugs exist independent of any missing hardware path: the `-latomic` linker failure (#1702) can make shared-library builds fail to link entirely on affected toolchains, and the sampler-test SEGFAULT (#2002) is a crash in shipped telemetry/sampling code on Debian's riscv64 build.

**Performance gaps:**

- CRC32C: software fallback vs. the proposed Zbc/Zbkc hardware path measures 1.21x-1.62x depending on payload size and access pattern (see Section 4/13 for the full benchmark table); this remains unmerged as of 2026-09-30.
- Randen PRNG: no quantitative riscv64 benchmark for the software (`randen_slow`) vs. hardware-AES path gap was found in any source consulted for this report. [NEEDS VERIFICATION: exact ratio on riscv64 hardware; Abseil's general documentation characterizes the software fallback as markedly slower on other architectures without hardware AES, but no riscv64-specific figure exists.]
- No cross-architecture (riscv64 vs. arm64 vs. x86_64) performance comparison data exists in any source found for this report, including a dedicated search pass that returned zero comparative results via Bing (DuckDuckGo and GitHub code search were blocked by CAPTCHA/auth, and grep.app was rate-limited).

**NaN / floating-point semantics:** [Issue #1684](https://github.com/abseil/abseil-cpp/issues/1684) (closed, resolved upstream): `FloatingPointLogFormatTest/0.NegativeNaN` failed on riscv64 (Fedora, GCC 14/Clang 18) because RISC-V hardware canonicalizes NaN sign bits differently from x86/ARM. No open floating-point correctness bugs remain as of this research.

**Security hardening:** Data not available: no research pass in this cycle specifically searched for riscv64 stack-protector, CFI, or ASLR-related hardening gaps in Abseil; none surfaced incidentally in any issue, PR, or code search performed.

## 7. CI/CD Infrastructure

**Summary: no riscv64 CI exists for abseil/abseil-cpp, and in fact no CI of any kind runs via GitHub Actions for any architecture.** This was independently confirmed twice in this research cycle by direct inspection of a shallow clone (`0057e68`, 2026-09-30):

- `.github/workflows/` does not exist. The `.github/` directory contains only `ISSUE_TEMPLATE/` and `PULL_REQUEST_TEMPLATE.md`; there are zero GitHub Actions workflow files for any architecture.
- No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists.
- `ci/` (18 files) contains the real CI driver scripts, invoked externally by Google's internal Kokoro system: `linux_gcc-latest_libstdcxx_{bazel,cmake}.sh`, `linux_gcc-floor_libstdcxx_bazel.sh`, `linux_gcc_alpine_cmake.sh`, `linux_clang-latest_libcxx_{bazel,asan,tsan}.sh`, `linux_clang-latest_libstdcxx_bazel.sh`, `linux_arm_clang-latest_libcxx_bazel.sh`, `linux_docker_containers.sh`, `cmake_install_test.sh`, `cmake_common.sh`, plus macOS and Windows scripts. None is named `*riscv*`.
- `ci/linux_docker_containers.sh` defines `LINUX_ALPINE_CONTAINER`, `LINUX_CLANG_LATEST_CONTAINER`, `LINUX_ARM_CLANG_LATEST_CONTAINER`, `LINUX_GCC_LATEST_CONTAINER`, `LINUX_GCC_FLOOR_CONTAINER`. No RISC-V container is defined.
- A repository-wide case-insensitive grep for `riscv` outside `absl/` (i.e., across `.github/`, `ci/`, and all other non-source directories) returns zero matches. The only "riscv" matches anywhere in the tree are in source files under `absl/` (architecture-detection macros and the RISC-V stack unwinder), which is library code, not CI configuration.

**Comparison:**

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job exists | Yes (multiple) | Yes (one) | No |
| CI system | Google Kokoro (internal) | Google Kokoro (internal) | N/A |
| GitHub Actions | No (none for any arch) | No | No |
| Docker container defined | Yes | Yes | No |
| Publicly observable CI results | No (internal) | No (internal) | N/A |
| RISE CI runners used | No | No | No |

RISE's CI infrastructure is not used by abseil/abseil-cpp in any capacity.

## 8. Distribution and Release Status

**GitHub Releases:** Source-only tarballs (`.tar.gz`/`.zip`) for every architecture; Abseil has never published binary/architecture-specific release assets. Latest tags observed: `20260817.0`, `20260526.0` (`20260526.rc1` release candidate), `20260107.1`, `20250814.2`. This session's GitHub API access to `abseil/abseil-cpp` was not enabled (scoped only to `riseproject-dev/sw-ecosystem`), so the release-assets page could not be re-verified via the API in the final research pass; the source-only pattern is nonetheless well established across every research pass that could inspect it, and no binary asset of any kind, for any architecture, has ever been observed on this project's releases.

**Ubuntu 26.04 "resolute":** **Confirmed present**, via two independent, authoritative sources agreeing:
- [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libabsl&suite=resolute&searchon=names&section=all) lists `libabsl-dev` and `libabsl20260107`, both version `20260107.0-4`, with architectures including **riscv64** (alongside amd64, arm64, armhf, i386, ppc64el, s390x).
- The `packages.ubuntu.com/resolute/riscv64/libabsl-dev/download` URL resolves (HTTP 200) to a real file, `libabsl-dev_20260107.0-4_riscv64.deb` (4,102.5 kB, 36,973.0 kB installed).
- Cross-checked via the official Launchpad API (`api.launchpad.net`, `getPublishedBinaries` for `libabsl-dev`, distro series resolute, riscv64), which independently returned `libabsl-dev 20260107.0-4, architecture_specific=True, status=Published`.

Note: the real Ubuntu/Debian package family is **`libabsl-dev`/`libabsl<version>`**, not a package literally named "abseil" or "libabseil"; a search for the literal string "Abseil" against Ubuntu package names returns zero results.

**Ubuntu, other releases** (from the prior reporting cycle, not independently re-verified in the latest pass beyond 26.04 above): `libabsl-dev` `0~20210324.2-2` on 22.04 LTS (ports archive), `20220623.1-3.1ubuntu3` on 24.04 LTS (ports archive), `20240722.0-4ubuntu1` on 25.10 (main archive, no longer ports-only from 25.10 onward).

**Debian: contradictory findings, flagged per this report's verification policy.** The prior reporting cycle recorded `libabsl-dev` `20260107.0-5` as installed on Debian sid for riscv64, built on the `rv-osuosl-02` riscv64 porter box, with the package having migrated to testing after the maintainer downgraded [Debian bug #1126886](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1126886) from serious to important. A later adversarial-verification pass in this same research cycle instead found, via [buildd.debian.org's package status page](https://buildd.debian.org/status/package.php?p=abseil&suite=sid) for the source package `abseil` in `sid`, that riscv64 shows status **"Needs-Build"** while amd64, arm64, armhf, loong64, ppc64el, s390x, and others show "Installed." **[NEEDS VERIFICATION]** These two findings disagree on whether Debian sid currently has a built riscv64 binary; the discrepancy was not resolved within this research cycle and should be re-checked directly against `buildd.debian.org` before this line is relied on for planning. Ubuntu 26.04's riscv64 packaging, by contrast, is confirmed via two independent, current sources as described above and is not in dispute.

**Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at/?q=abseil)):** Confirmed absent. Neither `abseil` nor `abseil-cpp` appears on the port page as of this research.

**Fedora/Koji:** Data not available: access was blocked by Anubis bot protection during research.

**Other riscv64 packaging found incidentally (not primary distro channels, included for completeness):** an [Alpine edge `abseil-cpp-stacktrace` riscv64 package](https://pkgs.alpinelinux.org/package/edge/main/riscv64/abseil-cpp-stacktrace), an [AUR `android-riscv64-abseil-cpp` package](https://aur.archlinux.org/packages/android-riscv64-abseil-cpp), and an [EESSI software-layer PR](https://github.com/EESSI/software-layer/pull/1676) building Abseil `20260107.1` for `riscv64/generic` as downstream scientific-software-stack packaging, not upstream abseil-cpp work.

**PyPI:** No package named `abseil` exists (`pypi.org/pypi/abseil/json` returns HTTP 404, confirmed again via `pypi.org/simple/abseil/`, also 404). The actual Python Abseil project is [`absl-py`](https://pypi.org/project/absl-py/), a distinct, unrelated PyPI package name; its latest release ships only a pure-Python wheel (`absl_py-2.5.0-py3-none-any.whl`) and an sdist, with no platform/architecture tag at all, so no riscv64-specific artifact is needed or would apply. The RISE wheel builder (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/abseil/`) redirects to upstream PyPI's (404) `abseil` endpoint and likewise has nothing under that name.

**To get a working riscv64 binary today:** install `libabsl-dev` from Ubuntu 24.04 (ports), Ubuntu 25.10+ (main archive), or Ubuntu 26.04 "resolute" (main archive, confirmed above). Debian sid's current riscv64 build status is disputed between sources (see above) and should be checked directly before relying on it. Build from source when a toolchain requires `-latomic` (issue #1702) or when a version newer than what distributions carry is needed; distribution packages lag upstream by months (26.04's `20260107.0` vs. the latest upstream tag `20260817.0`).

## 9. Dependencies

Abseil is nearly self-contained. Runtime dependencies are minimal; test dependencies are build-time only. The table below lists every direct dependency identified for this project, using the exact names given for this report, plus the additional build-toolchain dependencies (CMake, Bazel, LLVM) that this research cycle added beyond the previously-tracked runtime/test set.

| Dependency | Role | Criticality | riscv64 status | Notes |
|---|---|---|---|---|
| GCC | Build-dependency | Critical | Confirmed in use on riscv64: issue #2002 and the existing distro packaging both show Abseil built with GCC (GCC 15.2 on Debian sid riscv64, GCC 11.3 via the Bootlin riscv64 cross-toolchain in issue #1702). GCC 11-12 on riscv64 requires the `-latomic` workaround for sub-word atomics (issue #1702); no equivalent report exists for GCC 13+ in this research beyond the RISE blog's separate GCC 13 `static_assert` finding (Section 1). | Abseil's primary supported/tested compiler family. |
| LLVM | Build-dependency (Clang) | Optional | Data not available: no dedicated research into Clang/LLVM's own riscv64 toolchain maturity was conducted in this cycle; Clang is Abseil's other officially supported compiler (minimum version 14.0.0 per the Foundational C++ Support Policy) but no riscv64-specific Clang build/test evidence for Abseil was found. | |
| CMake | Build-dependency | Critical | Confirmed in use on riscv64: issue #2002 specifically records a Debian riscv64 build using CMake 4.2.3. | One of Abseil's two supported build systems; minimum version 3.16 (`CMake/README.md`) to 3.22 (Foundational C++ Support Policy). |
| Bazel | Build-dependency | Critical | Data not available: no riscv64-specific evidence for Bazel itself was found in this research cycle; Abseil's own internal Kokoro CI uses Bazel but has no riscv64 job at all (Section 7), so Bazel-on-riscv64 is untested by the upstream project either way. | Abseil's other, primary, supported build system; no `platforms/riscv64` configuration exists in the repository. |
| GCC | Runtime-dependency (libgcc/libatomic) | Critical | Same as build-dependency row above; the runtime-dependency angle is specifically `-latomic` (issue #1702, unresolved on riscv64 with GCC 11-12). | |
| glibc | Runtime-dependency (pthreads, threading primitives) | Critical | Pass (build), Pass (test), Shipped (release) per prior-cycle research; glibc's riscv64 support is broadly mature and no Abseil-specific glibc/riscv64 defect was found beyond the general `-latomic`/atomics interaction already covered above. | |
| googletest | Test-dependency (build-time only, not linked into release artifacts) | Optional | Pass (build), Pass (test), Shipped (release) per prior-cycle research; no riscv64-specific googletest issue was found. | |

**Downstream projects depending on Abseil** (within the scope of this repository's known consumers):

| Project | Relationship | Known riscv64 impact |
|---|---|---|
| Protocol Buffers | Direct dependency (merged protobuf 3.22+) | [Issue #1561](https://github.com/abseil/abseil-cpp/issues/1561): riscv64 build failure reported (closed); root cause traced to Abseil's atomics/linking gap (issue #1702), not actually fixed upstream. |
| gRPC | Depends on abseil and protobuf | Inherits the atomics linking gap. |
| Envoy | Uses abseil, gRPC, protobuf | Inherits all riscv64 gaps listed above. |
| sentencepiece | Direct abseil dependency | Affected by the RISE-discovered GCC 13 subword-atomics `static_assert` failure (Section 1); also inherits the Randen software-path and missing-cycle-clock gaps. |

Abseil implements its own CRC32C, hashing, and Randen PRNG internally rather than depending on external libraries for them, and has no JIT backend, GPU path, or deep numeric dependency chain, so there is no further recursion needed beyond the direct dependencies listed above.

## 11. Known Bugs and Active Issues

**Open issues:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2002](https://github.com/abseil/abseil-cpp/issues/2002) | `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` SEGFAULT on riscv64 | Open | High | Filed 2026-02-03, still open and unchanged as of 2026-09-30 (nearly 8 months, no upstream response, no labels, no assignee). Debian riscv64 only (GCC 15.2, CMake 4.2.3, abseil 20260107.0); does not reproduce on Ubuntu riscv64. 230/232 CTest cases pass. Forwarded as [Debian bug #1126886](http://www.mail-archive.com/debian-bugs-dist@lists.debian.org/msg2119363.html) (also cross-referenced against historical [Debian bug #1025221](https://groups.google.com/g/linux.debian.bugs.dist/c/Rb2uPf0iJFg), related to the earlier RDCYCLE/RDTIME work). |
| [#1702](https://github.com/abseil/abseil-cpp/issues/1702) | Can't link using riscv64 toolchain: undefined `__atomic_exchange_1`/`__atomic_compare_exchange_1` | Open | High | Filed 2024-07-05, still open as of 2026-09-30 (2+ years, no labels, no assignee, no linked PR). Bootlin riscv64 GCC 11.3 cross-toolchain (Buildroot 2021.11), CMake 3.28.3, target `riscv64-buildroot-linux-gnu`/`lp64d`. Root cause: sub-word atomics compile to `libatomic` libcalls that Abseil's CMake build does not link against by default. |
| [#1236](https://github.com/abseil/abseil-cpp/issues/1236) | RISCV ILP32E does not mandate 16-byte alignment for stack | Open | Low | Filed 2022-07-29, no activity since (~4 years). Abseil's stack-walking code assumes 16-byte stack alignment, guaranteed by the standard ILP32/LP64 RISC-V ABI but not by the embedded ILP32E variant. Labeled "Bug," no assignee, no proposed fix. |
| [PR #1986](https://github.com/abseil/abseil-cpp/pull/1986) | RISC-V hardware CRC32C acceleration (Zbc/Zbkc) | Open PR | Medium (performance) | Internally adopted by derekmauro (Google) since 2026-01-05; blocked on RISC-V hardware access for internal verification. No further public activity as of 2026-09-30 (roughly 9 months stalled). |

**Closed issues (resolved, relevant context):**

| ID | Title | Resolution |
|---|---|---|
| [PR #1644](https://github.com/abseil/abseil-cpp/pull/1644) | `UnscaledCycleClock` RISC-V support removed | Merged 2024-03-22. Linux 6.6 made RDCYCLE privileged; RISC-V now uses the `std::chrono` fallback. |
| [Issue #1684](https://github.com/abseil/abseil-cpp/issues/1684) | `NegativeNaN` test fails on riscv64 | Fixed/disabled upstream; RISC-V hardware canonicalizes NaN sign bits differently. |
| [Issue #1561](https://github.com/abseil/abseil-cpp/issues/1561) | riscv64 Protobuf build fails due to abseil | Closed; root cause (atomics linking, #1702) remains unfixed upstream. |
| [Issue #2153](https://github.com/abseil/abseil-cpp/issues/2153) | `ABSL_HAVE_ELF_MEM_IMAGE` assumes every ELF target ships `<link.h>` | Fixed by [PR #2154](https://github.com/abseil/abseil-cpp/pull/2154), merged 2026-09-27. Not RISC-V specific (bare-metal ELF toolchains, e.g. arm-none-eabi/newlib); listed here only because it surfaced in "riscv" keyword searches. |

**Correctness bugs (distinct from missing-optimization gaps):**

1. [#2002](https://github.com/abseil/abseil-cpp/issues/2002): two SEGFAULTs in internal telemetry/sampling code (`hashtablez` sampler, `cordz` sample token) on Debian riscv64. Production code paths that do not exercise these sampling subsystems are unaffected, but this is a genuine crash in shipped, released code, unresolved for nearly 8 months.
2. [#1702](https://github.com/abseil/abseil-cpp/issues/1702): a shared-library link failure that can prevent deployment entirely for consumers building with affected GCC 11-12 riscv64 toolchains (including via `FetchContent`), unresolved for 2+ years.

## 12. Objections and Upstream Blockers

**Structural blocker: Google's internal-adoption requirement.** Every change must be internally adopted, reviewed, and re-exported by a Google Abseil-team engineer before it lands on GitHub, per CONTRIBUTING.md. Community patches without an internal champion stall or close unmerged; this is the operating model, not a stated objection to RISC-V. The three warning-fix PRs (#1783, #1788, #1929) each merged in 0-15 days because Google had an internal RISC-V build consumer (V8, Chromium); the RDTIME PRs without such a consumer (#1550, #1631) were closed unmerged after months.

**[PR #1986](https://github.com/abseil/abseil-cpp/pull/1986) (CRC32C):** internally adopted by derekmauro on 2026-01-05, blocked purely on Google's internal access to RISC-V hardware for verification, not on any design objection. No public activity since that date (roughly 9 months as of 2026-09-30). This is a resourcing problem, plausibly solvable by providing hardware access.

**[Issue #1702](https://github.com/abseil/abseil-cpp/issues/1702) (atomics linker failure):** no Google-internal consumer of Abseil shared libraries on affected riscv64 GCC toolchains appears to have surfaced, so the bug has no internal priority. Unlikely to self-resolve without an external contributor proposing the `-latomic` CMake fix and a Google engineer championing it internally.

**[Issue #2002](https://github.com/abseil/abseil-cpp/issues/2002) (SEGFAULT on Debian):** no upstream response in nearly 8 months. Likely low internal priority because the failure is Debian-specific and does not affect Google's internal riscv64 builds (which the research found no evidence of in the first place, since there is no internal riscv64 CI at all). Investigation requires access to a Debian riscv64 build/test environment.

**[Issue #1236](https://github.com/abseil/abseil-cpp/issues/1236) (ILP32E):** no activity in about 4 years. ILP32E targets are embedded-only and not a documented focus for Google or any identified contributor.

**No stated objection to riscv64 as an architecture was found anywhere** in the issues, PRs, or governance documents reviewed. Maintainer derekmauro has accepted every RISC-V patch that cleared Google's internal review process. The consistent blocker across every open item is internal Google resourcing (hardware access, an internal champion, or internal priority), not policy opposition.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- Not an optimization-purpose project: Abseil is a general-purpose C++ foundation library (containers, strings, synchronization, hashing, time), not a SIMD/crypto/numerics performance-optimization library, so the optimization-purpose modifier does not apply and no optimization level is reported.
- **Justification:** Abseil has no upstream riscv64 CI at all: no `.github/workflows/` directory exists in the repository, and its internal Google Kokoro CI has no riscv64 job or Docker container per `ci/linux_docker_containers.sh` (confirmed independently twice in this research cycle, see Sections 3 and 7). It ships only source tarballs for every architecture on [GitHub releases](https://github.com/abseil/abseil-cpp/releases), so the upstream-CI and upstream-release rows are both "no." Applying the distribution floor: Ubuntu 26.04 (`libabsl-dev`/`libabsl20260107`, `20260107.0-4`, confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libabsl&suite=resolute) and independently via the Launchpad API) builds and ships riscv64 packages, and no riscv64-specific patches to the upstream source are documented in that packaging pipeline, which is a clean (unpatched) distro build. This upgrades the project from "no CI" to yellow.
- **Pending work that could change the grade:** open [PR #1986](https://github.com/abseil/abseil-cpp/pull/1986) (RISC-V Zbc/Zbkc hardware CRC32C acceleration, roughly 1.2x-1.6x speedup) is internally adopted by a Google maintainer but blocked on hardware access for verification; if merged it would not itself change the grade, since Abseil is not an optimization-purpose project, but it would remove a known performance gap. Three riscv64-specific bugs remain open and unresolved: [#1702](https://github.com/abseil/abseil-cpp/issues/1702) (shared-library linker failure needing `-latomic` on GCC 11-12, 2+ years), [#2002](https://github.com/abseil/abseil-cpp/issues/2002) (two test SEGFAULTs on Debian riscv64, unresolved since February 2026, tracked as Debian bug #1126886), and [#1236](https://github.com/abseil/abseil-cpp/issues/1236) (ILP32E stack-alignment assumption, unfixed since 2022). If any of these turn out to require riscv64-specific distro patches (rather than being merely undocumented in the packaging diff) or to indicate the vanilla build is actually broken, the grade should be revisited toward orange or red; this is reinforced by this cycle's unresolved discrepancy over Debian sid's current riscv64 build status (Section 8), which should be checked directly before treating that channel as a second confirmed distro. No RISE-funded engineering exists on Abseil itself; RISE's only contact is consumer-side (statically linking abseil-cpp into several riscv64 Python wheels) plus one blog post flagging an unfixed GCC 13 subword-atomics `static_assert` failure encountered incidentally.

## 14. Investment Analysis

RISE has no direct engineering investment in Abseil: no RISE-funded PR, no RISE-org repository targets it, and no working group claims it. All RISC-V work to date on Abseil itself has been community-driven without coordinated external funding. RISE's only documented contact with Abseil is consumer-side: the `riseproject-dev/python-wheels` project statically links abseil-cpp into several wheels it builds for riscv64 (Section 1), and the 2026-08-18 RISE blog post "PyTorch is available on riscv64!" surfaced a GCC 13 subword-atomics `static_assert` failure in Abseil that broke sentencepiece during that enablement work, a real, RISE-discovered riscv64 defect distinct from #1702 (missing `-latomic` on GCC 11-12) that has not been filed upstream as far as this research could determine.

### 14.1 Functional Enablement

- **Fix the atomics linker failure (#1702):** add `-latomic` to CMake shared-library link flags for riscv64, guarded by architecture and compiler-version checks. The code change is small; the bottleneck is getting it through Google's internal review, requiring an internal Abseil-team champion.
- **Reproduce and fix the hashtablez/cordz SEGFAULT on Debian riscv64 (#2002):** bisect to the toolchain or environment difference (GCC 15.2 vs. earlier, CMake version, or Debian-specific flags) and submit a fix or an upstream test condition.
- **Add an `ABSL_ARCH_RISCV` macro** in `absl/random/internal/platform.h` and corresponding detection in `randen_detect.cc`: a small, low-risk change that is a prerequisite for any future hardware AES/Zvkned path and corrects cache-line-size detection to be architecture-aware rather than a generic fallback.
- **Resolve the Debian sid riscv64 packaging discrepancy** noted in Section 8 (installed per the prior report vs. "Needs-Build" per `buildd.debian.org` in this cycle's adversarial check), since this report's yellow grade currently rests on Ubuntu's confirmed distro build.

### 14.2 Performance Optimization

- **Unblock PR #1986 (CRC32C Zbc/Zbkc):** already internally queued at Google; the only stated blocker is riscv64 hardware access for verification. Providing a 2.6 GHz-class riscv64 board to derekmauro's team would directly unblock this. Expected gain: roughly 1.2x-1.6x CRC32C throughput once Zbc/Zbkc is present in hardware and the PR lands.
- **Randen PRNG hardware path via Zvkned/Zvkg:** add `ABSL_ARCH_RISCV` detection plus a RISC-V vector-crypto (`vaeskf1`/`vaeskf2`/`vaesef`-family) implementation in `randen_hwaes_impl.cc`. This is new engineering work with no existing PR and no riscv64 benchmark data available from any source consulted.
- **Non-temporal memcpy and CPU feature detection:** both currently fall back to generic/scalar paths; adding riscv64-specific paths would require new engineering with no existing PR to build on.

### 14.3 CI/CD Infrastructure

Adding riscv64 to `ci/linux_docker_containers.sh` requires Google Kokoro access, which is not externally available, and Abseil uses no GitHub Actions at all for any architecture, so there is no lightweight GitHub Actions path either. The realistic options are: Google enabling a riscv64 Kokoro job internally (most likely to actually gate releases), or a community fork running a GitHub Actions workflow on RISE-hosted riscv64 runners (a parallel, non-gating CI, not the upstream CI that decides what ships).

### 14.4 Ecosystem Enablement

Not applicable. Abseil is a C++ library with no dependent package ecosystem of its own (no PyPI wheels, no npm packages, no Maven JARs) requiring separate riscv64 enablement; consumers such as Protocol Buffers, gRPC, and sentencepiece each have their own independent enablement status not covered by this report.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix atomics linker failure on riscv64 (#1702) | 1 (code) + 3 (Google internal advocacy) | Abseil-team contact required | Critical |
| Functional | Reproduce and fix hashtablez/cordz SEGFAULT on Debian riscv64 (#2002) | 2-4 (bisect + fix) | Community contributor with riscv64 Debian access | High |
| Functional | Resolve Debian sid riscv64 packaging status discrepancy | 0.5 (verification only) | Community / Debian riscv64 porters | High |
| Functional | Add `ABSL_ARCH_RISCV` macro and cache-line detection | 0.5 | Community + Abseil team | High |
| Performance | Provide riscv64 hardware access to unblock PR #1986 (CRC32C) | 0 engineering (hardware provision only) | RISE infrastructure / hardware vendor members | High |
| Performance | Randen PRNG Zvkned/Zvkg hardware path | 4-6 (new implementation + benchmarks) | Abseil team or community with Zvkned hardware | Medium |
| Performance | Non-temporal memcpy and CPU feature detection for riscv64 | 2-3 | Community + Abseil team | Low |
| CI/CD | GitHub Actions riscv64 workflow on RISE runners (non-gating) | 2 (workflow + infra) | RISE + community | Medium |

## 15. References

- [abseil/abseil-cpp GitHub repository](https://github.com/abseil/abseil-cpp)
- [Abseil homepage](https://abseil.io/)
- [PR #621: Add RISCV support to GetProgramCounter()](https://github.com/abseil/abseil-cpp/pull/621)
- [Issue #1236: RISCV ILP32E does not mandate 16-byte alignment for stack](https://github.com/abseil/abseil-cpp/issues/1236)
- [Issue #1561: Riscv build of Protobuf fails due to abseil](https://github.com/abseil/abseil-cpp/issues/1561)
- [PR #1550: Replace rdcycle instruction with rdtime](https://github.com/abseil/abseil-cpp/pull/1550)
- [PR #1631: unscaledcycleclock: use RDTIME instead of RDCYCLE on RISC-V](https://github.com/abseil/abseil-cpp/pull/1631)
- [PR #1644: unscaledcycleclock: remove RISC-V support](https://github.com/abseil/abseil-cpp/pull/1644)
- [Issue #1684: NegativeNaN test fails on riscv64](https://github.com/abseil/abseil-cpp/issues/1684)
- [Issue #1702: Can't link using riscv64 toolchain](https://github.com/abseil/abseil-cpp/issues/1702)
- [PR #1783: Fix a few warnings in RISC-V inlines](https://github.com/abseil/abseil-cpp/pull/1783)
- [PR #1788: Fix warning for sign-conversion on riscv](https://github.com/abseil/abseil-cpp/pull/1788)
- [PR #1929: Fix shorten-64-to-32 warning in stacktrace_riscv-inl.inc](https://github.com/abseil/abseil-cpp/pull/1929)
- [PR #1986: absl/crc: Add RISC-V hardware acceleration for CRC32C](https://github.com/abseil/abseil-cpp/pull/1986)
- [Issue #2002: Segfault in absl_hashtablez_sampler_test and absl_cordz_sample_token_test on riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [Issue #2153: ABSL_HAVE_ELF_MEM_IMAGE assumes every ELF target ships link.h](https://github.com/abseil/abseil-cpp/issues/2153)
- [PR #2154: debugging: define ElfW when the target has no link.h](https://github.com/abseil/abseil-cpp/pull/2154)
- [Debian bug #1126886 (forwarded from issue #2002)](http://www.mail-archive.com/debian-bugs-dist@lists.debian.org/msg2119363.html)
- [Debian bug #1025221 (historical, RDCYCLE/RDTIME related)](https://groups.google.com/g/linux.debian.bugs.dist/c/Rb2uPf0iJFg)
- [Debian buildd tracker: abseil (sid)](https://buildd.debian.org/status/package.php?p=abseil&suite=sid)
- [Ubuntu packages: libabsl search (resolute/26.04)](https://packages.ubuntu.com/search?keywords=libabsl&suite=resolute&searchon=names&section=all)
- [Ubuntu packages: libabsl-dev noble](https://packages.ubuntu.com/search?keywords=libabsl&suite=noble&searchon=names)
- [Arch Linux RISC-V port page](https://archriscv.felixc.at/?q=abseil)
- [Alpine edge abseil-cpp-stacktrace riscv64 package](https://pkgs.alpinelinux.org/package/edge/main/riscv64/abseil-cpp-stacktrace)
- [AUR android-riscv64-abseil-cpp package](https://aur.archlinux.org/packages/android-riscv64-abseil-cpp)
- [EESSI software-layer PR #1676](https://github.com/EESSI/software-layer/pull/1676)
- [PyPI: absl-py project page](https://pypi.org/project/absl-py/)
- [Google Foundational C++ Support Policy matrix](https://github.com/google/oss-policies-info/blob/main/foundational-cxx-support-matrix.md)
- [RISE Project blog: "PyTorch is available on riscv64!" (2026-08-18)](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [riseproject-dev/python-wheels GitHub repository](https://github.com/riseproject-dev/python-wheels)
- [RISE Python wheel builder supported packages](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project members](https://riseproject.dev/members/)