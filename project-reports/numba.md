---
title: numba
parent: Project Reports
color: red
dependencies:
  - name: llvmlite
    relation: runtime-dependency
    criticality: critical
  - name: NumPy
    relation: runtime-dependency
    criticality: critical
  - name: SciPy
    relation: runtime-dependency
    criticality: optional
  - name: oneTBB
    relation: runtime-dependency
    criticality: optional
  - name: Intel SVML
    relation: runtime-dependency
    criticality: optional
  - name: cffi
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="numba" %}

# numba

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for numba<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Numba is an open-source JIT compiler for Python that translates a subset of Python and NumPy code to optimized machine code using LLVM as its backend (via the `llvmlite` binding). The primary use case is accelerating numerical array operations through `@jit`-decorated functions, with additional support for GPU kernels via CUDA (`@cuda.jit`) and parallel CPU execution (`parallel=True`).

**Governance:** Numba has no independent foundation. It is described in its own project materials as "sponsored by Anaconda, Inc." There is no NumFOCUS, Linux Foundation, or PSF governance, and no `GOVERNANCE.md` exists in the repository. Decisions, including the formal support-tier policy (Section 3), are made by an informal "maintainer group" via discussion and consensus, sometimes in public maintainer meetings, then ratified in a PR. License is BSD-2-Clause, copyright held by Anaconda, Inc. since 2012.

**Corporate contributors (commits since 2024, by email domain):**

| Domain | Commits since 2024 | Notes |
|---|---|---|
| anaconda.com | 205 | Dominant corporate sponsor; owns build/release infrastructure |
| nvidia.com | 123 | CUDA target maintainer |
| bodo.ai | 9 | |
| kitware.com | 5 | |
| google.com | 4 | |
| pnnl.gov | 3 | Pacific Northwest National Lab |
| meta.com | 3 | |

**Key named maintainers:**

- Siu Kwan Lam ("sklam") -- Anaconda, Inc. Original creator; owns compiler internals (type inference, byteflow, interpreter).
- Stuart Archibald ("stuartarchibald") -- Anaconda, Inc. Core maintainer; owns compiler pipeline, Linux/BSD/ARM/ROCm targets; authored the Support Tiers policy (Section 3).
- Swapnil Patel ("swap357") -- Anaconda, Inc. Top committer by volume since 2024; also the maintainer who reviews and gates third-party CI contributions (see Section 12).
- Valentin Haenel ("esc") -- maintains build farm, integration testing, ASV profiling.
- Graham Markall (NVIDIA) -- owns the CUDA target in CODEOWNERS.
- Todd A. Anderson ("DrTodd13") -- owns Parfors/parallel-accelerator and stencils.

**Community posture on new ports:** Explicitly conservative and maintainer-gated. The formal Tier policy (added October 2025, see Section 3) places uncommon hardware targets such as RISC-V into "Tier 2b -- best-effort, community-supported," where CI/CD and distribution are external to the project and patches are accepted "only so long as they do not add a significant maintenance burden." There is no roadmap entry for riscv64. RISC-V-tagged issues (`ISA: RISC-V` label) are left open with no assignee or milestone, and duplicate reports are closed as duplicates rather than triaged into active work.

