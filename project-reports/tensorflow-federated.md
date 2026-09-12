---
title: TensorFlow Federated
parent: Project Reports
color: orange
dependencies:
  - name: TensorFlow
    relation: runtime-dependency
    criticality: critical
  - name: Eigen
    relation: runtime-dependency
    criticality: critical
  - name: gRPC
    relation: runtime-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: critical
  - name: NumPy
    relation: runtime-dependency
    criticality: critical
  - name: SciPy
    relation: runtime-dependency
    criticality: optional
  - name: differential-privacy
    relation: runtime-dependency
    criticality: optional
  - name: pybind11
    relation: runtime-dependency
    criticality: critical
  - name: federated_language
    relation: runtime-dependency
    criticality: optional
  - name: ml_dtypes
    relation: runtime-dependency
    criticality: optional
  - name: dm-tree
    relation: runtime-dependency
    criticality: optional
  - name: wrapt
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="tensorflow-federated" %}

# TensorFlow Federated

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for TensorFlow Federated<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

TensorFlow Federated (TFF) is a Python framework for federated learning and federated analytics research, built on TensorFlow's C++ ops via pybind11 and gRPC for cross-device computation coordination. It is hosted at [google-parfait/tensorflow-federated](https://github.com/google-parfait/tensorflow-federated), with homepage [tensorflow.org/federated](https://www.tensorflow.org/federated).

**Governance:** TFF has no independent foundation. It is not under LF AI & Data, CNCF, Apache Software Foundation, or any neutral governance body. It is hosted on the `google-parfait` GitHub org, described by Google as run by "a team of researchers and engineers at Google." Contributors must sign a Google CLA, and the project "follows Google's Open Source Community Guidelines." Development actually happens in an internal Google monorepo; public commits are synced out by an automated `copybara-github` bot, meaning design review and real decision-making are not visible on GitHub. No `MAINTAINERS`, `MAINTAINERS.md`, `OWNERS`, or `CODEOWNERS` file exists in the repo (all return 404). License: Apache-2.0.

**Corporate maintainers:** Effectively 100% Google. Visible recent committers (ZacharyGarrett, albertcheu, xiaoyux11, stanischikn, h-joo, plus batch commits attributed to "TensorFlow Federated Team") are all Google-affiliated; no external-company co-maintainers were found in the public commit history available without authenticated API access [NEEDS VERIFICATION - full contributor/employer mapping not confirmable without authenticated GitHub API access].

**Community culture on new ports:** No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` exists, so there is no documented platform-tier policy to gauge a stance from. There is no evidence of either welcome or rejection of a RISC-V port - the repository shows zero RISC-V engagement of any kind (see Section 2), which reads as unexamined rather than considered-and-declined.

## 2. Port History and Upstreaming Timeline

No RISC-V port history exists. Confirmed via GitHub `search_issues`, `search_pull_requests`, and `search_commits` scoped to `google-parfait/tensorflow-federated` with queries for "riscv", "riscv64", "RISC-V", and title/body-scoped variants - all returned zero results. A case-insensitive grep of the full cloned repository tree (HEAD `bc14789a9e0a73b03dd0a7006e9da49d589c322a`) for "riscv" also returned zero matches.

| Date | Event | Source |
|---|---|---|
| - | No RISC-V-related commit, issue, or PR has ever been filed | [GitHub search across the repo](https://github.com/google-parfait/tensorflow-federated) |

**Key contributors to a RISC-V port:** none - no such effort exists.

**Is it fully upstream:** Not applicable; there is nothing to upstream because no port work has been started.

## 3. Upstream Support Tier

No formal tier policy document exists (`PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/` all 404). The closest signal is the set of C++ toolchains actually registered in the build: `WORKSPACE` registers exactly two platforms via `rules_ml_toolchain` (pinned `0.4.0-rc2`):

```
register_toolchains("@rules_ml_toolchain//cc:linux_x86_64_linux_x86_64")
register_toolchains("@rules_ml_toolchain//cc:linux_aarch64_linux_aarch64")
```

riscv64 has no registered toolchain at all - a `bazel build` targeting riscv64 would fail at toolchain resolution before any TensorFlow-related build issue is even reached.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Bazel C++ toolchain registered | yes (`linux_x86_64`) | yes (`linux_aarch64`) | no |
| CI builds and tests | yes (`publish.yaml`, `ubuntu-latest`) | no dedicated job | no |
| Official PyPI wheel published | yes, all 87 historical releases | no ([PyPI JSON](https://pypi.org/pypi/tensorflow-federated/json) lists only `manylinux_2_31_x86_64`) | no |
| Release-blocking | yes (only arch built) | n/a | n/a |

Note that even arm64, despite having a registered Bazel toolchain, has no published PyPI wheel - the toolchain appears to exist for internal Google build purposes and is not exercised by the public `publish.yaml` release pipeline, which builds exclusively inside an `ubuntu:22.04` container on `ubuntu-latest` (x86_64) runners.

## 4. Technical Architecture and RISC-V-Specific Subsystems

TFF's own repository contains no architecture-specific code for **any** CPU architecture, not just riscv64. GitHub code search against `google-parfait/tensorflow-federated` for `__riscv`, `riscv64`, `__x86_64__`, `__aarch64__`, `@platforms//cpu` (Bazel `select()`), and `arm64` all returned zero matches. The one relevant hit, for `manylinux`, is the hardcoded wheel platform tag in `pyproject.toml`: `plat-name = "manylinux_2_27_x86_64"` - a fixed string, not a parameterized target.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `#ifdef`/CPU-guard C++ code in TFF's own sources | none found | none found | none found |
| Bazel `select()` on `@platforms//cpu` | none found | none found | none found |
| Wheel platform tag (`pyproject.toml`) | hardcoded `x86_64` | absent | absent |

