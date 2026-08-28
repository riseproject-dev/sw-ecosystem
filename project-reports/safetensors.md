---
title: safetensors
---

# safetensors

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for safetensors<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

safetensors is a Rust library (with PyO3 Python bindings) for serializing and deserializing tensors, developed and maintained by Hugging Face. The repository lives at [safetensors/safetensors](https://github.com/safetensors/safetensors) on GitHub (moved from `huggingface/safetensors`; the old path redirects to the same org). License: Apache-2.0.

There is no independent foundation behind the project. It uses GitHub's lightweight "Minimum Viable Governance" template (`MVG-0.1-beta`), not a Linux Foundation or OpenSSF-style charter. The homepage ([huggingface.co/docs/safetensors](https://huggingface.co/docs/safetensors)) does not describe any foundation membership; this is a Hugging Face-owned and operated project.

Governance (from `GOVERNANCE.md`): two roles exist, Maintainers (who approve new maintainers and determine consensus) and Contributors. Decisions are made by consensus among maintainers; appeals escalate to an issue, then to an "Organization Steering Committee" - this committee is not documented elsewhere in the repo and appears to be unused boilerplate from the GitHub governance template rather than an active body.

Maintainers listed in `MAINTAINERS.md`: Daniel de Kok (Hugging Face) and Luc Georges (Hugging Face). The most active recent committer is Luc Georges (GitHub handle McPatate), with Nathan Goldbaum also active; historically Nicolas Patry (Hugging Face) authored nearly all commits 2022-2025.

`CONTRIBUTING.md` states the project aims to stay "simple, minimal" and that maintainers are "conservative about adding new features" - but this guidance is aimed at format/feature scope, not platform/architecture ports. No formal contribution tiers or CNCF/OpenSSF-style maturity levels exist; no PLATFORMS.md or SUPPORT.md was found. In practice, the riscv64 CI addition was accepted quickly and without objection, consistent with how other niche architectures (ppc64le, s390x, and an outside-contributed arm64 Windows target in PR #678) were handled - the project appears receptive to low-risk, self-contained CI-matrix additions from outside contributors.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2026-01-09 | PR #692 opened ("io_uring read fast path," unrelated to riscv64, later closed) | [PR #692](https://github.com/safetensors/safetensors/pull/692) |
| 2026-02-19 | PR #708 opened by threexc (Trevor Gamblin, BayLibre, on behalf of the RISE Project): adds riscv64 to the wheel build matrix | [PR #708](https://github.com/safetensors/safetensors/pull/708) |
| 2026-03-11 | Issue #723 opened by gounthar (independent contributor), requesting a `linux_riscv64` PyPI wheel, backed by a wheel built natively on a BananaPi F3 (SpacemiT K1) board | [Issue #723](https://github.com/safetensors/safetensors/issues/723) |
| 2026-03-12 | PR #724 opened by gounthar, duplicating #708's fix | [PR #724](https://github.com/safetensors/safetensors/pull/724) |
| 2026-03-19 | gounthar closes PR #724 in favor of #708, "since that one was opened first," to avoid duplicate maintainer review | [PR #724](https://github.com/safetensors/safetensors/pull/724) |
| 2026-03-25 to 03-26 | CI-flakiness back-and-forth between threexc and maintainer McPatate (Luc Georges); traced to an unrelated GH Pages regression-test endpoint failure, not a riscv64 defect | [PR #708](https://github.com/safetensors/safetensors/pull/708) |
| 2026-03-26 | PR #708 merged by McPatate (commit `6e3411d8d45bf16886fbc559108c2134de5c4677`) | [Commit 6e3411d](https://github.com/safetensors/safetensors/commit/6e3411d8d45bf16886fbc559108c2134de5c4677) |
| 2026-04-13 | Issue #723 closed by McPatate: "I think we're good with this issue!" | [Issue #723](https://github.com/safetensors/safetensors/issues/723) |
| 2026-04-14 | v0.8.0-rc.0 released - first tagged release containing the riscv64 CI entry (verified: merge commit is ahead-by-0 relative to this tag) | Release comparison via `gh api` |
| 2026-06-01 | v0.8.0-rc.1 released, riscv64 wheel present | PyPI JSON API |
| 2026-06-09 | v0.8.0 (stable) released, riscv64 wheel present (`safetensors-0.8.0-cp310-abi3-manylinux_2_31_riscv64.whl`) | [PyPI JSON](https://pypi.org/pypi/safetensors/json) |
| 2026-06-23 | RISE tracking issue [riseproject-dev/python-wheels#25](https://github.com/riseproject-dev/python-wheels/issues/25) closed, resolved by linking to the merged upstream PR #708 | RISE python-wheels repo |

**Key contributors:**
- Trevor Gamblin (GitHub: `threexc`), BayLibre, explicitly acting "on behalf of the RISE Project" per the PR #708 body - authored the merged fix.
- gounthar, independent contributor and maintainer of a community riscv64 wheel index (`gounthar.github.io/riscv64-python-wheels`) - filed the original tracking issue and a duplicate PR, later withdrawn.
- Luc Georges (McPatate), Hugging Face maintainer - reviewed and merged #708, closed #723.

**Upstreaming status:** Fully upstream. The riscv64 build-matrix entry is on `main` and shipped starting with v0.8.0-rc.0. There is no fork-only or out-of-tree riscv64 code; the only riscv64-related change in the entire history of the repository is this single, merged PR.

## 3. Upstream Support Tier

No formal, written platform-tier policy exists in this repository (checked `CONTRIBUTING.md`, `GOVERNANCE.md`, `docs/`; no `PLATFORMS.md` or `SUPPORT.md` found). Tier status must be inferred from CI and release behavior:

- riscv64 is a **build-only** entry in the same wheel-release matrix as x86_64, x86, aarch64, armv7, s390x, and ppc64le (`.github/workflows/python-release.yml`).
- The `linux` job (which includes riscv64) is a dependency of the `release` job that uploads wheels to PyPI (`needs: [linux, musllinux, windows, macos, sdist]`), so a riscv64 build failure would gate the release the same as any other target failure.
- Unlike s390x, which has an explicit `docker/setup-qemu-action` step and a dedicated Dockerfile (`Dockerfile.s390x.test`) that runs `pytest` under QEMU emulation, **riscv64 has no test-execution step at all** - it is cross-compiled via `PyO3/maturin-action` and the resulting wheel is uploaded as an artifact, never run.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build in release CI | Yes | Yes | Yes |
| Test execution in CI | Yes (native runner) | Yes (native runner, per matrix) | No - build/cross-compile only, no QEMU or native execution |
| Official PyPI wheel | Yes | Yes | Yes, since v0.8.0-rc.0 |
| Release-blocking | Yes | Yes | Yes (same `linux` job gates `release`) |
| Formal tier designation | None documented | None documented | None documented |

## 4. Technical Architecture and RISC-V-Specific Subsystems

safetensors has essentially no architecture-specific code. Verified by direct source inspection:

- Core crate (`safetensors/src/{lib.rs,tensor.rs,slice.rs}`, 1,649 lines total): zero occurrences of `target_arch`, `simd`, `intrinsic`, `asm!`, or `riscv`. Only 3 `unsafe` blocks total, all mmap-related, none SIMD.
- Python bindings (`bindings/python/src/lib.rs`, 2,543 lines): the only architecture-conditional code anywhere in the repository is `#[cfg(all(target_os = "macos", target_arch = "aarch64"))]`, gating an optional Metal/MPS GPU zero-copy path (Apple Silicon only, in `metal.rs` and `dlpack.rs`). This is GPU buffer-sharing glue, unrelated to CPU SIMD/perf, and does not exist for x86_64, generic (non-macOS) aarch64, s390x, ppc64le, or riscv64 either.
- No `.c`, `.cpp`, `.s`, or `.asm` files exist anywhere in the 138-file repository tree. No `arch/riscv/` directory, no JIT backend, no RVV/SIMD dispatch code.

The core format is a metadata/header parser over raw byte buffers (backed by `serde`/`serde_json` for JSON headers and `memmap2` for zero-copy tensor data access) - it is inherently architecture-agnostic and has no hot path that would benefit from architecture-specific tuning.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Tensor header parsing | Scalar (portable Rust) | Scalar (portable Rust) | Scalar (portable Rust) |
| Zero-copy mmap read path | Scalar (portable Rust + libc) | Scalar (portable Rust + libc) | Scalar (portable Rust + libc) |
| GPU zero-copy (Metal/MPS) | Not applicable (macOS/Apple Silicon only) | Applicable only on macOS+aarch64 | Not applicable |
| Hand-tuned SIMD/intrinsics | None | None | None |

**Rating: scalar (generic fallback), identical across every architecture including riscv64.** There is no riscv64-specific code to be a "stub" of, because there are no per-architecture code paths at all outside the single macOS+aarch64 GPU shortcut. The absence of riscv64-specific tuning is expected, not a completeness gap, since nothing in this codebase is architecture-tuned for any target.

## 5. Build System, Cross-Compilation, and Toolchain

safetensors is a pure Rust project (core crate) plus PyO3 Python bindings. There is no CMake, no Makefile-based build, and no C/C++ toolchain build anywhere in the repo. Confirmed via exhaustive search: `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `CMakeLists.txt`, and toolchain files all return 404; a repo-wide code search for `filename:CMakeLists.txt` returns 0 results. The only `Makefile` present just runs `cargo readme` to regenerate docs. The only Dockerfile in the repo is `Dockerfile.s390x.test` (for QEMU-based big-endian test execution) - there is no riscv64 Dockerfile.

riscv64 support is defined entirely as one row in the `.github/workflows/python-release.yml` build matrix (autogenerated by `maturin generate-ci github -m bindings/python/Cargo.toml`):

```yaml
platform:
  - runner: ubuntu-latest
    arch: riscv64
    target: riscv64gc-unknown-linux-gnu
```

Build step (`PyO3/maturin-action`):
```yaml
- name: Build wheels
  uses: PyO3/maturin-action@04ac600d27cdf7a9a280dadf7147097c42b757ad  # v1
  with:
    target: riscv64gc-unknown-linux-gnu
    args: --release --out dist --manifest-path bindings/python/Cargo.toml --locked --interpreter ${{ matrix.python_interpreter }}
    sccache: 'true'
    manylinux: auto
```

`maturin-action` handles the riscv64 cross-compilation container internally; there is no custom Dockerfile, toolchain file, or `-DUSE_X=OFF`-style flag anywhere in the repo (no CMake exists at all). No `docker/setup-qemu-action` or other QEMU step appears in this workflow for riscv64 - unlike the s390x test job, riscv64 wheels are cross-compiled but never executed under emulation.

**Toolchain requirements found:**
- Core crate (`safetensors/Cargo.toml`): `rust-version = "1.80"` (MSRV), edition 2021. No arch-specific minimum stated for riscv64.
- Python bindings (`bindings/python/Cargo.toml`): `rust-version = "1.74"`, `pyo3 = "0.29"` with `abi3-py310` (stable ABI, Python >=3.10).
- No GCC/Clang minimum is specified for riscv64 anywhere in the repo - there is no C/C++ compilation step for this target; maturin/cargo handle everything via the Rust toolchain plus maturin's internal manylinux-riscv64 cross-linker (not pinned in-repo).
- The Nix `flake.nix` devShell supports only `aarch64-linux`, `x86_64-linux`, and `aarch64-darwin` - no riscv64 target.

**Inferred (not documented in-repo) manual cross-compile command**, derived from the CI matrix:
```bash
rustup target add riscv64gc-unknown-linux-gnu
maturin build --release --target riscv64gc-unknown-linux-gnu --manifest-path bindings/python/Cargo.toml --interpreter python3.14 --manylinux auto
```
This is inferred, not stated verbatim in repo docs, since the README only documents native `pip install -e .` and native `cargo build`.

**Known build failures:** None found specific to riscv64. The CI flakiness seen during PR #708 review (a regression-test failure hitting a GitHub Pages endpoint) was confirmed by the author (threexc) to be unrelated to riscv64.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core serialization/deserialization | Full | Full | Full (identical scalar Rust code path) |
| PyO3 Python bindings | Full | Full | Full (builds via maturin cross-compile) |
| Official PyPI wheel | Yes | Yes | Yes, since v0.8.0-rc.0 |
| GPU zero-copy (Metal/MPS) | N/A (macOS/Apple-Silicon feature only) | Available on macOS+aarch64 only | N/A |
| CI test execution (pytest/cargo test) | Yes, native runner | Yes, native runner (per matrix) | No - build-only, no test execution recorded anywhere in CI |
| Real-hardware validation | Implicit via native CI | Implicit via native CI | One-off community validation: wheel built and smoke-tested on a physical BananaPi F3 (SpacemiT K1) board, cited in issue #723 - not part of ongoing CI |

**Functional gaps:** None identified in the serialization/deserialization logic itself - the format is architecture-agnostic and there is no evidence of any riscv64-specific functional limitation.

**Performance gaps:** Not applicable in the sense of "missing SIMD" - there is no SIMD-accelerated path for any architecture (see Section 4), so riscv64 is not disadvantaged relative to amd64/arm64 on this axis. Data not available: no RISC-V-specific performance benchmarks for safetensors were found via any search (queries tried: "safetensors riscv64 benchmark", "safetensors riscv performance 2025 2026", "safetensors RISC-V loading tensors performance benchmark huggingface", "huggingface safetensors riscv64 support", "safetensors rust crate riscv64gc build", ""safetensors" "riscv" performance", "RISE project safetensors riscv" - all zero usable results).

**Security hardening gaps:** Data not available - no riscv64-specific security/hardening discussion was found in issues, PRs, or CI configuration.

**NaN / floating-point semantics issues:** None found. GitHub code/issue search for `riscv nan floating repo:safetensors/safetensors` returned 0 results.

## 7. CI/CD Infrastructure

Exactly one workflow file in the repository references riscv64: `.github/workflows/python-release.yml`. All other 12 workflow files (`build_documentation.yml`, `build_pr_documentation.yml`, `delete_doc_comment.yml`, `delete_doc_comment_trigger.yml`, `python-bench.yml`, `python.yml`, `rust-release.yml`, `rust.yml`, `security-audit.yml`, `stale.yml`, `trufflehog.yml`, `upload_pr_documentation.yml`) contain zero riscv references, confirmed by direct fetch and grep of each file. No GitLab CI, Jenkinsfile, or Cirrus CI files exist in the repo (all 404).

**Trigger conditions** for the workflow containing the riscv64 job:
```yaml
on:
  push:
    branches:
      - main
      - master
    tags:
      - '*'
  pull_request:
  workflow_dispatch:
```
Runs on every push to main/master, every tag push, every pull request, and supports manual dispatch - not gated behind a label or schedule.

**Runner:** `ubuntu-latest` - a generic x86_64 GitHub-hosted runner, identical to every other Linux architecture entry in the matrix (x86_64, x86, aarch64, armv7, s390x, ppc64le). There is no dedicated riscv64 runner and no self-hosted or RISE-provided runner referenced in this file.

**Job steps:** checkout, setup-python (matrix python 3.14 / 3.14t), `PyO3/maturin-action` cross-build to `riscv64gc-unknown-linux-gnu`, then `actions/upload-artifact`. There is no test-execution step (no `pytest`, no `cargo test`, no smoke-import) for riscv64. The downstream `release` job only downloads and uploads wheel artifacts to PyPI on tag pushes - it does not execute them.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI runner | Yes (`ubuntu-latest`) | Per matrix (native or cross, not itemized in findings) | No - cross-compiled on `ubuntu-latest` x86_64 |
| Test execution in CI | Yes | Yes (native `rust.yml`/`python.yml` runners) | No |
| QEMU used | No (native) | Not applicable/unknown from findings | No - maturin-action cross-compiles without QEMU per the workflow YAML |
| RISE-provided runner in upstream CI | No | No | No - upstream CI uses standard GitHub-hosted `ubuntu-latest`; RISE's own build/test activity happens in RISE's separate `python-wheels` infrastructure, not in this repo's CI |

Note: the core Rust crate's own CI (`rust.yml`) runs only on ubuntu-latest/windows-latest/macOS-latest (x86_64/aarch64 hosted runners) - there is no native or emulated riscv64 job for `cargo test` anywhere in the repository.

## 8. Distribution and Release Status

**GitHub Releases:** No binary assets attached to any of the last 5 releases (v0.8.0, v0.8.0-rc.1, v0.8.0-rc.0, v0.7.0, v0.6.2) - all have 0 assets, confirmed via `gh api /repos/safetensors/safetensors/releases`. safetensors ships source-only tags on GitHub; this is true for every architecture, not a riscv64-specific gap.

**PyPI (official):** riscv64 wheels ARE published directly to pypi.org / files.pythonhosted.org as of the 0.8.0 release train:
- [`safetensors-0.8.0-cp310-abi3-manylinux_2_31_riscv64.whl`](https://pypi.org/pypi/safetensors/json)
- `safetensors-0.8.0rc1-cp310-abi3-manylinux_2_31_riscv64.whl`
- `safetensors-0.8.0rc0-cp310-abi3-manylinux_2_31_riscv64.whl`
- `safetensors-0.8.0.dev0-cp310-abi3-manylinux_2_31_riscv64.whl`

The 0.8.0 riscv64 wheel was verified as a live, downloadable artifact (`HTTP/2 200`, `last-modified: Tue, 09 Jun 2026 07:52:14 GMT`) directly from `files.pythonhosted.org`. Earlier reporting in this research thread stated "no riscv64 wheels are published to PyPI proper" - that claim is incorrect and is retracted here in favor of the verified positive finding above; it appears to have been checked against a snapshot that predated the 0.8.0 release train.

**RISE GitLab wheel index (third-party, not official PyPI):** [gitlab.com/api/v4/projects/56254198/packages/pypi/simple/safetensors/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/safetensors/) hosts 6 riscv64 wheels: 0.7.0, 0.6.2, 0.6.1, 0.6.0.dev0, 0.5.3, 0.5.2 (`cp38-abi3-manylinux_2_35_riscv64`). This predates and is now largely superseded by official PyPI hosting starting at 0.8.0.

**Debian:** `buildd.debian.org` shows safetensors 0.8.0-1 status "Installed" (up-to-date in the archive) for riscv64 on the `rv-osuosl-02` buildd, alongside amd64, arm64, armhf, i386, loong64, ppc64el, s390x, powerpc, ppc64, sparc64. This is the same status class as every other successfully-built architecture.

**Ubuntu:** safetensors is not packaged in Ubuntu 24.04 (noble) for any architecture ("no results" on packages.ubuntu.com); riscv64 availability is moot.

**Arch Linux RISC-V:** Not packaged. Direct path `https://archriscv.felixc.at/riscv64/community/safetensors/` returns HTTP 404, and a full-text grep of the build-status page returns zero matches for "safetensors."

**What a user must do to get a working riscv64 binary:** `pip install safetensors` on a manylinux_2_31-compatible riscv64 Linux system will pull a prebuilt wheel directly from official PyPI (as of 0.8.0). On Debian, `apt install` will pull the sid/testing build. On Ubuntu or Arch Linux RISC-V, a user must build from source via `cargo`/`maturin`, since no package exists on those distributions for any architecture (Ubuntu) or specifically riscv64 (Arch).

## 9. Dependencies

safetensors has no C/C++ SIMD, JIT, or crypto backends of its own; dependency risk is concentrated in the Rust toolchain's `riscv64gc-unknown-linux-gnu` target support (a Tier 2, host-tools rustc target) rather than in hand-written architecture-specific code in any dependency.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Rust std / `riscv64gc-unknown-linux-gnu` target | Core toolchain target | Supported - Tier 2 target, glibc 2.29+, kernel 4.20+ | Not run in safetensors' own CI; relies on upstream Rust CI | N/A (toolchain) | None found |
| `libc` (rust-lang/libc) | libc FFI bindings | Supported - many historical riscv64 PRs merged (HWCAP defines, mcontext, clone_args, max_align_t) | Covered by libc's own multi-arch CI | Published, riscv64 supported | None open |
| `serde` / `serde_json` | JSON header (de)serialization | Pure Rust, architecture-agnostic | No gaps found | Fine | None found |
| `hashbrown` | HashMap backend (`serde` feature) | Pure Rust, architecture-agnostic | No gaps found | Fine | None found |
| `tempfile` | Temp file handling (optional `std` feature) | Pure Rust + libc syscalls | No gaps found | Fine | None found |
| `memmap2` | Memory-mapped file I/O | Pure Rust wrapper over mmap syscalls | No gaps found | Fine | None found |
| `pyo3` | Python <-> Rust FFI | Supported via standard Rust target | No riscv64-specific gaps found | Fine | None found |
| `objc2` / `objc2-metal` | Metal-direct GPU path, macOS/aarch64-only | Not applicable to riscv64 (`target_os = "macos"` gated) | N/A | N/A | N/A |

None of these dependencies are separately tracked in `project-reports/scope.yml`, so there are no cross-references to other reports in this repository.

**Deep-dive:** there are no JIT, SIMD, or crypto dependencies to recurse into - the entire dependency graph is pure or near-pure Rust plus PyO3, and none showed riscv64-specific blocking issues in GitHub search at the time of research.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#723](https://github.com/safetensors/safetensors/issues/723) | Add riscv64 (linux_riscv64) wheel to PyPI releases | Closed 2026-04-13 | N/A (feature request, resolved) | Resolved by merged PR #708 |
| [#708](https://github.com/safetensors/safetensors/pull/708) | Add riscv64 build, make Linux wheel build matrix more explicit | Merged 2026-03-26 | N/A | Landed riscv64 wheel support |
| [#724](https://github.com/safetensors/safetensors/pull/724) | ci: add riscv64 target to linux wheel build matrix | Closed unmerged | N/A | Duplicate of #708, withdrawn voluntarily |
| [#692](https://github.com/safetensors/safetensors/pull/692) | feat: add io_uring read fast path for Linux | Closed unmerged | N/A | Not riscv64-specific; matched search incidentally |
| [#802](https://github.com/safetensors/safetensors/pull/802) | build(deps): bump msgpack from 1.1.2 to 1.2.1 | Open (dependabot) | N/A | Not riscv64-related; matched only via an unrelated changelog quote |

**Correctness bugs:** None found. Exhaustive GitHub searches (`riscv64 performance`, `riscv64 bug state:open`, `riscv nan floating`, `riscv` across all issues/PRs) returned zero results beyond the CI-matrix entry itself. No open riscv64 issues or follow-up PRs exist beyond the items above.

## 12. Objections and Upstream Blockers

**Stated objections:** None found. PR #708 was merged with no inline code review comments and no expressed technical objections; the only discussion was routine CI-flakiness troubleshooting (traced to an unrelated GH Pages endpoint issue, not riscv64).

**Technical blockers:** None found for the merged build-matrix change. The one open technical gap is that riscv64 wheels are cross-compiled and never executed/tested in CI (no QEMU job, unlike s390x's `Dockerfile.s390x.test` + `docker/setup-qemu-action` test job) - this is a coverage gap, not a stated blocker by maintainers.

**Organizational blockers:** None found. Neither Hugging Face nor BayLibre appears on the RISE Project's published members list (Premier members: Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General members: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, SpacemiT, ZTE), per [riseproject.dev/members/](https://riseproject.dev/members/). This suggests the contribution was community/ecosystem-driven work performed "on behalf of" RISE rather than a result of safetensors or Hugging Face being RISE members themselves. Whether BayLibre has an informal or contractual relationship with RISE beyond this single PR is unconfirmed [NEEDS VERIFICATION].

**Acceptance probability for further riscv64 work:** High, based on the precedent of this PR (accepted quickly, no pushback) and the maintainers' general willingness to accept self-contained CI-matrix additions from outside contributors for other niche architectures (ppc64le, s390x, arm64 Windows via PR #678).

## 13. Investment Analysis

Before sizing new work, note what RISE has already funded: the entire currently-shipping riscv64 wheel-build support (PR #708) was authored by a RISE-affiliated contributor (Trevor Gamblin, BayLibre) explicitly "on behalf of the RISE Project." RISE also tracks this package in its own `python-wheels` project ([docs/packages/safetensors.yaml](https://github.com/riseproject-dev/python-wheels/blob/main/docs/packages/safetensors.yaml), listing versions 0.5.2 through 0.7.0) and lists it among 73 supported packages on the predecessor [wheel_builder page](https://riseproject.gitlab.io/python/wheel_builder/). Note: safetensors does not currently appear in RISE's `ci_scripts/packages.txt` (the list RISE's own CI iterates over), even though a docs YAML entry exists - this may be a legacy entry pending re-integration after a 2026-07-16 doc-format rework, and is a gap in RISE's own automation rather than in upstream safetensors.

### 13.1 Functional Enablement
No further functional work is needed. The core library is pure, portable Rust with no architecture-specific code paths (Section 4); it works identically on riscv64 as on every other architecture. Effort: none identified.

### 13.2 Performance Optimization
Not applicable in the sense of SIMD/intrinsics work, since no architecture (including amd64/arm64) has hand-tuned SIMD paths in this codebase - there is nothing riscv64-specific to optimize relative to other architectures. Data not available: no RISC-V-specific performance benchmarking exists to identify a delta or target for optimization.

### 13.3 CI/CD Infrastructure
The one identified gap is test execution: riscv64 wheels are built and uploaded to PyPI without ever being executed in CI (no QEMU-based test job, unlike the existing s390x pattern in `Dockerfile.s390x.test`). Adding a QEMU-based `pytest` execution step for the riscv64 wheel, modeled directly on the existing s390x test job, would close this gap. Estimated effort: small (1 engineer, low complexity given the s390x template already exists in-repo) - likely under 1 person-week, though this is an estimate not sized against any existing RISE work-breakdown, since no RISE test-infrastructure work for safetensors was found in the research.

### 13.4 Ecosystem Enablement
RISE's own `python-wheels`/`wheel_builder` infrastructure already builds and republishes safetensors wheels for riscv64 independent of the upstream PyPI release; official PyPI itself now also ships riscv64 wheels as of 0.8.0. No further ecosystem-enablement work specific to safetensors was identified as outstanding.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None - already fully functional and upstream | 0 | N/A | N/A |
| Performance | No SIMD/optimization work applicable (no arch has hand-tuned paths) | 0 | N/A | N/A |
| CI/CD | Add QEMU-based test-execution step for riscv64 wheel (mirroring existing s390x `Dockerfile.s390x.test` pattern) | <1 (estimate, not independently sized against RISE work) | Unassigned | Low |
| Ecosystem | None - already covered by RISE's python-wheels index and official PyPI | 0 | N/A | N/A |

## 14. Updates
(No updates yet - initial report dated 2026-06-17.)

## 15. References

- [Issue #723 - Add riscv64 (linux_riscv64) wheel to PyPI releases](https://github.com/safetensors/safetensors/issues/723)
- [PR #708 - Add riscv64 build, make Linux wheel build matrix more explicit](https://github.com/safetensors/safetensors/pull/708)
- [PR #724 - ci: add riscv64 target to linux wheel build matrix](https://github.com/safetensors/safetensors/pull/724)
- [PR #692 - feat: add io_uring read fast path for Linux](https://github.com/safetensors/safetensors/pull/692)
- [PR #802 - build(deps): bump msgpack from 1.1.2 to 1.2.1](https://github.com/safetensors/safetensors/pull/802)
- [Commit 6e3411d - merge commit for PR #708](https://github.com/safetensors/safetensors/commit/6e3411d8d45bf16886fbc559108c2134de5c4677)
- [safetensors/safetensors GitHub repository](https://github.com/safetensors/safetensors)
- [safetensors homepage on Hugging Face docs](https://huggingface.co/docs/safetensors)
- [.github/workflows/python-release.yml](https://github.com/safetensors/safetensors/blob/main/.github/workflows/python-release.yml)
- [PyPI JSON API for safetensors](https://pypi.org/pypi/safetensors/json)
- [Debian buildd status for safetensors](https://buildd.debian.org/status/package.php?p=safetensors)
- [Arch Linux RISC-V port status page](https://archriscv.felixc.at/?q=safetensors)
- [RISE GitLab wheel index for safetensors](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/safetensors/)
- [riseproject-dev/python-wheels issue #25 - safetensors riscv64 support](https://github.com/riseproject-dev/python-wheels/issues/25)
- [riseproject-dev/python-wheels docs/packages/safetensors.yaml](https://github.com/riseproject-dev/python-wheels/blob/main/docs/packages/safetensors.yaml)
- [RISE wheel_builder package list (predecessor project)](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project homepage](https://riseproject.dev/)