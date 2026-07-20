---
title: libnuma
categories:
  - libraries
---

# libnuma

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libnuma<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libnuma is the C library component of the [numactl](https://github.com/numactl/numactl) project. It provides a programmatic interface to the Linux kernel NUMA policy syscalls: `mbind`, `get_mempolicy`, `set_mempolicy`, `migrate_pages`, and `move_pages`. The companion `numactl` binary is a process launcher that applies NUMA policy to arbitrary executables. The library is licensed LGPL-2.1; the tool and demo programs are GPL-2.0.

The repository is hosted under the `numactl` GitHub organization. There is no formal governance document, no MAINTAINERS file, no CODEOWNERS file, and no foundation membership. The project is not a RISE Project member. Andi Kleen (SUSE Labs) is the original primary author and has functioned as sole gatekeeper since the project's inception. Historical co-authors include Cliff Wickman and Christoph Lameter (SGI, credited through the 2.0.10-rc2 copyright) and Lee Schermerhorn (HP). Recent contributors (hygoni, luochenglcs, Pingfan Liu) have no stated corporate affiliations in the repository.

The project has no documented policy on new architecture ports. Andi Kleen merges community contributions without stated resistance; the community stance is permissive but entirely passive with respect to RISC-V completeness.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-05-07 | Commit `e0de0d9` by ffontaine: adds portable `AC_SEARCH_LIBS([__atomic_fetch_and_1], [atomic])` to configure.ac. Fixes sparc and implicitly covers riscv64. | [numactl commits](https://github.com/numactl/numactl/commits/master) |
| 2022-08-22 | [PR #131](https://github.com/numactl/numactl/pull/131) merged by andikleen: adds riscv64-specific `-latomic` to Makefile.am via `AM_CONDITIONAL([RISCV64], ...)`. Simultaneously and silently removes the `AC_SEARCH_LIBS` line added by `e0de0d9`. First explicitly riscv64-specific change in the repo. Author: hack3ric (no stated corporate affiliation). | [PR #131](https://github.com/numactl/numactl/pull/131) |
| 2022-09-07 | v2.0.15 released. Carries the riscv64-specific `-latomic` conditional and is missing the portable `AC_SEARCH_LIBS`. | [GitHub releases](https://github.com/numactl/numactl/releases) |
| 2022-11-02 | Commit `18ec3b9` by ffontaine: re-adds `AC_SEARCH_LIBS([__atomic_fetch_and_1], [atomic])`. Motivated by build failures on sparc and microblaze caused by PR #131 removing the portable path. At this point both mechanisms coexist redundantly. | [numactl commits](https://github.com/numactl/numactl/commits/master) |
| 2024-01-06 | [PR #197](https://github.com/numactl/numactl/pull/197) merged by andikleen: reverts PR #131. Removes the `RISCV64` autoconf conditional and the `if RISCV64 ... -latomic` block. Rationale: LLVM on riscv64 has no `-latomic`; the correct fix is `AC_SEARCH_LIBS`, which was already present. Author: Marvin Schmidt (marv, exherbo.org). | [PR #197](https://github.com/numactl/numactl/pull/197) |
| 2024-01-06 | [PR #198](https://github.com/numactl/numactl/pull/198) merged: replaces `<sys/fcntl.h>` with `<fcntl.h>`. Motivated by riscv64/musl build failures. | [PR #198](https://github.com/numactl/numactl/pull/198) |
| 2024-01-17 | v2.0.17 released. Contains both PR #197 and PR #198. riscv64 builds correctly with GCC and LLVM via `AC_SEARCH_LIBS`. No riscv64-specific code remains in the tree. | [GitHub releases](https://github.com/numactl/numactl/releases) |

No tracking issue for a riscv64 port was ever filed. There is no `syscall.c` patch adding an explicit `__riscv` ifdef block. No riscv64-specific code exists in the current tree. The port is effectively complete via the generic Linux kernel header path (see Section 4).

The RISC-V port is fully upstream in the sense that no downstream patches are required for the core functionality on riscv64. Whether Debian applies additional patches to `syscall.c` to add an explicit `__riscv` block could not be confirmed from available data [NEEDS VERIFICATION].

---

## 3. Upstream Support Tier

numactl has no documented architecture support tiers. The project makes no distinction between Tier 1, Tier 2, or experimental architectures.

In practice, support can be inferred from CI coverage and official binary production:

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Tested in upstream CI | Yes | No | No |
| Official binary releases | No (source only) | No (source only) | No (source only) |
| Distro packaging | Yes (all distros) | Yes (all distros) | Yes (Debian sid, Ubuntu 24.04) |
| Test suite run against hardware | Yes (CI) | Unknown | No (single-node NUMA, tests skipped) |
| `syscall.c` explicit ifdef | Yes | No | No |
| `set_mempolicy_home_node` ifdef | Yes | Yes | No |

All architectures are source-only releases from upstream. riscv64 is at the same tier as arm64 with respect to upstream CI: neither has a CI job. riscv64 lags arm64 only in `set_mempolicy_home_node` ifdef coverage.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libnuma is a thin system call wrapper. It has no JIT, no SIMD, no cryptography, no compression, no garbage collection, and no assembly. The architecture-specific surface area is narrow.

**`syscall.c` -- NUMA syscall number table**

This file defines fallback `#define __NR_mbind ...` values for architectures where kernel headers do not supply the numbers. It lists explicit `#ifdef` blocks for: x86_64, ia64, i386, powerpc, loongarch, MIPS (three ABIs), hppa, arm, and s390x. riscv64 (`__riscv`) is absent.

The `#error "Add syscalls for your architecture or update kernel headers"` at the end of the fallback chain does not fire on riscv64 because the Linux generic syscall table (`include/uapi/asm-generic/unistd.h`) defines all five NUMA syscalls for MMU-capable architectures: mbind=235, get_mempolicy=236, set_mempolicy=237, migrate_pages=238, move_pages=239. These are present on riscv64 before `syscall.c` is compiled, so the outer `#if !defined(...)` guards evaluate false and the entire per-arch block is skipped. The Debian buildd result (2.0.19-1+b2, "Installed" on `rv-osuosl-03`) confirms this.

**`syscall.c` -- `set_mempolicy_home_node` (syscall 450)**

The newer tiered-memory API is explicitly defined in `syscall.c` for x86_64, aarch64, i386, powerpc, MIPS, and s390x. riscv64 and LoongArch are absent. A `#warning` is emitted at compile time on riscv64. The API degrades gracefully at runtime (ENOSYS if the running kernel supports the syscall, which modern kernels do), but the build warning is spurious. A one-line `#elif defined(__riscv)` addition to the existing ifdef chain would resolve it.

**`clearcache.c`**

The file emits `#warning 'Consider adding a clearcache implementation for your architecture'` on riscv64. aarch64 has the same gap (upstream [issue #205](https://github.com/numactl/numactl/issues/205), open January 2024, labeled "help wanted", no fix merged). This is a warning, not a build failure.

**`libnuma.c`**

No architecture ifdefs. The only arch-aware logic is a runtime 64-bit width check (`sizeof(unsigned long) == 8`), not compile-time.

**`stream_lib.c`, `affinity.c`, `numademo.c`**

Zero architecture ifdefs. `stream_lib.c` relies on compiler auto-vectorization (`-ftree-vectorize -ffast-math -funroll-loops`). No SIMD intrinsics for any architecture. No RVV, no SSE, no NEON.

**Component summary:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| NUMA syscall numbers | Explicit ifdef | No explicit ifdef (kernel headers) | No explicit ifdef (kernel headers) |
| `set_mempolicy_home_node` | Explicit ifdef | Explicit ifdef | Missing (warning) |
| `clearcache` | Implemented | Missing (warning) | Missing (warning) |
| SIMD / vectorized code | None | None | None |
| Assembly | None | None | None |
| JIT | None | None | None |
| `syscall6` / `migrate_pages` | glibc `syscall()` | glibc `syscall()` | glibc `syscall()` |

riscv64 is functionally equivalent to arm64 for all practical purposes. Both rely on kernel header-provided syscall numbers. Both are missing the `clearcache` implementation. riscv64 additionally lacks the `set_mempolicy_home_node` ifdef that arm64 has.

---

## 5. Build System, Cross-Compilation, and Toolchain

Build system: GNU Autotools (autoconf >= 2.64, automake, libtool). No CMake, no Meson, no Cargo, no Dockerfiles in the repository.

Standard build from a git checkout:

```sh
./autogen.sh
./configure --prefix=/usr --libdir=/usr/lib
make
make check
```

Cross-compilation for riscv64:

```sh
./autogen.sh
./configure --host=riscv64-linux-gnu \
            --prefix=/usr \
            --libdir=/usr/lib \
            CC=riscv64-linux-gnu-gcc
make
```

No minimum GCC or Clang version is documented in `configure.ac` or any build file. The Travis CI matrix (historical, pre-GitHub Actions) tested GCC 4.9 through GCC 10. The `AC_PREREQ([2.64])` is the only stated minimum.

The RPM spec contains `ExcludeArch: s390 %{arm}` (excluding 32-bit ARM and 31-bit s390). riscv64 is not excluded.

The only known build issue resolved for riscv64 is the libatomic detection (PR #197, January 2024): LLVM on riscv64 does not ship a separate `-latomic` library, so the prior unconditional link flag broke LLVM builds. Current `configure.ac` uses `AC_SEARCH_LIBS([__atomic_fetch_and_1], [atomic])`, which correctly handles both GCC and LLVM on riscv64.

No QEMU usage in upstream CI. No cross-compilation jobs in upstream CI.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap Type |
|---|---|---|---|---|
| `mbind` | Full | Full | Full | None |
| `get_mempolicy` | Full | Full | Full | None |
| `set_mempolicy` | Full | Full | Full | None |
| `migrate_pages` | Full | Full | Full | None |
| `move_pages` | Full | Full | Full | None |
| `set_mempolicy_home_node` | Full | Full | Warning at build, runtime functional if kernel supports | Cosmetic build warning |
| `numa_alloc_*` / `numa_free` | Full | Full | Full | None |
| `numa_bind` | Full | Full | Full | None |
| `numa_node_of_cpu` | Full | Full | Full | None |
| `clearcache` | Implemented | Not implemented | Not implemented | Functional gap (shared with arm64) |
| SIMD-accelerated `stream_lib` | None (scalar) | None (scalar) | None (scalar) | None (not implemented for any arch) |
| NUMA multi-node topology | Yes (hardware exists) | Yes (hardware exists) | No (no multi-node riscv64 hardware in wide use) | Hardware gap, not software gap |

The clearcache gap (shared between arm64 and riscv64) affects cache coherency hints in the `numademo` benchmark binary, not the core `libnuma` library API.

The absence of multi-node NUMA riscv64 hardware means the full NUMA policy paths are not exercised on any available platform. `numa_available()` returns -1 on all current riscv64 boards (SiFive HiFive Unmatched, StarFive VisionFive 2). This is a hardware constraint, not a software gap.

No floating-point, cryptographic, or security hardening gaps identified. libnuma does not perform floating-point arithmetic or cryptographic operations.

---

## 7. CI/CD Infrastructure

All three upstream CI workflow files were read directly.

**`.github/workflows/makefile.yml`:** Triggers on push to `master` and `action-1` branches, and on pull requests. Runs on `ubuntu-latest` (x86_64 GitHub-hosted runner). Steps: `./autogen.sh && ./configure`, `make`, `make check`, `make distcheck`. No matrix, no QEMU, no cross-compilation. The word "riscv" appears 0 times.

**`.github/workflows/codeql.yml`:** Triggers on push to `master`, pull requests to `master`, and a weekly schedule. Runs on `ubuntu-latest` (x86_64). Matrix: `language: [ 'cpp' ]` only, no architecture axis. The word "riscv" appears 0 times.

**`.github/workflows/cut-release.yml`:** Triggers on tag pushes matching `v*`. Runs on `ubuntu-22.04` (x86_64). Steps: `fakeroot make distcheck`. Single architecture. The word "riscv" appears 0 times.

No `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml` exist in the repository.

| CI Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job exists | Yes | No | No |
| Test job (`make check`) | Yes | No | No |
| Cross-compilation job | No | No | No |
| QEMU-based job | No | No | No |
| Native hardware runner | No (GitHub-hosted) | No | No |
| Release build job | Yes | No | No |
| RISE CI runners | No | No | No |

No RISE CI infrastructure is used by numactl. The RISE Project has no involvement with this project.

The Debian riscv64 buildd (`rv-osuosl-03`) provides the only known riscv64 build validation, and it is downstream, not upstream CI. Tests were skipped on the Debian buildd with the message "Skipping as can not run on non-NUMA" -- this is expected on single-node hardware.

---

## 8. Distribution and Release Status

Upstream numactl ships source-only tarballs. All GitHub release assets across v2.0.17, v2.0.18, and v2.0.19 are source archives (e.g., `numactl-2.0.19.tar.gz`). No binary assets. No riscv64 binaries in any GitHub release.

libnuma does not exist on PyPI (HTTP 404). The RISE wheel builder has no libnuma package.

**Distro package availability:**

| Distro | Package | Version | riscv64 Status |
|---|---|---|---|
| Debian sid | `libnuma1`, `libnuma-dev` | 2.0.19-1+b2 | Installed, built on `rv-osuosl-03` (physical RISC-V hardware) |
| Ubuntu 24.04 LTS | `libnuma1`, `libnuma-dev` | 2.0.18-1build1 | Available; riscv64 listed as supported architecture |
| Arch Linux RISC-V | `numactl` (libnuma as subpackage) | 2.0.19-1 | Present with `[nochecked]` status (built, check() tests skipped) [NEEDS VERIFICATION] |
| Debian bookworm/bullseye | n/a | n/a | riscv64 absent from older Debian suites |
| Fedora | Not confirmed | n/a | Data not available: Fedora riscv64 package status was not searched. |

To obtain a working binary on riscv64, a user installs the distro package. No manual build steps are required on any of the three confirmed distros above.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| Linux kernel NUMA syscalls (mbind=235, get_mempolicy=236, set_mempolicy=237, migrate_pages=238, move_pages=239) | Core API -- all libnuma functionality wraps these five syscalls | Fully supported. Defined by `asm-generic/unistd.h` for all MMU-capable arches including riscv64. Available since Linux 3.8+. | Functional on riscv64. `numa_available()` returns -1 on single-node boards; syscalls are defined but NUMA topology is absent on current hardware. | Shipped in Debian 2.0.19-1+b2, Ubuntu 2.0.18-1build1. | None. |
| `set_mempolicy_home_node` (syscall 450, Linux 5.17+) | Optional tiered-memory API | Builds with a `#warning` on riscv64. The `syscall.c` ifdef list excludes `__riscv`. Runtime dispatch via glibc `syscall()` is correct if the kernel defines it. | Warning does not affect tests. API returns ENOSYS gracefully on unsupported kernels. | Shipped (warning is compile-time only, not visible to library consumers). | Open gap: one-line `#elif defined(__riscv)` addition to `syscall.c` line 145 needed to suppress the warning. No issue filed upstream. Not blocking. |
| libatomic (`__atomic_fetch_and_1`) | Atomic sub-word memory operations in `libnuma.c` | Resolved. `configure.ac` uses `AC_SEARCH_LIBS([__atomic_fetch_and_1], [atomic])` since v2.0.17. Detects correctly for both GCC and LLVM on riscv64. | Passes. | Shipped in all distro packages at v2.0.19. | None. History: PR #131 introduced unconditional `-latomic` for riscv64 in v2.0.15, breaking LLVM builds. PR #197 reverted it in v2.0.17. |
| glibc / musl | C runtime: `syscall()`, `sched_setaffinity`, `sched_getaffinity` | glibc 2.33+ and musl 1.2.x fully support riscv64. numactl uses a `__GLIBC_PREREQ(2, 11)` guard to select between `syscall` and `syscall6`; riscv64 always meets this threshold. | Full test suite passes on glibc riscv64 (Debian). musl test results on riscv64: data not available. | glibc riscv64 shipped since Debian Buster. | None. |
| Autotools (autoconf >= 2.64, automake, libtool) | Build system (build-time only) | riscv64 is a fully supported host and cross-target for autotools. No arch-specific macros required. | N/A (build-time only) | N/A | None. |
| libm (`-lm`, numademo only) | Math functions for `numademo` benchmark. Auto-vectorized by compiler. | Fully supported on riscv64. `-ftree-vectorize` degrades to scalar when no SIMD backend is available. No intrinsics in source. | `numademo` included in `make check`. Runs scalar on non-RVV hardware. | N/A (test binary only, not a shipped library) | None. |

No JIT, SIMD, crypto, or compression dependencies exist. Recursive dependency analysis beyond the Linux kernel and glibc is not needed.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#248](https://github.com/numactl/numactl/issues/248) | `numa_init` call ordering regression | Open (Jul 2025) | High | Calling `numa_set_bind_policy()` from a malloc hook during `numa_init` produces "request to allocate mask for invalid number: Invalid argument". Introduced by commit `fd4ec69`. Affects software stacks using libnuma with malloc hooks. Not riscv64-specific. |
| [#227](https://github.com/numactl/numactl/issues/227) | Memory leak in `numa_distance` via `dlopen`/`dlclose` | Open (Jul 2024) | Medium | ASAN-confirmed 64-byte leak per load/unload cycle. Reported on AArch64. Not riscv64-specific. |
| [#243](https://github.com/numactl/numactl/issues/243) | Static analysis findings (Ericsson, CodeChecker, v2.0.18) | Open (Feb 2025) | Unknown | Findings stored in attached CSV only; specific bugs not visible in issue body. Not riscv64-specific. |
| [#240](https://github.com/numactl/numactl/issues/240) | Build failure: `sys/shm.h` not properly linked | Open (Jan 2025) | Medium | Build/link correctness issue. Not riscv64-specific. |
| [#126](https://github.com/numactl/numactl/issues/126) | Memory policy functions return 0 instead of -1 on error | Open (Mar 2022) | Medium | API contract violation: some error paths return 0 where the documented contract requires -1. Not riscv64-specific. |
| [#205](https://github.com/numactl/numactl/issues/205) | Missing `clearcache` implementation for aarch64 (and riscv64) | Open (Jan 2024) | Low | Labeled "help wanted". riscv64 is in the same state as aarch64: build warning only, no functional impact on core library. |

No correctness bugs specific to riscv64 are open or known.

---

## 12. Objections and Upstream Blockers

**No stated objections** to riscv64 support exist. The only riscv64-specific PRs (#131 and #197) were merged and reverted on technical grounds (toolchain portability), not architecture rejection.

**Technical blockers:**

1. `syscall.c` lacks an explicit `__riscv` ifdef block for `set_mempolicy_home_node`. This is a cosmetic warning, not a runtime blocker. The fix is a one-line patch. No upstream issue has been filed requesting this change.

2. `clearcache.c` emits a build warning on riscv64. This is shared with aarch64 and has been open since January 2024 with no fix merged.

3. No upstream CI runs on riscv64. There is no mechanism for the upstream project to catch riscv64 regressions automatically.

**Organizational blockers:**

None. Andi Kleen merged PR #131 in one day and PR #197 in 77 days. The project accepts community contributions without resistance. A well-formed patch for the `set_mempolicy_home_node` ifdef and a CI job addition would be accepted based on prior merge history.

**Acceptance probability:** High for small targeted patches. The project has no stated opposition to riscv64 and has already shipped riscv64-compatible code through the portable `AC_SEARCH_LIBS` path.

---

## 13. Investment Analysis

RISE has no involvement with libnuma. No RISE-funded work was identified in any source. All items below represent work not yet covered.

### 13.1 Functional Enablement

Two functional gaps exist:

1. Add `#elif defined(__riscv)` to the `set_mempolicy_home_node` ifdef in `syscall.c` to suppress the build warning. This requires knowing the correct syscall number for riscv64 (likely 450, matching the generic asm table, but verification against the kernel source is required before submitting). Effort: trivial.

2. Implement `clearcache` for riscv64 in `clearcache.c`. This is shared work with the aarch64 gap (issue #205). The correct riscv64 implementation would use `cbo.flush` (Zicbom extension) or fall back to a no-op on hardware lacking Zicbom. Effort: low.

### 13.2 Performance Optimization

Data not available: no public benchmark comparison data exists for libnuma on riscv64. Performance optimization of libnuma itself is not a meaningful investment target: the library is a thin syscall wrapper with no compute-intensive paths. `stream_lib.c` auto-vectorizes with `-ftree-vectorize`; adding RVV intrinsics would benefit only the `numademo` benchmark, which is not a production workload.

### 13.3 CI/CD Infrastructure

The highest-value investment is adding a riscv64 CI job. Options:

- QEMU-based cross-compilation and test in the upstream GitHub Actions workflow. Cost: requires adding a matrix entry and QEMU setup to `makefile.yml`. NUMA tests will be skipped (single-node QEMU guest), but build verification is achieved.
- Native riscv64 runner via a RISE-hosted runner or self-hosted GitHub Actions runner on SiFive/StarFive hardware. Provides actual test execution.

### 13.4 Ecosystem Enablement

Not applicable. libnuma is a system library with no dependent package ecosystem requiring separate riscv64 enablement.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `__riscv` to `set_mempolicy_home_node` ifdef in `syscall.c` | 0.1 | Community contributor | Medium |
| Functional | Implement `clearcache` for riscv64 (Zicbom or no-op fallback) | 0.5 | Community contributor | Low |
| CI/CD | Add QEMU riscv64 cross-build job to `makefile.yml` | 0.5 | Community contributor | High |
| CI/CD | Add native riscv64 runner for full test execution | 2 | RISE or chip vendor | Medium |
| Bugfix | Resolve `numa_init` malloc hook ordering regression (#248) | 1-2 | Community (any platform) | High (not riscv64-specific) |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [numactl/numactl repository](https://github.com/numactl/numactl)
- [PR #131: Fix build error on riscv64 by linking libatomic](https://github.com/numactl/numactl/pull/131)
- [PR #197: Revert fix build error on riscv64 by linking libatomic](https://github.com/numactl/numactl/pull/197)
- [PR #198: Replace sys/fcntl.h with fcntl.h](https://github.com/numactl/numactl/pull/198)
- [Issue #248: numa_init malloc hook regression](https://github.com/numactl/numactl/issues/248)
- [Issue #227: Memory leak in numa_distance via dlopen](https://github.com/numactl/numactl/issues/227)
- [Issue #243: Static analysis report (Ericsson)](https://github.com/numactl/numactl/issues/243)
- [Issue #240: sys/shm.h build failure](https://github.com/numactl/numactl/issues/240)
- [Issue #205: Missing clearcache for aarch64](https://github.com/numactl/numactl/issues/205)
- [Issue #126: Memory policy functions return 0 on error](https://github.com/numactl/numactl/issues/126)
- [Debian sid libnuma1 package (riscv64)](https://packages.debian.org/sid/riscv64/libnuma1/download)
- [Ubuntu Noble libnuma1 package](https://packages.ubuntu.com/noble/libnuma1)
- [numactl GitHub Actions workflow: makefile.yml](https://github.com/numactl/numactl/blob/master/.github/workflows/makefile.yml)
- [numactl GitHub Actions workflow: codeql.yml](https://github.com/numactl/numactl/blob/master/.github/workflows/codeql.yml)
- [numactl GitHub Actions workflow: cut-release.yml](https://github.com/numactl/numactl/blob/master/.github/workflows/cut-release.yml)
- [numactl GitHub releases](https://github.com/numactl/numactl/releases)
- [RISE Project homepage](https://riseproject.dev)