---
title: gRPC
parent: Project Reports
categories:
  - libraries
---

# gRPC

**Author:** Ludovic HENRY `<ludovic.henry@qti.qualcomm.com>`
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for gRPC
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

gRPC is a high-performance, open-source, language-agnostic remote procedure call framework. It uses HTTP/2 as transport, Protocol Buffers as the default serialization format, and supports bidirectional streaming. It is used pervasively as the inter-service communication layer in distributed systems across cloud, datacenter, and mobile deployments.

**Governance.** gRPC is a [CNCF Incubating](https://www.cncf.io/projects/grpc/) project, accepted 2017-02-16. It has never graduated to CNCF Graduated tier. It operates under the Linux Foundation / CNCF charter and code of conduct. Policy and vision authority rests with a Steering Committee of 7 seats, elected annually with 1-year terms. As of June 2026:

| Member | Organization |
|--------|-------------|
| Antoine Tollenaere | Datadog |
| April Kyle Nassi | Google |
| Craig Tiller | Google |
| Jung-Yu (Gina) Yeh | Google |
| Kevin Nilson | Google |
| Mark Roth | Google |
| Nupur Kothari | Google |

Six of seven seats are Google employees. The project is Google-controlled in practice.

**Corporate maintainers.** The grpc/grpc C-core repository lists approximately 34 active maintainers; 33 are Google employees [NEEDS VERIFICATION on exact count]. Datadog holds one maintainer slot in the Go implementation (grpc-go). Apple holds maintainership over grpc-swift. Microsoft holds maintainership over grpc-dotnet.

**Substantial changes** require a gRFC (gRPC Request For Comments) filed in the [grpc/proposal](https://github.com/grpc/proposal) repository. Otherwise, all code changes go through GitHub pull requests.

**Community culture on new ports.** The record on RISC-V bug reports is unfavorable. Both [#35839](https://github.com/grpc/grpc/issues/35839) (libatomic undefined symbol, 2024-02) and [#36112](https://github.com/grpc/grpc/issues/36112) (Cython build failure, 2024-03) were closed with the disposition "requires-reporter-action" rather than maintainer-driven fixes. The open wheel request [#41591](https://github.com/grpc/grpc/issues/41591) (2026-02, P2) has received no maintainer comment or linked PR as of the reporting date. The pattern is reactive, not proactive.

**Repository statistics.** Repo created 2014-12-08. Stars: 44,919. Forks: 11,161. License: Apache-2.0.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2021-12-06 | PR [#28272](https://github.com/grpc/grpc/pull/28272) merged: CMake build prefers `-pthread` over `-lpthread`. Explicit motivation was riscv64: on GCC 11.1.0, `-pthread` auto-pulls `-latomic` which is required for riscv64, whereas `-lpthread` does not. First release containing this fix: v1.43.0 (2021-12-16). | [grpc/grpc #28272](https://github.com/grpc/grpc/pull/28272) |
| 2024-02-07 | Issue [#35839](https://github.com/grpc/grpc/issues/35839) opened: `__atomic_compare_exchange_1` undefined symbol on riscv64 Ubuntu 22.04 when importing `grpc_tools._protoc_compiler`. Closed 2024-02-15 with "requires reporter action." No upstream fix committed. | [grpc/grpc #35839](https://github.com/grpc/grpc/issues/35839) |
| 2024-03-13 | Issue [#36112](https://github.com/grpc/grpc/issues/36112) opened: grpcio wheel build fails on openSUSE Tumbleweed riscv64 (T-HEAD Lichee Pi 4A). Root cause: missing Cython-generated files. Closed 2024-04-15 with "requires reporter action." | [grpc/grpc #36112](https://github.com/grpc/grpc/issues/36112) |
| 2024-03-22 | [abseil/abseil-cpp #1644](https://github.com/abseil/abseil-cpp/pull/1644) merged: removes RISC-V `unscaledcycleclock` implementation that read `RDCYCLE` from userland. Linux kernel 6.6 made `RDCYCLE` privileged on RISC-V, causing SIGILL. riscv64 now falls back to `clock_gettime()`. | [abseil-cpp #1644](https://github.com/abseil/abseil-cpp/pull/1644) |
| 2024-09-24 | Issue [#37791](https://github.com/grpc/grpc/issues/37791) opened: non-deterministic SIGILL on riscv64 with grpc v1.66.1 / GCC 14.1 / Linux 6.6+. Root cause: gRPC's bundled abseil-cpp submodule was stale and still contained the RDCYCLE code removed upstream in March 2024. Closed approximately 2024-10-01 after submodule was updated. | [grpc/grpc #37791](https://github.com/grpc/grpc/issues/37791) |
| 2026-02-10 | Issue [#41591](https://github.com/grpc/grpc/issues/41591) opened: request to add official riscv64 manylinux/musllinux wheels to PyPI. Assigned to sergiitk. Status: open, P2, no linked PR, no maintainer comment as of reporting date. | [grpc/grpc #41591](https://github.com/grpc/grpc/issues/41591) |

**Zero riscv-named commits** exist in the grpc/grpc commit history (GitHub commit search returns 0 results for "riscv" in repo:grpc/grpc).

**Is the port fully upstream?** No. There is no formal riscv64 enablement effort, no architecture-specific code for RISC-V, and no riscv64 CI. The port works as a portable C fallback. Distros (Debian, Arch Linux RISC-V) build gRPC for riscv64 using system dependencies without upstream involvement.

---

## 3. Upstream Support Tier

**No formal tier policy exists.** The grpc/grpc repository has no `PLATFORMS.md`, `SUPPORT.md`, or architecture tier document. There is no stated list of supported architectures.

**Evidence-based tier assessment:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI: build gating | Yes | Yes (internal Kokoro) | No |
| CI: test execution | Yes | Yes | No |
| Official binary release | No (source only) | No (source only) | No |
| Official PyPI wheel | Yes | Yes | No (issue [#41591](https://github.com/grpc/grpc/issues/41591) open) |
| Arch-specific code | Yes (BoringSSL asm, SSE2 build flag) | Yes (BoringSSL asm, run_tests arm64 matrix) | No |
| Distro packages | Yes | Yes | Yes (via distro effort only) |
| Release blocking | Yes | Yes | No |

**Conclusion.** riscv64 is an untier'd, community-carry platform. Distros build it successfully but upstream takes no responsibility for it. Breakage on riscv64 does not block a release.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

gRPC has no JIT compiler. The performance-sensitive architecture-specific subsystems are: (a) cryptographic primitives in the bundled BoringSSL, (b) timing/profiling in the bundled abseil-cpp, and (c) hash acceleration via bundled xxhash.

### 4.1 BoringSSL (TLS/crypto)

BoringSSL is the default SSL provider in gRPC. It contains substantial ISA-specific assembly for x86_64 and aarch64. For riscv64, every path falls to the `nohw` (no-hardware) C scalar implementation.

| Crypto primitive | amd64 files | aarch64 files | riscv64 files |
|-----------------|-------------|---------------|---------------|
| AES/GCM | 11 (AES-NI, VPAES, GHASH, AVX2, AVX512) | 8 (AESv8, BSAES, GHASH-NEON, VPAES-ARMv8) | 0 |
| SHA-1/256/512 | 5 | 4 | 0 |
| BigNum/Montgomery mult | 6 (RSAZ-AVX2, mont) | 2 (armv8-mont) | 0 |
| CPU feature detection | `cpu_intel.cc` | `cpu_aarch64_linux.cc` + 5 more | none |

BoringSSL has no `cpu_riscv_linux.cc`, no Zvk (RISC-V Vector Cryptography) files, no RVV files. The platform detection header defines `OPENSSL_RISCV64` (`#elif defined(__riscv) && __SIZEOF_POINTER__ == 8`) but there is no associated assembly. BoringSSL's FIPS module does not support riscv64.

### 4.2 abseil-cpp (timing/profiling)

`unscaledcycleclock_config.h` enables the hardware cycle counter for: i386, x86_64, aarch64, powerpc, ppc, MSVC x86/x64. RISC-V support was removed in [abseil-cpp #1644](https://github.com/abseil/abseil-cpp/pull/1644) (March 2024) because Linux 6.6+ made `RDCYCLE` a privileged instruction. riscv64 now falls back to `clock_gettime(CLOCK_MONOTONIC)`.

### 4.3 xxhash (fast hashing)

xxhash 0.8.1 is bundled as a header (`third_party/xxhash/xxhash.h`). Auto-detection order: AVX512 -> AVX2 -> SSE2 -> NEON -> VSX -> scalar. No RVV path. riscv64 uses `XXH_SCALAR`.

### 4.4 gRPC core (iomgr, event engine, per-CPU)

`include/grpc/support/port_platform.h` defines no ISA-level macros and no cycle counter for any architecture (all platforms use `GPR_CYCLE_COUNTER_FALLBACK 1`). Cache line size defaults to 64 bytes for all unrecognized architectures. `per_cpu.cc` uses `sched_getcpu()` (POSIX-portable). There are OS-level splits (POSIX/Windows/Android) but zero CPU-ISA splits in gRPC core itself.

### 4.5 Summary table

| Component | amd64 | aarch64 | riscv64 |
|-----------|-------|---------|---------|
| BoringSSL AES/GCM | Full asm (AES-NI, AVX512) | Full asm (ARMv8 crypto) | Scalar C (nohw) |
| BoringSSL SHA | Full asm | Full asm | Scalar C |
| BoringSSL BigNum/RSA | Full asm (rsaz-avx2) | Full asm (armv8-mont) | Scalar C |
| BoringSSL FIPS | Yes | Yes | Not supported |
| abseil cycleclock | Full (RDTSC) | Full (cntvct_el0) | Removed (clock_gettime fallback) |
| xxhash | Full (AVX512/AVX2/SSE2) | Partial (NEON) | Scalar |
| gRPC core | Scalar (no ISA splits) | Scalar | Scalar |
| zlib compression | Partial (CRC32) | Partial (NEON) | Scalar |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems supported:** CMake (minimum 3.16) and Bazel. C++17 is mandatory from gRPC C++ 1.70 onward.

**No riscv64-specific toolchain file or Dockerfile exists in the repository.** The closest upstream cross-compile documentation uses aarch64 as the example (`test/distrib/cpp/run_distrib_test_cmake_aarch64_cross.sh`). There is no `run_distrib_test_cmake_riscv64_cross.sh`.

**Cross-compilation procedure for riscv64** (derived from the upstream aarch64 script with riscv64 substitutions, and confirmed against the Debian sid build):

Step 1 - install cross toolchain on x86_64 host:
```
apt-get install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu
```
This provides GCC 12 on Ubuntu 22.04 or GCC 13 on Debian bookworm. The Debian sid build used GCC 15.2.0 (`gcc-15-riscv64-linux-gnu_15.2.0-16`).

Step 2 - write a riscv64 CMake toolchain file:
```
SET(CMAKE_SYSTEM_NAME Linux)
SET(CMAKE_SYSTEM_PROCESSOR riscv64)
set(CMAKE_C_COMPILER /usr/bin/riscv64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER /usr/bin/riscv64-linux-gnu-g++)
set(CMAKE_FIND_ROOT_PATH_MODE_PROGRAM NEVER)
set(CMAKE_FIND_ROOT_PATH_MODE_LIBRARY ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_INCLUDE ONLY)
set(CMAKE_FIND_ROOT_PATH_MODE_PACKAGE ONLY)
```

Step 3 - build host-architecture `protoc` and `grpc_cpp_plugin` first (required; these cannot be cross-compiled and must run on the build host).

Step 4 - cross-compile gRPC with all providers set to `package` to use system libraries:
```
cmake -DCMAKE_TOOLCHAIN_FILE=/tmp/riscv64-toolchain.cmake \
      -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_CXX_STANDARD=17 \
      -DgRPC_SSL_PROVIDER=package \
      -DgRPC_ABSL_PROVIDER=package \
      -DgRPC_CARES_PROVIDER=package \
      -DgRPC_PROTOBUF_PROVIDER=package \
      -DgRPC_RE2_PROVIDER=package \
      -DgRPC_ZLIB_PROVIDER=package \
      -DgRPC_BUILD_TESTS=OFF \
      ../..
```

**Why `-DgRPC_SSL_PROVIDER=package` is required for riscv64:** The bundled BoringSSL has no riscv64 assembly optimizations and Debian actively excludes BoringSSL from their builds. All distro builds on riscv64 substitute system OpenSSL via this flag.

**Confirmed working Debian sid build** (built April 2026 on `rv-manda-02`, grpc 1.51.1-9) used the following environment variables for the Python layer:
```
GRPC_BUILD_WITH_BORING_SSL_ASM=0
GRPC_PYTHON_BUILD_WITH_CYTHON=1
GRPC_PYTHON_BUILD_SYSTEM_OPENSSL=1
GRPC_PYTHON_BUILD_SYSTEM_ZLIB=1
GRPC_PYTHON_BUILD_SYSTEM_CARES=1
GRPC_PYTHON_BUILD_SYSTEM_RE2=1
```

**QEMU.** The `dockcross/linux-riscv64` container provides both a riscv64 cross toolchain and `/usr/bin/qemu-riscv64` for test execution. Setting `CMAKE_CROSSCOMPILING_EMULATOR=/usr/bin/qemu-riscv64` in the toolchain file enables CMake to run cross-compiled test binaries via QEMU during `ctest`. gRPC upstream does not use this for any riscv64 CI.

**Known build failures:**
- `__atomic_compare_exchange_1` undefined symbol ([#35839](https://github.com/grpc/grpc/issues/35839)): occurs when building grpcio Python wheel without `-latomic` linkage on riscv64. The `check_linker_need_libatomic()` probe in `setup.py` did not trigger for 1-byte atomics on riscv64. Workaround: manually add `-latomic` or use the Debian-patched package.
- SIGILL on Linux 6.6+ ([#37791](https://github.com/grpc/grpc/issues/37791)): caused by stale abseil-cpp submodule containing the removed `RDCYCLE` implementation. Fixed by updating the submodule to post-[abseil-cpp #1644](https://github.com/abseil/abseil-cpp/pull/1644). Resolved in releases after v1.66.1.
- Cython poison build ([#36112](https://github.com/grpc/grpc/issues/36112)): hits any platform building from a raw git clone without Cython installed; more common on riscv64 because there are no pre-built wheels. Workaround: `pip install cython` before building, or build from the sdist tarball.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None identified. gRPC compiles and runs correctly on riscv64. All protocol-level functionality (HTTP/2, streaming, protobuf serialization, TLS) is available via C fallback paths.

**Performance gaps:**

| Area | amd64 vs riscv64 gap | Root cause |
|------|---------------------|------------|
| AES-GCM TLS throughput | Estimated ~10x slower [NEEDS VERIFICATION on exact ratio] | No AES-NI or Zvk equivalent; BoringSSL nohw C path |
| SHA-256/SHA-512 | Significant regression | No asm; BoringSSL C path only |
| RSA/ECDSA signing | Significant regression | No Montgomery multiplication asm |
| High-frequency timing/profiling | Loss of cycle precision | RDCYCLE removed; falls to clock_gettime syscall |
| Message hashing (xxhash) | Minor | Scalar vs AVX2/SSE2 |

Data not available: published benchmark figures comparing gRPC TLS throughput or request latency on riscv64 hardware vs arm64 or x86_64. No such numbers appear in any searched source.

**Security hardening gaps:**
- BoringSSL FIPS module does not support riscv64. Deployments requiring FIPS-validated cryptography cannot use the default gRPC TLS stack on riscv64.
- No hardware random number generator integration via Zvkn (RISC-V vector cryptography).

**Floating-point / NaN semantics:** gRPC does not perform floating-point computation in its core. No FP semantics issues were identified in the research.

---

## 7. CI/CD Infrastructure

**No riscv64 CI exists in the grpc/grpc repository.** This was confirmed by direct reading of all CI configuration files.

The repository contains exactly five GitHub Actions workflow files under `.github/workflows/`:
- `pr-auto-fix.yaml` - runner: `ubuntu-latest` (x86_64). No riscv references.
- `pr-auto-tag.yaml` - runner: `ubuntu-latest`. No riscv references.
- `pr-check-bzlmod-deps.yaml` - runner: `ubuntu-latest`. No riscv references.
- `publish-to-bcr.yaml` - labeling/publish job. No build runners. No riscv references.
- `update-artifacts-branch.yaml` - runner: `ubuntu-latest`. No riscv references.

`.bazelci/presubmit.yml` covers only `ubuntu2204` (x86_64). Zero riscv matches.

`tools/run_tests/run_tests_matrix.py` defines architectures as `["default", "x64", "x86", "arm64"]`. The string "riscv" appears zero times.

No `Jenkinsfile`, `.gitlab-ci.yml`, or `.cirrus.yml` exists in the repository.

**RISE runners:** No RISE-provided riscv64 CI runners are connected to the grpc/grpc upstream repository. The RISE project builds grpcio wheels externally via their own GitLab infrastructure; that is third-party CI entirely outside grpc/grpc.

| CI criterion | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Build CI (upstream) | Yes | Yes (internal Kokoro) | No |
| Test execution CI | Yes | Yes | No |
| Release-blocking gate | Yes | Yes | No |
| QEMU emulation | n/a | n/a | No |
| RISE external CI | No | No | Informal (wheel builds only) |

---

## 8. Distribution and Release Status

**GitHub Releases:** gRPC publishes zero binary assets in GitHub Releases for any architecture. The three most recent releases (v1.82.0-pre1, v1.81.1, v1.81.0) each have 0 attached assets. There is nothing to evaluate for riscv64 here.

**PyPI (grpcio):** grpcio 1.81.1 (June 11, 2026) ships 51 files covering: `manylinux2014_aarch64`, `linux_armv7l`, `manylinux2014_x86_64`, `manylinux2014_i686`, `musllinux_1_2_aarch64/i686/x86_64`, `macosx_universal2`, `win32`, `win_amd64`, plus one sdist. Zero riscv64 wheels. Open issue [#41591](https://github.com/grpc/grpc/issues/41591) requests this; P2 priority, assigned, no progress as of reporting date.

**RISE unofficial wheels:** The RISE project distributes riscv64 grpcio wheels via a GitLab package index. Available versions:

| Version | manylinux tag | Python versions |
|---------|--------------|-----------------|
| 1.72.0 | manylinux_2_35_riscv64 | cp310, cp311, cp312, cp313 |
| 1.75.1 | manylinux_2_39_riscv64 | cp311, cp312, cp313, cp314 |
| 1.76.0 | manylinux_2_39_riscv64 | cp311, cp312, cp313, cp314 |

Install command:
```
pip install grpcio --index-url https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple
```

These are unofficial, require an explicit non-default index URL, and are 5 minor versions behind the current upstream release (1.76.0 vs 1.81.1). Publisher: Rivos Inc. / Baylibre, SAS (RISE project).

**Ubuntu 24.04 LTS (noble):** riscv64 is included in the architecture set for all gRPC packages: `libgrpc29t64`, `libgrpc-dev`, `libgrpc++-dev`, `libgrpc++1.51t64`, `python3-grpcio`, `python3-grpc-tools`, `ruby-grpc`, `protobuf-compiler-grpc`. Version: 1.51.1. This package version is two major point releases behind upstream.

**Debian sid:** grpc 1.51.1-9 status: Installed on `rv-manda-02`, built April 2026. One open FTBFS bug ([#1138463](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1138463)) for OpenSSL 4.0 compatibility does not affect the current installed state.

**Arch Linux RISC-V:** Fully up-to-date with upstream as of 2026-06-22:

| Package | Version | Size |
|---------|---------|------|
| grpc | 1.81.0-1 | 6.2 MB |
| grpc-cli | 1.81.0-1 | 131 KB |
| python-grpcio | 1.81.0-1 | 3.8 MB |
| python-grpcio-tools | 1.81.0-1 | 153 KB |
| php-grpc | 1.81.0-1 | 30 KB |
| qt6-grpc | 6.11.1-3 | 748 KB |
| ruby-grpc | 1.80.0-1 | 8.4 MB |

**Summary:**

| Distribution | riscv64 available? | Version | Gap vs upstream |
|-------------|-------------------|---------|----------------|
| PyPI grpcio (official) | No | n/a | Full gap |
| GitHub Releases | No | n/a | No binaries for any arch |
| RISE GitLab wheels (unofficial) | Yes | 1.76.0 | 5 minor versions behind |
| Ubuntu 24.04 LTS | Yes | 1.51.1 | 2 major releases behind |
| Debian sid | Yes | 1.51.1-9 | 2 major releases behind |
| Arch Linux RISC-V | Yes | 1.81.0 | Current |

**What a user must do to get a working binary:** On Arch Linux RISC-V, install `grpc` from the standard package manager. On Debian/Ubuntu, install `libgrpc-dev` (note: version 1.51.1 only). For Python, use the RISE unofficial index. For any other use case or for current versions, build from source using the Debian-style cmake invocation documented in Section 5.

---

## 9. Dependencies

### 9.1 Summary table

| Dependency | Role in gRPC | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|-----------|-------------|--------------|--------------|-----------------|----------------|
| BoringSSL | TLS/crypto (default) | Builds; scalar C only | No CI | Source only | No riscv64 asm; no FIPS |
| OpenSSL | TLS/crypto (package alt) | Full | QEMU CI | Debian packages present | None blocking |
| abseil-cpp | Utilities, containers, hashing | Builds with caveats | No riscv64 CI; 2 SEGFAULT tests on Debian | Debian `libabsl-dev` present | [#1702](https://github.com/abseil/abseil-cpp/issues/1702) libatomic; [#2002](https://github.com/abseil/abseil-cpp/issues/2002) SEGFAULTs |
| Protocol Buffers | Wire serialization, protoc codegen | Builds | No riscv64 CI | Debian package; no upstream binary protoc | No prebuilt protoc binary |
| upb | C protobuf runtime (bundled) | Builds | Inherits protobuf CI | Bundled | None |
| c-ares | Async DNS | Builds | No riscv64-specific issues | Debian present | None |
| RE2 | Regex | Builds | No riscv64-specific issues | Debian present | None |
| zlib | HTTP/2 compression | Builds | No riscv64-specific issues | Standard distro package | No SIMD; zlib-ng would be preferred |
| xxhash | Fast hashing (header-only) | Header-only | n/a | Bundled header | None |
| utf8_range | UTF-8 validation (bundled) | Builds | None | Bundled | None |

### 9.2 BoringSSL (deep-dive)

BoringSSL is the critical dependency. Its absence of riscv64 assembly means TLS-secured gRPC calls run all crypto on the C scalar path. No FIPS validation exists for riscv64. The `OPENSSL_RISCV64` preprocessor macro is defined in `target.h` but is used only for detection, not for selecting any optimized code path. The performance delta for AES-GCM is estimated at approximately 10x vs arm64 [NEEDS VERIFICATION]; no published riscv64 vs arm64 BoringSSL benchmark was found in any source. See `project-reports/boringssl.md` for full details.

Mitigation available now: set `-DgRPC_SSL_PROVIDER=package` at build time to substitute OpenSSL, which has 13 riscv64 ISA extension configurations in CI and ships riscv64 packages in all active stable branches. OpenSSL does not yet have Zvk (RISC-V Vector Cryptography) support in the mainline builds tested, but its scalar C implementation is maintained at parity with x86_64.

### 9.3 abseil-cpp (deep-dive)

abseil-cpp has two open riscv64-specific issues as of reporting date:
- [#1702](https://github.com/abseil/abseil-cpp/issues/1702) (opened July 2024): `-latomic` linker failure on riscv64; not fixed upstream.
- [#2002](https://github.com/abseil/abseil-cpp/issues/2002) (opened February 2026): SEGFAULTs in `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` on Debian riscv64; no upstream response.

CRC32C hardware acceleration for riscv64 via Zvcrc extension (abseil-cpp [#1986](https://github.com/abseil/abseil-cpp/pull/1986)) is blocked on Google internal review. The gRPC bundled abseil-cpp submodule may lag behind these upstream issues depending on the submodule pin.

### 9.4 Protocol Buffers (deep-dive)

No upstream prebuilt `protoc` binary is available for riscv64. Two abandoned PRs ([#23206](https://github.com/protocolbuffers/protobuf/pull/23206), [#23205](https://github.com/protocolbuffers/protobuf/pull/23205)) attempted to add prebuilt riscv64 protoc binaries and were not merged. Users must build protoc from source on riscv64. Debian packages the `protobuf-compiler` for riscv64. Maven Central riscv64 prebuilts for Java (issue [#17798](https://github.com/protocolbuffers/protobuf/issues/17798)) were reportedly resolved as of 2024.

---

## 10. Ecosystem Status

gRPC has a significant Python wheel ecosystem via `grpcio` and related packages (`grpcio-tools`, `grpcio-status`, `grpcio-reflection`, `grpcio-health-checking`, `grpcio-channelz`). These are direct installation dependencies for any Python application using gRPC.

**Official PyPI coverage:** Zero riscv64 wheels on PyPI for any grpcio package. The official grpcio 1.81.1 release covers 7 platforms, none of which is riscv64. This is the single largest practical blocker for Python-based workloads on riscv64.

**RISE wheel builder coverage:** The [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) lists grpcio as one of approximately 76 packages it builds for riscv64. Available versions: 1.72.0, 1.75.1, 1.76.0. Known issue: `DynamicStubTest.test_sunny_day` is skipped in 1.75.1 and 1.76.0 because it hangs the test environment [NEEDS VERIFICATION on root cause]. The 1.72.0 wheel bundles libatomic (a GPL-compliance archive is provided separately by RISE).

**Version lag:** RISE wheels are at 1.76.0; PyPI official is at 1.81.1. The 5-version lag means users on the unofficial index do not receive recent bug fixes.

**Upstream blocker:** Issue [#41591](https://github.com/grpc/grpc/issues/41591) (open, P2, assigned to sergiitk) is the tracking item. The infrastructure blockers that previously prevented riscv64 wheel publication have been cleared: `cibuildwheel` v3.1.2, `manylinux`, and PyPI warehouse all added riscv64 support in summer 2025. The remaining blocker is solely grpc maintainer action. The issue notes that gRPC uses a non-standard wheel build architecture that does not straightforwardly use `cibuildwheel`, making community contributions difficult without maintainer guidance.

**Shared infrastructure:** The RISE wheel builder covers multiple Python packages beyond grpcio, sharing riscv64 runners and CI infrastructure across the portfolio. Unblocking official grpcio wheels would reduce the RISE maintenance burden for the 76-package unofficial index.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#41591](https://github.com/grpc/grpc/issues/41591) | Building and publishing riscv64 wheels? | Open | P2 / Enhancement | No official riscv64 wheel on PyPI; RISE workaround available. Assigned, no PR yet. |
| [#37791](https://github.com/grpc/grpc/issues/37791) | grpc hits SIGILL on riscv64 | Closed | P2 / Correctness (resolved) | SIGILL from stale abseil-cpp submodule lacking RDCYCLE removal. Fixed by submodule update. Affected grpc <= 1.66.1 on Linux 6.6+. |
| [#35839](https://github.com/grpc/grpc/issues/35839) | undefined symbol: `__atomic_compare_exchange_1` on riscv64 | Closed | P2 / Correctness (unresolved upstream) | Missing `-latomic` linkage in grpcio Python build. Closed "requires reporter action"; no upstream fix in setup.py. |
| [#36112](https://github.com/grpc/grpc/issues/36112) | grpcio Python build fails on RISC-V | Closed | P2 / Build (not riscv64-specific) | Cython not installed; hits riscv64 more often due to lack of pre-built wheels. Closed "requires reporter action." |

**Correctness bugs:** Issue #37791 (SIGILL) was a correctness regression affecting grpc <= 1.66.1 on kernels >= 6.6 on riscv64. It is resolved in current releases. Issue #35839 (undefined symbol for `__atomic_compare_exchange_1`) is a build-time linkage failure, not a runtime correctness bug; it is not fixed upstream but distro builds patch around it.

**Dependency-level open bugs affecting riscv64:**
- abseil-cpp [#1702](https://github.com/abseil/abseil-cpp/issues/1702): `-latomic` linker failure, open since July 2024.
- abseil-cpp [#2002](https://github.com/abseil/abseil-cpp/issues/2002): SEGFAULTs in hashtable and cord tests on Debian riscv64, open since February 2026, no response.

---

## 12. Objections and Upstream Blockers

**Stated organizational blockers:**
- gRPC's wheel build pipeline is non-standard. Unlike most Python packages, grpcio does not use `cibuildwheel` in the typical pattern. The issue author ([#41591](https://github.com/grpc/grpc/issues/41591)) explicitly requested maintainer guidance before attempting a PR, indicating that the build system complexity is a real barrier to community contribution.
- 6 of 7 steering committee seats and 33 of 34 C-core maintainers are Google employees. New platform support requires Google internal buy-in or a maintainer willing to own the riscv64 CI burden.

**Technical blockers:**
- BoringSSL has no riscv64 assembly optimizations. This is a BoringSSL-level problem that gRPC inherits; fixing it requires upstream work in the [google/boringssl](https://github.com/google/boringssl) repository, not in grpc/grpc. Using OpenSSL as the SSL provider (`-DgRPC_SSL_PROVIDER=package`) is the available mitigation.
- abseil-cpp has open correctness issues ([#2002](https://github.com/abseil/abseil-cpp/issues/2002)) and the `-latomic` linker issue ([#1702](https://github.com/abseil/abseil-cpp/issues/1702)) on riscv64 that are unresolved upstream. These sit in a dependency that gRPC bundles and must update in its submodule.
- No upstream riscv64 prebuilt `protoc` binary forces source builds for code generation workflows.

**Acceptance probability for riscv64 wheel publishing:** Moderate. The infrastructure blockers (cibuildwheel, manylinux, PyPI warehouse) are cleared. The issue is assigned to a Google maintainer (sergiitk). P2 priority suggests it is acknowledged but not urgent. The non-standard build system is a genuine complexity barrier. A focused external engineering contribution with maintainer guidance has a reasonable chance of success.

**Acceptance probability for riscv64 CI:** Low in the near term. Adding CI requires Google to provision riscv64 build infrastructure (either hardware or cross-compile QEMU nodes in their Kokoro system) or to accept RISE-hosted runners, neither of which has been proposed upstream.

---

## 13. Investment Analysis

The RISE project's current contribution is the unofficial grpcio wheel builder for riscv64 (versions 1.72.0-1.76.0), covering Python 3.10-3.14 on manylinux_2_35/2_39. This work should not be sized again. The remaining gaps are:

### 13.1 Functional Enablement

The port is functionally complete as a scalar C implementation. No functional gaps were identified. The primary functional gap is the absence of official distribution channels (PyPI wheels), which is a packaging problem, not a code problem.

### 13.2 Performance Optimization

The primary performance gap is BoringSSL's lack of riscv64 crypto assembly. Addressing this requires:
1. RVV-accelerated AES-GCM (or Zvkn if hardware supports it)
2. RVV-accelerated SHA-256 / SHA-512
3. Montgomery multiplication for RSA/ECDSA

This work belongs in [google/boringssl](https://github.com/google/boringssl), not in grpc/grpc. It is a substantial cryptographic engineering effort requiring RISC-V ISA expertise. Until this is done, the mitigation is using OpenSSL via `-DgRPC_SSL_PROVIDER=package`, which has broader ISA coverage.

An additional performance item is CRC32C hardware acceleration in abseil-cpp via Zvcrc (blocked on Google internal review per [abseil-cpp #1986](https://github.com/abseil/abseil-cpp/pull/1986)). This affects gRPC's use of abseil's CRC functionality.

### 13.3 CI/CD Infrastructure

Zero riscv64 CI exists upstream. A minimal CI addition would be: cross-compile build check using dockcross/linux-riscv64 in a GitHub Actions matrix job. A full CI addition would add QEMU-emulated test execution. Neither has been proposed upstream.

### 13.4 Ecosystem Enablement

The single highest-leverage item is landing official riscv64 grpcio wheels on PyPI via [#41591](https://github.com/grpc/grpc/issues/41591). The infrastructure is ready. The blocker is maintainer time to adapt gRPC's non-standard wheel build pipeline. This unblocks all Python workloads from depending on the RISE unofficial index.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Ecosystem | Add riscv64 wheels to official grpcio PyPI release pipeline (unblock [#41591](https://github.com/grpc/grpc/issues/41591)) | 4-6 | gRPC maintainer (sergiitk) + RISE contributor | Critical |
| Functional | Fix `-latomic` linkage in grpcio Python build for riscv64 (close root cause of [#35839](https://github.com/grpc/grpc/issues/35839)) | 1 | gRPC Python team | High |
| CI/CD | Add riscv64 cross-compile build check to GitHub Actions matrix | 2 | gRPC maintainer + RISE | High |
| CI/CD | Add QEMU-emulated riscv64 test execution to CI | 4 | gRPC maintainer + RISE | Medium |
| Performance | BoringSSL riscv64 AES-GCM / SHA / BigNum assembly (Zvkn / RVV) | 20-30 | BoringSSL team (Google) + RISC-V ISA expert | Medium |
| Performance | abseil-cpp CRC32C Zvcrc acceleration (unblock [abseil-cpp #1986](https://github.com/abseil/abseil-cpp/pull/1986)) | 2 | Google abseil team | Low |
| Functional | Investigate and resolve abseil-cpp SEGFAULTs on Debian riscv64 ([#2002](https://github.com/abseil/abseil-cpp/issues/2002)) | 3 | abseil-cpp maintainer | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [gRPC project homepage](https://grpc.io/)
- [grpc/grpc GitHub repository](https://github.com/grpc/grpc)
- [CNCF gRPC project page](https://www.cncf.io/projects/grpc/)
- [grpc/grpc #41591 -- Building and publishing riscv64 wheels?](https://github.com/grpc/grpc/issues/41591)
- [grpc/grpc #37791 -- grpc hits SIGILL on riscv64](https://github.com/grpc/grpc/issues/37791)
- [grpc/grpc #36112 -- grpcio build fails on RISC-V (missing Cython)](https://github.com/grpc/grpc/issues/36112)
- [grpc/grpc #35839 -- undefined symbol: __atomic_compare_exchange_1 on riscv64](https://github.com/grpc/grpc/issues/35839)
- [grpc/grpc #28272 -- Prefer -pthread flag on UNIX (merged 2021-12-06)](https://github.com/grpc/grpc/pull/28272)
- [abseil/abseil-cpp #1644 -- unscaledcycleclock: remove RISC-V support](https://github.com/abseil/abseil-cpp/pull/1644)
- [abseil/abseil-cpp #1702 -- -latomic linker failure on riscv64 (open)](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil/abseil-cpp #2002 -- SEGFAULTs on Debian riscv64 (open)](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil/abseil-cpp #1986 -- CRC32C Zvcrc acceleration (blocked)](https://github.com/abseil/abseil-cpp/pull/1986)
- [RISE wheel builder -- grpcio package page](https://riseproject.gitlab.io/python/wheel_builder/packages/grpcio.html)
- [RISE unofficial grpcio riscv64 wheel index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/grpcio/)
- [PyPI grpcio 1.81.1](https://pypi.org/pypi/grpcio/json)
- [Debian buildd grpc riscv64 status](https://buildd.debian.org/status/package.php?p=grpc&suite=sid)
- [Ubuntu 24.04 grpc packages search](https://packages.ubuntu.com/search?keywords=grpc&suite=noble)
- [Arch Linux RISC-V grpc 1.81.0 package](https://riscv.mirror.pkgbuild.com/extra/)
- [grpc/grpc port_platform.h](https://raw.githubusercontent.com/grpc/grpc/master/include/grpc/support/port_platform.h)
- [grpc/grpc aarch64 cross-compile script](https://raw.githubusercontent.com/grpc/grpc/master/test/distrib/cpp/run_distrib_test_cmake_aarch64_cross.sh)
- [Debian grpc debian/rules build configuration](https://salsa.debian.org/debian/grpc/-/raw/master/debian/rules)
- [dockcross/linux-riscv64 Dockerfile](https://raw.githubusercontent.com/dockcross/dockcross/master/linux-riscv64/Dockerfile.in)
- [dockcross/linux-riscv64 Toolchain.cmake](https://raw.githubusercontent.com/dockcross/dockcross/master/linux-riscv64/Toolchain.cmake)
- [BoringSSL target.h (OPENSSL_RISCV64 definition)](https://raw.githubusercontent.com/google/boringssl/master/include/openssl/target.h)
- [scientific-python summit 2025 discussion referenced in #41591](https://github.com/scientific-python/summit-2025-nov/issues/4)