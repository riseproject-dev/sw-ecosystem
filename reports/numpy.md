---
title: NumPy
categories:
  - python-packages
  - ai-ml
---

# NumPy

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for NumPy<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items verified from only one source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

NumPy is the foundational numerical array library for the Python scientific computing stack. It is the direct dependency of SciPy, pandas, scikit-learn, PyTorch, and virtually every Python ML/data workload. It is a [NumFOCUS Sponsored Project](https://numfocus.org/) governed by a Steering Council. Active steering council members with named employers: Sebastian Berg (NVIDIA), Ralf Gommers (Quansight), Matti Picus (Quansight), Melissa Weber Mendonca (Quansight), Nathan Goldbaum (Quansight), Stefan van der Walt (UC Berkeley). Governance is consensus-driven; the Steering Council is a tiebreaker, not a corporate-controlled body.

Repository: [numpy/numpy](https://github.com/numpy/numpy). Latest stable release as of this writing: 2.4.6. Development target: 2.6.0 (the first release milestone that includes riscv64 CI).

---

## 2. Port History and Upstreaming Timeline

The RISC-V port has a seven-year history with three distinct phases: initial architecture recognition, test-suite correctness fixes, and the current infrastructure build-out phase.

| Date | PR / Issue | Event |
|------|-----------|-------|
| Oct 2016 | [Issue #8213](https://github.com/numpy/numpy/issues/8213) | First request for riscv64 support |
| Apr 2018 | [PR #10833](https://github.com/numpy/numpy/pull/10833) | Initial riscv64 support merged; full test suite passed on Python 2.7 and 3.6 with one noted exception (test_float in TestBoolCmp) |
| Mar 2019 | [PR #13095](https://github.com/numpy/numpy/pull/13095) | First riscv64-specific test fixes (f2py selectedrealkind, openSUSE Factory riscv64 build failures) |
| Nov 2023 | [PR #25246](https://github.com/numpy/numpy/pull/25246) | First riscv64 CI job added (markdryan); two tests disabled at the time |
| Dec 2023 | [PR #25280](https://github.com/numpy/numpy/pull/25280) | riscv64 NaN sign-preservation test accommodation (RISC-V ISA section 11.3 requires canonical positive NaN from many instructions) |
| Apr 2024 | [PR #26187](https://github.com/numpy/numpy/pull/26187) | Fix test failures on Arch Linux riscv64 (platform.processor() returns empty string; replaced with platform.machine()) |
| Apr 2024 | [PR #26219](https://github.com/numpy/numpy/pull/26219) | RVV compile-time and runtime CPU feature detection foundation merged |
| Sep 2024 | [PR #17780](https://github.com/numpy/numpy/pull/17780) | RISCV-32 architecture definitions added (PR had sat dormant since 2020, rebased after numpy/core moved to numpy/_core in NumPy 2.0) |
| Oct 2025 | [PR #29927](https://github.com/numpy/numpy/pull/29927) | Unit tests for RISC-V CPU feature detection merged; validated on Banana Pi BPI-F3 (SpaceMiT K1) |
| Oct 2025 | [PR #29992](https://github.com/numpy/numpy/pull/29992) | SIMD build option documentation for riscv64 merged |
| Nov 2025 | [Issue #30216](https://github.com/numpy/numpy/issues/30216) | Master tracking issue opened: build and distribute manylinux riscv64 wheels to PyPI |
| Feb 2026 | [PR #30763](https://github.com/numpy/numpy/pull/30763) | scipy-openblas updated to a version that includes RISC-V wheels |
| May 2026 | [PR #30338](https://github.com/numpy/numpy/pull/30338) | RVV version detection bug fixed: replaced hwcap (cannot distinguish RVV v0.7 from v1.0) with riscv_hwprobe; backported to 2.5.x in [PR #31538](https://github.com/numpy/numpy/pull/31538) |
| May 2026 | [PR #31488](https://github.com/numpy/numpy/pull/31488) | Native riscv64 wheel-build CI workflow added (RISE-provided runners, milestone 2.6.0) |
| May 2026 | [PR #31522](https://github.com/numpy/numpy/pull/31522) | RISC-V formally promoted to Tier 3 in NEP 57 |

First RISC-V code in the repository: March 6, 2019 (PR #13095, Andreas Schwab). First riscv64-targeted CI: November 30, 2023 (PR #25246, markdryan). Native CI infrastructure: May 27, 2026 (PR #31488, Ludovic Henry / RISE project).

---

## 3. Upstream Support Tier

NumPy uses a formal platform support policy defined in [NEP 57](https://numpy.org/neps/nep-0057-numpy-platform-support.html). As of May 30, 2026 (PR #31522), RISC-V riscv64 is **Tier 3**.

| Tier | PyPI Wheels | CI Blocks Release | Requirement |
|------|------------|-------------------|-------------|
| 1 | Yes | Yes | All maintainers responsible |
| 2 | Yes | Yes | At least one named maintainer, long-term commitment |
| 3 | No | Yes, with exceptions | At least one maintainer or trusted contributor |
| Unsupported | No | No | None |

The practical consequence of Tier 3 for riscv64:

- No commitment to publish riscv64 wheels to PyPI (open issue: [#30216](https://github.com/numpy/numpy/issues/30216)).
- CI runs on RISE-provided self-hosted runners via the `ubuntu-24.04-riscv` label.
- Named platform contacts: Ludovic Henry (luhenry) and Bruno Verachten (gounthar), both RISE-affiliated.
- Stated longer-term goal by luhenry is reaching Tier 2, which would require publishing riscv64 PyPI wheels.

**Contradictory claim on CI blocking:** The NEP 57 Tier 3 description states that CI failures "block releases." However, the actual `linux_qemu.yml` workflow file contains `continue-on-error: true` on the riscv64 job, which means QEMU-emulated riscv64 test failures are non-blocking. The native-hardware workflow (`linux_riscv64.yml`) has no test step and therefore cannot block a release on test failure. The claim that riscv64 CI failures block releases is not consistent with the workflow file contents as they exist.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

NumPy has two internal SIMD abstraction layers:

**NPYV (NumPy Vector)** is the primary hand-tuned SIMD layer used for ~22 arithmetic, comparison, transcendental, and reduction dispatch targets. Backends exist for SSE2/AVX2/AVX512 (x86), NEON/SVE (ARM), VSX (POWER), and LSX (LoongArch). There is **no RVV backend for NPYV.** There is no `numpy/_core/src/common/simd/rvv/` directory. `NPY_SIMD` evaluates to 0 on riscv64. All NPYV-dispatched kernels (addition, multiplication, exp, log, sin, floor, minimum, sort helpers, etc.) execute the scalar C fallback on RISC-V.

**CPU dispatcher (via Meson)** defines feature-gated compilation units that can be compiled with architecture-specific flags. For riscv64, the only defined feature is RVV (`-march=rv64gcv`). The dispatch infrastructure is operational. However, only three targets use it:

| Dispatch Target | RVV Path | Implementation |
|----------------|----------|---------------|
| `loops_logical.dispatch.cpp` | Yes | Google Highway abstraction (`hwy/highway.h`); Highway emits RVV intrinsics when compiled with `-march=rv64gcv` |
| `loops_autovec.dispatch.c.src` | Yes | Scalar C with `UNARY_LOOP_FAST`/`BINARY_LOOP_FAST` macros compiled with `-march=rv64gcv`; relies on compiler auto-vectorization, not hand-written intrinsics |
| `_umath_tests.dispatch.c` | Yes | CPU dispatch infrastructure test/introspection code only; not a computational kernel |

All other dispatch targets (~22 covering arithmetic, trigonometric, exponential, hyperbolic, comparison, reduction, type conversion) have no RVV implementation and fall through to scalar C.

**RVV runtime detection** is functional as of PR #30338 (merged May 29, 2026). Detection uses the `riscv_hwprobe` syscall checking `RISCV_HWPROBE_KEY_IMA_EXT_0 | RISCV_HWPROBE_IMA_V`, which unambiguously signals RVV 1.0 (Linux 6.5+). Fallback to `getauxval(AT_HWCAP)` with `COMPAT_HWCAP_ISA_V` is retained for kernels older than Linux 6.4. Detection for other extensions (Zfh, Zvfh, Zba, Zbb, etc.) does not exist.

**float16 / Zfh:** Native half-precision scalar conversion using the Zfh extension was proposed in [PR #30144](https://github.com/numpy/numpy/pull/30144) (November 2025, author: Wang Yang / ixgbe). The PR is open with no reviewers assigned as of June 2026.

**BLAS:** NumPy's linear algebra (`numpy.linalg`) requires an external BLAS/LAPACK backend. On riscv64, the only available option requires the Meson flag `-Dallow-noblas=true`, which disables the BLAS requirement and uses slow internal fallback routines. scipy-openblas wheels exist for riscv64 (PR #30763, February 2026), but a correctness regression in OpenBLAS 0.3.33 on RVV-capable hardware (SpaceMiT K1 / `riscv64_zvl256b` kernel path) causes `numpy.linalg.cholesky` to raise `LinAlgError` on mathematically valid inputs. See Section 11.

**FFT:** PocketFFT is vendored (pure C++ header-only). No riscv64-specific issues found.

**Sort:** The x86-simd-sort backend is explicitly gated to `cpu_family in ['x86', 'x86_64']` in `meson.build` and is not compiled on riscv64. Generic sort is used.

**SVML:** Intel SVML (vectorized exp/log/sin via AVX-512) is gated to `linux and x86_64`. Not compiled on riscv64.

**libmvec IFUNC dispatch:** On x86_64 and aarch64, glibc's libmvec provides SIMD-vectorized math functions (exp, log, sin, etc.) that NumPy ufuncs invoke via GCC SIMD clone / IFUNC dispatch, delivering 2-4x throughput for element-wise math operations. libmvec does not exist for riscv64 in any current distribution (Debian, Ubuntu, Fedora, Arch Linux RISC-V all confirmed absent). Five RFC rounds for riscv64 libmvec have been submitted between April 2024 and May 2026 with none merged upstream. The psABI name mangling blocker was resolved June 18, 2026 ([PR #455](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/pull/455)) but no new glibc patch has been submitted as of this writing. The practical impact is that element-wise math (`np.exp`, `np.log`, `np.sin`) on riscv64 runs without SIMD acceleration at the math library level.

---

## 5. Build System, Cross-Compilation, and Toolchain

NumPy uses Meson as its build system (`mesonpy` backend). There is no CMakeLists.txt.

**For cross-compilation (official CI method -- QEMU):**

The QEMU CI workflow cross-compiles on an x86_64 Ubuntu 22.04 host using the `gcc-riscv64-linux-gnu` toolchain, then runs compiled binaries inside a `riscv64/ubuntu:22.04` Docker container via QEMU binfmt emulation (QEMU version pinned to `tonistiigi/binfmt:qemu-v9.2.2-52`). The cross-compiler binaries are symlinked from the host into the container.

Key Meson option required for riscv64:
```
-Dallow-noblas=true
```
This bypasses the BLAS dependency because no BLAS binary is available in the QEMU environment.

**For cross-compilation using a Meson cross file (distro method):**
```ini
[properties]
longdouble_format = 'IEEE_DOUBLE_LE'

[host_machine]
system = 'linux'
cpu_family = 'riscv64'
cpu = 'riscv64'
endian = 'little'
```
The `longdouble_format` must be set explicitly because the build system normally detects it by running a compiled binary, which fails in a cross-compilation context without QEMU. On riscv64, `long double` is 64-bit IEEE double (same as `double`), unlike x86_64's 80-bit extended format.

**RVV compile-time detection probe** (`numpy/_core/src/_simd/checks/cpu_rvv.c`): checks for `<riscv_vector.h>`, `vuint32m1_t`, `__riscv_vadd_vv_u32m1`, and `__riscv_vsetvlmax_e32m1`. If the compiler does not support RVV (or if `-march=rv64gcv` is not passed), RVV is silently disabled.

**Required tool versions** (from `pyproject.toml` and `requirements/build_requirements.txt`):

| Component | Minimum Version |
|-----------|----------------|
| Python | 3.12 |
| meson-python | 0.20.0 (build_requirements.txt) |
| Cython | 3.2.5 (build_requirements.txt) |
| GCC cross (riscv64-linux-gnu) | Ubuntu 22.04 default (GCC 11); no explicit minimum documented |

No explicit GCC minimum version is documented for riscv64 by NumPy. However, Google Highway (the SIMD abstraction layer NumPy bundles) requires GCC 15+ for correct RVV codegen; earlier GCC versions had a vnclipu mis-optimization (fixed in Highway [PR #2971](https://github.com/google/highway/pull/2971)). This creates an undocumented effective requirement for the Highway-backed dispatch targets.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Subsystem | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| NPYV hand-tuned SIMD backends | SSE2, AVX2, AVX512 (F/CD/BW/DQ/VNNI) | NEON, ASIMD, SVE | None |
| SIMD-dispatched arithmetic loops | Yes | Yes | No (scalar C) |
| SIMD-dispatched transcendental (exp, log, sin) | Yes (SVML + libmvec) | Yes (libmvec) | No |
| SIMD-dispatched logical loops | Yes | Yes | Partial (Google Highway, runtime dispatch requires Clang 19+ or GCC 15+) |
| SIMD sort | Yes (x86-simd-sort) | No (generic sort) | No (generic sort) |
| BLAS (numpy.linalg) | OpenBLAS / MKL / BLIS | OpenBLAS | Partial (OpenBLAS available but has RVV correctness regression; CI runs with -Dallow-noblas=true) |
| libmvec IFUNC math acceleration | Yes | Yes | No |
| float16 native scalar conversion | Yes | Yes | No (PR #30144 open, unreviewed) |
| Runtime CPU feature detection | ~30 features (SSE through AMX) | ~8 features (NEON through SVE2) | 1 feature (RVV only) |
| PyPI binary wheels | Yes | Yes | No |
| CI on native hardware | Yes | Yes | Build only (no test step) |

The riscv64 implementation is a functional port with correct scalar execution. It is not a performance-parity port. Every vectorized kernel path that exists for amd64 and arm64 falls back to scalar C on riscv64.

---

## 7. CI/CD Infrastructure

NumPy has two workflow files with riscv64 content.

**`linux_riscv64.yml` -- Native riscv64 wheel builder**

- Runner: `ubuntu-24.04-riscv` (GitHub-hosted label; [NEEDS VERIFICATION] that these are RISE-provided hardware vs. GitHub's own riscv64 runner fleet -- the workflow file only specifies the label, not the hardware owner)
- Triggers: push to `main` (path-filtered), `pull_request` to `main` or `maintenance/**`, `workflow_dispatch`
- What it does: builds a single `cp312-manylinux_riscv64` wheel using `cibuildwheel` with ccache
- What it does NOT do: there is no `CIBW_TEST_COMMAND`, no test step, no pytest invocation; the job is named "Build wheel" only
- Build timing measured during PR #31488 review: approximately 975s (~16 min) cold cache, 157s (~2.6 min) hot cache
- Cache saved only on pushes to `main`; PRs restore but do not save
- Disabled on forks (`if: github.repository == 'numpy/numpy'`)

**`linux_qemu.yml` -- QEMU cross-compilation test**

- Runner: `ubuntu-22.04` (x86_64 host)
- Triggers: `pull_request` to `main` or `maintenance/**`, `workflow_dispatch` -- does NOT trigger on push to `main`
- Architecture: `riscv64/ubuntu:22.04` container via QEMU binfmt emulation
- Cross-compiler: `gcc-riscv64-linux-gnu` installed on x86_64 host, symlinked into container
- Meson options: `-Dallow-noblas=true` -- tests run without OpenBLAS
- Test filter: `test_kind or test_multiarray or test_simd or test_umath or test_ufunc` with `--timeout=600`
- `continue-on-error: true` -- failures are non-blocking for PRs and releases

**Key gap identified by gounthar in PR #31488 review:** "OpenBLAS's RVV kernels stay untested in this CI, so a regression like [#5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811) wouldn't get caught here." The RISE runners used by `linux_riscv64.yml` lack RVV capability, and QEMU CI runs without OpenBLAS entirely. There is no CI path that tests OpenBLAS RVV kernels under NumPy.

**Known hardware defect on RISE runners:** After PR #31488 merged, CI produced crashes with:
> "Fatal glibc error: pthread_mutex_lock.c:94 (___pthread_mutex_lock): assertion failed: mutex->__data.__owner == 0"

Ludovic Henry identified the root cause as a hardware bug in the atomic CAS implementation on the runners (a CAS can report success when it did not succeed). Estimated occurrence: 2-4 times per week across approximately 400-500 daily jobs [NEEDS VERIFICATION -- single source: luhenry comment in PR #31488].

---

## 8. Distribution and Release Status

| Channel | riscv64 Available | Version | Notes |
|---------|------------------|---------|-------|
| PyPI (`pip install numpy`) | No | N/A | Exhaustive API enumeration of all 72 files in the 2.4.6 release confirms zero riscv64 entries; this holds across all historical releases |
| [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) | Yes | 2.4.3 (latest as of June 2026) | Community index; install via `pip install numpy --index-url https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple` |
| Debian sid (`apt install python3-numpy`) | Yes | 2.4.6 | Standard Debian archive; autopkgtests pass on riscv64; migration to testing blocked by regressions in reverse-dependencies, not in NumPy itself |
| Ubuntu 24.04 noble | Yes | 1.26.4 | `python3-numpy` riscv64 `.deb` available via apt |
| Arch Linux RISC-V | Yes | 2.4.6 | `python-numpy-2.4.6-1-riscv64.pkg.tar.zst` confirmed at ISCAS mirror [NEEDS VERIFICATION -- single source: ISCAS mirror directory listing] |
| GitHub Releases | No | N/A | GitHub release assets contain only source tarballs; wheels are distributed exclusively via PyPI |

**PyPI riscv64 wheel publication blockers** (from [issue #30216](https://github.com/numpy/numpy/issues/30216)):
1. openblas-libs riscv64 wheels exist but are described as "slow"; speed investigation ongoing
2. `actions/setup-python` lacks riscv64 support
3. NumPy's wheel-build scripts require updates for riscv64 targets

**First planned riscv64 PyPI wheel:** NumPy 2.6.0 (development target). This is not yet released; the most recent pre-release is 2.5.0rc1 (which does not include riscv64 wheels).

**RISE wheel builder details:** The RISE project (funded as RP011, Rivos Inc. origin, Baylibre co-maintainer) has distributed riscv64 manylinux wheels for over a year. Available NumPy versions: 1.26.4, 2.0.0 through 2.0.2, 2.1.3, 2.2.0, 2.2.2, 2.3.1, 2.3.3, 2.3.4, 2.4.2, 2.4.3. Formats: manylinux_2_35 and manylinux_2_39 for riscv64. Python versions: 3.10 through 3.13 (including free-threaded cp313t, cp314t for recent versions). Install time from RISE wheels vs. building from source on VisionFive 2: approximately 25 seconds vs. 15 minutes (36x speedup).

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blockers |
|-----------|------|--------------|-------------|----------------|---------|
| OpenBLAS (via scipy-openblas) | numpy.linalg, matrix multiply | Green: RISCV64_GENERIC, ZVL128B, ZVL256B, DYNAMIC_ARCH all build | Partial: BLAS L1/L2/L3 tested under QEMU; LAPACK tests disabled (time out under emulation); no native CI | Green for source; no upstream binary | (1) DGEMM correctness regression on ZVL256B / SpaceMiT K1 (OpenBLAS #5811, fix in PR #5815 merged but unreleased); (2) TRSM has no RVV kernel for ZVL256B; (3) GEMM rewrite (PR #5561) stalled since Mar 2026 |
| Google Highway (vendored) | SIMD ufuncs via abstraction layer | Green: RVV 1.0 target compiles | Partial: tested via QEMU; open test failure HwyDemoteTestGroup/TestAllReorderDemote2To/EMU128 on riscv64/gcc15 | Green: vendored in NumPy source | (1) Runtime dispatch requires Clang 19+ or GCC 15+; older toolchains fall back silently to scalar; (2) Linker bug with mold on riscv64 |
| x86-simd-sort (vendored) | SIMD sort | N/A -- gated to x86/x86_64 in meson.build | N/A | N/A | None; by design |
| Intel SVML (vendored) | AVX-512 vectorized math | N/A -- gated to linux/x86_64 in meson.build | N/A | N/A | None; by design |
| PocketFFT (vendored) | numpy.fft | Green: pure C++ header-only | Green: no riscv64-specific issues found | Green: always vendored | None |
| glibc libmvec | IFUNC vectorized math (exp, log, sin) | N/A -- not present for riscv64 | N/A | Red: not available in any distribution on riscv64 | Five upstream RFC rounds (Apr 2024 - May 2026) with no merge; psABI name mangling resolved Jun 18 2026 but no new patch submitted |
| Cython | Build tool | Green: pure-Python wheel available | Green: no riscv64-specific failures | Partial: no prebuilt riscv64 binary wheel; [issue #7646](https://github.com/cython/cython/issues/7646) closed as "Not planned" (May 2026); pure-Python fallback is functional | No blocking functional issue |

---

## 10. Ecosystem Status

**RISE Project involvement:** RISE (RISC-V Software Ecosystem) is a Linux Foundation project. Relevant to NumPy: RISE RP011 ("Python Package Support for RISC-V riscv64") funds the wheel_builder infrastructure (Rivos Inc. origin, Baylibre co-maintainer). RISE provides native riscv64 GitHub Actions runners (used by `linux_riscv64.yml`). Ludovic Henry and Bruno Verachten (both RISE-affiliated) are the named NumPy riscv64 platform maintainers. NumPy is not a RISE member organization.

RISE Premier Members include: Andes Technology, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Damo Academy (Alibaba), Tenstorrent. General Members include: BOSC, ByteDance, Canonical, ISCAS, SpaceMIT, ZTE, and others.

**NumPy as a dependency bottleneck:** The RISE RP011 project documentation notes that NumPy "sits at the bottom of a very large dependency tree." NumPy 2.0 migration was documented as requiring a full week to make available via the wheel_builder, even though a prior version had already been distributed [NEEDS VERIFICATION -- single source: RISE RP011 wiki page].

**Community packaging discussion:** [discuss.python.org thread](https://discuss.python.org/t/packaging-support-for-riscv64/58475) (initiated July 2024 by Mark Ryan / RISE) documents that the full Python packaging toolchain for riscv64 is now unblocked: manylinux_2_39_riscv64 and musllinux_1_2_riscv64 images exist, cibuildwheel supports riscv64 as of v3.1.2, PyPI/warehouse accepts riscv64 wheels, auditwheel 6.1.0 added riscv64 policy support, and uv/maturin have published riscv64 wheels to PyPI. The infrastructure gap that remains is NumPy-specific, not toolchain-general.

**Compute performance benchmarks:** No published benchmark comparing NumPy computational throughput (matrix multiply, FFT, ufunc speed) between riscv64 and x86_64 or aarch64 was found in any searched source. The only published performance data is build/install timing.

---

## 11. Known Bugs and Active Issues

**OpenBLAS DGEMM correctness regression on RVV hardware**

Symptom: `numpy.linalg.cholesky` raises `LinAlgError("Matrix is not positive definite")` on matrices that are mathematically positive definite. Reproduction: compute `A^T @ A` on a 50x50 random float64 matrix; the minimum eigenvalue is approximately -2.779 on affected hardware (far outside floating-point rounding error). Affects hardware with RVV VLEN=256, specifically SpaceMiT K1 (dispatched to `riscv64_zvl256b` kernel in OpenBLAS DYNAMIC_ARCH). Hardware without RVV (e.g., SiFive U74, dispatched to `riscv64_generic`) is not affected. Regression is between OpenBLAS 0.3.31 (working) and 0.3.33 (broken). Filed as [OpenMathLib/OpenBLAS#5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811); fix submitted as OpenBLAS PR #5815 (merged but unreleased as of this research). This bug is invisible to NumPy's CI because the RISE runners lack RVV capability.

**RVV version detection bug (fixed in NumPy 2.5.0 and 2.6.0)**

Linux `hwcap` (`HWCAP_RISCV_V`) cannot distinguish pre-standard RVV v0.7/v0.7.1 from ratified RVV v1.0. NumPy was using hwcap, meaning it could incorrectly activate RVV 1.0 code paths on v0.7 hardware, potentially producing wrong results or crashes. Fixed in [PR #30338](https://github.com/numpy/numpy/pull/30338) (merged May 29, 2026, milestone 2.6.0) and backported in [PR #31538](https://github.com/numpy/numpy/pull/31538) (merged May 30, 2026, milestone 2.5.0). The fix uses `riscv_hwprobe` with `RISCV_HWPROBE_KEY_IMA_EXT_0 | RISCV_HWPROBE_IMA_V` (Linux 6.5+), retaining hwcap as a fallback for kernels older than Linux 6.4.

**RISC-V ISA NaN canonicalization (permanent architectural difference)**

The RISC-V ISA (section 11.3) requires many instructions to return a canonical NaN, which is always positive. This means `-np.nan` does not preserve its sign bit after passing through certain hardware operations on riscv64. NumPy accommodates this by disabling sign-preservation subtests for negative NaNs on riscv64 ([PR #25280](https://github.com/numpy/numpy/pull/25280), merged December 2023). Code that relies on `-np.nan` sign semantics will behave differently on RISC-V compared to x86_64 or aarch64. This is a permanent architectural constraint, not a NumPy bug.

**Hardware atomic CAS bug on RISE runners**

The RISE CI runners have a hardware defect where a compare-and-swap operation can report success when it did not succeed, causing intermittent glibc pthread_mutex_lock assertion failures. Estimated rate: 2-4 CI crashes per week across approximately 400-500 daily jobs [NEEDS VERIFICATION -- single source: luhenry comment in PR #31488]. This creates false-negative CI signal.

**Open PRs requiring action:**

| PR | Title | Status | Opened | Blocker |
|----|-------|--------|--------|---------|
| [#30144](https://github.com/numpy/numpy/pull/30144) | ENH: Enable native half-precision scalar conversion via Zfh | Open | Nov 2025 | No reviewer assigned |
| [#30988](https://github.com/numpy/numpy/pull/30988) | TST: use getauxval to read AT_HWCAP in cpu feature tests | Open | Mar 2026 | Awaiting review |
| [#26300](https://github.com/numpy/numpy/pull/26300) | TST: Add CPU dispatch test for RVV extension | Open, stalled | Apr 2024 | Unrelated free-threading CI failure blocking progress |
| [Issue #30216](https://github.com/numpy/numpy/issues/30216) | ENH: Build and distribute manylinux wheels for riscv64 | Open | Nov 2025 | openblas-libs performance, actions/setup-python lack of riscv64 support, wheel build script updates |

---

## 12. Objections and Upstream Blockers

**Supply chain policy blocks Tier 2 path.** Ralf Gommers stated explicitly during PR #30995 review: "we don't want to use self-hosted runners or any caching on the `numpy-release` repo for supply chain security reasons." Publishing PyPI wheels from self-hosted (RISE-provided) runners requires resolving this policy constraint. The current `linux_riscv64.yml` workflow is on the main repo, not `numpy-release`, so it avoids this for CI artifact builds, but the policy applies to the release signing and upload pipeline.

**No BLAS on riscv64 without correctness risk.** scipy-openblas wheels exist for riscv64 but carry a known correctness regression (OpenBLAS #5811) on RVV hardware. CI for NumPy runs without OpenBLAS (`-Dallow-noblas=true`). Publishing riscv64 PyPI wheels that bundle a broken OpenBLAS would constitute a regression for users on RVV-capable hardware. This must be resolved at the OpenBLAS level before riscv64 wheel publication is viable.

**CI does not run tests on native hardware.** The `linux_riscv64.yml` workflow builds wheels but has no test step. Test execution happens only under QEMU (`linux_qemu.yml`), which runs with `continue-on-error: true` and without OpenBLAS. Promoting to Tier 2 requires a credible test signal from native hardware, which does not currently exist.

**No hand-written SIMD kernels.** The NPYV layer (used for performance-critical arithmetic, comparison, and math dispatch) has no RVV backend. Implementing a complete NPYV RVV backend is a significant engineering investment. The two dispatch targets that do use RVV rely on Google Highway (a portable abstraction) and compiler auto-vectorization, neither of which delivers the per-operation tuning that the hand-written x86/ARM backends provide.

**libmvec is not available on riscv64.** Without libmvec, element-wise math operations (`np.exp`, `np.log`, `np.sin`) on riscv64 execute without SIMD acceleration at the math library level. This gap exists independently of NumPy's own SIMD dispatch infrastructure. Five upstream glibc RFC rounds since April 2024 have not produced a merged implementation.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

NumPy runs correctly on riscv64 for scalar workloads. The port is functional enough that RISE has distributed tested manylinux wheels for over a year. The remaining functional gaps that block official PyPI distribution:

- OpenBLAS DGEMM correctness on RVV hardware (requires fix in OpenBLAS, not NumPy)
- `actions/setup-python` riscv64 support (requires fix in the `actions/setup-python` GitHub Action)
- Wheel build script updates (NumPy-side work, estimated low effort given the CI workflow already builds wheels)

### 13.2 Performance Optimization

The NPYV layer has no RVV backend. Implementing a complete NPYV RVV backend would require implementing eight or more header files covering arithmetic, conversion, math, memory, misc, operators, and reorder operations -- comparable in scope to the existing NEON or VSX backends. This is the highest-leverage single contribution for computation-heavy workloads but is a substantial engineering undertaking. There are no published NumPy computational benchmarks for riscv64 to quantify the current scalar performance gap.

The Highway-backed `loops_logical` dispatch target provides some vectorization for boolean operations, but coverage is limited to that one file. Highway runtime dispatch requires Clang 19+ or GCC 15+ on riscv64; toolchains below these versions silently fall back to scalar [NEEDS VERIFICATION for the specific version thresholds -- single source: Highway project PR #2968 and #2971 summaries in the research findings].

float16 (Zfh) support (PR #30144) is ready for review and would provide a low-effort performance gain for applications using half-precision on compatible hardware.

### 13.3 CI/CD Infrastructure

Current CI state: wheel-build-only on native hardware, non-blocking tests on QEMU. The gap between this and a credible Tier 2 CI posture:

- Add a test step to `linux_riscv64.yml` (requires resolving the `actions/setup-python` gap or using a workaround already available from the QEMU CI workflow)
- Resolve the hardware atomic CAS bug or use alternative hardware for release-blocking CI
- Add CI coverage for OpenBLAS RVV correctness -- requires RVV-capable hardware, which the current RISE runners do not provide

### 13.4 Ecosystem Enablement

NumPy is the root dependency for SciPy, pandas, scikit-learn, and PyTorch riscv64 ports. Publishing riscv64 wheels to PyPI unblocks all of these. The RISE wheel_builder demonstrates this is technically achievable; the remaining gap is the OpenBLAS correctness issue and the upstream policy/supply-chain constraints.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|---------|
| Functional | Fix OpenBLAS DGEMM regression on ZVL256B (OpenBLAS PR #5815 follow-through) | 2-4 | OpenBLAS maintainers | Critical |
| Functional | Resolve actions/setup-python riscv64 support | 1-2 | upstream Actions / NumPy | Critical |
| Functional | Update NumPy wheel build scripts for riscv64 | 1 | NumPy riscv64 contacts | High |
| Functional | Review and merge PR #30144 (Zfh float16 scalar conversion) | 1-2 | NumPy reviewer + ixgbe | Medium |
| CI/CD | Add test step to linux_riscv64.yml (native hardware test run) | 1-2 | NumPy riscv64 contacts | High |
| CI/CD | Obtain RVV-capable CI hardware for OpenBLAS kernel validation | 4-8 | RISE / hardware partners | High |
| Performance | Implement NPYV RVV backend (rv, rvv/, full arithmetic/conversion/math) | 20-40 | RISC-V SIMD contributors | Medium |
| Performance | Contribute riscv64 libmvec to glibc (IFUNC vectorized math) | 8-16 | glibc / RISE | Medium |
| Performance | Publish NumPy computational benchmarks for riscv64 vs arm64/amd64 | 1-2 | NumPy perf team | Low |
| Ecosystem | Merge PR #30988 (getauxval test fix) | 0.5 | NumPy reviewer | Low |
| Ecosystem | Close PR #26300 (RVV dispatch test, stalled since 2024) | 1 | NumPy reviewer | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [numpy/numpy Issue #30216 -- ENH: Build and distribute manylinux wheels for riscv64](https://github.com/numpy/numpy/issues/30216)
- [numpy/numpy PR #31522 -- DOC/NEP: promote RISC-V to a Tier 3 platform in NEP 57](https://github.com/numpy/numpy/pull/31522)
- [numpy/numpy PR #31488 -- CI: Add wheel building and testing on Linux-riscv64](https://github.com/numpy/numpy/pull/31488)
- [numpy/numpy PR #31538 -- BUG: Avoid hwcap for RVV version detection (backport)](https://github.com/numpy/numpy/pull/31538)
- [numpy/numpy PR #30338 -- BUG: Avoid hwcap for RVV version detection](https://github.com/numpy/numpy/pull/30338)
- [numpy/numpy PR #30995 -- ENH: add riscv64 to the wheel build matrix (closed)](https://github.com/numpy/numpy/pull/30995)
- [numpy/numpy PR #30988 -- TST: use getauxval to read AT_HWCAP in cpu feature tests](https://github.com/numpy/numpy/pull/30988)
- [numpy/numpy PR #30763 -- MAINT: update scipy-openblas to one with RISC-V](https://github.com/numpy/numpy/pull/30763)
- [numpy/numpy PR #30144 -- ENH: Enable native half-precision scalar conversion on RISC-V](https://github.com/numpy/numpy/pull/30144)
- [numpy/numpy PR #29992 -- DOC: update SIMD build options to cover riscv64](https://github.com/numpy/numpy/pull/29992)
- [numpy/numpy PR #29927 -- TST: Add unit test for RISC-V CPU features](https://github.com/numpy/numpy/pull/29927)
- [numpy/numpy PR #26300 -- TST: Add CPU Dispatch test for RVV extension](https://github.com/numpy/numpy/pull/26300)
- [numpy/numpy PR #26219 -- ENH: Enable RVV CPU Feature Detection](https://github.com/numpy/numpy/pull/26219)
- [numpy/numpy PR #26187 -- TST: Use platform.machine() for improved portability on riscv64](https://github.com/numpy/numpy/pull/26187)
- [numpy/numpy PR #25280 -- TST: Fix fp_noncontiguous and fpclass on riscv64](https://github.com/numpy/numpy/pull/25280)
- [numpy/numpy PR #25246 -- CI: Add CI test for riscv64](https://github.com/numpy/numpy/pull/25246)
- [numpy/numpy PR #17780 -- ENH, BLD: Define RISCV-32 support](https://github.com/numpy/numpy/pull/17780)
- [numpy/numpy PR #13095 -- BUG: Fix testsuite failures on ppc and riscv](https://github.com/numpy/numpy/pull/13095)
- [numpy/numpy PR #10833 -- ENH: Add support for the 64-bit RISC-V architecture](https://github.com/numpy/numpy/pull/10833)
- [numpy/numpy Issue #8213 -- Support for RISC-V architecture](https://github.com/numpy/numpy/issues/8213)
- [NEP 57 -- NumPy platform support](https://numpy.org/neps/nep-0057-numpy-platform-support.html)
- [OpenMathLib/OpenBLAS Issue #5811 -- DGEMM correctness regression on riscv64 RVV hardware](https://github.com/OpenMathLib/OpenBLAS/issues/5811)
- [RISE wheel builder -- NumPy package page](https://riseproject.gitlab.io/python/wheel_builder/packages/numpy.html)
- [RISE Project RP011 -- Python Package Support for RISC-V riscv64](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/75628548/)
- [RISE blog -- Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE blog -- RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [discuss.python.org -- Packaging support for riscv64](https://discuss.python.org/t/packaging-support-for-riscv64/58475)
- [Debian tracker -- python3-numpy](https://tracker.debian.org/pkg/numpy)