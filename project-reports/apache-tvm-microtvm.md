---
title: Apache TVM / microTVM
parent: Project Reports
color: orange
dependencies:
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Apache TVM-FFI
    relation: runtime-dependency
    criticality: critical
  - name: NumPy
    relation: runtime-dependency
    criticality: critical
  - name: XGBoost
    relation: runtime-dependency
    criticality: optional
  - name: OpenBLAS
    relation: runtime-dependency
    criticality: optional
  - name: oneDNN
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="apache-tvm-microtvm" %}

# Apache TVM / microTVM

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-07<br/>
**Readiness:** orange<br/>
**Optimization level:** minimal<br/>
**Scope:** RISC-V (riscv64/linux) support status for Apache TVM / microTVM<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Apache TVM is a top-level Apache Software Foundation (ASF) project (graduated from the Apache Incubator), licensed under Apache License 2.0. It is a machine-learning compiler stack: it takes models from frameworks such as PyTorch/ONNX and lowers them through TIR (Tensor IR) into optimized machine code via LLVM codegen, with an auto-tuning ("meta-schedule") layer that searches for high-performance schedules per target. microTVM was historically TVM's embedded/bare-metal deployment path (Zephyr RTOS + QEMU); as of the current repository HEAD it has been **removed from the codebase entirely** - no `apps/microtvm`, `python/tvm/micro`, or `src/**/micro*` paths remain.

**Governance:** merit-based Apache-way governance (Contributor -> Reviewer -> Committer -> PMC). Strategic decisions require a lazy 2/3 majority PMC vote. There is **no formal hardware-tier support policy** (no `PLATFORMS.md`/`SUPPORT.md`); new backends land through ordinary PR review plus optional RFC, gatekept only by informal subsystem "shepherds" listed in `.github/CODEOWNERSHIP`.

**Corporate sponsors:** historically dominated by **OctoML** (TVM's commercial spinout, now shut down/absorbed - Tianqi Chen, Thierry Moreau, Josh Fromm, Andrew Reusch, Mehrdad Hessar, Masahiro Masuda among its PMC/committer contributors), with significant contribution from **Qualcomm** (Hexagon/LLVM), **Arm** (BYOC/Ethos-U), **AWS/Amazon**, **Intel**, and academic groups (CMU Catalyst, University of Washington - TVM's origin lab).

**Community culture on new ports:** deliberately low-barrier - RISC-V entered TVM via a single OctoML engineer's PR ([#7804](https://github.com/apache/tvm/pull/7804), April 2021), not a top-down roadmap commitment, and has since grown through ordinary contributor activity rather than a PMC-driven platform strategy.

