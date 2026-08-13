---
title: HuggingFace Transformers
---

# HuggingFace Transformers

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for HuggingFace Transformers<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[HuggingFace Transformers](https://github.com/huggingface/transformers) ([docs](https://huggingface.co/docs/transformers)) is a pure-Python model-definition and orchestration library for machine learning models (NLP, vision, audio, multimodal). It contains no compiled C/C++/Rust/assembly source of its own: confirmed by a full repository-root listing (only `src/`, `tests/`, `docker/`, `benchmark*/`, `examples/`, `scripts/`, `utils/`, no `csrc/`, `kernels/`, or `native/` directories), by a GitHub code search for `extension:cpp`, `extension:c`, and `extension:S` scoped to the repo (all returned `total_count: 0`), and by inspection of `setup.py`, which contains no `ext_modules`, `Extension()`, or Cython build step.

**Governance:** No independent foundation. The repository is owned and governed directly by the Hugging Face company (a private, VC-backed company), not a foundation-hosted project such as the Linux Foundation or Apache Software Foundation. License is Apache-2.0. There is no `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file; review assignment is automated via `.github/scripts/codeowners_for_review_action`. `CONTRIBUTING.md` describes an informal maintainer model where HF-employed engineers act as reviewers, and explicitly discusses maintainer fatigue from low-value/"code agent" PRs, asking contributors to avoid small busywork PRs.

**Top contributors by commit count** (all long-standing members of the `huggingface` GitHub org; individual current employer affiliations were not independently verified against LinkedIn/company bios, so treat as [NEEDS VERIFICATION]): sgugger (1860), ydshieh (1661), thomwolf (1402), LysandreJik (1384), patrickvonplaten (996), ArthurZucker (828), gante (745), stas00 (646), Rocketknight1 (596), stevhliu (552), julien-c (548), zucchini-nlp (548), amyeroberts (546), Cyrilvallez (521), SunMarc (442), younesbelkada (406), NielsRogge (383), vasqu (320), patil-suraj (318), sshleifer (316).

**Community culture on new ports:** No explicit RISC-V policy exists. The general contribution stance (per `CONTRIBUTING.md`) is that maintainers are increasingly selective and discourage mechanical/low-value PRs. No one has proposed a RISC-V-specific PR against `transformers` itself to test this stance against.

## 2. Port History and Upstreaming Timeline

There is no port history to report for `huggingface/transformers` itself: zero RISC-V issues, pull requests, or commits exist in the repository, confirmed by exhaustive `gh search` across issues, PRs, and commits (open and closed, all field matches including body/comments), by GitHub code search for `riscv`/`riscv64`/`RISCV`, and by a full-text grep of all 59 CI workflow files. A sanity check confirmed the GitHub search API itself is functional during this research (`arm64 repo:huggingface/transformers` returned 330 hits, `pytorch repo:huggingface/transformers` returned 15,342 hits), so the zero-result count for RISC-V terms is a genuine absence, not an API failure.

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V-related commit, issue, or PR has ever been filed against `huggingface/transformers` | `gh search` (issues/PRs/commits), GitHub code search, full CI workflow grep |
| 2025-07-02 | User reports `pip install transformers==4.39.2` fails on riscv64 because dependency `tokenizers` has no riscv64 wheel | [huggingface/tokenizers#1816](https://github.com/huggingface/tokenizers/issues/1816) |
| 2025-07-07 | Issue closed via workaround (user installs Rust toolchain and builds `tokenizers` from source); maintainer ArthurZucker states "We don't compile for ricv [sic]" | [huggingface/tokenizers#1816](https://github.com/huggingface/tokenizers/issues/1816) |
| 2026-03-11 | Community contributor (gounthar) requests riscv64 wheels for `hf-xet`, a storage-backend dependency of `transformers`/`huggingface_hub`, backed by a working wheel built on a BananaPi F3 (SpacemiT K1) | [huggingface/xet-core#700](https://github.com/huggingface/xet-core/issues/700) |
| 2026-03-12 | PR implementing the request opened, adding a riscv64 matrix entry via maturin cross-compilation | [huggingface/xet-core#704](https://github.com/huggingface/xet-core/pull/704) |
| 2026-03-23 | Both the issue and the PR are closed by HuggingFace maintainer rajatarya, citing team bandwidth/prioritization, not technical objections; the PR's native and RISE-runner test results (703+/706 passing) had already confirmed technical viability | [huggingface/xet-core#700](https://github.com/huggingface/xet-core/issues/700), [huggingface/xet-core#704](https://github.com/huggingface/xet-core/pull/704) |
| 2026-03-26 | (Dependency-layer, not `transformers` itself) `tokenizers` and `safetensors` merge riscv64 into their CI wheel matrices and begin shipping riscv64 wheels on PyPI | See [reports/tokenizers.md](reports/tokenizers.md), [reports/safetensors.md](reports/safetensors.md) |

**Key contributors:** gounthar (community, independent - authored the working riscv64 wheel-build code for `hf-xet` and validated it on both a personal BananaPi F3 and RISE's `ubuntu-24.04-riscv` self-hosted CI runners, credited to "@luhenry and RISE" in PR discussion). No HuggingFace-employed engineer has authored riscv64-enabling work; the only HF-employee involvement identified is maintainers declining or explaining non-support (rajatarya, assafvayner, ArthurZucker).

**Is it fully upstream?** No. Nothing riscv64-related is merged in `transformers` (nothing exists to merge), and the one substantive riscv64 code change in the adjacent `xet-core` repo (PR #704) was closed unmerged.

## 3. Upstream Support Tier

No formal tier policy applies, because `transformers` has no architecture-specific build or release artifacts for **any** platform, not just riscv64. It ships as `transformers-5.15.0-py3-none-any.whl` (a single universal wheel) plus a source tarball, confirmed by direct inspection of [pypi.org/pypi/transformers/json](https://pypi.org/pypi/transformers/json): the `urls[]` array contains exactly 2 files, neither of which is architecture-specific. GitHub Releases (`v5.15.0`, `v5.14.1`, `v5.14.0`, `v5.13.1`, `v5.13.0`) carry zero binary assets (source-only tags).

| Platform | Official binary | CI | Release-blocking status |
|---|---|---|---|
| amd64 | N/A - universal wheel covers it | Runs on `ubuntu-latest`/`ubuntu-22.04` runners | N/A |
| arm64 | N/A - universal wheel covers it | Data not available: no arm64-specific runner labels found in the 59 workflow files reviewed; findings did not include an explicit arm64 CI check | N/A |
| riscv64 | N/A - universal wheel covers it (subject to native dependencies working, see Section 9) | None | N/A |

Because the package itself is architecture-independent by construction, "tier" is a category error here: `transformers` needing riscv64 to work is entirely a function of whether its native-code dependencies (torch, tokenizers, hf-xet, etc.) work on riscv64, not of any tier decision made in this repo.

## 4. Technical Architecture and RISC-V-Specific Subsystems

`huggingface/transformers` contains no architecture-specific subsystems (no JIT, no hand-written SIMD, no crypto, no assembly, no GC barriers) for any architecture. Confirmed by:
- Code search `extension:cpp`, `extension:c`, `extension:S` scoped to the repo: `total_count: 0` for all three.
- Code search for RVV intrinsics (`vfloat32m1_t`, `vsetvli`), Zba/Zbb extension mnemonics, and `arch/riscv`, `riscv-gnu-toolchain`: all 0 results, aside from two confirmed false positives (a substring match inside a synthetic protein sequence in a test file, and a substring match inside an unrelated German word in a translated doc page).
- No `csrc/`, `kernels/`, or `native/` directory exists in the repo tree.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT / SIMD kernels | Not applicable - delegated to torch/backends | Not applicable - delegated to torch/backends | Not applicable - delegated to torch/backends |
| Crypto | Not applicable - none in this repo | Not applicable - none in this repo | Not applicable - none in this repo |
| Assembly | None found | None found | None found |

**Verdict: N/A for all architectures, not a riscv64-specific gap.** All numerical compute is delegated to backend frameworks (PyTorch historically also TensorFlow/JAX) and to Rust-based tokenization/storage packages (`tokenizers`, `hf-xet`, `safetensors`). RISC-V enablement, where it matters, happens in those dependencies - see Section 9.

## 5. Build System, Cross-Compilation, and Toolchain

`transformers` has no native build system: no `CMakeLists.txt` exists anywhere in the repo (code search `filename:CMakeLists.txt` returned 0 results, cross-checked against non-zero hits for common terms like "torch" (3,900) and "modeling_utils" (850) confirming the search index works), no `Cargo.toml`, no `go.mod`. Per `docker/README.md`, the entire "build" is `uv pip install -e .`, taking approximately 5 seconds, with no compilation step and no toolchain requirement.

No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists (all 404 via the GitHub Contents API). No riscv64-specific build documentation, toolchain minimum-version requirement, or QEMU cross-compilation workflow exists in this repository, because there is nothing to cross-compile.

**Note on Docker image count discrepancy:** two separate research passes reported different counts for the `docker/` directory - one pass found 23 Dockerfiles, another found 13. Neither pass found any riscv64-specific Dockerfile, `--platform linux/riscv64` argument, or arch-specific `FROM` line in any of them, so this discrepancy does not affect the riscv64 conclusion, but the exact file count is [NEEDS VERIFICATION].

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

There is no functional gap in `transformers` itself between amd64/arm64/riscv64, since the package is architecture-independent Python code. The practical gap that riscv64 users experience is entirely downstream in the dependency chain:

| Layer | amd64/arm64 experience | riscv64 experience |
|---|---|---|
| `transformers` install | `pip install transformers` works immediately | `pip install transformers` works immediately (pure Python) |
| `tokenizers` (hard dependency) | Prebuilt wheel installs instantly | Prebuilt wheel now available (`tokenizers-0.23.1-...manylinux_2_31_riscv64.whl`) per Section 9; earlier versions required a from-source build needing a Rust toolchain ([huggingface/tokenizers#1816](https://github.com/huggingface/tokenizers/issues/1816)) |
| `hf-xet` (Hub download backend) | Prebuilt wheel installs instantly | No prebuilt wheel; falls back to a from-source build (~30 minutes on a 1.6GHz riscv64 SoC per the evidence in [huggingface/xet-core#700](https://github.com/huggingface/xet-core/issues/700)), since the enabling PR was closed unmerged |
| `torch` (de facto required for real model inference) | Official wheel | No riscv64 wheel exists at all; see Section 9 |

**Performance gaps:** Data not available for `transformers`-level benchmarks. One finding referenced PyTorch's XNNPACK RVV path having "100+ failing tests" cross-referenced against a PyTorch issue (#9886), but this is a claim about the `torch` dependency, sourced from a single research pass without independent confirmation, and is [NEEDS VERIFICATION].

**Security hardening gaps:** Data not available: not investigated in the research findings.

**NaN / floating-point semantics issues:** Data not available for `transformers` or its direct search scope. Not found in the findings for this repository.

## 7. CI/CD Infrastructure

**No riscv64 CI exists, direct or indirect, anywhere in `huggingface/transformers`.** Confirmed by fetching and grepping the raw content of all 59 files under `.github/workflows/` (case-insensitive search for "riscv": 0 matches across ~6,600 total lines) and all Dockerfiles under `docker/`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

Runners referenced throughout the workflow files are `ubuntu-latest`/`ubuntu-22.04` (x86) and self-hosted GPU runner labels for AMD (`mi250`, `mi300`, `mi355`) and Intel Gaudi/Gaudi3. No QEMU emulation step and no `docker buildx --platform linux/riscv64` invocation exists anywhere.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Yes (`ubuntu-latest`) | Data not available: no arm64-specific runner label identified in the 59 files reviewed | No |
| Hardware | GitHub-hosted + self-hosted AMD/Intel Gaudi GPU | Data not available | None |
| RISE runner usage | N/A | N/A | Not used by `transformers` (RISE `ubuntu-24.04-riscv` runners were used by the community contributor's work in the separate `xet-core` repo, not in `transformers`) |

## 8. Distribution and Release Status

| Channel | Status | Evidence |
|---|---|---|
| PyPI | `transformers` package, latest `5.15.0`, ships only `transformers-5.15.0-py3-none-any.whl` and `transformers-5.15.0.tar.gz` - architecture-independent, no riscv64-specific artifact exists or is needed | [pypi.org/pypi/transformers/json](https://pypi.org/pypi/transformers/json) |
| PyPI (wrong name check) | `huggingface-transformers` does not exist as a package name | [pypi.org/pypi/huggingface-transformers/json](https://pypi.org/pypi/huggingface-transformers/json) returns HTTP 404 |
| GitHub Releases | Zero binary assets attached to the 3 most recent releases (`v5.15.0`, `v5.14.1`, `v5.14.0`) - source-only tags | Verified via `gh release view --json assets` |
| RISE wheel builder / GitLab package index | No custom wheel published; the index URL 302-redirects to `pypi.org/simple/...` | `gitlab.com/api/v4/projects/56254198/packages/pypi/simple/transformers/` |
| Ubuntu 24.04 (noble) | No package found under "HuggingFace Transformers" or "transformers"; a bare "transformers" keyword search returns only unrelated Haskell (`libghc-*-transformers-*`) and `node-transformers` packages | [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=HuggingFace%20Transformers&suite=noble) |
| Debian | Package `transformers`, version `5.12.1-2` in unstable, maintained by the Debian Deep Learning Team, `Architecture: all` (pure Python) | [tracker.debian.org/pkg/transformers](https://tracker.debian.org/pkg/transformers) |
| Arch Linux RISC-V | No `python-transformers`/`python3-transformers` package in `extra`, `core`, or `unsupported` repo listings; only unrelated Haskell `transformers`/`transformers-base`/`transformers-compat` packages exist under similar names | [archriscv.felixc.at](https://archriscv.felixc.at) |

**Contradiction flag:** one research pass reported seeing Debian autopkgtest result rows for amd64/arm64/ppc64el/s390x (with armhf/i386 marked "not installable, allowed") on the Debian tracker page for `transformers`; a later adversarial verification pass fetching the same page could not reproduce any per-architecture row at all. This discrepancy is unresolved and the per-architecture Debian build/test status should be treated as [NEEDS VERIFICATION].

**What a user must do to get a working install on riscv64 today:** `pip install transformers` succeeds immediately (pure Python, universal wheel). Its hard dependency `tokenizers` now has an official riscv64 wheel and should also install cleanly (see Section 9). Its `huggingface_hub`-chain dependency `hf-xet` has no riscv64 wheel, forcing a from-source build (~30 minutes, requires a Rust toolchain, per [huggingface/xet-core#700](https://github.com/huggingface/xet-core/issues/700)). For any actual model inference beyond a no-op import, `torch` has no riscv64 wheel at all, which is the practical blocker to real usage today.

## 9. Dependencies

`transformers`' hard install dependencies (from `setup.py`) are: `huggingface-hub`, `numpy`, `packaging`, `pyyaml`, `regex`, `tokenizers`, `typer`, `safetensors`, `tqdm`. Heavily-used optional extras add `torch`, `sentencepiece`, `tiktoken`, `faiss-cpu`, `protobuf`, `kenlm`.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues | Detail |
|---|---|---|---|---|---|---|
| tokenizers (Rust) | Hard; fast tokenizer backend | Working - riscv64 added to CI wheel matrix, merged 2026-03-26 | Passing in CI | Shipping: `tokenizers-0.23.1-...manylinux_2_31_riscv64.whl` on PyPI | None open; earlier compile failure ([#1816](https://github.com/huggingface/tokenizers/issues/1816)) resolved via workaround before the fix landed | [reports/tokenizers.md](reports/tokenizers.md) |
| safetensors (Rust) | Hard; tensor serialization | Working - riscv64 added to CI wheel matrix, merged 2026-03-26 | Passing in CI | Shipping: `safetensors-0.8.0-...manylinux_2_31_riscv64.whl` on PyPI | None open | [reports/safetensors.md](reports/safetensors.md) |
| numpy (C, SIMD) | Hard; array/numeric backend | Working - wheel-build workflow merged 2026-05-27; promoted to NEP-57 Tier 3 (~Aug 2026) | Passing in CI on self-hosted RISE riscv64 runners | Not yet shipping on PyPI (latest 2.5.2 has no riscv64 wheel) despite green CI; community wheel index at gounthar.github.io/riscv64-python-wheels | Tier-3-to-official-wheel transition pending | [reports/numpy.md](reports/numpy.md) |
| torch (C++/CUDA) | Optional but de facto required for most model usage | Early stage - active tracking issue for RISC-V enablement, Phase 1 CI/build incomplete; XNNPACK RVV path reported broken [NEEDS VERIFICATION, single source] | No published pass-rate | Not shipping (latest 2.13.0, no riscv64 wheel) | uKernel/GEMM RVV kernels not implemented; XNNPACK cpuinfo gap | [reports/pytorch.md](reports/pytorch.md) |
| sentencepiece (C++) | Subword tokenizer used by many model configs | Working after toolchain fix (gcc bumped to gcc-14 to fix an abseil `static_assert` failure); briefly reverted for stability, now green | Passing (informational cross-build) | Not shipping on PyPI (latest 0.2.2); wheels only via community RISE index | Open issue asking whether official PyPI distribution will resume | [reports/sentencepiece.md](reports/sentencepiece.md) |
| tiktoken (Rust) | BPE tokenizer for some model configs | Proposed, not merged - CI wheel-build PR still open | Not run in CI | Not shipping (latest 0.13.0) | Open issue requesting riscv64 wheel, unresolved | [reports/tiktoken.md](reports/tiktoken.md) |
| faiss-cpu (C++/SIMD) | Vector similarity search for retrieval pipelines | Partial - CMake detects riscv64 and selects an RVV source set; enabling PR closed, not merged | Cross-compile SIMD smoke test only | Not shipping (latest 1.15.0); Debian sid has a native pre-RVV build | Prior "device build failed" issue closed without full fix; most RVV kernels remain scalar fallback | [reports/faiss.md](reports/faiss.md) |
| protobuf (C++) | Serialization used by sentencepiece and model config formats | Rejected - maintainers state "RISC-V isn't on our roadmap"; multiple riscv64 issues/PRs closed without merge | Not tested | Not shipping | Explicit maintainer non-commitment, no CI coverage | [reports/protobuf.md](reports/protobuf.md) |
| kenlm (C++) | Audio/CTC scoring extra | Unknown/unverified - no riscv64 issues found on a single GitHub search pass; not in scope.yml | Unverified | No riscv64 wheel found on PyPI (version 0.3.0) | Not investigated further | Not in scope.yml |
| huggingface-hub (pure Python) | Hard; model hub client | Pure Python, no native build concerns | N/A | Ships automatically (universal wheel) | None found | Not in scope.yml |

**Critical-path read:** the two hard dependencies with compiled backends that matter most for baseline install, `tokenizers` and `safetensors`, are fully working and shipping riscv64 wheels. The severest blocker in the chain is `torch`: although nominally "optional" in `setup.py`, it is required for essentially all real-world `transformers` usage, and PyTorch riscv64 enablement is still early-stage with no PyPI wheel. `protobuf`, a persistent transitive dependency of `sentencepiece`-based tokenization, has been explicitly rejected by its own maintainers as out of roadmap scope, which is a harder blocker than anything found in the HuggingFace-controlled repos.

## 11. Known Bugs and Active Issues

No open correctness or performance issues exist for `transformers` itself on riscv64 (zero issues exist, period). The only riscv64-related bugs found anywhere in the dependency chain surfaced during the `xet-core` PR #704 work (a different repo, not `transformers`):

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| xet-core test failure | `safe_file_creator_new` / `safe_file_creator_new_unnamed` assertion `436 == 420` | Found on native BananaPi F3 run, unresolved (PR closed before fix) | Low - likely filesystem block-size difference on riscv64 | Not merged, not a `transformers` bug |
| xet-core test failure | `test_monitor_self_disk_usage` assertion | Found on native BananaPi F3 run, unresolved (PR closed before fix) | Low - likely sysinfo/procfs reporting difference on riscv64 | Not merged, not a `transformers` bug |
| xet-core test failure | `test_active_window_protection` (on RISE `ubuntu-24.04-riscv` runner) | Root-caused by contributor as a test-timing race (200ms disk-sync wait insufficient on faster RISE runner disk I/O), not a platform bug; fix proposed (`assert!(log_files >= 1 && log_files <= 2)`) | Informational - not a correctness bug in the underlying code | Not merged |

None of these are correctness bugs in `transformers` itself; all are in the closed-unmerged `hf-xet` CI work.

## 12. Objections and Upstream Blockers

**Stated objections (verbatim, from primary sources):**
- HuggingFace maintainer rajatarya, closing [huggingface/xet-core#700](https://github.com/huggingface/xet-core/issues/700): "Sorry, we are not going to pursue supporting this architecture right now. We are stretched pretty thin working on supporting language bindings (Rust crate) and enhancements to the Xet Storage backend... we are not going to prioritize introducing another CI environment for packaging."
- Same maintainer, closing [huggingface/xet-core#704](https://github.com/huggingface/xet-core/pull/704): "Closing this PR as this is not work we are taking on right now. We appreciate the effort @gounthar but we cannot devote time to this now."
- HuggingFace maintainer ArthurZucker, on [huggingface/tokenizers#1816](https://github.com/huggingface/tokenizers/issues/1816) (2025-07): "We don't compile for ricv [sic]." (Note: this stance was superseded by the time of this report - per Section 9, `tokenizers` merged riscv64 CI and began shipping wheels in March 2026, roughly 8 months after this comment. The organizational objection was not durable.)

**Technical blockers:** None found for `transformers` itself (no native code to port). For the adjacent `xet-core` PR, the technical case was fully resolved before closure: native hardware testing (BananaPi F3 and RISE's `ubuntu-24.04-riscv` runners) showed 703+/706 tests passing, with the remaining single failure root-caused as a test-timing artifact, not a platform defect.

**Organizational blockers:** The dominant blocker across the HuggingFace org is explicit non-prioritization, not technical infeasibility. This is stated twice by name (rajatarya) for `xet-core`, and once by name (ArthurZucker) for `tokenizers`, though the latter was reversed within the org over time without any documented policy change.

**Acceptance probability:** For `transformers` itself, there is nothing to accept or reject (no port needed). For the one concrete pending artifact, a revived `hf-xet` riscv64 wheel PR, acceptance probability is assessed as moderate-to-high if resubmitted with the same validated code, given that `tokenizers` and `safetensors` (comparable Rust-wheel dependencies) were separately merged in the same March 2026 window - suggesting the org's threshold for accepting riscv64 wheel PRs has already shifted favorably since the `xet-core` closures, though this trend is inferred from parallel dependency outcomes, not a direct statement, and should be treated as [NEEDS VERIFICATION].

## 13. Investment Analysis

### 13.1 Functional Enablement

`transformers` itself requires zero enablement work: it is pure Python and installs on riscv64 today without modification. All functional work needed is one layer down the dependency stack, and RISE/community has already covered a substantial share of it:
- `tokenizers` and `safetensors`: already done, shipping wheels. No further investment needed.
- `numpy`: CI already merged (2026-05-27) and passing on RISE riscv64 runners; the only remaining step is the Tier-3-to-official-PyPI-wheel publish, which is a process/release step, not new engineering. Low effort if pursued.
- `hf-xet`: code already written and validated (PR #704, 703+/706 native tests passing on both a BananaPi F3 and RISE's own `ubuntu-24.04-riscv` runners) but closed unmerged for HuggingFace-side prioritization reasons, not technical reasons. The work is to resubmit/advocate for the existing PR, not to redo the engineering.
- `torch`: this is the real gating item, and is tracked separately (see [reports/pytorch.md](reports/pytorch.md)); do not resize here, as it is a large, independently-scoped effort already covered by that report.

### 13.2 Performance Optimization

Not applicable to `transformers` itself (no native kernels exist to optimize). Any performance work is entirely a function of the `torch` RVV kernel roadmap; see [reports/pytorch.md](reports/pytorch.md). Do not size RVV kernel work under this report.

### 13.3 CI/CD Infrastructure

`transformers` has no compiled path, so no riscv64 build/test CI is strictly required. A low-cost addition would be a riscv64 smoke-test job (pure-Python import + a minimal pipeline run) on a RISE `ubuntu-24.04-riscv` runner, but this only becomes meaningful once `torch` and `hf-xet` wheels are available on riscv64 - before that, such a job would only validate the already-working pure-Python import path.

### 13.4 Ecosystem Enablement

The most concrete, lowest-effort item identified in this research is reviving `hf-xet` riscv64 support: the code exists, is tested on RISE's own hardware, and only needs HuggingFace maintainer buy-in (or continued RISE-side advocacy/resubmission) to merge. This is a re-engagement task, not new engineering.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Advocate for / resubmit `hf-xet` riscv64 wheel PR ([xet-core#704](https://github.com/huggingface/xet-core/pull/704), already coded and validated) | <1 (advocacy/resubmission only, code already exists) | RISE community liaison | Medium |
| Functional | Push `numpy` Tier-3 riscv64 wheel from CI-passing to published-on-PyPI (release process step, CI already merged) | <1 | RISE / numpy release team | Medium |
| Functional | `torch` riscv64 GA enablement (Phase 1 CI/build, XNNPACK RVV fixes) | Out of scope for this report - see [reports/pytorch.md](reports/pytorch.md) for sizing | RISE / PyTorch upstream | Critical (blocks real-world `transformers` usage) |
| Functional | `protobuf` riscv64 support (explicit maintainer non-commitment; blocks `sentencepiece`-based tokenization paths) | Data not available: requires a separate governance/advocacy strategy, not sized here | RISE community liaison | Low (maintainer has stated it is out of roadmap; low near-term acceptance probability) |
| CI/CD | riscv64 smoke-test job for `transformers` on a RISE runner | <1, but low value until `torch`/`hf-xet` wheels land | RISE / transformers community | Low (sequencing dependency) |
| Ecosystem | `tiktoken` riscv64 wheel (PR already open, unmerged) | <1 (advocacy/resubmission, code likely exists per open PR) | RISE community liaison | Medium |
| Ecosystem | `faiss-cpu` riscv64 wheel (partial RVV scaffolding, PR closed unmerged) | 1-2 (needs re-engineering the closed PR, not just resubmission) | RISE / faiss upstream | Low-Medium |

## 14. Updates

(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [huggingface/transformers repository](https://github.com/huggingface/transformers)
- [Transformers documentation homepage](https://huggingface.co/docs/transformers)
- [huggingface/tokenizers#1816 - "tokenizers cannot be compiled successfully on riscv machine"](https://github.com/huggingface/tokenizers/issues/1816)
- [huggingface/xet-core#700 - "Add riscv64 (linux_riscv64) wheel to PyPI releases"](https://github.com/huggingface/xet-core/issues/700)
- [huggingface/xet-core#704 - "ci: add riscv64 target to Linux wheel builds"](https://github.com/huggingface/xet-core/pull/704)
- [RISE Project members list](https://riseproject.dev/members/)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project blog listing](https://riseproject.dev/blog/) (dynamic content did not render via fetch tool)
- [PyPI JSON API for transformers](https://pypi.org/pypi/transformers/json)
- [PyPI JSON API for huggingface-transformers (404, wrong package name)](https://pypi.org/pypi/huggingface-transformers/json)
- [Debian package tracker for transformers](https://tracker.debian.org/pkg/transformers)
- [Arch Linux RISC-V build status project](https://archriscv.felixc.at)
- [Ubuntu package search for HuggingFace Transformers](https://packages.ubuntu.com/search?keywords=HuggingFace%20Transformers&suite=noble)
- [reports/tokenizers.md - Tokenizers riscv64 status report](reports/tokenizers.md)
- [reports/safetensors.md - Safetensors riscv64 status report](reports/safetensors.md)
- [reports/numpy.md - NumPy riscv64 status report](reports/numpy.md)
- [reports/pytorch.md - PyTorch riscv64 status report](reports/pytorch.md)
- [reports/sentencepiece.md - SentencePiece riscv64 status report](reports/sentencepiece.md)
- [reports/tiktoken.md - tiktoken riscv64 status report](reports/tiktoken.md)
- [reports/faiss.md - Faiss riscv64 status report](reports/faiss.md)
- [reports/protobuf.md - Protobuf riscv64 status report](reports/protobuf.md)