TFF is pure Python plus a thin Bazel/C++ binding layer (pybind11) over upstream TensorFlow. All SIMD, JIT (XLA), and numeric-kernel work is delegated entirely to the TensorFlow/XLA/Eigen stack, which lives in the separate `tensorflow/tensorflow` repository, not in TFF. There is no per-architecture optimization layer within TFF for any ISA - riscv64 is in the same "never contemplated" bucket as arm64 within this repo specifically, though arm64 has at least a registered (if unused-by-release) Bazel toolchain.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel only. No CMake anywhere in the repository - no `CMakeLists.txt`, no `cmake/` directory, no riscv64 toolchain file of that kind. No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exist. No Dockerfiles exist anywhere in the repo (`find . -iname "*dockerfile*"` and a GitHub code search for `filename:Dockerfile` both returned nothing).

**Documented build path** (`docs/install.md`, "Build the TensorFlow Federated Python package from source"): install Bazel, `git clone`, create a Python venv, then:
```
bazel run //tools/python_package:build_python_package -- --output_dir=...
```
This is architecture-agnostic Bazel guidance with no per-arch flags, no `-DUSE_X=OFF`-style CMake options (not applicable, this project does not use CMake), and no QEMU mentions anywhere in the repo.

**Toolchain requirement for riscv64:** none exists. As noted in Section 3, `WORKSPACE` registers only `linux_x86_64` and `linux_aarch64` toolchains via `rules_ml_toolchain-0.4.0-rc2`. A riscv64 build would require a new toolchain to be added upstream to `rules_ml_toolchain` and registered in TFF's own `WORKSPACE` before a build could even be attempted.

