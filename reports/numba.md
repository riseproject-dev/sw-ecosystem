---
title: numba
categories:
  - ai-ml
  - python-packages
---

# numba

**Author:** Ludovic HENRY \<ludovic.henry@qti.qualcomm.com\><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for numba<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Numba is an open-source JIT compiler for Python that translates a subset of Python and NumPy code to optimized machine code using LLVM as its backend. The primary use case is accelerating numerical array operations via `@jit`-decorated Python functions, with additional support for GPU kernels via CUDA (`@cuda.jit`) and parallel CPU execution.

**Governance:** Numba uses a de facto maintainer model. There is no formal steering committee or published governance document. The project is sponsored by Anaconda, Inc., which employs at least one core maintainer and owns the private build and test infrastructure. Historical funders listed on the project website include DARPA, the Moore Foundation, Intel, NVIDIA, and AMD.

**Key corporate maintainers (from CODEOWNERS and GitHub profiles):**

- @gmarkall (Graham Markall) -- NVIDIA; owns `/numba/cuda/`
- @esc -- Anaconda Inc.; owns build farm, ASV profiling, Typed.List
- @sklam (Siu Kwan Lam) -- affiliation not publicly stated; owns core type inference, bytecode, NRT, JIT classes; general fallback maintainer
- @stuartarchibald (Stuart Archibald) -- affiliation not stated; owns compiler pipeline, ARM/BSD/Linux/ROCm
- @DrTodd13 (Todd A. Anderson) -- Intel geography (Hillsboro, OR); owns parallel accelerator (parfors), stencils

Build and test infrastructure runs on Anaconda's private farm, meaning any new architecture support requires Anaconda's active involvement.

**Community posture on new ports:** Passive. RISC-V requests are labeled `ISA: RISC-V` and `feature_request`, left open with no assignee or milestone, and duplicate reports are closed as duplicates rather than triaged. No roadmap entry for riscv64 exists.

