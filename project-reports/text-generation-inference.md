---
title: text-generation-inference
parent: Project Reports
color: orange
dependencies:
  - name: PyTorch
    relation: runtime-dependency
    criticality: critical
  - name: llama.cpp
    relation: build-dependency
    criticality: critical
  - name: bindgen
    relation: build-dependency
    criticality: critical
  - name: TensorRT-LLM
    relation: build-dependency
    criticality: optional
---

# text-generation-inference

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for text-generation-inference<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="text-generation-inference" %}

## 1. Project Overview

text-generation-inference (TGI) is Hugging Face's production LLM-serving toolkit: a Rust HTTP/gRPC router in front of a Python gRPC model server, with pluggable inference backends for NVIDIA CUDA (default), AMD ROCm, Intel XPU/CPU, Intel Gaudi (Habana), AWS Neuron/Inferentia, and NVIDIA TensorRT-LLM, plus a CPU-only `llama.cpp` backend. It is Apache 2.0 licensed and single-vendor governed: per the project's own `CONTRIBUTING.md`, "TGI is a project led and managed by Hugging Face as it powers our internal services." There is no `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file; maintainership is informal and by invitation, with Hugging Face retaining control. There is no neutral foundation (not Linux Foundation, not PyTorch Foundation).

**Critical status change:** the repository was **archived by its owner on 2026-03-21** and is now read-only. Hugging Face's own documentation states TGI is "now in maintenance mode," restricts future acceptance to "minor bug fixes, documentation improvements and lightweight maintenance tasks," and explicitly redirects users and contributors to **vLLM, SGLang, llama.cpp, and MLX** as successor projects. At archival the repo had 10.9k stars and 1.3k forks on the default branch `main`.

Corporate contributors by commit history and email domain: Hugging Face (Nicolas Patry, 83 commits and top contributor; Daniel de Kok; Hugo Larcher; David Corvoysier; Adrien Gallouet; Julien Chaumond; OlivierDehaene, all `@huggingface.co`); Intel (Wang Yi, Yuan Wu, kaixuanliu, Dmitry Rogozhkin, all `@intel.com`, focused on the Intel/Gaudi backends); AMD (Mohit Sharma, inferred from ROCm-specific commit content, not email domain).

No community culture toward new hardware ports can be assessed going forward because the repository no longer accepts feature-scoped contributions of any kind.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2025-02-26 | Issue #3059 "Support for RISC-V?" opened by JocelynPanPan; a one-line question, never answered, 0 comments, not a tracking issue | [Issue #3059](https://github.com/huggingface/text-generation-inference/issues/3059) |
| 2026-03-21 | Repository archived by Hugging Face; read-only; maintenance mode; users redirected to vLLM/SGLang | huggingface.co/docs/text-generation-inference archive banner (research finding, per-source WebFetch of the public repo page) |

No commit, pull request, CI job, Dockerfile variant, or code path referencing RISC-V, riscv, riscv64, or RVV exists anywhere in this repository's history. A repo-wide case-insensitive grep of a full clone at commit `b4adbf2f6e2e721280bd0ea5f91d70f7d033f5ed` returned zero matches, and four independent GitHub PR searches (`riscv64`, `riscv`, `risc-v`, `risc-v in:body,title`) scoped to this repo each returned `total_count: 0`. There is no key contributor associated with any RISC-V work because none exists.

**Is it fully upstream?** No. There is no RISC-V port of any kind, upstream or otherwise, in `huggingface/text-generation-inference`. The only RISC-V-adjacent engineering effort anywhere near this codebase is a third-party fork, [sophgo/text-generation-inference](https://github.com/sophgo/text-generation-inference), which adds a `Dockerfile_riscv` targeting Sophgo SG2042/SOPHON hardware. This fork has never been proposed or merged upstream, and with the upstream repository now archived, it never can be.

## 3. Upstream Support Tier

No formal tier policy document exists (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/`). The closest artifact is `docs/source/multi_backend_support.md`, which informally lists backends (CUDA default, TRT-LLM, llama.cpp, Neuron) without any support-level classification.

