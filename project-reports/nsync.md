---
title: nsync
parent: Project Reports
---

# nsync

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for nsync<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

nsync is a low-level C/C++ synchronization library from Google providing mutexes, condition variables, and single-shot events. It is designed to be embedded in other projects (TensorFlow, gRPC, ONNX Runtime are known consumers) as a header-plus-source drop-in with no runtime external dependencies beyond a POSIX thread library and the OS futex interface.

**Governance.** There is no formal governance structure. The repository lives under the Google GitHub organization but is explicitly marked "not an official Google product." There is no CNCF, Apache, or Linux Foundation affiliation, no OWNERS or CODEOWNERS file, and no published tier policy for new platforms. Contributions are accepted via pull request at the sole discretion of the maintainer.

**Maintainer.** Mike Burrows (GitHub: `m3bm3b`) holds 45 of 62 commits and is the de-facto sole maintainer. He is also the original author. No organization is listed on his GitHub profile. All other contributors have exactly one commit each.

**Culture on new ports.** PR #18 (riscv32 futex fix) was merged within 3 days of submission. The maintainer engaged substantively during review, tested personally under qemu-riscv32, and requested only minor correctness improvements. Receptiveness to RISC-V fixes is high.

**RISE membership.** Google LLC is a Premier Member of RISE. nsync itself has no documented RISE affiliation, no RISE working group sponsorship, and does not appear in the RISE wheel builder list.

