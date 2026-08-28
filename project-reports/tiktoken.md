---
title: tiktoken
---

# tiktoken

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for tiktoken<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

tiktoken is OpenAI's byte-pair encoding (BPE) tokenizer, used to convert text into token sequences for GPT-family models. The core algorithm is implemented in Rust (~702 lines across `src/lib.rs` and `src/py.rs`), exposed to Python via PyO3. It has no C/C++ code, no SIMD intrinsics, no JIT, and no architecture-specific code paths of any kind. The entire implementation is portable Rust with generic scalar operations.

**Governance:** No formal open governance. OpenAI owns and controls the project. There is no steering committee, TSC, or foundation affiliation (Linux Foundation, Apache, CNCF, or otherwise). OpenAI is not a RISE project member. The RISE member list (Premier: Alibaba, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Andes, Canonical, SpacemiT, and others) does not include OpenAI.

**Corporate maintainers:**
- Shantanu Jain (`hauntsanuntu`, `shantanu@openai.com`) - dominant maintainer, 45 of 55 recent commits, sole named author in `pyproject.toml`
- Drew Hintz (`hintz-openai`) - occasional contributor
- Nathan Goldbaum - affiliation unconfirmed from public profile; contributed 2 commits related to CPython free-threading support

**Culture on new ports:** Cold. Both the riscv64 wheel request ([issue #502](https://github.com/openai/tiktoken/issues/502), opened 2026-03-11) and the implementation PR ([PR #506](https://github.com/openai/tiktoken/pull/506), opened 2026-03-12) have received zero maintainer engagement as of the last data point (2026-04-30). The project structure - single corporate maintainer, no community governance path - means no port can land without explicit OpenAI approval.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2026-03-11 | Issue #502 filed by gounthar (BayLibre/RISE): requests `linux_riscv64` wheel; demonstrates working `tiktoken-0.12.0-cp313-cp313-linux_riscv64.whl` built on BananaPi F3 (SpacemiT K1, rv64imafdcv) | [openai/tiktoken#502](https://github.com/openai/tiktoken/issues/502) |
| 2026-03-12 | PR #506 filed by gounthar: adds `build_wheels_riscv64` CI job using cibuildwheel + QEMU, targeting CPython 3.10-3.14 including free-threaded | [openai/tiktoken#506](https://github.com/openai/tiktoken/pull/506) |
| 2026-03-19 | gounthar confirms native build success on BananaPi F3 (rv64gc, GCC 14.2.0) | [PR #506 comment](https://github.com/openai/tiktoken/pull/506) |
| 2026-03-30 | gounthar confirms successful build on native RISE runner (~5 min); links [CI run](https://github.com/gounthar/tiktoken/actions/runs/23745982111) | [PR #506 comment](https://github.com/openai/tiktoken/pull/506) |
| 2026-04-30 | justeph independently verifies PR branch builds on fork (~23 min via QEMU); flags unpinned action hashes; gounthar pins all four actions same day | [PR #506 comments](https://github.com/openai/tiktoken/pull/506) |
| 2026-04-30 | Last activity in either issue or PR - no maintainer response to date | [PR #506](https://github.com/openai/tiktoken/pull/506) |

**Key contributors and organizations:**

- gounthar - BayLibre / RISE contributor; filed both the issue and the PR; has access to RISE native riscv64 runners
- justeph - affiliation unconfirmed; independent verification of the QEMU build path

**Upstream status:** Not upstream. Zero riscv64-related commits have merged into `openai/tiktoken`. The port exists only as open, unmaintained-by-upstream issues and a PR.

---

## 3. Upstream Support Tier

tiktoken has no published tier or support-level policy. The official CI (`build_wheels.yml`) defines the de facto support tier by platform coverage.

| Platform | CI | PyPI wheel | Official |
|---|---|---|---|
| linux x86_64 | Yes (`ubuntu-latest`) | Yes (manylinux_2_28, musllinux_1_2) | Yes |
| linux aarch64 | Yes (`ubuntu-24.04-arm`) | Yes (manylinux_2_28, musllinux_1_2) | Yes |
| Windows x86_64 | Yes (`windows-latest`) | Yes | Yes |
| macOS x86_64 + arm64 | Yes (`macos-latest`) | Yes | Yes |
| linux riscv64 | No | No | No |

`pyproject.toml` explicitly skips i686 and win32 but makes no mention of riscv64. riscv64 is absent from both the CI matrix and the skip list - it has not been evaluated by upstream, only ignored.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

tiktoken has no architecture-specific subsystems. The search queries `riscv`, `vfloat32m1_t`, `rvv`, and `riscv64` against `repo:openai/tiktoken` all returned 0 results. There are no `.S` assembly files, no `#[cfg(target_arch = "riscv64")]` guards, no SIMD dispatch, and no `arch/riscv/` directory.

| Component | Description | x86_64 | arm64 | riscv64 |
|---|---|---|---|---|
| BPE merge (`src/lib.rs`) | Byte-pair merge, ~702 lines, scalar Rust | Scalar | Scalar | Scalar (identical) |
| Python bindings (`src/py.rs`) | PyO3 FFI | Generic | Generic | Generic |
| Regex engine (via `fancy-regex`) | NFA/DFA, pure Rust, optional SIMD with graceful fallback | Generic | Generic | Generic |
| Hash map (via `rustc-hash`) | Non-cryptographic hash for merge table | Generic | Generic | Generic |

**Conclusion:** There is no riscv64 code gap because there is no architecture-specific code for any architecture. The Rust compiler's generic backend handles codegen for all targets. No RVV (RISC-V Vector) paths exist or are needed for correctness - performance implications are discussed in Section 6.

---

## 5. Build System, Cross-Compilation, and Toolchain

tiktoken is not a CMake project. It is a Python extension built with Rust via PyO3 and `setuptools-rust`.

**Build stack:**
- `pyproject.toml`: declares `setuptools-rust >= 1.5.2` as build requirement
- `setup.py`: defines `RustExtension("tiktoken._tiktoken", binding=Binding.PyO3, debug=False, features=["python"])`
- `Cargo.toml` (edition 2024, v0.13.0): pulls `fancy-regex`, `regex`, `rustc-hash`, `bstr`, `pyo3 0.28.3`
- Wheel builds use `cibuildwheel` v3.1.4

**Cross-compilation to riscv64 (derived from project structure; not documented upstream):**

```bash
rustup target add riscv64gc-unknown-linux-gnu
apt-get install gcc-riscv64-linux-gnu
export CARGO_TARGET_RISCV64GC_UNKNOWN_LINUX_GNU_LINKER=riscv64-linux-gnu-gcc
export CARGO_NET_GIT_FETCH_WITH_CLI=true   # required under QEMU to avoid OOM
pip install setuptools-rust
python setup.py bdist_wheel --plat-name linux_riscv64
```

The `CARGO_NET_GIT_FETCH_WITH_CLI=true` requirement is documented in the project's CHANGELOG (v0.3.1) and is present in the aarch64 CI job. It is required under QEMU emulation to prevent cargo from running out of memory during dependency fetches. [NEEDS VERIFICATION for riscv64 specifically - confirmed only for aarch64 QEMU from upstream CI.]

**Native build times (from PR #506 comments):**
- BananaPi F3 (SpacemiT K1, rv64gc, 8 cores at 1.6 GHz): ~10 min (issue #502), ~5 min on RISE runner (PR #506 comment 2026-03-30)
- QEMU emulation: ~23 min (PR #506 comment, justeph, 2026-04-30)

**musllinux:** The PR #506 diff explicitly skips musllinux via `CIBW_SKIP: "*-musllinux*"`. The reason stated is no manylinux_riscv64 musllinux image available. No musllinux riscv64 path exists in either upstream CI or the RISE wheel builder.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| BPE tokenization (all models) | Yes | Yes | Yes | None |
| All vocabulary files (GPT-2, GPT-4, o200k_base) | Yes | Yes | Yes | None |
| Free-threaded CPython (3.14t) | Yes | Yes | Yes (via RISE wheels) | None |
| Official PyPI binary wheel | Yes | Yes | No | Binary distribution only |
| musllinux wheel | Yes | Yes | No | No manylinux_riscv64 musllinux image |
| RVV-accelerated tokenization | N/A | N/A | No | Performance gap (see below) |

**Functional gaps:** None. The code is architecturally complete and identical across all targets. There are no features gated on architecture.

**Performance gap:** tiktoken contains no SIMD-optimized paths for any architecture, including x86_64 and arm64. The BPE merge loop and regex engine use portable Rust. The performance baseline on riscv64 will match what the Rust compiler generates for `riscv64gc-unknown-linux-gnu`. No published riscv64 vs. arm64 throughput comparison exists in the upstream issue tracker or in any public benchmark found by research. The upstream issue #33 (x86_64 only, 2023) shows ~6.0 MB/s on a 64 MiB Wikipedia text corpus; no riscv64 equivalent exists.

The available riscv64 hardware (SpacemiT K1, RVV 1.0 vlen=256) is not exploited. Community builds target baseline rv64gc with no vector extensions. This is a performance gap but not an investment target given the absence of any SIMD code in the upstream for any architecture.

**NaN / floating-point:** Not applicable. tiktoken performs no floating-point arithmetic.

**Security hardening:** Data not available: no search was performed for stack canaries, CFI, or hardening flags specific to riscv64 vs. other architectures. The library processes only text; attack surface is minimal.

---

## 7. CI/CD Infrastructure

The content of `.github/workflows/build_wheels.yml` was read in full. riscv64 is absent.

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI job | `build_wheels` on `ubuntu-latest` | `build_wheels_aarch64` on `ubuntu-24.04-arm` | None |
| Runner type | GitHub-hosted x86_64 | GitHub-hosted ARM64 | None |
| QEMU | No | No | N/A |
| Wheel artifacts | Yes | Yes | No |
| PyPI publish | Yes | Yes | No |
| Free-threaded (3.14t) | Yes | Yes | No (proposed in PR #506) |

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository (all return 404).

**RISE runner availability:** PR #506 comment (2026-03-30) confirms a native riscv64 RISE runner completed the build in ~5 min. The PR description explicitly notes RISE native runners are available for free. This means the CI cost objection is already addressed - RISE would absorb runner costs if the PR were merged.

**Third-party CI (RISE wheel builder):** BayLibre maintains a `build-tiktoken` job in the [`riseproject/python/wheel_builder`](https://gitlab.com/riseproject/python/wheel_builder) GitLab CI pipeline (copyright 2025 BayLibre, SAS, Apache-2.0). This job extends `.build-riscv64`, uses cibuildwheel with Rust toolchain support, and publishes to the RISE PyPI index. This is external to `openai/tiktoken` and does not constitute upstream CI.

---

## 8. Distribution and Release Status

| Channel | riscv64 available | Version | Notes |
|---|---|---|---|
| PyPI (official) | No | N/A | Confirmed by direct API fetch of `pypi.org/pypi/tiktoken/json`; zero riscv64 filenames |
| GitHub Releases | No assets at all | N/A | Releases contain only source archives; no binary assets for any architecture |
| RISE GitLab PyPI index | Yes | 0.7.0 - 0.13.0 (latest) | Wheels for CPython 3.10-3.14 and 3.14t; `manylinux_2_34_riscv64`; requires explicit `--extra-index-url` |
| Community wheel index | Yes | 0.12.0+ [NEEDS VERIFICATION for 0.13.0] | `gounthar.github.io/riscv64-python-wheels/simple/`; 50+ ML/AI riscv64 wheels |
| Debian sid | Yes | 0.12.0-2 | `python3-tiktoken`, built on `rv-osuosl-04`, status: Installed; confirmed via [buildd.debian.org](https://buildd.debian.org/status/package.php?p=tiktoken&suite=sid) |
| Ubuntu 24.04 Noble | Yes | 0.6.0-2ubuntu1 | `python3-tiktoken` in `universe`; riscv64 listed alongside amd64/arm64/armhf/ppc64el/s390x [NEEDS VERIFICATION - not re-fetched in adversarial phase] |
| Arch Linux RISC-V | No | N/A | Not packaged; archriscv.felixc.at returned no listing |
| musllinux riscv64 | No | N/A | No manylinux_riscv64 musllinux image exists |

**What a user must do today to install tiktoken on riscv64:**

Option A (Rust toolchain available): `pip install tiktoken` falls back to sdist and compiles from source. Requires Rust toolchain, `gcc-riscv64-linux-gnu` cross-linker if cross-compiling, and `CARGO_NET_GIT_FETCH_WITH_CLI=true` under QEMU. Build time ~10 min native, ~23 min QEMU.

Option B (no compilation): `pip install tiktoken --extra-index-url https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple` installs the RISE-built binary wheel for 0.13.0.

Option C (distro package): `apt install python3-tiktoken` on Debian sid or Ubuntu 24.04 gives 0.12.0-2 or 0.6.0-2ubuntu1 respectively, without needing Rust.

---

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Rust toolchain (`riscv64gc-unknown-linux-gnu`) | Compiler for all Rust crates | Tier 2 with host tools | Standard CI supported | Distributed via rustup | None blocking compilation |
| PyO3 0.28.3 | Python-Rust FFI | Builds on riscv64; maturin supports `riscv64gc-unknown-linux-gnu` | No riscv64 CI upstream | Pure Rust crate, no binary releases needed | None; [maturin#3034](https://github.com/PyO3/maturin/issues/3034) (closed) - abi3 free-threaded wheel issue, fixed |
| fancy-regex 0.17.0 | Regex engine (BPE split patterns) | Builds on riscv64 (pure Rust, no arch-specific code) | No riscv64 CI upstream | crates.io; no binary releases | None |
| regex 1.10.3 (Rust) | NFA/DFA engine underlying fancy-regex | Pure Rust; optional SIMD with graceful fallback | No riscv64 CI upstream | crates.io | None |
| rustc-hash 2 | Fast hash map for BPE merge table | Pure Rust, architecture-agnostic | N/A | crates.io | None |
| bstr 1.5.0 | Byte-string utilities | Pure Rust | N/A | crates.io | None |
| setuptools-rust >= 1.5.2 | Build system bridge | Pure Python | N/A | PyPI `none-any` wheel | None |
| regex (Python runtime dep) | Vocab loading | riscv64 manylinux + musllinux wheels on PyPI as of 2026-07-19 | Ships and passes tests | Full riscv64 coverage on PyPI (`manylinux_2_31_riscv64`, `musllinux_1_2_riscv64`) | None - already resolved |
| requests | HTTP client for vocab download | Pure Python | N/A | PyPI pure Python | None |
| blobfile >= 3 (optional) | Azure/GCS blob storage for vocabs | Pure Python (`py3-none-any`) | N/A | PyPI pure Python | None |
| cibuildwheel (build infra) | Wheel builder | riscv64 via QEMU supported (issue #2263 closed, v3.1.4) | QEMU-based testing works | N/A (build tool) | tiktoken CI omits riscv64 by choice, not infra gap |
| manylinux_2_28+ (infra) | Linux wheel portability | `manylinux_2_28_riscv64` images on `quay.io/pypa/` (issue #1425 closed) | pypa provides QEMU containers | Infra available | tiktoken CI skips riscv64 by omission |

**Critical dependency assessment:** All dependencies are unblocked. The sole constraint is tiktoken itself not publishing an official riscv64 wheel. The full dependency chain compiles and runs correctly on riscv64. The Python `regex` runtime dependency, historically a gap, has been resolved with full riscv64 wheel coverage on PyPI.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | riscv64-specific | Notes |
|---|---|---|---|---|---|
| [#502](https://github.com/openai/tiktoken/issues/502) | Add riscv64 (linux_riscv64) wheel to PyPI releases | Open | Medium | Yes | Packaging gap only; source builds work; no maintainer response |
| [#506](https://github.com/openai/tiktoken/pull/506) | ci: add riscv64 wheel builds | Open PR, not merged | Medium | Yes | All reviewer feedback addressed; no OpenAI approval; technically ready |
| [#530](https://github.com/openai/tiktoken/issues/530) | encode_ordinary_batch reproducible multi-second tail stalls on 32-core box | Open | High | No (all platforms) | 7.6x worst-case latency vs. median on Sapphire Rapids/Ubuntu 24.04; multilingual text 14.6s vs 4.8s median |
| [#195](https://github.com/openai/tiktoken/issues/195) | Very slow for inputs like `'a' * 100000` | Open | Medium | No (all platforms) | Quadratic-like degradation for repeated-character strings |
| [#284](https://github.com/openai/tiktoken/issues/284) | Optimize `_byte_pair_merge` function in BPE implementation | Open | Low | No (all platforms) | `_byte_pair_merge` identified as optimization target; no action taken |
| [#441](https://github.com/openai/tiktoken/issues/441) | Interest in porting any of the implementation from TokenDagger? | Open | Low | No (all platforms) | PCRE2 JIT and regex optimizations proposed; no action taken |
| [#33](https://github.com/openai/tiktoken/issues/33) | Performance ideas | Open | Low | No (all platforms) | Throughput gap vs. custom BPE; from 2023 |

**No open correctness bugs.** Searches for riscv NaN, floating-point errors, and incorrect results returned zero results. tiktoken performs no floating-point arithmetic, so floating-point correctness is not a risk surface.

---

## 12. Objections and Upstream Blockers

**Organizational blocker (primary):** OpenAI has not responded to issue #502 or PR #506 in over five weeks (2026-03-12 to 2026-04-30, last data point). The project is single-maintainer and corporate-controlled. There is no community governance path to merge a PR without OpenAI approval. No stated objection exists because there has been no engagement at all.

**Technical state of PR #506:** Technically ready. The PR is mergeable (GitHub API: `mergeable: true`, `mergeable_state: blocked` - blocked only on missing approving review). Three builds verified independently (BananaPi F3 native, RISE native runner, QEMU fork). Unpinned action hash feedback from reviewer justeph was addressed same day (2026-04-30). The diff is +33/-1 lines in a single file (`build_wheels.yml`). No code changes required.

**musllinux gap:** No `musllinux_riscv64` image exists. The PR correctly skips musllinux. This is a known infra gap external to tiktoken; not an objection, just a scope boundary.

**Runner cost:** Not an objection - PR #506 explicitly notes RISE offers free native riscv64 runners. QEMU builds run on standard GitHub-hosted runners.

**Acceptance probability:** Low in the near term given zero maintainer engagement over five weeks on a trivial, ready PR. The structural constraint is OpenAI's willingness to own the riscv64 wheel in PyPI releases, which implies ongoing maintenance responsibility they have not agreed to take on.

---

## 13. Investment Analysis

RISE (via BayLibre) already maintains riscv64 binary wheels for tiktoken 0.7.0-0.13.0 at the RISE GitLab PyPI index. Debian sid and Ubuntu 24.04 ship binary packages. The functional gap is solved for users who know about the RISE index or use a distro package. The remaining gap is user experience: `pip install tiktoken` on a bare riscv64 system falls back to a ~10-min source compile rather than downloading a binary wheel.

### 13.1 Functional Enablement

No work required. tiktoken is functionally complete on riscv64 today. Source builds work. No code changes are needed.

### 13.2 Performance Optimization

No architecture-specific SIMD code exists for any platform. Adding RVV-accelerated BPE merge or regex matching would be a net-new performance engineering effort, not a port. Given that no such optimization exists for x86_64 or arm64 either, there is no parity gap - only an opportunity. No published performance numbers for riscv64 vs. arm64 are available to justify sizing such work.

### 13.3 CI/CD Infrastructure

PR #506 is the sole deliverable needed. It is already written, reviewed, and verified. The outstanding work is maintainer engagement, not engineering.

| Option | Description | Effort | Notes |
|---|---|---|---|
| Advocate for merging PR #506 | Engage OpenAI to review and merge the ready PR | < 1 person-week | No engineering work; requires relationship/communication effort |
| Maintain RISE wheel builder indefinitely | Continue BayLibre-led CI in `riseproject/python/wheel_builder` | Ongoing (already funded) | Already done; covers 0.7.0-0.13.0 including 3.14t |
| Fork and self-host | Maintain a Qualcomm-internal or RISE-published binary | < 1 person-week setup | RISE already does this; redundant |

### 13.4 Ecosystem Enablement

Not applicable. tiktoken is a standalone library. Its Python runtime dependency (`regex`) already has full riscv64 wheel coverage on PyPI. No secondary ecosystem work is needed.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Engage OpenAI to merge PR #506 (ready, no code changes needed) | < 1 | RISE / Qualcomm BD | High |
| CI/CD | Maintain RISE wheel builder as backstop if PR #506 remains unmerged | Ongoing (already covered) | BayLibre / RISE | High (already done) |
| Performance | RVV-accelerated BPE merge (net-new, no parity gap today) | 4-8 | Engineering | Low |
| Performance | Establish riscv64 vs. arm64 baseline benchmarks | 1 | Engineering | Medium |

The highest-leverage action is non-engineering: getting OpenAI to merge a 33-line PR that has been verified, reviewed, and sitting idle since March 2026. All infrastructure is in place. RISE already covers binary distribution as a fallback.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [openai/tiktoken repository](https://github.com/openai/tiktoken)
- [Issue #502: Add riscv64 (linux_riscv64) wheel to PyPI releases](https://github.com/openai/tiktoken/issues/502)
- [PR #506: ci: add riscv64 wheel builds](https://github.com/openai/tiktoken/pull/506)
- [tiktoken CI workflow: build_wheels.yml](https://github.com/openai/tiktoken/blob/main/.github/workflows/build_wheels.yml)
- [RISE wheel builder (GitLab): riseproject/python/wheel_builder](https://gitlab.com/riseproject/python/wheel_builder)
- [RISE GitLab PyPI index for tiktoken](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tiktoken/)
- [PyPI: tiktoken](https://pypi.org/project/tiktoken/)
- [Debian buildd: python3-tiktoken (sid)](https://buildd.debian.org/status/package.php?p=tiktoken&suite=sid)
- [Debian tracker: python3-tiktoken](https://tracker.debian.org/pkg/tiktoken)
- [Ubuntu packages: python3-tiktoken (Noble)](https://packages.ubuntu.com/search?keywords=tiktoken&suite=noble)
- [Community riscv64 wheel index](https://gounthar.github.io/riscv64-python-wheels/simple/tiktoken/)
- [Issue #530: encode_ordinary_batch tail stalls](https://github.com/openai/tiktoken/issues/530)
- [Issue #195: Slow for repeated-character inputs](https://github.com/openai/tiktoken/issues/195)
- [Issue #284: Optimize _byte_pair_merge](https://github.com/openai/tiktoken/issues/284)
- [Issue #33: Performance ideas](https://github.com/openai/tiktoken/issues/33)
- [Issue #441: TokenDagger port interest](https://github.com/openai/tiktoken/issues/441)
- [PyO3/maturin#3034: riscv64 free-threaded abi3 wheel fix (closed)](https://github.com/PyO3/maturin/issues/3034)
- [pypa/manylinux: riscv64 support (issue #1425, closed)](https://github.com/pypa/manylinux/issues/1425)
- [RISE project member list](https://riseproject.dev/members/)
- [gounthar native RISE runner CI run for tiktoken](https://github.com/gounthar/tiktoken/actions/runs/23745982111)
- [justeph QEMU fork CI run for tiktoken](https://github.com/justeph/tiktoken/actions/runs/25152519227)