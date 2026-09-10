---
title: HuggingFace Hub
parent: Project Reports
color: green
dependencies:
  - name: hf-xet
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="huggingface-hub" %}

# HuggingFace Hub

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for HuggingFace Hub<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

HuggingFace Hub (`huggingface_hub`, PyPI package `huggingface-hub`) is the official Python client library for the Hugging Face Hub API: repository and file operations, model/dataset/space download and upload, authentication, local caching, the Inference Client, and the `huggingface-cli`. It is a pure-Python package with no compiled/native extensions of its own.

**Governance and corporate sponsorship.** This is a company-owned, company-led project, not an independent-foundation project. Copyright headers read "Copyright 2020 The HuggingFace Team," `setup.py` lists `author="Hugging Face, Inc."`, and `CODE_OF_CONDUCT.md` enforcement routes to `feedback@huggingface.co`. `CONTRIBUTING.md` states the governance stance explicitly: maintainers "prefer to implement most code changes ourselves... this is not about gatekeeping... it is how we work most efficiently," steering external contributors toward filing issues first, with PRs welcomed mainly for docs/typos/pre-scoped changes. No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, or `PLATFORMS.md` file exists in the repository.

**Corporate maintainers** (all Hugging Face, Inc. employees, by commit volume over the ~2000 most recent commits, back to August 2022): Lucain Pouget (`lucain@huggingface.co`, 950+ commits, clear lead maintainer), Celina Hanouti (`hanouticelina@gmail.com`, ~280 commits), Julien Chaumond (`julien@huggingface.co`, HF co-founder/CTO, listed package author, 30 commits in this window), plus Daniel van Strien, Quentin Lhoest, Mario Sasko, and Albert Villanova. No significant non-HF corporate sponsor or maintainer presence appears in the commit history.

**Community culture on new ports.** No formal platform-tier policy document exists. Given the issue-first, maintainer-implements-changes-themselves model and the total absence of any RISC-V-related issue, PR, or commit in the repository's history, there is no evidence of community-driven porting activity or demand for this project - consistent with the fact that, being pure Python, there is nothing to port.

**License:** Apache License 2.0 (confirmed from the `LICENSE` file header).

## 2. Port History and Upstreaming Timeline

No RISC-V port history exists because none was needed.

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64-related issue, PR, or commit has ever been opened or merged in this repository | GitHub issue/PR/commit search for "riscv", "riscv64", "risc-v", "risc", all returning 0 results; full-repo case-insensitive grep for "riscv" across a fresh clone (HEAD `6c8c56bd51814777d06886a35f6a26d290eb3062`) also returned 0 matches |

**Key contributors:** None - there is no RISC-V-specific work to attribute.

**Is it fully upstream?** Yes, trivially: the package is architecture-independent by construction (pure Python, `py3-none-any` wheel), so it already runs on riscv64 using the exact same upstream-published artifact used on every other architecture. There is no separate "riscv64 support" to be upstream or out-of-tree - the mainline release IS the riscv64-compatible release.

## 3. Upstream Support Tier

No formal tier policy document exists (no `PLATFORMS.md`, `SUPPORT.md`, or equivalent). In practice, tier status is set entirely by the packaging format: the project ships one universal `py3-none-any` wheel plus an sdist, with no per-architecture build matrix of any kind, for any architecture. There is nothing to "test" or "release" per-architecture, because the artifact is not architecture-specific.

**Comparison table:**

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI: build | Yes (`ubuntu-latest`, `windows-latest` runners) | Not run in CI, but installs identically | Not run in CI, but installs identically |
| CI: test suite executed | Yes | No (not in CI matrix) | No (not in CI matrix) |
| Official PyPI wheel | `py3-none-any` (universal) | Same `py3-none-any` wheel | Same `py3-none-any` wheel |
| Functional at install/runtime | Full | Full | Full |

