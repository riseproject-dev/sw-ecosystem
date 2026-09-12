---
title: TensorFlow
parent: Project Reports
color: red
dependencies:
  - name: Bazel
    relation: build-dependency
    criticality: critical
  - name: cpuinfo
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: runtime-dependency
    criticality: critical
  - name: Python
    relation: runtime-dependency
    criticality: critical
  - name: rules_python
    relation: build-dependency
    criticality: critical
  - name: manylinux
    relation: build-dependency
    criticality: optional
  - name: BoringSSL
    relation: runtime-dependency
    criticality: optional
  - name: oneDNN (DNNL)
    relation: runtime-dependency
    criticality: optional
  - name: Zephyr RTOS
    relation: runtime-dependency
    criticality: optional
---

# TensorFlow

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-11<br/>
**Readiness:** red<br/>
**Scope:** RISC-V (riscv64/linux) support status for TensorFlow<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="tensorflow" %}

## 1. Project Overview

TensorFlow is a general-purpose machine learning framework (training and inference) developed and controlled by Google, comprising a Python/C++ core, the XLA compiler backend, and the separately-packaged TensorFlow Lite (TFLite) inference runtime for mobile/embedded targets. It is licensed Apache 2.0.

**Governance:** TensorFlow has no foundation affiliation (no Linux Foundation, no independent foundation) - it remains a Google-led open-source project. Development is synced from Google's internal monorepo via "Copybara": external PRs are reviewed on GitHub, copied into Google's internal codebase, run through internal CI, and merged back out (per `CONTRIBUTING.md`). The dominant commit-author identity is the internal bot `A. Unique TensorFlower <gardener@tensorflow.org>` (14,804 commits) / `TensorFlower Gardener` (1,778 commits), representing internally-landed Google changes rather than individual contributors.

**Corporate sponsors (by commit-author email domain, full history):** google.com (27,476 commits) and tensorflow.org (16,583, internal bot identities) dominate. Next tier: nvidia.com (1,181, GPU/cuDNN), intel.com (667, oneDNN/MKL), amd.com (504, ROCm), arm.com (210, Arm Compute Library), openxla.org (209, the Google-spun-off XLA project), linaro.org (76), ibm.com (72), amazon.com (61). ispras.ru (30 commits, Russian Academy of Sciences ISP RAS) is a notable RISC-V-adjacent contributor, though not tied to specific riscv64 landings identified in this research.

**Formal structures:** an RFC process exists (`community/rfcs`) requiring a maintainer sponsor, and Special Interest Groups (SIGs) exist (e.g. SIG Micro for embedded work), but no RISC-V-specific SIG or RFC has ever been filed - architecture/platform ports are handled as ordinary code PRs, not formal RFCs. No formal tiered-platform-support policy document (`PLATFORMS.md`, `SUPPORT.md`, etc.) exists in the repository.

