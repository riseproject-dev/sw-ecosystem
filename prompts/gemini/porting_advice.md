# Technical Guide & Advice for Porting Open-Source Software to RISC-V

**Date:** August 2026  
**Scope:** Actionable advice, best practices, and anti-patterns derived from analyzing 147 open-source project status reports ([reports directory](file:///Users/gregsterling/repos/git/sw-ecosystem/reports)).

---

## Executive Summary

Porting software to RISC-V (`riscv64`) effectively requires navigating key architectural and ecosystem challenges: **dynamic vector length (VLEN) variance**, **compiler ISA flag compatibility**, **runtime feature detection**, **PyPI wheel packaging**, and **native CI test gating**.

This guide outlines actionable technical suggestions for open-source maintainers and contributors to ensure successful, production-grade RISC-V ports.

---

## 1. Build System & Compilation Infrastructure

### A. Avoid Hardcoding Fixed Vector Lengths (`march` flags)
- **The Issue**: Hardcoding static vector bit-width flags like `-march=rv64gcv_zvl128b` causes compilation errors or runtime segfaults on hardware with different vector lengths (e.g. `VLEN=256` on SpacemiT X100/K1 chips).
- **Evidence**: In [vLLM](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/vllm.md), hardcoded `zvl128b` caused hard crashes on `VLEN=256` chips until [PR #39478](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/vllm.md#2-port-history-and-upstreaming-timeline) introduced dynamic CMake VLEN parameterization.
- **Best Practice**: Use generic compiler vector flags (`-march=rv64gcv`) and parameterize vector lengths in CMake/Meson (`-DVLLM_RVV_VLEN=<N>`), allowing runtime or build-time VLEN configuration.

### B. Handle `-march=native` Gracefully in JIT Compilers
- **The Issue**: Pass-through flags like `-march=native` sent to GCC/g++ on RISC-V can cause compiler crashes because GCC requires explicit target ISA strings (starting with `rv64...`).
- **Evidence**: In [PyTorch Inductor](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md), `-march=native` caused hard crashes until [PR #167071](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md#2-port-history-and-upstreaming-timeline) and [PR #184297](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md#2-port-history-and-upstreaming-timeline) added explicit RISC-V target handling (`cpp.march`).
- **Best Practice**: Add explicit architecture checks for `riscv64` in JIT code generators to pass valid target strings (e.g. `rv64gc` or `rv64gcv`).

### C. Automatically Guard Non-Existent x86/ARM Dependencies
- **The Issue**: Build systems frequently attempt to compile x86-only submodules (e.g., FBGEMM, NNPACK, psimd, MKL) on RISC-V, resulting in build failures.
- **Evidence**: In [PyTorch Dependencies.cmake](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md#53-recommended--duse_xoff-flags-for-riscv64), building on RISC-V required manually specifying `-DUSE_CUDA=OFF -DUSE_MKLDNN=OFF -DUSE_FBGEMM=OFF -DUSE_NNPACK=OFF`.
- **Best Practice**: Update project CMake/Meson allowlists so that when `CMAKE_SYSTEM_PROCESSOR` is `riscv64`, architecture-specific submodules are automatically disabled without requiring manual user flags.

---

## 2. Runtime Hardware Feature Detection

### A. Use Kernel Hardware Probe Syscalls (`sys_riscv_hwprobe`)
- **The Issue**: Scrape-parsing `/proc/cpuinfo` for ISA strings is brittle because vendor Linux kernels and QEMU user-mode emulators often omit VLEN hint flags (like `zvl128b`), causing silent fallbacks to slow scalar code.
- **Evidence**: On Sophgo SG2044 hardware, [vLLM](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/vllm.md) degraded to scalar performance because `/proc/cpuinfo` lacked `zvl128b` flags, requiring a C++ fallback helper in [PR #43179](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/vllm.md#2-port-history-and-upstreaming-timeline).
- **Best Practice**: Use the Linux 6.4+ `sys_riscv_hwprobe()` syscall or the `cpuinfo` library API (`src/riscv/`) to query hardware vector and ISA capabilities dynamically at runtime.

### B. Validate FP16/BF16 Vector Extension Support
- **The Issue**: Unconditionally compiling with `-march=rv64gcv_zvfh` without verifying CPU runtime support for `Zvfh` (half-precision vector) or `Zvfbfmin` (BFloat16 vector) causes illegal instruction exceptions (`SIGILL`) or numerical corruption.
- **Evidence**: In [XNNPACK](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/xnnpack.md), unconditionally enabling `Zvfh` flags without a `cpuinfo_has_riscv_zvfh()` check resulted in over 100 FP16 test failures (Issue [#9886](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/xnnpack.md#9-dependencies)).
- **Best Practice**: Gate FP16 (`Zvfh`) and BF16 (`Zvfbfmin`) vector code paths behind runtime ISA extension checks before dispatching vector kernels.

---

## 3. RVV 1.0 Vectorization & Kernel Design

### A. Support Scalable Vector Types (`vfloat32m1_t`) Over Fixed Structs
- **The Issue**: C++ SIMD abstractions (like PyTorch’s `Vectorized<T>`) often assume fixed 128-bit or 256-bit register layouts (`Vectorized::size()`), blocking vectorization on scalable vector architectures.
- **Evidence**: In [PyTorch](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md), core RVV ATen vectorization ([PR #175746](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md#43-rvv-aten-vectorization-work-in-progress)) stalled because template assumptions conflicted with scalable vector memory copies.
- **Best Practice**: Decouple SIMD vector register wrappers from fixed memory sizes. Use RVV C intrinsics with dynamic LMUL mappings (`vfloat32m1_t`, `vfloat32m2_t`) or C++ RVV intrinsic libraries like [Google Highway](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/highway.md).

### B. Clamp Inputs for Transcendental & Polynomial Vector Kernels
- **The Issue**: Polynomial approximations for `exp()`, `tanh()`, or `erf()` using RVV vector fused multiply-accumulate (`vfmacc`) can overflow or produce `NaN` on large negative inputs via `-inf * 0.0 = NaN`.
- **Evidence**: In [vLLM](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/vllm.md), unclamped `FP32Vec16::exp()` produced `NaN` scores in attention softmax until [PR #40428](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/vllm.md#2-port-history-and-upstreaming-timeline) added input clamping to `[-87.33, 88.72]`.
- **Best Practice**: Always clamp input ranges in math function vector kernels before evaluating polynomial series.

---

## 4. CI/CD Infrastructure & Testing

### A. Adopt Free Bare-Metal CI Runners (RISE Runners)
- **The Issue**: Relying solely on QEMU user-mode emulation in CI is slow, lacks real RVV 1.0 hardware validation, and often fails on binfmt setup in containerized runners.
- **Evidence**: In [PyTorch](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md), in-tree native build PR [#182278](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md#55-qemu-setup-in-ci-runners) failed due to QEMU container permission issues.
- **Best Practice**: Integrate free native RISC-V runners provided by the **[RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)** program (Scaleway EM-RV1 bare-metal servers, GitHub label `ubuntu-24.04-riscv`) into `.github/workflows/`.

### B. Use Out-of-Tree CI Relays to Reduce Maintainer Burden
- **The Issue**: Mainstream maintainers hesitate to add non-blocking RISC-V CI jobs in-tree due to runner maintenance overhead.
- **Evidence**: The RISE project established `riseproject-dev/pytorch-ci` using GitHub workflow dispatch relays ([PyTorch PR #181739](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md#72-out-of-tree-ci-riseproject-devpytorch-ci)) to test pull requests on native hardware without burdening core maintainers.
- **Best Practice**: Use label-triggered workflow relays (`ciflow/riscv64`) so community runners can run test suites independently.

---

## 5. Packaging & Governance

### A. Publish `manylinux_2_31_riscv64` PyPI Wheels
- **The Issue**: End users experience heavy friction when `pip install` fails to find binary wheels, triggering long C++/Rust compilation cycles.
- **Best Practice**: Add `manylinux_2_31_riscv64` wheel build stages using `cibuildwheel` or submit packages to the **[RISE Wheel Builder](https://riseproject.gitlab.io/python/wheel_builder/)**.

### B. Designate Named RISC-V Maintainers (`CODEOWNERS`)
- **The Issue**: Pull requests stall for months when maintainers have no explicit SLA or assignment for RISC-V code paths.
- **Best Practice**: Add a `RISC-V` section to `CODEOWNERS` and assign named community reviewers (e.g. from RISE member companies) to review and approve architecture-specific PRs promptly.

---

## Summary Checklist for Project Maintainers

| Domain | Best Practice Checklist | Primary Benefit |
| :--- | :--- | :--- |
| **Build System** | ✅ Parameterize VLEN; avoid fixed `-march=zvl128b`. | Prevents segfaults on 256-bit vector hardware. |
| **Compiler Flags** | ✅ Handle RISC-V target strings in JIT compilers instead of `-march=native`. | Fixes GCC/Clang JIT compilation crashes. |
| **Feature Detection** | ✅ Use `sys_riscv_hwprobe` or `cpuinfo` API for runtime ISA detection. | Avoids false-negative scalar fallbacks. |
| **Vector Kernels** | ✅ Clamp inputs to math functions (`exp()`, `tanh()`). | Prevents NaN output corruption in attention layers. |
| **CI Testing** | ✅ Integrate **RISE RISC-V Runners** (`ubuntu-24.04-riscv`). | Enables fast, native bare-metal PR testing. |
| **Packaging** | ✅ Publish `manylinux_2_31_riscv64` PyPI wheels via `cibuildwheel`. | Eliminates user build-from-source friction. |
