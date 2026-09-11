---
title: XGBoost
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="xgboost" %}

# XGBoost

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for XGBoost<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

XGBoost (Extreme Gradient Boosting) is a C++ gradient-boosted decision tree library with Python, R, JVM (xgboost4j), and CLI bindings, distributed under the Apache License 2.0 ([LICENSE](https://github.com/dmlc/xgboost/blob/master/LICENSE)). It is hosted under DMLC ("Distributed Machine Learning Community"), a loose GitHub-based collective of ML projects, not a chartered legal entity and not part of the Apache Software Foundation or Linux Foundation despite adopting an Apache-style process. Its fiscal host is **Open Source Collective**, a 501(c)(6) nonprofit that also hosts Babel, Vue, and Webpack (`doc/contrib/donate.rst`).

**Governance:** documented in [`doc/contrib/community.rst`](https://github.com/dmlc/xgboost/blob/master/doc/contrib/community.rst) as an Apache-style, merit-based model: Contributors -> Reviewers -> Committers -> PMC. New PMC/committer candidates require internal discussion and consensus (3+ "+1" votes, no vetoes without reasoned justification), and the PMC is instructed to "strive to only nominate new candidates outside of their own organization." Major changes require an RFC and public discussion via GitHub Issues/Discussions.

**Corporate maintainers** (`CONTRIBUTORS.md`): PMC includes Tianqi Chen (creator, U. Washington), Yuan Tang (Red Hat), Nan Zhu (Uber), Hyunsu Cho (NVIDIA, primary CI administrator and Python package maintainer), Jiaming Yuan (secondary CI administrator, independent), Rory Mitchell (U. Waikato), Michael Benesty (independent). Committers include Tong He (Amazon AI), Sergei Lebedev (Criteo), Egor Smirnov (Intel), plus independents. CI infrastructure runs self-hosted Jenkins/GitHub Actions/RunsOn on AWS, administered by Hyunsu Cho (NVIDIA) and Jiaming Yuan. Sponsors at the "Sponsor" tier (funding, not platform support): NVIDIA, Intel, Comet, Databento.

**Community stance on new ports:** no `PLATFORMS.md`, `SUPPORT.md`, `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository, and no documented policy or discussion on RISC-V (or new architecture ports generally) was found. No one appears to have ever proposed a RISC-V port to the project - this is an absence of engagement, not a rejection.

**RISE membership:** XGBoost is not listed as a member project on [riseproject.dev](https://riseproject.dev/), and RISE's own project tracker (`riseproject-dev/sw-ecosystem`) carries XGBoost only as a **queued** project awaiting this report, not as a named funded initiative (unlike PyTorch, llama.cpp, IREE, oneDNN, or OpenBLAS, which RISE explicitly names as funded).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2019-12-18 | Issue #5131 filed: R/CRAN build failure on Alpine Linux (musl) due to inadequate endian-detection macro cascade. Not RISC-V-related, but the prerequisite for #5232. | [dmlc/xgboost#5131](https://github.com/dmlc/xgboost/issues/5131) |
| 2020-01-27 | PR #5232 merged: replaces a fragile compiler-macro cascade for endian detection (R/CRAN build) with an Autoconf `AC_RUN_IFELSE` runtime probe. The *replaced* macro cascade had listed `__RISCV__` alongside `__GLIBC__`/`__ANDROID__` as a platform routed through `<endian.h>`. This is a general portability fix, not a RISC-V port or enablement effort. Author: Hyunsu Cho (chyunsu3, NVIDIA). | [dmlc/xgboost#5232](https://github.com/dmlc/xgboost/pull/5232) |
| 2020-02-20 | v1.0.0 released, first release containing the PR #5232 merge commit (`0c74552`). | [dmlc/xgboost releases](https://github.com/dmlc/xgboost/releases) |
| Undated | Ubuntu 26.04 ("resolute") and Debian sid begin shipping `libxgboost0`/`libxgboost-dev`/`python3-xgboost` for riscv64, built from unmodified-or-unknown-patch-status upstream source (downstream packaging, no corresponding upstream GitHub activity). | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=XGBoost&suite=resolute&searchon=names&section=all), [packages.debian.org](https://packages.debian.org/sid/science/xgboost) |
| 2026-08-28 | PR #408 "xgboost: add build-xgboost.yml for riscv64 wheels" merged in the separate `riseproject-dev/python-wheels` repository - a dedicated CI workflow builds an xgboost riscv64 wheel via `cibuildwheel`, running upstream's own `test_basic.py`/`test_basic_models.py` test suite on RISE's native `ubuntu-24.04-riscv` GitHub runners. **This is third-party CI, not part of dmlc/xgboost.** | riseproject-dev/python-wheels PR #408 (internal, per research findings) |
| 2026-08-28 | PR #823 "docs: add xgboost" merged in `riseproject-dev/python-wheels` (docs entry for the published wheel). | riseproject-dev/python-wheels PR #823 (internal, per research findings) |
| 2026-09-03 | Issue #841 "xgboost riscv64 support" opened by luhenry in `riseproject-dev/python-wheels`, tracking continued riscv64 support following #408. | riseproject-dev/python-wheels #841 (internal, per research findings) |

**Is it fully upstream?** No. Every riscv64-relevant artifact currently traces to either (a) downstream distro packaging (Ubuntu, Debian) with no visible upstream GitHub activity, or (b) a third-party CI/wheel pipeline in RISE's own `python-wheels` repository. Nothing riscv64-specific has been merged into, or even proposed to, `dmlc/xgboost` itself.

## 3. Upstream Support Tier

No formal architecture/platform support-tier policy document exists (`PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/` - none present). Support tiers are inferred entirely from observed CI and release behavior.

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI builds | Yes (`main.yml`, `python_tests.yml`, etc.) | Yes (`main.yml`, `jvm_tests.yml`, `python_wheels_winarm64.yml`) | No |
| Upstream CI runs tests | Yes | Yes | No (no CI job exists) |
| Official PyPI wheel | Yes (`manylinux2014_x86_64`) | Yes (`manylinux2014_aarch64`) | No |
| Official CRAN/JVM binaries | Yes | Yes | Not checked separately; no evidence found |
| Distro package (Ubuntu 26.04 resolute) | Yes | Yes | Yes (`libxgboost0`, `libxgboost-dev`, `python3-xgboost`, 3.0.4-1build1) - [package page](https://packages.ubuntu.com/resolute/riscv64/libxgboost0) |

Evidence: all 17 GitHub Actions workflow files in `dmlc/xgboost` (`cccl_nightly.yml`, `ci_configure.yml`, `freebsd.yml`, `jvm_tests.yml`, `lint.yml`, `main.yml`, `misc.yml`, `pre-commit.yml`, `python_tests.yml`, `python_wheels_variants.yml`, `python_wheels_winarm64.yml`, `r_nold.yml`, `r_tests.yml`, `scorecards.yml`, `stale-prs.yml`, `sycl_tests.yml`, `windows.yml`) were read directly; none reference riscv64, while `aarch64`/`arm64` genuinely do appear in `main.yml`, `jvm_tests.yml`, and `python_wheels_winarm64.yml`, confirming the absence is real rather than a search-methodology gap. Official wheel platform tags per [readthedocs install docs](https://xgboost.readthedocs.io/en/stable/install.html): Linux x86_64/aarch64, Windows x86_64/aarch64, macOS x86_64/Apple Silicon - riscv64 is absent.

## 4. Technical Architecture and RISC-V-Specific Subsystems

XGBoost is not an optimization-purpose (ISA-tuning) project: its value proposition is the gradient-boosting algorithm and its API surface, not hand-tuned SIMD kernels. Its hot paths (histogram building, split finding) are portable C++ relying on the compiler's auto-vectorizer (`#pragma omp simd`); the project has in fact **removed** its old experimental x86 AVX intrinsics path (`CMakeLists.txt` treats `USE_AVX` as a hard `SEND_ERROR` deprecation), so even amd64 no longer receives hand-tuned SIMD for the core algorithm. There is no JIT, no cryptography, and no assembly anywhere in the tree.

Exactly four components in the codebase (three in XGBoost proper, one in the vendored `dmlc-core` submodule) carry any architecture conditional at all:

| Component | File | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| CPU cache-size detection | `src/common/cache_manager.cc` | CPUID assembly (hand-tuned) | sysfs read / compiled defaults (generic) | sysfs read / compiled defaults (generic, same as arm64) |
| Memory prefetch hint | `src/common/hist_util.cc`, `src/c_api/c_api.cc` | `_mm_prefetch` intrinsic | `__builtin_prefetch` (GCC/Clang generic) | `__builtin_prefetch` (GCC/Clang generic, same as arm64) |
| ctz/popcount bit ops | `src/common/bitfield.h`, `include/xgboost/linalg.h` | `__builtin_ctz`/`__builtin_popcountll` (GCC/Clang) or MSVC intrinsics | `__builtin_ctz`/`__builtin_popcountll` | Same `__builtin_ctz`/`__builtin_popcountll` branch as amd64 GCC/Clang and arm64 - no ISA split here at all |
| Lock-free queue fences (vendored `dmlc-core`) | `include/dmlc/concurrentqueue.h` | weak-atomic x86 fence tuning | weak-atomic ARM fence tuning | generic `std::atomic` fence default |

No `arch/riscv/` directory, no RVV intrinsics, no `.S` assembly files, and no `#ifdef __riscv` guards exist anywhere in `dmlc/xgboost` (confirmed via full-text grep of HEAD `6c3fde7` and GitHub code search). riscv64 runs the identical generic/scalar fallback path that arm64, ppc64, and s390x already use - this is a universal non-x86_64 characteristic of the codebase, not an XGBoost-specific riscv64 gap.

Two files in the separate `dmlc-core` submodule contain trivial `__RISCV__` preprocessor guards (not compute code):
- [`dmlc-core/include/dmlc/build_config_default.h`](https://github.com/dmlc/dmlc-core/blob/main/include/dmlc/build_config_default.h) - excludes `__RISCV__` from the default stack-trace-logging condition.
- [`dmlc-core/include/dmlc/endian.h`](https://github.com/dmlc/dmlc-core/blob/main/include/dmlc/endian.h) - includes `__RISCV__` in the glibc-style endianness-detection branch (`#elif defined(__GLIBC__) || ... || defined(__RISCV__)`).

`__RISCV__` is not a standard GCC/Clang predefined macro for RISC-V targets (the real one is `__riscv`), so neither guard actually triggers on a real riscv64 toolchain. This is functionally dead code, though not build-blocking: real riscv64 Linux is glibc-based, so the `endian.h` branch is still reached via the `__GLIBC__` condition in the same `#elif`, independent of the broken `__RISCV__` term.

The one hardware-gated gap - CUDA/GPU acceleration - is unrelated to XGBoost's own code: no CUDA Toolkit targets riscv64 as a host platform for any project, so `USE_CUDA=ON` is unreachable on riscv64 regardless of XGBoost's own porting effort.

## 5. Build System, Cross-Compilation, and Toolchain

**Standard CPU build** (only viable path on riscv64 today, per [`doc/build.rst`](https://github.com/dmlc/xgboost/blob/master/doc/build.rst)):
```
cmake -B build -S . -DCMAKE_BUILD_TYPE=RelWithDebInfo -GNinja
cd build && ninja
```

**Toolchain requirements** (`CMakeLists.txt:21-37`), all justified by C++17 language-feature use:
- CMake >= 3.18
- GCC >= 8.1, else `message(FATAL_ERROR "Need GCC 8.1 or newer to build XGBoost")`
- Clang >= 9.0, else fatal error
- AppleClang >= 11.0 (Xcode 11.0), else fatal error

No `-DUSE_X=OFF` flags are architecture-gated; the only documented options (`USE_CUDA`, `USE_NCCL`, `USE_DLOPEN_NCCL`, `HIDE_CXX_SYMBOLS`, `USE_OPENMP`) are generic.

**No riscv64 toolchain file, Dockerfile, or cross-compilation doc ships with the project.** `find . -iname "*toolchain*"` and `find . -iname "*riscv*"` both return empty in the repository. A user building for riscv64 must supply their own `CMAKE_TOOLCHAIN_FILE` and riscv64 GCC/Clang cross-compiler.

**QEMU usage exists, but only for s390x** (big-endian testing), not riscv64: `dmlc-core/.github/workflows/githubci.yml`'s `s390x_test` job uses `multiarch/qemu-user-static` + `docker://multiarch/ubuntu-core:s390x-focal`, invoking `dmlc-core/scripts/s390x/build_via_cmake.sh` under emulation. This pattern (Dockerfile + QEMU CI job) has no riscv64 counterpart anywhere in the tree.

**Known build issue:** the `__RISCV__`/`__riscv` macro mismatch described in Section 4 (cosmetically incorrect but not build-blocking on glibc-based riscv64 Linux, per the analysis above).

RISE's third-party pipeline (`riseproject-dev/python-wheels/.github/workflows/build-xgboost.yml`) builds successfully on RISE's native `ubuntu-24.04-riscv` runners using `cibuildwheel` targeting `cp312-manylinux_riscv64`, after patching `pyproject.toml` to drop the NCCL/CUDA dependency declaration (not applicable on riscv64) - demonstrating the standard CMake build path does work on real riscv64 hardware with a standard GCC/Clang toolchain.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core CPU training/inference (histogram, split-finding) | Yes | Yes | Yes (generic scalar fallback, identical to arm64) |
| Official pip-installable wheel | Yes | Yes | **No** (functional gap: `pip install xgboost` fails to find a riscv64 wheel on official PyPI) |
| GPU/CUDA acceleration | Yes | Yes (where CUDA-capable ARM hardware exists) | **No** - CUDA Toolkit does not target riscv64 as a host platform for any project; not an XGBoost-specific gap |
| Upstream CI test execution | Yes | Yes | **No** - no upstream riscv64 CI job exists at all |
| Distro package (apt) | Yes | Yes | Yes (Ubuntu 26.04 resolute, Debian sid) |
| Hand-tuned SIMD/cache-detection veneer | Yes (CPUID, `_mm_prefetch`) | No (same generic fallback as riscv64) | No (generic fallback, same as arm64) - not a riscv64-specific deficit since amd64 is the only architecture with this veneer |

**Performance gaps:** Data not available: no riscv64-specific benchmark numbers for XGBoost were found in GitHub, web search, or the RISE blog (exhaustive search performed; the closest adjacent data point is a CatBoost-on-RISC-V vectorization paper, [arXiv:2405.11062](https://arxiv.org/abs/2405.11062), a different library). Since the CPU code is architecture-generic scalar/auto-vectorized C++ identical to arm64, no XGBoost-specific performance delta is expected beyond general riscv64-vs-amd64/arm64 hardware/compiler differences, but this has not been measured for XGBoost specifically.

**Security hardening gaps:** Data not available: this was not specifically researched for XGBoost on riscv64.

**NaN/floating-point semantics issues:** No open riscv64-specific NaN or floating-point correctness bug was found in the `dmlc/xgboost` issue tracker (exhaustive search across multiple riscv-related queries returned zero matches).

## 7. CI/CD Infrastructure

**No riscv64 CI exists in `dmlc/xgboost` itself.** Confirmed by directly reading all 17 workflow files' content: zero occurrences of "riscv" in any of them. No trigger, runner, job, or QEMU step targets riscv64 anywhere in the repository (main repo or `dmlc-core` submodule); the only "riscv" text anywhere in the tree is the two dead `__RISCV__` preprocessor macros described in Section 4.

A **third-party** pipeline exists in the separate `riseproject-dev/python-wheels` repository: `.github/workflows/build-xgboost.yml` builds an xgboost 3.4.1 riscv64 wheel via `cibuildwheel` (`cp312-manylinux_riscv64`), running on **RISE's own native `ubuntu-24.04-riscv` GitHub runners** (real riscv64 hardware, not QEMU emulation, per RISE's [March 2026 runner-announcement blog post](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)), and it **does run upstream's own test suite** (`test_basic.py`, `test_basic_models.py`) as part of the build. This is genuine build+test execution on riscv64, but it happens in RISE's infrastructure, not XGBoost's own CI.

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI (dmlc/xgboost) build | Yes | Yes | No |
| Upstream CI (dmlc/xgboost) test | Yes | Yes | No |
| Release-blocking | Yes (part of `main.yml`) | Yes | N/A - no job exists |
| Third-party CI (RISE `python-wheels`) build+test | N/A (not needed) | N/A (not needed) | Yes, on native RISE riscv64 GitHub runners |

## 8. Distribution and Release Status

- **Official PyPI** ([`pypi.org/pypi/xgboost/json`](https://pypi.org/pypi/xgboost/json)): no riscv64 wheel. Current version 3.4.1; wheel tags present are `macosx_*_x86_64` variants, `manylinux2014_x86_64`, `manylinux2014_aarch64`, `win_amd64`/`win32`, plus sdist.
- **Ubuntu 26.04 (resolute)**: `libxgboost0`, `libxgboost-dev`, `python3-xgboost` at 3.0.4-1build1, riscv64 among the listed architectures (alongside amd64, arm64, armhf, ppc64el, s390x) - confirmed via a live fetch of the specific package page [`packages.ubuntu.com/resolute/riscv64/libxgboost0`](https://packages.ubuntu.com/resolute/riscv64/libxgboost0), which resolves to a real page with concrete package size (2,388.8 kB) and installed size (7,328.0 kB). A fourth package, `libxgboost-predictor-java` (0.3.1+dfsg-3), is `arch: all` (Java, not architecture-gated).
- **Debian sid**: also packages xgboost for riscv64, per [`packages.debian.org/sid/science/xgboost`](https://packages.debian.org/sid/science/xgboost).
- **RISE GitLab wheel index** (third-party, not official PyPI, project 56254198): `xgboost-3.4.1-py3-none-manylinux_2_39_riscv64.whl` available at [`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/xgboost/`](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/xgboost/).
- **GitHub Releases (dmlc/xgboost)**: Data not available - this session's GitHub MCP access was scoped only to `riseproject-dev/sw-ecosystem`; `dmlc/xgboost` release assets could not be checked. Flagged for retry with that repo attached.
- **Arch Linux RISC-V** (`archriscv.felixc.at`): no evidence xgboost is packaged there (query returned no listing; direct path returned HTTP 404).

**What a user must do today to get a working riscv64 binary:** either (a) `apt install python3-xgboost` (or `libxgboost-dev`) on Ubuntu 26.04 (resolute) or Debian sid, (b) install from RISE's GitLab package index via a non-default `--extra-index-url` (not discoverable through plain `pip install xgboost`), or (c) build from source with a self-supplied riscv64 GCC >=8.1 or Clang >=9.0 cross-toolchain, since XGBoost ships no toolchain file, Dockerfile, or riscv64 CI to validate the result.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| dmlc-core | build-dependency, critical | Vendored git submodule, built from source alongside XGBoost (`BUILD_WITH_SYSTEM_DMLC=OFF` default); no riscv64-specific build issue found | N/A - exercised only via XGBoost's own tests | N/A - statically bundled into `libxgboost` | GitHub search `riscv64 repo:dmlc/dmlc-core` returned 0 results - no riscv64-specific problems reported, but also no riscv64 CI/validation in that repo |
| OpenMP | runtime-dependency, critical | `find_package(OpenMP REQUIRED C CXX)` (`CMakeLists.txt:274`); standard on GCC/Clang riscv64 toolchains (libgomp) - [NEEDS VERIFICATION] this session, not independently confirmed against a package tracker | Not separately tracked; exercised transitively | Believed available via standard riscv64 toolchains | None found |
| GCC | build-dependency, critical | GCC >= 8.1 required for C++17 support (`CMakeLists.txt:21-37`, fatal error below that version); GCC riscv64 cross/native toolchains are standard on Ubuntu/Debian riscv64 ports | N/A | N/A | None found |
| NCCL | build-dependency, optional | N/A - reachable only when `USE_CUDA=ON` (`CMakeLists.txt:131,284-286`); no CUDA Toolkit targets riscv64 as host, so this code path is unreachable on riscv64 regardless of NCCL's own status | N/A | N/A | GitHub search `riscv64 repo:NVIDIA/nccl` returned 0 results - blocked upstream at the CUDA Toolkit level, not evaluated on its own merits |
| CUDA | build-dependency, optional | No CUDA Toolkit release targets riscv64 as a host architecture | N/A | N/A | Hardware/vendor-driven gap identical for every project requiring CUDA on riscv64, not XGBoost-specific |
| autoconf | build-dependency, optional | Used only in the R/CRAN build path (`configure.ac`), introduced by PR #5232 (Section 2) to replace the fragile endian macro cascade; Autoconf itself is architecture-agnostic and runs on any Linux host, riscv64 included | Not separately tracked | N/A | No riscv64-specific issue found with this usage |
| cibuildwheel | build-dependency, optional | Used by upstream's own `python_wheels_variants.yml`/`python_wheels_winarm64.yml` (targets x86_64/aarch64/winarm64 only, no riscv64 configuration upstream); separately used by RISE's third-party `riseproject-dev/python-wheels/.github/workflows/build-xgboost.yml`, which adds a `cp312-manylinux_riscv64` target running on RISE's native riscv64 runners | Third-party (RISE) pipeline runs upstream's own `test_basic.py`/`test_basic_models.py` under this riscv64 cibuildwheel target | RISE-hosted wheel published via this pipeline (not upstream PyPI) | Works in RISE's fork of the workflow configuration; no riscv64 platform is configured in upstream's own cibuildwheel jobs |
| pthreads (glibc Threads) | indirect (via `find_package(Threads REQUIRED)`, `CMakeLists.txt:265`) | Standard component of Ubuntu/Debian riscv64 glibc port | N/A - baseline libc | Green (assumed standard toolchain component) - [NEEDS VERIFICATION] | None found |
| GoogleTest | indirect, test-only (`GOOGLE_TEST` option, default OFF; CPM-fetched if no system GTest) | Ubuntu 26.04 ships GoogleTest 1.17.0-1build1 (`arch: all`, explicitly lists riscv64) per this ecosystem's `project-reports/reports/googletest.md` [NEEDS VERIFICATION - stored report not re-read this session] | One long-open low-severity bug: `GetThreadCount()` returns 0 on riscv64, [google/googletest#3756](https://github.com/google/googletest/issues/3756), does not affect assertion correctness | Green (source package, arch:all) | Maintainer stated riscv64 "not officially supported" per issue #3756 |
| NumPy | indirect, Python runtime (`pyproject.toml` dependency) | Functional scalar port; builds via Debian sid and Ubuntu `python3-numpy`; riscv64 is Tier 3 per NEP 57 [NEEDS VERIFICATION - stored report not re-read this session] | Yellow-tier per that report: native riscv64 CI builds wheels but runs no tests; QEMU CI is non-blocking | No official PyPI riscv64 wheels yet (target: NumPy 2.6.0) | [numpy/numpy#30216](https://github.com/numpy/numpy/issues/30216) (PyPI wheel tracking) |
| SciPy | indirect, Python runtime (sparse-matrix input support) | No dedicated ecosystem project report exists to cite this session | Open riscv64 test-hang/failure issues under QEMU: [scipy/scipy#19378](https://github.com/scipy/scipy/issues/19378), [scipy/scipy#22839](https://github.com/scipy/scipy/issues/22839), [scipy/scipy#22753](https://github.com/scipy/scipy/issues/22753) | Not verified this session | 10 riscv64-related issues found in scipy/scipy, several open |

The GPU-only dependency chain (CCCL/Thrust/CUB/libcudacxx, RMM, nvcomp) is reachable only when `USE_CUDA=ON` and is therefore moot on riscv64 today for the same reason as NCCL and CUDA above - no evidence any of them has riscv64 activity, consistent with nobody having reached that code path.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-specific issue exists in `dmlc/xgboost` | N/A | N/A | Exhaustive search (`"riscv64 performance"`, `"riscv64 bug"`, `"riscv nan floating"`, plain `"riscv"`, `"RISC-V is:issue"`) returned 0 genuinely relevant results against `repo:dmlc/xgboost`. |
| [google/googletest#3756](https://github.com/google/googletest/issues/3756) | `GetThreadCount()` returns 0 on riscv64 | Open | Low | Indirect (test-only) dependency issue, does not affect XGBoost's own test correctness. |
| [scipy/scipy#19378](https://github.com/scipy/scipy/issues/19378) | riscv64 cross-compile tracking | Open | Medium (indirect dependency) | Affects the optional SciPy Python runtime dependency, not XGBoost's core C++. |
| [scipy/scipy#22839](https://github.com/scipy/scipy/issues/22839) | Tests hang under QEMU on riscv64 | Open | Medium (indirect dependency) | Same as above. |
| [scipy/scipy#22753](https://github.com/scipy/scipy/issues/22753) | `special.sph_harm` NaN mismatch on riscv64 | Open | Low/Medium (indirect dependency) | Correctness bug, but in SciPy, not XGBoost. |

**No correctness bugs specific to XGBoost's own code on riscv64 were found.** All identified open issues belong to indirect Python dependencies (SciPy) or a test-only dependency (GoogleTest), not to XGBoost's C++ core.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No PMC member, committer, or issue thread has ever weighed in for or against riscv64 support - there is no evidence anyone has proposed it.

**Technical blockers:**
- No upstream riscv64 toolchain file, Dockerfile, or CI job exists to validate a port (Section 5, 7).
- The dead `__RISCV__` vs `__riscv` macro mismatch in vendored `dmlc-core` headers (Section 4) is cosmetically wrong but not build-blocking.
- No CUDA Toolkit targets riscv64, permanently blocking GPU acceleration on this architecture until NVIDIA (or an alternative CUDA-compatible toolkit) ships one - outside XGBoost's control.

**Organizational blockers:** the general RFC/public-discussion process (`doc/contrib/community.rst`) applies to any "major change," which a new CI target likely qualifies as, requiring committer/reviewer sign-off and PMC consensus. No precedent-setting resistance was found; the one architecture-addition precedent in the record (PR #6200, "Added arm64 job in Travis-CI," merged 2020-10-07) suggests the PMC has accepted new-architecture CI additions before.

**Acceptance probability:** [NEEDS VERIFICATION] - no direct evidence either way, but the combination of (a) a clean, working downstream build on Ubuntu/Debian, (b) a working, test-passing third-party build via RISE's own CI on native riscv64 hardware, and (c) a low-friction historical precedent for adding new architecture CI (arm64, s390x in `dmlc-core`) suggests a well-formed upstream PR modeled on RISE's `build-xgboost.yml` would have a reasonable chance of acceptance, but this is inference from indirect evidence, not a documented upstream signal.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro (Ubuntu 26.04 resolute and Debian sid ship riscv64 binaries built from source; RISE additionally hosts a third-party riscv64 wheel via its own GitLab package index, not upstream PyPI)
- **Justification:** No upstream riscv64 CI exists in `dmlc/xgboost` - confirmed by directly reading all 17 GitHub Actions workflow files, none of which reference riscv64 ([workflow directory](https://github.com/dmlc/xgboost/tree/master/.github/workflows)), and no official riscv64 wheel is published on PyPI ([pypi.org/pypi/xgboost/json](https://pypi.org/pypi/xgboost/json)). This applies the distribution floor from the color model: Ubuntu 26.04 (resolute) ships working `libxgboost0`/`libxgboost-dev`/`python3-xgboost` riscv64 packages built from source ([package page](https://packages.ubuntu.com/resolute/riscv64/libxgboost0)), and Debian sid does likewise ([packages.debian.org](https://packages.debian.org/sid/science/xgboost)), but whether these packages apply riscv64-specific patches versus vanilla upstream source was not verified this session - per the color model, unknown patch status caps the floor at **orange** rather than yellow.
- **Optimization gap:** N/A. XGBoost is not an optimization-purpose project under the color model's test (its value proposition is the gradient-boosting algorithm and API, not architecture-specific speed over a simpler reference implementation); its core CPU code uses the same portable, auto-vectorized C++ on riscv64 as it does on arm64, and even amd64 no longer carries hand-tuned SIMD for the core algorithm (Section 4). No optimization-level cap applies.
- **Pending work that could change the grade:** the `riseproject-dev/python-wheels` pipeline already builds and *tests* xgboost 3.4.1 on native riscv64 hardware via RISE's own runners (merged PRs #408, #823; open tracking issue #841) - this is a working, test-passing artifact that could be upstreamed into `dmlc/xgboost`'s own CI (e.g., as an addition to `python_wheels_variants.yml`, modeled on the existing arm64/winarm64 jobs) to move the color to blue (upstream CI passes, no upstream riscv64 PyPI wheel yet) or green (if the resulting wheel were also published to official PyPI). No such upstream PR currently exists.

## 14. Investment Analysis

**What RISE has already done:** built and tested an xgboost 3.4.1 riscv64 wheel end-to-end via its own native riscv64 GitHub runners in `riseproject-dev/python-wheels` (merged PRs #408, #823), published it to RISE's GitLab wheel index, and opened a tracking issue (#841) for continued support. This proves functional buildability and basic test-suite passage on real riscv64 hardware. It has **not** touched `dmlc/xgboost` itself: no upstream CI job, no upstream PyPI wheel, and no upstream PR of any kind exists. The scope below is sized to close that specific upstream gap, not to re-derive what RISE has already proven works.

### 14.1 Functional Enablement

Functional enablement is effectively already demonstrated downstream (Ubuntu, Debian, RISE wheel). Remaining upstream work is small: fix the dead `__RISCV__`/`__riscv` macro mismatch in vendored `dmlc-core` headers (cosmetic, not build-blocking, but should be corrected before claiming upstream riscv64 awareness), and validate the standard CMake build against a pinned riscv64 GCC/Clang toolchain in a reproducible environment.

### 14.2 Performance Optimization

Not applicable as a distinct workstream: XGBoost's core hot paths are already architecture-generic scalar/auto-vectorized C++ on every non-x86_64 architecture, including riscv64, and amd64 itself no longer carries hand-tuned SIMD for the core algorithm (its old AVX path is deprecated). There is no RISC-V-specific optimization gap to close because there is no comparable amd64/arm64 optimization tier being missed.

### 14.3 CI/CD Infrastructure

The primary gap. Add a native riscv64 job to `dmlc/xgboost`'s own GitHub Actions (e.g., extending `python_wheels_variants.yml` with a `cp3xx-manylinux_riscv64` target, modeled directly on RISE's proven `riseproject-dev/python-wheels/.github/workflows/build-xgboost.yml`), running on RISE's native riscv64 runners, executing the existing `test_basic.py`/`test_basic_models.py` suite, and publishing the resulting wheel to official PyPI. This also requires PMC/committer review per the project's RFC process (Section 12).

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report criteria; XGBoost is consumed directly via its own Python/R/JVM/C bindings rather than through a large dependent-package ecosystem that itself needs separate riscv64 enablement.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `__RISCV__`/`__riscv` macro mismatch in vendored `dmlc-core` headers | 0.5 | XGBoost/dmlc-core contributor | Low |
| Functional | Validate standard CMake build against a pinned riscv64 GCC/Clang toolchain, document in `doc/build.rst` | 0.5 | XGBoost contributor | Medium |
| CI/CD | Add native riscv64 job to `dmlc/xgboost`'s own GitHub Actions (build + run existing test suite), modeled on RISE's `build-xgboost.yml` | 1-2 | XGBoost contributor + RISE (runner access) | High |
| CI/CD | Upstream PR review/iteration with PMC (RFC process, Section 12) | 1 (elapsed, low active effort) | XGBoost PMC + submitter | Medium |
| Release | Publish official riscv64 wheel to PyPI once CI job exists (cibuildwheel config addition, reuses CI work above) | 0.5 | XGBoost contributor | Medium |
| Optimization | None identified - no RISC-V-specific optimization gap exists relative to amd64/arm64 | 0 | N/A | N/A |
| Ecosystem | Not applicable (Section 10 omitted) | 0 | N/A | N/A |

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [dmlc/xgboost repository](https://github.com/dmlc/xgboost)
- [XGBoost documentation homepage](https://xgboost.readthedocs.io/)
- [dmlc/xgboost GitHub Actions workflows](https://github.com/dmlc/xgboost/tree/master/.github/workflows)
- [dmlc/xgboost LICENSE (Apache 2.0)](https://github.com/dmlc/xgboost/blob/master/LICENSE)
- [dmlc/xgboost doc/contrib/community.rst (governance model)](https://github.com/dmlc/xgboost/blob/master/doc/contrib/community.rst)
- [dmlc/xgboost doc/contrib/donate.rst (fiscal host)](https://github.com/dmlc/xgboost/blob/master/doc/contrib/donate.rst)
- [dmlc/xgboost CONTRIBUTORS.md](https://github.com/dmlc/xgboost/blob/master/CONTRIBUTORS.md)
- [dmlc/xgboost doc/build.rst (build instructions)](https://github.com/dmlc/xgboost/blob/master/doc/build.rst)
- [dmlc/xgboost doc/install.rst (binary wheel platform table)](https://github.com/dmlc/xgboost/blob/master/doc/install.rst)
- [dmlc/xgboost CMakeLists.txt](https://github.com/dmlc/xgboost/blob/master/CMakeLists.txt)
- [PR #5232: Robust endian detection in CRAN xgboost build](https://github.com/dmlc/xgboost/pull/5232)
- [Issue #5131: Compilation failure on Alpine Linux (prerequisite to #5232)](https://github.com/dmlc/xgboost/issues/5131)
- [Issue #6243: Wheel for arm64 (false-positive search hit, ARM64 not RISC-V)](https://github.com/dmlc/xgboost/issues/6243)
- [PR #6200: Added arm64 job in Travis-CI (architecture-addition precedent)](https://github.com/dmlc/xgboost/pull/6200)
- [PR #12499: Dependabot github-actions bump (riscv64 mention is unrelated changelog text)](https://github.com/dmlc/xgboost/pull/12499)
- [dmlc-core include/dmlc/build_config_default.h](https://github.com/dmlc/dmlc-core/blob/main/include/dmlc/build_config_default.h)
- [dmlc-core include/dmlc/endian.h](https://github.com/dmlc/dmlc-core/blob/main/include/dmlc/endian.h)
- [dmlc-core .github/workflows/githubci.yml (s390x QEMU CI precedent)](https://github.com/dmlc/dmlc-core/blob/main/.github/workflows/githubci.yml)
- [PyPI xgboost package JSON API](https://pypi.org/pypi/xgboost/json)
- [Ubuntu resolute libxgboost0 riscv64 package page](https://packages.ubuntu.com/resolute/riscv64/libxgboost0)
- [Ubuntu package search: XGBoost, suite=resolute](https://packages.ubuntu.com/search?keywords=XGBoost&suite=resolute&searchon=names&section=all)
- [Debian sid xgboost package tracker](https://packages.debian.org/sid/science/xgboost)
- [RISE GitLab wheel index for xgboost](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/xgboost/)
- [RISE blog: Announcing the RISE RISC-V Runners - free native RISC-V CI on GitHub](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE blog: Easy installation of binary Python packages on riscv64 devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE wheel_builder tracker page](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject.dev homepage](https://riseproject.dev/)
- [riseproject.dev members page](https://riseproject.dev/members/) [NEEDS VERIFICATION - exact URL path not independently re-confirmed this session]
- [google/googletest#3756: GetThreadCount() returns 0 on riscv64](https://github.com/google/googletest/issues/3756)
- [numpy/numpy#30216: riscv64 PyPI wheel tracking](https://github.com/numpy/numpy/issues/30216)
- [OpenMathLib/OpenBLAS#5811: DGEMM correctness regression on RVV hardware](https://github.com/OpenMathLib/OpenBLAS/issues/5811)
- [scipy/scipy#19378: riscv64 cross-compile tracking](https://github.com/scipy/scipy/issues/19378)
- [scipy/scipy#22839: riscv64 tests hang under QEMU](https://github.com/scipy/scipy/issues/22839)
- [scipy/scipy#22753: special.sph_harm NaN mismatch on riscv64](https://github.com/scipy/scipy/issues/22753)
- [scipy/scipy#21732: QUERY - support for RISC-V? (closed)](https://github.com/scipy/scipy/issues/21732)
- [Kalyakina et al., Vectorization of Gradient Boosting of Decision Trees Prediction in the CatBoost Library for RISC-V Processors (arXiv:2405.11062)](https://arxiv.org/abs/2405.11062)
- [dmlc/xgboost#10331: XGBoost performance improvement using ARM SVE intrinsics (unrelated ARM feature request)](https://github.com/dmlc/xgboost/issues/10331)
- [dmlc/xgboost#6697: Introduced CPU performance gaps discussion (unrelated x86 regression)](https://github.com/dmlc/xgboost/issues/6697)
