---
title: sentencepiece
parent: Project Reports
color: blue
dependencies:
  - name: Abseil
    relation: runtime-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: critical
  - name: tcmalloc
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="sentencepiece" %}

# sentencepiece

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for sentencepiece<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

SentencePiece is a C++ library and command-line toolkit for unsupervised text tokenization, implementing BPE (byte-pair encoding) and unigram language-model algorithms. It is the dominant subword tokenizer used in transformer-based NLP models (T5, ALBERT, XLNet, and most multilingual LLMs) and is consumed primarily as a Python wheel (`pip install sentencepiece`), and also as a C++ library via CMake. The CMake build sets `CMAKE_CXX_STANDARD 20`, so the library targets C++20 (not C++17).

**Governance:** No foundation affiliation. Hosted under the `google/` GitHub organization with an explicit README disclaimer: "This is not an official Google product." The project operates under a de facto BDFL model: **Taku Kudo** (`taku910`, taku@google.com) is the dominant committer and holds sole merge/revert authority. No GOVERNANCE.md, MAINTAINERS/OWNERS/CODEOWNERS file, formal tier policy, or TSC/steering committee exists in the repository (confirmed by direct search). Community contributors (e.g., `gounthar`) submit PRs but hold no commit/maintainer rights.

**Corporate affiliation:** Taku Kudo's historical Google affiliation dates to the project's 2018 creation; no current employer is confirmed in available sources. No other corporate maintainers were identified. Google is a Premier Member of RISE, but this reflects Google's general RISE membership, not a sentencepiece-specific sponsorship.

**License:** Apache License 2.0.

