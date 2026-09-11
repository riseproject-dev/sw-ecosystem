---
title: ClickHouse
parent: Project Reports
color: yellow
dependencies:
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: Boost
    relation: build-dependency
    criticality: critical
  - name: Rust
    relation: build-dependency
    criticality: critical
  - name: BLAKE3
    relation: build-dependency
    criticality: critical
  - name: simdjson
    relation: runtime-dependency
    criticality: critical
  - name: Wasmtime
    relation: runtime-dependency
    criticality: optional
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
---

# ClickHouse

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for ClickHouse<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

{% include dependency-graph.html slug="dependencies" subset="clickhouse" %}

## 1. Project Overview

ClickHouse is an open-source, column-oriented OLAP database server written in C++. It is licensed under Apache 2.0 and governed as a single-vendor project: there is no neutral foundation, no CODEOWNERS/MAINTAINERS file, and SECURITY.md/README refer generically to "ClickHouse maintainers," who are ClickHouse, Inc. employees (the company spun out of Yandex in 2021). ClickHouse is not a member of the Linux Foundation, CNCF, Apache Software Foundation, or RISE.

The RISC-V port is not vendor-sponsored: nearly every RISC-V-related commit is authored or merged by founder/CTO Alexey Milovidov, with secondary contributions from Azat Khuzhin and Alexander Gololobov. No silicon-vendor engineers (SiFive, Alibaba, etc.) appear among RISC-V commit authors. The project has an informal, maintainer-driven governance culture (evidenced by its own `AI_POLICY.md` on AI-generated contributions) that is pragmatic about accepting new-architecture PRs without requiring a dedicated platform team or corporate sponsor.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-10-16/17 | [PR #30298](https://github.com/ClickHouse/ClickHouse/pull/30298) "Add RISC-V build" merged - author's own words: "does not work (requires changes in several libraries) but will definitely help one of my friends for tinkering with his SiFive board" | GitHub PR |
| 2021-11-11/12 | [PR #31309](https://github.com/ClickHouse/ClickHouse/pull/31309) "Initial support for risc-v" merged - server runs on real hardware, but stack traces are empty and lld lacked RISC-V relaxation support (`R_RISCV_ALIGN`) | GitHub PR |
| 2021-11-13 | [PR #31398](https://github.com/ClickHouse/ClickHouse/pull/31398) "Add Linux RISC-V 64 build to CI" opened | GitHub PR |
| 2022-08-11/15 | [Issue #40141](https://github.com/ClickHouse/ClickHouse/issues/40141) "Failed to build for RISC-V" - stale Boost conflict markers plus the same lld `R_RISCV_ALIGN` relaxation gap flagged in #31309 | GitHub Issue |
| 2022-08-14 | [PR #40197](https://github.com/ClickHouse/ClickHouse/pull/40197) "Set linker for RISC-V 64" merged, unblocking #31398 | GitHub PR |
| 2023-07-06 | [PR #31398](https://github.com/ClickHouse/ClickHouse/pull/31398) finally merged - a 20-month gap explained entirely by the linker-support blocker; azat reports post-merge SIGSEGV under QEMU (jemalloc-related) | GitHub PR |
| 2023-06-02 | [PR #50457](https://github.com/ClickHouse/ClickHouse/pull/50457) fixes [Issue #50456](https://github.com/ClickHouse/ClickHouse/issues/50456) "Linux 6.1.22 on RISC-V failed to support TaskStats interface" - a runtime, not just build, bug | GitHub Issue/PR |
| 2023-08-20 | [PR #38217](https://github.com/ClickHouse/ClickHouse/pull/38217) "Enable JIT compilation for AArch64, PowerPC, SystemZ, RISCV" merged | GitHub PR |
| 2024-02-25 | [Issue #60381](https://github.com/ClickHouse/ClickHouse/issues/60381) "cross-compile for risc-v error" (`__stack_chk_guard@@GLIBC_2.27` undefined symbol), closed same day | GitHub Issue |
| 2026-02-17 | [PR #97158](https://github.com/ClickHouse/ClickHouse/pull/97158) fixes riscv64 (with s390x/ppc64le/loongarch64) cross-compile breakage caused by an unrelated PGO+BOLT toolchain change | GitHub PR |
| 2026-08-28 | [PR #115316](https://github.com/ClickHouse/ClickHouse/pull/115316) removes WasmEdge for Wasmtime - explicitly disables WASM UDFs on riscv64 because Wasmtime is unbuildable there | GitHub PR |
| 2026-09-09/10 | [PR #117449](https://github.com/ClickHouse/ClickHouse/pull/117449) (PIE binaries / stack trace offsets) merged then reverted the next day via [PR #119279](https://github.com/ClickHouse/ClickHouse/pull/119279) because it broke master | GitHub PR |
| 2026-09-09 (open) | [PR #119049](https://github.com/ClickHouse/ClickHouse/pull/119049) rebuilds the riscv64 sysroot from Debian 13, still open as of 2026-09-11 | GitHub PR |
| 2026-09-10 (open) | [PR #119122](https://github.com/ClickHouse/ClickHouse/pull/119122) notes simdjson's scalar fallback (used on riscv64 without RVV) still needs a UTF-8 correctness fix | GitHub PR |

All 16 riscv64-related PRs identified are merged (0 open-unmerged, 0 closed-without-merging), though one (#117449) was reverted the day after merging. There is no dedicated master tracking issue; the effort is tracked implicitly through the recurring `docs/.../build-cross-riscv.mdx` doc updates and a chain of individual fix PRs. Key contributors: Alexey Milovidov (ClickHouse, Inc., founder/CTO), Azat Khuzhin (ClickHouse, Inc.), Alexander Gololobov (ClickHouse, Inc.), and, from late 2024 onward, Konstantin Bogdanov (ClickHouse, Inc.) driving a renewed wave of s390x/ppc64le/riscv64/loongarch64 cross-platform fixes continuing through September 2026. The port is fully upstream (no fork or downstream patch set required to build it).

## 3. Upstream Support Tier

Official docs state explicitly: **"ClickHouse has experimental support for RISC-V. Not all features can be enabled."** ([build-cross-riscv.mdx](https://github.com/ClickHouse/ClickHouse/blob/master/docs/resources/develop-contribute/build/build-cross-riscv.mdx)). riscv64 is not listed among ClickHouse's officially supported production platforms per clickhouse.com/support/platforms. `cmake/target.cmake` labels the RISC-V branch "RISC-V support is preliminary" in-code.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | yes | yes | yes (cross-compiled) |
| CI test execution | yes (dozens of stateless/stress/integration jobs) | yes | **no** (`ENABLE_TESTS=0` set explicitly) |
| Release-blocking | yes | yes | no test gate; build gate only |
| Official release binaries | yes (deb/rpm/tgz) | yes (deb/rpm/tgz) | **none found** on the GitHub releases page (10 most recent releases checked) |
| Features force-disabled | none | none | LDAP, Parquet, gRPC, HDFS, MySQL client, Rust (and thus BLAKE3/prql-dependent features) |
| Documented status | fully supported | fully supported | "experimental...not all features can be enabled" |

## 4. Technical Architecture and RISC-V-Specific Subsystems

**Bottom line:** riscv64 support is real and functional but has essentially no RISC-V-specific optimization work. There is no `arch/riscv/` directory, no RVV intrinsics anywhere in ClickHouse's own source (`vfloat32m1_t`: 0 hits; `rvv`: 0 genuine hits, only substring false positives), and no ClickHouse-authored SIMD dispatch or JIT backend for riscv64.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT (embedded LLVM compiled expressions) | full LLVM x86 backend | full LLVM AArch64 backend | LLVM's stock RISCV backend is built in via the vendored `contrib/llvm-project-cmake` (`sources/LLVMRISCV.cmake`, includes `RISCVInsertVSETVLI`, `RISCVGatherScatterLowering`, `RISCVVLOptimizer` passes), but this is upstream LLVM codegen, not ClickHouse-tuned |
| SIMD-dispatched random number generation (`FunctionsRandom.cpp`) | AES-NI accelerated path | NEON accelerated path | **explicit scalar/non-vectorized LCG fallback - no SIMD branch at all** |
| Crypto (OpenSSL, vendored) | full ASM (AES-NI, SHA-NI) | full ASM (NEON crypto) | `OPENSSL_NO_ASM=ON` is forced for riscv64 builds despite a complete riscv64 OpenSSL ASM path existing upstream (Zkn/Zvkb/Zvkg/Zvkned/Zvbc/Zvksed generators present in `contrib/openssl-cmake/asm/generate_asm.sh`, unused by default) |
| Stack unwinding (`StackTrace.cpp`) | native | native | `#elif defined(__riscv)` reads PC from `context.uc_mcontext.__gregs[REG_PC]` - functional, hand-written, not vectorized |
| Fiber context switch (Boost.Context, vendored) | ASM | ASM | vendored `jump_riscv64_sysv_elf_gas.S` / `make_riscv64_sysv_elf_gas.S` / `ontop_riscv64_sysv_elf_gas.S` - upstream Boost code, not ClickHouse-authored |
| VLEN (vector length) probe (OpenSSL, vendored) | N/A | N/A | `contrib/openssl-cmake/asm/crypto/riscv64cpuid.S` reads CSR `0xc22` (`vlenb`) - the only place ClickHouse's build touches RVV at all, and it issues no vector instructions |
| Allocator (jemalloc) | full | full | compiles and runs; riscv64 (with aarch64, ppc64le) documented as using jemalloc 64 KiB pages (`AsynchronousMetrics.cpp`) - no riscv64-specific tuning found |
| Portable syscall/ABI shims | native | native | correct but generic: `__NR_renameat2=276`, `SYS_pidfd_open=434`, `SYS_preadv2=286`, `GLIBC_SYMVER "GLIBC_2.27"` for `.symver` interposition - functional plumbing, not performance work |

## 5. Build System, Cross-Compilation, and Toolchain

Official documented commands ([build-cross-riscv.mdx](https://github.com/ClickHouse/ClickHouse/blob/master/docs/resources/develop-contribute/build/build-cross-riscv.mdx)):
```
cmake . -Bbuild-riscv64 -G Ninja \
  -DCMAKE_TOOLCHAIN_FILE=cmake/linux/toolchain-riscv64.cmake \
  -DGLIBC_COMPATIBILITY=OFF -DENABLE_LDAP=OFF -DOPENSSL_NO_ASM=ON \
  -DENABLE_JEMALLOC=ON -DENABLE_PARQUET=OFF -DENABLE_GRPC=OFF \
  -DENABLE_HDFS=OFF -DENABLE_MYSQL=OFF
ninja -C build-riscv64
```
These flags are also enforced automatically in `cmake/target.cmake` when cross-compiling for `ARCH_RISCV64`, plus `ENABLE_RUST=OFF` (commented: "It might be ok, but we need to update 'sysroot'") which the public doc omits.

CI's actual invocation (`ci/jobs/build_clickhouse.py`, `BuildTypes.RISCV64`) uses `-DCMAKE_TOOLCHAIN_FILE=cmake/linux/toolchain-riscv64.cmake` with `-DENABLE_TESTS=0` explicitly set. The toolchain file (`cmake/linux/toolchain-riscv64.cmake`) targets `riscv64-linux-gnu`, sources a sysroot from the `contrib/sysroot` submodule (`linux-riscv64` subdir), and forces `-fuse-ld=lld`.

**Compiler requirements:** Clang only (GCC is explicitly rejected: `message(FATAL_ERROR "Compiler ... is not supported. Please switch to Clang")`), minimum Clang 21 (`cmake/tools.cmake`, `CLANG_MINIMUM_VERSION`), CI actually uses Clang 22. Linker must be LLD (gold explicitly rejected). CMake minimum 3.25 project-wide. `cmake/block_build_time_checks.cmake` disables all CMake feature-probing project-wide on the premise that the toolchain is fixed and known statically.

**No dedicated riscv64 Dockerfile exists** - builds reuse the generic `clickhouse/fasttest`/`clickhouse/binary-builder` image chain, which additionally registers `rustup target add riscv64gc-unknown-linux-gnu` (unused today since `ENABLE_RUST=OFF` for riscv64).

**QEMU:** `qemu-user-static` is present in the stateless-test Docker image, but a repo-wide grep of `ci/`, `tests/`, `utils/` for `qemu` found zero matches tying it to riscv64 execution. No CI job runs the cross-compiled riscv64 binary at all, under QEMU or otherwise.

**Known build failures, all resolved:** [Issue #40141](https://github.com/ClickHouse/ClickHouse/issues/40141) (Boost asm conflict markers; `R_RISCV_ALIGN` relocation error requiring `-mno-relax`), [Issue #60381](https://github.com/ClickHouse/ClickHouse/issues/60381) (`__stack_chk_guard@@GLIBC_2.27` undefined symbol), [Issue #50456](https://github.com/ClickHouse/ClickHouse/issues/50456) (TaskStats interface unsupported on RISC-V kernel 6.1.22, a runtime not build bug).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| LDAP auth | on | on | **off** (forced) |
| Parquet | on | on | **off** (forced) |
| gRPC | on | on | **off** (forced) |
| HDFS | on | on | **off** (forced) |
| MySQL client integration | on | on | **off** (forced) |
| Rust-backed components (BLAKE3, prql) | on | on | **off** (`ENABLE_RUST=OFF`, sysroot needs updating per code comment) |
| WASM UDFs (Wasmtime) | on | on | **off** ([PR #115316](https://github.com/ClickHouse/ClickHouse/pull/115316): "wasmtime unbuildable there") |
| glibc backward-compat shim (`GLIBC_COMPATIBILITY`) | on | on | **off** (forced) |
| OpenSSL hardware crypto ASM | on | on | **off** (`OPENSSL_NO_ASM=ON` forced, despite a complete riscv64 ASM path existing upstream) |
| Test suite execution in CI | full (stateless/stress/integration) | full | **none** |
| Universal installer | full | full | partial - `clickhousectl` silently skipped, no prebuilt artifact ([PR #105399](https://github.com/ClickHouse/ClickHouse/pull/105399)) |

**Functional gaps:** six major integrations (LDAP, Parquet, gRPC, HDFS, MySQL, Rust-backed BLAKE3/prql features) and WASM UDFs are unavailable on riscv64 by build configuration, not by incidental bug.

**Security hardening gap:** `OPENSSL_NO_ASM=ON` disables OpenSSL's hardware-accelerated (and, per the dependency deep-dive in Section 9, in some cases constant-time) crypto paths on riscv64, meaning riscv64 builds run OpenSSL's portable C fallback.

**Performance gap:** `FunctionsRandom.cpp` documents riscv64 routed to the scalar, non-SIMD LCG path (vs AES-NI/NEON on amd64/arm64) - the one place in the codebase where a SIMD-dispatch decision explicitly names riscv64 and gives it nothing.

**NaN/floating-point:** No RISC-V-specific NaN or floating-point semantics bug was found in issue search ("riscv nan floating" returned only the two closed build issues, #40141 and #60381). Data not available beyond that: no distinct floating-point correctness report exists.

## 7. CI/CD Infrastructure

riscv64 CI exists, confirmed by direct inspection of `.github/workflows/master.yml` and `.github/workflows/pull_request.yml` (both auto-generated by "praktika," dispatching into Python config under `ci/`).

- **Trigger:** `master.yml` runs `build_riscv64` on every push to `master`; `pull_request.yml` runs it on every PR targeting `master`. No label gate, no opt-in.
- **Runner:** `runs-on: [self-hosted, arm-large]` (master) / `[self-hosted, pr-arm-large]` (PR) - **an ARM64 host cross-compiling to riscv64**, confirmed in `ci/defs/job_configs.py` (`Job.ParamSet(parameter=BuildTypes.RISCV64, ..., runs_on=RunnerLabels.ARM_LARGE)`). Not a native riscv64 runner, not QEMU emulation for the build step itself.
- **What runs:** `python3 -m praktika run 'Build (riscv64)' --workflow "MasterCI"/"PR" --ci --timestamp`, which invokes the cmake command in Section 5 with `-DENABLE_TESTS=0`. No stateless/stress/integration test jobs exist for riscv64, unlike the dozens present for amd64/arm64.
- No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist anywhere in the repository.
- No use of RISE RISC-V runners was found; the ARM64-to-riscv64 cross-compile hosts are ClickHouse's own self-hosted infrastructure.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | yes | yes | yes (cross-compiled on ARM64 host) |
| CI runs tests | yes | yes | **no** |
| Native/QEMU execution in CI | native | native | **none** |
| Release-blocking | yes | yes | build-only, non-blocking for tests |

## 8. Distribution and Release Status

**No official riscv64 release binaries.** The GitHub releases page (10 most recent releases checked, v26.3.33.24-lts down to v26.3.27.3-lts, dated Sept 1-9 2026) lists only `clickhouse-client-*-amd64.tgz`, `clickhouse-client-*-arm64.tgz`, RPMs for aarch64/x86_64, and DEBs for amd64/arm64. "riscv64"/"riscv" does not appear anywhere on the page.

**Distro packaging:** ClickHouse the database server is **not packaged in the Ubuntu 26.04 (resolute) archive at all** - upstream ships via its own APT repository rather than Debian/Ubuntu main/universe. The only riscv64 hits in the Ubuntu 26.04 search for "ClickHouse" are `python3-clickhouse-driver` (a pure-Python client library, archs amd64/arm64/armhf/ppc64el/riscv64/s390x) and `rsyslog-clickhouse` (an rsyslog output plugin, riscv64 available via the ports archive) - neither is the server itself.

**PyPI:** the `clickhouse` PyPI project (`clickhouse-0.1.7.tar.gz`) is an unrelated third-party client wrapper (Py2.7/3.4, maintainer `ppodolsky`), architecture-independent, not the server.

**To get a working riscv64 binary today**, a user must cross-compile from source on an ARM64 (or presumably x86_64/other) host using the documented toolchain in Section 5 - there is no upstream-published artifact to download, and no distro packages the server for riscv64.

## 9. Dependencies

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| LLVM | build-dependency, critical (JIT/embedded compiler) | yes, full RISCV backend/JITLink complete | QEMU-only, scoped to `libc/**` changes; not in required pre-merge gate | no upstream riscv64 release binaries; Ubuntu 26.04 (resolute) ships `llvm`/`llvm-17..22` for riscv64 | see [project-reports/llvm.md](https://github.com/riseproject-dev/sw-ecosystem) per this repo's report set |
| Boost | build-dependency, critical (Boost.Context fibers) | yes, vendored riscv64 fiber-switch ASM present | not independently tested | source-only | issue [#40141](https://github.com/ClickHouse/ClickHouse/issues/40141) traced to stale conflict markers in the vendored riscv64 ASM, now resolved |
| Rust | build-dependency, critical | **disabled on riscv64** (`ENABLE_RUST=OFF`, cmake/target.cmake: "sysroot needs updating") | N/A - not built | N/A | `rustup target add riscv64gc-unknown-linux-gnu` is registered in the CI image but unused while Rust is force-disabled |
| BLAKE3 | build-dependency, critical | **effectively unavailable on riscv64** - BLAKE3 is one of the Rust-backed components disabled with `ENABLE_RUST=OFF` | N/A | N/A | a 2026-02-20 commit `95f4bda` fixed "BLAKE3 linker errors in native-tblgen" in the LLVM build, but this is about the LLVM tablegen build, not evidence BLAKE3 itself runs on riscv64; data not available on any riscv64-specific BLAKE3 build path being re-enabled |
| simdjson | runtime-dependency, critical | yes, builds; uses a scalar fallback path on riscv64 (no RVV backend) | not independently tested; open correctness note | source-only | [PR #119122](https://github.com/ClickHouse/ClickHouse/pull/119122) (open) flags simdjson's scalar fallback (used on riscv64 without RVV) as still needing a non-UTF-8 string byte fix; no dedicated project report exists in this repo's report set |
| Wasmtime | runtime-dependency, optional (WASM UDFs) | **no - unbuildable on riscv64** | N/A | N/A | [PR #115316](https://github.com/ClickHouse/ClickHouse/pull/115316): "WASM UDFs disabled on riscv64 (wasmtime unbuildable there)" |
| CMake | build-dependency, critical | host-side tool (used to cross-compile; not itself a target-architecture artifact for the riscv64 build) | N/A | N/A | minimum 3.25 required project-wide; CI image separately installs CMake 3.20+ via Kitware apt repo "for Rust support" |
| glibc | runtime-dependency, critical | yes, via `contrib/sysroot` submodule (`linux-riscv64`), functional | not independently tested | sysroot-bundled, not upstream ClickHouse's to release | issue [#60381](https://github.com/ClickHouse/ClickHouse/issues/60381) (`__stack_chk_guard@@GLIBC_2.27` undefined symbol) resolved; `GLIBC_COMPATIBILITY` forced off for riscv64; [PR #119049](https://github.com/ClickHouse/ClickHouse/pull/119049) (open) rebuilds the riscv64 sysroot from Debian 13 |
| OpenSSL (indirect, via `contrib/openssl-cmake`) | TLS/crypto | yes, native `linux64-riscv64` target with full Zvk vector-crypto suite present upstream, but `OPENSSL_NO_ASM=ON` forced for ClickHouse's riscv64 build | unconditional QEMU cross-compile CI upstream; zero FIPS testing on riscv64 | source-only; Debian sid/Ubuntu 24.04/Arch RISC-V ship it | [NEEDS VERIFICATION - single source] open, security-relevant upstream bug: AES T-table fallback not constant-time on hardware lacking Zkn/Zvkned (fix PRs #31080/#31082 open unmerged per dependency research) |
| zstd (indirect) | default compression codec | yes; RVV intrinsics need GCC>=14/Clang>=19 else scalar fallback | PR-triggered QEMU CI only, not release-blocking | source-only; Debian sid/Ubuntu 24.04 ship it | 7+ RVV performance PRs stalled 2-6 months on maintainer response |
| LZ4 (indirect) | compression codec | yes, functionally complete | full QEMU CI since Oct 2023 | source-only | fast-decompression path not enabled for riscv64 (perf gap, not correctness) |
| zlib-ng (indirect) | DEFLATE codec | yes, 20+ merged RISC-V PRs since 2021 | CI present with coverage gaps | Windows-only prebuilt binaries upstream; not in Ubuntu 24.04 (checked) | no correctness bugs found |
| brotli (indirect) | compression (HTTP content-encoding) | yes, base port merged 2018 | **zero CI coverage for riscv64** upstream | Debian sid/Ubuntu 24.04 ship it | RVV optimization PRs stalled for months |
| xz / liblzma (indirect) | optional compression stream support | yes, RISC-V BCJ filter merged v5.8.0 (Mar 2025) | tested only as round-trip on x86-64/ARM64 CI, no native riscv64 runner | Debian sid ships it; Ubuntu 24.04 riscv64 build is in ports, not main | CI gap only |
| jemalloc (indirect) | allocator | yes, compiles/runs; only explicit riscv64 code is `LG_QUANTUM` alignment macro | **zero CI coverage for riscv64** | source tarballs; Debian sid/Ubuntu 24.04 ship `libjemalloc2` riscv64 | no Zihintpause spin-wait hint (perf gap); cross-compilation undocumented upstream |
| re2 (indirect) | regex engine | yes, pure portable C++17, no port needed | **zero upstream CI for riscv64** | source-only; no PyPI riscv64 wheel | depends on Abseil, which has open riscv64 correctness bugs |
| double-conversion (indirect) | float/string conversion | yes, `__riscv` macro merged 2016 | no upstream CI | source-only; Debian sid/Ubuntu 24.04 ship it | none open |
| Abseil-cpp (indirect) | foundational C++ (transitive via re2/Arrow) | yes, builds; no riscv64 CMake toolchain file shipped | **zero riscv64 CI**; test suite has 2 known SEGFAULTs on Debian riscv64 | Debian sid ships `libabsl-dev` riscv64 with the SEGFAULT bug present | open, 4+ months no upstream response: hashtablez/cordz SEGFAULT (#2002), SwissTable OOB (#2142) |
| RocksDB (indirect) | optional MergeTree/Keeper storage backend | yes, base build merged; CMake has zero riscv64 branch (falls to wrong `-march=native`) | **zero riscv64 CI** | source-only; Arch RISC-V does not package it | CRC32C/XXH3 SIMD PR (16.9x speedup benchmarked) blocked on a CLA conflict since March 2026 |

**Cross-cutting pattern across the 12 researched indirect dependencies:** the dominant riscv64 posture is functionally-builds-and-runs but weak-to-zero upstream CI, consistent with ClickHouse's own posture. Two items merit direct escalation to ClickHouse maintainers: OpenSSL's non-constant-time AES fallback on non-Zkn/Zvkned riscv64 hardware [NEEDS VERIFICATION], and Abseil's open SEGFAULT/OOB bugs transitively inherited by re2 (ClickHouse's regex functions).

**Coverage gap:** `xsimd`, `vectorscan`, `simdutf`, `SimSIMD`, `usearch`, `isa-l` all appear in `contrib/CMakeLists.txt`'s SIMD category but have no dedicated research pass in the source material used for this report. Data not available: their riscv64 build/test/release status.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#40141](https://github.com/ClickHouse/ClickHouse/issues/40141) | Failed to build for RISC-V | closed 2022-08-15 | build-blocking (resolved) | Boost asm conflict markers + `R_RISCV_ALIGN` linker relaxation gap; resolved by [PR #40197](https://github.com/ClickHouse/ClickHouse/pull/40197) |
| [#60381](https://github.com/ClickHouse/ClickHouse/issues/60381) | cross-compile for risc-v error | closed 2024-02-25 | build-blocking (resolved) | `__stack_chk_guard@@GLIBC_2.27` undefined symbol linking against riscv64 sysroot |
| [#50456](https://github.com/ClickHouse/ClickHouse/issues/50456) | Linux 6.1.22 on RISC-V failed to support TaskStats interface | closed 2023-06-02 | runtime correctness (resolved) | server built and started but SQL queries failed on kernel TaskStats gap; fixed by [PR #50457](https://github.com/ClickHouse/ClickHouse/pull/50457) |

**Zero open issues reference RISC-V** in ClickHouse/ClickHouse itself. All three tracked issues are historical build/toolchain or early-kernel problems from 2022-2024, all resolved. No open correctness or performance bug is currently tagged riscv64-specific in the repo, though [PR #119122](https://github.com/ClickHouse/ClickHouse/pull/119122) (open) documents an in-progress fix to simdjson's riscv64 scalar-fallback UTF-8 handling, and [PR #119049](https://github.com/ClickHouse/ClickHouse/pull/119049) (open) is mid-flight work rebuilding the riscv64 sysroot.

**ClickBench hardware results** (ClickHouse's own benchmark suite, [benchmark.clickhouse.com/hardware](https://benchmark.clickhouse.com/hardware/), contributor Aleksandr Razumov): a SiFive U74-based VisionFive board (`riscv-rvspace.json`, 2022-08-18, dual-core 1.0 GHz) and VisionFive 2 (`riscv-jh7110.json`, 2023-01-28, quad-core 1.5 GHz, NVMe) both completed 41 of 43 queries; Q19 and Q34 returned null on both boards, consistent with a memory-constrained-board pattern seen broadly across ClickBench entries, not confirmed as riscv64-specific. VisionFive 2 is roughly 5-9x faster than the original VisionFive across the suite, tracking core count/clock/storage differences rather than any ISA effect. No riscv64-vs-arm64 comparative benchmark, report, or slide deck was found anywhere (ClickHouse docs, RISE blog, Altinity, OpenBenchmarking.org - the latter returned HTTP 403 and could not be verified).

## 12. Objections and Upstream Blockers

No formal objection to RISC-V support was found; the pattern is passive-permissive rather than actively resisted. Blockers identified:

- **Organizational:** RISC-V work has been personally driven by the founder/CTO rather than product-planned or backed by a dedicated platform team. No vendor/silicon-company sponsorship is visible in the commit history, and ClickHouse is not a RISE member.
- **Technical (largely resolved):** the lld `R_RISCV_ALIGN` linker-relaxation gap blocked CI enablement for 20 months (Nov 2021-Jul 2023, tracked across #31309/#40141/#31398) and is now resolved.
- **Technical (current):** `ENABLE_RUST=OFF` for riscv64 pending a sysroot update (cmake/target.cmake's own comment: "It might be ok, but we need to update 'sysroot'") is the most concrete open technical blocker, disabling Rust-backed features including BLAKE3. Wasmtime is confirmed unbuildable on riscv64, disabling WASM UDFs ([PR #115316](https://github.com/ClickHouse/ClickHouse/pull/115316)).
- **Test coverage:** no riscv64 test execution exists in CI at all (build-only), so functional regressions on riscv64 would not be caught pre-merge; the QEMU-under-CI SIGSEGV report from azat in the #31398 thread (jemalloc-related) was never confirmed fixed by a dedicated follow-up in the material reviewed.
- **Acceptance probability for future riscv64 contributions:** high, based on the project's demonstrated willingness to merge incremental, imperfect riscv64 PRs (starting from an admittedly-broken initial commit) and the active 2026 cross-platform fix stream from Konstantin Bogdanov. There is no evidence of maintainers pushing back on riscv64-related PRs.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** none
- ClickHouse is a general-purpose database server, not an optimization-purpose project under the Step 2 test (it delivers its core functional value - correct query execution - even without any RISC-V-specific vectorization; SIMD absence is a performance gap, not a value-proposition failure). The optimization-purpose modifier therefore does not apply and Section 2 of the color model is not invoked; optimization_gap = N/A.
- **Justification:** Upstream CI builds riscv64 on every push to master and every PR via a `build_riscv64` job in [master.yml](https://github.com/ClickHouse/ClickHouse/blob/master/.github/workflows/master.yml) and [pull_request.yml](https://github.com/ClickHouse/ClickHouse/blob/master/.github/workflows/pull_request.yml), but the job cross-compiles only - `ci/jobs/build_clickhouse.py` sets `-DENABLE_TESTS=0` explicitly for `BuildTypes.RISCV64`, and no stateless/stress/integration test jobs exist for riscv64 unlike the dozens present for amd64/arm64. Per the color model's Step 1 table, "CI builds riscv64 but does NOT run tests (build-only)" maps directly to yellow. No upstream riscv64 release artifact exists (GitHub releases page, 10 most recent releases checked, zero riscv64 assets) and the server is not packaged for riscv64 by any distro either (absent from Ubuntu 26.04 archive entirely) - so release_provider is `none`, not merely "not upstream."
- **Pending work that could change the grade:** [PR #119049](https://github.com/ClickHouse/ClickHouse/pull/119049) (open, rebuilding the riscv64 sysroot from Debian 13) and [PR #119122](https://github.com/ClickHouse/ClickHouse/pull/119122) (open, simdjson scalar-fallback UTF-8 fix) are both in-flight but do not add test execution or a release artifact, so neither would move the color on their own. Enabling any riscv64 test job (stateless tests at minimum) would be the single highest-leverage change to reach blue; publishing an upstream riscv64 release asset would be required for green. No RISE involvement with ClickHouse itself was found (RISE only builds wheels for third-party Python client libraries: `clickhouse-driver`, `clickhouse-connect`, `clickhouse-cityhash`), so no near-term external push toward a higher grade is evident.

## 14. Investment Analysis

RISE has not funded or performed any work on the ClickHouse server itself (confirmed: no RISE blog post, no RISE membership, no riseproject-dev repo dedicated to ClickHouse server code). RISE's only touchpoint is riscv64 wheel-building for three third-party Python *client* packages (`clickhouse-driver`, `clickhouse-connect`, `clickhouse-cityhash`, tracked in [riseproject-dev/python-wheels](https://github.com/riseproject-dev/python-wheels) issues [#545](https://github.com/riseproject-dev/python-wheels/issues/545), [#768](https://github.com/riseproject-dev/python-wheels/issues/768), [#1308](https://github.com/riseproject-dev/python-wheels/issues/1308)), which does not touch server enablement, CI, or performance. All of the following work is therefore un-covered by any known prior investment.

### 14.1 Functional Enablement
- Re-enable Rust on riscv64 (update the `contrib/sysroot` submodule per the code's own noted blocker) to restore BLAKE3 and prql-backed features.
- Investigate and close the Wasmtime riscv64 build gap to restore WASM UDF support ([PR #115316](https://github.com/ClickHouse/ClickHouse/pull/115316)).
- Re-evaluate whether LDAP, Parquet, gRPC, HDFS, and MySQL client integrations can be re-enabled on riscv64 now that the original linker blocker is resolved (these were disabled defensively in 2021-2022, not necessarily re-audited since).
- Fix simdjson's riscv64 scalar-fallback UTF-8 handling (tracked in open [PR #119122](https://github.com/ClickHouse/ClickHouse/pull/119122)) - contribute to or verify this upstream fix.

### 14.2 Performance Optimization
- Add an RVV path to `FunctionsRandom.cpp`'s random-number generation (currently the one documented SIMD-dispatch decision that gives riscv64 nothing).
- Re-enable OpenSSL ASM (`OPENSSL_NO_ASM=OFF`) for riscv64 once the constant-time AES T-table fallback concern [NEEDS VERIFICATION] is independently confirmed resolved upstream, to restore hardware-accelerated crypto.
- Track and adopt upstream RVV work in critical indirect dependencies (zstd, LZ4, zlib-ng, RocksDB) as it lands - several PRs are stalled purely on maintainer bandwidth, not technical rejection, per Section 9.

### 14.3 CI/CD Infrastructure
- Add a riscv64 stateless test execution job (native hardware or QEMU) - the single highest-leverage change identified in Section 13 to move from yellow to blue.
- Add riscv64 to the release pipeline to publish an official upstream binary artifact (deb/rpm/tgz) - required for green.
- Resolve the outstanding QEMU/jemalloc SIGSEGV thread flagged by azat post-#31398-merge, which was never confirmed fixed in the material reviewed.

### 14.4 Ecosystem Enablement
Section 10 omitted: ClickHouse is a standalone database server with no dependent package ecosystem of its own that must be separately enabled on riscv64 (its own Python/Java/Go client libraries are a consumption-side ecosystem already partially covered by RISE's wheel-building work referenced above, not a dependency-of-ClickHouse ecosystem).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 stateless test execution job | 3-5 | ClickHouse, Inc. / contributor | Critical |
| CI/CD | Publish official riscv64 release artifact | 2-3 | ClickHouse, Inc. | Critical |
| Functional | Re-enable Rust on riscv64 (sysroot update, restores BLAKE3) | 2-4 | ClickHouse, Inc. / contributor | High |
| Functional | Close Wasmtime riscv64 build gap (restore WASM UDFs) | 2-4 [NEEDS VERIFICATION - depends on upstream Wasmtime riscv64 status] | contributor | Medium |
| Functional | Re-audit LDAP/Parquet/gRPC/HDFS/MySQL disable flags for riscv64 | 3-6 | contributor | Medium |
| Performance | RVV path for `FunctionsRandom.cpp` | 1-2 | contributor | Low |
| Performance | Re-enable OpenSSL ASM for riscv64 after security review | 1-2 | contributor | Medium |
| Dependency | Fix simdjson riscv64 scalar-fallback UTF-8 handling | 1 (tracking [PR #119122](https://github.com/ClickHouse/ClickHouse/pull/119122)) | upstream simdjson / contributor | Medium |
| Dependency | Audit/patch Abseil-cpp riscv64 SEGFAULT bugs consumed transitively via re2 | 2-4 (upstream Abseil, outside ClickHouse's direct control) | contributor | Medium |

## 15. Updates
(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [ClickHouse/ClickHouse repository](https://github.com/ClickHouse/ClickHouse)
- [ClickHouse homepage](https://clickhouse.com/)
- [PR #30298 - Add RISC-V build](https://github.com/ClickHouse/ClickHouse/pull/30298)
- [PR #31309 - Initial support for risc-v](https://github.com/ClickHouse/ClickHouse/pull/31309)
- [PR #31398 - Add Linux RISC-V 64 build to CI](https://github.com/ClickHouse/ClickHouse/pull/31398)
- [PR #38217 - Enable JIT compilation for AArch64, PowerPC, SystemZ, RISCV](https://github.com/ClickHouse/ClickHouse/pull/38217)
- [PR #40197 - Set linker for RISC-V 64](https://github.com/ClickHouse/ClickHouse/pull/40197)
- [PR #49809 - Update build-cross-riscv.md](https://github.com/ClickHouse/ClickHouse/pull/49809)
- [PR #50457 - More thorough TaskStats availability check](https://github.com/ClickHouse/ClickHouse/pull/50457)
- [PR #51906 - Add RISC-V 64 to the universal installer](https://github.com/ClickHouse/ClickHouse/pull/51906)
- [PR #52126 - Add RISC-V 64 to the docs](https://github.com/ClickHouse/ClickHouse/pull/52126)
- [PR #56329 - Update build-cross-riscv.md](https://github.com/ClickHouse/ClickHouse/pull/56329)
- [PR #61604 - Reduce header dependencies, raised riscv CPU time limit](https://github.com/ClickHouse/ClickHouse/pull/61604)
- [PR #66571 - Update build-cross-riscv.md](https://github.com/ClickHouse/ClickHouse/pull/66571)
- [PR #97158 - PGO+BOLT toolchain, fixes riscv64 cross-compile breakage](https://github.com/ClickHouse/ClickHouse/pull/97158)
- [PR #105399 - Install clickhousectl in universal installer](https://github.com/ClickHouse/ClickHouse/pull/105399)
- [PR #115316 - Remove WasmEdge in favor of wasmtime](https://github.com/ClickHouse/ClickHouse/pull/115316)
- [PR #117449 - Print file offsets in fatal stack traces / build release binary as PIE](https://github.com/ClickHouse/ClickHouse/pull/117449)
- [PR #119049 - Update contrib/sysroot (open)](https://github.com/ClickHouse/ClickHouse/pull/119049)
- [PR #119122 - Allow non-UTF-8 String bytes in JSON type (open)](https://github.com/ClickHouse/ClickHouse/pull/119122)
- [PR #119279 - Revert of PR #117449](https://github.com/ClickHouse/ClickHouse/pull/119279)
- [Issue #40141 - Failed to build for RISC-V](https://github.com/ClickHouse/ClickHouse/issues/40141)
- [Issue #60381 - cross-compile for risc-v error](https://github.com/ClickHouse/ClickHouse/issues/60381)
- [Issue #50456 - Linux 6.1.22 on RISC-V failed to support TaskStats interface](https://github.com/ClickHouse/ClickHouse/issues/50456)
- [build-cross-riscv.mdx - official RISC-V build documentation](https://github.com/ClickHouse/ClickHouse/blob/master/docs/resources/develop-contribute/build/build-cross-riscv.mdx)
- [ClickHouse supported platforms](https://clickhouse.com/support/platforms)
- [master.yml CI workflow](https://github.com/ClickHouse/ClickHouse/blob/master/.github/workflows/master.yml)
- [pull_request.yml CI workflow](https://github.com/ClickHouse/ClickHouse/blob/master/.github/workflows/pull_request.yml)
- [ClickHouse GitHub releases page](https://github.com/ClickHouse/ClickHouse/releases)
- [ClickBench hardware benchmark results](https://benchmark.clickhouse.com/hardware/)
- [ClickBench hardware/results directory](https://github.com/ClickHouse/ClickBench/tree/main/hardware/results)
- [Ubuntu 26.04 (resolute) package search for ClickHouse](https://packages.ubuntu.com/search?keywords=ClickHouse&suite=resolute&searchon=names&section=all)
- [PyPI clickhouse package JSON](https://pypi.org/pypi/clickhouse/json)
- [RISE project blog](https://riseproject.dev/blog/)
- [RISE project members page](https://riseproject.dev)
- [riseproject-dev/python-wheels issue #545 - clickhouse-driver](https://github.com/riseproject-dev/python-wheels/issues/545)
- [riseproject-dev/python-wheels issue #768 - clickhouse-connect](https://github.com/riseproject-dev/python-wheels/issues/768)
- [riseproject-dev/python-wheels issue #1308 - clickhouse-cityhash](https://github.com/riseproject-dev/python-wheels/issues/1308)
- [RISE RISC-V runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE RISC-V runners six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)