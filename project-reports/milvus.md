---
title: Milvus
parent: Project Reports
color: orange
---

{% include dependency-graph.html slug="dependencies" subset="milvus" %}

# Milvus

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for Milvus<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

Milvus is an open-source vector database designed for similarity search over embedding vectors, used for retrieval-augmented generation (RAG), recommendation systems, and image/video/audio search. It is architecturally a Go control-plane (query coordination, data management, proxy, root coordinator) wrapping a performance-critical C++ core (`internal/core`, built via CMake and Conan), with a Rust component (a Tantivy-based full-text/inverted index).

Milvus is hosted by the **LF AI & Data Foundation** at **Graduated** status, the foundation's top maturity tier, above Incubation and Sandbox ([lfaidata.foundation/projects](https://lfaidata.foundation/projects/)). It is licensed under the **Apache License 2.0**.

Governance follows a three-tier Contributor -> Committer -> Maintainer structure tracked via in-repo `COMMITTERS` and `MAINTAINERS` files, with Kubernetes-style `OWNERS`/`OWNERS_ALIASES` review-and-approval bot configuration. A Milvus Technical Steering Committee (TSC) mailing list and public Discord exist per the `milvus-io/community` repository. No explicit written policy for Contributor -> Committer -> Maintainer promotion criteria was found in `CONTRIBUTING.md` or the fetchable parts of `milvus-io/community`.

**Zilliz** is the founding and primary corporate sponsor - the milvus.io site footer states "Made with Love by the Devs from Zilliz," and Zilliz commercially sells a managed Milvus offering ("Zilliz Cloud"). Current `MAINTAINERS` (congqixia, czs007, wxyucs, xiaofan-luan, yanliang567, jiaoew1991, tedxu, liliu-z, zhengbuqian, zhuwenxing, foxspy, chyezh, weiliu1031, sparknack) are, by public reputation, predominantly Zilliz engineers, though this could not be independently confirmed per-account via tooling in this research pass [NEEDS VERIFICATION]. Enterprise names listed on milvus.io (Salesforce, Walmart, Zillow, Reddit, Accenture, Shell, eBay, NVIDIA, Cisco, IBM) are documented as adopters/users, not sponsors.

**Community culture on new ports:** Milvus has a documented precedent of accepting new-architecture support requests when filed - ARM64/aarch64 support was requested and discussed (Discussion #30345 "Arm64 support for standalone systems"; issues #32476, #28823, #25326 on ARM64/aarch64 build problems) and now ships as a first-class supported target (amd64/arm64 Docker images, documented build instructions). A similar precedent exists for ppc64le (issue #29566, "IBM Power (ppc64le) support," closed Jan 2025). No equivalent RISC-V issue, PR, discussion, or request has ever been filed against `milvus-io/milvus`; the platform is untouched rather than rejected.

## 2. Port History and Upstreaming Timeline

No RISC-V port of Milvus exists, and no historical attempt has ever been recorded in the repository.

| Date | Event | Source |
|---|---|---|
| - | No RISC-V-related commit, issue, PR, or discussion has ever been opened in milvus-io/milvus | Full-repo grep at commit `73e495d` for "riscv" (case-insensitive): 0 matches; GitHub `search_issues`/`search_pull_requests`/`search_commits` for "riscv"/"riscv64"/"risc-v" scoped to `repo:milvus-io/milvus`: 0 genuine matches (3 text-search hits were false positives about ARM64, see Section 11) |

Key contributors: none - there is no port to attribute.

Is it fully upstream? No. There is no RISC-V code, build path, CI, or artifact anywhere in `milvus-io/milvus`.

**Important qualifier:** Milvus's vector-index/ANN engine, [zilliztech/knowhere](https://github.com/zilliztech/knowhere) (a separate repository, vendored into Milvus's C++ core as a pinned thirdparty dependency), has an active and maintainer-reviewed RISC-V Vector (RVV) port. A Milvus maintainer, `liliu-z`, confirmed this directly on milvus-io/milvus issue #21550 (2025-10-29): "RISC-V related support PRs can be found in the knowhere repo." This work is detailed in Section 9 (Knowhere is a direct, critical runtime dependency) but is not part of `milvus-io/milvus` itself and does not change the color assigned to Milvus as evaluated here.

## 3. Upstream Support Tier

No formal, written tier policy for architecture support was found in `CONTRIBUTING.md`, `MAINTAINERS`, or `OWNERS`. In practice, Milvus's de facto support tiers are visible from what its CI and Docker images actually build:

