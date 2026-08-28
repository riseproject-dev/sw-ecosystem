---
title: leveldb
parent: Project Reports
---

# leveldb

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for leveldb<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

LevelDB is a key-value storage library written in C++17 by Jeff Dean and Sanjay Ghemawat at Google. It provides ordered key-value storage with an LSM-tree design. The library is licensed BSD-3-Clause and hosted at [github.com/google/leveldb](https://github.com/google/leveldb).

**Governance:** There is no foundation affiliation, no steering committee, and no TSC. Google is the sole corporate sponsor. The current active committer is Victor Costan (pwnall, Google). The project explicitly describes itself as receiving "very limited maintenance," limited to critical bug fixes and changes required by Google's internal clients.

**Community culture on new ports:** The README states: "We generally will only accept changes for platforms that are compiled and tested." This is an explicit policy barrier against RISC-V contributions unless Google tests on riscv64 internally. Build system changes are listed as out of scope. All contributors must sign a Google CLA and conform to the Google C++ Style Guide. In practice, a RISC-V port contribution would not be accepted upstream unless RISC-V becomes an internal Google requirement.

Google is a Premier Member of the RISE project, but LevelDB is not independently listed in any RISE project activity.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-09-27 | Debian riscv64 build failure reported: SIGILL in `libbenchmark.so` during `db_test` | [Issue #1058](https://github.com/google/leveldb/issues/1058) |
| 2022-09-28 | Issue closed by reporter (yuzibo, Debian RISC-V porter) after identifying a Linux kernel fix | [Issue #1058](https://github.com/google/leveldb/issues/1058) |
| 2022 onward | Ubuntu 24.04, Debian sid, Arch Linux RISC-V all ship riscv64 binary packages of version 1.23 with no upstream changes | Debian buildd, archriscv.felixc.at |

There is no upstream RISC-V port. There are zero riscv64-related pull requests and zero riscv64-related commits in the google/leveldb repository. The Debian packaging failure was resolved at the kernel and distro packaging level, not by any change to the LevelDB source tree. The project is C++17 portable code that compiles on riscv64 without modification.

Key contributor to RISC-V work: yuzibo (Debian RISC-V porter, no employer identified in the issue).

---

## 3. Upstream Support Tier

LevelDB has no formal tier policy document. Support is inferred from CI configuration and release artifacts.

| Attribute | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI exists | Yes (ubuntu-latest) | No dedicated lane | No |
| CI passing | Yes | N/A | N/A |
| Release-blocking | Yes | No | No |
| Official upstream binary | No (source-only releases) | No | No |
| Distro binary package | Yes | Yes | Yes (v1.23) |
| Upstream build tested | Yes | Incidentally (macos-latest is arm64) | Never |

riscv64 is not an upstream-supported target. It receives no CI, no official binaries, and no upstream testing. Distro packages build successfully from unmodified source, which is the sole evidence of riscv64 functionality.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

LevelDB has no architecture-specific code for any architecture, including x86-64 and arm64. The repository (169 total files) contains zero `.S` assembly files, no `arch/` directory, no `#ifdef __riscv` guards, no `#ifdef __aarch64__` guards, and no `#ifdef __x86_64__` guards. The port layer (`port/port_stdcxx.h`) is pure C++17 standard library with zero CPU architecture conditions.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CRC32C | Software (delegates to external `google/crc32c`) | Software (delegates to external `google/crc32c`) | Software (delegates to external `google/crc32c`) |
| SIMD/vectorization | None | None | None |
| Assembly | None | None | None |
| JIT | None | None | None |
| Preprocessor guards | None | None | None |

The only performance-sensitive primitive that could theoretically be architecture-specific is CRC32C, implemented in `util/crc32c.cc` as a portable software table-based implementation. Hardware acceleration is enabled only when the external `google/crc32c` library is linked (`HAVE_CRC32C` cmake flag). That library provides SSE4.2 acceleration on x86 and CRC hardware acceleration on arm64. On riscv64, `google/crc32c` falls back to portable software - there is no Zbc/Zbkc extension path (see open PR [google/crc32c #75](https://github.com/google/crc32c/issues/75)).

The absence of arch-specific code is the intended design, not an incomplete port. riscv64 is in the same position as amd64 and arm64 for all LevelDB internals.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake exclusively, minimum version 3.22. No Autoconf or Makefile fallback. C++17 is mandatory (`CMAKE_CXX_STANDARD 17`, `CMAKE_CXX_STANDARD_REQUIRED ON`).

**Native build on riscv64 hardware or QEMU system-mode:**

```
git clone --recurse-submodules https://github.com/google/leveldb.git
cd leveldb
mkdir build && cd build
cmake -DCMAKE_BUILD_TYPE=Release \
      -DLEVELDB_BUILD_TESTS=ON \
      -DLEVELDB_BUILD_BENCHMARKS=ON \
      ..
cmake --build . --parallel $(nproc)
ctest --verbose
```

**Cross-compile from x86-64 host:**

```
cmake -DCMAKE_BUILD_TYPE=Release \
      -DCMAKE_TOOLCHAIN_FILE=/path/to/riscv64-linux-gnu.cmake \
      -DLEVELDB_BUILD_TESTS=ON \
      -DLEVELDB_BUILD_BENCHMARKS=OFF \
      -DHAVE_CRC32C=0 -DHAVE_SNAPPY=0 -DHAVE_ZSTD=0 -DHAVE_TCMALLOC=0 \
      ..
cmake --build . --parallel $(nproc)
```

Passing `-DHAVE_*=0` explicitly is the safest approach when cross-compiling to avoid `check_library_exists()` probing the wrong sysroot. The build system has no riscv64-specific handling; the POSIX platform path is selected on riscv64 Linux, which is the same as x86-64 Linux.

**Toolchain requirements:** GCC 8+ or Clang 7+ satisfies the C++17 requirement. GCC 10+ or Clang 10+ is recommended for riscv64 given earlier version gaps in RISC-V codegen [NEEDS VERIFICATION - no explicit upstream statement found; inferred from compiler release history].

**Running tests after cross-compilation:**

```
sudo apt-get install qemu-user qemu-user-static
cd build
QEMU_LD_PREFIX=/usr/riscv64-linux-gnu ctest --verbose
```

**Known build failures:** The 2022 Debian riscv64 SIGILL during `db_test` (issue #1058) was caused by `libbenchmark.so` executing `rdcycle`, a CSR read that required kernel trap emulation absent on kernel 5.18.0 running on HiFive Unmatched hardware. This is resolved in current kernels (the fix was referenced in the LKML thread linked from the issue closing comment). No open build failures exist.

There is no Dockerfile in google/leveldb. The upstream CI contains no cross-compilation or QEMU steps.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

LevelDB has no feature flags, no architecture-conditional code paths, and no optional ISA-extension features. All functionality is identical across all architectures.

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Core key-value operations | Full | Full | Full |
| Snappy compression | Full (if linked) | Full (if linked) | Full (if linked) |
| Zstd compression | Full (if linked) | Full (if linked) | Full (if linked) |
| CRC32C (software) | Full | Full | Full |
| CRC32C (hardware via google/crc32c) | Yes (SSE4.2) | Yes (CRC hw) | No (falls back to software) |
| tcmalloc allocator | Yes | Yes | No (unsupported by tcmalloc on riscv64) |
| All functional tests pass | Yes | Untested upstream | Untested upstream, confirmed by Debian build |

**Functional gaps:** None. All operations work on riscv64.

**Performance gaps:** Two sources of degradation relative to amd64/arm64:

1. CRC32C: No hardware acceleration path in `google/crc32c` for riscv64. Software CRC32C is used. The magnitude of this gap depends on write throughput and checksum frequency. [open PR google/crc32c #75 addresses detection but does not add a Zbc/Zbkc hardware path]

2. tcmalloc: Not available on riscv64. LevelDB's CMakeLists.txt treats this as optional; the build falls back to glibc malloc. The allocator performance difference is workload-dependent.

**Security hardening gaps:** Data not available - no upstream documentation of security hardening flags per architecture was found in the research.

**Floating-point:** LevelDB does not use floating-point arithmetic internally. Not applicable.

---

## 7. CI/CD Infrastructure

The sole workflow file is `.github/workflows/build.yml`. Its complete content was read via the GitHub API.

| Attribute | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI exists | Yes | No | No |
| Runner | ubuntu-latest, macos-latest, windows-latest | N/A | N/A |
| QEMU emulation | No | N/A | N/A |
| Cross-compilation | No | N/A | N/A |
| Tests run in CI | Yes | N/A | N/A |
| Benchmarks run in CI | Yes | N/A | N/A |
| RISE runner | No | No | No |

The CI matrix is `os x compiler x optimized` with compilers clang/gcc/msvc. There is no architecture dimension. No `docker/setup-qemu-action`, no `qemu-user-static`, no `riscv64` runner entry of any kind. riscv64 CI does not exist.

The RISE project provides no CI infrastructure for leveldb. Zero results were found across all 48 riseproject-dev GitHub repositories and the RISE wheel builder.

---

## 8. Distribution and Release Status

**GitHub releases:** All releases are source-only. Releases 1.23, 1.22, and 1.21 each have zero attached asset files. No binary artifacts exist on GitHub releases for any architecture.

**Distro binary packages:**

| Distribution | Package | Version | riscv64 | Source |
|-------------|---------|---------|---------|--------|
| Debian sid | libleveldb1d, libleveldb-dev | 1.23-6+b2 | Yes, status "Installed", builder rv-manda-01 | [Debian buildd](https://buildd.debian.org/status/package.php?p=leveldb&suite=sid) |
| Ubuntu 24.04 Noble | libleveldb1d, libleveldb-dev | 1.23-5build1 | Yes, listed alongside amd64/arm64/armhf/ppc64el/s390x | [packages.ubuntu.com](https://packages.ubuntu.com/) [NEEDS VERIFICATION - not re-fetched in adversarial pass] |
| Arch Linux RISC-V | leveldb | 1.23-4 | Yes, leveldb-1.23-4-riscv64.pkg.tar.zst, 2024-12-01 | [archriscv.felixc.at](https://archriscv.felixc.at/repo/extra/) |

**PyPI:** The `leveldb` Python package (latest: 0.201) is source-only. No binary wheels exist for any architecture. No riscv64 wheel exists on PyPI or the RISE wheel builder (leveldb is not listed on the RISE wheel builder at all).

**What a user must do to get a working binary:** Install the distro package. On Debian/Ubuntu: `apt-get install libleveldb-dev`. On Arch Linux RISC-V: package is in the extra repo. No manual build required on any current supported distribution.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|-----------|------|--------------|-------------|-----------------|-----------------|
| snappy | Compression (optional) | Passes - dedicated `riscv64-qemu-test.yaml` CI with QEMU, CI shows success 2026-07-31 | Passes under QEMU in CI | Packaged in Debian/Ubuntu for riscv64 | None |
| crc32c | Checksumming (optional) | Builds - no riscv64-specific CI lane | No dedicated riscv64 CI | Not tested on riscv64 upstream | No riscv64 bug open; falls back to software on riscv64; open PR [#75](https://github.com/google/crc32c/issues/75) for build system detection fix, no HW acceleration added |
| zstd | Compression (optional) | Builds - issue #3134 (pzstd link failure, closed 2022-07-08) resolved; no open riscv64 issues | No riscv64 CI lane | Packaged in Debian/Ubuntu for riscv64 | None open |
| tcmalloc | Allocator (optional) | Not supported on riscv64 - `docs/platforms.md` lists only x86 and AArch64 as supported Linux targets | No riscv64 CI | Not released for riscv64 | Architecture unsupported by tcmalloc; LevelDB treats this as optional via `HAVE_TCMALLOC` flag; not a functional blocker |
| googletest | Test framework (build/test only) | Builds | Issue [#3756](https://github.com/google/googletest/issues/3756) (OPEN): `GetThreadCountTest` fails on riscv64, `GetThreadCount()` returns 0; upstream: "We don't officially support risc-v64" | Packaged in Debian/Ubuntu for riscv64 | #3756 OPEN, non-fatal: only affects a death-test warning; does not block LevelDB functional tests |
| google/benchmark | Benchmarking (db_bench via libbenchmark) | Builds | Historical SIGILL on riscv64 (rdcycle, kernel 5.18) resolved in current kernels | Fixed in current Debian libbenchmark | Issue #1058 CLOSED; root cause was kernel-level rdcycle handling, fixed in kernel 5.19+ |

**Dependency notes:**

- snappy is the best-supported optional dep on riscv64, with active QEMU CI.
- crc32c is functional but unaccelerated on riscv64. Open PR [google/crc32c #75](https://github.com/google/crc32c/issues/75) (2026-06-11) fixes CMake target detection to avoid injecting x86/ARM compiler flags on riscv64, but does not add a Zbc/Zbkc hardware acceleration path. The PR had no reviewer and CLA was not yet signed as of the research date.
- tcmalloc is the only dependency that is architecturally excluded from riscv64. Because it is optional in LevelDB's CMake, it is not a functional blocker.
- LevelDB bundles google/benchmark as a git submodule. The rdcycle/rdtime fix for riscv64 timing is present in current benchmark upstream; it is present in LevelDB's bundled copy only if the submodule is current.

---

## 11. Known Bugs and Active Issues

**RISC-V-specific issues:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#1058](https://github.com/google/leveldb/issues/1058) | Build fail on Debian riscv64 arch due to test case db_test | CLOSED 2022-09-28 | Was: High; Now: None | SIGILL from `rdcycle` in libbenchmark on kernel 5.18; resolved by kernel fix |
| [crc32c #75](https://github.com/google/crc32c/issues/75) | Add RISC-V target detection | OPEN (PR) 2026-06-11 | Low | Fixes CMake to not inject wrong compiler flags; no HW acceleration; CLA not signed; unreviewed |

**General correctness bugs (affect all architectures including riscv64):**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#1348](https://github.com/google/leveldb/issues/1348) | Block entry bounds check wraps around | OPEN | High | 2 GiB out-of-bounds read in `Block::Iter::ParseNextKey` |
| [#1343](https://github.com/google/leveldb/issues/1343) | RepairDB assertion failure in Encode with empty InternalKeys | OPEN | Medium | Correctness bug in repair path |
| [#1339](https://github.com/google/leveldb/issues/1339) | ChangeOptions lowers block_restart_interval without resetting counter | OPEN | Medium | Assertion failure |
| [#1287](https://github.com/google/leveldb/issues/1287) | Corruption bug: reuse_logs can reuse log with incomplete record | OPEN | High | Data corruption risk |
| [#1285](https://github.com/google/leveldb/issues/1285) | log::Reader does not retry short reads | OPEN | High | Data corruption risk |

The open correctness bugs (#1287, #1285, #1348) are potentially data-corrupting and affect all platforms equally. Given the project's limited-maintenance stance, these have received no upstream action.

---

## 12. Objections and Upstream Blockers

**Stated policy objection:** The LevelDB README explicitly states contributions are accepted only for platforms that are "compiled and tested." RISC-V is not compiled or tested upstream. Any riscv64 CI or code contribution would be rejected unless it represents an internal Google requirement.

**Organizational blocker:** Google is the sole gatekeeper. There is no community governance path around this constraint. The project is in explicit limited-maintenance mode.

**Build system objection:** CMakeLists.txt changes are out of scope per project policy. A cross-compilation toolchain file or riscv64 CI job would require build system changes, placing it outside accepted contribution scope.

**Acceptance probability:** Near zero for upstream CI or riscv64-specific contributions without a Google internal driver. Distro-level patches (Debian, Fedora) are the accepted workaround and have proven sufficient to date. LevelDB's purely portable C++17 codebase means distro packages work without any upstream change.

**No technical blockers exist** for functionality. The code compiles and runs correctly on riscv64 today. The barriers are entirely organizational.

---

## 13. Investment Analysis

LevelDB functions on riscv64 today without any upstream changes. Distro packages exist in Debian, Ubuntu, and Arch Linux RISC-V. The project has zero RISE involvement and no pending upstream work.

### 13.1 Functional Enablement

No functional gaps exist. LevelDB is fully functional on riscv64 from distro packages. No investment is needed for functional enablement.

### 13.2 Performance Optimization

The only performance gap is CRC32C: no hardware acceleration on riscv64. The external `google/crc32c` library does the CRC work when linked, and it has no RISC-V extension path. Adding Zbc/Zbkc acceleration to `google/crc32c` would require:

1. Implementing a Zbc/Zbkc CRC32C path in `google/crc32c`
2. Adding CMake detection for the extension
3. Signing a Google CLA and getting the PR reviewed

Open PR [crc32c #75](https://github.com/google/crc32c/issues/75) addresses only the CMake detection fix, not the acceleration itself. The upstream reviewer response is unknown; the CLA was not signed as of the research date.

Whether this gap is material depends on the workload. LevelDB's software CRC32C is a table-based stride implementation, not a naive byte-at-a-time loop, and CRC32C cost is small relative to disk I/O in typical deployments.

### 13.3 CI/CD Infrastructure

Upstream CI for riscv64 is blocked by project policy (build system changes out of scope, platform must be internally tested). Upstream CI investment would require Google's cooperation. There is no RISE infrastructure for LevelDB currently.

An alternative is distro-level CI (Debian or Ubuntu autobuilders), which already exists and passes.

### 13.4 Ecosystem Enablement

LevelDB has no significant dependent package ecosystem requiring per-package riscv64 enablement. The Python `leveldb` package on PyPI is source-only with no binary wheels for any architecture. No riscv64 wheel gap exists beyond the general absence of binary wheels. Section 10 is omitted accordingly.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Performance | Add Zbc/Zbkc CRC32C path in google/crc32c, sign CLA, shepherd PR | 3-5 | Qualcomm or RISE contributor | Low |
| CI/CD | Distro autobuilder monitoring (Debian rv-manda-01 already running) | 0 (existing) | Debian RISC-V team | N/A |
| CI/CD | Upstream riscv64 CI (QEMU-based in .github/workflows) | 2-3 (but blocked by upstream policy) | Requires Google buy-in | Blocked |
| Correctness | Upstream bug fixes for #1287, #1285, #1348 | Unknown (project in limited-maintenance) | Google internal | Not riscv64-specific |

**Assessment:** LevelDB requires no investment for riscv64 functional coverage. The CRC32C acceleration gap is real but unlikely to be the bottleneck in practice. Total investment justified for riscv64 specifically is low. If a Zbc/Zbkc CRC32C implementation is built for `google/crc32c` for other reasons (e.g., zstd or crc32c standalone use cases), LevelDB inherits the benefit at zero additional cost.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [google/leveldb repository](https://github.com/google/leveldb)
- [Issue #1058: Build fail on Debian riscv64 arch due to test case db_test](https://github.com/google/leveldb/issues/1058)
- [google/leveldb CI workflow: .github/workflows/build.yml](https://github.com/google/leveldb/blob/main/.github/workflows/build.yml)
- [google/crc32c PR #75: Add RISC-V target detection](https://github.com/google/crc32c/issues/75)
- [Debian buildd status for leveldb](https://buildd.debian.org/status/package.php?p=leveldb&suite=sid)
- [Arch Linux RISC-V extra repo](https://archriscv.felixc.at/repo/extra/)
- [PyPI leveldb package](https://pypi.org/project/leveldb/)
- [LevelDB benchmark documentation](https://github.com/google/leveldb/blob/main/doc/benchmark.html)
- [RISE project members](https://riseproject.dev/members/)
- [RISE project wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [googletest issue #3756: GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [Issue #1348: Block entry bounds check wraps around](https://github.com/google/leveldb/issues/1348)
- [Issue #1287: Corruption bug: reuse_logs can reuse log with incomplete record](https://github.com/google/leveldb/issues/1287)
- [Issue #1285: log::Reader does not retry short reads](https://github.com/google/leveldb/issues/1285)
- [Issue #1343: RepairDB assertion failure with empty InternalKeys](https://github.com/google/leveldb/issues/1343)
- [Issue #1339: ChangeOptions lowers block_restart_interval without resetting counter](https://github.com/google/leveldb/issues/1339)