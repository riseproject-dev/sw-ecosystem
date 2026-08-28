---
title: fleetbench
parent: Project Reports
---

# fleetbench

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for fleetbench<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[Fleetbench](https://github.com/google/fleetbench) is a C++ benchmark suite that reproduces workloads representative of Google's warehouse-scale production fleet. It was published alongside an ISPASS 2024 paper ("A Profiling-Based Benchmark Suite for Warehouse-Scale Computers," DOI: 10.1109/ISPASS61541.2024.00046). The workload categories are: protocol buffer synthesis, Swiss map (hash table), libc memory operations (memcpy/memset), TCMalloc allocation, compression (Snappy/ZSTD/Brotli/Zlib/chromium-zlib), hashing (CRC32/abseil hash), STL Cord, gRPC RPC, and SIMD (ScaNN LUT16 approximate nearest-neighbor lookup).

**Governance:** Informal. All substantial contributors are Google-affiliated (Yuying Li, Andreas Abel, Richard O'Grady, Aysylu Greenberg, Chris Kennelly, Abraham Gonzalez, Vitaly Goldshteyn). Commit messages carry `PiperOrigin-RevId:` tags confirming that development lives in Google's internal Piper monorepo; GitHub is a mirror. The README explicitly states: "not an officially supported Google product." There is no steering committee, no foundation membership, no MAINTAINERS or CODEOWNERS file.

**License:** Apache 2.0.

**Activity level:** Very low by external metrics - 32 total issues and PRs across the entire project history, 147 stars, 25 forks as of August 2026. This is a companion benchmark to a conference paper, not an actively developed community project.

**Corporate sponsor:** Google LLC. Google is a RISE Premier Member, but fleetbench itself has no direct RISE project affiliation.

**Community culture on new ports:** No public position exists. The FAQ states "The supported platforms are the same as TCMalloc's," and TCMalloc officially supports x86-64 and AArch64 only, with PPC as best-effort and RISC-V absent. A RISC-V port would require either upstream interest from Google engineers or acceptance of external contributions; neither has materialized. The project's production-fleet focus (Google runs x86-64 and ARM servers) makes upstream prioritization unlikely absent RISC-V hardware adoption in Google's own datacenters.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| - | No RISC-V commits, issues, or PRs have ever appeared in the repository | Full scan of all 32 issues/PRs; code search for "riscv", "risc-v", "__riscv" |
| - | No RISC-V build config defined in .bazelrc | Direct read of .bazelrc |
| - | No RISC-V CI job defined | Direct read of .github/workflows/ci.yaml |

There is no port history. Zero RISC-V-related commits, issues, pull requests, or documentation have ever been recorded in the [google/fleetbench](https://github.com/google/fleetbench) repository. The only architecture-specific history is for AArch64 (issues #26, #24) and ARM (issue #22), all now closed.

**Key contributors:** None have worked on RISC-V for this project. All top contributors (by commit count) are Google-affiliated; none have filed or commented on RISC-V matters in this repository.

---

## 3. Upstream Support Tier

Fleetbench has no formal tier policy document. Support is defined implicitly by the CI matrix and the TCMalloc dependency's platforms specification.

| Dimension | amd64 (x86-64) | arm64 (AArch64) | riscv64 |
|-----------|---------------|----------------|---------|
| Listed in supported platforms | Yes (Haswell+, Westmere) | Yes (Neoverse-N1) | No |
| Build config in .bazelrc | --config=haswell, --config=westmere | --config=arm | None |
| CI runner | ubuntu-latest | arm-ubuntu-arm-22.04-16core | None |
| Release-blocking | Yes (CI required to pass) | Yes (CI required to pass) | N/A |
| Official prebuilt binaries | No (source-only releases) | No (source-only releases) | No |

Releases (v2.1, v2.0.8, v2.0.7, v2.0.6, v2.0.5) contain only auto-generated GitHub source archives (zip/tar.gz). No prebuilt binaries are published for any architecture.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Fleetbench has no JIT, no garbage collector, and no cryptographic implementation. The architecture-specific surface is narrow but present.

**4.1 SIMD dispatch (ScaNN LUT16)**

The `fleetbench/simd/` benchmark wraps Google ScaNN's `LUT16Interface` for approximate nearest-neighbor lookup. ScaNN's internal dispatch covers AVX2 and AVX-512 on x86 and NEON/SVE on ARM. On any other architecture, the benchmark falls back to a scalar portable path. No RVV (RISC-V Vector) path exists in ScaNN or in fleetbench's SIMD wrapper.

The `simd_benchmark.cc` file contains one `#ifdef __x86_64__` guard for `_mm_clflush` (SSE cache-flush intrinsic). Non-x86 paths substitute a portable `std::vector<char>` dummy-fill. There is no `#ifdef __riscv` guard or RVV path anywhere in the repository.

The SIMD benchmark is clang-only (`if_clang([...])` in BUILD): without `--config=clang`, the target produces an empty binary.

**4.2 Cache flush**

Only the x86-64 `_mm_clflush` SSE intrinsic is used. riscv64 uses the scalar fallback.

**4.3 Performance counter access (libpfm4)**

The `--define=pfm=1` flag (enabled by default in .bazelrc) links libpfm4 for hardware PMU event access. On riscv64, PMU availability depends on hardware support for the RISC-V SBI PMU extension. Platforms lacking this extension will have libpfm silently non-functional at runtime [NEEDS VERIFICATION - no riscv64 runtime test data available].

**4.4 Core benchmarks (proto, tcmalloc, libc, compression, hashing, swissmap, rpc)**

All written in portable C++17 with no ISA-specific code paths in fleetbench itself. These would compile on riscv64 subject to dependency constraints (see Section 9).

**Component summary table:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| ScaNN LUT16 SIMD dispatch | AVX2/AVX-512 | NEON/SVE (via highway) | Missing (scalar fallback only) |
| Cache flush intrinsic | _mm_clflush (SSE) | scalar (vector fill) | Missing (scalar fallback) |
| Build config in .bazelrc | Full | Full | Missing |
| PMU event access (libpfm4) | Functional | Functional | Hardware-dependent, unverified |
| Proto, compression, hashing, swissmap, RPC, libc benchmarks | Scalar C++ | Scalar C++ | Scalar C++ (no arch-specific code) |

No assembly (.S) files exist anywhere in the repository. All ISA-specific code uses compiler intrinsics or C++ with `#ifdef` guards.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel exclusively. No CMakeLists.txt, no Autoconf, no Meson. No Dockerfiles anywhere in the repository.

**Bazel version:** 8.0.0 minimum (Bazelisk recommended).

**Compiler:** LLVM 17.0.1 recommended. GCC is supported for most targets; the SIMD benchmark requires clang.

**C++ standard:** C++17 required (`--cxxopt='-std=c++17'`).

**Standard build commands (from README and .bazelrc):**

```bash
# x86-64 Haswell
bazel build --config=clang --config=opt --config=haswell //fleetbench/proto:proto_benchmark

# AArch64
bazel build --config=clang --config=opt --config=arm //fleetbench/proto:proto_benchmark

# Run with rseq disabled (required for TCMalloc)
GLIBC_TUNABLES=glibc.pthread.rseq=0 bazel-bin/fleetbench/proto/proto_benchmark
```

**Architecture configs in .bazelrc:**
- `--config=haswell`: `-march=haswell -m64 -maes -mprefer-vector-width=128`
- `--config=westmere`: `-march=westmere -m64 -maes -mcx16 -mpclmul -mprefer-vector-width=128 -msse4.2`
- `--config=arm`: `-march=armv8-a -mcpu=neoverse-n1 -mtune=neoverse-v2`
- **No `--config=riscv64` exists.**

Default: `build --copt='-march=native'` (overridable via `--copt`).

**Hypothetical riscv64 native build (no official support):**

```bash
# Portable benchmarks only, override TCMalloc with system malloc
bazel build --config=opt \
  --copt='-march=rv64gc' \
  --custom_malloc="@bazel_tools//tools/cpp:malloc" \
  //fleetbench/proto:proto_benchmark

# SIMD benchmark will produce an empty binary unless clang supports target RVV intrinsics
# ScaNN LUT16 has no RVV path; SIMD results would be scalar-only
```

**Cross-compilation:** No cross-compilation toolchain files exist. No QEMU usage anywhere in the repository. No Docker images provided.

**Known build blockers for riscv64:**
- No `--config=riscv64` in .bazelrc; must supply `-march` manually.
- TCMalloc (the default allocator linked by the tcmalloc benchmark) is officially unsupported on riscv64 and has an explicit unsupported marker in `segv_handler.cc`. Overriding with system malloc (`--custom_malloc`) is required to avoid build or runtime failure in TCMalloc benchmarks.
- protobuf: no prebuilt `protoc` binary for riscv64; must build from source with cross-compilation toolchain.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| SIMD/vector acceleration (ScaNN LUT16) | AVX2, AVX-512 dispatch | NEON/SVE via highway | Not implemented (scalar fallback) |
| TCMalloc allocation benchmark (full fidelity) | Full per-CPU RSEQ slab | Full per-CPU RSEQ slab | Per-thread cache only (RSEQ missing) |
| Cache flush benchmark | _mm_clflush hardware flush | Scalar dummy write | Scalar dummy write |
| PMU event counters (libpfm4) | Functional | Functional | Hardware-dependent |
| Build config support | --config=haswell, --config=westmere | --config=arm | None |

**Performance gaps (expected, not measured - no benchmark data exists for riscv64):**
- ScaNN LUT16 SIMD benchmark: scalar path vs AVX2/AVX-512 represents a large gap but is unmeasured.
- TCMalloc benchmark: per-thread-only allocator on riscv64 carries an estimated 5-15% throughput regression in high-concurrency scenarios vs the per-CPU RSEQ path on x86 and AArch64. This figure comes from TCMalloc documentation, not from a fleetbench run on riscv64.

**Floating-point / NaN semantics:** Not applicable. Fleetbench benchmarks do not involve floating-point computation semantics (no numerics workloads, no precision-sensitive paths identified).

**Security hardening:** The build uses `-D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_FAST` (LLVM libcpp bounds checking). This is portable and applies equally to riscv64 if clang is used.

**Data not available:** Measured performance comparison between riscv64 and arm64 or amd64 on any fleetbench workload. No published results exist anywhere.

---

## 7. CI/CD Infrastructure

**CI system:** GitHub Actions only. No GitLab CI, no Jenkins, no Cirrus CI.

**CI matrix (from `.github/workflows/ci.yaml`, direct file read):**

```yaml
os: [ubuntu-latest, arm-ubuntu-arm-22.04-16core]
```

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI runner | ubuntu-latest (GitHub-hosted) | arm-ubuntu-arm-22.04-16core (GitHub-hosted) | None |
| Trigger | push, pull_request to main | push, pull_request to main | N/A |
| Build action | bazel build + bazel test | bazel build + bazel test | N/A |
| QEMU emulation | No | No | No |
| Compiler variants tested | clang-latest, gcc-latest | clang-latest | N/A |

The string "riscv" does not appear anywhere in `ci.yaml` or `update.yml`. There is no QEMU step, no cross-compilation step, and no riscv64 runner anywhere in the repository.

**RISE CI runners:** Not used by fleetbench.

**CI scripts in `ci/` directory:** `linux_clang-latest_libcxx_bazel.sh`, `linux_gcc-latest_libstdcxx_bazel.sh`, `linux_arm_clang-latest_libcxx_bazel.sh`. No riscv64 script exists.

---

## 8. Distribution and Release Status

Fleetbench publishes source-only releases. No binary artifacts are produced for any architecture.

| Distribution channel | riscv64 status |
|---------------------|---------------|
| GitHub Releases (v2.1, v2.0.8, ...) | Source archives only (zip/tar.gz); zero binary assets for any architecture |
| PyPI | HTTP 404 - package does not exist |
| Debian | HTTP 404 - not in Debian package tracker, any suite |
| Ubuntu 24.04 Noble | Not packaged |
| Arch Linux RISC-V (archriscv.felixc.at) | Not found |
| OCI / container image | None found |

**To obtain a working binary on riscv64:** Build from source using Bazel 8.0.0 on native riscv64 hardware or via cross-compilation. No official guidance or toolchain configuration is provided. The user must: (1) supply `-march=rv64gc` manually via `--copt`, (2) override TCMalloc with system malloc for the TCMalloc benchmarks, (3) build protobuf `protoc` from source, and (4) accept that the SIMD benchmark will produce scalar-only results.

---

## 9. Dependencies

### Summary table

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|-----------|------|--------------|-------------|----------------|----------------|
| tcmalloc 0.0.0-20250927 | Memory allocator; all allocation benchmarks | Compiles (generic fallback) | Not run | None | RSEQ/per-CPU slab absent; segv_handler.cc explicitly unsupported |
| highway 1.2.0 | SIMD abstraction for ScaNN LUT16 | Builds (RVV 1.0 intrinsics present) | No riscv64 CI | No binary | Issue #2854 (mold linker); PR #3148 (add riscv64 CI) blocked on CLA |
| abseil-cpp 20260107.1 | Strings, hash, containers, sync | Builds | Two SEGFAULT failures on Debian riscv64 (issue #2002, open) | None | Issue #2002 (GCC 15.2 SEGFAULT); issue #1702 (-latomic undefined refs in shared-lib builds) |
| protobuf 33.0 | Proto serialization; RPC benchmarks | Builds | No riscv64 CI | None | No prebuilt protoc; maintainer stance: unsupported, off-roadmap (2024, 2025) |
| grpc 1.80.0 | RPC framework; fleetbench/rpc/ benchmarks | Builds (portable C fallback) | No riscv64 CI | None | Issue #41591 (riscv64 Python wheel, no activity); issue #36112 (Cython build, openSUSE, effectively unresolved upstream) |
| brotli 1.2.0 | Compression benchmark | Builds | Scalar path tested by distros | Available in distros | PR #1410 (RVV FindMatchLengthWithLimit) - CLA unsigned, no review since Dec 2025 |
| snappy 1.2.2 | Compression benchmark | Builds; RVV optimizations merged 2025 | QEMU-based riscv64 CI running upstream | Available in distros | None blocking |
| zstd 1.4.5 (pinned) | Compression benchmark | Builds (pinned version predates riscv64 CI) | No riscv64 CI for this version | Available in distros (newer versions) | Pinned to 2020 release; all upstream riscv64 improvements unreachable |
| google/benchmark 1.9.5 | Benchmark harness | Builds; RDTIME fix (PR #1727) | No riscv64 CI upstream | Available in distros | No blocking issues |
| re2 2025-11-05 | Regex engine | Builds (pure C++) | No riscv64-specific issues found | Available in distros | None identified |
| ScaNN (pinned commit 084accd) | ANN search / SIMD LUT | Unclear; falls through to highway scalar/RVV | No riscv64 CI | None | No RVV path; heavy AVX-512-specific code paths |
| LLVM libc (pinned 2023 commit e002a38) | libc replacement benchmarks | Stale 2023 pin; riscv64 coverage uncertain | No riscv64 CI for pinned snapshot | N/A | LLVM issues #80792 (riscv64 miscompile) and #216580 (LSan false-leaks) in upstream LLVM |
| libpfm4 4.13.0 | PMU event access | Builds | Not tested on riscv64 | Available in distros | Runtime depends on SBI PMU extension availability on hardware |
| libzip 1.10.1 | Zip compression | Builds (pure C) | No riscv64-specific issues | Available in distros | None |
| chromium/zlib (pinned snapshot 7eda07b) | Deflate/zlib compression | Builds (scalar fallback) | No riscv64 CI for snapshot | N/A | PCLMUL/SSE4.2 SIMD paths not available; scalar fallback only |
| numactl 2.0.19 | NUMA topology, thread pinning | Builds | No riscv64-specific issues | Available in distros | NUMA largely irrelevant on current riscv64 hardware |

### Critical dependency deep-dives

**tcmalloc (blocking):** The default memory allocator for all fleetbench allocation benchmarks. The `segv_handler.cc` file explicitly marks `__riscv` as "NOT (yet) supported." No `percpu_rseq_riscv.S` file exists, so the per-CPU RSEQ fast-path is unavailable. All allocation benchmarks will run on the per-thread-cache path only, degrading throughput by an estimated 5-15% in high-concurrency scenarios compared to x86-64 and AArch64. No upstream tracking issue exists for riscv64 support. Full analysis in the tcmalloc report.

**abseil-cpp (reliability risk):** Two open riscv64 issues. Issue #2002: SEGFAULT in `hashtablez_sampler_test` and `cordz_sample_token_test` on Debian riscv64 with GCC 15.2 - these are test-level failures, not production crashes. Abseil recommends `-DABSL_BUILD_TESTING=OFF` as a workaround. Issue #1702: undefined `__atomic_compare_exchange_1` / `__atomic_exchange_1` when building shared libraries with GCC 11-12 cross-toolchain; static linking avoids this. CRC32C hardware acceleration PR #1986 is blocked waiting for Google to acquire RISC-V hardware for testing.

**protobuf (toolchain blocker):** No prebuilt `protoc` binary for riscv64. Google maintainers explicitly stated in August 2024 and August 2025 that riscv64 is unsupported and off-roadmap. PR #23205 (prebuilt protoc for riscv64) was closed due to an unsigned CLA. Building protobuf from source on riscv64 requires a working cross-compilation toolchain.

**zstd (version pin issue):** Fleetbench pins zstd v1.4.5 (released 2020), predating all upstream riscv64 CI additions (added July 2025 in the 1.5.x line via PR #4435 with QEMU vlen=128/256/512). The pinned version has known riscv64 contrib-build failures. Upgrading to a current release would resolve this but requires fleetbench maintainer action.

**highway (SIMD quality):** Highway 1.2.0 has RVV 1.0 support (`hwy/ops/rvv-inl.h`, full API surface implemented). Open issue #2854: mold linker corrupts `.riscv.attributes` ISA string on riscv64 (cosmetic, not a correctness issue). PR #3148 (add riscv64 to highway's CI) was opened June 2026 but is blocked on a CLA signature from the contributor. Without riscv64 CI, highway regressions go undetected.

---

## 11. Known Bugs and Active Issues

**Open issues with architecture relevance (none are RISC-V):**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| #26 | Proto fails with segfault on AArch64 | Closed | Was high | Fixed; AArch64 only |
| #24 | Build failure in ARM64 Ubuntu (Go toolchain arch) | Closed | Was medium | Fixed; ARM64 only |
| #22 | Build failure with gcc on arm | Closed | Was medium | Fixed; ARM only |

**All 7 currently open issues** (#30, #25, #20, #13, #10, #3, #2) are feature requests or build questions with no architecture-specific content. None involve RISC-V, floating-point correctness, or NaN semantics.

**Dependency-level correctness issues affecting riscv64 fleetbench runs:**

| Dep | Issue | Status | Severity |
|-----|-------|--------|----------|
| abseil-cpp | #2002: SEGFAULT in sampler/cordz tests (Debian riscv64, GCC 15.2) | Open | Medium (test-only; production code path unaffected) |
| abseil-cpp | #1702: -latomic undefined refs with GCC 11-12 cross-toolchain shared libs | Open | Medium (static linking workaround available) |
| highway | #2854: mold linker corrupts .riscv.attributes ISA string | Open | Low (cosmetic) |
| grpc | #41591: riscv64 Python wheel missing | Open | Low (no Python surface in fleetbench) |
| protobuf | No prebuilt protoc for riscv64 | No tracking issue | High (blocks Bazel build bootstrapping) |

---

## 12. Objections and Upstream Blockers

**Organizational blockers:**

1. Google's production fleet uses x86-64 and AArch64. Fleetbench's stated purpose is to benchmark workloads representative of this specific fleet. There is no organizational motivation for Google engineers to enable riscv64 until riscv64 servers are present in Google's production infrastructure.

2. The project is a conference paper companion, not a community product. The README disclaimer ("not an officially supported Google product") signals minimal maintainer availability for external contributions.

3. The primary dependency, TCMalloc, explicitly marks riscv64 as unsupported. The allocation benchmarks - a core fleetbench workload category - cannot provide full-fidelity results on riscv64 without TCMalloc per-CPU support landing first.

**Technical blockers (in priority order):**

1. No `--config=riscv64` in .bazelrc - trivial to add but requires a submitted PR accepted by Google maintainers.
2. TCMalloc riscv64 per-CPU RSEQ path missing (`percpu_rseq_riscv.S` absent) - non-trivial kernel and library work.
3. No prebuilt `protoc` for riscv64 - requires either Bazel cross-compilation toolchain setup or protobuf upstream action.
4. ScaNN LUT16 has no RVV path - the SIMD benchmark will produce scalar-only numbers, which are not representative of what riscv64 hardware can achieve with RVV.
5. zstd pinned to v1.4.5 (2020) - upstream riscv64 improvements in 1.5.x are inaccessible without a dependency version bump.

**Acceptance probability:** Low for upstream Google maintainers acting on riscv64 work without external pressure or hardware adoption. Contributions are technically feasible but face organizational indifference. The most realistic path is a maintained fork or out-of-tree CI that patches the Bazel config and pins updated dependency versions.

---

## 13. Investment Analysis

RISE has no prior investment in fleetbench. No RISE blog posts, RFPs, or project descriptions mention fleetbench. All work described below is net new.

### 13.1 Functional Enablement

Minimum work to get fleetbench building and running portable benchmarks on riscv64:
- Add `--config=riscv64` to .bazelrc with appropriate `-march` flags.
- Add a `clang_or_gcc_riscv64` config group to `fleetbench/BUILD` mirroring the existing arm64 pattern.
- Document the `--custom_malloc` override for TCMalloc benchmarks pending full TCMalloc riscv64 support.
- Resolve protobuf `protoc` bootstrapping on riscv64 (either wait on protobuf upstream or use a pre-staged protoc binary).
- Address abseil-cpp issue #1702 (static linking workaround or upstream fix) to ensure clean builds.

The core benchmarks (proto, compression, hashing, swissmap, RPC, libc) are portable C++ and should function once build configuration and dependency blockers are cleared.

### 13.2 Performance Optimization

For results to be comparable to arm64 and amd64:
- **TCMalloc RSEQ per-CPU slab on riscv64:** Required for meaningful TCMalloc benchmark numbers. This is the highest-value work but lives entirely in the TCMalloc repository, not in fleetbench itself. See the TCMalloc report for scope.
- **ScaNN LUT16 RVV path:** Adding a RISC-V Vector implementation of the LUT16 lookup-and-accumulate kernel to ScaNN (or an equivalent path via Google Highway RVV). This is a significant implementation effort in the google-research/ScaNN codebase.
- **Brotli RVV `FindMatchLengthWithLimit`:** PR #1410 exists in the brotli repository but has no CLA. Could be landed with CLA-cleared contributor effort.
- **zstd version bump:** Update the pinned `http_archive` from v1.4.5 to a current release to access upstream RVV optimizations and riscv64 CI.

### 13.3 CI/CD Infrastructure

- Add a riscv64 CI job to `.github/workflows/ci.yaml`, either via a QEMU step on an existing GitHub-hosted runner or via a native riscv64 runner (RISE or other).
- The SIMD benchmark job requires hardware with RVV support for meaningful results; QEMU with `vlen=512` is sufficient for correctness testing.
- Add a `ci/linux_riscv64_clang-latest_libcxx_bazel.sh` script mirroring the existing arm script.

### 13.4 Ecosystem Enablement

Not applicable. Fleetbench has no package ecosystem, no plugin architecture, and no downstream consumers that require independent enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Add --config=riscv64 to .bazelrc and BUILD config group | 0.5 | Contributor + Google review | Critical |
| Functional | Resolve protobuf protoc bootstrapping on riscv64 | 1 | Contributor (depends on protobuf upstream) | Critical |
| Functional | Abseil-cpp issue #1702 static linking / upstream fix | 1 | RISE or contributor | High |
| Functional | Bump zstd pin from v1.4.5 to current release | 0.5 | Contributor | High |
| CI/CD | Add riscv64 QEMU CI job to ci.yaml | 1 | Contributor | High |
| Performance | TCMalloc per-CPU RSEQ slab for riscv64 | 8-12 | RISE (see TCMalloc report) | High |
| Performance | ScaNN LUT16 RVV kernel implementation | 6-10 | RISE or hardware vendor | Medium |
| Performance | Brotli RVV FindMatchLengthWithLimit (land PR #1410) | 2 | RISE (CLA + upstream review) | Low |
| Performance | Highway riscv64 CI (land PR #3148) | 1 | RISE (CLA resolution) | Medium |

**Total functional enablement (build + basic CI):** approximately 4 person-weeks, with the protobuf bootstrapping item dependent on work outside fleetbench.

**Total for full-fidelity riscv64 benchmark results** (matching arm64 coverage): approximately 20-26 person-weeks, dominated by TCMalloc RSEQ and ScaNN RVV work that lives in upstream repositories rather than in fleetbench itself.

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [google/fleetbench repository](https://github.com/google/fleetbench)
- [fleetbench CI configuration (.github/workflows/ci.yaml)](https://github.com/google/fleetbench/blob/main/.github/workflows/ci.yaml)
- [fleetbench .bazelrc](https://github.com/google/fleetbench/blob/main/.bazelrc)
- [fleetbench README](https://github.com/google/fleetbench/blob/main/README.md)
- [fleetbench SIMD benchmark (simd_benchmark.cc)](https://github.com/google/fleetbench/blob/main/fleetbench/simd/simd_benchmark.cc)
- [fleetbench issue tracker](https://github.com/google/fleetbench/issues)
- [ISPASS 2024 paper DOI: 10.1109/ISPASS61541.2024.00046](https://doi.org/10.1109/ISPASS61541.2024.00046)
- [TCMalloc platforms documentation](https://github.com/google/tcmalloc/blob/master/docs/platforms.md)
- [abseil-cpp issue #2002 (SEGFAULT on Debian riscv64)](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp issue #1702 (-latomic undefined refs, riscv64 cross-toolchain)](https://github.com/abseil/abseil-cpp/issues/1702)
- [highway issue #2854 (mold linker riscv64)](https://github.com/google/highway/issues/2854)
- [highway PR #3148 (add riscv64 CI)](https://github.com/google/highway/pull/3148)
- [brotli PR #1410 (RVV FindMatchLengthWithLimit)](https://github.com/google/brotli/pull/1410)
- [zstd PR #4435 (RVV CI, QEMU vlen=128/256/512)](https://github.com/facebook/zstd/pull/4435)
- [grpc issue #41591 (riscv64 Python wheel)](https://github.com/grpc/grpc/issues/41591)
- [protobuf PR #23205 (prebuilt protoc for riscv64, closed)](https://github.com/protocolbuffers/protobuf/pull/23205)
- [google/benchmark PR #1727 (RDTIME for riscv64)](https://github.com/google/benchmark/pull/1727)
- [snappy riscv64-qemu-test.yaml CI workflow](https://github.com/google/snappy/blob/main/.github/workflows/riscv64-qemu-test.yaml)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/)
- [RISE Project member list](https://riseproject.dev/members/)