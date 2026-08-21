# RISC-V Software Ecosystem: Project Priorities, Green-Field Markets, and High-Moat Spaces to Avoid

**Date:** August 2026  
**Scope:** Strategic evaluation across 147 open-source project reports ([reports directory](file:///Users/gregsterling/repos/git/sw-ecosystem/reports)) identifying high-ROI green-field opportunities vs. low-ROI entrenched markets for RISC-V.

---

## Executive Strategy Summary

```
                       STRATEGIC MARKET MATRIX
                       
     HIGH OPPORTUNITY (Pursue / Green Field)       LOW ROI / HIGH MOAT (Avoid / De-prioritize)
  ┌──────────────────────────────────────────┐   ┌──────────────────────────────────────────┐
  │ • Edge & On-Device Agentic AI (C++/MLIR) │   │ • Consumer Smartphones (ARM / Android)   │
  │ • Safety-Critical Auto & Aerospace RTOS  │   │ • Dense Server AI Training (NVIDIA CUDA) │
  │ • Confidential Computing & Security TEEs │   │ • Legacy x86 Windows Desktop Apps        │
  │ • Rust Serverless & Wasm MicroVMs        │   │ • Unmaintained Libraries (NNPACK/psimd) │
  │ • Custom RVV DSP & Codec Hardware        │   │ • Proprietary x86 SIMD Frameworks        │
  └──────────────────────────────────────────┘   └──────────────────────────────────────────┘
```

---

## 1. Novel / Green-Field Markets to Investigate (High ROI)

These are emerging software and hardware markets where legacy x86/ARM incumbents have not established insurmountable software moats, and where RISC-V’s open ISA, custom vector extensions (RVV 1.0), and zero licensing costs provide a strong competitive advantage.

### A. Edge & On-Device Agentic AI (Lightweight C++ & MLIR Runtimes)
- **Why it's a Green Field**: Server-side AI is dominated by NVIDIA CUDA and Python frameworks ([PyTorch](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md)), but **edge LLM inference** and **on-device agentic AI** are in their infancy.
- **Evidence in Reports**: [llama.cpp](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/llama-cpp.md) merged RVV 1.0 (VLEN=128/256) matrix kernels cleanly with fast execution on SpacemiT X100 and Sophgo SG2044. [ExecuTorch](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md#103-executorch) has an active RISE RISC-V fork.
- **Actionable Focus**:
  - Invest in lightweight, non-Python C++/Rust inference engines ([llama.cpp](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/llama-cpp.md), [ExecuTorch](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md#103-executorch), Alibaba MNN, IREE, Apache TVM) instead of trying to fix legacy Python dependency chains.

### B. Safety-Critical Real-Time Systems (Automotive & Aerospace)
- **Why it's a Green Field**: Proprietary automotive and avionics SoCs are locked into expensive ARM Cortex-R or legacy SPARC chips. Software stacks are transitioning toward **open safety-critical standards**.
- **Evidence in Reports**: [Linux RAS](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/linux-ras.md), [hwmon](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/hwmon.md), [bionic](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/bionic.md).
- **Actionable Focus**:
  - Target **Type-1 hypervisor isolation** (Jailhouse, Xen), **safety-critical RTOSs** (Zephyr, RTEMS), and **NASA flight software** (cFS, FPrime).
  - Invest in formal verification runtimes (`SPARK`/`Ada`) for DO-178C avionics and ISO 26262 automotive certification.

### C. Confidential Computing, Root-of-Trust & Security Enclaves
- **Why it's a Green Field**: Traditional x86 (Intel SGX, AMD SEV) and ARM (TrustZone) hardware security enclaves are proprietary black boxes. RISC-V is becoming the de-facto open standard for hardware security silicon.
- **Evidence in Reports**: [OpenSSL](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/openssl.md), [BoringSSL](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/boringssl.md), [libgcrypt](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/libgcrypt.md), [libseccomp](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/libseccomp.md).
- **Actionable Focus**:
  - Upstream hardware-accelerated cryptographic ISA extensions (`Zkn`/`Zks`) into security libraries.
  - Standardize open TEE (Trusted Execution Environment) architectures (e.g., Keystone Enclave) for confidential cloud computing.

### D. Rust-Native Serverless & WebAssembly (Wasm) MicroVMs
- **Why it's a Green Field**: Serverless edge infrastructure (FaaS) is moving away from heavy Docker containers toward **Rust-based microVMs** and **WebAssembly sandboxes**.
- **Evidence in Reports**: [Go](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/go.md), Rust ecosystem, [runc](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/runc.md), [BuildKit](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/buildkit.md).
- **Actionable Focus**:
  - Focus on Rust-native VMMs (`cloud-hypervisor`, `crosvm`, `firecracker`) and WebAssembly runtimes (`wasmtime`, `wasmer`). Rust has near 1:1 feature parity on `riscv64`, bypassing legacy x86 hypervisor bloat.

### E. Domain-Specific RVV Codec & DSP Hardware Acceleration
- **Why it's a Green Field**: Next-generation open media codecs (AV1, VVC, Opus) require custom vector acceleration.
- **Evidence in Reports**: [dav1d](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/dav1d.md), [FFmpeg](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/ffmpeg.md), [SVT-AV1](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/svt-av1.md), [libopus](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/libopus.md).
- **Actionable Focus**:
  - Expand RVV 1.0 vector assembly routines in open media libraries ([dav1d](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/dav1d.md), [FFmpeg](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/ffmpeg.md)). Video decoding is a core requirement for video surveillance, automotive cameras, and smart TVs.

---

## 2. Spaces & Markets Worth Avoiding (Low ROI / Entrenched Incumbents)

Attempting to compete head-on in these markets will result in high engineering expenditure for minimal strategic gain due to deeply entrenched proprietary software moats or unmaintained codebases.

### A. Mass Consumer Smartphones (ARM / Android NDK Monopoly)
- **Why Avoid**: ARM holds a 99%+ monopoly on consumer mobile smartphones. Google’s Android NDK ecosystem, propriety GPU vendor drivers (Adreno, Mali), and application binary dependencies are deeply locked into ARM64 (`aarch64`).
- **Evidence in Reports**: [ART](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/art.md), [Bionic](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/bionic.md), [VIXL](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/vixl.md).
- **Strategic Recommendation**: De-prioritize competing with flagship ARM smartphones. Instead, focus on embedded Android devices (smart home hubs, automotive IVI displays, industrial point-of-sale terminals).

### B. Dense Datacenter LLM Training (NVIDIA CUDA Ecosystem)
- **Why Avoid**: NVIDIA has spent 18+ years building a software moat around CUDA, TensorRT, and Megatron-LM. Trying to port legacy C++/CUDA server training frameworks to RISC-V CPUs is low ROI.
- **Evidence in Reports**: [PyTorch](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/pytorch.md) maintainers (Meta) treat RISC-V as Tier-3 opt-in, placing issues in "Cold Storage". [FBGEMM](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/fbgemm.md) explicitly excludes RISC-V.
- **Strategic Recommendation**: Do not try to turn RISC-V CPUs into server AI training chips. Leave dense server training to specialized GPUs/NPUs, and focus RISC-V efforts on **CPU/NPU edge inference** ([llama.cpp](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/llama-cpp.md), MLIR compilers).

### C. Legacy x86 Desktop Applications & Unmaintained Libraries
- **Why Avoid**: Legacy x86 Windows software relies on proprietary Win32 APIs and hardcoded x86 SIMD assumptions.
- **Evidence in Reports**: [NNPACK](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/nnpack.md) (unmaintained since 2020), [psimd](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/nnpack.md#9-dependencies) (archived May 2024), [FBGEMM](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/fbgemm.md).
- **Strategic Recommendation**: Abandon legacy libraries like NNPACK and psimd. Redirect engineering resources toward modern, actively maintained backends (XNNPACK, oneDNN, IREE).

---

## Strategic Roadmap & ROI Recommendations

| Priority Level | Target Market / Initiative | Key Target Software | Rationale |
| :--- | :--- | :--- | :--- |
| 🔥 **High Priority (Green Field)** | **Edge & On-Device Agentic AI** | [llama.cpp](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/llama-cpp.md), ExecuTorch, IREE, MNN | Fastest growing AI market; zero legacy CUDA bloat; native RVV 1.0 advantage. |
| 🔥 **High Priority (Green Field)** | **Automotive & Aerospace RTOS** | ROS 2, Zephyr, RTEMS, NASA cFS, Jailhouse | Safety-critical domain isolation; high-margin industrial hardware market. |
| 🔥 **High Priority (Green Field)** | **Confidential Edge Computing** | OpenSSL RVV, Keystone TEE, mbedTLS | RISC-V can establish itself as the open root-of-trust standard. |
| ⚡ **Medium Priority** | **Rust MicroVMs & Wasm Edge** | `cloud-hypervisor`, `firecracker`, `wasmtime` | Rust has 1:1 parity on RISC-V; ideal for serverless edge infrastructure. |
| 🛑 **Avoid / Low Priority** | **Consumer Smartphones (NDK)** | Mobile Android NDK Apps | Entrenched ARM monopoly; multi-billion dollar enablement cost. |
| 🛑 **Avoid / Low Priority** | **Server AI Training (CUDA)** | Legacy PyTorch CUDA ops, FBGEMM | Entrenched NVIDIA CUDA moat; PyTorch maintainer resistance. |
