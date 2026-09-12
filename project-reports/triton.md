---
title: Triton
parent: Project Reports
color: orange
dependencies:
  - name: LLVM
    relation: runtime-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Python
    relation: runtime-dependency
    criticality: critical
  - name: pybind11
    relation: runtime-dependency
    criticality: critical
  - name: PyTorch
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="triton" %}

# Triton

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** orange<br/>
**Optimization level:** absent<br/>
**Scope:** RISC-V (riscv64/linux) support status for Triton<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Triton (`triton-lang/triton`, [triton-lang.org](https://triton-lang.org/)) is a Python-embedded DSL and JIT compiler for writing custom GPU kernels, built on LLVM/MLIR, that lowers to PTX (NVIDIA) and AMDGPU (AMD) targets in-tree. It has no CPU backend in the main repository; a separate out-of-tree repository, `triton-lang/triton-cpu`, provides CPU code generation and is the only part of the Triton ecosystem relevant to a general-purpose CPU architecture such as riscv64.

**Governance.** Triton has no foundation membership - it is not hosted by the Linux Foundation, the PyTorch Foundation, Apache, or any neutral body. It is an independently governed GitHub org created by Philippe Tillet, with a hierarchical structure defined in `CONTRIBUTING.md`: Contributors to Module maintainers (own a subdirectory) to Core maintainers (own the project, set roadmap, can veto module decisions) to a Lead core maintainer (tie-breaker, also appoints/removes core maintainers). The lead maintainer is Phil Tillet (OpenAI). Core maintainers as of 2025-01-30: Jeff Niu, Keren Zhou, Mario Lezcano-Casado, Pawel Szczerbuk, Peter Bell, Phil Tillet, Thomas Raoux, Zahi Moudallal.

**Corporate sponsors** (by maintainer affiliation, GitHub profile plus governance doc): OpenAI controls the lead maintainer seat and a majority of core maintainers (Tillet, Bell, Lezcano-Casado). AMD maintains the in-tree AMD backend. Intel and Huawei (Ascend) maintain out-of-tree backends. Meta contributors are active in the plugin/extension effort. Kernelize.ai (a startup) maintains an out-of-tree CPU backend attempt. Keren Zhou (George Mason University) is the one academic core maintainer. There is no formal corporate-sponsor tier or membership fee structure.

**Community stance on new hardware ports.** `CONTRIBUTING.md` draws a hard line between in-tree modules (AMD backend, Interpreter, Profiler; NVIDIA is implicitly core-maintainer-owned) and out-of-tree modules (CPU backend, Intel backend, Ascend backend), where the module/core-maintainer governance process does not formally apply. An emerging plugin/extension framework (`TRITON_PLUGIN_PATHS`, `triton.backends` entry points, shipped in Triton 3.7) lets new hardware backends be distributed as pip-installable wheels without forking or an upstream merge. At the 2025-11-05 dev meetup, Ettore Tiotto (Intel) is recorded saying "triton is only mostly portable... Intel has AMD, OAI doesn't care about Intel... How to get its backends into triton," and Luka Govedic responded that Triton should become "more of a community similar to vLLM... You shouldn't need to fork to support a new backend." The maintainers are actively building the plugin system specifically to route new/niche architecture ports out-of-tree rather than into the main repo - this is the explicit intended path for any future RISC-V effort. Triton is not a member of the RISE Project (checked against the [riseproject.dev membership roster](https://riseproject.dev/) of 20 members - Triton is absent).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2024-05-16/17 | First (unofficial, unaffiliated) RISC-V experiment: `harishch4/triton-riscv` created; first riscv commit uses `llc -march=riscv64` / QEMU emulation. Email domain suggests affiliation with Morphing Machines (Indian RISC-V/CGRA startup). 8 commits total, dormant. | [harishch4/triton-riscv](https://github.com/harishch4/triton-riscv) |
| 2024-09-24 to 2024-09-27 | PR #152 merged in triton-cpu: 1-D vector-reduction lowering, motivated explicitly by RVV's `vredsum` instruction, but not riscv64-specific itself. | [triton-cpu PR #152](https://github.com/triton-lang/triton-cpu/pull/152) |
| 2024-10-03 to 2024-10-14 | PR #158 merged in triton-cpu: memory-op lowering to `vector.gather`/`vector.scatter`, motivated explicitly by RVV and ARM SVE gather/scatter support, but not riscv64-specific itself. | [triton-cpu PR #158](https://github.com/triton-lang/triton-cpu/pull/158) |
| 2024-10-17 | Terapines Technology (Aries Wu, CTO) presents "Compiling and Optimizing Triton Kernels onto RISC-V Targets Based on MLIR" at RISC-V Summit North America. | [slides (PDF)](https://static.sched.com/hosted_files/riscvsummit2024/0b/202410-RISC-V-NA-Summit-Compiling%20and%20Optimizing%20Triton%20Kernels%20Onto%20RISC-V%20Targets%20Based%20on%20MLIR.pdf) |
| 2024-11-15 | RISC-V International (not RISE) publishes a benchmark write-up of Terapines' Triton-CPU-on-RVV cross-compile work. | [riscv.org blog](https://riscv.org/blog/triton-kernel-performance-on-risc-v-cpu/) |
| 2025-02-23/26 | Issue #218 filed and closed in triton-cpu; the reporter's local project path is literally named `triton-cpu-riscv`, circumstantial evidence of an independent porting effort, but the bug itself (a matplotlib/pandas plotting crash) is architecture-agnostic. | [triton-cpu #218](https://github.com/triton-lang/triton-cpu/issues/218) |
| 2025-04-17 | Issue #233 filed (still open) in triton-cpu: a torch/triton version-pin conflict and an MLIR-dump assertion crash. `RISCV` appears only as one of several `-DLLVM_TARGETS_TO_BUILD` entries the reporter enabled, not as evidence of riscv64 execution. | [triton-cpu #233](https://github.com/triton-lang/triton-cpu/issues/233) |
| 2025-09-30 | Unrelated: `vllm-project/vllm` PR #25816 merged, fixing vLLM's own CPU backend for riscv64 (disables `chunked_prefill`). This is vLLM, not Triton. | [vLLM PR #25816](https://github.com/vllm-project/vllm/pull/25816) |
| 2026-05/06 | Independent, unpublished personal-blog project ("Zevorn") describes adding a qemu-riscv64 backend and a `ConvertDotToRVV` RVV-vectorization pass to triton-cpu. No corresponding public GitHub PR or fork could be located. | [Zevorn blog](https://zevorn.cn/posts/48/) |
| 2026-08-12 | Unofficial fork `Alion-King/triton-riscv-SpacemitK3` created, targeting the SpacemiT K3 SoC (SpacemiT is a RISE General Member, but this fork is unaffiliated with RISE). | [Alion-King/triton-riscv-SpacemitK3](https://github.com/Alion-King/triton-riscv-SpacemitK3) |
| 2026-08-18 | RISE publishes "PyTorch is available on riscv64!" - lists Triton/Inductor integration as unbuilt "phases 3 and 4" of [pytorch/pytorch#180975](https://github.com/pytorch/pytorch/issues/180975), with no benchmark data. | [riseproject.dev](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/) |
| ongoing (as of 2026-09-11) | No tracking issue, PR, or commit for a riscv64 port exists in `triton-lang/triton` or `triton-lang/triton-cpu`. | Live GitHub `search_issues`/`search_pull_requests`/`search_commits`/`search_code`, repo-scoped, multiple query variants, all 0 real hits |

**Key contributors and organizations involved in any RISC-V-adjacent work:** Aries Wu / Terapines Technology (benchmarking, unmerged patch); Harish (harish.ch@morphing.in, apparent Morphing Machines affiliation, personal fork); "Zevorn" (unaffiliated, unpublished blog project); `Alion-King` (unaffiliated fork). None of this activity involves a triton-lang core or module maintainer, and none has produced an upstream PR.

**Is it fully upstream?** No. Nothing riscv64-specific has landed in either official repository. PR #152 and #158 are general-purpose CPU-codegen groundwork whose stated rationale references RVV instruction selection, but they add no riscv64 target, no arch identifier, and no CI.

## 3. Upstream Support Tier

Triton has no formal tier policy for architectures beyond the in-tree/out-of-tree module split described in Section 1. There is no riscv64-specific policy statement anywhere in `CONTRIBUTING.md` or the README. The README's "Compatibility" section lists supported hardware as NVIDIA GPUs (CC 8.0+), AMD GPUs (ROCm 6.2+), and CPUs "under development" - riscv64 is not mentioned as a target platform anywhere.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GPU JIT codegen (PTX/AMDGPU) | full, in-tree | N/A (no ARM-hosted GPU target relevant here) | N/A |
| CPU backend (triton-cpu) codegen | full, hand-tuned (AVX-512, AMX int8/fp16/bf16) | partial (one NEON-gated bf16 dot-product path) | absent (generic scalar fallback only) |
| Upstream CI: build | yes | yes (`ubuntu-22.04-arm` runner) | no |
| Upstream CI: test execution | yes | yes | no |
| Official PyPI wheel | yes (manylinux x86_64) | yes (manylinux aarch64, since Triton 3.5.0) | no |
| GitHub Release binary | no (source tarballs only, all arches) | no | no |

Source: [triton-lang/triton `.github/workflows/wheels.yml`](https://github.com/triton-lang/triton/blob/main/.github/workflows/wheels.yml) (wheel-build matrix), [PyPI `triton` JSON API](https://pypi.org/pypi/triton/json).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Triton's only architecture-specific subsystem relevant to a general-purpose CPU is the out-of-tree CPU backend's ISA-dispatch logic, in `third_party/cpu/backend/compiler.py` of `triton-lang/triton-cpu` (356 lines). Architecture is detected dynamically via `self.cpu_arch = cpu.llvm.get_cpu_triple().split("-")[0]` rather than a hardcoded allowlist, so an unrecognized architecture does not crash - it simply matches no special case.

- **x86_64 - full, hand-tuned.** Dedicated branches for AVX-512 (`add_convert_dot_to_fma`), AMX int8/fp16/bf16 (`add_convert_dot_to_amx`), `avx512bf16`-gated bf16 promotion/decomposition, `avxneconvert`-gated fp conversion, and feature-string-driven unroll/reorder decisions. A code comment states "GPU-only knobs do not affect the generated x86 code," reflecting x86_64 as the implicit default target.
- **aarch64/armv8 - partial.** One dedicated vectorized path, `convert_bf16_dot_product`, gated on `(cpu_arch == "aarch64" or cpu_arch == "armv8") and 'fp-armv8' in cpu_features and 'neon' in cpu_features`, feeding a 496-line `ConvertDotProduct.cpp`. Real but narrower than x86_64 - no AMX-equivalent path.
- **riscv64 - missing.** Zero occurrences of `cpu_arch == "riscv64"` or any RVV/V-extension string anywhere in `compiler.py`, `triton_cpu.cc` (325 lines), `ConvertDotProduct.cpp`, `MathToVecLib.cpp` (476 lines), or `llvm.cc` (234 lines). A riscv64 build silently falls through every branch above to the unconditional `add_convert_dot_generic` - the same catch-all path used for any unrecognized architecture. This is the absence of a feature, not a stub of one.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dot-product / matmul lowering | AMX + AVX-512 FMA, ISA-gated | NEON bf16 dot-product, ISA-gated | generic scalar (`add_convert_dot_generic`) |
| Reduction ops (PR #152 groundwork) | benefits from `vector.reduction` lowering | benefits from `vector.reduction` lowering | benefits from `vector.reduction` lowering (no RVV `vredsum` dispatch exists to exploit it) |
| Gather/scatter memory ops (PR #158 groundwork) | benefits from `vector.gather`/`scatter` lowering | benefits from `vector.gather`/`scatter` lowering | benefits from the same generic lowering (no RVV-specific tuning exists) |
| bf16 conversion path | `avxneconvert`-gated | none found beyond the NEON dot-product path | absent |

The prerequisite-style codegen improvements in PR #152 and #158 are architecture-neutral MLIR lowering changes that any future RVV backend could exploit, but as of the current default branch (`66aa2f8a`), no riscv64 backend exists to exploit them. Source: [triton-cpu source tree](https://github.com/triton-lang/triton-cpu) (`third_party/cpu/backend/compiler.py`), analyzed directly against the cloned repository.

## 5. Build System, Cross-Compilation, and Toolchain

Triton's build is a standard host-native `pip install -e .` (CMake + Ninja under the hood, against a pinned LLVM/MLIR). There is no documented cross-compilation path, no toolchain file, and no Dockerfile targeting riscv64 anywhere in the repository.

- `python/build_helpers.py::get_llvm_package_info()` recognizes only `almalinux-{x64,arm64}`, `macos-{x64,arm64}`, `ubuntu-{x64,arm64}`, and `windows-x64` for its automatic pinned-LLVM download. riscv64 falls through to the `else` branch: "LLVM pre-compiled image is not available... Proceeding with user-configured LLVM from source build" - meaning a riscv64 build has no auto-fetch path at all and requires the user to supply `LLVM_SYSPATH` pointing at a self-built or system LLVM+MLIR that matches Triton's exact pinned commit hash (`b010a18d...`). This degrades gracefully rather than crashing, but it is a structural, Triton-specific build gap independent of any upstream LLVM riscv64 gap.
- `CMakeLists.txt` and everything under `cmake/` contain zero occurrences of "riscv" (case-insensitive). No `cmake/riscv64.cmake` or toolchain file exists.
- Repo-wide case-insensitive grep for `riscv` across the entire tree (excluding `.git`) returns exactly one hit, and it is unrelated to Triton's own build: `third_party/amd/backend/include/hsa/hsa.h:87`, a vendored AMD ROCm HSA runtime header containing a generic architecture-detection preprocessor macro (`#if defined(_M_X64) || defined(__loongarch64) || defined(__riscv)`).
- No `.ci/docker/`, `docker/`, or `Dockerfile.riscv64` exists. The only Dockerfile in the repo is `.github/amd-ci/Dockerfile` (ROCm CI, x86_64).
- `.github/workflows/wheels.yml`'s official wheel-build matrix targets `x86_64` (self-hosted) and `aarch64` (`ubuntu-22.04-arm`) only, via `cibuildwheel` and manylinux_2_28 images. No riscv64 target, no QEMU emulation step.
- No `-DUSE_X=OFF`-style architecture flags exist in the `CMakeLists.txt` build options (`TRITON_BUILD_PYTHON_MODULE`, `TRITON_BUILD_PROTON`, `TRITON_STABLE_ABI`, `TRITON_BUILD_UT`, `TRITON_BUILD_WITH_CCACHE`, `TRITON_OFFLINE_BUILD`, `TRITON_EXT_ENABLED` - none are architecture-specific).

**Known build failures / community workaround:** The only documented riscv64 build path is Terapines' unmerged cross-compile patch in [`Terapines/AI-Benchmark`](https://github.com/Terapines/AI-Benchmark) against a specific triton-cpu commit (`bfb302ff...`), used alongside ZCC 3.2.4 (an in-house LLVM-based compiler). This patch was never submitted as an upstream PR. Source: local clone of `triton-lang/triton` at `/home/user/triton-lang/triton` (HEAD `66aa2f8a62912e821dd974ace5697fe19ac90968`), plus [`python/build_helpers.py`](https://github.com/triton-lang/triton/blob/main/python/build_helpers.py) read directly.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| GPU kernel JIT (PTX/AMDGPU) | yes | N/A | N/A (no GPU relevance to riscv64 hosting) |
| CPU-backend hand-tuned dot-product path | yes (AMX/AVX-512) | yes (NEON, partial) | no (scalar fallback) |
| Auto-fetch of pinned LLVM/MLIR at install time | yes | yes | no (falls back to manual `LLVM_SYSPATH`) |
| Official wheel install (`pip install triton`) | yes | yes | no |
| CI-verified build | yes | yes | no |
| CI-verified test pass | yes | yes | no (no CI exists to verify) |

**Functional gaps.** A riscv64 user cannot `pip install triton` (no wheel exists) and cannot rely on Triton's normal build path to auto-provision a compatible LLVM/MLIR (no riscv64 branch in `build_helpers.py`). A working build requires manually supplying an LLVM/MLIR build matching Triton's exact pinned commit hash - a nontrivial and undocumented prerequisite.

**Performance gaps.** Per Section 4, the CPU backend's dot-product/matmul lowering has no RVV-aware path; execution would use the generic scalar fallback, which the third-party Terapines benchmark (Section 14/Investment discussion below) suggests underperforms a hand-written RVV-vectorized kernel, though that benchmark was run against a patched, non-upstream triton-cpu, not the fallback path itself - see Section 11 for the actual quantitative results, which measure a patched build, not the current unmodified upstream fallback.

**Security hardening gaps.** Data not available: no research was conducted specifically on ASLR, stack-protector, or CFI hardening differences by architecture for Triton's generated code or its own build artifacts.

**NaN / floating-point semantics.** No RISC-V-specific NaN or floating-point correctness bug report was found anywhere in GitHub or web search (`riscv nan floating repo:triton-lang/triton` returned 0 results). This should be read as "untested," not "verified correct" - there is no CI exercising riscv64 execution paths to catch such an issue if one existed.

## 7. CI/CD Infrastructure

**riscv64 CI does not exist** in `triton-lang/triton`. Verified by reading all 10 files in `.github/workflows/` (`build-macos.yml`, `ci.yml`, `create_release.yml`, `documentation.yml`, `integration-tests-amd.yml`, `integration-tests-nvidia.yml`, `llvm-build.yml`, `pre-commit.yml`, `runner-preparation.yml`, `wheels.yml`): zero matches for `riscv`, `riscv64`, `linux/riscv64`, `RISCV`, or `risc-v`, case-insensitive, in any file. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `azure-pipelines*` file exists anywhere in the repository. Runners used across all workflows are exclusively `ubuntu-latest`/`ubuntu-22.04`, `ubuntu-22.04-arm` (aarch64), `macos-15`/`macos-15-intel`, `windows-2022`/`windows-11-arm`, self-hosted AMD GPU runners (`gfx90a`, `gfx942`, `gfx950`), and `nvidia-a100`. No RISE runners are referenced anywhere.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job exists | yes | yes (`ubuntu-22.04-arm`) | no |
| Test suite executed | yes | yes | no |
| Release-blocking | yes | yes | N/A |
| Hardware | native + self-hosted GPU runners | native ARM runner | N/A |
| RISE runners used | no | no | no |

Source: [triton-lang/triton `.github/workflows/`](https://github.com/triton-lang/triton/tree/main/.github/workflows), read in full against the default branch at commit `66aa2f8a`.

## 8. Distribution and Release Status

No official riscv64 binary or package exists for Triton (the GPU compiler) in any channel checked:

- **PyPI:** `https://pypi.org/pypi/triton/json` lists 290 wheel files across versions 0.4.1-3.8.0; wheels are built only for `manylinux*_x86_64` and `manylinux*_aarch64` (aarch64 since 3.5.0). Zero filenames contain "riscv."
- **GitHub Releases:** all checked tags (v3.8.0, v3.7.0, and confirmed-existing v3.7.1/v3.6.0/v3.5.1) ship source tarballs only (`triton-X.Y.Z.tar.gz`, `vX.Y.Z.zip`, `vX.Y.Z.tar.gz`) plus GitHub's auto-generated source archives - no platform-specific binaries at all, for any architecture.
- **RISE wheel builder** (`riseproject.gitlab.io/python/wheel_builder/`): 80 riscv64 packages listed; Triton is not among them. A separate RISE GitLab package-index endpoint for `triton` (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/triton/`) returns HTTP 302, redirecting back to the standard PyPI index - no distinct riscv64 build is served there.
- **Ubuntu 26.04 (Resolute):** three name matches for "triton," none the GPU compiler - `libtritonus-java` (unrelated Java audio library), `libtritonus-jni` (same project's JNI bindings, riscv64-available but unrelated), and `triton-mdata-client` (SmartOS/Joyent cloud metadata client, riscv64-available but unrelated). No `triton`, `python3-triton`, or `libtriton` package exists for the ML compiler on any architecture.
- **Arch Linux RISC-V** (`archriscv.felixc.at`): no mention of "triton" found on the landing/status page; no search endpoint exists to query further [NEEDS VERIFICATION - only the landing page was checked, not an exhaustive package index].

**What a user must do to get a working binary:** build from source, manually supply an `LLVM_SYSPATH` pointing at a self-built or system LLVM+MLIR matching Triton's exact pinned upstream LLVM commit hash (no distro LLVM/MLIR release is guaranteed to match - not independently verified here), and expect the CPU backend to execute the generic scalar fallback path with no RVV acceleration. The only documented starting point for this is the unmerged, non-upstream [Terapines/AI-Benchmark patch](https://github.com/Terapines/AI-Benchmark).

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| LLVM | Build-dependency, critical. JIT/codegen backend core; Triton downloads a pinned custom LLVM build, with a riscv64 fallback to user-supplied `LLVM_SYSPATH` (Section 5). | Ubuntu 26.04 ships `llvm-17` through `llvm-22`-dev and `libmlir-17` through `libmlir-22`(-dev) for riscv64 (substitute check via packages.ubuntu.com; project-graph query unavailable, `CONNECTION_CLOSED`). Caveat: a generic distro LLVM/MLIR is not guaranteed to match Triton's exact pinned commit hash - not independently verified. | No required pre-merge riscv64 CI in `llvm/llvm-project` itself; only QEMU execution scoped to `libc/**` (per `project-reports/llvm.md`, graded yellow). | No official upstream riscv64 release binaries from LLVM; Ubuntu ships riscv64 LLVM/MLIR built from source. | 10 open riscv64 correctness/perf issues cataloged in `project-reports/llvm.md` (none Triton-specific). See that report (color: yellow). |
| CMake | Build-dependency, critical. Drives the entire Triton build. | Zero riscv64-specific logic found in Triton's own `CMakeLists.txt`/`cmake/` tree (confirmed: no toolchain files, no riscv64 options). Data not available: CMake's own upstream riscv64 CI/release status was not independently researched in this pass. | Data not available. | Data not available. | No riscv64-specific issues surfaced for CMake itself in this research. |
| Python | Build-dependency, critical. Host language and packaging system for Triton. | Data not available beyond one relevant RISE finding: RISE's blog post "Python now officially supports RISC-V" (2026-08-24) indicates official upstream RISC-V support was reached for CPython as of that date. | Not independently verified in this pass beyond the above post. | Not independently verified. | [riseproject.dev, "Python now officially supports RISC-V"](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/) [NEEDS VERIFICATION - summarized from a single RISE blog headline, not cross-checked against CPython's own PEP/release notes in this research pass]. |
| pybind11 | Build-dependency, critical (per task specification). | Not found in the analyzed codebase. **Discrepancy:** research of `python/requirements.txt` and the CMake build instead found `nanobind` (`wjakob/nanobind`), exact-pinned at `nanobind==2.10.2`, as the actual Python-C++ binding generator used by the current default branch, invoked via `nanobind_build_library()`. `nanobind-dev`/`python3-nanobind` (2.11.0-3) are Ubuntu `Architecture: all` (header/pure-source, so riscv64-available by inheritance). No pybind11 reference was found anywhere in the cloned repository. | Data not available for pybind11 specifically. `search_issues query:"riscv repo:wjakob/nanobind"` returned 0 results (no known riscv64-specific gaps for the library actually in use). | Data not available for pybind11. nanobind ships as a PyPI sdist plus pure-C++ source build with no riscv64-specific blocker identified. | This is a contradiction between the task's stated direct-dependency list and the live source: Triton's current build uses nanobind, not pybind11. Flagged per verification policy rather than silently substituted. |
| PyTorch | Test-dependency, critical. Used in Triton's own test/benchmark suite and as the primary downstream consumer of Triton via `torch.compile`/Inductor. | RISE ships native riscv64 PyTorch 2.13.0 wheels (`manylinux_2_39_riscv64`, CPython 3.12/3.13/3.14/3.14t), built natively (no cross-compilation). | RISE's full 10-shard test run (2026-08-14): 212,038 test cases, 165,591 passed, 46,256 skipped - "99.998% of enabled tests passing out-of-the-box." Known failures: 69 cache-topology assertions, 15 float-to-int conversion bugs, 9 missing quantization backends, 6 oneDNN-unavailable cases. | RISE-provided riscv64 wheels via `pip install torch --extra-index-url https://pypi.riseproject.dev/simple/`. | Critically, PyTorch's `torch.compile`/Inductor Triton backend is explicitly scoped as unbuilt "phases 3 and 4" future work in [pytorch/pytorch#180975](https://github.com/pytorch/pytorch/issues/180975) and in [RISE's own post](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/) - meaning even though PyTorch itself runs on riscv64, the PyTorch-to-Triton integration that this dependency exists to test does not yet function on riscv64 in either direction. |
| zlib | Indirect (build-dependency of Triton's `libtriton.so`, linked via `target_link_libraries(triton PRIVATE z)`). | `zlib1g`/`zlib1g-dev` ship riscv64 in Ubuntu (per `project-reports/zlib.md`, confirmed noble/resolute). | Only OpenBSD/riscv64 CI via QEMU upstream (no Linux riscv64 CI in zlib's own `configure.yml`). | Source-only upstream releases; Ubuntu/Debian/Arch/Alpine all package riscv64 binaries. | Unmerged RVV Adler32 PR [#1099](https://github.com/madler/zlib/pull/1099), 8+ months no maintainer response; no correctness bugs. See `project-reports/zlib.md` (color: blue). |
| nlohmann/json | Indirect (JSON parsing for Triton's build-config/third-party metadata, pinned to v3.11.3 per `cmake/json-version.txt`). | `nlohmann-json3-dev` (3.12.0) is Ubuntu `Architecture: all` (header-only, available wherever riscv64 apt runs). | One historical riscv64-specific bug, [#3579](https://github.com/nlohmann/json/issues/3579) (a `unicode4` test timeout on StarFive VisionFive hardware), closed and fixed via PRs #3580/#3614 targeted at release 3.11.0 - Triton's pinned 3.11.3 postdates the fix. | Header-only; no compiled release artifact needed. | No dedicated `project-reports/nlohmann-json.md` report exists yet. |
| nanobind | Indirect (actual Python-C++ binding generator in use; see pybind11 row above for the discrepancy). | `nanobind-dev`/`python3-nanobind` (2.11.0-3) are Ubuntu `Architecture: all`. | `search_issues query:"riscv repo:wjakob/nanobind"` returns 0 results - no known riscv64-specific issues. | PyPI sdist plus pure-C++ source build; no riscv64-specific blocker identified. | Not present in the tracked `projects.yml`; no dedicated status report exists. |
| googletest | Indirect (C++ unit-test framework, `TRITON_BUILD_UT` default ON, build/test-time only, not shipped in the Triton wheel). | Ubuntu 26.04 `googletest` 1.17.0-1build1 explicitly lists riscv64 (source package, `arch: all`, not a compiled binary check). | One open bug, [#3756](https://github.com/google/googletest/issues/3756): `GetThreadCount()` returns 0 on riscv64 (low severity, only suppresses a death-test warning); maintainer stated riscv64 "not officially supported." | Source tarballs only, all arches. | See `project-reports/googletest.md` (color: yellow) for a segfault caveat under `GTEST_HAS_ABSL=ON`, not Triton's default configuration. |

**Note on the project-graph service:** `mcp__project-graph__project_graph_query` returned `CONNECTION_CLOSED` throughout this research (4 retries) - a connectivity failure, not evidence of missing data. All "riscv64 build" facts above marked as "substitute" were obtained via direct `packages.ubuntu.com` lookups instead. This should be re-run against the graph service once reconnected.

**Summary:** the single most consequential riscv64 gap specific to Triton itself is structural, not inherited from a dependency - `python/build_helpers.py` has no riscv64 branch in its LLVM-prebuilt-selection logic (Section 5). Of the dependencies proper, LLVM (yellow) is the only one with a substantive riscv64 CI/release gap of its own; zlib, nlohmann/json, nanobind, and googletest are all functionally sound on riscv64, with only low-severity or already-fixed issues.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [triton-cpu PR #158](https://github.com/triton-lang/triton-cpu/pull/158) | Lower memory ops with vector gather and scatter | merged (2024-10-14) | N/A (enhancement) | Explicitly RVV/SVE-motivated codegen groundwork; not riscv64-specific, no riscv64 backend added. |
| [triton-cpu PR #152](https://github.com/triton-lang/triton-cpu/pull/152) | Use 1-D vector reduction op to convert reduce op | merged (2024-09-27) | N/A (enhancement) | Explicitly RVV `vredsum`-motivated codegen groundwork; not riscv64-specific. |
| [triton-cpu #218](https://github.com/triton-lang/triton-cpu/issues/218) | Error occurred while plotting in `triton.testing.Benchmark` | closed/completed (2025-02-26) | low | Architecture-agnostic matplotlib/pandas bug; reporter's directory literally named `triton-cpu-riscv`, circumstantial evidence of an independent port attempt, but the bug itself is not riscv64-specific. |
| [triton-cpu #233](https://github.com/triton-lang/triton-cpu/issues/233) | Incompatibility for torch 2.6 and triton-cpu 3.3 | **open** (since 2025-04-17) | medium (build-blocking for the reporter) | `RISCV` appears only as one of several `-DLLVM_TARGETS_TO_BUILD` entries; the actual bug is a pip version-pin conflict plus an `MLIR_DUMP_PATH` assertion crash, unrelated to riscv64 execution. No maintainer response recorded. |
| [triton/triton #5540](https://github.com/triton-lang/triton/pull/5540) | [BACKEND] Update LLVM version to 2fe947b4 | merged (2025-01-13) | N/A | Confirmed false positive - matched only via semantic search noise; zero RISC-V content in body, diff, or comments. |
| [triton/triton #3513](https://github.com/triton-lang/triton/issues/3513) | Assertion `parentOp->getNumRegions()==1` failed | closed, not_planned | N/A | Confirmed false positive - a PowerPC (ppc64le) MLIR crash; `RISCV` appears only inside the reporter's `LLVM_TARGETS_TO_BUILD` cmake flag, one of five enabled LLVM codegen targets. |
| [triton/triton #5483](https://github.com/triton-lang/triton/issues/5483) | FP64 support | closed (2026-05-12) | N/A | Confirmed false positive - about missing FP64 `tl.dot` support on A100; no RISC-V content. |
| [vllm-project/vllm #25816](https://github.com/vllm-project/vllm/pull/25816) | [Fix] Improve CPU backend compatibility for RISC-V | merged (2025-09-30) | N/A | **Not a Triton issue** - this is vLLM's own CPU backend fix (disables `chunked_prefill` on riscv64), unrelated to `triton-lang/triton`. Listed here only because it surfaced as a false lead during research. |

**Correctness bugs:** none found that are both open and riscv64-specific. No riscv64 NaN/floating-point correctness issue was found anywhere (GitHub or web search). This reflects absence of testing, not a verified-correct state, since no CI exercises riscv64 execution paths.

**Qualitative limitations noted in third-party benchmark work (not filed as GitHub issues):** register spill under memory pressure on RVV; fixed-length-vector constraints requiring extra masked-load instructions (hurts RoPE, Layernorm); difficulty vectorizing discrete/strided memory access; multithreading context-storage overhead capping scaling beyond about 4 threads (RoPE); sub-optimal instruction selection versus hand-vectorized C - unfused `vfmul+vfadd` instead of `vfmadd` (Layernorm), unfused `vmul+vwadd` instead of `vwmacc` (Correlation), causing the patched Terapines build to trail GCC/ZCC by roughly 10-29% on those specific kernels at higher thread counts. Source: [Terapines RISC-V Summit NA 2024 slides](https://static.sched.com/hosted_files/riscvsummit2024/0b/202410-RISC-V-NA-Summit-Compiling%20and%20Optimizing%20Triton%20Kernels%20Onto%20RISC-V%20Targets%20Based%20on%20MLIR.pdf) and [RISC-V International's summary](https://riscv.org/blog/triton-kernel-performance-on-risc-v-cpu/).

Benchmark detail (patched, non-upstream triton-cpu build, ZCC 3.2.4, SpacemiT K1, RVA22, 256-bit RVV 1.0, `-O3`, 1-thread throughput GB/s unless noted):

| Kernel | GCC | ZCC | Triton-CPU (patched) | Triton vs GCC | Triton vs ZCC |
|---|---|---|---|---|---|
| RoPE | 0.01874 | 0.01871 | 0.01825 | approx. -2.6% (T1); +15-18% at T4/T8 | -9 to -13% at T4/T8 |
| Matmul | 0.03113 | 0.02568 | 0.03716 | +14 to +21% (all thread counts) | +33 to +44% |
| Softmax | 0.00200 | 0.00202 | 0.00207 | +2.5 to +3.5% (T8: GCC +2%) | +3 to +5% |
| Layernorm | 0.0047 | 0.0057 | 0.0053 | +13% (T1); -20 to -22% at T4/T8 | -7% (T1); -21 to -29% at T4/T8 |
| Resize | 0.0011 | 0.0036 | 0.0035 | +190 to +315% (approx. 3x) | approx. -1.6 to -3.7% |
| Warp | 0.007 | 0.012 | 0.015 | +56 to +109% | +9 to +20% |
| Correlation | 0.0043 | 0.0040 | 0.0039 | -10% (GCC faster overall) | T8: +20%, else approx. par |

This benchmark used Terapines' unmerged, non-upstream patch to triton-cpu, not the current unmodified upstream fallback path described in Section 4 - it should not be read as characterizing the performance of `pip install`-able Triton on riscv64 today, since no such installable build exists.

## 12. Objections and Upstream Blockers

**Stated objections:** none specific to RISC-V. No riscv64 proposal has ever been submitted to `triton-lang/triton` or `triton-lang/triton-cpu`, so there is no maintainer objection to a riscv64 port on record.

**Technical blockers:**
- No auto-fetch path for a pinned, ABI-compatible LLVM/MLIR on riscv64 (`python/build_helpers.py`), requiring a manually built, exactly-matched toolchain.
- No riscv64 ISA-dispatch branch in the CPU backend's codegen (Section 4) - a functioning riscv64 build would run scalar fallback code only, with no RVV acceleration.
- No riscv64 wheel on PyPI and no riscv64 CI to validate any future contribution.

**Organizational blockers:**
- Triton's out-of-tree module policy (Section 1) means a RISC-V CPU backend, if pursued, would be steered out-of-tree by design (per the plugin/extension framework, `triton.backends` entry points) rather than merged into the module/core-maintainer-governed main repo - consistent with how the CPU, Intel, and Ascend backends are already handled.
- The CPU backend itself is not a first-class in-tree citizen (per Ettore Tiotto's quoted meetup remarks), so a RISC-V target would be competing for out-of-tree attention alongside Intel, Apple GPU, and Kernelize.ai's own CPU-backend effort - no dedicated engineering resource is currently allocated to it by any of Triton's corporate maintainers (OpenAI, AMD, Intel, Meta, Huawei).
- Triton is not a RISE Project member, so there is no existing funded-engagement or CI-runner relationship to build on (contrast PyTorch, which has active RISE involvement per Section 9's PyTorch row).

**Acceptance probability:** Low to moderate, and contingent entirely on the out-of-tree plugin path rather than a mainline merge. Given the explicit maintainer preference (Section 1) for routing new hardware backends through `TRITON_PLUGIN_PATHS`/`triton.backends` rather than in-tree PRs, a RISC-V CPU backend built and published as a separate pip-installable package (analogous to the unmerged Apple GPU backend and the CPU backend "looking for collaborators" already hosted in `triton-ext`) is architecturally the most plausible path - it would not require core-maintainer approval of an in-tree change, only adoption of the existing plugin interface.

## 13. Readiness Assessment

- **Color:** orange (optimization-absent) - from skill output
- **Release provider:** none - from skill output
- **Optimization level:** absent. No RISC-V-specific code exists in `third_party/cpu/backend/compiler.py` or any file it drives; the dot-product/matmul lowering (the operation the CPU backend exists to accelerate) falls entirely to the generic scalar `add_convert_dot_generic` path on riscv64, versus hand-tuned AMX/AVX-512 on x86_64 and a NEON-gated bf16 path on aarch64. The ISA extension that would close this gap is RVV 1.0 (the vector extension already targeted by the unmerged Terapines patch and by PRs #152/#158's architecture-neutral groundwork).
- **Justification:** No upstream riscv64 CI exists in `triton-lang/triton` - confirmed by reading all 10 files in [`.github/workflows/`](https://github.com/triton-lang/triton/tree/main/.github/workflows) (zero riscv mentions; runners limited to x86_64, aarch64, macos, windows). No riscv64 release artifact exists on any channel checked: [PyPI](https://pypi.org/pypi/triton/json) (x86_64/aarch64 wheels only), [GitHub Releases](https://github.com/triton-lang/triton/releases) (source tarballs only), the RISE wheel builder (80 packages, Triton absent), or any Linux distribution (no `triton`/`python3-triton`/`libtriton` package exists under any architecture). Independently, the CPU backend's ISA-dispatch code (`third_party/cpu/backend/compiler.py`) has zero riscv64 branches, confirming optimization-absent even setting the CI finding aside.
- **Pending work that could change the grade:** Terapines Technology's unmerged cross-compile patch ([`Terapines/AI-Benchmark`](https://github.com/Terapines/AI-Benchmark)) and the architecture-neutral codegen groundwork already merged in triton-cpu (PR #152, PR #158) are the two concrete technical assets a future riscv64 effort could build on. The independent 2026 blog project (Zevorn) claims a `ConvertDotToRVV` pass and qemu-riscv64 backend but has no located public repository, so it cannot be verified or relied upon. A RISC-V Summit Europe 2026 poster submission ("End-to-End ML Graph Compiler Fused with Triton Kernel Compiler for RISC-V," Hualin Wu) signals continued third-party interest but publishes no benchmark data yet. No RISE involvement, funding, or CI-runner allocation toward Triton exists as of this report (RISE's own PyTorch riscv64 post lists Triton/Inductor integration as unbuilt future work). None of this pending work has been submitted as an upstream PR, so none of it currently moves the grade above orange.

## 14. Investment Analysis

RISE has not funded or performed any riscv64 work on Triton (Section 1, Section 9's PyTorch row, and the RISE-membership check all confirm this). Nothing here overlaps with existing RISE investment; the estimates below are full-scope.

### 14.1 Functional Enablement
- Add a riscv64 branch to `python/build_helpers.py::get_llvm_package_info()` (auto-detect or document a manual `LLVM_SYSPATH` workflow cleanly, rather than the current silent fallback).
- Add a `cpu_arch == "riscv64"` branch to `third_party/cpu/backend/compiler.py` that at minimum verifies correct (if unoptimized) scalar-fallback code generation on riscv64 hardware, establishing a working, testable baseline.
- Add riscv64 to the `wheels.yml` build matrix so a `pip install triton` wheel becomes possible.
- Upstream the Terapines cross-compile patch (currently sitting unmerged in `Terapines/AI-Benchmark`) as a starting point, since it is the only real evidence of a working riscv64 build path.

### 14.2 Performance Optimization
- Build a genuine RVV-vectorized dot-product/reduction path in the CPU backend, extending the architecture-neutral groundwork already merged upstream (PR #152's `vector.reduction` lowering, PR #158's gather/scatter lowering) with an actual `cpu_arch == "riscv64"` dispatch branch analogous to the existing aarch64 NEON path.
- Address the specific instruction-selection gaps documented in the Terapines benchmark (Section 11): fused `vfmadd` instead of separate `vfmul`+`vfadd` (Layernorm), fused `vwmacc` instead of separate `vmul`+`vwadd` (Correlation), and multithreading/memory-bandwidth scaling beyond 4 threads (RoPE, Layernorm, Correlation).

### 14.3 CI/CD Infrastructure
- Add a riscv64 job to `.github/workflows/wheels.yml` and `ci.yml`, initially build-only (yellow-equivalent), then test-executing once the functional-enablement work above lands.
- RISE riscv64 CI runners (announced [2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) are a directly applicable, already-existing resource that Triton could adopt at low incremental cost, since Triton is not currently using them.

### 14.4 Ecosystem Enablement
Triton's primary downstream consumer relevant to riscv64 is PyTorch's `torch.compile`/Inductor backend, which already has riscv64 wheels via RISE (Section 9) but explicitly excludes Triton integration as unbuilt "phases 3 and 4" work in [pytorch/pytorch#180975](https://github.com/pytorch/pytorch/issues/180975). Enabling Triton on riscv64 is a prerequisite for closing that specific PyTorch gap; the two efforts should be coordinated rather than treated as independent (this is a downstream-consumer dependency, not a package-manager ecosystem in the sense of Section 10, which is accordingly omitted from this report per the project's nature as a standalone compiler toolchain).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 branch to `build_helpers.py` LLVM auto-fetch/`LLVM_SYSPATH` handling | 1-2 | Triton CPU-backend maintainers or a new contributor | High |
| Functional | Add `cpu_arch == "riscv64"` scalar-fallback dispatch branch and validate correctness on real/QEMU riscv64 hardware | 2-4 | Triton CPU-backend maintainers | High |
| Functional | Upstream and generalize the Terapines cross-compile patch; add riscv64 to `wheels.yml` | 2-3 | Triton CPU-backend maintainers, with Terapines collaboration | High |
| Performance | RVV-vectorized dot-product/reduction/gather-scatter dispatch path (building on PR #152/#158) | 4-8 | Triton CPU-backend maintainers or Terapines | Medium |
| Performance | Close specific instruction-selection gaps (fused `vfmadd`/`vwmacc`) and multithreading scaling issues found in the Terapines benchmark | 3-6 | Triton CPU-backend maintainers | Medium |
| CI/CD | Add riscv64 build-only CI job using RISE runners | 1-2 | Triton infra maintainers | High |
| CI/CD | Extend to full test execution once functional work lands | 1-2 | Triton infra maintainers | Medium |
| Ecosystem | Coordinate with PyTorch's Inductor/Triton riscv64 tracking (pytorch/pytorch#180975 phases 3/4) | 2-4 (coordination, not implementation) | RISE or a joint PyTorch/Triton contributor | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [triton-lang/triton (GitHub)](https://github.com/triton-lang/triton)
- [Triton homepage](https://triton-lang.org/)
- [triton-lang/triton-cpu (GitHub)](https://github.com/triton-lang/triton-cpu)
- [triton-lang/triton `.github/workflows/`](https://github.com/triton-lang/triton/tree/main/.github/workflows)
- [triton-lang/triton `python/build_helpers.py`](https://github.com/triton-lang/triton/blob/main/python/build_helpers.py)
- [triton-lang/triton CONTRIBUTING.md governance structure](https://github.com/triton-lang/triton/blob/main/CONTRIBUTING.md)
- [PyPI `triton` package JSON API](https://pypi.org/pypi/triton/json)
- [PyPI `triton` simple index](https://pypi.org/simple/triton/)
- [RISE wheel builder, supported packages](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu 26.04 (Resolute) package search: Triton](https://packages.ubuntu.com/search?keywords=Triton&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package repository](https://archriscv.felixc.at/)
- [riseproject.dev membership page](https://riseproject.dev/)
- [triton-cpu PR #158, gather/scatter lowering](https://github.com/triton-lang/triton-cpu/pull/158)
- [triton-cpu PR #152, 1-D vector reduction lowering](https://github.com/triton-lang/triton-cpu/pull/152)
- [triton-cpu Issue #218](https://github.com/triton-lang/triton-cpu/issues/218)
- [triton-cpu Issue #233](https://github.com/triton-lang/triton-cpu/issues/233)
- [triton/triton PR #5540 (false positive)](https://github.com/triton-lang/triton/pull/5540)
- [triton/triton Issue #3513 (false positive)](https://github.com/triton-lang/triton/issues/3513)
- [triton/triton Issue #5483 (false positive)](https://github.com/triton-lang/triton/issues/5483)
- [vllm-project/vllm PR #25816 (unrelated to Triton)](https://github.com/vllm-project/vllm/pull/25816)
- [harishch4/triton-riscv](https://github.com/harishch4/triton-riscv)
- [Alion-King/triton-riscv-SpacemitK3](https://github.com/Alion-King/triton-riscv-SpacemitK3)
- [xlinsist/triton-benchmark (archived)](https://github.com/xlinsist/triton-benchmark)
- [Terapines/AI-Benchmark](https://github.com/Terapines/AI-Benchmark)
- [Terapines RISC-V Summit NA 2024 slides (PDF)](https://static.sched.com/hosted_files/riscvsummit2024/0b/202410-RISC-V-NA-Summit-Compiling%20and%20Optimizing%20Triton%20Kernels%20Onto%20RISC-V%20Targets%20Based%20on%20MLIR.pdf)
- [Terapines RISC-V Summit NA 2024 session listing](https://riscvsummit2024.sched.com/event/1iYuM/bridging-the-gap-compiling-and-optimizing-triton-kernels-onto-risc-v-targets-based-on-mlir-aries-wu-terapines-technology-co-ltd)
- [RISC-V International blog: "Triton kernel performance on RISC-V CPU"](https://riscv.org/blog/triton-kernel-performance-on-risc-v-cpu/)
- [Zevorn personal blog: "From Zero to Delivery"](https://zevorn.cn/posts/48/)
- [RISC-V Summit Europe 2026 posters page](https://riscv-europe.org/summit/2026/posters)
- [riseproject.dev: "PyTorch is available on riscv64!"](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [riseproject.dev: "Python now officially supports RISC-V"](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [riseproject.dev: "Announcing the RISE RISC-V Runners"](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [pytorch/pytorch Issue #180975, RISC-V enablement tracking](https://github.com/pytorch/pytorch/issues/180975)
- `project-reports/llvm.md` (internal report, color: yellow)
- `project-reports/zlib.md` (internal report, color: blue)
- `project-reports/googletest.md` (internal report, color: yellow)
- [nlohmann/json Issue #3579 (closed, fixed)](https://github.com/nlohmann/json/issues/3579)
- [googletest Issue #3756](https://github.com/google/googletest/issues/3756)
- [madler/zlib PR #1099 (unmerged RVV Adler32)](https://github.com/madler/zlib/pull/1099)
