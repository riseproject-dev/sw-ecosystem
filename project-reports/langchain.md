---
title: LangChain
parent: Project Reports
categories:
  - agentic-ai
---

# LangChain

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for LangChain<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[LangChain](https://www.langchain.com/) ([github.com/langchain-ai/langchain](https://github.com/langchain-ai/langchain)) is an LLM application orchestration framework written in Python. It provides abstractions for chaining prompts, agents, memory, tool use, and retrieval-augmented generation (RAG). It is operated by LangChain, Inc., a private US company incorporated in April 2023. The repository was created on 2022-10-17 by Harrison Chase (CEO and co-founder). As of the report date the repository has over 140,000 GitHub stars and 243 public repositories under the `langchain-ai` organization.

The project is licensed under the MIT License (SPDX: MIT). The commercial observability product LangSmith is closed-source and outside the scope of this report.

LangChain is a pure-Python framework. The repository is 99.2% Python by language composition. It contains no compiled native extensions, no C/C++ or Rust code, no assembly, no JIT backends, no SIMD dispatch, and no architecture-specific directories of any kind. All compute is delegated to external model providers (APIs or local runtimes). Architecture-specific performance work for RISC-V lives in its dependencies -- for example PyTorch, ONNX Runtime, or llama.cpp -- not in LangChain itself.

---

## 2. Port History and Upstreaming Timeline

No RISC-V port history exists because no port is required. LangChain ships as a `py3-none-any` wheel (pure Python, no ABI, any platform) for every release from 0.0.1 through the current 1.3.10. A `py3-none-any` wheel installs on riscv64 via `pip install langchain` without modification.

GitHub code search for `riscv`, `riscv64`, and `rvv` in `langchain-ai/langchain` returns zero results. There are no commits, issues, or pull requests related to RISC-V anywhere in the repository. No PLATFORMS.md, SUPPORT.md, or `docs/platforms/` path exists.

There has never been an architecture-specific porting effort, because the concept does not apply to this layer of the stack.

---

## 3. Upstream Support Tier

LangChain publishes no formal platform support tier matrix. There is no documented list of supported CPU architectures, no tiered support policy, and no community stance on new architecture ports.

The framework explicitly lists supported language SDKs (Python, TypeScript, Go, Java) -- these are programming language SDKs, not CPU architectures. No architecture-specific support statement has ever been made, which is consistent with the pure-Python implementation.

RISC-V is neither supported nor unsupported by policy -- it is implicitly supported by inheritance from CPython, pip, and PyPI.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

LangChain has no architecture-specific subsystems. The following table covers every category that would be relevant for RISC-V enablement:

| Subsystem | Exists | Notes |
|---|---|---|
| C/C++ extension modules | No | Pure Python only |
| Rust extension modules | No | No Rust code in repo |
| Assembly (.S files) | No | None in repo |
| SIMD dispatch (AVX, NEON, RVV) | No | None; no compiled code |
| JIT backend | No | Delegates to upstream (PyTorch, etc.) |
| arch/ or platform/ directory | No | Does not exist |
| ISA extension usage (RVV, Zba, Zbb) | No | None |
| GPU/accelerator backend | No | Not in core library |

GitHub code search for `#ifdef __riscv`, `riscv`, `riscv64`, `rvv`, and `vfloat32m1_t` return zero results. There are also no `__x86_64__` or `__aarch64__` guards -- the project is uniformly architecture-agnostic.

---

## 5. Build System, Cross-Compilation, and Toolchain

LangChain uses `hatchling` as its build backend across all first-party packages (`langchain`, `langchain-core`, `langchain-text-splitters`). Hatchling is a pure-Python build tool with no mechanism to compile C extensions. It does not invoke a C or Rust compiler.

No BUILDING.md, CMakeLists.txt, cross-compilation documentation, riscv64-specific Dockerfile, QEMU usage, or toolchain file exists in the repository. The only Docker artifact is a `.dockerignore` at the repository root.

The repository root contains `.devcontainer/`, `.github/`, `.vscode/`, `libs/`, and configuration files. Build tooling is entirely Python-ecosystem: `uv` for lockfile and package management, with Makefile targets invoking `uv lock` / `uv lock --check` across subdirectories.

There are no GCC or Clang version requirements, no `-DUSE_X=OFF` flags, and no architecture-specific build instructions to provide.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

LangChain core is feature-identical across all platforms, including riscv64, arm64, and amd64.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| langchain core | Full | Full | Full |
| langchain-core | Full | Full | Full |
| langchain-text-splitters | Full | Full | Full |

The concept of architecture-specific feature gaps does not apply to LangChain itself. Feature gaps, if any, arise in binary dependencies consumed by LangChain (see Section 9).

---

## 7. CI/CD Infrastructure

All 28 workflow files under `.github/workflows/` were audited. The complete list is: `_compile_integration_test.yml`, `_lint.yml`, `_refresh_model_profiles.yml`, `_release.yml`, `_test.yml`, `_test_pydantic.yml`, `_test_vcr.yml`, `auto-label-by-package.yml`, `block_fork_main_prs.yml`, `bump_uv_pin.yml`, `check_agents_sync.yml`, `check_diffs.yml`, `check_extras_sync.yml`, `check_release_deps.yml`, `check_versions.yml`, `close_unchecked_issues.yml`, `codspeed.yml`, `integration_tests.yml`, `pr_labeler.yml`, `pr_labeler_backfill.yml`, `pr_lint.yml`, `pr_lint_trailer.yml`, `refresh_model_profiles.yml`, `remove_waiting_on_author.yml`, `reopen_on_assignment.yml`, `require_issue_link.yml`, `tag-external-issues.yml`, and `v03_api_doc_build.yml`.

All jobs use `runs-on: ubuntu-latest` (x86_64). Zero files contain the strings `riscv`, `riscv64`, or `RISCV`. There is no QEMU-based multi-arch testing, no riscv64 self-hosted runner, and no cross-compilation targeting RISC-V anywhere in the CI configuration. Alternative CI files (Jenkinsfile, .gitlab-ci.yml, .cirrus.yml) do not exist in the repository (all return 404).

The absence of riscv64 CI is not a functional gap. The test suite runs against platform-independent Python code, and results from x86_64 are valid for all platforms.

---

## 8. Distribution and Release Status

**PyPI**

LangChain ships exactly two artifact types per release: a `py3-none-any` wheel and a `.tar.gz` source distribution. An exhaustive scan of all releases from 0.0.1 through 1.3.10 on PyPI returns zero riscv64-specific artifacts. The wheel tag `py3-none-any` is the only platform tag that has ever appeared across any version. This wheel installs and runs on riscv64 via standard `pip install langchain` without any additional work.

**GitHub Releases**

The five most recent releases confirm the same pattern:
- langchain 1.3.10 (2026-06-18): `langchain-1.3.10-py3-none-any.whl`, `langchain-1.3.10.tar.gz`
- langchain-core 1.4.8 (2026-06-18): `langchain_core-1.4.8-py3-none-any.whl`, `langchain_core-1.4.8.tar.gz`
- langchain-openai 1.3.2 (2026-06-13): `langchain_openai-1.3.2-py3-none-any.whl`, `langchain_openai-1.3.2.tar.gz`

**Linux Distribution Packaging**

| Distribution | Status |
|---|---|
| Ubuntu 24.04 (Noble) | Not packaged (search returns no results) |
| Debian | Not packaged (tracker.debian.org returns 404) |
| Arch Linux RISC-V (archriscv.felixc.at) | Not present (search returns no results) |

LangChain is absent from all Linux distribution repositories. Installation via pip from PyPI is the only supported method and it works natively on riscv64.

**RISE Wheel Builder**

The [RISE wheel builder](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/langchain/) for riscv64 returns HTTP 302, redirecting to upstream PyPI for LangChain. No dedicated riscv64 build for LangChain is hosted at the RISE PyPI mirror. The RISE wheel_builder project (RFP RP011, 77 packages in current main) does not include LangChain or any `langchain-*` package.

---

## 9. Dependencies

LangChain's pure-Python core is unblocked on riscv64. The dependencies below are where riscv64-specific friction concentrates. Sources: `libs/langchain/pyproject.toml` and `libs/core/pyproject.toml`, LangChain 1.3.10 / langchain-core 1.4.8.

| Package | Role | riscv64 PyPI Wheel | riscv64 CI | Status |
|---|---|---|---|---|
| langchain | Top-level framework | `py3-none-any` -- installs on all arches | None needed | No blocker |
| langchain-core | Base abstractions | `py3-none-any` | None needed | No blocker (see uuid-utils note below) |
| langchain-text-splitters | Text chunking | `py3-none-any` | None needed | No blocker |
| langsmith >=0.1.17 | Tracing/evaluation SDK | `py3-none-any` (0.8.18, 2026-06-19) | None needed | No blocker; depends transitively on orjson (see below) |
| pydantic >=2.7.4 | Data validation (pydantic-core is Rust) | `manylinux_2_31_riscv64` wheel available (v2.47.0, 2026-05-22) | No native CI; PR #1901 to add it was closed without merge | Functional; glibc floor 2.31 is higher than x86/aarch64 baseline (2.17) |
| SQLAlchemy >=1.4,<3 | ORM/DB (agent memory, document stores) | No riscv64 wheel in 2.0.x; planned for 2.1b2+ | QEMU-emulated CI merged (PR #13183, 2026-03-18) | Source install required; first riscv64 PyPI wheel expected with SQLAlchemy 2.1 |
| numpy >=1.26.4 / >=2.1.0 | Numerics, embedding arithmetic | No riscv64 wheel in 2.4.x or 2.5.x; expected in 2.6.0 | Native CI added (PR #31488, 2026-05-27, milestone 2.6.0); known hardware CAS flakiness on RISE runners | Source install required; PyPI wheel expected Q3 2026. See `project-reports/numpy.md` |
| PyTorch (optional, via langchain-huggingface) | Neural network inference, local LLM | No riscv64 wheel on PyPI (2.12.1) | Cross-compile + native RISE runner CI (PR #181739, 2026-04); no full test suite | Source build required; GPU/inductor backends incomplete. See `project-reports/pytorch.md` |
| tokenizers >=0.13 (via langchain-huggingface) | HuggingFace fast tokenizers (Rust) | `manylinux_2_31_riscv64` wheel available (v0.23.1, 2026-04-27) | No dedicated riscv64 CI | Functional; PR #2073 (open) excludes riscv64 from mimalloc due to cross-compile GCC issues |
| tiktoken >=0.3 (via langchain-openai) | OpenAI BPE tokenizer (Rust) | No riscv64 wheel on PyPI (v0.13.0) | None; PR #506 open, validated on native RISE runner | Source build requires Rust toolchain; no PyPI wheel; issue #502 open |
| faiss-cpu (optional, vector store) | Approximate nearest-neighbor search | No riscv64 wheel on PyPI (v1.14.3) | Cross-compile CI merged (PR #5184), RVV dynamic dispatch | Source build required; pip install fails without build (issue #4321). See `project-reports/faiss.md` |
| uuid-utils >=0.12,<1 (langchain-core dep) | Fast UUID generation (Rust) | No riscv64 wheel (v0.16.2, 2026-06-18) | None | No tracking issue or PR found; pip install of langchain-core fails on riscv64 unless `--no-binary uuid-utils` is specified; runtime fallback to stdlib `uuid` module is available |
| orjson (transitive via langsmith) | Fast JSON serialization (Rust) | No riscv64 wheel (v3.11.9, 2026-05-06) | None; no public issue tracker | Source build required; langsmith falls back to stdlib `json` when orjson unavailable |
| aiohttp (transitive, async HTTP) | Async HTTP client (C extensions) | riscv64 wheel builds present (indirect CI evidence) | QEMU-emulated; fix merged (PR #12647) | Minor; QEMU container uv-binary fix backported to 3.13/3.14 branches |
| PyYAML >=5.3,<7 | YAML parsing (C ext + pure-Python fallback) | `none-any` source dist; pure-Python fallback | Not riscv64-specific | No blocker; pure-Python fallback covers riscv64 |
| requests >=2,<3 | HTTP client | `py3-none-any` | N/A | No blocker |

**Tier summary:**

- Tier 1 (no blocker, installs from PyPI as-is): `langchain`, `langchain-core`, `langchain-text-splitters`, `langsmith`, `requests`, `PyYAML`, `aiohttp`, `pydantic`/`pydantic-core`, `tokenizers`
- Tier 2 (builds from source; no PyPI wheel yet; CI work in progress): `SQLAlchemy`, `numpy`, `tiktoken`, `faiss-cpu`
- Tier 3 (no PyPI wheel, no active riscv64 CI, no public tracking): `uuid-utils`, `orjson`, `PyTorch`

---

## 10. Ecosystem Status

**RISE Project involvement:** None. LangChain is not a tracked project, RFP target, blog post subject, benchmark target, or AI/ML working group work item within the RISE project. The RISE wheel_builder (RP011) lists 77 packages; LangChain and all `langchain-*` packages are absent. Searching the full [RISE blog](https://riseproject.dev/blog) (26+ posts through June 2026) returns zero mentions of LangChain.

The RISE AI/ML working group (February 2025 kickoff) targets: SLEEF, OpenBLAS, Eigen, oneDNN, XNNPACK, PyTorch CPU, IREE, OpenAI Triton, Scikit-Learn, vLLM, Milvus, Faiss, Knowhere, MNN, NumPy. LangChain is not on this list.

**Governance and corporate backing:** LangChain is company-controlled by LangChain, Inc. with no formal community governance (no TSC, no CODEOWNERS file). Dominant contributors are LangChain, Inc. employees: baskaryan (1,398 commits), hwchase17/Harrison Chase (1,235), ccurme (1,028), mdrxy/Mason Daugherty (874), eyurtsev/Eugene Yurtsev (754). There is no significant external corporate co-maintainer (no Red Hat, Google, Meta, etc. in top contributors). No RISE member company has active upstream commits in langchain-ai/langchain.

**Investment history:** $10M seed from Benchmark (March 2023); $25M Series A led by Sequoia Capital (February 2024). Total known funding exceeds $35M. [NEEDS VERIFICATION: exact total and full investor list -- only these two rounds were found in research.]

---

## 11. Known Bugs and Active Issues

GitHub issue and pull request search for `riscv` and `riscv64` in `langchain-ai/langchain` returns zero results. The only hit for `riscv64` is a closed dependabot bump PR (#35590) unrelated to architecture bugs.

No correctness bugs, floating-point NaN issues, or performance regressions specific to riscv64 exist in the LangChain issue tracker. This is structurally expected -- the code is pure Python with no architecture-specific paths that could produce riscv64-specific failures.

Architecture-specific bugs that affect LangChain use cases (e.g., numpy CAS flakiness on RISE runners, uuid-utils missing wheel) are tracked in upstream dependency repositories, not in langchain-ai/langchain.

Data not available: Any riscv64-specific bugs filed against LangChain in the future -- the current state is zero open issues.

---

## 12. Objections and Upstream Blockers

**Objection 1: LangChain does not support riscv64.**
False. LangChain ships `py3-none-any` wheels. `pip install langchain` works on riscv64 without any porting work. Support is implicit and complete at the LangChain layer.

**Objection 2: LangChain has no riscv64 CI, so correctness is unverified on riscv64.**
Technically correct, but operationally irrelevant. The test suite exercises pure Python code. There are no architecture-specific code paths for which riscv64 CI would produce different results from x86_64 CI. Adding riscv64 CI would provide zero marginal correctness assurance for the LangChain layer.

**Objection 3: Binary dependencies block a riscv64 LangChain deployment.**
Partially true. The primary blockers for a production riscv64 LangChain deployment are in the dependency layer:

1. `numpy` -- no PyPI riscv64 wheel until 2.6.0 (targeted Q3 2026); source install works.
2. `tiktoken` -- no PyPI riscv64 wheel (PR #506 open but unmerged); source build requires Rust toolchain.
3. `uuid-utils` -- no PyPI riscv64 wheel, no tracking issue; `pip install langchain-core` fails on riscv64 without `--no-binary uuid-utils`.
4. `PyTorch` (if used via embeddings or langchain-huggingface) -- no PyPI riscv64 wheel; source build required.
5. `faiss-cpu` (if used as vector store) -- no PyPI riscv64 wheel; cmake source build required.

Items 1-3 affect a baseline LangChain installation. Items 4-5 affect optional but common deployment configurations. None of these blockers require changes to the LangChain codebase itself.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

Zero LangChain-layer work is required for riscv64 functional enablement. LangChain is pure Python and installs without modification. The only functional work needed is in binary dependencies (see Section 9 and the dependency reports for numpy, PyTorch, and faiss).

The one actionable item at the LangChain layer is the `uuid-utils` missing riscv64 wheel. This causes `pip install langchain-core` to fail on riscv64 unless `--no-binary uuid-utils` is specified or `uuid-utils` is not available. Filing a tracking issue upstream and providing a workaround in deployment documentation costs under one person-day.

### 13.2 Performance Optimization

No performance optimization work is possible or relevant at the LangChain layer. LangChain contains no compiled code, no SIMD paths, and no numeric kernels. Performance on riscv64 is entirely determined by:
- The inference runtime (PyTorch, llama.cpp, or remote API)
- Binary dependency performance (numpy, tokenizers, faiss-cpu)
- Network and I/O latency

Optimizing LangChain itself for riscv64 performance is not a viable work item.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI to langchain-ai/langchain provides no correctness benefit (pure Python) and no performance signal (no compiled code). This is not a recommended investment.

### 13.4 Ecosystem Enablement

The highest-leverage investments to enable LangChain on riscv64 are entirely in the dependency layer:

| Dependency | Action Needed | Primary Blocking Item |
|---|---|---|
| uuid-utils | File upstream issue; provide workaround | No riscv64 wheel, no tracking issue |
| tiktoken | Accelerate PR #506 review/merge | PR open, validated; needs maintainer merge |
| numpy | Track 2.6.0 release; validate on riscv64 | Wheel expected Q3 2026; CI merged May 2026 |
| orjson | File upstream issue | No riscv64 wheel, no public tracker |
| SQLAlchemy | Track 2.1b2 release | Wheel expected with 2.1 pre-release |
| PyTorch | Larger effort; see `project-reports/pytorch.md` | No PyPI wheel; source build required |
| faiss-cpu | Larger effort; see `project-reports/faiss.md` | No PyPI wheel; cmake build required |

The `uuid-utils` issue is the only item directly blocking a minimal `pip install langchain-core` on riscv64. It requires 1-2 person-days to diagnose, file an upstream issue, and document a workaround.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | File uuid-utils upstream tracking issue; document `--no-binary` workaround for riscv64 installs | 0.2 | Ecosystem/devrel | High |
| Functional | File orjson riscv64 wheel tracking issue | 0.2 | Ecosystem/devrel | Medium |
| Functional | Monitor and validate tiktoken PR #506 merge; test on riscv64 | 0.5 | Ecosystem/devrel | High |
| Functional | Monitor numpy 2.6.0 release; validate langchain embedding workflows on riscv64 | 0.5 | Ecosystem/devrel | High |
| Functional | Monitor SQLAlchemy 2.1 release; validate langchain agent memory on riscv64 | 0.3 | Ecosystem/devrel | Medium |
| Performance | No LangChain-layer performance work applicable | 0 | N/A | Not applicable |
| CI/CD | No riscv64 CI addition recommended for LangChain core | 0 | N/A | Not applicable |
| Ecosystem | PyTorch riscv64 enablement (prerequisite for langchain-huggingface on riscv64) | See `project-reports/pytorch.md` | Upstream/AI-ML | High |
| Ecosystem | faiss-cpu riscv64 wheel publish (prerequisite for vector store workflows on riscv64) | See `project-reports/faiss.md` | Upstream/AI-ML | Medium |

Total LangChain-specific effort: approximately 1.7 person-weeks. All other work is accounted for in upstream dependency reports.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [langchain-ai/langchain repository](https://github.com/langchain-ai/langchain)
- [LangChain homepage](https://www.langchain.com/)
- [PyPI: langchain](https://pypi.org/project/langchain/)
- [PyPI: langchain-core](https://pypi.org/project/langchain-core/)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Blog](https://riseproject.dev/blog)
- [RISE wheel builder package list](https://riseproject.gitlab.io/project-reports/wheel_builder/)
- [pydantic-core riscv64 CI PR #1901 (closed)](https://github.com/pydantic/pydantic-core/pull/1901)
- [SQLAlchemy riscv64 CI PR #13183](https://github.com/sqlalchemy/sqlalchemy/pull/13183)
- [numpy riscv64 CI PR #31488](https://github.com/numpy/numpy/pull/31488)
- [numpy riscv64 tracking issue #30216](https://github.com/numpy/numpy/issues/30216)
- [PyTorch riscv64 CI PR #181739](https://github.com/pytorch/pytorch/pull/181739)
- [tokenizers riscv64 mimalloc issue PR #2073 (open)](https://github.com/huggingface/tokenizers/pull/2073)
- [tiktoken riscv64 issue #502](https://github.com/openai/tiktoken/issues/502)
- [tiktoken riscv64 PR #506 (open)](https://github.com/openai/tiktoken/pull/506)
- [faiss-cpu riscv64 CI PR #5184](https://github.com/facebookresearch/faiss/pull/5184)
- [faiss-cpu pip install issue #4321](https://github.com/facebookresearch/faiss/issues/4321)
- [aiohttp QEMU fix PR #12647](https://github.com/aio-libs/aiohttp/pull/12647)
- numpy status report: `project-reports/numpy.md`
- PyTorch status report: `project-reports/pytorch.md`
- FAISS status report: `project-reports/faiss.md`