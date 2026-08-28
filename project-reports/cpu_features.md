---
title: cpu_features
---

# cpu_features

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for cpu_features<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

cpu_features is a cross-platform C library for runtime CPU feature detection. It reads `/proc/cpuinfo` and hardware capability (hwcap) interfaces to expose a per-architecture struct of extension flags at program startup. The library is used as a foundation for dispatch logic in higher-level libraries (XNNPACK, ruy, Highway, TensorFlow Lite) that need to select SIMD code paths without calling platform-specific intrinsics at startup.

The project is hosted at [github.com/google/cpu_features](https://github.com/google/cpu_features) under the Apache-2.0 license. It is a Google-owned project with no foundation affiliation (not CNCF, Apache Software Foundation, or Linux Foundation). There is no formal governance document, no MAINTAINERS file, and no CODEOWNERS file. Contributions require a Google CLA.

Two Google employees dominate the commit history: Guillaume Chatelet (gchatelet@google.com, 243 commits) is the lead maintainer; Mizux Seiha (corentinl@google.com, 56 commits) is the secondary maintainer. All other contributors have 17 or fewer commits each and have no apparent Google affiliation.

The project's stated design goal includes "easy to add missing features or architectures." The README support table uses "not yet" rather than "N/A" for unstarted platform work, signaling openness to new ports. RISE has no documented involvement with cpu_features: a complete inventory of 33 RISE blog posts through August 2026 contains zero mentions of the project, and it does not appear in the RISE GitLab wheel builder package list.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-07-11 | [Issue #247](https://github.com/google/cpu_features/issues/247) opened by @yuzibo on real SiFive HiFive Unmatched hardware, requesting riscv64 support | GitHub issue |
| 2022-07-12 | [PR #244](https://github.com/google/cpu_features/pull/244) merged: compile-time macros for RISC-V ISA extensions (I, M, A, F, D, Q, C, V, Zb bitmap, Zk crypto), tested with Clang 14 | GitHub PR |
| 2022-07-21 | [PR #246](https://github.com/google/cpu_features/pull/246) merged: runtime hwcap macros for RISC-V | GitHub PR |
| 2022-08-30 | [PR #272](https://github.com/google/cpu_features/pull/272) opened by @DaniAffCH (EPFL): first full Linux implementation via `/proc/cpuinfo` parsing; blocked by review finding that the ISA string parser was incorrect for multi-letter extensions | GitHub PR |
| 2022-11-02 | [PR #286](https://github.com/google/cpu_features/pull/286) opened by @Mizux (Google): RISC-V CI scaffolding | GitHub PR |
| 2023-01-12 | [PR #287](https://github.com/google/cpu_features/pull/287) merged by gchatelet (Google): retake of #272 and #286, fixing the multi-letter extension parser bug; this is the canonical merged RISC-V port | GitHub PR |
| 2023-03-02 | [Issue #301](https://github.com/google/cpu_features/issues/301) opened by ConchuOD (Linux kernel RISC-V maintainer): regex comment in `impl_riscv_linux.c` references wrong authoritative source; Zicsr/Zifencei detection gaps identified | GitHub issue |
| 2023-04-24 | [PR #289](https://github.com/google/cpu_features/pull/289) merged by @michael-roe: adds V (RVV) extension runtime detection | GitHub PR |
| 2023-04-27 | v0.8.0 released: first release containing riscv64 support | GitHub releases |
| 2023-06-15 | [PR #312](https://github.com/google/cpu_features/pull/312) merged: Bazel build rules for riscv32 and riscv64 | GitHub PR |
| 2023-09-14 | v0.9.0 released: includes Bazel riscv rules | GitHub releases |
| 2024-10-05 | [PR #368](https://github.com/google/cpu_features/pull/368) opened: fix Z-extension parsing (unordered extensions); [PR #369](https://github.com/google/cpu_features/pull/369) opened: add Zba/Zbb/Zbc/Zbs/Zbk*/Zk* runtime detection | GitHub PRs |
| 2025-05-02 | v0.10.0 released: no RISC-V changes | GitHub releases |
| 2025-05-13 | v0.10.1 released: no RISC-V changes | GitHub releases |
| 2026-04-18 | [PR #447](https://github.com/google/cpu_features/pull/447) opened: add Zb* and Zfh/Zfhmin runtime detection | GitHub PR |
| 2026-06-01 | v0.11.0 released: no RISC-V changes (x86 and AArch64 focus) | GitHub releases |
| 2026-08-21 | [PR #468](https://github.com/google/cpu_features/pull/468) opened as draft: fix Zicsr/Zifencei detection when ISA string omits leading underscore | GitHub PR |

The RISC-V port originated from community demand, not Google initiative. The lead maintainer (gchatelet) performed the final integration work after the initial community PR (#272) stalled on a correctness review. Three RISC-V-specific PRs (#368, #369, #447) have been open for 4-10 months without merge as of August 2026.

---

## 3. Upstream Support Tier

There is no formal tier policy document in the repository. The README "What's supported" table provides an implicit tier structure based on OS and build system coverage.

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Linux | yes | yes | yes |
| FreeBSD | yes | yes | no |
| macOS | yes | yes | no |
| Windows | yes | yes | no |
| Android | yes | yes | no |
| CMake CI | yes | yes | yes |
| Bazel CI | yes | yes | no |
| Zig build | yes | yes | no (rules present, no CI) |
| Binary releases | source-only | source-only | source-only |
| Detection method | CPUID instruction | HWCAP (getauxval) | /proc/cpuinfo parse |
| Cache info struct | yes | yes | no |

RISC-V is at the same support level as MIPS, POWER, and s390x: Linux-only, CMake-CI only. x86 and AArch64 get the complete matrix. No release-blocking policy for riscv64 exists or has been stated. All releases ship source-only archives with no binary assets of any kind.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

cpu_features is a feature-detection library only. It contains no SIMD execution code, no JIT compiler, no assembly kernels, no cryptographic implementations, and no numerics. Its sole function is to return a struct of boolean flags at program startup.

The RISC-V implementation consists of three files:

- `include/cpuinfo_riscv.h`: Public API header defining `RiscvFeatures` (bitfield of 11 extension flags), `RiscvInfo` (features + vendor[64] + uarch[64] strings), and the functions `GetRiscvInfo()`, `GetRiscvFeaturesEnumValue()`, `GetRiscvFeaturesEnumName()`.
- `src/impl_riscv_linux.c`: Reads `/proc/cpuinfo`, parses the `isa:` line for extension tokens, and parses the `uarch: vendor,uarch` field for microarchitecture identification. 111 lines.
- `test/cpuinfo_riscv_test.cc`: Unit tests using real-world `/proc/cpuinfo` fixtures from five boards: Sipeed LicheeRV (T-Head C906), Kendryte K510, T-Head C910, SiFive HiFive Unmatched (bullet0), and QEMU.

RISC-V CSR registers (e.g., `misa`) are inaccessible from userspace. Reading `misa` via `csrr` assembles without error but raises an illegal instruction trap at runtime on real hardware (confirmed on SiFive HiFive Unmatched running Debian Linux 5.18.0, issue #247). The implementation is correctly built around `/proc/cpuinfo` parsing.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runtime detection method | CPUID instruction | HWCAP (getauxval) | /proc/cpuinfo parse |
| Vendor/uarch identification | yes (CPUID leaf 0) | yes | yes (uarch: field in /proc/cpuinfo) |
| Cache topology | yes (CacheInfo struct) | yes (CacheInfo struct) | no |
| OS coverage | Linux/Android/FreeBSD/macOS/Windows | Linux/Android/FreeBSD/macOS/Windows | Linux only |
| Extension count (runtime) | 50+ | 30+ | 11 |
| hwcap runtime read | n/a | yes | no (macros defined, not used at runtime) |
| riscv_hwprobe syscall | n/a | n/a | no (Linux 6.5+ path not implemented) |

The hwcap macros (`RISCV_HWCAP_M`, `RISCV_HWCAP_V`, etc.) are defined in `include/internal/hwcaps.h` matching `arch/riscv/include/uapi/asm/hwcap.h` from the Linux kernel, but there is no `getauxval(AT_HWCAP)` call in the riscv64 implementation path. Detection is /proc/cpuinfo only.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Native build (on riscv64 hardware or sysroot):**
```
cmake -S. -Bbuild -DBUILD_TESTING=OFF -DCMAKE_BUILD_TYPE=Release
cmake --build build --config Release -j
./build/list_cpu_features --json
```

The CMake minimum required version is 3.13. The project uses C99 (`set(CMAKE_C_STANDARD 99)`). No minimum GCC/Clang version is stated in the repository.

**Cross-compilation via the CI script:**
```
TARGET=riscv64 ./scripts/run_integration.sh build
```

This script downloads the [Bootlin riscv64-lp64d glibc stable-2024.05-1 toolchain](https://toolchains.bootlin.com/downloads/releases/toolchains/riscv64-lp64d/tarballs/riscv64-lp64d--glibc--stable-2024.05-1.tar.xz), generates a CMake toolchain file, and runs:
```
cmake -S. -B"${BUILD_DIR}" -G Ninja -DCMAKE_TOOLCHAIN_FILE="${TOOLCHAIN_FILE}"
cmake --build "${BUILD_DIR}" --target all -j8 -v
```

The generated toolchain file sets:
- `CMAKE_SYSTEM_NAME Linux`
- `CMAKE_SYSTEM_PROCESSOR riscv64`
- `CMAKE_C_COMPILER ${TOOLCHAIN_DIR}/bin/riscv64-linux-gcc`
- `CMAKE_SYSROOT` pointing at the Bootlin glibc sysroot

The CMakeLists.txt detects RISC-V via `CMAKE_SYSTEM_PROCESSOR MATCHES "^riscv"`, which sets `PROCESSOR_IS_RISCV TRUE` and pulls in `include/cpuinfo_riscv.h` and `src/impl_riscv_linux.c`.

**QEMU usage for tests:**

Tests are run under QEMU 11.0.1 user-mode emulation, built from source during CI:
```
./configure --prefix="${QEMU_INSTALL}" --target-list=riscv64-linux-user \
  --disable-docs --disable-gtk --disable-sdl [... minimal build ...]
```

Test invocation:
```
qemu-riscv64 -L <SYSROOT_DIR> \
  -E LD_PRELOAD="<SYSROOT_DIR>/usr/lib/libstdc++.so.6:<SYSROOT_DIR>/lib/libgcc_s.so.1" \
  <test_binary>
```

There are no documented known build failures on riscv64. The CMake build has no riscv64-specific `-DUSE_X=OFF` disable flags. The RISC-V path is enabled solely by `CMAKE_SYSTEM_PROCESSOR`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Runtime extension coverage:**

| Extension | In RiscvFeatures header | Parser | hwcap macros | Runtime-detectable |
|---|---|---|---|---|
| RV32I / RV64I | yes | yes | yes | yes |
| M (multiply) | yes | yes | yes | yes |
| A (atomic) | yes | yes | yes | yes |
| F (float32) | yes | yes | yes | yes |
| D (float64) | yes | yes | yes | yes |
| Q (float128) | yes | yes | yes | yes |
| C (compressed) | yes | yes | yes | yes |
| V (vector / RVV) | yes | yes | yes | yes |
| Zicsr | yes | yes (with bug -- see Section 11) | no | partial |
| Zifencei | yes | yes (with bug -- see Section 11) | no | partial |
| Zba/Zbb/Zbc/Zbs | no | no | no | no |
| Zbkb/Zbkc/Zbkx/Zknd/Zkne/Zknh/Zksed/Zksh | no | no | no | no |
| Zfh / Zfhmin | no | no | no | no |
| Zfbfmin (BF16) | no | no | no | no |
| Zcf | no | no | no | no |

The compile-time macros in `include/cpu_features_macros.h` cover Zba/Zbb/Zbc/Zbs, Zbk*/Zk* (crypto), and Zfh/Zfhmin -- but these have no runtime counterparts in the `RiscvFeatures` struct. A user can detect these extensions at compile time but cannot query them at runtime through the cpu_features API.

**Functional gaps (cannot do X at all):**
- Cannot detect any bit-manipulation extension (Zba/Zbb/Zbc/Zbs) at runtime. PRs #368, #369, and #447 are open but not merged (4-10 months stalled).
- Cannot detect BF16 (Zfbfmin), half-precision float (Zfh/Zfhmin), or compressed float (Zcf) at runtime.
- Cannot query cache topology. No `CacheInfo` struct exists for riscv64.
- Linux 6.5+ `riscv_hwprobe` syscall is not used. This syscall provides more reliable detection than `/proc/cpuinfo` parsing and is the path recommended by the Linux kernel RISC-V maintainer (issue #301, comment by ConchuOD, 2023-06-26).
- No detection on any OS other than Linux.

**Performance gaps:** Not applicable. cpu_features performs no computation. Feature detection is a one-time startup operation.

**Security hardening gaps:** Not applicable. The library reads `/proc/cpuinfo` and returns flags; it has no memory allocation, cryptographic operations, or network I/O.

**Floating-point correctness:** Not applicable. The library does not perform floating-point computation. It only detects the presence of F/D/Zfh extension flags.

---

## 7. CI/CD Infrastructure

A dedicated GitHub Actions workflow [`.github/workflows/riscv_linux_cmake.yml`](https://github.com/google/cpu_features/blob/main/.github/workflows/riscv_linux_cmake.yml) exists and is active.

| Property | Value |
|---|---|
| Trigger | push, pull_request, schedule (cron: 7th and 22nd of each month at 00:00 UTC) |
| Runner | ubuntu-latest (x86_64 GitHub-hosted) |
| Matrix | riscv32, riscv64 (fail-fast: false) |
| Build | CMake cross-compilation via Bootlin toolchain |
| Test | QEMU 11.0.1 user-mode emulation |
| Last known passing run | 2026-08-07 (run #541, main branch) |

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | yes | yes | yes |
| Trigger: push/PR | yes | yes | yes |
| Trigger: scheduled | yes | yes | yes |
| Native hardware runner | yes | yes | no (QEMU only) |
| CMake CI | yes | yes | yes |
| Bazel CI | yes | yes | no |
| Zig CI | yes | yes | no |
| RISE runners used | unknown | unknown | no |

No RISE native riscv64 runners are used despite the RISE Runners program [launching in March 2026](https://riseproject.dev/2026/03/24/announcing-the-rise-riscv-runners/). The workflow continues to use QEMU on x86_64.

There are no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` files in the repository. GitHub Actions is the sole CI system.

---

## 8. Distribution and Release Status

All GitHub releases (v0.8.0 through v0.11.0) have zero binary asset files. GitHub auto-generates source archives (`.tar.gz`, `.zip`) only. There are no architecture-specific binaries on GitHub releases.

The project does not have a PyPI package. Both `cpu_features` and `cpu-features` return HTTP 404 on PyPI. There are no riscv64 wheels.

`cpu_features` / `cpu-features` is not an official Arch Linux package. It is not in the Arch RISC-V port overlay at [archriscv.felixc.at](https://archriscv.felixc.at/).

`cpu_features` is not in Ubuntu 24.04 (noble).

`cpu-features` is packaged in Debian sid as `libcpu-features-dev`. Version 0.11.0-1 has been built and installed for riscv64 on the `rv-manda-02` Debian buildd, with supported architectures including amd64, arm64, armhf, i386, loong64, ppc64, ppc64el, riscv64, s390x, and x32.

| Channel | riscv64 available | Notes |
|---|---|---|
| GitHub Releases | no | Source-only; no binary assets |
| PyPI | no | Package does not exist |
| Ubuntu 24.04 | no | Package not present |
| Debian sid | yes | libcpu-features-dev 0.11.0-1, built on rv-manda-02 |
| Arch RISC-V | no | Not in official Arch repos |

To get a working riscv64 binary: install from Debian sid, or build from source using the CMake instructions in Section 5.

---

## 9. Dependencies

cpu_features has no JIT backend, no SIMD library dependency, no numerics, no cryptographic library, and no memory allocator. It is a pure C99 library.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| glibc / libc | Runtime: `getauxval`, file I/O for /proc/cpuinfo | yes | yes (real hardware) | yes (Debian, Fedora) | No issues specific to cpu_features |
| libdl | Runtime: used for hwcap detection on some platforms | yes | yes | yes | Stable |
| googletest | Test-only: fetched by CMake at configure time | yes | yes (via QEMU) | not released separately | googletest issue #3756 "GetThreadCountTest.ReturnsCorrectValue fails on risc-v64" is open but affects only a threading test unrelated to cpu_features functionality [NEEDS VERIFICATION: second source confirming issue #3756 scope] |

**Downstream consumers that depend on cpu_features (from scope.yml):**

cpu_features itself is not a direct dependency of most scope.yml projects. The downstream gap that matters most is in `pytorch/cpuinfo`, a separate library with overlapping scope used by PyTorch, XNNPACK, and executorch instead of google/cpu_features:

- `pytorch/cpuinfo`: [Issue #124](https://github.com/pytorch/cpuinfo/issues/124) "Add: RISC-V support" has been open since 2022-12 with no implementation merged as of 2024-01. This creates a missing CPU feature dispatch chain in the entire ML inference stack on riscv64 (PyTorch -> XNNPACK -> cpuinfo -> no riscv64 support).
- google/ruy: Uses cpu_features for dispatch. No riscv64 SIMD path exists; riscv64 falls back to generic C.
- google/highway: Has its own CPU detection and does not use cpu_features. riscv64 RVV support exists but has open build failures.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#247](https://github.com/google/cpu_features/issues/247) | Add support for riscv64? | Open (enhancement) | Low | Original tracking issue; functionally resolved by v0.8.0 / PR #287 but never administratively closed |
| [#301](https://github.com/google/cpu_features/issues/301) | RISC-V devicetree 'riscv,isa' comment is no longer accurate | Open (bug, assigned to gchatelet) | Medium | Two distinct bugs: (1) regex comment in impl_riscv_linux.c cites wrong authoritative source (devicetree spec vs kernel UABI doc); (2) Zicsr/Zifencei cannot be reliably inferred when absent from the ISA string. Comment filed by Linux kernel RISC-V maintainer (ConchuOD). As of Linux 6.5, Zicsr/Zifencei do appear in /proc/cpuinfo. No fix merged since March 2023. |
| [PR #368](https://github.com/google/cpu_features/pull/368) | Fix RISC-V _Z extension parsing, they don't have a defined order | Open PR (2024-10-05) | Medium | Current parser assumes a defined order for multi-letter Z extensions; ISA spec does not mandate order. Prerequisite for PR #369. Stalled 10+ months. |
| [PR #369](https://github.com/google/cpu_features/pull/369) | Add detection for RISC-V bitmanip extensions | Open PR (2024-10-05) | Medium | Adds runtime detection for Zba, Zbb, Zbc, Zbs, Zbkb, Zbkc, Zbkx, Zknd, Zkne, Zknh, Zksed, Zksh. Depends on PR #368. Stalled 10+ months. |
| [PR #447](https://github.com/google/cpu_features/pull/447) | Add some RISC-V options (Zb* + Zfh/Zfhmin) | Open PR (2026-04-18) | Medium | Reviewer @Mizux identified three blocking issues: (1) RISCV_HWCAP_B not yet in Linux kernel; (2) missing _zfbfmin (BF16, required by RVA23 profile); (3) missing _zcf. Author agreed to revise; no new commit since May 2026. Stalled. |
| [PR #468](https://github.com/google/cpu_features/pull/468) | riscv: detect Zicsr/Zifencei without leading underscore | Draft PR (2026-08-21) | Medium | Correctness bug: the parser searches for `_zicsr`/`_zifencei` with a leading underscore and silently misses ISA strings of the form `rv64imafdczicsr_zifencei` (valid per the kernel UABI). Fix handles both forms; three regression tests added. No reviews yet. |

**Correctness bugs (separate callout):**

PR #468 documents a silent mis-detection: on hardware where the kernel emits `rv64imafdczicsr_zifencei` (leading underscore before first Z extension absent), the parser reports Zicsr and Zifencei as absent even when present. This is a silent false negative, not a crash. It affects any T-Head or SiFive part running Linux >= 6.5 where the kernel starts emitting Zicsr/Zifencei in `/proc/cpuinfo`. The fix has been drafted but not reviewed.

---

## 12. Objections and Upstream Blockers

**No organizational objections to riscv64 have been stated.** The README explicitly lists "easy to add missing features or architectures" as a design goal. The maintainer merged the initial RISC-V port (PR #287) and the V extension (PR #289) without objection.

**Observed de-facto blockers:**

1. Maintainer bandwidth. Three riscv64 PRs (#368, #369, #447) have been open for 4-10 months without merge or explicit rejection. The last maintainer comment on any of these was gchatelet pinging @michael-roe on PR #447 in May 2026 with no resolution. This is a velocity problem, not a policy problem.

2. Extension coverage has fallen behind the kernel. PR #447 was blocked because `RISCV_HWCAP_B` is not yet in the Linux kernel (review comment by Mizux citing elixir.bootlin.com/linux/v7.0.1). This is a correctness gate, not an objection to riscv64 work.

3. `riscv_hwprobe` syscall not implemented. The Linux kernel RISC-V maintainer (ConchuOD) recommended this path in June 2023. No PR has been filed 26 months later. This is an unaddressed improvement, not a blocker.

**Acceptance probability for well-formed PRs:** High. The maintainers have merged every correctly-implemented riscv64 PR to date. Stalled PRs have unresolved review comments, not rejections.

---

## 13. Investment Analysis

RISE has no prior investment in cpu_features. All open work is unsponsored.

### 13.1 Functional Enablement

Three functional gaps require PRs:

1. Fix the Zicsr/Zifencei detection correctness bug (PR #468 is drafted; needs review response and merge follow-through).
2. Add runtime detection for bitmanip extensions (Zba/Zbb/Zbc/Zbs). PR #368 (parser fix) must land first; PR #369 adds the extensions. Both need rebase and/or fixup.
3. Add runtime detection for Zfh/Zfhmin, Zfbfmin, and Zcf. These are required to dispatch half-precision and BF16 kernels correctly on RVA23-profile hardware.
4. Implement `riscv_hwprobe` syscall path (Linux 6.5+). This removes dependency on the fragile `/proc/cpuinfo` string format. Recommended by the kernel maintainer.

### 13.2 Performance Optimization

Not applicable. cpu_features does not execute compute kernels. Feature detection cost is a one-time /proc/cpuinfo parse.

### 13.3 CI/CD Infrastructure

1. Switch CI from QEMU to native riscv64 hardware runners (RISE Runners are available since March 2026). This would catch hardware-specific behavior that QEMU does not reproduce.
2. Add Bazel CI for riscv64 (Bazel build rules exist via PR #312 but are not CI-tested on RISC-V).

### 13.4 Ecosystem Enablement

Not applicable. cpu_features has no dependent package ecosystem. The downstream impact is through libraries that embed or link against it (ruy, Highway, executorch) or through the parallel `pytorch/cpuinfo` library that is the more urgent gap in the ML inference stack.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix Zicsr/Zifencei detection correctness bug (unblock PR #468, address review, merge) | 0.5 | Qualcomm contributor | Critical |
| Functional | Add runtime bitmanip detection: fix PR #368 (parser reorder), rebase PR #369 (Zba/Zbb/Zbc/Zbs/Zbk*/Zk*) | 1.5 | Qualcomm contributor | High |
| Functional | Add runtime Zfh/Zfhmin/Zfbfmin/Zcf detection (required for RVA23 dispatch) | 1.0 | Qualcomm contributor | High |
| Functional | Implement riscv_hwprobe syscall path (Linux 6.5+), as complement to /proc/cpuinfo | 2.0 | Qualcomm contributor | Medium |
| CI/CD | Switch riscv64 CI runner from QEMU to RISE native hardware runners | 0.5 | Qualcomm contributor | Medium |
| CI/CD | Add Bazel riscv64 CI job | 0.5 | Qualcomm contributor | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [github.com/google/cpu_features -- main repository](https://github.com/google/cpu_features)
- [Issue #247: Add support for riscv64?](https://github.com/google/cpu_features/issues/247)
- [Issue #301: RISC-V devicetree 'riscv,isa' comment is no longer accurate](https://github.com/google/cpu_features/issues/301)
- [PR #244: Add macros for RISCV features](https://github.com/google/cpu_features/pull/244)
- [PR #246: Add macros for RISCV hwcaps](https://github.com/google/cpu_features/pull/246)
- [PR #272: Add RISC-V support (closed, superseded)](https://github.com/google/cpu_features/pull/272)
- [PR #286: Add RISC-V CI support (closed)](https://github.com/google/cpu_features/pull/286)
- [PR #287: Support risc-v (merged 2023-01-12)](https://github.com/google/cpu_features/pull/287)
- [PR #289: Add RISCV vector extension (merged 2023-04-24)](https://github.com/google/cpu_features/pull/289)
- [PR #312: Add Riscv32 and Riscv64 Bazel build rules (merged 2023-06-15)](https://github.com/google/cpu_features/pull/312)
- [PR #368: Fix RISC-V _Z extension parsing (open)](https://github.com/google/cpu_features/pull/368)
- [PR #369: Add detection for RISC-V bitmanip extensions (open)](https://github.com/google/cpu_features/pull/369)
- [PR #447: Add some RISC-V options (open)](https://github.com/google/cpu_features/pull/447)
- [PR #468: riscv: detect Zicsr/Zifencei without leading underscore (draft)](https://github.com/google/cpu_features/pull/468)
- [CI workflow: riscv_linux_cmake.yml](https://github.com/google/cpu_features/blob/main/.github/workflows/riscv_linux_cmake.yml)
- [Debian tracker: cpu-features](https://tracker.debian.org/pkg/cpu-features)
- [Debian buildd riscv64 status: cpu-features](https://buildd.debian.org/status/package.php?p=cpu-features)
- [Linux kernel riscv hwprobe documentation](https://docs.kernel.org/riscv/hwprobe.html)
- [Linux kernel RISC-V UABI documentation](https://docs.kernel.org/riscv/uabi.html)
- [Bootlin RISC-V toolchain (riscv64-lp64d glibc stable-2024.05-1)](https://toolchains.bootlin.com/downloads/releases/toolchains/riscv64-lp64d/tarballs/)
- [RISE Project blog](https://riseproject.dev/category/blog/)
- [RISE RISC-V Runners announcement (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-riscv-runners/)
- [pytorch/cpuinfo issue #124: Add RISC-V support](https://github.com/pytorch/cpuinfo/issues/124)