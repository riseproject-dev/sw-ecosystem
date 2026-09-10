---
title: HuggingFace Optimum
parent: Project Reports
color: green
dependencies:
  - name: PyTorch
    relation: runtime-dependency
    criticality: critical
  - name: NumPy
    relation: runtime-dependency
    criticality: critical
  - name: HuggingFace Transformers
    relation: runtime-dependency
    criticality: critical
  - name: sentencepiece
    relation: runtime-dependency
    criticality: optional
  - name: ONNX
    relation: runtime-dependency
    criticality: critical
  - name: OpenVINO Runtime
    relation: runtime-dependency
    criticality: optional
  - name: Intel Neural Compressor (INC)
    relation: runtime-dependency
    criticality: optional
  - name: NNCF (Neural Network Compression Framework)
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" focus="huggingface-optimum" %}

# HuggingFace Optimum

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for HuggingFace Optimum<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

HuggingFace Optimum ([github.com/huggingface/optimum](https://github.com/huggingface/optimum), docs at [huggingface.co/docs/optimum](https://huggingface.co/docs/optimum)) is a Python integration layer that adapts HuggingFace Transformers/Diffusers models to specific hardware-acceleration backends (ONNX Runtime, OpenVINO, Habana Gaudi, AMD, FuriosaAI, TensorRT-LLM, AWS Trainium/Inferentia, Google TPU). It does not itself implement numerical kernels; it generates export graphs, quantization configs, and pipeline wrappers that hand execution off to backend-specific libraries.

**Governance:** No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, or `GOVERNANCE.md` file exists in the repository. The only governance-adjacent documents are `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md`; the contribution model is fork -> PR -> review by unnamed "HuggingFace project maintainers," with no public RFC process. Optimum is not under a neutral foundation (no Linux Foundation / PyTorch Foundation affiliation found); it is owned and governed directly by Hugging Face, Inc. under the `huggingface` GitHub org. License: Apache 2.0.

**Corporate sponsors / hardware partners:** There is no formal sponsorship program. Instead, each hardware vendor maintains a companion pip package listed in `setup.py` `EXTRAS_REQUIRE` and the docs landing page: `optimum-amd` (AMD), `optimum-furiosa` (FuriosaAI), `optimum-graphcore` (Graphcore), `optimum-habana` (Intel Gaudi), `optimum-intel` (Intel, wrapping OpenVINO/NNCF/Neural Compressor), `optimum-quanto` (Hugging Face's own quantization package), plus documentation-only integrations for NVIDIA (TensorRT-LLM), AWS (Trainium/Inferentia), and Google (TPUs).

**Community culture on new ports:** No written policy on accepting new hardware backends was found. In practice each backend ships as an independently maintained companion package co-developed with the partner company; there is no evidence of a documented process for proposing a new architecture backend such as a RISC-V target.

## 2. Port History and Upstreaming Timeline

No RISC-V port exists. `mcp__github__search_commits`, `search_issues`, `search_pull_requests`, and `search_code` against `repo:huggingface/optimum` for "riscv" and "riscv64" all returned `total_count: 0`. A full-tree case-insensitive `grep` of the cloned repository (commit `52367da7f2d227d82db26d0de10f44c297b8c1eb`) for "riscv" also returned zero matches.

| Date | Event | Source |
|---|---|---|
| - | No RISC-V-related commit, issue, or PR exists at any date | [GitHub search: repo:huggingface/optimum](https://github.com/huggingface/optimum) (search UI and MCP search tools, 0 results across all query variants) |

No contributors, RISE or otherwise, have engaged this repository on the RISC-V axis. There is nothing to upstream because no port has ever been attempted.

## 3. Upstream Support Tier

No formal tier policy exists for any architecture in this repository; there is no architecture matrix in the docs. In practice, tier status is defined implicitly by the CI runner matrix.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Yes (`ubuntu-22.04`/`ubuntu-latest`, `windows-2022`) | Yes (`macos-14`, Apple Silicon) | No |
| CI tests run | Yes | Yes | No |
| Official binary/wheel | Yes (`optimum-<ver>-py3-none-any.whl`, universal) | Yes (same universal wheel) | Yes (same universal wheel - installs identically because the package has no compiled extensions of its own) |
| Release-blocking | Implicit (default CI) | Implicit (default CI) | N/A - no CI exists |

Source: direct read of all 14 workflow files in `.github/workflows/` of the local clone, and the [PyPI JSON API for `optimum`](https://pypi.org/pypi/optimum/json) confirming a single `py3-none-any` wheel per release (v2.3.0 latest as of research date).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Optimum contains no compiled or architecture-specific components. Verified directly: the local clone (125 files total) contains 74 `.py`, 21 `.yml`, 15 `.mdx`, 7 `.md`, and one each of `.toml`/`.cfg`/`.sh`/`.txt`/`Makefile`/`LICENSE` - **zero** `.c`, `.cc`, `.cpp`, `.h`, `.hpp`, `.s`, or `.asm` files. `setup.py`/`pyproject.toml` contain no `ext_modules`, `Extension(`, `cffi`, or `cython` references. A `mcp__github__search_code` query for `riscv64 OR amd64 OR arm64 repo:huggingface/optimum extension:c` returned `total_count: 0` (there is no `.c` file to hold an architecture guard for any architecture).

There is consequently no JIT, SIMD, crypto, assembly, or GC-barrier subsystem inside Optimum itself to compare across architectures - the comparison table the color model asks for does not apply:

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native/compiled kernels of any kind | None exist in this repo | None exist in this repo | None exist in this repo |

All actual numerical/hardware-specific execution is delegated to separate backend projects (PyTorch, ONNX Runtime, OpenVINO, etc. - see Section 9), which are out of scope of the `huggingface/optimum` repository itself and carry their own, independent RISC-V status.

## 5. Build System, Cross-Compilation, and Toolchain

There is no native build system in this repository. Root contains only `setup.py`, `pyproject.toml`, `setup.cfg`, `MANIFEST.in`, and a `Makefile` limited to Python lint/test targets - no `CMakeLists.txt`, no `configure` script, no toolchain files, no `cmake/` directory. No `Dockerfile` exists anywhere in the tree. The only installation documentation, `docs/source/installation.mdx`, describes exclusively `pip install optimum[...]` commands, plus one `docker run huggingface/optimum-nvidia` line referencing a separate prebuilt TensorRT-LLM image (not something built from this repo).

`setup.py` declares `python_requires=">=3.9.0"` and pulls in `transformers`, `torch`, `packaging`, `numpy`, `huggingface_hub` as pure-Python-facing dependencies (their own native builds are out of scope here). There is no QEMU usage, no cross-compilation flags, and no documented riscv64 build failure for this repository, because there is nothing native to compile.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `pip install optimum` | Works | Works | Works (universal wheel, confirmed via PyPI JSON metadata) |
| Core pipelines (`optimum.pipelines`, FX transforms, GPTQ CLI, exporters) | Works | Works | Works, subject to the availability of `torch`/`numpy`/`transformers` on the host, which is independent of Optimum |
| `optimum-onnx` (ONNX Runtime backend) | Full | Full | Backend builds from source but has an open, unresolved accuracy-correctness regression on riscv64 (see Section 9) |
| `optimum-intel[openvino]` | Full | Full | Backend is cross-compile-only; at least one core JIT emitter (`Minimum` op) is unimplemented for riscv64 (see Section 9) |

No functional gap exists in Optimum's own code for any architecture, since it has no architecture-specific code path. Functional and performance gaps are entirely a property of the backend libraries it wraps, not of Optimum itself - see Section 9 for the backend-level detail (PyTorch kernel maturity, ONNX Runtime accuracy bug, OpenVINO JIT completeness). No NaN/floating-point semantics issue specific to Optimum was found; the one riscv64 numerics issue on record in the dependency chain is the ONNX Runtime accuracy regression noted below, which is a backend bug, not an Optimum bug.

## 7. CI/CD Infrastructure

Confirmed by directly reading all 14 workflow files in `.github/workflows/` of the local clone (commit `52367da7f2d227d82db26d0de10f44c297b8c1eb`): `build_main_documentation.yml`, `build_pr_documentation.yml`, `quality.yml`, `stale.yml`, `style_bot.yml`, `test_cli.yml`, `test_common.yml`, `test_exporters_common.yml`, `test_fx_automatic_parallelism.yml`, `test_fx_optimization.yml`, `test_gptq.yml`, `test_pipelines.yml`, `test_utils.yml`, `trufflehog.yml`, `upload_pr_documentation.yml`.

Every `runs-on` value found: `ubuntu-22.04`/`ubuntu-latest`, `macos-14`, `windows-2022`, plus two AWS self-hosted GPU runner groups (`aws-g5-12xlarge-plus`, `aws-g6-4xlarge-plus`), all x86_64 (GPU jobs are x86_64+CUDA). A repo-wide grep for `qemu|platform|self-hosted|arch:` returned zero matches - no cross-architecture emulation, no `docker buildx --platform`, no `linux/riscv64` target anywhere.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner exists | Yes (`ubuntu-22.04`, `windows-2022`, AWS self-hosted) | Yes (`macos-14`) | No |
| RISE runner used | No (not applicable - x86_64 GitHub-hosted) | No | No - project has no RISE engagement at all (see Section 12) |
| Test execution | Yes | Yes | N/A - no job exists |

Source: [huggingface/optimum `.github/workflows/`](https://github.com/huggingface/optimum/tree/main/.github/workflows), read in full from the local clone.

## 8. Distribution and Release Status

**PyPI:** `optimum` (the real package name; `huggingface-optimum` does not exist, confirmed by [HTTP 404 on `pypi.org/pypi/huggingface-optimum/json`](https://pypi.org/pypi/huggingface-optimum/json)) ships as a single universal wheel `optimum-<ver>-py3-none-any.whl` per release, confirmed via the [PyPI JSON API](https://pypi.org/pypi/optimum/json) (latest 2.3.0 at research time). This wheel installs identically on riscv64 because it contains no compiled code; there is no dedicated riscv64 artifact because none is required.

**GitHub releases:** The last five releases (v2.3.0, v2.2.0, v2.1.0, v2.0.0, v1.27.0) each show only the standard GitHub-generated source archives ("Assets: 2 files" - source zip/tar.gz), with no riscv64-named asset visible [NEEDS VERIFICATION - full asset-filename enumeration was blocked by session repo-access restrictions and client-side JS rendering; no positive or contradicting evidence was found in what was retrievable]. Source: [huggingface/optimum releases](https://github.com/huggingface/optimum/releases).

**RISE wheel builder:** No package registered - `huggingface-optimum` on the [RISE GitLab PyPI simple index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/huggingface-optimum/) redirects to the PyPI simple index, which returns 404. The [RISE Python wheel builder's full supported-package list](https://riseproject.gitlab.io/python/wheel_builder/) (87 packages) does not include `optimum`.

**Linux distributions:** Not packaged in Ubuntu under any tested name - [packages.ubuntu.com search for "optimum" / "HuggingFace Optimum" on suite `resolute`](https://packages.ubuntu.com/search?keywords=HuggingFace%20Optimum&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" across all sections/architectures. Not found on the [Arch Linux RISC-V port index](https://archriscv.felixc.at/?q=huggingface%20optimum) (query returned 404; no match for "optimum" in fetched homepage content).

**What a user must do to get a working install on riscv64:** `pip install optimum` (or the relevant extras, e.g. `optimum[onnxruntime]`) - the same command as on any other architecture, since the package itself is architecture-independent. Whether the resulting environment actually functions correctly depends entirely on whether the invoked hardware-backend extra's native dependency (torch, onnxruntime, openvino, etc.) is itself installable and correct on riscv64 - see Section 9.

## 9. Dependencies

Scope: `setup.py` core `install_requires` (`transformers`, `torch`, `packaging`, `numpy`, `huggingface_hub`) plus the hardware-backend extras it wraps (`optimum-onnx` -> onnxruntime, `optimum-intel` -> openvino/neural-compressor/nncf), filtered to dependencies with JIT, SIMD, numerics, crypto, compression, or allocator roles. Note: the project-graph MCP server was unreachable for this entire research pass (`CONNECTION_CLOSED`), so no Ubuntu 26.04 (`resolute`) riscv64 binary-package availability could be verified for any dependency below via that channel.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| PyTorch (`torch`) | Core tensor/autograd engine, JIT, SIMD kernels | Community CI (Alibaba XuanTie/Ruyi) builds riscv64 wheels; no official upstream CI yet | Test-suite/blocklist framework exists on community CI only | No official PyPI/pytorch.org riscv64 wheels | [pytorch/pytorch#180975](https://github.com/pytorch/pytorch/issues/180975) (tracking: Phase 1 CI infra done, Phase 2 GEMM/kernel library not started); [#147513](https://github.com/pytorch/pytorch/issues/147513) (RVV RFC); [#171659](https://github.com/pytorch/pytorch/issues/171659) (XuanTie roadmap RFC); [#99278](https://github.com/pytorch/pytorch/issues/99278) (libstdc++ build error) |
| NumPy | Numerics/SIMD backing torch/onnxruntime interop | Builds; OpenBLAS riscv64 wheel chain slow, patches pending | Upstream CI has a "Linux Qemu tests / riscv64" job; RISE ships tested wheels (e.g. 2.3.4) | manylinux riscv64 wheels not yet on PyPI upstream | [numpy/numpy#30216](https://github.com/numpy/numpy/issues/30216) (wheel tracking, blocked on openblas-libs riscv64 wheels and `setup-python` runner support); [#26200](https://github.com/numpy/numpy/issues/26200) (RVV SIMD, NEP-054); [#26734](https://github.com/numpy/numpy/issues/26734) (6 failing tests on real hardware) |
| HuggingFace Transformers | Model zoo; pulls in tokenizers/sentencepiece | Not independently determined | No riscv64-specific issues found | Inherited from torch/numpy/tokenizers | No dedicated riscv64 issue found; status gated by torch/tokenizers |
| tokenizers (Rust, via transformers) | Fast tokenization, SIMD/regex Rust core | Historically blocked: no `riscv64-unknown-linux-gnu` rustup target at time of report | Not testable until it builds | No riscv64 wheels found | [huggingface/tokenizers#1816](https://github.com/huggingface/tokenizers/issues/1816) - Rust's `riscv64gc-unknown-linux-gnu` is reported as now Tier 2 upstream, so this issue may be stale [NEEDS VERIFICATION] |
| sentencepiece | Alternative tokenizer backend | Not independently determined | No riscv64-specific issues found | No riscv64 wheels referenced | No riscv64-tagged issues found on `google/sentencepiece` |
| ONNX Runtime (`optimum-onnx` extra) | Graph execution/optimization, MLAS SIMD kernels | Builds from source with a cross toolchain (musl reported) | Reported: one build passes unit tests except one IEEE-754-vs-RISC-V spec discrepancy; another report of successful build with a severe 15% accuracy regression at runtime | No official riscv64 binary/wheel | [microsoft/onnxruntime#20030](https://github.com/microsoft/onnxruntime/issues/20030) (builds, model accuracy collapses to ~15% of baseline on riscv64, not yet root-caused); [Discussion #17466](https://github.com/microsoft/onnxruntime/discussions/17466) (community RISC-V proposal, references a separate `onnxruntime-riscv` fork) |
| OpenVINO Runtime (`optimum-intel[openvino]` extra) | JIT codegen ("jit_uni_*" CPU-plugin emitters), SIMD | Cross-compile only, no documented native build path | Not established upstream; QEMU emulation is the documented dev/test path | No riscv64 releases/wheels | [openvinotoolkit/openvino#30240](https://github.com/openvinotoolkit/openvino/issues/30240) (Good First Issue: `Minimum` op JIT emitter still needs a riscv64 implementation); prerequisite refactor in [PR #28749](https://github.com/openvinotoolkit/openvino/pull/28749) |
| Intel Neural Compressor (`optimum-intel[neural-compressor]` extra) | Quantization/compression numerics | Not independently determined | No riscv64-specific issues found | Gated by whichever backend (torch/onnxruntime) it invokes | No riscv64-tagged issues found |
| NNCF (`optimum-intel[nncf]` extra) | Post-training/QAT quantization for OpenVINO | Not independently determined | No riscv64-specific issues found | Gated by OpenVINO's riscv64 status | No riscv64-tagged issues found |
| Protocol Buffers (transitive) | Serialization for ONNX/OpenVINO IR | Not independently determined | No riscv64-specific issues found | Not expected to be a bottleneck | No riscv64-tagged issues found on `protocolbuffers/protobuf` |

**Overall dependency-chain picture:** Optimum's own code has no architecture-specific logic, so functional viability for any given backend is entirely inherited. Current bottlenecks: PyTorch has community CI/build infra but no official wheels and no optimized RVV kernel library; the Rust `tokenizers` crate's riscv64 target-triple status needs re-verification; ONNX Runtime builds but has an unresolved accuracy-correctness bug (#20030); OpenVINO is cross-compile-only with at least one JIT emitter unimplemented; NumPy is furthest along (upstream QEMU CI job, RISE-distributed test wheels) with remaining blockers in the OpenBLAS wheel chain.

## 10. Ecosystem Status

Optimum's functional value is delivered through a set of independently versioned, independently maintained companion PyPI packages ("hardware-partner extras"), each of which must itself be installable and correct on riscv64 for the corresponding Optimum feature to work: `optimum-onnx`, `optimum-intel`, `optimum-amd`, `optimum-habana`, `optimum-furiosa`, `optimum-graphcore`, `optimum-quanto`, plus documentation-only integrations for NVIDIA TensorRT-LLM, AWS Trainium/Inferentia, and Google TPU (source: `setup.py` `EXTRAS_REQUIRE` and the [Optimum docs landing page](https://huggingface.co/docs/optimum)).

None of these companion packages were found registered on the [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) (87-package list checked; only unrelated `hf-transfer` and `hf-xet` packages from the HuggingFace org appear). No riscv64 coverage fraction can be computed for this extras ecosystem because none of the individually named extras were located in any riscv64-specific package channel (PyPI riscv64-tagged wheel, RISE builder, or Ubuntu/Arch riscv64 repos) during this research pass - each would need to be checked individually [NEEDS VERIFICATION for each named extra beyond `optimum-onnx` and `optimum-intel`, which were assessed indirectly via their underlying backends in Section 9].

## 11. Known Bugs and Active Issues

No open or closed GitHub issue or PR in `huggingface/optimum` references RISC-V in any form - confirmed via `mcp__github__search_issues`, `search_pull_requests`, `search_code`, and `search_commits`, all returning `total_count: 0` for both "riscv" and "riscv64" query terms, and reconfirmed in a second independent verification pass.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64 issues exist in huggingface/optimum | N/A | N/A | Set is empty; there is nothing to report at the Optimum-repo level |

Correctness bugs in the dependency chain (not in Optimum itself, but load-bearing for anyone using Optimum on riscv64):

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [microsoft/onnxruntime#20030](https://github.com/microsoft/onnxruntime/issues/20030) | Model accuracy collapses (~15% of baseline) on riscv64 build | Open, unresolved | High (correctness) | ONNX Runtime builds successfully but produces materially wrong inference results on riscv64; not yet root-caused |
| [numpy/numpy#26734](https://github.com/numpy/numpy/issues/26734) | 6 failing tests on real riscv64 hardware | Reported | Medium | NumPy-level test failures on real hardware, separate from the QEMU CI job |
| [huggingface/tokenizers#1816](https://github.com/huggingface/tokenizers/issues/1816) | tokenizers cannot be compiled on riscv machine | Reported (possibly stale) | Medium (build-blocking if still current) | Cites a missing rustup target triple; Rust's `riscv64gc-unknown-linux-gnu` is reportedly now Tier 2 upstream, so this needs re-checking [NEEDS VERIFICATION] |
| [openvinotoolkit/openvino#30240](https://github.com/openvinotoolkit/openvino/issues/30240) | `Minimum` op JIT emitter not implemented for riscv64 | Open (tagged Good First Issue) | Medium (functional gap) | Confirms the OpenVINO CPU-plugin JIT codegen path is incomplete for riscv64 |

## 12. Objections and Upstream Blockers

No stated objections exist because no RISC-V port or proposal has ever been submitted to `huggingface/optimum` - there is nothing on record to object to. No technical blocker exists at the Optimum-repo level either, since the repository has no native code that could fail to compile on riscv64.

The practical blockers all sit one or two layers downstream, in the backend packages Optimum wraps: PyTorch's lack of official riscv64 wheels and unfinished optimized-kernel work ([pytorch/pytorch#180975](https://github.com/pytorch/pytorch/issues/180975)), ONNX Runtime's unresolved accuracy bug on riscv64 ([microsoft/onnxruntime#20030](https://github.com/microsoft/onnxruntime/issues/20030)), and OpenVINO's incomplete riscv64 JIT emitter coverage ([openvinotoolkit/openvino#30240](https://github.com/openvinotoolkit/openvino/issues/30240)). None of these are Optimum-specific and none require any change to the Optimum repository itself to resolve.

Organizationally: Hugging Face, Inc. has no documented process for accepting a new hardware backend, and no RISE-project engagement with HuggingFace or Optimum was found anywhere (blog, members list, working-group repos) - see the RISE cross-check in Section 13/14. Since Optimum needs no code change to "work" on riscv64 (it already installs and imports the same way it does everywhere), acceptance probability for a hypothetical "RISC-V port PR" is not a meaningful question - there is no port to accept or reject. The real gating work is entirely upstream, in the backend projects.

## 13. Readiness Assessment

- **Color:** green (no sub-type; the green case in this model has no `color_case` value)
- **Release provider:** upstream (the single universal `py3-none-any` wheel published on PyPI by Hugging Face, Inc. serves riscv64 with no separate artifact needed)
- **Optimization gap:** N/A. Optimum is an orchestration/integration layer with no numerical hot paths of its own (it delegates all execution to backend libraries); it does not meet the color model's optimization-purpose test ("would it still deliver its value with only generic C and no architecture-specific optimizations" - Optimum contains no C code of any kind, generic or otherwise, so the modifier does not apply). Optimization level is therefore omitted from the header per the instructions for non-optimization-purpose projects.
- **Justification:** Optimum ships no compiled or architecture-specific code (0 `.c`/`.cpp`/`.h`/`.s` files in the repository; no `ext_modules` in `setup.py`) and is distributed as a single universal `py3-none-any` wheel on [PyPI](https://pypi.org/pypi/optimum/json). Per Step 0 of the color model, an architecture-independent package installs and runs on riscv64 by construction and is classified green without penalty for the absence of upstream riscv64 CI (confirmed absent: all 14 [GitHub Actions workflows](https://github.com/huggingface/optimum/tree/main/.github/workflows) run exclusively on x86_64/arm64-macOS runners).
- **Caveat for leadership:** this green rating covers the Optimum *package artifact* only. Whether a given Optimum-mediated workload actually runs correctly on riscv64 hardware depends entirely on the invoked hardware-backend extra's own riscv64 maturity - see Sections 9 and 12. PyTorch-backed pipelines currently have no official riscv64 wheels (community CI only); `optimum-onnx` (ONNX Runtime) has an open, unresolved accuracy-correctness bug on riscv64 ([#20030](https://github.com/microsoft/onnxruntime/issues/20030)); `optimum-intel[openvino]` is cross-compile-only with at least one JIT emitter unimplemented ([#30240](https://github.com/openvinotoolkit/openvino/issues/30240)). None of these are Optimum bugs and none would change Optimum's own color, but they are the actual gate on end-to-end usability.
- **Pending work that could change the grade:** none found. No open PR against `huggingface/optimum` touches RISC-V, and no RISE-project engagement with HuggingFace or Optimum exists (checked: [riseproject.dev blog index](https://riseproject.dev/blog/), member/premier-member lists, and all 25 public repos in the `riseproject-dev` GitHub org). The grade is stable absent a change to Optimum's own packaging model (e.g., if it ever ships a compiled extension). Upstream backend maturation (PyTorch official wheels, the ONNX Runtime accuracy fix, OpenVINO JIT completion) would not change Optimum's own color but would materially change the caveat above.

## 14. Investment Analysis

Before sizing any work: RISE has not funded, tracked, or otherwise engaged HuggingFace Optimum specifically. Checked and confirmed empty: the full [RISE blog index](https://riseproject.dev/blog/) (34 posts), the RISE member/premier-member list, all 25 public repositories in the `riseproject-dev` GitHub org (including the AI/ML-relevant `ai-ml-wg`, `pytorch-ci`, and `python-wheels` repos), and the [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) package list. RISE-funded work exists for **PyTorch** (native riscv64 wheel builds, per the [Aug 2026 RISE blog post](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)) and for general Python wheel infrastructure (`pypi.riseproject.dev`), which Optimum would ride on for free if PyTorch's riscv64 wheels mature - but no RISE work targets Optimum, ONNX Runtime, or OpenVINO's riscv64 gaps directly.

### 14.1 Functional Enablement

Optimum itself requires no functional-enablement work - it already installs and runs on riscv64 as a universal wheel. All functional-enablement need sits in the backend dependencies: closing the ONNX Runtime accuracy bug ([#20030](https://github.com/microsoft/onnxruntime/issues/20030)) is the single highest-value, most concrete functional item, since it is a correctness bug on a build that otherwise works. Completing the OpenVINO `Minimum`-op JIT emitter and any remaining unimplemented ops ([#30240](https://github.com/openvinotoolkit/openvino/issues/30240)) is the second. Re-verifying and, if needed, unblocking the `tokenizers` Rust crate's riscv64 target-triple support ([#1816](https://github.com/huggingface/tokenizers/issues/1816)) is a low-effort verification task since Rust's riscv64gc target may have already matured past the issue's original report.

### 14.2 Performance Optimization

Not applicable to Optimum itself (no kernels of its own). Downstream, PyTorch's Phase 2 (optimized GEMM/kernel library, per [#180975](https://github.com/pytorch/pytorch/issues/180975)) is the largest performance item in the chain and is explicitly not yet started upstream. This is PyTorch-project work, not Optimum-project work, and should be sized/tracked under a PyTorch investment analysis rather than duplicated here.

### 14.3 CI/CD Infrastructure

Adding a riscv64 job to `huggingface/optimum`'s own CI (e.g., a build/import-smoke job on `test_common.yml`'s matrix, or a dedicated workflow) is low-effort in isolation, but its value is limited until at least one backend extra (most plausibly `optimum-onnx` once #20030 is fixed) has a working riscv64 wheel to test against - otherwise the job would only validate the trivial pure-Python import path. RISE riscv64 GitHub-hosted runners ([announced March 2026](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) are a plausible free CI resource for this if HuggingFace chooses to add such a job, but no such engagement currently exists.

### 14.4 Ecosystem Enablement

Each hardware-partner extra (`optimum-onnx`, `optimum-intel`, `optimum-amd`, `optimum-habana`, `optimum-furiosa`, `optimum-graphcore`, `optimum-quanto`) would need individual riscv64 verification; none were found registered on the RISE wheel builder. This work is gated by, and should follow rather than precede, the underlying backend libraries' own riscv64 maturity (see Section 9/10).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Root-cause and fix ONNX Runtime riscv64 accuracy regression ([#20030](https://github.com/microsoft/onnxruntime/issues/20030)) | Data not available: no effort estimate found in any source for this bug | ONNX Runtime upstream (not Optimum) | Critical |
| Functional | Implement remaining riscv64 JIT emitters in OpenVINO CPU plugin, starting with `Minimum` ([#30240](https://github.com/openvinotoolkit/openvino/issues/30240)) | Data not available: issue is tagged "Good First Issue" with no formal estimate | OpenVINO upstream (not Optimum) | High |
| Functional | Re-verify `tokenizers` Rust crate riscv64 target-triple status and close or update [#1816](https://github.com/huggingface/tokenizers/issues/1816) | Data not available: no estimate found; likely low effort given it may already be resolved by Rust Tier 2 status | tokenizers upstream (not Optimum) | Medium |
| CI/CD | Add a riscv64 build/import-smoke job to `huggingface/optimum` CI (pure-Python path only) | Data not available: no estimate found in sources | Optimum maintainers | Low (limited value until backend extras have riscv64 wheels) |
| Ecosystem | Verify/register riscv64 wheel availability for each hardware-partner extra individually | Data not available: no per-package estimate found | Respective extra maintainers / RISE wheel builder | Medium |
| Performance | Track PyTorch Phase 2 (optimized riscv64 GEMM/kernel library) as a prerequisite, do not duplicate as Optimum work | N/A (owned by PyTorch project) | PyTorch upstream | N/A - out of scope for Optimum |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [huggingface/optimum GitHub repository](https://github.com/huggingface/optimum)
- [HuggingFace Optimum documentation](https://huggingface.co/docs/optimum)
- [huggingface/optimum `.github/workflows/` directory](https://github.com/huggingface/optimum/tree/main/.github/workflows)
- [huggingface/optimum releases](https://github.com/huggingface/optimum/releases)
- [PyPI JSON API: `optimum`](https://pypi.org/pypi/optimum/json)
- [PyPI JSON API: `huggingface-optimum` (404, package does not exist under this name)](https://pypi.org/pypi/huggingface-optimum/json)
- [RISE GitLab PyPI wheel builder simple index for `huggingface-optimum`](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/huggingface-optimum/)
- [RISE Python wheel builder full package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu packages search (suite: resolute) for HuggingFace Optimum / optimum](https://packages.ubuntu.com/search?keywords=HuggingFace%20Optimum&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package index query](https://archriscv.felixc.at/?q=huggingface%20optimum)
- [RISE Project blog index](https://riseproject.dev/blog/)
- [RISE blog: "PyTorch is available on riscv64!" (2026-08-18)](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE blog: "Easy Installation of Binary Python Packages on riscv64 Devices" (2025-05-14)](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE blog: "Announcing the RISE RISC-V Runners" (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [pytorch/pytorch#180975 (riscv64 tracking issue)](https://github.com/pytorch/pytorch/issues/180975)
- [pytorch/pytorch#147513 (RVV support RFC)](https://github.com/pytorch/pytorch/issues/147513)
- [pytorch/pytorch#171659 (XuanTie roadmap RFC)](https://github.com/pytorch/pytorch/issues/171659)
- [pytorch/pytorch#99278 (libstdc++ build error)](https://github.com/pytorch/pytorch/issues/99278)
- [numpy/numpy#30216 (manylinux riscv64 wheel tracking)](https://github.com/numpy/numpy/issues/30216)
- [numpy/numpy#26200 (RVV SIMD support, NEP-054)](https://github.com/numpy/numpy/issues/26200)
- [numpy/numpy#26734 (failing tests on real riscv64 hardware)](https://github.com/numpy/numpy/issues/26734)
- [numpy/numpy#25430](https://github.com/numpy/numpy/pull/25430) and [#25618](https://github.com/numpy/numpy/pull/25618) (NaN-sign edge case fixes)
- [huggingface/tokenizers#1816 (riscv compile failure)](https://github.com/huggingface/tokenizers/issues/1816)
- [microsoft/onnxruntime#20030 (riscv64 accuracy regression)](https://github.com/microsoft/onnxruntime/issues/20030)
- [microsoft/onnxruntime Discussion #17466 (community RISC-V support proposal)](https://github.com/microsoft/onnxruntime/discussions/17466)
- [openvinotoolkit/openvino#30240 (`Minimum` op JIT emitter for riscv64)](https://github.com/openvinotoolkit/openvino/issues/30240)
- [openvinotoolkit/openvino PR #28749 (prerequisite refactor)](https://github.com/openvinotoolkit/openvino/pull/28749)
- Local repository clone used for direct file/manifest verification: `/home/user/huggingface/optimum` (commit `52367da7f2d227d82db26d0de10f44c297b8c1eb`)