**RISE membership:** Apache TVM is **not** a RISE member project. RISE's members page lists Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent (Premier) and Akeana, Andes, Beijing ESWIN, BOSC, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE (General) - TVM/OctoML appear nowhere in this list ([riseproject.dev/members](https://riseproject.dev/members/)). No RISE blog post, funded RFP, or dedicated RISE repository targets TVM or microTVM.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-04-08 | [#7804](https://github.com/apache/tvm/pull/7804) merged - first RISC-V32/64 support, via Zephyr QEMU targets for microTVM (Mehrdad Hessar, OctoML) | [PR #7804](https://github.com/apache/tvm/pull/7804) |
| 2021-08-30 | [#8860](https://github.com/apache/tvm/pull/8860) merged - LLVM `-mabi`/`-target-abi` parameter support for RISC-V (Alexander Pivovarov, Amazon) | [PR #8860](https://github.com/apache/tvm/pull/8860) |
| 2021-10-22 | [#9325](https://github.com/apache/tvm/pull/9325) merged - RISC-V32/64 Zephyr tests enabled on QEMU CI (Mehrdad Hessar, OctoML); RISC-V32 FPU tests explicitly deferred, blocked on upstream Zephyr bug `zephyrproject-rtos/zephyr#34026` | [PR #9325](https://github.com/apache/tvm/pull/9325) |
| 2022-02-02 | [#10141](https://github.com/apache/tvm/issues/10141) opened - "[Tracking Issue] Write schedules for RISC-V targets," the closest thing to a master RISC-V tracking issue; closed with no comments once QEMU/Spike CI plumbing landed, scoped SIMD-schedule work never completed under it | [Issue #10141](https://github.com/apache/tvm/issues/10141) |
| 2022-05-30 | [#11506](https://github.com/apache/tvm/issues/11506) opened - CSI-NN2 (T-Head/XuanTie RISC-V NPU/DSP) BYOC integration tracking issue, referencing RFC `tvm-rfcs#75` | [Issue #11506](https://github.com/apache/tvm/issues/11506) |
| 2022-06-22 to 2022-09-15 | CI infrastructure merged: [#11689](https://github.com/apache/tvm/pull/11689) (CSI-NN2 CI image, in v0.9.0), [#12230](https://github.com/apache/tvm/pull/12230) (Dockerfile.ci_riscv), [#12369](https://github.com/apache/tvm/pull/12369), [#12534](https://github.com/apache/tvm/pull/12534) (Spike simulator build) - all in v0.10.0 | Verified via `git merge-base --is-ancestor` against release tags |
| 2025-02-06 | [#12614](https://github.com/apache/tvm/pull/12614) and [#12644](https://github.com/apache/tvm/pull/12644) (CSI-NN2 implementation) closed unmerged by @tqchen after ~2.5 years open - **CSI-NN2 vendor NPU integration abandoned** | [PR #12614](https://github.com/apache/tvm/pull/12614), [PR #12644](https://github.com/apache/tvm/pull/12644) |
| 2025-02-08 to 2025-05-13 | VLEN-detection bug chain: [#17625](https://github.com/apache/tvm/issues/17625) (bug report) -> [#17631](https://github.com/apache/tvm/pull/17631) -> [#17641](https://github.com/apache/tvm/pull/17641) -> [#17853](https://github.com/apache/tvm/pull/17853) (all merged) | [Issue #17625](https://github.com/apache/tvm/issues/17625) |
| 2025-08-01 | [#18182](https://github.com/apache/tvm/pull/18182) opened - "Added RISC-V V extension intrinsics for LLVM" - **still open**, no listed reviews as of research date | [PR #18182](https://github.com/apache/tvm/pull/18182) |
| 2025-12-09 | 13 near-identical open bug reports filed by a single author (@yanyanyanggg): [#18560](https://github.com/apache/tvm/issues/18560)-[#18572](https://github.com/apache/tvm/issues/18572), each showing an RVV-vectorized TOPI operator running slower than scalar RV64 on real SpacemiT K1-X hardware | See Section 11 |
| 2026-04-10 | [#19374](https://github.com/apache/tvm/pull/19374) merged - partial fix for #18569 (softmax) only; the other 12 regressions remain open | [PR #19374](https://github.com/apache/tvm/pull/19374) |
| 2026-06-15 to 2026-06-30 | Active frontier: [#19776](https://github.com/apache/tvm/pull/19776), [#19866](https://github.com/apache/tvm/pull/19866), [#19877](https://github.com/apache/tvm/pull/19877), [#19915](https://github.com/apache/tvm/pull/19915) - reworking RVV loop vectorization to LLVM scalable-vector (`vscale`) machinery, plus `hwprobe`-based CPU feature detection | See PR list, Section 11 |

**Key contributors and organizations:** Mehrdad Hessar and Andrew Reusch (OctoML - founding RISC-V/microTVM work), Alexander Pivovarov (Amazon - ABI fixes), cbalint13 and jerryzj (VLEN detection fixes, affiliation not stated in available data [NEEDS VERIFICATION]), alter-xp (T-Head/XuanTie, CSI-NN2 - affiliation inferred from CSI-NN2 being a T-Head product [NEEDS VERIFICATION]).

**Is it fully upstream?** RISC-V microTVM/QEMU support and general LLVM-backend RVV codegen support are upstream and merged. The one significant vendor-hardware integration attempt (CSI-NN2 NPU/DSP backend) was **not** upstreamed - closed unmerged after 2.5 years. microTVM itself, the original entry point for RISC-V, has since been removed from the repository entirely.

## 3. Upstream Support Tier

No formal tier policy exists in this repository (no `PLATFORMS.md`/`SUPPORT.md`; confirmed absent). In practice:

| Axis | amd64/x86_64 | arm64/aarch64 | riscv64 |
|---|---|---|---|
| GitHub Actions CI | Windows/macOS jobs only cover their native arches; no dedicated Linux x86_64 GH Actions job (Jenkins is primary per `main.yml` header comment) | `publish_wheel.yml` builds `ubuntu-24.04-arm` wheels | **No riscv64 job in any of the 5 `.github/workflows/*.yml` files** |
| Jenkins (primary CI) | `cpu_jenkinsfile.groovy` - active, wired | `arm_jenkinsfile.groovy` - active, wired, uses QEMU (`check_arm_qemu()`) | **No `riscv_jenkinsfile.groovy` exists; `ci_riscv = ''` is a dead placeholder variable in all 5 generated Jenkinsfiles, never referenced in any stage** |
| Docker CI images | `Dockerfile.ci_cpu` exists | `Dockerfile.ci_arm` exists | **No `Dockerfile.ci_riscv`** (one existed in 2022 via PR #12230/#12369/#12534, since deleted from tree) |
| PyPI wheel (`apache-tvm` 0.26.0) | `manylinux_2_27_x86_64` | `manylinux_2_27_aarch64` | **None** |
| Official ASF release | source tarball only (`downloads.apache.org/tvm/tvm-v0.26.0/`) - same for all arches | same | same (source-only, arch-agnostic) |

Release-blocking status: not applicable to riscv64 since no riscv64 CI job exists to gate merges.

## 4. Technical Architecture and RISC-V-Specific Subsystems

The repository has undergone a major internal restructuring: the classic per-arch `topi/{x86,arm_cpu,riscv}` hand-written-schedule directories are gone for **all** architectures, replaced by a `s_tir`/meta-schedule auto-tensorization system. RISC-V support is implemented entirely through LLVM's codegen backend, not hand-written C intrinsics or assembly.

| Component | File | Lines | Purpose | Quality |
|---|---|---|---|---|
| Target tags | [`python/tvm/target/tag_registry/riscv_cpu.py`](https://github.com/apache/tvm/blob/main/python/tvm/target/tag_registry/riscv_cpu.py) | 84 | Registers `mtriple`/`mcpu`/`mabi` presets for SiFive E31/E76/U54/U74 and SpacemiT (licheepi3a, spacemit-k3) boards | Complete, config-only, no vector attrs set by default |
| RVV tensor intrinsics | [`python/tvm/s_tir/tensor_intrin/riscv_cpu.py`](https://github.com/apache/tvm/blob/main/python/tvm/s_tir/tensor_intrin/riscv_cpu.py) | 241 | Hand-written RVV dot-product kernels via raw `llvm.riscv.*` LLVM IR intrinsics (`vle`, `vfmul`, `vwmul(su)`, `vfredusum`, `vwredsum`) - not C `riscv_vector.h` intrinsics | Complete and functional; covers dot-product/GEMM tensorization only |
| Scalable-loop vectorizer | `src/tirx/transform/vectorize_loop.cc` | ~1280 total (RISC-V hooks small) | `TargetHasRVV()`, `TargetHasVLA()`, `VectorizeFixedLoopForRVV()` - lowers fixed-extent loops into `vscale`-based scalable loops | Complete, actively used |
| Meta-schedule defaults | `src/s_tir/meta_schedule/schedule_rule/schedule_rule.cc`, `postproc/postproc.cc`, `space_generator/space_generator.cc` | 478/136/225 | `DefaultRISCV(vlen)` schedule rules and postprocessors triggered on `target_has_feature("v", target)` | Complete |
| VLEN/CPU-feature detection | `src/target/llvm/llvm_instance.cc` (lines ~286-308, 981-982) | - | Forces `CodeModel::Medium` for RISC-V triples; parses `zvlXXXb` LLVM attrs; 128-bit default fallback | Complete, but had a confirmed bug (see #17625, Section 11) |

**No `arch/riscv/` runtime directory, no hand-written assembly (`.S` files), and no microTVM CRT/runtime RISC-V-specific backend exist** (microTVM removed from repo entirely). ISA extensions referenced: base I/M/A/C/D/F plus **V (RVV) 1.0** via `+v`/`+zvlXXXb` `mattr`s. No evidence of Zba/Zbb/Zicond or other bit-manipulation extension-specific code.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned SIMD tensor intrinsics | Multiple (AVX2/AVX-512 tensorize kernels, via meta-schedule) [NEEDS VERIFICATION - not directly enumerated in research] | NEON/SVE tensorize kernels referenced in codebase (`TargetHasVLA` also handles ARM SVE) | Dot-product/GEMM only ([`riscv_cpu.py`](https://github.com/apache/tvm/blob/main/python/tvm/s_tir/tensor_intrin/riscv_cpu.py)) |
| Scalable-vector loop lowering | N/A (fixed-width AVX) | Yes (SVE, shares `TargetHasVLA()` path) | Yes, but recently reworked ([#19776](https://github.com/apache/tvm/pull/19776), [#19866](https://github.com/apache/tvm/pull/19866), June 2026) |
| Measured elementwise/pooling op performance vs scalar | Established, mature | Established, mature | **Regressed - RVV code slower than scalar RV64 on every op tested** (13 open bugs, Section 11) |

## 5. Build System, Cross-Compilation, and Toolchain

**No dedicated riscv64 build-system doc, CMake toolchain file, or Dockerfile exists in the repository.** Confirmed absent: `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, `cmake/riscv64.cmake`, `cmake/toolchain-riscv64.cmake`, `docker/Dockerfile.riscv64`. Root `CMakeLists.txt` (40KB) has zero occurrences of "riscv".

**LLVM version requirement (hard-enforced):**
- `cmake/modules/LLVM.cmake:32-34` and `cmake/utils/FindLLVM.cmake:238-240`: `FATAL_ERROR` if LLVM < 15.0.
- This floor matters specifically for riscv64: `tests/python/target/test_riscv_features.py` shows vendor-CPU target support requires progressively newer LLVM - explicit `+zvlXXXb` needs LLVM >= 14, `sifive-x280` needs LLVM >= 17, `sifive-p670` needs LLVM >= 18, `spacemit-x60` needs LLVM >= 19. **The repo's stated floor (15) is insufficient for several of its own predefined riscv64 target tags.**

**Cross-compilation:** `docs/how_to/tutorials/cross_compilation_and_rpc.py` gives a full worked CMake toolchain-file example - but only for **aarch64**. RISC-V is name-dropped only in prose (`# RV64: {"kind": "llvm", "mtriple": "riscv64-unknown-linux-gnu"}`, line 556) with no concrete riscv64 toolchain file provided. A user must adapt the aarch64 template by substituting a `riscv64-unknown-linux-gnu-gcc/g++` toolchain and sysroot themselves.

**QEMU usage:** ARM-only in current CI tooling. `tests/scripts/ci.py:449-472` implements `check_arm_qemu()`, a precheck function for the `arm` CLI command that verifies `qemu-*` binfmt registration. **No equivalent function or instructions exist for riscv64** (`qemu-riscv64`/`qemu-riscv64-static`) anywhere in the repo.

**Known build failures:** [#17508](https://github.com/apache/tvm/issues/17508) - TVM 0.18.0 + LLVM 19.1.3 aborts with `Unsupported CPU type! UNREACHABLE executed at RuntimeDyldELF.cpp:1080` on SpacemiT K1-X (RV64GCVB, RVA22); [#17916](https://github.com/apache/tvm/issues/17916) - regression between TVM 0.18/LLVM 19.3 (working) and TVM 0.20/LLVM 20.1.4 (broken) on Banana Pi with `+zfh,+v,+c -vector-width=256` target string.

**Exact build path (reconstructed, not documented upstream):**
1. Host side: `cp cmake/config.cmake .`, set `USE_LLVM ON` (LLVM >= 15, but >= 19 for `spacemit-x60`-class targets), `cmake .. && cmake --build . --parallel $(nproc)`.
2. Cross/device-runtime side: write a riscv64 CMake toolchain file (no template provided), set `USE_LLVM OFF`, `USE_CUDA/METAL/VULKAN/OPENCL OFF`, build the `runtime` target only.
3. Testing without hardware: manually configure `qemu-riscv64` binfmt (no automation exists, unlike ARM's `check_arm_qemu()`).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| LLVM JIT/AOT codegen | Full | Full | Full (LLVM backend, `+v` RVV support) |
| Upstream CI test execution | Via Jenkins (`cpu_jenkinsfile.groovy`) | Via Jenkins (`arm_jenkinsfile.groovy`, QEMU) | **None** |
| Official binary/wheel | PyPI manylinux x86_64 | PyPI manylinux aarch64 | **None** |
| Auto-vectorized elementwise/pooling ops perform >= scalar | Yes (mature) | Yes (mature) [NEEDS VERIFICATION - not directly benchmarked in this research] | **No - every tested op (13/13) is slower with RVV than scalar on real hardware** ([#18560](https://github.com/apache/tvm/issues/18560)-[#18572](https://github.com/apache/tvm/issues/18572)) |
| Dot-product/GEMM tensorization | Yes | Yes [NEEDS VERIFICATION] | Yes ([`riscv_cpu.py`](https://github.com/apache/tvm/blob/main/python/tvm/s_tir/tensor_intrin/riscv_cpu.py)) |
| Vendor NPU/DSP BYOC backend | Multiple (e.g. oneDNN) | Multiple (e.g. Ethos-U) | **Attempted (CSI-NN2), abandoned** ([#12614](https://github.com/apache/tvm/pull/12614) closed unmerged) |
| Embedded/microTVM deployment | N/A (removed from repo for all arches) | N/A | N/A - microTVM entirely removed from current codebase |

**Functional gaps:** no upstream riscv64 CI means no automated verification that riscv64 builds or runs correctly on any given commit; a user must build and validate independently. No vendor NPU/DSP offload path exists (CSI-NN2 abandoned).

**Performance gaps:** this is the most material finding in this report. The 13-issue bug batch ([#18560](https://github.com/apache/tvm/issues/18560)-[#18572](https://github.com/apache/tvm/issues/18572), filed 2025-12-09, measured on real SpacemiT K1-X hardware) shows RVV-vectorized code running **0.325x to 0.981x** the speed of plain scalar RV64 code across every tested operator - i.e., RVV is never faster and up to ~3x slower (sum, log, ReLU) than not using RVV at all. Separately, [#17625](https://github.com/apache/tvm/issues/17625) documented a VLEN-detection bug causing ~4x slowdown on a 256-bit-VLEN board (LLVM/TVM defaulting to 128-bit) - fixed by [#17631](https://github.com/apache/tvm/pull/17631)/[#17641](https://github.com/apache/tvm/pull/17641)/[#17853](https://github.com/apache/tvm/pull/17853), but that fix predates and is separate from the still-open #1856x regression batch.

**Security hardening gaps:** Data not available - no research was directed at ASLR, stack protector, CFI, or similar hardening flags for riscv64 in this pass.

**NaN/floating-point semantics issues:** No distinct NaN-correctness bug was found. The RVV performance-regression issues (#18560-#18572) operate on float32 data and touch RVV's floating-point path, but they are performance reports, not correctness/NaN-handling reports.

## 7. CI/CD Infrastructure

**No riscv64 CI exists in apache/tvm today.** Verified by reading the actual CI definition files at HEAD (`7e06fc6c1420d0188eb9d889bd74e2e1fb76e448`), not by inferring from issue/PR text:

- `.github/workflows/main.yml` - jobs are `MacOS` and `Windows` only; its own header comment states "We use it to cover windows and mac builds; Jenkins is still the primary CI." No riscv64, no Linux job.
- `.github/workflows/lint.yml` - `ubuntu-latest`, runs `pre-commit`. No riscv.
- `.github/workflows/publish_wheel.yml` - build matrix: `ubuntu-latest` (x86_64), `ubuntu-24.04-arm` (aarch64), `macos-14`, `windows-2022`. No riscv64.
- `.github/workflows/nightly_docker_update.yml`, `.github/workflows/tvmbot.yml` - infra/bot automation, no riscv.
- Jenkins (the actual primary CI, per `main.yml`'s own comment): `ci/jenkins/generated/{arm,gpu,docker,cpu,wasm}_jenkinsfile.groovy` are the only 5 generated pipelines. **No `riscv_jenkinsfile.groovy`.** All 5 files (and the shared template `ci/jenkins/templates/utils/base.groovy.j2`) declare `ci_riscv = ''` alongside `ci_cortexm = ''`, but this variable is never referenced in any `stage(...)`, docker invocation, or node label - it is dead scaffolding.
- `ci/jenkins/docker-images.ini` populates only `ci_arm`, `ci_cpu`, `ci_gpu`, `ci_wasm` image tags. No `ci_riscv` entry.
- `docker/` contains `Dockerfile.ci_arm/ci_cpu/ci_gpu/ci_wasm` only. **No `Dockerfile.ci_riscv`** - one existed circa 2022 (created by [#12230](https://github.com/apache/tvm/pull/12230), built on by [#12369](https://github.com/apache/tvm/pull/12369)/[#12534](https://github.com/apache/tvm/pull/12534)) but has since been **deleted from the tree**.
- No `.gitlab-ci.yml`, `.cirrus.yml`, or top-level `Jenkinsfile` exist anywhere in the repository.

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Dedicated Jenkinsfile | `cpu_jenkinsfile.groovy` (wired) | `arm_jenkinsfile.groovy` (wired, QEMU) | None (`ci_riscv = ''` dead placeholder only) |
| Docker CI image | `Dockerfile.ci_cpu` | `Dockerfile.ci_arm` | None (deleted, previously existed 2022-2025ish) |
| RISE runners referenced | N/A | Not found in this research pass | Not found - no `riseproject-dev` or RISE runner label references located anywhere in the CI files read |
| Hardware used | Cloud VM | Cloud VM / QEMU | None - all riscv64 testing found in this research (VLEN bugs, RVV perf regressions) was done manually by individual reporters on personal hardware (SpacemiT K1-X, Banana Pi K1), not CI |

**Historical note:** a real riscv64 CI effort existed 2022-2023 - PR #12230/#12369/#12534 built `Dockerfile.ci_riscv` with the Spike simulator, and PR #9325 (2021) enabled RISC-V32/64 Zephyr QEMU tests specifically for microTVM. Both the Dockerfile and microTVM itself have since been removed from the repository; the current tree carries no functioning trace of either.

## 8. Distribution and Release Status

- **GitHub/ASF official releases:** `downloads.apache.org/tvm/tvm-v0.26.0/` ships `apache-tvm-src-v0.26.0.tar.gz` + `.asc` + `.sha512` - **source tarball only**, consistent with ASF's source-only release policy. No compiled binaries for any architecture, let alone riscv64.
- **PyPI (`apache-tvm`, current version 0.26.0):** wheels exist for `manylinux_2_27_x86_64`, `manylinux_2_27_aarch64`, `macosx_11_0_arm64`, `win_amd64` only. **No riscv64 wheel** for any checked version (0.25.0 through 0.26.0).
- **RISE GitLab wheel-builder index** (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/apache-tvm/`): 302-redirects to plain PyPI - i.e., RISE is **not** building or hosting a distinct riscv64 wheel for this package. Same wheel list as above, confirmed via the redirected PyPI simple index.
- **Ubuntu 26.04 (resolute):** `packages.ubuntu.com` search for both `tvm` and `apache-tvm` returns "Sorry, your search gave no results" - **no package exists in the archive at all, for any architecture**, so riscv64 availability is moot.
- **Arch Linux RISC-V port** (archriscv.felixc.at): direct host connection failed (timeout, 3 attempts); no positive evidence of a `tvm` package build found via WebFetch either. Unconfirmed, not verified - Arch does not carry `tvm` as a mainline package even for x86_64.

**What a user must do to get a working riscv64 binary today:** build from source. There is no packaged binary distribution channel of any kind (upstream, distro, or RISE) for Apache TVM on riscv64. A user must clone the repository, install LLVM >= 15 (>= 19 for several of the predefined vendor CPU tags), write a custom CMake cross-toolchain file (no template exists for riscv64; the aarch64 template must be adapted manually), and build both host (compiler) and device (runtime) components separately.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| LLVM | Core JIT/AOT codegen backend, including RVV target | Yes - Ubuntu 26.04 riscv64 ships `llvm-20` `1:20.1.8-2ubuntu8` | RISC-V is an actively developed LLVM upstream target; no TVM-specific test gap found | Ubuntu-packaged; upstream ships riscv64 binaries | 800+ open riscv-tagged issues in llvm-project generally (not TVM-specific) - relevant to codegen quality TVM's RVV path depends on |
| apache/tvm-ffi | Hard runtime dependency (`apache-tvm-ffi>=0.1.13.post2`), cross-language ABI/FFI layer replacing vendored dlpack/dmlc-core | **Not in Ubuntu 26.04 (resolute) riscv64 archive** - only present in the post-26.04 dev suite ("stonking") at 0.1.12-3 | n/a (unpackaged in the target suite) | Not in the release suite users would install | **This is the actual current packaging blocker** for a clean Ubuntu 26.04 riscv64 install path, independent of TVM's own CI status |
| NumPy | Required Python dependency | Yes - Ubuntu 26.04 riscv64 ships `python3-numpy` `1:2.3.5+ds-3ubuntu1` | Two open riscv-specific NumPy issues affect floating-point exception semantics (could surface as TVM numeric-reference-check flakiness) | Ubuntu-packaged and PyPI manylinux riscv64 wheels tracked (open, not yet shipping per referenced numpy.md) | See `project-reports/numpy.md` |
| XGBoost | Optional dependency (meta-schedule cost model) | Yes - Ubuntu 26.04 riscv64 ships `python3-xgboost` `3.0.4-1build1` | No riscv64-specific test issues found | Ubuntu-packaged | Low risk, minimal riscv64 issue history |
| OpenBLAS | Optional numerics backend (`USE_BLAS=openblas`) | Yes - Ubuntu 26.04 riscv64 ships `libopenblas-dev` `0.3.32+ds-5` | Full riscv64 coverage per referenced report; RVV (ZVL128B/256B) kernels present | Ubuntu-packaged; upstream ships riscv64 | Open: RVV v1.0 support gaps, missing FP16/BF16 GEMM kernels on RISC-V - see `project-reports/openblas.md` |
| oneDNN/DNNL | Optional codegen backend (`USE_DNNL`) | Yes - Ubuntu 26.04 riscv64 ships `libdnnl-dev` `3.9.1+ds-2` | Reported full riscv64 support (figure possibly conflated with OpenBLAS in source report - [NEEDS VERIFICATION]) | Ubuntu-packaged | Open: no real RISC-V hardware in upstream CI (self-hosted/QEMU only) - see `project-reports/onednn.md` |
| CUTLASS (submodule, GPU-only) | Optional CUDA GEMM/attention templates | Packaged `arch:all` (header-only), functionally irrelevant on riscv64 | n/a - requires CUDA, no RISC-V GPU-compute ecosystem | Nominally present but unusable | Not applicable to a riscv64 CPU deployment |
| compiler-rt (LLVM submodule) | Soft-float/builtins for bare-metal C runtime | Source-vendored, inherits LLVM's mature riscv32/64 builtin support | n/a | n/a | No compiler-rt-specific riscv blockers found |

**LLVM deep-dive** is the load-bearing dependency: TVM's only JIT/codegen backend, and the vector-length-detection bugs documented in Section 11 (#17508, #17625, #17916) all trace to how TVM's LLVM integration parses RISC-V vector-extension target attributes, not to LLVM's own RISC-V backend being broken.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#18560](https://github.com/apache/tvm/issues/18560) | [Bug][RISC-V RVV] sum operator slower on RVV than scalar | Open | Performance | 0.325x scalar speed (~3.1x slower) |
| [#18561](https://github.com/apache/tvm/issues/18561) | [Bug][RISC-V RVV] log operator slower on RVV | Open | Performance | 0.328x |
| [#18562](https://github.com/apache/tvm/issues/18562) | [Bug][RISC-V RVV] ReLU slower with vector extension | Open | Performance | 0.337x |
| [#18563](https://github.com/apache/tvm/issues/18563) | [Bug][RISC-V RVV] bias_add slower with vectorization | Open | Performance | 0.360x |
| [#18564](https://github.com/apache/tvm/issues/18564) | [Bug][RISC-V RVV] sqrt poor vectorization performance | Open | Performance | 0.385x |
| [#18565](https://github.com/apache/tvm/issues/18565) | [Bug][RISC-V RVV] floor performance regression | Open | Performance | 0.521x |
| [#18566](https://github.com/apache/tvm/issues/18566) | [Bug][RISC-V RVV] round suboptimal vectorization | Open | Performance | 0.547x |
| [#18567](https://github.com/apache/tvm/issues/18567) | [Bug][RISC-V RVV] avg_pool2d performance degradation | Open | Performance | 0.621x |
| [#18568](https://github.com/apache/tvm/issues/18568) | [Bug][RISC-V RVV] sigmoid slower with vector extension | Open | Performance | 0.703x |
| [#18569](https://github.com/apache/tvm/issues/18569) | [Bug][RISC-V RVV] softmax suboptimal vectorization | Open (partial fix) | Performance | 0.745x; partially addressed by [PR #19374](https://github.com/apache/tvm/pull/19374), merged 2026-04-10 |
| [#18570](https://github.com/apache/tvm/issues/18570) | [Bug][RISC-V RVV] negative op performance degradation | Open | Performance | 0.854x |
| [#18571](https://github.com/apache/tvm/issues/18571) | [Bug][RISC-V RVV] max_pool2d minor regression | Open | Performance | 0.867x |
| [#18572](https://github.com/apache/tvm/issues/18572) | [Bug][RISC-V RVV] cos slight performance degradation | Open | Performance | 0.981x, near parity |
| [#17625](https://github.com/apache/tvm/issues/17625) | TVM/LLVM sets RISC-V VLEN to 128 bits instead of 256 on Banana Pi K1 | Closed | Correctness/Performance | ~4x slowdown; fixed via [#17631](https://github.com/apache/tvm/pull/17631)/[#17641](https://github.com/apache/tvm/pull/17641)/[#17853](https://github.com/apache/tvm/pull/17853) |
| [#17508](https://github.com/apache/tvm/issues/17508) | Unsupported CPU on SpacemiT K1 Octa-core X60 (RV64GCVB, RVA22) | Closed | Build failure | `Unsupported CPU type! UNREACHABLE` in RuntimeDyldELF.cpp |
| [#17916](https://github.com/apache/tvm/issues/17916) | Banana Pi, RISC-V LLVM Error with TVM 0.20, LLVM 20.1.4 | Closed | Regression | Worked on TVM 0.18/LLVM 19.3, broke after upgrade |
| [#10141](https://github.com/apache/tvm/issues/10141) | [Tracking Issue] Write schedules for RISC-V targets | Closed | Tracking | Closed uncommented; scoped SIMD-schedule work never completed under it |
| [#11506](https://github.com/apache/tvm/issues/11506) | [RFC][Tracking Issue] CSI-NN2 Integration | Closed | Tracking | Implementation PRs closed unmerged, effectively abandoned |

**Correctness bugs, highlighted separately:** the only two entries above that are build/runtime-blocking rather than purely a performance shortfall are [#17508](https://github.com/apache/tvm/issues/17508) (build abort on real hardware) and [#17916](https://github.com/apache/tvm/issues/17916) (version-to-version regression) - both closed. No open correctness (as opposed to performance) bug was found in this research. No distinct NaN-handling bug was found (see Section 6).

## 12. Objections and Upstream Blockers

**Stated objections:** none found - no maintainer statement rejecting RISC-V support was located anywhere in this research.

**Technical blockers:**
- The systemic RVV-slower-than-scalar problem (13 open bugs) has no comment thread or maintainer response recorded as of the research date; the active June 2026 PR wave ([#19776](https://github.com/apache/tvm/pull/19776), [#19866](https://github.com/apache/tvm/pull/19866), [#19877](https://github.com/apache/tvm/pull/19877), [#19915](https://github.com/apache/tvm/pull/19915)) reworks the underlying vectorization strategy (fixed-width -> scalable `vscale`) but had not resolved the majority of the open regression reports as of 2026-09-07.
- No riscv64 CI means regressions are caught only by individual users on personal hardware, with no automated gate - the 13-issue batch itself is evidence of this: a single external contributor manually benchmarked 13 operators and found all of them regressed, work that CI would ordinarily catch continuously.
- The abandoned CSI-NN2 effort ([#12614](https://github.com/apache/tvm/pull/12614)/[#12644](https://github.com/apache/tvm/pull/12644), closed unmerged 2025-02-06 after 2.5 years) shows that even a reviewer-approved vendor backend can stall indefinitely without a maintainer champion driving it to merge.

**Organizational blockers:** no dedicated RISC-V maintainer or working group exists within the TVM PMC (based on available governance documentation); RISC-V work has been carried by individual contributors (OctoML historically, unaffiliated individual contributors more recently) without an institutional sponsor comparable to Arm's or Qualcomm's Hexagon investment. TVM is not a RISE member project and has received no RISE funding or dedicated infrastructure.

**Acceptance probability:** PRs that fix concrete bugs (VLEN detection, #17625's chain) have merged cleanly and quickly (within days to weeks) once submitted with tests - the review bar is low friction for well-scoped fixes. Larger structural work (the scalable-vector RVV rework, #19776 family) is also merging steadily as of mid-2026. The blocker is contribution volume and follow-through, not upstream resistance: no evidence found of TVM maintainers rejecting or deprioritizing RISC-V PRs on their merits.

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- For optimization-purpose projects: RISC-V-specific code exists and is functional for one operation class - dot-product/GEMM tensorization ([`riscv_cpu.py`](https://github.com/apache/tvm/blob/main/python/tvm/s_tir/tensor_intrin/riscv_cpu.py), using LLVM `llvm.riscv.*` intrinsics for the V 1.0 extension). It does **not** cover the operations that dominate typical ML inference workloads by count - elementwise ops (sum, log, ReLU, sqrt, floor, round, sigmoid, cos, negative), pooling (avg_pool2d, max_pool2d), bias_add, and softmax all have RVV code paths that are measurably slower than scalar RV64 on real hardware (0.325x-0.981x scalar speed, per [#18560](https://github.com/apache/tvm/issues/18560)-[#18572](https://github.com/apache/tvm/issues/18572)). **Optimization level: minimal.** Closing this gap requires the scalable-vector (`vscale`) codegen rework currently in progress ([#19776](https://github.com/apache/tvm/pull/19776), [#19866](https://github.com/apache/tvm/pull/19866)) to actually resolve the regressions it targets, plus systematic RVV tuning of the TOPI operator library beyond the single dot-product tensorize path - no new ISA extension is needed, the V 1.0 extension already covers these operations architecturally; the gap is codegen/schedule quality, not missing hardware capability.
- **Justification:** No upstream riscv64 CI exists - confirmed by reading all 5 `.github/workflows/*.yml` files (macOS/Windows only) and every Jenkins pipeline file, where `ci_riscv` is a declared-but-unwired placeholder variable with no stage, and by the fact that `Dockerfile.ci_riscv` (built in 2022) has since been deleted from the tree. No distribution ships any riscv64 (or any-architecture) package for this project - Ubuntu 26.04's archive search for `tvm`/`apache-tvm` returns no results at all ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=apache-tvm&searchon=names&section=all)), and PyPI's `apache-tvm` 0.26.0 ships wheels only for x86_64/aarch64/macOS/Windows ([pypi.org/pypi/apache-tvm/json](https://pypi.org/pypi/apache-tvm/json)). This is the base Step 1 "no upstream CI, no distro package" orange case - there is no positive evidence of breakage (so not red), and extensive research (hardware bug reports, codegen tests, active merged PRs) rules out the unknown-unknown grey case.
- **Pending work that could change the grade:** the June 2026 scalable-vector RVV rework ([#19776](https://github.com/apache/tvm/pull/19776), [#19866](https://github.com/apache/tvm/pull/19866), [#19877](https://github.com/apache/tvm/pull/19877), [#19915](https://github.com/apache/tvm/pull/19915)) targets the structural cause of the 13 open performance regressions and, if it closes them, would raise the optimization level from minimal toward partial - but this does not change the primary orange color, which is driven by the complete absence of upstream CI and release artifacts, not by optimization quality. [#18182](https://github.com/apache/tvm/pull/18182) (open RVV LLVM intrinsics PR) is unmerged with no listed reviews as of the research date. No RISE involvement was found that would change the release-provider or CI picture; the only RISE touchpoint identified is a riscv64 wheel for the unrelated `apache-tvm-ffi` FFI package, built to unblock `xgrammar` packaging, not TVM itself.

## 14. Investment Analysis

RISE has not invested in Apache TVM or microTVM directly - confirmed by an exhaustive check of RISE's blog (all ~26 posts, 2024-2026), the RISE Python wheel builder's 84-package list (TVM absent), and the `riseproject-dev` GitHub org (no matching repository). The only adjacent RISE artifact is a riscv64 wheel build for `apache-tvm-ffi` (a small, separate FFI helper package, not the TVM compiler) in `riseproject-dev/python-wheels`, added to unblock `xgrammar` packaging ([riseproject-dev/python-wheels#288](https://github.com/riseproject-dev/python-wheels/issues/288)). This is not TVM enablement work and should not be counted against any of the sizing below.

### 14.1 Functional Enablement
- Stand up a riscv64 build-and-test job (GitHub Actions or Jenkins), including recreating `Dockerfile.ci_riscv` (deleted from the tree since ~2023-2025) and a riscv64 QEMU precheck function analogous to `check_arm_qemu()` (no such function currently exists for riscv64 anywhere in `tests/scripts/ci.py`).
- Write a riscv64 CMake cross-compilation toolchain-file template (none currently exists; only an aarch64 template is documented in `docs/how_to/tutorials/cross_compilation_and_rpc.py`).
- Publish a riscv64 wheel on PyPI for `apache-tvm` (currently absent for all recent versions).

### 14.2 Performance Optimization
- Root-cause and fix the systemic RVV-slower-than-scalar regression affecting all 13 tested TOPI operators ([#18560](https://github.com/apache/tvm/issues/18560)-[#18572](https://github.com/apache/tvm/issues/18572)); the in-flight scalable-vector rework ([#19776](https://github.com/apache/tvm/pull/19776) family) is the right structural direction but is unfinished as of the research date and needs validation against these specific open issues.
- Expand RVV tensor intrinsic coverage beyond dot-product/GEMM ([`riscv_cpu.py`](https://github.com/apache/tvm/blob/main/python/tvm/s_tir/tensor_intrin/riscv_cpu.py)) into the elementwise/pooling/activation operator set that the open bug batch shows is currently unoptimized.
- Land the open [#18182](https://github.com/apache/tvm/pull/18182) RVV LLVM-intrinsics PR (unreviewed as of research date) or supersede it with the newer scalable-vector approach.

### 14.3 CI/CD Infrastructure
- Recreate `Dockerfile.ci_riscv` and wire a `riscv_jenkinsfile.groovy` (or GitHub Actions equivalent) that actually consumes the currently-dead `ci_riscv` variable already present in all 5 generated Jenkinsfiles.
- Provision riscv64 test hardware or QEMU runners - no evidence was found of RISE-provided riscv64 CI runners being used by this project (searched CI files and RISE org repos; none referenced `riseproject-dev` runner labels).

### 14.4 Ecosystem Enablement
Section 10 omitted per report scope rules - Apache TVM/microTVM is a standalone ML compiler tool, not a package with a large dependent-package ecosystem requiring separate riscv64 enablement of downstream consumers.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Stand up riscv64 CI (Dockerfile, Jenkins stage or GH Actions job, QEMU precheck) | 2-3 | Data not available: no owner identified in research | Critical |
| Functional | Write riscv64 CMake cross-toolchain template and documentation | 1 | Data not available | High |
| Functional | Publish riscv64 PyPI wheel for `apache-tvm` | 1-2 | Data not available | High |
| Performance | Fix systemic RVV-vs-scalar regression across 12 remaining open ops (#18560-#18572 minus #18569) | 4-8 (depends on whether the in-flight #19776 family resolves it) | Data not available | Critical |
| Performance | Extend RVV tensor intrinsic coverage beyond dot-product/GEMM | 3-6 | Data not available | Medium |
| CI/CD | Provision riscv64 hardware or QEMU CI runners | 1-2 (excludes hardware procurement time) | Data not available | High |
| CI/CD | Land/review open RVV codegen PRs (#18182, #19776 family) | 1-2 (review/merge effort only) | Data not available | Medium |

Effort estimates are order-of-magnitude judgments based on the scope of work described in the findings above; no formal estimation exercise was performed and no owner assignment data was available in the research findings.

## 15. Updates

No updates yet - initial report dated 2026-09-07.

## 16. References

- [apache/tvm GitHub repository](https://github.com/apache/tvm)
- [Apache TVM homepage](https://tvm.apache.org/)
- [Issue #10141 - Tracking Issue: Write schedules for RISC-V targets](https://github.com/apache/tvm/issues/10141)
- [Issue #11506 - RFC/Tracking Issue: CSI-NN2 Integration](https://github.com/apache/tvm/issues/11506)
- [Issue #5908](https://github.com/apache/tvm/issues/5908)
- [Issue #17508 - Unsupported CPU on SpacemiT K1](https://github.com/apache/tvm/issues/17508)
- [Issue #17625 - TVM/LLVM sets RISC-V VLEN to 128 bits instead of 256 on Banana Pi K1](https://github.com/apache/tvm/issues/17625)
- [Issue #17916 - Banana Pi, RISC-V LLVM Error with TVM 0.20, LLVM 20.1.4](https://github.com/apache/tvm/issues/17916)
- [Issues #18560-#18572 - RISC-V RVV performance regression batch](https://github.com/apache/tvm/issues/18560)
- [PR #7804 - microTVM Zephyr RISCV support for QEMU RISCV-32/64](https://github.com/apache/tvm/pull/7804)
- [PR #8055 - apps: microtvm: Disable CONFIG_FPU for Zephyr runtime](https://github.com/apache/tvm/pull/8055)
- [PR #8860 - RISCV: Add support for llvm parameter -mabi](https://github.com/apache/tvm/pull/8860)
- [PR #9325 - microTVM/Zephyr: Enable RISCV Tests on QEMU CI](https://github.com/apache/tvm/pull/9325)
- [PR #11689 - CI Image: support CSI-NN2 in ci_qemu](https://github.com/apache/tvm/pull/11689)
- [PR #12212 - ci/docker: create Dockerfile.ci_riscv (original)](https://github.com/apache/tvm/pull/12212)
- [PR #12230 - ci/docker: create Dockerfile.ci_riscv (re-do)](https://github.com/apache/tvm/pull/12230)
- [PR #12369 - Add ci_riscv image, update all images](https://github.com/apache/tvm/pull/12369)
- [PR #12534 - Docker/CI/RISC-V: Build riscv-isa-sim (spike) in ci_riscv](https://github.com/apache/tvm/pull/12534)
- [PR #12526 - BYOC: Integrate CSI-NN2 and add unit test for Conv2D (original)](https://github.com/apache/tvm/pull/12526)
- [PR #12614 - BYOC: Integrate CSI-NN2 and add unit test for Conv2D (closed unmerged)](https://github.com/apache/tvm/pull/12614)
- [PR #12644 - ci: Add CSI-NN2 build to Jenkins (closed unmerged)](https://github.com/apache/tvm/pull/12644)
- [PR #12125 - microTVM Zephyr: Add support for FVP](https://github.com/apache/tvm/pull/12125)
- [PR #14836 - microTVM/RISCV: Tensorization for conv_2d_nchw_int8 with RVV extension](https://github.com/apache/tvm/pull/14836)
- [PR #15403 - CI/Docker: Add riscv-gnu-toolchain to ci_riscv](https://github.com/apache/tvm/pull/15403)
- [PR #16409 - apps/bundle_deploy/RISC-V: Extend bundle build for RISC-V](https://github.com/apache/tvm/pull/16409)
- [PR #17347 - LLVM/RUNTIME: Fix RISC-V CodeModel propagation to ORCJIT runtime executor](https://github.com/apache/tvm/pull/17347)
- [PR #17631 - Handle vector width (VLEN) for RISCV arches](https://github.com/apache/tvm/pull/17631)
- [PR #17641 - Pick up vector length from 'zvlXXXb' (RVV) mattr for riscv](https://github.com/apache/tvm/pull/17641)
- [PR #17853 - RISCV: correct the default VLEN to 128](https://github.com/apache/tvm/pull/17853)
- [PR #17859 - LLVM/Codegen: Enable SVE/VLA for RISCV targets](https://github.com/apache/tvm/pull/17859)
- [PR #17958 - LLVM: Fix JIT unknown reloc issue for case of RISCV](https://github.com/apache/tvm/pull/17958)
- [PR #18182 - Added RISC-V V extension intrinsics for LLVM (open)](https://github.com/apache/tvm/pull/18182)
- [PR #18243 - LLVM/METASCHEDULE: Add RISCV V-extension v1.0 kernels to metaschedule](https://github.com/apache/tvm/pull/18243)
- [PR #18586 - LLVM/Codegen: Avoid segfault when arith::GetVScaleValues returns empty vector](https://github.com/apache/tvm/pull/18586)
- [PR #19374 - DLight: Add CPU Reduction schedule rule for softmax-like operators](https://github.com/apache/tvm/pull/19374)
- [PR #19776 - TIRx/RISC-V: Use scalable RVV loops for fixed vectorize](https://github.com/apache/tvm/pull/19776)
- [PR #19866 - TIRx/LLVM: Support scalable Ramp lowering](https://github.com/apache/tvm/pull/19866)
- [PR #19877 - LLVM/RISCV: Detect local CPU features with hwprobe](https://github.com/apache/tvm/pull/19877)
- [PR #19915 - Target/RISC-V: Use riscv_cpu device key for RISC-V target tags](https://github.com/apache/tvm/pull/19915)
- [TVM Discuss - Coordination of RISC-V Integration in TVM](https://discuss.tvm.apache.org/t/coordination-of-risc-v-integration-in-tvm/13133)
- [Apache TVM PyPI package](https://pypi.org/pypi/apache-tvm/json)
- [Apache TVM official release directory](https://downloads.apache.org/tvm/tvm-v0.26.0/)
- [Ubuntu packages search - tvm/apache-tvm](https://packages.ubuntu.com/search?keywords=apache-tvm&searchon=names&section=all)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev/python-wheels#288 - apache-tvm-ffi riscv64 support](https://github.com/riseproject-dev/python-wheels/issues/288)
- [ACCELR Blog - Apache TVM on RISC-V: Experiment Results](https://medium.com/accelr-blog/apache-tvm-on-risc-v-experiment-results-aec86c3e7cf8)
- [accelr-net/tvm-riscv-demo](https://github.com/accelr-net/tvm-riscv-demo)
- `/home/user/apache/tvm/.github/CODEOWNERSHIP`, `CONTRIBUTORS.md`, `docs/contribute/community.rst`, `NOTICE` (local shallow clone, HEAD `7e06fc6c1420d0188eb9d889bd74e2e1fb76e448`)
- `project-reports/openblas.md`, `project-reports/numpy.md`, `project-reports/onednn.md` (internal cross-referenced dependency reports)