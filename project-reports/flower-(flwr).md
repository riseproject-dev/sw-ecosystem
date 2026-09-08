---
title: Flower (flwr)
parent: Project Reports
color: green
---

# Flower (flwr)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for Flower (flwr)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Flower (`flwr`) is a federated-learning orchestration framework: it coordinates distributed model training across a set of client "nodes" (SuperNode) driven by a server ("SuperLink"/"SuperExec"), and is backend-agnostic with respect to the ML library used inside each client (PyTorch, TensorFlow, JAX, scikit-learn, etc.). Homepage: [flower.ai](https://flower.ai/). Repository: canonical location moved from `adap/flower` to `flwrlabs/flower` on 2026-03-11 via [PR flwrlabs/flower#6743](https://github.com/flwrlabs/flower), "Migrate GitHub org references from adap to flwrlabs"; the old `adap/flower` URL still resolves.

**Governance and corporate sponsors.** Flower is not hosted by a neutral foundation (not LF AI & Data, not Apache Software Foundation, not CNCF). It is a VC-backed corporate open-source project owned and steered by Flower Labs GmbH (Y Combinator W23 alumnus). Governance is de facto by the company's founding team: `.github/CODEOWNERS` lists Taner Topal (@tanertopal) and Daniel J. Beutel (@danieljanes), Flower Labs co-founders, as default/catch-all owners for nearly every path in the repository, with sub-area owners also being Flower Labs employees. No MAINTAINERS/OWNERS/GOVERNANCE.md, no formal RFC process, and no external (non-employee) CODEOWNERS were found. License is Apache-2.0.

