---
title: Intel Neural Compressor (INC)
parent: Project Reports
color: green
dependencies:
  - name: PyTorch
    relation: runtime-dependency
    criticality: critical
  - name: TensorFlow
    relation: runtime-dependency
    criticality: optional
  - name: NumPy
    relation: runtime-dependency
    criticality: critical
  - name: ONNX
    relation: runtime-dependency
    criticality: optional
  - name: sentencepiece
    relation: runtime-dependency
    criticality: optional
  - name: tokenizers
    relation: runtime-dependency
    criticality: optional
  - name: TorchAO
    relation: runtime-dependency
    criticality: optional
  - name: Intel Extension for PyTorch (IPEX)
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="intel-neural-compressor-(inc)" %}

# Intel Neural Compressor (INC)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-07<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for Intel Neural Compressor (INC)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Intel Neural Compressor (INC) is a model compression and quantization tuning framework for deep learning inference. It orchestrates post-training quantization, quantization-aware training, pruning, and mixed-precision tuning across multiple execution backends (PyTorch, TensorFlow, JAX, ONNX Runtime), searching for a quantization configuration that meets an accuracy target. INC itself performs no numerical compute: it selects quantization schemes, drives calibration, and hands the resulting graph/model to the underlying framework for execution. The repository is [Apache-2.0 licensed](https://github.com/intel/neural-compressor).

