---
title: WASI NN
parent: Project Reports
color: green
dependencies:
  - name: Wasmtime
    relation: build-dependency
    criticality: critical
  - name: OpenVINO Runtime
    relation: runtime-dependency
    criticality: critical
  - name: ONNX
    relation: runtime-dependency
    criticality: optional
  - name: PyTorch
    relation: runtime-dependency
    criticality: optional
---

# WASI NN

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** green<br/>
**Scope:** RISC-V (riscv64/linux) support status for WASI NN<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="wasi-nn" %}

## 1. Project Overview

[WASI NN](https://github.com/WebAssembly/wasi-nn) is a WASI (WebAssembly System Interface) proposal that defines a host-function API for neural-network inference from inside a WebAssembly module. The repository is an **interface-specification repository only**: it contains `wasi-nn.witx`, `wit/wasi-nn.wit`, `ml.md`, and Markdown documentation, and no compiled source of any kind (no `.c`/`.cpp`/`.h`/`.rs` implementation files, no CMake, no Cargo.toml). This was confirmed by a full file listing of the repository and by an independent re-clone of the repo (`origin` verified as `https://github.com/WebAssembly/wasi-nn`, HEAD `71320d9...`).

The proposal is currently in **Phase 2** ("Proposed Spec Text Available") of the W3C WebAssembly Community/Working Group's WASI standards process. Advancement to Phase 4 requires at least two independent, complete implementations. The spec repo itself has no `LICENSE` file in its history and no formal `MAINTAINERS`/`CODEOWNERS` file; governance is champion-led rather than a standing maintainer list.

**Reference implementation:** lives outside this repo, in `bytecodealliance/wasmtime` as the `wasmtime-wasi-nn` crate (`Apache-2.0 WITH LLVM-exception`). The spec repo's own README redirects implementers to `https://github.com/bytecodealliance/wasi-nn` for language bindings.

**Champions and corporate sponsors:** Andrew Brown (Intel) and Mingqiu Sun (Intel, Sr. Principal Engineer) are the original proposal champions. Top spec-repo contributors by commit count: Dan Gohman (Mozilla / Fastly), Pat Hickey (Fastly), Andrew Brown (Intel), Jakub Konka (Golem Network), Alex Crichton (Fastly), Lin Clark (Fastly), Sam Clegg (Google/Chromium). Top implementation contributors (`crates/wasi-nn` in Wasmtime): Alex Crichton (Fastly), Andrew Brown (Intel), Jianjun Zhu and Rahul Chaphalkar (Intel), Nick Fitzgerald (Fastly), Chris Fallin (Fastly), Pat Hickey (Fastly/F5). The dominant corporate sponsors are **Intel** (originated the proposal, drives the OpenVINO backend) and **Fastly** (dominant among Bytecode Alliance/Wasmtime core maintainers). Bytecode Alliance founding/member companies funding the host runtime include Fastly, Intel, Mozilla, Microsoft, Arm, DFINITY, Embark Studios, Google, Shopify, and UC San Diego; Wasmtime's `ADOPTERS.md` lists production users Akamai, Cosmonic, DFINITY, Embark Studios, Fastly, Huawei, InfinyOn, Microsoft, Redpanda, Shopify, and SingleStore. Bytecode Alliance itself is a 501(c)(6) nonprofit trade association governed by a Governing Board (member-elected seats) with a Technical Steering Committee providing technical oversight.

**Community culture on new ports:** Wasmtime's official stability-tier policy states "design discussion and PRs are welcome" for currently-unsupported architectures. Tier 3 contributions (which is where riscv64 and wasi-nn as a feature both sit) are accepted provided they meet code-quality bars and do not impose "unnecessary maintenance overhead" on other components. Moving to Tier 2 requires CI coverage and identified maintainers; Tier 1 requires continuous fuzzing, an RFC, and a security-release commitment. Source: [docs.wasmtime.dev/stability-tiers.html](https://docs.wasmtime.dev/stability-tiers.html).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2016-08-04 | First "riscv" reference anywhere in the Wasmtime/Cranelift lineage: `6d786113d "Add an empty isa/riscv module scaffold."` by Jakob Stoklund Olesen (Mozilla) - years before wasi-nn was proposed, and unrelated to it. | [bytecodealliance/wasmtime](https://github.com/bytecodealliance/wasmtime) commit history |
| ~2019-2020 | WASI-NN proposal originated (Intel, Andrew Brown / Mingqiu Sun). | [github.com/WebAssembly/wasi-nn](https://github.com/WebAssembly/wasi-nn) |
| 2024-06-25 | Tag `0.2.0-rc-2024-06-25` published - "an initial tag to start tracking wasi-nn changes prior to release." | [WebAssembly/wasi-nn releases](https://github.com/WebAssembly/wasi-nn) |
| 2024-08-19 | Tag `0.2.0-rc-2024-08-19` published. | [WebAssembly/wasi-nn releases](https://github.com/WebAssembly/wasi-nn) |
| 2024-10-28 | Tag `0.2.0-rc-2024-10-28` published (latest tag; no stable 1.0 release exists). | [WebAssembly/wasi-nn releases](https://github.com/WebAssembly/wasi-nn) |

**No RISC-V-specific commit, issue, or pull request exists in this repository at all** - confirmed independently through `search_issues`, `search_pull_requests`, `search_commits`, `search_code`, and a full repo-wide case-insensitive grep for "riscv"/"riscv64"/"risc-v", all returning zero matches, run multiple times across this investigation.

**Is it fully upstream?** The question does not apply in the conventional sense: there is no riscv64 "port" to upstream because the spec repo contains no architecture-specific code to port. riscv64 support for a WASI-NN *workload* is entirely a function of (a) the host Wasm runtime that executes the module (Wasmtime, WAMR) and (b) the ML backend it links against (OpenVINO, ONNX Runtime, PyTorch/LibTorch) - see Sections 4 and 9.

## 3. Upstream Support Tier

Wasmtime (the reference host runtime) uses a formal three-tier stability policy, modeled on Rust's target tiers, and explicitly classifies **wasi-nn itself as Tier 3** as a feature/proposal, "needing more expansive CI testing" to advance:

- **Tier 1** (production-ready; continuous fuzzing; CVE/security commitments): x86_64, aarch64, s390x on specific OSes.
- **Tier 2** (well-maintained, CI-tested, responsive maintainers): aarch64-linux-gnu, aarch64-darwin, s390x-linux-gnu.
- **Tier 3** (baseline, no extensive testing/fuzzing required): riscv64, armv7, powerpc64le, i686 - **and the wasi-nn feature itself**.

Source: [docs.wasmtime.dev/stability-tiers.html](https://docs.wasmtime.dev/stability-tiers.html), [docs.wasmtime.dev/stability-platform-support.html](https://docs.wasmtime.dev/stability-platform-support.html).

The `WebAssembly/wasi-nn` repository's own CI does not build, test, or release anything for any CPU architecture (see Section 7), so a conventional amd64/arm64/riscv64 comparison table does not apply to this repository directly. The comparison that matters in practice is at the host-runtime layer:

| Layer | amd64 | arm64 | riscv64 |
|---|---|---|---|
| wasi-nn spec repo CI | Not architecture-specific (single ABI-lint job on `ubuntu-latest`) | Not architecture-specific | Not architecture-specific |
| Wasmtime host-runtime tier | Tier 1 | Tier 2 (aarch64-linux-gnu, aarch64-darwin) | Tier 3 |
| wasi-nn as a Wasmtime *feature* | Tier 3 (uniformly, regardless of host arch) | Tier 3 | Tier 3 |

## 4. Technical Architecture and RISC-V-Specific Subsystems

**No architecture-specific subsystem of any kind exists in this repository, for any architecture.** This was verified specifically (not just for riscv64): a code search for `__riscv` returned 0 results, and a code search for `__x86_64__ OR __aarch64__` also returned 0 results in `WebAssembly/wasi-nn`. There are no `.c`/`.cpp`/`.rs` implementation files at all - only `wasi-nn.witx`, `wit/*.wit`, and Markdown.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT / codegen | N/A (not present in this repo) | N/A | N/A |
| SIMD dispatch | N/A | N/A | N/A |
| Crypto/hardware-accelerated paths | N/A | N/A | N/A |
| Architecture-specific assembly | N/A | N/A | N/A |

This is not riscv64 being singled out for neglect while x86/arm received real implementations - all three are equally absent because `WebAssembly/wasi-nn` is an interface-definition text repository, not a compiled runtime with backend/arch-specific code paths. Any real architecture-specific implementation work (JIT compilation, SIMD kernels, hardware acceleration) lives in the downstream runtimes that *implement* this spec: Wasmtime's `wasmtime-wasi-nn` crate (which itself contains no arch-specific code beyond what Wasmtime's Cranelift/Winch/Pulley backends already provide) and the ML backend engines it links against (OpenVINO Runtime, ONNX Runtime, PyTorch/LibTorch) - see Section 9 for their riscv64-specific code status, which varies widely and is markedly weaker than their amd64/arm64 support.

## 5. Build System, Cross-Compilation, and Toolchain

`WebAssembly/wasi-nn` has no build manifest of any kind - no `CMakeLists.txt`, `setup.py`, `go.mod`, `Cargo.toml`, or `package.json` - confirmed by listing the full repository tree. There is nothing to compile or cross-compile; the deliverable is WIT/WITX interface text consumed by `wit-bindgen`-style tooling in downstream language bindings.

The repository's sibling bindings repo, `bytecodealliance/wasi-nn` (Rust + AssemblyScript crate), also has no CMake, no Dockerfile, no `BUILDING.md`, and zero "riscv" matches in a full grep - it is a language-bindings crate, not a compiled backend.

There is consequently no riscv64-specific toolchain requirement, no QEMU usage, and no known riscv64 build failure to report for this repository. Actual toolchain/build requirements for running a WASI-NN workload on riscv64 are determined entirely by the chosen host runtime (Wasmtime, per its own Tier 3 build documentation) and the chosen ML backend (OpenVINO, ONNX Runtime, or PyTorch - see Section 9), none of which is in scope of this repository.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because the spec repo defines an API contract rather than an implementation, there is no architecture-dependent functional gap *in this repository*. The API surface (`wasi-nn.witx` / `wit/wasi-nn.wit`) is identical regardless of host architecture.

Real-world feature and performance gaps appear only once the spec is implemented on a given architecture, and they are substantial on riscv64 at the dependency layer (detailed fully in Section 9):

- **Functional gaps:** OpenVINO's default wasi-nn backend has no JIT convolution kernel on riscv64 (falls back to scalar execution for CNN workloads); PyTorch's backend has no riscv64 wheel published anywhere and no RVV SIMD support in its `Vectorized<>` abstraction layer, so from-source riscv64 builds run scalar for most tensor operations.
- **Performance gaps:** a single missing function, `cpuinfo_has_riscv_zvfh()` in `pytorch/cpuinfo`, breaks FP16 inference paths shared by both the ONNX Runtime and PyTorch backends via XNNPACK ([google/XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886)).
- **Security hardening gaps:** Data not available: no riscv64-specific hardening review for wasi-nn or its backends was found in the research; Wasmtime's own Tier 3 status for riscv64 means it explicitly does not carry the continuous-fuzzing/CVE commitments that Tier 1 architectures have.
- **NaN/floating-point semantics:** Data not available: no riscv64-specific NaN or floating-point semantics issue for WASI-NN was found in any tracker searched (GitHub issues in `WebAssembly/wasi-nn` and `bytecodealliance/wasm-micro-runtime`, academic literature).

## 7. CI/CD Infrastructure

`WebAssembly/wasi-nn` contains exactly one CI workflow, `.github/workflows/main.yml`, and no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml`. Full contents:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  abi-up-to-date:
    name: Check ABI files are up-to-date
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4
    - uses: WebAssembly/wit-abi-up-to-date@v21
```

- Trigger: `push` to `main` and `pull_request` targeting `main` only. No `workflow_dispatch`, no `schedule`.
- Runner: `ubuntu-latest`, a standard x86 GitHub-hosted runner. No arm runner, no riscv64 runner, no QEMU, no cross-arch matrix of any kind.
- The single job checks that generated WIT ABI files are up to date. It does not build anything and does not run tests - there is no build/test matrix for any architecture, x86 included.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | Runner is `ubuntu-latest` (x86_64) but job does ABI-lint only, no build/test | No | No |
| Builds artifact | No | No | No |
| Runs tests | No | No | No |
| RISE runners used | No | No | No |
| Hardware | GitHub-hosted x86 runner (lint job only) | N/A | N/A |

There is no RISE runner usage anywhere in this repository, and no hardware of any kind is used for a build or test purpose - the only job executed is a text-file consistency check.

## 8. Distribution and Release Status

**No riscv64 binary or package exists for "WASI NN" on any channel checked, because no compiled/installable artifact of any kind exists for this project on any architecture.**

- **PyPI:** [https://pypi.org/pypi/wasi-nn/json](https://pypi.org/pypi/wasi-nn/json) returns **HTTP 404** - no package named `wasi-nn` exists on PyPI. Also checked `https://pypi.org/simple/wasi-nn/`, also 404.
- **RISE wheel builder:** [https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasi-nn/](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasi-nn/) redirects to the same 404 PyPI URL. No package present.
- **Ubuntu 26.04 (resolute):** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=WASI%20NN&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results." for `wasi-nn`, `python3-wasi-nn`, and `libwasi-nn`, for any architecture.
- **Arch Linux RISC-V port:** [archriscv.felixc.at](https://archriscv.felixc.at/?q=wasi%20nn) returns no results in `[core]`, `[extra]`, or `[unsupported]`.
- **GitHub releases:** Only 3 tags exist (`0.2.0-rc-2024-06-25`, `0.2.0-rc-2024-08-19`, `0.2.0-rc-2024-10-28`), each release-candidate spec snapshots with GitHub's default auto-generated "Source code (zip)"/"Source code (tar.gz)" assets ("Assets 2" per release) - no custom uploaded binaries of any kind, riscv64 or otherwise.

**What a user must do to get a "working binary":** there is no such thing as a wasi-nn binary - a user needs a host runtime that implements the spec (e.g., Wasmtime, built for riscv64 per Wasmtime's own Tier 3 process) plus a linked ML backend (OpenVINO, ONNX Runtime, or PyTorch, each with its own separate riscv64 build/distribution status - see Section 9). None of those are distributed by the `WebAssembly/wasi-nn` project itself.

## 9. Dependencies

`WebAssembly/wasi-nn` has no build manifest and thus no declared dependencies of its own. The dependency graph below is drawn from the reference implementation, `wasmtime-wasi-nn` (`crates/wasi-nn/Cargo.toml` in `bytecodealliance/wasmtime`), which is the closest thing to a canonical, widely-used implementation of the spec. Its Cargo features gate each ML backend:

```
ort      = "2.0.0-rc.10"  (feature "onnx")               -> wraps ONNX Runtime (microsoft/onnxruntime)
tch      = "0.17.0"       (feature "pytorch")             -> wraps LibTorch (pytorch/pytorch)
openvino = "0.11.0"       (feature "openvino", default)   -> wraps OpenVINO Runtime (openvinotoolkit/openvino)
windows                   (feature "winml")                -> Windows ML, Windows-only, N/A to riscv64/Linux
```

`default = ["openvino", "winml"]` - OpenVINO ships on by default; ONNX and PyTorch are opt-in. Wasmtime itself (the Cranelift-JIT host runtime that executes the wasi-nn module) is a critical, if indirect, dependency of any wasi-nn deployment.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| **Wasmtime** (build-dependency, critical) | Host Wasm runtime; Cranelift JIT-compiles the wasi-nn module | Tier 3, builds under QEMU (no native HW CI) | Full QEMU test matrix, conditionally gated | Upstream `.tar.xz` GitHub Release tarballs; no PyPI wheel, no distro package (0 results on Ubuntu 26.04) | 2 open soundness bugs: unaligned-atomic bus-error crash ([#5882](https://github.com/bytecodealliance/wasmtime/issues/5882)), partial OOB write ([#7237](https://github.com/bytecodealliance/wasmtime/issues/7237)). Tier 3 = no committed maintainer, no fuzzing |
| **OpenVINO Runtime** (runtime-dependency, critical) | Default wasi-nn backend | "Experimental" tier, builds via QEMU CI only, no native HW | QEMU CI only, narrow test filter, non-release-blocking | No official binary channel; source build only | No JIT convolution kernel on riscv64 (scalar fallback); BRGEMM/MatMul acceleration PR [#37746](https://github.com/openvinotoolkit/openvino/pull/37746) still open; Swish/SiLU (used by every modern LLM) falls back to scalar |
| **ONNX** (ONNX Runtime, runtime-dependency, optional) | Opt-in wasi-nn backend | No dedicated riscv64 CI upstream; RVV PRs merge with zero automated riscv64 test execution | Same - no test execution upstream | Ubuntu 26.04 ships `libonnxruntime-dev`/`libonnxruntime1.23`/`python3-onnxruntime` for riscv64, but this package (v1.23.2) is 4 releases behind and predates all RVV acceleration work; no official Microsoft riscv64 binary | XNNPACK EP broken for FP16 ([google/XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886), missing `cpuinfo_has_riscv_zvfh()`); SGEMM silently wrong for 2 years, Jan 2024-Mar 2026 ([#22530](https://github.com/microsoft/onnxruntime/issues/22530)); T-HEAD C906 accuracy collapse still open ([#20030](https://github.com/microsoft/onnxruntime/issues/20030)) |
| **PyTorch** (runtime-dependency, optional) | Opt-in wasi-nn backend | Tier 3/opt-in community tier; cross-compile CI is manual-trigger only, does not gate PRs | No native in-tree test job; correctness failures tracked only in a downstream fork (32 open failures) | No riscv64 wheel on PyPI in any of 48 published versions; Debian sid only, not in Ubuntu at all | ATen `Vectorized<>` SIMD dispatch has zero RVV support (scalar-only); PR [#175746](https://github.com/pytorch/pytorch/pull/175746) blocked on an architectural design question since Feb 2026; `USE_MKLDNN=0` hardcoded in CI; no CODEOWNERS entry for RISC-V |
| oneDNN (transitive, via OpenVINO/PyTorch) | Compute backend for conv/matmul/normalization | QEMU-only smoke + weekly full suite, no native HW | Same | Debian/Ubuntu package only (`3.9.1+ds-2`, behind upstream `3.12.1`); no PyPI wheel | README explicitly labels riscv64 "experimental with limited testing validation"; no INT8 conv/matmul; open reduction-kernel bug (PR [#5361](https://github.com/oneapi-src/oneDNN/pull/5361)); LLVM libomp fails to build natively on riscv64 ([llvm/llvm-project#87026](https://github.com/llvm/llvm-project/issues/87026)) |
| oneTBB (transitive, via oneDNN/OpenVINO) | Optional threading runtime | Zero CI coverage upstream | Zero CI coverage upstream | Debian/Ubuntu packaged; no upstream binary tarball | GCC builds fail at link time without manual `-latomic` (fix PR [#987](https://github.com/oneapi-src/oneTBB/pull/987) stalled since Dec 2022); spin-pause degenerates to `sched_yield()`, untracked |
| XNNPACK (transitive, via ONNX Runtime and PyTorch) | SIMD inference microkernels | 100+ RVV FP16 test targets failing in upstream CI (open since Apr 2026) | Operator tests excluded from CI | No tagged releases at all; Debian package 18 months stale | Root cause: unconditional FP16 kernel enablement without runtime Zvfh detection ([google/XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886)) |
| cpuinfo (transitive, feeds XNNPACK/ONNX MLAS) | Runtime ISA/feature detection | QEMU CI only, no native HW; Ubuntu 24.04 runner upgrade PR abandoned | Same | Not separately released (vendored/FetchContent) | `cpuinfo_has_riscv_zvfh()` missing from the public API - the direct cross-project root cause of the XNNPACK #9886 breakage |
| OpenBLAS (transitive, via PyTorch/oneDNN) | BLAS/LAPACK backend | Ubuntu 24.04 ships v0.3.26 (older, missing DYNAMIC_ARCH/ZVL targets) | Partial: BLAS L1/L2/L3 under QEMU; LAPACK disabled/timing out | v0.3.33 latest includes RVV ZVL128B/ZVL256B kernels, source only | Open draft PR for ZVL256B TRSM correctness bug, unassigned ([xianyi/OpenBLAS#5830](https://github.com/xianyi/OpenBLAS/pull/5830)); requires GCC 14+ or silently falls back to scalar |

**Rollup of the concrete blocking chain for a real wasi-nn deployment on riscv64:**

1. Host runtime (Wasmtime/Cranelift) works under QEMU/native but is Tier 3 with 2 open soundness bugs and no fuzzing.
2. Default backend (OpenVINO) builds only from source, no JIT convolution kernel on riscv64.
3. ONNX backend has the only maintained Ubuntu riscv64 package among the three, but it predates RVV acceleration and its XNNPACK execution provider is actively broken for FP16.
4. PyTorch backend is the weakest link: no PyPI wheel ever, not in Ubuntu at all, and its SIMD abstraction has no RVV support.
5. A single missing function, `cpuinfo_has_riscv_zvfh()`, is the cross-cutting root cause breaking FP16 inference in both the ONNX and PyTorch paths.

## 11. Known Bugs and Active Issues

**In `WebAssembly/wasi-nn` itself:** none. The repository has 21 issues total; a scoped search (`is:issue riscv`) returned zero matches. A scoped search of `bytecodealliance/wasm-micro-runtime` (the main WAMR implementation) for `wasi-nn riscv` also returned 0 results.

**In dependency projects (correctness bugs affecting any riscv64 wasi-nn deployment), from Section 9:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [bytecodealliance/wasmtime#5882](https://github.com/bytecodealliance/wasmtime/issues/5882) | Unaligned-atomic bus-error crash | Open | Correctness/soundness | Affects the host runtime under every wasi-nn workload |
| [bytecodealliance/wasmtime#7237](https://github.com/bytecodealliance/wasmtime/issues/7237) | Partial OOB write | Open | Correctness/soundness | Same as above |
| [openvinotoolkit/openvino#37746](https://github.com/openvinotoolkit/openvino/pull/37746) | BRGEMM/MatMul riscv64 acceleration | Open PR | Performance | No JIT convolution kernel on riscv64 until merged |
| [google/XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886) | Missing `cpuinfo_has_riscv_zvfh()` breaks FP16 RVV kernels | Open (since Apr 2026) | Correctness | Cross-cutting root cause affecting both ONNX and PyTorch backends |
| [microsoft/onnxruntime#22530](https://github.com/microsoft/onnxruntime/issues/22530) | SGEMM silently wrong on riscv64 | Open; bug present Jan 2024-Mar 2026 | **Correctness (silent wrong results)** | Wrong numeric output, not a crash - highest-severity class of bug |
| [microsoft/onnxruntime#20030](https://github.com/microsoft/onnxruntime/issues/20030) | T-HEAD C906 accuracy collapse | Open | Correctness | Vendor-specific riscv64 core |
| [oneapi-src/oneDNN#5361](https://github.com/oneapi-src/oneDNN/pull/5361) | Reduction kernel correctness bug | Open PR | Correctness | |
| [llvm/llvm-project#87026](https://github.com/llvm/llvm-project/issues/87026) | libomp fails to build natively on riscv64 | Open | Build-blocking | |
| [oneapi-src/oneTBB#987](https://github.com/oneapi-src/oneTBB/pull/987) | GCC link failure without manual `-latomic` | Open PR, stalled since Dec 2022 | Build-blocking | |
| [pytorch/pytorch#175746](https://github.com/pytorch/pytorch/pull/175746) | `Vectorized<>` RVV support | Open PR, blocked on design question since Feb 2026 | Performance (scalar fallback) | |
| [xianyi/OpenBLAS#5830](https://github.com/xianyi/OpenBLAS/pull/5830) | ZVL256B TRSM correctness bug | Open, unassigned draft PR | Correctness | |

**Correctness bugs highlighted separately** (silent-wrong-result class, the most severe): [microsoft/onnxruntime#22530](https://github.com/microsoft/onnxruntime/issues/22530) (SGEMM silently wrong for over two years) and [microsoft/onnxruntime#20030](https://github.com/microsoft/onnxruntime/issues/20030) (T-HEAD C906 accuracy collapse) are the most consequential, since they produce incorrect inference output rather than a build failure or crash.

**Benchmark data:** no numeric benchmark data for WASI-NN specifically on riscv64 was found anywhere (GitHub, academic literature, RISE site, general web search) - this is a genuine gap in publicly available data as of 2026-09-10, not a search failure; multiple independent query angles converged on the same absence.

## 12. Objections and Upstream Blockers

**Stated objections:** none found - no riscv64 support has ever been proposed, requested, or rejected in `WebAssembly/wasi-nn`. There is no PR or issue to cite because none exists.

**Technical blockers:** the question of "upstreaming a riscv64 port" does not apply to this repository, because there is no architecture-specific code in it to port (Section 4). The real technical blockers sit one layer down, in the dependency chain documented in Section 9: Wasmtime's Tier 3 status (no fuzzing, 2 open soundness bugs), OpenVINO's source-build-only riscv64 status with no JIT convolution kernel, ONNX Runtime's stale distro package and broken XNNPACK FP16 path, and PyTorch's complete absence of RVV SIMD support and of any published riscv64 wheel.

**Organizational blockers:** Data not available: no RISE (RISC-V Software Ecosystem) involvement in WASI-NN was found - it is not a RISE member project, has no RISE blog coverage, no RISE-funded work, and no RISE Python wheel-builder entry. The RISE AI/ML working group's stated focus is PyTorch, TensorFlow, TFLite, and llama.cpp on RISC-V, not WASI-NN specifically. [riseproject.dev](https://riseproject.dev) confirmed.

**Acceptance probability:** Wasmtime's stated policy ("design discussion and PRs are welcome" for Tier 3 contributions, provided they meet code-quality bars and do not impose unnecessary maintenance overhead) suggests any concrete riscv64-relevant contribution to the *implementation* layer (Wasmtime, or one of the ML backends) would be welcomed. There is no indication of resistance to riscv64 anywhere in the governance materials reviewed - the gap is one of nobody having done the work yet, not of upstream objection.

## 13. Readiness Assessment

- **Color:** green (arch-independent by construction, per the `/project-color-coding` skill's Step 0)
- **Release provider:** upstream (the spec text itself is published directly by the `WebAssembly` GitHub organization; there is no separate "riscv64 artifact" to publish because none exists for any architecture)
- **Optimization level:** not applicable - WASI NN is an API-specification project, not an optimization-purpose project in the sense defined by the color-coding skill (a SIMD/kernel/allocator library whose value proposition depends on architecture-specific speed). The optimization-relevant work lives entirely in the downstream backend dependencies documented in Section 9.
- **Justification:** `WebAssembly/wasi-nn` ships no compiled, architecture-specific code of any kind - the repository contains only WIT/WITX interface-definition text and Markdown documentation, confirmed by a full file listing and a repo-wide grep for architecture markers (`riscv`, `__x86_64__`, `__aarch64__`) that returned zero matches for every architecture, not riscv64 alone (see Section 4). Under Step 0 of the color model, a project that ships no compiled, architecture-specific code inherits riscv64 support by construction and is classified green without penalty for lacking riscv64 CI. Source: [github.com/WebAssembly/wasi-nn](https://github.com/WebAssembly/wasi-nn) (full repo tree and CI workflow read directly).
- **Important caveat:** this green rating describes the *specification text* only. It does not describe the riscv64 readiness of any real WASI-NN deployment, which depends entirely on the host runtime (Wasmtime, Tier 3) and the chosen ML backend (OpenVINO, ONNX Runtime, or PyTorch), each of which carries materially weaker riscv64 support than amd64/arm64 - see Sections 9 and 11 for the specific open correctness and performance bugs in that chain. A reader using this color to gauge "can I run WASI-NN inference on a riscv64 board today" should read Section 9, not this line, for the operative answer.
- **Pending work that could change the grade:** none identified for the spec repo itself (no open PRs, no RISE involvement). At the dependency layer, the following open items could materially improve real-world riscv64 WASI-NN readiness if merged: [openvinotoolkit/openvino#37746](https://github.com/openvinotoolkit/openvino/pull/37746) (BRGEMM/MatMul acceleration), [pytorch/pytorch#175746](https://github.com/pytorch/pytorch/pull/175746) (RVV `Vectorized<>` support, currently stalled), and resolution of the `cpuinfo_has_riscv_zvfh()` gap that underlies [google/XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886).

## 14. Investment Analysis

**RISE involvement check:** confirmed none. WASI-NN is not a RISE member project, has no RISE blog coverage, no RISE-funded work, and no RISE wheel-builder entry ([riseproject.dev](https://riseproject.dev), fetched directly). No investment sizing below overlaps with existing RISE-funded work in this specific project; however, RISE-adjacent investment already exists in the dependency chain (RISE members include NVIDIA, Google, Qualcomm, Red Hat, SiFive, and others funding general RISC-V software ecosystem work, and the RISE AI/ML working group already targets PyTorch, TensorFlow, TFLite, and llama.cpp - any PyTorch RVV work sized below should be coordinated with that working group rather than duplicated).

### 14.1 Functional Enablement

No functional enablement work is needed in `WebAssembly/wasi-nn` itself - the spec is architecture-independent by construction. All functional enablement work belongs to the dependency layer:
- Land [pytorch/pytorch#175746](https://github.com/pytorch/pytorch/pull/175746) (RVV `Vectorized<>` support) or an equivalent, to give the PyTorch backend any RVV-accelerated path at all.
- Fix `cpuinfo_has_riscv_zvfh()` upstream in `pytorch/cpuinfo`, unblocking [google/XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886) for both ONNX Runtime and PyTorch.
- Complete [openvinotoolkit/openvino#37746](https://github.com/openvinotoolkit/openvino/pull/37746) (BRGEMM/MatMul) to give the default OpenVINO backend a real JIT convolution path.

### 14.2 Performance Optimization

Not applicable to this repository (no compiled code to optimize). At the dependency layer, the highest-leverage performance items are the XNNPACK FP16 fix (cross-cutting for two of the three backends) and OpenBLAS's ZVL128B/ZVL256B kernel correctness ([xianyi/OpenBLAS#5830](https://github.com/xianyi/OpenBLAS/pull/5830)).

### 14.3 CI/CD Infrastructure

No riscv64 CI investment is warranted in `WebAssembly/wasi-nn` itself, since it has no build/test matrix for any architecture. Investment should instead target end-to-end riscv64 CI for a chosen (Wasmtime + backend) combination, so that a real wasi-nn workload is exercised on riscv64 rather than each layer being validated in isolation - no such integration CI exists today anywhere in the chain checked.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report's own scope rules (WASI NN has no dependent package ecosystem: it is not published to PyPI, npm, or any other package index, and has no plugin/extension ecosystem of its own).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Land RVV `Vectorized<>` support in PyTorch ([pytorch/pytorch#175746](https://github.com/pytorch/pytorch/pull/175746), currently stalled on design) | Data not available: no effort estimate found in the research for completing this specific PR | Unassigned upstream | High |
| Functional | Add `cpuinfo_has_riscv_zvfh()` to `pytorch/cpuinfo`, unblocking XNNPACK FP16 on riscv64 | Data not available: no effort estimate found | Unassigned upstream | Critical (cross-cutting root cause for two of three backends) |
| Functional | Complete OpenVINO BRGEMM/MatMul riscv64 acceleration ([openvinotoolkit/openvino#37746](https://github.com/openvinotoolkit/openvino/pull/37746)) | Data not available: no effort estimate found | Unassigned upstream | High (default backend) |
| CI/CD | Stand up end-to-end integration CI exercising a real wasi-nn workload (Wasmtime + one backend) on riscv64 | Data not available: no effort estimate found | Unassigned | Medium |
| Distribution | Publish an official riscv64 ONNX Runtime build newer than the stale Ubuntu 26.04 package (v1.23.2, predates RVV acceleration) | Data not available: no effort estimate found | Unassigned upstream / distro | Medium |
| Distribution | Publish a riscv64 PyTorch wheel (none exist in any of 48 published versions) | Data not available: no effort estimate found | Unassigned upstream / RISE (coordinate with RISE AI/ML working group, which already targets PyTorch) | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [github.com/WebAssembly/wasi-nn](https://github.com/WebAssembly/wasi-nn) - spec repository, file tree, CI workflow, releases/tags
- [github.com/bytecodealliance/wasi-nn](https://github.com/bytecodealliance/wasi-nn) - Rust/AssemblyScript language bindings repo
- [github.com/bytecodealliance/wasmtime](https://github.com/bytecodealliance/wasmtime) - reference host runtime, `wasmtime-wasi-nn` crate, ADOPTERS.md, CODEOWNERS
- [github.com/WebAssembly/wasi-sdk](https://github.com/WebAssembly/wasi-sdk) - added riscv64-linux cross-compilation to CI (toolchain-level, not wasi-nn specific)
- [github.com/bytecodealliance/wasm-micro-runtime](https://github.com/bytecodealliance/wasm-micro-runtime) - WAMR; lists RISCV32/RISCV64 build targets and a separate WASI_NN build option
- [docs.wasmtime.dev/stability-tiers.html](https://docs.wasmtime.dev/stability-tiers.html) - Wasmtime's tier policy, wasi-nn classified Tier 3
- [docs.wasmtime.dev/stability-platform-support.html](https://docs.wasmtime.dev/stability-platform-support.html) - per-platform tier table
- [bytecodealliance.org](https://bytecodealliance.org/) - governance, founding/member companies
- [riseproject.dev](https://riseproject.dev) - RISE member list, working groups; no WASI-NN mention
- [riseproject.dev/blog](https://riseproject.dev/blog) - blog listing (JS-rendered, no WASI-NN post found)
- [riseproject.dev - "A Glimpse Into V8 Development for RISC-V" (2025-12-09)](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/) - V8's native Wasm engine, not WASI-NN
- [riseproject.gitlab.io/python/wheel_builder](https://riseproject.gitlab.io/python/wheel_builder/) - RISE wheel builder tracked-package list; wasi-nn not present
- [pypi.org/pypi/wasi-nn/json](https://pypi.org/pypi/wasi-nn/json) - 404, no PyPI package
- [gitlab.com RISE wheel-builder PyPI mirror for wasi-nn](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/wasi-nn/) - redirects to the 404 above
- [packages.ubuntu.com search: WASI NN, suite resolute](https://packages.ubuntu.com/search?keywords=WASI%20NN&suite=resolute&searchon=names&section=all) - no results
- [archriscv.felixc.at search: wasi nn](https://archriscv.felixc.at/?q=wasi%20nn) - no results
- [bytecodealliance/wasmtime#5882](https://github.com/bytecodealliance/wasmtime/issues/5882) - unaligned-atomic bus-error crash
- [bytecodealliance/wasmtime#7237](https://github.com/bytecodealliance/wasmtime/issues/7237) - partial OOB write
- [openvinotoolkit/openvino#37746](https://github.com/openvinotoolkit/openvino/pull/37746) - BRGEMM/MatMul riscv64 acceleration PR
- [google/XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886) - missing `cpuinfo_has_riscv_zvfh()`, FP16 breakage
- [microsoft/onnxruntime#22530](https://github.com/microsoft/onnxruntime/issues/22530) - SGEMM silently wrong on riscv64
- [microsoft/onnxruntime#20030](https://github.com/microsoft/onnxruntime/issues/20030) - T-HEAD C906 accuracy collapse
- [oneapi-src/oneDNN#5361](https://github.com/oneapi-src/oneDNN/pull/5361) - reduction kernel correctness bug
- [llvm/llvm-project#87026](https://github.com/llvm/llvm-project/issues/87026) - libomp fails to build natively on riscv64
- [oneapi-src/oneTBB#987](https://github.com/oneapi-src/oneTBB/pull/987) - GCC link failure without manual `-latomic`
- [pytorch/pytorch#175746](https://github.com/pytorch/pytorch/pull/175746) - RVV `Vectorized<>` support PR, stalled
- [xianyi/OpenBLAS#5830](https://github.com/xianyi/OpenBLAS/pull/5830) - ZVL256B TRSM correctness bug, draft PR
- Internal project reports consulted for dependency detail: `project-reports/wasmtime.md`, `project-reports/openvino-runtime.md`, `project-reports/onnx.md`, `project-reports/pytorch.md`, `project-reports/onednn.md`, `project-reports/onetbb.md`