Numba is **not a RISE Project member**; RISE membership is company-based (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Canonical, Microchip, Quintauris, SpacemiT, ZTE, and others), and no software project is separately listed. NVIDIA, a top corporate contributor to Numba via the CUDA target, is itself a RISE Premier Member, but that does not extend to Numba.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2020-12-09 | [numba/numba issue #6559](https://github.com/numba/numba/issues/6559) filed: build failure on openSUSE riscv64 with LLVM 11.0.0 / clang 11 targeting `riscv64-unknown-linux-gnu`. Failure is inside llvmlite's `custom_passes.cpp` (function redefinitions, missing declarations, template-instantiation failures). Reporter had to override llvmlite's LLVM-version check to attempt the build. Labeled `ISA: RISC-V`, `feature_request`, `llvm`. Zero comments since filing; remains the de facto master tracking issue ~5 years later. | [Issue #6559](https://github.com/numba/numba/issues/6559) |
| 2021-11-23 | [llvmlite PR #775](https://github.com/numba/llvmlite/issues/775) merged into llvmlite 0.38.0: adds `abiname` parameter to `create_target_machine()`, enabling hard-float RISC-V (e.g. `lp64d`/`ilp32d` ABI). Validated on M-Labs ARTIQ FPGA VexRiscv hardware. This is cross-compilation/ABI scaffolding, not native riscv64 JIT support. | llvmlite PR #775 |
| 2021-11-25 | [llvmlite PR #797](https://github.com/numba/llvmlite/issues/797) merged into llvmlite 0.38.0: makes RISC-V cross-compilation ABI tests optional, to unblock non-RISC-V CI. | llvmlite PR #797 |
| 2023-03-18 | [llvmlite issue #923](https://github.com/numba/llvmlite/issues/923) filed by a Debian riscv64 user: native JIT crashes with `LLVM ERROR: Unsupported code model for lowering`, plus a warning "This target JIT is not designed for the host you are running." Reporter notes only riscv32 binding tests existed, offers riscv64 hardware access. Open, no maintainer fix as of research date. | [Issue #923](https://github.com/numba/llvmlite/issues/923) |
| 2025-10-08 | Commit `42b6665ab360b59b29d8030b9ff04c2a2c5e89ae` by Stuart Archibald adds `docs/source/reference/support_tiers.rst` (the formal Tier policy, Section 3). RISC-V is listed purely as an example Tier 2b hardware target -- the first appearance of the string "RISC-V" in the repo's history, and not an implementation commit. | numba/numba repo history |
| 2025-12-21 | [numba/numba issue #10389](https://github.com/numba/numba/issues/10389) filed: user on a Spacemit riscv64 device, running Numba 0.62.1 / llvmlite 0.43.0, hits the identical `LLVM ERROR: Unsupported code model for lowering`. A fallback attempt to build Numba 0.61.2 from PyPI sdist also fails, on missing `autoreconf`/autotools build dependencies for `patchelf`. | [Issue #10389](https://github.com/numba/numba/issues/10389) |
| 2025-12-22 | Issue #10389 closed as duplicate of #6559. No fix provided. | [Issue #10389](https://github.com/numba/numba/issues/10389) |
| 2026-09-09 to 2026-09-22 | [llvmlite PR #1485](https://github.com/numba/llvmlite/pull/1485) ("Add wheel builder for linux-riscv64"), authored by luhenry (RISE-affiliated), adds CI to build riscv64 wheels using RISE-operated `ubuntu-24.04-riscv` self-hosted runners and a fork of `conda-incubator/setup-miniconda`. Explicitly linked to issue #923. Rejected and closed unmerged by maintainer swap357 over third-party-action policy, unvetted runner/secret-exposure concerns, and RISC-V's Tier 2b status. Details in Section 12. | [PR #1485](https://github.com/numba/llvmlite/pull/1485) |
| 2026-09-22 and 2026-09-24 | llvmlite PR #1490 and numba PR #10848, both Renovate-bot bumps of `conda-incubator/setup-miniconda` to v4.1.0, merged. They incidentally pull in that action's own new riscv64-Miniforge CI-tooling capability but add no riscv64 code path to numba or llvmlite. | llvmlite PR #1490, numba PR #10848 |
| 2026-09-25 | [conda-forge/numba-feedstock PR #212](https://github.com/conda-forge/numba-feedstock/pull/212) ("MNT: add riscv64"), authored by MementoRC, opened as a draft adding riscv64 to the conda-forge build matrix. Passed automated linting; awaiting review from 7 named code owners (esc, henryiii, jakirkham, marcelotrevisani, mbargull, souravsingh, step21). Open/draft as of research date. | [Feedstock PR #212](https://github.com/conda-forge/numba-feedstock/pull/212) |
| ~2026-04-01 | Ubuntu 26.04 "resolute" ships `python3-numba 0.64.0+dfsg-1ubuntu1` with a riscv64 binary build (architectures: amd64, arm64, ppc64el, riscv64), independent of upstream numba/llvmlite's release process. Launchpad build record shows `[FULLYBUILT]`. This is a distro-level build success, not evidence the package functions at runtime (see Sections 8 and 13). | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=numba&suite=resolute&searchon=names&section=all) |

**Summary:** No riscv64 code has ever been committed to numba/numba, and no PR with substantive RISC-V implementation content has merged in either numba/numba or numba/llvmlite. The 2021 llvmlite merges address riscv32 cross-compilation ABI scaffolding only. The one 2026 attempt at riscv64 CI (llvmlite PR #1485) was rejected on policy/infra grounds, not on a technical fix being wrong. The port, in the sense of a working riscv64 JIT, does not exist upstream.

---

## 3. Upstream Support Tier

Numba has a formal, documented tier policy as of October 2025 (`docs/source/reference/support_tiers.rst`, added by maintainer Stuart Archibald):

- **Tier 1** -- Maintainer-backed, full CI/CD, release guarantees. Requires conda-based distro support plus GitHub Actions free-tier support. Current members: `osx-arm64`, `linux-64` (x86_64), `linux-aarch64`, `win-64`.
- **Tier 1.5** -- Experimental/emerging configurations expected to graduate to Tier 1 (currently: free-threaded Python 3.14 builds, `win-arm64`).
- **Tier 2a** -- Built by large external distributors (RHEL/Fedora, Debian/Ubuntu, BSDs); maintainers assist but do not own CI/CD.
- **Tier 2b** -- "General community support," best-effort only, CI/CD and distribution external to the project. Explicitly lists `s390x`, `ppc64le`, and **RISC-V** as example hardware targets, alongside `osx-64`. Promotion out of Tier 2b requires a GitHub issue proposal, community discussion, and maintainer approval; the policy states the maintainers "have the final say... as they are long term committed to the project and carry the ongoing maintenance burden."

RISC-V's presence in the policy is prospective/illustrative, not a signal of active work -- it is not tied to any assignee, milestone, or open implementation PR.

**Officially supported platforms** (numba's own installation documentation): Linux x86_64, Linux arm64/aarch64, Windows 10+ (64-bit), macOS 11+ (M1/Arm64), ARMv8 (e.g. NVIDIA Jetson). Unofficial/community support: Linux ppc64le (POWER8/9), BSD. **riscv64 is not listed in any tier** in the installation docs, consistent with its Tier 2b/example-only status in the policy document.

| Property | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Formal tier | Tier 1 | Tier 1 | Not assigned (example-only under Tier 2b) |
| PyPI wheels | Yes | Yes | No |
| conda-forge packages | Yes | Yes | No (feedstock PR #212 open/draft) |
| CI coverage | Full (native) | Full (native, `ubuntu-24.04-arm`) | None |
| Release-blocking tests | Yes | Yes | N/A |
| JIT execution | Functional | Functional | Crashes (`LLVM ERROR: Unsupported code model for lowering`) |
| Official prebuilt binaries | Yes | Yes | No (only a distro-built Ubuntu package exists, see Section 8) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Numba's pipeline is: Python bytecode -> Numba IR -> LLVM IR (via llvmlite) -> native machine code. Everything after Numba IR generation is delegated to llvmlite/LLVM; numba has no separate assembler, GC, or runtime library outside this path, and does not organize architecture support as per-arch source trees (no `arch/x86/`, `arch/riscv/`, etc.). Numba's own code only special-cases an architecture where LLVM's generic output is wrong for that target's ABI.

**JIT compilation (the critical path).** LLVM's RISC-V backend has shipped in the default target set since LLVM 11 (2020), so RISC-V IR can in principle be compiled. The blocker is in llvmlite's `targets.cpp`, which selects `CodeModel::Large` for all 64-bit targets via a generic pointer-size branch. LLVM's RISC-V backend does not support the Large code model, which produces `LLVM ERROR: Unsupported code model for lowering` and aborts -- confirmed independently in [llvmlite#923](https://github.com/numba/llvmlite/issues/923) (2023, Debian hardware) and [numba#10389](https://github.com/numba/numba/issues/10389) (December 2025, Spacemit hardware, identical error string). This failure occurs before any user code executes; it is a build-independent runtime crash, not a packaging gap. No fix (e.g. switching the 64-bit code model to `Medium`/`Small` for riscv64, or using LLVM's ORC/JITLink engine instead of MCJIT, which LLVM documentation rates "Good" for riscv64 ELF) exists in any merged PR or branch as of this writing.

**SIMD / vector dispatch.** Numba has no SIMD dispatch layer of its own for CPU targets. On x86_64 it optionally uses Intel SVML for vectorized transcendental functions (`sin`, `cos`, `exp`, `log`); SVML is permanently x86-only and has no RISC-V equivalent. No SLEEF integration exists. No RVV intrinsics (`vfloat32m1_t`, RVV builtins) appear anywhere in the numba source tree -- confirmed by repository-wide code search (`riscv`, `vfloat32m1_t`, `rvv`, `riscv64` all return zero matches in numba/numba).

**Architecture-specific code inventory (direct source inspection):**

- `numba/core/codegen.py`: explicit `_x86arch` frozenset and `_is_x86()` static-relocation handling for x86, and separate handling for ppc. riscv64 falls into the generic `'default'` path.
- `numba/core/cpu.py`: explicit s390x branch (ABI integer-promotion attributes, `libgcc_s.so.1` loading) and a 32-bit-architecture branch. No riscv64 branch.
- `numba/core/config.py`: `_os_supports_avx()` returns `True` for all non-x86 platforms, including riscv64 -- a silent incorrect default whose downstream runtime impact has not been characterized [NEEDS VERIFICATION].
- `setup.py` has exactly one architecture-conditional build flag (`if platform.machine() == 'ppc64le': extra_link_args += ['-pthread']`); no riscv64-conditional code exists.
- No `.S` assembly files, no `arch/riscv/` directory, no `#ifdef __riscv` guards anywhere in the repository.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT code generation | Functional | Functional | Missing / crashes (code-model error) |
| SIMD vectorization | Hand-tuned (SVML optional) | Delegates to LLVM auto-vectorizer | No path (SVML not applicable, no RVV support) |
| Transcendental math (JIT) | SVML or scalar libm | Scalar (LLVM fast-math) | Scalar only, if JIT were fixed |
| AOT compilation | Functional | Functional | Untested (no functioning toolchain) |
| GPU (CUDA) | Functional (NVIDIA GPU) | Functional (NVIDIA GPU) | Not applicable |
| Numba-side arch-specific code | Yes (codegen, config) | None needed (generic LLVM path sufficient) | None (zero code, zero CI, zero merged PRs) |

---

## 5. Build System, Cross-Compilation, and Toolchain

Numba itself builds via plain `setuptools`/`build`, driven by `versioneer`. **There is no `CMakeLists.txt` anywhere in numba/numba** -- confirmed by direct repository inspection (clone HEAD `8c0a6033`) and by the absence of any `cmake/` directory or `.cmake` toolchain files.

```
python setup.py build_ext --inplace
# or
python -m build --wheel --no-isolation
```

No `BUILDING.md`, `INSTALL`, or cross-compilation documentation files exist in the repository. No riscv64 Dockerfiles or QEMU configuration exist in either numba or llvmlite.

**The dependency chain that must be built for riscv64:**

1. Build LLVM with the RISCV target (included in `LLVM_ALL_TARGETS` by default since LLVM 11; no explicit flag needed).
2. Build llvmlite against that LLVM installation.
3. Build numba against llvmlite.

**llvmlite build environment variables:**

| Variable | Effect |
|---|---|
| `CMAKE_PREFIX_PATH` | Path to `LLVMConfig.cmake` |
| `LLVMLITE_SHARED` | Non-zero: link dynamically against LLVM |
| `LLVMLITE_LTO` | Set to 0 to disable LTO (workaround for GCC bugs) |
| `LLVMLITE_SKIP_LLVM_VERSION_CHECK` | Allow unsupported LLVM versions (required by the original #6559 reporter to even attempt a build) |
| `LLVMLITE_CXX_STATIC_LINK` | Static libstdc++ linking (non-Darwin) |

**RISC-V-specific API (llvmlite, `abiname` added in 0.38.0):**

```python
machine = target.create_target_machine(
    features="+m,+a,+f,+d",
    reloc="pic",
    codemodel="default",
    abiname="lp64d"   # required for riscv64 hard-float
)
```

**Known build/runtime failures on riscv64:**

1. **llvmlite JIT crash (the hard blocker):** even a successful build crashes at execution with `LLVM ERROR: Unsupported code model for lowering` ([llvmlite#923](https://github.com/numba/llvmlite/issues/923); reproduced again in [numba#10389](https://github.com/numba/numba/issues/10389), December 2025). The build completes; the runtime fails.
2. **Original openSUSE build failure (LLVM 11, 2020):** `custom_passes.cpp` version-guard and redefinition errors blocked compilation entirely ([numba#6559](https://github.com/numba/numba/issues/6559)). Not confirmed resolved on later LLVM versions by any maintainer.
3. **Third-party Spacemit build path:** installs successfully (Numba 0.62.1 / llvmlite 0.43.0) but crashes at runtime with the same code-model error; a fallback source build of Numba 0.61.2 separately failed on missing `autoreconf`/autotools build dependencies for `patchelf`.
4. **Ubuntu 26.04 distro build:** compiles successfully to produce `python3-numba 0.64.0+dfsg-1ubuntu1` for riscv64 (Launchpad `[FULLYBUILT]`), but build success is a distinct claim from runtime functionality -- the package's primary use case, `@jit`-compiled execution, inherits the same upstream llvmlite code-model crash (Section 8, Section 13).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `@jit` (nopython mode) | Functional | Functional | Non-functional (JIT crash) |
| `@vectorize` | Functional | Functional | Non-functional |
| `@guvectorize` | Functional | Functional | Non-functional |
| `@stencil` | Functional | Functional | Non-functional |
| `@cuda.jit` | Functional (NVIDIA GPU) | Functional (NVIDIA GPU) | Not applicable |
| Object mode JIT | Functional | Functional | Non-functional |
| AOT compilation | Functional | Functional | Untested |
| Parallel execution (`parallel=True`) | Functional | Functional | Non-functional |
| SVML transcendentals | Optional (present) | Not available | Not available |
| NumPy ufunc lowering | Functional | Functional | Non-functional |
| `scipy.special` lowering | Functional | Functional | Non-functional |

**Functional gaps:** all JIT-dependent features, which constitute numba's entire primary use case, are non-functional on riscv64. There is no partial or degraded-mode operation -- the failure is a hard crash at JIT invocation.

**Performance gaps (hypothetical, assuming the JIT were fixed):** SVML provides measurable acceleration for vectorized transcendental math on x86_64; no equivalent exists for riscv64, so a scalar `libm` fallback would be expected. No SIMD/RVV backend exists in numba itself; vectorization quality would depend entirely on LLVM's generic auto-vectorizer. RISE Project's "RP009: LLVM SPEC Optimization" (Igalia, 8 months, SpacemiT-X60 hardware, SPEC CPU 2017 harness) reports up to 15% overall execution-time reduction in LLVM's RISC-V backend from scheduling-model and SLP-vectorizer work (scheduling: up to 15.7%; vectorization: up to 9.1%; IPRA register allocation: up to 3.3%). This is LLVM-backend context, not Numba-specific data -- **no numba performance benchmark on riscv64 exists anywhere**, because no functioning riscv64 numba runtime exists to benchmark.

**Security hardening gaps:** Data not available -- no search was conducted for CFI, stack-canary, or shadow-stack enablement specific to numba on riscv64.

**Floating-point / NaN semantics:** No riscv64-specific NaN or floating-point correctness issue was found in numba's issue tracker (a targeted search for riscv-tagged NaN/floating-point bugs returned only the two general tracking issues already covered; unrelated NaN bugs exist in numba but none mention RISC-V). The `_os_supports_avx()` false-`True` return on riscv64 (Section 4) is a documented incorrect default whose concrete runtime impact has not been characterized [NEEDS VERIFICATION].

---

## 7. CI/CD Infrastructure

**riscv64 CI: confirmed absent.** All 14 workflow files under `.github/workflows/` (`numba_linux-64_conda_builder.yml`, `numba_linux-64_wheel_builder.yml`, `numba_linux-aarch64_conda_builder.yml`, `numba_linux-aarch64_wheel_builder.yml`, `numba_osx-arm64_conda_builder.yml`, `numba_osx-arm64_wheel_builder.yml`, `numba_win-64_conda_builder.yml`, `numba_win-64_wheel_builder.yml`, `numba_win-arm64_conda_builder.yml`, `numba_win-arm64_wheel_builder.yml`, `stale.yml`, `test_matrix_evaluate.yml`, `towncrier.yml`, `upload_packages.yml`) plus `azure-pipelines.yml`, `codecov.yml`, and `.readthedocs.yml` were read in full. A case-insensitive grep for `riscv`/`risc-v`/`risc_v` across the entire repository (`.git` excluded) returns exactly **one** hit, in `docs/source/reference/support_tiers.rst` (the Tier 2b policy prose, Section 3) -- not a CI configuration, workflow, runner, or trigger. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository. GitHub code search (`search_code` for `riscv repo:numba/numba` and `riscv64 repo:numba/numba`) independently returns zero results, consistent with the local read.

**CI matrix (actual):**

| Workflow | Platform |
|---|---|
| `numba_linux-64_conda_builder.yml` / `_wheel_builder.yml` | linux x86_64 |
| `numba_linux-aarch64_conda_builder.yml` / `_wheel_builder.yml` | linux aarch64 (native, `ubuntu-24.04-arm`) |
| `numba_osx-arm64_conda_builder.yml` / `_wheel_builder.yml` | macOS arm64 |
| `numba_win-64_conda_builder.yml` / `_wheel_builder.yml` | Windows x86_64 |
| `numba_win-arm64_conda_builder.yml` / `_wheel_builder.yml` | Windows arm64 (`windows-11-arm`) |
| `stale.yml`, `test_matrix_evaluate.yml`, `towncrier.yml`, `upload_packages.yml` | housekeeping, run on `ubuntu-latest` |

| Property | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes | Yes | No |
| CI type | Native (`ubuntu-latest`) | Native (`ubuntu-24.04-arm`) | None |
| QEMU emulation | N/A | N/A | None |
| Test failures block release | Yes | Yes | N/A |
| RISE runners used | No | No | No (one proposal, rejected -- Section 12) |

Separately, the one concrete attempt to add riscv64 CI anywhere in the numba/llvmlite ecosystem -- [llvmlite PR #1485](https://github.com/numba/llvmlite/pull/1485), which would have used RISE-operated `ubuntu-24.04-riscv` runners -- was closed unmerged in September 2026 (Section 2, Section 12). No riscv64 job, runner, or QEMU emulation step exists anywhere in numba or llvmlite CI configuration as of this writing.

---

## 8. Distribution and Release Status

**PyPI.** Latest release is **numba 0.68.0** (30 Sep 2026), with 32 wheel files (`cp3x` x manylinux/macos/win). Across the **entire** historical release set (138 releases, 1,989 files, versions 0.1 through 0.68.0), **zero filenames contain "riscv"** -- confirmed by parsing the PyPI JSON API directly. No riscv64 wheel has ever been published for numba, and none exists for llvmlite either.

**GitHub Releases.** The 5 most recent releases (0.68.0, 0.67.0, 0.66.0, 0.65.1, 0.65.0) each show exactly 2 assets -- the standard GitHub-generated source archives (`.zip`/`.tar.gz`). Numba does not attach built binaries to GitHub releases; all binary distribution goes through PyPI/conda. No riscv64 assets exist or are expected on this channel.

**conda-forge.** No `linux-riscv64` numba package exists. [conda-forge/numba-feedstock PR #212](https://github.com/conda-forge/numba-feedstock/pull/212) ("MNT: add riscv64"), opened September 25, 2026, would add riscv64 to the build matrix, but remains an open draft awaiting human review from 7 code owners as of research date; it passed only automated linting.

**RISE wheel builder.** The RISE GitLab wheel-builder PyPI index for numba (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/numba/`) returns an HTTP 302 redirect straight to public PyPI -- RISE does not host its own numba package. Separately, the RISE `wheel_builder` project's package list (~70 packages: numpy, scipy, pandas, matplotlib, scikit-image, etc.) does **not** include numba or llvmlite. The RISE blog post "Easy Installation of Binary Python Packages on riscv64 Devices" (May 2025) covers `wheel_builder` generally and does not mention numba.

**Debian.** numba 0.65.1+dfsg-3 exists in Debian sid; per prior buildd records the riscv64 build status was "Build-Attempted"/uncompiled, failing on a test timeout in `test_nanpercentile_basic`.

**Ubuntu 26.04 "resolute" -- the one confirmed riscv64 binary.** `packages.ubuntu.com` directly confirms a live riscv64 download entry: `python3-numba 0.64.0+dfsg-1ubuntu1` (universe component), 1,786.8 kB compressed / 11,790.0 kB installed, architectures `amd64 arm64 ppc64el riscv64`. The file listing contains real compiled riscv64 artifacts (e.g. `_dispatcher.cpython-314-riscv64-linux-gnu.so`, `_devicearray.cpython-314-riscv64-linux-gnu.so`, 795 files total). Launchpad's build record for the same source version shows riscv64 build `+build/32733375` marked `[FULLYBUILT]` alongside amd64, arm64, armhf, ppc64el, and s390x. This is a genuine, downloadable Debian Science Team build, independently cross-compiled against the distro's own llvmlite/LLVM toolchain rather than upstream's official (riscv64-incomplete) release pipeline. **It must not be read as evidence that numba functions on riscv64**: a package that compiles is a distinct claim from a JIT that executes, and the compiled llvmlite underneath this package is subject to the same unresolved `LLVM ERROR: Unsupported code model for lowering` crash documented in [llvmlite#923](https://github.com/numba/llvmlite/issues/923) and reproduced on real riscv64 hardware in [numba#10389](https://github.com/numba/numba/issues/10389) (Dec 2025). No evidence was found that Ubuntu's build carries a patch to llvmlite's code-model selection that would avoid this crash.

**Ubuntu 24.04 (noble) / Arch Linux RISC-V.** numba is not packaged in Ubuntu 24.04. No `python-numba` entry was found on the Arch Linux RISC-V port mirror via the available search interface; this channel is unverified rather than confirmed-absent, since the mirror has no keyword-search endpoint and the raw package-index file was not checked [NEEDS VERIFICATION].

**What a user must do to get a working binary on riscv64.** There is no path to a functioning JIT. The only riscv64 binary that exists anywhere (Ubuntu 26.04's `python3-numba`) builds successfully but inherits the upstream llvmlite JIT crash for the package's core use case. Source builds against upstream llvmlite fail or crash identically. No workaround is documented in any upstream issue.

---

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 build | riscv64 test | riscv64 release | Status |
|---|---|---|---|---|---|---|
| llvmlite | Core JIT backend (hard runtime dependency) | Critical | Builds from source (LLVM RISCV target included by default) | Crashes at JIT execution ([llvmlite#923](https://github.com/numba/llvmlite/issues/923)) | No PyPI wheel; riscv64 wheel-builder PR [#1485](https://github.com/numba/llvmlite/pull/1485) closed unmerged | Critical blocker -- root cause of numba's riscv64 failure |
| NumPy | Array object/dtype system (hard runtime dependency) | Critical | Builds from source | Native CI via RISE runners since May 2026; no numba-level integration testing on riscv64 | No riscv64 PyPI wheel yet (tracked, milestone 2.6.0, [numpy#30216](https://github.com/numpy/numpy/issues/30216)) | Not itself blocking numba; reasonable independent riscv64 progress |
| SciPy | `linalg`/`scipy.special` lowering (optional runtime dependency) | Optional | Builds from source with difficulty; cross-compilation is the standard path | No riscv64 CI | No PyPI wheel | [scipy#19378](https://github.com/scipy/scipy/issues/19378) (cross-compile, open since Oct 2023), [scipy#20423](https://github.com/scipy/scipy/issues/20423) (LAPACK ABI error, closed "not planned"); absence disables only `numba.np.linalg.*`/`scipy.special` lowering |
| oneTBB | TBB threading backend for `parallel=True` (optional runtime dependency) | Optional | Builds from source (`cmake/toolchains/riscv64.cmake` since v2021.10.0) | No riscv64 CI | No binary release | Not critical; source-buildable |
| Intel SVML | Vectorized transcendentals (optional runtime dependency) | Optional | Not applicable | Not applicable | Not applicable | Permanently x86-only; no RISC-V path exists or is planned, falls back to scalar libm |
| cffi | CFFI calls inside JIT-compiled functions (optional runtime dependency), depends on libffi | Optional | Builds from source (libffi itself supports riscv64) | No riscv64 CI | No PyPI wheel (cffi PR #234 open) | Not critical; libffi upstream is in reasonable shape |
| LLVM (indirect, via llvmlite) | JIT code-generation backend | Critical | RISCV target included by default since LLVM 11 (2020) | MCJIT code-model selection fails on riscv64; ORC/JITLink is rated "Good" for riscv64 ELF by LLVM but is unused by llvmlite | Build dependency only | Root technical mechanism of the blocker: llvmlite's `targets.cpp` selects `CodeModel::Large`, which RISC-V's LLVM backend rejects |
| OpenBLAS (indirect, via SciPy) | BLAS/LAPACK backend for `linalg` | Optional | Functional (RVV 1.0 kernels since 0.3.28) | QEMU only | No standalone PyPI wheel | Reasonably mature independently of numba |

**llvmlite deep-dive (critical path).** llvmlite is numba's only JIT dependency and the sole root blocker. The failure chain: (1) `llvmlite/ffi/targets.cpp` selects `CodeModel::Large` for all 64-bit targets via a generic pointer-size check; (2) LLVM's RISC-V backend does not support `CodeModel::Large`; (3) the result is `LLVM ERROR: Unsupported code model for lowering` and an abort, before any user code executes. This is documented in [llvmlite#923](https://github.com/numba/llvmlite/issues/923) (open since March 2023, no maintainer-proposed fix) and reproduced independently in [numba#10389](https://github.com/numba/numba/issues/10389) (December 2025, real Spacemit hardware). The only concrete fix attempt addressed CI/wheel infrastructure, not the code-model bug itself ([llvmlite#1485](https://github.com/numba/llvmlite/pull/1485), closed unmerged -- Section 12); no PR changing the code-model selection logic exists. llvmlite's 2021 merges (`abiname` parameter, optional cross-compile tests) address riscv32 ABI and test scaffolding only and do not touch native riscv64 JIT.

**NumPy.** Builds and tests pass; has had QEMU-based CI since November 2023 and native riscv64 CI via RISE runners since May 2026. No riscv64 PyPI wheels yet (tracked for milestone 2.6.0). No RVV SIMD backend (scalar fallback). This dependency is not a blocker for numba relative to llvmlite.

**SciPy.** Cross-compilation is the standard riscv64 build path; no riscv64 CI exists; a known LAPACK ABI error on riscv64 hardware was closed "not planned." Because SciPy is optional for numba, its riscv64 gaps disable only linalg/special-function lowering, not the core JIT path.

---

## 11. Known Bugs and Active Issues

| ID | Title | State | Severity | Notes |
|---|---|---|---|---|
| [numba #6559](https://github.com/numba/numba/issues/6559) | RISC-V Support | Open (since 2020-12-09) | Critical | Master tracking issue, zero comments, no assignee, no linked PR, ~5.5 years open. Original failure: llvmlite `custom_passes.cpp` build error on openSUSE riscv64 + LLVM 11. |
| [numba #10389](https://github.com/numba/numba/issues/10389) | About RISC-V | Closed as duplicate (2025-12-22) | Critical | Spacemit riscv64 hardware, Numba 0.62.1 + llvmlite 0.43.0. Runtime crash: `LLVM ERROR: Unsupported code model for lowering`. Fallback source install also fails (missing autotools). Closed without a fix. |
| [llvmlite #923](https://github.com/numba/llvmlite/issues/923) | Does llvmlite support riscv64? | Open (since 2023-03-18) | Critical (root cause) | Debian riscv64 report of the identical `LLVM ERROR: Unsupported code model for lowering`. Only riscv32 binding tests existed at filing. Reporter offered riscv64 hardware; no maintainer-proposed fix as of research date. |
| [llvmlite #1485](https://github.com/numba/llvmlite/pull/1485) | Add wheel builder for linux-riscv64 | Closed, not merged (2026-09-09 to 2026-09-22) | High (infra, not the core bug) | RISE-authored riscv64 wheel-builder CI; rejected by maintainer swap357 over third-party-action policy, unvetted self-hosted runner, secret-token exposure, and Tier 2b status. Did not address the underlying code-model bug even if merged. |
| [conda-forge/numba-feedstock #212](https://github.com/conda-forge/numba-feedstock/pull/212) | MNT: add riscv64 | Open, draft (since 2026-09-25) | Medium (packaging only) | Adds riscv64 to the conda-forge build matrix; passed linting, awaiting 7 code-owner reviews. Does not touch the llvmlite code-model bug. |
| [llvmlite #785](https://github.com/numba/llvmlite/issues/785) | Wheels built with RISC-V support | Closed (March 2023) | Medium | Request for riscv-target llvmlite PyPI wheels; closed without a merge. ARTIQ maintains a private fork. |
| [llvmlite #797](https://github.com/numba/llvmlite/issues/797) | Make RISCV cross-compile tests optional | Merged (v0.38.0, Nov 2021) | Informational | riscv32 cross-compilation test scaffolding only; does not address riscv64 native JIT. |
| [llvmlite #775](https://github.com/numba/llvmlite/issues/775) | Add ABIName for RISC-V hard float targets | Merged (v0.38.0, Nov 2021) | Informational | `abiname` parameter for hard-float riscv32; validated on FPGA VexRiscv. riscv64 native JIT not addressed. |

**Correctness bugs.** `_os_supports_avx()` in `numba/core/config.py` returns `True` on riscv64, which is incorrect; downstream impact on correctness has not been documented [NEEDS VERIFICATION]. A prior Debian test timeout for `test_nanpercentile_basic` on riscv64 suggests correctness or performance issues would remain even if the JIT code-model bug were fixed, though this may simply be a symptom of a partially-functioning build rather than an independent defect.

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. **llvmlite JIT code-model bug (the hard blocker).** `targets.cpp` selects `CodeModel::Large` for all 64-bit targets; RISC-V's LLVM backend rejects it, producing `LLVM ERROR: Unsupported code model for lowering`. The fix is understood to be small in scope (changing the code-model selection, or switching to LLVM's ORC/JITLink engine) but requires a maintainer with LLVM JIT code-model expertise for riscv64; no PR implementing it exists as of this writing.
2. **No riscv64 llvmlite PyPI wheel.** Even after a code-model fix, the wheel-build pipeline would need riscv64 runner/QEMU support and manylinux policy coordination. The one concrete attempt ([llvmlite#1485](https://github.com/numba/llvmlite/pull/1485)) addressed this layer but was rejected before it could be evaluated on technical merits.
3. **No riscv64 numba PyPI wheel.** Follows directly from (1) and (2).
4. **SVML absence.** Permanently unavailable on riscv64; no mitigation (e.g. SLEEF, RVV intrinsics) is designed in numba.

**Documented maintainer objections (llvmlite PR #1485, the single most substantive data point on upstream posture).** Chronology from the PR discussion:

- luhenry (RISE-affiliated) opened the PR September 9, 2026, explicitly linking it to root-cause issue #923.
- swap357 (Anaconda, Inc.) raised two concrete objections in review: "third party actions are not allowed on llvmlite CI," and a direct security question -- "who maintains this runner image? does this open new attack surface? this workflow exposes `GITHUB_TOKEN` and `ANACONDA_API_TOKEN`."
- luhenry acknowledged the PR was "very much debug/draft" pending a prerequisite upstream PR (`conda-incubator/setup-miniconda#567`, since merged into setup-miniconda v4.1.0).
- swap357's formal review reiterated three grounds for rejection: unauthorized third-party GitHub Actions without explicit maintainer approval; an unvetted third-party self-hosted runner and its operating GitHub App (RISE's); and RISC-V's formal Tier 2b status, under which "CI/CD and distribution, if any, are not maintained by the Numba maintainers, and patches are accepted only if they do not add a significant maintenance burden."
- stuartarchibald (core maintainer) engaged September 16, redirecting discussion back to root-cause issue #923.
- swap357 closed the PR September 22: "Will close this for now, since RISCV is a Tier 2 platform and does not meet all the requirements to have CI workflow on the project."

The rejection was explicitly on infrastructure-security and governance-policy grounds, not a technical rejection of riscv64 support itself; the underlying code-model bug was never reached for review.

**Organizational blockers:**

1. **Anaconda build-farm dependency.** New architecture support requires Anaconda's active involvement; Anaconda has not publicly committed to riscv64 for numba.
2. **Maintainer bandwidth.** Core maintainers are employed by Anaconda (infrastructure/compiler core), NVIDIA (CUDA target), and other organizations with no stated riscv64 priority for numba.
3. **RISE non-involvement at the numba-repository level.** No dedicated numba repository exists in the `riseproject-dev` GitHub org (confirmed by a full 26-repository listing). RISE's `wheel_builder` project (49-70 packages depending on snapshot date, maintained by Rivos and Baylibre with RISE funding) does not include numba or llvmlite. No RISE blog post mentions numba. RISE's `python-wheels` repository explicitly excludes numba from downstream packages' CPU requirements on riscv64 (e.g. a vLLM patch `0001-requirements-do-not-require-numba-on-riscv64.patch`, merged Sep 21, 2026) and skips test suites that depend on numba (e.g. a nutpie patch, merged Sep 28, 2026), treating numba as a known architectural blocker rather than a package in progress. RISE does fund other numeric-Python riscv64 work (NumPy native CI, PyTorch riscv64 wheels as of August 2026) but has not extended comparable investment to numba/llvmlite.

**Acceptance probability.** Low in the near term without external sponsorship that addresses both the technical code-model bug in llvmlite and the governance/security concerns that blocked the one CI contribution attempt. The code-model fix is reportedly small, but the maintainer review bar for JIT-affecting changes is high, and RISC-V's Tier 2b classification means the project will not independently prioritize the infrastructure work.

---

## 13. Readiness Assessment

- **Color:** red (confirmed-broken-runtime)
- **Release provider:** distro
- Numba has no riscv64 CI anywhere in numba/numba (all 14 workflow files plus `azure-pipelines.yml` grepped, zero matches besides the Tier 2b policy mention in `support_tiers.rst`) and no upstream riscv64 PyPI or conda release. Its core JIT execution is confirmed broken on riscv64 hardware with an unresolved `LLVM ERROR: Unsupported code model for lowering` crash, independently reproduced in [numba#10389](https://github.com/numba/numba/issues/10389) (December 2025, real Spacemit device) and root-caused in [llvmlite#923](https://github.com/numba/llvmlite/issues/923) (open since March 2023). Ubuntu 26.04's `python3-numba` riscv64 package does compile successfully (Launchpad `[FULLYBUILT]`), but that confirms only that it builds, not that it runs -- the primary use case, `@jit`-compiled execution, still crashes.
- **Pending work that could change the grade:** the open tracking issue [numba#6559](https://github.com/numba/numba/issues/6559) (since December 2020, no assignee); one concrete fix attempt, [llvmlite PR #1485](https://github.com/numba/llvmlite/pull/1485) (a riscv64 wheel builder using RISE runners), which was closed unmerged in September 2026 over Tier 2b/third-party-CI-security objections from maintainer swap357; and [conda-forge/numba-feedstock#212](https://github.com/conda-forge/numba-feedstock/pull/212) (add riscv64 to the build matrix), an open draft awaiting review from 7 code owners. None of these addresses the underlying llvmlite LLVM code-model crash that is the actual blocker -- resolving that is the prerequisite for any grade change.

---

## 14. Investment Analysis

RISE has not funded any numba or llvmlite riscv64 work directly. The adjacent `wheel_builder` and `python-wheels` RISE repositories treat numba as an excluded/blocked dependency for other packages, not as a project with in-progress support. The one external riscv64 CI contribution to this ecosystem (llvmlite PR #1485) was rejected on governance grounds before any technical review of the fix it would have enabled; it did not touch the code-model bug itself. All items below are therefore unaddressed and not already covered by existing investment.

### 14.1 Functional Enablement

1. **Fix llvmlite `targets.cpp` code-model selection for riscv64.** Detect the riscv64 target triple and select `CodeModel::Medium` (or `Small`) instead of `CodeModel::Large`, or evaluate switching llvmlite's JIT engine to ORC/JITLink (rated "Good" for riscv64 ELF by LLVM) in place of MCJIT. Requires LLVM JIT/code-model expertise and must land upstream in llvmlite -- a downstream fork cannot produce official wheels.
2. **Re-propose riscv64 CI for llvmlite, addressing the specific objections raised on PR #1485** (no unauthorized third-party GitHub Actions; a vetted, ideally GitHub-first-party-hosted runner rather than an unreviewed third-party self-hosted RISC-V runner and app; no `GITHUB_TOKEN`/`ANACONDA_API_TOKEN` exposure to that runner). Without addressing these, any resubmission is likely to be closed again regardless of technical merit.
3. **Publish riscv64 llvmlite wheels on PyPI**, once (1) and (2) land.
4. **Fix `_os_supports_avx()` false-`True` return on riscv64** in `numba/core/config.py`. Small, independent correctness fix.
5. **Add riscv64 CI to numba** (`numba_linux-riscv64_wheel_builder.yml`), gated on llvmlite riscv64 CI existing first.
6. **Publish riscv64 numba wheels on PyPI.**
7. **Progress conda-forge/numba-feedstock#212 to merge** -- secure review from at least one of the 7 named code owners; note this alone does not fix the runtime crash, only packaging.

### 14.2 Performance Optimization

Premature until functional enablement (14.1) is complete -- there is no functioning riscv64 JIT to optimize. Once functional:

1. **Verify LLVM auto-vectorization produces RVV instructions** under `parallel=True` on V-extension hardware; likely no numba-specific code is needed if LLVM's auto-vectorizer handles it. Audit-level effort.
2. **SLEEF integration for transcendental math** as a portable SIMD-math fallback for non-x86 targets (numba currently relies on SVML, x86-only). No existing design in the numba codebase; medium-scope project.
3. **Establish a numba riscv64 benchmark baseline** (e.g. via numba's existing ASV suite) -- no such data exists today, because no functional runtime exists to measure.

### 14.3 CI/CD Infrastructure

1. **riscv64 CI for llvmlite** (QEMU baseline, or a properly vetted native-runner arrangement) -- blocks all downstream work; see 14.1.2 for the governance constraints that must be satisfied.
2. **riscv64 CI for numba**, following llvmlite CI.
3. **Integration with Anaconda's build farm**, if official Tier 1 status is the goal -- requires direct Anaconda engagement and cannot be achieved by external contribution alone.

### 14.4 Ecosystem Enablement

Numba is a foundational acceleration library consumed by other packages (e.g. Dask array acceleration, scikit-image, umap-learn, awkward-array), but it does not itself host a package/plugin ecosystem that requires separate riscv64 enablement -- those consumer libraries inherit numba's riscv64 status automatically once numba itself is functional. No distinct ecosystem-enablement work is required beyond the functional fix.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix llvmlite `targets.cpp` code-model selection for riscv64 (or switch to ORC/JITLink) | 2-4 | llvmlite maintainer or external contributor | Critical |
| Functional | Re-propose riscv64 CI for llvmlite addressing PR #1485's rejection reasons | 1-2 | External contributor, with Anaconda sign-off | Critical |
| Functional | Fix numba `config.py` false AVX detection on riscv64 | 0.5 | numba contributor | High |
| Functional | Add riscv64 CI to numba | 1-2 | numba maintainer or external contributor | High |
| Distribution | Publish llvmlite riscv64 wheels on PyPI | 2-4 | llvmlite wheel-builder maintainer | High |
| Distribution | Publish numba riscv64 wheels on PyPI | 1-2 | numba wheel-builder maintainer | High |
| Distribution | Secure code-owner review and merge conda-forge/numba-feedstock#212 | 0.5-1 | conda-forge code owner | Medium |
| Performance | Benchmark numba on riscv64 hardware (baseline) | 2-3 | Performance engineer | Medium |
| Performance | Verify RVV auto-vectorization via `parallel=True` | 1-2 | Performance engineer | Medium |
| Performance | SLEEF integration for transcendental math (non-x86) | 8-16 | numba core contributor | Low |

Total minimum to reach a functional, installable, JIT-operational numba on riscv64: approximately 9-17 person-weeks, gated first on the llvmlite code-model fix and second on resolving the governance objections that blocked the one existing CI contribution attempt.

---

## 15. References

- [numba/numba issue #6559 -- RISC-V Support](https://github.com/numba/numba/issues/6559)
- [numba/numba issue #10389 -- About RISC-V](https://github.com/numba/numba/issues/10389)
- [numba/numba GitHub -- ISA: RISC-V label query](https://github.com/numba/numba/issues?q=label%3A%22ISA%3A+RISC-V%22&state=all)
- [numba/llvmlite issue #923 -- Does llvmlite support riscv64?](https://github.com/numba/llvmlite/issues/923)
- [numba/llvmlite issue #785 -- Wheels built with RISC-V support](https://github.com/numba/llvmlite/issues/785)
- [numba/llvmlite PR #797 -- Make RISCV cross-compile tests optional (merged v0.38.0)](https://github.com/numba/llvmlite/issues/797)
- [numba/llvmlite PR #775 -- Add ABIName parameter for RISC-V hard float targets (merged v0.38.0)](https://github.com/numba/llvmlite/issues/775)
- [numba/llvmlite PR #1485 -- Add wheel builder for linux-riscv64 (closed unmerged)](https://github.com/numba/llvmlite/pull/1485)
- [conda-forge/numba-feedstock PR #212 -- MNT: add riscv64 (open, draft)](https://github.com/conda-forge/numba-feedstock/pull/212)
- [conda-incubator/setup-miniconda PR #567 -- Add miniforge for linux-riscv64](https://github.com/conda-incubator/setup-miniconda/pull/567)
- [PyPI -- numba package JSON API](https://pypi.org/pypi/numba/json)
- [packages.ubuntu.com -- numba package search, suite resolute](https://packages.ubuntu.com/search?keywords=numba&suite=resolute&searchon=names&section=all)
- [Debian buildd -- numba riscv64 build status](https://buildd.debian.org/status/package.php?p=numba)
- [RISE Project -- member list](https://riseproject.dev/members/)
- [RISE Project blog -- Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE Project -- wheel_builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project blog -- RP009: LLVM SPEC Optimization on SpacemiT-X60](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [RISE Project blog -- Python Now Officially Supports RISC-V](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [RISE Project blog -- PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE GitLab -- wheel_builder PyPI simple index for numba](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/numba/)
- [riseproject-dev/python-wheels PR #2093 -- exclude numba from vLLM riscv64 CPU requirements](https://github.com/riseproject-dev/python-wheels/pull/2093)
- [riseproject-dev/python-wheels PR #2420 -- skip pymc/flow tests needing numba on riscv64](https://github.com/riseproject-dev/python-wheels/pull/2420)
- [numba documentation -- Installing Numba](https://numba.readthedocs.io/en/stable/user/installing.html)
- [numpy issue #30216 -- riscv64 PyPI wheels, milestone 2.6.0](https://github.com/numpy/numpy/issues/30216)
- [scipy issue #19378 -- riscv64 cross-compilation](https://github.com/scipy/scipy/issues/19378)
- [scipy issue #20423 -- riscv64 LAPACK ABI error (closed not planned)](https://github.com/scipy/scipy/issues/20423)