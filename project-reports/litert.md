---
title: LiteRT
parent: Project Reports
color: yellow
dependencies:
  - name: TensorFlow
    relation: runtime-dependency
    criticality: critical
  - name: XNNPACK
    relation: runtime-dependency
    criticality: critical
  - name: cpuinfo
    relation: runtime-dependency
    criticality: critical
  - name: Abseil
    relation: runtime-dependency
    criticality: critical
  - name: FlatBuffers
    relation: runtime-dependency
    criticality: critical
  - name: ruy
    relation: runtime-dependency
    criticality: optional
  - name: Eigen
    relation: runtime-dependency
    criticality: optional
  - name: gemmlowp
    relation: runtime-dependency
    criticality: optional
  - name: farmhash
    relation: runtime-dependency
    criticality: optional
  - name: sentencepiece
    relation: runtime-dependency
    criticality: optional
  - name: Bazel
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="litert" %}

# LiteRT

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for LiteRT<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

LiteRT is the on-device ML inference runtime produced by Google AI Edge. It was announced on September 4, 2024 as a rename and rebrand of TensorFlow Lite (TFLite), which Google first shipped in 2017. The rebrand reflects a stated multi-framework vision: LiteRT accepts models from PyTorch, JAX, and Keras in addition to TensorFlow. The project lives at [google-ai-edge/LiteRT](https://github.com/google-ai-edge/LiteRT) and is documented at [ai.google.dev/edge/litert](https://ai.google.dev/edge/litert) (which redirects to developers.google.com/edge/litert).

Governance is unilateral-vendor, not foundation-based. Per the repository's `GOVERNANCE.md`: "Google retains final authority over the project's technical direction, roadmap, release policies, and governance." The structure is Project Leads (appointed by Google) over Maintainers (appointed by Project Leads, listed via CODEOWNERS) over Contributors (PRs under Google CLA). No community elections or binding votes exist, and maintainer status "may be modified or revoked by project leads at any time." Governance scope covers five repositories: LiteRT, litert-torch, LiteRT-LM, LiteRT-CLI, and litert-samples. `.github/CODEOWNERS` designates a single private team, `@google-ai-edge/litert-leads`, as "the repository's currently appointed core maintainers." No `MAINTAINERS`, `OWNERS`, or multi-company maintainer file exists; this is effectively single-vendor governance, not a multi-stakeholder project. License is Apache 2.0.

Hardware-vendor NPU acceleration contributions (drivers/SDKs, not core governance) are referenced in the `litert/vendors/` tree for Qualcomm, MediaTek, Google Tensor, Samsung S.LSI, Intel OpenVINO, and Broadcom [NEEDS VERIFICATION: vendor tier/status details not independently re-confirmed in current-session research].

LiteRT is not a member project of the [RISE Project](https://riseproject.dev). RISE's member roster lists Google LLC as a Premier Member alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent, but RISE membership is corporate, not project-specific: neither LiteRT, TensorFlow Lite, nor Google AI Edge appears as a named RISE member project, and no RISE blog post (all posts reviewed, May 2024 through July 2026) mentions LiteRT. There is no visible community process for proposing new-platform ports (no RFC mechanism, no binding vote); any RISC-V port decision rests solely with Google's appointed project leads.

## 2. Port History and Upstreaming Timeline

There is no port history inside `google-ai-edge/LiteRT`. Exhaustive searching (GitHub `search_issues`, `search_pull_requests`, `search_code`, `search_commits` for "riscv", "riscv64", "RVV", "RISC-V", "rv64gcv", "riscv_zvfh", repeated across multiple independent verification passes) found zero genuine RISC-V issue, PR, or tracking item. The string "riscv" does not appear in any issue title, PR title, commit message, CMakeLists.txt, Bazel BUILD file, or CI workflow file.

Search hits that superficially matched are all false positives:

| Item | Date | What it actually is |
|---|---|---|
| [Issue #37](https://github.com/google-ai-edge/LiteRT/issues/37) | [NEEDS VERIFICATION: exact date not captured] | Python wheel generation failure for ARMv7l 32-bit (`undefined symbol: TfLiteXNNPackDelegateOptionsDefault`), closed. No RISC-V content. |
| [Issue #177](https://github.com/google-ai-edge/LiteRT/issues/177) | closed, `state_reason: completed` | "Enabling XNNPACK with Raspberry Pi Zero/W." Matches only because the pasted build log lists XNNPACK's own `-DXNN_ENABLE_RISCV_VECTOR=1` CMake flag among dozens of unrelated `-DXNN_ENABLE_ARM_*` flags. The actual bug is an ARMv6 assembler failure (`vsdot.s8` unsupported in ARM mode). |
| [Issue #6777](https://github.com/google-ai-edge/LiteRT/issues/6777) | opened 2026-04-08, closed 2026-04-15 | Semantic search matched "riscv64," but it is an aarch64/ARM SIGILL crash report on Raspberry Pi 4B. Not RISC-V. |
| [PR #6641](https://github.com/google-ai-edge/LiteRT/pull/6641) | merged 2026-03-30 (`0fce70d3`), first in v2.1.4 | "Update XNNPACK in tensorflow/xla" - routine vendored-dependency bump. |
| [PR #7432](https://github.com/google-ai-edge/LiteRT/pull/7432) | merged 2026-05-18 (`57f0236b`), first in v2.1.5 | Same class: routine XNNPACK/XLA vendor bump. |
| [PR #7623](https://github.com/google-ai-edge/LiteRT/pull/7623) | merged 2026-06-02 (`19a233dd`), first in v2.1.5 | Same class: routine XNNPACK/XLA vendor bump. |
| [PR #8765](https://github.com/google-ai-edge/LiteRT/pull/8765) | merged 2026-07-20 (`9626c175`), first in v2.2.0 | "Update XNNPACK and related dependencies," authored by Dillon Sharlet (Google) via copybara-service[bot]. Matches only because its auto-generated body quotes upstream XNNPACK/cpuinfo submodule changelog text, which happens to include third-party commits such as pytorch/cpuinfo's "Add riscv half-precision floating point detection (#375)" (Ken Unger) and an XNNPACK "[RVV] add rvv f32 kernel for ppmm" commit by a non-Google contributor. None of these are LiteRT-authored RISC-V changes, and PR #8765 does not touch `.github/workflows/`. |

All four PRs above were independently re-verified as genuinely merged (not merely closed) via direct page fetch, merge-commit page, and `.patch` header `Date:` cross-check, since the original search result table had left their status ambiguous.

The only authentic RISC-V-aware content anywhere in the repository is a three-line compiler feature-detection guard in `tflite/types/half.h`:

```c
#if defined(__riscv) && defined(__riscv_zvfh) && __clang__ >= 1600
#define TFLITE_ARCH_FLOAT16 1
#endif
```

This checks for the RVV `Zvfh` half-precision extension to decide whether to use a native `_Float16` type; it has no associated issue or PR, gates no kernel, and was not authored as part of any RISC-V enablement effort.

The genuine RISC-V porting activity for LiteRT happens entirely outside this repository, in the third-party community fork [rv2036/rvspoc-S2602-litert](https://github.com/rv2036/rvspoc-S2602-litert), a submission ("S2601"/"S2602") to RVSPOC (RISC-V Software Porting and Optimization Championship), organized by Kubuds Technology / Sophgo / RISC-V China Community / PLCT Lab (Institute of Software, Chinese Academy of Sciences) - see [rvspoc.org](https://rvspoc.org/en/). This is a separate organization from the Linux Foundation's RISE Project; no source links the two. Contributors include `liuyd-dev`, `jiegegena`, `any-leap`, `carlosqwqqwq`, and `xiazhuozhao`. This fork has never been merged or cross-referenced into `google-ai-edge/LiteRT`.

Separately, and outside `google-ai-edge/LiteRT`'s own tracker, the RISE-affiliated [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels) repository merged [PR #2135](https://github.com/riseproject-dev/python-wheels/pull/2135), "ai-edge-litert: Add version 2.2.0," authored by `luhenry`, on 2026-09-21 (13 passing checks). This builds the unmodified upstream LiteRT source with Bazel for riscv64 and publishes working wheels; see Sections 5, 8, 9, and 13 for detail. This is a downstream packaging contribution to a RISE community wheel-building project, not a change landed in google-ai-edge/LiteRT itself, and it is not documented anywhere on the RISE blog, in the `wheel_builder` package list, or in the `python-wheels-dashboard` top-360-downloads view.

**Timeline summary:** No RISC-V code has ever entered google-ai-edge/LiteRT. The first (and to date only) working riscv64 artifact for LiteRT exists because a third party (RISE's python-wheels project) builds the unmodified upstream source externally.

## 3. Upstream Support Tier

LiteRT has no formal tiered architecture policy. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists in the repository (all searches returned zero results). Supported platforms are enumerated by name only in developer documentation: Android (API 24+), iOS 15+/macOS 12+, Web, Linux/macOS/Windows desktop, and embedded/IoT/microcontrollers. RISC-V does not appear in this list under any tier designation (no "provisional," "community," or "best-effort" category exists for it to occupy - the list is binary: named platforms, and everything else unsupported).

| | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| Listed in official docs | Yes | Yes | No |
| CI-gated | Yes | Yes | No |
| Official binaries | Yes (PyPI, GitHub Releases) | Yes (PyPI, GitHub Releases) | No (upstream); Yes via RISE (Section 8) |
| Support tier | Primary | Primary | None (unrecognized target) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

LiteRT's CPU execution has three kernel modes: `xnnpack` (default), `builtin`, and `reference`. Architecture-specific SIMD optimization splits between LiteRT-internal kernel code and the externally vendored XNNPACK library.

**LiteRT-internal SIMD kernels (`tflite/kernels/internal/optimized/`):** dispatch uses `NEON_OR_PORTABLE()` (NEON on ARM, portable scalar C elsewhere) and `SSE_OR_PORTABLE()` (SSE on SSSE3-capable x86, portable scalar elsewhere). RISC-V hits the portable scalar path on every dispatch, because no `RVV_OR_PORTABLE()` equivalent, and no riscv64 branch, exists.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Tensor-utility SIMD kernels | `sse_tensor_utils.{cc,h,impl.h}`, `sse_check.h` (SSE/SSSE3 intrinsics) | `neon_tensor_utils.{cc,h,impl.h}`, `neon_check.h` (NEON intrinsics) | 0 files - scalar fallback |
| AVX2 quantization | `avx2_quantization_utils.h` | n/a | n/a |
| 4-bit fully connected | `sse_fully_connected.{cc,h,impl.h}` | `neon_fully_connected_aarch64_{sdot,nosdot}.cc`, `neon_fully_connected_arm32_{sdot,nosdot}.cc` | 0 files - `fully_connected_reference.{cc,h,impl.h}` scalar path only |
| Depthwise conv 3x3 fast path | none dedicated | `depthwiseconv_3x3_filter_common.h` and related NEON headers, with LUT intrinsic polyfills | none |
| Runtime CPU-feature detection | none found | `cpu_check.cc` (getauxval/sys/auxv.h dot-product detection) | none |
| Hand-written assembly (`.s`/`.S`) | 0 files for any arch | 0 files for any arch | 0 files |

Independent re-verification (fresh clone, `grep -rniI "riscv"` repo-wide, plus targeted `__riscv`, `rvv`, `__riscv_v`, `__aarch64__`, `__x86_64__` code searches) confirms: zero RVV intrinsic types (`vfloat32m1_t` or equivalent) anywhere in the tree, no `arch/riscv/` directory, no RISC-V JIT backend, no RVV dispatch path, and no Zba/Zbb/Zbc extension usage. The riscv64 column is not a stub (no placeholder function bodies, no TODO markers gating a future implementation) - it is a complete absence; RISC-V simply falls through to the same portable scalar code written for any unrecognized architecture.

**XNNPACK CPU backend:** when `TFLITE_ENABLE_XNNPACK=ON` (the default), XNNPACK handles most compute-intensive ops. XNNPACK's own upstream has real RVV microkernels (RV32GC/RV64GC) and a dedicated `cmake-linux-riscv64` CI job (see Section 9), but LiteRT's build system does not expose any riscv64-specific config path to reach it - there is no LiteRT-level riscv64 CMake preset or Bazel `config_setting`. RISE's PR #2135 (Section 5) reaches XNNPACK's riscv64 support by building unmodified upstream LiteRT with Bazel and disabling one feature flag (`xnn_enable_riscv_fp16_vector`); it does not add any LiteRT-side riscv64 kernel code.

**Vendor/NPU acceleration (`litert/vendors/`):** targets Google Tensor, Qualcomm, MediaTek, Samsung S.LSI, Intel OpenVINO, and Broadcom. None target RISC-V CPU execution, and no riscv64 accelerator registry entry exists in `litert/runtime/accelerators/`.

## 5. Build System, Cross-Compilation, and Toolchain

**Bazel:** `litert/BUILD` defines `config_setting` entries for `linux_x86_64`, `linux_aarch64`, and `linux_armhf`. No `linux_riscv64` config_setting exists; riscv64 is not a recognized Bazel target platform in LiteRT's own build graph.

**CMake:** `litert/CMakeLists.txt` normalizes `CMAKE_SYSTEM_PROCESSOR` and applies x86/amd64-specific logic only (disabling KleidiAI). `litert/CMakePresets.json` defines exactly five presets: `default`, `default-debug`, `android-arm64`, `android-arm64-debug`, and `linux-aarch64-oe-gcc11.2` (a Qualcomm OpenEmbedded aarch64 toolchain), plus a generic `custom-toolchain` passthrough that accepts an arbitrary `$LITERT_TOOLCHAIN_FILE`. No riscv64 preset exists. No `cmake/riscv64.cmake` or `cmake/toolchain-riscv64.cmake` file exists anywhere; the only toolchain `.cmake` files in the repo are aarch64-specific (`litert/vendors/qualcomm/toolchain/linux_aarch64_example_toolchain.cmake`, `linux_aarch64_oe_gcc11_2.toolchain.cmake`, `litert/vendors/broadcom/cmake/toolchains.cmake`).

**Toolchain provisioning:** `tflite/tools/cmake/download_toolchains.sh` (legacy TFLite tooling, still vendored) supports only `armhf_vfpv3 | armhf | aarch64 | rpi0` and pins GCC 8.3 (2019.03 Arm GNU toolchain release) for those targets to avoid a known compatibility issue (cites `tensorflow/tensorflow#59631` [NEEDS VERIFICATION: external reference not independently re-checked this session]), while Bazel builds use GCC 11.3 for better FP16/XNNPACK support (cites `tensorflow/tensorflow#57585` [NEEDS VERIFICATION]). No riscv64 option exists in this script.

**Documentation:** `docs/instructions/BUILD_INSTRUCTIONS.md` covers Linux/macOS/Windows/Android only, with no riscv64 cross-compile `--config=` flags (only `macos_arm64`, `macos_x86_64`, `android_arm64`, `windows` exist). `docs/instructions/CMAKE_BUILD_INSTRUCTIONS.md` covers only `default`/`default-debug` and `android-arm64`/`android-arm64-debug` presets plus the generic custom-toolchain path. No `BUILDING.md`, `INSTALL`, or `docs/cross-compilation.md` exists. `docker_build/hermetic_build.Dockerfile` (base `ubuntu:24.04`, Clang 18, Bazel via Bazelisk 1.18.0, Android NDK r28b) has no arch-specific variant; the Bazelisk install script recognized only `x86_64` and `aarch64` [carried from prior research; not independently re-verified this session, NEEDS VERIFICATION]. No QEMU usage exists anywhere in LiteRT's own docs or CI scripts.

**A working build does exist, but it is built and maintained outside google-ai-edge/LiteRT.** RISE's [riseproject-dev/python-wheels PR #2135](https://github.com/riseproject-dev/python-wheels/pull/2135) (merged 2026-09-21) builds `ai-edge-litert` 2.2.0 directly from unmodified upstream LiteRT source, natively on riscv64 hardware via RISE's RISC-V Runners infrastructure, using:

- Bazel 7.5.0, bootstrapped from source (`--noenable_bzlmod`) rather than a prebuilt Bazel binary
- GCC 14 (`TF_NEED_CLANG=0`)
- `--define=xnn_enable_riscv_fp16_vector=false` - the single riscv64-specific build deviation, required because the toolchain's GNU binutils 2.41 rejects the `zvfh` extension at assembly time
- Python cp311 through cp314 (cp310 dropped because `ml_dtypes` has no riscv64 wheel)
- TFLite interpreter, LiteRT v2 C API (`libLiteRt.so`), and pywrap extensions all built and tested via an L2-normalization model on both the TFLite Interpreter and the LiteRT v2 CompiledModel path

Because the only deviation from upstream is a Bazel feature-flag disable (not a source patch to LiteRT), this is an unpatched build of genuine upstream code - it demonstrates that LiteRT compiles cleanly on riscv64 once a suitable Bazel/GCC/binutils toolchain is assembled, with the sole caveat that the `zvfh`-dependent FP16 vector path must currently be disabled at the binutils layer. See Section 9 for the GNU binutils entry and Section 13 for how this bears on the readiness grade.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| SIMD tensor kernels | SSE/SSSE3/AVX2 intrinsics | NEON intrinsics | scalar fallback |
| 4-bit FC / quantized ops | SSE hand-tuned | NEON (4 sdot/nosdot variants) | scalar reference path |
| XNNPACK CPU backend | full, CI-tested | full, CI-tested | upstream XNNPACK has RVV kernels; unreachable through a LiteRT-level riscv64 config, reached only via RISE's downstream Bazel build with FP16-vector disabled |
| LiteRT build-system recognition | yes | yes | no (no CMake preset, no Bazel config_setting) |
| Official binary packages | manylinux x86_64 (PyPI) | manylinux aarch64 (PyPI) | none upstream; RISE-published (Section 8) |
| CI coverage | yes | yes | none |
| Documentation | full | full | none |

The riscv64 gap is both functional (no RVV kernel path in LiteRT's own tensor-utility/4-bit-FC code, one Bazel feature flag disabled in the actually-working RISE build) and evidentiary (no throughput/latency comparison published by Google or LiteRT for riscv64 vs arm64/amd64). Community (non-Google, non-RISE) benchmark data exists and is summarized in Section 11.

## 7. CI/CD Infrastructure

`google-ai-edge/LiteRT` uses GitHub Actions exclusively. All 15 workflow YAML files in `.github/workflows/` (plus one helper script, `auto-assignment.js`) were read in full, independently, in two separate verification passes including a fresh clone and repo-wide `grep -rniI "riscv"`:

`auto-assignment.yml`, `clang_tidy.yml`, `cmake_android_linux_x86_64.yml`, `cmake_source_build_cc_api.yml`, `ios-arm64.yml`, `linux_android.yml`, `linux_nightly_wheel.yml`, `linux_x86_64.yml`, `macos-arm64.yml`, `macos_nightly_wheel.yml`, `mark_stale.yml`, `tflite_bazel_cmake.yml`, `windows_nightly_wheel.yml`, `windows_wheel_release.yml`, `windows_x86_64.yml`.

**Zero matches for "riscv"/"riscv64"/"RISCV" in any workflow file.** No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository. No riscv64 runner, no QEMU-based riscv64 emulation job, no `workflow_dispatch`/label-gated riscv64 build, and no CI trigger of any kind for RISC-V exists.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated workflow(s) | `linux_x86_64.yml`, `windows_x86_64.yml`, `cmake_android_linux_x86_64.yml` | `macos-arm64.yml`, `ios-arm64.yml` | none |
| QEMU used | no | no (native/cross-compile via Android NDK or macOS host) | no |
| Nightly wheel build | yes | yes (macOS) | no (upstream); yes via RISE (downstream, on-demand per release, not nightly) |

The downstream RISE build does have CI: PR #2135 to `riseproject-dev/python-wheels` passed 13 checks before merge, on infrastructure the project's README describes as native riscv64 hardware via the RISE RISC-V Runners service. No RISE blog post documents this specific run, so the exact hardware used for the LiteRT build is [NEEDS VERIFICATION].

Adding riscv64 CI to google-ai-edge/LiteRT itself would require, at minimum: a riscv64 runner (QEMU or native, following XNNPACK's own `cmake-linux-riscv64` pattern), a cross-compilation or native toolchain step, a host-flatc build step, and a binary execution/test harness. No skeleton for any of this exists upstream.

## 8. Distribution and Release Status

**GitHub Releases:** recent tags checked (v2.2.0, v2.1.6, v2.1.5, v2.1.4, v2.1.3). Asset lists (`litert_cc_sdk.zip`, `litert_npu_runtime_libraries.zip`, `litert_npu_runtime_libraries_jit.zip`, plus source archives) carry no per-architecture suffix and no riscv64 asset in any release checked. Direct GitHub-API/raw-content enumeration of asset filenames was blocked by this session's tooling restrictions on this repository; this is a stated tooling gap, not a positive confirmation either way, though nothing in any channel checked supports a riscv64 asset existing.

**PyPI (upstream):** the package name is `ai-edge-litert` (a bare `litert` package does not exist on PyPI - HTTP 404). Full enumeration of `https://pypi.org/pypi/ai-edge-litert/json` (271 wheel/sdist filenames across all releases through 2.2.0) shows platform tags limited to `manylinux_2_17/2_27_x86_64`, `manylinux_2_17/2_27_aarch64`, `macosx_10_15_x86_64`, and `macosx_12_0_arm64`. Zero filenames contain "riscv," for any version, ever.

**Ubuntu 26.04 "resolute":** direct `packages.ubuntu.com` queries for `litert` and `ai-edge-litert` (all architectures, all suites through resolute) return "Sorry, your search gave no results." No `litert`, `python3-litert`, `liblitert`, or `ai-edge-litert` package exists in Ubuntu at all, on any architecture.

**Debian, Arch Linux RISC-V:** no `litert` or `ai-edge-litert` package found on `tracker.debian.org` or the Arch RISC-V port (`archriscv.felixc.at`) [prior-report findings, not independently re-checked this session for Debian; Arch RISC-V absence re-confirmed].

**RISE wheel builder - this is where the picture changes.** The RISE Project (via [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels), a continuation of the earlier `wheel_builder` project) publishes riscv64 Python wheels using its RISE RISC-V Runners infrastructure, to `pypi.riseproject.dev`. [PR #2135](https://github.com/riseproject-dev/python-wheels/pull/2135) ("ai-edge-litert: Add version 2.2.0," author `luhenry`, merged 2026-09-21) built and published a riscv64 wheel for `ai-edge-litert` 2.2.0. Confirmed live on `pypi.riseproject.dev/simple/ai-edge-litert/`: wheels for Python cp311, cp312, cp313, cp314, tagged `manylinux_2_27_riscv64.manylinux_2_39_riscv64`. The release is `ai-edge-litert-v2.2.0-20260921133644` (commit `a1ab30c`, 7 assets). A related package, `mediapipe` (which itself depends on LiteRT), was added in the same project via [PR #2104](https://github.com/riseproject-dev/python-wheels/pull/2104), also by `luhenry`.

This RISE wheel-building activity is not documented in any RISE blog post, is not listed in the older `wheel_builder` package catalog, and does not appear in the `python-wheels-dashboard` top-360-downloads view (that view is limited to the highest-download PyPI packages, and litert falls outside that set) - it is real and live, but effectively undiscoverable through RISE's own public-facing materials.

An independent check of the older RISE wheel-builder GitLab package index (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/litert/` and `.../ai-edge-litert/`) both 302-redirect through to plain PyPI, confirming that specific legacy channel does not carry a riscv64 wheel - the working riscv64 wheel is served only from the newer `pypi.riseproject.dev` index built by the `python-wheels` GitHub project, not the legacy GitLab `wheel_builder`.

**Summary:** no official Google-published, PyPI-default, or mainstream-distro riscv64 binary exists for LiteRT/ai-edge-litert. A working riscv64 wheel does exist and is actively maintained, but only through RISE's independent `python-wheels` project and its own package index (`pypi.riseproject.dev`), not through `pypi.org`. A user today gets a working riscv64 `ai-edge-litert` by pointing pip at `pypi.riseproject.dev` rather than by building from source.

## 9. Dependencies

The table below covers every direct dependency plus indirect/recursed dependencies identified through the XNNPACK/cpuinfo/Ruy build chain. Name spellings match the project's canonical dependency list exactly.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues / Notes |
|---|---|---|---|---|---|
| **TensorFlow** (runtime-dependency, critical) | Core runtime; LiteRT is a TFLite/TensorFlow rebrand, pulled as a submodule dependency | Builds via CMake/Bazel with effort; native riscv64 build reported functional in community issues [NEEDS VERIFICATION, single source: prior report only, not re-confirmed by current-session research] | Not run on riscv64 in upstream TF CI (x86_64/aarch64 only) | No riscv64 wheel on PyPI | [tensorflow/tensorflow#102159](https://github.com/tensorflow/tensorflow/issues/102159) and [#100940](https://github.com/tensorflow/tensorflow/issues/100940), both reported open in the prior version of this report; not independently re-verified this session - [NEEDS VERIFICATION] |
| **XNNPACK** (runtime-dependency, critical) | Primary SIMD CPU inference-kernel backend; closest thing to a JIT/dispatch backend in this stack | Dedicated `cmake-linux-riscv64` CI job exists upstream; 300+ RISC-V source files; README lists RV32GC/RV64GC as supported | QEMU-emulated only, no native-hardware runner; operator tests unconditionally excluded from CI; currently red - 100+ RVV FP16 dispatch test failures | No GitHub binary releases (source-only); Debian sid carries an 18+ month stale debports riscv64 snapshot | [google/XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886) (open): 100+ RVV FP16 failures, root cause is `xnn_arch_riscv_vector_fp16_arith` being set unconditionally without a working `cpuinfo_has_riscv_zvfh()` guard. [#4650](https://github.com/google/XNNPACK/issues/4650) (open 3+ years): `syscall` undeclared under strict C99/Clang, breaks cross-compile |
| **cpuinfo** (runtime-dependency, critical) | CPU feature/ISA detection consumed by XNNPACK and Ruy to select dispatch paths | Builds via QEMU + cross-compile in CI; builds cleanly | Build-only in CI, no tests executed on riscv64 | No GitHub releases (source-only); Debian sid snapshot is stale | Contradictory data across sources on the tracking PR number: the readiness-grade justification and one research pass cite [pytorch/cpuinfo#124](https://github.com/pytorch/cpuinfo/issues/124) (open since December 2022) plus [PR #148](https://github.com/pytorch/cpuinfo/pull/148) (open since May 2023, unmerged 3+ years) as the item needed to add `cpuinfo_has_riscv_zvfh()`/uarch detection; a separate research pass instead names an "open, unreviewed PR #397" for the same uarch/cache/vendor-detection gap. Both cite the same underlying defect (incomplete riscv64 uarch/cache/ISA detection); the PR number is unresolved between sources and should be confirmed directly against the cpuinfo repository before citing a specific number externally |
| **Abseil** (runtime-dependency, critical) | C++ utilities (strings, hashing, synchronization, status, span, flags), used pervasively | Reported as mostly functional in the prior version of this report | riscv64 not a CI target upstream [NEEDS VERIFICATION] | Header + source only, no binary releases | [abseil/abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702), [#2002](https://github.com/abseil/abseil-cpp/issues/2002), [#1236](https://github.com/abseil/abseil-cpp/issues/1236), and [PR #1986](https://github.com/abseil/abseil-cpp/pull/1986) were reported open by the prior version of this report (link/test failures and missing Zbc CRC32C acceleration on riscv64); none were independently re-verified in this session's research - [NEEDS VERIFICATION, single source] |
| **FlatBuffers** (runtime-dependency, critical) | Serialization format for `.tflite`/model files | Architecture-agnostic serialization; builds on any target per prior report | No riscv64 CI; no known blocking test failures | No riscv64-specific binary releases; consumed as source | No known blocking issues identified in current or prior research |
| **ruy** (runtime-dependency, optional) | Quantized (int8) and float matmul backend | Builds as plain C++ via generic scalar (`kStandardCpp`) fallback; `platform.h` defines arch macros for x86/ARM-32/ARM-64/PowerPC only, none for RISC-V | No upstream CI for any architecture | No GitHub releases (source-only, empty releases page); Debian/Ubuntu ship source-derived riscv64 binaries where packaged | No RISC-V-specific blocker; correctness is fine via the scalar path, but there is no SIMD/RVV kernel, so performance is unmeasured - superseded by XNNPACK for most ops |
| **Eigen** (runtime-dependency, optional) | Dense linear-algebra template library, `find_package(Eigen3 REQUIRED)` in `litert/CMakeLists.txt` and `tflite/CMakeLists.txt` | GitLab CI builds riscv64 with `allow_failure: true`; RVV vectorization backend exists only on `master` | Test jobs are non-blocking; RVV CI was silently broken Nov 2025-Jun 2026 (wrong `-mrvv-vector-bits` flag), fixed in MR !2658 | RVV support has not shipped in any tagged release (5.0.1, 5.0.0, 3.4.x all predate or lack it); must build from `master` with `-DEIGEN_RISCV64_USE_RVV10` | Historical heap-corruption bug under RVV (#2930, closed within 4 days); open issue for masked partial-packet tails missing on RVV (#3086). Header-only, so the missing tagged-release RVV support is a performance gap, not a correctness blocker for the base library |
| **gemmlowp** (runtime-dependency, optional) | Low-precision (int8) GEMM library, legacy numerics backend still vendored | Architecture-agnostic C++, scalar-only for RISC-V (and most non-ARM/x86 targets); no upstream CI for any arch | No riscv64 CI | No GitHub releases | No riscv64 issues found in the gemmlowp tracker at all (absence of issues, not confirmation of correctness); project is in low-activity maintenance mode |
| **farmhash** (runtime-dependency, optional) | Non-cryptographic hashing for internal tensor/op-name hashing | No upstream CI; portable scalar fallback (no SIMD path exists for non-x86 architectures at all) | No CI, no tests upstream | No GitHub releases; Debian sid / Ubuntu universe carry a source build | None open specifically for riscv64; last algorithmic commit predates 2020 |
| **sentencepiece** (runtime-dependency, optional) | Tokenizer for LLM-adjacent use cases | Builds; prior report cites a merged PR adding riscv64 to the Linux wheel build matrix [NEEDS VERIFICATION, not re-confirmed this session] | No standalone riscv64 CI | Prior report states a PyPI riscv64 wheel exists but a user-filed issue suggests discoverability is poor [NEEDS VERIFICATION] | Prior-report-only data; treat cautiously until re-verified |
| **Bazel** (build-dependency, critical) | Primary build system for LiteRT | RISE's working riscv64 build bootstraps Bazel 7.5.0 from source rather than installing a prebuilt binary, consistent with no official riscv64 Bazel release binary being used | Not independently researched | Data not available: Bazel's own upstream riscv64 CI/release policy was not directly searched this session | None identified; the bootstrap-from-source step itself was not reported as a blocker in PR #2135 |
| **CMake** (build-dependency, critical) | Secondary/alternate build system for LiteRT (`litert/CMakeLists.txt`, `tflite/CMakeLists.txt`) | Data not available: CMake's own riscv64 packaging/build status was not researched this session | Data not available | Data not available | None identified in LiteRT-specific research; LiteRT's own CMake presets have no riscv64 entry regardless of CMake's own platform support (Section 5) |
| **GCC** (build-dependency, critical) | Compiler used for the only confirmed-working riscv64 LiteRT build | GCC 14 used successfully in RISE's PR #2135 build (`TF_NEED_CLANG=0`); LiteRT's legacy toolchain script pins GCC 8.3 for ARM targets only, Bazel builds elsewhere use GCC 11.3 - neither pin is riscv64-specific | Not independently researched beyond the successful RISE build | Not applicable (system compiler) | None identified for GCC itself; see GNU binutils below for the actual riscv64-specific build constraint encountered |
| **GNU binutils** (build-dependency, critical) | Assembler/linker toolchain paired with GCC in the RISE build | binutils 2.41 (the version used in RISE's build environment) rejects the `zvfh` RVV extension at assembly time | Not applicable | Not applicable | This is the direct, named cause of RISE disabling `--define=xnn_enable_riscv_fp16_vector=false` in PR #2135 - the single riscv64-specific build deviation from unmodified upstream LiteRT source. A newer binutils release that accepts `zvfh` would be a prerequisite to re-enabling the FP16 vector path in the RISE build |
| **LLVM** (build-dependency, optional) | Alternate/host compiler; `llvm-18`/`clang-18` specified in `BUILD_INSTRUCTIONS.md` for the generic Linux host build | Data not available: no riscv64-specific LLVM/Clang toolchain testing was found in this research; the documented llvm-18/clang-18 requirement is for the generic (non-riscv64) host build path | Data not available | Data not available | None identified; not used in the one confirmed-working riscv64 build (which used GCC) |
| **pthreadpool** (indirect, via XNNPACK) | Thread pool parallelizing XNNPACK kernel execution across cores | Not independently verified upstream; no riscv64 issues found via search | Not verified - zero riscv64-tagged issues found | No GitHub releases; Ubuntu/Debian ship source builds | None found |
| **zlib** (indirect, via `com_google_protobuf`'s `zlib.BUILD` shim) | DEFLATE compression | Builds cleanly (pure C, no arch-specific code required for correctness); a riscv64 CI target exists upstream only via OpenBSD/QEMU jobs, not release-gating | Not release-blocking for riscv64 | Source-only releases upstream; Ubuntu/Debian/Arch-RISC-V/Alpine all ship working riscv64 binaries | [madler/zlib PR #1099](https://github.com/madler/zlib/pull/1099) (open since October 2025, no maintainer response): RVV-optimized Adler32 - a pure performance improvement, not a correctness fix |
| **FXdiv** (indirect, via XNNPACK/pthreadpool) | Header-only fast integer-division-by-constant library used in microkernel indexing math | Not independently investigated; zero riscv64 issues found | Not verified | No GitHub releases; packaged in Debian/Ubuntu as a source build | None found |
| **OouraFFT / FFT2D** (indirect, vendored for TFLite audio/signal ops) | FFT implementation | Not independently investigated; vendored source only, no CI visibility | Not verified | No upstream releases; no distro packaging found - consumed only as vendored source via Bazel | Zero riscv64 issues found |
| **KleidiAI** (indirect, ARM-specific XNNPACK dependency) | ARM NEON/SVE/SME matmul microkernels | Not applicable to riscv64 by design (ARM-ISA-specific library) | N/A | N/A | Flagged only because a naive dependency scan would otherwise miss that this "SIMD dependency of XNNPACK" is ARM-only and irrelevant to riscv64 |

**Non-blocking dependencies (scalar fallback is functional):** ruy, Eigen, gemmlowp, FlatBuffers, farmhash, pthreadpool, FXdiv, and OouraFFT all build on riscv64 but provide no RISC-V SIMD acceleration; inference executes at scalar throughput for any op not covered by an accelerated XNNPACK path.

**Blocking chain that gates a genuine RVV-accelerated riscv64 path (not merely a scalar build):**

1. cpuinfo's incomplete riscv64 uarch/cache/ISA detection (issue #124, open since December 2022; tracking PR number contested between sources - see cpuinfo row above)
2. XNNPACK's resulting FP16 dispatch failures (issue #9886, open, 100+ test failures)
3. binutils 2.41's rejection of the `zvfh` extension, which is why RISE's working build disables the RVV FP16 vector feature flag entirely rather than exercising it
4. No genuine riscv64 CI anywhere in google-ai-edge/LiteRT's own workflows, so even if 1-3 were resolved, nothing upstream would validate the result on a recurring basis

## 11. Known Bugs and Active Issues

LiteRT has no open RISC-V-specific bugs. Four independent search passes (`riscv64 performance`, `riscv64 bug`, `riscv nan floating`, broad `riscv`) against `google-ai-edge/LiteRT`'s issue tracker each returned zero results. Issue #6777, the only "bug"-adjacent hit on any RISC-V-flavored query, is confirmed to be an unrelated aarch64/Raspberry Pi 4B SIGILL crash report, closed 2026-04-15.

For completeness, non-RISC-V correctness issues that would affect any platform including riscv64 (carried from the prior version of this report, not independently re-confirmed this session - [NEEDS VERIFICATION, single source]):
- Issue #121 - FPE in Conv2d (closed July 21, 2025)
- Issue #120 - FPE in DepthwiseConv2D (closed July 22, 2025)
- Issue #128 - TFLite_Detection_PostProcess produces invalid bounding box coordinates (closed October 29, 2025)

**Community (non-official) benchmark data.** No Google- or RISE-published benchmark compares LiteRT throughput/latency on riscv64 vs arm64/amd64. Benchmark data does exist from the unaffiliated third-party fork [rv2036/rvspoc-S2602-litert](https://github.com/rv2036/rvspoc-S2602-litert), measured on a MUSE Pi Pro/X60 board (RVV 1.0, VLEN=256), from [PR #6](https://github.com/rv2036/rvspoc-S2602-litert/pull/6):

| Model | RV64GC scalar | RV64GCV (RVV 1.0) | Speedup |
|---|---|---|---|
| MobileNetV1 FP32 | 712.750 ms | 610.837 ms | 1.17x |
| MobileNetV1 uint8 | 367.736 ms | 67.129 ms | 5.48x |
| MobileNetV2 FP32 | 471.986 ms | 338.218 ms | 1.40x |
| MobileNetV2 uint8 | 291.210 ms | 48.848 ms | 5.96x |
| EfficientDet-Lite0 | 4296.045 ms | 165.909 ms | 25.89x |

Competition verification for that PR reported accuracy 6/6 met (bit-exact, max_abs=0, max_rel=0) and an average latency of 97.0 ms across six models, with no NaN or correctness regressions noted. A second submission to the same challenge ([PR #1](https://github.com/rv2036/rvspoc-S2602-litert/pull/1), QEMU-emulated, VLEN=256) reported FP32 speedups averaging ~2.15x and INT8 speedups averaging ~3.28x versus scalar, with the explicit caveat that QEMU timing is 30-100x slower than real hardware so only relative ratios, not absolute latency, are claimed to transfer to silicon. **None of this data comes from google-ai-edge/LiteRT, Google, or RISE** - it is entirely community/competition-generated and has no PR or reference back into the upstream repository.

A separate, more rigorous cross-runtime comparison exists in [iree-org/iree#24772](https://github.com/iree-org/iree/issues/24772) ("Benchmarking IREE vs ExecuTorch / ONNX Runtime / LiteRT" on a SpacemiT K3 board, 8 threads). Selected FP32 results: MobileNetV3-Small 4.11 ms, ShuffleNetV2-x1.0 6.56 ms, ResNet50 82.8 ms, ViT-B/16 405.0 ms (LiteRT was the fastest runtime tested on several of these). LiteRT ran no FP16 configurations in that comparison (no FP16 kernel support in the tested build). INT8 results were mixed: LiteRT was slower than ExecuTorch on small models (e.g. MobileNetV3-Small: LiteRT 11.7 ms vs ExecuTorch 1.97 ms) but fastest on ViT-B/16 (367.4 ms). This is IREE's own issue, mentioning LiteRT only as a comparison point; it reported no LiteRT-specific correctness bugs.

No NaN or floating-point correctness issues were found for LiteRT on RISC-V in any search performed.

## 12. Objections and Upstream Blockers

**Blocker 1 (Critical) - cpuinfo's incomplete riscv64 detection.** [pytorch/cpuinfo#124](https://github.com/pytorch/cpuinfo/issues/124), open since December 2022. The function `cpuinfo_has_riscv_zvfh()` does not exist, which is the direct root cause of XNNPACK #9886 below. As noted in Section 9, sources disagree on whether the relevant fix is tracked as PR #148 (open since May 2023, unmerged 3+ years - cited by the readiness-grade justification) or PR #397 (described as "open, unreviewed" in one research pass); this should be resolved against the live cpuinfo repository before citing a specific PR number in any external communication. Either way, years of inactivity on the underlying fix indicates the cpuinfo maintainers are not prioritizing riscv64 uarch/cache detection.

**Blocker 2 (Critical) - XNNPACK's RVV FP16 CI is red.** [google/XNNPACK#9886](https://github.com/google/XNNPACK/issues/9886), open. 100+ RVV FP16 dispatch test failures because `xnn_arch_riscv_vector_fp16_arith` is set unconditionally (introduced by a prior PR, #9516, per the prior version of this report - [NEEDS VERIFICATION]), bypassing the missing `cpuinfo_has_riscv_zvfh()` guard. This is why RISE's PR #2135 disables the feature flag entirely rather than shipping a broken FP16 vector path.

**Blocker 3 (High) - toolchain-level `zvfh` rejection.** GNU binutils 2.41, as used in RISE's build environment, rejects the `zvfh` extension at assembly time. This is a toolchain-version constraint rather than a code defect, but it is the immediate, concrete reason the one confirmed-working riscv64 LiteRT build ships without RVV FP16 acceleration.

**Blocker 4 (High, [NEEDS VERIFICATION]) - XNNPACK C99 build error.** [google/XNNPACK#4650](https://github.com/google/XNNPACK/issues/4650), reported open for 3+ years in the prior version of this report: `syscall` undeclared in cpuinfo on RISC-V under Clang with `-std=c99`. Not independently re-verified this session.

**Blocker 5 (High, [NEEDS VERIFICATION]) - Abseil link/test failures.** [abseil/abseil-cpp#1702](https://github.com/abseil/abseil-cpp/issues/1702) and [#2002](https://github.com/abseil/abseil-cpp/issues/2002), reported open in the prior version of this report (riscv64 toolchain link failure; `hashtablez_sampler_test`/`cordz_sample_token_test` failing on riscv64-linux-gnu). Not independently re-verified this session; Abseil is used pervasively throughout LiteRT and TensorFlow, so if still open these remain meaningful.

**Non-blockers:** ruy has no RISC-V SIMD path but is superseded by XNNPACK for most ops, so its absence affects performance, not correctness. Eigen falls back to scalar on any tagged release (RVV exists only on `master`); acceptable as a performance gap, not a correctness blocker. The zlib RVV Adler32 PR (#1099) is a pure performance item with no maintainer response, not a blocking correctness issue.

**No genuine upstream discussion of RISC-V exists to object to or accept.** google-ai-edge/LiteRT has never received an issue or PR proposing a riscv64 port, so there is no recorded maintainer stance (positive or negative) on the idea. Given the governance model (sole Google authority, maintainer status revocable at will, no RFC/voting process), any future riscv64 port would require a unilateral Google decision, not community consensus - meaning the "acceptance probability" question cannot be answered from any evidence gathered; it would have to be tested by opening a concrete proposal upstream.

**Upstream responsiveness assessment:** the multi-year unmerged/unresolved state of the cpuinfo detection gap and the still-open XNNPACK C99 issue (if still current) indicate that RISC-V is not a maintenance priority for the Google teams that own XNNPACK and cpuinfo. Separately, the real RVV kernel acceleration work that does exist (1.17x-25.89x speedups, Section 11) sits entirely in a disconnected community fork with no PR or reference back into google-ai-edge/LiteRT, meaning none of that engineering investment currently benefits the upstream project at all.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** RISE

**Justification:** google-ai-edge/LiteRT's own upstream has zero riscv64 CI (no workflow, no CMake/Bazel riscv64 target, no QEMU job) and publishes no riscv64 artifact on PyPI, GitHub Releases, or any Linux distro, so a CI-only assessment would place it at orange ("no upstream CI"). However, the distribution floor applies: RISE (via [riseproject-dev/python-wheels PR #2135](https://github.com/riseproject-dev/python-wheels/pull/2135), "ai-edge-litert: Add version 2.2.0," merged 2026-09-21) builds `ai-edge-litert` directly from unmodified upstream LiteRT source with Bazel and publishes working riscv64 wheels (cp311-cp314, `manylinux_2_27_riscv64`) live on `pypi.riseproject.dev`. The only riscv64-specific build deviation is a Bazel feature flag (`--define=xnn_enable_riscv_fp16_vector=false`, disabled because binutils 2.41 rejects the `zvfh` extension) rather than a source-level patch to LiteRT itself, so this counts as an unpatched build and caps the color at yellow (clean-distro-build) rather than orange (downstream-only) or a blue/green grade (which require genuine upstream CI, which does not exist here). LiteRT is not an optimization-purpose project by the applicable test - it is a general on-device ML inference runtime, not a SIMD/kernel library whose value proposition is riscv64-specific speed - so no optimization-level modifier applies and the optimization gap is not applicable.

**Pending work that could change the grade:** open, unresolved blockers remain in LiteRT's vendored dependency chain that gate a genuine performance path on riscv64: XNNPACK issue #9886 (100+ RVV FP16 dispatch test failures, root-caused to a missing `cpuinfo_has_riscv_zvfh()` check) and pytorch/cpuinfo issue #124 / PR #148 (incomplete riscv64 uarch/cache detection, open since 2022, unmerged 3+ years - see Section 9 for the PR-number discrepancy across sources). The RISE-published wheel (PR #2135, maintained by contributor `luhenry`) is active and gets updated per LiteRT release, so future releases could strengthen the release-provider picture but would not by themselves change the color without genuine upstream CI. Separately, real RVV kernel acceleration (1.17x-25.89x speedups, Section 11) exists only in the disconnected third-party fork `rv2036/rvspoc-S2602-litert`, with no PR or reference back into google-ai-edge/LiteRT; if that work were ever upstreamed alongside a riscv64 CI job, the color would move toward blue/green.

## 14. Investment Analysis

RISE has already done the functional-enablement groundwork: an unpatched, working build recipe exists (Bazel 7.5.0 bootstrapped from source, GCC 14, one feature flag disabled) and a live wheel is published and updated per release. The sizing below excludes that already-completed work and focuses on what remains to move the project toward genuine upstream CI and RVV-accelerated performance.

### 14.1 Functional Enablement

Already done (RISE, not sized here): Bazel/GCC build recipe, binutils-flag workaround, published riscv64 wheel for cp311-cp314.

Remaining work:
1. Resolve the cpuinfo riscv64 uarch/cache-detection gap (issue #124 and its associated PR - confirm PR number first, see Section 9) - prerequisite for item 2.
2. Fix XNNPACK #9886 FP16 CI failures (contingent on 1).
3. Obtain or build a GNU binutils release that accepts `zvfh`, then re-enable `xnn_enable_riscv_fp16_vector` in the RISE build.
4. If still open, resolve Abseil #1702/#2002 and XNNPACK #4650 - confirm current status first (Section 12 flags these as [NEEDS VERIFICATION]).
5. Add a riscv64 CMake preset and Bazel `config_setting` to LiteRT itself, so a riscv64 target is a first-class, LiteRT-recognized build configuration rather than something only reachable via a downstream project's generic toolchain passthrough.

### 14.2 Performance Optimization

1. Complete 14.1 items 1-3 first (FP16 vector path currently disabled entirely).
2. Evaluate upstreaming the RVV kernel work from `rv2036/rvspoc-S2602-litert` (1.17x-25.89x measured speedups on real hardware) into either XNNPACK proper or a LiteRT-internal RVV kernel set analogous to `neon_tensor_utils.cc`. This is the single highest-leverage item: it is already-written code sitting disconnected from upstream.
3. Add RVV paths to LiteRT-internal tensor-utility and 4-bit-FC kernels for ops not covered by XNNPACK.
4. Publish first-party (Google or RISE) benchmark data; all existing numbers are third-party community/competition data (Section 11), not suitable for an official performance claim.

### 14.3 CI/CD Infrastructure

1. Add a riscv64 job to google-ai-edge/LiteRT's own GitHub Actions, following XNNPACK's existing `cmake-linux-riscv64` QEMU-job pattern or using RISE's native RISC-V Runners (RISE has offered this infrastructure to other RISC-V CI efforts, per its blog).
2. Add a riscv64 wheel-build step to LiteRT's own `linux_nightly_wheel.yml`, rather than relying solely on RISE's separate, on-demand `python-wheels` release cadence.
3. Confirm `manylinux` riscv64 tag availability/conventions for LiteRT's own PyPI publishing pipeline (RISE currently uses `manylinux_2_27_riscv64`/`manylinux_2_39_riscv64` tags on its own index - Data not available on whether PyPA's manylinux specification for riscv64 is finalized for upstream use).

### 14.4 Ecosystem Enablement

1. If LiteRT's own CI/build system gains riscv64 support (14.3), coordinate publishing the resulting wheel to `pypi.org` directly, superseding the need for users to point at `pypi.riseproject.dev`.
2. Engage the RISE AI/ML working-group channel to get the existing `python-wheels` LiteRT work documented on the RISE blog, closing the current discoverability gap.
3. Track the `mediapipe` RISE wheel (PR #2104) as a second consumer that benefits from any LiteRT riscv64 CI/build improvements.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Resolve cpuinfo riscv64 uarch/cache detection (confirm PR #148 vs #397 first) | 2 | cpuinfo/XNNPACK upstream contributor | Critical |
| Functional | Fix XNNPACK #9886 FP16 CI failures | 1 | XNNPACK upstream contributor | Critical |
| Functional | Obtain/build binutils accepting `zvfh`, re-enable FP16 vector flag in RISE build | 1 | RISE / toolchain contributor | High |
| Functional | Re-verify and, if still open, fix Abseil #1702/#2002, XNNPACK #4650 | 2 | Abseil/XNNPACK upstream contributor | High |
| Functional | Add riscv64 CMake preset and Bazel config_setting to LiteRT itself | 1 | LiteRT contributor | High |
| Performance | Evaluate and attempt upstreaming RVV kernels from rv2036/rvspoc-S2602-litert | 4 | LiteRT/XNNPACK contributor, in coordination with fork authors | High |
| Performance | Add RVV paths to LiteRT-internal tensor-utility and 4-bit-FC kernels | 6 | LiteRT contributor | Medium |
| Performance | Generate and publish first-party benchmark data vs arm64/amd64 | 3 | LiteRT contributor | Medium |
| CI/CD | Add riscv64 CI job to google-ai-edge/LiteRT GitHub Actions | 2 | LiteRT contributor | High |
| CI/CD | Add riscv64 wheel build to LiteRT's own nightly workflow | 2 | LiteRT contributor | Medium |
| Ecosystem | Publish riscv64 wheel to pypi.org directly | 1 | LiteRT contributor | Medium |
| Ecosystem | Document existing RISE python-wheels LiteRT work on the RISE blog | 1 | Business development / RISE liaison | Low |

**Key risk:** the multi-year unresolved state of the cpuinfo detection gap (Section 12) indicates that contributions to this dependency chain may not land on a predictable timeline without direct upstream maintainer engagement. Work that cannot land upstream must be carried as a fork (as RISE's build already effectively does with its feature-flag workaround), multiplying long-term maintenance cost. The one clear positive asymmetry is the already-written RVV kernel code in `rv2036/rvspoc-S2602-litert`: unlike the other blockers, this is not a research problem but an integration and upstreaming problem.

## 15. References

- [google-ai-edge/LiteRT repository](https://github.com/google-ai-edge/LiteRT)
- [LiteRT homepage](https://ai.google.dev/edge/litert)
- [LiteRT issue #37](https://github.com/google-ai-edge/LiteRT/issues/37)
- [LiteRT issue #177](https://github.com/google-ai-edge/LiteRT/issues/177)
- [LiteRT issue #6777](https://github.com/google-ai-edge/LiteRT/issues/6777)
- [LiteRT PR #6641](https://github.com/google-ai-edge/LiteRT/pull/6641)
- [LiteRT PR #7432](https://github.com/google-ai-edge/LiteRT/pull/7432)
- [LiteRT PR #7623](https://github.com/google-ai-edge/LiteRT/pull/7623)
- [LiteRT PR #8765](https://github.com/google-ai-edge/LiteRT/pull/8765)
- [LiteRT commit 9626c175](https://github.com/google-ai-edge/LiteRT/commit/9626c175af909ac2ae2fdb850f3388fd325118e1)
- [tflite/types/half.h](https://github.com/google-ai-edge/LiteRT/blob/main/tflite/types/half.h)
- [ai-edge-litert on PyPI](https://pypi.org/project/ai-edge-litert/)
- [riseproject-dev/python-wheels repository](https://github.com/riseproject-dev/python-wheels)
- [riseproject-dev/python-wheels PR #2135](https://github.com/riseproject-dev/python-wheels/pull/2135)
- [riseproject-dev/python-wheels PR #2104](https://github.com/riseproject-dev/python-wheels/pull/2104)
- [python-wheels-dashboard](https://riseproject-dev.github.io/python-wheels-dashboard/)
- [RISE wheel_builder (legacy)](https://riseproject.gitlab.io/python/wheel_builder/)
- [rv2036/rvspoc-S2602-litert fork](https://github.com/rv2036/rvspoc-S2602-litert)
- [rv2036/rvspoc-S2602-litert PR #1](https://github.com/rv2036/rvspoc-S2602-litert/pull/1)
- [rv2036/rvspoc-S2602-litert PR #6](https://github.com/rv2036/rvspoc-S2602-litert/pull/6)
- [RVSPOC championship](https://rvspoc.org/en/)
- [iree-org/iree issue #24772](https://github.com/iree-org/iree/issues/24772)
- [google/XNNPACK issue #9886](https://github.com/google/XNNPACK/issues/9886)
- [google/XNNPACK issue #4650](https://github.com/google/XNNPACK/issues/4650)
- [pytorch/cpuinfo issue #124](https://github.com/pytorch/cpuinfo/issues/124)
- [pytorch/cpuinfo PR #148](https://github.com/pytorch/cpuinfo/pull/148)
- [abseil/abseil-cpp issue #1702](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil/abseil-cpp issue #2002](https://github.com/abseil/abseil-cpp/issues/2002)
- [madler/zlib PR #1099](https://github.com/madler/zlib/pull/1099)
- [tensorflow/tensorflow issue #102159](https://github.com/tensorflow/tensorflow/issues/102159)
- [tensorflow/tensorflow issue #100940](https://github.com/tensorflow/tensorflow/issues/100940)
- [RISE Project](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)