---
title: gRPC
parent: Project Reports
color: orange
dependencies:
  - name: BoringSSL
    relation: runtime-dependency
    criticality: critical
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: Abseil
    relation: runtime-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: critical
  - name: c-ares
    relation: runtime-dependency
    criticality: optional
  - name: re2
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: xxHash
    relation: runtime-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Bazel
    relation: build-dependency
    criticality: critical
  - name: Cython
    relation: build-dependency
    criticality: critical
  - name: googletest
    relation: test-dependency
    criticality: critical
  - name: GCC
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="grpc" %}

# gRPC

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange (downstream-only)<br/>
**Scope:** RISC-V (riscv64/linux) support status for gRPC<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

gRPC is a high-performance, open-source, language-agnostic remote procedure call framework. It uses HTTP/2 as transport, Protocol Buffers as the default serialization format, and supports bidirectional streaming. It is used pervasively as the inter-service communication layer in distributed systems across cloud, datacenter, and mobile deployments.

**Governance.** gRPC is a [CNCF Incubating](https://www.cncf.io/projects/grpc/) project, accepted 2017-02-16. It has never graduated to CNCF Graduated tier. It operates under the Linux Foundation / CNCF charter and code of conduct. All changes follow a three-step process defined in `grpc/grpc-community` governance.md: (1) anyone opens a PR, (2) anyone discusses it, (3) Maintainers approve or reject; disputes escalate to a formal Maintainer vote (simple majority, minimum two-week open voting period). Substantial changes additionally require a gRFC (gRPC Request For Comments) filed in [grpc/proposal](https://github.com/grpc/proposal).

Policy and vision authority rests with a Steering Committee that holds seats by individual, not employer. Six of seven seats are Google-affiliated; the remaining seat is held by Datadog. The committee liaises with CNCF on brand/governance matters.

**Corporate maintainers.** Of 37 active maintainers listed in `grpc/grpc` MAINTAINERS.md, the overwhelming majority are Google LLC employees; the one clear non-Google active maintainer is pfreixes (Skyscanner Ltd). Of 52 emeritus maintainers, nearly all are ex-Google, with notable non-Google exceptions: jpalmerLinuxFoundation (Linux Foundation), mehrdada (Dropbox), sreecha (LinkedIn). Net picture: gRPC governance and maintainership is heavily Google-dominated despite nominal CNCF neutrality, with Datadog as the only other company holding a Steering Committee seat.

**Community culture on new ports.** No written policy addresses how gRPC evaluates or welcomes new CPU-architecture ports (no `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/`; grpc.io's own `/docs/platforms/` page documents only Android and Web). The record on RISC-V bug reports is unfavorable: [#35839](https://github.com/grpc/grpc/issues/35839) (libatomic undefined symbol) was closed "requires reporter action" with maintainer gnossen stating "We don't officially support RISC-V" but that a contributed patch would be accepted; [#36112](https://github.com/grpc/grpc/issues/36112) (Cython build failure) was closed with the same disposition and received zero maintainer comments in the thread; the wheel-publishing request [#41591](https://github.com/grpc/grpc/issues/41591) was closed by maintainer sergiitk citing internal Google policy rather than a technical objection (see Section 2). The pattern is reactive and policy-gated, not proactive.

**Repository statistics.** Repo created 2014-12-08. License: Apache-2.0. Homepage: [grpc.io](https://grpc.io/).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2021-12-06 | PR [#28272](https://github.com/grpc/grpc/pull/28272) merged: CMake build prefers `-pthread` over `-lpthread` (rationale: on riscv64, GCC 11.1.0 requires `-latomic` for pthread, and `-pthread` auto-pulls it while `-lpthread` does not). Verified by direct git-ancestry check: merge commit `bf2ab4aa` is an ancestor of tag **v1.44.0** (released 2022-02-15) and is absent from `v1.43.0`'s history. | [grpc/grpc #28272](https://github.com/grpc/grpc/pull/28272) |
| 2024-02-07 | Issue [#35839](https://github.com/grpc/grpc/issues/35839) opened: `__atomic_compare_exchange_1` undefined symbol on riscv64 Ubuntu 22.04 importing `grpc_tools._protoc_compiler`. Closed 2024-02-15 after the reporter found that upgrading to grpcio 1.60.1 sidestepped the issue; no `-latomic` fix landed in `setup.py`. | [grpc/grpc #35839](https://github.com/grpc/grpc/issues/35839) |
| 2024-03-13 | Issue [#36112](https://github.com/grpc/grpc/issues/36112) opened: grpcio wheel build fails on openSUSE Tumbleweed riscv64 (T-HEAD Lichee Pi 4A) with "Extensions have been poisoned due to missing Cython-generated code." Closed with zero maintainer/reporter comments in-thread; root cause never diagnosed. | [grpc/grpc #36112](https://github.com/grpc/grpc/issues/36112) |
| 2024-03-22 | [abseil/abseil-cpp #1644](https://github.com/abseil/abseil-cpp/pull/1644) merged: removes RISC-V `unscaledcycleclock` implementation that read `RDCYCLE` from userland, since Linux kernel 6.6 made `RDCYCLE` privileged on RISC-V. riscv64 falls back to `clock_gettime()`. | [abseil-cpp #1644](https://github.com/abseil/abseil-cpp/pull/1644) |
| 2024-09-24 | Issue [#37791](https://github.com/grpc/grpc/issues/37791) opened: non-deterministic SIGILL on riscv64, grpc v1.66.1, GCC 14.1, Linux 6.6+. Root cause: gRPC's bundled abseil-cpp submodule was stale and still contained the RDCYCLE read removed upstream five months earlier. Maintainer yashykt confirmed the fix on 2024-10-01 by bumping the submodule via grpc/grpc PR #37543; closed the same day. | [grpc/grpc #37791](https://github.com/grpc/grpc/issues/37791) |
| 2026-02-10 | Issue [#41591](https://github.com/grpc/grpc/issues/41591) opened by justeph: request to officially build/publish riscv64 Python manylinux/musllinux wheels on PyPI, noting cibuildwheel/manylinux/PyPI warehouse riscv64 support landed mid-2025 and that RISE had already built and tested working riscv64 grpcio wheels (1.72.0-1.76.0) for over a year. RISE offered engineering resources to debug riscv64-specific issues and submit a PR. | [grpc/grpc #41591](https://github.com/grpc/grpc/issues/41591) |
| 2026-07-15 | Issue #41591 closed by maintainer sergiitk: "We follow Google OSS Support Policy which does not cover riscv64 at the moment. I can bring it up with the committee; however, I am going to close this issue for now." No linked PR. RISE's offered engineering help was not taken up. | [grpc/grpc #41591](https://github.com/grpc/grpc/issues/41591) |

**Zero riscv-named commits** exist in the grpc/grpc default-branch commit history (GitHub commit search returns 0 results for "riscv" in repo:grpc/grpc); riscv-related fixes that do exist (the abseil submodule bump) flow through a dependency update, not a riscv-labeled commit.

**Is the port fully upstream?** No. The only riscv64-motivated code change ever merged into grpc/grpc itself is PR #28272 (a generic CMake flag-preference fix applied to all UNIX targets, first shipped in v1.44.0), plus the reactive abseil-cpp submodule bump that resolved #37791. There is no dedicated riscv64 enablement effort, no gRPC-authored riscv64 architecture code, and no riscv64 CI. The port works purely as a portable-C fallback. Distros (Ubuntu, Debian, and previously Arch Linux) build gRPC for riscv64 using system dependencies without upstream involvement, and the official wheel-publishing request was declined as a policy matter, not resolved.

## 3. Upstream Support Tier

**No formal tier policy exists.** The grpc/grpc repository has no `PLATFORMS.md`, `SUPPORT.md`, or architecture-tier document at any expected path (all checked paths 404). grpc.io's `/docs/platforms/` page documents only Android and Web (with Flutter/iOS "coming soon"); there is no CPU-architecture policy comparable to, for example, Rust's platform tiers.

**Evidence-based tier assessment:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI: build gating | Yes | Yes (internal Kokoro/RBE) | No |
| CI: test execution | Yes | Yes | No |
| Official GitHub release binary | No (source only, for any arch) | No | No |
| Official PyPI wheel | Yes | Yes | No (request declined, [#41591](https://github.com/grpc/grpc/issues/41591)) |
| Arch-specific code in gRPC's own tree | No (portable C++; asm lives in vendored BoringSSL) | No | No |
| Distro packages | Yes | Yes | Yes (Ubuntu, Debian; via distro effort only) |
| Release blocking | Yes | Yes | No |

**Conclusion.** riscv64 is an untiered, community/distro-carry platform. Ubuntu and Debian build it successfully from source, but upstream takes no CI or release responsibility for it, and an explicit request to add it to upstream's official distribution channel was declined citing internal Google policy rather than a technical blocker.

## 4. Technical Architecture and RISC-V-Specific Subsystems

gRPC has no JIT compiler and no hand-written amd64/arm64 assembly of its own; its C-core is portable C++. The performance-sensitive architecture-specific subsystems that matter for riscv64 all live in **vendored dependencies**: cryptographic primitives in bundled BoringSSL, timing/profiling in bundled abseil-cpp, and hash acceleration in bundled xxHash.

### 4.1 BoringSSL (TLS/crypto)

BoringSSL is the default SSL provider (`gRPC_SSL_PROVIDER=module`). It contains substantial ISA-specific assembly for x86_64 and aarch64; for riscv64 every path falls to the `nohw` (no-hardware) C scalar implementation.

| Crypto primitive | amd64 | aarch64 | riscv64 |
|-----------------|-------|---------|---------|
| AES/GCM | Full asm (AES-NI, VPAES, GHASH, AVX2, AVX512) | Full asm (AESv8, BSAES, GHASH-NEON, VPAES-ARMv8) | Scalar C (nohw) |
| SHA-1/256/512 | Full asm | Full asm | Scalar C |
| BigNum/Montgomery mult | Full asm (RSAZ-AVX2) | Full asm (armv8-mont) | Scalar C |
| CPU feature detection | `cpu_intel.cc` | `cpu_aarch64_linux.cc` + related | None |

BoringSSL has no `cpu_riscv_linux.cc` and no Zvkn/Zvksh/RVV dispatch files. The `OPENSSL_RISCV64` preprocessor macro is defined in `target.h` (`#elif defined(__riscv) && __SIZEOF_POINTER__ == 8`) but is unused beyond detection; no associated assembly exists. BoringSSL's FIPS module does not support riscv64. See `project-reports/boringssl.md`.

### 4.2 abseil-cpp (timing/profiling, hashing, atomics)

`unscaledcycleclock_config.h` enables the hardware cycle counter for i386, x86_64, aarch64, powerpc/ppc, and MSVC x86/x64. RISC-V support was removed in [abseil-cpp #1644](https://github.com/abseil/abseil-cpp/pull/1644) (March 2024) because Linux 6.6+ made `RDCYCLE` privileged; riscv64 falls back to `clock_gettime(CLOCK_MONOTONIC)`. This is the direct root cause of gRPC's own riscv64 SIGILL bug ([#37791](https://github.com/grpc/grpc/issues/37791)): gRPC's bundled submodule was stale relative to this upstream removal. Abseil's CRC32C hardware path for riscv64 (Zbc/Zbkc) is proposed in [abseil-cpp #1986](https://github.com/abseil/abseil-cpp/pull/1986) and remains unmerged.

### 4.3 xxHash (fast hashing)

xxHash is bundled via `cmake/xxhash.cmake` and linked into roughly 20+ gRPC build targets. Its auto-detection order is AVX512 -> AVX2 -> SSE2 -> NEON -> VSX -> scalar; riscv64 uses `XXH_SCALAR`. An RVV 1.0 implementation was merged upstream on xxHash's dev branch (PRs #1043/#1049/#1066/#1069/#1070, completed September 2025, with full RVV CI under QEMU at vlen=128/256/512), but it is **not yet in a tagged release**: the latest tag, v0.8.3 (2024-12-30), predates all RVV merges. gRPC therefore currently builds xxHash from source without RVV acceleration unless the vendored copy is pinned past the merge commits. See `project-reports/xxhash.md`.

### 4.4 gRPC core (iomgr, event engine, per-CPU)

`include/grpc/support/port_platform.h` defines no ISA-level macros and no cycle counter for any architecture (all platforms use `GPR_CYCLE_COUNTER_FALLBACK 1`); cache line size defaults to 64 bytes for all unrecognized architectures. `per_cpu.cc` uses `sched_getcpu()` (POSIX-portable). gRPC core has OS-level splits (POSIX/Windows/Android) but zero CPU-ISA splits of its own for any architecture, including riscv64. One incidental artifact was found in the vendored RBE toolchain container: `third_party/toolchains/rbe_ubuntu2004_bazel7/cc/module.modulemap` (an auto-generated Clang 19 module map) lists `riscv_vector.h`/`riscv_crypto.h` among every bundled intrinsic header shipped with the toolchain image, alongside `s390intrin.h` and others - this is a toolchain-container artifact, not gRPC code using those intrinsics.

### 4.5 Summary table

| Component | amd64 | aarch64 | riscv64 |
|-----------|-------|---------|---------|
| BoringSSL AES/GCM, SHA, BigNum/RSA | Full asm | Full asm | Scalar C |
| BoringSSL FIPS | Yes | Yes | Not supported |
| abseil cycleclock | Full (RDTSC) | Full (cntvct_el0) | Removed (clock_gettime fallback) |
| abseil CRC32C hardware | n/a | n/a | Proposed, unmerged (Zbc/Zbkc) |
| xxHash | Full (AVX512/AVX2/SSE2) | Partial (NEON) | Scalar (RVV merged upstream dev branch, not yet released) |
| gRPC core | Scalar (no ISA splits) | Scalar | Scalar |

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems supported:** CMake (minimum 3.16) and Bazel. C++17 is mandatory from gRPC C++ 1.70 onward.

**No riscv64-specific toolchain file, Dockerfile, or CI config exists anywhere in the repository.** A direct shallow clone was inspected (HEAD `a84410d1f212a396c0b042f8d89e9fa792bbb9cf`): `CMakeLists.txt` has zero "riscv" matches; `cmake/` contains only generic and per-dependency files (`abseil-cpp.cmake`, `ssl.cmake`, `protobuf.cmake`, `xxhash.cmake`, `zlib.cmake`, etc.), none arch-specific; no `Dockerfile.riscv64` exists among the roughly 90 Dockerfiles under `tools/dockerfile/`, `templates/tools/dockerfile/`, `src/php/docker/`, and `examples/*/` (only x64/x86, aarch64/arm64, and one armv7 variant exist). QEMU is used only for aarch64/arm64 cross-testing (`tools/internal_ci/helper_scripts/prepare_qemu_rc`, `tools/dockerfile/test/bazel_arm64/`); no riscv64 QEMU setup exists. The closest upstream cross-compile documentation uses aarch64 as its worked example (`test/distrib/cpp/run_distrib_test_cmake_aarch64_cross.sh`); there is no `run_distrib_test_cmake_riscv64_cross.sh`.

**Cross-compilation procedure for riscv64** (derived from the upstream aarch64 script with riscv64 substitutions, confirmed against Debian's build approach):

Step 1 - install cross toolchain on x86_64 host:
```
apt-get install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu
```

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

**Why `-DgRPC_SSL_PROVIDER=package` is required for riscv64:** bundled BoringSSL has zero riscv64 assembly optimization. Distro builds substitute system OpenSSL/zlib/c-ares/re2 for the bundled copies, and Python builds additionally set `GRPC_BUILD_WITH_BORING_SSL_ASM=0` alongside `GRPC_PYTHON_BUILD_SYSTEM_OPENSSL=1`, `GRPC_PYTHON_BUILD_SYSTEM_ZLIB=1`, `GRPC_PYTHON_BUILD_SYSTEM_CARES=1`, `GRPC_PYTHON_BUILD_SYSTEM_RE2=1`. This riscv64-specific build adaptation, needed because the bundled BoringSSL has no riscv64 asm, is a key reason the project is capped below a clean-distro-build grade (see Section 13).

**Known build failures:**
- `__atomic_compare_exchange_1` undefined symbol ([#35839](https://github.com/grpc/grpc/issues/35839)): occurs building the grpcio Python wheel without `-latomic` linkage on riscv64. Closed "requires reporter action" after the reporter upgraded grpcio versions; no code fix landed, and the upstream `-latomic` linkage bug was not resolved in the build system.
- SIGILL on Linux 6.6+ ([#37791](https://github.com/grpc/grpc/issues/37791)): caused by a stale abseil-cpp submodule; fixed by bumping the submodule (grpc/grpc PR #37543), resolved for releases after v1.66.1.
- Cython poison build ([#36112](https://github.com/grpc/grpc/issues/36112)): hits `GRPC_PYTHON_BUILD_WITH_CYTHON`-enabled builds without Cython installed; more visible on riscv64 for lack of pre-built wheels; closed without diagnosis.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None identified. gRPC compiles and runs correctly on riscv64. All protocol-level functionality (HTTP/2, streaming, protobuf serialization, TLS) is available via C fallback paths.

**Performance gaps:**

| Area | amd64/arm64 vs riscv64 gap | Root cause |
|------|---------------------|------------|
| AES-GCM TLS throughput | Substantial regression [NEEDS VERIFICATION on exact ratio] | No AES-NI/Zvkn equivalent; BoringSSL nohw C path |
| SHA-256/SHA-512 | Substantial regression | No asm; BoringSSL C path only |
| RSA/ECDSA signing | Substantial regression | No Montgomery multiplication asm |
| High-frequency timing/profiling | Loss of cycle precision | RDCYCLE removed from abseil; falls to clock_gettime syscall |
| Message hashing (xxHash) | Currently scalar; RVV merged upstream but unreleased | No tagged xxHash release with RVV yet |

Data not available: published benchmark figures (throughput, latency, req/s) comparing gRPC on riscv64 vs arm64 or x86_64. Searches of grpc.io's benchmark dashboard, `LesnyRumcajs/grpc_bench`, and general web search for "gRPC riscv64 benchmark" / "gRPC riscv performance" returned no numeric results. This is assessed as a genuine unfilled gap, not an unpublished/hard-to-find dataset.

**Security hardening gaps:**
- BoringSSL's FIPS module does not support riscv64; deployments requiring FIPS-validated cryptography cannot use gRPC's default TLS stack on riscv64.
- No hardware random number generator or vector-crypto (Zvkn) integration for riscv64 in either BoringSSL or gRPC.

**Floating-point/NaN semantics:** gRPC performs no floating-point computation in its own core. No FP semantics issues were identified.

## 7. CI/CD Infrastructure

**No riscv64 CI exists in the grpc/grpc repository.** Confirmed by direct file inspection of a fresh clone (`git clone --depth 1`, HEAD `a84410d1f212a396c0b042f8d89e9fa792bbb9cf`), in addition to GitHub code search. The complete, exhaustive contents of `.github/workflows/` are seven files:

```
issue-triage.yaml
pr-auto-fix.yaml
pr-auto-tag.yaml
pr-check-bzlmod-deps.yaml
publish-to-bcr.yaml
push_php_mirror.yml
update-artifacts-branch.yaml
```

`grep -ril "riscv" .github/` across the whole tree returns zero matches. None of these seven workflows build, test, or reference any architecture matrix; they are administrative (issue triage, PR auto-tagging/auto-fix, Bazel Central Registry publishing, PHP mirror sync, artifacts-branch update), not build/test CI.

`.bazelci/presubmit.yml` (687 bytes) covers only `ubuntu2204` (x86_64); zero riscv matches. `tools/internal_ci/` (Kokoro trigger scripts) has zero riscv matches. `tools/run_tests/run_tests_matrix.py` defines architectures as exactly `["default", "x64", "x86", "arm64"]` - the string "riscv" appears zero times. No `Jenkinsfile`, `.gitlab-ci.yml`, or `.cirrus.yml` exists anywhere in the repository, meaning gRPC's entire CI surface is GitHub Actions plus internal Kokoro/RBE, none of which reference riscv.

The only four "riscv" string matches in the whole repository (`grpc.gemspec`, `package.xml`, `src/abseil-cpp/preprocessed_builds.yaml`, and the RBE toolchain modulemap) are incidental filename/header listings for the vendored abseil-cpp stack-unwinder file `stacktrace_riscv-inl.inc` and bundled Clang intrinsic headers - not CI or build targets.

**RISE runners:** No RISE-provided riscv64 CI runner is connected to the grpc/grpc upstream repository. RISE builds grpcio wheels entirely through its own external infrastructure (`riseproject-dev/python-wheels`), and separately cites gRPC as one of the heaviest riscv64 feedstocks its own CI runner infrastructure has to build (needing 10-20 GiB of swap, per `riseproject-dev/riscv-runner` [issue #114](https://github.com/riseproject-dev/riscv-runner/issues/114), in a conda-forge feedstock context) - this is RISE's own tooling consuming gRPC as a Go dependency and building it as a heavy workload, not riscv64 CI added to grpc/grpc itself.

| CI criterion | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Build CI (upstream) | Yes | Yes (internal Kokoro/RBE) | No |
| Test execution CI | Yes | Yes | No |
| Release-blocking gate | Yes | Yes | No |
| QEMU emulation | n/a | n/a | No |
| RISE external CI | No | No | Informal (wheel builds only, outside grpc/grpc) |

## 8. Distribution and Release Status

**GitHub Releases:** gRPC publishes source-only archives for every release; no binary assets exist for any architecture. Recent tags: v1.84.0, v1.84.0-pre2, v1.84.0-pre1, v1.83.1, v1.82.2, v1.83.0, v1.83.0-pre1, v1.82.1, v1.82.0, v1.82.0-pre2. The v1.84.0 release assets are exactly `v1.84.0.zip` and `v1.84.0.tar.gz` (generic GitHub-generated source archives). There is nothing architecture-specific to evaluate here for any platform.

**PyPI:** The real upstream Python package is `grpcio` (the PyPI project literally named `grpc` is a deprecated placeholder pointing users to `grpcio`). The full PyPI JSON API for `grpcio` was parsed directly (9 MB, 10,641 file entries across every historical release, latest = 1.84.0 with 61 files for that version alone): **zero filenames anywhere contain "riscv."** This is a hard, file-level confirmed negative, not an inference from a search page.

**RISE unofficial wheels:** RISE builds and hosts riscv64 `grpcio` wheels externally, confirmed both on the [RISE wheel_builder page](https://riseproject.gitlab.io/python/wheel_builder/) (grpcio listed among roughly 70 packages) and via automated PRs in `riseproject-dev/python-wheels` (e.g. [PR #1974](https://github.com/riseproject-dev/python-wheels/pull/1974) "grpcio: Add version 1.84.0"; [PR #2422](https://github.com/riseproject-dev/python-wheels/pull/2422) "grpcio-observability: Add version 1.83.1"). Versions available through the index:

| Version | manylinux tag | Python versions |
|---------|--------------|-----------------|
| 1.72.0 | manylinux_2_35_riscv64 | cp310, cp311, cp312, cp313 |
| 1.75.1 | manylinux_2_39_riscv64 | cp311, cp312, cp313, cp314 |
| 1.76.0 | manylinux_2_39_riscv64 | cp311, cp312, cp313, cp314 |

Install command: `pip install grpcio --index-url https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple`. Note: this GitLab index is custom-built for `grpcio` specifically; querying it for the differently-named PyPI project `grpc` returns an HTTP 302 redirect straight to upstream PyPI (i.e., RISE has no custom `grpc`-named wheel, consistent with `grpc` being a deprecated, unrelated placeholder project). These wheels are unofficial, require a non-default index URL, and are five minor versions behind current upstream (1.76.0 vs 1.84.0).

**Ubuntu 26.04 LTS (resolute):** Confirmed via `packages.ubuntu.com` and independently verified down to the actual binary. `libgrpc-dev`, `libgrpc29t64`, `libgrpc++-dev`, `libgrpc++1.51t64`, `libgrpc-java`, `python3-grpcio`, `protobuf-compiler-grpc`, `ruby-grpc` all list riscv64 in their architecture set at version 1.51.1-8ubuntu1, source package `grpc`. The package detail page for `libgrpc29t64` shows a live download table entry for riscv64 (3,111.7 kB package / 10,811.0 kB installed). Going one layer deeper, `http://ports.ubuntu.com/pool/universe/g/grpc/` lists real `.deb` files for riscv64 across six separate build revisions (`1.30.2-3build6` through `1.51.1-9ubuntu3`); a direct `curl -sI` on `libgrpc29t64_1.51.1-8ubuntu1_riscv64.deb` returned `HTTP/1.1 200 OK` with `last-modified: Tue, 14 Apr 2026` - a real, currently downloadable riscv64 binary, not a ghost listing.

**Debian:** Debian trixie (suite=trixie) packages the same source package with riscv64 alongside all other release architectures at version 1.51.1-6. Debian sid's buildd shows an active riscv64 buildd (`rv-osuosl-01`) with a build in progress for 1.51.1-10, indicating riscv64 is a maintained, actively-built architecture for this package rather than a one-off. A prior session's report also recorded a confirmed working Debian sid build on host `rv-manda-02` (grpc 1.51.1-9, built April 2026), using `GRPC_BUILD_WITH_BORING_SSL_ASM=0` and system-library flags as listed in Section 5; one open Debian FTBFS bug ([#1138463](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1138463)) for OpenSSL 4.0 compatibility does not affect the currently installed state.

**Arch Linux RISC-V: contradictory evidence.** An earlier pass of this research (reflected in a prior report version) recorded Arch Linux RISC-V packaging gRPC and several related tools at version 1.81.0-1, current with upstream as of 2026-06-22. A subsequent adversarial verification pass, querying `archriscv.felixc.at` directly, found **no `grpc` package listed at all**. Both checks cannot be simultaneously current; this discrepancy is unresolved and the Arch Linux riscv64 channel should be treated as [NEEDS VERIFICATION] rather than confirmed-available. It does not change the overall grade, since Ubuntu and Debian packaging independently establish the distro floor.

**Summary:**

| Distribution | riscv64 available? | Version | Gap vs upstream (1.84.0) |
|-------------|-------------------|---------|----------------|
| PyPI grpcio (official) | No (confirmed, 10,641 files checked) | n/a | Full gap |
| GitHub Releases | No (source-only for any arch) | n/a | n/a |
| RISE GitLab wheels (unofficial) | Yes | 1.76.0 | 5 minor versions behind |
| Ubuntu 26.04 "resolute" | Yes (verified, real .deb, HTTP 200) | 1.51.1-8ubuntu1 | Substantially behind |
| Debian trixie/sid | Yes (active buildd) | 1.51.1-6 / building 1.51.1-10 | Substantially behind |
| Arch Linux RISC-V | Contradictory: one pass found 1.81.0-1, a later pass found no package | Unresolved | [NEEDS VERIFICATION] |

**What a user must do to get a working binary:** On Ubuntu 26.04 or Debian, install `libgrpc-dev`/`python3-grpcio` from the distro repository (version 1.51.1 only). For current-version Python, use the RISE unofficial index (grpcio 1.76.0, five versions behind). For any other use case or for the current upstream version, build from source using the cmake invocation in Section 5.

## 9. Dependencies

### 9.1 Summary table

| Dependency | Role in gRPC | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|-----------|-------------|--------------|--------------|-----------------|----------------|
| BoringSSL | Runtime dependency, critical. Default TLS/crypto provider | Builds; scalar C (`nohw`) only, zero riscv64 asm | No riscv64 CI upstream | Source only (Google ships no BoringSSL binaries for any arch) | No `crypto/cpu_riscv.cc`, no Zvkn/Zvksh/RVV dispatch; `OPENSSL_RISCV64` macro defined but unused. See `project-reports/boringssl.md` |
| OpenSSL | Runtime dependency, optional (package-provider alternative to BoringSSL) | Full; distro builds substitute this for BoringSSL on riscv64 via `-DgRPC_SSL_PROVIDER=package` | Distro CI coverage | Debian/Ubuntu packages present | None blocking; no Zvk vector-crypto path yet, but scalar C maintained at parity |
| Abseil | Runtime dependency, critical. Hashing, CRC32C, atomics, synchronization used pervasively in gRPC C-core | Builds with caveats; needs `-latomic` | Debian riscv64 build shows 2 open SEGFAULT test failures (`absl_hashtablez_sampler_test`, `absl_cordz_sample_token_test`), unresolved since Feb 2026 | Debian `libabsl-dev` present | [abseil-cpp #1702](https://github.com/abseil/abseil-cpp/issues/1702) open, `-latomic` link failure; [abseil-cpp #2002](https://github.com/abseil/abseil-cpp/issues/2002) open, riscv64 SEGFAULTs; [abseil-cpp #1561](https://github.com/abseil/abseil-cpp/issues/1561) closed, riscv64 protobuf build fail due to abseil; CRC32C hardware path ([abseil-cpp #1986](https://github.com/abseil/abseil-cpp/pull/1986)) unmerged. Root cause of grpc/grpc's own SIGILL bug ([#37791](https://github.com/grpc/grpc/issues/37791)). See `project-reports/abseil-cpp.md` |
| Protocol Buffers | Runtime dependency, critical. Wire serialization and `protoc` codegen | Builds from source; Debian packages `protobuf-compiler` for riscv64 | No riscv64-specific upstream test failures found beyond abseil-linked ones | No official riscv64 `protoc` prebuilt binary; maintainer googleberg has repeatedly stated riscv64 is "not on our roadmap" and unstaffed (Aug 2024, Aug 2025) | [protobuf #12266](https://github.com/protocolbuffers/protobuf/issues/12266) closed unmerged, "Add riscv64 support"; [protobuf #14549](https://github.com/protocolbuffers/protobuf/issues/14549) closed, build fails via abseil's `__atomic_exchange_1`; [protobuf #17798](https://github.com/protocolbuffers/protobuf/issues/17798) closed, Maven Central riscv64 protoc prebuilts reportedly resolved for Java; PRs [#23205](https://github.com/protocolbuffers/protobuf/pull/23205)/[#23206](https://github.com/protocolbuffers/protobuf/pull/23206) abandoned. See `project-reports/protocol-buffers.md` |
| c-ares | Runtime dependency, optional. Async DNS resolution | Builds; no riscv64-specific code | No riscv64-specific issues found (`c-ares/c-ares` search: 0 results) | Debian-packaged | None found; no dedicated project report yet published |
| re2 | Runtime dependency, optional. Regex engine for header matching | Builds; pure portable C++, zero arch-specific code for any platform | No riscv64-specific test issues; parity with x86/ARM since none have SIMD paths either | Distro-packaged; no prebuilt binaries for any arch | None riscv64-specific; not a riscv64 gap since RE2 has zero SIMD for any architecture. See `project-reports/re2.md` |
| zlib | Runtime dependency, optional. HTTP/2 header/gzip compression | Builds fine as portable C; no riscv64-specific code path | No dedicated riscv64 test lane upstream (OpenBSD/riscv64 CI via a 2026-01 merged PR, QEMU-based) | Source-only releases (no prebuilt binaries for any arch); distro packages exist | None riscv64-specific found (0 riscv64-titled issues in `madler/zlib`); unmerged RVV Adler32 PR (#1099) stalled since 2025-10, no maintainer response. See `project-reports/zlib.md` |
| xxHash | Runtime dependency, optional. SIMD-accelerated non-crypto hashing, linked into ~20+ gRPC build targets | Builds from source; RVV 1.0 merged on upstream dev branch (Sept 2025) | Full RVV CI (vlen 128/256/512) under QEMU, passing on dev branch | Not yet in a tagged release (v0.8.3 predates RVV merges; v0.8.4 will be first with it) | First RVV attempt (#898) closed unmerged after 13 months; clean rewrite (#1043 et al.) merged in 3 days. See `project-reports/xxhash.md` |
| CMake | Build dependency, critical. Primary build-system generator (min. version 3.16) | N/A (CMake itself is riscv64-portable tooling; not gRPC-specific) | N/A | Distro-packaged for riscv64 | None identified specific to gRPC's use |
| Bazel | Build dependency, critical. Primary build system for internal/CI builds | No riscv64 Bazel usage found in gRPC's own CI (matrix is `["default","x64","x86","arm64"]`); Bazel itself has riscv64 support maturity outside this report's scope | N/A within grpc/grpc | N/A within grpc/grpc | gRPC's own `run_tests_matrix.py` does not include riscv64 as a Bazel target architecture |
| Cython | Build dependency, critical. Required to generate the Python extension sources for grpcio | Failure mode directly observed on riscv64: missing/uninstalled Cython triggers the "poisoned extensions" build failure ([#36112](https://github.com/grpc/grpc/issues/36112)) | N/A | N/A | [#36112](https://github.com/grpc/grpc/issues/36112) closed without root-cause diagnosis; more visible on riscv64 due to lack of pre-built wheels forcing from-source builds |
| googletest | Test dependency, critical. C++ unit test framework for gRPC's own test suite | Builds portably; no riscv64-specific issues found | Not exercised by any riscv64 CI upstream, since gRPC has no riscv64 CI at all | N/A | None found specific to gRPC's use; inherits "no riscv64 CI" gap from gRPC itself, not from googletest |
| GCC | Runtime dependency, critical. Primary compiler for riscv64 builds (both distro and manual cross-compiles) | Confirmed working: Debian sid build used GCC 15.2.0 (`gcc-15-riscv64-linux-gnu`); Ubuntu cross toolchain provides GCC 12-13 depending on release | N/A | Distro-packaged | Source of the `-latomic`/`-pthread` linkage class of bugs (PR #28272, issues #35839/#20400) - riscv64 does not fold atomics into libc the way x86/arm64 do, requiring explicit `-latomic` linkage |
| upb (indirect, bundled) | C protobuf runtime, bundled with Protocol Buffers | Builds | Inherits protobuf CI | Bundled | None found |
| utf8_range (indirect, bundled) | UTF-8 validation, bundled with Protocol Buffers | Builds | None found | Bundled | None found |

### 9.2 BoringSSL (deep-dive)

BoringSSL is the most consequential dependency for riscv64 performance. Its absence of riscv64 assembly means TLS-secured gRPC calls run all crypto on the scalar C path, and no FIPS validation exists for riscv64. Mitigation available today: set `-DgRPC_SSL_PROVIDER=package` to substitute OpenSSL, which ships riscv64 packages in all active stable Debian/Ubuntu branches and maintains its scalar C implementation at feature parity with x86_64, though it also lacks a mainline Zvk (RISC-V Vector Cryptography) path.

### 9.3 Abseil (deep-dive)

Two riscv64-specific issues remain open upstream: [#1702](https://github.com/abseil/abseil-cpp/issues/1702) (`-latomic` linker failure, open since July 2024) and [#2002](https://github.com/abseil/abseil-cpp/issues/2002) (SEGFAULTs in `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` on Debian riscv64, open since February 2026, no maintainer response). CRC32C hardware acceleration via Zvcrc/Zbc/Zbkc ([abseil-cpp #1986](https://github.com/abseil/abseil-cpp/pull/1986)) is proposed but unmerged. Because gRPC's bundled abseil-cpp submodule pin may lag behind these upstream fixes (as it did for the RDCYCLE removal that caused #37791), gRPC's riscv64 correctness is gated on how current its submodule pin is, not on gRPC's own code.

### 9.4 Protocol Buffers (deep-dive)

No upstream prebuilt `protoc` binary exists for riscv64; two PRs attempting to add one ([#23205](https://github.com/protocolbuffers/protobuf/pull/23205), [#23206](https://github.com/protocolbuffers/protobuf/pull/23206)) were abandoned/unmerged, and maintainer googleberg has stated riscv64 is "not on our roadmap" (quoted Aug 2024 and again Aug 2025). Users must build `protoc` from source on riscv64; Debian packages `protobuf-compiler` for the architecture. Maven Central riscv64 prebuilts for the Java `protoc` artifact ([#17798](https://github.com/protocolbuffers/protobuf/issues/17798)) were reportedly resolved separately.

## 10. Ecosystem Status

gRPC has a significant Python wheel ecosystem via `grpcio` and related packages (`grpcio-tools`, `grpcio-status`, `grpcio-reflection`, `grpcio-health-checking`, `grpcio-channelz`, `grpcio-observability`). These are direct installation dependencies for any Python application using gRPC, so riscv64 coverage of this ecosystem is a practical gating factor independent of gRPC's C-core support.

**Official PyPI coverage:** Zero riscv64 wheels across the entire `grpcio` release history (10,641 files checked across all versions up to 1.84.0). This is the single largest practical blocker for Python-based workloads on riscv64.

**RISE wheel builder coverage:** The [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) lists `grpcio` among roughly 70-76 packages it builds for riscv64, with active per-version automation visible in `riseproject-dev/python-wheels` (e.g. [PR #1974](https://github.com/riseproject-dev/python-wheels/pull/1974) adding grpcio 1.84.0, [PR #2422](https://github.com/riseproject-dev/python-wheels/pull/2422) adding grpcio-observability 1.83.1). Despite these build PRs reaching 1.84.0 in the build pipeline, the publicly advertised index versions lag at 1.72.0-1.76.0; the discrepancy between "built" and "published/current on the index" was not resolved by this research. A prior report additionally noted a skipped test, `DynamicStubTest.test_sunny_day`, in the 1.75.1/1.76.0 RISE builds because it hangs the test environment [NEEDS VERIFICATION on root cause - not independently re-confirmed in the current research pass].

**RISE runner infrastructure cost:** `riseproject-dev/riscv-runner` [issue #114](https://github.com/riseproject-dev/riscv-runner/issues/114) ("Provide swap on runner nodes for memory-heavy builds") cites gRPC as one of the heaviest feedstocks built for linux-riscv64, requiring 10-20 GiB of swap via conda-smithy workflow settings - direct evidence that RISE's own CI infrastructure has to specifically provision for gRPC's build cost, independent of the wheel-builder pipeline.

**Version lag:** The RISE wheel index (1.76.0) is five minor versions behind official upstream (1.84.0), meaning riscv64 Python users on the unofficial index do not receive several versions of upstream bug fixes.

**Upstream blocker:** Issue [#41591](https://github.com/grpc/grpc/issues/41591) - the tracking item for official wheels - is closed, not open. The infrastructure blockers that previously prevented riscv64 wheel publication (cibuildwheel, manylinux, PyPI warehouse riscv64 support, all added mid-2025) are cleared. The remaining blocker is exclusively Google's internal OSS Support Policy, which the closing maintainer said does not currently cover riscv64, with escalation to an internal committee offered but not committed to. RISE's offer of direct engineering help to debug riscv64-specific build issues was not taken up before the issue was closed.

**Shared infrastructure:** The RISE wheel builder covers dozens of Python packages beyond grpcio, sharing riscv64 runners and CI infrastructure across its portfolio; unblocking official grpcio wheels would reduce (but not eliminate, given the swap-provisioning cost noted above) RISE's maintenance burden for this package specifically.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#41591](https://github.com/grpc/grpc/issues/41591) | Building and publishing riscv64 wheels? | Closed (declined) | P2 / Enhancement | Closed by maintainer sergiitk citing Google OSS Support Policy does not currently cover riscv64; RISE's offered engineering help not taken up; no linked PR. |
| [#37791](https://github.com/grpc/grpc/issues/37791) | grpc hits SIGILL on riscv64 | Closed (resolved) | P2 / Correctness | SIGILL from stale abseil-cpp submodule lacking the RDCYCLE-removal fix. Fixed by submodule bump (grpc/grpc PR #37543). Affected grpc <= 1.66.1 on Linux 6.6+. |
| [#35839](https://github.com/grpc/grpc/issues/35839) | undefined symbol: `__atomic_compare_exchange_1` on riscv64 | Closed (unresolved upstream) | P2 / Correctness | Missing `-latomic` linkage in grpcio Python build. Closed "requires reporter action" after a version bump sidestepped it for the reporter; no `-latomic` fix landed in `setup.py`. |
| [#36112](https://github.com/grpc/grpc/issues/36112) | grpcio Python build fails on RISC-V | Closed (undiagnosed) | P2 / Build | Cython not installed, triggering "poisoned extensions"; hits riscv64 more often due to lack of pre-built wheels. Zero comments in-thread despite "requires reporter action" label; closed without maintainer follow-up. |

**Correctness bugs:** #37791 (SIGILL) was a genuine correctness regression affecting grpc <= 1.66.1 on kernels >= 6.6 on riscv64; it is resolved in current releases via the submodule bump. #35839 (undefined symbol) is a build-time linkage failure, not a runtime correctness bug, and is not fixed in gRPC's own build system; distro builds patch around it via the `-pthread`/`-latomic`-aware CMake flags (Section 5).

**Dependency-level open bugs affecting riscv64:**
- abseil-cpp [#1702](https://github.com/abseil/abseil-cpp/issues/1702): `-latomic` linker failure, open since July 2024.
- abseil-cpp [#2002](https://github.com/abseil/abseil-cpp/issues/2002): SEGFAULTs in hashtable and cord tests on Debian riscv64, open since February 2026, no maintainer response.

No all-four-of-these-issues-are-closed pattern should be read as "riscv64 is solved" - none of the closures reflect a durable upstream code fix for the `-latomic` class of failure (#35839) or the Python build failure (#36112); only the SIGILL bug (#37791) has a verified code-level resolution.

## 12. Objections and Upstream Blockers

**Stated organizational blockers:**
- gRPC's official riscv64 wheel-publishing request was declined specifically because of Google's internal OSS Support Policy, which maintainer sergiitk states does not currently cover riscv64; escalation to an internal committee was offered but the issue was closed rather than kept open pending that review ([#41591](https://github.com/grpc/grpc/issues/41591)).
- gRPC's wheel build pipeline is non-standard: unlike most Python packages, grpcio does not use `cibuildwheel` in the typical pattern, and the issue author explicitly asked for maintainer guidance before attempting a PR - indicating genuine build-system complexity as a barrier to community contribution, separate from the policy blocker.
- Six of seven Steering Committee seats and the overwhelming majority of active C-core maintainers are Google employees; new platform support effectively requires Google internal buy-in or a maintainer willing to own the riscv64 CI/support burden.

**Technical blockers:**
- BoringSSL has no riscv64 assembly optimizations. This is a BoringSSL-level problem gRPC inherits; fixing it requires upstream work in [google/boringssl](https://github.com/google/boringssl), not in grpc/grpc. `-DgRPC_SSL_PROVIDER=package` (OpenSSL) is the available mitigation today.
- abseil-cpp has open correctness issues ([#2002](https://github.com/abseil/abseil-cpp/issues/2002)) and the `-latomic` linker issue ([#1702](https://github.com/abseil/abseil-cpp/issues/1702)) on riscv64 that are unresolved upstream; these sit in a dependency gRPC bundles and must update via its submodule pin.
- No upstream riscv64 prebuilt `protoc` binary forces source builds for code generation workflows, and protobuf's maintainer has stated riscv64 is not roadmapped.
- The `-latomic` linkage bug underlying #35839 has no code fix in grpc/grpc's own build system; only the CMake `-pthread`-preference fix (#28272) addresses one instance of this class of failure (the CMake/C++ path), leaving the Python/setuptools build path (#35839) and the Cython build path (#36112) without an equivalent fix.

**Acceptance probability for official riscv64 wheels:** Low to moderate in the near term. The purely technical/infrastructure blockers (cibuildwheel, manylinux, PyPI warehouse) are cleared, and RISE has offered working engineering resources and a track record of maintaining riscv64 grpcio wheels for over a year. However, the blocker is now explicitly a Google internal policy decision rather than a technical one, and the issue was closed rather than left open pending committee review - this is a materially higher bar to clear than a purely technical PR review, since it requires an internal Google policy change, not just an accepted external contribution.

**Acceptance probability for riscv64 CI:** Low. Adding CI requires Google to provision riscv64 build infrastructure (hardware or cross-compile/QEMU nodes in Kokoro) or to accept RISE-hosted runners into the upstream repository, neither of which has been proposed upstream, and the same OSS Support Policy blocker applies.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro

**Justification:** gRPC has no upstream riscv64 CI (zero "riscv" matches across `.github/workflows/*`, no Jenkinsfile/.gitlab-ci.yml/.cirrus.yml, and `tools/run_tests/run_tests_matrix.py` lists architectures as only `["default","x64","x86","arm64"]`), and maintainer sergiitk explicitly closed the riscv64-wheel request stating "We follow Google OSS Support Policy which does not cover riscv64 at the moment" ([grpc/grpc #41591](https://github.com/grpc/grpc/issues/41591)) - so no upstream-CI tier (green/blue/yellow build-only) applies. The distribution floor lifts it off orange's worst case though: Ubuntu 26.04 "resolute" ships `libgrpc-dev`, `libgrpc29t64`, `libgrpc++-dev`, and `python3-grpcio` for riscv64 at 1.51.1-8ubuntu1 (packages.ubuntu.com), and Debian sid and Arch Linux RISC-V also package it successfully, so it is not broken (not red). But riscv64-specific build adaptation is needed and its patch-cleanliness is unconfirmed: distro builds substitute system OpenSSL/zlib/c-ares/re2 for the bundled copies (`-DgRPC_SSL_PROVIDER=package`, `GRPC_BUILD_WITH_BORING_SSL_ASM=0`, etc., since bundled BoringSSL has zero riscv64 asm), and the upstream `-latomic` linkage bug ([grpc/grpc #35839](https://github.com/grpc/grpc/issues/35839)) was closed "requires reporter action" without a real code fix. Per the skill's distribution-floor rule, unconfirmed/likely riscv64-specific build patching caps this at orange (downstream-only) rather than the clean-distro-build yellow.

**Pending work that could change the grade:** Open issue [grpc/grpc #41591](https://github.com/grpc/grpc/issues/41591) (official riscv64 PyPI wheels) is closed/declined pending internal Google OSS Support Policy committee review; RISE's offered engineering help was not taken up. No open PR fixes the `-latomic` linkage bug (#35839) or adds riscv64 to CI. RISE continues to publish unofficial riscv64 grpcio wheels (five minor versions behind upstream) via its GitLab index. A durable upgrade to yellow would require either (a) grpc/grpc landing a clean, code-level fix for the `-latomic` class of build failures and confirming distro builds need no further riscv64-specific patching beyond generic `package`-provider substitution, or (b) upstream reversing the OSS Support Policy position and accepting RISE's offered help to add riscv64 CI and official wheels.

## 14. Investment Analysis

RISE's current contribution is the unofficial grpcio wheel builder for riscv64 (versions 1.72.0-1.76.0, covering Python 3.10-3.14 on manylinux_2_35/2_39), maintained through active per-version automation in `riseproject-dev/python-wheels`, plus swap-capacity provisioning in `riseproject-dev/riscv-runner` specifically to absorb gRPC's heavy build cost. This work should not be sized again. The remaining gaps are:

### 14.1 Functional Enablement

The port is functionally complete as a scalar C implementation; no functional gaps were identified beyond distribution. The primary remaining functional item is closing the root cause of the `-latomic` linkage failure (#35839) in gRPC's own build system (setup.py / CMake), since distro packagers currently work around it rather than gRPC fixing it upstream.

### 14.2 Performance Optimization

The primary performance gap is BoringSSL's lack of riscv64 crypto assembly (AES-GCM, SHA, Montgomery multiplication/RSA). This work belongs in [google/boringssl](https://github.com/google/boringssl), not in grpc/grpc, and requires RISC-V ISA (Zvkn) expertise. Until done, the mitigation is `-DgRPC_SSL_PROVIDER=package` (OpenSSL), which has broader ISA coverage though also no vector-crypto path yet. A second item is abseil-cpp's CRC32C Zvcrc/Zbc acceleration, proposed but unmerged ([abseil-cpp #1986](https://github.com/abseil/abseil-cpp/pull/1986)). A third, lower-effort item is tracking xxHash's RVV work (already merged upstream on the dev branch) through to a tagged release and bumping gRPC's vendored copy once v0.8.4 ships.

### 14.3 CI/CD Infrastructure

Zero riscv64 CI exists upstream. A minimal addition would be a cross-compile build check (e.g. via dockcross/linux-riscv64) in a GitHub Actions matrix job; a full addition would add QEMU-emulated test execution. Neither has been proposed upstream, and both are gated behind the same OSS Support Policy blocker that closed #41591.

### 14.4 Ecosystem Enablement

The single highest-leverage item is landing official riscv64 grpcio wheels on PyPI. The purely technical infrastructure is ready (cibuildwheel/manylinux/PyPI warehouse riscv64 support since mid-2025); the blocker is now explicitly organizational (Google's internal OSS Support Policy), not engineering capacity, since RISE has already offered working engineering resources that were not accepted. This item is therefore now better characterized as requiring policy/advocacy effort at Google alongside engineering effort, not engineering effort alone.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Ecosystem / Policy | Reopen and resolve [#41591](https://github.com/grpc/grpc/issues/41591): get Google's OSS Support Policy committee to approve riscv64 coverage, then add riscv64 wheels to official grpcio PyPI pipeline | 4-6 (engineering) + policy/advocacy effort outside engineering scope | gRPC maintainer (sergiitk) + Google OSS policy committee + RISE contributor | Critical |
| Functional | Land a real code fix for `-latomic` linkage in the grpcio Python build for riscv64 (root cause of [#35839](https://github.com/grpc/grpc/issues/35839)) | 1-2 | gRPC Python build team | High |
| CI/CD | Add riscv64 cross-compile build check to GitHub Actions matrix | 2 | gRPC maintainer + RISE | High |
| CI/CD | Add QEMU-emulated riscv64 test execution to CI | 4 | gRPC maintainer + RISE | Medium |
| Performance | BoringSSL riscv64 AES-GCM / SHA / BigNum assembly (Zvkn / RVV) | 20-30 | BoringSSL team (Google) + RISC-V ISA expert | Medium |
| Performance | abseil-cpp CRC32C Zvcrc/Zbc acceleration (unblock [abseil-cpp #1986](https://github.com/abseil/abseil-cpp/pull/1986)) | 2 | Google abseil team | Low |
| Functional | Investigate and resolve abseil-cpp SEGFAULTs on Debian riscv64 ([abseil-cpp #2002](https://github.com/abseil/abseil-cpp/issues/2002)) | 3 | abseil-cpp maintainer | Medium |
| Performance | Track xxHash RVV work (already merged upstream dev branch) to tagged release and bump gRPC's vendored pin | 0.5 | gRPC maintainer | Low |

## 15. References

- [gRPC project homepage](https://grpc.io/)
- [grpc/grpc GitHub repository](https://github.com/grpc/grpc)
- [CNCF gRPC project page](https://www.cncf.io/projects/grpc/)
- [grpc/grpc #41591 - Building and publishing riscv64 wheels?](https://github.com/grpc/grpc/issues/41591)
- [grpc/grpc #37791 - grpc hits SIGILL on riscv64](https://github.com/grpc/grpc/issues/37791)
- [grpc/grpc #36112 - grpcio build fails on RISC-V (missing Cython)](https://github.com/grpc/grpc/issues/36112)
- [grpc/grpc #35839 - undefined symbol: __atomic_compare_exchange_1 on riscv64](https://github.com/grpc/grpc/issues/35839)
- [grpc/grpc #28272 - Prefer -pthread flag on UNIX (merged 2021-12-06, first in v1.44.0)](https://github.com/grpc/grpc/pull/28272)
- [abseil/abseil-cpp #1644 - unscaledcycleclock: remove RISC-V support](https://github.com/abseil/abseil-cpp/pull/1644)
- [abseil/abseil-cpp #1702 - -latomic linker failure on riscv64 (open)](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil/abseil-cpp #2002 - SEGFAULTs on Debian riscv64 (open)](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil/abseil-cpp #1561 - riscv64 protobuf build fails due to abseil (closed)](https://github.com/abseil/abseil-cpp/issues/1561)
- [abseil/abseil-cpp #1986 - CRC32C Zvcrc/Zbc acceleration (unmerged)](https://github.com/abseil/abseil-cpp/pull/1986)
- [protobuf #12266 - Add riscv64 support (closed unmerged)](https://github.com/protocolbuffers/protobuf/issues/12266)
- [protobuf #14549 - build fails on RISC-V via abseil's __atomic_exchange_1 (closed)](https://github.com/protocolbuffers/protobuf/issues/14549)
- [protobuf #17798 - Maven Central riscv64 protoc prebuilts (closed)](https://github.com/protocolbuffers/protobuf/issues/17798)
- [protobuf PR #23205 - riscv64 protoc prebuilt (abandoned)](https://github.com/protocolbuffers/protobuf/pull/23205)
- [protobuf PR #23206 - riscv64 protoc prebuilt (abandoned)](https://github.com/protocolbuffers/protobuf/pull/23206)
- [RISE wheel builder - grpcio package page](https://riseproject.gitlab.io/python/wheel_builder/packages/grpcio.html)
- [RISE unofficial grpcio riscv64 wheel index](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/grpcio/)
- [riseproject-dev/python-wheels PR #1974 - grpcio 1.84.0](https://github.com/riseproject-dev/python-wheels/pull/1974)
- [riseproject-dev/python-wheels PR #2422 - grpcio-observability 1.83.1](https://github.com/riseproject-dev/python-wheels/pull/2422)
- [riseproject-dev/riscv-runner #114 - swap for memory-heavy builds (cites gRPC)](https://github.com/riseproject-dev/riscv-runner/issues/114)
- [PyPI grpcio JSON API](https://pypi.org/pypi/grpcio/json)
- [PyPI grpc (deprecated placeholder) JSON API](https://pypi.org/pypi/grpc/json)
- [Debian buildd grpc riscv64 status](https://buildd.debian.org/status/package.php?p=grpc&suite=sid)
- [Ubuntu 26.04 resolute grpc packages search](https://packages.ubuntu.com/search?keywords=gRPC&suite=resolute&searchon=names&section=all)
- [Ubuntu ports archive - grpc riscv64 .deb pool](http://ports.ubuntu.com/pool/universe/g/grpc/)
- [Debian package search - grpc, suite trixie](https://packages.debian.org/search?keywords=grpc&suite=trixie)
- [Arch Linux RISC-V port package search](https://archriscv.felixc.at/)
- [grpc/grpc port_platform.h](https://raw.githubusercontent.com/grpc/grpc/master/include/grpc/support/port_platform.h)
- [grpc/grpc aarch64 cross-compile script](https://raw.githubusercontent.com/grpc/grpc/master/test/distrib/cpp/run_distrib_test_cmake_aarch64_cross.sh)
- [BoringSSL target.h (OPENSSL_RISCV64 definition)](https://raw.githubusercontent.com/google/boringssl/master/include/openssl/target.h)
- [dockcross/linux-riscv64 Dockerfile](https://raw.githubusercontent.com/dockcross/dockcross/master/linux-riscv64/Dockerfile.in)
- [dockcross/linux-riscv64 Toolchain.cmake](https://raw.githubusercontent.com/dockcross/dockcross/master/linux-riscv64/Toolchain.cmake)
- [grpc/grpc releases](https://github.com/grpc/grpc/releases)
- [LesnyRumcajs/grpc_bench](https://github.com/LesnyRumcajs/grpc_bench)
- [grpc.io benchmarking guide](https://grpc.io/docs/guides/benchmarking/)
- [riseproject.dev - RISE Project homepage](https://riseproject.dev/)
- [riseproject.dev - Announcing RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riseproject.dev - Advancing Go on RISC-V](https://riseproject.dev/2025/04/04/advancing-go-on-risc-v-progress-through-the-rise-project/)
- [riseproject.dev - Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)