| Architecture | Build (CI) | Test (CI) | Official release artifact |
|---|---|---|---|
| amd64 (x86_64 host) | Yes -- 8 Dockerfiles, 7 hardware-matrix targets (cuda, cuda-trtllm, rocm, intel-xpu, intel-cpu, neuron, gaudi), all built for `platforms: 'linux/amd64'` in `build.yaml` | Yes | Yes -- multi-arch container images on `ghcr.io/huggingface/text-generation-inference` (accelerator-differentiated, not CPU-ISA-differentiated) |
| arm64 | No -- zero `Dockerfile_arm*` files, no `linux/arm64` platform entry anywhere in the CI matrix | No | No |
| riscv64 | No | No | No |

The important nuance: riscv64's absence is not a case of amd64 and arm64 both being real ports while riscv64 lagged. **arm64 does not exist in this project either.** TGI's entire Docker/CI matrix targets `linux/amd64` hosts exclusively, differentiated only by accelerator vendor (NVIDIA/AMD/Intel/Gaudi/Neuron), never by CPU ISA. riscv64 sits in the same "outside project scope" bucket as arm64, not in a worse "attempted and abandoned" bucket.

## 4. Technical Architecture and RISC-V-Specific Subsystems

TGI itself contains no architecture-specific numerics code (no SIMD kernels, no hand-written assembly, no JIT of its own). It is glue: a Rust router plus a Python gRPC server that delegate all ISA-specific work to backend dependencies (PyTorch, llama.cpp, TensorRT-LLM -- see Section 9). The one class of architecture-relevant code that does live in this repository is the Rust router's TLS/crypto dependency stack.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CUDA/TensorRT-LLM GPU inference kernels | Full (vendor SDK) | N/A (no CUDA arm64 desktop path examined) | Missing -- categorically excluded, CUDA has no riscv64 target at all |
| llama.cpp CPU inference kernels (RVV/NEON/AVX in llama.cpp itself) | Full (AVX2/AVX-512) | Full (NEON) | llama.cpp upstream has native RVV kernels, but TGI's own `backends/llamacpp` integration has never been built, tested, or CI'd for riscv64 -- see Section 9 |
| TLS/crypto (rustls / aws-lc-rs / ring / OpenSSL) | Full | Full | Mixed -- OpenSSL and the modern `rustls 0.23`/`aws-lc-rs` path are reasonably supported on riscv64; a stale transitive `ring 0.16.20` pin (via `async-rustls 0.3.0`) matches exactly the version upstream `ring` issues call out as broken on riscv64gc -- see Section 9 |
| Compression (flate2/miniz_oxide) | Full | Full | Full -- pure-Rust `miniz_oxide` backend, architecture-agnostic |

No `#ifdef __riscv`, no `cfg(target_arch = "riscv64")` guard, no RVV intrinsic, and no riscv64-labeled build target exists anywhere in the tree, confirmed by full-repository grep and by `mcp__github__search_code` for `#ifdef __riscv repo:huggingface/text-generation-inference` (0 results).

## 5. Build System, Cross-Compilation, and Toolchain

TGI's build system is a Cargo workspace (router, launcher, backends/v2, v3, grpc-metadata, llamacpp) plus a Python `pyproject.toml` (gRPC server) plus one CMake subsystem confined to `backends/trtllm/CMakeLists.txt`, which exists solely to `FetchContent`-pull and build NVIDIA's `nvidia/TensorRT-LLM` v0.17.0.

