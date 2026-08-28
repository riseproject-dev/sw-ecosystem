---
title: LangGraph
parent: Project Reports
---

# LangGraph

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for LangGraph<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

LangGraph is a Python (and TypeScript) framework for building stateful, multi-actor agent workflows using a graph-based execution model. It sits on top of LangChain Core and provides cycle-aware directed graphs where nodes are Python callables and edges encode control flow. It does not contain LLM inference, compute kernels, or numeric routines - all heavy computation is delegated to downstream libraries (LLM APIs, vector stores, serialization libraries) and ultimately to cloud or hardware inference endpoints.

**Governance:** LangGraph is a fully corporate-controlled project. There is no foundation affiliation (not Linux Foundation, Apache, CNCF, or any equivalent). LangChain Inc. employs all core maintainers, including Harrison Chase (co-founder/CEO), William FH (@hinthornw), Vadym Barda (@vbarda), Eugene Yurtsev (@eyurtsev), Sydney Runkle (@sydney-runkle), Nuno Campos (@nfcampos), and David Duong (@dqbd). There is no MAINTAINERS, OWNERS, or CODEOWNERS file; maintainership is entirely internal to LangChain Inc.

**License:** MIT.

**Repository created:** 2023-08-09.

**Community stance on new ports:** Not applicable. Because LangGraph is a pure-Python package with no compiled components of its own, there is no port concept. The library installs on any Python-supported architecture via `pip install langgraph` without modification. No platform-acceptance policy exists and none is needed.

