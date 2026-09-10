---
title: ggml
parent: Project Reports
color: blue
dependencies:
  - name: OpenMP
    relation: runtime-dependency
    criticality: critical
  - name: OpenBLAS
    relation: build-dependency
    criticality: optional
  - name: oneDNN
    relation: build-dependency
    criticality: optional
  - name: Intel MKL
    relation: build-dependency
    criticality: optional
  - name: shaderc
    relation: build-dependency
    criticality: optional
  - name: CUDA
    relation: build-dependency
    criticality: optional
  - name: ROCm
    relation: build-dependency
    criticality: optional
  - name: memkind
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" focus="ggml" %}

# ggml

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** blue<br/>
**Optimization level:** full<br/>
**Scope:** RISC-V (riscv64/linux) support status for ggml<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

ggml ([github.com/ggml-org/ggml](https://github.com/ggml-org/ggml)) is a C/C++ tensor library providing CPU SIMD kernels and GPU backends for machine-learning inference, MIT licensed. The project formerly lived under the `ggerganov` GitHub owner; that owner no longer resolves and the project now lives under the `ggml-org` organization. The core library is developed primarily inside its sibling repository [ggml-org/llama.cpp](https://github.com/ggml-org/llama.cpp) and periodically synced/split into `ggml-org/ggml` - ggml's own `CONTRIBUTING.md` redirects core-library contributors to open PRs against `llama.cpp` instead, stating it is "more visible, better tested, more likely to be reviewed."

**Governance:** There is no software foundation affiliation (no Linux Foundation, PSF, Apache, or similar). No `MAINTAINERS`, `OWNERS`, `CODEOWNERS`, or `GOVERNANCE` file exists in either repo. Georgi Gerganov is the de facto BDFL and by far the top committer (1,138 of the last several thousand commits). `llama.cpp`'s `CONTRIBUTING.md` describes an informal three-tier structure: Contributors (no special privileges), Collaborators/Triage (own specific code areas), and Maintainers (final merge authority, can decline review or close PRs without explanation).

**Community stance on new ports/backends:** explicitly phased and CPU-first. Guidance states to "focus on CPU support only in the initial PR... add support for other backends... in follow-up PRs," and that a contributor adding a platform/backend should commit to long-term maintenance or find a collaborator who will.

**Corporate contributors** (by commit history / email domain): NVIDIA (Jeff Bolz, Oliver Simons), Qualcomm (Max Krasnyansky, lhez, Hongqiang Wang), Red Hat (Ruben Ortlam), Intel (Neo Zhang Jianyu and others, SYCL/oneAPI), Codeplay (SYCL, Intel-owned), Arm (Charles Xu, Dan Johansson, Dibakar Gope), AMD (Konstantin Zhuravlyov, amd-dwang), Samsung, IBM (one contributor each), Hugging Face (Adrien Gallouet), and SpacemiT (a RISC-V chip vendor; alex-spacemit/cailinxi, `spacemit.com`). Georgi Gerganov and most other top-line committers (slaren/Diego Devesa, Johannes Gassler, 0cc4m) commit from personal addresses, i.e. formally unaffiliated despite being the de facto core team.

**RISE membership:** `ggml`/`ggerganov`/`llama.cpp` are not listed as RISE members. SpacemiT, however, is a RISE General Member, and SpacemiT engineers directly authored ggml's dedicated RISC-V vendor backend (see Section 4). Source: [RISE members page](https://riseproject.dev).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2023-05-25/27 | PR #197 (mistitled "ADD Support for CLBLAST"; actual content is the foundational RISC-V enablement: guards x86 `immintrin.h` behind `#if !defined(__riscv)`), by apcameron, merged as commit `72dbb51c`, closes old issue #129 | [PR #197](https://github.com/ggml-org/ggml/pull/197) |
| 2023-09-01 | First RVV intrinsics for q4_0/q4_1/q5_0/q5_1/q8_0 dot products, commit `5aec2cf` (llama.cpp PR #2929) | commit `5aec2cf` |
| 2024-07-22 | "fix compile error for RISC-V" (Mark Zhuang), basic scalar build maintenance | commit history |
| 2024-09-12 | Makefile changes + `RISCV_VECT` log flag, commit `2b00fa7` (llama.cpp PR #9442, Ahmad Tameem) | commit `2b00fa7` |
| 2024-10-30 | "add Q4_0_8_8 RISC-V GEMV and GEMM kernels" (xctan) - first quantized-kernel vector optimization | commit history |
| 2024-11-20 | "add cmake rvv support" (haopeng) | commit history |
| 2025-03-27 | 128-bit RVV support for k-quant kernels, commit `24feaec` (llama.cpp PR #12530) | commit `24feaec` |
| 2025-05-27 | xtheadvector support, commit `05f6ac6` (llama.cpp PR #13720) | commit `05f6ac6` |
| 2025-08-13/08-21 | Native RISC-V RVV1.0 hardware CI runners added/enabled (Cloud-V pipeline to GitHub Actions), commits `648ebcd` (PR #14439) and `029bb39` (PR #15386) | commit history |
| 2025-08-27/09-03 | Basic RVV support for vector f32 ops / RVV kernel optimization (xctan), commit `05c0380` (llama.cpp PR #15720) | commit `05c0380` |
| 2025-09-29 | "ggml: riscv: add riscv spacemit backend" (alex-spacemit, SpacemiT), commit `b77e6c1` (llama.cpp PR #15288) - new vendor matrix-extension backend with dedicated CI | commit `b77e6c1` |
| 2025-11-02 | "ci: disable failing riscv cross build" - a regression that temporarily disabled RISC-V CI in llama.cpp, commit `dd52868` (PR #16952) | commit `dd52868` |
| 2025-11-29 | Replace `hwcap` with `riscv_hwprobe` for RVV detection, commit `f698a79` (llama.cpp PR #17567) | commit `f698a79` |
| 2026-04-16 | "implemented simd_gemm kernel for riscv vector extension," commit `5637536` (llama.cpp PR #20627, synced into ggml-org/ggml as `44ff4e8`) | commit `5637536` |
| 2026-05-02 | PR #1475 opened - gate cpu-riscv64 backend on Zv* sub-extensions (SIGILL prevention), still open, zero reviews | [PR #1475](https://github.com/ggml-org/ggml/pull/1475) |
| 2026-06-10 | Issue #1535 opened - OpenBSD/riscv64 build fails on `zve32f`-gated `vfloat32m8_t` type | [Issue #1535](https://github.com/ggml-org/ggml/issues/1535) |
| 2026-07-19 | PR #1571 opened - fixes #1535 by correcting `__riscv_v` vs `__riscv_v_intrinsic` macro confusion, still open, zero reviews, already adopted downstream (Thunderbird/Firefox) pre-merge | [PR #1571](https://github.com/ggml-org/ggml/pull/1571) |

**Key contributors and orgs:** apcameron (foundational enablement, independent), xctan (RVV kernel work, independent), Ahmad Tameem, haopeng, Mark Zhuang (independent contributors), alex-spacemit/cailinxi (SpacemiT, vendor matrix-extension backend).

**Is it fully upstream?** The core RVV enablement and kernel work is fully merged and upstream (landed via `llama.cpp`, synced into `ggml-org/ggml`). Two robustness/correctness fixes (#1475, #1571) remain open and unmerged as of the research date, both narrow in scope (runtime sub-extension gating, compiler-macro correction) rather than missing functionality. There is no dedicated RISC-V tracking/meta issue in `ggml-org/ggml`; support has landed entirely through individual point PRs.

## 3. Upstream Support Tier

No formal Tier-1/2/3 policy document was found in either repo. The `ggml-org/ggml` README implicitly signals a tier: RISC-V is one of only three architectures called out as "SIMD-optimized" (alongside x86 and ARM), ahead of merely "cross-platform"-supported LoongArch, PowerPC, s390x, and WebAssembly - indicating RISC-V has reached a favored/first-class tier in practice, without a written tier document.

**CI evidence (read directly, not inferred):** `ggml-org/ggml`'s own four GitHub Actions workflow files (`build-cpu.yml`, `build-self-hosted.yml`, `make-release.yml`, `release.yml`) and `ci/run.sh` contain zero riscv references. `ggml-org/llama.cpp` - the repo ggml's own `CONTRIBUTING.md` designates as the actual development location, from which code syncs into the `ggml` mirror - has a dedicated `build-riscv.yml` workflow running on native riscv64 hardware (`ubuntu-24.04-riscv`, via RISE/Cloud-V), executing a full build plus `ctest` test suite plus three separate ASan/TSan/UBSan sanitizer jobs.

**Release-blocking status:** Data not available - whether a riscv64 CI failure in `llama.cpp` blocks merge was not determined by this research.

**Official binaries:** none, for any architecture. GitHub Releases for `ggml-org/ggml` (checked v0.23.0, 2026-09-04) contain only source archives (`v0.23.0.zip`, `v0.23.0.tar.gz`), no compiled binaries of any kind. This is a project-wide policy, not a riscv64-specific gap.

**Comparison table (within `ggml-org/ggml`'s own CI):**

| Architecture | CI: build | CI: test | Sanitizers | Native hardware | Official binary release |
|---|---|---|---|---|---|
| amd64 | yes (`build-cpu.yml` x64-cpu jobs) + self-hosted CUDA/Vulkan jobs | yes | not found in ggml-org/ggml workflows | yes | no |
| arm64 | yes (`build-cpu.yml` arm64-cpu + SVE jobs) + self-hosted mac-metal/mac-vulkan jobs | yes | not found in ggml-org/ggml workflows | yes | no |
| riscv64 | **no** (`ggml-org/ggml` has zero riscv CI); **yes** in sibling `ggml-org/llama.cpp` (`build-riscv.yml`) | **no** in `ggml-org/ggml`; **yes** in `llama.cpp` | **no** in `ggml-org/ggml`; **yes** (ASan/TSan/UBSan) in `llama.cpp` | yes, in `llama.cpp` (RVV1.0, RISE/Cloud-V) | no |

Sources: [build-cpu.yml, build-self-hosted.yml, make-release.yml, release.yml (ggml-org/ggml)](https://github.com/ggml-org/ggml/tree/master/.github/workflows), [llama.cpp RISC-V CI investigation summary](https://github.com/ggml-org/llama.cpp).

## 4. Technical Architecture and RISC-V-Specific Subsystems

ggml has three layers of RISC-V-specific code:

**1. CPU backend** (`src/ggml-cpu/arch/riscv/`): `quants.c` (6,596 lines, 1,744 RVV intrinsic call sites) - full RVV-vectorized quantize/dequantize/dot-product kernels for essentially all ggml quant formats (Q4_0/1, Q5_0/1, Q8_0, Q2_K-Q6_K, IQ1_S/M, IQ2_*, IQ3_*, IQ4_*); `repack.cpp` (1,703 lines, 726 RVV intrinsic call sites) - RVV GEMM/GEMV kernels for repacked quant formats; `cpu-feats.cpp` (38 lines) - real runtime feature probing via the `riscv_hwprobe` syscall, not a stub. Kernels are VL-specialized (separate hand-written variants for VLEN 128/256/512/1024, dispatched via `__riscv_vlenb()`), plus a hand-written inline-assembly `xtheadvector` path for older T-Head cores, with scalar fallback only for unrecognized VLEN.

**2. SpacemiT "IME" vendor accelerator backend** (`src/ggml-cpu/spacemit/`, 15 files, 15,439 lines): targets SpacemiT's X60/X100/X200/A60/A100/A200 RISC-V SoC cores using a proprietary Integrated Matrix Extension (custom instructions `vmadot`, `vfwmadot`, `vmadot.hp`, `vpack`, `vnspack`). Vendor-contributed and vendor-maintained (SpacemiT authored `ime2_kernels.cpp`, the largest single file in the RISC-V tree at 5,768 lines). Off by default (`GGML_CPU_RISCV64_SPACEMIT=OFF`); requires GCC >= 15 for the full `xsmtvdotii` instruction subset, falls back to IME1/IME2 subset probing otherwise via `cmake/FindSMTIME.cmake`.

**3. Separate offload backend `ggml-et`**: ahead-of-time cross-compiled bare-metal RISC-V ELF kernels (~35 compute kernels, `rv64imf` baseline, `riscv64-unknown-elf` toolchain, freestanding/no-stdlib) for an Esperanto-Technologies-style accelerator. This is AOT cross-compilation, not JIT - ggml has no JIT compilation path for RISC-V (unlike some of its CUDA/Vulkan shader-JIT paths for other backends).

**ISA extensions used:** RVV (V 1.0) as the primary vector extension; Zfh (scalar half-float), Zvfh (vector half-float), Zicbop (cache-block prefetch), Zihintpause, Zba (bit-manipulation; referenced but not declared as a CMake `option()` - must be passed explicitly), Zvfbfwma (bf16 widening multiply-add, off by default), XTheadVector (T-Head's pre-standard vector ISA, off by default), and SpacemiT's custom `xsmtvdotii`/IME instructions.

**Quant-format coverage:** riscv covers 24 of 26 quant kernels that arm/x86 cover, missing only `nvfp4_q8_0` (new/rare) and `q2_0_q8_0` (arm-only anyway) - near-total parity.

**TODO/FIXME/stub density:** essentially none - one hit repo-wide in the base `arch/riscv` code (a micro-optimization comment inside working inline asm).

**Comparison table (line counts, base CPU-backend arch directories):**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `quants.c` | 4,108 | 4,319 | 6,596 |
| `repack.cpp` | 6,407 | 5,156 | 1,703 |
| `cpu-feats.cpp` | 327 | 41 | 38 |
| Total (base arch dir) | 10,842 | 9,516 | 8,337 |
| Dedicated vendor accelerator backend | none found in base arch dirs of this comparison | none found | SpacemiT IME, 15 files / 15,439 lines |
| Runtime feature detection | real (cpuid-based) | real | real (`riscv_hwprobe` syscall) |
| Multi-VL / multi-ISA variants | N/A | N/A | VLEN 128/256/512/1024 + xtheadvector + scalar fallback |

Sources: [ggml-org/ggml repository](https://github.com/ggml-org/ggml), local clone inspection (HEAD `e91ded1`, 2026-09-04).

## 5. Build System, Cross-Compilation, and Toolchain

CMake-based (`cmake_minimum_required(VERSION 3.14...3.28)`, no riscv-specific version bump). No `BUILDING.md`, `INSTALL`, or cross-compilation doc exists (`docs/` contains only `gguf.md`). No riscv64 toolchain file (`cmake/riscv64.cmake` or similar) ships with the repo, and no Dockerfile exists anywhere in the tree.

**Root `CMakeLists.txt` options (lines 171-179):**

```
option(GGML_RVV             "ggml: enable rvv"               ON)
option(GGML_RV_ZFH          "ggml: enable riscv zfh"         ON)
option(GGML_RV_ZVFH         "ggml: enable riscv zvfh"        ON)
option(GGML_RV_ZICBOP       "ggml: enable riscv zicbop"      ON)
option(GGML_RV_ZIHINTPAUSE  "ggml: enable riscv zihintpause" ON)
option(GGML_RV_ZVFBFWMA     "ggml: enable riscv zvfbfwma"    OFF)
option(GGML_XTHEADVECTOR    "ggml: enable xtheadvector"      OFF)
```

`GGML_RV_ZBA`, `GGML_CPU_RISCV64_SPACEMIT`, and `GGML_INTERNAL_RVV` are consumed by `src/ggml-cpu/CMakeLists.txt` but are not declared as `option()` anywhere - undocumented/internal cache variables that must be passed explicitly (e.g. `-DGGML_RV_ZBA=ON`).

Default single-variant build produces `-march=rv64gcv_zfh_zvfh_zicbop_zihintpause -mabi=lp64d`. Arch auto-detection is a bare `CMAKE_SYSTEM_PROCESSOR MATCHES "riscv64"` match in `cmake/common.cmake` - it does not set this for you when cross-compiling.

**Compiler version requirements:** the only explicit version gate anywhere in the build system is GCC >= 15, and it applies only to the SpacemiT `xsmtvdotii` path (`_xsmtvdotii` is appended to `-march` only if `CMAKE_C_COMPILER_ID STREQUAL "GNU" AND CMAKE_C_COMPILER_VERSION VERSION_GREATER_EQUAL 15`). For the general (non-SpacemiT) path, ggml imposes no version check at all - it emits the `-march=` string and relies on the toolchain to accept it.

**Cross-compilation example (toolchain file must be hand-written; not shipped by ggml):**

```
set(CMAKE_SYSTEM_NAME Linux)
set(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER   riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER riscv64-linux-gnu-g++)
```

**`GGML_CPU_ALL_VARIANTS` fat-binary path** (`src/CMakeLists.txt`): builds two runtime-dispatched `.so` variants, `riscv64_0` (baseline rv64gc) and `riscv64_v` (rv64gc_v), selected at load time via the `riscv_hwprobe` syscall in `cpu-feats.cpp`. Requires `GGML_BACKEND_DL=ON`, Linux-only (`FATAL_ERROR "Unsupported RISC-V target OS"` on any other OS).

**QEMU:** no QEMU usage exists in ggml's build system or CI. The single "qemu" hit repo-wide is an unrelated runtime code comment in `src/ggml-cpu/spacemit/ime_env.cpp` (a fallback for SpacemiT core-topology detection when `/sys` CPU enumeration returns empty under QEMU user-mode emulation) - it has nothing to do with building or testing.

**Known build failures:** Issue #1535 - `ggml-0.14.0` build fails on OpenBSD/riscv64 with `RISC-V type 'vfloat32m8_t' requires the 'zve32f' extension` at `src/ggml-cpu/vec.h:608`, root-caused to Clang defining `__riscv_v_intrinsic` even when the vector extension isn't actually selected for the target. Fix proposed in open PR #1571 (switches gating to `__riscv_v`). Source: [Issue #1535](https://github.com/ggml-org/ggml/issues/1535), [PR #1571](https://github.com/ggml-org/ggml/pull/1571).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:**
- OpenBSD/riscv64 currently fails to build (#1535, open, fix in #1571 pending merge) - a genuine, currently-unfixed functional gap on that OS/compiler combination.
- Binaries compiled for a fully-featured RVA23 target (using Zvbb/Zvbc/Zvkb/Zvkn*/Zvfh) SIGILL when run on baseline RVA23 hardware lacking those sub-extensions - the runtime detection only checks for base RVV support today. Fix in open PR #1475 (adds per-extension `riscv_hwprobe` gating so the backend refuses registration and falls back to scalar rather than crashing) - unmerged, zero reviews recorded as of the research date.
- `GGML_RV_ZBA` is referenced in `src/ggml-cpu/CMakeLists.txt` but has no corresponding root-level `option()` - a minor upstream inconsistency/dead flag that silently does nothing unless passed manually.

**Performance gaps:**
- 2 of 26 quant kernels missing (`nvfp4_q8_0`, `q2_0_q8_0` - the latter arm-only anyway) - minor.
- Generic RVV code performs poorly on SpacemiT's matrix-engine-oriented A100 cores without the vendor IME2 backend: benchmark data shows 2.49 t/s (plain RVV) vs 111.14 t/s (IME2 binary) on prompt processing, a 44.6x gap. The IME2 backend is off by default and requires GCC >= 15 - deployments on A100-class SpacemiT hardware that do not explicitly enable it leave large performance on the table. Source: [Phoronix - RISC-V RVV Vector Performance Benchmarks With The SpacemiT K3 SoC](https://www.phoronix.com/review/risc-v-rvv-vector-benchmarks/4).

**Security hardening gaps:** Data not available - riscv64-specific hardening flags (stack protector, CFI, shadow stack) were not covered by this research.

**NaN / floating-point semantics:** No riscv64-specific NaN-correctness issue was found in the `ggml-org/ggml` tracker (a dedicated "riscv nan floating point" search returned only #1535, which is a build-time type-gating issue, not a runtime NaN-semantics bug).

**Downstream correctness signal (`ggml-org/llama.cpp`, which shares this code):** 33 riscv64-tagged issues, almost all closed/fixed, indicating active iterative hardening rather than a stable, settled baseline. Examples: SIGILL on SiFive P550 (#24250), "ggml-cpu riscv rvv 16x1 repack causes hard crash" (#22655), "RISC-V fails with GGML_CPU_ALL_VARIANTS=ON" (#21064), "Build fails on RISC-V without RVV" (#20669), incorrect `__riscv_v_intrinsic` macro usage (#22159), illegal instruction on StarFive VisionFive2 (#14926), and a closed feature request "Add riscv64 to release binaries" (#20988 - "closed" does not confirm it shipped; [NEEDS VERIFICATION]).

## 7. CI/CD Infrastructure

`ggml-org/ggml`'s own CI has zero riscv64 coverage, confirmed by reading all four of its workflow files plus `ci/run.sh` directly (see Section 3). `ggml-org/llama.cpp` - the repo where ggml's core development actually happens - has a dedicated `build-riscv.yml` running on native riscv64 hardware (`ubuntu-24.04-riscv`): full build plus `ctest` test suite plus three sanitizer jobs (ASan/TSan/UBSan). A commented-out riscv cross-compile job also exists in `build-cross.yml`, superseded by the native-hardware job.

**RISE involvement:** RISE hosts a dedicated `spacemit-k1` runner pool (RVV 1.0-enabled hardware, via a Cloud-V partnership) specifically for `ggml-org/*`, `riseproject-dev/llama.cpp`, and `riseproject-dev/llama.cpp-validation`, distinct from the shared default pool (`scaleway-em-rv1`) other projects use. Per RISE's blog post ["RISE RISC-V Runners: Six Weeks In"](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/) (covering 2026-03-19 to 2026-05-06): llama.cpp is the single heaviest consumer of RISE's RISC-V CI, with 2,589 jobs, out of more than 13,000 total jobs across 197 repositories and 87 organizations in that window - "upstream llama.cpp now exercises every change against native RISC-V hardware on every CI run."

**Regression note:** commit `dd52868` (llama.cpp PR #16952, 2025-11-02) "ci: disable failing riscv cross build" temporarily disabled RISC-V CI at that point; subsequent commits (native hardware CI, sanitizer jobs) indicate it was restored/expanded afterward.

**Comparison table:**

| Architecture | CI in `ggml-org/ggml` | CI in `ggml-org/llama.cpp` | Native hardware | RISE-funded |
|---|---|---|---|---|
| amd64 | yes | not directly researched | yes | no |
| arm64 | yes | not directly researched | yes (mac-metal/mac-vulkan self-hosted) | no |
| riscv64 | no | yes (build + test + 3 sanitizers) | yes (RVV 1.0, Cloud-V) | yes (dedicated spacemit-k1 pool) |

Sources: [RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/), [RISE runner architecture docs](http://riscv-runners.riseproject.dev/docs/architecture/ghfe).

## 8. Distribution and Release Status

**GitHub Releases (`ggml-org/ggml`):** v0.23.0 (2026-09-04) ships only source archives (`v0.23.0.zip`, `v0.23.0.tar.gz`) - no compiled binaries for any architecture, riscv64 included. This is a project-wide policy, not riscv64-specific.

**PyPI:** a package named `ggml` exists on PyPI (v0.0.3) but is confirmed to be an unrelated project ("GridGain ML Python API"), pure `py3-none-any`, not a build of `ggml-org/ggml`. No official PyPI package for this project exists under any name found.

**RISE GitLab wheel builder:** the endpoint for `ggml` (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/ggml/`) returns an HTTP 302 redirect to public PyPI - no dedicated RISE-built wheel. `ggml` is also absent from the [RISE wheel_builder's supported package list](https://riseproject.gitlab.io/python/wheel_builder/) (~80 packages, no ggml).

**Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at)): all four repo sections (core/extra/community/unsupported) checked under `riscv64` - zero matches for `ggml` or `llama`. Not packaged.

**Ubuntu 26.04 (Resolute):** confirmed present and byte-verified. `libggml-dev`, `libggml0`, `libggml0-backend-blas`, and `libggml0-backend-vulkan` are built for riscv64 (versions 0.9.11-1 and, more recently, 0.22.0-1 / 0.22.0-1ubuntu1, rebuilt as recently as 2026-09-07, the same day as verification). `libggml0-backend-hip` is amd64/arm64 only, expected since HIP/ROCm does not target RISC-V. Verification downloaded `libggml0_0.22.0-1ubuntu1_riscv64.deb` (953,700 bytes) directly from `ports.ubuntu.com` and confirmed a valid Debian binary package structure (`debian-binary`, `control.tar.zst`, `data.tar.zst`). No riscv64-specific patches were found in the packaging - this is built from unmodified upstream source. Source: [Ubuntu package page](https://packages.ubuntu.com/search?keywords=ggml&suite=resolute&searchon=names&section=all).

**What a user must do to get a working riscv64 binary today:** install from Ubuntu 26.04 universe (`apt install libggml0 libggml-dev`), or build from source (no upstream toolchain file or Dockerfile is provided - a CMake toolchain file must be hand-written, per Section 5).

## 9. Dependencies

ggml's default CPU-only build path has no external SIMD/numerics dependency for riscv64 - RVV support is inline intrinsics in `ggml-cpu` itself. The dependencies below are the optional accelerator/backend paths.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| Threads (pthreads) | Core, required | ships on every riscv64 Linux distro | n/a | n/a | Not a real risk |
| OpenMP (libgomp/libomp) | Default-ON CPU parallelism | GCC's libgomp builds fine on riscv64; LLVM's libomp has known gaps | mixed | distro-shipped | Open upstream issues: `llvm-project#87026` "[riscv][openmp] libomp build fails on risc-v" (open); `llvm-project#99427` (open, riscv32 only) |
| OpenBLAS | Optional BLAS/numerics backend (`GGML_BLAS`) | dedicated `RISCV64_ZVL128B`/`RISCV64_ZVL256B` targets, active work | active, ongoing hardening | regular tagged releases include riscv64 | 75 riscv64-tagged issues in `OpenMathLib/OpenBLAS` (most closed); open `#4050` "risc-v vector v1.0 support"; recent closed: `#5811` DGEMM regression on SpaceMiT K1, `#5428` broken ZVL128B/ZVL256B targets, `#5279` missing FP16/BF16 GEMM kernels |
| oneDNN/DNNL | Numerics + JIT kernel backend (SYCL path) | no dedicated riscv64 CI hardware upstream | emulator/QEMU-only reports | not distributed | `uxlfoundation/oneDNN#5170` "Proposal to add a real RISC-V hardware CI validation platform" (open, i.e. still emulated only); `#4860` "need better ways to extend memory layouts... for VLA on RISC-V vector systems" (open, architectural gap) |
| Intel MKL | Alternate numerics backend | not applicable, closed-source, Intel-arch only | n/a | n/a | Architectural exclusion |
| Vulkan / SPIRV-Headers / glslc | GPU backend, JIT shader compilation | header repos build fine, arch-neutral; real gap is riscv64 GPU driver availability | depends on hardware GPU | N/A without hardware GPU | `KhronosGroup/Vulkan-Headers`: 0 riscv64 issues |
| CUDA / cuBLAS / NCCL / CCCL | GPU numerics + JIT (PTX) | not applicable, no riscv64 CUDA target | n/a | n/a | Architectural exclusion |
| ROCm / hipBLAS / rocBLAS / RCCL | GPU numerics | not applicable, no official riscv64 ROCm target | n/a | n/a | Architectural exclusion |
| memkind | CPU HBM allocator (`GGML_CPU_HBM`) | no riscv64-specific evidence found | unknown | unknown | Niche x86 HBM/Optane library, low priority |
| KleidiAI | ARM-optimized matmul kernels | N/A by design - ggml's CMake hard-fails if target isn't AArch64 | n/a | n/a | Not a riscv64 concern |

**Deep-dive - OpenBLAS:** functional but still actively shaking out correctness/perf bugs on riscv64 (per its own issue tracker). ggml's optional `GGML_BLAS` path depends on it via `pkg_check_modules`.

**Deep-dive - oneDNN:** riscv64 validation is emulator-only per the maintainers' own open proposal to add real hardware CI (`#5170`), and there is an open architectural gap around VLA memory-layout support for RISC-V vector systems (`#4860`). This is the weakest link among ggml's optional numerics dependencies for riscv64.

**Downstream signal:** `ggml-org/llama.cpp` (embeds ggml directly) shows 33 riscv64-tagged issues, almost all closed/fixed - active, iterative hardening (see Section 6 for examples).

**Method caveat:** the `project-graph` MCP server (Ubuntu 26.04 package-graph database) was unreachable in every research pass this session (`CONNECTION_CLOSED`) - this is a tool failure, not evidence of absence. Distro-availability findings above rely on direct `packages.ubuntu.com` and `ports.ubuntu.com` checks instead.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#1535](https://github.com/ggml-org/ggml/issues/1535) | ggml-0.14.0 build fails on OpenBSD/riscv64 | Open (2026-06-10) | Build-blocking (OpenBSD/riscv64 only) | Root cause: Clang defines `__riscv_v_intrinsic` even when vector ext not selected. Fix in #1571 |
| [#1475](https://github.com/ggml-org/ggml/pull/1475) | ggml-cpu/riscv: gate cpu-riscv64 backend on Zv* sub-extensions | Open PR (2026-05-02) | Correctness (SIGILL on baseline hardware) | Zero reviews recorded; adds `riscv_hwprobe` gating so backend registration is refused rather than crashing |
| [#1571](https://github.com/ggml-org/ggml/pull/1571) | Gate RVV code on the target extension | Open PR (2026-07-19) | Correctness (fixes #1535) | Zero reviews in `ggml-org/ggml`; already adopted downstream (Thunderbird, Firefox) pre-merge |
| [#875](https://github.com/ggml-org/ggml/issues/875) | Is ggml support RISC-V ISA porting? | Closed same-day (2024-06-29) | N/A | Scoping question, not a tracking issue; confirms no dedicated RISC-V meta-issue exists |
| [#909](https://github.com/ggml-org/ggml/pull/909) | Perf optimization for generic ggml_vec_dot_q5 | Closed, unmerged (2024-08-02) | N/A | Author withdrew ("got wires crossed"); scalar-path perf work, tangentially riscv-relevant |
| [#267](https://github.com/ggml-org/ggml/pull/267) | Change tensor->data address storage from uint64_t to uintptr_t | Closed, unmerged (2023-07-02) | N/A | Not riscv-specific; portability/CHERI discussion |

**Correctness bugs highlighted separately:** #1535 (build failure) and the SIGILL risk addressed by #1475 are the two active, currently-unresolved-upstream correctness/robustness issues. Both fixes are drafted and open but unreviewed as of the research date.

## 12. Objections and Upstream Blockers

**Stated objections:** none found. No maintainer statement was located expressing reluctance to support riscv64; to the contrary, the README lists RISC-V as one of three "SIMD-optimized" architectures alongside x86 and ARM.

**Technical blockers:** the Clang macro-confusion bug chain (#1535 to #1571) and the sub-extension SIGILL gap (#1475) are the concrete open technical issues. Both have drafted fixes.

**Organizational blockers:** both open correctness PRs (#1475, #1571) have zero maintainer reviews recorded as of the research date, despite #1571 already being cherry-picked into at least one downstream consumer (per the CSharperMantle activity noted on the PR) before formal merge - suggesting a review-bandwidth/prioritization lag rather than a technical rejection. #1475's author states in the PR description that "Claude Opus assisted in identifying the issue and developing the initial implementation," a disclosure a reviewing maintainer may weigh.

**No upstream binary releases:** applies to all architectures equally (source-tarball-only policy), not a riscv64-specific organizational stance.

**Acceptance probability:** assessed as high for #1475 and #1571 - both are narrow, defensive bug fixes with no controversial design tradeoffs, no expressed objection on either thread, and #1571 already carries an external-adoption signal.

## 13. Readiness Assessment

- **Color:** blue
- **Optimization level:** full
- **Release provider:** Ubuntu (distro) - upstream (`ggml-org/ggml`, and its GitHub Releases) publishes no riscv64 binary artifact for any architecture; the consumable riscv64 release in practice comes from Ubuntu 26.04's `universe` archive, built from unmodified upstream source.

**Justification:** ggml's own mirror repository, `ggml-org/ggml`, has zero riscv64 CI - confirmed by directly reading all four of its workflow files ([build-cpu.yml, build-self-hosted.yml, make-release.yml, release.yml](https://github.com/ggml-org/ggml/tree/master/.github/workflows)). However, ggml's own `CONTRIBUTING.md` states the core library is actually developed in the sibling repo `ggml-org/llama.cpp`, and code is synced from there into the `ggml` mirror; `llama.cpp` has a dedicated `build-riscv.yml` that builds and runs the `ctest` test suite plus three sanitizer jobs (ASan/TSan/UBSan) on native RVV1.0 riscv64 hardware, funded by RISE's dedicated `spacemit-k1` runner pool ([RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/), llama.cpp: 2,589 jobs in a six-week window, the heaviest user of RISE's RISC-V CI). Because this CI exercises the same source (`quants.c`, `repack.cpp`, `cpu-feats.cpp`) that is synced into `ggml-org/ggml`, the primary CI grade is set to blue (builds and tests pass on native riscv64 hardware) rather than orange, but no upstream artifact is published, which rules out green. This is a judgment call worth flagging explicitly: a strictly repo-scoped reading of `ggml-org/ggml` in isolation, crediting no CI evidence from `llama.cpp`, would instead land on the distribution floor (yellow, `clean-distro-build`, since Ubuntu ships an unpatched riscv64 build with no upstream CI at all in that one repo).

The Step 2 optimization-purpose modifier does not lower this grade: RISC-V-specific code coverage is full. The dedicated `arch/riscv/` backend (8,337 lines total, comparable to arm's 9,516 and x86's 10,842) covers 24 of 26 quant kernels with 1,744+726 RVV intrinsic call sites, VL-specialized kernels across VLEN 128/256/512/1024, an xtheadvector inline-asm path, and a separate 15,439-line vendor accelerator backend for SpacemiT's IME matrix extension - with near-zero TODO/stub density. This is assessed as "one of the more complete and better-tested architecture ports in the codebase," matching the criteria for "Full" coverage of the operations that define ggml's value proposition.

**Pending work that could change the grade:**
- Merging PR #1475 (SIGILL prevention via sub-extension gating) and PR #1571 (fixes the OpenBSD/riscv64 build failure) would close the two known open correctness gaps; both are currently unreviewed.
- Porting `llama.cpp`'s `build-riscv.yml` workflow directly into `ggml-org/ggml` would remove the repo-scoping ambiguity noted above and put the grade on unambiguous footing without relying on the sibling-repo argument.
- If upstream begins publishing a riscv64 binary release artifact (currently no architecture gets one), the project would qualify for green under the `release_provider: upstream` requirement.
- RISE's continued funding of the dedicated RVV1.0 hardware CI pool, and SpacemiT's (a RISE General Member) ongoing direct maintenance of the vendor accelerator backend, are stabilizing factors that reduce regression risk going forward.

## 14. Investment Analysis

RISE has already funded the highest-cost items: native RVV1.0 hardware CI (via the Cloud-V partnership and the dedicated `spacemit-k1` runner pool) and, through SpacemiT's General Membership, direct vendor engineering on the IME matrix-extension backend. Do not re-size that work; sizing below covers only the identifiable open gaps.

### 14.1 Functional Enablement

Base RVV enablement, the quant-kernel set, and runtime feature detection are complete and upstream. Remaining functional work is narrow: shepherding PRs #1475 and #1571 through maintainer review (both already drafted, unreviewed), and fixing the dead `GGML_RV_ZBA` CMake flag inconsistency. No new kernel development is required.

### 14.2 Performance Optimization

The SpacemiT IME vendor backend already delivers a measured 44.6x speedup over plain RVV on A100-class cores ([Phoronix benchmark](https://www.phoronix.com/review/risc-v-rvv-vector-benchmarks/4)) and is vendor-maintained. Given full RVV coverage already exists, further optimization work is low-priority and largely already driven by the upstream community (xctan, SpacemiT engineers).

### 14.3 CI/CD Infrastructure

The expensive part (native hardware, RISE-funded runner pool, sanitizer jobs) is already built - in `llama.cpp`. The one concrete, low-cost gap is that `ggml-org/ggml` itself carries no CI workflow; porting the existing `build-riscv.yml` file into that repo is a small, mechanical task.

### 14.4 Ecosystem Enablement

Not applicable in a package-manager sense (no significant dependent PyPI/npm/Maven ecosystem was found for ggml itself - see Section 9's PyPI finding that the only `ggml` PyPI package is an unrelated project). ggml's actual distribution channels are source builds, `llama.cpp` (which vendors it), and Ubuntu packaging.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Review and merge PR #1475 (SIGILL sub-extension gating) | 0.5 (review only, already implemented) | ggml-org maintainer | High |
| Functional | Review and merge PR #1571 (fixes #1535 OpenBSD/riscv64 build) | 0.5 (review only, already implemented) | ggml-org maintainer | High |
| Functional | Fix undeclared `GGML_RV_ZBA` CMake option inconsistency | 0.25 | Contributor | Low |
| CI/CD | Port `llama.cpp`'s `build-riscv.yml` into `ggml-org/ggml` directly | 1 | Contributor / RISE | Medium |
| Documentation | Write a generic (non-SpacemiT) riscv64 build/cross-compile guide and ship a toolchain file | 1-2 | Contributor | Medium |
| Performance | Evaluate/tune SpacemiT IME2 usage on target hardware if deploying on A100-class SpacemiT SoCs | 2-4 (hardware-dependent) | Evaluating org | Medium (only if targeting SpacemiT A100 cores) |
| Distribution | Investigate upstream riscv64 binary release publishing (currently none for any arch) | Not sized - policy decision, not engineering effort | ggml-org maintainer | Low |

## 15. Updates

No updates yet - initial report dated 2026-06-17.

## 16. References

- [ggml-org/ggml repository](https://github.com/ggml-org/ggml)
- [ggml-org/llama.cpp repository](https://github.com/ggml-org/llama.cpp)
- [Issue #1535 - ggml-0.14.0 build fails on OpenBSD/riscv64](https://github.com/ggml-org/ggml/issues/1535)
- [PR #1571 - Gate RVV code on the target extension](https://github.com/ggml-org/ggml/pull/1571)
- [PR #1475 - ggml-cpu/riscv: gate cpu-riscv64 backend on Zv* sub-extensions](https://github.com/ggml-org/ggml/pull/1475)
- [Issue #875 - Is ggml support RISC-V ISA porting?](https://github.com/ggml-org/ggml/issues/875)
- [Issue #425 - s390x platform support](https://github.com/ggml-org/ggml/issues/425)
- [PR #909 - Perf optimization for generic ggml_vec_dot_q5](https://github.com/ggml-org/ggml/pull/909)
- [PR #197 - ADD Support for CLBLAST (actual RISC-V enablement)](https://github.com/ggml-org/ggml/pull/197)
- [PR #267 - change of address storage of tensor->data from uint64_t to uintptr_t](https://github.com/ggml-org/ggml/pull/267)
- [ggml-org/ggml GitHub Actions workflows](https://github.com/ggml-org/ggml/tree/master/.github/workflows)
- [RISE RISC-V Runners: Six Weeks In](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE runner architecture docs](http://riscv-runners.riseproject.dev/docs/architecture/ghfe)
- [RISE members page](https://riseproject.dev)
- [RISE Python wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [Ubuntu package search - ggml on Resolute (26.04) riscv64](https://packages.ubuntu.com/search?keywords=ggml&suite=resolute&searchon=names&section=all)
- [Ubuntu ports archive pool directory for ggml](http://ports.ubuntu.com/ubuntu-ports/pool/universe/g/ggml/)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at)
- [PyPI ggml package JSON API](https://pypi.org/pypi/ggml/json)
- [Phoronix - RISC-V RVV Vector Performance Benchmarks With The SpacemiT K3 SoC](https://www.phoronix.com/review/risc-v-rvv-vector-benchmarks/4)
- [LinkedIn - Benchmarking llama.cpp SpacemiT K3 RISC-V AI cores vs RVV](https://www.linkedin.com/pulse/benchmarking-llamacpp-spacemit-k3-risc-v-ai-cores-vs-rvv-verachten-gogme)
- [dev.to - Running a Local LLM on RISC-V: Banana Pi F3 (Part 1)](https://dev.to/gounthar/running-a-local-llm-on-risc-v-building-llamacpp-on-a-banana-pi-f3-part-1-4d5g)
- [dev.to - Running a 70B LLM on Pure RISC-V: MilkV Pioneer](https://dev.to/gounthar/running-a-70b-llm-on-pure-risc-v-the-milkv-pioneer-deployment-journey-2be3)
- [OpenMathLib/OpenBLAS issue tracker (riscv64-tagged issues)](https://github.com/OpenMathLib/OpenBLAS)
- [uxlfoundation/oneDNN issue #5170 - proposal to add real RISC-V hardware CI](https://github.com/uxlfoundation/oneDNN)
- [llvm-project#87026 - libomp build fails on risc-v](https://github.com/llvm/llvm-project)
- [Debian Bug#1124644 - ggml FTBFS on riscv64](https://bugs.debian.org/1124644)