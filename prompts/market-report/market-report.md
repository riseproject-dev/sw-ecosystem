# RISC-V Software Ecosystem Technical Market Assessment

**Date:** July 2026  
**Scope:** Comprehensive assessment of 147 open-source projects across the RISC-V (`riscv64/linux`) software ecosystem ([reports directory](file:///Users/gregsterling/repos/git/sw-ecosystem/reports)).

---

## Executive Ecosystem Summary

The RISC-V software ecosystem exhibits a clear **two-speed maturity model**:
1. **Infrastructure, Runtimes, and Cloud-Native (Production Ready)**: Lower-level system components (Linux kernel, GNU toolchain/LLVM, Go, Rust, Java OpenJDK, Kubernetes, Docker, PostgreSQL, C/C++ core libraries) are well-supported upstream with native CI and package distribution.
2. **AI/ML, Python Binary Ecosystem, and Advanced JIT Runtimes (Requires Help)**: High-level application stacks—specifically PyTorch, vLLM, Python AI binary packages (`pip`), mobile Android runtimes, and JIT compilers—suffer from binary distribution gaps (missing PyPI wheels), unmerged RVV 1.0 vectorization PRs, and a lack of upstream maintainer ownership.

```
       ┌─────────────────────────────────────────────────────────┐
       │             Well Supported (Production Ready)           │
       │  Linux Kernel, Toolchains, Go, Rust, OpenJDK, K8s,     │
       │  containerd, PostgreSQL, Redis, FFmpeg, OpenSSL, glibc   │
       └────────────────────────────┬────────────────────────────┘
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       │             Basically Works (Functional / Friction)     │
       │  Chromium, Firefox, V8, Ceph, MariaDB, Spark, llama.cpp,  │
       │  LangChain, Observability, Web Servers (Nginx/Httpd)    │
       └────────────────────────────┬────────────────────────────┘
                                    │
       ┌────────────────────────────┴────────────────────────────┐
       │             Needs Help (Strategic Gaps)                 │
       │  PyTorch (ATen RVV), vLLM (CI/Wheels), PyPI Wheels,    │
       │  XNNPACK FP16, Android ART, numba/llvmlite, SwiftShader  │
       └─────────────────────────────────────────────────────────┘
```

---

## 1. Markets That Are Well Supported (Production Ready)

These markets have mature upstream support, official native or QEMU CI gating PRs, distribution packaging (Debian, Ubuntu, Arch), and robust feature parity.

### A. Core OS, Compilers & Developer Toolchain
- **Components**: [glibc](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/glibc.md), [bionic](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/bionic.md), GCC, Clang/LLVM, [GDB](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/gdb.md), [LLDB](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/lldb.md), [elfutils](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/elfutils.md), [QEMU](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/qemu.md), [linux-perf](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/linux-perf.md), [eBPF](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/ebpf.md), [libbpf](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/libbpf.md).
- **Status**: Excellent. Full Tier 1/2 support across toolchains. `riscv64` is a primary architecture target in Linux kernel development and GCC/LLVM toolchains. Debugging and profiling primitives (`ebpf`, `perf`, `gdb`) work natively.

### B. Core Language Runtimes
- **Components**: [Go](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/go.md), Rust (`cargo`), [CPython core](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/python.md), [OpenJDK / Java](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/openjdk.md).
- **Status**: Excellent. The Go runtime has native `riscv64` support with active garbage collection and concurrency primitives. CPython core builds as `py3-none-any` or from source cleanly. OpenJDK 21+ includes a fully functional HotSpot JIT compiler for RISC-V (`rv64gc`).

### C. Containerization & Cloud Native
- **Components**: [Kubernetes](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/kubernetes.md), [containerd](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/containerd.md), [runc](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/runc.md), [Docker](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/docker.md), [BuildKit](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/buildkit.md), [CoreDNS](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/coredns.md), [etcd](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/etcd.md), [Traefik](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/traefik.md), [Envoy](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/envoy.md), [Open vSwitch](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/openvswitch.md).
- **Status**: Production Ready. Because most cloud-native tooling is written in Go, the entire container orchestration stack compiles and runs natively on `riscv64`. Prebuilt container images and multi-arch manifests (`linux/riscv64`) are widely published.

### D. Core Libraries & Relational Databases
- **Components**: [PostgreSQL](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/postgresql.md), [Redis](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/redis.md), [SQLite](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/sqlite.md), [Memcached](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/memcached.md), [OpenSSL](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/openssl.md), [libcurl](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/libcurl.md), [zlib](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/zlib.md), [libffi](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/libffi.md), [liburing](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/liburing.md).
- **Status**: Strong. Core C databases and security libraries run smoothly, backed by Linux distro packaging. OpenSSL 3.x includes RVV-accelerated cryptographic primitives.

### E. Core Multimedia Primitives
- **Components**: [FFmpeg](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/ffmpeg.md), [GStreamer](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/gstreamer.md), [dav1d](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/dav1d.md), [libpng](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/libpng.md), [libjpeg-turbo](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/libjpeg-turbo.md), [HarfBuzz](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/harfbuzz.md), [FreeType](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/freetype.md).
- **Status**: Strong. Core audio/video codecs have merged initial assembly and RVV vectorization routines, backed by active multimedia maintainers.

---

## 2. Markets That "Basically Work" (Functional with Operational Friction)

These markets are functionally working and can be deployed today, but suffer from build-from-source friction, missing binary wheels, opt-in CI, or partial vector optimization.

### A. Web Browsers & Client Engines
- **Components**: [Chromium](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/chromium.md), [Firefox](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/firefox.md), [V8](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/v8.md), [SpiderMonkey](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/spidermonkey.md), [WebKit](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/webkit.md), [Skia](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/skia.md).
- **Status**: Functional. Chromium and Firefox render pages correctly on `riscv64` desktop distros. V8 and SpiderMonkey have functional RVV JIT backends, but upstream maintainers treat RISC-V as community-maintained, meaning tier-1 CI gating is absent.

### B. Enterprise Databases & Data Analytics
- **Components**: [MariaDB](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/mariadb.md), [MySQL](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/mysql.md), [Ceph](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/ceph.md), [Apache Spark](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/spark.md), [Apache Hadoop](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/hadoop.md), [Apache Flink](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/flink.md).
- **Status**: Functional. Build and run successfully, but require manual configuration tuning (e.g. disabling x86 SIMD assumptions or adjusting memory allocators).

### C. C++ LLM & Inference Engines
- **Components**: [llama.cpp](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/llama-cpp.md), [LangChain](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/langchain.md).
- **Status**: Functional. `llama.cpp` has merged RVV 1.0 (VLEN=128/256) matrix multiplication kernels, running efficiently on hardware like SpacemiT X100 and Sophgo SG2044. LangChain core runs as pure Python, but relies on downstream C++ dependencies.

### D. System Observability & Monitoring
- **Components**: [Grafana Alloy](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/grafana-alloy.md), [OpenTelemetry](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/opentelemetry.md), [Prometheus](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/prometheus.md).
- **Status**: Functional. Telemetry agents build cleanly via Go runtime, but binary release packaging on PyPI/npm/GitHub assets is inconsistent.

---

## 3. Markets That Need Help (Strategic Gaps & Blockers)

These markets face major architectural gaps, unmerged vectorization PRs, missing PyPI binary wheels, or broken CI test suites.

### A. AI / ML & Deep Learning Frameworks
- **Components**: [PyTorch](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/pytorch.md), [vLLM](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/vllm.md), [LiteRT / TFLite](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/litert.md), [ONNX](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/onnx.md), [XNNPACK](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/xnnpack.md), [FBGEMM](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/fbgemm.md), [NNPACK](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/nnpack.md).
- **Primary Blockers**:
  1. **PyTorch ATen RVV Vectorization Unmerged**: The core ATen `Vectorized<>` RVV template library ([PR #175746](https://github.com/pytorch/pytorch/pull/175746)) remains unmerged due to scalable-vector memory copy design disputes (`Vectorized::size()`). Un-optimized operators fall back to scalar execution.
  2. **XNNPACK FP16 Breakdown**: Over 100 FP16 test failures due to missing `cpuinfo_has_riscv_zvfh()` API.
  3. **vLLM Operational Gaps**: No automated upstream CI runs on PRs; chunked prefill is unconditionally disabled; FP8 KV cache is unsupported.

### B. Python Scientific & AI Packaging (`PyPI`)
- **Components**: `torch`, `vllm`, [NumPy](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/numpy.md) (wheel targeted Q3 2026), [tiktoken](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/vllm.md#9-dependencies), [sentencepiece](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/vllm.md#9-dependencies), [faiss-cpu](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/faiss.md), `uuid-utils`.
- **Primary Blockers**:
  - **The "Pip Install Gap"**: Zero official `riscv64` binary wheels exist on PyPI for `torch`, `vllm`, `tiktoken`, or `faiss-cpu`. End users must spend hours compiling C++/Rust dependencies from source.

### C. Mobile & Android Ecosystem
- **Components**: [ART (Android Runtime)](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/art.md), [Bionic](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/bionic.md), [VIXL](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/vixl.md).
- **Primary Blockers**:
  - Android RISC-V ports remain experimental. ART JIT/AOT code generation for RISC-V is functional but lacks vectorization parity with ARM NEON/SVE, and Google NDK tooling does not treat RISC-V as a primary target.

### D. Specialized Compilers & Graphics Renderers
- **Components**: [numba / llvmlite](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/numba.md), [GraalVM](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/graalvm.md), [SwiftShader](file:///Users/gregsterling/repos/git/sw-ecosystem/project-reports/swiftshader.md).
- **Primary Blockers**:
  - `llvmlite` lacks `riscv64` support, completely blocking `numba` JIT.
  - `SwiftShader` (Vulkan software rendering) lacks RVV vectorization, degrading graphics performance.

---

## Root Causes & Recommendations for Engineering Leadership

| Issue Category | Root Cause | Recommended Action |
| :--- | :--- | :--- |
| **PyPI Binary Distribution** | Lack of official `manylinux_riscv64` wheel build pipelines on PyPI. | Expand the [RISE Wheel Builder](https://riseproject.gitlab.io/python/wheel_builder/) to publish PyPI-compatible `manylinux` wheels for `torch`, `vllm`, `tiktoken`, and `faiss-cpu`. |
| **PyTorch / vLLM Review Latency** | Mainstream maintainers (e.g., Meta) do not review RISC-V PRs with SLA guarantees. | Fund dedicated RISC-V maintainer positions (CODEOWNERS) inside `pytorch/pytorch` and `vllm-project/vllm`. |
| **RVV Vectorization Gap** | Debate over fixed vector length vs scalable vector length (`Vectorized::size()`). | Standardize RVV 1.0 dispatch routines in ATen and XNNPACK using VLEN-parameterized CMake configurations. |
| **CI Infrastructure** | Heavy reliance on slow QEMU user-mode emulation. | Migrate upstream CI runners to native bare-metal RISC-V hardware (e.g., Scaleway EM-RV1 via RISE Runners). |
