---
title: Edge Impulse Linux SDK (Python)
parent: Project Reports
color: green
---

# Edge Impulse Linux SDK (Python)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for Edge Impulse Linux SDK (Python)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Edge Impulse Linux SDK (Python) (PyPI package `edge-impulse-linux`, import name `edge_impulse_linux`) is a thin Python client library that lets a Linux host application run inference against an Edge Impulse machine-learning model. It is not itself an inference engine: `edge_impulse_linux/runner.py` launches a separately-built, precompiled native model binary (the `.eim` file, produced by Edge Impulse's own C++ inferencing SDK / EON Compiler / Edge Impulse Studio) as a subprocess and communicates with it over a Unix domain socket. The Python package supplies the audio (`audio.py`) and image/video (`image.py`) capture helpers plus the socket protocol client (`runner.py`).

Governance is entirely vendor-controlled. The repository has no MAINTAINERS/OWNERS/CODEOWNERS file, no GOVERNANCE.md, CONTRIBUTING.md, PLATFORMS.md, or platform-support documentation of any kind, and no external RFC or tiered-contributor process. Of 62 commits (2021-04-11 to 2026-01-15), Jan Jongboom (Edge Impulse co-founder/CTO, 30 commits) and other `@edgeimpulse.com` staff (Alex E, Mateusz Majchrzycki, Eoin Jordan, and others) account for the substantive/ongoing maintenance, with a small number of one-off external community commits (AIWintermuteAI, Raul James/Nobi.io, and others). License is Clear BSD, Copyright 2025 EdgeImpulse Inc. Edge Impulse Inc. was acquired by Qualcomm Technologies, Inc. in March 2025, making Qualcomm the ultimate corporate parent, though the SDK repository still operates as an independently-branded Edge Impulse project.

There is no stated community culture on new architecture ports, positive or negative: no issue, PR, discussion, or document anywhere in the repository discusses RISC-V or any other architecture-support proposal process. Any such change would presumably be reviewed ad hoc by Edge Impulse/Qualcomm staff with no committed support-tier policy.

## 2. Port History and Upstreaming Timeline

No RISC-V port has been proposed or attempted.

| Date | Event | Source |
|---|---|---|
| N/A | No RISC-V-related commit, issue, or PR exists in this repository's history | [GitHub code/issue/PR search returned 0 results across all query variants](https://github.com/edgeimpulse/linux-sdk-python) |

Full-history search (commit messages, commit bodies, and diff content via `git log -S`) across all 62 commits for "riscv"/"risc-v" returned zero hits. No key contributors are associated with a RISC-V effort for this project because none exists. The project is not "unported" in the sense of an attempted-and-stalled port; RISC-V has simply never been addressed, positive or negative.

## 3. Upstream Support Tier