The lack of an arm64 or riscv64 line in the CI matrix is immaterial to functionality: the same `py3-none-any` artifact is what every platform, including riscv64, actually installs and runs.

## 4. Technical Architecture and RISC-V-Specific Subsystems

huggingface_hub itself contains no architecture-specific subsystems. Confirmed via `mcp__github__search_code` for `__riscv` (0 results) and a `find` over a fresh clone for `*.c`, `*.pyx`, `*.so`, `*.rs`, `Cargo.toml` (0 results). There is no JIT, no SIMD, no hand-written assembly, no GC barriers, and no `#ifdef`-gated code paths anywhere in the project - it is 100% pure Python (`src/huggingface_hub/*.py`), executed identically on every CPU architecture.

The one architecture-relevant element in the entire dependency surface is the **optional** `hf_xet` accelerator (a separate PyPI package, Rust-compiled via PyO3, from `huggingface/xet-core`), used to speed up Xet-backed chunked upload/download. `setup.py` gates it with an explicit platform marker:

```
f"{HF_XET_VERSION}; platform_machine=='x86_64' or platform_machine=='amd64' or platform_machine=='AMD64' or platform_machine=='arm64' or platform_machine=='aarch64'"
```

riscv64 is not in this list, so `pip install huggingface_hub` on riscv64 never attempts to pull in `hf_xet` - by design, not by failure. Detection is purely `importlib`-based feature-detection (`utils/_runtime.py::is_xet_available()` returns `is_package_available("hf_xet")`), not architecture-detection. Every call site (`file_download.py:1860/1974`, `hf_api.py:6069`, `_commit_api.py:395`, `_upload_large_folder.py:224`) branches cleanly on that boolean to a fully-implemented, non-degraded plain-HTTP transfer path, with a user-facing warning ("Xet Storage is enabled for this repo, but the 'hf_xet' package is not installed... Falling back to regular HTTP download."). This same fallback logic applies on any platform lacking an `hf_xet` wheel and long predates RISC-V specifically - it is not a riscv64 special case.

**Comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core library (API client, download/upload, cache, CLI) | Full (pure Python, identical code) | Full (pure Python, identical code) | Full (pure Python, identical code) |
| `hf_xet` accelerated transfer (external Rust dependency) | Full (native wheel) | Full (native wheel) | Absent (excluded by platform marker, no upstream wheel) |
| Fallback HTTP transfer path (used when `hf_xet` absent) | Available, unused by default | Available, unused by default | Full - this is the actual code path riscv64 runs; fully implemented, not degraded |

## 5. Build System, Cross-Compilation, and Toolchain

Not applicable. huggingface_hub has no C/C++ build system, no CMake, no Dockerfiles, and no cross-compilation or toolchain requirements of any kind. Confirmed: `find -iname CMakeLists.txt` returns empty (no `cmake/` directory exists at all); no `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` files exist; `find -iname "Dockerfile*"` returns nothing, and `mcp__github__search_code` for `riscv64 repo:huggingface/huggingface_hub filename:Dockerfile` returns 0 results. The package is built with `setuptools` (`setup.py` + `find_namespace_packages`), producing a single universal wheel. There is no QEMU usage anywhere in the project (confirmed via grep of `.github/workflows/` for "qemu", 0 matches), and no known build failures exist because there is nothing architecture-specific to fail to build.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Repo/file download and upload | Full | Full | Full |
| Authentication, caching, CLI | Full | Full | Full |
| Inference Client | Full | Full | Full |
| Xet-accelerated chunked transfer (`hf_xet`) | Full | Full | Not available (no upstream wheel; excluded by dependency marker) |
| Plain HTTP transfer (used automatically when Xet unavailable) | Full | Full | Full |

**Functional gaps:** None for any core functionality. The only "cannot do X" case is Xet-accelerated transfer, which is a performance optimization layered on top of a fully functional plain-HTTP path, not a missing capability - all uploads and downloads succeed on riscv64, just via HTTP rather than the deduplicating Xet protocol.