| Architecture | CI builds | CI tests | Official release artifact | Status |
|---|---|---|---|---|
| amd64 (x86_64) | Yes | Yes | Yes - Docker images (`milvusdb/milvus`), manylinux2014 wheels for the legacy PyPI `milvus` package | Full support |
| arm64 (aarch64) | Yes (dedicated Jenkins pipelines: `PR-Arm.groovy`, `PublishArmBasedImages.groovy`, `PublishArmBasedGPUImages.groovy`) | Yes | Yes - Docker images `linux/arm64` confirmed on current tags via [Docker Hub `milvusdb/milvus` tags](https://hub.docker.com/r/milvusdb/milvus/tags) | Full support |
| riscv64 | No | No | No | Absent - no CI job, no Docker platform target, no PyPI wheel, no distro package anywhere |

Evidence: `publish-builder.yaml` explicitly enumerates `platforms: linux/amd64,linux/arm64` with no riscv64 entry; the Jenkins CI directory (`ci/jenkins/*.groovy`, `build/ci/jenkins/*.groovy`) contains dedicated ARM pipelines with no riscv64 counterpart, confirmed by direct clone-and-grep at commit `73e495d7d57eccdc31463d46ab0caa76e7018fe7` (0 matches for "riscv" across all 21 GitHub Actions workflow files and the Jenkins groovy pipelines).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Milvus's C++ core dispatches SIMD-accelerated code for two internal modules, with build-system branching strictly limited to x86_64 and arm(64):

- `internal/core/src/bitset/detail/platform/{x86,arm}/*` - filter bitmap operations
- `internal/core/src/minhash/fusion_compute/{x86,arm}/*` - MinHash fusion compute
- `internal/core/src/exec/expression/SimdFilter{Avx2,Avx512}.cpp` - query expression filtering, with runtime CPUID/XGETBV dispatch

There is no sibling `riscv/` directory in either module, and no `#ifdef __riscv` guard exists anywhere in the tree (`search_code` for `"#ifdef __riscv" repo:milvus-io/milvus"` -> 0 results; full-repo grep for `__riscv` -> 0 matches). CMakeLists.txt files for both modules branch only on `CMAKE_SYSTEM_PROCESSOR MATCHES "(aarch64)|(ARM64)|(arm64)"` vs x86_64; on any other processor string (riscv64 included) neither branch's SIMD source list executes, and no compiled SIMD sources are added for that build.

At the dispatcher level (`internal/core/src/exec/expression/SimdFilter.cpp`), the architecture selection is:
```cpp
#if defined(__x86_64__)
using Arch = xsimd::sse2;
#elif defined(__aarch64__)
using Arch = xsimd::neon64;
#else
using Arch = xsimd::default_arch;   // riscv64 falls here, by generic fallthrough
#endif
```
This `#else` branch is a pre-existing catch-all for any unrecognized architecture; it predates and is unrelated to RISC-V. riscv64 would compile under it only by accident of generic-programming fallback, not by design or by any tested code path.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `bitset` filter ops | Full - hand-tuned AVX2/AVX512 intrinsics + CPUID dispatch (11 files, ~5,922 lines) | Full - hand-tuned NEON/SVE intrinsics + runtime SVE compiler probe (10 files, ~5,346 lines) | Missing - 0 dedicated files; falls to generic scalar reference path (`dynamic.cpp`) |
| `minhash` fusion compute | Full - hand-tuned AVX2/AVX512 (4 files) | Full - hand-tuned NEON/SVE (4 files) | Missing - 0 files; falls to `fusion_compute_native.h` scalar-only path |
| `exec` SimdFilter (query filtering) | Full - hand-tuned AVX2/AVX512 with CPUID/XGETBV runtime dispatch | Partial - xsimd wrapper over NEON (genuinely vectorized, not hand-rolled intrinsics) | Missing - `xsimd::default_arch` generic/scalar, zero RVV |

No RISC-V architecture-specific code exists anywhere in `milvus-io/milvus`: no `arch/riscv/` directory, no RVV intrinsics (`vfloat32m1_t`, `vsetvl`, `riscv_vector.h`), no RISC-V assembly, no `__riscv`/`__riscv_vector` preprocessor guards. This is a genuine absence (search tooling was verified functional by confirming it correctly returns the 30 "avx512" hits and 32 "neon" hits present in the codebase), not a search-tooling limitation.

Milvus's own critical path uses no JIT backend (no "jit"/"llvm" references in the C++ core's CMake configuration). Apache Arrow's optional Gandiva module (an LLVM JIT expression compiler) is a nearby example of JIT-on-RISC-V risk, but Milvus's Conan build options do not enable Gandiva - see Section 9.

## 5. Build System, Cross-Compilation, and Toolchain

Milvus's build documentation (`DEVELOPMENT.md`) documents only x86_64 and arm64/aarch64 (Apple Silicon, Ubuntu, Rocky Linux, Amazon Linux) as supported/documented architectures. No `BUILDING.md`, `docs/building.md`, `docs/cross-compilation.md`, riscv64 toolchain file, riscv64 CMake toolchain (`cmake/riscv64.cmake` or equivalent), or riscv64 Dockerfile exists anywhere in the repository - none of these paths exist at all.

There are no exact cmake/configure commands, no minimum toolchain version, and no QEMU-based build instructions to report for riscv64, because none exist. Given the absence of build documentation and the SIMD/dependency gaps identified in Section 9 (in particular, dependency `xsimd` has an open, unresolved riscv64 build failure), a from-scratch riscv64 build of Milvus's C++ core cannot currently be assumed to succeed and has not been attempted or documented by anyone in the project's history, as far as this research could determine.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiled binary/Docker image | Yes | Yes | No |
| SIMD-accelerated bitset/filter ops | Yes (AVX2/AVX512) | Yes (NEON/SVE) | No (scalar fallback only, untested) |
| SIMD-accelerated MinHash fusion | Yes (AVX2/AVX512) | Yes (NEON/SVE) | No (scalar fallback only, untested) |
| CI build coverage | Yes | Yes | No |
| CI test coverage | Yes | Yes | No |
| Official Docker image | Yes | Yes | No |
| PyPI/package availability | Legacy `milvus` PyPI package (manylinux2014) | macOS arm64 wheels for legacy package | No |

