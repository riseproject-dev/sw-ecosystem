---
title: sandboxed-api
---

# sandboxed-api

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for sandboxed-api<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[Sandboxed API](https://github.com/google/sandboxed-api) (SAPI) is a Google-developed framework for creating OS-level sandboxes for C and C++ libraries on Linux. It wraps an existing shared library in a sandboxed process using Linux seccomp-BPF syscall filtering, ptrace-based register inspection, and a code-generated IPC layer. The primary use case is isolating untrusted third-party libraries (e.g., image parsers, codec libraries) from a trusted host process.

**Governance:** Google LLC owns and maintains the project with no independent foundation governance. There is no CNCF, Linux Foundation, or Apache Software Foundation membership. All commits are pushed via copybara-github, Google's internal-to-public sync tool, confirming that all contributors are Google employees. Identified maintainers include happyCoder92, sroettger, carl-smith, paulsemel, and cblichmann. The community channel is sandboxed-api-users@googlegroups.com. There are no OWNERS, MAINTAINERS, or CODEOWNERS files in the repository.

**License:** Apache 2.0. Copyright Google LLC 2019-2026.

**RISE membership:** Google LLC is a RISE Premier Member. sandboxed-api itself is not listed as a RISE project. No RISE blog post (34 posts from 2024-05 through 2026-08 scanned) mentions sandboxed-api.

**Community posture on new ports:** The repository shows very low external community activity: 22 open issues, 2 open PRs, no external contributors, no architecture port discussions of any kind. All meaningful engineering happens inside Google and is mirrored publicly. A RISC-V port would require either Google initiating it internally or an external contributor submitting a multi-file patch that Google is willing to review and merge.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| - | No RISC-V port has been started, proposed, or discussed | GitHub issues search (0 results for "riscv"), PR search (0 results for "riscv") |

There is no port history. A search of all 177 open and closed issues and all 115 PRs for "riscv" or "riscv64" returned zero results. No commits touching riscv64 exist anywhere in the repository. A full file tree scan (921 files) found no files with "riscv" in their paths. The only occurrence of "riscv" in the entire repository is an incidental mention inside `MODULE.bazel.lock`, which contains download URLs for Go toolchain build dependencies -- not sandboxed-api source code.

The RISC-V port has not been started. There are no contributors, no milestone dates, and no tracking ticket.

---

## 3. Upstream Support Tier

sandboxed-api has no documented platform tier policy. Support status is enforced by compile-time assertions rather than a written support matrix.

From `sandboxed_api/config.h` (confirmed by direct code inspection):

```
static_assert(host_cpu::Architecture() != cpu::kUnknown,
              "Host CPU architecture is not supported: One of x86-64, POWER64 "
              "(little endian), ARM or AArch64 is required.");
```

The architecture enum `cpu::Architecture` contains exactly five values: `kX8664`, `kX86`, `kPPC64LE`, `kArm64`, `kArm`. A build on riscv64 hits this static_assert and fails to compile.

| Criterion | amd64 (x86_64) | arm64 (AArch64) | riscv64 |
|-----------|---------------|-----------------|---------|
| Architecture enum entry | Yes (`kX8664`) | Yes (`kArm64`) | No |
| Compile-time gate | Passes | Passes | Hard fail |
| CI coverage | Yes (ubuntu-24.04, Fedora 38) | No | No |
| Official binary release | Yes (`sapi_generator_tool-linux-x86_64.tar.gz`) | No | No |
| Distro packaging | No | No | No |
| RISE involvement | No | No | No |

arm64 is in the supported architecture enum and compiles, but it has no CI and no official binary release. riscv64 does not compile at all.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

sandboxed-api's architecture-specific code covers five subsystems: CPU detection and compile-time dispatch, ptrace register layout, syscall table definitions, seccomp-BPF policy generation, and callback trampolines. All five require per-architecture implementation. All five are missing for RISC-V.

### 4.1 CPU detection and compile-time dispatch

File: `sandboxed_api/config.h`

Preprocessor macros `SAPI_X86_64`, `SAPI_PPC64_LE`, `SAPI_ARM64`, `SAPI_ARM` are set by `#if defined(__x86_64__)` etc. There is no `#elif defined(__riscv)` branch. No `SAPI_RISCV64` macro is defined. The static_assert at the bottom of the file causes a compile-time failure for any architecture not covered.

### 4.2 ptrace register layout

File: `sandboxed_api/sandbox2/regs.h`, `sandboxed_api/sandbox2/regs.cc`

`PtraceRegisters` is a struct with architecture-specific register fields selected by `#if defined(SAPI_X86_64) / #elif defined(SAPI_PPC64_LE) / #elif defined(SAPI_ARM64) / #elif defined(SAPI_ARM)`. The `#else` branch fires `static_assert(false, "Host CPU architecture not supported, see config.h")`. No RISC-V register layout exists. `Fetch()`, `Store()`, `ToSyscall()`, and `GetReturnValue()` in regs.cc all use the same four-way dispatch with no else-fallback and no riscv64 branch.

### 4.3 Syscall tables

File: `sandboxed_api/sandbox2/syscall_defs.cc` (2154 lines)

Syscall tables are defined for: `kSyscallDataX8664`, `kSyscallDataX8632`, `kSyscallDataPPC64LE`, `kSyscallDataArm64`, `kSyscallDataArm32`. The `SyscallTable::get()` dispatch covers only those five. No riscv64 syscall table exists.

### 4.4 seccomp-BPF audit architecture mapping

File: `sandboxed_api/sandbox2/syscall.cc`, `sandboxed_api/sandbox2/policy.cc`

`AuditArchToCPUArch()` maps `AUDIT_ARCH_AARCH64`, `AUDIT_ARCH_ARM`, `AUDIT_ARCH_X86_64`, `AUDIT_ARCH_I386`, `AUDIT_ARCH_PPC64LE`. No `AUDIT_ARCH_RISCV64` mapping exists. `policy.cc` generates BPF seccomp filters with architecture-check stubs for the same five architectures only.

### 4.5 Callback trampolines

File: `sandboxed_api/trampolines.S` (108 lines)

Assembly trampoline code exists for `__x86_64__` (Intel syntax, saves rdi/rsi/rdx/rcx/r8/r9) and `__aarch64__` (saves x0-x7). The file ends with `#endif` with no RISC-V or `__riscv` branch. No riscv64 assembly trampoline exists.

### 4.6 ISA extensions

There is no SIMD dispatch, no JIT backend, no crypto acceleration, and no ISA extension usage (RVV, Zba, Zbb, etc.) anywhere in the tree. This is not a gap specific to RISC-V -- the project uses no vectorized code.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CPU enum entry | Yes | Yes | Missing |
| Compile-time gate | Passes | Passes | Hard fail |
| ptrace register layout | Complete | Complete | Missing |
| Syscall table | Complete (329 entries) | Complete | Missing |
| Audit arch mapping | Complete | Complete | Missing |
| seccomp-BPF policy gen | Complete | Complete | Missing |
| Callback trampoline | Assembly | Assembly | Missing |
| SIMD / ISA extensions | None (not applicable) | None | None |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** CMake (minimum version 3.25) with Ninja. Bazel is also supported but not the primary CI build system. C++20 is required and enforced.

**Canonical configure command** (from `.github/workflows/ubuntu-cmake.yml`):

```bash
cmake \
  -S $GITHUB_WORKSPACE \
  -B $GITHUB_WORKSPACE/build \
  -G Ninja \
  -DCMAKE_BUILD_TYPE=Release
```

**Tested compiler versions in CI:**
- Clang 18 and 19 on Ubuntu 24.04
- GCC 13 and 14 on Ubuntu 24.04
- Fedora 38: GCC 13, Clang 16

**Required packages** (from README.md, Debian/Ubuntu):

```bash
sudo apt-get install -qy build-essential clang-19 git gnupg \
  libcap-dev libclang-19-dev libclang-rt-19-dev libncurses-dev \
  libzstd-dev linux-libc-dev llvm-19-dev pkg-config unzip wget zip \
  zlib1g-dev cmake ninja-build
```

**Cross-compilation:** No cross-compilation support exists. No toolchain file for riscv64 exists in `cmake/`. No QEMU usage is documented or used anywhere. The Fedora CI workflow runs x86 Docker containers for native builds, not cross-compilation.

**Linux-only gate:** `CMakeLists.txt` issues `message(FATAL_ERROR)` if not on Linux.

**riscv64 build outcome today:** The build fails at the `static_assert` in `sandboxed_api/config.h` before any meaningful compilation occurs. No workaround exists short of patching the source.

**Key CMake options relevant to a port attempt:**
- `-DSAPI_DOWNLOAD_ABSL=ON/OFF` -- control dep download
- `-DSAPI_DOWNLOAD_LIBUNWIND=ON/OFF`
- `-DSAPI_DOWNLOAD_PROTOBUF=ON/OFF`
- `-DSAPI_BUILD_EXAMPLES=OFF` -- skip examples
- `-DSAPI_BUILD_TESTING=OFF` -- skip tests

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Compilation | Yes | Yes | No -- hard static_assert |
| Sandbox2 core (ptrace, seccomp-BPF) | Yes | Yes | No |
| Syscall interception | Yes | Yes | No |
| Policy generation | Yes | Yes | No |
| Callback trampolines | Yes | Yes | No |
| SAPI generator tool (prebuilt binary) | Yes | No | No |
| QEMU emulation support | N/A | N/A | N/A |
| ISA extension optimization | None | None | None |

There are no partial features for riscv64 -- the project cannot be built or run on riscv64 at all. There are no NaN or floating-point semantic issues to report because no riscv64 execution has occurred. Security hardening (seccomp-BPF, capabilities) is unavailable on riscv64 for the same reason.

---

## 7. CI/CD Infrastructure

**Workflow files:** `.github/workflows/fedora-cmake.yml`, `.github/workflows/generator-tool.yml`, `.github/workflows/ubuntu-cmake-contrib.yml`, `.github/workflows/ubuntu-cmake.yml`. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` found.

All four workflow files use `ubuntu-latest` or `ubuntu-24.04` runners (x86_64 native) with no QEMU emulation, no riscv64 runner, and no references to "riscv", "riscv64", or "RISCV" anywhere.

- `fedora-cmake.yml`: GCC 13 and Clang 16 builds under Fedora 38 Docker container on `ubuntu-latest` host
- `generator-tool.yml`: Builds `sapi_generator_tool` for x86_64 under Debian 12 container on `ubuntu-latest`
- `ubuntu-cmake-contrib.yml`: Matrix of contrib library sandboxes (brotli, c-blosc, jsonnet, libidn2, libraw, libxls, lodepng, pffft) on `ubuntu-24.04`
- `ubuntu-cmake.yml`: Matrix of Clang 19/18 and GCC 14/13 on `ubuntu-24.04`; runs `ctest` for SapiTest

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Runner exists | Yes | No | No |
| Native hardware | Yes (ubuntu-24.04) | No | No |
| QEMU emulation | No | No | No |
| RISE CI runner | No | No | No |
| Build tested | Yes | No | No |
| Tests run | Yes (ctest SapiTest) | No | No |

arm64 is in the supported architecture list but has no CI. riscv64 has neither support nor CI.

---

## 8. Distribution and Release Status

**GitHub Releases:** Releases found: `latest` (2026-08-25), `v20241008`, `v20190823`, `v20190318`. The only binary asset across all releases is `sapi_generator_tool-linux-x86_64.tar.gz`. No riscv64 asset exists. No arm64 asset exists.

**PyPI:** HTTP 404. No package named `sandboxed-api` exists on PyPI. Not applicable.

**RISE wheel builder:** HTTP 404. No package exists. Not applicable.

**Ubuntu noble (24.04):** Not packaged. Search of packages.ubuntu.com for "sandboxed-api" returned no results.

**Debian:** HTTP 404 on tracker.debian.org/pkg/sandboxed-api. Confirmed via packages.debian.org: no package named "sandboxed-api" exists in any Debian suite. Not packaged.

**Arch Linux RISC-V** ([archriscv.felixc.at](https://archriscv.felixc.at/)): Not listed.

**User path to a working riscv64 binary:** Does not exist. The project cannot be compiled on riscv64 due to the hard static_assert in `config.h`. There is no distribution package, no cross-compiled binary, and no documented workaround.

---

## 9. Dependencies

The dependency table below covers the libraries identified from `CMakeLists.txt` and `cmake/SapiDeps.cmake`. Note that the primary blocker is sandboxed-api itself, not any dependency: the static_assert in `config.h` prevents compilation before any dependency is reached.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release Artifacts | Blocking Issues |
|---|---|---|---|---|---|
| [abseil-cpp](https://github.com/abseil/abseil-cpp) | Core utilities, string, hash, CRC32C, logging | Builds (minor warnings fixed upstream) | Functional; no arch-specific failures known | Source-only; no per-arch artifacts | PR #1986 (CRC32C HW accel, open Dec 2025, awaiting hardware verification); see `project-reports/abseil-cpp.md` |
| [protobuf](https://github.com/protocolbuffers/protobuf) | Serialization for sandbox policy and IPC messages | Builds on riscv64 (issue #12266 closed 2023; #14549 fixed) | Functional per upstream closure | No `protoc-*-linux-riscv64.zip` in v36.0 release assets -- riscv64 protoc must be built from source | No prebuilt `protoc` for riscv64; #17798 tracking status unclear |
| [RE2](https://github.com/google/re2) | Regex in sandboxed library policy evaluation | Builds cleanly; zero riscv64 issues ever filed | No riscv64 CI; assumed functional (pure C++, no arch asm) | Source-only, N/A | None; see `project-reports/re2.md` |
| [zlib](https://github.com/madler/zlib) | Compression in examples; optional | Builds; zero riscv64 issues filed | No riscv64 CI | Source-only, N/A | None; see `project-reports/zlib.md` |
| [libseccomp](https://github.com/seccomp/libseccomp) | Kernel syscall filtering (core sandbox mechanism) | Builds; riscv64 support added in v2.5.0 (2020) | Functional; all riscv64 issues closed | Distributed via distros | None currently open; see `project-reports/libseccomp.md` |
| [libcap](https://sites.google.com/site/fullycapable/) | Linux capabilities enforcement | Builds; pure C with no arch-specific assembly | No riscv64 CI reported | Distro-distributed, N/A | No issues filed for riscv64 [NEEDS VERIFICATION] |
| [libunwind](https://github.com/libunwind/libunwind) | Stack unwinding in crash handlers, ptrace support | Builds; Linux riscv64 listed as supported in README | Partial: C++ exception support on riscv64 deliberately disabled (PR #1032 abandoned); CMake build unverified (issue #765 open) | Source-only, N/A | #765 (CMake support for RISCV, open); C++ exception handling unresolved; see `project-reports/libunwind.md` |
| [GoogleTest](https://github.com/google/googletest) | Unit testing framework | Builds | Bug: `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (#3756, open since Feb 2022, assigned but unfixed) | Source-only, N/A | #3756 (open, `GetThreadCount()` returns 0 on riscv64); see `project-reports/googletest.md` |
| [Google Benchmark](https://github.com/google/benchmark) | Microbenchmarks (test-only) | Builds; riscv64 cycleclock fixed (#1802 merged Jun 2024; #1549 merged Feb 2023) | Functional; cycleclock and CPU frequency estimation fixed | Source-only, N/A | None currently open; see `project-reports/benchmark.md` |

**Dependency-level blockers:** libunwind has partial riscv64 support (C++ exception handling unresolved, CMake build issue #765 open). GoogleTest has a known test failure on riscv64 (#3756 open since Feb 2022). protobuf requires building `protoc` from source on riscv64. None of these is the primary blocker -- sandboxed-api itself cannot be compiled on riscv64.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| (none) | No riscv64 issues exist | - | - | 177 issues and 115 PRs searched; zero results for "riscv" or "risc" |

**Correctness bugs specific to riscv64:** None filed. The project has never been run on riscv64, so no runtime bugs have been observed.

**Architecture-related open issues (non-riscv64):**
- Issue #169: Linking issue with libunwind and zlib on aarch64 (open, blocks arm64 production use)

The 23 open issues are focused on code generation bugs, Fedora build failures, and feature requests (Landlock, Android, unprivileged user namespaces). No open issue relates to RISC-V.

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

The following files require new riscv64 code before the project compiles or runs:

1. `sandboxed_api/config.h` -- add `#elif defined(__riscv) && (__riscv_xlen == 64)` branch, define `SAPI_RISCV64`, add `kRISCV64` to the `cpu::Architecture` enum, update the static_assert message
2. `sandboxed_api/sandbox2/regs.h` -- add `PtraceRegisters` struct fields for riscv64 general-purpose registers (a0-a7, s0-s11, t0-t6, sp, pc, etc.)
3. `sandboxed_api/sandbox2/regs.cc` -- implement `Fetch()` (using `PTRACE_GETREGSET` with `NT_PRSTATUS`), `Store()`, `ToSyscall()`, and `GetReturnValue()` for riscv64
4. `sandboxed_api/sandbox2/syscall.cc` -- add `AUDIT_ARCH_RISCV64` mapping in `AuditArchToCPUArch()` and `GetHostAuditArch()`
5. `sandboxed_api/sandbox2/syscall_defs.cc` -- add riscv64 syscall table (Linux riscv64 uses a unified syscall ABI with ~300 syscalls via the standard RISC-V syscall table)
6. `sandboxed_api/sandbox2/policy.cc` -- add riscv64 seccomp-BPF architecture check stub
7. `sandboxed_api/trampolines.S` -- add `#elif defined(__riscv)` assembly trampoline saving argument registers (a0-a7)
8. `sandboxed_api/sandbox2/policybuilder.cc` -- audit for any riscv64-specific startup syscalls

**Organizational blockers:**

The project is a Google internal mirror. All commits come through copybara. External contributors have no direct commit access. The repository has only 2 open PRs in its history and very low review velocity on external contributions. A multi-file architecture port from an external contributor carries uncertain acceptance probability without a prior relationship with the Google team.

**No stated objection** to RISC-V exists because the topic has never been raised in any public forum.

**Acceptance probability:** Data not available: no upstream discussion of RISC-V exists from which to infer maintainer posture.

---

## 13. Investment Analysis

RISE has done no work on sandboxed-api. No RISE project page, no RISE blog post, no riseproject-dev GitHub repository, and no RISE wheel builder entry exists for sandboxed-api. All work described below is greenfield.

### 13.1 Functional Enablement

The port requires changes to 8 files (listed in Section 12). The syscall table and ptrace register layout are the most labor-intensive items. The riscv64 Linux syscall ABI is well-documented. The ptrace register layout for riscv64 is defined in the Linux kernel header `uapi/asm/ptrace.h`. The trampoline assembly is mechanically similar to the existing aarch64 trampoline. This work requires deep knowledge of Linux ptrace, seccomp-BPF, and the riscv64 ABI.

### 13.2 Performance Optimization

Not applicable. sandboxed-api uses no SIMD, no JIT, and no ISA extensions. There is no performance optimization work specific to riscv64.

### 13.3 CI/CD Infrastructure

A riscv64 CI job is needed to prevent regressions. Options are QEMU emulation under an existing x86_64 runner or a native riscv64 runner (RISE or self-hosted). QEMU-based CI is sufficient for correctness testing; hardware is not required for this project because it has no performance-sensitive CI.

### 13.4 Ecosystem Enablement

Not applicable. sandboxed-api has no package ecosystem that requires separate riscv64 enablement work.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `SAPI_RISCV64` macro, `kRISCV64` enum, update static_assert in `config.h` | 0.5 | Qualcomm / Google | Critical |
| Functional | Implement riscv64 `PtraceRegisters` struct in `regs.h` and `regs.cc` (Fetch/Store/ToSyscall/GetReturnValue) | 2 | Qualcomm / Google | Critical |
| Functional | Add riscv64 syscall table in `syscall_defs.cc` (~300 entries) | 2 | Qualcomm / Google | Critical |
| Functional | Add `AUDIT_ARCH_RISCV64` mapping in `syscall.cc` and `policy.cc` | 0.5 | Qualcomm / Google | Critical |
| Functional | Add riscv64 assembly trampoline in `trampolines.S` | 1 | Qualcomm / Google | Critical |
| Functional | Audit `policybuilder.cc` for riscv64-specific startup syscalls | 0.5 | Qualcomm / Google | High |
| Functional | End-to-end testing with a sandboxed example library on riscv64 hardware or QEMU | 2 | Qualcomm / Google | High |
| CI/CD | Add riscv64 job to `ubuntu-cmake.yml` (QEMU-based acceptable) | 1 | Qualcomm / Google | High |
| Upstream | Upstream review and merge coordination with Google | 2 | Qualcomm | High |

**Total estimated effort:** 11.5 person-weeks for a complete functional port with CI and upstream acceptance.

**Critical path:** The 8 source file changes in Section 12 are sequential dependencies. CI and upstreaming can proceed in parallel after the core port compiles and passes basic tests.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [sandboxed-api repository](https://github.com/google/sandboxed-api)
- [sandboxed_api/config.h -- architecture enum and static_assert](https://github.com/google/sandboxed-api/blob/main/sandboxed_api/config.h)
- [sandbox2/regs.h -- PtraceRegisters struct](https://github.com/google/sandboxed-api/blob/main/sandboxed_api/sandbox2/regs.h)
- [sandbox2/regs.cc -- ptrace Fetch/Store/ToSyscall](https://github.com/google/sandboxed-api/blob/main/sandboxed_api/sandbox2/regs.cc)
- [sandbox2/syscall.cc -- AuditArchToCPUArch](https://github.com/google/sandboxed-api/blob/main/sandboxed_api/sandbox2/syscall.cc)
- [sandbox2/syscall_defs.cc -- syscall tables](https://github.com/google/sandboxed-api/blob/main/sandboxed_api/sandbox2/syscall_defs.cc)
- [sandbox2/policy.cc -- seccomp-BPF policy generation](https://github.com/google/sandboxed-api/blob/main/sandboxed_api/sandbox2/policy.cc)
- [sandbox2/policybuilder.cc -- policy builder](https://github.com/google/sandboxed-api/blob/main/sandboxed_api/sandbox2/policybuilder.cc)
- [sandboxed_api/trampolines.S -- callback trampoline assembly](https://github.com/google/sandboxed-api/blob/main/sandboxed_api/trampolines.S)
- [.github/workflows/ubuntu-cmake.yml -- CI matrix](https://github.com/google/sandboxed-api/blob/main/.github/workflows/ubuntu-cmake.yml)
- [.github/workflows/fedora-cmake.yml -- Fedora CI](https://github.com/google/sandboxed-api/blob/main/.github/workflows/fedora-cmake.yml)
- [.github/workflows/generator-tool.yml -- sapi_generator_tool build](https://github.com/google/sandboxed-api/blob/main/.github/workflows/generator-tool.yml)
- [GitHub releases for google/sandboxed-api](https://github.com/google/sandboxed-api/releases)
- [RISE project member list](https://riseproject.dev/members/)
- [abseil-cpp RISC-V report](project-reports/abseil-cpp.md)
- [googletest RISC-V report](project-reports/googletest.md)
- [google benchmark RISC-V report](project-reports/benchmark.md)
- [RE2 RISC-V report](project-reports/re2.md)
- [zlib RISC-V report](project-reports/zlib.md)
- [libseccomp RISC-V report](project-reports/libseccomp.md)
- [libunwind RISC-V report](project-reports/libunwind.md)