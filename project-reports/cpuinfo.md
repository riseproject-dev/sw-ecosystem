---
title: cpuinfo
parent: Project Reports
categories:
  - libraries
---

# cpuinfo

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for cpuinfo
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

cpuinfo is a C library for runtime CPU feature detection, originally authored by Marat Dukhan at Meta. It is hosted under the [pytorch GitHub organization](https://github.com/pytorch/cpuinfo) and licensed under BSD-2-Clause. The library provides structured detection of ISA extensions, vendor identity, microarchitecture, cache topology, and processor/core/package layout. Its primary consumers are XNNPACK and PyTorch, which use it to select optimized dispatch paths at runtime.

There is no formal governance body, steering committee, or foundation membership. Merge authority rests entirely with Meta/PyTorch organization maintainers. A Facebook-managed CLA (code.facebook.com/cla) is required for all contributions. There is no MAINTAINERS, OWNERS, or CODEOWNERS file in the repository.

The founding engineer, Marat Dukhan (GitHub: Maratyszcza), stated explicitly during the review of PR #190 (November 2023) that he "no longer works on cpuinfo." Effective merge authority has passed to `malfet` (Meta/PyTorch), who is the sole active merger. Active contributors from Google (fbarchard, gonnet, enh-google) and Arm Ltd (LDong-Arm) have had patches merged. Linaro (gaborkertesz-linaro) has also contributed.

The project accepts incomplete ports. PR #190 was merged in November 2023 with explicitly noted gaps (uarch returns "unknown," cache info empty), establishing the precedent that skeleton-level RISC-V support is acceptable. The community stance toward new architecture ports is permissive but passive: contributions are accepted when submitted; proactive work by maintainers does not happen.

cpuinfo is not a RISE Project member. No RISE blog posts, funded work, or dedicated riseproject-dev repositories cover cpuinfo directly. cpuinfo appears only as an incidental dependency in RISE work on PyTorch and XNNPACK.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-12-23 | Issue #124 opened by `kassane` requesting riscv64 support | [Issue #124](https://github.com/pytorch/cpuinfo/issues/124) |
| 2023-05-12 | PR #148 opened by `GlassOfWhiskey`: cache detection, uarch, /proc/cpuinfo fallback, kernel version gating | [PR #148](https://github.com/pytorch/cpuinfo/pull/148) |
| 2023-08-24 | PR #190 opened by `prashanthswami`: foundational RISC-V support | [PR #190](https://github.com/pytorch/cpuinfo/pull/190) |
| 2023-11-12 | Maratyszcza states "I no longer work on cpuinfo" in PR #190 review | [PR #190](https://github.com/pytorch/cpuinfo/pull/190) |
| 2023-11-14 | PR #190 merged by `malfet`: RISCV32/RISCV64 headers, Bazel support, Linux init for topology, hwcap ISA detection (I/M/A/F/D/C/V), uarch stub | [PR #190](https://github.com/pytorch/cpuinfo/pull/190) |
| 2023-11-17 | PR #200 opened by `prashanthswami`: StarFive VisionFive V2 as test fixture | [PR #200](https://github.com/pytorch/cpuinfo/pull/200) |
| 2023-11-20 | PR #201 merged by `malfet`: missing android_riscv64 Bazel config_setting | [PR #201](https://github.com/pytorch/cpuinfo/pull/201) |
| 2024-01-05 | PR #212 merged: fix missing sys/hwprobe.h on glibc-based Linux | [PR #212](https://github.com/pytorch/cpuinfo/pull/212) |
| 2024-01-22 | PR #215 merged by `markdryan`: fix double-inclusion of sys/hwprobe.h breaking Ubuntu 23.10 | [PR #215](https://github.com/pytorch/cpuinfo/pull/215) |
| 2024-01-23 | PR #219 merged: Ubuntu 22.04 QEMU riscv64 CI | [PR #219](https://github.com/pytorch/cpuinfo/pull/219) |
| 2024-08-30 | PR #256 merged: Android NDK riscv64 cross-compile CI | [PR #256](https://github.com/pytorch/cpuinfo/pull/256) |
| 2025-05-22 | PR #295 merged: fix QEMU CI (add --platform linux/riscv64) | [PR #295](https://github.com/pytorch/cpuinfo/pull/295) |
| 2025-05-23 | PR #292 merged by `enh-google`: fix syscall type mismatch in riscv-hw.c | [PR #292](https://github.com/pytorch/cpuinfo/pull/292) |
| 2026-03-03 | PR #375 opened by `ken-unger`: add zfh/zvfh fp16 detection | [PR #375](https://github.com/pytorch/cpuinfo/pull/375) |
| 2026-04-15 | PR #375 merged by `malfet`: cpuinfo_has_riscv_zfh() and cpuinfo_has_riscv_zvfh() | [PR #375](https://github.com/pytorch/cpuinfo/pull/375) |
| 2026-05-07 | PR #388 opened: sysfs L1/L2 cache detection | [PR #388](https://github.com/pytorch/cpuinfo/pull/388) |
| 2026-06-20 | PR #302 opened: refactor ISA to compiled (FFI support for Rust/Python) | [PR #302](https://github.com/pytorch/cpuinfo/pull/302) |
| 2026-06-22 | PR #397 opened by `rajeshgangam`: comprehensive completion (28 ISA extensions, T-Head/SpacemiT vendor+uarch, sysfs cache) | [PR #397](https://github.com/pytorch/cpuinfo/pull/397) |

All RISC-V code is in the upstream repository at github.com/pytorch/cpuinfo. There is no downstream fork carrying out-of-tree patches. The port is fully upstream, though functionally incomplete.

Key contributors and affiliations:
- `prashanthswami` (affiliation not stated in findings) -- authored PR #190, the foundational port
- `markdryan` (affiliation not stated) -- authored PRs #212, #215, build fix work
- `enh-google` (Google) -- authored PR #292
- `ken-unger` (affiliation not stated) -- authored PR #375, tested on SiFive X280 and SpaceMit X60
- `fbarchard` (affiliation not stated in findings, active reviewer) -- approved multiple PRs
- `malfet` (Meta/PyTorch) -- sole active merger
- `rajeshgangam` (affiliation not stated) -- authored PR #397

---

## 3. Upstream Support Tier

cpuinfo has no published tier policy. Architecture support is informal: a port is "supported" when CI builds it and the maintainers do not revert it.

Evidence-based tier assessment:

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes, multiple jobs | Yes, multiple jobs | Yes, QEMU and Android NDK cross-compile |
| CI tests run | Yes | Yes | No -- build only |
| Official binary releases | No (source-only project) | No | No |
| Distro packages | Arch, Debian, Ubuntu | Arch, Debian, Ubuntu | Debian sid only (limited baseline) |
| Uarch decoded | Yes (~30+ models) | Yes (~30+ models) | No (always "unknown") |
| Cache info populated | Yes | Yes | No (empty) |
| ISA extensions detected | Hundreds | ~30+ | 9 (7 base + zfh + zvfh) |
| Mock test fixtures | Yes | Yes | No |
| Vendor recognition | Yes | Yes | SiFive only |

riscv64 is a second-class port by all measurable criteria. It builds and runs topology detection correctly, but the three most important features for dispatch consumers -- uarch, cache topology, and full ISA extension coverage -- are absent or incomplete.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

cpuinfo is a pure-C library with no JIT, no SIMD compute, no cryptographic primitives, and no garbage collector. Its architecture-specific work is entirely detection code: identifying what ISA extensions the CPU supports, which vendor and microarchitecture it is, and what cache sizes it has. There are no assembly files and no intrinsics anywhere in the RISC-V implementation.

### ISA Extension Detection

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Mechanism | CPUID | HWCAP / HWCAP2 / MRS | AT_HWCAP + hwprobe syscall |
| Number of extensions detected | Hundreds | ~30+ fields in ISA struct | 9 (I, M, A, F, D, C, V, Zfh, Zvfh) |
| Quality | Complete | Complete | Partial -- 28+ extensions in hwprobe ABI not yet wired to public API |
| Multi-letter Z-extensions | N/A | N/A | Zba/Zbb/Zbs/Zbc, vector crypto absent from public struct until PR #397 merges |

`src/riscv/linux/riscv-isa.c` decodes AT_HWCAP single-letter extensions (I/M/A/F/D/C/V). `src/riscv/linux/riscv-hw.c` calls the `riscv_hwprobe` syscall (NR_arch_specific_syscall + 14) and decodes vendor, marchid, mimplid, and ISA extension bits including Zfh and Zvfh. The code defines constants for ~30 ISA extensions in the hwprobe ABI, but as of the main branch, the parsing logic actively checks only two of them (Zfh at bit 27, Zvfh at bit 30). The remaining constants are dead code. PR #397 wires all of them to new public API fields.

The `cpuinfo_riscv_isa` struct on main exposes: i, e (RV32 only), m, a, f, d, c, v, zfh, zvfh. That is 10 fields total, 9 applicable to rv64.

An important note on the Android vs. glibc path: `riscv-hw.c` has an explicit comment that glibc patches adding `<sys/hwprobe.h>` exist but were not merged at time of writing. The Android `__riscv_hwprobe()` libc function is used on Android; Linux uses a raw `syscall()`. This is a documented workaround, not a permanent solution. The comment in the source notes glibc patches as available but unmerged; the current glibc status as of June 2026 is not confirmed in the research findings.

### Vendor and Microarchitecture Detection

`src/riscv/uarch.c` is a ~30-line stub. It recognizes one vendor: SiFive (mvendorid 0x489). All microarchitectures return `cpuinfo_uarch_unknown`. There is a literal TODO comment: "Add support for parsing chipset architecture and implementation IDs here, when a chipset of interest comes along."

For comparison, the x86 `uarch.c` is 445 lines covering Intel (P5 through Raptor Cove) and AMD (K5 through Zen 6). ARM uarch coverage includes ~30+ microarchitectures.

PR #397 adds marchid-based decoding for: SiFive U74 (7-series), T-Head C906, C908, C910, C920, and SpacemiT X60. It also adds vendor IDs for T-Head (0x5b7) and SpacemiT (0x61f). This PR is open as of June 22, 2026 with no reviewer assigned.

### Cache Detection

No RISC-V cache detection code exists. There is no equivalent of `src/x86/cache/` for RISC-V. All cache fields return zero. PRs #388 and #397 both propose sysfs-based L1i/L1d/L2/L3 detection; neither is merged. PR #397 is the more complete implementation, adding shared-cache deduplication and graceful degradation when sysfs is absent.

### Topology Initialization

`src/riscv/linux/init.c` implements full Linux processor/core/cluster/package topology via sysfs CPU maps (core_cpus_parser, cluster_cpus_parser, package_cpus_parser). This is comparable in structure to the ARM Linux init. A `__sync_synchronize()` barrier is used before publishing pointers. Goto-based cleanup on error. This component is functional and complete relative to what it attempts.

### No Assembly or SIMD

There are no `.S` files for RISC-V. There are no RVV intrinsics. There is no vector dispatch in cpuinfo itself. The library detects RVV (V extension) and Zvfh but does not use them. This is expected for a detection library.

---

## 5. Build System, Cross-Compilation, and Toolchain

### CMake configuration

`cmake_minimum_required(VERSION 3.18)`. CMake presets require `>= 3.21.0`.

Supported processor regex in CMakeLists.txt: `^(i[3-6]86|AMD64|x86(_64)?|armv[5-8].*|aarch64|arm64.*|ARM64.*|riscv(32|64))$`

Both riscv32 and riscv64 are explicitly matched. RISC-V is supported on Linux and Android only. No Windows or macOS RISC-V paths exist.

Source files compiled for riscv targets:
- `src/riscv/uarch.c` (all RISC-V)
- `src/riscv/linux/init.c` (Linux and Android)
- `src/riscv/linux/riscv-hw.c` (Linux and Android)
- `src/riscv/linux/riscv-isa.c` (Linux and Android)

No special compiler flags for RISC-V are set in the build system.

### Native Linux riscv64 build (QEMU or native hardware)

```bash
# From CI: riscv64/ubuntu:24.04 container via QEMU
apt update && apt install -y cmake git gcc g++
cd /cpuinfo && scripts/local-build.sh
```

`local-build.sh` runs:
```bash
mkdir -p build/local && cd build/local
cmake ../.. -DCMAKE_BUILD_TYPE=Release -DCMAKE_POSITION_INDEPENDENT_CODE=ON
cmake --build . -- -j$(nproc)
```

QEMU invocation from CI:
```bash
docker run --platform linux/riscv64 -i -v $(pwd):/cpuinfo riscv64/ubuntu:24.04 /bin/bash -c "..."
```

The CI uses `docker/setup-qemu-action@v3.0.0` on an `ubuntu-24.04` host runner. No minimum GCC version is specified in the build files. The CI image provides GCC 13.x from Ubuntu 24.04 packages.

### Android riscv64 cross-compile

```bash
cmake ../.. \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=riscv64 \
  -DANDROID_PLATFORM=android-35 \
  -DCPUINFO_BUILD_BENCHMARKS=OFF \
  -GNinja
```

NDK r27 is required (the first NDK with stable riscv64 support). Android API level 35 (Android 15) is used. `CPUINFO_BUILD_BENCHMARKS=OFF` is explicitly required for Android because the Google Benchmark CMakeLists is broken on Android.

### Toolchain file

No dedicated Linux riscv64 cross-toolchain file exists (no `cmake/riscv64.cmake` or equivalent). Linux cross-compilation requires either QEMU-in-container or a manually specified toolchain. There is no Dockerfile.riscv64. The CI uses the public `riscv64/ubuntu:24.04` Docker Hub image.

### Known build failures

- `<sys/hwprobe.h>` does not exist in glibc, causing build failures on RISC-V Linux before PRs #212 and #215 (January 2024). Fixed on main.
- XNNPACK issue #4650 (open since April 2023): `syscall` undeclared in `cpuinfo/src/api.c` at lines 319 and 338 under ISO C99 strict mode (`syscall(__NR_getcpu, ...)`). Root cause: missing `#include <unistd.h>` or equivalent. Zero maintainer engagement in 3 years. Affects cross-compilation workflows using Clang with strict C99 standards.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| Vendor identification | Complete | Complete | SiFive only; T-Head/SpacemiT missing | High |
| Microarchitecture decode | ~30+ models | ~30+ models | Always "unknown" | High |
| Cache topology L1i/L1d | Complete | Complete | Empty (zero) | High |
| Cache topology L2/L3 | Complete | Complete | Empty (zero) | High |
| ISA base extensions | Complete | Complete | Complete (I/M/A/F/D/C/V) | None |
| ISA vector extensions | Complete (AVX/AVX2/AVX-512) | Complete (NEON/SVE/SVE2) | V detected; Zvfh detected; Zvl/Zvkn etc. absent | High |
| ISA bit-manipulation | Complete | Complete | Zba/Zbb/Zbs/Zbc absent | Medium |
| ISA crypto extensions | Complete | Complete | All vector crypto absent from public API | Medium |
| fp16 scalar/vector detect | Complete | Complete | Zfh/Zvfh present (merged April 2026) | None |
| Processor topology | Complete | Complete | Complete | None |
| Mock test fixtures | Present | Present | None | Medium |
| cpuinfo_uarch enum values | ~30+ | ~30+ | None (all return unknown) | High |

The three high-severity gaps (vendor/uarch, cache topology, extended ISA) directly block XNNPACK and PyTorch from selecting hardware-optimized code paths on T-Head, SpacemiT, and any future non-SiFive RISC-V CPU. Without cache topology, frameworks cannot optimize tiling and blocking parameters. Without uarch detection, any per-microarchitecture tuning is impossible.

---

## 7. CI/CD Infrastructure

### Current CI jobs for riscv64

Both jobs are in `.github/workflows/build.yml`, triggered on every push to `main` and every pull request.

| Job name | Runner | Method | Tests run? | Notes |
|---|---|---|---|---|
| `cmake-linux-riscv64` | ubuntu-24.04 (x86) | QEMU via docker/setup-qemu-action@v3.0.0, riscv64/ubuntu:24.04 | No -- build only | `scripts/local-build.sh` only; no ctest |
| `cmake-android` (riscv64 matrix entry) | ubuntu-latest (x86) | Android NDK r27 cross-compile | No -- build only | `scripts/android-riscv64-build.sh` |

Neither CI job runs the test suite on riscv64. Both jobs verify only that the code compiles.

### Comparison with other architectures

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes | Yes | Yes |
| Test execution in CI | Yes | Yes | No |
| Native hardware runners | Yes | Yes (RISE runners available) | No |
| QEMU-emulated execution | N/A | N/A | Yes (build only) |
| Mock device tests | Yes | Yes | No (no fixtures exist) |

The riscv64 QEMU CI job was added by PR #219 (January 2024) and fixed by PR #295 (May 2025). The Android riscv64 CI job was added by PR #256 (August 2024).

RISE runners are available (RISE blog "Six Weeks In," May 2026, notes PyTorch CI running 870 jobs on RISE riscv64 runners), but cpuinfo does not use them. cpuinfo CI uses only x86 runners with QEMU emulation.

No native hardware CI exists. PR #200 (open since November 2023) proposed adding a StarFive VisionFive V2 as a test fixture but remains blocked on toolchain support.

---

## 8. Distribution and Release Status

cpuinfo does not publish versioned releases on GitHub. The releases page states "There aren't any releases here." The project is consumed as a source dependency (submodule in PyTorch's `third_party/cpuinfo`). There are no binary release artifacts of any kind.

| Distribution channel | riscv64 available? | Notes |
|---|---|---|
| GitHub Releases | No | No releases published at all |
| PyPI (py-cpuinfo) | Not applicable | py-cpuinfo (PyPI) is an unrelated pure-Python package; `py_cpuinfo-9.0.0-py3-none-any.whl` works everywhere but is not the pytorch/cpuinfo C library |
| Ubuntu 24.04 Noble (`libcpuinfo0`) | Yes | riscv64 package present |
| Ubuntu 24.04 Noble (`cpuinfo` binary utilities) | No | amd64, arm64, armhf only |
| Debian sid | Yes | `cpuinfo_0.0~git20250905.877328f-1+b1_riscv64.deb`, built on `rv-manda-02`, 49 kB installed |
| Arch Linux (official) | No | x86_64 only |
| Arch RISC-V (archriscv.felixc.at) | Unverified | Endpoints returned 404 |

The Debian sid package deserves scrutiny. It was built from a September 2025 git snapshot (commit 877328f). At that date, PR #397 (cache topology, extended ISA, T-Head/SpacemiT) was not yet filed, PR #375 (zfh/zvfh) had not yet merged, and PR #148 (comprehensive improvements, open since May 2023) was still stalled. The package installs successfully but delivers uarch="unknown," cache sizes all zero, and 7 ISA extensions detected. It is a functional package with a non-functional riscv64 feature set.

To get a working riscv64 build today, a user must build from source using the main branch. QEMU-based build requires Docker with binfmt_misc support and the `riscv64/ubuntu:24.04` image. NDK cross-compile requires NDK r27.

---

## 9. Dependencies

### Runtime dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Linux kernel (>= 6.4) | `riscv_hwprobe` syscall for ISA/vendor/uarch detection | N/A (kernel ABI) | Functional on >= 6.4; graceful degradation on older via raw syscall | Ships in mainstream distros | hwprobe bit for Zvfbfwma requires kernel 6.15+; cpuinfo falls back to hwcap for unsupported bits |
| glibc / Android Bionic | `getauxval()`, pthreads, `syscall()` | Green | Green (QEMU CI for glibc; Android NDK CI for Bionic) | Ships in all distros | glibc `<sys/hwprobe.h>` not yet merged (comment in riscv-hw.c); raw syscall() used as workaround |
| Android log library (`-llog`) | Logging on Android | Green | Green (NDK r27 CI) | Ships in NDK r27+ | None |

### Test/benchmark dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| GoogleTest (google/googletest) | Unit tests and mock device tests | Green | Mostly green; issue #3756 (`GetThreadCountTest.ReturnsCorrectValue` fails on riscv64), low severity | Source build only | Issue #3756 (open): one flaky thread-count test on riscv64 |
| Google Benchmark (google/benchmark) | Microbenchmarks | Green | Green | Source build only | Issue #1802 (closed, fixed): cycleclock type mismatch on riscv64. Issue #1549 (closed, fixed): CPU frequency estimation on RISC-V. No open riscv64 issues. |

### Critical downstream consumers

The following projects depend on cpuinfo for riscv64 dispatch. cpuinfo's gaps cascade into them.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Impact of cpuinfo gaps |
|---|---|---|---|---|---|
| XNNPACK (google/XNNPACK) | ISA dispatch for neural network kernels | Green (cross-compile) | Broken -- 100+ RVV FP16 test failures (issue #9886, open April 2026) | No riscv64 binary | Root cause: PR #9516 unconditionally enables `xnn_arch_riscv_vector_fp16_arith` when V is present without checking Zvfh. cpuinfo fix (PR #375, merged April 2026) is prerequisite; XNNPACK also needs update. Also: XNNPACK issue #4650 (syscall undeclared in cpuinfo under strict C99, open 3 years). |
| PyTorch (pytorch/pytorch) | Bundles cpuinfo as third_party/cpuinfo submodule | Green | Broken for RVV FP16 (inherits XNNPACK issue #9886) | No riscv64 PyPI wheel | Inherits all cpuinfo riscv64 gaps; cpuinfo zvfh fix is prerequisite to PyTorch FP16 correctness on Zvfh targets |
| oneDNN (oneapi-src/oneDNN) | Runtime RISC-V ISA detection | Green (with workaround) | Green via SIGILL probe | Available in Debian sid | Low coupling: oneDNN uses its own SIGILL-probe fallback for Zvfbfwma because HWPROBE bit requires kernel 6.15+; does not rely on cpuinfo for riscv64 |

The critical dependency chain is: cpuinfo riscv64 gaps -> XNNPACK dispatch errors -> PyTorch compute correctness failures. Merging PR #397 resolves the uarch/vendor/cache/ISA gaps. The XNNPACK unconditional Zvfh enable (issue #9886) also requires a fix on the XNNPACK side after cpuinfo merges PR #397.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #124](https://github.com/pytorch/cpuinfo/issues/124) | Add: RISC-V support | Open since 2022-12-23 | Tracking | Master tracking issue; linked to PR #397 as closure target |
| [PR #397](https://github.com/pytorch/cpuinfo/pull/397) | riscv/linux: complete ISA extension, vendor/uarch, and cache support | Open, no reviewer, CLA signed | Critical | 28 ISA extensions, T-Head/SpacemiT vendor+uarch, sysfs cache; filed 2026-06-22; blocks XNNPACK/PyTorch FP16 completeness |
| [PR #148](https://github.com/pytorch/cpuinfo/pull/148) | Improve support for RISC-V architecture on Linux | Open since 2023-05-12 | Medium | Stalled 2.5 years; subsumes into PR #397; one APPROVED review (fbarchard), still awaiting malfet/topperc |
| [XNNPACK #4650](https://github.com/google/XNNPACK/issues/4650) | syscall undeclared in cpuinfo/src/api.c under ISO C99 strict mode | Open since 2023-04-13 | High | `syscall(__NR_getcpu, ...)` without `<unistd.h>` breaks cross-compilation under Clang strict C99; zero maintainer engagement in 3 years |
| [XNNPACK #9886](https://github.com/google/XNNPACK/issues/9886) | 100+ RVV FP16 test failures | Open since April 2026 | High | Root: XNNPACK PR #9516 unconditionally enables Zvfh dispatch when V present; needs cpuinfo zvfh API (now merged in PR #375) plus XNNPACK-side fix |
| [GoogleTest #3756](https://github.com/google/googletest/issues/3756) | GetThreadCountTest.ReturnsCorrectValue fails on riscv64 | Open | Low | Flaky test in cpuinfo's test dependency; not a correctness issue |
| [PR #200](https://github.com/pytorch/cpuinfo/pull/200) | Add starfive-visionfive-v2 as example rv64 board | Open since 2023-11-17 | Low | Blocked on toolchain support; no fixture means regressions not caught |
| [PR #302](https://github.com/pytorch/cpuinfo/pull/302) | Refactor CPU ISA to be compiled instead of static | Open since 2025-06-20 | Low | Blocked on CLA and missing CMakeLists/Bazel/Android.mk updates |
| [PR #388](https://github.com/pytorch/cpuinfo/pull/388) | Add support for retrieving RISC-V L1 and L2 cache sizes | Open since 2026-05-07 | Medium | Overlaps with and will be superseded by PR #397 |

### Correctness bugs specifically

1. `uint32_t` truncation of 64-bit marchid values: present on main until PR #397 merges. The bug truncates the high 32 bits of marchid, causing vendor/uarch misidentification on hardware with marchid values exceeding UINT32_MAX. PR #397 fixes this.

2. XNNPACK #9886: 100+ test failures in RVV FP16 kernels due to incorrect dispatch. Functionally incorrect results on hardware that has V but not Zvfh, because XNNPACK enables Zvfh dispatch unconditionally when V is detected. This is a compute-correctness bug in XNNPACK triggered by inadequate cpuinfo ISA discrimination.

---

## 12. Objections and Upstream Blockers

### Maintainer bottleneck

`malfet` (Meta/PyTorch) is the sole active merger. PR #375 (zfh/zvfh detection) was approved by `fbarchard` on 2026-03-04 and not merged until 2026-04-15 -- 42 days. PR #148 has been open 2.5 years with one APPROVED review and no merge action. The founding engineer (Maratyszcza) explicitly withdrew. There is no succession plan and no CODEOWNERS file.

PR #397 (filed 2026-06-22) has no reviewer assigned and no response as of the research date (2026-06-23, one day after filing). Based on the pattern of PR #375, a realistic merge timeline is 6-12 weeks if the PR is technically sound, or indefinite if it requires significant iteration.

### No stated objections to RISC-V

No maintainer has objected to RISC-V support. PR #190 was merged without controversy. The gap is not resistance but inattention: the single merger is a bottleneck who processes PRs when pinged.

### Technical blockers

1. glibc `<sys/hwprobe.h>` integration: `riscv-hw.c` uses a raw `syscall()` workaround pending glibc merge of hwprobe API. This is not blocking current functionality but is technical debt.

2. No native hardware CI: QEMU does not expose real vendor/marchid CSR values or real cache sysfs topology. PR #397 notes that real hardware validation (VisionFive 2, BananaPi BPI-F3) was not completed. Any hardware-specific bugs in vendor/uarch decode or cache parsing will not be caught by CI.

3. PR #148 and PR #397 overlap: two open PRs both address cache detection. PR #388 also overlaps with PR #397 on cache. Maintainer will need to choose which to merge; duplicated review effort is likely.

### Acceptance probability

High for PR #397 given: CLA signed, no open objections, builds cleanly on QEMU and cross-compile, closes the master tracking issue. The only risk is the 42-day+ merge latency from the sole maintainer.

---

## 13. Investment Analysis

RISE has not funded or contributed any work to cpuinfo. The following sizing reflects only unfinished work.

### 13.1 Functional Enablement

PR #397 (filed 2026-06-22) covers the three highest-priority gaps: 28 ISA extensions, T-Head/SpacemiT vendor+uarch, and sysfs cache topology. The code exists. The gap is review and merge velocity, not missing implementation. However, real hardware testing was not completed by the PR author. A small investment in hardware validation would derisk the PR and likely accelerate merge.

Separately, XNNPACK issue #9886 (100+ FP16 test failures) requires a coordinated fix between cpuinfo (PR #375 already merged) and XNNPACK (unconditional Zvfh dispatch in PR #9516 needs correction). This is the highest-impact correctness issue downstream of cpuinfo.

The `syscall` undeclared bug (XNNPACK #4650, open 3 years) is a one-line fix adding `#include <unistd.h>` to cpuinfo's `src/api.c`. Zero maintainer engagement suggests a submitted PR would be required to get it merged.

### 13.2 Performance Optimization

Not applicable. cpuinfo is a detection library with no compute paths. It executes once at program startup. There is no runtime hotpath to optimize.

### 13.3 CI/CD Infrastructure

Current CI is build-only and QEMU-based. Adding test execution to the QEMU CI job (running `ctest` inside the container) requires modifying the single YAML step to append `ctest --output-on-failure`. Estimated effort: 1-2 hours. Maintainer resistance: none.

Adding native hardware CI (e.g., RISE riscv64 runners) would enable testing vendor/uarch decode and cache sysfs paths that QEMU cannot exercise. This is the only way to catch hardware-specific bugs in the code being added by PR #397.

Adding riscv64 mock test fixtures (analogous to the existing arm64 and x86 fixtures) would allow CI to validate ISA detection logic without hardware. This requires creating fixture files and extending the test framework. No fixtures exist today.

### 13.4 Ecosystem Enablement

cpuinfo has no package ecosystem of its own. Its impact is entirely through XNNPACK and PyTorch. The downstream correctness fix (XNNPACK #9886) is the most impactful single action reachable from cpuinfo work.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Hardware validation for PR #397 (VisionFive 2 / BananaPi BPI-F3) to accelerate merge | 1 | Contributor with hardware access | Critical |
| Functional | Fix XNNPACK #9886: coordinate cpuinfo PR #375 (merged) with XNNPACK unconditional Zvfh dispatch fix | 1 | XNNPACK contributor | Critical |
| Functional | Fix XNNPACK #4650: add `#include <unistd.h>` to cpuinfo src/api.c, submit PR | 0.1 | Any contributor | High |
| Functional | riscv64 mock test fixtures for ISA detection (analogous to arm64 fixtures) | 2 | Any contributor | High |
| CI/CD | Enable ctest execution inside QEMU CI job (one-line YAML change) | 0.1 | Any contributor | High |
| CI/CD | Add native riscv64 CI runner (RISE runners) for vendor/uarch/cache testing | 1 | Contributor with RISE runner access | Medium |
| Functional | glibc hwprobe API integration (remove Android-only #ifdef, use glibc `<sys/hwprobe.h>` when available) | 1 | Contributor | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [pytorch/cpuinfo repository](https://github.com/pytorch/cpuinfo)
- [Issue #124 -- Add: RISC-V support](https://github.com/pytorch/cpuinfo/issues/124)
- [PR #148 -- Improve support for RISC-V architecture on Linux](https://github.com/pytorch/cpuinfo/pull/148)
- [PR #190 -- Add limited support for RISC-V initialization](https://github.com/pytorch/cpuinfo/pull/190)
- [PR #200 -- Add starfive-visionfive-v2 as example rv64 board](https://github.com/pytorch/cpuinfo/pull/200)
- [PR #201 -- Add android_riscv64 to BUILD.bazel](https://github.com/pytorch/cpuinfo/pull/201)
- [PR #212 -- Fix RISC-V Linux build](https://github.com/pytorch/cpuinfo/pull/212)
- [PR #215 -- Fix RISC-V Linux build again](https://github.com/pytorch/cpuinfo/pull/215)
- [PR #219 -- ci: Add an Ubuntu:22.04 builder for RISC-V](https://github.com/pytorch/cpuinfo/pull/219)
- [PR #256 -- Add android-riscv64 build to workflows](https://github.com/pytorch/cpuinfo/pull/256)
- [PR #292 -- riscv-hw.c: match kernel type in syscall()](https://github.com/pytorch/cpuinfo/pull/292)
- [PR #295 -- CI: Fix riscv64-in-qemu build](https://github.com/pytorch/cpuinfo/pull/295)
- [PR #302 -- Refactor CPU ISA to be compiled instead of static](https://github.com/pytorch/cpuinfo/pull/302)
- [PR #375 -- Add riscv half-precision floating point detection](https://github.com/pytorch/cpuinfo/pull/375)
- [PR #388 -- Add support for retrieving RISC-V L1 and L2 cache sizes](https://github.com/pytorch/cpuinfo/pull/388)
- [PR #397 -- riscv/linux: complete ISA extension, vendor/uarch, and cache support](https://github.com/pytorch/cpuinfo/pull/397)
- [XNNPACK issue #4650 -- syscall undeclared in cpuinfo src/api.c under ISO C99 strict mode](https://github.com/google/XNNPACK/issues/4650)
- [XNNPACK issue #9886 -- 100+ RVV FP16 test failures](https://github.com/google/XNNPACK/issues/9886)
- [XNNPACK PR #9516 -- unconditional Zvfh dispatch enable](https://github.com/google/XNNPACK/pull/9516)
- [GoogleTest issue #3756 -- GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [Ubuntu Noble packages -- libcpuinfo0](https://packages.ubuntu.com/search?keywords=cpuinfo&suite=noble&searchon=names&section=all)
- [Debian buildd -- cpuinfo riscv64 status](https://buildd.debian.org/status/package.php?p=cpuinfo)
- [RISE Project blog](https://riseproject.dev/blog)
- [riscv-hw.c -- main branch](https://raw.githubusercontent.com/pytorch/cpuinfo/main/src/riscv/linux/riscv-hw.c)
- [build.yml -- main branch](https://raw.githubusercontent.com/pytorch/cpuinfo/main/.github/workflows/build.yml)
- [android-riscv64-build.sh -- main branch](https://raw.githubusercontent.com/pytorch/cpuinfo/main/scripts/android-riscv64-build.sh)