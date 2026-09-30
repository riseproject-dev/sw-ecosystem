---
title: cpuinfo
parent: Project Reports
color: yellow
dependencies:
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: benchmark
    relation: test-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: optional
  - name: Android NDK
    relation: build-dependency
    criticality: critical
  - name: Bazel
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: Bionic
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="cpuinfo" %}

# cpuinfo

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for cpuinfo<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

cpuinfo is a C library for runtime CPU feature detection, originally authored by Marat Dukhan. It is hosted under the [pytorch GitHub organization](https://github.com/pytorch/cpuinfo) and licensed under Simplified BSD (BSD-2-Clause); copyright holders listed in LICENSE are Google LLC (2019), Facebook Inc. (2017-2018), Georgia Institute of Technology (2012-2017), and Marat Dukhan (2010-2012). The library provides structured detection of ISA extensions, vendor identity, microarchitecture, cache topology, and processor/core/package layout. Its primary consumers are XNNPACK and PyTorch, which use it to select optimized dispatch paths at runtime. cpuinfo is a CPU-feature/topology detection library, not itself a SIMD or other performance-critical hot path: it runs once at startup and its own code contains no vectorized or JIT-compiled logic.

Governance is informal. No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `GOVERNANCE.md`, or `docs/platforms/` file exists anywhere in the repository. `CONTRIBUTING.md` describes a standard fork/PR workflow and requires signing Facebook's CLA (code.facebook.com/cla); security issues route through Facebook's bug bounty program. PyTorch itself sits under the PyTorch Foundation, hosted by the Linux Foundation, but the Foundation's named project portfolio (core PyTorch, vLLM, DeepSpeed, Ray, Helion, Safetensors) does not explicitly list cpuinfo as a chartered sub-project; it is a dependency library hosted in the org, not a formally governed one.

Merge authority in practice rests with a small set of PyTorch-affiliated engineers. Full-history commit analysis (863 commits back to 2017) shows Marat Dukhan (471 + 35 commits, Facebook then Google) as the dominant historical author, followed by Frank Barchard (~37, Google, also the most active recent committer), Pedro Gonnet (25, Google), Digant Desai (16, Meta), Prashanth Swaminathan (10, authored the initial RISC-V port), and Nikita Shulga / "malfet" (9 commits, Meta/PyTorch core maintainer, but dominant in recent merge activity). Recent (since Jan 2024) committer email-domain tally: google.com (65), meta.com (20), gmail/personal (48), intel.com (4), rivosinc.com (2, Rivos Inc., a RISC-V chip startup), fujitsu.com (2), oss.qualcomm.com (1), linaro.org (1). Day-to-day stewardship is effectively Google and Meta/PyTorch engineers, with occasional RISC-V-vendor contributions.

The project accepts incomplete architecture ports. PR [#190](https://github.com/pytorch/cpuinfo/pull/190) was merged in November 2023 with explicitly noted gaps (uarch returns "unknown," cache info empty), establishing that skeleton-level RISC-V support is an acceptable starting point. New-architecture acceptance (RISC-V, and similarly `linux_ppc64le` added separately) runs through ordinary community PRs reviewed by the same handful of Google/Meta-affiliated maintainers, driven by downstream need (XNNPACK/PyTorch wanting RVV/fp16 detection) rather than a written roadmap or tiering policy.

cpuinfo is not a RISE Project member (neither `cpuinfo`, `pytorch`, nor `XNNPACK` appear on RISE's [members page](https://riseproject.dev/members/)). There is no dedicated RISE blog post, repository, or wheel-builder listing for cpuinfo; it surfaces only as an incidental upstream dependency inside RISE's PyTorch-on-riscv64 bring-up work. Several RISE Premier/General members (SiFive, SpacemiT, and Alibaba/T-Head-adjacent organizations) are exactly the silicon vendors whose microarchitectures are being added to cpuinfo's RISC-V detection code in open PR #397, even though no formal RISE affiliation exists.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-12-23 | Issue #124 opened by kassane requesting riscv64 support | [Issue #124](https://github.com/pytorch/cpuinfo/issues/124) |
| 2023-05-12 | PR #148 opened by GlassOfWhiskey: cache detection, uarch, /proc/cpuinfo fallback, kernel-version gating; competed with #190 | [PR #148](https://github.com/pytorch/cpuinfo/pull/148) |
| 2023-08-24 | PR #190 opened by prashanthswami: foundational RISC-V support | [PR #190](https://github.com/pytorch/cpuinfo/pull/190) |
| 2023-11-12 | Maratyszcza states "I no longer work on cpuinfo" during PR #190 review, handing review to malfet | [PR #190](https://github.com/pytorch/cpuinfo/pull/190) |
| 2023-11-14 | PR #190 merged by malfet: RISCV32/RISCV64 headers, Bazel support, Linux init for topology, hwcap ISA detection (I/M/A/F/D/C/V), uarch stub | [PR #190](https://github.com/pytorch/cpuinfo/pull/190) |
| 2023-11-17 | PR #200 opened: add StarFive VisionFive V2 as an example rv64 test fixture (still open) | [PR #200](https://github.com/pytorch/cpuinfo/pull/200) |
| 2023-11-20 | PR #201 merged: missing android_riscv64 Bazel config_setting | [PR #201](https://github.com/pytorch/cpuinfo/pull/201) |
| 2024-01-22 | PR #215 merged by markdryan: fix duplicate `<sys/hwprobe.h>` include breaking the RISC-V Linux build | [PR #215](https://github.com/pytorch/cpuinfo/pull/215) |
| 2024-01-23 | PR #219 merged: Ubuntu 22.04 QEMU riscv64 CI builder, explicitly gated on #215 landing first ("Once #215 is merged I'll rebase this patch") | [PR #219](https://github.com/pytorch/cpuinfo/pull/219) |
| 2024-08-30 | PR #256 merged: Android NDK riscv64 cross-compile CI matrix entry, fixes issue #206 | [PR #256](https://github.com/pytorch/cpuinfo/pull/256) |
| 2025-05-22 | PR #295 merged by malfet: fix QEMU CI by adding `--platform linux/riscv64` to `docker run` | [PR #295](https://github.com/pytorch/cpuinfo/pull/295) |
| 2025-05-23 | PR #292 merged by enh-google: fix syscall type mismatch (cpu_set_t) in riscv-hw.c | [PR #292](https://github.com/pytorch/cpuinfo/pull/292) |
| 2026-04-14/15 | Commit d05fbcd5 (PR #375) merged by malfet: `cpuinfo_has_riscv_zfh()`/`cpuinfo_has_riscv_zvfh()` fp16 detection, for XNNPACK's RVV fp16 kernels | [commit d05fbcd5](https://github.com/pytorch/cpuinfo/commit/d05fbcd57dc096718c4979e7c054e628f1f3520b) |
| 2026-05-07 | PR #388 opened: sysfs L1/L2 cache detection (still open, overlaps #397) | [PR #388](https://github.com/pytorch/cpuinfo/pull/388) |
| 2026-06-20 | PR #302 opened: refactor ISA detection to compiled (FFI support for Rust/Python), still open | [PR #302](https://github.com/pytorch/cpuinfo/pull/302) |
| 2026-06-22 | PR #397 opened by rajeshgangam: complete ISA extension, vendor/uarch, and cache support; closes tracking issue #124 | [PR #397](https://github.com/pytorch/cpuinfo/pull/397) |
| 2026-07-15 | PR #421 opened by CodersAcademy006: fix spurious ERROR-level log spam from a `-1` topology-id sentinel on real riscv64 hardware | [PR #421](https://github.com/pytorch/cpuinfo/pull/421) |
| 2026-08-18 | luhenry approves PR #397, stating a preference for it over the competing PR #388 ("so we get all features in one go") | [PR #397](https://github.com/pytorch/cpuinfo/pull/397) |
| 2026-09-17 | XYenChi comments "lgtm" on PR #397; still open, unmerged | [PR #397](https://github.com/pytorch/cpuinfo/pull/397) |

All RISC-V code lives in the upstream repository; there is no downstream fork carrying out-of-tree patches. The port is fully upstream, though functionally incomplete: as of HEAD `66ee79c` (2026-07-30), main does not yet contain PR #397's T-Head/SpacemiT vendor decode, 28 new ISA flags, or sysfs cache detection, and does not contain PR #421's topology-id log fix.

Key contributors and affiliations: prashanthswami (authored the foundational PR #190); markdryan / Mark Ryan, markdryan@rivosinc.com (Rivos Inc., a RISC-V chip startup) fixed the RISC-V Linux build and added the QEMU CI builder; enh-google (Google) fixed a syscall type issue; ken-unger authored the fp16 detection PR #375, crediting RVV microkernel work in both XNNPACK and cpuinfo; fbarchard (Google) is an active reviewer; malfet (Meta/PyTorch) is the effective sole active merger; rajeshgangam authored the large, still-open PR #397; CodersAcademy006 authored the still-open PR #421.

## 3. Upstream Support Tier

cpuinfo has no published tier policy. Architecture support is informal: a port is "supported" when CI builds it and maintainers do not revert it.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes, multiple jobs | Yes, multiple jobs | Yes, QEMU-emulated Linux job and Android NDK cross-compile job |
| CI tests executed | Compiled under CI, no `ctest` invocation anywhere in `build.yml` for any platform | Same | Same -- build only, confirmed by a direct read of `.github/workflows/build.yml` |
| Official binary releases | No (project has zero tagged GitHub releases, any architecture) | No | No |
| Distro packages | Ubuntu, Debian, Arch (official) | Ubuntu, Debian, Arch (official) | Ubuntu 26.04 "resolute" (universe/ports), Debian sid, unofficial Arch RISC-V port -- all built from unmodified git snapshots, not tagged releases |
| Uarch decoded | Yes (Intel P5-Raptor Cove, AMD K5-Zen family, ~445-line table) | Yes (~30+ microarchitectures, large chipset DB) | No on main (always `cpuinfo_uarch_unknown`); SiFive, T-Head, SpacemiT decode added only in open PR #397 |
| Cache info populated | Yes (2,171 lines across 3 files) | Yes (1,786-line cache.c) | No on main (no `src/riscv/cache.c` exists); sysfs-based detection added only in open PR #397 |
| ISA extensions detected | Hundreds | ~51 `has_arm_*` functions | 11 `has_riscv_*` functions (I, E, M, A, F, D, C, V, G, Zfh, Zvfh); ~25 additional hwprobe extension constants (Zba/Zbb/Zbs/Zbc, scalar+vector crypto, Zicboz, Zihintntl) are defined but never read out on main |
| Mock test fixtures | Yes | Yes | None -- zero riscv entries in `test/mock/` (164 fixtures exist for other architectures) |
| Vendor recognition | Yes | Yes | SiFive only on main (`mvendorid 0x489`) |

riscv64 is a second-class port by every measurable criterion. Processor/core/package topology enumeration is solid and comparable in structure to the ARM Linux init path, but the three features consumers most rely on for dispatch decisions -- microarchitecture, cache topology, and full ISA-extension coverage -- are absent or stubbed on main and exist only in unmerged PRs.

## 4. Technical Architecture and RISC-V-Specific Subsystems

cpuinfo is a pure-C library: no JIT, no SIMD compute, no cryptographic primitives, no garbage collector, no `.S`/`.s` assembly files anywhere in the repository (confirmed by a repo-wide search), and no RVV intrinsics. The RISC-V implementation totals **998 lines across 6 files**, all under `src/riscv/`: `api.h` (42), `uarch.c` (27), `linux/api.h` (73), `linux/riscv-isa.c` (43), `linux/riscv-hw.c` (193), `linux/init.c` (620). For comparison, `src/arm/**` is 18 files / 14,346 lines and `src/x86/**` is 19 files / 7,376 lines -- riscv64 is roughly 7x smaller than x86 and 14x smaller than arm in code volume.

### ISA extension detection

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Mechanism | CPUID | HWCAP/HWCAP2/MRS | `AT_HWCAP` (base I/M/A/F/D/C/V) plus the `riscv_hwprobe` syscall (vendor, marchid, mimpid, IMA_EXT_0 bitmap, Zfh/Zvfh) |
| Extensions exposed | Hundreds | ~51 functions | 11 `cpuinfo_has_riscv_*` accessors covering i, e (RV32 only), m, a, f, d, c, v, g (synthetic), zfh, zvfh |
| Extensions defined but unused | N/A | N/A | ~25 hwprobe constants for Zba, Zbb, Zbs, Zicboz, Zbc, Zbkb, Zbkc, Zbkx, Zknd, Zkne, Zknh, Zksed, Zksh, Zkt, Zvbb, Zvbc, Zvkb, Zvkg, Zvkned, Zvknha, Zvknhb, Zvksed, Zvksh, Zvkt, Zfhmin, Zihintntl are declared in `riscv-hw.c` but never parsed into the public `isa` struct -- dead code on main |

`src/riscv/linux/riscv-isa.c` decodes single-letter base extensions from `AT_HWCAP`. `src/riscv/linux/riscv-hw.c` implements the RISC-V `hwprobe` syscall directly (a raw `syscall()` on glibc, or the libc `__riscv_hwprobe()` wrapper on Android) and is the only place the fp16 bits (Zfh, Zvfh, merged via commit `d05fbcd5`/PR #375, motivated by XNNPACK's RVV fp16 kernels) are actually wired up. Open PR [#397](https://github.com/pytorch/cpuinfo/pull/397) exposes the remaining ~25 already-defined constants via 28 new public ISA fields (half-precision Zfhmin; bit-manipulation Zba/Zbb/Zbs/Zbc; scalar crypto Zbkb/Zbkc/Zbkx/Zknd/Zkne/Zknh/Zksed/Zksh/Zkt; vector crypto Zvbb/Zvbc/Zvkb/Zvkg/Zvkned/Zvknha/Zvknhb/Zvksed/Zvksh/Zvkt; memory hints Zicboz/Zihintntl) and separately fixes a `uint32_t` truncation bug that corrupts 64-bit `marchid` values.

`riscv-hw.c` carries an explicit comment that a glibc-native `<sys/hwprobe.h>` wrapper existed as an unmerged patch "at the time of writing," which is why the code falls back to a raw `syscall()` on glibc/Linux; on Android the NDK's own `__riscv_hwprobe()` is used directly. The kernel header this mirrors, `asm/hwprobe.h`, is only present starting Linux 6.4; on older kernels the syscall fails and detection degrades gracefully to "unknown" rather than crashing.

### Vendor and microarchitecture detection

`src/riscv/uarch.c` is a 27-line stub. On main it recognizes exactly one vendor (SiFive, `mvendorid 0x489`); `cpuinfo_riscv_chipset_arch`/`_impl` enums contain only `unknown`/`max` values, and there is a literal TODO at line 23: "Add support for parsing chipset architecture and implementation IDs here, when a chipset of interest comes along." Every real chip currently resolves to `cpuinfo_uarch_unknown`. For comparison, x86's `uarch.c` is 445 lines covering the full Intel/AMD family history, and arm's uarch + chipset tables run into the thousands of lines.

Open PR #397, verified directly against its diff, adds three new vendor enums (`cpuinfo_vendor_sifive = 17`, `cpuinfo_vendor_thead = 18`, `cpuinfo_vendor_spacemit = 19`) and four new uarch enums (`cpuinfo_uarch_sifive_7_series`, `cpuinfo_uarch_thead_c9xx`, `cpuinfo_uarch_thead_c908`, `cpuinfo_uarch_spacemit_x60`), decoded via `marchid`. This is a narrower vendor/uarch table than sometimes assumed; the PR's own changed files show these four specific uarch identifiers, not a broader T-Head C906/C910/C920 family -- readers should treat the exact final uarch list as subject to change until the PR merges and should re-check the merged diff.

### Cache detection

No RISC-V cache detection code exists on main -- there is no `src/riscv/cache.c` or equivalent, and nothing in `init.c` populates `cpuinfo_cache`/L1i/L1d/L2/L3 structures. Two competing open PRs address this: #388 (sysfs L1/L2 only) and #397 (a new `src/riscv/linux/cache.c` implementing sysfs-based L1i/L1d/L2/L3 detection with shared-cache deduplication and graceful degradation when sysfs is absent, plus new functions `cpuinfo_riscv_linux_parse_cache_from_sysfs()` and `cpuinfo_riscv_linux_get_cache_sharing()`). Reviewer luhenry has explicitly said #397 is preferred over #388 "so that we get all features in one go."

### Topology initialization

`src/riscv/linux/init.c` (620 lines) implements full Linux processor/core/cluster/package topology via sysfs CPU maps (`core_cpus_list`, `cluster_cpus_list`, `package_cpus_list` parsers), structurally comparable to the ARM Linux init path. One known gap remains: line 290 carries a TODO, "Determine if an 'smt_id' is available." This component is otherwise functional and mature.

### No assembly or SIMD

There are no `.S` files for RISC-V and no RVV intrinsics anywhere in cpuinfo. The library detects the V extension and Zvfh but does not itself use vector instructions -- this is expected and correct for a pure detection library.

## 5. Build System, Cross-Compilation, and Toolchain

CMake is the primary build system (`cmake_minimum_required(VERSION 3.18)`; CMake Presets require `>= 3.21.0`). The target-processor allow-list regex is `^(i[3-6]86|AMD64|x86(_64)?|armv[5-8].*|aarch64|arm64.*|ARM64.*|riscv(32|64))$`, explicitly matching both riscv32 and riscv64. RISC-V is wired for Linux and Android only; there are no Windows or macOS RISC-V code paths.

```cmake
ELSEIF(CPUINFO_TARGET_PROCESSOR MATCHES "^(riscv(32|64))$")
  LIST(APPEND CPUINFO_SRCS src/riscv/uarch.c)
  IF(CMAKE_SYSTEM_NAME STREQUAL "Linux" OR CMAKE_SYSTEM_NAME STREQUAL "Android")
    LIST(APPEND CPUINFO_SRCS
      src/riscv/linux/init.c
      src/riscv/linux/riscv-hw.c
      src/riscv/linux/riscv-isa.c)
  ENDIF()
```

### Linux riscv64 (native-in-QEMU-container, not cross-compiled)

There is no dedicated riscv64 CMake toolchain file anywhere in the repository (`cmake/` contains only `DownloadGoogleBenchmark.cmake`, `DownloadGoogleTest.cmake`, and `cpuinfo-config.cmake.in`), and no `Dockerfile.riscv64`. The CI approach instead runs the public `riscv64/ubuntu:24.04` image natively under QEMU user-mode emulation:

```bash
docker run --platform linux/riscv64 -i -v $(pwd):/cpuinfo riscv64/ubuntu:24.04 /bin/bash -c "
apt update &&
apt install -y cmake git gcc g++ &&
cd /cpuinfo &&
scripts/local-build.sh"
```

`scripts/local-build.sh` runs plain `cmake -DCMAKE_BUILD_TYPE=Release -DCMAKE_POSITION_INDEPENDENT_CODE=ON` followed by `cmake --build . -- -j$(nproc)`, falling back to `make` since `ninja` is not installed in this CI step. No minimum GCC/Clang version is declared anywhere in-repo for riscv64; CI simply takes whatever `gcc`/`g++` Ubuntu 24.04's riscv64 archive ships (GCC 13.x as of that release). The QEMU setup itself (`docker/setup-qemu-action@v3.0.0` plus binfmt_misc) was only made to work reliably by commit `957b852`/PR #295 ("Tried a few things, but looks like all one needs to do is add `--platform linux/riscv64` flag to `docker run` command").

### Android riscv64 cross-compile

```bash
cmake ../../.. \
  -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK/build/cmake/android.toolchain.cmake \
  -DANDROID_ABI=riscv64 \
  -DANDROID_PLATFORM=android-35 \
  -DCPUINFO_BUILD_BENCHMARKS=OFF \
  -GNinja
```

CI uses NDK r27 (`nttld/setup-ndk@v1.0.6`), the first NDK with stable riscv64 support, targeting Android API level 35. `CPUINFO_BUILD_BENCHMARKS=OFF` is explicitly required for Android, with an in-script comment: "CMakeLists for Google Benchmark is broken on Android."

### Build-system gap

The Python-based build config, `configure.py`, adds `riscv/linux/init.c` and `riscv/linux/riscv-isa.c` for riscv targets but **omits `riscv/linux/riscv-hw.c`**, unlike `CMakeLists.txt` and `BUILD.bazel`, both of which include all three files. Since `init.c` calls functions defined only in `riscv-hw.c`, this is a likely build-configuration gap in the `configure.py` path specifically [NEEDS VERIFICATION -- not confirmed against an actual failed build, only against a source-level diff of the three build files].

### Known build failures (history)

- `<sys/hwprobe.h>` did not exist in glibc and caused duplicate-include build breaks on RISC-V Linux; fixed by PR #215 (2024-01-22), after an earlier related fix attempt.
- [google/XNNPACK#4650](https://github.com/google/XNNPACK/issues/4650) ("RISC-V cpuinfo Build Error," open, no maintainer engagement): cross-compiling XNNPACK for riscv64 fails inside cpuinfo's `src/api.c` at lines 319 and 338 with an implicit-declaration error on `syscall(__NR_getcpu, ...)` under ISO C99 strict mode. The IREE project hit the identical issue and worked around it by disabling cpuinfo entirely rather than fixing the root cause.

No documentation file (`BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`) exists in the repository at all; the CI YAML and the two build scripts above are the only riscv64 build documentation that exists.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| Vendor identification | Complete | Complete | SiFive only on main; T-Head/SpacemiT pending in open PR #397 | High |
| Microarchitecture decode | ~445-line table | Large chipset DB | Always "unknown" on main | High |
| Cache topology (L1/L2/L3) | Complete | Complete | Empty/zero on main; sysfs-based detection pending in open PR #397 | High |
| ISA base extensions | Complete | Complete | Complete (I/M/A/F/D/C/V) | None |
| ISA vector extensions | Complete | Complete | V and Zvfh detected; Zvbb/Zvbc/Zvkb/Zvkg/Zvkned/etc. defined but unexposed on main | High |
| ISA bit-manipulation | Complete | Complete | Zba/Zbb/Zbs/Zbc defined but unexposed on main | Medium |
| ISA scalar/vector crypto | Complete | Complete | All crypto extensions defined but unexposed on main | Medium |
| fp16 scalar/vector detect | Complete | Complete | Zfh/Zvfh present (merged April 2026, commit d05fbcd5) | None |
| Processor topology | Complete | Complete | Complete except an open `smt_id` TODO | Low |
| Mock test fixtures | Present | Present | None | Medium |

The two high-severity gaps that matter most to downstream consumers -- vendor/uarch decode and cache topology -- directly block dispatch consumers from selecting hardware-optimized code paths and block cache-aware algorithms. The concrete, measured impact is documented by RISE Project: cpuinfo's failure to fill in cache topology on RISC-V causes `Expect L1_cache_size > 0 but got 0` assertion failures in PyTorch's Inductor CPU autotuner, accounting for **69 of 191 (36%) of all PyTorch RISC-V CI test failures** as of a 2026-08-14 run ([RISE Project blog, 2026-08-18](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)). This is the single largest correctness gap attributable to cpuinfo today.

## 7. CI/CD Infrastructure

Only one of the repository's three GitHub Actions workflow files (`build.yml`, `build_bazel.yml`, `clang-format-check.yml`) contains any RISC-V content; `build_bazel.yml` and `clang-format-check.yml` have zero RISC-V references. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.travis.yml` exists anywhere in the repository.

| Job name | Runner | Method | Tests run? | Notes |
|---|---|---|---|---|
| `cmake-linux-qemu` (`cmake-linux-riscv64` matrix leg) | `ubuntu-24.04` (x86 host) | `docker/setup-qemu-action@v3.0.0` + `docker run --platform linux/riscv64` against `riscv64/ubuntu:24.04`, native build inside the emulated container via `scripts/local-build.sh` | No -- `ctest` does not appear anywhere in `build.yml`, for any platform | Build-only confirmed by a direct read of the live YAML |
| `cmake-android` (`android-riscv64-build.sh` matrix leg) | `ubuntu-latest` (x86 host) | Android NDK r27 cross-compile, `ANDROID_ABI=riscv64`, `ANDROID_PLATFORM=android-35` | No -- pure cross-compile, binaries are never executed | Build-only |

Both jobs run on every `pull_request` and every `push` to `main` (the file's shared top-level `on:` block has no path filter, label gate, or `workflow_dispatch`-only restriction). Neither job runs on native riscv64 hardware or a dedicated riscv64 runner; both use standard x86 GitHub-hosted runners, one via QEMU user-mode emulation and one via cross-compilation.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Yes | Yes | Yes |
| Test execution in CI | Compiled but not `ctest`-run, same as all platforms | Same | Same |
| Native hardware runners | Yes | RISE runners exist and are used by other projects (e.g. PyTorch CI) | No -- cpuinfo's own CI uses only x86 hosts |
| QEMU-emulated build | N/A | N/A | Yes (build only) |
| Mock device tests | Yes | Yes | No -- zero fixtures exist |

RISE Project maintains dedicated free riscv64 CI runners ("[Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)"), and PyTorch's own riscv64 CI uses RISE's `riscv-runner` infrastructure to build cpuinfo transitively as part of the larger PyTorch/executorch build -- but cpuinfo's own repository CI does not use RISE runners at all. PR #200 (open since November 2023) proposed adding a StarFive VisionFive V2 as a native test fixture but remains unmerged/blocked.

## 8. Distribution and Release Status

cpuinfo has **zero tagged GitHub releases for any architecture**; the public releases page reads "There aren't any releases here," and the full git history contains zero tags. The project is consumed as a source dependency (pinned-commit git submodule, e.g. PyTorch's `third_party/cpuinfo`), never via a versioned release artifact.

| Distribution channel | riscv64 available? | Notes |
|---|---|---|
| GitHub Releases | No | Zero releases exist, any architecture |
| PyPI (`cpuinfo`) | No | 404 -- no project literally named `cpuinfo` exists on PyPI |
| PyPI (`py-cpuinfo`, unrelated project) | Not applicable | Pure-Python, architecture-independent wheel (`py_cpuinfo-9.0.0-py3-none-any.whl`); works on any arch but is a different project with the same purpose, not pytorch/cpuinfo |
| RISE GitLab wheel index | No | Proxies straight through to (nonexistent) PyPI `cpuinfo`; not listed on the RISE wheel_builder page either |
| Ubuntu 26.04 "resolute" | Yes | `cpuinfo`, `libcpuinfo0`, `libcpuinfo-dev`, all version `0.0~git20250905.877328f-1`, in `universe`/ports section; confirmed download `cpuinfo_0.0~git20250905.877328f-1_riscv64.deb` (10.3 kB) |
| Debian sid | Yes | `cpuinfo_0.0~git20250905.877328f`, matching the Ubuntu snapshot |
| Arch Linux (official) | No | x86_64 only; Arch has no official riscv64 port |
| Arch Linux RISC-V port (unofficial, archriscv.felixc.at) | Yes | `cpuinfo-r843.ea6b9f1-1-riscv64.pkg.tar.zst` present in the `extra` repo, community-run (`felixonmars/archriscv-packages`), not an official Arch channel |

Every riscv64 binary that exists anywhere is built by a downstream distro packager from a raw git snapshot; none derives from a tagged upstream release (because none exists), and all are built on Ubuntu's `riscv64` ports architecture or an unofficial Arch port -- both lower-support-guarantee channels than a primary architecture. The snapshot date (2025-09-05, commit `877328f`) predates PR #397, so every packaged riscv64 binary available today installs successfully but reports vendor "unknown," zero cache sizes, and only the base 9 ISA extensions plus Zfh/Zvfh. To get a build with any of PR #397's or #421's fixes, a user must build from the `main` branch directly, either via the QEMU-container method or the Android NDK cross-build described in Section 5.

## 9. Dependencies

cpuinfo is architecturally almost dependency-free. `CMakeLists.txt` shows exactly two external libraries, both gated to test/benchmark builds only, plus system pthreads and the build tooling below. There is no JIT backend, no SIMD/vector math library, no numerics library, no crypto library, no compression library, and no custom memory allocator anywhere in the dependency graph.

| Name | Relation | Criticality | riscv64 status |
|---|---|---|---|
| googletest | test-dependency | optional | Build: green. Test: mostly green -- [google/googletest#3756](https://github.com/google/googletest/issues/3756) (`GetThreadCountTest.ReturnsCorrectValue` fails on riscv64, open since 2022-02-05; maintainer reply: "We don't officially support risc-v64," no action in 4 years). No official riscv64 binaries; source build only, and googletest itself has no architecture-tier policy. |
| benchmark | test-dependency | optional | Build and test: green. riscv64 support is fully upstream via `src/cycleclock.h` (5 merged PRs, 2019-2024: #833, #955, #1549, #1727, #1802). No open riscv64 issues; latest release v1.9.5 (2026-01-21) includes all riscv64 fixes. |
| CMake | build-dependency | critical | Drives the entire build, including the `riscv(32\|64)` target-processor branch. No riscv64-specific issues found; CMake itself is architecture-portable. |
| Ninja | build-dependency | optional | Used opportunistically when present (`if command -v ninja`); the Linux QEMU CI job does not install it and falls back to `make`, the Android CI job installs it explicitly. No riscv64-specific issues. |
| Android NDK | build-dependency | critical (Android path) | NDK r27 required -- the first NDK release with stable riscv64 support (`ANDROID_ABI=riscv64`, `ANDROID_PLATFORM=android-35`). |
| Bazel | build-dependency | optional | `BUILD.bazel`/`MODULE.bazel` define `RISCV_SRCS`/`LINUX_RISCV_SRCS` and an `android_riscv64` config_setting (added by PR #201). `MODULE.bazel` deps (`platforms`, `rules_cc`, `rules_license`) are build-system plumbing, not functional dependencies. |
| QEMU | test-dependency | critical | Used via `docker/setup-qemu-action@v3.0.0` + binfmt_misc for the `cmake-linux-qemu` CI job's native-in-emulation build. Required the explicit `--platform linux/riscv64` fix in PR #295 to function at all; without it the job failed outright. |
| Linux kernel | runtime-dependency | critical | `riscv_hwprobe` syscall needs kernel >= 6.4 for full ISA/vendor/uarch detection (the kernel header `asm/hwprobe.h` this mirrors is only present from 6.4 onward); on older kernels the syscall simply fails and detection degrades gracefully to "unknown" rather than crashing. |
| glibc | runtime-dependency | critical | Provides `getauxval()`, pthreads, and the raw `syscall()` path used because glibc's own `<sys/hwprobe.h>` wrapper was, per an in-source comment, an unmerged patch "at the time of writing" -- current glibc merge status is not confirmed in this research [NEEDS VERIFICATION]. |
| Bionic | runtime-dependency | optional (Android path) | Android's libc provides `__riscv_hwprobe()` directly, used instead of the raw-syscall fallback on Android builds; exercised by the `cmake-android` riscv64 CI leg. |

Two additional, non-external items appear in the dependency tree but require no separate riscv64 assessment: `deps/clog/` is a vendored copy of Google's tiny logging library shipped inside the cpuinfo repository itself (no `.gitmodules`, not a separate GitHub project, architecture-independent); and POSIX threads (`Threads::Threads`, required via `FIND_PACKAGE(Threads REQUIRED)`) are part of glibc/Bionic and universally available on riscv64 Linux.

### Critical downstream consumers

cpuinfo's own gaps cascade into its consumers:

| Name | Role | riscv64 impact |
|---|---|---|
| XNNPACK ([google/XNNPACK](https://github.com/google/XNNPACK)) | ISA dispatch for neural-network kernels | [XNNPACK#4650](https://github.com/google/XNNPACK/issues/4650): `syscall` undeclared in cpuinfo's `src/api.c` under strict ISO C99, breaking some cross-compilation workflows (confirmed, open, no maintainer engagement in 3+ years; IREE hit the same issue and disabled cpuinfo as a workaround). [NEEDS VERIFICATION] XNNPACK#9886 (100+ RVV FP16 test failures tied to an unconditional Zvfh dispatch enable in XNNPACK PR #9516) was documented in prior research but was not re-confirmed against a live source in this round. |
| PyTorch ([pytorch/pytorch](https://github.com/pytorch/pytorch)) | Bundles cpuinfo as a `third_party/cpuinfo` submodule | Inherits all cpuinfo riscv64 gaps; the cache-topology gap specifically causes 69/191 (36%) of RISC-V CI test failures, per the RISE Project blog cited in Section 6. |

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [Issue #124](https://github.com/pytorch/cpuinfo/issues/124) | Add: RISC-V support | Open since 2022-12-23 | Tracking | Master tracking issue; explicitly closed by PR #397 once merged |
| [PR #397](https://github.com/pytorch/cpuinfo/pull/397) | riscv/linux: complete ISA extension, vendor/uarch, and cache support | Open, approved by luhenry (2026-08-18) and "lgtm" from XYenChi (2026-09-17), awaiting merge by malfet | Critical | 28 new ISA extension flags, T-Head/SpacemiT vendor+uarch decode, sysfs cache topology, fixes a `uint32_t` marchid-truncation bug; preferred by reviewers over competing PR #388 |
| [PR #421](https://github.com/pytorch/cpuinfo/pull/421) | linux: treat a negative topology id as unavailable, not a parse error | Open since 2026-07-15, stalled awaiting reviewer as of 2026-09-24 despite two author pings | Medium | Fixes reproducible ERROR-level log spam on real riscv64 hardware (SiFive U74-class board, kernel 5.10.113, all 4 cores affected): `core_id`/`physical_package_id` sysfs values of `-1` (the kernel's "not populated" sentinel) are misreported as parse errors; fix logs at debug level with no behavior change |
| [PR #148](https://github.com/pytorch/cpuinfo/pull/148) | Improve support for RISC-V architecture on Linux | Open since 2023-05-12 | Low | Predates and was effectively superseded by the #190 to #397 lineage; approved by fbarchard (2024-06-02) but never merged |
| [google/XNNPACK#4650](https://github.com/google/XNNPACK/issues/4650) | syscall undeclared in cpuinfo/src/api.c under ISO C99 strict mode | Open, reported by rednoah91, no comments | High | Breaks some cross-compile workflows; IREE worked around it by disabling cpuinfo entirely rather than fixing the root cause |
| [google/googletest#3756](https://github.com/google/googletest/issues/3756) | GetThreadCountTest.ReturnsCorrectValue fails on riscv64 | Open since 2022-02-05 | Low | Flaky test in cpuinfo's test dependency, not a cpuinfo correctness issue; googletest maintainers state riscv64 is unsupported |
| [PR #200](https://github.com/pytorch/cpuinfo/pull/200) | Add starfive-visionfive-v2 as example rv64 board | Open since 2023-11-17 | Low | No native hardware fixture means hardware-specific regressions in vendor/uarch/cache code are not caught by CI |
| [PR #388](https://github.com/pytorch/cpuinfo/pull/388) | Add support for retrieving RISC-V L1 and L2 cache sizes | Open since 2026-05-07 | Medium | Narrower competing implementation of cache detection; reviewers have indicated a preference for #397 instead |
| [PR #302](https://github.com/pytorch/cpuinfo/pull/302) | Refactor CPU ISA to be compiled instead of static | Open since 2026-06-20 | Low | Not RISC-V-specific but touches the same ISA-struct code paths #397 modifies |

### Correctness bugs specifically

1. **Cache topology unfilled on RISC-V** (no tracking issue in this repository; documented externally by the [RISE Project blog](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/), 2026-08-18): causes `Expect L1_cache_size > 0 but got 0` assertions in PyTorch's Inductor CPU autotuner, responsible for 69 of 191 (36%) of PyTorch's RISC-V CI test failures as of the 2026-08-14 run. Resolved once PR #397 merges.
2. **`uint32_t` truncation of 64-bit marchid values**: present on main until PR #397 merges; the bug truncates the high 32 bits of `marchid`, causing vendor/uarch misidentification on hardware with `marchid` values exceeding `UINT32_MAX`. Fixed in PR #397's diff.
3. **Spurious ERROR-level log spam on real hardware** (PR #421): a `-1` topology-id sentinel from the kernel is parsed as malformed input rather than "not populated," producing four ERROR-level log lines per boot on real SiFive U74-class hardware even though the machine is healthy. No change in return-value behavior once fixed, purely a log-noise/observability issue.

## 12. Objections and Upstream Blockers

### Maintainer bottleneck

malfet (Meta/PyTorch) is the effective sole active merger for RISC-V work. Historically, PR #375 (Zfh/Zvfh detection) took roughly six weeks from approval to merge. PR #148 has been open for over two years with one approved review and no merge action. The founding engineer (Maratyszcza) explicitly withdrew from the project during PR #190's review in November 2023. There is no succession plan and no CODEOWNERS file. PR #397, the largest pending RISC-V PR, has been approved and "lgtm"'d by two reviewers (luhenry, XYenChi) but remains unmerged as of 2026-09-30, over three months after it was opened (2026-06-22) and over five weeks after its first approval (2026-08-18). PR #421 has received zero reviewer engagement despite two explicit pings from its author (2026-08-07, 2026-09-24) since it was opened on 2026-07-15.

### No stated objections to RISC-V

No maintainer has objected to RISC-V support on technical or policy grounds. PR #190 merged without controversy. The gap is inattention and review bandwidth, not resistance -- the single effective merger processes PRs when pinged rather than proactively.

### Technical blockers

1. glibc `<sys/hwprobe.h>` integration is not confirmed merged upstream in glibc as of this research; cpuinfo's raw-`syscall()` workaround remains necessary, adding a small amount of ongoing maintenance surface [NEEDS VERIFICATION on current glibc status].
2. No native hardware CI exists. QEMU does not expose real vendor/marchid CSR values or real cache sysfs topology, so hardware-specific bugs in the vendor/uarch decode and cache-parsing logic PR #397 adds will not be caught by cpuinfo's own CI; PR #421 is itself evidence that such bugs only surface on real hardware (a SiFive U74 board, not QEMU).
3. PR #148, PR #388, and PR #397 all overlap on cache-detection scope. Maintainers have signaled a preference for #397 over #388, but #148 (2023) has never been formally closed, leaving review effort duplicated across three open PRs touching related code.

### Acceptance probability

High for PR #397: CLA signed, two approving reviews, no open technical objections, builds cleanly on QEMU and cross-compile, and it closes the master tracking issue. The residual risk is purely merge-queue latency from a single, bandwidth-constrained maintainer -- based on the PR #375 precedent, a plausible range is weeks to a few months from last review activity, absent an explicit ping or escalation.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

**Justification:** Upstream CI in [.github/workflows/build.yml](https://github.com/pytorch/cpuinfo/blob/main/.github/workflows/build.yml) builds riscv64 on every PR/push via two jobs (QEMU-emulated `cmake-linux-qemu` and Android NDK `cmake-android` riscv64 matrix entry) but neither job executes the test suite ("build only," confirmed by the fetched CI YAML and corroborated by PR [#219](https://github.com/pytorch/cpuinfo/pull/219)/[#295](https://github.com/pytorch/cpuinfo/pull/295)), which caps the grade at yellow regardless of build success. cpuinfo is not an optimization-purpose project -- it is a CPU-feature/topology detection library consumed by others (e.g. XNNPACK) for dispatch decisions, not itself a SIMD/perf-critical hot path -- so no optimization-level modifier applies. There are no upstream GitHub releases at all ("There aren't any releases here"); the only consumable riscv64 binaries come from distro packagers -- Debian sid (`cpuinfo_0.0~git20250905.877328f`) and Ubuntu 26.04 resolute (`cpuinfo`, `libcpuinfo0`, `libcpuinfo-dev`) -- built from unmodified upstream git snapshots, which independently satisfies the clean-distro-build floor at the same yellow level.

**Pending work that could change the grade:** Two substantive RISC-V PRs are open and unmerged: #397 (completes ISA-extension/vendor-uarch/cache-topology detection, approved/"lgtm" as of 2026-09-17 but still awaiting merge by sole active maintainer malfet) and #421 (fixes spurious ERROR-level log spam from a `-1` topology-id sentinel on real riscv64 hardware, stalled awaiting reviewer since 2026-07-15). Tracking issue #124 (opened 2022-12-23) remains open and would be closed by #397. Known correctness gap: cpuinfo leaves cache topology unfilled on RISC-V, causing 69/191 (36%) of PyTorch's RISC-V CI test failures per RISE Project's blog post (2026-08-18) -- this would be resolved once PR #397 merges. No RISE funding or dedicated RISE repo/blog coverage exists for cpuinfo itself; it appears only as an incidental dependency of RISE's PyTorch-on-riscv64 work.

## 14. Investment Analysis

RISE has not funded or contributed any work to cpuinfo directly. The sizing below reflects only unfinished upstream work; nothing here is already covered by RISE.

### 14.1 Functional Enablement

PR #397 covers the three highest-priority gaps (ISA extensions, vendor/uarch, cache topology) with code that already exists and has two approving reviews; the constraint is maintainer merge bandwidth, not missing implementation. Real-hardware validation was not completed by the PR author (QEMU cannot exercise real vendor/marchid/cache-sysfs paths), so a small hardware-validation effort would derisk the PR and could accelerate merge. PR #421's log-noise fix is trivial (17 additions / 3 deletions) but has zero reviewer engagement; a direct ping to a maintainer is likely sufficient. The `syscall` undeclared bug ([XNNPACK#4650](https://github.com/google/XNNPACK/issues/4650)) is a small, well-scoped fix (adding `#include <unistd.h>` or equivalent to `src/api.c`) that has seen zero maintainer engagement in over three years; a submitted PR is likely required to get any movement.

### 14.2 Performance Optimization

Not applicable. cpuinfo is a detection library with no compute paths; it executes once at program startup and has no runtime hot path to optimize.

### 14.3 CI/CD Infrastructure

Current CI is build-only for every platform, not just riscv64 -- adding `ctest --output-on-failure` to the existing `cmake-linux-qemu` step is a small, low-risk YAML change. Adding native riscv64 hardware CI (e.g. via RISE's free riscv64 runners, which cpuinfo's own CI does not currently use) would be the only way to catch hardware-specific bugs in the vendor/uarch/cache code PR #397 is adding -- PR #421 is direct evidence such bugs exist and are invisible to QEMU. Adding riscv64 mock test fixtures (matching the existing arm64/x86 pattern) would allow CI to validate ISA-decode logic without hardware access; none exist today.

### 14.4 Ecosystem Enablement

cpuinfo has no package ecosystem of its own; its impact flows entirely through XNNPACK and PyTorch. The highest-leverage action reachable from cpuinfo work is accelerating the merge of PR #397, which directly removes the largest single category of PyTorch RISC-V CI failures (the 36% cache-topology-assertion failures documented by RISE).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Real-hardware validation for PR #397 (SiFive/T-Head/SpacemiT boards) to derisk and accelerate merge | 1 | Contributor with hardware access | Critical |
| Functional | Ping/escalate PR #421 for reviewer assignment (17-line, low-risk fix, stalled 2.5 months) | 0.1 | Any contributor | High |
| Functional | Submit a one-line fix for XNNPACK#4650 (`#include <unistd.h>` in cpuinfo's `src/api.c`) | 0.1 | Any contributor | High |
| Functional | riscv64 mock test fixtures for ISA/vendor/cache detection (matching existing arm64/x86 fixtures) | 2 | Any contributor | High |
| CI/CD | Enable `ctest` execution inside the existing `cmake-linux-qemu` CI job | 0.1 | Any contributor | High |
| CI/CD | Add native riscv64 CI (e.g. RISE runners) to catch vendor/uarch/cache bugs QEMU cannot exercise | 1 | Contributor with RISE runner access | Medium |
| Functional | Fix the `configure.py` gap that omits `riscv/linux/riscv-hw.c` from the Python build path | 0.2 | Any contributor | Medium |
| Functional | glibc `<sys/hwprobe.h>` integration once/if upstream glibc support lands, removing the raw-syscall workaround | 1 | Contributor | Low |

## 15. References

- [pytorch/cpuinfo repository](https://github.com/pytorch/cpuinfo)
- [pytorch/cpuinfo CI workflow, build.yml](https://github.com/pytorch/cpuinfo/blob/main/.github/workflows/build.yml)
- [Issue #124, Add: RISC-V support](https://github.com/pytorch/cpuinfo/issues/124)
- [PR #148, Improve support for RISC-V architecture on Linux](https://github.com/pytorch/cpuinfo/pull/148)
- [PR #190, Add limited support for RISC-V initialization](https://github.com/pytorch/cpuinfo/pull/190)
- [PR #200, Add starfive-visionfive-v2 as example rv64 board](https://github.com/pytorch/cpuinfo/pull/200)
- [PR #201, Add android_riscv64 to BUILD.bazel](https://github.com/pytorch/cpuinfo/pull/201)
- [PR #215, Fix RISC-V Linux build again](https://github.com/pytorch/cpuinfo/pull/215)
- [PR #219, ci: Add an Ubuntu:22.04 builder for RISC-V](https://github.com/pytorch/cpuinfo/pull/219)
- [PR #256, Add android-riscv64 build to workflows](https://github.com/pytorch/cpuinfo/pull/256)
- [PR #292, riscv-hw.c: match kernel type in syscall()](https://github.com/pytorch/cpuinfo/pull/292)
- [PR #295, CI: Fix riscv64-in-qemu build](https://github.com/pytorch/cpuinfo/pull/295)
- [PR #302, Refactor CPU ISA to be compiled instead of static](https://github.com/pytorch/cpuinfo/pull/302)
- [Commit d05fbcd5, Add riscv half-precision floating point detection (PR #375)](https://github.com/pytorch/cpuinfo/commit/d05fbcd57dc096718c4979e7c054e628f1f3520b)
- [PR #388, Add support for retrieving RISC-V L1 and L2 cache sizes](https://github.com/pytorch/cpuinfo/pull/388)
- [PR #397, riscv/linux: complete ISA extension, vendor/uarch, and cache support](https://github.com/pytorch/cpuinfo/pull/397)
- [PR #421, linux: treat a negative topology id as unavailable, not a parse error](https://github.com/pytorch/cpuinfo/pull/421)
- [google/XNNPACK issue #4650, RISC-V cpuinfo Build Error](https://github.com/google/XNNPACK/issues/4650)
- [google/googletest issue #3756, GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [Ubuntu packages, cpuinfo search, resolute suite](https://packages.ubuntu.com/search?keywords=cpuinfo&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port, extra repository listing](https://archriscv.felixc.at/repo/extra/)
- [pytorch/cpuinfo releases page](https://github.com/pytorch/cpuinfo/releases)
- [PyPI, py-cpuinfo project](https://pypi.org/project/py-cpuinfo/)
- [RISE Project blog, PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE Project, Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project members page](https://riseproject.dev/members/)
- [riscv-hw.c, main branch](https://raw.githubusercontent.com/pytorch/cpuinfo/main/src/riscv/linux/riscv-hw.c)
- [android-riscv64-build.sh, main branch](https://raw.githubusercontent.com/pytorch/cpuinfo/main/scripts/android-riscv64-build.sh)