- No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` exists in the repo.
- No `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake` exists; there is no generic cross-compilation toolchain-file mechanism in this project for a RISC-V file to plug into.
- The TensorRT-LLM CMake subsystem hard-requires `find_package(CUDAToolkit 12.6 REQUIRED)`. Since no riscv64 CUDA toolkit exists, this backend is architecturally excluded from riscv64 builds regardless of any porting effort.
- `backends/llamacpp/build.rs` links the system `llama` library via pkg-config and generates FFI bindings via `bindgen` (see Section 9) -- this is the one backend with a theoretical riscv64 path (llama.cpp itself supports RVV), but no build, test, or CI evidence exists for this specific TGI backend integration on riscv64.
- No documented minimum GCC/Clang version for riscv64, no QEMU cross-build documentation: none of this exists because no one has attempted the port.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CUDA / TensorRT-LLM GPU backend | Supported | Not supported | Not supported (architectural: no CUDA riscv64 target) |
| ROCm (AMD) backend | Supported | Not supported | Not supported |
| Intel XPU/CPU, Gaudi backends | Supported | Not supported | Not supported |
| AWS Neuron/Inferentia backend | Supported | Not supported | Not supported |
| llama.cpp CPU backend | Supported | Supported [NEEDS VERIFICATION -- not directly confirmed in this research pass] | Not built/tested/CI'd within TGI |
| Official container image | Supported | Not published for this architecture per the CI matrix reviewed | Not published |

**Functional gap:** total. There is no working riscv64 build of TGI through any backend.

**Performance gap:** Data not available. No benchmark of TGI itself on riscv64 hardware exists in any source found (blog, paper, repo artifact). Adjacent, non-TGI LLM-inference-on-RISC-V research exists (e.g. a ScienceDirect paper on the SOPHON SG2042 64-core RISC-V CPU using PyTorch with OpenBLAS/BLIS, abstract-only access, 403 on full text) but does not measure TGI and cannot be used to infer TGI-specific performance deltas.

**Security hardening gap:** the transitive `ring 0.16.20` crate (pulled via the legacy `async-rustls 0.3.0` dependency, not the primary TLS path) is pinned to exactly the version referenced by open upstream issues [briansmith/ring#2022 "Add riscv64 Support"](https://github.com/briansmith/ring/issues/2022) and [briansmith/ring#1612 "ring on riscv64 platform"](https://github.com/briansmith/ring/issues/1612) as difficult to build on riscv64gc. Risk is low because it is one legacy transitive edge, not the primary TLS path (`rustls 0.23` / `aws-lc-rs`), but it is a real landmine that would need a dependency bump regardless of RISC-V.

**NaN / floating-point semantics issues:** Data not available. No TGI-specific report of NaN or floating-point divergence on riscv64 was found; no such testing has ever occurred since the project has never been built for the architecture.

## 7. CI/CD Infrastructure

**No riscv64 CI exists, confirmed by direct file inspection**, not inference from issue text. All 16 workflow files in `.github/workflows/` were read directly (`autodocs.yaml`, `build.yaml`, `build_documentation.yaml`, `build_pr_documentation.yaml`, `ci_build.yaml`, `client-tests.yaml`, `codeql.yml`, `integration_tests.yaml`, `load_test.yaml`, `nix_build.yaml`, `nix_cache.yaml`, `nix_tests.yaml`, `stale.yaml`, `tests.yaml`, `trufflehog.yaml`, `upload_pr_documentation.yaml`); every one returned zero matches for `riscv`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repo. A whole-repo case-insensitive search for `riscv` and the broader substring `risc` both returned zero matches, and GitHub's server-side code index (`mcp__github__search_code query:"riscv repo:huggingface/text-generation-inference"`) independently returned `{"total_count":0}`, corroborating the local grep.

| Architecture | CI builds | CI runs tests | RISE runners used | Hardware |
|---|---|---|---|---|
| amd64 | Yes | Yes | No | GitHub-hosted / self-hosted amd64 runners (matrix across 7 accelerator targets) |
| arm64 | No | No | No | N/A |
| riscv64 | No | No | No | N/A |

No RISE RISC-V Runner usage, no funded RFP or working-group activity, and no RISE blog coverage ties `text-generation-inference` to the RISE Project -- confirmed by checking [riseproject.dev/blog](https://riseproject.dev/blog) (all post titles/summaries), the RISE Python wheel builder package list (~70 packages, TGI absent), the GitHub org `riseproject-dev` (repo search, code search, and the 729-issue `python-wheels` package-request tracker, all zero hits for this project).

## 8. Distribution and Release Status

No riscv64 (or any-architecture) binary/package exists for `text-generation-inference` through any channel checked:

- **GitHub releases:** the v3.3.7 release (and every prior tag checked back to v3.2.2) carries exactly two assets -- GitHub's auto-generated `v3.3.7.zip` and `v3.3.7.tar.gz` source archives. No custom binaries of any architecture are attached. [Release v3.3.7](https://github.com/huggingface/text-generation-inference/releases/tag/v3.3.7)
- **PyPI:** `https://pypi.org/pypi/text-generation-inference/json` and `https://pypi.org/simple/text-generation-inference/` both return HTTP 404. The package does not exist on PyPI under this name at all, for any architecture.
- **RISE wheel builder:** redirects to the PyPI mirror above, which 404s. No package present.
- **Ubuntu 26.04 (resolute):** [package search](https://packages.ubuntu.com/search?keywords=text-generation-inference&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results" for any architecture.
- **Arch Linux RISC-V port:** no matching package found via [archriscv.felixc.at](https://archriscv.felixc.at/?q=text-generation-inference) query or its packages data endpoint.

TGI's actual distribution channel is multi-arch Docker images on `ghcr.io/huggingface/text-generation-inference`, built exclusively for `linux/amd64` per the CI matrix reviewed in Section 7; those image manifests were not separately inspected but the build platform restriction in `build.yaml` makes a riscv64 image implausible.

**What a user must do to get a working binary on riscv64:** there is none available through any first-, second-, or third-party channel. A user would have to build from source entirely unassisted (no toolchain file, no documented cross-compilation path -- see Section 5), and even a successful CPU-only (`llamacpp` backend) build would be an unverified, never-before-attempted configuration. The only related artifact is the out-of-repo `sophgo/text-generation-inference` fork's `Dockerfile_riscv`, built for specific Sophgo SG2042/SOPHON hardware and not a general-purpose riscv64 release.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community / notes |
|---|---|---|---|---|---|
| **PyTorch** | runtime-dependency, critical -- core tensor/numerics engine and CUDA JIT (Inductor) for the default backend | Tier-3/community; builds only via cross-compile+QEMU CI, no native in-tree CI | No in-tree riscv64 test job; RISE out-of-tree CI (870 jobs) exists with no published pass-rate | No PyPI wheel (0/48 versions); Debian sid only (`2.12.0+dfsg2-4`); not in Ubuntu at all | ATen `Vectorized<>` has zero RVV dispatch (PR #175746 open, blocked); XNNPACK FP16 CI broken (issue #9886); no CODEOWNERS for RISC-V |
| **llama.cpp** | build-dependency, critical -- SIMD CPU inference backend linked via `backends/llamacpp` (pkg-config `llama` + bindgen) | Green upstream -- native riscv64 CI (`ubuntu-24.04-riscv`, RISE runners), CODEOWNERS assigned | Green upstream on RVV1.0; sanitizer jobs `continue-on-error`; SpacemiT path build-only | No GitHub release riscv64 asset (issue #20988 closed not-planned); Debian sid has full build; `llama-cpp-python` PyPI has no riscv64 wheel | SIGILL on non-Zfh cores e.g. SiFive P550 (issue #24250, open); Zvfh 16x1 repack crash on SpacemiT K1 (issue #22655, open); xtheadvector currently broken (PR #23009 open). Note: this is llama.cpp's own upstream status -- TGI's `backends/llamacpp` integration itself has never been built or CI'd for riscv64 |
| **bindgen** | build-dependency, critical -- generates Rust FFI bindings to the system `llama` library headers for `backends/llamacpp/build.rs` | Data not available: no direct riscv64-specific CI/crates.io search was performed for the `bindgen` crate itself in this research pass | Data not available | Data not available | Runs as a host-side build tool (via libclang); host-tool status was not independently verified for riscv64 in this research. [NEEDS VERIFICATION] |
| **TensorRT-LLM** | build-dependency, optional -- GPU inference backend, CUDA/TensorRT JIT engine build, fetched by `backends/trtllm/cmake/trtllm.cmake` from `nvidia/TensorRT-LLM` v0.17.0 | Not applicable/blocked -- hard `find_package(CUDAToolkit 12.6 REQUIRED)`; no riscv64 CUDA toolkit exists | N/A | N/A -- no riscv64 reference found anywhere in NVIDIA's docs, support matrix, or repo | Architectural blocker, not a porting gap: CUDA has no riscv64 target, so this backend is categorically excluded regardless of upstream effort |
| aws-lc-rs / aws-lc-sys (indirect, primary TLS crypto path via `rustls 0.23.25`) | TLS crypto backend for the router's HTTP/gRPC clients | Partial -- CI target list includes `riscv64gc-unknown-linux-gnu`; requires CMake+Clang at build time (no pregenerated bindings) | Not separately documented; covered by cross-target CI | No dedicated riscv64 crates.io/binary distribution info found | [aws/aws-lc-rs#874](https://github.com/aws/aws-lc-rs/issues/874): no pregenerated bindings for `riscv64gc-unknown-linux-musl`; [#735](https://github.com/aws/aws-lc-rs/issues/735) requests removing the CMake/Clang build dependency to ease riscv64 packaging |
| ring (indirect, pulled transitively via `async-rustls 0.3.0`, v0.16.20 pinned) | Legacy transitive crypto crate, one indirect dependency edge, not on the primary TLS path | Historically poor for the pinned version -- [ring#1182](https://github.com/briansmith/ring/issues/1182) "no RISC-V support", [#1419](https://github.com/briansmith/ring/issues/1419) build failure; [#1627](https://github.com/briansmith/ring/issues/1627) added riscv64 CI support upstream but TGI is pinned to 0.16.20, predating that fix | Unknown for pinned 0.16.20 | No riscv64-specific release notes found | Open [ring#2022](https://github.com/briansmith/ring/issues/2022) "Add riscv64 Support" and [#1612](https://github.com/briansmith/ring/issues/1612) both reference build difficulty on v0.16.20 specifically -- the exact pinned version |
| rustls (indirect; three versions coexist: 0.20.9, 0.22.4, 0.23.25) | TLS state machine for HTTP clients (hf-hub downloads, otlp exporter) | Pure-Rust, no ISA-specific code; builds wherever its resolved crypto backend builds | Same caveat as backend crypto provider | crates.io source-only (normal for Rust deps); no riscv64-specific blocker found | Inherits whichever blocker its resolved crypto provider (ring 0.16.20 vs aws-lc-rs) has for a given dependency edge |
| OpenSSL (indirect, system dependency via `openssl-sys 0.9.106`, plus llama.cpp's optional `LLAMA_OPENSSL`) | TLS/crypto fallback, HTTPS model downloads in the llama.cpp backend | Green -- `linux64-riscv64` target since May 2022, RVV-accelerated AES/GCM/ChaCha20/SHA via Zkn/Zvk; dedicated CI workflow (`riscv-more-cross-compiles.yml`, 13 extension configs) | QEMU-only CI; main `ci.yml` has zero riscv references | Available in all major Linux distros including Ubuntu/Debian | Open [openssl/openssl#29357](https://github.com/openssl/openssl/issues/29357): `no-deprecated` cross-compile fails on riscv64 (all branches 3.4-4.0, master); FIPS module untested on riscv64 |
| flate2 / miniz_oxide (indirect, `Cargo.lock` 1.1.0 / 0.8.5) | Compression (gzip for OTLP exporter / HTTP bodies) | Green -- pure-Rust `miniz_oxide` backend, architecture-agnostic | No riscv64-specific issues found | Standard crates.io source dist | None found |
| NumPy (indirect, `server/pyproject.toml`, `numpy>=1.26,<3`) | N-dimensional array interop for the Python gRPC server | Green -- native riscv64 wheel-build CI added (PR #31488, RISE runners), target milestone 2.6.0 | Green; Debian sid autopkgtests pass | No PyPI wheel yet (0/72 files in 2.4.6); Debian sid and Ubuntu 24.04 `python3-numpy` both ship riscv64 `.deb` | Tracking issue [numpy/numpy#30216](https://github.com/numpy/numpy/issues/30216): scipy-openblas riscv64 wheels are "slow"/have an RVV correctness regression (OpenBLAS #5811), blocking official PyPI wheel publication |
| gRPC / grpcio (indirect, `server/pyproject.toml` `grpcio>=1.67.0`) | RPC transport between router and Python model server | Works as portable C fallback (BoringSSL `nohw` scalar path); no upstream riscv64-specific CI | No upstream riscv64 CI; Debian builds succeed independently | No official PyPI `grpcio` riscv64 wheel (0/51 files in 1.81.1); Debian sid has a working build (`1.51.1-9`) | Open [grpc/grpc#41591](https://github.com/grpc/grpc/issues/41591): request for official riscv64 manylinux/musllinux wheels, P2, no progress |

**Overall dependency picture:** the CPU inference path (llama.cpp) is the most mature upstream dependency (native RVV kernels, native CI), but TGI's own integration of it has zero riscv64 testing. The GPU paths (PyTorch backend, TensorRT-LLM backend) are blocked: TensorRT-LLM categorically by CUDA's absence on riscv64, PyTorch by its own Tier-3/community status with no PyPI wheel. The crypto layer is mixed, with a low-risk but real landmine in the pinned legacy `ring 0.16.20` transitive edge. The Python server toolchain (NumPy, grpcio) builds from source via distro packages but has no official PyPI riscv64 wheel for either, meaning a `pip install`-based deployment path is not currently viable on riscv64 independent of TGI's own status.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#3059](https://github.com/huggingface/text-generation-inference/issues/3059) | "Support for RISC-V?" | Open (will remain open indefinitely; repo archived/read-only as of 2026-03-21) | Feature request, not a bug | 0 comments, never triaged, never answered by a maintainer. Not a tracking issue -- no checklist, no linked sub-issues or PRs, no labels |

No correctness bugs, no NaN/floating-point issues, and no performance-regression issues specific to TGI on riscv64 exist, because the configuration has never been built or run. This is an absence of data, not a clean bill of health.

## 12. Objections and Upstream Blockers

**Organizational blocker (terminal):** the repository was archived by Hugging Face on 2026-03-21 and is now read-only. No pull request of any kind -- including a RISC-V port -- can be merged upstream ever again. Hugging Face's stated maintenance-mode policy already restricted future acceptance to "minor bug fixes, documentation improvements and lightweight maintenance tasks" even before archival, and now nothing can land at all. Maintainers direct all future engine-level work to vLLM and SGLang.

**Architectural blocker (TensorRT-LLM backend):** `find_package(CUDAToolkit 12.6 REQUIRED)` in `backends/trtllm/CMakeLists.txt` is a hard requirement. CUDA has no riscv64 target in any form, so this backend is categorically excluded from riscv64 regardless of any porting investment.

**Upstream-dependency immaturity (PyTorch backend):** PyTorch is Tier-3/community on riscv64 with no PyPI wheel and no native in-tree CI (see the project's own status report referenced in Section 9). This blocks the default TGI backend independent of any change within TGI itself.

**No stated technical objection specific to TGI:** because Issue #3059 received zero maintainer response, there is no recorded upstream technical objection to a riscv64 port -- the project simply never engaged with the question before archival.

**Acceptance probability:** zero. The repository does not accept new feature work of any kind post-archival. Any RISC-V investment aimed at TGI itself cannot reach upstream; it could at most produce an unofficial fork (as `sophgo/text-generation-inference` already has for its own CPU-hardware target) or documentation-only build instructions with no code path back into the canonical project.

## 13. Readiness Assessment

- **Color:** orange (base orange under Step 1 of the color model: no upstream riscv64 CI of any kind and no distribution package through any channel -- GitHub releases, PyPI, Ubuntu 26.04, Arch RISC-V, or the RISE wheel builder -- all confirmed absent. This is not the distribution floor case, since no distro packages this project at all, patched or otherwise.)
- **Release provider:** none. No party -- upstream, RISE, any Linux distro, or a third party -- publishes a consumable riscv64 release or binary for `text-generation-inference`. The only riscv64-adjacent artifact anywhere is the unofficial `sophgo/text-generation-inference` fork's `Dockerfile_riscv`, which is a build recipe for specific Sophgo hardware, not a published release channel.
- **Optimization gap:** N/A. TGI is an inference-serving application, not itself a performance-optimization or kernel library; running it on riscv64 with fully generic backends would still deliver the value proposition (a serving layer), so the Step 2 optimization-purpose modifier does not apply. All ISA-specific optimization work belongs to its dependencies (PyTorch, llama.cpp, TensorRT-LLM), assessed in Section 9.
- **Justification:** confirmed by direct inspection of all 16 CI workflow files (zero riscv references), a full-repository grep (zero matches), and independent checks of GitHub releases, PyPI, Ubuntu 26.04, the RISE wheel builder, and the Arch RISC-V port (all absent) -- see [Issue #3059](https://github.com/huggingface/text-generation-inference/issues/3059) and [release v3.3.7](https://github.com/huggingface/text-generation-inference/releases/tag/v3.3.7). Since the repository was archived on 2026-03-21, this classification is now also structurally permanent: there is no CI or release channel left to change.
- **Pending work that could change the grade:** none. There is no open PR, no RISE involvement (confirmed absent across the RISE blog, the RISE GitHub org, and the RISE wheel builder's package list), and no path for upstream code to change post-archival. The only route to a better color for riscv64 LLM serving is a different project entirely (vLLM or SGLang, per Hugging Face's own redirection), not further investment in TGI.

## 14. Investment Analysis

Before sizing any work: RISE has funded and shipped real RISC-V infrastructure and CI for two of TGI's dependencies (llama.cpp: native RVV kernels and RISE-runner CI; NumPy: riscv64 wheel-build CI via PR #31488) but has **no involvement with text-generation-inference itself** -- confirmed absent from the RISE blog, the `riseproject-dev` GitHub org, and the RISE Python wheel builder's package list. None of that llama.cpp/NumPy work is TGI-specific and none of it should be re-sized here; it is already covered in those projects' own reports (`project-reports/pytorch.md`, `project-reports/llama-cpp.md`, `project-reports/numpy.md`, `project-reports/openssl.md`, `project-reports/grpc.md`).

Because the repository is archived and permanently closed to new contributions, the only sizeable investment scope below is **unofficial fork maintenance** (as `sophgo/text-generation-inference` already does), not upstream enablement. This changes the framing of every subsection below from "what it costs to get this merged" to "what it costs to run an out-of-tree fork."

### 14.1 Functional Enablement

A minimal riscv64-capable fork would need to: (1) strip or stub the TensorRT-LLM backend entirely (architecturally impossible on riscv64), (2) validate the `llamacpp` backend's `build.rs`/bindgen/pkg-config path against a riscv64 `llama.cpp` build, and (3) confirm the PyTorch-based default backend either works via PyTorch's existing community/Tier-3 riscv64 build or is disabled in favor of the llama.cpp-only path. None of this can be validated from existing research; all of it is unattempted.

### 14.2 Performance Optimization

Not applicable to TGI itself (see Section 13 optimization-gap determination). Any performance work belongs to the PyTorch and llama.cpp dependency reports.

### 14.3 CI/CD Infrastructure

Upstream CI cannot be extended (repository archived). A fork-level CI would need to be built from scratch, mirroring TGI's own `ci_build.yaml`/`tests.yaml` patterns but targeting a riscv64 runner (RISE runners are the only known available RISC-V CI capacity referenced across this research).

### 14.4 Ecosystem Enablement

Not applicable -- Section 10 is omitted per the report's scoping rules; TGI is a standalone serving application, not a library with a dependent package ecosystem.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Validate `llamacpp` backend build (bindgen/pkg-config) against riscv64 llama.cpp in an unofficial fork; strip TensorRT-LLM backend | 2-4 | Fork maintainer (no upstream owner exists) | Low -- repo archived, no upstream merge path |
| Functional | Determine whether the default PyTorch backend is viable on riscv64 given PyTorch's own Tier-3/no-wheel status, or disable it in favor of llama.cpp-only | 1-2 (investigation only; blocked on PyTorch's own riscv64 maturity, tracked separately) | Fork maintainer | Low |
| CI/CD | Stand up fork-level riscv64 CI (build + smoke test) on RISE runner capacity | 2-3 | Fork maintainer | Low |
| Strategic | Redirect RISC-V LLM-serving investment to vLLM and/or SGLang, per Hugging Face's own stated successor guidance | Data not available: no research performed on vLLM/SGLang riscv64 status in this pass -- recommend as a separate report | Engineering leadership | High (redirect decision, not TGI work) |

Overall recommendation: given the archived/maintenance-mode status confirmed in Section 1 and the total absence of any riscv64 CI, release, or code path confirmed in Sections 3, 7, and 8, further RISC-V investment in `huggingface/text-generation-inference` itself is not recommended. The template's investment categories are populated above for completeness, but the actionable recommendation is to evaluate **vLLM** and **SGLang** (Hugging Face's own named successors) as the target for any RISC-V LLM-serving investment, subject to a separate readiness assessment of those projects.

## 15. Updates

(No updates yet -- initial report dated 2026-06-17.)

## 16. References

- [Issue #3059, "Support for RISC-V?"](https://github.com/huggingface/text-generation-inference/issues/3059)
- [huggingface/text-generation-inference repository](https://github.com/huggingface/text-generation-inference)
- [Release v3.3.7](https://github.com/huggingface/text-generation-inference/releases/tag/v3.3.7)
- [PyPI JSON API, text-generation-inference (404)](https://pypi.org/pypi/text-generation-inference/json)
- [PyPI simple index, text-generation-inference (404)](https://pypi.org/simple/text-generation-inference/)
- [Ubuntu 26.04 (resolute) package search, text-generation-inference (no results)](https://packages.ubuntu.com/search?keywords=text-generation-inference&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port search, text-generation-inference](https://archriscv.felixc.at/?q=text-generation-inference)
- [sophgo/text-generation-inference (third-party fork, not upstream)](https://github.com/sophgo/text-generation-inference)
- [huggingface.co/docs/text-generation-inference](https://huggingface.co/docs/text-generation-inference)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [GitHub org riseproject-dev](https://github.com/riseproject-dev)
- [aws-lc-rs issue #874, no pregenerated riscv64gc-musl bindings](https://github.com/aws/aws-lc-rs/issues/874)
- [aws-lc-rs issue #735, remove CMake/Clang build dependency](https://github.com/aws/aws-lc-rs/issues/735)
- [ring issue #2022, "Add riscv64 Support"](https://github.com/briansmith/ring/issues/2022)
- [ring issue #1612, "ring on riscv64 platform"](https://github.com/briansmith/ring/issues/1612)
- [ring issue #1182, "no RISC-V support"](https://github.com/briansmith/ring/issues/1182)
- [ring issue #1419, riscv64gc-unknown-linux-gnu build failure](https://github.com/briansmith/ring/issues/1419)
- [ring PR #1627, add riscv64 support and CI](https://github.com/briansmith/ring/pull/1627)
- [OpenSSL issue #29357, no-deprecated cross-compile fails on riscv64](https://github.com/openssl/openssl/issues/29357)
- [NumPy tracking issue #30216, scipy-openblas riscv64 wheel status](https://github.com/numpy/numpy/issues/30216)
- [grpc issue #41591, request for official riscv64 wheels](https://github.com/grpc/grpc/issues/41591)
- [llama.cpp issue #20988, no GitHub release riscv64 asset, closed not-planned](https://github.com/ggml-org/llama.cpp/issues/20988)
- [llama.cpp issue #24250, SIGILL on non-Zfh cores](https://github.com/ggml-org/llama.cpp/issues/24250)
- [llama.cpp issue #22655, Zvfh repack crash on SpacemiT K1](https://github.com/ggml-org/llama.cpp/issues/22655)
- [llama.cpp PR #23009, xtheadvector broken](https://github.com/ggml-org/llama.cpp/pull/23009)
- [PyTorch PR #175746, ATen Vectorized RVV dispatch, open/blocked](https://github.com/pytorch/pytorch/pull/175746)
- [PyTorch issue #9886, XNNPACK FP16 CI broken](https://github.com/pytorch/pytorch/issues/9886)
- RISE blog posts checked for TGI/text-generation-inference coverage (none found): [RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/), [Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/), [PyTorch is available on riscv64!](https://riseproject.dev/2026/08/18/pytorch-is-available-on-riscv64/)