**Performance gaps:** Absence of `hf_xet` means riscv64 users do not benefit from Xet's content-defined-chunking deduplication and accelerated transfer for repos that use Xet storage. Data not available: no published riscv64-vs-arm64/amd64 quantitative performance benchmark for HuggingFace Hub was located via GitHub issue search or general web search. This is a real but unquantified performance delta, not a correctness or functional gap.

**Security hardening gaps:** None found or applicable - no architecture-specific hardening code exists in this pure-Python project.

**NaN / floating-point semantics issues:** None found or applicable - huggingface_hub performs no numerical computation itself; it is an API/transport client.

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** Verified directly: a fresh clone of `huggingface/huggingface_hub` (HEAD `6c8c56bd51814777d06886a35f6a26d290eb3062`, origin confirmed) was searched with a case-insensitive recursive grep for `riscv`, `risc-v`, `risc_v` across the entire working tree - zero matches anywhere.

**All 15 workflow files** (`build_documentation.yaml`, `build_pr_documentation.yaml`, `build_repocard_examples.yaml`, `check-installers.yml`, `close-unscoped-community-prs.yml`, `model_card_consistency_reminder.yml`, `python-quality.yml`, `python-tests.yml`, `release.yml`, `style-bot-action.yml`, `style-bot.yml`, `trufflehog.yml`, `update-hardware-flavors.yaml`, `update-inference-types.yaml`, `upload_pr_documentation.yaml`) were read individually. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in this repo.