There is no formal tier policy for architecture support. The only documented supported platforms are x86_64 and AArch64, per [docs.edgeimpulse.com](https://docs.edgeimpulse.com/docs/tools/edge-impulse-for-linux/linux-python-sdk) and the [PyPI project page](https://pypi.org/project/edge-impulse-linux/). This reflects where Edge Impulse's own edge hardware targets run, not a build constraint of this specific SDK, which contains no compiled code (see Section 4).

| Architecture | CI builds | CI tests | Official release artifact |
|---|---|---|---|
| amd64/x86_64 | via `ubuntu-latest` sdist build (arch-agnostic) | no test step in CI | sdist on PyPI (architecture-independent) |
| arm64/aarch64 | same arch-agnostic sdist build | no test step in CI | same sdist |
| riscv64 | same arch-agnostic sdist build (no arch distinction exists) | no test step in CI | same sdist |

The single CI workflow ([`.github/workflows/publish-to-pypi.yml`](https://github.com/edgeimpulse/linux-sdk-python/blob/master/.github/workflows/publish-to-pypi.yml)) produces one architecture-independent artifact consumed identically by all three architectures; there is no per-architecture build matrix to compare because the package requires none.

## 4. Technical Architecture and RISC-V-Specific Subsystems

The full SDK is 626 lines across four files (`__init__.py`, `runner.py` 213 lines, `audio.py` 166 lines, `image.py` 244 lines). A case-insensitive search of all four files for `riscv`, `amd64`, `x86_64`, `aarch64`, `arm64`, `platform.machine`, `uname`, `ifdef`, `stub`, and `not implemented` returned zero architecture-related matches. `setup.py` is a bare `setuptools.setup()` call with no `ext_modules` and no C/C++ extension of any kind; `pyproject.toml`'s build backend is plain `setuptools>=42` plus `wheel`.

`ImpulseRunner.init()` in `runner.py` performs `subprocess.Popen([model_path, socket_path])` and speaks JSON over a Unix socket to whatever process results. `model_path` points to a caller-supplied `.eim` binary built entirely outside this repository (Edge Impulse's C++ inferencing SDK / EON Compiler / Studio deployment pipeline). This SDK never inspects or branches on CPU architecture.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture-specific code in this repo | none | none | none |
| SIMD/JIT/crypto/assembly in this repo | none | none | none |

None of "full / partial / minimal / missing" cleanly applies to this repository, since those categories presuppose an architecture-specific implementation surface (e.g. SIMD kernels) that this pure-Python IPC client does not have by design. The end-to-end usability of the Edge Impulse Linux workflow on riscv64 depends on whether the separately-built `.eim` inference binaries (produced by `edge-impulse-cli` / the C++ inferencing SDK, a different repository) are available for riscv64. That dependency is outside this SDK's own dependency manifest and was not resolvable from this repo's source; it was not in scope for this task and was not searched. Data not available: riscv64 support status of the Edge Impulse C++ inferencing SDK / `.eim` binary toolchain.

## 5. Build System, Cross-Compilation, and Toolchain

The repository has no build system for compiled code, for any architecture, because it has no native code. Confirmed by inspecting the full repo tree (shallow clone at commit `7b4aa98`, tagged version 1.2.2):

- No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md`.
- No `CMakeLists.txt` and no `cmake/` directory anywhere in the repo.
- No `Dockerfile` of any kind anywhere in the repo.
- Full-tree grep for "riscv" (case-insensitive): zero matches.

The build/publish flow is: `python setup.py sdist` (produces a source distribution, no `bdist_wheel`, no `cibuildwheel`) followed by `twine upload dist/*` to PyPI, run once per push to `master` on a standard `ubuntu-latest` GitHub-hosted runner. No QEMU, no cross-compilation, no toolchain version requirement exists because nothing is compiled. Any cross-compilation toolchain for the actual Edge Impulse inferencing engine would live in a different C/C++ repository not covered by this report.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `pip install edge-impulse-linux` succeeds | yes | yes | yes (pure-Python sdist, no native extension to compile) |
| Audio capture (`audio.py`, via PyAudio/PortAudio) | yes | yes | yes, PortAudio and PyAudio are packaged for riscv64 in Ubuntu 26.04 (resolute): `portaudio19-dev`, `libportaudio2`, `python3-pyaudio` |
| Image/video capture (`image.py`, optional OpenCV) | yes | yes | yes at the library level (Ubuntu 26.04 ships `python3-opencv`), but upstream OpenCV riscv64 CI has open RVV accuracy regressions ([opencv/opencv#27279](https://github.com/opencv/opencv/issues/27279), [#27281](https://github.com/opencv/opencv/issues/27281)) mitigated by disabling the RVV path for the affected ops ([opencv/opencv#28144](https://github.com/opencv/opencv/pull/28144)) |
| Running actual model inference (`.eim` binary) | yes, Edge Impulse ships/produces x86_64 `.eim` binaries | yes, ships/produces AArch64 `.eim` binaries | Data not available: no evidence found that Edge Impulse's inferencing toolchain produces riscv64 `.eim` binaries; not addressed anywhere in Edge Impulse documentation |

No performance-gap data exists (see Section 11) because there is no SIMD/architecture-specific code in this SDK to have a performance delta in the first place. No NaN/floating-point semantics issues were found or reported. The material gap is not in this SDK but in the separately-distributed native inference binary it depends on at runtime, which this report could not evaluate (out of scope, different repository).

## 7. CI/CD Infrastructure

Exactly one CI workflow file exists in the repository: [`.github/workflows/publish-to-pypi.yml`](https://github.com/edgeimpulse/linux-sdk-python/blob/master/.github/workflows/publish-to-pypi.yml). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist anywhere in the repo. Full content:

- **Trigger:** `push` to `master` only. No `pull_request`, `workflow_dispatch`, `schedule`, or tag trigger.
- **Runner:** `ubuntu-latest`, a standard GitHub-hosted x86_64 runner. No riscv64 runner, no self-hosted runner, no architecture matrix, no QEMU setup action anywhere in the file.
- **Job steps:** checkout, `actions/setup-python@v5` (Python 3.9), install pip/setuptools/twine from a private "stablebuild" mirror, `python setup.py sdist` (builds a pure-Python source distribution only, no `bdist_wheel`), `twine upload dist/*` to PyPI.

Case-insensitive search of this file for "riscv"/"riscv64" returned zero matches. There is no RISE runner usage (no reference to `riseproject-dev` or RISE runner labels).

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runs at all | yes (as the ubuntu-latest host) | not separately targeted | not separately targeted |
| CI builds an architecture-specific artifact | no (arch-agnostic sdist) | no (same arch-agnostic sdist) | no (same arch-agnostic sdist) |
| CI runs the test suite | no test step exists in the workflow for any target | same | same |
| CI publishes an architecture-specific release | no (single sdist serves all) | no | no |

There is no architecture-specific CI to compare because the workflow does not build architecture-specific artifacts for any platform, including the two officially "supported" ones.

## 8. Distribution and Release Status

- **PyPI** (`edge-impulse-linux`): [full release listing](https://pypi.org/project/edge-impulse-linux/#history) shows all 20 published versions (1.0.0 to 1.2.2, latest released 2026-01-15) ship a source distribution (`.tar.gz`) only. One early build (1.0.0) additionally shipped a `py3-none-any` universal wheel; no version has ever shipped an architecture-specific wheel. Zero filenames across any release contain "riscv" or "riscv64" - and none contain any other architecture tag either, because none are architecture-specific.
- **GitHub Releases**: the [releases page](https://github.com/edgeimpulse/linux-sdk-python/releases) shows zero releases exist for this repository at all.
- **Ubuntu 26.04 (resolute)**: project graph query for this package (exact name and broad substring match on "edge-impulse"/"edgeimpulse") returned an empty result set across all suites and all architectures. The package does not exist in the Ubuntu archive under any name.
- **RISE Python wheel builder**: not listed among its 85 supported packages.
- **Arch Linux RISC-V** (archriscv.felixc.at): no reference to the package found.

**What a riscv64 user must do today:** `pip install edge-impulse-linux` on a riscv64 host. Because the package is a pure-Python sdist with no `ext_modules`, this installs and imports identically to any other architecture, provided the dependency chain (numpy, PyAudio, six, and optionally opencv-python) resolves - which it does via the Ubuntu 26.04 archive for the C-backed dependencies (numpy, PyAudio/PortAudio, OpenCV) as documented in Section 9. This gives a working SDK client. It does **not** by itself give a working inference pipeline: the user must separately obtain (or build) a `.eim` model binary targeting riscv64 from Edge Impulse's inferencing toolchain, and this report found no evidence such a binary is produced by Edge Impulse for riscv64 today. Data not available: riscv64 `.eim` binary availability.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| NumPy | Required - backs shared-memory `classify()` buffers | Found in Ubuntu 26.04 riscv64 (`python3-numpy`); upstream native riscv64 wheel-build CI merged May 2026 ([numpy/numpy#31488](https://github.com/numpy/numpy)), Tier 3 per NEP 57 | Upstream riscv64 CI runs but has open failures: [numpy/numpy#32461](https://github.com/numpy/numpy/issues/32461) (`test_unary_spurious_fpexception`, open), [numpy/numpy#32376](https://github.com/numpy/numpy/issues/32376) (float-exception/floor-division failures, open) | PyPI manylinux riscv64 wheels not yet shipping - tracking issue [numpy/numpy#30216](https://github.com/numpy/numpy/issues/30216) open; Ubuntu archive path works today | [numpy/numpy#26200](https://github.com/numpy/numpy/issues/26200) RVV 1.0 vectorized-kernel support still open (scalar fallback on riscv64 today) |
| PortAudio / PyAudio | Required - backs `audio.py` Microphone helper | Found in Ubuntu 26.04 riscv64: `portaudio19-dev`, `libportaudio2`, `python3-pyaudio` | No riscv64-specific CI/test infra found upstream; no riscv64 test-failure issues found (`repo:jleb/pyaudio`, `repo:PortAudio/portaudio` riscv64 searches: 0 hits) | Not distributed as a PyPI riscv64 wheel (PyAudio ships sdist, compiles against system PortAudio); Ubuntu archive path works today | None found. Pure ALSA/C wrapper, no SIMD/JIT paths - low risk |
| six | Required - Py2/3 shim used in `audio.py` | Architecture-independent (pure Python) | N/A | N/A - universal sdist/wheel | None. Trivial risk |
| opencv-python (optional, via `image.py`) | Optional - image/video classification path only, not in `requirements.txt` | Found in Ubuntu 26.04 riscv64: `python3-opencv`, `libopencv-dev`, full `libopencv-*410` family; upstream RVV HAL merged mainline | Upstream riscv64 CI exists and gates merges, but has open accuracy regressions: [opencv/opencv#27279](https://github.com/opencv/opencv/issues/27279) (`Imgproc_Remap_Test.accuracy` with RVV, open), [opencv/opencv#27281](https://github.com/opencv/opencv/issues/27281) (`Imgproc_WarpPerspective_Test.accuracy` with RVV, open), [opencv/opencv#19844](https://github.com/opencv/opencv/issues/19844) (GAPI tests fail on RISC-V, open) | `opencv-python` on PyPI ships no riscv64 wheel; Ubuntu's `python3-opencv` and a third-party RISE wheel builder fill the gap | RVV SIMD path for `remap`/`warpPerspective` disabled as a mitigation ([opencv/opencv#28144](https://github.com/opencv/opencv/pull/28144), May 2026) - functionally correct but not RVV-accelerated for those ops on riscv64 |

NumPy is the only *required* dependency with genuine numerics/SIMD exposure; PortAudio/PyAudio and six carry no riscv64 risk found. OpenCV is optional (image-classification examples only) but is the highest-risk dependency given its open RVV correctness bugs. Not evaluated in this table: the vendor-supplied `.eim` inference binary itself (TFLite Micro / EON Compiler / ONNX Runtime, compiled outside this repository) - its riscv64 support status would need to be checked in Edge Impulse's separate inferencing-engine/CLI repositories, which was out of scope for this dependency scan.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | - | No riscv64-related issues or PRs found | - | Repo's actual issues (#2, #3) are unrelated (object-detection example request, install failure); no RISC-V mentions in the tracker |

Confirmed via `mcp__github__search_issues` (`riscv repo:edgeimpulse/linux-sdk-python`, `riscv64 repo:edgeimpulse/linux-sdk-python`), `mcp__github__search_pull_requests` (same two variants), and `mcp__github__search_commits` (`riscv repo:edgeimpulse/linux-sdk-python`) - all returned 0 results. No correctness bugs, performance bugs, or benchmark data of any kind exist for this project on riscv64. Data not available: RISC-V performance benchmarks for this SDK - no benchmark articles, blog posts, or numbers found via web search for any date range.

## 12. Objections and Upstream Blockers

No stated objections exist - RISC-V is simply unaddressed, neither accepted nor rejected, anywhere in the repository, its issue tracker, or Edge Impulse's documentation. No technical blocker exists at this SDK layer since it is pure Python with no compiled surface. The practical organizational blocker is upstream prioritization: Edge Impulse's documented supported architectures remain x86_64 and AArch64 only, and there is no evidence of internal or RISE-driven pressure to add riscv64 support, formal or informal.

Edge Impulse is not a RISE Project member ([riseproject.dev/members](https://riseproject.dev/)); its parent company, Qualcomm Technologies, Inc., is a [RISE Premier Member](https://riseproject.dev/), but no evidence was found that this indirect corporate link has translated into any RISE engagement with this specific SDK. Given the SDK itself requires no engineering work to run on riscv64 (Section 4-5), acceptance probability for the SDK layer alone is effectively moot - there is nothing to accept or reject. The open question is entirely at the `.eim` binary/inferencing-engine layer, which is a separate repository outside this report's scope.

## 13. Readiness Assessment

- **Color:** green (no color_case - Step 0 architecture-independent shortcut)
- **Release provider:** upstream
- **Optimization gap:** N/A (this is not an optimization-purpose project; it is an IPC/glue SDK, not a performance library)
- **Justification:** The `edge_impulse_linux` package ships no compiled, architecture-specific code - `setup.py` defines no `ext_modules`, and the sole CI workflow ([`publish-to-pypi.yml`](https://github.com/edgeimpulse/linux-sdk-python/blob/master/.github/workflows/publish-to-pypi.yml)) builds a single architecture-agnostic source distribution (`python setup.py sdist`) and publishes it directly to PyPI via upstream's own `twine upload`. Per Step 0 of the color model, a project with no compiled architecture-specific code runs on riscv64 by construction and is classified green without penalty for lacking riscv64-specific CI, since none is needed.
- **Pending work that could change the grade:** None found - no open PR, issue, or RISE involvement exists for this SDK (`riseproject-dev/sw-ecosystem/project-reports/.queue.yml` lists it only as queued for report-authoring, with no funded work or runner usage attached). The only development that could meaningfully change riscv64 usability of the *overall Edge Impulse Linux workflow* (as opposed to this SDK's own grade) is riscv64 support in the separately-distributed `.eim` binary toolchain, which sits outside this repository and was not evaluated here.

## 14. Investment Analysis

RISE has not funded or touched this project (Section 12); there is no prior work to avoid duplicating.

### 14.1 Functional Enablement

None required at the SDK layer - `pip install edge-impulse-linux` already works on riscv64 by construction (pure Python, no native extension). The only functional gap is outside this repository: confirming or enabling riscv64 output from Edge Impulse's `.eim`-producing inferencing toolchain (EON Compiler / Studio deployment pipeline), which was not in scope for this report and would need its own investigation.

### 14.2 Performance Optimization

Not applicable. This SDK has no SIMD/JIT/compute-kernel surface of its own to optimize (Section 4). Any performance work belongs to its required dependency, NumPy (RVV kernel support still open, [numpy/numpy#26200](https://github.com/numpy/numpy/issues/26200)), and its optional dependency, OpenCV (RVV correctness fixes still open, [opencv/opencv#27279](https://github.com/opencv/opencv/issues/27279), [#27281](https://github.com/opencv/opencv/issues/27281)) - both already tracked as independent projects in this project-reports set, not specific to this SDK.

### 14.3 CI/CD Infrastructure

None required. The existing sdist-and-publish workflow already produces a riscv64-installable artifact with no changes. Adding a riscv64 test job would provide no additional confidence given there is no architecture-specific code path to test, though a smoke-test job that installs the sdist and imports `edge_impulse_linux` on a riscv64 runner would be a low-cost, low-priority verification step.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per instructions, as this is a standalone SDK client, not a project with a significant dependent package ecosystem of its own.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Investigate riscv64 output support in Edge Impulse's `.eim`/inferencing-toolchain build pipeline (separate repository, out of scope here) | Data not available - not sized, requires separate investigation of the inferencing-engine repository | Edge Impulse / Qualcomm | Medium |
| CI/CD | Optional: add a riscv64 smoke-test CI job (install sdist, import package) for regression confidence | 0.5 | Edge Impulse | Low |
| Dependency | Track upstream NumPy riscv64 test-failure resolution ([numpy/numpy#32461](https://github.com/numpy/numpy/issues/32461), [#32376](https://github.com/numpy/numpy/issues/32376)) | N/A (upstream NumPy work, not this project) | NumPy upstream | Low (informational tracking only) |
| Dependency | Track upstream OpenCV RVV accuracy fixes ([opencv/opencv#27279](https://github.com/opencv/opencv/issues/27279), [#27281](https://github.com/opencv/opencv/issues/27281)) | N/A (upstream OpenCV work, not this project) | OpenCV upstream | Low (informational tracking only) |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [edgeimpulse/linux-sdk-python repository](https://github.com/edgeimpulse/linux-sdk-python)
- [publish-to-pypi.yml CI workflow](https://github.com/edgeimpulse/linux-sdk-python/blob/master/.github/workflows/publish-to-pypi.yml)
- [GitHub Releases page (zero releases)](https://github.com/edgeimpulse/linux-sdk-python/releases)
- [edge-impulse-linux on PyPI](https://pypi.org/project/edge-impulse-linux/)
- [edge-impulse-linux PyPI JSON API](https://pypi.org/pypi/edge-impulse-linux/json)
- [Edge Impulse Linux Python SDK documentation](https://docs.edgeimpulse.com/docs/tools/edge-impulse-for-linux/linux-python-sdk)
- [RISE Project members page](https://riseproject.dev/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [NumPy issue #26200 - RVV 1.0 vectorized-kernel support](https://github.com/numpy/numpy/issues/26200)
- [NumPy issue #32461 - test_unary_spurious_fpexception fails on riscv](https://github.com/numpy/numpy/issues/32461)
- [NumPy issue #32376 - float-exception/floor-division test failures](https://github.com/numpy/numpy/issues/32376)
- [NumPy issue #30216 - manylinux riscv64 wheels tracking issue](https://github.com/numpy/numpy/issues/30216)
- [OpenCV issue #27279 - Imgproc_Remap_Test.accuracy fails with RVV](https://github.com/opencv/opencv/issues/27279)
- [OpenCV issue #27281 - Imgproc_WarpPerspective_Test.accuracy fails with RVV](https://github.com/opencv/opencv/issues/27281)
- [OpenCV issue #19844 - GAPI tests fail on RISC-V](https://github.com/opencv/opencv/issues/19844)
- [OpenCV PR #28144 - disable RVV path mitigation for remap/warpPerspective](https://github.com/opencv/opencv/pull/28144)
- [riseproject-dev/sw-ecosystem project-reports queue file](https://github.com/riseproject-dev/sw-ecosystem)