**Functional gaps:** riscv64 cannot currently be assumed to build at all given the open, unresolved `xsimd` riscv64/RVV build failure ([xsimd#1275](https://github.com/xtensor-stack/xsimd/issues/1275), open since 2026-03-18) in a direct, critical Conan dependency of Milvus's C++ core - see Section 9. No end-to-end riscv64 build has been documented as successful or attempted by the project or any third party found in this research.

**Performance gaps:** even assuming the build succeeds, Milvus's bitset filtering, MinHash fusion, and SIMD query-expression filtering would run on generic scalar fallback paths on riscv64, with no vectorization whatsoever (no RVV) - equivalent operations get hand-tuned AVX2/AVX512 on amd64 and NEON/SVE on arm64. The performance delta is unquantified because no riscv64 benchmark of any kind for Milvus was found (see Section 11).

**Security hardening gaps:** Data not available - no riscv64-specific security/hardening review of Milvus was found in this research; the absence of any riscv64 build or CI means no hardening posture has ever been evaluated.

**NaN / floating-point semantics issues:** Data not available - no riscv64-specific floating-point correctness issue was found for Milvus itself. One transitive dependency (OpenBLAS, see Section 9) has documented riscv64 numeric-correctness regressions on RVV targets (#5811, closed 2026-05), which is a relevant risk signal but not a Milvus-specific finding.

## 7. CI/CD Infrastructure

No riscv64 CI exists for `milvus-io/milvus` in any form. This was verified by directly cloning the repository (`73e495d7d57eccdc31463d46ab0caa76e7018fe7`) and reading, not merely grepping metadata of, the actual CI definitions:

- All 21 `.github/workflows/*.{yaml,yml}` files: 0 matches for "riscv" in any casing/separator form.
- Actual Jenkins CI pipelines (`ci/jenkins/*.groovy`, `build/ci/jenkins/*.groovy`, `ci/jenkins/pod/*.yaml`) - the real build/test pipelines, distinct from `jenkins-checker.yaml` (a GitHub Actions workflow that only lints these groovy files, not a build itself): 0 matches for "riscv". This directory does contain architecture-specific pipelines for ARM (`PR-Arm.groovy`, `PublishArmBasedImages.groovy`, `PublishArmBasedGPUImages.groovy`, `pod/rte-arm.yaml`), demonstrating that Milvus's CI does express per-architecture jobs when a target is supported - riscv64 has no counterpart anywhere in this pattern.
- Full repository tree (not just CI configs): 0 matches for "riscv" anywhere.
- No `.gitlab-ci.yml` or `.cirrus.yml` exists in the repository.
- `main.yaml` build/test jobs all run on `runs-on: ubuntu-latest` (standard x86 GitHub-hosted runners) with no architecture matrix.
- `publish-builder.yaml` explicitly targets `platforms: linux/amd64,linux/arm64` only (line 89).

No RISE runners are referenced (no `riseproject-dev` runner labels, no QEMU-riscv64 emulation step).

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Trigger | Yes (GitHub Actions, Jenkins) | Yes (dedicated Jenkins `PR-Arm.groovy`) | N/A - no job exists |
| Runner type | GitHub-hosted (`ubuntu-latest`) | Dedicated ARM runners (Jenkins) | N/A |
| Build step | Yes | Yes | N/A |
| Test step | Yes | Yes | N/A |
| Image publish | Yes (`linux/amd64`) | Yes (`linux/arm64`) | N/A |

## 8. Distribution and Release Status

No official riscv64 binary, package, or Docker image exists for Milvus through any channel checked:

- **GitHub Releases:** The 5 most recent releases (v3.0.1, v2.6.23, v3.0.0, v2.6.22, v2.6.21) attach only Docker Compose YAML files and source archives (zip/tar.gz) - no compiled binaries at all, for any architecture. Milvus does not distribute binaries via GitHub release assets.
- **Docker Hub (`milvusdb/milvus`):** the actual binary distribution channel. Current tags (e.g. `master-20260911-9422ca14`) explicitly list OS/ARCH = `linux/amd64` and `linux/arm64` only, verified directly at [hub.docker.com/r/milvusdb/milvus/tags](https://hub.docker.com/r/milvusdb/milvus/tags). riscv64 is absent from the official Docker images.
- **PyPI (`milvus`, the legacy "Milvus Lite" package, now deprecated in favor of `milvus-lite`):** filenames span manylinux2014 x86_64, macOS x86_64/arm64, and win_amd64 wheels only - no riscv64/riscv wheel at any version, confirmed via `https://pypi.org/pypi/milvus/json`.
- **RISE Python wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/milvus/`): 302-redirects to plain PyPI (no RISE-built package for `milvus` exists).
- **Ubuntu 26.04 ("resolute"):** package search returns "Sorry, your search gave no results" - Milvus is not packaged in Ubuntu at all, on any architecture, let alone riscv64.
- **Arch Linux RISC-V port** (`archriscv.felixc.at` mirror): grepped the full `core`, `extra`, `unsupported`, and `community` repo listings (~14,600 package files total) - 0 matches for "milvus" anywhere.
- **project-graph MCP (Ubuntu 26.04 SPARQL dependency-graph query):** could not be run - the `project-graph` MCP server failed to connect (`CONNECTION_CLOSED`) across multiple attempts in this research. This is a tooling outage, not a confirmed-negative data point, and should be re-run when the server is reachable.

**What a user must currently do to get a working riscv64 Milvus:** there is no documented or known path. A user would need to: (1) resolve the open `xsimd` riscv64 build failure (Section 9) or patch around it, (2) build Milvus's C++ core from source with no riscv64 build documentation to follow, (3) manually verify or update the pinned Knowhere commit to include its RVV fixes, and (4) build the Go control plane and Rust (Tantivy) component, none of which has been attempted or documented by the project or any third party found in this research.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| **Go** | Build-dependency, critical (control plane) | Data not available: no Milvus-specific riscv64 Go toolchain check performed; Go itself has Tier-1-equivalent riscv64 support upstream generally [NEEDS VERIFICATION - not directly researched for this report] | Data not available | Data not available | Not covered in this research pass |
| **CMake** | Build-dependency, critical (C++ core build system) | Used throughout `internal/core`; no riscv64-specific CMake toolchain file exists in Milvus itself (Section 5) | N/A | N/A | Milvus's own CMake logic branches only on x86_64/arm(64) (Section 4) |
| **Rust** | Build-dependency, critical (builds Tantivy component via `cargo +1.89`) | riscv64gc-unknown-linux-gnu is a Rust Tier-2 target; not independently confirmed for Milvus's specific toolchain pin in this pass | Data not available | Data not available | Rust toolchain riscv64 availability is the likely gating factor, not the Tantivy crate itself |
| **RocksDB** `6.29.5` (custom `@milvus/dev` fork) | Runtime-dependency, critical (LSM KV storage engine) | Upstream `-march=native` riscv64 build bug (facebook/rocksdb#10500) fixed 2023-12, but Milvus pins 6.29.5 (2021), predating that fix; unclear if backported into the `@milvus/dev` fork | Unknown | Not independently packaged - vendored/built from source | Pinned version predates upstream riscv64 fixes |
| **jemalloc** `5.2.1` (vendored, built from source, not a distro package) | Runtime-dependency, critical (memory allocator) | riscv64 atomics FTBFS (jemalloc#1401) fixed before the 5.2.1 release, but "Add support for riscv64gc" (jemalloc#2323) closed 2022-08, after 5.2.1 - full riscv64gc support may be missing from the vendored build | Open jemalloc#2399 "Does jemalloc support cross build for RISCV64?" remains open, suggesting real-world gaps | N/A (vendored) | Pin predates riscv64gc support; cross-build status unclear |
| **simdjson** (vendored FetchContent, tag `v3.12.2`) | Build-dependency, optional (SIMD JSON parsing) | Has a portable non-SIMD fallback kernel, so it builds/runs on riscv64 regardless of native-kernel status; native RVV kernel work ([simdjson#2423](https://github.com/simdjson/simdjson/issues/2423) "Add RVV Optimizations", #2602 "Implement find_next_json_quotable_character for RISC-V (RVV)") both closed Feb 2026 | Presumed passing via fallback kernel | N/A (vendored) | No blockers; RVV acceleration is newly landed, perf-only gap before that |
| **Apache Arrow** `17.0.0` (Conan, "milvus/dev" build with parquet, compute, s3, azure, encryption enabled; Gandiva NOT enabled by Milvus's options) | Build-dependency, critical (columnar data + SIMD compute kernels) | Core Arrow: no blocking riscv64 issues surfaced. Gandiva (LLVM JIT, not used by Milvus): [apache/arrow#50862](https://github.com/apache/arrow/issues/50862) "On riscv64, Gandiva fails at runtime" closed only 2026-08-14 | Unknown | Data not available (not in `project-reports/` yet) | No blocker for components Milvus actually enables; Gandiva JIT path is fragile on riscv64 if ever turned on |
| **Conan** | Build-dependency, critical (C++ package manager driving most of the above) | Not itself architecture-limiting; riscv64 status is a function of each recipe it pulls (see individual rows) | N/A | N/A | Not independently researched as a standalone tool in this pass |
| **xsimd** `9.0.1` (Conan) | Build-dependency, critical (SIMD abstraction used across the C++ core) | **[xsimd#1275](https://github.com/xtensor-stack/xsimd/issues/1275) "Failing to build riscV/rvv" - OPEN as of 2026-03-18**; [xsimd#954](https://github.com/xtensor-stack/xsimd/issues/954) "riscv64 error: 'aligned_mode' does not name a type" open since 2023 | N/A - build broken | N/A | **Highest-risk item found: active, currently-unresolved build failure on riscv64 in a directly-used critical dependency** |
| **Knowhere** (zilliztech, pinned short commit `2868882b`) | Runtime-dependency, critical (vector-index/ANN engine wrapping FAISS/HNSW/DiskANN, heavy AVX/SSE/NEON/RVV SIMD kernels) | Active, maintainer-reviewed RVV port: [PR #1160](https://github.com/zilliztech/knowhere/pull/1160) (merged 2025-04-17, `__riscv` CMake detection), [PR #1307](https://github.com/zilliztech/knowhere/pull/1307)/[#1301](https://github.com/zilliztech/knowhere/pull/1301) (merged Aug 2025, fixed compile-option targeting), [PR #1396](https://github.com/zilliztech/knowhere/pull/1396) (merged 2025-11-26, RVV-optimized Scalar Quantizer, benchmarked 2.60x-3.64x speedup, no accuracy loss), [issue #1587](https://github.com/zilliztech/knowhere/issues/1587)/[PR #1586](https://github.com/zilliztech/knowhere/pull/1586)/[PR #1588](https://github.com/zilliztech/knowhere/pull/1588) (fixed an RVV compilation failure on SG2044 hardware, merged through 2026-04-20) | Some field validation on SG2044 hardware reported in issue comments (user `maxiaohong2333`) | Vendored source build, no independent release channel | **Whether Milvus's pinned commit `2868882b` actually includes the #1588 fix (merged 2026-04-20) is unverified** - not confirmed either way in this research |
| **Tantivy** (zilliztech fork of `tantivy` 0.21.1, tag `0.21.1-fix4`, Rust) | Runtime-dependency, critical (full-text/inverted-index search engine) | Not independently confirmed via issue search in this pass; inferred low risk since it is largely portable safe Rust with no hand-written SIMD/asm of note, and `riscv64gc-unknown-linux-gnu` is a Rust Tier-2 target | Unverified | Data not available | Needs a follow-up issue search on the zilliztech fork; Rust toolchain riscv64 availability is the real gating factor |
| FAISS (transitive, via Knowhere) | Runtime-dependency (ANN numerics kernels) | [facebookresearch/faiss#4321](https://github.com/facebookresearch/faiss/issues/4321) "riscv64 device build failed" - closed 2025-04-29 | No open riscv64 issues found | N/A | No currently open blockers |
| OpenBLAS `0.3.30` (Conan, Linux only) | Runtime-dependency (BLAS/LAPACK numerics) | Generic riscv64 target builds; RVV1.0-optimized kernel support ([#4050](https://github.com/OpenMathLib/OpenBLAS/issues/4050)) still open since 2023 | Real regressions reported in 2026: #5608 "Undefined behaviour in dynamic_riscv64.c" (closed), #5811 "DGEMM regression... produces non-PSD matrix" on riscv64_zvl256b (closed 2026-05) - correctness bugs, not just perf | N/A | FP16/BF16 GEMM kernel gaps (#5279); recent correctness regressions on RVV targets |
| OpenSSL `3.3.2` (Conan, forced version) | Runtime-dependency (TLS/crypto) | Active upstream riscv64 support/tuning (66 riscv64-tagged issues total); open items include #29453 "use intrinsic instead of inline asm" (Dec-2025), #28664 "further SHA256 optimization" (Sep-2025) | Intermittent CI flake open: #30880 "test_lhash occasionally failing on linux-riscv64 CI" | N/A | No release blocker; ongoing perf/asm work and one flaky test |
| libsodium `1.0.19` (Conan) | Runtime-dependency (crypto, internal signing/hashing) | No riscv64-specific issues surfaced (only ARM/Windows/i386 results) - implies untested-but-unreported, relies on portable reference C | Unverified | N/A | None found, but no explicit riscv64 validation evidence either |
| zstd `1.5.5` (Conan) | Runtime-dependency (compression, used by RocksDB/Arrow/librdkafka) | Core build fixed since 2022 (#3134 closed); RVV acceleration still open: #4471 "Add RVV Support for XXH3" (open), #4546 "Add RISC-V unaligned access" (open) | Presumed OK | N/A | None blocking; RVV hashing/unaligned-access optimizations pending |
| lz4 / snappy / zlib (Conan, forced/pinned) | Runtime-dependency (compression, Parquet/Arrow decoding) | Not independently re-checked this pass | - | N/A | Mature portable C libraries, historically low riscv64 risk |
| libunwind `1.6.2` (vendored, non-macOS) | Runtime-dependency (stack unwinding, used by Folly/glog) | #765 "CMake support for RISCV" open since 2024 (Milvus's build is CMake-based) | #519 "Ltest-cxx-exceptions fails for Ubuntu20.04-riscv64" open since 2023 | N/A | CMake-path riscv64 gap plus open exception-handling test failures |
| Folly `2026.04.20.00` (Conan, custom `@milvus/dev` build; Milvus's `conanfile.py` explicitly drops `folly.use_sse4_2` on non-x86 architectures) | Runtime-dependency (Facebook C++ infrastructure used throughout the core) | **[facebook/folly#2493](https://github.com/facebook/folly/issues/2493) "Build failure with GCC 14 on riscv64 (Ubuntu 24.04) due to libstdc++ internal details" - OPEN (2025-09-04)** - plausibly still live on an Ubuntu 26.04 GCC14+ toolchain | Unknown | N/A | Real risk for a modern Ubuntu toolchain |
| oneTBB `2021.9.0` (Conan) | Runtime-dependency (threading/parallelism) | "Support RISC-V" ([uxlfoundation/oneTBB#1051](https://github.com/uxlfoundation/oneTBB/issues/1051)) closed 2023-03, but Milvus pins 2021.9.0, which predates that fix | Unknown | N/A | Pinned version predates upstream riscv64 support landing |
| simde `0.8.2` (Conan) | Runtime-dependency (SIMD portability shim) | No compile-failure issues found; dedicated RVV intrinsic implementations still requested/open (#1087 open since 2023, #1352 open 2025-10) - falls back to portable scalar C | Presumed OK, unaccelerated | N/A | None blocking; RVV-native kernels not implemented yet (perf gap only) |

**Deep-dive - highest-risk dependencies:**

1. **xsimd** (direct, critical): an open, unresolved build failure ([xsimd#1275](https://github.com/xtensor-stack/xsimd/issues/1275), opened 2026-03-18) directly blocks any code path in Milvus's core that depends on xsimd vectorization compiling cleanly on riscv64. This is the single highest-confidence blocker identified for a from-scratch riscv64 build of Milvus.
2. **Folly** (transitive via Conan): open GCC14+riscv64 build failure ([folly#2493](https://github.com/facebook/folly/issues/2493), Sep-2025) tied to libstdc++ internals - a real risk on a modern Ubuntu 26.04 toolchain.
3. **Knowhere** (direct, critical): the most performance-critical native dependency and the one with the most positive signal - an active, first-party RVV enablement effort with fixes merged through April 2026, including a real compilation-failure fix ([knowhere#1587](https://github.com/zilliztech/knowhere/issues/1587)/[#1586](https://github.com/zilliztech/knowhere/pull/1586)/[#1588](https://github.com/zilliztech/knowhere/pull/1588)) and a benchmarked RVV Scalar Quantizer feature ([#1396](https://github.com/zilliztech/knowhere/pull/1396), 2.60x-3.64x speedup). Whether Milvus's pinned vendored commit includes these fixes is unverified.
4. **Stale-pin pattern:** RocksDB (6.29.5), jemalloc (5.2.1), and oneTBB (2021.9.0) are all pinned to versions that predate their respective upstream riscv64 fixes/support landing upstream. Their `@milvus/dev` Conan forks may carry backports, but this is not verifiable from the manifest alone.

## 11. Known Bugs and Active Issues

No RISC-V-specific bug, issue, or benchmark report exists for Milvus itself in any channel checked (GitHub issues/PRs/commits scoped to `milvus-io/milvus` and `milvus-io/knowhere`, web search, RISE blog). All three "riscv64"/"risc-v" text-search hits returned by GitHub's fuzzy matcher were confirmed false positives (they are about ARM64):

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [milvus-io/milvus#32476](https://github.com/milvus-io/milvus/issues/32476) | "[Bug]: ARM64 compilation problems" | Closed 2024-06-05 | N/A (false positive) | About ARM64, not RISC-V; surfaced by fuzzy "riscv64" text search |
| [milvus-io/milvus#28823](https://github.com/milvus-io/milvus/issues/28823) | "[Bug]: The arm64 architecture fails to run" | Closed 2024-01-12 | N/A (false positive) | jemalloc/OpenBLAS failures on Huawei Kunpeng aarch64; not RISC-V |
| [milvus-io/milvus#25326](https://github.com/milvus-io/milvus/issues/25326) | "[Feature]: aarch64 compilation" | Closed 2023-08-25 | N/A (false positive) | Request for official aarch64 Docker image; not RISC-V |
| [milvus-io/milvus#29566](https://github.com/milvus-io/milvus/issues/29566) | "[Enhancement]: IBM Power (ppc64le) support" | Closed Jan 2025 | N/A | Closest related-architecture precedent; no RISC-V equivalent exists |

**Correctness bugs (in dependencies, not Milvus itself):** OpenBLAS #5811 "DGEMM regression... produces non-PSD matrix" on riscv64_zvl256b (closed 2026-05) is a genuine numeric-correctness regression on RVV targets in a transitive numerics dependency - flagged separately from build/perf issues per the report's own severity distinction (Section 9).

No riscv64 vs arm64 or riscv64 vs amd64 performance benchmark of any kind was found for Milvus (checked: Milvus's own benchmark repos `milvus-io/benchmarks`, `zilliz-bootcamp/milvus_benchmark`, `ministat/milvus-benchmark` - all target x86/ARM64 only, no riscv64 configuration).

## 12. Objections and Upstream Blockers

No stated objection to RISC-V support exists because no one has ever raised the topic - there is no issue, PR, or discussion to object to. This reads as an untouched platform target rather than a project with an explicit accept/reject stance.

**Technical blockers:**
- Open, unresolved build failure in direct dependency xsimd ([xsimd#1275](https://github.com/xtensor-stack/xsimd/issues/1275)).
- Open build failure risk in transitive dependency Folly under GCC14+ ([folly#2493](https://github.com/facebook/folly/issues/2493)) on a modern Ubuntu toolchain.
- No riscv64 build documentation, toolchain file, or CI job exists to validate any fix against.
- Several critical deps (RocksDB, jemalloc, oneTBB) are pinned to versions predating upstream riscv64 fixes.

**Organizational blockers:** None documented. Milvus has precedent for accepting community-driven architecture ports when requested (ARM64, and a considered ppc64le request) - the absence of RISC-V activity appears to reflect absence of demand/requests rather than resistance.

**Acceptance probability:** Given the clean precedent set by ARM64 (issue-driven, eventually became a first-class CI/release target) and the fact that Milvus's own core vector-search dependency (Knowhere) already has an active, maintainer-approved RVV port, a well-formed riscv64 PR to `milvus-io/milvus` (fixing the CMake architecture branches in Section 4, upgrading the stale-pinned dependencies noted in Section 9, and adding CI) appears likely to be reviewed and merged if submitted, based on observed maintainer behavior toward other new-architecture requests. This is an inference from precedent, not a confirmed maintainer statement, and is marked [NEEDS VERIFICATION].

## 13. Readiness Assessment

- **Color:** orange
- **Release provider:** none
- **Optimization gap:** N/A - Milvus is a full vector-database application (indexing, storage, distributed coordination, API surface), not a project whose primary stated purpose is to make a specific algorithm faster than a reference implementation. Per the color model's optimization-purpose test, Milvus would still deliver its core value proposition (a working, feature-complete vector database) running on generic scalar C with no architecture-specific SIMD, just at reduced performance - this distinguishes it from SIMD/allocator/kernel libraries like jemalloc or xsimd where the entire value proposition collapses without hardware acceleration. The Step 2 optimization-purpose modifier therefore does not apply to Milvus itself.

**Justification:** Milvus has no upstream riscv64 CI of any kind (0 matches for "riscv" across all 21 GitHub Actions workflow files and all Jenkins groovy pipelines, verified by direct clone at commit `73e495d`) and publishes no riscv64 artifact through any channel checked - Docker Hub `milvusdb/milvus` tags list only `linux/amd64`/`linux/arm64` ([hub.docker.com/r/milvusdb/milvus/tags](https://hub.docker.com/r/milvusdb/milvus/tags)), PyPI ships no riscv64 wheel, and no Linux distribution (Ubuntu 26.04, Arch Linux RISC-V) packages Milvus at all. Per the color model's Step 1 primary-grade table, no upstream CI plus no distro package floor places Milvus at orange (not grey, because extensive, specific research was performed and produced a definitive negative result rather than an unknown-unknown; not red, because there is no confirmed report of riscv64 breakage of Milvus itself, only absence of any attempt).

**Pending work that could change the grade:** the single most consequential lever is Knowhere (Milvus's own vector-index engine, a direct critical dependency) - it already has an active, maintainer-reviewed RVV port with real fixes merged through April 2026 ([knowhere#1160](https://github.com/zilliztech/knowhere/pull/1160), [#1307](https://github.com/zilliztech/knowhere/pull/1307), [#1396](https://github.com/zilliztech/knowhere/pull/1396), [#1586](https://github.com/zilliztech/knowhere/pull/1586)/[#1588](https://github.com/zilliztech/knowhere/pull/1588)). If Milvus's pinned Knowhere commit is bumped to include these fixes, and the open xsimd build failure ([xsimd#1275](https://github.com/xtensor-stack/xsimd/issues/1275)) is resolved, a riscv64 build of Milvus becomes plausible without waiting on any Milvus-specific upstream work. No RISE Project involvement with Milvus was found (not a member, no blog coverage, no wheel-builder package, no funded work item, no tracking repo) - RISE is not currently a lever for this project.

## 14. Investment Analysis

RISE has no existing investment in Milvus specifically (Section 12/13) - all sizing below is therefore net-new. However, RISE's investment in Milvus's dependency chain is partially covered already: Knowhere's RVV port is an independent, third-party (zilliztech-community) effort, not attributable to RISE in this research; simdjson's RVV kernels landed Feb 2026 from that project's own community; OpenSSL, zstd, and FAISS riscv64 build issues have been resolved upstream by those projects' own communities. The work sized below is specific to closing gaps in `milvus-io/milvus` proper and its remaining unresolved/unverified dependency pins.

### 14.1 Functional Enablement

- Add `riscv64`/`__riscv` branches to the CMake architecture-detection logic in `internal/core/src/bitset/CMakeLists.txt` and `internal/core/src/minhash/CMakeLists.txt` so builds don't silently fall through to unaccelerated code with no explicit riscv64 target.
- Verify and, if needed, bump the pinned Knowhere commit (`2868882b`) to include the riscv64 compilation fixes merged through knowhere PR #1588 (2026-04-20).
- Resolve or work around the open xsimd riscv64 build failure ([xsimd#1275](https://github.com/xtensor-stack/xsimd/issues/1275)) - either upstream a fix or patch Milvus's vendored/Conan-pinned copy.
- Audit and likely upgrade the stale-pinned dependencies (RocksDB 6.29.5, jemalloc 5.2.1, oneTBB 2021.9.0) to versions that include their respective upstream riscv64 fixes.
- Validate the Folly GCC14+riscv64 build failure ([folly#2493](https://github.com/facebook/folly/issues/2493)) against the actual target toolchain and patch/upgrade as needed.
- Produce a first successful from-scratch riscv64 build of the full stack (Go control plane + C++ core + Rust Tantivy component) - currently undocumented and unattempted by anyone found in this research.

### 14.2 Performance Optimization

- Implement riscv64/RVV SIMD kernels for `internal/core/src/bitset/detail/platform/` (filter bitmap ops) and `internal/core/src/minhash/fusion_compute/`, mirroring the existing x86/arm hand-tuned implementations.
- Extend the `exec/expression/SimdFilter` dispatcher with an explicit RVV path rather than relying on `xsimd::default_arch` scalar fallback.
- This work is separable from and lower-priority than functional enablement (Section 14.1) - Milvus is not classified as optimization-purpose, so a working scalar-fallback riscv64 build already delivers the project's core value; SIMD work is a performance follow-on, not a blocking prerequisite.

### 14.3 CI/CD Infrastructure

- Add a riscv64 build (and ideally test) job to Milvus's CI, following the existing ARM precedent (`PR-Arm.groovy`, `PublishArmBasedImages.groovy`) as a template.
- Add a `linux/riscv64` platform target to `publish-builder.yaml`'s Docker image publishing pipeline.
- Evaluate use of RISE-provided riscv64 runners/board farm for this CI, since no RISE relationship currently exists for Milvus (Section 12) and would need to be established.

### 14.4 Ecosystem Enablement

Not applicable - Section 10 is omitted per the report's scoping rule (Milvus is a standalone application/database with no significant dependent package ecosystem of its own that itself must be separately enabled on riscv64; its own dependency chain is covered in Section 9).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix CMake riscv64 architecture branches in bitset/minhash modules | 1-2 | Upstream Milvus / contributor | Critical |
| Functional | Verify/bump pinned Knowhere commit to include riscv64 fixes | 0.5-1 | Upstream Milvus / contributor | Critical |
| Functional | Resolve xsimd riscv64 build failure (xsimd#1275) | 1-3 (depends on upstream xsimd responsiveness) | xsimd upstream or Milvus fork/patch | Critical |
| Functional | Audit/upgrade stale-pinned deps (RocksDB, jemalloc, oneTBB) | 2-4 | Upstream Milvus / contributor | High |
| Functional | Resolve Folly GCC14+riscv64 build failure (folly#2493) | 1-2 | Folly upstream or Milvus fork/patch | High |
| Functional | First successful end-to-end riscv64 build (Go+C++ core+Rust) | 2-4 | Contributor | Critical |
| Performance | RVV kernels for bitset/minhash SIMD modules | 4-8 | Contributor with RVV expertise | Medium |
| Performance | RVV path in exec/expression SimdFilter dispatcher | 2-4 | Contributor with RVV expertise | Medium |
| CI/CD | Add riscv64 build+test CI job (GitHub Actions or Jenkins, ARM as template) | 2-3 | Upstream Milvus / contributor | High |
| CI/CD | Add `linux/riscv64` to Docker image publishing pipeline | 1 | Upstream Milvus / contributor | Medium |
| CI/CD | Establish RISE runner relationship for riscv64 CI | 1-2 (coordination) | RISE liaison | Medium |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [Milvus GitHub repository](https://github.com/milvus-io/milvus)
- [Milvus homepage](https://milvus.io/)
- [LF AI & Data Foundation project listing (Graduated status)](https://lfaidata.foundation/projects/)
- [Milvus milvus-io/milvus#32476 - ARM64 compilation problems](https://github.com/milvus-io/milvus/issues/32476)
- [Milvus milvus-io/milvus#28823 - arm64 architecture fails to run](https://github.com/milvus-io/milvus/issues/28823)
- [Milvus milvus-io/milvus#25326 - aarch64 compilation feature request](https://github.com/milvus-io/milvus/issues/25326)
- [Milvus milvus-io/milvus#29566 - IBM Power (ppc64le) support](https://github.com/milvus-io/milvus/issues/29566)
- [Milvus milvus-io/milvus#21550 - maintainer liliu-z comment pointing to knowhere for RISC-V support](https://github.com/milvus-io/milvus/issues/21550)
- [Docker Hub milvusdb/milvus tags (OS/ARCH listing)](https://hub.docker.com/r/milvusdb/milvus/tags)
- [PyPI milvus package JSON API](https://pypi.org/pypi/milvus/json)
- [Ubuntu package search - resolute suite, "milvus" keyword](https://packages.ubuntu.com/search?keywords=milvus&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port mirror (felixc.at)](https://mirrors.felixc.at/archriscv/repo/)
- [RISE Project members page](https://riseproject.dev/members/)
- [RISE Project blog post sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [zilliztech/knowhere PR #1160 - knowhere support riscv](https://github.com/zilliztech/knowhere/pull/1160)
- [zilliztech/knowhere PR #1307 - Correct target for setting RISC-V compile options](https://github.com/zilliztech/knowhere/pull/1307)
- [zilliztech/knowhere PR #1301 - Fix CMake generator expression evaluation error for RISC-V builds](https://github.com/zilliztech/knowhere/pull/1301)
- [zilliztech/knowhere PR #1396 - FEAT: Support RVV-optimized Scalar Quantizer](https://github.com/zilliztech/knowhere/pull/1396)
- [zilliztech/knowhere Issue #1587 - RVV Similarity classes missing simdwidth causes compilation failure on riscv64](https://github.com/zilliztech/knowhere/issues/1587)
- [zilliztech/knowhere PR #1586](https://github.com/zilliztech/knowhere/pull/1586)
- [zilliztech/knowhere PR #1588](https://github.com/zilliztech/knowhere/pull/1588)
- [zilliztech/knowhere PR #1613 - Optimize fp32 RVV distance kernels (closed unmerged)](https://github.com/zilliztech/knowhere/pull/1613)
- [xtensor-stack/xsimd Issue #1275 - Failing to build riscV/rvv (open)](https://github.com/xtensor-stack/xsimd/issues/1275)
- [xtensor-stack/xsimd Issue #954 - riscv64 error: 'aligned_mode' does not name a type](https://github.com/xtensor-stack/xsimd/issues/954)
- [facebook/folly Issue #2493 - Build failure with GCC 14 on riscv64 (Ubuntu 24.04)](https://github.com/facebook/folly/issues/2493)
- [facebookresearch/faiss Issue #4321 - riscv64 device build failed (closed)](https://github.com/facebookresearch/faiss/issues/4321)
- [OpenMathLib/OpenBLAS Issue #5811 - DGEMM regression produces non-PSD matrix on riscv64_zvl256b](https://github.com/OpenMathLib/OpenBLAS/issues/5811)
- [OpenMathLib/OpenBLAS Issue #4050 - RVV1.0-optimized kernel support (open)](https://github.com/OpenMathLib/OpenBLAS/issues/4050)
- [apache/arrow Issue #50862 - On riscv64, Gandiva fails at runtime (closed 2026-08-14)](https://github.com/apache/arrow/issues/50862)
- [simdjson Issue #2423 - Add RVV Optimizations](https://github.com/simdjson/simdjson/issues/2423)
- [simdjson Issue #2602 - Implement find_next_json_quotable_character for RISC-V (RVV)](https://github.com/simdjson/simdjson/issues/2602)
- [uxlfoundation/oneTBB Issue #1051 - Support RISC-V (closed 2023-03)](https://github.com/uxlfoundation/oneTBB/issues/1051)
- [libunwind Issue #765 - CMake support for RISCV (open since 2024)](https://github.com/libunwind/libunwind/issues/765)
- [jemalloc Issue #2399 - Does jemalloc support cross build for RISCV64? (open)](https://github.com/jemalloc/jemalloc/issues/2399)
- [jemalloc Issue #2323 - Add support for riscv64gc (closed 2022-08)](https://github.com/jemalloc/jemalloc/issues/2323)
- [facebook/rocksdb Issue #10500 - -march=native riscv64 build bug (fixed 2023-12)](https://github.com/facebook/rocksdb/issues/10500)
