---
title: Edge Impulse Processing Blocks
parent: Project Reports
color: orange
dependencies:
  - name: NumPy
    relation: runtime-dependency
    criticality: critical
  - name: SciPy
    relation: runtime-dependency
    criticality: critical
  - name: scikit-learn
    relation: runtime-dependency
    criticality: critical
  - name: Pillow
    relation: runtime-dependency
    criticality: critical
  - name: PyWavelets
    relation: runtime-dependency
    criticality: critical
  - name: matplotlib
    relation: runtime-dependency
    criticality: optional
  - name: librosa
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="edge-impulse-processing-blocks" %}

# Edge Impulse Processing Blocks

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Edge Impulse Processing Blocks<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[Edge Impulse Processing Blocks](https://github.com/edgeimpulse/processing-blocks) is a server-side reference implementation of the DSP ("digital signal processing") feature-extraction blocks used by Edge Impulse Studio - the vendor's ML-for-embedded-devices platform. Each block (`flatten`, `image`, `mfcc`, `mfe`, `raw`, `spectral_analysis`, `spectrogram`) is a pure-Python module (`dsp.py`) wrapped in a small HTTP server (`dsp-server.py`) and packaged as a per-block Docker image, used to prototype and preview DSP transforms inside the Studio UI before they are compiled into the embedded C++ inferencing SDK.

The repository is an ordinary Edge Impulse Inc. (a commercial vendor) open-source project, licensed BSD-3-Clause-Clear. There is no foundation governance model, no MAINTAINERS/CODEOWNERS file, no stated tier policy, and no documented community process for architecture ports. Contribution model is plain GitHub pull requests reviewed by the Edge Impulse team. The docs page (docs.edgeimpulse.com/docs/edge-impulse-studio/processing-blocks) contains no governance or platform-support statement of its own.

The repository's own README states that the corresponding C++ blocks - i.e., the architecture-specific, hand-tuned implementation used on-device - live in a separate repository, `edgeimpulse/inferencing-sdk-cpp`, which is out of scope for this report.

## 2. Port History and Upstreaming Timeline

No RISC-V porting activity exists in this repository. Exhaustive searches across issues, pull requests, and commits (query variants: `riscv`, `riscv64`, `"risc-v"`, `risc` in title/body, via `search_issues`, `search_pull_requests`, `search_commits`) all returned zero results. A full local-clone grep for "riscv" (case-insensitive) across the entire tracked tree returned zero matches.

| Date | Event | Source |
|---|---|---|
| - | No RISC-V-related commit, issue, or PR has ever been filed | [GitHub search across issues/PRs/commits](https://github.com/edgeimpulse/processing-blocks) (0 results, all query variants) |

There is no port, in progress or historical. It is not upstream because it does not exist.

## 3. Upstream Support Tier

No formal platform-support tier policy exists in the repository or its documentation. The only Linux targets Edge Impulse documents (for the related CLI/SDK/Runner products, not this repo specifically) are x86_64, ARMv7, and AARCH64 - riscv64 is not mentioned.

| Architecture | CI build | CI test | Official release artifact |
|---|---|---|---|
| amd64 | yes (`ubuntu-latest` GitHub Actions runner) | yes (`python -m unittest discover tests`) | Docker images built `FROM ubuntu:20.04`, no `--platform` pin |
| arm64 | no (no matrix, no separate job) | no | none found |
| riscv64 | no | no | none found |

## 4. Technical Architecture and RISC-V-Specific Subsystems

The repository contains no architecture-specific code of any kind, for any architecture. A full inventory of the 109 tracked files found zero `.c`/`.cpp`/`.h`/`.hpp`/`.S` files; `mcp__github__search_code` queries for `__riscv repo:edgeimpulse/processing-blocks` and `extension:c repo:edgeimpulse/processing-blocks` both returned `total_count: 0`. No `arch/`, `simd/`, or architecture-named directories exist. Grep across the tree for `simd|avx|sse2|neon|intrinsic|__aarch64__|__x86_64__|__arm__` returned no hits except the string "Cython" inside each Dockerfile's `pip install` line (a generic build dependency, not gated code).

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| All 7 processing blocks (mfcc, mfe, image, raw, spectral_analysis, spectrogram, flatten) | scalar (portable Python/NumPy, not hand-tuned) | scalar (same, untested by CI) | missing (no code path exists at all - not stubbed, simply never referenced) |

This is expected: the repository's own README states the hand-tuned, architecture-specific C++ implementation lives in the separate `edgeimpulse/inferencing-sdk-cpp` repository, which was out of scope for this research pass.

## 5. Build System, Cross-Compilation, and Toolchain

There is no build system beyond `pip install -r requirements.txt` plus Docker. No `CMakeLists.txt`, no `cmake/` directory, no `BUILDING.md`/`INSTALL`, no `docs/` directory of any kind exist in the repository. All 7 per-block Dockerfiles are byte-identical (md5 `6a1d0fad74eb15ff395ffd998ad50baf`):

```dockerfile
FROM ubuntu:20.04
ARG DEBIAN_FRONTEND=noninteractive
WORKDIR /app
RUN apt update && apt install -y python3 python3-pip libatlas-base-dev gfortran-9 libfreetype6-dev wget && \
    ln -s $(which gfortran-9) /usr/bin/gfortran
RUN pip3 install -U pip==22.0.3
RUN pip3 --no-cache-dir install Cython==0.29.24
COPY requirements-blocks.txt ./
RUN pip3 --no-cache-dir install -r requirements-blocks.txt
COPY third_party /third_party
COPY . ./
EXPOSE 4446
ENTRYPOINT ["python3", "-u", "dsp-server.py"]
```

No `--platform` flag, no `buildx` multi-arch config, no QEMU emulation setup anywhere. No known build failures are documented because riscv64 has never been attempted, as far as any accessible source shows.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runs at all | yes (CI-verified) | untested (no CI) | untested (no CI, no known attempts) |
| Docker image builds | yes | untested | untested (no `--platform` support, no riscv64 base tested) |
| Package installable via pip | yes | partially (see Section 9 dependency table) | uncertain - direct-pin numerics/JIT dependencies have documented riscv64 gaps (Section 9) |

No functional gaps beyond "untested" can be stated with confidence for the project's own code, because it is pure Python with no architecture branches. However, its transitive dependency chain (Section 9) has confirmed riscv64 issues: `numba`/`llvmlite`'s JIT code generation is reported broken on riscv64 hardware, and `scikit-learn` has no riscv64 build in Ubuntu 26.04 at all. No security-hardening gaps or NaN/floating-point semantics issues specific to this repository were found (no riscv64-specific bug reports exist for it), though numpy's own riscv64 test suite currently has open failures (see Section 9).

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** The repository's `.github/workflows/` directory contains exactly one file, `python-unit-tests.yml`:

```yaml
name: Python application
on:
  workflow_dispatch:
  pull_request:
    branches: [ master ]
permissions:
  contents: read
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - name: Remove unnecessary files
      run: |
        sudo rm -rf /usr/share/dotnet
        sudo rm -rf "$AGENT_TOOLSDIRECTORY"
    - uses: actions/checkout@v3
    - uses: actions/setup-python@v3
      with:
        python-version: "3.9"
    - id: cache-python
      uses: actions/cache/restore@v3
      with:
        path: ${{ env.pythonLocation }}
        key: ${{ env.pythonLocation }}-${{ hashFiles('requirements.txt') }}
    - run: |
        python -m pip install --upgrade pip
        pip install -r requirements.txt
    - if: steps.cache-python.outputs.cache-hit != 'true'
      uses: actions/cache/save@v3
      with:
        path: ${{ env.pythonLocation }}
        key: ${{ steps.cache-python.outputs.cache-primary-key }}
    - name: Test with unittest
      run: |
        python -m unittest discover tests
```

Trigger is `workflow_dispatch` and `pull_request` to `master` only (no `push`, no `schedule`). No other CI system exists in the repository: confirmed absent are `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, and `.circleci/`.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | `ubuntu-latest` (GitHub-hosted) | none | none |
| Matrix / cross-arch step | n/a | none | none, no QEMU |
| RISE runner usage | n/a | n/a | none - no reference to `riseproject-dev` runners anywhere in the workflow |

## 8. Distribution and Release Status

No riscv64 binary, wheel, or package exists for this project through any channel checked:

- **GitHub Releases**: one release, `v20211014`. Its asset list (fetched via the `expanded_assets/v20211014` endpoint) contains exactly `v20211014.zip` and `v20211014.tar.gz` - generic source archives, no riscv64-specific asset. Direct release listing via `mcp__github__list_releases` was blocked (session's GitHub MCP is scoped only to `riseproject-dev/sw-ecosystem`); the public web endpoint was used instead. [GitHub releases page](https://github.com/edgeimpulse/processing-blocks/releases).
- **PyPI**: `https://pypi.org/pypi/edge-impulse-processing-blocks/json` returns HTTP 404 - the package does not exist on PyPI under this name at all, confirmed via both the JSON API and the simple index.
- **RISE Python wheel builder**: `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-processing-blocks/` redirects (302) to the same nonexistent PyPI project - no wheels.
- **Ubuntu 26.04 "resolute"**: project-graph SPARQL query for `edge impulse processing blocks` / `python3-edge-impulse-processing-blocks` / `libedge-impulse-processing-blocks` against riscv64 binaries in suite `resolute` returned an empty result set. A live search on [packages.ubuntu.com](https://packages.ubuntu.com/) for `edge-impulse-processing-blocks` in suite `resolute` returned "Sorry, your search gave no results."
- **Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/)): search for "edge impulse processing blocks" returns no matching package.

**What a user must do today**: there is no packaged distribution path at all, for any architecture other than what the amd64-only Docker images provide. To run this on riscv64, a user would need to build the Docker image themselves against a riscv64 base image (untested) and separately resolve the dependency-chain gaps documented in Section 9 (in particular, `numba`/`llvmlite`'s JIT and the complete absence of a `scikit-learn` riscv64 build in Ubuntu 26.04).

## 9. Dependencies

The project has no CMakeLists.txt/setup.py/Cargo.toml/go.mod. The manifest is `requirements.txt` at the repo root plus seven identical per-block `*/requirements-blocks.txt` files (flatten, image, mfcc, mfe, raw, spectral_analysis, spectrogram), all pinning the same 14 packages. Transitive JIT/numerics dependencies were resolved from `librosa==0.8.0`'s upstream `install_requires`.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release (PyPI) | Blocking issues |
|---|---|---|---|---|---|
| numpy==1.21.5 | Numerics core | found in Ubuntu 26.04 resolute (`python3-numpy`) | failing - 111 tests fail on riscv64 with numpy 2.4.5 ([numpy#32376](https://github.com/numpy/numpy/issues/32376), open; [numpy#32461](https://github.com/numpy/numpy/issues/32461), open) | no official riscv64 manylinux wheels ([numpy#30216](https://github.com/numpy/numpy/issues/30216), open; RISE builds unofficial wheels) | numpy#32376, numpy#32461, numpy#30216, RVV/NEP-054 SIMD support open ([numpy#26200](https://github.com/numpy/numpy/issues/26200)) |
| scipy==1.7.3 | Numerics (FFT, BLAS/LAPACK) | found in Ubuntu 26.04 resolute (`python3-scipy`) | flaky - hangs under QEMU ([scipy#22839](https://github.com/scipy/scipy/issues/22839), open); `special.sph_harm` NaN mismatch ([scipy#22753](https://github.com/scipy/scipy/issues/22753), open) | not confirmed | scipy#22839, scipy#22753 |
| scikit-learn==1.3.0 | ML numerics (numpy/scipy/joblib-based) | not found in Ubuntu 26.04 resolute | n/a | no riscv64 wheels | [scikit-learn#30123](https://github.com/scikit-learn/scikit-learn/issues/30123) closed as "not planned" |
| numba (via librosa) | JIT backend (LLVM-based) | found in Ubuntu 26.04 resolute (`python3-numba`) | unclear/at-risk - depends on llvmlite JIT codegen, reported broken below | no riscv64 wheels | [numba#6559](https://github.com/numba/numba/issues/6559) "RISC-V Support" open; [numba#10389](https://github.com/numba/numba/issues/10389) closed unresolved |
| llvmlite (via numba) | JIT backend - LLVM Python bindings | found in Ubuntu 26.04 resolute (`python3-llvmlite`) | broken at JIT-codegen level - `LLVM ERROR: Unsupported code model for lowering` when running JIT'd code on riscv64 hardware ([llvmlite#923](https://github.com/llvmlite/llvmlite/issues/923), open) | no riscv64 wheels | llvmlite#923 - package builds, but its core JIT function is reported non-functional |
| Pillow==9.0.1 | Image decode/encode | found in Ubuntu 26.04 resolute (`python3-pil`) | one format-specific test, since closed ([Pillow#9603](https://github.com/python-pillow/Pillow/issues/9603), closed 2026-05) | no riscv64 PyPI wheel ([Pillow#9462](https://github.com/python-pillow/Pillow/issues/9462), open) | Pillow#9462 |
| PyWavelets==1.3.0 | Wavelet transforms (C extension) | found in Ubuntu 26.04 resolute (`python3-pywt`) | no riscv64 issues found (0 results) | not confirmed | none found |
| matplotlib==3.5.1 | Plotting (FreeType/Agg) | found in Ubuntu 26.04 resolute (`python3-matplotlib`) | old closed report ([matplotlib#11325](https://github.com/matplotlib/matplotlib/issues/11325), closed 2020); open FreeType-linkage issue ([matplotlib#25123](https://github.com/matplotlib/matplotlib/issues/25123), open) | not confirmed | matplotlib#25123 |
| resampy (via librosa) | Audio resampling, numba-JIT-accelerated | not found in Ubuntu 26.04 resolute | n/a | no riscv64 wheels | no GitHub riscv64 issues found |
| soundfile (via librosa) | Python binding to libsndfile (C lib) | not found in Ubuntu 26.04 resolute, despite `libsndfile1` itself being available | n/a | no riscv64 wheels | binding gap - underlying C lib is packaged, Python cffi wrapper is not |
| joblib / decorator / pooch / audioread (via librosa) | Pure-Python support libs | not found in Ubuntu 26.04 resolute for any | n/a | not confirmed | pure-Python, not architecture-blocked, simply not yet built |

**Critical path: `librosa -> numba -> llvmlite`.** This is the chain's only JIT dependency and its weakest link - `llvmlite`'s JIT code generation is reported outright broken on riscv64 hardware ([llvmlite#923](https://github.com/llvmlite/llvmlite/issues/923)), even though Debian/Ubuntu build `python3-llvmlite` and `python3-numba` for riscv64. Build success does not imply runtime JIT correctness. `numpy`/`scipy` build for riscv64 in Ubuntu 26.04 but currently fail upstream tests (numpy#32376: 111 failures as of the report cited, open). `scikit-learn` has no riscv64 build in Ubuntu 26.04 at all, and upstream closed the RISC-V request as "not planned" (scikit-learn#30123). PyPI wheel availability lags the Ubuntu archive across the board - none of the checked dependencies have confirmed official riscv64 wheels on PyPI, meaning `pip install -r requirements.txt` on riscv64 today would fall back to slow/likely-broken source builds for several packages, with `python3-sklearn`, `python3-soundfile`, `python3-resampy`, `python3-joblib`, `python3-pooch`, `python3-decorator`, and `python3-audioread` not even available as riscv64 apt packages in Ubuntu 26.04 (resolute) as a fallback. Only `numpy` and `numba` among this dependency set have existing RISE ecosystem status reports; `scipy` is tracked in `projects.yml` but has no report on file; `scikit-learn`, `Pillow`, `matplotlib`, `PyWavelets`, `llvmlite`, `librosa`, and `libsndfile` are not tracked at all.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64 issues, PRs, or commits exist in edgeimpulse/processing-blocks itself | n/a | n/a | Confirmed via `search_issues`, `search_pull_requests`, `search_commits` (all query variants: `riscv`, `riscv64`, `"risc-v"`) all returning 0 results, plus a repo-wide grep for "riscv" returning 0 matches |

No correctness bugs specific to this repository on riscv64 exist because no riscv64 activity of any kind has ever occurred against it. Relevant correctness/build issues exist one level down, in dependencies (see Section 9): [numpy#32376](https://github.com/numpy/numpy/issues/32376), [scipy#22839](https://github.com/scipy/scipy/issues/22839), [llvmlite#923](https://github.com/llvmlite/llvmlite/issues/923), [scikit-learn#30123](https://github.com/scikit-learn/scikit-learn/issues/30123).

## 12. Objections and Upstream Blockers

No stated objections exist because no RISC-V request or discussion has ever been raised against this repository - there is nothing to object to. No organizational blocker (e.g., a tier policy excluding new architectures) exists either, since no tier policy exists at all. The practical blocker is that this repository has never been a target of any porting effort, upstream or third-party, and its critical numeric/JIT dependency chain (`numba`/`llvmlite`, `scikit-learn`) currently has confirmed, unresolved riscv64 gaps upstream that would need to close first regardless of any work on this repository itself. Acceptance probability for a hypothetical riscv64-support PR cannot be assessed - there is no precedent of any architecture-related PR being filed against this repo, merged or rejected.

## 13. Readiness Assessment

- **Color:** orange (no upstream CI for riscv64, no distribution package under any name)
- **Release provider:** none - no upstream, RISE, distro, or third-party channel publishes a riscv64 artifact for this project (verified across PyPI, RISE wheel builder, Ubuntu 26.04/resolute, Arch RISC-V, and GitHub releases; see Section 8)
- This is not an optimization-purpose project (it is a functional DSP reference-implementation/service, not a project whose value proposition is speed over a simpler alternative), so the Step 2 optimization modifier does not apply and no Optimization level is reported.
- **Justification:** The project's only CI workflow, [`.github/workflows/python-unit-tests.yml`](https://github.com/edgeimpulse/processing-blocks/blob/master/.github/workflows/python-unit-tests.yml), runs exclusively on `ubuntu-latest` (x86_64) with no matrix, no QEMU step, and no riscv64 runner - there is no upstream riscv64 CI of any kind. No Linux distribution ships a riscv64 package for this project under any candidate name (Ubuntu 26.04/resolute project-graph query returned an empty result set; [packages.ubuntu.com](https://packages.ubuntu.com/) live search returned "no results"), so the distribution floor that would otherwise lift a no-CI project to yellow does not apply - there is no package to check for patch status. This places the project at orange: no upstream CI, no distro fallback, and no confirmed breakage (which would require red).
- **Pending work that could change the grade:** None identified. No open PR, issue, or RISE working-group involvement touches this repository (confirmed against the full 25-repo `riseproject-dev` GitHub org listing and the RISE blog - see Section 16). Edge Impulse is not a RISE member (premier or general). Any future grade change would first require (a) someone adding a riscv64 CI job or Docker multi-arch build to this repository, and (b) the transitive dependency-chain blockers in Section 9 - particularly llvmlite's JIT-codegen failure on riscv64 ([llvmlite#923](https://github.com/llvmlite/llvmlite/issues/923)) and scikit-learn's absence from Ubuntu 26.04 riscv64 - being resolved upstream, since those are prerequisites for this project to function correctly on the architecture even if it were packaged.

## 14. Investment Analysis

RISE has not funded, tracked, or otherwise touched this project (Section 16; confirmed against the full `riseproject-dev` org listing and blog). No work here is already covered - all of the following is unclaimed.

### 14.1 Functional Enablement

Two independent tracks are required before this project can be said to "work" on riscv64:
1. Verify/enable the project's own pure-Python code path on riscv64 (low effort - no architecture-specific code exists to port, but needs a riscv64 CI job or Docker image to actually confirm it).
2. Close the transitive dependency gaps: llvmlite's JIT-codegen failure ([llvmlite#923](https://github.com/llvmlite/llvmlite/issues/923)) blocks any code path that uses `librosa`'s numba-accelerated functions (used by the `mfcc`/`mfe` blocks' feature extraction); `scikit-learn`'s complete absence from Ubuntu 26.04 riscv64 blocks any block depending on it. Both are upstream, third-party blockers outside this repository's control.

### 14.2 Performance Optimization

Not applicable to this repository - it contains no architecture-specific code for any ISA and is not an optimization-purpose project. Any hand-tuned/SIMD DSP work belongs to the separate `edgeimpulse/inferencing-sdk-cpp` repository, which is out of scope here.

### 14.3 CI/CD Infrastructure

Add a riscv64 job to `.github/workflows/python-unit-tests.yml` (QEMU-based at minimum, given no confirmed native riscv64 GitHub-hosted runners referenced anywhere in this repo or org). Low complexity given the project's single, simple test invocation (`python -m unittest discover tests`), but its value is gated on dependency availability (Section 9) - a riscv64 CI job would currently fail or be blocked at the `pip install -r requirements.txt` step for `scikit-learn` and would risk failing on any `librosa` MFCC/MFE code path due to the llvmlite JIT bug.

### 14.4 Ecosystem Enablement

Not applicable as a standalone section (see Section 10 omission) - this repository is a small, self-contained set of Docker-packaged services, not a package with a dependent ecosystem of its own. However, its dependency chain (numpy, scipy, scikit-learn, numba, llvmlite, Pillow, matplotlib, PyWavelets, librosa and its own sub-dependencies) is shared, general-purpose Python numerics infrastructure whose riscv64 enablement would benefit far more projects than this one alone - the correct place to invest is upstream in those projects, not in `edgeimpulse/processing-blocks` itself.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add riscv64 Docker/CI verification for the project's own pure-Python code path | 1 | Edge Impulse or third party | Low |
| Functional | Resolve llvmlite JIT-codegen failure on riscv64 ([llvmlite#923](https://github.com/llvmlite/llvmlite/issues/923)) - blocks librosa/numba-dependent MFCC/MFE feature extraction | Data not available: no effort estimate found in llvmlite#923 or elsewhere | llvmlite upstream (not this repo) | High (blocks a core feature-extraction path) |
| Functional | Get scikit-learn built for Ubuntu riscv64 (currently absent; upstream request closed "not planned") | Data not available: no effort estimate found in scikit-learn#30123 | scikit-learn upstream / distro packagers | Medium |
| CI/CD | Add riscv64 job (QEMU) to `python-unit-tests.yml` | 0.5 | Edge Impulse | Low |
| Distribution | Publish a PyPI package for this project at all (currently does not exist under any name) and/or a multi-arch Docker image | Data not available: no scope estimate possible without a maintainer decision on packaging strategy | Edge Impulse | Low |

## 15. Updates

(No updates yet - initial report dated 2026-09-08.)

## 16. References

- [Edge Impulse Processing Blocks repository](https://github.com/edgeimpulse/processing-blocks)
- [Edge Impulse Processing Blocks documentation](https://docs.edgeimpulse.com/docs/edge-impulse-studio/processing-blocks)
- [python-unit-tests.yml CI workflow](https://github.com/edgeimpulse/processing-blocks/blob/master/.github/workflows/python-unit-tests.yml)
- [GitHub releases page (v20211014)](https://github.com/edgeimpulse/processing-blocks/releases)
- [PyPI JSON API for edge-impulse-processing-blocks (404)](https://pypi.org/pypi/edge-impulse-processing-blocks/json)
- [packages.ubuntu.com search (resolute, no results)](https://packages.ubuntu.com/)
- [Arch Linux RISC-V port search](https://archriscv.felixc.at/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project site](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)
- [numpy#32376 - riscv64 test failures](https://github.com/numpy/numpy/issues/32376)
- [numpy#32461 - umath spurious-fpexception failures](https://github.com/numpy/numpy/issues/32461)
- [numpy#30216 - riscv64 manylinux wheels](https://github.com/numpy/numpy/issues/30216)
- [numpy#26200 - RVV/NEP-054 SIMD support](https://github.com/numpy/numpy/issues/26200)
- [scipy#22839 - hanging tests under QEMU](https://github.com/scipy/scipy/issues/22839)
- [scipy#22753 - special.sph_harm NaN mismatch](https://github.com/scipy/scipy/issues/22753)
- [scikit-learn#30123 - RISC-V support, closed not planned](https://github.com/scikit-learn/scikit-learn/issues/30123)
- [numba#6559 - RISC-V Support](https://github.com/numba/numba/issues/6559)
- [numba#10389 - About RISC-V, closed](https://github.com/numba/numba/issues/10389)
- [llvmlite#923 - Does llvmlite support riscv64?](https://github.com/llvmlite/llvmlite/issues/923)
- [Pillow#9603 - AVIF write test, closed](https://github.com/python-pillow/Pillow/issues/9603)
- [Pillow#9462 - riscv64 PyPI wheel request](https://github.com/python-pillow/Pillow/issues/9462)
- [matplotlib#11325 - riscv64 test error, closed 2020](https://github.com/matplotlib/matplotlib/issues/11325)
- [matplotlib#25123 - default to system freetype on riscv64](https://github.com/matplotlib/matplotlib/issues/25123)
