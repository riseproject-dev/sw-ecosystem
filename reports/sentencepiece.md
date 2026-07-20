---
title: sentencepiece
categories:
  - ai-ml
---

# sentencepiece

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for sentencepiece
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

SentencePiece is a C++17 library and command-line toolkit for unsupervised text tokenization, implementing BPE (byte-pair encoding) and unigram language model algorithms. It is the dominant subword tokenizer used in transformer-based NLP models including T5, ALBERT, XLNet, and most multilingual LLMs. It is consumed primarily as a Python wheel (`pip install sentencepiece`) but also as a C++ library via CMake.

**Governance:** No foundation affiliation. Hosted under the `google/` GitHub organization with an explicit disclaimer in the README: "This is not an official Google product." The project operates under a BDFL model: Taku Kudo (`taku910`) holds 1,078 of approximately 1,200 total commits. No TSC, steering committee, or formal maintainer board exists. PRs require an issue first; the maintainer merges without a formal review process.

**Corporate affiliation:** `taku910`'s GitHub profile lists no employer. His Google Brain affiliation is historical (project created 2018). All other active contributors are individuals with single-digit commit counts; `dependabot[bot]` accounts for 51 commits. No corporate sponsors have made public disclosures.

**License:** Apache 2.0.

**Community culture on new ports:** The maintainer merged riscv64 wheel support (PR #1196, April 14, 2026) then reverted it 18 days later (PR #1226, May 2, 2026) due to a CI failure, with no explanation in the revert PR body. He has not responded to Issue #1250 (opened May 20, 2026) requesting reinstatement via RISE native CI runners. The pattern indicates the maintainer is responsive to patches but applies minimal scrutiny and does not proactively manage riscv64 as a supported platform.

**RISE membership:** SentencePiece itself is not a member. Google is a Premier Member of RISE.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| Sep 30, 2025 | `taku910` commits fix for native riscv64 build failure: adds `-latomic` to `CMakeLists.txt` for riscv64 target | [Commit 835932f](https://github.com/google/sentencepiece/commit/835932f) |
| Mar 11, 2026 | Issue #1195 opened by `gounthar` requesting `linux_riscv64` PyPI wheels; labels "Will fix in next release" | [Issue #1195](https://github.com/google/sentencepiece/issues/1195) |
| Mar 12, 2026 | PR #1196 opened by `gounthar`: adds QEMU emulation step and `riscv64` to `CIBW_ARCHS_LINUX` in `wheel.yml` | [PR #1196](https://github.com/google/sentencepiece/pull/1196) |
| Apr 14, 2026 | PR #1196 merged by `taku910`; riscv64 wheels enter the release pipeline for the first time | [PR #1196](https://github.com/google/sentencepiece/pull/1196) |
| May 2, 2026 | PR #1226 merged by `taku910`: reverts #1196 citing `exec format error` in manylinux container from broken QEMU binfmt_misc registration (`docker/setup-qemu-action@v3`) | [PR #1226](https://github.com/google/sentencepiece/pull/1226) |
| May 20, 2026 | Issue #1250 opened requesting reinstatement via RISE native riscv64 GitHub Actions runners (`ubuntu-24.04-riscv`); no maintainer response | [Issue #1250](https://github.com/google/sentencepiece/issues/1250) |

**Key contributors:**

| Contributor | Role | Organization |
|---|---|---|
| taku910 (Taku Kudo) | Sole maintainer; authored the `-latomic` fix and both merge/revert commits | Google (historical; no current affiliation on profile) |
| gounthar | Opened Issue #1195, authored PR #1196; tested on BananaPi F3 (SpacemiT K1) | Individual |
| justeph | Opened Issue #1250; proposed RISE native runner path | Individual |

**Upstream status:** The C++ library build fix is fully upstream (commit `835932f`). The Python wheel support is NOT upstream -- it was merged then reverted. As of the report date, no riscv64 wheel has ever shipped in any released version of sentencepiece on PyPI.

---

## 3. Upstream Support Tier

No formal tier policy exists. The project has no documented platform support tiers.

**Evidence-based tier classification:**

| Platform | CI | Release binary | Maintainer response | Effective tier |
|---|---|---|---|---|
| amd64 | Full native CI in `wheel.yml`, `cmake.yml` | PyPI wheels, GitHub release binaries | All features maintained | Tier 1 (officially supported) |
| arm64 | Native CI via `ubuntu-24.04-arm` runner in `wheel.yml` | PyPI wheels for aarch64 | Full parity with amd64 | Tier 1 (officially supported) |
| riscv64 | Cross-compile + QEMU in `cross_build.yml`; no wheel CI | No PyPI wheels; no GitHub release binaries | Merged then reverted; no response to #1250 | Tier 3 (best-effort, no binaries) |

The riscv64 cross-build CI in `cross_build.yml` is genuine and active -- it fires on every push and PR, riscv64 is not excluded from the test step, and the full build+test cycle runs under `qemu-riscv64`. However, this CI produces no published artifacts and is explicitly separated from the distribution pipeline.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

SentencePiece has no architecture-specific code for any ISA. There are no hand-tuned SIMD routines, no assembly files, no JIT backend, and no crypto or GC components. The entire library is portable C++17.

**Component inventory:**

| Component | Description | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| BPE tokenizer (`bpe_model.cc`) | Pure C++ priority-queue algorithm | scalar | scalar | scalar |
| Unigram LM tokenizer (`unigram_model.cc`) | Viterbi decode in pure C++ | scalar | scalar | scalar |
| Unicode normalization | Standard C++ string processing | scalar | scalar | scalar |
| Training algorithms | STL + Abseil containers | scalar | scalar | scalar |
| Atomic operations | C++ std::atomic; riscv64 requires explicit `-latomic` linkage | built-in | built-in | scalar (-latomic) |
| Memory allocator (tcmalloc, optional) | `SPM_ENABLE_TCMALLOC`; riscv64 not supported by tcmalloc | supported | supported | NOT SUPPORTED (falls through to glibc malloc) |

There is no SIMD gap for riscv64 because no SIMD exists for any platform. There is no JIT gap because no JIT exists. Performance parity with amd64 and arm64 is limited only by compiler auto-vectorization quality and the tcmalloc fallback.

**ISA extensions used:** None. No RVV, Zba, Zbb, Zbc, or any other extension is referenced anywhere in the codebase.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Source build (native riscv64 target):**

```cmake
cmake .. \
  -DSPM_BUILD_TEST=ON \
  -DSPM_ENABLE_TCMALLOC=OFF \
  -DSPM_PROTOBUF_PROVIDER=internal \
  -DSPM_ABSL_PROVIDER=module
make -j$(nproc)
```

The only riscv64 accommodation in CMakeLists.txt is a three-line block that appends `-latomic` to both C and C++ standard libraries when `CMAKE_SYSTEM_PROCESSOR` is `riscv64`. This is already committed (commit `835932f`) and requires no user action.

**Why `-latomic` is required:** GCC for riscv64 does not automatically link `libatomic`, but `std::atomic` operations on 64-bit types require it because the hardware lacks guaranteed native 64-bit atomics on some configurations. This is a known RISC-V/GCC toolchain issue, not a sentencepiece-specific problem.

**Cross-compilation (from upstream CI):**

```bash
sudo apt-get install -y \
  qemu-user gcc-10-riscv64-linux-gnu g++-10-riscv64-linux-gnu

mkdir -p build && cd build
env CXX=/usr/bin/riscv64-linux-gnu-g++-10 \
    CC=/usr/bin/riscv64-linux-gnu-gcc-10 \
cmake .. \
  -DSPM_BUILD_TEST=ON \
  -DSPM_ENABLE_SHARED=OFF \
  -DCMAKE_FIND_ROOT_PATH=/usr/riscv64-linux-gnu \
  -DSPM_CROSS_SYSTEM_PROCESSOR=riscv64
make -j$(nproc)

qemu-riscv64 -L /usr/riscv64-linux-gnu src/spm_test
```

**Toolchain requirements:**

- GCC >= 9 (C++17 support); GCC 10 is the CI-tested baseline for cross builds
- CMake >= 3.14 (`cmake_minimum_required(VERSION 3.14 FATAL_ERROR)`)
- No Clang cross-compilation toolchain is documented or CI-tested for riscv64
- No riscv64 toolchain file (`cmake/riscv64.cmake`) exists; cross-compilation is driven entirely by `CC`/`CXX` env vars

**Known build failures:**

- Native build without `-latomic`: fails with undefined reference to `__atomic_*` symbols (fixed upstream in Sep 2025)
- PyPI wheel build via `docker/setup-qemu-action@v3`: `exec format error` -- binfmt_misc riscv64 handler not registered reliably; `setup-qemu-action@v4` resolves this [NEEDS VERIFICATION -- no merged PR using v4 exists to confirm]
- `SPM_ENABLE_TCMALLOC=ON` on riscv64: tcmalloc does not support riscv64 RSEQ per-CPU; the build will either silently fall back to glibc malloc or fail depending on toolchain

**tcmalloc:** The `SPM_ENABLE_TCMALLOC` flag defaults to ON. On riscv64, tcmalloc's `percpu.h` hard-codes support to x86_64 and aarch64 only; riscv64 falls through to `TCMALLOC_PERCPU_RSEQ_SUPPORTED_PLATFORM=0`. The upstream CI uses `-DSPM_ENABLE_SHARED=OFF` but does not set `-DSPM_ENABLE_TCMALLOC=OFF`; the cross-build sysroot does not include tcmalloc, so cmake silently skips it. On a native riscv64 build where tcmalloc is installed, the allocator will be present but run in slow-path mode only.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| BPE tokenization | Full | Full | Full |
| Unigram LM tokenization | Full | Full | Full |
| SentencePiece model training | Full | Full | Full |
| C++ library (source build) | Full | Full | Full |
| Python wheel (pip install) | Full (PyPI) | Full (PyPI) | NOT AVAILABLE (PyPI); source build ~10 min |
| tcmalloc allocator | Full | Full | NOT SUPPORTED (glibc fallback) |
| Binary protoc tooling | Available | Available | NOT AVAILABLE (no upstream prebuilt protoc for riscv64) |

**Functional gaps:**

- No riscv64 PyPI wheel: users must build from source (~10 min on a 1.6 GHz SpacemiT K1 per Issue #1195) or use the unofficial RISE wheel registry
- No prebuilt `protoc` binary for riscv64 from upstream protobuf (affects CI pipeline construction, not end-user tokenization)

**Performance gaps:**

- tcmalloc unavailable: memory allocation performance falls to glibc malloc. The magnitude of this gap is not quantified in any available source. Data not available: no riscv64 vs. amd64 tokenization throughput benchmarks exist in any public source.

**Security hardening gaps:** Data not available: no security hardening audit for riscv64 was found in any searched source.

**NaN / floating-point semantics:** No issues found. sentencepiece uses floating-point for unigram LM scores. No riscv64-specific floating-point bugs were found in any issue or PR.

---

## 7. CI/CD Infrastructure

Two CI workflows are relevant:

**`cross_build.yml` (active, covers riscv64):**

- Trigger: push to `master`, pull requests, tags `v*`, `workflow_dispatch`, release creation
- Runner: `ubuntu-latest` (x86_64 host)
- Architecture matrix: i686, arm, aarch64, riscv64, powerpc, powerpc64, powerpc64le, s390x, sparc64, m68k, sh4, alpha; `fail-fast: false`
- riscv64 build: `gcc-10-riscv64-linux-gnu` / `g++-10-riscv64-linux-gnu` cross-compilation
- riscv64 test: `qemu-riscv64 -L /usr/riscv64-linux-gnu src/spm_test` (NOT excluded; sparc64, m68k, sh4 are excluded but riscv64 is not)
- Artifacts: none published

**`wheel.yml` (active, does NOT cover riscv64):**

- Trigger: push to `master`, tags `v*`, `workflow_dispatch`
- Runners: `ubuntu-latest` (amd64), `ubuntu-24.04-arm` (arm64), `windows-latest`, `windows-11-arm`, `macos-latest`
- `CIBW_ARCHS_LINUX: auto` (after PR #1226 revert; no riscv64)
- Output: PyPI wheels for amd64, arm64, Windows, macOS

**CI comparison table:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Native (`cmake.yml`) | Native (`cmake.yml`) | Cross-compile QEMU (`cross_build.yml`) |
| Test CI | Native | Native | QEMU user-mode emulation |
| Wheel CI | Yes (`wheel.yml`) | Yes (`wheel.yml`) | NO (reverted) |
| RISE native runners | No | No | Proposed in Issue #1250; not yet implemented |
| Hardware CI | Yes (native runner) | Yes (native runner) | NO |

**RISE runner availability:** RISE native riscv64 GitHub Actions runners (`ubuntu-24.04-riscv`, Scaleway EM-RV1 bare-metal) launched March 24, 2026. Issue #1250 explicitly cites these as the path forward. No PR has been opened to use them as of the report date.

---

## 8. Distribution and Release Status

**Official upstream binaries:**

- PyPI (pip install): NO riscv64 wheel in any released version. Latest: v0.2.1 (65 distribution files; confirmed via PyPI JSON API). Platforms covered: manylinux aarch64, manylinux x86_64, macOS (universal2, x86_64, arm64), Windows (win32, win_amd64, win_arm64). No riscv64 file ever shipped.
- GitHub Releases: NO riscv64 binary. Release assets mirror the PyPI wheel set.

**Distribution-built packages:**

| Distribution | Package | Version | riscv64 | Notes |
|---|---|---|---|---|
| Debian sid | `sentencepiece`, `libsentencepiece0`, `libsentencepiece-dev`, `python3-sentencepiece` | 0.2.1-2 | YES | Built by Debian on `rv-osuosl-05`; not in any stable release |
| Ubuntu 24.04 (noble) | `sentencepiece`, `libsentencepiece0`, `libsentencepiece-dev`, `python3-sentencepiece` | 0.2.0-1build1 | YES | All four packages available |
| Alpine Linux | sentencepiece | unknown | NO | "No matching packages found" confirmed |
| Arch Linux RISC-V | unknown | unknown | UNKNOWN | Search page truncated; direct package page returned 404 |
| Fedora | unknown | unknown | UNKNOWN | Access blocked by Anubis bot challenge during research |

**Unofficial channels:**

- RISE wheel builder (GitLab project ID 56254198): riscv64 wheels for sentencepiece 0.2.0 (cp310-cp313, manylinux_2_34_riscv64/manylinux_2_35_riscv64) and 0.2.1 (cp310-cp314 including free-threaded cp314t, manylinux_2_39_riscv64). Installable via `pip install sentencepiece --index-url https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple`. This is RISE's own registry, not google/sentencepiece's official channel.
- `gounthar`'s PEP 503 index at `gounthar.github.io/riscv64-python-wheels/simple/` includes sentencepiece among 50+ riscv64 ML/AI wheels built natively on RISC-V hardware [NEEDS VERIFICATION -- referenced in research but no direct confirmation of current availability].

**What a user must do today to get a working riscv64 binary:**

Option A (unofficial RISE wheels): `pip install sentencepiece --index-url https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple`

Option B (source build, ~10 min on SpacemiT K1): `pip install sentencepiece` (triggers source build; requires C++ build toolchain)

Option C (Debian/Ubuntu system package): `apt install python3-sentencepiece` (Ubuntu 24.04 and Debian sid have riscv64 builds)

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking |
|---|---|---|---|---|---|
| abseil-cpp | Core utilities: strings, containers, hash, CRC32C, logging. Mandatory. | Builds (Debian ships libabsl-dev for riscv64) | FAILING: open [bug #2002](https://github.com/abseil/abseil-cpp/issues/2002) -- `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` SEGFAULT on riscv64-linux-gnu (Debian) | No riscv64-specific release artifacts; bundled as source | Partial: test failures present but sentencepiece does not exercise the failing subsystems in normal use |
| protobuf-lite | Serialization for model vocabulary/config. Required. | Builds (Debian ships libprotobuf-dev for riscv64; source builds require `-latomic`) | Largely passing; historical build bug #14549 closed Nov 2023 | No prebuilt protoc binary for riscv64 in any protobuf release (v35.1 covers x86_32, x86_64, aarch64, ppcle_64, s390_64 only) | Mild: no prebuilt protoc forces cross-compilation or source builds in CI pipelines |
| tcmalloc | Optional memory allocator (SPM_ENABLE_TCMALLOC). Reduces fragmentation/latency. | NOT SUPPORTED: `percpu.h` hard-codes support to x86_64 and aarch64; riscv64 falls to slow path. Debian does not ship libtcmalloc for riscv64. | Not applicable | No riscv64 release | No (optional flag; disable with -DSPM_ENABLE_TCMALLOC=OFF) |
| darts_clone | Double-array trie for vocabulary lookup. Pure C++ header-only, bundled in `third_party/`. | Portable | No known failures | N/A (header-only) | None |
| esaxx | Suffix array construction for BPE/unigram training. Pure C++ header-only, bundled in `third_party/`. | Portable | No known failures | N/A (header-only) | None |
| libatomic (system) | 64-bit atomic fallback. Linked via `-latomic` on riscv64 in CMakeLists.txt. | Available (GCC riscv64 runtime) | Available | Shipped with GCC toolchain | None (already handled) |

**Dependency deep-dives:**

**abseil-cpp:** Two test SEGFAULTs on riscv64 Debian (Issue #2002, opened Feb 2026, unassigned). The failing tests are in `hashtablez_sampler` and `cordz_sample_token`, which are sampling/profiling subsystems. sentencepiece uses abseil for string utilities and containers but does not exercise hashtablez or cordz in its main tokenization path. However, if abseil is built with profiling enabled in a production riscv64 deployment, the SEGFAULT can be triggered. Open PR #1986 adds riscv64 CRC32C hardware acceleration via Zbc/Zbkc extensions; this is under Google internal review and not yet merged.

**protobuf-lite:** The primary blocker for riscv64 CI pipelines is the absence of a prebuilt `protoc` binary for riscv64. Multiple community PRs (#23206, #23205, #12244) to add riscv64 protoc to official releases were all abandoned. sentencepiece uses `SPM_PROTOBUF_PROVIDER=internal` by default (bundles protobuf-lite source), so end-users are not directly affected; CI systems that need `protoc` for code generation are affected. This is a mild blocker.

**tcmalloc:** Not a hard blocker. Setting `-DSPM_ENABLE_TCMALLOC=OFF` at cmake time removes the dependency entirely. Performance impact is unquantified; data not available for riscv64 malloc throughput comparison.

---

## 10. Ecosystem Status

sentencepiece is a Python ML/AI package with a significant dependent ecosystem: Hugging Face tokenizers, LLaMA model loaders, T5/ALBERT/XLNet inference stacks, and numerous LLM frameworks all depend on `sentencepiece` as a direct pip dependency.

**RISE wheel builder coverage:** The RISE wheel builder (743 commits, Apache 2.0, created 2024-03-27) provides sentencepiece among approximately 75 packages. Sentencepiece 0.2.1 wheels are available for cp310-cp314 including free-threaded cp314t. The RISE blog post "Easy Installation of Binary Python Packages on riscv64 Devices" (May 14, 2025) describes this infrastructure; sentencepiece is not called out by name in the post.

**Installation from RISE registry:**

```
pip install sentencepiece --index-url https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple
```

**Official PyPI gap:** Until google/taku910 re-merges a corrected PR for riscv64 wheel builds, every riscv64 user who runs `pip install sentencepiece` without the RISE index URL will trigger a ~10-minute source build or fail with a missing compiler error. This affects all downstream LLM and NLP packages that list sentencepiece as a dependency.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1250](https://github.com/google/sentencepiece/issues/1250) | riscv64 distribution? | Open (no maintainer response) | High (distribution blocker) | Asks taku910 to re-add riscv64 PyPI wheels using RISE native CI runners; technically unblocked since RISE runners launched March 2026; maintainer has not responded |
| [#1195](https://github.com/google/sentencepiece/issues/1195) | Add riscv64 (linux_riscv64) wheel to PyPI releases | Closed (regressed) | High (distribution blocker) | Closed as fixed by PR #1196; effectively re-opened in spirit by PR #1226 revert and Issue #1250 |

**Correctness bugs:** None found for riscv64 in sentencepiece itself. The abseil-cpp SEGFAULTs (Issue #2002) are in upstream abseil, not in sentencepiece, and affect profiling/sampling subsystems not used in sentencepiece's core tokenization path.

**Performance bugs:** None found. No benchmark data exists to identify performance regressions.

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

- `docker/setup-qemu-action@v3` fails to register the riscv64 binfmt_misc handler reliably on `ubuntu-latest` runners, causing `exec format error` in manylinux containers. This was the stated technical cause of PR #1226. The fix is upgrading to `setup-qemu-action@v4` or switching to native RISE riscv64 runners. Neither requires sentencepiece code changes.

**Organizational blockers:**

- Single maintainer (`taku910`) with no stated riscv64 priority and no response to Issue #1250 for over a month. No co-maintainers exist who could merge an alternate PR.
- The BDFL governance model means no escalation path exists beyond direct engagement with `taku910`.

**Acceptance probability:** High, conditional on maintainer engagement. The technical fix is one-line (`setup-qemu-action@v3` to `@v4`) or a switch to RISE native runners. The maintainer has already demonstrated willingness to merge riscv64 support (PR #1196 was merged without objection). The barrier is operational, not principled.

**Stated objections:** None on record. The revert PR #1226 has no stated rationale; the CI failure is the inferred cause from post-merge discussion in PR #1196.

---

## 13. Investment Analysis

RISE has already built and is distributing unofficial riscv64 wheels (sentencepiece 0.2.0 and 0.2.1, cp310-cp314t) via their wheel builder registry. The core C++ library builds and tests pass in upstream CI (`cross_build.yml`). The remaining gap is narrow: getting official riscv64 wheels onto PyPI.

### 13.1 Functional Enablement

The only functional gap is the absence of official riscv64 PyPI wheels. The source build works. RISE wheels work. The upstream fix is a CI configuration change in `wheel.yml`, not a code change.

### 13.2 Performance Optimization

SentencePiece has no SIMD or hand-tuned code for any architecture. The tokenization algorithms are scalar C++ for all platforms. RVV vectorization of BPE or unigram decode is theoretically possible but would be a novel optimization not present even on x86 or arm64. The TCG fallback from missing tcmalloc is not quantified; no benchmark data exists.

### 13.3 CI/CD Infrastructure

The cross-build QEMU CI exists and covers riscv64. The gap is native hardware CI for wheel building. RISE native runners (`ubuntu-24.04-riscv`) are available and referenced in Issue #1250 as the preferred path.

### 13.4 Ecosystem Enablement

RISE already covers this via the wheel builder. The downstream impact of landing official PyPI wheels would be eliminating the need for the RISE index URL in all dependent projects.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Re-open PR for riscv64 wheel builds using `setup-qemu-action@v4` or RISE native runners; engage taku910 to merge | 0.5 | RISE / contributor | Critical |
| Functional | Verify abseil-cpp Issue #2002 SEGFAULTs do not affect sentencepiece tokenization path on riscv64 | 0.5 | RISE / contributor | High |
| CI/CD | Add `ubuntu-24.04-riscv` RISE native runner to `wheel.yml` for riscv64 wheel builds | 0.5 | RISE | High |
| CI/CD | Pin QEMU version in `cross_build.yml` to avoid binfmt_misc regressions | 0.25 | Contributor | Medium |
| Performance | Quantify tokenization throughput on riscv64 vs. arm64 baseline (establish benchmark) | 1 | RISE | Medium |
| Performance | RVV vectorization of BPE merge loop or unigram Viterbi decode | 4-8 | Specialist | Low |
| Functional | Upstream prebuilt riscv64 protoc binary to protobuf project (unblocks CI pipelines) | 2 | Protobuf contributor | Low |

**Total critical/high path:** approximately 1.5-2 person-weeks to land official riscv64 wheels on PyPI and close Issue #1250. This is primarily maintainer-engagement work, not engineering work.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Issue #1195: Add riscv64 (linux_riscv64) wheel to PyPI releases](https://github.com/google/sentencepiece/issues/1195)
- [Issue #1250: riscv64 distribution?](https://github.com/google/sentencepiece/issues/1250)
- [PR #1196: feat: add riscv64 to Linux wheel build matrix](https://github.com/google/sentencepiece/pull/1196)
- [PR #1226: Revert PR #1196](https://github.com/google/sentencepiece/pull/1226)
- [Commit 835932f: Fixed build error on riscv64](https://github.com/google/sentencepiece/commit/835932f)
- [google/sentencepiece CMakeLists.txt](https://raw.githubusercontent.com/google/sentencepiece/master/CMakeLists.txt)
- [google/sentencepiece .github/workflows/cross_build.yml](https://github.com/google/sentencepiece/blob/master/.github/workflows/cross_build.yml)
- [google/sentencepiece .github/workflows/wheel.yml](https://github.com/google/sentencepiece/blob/master/.github/workflows/wheel.yml)
- [PyPI sentencepiece 0.2.1 JSON API](https://pypi.org/pypi/sentencepiece/0.2.1/json)
- [RISE wheel builder PyPI simple index for sentencepiece](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/sentencepiece/)
- [RISE wheel builder GitLab project](https://gitlab.com/riseproject/python/wheel_builder)
- [Debian tracker: sentencepiece](https://tracker.debian.org/pkg/sentencepiece)
- [Ubuntu 24.04 (noble) sentencepiece packages](https://packages.ubuntu.com/search?keywords=sentencepiece&suite=noble)
- [abseil-cpp Issue #2002: riscv64 test SEGFAULTs](https://github.com/abseil/abseil-cpp/issues/2002)
- [RISE blog: Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE native riscv64 GitHub Actions runners announcement](https://riseproject.dev) (March 24, 2026 launch of `ubuntu-24.04-riscv` Scaleway EM-RV1 runners)