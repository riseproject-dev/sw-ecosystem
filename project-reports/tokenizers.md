---
title: tokenizers
parent: Project Reports
color: yellow
dependencies:
  - name: maturin
    relation: build-dependency
    criticality: critical
  - name: pyo3
    relation: runtime-dependency
    criticality: critical
  - name: rayon
    relation: runtime-dependency
    criticality: critical
  - name: ahash
    relation: runtime-dependency
    criticality: optional
  - name: oniguruma
    relation: runtime-dependency
    criticality: optional
  - name: fancy-regex
    relation: runtime-dependency
    criticality: critical
  - name: esaxx-rs
    relation: runtime-dependency
    criticality: optional
  - name: daachorse
    relation: runtime-dependency
    criticality: critical
  - name: unicode-normalization-alignments
    relation: runtime-dependency
    criticality: critical
  - name: spm_precompiled
    relation: runtime-dependency
    criticality: optional
  - name: tokio
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="tokenizers" %}

# tokenizers

**Author:** Ludovic HENRY <mail@ludovic.dev><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (build-only-ci)<br/>
**Scope:** RISC-V (riscv64/linux) support status for tokenizers<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[tokenizers](https://huggingface.co/docs/tokenizers) is a Rust library implementing high-performance tokenizers for large language models, with BPE (Byte-Pair Encoding), Unigram, WordPiece, and WordLevel algorithm implementations plus pre-tokenizers, normalizers, and post-processors. Python bindings (via PyO3/maturin) are the primary consumer interface, used throughout the Hugging Face ecosystem (`transformers` and its dependents) as the tokenization layer for LLM inference and training; Node.js bindings also exist but are a secondary distribution channel.

**Governance:** tokenizers is wholly owned and controlled by Hugging Face (the company). No external foundation, steering committee, or community governance body was found. No CODEOWNERS, MAINTAINERS, or OWNERS file exists, and no PLATFORMS.md/SUPPORT.md tier-policy document exists either. License: Apache 2.0.

**Maintainers active in the riscv64 work:** ArthurZucker (Hugging Face) reviewed and approved the riscv64-enabling PR; McPatate (Hugging Face) flagged and coordinated a CI-infrastructure blocker ([PR #1978](https://github.com/huggingface/tokenizers/pull/1978)) that briefly delayed the merge; sebpop (affiliation not confirmed) authored the later mimalloc-allocator PR that explicitly excludes riscv64.

**Hugging Face is not a RISE Project member.** RISE Premier members are Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent; General members are Akeana, Andes Technology, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision (ByteDance), Institute of Software Chinese Academy of Sciences, Microchip, NextSilicon, Quintauris, SpacemiT, and ZTE. Hugging Face appears in neither tier.

**Culture on new ports:** maintainer ArthurZucker's review of the riscv64-enabling PR was unreserved: "LGTM happy to have coverage for riscv64!" Secondary architectures (ppc64le, s390x, armv7, aarch64) are already treated as ordinary PyPI wheel targets in the same build matrix. No gatekeeping policy for new architectures was found.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-07-02 | [Issue #1816](https://github.com/huggingface/tokenizers/issues/1816) opened by zengqingfu1442: `pip install transformers==4.39.2` fails to build `tokenizers` from source on riscv64 Ubuntu Jammy/Python 3.10 because rustup does not recognize the computed target triple `riscv64-unknown-linux-gnu` (the correct triple is `riscv64gc-unknown-linux-gnu`) | [Issue #1816](https://github.com/huggingface/tokenizers/issues/1816) |
| 2025-07-07 | Issue #1816 closed as completed, with no linked fix PR in this repository; resolution tracks to rustup's own riscv64gc tier-2 target maturing upstream | [Issue #1816](https://github.com/huggingface/tokenizers/issues/1816) |
| ~2025-07-28 | maturin reported to have fixed riscv64 manylinux triple handling in v1.9.3 | [NEEDS VERIFICATION - cited in dependency research notes, not independently confirmed against maturin's own release notes] |
| 2026-02-19 | [PR #1951](https://github.com/huggingface/tokenizers/pull/1951) opened by threexc (GitHub handle; commit author field reads Trevor Gamblin, BayLibre), explicitly on behalf of the RISE Project: restructures the Linux wheel build matrix so `arch` and rustc `target` are distinct fields (maturin's riscv64 arch string and the `riscv64gc-unknown-linux-gnu` rustc triple do not line up the way they do for other architectures), then adds the riscv64 matrix entry | [PR #1951](https://github.com/huggingface/tokenizers/pull/1951) |
| 2026-03-11 | [Issue #1961](https://github.com/huggingface/tokenizers/issues/1961) opened by gounthar (first-time contributor) as the de facto tracking issue: demonstrates a working, smoke-tested wheel (`tokenizers-0.22.2-cp39-abi3-manylinux_2_34_riscv64.whl`) built natively on a BananaPi F3 (SpacemiT K1, rv64imafdcv, 8 cores at 1.6 GHz) in about 20 minutes, and proposes the same CI matrix change as #1951 | [Issue #1961](https://github.com/huggingface/tokenizers/issues/1961) |
| 2026-03-12 | [PR #1963](https://github.com/huggingface/tokenizers/pull/1963) opened by gounthar as a parallel implementation of the same matrix change, citing "Fixes #1961" | [PR #1963](https://github.com/huggingface/tokenizers/pull/1963) |
| 2026-03-19 | PR #1963 closed by its own author in deference to #1951, which "was opened first" - avoids duplicate/competing implementations | [PR #1963](https://github.com/huggingface/tokenizers/pull/1963) |
| 2026-03-25 | McPatate flags an unrelated CI breakage blocking #1951; threexc rebases once the fix ([PR #1978](https://github.com/huggingface/tokenizers/pull/1978)) lands | [PR #1951](https://github.com/huggingface/tokenizers/pull/1951) |
| 2026-03-26 | [PR #1951](https://github.com/huggingface/tokenizers/pull/1951) merged to `main` (commit `44a84169fd719fd0b8ec6bd0c761248d7afc9abb`, authored Trevor Gamblin, 35 checks passing); Issue #1961 closed the same day as completed | Direct git clone verification, commit `44a84169` |
| 2026-04-24 | `v0.23.0rc0` tagged - first release tag reachable from commit `44a84169`, i.e. the first release containing riscv64 build support | `git tag --contains 44a84169` |
| 2026-04-27 | `v0.23.1` tagged - first stable (non-rc) release; `tokenizers-0.23.1-cp310-abi3-manylinux_2_31_riscv64.whl` is the first GA riscv64 wheel on official PyPI | PyPI JSON API |
| 2026-05-26 | [PR #2073](https://github.com/huggingface/tokenizers/pull/2073) opened by sebpop: adds mimalloc as the global allocator for the Python/Node bindings and the benchmark binary; CI breaks on riscv64 (and s390x, ppc64le, armv7, 32-bit x86) because `libmimalloc-sys` 0.1.49 passes `-Werror=date-time`, a flag the manylinux2014 cross-toolchain's GCC 4.8.5 predates (introduced in GCC 4.9), and because mimalloc needs C11 `<stdatomic.h>`, also unavailable on that compiler; the fix restricts mimalloc via `cfg(...)` to `aarch64-unknown-linux-gnu`, `x86_64-unknown-linux-gnu`, and `aarch64-apple-darwin` only, leaving riscv64 on the system allocator | [PR #2073](https://github.com/huggingface/tokenizers/pull/2073) |
| 2026-09-18 | PR #2073 closed | [PR #2073](https://github.com/huggingface/tokenizers/pull/2073); direct `git log --all` search found no merge commit for it |
| 2026-09-03 | `tokenizers-0.23.2-cp310-abi3-manylinux_2_31_riscv64.whl` uploaded to PyPI (3,577,314 bytes) | PyPI JSON API |

**Discrepancy note:** the readiness-grade justification (Section 13) characterizes PR #2073 as "open (unmerged as of research date)," while a direct scan of the upstream git history (`git log --all --oneline | grep -i "#2073"`) finds no merge commit for it and a GitHub-page fetch records it as closed on 2026-09-18. Both sources agree on the substantive fact that matters for riscv64 - the mimalloc feature never shipped for riscv64 - but disagree on whether the PR is still open or was closed unmerged. This is noted here rather than silently resolved.

**Key contributors:** threexc / Trevor Gamblin (BayLibre, submitting on behalf of the RISE Project) authored the merged fix, PR #1951; parallel riscv64-enabling PRs were also submitted by the same contributor to sibling Hugging Face projects `hf_transfer` (#77) and `safetensors` (#708). gounthar (CloudBees; first-time contributor to this repo) filed the original tracking issue #1961, built and benchmarked the proof-of-concept wheel on a BananaPi F3, and separately maintains a stopgap community wheel index ([gounthar/riscv64-python-wheels](https://github.com/gounthar/riscv64-python-wheels)).

**Upstreaming status:** the riscv64 CI build entry and the resulting PyPI wheel are both on `main` and in production releases - no out-of-tree patches are required to install or use tokenizers on riscv64. What remains outside of `main` is test coverage (no riscv64 leg in the test matrix) and the mimalloc allocator optimization (explicitly excluded for riscv64).

The RISE wheel_builder project (`gitlab.com/riseproject/python/wheel_builder`) previously distributed riscv64 wheels for tokenizers 0.20.3 through 0.22.2 ahead of upstream, built natively on RISE RISC-V Runner hardware. Its tokenizers page is now marked deprecated, stating "PyPI now publishes newer versions of this package for riscv64, and we will no longer maintain this package." The community index at `gounthar.github.io/riscv64-python-wheels` continues to host wheels for backward compatibility.

## 3. Upstream Support Tier

tokenizers has no formal tier-policy document (no PLATFORMS.md, SUPPORT.md, or similar). Architectures are handled uniformly inside a single CI matrix with no differentiated status label for riscv64 versus ppc64le, s390x, or armv7.

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes | Yes | Yes (`.github/workflows/python-release.yml`, since [PR #1951](https://github.com/huggingface/tokenizers/pull/1951), merged 2026-03-26) |
| CI build trigger | tag push, manual dispatch | tag push, manual dispatch | tag push, manual dispatch (not on every PR or commit) |
| CI tests | Yes (`test-wheel` matrix) | Yes (`test-wheel` matrix) | No - riscv64 is absent from the `test-wheel` job's matrix |
| Official PyPI wheel | Yes | Yes | Yes, since v0.23.1 (2026-04-27), `manylinux_2_31_riscv64` tag |
| Native CI runner | Yes | Yes (`ubuntu-24.04-arm`) | No - cross-compiled on `ubuntu-24.04` (x86_64) via `PyO3/maturin-action` |
| Release-blocking if build/test fails | Yes | Yes | Build failure would block (riscv64 feeds the `publish` job via the `wheels-*` artifact pattern), but no test ever runs to catch a correctness regression before release |

The absence of riscv64 in the `test-wheel` matrix means a correctness regression introduced on riscv64 cannot be caught by CI before a tagged release ships to PyPI. This is the single fact the readiness grade (Section 13) hinges on.

## 4. Technical Architecture and RISC-V-Specific Subsystems

The core `tokenizers` crate itself (models, normalizers, pre-tokenizers in `src/`) is pure scalar Rust: no `#[cfg(target_arch)]` or `#[cfg(target_feature)]` guards were found in `src/models/bpe/`, `src/models/unigram/`, `src/normalizers/`, or `src/pre_tokenizers/byte_level.rs`. There is no `build.rs` at the core crate level, so no C/C++ compilation occurs there. Parallelism is handled by the Rayon crate (an architecture-agnostic work-stealing thread pool).

A separate, hand-tuned SIMD component exists in the repository, however: the `bitcannon` crate (`tokenizers/bitcannon/`), a pre-tokenizer/classifier used by the fast encode path (`tk-encode`) and built by its own CI workflow (`bitcannon.yml`). Its README documents an explicit per-architecture kernel matrix:

| Kernel | aarch64 | x86_64 | wasm32 | riscv64 |
|---|---|---|---|---|
| Unicode atom classify | NEON (357 lines) | tiered AVX-512 VBMI to SSE4.1/SSSE3, runtime-detected (339 lines) | SIMD128 (323 lines; flagged in-repo as "AI-generated, not necessarily reviewed") | missing - 0 lines |
| Bitstream block build | NEON (233 lines) | SSE/AVX (249 lines) | none | missing - 0 lines |
| Literal and added-token scan | NEON | x86_64-specific | none | missing - 0 lines |
| Vocab bucket nibble match | NEON | none (x86_64 has no kernel here either) | none | missing - 0 lines |

A repo-wide `grep -rni riscv` across every `.rs`/`.toml`/`.py` file returns zero matches - the only "riscv" string anywhere in the source tree is the CI matrix line in `python-release.yml`. A search for `TODO|FIXME|not.?implemented|unimplemented!|stub` inside `bitcannon/src/` also returns zero matches: there is no half-finished riscv64 kernel to find, because none was attempted. Every `#[cfg(target_arch = ...)]` guard in `bitcannon` enumerates exactly `"aarch64"`, `"x86_64"`, and `"wasm32"`; everything else - riscv64 included, on equal footing with ppc64le, s390x, and 32-bit x86 - falls through to `classify_scalar` / `build_block_scalar`.

Critically, per the project's own documentation, this scalar path is not a degraded fallback bolted on after the fact: "every kernel has a portable path that is always compiled and is the byte-exact test oracle for its vectorised siblings, so correctness never depends on a kernel being present." This means riscv64 tokenization through `bitcannon` is functionally correct, just unaccelerated - consistent with PR #1951 merging cleanly and with the PyPI riscv64 wheel shipping without any reported correctness issue.

The only architecture-conditional block that references riscv64 in the repository is the (closed, unmerged) [PR #2073](https://github.com/huggingface/tokenizers/pull/2073) mimalloc allocator change, which gates mimalloc to `aarch64-linux`, `x86_64-linux`, and `aarch64-darwin` and leaves riscv64 (among others) on the system allocator - not because of any riscv64-specific code defect, but because the manylinux2014 cross-compiler (GCC 4.8.5) used to build the riscv64 wheel is too old to compile `libmimalloc-sys`.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| BPE / Unigram / WordPiece / WordLevel tokenization | scalar Rust | scalar Rust | scalar Rust |
| bitcannon Unicode classify kernel | hand-tuned AVX-512/SSE4.1/SSSE3 | hand-tuned NEON | hand-tuned SIMD128 (unreviewed) | missing - scalar fallback |
| bitcannon block-build / scan kernels | hand-tuned SSE/AVX | hand-tuned NEON | none | missing - scalar fallback |
| Hash maps (ahash) | AES-NI hardware | AES hardware | software fallback |
| Parallelism (Rayon) | full | full | full |
| Memory allocator (PR #2073, unmerged) | mimalloc proposed | mimalloc proposed | excluded - system allocator, GCC-4.8.5 toolchain age |
| JIT / code generation | none | none | none |
| Cryptographic acceleration | none | none | none |

**ISA extensions:** no RVV (RISC-V Vector), Zba, Zbb, Zbc, or Zbs extension usage was found anywhere in tokenizers or bitcannon. The CI build target is `riscv64` (maturin arch label), which maturin-action resolves to the `riscv64gc-unknown-linux-gnu` rustc triple (G = IMAFD baseline, C = compressed instructions) - the standard Rust tier-2 generic riscv64 target, with no vector-extension baseline assumed.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Cargo (Rust core, workspace includes `tokenizers/` and `bitcannon/`) plus maturin (Python wheel packaging). No CMake, no Autoconf, no top-level Makefile, and no Dockerfile exist anywhere in the repository (confirmed by exhaustive `find`/`grep`).

**Exact riscv64 CI matrix entry** (`.github/workflows/python-release.yml`, line 102):
```yaml
- { runner: ubuntu-24.04, target: riscv64, manylinux: auto, python: "3.14" }
```
invoked via `PyO3/maturin-action` with:
```yaml
command: build
working-directory: bindings/python
target: riscv64
manylinux: auto
rust-toolchain: stable
args: --release --locked --compatibility pypi --out dist -i 3.14
```

**Toolchain requirements:** Rust `stable` (no pinned version; `bindings/python/rust-toolchain` contains only the string `stable`); Rust edition 2024 (requires rustc >= 1.85); maturin `>=1.0,<2.0` per `pyproject.toml`. The repository does not pin an exact GCC/glibc version for riscv64 - `manylinux: auto` lets `maturin-action` select its own cross-compilation container and toolchain for the target, and that selection is not something this repository defines or exposes. There is no explicit `docker/setup-qemu-action` step in the workflow; any QEMU usage needed for the cross build is handled internally by `maturin-action` for this target, not configured by tokenizers itself.

**Known build failures:**
- Issue #1816 (Jul 2025): maturin computed the target triple as `riscv64-unknown-linux-gnu`, which rustup does not recognize (correct triple: `riscv64gc-unknown-linux-gnu`). The build failed before any Rust compilation started. Resolved by the combination of upstream rustup gaining proper riscv64gc tier-2 support and PR #1951 separating the `arch` and `target` matrix fields.
- PR #2073 (May-Sep 2026): the manylinux2014 cross-toolchain used for riscv64 (and s390x, ppc64le, armv7, 32-bit x86) ships GCC 4.8.5, which rejects `-Werror=date-time` (a flag introduced in GCC 4.9) and lacks C11 `<stdatomic.h>`, blocking `libmimalloc-sys` from compiling for riscv64. Unlike x86_64/aarch64, which could in principle move to a newer `manylinux_2_28` base image, no `manylinux_2_28` riscv64 cross image exists yet, so this is a structural ecosystem gap rather than a tokenizers-specific defect.

**Manual build from source (no wheel):** on a native riscv64 system (Ubuntu Jammy, Python 3.13, BananaPi F3 / SpacemiT K1, 8 cores at 1.6 GHz), a from-source build of tokenizers 0.22.2 took approximately 20 minutes, per issue #1961.

**musllinux:** no musllinux riscv64 wheel was independently reconfirmed in this research pass; the earlier finding that the musllinux matrix in the release workflow excludes riscv64 (covering only x86_64, x86, aarch64, and armv7) is carried forward but not re-verified against the current workflow file [NEEDS VERIFICATION].

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps: none.** All tokenizer algorithms (BPE, Unigram, WordPiece, WordLevel), all normalizers, all pre-tokenizers, and the full Python binding surface are available on riscv64, because the `bitcannon` scalar fallback is the project's documented correctness oracle for every kernel - the same code path other unaccelerated architectures use. PR #1951 merging cleanly and the PyPI riscv64 wheel shipping without reported correctness issues (no open riscv64 bug exists, Section 11) are consistent with this.

**Performance gaps:**

| Gap | Impact | Root cause | Fixable? |
|---|---|---|---|
| bitcannon SIMD kernels absent on riscv64 (Unicode classify, bitstream block build, literal/token scan) | Unicode classification and fast-path encoding run the generic scalar Rust loop instead of a vectorized kernel, on every riscv64 build, with no exception | No RVV/vector-extension kernel has been written; riscv64 is simply not one of the three `#[cfg(target_arch)]` branches (aarch64, x86_64, wasm32) in bitcannon | Yes, in principle - would require a net-new RVV (or scalar RISC-V bit-manipulation, Zbb/Zbs) kernel contribution; no number quantifying the resulting slowdown versus the AVX-512/NEON paths exists in available sources |
| No mimalloc allocator (PR #2073 excludes riscv64) | Throughput gains reported for other platforms (35-56% single-thread, 9.3-97% multi-thread depending on core count) are unavailable on riscv64; riscv64 uses the system allocator | No `manylinux_2_28` riscv64 cross image exists; the current manylinux2014/GCC-4.8.5 toolchain cannot compile `libmimalloc-sys`'s C11 atomics | Yes, once a newer riscv64 cross image exists upstream in pypa/manylinux or rust-cross |
| ahash software fallback (no AES hardware) | Hash-map-heavy internal operations run slower than on x86_64 (AES-NI) or aarch64 (AES); exact delta not independently benchmarked for riscv64 | riscv64 has no scalar AES instruction that ahash currently dispatches to | Partly - Zkn/Zkne cryptography extensions could provide AES primitives, but ahash's riscv64 dispatch path does not currently check for them [NEEDS VERIFICATION] |

**Security hardening gaps:** none identified. tokenizers performs no cryptographic operations of its own; Rust's memory-safety guarantees apply uniformly regardless of architecture.

**Floating-point / NaN semantics:** a dedicated GitHub search for "riscv nan floating" scoped to this repository returned zero results. No NaN or floating-point correctness issue has been filed against riscv64. tokenizers does not perform floating-point model inference itself; Unigram-model probabilities are handled in scalar Rust `f64` arithmetic with no platform-specific code path.

## 7. CI/CD Infrastructure

riscv64 CI exists in exactly one of the repository's thirteen workflow files: `.github/workflows/python-release.yml`. This was verified by a direct clone of the repository (HEAD `bbccb0513ff9afda385ca5c85c66eddb1318cfc7`) and inspection of every workflow file (`bitcannon.yml`, `build_documentation.yml`, `build_pr_documentation.yml`, `docs_backfill.yml`, `node-release.yml`, `node.yml`, `python.yml`, `python-release.yml`, `rust-release.yml`, `rust.yml`, `stale.yml`, `trufflehog.yml`, `upload_pr_documentation.yml`); no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist. In particular, `python.yml` - the workflow that fires on ordinary `push`/`pull_request` events, i.e. regular commit and PR CI - contains zero riscv references.

**`python-release.yml` riscv64 job details:**
- Trigger: `on: push: tags: - v*` plus `workflow_dispatch` only. **No `pull_request` trigger and no schedule.** riscv64 never builds on an ordinary PR or commit to `main`; it builds only on a release-tag push or manual dispatch.
- Runner: `ubuntu-24.04` (ordinary x86_64 GitHub-hosted runner, not native riscv64 hardware).
- Mechanism: `build-wheel` job passes `target: riscv64`, `manylinux: auto` to `PyO3/maturin-action`, which cross-builds the wheel inside a manylinux container; QEMU-based cross-compilation, if used, is handled internally by the action, with no explicit `docker/setup-qemu-action` step in this file.
- **Build only, not tested:** the downstream `test-wheel` job's matrix covers `ubuntu-latest`/x86_64, `ubuntu-24.04-arm`/aarch64, `macos-latest`/arm64, and `macos-15-intel` only. riscv64 is absent. The riscv64 wheel is built and uploaded as an artifact, and feeds the `publish` job (which needs `test-wheel` + `build-sdist` to complete, then downloads all `wheels-*` artifacts, riscv64 included) - so a riscv64 wheel can and does reach PyPI without ever being executed in CI.
- Last modified 2026-09-23, commit `bbccb05` ("Scope GITHUB_TOKEN permissions per job").

**Not riscv64 CI (ruled out):** `bindings/node/index.js` contains a `process.arch === 'riscv64'` branch that attempts to `require()` `tokenizers.linux-riscv64-{gnu,musl}.node`, and `bindings/node/yarn.lock` lists an optional `@napi-rs/lzma-linux-riscv64-gnu` transitive dependency - but neither `node.yml` nor `node-release.yml` build a riscv64 target in their matrices. This is dead/unused scaffolding inherited from the napi-rs project template, not an active Node build path.

**RISE runners:** no evidence was found that huggingface/tokenizers uses RISE CI runners. The RISE "Six Weeks In" runners post (2026-05-12) lists 197 repos across 87 orgs using the infrastructure; tokenizers is not cited among them. (RISE's own `python-wheels` builder, which produced the now-deprecated riscv64 wheels for tokenizers 0.20.3-0.22.2, does run on RISE runner hardware, but that is a separate repository from huggingface/tokenizers.)

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | Yes | Yes | Yes (cross-compile, tag-push/dispatch only) |
| CI tests | Yes | Yes | No |
| Native hardware in CI | Yes | Yes (`ubuntu-24.04-arm`) | No |
| Wheel published to PyPI on tag | Yes | Yes | Yes, via `python-release.yml`'s `publish` job |
| Runs on every PR | Yes (`python.yml`) | Yes (`python.yml`) | No - `python-release.yml` only fires on tags/manual dispatch |

## 8. Distribution and Release Status

**Official PyPI:** confirmed via raw PyPI JSON API. `tokenizers-0.23.2-cp310-abi3-manylinux_2_31_riscv64.whl` (3,577,314 bytes, uploaded 2026-09-03) ships alongside 16 other platform wheels in the current release. Scanning the full `releases{}` map (103 versions) found riscv64 wheels present starting with `0.23.0rc0` (2026-04-24) through `1.0.0rc2` (2026-09-21) - six releases total carry a riscv64 wheel, consistent with PR #1951 merging 2026-03-26 and the first riscv64 wheel landing roughly one month later in the next release. The first stable (non-rc) riscv64 wheel is `v0.23.1` (2026-04-27, `manylinux_2_31_riscv64.whl`, 3,426,398 bytes). This is a stable-ABI (abi3) wheel covering CPython 3.10+.

**Community RISE wheel index:** [gitlab.com RISE PyPI index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tokenizers/) carries riscv64 wheels for versions 0.20.3 through 0.22.2 under `manylinux_2_34_riscv64` and `manylinux_2_35_riscv64` tags. The [RISE wheel_builder tokenizers page](https://riseproject.gitlab.io/python/wheel_builder/packages/tokenizers.html) is explicitly marked deprecated, directing users to official PyPI. A separate community index, [gounthar/riscv64-python-wheels](https://github.com/gounthar/riscv64-python-wheels/releases/tag/v2026.09.20-cp313), continues to host tokenizers among 50+ riscv64 Python packages as a stopgap/legacy channel.

**Linux distribution packages:**
- Ubuntu 26.04 "resolute": no `tokenizers`, `python3-tokenizers`, or `libtokenizers` package exists (directly confirmed via a 404 on `packages.ubuntu.com/resolute/python3-tokenizers`). The only package matching the name "tokenizers" in Ubuntu is `r-cran-tokenizers`, an unrelated R/CRAN text-tokenization package (version 0.3.0-2), which does separately support riscv64 on resolute alongside amd64/arm64/ppc64el.
- Debian: `tokenizers`/`rust-tokenizers` source packages previously showed "No entry in riscv64 database" on buildd.debian.org [carried forward from prior research, not independently reconfirmed this pass - NEEDS VERIFICATION].
- Arch Linux: no `python-tokenizers` package exists in official Arch repositories.

**npm / Node:** no riscv64 npm binary package is built or published - `node.yml`/`node-release.yml` exclude riscv64 from their matrices despite `index.js` containing dead scaffolding that assumes one exists.

**What a user must do to install tokenizers on riscv64** (manylinux-compatible system, glibc >= 2.31, e.g. Ubuntu 22.04+ or Fedora 36+):
```
pip install tokenizers
```
This fetches the official `manylinux_2_31_riscv64` wheel directly from PyPI with no extra index configuration needed. On a musl-based system or a system with glibc < 2.31, a from-source build is required (`pip install tokenizers --no-binary tokenizers`), needing a Rust toolchain with the `riscv64gc-unknown-linux-gnu` target installed; expect roughly 20 minutes on an 8-core, 1.6 GHz riscv64 system per the measurement in issue #1961.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| maturin | Build-dependency, critical (Python/Rust wheel builder) | OK since the (unconfirmed) v1.9.3 fix for riscv64gc triple handling [NEEDS VERIFICATION on exact version/date] | Not CI-tested | Maturin itself ships a `riscv64gc-unknown-linux-musl` binary in v1.14.1 | Was the root cause of issue #1816 (triple mismatch); also implicated in [PyO3/maturin#3034](https://github.com/PyO3/maturin/issues/3034), a closed riscv64 free-threaded-Python abi3 mis-tagging bug |
| pyo3 | Runtime-dependency, critical (Python-Rust FFI) | OK - pure Rust | No riscv64 CI | N/A (library) | No riscv64 issues found |
| rayon | Runtime-dependency, critical (data-parallel iterators) | OK - pure Rust, no SIMD | No riscv64 CI | N/A (library) | No riscv64 issues found |
| ahash | Runtime-dependency, optional (hash-map backend) | OK, software fallback (no AES-NI/AES on riscv64) | No riscv64 CI | N/A (library) | No riscv64-specific issues; only unrelated s390x test-failure issues found ([aHash #152](https://github.com/tkaitchuck/aHash/issues/152), [#191](https://github.com/tkaitchuck/aHash/issues/191)) |
| oniguruma | Runtime-dependency, optional (default-on C regex engine) | Expected OK via Autoconf cross-compile; not independently verified | No riscv64 CI | N/A (library) | No riscv64 issues found in kkos/oniguruma |
| fancy-regex | Runtime-dependency, critical (look-around/backreference regex) | OK - pure Rust | No riscv64 CI | N/A (library) | No riscv64 issues found |
| esaxx-rs | Runtime-dependency, optional (Unigram suffix array; C++ binding with pure-Rust `suffix_rs` fallback) | Expected OK via `cc`-crate cross-compile; not independently confirmed | No riscv64 CI | N/A (library) | No riscv64 issues found; pure-Rust fallback reported roughly 2x slower than the C++ path [NEEDS VERIFICATION] |
| daachorse | Runtime-dependency, critical (double-array Aho-Corasick) | OK - pure Rust, `no_std`-compatible | No riscv64 CI | N/A (library) | No riscv64 issues found |
| unicode-normalization-alignments | Runtime-dependency, critical (NFC/NFD with alignment) | OK - pure Rust | No riscv64 CI | N/A (library) | No riscv64 issues found |
| spm_precompiled | Runtime-dependency, optional (SentencePiece protobuf loader) | OK - pure Rust | No riscv64 CI | N/A (library) | No riscv64 issues found |
| tokio | Runtime-dependency, optional (async runtime for Python async bindings) | OK - pure Rust | No riscv64 CI | N/A (library) | No riscv64 issues found |
| mimalloc (indirect, proposed) | Proposed global allocator via unmerged [PR #2073](https://github.com/huggingface/tokenizers/pull/2073) | **Excluded for riscv64** inside tokenizers, despite upstream mimalloc itself having full riscv64 support (SV39/48/57, TLS, Zihintpause/Zacas) merged by v3.5.0 (2026-08-18) | N/A - not integrated for riscv64 | Not shipped for riscv64 in tokenizers wheels | Blocked by the manylinux2014/GCC-4.8.5 cross-toolchain's lack of C11 atomics; no `manylinux_2_28` riscv64 cross image exists yet to unblock it |

**ahash (depth-2):** dispatches to AES-NI on x86_64 and AES on aarch64; on riscv64 neither `target_feature = "aes"` check passes, so the software "aHash Fallback" path runs. Functionally correct, measurably slower for hash-intensive workloads. Zkn/Zkne extensions could in principle provide scalar AES instructions on riscv64, but no evidence was found that ahash's riscv64 path currently dispatches to them [NEEDS VERIFICATION].

**esaxx-rs (depth-2):** the default-on `esaxx_fast` feature compiles a C++ suffix-array library via the `cc` crate; a pure-Rust fallback (`suffix_rs`) is available via `--no-default-features`. The C++ path is expected to cross-compile normally for riscv64 through the same maturin-action toolchain used for the rest of the wheel; no riscv64-specific build issue was found for this dependency.

**maturin (depth-2):** v1.14.1 ships a `maturin-riscv64gc-unknown-linux-musl.tar.gz` release asset. The specific fix date/version for riscv64 triple handling (cited elsewhere as v1.9.3, 2025-07-28) could not be independently confirmed against maturin's own release notes in this research pass and should be treated as unverified.

## 11. Known Bugs and Active Issues

**riscv64-specific:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1816](https://github.com/huggingface/tokenizers/issues/1816) | tokenizers cannot be compiled successfully on riscv machine | Closed, completed (2025-07-07) | Was critical (build failure) | Root cause: maturin/rustup target-triple mismatch; resolved by rustup's own riscv64gc tier-2 support plus PR #1951 |
| [#1961](https://github.com/huggingface/tokenizers/issues/1961) | Add riscv64 (linux_riscv64) wheel to PyPI releases | Closed, completed (2026-03-26) | Was high (distribution gap) | Resolved by merge of PR #1951 |
| [PR #2073](https://github.com/huggingface/tokenizers/pull/2073) | bindings & bench: use mimalloc as global allocator on tested targets | Closed, not merged (2026-09-18) per git history; readiness-grade source describes it as still open as of its research date (see Section 2 discrepancy note) | Medium (performance gap, not release-blocking) | riscv64 cannot use mimalloc due to the manylinux2014/GCC-4.8.5 cross-toolchain; system allocator remains in use |

**No open correctness bugs exist for riscv64.** A dedicated search for open riscv64 issues (`is:open riscv repo:huggingface/tokenizers`) returns zero results, and a separate search for NaN/floating-point riscv64 issues also returns zero.

**General open performance issues (affect all architectures, including riscv64, not riscv64-specific):**

| ID | Title |
|---|---|
| [#1929](https://github.com/huggingface/tokenizers/issues/1929) | encode_batch has suboptimal parallelization on high-core systems |
| [#1900](https://github.com/huggingface/tokenizers/issues/1900) | batch_encode scales poorly on high-core server CPUs |
| [#1825](https://github.com/huggingface/tokenizers/issues/1825) | Proposal to replace regex in whitespace.rs with manual code for speed |
| [#1821](https://github.com/huggingface/tokenizers/issues/1821) | Proposal for faster Whitespace PreTokenizer (approximately 10-30% speedup) |
| [#1564](https://github.com/huggingface/tokenizers/issues/1564) | Decode regression (labeled: decoding, performance) |
| [#1519](https://github.com/huggingface/tokenizers/issues/1519) | Why is tokenizer slower than tiktoken? |

## 12. Objections and Upstream Blockers

**No stated objections.** The maintainer response to the riscv64-enabling PR was unambiguously positive ("LGTM happy to have coverage for riscv64!"), and no policy or technical barrier to riscv64 support exists at the project-governance level.

**Technical blockers - current:**
1. No riscv64 leg in the `test-wheel` CI job. This is a test-coverage gap, not a stated objection; the maintainer has not conditioned acceptance of the riscv64 build target on adding tests.
2. `manylinux_2_28` riscv64 cross-compilation image does not yet exist upstream (pypa/manylinux or rust-cross), which blocks enabling mimalloc for riscv64 even if PR #2073 (or a successor) were merged. This is an ecosystem-level gap outside tokenizers' own control.
3. No riscv64 kernel exists in the `bitcannon` SIMD crate (Section 4) - unlike the test-coverage and mimalloc gaps, closing this would require a net-new engineering contribution (an RVV or RISC-V bit-manipulation kernel), not just unblocking an existing proposal.

**Acceptance probability for future riscv64 contributions:** high. PR #1951 was merged within five weeks of being opened (including a delay caused by an unrelated CI breakage, not by riscv64-specific concerns), with explicit maintainer enthusiasm and no requested conditions.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** upstream
- Optimization-purpose project: no. tokenizers is a tokenization-correctness library (pure scalar Rust core, with hand-tuned SIMD confined to the separate `bitcannon` crate), not a project whose primary value proposition is a performance differentiator, so no optimization-level rating applies here.
- **Justification:** Upstream CI (`.github/workflows/python-release.yml`, merged via [PR #1951](https://github.com/huggingface/tokenizers/pull/1951) on 2026-03-26) cross-compiles a riscv64 wheel and publishes it to PyPI directly (official `manylinux_2_31_riscv64` wheels confirmed via the [PyPI JSON API](https://pypi.org/pypi/tokenizers/0.23.2/json) since v0.23.1), but the `test-wheel` job's matrix excludes riscv64 entirely, so the test suite never runs on riscv64 in CI. Per the color model's CI evidence rule, build-only CI (build yes, test no) caps the grade at yellow regardless of release availability. tokenizers is a tokenization-correctness library, not a performance-differentiator project (pure scalar Rust, no SIMD/JIT at the core-crate level), so the Step 2 optimization modifier does not apply.
- **Pending work that could change the grade:** no open PR adds a riscv64 test step (e.g. via QEMU) to CI, which is the path to blue or green. The closed, unmerged [PR #2073](https://github.com/huggingface/tokenizers/pull/2073) explicitly excludes riscv64 from the new mimalloc global-allocator feature because of the old manylinux2014 GCC (4.8.5) cross toolchain blocking C11 atomics - a performance-only gap, not release-blocking, and therefore not grade-relevant on its own. The RISE Project (via contributor threexc/BayLibre) authored the merged riscv64-enabling PR #1951; RISE's own wheel-builder index for tokenizers is now deprecated in favor of the official PyPI wheels, meaning RISE's direct involvement in this specific package is effectively complete.

## 14. Investment Analysis

RISE has already delivered the primary enablement work: PR #1951 (merged, BayLibre/threexc) added riscv64 to CI and produced a GA wheel on PyPI as of v0.23.1. The community wheel index that bridged the gap before that merge is now deprecated. No duplication of this already-completed work is warranted.

### 14.1 Functional Enablement

No functional gaps exist. All tokenizer algorithms work correctly on riscv64 via the project's own scalar test-oracle path. The ABI3 wheel covers CPython 3.10+. No further functional work is required.

### 14.2 Performance Optimization

Two concrete, scoped gaps remain:

**bitcannon SIMD kernel:** riscv64 has zero lines of accelerated code in the `bitcannon` crate for Unicode classification, bitstream block building, or literal/token scanning - every riscv64 build runs the generic scalar path that aarch64 (NEON) and x86_64 (AVX-512/SSE) bypass. Closing this gap means writing a net-new RVV (or scalar bit-manipulation, Zbb/Zbs) kernel and adding a fourth `#[cfg(target_arch = "riscv64")]` branch to the dispatcher in `classify/mod.rs` and `fast_builder()`/`build_block()` in `lib.rs`. No existing quantification of the resulting slowdown on riscv64 hardware was found in any source consulted.

**mimalloc allocator:** blocked by the absence of a `manylinux_2_28_riscv64` cross-compilation image. Resolution requires contributing such an image to [pypa/manylinux](https://github.com/pypa/manylinux) or [rust-cross/manylinux-cross](https://github.com/rust-cross/manylinux-cross); once that exists, enabling mimalloc for riscv64 in a successor to PR #2073 is a small `cfg` change. Expected gain, extrapolated from the non-riscv64 numbers reported in PR #2073 (35-56% single-thread, 9.3-97% multi-thread depending on core count): plausible but unquantified for riscv64 specifically.

**ahash AES acceleration:** implementing riscv64 Zkn/Zkne dispatch in the `ahash` crate would close the hashing-performance gap, but this is a contribution to a third-party dependency, not to tokenizers itself, and its end-to-end impact on tokenization throughput is unmeasured.

### 14.3 CI/CD Infrastructure

**Test gap:** riscv64 wheels are built but never executed in CI. Adding a QEMU-based (or RISE-hardware-based) test step to the `test-wheel` matrix in `python-release.yml` would directly move the grade off yellow by closing the specific gap the color-coding justification cites.

**musllinux gap:** if confirmed (Section 8, NEEDS VERIFICATION), closing it requires a `musllinux_1_2_riscv64` cross-compilation image or native musl hardware - infrastructure work upstream of tokenizers.

### 14.4 Ecosystem Enablement

See Section 10. The official PyPI wheel means no per-consumer patching of tokenizers itself is needed; downstream enablement work belongs to the consuming projects (transformers, sentence-transformers, ExecuTorch's `pytorch-tokenizers`, vLLM, etc.) individually, not to tokenizers.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add a riscv64 leg (QEMU or native) to the `test-wheel` matrix in `python-release.yml` | 0.5-1 | RISE or Qualcomm | High - this is the specific, named path to a higher grade |
| Performance | Contribute a `manylinux_2_28-cross:riscv64` image to pypa/manylinux or rust-cross | 2-4 | RISE / Canonical | Medium |
| Performance | Enable mimalloc for riscv64 in a successor to PR #2073 (small change, unblocked by the image above) | 0.5 | RISE or Qualcomm | Medium |
| Performance | Write an RVV (or Zbb/Zbs scalar) kernel for the `bitcannon` crate's riscv64 path | 3-6 | RISE / Rivos / SiFive | Low - no quantified end-user impact yet |
| Performance | Implement Zkn/Zkne AES dispatch in the `ahash` crate for riscv64 | 2-3 | RISE / Rivos | Low |
| Distribution | musllinux riscv64 wheel (pending confirmation the gap is real; requires a musl cross image) | 2-3 | RISE / Canonical | Low |

## 15. References

- [Issue #1816: tokenizers cannot be compiled successfully on riscv machine](https://github.com/huggingface/tokenizers/issues/1816)
- [Issue #1961: Add riscv64 (linux_riscv64) wheel to PyPI releases](https://github.com/huggingface/tokenizers/issues/1961)
- [PR #1951: Add riscv64 build, make Linux wheel build matrix more explicit](https://github.com/huggingface/tokenizers/pull/1951)
- [PR #1963: ci: add riscv64 target to linux wheel build matrix](https://github.com/huggingface/tokenizers/pull/1963)
- [PR #2073: bindings & bench: use mimalloc as global allocator on tested targets](https://github.com/huggingface/tokenizers/pull/2073)
- [PR #1978: CI infrastructure fix that unblocked PR #1951](https://github.com/huggingface/tokenizers/pull/1978)
- [tokenizers PyPI page](https://pypi.org/project/tokenizers/)
- [tokenizers 0.23.2 PyPI JSON API](https://pypi.org/pypi/tokenizers/0.23.2/json)
- [RISE wheel_builder tokenizers page (deprecated)](https://riseproject.gitlab.io/python/wheel_builder/packages/tokenizers.html)
- [RISE wheel_builder GitLab PyPI index for tokenizers](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tokenizers/)
- [riseproject-dev/python-wheels repository](https://github.com/riseproject-dev/python-wheels)
- [Community riscv64 wheel index (gounthar)](https://github.com/gounthar/riscv64-python-wheels/releases/tag/v2026.09.20-cp313)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project members](https://riseproject.dev/members)
- [RISE blog: Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE blog: Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE blog: RISE RISC-V Runners, six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE blog: Python Now Officially Supports RISC-V](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [First Words: LLM Inference on RISC-V (dev.to/gounthar)](https://dev.to/gounthar/first-words-llm-inference-on-risc-v-3lo5)
- [tokenizers documentation homepage](https://huggingface.co/docs/tokenizers)
- [tokenizers GitHub repository](https://github.com/huggingface/tokenizers)
- [PyO3/maturin issue #3034: riscv64 free-threaded-Python abi3 mis-tagging](https://github.com/PyO3/maturin/issues/3034)
- [aHash issue #152: s390x test failure](https://github.com/tkaitchuck/aHash/issues/152)
- [aHash issue #191: s390x test failure](https://github.com/tkaitchuck/aHash/issues/191)
- [microsoft/mimalloc issue #939: SV39 alignment (closed, fixed)](https://github.com/microsoft/mimalloc/issues/939)