**Community culture on new ports:** The maintainer merged riscv64 PyPI wheel support (PR [#1196](https://github.com/google/sentencepiece/pull/1196), 2026-04-14) then reverted it 18 days later (PR [#1226](https://github.com/google/sentencepiece/pull/1226), 2026-05-02) citing a CI "exec format error," with no rationale given in the revert PR body itself. As of 2026-08-12 he has not responded to Issue [#1250](https://github.com/google/sentencepiece/issues/1250), which asks him to explain the revert and reinstate riscv64 wheels using RISE's native riscv64 runners. Separately, the thread on Issue #1250 surfaced and resolved a real build bug (GCC 13 abseil subword-atomic `static_assert` failure, fixed by moving the riscv64 CI leg to GCC 14, confirmed working by taku910 on 2026-08-12) - so the maintainer is engaging with riscv64 build issues even while leaving the wheel-distribution question unanswered. The pattern indicates a maintainer responsive to concrete build bugs but not proactively managing riscv64 as a released platform.

**RISE membership:** SentencePiece itself is not a RISE member project. RISE (via individual contributors `gounthar`/Bruno Verachten and `justeph`) is actively engaging with the repository to push riscv64 adoption, including maintaining an out-of-tree riscv64 wheel index and offering free native riscv64 CI runners - this is "interested outside community" engagement, not an in-repo governance relationship.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-09-30 | `taku910` commits "Fixed build error on riscv64": adds unconditional `-latomic` linkage for riscv64 in `CMakeLists.txt` | [Commit 835932f](https://github.com/google/sentencepiece/commit/835932f) |
| 2026-03-11 | Issue #1195 opened by `gounthar` requesting `linux_riscv64` PyPI wheels, evidenced by a working wheel built via cibuildwheel+QEMU and tested natively on a BananaPi F3 (SpacemiT K1) board; labeled "bug", "Will fix in next release" | [Issue #1195](https://github.com/google/sentencepiece/issues/1195) |
| 2026-03-12 | PR #1196 opened by `gounthar`: adds a QEMU setup step (`docker/setup-qemu-action@v3`) and `riscv64` to `CIBW_ARCHS_LINUX` in `wheel.yml` | [PR #1196](https://github.com/google/sentencepiece/pull/1196) |
| 2026-04-14 | PR #1196 merged by `taku910`; Issue #1195 closed as resolved | [PR #1196](https://github.com/google/sentencepiece/pull/1196) |
| 2026-05-02 | PR #1226 merged by `taku910`: reverts PR #1196's merge commit `3f1a350`, citing an `exec format error` in the manylinux container from a broken QEMU binfmt_misc setup (`docker/setup-qemu-action@v3`); no rationale in the PR body itself | [PR #1226](https://github.com/google/sentencepiece/pull/1226) |
| 2026-05-20 | Issue #1250 opened by `justeph`, asking why #1196 was reverted "without explanation" and proposing reinstatement via RISE's free native riscv64 GitHub Actions runners (`ubuntu-24.04-riscv`) instead of QEMU emulation | [Issue #1250](https://github.com/google/sentencepiece/issues/1250) |
| 2026-06-25 | `taku910` reports a GCC 13 abseil subword-atomic `static_assert` failure breaking the riscv64 build, on the #1250 thread | [Issue #1250](https://github.com/google/sentencepiece/issues/1250) |
| 2026-08-09 | Issue #1303 opened by `gounthar`: intermittent `Fatal Python error: Aborted` in `test_trainer_with_normalizer` under `pytest --parallel-threads 4`, riscv64 + free-threaded CPython 3.14.6 only, not reproducible on x86_64 | [Issue #1303](https://github.com/google/sentencepiece/issues/1303) |
| 2026-08-12 | `taku910` confirms the GCC 13 static_assert issue is fixed by upgrading the riscv64 CI leg to GCC 14; the wheel-distribution question in #1250 remains unanswered as of this date | [Issue #1250](https://github.com/google/sentencepiece/issues/1250) |
| 2026-09-11 | PR #1328 opened by `jdymitarai`, marking `SentencePieceTrainer`/`ThreadPool` tests `thread_unsafe` to address #1303 "on platforms such as riscv64"; taku910 commented he is "putting this on hold until we can identify the cause" [NEEDS VERIFICATION - single-source comment attribution]. Still open/unmerged | [PR #1328](https://github.com/google/sentencepiece/pull/1328) |

**Key contributors:**

| Contributor | Role | Organization |
|---|---|---|
| taku910 (Taku Kudo) | Sole maintainer; authored the `-latomic` fix, merged PR #1196, authored the revert PR #1226 | Google (historical affiliation) |
| gounthar (Bruno Verachten) | Opened Issue #1195, authored PR #1196, opened Issue #1303; tested on BananaPi F3 (SpacemiT K1) hardware; credited in RISE's August 2026 PyTorch blog post for "landing riscv64 support directly in upstream projects, sentencepiece among them" | Individual, active RISE runner user |
| justeph | Opened Issue #1250; works with RISE on riscv64 Python packaging | Individual / RISE-affiliated |
| jdymitarai | Authored PR #1328 (open) | Individual |

**Upstream status:** The C++ library's riscv64 build fix is fully upstream (commit 835932f, Sept 2025) and is continuously verified by `cross_build.yml`, which both builds **and** runs the test suite under QEMU on every push, PR, tag, and release. The Python PyPI wheel path is **not** upstream: it was merged (PR #1196) and reverted (PR #1226) within the same release window, and no released sentencepiece version (latest v0.2.2, 2026-07-12) has ever shipped a riscv64 wheel on PyPI or as a GitHub Release asset.

---

## 3. Upstream Support Tier

No formal tier policy document exists in the repository (no PLATFORMS.md, SUPPORT.md, or docs/platforms). Tier classification below is evidence-based, derived from CI configuration and release-artifact inspection.

| Platform | CI | Release binary | Maintainer response | Effective tier |
|---|---|---|---|---|
| amd64 | Native CI (`cmake.yml`, `wheel.yml`) | PyPI wheels, GitHub release binaries | All features maintained | Officially supported |
| arm64 | Native CI via `ubuntu-24.04-arm` runner in `wheel.yml` | PyPI wheels for aarch64, GitHub release binaries | Full parity with amd64 | Officially supported |
| riscv64 | Cross-compile + QEMU user-mode emulation in `cross_build.yml` (build **and** test); no `wheel.yml` coverage | No PyPI wheel; no GitHub release asset | Wheel support merged then reverted; no response to #1250 as of 2026-08-12 | Build+test CI only, no release artifact |

The riscv64 cross-build CI is genuine, current, and active: it fires on `push` to master, `pull_request`, every tag `v*`, `workflow_dispatch`, and `release` creation, and riscv64 is explicitly excluded from neither the build step nor the "Test on QEMU" step (only `sparc64` and `sh4` are skipped for testing). It produces no published artifact and is structurally separate from the wheel-distribution pipeline (`wheel.yml`), which currently has zero riscv64 references.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

SentencePiece has no architecture-specific source code for **any** ISA, confirmed by direct repository search: zero arch-named files (`*riscv*`, `*amd64*`, `*x86*`, `*arm64*`, `*neon*`, `*sse*`, `*avx*` all return 0 matches outside `.git`), zero architecture preprocessor guards (`__riscv`, `__x86_64__`, `__ARM_NEON`, `__SSE*__`, `__AVX*__` etc. all return 0 matches across `src/`, `lite/`, `python/`, `contrib/`), and zero RVV intrinsic usage (`vfloat32m1_t`, `rvv` both return 0 results). There is no JIT backend, no hand-tuned SIMD path, no crypto component, and no GC.

The "SWAR"-style fast paths in `lite/sentencepiece_lite.cc` (UTF-8 scanning, whitespace/letter detection) use portable `uint64_t` bitwise operations (`std::memcpy`, `std::countr_zero`, XOR/AND masks) with no compiler intrinsics and no architecture guards - they compile to an identical code path on amd64, arm64, or riscv64. The only genuine SIMD dependency in the dependency chain (`utf8_range`) is pulled transitively through protobuf's `third_party/` and is not owned by sentencepiece.

**Component inventory:**

| Component | Description | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| BPE tokenizer (`bpe_model.cc`) | Pure C++ priority-queue algorithm | scalar | scalar | scalar |
| Unigram LM tokenizer (`unigram_model.cc`) | Viterbi decode, pure C++ | scalar | scalar | scalar |
| Unicode normalization | Standard C++ string processing | scalar | scalar | scalar |
| Training algorithms | STL + Abseil containers | scalar | scalar | scalar |
| Atomic operations | `std::atomic`; riscv64 toolchains commonly lack native lock-free support for certain widths, requiring explicit libatomic linkage | built-in | find_library probe | unconditional `-latomic` link (`CMakeLists.txt` lines 163-180) |
| Memory allocator (tcmalloc, optional) | `SPM_ENABLE_TCMALLOC`, default ON | supported | supported | not supported (falls back to glibc malloc) |

**ISA extensions used:** None. No RVV, Zba, Zbb, Zbc, or any other RISC-V extension is referenced anywhere in the codebase. There is no "full (hand-tuned)" or "partial (intrinsics)" tier for any architecture in this project - riscv64 sits on equal technical footing with amd64/arm64 at the code level, because the entire library is architecture-agnostic scalar C++.

---

## 5. Build System, Cross-Compilation, and Toolchain

**`-latomic` requirement (`CMakeLists.txt` lines 163-180):**

```cmake
# Atomic Library (RISC-V, ARM, MIPS, etc.)
if (CMAKE_SYSTEM_PROCESSOR STREQUAL "riscv64")
  string(APPEND CMAKE_C_STANDARD_LIBRARIES " -latomic")
  string(APPEND CMAKE_CXX_STANDARD_LIBRARIES " -latomic")
elseif ((${CMAKE_SYSTEM_PROCESSOR} MATCHES "arm") OR ... )
  find_library(ATOMIC_LIB NAMES atomic libatomic.so libatomic.so.1)
  ...
endif()
```

Unlike ARM/MIPS/PowerPC (which probe via `find_library`), riscv64 unconditionally appends `-latomic` because riscv64 toolchains commonly lack native lock-free instructions for certain atomic widths used by the codebase (indirectly, via Abseil), so the compiler emits calls to libatomic's `__atomic_*` helpers that must be explicitly linked. This fix is committed (commit 835932f, 2025-09-30) and requires no user action.

**Exact riscv64 cross-compile commands (from `.github/workflows/cross_build.yml`, job `CrossBuild`):**

```bash
sudo apt-get update
sudo apt-get install -y sudo qemu-user gdb zstd dwarfdump \
  gcc-14-riscv64-linux-gnu g++-14-riscv64-linux-gnu

mkdir -p build && cd build
env CXX=/usr/bin/riscv64-linux-gnu-g++-14 CC=/usr/bin/riscv64-linux-gnu-gcc-14 \
  cmake .. \
  -DSPM_BUILD_TEST=ON \
  -DSPM_ENABLE_SHARED=OFF \
  -DCMAKE_FIND_ROOT_PATH=/usr/riscv64-linux-gnu \
  -DSPM_CROSS_SYSTEM_PROCESSOR=riscv64 \
  -DCMAKE_CROSSCOMPILING_EMULATOR="qemu-riscv64;-L;/usr/riscv64-linux-gnu"
make -j$(nproc)

qemu-riscv64 -L /usr/riscv64-linux-gnu src/spm_test
qemu-riscv64 -L /usr/riscv64-linux-gnu lite/sentencepiece_lite_test
qemu-riscv64 -L /usr/riscv64-linux-gnu lite/cached_sentencepiece_lite_test
qemu-riscv64 -L /usr/riscv64-linux-gnu lite/sentencepiece_lite_canonical_test
```

`-DSPM_CROSS_SYSTEM_PROCESSOR=<arch>` is a project-specific cache option (`CMakeLists.txt` line 54) that sets `CMAKE_SYSTEM_PROCESSOR` and `CMAKE_CROSSCOMPILING TRUE` - the project's own substitute for a full CMake toolchain file, which is why no `cmake/riscv64.cmake` toolchain file exists anywhere in the repository (confirmed: `cmake/` contains only `ios.toolchain.cmake`, `modify_headers.cmake`, `sentencepieceConfig.cmake.in`).

**Toolchain requirements:**

- **CMake >= 3.14** (`cmake_minimum_required(VERSION 3.14 FATAL_ERROR)`)
- **C++20-capable compiler**: GCC 11+, Clang 13+, or MSVC 2019+ (CMake sets `CMAKE_CXX_STANDARD 20` / `REQUIRED ON`) as the stated language floor
- **CI actually pins GCC/G++ 14** specifically for the riscv64 cross-build leg, a materially newer compiler than the stated C++20 floor, for current Debian/Ubuntu cross-package availability
- No Clang cross-compilation toolchain is documented or CI-tested for riscv64
- The only CI-set riscv64-specific flag is `-DSPM_ENABLE_SHARED=OFF` (static-only, avoids cross-arch shared-library loading issues under QEMU); no flag disables TCMalloc, NFKC/ICU, or Lite for the riscv64 leg

**Known build failures and their resolution status:**

1. **GCC 13 abseil subword-atomic `static_assert` failure** - blocks the riscv64 build because `thread_identity.h`'s 1-byte atomic type assertion fails under GCC 13. Diagnosed on Issue #1250 as a GCC14-vs-GCC13 sub-word atomic inlining requirement. **Fixed**: the CI leg was upgraded to GCC 14, confirmed working by `taku910` on 2026-08-12.
2. **PyPI wheel-build `exec format error`** - `docker/setup-qemu-action@v3` failed to register the riscv64 binfmt_misc handler reliably on `ubuntu-latest` manylinux containers, causing PR #1196's CI to fail post-merge and triggering the revert in PR #1226. `gounthar` proposed upgrading to `docker/setup-qemu-action@v4` as the fix in the PR #1196 thread. **Not yet re-landed** - no open PR currently targets `wheel.yml` with this fix.
3. **tcmalloc on riscv64** - `SPM_ENABLE_TCMALLOC` defaults to ON; tcmalloc's `percpu.h` hard-codes RSEQ per-CPU support to x86_64 and aarch64 only, so a riscv64 build either silently falls back to glibc malloc or requires `-DSPM_ENABLE_TCMALLOC=OFF`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| BPE tokenization | Full | Full | Full |
| Unigram LM tokenization | Full | Full | Full |
| SentencePiece model training | Full | Full | Full |
| C++ library (source/cross build) | Full | Full | Full (builds and passes tests under CI) |
| Python wheel (`pip install sentencepiece`) | Full (PyPI) | Full (PyPI) | Not available on PyPI; source build required, or third-party wheel |
| tcmalloc allocator | Full | Full | Not supported (glibc fallback) |
| Prebuilt `protoc` tooling | Available | Available | Not available from upstream protobuf |

**Functional gaps:**

- No riscv64 PyPI wheel: a `pip install sentencepiece` on riscv64 without an alternate index URL triggers a source build (reported at approximately 10 minutes on a BananaPi F3 / SpacemiT K1, rv64imafdcv, 8 cores @ 1.6 GHz, per Issue #1195) or fails outright if no C++ toolchain is present.
- No prebuilt `protoc` binary for riscv64 from upstream protobuf (affects CI/code-generation pipelines, not end-user tokenization, since sentencepiece bundles protobuf-lite internally by default).

**Performance gaps:**

- tcmalloc unavailable on riscv64: allocation falls back to glibc malloc; the magnitude of this gap is not quantified in any available source.
- Data not available: no riscv64-vs-amd64 or riscv64-vs-arm64 tokenization throughput/latency benchmark exists in any public source. The project's own `doc/performance_benchmark.md` cites approximately 50,000 sentences/sec and 127.60 MB/s at 24 threads on a 24-core x86 CPU, with no riscv64 equivalent ever published. A tangential, unrelated benchmark ("SentencePiece with ARM64 SIMD," blog.alpindale.net) measures a custom C+SIMD reimplementation on Apple M4 (arm64) achieving 6.3x-10.3x speedup over the stock Python library - this is not an upstream sentencepiece benchmark and has no RISC-V comparison point.

**Security hardening gaps:** Data not available: no riscv64-specific security hardening audit was found in any searched source.

**NaN / floating-point semantics:** No riscv64-specific floating-point or NaN-handling bugs were found in any issue, PR, or code search. SentencePiece uses floating-point for unigram LM scores; no correctness divergence on riscv64 has been reported.

---

## 7. CI/CD Infrastructure

All 9 workflow files in `.github/workflows/` were checked (`bazel.yml`, `cifuzz.yml`, `cmake.yml`, `cross_build.yml`, `docs.yml`, `lite.yml`, `stale.yml`, `update_dependencies.yml`, `wheel.yml`); riscv64 appears in exactly one, `cross_build.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository.

**`cross_build.yml` (job `CrossBuild`, covers riscv64):**

- Triggers: `push` (branches: master; tags: `v*`), `pull_request` (branches: master), `workflow_dispatch`, `release` (types: created)
- Runner: `ubuntu-latest` (standard x86_64 GitHub-hosted runner) - not native riscv64 hardware
- Architecture matrix: `i686, arm, aarch64, riscv64, powerpc, powerpc64, powerpc64le, s390x, sparc64, sh4, alpha` (`m68k` excluded entirely for build errors); `fail-fast: false`
- riscv64 build: cross-compiled with `gcc-14-riscv64-linux-gnu` / `g++-14-riscv64-linux-gnu`
- riscv64 test: `qemu-riscv64 -L /usr/riscv64-linux-gnu` runs `src/spm_test`, `lite/sentencepiece_lite_test`, `lite/cached_sentencepiece_lite_test`, and `lite/sentencepiece_lite_canonical_test`. riscv64 is **not** in the test-skip exclusion (`if: matrix.arch != 'sparc64' && matrix.arch != 'sh4'`), so this is genuine build+test CI, not build-only.
- Artifacts: none published from this workflow.

**`wheel.yml` (active, does not cover riscv64):**

- Runners: `ubuntu-latest` (amd64), `ubuntu-24.04-arm` (arm64), `windows-latest`, `windows-11-arm`, `macos-latest`
- `CIBW_ARCHS_LINUX: auto` (post-PR #1226 revert state; riscv64 was present here only during the 2026-04-14 to 2026-05-02 window)
- Output: PyPI wheels for amd64, arm64, Windows, macOS only

**Comparison table:**

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build CI | Native (`cmake.yml`) | Native (`cmake.yml`) | Cross-compile under QEMU (`cross_build.yml`) |
| Test CI | Native | Native | QEMU user-mode emulation (`cross_build.yml`) |
| Wheel CI | Yes (`wheel.yml`) | Yes (`wheel.yml`) | No (merged 2026-04-14, reverted 2026-05-02) |
| RISE native runner usage | No | No | Proposed on Issue #1250; not implemented in `google/sentencepiece` CI as of 2026-08-12 |
| Hardware CI | Native GitHub runner | Native GitHub runner | No (x86_64 host, cross-compiled, QEMU-emulated) |

**RISE runner availability:** RISE's free native riscv64 GitHub Actions runners (`ubuntu-24.04-riscv`, bare-metal on Scaleway EM-RV1) launched 2026-03-24 and are cited explicitly in Issue #1250 as the path to eliminating the QEMU dependency that caused the #1226 revert. They are already the CI backend for RISE's own `build-sentencepiece.yml` workflow in `riseproject-dev/python-wheels`, but no PR has been opened against `google/sentencepiece` to adopt them in `wheel.yml`.

---

## 8. Distribution and Release Status

**Official upstream binaries:**

- **PyPI** (`pip install sentencepiece`): confirmed via direct fetch of `https://pypi.org/pypi/sentencepiece/json` - latest version 0.2.2; all wheel filenames are `manylinux1_i686`, `manylinux1_x86_64`, `manylinux2014_aarch64`, `manylinux2014_x86_64`, plus Windows (`win_amd64`, `win_arm64`) and macOS (`macosx_10_9_x86_64`, `macosx_11_0_arm64`) across Python 3.9-3.14. Zero riscv64 filenames in any released version.
- **GitHub Releases**: confirmed via direct fetch of the releases page - latest release v0.2.2 (2026-07-12) lists approximately 64 assets mirroring the PyPI platform set; no riscv64 asset.

**Distro packages:**

| Distribution | Packages | Version | riscv64 |
|---|---|---|---|
| Ubuntu 26.04 "resolute" (current stable) | `sentencepiece`, `libsentencepiece-dev`, `libsentencepiece0`, `python3-sentencepiece` | 0.2.1-1build1 | Yes - confirmed Published for all four packages, architectures `amd64 arm64 armhf ppc64el riscv64 s390x` (universe/science component), via both `packages.ubuntu.com` and an independent Launchpad architecture-scoped build-page cross-check |
| Debian sid | `sentencepiece`, `libsentencepiece0`, `libsentencepiece-dev`, `python3-sentencepiece` | 0.2.1-2 | Yes - built on Debian's `rv-osuosl-05` riscv64 porter box; not present in any stable Debian release |
| Alpine Linux | sentencepiece | - | No ("No matching packages found") |
| Arch Linux RISC-V port | - | - | Unresolved - search tooling returned no page-level data; neither confirmed nor refuted |
| Fedora | - | - | Unresolved - access blocked by bot challenge during research |

**Unofficial channels:**

- **RISE unofficial wheel index** (GitLab project ID 56254198, `gitlab.com/api/v4/projects/56254198/packages/pypi/simple/sentencepiece`): 14 riscv64 wheel files spanning versions 0.2.0, 0.2.1, and 0.2.2 for CPython 3.10-3.14, including a 3.14t free-threaded build, e.g. `sentencepiece-0.2.2-cp314-cp314-manylinux_2_39_riscv64.whl`. This is the only channel that currently distributes a riscv64 wheel for the latest sentencepiece release (0.2.2).
- `gounthar`'s own PEP 503 index (`gounthar.github.io/riscv64-python-wheels`) and GitHub release tag `riscv64-v0.2.2` on `gounthar/sentencepiece` reportedly mirror these builds, built on RISE's `ubuntu-24.04-riscv` runner [NEEDS VERIFICATION - referenced in research but current contents not independently re-fetched this cycle].

**What a user must do today to get a working riscv64 binary:**

- Option A (RISE unofficial wheels, covers latest 0.2.2): `pip install sentencepiece --index-url https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple`
- Option B (source build, approximately 10 minutes on SpacemiT K1-class hardware): plain `pip install sentencepiece`, requires a C++20 toolchain
- Option C (distro package, version pinned to 0.2.1): `apt install python3-sentencepiece` on Ubuntu 26.04 "resolute" or Debian sid

---

## 9. Dependencies

**Summary table (includes all required direct dependencies plus indirect dependencies surfaced by research):**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking |
|---|---|---|---|---|---|
| Abseil | Runtime dependency, critical. Core strings/containers/hash/CRC32C/logging; mandatory. | Builds - `libabsl-dev`/`libabsl20260107` confirmed Published for riscv64 in Ubuntu 26.04 "resolute" (packages.ubuntu.com + Launchpad cross-check) | Partial failure: 230/232 CTest pass on Debian riscv64; open SEGFAULTs in sampling subsystems (see below) | No GitHub Release binaries for any architecture (source-only project) | Non-blocking for sentencepiece's own tokenization path; see dependency deep-dive |
| Protocol Buffers | Runtime dependency, critical. Model/vocabulary serialization. | No upstream CI build/test coverage for riscv64; distro builds pass (`libprotobuf-dev` confirmed for riscv64 on Ubuntu 24.04 "noble"; 26.04 "resolute" [NEEDS VERIFICATION]) | Not CI-tested upstream | No prebuilt `protoc` for riscv64 in any release (v36.2 covers x86_32/64, ppcle_64, s390_64 only) | Mild - CI pipelines needing a prebuilt `protoc` are affected; sentencepiece bundles protobuf-lite internally (`SPM_PROTOBUF_PROVIDER=internal`), so end users are unaffected |
| tcmalloc | Runtime dependency, optional. Memory allocator (`SPM_ENABLE_TCMALLOC`, default ON). | `google/tcmalloc` itself: riscv64 absent from its own platform support matrix entirely; no CI of any kind for riscv64; `percpu.h` hard-codes RSEQ to x86_64/aarch64 only, so riscv64 silently falls back to glibc malloc. The distinct `gperftools` project (shares the `libtcmalloc` library name) ships `libtcmalloc-minimal4t64` for riscv64 on Ubuntu 24.04/Debian sid. | No known riscv64-specific test failures beyond the silent RSEQ fallback | No release artifacts for any architecture (source-only); gperftools' riscv64 `.deb` is a different project | Non-blocking: `-DSPM_ENABLE_TCMALLOC=OFF` removes the dependency entirely |
| GCC | Build dependency, critical. | CI pins GCC/G++ 14 for the riscv64 cross-build leg (`gcc-14-riscv64-linux-gnu`); C++20 language floor is GCC 11+ | N/A | Standard distro toolchain package | GCC 13 previously broke the riscv64 build via an abseil subword-atomic `static_assert` failure; resolved by pinning GCC 14 (confirmed working 2026-08-12) |
| CMake | Build dependency, critical. | `cmake_minimum_required(VERSION 3.14 FATAL_ERROR)`; drives the whole build including the project's own `SPM_CROSS_SYSTEM_PROCESSOR`/`CMAKE_CROSSCOMPILING_EMULATOR` cross-build substitute for a toolchain file | N/A | N/A (build tool, not shipped) | None |
| QEMU | Test dependency, critical. | `qemu-user` package provides `qemu-riscv64`, used both via `CMAKE_CROSSCOMPILING_EMULATOR` (build-time checks) and directly in the "Test on QEMU" CI step | Is the test-execution mechanism itself for riscv64 in `cross_build.yml`; also the root cause of the PyPI wheel-build `exec format error` that led to PR #1226's revert (via `docker/setup-qemu-action@v3` binfmt_misc incompatibility) | N/A | Directly implicated in the wheel-distribution blocker; `setup-qemu-action@v4` upgrade proposed but not yet applied in `wheel.yml` |
| darts_clone (indirect, bundled `third_party/`) | Double-array trie for vocabulary lookup, optional, header-only | Portable C++, no known riscv64 issues | No known failures | N/A (header-only, no package) | None |
| esaxx-rs (indirect, bundled `third_party/`) | Suffix array construction for BPE/unigram training, optional, header-only | Portable C++, no known riscv64 issues | No known failures | N/A (header-only) | None |

**Dependency deep-dives:**

**Abseil:** Two open issues affect riscv64. [#2002](https://github.com/abseil/abseil-cpp/issues/2002) - `hashtablez_sampler`/`cordz_sample_token` SEGFAULT on riscv64, open approximately 8 months with no maintainer response. [#1702](https://github.com/abseil/abseil-cpp/issues/1702) - missing `-latomic` link on riscv64 GCC 11-12 cross builds, open 2+ years. [#1236](https://github.com/abseil/abseil-cpp/issues/1236) - ILP32E stack-alignment issue, low severity. PR [#1986](https://github.com/abseil/abseil-cpp/pull/1986) adds riscv64 CRC32C hardware acceleration via Zbc/Zbkc extensions, stalled pending hardware access for review. None of these block sentencepiece's own tokenization path, since sentencepiece does not exercise Abseil's hashtablez/cordz profiling subsystems in normal use. Full detail: `project-reports/abseil-cpp.md`.

**Protocol Buffers:** The primary blocker for riscv64 CI pipelines is the absence of a prebuilt `protoc` binary for riscv64 from any upstream protobuf release. Multiple community PRs (#23206, #23205, #12244) and issues (#4425, #14549, #12266, #13114, #17798) attempting to add riscv64 protoc support were closed without landing; maintainer stance as of August 2025 was "not on our roadmap." sentencepiece's default `SPM_PROTOBUF_PROVIDER=internal` bundles protobuf-lite from source, so end users building or installing sentencepiece are unaffected - this only blocks external CI systems that need a standalone `protoc`. Full detail: `project-reports/protocol-buffers.md`.

**tcmalloc:** Not a hard blocker for sentencepiece. `-DSPM_ENABLE_TCMALLOC=OFF` at CMake configure time removes the dependency entirely, and this is the recommended path for a riscv64 build since upstream `google/tcmalloc` has no riscv64 support at all (not even a silent-fallback guarantee verified by CI). Performance impact of the resulting glibc-malloc fallback is unquantified; no riscv64 allocator benchmark data exists in any source. Full detail: `project-reports/tcmalloc.md`.

---

## 10. Ecosystem Status

SentencePiece functions as a foundational dependency for a large ecosystem of downstream Python ML/NLP packages - Hugging Face `transformers` and `tokenizers`, LLaMA-family model loaders, T5/ALBERT/XLNet inference stacks, and numerous LLM serving frameworks all list `sentencepiece` as a direct pip dependency. Each of these packages' own riscv64 availability is gated on sentencepiece's riscv64 wheel availability, since none of them can reasonably vendor a from-source sentencepiece build into their own wheel-build pipelines without the same QEMU/toolchain dependencies documented above.

**RISE wheel-builder coverage:** RISE's wheel builder (`riseproject-dev/python-wheels`, maintained by Rivos and BayLibre, funded by RISE) lists sentencepiece among roughly 90 supported packages, with a dedicated `build-sentencepiece.yml` CI workflow and a `docs/packages/sentencepiece.yaml` manifest tracking versions 0.2.0/0.2.1. This infrastructure is also consumed indirectly: `build-pytorch-tokenizers.yml` statically links `third-party/sentencepiece` (with abseil-cpp, re2, protobuf-lite) into the ExecuTorch `pytorch-tokenizers` riscv64 wheel (PR #2164, author `luhenry`, 2026-09-21), and several other RISE build workflows (`build-xgrammar.yml`, `build-spacy-transformers.yml`, `build-sherpa-onnx.yml`, `build-sherpa-onnx-core.yml`, `build-ctranslate2.yml`) pull in sentencepiece as a build/test dependency. RISE's August 2026 PyTorch-on-riscv64 blog post separately notes that PyTorch itself depends on sentencepiece being buildable on riscv64, and that the GCC 13 abseil atomics bug (documented in Section 5) was a recurring blocker across these dependent builds before the GCC 14 fix landed.

**Installation from the RISE registry:**

```
pip install sentencepiece --index-url https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple
```

**Official PyPI gap and downstream impact:** Until `google/sentencepiece` re-lands riscv64 wheel CI in `wheel.yml`, every riscv64 user who runs `pip install sentencepiece` (or installs any of the downstream packages listed above) without pointing at the RISE index will trigger a source build of unspecified duration or fail outright absent a C++20 toolchain. This is a packaging-infrastructure gap that propagates to the entire dependent ecosystem, not a sentencepiece-specific functional limitation.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1250](https://github.com/google/sentencepiece/issues/1250) | riscv64 distribution? | Open, no distribution-question response as of 2026-08-12 | High (distribution blocker) | Asks taku910 to re-add riscv64 PyPI wheels via RISE native CI runners; the build-bug portion of this thread (GCC 13 abseil atomics) was resolved on this same issue, but the wheel-reinstatement ask itself remains unanswered |
| [#1195](https://github.com/google/sentencepiece/issues/1195) | Add riscv64 (linux_riscv64) wheel to PyPI releases | Closed (regressed by #1226) | High (distribution blocker) | Closed as fixed by PR #1196; effectively reopened in spirit by the PR #1226 revert and Issue #1250 |
| [#1303](https://github.com/google/sentencepiece/issues/1303) | Intermittent abort in `test_trainer_with_normalizer` under `pytest --parallel-threads 4` (free-threaded 3.14, riscv64) | Open | Medium (test flakiness, not a distribution blocker) | riscv64 + free-threaded CPython 3.14.6 only; not reproducible on x86_64; suspected riscv64 weaker-memory-ordering race. Fix tracked in PR #1328 (open, not merged) |
| [#1214](https://github.com/google/sentencepiece/pull/1214) | fix: add missing absl/log/check.h include for DCHECK macros in internal build | Closed, not merged | Low | Affected riscv64 among many architectures, not riscv64-specific; taku910 implemented an equivalent fix directly elsewhere |

**Correctness bugs:** None found in sentencepiece's own code for riscv64. The Abseil SEGFAULTs (issue #2002) are in upstream Abseil's sampling/profiling subsystems, which sentencepiece does not exercise in its core tokenization path. No NaN or floating-point semantics issues were found for riscv64 in any source.

**Performance bugs:** None found. No benchmark data exists from which to identify a regression.

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

- `docker/setup-qemu-action@v3` fails to register the riscv64 binfmt_misc handler reliably on `ubuntu-latest` runners, producing `exec format error` in manylinux wheel-build containers - the stated cause of PR #1226's revert. The proposed fix (upgrade to `setup-qemu-action@v4`, or bypass QEMU entirely via RISE's native riscv64 runners) requires no sentencepiece source-code change, only a `wheel.yml` CI edit.
- A separate, now-resolved build bug (GCC 13 abseil subword-atomic `static_assert` failure) blocked the riscv64 build independent of the wheel question; fixed by pinning GCC 14 in CI (confirmed 2026-08-12).

**Organizational blockers:**

- Single maintainer (`taku910`) with no stated riscv64 priority and no response to Issue #1250's core distribution ask for nearly three months (opened 2026-05-20, last checked 2026-08-12).
- No co-maintainers or TSC exist who could merge an alternate wheel-CI PR without `taku910`'s direct involvement; the BDFL governance model provides no escalation path.
- No PR is currently open to re-land riscv64 wheel CI - the technical fix (QEMU action upgrade or RISE native runner adoption) has been proposed in discussion but not yet implemented as a submitted PR.

**Acceptance probability:** High, conditional on maintainer engagement. The maintainer has already demonstrated willingness to merge riscv64 wheel support once (PR #1196 merged without objection) and has actively engaged with and resolved a separate riscv64 build bug on the same issue thread (#1250, GCC 14 fix, Aug 2026). The barrier is operational bandwidth and CI-reliability risk tolerance, not a stated architectural or policy objection.

**Stated objections:** None on record. The revert (PR #1226) carries no explanatory rationale in its own body; the `exec format error` cause is inferred from the subsequent discussion on PR #1196.

---

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** RISE
- **Justification:** Upstream CI (`.github/workflows/cross_build.yml`) cross-compiles sentencepiece for riscv64 and actually executes the test suite under QEMU user-mode emulation (`qemu-riscv64 ... src/spm_test`, `sentencepiece_lite_test`, etc.) on every push/PR/tag/release - riscv64 is not in the "skip test" exclusion list (only sparc64/sh4 are), so this is build+test CI, not build-only. However, upstream does not publish a riscv64 release artifact: PR [#1196](https://github.com/google/sentencepiece/pull/1196) added riscv64 to the PyPI wheel build matrix and was merged (2026-04-14) but reverted 18 days later via PR [#1226](https://github.com/google/sentencepiece/pull/1226) (QEMU "exec format error" in the manylinux/binfmt_misc setup), and no released sentencepiece version (latest v0.2.2) has ever shipped a riscv64 PyPI wheel. The only consumable riscv64 releases today come from third parties: RISE's unofficial wheel index (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/sentencepiece`, versions 0.2.0-0.2.2) and Ubuntu 26.04/Debian sid distro packages. CI build=yes, CI test=yes, CI release=no, which maps to blue per [the cross-build workflow](https://github.com/google/sentencepiece/blob/master/.github/workflows/cross_build.yml). sentencepiece is a tokenization library, not a performance-optimization library (zero SIMD/JIT/architecture-specific algorithmic code on any platform, confirmed by code search for `riscv`/`rvv`/`vfloat32m1_t`), so no optimization-level modifier applies to this grade.
- **Pending work that could change the grade:** Issue [#1250](https://github.com/google/sentencepiece/issues/1250) (open) asks `taku910` to reinstate riscv64 PyPI wheels using RISE's native riscv64 GitHub Actions runners instead of the QEMU path that caused the #1226 revert; no maintainer response to the distribution question recorded as of 2026-08-12. Issue [#1303](https://github.com/google/sentencepiece/issues/1303) (open) and PR [#1328](https://github.com/google/sentencepiece/pull/1328) (open, not yet merged) track an intermittent riscv64 + free-threaded-CPython test abort unrelated to the wheel question. No PR is currently open to re-land riscv64 wheel CI itself; the required change (a `wheel.yml` edit, either upgrading `docker/setup-qemu-action` to v4 or switching to RISE's native runners) is well-scoped and has precedent (PR #1196 merged once already) but requires maintainer action to submit and merge.

---

## 14. Investment Analysis

RISE has already built and is distributing unofficial riscv64 wheels for the latest sentencepiece release (0.2.0 through 0.2.2, including a free-threaded cp314t build) via its own wheel-builder registry, and provides free native riscv64 CI runners that remove the QEMU dependency responsible for the upstream revert. The core C++ library already builds and passes tests in upstream CI. The remaining gap is narrow and specific: getting an official riscv64 wheel-build job re-landed in `wheel.yml` and merged by the sole upstream maintainer.

### 14.1 Functional Enablement

The only functional gap is the absence of an official riscv64 PyPI wheel. The source build works (approximately 10 minutes on SpacemiT K1-class hardware); RISE's unofficial wheels work today. The fix is a CI configuration change to `wheel.yml` (QEMU action upgrade or RISE runner substitution), not a sentencepiece code change. This work has not been done by RISE yet in the upstream repository - only in RISE's own fork/registry - so it is not already covered.

### 14.2 Performance Optimization

Not applicable as a distinct investment area: sentencepiece has no SIMD, JIT, or hand-tuned code for any architecture (Section 4), so there is no RISC-V-specific optimization gap to close relative to amd64/arm64. Any RVV vectorization of the BPE merge loop or unigram Viterbi decode would be a novel optimization not present on any platform today, not a parity fix. No benchmark data exists to establish whether such work would be justified.

### 14.3 CI/CD Infrastructure

The riscv64 cross-build+test CI (`cross_build.yml`) already exists and is maintained upstream at no cost to RISE. The gap is wheel-build CI specifically, for which RISE native runners (`ubuntu-24.04-riscv`) are already provisioned and referenced in Issue #1250 as the preferred path - this is a configuration/advocacy task, not infrastructure buildout.

### 14.4 Ecosystem Enablement

RISE's wheel-builder registry already covers this gap for sentencepiece directly and for dependents such as `pytorch-tokenizers` (via static linking, PR #2164). Landing official upstream PyPI wheels would eliminate the need for every downstream project in Section 10 to reference the RISE index URL, but does not unblock anything that is currently fully blocked - it converts a workaround into a standard installation path.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Prepare and submit a `wheel.yml` PR re-adding riscv64 (upgrade `docker/setup-qemu-action` to v4, or switch to RISE native `ubuntu-24.04-riscv` runners); engage `taku910` via Issue #1250 to merge | 0.5-1 | RISE / contributor | Critical |
| Functional | Confirm the resolved GCC 14 fix (Issue #1250) is reflected in any re-landed wheel-build CI leg, to avoid reintroducing the GCC 13 static_assert failure | 0.25 | RISE / contributor | High |
| CI/CD | Add `ubuntu-24.04-riscv` RISE native runner to `wheel.yml` for riscv64 wheel builds, removing the QEMU exec-format-error failure class entirely | 0.5 | RISE | High |
| Functional | Help land PR #1328 (thread_unsafe test markers) to close Issue #1303's riscv64 free-threaded test flakiness | 0.25 | RISE / contributor | Medium |
| Performance | Establish a riscv64-vs-arm64 tokenization throughput baseline (no benchmark currently exists) | 1 | RISE | Medium |
| Performance | RVV vectorization of BPE merge loop or unigram Viterbi decode (novel work, not parity work - no platform has this today) | 4-8 | Specialist | Low |
| Functional | Upstream a prebuilt riscv64 `protoc` binary to the protobuf project (unblocks CI pipelines needing standalone protoc; does not affect sentencepiece's own default internal-protobuf build) | 2 | Protobuf contributor | Low |

**Total critical/high path:** approximately 1.5-2 person-weeks to prepare, submit, and land official riscv64 wheel-build CI and close the distribution question tracked in Issue #1250. This is primarily maintainer-engagement and CI-configuration work, not novel engineering.

---

## 15. References

- [Issue #1195: Add riscv64 (linux_riscv64) wheel to PyPI releases](https://github.com/google/sentencepiece/issues/1195)
- [Issue #1250: riscv64 distribution?](https://github.com/google/sentencepiece/issues/1250)
- [Issue #1303: Intermittent abort in test_trainer_with_normalizer under pytest --parallel-threads 4](https://github.com/google/sentencepiece/issues/1303)
- [PR #1196: feat: add riscv64 to Linux wheel build matrix](https://github.com/google/sentencepiece/pull/1196)
- [PR #1226: Revert PR #1196](https://github.com/google/sentencepiece/pull/1226)
- [PR #1214: fix: add missing absl/log/check.h include (closed, not merged)](https://github.com/google/sentencepiece/pull/1214)
- [PR #1328: test(python): mark SentencePieceTrainer and ThreadPool tests as thread_unsafe (fixes #1303)](https://github.com/google/sentencepiece/pull/1328)
- [Commit 835932f: Fixed build error on riscv64](https://github.com/google/sentencepiece/commit/835932f)
- [google/sentencepiece .github/workflows/cross_build.yml](https://github.com/google/sentencepiece/blob/master/.github/workflows/cross_build.yml)
- [google/sentencepiece .github/workflows/wheel.yml](https://github.com/google/sentencepiece/blob/master/.github/workflows/wheel.yml)
- [google/sentencepiece CMakeLists.txt](https://raw.githubusercontent.com/google/sentencepiece/master/CMakeLists.txt)
- [google/sentencepiece releases](https://github.com/google/sentencepiece/releases)
- [PyPI sentencepiece JSON API](https://pypi.org/pypi/sentencepiece/json)
- [RISE wheel builder PyPI simple index for sentencepiece](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/sentencepiece/)
- [RISE wheel builder GitLab project](https://gitlab.com/riseproject/python/wheel_builder)
- [riseproject-dev/python-wheels (sentencepiece build workflow and manifest)](https://github.com/riseproject-dev/python-wheels)
- [PR #2164: pytorch-tokenizers: Add version 1.4.1 (riscv64, statically links sentencepiece)](https://github.com/riseproject-dev/python-wheels/pull/2164)
- [Ubuntu "resolute" (26.04) sentencepiece packages](https://packages.ubuntu.com/search?keywords=sentencepiece&suite=resolute&searchon=names&section=all)
- [Debian tracker: sentencepiece](https://tracker.debian.org/pkg/sentencepiece)
- [abseil-cpp Issue #2002: riscv64 test SEGFAULTs](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp Issue #1702: missing -latomic link on riscv64](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp PR #1986: riscv64 CRC32C Zbc/Zbkc acceleration](https://github.com/abseil/abseil-cpp/pull/1986)
- [RISE blog: PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [RISE blog: Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE blog: Python Now Officially Supports RISC-V](https://riseproject.dev/2026/08/24/)
- [RISE Project website](https://riseproject.dev)