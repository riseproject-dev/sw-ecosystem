---
title: Edge Impulse Linux SDK (Go)
parent: Project Reports
color: orange
dependencies:
  - name: disintegration/imaging
    relation: runtime-dependency
    criticality: critical
  - name: fsnotify/fsnotify
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" focus="edge-impulse-linux-sdk-(go)" %}

# Edge Impulse Linux SDK (Go)

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Edge Impulse Linux SDK (Go)<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Edge Impulse Linux SDK (Go) ([github.com/edgeimpulse/linux-sdk-go](https://github.com/edgeimpulse/linux-sdk-go)) is a Go client library that lets applications run Edge Impulse machine learning models and collect sensor data on Linux machines. Per its `runner.go` source, the SDK's core function is to spawn a separately-built, Edge-Impulse-supplied `.eim` model binary as a subprocess (`exec.CommandContext(ctx, modelPath, "runner.sock")`) and exchange JSON messages with it over a Unix domain socket. The SDK also wraps system tools (`ffmpeg`, `gst-launch-1.0`, `imagesnap`, `sox`, `v4l2-ctl`) for audio/image capture. It is licensed BSD-3-Clause-Clear.

**Governance:** No foundation governance. This is a standard corporate SDK repository owned and directly maintained by Edge Impulse, a commercial company. There is no MAINTAINERS, OWNERS, CODEOWNERS, PLATFORMS.md, or SUPPORT.md file in the repository, and the official documentation page ([docs.edgeimpulse.com](https://docs.edgeimpulse.com/docs/tools/edge-impulse-for-linux/linux-go-sdk)) states only that Edge Impulse maintains it, with no governance model or platform-tier policy described.

**Corporate sponsors:** Edge Impulse only. No co-maintaining companies were found.

**Community culture on new ports:** Not observable. The repository has only 4 commits in its entire history, 5 stars, 3 forks, 15 watchers, and 0 open issues. There is no discussion of platform ports of any kind (not just RISC-V) anywhere in the repository's issue tracker, PR history, or commit history.

**RISE Project membership:** Edge Impulse is not listed among RISE's Premier or General members (fetched [riseproject.dev](https://riseproject.dev)). No RISE blog post, working group repository, or funded project references Edge Impulse in any form.

## 2. Port History and Upstreoping Timeline

| Date | Event | Source |
|---|---|---|
| n/a | No RISC-V port has ever been proposed, discussed, or attempted | [GitHub commit search, repo-scoped, "riscv"](https://github.com/edgeimpulse/linux-sdk-go) - 0 results |

No milestone table can be constructed because no RISC-V-related activity exists. There are no key contributors to name for this axis, and the SDK is not "fully upstream" for riscv64 in any sense - there is no code, no CI, and no release for riscv64. Repository-wide, a case-insensitive grep for "riscv" across all tracked files returned zero matches, and `mcp__github__search_commits`, `search_issues`, and `search_pull_requests` scoped to `edgeimpulse/linux-sdk-go` with the queries `riscv`, `riscv64`, and `risc-v` each returned zero results.

## 3. Upstream Support Tier

No formal platform-tier policy exists for this project - there is no PLATFORMS.md, SUPPORT.md, or documented tier system in the repository or in the [official docs page](https://docs.edgeimpulse.com/docs/tools/edge-impulse-for-linux/linux-go-sdk). The closest thing to a tier signal is Edge Impulse's documented list of supported Linux SDK targets, which names **x86_64, ARMv7, and AARCH64 only**; RISC-V does not appear anywhere in that documentation.

| Axis | amd64 (x86_64) | arm64 (AARCH64) | riscv64 |
|---|---|---|---|
| Documented as supported target | Yes | Yes | No |
| Upstream CI | None exists for this repo (no `.github/workflows` at all) | None exists for this repo | None exists for this repo |
| Official `.eim` build target (`mks/tflite.mk`) | `linux-x86` | `linux-aarch64` | Not present (no `TARGET_LINUX_RISCV64`) |
| GitHub release artifacts | None (repo has 0 releases published, any arch) | None | None |

Because the upstream repository has never published a single GitHub release for any architecture ("There aren't any releases here" per the [releases page](https://github.com/edgeimpulse/linux-sdk-go/releases)), the amd64/arm64 columns above reflect Edge Impulse's documented support commitment and separate build tooling, not artifacts published from this specific repo.

## 4. Technical Architecture and RISC-V-Specific Subsystems

Direct file-level inspection of the cloned repository (`edgeimpulse/linux-sdk-go` @ `b89a73e5a1b2ebcc659e7285d9eb1b9d4b55c7e4`, 18 `.go` files, 2,959 lines) found:

- `grep -rn "import \"C\"|cgo|unsafe\."` -> zero matches. No cgo anywhere.
- `grep -rn "GOARCH"` -> zero matches. Only 2 occurrences of `runtime.GOOS == "darwin"` (OS branching for Sox/imagesnap on macOS vs Linux, unrelated to architecture).
- `grep -rln "^//go:build|^// +build"` -> zero files. No Go build-tag files of any kind, for any architecture.
- Repo-scoped code search for `GOARCH`, `go:build`, and `amd64 OR arm64 OR riscv64` all returned `total_count: 0`.

This means the Go SDK itself has **no architecture-specific code for any architecture, including amd64 and arm64** - it is 100% portable Go. All hardware-optimized, architecture-specific inference code (SIMD kernels, NN interpreter dispatch) is externalized into the separately-built `.eim` model binary, which this SDK only invokes as a subprocess. The `.eim` binary's build system is not part of this repository.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Go SDK proper (IPC, capture, ingest logic - this repo) | Scalar, portable Go | Scalar, portable Go | Scalar, portable Go (nothing in this repo blocks a `riscv64` build; Go's toolchain has supported `GOARCH=riscv64` since Go 1.14) |
| Hand-tuned inference kernels (NEON/AVX/etc., inside the `.eim` binary) | Present, externally built by Edge Impulse (`linux-x86` target) | Present, externally built by Edge Impulse (`linux-aarch64` target) | **Missing.** No `TARGET_LINUX_RISCV64` target exists in Edge Impulse's `mks/tflite.mk` build system for the reference C++ inferencing engine |

**Conclusion:** There is no riscv64 "implementation" to grade as complete or stubbed inside this repository, because no architecture (including the working ones) has dedicated code here. The actual blocker sits one layer up: Edge Impulse's proprietary `.eim` model-compilation pipeline, which does not target riscv64.

## 5. Build System, Cross-Compilation, and Toolchain

The repository contains no C/C++/CMake compiled component at all. `go.mod` declares `module github.com/edgeimpulse/linux-sdk-go`, `go 1.15`, with two direct dependencies: `disintegration/imaging` and `fsnotify/fsnotify`.

Verified absent from the repository: `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `CMakeLists.txt`, any `cmake/` directory, any Dockerfile, and any occurrence of "riscv" (case-insensitive, zero matches repo-wide). A recursive grep for `cmake|dockerfile|toolchain|cross-compil|gcc|clang|qemu` matched exactly one unrelated line: a hard-coded `ffmpeg`/`gstreamer` version-string test fixture in `audio/audiocmd/audiocmd_test.go:29` used to unit-test a version parser.

Per the README, the only build instruction is:

```
go build   # Go 1.15+ required, run inside the desired cmd/<example> directory
```

The `.eim` model binary that this SDK executes is fetched separately (`edge-impulse-linux-runner --download modelfile.eim`) from Edge Impulse's cloud build service and is not built by this repo. That binary's build system - CMake, toolchain files, Dockerfiles, QEMU steps - lives in a separate Edge Impulse repository (e.g. `edgeimpulse/example-standalone-inferencing-linux`), whose `Makefile` and `mks/tflite.mk` define static-lib build targets only for `linux-armv7`, `linux-armv7-legacy`, `linux-aarch64`, `linux-x86`, `mac-x86_64`, and `mac-arm64`. A repository-wide `find ... -iname "*riscv*"` in that build system returned zero hits.

**Known build failures:** None documented for this repo (no riscv64 build has ever been attempted). Related upstream toolchain issues surfaced in dependency research (Section 9) include tensorflow/tensorflow#75555, #64987, #47622 concerning riscv64 build support in TensorFlow's own build systems (Bazel/CMake/Make), which would be relevant only if Edge Impulse ever added a `TARGET_LINUX_RISCV64` target.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `go build` of the SDK itself | Works | Works | Expected to work (no architecture-gating code found), but **unverified** - no CI, no report of anyone having tried |
| Ability to download and run a `.eim` model binary | Yes (Edge Impulse builds and hosts `linux-x86` binaries) | Yes (Edge Impulse builds and hosts `linux-aarch64` binaries) | **No.** Edge Impulse does not build or host a riscv64 `.eim` binary; there is no `TARGET_LINUX_RISCV64` build target |
| Audio/image capture example CLIs (`eimaudio`, `eimimage`, etc.) | Functional (depend on system `ffmpeg`/`gstreamer`/`v4l2-ctl`, not architecture-gated) | Functional | Would depend only on system tool availability, not this SDK - unverified |

**Functional gap:** The SDK cannot deliver its core purpose (running an Edge Impulse ML model) on riscv64, because the model binary it depends on is never built for that architecture. This is a total functional gap for the product's primary use case, not a partial one.

**Performance gap:** Not applicable - there is no working riscv64 inference path to benchmark. Data not available: no riscv64 vs arm64/amd64 performance comparison exists for this SDK or its dependent `.eim` binary anywhere searched (GitHub issues/PRs, web search, RISE blog).

**Security hardening gaps:** Data not available: no security-hardening documentation (ASLR, stack protector, CFI) specific to riscv64 was found or searched, since no riscv64 build target exists to harden.

**NaN / floating-point semantics issues:** Data not available: searched GitHub issues in `edgeimpulse/linux-sdk-go` for riscv64 NaN/floating-point correctness bugs (`riscv nan floating repo:edgeimpulse/linux-sdk-go`) - zero results. No such issue has ever been filed, consistent with riscv64 never having been attempted.

## 7. CI/CD Infrastructure

**No CI exists for this repository at all, for any architecture, let alone riscv64.** Verified via direct clone inspection (`origin/master`, HEAD `b89a73e5a1b2ebcc659e7285d9eb1b9d4b55c7e4`, committed 2025-02-10):

- `.github/workflows` does not exist (`find .github` -> "No such file or directory").
- Zero `.yml`/`.yaml` files anywhere in the tracked tree.
- No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.travis.yml`.
- `git ls-files` confirms the complete tracked content: `.gitignore`, `LICENSE`, `README.md`, `go.mod`, `go.sum`, and Go source under `audio/`, `cmd/`, `image/`, `ingest/`, plus a few root `.go` files.

No RISE runners are used (there is no CI to use them in). No RISE working group tracks this project (Section 1).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI exists | No | No | No |
| Test suite run in CI | No | No | No |
| Runner type | N/A | N/A | N/A |
| RISE runner usage | N/A | N/A | N/A |

## 8. Distribution and Release Status

**No official binaries exist for any architecture.** The upstream GitHub repository has published **zero releases** ("There aren't any releases here", per direct fetch of the [releases page](https://github.com/edgeimpulse/linux-sdk-go/releases)).

Checked and confirmed absent for riscv64 (and, since no releases exist, effectively for every architecture):

- **PyPI:** `https://pypi.org/pypi/edge-impulse-linux-sdk-(go)/json` -> HTTP 404 (expected; this is a Go module, not distributed via PyPI).
- **RISE PyPI wheel-builder mirror:** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-linux-sdk-(go)/` -> redirects to pypi.org, which also 404s.
- **Ubuntu packages (resolute/26.04):** [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=edge-impulse-linux-sdk-go&suite=resolute&searchon=names&section=all) -> "Sorry, your search gave no results."
- **archriscv (Arch Linux RISC-V port):** [archriscv.felixc.at search](https://archriscv.felixc.at/?q=edge%20impulse%20linux%20sdk%20(go)) -> no matching package.
- **Project graph SPARQL query** against Ubuntu 26.04 (resolute) riscv64 binary packages for the name variants "edge impulse linux sdk (go)", "python3-edge-impulse-linux-sdk-(go)", "libedge-impulse-linux-sdk-(go)" -> empty result set (`{"results":{"bindings":[]}}`).

**What a user must do to get a working binary today:** The SDK itself (`go build`) can likely be compiled for riscv64 with the standard Go toolchain (`GOARCH=riscv64 go build`), since no architecture-gating code exists in this repo (Section 4) - but this is unverified, as no one appears to have tried it (zero related issues, zero CI). However, the SDK is non-functional without a `.eim` model binary, and Edge Impulse does not build or distribute one for riscv64 through any documented channel. There is currently no path for a riscv64 user to obtain a working `.eim` binary short of a from-scratch port of Edge Impulse's proprietary build tooling (Section 5).

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| `disintegration/imaging` v1.6.2 | image resize/decode (pure Go) | Builds under `GOARCH=riscv64` (pure Go, no native code) | n/a | n/a | No blocking issues found |
| `fsnotify/fsnotify` v1.4.9 | inotify wrapper via `golang.org/x/sys` | `golang.org/x/sys` ships native riscv64 build tags (`zsysnum_linux_riscv64.go` etc.) | n/a | n/a | No blocking issues found |
| **TensorFlow Lite** (full runtime, inside the separate `.eim` build) | NN interpreter/executor | Ubuntu 26.04 riscv64 packages exist (`libtensorflow-lite2.14.1`), but Edge Impulse's own build has no `linux-riscv64` target | Not testable - Edge Impulse never builds it | Not released for riscv64 by Edge Impulse | tensorflow/tensorflow#75555, #64987, #47622; community port PR #45844 (merge status unclear) |
| **XNNPACK** | SIMD-optimized NN kernels | Ubuntu 26.04 riscv64 packages exist (`libxnnpack0`) | - | - | google/XNNPACK#4650 (riscv64 cross-compile issue, appears resolved upstream given Ubuntu now ships a package) |
| **ruy** | matrix-multiply backend | Ubuntu 26.04 riscv64 packages exist (`libruy-dev`) | - | - | None found |
| **cpuinfo** | CPU feature detection for XNNPACK/ruy/pthreadpool | Ubuntu 26.04 riscv64 packages exist | - | - | pytorch/cpuinfo#148 added `sys_riscv_hwprobe` support |
| **pthreadpool** | threading backend | Ubuntu 26.04 riscv64 packages exist | - | - | None found |
| **farmhash** | tensor/op hashing | Ubuntu 26.04 riscv64 packages exist | - | - | None found |
| **FlatBuffers** | TFLite model serialization | Ubuntu 26.04 riscv64 packages exist; see [flatbuffers.md](../flatbuffers.md) | - | - | google/flatbuffers#7297 (toolchain-level cross-compile issue) |
| **CMSIS-DSP** (vendored) | SIMD windowing/FFT/matrix math for DSP blocks | Not packaged (Arm-only by design); see [edge-impulse-sdk-open-cmsis-pack.md](../edge-impulse-sdk-open-cmsis-pack.md) (Readiness: grey) | None | None | Architecturally out of scope - Arm-only, not merely unported |
| **kissfft** (vendored) | portable FFT (MFCC/spectrogram) | Ubuntu 26.04 riscv64 packages exist | - | - | None found |
| **libjpeg-turbo** | camera-app JPEG decode | Ubuntu 26.04 riscv64 packages exist; see [libjpeg-turbo.md](../libjpeg-turbo.md) | - | - | None found |
| **OpenCV** | image capture/processing (camera app) | Ubuntu 26.04 riscv64 packages exist (full 4.10 set) | - | - | None found |
| **TensorFlow Lite Micro (TFLM)** | reduced NN runtime fallback | Not distro-packaged (source build); see [tensorflow-lite-micro-(tflm).md](../tensorflow-lite-micro-(tflm).md) (Readiness: orange) | Tier 2, `riscv32_generic` reference kernels only - riscv64 not targeted | - | tflite-micro#3107 ("riscv64 support offer") closed stale after 8 months |
| ONNX Runtime | checked, not linked into the reference build | Ubuntu 26.04 riscv64 packages exist but not wired into Edge Impulse's Makefile | n/a | n/a | Not an actual dependency of this SDK's inference path today |
| zlib | checked, likely transitive only | Ubuntu 26.04 riscv64 packages exist | - | - | Not directly linked by the runner Makefile per available evidence |

**Deep-dive conclusion:** The individual native building blocks that Edge Impulse's `.eim` binary would need (TensorFlow Lite, XNNPACK, ruy, cpuinfo, pthreadpool, farmhash, FlatBuffers, kissfft, libjpeg-turbo, OpenCV, zlib) are **already packaged for riscv64 in Ubuntu 26.04**. The gap is specifically Edge Impulse's own vendored/prebuilt-static-lib distribution pipeline never having added a riscv64 target to `mks/tflite.mk` - a scoped, tractable porting task rather than an upstream-library blocker. CMSIS-DSP is the one genuine architectural exception, being Arm-only by design.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-related issues exist | n/a | n/a | Confirmed via `mcp__github__search_issues` (query `riscv`, repo `edgeimpulse/linux-sdk-go`) -> `total_count: 0`. The repository has 0 open issues of any kind. |

No correctness bugs, NaN/floating-point issues, or performance bug reports exist for this SDK on any platform, riscv64 or otherwise, in any source searched (GitHub issues/PRs/commits, web search, RISE blog).

## 12. Objections and Upstream Blockers

**Stated objections:** None found. RISC-V has never been discussed by Edge Impulse in this repository, its documentation, or any public channel searched.

**Technical blockers:**
1. Edge Impulse's proprietary `.eim` build pipeline (`mks/tflite.mk` in `edgeimpulse/example-standalone-inferencing-linux`) has no `TARGET_LINUX_RISCV64` target. This is the primary, concrete blocker.
2. CMSIS-DSP, used for DSP blocks in some pipelines, is Arm-only by design and would need a riscv64-appropriate substitute or an architectural bypass (see [edge-impulse-sdk-open-cmsis-pack.md](../edge-impulse-sdk-open-cmsis-pack.md)).
3. This Go SDK repository itself has no known technical blocker - it is architecture-neutral Go with no build-tag or cgo gating.

**Organizational blockers:** Edge Impulse is a commercial company with no stated public roadmap for RISC-V support, no RISE membership, and no community pressure evidenced (0 open issues in this repo, no riscv64 issues filed in any Edge Impulse repo checked).

**Acceptance probability:** Data not available for a quantified estimate. Qualitatively: low near-term probability absent a customer-driven or RISE-driven push, given zero prior RISC-V activity across the entire Edge Impulse GitHub organization footprint checked (`linux-sdk-go`, `example-standalone-inferencing-linux`, `edge-impulse-sdk-pack`) and no RISE engagement found.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Justification:** No upstream CI exists for this repository at all (no `.github/workflows`, no alternative CI config of any kind), confirmed by direct clone inspection of [edgeimpulse/linux-sdk-go](https://github.com/edgeimpulse/linux-sdk-go) at HEAD `b89a73e5`. The repository has published zero GitHub releases for any architecture ("There aren't any releases here", [releases page](https://github.com/edgeimpulse/linux-sdk-go/releases)), and no distribution floor applies because no Linux distribution, PyPI mirror, or RISE wheel builder ships a riscv64 package for this project (Ubuntu 26.04 search, archriscv search, and a project-graph SPARQL query all returned empty). This matches the Step 1 "orange = no upstream CI" row of the color model; it does not qualify for the grey "unknown" case because the absence is confirmed across every channel checked, not merely unresearched.
- **Optimization-purpose modifier:** Not applicable. This SDK is a general-purpose IPC client, not a project whose stated purpose is to outperform a reference implementation via architecture-specific optimization; the actual optimization-purpose code (inference kernels) lives in Edge Impulse's separate, proprietary `.eim` build pipeline, which is out of scope for this repository's grading.
- **Pending work that could change the grade:** None identified. No open PR, no open issue, and no RISE working group or blog post references this project (Section 1, Section 12). A grade change would require either (a) Edge Impulse adding a `TARGET_LINUX_RISCV64` target to its `.eim` build system and shipping riscv64 model binaries, or (b) the Go SDK repository itself gaining CI (even without the `.eim` binary being portable, CI proving `go build` succeeds under `GOARCH=riscv64` would be a first step, though it alone would not resolve the functional gap in Section 6).

## 14. Investment Analysis

**RISE prior work check:** No RISE involvement of any kind was found for this project (Section 1) - no funded RP-numbered project, no working group repository reference, no blog post, no CI runner usage in the "six weeks in" RISE runner usage report (which lists llama.cpp, PyTorch, mldsa-native/mlkem-native, k0s, Kairos, NumPy, armbian/os, wazero, pyca cryptography, kubetail, DuckDB as top users - Edge Impulse is not among them). None of the work below is already covered by RISE.

### 14.1 Functional Enablement

The primary blocker is not in this Go SDK repository but in Edge Impulse's separate `.eim` build pipeline (`example-standalone-inferencing-linux`). Enabling functional riscv64 support requires: (a) adding a `TARGET_LINUX_RISCV64` target to `mks/tflite.mk`, linking against the riscv64 builds of TensorFlow Lite, XNNPACK, ruy, cpuinfo, pthreadpool, farmhash, and FlatBuffers that already exist in Ubuntu 26.04 (Section 9); (b) resolving or working around the CMSIS-DSP Arm-only dependency for DSP-block pipelines; (c) validating the Go SDK itself builds and runs correctly under `GOARCH=riscv64` (expected to be low-effort given no architecture-gating code exists, Section 4).

### 14.2 Performance Optimization

Not applicable at this stage - there is no functional riscv64 inference path to optimize. Once functional enablement lands, performance work would focus on ensuring the linked TFLite/XNNPACK/ruy riscv64 builds use RVV where available, mirroring the NEON/AVX tuning already present for arm64/amd64.

### 14.3 CI/CD Infrastructure

This repository has no CI of any kind for any architecture. Establishing basic CI (even amd64/arm64-only) would be a prerequisite before adding riscv64 coverage, since there is currently no CI infrastructure to extend.

### 14.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale below.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `TARGET_LINUX_RISCV64` target to Edge Impulse's `.eim` build pipeline (`mks/tflite.mk`), linking existing riscv64 packages for TensorFlow Lite, XNNPACK, ruy, cpuinfo, pthreadpool, farmhash, FlatBuffers | 2-4 [NEEDS VERIFICATION - no comparable port effort documented to calibrate against] | Edge Impulse | Medium |
| Functional | Resolve CMSIS-DSP Arm-only dependency for DSP-block pipelines (substitute or bypass) | 1-2 [NEEDS VERIFICATION] | Edge Impulse | Medium |
| Functional | Validate `linux-sdk-go` builds and runs under `GOARCH=riscv64` | <1 | Edge Impulse or third party | Low |
| CI/CD | Stand up basic CI for `linux-sdk-go` (currently none exists for any architecture) | 1 | Edge Impulse | Low |
| CI/CD | Add riscv64 build+test job once functional enablement lands, potentially using RISE RISC-V runners | 1 | Edge Impulse / RISE | Low |

Effort estimates above are rough order-of-magnitude and marked [NEEDS VERIFICATION] where no comparable Edge Impulse porting effort exists to calibrate against; they should be validated against actual Edge Impulse build-engineering estimates before being used for planning.

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [Edge Impulse Linux SDK (Go) - GitHub repository](https://github.com/edgeimpulse/linux-sdk-go)
- [Edge Impulse Linux SDK (Go) - releases page](https://github.com/edgeimpulse/linux-sdk-go/releases)
- [Edge Impulse Linux SDK (Go) - official documentation](https://docs.edgeimpulse.com/docs/tools/edge-impulse-for-linux/linux-go-sdk)
- [Edge Impulse Edge AI hardware documentation](https://docs.edgeimpulse.com/docs/edge-ai-hardware/edge-ai-hardware)
- [edgeimpulse/example-standalone-inferencing-linux](https://github.com/edgeimpulse/example-standalone-inferencing-linux)
- [PyPI JSON API - edge-impulse-linux-sdk-(go)](https://pypi.org/pypi/edge-impulse-linux-sdk-(go)/json)
- [RISE PyPI wheel builder mirror](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/edge-impulse-linux-sdk-(go)/)
- [Ubuntu packages search (resolute suite)](https://packages.ubuntu.com/search?keywords=edge-impulse-linux-sdk-go&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/?q=edge%20impulse%20linux%20sdk%20(go))
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project homepage / members](https://riseproject.dev)
- [RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/) [NEEDS VERIFICATION - exact URL slug not confirmed in findings]
- [tensorflow/tensorflow#75555 - riscv64 platform build issue](https://github.com/tensorflow/tensorflow/issues/75555)
- [tensorflow/tensorflow#64987 - CMake/cpuinfo missing sys/hwprobe.h](https://github.com/tensorflow/tensorflow/issues/64987)
- [tensorflow/tensorflow#47622 - Make riscv target silently builds x86_64](https://github.com/tensorflow/tensorflow/issues/47622)
- [tensorflow/tensorflow PR #45844 - community riscv64 Linux port](https://github.com/tensorflow/tensorflow/pull/45844)
- [google/XNNPACK#4650 - riscv64 cross-compile cpuinfo error](https://github.com/google/XNNPACK/issues/4650)
- [pytorch/cpuinfo#148 - sys_riscv_hwprobe support](https://github.com/pytorch/cpuinfo/issues/148)
- [google/flatbuffers#7297 - cross-compile Exec format error](https://github.com/google/flatbuffers/issues/7297)
- [tflite-micro#3107 - riscv64 support offer, closed stale](https://github.com/tensorflow/tflite-micro/issues/3107)
- Related in-repo status reports: [edge-impulse-sdk-open-cmsis-pack.md](../edge-impulse-sdk-open-cmsis-pack.md), [tensorflow-lite-micro-(tflm).md](../tensorflow-lite-micro-(tflm).md), [flatbuffers.md](../flatbuffers.md), [libjpeg-turbo.md](../libjpeg-turbo.md), [zlib.md](../zlib.md), [onnx.md](../onnx.md)