**Complete runner inventory** (every distinct `runs-on` value found across all workflows): `ubuntu-latest`, `windows-latest`, and one self-hosted AWS runner group (`group: aws-general-8-plus`, in `python-tests.yml`'s `build-ubuntu` job - x86_64, not riscv64). No self-hosted riscv64 runner label exists, and no architecture axis appears in any `strategy.matrix` (the only matrix axes found are `python-version` 3.10-3.14, `test_name`, and `target-repo` in the downstream-test job of `release.yml`).

**QEMU / cross-compilation:** None. A grep of `.github/workflows/` for "qemu", "self-hosted", "cross-compile", "riscv" returned zero matches.

**RISE runners:** Not used - there is no CI job of any kind targeting riscv64 for this project to run on RISE or any other riscv64 hardware.

**Comparison table:**

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runs test suite | Yes (`ubuntu-latest`, `windows-latest`, self-hosted AWS) | No | No |
| CI builds any artifact | Yes | No | No |
| Architecture matrix entry | N/A (implicit, no matrix) | None | None |
| QEMU/cross-compile step | None | None | None |

## 8. Distribution and Release Status

**PyPI (authoritative, upstream-controlled):** [pypi.org/pypi/huggingface-hub/json](https://pypi.org/pypi/huggingface-hub/json), latest version 1.30.0, spans versions 0.0.1 through 1.30.0+. Every release ships exactly two file types: `huggingface_hub-<version>-py3-none-any.whl` and `huggingface_hub-<version>.tar.gz`. No manylinux/musllinux tags of any kind exist for any architecture - not because riscv64 is missing a build, but because no architecture-specific wheel has ever been built for this package on any platform. The universal `py3-none-any` wheel installs identically on amd64, arm64, riscv64, or any other architecture with a Python 3 interpreter. Cross-checked at [pypi.org/simple/huggingface-hub/](https://pypi.org/simple/huggingface-hub/) with the same result.

**RISE Python wheel builder:** [gitlab.com/api/v4/.../packages/pypi/simple/huggingface-hub/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/huggingface-hub/) 302-redirects to plain PyPI - RISE has no custom riscv64 wheel package for `huggingface-hub`, confirming none is needed. The package also does not appear among the 81 packages listed on the [RISE wheel_builder page](https://riseproject.gitlab.io/python/wheel_builder/); by contrast, several Hugging-Face-owned satellite Rust packages (`hf-transfer`, `hf-xet`, `safetensors`, `tokenizers`, `sentencepiece`) are listed and built there, since those are the components that actually require per-architecture native wheels.

**Ubuntu 26.04 Resolute:** [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=HuggingFace%20Hub&suite=resolute&searchon=names&section=all) lists `python3-huggingface-hub` version 1.2.2-2, `Architecture: all`, section universe. However, an adversarial project-graph query for riscv64-tagged `deb:BinaryPackage` entries for this package in the `resolute` suite returned **empty**, and a follow-up unfiltered query found the package indexed in the graph only for `arm64` and `amd64` - not riscv64. This is a discrepancy worth flagging: the source-level `Architecture: all` designation shows the package is architecture-independent by declaration, but the graph (an index of what has actually been built/published per-architecture) has not (in this data snapshot) indexed a riscv64 row for it in Resolute. This is most plausibly a packaging-index/indexing-lag artifact for one secondary/ports architecture in one distro snapshot, not evidence the package fails to install via `apt` on riscv64 Ubuntu systems - but it was not resolved definitively within this research, and it does not affect the PyPI-based install path, which is authoritative and confirmed universal.

**Gentoo:** Listed at [packages.gentoo.org/packages/sci-ml/huggingface_hub](https://packages.gentoo.org/packages/sci-ml/huggingface_hub) (architecture-independent, consistent with pure-Python packaging).

**GitHub Releases:** Not directly queryable in this research session (GitHub MCP access was scoped to `riseproject-dev/sw-ecosystem` only; `huggingface/huggingface_hub` release-asset enumeration returned "Access denied"). This gap is immaterial given the confirmed PyPI universal-wheel distribution model, which is the primary install path for this package.

**What a user must do to get a working binary on riscv64:** Run `pip install huggingface_hub` (or `pip install huggingface-hub[hf_xet]` for the extras, which will simply not resolve `hf_xet` on riscv64 and install without it). No special flags, source builds, or riscv64-specific steps are required - identical to the install procedure on any other architecture.

## 9. Dependencies

huggingface_hub's `setup.py` `install_requires`: `click`, `filelock`, `fsspec`, `hf-xet` (platform-gated, riscv64 excluded), `httpx`, `packaging`, `pyyaml`, `tqdm`, `typing-extensions`. `safetensors[torch]`/`torch` are extras, not core. Of these, only `hf-xet` involves compiled/native code; all others are pure-Python.

**Summary table:**

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| **hf-xet** ([huggingface/xet-core](https://github.com/huggingface/xet-core)) | Xet fast-transfer/dedup backend; native Rust+PyO3 extension | Not in Debian/Ubuntu riscv64 archive (PyPI-only distribution); community source build reported in ~30 min via maturin cross-compile [NEEDS VERIFICATION] | Community-built wheel reportedly smoke-tested on real riscv64 hardware (BananaPi F3/SpacemiT K1) [NEEDS VERIFICATION] | **No official PyPI riscv64 wheel.** `install_requires` marker excludes riscv64; `pip install huggingface_hub` silently skips it | [xet-core#700](https://github.com/huggingface/xet-core/issues/700) "Add riscv64 wheel to PyPI releases" - closed **not_planned**. Not in the release CI matrix |
| **blake3** ([BLAKE3-team/BLAKE3](https://github.com/BLAKE3-team/BLAKE3)) | Content hashing for Xet chunk dedup (used inside xet-core, not a direct huggingface_hub dependency) | Present in Ubuntu 26.04 riscv64 (`librust-blake3-dev`, `libblake3-dev`/`libblake3-0`, `python3-blake3`) | Portable (non-SIMD) Rust fallback compiles and runs correctly on riscv64 hardware per prior benchmarks [NEEDS VERIFICATION] | Ships via portable scalar fallback | [BLAKE3#484](https://github.com/BLAKE3-team/BLAKE3/issues/484) "Improved RISC-V support + SIMD" - open, performance-only gap (no RVV-vectorized path yet) |
| **tokio** ([tokio-rs/tokio](https://github.com/tokio-rs/tokio)) | Async runtime inside xet-core | Present in Ubuntu 26.04 riscv64 (`librust-tokio-dev`) | Correctness bug history exists but is resolved | n/a | [tokio#6355](https://github.com/tokio-rs/tokio/issues/6355) "Segmentation fault in `park_timeout()` on riscv64" - closed/fixed 2024-03-16 |
| **libgit2 / git2** | Git protocol support in xet-core | Present in Ubuntu 26.04 riscv64 (`libgit2-dev`, `libgit2-1.9`) | No riscv64-specific correctness issues found | n/a | None found |
| **click, filelock, fsspec, httpx, packaging, tqdm, typing-extensions** (pure-Python core deps of huggingface_hub itself) | Core runtime dependencies | Pure-Python, architecture-independent | Full | Full via PyPI universal wheels | No riscv64-specific issues; not architecture-dependent |

**Deep-dive:** `hf-xet` is the only dependency of interest (native, crypto-adjacent via its `blake3` hashing). It is explicitly excluded from riscv64 by upstream's own `setup.py` platform marker, and its own repository's maintainers closed a request to add a riscv64 wheel as "not planned" ([xet-core#700](https://github.com/huggingface/xet-core/issues/700)), despite a reported community source build. This is the one concrete, named upstream blocker relevant to this project - but it sits one repository removed from `huggingface_hub` itself, and huggingface_hub's own handling of its absence (automatic, silent, fully-functional HTTP fallback) is mature and complete, not a stub.

Section 10 (Ecosystem Status) is omitted: huggingface_hub is a standalone client library with a small, fixed set of core dependencies, not a project with a broad ecosystem of dependent packages/plugins/extensions that must themselves be separately enabled on riscv64.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue or PR exists in `huggingface/huggingface_hub` | N/A | N/A | Confirmed via GitHub issue and PR search scoped to this repo for "riscv" - both returned 0 results; corroborated by exhaustive prior searches for "riscv64", "risc-v", "risc" (also 0) |
| [xet-core#700](https://github.com/huggingface/xet-core/issues/700) | "Add riscv64 wheel to PyPI releases" | Closed, not_planned | Medium (performance-only; core huggingface_hub functionality unaffected) | In the dependency repo `huggingface/xet-core`, not in `huggingface_hub` itself |
| [BLAKE3#484](https://github.com/BLAKE3-team/BLAKE3/issues/484) | "Improved RISC-V support + SIMD" | Open | Low (performance-only, two repositories removed from huggingface_hub) | No RVV-vectorized path for BLAKE3 hashing yet |
| [tokio#6355](https://github.com/tokio-rs/tokio/issues/6355) | "Segmentation fault in `park_timeout()` on riscv64" | Closed/fixed (2024-03-16) | Was High (correctness bug, miscompilation-class) | Already resolved; no current impact |

**Correctness bugs:** None open and relevant to huggingface_hub or its dependency chain as verified in this research. The one historical correctness bug found (tokio#6355) is closed and fixed.

Data not available: no published riscv64-vs-arm64/amd64 performance benchmark for HuggingFace Hub was located via GitHub issue search, general web search, or an attempt to fetch the RISE blog post listing (which returned only template markup, no renderable post content).

## 12. Objections and Upstream Blockers

**Stated objections:** None found for `huggingface_hub` itself - there is no riscv64 issue or PR to have drawn an objection, because none has ever been filed. The one concrete stated objection in the entire dependency chain is in a *different* repository: xet-core maintainers closed [issue #700](https://github.com/huggingface/xet-core/issues/700) (request for a riscv64 wheel) as "not_planned," despite a reported working community source build [NEEDS VERIFICATION].

**Technical blockers:** None for huggingface_hub's core functionality - it is pure Python and installs/runs identically on riscv64 today via the standard PyPI universal wheel. The only technical blocker in scope is upstream's release-engineering decision (not a technical limitation) to not build/publish an `hf-xet` wheel for riscv64, despite the toolchain being demonstrably available (Ubuntu 26.04 riscv64 ships `rustc`, `cargo`, and the matching `librust-*-dev` packages needed to build `hf-xet` from source).

**Organizational blockers:** huggingface_hub's own contribution model ("we prefer to implement most code changes ourselves," issue-first) means any future riscv64-adjacent work (e.g., pushing xet-core toward a riscv64 wheel) would need to be either driven by Hugging Face itself or filed as an issue and prioritized by them - there is no evidence of community pressure or an open request for this today.

**Acceptance probability:** Not applicable to huggingface_hub itself, since no port or change is needed - it already works. For the adjacent `hf-xet` riscv64-wheel request, acceptance probability is currently low given the explicit "not_planned" closure, absent renewed upstream interest or a demonstrated user base.

## 13. Readiness Assessment

- **Color:** green (Step 0 architecture-independent shortcut)
- **Release provider:** upstream
- **Justification:** huggingface_hub ships exclusively as a `py3-none-any` wheel and `.tar.gz` sdist on PyPI, with no manylinux/musllinux tags for any architecture ([pypi.org/pypi/huggingface-hub/json](https://pypi.org/pypi/huggingface-hub/json)). It contains zero compiled or native code of any kind (confirmed via full-repo search for architecture-specific file types and `#ifdef` guards). Per the color model's Step 0, this makes the project architecture-independent by construction: it runs on riscv64 using the exact same artifact upstream publishes for every other platform, with no penalty for the absence of riscv64-specific CI or a dedicated riscv64 release artifact, since none is needed.
- **Pending work that could change the grade:** None would raise the grade further (already green, the ceiling). The only factor that could degrade the practical experience without changing this project's own color is if the `hf-xet` accelerator dependency remains permanently excluded from riscv64 (per [xet-core#700](https://github.com/huggingface/xet-core/issues/700), closed not_planned) - this affects transfer performance for Xet-backed repos, not huggingface_hub's own functionality or color. RISE tracks huggingface_hub internally in `riseproject-dev/sw-ecosystem`'s `projects.yml` and grades it green/critical/upstream in `stack-reports/agentic-ai-cpu/agentic-ai-cpu.md` (dated 2026-09-04), consistent with this report's conclusion. RISE's `python-wheels` repository actively builds huggingface_hub's Rust-based satellite packages (`hf-xet`, `hf-transfer`, `tokenizers`, `safetensors`) for riscv64, though not `huggingface_hub` itself, since it needs no custom wheel.

## 14. Investment Analysis

**What RISE has already done or funded:** RISE tracks and grades huggingface_hub internally (`sw-ecosystem/projects.yml`, `stack-reports/agentic-ai-cpu/agentic-ai-cpu.md`, green/critical/upstream). RISE's `python-wheels` repository builds riscv64 wheels for four of huggingface_hub's Rust-based satellite/companion packages: `hf-xet`, `hf-transfer`, `tokenizers`, `safetensors` - meaning the ecosystem-level enablement work adjacent to this project is already substantially funded and in progress, independent of huggingface_hub itself (which needs none of that work). No RP-numbered funded project or Gemini-credit grant specifically targets huggingface_hub. Given this, the sizing below reflects the residual gap only: the `hf-xet` wheel decision.

### 14.1 Functional Enablement

No work needed. The project is fully functional on riscv64 today via the standard `pip install huggingface_hub` path with zero special handling.

### 14.2 Performance Optimization

The only performance-relevant gap is the absence of an `hf-xet` riscv64 wheel, which is entirely out of scope for huggingface_hub's own codebase - it lives in `huggingface/xet-core`, whose maintainers have closed a request for this as "not_planned." Any investment here would target xet-core, not huggingface_hub, and would consist of: (a) renewing the upstream ask with a working reference build attached, or (b) RISE hosting a community-built `hf-xet` riscv64 wheel via its own wheel builder (technically straightforward per the reported ~30-minute community build, but organizationally a RISE-hosted-not-upstream release, which would need documenting per the release-provider rule).

### 14.3 CI/CD Infrastructure

No investment needed for huggingface_hub itself - there is no meaningful CI gap to close for a pure-Python, universally-wheeled package. If desired for defense-in-depth (verifying the package installs and imports correctly on riscv64 as new Python versions are targeted), a minimal riscv64 smoke-test job could be added to `python-tests.yml`, but this is low priority given the architecture-independence guarantee already in place.

### 14.4 Ecosystem Enablement

Already substantially covered by RISE's existing `python-wheels` work on `hf-xet`, `hf-transfer`, `tokenizers`, and `safetensors`. No additional ecosystem enablement work specific to huggingface_hub itself is needed.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None - already fully functional on riscv64 | 0 | N/A | N/A |
| Performance | Renew/re-file upstream `hf-xet` riscv64 wheel request in xet-core with a working reference build attached | 0.5-1 | RISE / community | Low |
| Performance | (Alternative) RISE-hosted `hf-xet` riscv64 wheel via RISE wheel builder, if upstream continues to decline | 1-2 | RISE | Low |
| CI/CD | Optional riscv64 smoke-test job in `python-tests.yml` (install + import check) | 0.5 | RISE / community PR | Low |
| Ecosystem | None beyond already-funded RISE `python-wheels` work on `hf-xet`/`hf-transfer`/`tokenizers`/`safetensors` | 0 | RISE (in progress) | N/A |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [huggingface/huggingface_hub GitHub repository](https://github.com/huggingface/huggingface_hub)
- [HuggingFace Hub documentation](https://huggingface.co/docs/huggingface_hub)
- [PyPI JSON API: huggingface-hub](https://pypi.org/pypi/huggingface-hub/json)
- [PyPI simple index: huggingface-hub](https://pypi.org/simple/huggingface-hub/)
- [RISE Python wheel builder GitLab API: huggingface-hub](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/huggingface-hub/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu 26.04 Resolute package search: HuggingFace Hub](https://packages.ubuntu.com/search?keywords=HuggingFace%20Hub&suite=resolute&searchon=names&section=all)
- [Debian package search: huggingface-hub](https://packages.debian.org/search?keywords=huggingface-hub)
- [Gentoo package: sci-ml/huggingface_hub](https://packages.gentoo.org/packages/sci-ml/huggingface_hub)
- [xet-core issue #700: Add riscv64 wheel to PyPI releases (closed, not_planned)](https://github.com/huggingface/xet-core/issues/700)
- [BLAKE3 issue #484: Improved RISC-V support + SIMD (open)](https://github.com/BLAKE3-team/BLAKE3/issues/484)
- [tokio issue #6355: Segmentation fault in park_timeout() on riscv64 (closed/fixed)](https://github.com/tokio-rs/tokio/issues/6355)
- [huggingface_hub CONTRIBUTING.md governance stance](https://github.com/huggingface/huggingface_hub/blob/main/CONTRIBUTING.md)
- [huggingface_hub LICENSE (Apache 2.0)](https://github.com/huggingface/huggingface_hub/blob/main/LICENSE)
- [RISE blog post listing (0/34 posts reference HuggingFace)](https://riseproject.dev/blog/)
- [riseproject-dev/sw-ecosystem project tracking](https://github.com/riseproject-dev/sw-ecosystem)
- [riseproject-dev/python-wheels repository](https://github.com/riseproject-dev/python-wheels)