**Repository vitals.** License: Apache-2.0. Stars: 1,279. Forks: 90. Created: 2017-03-11. Last updated: 2026-08-10.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-06-15 | Native assembler atomics added for riscv32 and riscv64: `platform/riscv/cputype.h` and `platform/riscv/src/nsync_atm_riscv.s`. `tools/detect.c` updated to recognize `__riscv` macro. Author: Mike Burrows. | [Commit 5e8b19a](https://github.com/google/nsync/commit/5e8b19a81e5729922629dd505daa651f6ffdf107) |
| 2024-06-23 | riscv32 futex build failure fixed: `__NR_futex` aliased to `__NR_futex_time64` via new `NSYNC_NR_FUTEX` macro in `platform/linux/src/nsync_semaphore_futex.c`. Author: Clement Peron (clementperon). Reviewed and merged by Mike Burrows. | [PR #18](https://github.com/google/nsync/pull/18) |

The riscv64 assembler implementation is fully upstream and was contributed directly by the project maintainer. No porting work is pending for riscv64 correctness. The riscv32 futex fix was the only open correctness issue and it is resolved.

**Key contributors.** Mike Burrows (Google) provided the original riscv port. Clement Peron contributed the riscv32 futex fix; Peron's affiliation is not stated in the PR or GitHub profile [NEEDS VERIFICATION].

---

## 3. Upstream Support Tier

nsync has no published tier policy. There is no CI configuration of any kind in the repository (`.github/workflows/` returns HTTP 404; no `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml`). No architecture is formally tested upstream. The `builds/` directory contains named subdirectories for aarch64, alpha, arm, ia64, mips, parisc64, ppc64, s390x, sparc64, vax, x86_32, and x86_64 - none for riscv or riscv64. This directory holds local build configurations, not CI.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Hand-tuned assembly atomics | Yes | Yes | Yes (since 2018) |
| Bazel BUILD wired | Yes | Yes | Yes |
| CMake arch detection wired | Yes | Yes | No (missing branch) |
| `builds/` directory entry | Yes | Yes | No |
| Upstream CI | No | No | No |
| Official upstream binary | No | No | No |
| Distro package available | Yes | Yes | Yes (Debian, Ubuntu) |

The absence of upstream CI is not a riscv64-specific deficiency - it applies to all architectures. Correctness is delegated entirely to distro buildd infrastructure.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

nsync is a pure synchronization library. Its architecture-specific surface area is narrow: atomic operations (CAS, load, store with acquire/release ordering) and the OS semaphore backend. There is no JIT, no SIMD, no cryptography, and no garbage collector.

**Atomic operations.** The core primitive is `nsync_atomic_uint32_`, a 32-bit atomic type. Each architecture provides:
- `cputype.h`: declares `ATM_LD_IS_ACQ_ST_IS_REL_`, which tells the library whether plain loads/stores carry acquire/release semantics without explicit barriers.
- `nsync_atm_<arch>.s`: hand-written assembly implementing 8 primitives: `nsync_atm_cas_`, `nsync_atm_cas_acq_`, `nsync_atm_cas_rel_`, `nsync_atm_cas_relacq_`, `nsync_atm_load_`, `nsync_atm_load_acq_`, `nsync_atm_store_`, `nsync_atm_store_rel_`.

**riscv64 implementation.** `platform/riscv/cputype.h` sets `ATM_LD_IS_ACQ_ST_IS_REL_ 0`, which is correct: RISC-V's weak memory model requires explicit barriers. `platform/riscv/src/nsync_atm_riscv.s` (86 lines) implements all 8 primitives using `lr.w`/`sc.w` (32-bit load-reserved/store-conditional) with `.aq`/`.rl` suffixes for ordering, plus `amoswap.w.rl` for release stores. The 32-bit instruction variants are correct even on riscv64 because nsync's internal atom type is `uint32_t` on all platforms.

ISA extensions used: A (atomics) only. No RVV, no Zb* extensions, no compressed (C) directives.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `cputype.h` | Full | Full | Full |
| Atomic assembly (.s) | 61 lines, hand-tuned | 119 lines, hand-tuned | 86 lines, hand-tuned |
| `ATM_LD_IS_ACQ_ST_IS_REL_` value | 1 (TSO: free) | 0 (explicit barriers) | 0 (explicit barriers) |
| ISA extensions required | None beyond base | None beyond base | A extension only |
| OS semaphore backend | futex | futex | futex |
| Fallback (C11 builtins) | Not needed | Not needed | Used by CMake builds (gap) |

The implementation is complete and production-quality. There are no TODOs, FIXMEs, or stub comments in the riscv assembly file. The adversarial review confirmed all 8 primitives are implemented with correct barrier semantics.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Bazel (fully supported).** `@platforms//cpu:riscv64` is wired in the Bazel `BUILD` file to `platform/riscv`. riscv32 is present but commented out as not yet validated.

```
bazel build //:nsync --platforms=@platforms//cpu:riscv64,@platforms//os:linux
```

**CMake (partial gap).** The `CMAKE_SYSTEM_PROCESSOR` arch-detection block (lines 210-231) covers x86_64, x86_32, arm, aarch64, ppc32, ppc64 - riscv64 is absent. Building with CMake on a riscv64 host falls through to the default case, which omits `platform/riscv` from the include path. The build succeeds but uses the `platform/gcc` C11 `__atomic_*` builtins fallback rather than the hand-tuned assembly.

Workaround for CMake riscv64:

```
cmake .. -DCMAKE_C_FLAGS="-I/path/to/nsync/platform/riscv"
```

For cross-compilation, no toolchain file is provided. The caller must supply one setting `CMAKE_SYSTEM_NAME=Linux`, `CMAKE_SYSTEM_PROCESSOR=riscv64`, `CMAKE_C_COMPILER=riscv64-linux-gnu-gcc`, and the `-I platform/riscv` flag.

**make / mkmakefile.sh.** No `builds/riscv*.linux.gcc/` directory exists. `tools/mkmakefile.sh -arch riscv -os linux -cc gcc -atomic asm` can generate a correct Makefile because `platform/riscv/src/nsync_atm_riscv.s` exists. The `generic_unix/` build directory with `detect.sh` auto-detects riscv via the `__riscv` macro when invoked with a riscv64 cross-compiler (`CC=riscv64-linux-gnu-gcc make test`).

**Toolchain requirements.** GCC riscv64 support landed in GCC 7 (2017). nsync requires no GCC version beyond what the riscv64 toolchain itself demands. The `platform/gcc_new/atomic.h` path (GCC >= 4.7) covers all practical riscv64 GCC versions. Clang riscv64 support is stable from Clang 9 (2019). No `-march` or `-mabi` flags are set by nsync - the caller must supply these (standard Linux ABI: `-march=rv64gc -mabi=lp64d`).

**QEMU.** No QEMU integration exists in the repository. The maintainer tested PR #18 under `qemu-riscv32` manually. No automated QEMU test runner is wired into any build target.

**PR #21** (open, 2024-07-03) proposes adding GitHub Actions CI with QEMU-based riscv64 cross-compilation tests (`qemu-riscv64-static`, `g++-riscv64-linux-gnu` on `ubuntu-22.04`). This PR is not merged.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

nsync's feature surface is narrow. The complete feature matrix:

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Mutex (`nsync_mu`) | Yes | Yes | Yes |
| Condition variable (`nsync_cv`) | Yes | Yes | Yes |
| Note (single-shot event) | Yes | Yes | Yes |
| Waiter (per-thread, low-level) | Yes | Yes | Yes |
| Hand-tuned atomic assembly | Yes | Yes | Yes |
| Linux futex semaphore backend | Yes | Yes | Yes |
| Bazel build support | Yes | Yes | Yes |
| CMake build auto-detects arch | Yes | Yes | No (missing branch) |
| `builds/` make entry | Yes | Yes | No |
| Upstream CI | No | No | No |

**Functional gaps.** None. All synchronization primitives work correctly on riscv64.

**Performance gaps.** CMake-built riscv64 binaries use the `platform/gcc` C11 builtins fallback instead of the hand-tuned assembly when the riscv64 include path is not added manually. Whether the C11 builtins path produces materially different code from the hand-written `lr.w`/`sc.w` assembly is not quantified - no benchmark data exists for any platform including riscv64 (see Section 11).

**Security hardening.** Data not available: no sanitizer or hardening flag documentation exists in the repository, and no riscv64-specific hardening issues were found.

**NaN / floating-point.** Not applicable - nsync performs no floating-point arithmetic.

---

## 7. CI/CD Infrastructure

The upstream repository has no CI configuration of any kind. `.github/workflows/` returns HTTP 404. No `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml` exists. This is confirmed by direct GitHub API query.

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream GitHub Actions | No | No | No |
| `builds/` make matrix entry | Yes | Yes | No |
| Distro buildd (Debian) | Yes | Yes | Yes |
| Distro buildd (Ubuntu Noble) | Yes | Yes | Yes |
| RISE runner | No | No | No |
| QEMU automated testing | No | No | No |

**PR #21** (open 2024-07-03): proposes simple GitHub Actions CI with matrix including riscv64 cross-compilation via QEMU. Status: open, not merged, no review activity recorded in the research findings.

Testing for all architectures is entirely delegated to downstream distro buildd infrastructure. Debian's rv-osuosl-02 buildd machine is the only automated riscv64 test environment confirmed to have built nsync successfully.

---

## 8. Distribution and Release Status

Google publishes no binary releases for nsync. The GitHub releases list is empty. No release assets of any kind exist at the upstream repository.

**Debian.** `libnsync-dev` version 1.29.2-4+b1 is available for riscv64 in Debian sid/testing, built on Debian buildd machine `rv-osuosl-02`. Also packaged: `libnsync1t64` and `libnsync-cpp1t64`. riscv64 is a fully supported architecture at parity with amd64, arm64, ppc64el, and s390x.

**Ubuntu.** `libnsync1t64`, `libnsync-cpp1t64`, and `libnsync-dev` at version 1.26.0-2build1 are available for riscv64 in Ubuntu 24.04 Noble (universe repository), listed alongside amd64, arm64, armhf, ppc64el, and s390x.

**Arch Linux RISC-V.** Data not available: archriscv.felixc.at returned a connection error (ECONNREFUSED) during research. Package availability on Arch Linux RISC-V could not be confirmed.

**PyPI.** The PyPI package named "nsync" (version 0.0.1) is an unrelated Python project. It has only architecture-neutral files. Not relevant.

**What a user must do.** On Debian sid or Ubuntu 24.04: `apt install libnsync-dev` provides a working riscv64 build. On other distributions or for source builds with CMake, the user must add `-I platform/riscv` manually to `CMAKE_C_FLAGS` or use Bazel. No pre-built binary from Google exists for any platform.

---

## 9. Dependencies

nsync has no external library runtime dependencies. Its only dependencies are the OS, libc, and hardware atomics.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| Linux futex syscall (glibc) | Semaphore backend on Linux (`platform/linux/src/nsync_semaphore_futex.c`) | Builds. riscv64 uses `__NR_futex` (defined normally). riscv32-specific `__NR_futex` fix in PR #18. | No upstream CI. Debian buildd confirmed successful. | `libnsync-dev 1.29.2-4+b1` in Debian sid. | None open. |
| RISC-V atomic ops (`platform/riscv/`) | Hand-written CAS/load/store assembly using `lr.w`/`sc.w` with `.aq`/`.rl` ordering | Builds via Bazel (riscv64 wired). CMake falls back to `platform/gcc` C11 builtins (missing arch branch). | No upstream CI. | Same as above. | CMakeLists.txt missing riscv64 branch is a minor gap, not a correctness blocker. |
| pthreads / POSIX threads | `platform/posix/src/per_thread_waiter.c`, `start_thread.c`; CMake `find_package(Threads)` | Fully supported on riscv64 Linux. | Implicit in any build. | Provided by glibc. | None. |
| Bazel `platforms` package | Provides `@platforms//cpu:riscv64` config_setting | `platforms` 0.0.10 ships riscv64 support. | N/A | N/A | None. |
| CMake | Build system (optional) | Any modern CMake works on riscv64. | N/A | N/A | None. |

No JIT, SIMD, crypto, or numerics dependencies exist. Recursive dependency analysis is not applicable.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #18](https://github.com/google/nsync/pull/18) | platform: nsync futex: fix build on riscv32 | MERGED 2024-06-23 | Build blocker (riscv32 only) | `__NR_futex` undefined on riscv32 glibc (64-bit `time_t` from the start). Fixed by `NSYNC_NR_FUTEX` macro aliasing to `__NR_futex_time64`. Not a riscv64 issue. |
| [PR #19](https://github.com/google/nsync/pull/19) | Clean CMake | CLOSED, not merged 2024-06-30 | Low (packaging/Yocto only) | CMake `INTERFACE_INCLUDE_DIRECTORIES` absolute path leak when nsync is consumed via FetchContent. Affects riscv32 Yocto builds and potentially riscv64 Yocto builds. Fix was reviewed and approved by maintainer but PR closed because author could not confirm resolution before going offline. The underlying CMake defect remains unresolved. |
| [PR #21](https://github.com/google/nsync/pull/21) | Add a simple Github CI | OPEN 2024-07-03 | Infrastructure | Proposes GitHub Actions matrix CI with riscv64 cross-compilation via QEMU. Not merged, no activity noted in findings. |
| CMakeLists.txt | Missing riscv64 arch branch | Open, no issue filed | Low | Lines 210-231 of CMakeLists.txt handle x86_64, x86_32, arm, aarch64, ppc32, ppc64. riscv64 is absent. CMake builds on riscv64 silently bypass hand-tuned assembly and use C11 builtins fallback. |

**No open correctness bugs on riscv64.** All known correctness issues are resolved.

---

## 12. Objections and Upstream Blockers

No stated objections to riscv64 support exist in the issue tracker or PR history. The maintainer merged the riscv32 fix quickly and engaged substantively in review. The original riscv64 assembly was contributed by the maintainer himself in 2018.

**Technical blockers.** None for correctness. The CMakeLists.txt gap is a known minor issue with no open issue filed. The closed PR #19 (CMake FetchContent/Yocto packaging) represents unfinished work that could resurface for downstream Yocto-based riscv64 consumers.

**Organizational blockers.** Single-maintainer project. Any fix requires Mike Burrows' review and merge. Response time on PR #18 was 3 days; the project is actively maintained as of 2026-08-10.

**Acceptance probability for a CMakeLists.txt riscv64 fix.** High, given prior merge history and the maintainer's stated receptiveness to RISC-V patches.

---

## 13. Investment Analysis

RISE has no existing investment in nsync. No RISE working group, no RISE wheel builder coverage, no documented RISE-funded work exists for this project. All riscv64 work to date was contributed by the maintainer (2018) and by one community contributor (2024).

### 13.1 Functional Enablement

The only functional gap is the missing riscv64 branch in CMakeLists.txt. This is a one-line addition (mapping `riscv64` to `platform/riscv`) analogous to the existing aarch64 branch. Without this fix, CMake-built riscv64 binaries silently use C11 builtins instead of the hand-tuned assembly. This affects all downstream projects that consume nsync via CMake on riscv64 (including onnxruntime, as evidenced by the meta-onnxruntime issue referenced in PR #18).

The closed PR #19 (CMake FetchContent absolute path leak) is a secondary functional issue relevant to Yocto-based riscv64 build environments.

### 13.2 Performance Optimization

No benchmark data exists for nsync on any platform. The performance delta between the C11 builtins path and the hand-written `lr.w`/`sc.w` assembly on riscv64 is unmeasured. Given that the assembly implements the same logical operations with explicit ISA instructions vs. compiler-generated code, the gap is expected to be small for modern GCC targeting rv64gc. No performance optimization investment is justified without first establishing a baseline measurement.

### 13.3 CI/CD Infrastructure

PR #21 proposes the exact needed CI: GitHub Actions with `riscv64-linux-gnu-g++` cross-compilation and `qemu-riscv64-static` test execution on `ubuntu-22.04`. The PR is open and not merged. Effort to drive this PR to merge is low (the work is done; what is needed is review and iteration with the maintainer).

### 13.4 Ecosystem Enablement

Not applicable - nsync has no dependent package ecosystem. It is a library consumed directly by projects such as TensorFlow, gRPC, and ONNX Runtime. Those projects' riscv64 status is tracked in their own reports.

### 13.5 Summary Table

| Area | Work item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix CMakeLists.txt: add riscv64 branch mapping to `platform/riscv` | 0.1 | Community / Qualcomm | High |
| Functional | Reopen and complete PR #19: fix CMake INTERFACE_INCLUDE_DIRECTORIES for FetchContent/Yocto riscv64 consumers | 0.2 | Community / Qualcomm | Medium |
| CI/CD | Drive PR #21 to merge: GitHub Actions CI with QEMU riscv64 cross-compilation | 0.3 | Community / Qualcomm | High |
| Performance | Measure mutex round-trip latency on riscv64 hardware vs. arm64 and x86_64 to quantify assembly vs. C11 builtins delta | 0.5 | Community / Qualcomm | Low |

Total estimated effort: approximately 1.1 person-weeks. nsync's riscv64 support is already production-quality at the assembly and OS integration level. The remaining work is build-system plumbing and CI hygiene, not fundamental porting.

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [google/nsync repository](https://github.com/google/nsync)
- [Commit 5e8b19a: assembler atomics for s390x, RISC-V, and m68k](https://github.com/google/nsync/commit/5e8b19a81e5729922629dd505daa651f6ffdf107)
- [Commit 6948c2f: platform: nsync futex: fix build on riscv32](https://github.com/google/nsync/commit/6948c2f2d6f5b1b12b1801e53718b0850f163e0c)
- [PR #18: platform: nsync futex: fix build on riscv32](https://github.com/google/nsync/pull/18)
- [PR #19: Clean CMake (closed)](https://github.com/google/nsync/pull/19)
- [PR #21: Add a simple Github CI (open)](https://github.com/google/nsync/pull/21)
- [Downstream issue: meta-onnxruntime riscv32 build failure](https://github.com/NobuoTsukamoto/meta-onnxruntime/issues/3)
- [Debian tracker: nsync](https://tracker.debian.org/pkg/nsync)
- [Ubuntu 24.04 Noble: libnsync-dev package](https://packages.ubuntu.com/search?keywords=nsync&suite=noble)
- [RISE Project member list](https://riseproject.dev/)