---
title: Python
parent: Project Reports
categories:
  - runtimes
  - ai-ml
---

# Python

**Author:** Ludovic HENRY \<ludovic.henry@qti.qualcomm.com\>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Python (CPython)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

CPython is the reference implementation of the Python programming language, maintained by the Python Software Foundation (PSF), a 501(c)(3) non-profit. Homepage: [https://www.python.org/](https://www.python.org/). Repository: [https://github.com/python/cpython](https://github.com/python/cpython). License: Python Software Foundation License v2 (permissive, GPL-compatible).

Python is the dominant language for data science, machine learning, and scientific computing. Its binary packaging ecosystem (PyPI, manylinux wheels) is critical to end-user productivity: roughly 15% of the top 10,000 PyPI packages are binary-only, covering numpy, scipy, pandas, scikit-learn, tokenizers, and the broader ML stack.

**RISC-V status in one sentence:** Python builds and runs on riscv64, but the two highest-value architecture-specific features (the Tier-2 copy-and-patch JIT and Linux perf profiling) are absent or disabled, stack unwinding is actively broken in the current 3.15 beta series, and the platform carries no official support tier.

---

## 2. Port History and Upstreaming Timeline

| Date | Event |
|---|---|
| 2018-03-13 | First issue requesting RISC-V platform triplets ([bpo-33377](https://github.com/python/cpython/issues/77251)) |
| 2018-04-30 | [PR #6655](https://github.com/python/cpython/pull/6655) merged: adds Debian-style multiarch triplets for riscv64 to `configure`. First RISC-V content in CPython. Author: Matthias Klose (doko42), Debian/Ubuntu maintainer. |
| 2018-05-01 | [PR #6660](https://github.com/python/cpython/pull/6660) merged: backport of triplets to Python 3.7 |
| 2019-04-22 | [Issue #80880](https://github.com/python/cpython/issues/80880): riscv multilib build support requested; closed as out-of-scope (third party) |
| 2023-04-11 | [Issue #103438](https://github.com/python/cpython/issues/103438): `CTYPES_PASS_BY_REF_HACK` workaround added for riscv64 |
| 2023-12-05 | [Issue #112779](https://github.com/python/cpython/issues/112779): build failure with undefined `__atomic_exchange_1` on some riscv64 GCC configs |
| 2023-12-08 | [PR #112819](https://github.com/python/cpython/pull/112819) merged: `configure` detects and links `-latomic` on riscv64 |
| 2024-02-27 | [Issue #115988](https://github.com/python/cpython/issues/115988): missing `FILTER_RISCV` constant in lzma module |
| 2024-06-05 | [PR #120089](https://github.com/python/cpython/pull/120089) opened: perf trampoline support for riscv64, tested on SOPHON SG2042 |
| 2024-06-12 | PR #120089 merged; [Issue #120400](https://github.com/python/cpython/issues/120400) closed |
| 2024-07-01 | [Issue #121201](https://github.com/python/cpython/issues/121201): riscv64 fails to build `perf_jit_trampoline.c` |
| 2024-07-03 | [PR #121328](https://github.com/python/cpython/pull/121328) merged: disables perf_trampoline on riscv64 as workaround; [PR #121336](https://github.com/python/cpython/pull/121336) backports to 3.13 |
| 2024-07-04 | [PR #121387](https://github.com/python/cpython/pull/121387) opened: proper riscv64 perf JIT support (correct DWARF register defs: RA=1, SP=2) |
| 2024-09-23 | [PR #124264](https://github.com/python/cpython/pull/124264) merged: C recursion limit lowered for platforms including riscv64 |
| 2025-05-02 | [Issue #133304](https://github.com/python/cpython/issues/133304): `PyFloat_Pack4/Unpack4` SNaN roundtrip failure on riscv64 buildbot |
| 2025-05-03 | [PR #133328](https://github.com/python/cpython/pull/133328) merged: workaround for RISC-V NaN canonicalization in float packing |
| 2026-04-17 | PR #121387 marked stale; no review activity since July 2024 |
| 2026-05-28 | [PR #115989](https://github.com/python/cpython/pull/115989) merged: adds `FILTER_RISCV` constant to lzma module (2+ years after filing); lands in Python 3.16 |
| 2026-06-04 | [Issue #150919](https://github.com/python/cpython/issues/150919): `test_frame_pointer_unwind` fails on riscv64 in Python 3.15.0b1 (Fedora 44) |
| 2026-06-07 | [Issue #151040](https://github.com/python/cpython/issues/151040): `test_c_stack_unwind` fails on riscv64 in Python 3.15.0b2 (Fedora 44) |

The port began as triplet recognition (2018) and has advanced incrementally through distro-driven bug reports. No single company or individual has owned the port end-to-end.

---

## 3. Upstream Support Tier

**riscv64 is not listed in any tier in [PEP 11](https://peps.python.org/pep-0011/).** It is effectively Tier 0 (unsupported).

PEP 11 tier definitions for context:

| Tier | Requirements | Release impact |
|---|---|---|
| 1 | All core devs responsible; CI failures block releases | aarch64-apple-darwin, aarch64-linux-gnu, i686/x86_64-windows-msvc, x86_64-linux-gnu |
| 2 | >=2 core dev sponsors + reliable buildbot; failures block releases | aarch64-linux-gnu (clang), wasm32-wasip1, x86_64-apple-darwin |
| 3 | >=1 core dev sponsor + reliable buildbot; failures do NOT block releases | Android, iOS, FreeBSD, Emscripten, s390x, powerpc64le |
| untiered | No formal commitment | riscv64 |

Promotion to any tier requires Steering Council approval (PEP 13). The 2026 Steering Council members are Pablo Galindo Salgado, Savannah Ostrowski, Barry Warsaw (NVIDIA), Donghee Na, and Thomas Wouters (Google). The riscv64 buildbot is tagged "unstable" in the buildbot registry. There is no PEP proposal to promote riscv64 to Tier 3 and no named core developer sponsor for the platform.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 RISC-V-Specific Files in cpython

**`Python/asm_trampoline_riscv64.S`** -- perf profiling trampoline assembly.

- 12 lines. Defines `_Py_trampoline_func_start` / `_Py_trampoline_func_end` symbols, wrapping each Python code object's stack frame so Linux `perf record` can distinguish Python call sites.
- ISA: RV64I base only (`addi`, `sd`, `jalr`, `ld`, `jr ra`). No RVV, no Zba/Zbb/Zbc.
- Status: present on disk but not wired into `configure.ac`. Only x86_64 and aarch64 are in the `PERF_TRAMPOLINE_OBJ` selection logic. The file compiles to nothing. [NEEDS VERIFICATION -- the configure.ac gap was confirmed from the first 1000 lines of an 8576-line file.]

**`Python/perf_jit_trampoline.c`** -- Linux perf JIT dump writer.

- Contains `#elif defined(__riscv)` returning `EM_RISCV 243` in `GetElfMachineArchitecture()`. Architecture detection works.
- The companion `Python/jit_unwind.c` has `#error "Unsupported target architecture"` for anything that is not x86_64 or AArch64. The DWARF CFA/register enum needed for full perf JIT functionality is absent for RISC-V. Attempting to build with perf JIT on riscv64 fails with this error.
- Open bug: [Issue #121201](https://github.com/python/cpython/issues/121201), open since July 2024, affecting 3.13, 3.14, 3.15.

**`Python/jit_unwind.c`** -- DWARF `.eh_frame` generation for JIT.

- No RISC-V support. `#error "Unsupported target architecture"` fallback.
- Fix proposed in [PR #121387](https://github.com/python/cpython/pull/121387): add `DWRF_REG_RA = 1, DWRF_REG_SP = 2` and extend the AArch64 DWARF CFA block to cover `defined(__riscv)`. Correct per the RISC-V psABI. Stale since April 2026.

**`Objects/floatobject.c`** -- SNaN workaround.

- `#ifndef __riscv` guard blocks in `PyFloat_Pack4` / `PyFloat_Unpack4`. On RISC-V, the FPU canonicalizes NaNs on float32-to-float64 widening, destroying SNaN payload and sign bit. The workaround restores sign and payload from the raw packed bytes after the conversion.
- Merged [PR #133328](https://github.com/python/cpython/pull/133328) May 2025, targeting Python 3.14.

### 4.2 Confirmed Absent

| Component | Status |
|---|---|
| `Tools/jit/_targets.py` -- copy-and-patch JIT targets | x86_64 and AArch64 only; `ValueError` for any other host including riscv64 |
| `Python/jit.c` -- JIT runtime trampolines | AArch64 and x86_64 only; riscv64 gets `TRAMPOLINE_SIZE 0` |
| `Modules/_hacl/libintvector.h` -- SIMD dispatch | x86 (SSE/AVX2), ARM (NEON), s390x, ppc64; no RVV |
| `configure.ac` -- `PERF_TRAMPOLINE_OBJ` | No riscv64 entry |
| Any `arch/riscv/` directory | Does not exist |
| RVV intrinsics (`vfloat32m1_t`, vector builtins) | Not present anywhere in CPython |
| Zba/Zbb/Zbc/Zbs extension usage | Not present |

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build System

CPython uses autotools (`./configure` + `Makefile`). There is no CMakeLists.txt, no `cmake/riscv64.cmake`, and no CPython-authored Dockerfile for riscv64. The [Platforms/](https://github.com/python/cpython/tree/main/Platforms) directory covers Android, Apple, WASI, and Emscripten only.

riscv64 falls into the generic `*-*-linux*` branch of `configure.ac`. No riscv64-specific configure block exists beyond triplet recognition (added in 2018) and the `-latomic` detection fix (2023).

### 5.2 Cross-Compilation (Generic Pattern)

CPython's cross-compilation model requires a host build first (`--with-build-python`), available since Python 3.11. The upstream documentation is at [https://docs.python.org/3/using/configure.html](https://docs.python.org/3/using/configure.html).

```
# Step 1: build host Python
mkdir build-host && cd build-host
../configure --prefix=$PWD/install
make -j$(nproc) && make install
cd ..

# Step 2: cross-compile for riscv64
CONFIG_SITE=../config.site-riscv64 \
../configure \
    --build=x86_64-pc-linux-gnu \
    --host=riscv64-unknown-linux-gnu \
    --with-build-python=../build-host/install/bin/python3 \
    --prefix=/usr
make -j$(nproc)
```

Required `config.site` overrides (autoconf cannot run target binaries during cross-build):

```
ac_cv_buggy_getaddrinfo=no
ac_cv_file__dev_ptmx=yes
ac_cv_file__dev_ptc=no
```

Cross-compilation is not officially supported on CPython 3.10 and earlier.

### 5.3 Known Flags to Disable for riscv64

- `--enable-experimental-jit`: do not use. JIT does not support riscv64 in any released or beta version as of 3.15.
- `--enable-optimizations`: do not use when cross-compiling; requires running the target binary for PGO.
- `--with-tail-call-interp`: requires Clang 19+.

### 5.4 Toolchain Requirements

| Component | Minimum | Notes |
|---|---|---|
| GCC | 7.1 | First release with RISC-V backend |
| Binutils | 2.28 | First release with RISC-V support |
| glibc | 2.27 | First release with RISC-V support |
| QEMU (user-mode) | 2.12 | First with RISC-V user/system emulation |

The manylinux standard for binary distribution uses GCC 14 and glibc 2.39 (`manylinux_2_39_riscv64`) or glibc 2.35 (`manylinux_2_35_riscv64`, used by the RISE wheel_builder).

The canonical riscv64 Linux ABI for Python: ISA `rv64gc` (G = IMAFD + Zicsr + Zifencei, C = compressed), ABI `lp64d`, triple `riscv64-unknown-linux-gnu` or `riscv64-linux-gnu`. This is the established baseline across GCC, Clang, QEMU, and all major riscv64 Linux distributions.

Debian/Ubuntu cross-compiler setup:

```
sudo dpkg --add-architecture riscv64
sudo apt-get install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu
export CC=riscv64-linux-gnu-gcc
export CXX=riscv64-linux-gnu-g++
```

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | x86_64 | aarch64 | riscv64 |
|---|---|---|---|
| Tier-2 copy-and-patch JIT (3.13+) | Full (3 targets) | Full (3 targets) | Missing entirely |
| perf ASM trampoline | Full (CET) | Full (BTI/PAC/GCS) | File exists, not wired into configure |
| perf JIT trampoline (DWARF CFI) | Full | Full | Build fails; workaround: disabled |
| Manual frame-pointer unwinding | Correct | Correct | Broken in 3.15.0b1/b2 (zero frames) |
| ctypes / libffi ABI | Full | Full | Functional with acknowledged workaround |
| Float SNaN handling | Correct (native) | Correct (native) | Correct via workaround (Pack4/Unpack4) |
| lzma FILTER constant | Full | Full | Fixed in 3.16 (2 years after filing) |
| libatomic linking | Not needed | Not needed | Fix in configure (2023) |
| SIMD / RVV dispatch | SSE/AVX2 in hash libs | NEON in hash libs | None |
| PEP 11 platform tier | Tier 1 | Tier 1 | Untiered |
| Official GitHub Actions CI | Yes | Yes | No |

The JIT gap is the most significant. On supported architectures, the copy-and-patch JIT provides an estimated 5-15% throughput improvement on macrobenchmarks (per CPython team public statements on x86/ARM results). riscv64 runs the bytecode interpreter only.

The stack unwinding regression in 3.15 betas is a correctness issue that will affect Fedora 44 and any distribution shipping Python 3.15 on riscv64 if not resolved before the 3.15.0 final release.

---

## 7. CI/CD Infrastructure

### 7.1 GitHub Actions

Zero riscv64 coverage. All 23 workflow files in [`.github/workflows/`](https://github.com/python/cpython/tree/main/.github/workflows) were checked. The word "riscv" does not appear in any of them. The CI matrix covers: x86_64 Linux/Windows/macOS, arm64/aarch64 Linux/Windows/macOS, i686 Windows, wasm32 (WASI/Emscripten), Android, and iOS. No RISC-V target in any form, whether via a native runner or QEMU emulation.

### 7.2 Buildbot

One buildbot worker exists: `"onder-riscv64"`, a StarFive VisionFive 2 v1.3B running Ubuntu 25.04, operated by Furkan Onder (a single individual, contact: `furkanonder@protonmail.com`). This is not project-managed infrastructure.

Builder `"riscv64 Ubuntu23 PR"` (builderid 1377):

- 32 total builds since first build on 2024-03-13
- Average: approximately 1.2 builds per month
- Last successful build: 2025-08-09 (build #31)
- Last build: 2026-03-25 (build #32) -- FAILURE at the "update" step, approximately 5 minutes runtime (never reached compile or test phases)
- Tags: `["PullRequest", "unstable", "installed"]`
- **Currently broken. Has been broken for over 3 months with no fix.**

Builder `"riscv64 Ubuntu23 main"` (builderid 1980):

- `masterids: []` -- no build master connected, offline
- Zero builds ever recorded

The builder `"riscv64 Ubuntu23 PR"` is officially tagged "unstable," meaning failures do not block releases. For comparison, Tier 1 x86_64 builders run thousands of builds. Describing this as "CI coverage" significantly overstates the situation.

### 7.3 The Single Hardware Dependency

@furkanonder is the only contributor with riscv64 hardware (the VisionFive 2 board). He is the buildbot operator and filed the perf JIT DWARF register values that inform PR #121387. However:

- The SiFive-based hardware lacks working Linux `perf` hardware counters (HPM), so the perf JIT functionality required to validate PR #121387 cannot be tested on his board. This is the hard blocker that has kept the PR unmerged for nearly 2 years.
- @vstinner (Red Hat) and @pablogsal (the perf trampoline maintainer) have no riscv64 hardware access.
- The frame-pointer unwinding failures (issues #150919, #151040) were pinged to @furkanonder on 2026-06-16 with no response as of the research date.

---

## 8. Distribution and Release Status

### 8.1 CPython Upstream

CPython publishes no riscv64 binaries from its own channels. [python.org downloads](https://www.python.org/downloads/) provides source tarballs plus Windows (amd64/arm64) and macOS installers. No riscv64 file appears in any release asset listing through the current stable release (3.14.6 at time of research).

### 8.2 Debian

A riscv64 binary package `python3.13_3.13.14-1_riscv64.deb` exists in Debian sid (main archive), built by Debian buildd worker `rv-osuosl-03`, last modified 2026-06-11. This is produced by Debian's autobuilder infrastructure, not CPython upstream. Status: `Installed` (up-to-date in the archive).

### 8.3 Ubuntu

`python3` version `3.12.3-0ubuntu1` is available for riscv64 on Ubuntu 24.04 (noble) via [packages.ubuntu.com](https://packages.ubuntu.com/noble/python3). Distro-built, not upstream.

### 8.4 Arch Linux RISC-V

The base `python` package is not listed on the Arch RISC-V FTBFS or problem tracker at [archriscv.felixc.at](https://archriscv.felixc.at/), which on that tracker means it is expected to build cleanly. [NEEDS VERIFICATION -- the tracker page did not return a fully parseable package table.]

### 8.5 Binary Wheels (PyPI)

Prior to August 2025, PyPI did not accept riscv64 wheels and the manylinux build infrastructure had no riscv64 support. As of August 2025, three milestones were reached:

1. `manylinux_2_39_riscv64` and `musllinux_1_2_riscv64` images are available at [quay.io/pypa/](https://quay.io/pypa/)
2. [cibuildwheel](https://github.com/pypa/cibuildwheel) v3.1.0 added experimental riscv64; v3.1.2 enabled by default
3. PyPI/warehouse now accepts riscv64 wheel uploads

The first projects confirmed with riscv64 wheels on PyPI were `uv` and `maturin`. [NEEDS VERIFICATION -- sourced from a single discuss.python.org thread.]

---

## 9. Dependencies

| Dependency | Role in CPython | riscv64 Status | Blocking Issues |
|---|---|---|---|
| libffi | `_ctypes` module | Builds; two open riscv64 issues (struct ABI test failure since 2022; linkage failure since 2023) | [libffi #281](https://github.com/libffi/libffi/issues/281): `struct_by_value_big` test failure; linkage failure open since April 2023 |
| OpenSSL | `_ssl`, `_hashlib` | Builds; dedicated CI with 13 riscv64 configurations | [#30787](https://github.com/openssl/openssl/issues/30787): ChaCha20 RVV asm not merged; [#31082](https://github.com/openssl/openssl/issues/31082): GHASH constant-time fallback; [#30880](https://github.com/openssl/openssl/issues/30880): test_lhash CI flakiness |
| zlib | `zlib` module | Builds; no SIMD path | No blocking bugs; performance gap vs arm64/x86-64 |
| libbz2 | `_bz2` module | Builds; pure C | No known riscv64 issues |
| liblzma / xz | `_lzma` module | Builds; `FILTER_RISCV` constant fixed (3.16); `TUKLIB_FAST_UNALIGNED_ACCESS` not enabled (performance gap) | No correctness blockers |
| libzstd | `_zstd` (new in 3.14) | Builds; 4-way fast decompression loop not enabled | [zstd PR #4622](https://github.com/facebook/zstd/pull/4622): performance gap |
| libmpdec | `_decimal` module | Builds; uses generic uint128 fallback; no riscv64 asm path | No correctness blockers; performance gap |
| libexpat | `pyexpat`, `_elementtree` | Builds | No known riscv64 issues |
| SQLite | `_sqlite3` | Builds | No known riscv64 issues |
| mimalloc (default allocator, 3.13+) | Memory allocator | Partial; SV39 MMU aligned alloc issue fixed Dec 2024; hwprobe-based VA detection fix in-progress (2 open PRs, May 2026) | Hardware-dependent behavior on SV39 vs SV48/SV57 MMUs; open PRs at [microsoft/mimalloc](https://github.com/microsoft/mimalloc) |
| LLVM / clang (Tier-2 JIT backend) | `--enable-experimental-jit` | Not supported; `Tools/jit/_targets.py` raises `ValueError` for riscv64 | Requires new ELF relocation types (`R_RISCV_*`), new `ELFUnwindConfig`, frame-pointer conventions; no upstream work started |
| glibc / libm | C runtime, pthread, math | Builds; riscv64 upstream since glibc 2.27 | No blocking issues; RVV memset and libmvec ongoing for performance parity |

The mimalloc dependency deserves emphasis: it became the default allocator in CPython 3.13. Its VA-space detection issues on SV39 MMU hardware (common on current riscv64 boards including the VisionFive 2) produce warning-level allocator failures. Two open PRs targeting `hwprobe`-based detection were filed in May 2026 and are unmerged.

---

## 10. Ecosystem Status

### 10.1 RISE Project Involvement

Python and the PSF are not RISE members. However, RISE has funded a formal wheel-building project via an RFP.

**wheel_builder / python-wheels:** Initiated by Rivos Inc., funded by RISE (machines and engineering). Maintained jointly by Rivos Inc. and Baylibre, SAS. Provides pre-built riscv64 binary wheels for 78+ packages including numpy, scipy, pandas, tokenizers, safetensors, pillow, cryptography, aiohttp, orjson, and others.

- GitLab origin: [gitlab.com/riseproject/python/wheel_builder](https://gitlab.com/riseproject/python/wheel_builder)
- GitHub successor: [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels), building on native riscv64 hardware via RISE runners
- Index URL: `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple`
- Wheel format: `manylinux_2_35` and `manylinux_2_39`
- Python versions: 3.10, 3.11, 3.12, 3.13
- Requires pip >= 24.1

**python-versions:** [riseproject-dev/python-versions](https://github.com/riseproject-dev/python-versions) provides prebuilt CPython binaries for linux/riscv64 via GitHub Releases, in the `actions/python-versions` tarball layout, covering CPython 3.10+ including free-threaded (3.13+) variants. CI runs on `ubuntu-24.04-riscv` RISE runners.

**setup-python:** [riseproject-dev/setup-python](https://github.com/riseproject-dev/setup-python) is a fork of `actions/setup-python` maintained to support riscv64 in GitHub Actions workflows.

**ML stack forks under riseproject-dev:** pytorch, pytorch-ci, executorch, numpy, bcrypt, setup-uv, micromamba-releases-riscv64, conda-forge-miniforge, conda-forge-docker-images.

### 10.2 PyTorch

PyTorch has out-of-tree CI running on RISE riscv64 native runners (870 completed jobs as of May 2026 per [RISE runners blog post](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)). A RISE integration PR is open ([numpy/numpy#30995](https://github.com/numpy/numpy/pull/30995) is the NumPy counterpart described in the same blog post). PyTorch is targeting Level 3 CI integration (non-blocking PR checks).

### 10.3 NumPy

A RISE CI integration PR is open against the upstream numpy repository ([numpy/numpy#30995](https://github.com/numpy/numpy/pull/30995)). NumPy is described as a priority because it anchors a large portion of the Python scientific stack.

### 10.4 Packaging Infrastructure (as of August 2025)

As documented in the [discuss.python.org packaging thread](https://discuss.python.org/t/packaging-support-for-riscv64/):

- `manylinux_2_39_riscv64` and `musllinux_1_2_riscv64` images are available on quay.io
- cibuildwheel >= 3.1.2 supports riscv64 by default
- auditwheel 6.1.0+ includes riscv64 policy support
- PyPI accepts riscv64 wheel uploads
- uv includes riscv64 release targets (since PR #12688)
- maturin supports riscv64

The critical infrastructure gap that existed before mid-2025 -- no manylinux image because AlmaLinux/RHEL do not support riscv64 -- was resolved by switching to Rocky Linux 10 as the manylinux_2_39 base. [NEEDS VERIFICATION -- sourced from one discuss.python.org thread.]

---

## 11. Known Bugs and Active Issues

### 11.1 Open Issues

| Issue | Title | Opened | Severity |
|---|---|---|---|
| [#151040](https://github.com/python/cpython/issues/151040) | 3.15.0b2, Fedora 44, riscv64: failing test: test_c_stack_unwind | 2026-06-07 | High -- correctness regression in 3.15 beta |
| [#150919](https://github.com/python/cpython/issues/150919) | Python 3.15.0~b1, test_frame_pointer_unwind fails on riscv64 | 2026-06-04 | High -- same root cause as #151040 |
| [#121201](https://github.com/python/cpython/issues/121201) | riscv64 fails to build Python/perf_jit_trampoline.c: Unsupported target architecture | 2024-07-01 | Medium -- perf profiling disabled; workaround in place |
| [#103438](https://github.com/python/cpython/issues/103438) | Don't define CTYPES_PASS_BY_REF_HACK on aarch64 or riscv64 | 2023-04-11 | Low -- workaround correct, cleanup pending |

**Issues #150919 and #151040 detail:** Both filed by @mcepl (Fedora riscv64 packager) against 3.15 betas. `test_manual_unwind_finds_expected_frames` and `test_manual_unwind_respects_frame_pointers` find 0 Python frames when >=10 are expected. Root cause: `manual_unwind_from_fp()` in `Modules/_testinternalcapi.c` uses default `FRAME_POINTER_NEXT_OFFSET` and `FRAME_POINTER_RETURN_OFFSET` values that are incorrect for the RISC-V frame pointer convention (see [riscv-elf-psabi-doc frame-pointer-convention](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-cc.adoc#frame-pointer-convention)). @vstinner confirmed the root cause and pinged @furkanonder (the only contributor with riscv64 hardware) on 2026-06-16. No response as of the research date. The official riscv64 buildbot (`riscv64 Ubuntu23 3.x`, builder 1379) also fails on these tests per @vstinner's comment.

**Issue #121201 detail:** Build regression introduced in `Python/perf_jit_trampoline.c` at line 375. The required fix (DWARF register values RA=1, SP=2, and a one-line extension to the AArch64 CFA block) is written in PR #121387. The blocker is that no available riscv64 machine has working Linux `perf` hardware counters (the contributor's SiFive-based VisionFive 2 skips perf tests entirely), and the maintainer (@pablogsal) requires end-to-end functional validation before merging. The workaround -- disabling the entire perf_trampoline feature on riscv64 -- has been in place since July 2024.

### 11.2 Open PRs

| PR | Title | Opened | Status |
|---|---|---|---|
| [#121387](https://github.com/python/cpython/pull/121387) | gh-121201: Support riscv64 architecture for Perf JIT | 2024-07-04 | Open, marked stale 2026-04-17 |

### 11.3 Recently Resolved

| Issue/PR | Title | Resolution | Version |
|---|---|---|---|
| [#133304](https://github.com/python/cpython/issues/133304) / [PR #133328](https://github.com/python/cpython/pull/133328) | `PyFloat_Pack4/Unpack4` SNaN roundtrip failure on RISC-V buildbot | Workaround merged 2025-05-03 | 3.14 |
| [#115988](https://github.com/python/cpython/issues/115988) / [PR #115989](https://github.com/python/cpython/pull/115989) | Missing ARM64 and RISCV filter in lzma module | Merged 2026-05-28 | 3.16 (unreleased) |
| [#120400](https://github.com/python/cpython/issues/120400) / [PR #120089](https://github.com/python/cpython/pull/120089) | Linux perf profiling not seeing Python calls on RISC-V | Merged June 2024, then disabled by workaround PR #121328 | 3.13 (feature disabled) |
| [#112779](https://github.com/python/cpython/issues/112779) / [PR #112819](https://github.com/python/cpython/pull/112819) | Build error: undefined reference to `__atomic_exchange_1` on riscv64 | Fixed 2023-12-08 | 3.12.1 or 3.13.0 |

The SNaN fix (#133304) merits emphasis: it was a silent data corruption bug where packing a signaling NaN into a 4-byte float and unpacking it could return positive infinity on riscv64 hardware. The RISC-V ISA specification mandates NaN canonicalization on float32-to-float64 widening, which destroyed the payload and sign bit. The bug was discovered via the riscv64 buildbot.

---

## 12. Objections and Upstream Blockers

**Blocker 1 -- Single-point-of-failure hardware.**
All riscv64 CI and most riscv64 debugging flows through one individual (@furkanonder) and one physical board (VisionFive 2). When that individual is unavailable, issues go unaddressed. The frame-pointer issues (#150919, #151040) have had no activity after @vstinner's ping on 2026-06-16. The buildbot has been broken since March 2026.

**Blocker 2 -- Hardware without Linux perf support prevents PR #121387 merge.**
The fix for issue #121201 (perf JIT trampoline DWARF registers) is correct per the RISC-V psABI and was provided in July 2024. The maintainer will not merge without end-to-end perf test validation. The contributor's SiFive hardware lacks HPM counters, so `test_perf_profiler` skips entirely. The fix has been stale for nearly 2 years as a result. A machine with working perf hardware (SOPHON SG2042 or equivalent) would unblock this immediately.

**Blocker 3 -- No named Tier 3 sponsor.**
Promotion to Tier 3 requires at least one core developer to formally commit to platform maintenance and a reliable buildbot. No core developer has done this for riscv64. Without a Tier 3 designation, there is no mechanism to prevent further regressions from landing unreported.

**Blocker 4 -- JIT backend requires significant new work.**
The copy-and-patch JIT in CPython 3.13+ requires new ELF relocation type handlers (`R_RISCV_*`), a new `ELFUnwindConfig`, and handling of the RISC-V frame pointer conventions in `_targets.py`. No upstream issue or PR exists for this. The effort is non-trivial (the aarch64 JIT target took multiple release cycles to reach full feature parity with x86_64).

**Blocker 5 -- mimalloc VA detection.**
CPython 3.13+ uses mimalloc as the default allocator. Two open PRs (May 2026) at microsoft/mimalloc target hwprobe-based VA space detection for riscv64 to handle SV39/SV48/SV57 MMU variability. Until these merge, running CPython 3.13+ on riscv64 hardware with SV39 MMUs produces allocator warnings and possible silent fallback to slower allocation paths.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The interpreter runs. The standard library is largely complete. ctypes, ssl, decimal, sqlite3, and most extension modules work. The remaining functional gaps are:

- Stack unwinding in Python 3.15 (actively broken, needs frame pointer convention implementation in `_testinternalcapi.c`)
- perf JIT trampoline (build fails; fix written, needs validation hardware)
- ctypes `PASS_BY_REF_HACK` cleanup (cosmetic, workaround is correct)

### 13.2 Performance Optimization

Three performance gaps relative to x86_64 and aarch64:

1. **No JIT (highest impact).** The copy-and-patch JIT is the primary CPython performance investment for 3.13+. riscv64 runs interpreter-only. Implementing the riscv64 JIT target requires `_targets.py` additions, new ELF relocation handling, DWARF unwind support, and stencil generation. No upstream work has started. Effort: on the order of several engineer-months for a first pass, more for full feature parity.

2. **No SIMD in hash and compression libraries.** zlib, zstd, lzma, and the HACL* hash library (used for SHA-2, BLAKE2, SHA-3 in CPython) have no RVV paths. This affects throughput for cryptographic operations and data compression. Effort: library-level work (OpenSSL has the most maturity; zlib/zstd are lower effort with existing scalar baselines).

3. **mimalloc VA detection.** Minor but affects default 3.13+ configurations on SV39 hardware. Upstream fix pending.

### 13.3 CI/CD Infrastructure

Current state: one volunteer buildbot, broken for 3+ months, on hardware without perf support.

Minimum viable CI for riscv64 to reach CPython Tier 3:

- A buildbot connected to a machine with working Linux perf hardware (required to merge PR #121387 and any future perf-related work)
- A GitHub Actions job (preferably using RISE runners at `ubuntu-24.04-riscv`) for PR-level testing
- A named core developer sponsor

RISE already operates the runner infrastructure (`ubuntu-24.04-riscv`) used by python-versions and python-wheels. Adding a CPython GitHub Actions job on those runners is technically straightforward; the organizational step is getting a core developer to commit to Tier 3 sponsorship.

### 13.4 Ecosystem Enablement

The binary wheel infrastructure gap that existed before mid-2025 is now resolved upstream (manylinux, cibuildwheel, PyPI). The RISE wheel_builder provides 78+ packages including the full ML stack. The outstanding gap is that individual package maintainers need to add riscv64 to their CI (using cibuildwheel's riscv64 support) and publish wheels to PyPI. NumPy and PyTorch are in progress; numpy's RISE CI PR is open.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix frame-pointer offsets for riscv64 in `_testinternalcapi.c` (issues #150919, #151040) | 1-2 | Requires riscv64 hardware access; @furkanonder or equivalent | Critical -- blocks 3.15.0 release on riscv64 |
| Functional | Validate and merge PR #121387 (perf JIT DWARF registers) | 1 (if perf hardware available) | Requires machine with working Linux perf HPM | High |
| Functional | Fix mimalloc hwprobe VA detection (microsoft/mimalloc open PRs) | 2-4 (upstream) | Microsoft/mimalloc maintainers; RISE can drive | High for 3.13+ deployments on SV39 hardware |
| Functional | Cleanup `CTYPES_PASS_BY_REF_HACK` (issue #103438) | 1 | Open to any contributor | Low -- workaround is correct |
| CI/CD | Provide riscv64 machine with working Linux perf hardware to cpython buildbot | 1-2 (setup) | RISE or Qualcomm infra | High -- unblocks PR #121387 and future perf work |
| CI/CD | Add riscv64 GitHub Actions job to cpython `.github/workflows/build.yml` | 1-2 | Requires core developer sponsor for Tier 3 | High |
| CI/CD | Identify and commit a Tier 3 core developer sponsor for riscv64 | N/A | Steering Council approval required | High -- prerequisite for Tier 3 |
| Performance | Implement riscv64 JIT target in `Tools/jit/_targets.py` | 20-40 (first pass) | Requires JIT subsystem expertise; no upstream work started | Medium -- high payoff but large scope |
| Performance | RVV paths in OpenSSL for CPython `_ssl` and `_hashlib` | 10-20 | OpenSSL community + hardware vendors | Medium |
| Ecosystem | Drive numpy riscv64 CI PR (#30995) to merge | 2-4 | RISE / numpy maintainers | High -- anchors scientific stack |
| Ecosystem | Drive PyTorch to Level 3 CI on riscv64 | 10-20 | RISE / Meta PyTorch team | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [CPython repository](https://github.com/python/cpython)
- [PEP 11 -- Supported Platforms](https://peps.python.org/pep-0011/)
- [CPython issue #151040](https://github.com/python/cpython/issues/151040)
- [CPython issue #150919](https://github.com/python/cpython/issues/150919)
- [CPython issue #121201](https://github.com/python/cpython/issues/121201)
- [CPython issue #133304](https://github.com/python/cpython/issues/133304)
- [CPython issue #120400](https://github.com/python/cpython/issues/120400)
- [CPython issue #115988](https://github.com/python/cpython/issues/115988)
- [CPython issue #112779](https://github.com/python/cpython/issues/112779)
- [CPython issue #103438](https://github.com/python/cpython/issues/103438)
- [CPython PR #121387](https://github.com/python/cpython/pull/121387)
- [CPython PR #133328](https://github.com/python/cpython/pull/133328)
- [CPython PR #121328](https://github.com/python/cpython/pull/121328)
- [CPython PR #120089](https://github.com/python/cpython/pull/120089)
- [CPython PR #115989](https://github.com/python/cpython/pull/115989)
- [CPython PR #124264](https://github.com/python/cpython/pull/124264)
- [CPython PR #112819](https://github.com/python/cpython/pull/112819)
- [CPython PR #6655](https://github.com/python/cpython/pull/6655)
- [RISE blog: Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE blog: RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE wheel_builder (GitLab)](https://gitlab.com/riseproject/python/wheel_builder)
- [RISE wheel_builder documentation](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels)
- [riseproject-dev/python-versions](https://github.com/riseproject-dev/python-versions)
- [riseproject-dev/setup-python](https://github.com/riseproject-dev/setup-python)
- [discuss.python.org: Packaging support for riscv64](https://discuss.python.org/t/packaging-support-for-riscv64/)
- [RISC-V psABI frame pointer convention](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-cc.adoc#frame-pointer-convention)
- [CPython configure documentation](https://docs.python.org/3/using/configure.html)
- [manylinux (pypa)](https://github.com/pypa/manylinux)
- [Debian package tracker: python3.13 riscv64 sid](https://buildd.debian.org/status/package.php?p=python3.13&suite=sid)