**Community stance on new ports:** pragmatically open to community-contributed ports provided they pass CI and don't create excessive maintenance burden, but with real friction in practice: maintainer terryheo rejected an earlier RISC-V CMake PR (#48099) stating "RISCV is not our primary target devices," and community PRs (including one with a tentative maintainer approval, #102607) have repeatedly stalled and been auto-closed by the stale-bot for lack of a second reviewer.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-12-20 | First internal RISC-V commit (`929e9a0`): "CL 1/N... extending TFlite infrastructure for RISC-V" - MCU target bring-up | [commit 929e9a0](https://github.com/tensorflow/tensorflow/commit/929e9a09dfa215d5b4c546a8d05ac3b6956e6d01) |
| 2018-12-27 | External PR #24485 ("mcu-riscv", user mars20) merged - RISC-V MCU target for TFLite Micro | Commit history via search_commits |
| 2020-01-21/22 | Zhou Peng fixes riscv32_mcu build/linker issues | [PR #33972](https://github.com/tensorflow/tensorflow/pull/33972) |
| 2020-04-01 | Antmicro (Kamil Rakoczy, Karol Gugala) adds Zephyr RTOS RISC-V examples | [PR #38111](https://github.com/tensorflow/tensorflow/pull/38111) |
| 2020-12-28 | **PR #45844 merged** - first riscv64 Linux port, TFLite Makefile build (`TARGET=linux_riscv64`), tested on HiFive Unleashed hardware running MobileNetV1 inference | [PR #45844](https://github.com/tensorflow/tensorflow/pull/45844) |
| 2021-05-13 | #45844 first ships in TensorFlow 2.5.0 | Release timing analysis |
| 2021-07-29 | PR #48099 (riscv CMake support for TFLite) closed unmerged - maintainer terryheo: "RISCV is not our primary target devices" | [PR #48099](https://github.com/tensorflow/tensorflow/pull/48099) |
| 2022-09-30 | PR #57689 (Shakti RISC-V processor support) closed/locked as spam - 153 unrelated commits bundled in | [PR #57689](https://github.com/tensorflow/tensorflow/pull/57689) |
| 2024-07-05 | PR #63850 merged - bumps pinned cpuinfo commit, fixing a riscv64 build break from a missing `sys/hwprobe.h` header | [PR #63850](https://github.com/tensorflow/tensorflow/pull/63850) |
| 2024-02-18 | PR #61268 (Go SDK + oneDNN riscv patches) closed stale, unmerged | [PR #61268](https://github.com/tensorflow/tensorflow/pull/61268) |
| 2025-02-09 | PR #61581 (RISC-V CMake support, follow-up to #48099) closed unmerged | [PR #61581](https://github.com/tensorflow/tensorflow/pull/61581) |
| 2025-09-24 | Issue #100940 opened (Bazel pip-wheel build fails on riscv64, TF 2.20.0) - **still open, 0 maintainer comments** | [Issue #100940](https://github.com/tensorflow/tensorflow/issues/100940) |
| 2025-10-12 | Issue #102159 opened (custom riscv64 toolchain fails in rules_python) - **still open, 0 maintainer comments** | [Issue #102159](https://github.com/tensorflow/tensorflow/issues/102159) |
| 2025-10-20 | PR #102203 ("spam: Add RISC-V 64-bit architecture support") closed as AI-generated spam - maintainer mihaimaruseac: "AI slop with no quality control" | [PR #102203](https://github.com/tensorflow/tensorflow/pull/102203) |
| 2025-10-20 | PR #102607 opened ("fixes #102159") - 9-commit fix attempt covering XLA:CPU riscv64, rules_python patches, LLVM namespace fixes | [PR #102607](https://github.com/tensorflow/tensorflow/pull/102607) |
| 2025-10-28 | mihaimaruseac: "Tentatively approving, but I think this will need more reviewers" on #102607; final approval granted 2025-10-29 | [PR #102607](https://github.com/tensorflow/tensorflow/pull/102607) |
| 2025-11-05 | **PR #103511 merged** (Copybara import of openxla/xla#32812) - adds riscv64 as a recognized XLA:CPU target across Bazel configs, LLVM toolchain selection, Python manylinux compliance checks | [PR #103511](https://github.com/tensorflow/tensorflow/pull/103511) |
| 2026-03-06 | #103511 first ships in TensorFlow 2.21.0 | Release timing analysis |
| 2026-03-26 | PR #102607 auto-closed by stale-bot (14 days inactivity) despite the maintainer approval from Oct 2025 - never merged | [PR #102607](https://github.com/tensorflow/tensorflow/pull/102607) |

**Key contributors and orgs:** vaibhavexleapsemi (individual, #45844 - the foundational riscv64 port), Antmicro (Zephyr RTOS RISC-V work), Zhou Peng (individual, TFLite Micro fixes), IgnotaYun (individual, #102607 - most substantial recent unmerged attempt), gns / Levi Zim (individual, XLA:CPU riscv64 via upstream openxla/xla#32812), cocoa-xu (individual, #63850 cpuinfo fix). No corporate/silicon-vendor sponsor (SiFive, Andes, T-Head, RISE members) appears as a riscv64 contributor in the history surfaced by this research.

**Is it fully upstream?** No. Only two riscv64 PRs have ever merged in the project's history: #45844 (2020, TFLite legacy-Makefile Linux port only) and #103511 (2025, XLA:CPU build-system/codegen target recognition only - not a working end-to-end build). Every attempt to land full Bazel/pip-wheel riscv64 support (#102607, the earlier #103488 duplicate, #61268, #61581, #48099) closed unmerged. No umbrella/tracking issue consolidates any of this work across its ~15-year, ~30-item history.

## 3. Upstream Support Tier

No formal tier policy document exists. In practice, riscv64 sits outside any tier: it has no dedicated CI, no upstream-published binary, and the modern build path (Bazel pip-wheel) is presently non-functional per two open, unresolved 2025 issues.

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated CI workflow | Yes (`ci-build.yml`, `build-reusable.yml` etc.) | Yes (`arm-ci.yml`, `arm-ci-extended.yml`, `arm-ci-extended-cpp.yml`, `arm-cd.yml`) | **None** - zero riscv references in any of the 17 `.github/workflows/*.yml` files or `ci/official/*` env files |
| Release-blocking gate | Yes | Yes | N/A - no gate exists |
| Official PyPI wheel | Yes | Yes (`tensorflow-aarch64` etc.) | **No** - zero riscv64 wheels across all 138 versions / 1,741 files ever published to PyPI |
| Official binary (any channel) | Yes (PyPI) | Yes (PyPI) | **No** - GitHub Releases ships only source tarballs for every architecture; no riscv64 binary exists anywhere upstream |
| Current build status | Working | Working | **Broken** - both open 2025 issues (#100940, #102159) report unresolved pip-wheel/Bazel build failures |

## 4. Technical Architecture and RISC-V-Specific Subsystems

A full-text search of `tensorflow/` and the in-tree `third_party/xla/` (HEAD `dd3737bd9c`) found 44 total "riscv" mentions versus 621 for "aarch64" and 315 for "x86_64" - roughly 5-7% of the reference architectures' volume, and every riscv64 hit is build-graph routing, not compute-kernel implementation.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TFLite optimized kernels (`tensorflow/lite/kernels/internal/optimized/`) | 9 hand-tuned SSE/AVX2 files | 11 hand-tuned NEON files (including aarch64 sdot/nosdot microarch tuning) | **0 files** - no `riscv_check.h`, no dispatch file; falls straight through to the generic scalar/portable reference implementation |
| XLA CPU codegen intrinsics (`xla/codegen/intrinsic/rsqrt.cc`) | Hardware intrinsic paths (`x86_sse_rsqrt_ss`, `x86_avx_rsqrt_ps_256`, `x86_avx512_rsqrt14_ps_512`) | Generic LLVM-IR polynomial fallback (no ARM-specific case either) | Generic LLVM-IR polynomial fallback |
| XLA contraction/matmul kernel selector (`xla/tsl/framework/contraction/BUILD`) | Accelerated (Eigen/oneDNN-tuned) deps | Accelerated deps | **Explicitly empty deps** for `linux_riscv64` - same bucket as ppc64le and s390x; plain scalar Eigen only |
| JIT/compiler backend (XLA via LLVM) | Full `X86CodeGen` | Full `AArch64CodeGen` | LLVM `RISCVCodeGen`/`RISCVAsmParser` now linkable (PR #103511/openxla#32812) - this only makes riscv64 machine code emittable at all; adds no vectorization, scheduling, or ISA-aware codegen |
| Float16 (`tensorflow/lite/types/half.h`) | Native `_Float16` where available | Native `_Float16` where available | 3-line conditional: `#if defined(__riscv) && defined(__riscv_zvfh) && __clang__ >= 1600` enables native path only under Zvfh + Clang >=16; the only ISA-extension-specific reference in the entire repository |
| Bazel platform recognition (`tensorflow/BUILD`) | `config_setting` wired throughout | `config_setting` wired throughout | `config_setting(name = "linux_riscv64", ...)` exists (lines 625-633) but is **not referenced by any `select()`** elsewhere in the file - a bare stub |
| Platform-string ISA detection (`platform_strings.h`/`platform_strings_computed.h`) | Functional | Functional | Entries reference the macro `__riscv___` (triple underscore) which is not a real compiler-predefined macro (the real one is `__riscv`) - **dead/non-functional code** |
| XLA AOT cross-compile test (`run_xla_aot_test.sh`) | Active | Active | **Explicitly commented out**: `# check_crosscompile riscv64gc-unknown-linux-gnu "<tbd>"` - every other target triple (aarch64, x86_64, arm64-darwin, windows) is active |

Actual RVV-optimized compute kernels for TFLite, where they exist at all, live in the external XNNPACK and ruy repositories (separate GitHub projects referenced as Bazel externals), not in `tensorflow/tensorflow` itself; see Section 9.

**Conclusion:** TensorFlow's own repository has essentially no RISC-V architecture-specific implementation beyond build-system recognition of the platform name, one narrow Zvfh float16 compile-time check, dead macro entries, and an explicitly disabled AOT cross-compile test.

## 5. Build System, Cross-Compilation, and Toolchain

TensorFlow's build system is entirely Bazel-based (`MODULE.bazel`, `BUILD` files, `.bazelrc`). There is **no CMakeLists.txt anywhere in the repository** - the legacy CMake build was removed years ago; the sole surviving CMake artifact is `tensorflow/tools/ci_build/Dockerfile.cmake`, a CI image unrelated to riscv64. No `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md` file exists in the repo.

**Exact reproducible failures reported (Bazel path, the current/modern path):**
- Issue #100940 (TF 2.20.0, Ubuntu 24.04, Python 3.11.6, Bazel 7.4.1, GCC 14.2.0): `bazel build //tensorflow/tools/pip_package:wheel --repo_env=WHEEL_NAME=tensorflow` reports "build successful" but the wheel-builder script then fails with `TypeError: 'NoneType' object is not iterable` (iterating over headers) and, on retry with headers supplied, `FileNotFoundError` for missing temp/XLA-compiler directories. No usable wheel is produced. ([Issue #100940](https://github.com/tensorflow/tensorflow/issues/100940))
- Issue #102159 (TF 2.19.1, EulixOS, Bazel, GCC 12.3.1): a custom `third_party/python_riscv_repository` toolchain registration fails with `Error: <target @python_riscv64-unknown-linux-gnu//:python_headers> (rule 'cc_library') doesn't have provider 'headers'` - `rules_python`'s `current_py_cc_headers` mechanism expects a `headers` provider the custom toolchain doesn't supply. ([Issue #102159](https://github.com/tensorflow/tensorflow/issues/102159))
- PR #102607, the most substantial attempted fix (9 commits: XLA:CPU riscv64 support, LLVM namespace-qualifier fixes for DTensor, missing `<stdint.h>`, `rules_python` riscv64 patch, manylinux compliance updates, timeout adjustments), received a tentative maintainer approval (mihaimaruseac, 2025-10-28) but was auto-closed by the stale-bot on 2026-03-26 after failing to secure a second reviewer. A follow-up compile issue was reported during review: **GCC-specific failure** (pybind11/protobuf symbol issue on riscv64 at import time); the author's workaround was `./configure` to select Clang + `bazel clean --expunge` - Clang-17 and Clang-20 were confirmed working, but **Clang-18 hit an internal compiler error (ICE)**. The author also noted release-branch backporting is not possible; changes target master only. ([PR #102607](https://github.com/tensorflow/tensorflow/pull/102607))

**Working, but legacy, path (TFLite only):** PR #45844's `build_riscv_lib.sh` (Makefile-based, `TARGET=linux_riscv64`) is the one build path with a documented successful outcome - tested on HiFive Unleashed hardware in 2020. It targets the legacy Makefile build system for TFLite only, not full TensorFlow, not Bazel, and not CMake. ([PR #45844](https://github.com/tensorflow/tensorflow/pull/45844))

**QEMU usage:** No mention of QEMU anywhere in the repository in connection with riscv64.

**Known historical build failures (resolved or stale):**
- ABI mismatch: LLVM's `RISCVISAInfo::computeDefaultABI` defaulted to `lp64` (soft-float) while riscv64 Ubuntu system libs used ABI flag 0x5 (double-float), breaking `aot_compiled_test` linkage on TF 2.13.1 (closed as completed). ([Issue #62241](https://github.com/tensorflow/tensorflow/issues/62241))
- `cpuinfo` dependency's missing `sys/hwprobe.h` broke TFLite 2.16.1 riscv64 builds; the fix existed upstream in cpuinfo but TF hadn't bumped the pin until PR #63850 (merged 2024-07-05, first in ~TF 2.18.0). ([Issue #64987](https://github.com/tensorflow/tensorflow/issues/64987), [PR #63850](https://github.com/tensorflow/tensorflow/pull/63850))
- `dlfcn.h: No such file or directory` for the riscv32 MCU toolchain (closed/stale). ([Issue #47636](https://github.com/tensorflow/tensorflow/issues/47636))
- Flex delegate cross-compilation failure caused by BoringSSL on riscv (closed). ([Issue #44582](https://github.com/tensorflow/tensorflow/issues/44582))

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `pip install tensorflow` produces a working install | Yes | Yes | **No** - no wheel exists; source build via Bazel currently fails (#100940, #102159) |
| Full TensorFlow (training + inference, Python API) | Yes | Yes | **No functional path found** in current research |
| TensorFlow Lite (C++ inference runtime) | Yes | Yes | Yes, via the 2020 legacy Makefile port (#45844) and via Ubuntu's `libtensorflow-lite-dev`/`libtensorflow-lite2.14.1` riscv64 packages |
| XLA:CPU compiler backend | Yes | Yes | Recognized as a build target only (PR #103511); no evidence of a working end-to-end compile-and-run path |
| SIMD-accelerated CPU kernels (TFLite optimized ops) | Yes (SSE/AVX2) | Yes (NEON) | **No** - scalar reference path only (Section 4) |
| Accelerated matmul/contraction (XLA/Eigen/oneDNN path) | Yes | Yes | **No** - explicitly empty dependency set (Section 4) |

**Functional gaps:** cannot currently `pip install` or build-from-source a working full TensorFlow package on riscv64 via the modern Bazel path (both reported attempts fail before producing a usable artifact). TFLite alone is functional via the legacy Makefile build or Ubuntu's stale (2.14.1, ~2023) package.

**Performance gaps:** with zero riscv64-specific SIMD kernels anywhere in the TFLite optimized-kernels directory and an explicitly empty contraction-kernel dependency set in XLA, any riscv64 execution that does work falls back entirely to scalar/generic C++ - no quantitative TensorFlow-specific riscv64-vs-arm64 benchmark was found in this research (see Section 11 for what was found and what was not).

**Security hardening gaps:** BoringSSL (TLS/crypto dependency) has only compile-only riscv64 CI coverage (no runtime test execution) and its FIPS module reportedly rejects riscv64 [NEEDS VERIFICATION - single-source finding]. No riscv64-specific hardening data was found for the rest of the stack.

**NaN / floating-point semantics:** no open or closed TensorFlow issue ties a NaN/floating-point *correctness* bug specifically to riscv64. The one substantive riscv64 floating-point issue found is the soft-float/hard-float ABI **linkage** mismatch (#62241, closed/resolved), not a numerical-correctness defect.

## 7. CI/CD Infrastructure

**Verified by direct inspection of the actual CI definitions on disk** (cloned `tensorflow/tensorflow`, HEAD `dd3737bd9c`), not by inference from issue/PR text.

All 17 `.github/workflows/` files were enumerated and grepped for `riscv`/`riscv64`/`RISCV`: `arm-cd.yml`, `arm-ci-extended-cpp.yml`, `arm-ci-extended.yml`, `arm-ci.yml`, `build-reusable.yml`, `ci-build.yml`, `cffconvert.yml`, `check_license.yml`, `gemini.yml`, `issue-on-pr-rollback.yml`, `osv-scanner-scheduled.yml`, `pylint-presubmit.yml`, `release-branch-cherrypick.yml`, `scorecards-analysis.yml`, `stale-issues.yml`, `update-nightly.yml`, `update-rbe.yml`. **Zero matches.** ARM has four dedicated workflow files (`arm-ci.yml`, `arm-ci-extended.yml`, `arm-ci-extended-cpp.yml`, `arm-cd.yml`); riscv64 has none.

`ci/official/` environment files define only: `linux_x86`, `linux_x86_cuda`, `linux_x86_cuda13_nvcc`, `linux_arm64`, `linux_arm64_onednn`, `linux_arm64_cross_compile`, `macos_arm64`, `windows_x86_*`. No `linux_riscv64` environment exists; `grep -i riscv` over the entire `ci/` tree returns zero matches. `tensorflow/tools/ci_build/` likewise has zero riscv matches. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.circleci/`, `azure-pipelines.yml`, `.travis.yml`, `.buildkite/`, or `appveyor.yml` exist in the repo. No `.kokoro` directory is public (Kokoro configs for TF live in an internal Google repo and could not be checked), but no public workflow invokes a riscv64 Kokoro job.

No RISE runner references, no RISE org mentions, and no riscv64 hardware/QEMU step anywhere in CI. RISE has no involvement with TensorFlow at all (confirmed: absent from RISE blog search, RISE Python wheel builder listing, and every `riseproject-dev` GitHub org repo; RISE's ML/AI working-group effort is PyTorch-focused, per `riseproject-dev/pytorch-ci` and `riseproject-dev/ai-ml-wg`).

| Axis | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated workflow file(s) | Yes | Yes (4 files) | **None** |
| Build step | Yes | Yes | **None** |
| Test execution | Yes | Yes | **None** |
| Release-blocking | Yes | Yes | N/A |
| RISE runner usage | N/A | N/A | **None** |

## 8. Distribution and Release Status

**No official riscv64 binary exists for full TensorFlow on any channel checked.**

- **GitHub Releases:** the latest release (v2.21.0) and all recent releases (2.21.0-rc1/rc0, 2.20.0, 2.19.x, 2.18.x) show only GitHub's auto-generated source `.tar.gz`/`.zip` - no compiled binaries are published for any architecture, riscv64 included. ([tensorflow/tensorflow releases](https://github.com/tensorflow/tensorflow/releases))
- **PyPI:** the full `tensorflow` package JSON history (138 versions, 1,741 wheel files) contains **zero** riscv64 filenames, ever. Latest version 2.21.0 ships wheels only for `macosx_arm64`, `manylinux_2_27_{aarch64,x86_64}`, and `win_amd64`. ([PyPI tensorflow JSON](https://pypi.org/pypi/tensorflow/json))
- **RISE wheel builder:** the RISE GitLab PyPI proxy (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tensorflow/`) returns an HTTP 302 redirect straight to upstream PyPI - RISE has not built or published its own `tensorflow` wheel.
- **Ubuntu 26.04 "resolute":** the apt archive index (`main` + `universe`, 69,719 riscv64 packages scanned) contains **no `tensorflow` or `python3-tensorflow` package for any architecture** - the full package does not exist in this distro release at all. The source package `tensorflow` (2.14.1+dfsg-3build1) instead builds only **TensorFlow Lite**: `libtensorflow-lite-dev`, `libtensorflow-lite2.14.1` (plus `-dbgsym`), and these ARE published for riscv64 with `Published` status, on par with amd64/amd64v3/arm64/armhf/ppc64el/s390x. This is a C++ runtime library and headers only, not the Python TensorFlow package, and the underlying TF version (2.14.1) is over two years stale.
- **Arch Linux RISC-V port:** the `tensorflow` package's status entry reads `DEP MISSING: intel-oneapi-openmp, intel-oneapi-compiler-shared-runtime-libs, python-keras, python-pycuda` - it cannot currently be built on this port at all. Five downstream Arch riscv64 packages (`nanobind`, `openvino`, `python-keras`, `python-safetensors`, `python-tensorflow-serving-api`) all list `python-tensorflow` as `DEP MISSING`, confirming no built package is available to satisfy them either. ([Arch RISC-V status](https://archriscv.felixc.at/.status/status.htm))

**What a user must do to get a working binary today:** for full TensorFlow, there is no known working path - the modern Bazel pip-wheel build fails per Section 5, and no distro or third party ships a working package. For TFLite only, a user can either build from source using the 2020 legacy Makefile port (`build_riscv_lib.sh`, #45844) or install Ubuntu's `libtensorflow-lite2.14.1`/`libtensorflow-lite-dev` riscv64 packages (C++ only, no Python bindings, stale at v2.14.1).

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release/packaging | Notes |
|---|---|---|---|---|---|
| Bazel | Build-dependency (critical) | Bazel itself supports riscv64 per prerequisites cited in PR #102607 (bazelbuild/bazel#25236, #25699) | Not independently verified in this research | N/A | TensorFlow's build failures on riscv64 (Section 5) occur in TF's own wheel-packaging/toolchain-registration logic layered on top of Bazel, not in Bazel itself |
| cpuinfo | Build-dependency (critical) | "Second-class port" - builds and runs basic CPU/ISA topology detection, but uarch ID, cache topology, and full ISA-extension coverage are absent/incomplete | Builds and runs basic detection only | Ubuntu 24.04 `libcpuinfo0` riscv64 present; CLI utility not packaged for riscv64; Debian sid has a riscv64 build | Historically blocked TF's own riscv64 build via a missing `sys/hwprobe.h` (fixed by TF PR #63850, merged 2024-07-05); tracking issue [#124](https://github.com/pytorch/cpuinfo/issues/124) open since 2022; **PR #397 open, unreviewed** (28 ISA extensions, vendor/uarch detection) - this is the actual gate blocking complete SIMD-dispatch information for XNNPACK/oneDNN/ruy on RISC-V; PR #148 stalled 2.5 years |
| LLVM | Build-dependency (critical) | Ubuntu 26.04 resolute confirmed (`llvm` package, riscv64 among 7 architectures, v17-22); actively maintained by SiFive, but **not** part of LLVM's required pre-merge CI gate | Not gating - riscv64 absent from LLVM's required checks | No riscv64 binary in the 5 most recent GitHub Releases; available only via distro package or source build | Open correctness/miscompile issues: [#200030](https://github.com/llvm/llvm-project/issues/200030) (NaN handling), [#171978](https://github.com/llvm/llvm-project/issues/171978) (miscompile at -O2/-O3 with `rv64gcvb_zicond`), [#168308](https://github.com/llvm/llvm-project/issues/168308) (Clang misaligns kprobe arrays) |
| Python | Runtime-dependency (critical) | Standard riscv64 Python builds are broadly available via distros | Yes, generally | Yes, via distro packaging | The specific failure blocking TF's riscv64 build (#102159) is in the custom `third_party/python_riscv_repository` toolchain's interaction with `rules_python`, not in CPython itself |
| rules_python | Build-dependency (critical) | The direct proximate cause of TF's current riscv64 build failure: `current_py_cc_headers` expects a `headers` provider a custom riscv64 toolchain doesn't supply ([Issue #102159](https://github.com/tensorflow/tensorflow/issues/102159)) | N/A - build fails before test stage | N/A | Prerequisite cited by PR #102607: bazel-contrib/rules_python#3350 (riscv64 patch); older TF releases (2.19.1, 2.20.0) pin rules_python 0.39.0 vs. master's 1.6.0, raising an unresolved backport question |
| manylinux | Build-dependency (optional) | riscv64 manylinux compliance checks were added to TF's build system by the now-merged PR #103511/openxla#32812 and further extended (unmerged) by PR #102607 | N/A | No riscv64 manylinux wheel has ever been produced for TensorFlow | Compliance-check plumbing exists; no artifact results from it yet |
| BoringSSL | Build-dependency (optional) | Two mandatory LUCI CI builders verify Android NDK riscv64 cross-compile on every commit, but **neither runs tests** (compile-only) | No runtime test coverage | FIPS module reportedly rejects riscv64 [NEEDS VERIFICATION]; no standalone Debian/Ubuntu `boringssl` package - only the Android-fork `android-libboringssl` is riscv64-packaged | Historically blocked TF's flex-delegate riscv cross-compilation ([Issue #44582](https://github.com/tensorflow/tensorflow/issues/44582)) |
| oneDNN (DNNL) | Build-dependency (optional) | README explicitly labels RV64 "Experimental (limited testing validation)"; the RISC-V team (ISCAS, ZTE) holds Code-Owner, not Maintainer, status for `src/cpu/rv64/` | No hardware CI exists | Zero binary release assets for any architecture (source-only tags); PyPI wheels amd64/Windows only, no riscv64 | Open proposal for real RISC-V hardware CI ([#5170](https://github.com/uxlfoundation/oneDNN/issues/5170) - none exists today); memory-layout/VLA support gap for RVV ([#4860](https://github.com/uxlfoundation/oneDNN/issues/4860)); separately, [Issue #72479](https://github.com/tensorflow/tensorflow/issues/72479) documents a TF 2.13.0 riscv64 build failure inside oneDNN/MKL-DNN itself (`diff_src_brgemm_conf_t` has no member `isa`, caused by x86-64-specific `x64::avx512_core_bf16_amx_bf16` code path) |
| Zephyr RTOS | Build-dependency (optional) | Functional for the embedded/MCU line only - PRs #44076/#44077 (merged 2020-10-16) fix the zephyr_riscv build and hello_world demo for TFLite Micro | Demo-level validation only, not the full TF test suite | Embedded/MCU-scoped, not applicable to full TensorFlow packaging | This is the microcontroller (riscv32) lineage, distinct from the riscv64 Linux/application-class lineage covered elsewhere in this report |

**Recursed/indirect dependencies surfaced during research (not in the direct list above, included for completeness given their role in gating riscv64 SIMD/numerics):**

| Dependency | Role | riscv64 status summary |
|---|---|---|
| Eigen | Core dense linear-algebra/SIMD kernels for most TF CPU ops | RVV1.0 backend merged to `master` (Nov 2025, needs GCC>=14/Clang>=18) but **no tagged release contains it**; all riscv64 CI jobs carry `allow_failure: true` (non-blocking); vectorized transcendentals missing; [#3086](https://gitlab.com/libeigen/eigen/-/issues/3086) open (masked partial-packet tails missing for RVV) |
| XNNPACK | SIMD NN operator kernels (TFLite/TF delegate) | Dedicated `cmake-linux-riscv64` CI job builds+tests on every PR/push, "maintained tier" but weaker than ARM/x86; Ubuntu 24.04 package present but 3.5-year stale; [#8052](https://github.com/google/XNNPACK/issues/8052) open (cross-compile test failure), [#4650](https://github.com/google/XNNPACK/issues/4650) (cpuinfo build error on RISC-V) |
| Highway | SIMD abstraction layer used across TF/XLA numerics | riscv64 added to CI only 2026-06-30 (previously zero coverage); [#2738](https://github.com/google/highway/issues/2738) open, marked High severity (hardcoded `-march=rv64gcv1p0` conflicts with the RVA23 profile that is Ubuntu 25.10's default, breaks LTO with GCC 15.2) |
| ruy | Quantized/low-precision GEMM kernels (TFLite/XNNPACK path) | No RVV kernel exists - generic scalar fallback only; zero riscv64 issues found; Debian sid and Ubuntu 24.04 `libruy-dev` present but functionally unoptimized |
| Protocol Buffers | Core serialization (SavedModel/GraphDef, gRPC wire format) | Upstream's own stated assessment: "riscv64 is unsupported with no path to formal support absent a significant change in Google's resourcing"; no riscv64 protoc prebuilt in any release, no riscv64 wheel |
| gRPC | RPC framework (TF Serving/distributed TF) | Zero riscv64 wheels among 51 `grpcio` PyPI files; RISE distributes unofficial riscv64 wheels (1.72.0) as a stopgap; [#41591](https://github.com/grpc/grpc/issues/41591) open (riscv64 wheel request, no progress) |

## 10. Ecosystem Status

Not applicable. TensorFlow is a runtime/framework with system-library-style dependencies (Bazel, LLVM, Eigen, oneDNN, etc.) rather than a project with a significant *dependent* package ecosystem (packages/plugins that themselves need separate riscv64 enablement) in the sense this section is scoped to. Downstream packages that depend on TensorFlow (e.g., Keras, TF-based model repositories) are out of scope for this report and were not researched.

## 11. Known Bugs and Active Issues

**Open, unresolved (as of 2026-09-11):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#100940](https://github.com/tensorflow/tensorflow/issues/100940) | Compile Tensorflow on riscv64 platform | Open, 0 comments | High (blocks any riscv64 wheel build) | TF 2.20.0, bazel wheel-build script fails with `TypeError`/`FileNotFoundError`; no usable artifact produced |
| [#102159](https://github.com/tensorflow/tensorflow/issues/102159) | Can't compile tensorflow 2.19.1 on riscv | Open, assigned, 0 comments | High (blocks custom-toolchain builds) | `rules_python` `current_py_cc_headers` missing `headers` provider on a custom riscv64 toolchain |

**Closed/stale, illustrating recurring pain points:**

| ID | Title | Status | Notes |
|---|---|---|---|
| [#62241](https://github.com/tensorflow/tensorflow/issues/62241) | Can't link soft-float modules with double-float modules | Closed (completed) | ABI mismatch bug, is the closest thing to a correctness/linkage bug found; resolved |
| [#64987](https://github.com/tensorflow/tensorflow/issues/64987) | Cannot build TFLite 2.16.1 for RISC-V (cpuinfo hwprobe.h) | Closed/stale | Fix existed upstream in cpuinfo; TF's pin was later bumped via PR #63850, but the issue itself was closed stale without cross-linking the fix |
| [#75555](https://github.com/tensorflow/tensorflow/issues/75555) | Bazel build fails on RISC-V for TF 2.17.0 | Closed/stale | No resolution recorded |
| [#72479](https://github.com/tensorflow/tensorflow/issues/72479) | Does TensorFlow 2.13.0 support RISC-V | Closed | Documents an oneDNN/MKL-DNN riscv64 build failure caused by x86-64-specific code (`x64::avx512_core_bf16_amx_bf16`) |
| [#47636](https://github.com/tensorflow/tensorflow/issues/47636) | TFLite: Not able to build target riscv | Closed | `dlfcn.h` missing for riscv32 toolchain |
| [#44582](https://github.com/tensorflow/tensorflow/issues/44582) | flex delegate cross-compilation failed for riscv (boringssl) | Closed | - |
| [#42554](https://github.com/tensorflow/tensorflow/issues/42554) | RISC-V Vector ISA extension on CPU / RISC-V | Closed/stale | User asked whether TFLite's RVV support extends beyond mobile/IoT to server-class riscv64; left unanswered |

**Correctness bugs, specifically:** no open or closed TensorFlow issue ties a NaN/floating-point *correctness* bug to riscv64. The one substantive riscv64-specific floating-point issue (#62241) is a build-time ABI/linkage mismatch, not a runtime numerical-correctness defect. Within the dependency chain, LLVM has open riscv64 miscompile/NaN-handling issues ([#200030](https://github.com/llvm/llvm-project/issues/200030), [#171978](https://github.com/llvm/llvm-project/issues/171978)) that are a latent correctness risk for anything TF compiles through LLVM on this architecture, though no TF-level symptom has been reported.

**Recurring noise pattern:** riscv64-themed spam PRs are a recognized nuisance maintainers filter out - PR #102203 was closed as explicitly AI-generated ("AI slop with no quality control" - mihaimaruseac) and PR #57689 was closed/locked as spam (153 unrelated commits bundled with the claimed RISC-V/Shakti support).

**Performance data found (not TensorFlow-specific, included for context):** the CARRV'19 paper (Boston University + Google) measured TFLite `reference_ops`/`optimized_ops` cross-compiled for RISC-V via Spike/Rocket vs. ARM (gem5): a naive RISC-V build used ~2x more instructions than ARM-base on MobileNet-v1 variants, closing to parity after manually replicating ARM's loop optimizations, and an 8x instruction reduction was achieved using a draft RISC-V Vector ISA (v0.5) not present in mainline hardware or software today. ([CARRV'19 paper](https://carrv.github.io/2019/papers/carrv2019_paper_7.pdf)) A RISE blog post (2026-07-07) reports IREE/MLIR (not TensorFlow) YOLOv8n inference speedups of 17.3x single-thread / 12.9x multi-thread (INT8, vs. no-auto-vectorization baseline) on a Banana Pi BPI-F3 RVV-capable CPU. ([RISE blog](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)) No TensorFlow-runtime-specific, TensorFlow-vs-arm64 benchmark was found; a Springer-chapter claim of "TFLite beating TVM by 2.69x on DenseNet-121" is unverified (search-snippet only, primary source not fetched) and is marked [NEEDS VERIFICATION].

## 12. Objections and Upstream Blockers

**Stated objections:** maintainer terryheo explicitly rejected an earlier riscv CMake PR (#48099) with "RISCV is not our primary target devices" (2021) - the clearest direct statement of prioritization against RISC-V found in this research.

**Technical blockers:**
- The `rules_python` `current_py_cc_headers`/`headers`-provider mismatch is the proximate, currently-unresolved cause of both open 2025 build-failure issues.
- No riscv64-specific SIMD kernel backend exists anywhere in TFLite's optimized-kernels directory or XLA's contraction-kernel selector (Section 4) - even a successful build would run without vectorized compute.
- Downstream dependency gaps compound the blocker: Protocol Buffers' upstream has stated there is "no path to formal riscv64 support absent a significant change in Google's resourcing," and gRPC has zero official riscv64 wheels - both are structurally required for a pip-installable TensorFlow.

**Organizational blockers:**
- No RISE investment or funded work exists for TensorFlow (RISE's ML/AI effort is PyTorch-focused).
- No corporate silicon vendor (SiFive, Andes, T-Head, or any RISE member) has contributed riscv64 work to TensorFlow in the history surfaced by this research.
- Community PRs consistently stall for lack of a *second* reviewer even after a first maintainer approval (#102607 had mihaimaruseac's tentative approval in Oct 2025 but was stale-bot auto-closed five months later), and TF's development model (Copybara-mediated internal sync, merge rights restricted to Google release engineers) means an externally-approved PR still requires internal Google follow-through to land.
- No umbrella tracking issue exists to consolidate the ~15-year, ~30-item history of riscv64 attempts, making it structurally hard for maintainers or contributors to see the whole picture or prioritize a coordinated push.

**Acceptance probability:** low to moderate in the near term for full/Bazel-based riscv64 support without dedicated, sustained engineering investment (including a committed second reviewer and internal Google sponsorship for Copybara sync) - the technical path (rules_python fix, XLA:CPU target) is partially proven in PR #102607, but the pattern of stale-bot closures despite maintainer approval indicates a process/ownership gap, not a purely technical one. The TFLite/legacy-Makefile path remains the most viable near-term route to any working riscv64 TensorFlow artifact.

## 13. Readiness Assessment

**Color:** red (no color_case sub-type - red carries no case per the grading model)
**Release provider:** none
**Justification:** TensorFlow has no upstream riscv64 CI of any kind (zero references across all 17 GitHub Actions workflow files and every `ci/official/*` environment definition - [verified directly against the repository](https://github.com/tensorflow/tensorflow/tree/master/.github/workflows)), no upstream-published riscv64 binary on any channel (PyPI: zero riscv64 wheels across 1,741 files ever published; [GitHub Releases](https://github.com/tensorflow/tensorflow/releases): source tarballs only), and riscv64 support for the modern build path is confirmed currently broken: two open, unresolved 2025 issues document reproducible build failures with zero maintainer response ([#100940](https://github.com/tensorflow/tensorflow/issues/100940), [#102159](https://github.com/tensorflow/tensorflow/issues/102159)), the most substantial fix attempt was auto-closed unmerged despite a maintainer's tentative approval ([#102607](https://github.com/tensorflow/tensorflow/pull/102607)), and the Arch Linux RISC-V port cannot even build the package due to unmet dependencies (`DEP MISSING` status). No distribution ships a working full-TensorFlow riscv64 package to apply the yellow/orange distribution floor - Ubuntu's only riscv64 artifact is a stale, narrower TensorFlow Lite C++ library, not TensorFlow itself. This combination (documented, unresolved, reproducible build breakage plus no working release channel) meets the color model's red bar of "confirmed broken/non-functional," rather than the orange bar of merely "untested."

TensorFlow is a general-purpose ML framework, not a project whose sole value proposition is speed over a simpler reference alternative (the optimization-purpose test in the grading model excludes general-purpose runtimes) - the Step 2 optimization modifier therefore does not apply, and no Optimization level is reported for this project. (Separately and for context only: Section 4 shows RISC-V-specific SIMD/compute-kernel coverage inside TensorFlow's own tree is effectively absent - zero files in the TFLite optimized-kernels directory, an explicitly empty XLA contraction-kernel dependency set - which would itself cap at orange under the optimization modifier were this project optimization-purpose, but this does not apply and does not change the red primary grade.)

**Pending work that could change the grade:** the merged PR #103511 (XLA:CPU riscv64 target recognition, TF 2.21.0) and the unmerged-but-maintainer-approved PR #102607 together represent the closest existing path to a working Bazel/pip-wheel build; landing a rebased, reviewed version of #102607 (or an equivalent fix for the `rules_python` `headers`-provider gap) would be the direct unblock for both open issues. No RISE involvement currently exists to accelerate this. Upstream `pytorch/cpuinfo` PR #397 (unreviewed ISA-extension/uarch detection) would improve SIMD-dispatch quality once TensorFlow itself builds.

## 14. Investment Analysis

RISE has made **no investment of any kind in TensorFlow** - it is absent from RISE's blog, Python wheel builder package list, and every `riseproject-dev` GitHub org repository; RISE's ML/AI working-group effort is directed at PyTorch instead. Every work item below is therefore unclaimed and available for scoping.

### 14.1 Functional Enablement

The immediate blocker is the `rules_python`/`current_py_cc_headers` provider gap causing both open 2025 issues. A rebased, reviewed version of PR #102607's approach (riscv64 `rules_python` patch, manylinux compliance updates, LLVM namespace fixes, `<stdint.h>` fix) is the shortest path to a working Bazel pip-wheel build. This requires: (a) reviving and securing a second reviewer for #102607 or re-implementing its patch set, (b) resolving the GCC-vs-Clang compile difference noted during its review (Clang-17/20 work, Clang-18 hits an ICE - needs root-causing or a documented minimum-Clang-version constraint), and (c) validating the resulting wheel actually imports and runs basic ops end-to-end (neither open issue nor #102607 demonstrated a working `import tensorflow` on riscv64).

### 14.2 Performance Optimization

No RVV-accelerated kernel path exists anywhere in TFLite's optimized-kernels directory, XLA's contraction-kernel selector, or the transitively-required Eigen/oneDNN/XNNPACK/ruy dependency chain (Section 9) beyond Eigen's unreleased, non-blocking-CI RVV1.0 backend and XNNPACK's build+test riscv64 CI (whose actual kernel maturity vs. ARM/x86 was not independently benchmarked in this research). Closing this gap requires, at minimum: a riscv64 TFLite optimized-kernel dispatch file (mirroring the existing NEON/SSE files), wiring the XLA contraction-kernel selector to a real riscv64 backend instead of empty deps, and validating Eigen's RVV1.0 path against a tagged release rather than master-only.

### 14.3 CI/CD Infrastructure

No riscv64 CI exists at any level (Section 7). Minimum viable infrastructure: a dedicated `riscv64-ci.yml` workflow mirroring the existing `arm-ci.yml` structure, wired to `ci/official/envs/linux_riscv64` (does not currently exist), running at minimum a build-and-import smoke test, with a path to full test-suite execution once the functional-enablement blockers (14.1) are cleared. RISE's RISC-V Runners (native CI infrastructure, announced 2026-03-24) are a candidate resource for this but are not currently connected to TensorFlow in any way.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 was omitted; TensorFlow is not evaluated as having a significant dependent-package ecosystem under this report's scope.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `rules_python` `current_py_cc_headers` gap; revive/rebase PR #102607 approach; secure second maintainer reviewer | 4-8 | TensorFlow build-system engineer + upstream `rules_python` coordination | Critical |
| Functional | Root-cause the Clang-18 ICE / document supported-compiler matrix for riscv64 | 1-2 | Toolchain engineer | High |
| Functional | End-to-end validation: produce a riscv64 wheel, confirm `import tensorflow` and basic op execution succeed | 2-3 | QA/build engineer, needs riscv64 hardware or RISE runner access | Critical |
| Performance | Add riscv64 dispatch file(s) to TFLite `kernels/internal/optimized/` (RVV intrinsics for primary conv/matmul ops) | 8-16 | SIMD/kernels engineer, requires RVV expertise | Medium (blocked on Functional) |
| Performance | Wire XLA `xla/tsl/framework/contraction/BUILD` riscv64 case to a real kernel instead of empty deps | 4-6 | XLA compiler engineer | Medium (blocked on Functional) |
| Performance | Validate/track Eigen RVV1.0 backend into a tagged release; unblock Eigen's `allow_failure: true` riscv64 CI | 2-4 (upstream-dependent, not TF-owned) | Eigen upstream, TF as consumer/tracker | Medium |
| CI/CD | Stand up `riscv64-ci.yml` + `ci/official/envs/linux_riscv64`, build-only smoke test to start | 3-5 | CI/build-infra engineer | High |
| CI/CD | Extend riscv64 CI from build-only to full test-suite execution | 4-8 (blocked on Functional) | CI/build-infra engineer | Medium |
| Dependencies | Track/accelerate `pytorch/cpuinfo` PR #397 (ISA-extension/uarch detection) review | 1-2 (advocacy/co-review, not implementation) | Dependency liaison | Medium |
| Dependencies | Engage Protocol Buffers and gRPC upstreams on riscv64 wheel/release gaps, or sponsor a fix | 4-8 (cross-project coordination) | Dependency liaison | High (structural blocker for pip-installable TF) |

## 15. Updates

(No updates yet - initial report dated 2026-09-11.)

## 16. References

- [tensorflow/tensorflow repository](https://github.com/tensorflow/tensorflow)
- [tensorflow.org](https://tensorflow.org/)
- [Issue #100940 - Compile Tensorflow on riscv64 platform](https://github.com/tensorflow/tensorflow/issues/100940)
- [Issue #102159 - Can't compile tensorflow 2.19.1 on riscv](https://github.com/tensorflow/tensorflow/issues/102159)
- [Issue #75555 - Bazel build fails on RISC-V for TensorFlow 2.17.0](https://github.com/tensorflow/tensorflow/issues/75555)
- [Issue #64987 - Cannot build TFLite 2.16.1 for RISC-V (cpuinfo hwprobe.h)](https://github.com/tensorflow/tensorflow/issues/64987)
- [Issue #62241 - can't link soft-float modules with double-float modules](https://github.com/tensorflow/tensorflow/issues/62241)
- [Issue #62150 - Cross compilation TensorFlow Lite with CMake mat error](https://github.com/tensorflow/tensorflow/issues/62150)
- [Issue #72479 - Does TensorFlow 2.13.0 support RISC-V](https://github.com/tensorflow/tensorflow/issues/72479)
- [Issue #69689 - Cannot cross-compile minimal tflite example](https://github.com/tensorflow/tensorflow/issues/69689)
- [Issue #47636 - TFLite: Not able to build target riscv](https://github.com/tensorflow/tensorflow/issues/47636)
- [Issue #47622 - Build TFLite Micro for RISC-V](https://github.com/tensorflow/tensorflow/issues/47622)
- [Issue #50347 - Build TFLite Micro for riscv32_mcu](https://github.com/tensorflow/tensorflow/issues/50347)
- [Issue #44582 - flex delegate cross-compilation failed for riscv (boringssl)](https://github.com/tensorflow/tensorflow/issues/44582)
- [Issue #42554 - Regarding RISC-V Vector ISA extension on CPU](https://github.com/tensorflow/tensorflow/issues/42554)
- [Issue #33677 - tflite:experimental:micro:riscv default build target wrong](https://github.com/tensorflow/tensorflow/issues/33677)
- [Issue #32041 - micro: riscv32_mcu build failed with undefined references](https://github.com/tensorflow/tensorflow/issues/32041)
- [Issue #26727 - Support RISCV with tfcompile --target_tuple](https://github.com/tensorflow/tensorflow/issues/26727)
- [PR #103511 - [XLA:CPU] Add support for riscv64 (merged)](https://github.com/tensorflow/tensorflow/pull/103511)
- [PR #103488 - [XLA:CPU] Add support for riscv64 (duplicate, closed)](https://github.com/tensorflow/tensorflow/pull/103488)
- [PR #102607 - Add support for Linux RISC-V 64 (closed, unmerged)](https://github.com/tensorflow/tensorflow/pull/102607)
- [PR #102203 - "spam" Add RISC-V 64-bit architecture support (closed as spam)](https://github.com/tensorflow/tensorflow/pull/102203)
- [PR #63850 - update cpuinfo (merged)](https://github.com/tensorflow/tensorflow/pull/63850)
- [PR #61581 - Add RISC-V platform support with cmake in TFLite (closed)](https://github.com/tensorflow/tensorflow/pull/61581)
- [PR #61268 - add-support-for-riscv (closed stale)](https://github.com/tensorflow/tensorflow/pull/61268)
- [PR #57689 - Tflite runtime shakti (closed/locked as spam)](https://github.com/tensorflow/tensorflow/pull/57689)
- [PR #48099 - Add riscv platform support for tflite with cmake (closed)](https://github.com/tensorflow/tensorflow/pull/48099)
- [PR #45844 - Risc-V Linux port for TensorFlow Lite (merged)](https://github.com/tensorflow/tensorflow/pull/45844)
- [PR #44077 - Fix zephyr_riscv build process (merged)](https://github.com/tensorflow/tensorflow/pull/44077)
- [PR #44076 - Fix zephyr_riscv hello_world demo (merged)](https://github.com/tensorflow/tensorflow/pull/44076)
- [PR #42715 - TFLM: Added VexRISCV optimized DepthwiseConv2d kernel (merged)](https://github.com/tensorflow/tensorflow/pull/42715)
- [PR #38111 - Add Zephyr support to TF Lite micro (merged)](https://github.com/tensorflow/tensorflow/pull/38111)
- [PR #36118 - Riscv 32 mcu (merged)](https://github.com/tensorflow/tensorflow/pull/36118)
- [PR #33972 - Fix riscv32_mcu link failure (merged)](https://github.com/tensorflow/tensorflow/pull/33972)
- [Commit 929e9a0 - first CL extending TFlite infrastructure for RISC-V](https://github.com/tensorflow/tensorflow/commit/929e9a09dfa215d5b4c546a8d05ac3b6956e6d01)
- [tensorflow/tensorflow .github/workflows directory](https://github.com/tensorflow/tensorflow/tree/master/.github/workflows)
- [PyPI tensorflow package JSON](https://pypi.org/pypi/tensorflow/json)
- [RISE GitLab wheel builder PyPI proxy for tensorflow](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/tensorflow/)
- [Arch Linux RISC-V port status page](https://archriscv.felixc.at/.status/status.htm)
- [Ubuntu ports riscv64 universe archive index](https://ports.ubuntu.com/ubuntu-ports/dists/resolute/universe/binary-riscv64/Packages.gz)
- [riseproject.dev](https://riseproject.dev/)
- [RISE blog - Optimizing IREE compilation and object detection pipeline for RISC-V](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)
- [riseproject-dev/pytorch-ci](https://github.com/riseproject-dev/pytorch-ci)
- [riseproject-dev/ai-ml-wg](https://github.com/riseproject-dev/ai-ml-wg)
- [CARRV'19 - Towards Deep Learning using TensorFlow Lite on RISC-V](https://carrv.github.io/2019/papers/carrv2019_paper_7.pdf)
- [arXiv:2405.15380 - Full-stack evaluation of Machine Learning inference workloads for RISC-V systems](https://arxiv.org/pdf/2405.15380)
- [pytorch/cpuinfo Issue #124 - riscv64 tracking](https://github.com/pytorch/cpuinfo/issues/124)
- [pytorch/cpuinfo PR #397 - ISA extension/uarch detection (unreviewed)](https://github.com/pytorch/cpuinfo/pull/397)
- [LLVM Issue #200030 - NaN handling](https://github.com/llvm/llvm-project/issues/200030)
- [LLVM Issue #171978 - miscompile at -O2/-O3 with rv64gcvb_zicond](https://github.com/llvm/llvm-project/issues/171978)
- [uxlfoundation/oneDNN Issue #5170 - RISC-V hardware CI proposal](https://github.com/uxlfoundation/oneDNN/issues/5170)
- [google/highway Issue #2738 - hardcoded -march=rv64gcv1p0 conflicts with RVA23](https://github.com/google/highway/issues/2738)
- [grpc/grpc Issue #41591 - riscv64 wheel request](https://github.com/grpc/grpc/issues/41591)