---
title: Edge Impulse Python SDK
parent: Project Reports
color: green
dependencies:
  - name: edgeimpulse-api
    relation: runtime-dependency
    criticality: critical
  - name: requests
    relation: runtime-dependency
    criticality: critical
  - name: python-socketio
    relation: runtime-dependency
    criticality: critical
  - name: NumPy
    relation: runtime-dependency
    criticality: optional
  - name: pandas
    relation: runtime-dependency
    criticality: optional
  - name: ONNX (format/schema)
    relation: runtime-dependency
    criticality: optional
  - name: TensorFlow
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="edge-impulse-python-sdk" %}

# Edge Impulse Python SDK

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for Edge Impulse Python SDK<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Edge Impulse Python SDK (PyPI package name `edgeimpulse`, GitHub repository [edgeimpulse/python-sdk](https://github.com/edgeimpulse/python-sdk)) is a pure-Python client library for the Edge Impulse Studio cloud platform. It wraps the Edge Impulse REST API (via the generated `edgeimpulse-api` client) to let machine-learning practitioners manage projects, upload/download datasets, profile models (RAM/ROM/inference-time estimates), and deploy/download trained "impulses" for edge devices. The SDK itself performs no local model compilation or inference; it uploads models and polls jobs run by Edge Impulse's closed-source cloud backend.

The repository is owned outright by EdgeImpulse Inc., copyright "EdgeImpulse Inc.", licensed under the Clear BSD License (a commercial product SDK, not a foundation-governed open-source project). It has approximately 9 stars and 1 fork [NEEDS VERIFICATION - star/fork counts fluctuate and were captured at research time, not independently re-verified against a second source]. No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, `SUPPORT.md`, or `PLATFORMS.md` file exists anywhere in the repository (verified by direct clone and full filesystem search). There is no documented governance model, no tiered contributor/maintainer policy, and no evidence of foundation or standards-body membership tied to this specific SDK.

Edge Impulse Inc. was reportedly acquired by Qualcomm in 2025 [NEEDS VERIFICATION - stated in research findings as "per public reporting - not independently verified in this session"]. Qualcomm Technologies, Inc. is listed as a RISE Project Premier Member, but no evidence was found that this translates into RISE engagement, funding, or blog coverage of this SDK specifically (see Section 12 and the RISE research below).

There is no documented community culture around new architecture ports for this project: no RISC-V issues, PRs, or commits have ever been opened against it (Section 2), and no discussion of platform/architecture support appears in its README or docs.

## 2. Port History and Upstreaming Timeline

No RISC-V port has ever been proposed, discussed, or merged for this project.

| Date | Event | Source |
|---|---|---|
| 2023-08-03 | Repository created | GitHub repo metadata, per prior research pass |
| N/A | No RISC-V-related issue, PR, or commit ever opened | [search_issues, search_pull_requests, search_commits queries against edgeimpulse/python-sdk, all returning 0 results] |

Because the SDK is pure Python with no architecture-specific code, there is no "port" to perform in the conventional sense (no compiled kernels, no toolchain work) - the package already runs on riscv64 wherever a compatible Python interpreter and its (also architecture-independent) hard dependencies are available. It is "fully upstream" trivially, because there was never any architecture-specific code to upstream.

No key contributors related to RISC-V work exist because no such work exists.

## 3. Upstream Support Tier

No formal support-tier policy exists in this repository (no `PLATFORMS.md`, no support matrix in the README beyond generic "Python 3.9+" requirements referenced by the package's dependency chain). There is no CI of any kind (Section 7), so no architecture is release-blocking or officially tested by upstream automation. The only "official" distribution channel is PyPI, and the published artifacts are architecture-independent (Section 8).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI | N/A - no CI exists for any architecture | N/A - no CI exists for any architecture | N/A - no CI exists for any architecture |
| Official binaries | Universal `py3-none-any` wheel (works here) | Universal `py3-none-any` wheel (works here) | Universal `py3-none-any` wheel (works here) |
| Distro packaging | Not packaged in Ubuntu/Debian under any tested name | Not packaged in Ubuntu/Debian under any tested name | Not packaged in Ubuntu/Debian under any tested name |
| Release-blocking test | None (no CI) | None (no CI) | None (no CI) |

The SDK does not differentiate between architectures anywhere in its packaging or documentation - it is architecture-blind by construction, which is the basis of the green classification (Section 13).

## 4. Technical Architecture and RISC-V-Specific Subsystems

There are no architecture-specific subsystems in this codebase. A direct clone of `edgeimpulse/python-sdk` (commit `70cbb925a56b413ea1456adf30c29aad539a3153`, main branch, the sole branch on the remote) was searched exhaustively:

- `find` for `*.c`, `*.cpp`, `*.h`, `*.hpp`, `*.so`, `*.pyx`, `*.pyd` -> zero results.
- No `arch/` directory, no JIT backend, no SIMD code, no cryptographic primitives implemented locally, no GC (the SDK relies on CPython's own GC).
- `grep -rniI 'riscv'` across the entire tracked tree -> zero matches.
- `grep -rniE 'riscv|amd64|x86_64|aarch64|arm64|armv7|cortex'` across `.py`/`.pyi`/`.toml`/`.cfg`/`.md` files -> the only hits are the opaque device-name strings `"cortex-m4f-80mhz"` and `"cortex-m7-216mhz"` in `profile.py` and its tests, which are labels for target *microcontroller* profiling requests sent to the cloud API, not compiled code paths.

Device/target handling (in `edgeimpulse/model/_functions/profile.py` and `edgeimpulse/util.py::get_profile_devices()`) fetches the list of profilable target devices live from the Edge Impulse cloud API (`ProjectsApi.get_project_info().latency_devices`) and submits jobs to `JobsApi`/`LearnApi` on Edge Impulse's remote, closed-source backend. All model compilation and profiling happens server-side; nothing is compiled or executed locally by this SDK.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Local compiled kernel / intrinsics code | N/A - none exists for any architecture | N/A - none exists for any architecture | N/A - none exists for any architecture |
| Architecture `#ifdef` guards | None found | None found | None found |
| Device/model profiling execution | Proxied to remote cloud API, not local | Proxied to remote cloud API, not local | Proxied to remote cloud API, not local |

This is not a case of an incomplete or scalar-fallback RISC-V implementation (as would apply to a SIMD/numerics library); the category of "architecture-specific implementation" does not exist in this repository for any architecture. Framing any gap here as an "incomplete RISC-V implementation" would be a category error.

## 5. Build System, Cross-Compilation, and Toolchain

The project uses Poetry (`poetry.core.masonry.api`) as its build backend, declared in `pyproject.toml`. There is no `ext_modules` declaration and no native-extension build step - the build produces a pure `py3-none-any` (noarch) wheel plus a source distribution.

- No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists (GitHub code search for these filenames scoped to the repo returned zero hits).
- No `CMakeLists.txt` anywhere in the repository (code search for `filename:CMakeLists.txt repo:edgeimpulse/python-sdk` returned 0 results).
- No cross-compilation toolchain files exist, because there is no compiled component to cross-compile.
- No `Dockerfile` (riscv64-named or otherwise) exists anywhere in the repository.
- No QEMU usage, no documented build failures, because there is nothing architecture-specific to build.

Installation on any architecture, including riscv64, is `pip install edgeimpulse`, subject only to the hard runtime dependencies (`edgeimpulse-api`, `requests`, `python-socketio[client]`) being installable, which they are (all are themselves architecture-independent pure-Python or universal packages per the PyPI JSON API checks in Section 9).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `pip install edgeimpulse` | Works | Works | Works (architecture-independent wheel) |
| Data upload/download | Works (proxied to cloud) | Works (proxied to cloud) | Works (proxied to cloud) |
| Model profiling (`model.profile()`) | Works (proxied to cloud) | Works (proxied to cloud) | Works (proxied to cloud) |
| Deployment build/download | Works (proxied to cloud) | Works (proxied to cloud) | Works (proxied to cloud) |
| EON tuner | Works (proxied to cloud) | Works (proxied to cloud) | Works (proxied to cloud) |
| Local Keras/ONNX/NumPy model type-checking (optional extras) | Depends on NumPy/pandas/ONNX/TensorFlow availability - all installable on amd64 | Depends on NumPy/pandas/ONNX/TensorFlow availability - largely installable on arm64 | Depends on NumPy/pandas/ONNX/TensorFlow availability - **gap**: pandas has no riscv64 build in Ubuntu 26.04 and no visible upstream porting effort; TensorFlow has no apt package on any architecture and has open upstream issues reporting riscv64 compile failures (see Section 9) |

There are no functional gaps in the SDK's own code between architectures - every core function is a network call to the same cloud API regardless of client architecture. The only real-world gap for a riscv64 user is in the **optional** local model-type-checking extras (NumPy, pandas, ONNX, TensorFlow), which are not part of this SDK's own code but are soft dependencies guarded by `try/except ModuleNotFoundError` in `edgeimpulse/util.py`. A riscv64 user attempting to profile a Keras model locally before upload currently has no working path to install TensorFlow at all, per two open upstream TensorFlow issues ([#102159](https://github.com/tensorflow/tensorflow/issues/102159), [#100940](https://github.com/tensorflow/tensorflow/issues/100940)).

No performance gaps exist to measure - there is no local compute in this SDK to benchmark. No SIMD-derived performance deltas, no NaN/floating-point semantics issues, and no security-hardening gaps were found or are applicable, since the SDK performs no local numerical computation of its own (it is a thin HTTP/Socket.IO client).

## 7. CI/CD Infrastructure

No CI of any kind exists for this project, on any architecture. This was independently verified twice: once via GitHub's search API (`search_code`, `search_issues`, `search_pull_requests` all scoped to `edgeimpulse/python-sdk`) and once via a direct `git clone` of the repository (not relying on API/search results):

- `git ls-remote --heads origin` -> only one branch exists, `main`, at commit `70cbb925a56b413ea1456adf30c29aad539a3153`.
- Full recursive tree listing (`git ls-tree -r --name-only HEAD`) -> no `.github` directory, no `.yml`/`.yaml` file, no `Jenkinsfile`, no `.travis.yml`, no `.cirrus.yml`, no `azure-pipelines.yml` anywhere in the repository.
- `find . -iname "*.yml" -o -iname "*.yaml" -o ...` across the entire working tree -> zero results.
- `git grep -il "riscv"`, `"risc-v"`, `"risc_v"` (case-insensitive, full tracked tree) -> zero matches in any file.
- `git log --all --grep="riscv" -i` -> zero commits mention riscv.

No RISE runners are used (there is no CI to use them in). No hardware of any kind is involved in testing this package upstream.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | No | No | No |
| Build step | N/A | N/A | N/A |
| Test execution | N/A | N/A | N/A |
| RISE runner usage | N/A | N/A | N/A |

## 8. Distribution and Release Status

The package is published on PyPI under the name **`edgeimpulse`** (not `edge-impulse-python-sdk` or other name variants tested earlier in the research process - this was a correction made mid-investigation). Verified via the PyPI JSON API (`https://pypi.org/pypi/edgeimpulse/json`):

- Latest version at research time: 1.0.20.
- Artifacts: `edgeimpulse-1.0.20-py3-none-any.whl` and `edgeimpulse-1.0.20.tar.gz`.
- Both are architecture-independent (universal wheel tag `py3-none-any`); no `riscv64`-specific artifact exists, and none is needed since the package contains no compiled code.
- Cross-checked via `https://pypi.org/simple/edgeimpulse/` and grepped for "riscv" - zero matches (expected, since no architecture-specific tagging applies to a universal wheel).

Its direct runtime dependency `edgeimpulse-api` (version 1.95.8 at research time) follows the same pattern: `edgeimpulse_api-1.95.8-py3-none-any.whl` plus sdist, no platform-specific tag.

**No GitHub Releases exist.** `https://github.com/edgeimpulse/python-sdk/releases` returns "There aren't any releases here." Git tags exist (1.0.6 through 1.0.18, annotated, source-only, confirmed via `git ls-remote --tags`), but no binary assets are attached to any tag.

**Not packaged in any Linux distribution.** `packages.ubuntu.com` search for "edgeimpulse" across all suites/sections/architectures returns "Sorry, your search gave no results." Not present in Debian, Fedora, or Arch RISC-V (`archriscv.felixc.at`) under any tested name.

**Not listed on the RISE Python wheel builder** (`https://riseproject.gitlab.io/python/wheel_builder/`, 81 packages listed as of the research date) - unsurprising and inconsequential, since the package requires no riscv64-specific wheel build to function.

**What a riscv64 user must do to get a working install:** simply `pip install edgeimpulse`. This works identically to amd64/arm64 because the published artifact is architecture-independent. No special riscv64 index, patch, or build step is required for the SDK itself. (The optional NumPy/pandas/ONNX/TensorFlow extras are a separate matter - see Section 9.)

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| `edgeimpulse-api` | Generated OpenAPI client for Edge Impulse cloud API (hard dependency) | Pure Python, universal wheel - no build needed | N/A - no compiled code | `py3-none-any` wheel + sdist on PyPI | No riscv64 issues found |
| `requests` | HTTP client (hard dependency) | Pure Python, universal wheel | N/A | Architecture-independent | Out of scope for riscv64 risk; ubiquitous, well-supported |
| `python-socketio[client]` | Socket.IO client (hard dependency) | Pure Python, universal wheel | N/A | Architecture-independent | Out of scope for riscv64 risk |
| NumPy (optional, dev-dependency, guarded import) | dtype introspection, `data.upload_numpy`, tuner utils | Ubuntu 26.04 riscv64 (resolute) ships `python3-numpy`; upstream native riscv64 wheel-build CI added [PR #30338](https://github.com/numpy/numpy/pull/30338), [PR #31488](https://github.com/numpy/numpy/pull/31488), milestone 2.6.0 | Open correctness failures: `test_unary_spurious_fpexception`, `test_floor_division_errors` (as of research date) | No official PyPI manylinux riscv64 wheel yet; Ubuntu apt package builds fine | Open tracking: [numpy#32461](https://github.com/numpy/numpy/issues/32461), [numpy#32376](https://github.com/numpy/numpy/issues/32376), [numpy#30216](https://github.com/numpy/numpy/issues/30216). See project-reports/numpy.md for full status |
| pandas (optional, dev-dependency, guarded import) | `data.upload_pandas_sample`/`upload_pandas_dataframe_wide`, tuner labeling | Not built for riscv64 in Ubuntu 26.04 (only amd64/arm64 rows exist for `python3-pandas`) | No riscv64 CI/tests found upstream | Not available | No dedicated riscv64 issue exists upstream - simply no port/CI effort has started |
| `onnx/onnx` (schema/format package, optional, guarded import) | `util.is_onnx_model`, model serialization before cloud profiling | Ubuntu 26.04 riscv64 ships `python3-onnx`; transitive deps (`libprotobuf32t64`, `python3-protobuf`, `python3-numpy`, `python3-ml-dtypes`) all present on riscv64 | No riscv64-specific tests found | Ubuntu apt only, no confirmed official PyPI riscv64 wheel | Note: this repository's `projects.yml`/`project-reports/onnx.md` entry actually documents **ONNX Runtime** (a different, much heavier project), not this schema package - `onnx/onnx` itself has no dedicated report in this repository's tracked scope |
| TensorFlow/Keras (optional, dev-dependency, guarded import) | `util.is_keras_model`, Keras model detection before cloud profiling | No working full-TensorFlow riscv64 build path; not apt-packaged on any architecture | N/A | No official riscv64 wheels from Google | Open upstream issues: [tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159) ("Can't compile tensorflow 2.19.1 on riscv"), [tensorflow#100940](https://github.com/tensorflow/tensorflow/issues/100940) ("Compile Tensorflow on riscv64 platform"). Related-but-distinct TFLite-Micro has its own report: project-reports/tensorflow-lite-micro-(tflm).md; core TensorFlow has none |
| Protobuf (transitive, via ONNX) | Serialization backend for `onnx`/`edgeimpulse-api` model objects | Ubuntu 26.04 riscv64 ships `python3-protobuf`, `libprotobuf-dev`, `protobuf-compiler`, but **upstream explicitly declines riscv64 support** ("not staffed to add support," "RISC-V isn't on our roadmap"); riscv64 PRs closed unmerged ([protobuf#12244](https://github.com/protocolbuffers/protobuf/pull/12244), [#23205](https://github.com/protocolbuffers/protobuf/pull/23205)) | No upstream riscv64 CI | No official upstream riscv64 release; **Ubuntu/Debian ships riscv64 anyway via independent distro patches** - a discrepancy between distro availability and upstream support posture | Closed issues: [protobuf#12266](https://github.com/protocolbuffers/protobuf/issues/12266), [#14549](https://github.com/protocolbuffers/protobuf/issues/14549), [#17798](https://github.com/protocolbuffers/protobuf/issues/17798). See project-reports/protocol-buffers.md |
| OpenBLAS (transitive, via NumPy's BLAS backend) | Linear-algebra backend NumPy links against | Ubuntu 26.04 riscv64 ships `libopenblas0`, `libopenblas-dev`; mature RVV 1.0 targets (`RISCV64_ZVL128B/256B`), runtime dispatch via `riscv_hwprobe`, active since 2022 | 221 riscv64 kernel files exercised in CI | Distro package + PyPI `scipy-openblas64` riscv64 wheels (formerly via RISE wheel_builder, now upstream PyPI) | No open blockers found. See project-reports/openblas.md |
| Pydantic/`pydantic-core` (transitive, via `edgeimpulse-api`) | Request/response model validation; `pydantic-core` is a compiled Rust extension | Ubuntu 26.04 riscv64 ships `python3-pydantic`, `python3-pydantic-core`; builds cleanly via Rust's `riscv64gc` target | No riscv64-specific issues found | Ubuntu apt package present; no reported wheel gaps | No issues found. No project-reports/pydantic.md entry exists in this repository's tracked scope |

**Deep-dive summary:** the SDK's hard dependency surface (`edgeimpulse-api`, `requests`, `python-socketio`) is riscv64-safe by construction - pure Python, no native code. The optional ML-tooling extras carry real, uneven risk: NumPy, ONNX (schema package), Protobuf, OpenBLAS, and Pydantic are all installable from the Ubuntu 26.04 riscv64 archive today (with caveats). pandas and core TensorFlow are real gaps with no working riscv64 path at present. None of this affects the SDK's own green rating (Section 13), since these are optional, guarded imports used only for local pre-upload model type-checking, not required for the SDK's core cloud-proxy functionality.

Section 10 (Ecosystem Status) is omitted: this SDK is a standalone client library with no dependent package ecosystem of its own (no plugins/extensions built against it that would need separate riscv64 enablement).

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | (none found) | N/A | N/A | Zero riscv64-related issues or PRs exist for `edgeimpulse/python-sdk` itself, confirmed via `search_issues` (`riscv OR riscv64 OR risc-v`, `total_count: 0`) and `search_pull_requests` (same query, `total_count: 0`) run directly against the GitHub API |
| tensorflow#102159 | "Can't compile tensorflow 2.19.1 on riscv" | Open | Indirect (affects optional Keras-detection extra) | Not a bug in this SDK; documented in Section 9 |
| tensorflow#100940 | "Compile Tensorflow on riscv64 platform" | Open | Indirect (affects optional Keras-detection extra) | Not a bug in this SDK; documented in Section 9 |
| numpy#32461, numpy#32376, numpy#30216 | Various riscv64 correctness/wheel-tracking issues | Open | Indirect (affects optional extra) | Not a bug in this SDK; documented in Section 9 |

No correctness bugs exist in this SDK's own code for any architecture with respect to riscv64, because the SDK performs no architecture-specific computation.

## 12. Objections and Upstream Blockers

No objections, technical blockers, or organizational blockers exist, because no riscv64 support request has ever been made against this project - there is nothing to object to or block. This was confirmed by:

- Zero riscv-related issues, PRs, or commits in `edgeimpulse/python-sdk` history (Section 2, Section 11).
- No stated architecture-support policy of any kind in project documentation.
- No evidence of RISE Project involvement: none of the 34 RISE blog posts checked (via [riseproject.dev/blog](https://riseproject.dev/blog/) sitemap enumeration) mention Edge Impulse; the package is not listed on the [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/); GitHub org `riseproject-dev` searches (`search_repositories`, `search_code`, `search_issues`) surfaced only this repository's own internally authored readiness report, not evidence of RISE funding or engagement.
- Qualcomm (Edge Impulse's reported acquirer) is a RISE Premier Member, but no evidence connects that membership to any RISE activity on this specific SDK.

Acceptance probability for a hypothetical future riscv64-specific request is not meaningfully assessable because there is no riscv64-specific work to accept - the package already works on riscv64 as-is (Section 13). Any future friction would arise only from the optional ML-tooling extras (pandas, TensorFlow) documented in Section 9, which are separate upstream projects with their own blocker profiles (Protobuf's explicit upstream refusal being the most concrete organizational blocker in the dependency chain).

## 13. Readiness Assessment

- **Color:** green (architecture-independent)
- **Release provider:** upstream
- **Justification:** The Edge Impulse Python SDK ships exclusively as a `py3-none-any` universal wheel and matching sdist on PyPI under the name `edgeimpulse` ([PyPI JSON API](https://pypi.org/pypi/edgeimpulse/json)), with no compiled/native component of any kind (verified by direct repository inspection - zero `.c`/`.cpp`/`.h`/`.so`/`.pyx` files, no `CMakeLists.txt`, no `Dockerfile`). Per Step 0 of the color model, an architecture-independent package runs on riscv64 by construction and is classified green without being penalized for the complete absence of upstream CI (Section 7) or riscv64-specific CI/release activity, since none is needed.
- **Pending work that could change the grade:** None identified that would change the SDK's own color. The only latent risk to the *user experience* (not the color) is in the optional ML-tooling extras: pandas has no riscv64 path in Ubuntu 26.04 and no visible upstream porting effort, and TensorFlow has no working riscv64 build at all (two open upstream issues, [tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159) and [tensorflow#100940](https://github.com/tensorflow/tensorflow/issues/100940)). Neither blocks the SDK's core install or cloud-proxy functionality on riscv64. No RISE involvement exists currently that would accelerate or otherwise affect this project.

## 14. Investment Analysis

Before sizing any work: RISE has not funded, touched, or engaged with this project in any way (confirmed across 34 blog posts, the RISE Python wheel builder listing, and GitHub org searches - Section 12). There is also no work to size for the SDK's own functional enablement, since it already runs on riscv64 without modification.

### 14.1 Functional Enablement

No work required. The SDK installs and runs on riscv64 today via `pip install edgeimpulse`, identically to amd64/arm64, because it is architecture-independent by construction (Section 4, Section 8).

### 14.2 Performance Optimization

Not applicable. This is not an optimization-purpose project (Step 2 of the color model does not apply) - it is a thin HTTP/Socket.IO API client with no local compute-heavy code, no SIMD/JIT kernels, and no algorithm whose value proposition depends on architecture-specific performance. All actual model profiling/compilation happens on Edge Impulse's closed-source cloud backend, outside the scope of any riscv64-side optimization work.

### 14.3 CI/CD Infrastructure

No CI exists for this project on any architecture (Section 7), so there is no riscv64-specific CI gap to close relative to amd64/arm64 - all three are equally absent. Standing up CI (of any kind, for any architecture) is a decision for the SDK's owner (EdgeImpulse Inc. / Qualcomm), not a riscv64-specific investment; it is out of scope for a RISC-V readiness investment plan.

### 14.4 Ecosystem Enablement

The functional gaps that matter for this SDK's ecosystem lie entirely in its optional dependencies:
- **pandas riscv64 packaging**: no Ubuntu 26.04 riscv64 build exists and no upstream porting effort was found. Closing this is a pandas-upstream or distro-packaging investment, not an Edge Impulse SDK change.
- **TensorFlow riscv64 build**: two open upstream issues report riscv64 compile failures ([tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159), [tensorflow#100940](https://github.com/tensorflow/tensorflow/issues/100940)) with no resolution found. This is a substantial, well-known upstream TensorFlow riscv64 gap, tracked separately from this SDK.
- Both are pre-existing, independent upstream gaps that a chip company would size under the pandas/TensorFlow project tracks, not under Edge Impulse Python SDK investment.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | None - already works on riscv64 (architecture-independent) | 0 | N/A | N/A |
| Performance | Not applicable - not an optimization-purpose project | 0 | N/A | N/A |
| CI/CD | Not applicable to riscv64 specifically - no CI exists for any architecture; out of scope for a RISC-V investment plan | 0 | N/A | N/A |
| Ecosystem | pandas riscv64 packaging (tracked separately under the pandas project, not this SDK) | Not sized here - out of scope; see pandas upstream tracking | pandas upstream / distro | Low (optional extra only) |
| Ecosystem | TensorFlow riscv64 build fix (tracked separately under the TensorFlow project, not this SDK) | Not sized here - out of scope; see [tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159), [tensorflow#100940](https://github.com/tensorflow/tensorflow/issues/100940) | TensorFlow upstream | Low (optional extra only) |

**Bottom line:** Edge Impulse Python SDK requires zero riscv64-specific investment. It is already green by construction. Any investment interest in the broader Edge Impulse-on-riscv64 story should instead target the optional ML dependency gaps (pandas, TensorFlow) as separate, independently-tracked upstream projects, not this SDK.

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [edgeimpulse/python-sdk GitHub repository](https://github.com/edgeimpulse/python-sdk)
- [Edge Impulse Python SDK documentation](https://docs.edgeimpulse.com/docs/tools/edge-impulse-python-sdk)
- [edgeimpulse/python-sdk releases page ("There aren't any releases here")](https://github.com/edgeimpulse/python-sdk/releases)
- [PyPI JSON API for `edgeimpulse`](https://pypi.org/pypi/edgeimpulse/json)
- [PyPI simple index for `edgeimpulse`](https://pypi.org/simple/edgeimpulse/)
- [PyPI JSON API for `edgeimpulse-api`](https://pypi.org/pypi/edgeimpulse-api/json) [NEEDS VERIFICATION - exact URL pattern inferred from package name, not independently re-fetched in this pass]
- [Ubuntu package search for "edgeimpulse"](https://packages.ubuntu.com/search?keywords=edgeimpulse&searchon=names&suite=all&section=all)
- [Ubuntu package search for "Edge Impulse Python SDK", suite=resolute](https://packages.ubuntu.com/search?keywords=Edge%20Impulse%20Python%20SDK&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V package index](https://archriscv.felixc.at/)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project GitLab wheel builder API (pypi simple index, project 56254198)](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-python-sdk/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project members page](https://riseproject.dev/members/)
- ["Easy Installation of Binary Python Packages on riscv64 Devices" - RISE blog post by Mark Ryan (Rivos)](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [GitHub org riseproject-dev](https://github.com/riseproject-dev)
- [NumPy issue #32461](https://github.com/numpy/numpy/issues/32461)
- [NumPy issue #32376](https://github.com/numpy/numpy/issues/32376)
- [NumPy issue #30216 (riscv64 wheel tracking)](https://github.com/numpy/numpy/issues/30216)
- [NumPy PR #30338 (riscv64 wheel-build CI)](https://github.com/numpy/numpy/pull/30338)
- [NumPy PR #31488 (riscv64 wheel-build CI)](https://github.com/numpy/numpy/pull/31488)
- [TensorFlow issue #102159 ("Can't compile tensorflow 2.19.1 on riscv")](https://github.com/tensorflow/tensorflow/issues/102159)
- [TensorFlow issue #100940 ("Compile Tensorflow on riscv64 platform")](https://github.com/tensorflow/tensorflow/issues/100940)
- [Protocol Buffers PR #12244 (riscv64, closed unmerged)](https://github.com/protocolbuffers/protobuf/pull/12244)
- [Protocol Buffers PR #23205 (riscv64, closed unmerged)](https://github.com/protocolbuffers/protobuf/pull/23205)
- [Protocol Buffers issue #12266 (closed unmerged)](https://github.com/protocolbuffers/protobuf/issues/12266)
- [Protocol Buffers issue #14549 (atomic-ops linker error, closed)](https://github.com/protocolbuffers/protobuf/issues/14549)
- [Protocol Buffers issue #17798 (closed)](https://github.com/protocolbuffers/protobuf/issues/17798)
- Internal report: project-reports/numpy.md
- Internal report: project-reports/openblas.md
- Internal report: project-reports/protocol-buffers.md
- Internal report: project-reports/tensorflow-lite-micro-(tflm).md
- Internal report: project-reports/edge-impulse-linux-sdk-(python).md (companion report on the related "Edge Impulse Linux SDK (Python)" / PyPI `edge-impulse-linux` package, also green, also confirmed "RISE has not funded or touched this project")
