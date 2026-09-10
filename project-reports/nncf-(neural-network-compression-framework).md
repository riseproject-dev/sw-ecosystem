---
title: NNCF (Neural Network Compression Framework)
parent: Project Reports
color: green
dependencies:
  - name: PyTorch
    relation: runtime-dependency
    criticality: critical
  - name: OpenVINO Runtime
    relation: runtime-dependency
    criticality: critical
  - name: ONNX
    relation: build-dependency
    criticality: optional
  - name: ONNX (format/schema)
    relation: build-dependency
    criticality: optional
  - name: NumPy
    relation: build-dependency
    criticality: optional
  - name: SciPy
    relation: build-dependency
    criticality: optional
  - name: scikit-learn
    relation: build-dependency
    criticality: optional
  - name: safetensors
    relation: build-dependency
    criticality: optional
  - name: torchvision
    relation: build-dependency
    criticality: optional
  - name: torchaudio
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="nncf-(neural-network-compression-framework)" %}

# NNCF (Neural Network Compression Framework)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for NNCF (Neural Network Compression Framework)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

NNCF (Neural Network Compression Framework) is a post-training quantization, quantization-aware training (QAT), pruning, and sparsity toolkit for neural network models, operating on model graphs from PyTorch, ONNX, OpenVINO IR, and TensorFlow. It is developed and maintained solely by Intel as part of the OpenVINO(TM) toolkit, hosted under the [openvinotoolkit GitHub org](https://github.com/openvinotoolkit/nncf), licensed Apache-2.0.

The project has no foundation affiliation (no Linux Foundation, LF AI and Data, or PyTorch Foundation membership) and no formal governance charter beyond a two-line `CODEOWNERS` file (`* @openvinotoolkit/nncf-maintainers`, `CODEOWNERS @openvinotoolkit/nncf-admins`). `CONTRIBUTING.md` describes only a generic PR/CI process, with no documented criteria for maintainer status and no architecture-tiering or platform-support policy. NNCF is not a member project of the RISE Project; the RISE member list (8 premier members including Google, NVIDIA, Qualcomm, SiFive, Tenstorrent; 12 general members including Canonical, SpacemiT, Andes) contains neither Intel nor OpenVINO/NNCF, confirmed by fetching [riseproject.dev/members](https://riseproject.dev/members/).

On new-architecture ports generally, there is no documented community stance: the contribution process is architecture-agnostic in its own description, and NNCF's actual hardware reach is inherited entirely from whichever backend framework (OpenVINO, PyTorch, ONNX Runtime) the user has installed, rather than gated by anything NNCF itself implements.

## 2. Port History and Upstreaming Timeline

No riscv64 port exists and none has ever been attempted for NNCF itself.

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64-related commit, PR, or issue found in the repository's history | [GitHub search: `riscv repo:openvinotoolkit/nncf`](https://github.com/search?q=riscv+repo%3Aopenvinotoolkit%2Fnncf&type=code) (0 results, all query variants) |

There are no key contributors to identify because no such thread exists. Nothing to report as "fully upstream" or "not upstream" - the concept does not apply because no port has ever been proposed. Note the distinction: NNCF is *architecture-independent by construction* (pure Python), not *ported to riscv64* through explicit engineering effort.

## 3. Upstream Support Tier

No formal tier policy exists (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/`; the `docs/` tree contains only `Algorithms.md`, `FAQ.md`, `Installation.md`, `ModelZoo.md`, `NNCFArchitecture.md`, `PyPiPublishing.md`). The README documents support only in terms of OS (Linux, Windows, macOS) and backend framework (OpenVINO, PyTorch, TorchFX, ONNX); it does not enumerate CPU architectures at all. Architecture support is implicit and inherited from whichever backend is installed.

CI evidence: all 24 workflow files in `.github/workflows/` use only `ubuntu-latest`, `ubuntu-20.04`/`22.04`, `windows-latest`/`windows-2025`, and `macos-latest`/`macos-14` runners - no riscv64 self-hosted runner, no QEMU riscv64 emulation, and (per `install.yml`'s explicit runner matrix `["windows-latest", "ubuntu-latest"]`) no arm64 job either. Release evidence: [PyPI JSON metadata](https://pypi.org/pypi/nncf/json) shows every release (checked across 30+ historical versions, 1.4 through 3.3.0) publishes only `nncf-<version>-py3-none-any.whl` and `nncf-<version>.tar.gz` - a universal wheel with no platform tag of any kind.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes (x86_64 runners) | no dedicated CI (inherits universal wheel) | no dedicated CI (inherits universal wheel) |
| CI tests | yes | no dedicated CI | no dedicated CI |
| Official binary | universal `py3-none-any` wheel (same artifact for all arches) | same universal wheel | same universal wheel |

Because NNCF ships one architecture-independent artifact for all platforms, the amd64/arm64/riscv64 distinction that applies to compiled packages does not apply here - all three columns receive the same wheel from the same PyPI release.

## 4. Technical Architecture and RISC-V-Specific Subsystems

NNCF's only native (non-Python) code is 7 small C/C++/CUDA files, all under `src/nncf/torch/extensions/`, totaling under 250 lines: `include/dispatch.h` (dtype dispatch macro), `include/common_defs.h` (CHECK_CPU/CHECK_CUDA macros), `include/common_cpu_funcs.h`, `src/common/cpu/tensor_funcs.cpp` (generic ATen tensor sums), `src/quantization/cpu/functions_cpu.cpp` (fake-quantize forward/backward via generic ATen ops), `src/quantization/cuda/functions_cuda.cpp`, and `src/quantization/cuda/functions_cuda_impl.cu`.

Verified by direct read of all 7 files plus a repo-wide grep: zero `#ifdef`/`#if defined` architecture guards exist anywhere in the codebase, for any architecture - not `__riscv`, but also not `__x86_64__`, `__aarch64__`, or `__arm__`. Confirmed three independent ways: local `grep -r` across the entire cloned repo (0 hits for riscv, 0 hits for x86_64/amd64/aarch64/arm64 combined), plus [GitHub code search for `__riscv`](https://github.com/search?q=__riscv+repo%3Aopenvinotoolkit%2Fnncf&type=code) (0 results) and for `__aarch64__ OR __x86_64__` (0 results). This tiny extension is JIT-compiled at import time via `torch.utils.cpp_extension` against whatever host compiler is present; its only "arch"-adjacent variable is `TORCH_CUDA_ARCH_LIST` (NVIDIA GPU compute capability, unrelated to CPU ISA).

There is no JIT code generator, no SIMD intrinsics, no crypto, no GC, and no assembly in NNCF itself. NNCF has **no per-CPU-architecture native backend of any kind** - not for x86_64, not for arm64, not for riscv64 - by design, not by omission. All numeric execution (and any architecture-specific SIMD/JIT work, including RVV) is delegated to the backend frameworks NNCF operates on top of (PyTorch, ONNX Runtime, OpenVINO Runtime).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| NNCF core (Python compression algorithms) | full | full | full (pure Python, arch-agnostic) |
| PyTorch CPU extension (quantization fwd/bwd) | scalar (generic ATen, no intrinsics) | scalar (generic ATen, no intrinsics) | scalar-if-buildable; untested by NNCF's own CI on any channel |
| CUDA extension | full (GPU-only path, irrelevant to CPU arch) | full | N/A (no RISC-V GPUs in scope) |

Note for context (not NNCF code): the OpenVINO runtime that NNCF optionally targets as a backend does carry substantial RISC-V RVV JIT-emitter work under `openvinotoolkit/openvino`'s `src/plugins/intel_cpu/src/emitters/plugin/riscv64/` and `.../snippets/riscv64/` (Xbyak_riscv-based). This is a separate repository and separate pip/conda dependency from NNCF; it does not affect NNCF's own architecture classification.

## 5. Build System, Cross-Compilation, and Toolchain

NNCF has no CMake build system, no toolchain files, and no Dockerfiles. Verified directly against the local clone (`/home/user/openvinotoolkit/nncf`, commit `0d137f946db5447f72546852bbb6cb512122f45a`):
- `find . -iname "CMakeLists.txt"` - no results
- `find . -iname "*.cmake" -o -ipath "*cmake*"` - no results
- `find . -iname "Dockerfile*"` - no results
- `grep -ril "riscv" .` (whole repo, case-insensitive) - no results

The build backend is `setuptools.build_meta` (`pyproject.toml`), and the package classifier declares `Operating System :: OS Independent`. Installation is `pip install nncf` or `pip install .` - no cross-compilation toolchain, no QEMU usage, and no architecture-specific build documentation exist because none is applicable. `docs/Installation.md` documents only plain `pip install`/`conda install`, with no architecture-specific steps; `BUILDING.md`, `docs/building.md`, and `docs/cross-compilation.md` do not exist in the repository.

There are no known riscv64 build failures because riscv64 build attempts against NNCF itself do not appear anywhere in the project's history (no issue, PR, or commit references it).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| pip-installable | yes | yes | yes (same universal wheel) |
| Post-training quantization / QAT / pruning / sparsity algorithms | full | full | full (identical Python code path) |
| Optional PyTorch C++ extension (fake-quantize CPU kernel) | untested by NNCF CI on any arch beyond x86_64 test runners | not exercised by NNCF's own CI | not exercised by NNCF's own CI; buildability contingent entirely on upstream PyTorch + local C++ toolchain |

There are no functional gaps in NNCF's own Python code between architectures - it is arch-agnostic by construction. The practical gap for a riscv64 user is entirely in the backend ecosystem: PyTorch has no official riscv64 PyPI wheel and open RVV correctness/coverage gaps ([PyTorch PR #175746](https://github.com/pytorch/pytorch/pull/175746), [PR #174275](https://github.com/pytorch/pytorch/pull/174275)); OpenVINO Runtime has no official binary package on any channel for any architecture and requires building from source; ONNX Runtime has no official riscv64 PyPI wheel and open SGEMM/device-discovery issues ([PR #28655](https://github.com/microsoft/onnxruntime/pull/28655), [issue #26187](https://github.com/microsoft/onnxruntime/issues/26187)). None of this blocks `pip install nncf` itself, but it constrains what a riscv64 user can actually do with NNCF once installed (see Section 9).

No NaN/floating-point semantics issues were found in NNCF's own issue tracker for any architecture (Section 11).

## 7. CI/CD Infrastructure

No riscv64 CI exists for NNCF at any level. Verified by reading all 24 workflow files in `.github/workflows/` (`api_changes_check.yml`, `api_set_label.yml`, `assign_issue.yml`, `build_and_publish_doc.yml`, `build_html_doc.yml`, `call_precommit.yml`, `call_precommit_windows.yml`, `call_summary.yml`, `check_documentation.yml`, `conformance_weight_compression.yml`, `examples.yml`, `executorch.yml`, `gptqmodel.yml`, `helper_add_job_link.yml`, `helper_compare_requirements.yml`, `install.yml`, `labeler.yml`, `macos.yml`, `mypy.yml`, `nightly.yml`, `pre-commit-linters.yml`, `precommit.yml`, `python-publish.yml`, `sdl.yml`, `weekly.yml`) plus confirming the absence of `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/`, `azure-pipelines.yml`, and `.travis.yml` in the repo.

All `runs-on:` declarations across all 24 files: `ubuntu-latest`, `ubuntu-latest-8-cores`, `ubuntu-latest-16-cores`, `windows-2025` variants, `windows-latest`, `macos-14`, and `aks-linux-6-cores-55gb-gpu-a10` (Azure AKS x86_64 GPU nodes). No self-hosted riscv64 runner label, no `arch: riscv64` matrix dimension, and no QEMU (`docker/setup-qemu-action` or `--platform linux/riscv64`) step anywhere. No RISE runner reference of any kind.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes | no dedicated job | no dedicated job |
| CI tests | yes | no dedicated job | no dedicated job |
| Release-blocking | yes (x86_64 runners gate merges) | N/A | N/A |
| Hardware | GitHub-hosted x86_64 | N/A | N/A |

Because the shipped artifact is a single universal wheel, there is no architecture-specific CI matrix for any architecture other than the x86_64 test-execution runners used to validate the Python code itself.

## 8. Distribution and Release Status

**PyPI** (primary and only official channel): [pypi.org/pypi/nncf/json](https://pypi.org/pypi/nncf/json) - latest release 3.3.0 (Aug 2026); every version from 1.4 through 3.3.0 (30+ releases checked) publishes only `nncf-<version>-py3-none-any.whl` and `nncf-<version>.tar.gz`. This universal wheel installs and runs on riscv64 exactly as it does on amd64 or arm64, because it contains no compiled/platform-specific code.

**GitHub releases**: the 5 most recent releases (v3.3.0, v3.2.0, v3.1.0, v3.0.0, v2.19.0), each shows "2 assets" consistent only with GitHub's standard auto-generated source zip/tar.gz - no custom uploaded binaries of any kind, let alone riscv64-named ones.

**RISE Python wheel builder** ([gitlab.com/.../packages/pypi/simple/nncf/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/nncf/)): returns HTTP 302, redirecting to the real PyPI - this GitLab project does not host an `nncf` package of its own, confirming NNCF is absent from RISE's [85-package wheel_builder list](https://riseproject.gitlab.io/python/wheel_builder/).

**Ubuntu 26.04 ("resolute")**: [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=nncf&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" - no `nncf`, `python3-nncf`, or `libnncf` package exists for any architecture, not just riscv64.

**Arch Linux RISC-V port**: query mechanism did not execute a filtered search against `archriscv.felixc.at` (static content only returned) - inconclusive, not a confirmed positive or negative. [NEEDS VERIFICATION]

**What a riscv64 user must do to get a working install:** run `pip install nncf` - the same universal wheel installs identically to any other architecture, no special steps required. What that install can subsequently *do* is bounded by whichever backend (PyTorch, ONNX Runtime, OpenVINO) the user separately installs, none of which have official riscv64 PyPI wheels (Section 9).

## 9. Dependencies

| Dependency | Role in NNCF | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| PyTorch (`torch==2.10.0`) | Primary quantization/compression backend | Tier 3, community cross-compile CI | QEMU-only, non-release-blocking | No official PyPI riscv64 wheel; [Debian sid has a package](https://tracker.debian.org/pkg/pytorch) | Active; master tracking issue [pytorch/pytorch#180975](https://github.com/pytorch/pytorch/issues/180975) |
| OpenVINO Runtime (`openvino==2026.3.1`) | Native NNCF backend | Experimental, build CI via QEMU, not release-blocking | QEMU-only, narrow filter | No official binary on any channel, any architecture - source build only | JIT emitter coverage incomplete (~34 tracked good-first-issues) |
| ONNX Runtime (`onnxruntime==1.23.2`/`1.24.3`) | ONNX-format inference backend | Experimental/community, no official test matrix entry | Build-only cross-compile, no riscv64 QEMU CI job upstream | No official PyPI riscv64 wheel | Open PR [#28655](https://github.com/microsoft/onnxruntime/pull/28655), open issue [#26187](https://github.com/microsoft/onnxruntime/issues/26187) |
| ONNX (schema, `onnx==1.22.0`) | Model format/schema library | Low risk, minimal native surface | N/A | RISE wheel builder covers `onnx` riscv64 wheels | Low priority |
| NumPy (`numpy>=1.24.0,<2.5.0`) | Root numerics dependency | Tier 3 per NEP 57 (May 2026); native RISE CI wheel workflow | CI runs on RISE riscv64 runners but `continue-on-error: true` (non-blocking) | No official riscv64 PyPI wheel yet ([tracking issue #30216](https://github.com/numpy/numpy/issues/30216) open); RISE wheel_builder provides unofficial wheels | No RVV backend in NPYV SIMD layer - scalar fallback; [OpenBLAS #5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811) DGEMM regression on ZVL256B |
| SciPy (`scipy>=1.3.2`) | Statistics/optimization routines used in select NNCF algorithms | No formal tier policy | Open correctness issues under QEMU: [#22839](https://github.com/scipy/scipy/issues/22839), [#22753](https://github.com/scipy/scipy/issues/22753) | No official riscv64 PyPI wheel (relies on NumPy/OpenBLAS chain) | Inherits NumPy/OpenBLAS gaps |
| scikit-learn (`scikit-learn>=0.24.0`) | ML utilities used in select algorithms | No formal tier; in-progress CI work | Not deeply characterized | No official PyPI riscv64 wheel; open tracking issue [#33580](https://github.com/scikit-learn/scikit-learn/issues/33580) (Mar 2026) | Active discussion via RISE native runners |
| safetensors (`safetensors>=0.4.1`) | Tensor serialization for weight loading/export | Fully upstream, pure Rust, zero arch-specific code | No test execution in CI (cross-compiled, untested) | Official PyPI riscv64 wheel since v0.8.0 (2026-06-09) | Lowest-risk dependency in the chain |
| torchvision (`torchvision==0.25.0`) | Optional, used by examples/Torch preprocessing | No riscv64-specific work found upstream | N/A | No PyPI riscv64 wheel; no Ubuntu riscv64 package | Zero riscv64 issues/PRs found in `pytorch/vision` |

**Deep-dive: NumPy -> OpenBLAS.** NumPy's Tier 3 classification (NEP 57) is the most formalized status in the chain, but its actual RVV SIMD coverage is nil - all vectorized NPYV kernels fall back to scalar C on riscv64 - and its OpenBLAS dependency has an open correctness regression on ZVL256B hardware ([OpenBLAS #5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811)) that cascades into SciPy and scikit-learn, neither of which has an official riscv64 wheel.

**Bottom line on dependencies:** NNCF itself carries zero riscv64 risk (pure Python, no compiled extension requirement at install time). All riscv64 risk is inherited from the three inference/training backends and the numerics stack beneath them, none of which are formally release-blocked or officially wheel-published for riscv64 as of this report.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue, PR, or commit exists in `openvinotoolkit/nncf` | N/A | N/A | Confirmed by `search_issues`, `search_pull_requests`, `search_commits`, `search_code` for `riscv`, `riscv64`, `risc-v`, `vfloat32m1_t`, `rvv` - all zero results; [GitHub search](https://github.com/search?q=riscv+repo%3Aopenvinotoolkit%2Fnncf&type=issues) |

Two incidental (non-substantive) hits exist and are noted for completeness, not as RISC-V work:

| PR | Title | Status | Merged | Notes |
|---|---|---|---|---|
| [#3987](https://github.com/openvinotoolkit/nncf/pull/3987) | Bump astral-sh/setup-uv from 7.3.1 to 7.5.0 | Merged (commit `af42f049d716b93962353169c8d6baf0231f2f5b`) | 2026-03-16 | Dependabot bump; changelog text quoted in PR body mentions setup-uv's own riscv64 platform detection - unrelated to NNCF |
| [#3617](https://github.com/openvinotoolkit/nncf/pull/3617) | Update ninja requirement to `>=1.10.0.post2,<1.14` | Merged (commit `e765fc5ee4ae02fe964ad98b1ce0b75d6bfa924f`), first in v2.18.0 | 2025-08-13 | Dependabot bump; changelog text mentions ninja-python-distributions' own riscv64 wheel matrix - unrelated to NNCF |

No correctness bugs (NaN, floating-point, or otherwise) related to riscv64 exist for NNCF itself in any searched source (GitHub issues/PRs/commits, web search, [riseproject.dev blog](https://riseproject.dev/blog/)). Adjacent RISC-V bug/feature activity exists in `openvinotoolkit/openvino` (the runtime NNCF optionally targets), including ~29 open "Good First Issue" tickets for RVV JIT emitter gaps and one closed build issue ([openvino#31525](https://github.com/openvinotoolkit/openvino/issues/31525), closed 2025-08-05) - these are out of scope for NNCF itself.

## 12. Objections and Upstream Blockers

No stated objections exist because no riscv64 port has ever been proposed for NNCF - there is nothing on record to object to. No technical blocker exists at the NNCF level (pure Python, no compiled extension gating installation). No organizational blocker is documented (no tiering policy, no RFC process, no maintainer statement on the topic either way).

The only meaningful "blocker," to the extent one exists, sits one layer down: a user wanting to *exercise* NNCF's compression algorithms against a real backend on riscv64 depends on that backend's own maturity (PyTorch Tier 3 with open RVV gaps, OpenVINO with no official binaries on any channel, ONNX Runtime with no official riscv64 wheel). None of this is an NNCF-specific blocker, and none of it prevents `pip install nncf` from succeeding. Acceptance probability for a hypothetical future riscv64-specific PR is not assessable since no such PR need exist - NNCF requires no riscv64-specific code to run on riscv64.

## 13. Readiness Assessment

- **Color:** green (architecture-independent)
- **Release provider:** upstream
- NNCF is not an optimization-purpose project (it is a model-compression algorithm library that delegates all numeric execution to backend frameworks); the Step 2 optimization modifier does not apply. Optimization gap: N/A.
- **Justification:** NNCF ships a single `py3-none-any` universal wheel plus sdist on PyPI for every release from 1.4 through 3.3.0, with no CMake build system, no compiled extension required at install time, and zero architecture-specific code anywhere in its 7-file native-extension footprint ([PyPI JSON metadata](https://pypi.org/pypi/nncf/json); [repo inspection at commit 0d137f9](https://github.com/openvinotoolkit/nncf)). Per Step 0 of the color model, an architecture-independent package that ships no compiled, architecture-specific code runs on riscv64 by construction and is classified green without penalty for lacking dedicated riscv64 CI.
- **Pending work that could change the grade:** none identified. There is no open PR, issue, or RISE involvement touching NNCF's riscv64 status, and none is needed - the color is not contingent on future upstream engineering work at the NNCF layer. The grade could only be practically constrained (not lowered, since the color reflects NNCF's own installability) by the maturity of its backend dependencies (Section 9), which is tracked separately in the PyTorch, OpenVINO, and ONNX Runtime project reports.

## 14. Investment Analysis

RISE has not funded or performed any work on NNCF specifically (Section 1) - there is nothing to avoid duplicating at the NNCF layer. NNCF's green rating means no functional-enablement investment is required for NNCF itself.

### 14.1 Functional Enablement

None required. `pip install nncf` already works identically on riscv64 as on any other architecture (Section 8). No engineering effort is needed to make NNCF itself installable or importable on riscv64.

### 14.2 Performance Optimization

Not applicable to NNCF directly (it is not an optimization-purpose project and contains no architecture-specific hot paths of its own to optimize - Section 4). Any performance work that matters to a riscv64 NNCF user belongs in the backend layer: PyTorch's ATen vec RVV coverage ([PR #175746](https://github.com/pytorch/pytorch/pull/175746)), OpenVINO's JIT emitter gaps (~34 tracked issues), and ONNX Runtime's MLAS/SGEMM RVV work ([PR #28655](https://github.com/microsoft/onnxruntime/pull/28655)) - these are scoped to their own project reports, not to NNCF.

### 14.3 CI/CD Infrastructure

None required for NNCF itself, since its single universal wheel needs no architecture-specific build or test job to validate riscv64 compatibility. If leadership wants positive, continuous confirmation that NNCF's Python-level test suite passes when run under a riscv64 interpreter (as a regression guard against a future native-extension addition), a lightweight QEMU-based smoke-test job could be added to `precommit.yml`, but no such regression risk has been observed to date.

### 14.4 Ecosystem Enablement

Not applicable as a distinct workstream for NNCF itself (Section 10 is omitted - see note below). The practical ecosystem-enablement need for a riscv64 ML-compression workflow lies in getting the backend frameworks (PyTorch, OpenVINO, ONNX Runtime) to official riscv64 release status, which is tracked in their own project reports, not this one.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None - NNCF already installs and runs on riscv64 via its universal PyPI wheel | 0 | N/A | N/A |
| CI/CD (optional) | Add a QEMU riscv64 smoke-test job to `precommit.yml` as a regression guard | 0.5-1 | NNCF maintainers (Intel) or external contributor | Low |
| Backend dependency (informational only, tracked in other reports) | PyTorch RVV ATen vec coverage, OpenVINO official riscv64 binaries, ONNX Runtime riscv64 wheel | see respective project reports | N/A | See respective reports |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [openvinotoolkit/nncf GitHub repository](https://github.com/openvinotoolkit/nncf)
- [NNCF releases page](https://github.com/openvinotoolkit/nncf/releases)
- [NNCF PyPI JSON metadata](https://pypi.org/pypi/nncf/json)
- [NNCF on PyPI (simple index)](https://pypi.org/simple/nncf/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE wheel builder GitLab project for nncf (redirects to PyPI, confirming absence)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/nncf/)
- [Ubuntu 26.04 (resolute) package search for nncf](https://packages.ubuntu.com/search?keywords=nncf&suite=resolute&searchon=names&section=all)
- [riseproject.dev members page](https://riseproject.dev/members/)
- [riseproject.dev blog listing](https://riseproject.dev/blog/)
- [PR #3987 - Bump astral-sh/setup-uv](https://github.com/openvinotoolkit/nncf/pull/3987)
- [PR #3617 - Update ninja requirement](https://github.com/openvinotoolkit/nncf/pull/3617)
- [openvinotoolkit/openvino riscv64 JIT emitter source (adjacent project, not NNCF)](https://github.com/openvinotoolkit/openvino/tree/master/src/plugins/intel_cpu/src/emitters/plugin/riscv64)
- [openvino issue #31525 - RISC-V compilation "unrecognizable insn" (closed)](https://github.com/openvinotoolkit/openvino/issues/31525)
- [PyTorch PR #175746 - RVV ATen vec](https://github.com/pytorch/pytorch/pull/175746)
- [PyTorch PR #174275 - RVV detection macro fix](https://github.com/pytorch/pytorch/pull/174275)
- [PyTorch riscv64 master tracking issue #180975](https://github.com/pytorch/pytorch/issues/180975)
- [ONNX Runtime PR #28655 - SGEMM VLEN portability](https://github.com/microsoft/onnxruntime/pull/28655)
- [ONNX Runtime issue #26187 - musl/riscv64 device-discovery test failure](https://github.com/microsoft/onnxruntime/issues/26187)
- [ONNX Runtime issue #20030 - historical accuracy-collapse issue](https://github.com/microsoft/onnxruntime/issues/20030)
- [NumPy riscv64 wheel tracking issue #30216](https://github.com/numpy/numpy/issues/30216)
- [OpenBLAS issue #5811 - DGEMM correctness regression on ZVL256B](https://github.com/OpenMathLib/OpenBLAS/issues/5811)
- [SciPy issue #22839 - hanging tests on riscv64](https://github.com/scipy/scipy/issues/22839)
- [SciPy issue #22753 - special.sph_harm NaN mismatch on riscv64](https://github.com/scipy/scipy/issues/22753)
- [scikit-learn issue #33580 - riscv64 wheel via RISE native runners](https://github.com/scikit-learn/scikit-learn/issues/33580)
- [Repository clone used for local verification (commit 0d137f946db5447f72546852bbb6cb512122f45a)](https://github.com/openvinotoolkit/nncf)