**Governance.** INC is a single-vendor, Intel-controlled project with no foundation affiliation. There is no MAINTAINERS, OWNERS, CODEOWNERS, or GOVERNANCE file in the repository. Contribution rules are documented informally in [`docs/source/CONTRIBUTING.md`](https://github.com/intel/neural-compressor/blob/main/docs/source/CONTRIBUTING.md): DCO sign-off, two reviewer approvals (no named maintainer roster), passing Azure DevOps CI, and license-compatibility checks. Support/escalation routes through a single mailbox, `inc.maintainers@intel.com`.

**Corporate sponsors.** Commit-author analysis across roughly 3,000 recent commits (all branches) shows 2,272 commits from `@intel.com` addresses, 599 from anonymized GitHub noreply addresses (predominantly Intel handles), and 92 from `@habana.ai` (Habana Labs, an Intel subsidiary and maker of the Gaudi accelerator this project targets). No commits were found from AMD, ARM, NVIDIA, Meta, Google, or other identifiable corporate domains. Top individual committers (Suyue Chen, Mengni Wang, Xin He, Zehao Huang, Liang Lv, Kaihui Tang, Penghui Cheng, Chang Wang) are all `@intel.com`.

**Community culture on new ports.** There is no PLATFORMS.md, SUPPORT.md, RFC process, or architecture SIG. The README states a two-tier hardware policy: Intel hardware (Gaudi, Core Ultra, Xeon Scalable, Xeon CPU Max, Data Center GPU Flex/Max) receives "extensive testing"; AMD CPU, ARM CPU, and NVIDIA GPU receive "limited testing." No third tier exists and RISC-V is not mentioned anywhere in the documentation. Given the all-Intel-employee maintainer base and the absence of any documented path for proposing new hardware backends beyond opening a PR, a RISC-V port would have no institutional sponsor and would depend entirely on ad hoc Intel maintainer goodwill.

## 2. Port History and Upstreaming Timeline

No RISC-V port has ever been attempted or proposed as executable work.

| Date | Event | Source |
|---|---|---|
| 2025-11-05 | Issue [#2086](https://github.com/intel/neural-compressor/issues/2086), "Neural Compressor Model Hardware Deployment and Compatibility," a user question (not a bug report or port proposal) asking whether INC-optimized models are compatible with non-x86 architectures including ARM and RISC-V, is closed as `not_planned` after 2 comments with no substantive answer from Intel. | [github.com/intel/neural-compressor/issues/2086](https://github.com/intel/neural-compressor/issues/2086) |

No commit, PR, or CI addition referencing RISC-V exists (`search_commits` and `search_pull_requests` for `riscv`/`riscv64` against `intel/neural-compressor` both return 0 results). There is no "first RISC-V commit" to report, no key contributor, and consequently nothing is upstream because nothing has been proposed.

## 3. Upstream Support Tier

INC has no formal, written, tiered hardware-support policy document (no PLATFORMS.md/SUPPORT.md found). The closest artifact is one README line describing two informal tiers, restated here for direct comparison:

| Architecture | Support tier (per README) | CI evidence | Official release artifact |
|---|---|---|---|
| amd64 (x86_64, Intel) | "Extensive testing" | Azure Pipelines pools `INTEL-CPU`, `GAUDI`, `B60`, all x86_64 hardware | PyPI `manylinux_2_17_x86_64`/`manylinux2014_x86_64` wheels (cp311, cp312) |
| arm64 | "Limited testing" (grouped with AMD CPU / NVIDIA GPU) | No dedicated arm64 CI pipeline found | No arm64-tagged PyPI wheel found; falls back to the `py3-none-any` wheel |
| riscv64 | Not mentioned in any support tier | None; zero riscv64 references in any CI file | No riscv64-tagged wheel; falls back to the `py3-none-any` wheel (see Section 8) |

Because INC ships no compiled extension of its own (Section 4), the practical distinction between these tiers is not "does it build" but "does the transitive framework backend (PyTorch/TensorFlow) work" -- see Section 9.

## 4. Technical Architecture and RISC-V-Specific Subsystems

**INC has no compiled or architecture-specific code of its own, for any architecture.** This was verified directly:

- `setup.py` is a pure `setuptools.setup()` + `find_packages()` call: no `Extension(...)`, no `cmake`, no `pybind11`, no `build_ext`, `ext_modules=[]`.
- There is no `CMakeLists.txt` anywhere in the repository.
- A full file-extension inventory of the repository found 616 `.py` files, 135 `.sh`, 92 `.md`, 66 `.txt`, 27 `.json`, and **zero** `.c`/`.cpp`/`.cc`/`.s`/`.asm` files.
- `mcp__github__search_code` queries for `__riscv`, `riscv`, `__aarch64__`, and `__x86_64__` against `intel/neural-compressor` all return 0 results (control query `import neural_compressor` returns 478 hits, confirming the search index itself is functioning).

The only architecture-aware code anywhere in the repository is a CPU feature-detection routine in `neural_compressor/common/utils/utility.py` (duplicated in `neural_compressor/tensorflow/utils/utility.py`), which runs 20 bytes of raw x86 CPUID machine code (leaf 7) to detect VNNI/BF16 hardware support, gated behind:

```python
if "arch" in info and "X86" in info["arch"]:
    ...
```

On any non-X86 architecture -- riscv64 and arm64 alike -- this block is skipped and the `_vnni`/`_bf16` flags silently stay `False`. It degrades gracefully rather than crashing, but it is not a riscv64 (or arm64) implementation of anything; it is an x86-only optimization hint that is a no-op elsewhere. The only other architecture reference in the repository is a CI benchmark heuristic, `.azure-pipelines/scripts/models/new_benchmark.py:101`, checking `get_architecture() == "aarch64"` for thread-count tuning -- not a kernel implementation.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Quantization/tuning orchestration logic (core INC package) | Scalar, pure Python, backend-delegated | Scalar, pure Python, backend-delegated | Scalar, pure Python, backend-delegated |
| CPU feature detection (VNNI/BF16 via CPUID) | Present (hand-written x86 CPUID asm) | Missing (guarded no-op) | Missing (identical guarded no-op as arm64) |
| Native/compiled extension (.c/.cpp/CMake) | None exists for any architecture | None | None |
| Actual quantization/inference kernels | Delegated entirely to PyTorch/TensorFlow/oneDNN/ONNX Runtime backends | Same delegation | Same delegation |

INC delegates all real tensor compute -- and therefore all SIMD/JIT/architecture-specific kernel work -- to the backend frameworks named in `requirements_pt.txt`, `requirements_tf.txt`, and `requirements_jax.txt` (see Section 9). RISC-V readiness for actual inference speed is entirely a function of those frameworks' own riscv64 maturity, not of anything in this repository.

## 5. Build System, Cross-Compilation, and Toolchain

There is no C/C++ build system to cross-compile: INC installs via plain `pip install`.

- No `CMakeLists.txt`, `.cmake` files, or toolchain files exist anywhere in the tree.
- No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exist.
- Only two Dockerfiles exist in the whole repository (`.azure-pipelines/docker/Dockerfile_xpu.devel` and `.azure-pipelines/docker/Dockerfile.devel`), both for Intel XPU/GPU CI images -- no `Dockerfile.riscv64` and no riscv variant of any kind.
- No QEMU usage anywhere in the repository (confirmed by grep across `.github/workflows/` and `.azure-pipelines/` for `qemu|platforms:|linux/arm|linux/riscv|buildx`, 0 matches).
- No known riscv64 build failures are documented for INC itself, because no one has attempted to build it as anything other than a pure-Python package.

Since INC has no native code, the toolchain question that matters is entirely downstream: whether `pip install neural-compressor[pt]` (or `[tf]`, `[jax]`) can resolve a working PyTorch/TensorFlow/JAX build on riscv64. See Section 9.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `pip install neural-compressor` succeeds | Yes (compiled-looking manylinux wheel resolved) | Yes (falls back to `py3-none-any`) | Yes (falls back to `py3-none-any`, same mechanism as arm64) |
| VNNI/BF16 hardware detection | Functional | No-op | No-op (same as arm64) |
| PyTorch backend quantization | Fully functional, hardware-tested | Limited testing per README | Backend (PyTorch) itself has no shipped riscv64 wheels; experimental enablement only (Section 9) |
| TensorFlow backend quantization | Fully functional, hardware-tested | Limited testing per README | TensorFlow currently fails to compile from source on riscv64 (open bug, Section 9) |
| ONNX Runtime evaluation path | Functional | Not separately documented | ONNX Runtime has open build-failure and device-discovery-test-failure issues on riscv64 (Section 9) |

**Functional gaps.** INC's own code has no functional gap on riscv64 -- it installs and imports fine as a pure-Python package. The functional gap is entirely inherited: none of INC's compute backends (PyTorch, TensorFlow, ONNX Runtime) ship riscv64 releases as of 2026-09-07, so an end-to-end quantization workflow cannot currently be exercised on riscv64 hardware.

**Performance gaps.** Not measurable for INC directly (it performs no compute), and no riscv64 performance data exists for the backend frameworks it depends on either -- see Section 12 of the underlying research and Section 9 below.

**Security hardening gaps.** Data not available: no riscv64-specific security hardening documentation or CVE history was found for INC (repository-wide grep for riscv found nothing to review in this dimension).

**NaN / floating-point semantics issues.** None reported for INC itself. One transitive dependency, NumPy, has open riscv64-specific floating-point exception test failures (`test_unary_spurious_fpexception`, `test_floor_division_errors`) tracked in [numpy#32461](https://github.com/numpy/numpy/issues/32461) and [numpy#32376](https://github.com/numpy/numpy/issues/32376) -- relevant because NumPy underlies quantization statistics computation across all INC front-ends.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified by reading every CI definition file in the repository directly (not inferred from README claims):

- **GitHub Actions** (`.github/workflows/`, 6 files, all read in full): `check-stale-issue.yml` (schedule + dispatch, `ubuntu-latest`, closes stale issues), `pr-code-sync.yml` (`[repo-sync]` self-hosted, InnerSource mirror sync), `pr-io-build.yaml` (`ubuntu-latest`/self-hosted, builds docs), `pr-link-scan.yml` (`ubuntu-latest`/self-hosted, checks markdown links), `pr-pre-commit.yml` (`self-hosted`/`ubuntu-latest`, formatting), `publish.yml` (`ubuntu-latest`, publishes docs to gh-pages). None declare a build matrix, cross-compilation target, QEMU step, or any `linux/riscv64` platform string.
- **Azure Pipelines** (`.azure-pipelines/`, all files read): `ut-3x-pt.yml`, `ut-3x-tf.yml`, `ut-3x-jax.yml`, `ut-3x-pt-hpu.yml`, `ut-3x-pt-xpu.yml`, `model-test-3x.yml`, plus `template/*.yml`. Pools used: `INTEL-CPU`, `GAUDI` (Habana), `B60` (Intel GPU), `ubuntu-latest` -- all Intel/x86 hardware or generic x86_64 Microsoft-hosted images.
- No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository.
- A repo-wide case-insensitive grep for `riscv|risc-v|risc_v` across the entire working tree (excluding `.git`) returned **zero matches**.
- No RISE RISC-V runner references (`riseproject-dev`, RISE runner labels) exist anywhere in CI configuration.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (`INTEL-CPU`, `ubuntu-latest`) | No dedicated pipeline found | No |
| CI tests | Yes (Azure Pipelines UT suites) | No dedicated pipeline found | No |
| CI publishes release artifact | Yes (implicitly, via manual PyPI publish; no dedicated release-automation workflow was found in `.github/workflows/`) | No | No |

## 8. Distribution and Release Status

- **GitHub releases**: every release inspected (v3.7, v3.8, v3.9) carries exactly 2 auto-generated assets, "Source code (zip)" and "Source code (tar.gz)" -- no custom binaries of any architecture. [github.com/intel/neural-compressor/releases](https://github.com/intel/neural-compressor/releases)
- **PyPI**: the real package name is `neural-compressor` (not `intel-neural-compressor` or `intel-neural-compressor-(inc)`, both of which return HTTP 404). The latest release (3.9) publishes `cp311-cp311-manylinux_2_17_x86_64.manylinux2014_x86_64`, `cp312-cp312-manylinux_2_17_x86_64.manylinux2014_x86_64`, and a `py3-none-any` wheel. [pypi.org/project/neural-compressor/](https://pypi.org/project/neural-compressor/) No riscv64-tagged wheel exists, but because the package carries no compiled extension (Section 4), `pip` on riscv64 resolves the platform-independent `py3-none-any` wheel automatically, since none of the x86_64-tagged wheels are installable there.
- **RISE GitLab wheel builder**: `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/intel-neural-compressor-(inc)/` redirects to `pypi.org/simple/intel-neural-compressor-(inc)/`, which returns HTTP 404 -- no RISE-built wheel exists under this name, and INC (as `neural-compressor`) does not appear among the RISE wheel-builder's listed packages.
- **Ubuntu 26.04 (resolute)**: no package exists under `neural-compressor`, `intel-neural-compressor`, or "Intel Neural Compressor (INC)" (all searches on packages.ubuntu.com return no results) -- INC is not distro-packaged for Ubuntu under any architecture, so this is not a riscv64-specific gap.
- **What a user must do**: run `pip install neural-compressor[pt]` (or the `[tf]`/`[jax]` extra) on a riscv64 host. `pip` will install the pure-Python `py3-none-any` wheel for INC itself; the extra's framework dependency (PyTorch, TensorFlow, or JAX) is the actual blocker, since none of those currently ship riscv64 wheels (Section 9).

## 9. Dependencies

INC carries no compiled code of its own; every architecture-sensitive dependency below is transitive, pulled in only when the corresponding `[pt]`/`[tf]`/`[jax]` extra is installed.

| Dependency | Role in INC | riscv64 build | riscv64 test | riscv64 release | Community/tracking |
|---|---|---|---|---|---|
| [PyTorch](https://github.com/pytorch/pytorch) | Primary quantization backend (static/smooth-quant, torch.compile paths) | Partial/experimental, active enablement | CI pipeline being stood up, no upstream wheels | No official riscv64 wheels | [Tracking #180975](https://github.com/pytorch/pytorch/issues/180975), [RFC #171659](https://github.com/pytorch/pytorch/issues/171659), [#141550](https://github.com/pytorch/pytorch/issues/141550), [#175193](https://github.com/pytorch/pytorch/issues/175193) |
| [TensorFlow](https://github.com/tensorflow/tensorflow) | Secondary quantization backend (graph rewriter/QDQ) | Fails to compile from source on riscv64 (open) | No test signal | No wheels/releases | [#102159](https://github.com/tensorflow/tensorflow/issues/102159), [#100940](https://github.com/tensorflow/tensorflow/issues/100940) |
| [NumPy](https://github.com/numpy/numpy) | Core numerics used by all front-ends | Builds, with known FP-exception test failures | `test_unary_spurious_fpexception`/`test_floor_division_errors` fail | No official manylinux riscv64 wheels yet | [#30216](https://github.com/numpy/numpy/issues/30216), [#32461](https://github.com/numpy/numpy/issues/32461), [#32376](https://github.com/numpy/numpy/issues/32376), [#26200](https://github.com/numpy/numpy/issues/26200) |
| [ONNX Runtime](https://github.com/microsoft/onnxruntime) | Used by INC's eval/lm-eval harness and ONNX quantization flows | Build errors executing ops on RISC-V | Device-discovery test failures | No riscv64 EP/release | [#20030](https://github.com/microsoft/onnxruntime/issues/20030), [#16544](https://github.com/microsoft/onnxruntime/issues/16544), [#26187](https://github.com/microsoft/onnxruntime/issues/26187) |
| [oneDNN](https://github.com/uxlfoundation/oneDNN) | Low-level SIMD kernel backend under PyTorch/TensorFlow CPU quantization paths | No production RISC-V support | One CI target existed, failed, closed unresolved | Not released for riscv64 | [#5170](https://github.com/uxlfoundation/oneDNN/issues/5170), [#4860](https://github.com/uxlfoundation/oneDNN/issues/4860), [#3934](https://github.com/uxlfoundation/oneDNN/issues/3934) |
| [sentencepiece](https://github.com/google/sentencepiece) | Tokenizer for evaluation/LLM examples | Builds from source per issue discussion | No dedicated CI signal | No riscv64 PyPI wheel | [#1250](https://github.com/google/sentencepiece/issues/1250), [#1195](https://github.com/google/sentencepiece/issues/1195) (closed, not shipped) |
| [tokenizers](https://github.com/huggingface/tokenizers) (Rust) | Tokenizer backing `transformers` evaluation flows | Was broken, now reported buildable | No dedicated CI signal | No riscv64 PyPI wheel | [#1816](https://github.com/huggingface/tokenizers/issues/1816) (fixed), [#1961](https://github.com/huggingface/tokenizers/issues/1961) (closed, no wheel shipped) |
| [torchao](https://github.com/pytorch/ao) | PyTorch-backend low-bit quantization kernels | No riscv64 signal at all | None | None | Only [#913](https://github.com/pytorch/ao/issues/913) (ARM64 install failure, closed) -- riscv64 is not yet on this project's radar |
| [Intel Extension for PyTorch (IPEX)](https://github.com/intel/intel-extension-for-pytorch) | Optional accelerated backend for Intel-CPU-specific kernels (AVX-512/AMX) | No riscv64 issues found; zero tracking | None | None | GitHub code search for "riscv64" in this repo returns 0 results; architecturally tied to x86 SIMD extensions |

**Deep-dive.** The two backends that matter most for INC's primary value proposition -- PyTorch and TensorFlow -- are both in early riscv64 states with no shipped wheels as of 2026-09-07. PyTorch has the most active tracking ([#180975](https://github.com/pytorch/pytorch/issues/180975), driven by Alibaba XuanTie and the Ruyi Community across a phased CI/RVV-kernel/torch.compile-RVV/Triton-RISCV plan), while TensorFlow currently fails to compile from source on riscv64 at all ([#102159](https://github.com/tensorflow/tensorflow/issues/102159)). oneDNN, the shared low-level kernel layer under both, has no production RISC-V support and an unresolved closed CI test failure ([#3934](https://github.com/uxlfoundation/oneDNN/issues/3934)). NumPy builds but has open riscv64 correctness issues around floating-point exception semantics. In practice, an INC user on riscv64 today can install INC itself, but cannot complete an end-to-end PyTorch- or TensorFlow-backed quantization workflow because the compute backend is not yet functional on the platform.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2086](https://github.com/intel/neural-compressor/issues/2086) | Neural Compressor Model Hardware Deployment and Compatibility | Closed, `not_planned` | N/A (user question, not a bug) | Asks about ARM/RISC-V compatibility of INC-optimized models; 2 comments, never substantively answered by Intel |
| [#496](https://github.com/intel/neural-compressor/issues/496) | (unrelated conda/glibc install error on x86_64 Sapphire Rapids) | Closed (2023) | N/A | Surfaced only as a false-positive match in riscv-related keyword searches; not RISC-V related |

No correctness or performance bugs specific to riscv64 exist in the INC issue tracker, because no one has run INC on riscv64 to file one.

## 12. Objections and Upstream Blockers

- **Stated objections**: none exist. Issue [#2086](https://github.com/intel/neural-compressor/issues/2086) is the only place RISC-V was raised, and it was closed `not_planned` without a substantive technical response -- this reads as deprioritization by omission, not a stated technical objection.
- **Technical blockers**: none inside INC itself (it is pure Python). The real blocker is the dependency chain: PyTorch, TensorFlow, ONNX Runtime, and oneDNN are all in pre-production riscv64 states (Section 9). INC cannot deliver its core value (quantized-model tuning) on riscv64 until at least one of these backends is riscv64-functional.
- **Organizational blockers**: INC is single-vendor (Intel), all-employee-maintained, with no foundation and no external corporate co-maintainers. Intel is not a current RISE member (it appeared in RISE's 2023 founding-member coverage but is absent from the current member roster at [riseproject.dev/members/](https://riseproject.dev/members/)). There is no RISE funding, runner usage, or blog coverage of INC found anywhere in RISE Project resources.
- **Acceptance probability**: Data not available as a quantifiable estimate; qualitatively, a riscv64-specific change to INC itself would likely be accepted without institutional resistance (INC has no architecture-specific code to defend, and the change would be trivial -- there is nothing to port). The practical barrier is not upstream willingness but backend readiness (PyTorch/TensorFlow/ONNX Runtime), which is outside INC's control.

## 13. Readiness Assessment

- **Color:** green
- **Release provider:** upstream
- **Optimization gap:** N/A (INC is not an optimization-purpose project under the color model's Step 2 test -- it performs no compute itself; all speed/quantization value is delivered by the backend framework it delegates to, so it does not qualify as a SIMD/kernel-library-type project subject to the optimization modifier)

**Justification.** INC ships no compiled, architecture-specific code: `setup.py` declares no `Extension`/`ext_modules`, there is no `CMakeLists.txt`, and a full repository scan found zero `.c`/`.cpp`/`.cc`/`.s` files. PyPI publishes a `py3-none-any` wheel for the current release ([pypi.org/project/neural-compressor/](https://pypi.org/project/neural-compressor/)) alongside its x86_64-tagged wheels; on riscv64, `pip` resolves to that platform-independent wheel automatically since the platform-specific wheels are not installable there, so INC runs on riscv64 by construction per the color model's Step 0 architecture-independence shortcut. This is a code-level fact about INC only -- it does not claim that a full quantization workflow is currently runnable end-to-end on riscv64, because the compute backends INC delegates to are graded separately.

**Pending work / caveats that could change the practical (not the coded) grade.** No open PR, issue, or RISE initiative targets INC directly -- there is nothing in flight to track for this repository. What would change the *practical* usefulness of a green INC install on riscv64 is backend maturity: PyTorch's active tracking issue ([#180975](https://github.com/pytorch/pytorch/issues/180975)) is the most advanced effort among INC's dependencies and is the one to watch; TensorFlow ([#102159](https://github.com/tensorflow/tensorflow/issues/102159)) and oneDNN ([#5170](https://github.com/uxlfoundation/oneDNN/issues/5170)) show no comparable momentum as of 2026-09-07.

## 14. Investment Analysis

RISE has not funded, run CI for, or produced benchmark data on INC (Section 2/12 findings; Intel is not a current RISE member). No work on this repository specifically needs to be avoided as duplicative.

### 14.1 Functional Enablement

No functional enablement work is needed for INC itself -- it already installs and imports on riscv64 via the existing `py3-none-any` PyPI wheel. The functional gap is entirely in the dependency chain (PyTorch, TensorFlow, ONNX Runtime, oneDNN), which is out of scope for INC-specific investment and is more appropriately funded against those projects' own reports.

### 14.2 Performance Optimization

Not applicable to INC directly (no compute of its own). Once a backend framework is riscv64-functional, the only INC-specific gap is the x86-only VNNI/BF16 CPUID feature-detection no-op (Section 4), which is cosmetic (it disables an optional hint, not a code path) and requires no RISC-V-specific implementation to fix -- the block simply does not fire on riscv64, identically to how it does not fire on arm64 today.

### 14.3 CI/CD Infrastructure

Adding a riscv64 job to INC's existing GitHub Actions or Azure Pipelines definitions (Section 7) would be low-effort (pure-Python `pip install` + `pytest`, no cross-compilation), but would have no signal value until at least one compute backend (most likely PyTorch, per its more mature tracking issue) is installable on riscv64 -- otherwise INC's own unit tests would fail purely on backend absence, not on anything INC-specific.

### 14.4 Ecosystem Enablement

The highest-leverage investment is not in INC but in its critical transitive dependencies: PyTorch, TensorFlow, ONNX Runtime, and oneDNN. These are shared across the broader ML tooling ecosystem (not INC-specific), so investment there compounds beyond this one project.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 CI job to INC (pure `pip install` + `pytest`, no native build) | 1 | INC maintainers or a contributor | Low (blocked on backend availability for meaningful signal) |
| Functional | Track and consume PyTorch riscv64 enablement ([#180975](https://github.com/pytorch/pytorch/issues/180975)) as the primary unblock path for INC's PyTorch backend | N/A (external dependency, not INC-owned work) | PyTorch upstream (Alibaba XuanTie, Ruyi Community) | Critical (blocking, not INC-fundable) |
| Ecosystem | Fund/monitor TensorFlow riscv64 build fixes ([#102159](https://github.com/tensorflow/tensorflow/issues/102159)) | N/A (external dependency) | TensorFlow upstream | Medium |
| Ecosystem | Fund/monitor oneDNN RISC-V CI proposal ([#5170](https://github.com/uxlfoundation/oneDNN/issues/5170)) | N/A (external dependency) | oneDNN/uxlfoundation upstream | Medium |
| Documentation | Ask Intel to reopen or substantively answer issue [#2086](https://github.com/intel/neural-compressor/issues/2086) on non-x86 compatibility | <1 | Requester + INC maintainers | Low |

## 15. Updates

(No updates yet -- initial report dated 2026-09-07.)

## 16. References

- [intel/neural-compressor (GitHub repository)](https://github.com/intel/neural-compressor)
- [Intel Neural Compressor documentation, Welcome page](https://intel.github.io/neural-compressor/latest/docs/source/Welcome.html)
- [CONTRIBUTING.md](https://github.com/intel/neural-compressor/blob/main/docs/source/CONTRIBUTING.md)
- [Issue #2086: Model Hardware Deployment and Compatibility](https://github.com/intel/neural-compressor/issues/2086)
- [Issue #496 (unrelated, surfaced in keyword search)](https://github.com/intel/neural-compressor/issues/496)
- [GitHub releases for intel/neural-compressor](https://github.com/intel/neural-compressor/releases)
- [neural-compressor on PyPI](https://pypi.org/project/neural-compressor/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project members](https://riseproject.dev/members/)
- ["PyTorch is available on riscv64" (RISE blog)](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- ["Optimizing IREE compilation and end-to-end object detection pipeline for RISC-V" (RISE blog)](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)
- [PyTorch tracking issue: RISC-V PyTorch enablement (#180975)](https://github.com/pytorch/pytorch/issues/180975)
- [PyTorch RISC-V RFC (#171659)](https://github.com/pytorch/pytorch/issues/171659)
- [PyTorch RISC-V CI support (#141550)](https://github.com/pytorch/pytorch/issues/141550)
- [PyTorch riscv CI dockerfile zlib issue (#175193)](https://github.com/pytorch/pytorch/issues/175193)
- [PyTorch older riscv build blocker (#99278)](https://github.com/pytorch/pytorch/issues/99278)
- [PyTorch older riscv build blocker (#116012)](https://github.com/pytorch/pytorch/issues/116012)
- [TensorFlow: can't compile 2.19.1 on riscv (#102159)](https://github.com/tensorflow/tensorflow/issues/102159)
- [TensorFlow: compile on riscv64 platform (#100940)](https://github.com/tensorflow/tensorflow/issues/100940)
- [TensorFlow soft-float/double-float link mismatch (#62241)](https://github.com/tensorflow/tensorflow/issues/62241)
- [TensorFlow TFLite riscv build (#47636)](https://github.com/tensorflow/tensorflow/issues/47636)
- [NumPy: build/distribute manylinux riscv64 wheels (#30216)](https://github.com/numpy/numpy/issues/30216)
- [NumPy: FP-exception test failure on riscv (#32461)](https://github.com/numpy/numpy/issues/32461)
- [NumPy: floor division errors test failure on riscv (#32376)](https://github.com/numpy/numpy/issues/32376)
- [NumPy: RISC-V Vector V1.0 support (#26200)](https://github.com/numpy/numpy/issues/26200)
- [ONNX Runtime: build error executing ops on RISCV (#20030)](https://github.com/microsoft/onnxruntime/issues/20030)
- [ONNX Runtime: add RISC-V architecture support (#16544)](https://github.com/microsoft/onnxruntime/issues/16544)
- [ONNX Runtime: DeviceDiscoveryTest fails on riscv64 (#26187)](https://github.com/microsoft/onnxruntime/issues/26187)
- [oneDNN: proposal for real RISC-V hardware CI (#5170)](https://github.com/uxlfoundation/oneDNN/issues/5170)
- [oneDNN: vector length agnosticism on RISC-V (#4860)](https://github.com/uxlfoundation/oneDNN/issues/4860)
- [oneDNN: RV64 matmul CI test failure (#3934)](https://github.com/uxlfoundation/oneDNN/issues/3934)
- [sentencepiece: riscv64 distribution (#1250)](https://github.com/google/sentencepiece/issues/1250)
- [sentencepiece: add riscv64 wheel to PyPI (#1195)](https://github.com/google/sentencepiece/issues/1195)
- [tokenizers: cannot compile on riscv machine (#1816)](https://github.com/huggingface/tokenizers/issues/1816)
- [tokenizers: add riscv64 wheel to PyPI (#1961)](https://github.com/huggingface/tokenizers/issues/1961)
- [torchao: ARM64 Linux install failure (#913)](https://github.com/pytorch/ao/issues/913)
- [intel/intel-extension-for-pytorch (GitHub repository)](https://github.com/intel/intel-extension-for-pytorch)