**Known build failures:** None reported for TFF itself - no one has filed an issue attempting to build it on riscv64 (Section 2). However, TFF hard-pins `tensorflow==2.21.*` (`requirements.in`, `pyproject.toml`, and a `WORKSPACE` `http_archive` source build), and TensorFlow itself has a documented, multi-year history of riscv64 build breakage: two currently-open issues ([tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159), opened 2025-10, "Can't compile tensorflow 2.19.1 on riscv"; [tensorflow#100940](https://github.com/tensorflow/tensorflow/issues/100940), opened 2025-09, "Compile Tensorflow on riscv64 platform"), plus closed-but-recurring breakage ([tensorflow#75555](https://github.com/tensorflow/tensorflow/issues/75555), Bazel build fails 2.17.0; [tensorflow#64987](https://github.com/tensorflow/tensorflow/issues/64987), TFLite cpuinfo missing `sys/hwprobe.h`; [tensorflow#62241](https://github.com/tensorflow/tensorflow/issues/62241), soft-float/double-float link mismatch; [tensorflow#47636](https://github.com/tensorflow/tensorflow/issues/47636), TFLite riscv build). Since TFF's build depends on successfully building TensorFlow from source via Bazel, these unresolved TensorFlow-level failures are a practical precondition blocker for any TFF riscv64 build attempt, even though no one has yet tried TFF specifically.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Installable via `pip install tensorflow-federated` | yes | no | no |
| Buildable from source (documented path works) | yes | untested/unclear (toolchain registered, no CI) | no (no toolchain, and pinned TensorFlow dependency has open unresolved build failures) |
| Any TFF functionality exercised at all | yes | no | no |

**Functional gap:** Complete. There is no riscv64 build, binary, or documented path to one - 0% of TFF's feature surface is available on riscv64 through any channel checked.

**Performance gap:** Not applicable - nothing runs, so no performance delta can be measured. Data not available: no riscv64 build exists to benchmark.

**Security hardening gaps:** Not assessed - no build exists to assess. Note (from the dependency-chain research) that `differential-privacy`/`dp-accounting`, which underlies TFF's DP-accounting mechanisms, relies on RNG seeded via `RAND_bytes`; a related dependency-level concern is tracked at [OpenSSL#20980](https://github.com/openssl/openssl/issues/20980) (AES not constant-time without Zkn extensions on riscv64) - relevant if/when TFF's DP mechanisms are ever exercised on riscv64 hardware.

**NaN / floating-point semantics issues:** Data not available: no riscv64 build of TFF or its numeric path (TensorFlow/XLA/Eigen) has been exercised to observe any such issues specific to TFF.

## 7. CI/CD Infrastructure

**Verdict: no riscv64 CI exists.** The repository has exactly one CI workflow, [`.github/workflows/publish.yaml`](https://github.com/google-parfait/tensorflow-federated/blob/main/.github/workflows/publish.yaml) (216 lines, reviewed in full). No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/config.yml`, `.travis.yml`, or `azure-pipelines.yml` exist.

**Trigger:** `push` to `main` path-filtered on `tensorflow_federated/version.py` (i.e., release cuts), or `workflow_dispatch`. Not `pull_request`.

**Jobs (all `runs-on: ubuntu-latest`):**

| Job | Runner | Purpose |
|---|---|---|
| `publish-release` | `ubuntu-latest` | Creates a GitHub release (no build) |
| `build-package` | `ubuntu-latest` + `container: ubuntu:22.04` | Builds the Python wheel via `bazelisk` |
| `test-package` | `ubuntu-latest` | Installs and smoke-tests the wheel |
| `publish-package` | `ubuntu-latest` | Publishes to PyPI via trusted publishing |

No `arch:` field, no riscv64 label, no ARM runner, no `docker/setup-qemu-action`, no `docker buildx`, no `--platform` flags, no cross-compilation toolchain references anywhere in the file. Grep for "riscv" (case-insensitive) in `publish.yaml`: zero matches.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI: build | yes | no | no |
| CI: test | yes | no | no |
| CI: release (release-blocking) | yes (sole publish path) | no | no |
| RISE runner usage | no | no | no |

No RISE (RISC-V Software Ecosystem) runners are referenced anywhere in the CI config or repository.

## 8. Distribution and Release Status

**PyPI** ([`https://pypi.org/pypi/tensorflow-federated/json`](https://pypi.org/pypi/tensorflow-federated/json)): latest version 0.87.0 ships exactly one wheel, `tensorflow_federated-0.87.0-py3-none-manylinux_2_31_x86_64.whl`. The full index ([`https://pypi.org/simple/tensorflow-federated/`](https://pypi.org/simple/tensorflow-federated/)) lists 87 wheel files across all historical versions (0.1.0-0.87.0) - every one built for `manylinux_*_x86_64`. No riscv64 wheel has ever been published.

**GitHub Releases:** Recent tags 0.88.0, 0.87.0, 0.86.0, 0.85.0, 0.84.0, 0.83.0, 0.82.0, 0.81.0, 0.80.0, 0.79.0. The expanded-assets fragment for the latest release (v0.88.0) lists exactly two assets: `v0.88.0.zip` and `v0.88.0.tar.gz` - source archives only, no prebuilt binaries of any architecture.

**Ubuntu (packages.ubuntu.com, resolute/26.04 suite):** Search for "TensorFlow Federated" and "tensorflow-federated" both return "Sorry, your search gave no results." The package does not exist in Ubuntu resolute for any architecture, riscv64 included.

**Project graph (SPARQL, Ubuntu 26.04 resolute riscv64):** Query for `tensorflow federated` / `python3-tensorflow-federated` / `libtensorflow-federated` returned zero bindings.

**Arch Linux RISC-V port** ([archriscv.felixc.at](https://archriscv.felixc.at/)): no matching package entry.

**RISE GitLab wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tensorflow-federated/`): returns HTTP 302, redirecting straight to upstream PyPI - no separate RISE-built package exists for this project.

**What a user must do to get a working binary today:** There is no path. A user would first need TensorFlow 2.21.x to build successfully on riscv64 (currently blocked by open, unresolved upstream issues - Section 5), then would need a riscv64 Bazel toolchain added to `rules_ml_toolchain` and registered in TFF's `WORKSPACE` (does not exist today), then would need to build TFF from source via `bazel run //tools/python_package:build_python_package` with no documented cross-arch guidance. No official, unofficial, or community-maintained riscv64 build path exists for TensorFlow Federated as of this report.

## 9. Dependencies

TFF itself is not in `projects.yml` / has no dedicated `project-reports/` entry; this section covers its critical native/numeric/crypto dependencies, pulled from `requirements.in`, `pyproject.toml`, and `WORKSPACE` (TensorFlow 2.21.0 pinned, `federated_language` 0.5.4 pinned).

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Community |
|---|---|---|---|---|---|
| TensorFlow (`==2.21.*`) | Core ML runtime (XLA JIT, autograd, tensor kernels) | Unofficial/community-only, repeatedly broken; 2 currently-open build-failure issues ([#102159](https://github.com/tensorflow/tensorflow/issues/102159), [#100940](https://github.com/tensorflow/tensorflow/issues/100940)) | No riscv64 CI | No PyPI riscv64 wheel; not packaged by any distro for any arch | No maintainer commitment to riscv64 found |
| Eigen (vendored via TF) | Dense linear algebra / SIMD CPU kernels | RVV backend merged to `master` Nov 2025, opt-in `-DEIGEN_RISCV64_USE_RVV10`, needs GCC-14/Clang-18 - not in any tagged release TF could vendor | `allow_failure:true` on native SpacemiT K3 CI, not release-gating | RVV support not shipped in any tagged Eigen release | See `project-reports/eigen.md` |
| gRPC (`v1.74.0`) | RPC transport for federated computation coordination | Green (scalar C fallback; BoringSSL lacks riscv64 asm) | No riscv64 CI upstream | No official PyPI riscv64 wheel ([grpc#41591](https://github.com/grpc/grpc/issues/41591), open); RISE unofficial wheel index available (5 minor versions behind) | See `project-reports/grpc.md` |
| Protocol Buffers | Wire serialization for federated computation ASTs and RPC payloads | Green natively (needs `-latomic`) | No riscv64 CI upstream | No official PyPI/Maven riscv64 prebuilt `protoc`; maintainers explicitly declined ("RISC-V isn't on our roadmap" - googleberg) | See `project-reports/protocol-buffers.md` |
| Abseil-cpp (transitive) | C++ foundation library | Green with `-latomic` workaround | 2 open SEGFAULTs on Debian riscv64 ([abseil#2002](https://github.com/abseil/abseil-cpp/issues/2002)); passes on Ubuntu riscv64 | Source-only upstream; distro packages present | See `project-reports/abseil-cpp.md` |
| NumPy (`>=2.0.0,<2.2.0`) | Array numerics underlying all TF/federated tensor interop | Green (native + QEMU CI, Tier 3 per NEP 57) | Partial: QEMU CI non-blocking | No official PyPI wheel yet; RISE unofficial wheels available | See `project-reports/numpy.md` |
| SciPy (`~=1.16`) | Special functions used by `dp_accounting`'s privacy-loss-distribution math | Builds from source; cross-compile tracking issue open since 2023 | Open bugs: [scipy#22839](https://github.com/scipy/scipy/issues/22839) (hanging tests under QEMU), [scipy#22753](https://github.com/scipy/scipy/issues/22753) | No official PyPI riscv64 wheel | No status report published yet |
| `differential-privacy`/`dp-accounting` (`==0.6.0`) | Privacy-loss-distribution accounting for DP mechanisms | Expected to work (architecture-agnostic, no SIMD/JIT/asm) but untested - no riscv64 CI at all | No CI for any non-x86_64 arch | No PyPI wheels for any architecture (sdist only) | See `project-reports/differential-privacy.md` |
| Google Benchmark (transitive) | C++ microbenchmark harness | Green, upstream since 2019 | No upstream CI; distro build/test green on Debian riscv64 buildd | Debian/Ubuntu packages install cleanly | See `project-reports/benchmark.md` |
| pybind11 (`v2.13.4`/`v2.13.6`) | C++/Python binding glue for native extension modules | Header-only; zero riscv64-tagged issues/PRs found in `pybind/pybind11` | No known riscv64 test failures reported | No riscv64 rows in Ubuntu package graph | No status report published yet |
| `federated_language` (`v0.5.4`) | TFF's IR/runtime library (type system, AST, native execution runtime) | No CI evidence found; zero riscv64 issues/PRs in `google-parfait/federated-language` | No CI evidence found | No riscv64 PyPI wheel [NEEDS VERIFICATION - not directly confirmed, inferred from absence of evidence] | Not in `projects.yml`; no status report exists |
| ml_dtypes (`>=0.5.0`) | Extended numeric types (bfloat16, float8) | `python3-ml-dtypes` present in Ubuntu 26.04 resolute riscv64 archive | Not independently investigated | Distro package presence suggests basic support | Not investigated in depth |
| dm-tree (`==0.1.9`) | C++-backed nested-structure traversal | `python3-dm-tree` present in Ubuntu 26.04 resolute riscv64 archive | Not independently investigated | Distro package present | Not investigated in depth |
| wrapt (`==1.14.1`) | C-extension decorator/proxy library | `python3-wrapt` present in Ubuntu 26.04 resolute riscv64 archive | Not independently investigated | Distro package present | None identified |
| CUDA/cuDNN/NCCL (optional GPU backend) | GPU acceleration | N/A - no NVIDIA CUDA/NCCL runtime targets riscv64 | N/A | N/A | Architectural non-issue |

**Deep-dive - TensorFlow (the critical blocker):** TFF hard-pins `tensorflow==2.21.*` via `requirements.in`/`pyproject.toml` and a `WORKSPACE` source build. TensorFlow is distributed exclusively as PyPI wheels (not packaged by any Linux distribution for any architecture) and has two currently-open riscv64 build-failure issues plus a multi-year recurring-breakage history (Section 5). Nothing downstream in TFF can be exercised on riscv64 until TensorFlow itself builds cleanly there.

**Deep-dive - Eigen:** TF vendors its own Eigen snapshot. The RVV (vector) SIMD backend merged to Eigen's `master` branch in November 2025 but has not shipped in any tagged Eigen release, so even once TensorFlow builds on riscv64, its Eigen-based CPU kernels will very likely run scalar, not vectorized, until TF bumps its vendored Eigen past the RVV10 merge point and opts in via build flags.

**Deep-dive - gRPC / Protocol Buffers / Abseil-cpp:** This chain builds on riscv64 today and all three are present in Ubuntu 26.04's riscv64 archive, but each carries open reliability issues: abseil's `-latomic`/SEGFAULT bugs, no official PyPI wheel for grpcio, and protobuf maintainers explicitly declining riscv64 support.

## 11. Known Bugs and Active Issues

No issue, PR, or commit in `google-parfait/tensorflow-federated` itself mentions riscv, riscv64, or RISC-V (confirmed by `search_issues`, `search_pull_requests`, `search_commits`, and full-tree grep). The table below lists dependency-level issues that block or affect a hypothetical riscv64 port; none are TFF-repo issues.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159) | Can't compile tensorflow 2.19.1 on riscv | Open | Critical (blocking) | Currently-open build failure on the exact dependency TFF pins |
| [tensorflow#100940](https://github.com/tensorflow/tensorflow/issues/100940) | Compile Tensorflow on riscv64 platform | Open | Critical (blocking) | Same as above |
| [tensorflow#75555](https://github.com/tensorflow/tensorflow/issues/75555) | Bazel build fails on riscv64 for TensorFlow 2.17.0 | Closed (recurring pattern) | High | History of repeated, never durably fixed breakage |
| [tensorflow#64987](https://github.com/tensorflow/tensorflow/issues/64987) | TFLite cpuinfo missing `sys/hwprobe.h` | Closed | Medium | Toolchain/header gap |
| [tensorflow#62241](https://github.com/tensorflow/tensorflow/issues/62241) | Soft-float/double-float link mismatch | Closed | Medium | ABI-level build issue |
| [tensorflow#47636](https://github.com/tensorflow/tensorflow/issues/47636) | TFLite riscv build | Closed | Medium | Predates current failures |
| [grpc#41591](https://github.com/grpc/grpc/issues/41591) | grpcio riscv64 wheel publishing | Open (P2) | Medium | Blocks official riscv64 grpcio wheel |
| [abseil#1702](https://github.com/abseil/abseil-cpp/issues/1702) | `-latomic` linker failure | Open since 2024 | Medium | Workaround exists |
| [abseil#2002](https://github.com/abseil/abseil-cpp/issues/2002) | SEGFAULT on Debian riscv64 | Open | High (correctness) | Passes on Ubuntu riscv64; Debian-specific |
| [scipy#22839](https://github.com/scipy/scipy/issues/22839) | Hanging tests under QEMU | Open | Medium | Affects `dp_accounting` special-function usage indirectly |
| [scipy#22753](https://github.com/scipy/scipy/issues/22753) | `sph_harm` NaN-mismatch test failure | Open | Medium (correctness) | Floating-point semantics divergence |
| [numpy#30216](https://github.com/numpy/numpy/issues/30216) | riscv64 wheel tracking | Open | Low | Tracking issue, no wheel yet |
| [OpenBLAS#5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811) | DGEMM correctness regression on RVV hardware | Open | High (correctness) | Affects NumPy/SciPy numeric path |
| [OpenSSL#20980](https://github.com/openssl/openssl/issues/20980) | AES not constant-time without Zkn extensions | Open | Security-relevant | `RAND_bytes` seeds DP noise in `dp-accounting` |

**Correctness bugs highlighted separately:** [abseil#2002](https://github.com/abseil/abseil-cpp/issues/2002) (SEGFAULT), [scipy#22753](https://github.com/scipy/scipy/issues/22753) (NaN mismatch), and [OpenBLAS#5811](https://github.com/OpenMathLib/OpenBLAS/issues/5811) (DGEMM correctness regression on RVV hardware) are genuine correctness issues in the dependency chain, not merely missing-support gaps.

## 12. Objections and Upstream Blockers

**Stated objections:** None found specific to TFF - there is no recorded discussion, position, or statement about RISC-V from TFF maintainers, because no RISC-V issue or PR has ever been filed against the repository. This reads as unexamined silence, not a considered rejection.

**Technical blockers:**
1. TensorFlow (the hard-pinned `==2.21.*` core dependency) does not currently build cleanly on riscv64 - two open, unresolved GitHub issues as of this report.
2. TFF's own `WORKSPACE` registers no riscv64 Bazel toolchain (only `linux_x86_64` and `linux_aarch64`), so a build cannot even begin without upstream toolchain work in `rules_ml_toolchain`.
3. Eigen's RVV SIMD backend has not shipped in a tagged release, so even a successful riscv64 TensorFlow build would run CPU kernels in scalar mode.

**Organizational blockers:**
1. TFF is fully Google-run with no external foundation and development happens in an internal monorepo synced via `copybara-github` - there is no visible external contribution or design-review path to propose a port.
2. A related upstream dependency (Protocol Buffers) has maintainers who explicitly declined riscv64 support ("RISC-V isn't on our roadmap" - googleberg, per [protobuf#17798](https://github.com/protobuf/protobuf/issues/17798), closed unresolved, and rejected PR #23206) [NEEDS VERIFICATION - direct protobuf issue/PR URLs not independently re-verified in this session; carried from the dependency research pass].

**RISE involvement:** None found anywhere - not in the RISE blog (34 posts checked), not in the RISE wheel builder package list (~70 packages, no TensorFlow or TensorFlow Federated entries), not in the RISE GitHub org's repos or issues. The only mention of "TensorFlow Federated" anywhere in RISE-adjacent infrastructure is a queued-for-future-grading entry in this session's own internal backlog file (`project-reports/.queue.yml`), which is not a funded-work record, CI job, or announcement - it is an unevaluated backlog item.

**Acceptance probability:** Low in the near term. A riscv64 port of TFF is gated entirely on TensorFlow itself resolving its own riscv64 build failures first (a dependency TFF does not control), compounded by zero community pressure (no issue has ever been filed for TFF specifically) and no RISE or third-party investment identified.

## 13. Readiness Assessment

- **Color:** orange (base case - no upstream riscv64 CI and no distribution floor applies, since no distro packages TensorFlow Federated for any architecture)
- **Release provider:** none
- **Optimization gap:** N/A - TensorFlow Federated is a federated-learning orchestration framework (type system, AST, workflow coordination), not an optimization-purpose project. If it ran on riscv64 using only generic scalar code with no architecture-specific optimizations of its own, it would still deliver its full value proposition, since all numeric/SIMD/JIT work is delegated to the upstream TensorFlow/XLA/Eigen stack. The Step 2 optimization-purpose modifier therefore does not apply, and no cap is imposed.
- **Justification:** The project's sole CI workflow, [`publish.yaml`](https://github.com/google-parfait/tensorflow-federated/blob/main/.github/workflows/publish.yaml), runs exclusively on `ubuntu-latest`/x86_64 with no riscv64, QEMU, or cross-arch steps of any kind. No riscv64 wheel has ever been published (all 87 historical PyPI releases are `manylinux_*_x86_64` only, per [PyPI JSON](https://pypi.org/pypi/tensorflow-federated/json)), and no Linux distribution packages TensorFlow Federated for any architecture ([Ubuntu 26.04 resolute search](https://packages.ubuntu.com/search?keywords=TensorFlow%20Federated&suite=resolute&searchon=names&section=all) returns no results), so the distribution floor (Step 1) that would otherwise upgrade an unpatched clean build to yellow cannot apply - there is no distro build to floor on. This places the primary grade at orange under Step 1 ("no upstream riscv64 CI").
- **Pending work that could change the grade:** None identified. No open PR, no RISE involvement, and no community-filed issue exists for a TFF riscv64 port (Section 12). The most consequential lever for improvement is entirely outside TFF's own repository: TensorFlow itself resolving [tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159) and [tensorflow#100940](https://github.com/tensorflow/tensorflow/issues/100940) would remove the primary technical blocker, but that work is tracked in a separate project and repository, not in TFF.

## 14. Investment Analysis

RISE has not funded, built, or announced any work specific to TensorFlow Federated (Section 12) - there is nothing already covered to exclude from this sizing.

### 14.1 Functional Enablement

- Resolve TensorFlow's riscv64 build failures ([tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159), [tensorflow#100940](https://github.com/tensorflow/tensorflow/issues/100940)) - this is upstream TensorFlow work, not TFF work, but is a hard precondition. Effort not sized here; it belongs to the TensorFlow project's own investment analysis.
- Add a riscv64 toolchain registration to TFF's `WORKSPACE` (depends on `rules_ml_toolchain` gaining riscv64 support upstream).
- Validate `pybind11`, `federated_language`, and `dp-accounting` build and import cleanly once the TensorFlow blocker clears - these currently have zero riscv64 engineering history (no CI, no issues) and must be validated from scratch, not assumed working.
- Produce a first riscv64 wheel and confirm the `test-package` smoke test passes.

### 14.2 Performance Optimization

Not applicable at this stage - there is no functional build to optimize. Once functional, note that Eigen's RVV backend (merged upstream November 2025) has not shipped in any tagged release TensorFlow could vendor, so an initial riscv64 build would run CPU kernels in scalar mode regardless of hardware RVV capability - this is a downstream Eigen/TensorFlow-versioning dependency, not something addressable within TFF itself.

### 14.3 CI/CD Infrastructure

- Add a riscv64 job to `publish.yaml`, gated behind `workflow_dispatch` and `allow_failure`-style non-blocking status until stability is proven.
- No RISE riscv64 runner is currently used by this project; provisioning one (or reusing an existing RISE runner) would be required for native (non-QEMU) build/test execution.

### 14.4 Ecosystem Enablement

Not scored as a separate section (Section 10 omitted: TFF is consumed as a single pip package with no dependent plugin/extension ecosystem that itself needs riscv64 enablement). The relevant channel work is the PyPI wheel and, if desired, Ubuntu/Debian packaging, both covered under 14.1 and 14.3.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Track and, where possible, contribute to resolving TensorFlow's riscv64 build failures (tensorflow#102159, tensorflow#100940) | Not sized (upstream TensorFlow scope) | TensorFlow project | Critical |
| Functional | Add riscv64 toolchain registration to TFF `WORKSPACE` (depends on `rules_ml_toolchain` riscv64 support) | 1-2 | TFF-side engineer | Critical |
| Functional | Validate `pybind11`, `federated_language`, `dp-accounting` on riscv64 from scratch | 2-3 | TFF-side engineer | High |
| Functional | Produce and validate first riscv64 PyPI wheel via `test-package` smoke test | 1-2 | TFF-side engineer | High |
| Performance | Track Eigen RVV backend release and TensorFlow's vendored-Eigen bump | Not sized (upstream Eigen/TensorFlow scope) | Eigen / TensorFlow projects | Medium |
| CI/CD | Add non-blocking riscv64 job to `publish.yaml` | 1 | TFF-side engineer | Medium |
| CI/CD | Provision or reuse a RISC-V CI runner (native or QEMU) | 1-2 (coordination) | Infra / RISE liaison | Medium |

## 15. Updates

No updates yet - initial report dated 2026-09-08.

## 16. References

- [google-parfait/tensorflow-federated](https://github.com/google-parfait/tensorflow-federated) (repository)
- [TensorFlow Federated homepage](https://www.tensorflow.org/federated)
- [publish.yaml CI workflow](https://github.com/google-parfait/tensorflow-federated/blob/main/.github/workflows/publish.yaml)
- [PyPI JSON API for tensorflow-federated](https://pypi.org/pypi/tensorflow-federated/json)
- [PyPI simple index for tensorflow-federated](https://pypi.org/simple/tensorflow-federated/)
- [Ubuntu packages.ubuntu.com search (resolute suite)](https://packages.ubuntu.com/search?keywords=TensorFlow%20Federated&suite=resolute&searchon=names&section=all)
- [Ubuntu resolute riscv64 package index](https://packages.ubuntu.com/resolute/riscv64/)
- [Arch Linux RISC-V port search](https://archriscv.felixc.at/)
- [RISE GitLab wheel builder redirect check](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tensorflow-federated/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project blog category index](https://riseproject.dev/category/blog/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [tensorflow#102159 - Can't compile tensorflow 2.19.1 on riscv](https://github.com/tensorflow/tensorflow/issues/102159)
- [tensorflow#100940 - Compile Tensorflow on riscv64 platform](https://github.com/tensorflow/tensorflow/issues/100940)
- [tensorflow#75555 - Bazel build fails on RISC-V for TensorFlow 2.17.0](https://github.com/tensorflow/tensorflow/issues/75555)
- [tensorflow#64987 - TFLite cpuinfo missing sys/hwprobe.h](https://github.com/tensorflow/tensorflow/issues/64987)
- [tensorflow#62241 - soft-float/double-float link mismatch](https://github.com/tensorflow/tensorflow/issues/62241)
- [tensorflow#47636 - TFLite riscv build](https://github.com/tensorflow/tensorflow/issues/47636)
- [tensorflow#72479 - Does TensorFlow2.13.0 support RISC-V](https://github.com/tensorflow/tensorflow/issues/72479)
- [grpc#41591 - grpcio riscv64 wheel publishing](https://github.com/grpc/grpc/issues/41591)
- [abseil#1702 - -latomic linker failure](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil#2002 - SEGFAULT on Debian riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [scipy#22839 - hanging tests under QEMU](https://github.com/scipy/scipy/issues/22839)
- [scipy#22753 - sph_harm NaN-mismatch test failure](https://github.com/scipy/scipy/issues/22753)
- [scipy#19378 - cross-compile tracking issue](https://github.com/scipy/scipy/issues/19378)
- [numpy#30216 - riscv64 wheel tracking](https://github.com/numpy/numpy/issues/30216)
- [OpenBLAS#5811 - DGEMM correctness regression on RVV hardware](https://github.com/OpenMathLib/OpenBLAS/issues/5811)
- [OpenSSL#20980 - AES not constant-time without Zkn extensions](https://github.com/openssl/openssl/issues/20980)
- [pybind/pybind11 repository](https://github.com/pybind/pybind11)
- [google-parfait/federated-language repository](https://github.com/google-parfait/federated-language)
- Related dependency status reports: `project-reports/eigen.md`, `project-reports/grpc.md`, `project-reports/protocol-buffers.md`, `project-reports/abseil-cpp.md`, `project-reports/numpy.md`, `project-reports/differential-privacy.md`, `project-reports/benchmark.md`
- arXiv:2302.07946 - "Experimenting with Emerging RISC-V Systems for Decentralised Machine Learning" (PyTorch, not TFF)
- arXiv:2405.15380 - general ML-inference RISC-V evaluation (not TFF-specific)