**Funding.** Flower Labs raised a $3.6M pre-seed round (2023, First Spark Ventures) and a $20M Series A (Feb 2024, led by Felicis, with First Spark Ventures, Factorial Capital, Betaworks, Y Combinator, Pioneer Fund, Mozilla Ventures, and individual angels including Hugging Face's Clem Delangue and GitHub co-founder Scott Chacon), for a total of roughly $24.1M raised. [NEEDS VERIFICATION: funding figures were surfaced via web search summaries, not a primary SEC/Crunchbase filing fetched directly in this research pass.] Flower.ai lists MIT, Harvard, University of Cambridge, TUM, NHS, J.P. Morgan, Banking Circle, Mozilla, and Owkin as adopters/collaborators, not governance sponsors.

**Community culture on new ports.** No open issues, discussions, or documentation requesting or rejecting RISC-V or other new-architecture support were found in `flwrlabs/flower` or `adap/flower`. This is consistent with the technical finding below: because the core package ships as a single architecture-independent Python wheel, the question of "porting to a new CPU architecture" has structurally not come up for maintainers or the community.

## 2. Port History and Upstreoming Timeline

No RISC-V port exists, and none has ever been attempted, requested, or discussed.

| Date | Event | Source |
|---|---|---|
| N/A | No riscv64-related issue, PR, commit, or discussion exists in `adap/flower` or `flwrlabs/flower` | Exhaustive issue/PR/commit/discussion search returned zero results across every query variant ("riscv", "riscv64", "risc-v"); confirmed independently via [GitHub code search](https://github.com/search) (`riscv repo:adap/flower` -> 0 results) and the public GitHub issue-search UI |

**Key contributors:** none, because no port exists.

**Is it fully upstream?** Not applicable, there is no port to be upstream or out-of-tree. The question does not arise because the shipped `flwr` PyPI package requires no architecture-specific code at all (see Section 4).

## 3. Upstream Support Tier

No formal platform-support tier policy (Tier 1/2/3, etc.) exists in the repository or documentation. No `PLATFORMS.md` or `SUPPORT.md` file was found. Release engineering targets the standard Python packaging matrix: a single universal wheel plus a source distribution, not a per-architecture build matrix.

The one place the project does draw an explicit per-architecture line is its Docker image build matrix, which is OS/base-image selection in CI, not source-level architecture branching:

| Target | Docker multi-arch build (`_docker-build.yml`) | PyPI wheel | CI test execution |
|---|---|---|---|
| amd64 | yes (`linux/amd64`, `ubuntu-24.04` runner) | covered by universal `py3-none-any` wheel | yes (standard x86 runners) |
| arm64 | yes (`linux/arm64`, `ubuntu-4-core-arm64` runner) | covered by universal `py3-none-any` wheel | yes (standard test suite; arm64-specific coverage for Docker images) |
| riscv64 | absent (no platform entry, no QEMU riscv64 step) | covered by universal `py3-none-any` wheel (installs, but no upstream riscv64 CI validates it) | none |

Source: `_docker-build.yml` matrix block read directly from the cloned repository:
```yaml
matrix:
  platform:
    [
      { name: "amd64", docker: "linux/amd64", runner-os: "ubuntu-24.04" },
      { name: "arm64", docker: "linux/arm64", runner-os: "ubuntu-4-core-arm64" },
    ]
```
No riscv64 entry exists in this or any of the other 23 workflow files in `.github/workflows/`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

**Flower has no architecture-specific subsystems for any CPU architecture, including amd64 and arm64.** This was independently confirmed via [GitHub code search](https://github.com/search) against `adap/flower` for `__riscv`, `riscv`, `__aarch64__`, `__x86_64__`, and `platform.machine` (0 results for all five queries) and a full local `git grep` of the cloned working tree:

- The core `flwr` package is pure Python: no JIT, no SIMD/vectorization code, no hand-written assembly, no GC barriers (standard CPython garbage collection), no crypto primitives implemented in-house (delegates to `cryptography` and `pycryptodome`).
- An optional C++ client SDK exists at `framework/cc/flwr/` (45 files total across this directory and `examples/quickstart-cpp/`), consisting of generated gRPC/protobuf bindings and a plain example client. `git grep -inE '__riscv|__aarch64__|__x86_64__|__arm__'` across the entire repository returned zero matches. No `#ifdef`/`#if defined` architecture guard, inline assembly, or SIMD intrinsic exists anywhere in this SDK.
- No `Cargo.toml`, `.rs`, or `.go` native subprojects exist; no `ext_modules`, Cython, or cffi native-extension build appears in any `pyproject.toml` or `setup.py`.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core framework (`flwr` Python package) | N/A - pure Python, arch-agnostic | N/A - pure Python, arch-agnostic | N/A - pure Python, arch-agnostic |
| C++ client SDK (`framework/cc/flwr`) | N/A - portable C++, no arch guards | N/A - portable C++, no arch guards | N/A - portable C++, no arch guards |
| Docker images (`_docker-build.yml`) | present (`linux/amd64` buildx target, base-image selection only) | present (`linux/arm64` buildx target, base-image selection only) | absent (no `linux/riscv64` buildx target, no QEMU step) |

**Conclusion:** the only true amd64-vs-arm64 asymmetry anywhere in the project is the Docker multi-arch build matrix (a CI/base-image concern, not source code), and riscv64 is simply absent from it. This is not a riscv64-specific gap relative to hand-tuned amd64/arm64 code paths, because no such hand-tuned paths exist for any architecture: Flower is not an optimization-purpose project (see Section 13).

## 5. Build System, Cross-Compilation, and Toolchain

No riscv64 build system documentation, toolchain file, Dockerfile, or CI configuration exists anywhere in the repository. Specifics from a direct file-content search of the cloned repository (`adap/flower`, HEAD `618671c2612882b1137b4d3747b9d7917bef3e70`):

- No `BUILDING.md` or `INSTALL` file exists at all.
- Only two `CMakeLists.txt` files exist in the repository (`framework/cc/flwr/CMakeLists.txt` and `examples/quickstart-cpp/CMakeLists.txt`), both for the optional C++ client SDK. Neither references `riscv`, `RISCV`, or any architecture-specific flag; their only cross-compiling logic is generic boilerplate copied from gRPC's own examples to locate a pre-built `grpc_cpp_plugin`.
- No `cmake/riscv64.cmake` or any `*.cmake` toolchain file exists (`find . -iname "*.cmake"` returns nothing).
- 8 Dockerfiles exist across `framework/docker/{superlink,supernode,superexec,python/ubuntu,base/ubuntu,base/ubuntu-cuda,base/alpine}/Dockerfile` and `.devcontainer/Dockerfile`; none reference riscv64.
- No QEMU riscv64 usage, no known riscv64 build failures documented, because no riscv64 build has ever been attempted upstream.

**For an end user:** since the core `flwr` package is a pure-Python universal wheel, the ordinary command `pip install flwr` is the entire "build" procedure on riscv64. Getting a working install requires no compiler and no cross-toolchain for `flwr` itself; the practical friction is entirely in its compiled dependencies (see Section 9), several of which lack official riscv64 PyPI wheels and therefore build from source via pip's normal sdist fallback (requiring a C/C++ compiler and, for `cryptography`, a Rust toolchain).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core framework (client/server orchestration, SuperLink/SuperNode/SuperExec) | full | full | full (pure Python, no code difference) |
| Secure aggregation / TLS / node auth (via `cryptography`, `pycryptodome`) | full | full | functionally available; slow from-source build (no official riscv64 PyPI wheel), see Section 9 |
| gRPC transport | full | full | functionally available; slow from-source build (no official riscv64 PyPI wheel), see Section 9 |
| Official Docker images (SuperLink/SuperNode/SuperExec) | published (`linux/amd64`) | published (`linux/arm64`) | not published, no build target exists |
| `simulation` extra (Ray-backed local federated-learning simulation) | full | full | effectively unsupported: Ray has no Ubuntu/Debian package on any architecture and no active riscv64 porting work found (see Section 9) |

**Functional gaps:** the only unconditional gap is the absence of published riscv64 Docker images, since no CI target builds them. A riscv64 user must run Flower components directly via `pip install flwr` rather than pulling an official container image.

**Performance gaps:** not applicable in the SIMD/vectorization sense, Flower has no SIMD code paths for any architecture (Section 4). Any performance delta on riscv64 would come entirely from the ML backend (PyTorch, TensorFlow, etc.) the user pairs with Flower, and from the from-source build overhead of `cryptography`/`grpcio`/`protobuf` rather than pre-built wheels, both of which are outside Flower's own codebase.

**Security hardening gaps:** none identified specific to riscv64; `cryptography` and `pycryptodome` both have native Ubuntu 26.04 riscv64 packages available (Section 9), so the underlying crypto stack is not architecturally weaker on riscv64, only slower to install from PyPI.

**NaN / floating-point semantics issues:** none found for Flower itself. NumPy (a Flower dependency) has two open upstream RISC-V floating-point-exception test failures (numpy/numpy#32461, numpy/numpy#32376), but these were not observed to affect Flower's own test suite or documented behavior, and no Flower-specific NaN/FP issue reports exist in any channel searched (GitHub issues, RISE blog, general web search).

## 7. CI/CD Infrastructure

No riscv64 CI exists. This is confirmed by direct content inspection, not inference, of all 24 workflow files in `.github/workflows/` of the cloned repository (`_docker-build.yml`, `_repo-authorize-manual-trigger.yml`, `baselines.yml`, `build-deploy-non-framework-docs.yml`, `datasets-e2e.yml`, `datasets-test.yml`, `devtool-test.yml`, `framework-cache-cleanup.yml`, `framework-commit-artifacts.yml`, `framework-docker-readme.yml`, `framework-docs-dispatch-release-branches.yml`, `framework-docs-update-translations.yml`, `framework-docs.yml`, `framework-e2e.yml`, `framework-release-check.yml`, `framework-release-finalize.yml`, `framework-release-nightly.yml`, `framework-release-prepare.yml`, `framework-test.yml`, `repo-check-pr-title.yml`, `repo-check-uv-lock.yml`, `repo-label-pr-author.yaml`, `repo-ping-stale-pr.yml`, `repo-ping-stale-under-discussion.yml`, `repo-update-pr.yml`). A case-insensitive `grep -rniE "riscv|risc-v" .github/workflows/` returned zero matching lines. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository. No RISE RISC-V Runners are referenced anywhere in the codebase, and Flower does not appear in [RISE's own project/member listings](https://riseproject.dev/) (see Section 12).

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job exists | yes (`ubuntu-24.04` runner) | yes (`ubuntu-4-core-arm64` runner) | no |
| Test suite executed | yes | yes (implied by same test workflows; framework-test.yml does not gate by arch for the Python test suite) | no |
| Release-blocking gate | yes (standard x86 CI) | yes (Docker multi-arch build) | no (no job exists to gate) |
| Hardware | cloud x86 runner | cloud arm64 runner (`ubuntu-4-core-arm64`) | N/A |
| RISE runners used | no | no | no |

## 8. Distribution and Release Status

**PyPI** (`https://pypi.org/pypi/flwr/json`): the current release (1.36.0) ships exactly two artifacts, `flwr-1.36.0-py3-none-any.whl` and `flwr-1.36.0.tar.gz`. Both are architecture-independent; there is no riscv64-specific filename because none is needed for a pure-Python universal wheel. All historical versions (0.1.0 through 1.36.0) on the [PyPI simple index](https://pypi.org/simple/flwr/) follow the same pattern.

**RISE Python wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/flwr/`): returns a 302 redirect to plain PyPI, i.e. no separate RISE-built package exists (none is needed).

**Ubuntu 26.04 "resolute"** (`https://packages.ubuntu.com/search?keywords=flwr&suite=resolute&searchon=names&section=all`): no genuine `flower`/`flwr`/`python3-flwr` package exists. The only search hit is `flwrap`, an unrelated amateur-radio file-compression utility (a substring false positive), which is not Flower.

**Arch Linux RISC-V port** (`https://archriscv.felixc.at/`): no `flwr` package listing.

**Project graph database** (Ubuntu 26.04 riscv64 binary index, queried via SPARQL against `deb:BinaryPackage`): zero bindings for any candidate package name (`flower`, `flwr`, `python3-flwr`, etc.).

**GitHub Releases:** exact asset filenames for the `adap/flower` GitHub Releases page could not be enumerated in this research pass (GitHub API access to this repository was not available in the research session; the releases page's asset list is JavaScript-rendered and did not load via unauthenticated fetch). Each release shows "Assets 4", consistent with GitHub's standard auto-attached source zip/tarball plus the two PyPI-mirrored wheel/sdist files, with no indication of riscv64-specific assets. [NEEDS VERIFICATION: GitHub Release asset filenames were not directly enumerated; conclusion is inferred from the PyPI JSON API, which is the canonical release-asset source for this Python package.]

**What a user must do to get a working binary on riscv64:** run `pip install flwr` (or `uv add flwr`) as on any other architecture; there is no riscv64-specific step because the wheel is universal. To get the full stack working, the user separately needs riscv64-compatible builds of `numpy`, `grpcio`, `cryptography`, `pycryptodome`, and `protobuf` (see Section 9), which are best obtained as native Ubuntu 26.04 riscv64 distro packages (`apt install python3-numpy python3-grpcio python3-cryptography python3-pycryptodome python3-protobuf`) rather than from PyPI, since none of these five publish official riscv64 wheels on PyPI as of this writing.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| NumPy | Core numerics/tensor ops (`numpy>=1.26,<3.0`) | builds successfully; upstream CI has a riscv64 QEMU test job | mostly passing; 2 open FP-exception test failures | no official manylinux riscv64 PyPI wheel yet; Ubuntu 26.04 riscv64 package exists | See status report at `project-reports/numpy.md` |
| gRPC / grpcio | RPC transport + health-checking (`grpcio>=1.70,<2.0`) | buildable (proven by Debian/Ubuntu riscv64 package); historical SIGILL/missing-atomic-symbol issues, appear resolved | no dedicated riscv64 CI found; distro autopkgtests imply passing | no official riscv64 PyPI wheel; RISE ships its own outside PyPI; Ubuntu 26.04 riscv64 package exists | See status report at `project-reports/grpc.md` |
| cryptography | TLS/mTLS and crypto primitives (`cryptography>=46.0.7,<47.0`), Rust + OpenSSL-backed | buildable from source (Ubuntu package proves it); historically OOM'd on memory-constrained riscv64 boards (closed/historical) | no open riscv64-specific test failures found | no official riscv64 PyPI wheel; slow (~8 min) from-source build; Ubuntu 26.04 riscv64 package exists | Not in `projects.yml`; no per-project report |
| pycryptodome | Low-level crypto (AES etc.), message encryption (`pycryptodome>=3.18,<4.0`) | builds cleanly (pure C extension, no SIMD/JIT complications found) | no riscv64-specific test issues found | no confirmed official riscv64 PyPI wheel; Ubuntu 26.04 riscv64 package exists | Not in `projects.yml`; no per-project report |
| Protocol Buffers / protobuf | Wire serialization for gRPC messages (`protobuf>=5.28,<7.0`) | riscv64 support added upstream (issue closed via linked PR); historical build failure from bundled-Abseil atomic-symbol issue | no open riscv64 test failures found | no official `protoc` riscv64 prebuilt/Maven-Central binaries historically; Ubuntu 26.04 riscv64 package exists | See status report at `project-reports/protocol-buffers.md` |
| Ray (optional `simulation` extra, `ray==2.55.1`) | Distributed backend for `flwr-simulation`; C++/Cython core, bundles Apache Arrow, Redis-based GCS | no confirmed riscv64 build path; not packaged for any architecture in the Ubuntu archive | unknown, no riscv64 CI evidence | no PyPI riscv64 wheels; no distro package at all | See status report at `project-reports/ray.md` |
| OpenSSL (supporting `cryptography`'s TLS backend) | TLS backend | mature riscv64 support | passing | shipped natively | See status report at `project-reports/openssl.md` |

**Deep-dive: cryptographic and numeric dependencies.**

- **NumPy**: the primary open blockers to an official riscv64 PyPI wheel are [numpy/numpy#30216](https://github.com/numpy/numpy) (build/distribute riscv64 wheels, blocked on riscv64 `openblas-libs` wheels and `setup-python` lacking riscv64 support) and [numpy/numpy#26200](https://github.com/numpy/numpy) (RISC-V Vector/RVV SIMD support, blocked on a NEP-054/Highway-library architecture decision). Two open floating-point test failures are tracked at numpy/numpy#32461 and #32376 (August 2026). None of these are Flower-specific; they affect any Python project depending on NumPy on riscv64.
- **grpcio**: [grpc/grpc#41591](https://github.com/grpc/grpc) tracks the missing official PyPI riscv64 wheel (open, assigned, no PR yet). Two historical crash bugs, a SIGILL from an outdated bundled abseil-cpp submodule (grpc/grpc#37791, closed/fixed) and an undefined `__atomic_compare_exchange_1` symbol requiring `-latomic` (grpc/grpc#35839, closed but marked reporter-action/help-wanted), both appear resolved on modern toolchains.
- **cryptography**: [pyca/cryptography#14460](https://github.com/pyca/cryptography) tracks the riscv64 wheel request (marked closed, but resolution/PR could not be directly confirmed via public page in this pass) [NEEDS VERIFICATION]. A historical OOM during riscv64 build (pyca/cryptography#8640, closed) appears to be a QEMU/low-RAM artifact rather than an architectural blocker.
- **protobuf**: riscv64 support was added upstream via a linked, closed PR against [protocolbuffers/protobuf#12266](https://github.com/protocolbuffers/protobuf); a related build failure from Abseil atomic symbols is also closed (protocolbuffers/protobuf#14549). No official `protoc` riscv64 prebuilt binaries on Maven Central historically (protocolbuffers/protobuf#17798, status unclear).
- **Ray**: the only riscv64-relevant issue found is [ray-project/ray#54162](https://github.com/ray-project/ray), an automated bot-generated porting-complexity assessment ("middle" difficulty), closed with no visible real engineering follow-up. This is the weakest link in Flower's dependency stack: Ray gates the optional `flwr-simulation` extra and has neither a distro package on any architecture nor active riscv64 porting work.

**Summary.** Flower's core dependency stack (NumPy, grpcio, cryptography, pycryptodome, protobuf) is buildable and natively packaged on Ubuntu 26.04 riscv64, resolved directly in the project graph database for the `resolute` suite. The uniform gap across all five is the absence of official riscv64 PyPI wheels, meaning `pip install flwr` on riscv64 without the distro packages falls back to slow from-source builds (a Rust toolchain for `cryptography`, C++ toolchains for grpcio/protobuf). Historical riscv64-specific crash bugs in grpc/protobuf appear resolved upstream. Ray, required only for the `simulation` extra, is the one clear functional gap: Flower's simulation workflows are effectively unsupported on riscv64, while its core client/server/crypto stack is workable via distro packages.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| N/A | No riscv64-related issue exists in `adap/flower` or `flwrlabs/flower` | N/A | N/A | Confirmed by exhaustive issue search (all queries: "riscv", "riscv64", "risc-v") returning zero results, cross-checked via [GitHub code search](https://github.com/search) (`riscv repo:adap/flower` -> 0 results) |

No correctness bugs, no performance regressions, and no NaN/floating-point issue reports specific to Flower on RISC-V were found in any channel searched (GitHub issues on `flwrlabs/flower`, general web search, RISE project blog full listing of ~33 post titles). This is an untested/unbenchmarked combination rather than a known-broken one: there is no public performance benchmark data for Flower on riscv64 from any source consulted.

## 12. Objections and Upstream Blockers

No stated objections to riscv64 support exist, because the topic has never been raised. No technical blocker exists at the Flower layer itself (pure-Python universal wheel, Section 4). The practical blockers that would affect a riscv64 deployment sit one layer down, in Flower's dependencies:

- **Organizational blocker:** Flower Labs GmbH is a small, VC-backed company (CODEOWNERS concentrated in two co-founders); there is no community pressure or filed request creating any backlog for a RISC-V initiative, so nothing is pending upstream to accept or reject.
- **Technical blocker (secondary, dependency-level):** Ray, gating the optional `flwr-simulation` extra, has no riscv64 build path and no active porting work (ray-project/ray#54162 is a closed automated assessment, not an active workstream).
- **RISE membership:** Flower / Flower Labs is not a RISE member. `riseproject.dev/members/` lists Premier members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and General members (Akeana, Andes, Canonical, Microchip, ZTE, and others), none of which is Flower Labs. The RISE AI/ML Working Group's stated framework scope is PyTorch, TensorFlow, TFLite, and llama.cpp; Flower is not named as a tracked or supported framework anywhere on the RISE site.

**Acceptance probability, if a riscv64 initiative were proposed:** high, and largely moot for the core package. Because `flwr` is architecture-independent by construction, there is no "port" to accept or reject; any future work would be limited to (a) adding a `linux/riscv64` target to the Docker multi-arch build matrix, and (b) upstream/RISE work on the dependency chain (NumPy, grpcio, cryptography, Ray) that is outside Flower's own repository and already tracked in those projects' own issue trackers.

## 13. Readiness Assessment

- **Color:** green (no color_case; Step 0 architecture-independent shortcut applies)
- **Release provider:** upstream (PyPI, published by Flower Labs)
- **Justification:** Flower's core distributed artifact is a single architecture-independent Python wheel, `flwr-1.36.0-py3-none-any.whl` ([PyPI](https://pypi.org/project/flwr/)), with no compiled extensions and no architecture-specific code anywhere in the repository (confirmed via [GitHub code search](https://github.com/search) returning 0 results for `riscv`, `__riscv`, `__aarch64__`, and `__x86_64__` against `adap/flower`, and a full local `git grep` of the cloned tree). Per the color model's Step 0 (architecture-independent shortcut), a pure-Python `py3-none-any` wheel runs on riscv64 by construction and is classified green without penalty for lacking dedicated riscv64 CI, since none is structurally needed for the package itself.
- **Pending work that could change the grade:** none identified that would change the *package's own* color. The grade is stable regardless of RISE involvement, because there is no compiled artifact for RISE (or anyone) to build. The items that could matter to a deploying organization, without changing this color, are: (1) NumPy's still-open riscv64 wheel-publishing issue ([numpy/numpy#30216](https://github.com/numpy/numpy)); (2) the absence of official riscv64 PyPI wheels for grpcio, cryptography, pycryptodome, and protobuf, mitigated today by native Ubuntu 26.04 riscv64 distro packages; and (3) Ray's lack of any riscv64 (or any-architecture Ubuntu) package, which blocks only the optional `flwr-simulation` extra, not core Flower usage. None of these are tracked by RISE for Flower specifically; RISE has no involvement with this project at all (Section 12).

## 14. Investment Analysis

**RISE prior work check:** no RISE blog post, no dedicated `riseproject-dev` repository, no RISE RISC-V Runner usage, and no funded work tied to Flower (flwr) were found (full 25-post RISE blog listing scanned, `riseproject-dev` GitHub org's 25 repos enumerated, `search_code` for "flwr" across `org:riseproject-dev` returned no real hits). There is nothing already covered by RISE to net out of the estimates below. Note that RISE's broader dependency-level work (e.g. the [Python-on-RISC-V announcement](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/) and [PyTorch-on-riscv64 availability](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)) benefits Flower indirectly as a downstream consumer, without any Flower-specific engagement.

### 14.1 Functional Enablement

Because the core package already works on riscv64 by construction, functional enablement work is entirely at the dependency and packaging layer, not inside Flower's own codebase:
- Track and, where feasible, contribute to NumPy's riscv64 wheel-publishing effort ([numpy/numpy#30216](https://github.com/numpy/numpy)) so `pip install flwr` gets a fast binary install path rather than a distro-package workaround.
- Package `grpcio`, `cryptography`, and `pycryptodome` riscv64 wheels via the RISE Python wheel builder (mirroring the model already used for other packages on `gitlab.com/riseproject/python/wheel_builder`), since none currently exist on PyPI.
- Investigate a riscv64 build/package for Ray, or explicitly document that `flwr-simulation` is unsupported on riscv64 pending upstream Ray support.

### 14.2 Performance Optimization

Not applicable to Flower itself: the project has no SIMD/JIT/hand-tuned code paths for any architecture (Section 4), so there is no Flower-specific optimization backlog. Any performance work belongs entirely to the ML backend (PyTorch, TensorFlow, etc.) a deployment pairs with Flower, which is out of scope for this report.

### 14.3 CI/CD Infrastructure

- Add a `linux/riscv64` entry to the `_docker-build.yml` multi-arch matrix (currently `linux/amd64` and `linux/arm64` only) so official SuperLink/SuperNode/SuperExec container images are published for riscv64.
- No source-level CI changes are needed for the core Python test suite, since it is architecture-independent; a riscv64 runner (e.g. a RISE RISC-V Runner) added to `framework-test.yml` would primarily serve as a confidence signal, not a functional requirement.

### 14.4 Ecosystem Enablement

Not applicable as a distinct section (Section 10 omitted): Flower's core package has no dependent plugin/extension ecosystem analogous to a language package index that itself needs enabling on riscv64. Its own dependency chain is covered in Section 9.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Contribute to / track NumPy riscv64 PyPI wheel publishing ([numpy/numpy#30216](https://github.com/numpy/numpy)) | 1-2 (contribution/tracking, not full ownership) | RISE / NumPy upstream | Medium |
| Functional | Build and publish riscv64 wheels for grpcio, cryptography, pycryptodome via RISE Python wheel builder | 2-3 | RISE | Medium |
| Functional | Evaluate Ray riscv64 packaging (or document `flwr-simulation` as unsupported) | 1 (evaluation) | RISE / Flower Labs | Low |
| CI/CD | Add `linux/riscv64` target to `_docker-build.yml` Docker multi-arch matrix | 0.5-1 | Flower Labs | Low |
| CI/CD | Add optional riscv64 CI runner to `framework-test.yml` for confidence signal | 0.5 | Flower Labs (with RISE runner support) | Low |

## 15. Updates

(No updates yet, initial report dated 2026-06-17.)

## 16. References

- [Flower homepage](https://flower.ai/)
- [Flower GitHub repository (canonical, flwrlabs/flower)](https://github.com/flwrlabs/flower)
- [Flower GitHub repository (legacy URL, adap/flower)](https://github.com/adap/flower)
- [Flower on PyPI](https://pypi.org/project/flwr/)
- [PyPI JSON API for flwr](https://pypi.org/pypi/flwr/json)
- [PyPI simple index for flwr](https://pypi.org/simple/flwr/)
- [Ubuntu package search (resolute/26.04)](https://packages.ubuntu.com/search?keywords=flwr&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package index](https://archriscv.felixc.at/)
- [RISE Python wheel builder index](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE project members](https://riseproject.dev/members/)
- [RISE project blog](https://riseproject.dev/blog/)
- [RISE: Python Now Officially Supports RISC-V](https://riseproject.dev/2026/08/24/python-now-officially-supports-risc-v/)
- [RISE: PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)
- [NumPy issue: build/distribute riscv64 wheels](https://github.com/numpy/numpy)
- [NumPy issue: RISC-V Vector/RVV SIMD support](https://github.com/numpy/numpy)
- [grpc issue: no official PyPI riscv64 wheel](https://github.com/grpc/grpc)
- [pyca/cryptography issue: riscv64 PyPI wheel request](https://github.com/pyca/cryptography)
- [protocolbuffers/protobuf issue: add riscv64 support](https://github.com/protocolbuffers/protobuf)
- [ray-project/ray issue: riscv64 porting complexity assessment](https://github.com/ray-project/ray)
- [GitHub code search across adap/flower for "riscv"](https://github.com/search)
- Status report: `project-reports/numpy.md`
- Status report: `project-reports/grpc.md`
- Status report: `project-reports/ray.md`
- Status report: `project-reports/protocol-buffers.md`
- Status report: `project-reports/openssl.md`