**RISE membership:** LangChain Inc. is not a RISE member. RISE Premier members are Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent. General members are Akeana, Andes Technology, ESWIN, BISCOE, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, SpacemiT, and ZTE. None are affiliated with LangChain.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2023-08-09 | Repository created | [langchain-ai/langgraph](https://github.com/langchain-ai/langgraph) |
| N/A | First RISC-V-related commit | None found |
| N/A | First RISC-V CI job | None found |
| N/A | First riscv64 binary or wheel | None found |

No RISC-V port work has ever been done in this repository. GitHub searches for `riscv repo:langchain-ai/langgraph` and `riscv64 repo:langchain-ai/langgraph` return only false positives: `uv.lock` lock files that contain riscv64 wheel filenames for transitive dependencies (`charset-normalizer`, `pydantic-core`, `ruff`, `ty`) as PyPI distribution metadata. These are not LangGraph code or LangGraph CI. The one PR with "riscv" in its title (PR [#7472](https://github.com/langchain-ai/langgraph/pull/7472)) is a Dependabot `uv` version bump where "riscv" appears only inside the embedded `uv` release notes listing `uv-riscv64gc-unknown-linux-gnu.tar.gz` as a download artifact.

No community contributor has filed a RISC-V tracking issue, sent a RISC-V patch, or raised a RISC-V question in any issue or PR.

---

## 3. Upstream Support Tier

LangGraph has no documented platform tier policy. There is no PLATFORMS.md, SUPPORT.md, or tiering matrix of any kind.

In practice, the project implicitly supports any platform where Python runs, because its release artifacts are `py3-none-any` wheels - universal pure-Python wheels with no architecture discriminator.

The exception is `langgraph-cli`, the command-line tool for building and deploying LangGraph Cloud containers. Its `deploy.py` and `docker.py` source files hard-code `linux/amd64` as the sole Docker target platform. This means the container deployment workflow for LangGraph Cloud is amd64-only. The library itself is not affected.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| langgraph (Python library) | Yes - pip universal wheel | Yes - pip universal wheel | Yes - pip universal wheel |
| langgraph-checkpoint | Yes - pip universal wheel | Yes - pip universal wheel | Yes - pip universal wheel |
| langgraph-sdk | Yes - pip universal wheel | Yes - pip universal wheel | Yes - pip universal wheel |
| langgraph-prebuilt | Yes - pip universal wheel | Yes - pip universal wheel | Yes - pip universal wheel |
| langgraph-cli container deploy | Yes - explicitly targeted | No - hard-coded linux/amd64 excludes arm64 | No - hard-coded linux/amd64 excludes riscv64 |
| Official CI (GitHub Actions) | Yes - ubuntu-latest (x86_64) | No | No |
| Release-blocking CI | Yes (x86_64) | No | No |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

LangGraph has no architecture-specific subsystems. The project contains:

- No C or C++ source files
- No assembly files
- No JIT compiler
- No SIMD dispatch layer
- No cryptographic primitives
- No garbage collector barriers
- No numeric kernels
- No `arch/riscv/` or equivalent directory

A full code search for `vfloat32m1_t`, `rvv`, `riscv`, `__riscv`, `_mm256`, `__ARM_NEON`, and related architecture intrinsic patterns returns zero genuine hits in LangGraph source code.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Graph execution engine | Pure Python | Pure Python | Pure Python |
| State management / checkpointing | Pure Python | Pure Python | Pure Python |
| Serialization (JSON/msgpack) | Delegated to orjson/ormsgpack | Delegated to orjson/ormsgpack | Delegated to orjson/ormsgpack |
| Data validation | Delegated to pydantic-core | Delegated to pydantic-core | Delegated to pydantic-core |
| TypeScript/JS SDK | Pure TypeScript | Pure TypeScript | Pure TypeScript |

All performance-sensitive operations in LangGraph are delegated to dependency libraries (see Section 9). LangGraph itself has no RISC-V gap in its own code because it has no architecture-specific code at all.

---

## 5. Build System, Cross-Compilation, and Toolchain

LangGraph has no native build system. There is no CMake, Meson, autoconf, Makefile, Cargo workspace, or any native compilation step in `langchain-ai/langgraph`.

Build and release use standard Python tooling:
- `uv` for dependency management and lock files
- `pyproject.toml` per sub-package
- `maturin` is used only by dependency libraries (pydantic-core, orjson, ormsgpack), not by LangGraph itself
- GitHub Actions `release.yml` publishes to PyPI via standard `uv publish`

For riscv64 specifically: `pip install langgraph` on a riscv64 Linux system downloads the `py3-none-any` universal wheel and installs it without compilation. No Rust toolchain, no C compiler, and no QEMU are required to install or run LangGraph itself.

Cross-compilation: not applicable to LangGraph. Dependencies with compiled extensions (pydantic-core, orjson, ormsgpack) require a Rust toolchain when building from source on riscv64, since no prebuilt riscv64 wheels exist for those packages (see Section 9).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---------|-------|-------|---------|-----|
| Graph execution | Full | Full | Full | None |
| State persistence (checkpoint-sqlite) | Full | Full | Full (sqlite-vec C ext builds from source [NEEDS VERIFICATION]) | None known |
| State persistence (checkpoint-postgres) | Full | Full | Full (psycopg from source; psycopg-binary not available) | Minor: no binary wheel for psycopg |
| JSON serialization (orjson) | Full (prebuilt wheel) | Full (prebuilt wheel) | Source build only, no prebuilt wheel | Build friction only |
| Msgpack serialization (ormsgpack) | Full (prebuilt wheel) | Full (prebuilt wheel) | Source build only, no prebuilt wheel | Build friction only |
| Pydantic validation (pydantic-core) | Full (prebuilt wheel) | Full (prebuilt wheel) | Source build only, no prebuilt wheel | Build friction only |
| LangGraph Cloud container deploy (CLI) | Full | Not supported | Not supported | Hard-coded linux/amd64 in CLI |
| Async event loop (uvloop, optional) | Prebuilt wheel available | Prebuilt wheel available | Source build only; PR [#733](https://github.com/MagicStack/uvloop/pull/733) closed without merge | Not a runtime dep; asyncio fallback works |

Functional gaps: none in the core library. The langgraph-cli container deployment tooling is blocked on amd64 only.

Performance gaps: Data not available - no published benchmarks comparing LangGraph performance on riscv64 vs arm64 or amd64 exist anywhere. Given that LangGraph performs no compute itself (all serialization is in delegated deps), any performance delta would be in orjson and pydantic-core serialization paths, which incur source-build overhead but no functional penalty.

Security hardening gaps: Data not available - no security hardening analysis for riscv64 (stack canaries, CFI, pointer authentication equivalents) was found in any upstream source.

NaN / floating-point issues: Data not available - not applicable. LangGraph performs no floating-point operations.

---

## 7. CI/CD Infrastructure

All 17 GitHub Actions workflow files in `.github/workflows/` were read directly from the repository. None contain any reference to `riscv`, `riscv64`, or `linux/riscv64`. The full list of workflow files checked:

`_integration_test.yml`, `_lint.yml`, `_sdk_integration_test.yml`, `_test.yml`, `_test_langgraph.yml`, `_test_release.yml`, `baseline.yml`, `bench.yml`, `ci.yml`, `deploy-redirects.yml`, `pr_lint.yml`, `release.yml`, `reopen_on_assignment.yml`, `require_issue_link.yml`, `tag-external-issues.yml`, `tag-external-prs.yml`, `uv_lock_ugprade.yml`

No QEMU setup action, no `runs-on: [self-hosted, riscv64]`, no matrix entry with `arch: riscv64`, and no RISE runner reference appear in any file.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Unit tests | Yes - ubuntu-latest | No | No |
| Integration tests | Yes - ubuntu-latest | No | No |
| Lint | Yes - ubuntu-latest | No | No |
| Release pipeline | Yes - ubuntu-latest | No | No |
| Hardware used | GitHub-hosted ubuntu-latest (x86_64) | N/A | N/A |
| RISE runners | No | No | No |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` are present in the repository.

---

## 8. Distribution and Release Status

**PyPI:** Latest version is 1.2.11. Every published file is either `langgraph-X.X.X-py3-none-any.whl` or `langgraph-X.X.X.tar.gz`. The `py3-none-any` tag is the universal pure-Python wheel tag; no platform-specific builds exist. This has been consistent across all releases from 0.0.8 through 1.2.11. Source: [PyPI JSON API for langgraph](https://pypi.org/pypi/langgraph/json).

**GitHub Releases:** Three most recent releases (1.2.11, checkpointpostgres==3.1.2, checkpoint==4.2.0) have zero attached binary assets. LangGraph publishes exclusively to PyPI.

**Ubuntu 24.04 Noble:** LangGraph is not packaged. Source: [Ubuntu package search](https://packages.ubuntu.com/search?keywords=LangGraph&suite=noble) returned no results.

**Debian:** LangGraph is not packaged. `https://tracker.debian.org/pkg/langgraph` returns HTTP 404.

**Arch Linux RISC-V (archriscv.felixc.at):** LangGraph is absent. Search returned no results.

**RISE wheel builder:** LangGraph is absent from the [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/). The index redirects to standard PyPI.

**What a user must do to get a working installation on riscv64:**

1. Ensure Python 3.9+ is available on the riscv64 system.
2. Run `pip install langgraph`. The universal wheel installs without compilation.
3. For dependencies with native extensions (pydantic-core, orjson, ormsgpack, xxhash), pip will attempt to build from source if no prebuilt riscv64 wheel is available. This requires a Rust toolchain (for pydantic-core, orjson, ormsgpack, uuid-utils) and a C compiler (for xxhash, sqlite-vec if used).
4. Build time for pydantic-core from source on a low-end RISC-V board is approximately 15 minutes [NEEDS VERIFICATION - this figure comes from a single source in the pydantic-core issue tracker].
5. `psycopg` (not `psycopg[binary]`) must be used for PostgreSQL checkpointing; the binary wheel is unavailable.

---

## 9. Dependencies

### Summary Table

| Dependency | Role | riscv64 build | riscv64 test | riscv64 prebuilt wheel | Status |
|---|---|---|---|---|---|
| langchain-core | Graph node protocol, message types | Pure Python | N/A | py3-none-any | No gap |
| langgraph-checkpoint | State persistence base | Pure Python | N/A | py3-none-any | No gap |
| langgraph-sdk | REST API client | Pure Python | N/A | py3-none-any | No gap |
| xxhash | Node state hashing | Yes - C ext builds | No dedicated CI | Yes - official manylinux riscv64 wheels since v4.0.0 | No gap |
| pydantic-core | Pydantic v2 validation (Rust/PyO3) | Yes - builds from source | No CI for riscv64 | No prebuilt wheel | Build friction; ~15 min source build [NEEDS VERIFICATION] |
| uuid-utils | UUID generation (Rust/PyO3) | Yes - builds from source | No CI | No prebuilt wheel | Build friction |
| orjson | Fast JSON serialization (Rust/PyO3) | Yes - builds from source | No CI for riscv64 | No prebuilt wheel | Build friction |
| ormsgpack | MessagePack serialization (Rust/PyO3) | Yes - builds from source | No CI for riscv64 | No prebuilt wheel | Build friction |
| sqlite-vec | Vector similarity (checkpoint-sqlite, optional) | Likely - C ext | No CI for riscv64 | No prebuilt wheel | Unverified on riscv64 [NEEDS VERIFICATION] |
| psycopg | PostgreSQL driver (checkpoint-postgres, optional) | Yes | CI added (PR [#1197](https://github.com/psycopg/psycopg/pull/1197) merged) | No binary wheel; `psycopg` (not `psycopg[binary]`) works | Minor gap: binary extra unavailable; tests failing tracked in issue [#883](https://github.com/psycopg/psycopg/issues/883) |
| uvloop | High-performance async loop (optional dev/test dep only) | Yes - builds from source | No CI | No prebuilt wheel; PR [#733](https://github.com/MagicStack/uvloop/pull/733) closed without merge | Not a runtime dep; asyncio fallback works |

### Notable dependency details

**pydantic-core:** Issue [#1906](https://github.com/pydantic/pydantic-core/issues/1906) was closed 2026-03-11 with a reference to pydantic PR [#12723](https://github.com/pydantic/pydantic/pull/12723) (merged 2026-02-25, titled "Add riscv64 build target for manylinux"). Despite this PR, riscv64 is not yet present in the pydantic-core CI matrix (which covers x86_64, aarch64, armv7, i686, ppc64le, s390x). No riscv64 wheel is published to PyPI. Source builds work but require the Rust toolchain and significant build time.

**orjson:** Issues are disabled on the orjson repository. The CI matrix covers x86_64, aarch64, armv7, i686, ppc64le, and s390x. riscv64 is absent. No tracking issue exists. Source build via Rust/maturin functions but no prebuilt wheel is published.

**xxhash:** Full riscv64 support as of v4.0.0. Official manylinux and musllinux riscv64 wheels are published covering Python 3.9-3.15. This dependency is fully unblocked.

**psycopg:** PR [#1197](https://github.com/psycopg/psycopg/pull/1197) merged, adding riscv64 CI. Issue [#883](https://github.com/psycopg/psycopg/issues/883) tracks failing tests on riscv64. The `psycopg[binary]` extra (pre-compiled C driver) has no riscv64 wheel. The `psycopg` package (pure Python with C driver compiled at install time) works on riscv64 and is the correct choice for production use.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| - | - | - | - | - |

No riscv64-related bugs, correctness issues, or performance reports exist in `langchain-ai/langgraph`. GitHub issue searches for all RISC-V query variants returned zero results. LangGraph has no architecture-specific code paths that could exhibit riscv64-specific behavior.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None found. No maintainer or contributor has made a statement about RISC-V in any issue, PR, or discussion in the repository.

**Technical blockers for the library:** None. LangGraph itself is unblocked on riscv64.

**Technical blockers for the dependency stack:**
- pydantic-core: no prebuilt riscv64 wheel; source build required; issue closed but wheel publishing not yet implemented
- orjson: no prebuilt riscv64 wheel; no tracking issue; issues disabled on the repo
- ormsgpack: no prebuilt riscv64 wheel; no tracking issue
- psycopg: tests failing on riscv64 (issue [#883](https://github.com/psycopg/psycopg/issues/883)); binary extra unavailable

**Organizational blockers:** None identified. LangChain Inc. is a venture-backed startup with no formal platform support policy. Upstream maintainers of dependencies (pydantic, orjson, psycopg) operate independently.

**Acceptance probability for RISC-V patches:** High for pure build/CI additions to dependency libraries (pydantic-core, orjson), given that these libraries already support ppc64le and s390x as precedent platforms. No political opposition to riscv64 has been stated. The main blocker is engineering capacity in those upstream projects, not policy.

---

## 13. Investment Analysis

RISE has done no reported work on LangGraph or its direct dependency chain (as of the RISE blog scan through 2026-07). RISE AI/ML Working Group activity is focused on compiler and inference runtime work (IREE, XNNPACK, MLIR), not Python orchestration frameworks.

### 13.1 Functional Enablement

LangGraph itself requires zero functional enablement work for riscv64. The library is pure Python and installs via pip today. The functional gaps are entirely in third-party dependency libraries (pydantic-core, orjson, ormsgpack, psycopg).

### 13.2 Performance Optimization

Data not available - no benchmark data exists for LangGraph on any architecture. LangGraph performs no compute itself; its per-invocation overhead is Python graph traversal and serialization calls to orjson/ormsgpack/pydantic-core. Performance optimization of LangGraph on riscv64 is not meaningful without first establishing baseline measurements.

### 13.3 CI/CD Infrastructure

LangGraph has no riscv64 CI. Adding riscv64 CI to LangGraph itself would be low-cost but low-value: since LangGraph is pure Python, a CI job would trivially pass and provide no signal about architecture-specific correctness. The meaningful CI investment is in the dependency libraries (pydantic-core, orjson, ormsgpack), where compiled extensions exist and architecture-specific failures are plausible.

### 13.4 Ecosystem Enablement

The primary ecosystem enablement gap is the absence of prebuilt riscv64 wheels for pydantic-core, orjson, and ormsgpack. This forces Rust toolchain presence and long source builds on any riscv64 deployment system, which is a significant friction point for production deployments.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 to pydantic-core CI and wheel build matrix | 2 | pydantic-core upstream / RISE | High |
| Functional | Add riscv64 to orjson CI and wheel build matrix | 2 | orjson upstream / RISE | High |
| Functional | Add riscv64 to ormsgpack CI and wheel build matrix | 1 | ormsgpack upstream / RISE | Medium |
| Functional | Resolve psycopg riscv64 test failures (issue [#883](https://github.com/psycopg/psycopg/issues/883)) | 2 | psycopg upstream | Medium |
| Functional | Add riscv64 to uvloop wheel build matrix (issue [#732](https://github.com/MagicStack/uvloop/issues/732)) | 1 | uvloop upstream | Low (not a runtime dep) |
| CI/CD | Add riscv64 to langgraph-cli Docker targets (deploy.py, docker.py) | 1 | LangChain Inc. | Low (cloud product, not core library) |
| CI/CD | Add riscv64 smoke-test job to langgraph GitHub Actions | 0.5 | LangChain Inc. | Low (pure Python; low signal value) |
| Performance | Establish riscv64 baseline benchmarks for LangGraph serialization paths | 1 | RISE / Qualcomm | Low (no compute in library itself) |

**Total estimated effort:** approximately 10.5 person-weeks, almost entirely in upstream dependency libraries, not in LangGraph itself.

**Priority assessment:** For a chip company evaluating RISC-V investment in the AI agent framework space, LangGraph itself presents no investment barrier - it works on riscv64 today. The real investment target is the compiled extension layer (pydantic-core, orjson), which blocks frictionless deployment of the broader Python AI stack on riscv64. Those efforts have value independent of LangGraph and should be tracked at the pydantic and orjson project level, not the LangGraph level.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [langchain-ai/langgraph GitHub repository](https://github.com/langchain-ai/langgraph)
- [LangGraph PyPI page](https://pypi.org/project/langgraph/)
- [PyPI JSON API for langgraph 1.2.11](https://pypi.org/pypi/langgraph/json)
- [LangGraph GitHub Releases](https://github.com/langchain-ai/langgraph/releases)
- [Dependabot uv bump PR #7472 (false positive riscv hit)](https://github.com/langchain-ai/langgraph/pull/7472)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [pydantic-core riscv64 issue #1906](https://github.com/pydantic/pydantic-core/issues/1906)
- [pydantic PR #12723 - Add riscv64 build target for manylinux](https://github.com/pydantic/pydantic/pull/12723)
- [psycopg riscv64 CI PR #1197](https://github.com/psycopg/psycopg/pull/1197)
- [psycopg riscv64 test failures issue #883](https://github.com/psycopg/psycopg/issues/883)
- [uvloop riscv64 wheel build issue #732](https://github.com/MagicStack/uvloop/issues/732)
- [uvloop riscv64 wheel build PR #733 (closed without merge)](https://github.com/MagicStack/uvloop/pull/733)
- [Ubuntu package search for LangGraph](https://packages.ubuntu.com/search?keywords=LangGraph&suite=noble)
- [Debian package tracker for langgraph](https://tracker.debian.org/pkg/langgraph)
- [Arch Linux RISC-V package search for langgraph](https://archriscv.felixc.at/?q=langgraph)
- [RISE blog post: SALTyRN RVV kernel translation (2026-07-27)](https://riseproject.dev/2026/07/27/saltyrn-turning-neon-kernels-into-fast-verified-rvv-code-with-llms/)
- [RISE blog post: IREE RISC-V object detection (2026-07-07)](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)