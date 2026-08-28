---
title: tokenizers
parent: Project Reports
categories:
  - ai-ml
  - python-packages
---

# tokenizers

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for tokenizers
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

[tokenizers](https://huggingface.co/docs/tokenizers) is a Rust library implementing high-performance tokenizers for large language models. It provides implementations of BPE (Byte-Pair Encoding), Unigram, WordPiece, and WordLevel algorithms, along with pre-tokenizers, normalizers, and post-processors. The Python bindings are the primary consumer interface; Node.js bindings also exist. The library is used throughout the Hugging Face ecosystem as the tokenization layer for transformers inference.

**Governance:** tokenizers is wholly owned and controlled by Hugging Face (the company). There is no external foundation, steering committee, or community governance body. No CODEOWNERS, MAINTAINERS, or OWNERS file exists in the repository. License: Apache 2.0.

**Active maintainers (from 2026 commit history):**
- ArthurZucker (Arthur Zucker, Hugging Face) -- de facto lead, merges most PRs, drives releases
- SBrandeis (Simon Brandeis, Hugging Face) -- CI, benchmarks, PyO3 upgrades
- McPatate (Hugging Face) -- CI and tokenizer feature work
- sebpop -- allocator and benchmark work (affiliation not confirmed from available data)

**Hugging Face is not a RISE Project member.** RISE Premier members are: Andes Technology, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, DAMO Academy (Alibaba), Tenstorrent. General members include SpacemiT, ByteDance, Canonical, and others. Hugging Face is absent from both tiers.

**Culture on new ports:** Maintainer ArthurZucker responded to the riscv64 PR with "LGTM happy to have coverage for riscv64!" with no objections or conditions. Secondary architectures (ppc64le, s390x, armv7l, aarch64) are all treated as first-class PyPI targets. The project has no gatekeeping policy for new architectures.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| Jul 2, 2025 | [Issue #1816](https://github.com/huggingface/tokenizers/issues/1816) opened: source build fails on RISC-V Ubuntu Jammy; maturin 1.9.0 computes `riscv64-unknown-linux-gnu` but rustup does not recognise that triple (correct triple is `riscv64gc-unknown-linux-gnu`) | GitHub issue |
| Jul 7, 2025 | Issue #1816 closed with no fix and no linked PR; implicit resolution via later ecosystem improvements | GitHub issue |
| ~Jul 28, 2025 | maturin 1.9.3 merged upstream fix for riscv64 manylinux support, correcting the target triple handling | [NEEDS VERIFICATION] -- cited in dependency findings, maturin release not directly confirmed by the research |
| Mar 11, 2026 | [Issue #1961](https://github.com/huggingface/tokenizers/issues/1961) opened by gounthar (RISE-affiliated, CloudBees): requests `manylinux_2_34_riscv64` wheel on PyPI; demonstrates working wheel on BananaPi F3 (SpacemiT K1), ~20 min build from source | GitHub issue |
| Feb 19, 2026 | [PR #1951](https://github.com/huggingface/tokenizers/pull/1951) opened by threexc (BayLibre / RISE Project): adds `riscv64gc-unknown-linux-gnu` cross-compilation to the python-release CI matrix | GitHub PR |
| Mar 12, 2026 | [PR #1963](https://github.com/huggingface/tokenizers/pull/1963) opened by gounthar as a parallel attempt; targets `python-release.yml` with maturin-action cross-compile | GitHub PR |
| Mar 19, 2026 | PR #1963 closed by the author in favour of PR #1951 (which had been opened first) | GitHub PR |
| Mar 25, 2026 | CI breakage fixed by PR #1978, unblocking PR #1951; threexc rebases | GitHub PR |
| Mar 26, 2026 | [PR #1951](https://github.com/huggingface/tokenizers/pull/1951) merged into main by ArthurZucker (merge commit `44a8416`); adds `riscv64gc-unknown-linux-gnu` to `CI.yml`; Issue #1961 closed same day | GitHub PR |
| Apr 27, 2026 | `tokenizers-0.23.1-cp310-abi3-manylinux_2_31_riscv64.whl` (3,426,398 bytes) uploaded to official PyPI; first GA riscv64 wheel in the official release channel | PyPI JSON API |
| May 26, 2026 | [PR #2073](https://github.com/huggingface/tokenizers/pull/2073) opened by sebpop: adds mimalloc as global allocator for throughput gains; riscv64 explicitly excluded due to cross-toolchain GCC age | GitHub PR, open |

**Key contributors:**
- treexc (Trevor Gamblin, BayLibre): submitted PR #1951 explicitly on behalf of the RISE Project; parallel PRs also submitted to `hf_transfer` (#77) and `safetensors` (#708)
- gounthar (CloudBees, personal RISC-V contributor): filed issue #1961, opened and closed PR #1963

**Upstreaming status:** Complete. The riscv64 CI entry is in the main branch. PyPI ships the riscv64 wheel as of v0.23.1. No out-of-tree patches required.

The RISE wheel_builder project (gitlab.com/riseproject/python/wheel_builder) previously distributed riscv64 wheels for tokenizers 0.20.3 through 0.22.2 ahead of upstream. That project's tokenizers page is now marked deprecated with the note "PyPI now publishes newer versions of this package for riscv64." The community index at gounthar.github.io continues to host 0.22.2 and 0.22.3.dev0 for backward compatibility.

---

## 3. Upstream Support Tier

tokenizers has no formal tier policy document. There is no PLATFORMS.md, SUPPORT.md, or tiering taxonomy. Secondary architectures are treated uniformly: they are included in the `CI.yml` matrix and their wheels are published to PyPI via the `CI.yml` release job on tag push.

The CI.yml is autogenerated by `maturin generate-ci github` (header comments reference maturin v1.7.4). All architectures in the linux matrix share identical build steps. There is no differentiated handling or tier designation for riscv64 vs aarch64 vs ppc64le vs s390x.

| Capability | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI builds | Yes | Yes | Yes (since PR #1951, Mar 26, 2026) |
| CI tests | Yes | Yes | No |
| Official PyPI wheel | Yes | Yes | Yes (since v0.23.1, Apr 27, 2026) |
| musllinux wheel | Yes | Yes | No |
| Release-blocking | Yes | Yes | Unknown -- no evidence either way |
| Native CI runner | Yes | Yes | No (cross-compile on ubuntu-latest) |

The absence of riscv64 tests in CI means a correctness regression on riscv64 would not block a release. No evidence was found that a broken riscv64 wheel would prevent a tag from being pushed. This is weaker than the treatment of x86_64 and aarch64 but consistent with how s390x and ppc64le are handled.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

tokenizers is implemented in pure Rust with no architecture-specific source code, hand-tuned SIMD intrinsics, assembly, JIT compilation, or cryptographic hardware acceleration anywhere in the core library.

The following modules were audited and confirmed to contain no `#[cfg(target_arch)]` or `#[cfg(target_feature)]` guards:

- `src/models/bpe/model.rs`, `word.rs`, `trainer.rs`
- `src/models/unigram/lattice.rs`
- `src/normalizers/bert.rs`, `unicode.rs`, `precompiled.rs`
- `src/pre_tokenizers/byte_level.rs`
- `src/utils/parallelism.rs`
- `bindings/python/Cargo.toml`

There is no `build.rs` at the `tokenizers/` crate level, so no C/C++ compilation occurs in the core library. Parallelism is handled via the Rayon crate (CPU-agnostic work-stealing thread pool).

The one pending architecture-conditional block is in open PR #2073 (mimalloc global allocator), which adds mimalloc only for `linux/x86_64/gnu`, `linux/aarch64/gnu`, and `macOS/aarch64`. riscv64 is excluded because the manylinux cross-toolchain ships GCC 4.8.5, which predates both `-Wdate-time` (GCC 4.9) and C11 atomics (`<stdatomic.h>`, also GCC 4.9). This PR is unmerged as of June 2026.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| BPE tokenization | scalar Rust | scalar Rust | scalar Rust |
| Unigram (suffix array, Viterbi) | scalar Rust | scalar Rust | scalar Rust |
| Unicode normalisation | scalar Rust | scalar Rust | scalar Rust |
| Aho-Corasick pattern matching | scalar Rust | scalar Rust | scalar Rust |
| Hash maps (ahash) | AES-NI hardware | AES hardware | software fallback |
| Parallelism (Rayon) | full | full | full |
| Memory allocator (pending PR #2073) | mimalloc (pending) | mimalloc (pending) | system allocator |
| JIT / code generation | none | none | none |
| SIMD tokenization kernels | none | none | none |
| Cryptographic acceleration | none | none | none |

**ahash software fallback:** The `ahash` crate uses AES-NI on x86_64 and AES on aarch64 for fast hashing. On riscv64 it falls back to a software "aHash Fallback" path. This is functionally correct. The performance delta is approximately 2-3x slower hash throughput [NEEDS VERIFICATION -- no riscv64-specific ahash benchmark was found in the research]. This affects hash map operations internally but has not been cited as a bottleneck in any reported benchmark.

**ISA extensions:** No RVV (RISC-V Vector), no Zba, Zbb, Zbc, Zbs extensions are used or referenced. The build target is `riscv64gc-unknown-linux-gnu` (G = IMAFD baseline, C = compressed instructions), which is the generic riscv64 tier-2 Rust target.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Cargo (Rust core) + maturin (Python wheel packaging). No CMake, no Autoconf, no Makefile at top level. No Dockerfile in the repository.

**Exact build command used in CI (`.github/workflows/CI.yml`):**

```
maturin build --release \
  --target riscv64gc-unknown-linux-gnu \
  --manifest-path bindings/python/Cargo.toml \
  --out dist
```

This is invoked via the `PyO3/maturin-action` GitHub Action with `manylinux: auto`. The action selects a cross-compilation Docker container -- `ghcr.io/rust-cross/manylinux_2_31-cross:riscv64` -- which cross-compiles from an x86_64 host to riscv64 using `cargo-zigbuild` bundled inside the container. No QEMU is involved for the build step.

**Toolchain requirements:**
- Rust toolchain: `stable` (no pinned version; `bindings/python/rust-toolchain` contains only the string `stable`)
- maturin: `>=1.0,<2.0` (from `pyproject.toml`)
- maturin used to generate CI.yml: v1.7.4; latest available: v1.14.1
- No minimum GCC/Clang version is specified in the repository; the cross-container supplies its own compiler

**manylinux baseline:** `manylinux: auto` resolves to `manylinux_2_31` for riscv64 (as evidenced by the wheel tag `manylinux_2_31_riscv64` on PyPI 0.23.1). This requires glibc >= 2.31 on the target system. The PR and community index used `manylinux_2_34`; the production wheel uses `manylinux_2_31`. No explanation for this discrepancy was found in the research.

**Known past build failures:**
- Issue #1816 (Jul 2025): maturin 1.9.0 computed target triple as `riscv64-unknown-linux-gnu`; rustup does not recognise this (correct: `riscv64gc-unknown-linux-gnu`). The build aborted before any Rust compilation. Fixed by PR #1951 which separates the `arch` and `target` matrix fields.
- PR #2073: the manylinux2014 cross-toolchain for riscv64 ships GCC 4.8.5, which rejects `-Werror=date-time` (introduced in GCC 4.9) and lacks `<stdatomic.h>`. This blocks mimalloc from compiling on riscv64. Unlike x86_64 and aarch64 (which can upgrade to `manylinux_2_28`), riscv64 has no `manylinux_2_28` cross image available. This is a structural constraint, not a configuration error.

**Manual build from source (no wheel):** On a native riscv64 system running Ubuntu Jammy with Python 3.13, building from source takes approximately 20 minutes on a BananaPi F3 (SpacemiT K1, 8 cores at 1.6 GHz). This was measured and reported in issue #1961.

**No musl/Alpine build:** No musllinux riscv64 wheel exists. The musllinux matrix in CI.yml covers x86_64, x86, aarch64, and armv7 only. riscv64 on Alpine Linux or any musl-based distribution requires building from source.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

tokenizers has no functional gaps on riscv64. All tokenizer algorithms (BPE, Unigram, WordPiece, WordLevel), all normalizers, all pre-tokenizers, and all Python binding APIs are identical across architectures because the implementation is uniformly scalar Rust with no arch-specific code paths.

**Functional gaps:** None.

**Performance gaps:**

| Gap | Impact | Root cause | Fixable? |
|-----|--------|-----------|---------|
| No mimalloc allocator (PR #2073 excludes riscv64) | +35-83% throughput on `encode_batch` unavailable; riscv64 uses system allocator | manylinux_2_28 cross image for riscv64 does not exist; manylinux2014 GCC too old for mimalloc C11 atomics | Yes, if a newer manylinux riscv64 cross image is produced |
| ahash software fallback (no AES hardware) | ~2-3x slower hash map operations internally [NEEDS VERIFICATION] | riscv64 has no AES scalar instruction; ahash's software path is used | Partly -- Zkn or Zkne extensions would enable AES, but ahash does not check for these |

**Encode_batch throughput reference (not riscv64, for context only):** On aarch64 NVIDIA Vera (88 cores) single-thread BPE GPT2 encode: 3.96 MiB/s (system allocator, pre-PR #2073 baseline). On x86_64 AMD EPYC 9124 (16 cores) single-thread: 3.84 MiB/s. No riscv64 throughput measurement exists in the public record.

**Security hardening gaps:** None identified. The library does no cryptographic operations. The Rust memory safety model applies uniformly regardless of architecture.

**Floating-point / NaN semantics:** No NaN or floating-point issues were found in the issue tracker. tokenizers does not perform floating-point inference; probabilities in Unigram model are handled in scalar Rust f64 arithmetic with no platform-specific paths.

---

## 7. CI/CD Infrastructure

riscv64 CI exists only in `.github/workflows/CI.yml`. All other workflow files -- `node.yml`, `node-release.yml`, `python.yml`, `python-release.yml`, `rust.yml`, `rust-release.yml` -- contain zero occurrences of the string "riscv". This was confirmed by direct file inspection.

**CI.yml riscv64 job details:**

```yaml
- runner: ubuntu-latest
  arch: riscv64
  target: riscv64gc-unknown-linux-gnu
```

- Host: `ubuntu-latest` (x86_64 GitHub-hosted runner)
- Cross-compilation via `PyO3/maturin-action` with `manylinux: auto`
- Container: `ghcr.io/rust-cross/manylinux_2_31-cross:riscv64`
- Produces artifact: `wheels-linux-riscv64`
- No QEMU setup step; no test step

**Triggers:** push to `main`/`master`, push of any tag, pull_request (all PRs), `workflow_dispatch`.

**PyPI publication from CI.yml:** The `release` job in `CI.yml` runs on tag push, collects `wheels-*/*` (which includes `wheels-linux-riscv64`), and publishes all collected wheels to PyPI via `maturin upload`. This is how the riscv64 wheel reaches PyPI -- through `CI.yml`, not `python-release.yml`.

**RISE runners:** No evidence was found of RISE CI runners being used in the huggingface/tokenizers repository. The RISE runners blog post (May 2026, "Six Weeks In") lists 197 repos across 87 orgs using RISE runners; tokenizers is not cited.

| Capability | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI build | Yes | Yes | Yes (cross-compile) |
| CI tests | Yes | Yes | No |
| Native hardware in CI | Yes | Yes (native runners) | No |
| Wheel published to PyPI on tag | Yes | Yes | Yes (via CI.yml release job) |
| Release-blocking if CI fails | Yes | Yes | Unknown |

---

## 8. Distribution and Release Status

**Official PyPI:** `tokenizers-0.23.1-cp310-abi3-manylinux_2_31_riscv64.whl` is available on PyPI as of April 27, 2026 (upload confirmed via PyPI JSON API, 3,426,398 bytes). This is a stable ABI3 wheel (CPython 3.10+). Versions 0.22.2 and earlier do not have riscv64 wheels on PyPI; the riscv64 wheel debut was 0.23.1.

No musllinux riscv64 wheel exists on PyPI. Users on musl-based riscv64 systems must build from source.

**Community RISE wheel index:** [gitlab.com RISE PyPI index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tokenizers/) provides wheels for 0.20.3 through 0.22.2 with `manylinux_2_34_riscv64` and `manylinux_2_35_riscv64` tags. The RISE wheel_builder page for tokenizers is marked deprecated, noting that PyPI now ships the package natively. A community index at gounthar.github.io/riscv64-python-wheels also carries tokenizers among 50+ riscv64 Python packages.

**GitHub Releases:** GitHub release assets for all versions show only "Assets 2" (source tarball and zipball). No binary wheels are distributed via GitHub Releases; PyPI is the sole binary distribution channel.

**Linux distribution packages:**
- Ubuntu 24.04 (Noble): No `python3-tokenizers` package. The only match for "tokenizers" in Ubuntu is `r-cran-tokenizers` (GNU R text tokenizer, unrelated).
- Debian sid: tokenizers and rust-tokenizers source packages exist but show "No entry in riscv64 database" on buildd.debian.org. Not built for any architecture in Debian.
- Arch Linux: No `python-tokenizers` package exists in official Arch repositories; consequently nothing to port to the Arch RISC-V overlay.

**What a user must do to install tokenizers on riscv64:**

For manylinux-compatible systems (glibc >= 2.31, e.g., Ubuntu 22.04+, Fedora 36+):

```
pip install tokenizers  # fetches manylinux_2_31_riscv64.whl from PyPI
```

For musl-based systems (Alpine) or systems with glibc < 2.31: build from source via `pip install tokenizers --no-binary tokenizers`, requiring a Rust toolchain with the `riscv64gc-unknown-linux-gnu` target installed. Build time approximately 20 minutes on a 1.6 GHz 8-core riscv64 system.

---

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 tests | riscv64 release | Notes |
|---|---|---|---|---|---|
| maturin | Python/Rust wheel builder | OK (v1.9.3+ fixed triple handling) | Not tested | riscv64 binary in v1.14.1 | Was root blocker for issue #1816; fixed |
| pyo3 | Python/Rust FFI bindings | No issues reported | No riscv64 CI | Not applicable (library) | Pure Rust |
| rayon | Data-parallel iterators | No issues reported | No riscv64 CI | Not applicable (library) | Pure Rust, no SIMD |
| ahash | Hash map backend | Builds (software fallback) | No riscv64 CI | Not applicable (library) | No AES on riscv64; software path used |
| onig / oniguruma | Regex engine (optional, default on) | No issues reported | No riscv64 CI | Not applicable (library) | Rust wrapper; Autoconf cross-compile path expected to work |
| fancy-regex | Regex with look-around/backreferences | No issues reported | No riscv64 CI | Not applicable (library) | Pure Rust, no SIMD |
| esaxx-rs | Suffix array (Unigram tokenizer) | No issues reported | No riscv64 CI | Not applicable (library) | C++ binding with pure-Rust fallback (`suffix_rs`); fallback is ~2x slower |
| daachorse | Double-array Aho-Corasick | No issues reported | No riscv64 CI | Not applicable (library) | Pure Rust, `no_std` compatible |
| unicode-normalization-alignments | Unicode NFC/NFD with alignment | No issues reported | No riscv64 CI | Not applicable (library) | Pure Rust |
| spm_precompiled | SentencePiece protobuf loader | No issues reported | No riscv64 CI | Not applicable (library) | Pure Rust |
| tokio | Async runtime (Python async bindings) | No issues reported | No riscv64 CI | Not applicable (library) | Pure Rust |

**ahash (depth-2 analysis):** ahash dispatches to AES-NI on x86_64 and AES on aarch64 for hash computation. On riscv64, neither `target_feature = "aes"` check passes, so the software "aHash Fallback" is used. This is functionally correct but measurably slower for hash-intensive workloads. The Zkn or Zkne extensions on RISC-V would provide AES scalar instructions, but ahash's riscv64 path does not check for these [NEEDS VERIFICATION -- no ahash riscv64 Zkn dispatch code was found in the research].

**esaxx-rs (depth-2 analysis):** The `esaxx_fast` feature (default on) compiles a C++ suffix array library via the `cc` crate. A pure-Rust fallback (`suffix_rs`) is available via `--no-default-features`. The C++ build via `cc` should cross-compile normally for riscv64; no issues were reported. The fallback is approximately 2x slower according to the crate documentation [NEEDS VERIFICATION -- relative performance figure cited from crate documentation, not from a riscv64-specific benchmark].

**maturin (depth-2 analysis):** maturin v1.14.1 ships a `maturin-riscv64gc-unknown-linux-musl.tar.gz` in its release assets. The fix for `riscv64gc-unknown-linux-gnu` triple recognition was merged in v1.9.3 (July 28, 2025) [NEEDS VERIFICATION -- version and date from research findings, not directly confirmed against maturin release notes]. This resolved issue #1816 and was a prerequisite for tokenizers riscv64 support.

---

## 11. Known Bugs and Active Issues

**riscv64-specific issues:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#1816](https://github.com/huggingface/tokenizers/issues/1816) | tokenizers cannot be compiled successfully on riscv machine | Closed (Jul 7, 2025) | Was Critical (build failure) | Root cause: maturin triple mismatch; resolved by PR #1951 and PyPI wheel |
| [#1961](https://github.com/huggingface/tokenizers/issues/1961) | Add riscv64 (linux_riscv64) wheel to PyPI releases | Closed (Mar 26, 2026) | Was High (distribution gap) | Resolved by merge of PR #1951 |
| [#2073](https://github.com/huggingface/tokenizers/pull/2073) | mimalloc as global allocator -- riscv64 excluded | Open (PR) | Medium (performance gap) | riscv64 cannot use mimalloc due to cross-toolchain GCC age; retains system allocator |

**No open correctness bugs exist for riscv64.** No NaN/floating-point issues, no ABI mismatches, no test failures on riscv64 were found in the issue tracker.

**General open performance issues (affect all architectures including riscv64):**

| ID | Title |
|----|-------|
| [#1929](https://github.com/huggingface/tokenizers/issues/1929) | encode_batch has suboptimal parallelization on high-core systems |
| [#1900](https://github.com/huggingface/tokenizers/issues/1900) | batch_encode scales poorly on high-core server CPUs |
| [#1825](https://github.com/huggingface/tokenizers/issues/1825) | Proposal to replace regex in whitespace.rs with manual code for speed |
| [#1821](https://github.com/huggingface/tokenizers/issues/1821) | Proposal for faster Whitespace PreTokenizer (~10-30% speedup) |
| [#1564](https://github.com/huggingface/tokenizers/issues/1564) | Decode regression (labeled: decoding, performance) |
| [#1519](https://github.com/huggingface/tokenizers/issues/1519) | Why is tokenizer slower than tiktoken? |

---

## 12. Objections and Upstream Blockers

**No stated objections.** The maintainer response to the riscv64 PR was unambiguously positive. No policy or technical barrier to riscv64 exists at the project level.

**Technical blockers -- current:**

1. No musllinux riscv64 wheel. The pypa `musllinux_1_2_riscv64` container would be needed. This is an infrastructure gap upstream of tokenizers, not a tokenizers-specific issue.

2. manylinux_2_28 riscv64 cross-compilation image does not exist (cited explicitly by PR #2073 author). This blocks mimalloc optimization on riscv64 until pypa or the rust-cross project ships a `manylinux_2_28-cross:riscv64` container. This is also upstream of tokenizers.

3. No riscv64 tests in CI. This is a gap in test coverage, not a stated objection. The maintainer has not requested tests as a condition of acceptance for the wheel target.

**Acceptance probability for future riscv64 contributions:** High. The precedent set by PR #1951 (warm reception, merge within 5 weeks including a CI-caused delay) and the explicit "happy to have coverage for riscv64" statement indicate no organizational resistance.

---

## 13. Investment Analysis

RISE has already delivered the primary enablement work: PR #1951 (merged, BayLibre/treexc) added riscv64 to CI and the result is a GA wheel on PyPI as of v0.23.1. The maturin triple fix was a prerequisite and is also resolved. The community wheel index (RISE wheel_builder) served as a bridge and is now deprecated. No duplication of this work is warranted.

### 13.1 Functional Enablement

No functional gaps exist. All tokenizer algorithms work on riscv64. The ABI3 wheel covers CPython 3.10+. No work required.

### 13.2 Performance Optimization

Two gaps remain:

**Mimalloc on riscv64:** The blocker is the absence of a `manylinux_2_28_riscv64` cross-compilation Docker image. Resolution requires contributing such an image to the [pypa/manylinux](https://github.com/pypa/manylinux) project or the [rust-cross/manylinux-cross](https://github.com/rust-cross/manylinux-cross) project. Once that image exists, enabling mimalloc in PR #2073 for riscv64 is a one-line change. Expected gain: +35-56% single-thread encode_batch throughput (extrapolating from aarch64/x86_64 measurements; no riscv64-specific number exists).

**ahash AES acceleration:** Implementing riscv64 Zkn/Zkne dispatch in the ahash crate would close the hashing performance gap. This is a contribution to a dependency (ahash), not to tokenizers directly. Impact on end-to-end tokenization throughput is unknown -- ahash is used in BPE and WordPiece hash maps but has not been identified as the dominant bottleneck.

### 13.3 CI/CD Infrastructure

**Test gap:** riscv64 wheels are built but never tested. Adding a QEMU-based test step to the riscv64 CI matrix would catch correctness regressions before release. This requires either QEMU user-mode emulation in the existing ubuntu-latest runner or RISE hardware runners. QEMU-based testing is used by other projects in similar configurations.

**Musllinux gap:** Requires a `musllinux_1_2_riscv64` cross-compilation image or native hardware with musl. This is infrastructure work upstream of tokenizers.

### 13.4 Ecosystem Enablement

tokenizers is a leaf-level library dependency of transformers and many HuggingFace downstream packages. The official PyPI wheel means no per-consumer patching is needed. No additional ecosystem enablement work is required at the tokenizers level. Downstream enablement (transformers, diffusers, etc.) depends on those projects separately.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Performance | Contribute `manylinux_2_28-cross:riscv64` image to pypa/manylinux or rust-cross | 2-4 | RISE / Canonical | High |
| Performance | Enable mimalloc in PR #2073 for riscv64 (one-line change, unblocked by image above) | 0.5 | RISE or Qualcomm | High |
| CI/CD | Add QEMU test step to riscv64 matrix in CI.yml | 0.5-1 | RISE or Qualcomm | Medium |
| Performance | Implement Zkn/Zkne dispatch in ahash crate for riscv64 | 2-3 | RISE / Rivos | Low |
| Distribution | Musllinux riscv64 wheel (requires musl cross image) | 2-3 | RISE / Canonical | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Issue #1816: tokenizers cannot be compiled successfully on riscv machine](https://github.com/huggingface/tokenizers/issues/1816)
- [Issue #1961: Add riscv64 (linux_riscv64) wheel to PyPI releases](https://github.com/huggingface/tokenizers/issues/1961)
- [PR #1951: Add riscv64 build, make Linux wheel build matrix more explicit](https://github.com/huggingface/tokenizers/pull/1951)
- [PR #1963: ci: add riscv64 target to linux wheel build matrix](https://github.com/huggingface/tokenizers/pull/1963)
- [PR #2073: bindings & bench: use mimalloc as global allocator on tested targets](https://github.com/huggingface/tokenizers/pull/2073)
- [tokenizers PyPI page](https://pypi.org/project/tokenizers/)
- [RISE wheel_builder tokenizers page (deprecated)](https://riseproject.gitlab.io/python/wheel_builder/packages/tokenizers.html)
- [RISE wheel_builder GitLab PyPI index for tokenizers](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tokenizers/)
- [Community riscv64 wheel index (gounthar)](https://gounthar.github.io/riscv64-python-wheels/simple/)
- [riscv64-python-wheels repository](https://github.com/gounthar/riscv64-python-wheels)
- [RISE Project homepage](https://riseproject.dev)
- [RISE blog: Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/blog)
- [tokenizers documentation homepage](https://huggingface.co/docs/tokenizers)
- [tokenizers GitHub repository](https://github.com/huggingface/tokenizers)