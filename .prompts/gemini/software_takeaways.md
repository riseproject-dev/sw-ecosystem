# RISC-V Software Ecosystem: Key Takeaways for Software Developers

**Date:** August 2026  
**Scope:** Practical developer guidance based on 147 open-source project status reports ([reports directory](file:///Users/gregsterling/repos/git/sw-ecosystem/reports)).

---

## Executive Summary

Developing software for or on RISC-V (`riscv64`) is highly rewarding in **systems programming, cloud-native Go/Rust microservices, and lightweight C++ AI inference**, but presents significant operational friction in **Python AI/ML binary package distribution** and **unmerged framework vectorization routines**. 

---

## 1. Language Selection Dictates 90% of Your Friction

Your developer experience on RISC-V depends entirely on the programming language and toolchain you choose:

```
       ┌────────────────────────────────────────────────────────┐
       │ LOW FRICTION (Smooth)                                  │
       │ • Go & Rust: 1:1 runtime parity; cross-compiles easily. │
       │ • C/C++ (Systems): GCC 14+ / Clang 18+ rock-solid.      │
       │ • Pure Python: py3-none-any wheels install natively.   │
       └───────────────────────────┬────────────────────────────┘
                                   │
       ┌───────────────────────────┴────────────────────────────┐
       │ HIGH FRICTION (Build From Source)                      │
       │ • Python AI/ML (PyTorch, vLLM, NumPy): Missing wheels. │
       │ • Rust/C++ CGO extensions (tiktoken, faiss-cpu).      │
       │ • JIT Python engines (numba / llvmlite unsupported).  │
       └────────────────────────────────────────────────────────┘
```

- **Go & Rust**: **Near-frictionless**. Setting `GOARCH=riscv64` or `cargo build --target riscv64gc-unknown-linux-gnu` produces production-ready binaries. Cloud microservices, CLI tools, and container engines work smoothly.
- **C/C++ Systems Code**: **Solid**. GCC 14+, Clang 18+, `glibc`, and POSIX APIs are mature.
- **Pure Python**: **Works out of the box**. Packages like [LangChain](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/langchain.md), `requests`, or `pydantic` install natively via `pip`.
- **Python with Native Extensions**: **High friction**. You will encounter missing prebuilt binary wheels (`torch`, `vllm`, `tiktoken`, `faiss-cpu`) and must compile dependencies from source.

---

## 2. Mind the "Pip Install Gap" for Python AI & Data Science

If you are developing Python AI or data science applications:
- **The Problem**: Running `pip install torch` or `pip install vllm` on a `riscv64` board will fail to find a prebuilt wheel, triggering hours-long native compilation processes (or failing outright if Rust toolchains or header dependencies are missing).
- **Developer Workaround**:
  1. Use the **[RISE Wheel Builder](https://riseproject.gitlab.io/python/wheel_builder/)** mirror (`gitlab.com/riseproject/python/wheel_builder`), which hosts prebuilt `riscv64` wheels for 80+ packages (NumPy, SciPy, Safetensors, Tokenizers).
  2. Use Linux distribution packages (e.g. Debian sid `python3-torch` or Arch Linux RISC-V).
  3. Swap out heavy Python AI frameworks for **pure C++ inference runtimes** like [llama.cpp](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/llama-cpp.md).

---

## 3. Vectorization (RVV 1.0) Realities: Code for Dynamic Vector Lengths

When writing or tuning C/C++ or assembly code for RISC-V Vector Extensions (RVV 1.0):
- **Hardware Variation**: Vector lengths (`VLEN`) differ across real-world hardware (e.g., `VLEN=128` on Sophgo SG2044 vs `VLEN=256` on SpacemiT X100/K1).
- **Best Practice**: Avoid hardcoding fixed vector bit widths (like `-march=rv64gcv_zvl128b`). Write VLEN-parameterized code or query vector capabilities dynamically at runtime via `/proc/cpuinfo` or `sys_riscv_hwprobe`.
- **Scalar Fallbacks**: Be aware that in large frameworks like PyTorch, unless an operation specifically uses [oneDNN](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/onednn.md) or [XNNPACK](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/xnnpack.md), tensor operations currently fall back to **scalar execution** because core ATen RVV vectorization ([PR #175746](https://github.com/pytorch/pytorch/pull/175746)) remains unmerged upstream.

---

## 4. Upstream CI is Often Opt-In—Run Your Own Gating Tests

Do not assume that an upstream open-source project's PR checks will protect `riscv64` compatibility:
- Mainstream maintainers for many tier-3 projects (e.g. PyTorch, Chromium, vLLM) do not block PR merges on `riscv64` test failures. A pull request can silently break RISC-V support without failing the main repo's CI.
- **Developer Workaround**: Integrate free, native RISC-V GitHub Actions runners via the **[RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)** program (Scaleway EM-RV1 bare-metal servers, label `ubuntu-24.04-riscv`) to run your own CI gating jobs.

---

## 5. Systems Programming & Linux Kernel Interfaces are Rock-Solid

If you are developing low-level systems software, drivers, networking tools, or kernel modules:
- Linux kernel interfaces ([eBPF](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/ebpf.md), [linux-perf](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/linux-perf.md), `libbpf`, `io_uring`), memory allocators ([jemalloc](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/jemalloc.md), `tcmalloc`), and debuggers ([GDB](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/gdb.md), [LLDB](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/lldb.md)) work natively with high stability.
- Cryptographic acceleration via OpenSSL 3.x leverages RISC-V scalar crypto (`Zkn`/`Zks`) out of the box.

---

## Developer Cheat Sheet

| Task / Domain | Recommended Tech Stack on RISC-V | Caution / What to Avoid |
| :--- | :--- | :--- |
| **Cloud Microservices** | Go, Rust, Docker, Kubernetes, Traefik | Avoid CGO dependencies if cross-compiling. |
| **Local LLM Inference** | [llama.cpp](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/llama-cpp.md) (C++ with RVV 1.0) | Avoid building heavy Python [vLLM](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/vllm.md)/PyTorch stacks from source. |
| **Agentic AI & Orchestration** | Pure Python ([LangChain](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/langchain.md)) + Remote API Endpoints | Avoid local vector DBs requiring unbuilt Rust wheels (`tiktoken`). |
| **Edge / TinyML** | C/C++, [LiteRT](file:///Users/gregsterling/repos/git/sw-ecosystem/reports/litert.md), Zephyr RTOS, tflite-micro | Avoid `numba` / `llvmlite` (completely unsupported). |
| **Systems & Networking** | Rust, C (GCC 14+), `eBPF`, `liburing`, OpenSSL | Avoid hardcoded x86 SIMD assumptions (`AVX-512`). |
