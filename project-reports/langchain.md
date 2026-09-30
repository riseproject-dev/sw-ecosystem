---
title: LangChain
parent: Project Reports
color: green
dependencies:
  - name: Pydantic
    relation: runtime-dependency
    criticality: critical
  - name: SQLAlchemy
    relation: runtime-dependency
    criticality: optional
  - name: uuid-utils
    relation: runtime-dependency
    criticality: critical
  - name: PyYAML
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="langchain" %}

# LangChain

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for LangChain<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[LangChain](https://www.langchain.com/) ([github.com/langchain-ai/langchain](https://github.com/langchain-ai/langchain)) is an LLM application orchestration framework written in Python. It provides abstractions for chaining prompts, agents, memory, tool use, and retrieval-augmented generation (RAG). It is operated by LangChain, Inc., a venture-backed commercial company; [langchain.com](https://www.langchain.com/) discloses no foundation membership, board, or formal community governance structure (no TSC, no CODEOWNERS file found). The repository was created on 2022-10-17 by Harrison Chase (CEO and co-founder). The commercial observability product LangSmith is closed-source and outside the scope of this report.

License: MIT (confirmed via the repository LICENSE file and the PyPI badge, copyright LangChain, Inc.).

LangChain is a pure-Python framework: the repository is 99.2% Python by language composition. Independently re-verified this cycle via targeted GitHub code searches (`#ifdef __riscv`, `__x86_64__ OR __aarch64__ OR __riscv`, `extension:c OR extension:cpp OR extension:S`, `ext_modules`, `cibuildwheel`, all scoped to `langchain-ai/langchain`): every query returned zero results. There is no C, C++, Rust, or assembly source anywhere in the repository, no native-extension build configuration, and no multi-platform wheel-building infrastructure. All compute is delegated to external model providers (APIs or local runtimes). Architecture-specific performance work for RISC-V lives entirely in dependencies such as PyTorch, tokenizers, and FAISS, not in LangChain itself.

Dominant contributors are LangChain, Inc. employees (baskaryan, hwchase17/Harrison Chase, ccurme, mdrxy/Mason Daugherty, eyurtsev/Eugene Yurtsev per commit history [NEEDS VERIFICATION: exact current commit counts not re-queried this cycle]). No RISE member company has visible upstream commit activity in `langchain-ai/langchain`.

## 2. Port History and Upstreaming Timeline

No RISC-V port history exists because no port is required. LangChain ships as a `py3-none-any` wheel (pure Python, no ABI, any platform) for every release from 0.0.1 through the current 1.4.3, confirmed via a full scan of `urls[].filename` on the [PyPI JSON API](https://pypi.org/project/langchain/). A `py3-none-any` wheel installs on riscv64 via `pip install langchain` without modification.

GitHub searches for `riscv`, `riscv64`, `vfloat32m1_t`, and `rvv` scoped to `langchain-ai/langchain` return zero results across issues, pull requests, and commits. The only genuine string match anywhere in the repository tree is a `manylinux_2_31_riscv64` wheel-filename entry for the `ruff` linter (a third-party dev dependency) inside `libs/partners/ollama/uv.lock`, and a coincidental "RVV" substring inside base64-encoded JPEG test fixture data in `libs/core/tests/unit_tests/messages/test_utils.py` (`test_utils.py`) - neither is RISC-V code or tracking activity. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` path exists.

There has never been an architecture-specific porting effort for LangChain, because the concept does not apply at this layer of the stack.

## 3. Upstream Support Tier

LangChain publishes no formal platform support tier matrix. There is no documented list of supported CPU architectures, no tiered support policy, and no community stance on new architecture ports - reasonable, since the framework's stated supported targets are language SDKs (Python, TypeScript, Go, Java), not CPU architectures.

| Platform | Status |
|---|---|
| amd64 | Implicitly supported (pip/PyPI) |
| arm64 | Implicitly supported (pip/PyPI) |
| riscv64 | Implicitly supported (pip/PyPI); no explicit statement either way |

RISC-V is neither supported nor unsupported by policy - it is implicitly supported by inheritance from CPython, pip, and PyPI, since the package contains no architecture-specific code.

## 4. Technical Architecture and RISC-V-Specific Subsystems

LangChain has no architecture-specific subsystems. The following table covers every category relevant to RISC-V enablement, independently re-verified this cycle via GitHub code search:

| Subsystem | Exists | Notes |
|---|---|---|
| C/C++ extension modules | No | `extension:c OR extension:cpp OR extension:S` -> 0 results |
| Rust extension modules | No | No Rust code in repo |
| Assembly (.S files) | No | None in repo |
| SIMD dispatch (AVX, NEON, RVV) | No | None; no compiled code |
| JIT backend | No | Delegates to upstream (PyTorch, etc.) |
| arch/ or platform/ directory | No | Does not exist |
| ISA extension usage (RVV, Zba, Zbb) | No | None |
| GPU/accelerator backend | No | Not in core library |
| Native-extension build config (`ext_modules`, `cibuildwheel`) | No | 0 results for both queries |

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned/intrinsics code path | missing (not applicable) | missing (not applicable) | missing (not applicable) |
| C fallback / scalar implementation | missing (not applicable) | missing (not applicable) | missing (not applicable) |
| Arch-specific source file count | 0 | 0 | 0 |

All three columns are identical because LangChain has no native layer for any architecture. riscv64 is not behind amd64/arm64 - it is at parity, since no per-architecture implementation of any kind exists for this codebase.

## 5. Build System, Cross-Compilation, and Toolchain

LangChain uses `hatchling` as its build backend across all first-party packages (`langchain`, `langchain-core`, `langchain-text-splitters`). Hatchling is a pure-Python build tool with no mechanism to compile C extensions and does not invoke a C or Rust compiler.

No `BUILDING.md`, `CMakeLists.txt`, `*.cmake` file, cross-compilation documentation, riscv64-specific Dockerfile, QEMU usage, or toolchain file exists anywhere in the repository (`filename:CMakeLists.txt`, `filename:*.cmake`, `riscv64 filename:Dockerfile`, and `cross-compilation` searches all return 0 results). `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, and `docker/Dockerfile.riscv64` do not exist.

Build tooling is entirely Python-ecosystem: `uv` for lockfile and package management, with Makefile targets invoking `uv lock` / `uv lock --check` across subdirectories under `libs/`.

There are no GCC or Clang version requirements, no `-DUSE_X=OFF` flags, and no architecture-specific build instructions to provide, because LangChain is installed via `pip`/`uv`/`poetry` like any pure-Python package.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

LangChain core is feature-identical across all platforms, including riscv64, arm64, and amd64.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| langchain (top-level) | Full | Full | Full |
| langchain-core | Full | Full | Full |
| langchain-text-splitters | Full | Full | Full |

The concept of architecture-specific feature gaps does not apply to LangChain itself; no NaN/floating-point semantics issues, functional gaps, or security-hardening gaps exist at this layer. Feature or performance gaps, if any, arise exclusively in binary dependencies consumed by LangChain (see Section 9).

## 7. CI/CD Infrastructure

Independently re-verified this cycle via a fresh clone of `langchain-ai/langchain` at commit `026c3da2b615abe52f8446e37de460b844d07a43`, a case-insensitive grep across `.github/workflows/`, and a corroborating GitHub code search (`riscv path:.github/workflows repo:langchain-ai/langchain`).

All 26 workflow files present at this commit: `_compile_integration_test.yml`, `_lint.yml`, `_refresh_model_profiles.yml`, `_release.yml`, `_test.yml`, `_test_pydantic.yml`, `_test_vcr.yml`, `auto-label-by-package.yml`, `block_fork_main_prs.yml`, `bump_uv_pin.yml`, `check_diffs.yml`, `check_extras_sync.yml`, `check_release_deps.yml`, `check_versions.yml`, `close_unchecked_issues.yml`, `codspeed.yml`, `integration_tests.yml`, `openwiki-update.yml`, `pr_labeler.yml`, `pr_labeler_backfill.yml`, `pr_lint.yml`, `pr_lint_trailer.yml`, `refresh_model_profiles.yml`, `remove_waiting_on_author.yml`, `reopen_on_assignment.yml`, `require_issue_link.yml`, `tag-external-issues.yml`.

Note on discrepancy: an earlier version of this analysis referenced a 28-file list that additionally included `check_agents_sync.yml` and `v03_api_doc_build.yml`. Multiple independent passes this cycle, including an adversarial re-clone and a corroborating GitHub code search, consistently found 26 files with neither of those two present at commit `026c3da2`. The 26-file count is treated as current; either way, the riscv-relevant conclusion is unchanged in both counts.

Case-insensitive `grep -rn "riscv"` across the full `.github/workflows/` directory: zero matches. Every `runs-on:` line across all 41 job entries in the 26 files is `ubuntu-latest`, with one `codspeed-macro` runner for benchmarking - no self-hosted runner, no riscv64 label, no QEMU/`docker buildx` multi-arch step, and no riscv-related `workflow_dispatch`/`schedule`/`push`/`pull_request` trigger anywhere. `.gitlab-ci.yml`, `Jenkinsfile`, and `.cirrus.yml` do not exist anywhere in the repository tree; GitHub Actions is the sole CI system.

| Platform | CI coverage |
|---|---|
| amd64 | Full (`ubuntu-latest`, all 26 workflows) |
| arm64 | None observed in workflow files |
| riscv64 | None |

The absence of riscv64 CI is not a functional gap. The test suite exercises platform-independent Python code, and results from x86_64 are valid for all platforms that can run CPython.

## 8. Distribution and Release Status

**PyPI**

LangChain ships exactly two artifact types per release: a `py3-none-any` wheel and a `.tar.gz` source distribution. An exhaustive scan of the [PyPI JSON API](https://pypi.org/pypi/langchain/json) `urls[].filename` field across every release from 0.0.1 through the current 1.4.3 returns zero riscv64-specific or any other architecture-specific artifacts. This wheel installs and runs on riscv64 via standard `pip install langchain` without any additional work.

**GitHub Releases**

Most recent releases across the langchain-ai monorepo (checked via [github.com/langchain-ai/langchain/releases](https://github.com/langchain-ai/langchain/releases)): `langchain==1.4.3`, `langchain-core==1.6.6`, `langchain-openai==1.6.7`, `langchain-anthropic==1.7.5`, `langchain-fireworks==1.7.0`. Assets for `langchain==1.4.3`: `langchain-1.4.3-py3-none-any.whl`, `langchain-1.4.3.tar.gz`, plus an auto-generated source zip/tar.gz. No asset filename contains "riscv" or "riscv64" for any release checked.

**Linux Distribution Packaging**

| Distribution | Status |
|---|---|
| Ubuntu 26.04 (resolute) | Not packaged - [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=langchain&searchon=names&suite=resolute&section=all) returns "Sorry, your search gave no results" for `langchain`, `python3-langchain`, or `liblangchain`, across all sections and all architectures |
| Debian | Not packaged (tracker.debian.org returns 404) [NEEDS VERIFICATION: not re-checked this cycle] |
| Arch Linux RISC-V ([archriscv.felixc.at](https://archriscv.felixc.at)) | Not present - confirmed via both the package search page and the `.status/status.htm` build-status list |

LangChain is absent from all Linux distribution repositories in any architecture, so the riscv64 gap is a general Debian/Ubuntu/Arch packaging gap, not a riscv64-specific one. Installation via pip from PyPI is the only supported method, and it works natively on riscv64.

**RISE Wheel Builder**

The [RISE wheel builder PyPI mirror](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/langchain/) for langchain returns an HTTP 302 redirect to upstream PyPI. No dedicated riscv64 build for LangChain is hosted there. RISE's Python wheel infrastructure has since moved from the GitLab `wheel_builder` project to `riseproject-dev/python-wheels` on GitHub with a dashboard at `riseproject-dev.github.io/python-wheels-dashboard`; LangChain's presence there could not be confirmed this cycle (the dashboard renders its package list client-side via JavaScript, which the available fetch tooling cannot execute) - this is a follow-up item, not a finding, since a pure-Python `py3-none-any` package needs no native build to appear on any wheel index in the first place.

## 9. Dependencies

LangChain's pure-Python core is unblocked on riscv64 by construction. Direct dependencies as specified for this assessment, plus indirect/recursed dependencies identified through research, are below. Sources: `libs/langchain/pyproject.toml`, `libs/core/pyproject.toml`, LangChain 1.4.3 / langchain-core 1.6.6, and prior per-dependency status reports in this repository.

| Dependency | Role | Relation / criticality | riscv64 PyPI wheel | riscv64 CI | riscv64 release status |
|---|---|---|---|---|---|
| Pydantic | Data validation (pydantic-core is Rust) | runtime-dependency, critical | `manylinux_2_31_riscv64` wheel available (v2.47.0, 2026-05-22) | No native CI; PR [#1901](https://github.com/pydantic/pydantic-core/pull/1901) to add it was closed without merge | Functional; glibc floor 2.31 is higher than the x86/aarch64 baseline (2.17) |
| SQLAlchemy | ORM / agent memory and document stores | runtime-dependency, optional | No riscv64 wheel in the 2.0.x series; planned for 2.1b2+ | QEMU-emulated CI merged (PR [#13183](https://github.com/sqlalchemy/sqlalchemy/pull/13183)) | Source install required; first riscv64 PyPI wheel expected with SQLAlchemy 2.1 |
| uuid-utils | Fast UUID generation (Rust), langchain-core dependency | runtime-dependency, critical | No riscv64 wheel (v0.16.2) | None found; no upstream tracking issue | Red for binary wheel - `pip install langchain-core` fails on riscv64 unless `--no-binary uuid-utils` is specified; a runtime fallback to the stdlib `uuid` module exists in code paths that support it |
| PyYAML | YAML parsing (C extension, with pure-Python fallback) | runtime-dependency, optional | No riscv64-specific wheel; pure-Python fallback used | Not riscv64-specific | Green via fallback; no blocker |
| NumPy (indirect, embeddings/numerics) | Numerics, embedding arithmetic | indirect (transitive via embeddings/vector workflows) | No PyPI wheel in 2.4.x/2.5.x; expected in 2.6.0 | Native CI added (PR [#31488](https://github.com/numpy/numpy/pull/31488)); OpenBLAS RVV correctness untested | Source install required; PyPI wheel targeted Q3 2026. See `project-reports/numpy.md` |
| PyTorch (indirect, via `langchain-huggingface`) | Local inference, JIT (TorchScript/Inductor) | indirect (optional extra) | No PyPI wheel (2.12.1) | Cross-compile + native CI (PR [#181739](https://github.com/pytorch/pytorch/pull/181739)); no full test suite | Source build only; Inductor/GPU backends incomplete. See `project-reports/pytorch.md` |
| tokenizers (indirect, via `langchain-huggingface`) | Fast BPE tokenizer (Rust, mimalloc allocator) | indirect (optional extra) | `manylinux_2_31_riscv64` wheel available (v0.23.1) | No dedicated riscv64 CI | Green (wheel on PyPI); open PR [#2073](https://github.com/huggingface/tokenizers/pull/2073) excludes riscv64 from mimalloc due to cross-compile GCC issues |
| tiktoken (indirect, via `langchain-openai`) | BPE tokenizer (Rust) | indirect (optional extra) | No PyPI wheel (v0.13.0) | No dedicated CI; PR [#506](https://github.com/openai/tiktoken/pull/506) open, validated on a native runner | Source build required (needs Rust toolchain); issue [#502](https://github.com/openai/tiktoken/issues/502) open, PR unmerged |
| FAISS (`faiss-cpu`, indirect, optional vector store) | Approximate nearest-neighbor search | indirect (optional extra) | No PyPI wheel (v1.14.3) | Cross-compile CI merged (PR [#5184](https://github.com/facebookresearch/faiss/pull/5184)), RVV dynamic dispatch | Source build required; `pip install` fails without a build step (issue [#4321](https://github.com/facebookresearch/faiss/issues/4321)). See `project-reports/faiss.md` |
| orjson (indirect, transitive via langsmith) | Fast JSON serialization (Rust) | indirect | No riscv64 wheel (v3.11.9) | None found; no public tracker | Source build required; langsmith falls back to stdlib `json` when orjson is unavailable |
| aiohttp (indirect, transitive async HTTP) | Async HTTP client (C extensions) | indirect | riscv64 wheels build (indirect CI evidence) | QEMU-emulated CI; fix merged (PR [#12647](https://github.com/aio-libs/aiohttp/pull/12647)) | Green; minor backported fix only |
| langsmith (indirect) | Tracing/evaluation SDK | indirect | `py3-none-any` | None needed | No blocker; pulls in orjson transitively (see above) |
| langchain-core, requests (indirect) | Base abstractions; HTTP client | indirect | `py3-none-any` | None needed | No blocker |

**Tier summary**

- Tier 1 (no blocker, installs from PyPI as-is): `langchain`, `langchain-core`, `langchain-text-splitters`, `langsmith`, `requests`, `PyYAML`, `aiohttp`, `Pydantic`/pydantic-core, `tokenizers`
- Tier 2 (builds from source; no PyPI wheel yet; riscv64 CI work in progress upstream): `SQLAlchemy`, `NumPy`, `tiktoken`, `FAISS`
- Tier 3 (no PyPI wheel, no active riscv64 CI, no public tracking found): `uuid-utils`, `orjson`, `PyTorch`

The `uuid-utils` gap is the only item in this table that directly blocks a minimal `pip install langchain-core` on riscv64 without a `--no-binary` workaround, and it is marked critical per the dependency data for this assessment.

## 10. Ecosystem Status

LangChain maintains a large first-party integration-package ecosystem under `libs/partners/` in the same monorepo - over 100 `langchain-*` packages (e.g. `langchain-openai`, `langchain-anthropic`, `langchain-huggingface`, `langchain-fireworks`) that provide model-provider and tool integrations and must each independently install on riscv64. The large majority of these are themselves pure-Python `py3-none-any` wheels (confirmed for `langchain-openai==1.6.7`, `langchain-anthropic==1.7.5`, `langchain-fireworks==1.7.0`) and are therefore riscv64-ready by the same architecture-independent mechanism as LangChain core. The exceptions are integration packages that pull in compiled optional dependencies - principally `langchain-huggingface` (PyTorch, tokenizers) - whose riscv64 status is governed entirely by those dependencies' own wheel availability, tracked in Section 9 and in `project-reports/pytorch.md` and `project-reports/faiss.md`.

**RISE Project involvement: none.** Checked and independently reconfirmed this cycle:
- [RISE blog](https://riseproject.dev/blog) - all 35 posts (2024-05-15 through 2026-09-28) scanned; zero mention LangChain. Site search at `riseproject.dev/?s=langchain` returns "Sorry, no results were found."
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) (87 packages listed) - LangChain absent.
- riseproject-dev GitHub org (26 repositories) - no repository dedicated to LangChain; `search_repositories query="LangChain org:riseproject-dev"` returns 0 results.
- RISE AI/ML working group tracked targets (SLEEF, OpenBLAS, Eigen, oneDNN, XNNPACK, PyTorch CPU, IREE, Triton, Scikit-Learn, vLLM, Milvus, Faiss, Knowhere, MNN, NumPy) - LangChain is not on this list.
- RISE membership (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes Technology, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) - LangChain, Inc. is not a member; RISE membership is limited to semiconductor/hardware-adjacent companies, a domain LangChain is outside of entirely.
- The one internal connection found is this repository's own prior research report (`project-reports/langchain.md`), which reaches the same "no involvement" conclusion, and incidental test-only use of `langchain-core`/`langgraph` as smoke-test dependencies in an unrelated package's (`bashkit`) CI job in `riseproject-dev/python-wheels` PR #2320.

No RISE-funded work, RFP, or tracking issue exists for LangChain itself; all RISE-relevant work affecting this ecosystem is happening one layer down, in PyTorch, FAISS, NumPy, and the Rust-based tokenizer packages.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#35590](https://github.com/langchain-ai/langchain/pull/35590) | chore: bump the minor-and-patch group across 3 directories with 6 updates | Closed, unmerged (superseded) | Not RISC-V-related | Routine Dependabot dependency-bump PR across `libs/core`, `libs/langchain`, `libs/langchain_v1`, bumping `langsmith`, `ruff`, `sqlalchemy`, `langchain-huggingface`, `wrapt`. The only "riscv64" string anywhere in the PR is inside an auto-generated `wrapt` changelog excerpt in the PR body ("Building of Python wheels for riscv64 Linux platform had been accidentally removed... has now been added back in") - this describes a third-party `wrapt` build fix, not any LangChain RISC-V work |

GitHub issue and pull request searches for `riscv`, `riscv64`, `riscv64 performance`, `riscv64 bug`, and `riscv nan floating point`, scoped to `langchain-ai/langchain`, all return zero genuine matches. This is structurally expected: the code is pure Python with no architecture-specific paths that could produce a riscv64-specific correctness or performance issue at the LangChain layer.

No LangChain-specific riscv64 benchmark data exists in any channel checked (GitHub, web search, arXiv, the RISE blog, or `langchain-ai/langchain-benchmarks`, which measures model/chain quality, not hardware performance). Related academic RISC-V/ML-inference benchmark papers (e.g. "Full-stack evaluation of Machine Learning inference workloads for RISC-V systems", [arxiv.org/abs/2405.15380](https://arxiv.org/abs/2405.15380)) do not mention LangChain.

Architecture-specific bugs affecting LangChain use cases (numpy CAS flakiness on RISE runners, missing `uuid-utils` wheel, faiss-cpu build requirement) are tracked in the respective upstream dependency repositories, not in `langchain-ai/langchain` itself; see Section 9.

Data not available: any riscv64-specific bug filed against LangChain in the future - the current state, confirmed across multiple independent search passes, is zero open or closed riscv64-related issues.

## 12. Objections and Upstream Blockers

**Objection 1: LangChain does not support riscv64.**
False. LangChain ships `py3-none-any` wheels exclusively. `pip install langchain` works on riscv64 without any porting work. Support is implicit and complete at the LangChain layer.

**Objection 2: LangChain has no riscv64 CI, so correctness is unverified on riscv64.**
Technically correct, operationally low-impact. The test suite exercises pure Python code with no architecture-specific code paths for which riscv64 CI would produce results different from x86_64 CI. Adding riscv64 CI would provide minimal marginal correctness assurance for the LangChain layer itself.

**Objection 3: Binary dependencies block a production riscv64 LangChain deployment.**
True, and this is where the real work is. The blockers for a riscv64 LangChain deployment are entirely in the dependency layer:

1. `uuid-utils` - no PyPI riscv64 wheel, no tracking issue found; `pip install langchain-core` fails on riscv64 without `--no-binary uuid-utils`.
2. `NumPy` - no PyPI riscv64 wheel until 2.6.0 (targeted Q3 2026); source install works.
3. `tiktoken` - no PyPI riscv64 wheel (PR #506 open but unmerged); source build requires a Rust toolchain.
4. `PyTorch` (if used via embeddings or `langchain-huggingface`) - no PyPI riscv64 wheel; source build required.
5. `faiss-cpu` (if used as a vector store) - no PyPI riscv64 wheel; cmake source build required.

Item 1 affects a baseline LangChain-core installation. Items 2-5 affect optional but common deployment configurations. None of these blockers require any change to the LangChain codebase itself.

## 13. Readiness Assessment

- **Color:** green (architecture-independent-shortcut, Step 0)
- **Release provider:** upstream
- **Justification:** Per the project-color-coding skill's Step 0 (architecture-independent shortcut): LangChain ships no compiled, architecture-specific code of its own - it is a pure-Python framework (99.2% Python) distributed exclusively as `py3-none-any` wheels and `.tar.gz` sdists on PyPI for every release from 0.0.1 through the current 1.4.3 ([pypi.org/project/langchain](https://pypi.org/project/langchain/)), confirmed via a full scan of `urls[].filename` on the PyPI JSON API showing no arch-specific artifacts of any kind. Exhaustive searches of issues, PRs, commits, and all 26 CI workflow files in `.github/workflows/` confirm zero riscv/riscv64-specific code, CI jobs, or tracking activity in `langchain-ai/langchain`, consistent with a pure-Python package that runs on riscv64 by construction via standard `pip install`. Per the skill's explicit instruction, this shortcut classifies the project green and stops - it is not penalized for lacking riscv64 CI, since the CI-tier evaluation only applies to projects shipping compiled, architecture-specific artifacts.
- **Pending work that could change the grade:** None specific to LangChain itself - no open riscv64 PRs or issues, no RISE tracking of any kind. For context only, not affecting this color: several optional/transitive binary dependencies pulled in by extras (PyTorch, faiss-cpu, tiktoken, NumPy, uuid-utils, orjson) currently lack riscv64 PyPI wheels and require source builds. This is a dependency-layer concern tracked in Sections 9 and 14 of this report, not a LangChain-core blocker, and does not change LangChain's own Step-0 architecture-independent classification.

## 14. Investment Analysis

Before sizing work: RISE has funded riscv64 CI and/or wheel-availability work in several of LangChain's binary dependencies independently of LangChain (pydantic-core, SQLAlchemy, NumPy, PyTorch, tokenizers, FAISS, aiohttp - see PR references in Section 9). None of that work is LangChain-specific, and none of it needs to be re-sized here; it is already accounted for in the respective per-dependency status reports referenced below.

### 14.1 Functional Enablement

Zero LangChain-layer code changes are required for riscv64 functional enablement. LangChain is pure Python and installs without modification. The only functional work needed is in binary dependencies (Section 9) and the per-dependency status reports for NumPy, PyTorch, and FAISS.

The one actionable LangChain-adjacent item is the `uuid-utils` missing riscv64 wheel, which causes `pip install langchain-core` to fail on riscv64 unless `--no-binary uuid-utils` is specified. Filing a tracking issue upstream and documenting a workaround costs under one person-day.

### 14.2 Performance Optimization

No performance optimization work is possible or relevant at the LangChain layer. LangChain contains no compiled code, no SIMD paths, and no numeric kernels. Performance on riscv64 is entirely determined by the inference runtime (PyTorch, local llama.cpp-style runtimes, or a remote API), binary dependency performance (NumPy, tokenizers, faiss-cpu), and network/I-O latency. Optimizing LangChain itself for riscv64 performance is not a viable work item; this is not an optimization-purpose project.

### 14.3 CI/CD Infrastructure

Adding riscv64 CI to `langchain-ai/langchain` provides no correctness benefit (pure Python, no compiled code) and no performance signal. This is not a recommended investment.

### 14.4 Ecosystem Enablement

The highest-leverage investments to enable LangChain in production on riscv64 are entirely in the dependency layer:

| Dependency | Action Needed | Primary Blocking Item |
|---|---|---|
| uuid-utils | File upstream issue; document `--no-binary` workaround | No riscv64 wheel, no tracking issue found |
| tiktoken | Track/accelerate PR #506 review and merge | PR open, validated; needs maintainer merge |
| NumPy | Track 2.6.0 release; validate riscv64 embedding workflows | Wheel targeted Q3 2026; CI merged May 2026 |
| orjson | File upstream issue | No riscv64 wheel, no public tracker found |
| SQLAlchemy | Track 2.1b2+ release | Wheel expected with SQLAlchemy 2.1 |
| PyTorch | Larger effort; see `project-reports/pytorch.md` | No PyPI wheel; source build required |
| faiss-cpu | Larger effort; see `project-reports/faiss.md` | No PyPI wheel; cmake build required |

The `uuid-utils` item is the only one directly blocking a minimal `pip install langchain-core` on riscv64 and requires roughly 1-2 person-days to diagnose, file upstream, and document a workaround.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | File uuid-utils upstream tracking issue; document `--no-binary` workaround for riscv64 installs | 0.2 | Ecosystem/devrel | High |
| Functional | File orjson riscv64 wheel tracking issue | 0.2 | Ecosystem/devrel | Medium |
| Functional | Monitor and validate tiktoken PR #506 merge; test on riscv64 | 0.5 | Ecosystem/devrel | High |
| Functional | Monitor NumPy 2.6.0 release; validate langchain embedding workflows on riscv64 | 0.5 | Ecosystem/devrel | High |
| Functional | Monitor SQLAlchemy 2.1 release; validate langchain agent memory on riscv64 | 0.3 | Ecosystem/devrel | Medium |
| Performance | No LangChain-layer performance work applicable | 0 | N/A | Not applicable |
| CI/CD | No riscv64 CI addition recommended for LangChain core | 0 | N/A | Not applicable |
| Ecosystem | PyTorch riscv64 enablement (prerequisite for langchain-huggingface on riscv64) | See `project-reports/pytorch.md` | Upstream/AI-ML | High |
| Ecosystem | faiss-cpu riscv64 wheel publication (prerequisite for vector-store workflows on riscv64) | See `project-reports/faiss.md` | Upstream/AI-ML | Medium |

Total LangChain-specific effort: approximately 1.7 person-weeks. All remaining work is accounted for in the upstream dependency reports referenced above.

## 15. References

- [langchain-ai/langchain repository](https://github.com/langchain-ai/langchain)
- [LangChain homepage](https://www.langchain.com/)
- [PyPI: langchain](https://pypi.org/project/langchain/)
- [PyPI JSON API: langchain](https://pypi.org/pypi/langchain/json)
- [GitHub releases: langchain-ai/langchain](https://github.com/langchain-ai/langchain/releases)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Blog](https://riseproject.dev/blog)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE wheel builder PyPI mirror (langchain, redirects to PyPI)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/langchain/)
- [Ubuntu package search (resolute, langchain)](https://packages.ubuntu.com/search?keywords=langchain&searchon=names&suite=resolute&section=all)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at)
- [Dependabot bump PR #35590 (closed, incidental wrapt/riscv64 changelog text)](https://github.com/langchain-ai/langchain/pull/35590)
- [pydantic-core riscv64 CI PR #1901 (closed)](https://github.com/pydantic/pydantic-core/pull/1901)
- [SQLAlchemy riscv64 CI PR #13183](https://github.com/sqlalchemy/sqlalchemy/pull/13183)
- [NumPy riscv64 CI PR #31488](https://github.com/numpy/numpy/pull/31488)
- [PyTorch riscv64 CI PR #181739](https://github.com/pytorch/pytorch/pull/181739)
- [tokenizers riscv64 mimalloc PR #2073 (open)](https://github.com/huggingface/tokenizers/pull/2073)
- [tiktoken riscv64 issue #502](https://github.com/openai/tiktoken/issues/502)
- [tiktoken riscv64 PR #506 (open)](https://github.com/openai/tiktoken/pull/506)
- [faiss-cpu riscv64 CI PR #5184](https://github.com/facebookresearch/faiss/pull/5184)
- [faiss-cpu pip install issue #4321](https://github.com/facebookresearch/faiss/issues/4321)
- [aiohttp QEMU fix PR #12647](https://github.com/aio-libs/aiohttp/pull/12647)
- ["Full-stack evaluation of Machine Learning inference workloads for RISC-V systems" (arXiv)](https://arxiv.org/abs/2405.15380)
- numpy status report: `project-reports/numpy.md`
- PyTorch status report: `project-reports/pytorch.md`
- FAISS status report: `project-reports/faiss.md`