Numba is not a RISE Project member and is not listed on [riseproject.dev](https://riseproject.dev).

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2020-12-09 | [numba/numba issue #6559](https://github.com/numba/numba/issues/6559) filed: build failure on openSUSE riscv64 hardware using LLVM 11.0.0. Root failure is in llvmlite's `custom_passes.cpp` and `transforms.cpp`, not numba itself. Issue labeled `ISA: RISC-V`, `feature_request`, `llvm`. No assignee. | [Issue #6559](https://github.com/numba/numba/issues/6559) |
| 2021-11-23 | [llvmlite PR #775](https://github.com/numba/llvmlite/issues/775) merged into llvmlite 0.38.0: adds `abiname` parameter to `create_target_machine()` enabling hard-float RISC-V (e.g., `ilp32d` ABI). Validated by M-Labs ARTIQ on FPGA VexRiscv hardware. This is cross-compilation support, not native riscv64 JIT. | llvmlite PR #775 |
| 2021-11-25 | [llvmlite PR #797](https://github.com/numba/llvmlite/issues/797) merged into llvmlite 0.38.0: makes RISC-V cross-compilation ABI tests optional to unblock non-RISC-V CI. | llvmlite PR #797 |
| 2023-03-18 | [llvmlite issue #923](https://github.com/numba/llvmlite/issues/923) filed by Debian maintainer: riscv64 native JIT crashes with `LLVM ERROR: Unsupported code model for lowering`. JIT warns: "This target JIT is not designed for the host you are running." No maintainer response. Open as of research date. | [llvmlite issue #923](https://github.com/numba/llvmlite/issues/923) |
| 2025-12-21 | [numba/numba issue #10389](https://github.com/numba/numba/issues/10389) filed: user on Spacemit riscv64 device running third-party builds (numba 0.62.1, llvmlite 0.43.0) hits same `LLVM ERROR: Unsupported code model for lowering`. Official PyPI install (no riscv64 wheel exists) also fails. | [Issue #10389](https://github.com/numba/numba/issues/10389) |
| 2025-12-22 | Issue #10389 closed as duplicate of #6559. No fix provided. | [Issue #10389](https://github.com/numba/numba/issues/10389) |

**Summary:** No riscv64 code has ever been committed to numba/numba. Zero PRs with RISC-V content exist. The only riscv64-adjacent work is in llvmlite (cross-compilation test scaffolding, 2021), which does not address native JIT execution. The port does not exist.

---

## 3. Upstream Support Tier

**Officially supported platforms (from the numba installing page):**

- Tier 1 (fully supported, prebuilt binaries): Linux x86_64, Linux arm64/aarch64, Windows 10+ 64-bit, macOS 11.0+ (M1/Arm64), ARMv8 64-bit (NVIDIA Jetson)
- Unofficial/community support: Linux ppc64le (POWER8/9), BSD
- riscv64: not listed, no tier assignment

No formal tier policy document is accessible (the expected URL returns 404) [NEEDS VERIFICATION that a tier policy document exists].

**Comparison: amd64 vs arm64 vs riscv64**

| Property | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Official tier | Tier 1 | Tier 1 | None |
| PyPI wheels | Yes | Yes | No |
| conda-forge packages | Yes | Yes | No |
| CI coverage | Full (native) | Full (native, ubuntu-24.04-arm) | None |
| Release-blocking tests | Yes | Yes | No |
| JIT execution | Functional | Functional | Crashes (code model error) |
| Prebuilt binaries | Yes | Yes | No |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Numba's compilation pipeline: Python bytecode -> Numba IR -> LLVM IR (via llvmlite) -> native machine code. Every step after Numba IR is handled by llvmlite and LLVM. There is no separate assembler, GC, or runtime library outside this path.

**JIT compilation**

The entire JIT backend is LLVM-based via llvmlite. LLVM's RISC-V backend has been in the default target set since LLVM 11 (2020), so RISCV IR can be compiled in principle. The blocking issue is in llvmlite's `targets.cpp`, which selects `CodeModel::Large` for all 64-bit targets via a generic pointer-size branch (`if (bits == 4) cm = Small; else cm = Large`). The RISC-V LLVM backend does not support the Large code model, producing `LLVM ERROR: Unsupported code model for lowering` and aborting. This prevents any user code from executing.

The fix required (not yet contributed to any PR or branch): change the 64-bit code model selection in `targets.cpp` to use `CodeModel::Medium` (or `Small`) for riscv64, analogous to the existing x86/PowerPC special cases in numba's `codegen.py`.

**SIMD / vector dispatch**

numba has no SIMD dispatch layer of its own for CPU targets. On x86_64, it optionally uses Intel SVML for vectorized transcendental functions (`sin`, `cos`, `exp`, `log`). No SVML equivalent exists for RISC-V (SVML is x86-only; Intel has no RISC-V SVML). On riscv64, transcendental functions would fall back to scalar `libm` calls. No SLEEF integration exists in numba. No RVV intrinsics (`vfloat32m1_t`, RVV builtins) appear anywhere in the numba source tree.

**Architecture-specific code in numba (inventory)**

- `numba/core/codegen.py`: explicit handling for x86 and ppc relocation models only. riscv64 falls into `'default'`.
- `numba/core/cpu.py`: explicit s390x branch and 32-bit architecture branch. No riscv64 branch.
- `numba/core/config.py`: `_os_supports_avx()` returns `True` for all non-x86 platforms, including riscv64 -- this is a silent incorrect default [NEEDS VERIFICATION of actual runtime impact on riscv64].
- No riscv64 `.S` assembly files. No `arch/riscv/` directory. No `#ifdef __riscv` guards.

**Comparison per component: amd64 vs arm64 vs riscv64**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT code generation | Functional | Functional | Crashes (code model) |
| AVX/SIMD vectorization | Hand-tuned (SVML optional) | Delegates to LLVM | No path (SVML N/A, no RVV) |
| Transcendental math (JIT) | SVML or scalar | Scalar (LLVM fast-math) | Scalar (if JIT were fixed) |
| AOT compilation | Functional | Functional | Untested |
| GPU (CUDA) | Functional (NVIDIA) | Functional (NVIDIA) | Not applicable |
| Architecture-specific code | Yes (codegen, config) | None needed | None (no special handling) |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Numba itself** uses Python `setuptools`/`build`. There is no `CMakeLists.txt` in numba/numba. C extensions compile via setuptools with no architecture-specific flags.

```
python setup.py build_ext --inplace
# or
python -m build --wheel --no-isolation
```

**The dependency chain that must be built for riscv64:**

1. Build LLVM 22.x with RISCV target (included in `LLVM_ALL_TARGETS` by default since LLVM 11; no explicit flag needed)
2. Build llvmlite 0.48.x against that LLVM installation
3. Build numba 0.65.x against llvmlite

**llvmlite build environment variables:**

| Variable | Effect |
|---|---|
| `CMAKE_PREFIX_PATH` | Path to `LLVMConfig.cmake` |
| `LLVMLITE_SHARED` | Non-zero: link dynamically against LLVM |
| `LLVMLITE_LTO` | Set to 0 to disable LTO (workaround for GCC bugs) |
| `LLVMLITE_SKIP_LLVM_VERSION_CHECK` | Allow unsupported LLVM versions |
| `LLVMLITE_CXX_STATIC_LINK` | Static libstdc++ linking (non-Darwin) |

**Required LLVM version:** 22.x.x (for llvmlite 0.48.x / numba 0.65.x).

**RISC-V-specific API (llvmlite `targets.py`):** The `abiname` parameter is required for hard-float RISC-V target machines (added llvmlite 0.38.0):

```python
machine = target.create_target_machine(
    features="+m,+a,+f,+d",
    reloc="pic",
    codemodel="default",
    abiname="lp64d"   # required for riscv64 hard-float
)
```

**QEMU:** No QEMU configuration exists in the numba or llvmlite build systems. No riscv64 Dockerfiles exist in either repository.

**Known build failures on riscv64:**

1. **llvmlite JIT crash (blocker):** Even with a successful build, llvmlite's JIT engine crashes on riscv64 with `LLVM ERROR: Unsupported code model for lowering` ([llvmlite issue #923](https://github.com/numba/llvmlite/issues/923), open March 2023). The build completes; the runtime execution fails.
2. **Original llvmlite source build failures (LLVM 11, 2020):** `custom_passes.cpp` version guard (`#error Invalid LLVM version/LLVM_VERSION_MAJOR not defined`) fired on openSUSE riscv64, blocking compilation entirely. This may be resolved in later LLVM versions but has not been confirmed by any maintainer.
3. **Third-party Spacemit builds:** A Spacemit-built llvmlite 0.43.0 + numba 0.62.1 installs successfully but crashes at runtime with the same code model error ([issue #10389](https://github.com/numba/numba/issues/10389)).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `@jit` (nopython mode) | Functional | Functional | Non-functional (JIT crash) |
| `@vectorize` | Functional | Functional | Non-functional |
| `@guvectorize` | Functional | Functional | Non-functional |
| `@stencil` | Functional | Functional | Non-functional |
| `@cuda.jit` | Functional (NVIDIA GPU required) | Functional (NVIDIA GPU) | Non-functional |
| Object mode JIT | Functional | Functional | Non-functional |
| AOT compilation | Functional | Functional | Untested |
| Parallel execution (`parallel=True`) | Functional | Functional | Non-functional |
| SVML transcendentals | Optional (present) | Not available | Not available |
| NumPy ufunc lowering | Functional | Functional | Non-functional |
| scipy.special lowering | Functional | Functional | Non-functional |

**Functional gaps:** All JIT-dependent features are non-functional on riscv64. This is the entire primary use case of numba. No subset of functionality works.

**Performance gaps (relative to amd64, assuming JIT were fixed):**

- Transcendental math (`sin`, `cos`, `exp`, `log`): SVML provides significant acceleration on x86_64. No equivalent exists for riscv64. Scalar `libm` fallback expected. Estimated 2x-10x slower for vectorized math workloads (from research finding; no benchmark measured on riscv64 because no functional runtime exists).
- SIMD vectorization: No RVV backend in numba. LLVM auto-vectorization would be the only path. Quality relative to amd64 AVX2/AVX-512 is unknown but expected to be lower for non-trivial kernels.
- General LLVM-level optimizations: RISE Project RP009 (Igalia, May 2025, SpacemiT-X60, SPEC CPU 2017) reports up to 15% reduction in SPEC execution time from scheduling model and SLP vectorizer improvements in LLVM. This would benefit numba once JIT is functional, but no numba-specific benchmark exists.

**Security hardening gaps:** Data not available: no search was conducted for CFI, stack canaries, or shadow stack enablement specific to numba on riscv64.

**Floating-point semantics:** No riscv64-specific floating-point issues were documented in the research findings. The `_os_supports_avx()` function in `config.py` returning `True` on riscv64 is a silent incorrect default whose runtime impact on floating-point behavior has not been characterized.

---

## 7. CI/CD Infrastructure

**riscv64 CI: None.**

All 14 workflow files under `.github/workflows/` were read and confirmed to contain no riscv64 reference. A repository-wide code search for "riscv", "risc-v", and "RISCV" returned 0 results. `.gitlab-ci.yml` does not exist in the repo (404). `Jenkinsfile` and `.cirrus.yml` contain no riscv64 content.

**CI matrix (actual):**

| Workflow file | Platforms tested |
|---|---|
| `numba_linux-64_conda_builder.yml` | linux x86_64 |
| `numba_linux-64_wheel_builder.yml` | linux x86_64 |
| `numba_linux-aarch64_conda_builder.yml` | linux aarch64 (native, ubuntu-24.04-arm) |
| `numba_linux-aarch64_wheel_builder.yml` | linux aarch64 (native, ubuntu-24.04-arm) |
| `numba_osx-arm64_conda_builder.yml` | macOS arm64 |
| `numba_osx-arm64_wheel_builder.yml` | macOS arm64 |
| `numba_win-64_conda_builder.yml` | Windows x86_64 |
| `numba_win-64_wheel_builder.yml` | Windows x86_64 |
| `numba_win-arm64_conda_builder.yml` | Windows arm64 |
| `numba_win-arm64_wheel_builder.yml` | Windows arm64 |

**Comparison: amd64 vs arm64 vs riscv64**

| Property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes | Yes | No |
| CI type | Native (ubuntu-24.04) | Native (ubuntu-24.04-arm) | None |
| QEMU emulation | N/A | N/A | None |
| Test failures block release | Yes | Yes | N/A |
| RISE runners used | No | No | No |

---

## 8. Distribution and Release Status

**PyPI (numba 0.65.1):** 24 wheels published. Platforms: `manylinux2014_x86_64`, `manylinux_2_17_x86_64`, `manylinux_2_27_aarch64`, `manylinux_2_28_aarch64`, `macosx_12_0_arm64`, `win_amd64`. Python versions: cp310 through cp314t. No riscv64 wheel. One source tarball (`numba-0.65.1.tar.gz`) is available for source builds.

**GitHub Releases:** No binary assets attached to any release (empty assets arrays for all 5 most recent releases: 0.65.1, 0.65.0, 0.64.0, 0.63.1, 0.63.0).

**conda-forge:** No `linux-riscv64` numba package. A full enumeration of conda-forge numba files found no riscv64 entry.

**Debian:** numba 0.65.1+dfsg-3 exists in Debian sid. The riscv64 build status is "Build-Attempted" / "uncompiled" on builder rv-osuosl-02 (approximately 25 days before the research date). The build fails with a test timeout in `numba.tests.test_array_reductions.TestArrayReductions.test_nanpercentile_basic`. All other architectures (amd64, arm64, ppc64el) are "Installed". The package is not installable on riscv64.

**Ubuntu 24.04 (noble):** numba is not packaged in Ubuntu 24.04. No `python3-numba` package exists in noble.

**RISE wheel builder:** The RISE GitLab wheel builder index for numba redirects to upstream PyPI. numba is absent from the RISE wheel builder's 77-package riscv64 index. llvmlite is also absent.

**Arch Linux RISC-V:** No `python-numba` entry found via the Arch RISC-V mirror search interface.

**What a user must do to get a working binary on riscv64:** There is currently no path to a working binary. Source builds fail at the llvmlite JIT execution level (code model error). The Spacemit third-party wheel installs but crashes at runtime. No workaround is documented in any upstream issue.

---

## 9. Dependencies

**Summary table**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Status |
|---|---|---|---|---|---|
| llvmlite | Core JIT backend (hard dependency) | Builds from source (LLVM RISCV target included by default) | Crashes at JIT execution ([issue #923](https://github.com/numba/llvmlite/issues/923)) | No PyPI wheel | Critical blocker |
| numpy | Array object and dtype system (hard dependency) | Builds from source | QEMU CI (non-blocking); native CI no test step | No PyPI wheel (milestone: 2.6.0) | Available with effort |
| scipy | linalg and scipy.special lowering (optional) | Builds from source with difficulty | No riscv64 CI; known LAPACK ABI errors | No PyPI wheel | Broken |
| cffi | CFFI binding calls inside JIT functions (optional) | Builds from source (libffi supports riscv64) | No riscv64 CI | No PyPI wheel (PR #234 open) | In progress |
| oneTBB | TBB threading backend (optional) | Builds from source (cmake/toolchains/riscv64.cmake since v2021.10.0) | No riscv64 CI | No binary release | Source-buildable |
| Intel SVML | Vectorized transcendentals (optional, x86-only) | Not applicable | Not applicable | Not applicable | x86-only; no RISC-V path |
| OpenBLAS (via scipy) | BLAS/LAPACK for linalg | Functional (RVV 1.0 kernels since 0.3.28) | QEMU only | No standalone PyPI wheel | Functional |
| LLVM (via llvmlite) | JIT code generation backend | Included in llvmlite build; RISCV target default since LLVM 11 | MCJIT code model fails riscv64; JITLink/ORC rates riscv64 ELF "Good" | Build dependency only | Partial (ORC may work; MCJIT broken) |

**llvmlite (critical path, deep dive)**

llvmlite is numba's only JIT dependency and the primary blocker. The failure chain:

1. `llvmlite/ffi/targets.cpp` selects `CodeModel::Large` for all 64-bit targets via a generic pointer-size check.
2. The LLVM RISC-V backend does not support `CodeModel::Large`.
3. Result: `LLVM ERROR: Unsupported code model for lowering` + abort on any riscv64 host.

This failure occurs before any user code executes. It is documented in [llvmlite issue #923](https://github.com/numba/llvmlite/issues/923) (open March 2023, no maintainer response). The fix requires changing `targets.cpp` to use `CodeModel::Medium` or `CodeModel::Small` for riscv64. This change does not exist in any PR or branch.

llvmlite merges for RISC-V in 2021 (PR #775 `abiname` parameter, PR #797 optional cross-compilation tests) address riscv32 ABI and test scaffolding only; they do not fix riscv64 native JIT.

LLVM ORC/JITLink rates riscv64 ELF as "Good" per LLVM documentation. If llvmlite's JIT engine could be configured to use ORC/JITLink rather than MCJIT for riscv64, the code model issue might be bypassed. This has not been attempted or documented upstream.

**numpy**

Builds and tests pass. QEMU-based CI since November 2023 ([PR #25246](https://github.com/numpy/numpy/pull/25246)); native CI since May 2026 ([PR #31488](https://github.com/numpy/numpy/pull/31488), RISE runners). No riscv64 PyPI wheels yet (open issue [#30216](https://github.com/numpy/numpy/issues/30216), milestone 2.6.0). No NPYV/RVV SIMD backend (scalar fallback). Promoted to Tier 3 (NEP 57, May 2026, PR #31522). Source build works.

**scipy**

Cross-compilation is the standard path for riscv64 ([issue #19378](https://github.com/scipy/scipy/issues/19378), open since October 2023). No riscv64 CI. Known LAPACK ABI error on riscv64 hardware ([issue #20423](https://github.com/scipy/scipy/issues/20423), closed "not planned"). No riscv64 PyPI wheels. For numba, scipy is an optional dependency; its absence disables `numba.np.linalg.*` and `scipy.special` lowerings only.

---

## 11. Known Bugs and Active Issues

| ID | Title | State | Severity | Notes |
|---|---|---|---|---|
| [numba #6559](https://github.com/numba/numba/issues/6559) | RISC-V Support | Open (since 2020-12-09) | Critical | Master tracking issue. Original failure: llvmlite `custom_passes.cpp` build error on openSUSE riscv64 + LLVM 11. No assignee, no linked PRs, no milestone. 5.5 years open. |
| [numba #10389](https://github.com/numba/numba/issues/10389) | About RISC-V | Closed as duplicate (2025-12-22) | Critical | Spacemit riscv64 device, numba 0.62.1 + llvmlite 0.43.0 (third-party Spacemit mirror). Runtime crash: `LLVM ERROR: Unsupported code model for lowering`. Official PyPI install fails (no riscv64 wheel; build from source fails due to missing system tools). |
| [llvmlite #923](https://github.com/numba/llvmlite/issues/923) | Does llvmlite support riscv64? | Open (since 2023-03-18) | Critical (root cause) | Debian riscv64 package build crashes: `LLVM ERROR: Unsupported code model for lowering` (exit code 134). `WARNING: This target JIT is not designed for the host you are running`. Filed by Debian developer who offered riscv64 hardware access; no maintainer response. |
| [llvmlite #785](https://github.com/numba/llvmlite/issues/785) | Wheels built with RISC-V support | Closed (March 2023) | Medium | Request for llvmlite PyPI wheels with RISC-V cross-compilation target. Closed without a merge; ARTIQ project maintains a private fork with riscv LLVM target. |
| [llvmlite #797](https://github.com/numba/llvmlite/issues/797) | Make RISCV cross-compile tests optional | Merged (v0.38.0, Nov 2021) | Informational | Makes riscv32 cross-compilation tests optional. Does not address riscv64 native JIT. |
| [llvmlite #775](https://github.com/numba/llvmlite/issues/775) | Add ABIName for RISC-V hard float targets | Merged (v0.38.0, Nov 2021) | Informational | Adds `abiname` to `create_target_machine()` for hard-float riscv32. Validated on FPGA VexRiscv. riscv64 native JIT not addressed. |

**Correctness bugs:** The `_os_supports_avx()` function in `numba/core/config.py` returns `True` for riscv64, which is incorrect. Downstream impact on correctness has not been documented.

The Debian test timeout for `test_nanpercentile_basic` on riscv64 suggests that even if the JIT code model issue were fixed, correctness or performance problems remain in the test suite. However, this may be a symptom of the JIT being partially operational rather than a separate bug.

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. **llvmlite JIT code model (hardest blocker):** `targets.cpp` selects `CodeModel::Large` for 64-bit; RISC-V LLVM backend rejects it. Fix is a one-line change in llvmlite but requires a maintainer who understands the LLVM JIT code model implications for riscv64. No PR exists. The fix must land in llvmlite before any numba work is meaningful.

2. **No riscv64 llvmlite PyPI wheel:** Even after fixing the code model, the wheel build pipeline must be extended to include riscv64. This requires either RISE runners or QEMU, CI changes in llvmlite, and coordination with PyPI manylinux policy.

3. **No riscv64 numba PyPI wheel:** Follows from llvmlite; same infrastructure requirements.

4. **SVML absence:** Intel SVML is permanently unavailable on riscv64. Vectorized transcendental performance will be structurally lower than x86_64. No mitigation (SLEEF integration, RVV intrinsics in numba) has been designed.

**Organizational blockers:**

1. **Anaconda build farm dependency:** New architecture support requires Anaconda's active involvement. Anaconda has not publicly committed to riscv64 for numba.

2. **Maintainer bandwidth:** The core maintainers are employed by NVIDIA (CUDA focus), Anaconda (infrastructure), and Intel (parallel accelerator). None of these organizations has a stated riscv64 numba priority.

3. **RISE non-involvement:** RISE has not funded numba or llvmlite riscv64 work. Neither package appears in the RISE wheel builder's 77-package index. There is no RISE blog post mentioning numba. RISE does fund numpy (native CI runners since May 2026) but has not extended that to numba.

**Acceptance probability:** Low in the near term without external sponsorship. The llvmlite fix is technically small but the maintainer review bar for JIT code model changes is high. The wheel infrastructure work is moderate. Full functional support requires both llvmlite and numba maintainer engagement plus build farm additions.

---

## 13. Investment Analysis

RISE has not funded any numba or llvmlite riscv64 work. All items below are unaddressed.

### 13.1 Functional Enablement

The minimum viable path to a functional numba on riscv64:

1. **Fix llvmlite `targets.cpp` code model selection for riscv64.** One-line change: detect riscv64 target triple and select `CodeModel::Medium` instead of `CodeModel::Large`. Requires understanding LLVM JIT code model constraints for RISC-V and verifying that the medium code model covers the memory layout expected by llvmlite's memory manager. The change must be upstreamed to llvmlite/numba/llvmlite; it cannot live in a downstream fork if official wheels are the goal.

2. **Add riscv64 CI to llvmlite.** Without CI, any fix will regress. Options: QEMU (slower, available now) or RISE native runners (faster, pending RISE engagement).

3. **Publish riscv64 llvmlite wheels on PyPI.** Requires manylinux_2_35 or later riscv64 runner support, which RISE has established for other packages. Coordination with the llvmlite wheel builder pipeline.

4. **Fix numba `config.py` `_os_supports_avx()` false return on riscv64.** Small correctness fix; impact is uncertain but the current behavior is wrong.

5. **Add riscv64 CI to numba.** Once llvmlite wheels exist, add a `numba_linux-riscv64_wheel_builder.yml` workflow. RISE runner or QEMU.

6. **Publish riscv64 numba wheels on PyPI.** Follows from steps 1-5.

### 13.2 Performance Optimization

Performance work is premature until functional enablement is complete. Once functional:

1. **RVV vectorization via LLVM auto-vectorization:** No numba-specific work needed if LLVM's auto-vectorizer handles RVV. Verify that `parallel=True` produces RVV instructions on V-extension hardware. Audit effort.

2. **SLEEF integration for transcendental math:** numba currently uses SVML on x86_64 for `sin`, `cos`, `exp`, `log` in `@vectorize`. SLEEF provides portable SIMD math including RVV. Integrating SLEEF as a fallback for non-x86 targets is a medium-scope project with no existing design in the numba codebase.

3. **Benchmark suite on riscv64 hardware:** No numba benchmark data exists for riscv64. Establishing a baseline (NBodySimulation, NumpyBenchmarks, ASV) is prerequisite to any optimization work.

### 13.3 CI/CD Infrastructure

1. **QEMU-based riscv64 CI for llvmlite.** Blocks all downstream work. 
2. **QEMU or native riscv64 CI for numba.** Follows llvmlite CI.
3. **Integration with Anaconda's build farm** (if official Tier 1 status is the goal). Requires Anaconda engagement; cannot be done unilaterally.

### 13.4 Ecosystem Enablement

Numba itself is a foundational library; its ecosystem impact is indirect (libraries that JIT-compile via numba include Dask array acceleration, scikit-image, umap-learn, awkward-array). Those libraries gain riscv64 support automatically once numba is functional. No separate ecosystem enablement work is needed beyond functional numba.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix llvmlite `targets.cpp` code model for riscv64 | 2-4 | llvmlite maintainer or external contributor | Critical |
| Functional | Add riscv64 CI to llvmlite (QEMU baseline) | 1-2 | llvmlite maintainer or external contributor | Critical |
| Functional | Fix numba `config.py` false AVX detection on riscv64 | 0.5 | numba contributor | High |
| Functional | Add riscv64 CI to numba (QEMU or RISE runner) | 1-2 | numba maintainer or external contributor | High |
| Distribution | Publish llvmlite riscv64 wheels on PyPI | 2-4 | llvmlite wheel builder maintainer | High |
| Distribution | Publish numba riscv64 wheels on PyPI | 1-2 | numba wheel builder maintainer | High |
| Performance | Benchmark numba on riscv64 hardware (baseline) | 2-3 | Performance engineer | Medium |
| Performance | SLEEF integration for transcendental math (non-x86) | 8-16 | numba core contributor | Low |
| Performance | Verify RVV auto-vectorization via `parallel=True` | 1-2 | Performance engineer | Medium |

Total minimum to reach functional (installable, JIT-operational) numba on riscv64: approximately 8-15 person-weeks, with the llvmlite code model fix being the gate for all subsequent work.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [numba/numba issue #6559 -- RISC-V Support](https://github.com/numba/numba/issues/6559)
- [numba/numba issue #10389 -- About RISC-V](https://github.com/numba/numba/issues/10389)
- [numba/llvmlite issue #923 -- Does llvmlite support riscv64?](https://github.com/numba/llvmlite/issues/923)
- [numba/llvmlite issue #785 -- Wheels built with RISC-V support](https://github.com/numba/llvmlite/issues/785)
- [numba/llvmlite PR #797 -- Make RISCV cross-compile tests optional (merged v0.38.0)](https://github.com/numba/llvmlite/issues/797)
- [numba/llvmlite PR #775 -- Add ABIName parameter for RISC-V hard float targets (merged v0.38.0)](https://github.com/numba/llvmlite/issues/775)
- [numba/numba GitHub -- ISA: RISC-V label query](https://github.com/numba/numba/issues?q=label%3A%22ISA%3A+RISC-V%22&state=all)
- [PyPI -- numba 0.65.1 release metadata](https://pypi.org/pypi/numba/0.65.1/json)
- [Debian buildd -- numba riscv64 build status](https://buildd.debian.org/status/package.php?p=numba)
- [RISE Project blog -- Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/blog/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE Project -- wheel_builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project blog -- RP009 LLVM SPEC optimization on SpacemiT-X60](https://riseproject.dev/blog/2025/05/08/project-rp009-llvm-spec-optimization/)
- [RISE GitLab -- wheel_builder PyPI simple index for numba](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/numba/)
- [numba documentation -- Installing Numba](https://numba.readthedocs.io/en/stable/user/installing.html)