---
title: NumPy
parent: Project Reports
color: yellow
dependencies:
  - name: OpenBLAS
    relation: runtime-dependency
    criticality: critical
  - name: Highway
    relation: runtime-dependency
    criticality: optional
  - name: PocketFFT
    relation: runtime-dependency
    criticality: optional
  - name: libmvec
    relation: runtime-dependency
    criticality: optional
  - name: Meson
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: Cython
    relation: build-dependency
    criticality: optional
  - name: cibuildwheel
    relation: build-dependency
    criticality: optional
  - name: pytest
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="numpy" %}

# NumPy

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for NumPy<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

NumPy is the foundational numerical array library for the Python scientific computing stack and the direct dependency of SciPy, pandas, scikit-learn, PyTorch, and virtually every Python ML/data workload. It is a [NumFOCUS](https://numfocus.org/) Sponsored Project: NumFOCUS (a 501(c)(3) nonprofit) provides fiscal, legal, and administrative support and holds NumPy's trademarks through a 5-member Subcommittee (Charles Harris, Ralf Gommers, Inessa Pawson, Sebastian Berg, plus external member Thomas Caswell) that manages funding only and has no say in technical direction.

Technical governance is consensus-based (no BDFL). A 9-member Steering Council (Sebastian Berg, Ralf Gommers, Charles Harris, Inessa Pawson, Matti Picus, Stefan van der Walt, Melissa Weber Mendonca, Marten van Kerkwijk, Nathan Goldbaum) handles technical direction and only formally votes (Apache-style +1/-1/fractional) when consensus breaks down; members are nominated for sustained, broad contribution, not commit count. License: BSD. There is no dedicated MAINTAINERS/OWNERS/CODEOWNERS file at the repo root; governance lives in `doc/source/dev/governance/governance.rst`.

Direct funders: Gordon and Betty Moore Foundation, Alfred P. Sloan Foundation, Chan Zuckerberg Initiative, Tidelift. Institutional partners employing contributors: Quansight (Nathan Goldbaum, Ralf Gommers, Matti Picus, Melissa Weber Mendonca, Mateusz Sokol), NVIDIA (Sebastian Berg), UC Berkeley (Stefan van der Walt, academic).

Community stance on the RISC-V port is positive: the Tier 3 promotion drew explicit support ("Very happy to see it happening") in the discussion tied to [issue #30216](https://github.com/numpy/numpy/issues/30216), with maintainers signaling intent to reassess for a higher tier once CI stability improves.

Repository: [numpy/numpy](https://github.com/numpy/numpy). Homepage: [numpy.org](https://numpy.org/). Latest stable release as of this writing: 2.4.6. Development target for the native riscv64 CI work: 2.6.0.

## 2. Port History and Upstreaming Timeline

| Date | PR / Issue | Event |
|------|-----------|-------|
| Oct 2016 | [Issue #8213](https://github.com/numpy/numpy/issues/8213) | First request for riscv64 support, with a submitted patch |
| Apr 2018 | [PR #10833](https://github.com/numpy/numpy/pull/10833) | Initial 64-bit RISC-V support merged (aurel32); full test suite passing on Python 2.7/3.6 with one noted exception (`test_float` in `TestBoolCmp`); closed #8213 |
| Mar 2019 | [PR #13095](https://github.com/numpy/numpy/pull/13095) / [PR #13141](https://github.com/numpy/numpy/pull/13141) | First riscv64-specific test fixes (ppc and riscv testsuite failures); backported to 1.16.x |
| Nov 2020 (authored) / Sep 2024 (merged) | [PR #17780](https://github.com/numpy/numpy/pull/17780) | RISCV-32 (32-bit) build support added (Khem Raj); sat dormant ~4 years, rebased after the numpy/core to numpy/_core move in NumPy 2.0 |
| Nov 2023 | [PR #25246](https://github.com/numpy/numpy/pull/25246) | First riscv64 CI job added (markdryan), disabling two then-failing tests |
| Dec 2023 | [PR #25280](https://github.com/numpy/numpy/pull/25280) | riscv64 NaN sign-preservation test accommodation (fp_noncontiguous, fpclass) |
| Jan 2024 | [PR #25430](https://github.com/numpy/numpy/pull/25430) / [PR #25618](https://github.com/numpy/numpy/pull/25618) | test_numeric fixes on riscv64; backported to 1.26.x |
| Apr 2024 | [PR #26187](https://github.com/numpy/numpy/pull/26187) | Use `platform.machine()` instead of `platform.processor()` for riscv64 portability (Arch Linux riscv64 returns empty processor string) |
| Apr 2024 | [PR #26219](https://github.com/numpy/numpy/pull/26219) | RVV compile-time and runtime CPU feature detection merged (ksco) |
| Oct 2024 | [PR #27613](https://github.com/numpy/numpy/pull/27613) / [PR #27616](https://github.com/numpy/numpy/pull/27616) | QEMU CI workflow fixes |
| Nov 2024 | [PR #27827](https://github.com/numpy/numpy/pull/27827) / [PR #27828](https://github.com/numpy/numpy/pull/27828) | Skip ninja installation in the QEMU workflow (cross-build friction fix) |
| Sep 2025 | PR #29607 | RISC-V CPU dispatcher unit tests enabled (r-devulap) |
| Oct 2025 | [PR #29927](https://github.com/numpy/numpy/pull/29927) | Unit tests for RISC-V CPU feature detection merged, validated on a Banana Pi BPI-F3 (SpaceMiT K1) |
| Oct 2025 | [PR #29992](https://github.com/numpy/numpy/pull/29992) | SIMD build-option documentation updated to cover riscv64 |
| Nov 2025 | [Issue #30216](https://github.com/numpy/numpy/issues/30216) | Master tracking issue opened: build and distribute manylinux riscv64 wheels to PyPI. Still open. |
| Feb 2026 | [PR #30763](https://github.com/numpy/numpy/pull/30763) | scipy-openblas updated to a version with riscv64 wheels |
| May 2026 | [PR #30338](https://github.com/numpy/numpy/pull/30338) | RVV version-detection bug fixed (hwcap cannot distinguish RVV v0.7 from v1.0); backported in [PR #31538](https://github.com/numpy/numpy/pull/31538) |
| May 2026 | [PR #30995](https://github.com/numpy/numpy/pull/30995) | riscv64 added to the wheel build matrix using RISE native runners (38 min to 12 min build times vs. QEMU); superseded by #31488 |
| May 27 2026 | [PR #31488](https://github.com/numpy/numpy/pull/31488) | Native riscv64 CI workflow merged (Ludovic Henry / luhenry, co-authored Bruno Verachten / gounthar, reviewed by Ralf Gommers), milestone 2.6.0 |
| May 29-30 2026 | [PR #31522](https://github.com/numpy/numpy/pull/31522) | RISC-V formally promoted to Tier 3 in [NEP 57](https://numpy.org/neps/nep-0057-numpy-platform-support.html) (Ralf Gommers, merged by Charles Harris) |
| Jun 29 2026 | [PR #31753](https://github.com/numpy/numpy/pull/31753) | "TST: Fix failing riscv64 tests" merged |
| Jun 30 2026 | [PR #31800](https://github.com/numpy/numpy/pull/31800) | CI housekeeping: move `paths-ignore` to `pull_requests` in `linux_riscv64.yml` |
| Aug 21 2026 | [Issue #32376](https://github.com/numpy/numpy/issues/32376) | 111 test failures on riscv64 (NumPy 2.4.5, EasyBuild/SciPy-bundle build); same tests passed on 2.3.2 on identical hardware, indicating a regression. Open, unbisected. |
| Aug 30 2026 | [Issue #32461](https://github.com/numpy/numpy/issues/32461) | 76 test failures on riscv64 (conda-forge build), overlapping failure signature with #32376. Open. |

First RISC-V-related commit in the repository: 2019-03-05 (Andreas Schwab, `8b7f717`, an f2py REAL(10) fix touching both ppc and riscv, merged via PR #13095). First dedicated riscv64 architecture-enablement commit: 2018-04-01 (PR #10833). First riscv64-targeted CI: 2023-11-30 (PR #25246). Native CI infrastructure: 2026-05-27 (PR #31488, RISE-provided runners).

The port is fully upstream: all architecture-detection, CPU-feature-detection, build-system, and CI code lives in the main `numpy/numpy` repository with no out-of-tree fork or patchset. Two PRs remain open and unmerged: [#30144](https://github.com/numpy/numpy/pull/30144) (Zfh float16, opened Nov 2025) and [#30988](https://github.com/numpy/numpy/pull/30988) (hwcap test fix).

## 3. Upstream Support Tier

NumPy uses a formal platform-support policy defined in [NEP 57](https://numpy.org/neps/nep-0057-numpy-platform-support.html) (merged 2026-02-11, authored by Ralf Gommers). RISC-V was promoted to **Tier 3** on 2026-05-29/30 via PR #31522.

| Tier | PyPI Wheels | CI Blocks Release | Requirement |
|------|------------|-------------------|-------------|
| 1 | Yes | Yes | All maintainers responsible |
| 2 | Yes | Yes | At least one named maintainer, long-term commitment |
| 3 | No | Yes, with exceptions | At least one maintainer or trusted contributor |
| Unsupported | No | No | None |

For riscv64 specifically: no commitment to publish PyPI wheels (tracked in open [issue #30216](https://github.com/numpy/numpy/issues/30216)); CI runs on RISE-provided self-hosted runners under the `ubuntu-24.04-riscv` label (confirmed by NEP 57's own text, which states riscv64 "runs on RISE-provided self-hosted runners," resolving the runner-ownership ambiguity left by the label alone); named platform contacts are Ludovic Henry (luhenry) and Bruno Verachten (gounthar), both RISE-affiliated.

**Discrepancy on CI-blocking claim:** NEP 57's Tier 3 description states CI failures "block releases, with exceptions." The actual workflow files contradict a strict reading of this for riscv64: `linux_qemu.yml`'s riscv64 job carries `continue-on-error: true` (non-blocking by construction), and `linux_riscv64.yml` (the native-hardware workflow) has no test step at all, only a wheel build. Nothing in riscv64's current CI can mechanically block a PR or release on a riscv64 test failure. This is consistent with why two active correctness-regression issues (#32461, #32376) remain open without blocking merges.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| PyPI official wheels | Yes | Yes | No |
| Native CI | Yes | Yes | Build only, no test step |
| CI blocks release on failure | Yes | Yes | No (continue-on-error / no test step) |
| Platform tier | Tier 1 | Tier 1 | Tier 3 |

## 4. Technical Architecture and RISC-V-Specific Subsystems

NumPy has two internal SIMD abstraction layers.

**NPYV (NumPy Vector)**, the primary hand-tuned SIMD layer covering roughly 22 arithmetic/comparison/transcendental/reduction dispatch targets, has backends for SSE2/AVX2/AVX512 (x86), NEON/SVE (ARM), VSX (POWER), and LSX (LoongArch), but **no RVV backend**. There is no `numpy/_core/src/common/simd/rvv/` directory and no hand-written RVV intrinsic kernel file anywhere in the repository (a GitHub code search for `vfloat32m1_t` in numpy/numpy returned zero hits). `NPY_SIMD` evaluates to 0 on riscv64; every NPYV-dispatched kernel executes the scalar C fallback.

**CPU dispatcher (Meson-based)** defines feature-gated compilation units. For riscv64 the only defined feature is `RVV` (`-march=rv64gcv`, `meson_cpu/riscv64/meson.build`); no sub-extension (Zba, Zbb, Zbc, Zbs bitmanip, Zvl*) is referenced anywhere in the repo. Three dispatch targets actually use it:

| Dispatch Target | RVV Path | Implementation |
|----------------|----------|---------------|
| `loops_logical.dispatch.cpp` | Yes | Google Highway abstraction (`hwy/highway.h`); Highway emits RVV intrinsics when compiled with `-march=rv64gcv` |
| `loops_autovec.dispatch.c.src` | Yes | Scalar C compiled with `-march=rv64gcv`; relies on compiler auto-vectorization, not hand-written intrinsics |
| `_umath_tests.dispatch.c` | Yes | CPU dispatch introspection/test code only, not a computational kernel |

All other dispatch targets fall through to scalar C on riscv64.

**RVV runtime detection** uses the `riscv_hwprobe` syscall (`RISCV_HWPROBE_KEY_IMA_EXT_0` / `RISCV_HWPROBE_IMA_V`) when available, with a `getauxval(AT_HWCAP)` / `HWCAP_RISCV_V` (bit 21) fallback for older kernels, in `numpy/_core/src/common/npy_cpu_features.c`. This replaced a hwcap-only approach that could not distinguish pre-standard RVV v0.7 from ratified v1.0 (fixed in [PR #30338](https://github.com/numpy/numpy/pull/30338), merged May 29 2026, backported in [PR #31538](https://github.com/numpy/numpy/pull/31538)). Detection for other extensions (Zfh, Zvfh, Zba, Zbb) does not exist. `numpy/_core/tests/test_cpu_features.py` contains a functional `Test_RISCV_Features` class gated on `is_riscv = re.match(r"^(riscv)", machine, re.IGNORECASE)`.

**float16 / Zfh:** native half-precision scalar conversion via the Zfh extension is proposed in open, unreviewed [PR #30144](https://github.com/numpy/numpy/pull/30144) (opened Nov 2025).

**BLAS:** `numpy.linalg` requires an external BLAS/LAPACK backend. CI builds with `-Dallow-noblas=true` because no reliable BLAS is available in the QEMU/cross environment. scipy-openblas wheels exist for riscv64 ([PR #30763](https://github.com/numpy/numpy/pull/30763), merged Feb 2026), but a correctness regression on RVV-capable hardware causes incorrect results (see Section 11).

**FFT:** PocketFFT is vendored (pure C++ header-only); no riscv64-specific issues found in `mreineck/pocketfft`.

**Sort:** the x86-simd-sort backend is gated to `cpu_family in ['x86', 'x86_64']`; not compiled on riscv64. Generic sort is used.

**SVML:** Intel SVML (vectorized exp/log/sin via AVX-512) is gated to `linux and x86_64`; not compiled on riscv64.

**libmvec IFUNC dispatch:** on x86_64/aarch64, glibc's libmvec backs NumPy ufunc SIMD-vectorized math (exp, log, sin) via IFUNC dispatch. libmvec does not exist for riscv64 in Debian, Ubuntu, Fedora, or Arch. Five upstream RFC rounds (Apr 2024 to May 2026) have not been merged; the psABI name-mangling blocker was resolved 2026-06-18 but no glibc patch has been submitted since.

| Subsystem | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned SIMD (NPYV) | SSE2/AVX2/AVX512 | NEON/SVE | None (no backend) |
| SIMD arithmetic/transcendental dispatch | Yes | Yes | No (scalar C) |
| SIMD logical-loop dispatch | Yes | Yes | Partial (Highway, RVV) |
| SIMD sort | Yes | No | No |
| libmvec IFUNC math | Yes | Yes | No |
| float16 native scalar conversion | Yes | Yes | No (PR #30144 open) |
| Runtime feature detection granularity | ~30 features | ~8 features | 1 feature (RVV) |

## 5. Build System, Cross-Compilation, and Toolchain

NumPy builds with Meson via the `mesonpy` backend declared in `pyproject.toml`; there is no `CMakeLists.txt`, `go.mod`, or `Cargo.toml` anywhere in the tree.

**`pyproject.toml` build-system block** was read from two different live fetches with conflicting Cython minimums: one fetch (direct repo clone at commit `c44e705a`) shows `requires = ["meson-python>=0.20.0", "Cython>=3.1.0"]`; a separate research pass's dependency report states `Cython>=3.13.1`. This is a direct contradiction between two sources in this research and could not be reconciled; treat the exact minimum as [NEEDS VERIFICATION] and confirm against the live `pyproject.toml` before depending on either figure.

**Native riscv64 wheel build (CI method):** `pypa/cibuildwheel` pinned to v4.2.1, `CIBW_BUILD: cp312-manylinux_riscv64`, `manylinux-riscv64-image = "manylinux_2_39"` (set in `pyproject.toml`), run on the `ubuntu-24.04-riscv` self-hosted runner with Docker as the container engine and ccache for compilation caching.

**QEMU cross-compile + test (CI method):** cross-compiles on an x86_64 `ubuntu-22.04` host using `gcc-riscv64-linux-gnu` / `g++-riscv64-linux-gnu` / `gfortran-riscv64-linux-gnu` (whatever version Ubuntu 22.04's apt repos carry - no pinned/minimum version is specified anywhere in-repo), then runs inside a `riscv64/ubuntu:22.04` Docker container via `tonistiigi/binfmt:qemu-v9.2.2-52` userspace emulation. Exact build command:
```
spin build --clean -- -Dallow-noblas=true
```
Exact test command:
```
F90=/usr/bin/gfortran spin test -- --timeout=600 --durations=10 -k "test_kind or test_multiarray or test_simd or test_umath or test_ufunc"
```
The workflow file's own header comments flag two structural hurdles explicitly: "Meson's Python module doesn't support crosscompiling, and python dependencies may be another potential hurdle," and "There might also be a need to run runtime tests during configure time" - the recommended workaround is relying on Docker's x86_64 crosscompile toolchain with the rest emulated via binfmt. A separate friction point was the ninja binary itself needing to be symlinked from the host rather than installed fresh, fixed in [PR #27827](https://github.com/numpy/numpy/pull/27827) / [PR #27828](https://github.com/numpy/numpy/pull/27828) ("skip ninja installation in linux_qemu workflows").

**`-Dallow-noblas=true`** is the only riscv64-specific Meson flag used in CI, because no BLAS binary is reliably available in the QEMU/cross environment.

**RVV compile-time probe** (`numpy/_core/src/_simd/checks/cpu_rvv.c`): a ~5-line file testing `#ifndef __riscv_vector` / `#include <riscv_vector.h>`, used by `meson_cpu/riscv64/meson.build` to gate the `RVV` feature on `-march=rv64gcv` support.

**Toolchain requirements table:**

| Component | Minimum Version | Source |
|-----------|----------------|--------|
| Python | 3.12 | `pyproject.toml` (`requires-python = ">=3.12"`) |
| meson-python | 0.20.0 | `pyproject.toml` |
| Cython | 3.1.0 or 3.13.1 (sources disagree, see above) | `pyproject.toml` / dependency report |
| GCC cross (riscv64-linux-gnu) | Unpinned, whatever Ubuntu 22.04/24.04 ships | `linux_qemu.yml` |

No explicit GCC minimum is documented by NumPy for riscv64. Google Highway (the SIMD abstraction NumPy bundles for the `loops_logical` dispatch path) is reported elsewhere in this research to require either GCC 15+ or Clang 19+ for RVV runtime dispatch depending on the source (see Section 9 for the discrepancy); this creates an undocumented effective requirement for that one dispatch target.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Subsystem | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| NPYV hand-tuned SIMD backends | SSE2, AVX2, AVX512 | NEON, ASIMD, SVE | None |
| SIMD-dispatched arithmetic loops | Yes | Yes | No (scalar C) |
| SIMD-dispatched transcendental (exp, log, sin) | Yes (SVML + libmvec) | Yes (libmvec) | No |
| SIMD-dispatched logical loops | Yes | Yes | Partial (Highway, RVV) |
| SIMD sort | Yes (x86-simd-sort) | No | No |
| BLAS (numpy.linalg) | OpenBLAS / MKL / BLIS | OpenBLAS | Partial (OpenBLAS available but with a known RVV correctness regression; CI builds with `-Dallow-noblas=true`) |
| libmvec IFUNC math acceleration | Yes | Yes | No |
| float16 native scalar conversion | Yes | Yes | No (PR #30144 open) |
| Runtime CPU feature detection | ~30 features | ~8 features | 1 feature (RVV only) |
| PyPI binary wheels | Yes | Yes | No |
| CI on native hardware | Yes | Yes | Build only, no test step |
| Reliably-passing automated test suite | Yes | Yes | No - two open regressions (#32461, #32376) as of Aug 2026 |

The riscv64 port is functionally correct for ordinary scalar workloads but is not a performance-parity port: every vectorized kernel path available for amd64 and arm64 falls back to scalar C on riscv64, and the test suite currently has unresolved correctness failures specific to floating-point-exception handling (ceil/floor/trunc and floor-division). [Issue #32376](https://github.com/numpy/numpy/issues/32376) explicitly reports that the same tests passed on NumPy 2.3.2 on identical hardware, indicating a regression introduced between 2.3.2 and 2.4.x that has not yet been bisected or triaged by a maintainer.

**Performance context (not NumPy-specific):** an arXiv work-in-progress paper measured a 2.71x speedup offloading float64 128x128 matmul from a CVA6 rv64g host to an 8-core Snitch accelerator via OpenBLAS, with data-copy overhead accounting for 47% of runtime ([arXiv:2504.03677](https://arxiv.org/pdf/2504.03677)); a separate SG2042 64-core RISC-V characterization paper found 2.6x-16.7x single-core advantage over other RISC-V solutions on compute-bound HPC kernels (NASA NPB suite), weaker on memory-bound workloads ([arXiv:2406.12394](https://arxiv.org/pdf/2406.12394)). Neither paper reports NumPy-specific GFLOPS figures. No published benchmark comparing NumPy computational throughput directly between riscv64 and arm64/amd64 was found in any searched source; the only available performance data concerns build/install timing (Section 8).

## 7. CI/CD Infrastructure

NumPy has exactly two GitHub Actions workflow files referencing riscv (`.github/workflows/linux_riscv64.yml` and `.github/workflows/linux_qemu.yml`; confirmed via `grep -rn riscv .github/workflows/*.yml` against a clone of HEAD, commit `c44e705a`). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml`/`.cirrus.star` exist in the repo. riscv64 is **not** part of the main release `wheels.yml` build matrix.

**`linux_riscv64.yml` - native riscv64 wheel builder:**
- Runner: `ubuntu-24.04-riscv`, confirmed by NEP 57's text to be RISE-provided self-hosted hardware (Scaleway EM-RV1, per RISE's own blog post "RISE RISC-V Runners: six weeks in")
- Triggers: `push` to `main`, `pull_request` into `main`/`maintenance/**` (doc-paths ignored), `workflow_dispatch`
- Builds a single `cp312-manylinux_riscv64` wheel via cibuildwheel with ccache; **no test step** (`CIBW_TEST_COMMAND` is not set in this workflow for riscv64)
- Build timing from PR #31488 review: ~975s (16 min) cold cache, ~157s (2.6 min) hot cache
- Disabled on forks (`if: github.repository == 'numpy/numpy'`)

**`linux_qemu.yml` - QEMU cross-compile test:**
- Runner: `ubuntu-22.04` (x86_64 host), riscv64 target emulated via `tonistiigi/binfmt` + `docker run --platform=linux/riscv64` against `riscv64/ubuntu:22.04`
- Triggers: `pull_request` only (no `push`), plus `workflow_dispatch`
- Test filter: `test_kind or test_multiarray or test_simd or test_umath or test_ufunc`, `--timeout=600`
- `continue-on-error: true` - failures are non-blocking by construction
- As of Aug 2026, this is the job type surfacing [#32461](https://github.com/numpy/numpy/issues/32461) and [#32376](https://github.com/numpy/numpy/issues/32376) (though those were actually reported via conda-forge/EasyBuild riscv64 builds outside NumPy's own CI, not caught by `continue-on-error` masking)

**Key gap identified by gounthar during PR #31488 review:** testing on a real RVV-capable board (Banana Pi F3) surfaced 8 Cholesky-decomposition test failures traced to an upstream OpenBLAS regression ([OpenBLAS #5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811)); the RISE CI runners themselves lack RVV, so this class of bug is invisible to NumPy's own CI.

**Known hardware defect on RISE runners:** CI runs after PR #31488 merged produced intermittent crashes (`Fatal glibc error: pthread_mutex_lock.c:94 ... assertion failed: mutex->__data.__owner == 0`), attributed by luhenry to a hardware atomic-CAS bug on the runners [NEEDS VERIFICATION - single source: PR #31488 review comment].

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI | Yes | Yes | Yes (build only) |
| Emulated CI | N/A | N/A | Yes (QEMU, non-blocking) |
| Test step present | Yes | Yes | Only in the non-blocking QEMU job |
| CI result blocks merge/release | Yes | Yes | No |

## 8. Distribution and Release Status

| Channel | riscv64 Available | Version | Notes |
|---------|------------------|---------|-------|
| PyPI (`pip install numpy`) | No | N/A | Tracked in open [issue #30216](https://github.com/numpy/numpy/issues/30216); a direct PyPI JSON fetch in this research found no riscv64 wheel filenames, though that fetch is flagged low-confidence/possibly stale |
| RISE `wheel_builder` (GitLab) | Yes | 71 wheel files across 1.26.4, 2.0.0-2.0.2, 2.1.3, 2.2.0/2.2.2, 2.3.1/2.3.3/2.3.4, 2.4.2/2.4.3, 2.5.0-2.5.2 | Community index at [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/), e.g. `numpy-2.1.3-cp310-cp310-manylinux_2_35_riscv64.whl`; install via `--index-url https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple` |
| RISE `python-wheels` (GitHub, `riseproject-dev/python-wheels`) | Yes | release tag `numpy-v2.5.3-20260918074523` | Newer distribution channel, served via `pypi.riseproject.dev`; actively tracked (PR "numpy: Add version 2.5.3", issue "numpy-quaternion riscv64 support") |
| Debian sid/testing (`apt install python3-numpy`) | Yes | current | Standard Debian archive; autopkgtests pass on riscv64 |
| Ubuntu 24.04 noble | Yes | 1.26.4 | `python3-numpy` riscv64 `.deb` |
| Ubuntu 26.04 resolute | Yes | `1:2.3.5+ds-3ubuntu1` | Confirmed live via packages.ubuntu.com: architectures `amd64 arm64 armhf ppc64el riscv64 s390x`; `python3-numpy-dev` and related packages (`libboost-numpy*`, `numpy-stl`, `python3-numpy-groupies`, `python3-numpydoc`, `python3-numpysane`) also ship riscv64 |
| Arch Linux RISC-V (ISCAS mirror) | Yes | 2.4.6 | `python-numpy-2.4.6-1-riscv64.pkg.tar.zst` [NEEDS VERIFICATION - single source] |
| GitHub Releases | No | N/A | Release assets contain only source tarballs |

**PyPI riscv64 wheel publication blockers** (from [issue #30216](https://github.com/numpy/numpy/issues/30216)): (1) openblas-libs riscv64 wheels exist but build slowly and need optimization; (2) `actions/setup-python` lacks riscv64 support, forcing manual cibuildwheel/QEMU workarounds; (3) NumPy's own wheel-build workflows needed updating to add the riscv64 target - the third item is now substantially addressed by `linux_riscv64.yml` (PR #31488), but items (1) and (2) remain open.

**To get a working riscv64 NumPy binary today**, a user must either: install from the RISE wheel index (`pypi.riseproject.dev` or the GitLab `wheel_builder`), install the distro package (Debian sid, Ubuntu 24.04/26.04, Arch RISC-V), or build from source (RISE measured ~15-20 minutes on a VisionFive 2, vs. ~25 seconds to install a pre-built RISE wheel, a ~36-50x speedup; source: [RISE blog, 2025-05-14](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)).

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blockers |
|---|---|---|---|---|---|
| OpenBLAS | runtime-dependency, critical | Green: RISCV64_GENERIC, ZVL128B, ZVL256B, DYNAMIC_ARCH all build upstream | QEMU-only; LAPACK tests explicitly disabled in CI (`exit 0`, "take too long"); no native CI | Debian sid ships 0.3.33+ds-3 riscv64; Ubuntu 24.04 noble ships an older 0.3.26 (pre-DYNAMIC_ARCH) | TRSM has no RVV kernel for ZVL256B (unassigned correctness gap); DGEMM regression [OpenBLAS #5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811) (fix in PR #5815 merged but unreleased), surfaced in NumPy's own PR #31488 review as Cholesky test failures on a real RVV board; GEMM rewrite PR #5561 stalled since March 2026 |
| Highway | runtime-dependency, optional | Green: RVV 1.0 target compiles, vendored into NumPy for `loops_logical.dispatch.cpp` | Exercised in Highway's own upstream CI but with `continue-on-error: true` (build-only-gated in effect) | Ubuntu 26.04 resolute confirmed shipping `libhwy-dev`/`libhwy1t64` 1.3.0-2 for riscv64 (architectures: amd64, arm64, armhf, i386, ppc64el, riscv64, s390x); Debian sid/trixie too | Open mold-linker segfault on riscv64 ([Highway #2854](https://github.com/google/highway/issues/2854)); **discrepancy on toolchain requirement:** one source in this research states RVV runtime dispatch requires GCC 15+ (fixing a vnclipu mis-optimization, Highway PR #2971), another states it is Clang 19+ only with no GCC path - not reconciled, flag as [NEEDS VERIFICATION] |
| PocketFFT | runtime-dependency, optional | Green: pure C++ header-only, compiled as part of NumPy | N/A; 0 riscv-related issues found on `mreineck/pocketfft` | Always vendored with NumPy source | None found |
| libmvec | runtime-dependency, optional | N/A - not present on riscv64 in Debian, Ubuntu, Fedora, or Arch | N/A | Red: no riscv64 implementation exists anywhere | 5 upstream glibc RFC rounds since Apr 2024, none merged; psABI name-mangling blocker resolved Jun 18 2026, no glibc patch submitted since |
| Meson (meson-python backend) | build-dependency, critical | Green as a build tool, but the `linux_qemu.yml` workflow's own comments flag that "Meson's Python module doesn't support crosscompiling" as a structural hurdle worked around via Docker/binfmt | N/A | No riscv64-specific packaging issue found | Cross-compilation support gap noted in-repo, worked around rather than fixed |
| Ninja | build-dependency, critical | Green, but required an explicit workaround ([PR #27827](https://github.com/numpy/numpy/pull/27827)/[#27828](https://github.com/numpy/numpy/pull/27828), "skip ninja installation in linux_qemu workflows") because the cross-container's ninja had to be symlinked from the host rather than freshly installed | N/A | Standard Ubuntu riscv64 package | None outstanding |
| GCC (riscv64-linux-gnu cross toolchain) | build-dependency, critical | Green; no pinned/minimum version documented by NumPy - uses whichever `gcc-riscv64-linux-gnu`/`g++-riscv64-linux-gnu`/`gfortran-riscv64-linux-gnu` Ubuntu 22.04/24.04 apt ships | N/A | N/A | Undocumented minimum version is a latent risk for reproducibility |
| Cython | build-dependency, optional | Green: pure-Python wheel, no riscv64-specific build issue | No riscv64-specific test failures found | No prebuilt riscv64 binary wheel; [Cython #7646](https://github.com/cython/cython/issues/7646) "Build RISC-V wheels" closed as Not Planned (Apr 2026); pure-Python fallback install works | Non-blocking (functional via source install); minimum-version requirement in `pyproject.toml` is itself ambiguous between live sources (3.1.0 vs 3.13.1, see Section 5) |
| cibuildwheel | build-dependency, optional | Green: used directly in `linux_riscv64.yml`, pinned to v4.2.1; riscv64 support landed in cibuildwheel v3.1.2 per the discuss.python.org packaging thread | N/A | N/A | None found |
| pytest | test-dependency, critical | N/A (test runner, not compiled) | Runs the NumPy test suite via `spin test`/`numpy.test()`; the suite itself is where #32461/#32376 surface | N/A | The failures are in NumPy's own tests, not in pytest |
| LAPACK (netlib, bundled inside OpenBLAS) | indirect runtime-dependency | Bundled with OpenBLAS riscv64 builds | Not tested in OpenBLAS's riscv64 CI (explicitly skipped, times out under QEMU); correctness on riscv64 is unvalidated upstream | Ships as part of OpenBLAS riscv64 builds (Debian sid, Ubuntu 24.04) | Structural CI gap requiring native riscv64 hardware with RVV, not currently resolved; 0 riscv64 issues found on `Reference-LAPACK/lapack` directly |
| x86-simd-sort (vendored) | indirect, N/A on riscv64 | N/A - gated to `cpu_family in ['x86','x86_64']` in `meson.build`, never compiled on riscv64 | N/A | N/A | None, by design |
| Intel SVML (vendored) | indirect, N/A on riscv64 | N/A - gated to `linux and x86_64` | N/A | N/A | None, by design |

**Key takeaway:** NumPy's riscv64-critical dependency chain runs OpenBLAS (numerics, has a Tier-3-blocking correctness bug on RVV hardware) through Highway (SIMD, build-only-gated CI upstream but already packaged for Ubuntu 26.04 resolute riscv64) to PocketFFT/LAPACK/Cython (low risk, functional). No dependency in this chain has a JIT backend, crypto, compression, or custom allocator component.

## 10. Ecosystem Status

NumPy is not itself a plugin host, but it is the root dependency for the entire Python scientific/ML stack on riscv64 (SciPy, pandas, scikit-learn, PyTorch), and its riscv64 readiness is a direct gate on all of them. RISE's own infrastructure documentation describes NumPy as sitting "at the bottom of a very large dependency tree," calling native riscv64 CI integration for NumPy "a big lever" (RISE blog, ["RISE RISC-V Runners: six weeks in"](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/), 2026-05-12).

**RISE involvement is extensive and funded**, not incidental:
- RISE RFP **RP011 "Python Package Support for RISC-V riscv64"**, delivered by **BayLibre**, with development credited to **Rivos Inc. and BayLibre**; RISE funds the build machines.
- Two parallel RISE-run wheel distribution systems exist: the original GitLab `wheel_builder` (81 tracked packages including numpy, scipy, pandas, matplotlib, scipy-openblas32/64), and the newer GitHub-hosted `riseproject-dev/python-wheels` repository (created 2026-06-16, 801 open issues, serving `pypi.riseproject.dev`), which actively tracks NumPy releases (e.g. tag `numpy-v2.5.3-20260918074523`).
- NumPy's native CI integration (`numpy/numpy#30995` to `#31488`) runs on RISE's hosted runner fleet: 13,000+ jobs, 197 repos, 87 orgs, 99.78% completion rate as of a May 2026 report, climbing to 40,000+ relay events and ~3,900 builds by August 2026 (Scaleway EM-RV1 hardware).

**Downstream signal:** PyTorch 2.13.0 became available on riscv64 in August 2026 via the same RISE pipeline ([RISE blog](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)), explicitly naming NumPy as a foundational dependency ("almost everything else depends on it") and citing two of the NumPy PRs covered in this report (#31488, #31522) as the enabling milestones. Separately, CPython itself reached Tier 3 RISC-V support in August 2026, funded by the Sovereign Tech Agency's fellowship program and also running on RISE-donated hardware ([RISE blog](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)) - raising the floor for the entire interpreter stack NumPy builds on.

**Community packaging discussion:** a [discuss.python.org thread](https://discuss.python.org/t/packaging-support-for-riscv64/58475) (initiated July 2024 by Mark Ryan / RISE) documents that the general Python packaging toolchain gap for riscv64 is closed: manylinux_2_39_riscv64 and musllinux_1_2_riscv64 images exist, cibuildwheel supports riscv64 as of v3.1.2, PyPI/warehouse accepts riscv64 wheels, auditwheel 6.1.0 added riscv64 policy support, and uv/maturin publish riscv64 wheels. The remaining gap for NumPy's ecosystem reach is NumPy-specific (official PyPI wheels, Section 8), not toolchain-general.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#32376](https://github.com/numpy/numpy/issues/32376) | BUG: Failing test_unary_spurious_fpexception and test_floor_division_errors tests on RISC-V | Open, Aug 21 2026 | Correctness regression | 111 test failures building NumPy 2.4.5 for EasyBuild/SciPy-bundle; floating-point-exception handling on ceil/floor/trunc and floor-division. Same tests passed on NumPy 2.3.2 on identical hardware - a regression between 2.3.2 and 2.4.x that no maintainer has yet bisected or commented on |
| [#32461](https://github.com/numpy/numpy/issues/32461) | TST: test_unary_spurious_fpexception fails comprehensively on riscv | Open, Aug 30 2026 | Correctness regression | 76 failures, overlapping root cause with #32376; also includes CPU-feature-detection test failures and multithreading-deadlock test timeouts, plausibly emulator-slowness-related rather than a logic bug |
| OpenBLAS DGEMM/Cholesky correctness on RVV hardware | n/a (tracked as [OpenBLAS #5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811)) | Fix merged upstream (PR #5815), unreleased | Correctness regression | `numpy.linalg.cholesky` raises `LinAlgError` on mathematically valid positive-definite matrices on RVV VLEN=256 hardware (SpaceMiT K1, `riscv64_zvl256b` kernel path); non-RVV hardware (e.g. SiFive U74, `riscv64_generic`) unaffected; invisible to NumPy's own CI because RISE runners lack RVV |
| RVV v0.7 vs v1.0 misdetection | Fixed | [PR #30338](https://github.com/numpy/numpy/pull/30338) / [#31538](https://github.com/numpy/numpy/pull/31538) | Resolved correctness bug | hwcap alone could not distinguish pre-standard RVV v0.7/v0.7.1 from ratified v1.0, risking incorrect RVV code-path activation; fixed via `riscv_hwprobe`, merged into 2.5.0/2.6.0 |
| RISC-V ISA NaN canonicalization | n/a (architectural) | Permanent | Behavioral difference, not a bug | RISC-V ISA section 11.3 mandates a canonical (always-positive) NaN from many instructions; `-np.nan` does not preserve sign bit on riscv64. Accommodated via disabled subtests since [PR #25280](https://github.com/numpy/numpy/pull/25280) |
| Hardware atomic-CAS bug on RISE runners | Open | n/a | CI-infrastructure flakiness | Intermittent `pthread_mutex_lock` assertion failures post-#31488 merge, attributed to a hardware CAS defect on RISE runners [NEEDS VERIFICATION - single source] |
| [#30216](https://github.com/numpy/numpy/issues/30216) | ENH: Build and distribute manylinux wheels for riscv64 | Open, master tracking issue | Packaging gap | Zero comments as of last check; captures remaining PyPI-publication blockers |
| [#30144](https://github.com/numpy/numpy/pull/30144) | ENH: Enable native half-precision scalar conversion (Zfh) | Open PR | Feature gap | No reviewer assigned as of this research |
| [#30988](https://github.com/numpy/numpy/pull/30988) | TST: use getauxval to read AT_HWCAP in cpu feature tests | Open PR | Minor test fix | Awaiting review |
| [#26200](https://github.com/numpy/numpy/issues/26200) | ENH: Add RISC-V Vector V1.0 Support (full SIMD kernels) | Open, uncommented design question | Feature gap | Unresolved choice between extending NPYV directly vs. adopting NEP-054/Highway; no maintainer decision recorded |

The two correctness regressions (#32376, #32461) are the most urgent unresolved problem of the group: both center on `test_unary_spurious_fpexception`, both surfaced via third-party packaging builds (conda-forge, EasyBuild) rather than NumPy's own CI, and neither has been connected to the other or triaged by a maintainer as of this research.

## 12. Objections and Upstream Blockers

**Supply-chain policy blocks a near-term Tier 2 path.** Ralf Gommers stated explicitly during the PR #30995 review: "we don't want to use self-hosted runners or any caching on the `numpy-release` repo for supply chain security reasons." Publishing signed PyPI wheels from RISE-provided self-hosted runners requires resolving this policy constraint; `linux_riscv64.yml` lives on the main repo (not `numpy-release`), sidestepping the issue for CI artifact builds but not for the release pipeline.

**No credible native test signal exists.** `linux_riscv64.yml` builds wheels but has no test step; `linux_qemu.yml` tests but with `continue-on-error: true` and without OpenBLAS. The two open correctness regressions (#32376, #32461) demonstrate this gap concretely: they were caught by third-party downstream packagers, not by NumPy's own CI. Promoting past Tier 3 requires a release-blocking test signal from real riscv64 hardware, which does not currently exist.

**BLAS correctness risk blocks safe PyPI publication.** scipy-openblas riscv64 wheels carry a known DGEMM/Cholesky correctness regression on RVV hardware ([OpenBLAS #5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811)). Publishing riscv64 PyPI wheels that bundle a broken OpenBLAS would be a regression for users on RVV-capable hardware; this must be fixed and released upstream before wheel publication is safe.

**No hand-written SIMD kernels.** NPYV has no RVV backend; the only RVV-accelerated path (`loops_logical.dispatch.cpp`) is Highway-mediated and limited to logical ops. Building a full NPYV RVV backend is a substantial engineering investment, and issue #26200 shows the design direction (NPYV-native vs. Highway/NEP-054) has not even been decided.

**libmvec is unavailable on riscv64** independent of NumPy's own dispatch infrastructure, so element-wise transcendental math has no SIMD acceleration path at the math-library level on this architecture; five glibc RFC rounds since April 2024 have not produced a merge.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** RISE
- **Justification:** NumPy's native riscv64 CI (`.github/workflows/linux_riscv64.yml`, from merged [PR #31488](https://github.com/numpy/numpy/pull/31488)) builds manylinux wheels on real riscv64 hardware but has no test step, while its QEMU-based test job (`linux_qemu.yml`) is marked `continue-on-error: true` and, as of Aug 2026, is actively failing (open issues [#32461](https://github.com/numpy/numpy/issues/32461): ~76 failures; [#32376](https://github.com/numpy/numpy/issues/32376): 111 failures) - so the CI "build yes / test no reliably-passing" pattern applies, giving yellow rather than blue. No official PyPI riscv64 wheels exist (tracking issue [#30216](https://github.com/numpy/numpy/issues/30216), open); consumable riscv64 builds come instead from the RISE project's community wheel builder/`python-wheels` index (and separately from Debian/Ubuntu packaging), not from upstream.
- **Pending work that could change the grade:** open master tracking issue #30216 (PyPI riscv64 wheel publication, blocked on OpenBLAS wheel build speed, missing `actions/setup-python` riscv64 support, and wheel-script updates); two open correctness-test-failure issues (#32461, #32376) on riscv64 floating-point-exception handling; open, unreviewed PRs #30144 (Zfh float16) and #30988 (hwcap test fix); RISE is actively funding CI runners and wheel distribution (RP011/BayLibre/Rivos) with named NumPy riscv64 maintainers Ludovic Henry and Bruno Verachten, and NEP 57 lists RISC-V as Tier 3 with intent to reassess for a higher tier once CI stability improves.

## 14. Investment Analysis

Before sizing new work: RISE has already funded and delivered the native CI build pipeline (RP011/BayLibre/Rivos; PR #31488/#30995), the Tier 3 policy promotion (PR #31522), RVV CPU-feature detection and its v0.7/v1.0 fix (PR #26219, #30338/#31538), and two independent community wheel-distribution channels (`wheel_builder`, `python-wheels`). None of that work should be re-sized below.

### 14.1 Functional Enablement

Remaining gaps blocking official PyPI distribution: (1) the OpenBLAS DGEMM/Cholesky correctness regression on RVV hardware (fix merged upstream in OpenBLAS PR #5815 but unreleased - this is an OpenBLAS-side release task, not NumPy code); (2) `actions/setup-python` riscv64 support (upstream GitHub Actions dependency, outside NumPy's control); (3) NumPy wheel-build-script updates to formally add riscv64 to `wheels.yml` (low effort, given `linux_riscv64.yml` already proves the build works); (4) triage and fix the open #32376/#32461 regression, which first requires a maintainer to bisect NumPy 2.3.2 to 2.4.x.

### 14.2 Performance Optimization

NPYV has no RVV backend. A full NPYV RVV implementation (arithmetic, conversion, math, memory, misc, operator, reorder headers) is comparable in scope to the existing NEON/VSX backends - the highest-leverage single contribution for compute-heavy workloads, but a substantial undertaking, and issue #26200 shows the design approach (native NPYV vs. Highway/NEP-054) is still undecided. The Highway-backed `loops_logical` path provides limited vectorization (boolean ops only) and its toolchain requirement is itself unreconciled in current research (GCC 15+ vs. Clang 19+ only, see Section 9). PR #30144 (Zfh float16) is ready for review and would be a low-effort, narrow-scope performance gain.

### 14.3 CI/CD Infrastructure

Current state: wheel-build-only on native hardware, non-blocking test on QEMU, two unresolved correctness regressions surfaced only by third-party downstream builds. Closing this gap requires: adding a test step to `linux_riscv64.yml` (needs the `actions/setup-python` workaround or reuse of the QEMU workflow's install path); triaging/fixing #32376 and #32461; obtaining RVV-capable CI hardware to catch OpenBLAS-class regressions the current non-RVV RISE runners miss; and resolving or working around the reported hardware atomic-CAS flakiness.

### 14.4 Ecosystem Enablement

NumPy is the root dependency for SciPy, pandas, scikit-learn, and PyTorch riscv64 ports, and RISE's own materials describe it as the biggest single lever in their dependency tree. The RISE wheel-distribution channels demonstrate the port is technically consumable today; the remaining gap to unlock the full downstream ecosystem on official infrastructure is the OpenBLAS correctness fix plus the PyPI publication blockers in #30216.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix and release OpenBLAS DGEMM/Cholesky regression (PR #5815 follow-through) | 1-2 (release only, fix already merged upstream) | OpenBLAS maintainers | Critical |
| Functional | Triage/bisect and fix #32376 / #32461 (2.3.2 to 2.4.x regression) | 2-4 | NumPy riscv64 contacts | Critical |
| Functional | Resolve `actions/setup-python` riscv64 support | 1-2 | upstream GitHub Actions / NumPy | High |
| Functional | Update NumPy wheel-build scripts to add riscv64 to `wheels.yml` | 1 | NumPy riscv64 contacts | High |
| Functional | Review and merge PR #30144 (Zfh float16) and PR #30988 (hwcap test fix) | 0.5-1 | NumPy reviewer | Medium |
| CI/CD | Add a release-blocking test step to `linux_riscv64.yml` | 1-2 | NumPy riscv64 contacts | High |
| CI/CD | Obtain RVV-capable CI hardware for OpenBLAS/Cholesky validation | 4-8 | RISE / hardware partners | High |
| CI/CD | Diagnose/mitigate the hardware atomic-CAS flakiness on RISE runners | 1-2 | RISE infra team | Medium |
| Performance | Implement an NPYV RVV backend (arithmetic/conversion/math/memory/reorder) | 20-40 | RISC-V SIMD contributors | Medium |
| Performance | Resolve the GCC/Clang RVV toolchain-requirement discrepancy for Highway dispatch | 0.5 (investigation) | NumPy / Highway maintainers | Low |
| Performance | Contribute riscv64 libmvec to glibc (IFUNC vectorized math) | 8-16 | glibc / RISE | Medium |
| Ecosystem | Publish NumPy computational benchmarks for riscv64 vs arm64/amd64 | 1-2 | NumPy perf team | Low |

## 15. References

- [numpy/numpy Issue #30216 - ENH: Build and distribute manylinux wheels for riscv64](https://github.com/numpy/numpy/issues/30216)
- [numpy/numpy Issue #32461 - TST: test_unary_spurious_fpexception fails comprehensively on riscv](https://github.com/numpy/numpy/issues/32461)
- [numpy/numpy Issue #32376 - BUG: Failing test_unary_spurious_fpexception and test_floor_division_errors tests on RISC-V](https://github.com/numpy/numpy/issues/32376)
- [numpy/numpy Issue #26200 - ENH: Add RISC-V Vector V1.0 Support](https://github.com/numpy/numpy/issues/26200)
- [numpy/numpy Issue #8213 - Support for RISC-V architecture](https://github.com/numpy/numpy/issues/8213)
- [numpy/numpy PR #31800 - CI: move paths-ignore to pull_requests in the linux_riscv64 workflow](https://github.com/numpy/numpy/pull/31800)
- [numpy/numpy PR #31753 - TST: Fix failing riscv64 tests](https://github.com/numpy/numpy/pull/31753)
- [numpy/numpy PR #31522 - DOC/NEP: promote RISC-V to a Tier 3 platform in NEP 57](https://github.com/numpy/numpy/pull/31522)
- [numpy/numpy PR #31488 - CI: Add wheel building and testing on Linux-riscv64](https://github.com/numpy/numpy/pull/31488)
- [numpy/numpy PR #31538 - BUG: Avoid hwcap for RVV version detection (backport)](https://github.com/numpy/numpy/pull/31538)
- [numpy/numpy PR #30338 - BUG: Avoid hwcap for RVV version detection](https://github.com/numpy/numpy/pull/30338)
- [numpy/numpy PR #30995 - ENH: add riscv64 to the wheel build matrix](https://github.com/numpy/numpy/pull/30995)
- [numpy/numpy PR #30988 - TST: use getauxval to read AT_HWCAP in cpu feature tests](https://github.com/numpy/numpy/pull/30988)
- [numpy/numpy PR #30763 - MAINT: update scipy-openblas to one with RISC-V](https://github.com/numpy/numpy/pull/30763)
- [numpy/numpy PR #30144 - ENH: Enable native half-precision scalar conversion on RISC-V](https://github.com/numpy/numpy/pull/30144)
- [numpy/numpy PR #29992 - DOC: update SIMD build options to cover riscv64](https://github.com/numpy/numpy/pull/29992)
- [numpy/numpy PR #29927 - TST: Add unit test for RISC-V CPU features](https://github.com/numpy/numpy/pull/29927)
- [numpy/numpy PR #27827 - CI: skip ninja installation in linux_qemu workflows](https://github.com/numpy/numpy/pull/27827)
- [numpy/numpy PR #27613 - BUG: Fix Linux QEMU CI workflow](https://github.com/numpy/numpy/pull/27613)
- [numpy/numpy PR #26219 - ENH: Enable RVV CPU Feature Detection](https://github.com/numpy/numpy/pull/26219)
- [numpy/numpy PR #26187 - TST: Use platform.machine() for improved portability on riscv64](https://github.com/numpy/numpy/pull/26187)
- [numpy/numpy PR #25280 - TST: Fix fp_noncontiguous and fpclass on riscv64](https://github.com/numpy/numpy/pull/25280)
- [numpy/numpy PR #25246 - CI: Add CI test for riscv64](https://github.com/numpy/numpy/pull/25246)
- [numpy/numpy PR #17780 - ENH, BLD: Define RISCV-32 support](https://github.com/numpy/numpy/pull/17780)
- [numpy/numpy PR #13095 - BUG: Fix testsuite failures on ppc and riscv](https://github.com/numpy/numpy/pull/13095)
- [numpy/numpy PR #10833 - ENH: Add support for the 64-bit RISC-V architecture](https://github.com/numpy/numpy/pull/10833)
- [NEP 57 - NumPy platform support](https://numpy.org/neps/nep-0057-numpy-platform-support.html)
- [OpenMathLib/OpenBLAS Issue #5811 - DGEMM correctness regression on riscv64 RVV hardware](https://github.com/OpenMathLib/OpenBLAS/issues/5811)
- [google/highway Issue #2854 - mold linker segfault on riscv64](https://github.com/google/highway/issues/2854)
- [cython/cython Issue #7646 - Build RISC-V wheels (closed, Not Planned)](https://github.com/cython/cython/issues/7646)
- [RISE wheel_builder - package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE wheel_builder - NumPy package page](https://riseproject.gitlab.io/python/wheel_builder/packages/numpy.html)
- [riseproject-dev/python-wheels (GitHub)](https://github.com/riseproject-dev/python-wheels)
- [RISE blog - Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE blog - RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE blog - PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE blog - Python Now Officially Supports RISC-V](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [discuss.python.org - Packaging support for riscv64](https://discuss.python.org/t/packaging-support-for-riscv64/58475)
- [arXiv:2504.03677 - Accelerating Numpy With OpenBLAS For Open-Source RISC-V Chips](https://arxiv.org/pdf/2504.03677)
- [arXiv:2406.12394 - Performance characterisation of the 64-core SG2042 RISC-V CPU for HPC](https://arxiv.org/pdf/2406.12394)
- [Debian tracker - python3-numpy](https://tracker.debian.org/pkg/numpy)
- [Ubuntu packages - python3-numpy (resolute)](https://packages.ubuntu.com/search?keywords=NumPy&suite=resolute&searchon=names&section=all)