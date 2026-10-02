---
title: tcmalloc
parent: Project Reports
color: orange
dependencies:
  - name: Abseil
    relation: runtime-dependency
    criticality: critical
  - name: Protocol Buffers
    relation: runtime-dependency
    criticality: critical
  - name: re2
    relation: runtime-dependency
    criticality: optional
  - name: googletest
    relation: test-dependency
    criticality: optional
  - name: benchmark
    relation: test-dependency
    criticality: optional
  - name: fuzztest
    relation: test-dependency
    criticality: optional
  - name: Bazel
    relation: build-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="tcmalloc" %}

# tcmalloc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-01<br/>
**Readiness:** orange (downstream-only)<br/>
**Optimization level:** absent<br/>
**Scope:** RISC-V (riscv64/linux) support status for tcmalloc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[tcmalloc](https://google.github.io/tcmalloc/) (Thread-Caching Malloc) is Google's high-performance memory allocator, designed to reduce malloc/free latency by maintaining per-CPU lock-free slabs via Linux Restartable Sequences (RSEQ), with a per-thread cache as the fallback path. It is used in production across Google's infrastructure for latency-sensitive workloads.

The repository at [github.com/google/tcmalloc](https://github.com/google/tcmalloc) is a mirror of Google's internal Piper monorepo, synced to `main` via Copybara as direct commits. External pull requests are accepted into review but merge authority rests entirely with Google's internal engineering team; `CONTRIBUTING.md` states: "The current members of the TCMalloc engineering team are the only committers at present." Google-internal contributors are explicitly told it is "preferable to first create an internal CL" and let the internal code-propagation pipeline push the change to GitHub. No `MAINTAINERS`, `OWNERS`, or `CODEOWNERS` file exists in the repository. There is no foundation affiliation (not Apache, CNCF, or Linux Foundation); conduct is governed by [Google's Open Source Community Guidelines](https://opensource.google/conduct/). The license is Apache 2.0. The project is explicitly disclaimed as "not an officially supported Google product."

Primary maintainers identified from commit history:

| Contributor | GitHub handle | Affiliation | Commits |
|---|---|---|---|
| Chris Kennelly | ckennelly | Google | 1,228 |
| Vaibhav Gogte | v-gogte | Google | 351 |
| Dmitry Vyukov | dvyukov | Google, Munich | 179 |
| Nilay Vaish | nilayvaish | Google | 103 |
| Martin Maas | martinmaas | Google | 22 |

Note: Martin Maas is a known Google RISC-V researcher [NEEDS VERIFICATION of current role], but no RISC-V-specific commit or issue in the tcmalloc repository is attributed to him. All riscv64-touching commits (see Section 2) were authored by a single engineer, Saleem Abdulrasool.

**RISE Project involvement:** none. Google LLC is a Premier Member of the [RISE Project](https://riseproject.dev/members/), alongside Alibaba Damo, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, and Tenstorrent (RISE's General Members include Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin/ByteDance, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, and ZTE). This membership is corporate-level only: `google/tcmalloc` itself has no RISE project listing, no RISE blog coverage, and no RISE-funded work. A crawl of the RISE blog index and a targeted search of the System Libraries Working Group's tracking surfaces found zero mentions of tcmalloc. RISE's only documented connection to this project is indirect: its own ecosystem-tracking repository, `riseproject-dev/sw-ecosystem`, authors readiness-assessment reports about tcmalloc (such as this one and its predecessor) - this is research/cataloging activity, not sponsorship, code contribution, or CI provisioning.

Community posture on new architecture ports is conservative and ad hoc: all RISC-V enablement came from one Google-internal engineer in 2021-2023, routed entirely through direct `main`-branch commits (Piper/Copybara), never through a GitHub pull request or tracking issue. There is no evidence of an RFC, a community-driven port proposal, or any external contributor involvement in the riscv64 work. The project does not solicit or organize community porting efforts, and riscv64 has never been promoted to an official support tier (Section 3).

## 2. Port History and Upstreaming Timeline

All riscv64-related changes entered the public repository as direct Copybara-exported commits to `main`, with no associated GitHub pull request and no public review thread. Nine commits touch riscv64, spanning just over two years, all from one author:

| Date | Commit | Event | Author |
|---|---|---|---|
| 2021-08-16 | [c730bdc](https://github.com/google/tcmalloc/commit/c730bdcd83af0381c094aca690ee2c5e96189287) | "add initial support for RISCV targets" - foundational commit adding the basic constants (`kAddressBits`, `kHugePageShift`) needed to build tcmalloc for RISC-V 64-bit Linux | Saleem Abdulrasool (compnerd, abdulras@google.com) |
| 2021-08-26 | [f2096849 (1st)](https://github.com/google/tcmalloc/commit/0f7596195f580b3fac6a815ce59704960f6f7082) | "tcmalloc: repair the RISC-V build" - fixed `SharededTransferCache` referencing `__rseq_abi.cpu_id` inline instead of via the `RseqCpuId` wrapper, which broke non-RSEQ (RISC-V) builds | Saleem Abdulrasool |
| 2021-09-08 | [f4e1fb0](https://github.com/google/tcmalloc/commit/f4e1fb0bc6483e7d606894f085646616792ec8b2) | "tcmalloc: repair !TCMALLOC_PERCPU_USE_RSEQ builds" - guarded unguarded `__rseq_abi` references breaking non-RSEQ targets | Saleem Abdulrasool |
| 2021-09-15 | [f2096849 (2nd)](https://github.com/google/tcmalloc/commit/f20b9468a107b2002d4d558c6a2bcf161d70e538) | "tcmalloc: repair the percpu_tcmalloc related tests on RISC-V" - follow-up fix for a missed `__rseq_abi` reference in test targets | Saleem Abdulrasool |
| 2021-12-20 | [54c1f7b](https://github.com/google/tcmalloc/commit/54c1f7bc61db8888a67dc62288c522e8e6a6f630) | "tcmalloc: correct declaration for non-RSEQ platforms" - fixed a declaration/implementation mismatch between RSEQ-capable (x86_64/AArch64) and non-RSEQ (RISC-V) code paths | Saleem Abdulrasool |
| 2022-01-18 | [cefed7bf](https://github.com/google/tcmalloc/commit/cefed7bf7d696a251a98d58a158bdd565ab1eb36) | "tcmalloc: repair the build for non-rseq enabled platforms" - fixed an integral type conversion for `shift` breaking the RISC-V build | Saleem Abdulrasool |
| 2022-02-03 | [7ae2052](https://github.com/google/tcmalloc/commit/7ae2052200270cf1bd3e37f845e2c05d14b79aaf) | "tcmalloc: skip rseq tests on non-rseq targets" - skips restartable-sequence tests on RISC-V | Saleem Abdulrasool |
| 2023-08-25 | [8f84341](https://github.com/google/tcmalloc/commit/8f84341cb4b91eb025e66e55f6cbb83c8b1c62ea) | Fix an "unused variable" warning (`kPointerBits`) in `config_test.cc` on RISC-V | Saleem Abdulrasool |
| 2023-09-12 | [56e8b05](https://github.com/google/tcmalloc/commit/56e8b05f021b33883d881a69094816374e6c1497) | Fix typos in `memory_errors_test.cc` for RISC-V | Saleem Abdulrasool |

No commit, issue, or pull request touching riscv64 exists after 2023-09-12 - the port has been dormant for roughly three years. All nine changes are fully present on `main` (they are the only history that exists). None of them add the per-CPU RSEQ fast-path assembly (Section 4); all are build/test breakage repairs for a target that was declared buildable in the first commit and never extended further. No tracking issue for a complete riscv64 port exists, open or closed, and GitHub's own issue search (`q=riscv`) returns zero results against this repository.

## 3. Upstream Support Tier

The official platform support matrix is documented in [`docs/platforms.md`](https://github.com/google/tcmalloc/blob/master/docs/platforms.md):

| Architecture | Official Status |
|---|---|
| x86-64, Linux, 64-bit, LE | Supported |
| AArch64, Linux, 64-bit, LE | Supported |
| PPC, Linux, 64-bit, LE | Best effort |
| riscv64 | Not listed |

riscv64 is absent from both tiers. `docs/platforms.md` also states the repo-wide compiler floor (GCC 12.1+/Clang 11.0+, enforced in `tcmalloc/internal/config.h`), which is not architecture-specific and applies equally on riscv64.

| Evidence | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in `docs/platforms.md` | Yes (Supported) | Yes (Supported) | No |
| CI job exists (`.github/workflows/ci.yml`) | Yes (matrixed) | No (same x86_64-only job builds the repo, but no arm64 runner) | No |
| Per-CPU RSEQ assembly | Yes | Yes | No |
| Release artifacts (GitHub) | N/A - zero releases for any architecture | N/A | N/A |
| Genuine downstream distro build of this repo | N/A - not independently confirmed | N/A | No (see Section 8: the only riscv64 package sharing the name is sourced from the unrelated `gperftools` project) |

tcmalloc ships no prebuilt binaries of any kind, for any architecture; the GitHub releases page states "There aren't any releases here." All distribution is via source build or via downstream packagers who build independently (and, in the one riscv64-relevant case found, build a different codebase entirely - see Section 8).

## 4. Technical Architecture and RISC-V-Specific Subsystems

### Per-CPU RSEQ Slab Allocator

tcmalloc's primary performance differentiator is its lock-free per-CPU memory slab, implemented via Linux Restartable Sequences (RSEQ). Each supported architecture requires a hand-written assembly file:

| Arch | File | Lines | Content |
|---|---|---|---|
| x86_64 | [`tcmalloc/internal/percpu_rseq_x86_64.S`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu_rseq_x86_64.S) | 362 | Hand-written RSEQ assembly implementing the lock-free per-CPU push/pop/cmpxchg fast path |
| aarch64 | [`tcmalloc/internal/percpu_rseq_aarch64.S`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu_rseq_aarch64.S) | 377 | Hand-written RSEQ assembly, same lock-free design |
| riscv64 | none | - | No `percpu_rseq_riscv*.S` exists anywhere in the repository |

The platform guard in [`tcmalloc/internal/percpu.h`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu.h):

```c
#define TCMALLOC_PERCPU_RSEQ_SUPPORTED_PLATFORM \
  (defined(__linux__) && (defined(__x86_64__) || defined(__aarch64__)) && \
   !TCMALLOC_INTERNAL_PERCPU_HWASAN)
```

riscv64 is not in this list, so `TCMALLOC_INTERNAL_PERCPU_USE_RSEQ` is hard-compiled to `0` for riscv64 builds. As a direct consequence, `IsFast()` (`percpu.h`, around lines 341-344) unconditionally returns `false` on riscv64, and `cpu_cache.cc`'s gate (`if (Parameters::per_cpu_caches() && subtle::percpu::IsFast())`) never activates the per-CPU cache. Every call site that would otherwise use the riscv64 "RSEQ implementation" instead lands in [`tcmalloc/internal/percpu_rseq_unsupported.cc`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu_rseq_unsupported.cc) (64 lines), whose entry points are hard-abort stubs:

```cpp
static void Unsupported() { TC_BUG("RSEQ function called on unsupported platform."); }
int TcmallocSlab_Internal_PerCpuCmpxchg64(...) { Unsupported(); return -1; }
```

These stubs are dead code in practice (they are gated behind `IsFast()`, always false on riscv64), so there is no crash risk - but there is also zero riscv64-specific fast-path code of any kind, hand-tuned or otherwise. Allocation on riscv64 permanently runs through the legacy, mutex/TLS-list `ThreadCache` path (`tcmalloc/thread_cache.cc`, 438 lines, and `thread_cache.h`, 271 lines) - tcmalloc's original, pre-per-CPU-cache design, functionally complete and correct, but architecturally the weakest of the three "supported" targets.

The Linux kernel has exposed the `rseq` syscall on riscv64 since v4.18, and glibc 2.35+ registers rseq per-thread; the kernel/libc-side infrastructure to build a riscv64 RSEQ path exists. The gap is entirely in tcmalloc's own assembly.

### Platform Constants

[`tcmalloc/internal/config.h`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/config.h) has riscv64-specific ifdefs:

```cpp
#elif defined __riscv && defined __linux__
inline constexpr int kAddressBits = 48;
...
#elif defined __riscv && defined __linux__
static constexpr size_t kHugePageShift = 21;
```

These values (48-bit VA, 2 MiB huge pages) match the aarch64 branch and are correct for sv48 RISC-V Linux, but no architectural justification or citation is given in the comment - this is a constant reused from aarch64, not a measured/tuned riscv64 value.

### Prefetch

[`tcmalloc/internal/prefetch.h`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/prefetch.h): x86_64 uses inline `PREFETCHW` assembly. riscv64 receives only the generic `__builtin_prefetch` - no RISC-V-specific prefetch intrinsics (e.g. no Zicbop `prefetch.r`/`prefetch.w`).

### Cache Topology

[`tcmalloc/internal/cache_topology.cc`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/cache_topology.cc): aarch64 has an L3-identification fallback path. riscv64 uses the generic sysfs path only.

### SEGV Handler

[`tcmalloc/segv_handler.cc`](https://github.com/google/tcmalloc/blob/master/tcmalloc/segv_handler.cc) determines read-vs-write access on a fault for use-after-free/overflow diagnostics. The riscv64 branch is an explicit, self-admitted gap: `// __riscv is NOT (yet) supported` - the function returns `WriteFlag::Unknown` on riscv64. This affects only diagnostic error-message wording on SEGV, not correctness or memory safety. Two corresponding test-side guards in `tcmalloc/testing/memory_errors_test.cc` skip asserting on the read/write label on riscv64.

### ISA Extensions

Zero usage of any RISC-V ISA extension anywhere in the repository: no RVV vector intrinsics, no Zba/Zbb/Zbc/Zbs bitmanip, no Zicbop prefetch hints, no inline assembly of any kind for riscv64. The only riscv64-touching files in the entire codebase are five small preprocessor-guard sites: `tcmalloc/tcmalloc.cc`, `tcmalloc/segv_handler.cc`, `tcmalloc/internal/config.h`, and two test files (`tcmalloc/testing/tcmalloc_test.cc`, `tcmalloc/testing/memory_errors_test.cc`). `__aarch64__` appears in 16 files and `__x86_64__` in 15 files, versus `__riscv` in 5.

### Summary Comparison Table

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Platform constants (`kAddressBits`, `kHugePageShift`) | Full | Full | Full (reused aarch64 values) |
| Per-CPU RSEQ slab assembly | Full (hand-tuned, 362 lines) | Full (hand-tuned, 377 lines) | Missing - `IsFast()` compiled to always-false, crash-stub file unreachable in practice |
| RSEQ platform flag | 1 | 1 | 0 |
| Prefetch hints | Hand-tuned inline asm (`PREFETCHW`) | `__builtin_prefetch` | `__builtin_prefetch` |
| Cache topology | Generic sysfs | aarch64 L3 fallback + sysfs | Generic sysfs |
| SEGV read/write fault classification | Implemented | Implemented | Not implemented (`WriteFlag::Unknown`) |
| SIMD / vector usage | None | None | None |
| ISA extension usage | SSE/AVX (prefetch only) | None | None |
| CI validation | Yes | No (same x86_64-only job) | No |

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems:** Bazel (primary, official) and CMake ("experimental" per README).

**Compiler minimums**, enforced in `tcmalloc/internal/config.h` and stated in `docs/platforms.md`, repo-wide and not architecture-specific:
- GCC 12.1 or later (hard compile error below this)
- Clang 11.0 or later (hard compile error below this)
- C++17 required

**Bazel build (self-hosted on a riscv64 machine):**

```bash
bazel test //tcmalloc/...
```

No cross-compilation toolchain file exists in the repository for any non-x86_64 target: no `cmake/riscv64.cmake`, no `cmake/toolchain-riscv64.cmake`. No QEMU reference (`qemu`, `qemu-riscv64`, `binfmt`) appears anywhere in the codebase, CI scripts, or documentation.

**CMake build** (from `ci/linux_gcc-latest_libstdcxx_cmake.sh`, x86-only in current CI use):

```bash
cmake /tcmalloc \
  -DABSL_GOOGLETEST_DOWNLOAD_URL=... \
  -DBUILD_SHARED_LIBS=... \
  -DABSL_BUILD_TESTING=ON \
  -DCMAKE_BUILD_TYPE=... \
  -DCMAKE_CXX_STANDARD=17 \
  -DCMAKE_MODULE_LINKER_FLAGS="-Wl,--no-undefined"
make -j$(nproc)
ctest
```

`CMakeLists.txt` uses `FetchContent` for googletest, abseil-cpp, protobuf, re2, benchmark, and fuzztest; sets `CMAKE_CXX_STANDARD 17`. No architecture conditionals, no toolchain-file includes, no `riscv` string anywhere, and no `-DUSE_*=OFF`-style component toggles exist in this file or in the helper cmake files (`tcmalloc_helpers.cmake`, `tcmalloc_variants.cmake`).

`ci/docker_toolchain/` is a placeholder "standalone fallback toolchain module when building outside the Docker container" (an empty Bazel `filegroup`) - not a riscv64-specific toolchain.

**No BUILDING.md, INSTALL, docs/building.md, docs/cross-compilation.md, Dockerfile, or `.ci/docker/` directory of any kind exists in the repository.** A GitHub code search for `riscv64 repo:google/tcmalloc filename:Dockerfile` returns 0 results.

**Known build failure history:** of the nine riscv64 commits (Section 2), seven are build/test repairs triggered by changes elsewhere in the codebase breaking the non-RSEQ path (commits `f2096849`x2, `f4e1fb0`, `54c1f7b`, `cefed7bf`, `7ae2052`, `8f84341`, `56e8b05`). This pattern - repeated reactive breakage between August 2021 and February 2022, then two minor fixes in 2023 - is consistent with riscv64 having no CI coverage: breakage is discovered only when someone external notices and reports it, not automatically. No build failure has been reported since September 2023, but absence of reports is not evidence of a working build, given there is no CI to generate one.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional Gaps

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| Per-CPU RSEQ slab allocator (lock-free fast path) | Yes | Yes | No - thread-cache fallback only | Critical: primary performance differentiator unavailable |
| Per-CPU cache activation (`IsFast()` returns true) | Yes | Yes | No | Critical |
| Huge page support (2 MiB) | Yes | Yes | Yes (constant set) | None |
| 48-bit VA space support | Yes | Yes | Yes (constant set) | None |
| SEGV read/write fault classification | Yes | Yes | No (`WriteFlag::Unknown`) | Minor - diagnostics only |
| glibc 2.35+ rseq registration conflict (tracked separately, see Section 9/11) | Workaround required | Workaround required | N/A - RSEQ not used on riscv64 at all | Informational |
| kernel-6.19 RSEQ "event setting" regression (issue [#292](https://github.com/google/tcmalloc/issues/292)) | Affected | Affected | Not affected (RSEQ path unused on riscv64) | Informational |

### Performance Gaps

The per-thread cache fallback used exclusively on riscv64 is the older, slower allocation strategy; tcmalloc's own design rationale for introducing the per-CPU RSEQ path is contention reduction at high thread counts, a problem the fallback path does not solve. No published benchmark comparing riscv64 vs amd64 or arm64 allocation throughput, latency, or thread-scalability was found in any searched source (GitHub, general web search, or riseproject.dev). An unrelated, low-confidence third-party benchmark of mimalloc/jemalloc/tcmalloc performance (not RISC-V, not from a known benchmarking authority) was found during research and is explicitly excluded here as uncorroborated.

Data not available: published throughput, latency, or contention numbers for tcmalloc on riscv64 at any thread count, from any source.

### Security Hardening Gaps

No RISC-V-specific security hardening is present. The RSEQ-based slab provides implicit properties (per-CPU isolation of fast-path state) on x86_64 and aarch64 that are architecturally absent on riscv64 because the fast path itself is absent. No specific CVE or documented hardening delta for riscv64 was found.

## 7. CI/CD Infrastructure

**riscv64 CI does not exist.** Confirmed by direct read of a fresh clone (HEAD `1e83be2453fa96511d9a726a012600e651003fe5`) of the entire repository: `.github/workflows/` contains exactly two files, `ci.yml` and `stale.yml`; no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere. A case-insensitive, repo-wide search for `riscv`/`RISCV`/`RISC-V` returns zero matches in any CI or workflow configuration file; the only 16 matches in the whole repository are the C++ preprocessor guards described in Section 4, none of them CI-related.

`.github/workflows/ci.yml` (the active, GitHub-Actions-driven CI; full content):
- Triggers: `schedule` (hourly cron `0 * * * *`), `push` on `master`, `pull_request` on `master`, `workflow_dispatch`.
- Single job `linux`, `runs-on: ubuntu-24.04` (a standard x86_64 GitHub-hosted runner), executing inside container `gcr.io/google.com/absl-177019/gloop-linux-toolchain-latest`.
- Matrix: `toolchain: [clang, gcc, libstdc++]` x `compilation_mode: [opt, fastbuild]` x `exceptions: [-fexceptions, -fno-exceptions]` - 12 job combinations, all x86_64.
- Runs `bazel test ...` natively on the runner. No QEMU step, no cross-compilation flag, no `--platforms=`/`--cpu=riscv64` targeting, no architecture matrix dimension of any kind.
- A second job, `all-blocking-tests`, is an aggregator used by the internal Copybara presubmit check.

`.github/workflows/stale.yml`: daily cron, closes stale PRs via `actions/stale`; no build/test/architecture content.

The repository also carries a separate, older set of shell-based CI scripts in `ci/` (`ci/linux_docker_containers.sh`, `ci/linux_gcc-latest_libstdcxx_cmake.sh`), defining additional Docker images:

| Variable | Image | Architecture |
|---|---|---|
| `LINUX_ALPINE_CONTAINER` | `gcr.io/google.com/absl-177019/alpine:20230612` | x86-64 |
| `LINUX_CLANG_LATEST_CONTAINER` | `gcr.io/google.com/absl-177019/linux_hybrid-latest:20260131` | x86-64 |
| `LINUX_ARM_CLANG_LATEST_CONTAINER` | `gcr.io/google.com/absl-177019/linux_arm_hybrid-latest:20260131` | AArch64 |
| `LINUX_GCC_LATEST_CONTAINER` | `gcr.io/google.com/absl-177019/linux_hybrid-latest:20260131` | x86-64 |
| `LINUX_GCC_FLOOR_CONTAINER` | `gcr.io/google.com/absl-177019/linux_hybrid-latest:20260131` | x86-64 |

No `LINUX_RISCV*` container is defined in either CI mechanism. No QEMU-based riscv64 emulation stage, no self-hosted riscv64 runner, and no RISE-provided runner is referenced anywhere in the repository.

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner exists | Yes (`ci.yml`, GitHub-hosted) | Yes (ARM Docker image defined, not wired into `ci.yml`'s matrix) | No |
| Build tested | Yes | Not confirmed to run in `ci.yml` | No |
| Tests executed | Yes | Not confirmed to run in `ci.yml` | No |
| RSEQ path exercised | Yes | Yes (if run) | N/A - no RSEQ path exists |
| RISE runners | No | No | No |

## 8. Distribution and Release Status

**GitHub Releases:** zero, confirmed by direct fetch of the releases page ("There aren't any releases here"). `google/tcmalloc` is source-only, distributed exclusively via Bazel/CMake checkout; no binary or source release assets exist for any architecture.

**PyPI:** no package named `tcmalloc` exists (`https://pypi.org/pypi/tcmalloc/json` and `https://pypi.org/simple/tcmalloc/` both return HTTP 404). Not applicable as a distribution channel for this C++ library.

**RISE wheel builder:** not applicable; the RISE Python wheel builder at [riseproject.gitlab.io](https://riseproject.gitlab.io/python/wheel_builder/) does not list tcmalloc (nor could it, since no such PyPI package exists), and the GitLab PyPI-proxy endpoint for `tcmalloc` 302-redirects to the (404) upstream PyPI URL.

**Arch Linux:** not packaged at all, on any architecture; `archriscv.felixc.at` search for tcmalloc/libtcmalloc/gperftools returns zero results.

**Ubuntu/Debian packages - critical distinction:** Ubuntu 26.04 (resolute) does list riscv64-architecture binary packages matching the name "tcmalloc": `libtcmalloc-minimal4t64` 2.18.1-1, `librust-tcmalloc-dev` 0.3.0-2, and `librust-tcmalloc-sys-dev` 0.3.0-1, all built for `amd64 arm64 armhf ppc64el riscv64 s390x`. **However, these packages are sourced from `gperftools`, not from `google/tcmalloc`.** The `libtcmalloc-minimal4t64` package page explicitly states `Source: google-perftools`, homepage `https://github.com/gperftools/gperftools`. gperftools is a separate, older, community-maintained codebase (the pre-2015 open-source release of classic TCMalloc); it shares a library name with `google/tcmalloc` but has had independent development since the two projects diverged. No Ubuntu, Debian, or other distro package anywhere in the channels checked (Ubuntu archive search, Arch RISC-V repository, PyPI, GitHub Releases) builds a binary from the `google/tcmalloc` source tree for riscv64, or for any architecture. The "no genuine downstream build of this repo exists for riscv64" finding in Section 13 rests on this distinction.

gperftools achieved its riscv64 support independently and progressively: build fixes in 2.8.1 (Dec 2020), a frame-pointer backtracer in 2.9rc (Feb 2021), and "Linux/riscv fully supported" declared in 2.11rc (Jul 2023); [gperftools issue #1359](https://github.com/gperftools/gperftools/issues/1359) ("Broken on riscv64: Cannot calculate stack trace") is closed (Jul 2023, fixed by the generic frame-pointer unwinder). A performance regression, [gperftools issue #1278](https://github.com/gperftools/gperftools/issues/1278), reports the `generic_fp` unwinder used on riscv64 is 4-8x slower than the native x86 unwinder, open since May 2021. A rejected pagesize-handling patch, [gperftools PR #1269](https://github.com/gperftools/gperftools/pull/1269) (conditional pagesize for 64 KB kernel pages, relevant to some riscv64 kernel configurations), was closed without merge in Dec 2022.

**To obtain a working binary:**
- For `google/tcmalloc` (the project under assessment): build from source on a riscv64 host with GCC 12.1+/Clang 11+ and Bazel. The per-CPU RSEQ fast path will not be active; the per-thread fallback runs instead.
- For `gperftools` (a different, older project): install `libtcmalloc-minimal4t64` from the Ubuntu or Debian archive.

## 9. Dependencies

Direct dependencies of `google/tcmalloc`, as declared in `MODULE.bazel` (versions as of the 2026-10-01 live check: abseil-cpp 20260526.0, protobuf 34.0, re2 2025-11-05.bcr.1, googletest 1.17.0.bcr.2, google_benchmark 1.9.5, fuzztest 20260629.0) and `CMakeLists.txt` (`FetchContent` for the same six libraries), plus the build toolchain itself:

| Dependency | Role | Relation / Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Blocking issues |
|---|---|---|---|---|---|---|
| Abseil | Logging, sync primitives, CRC32C, hash tables, stack traces, cycle clock, string utilities | runtime-dependency, critical | Builds from source on riscv64 | Partial - open [#1702](https://github.com/abseil/abseil-cpp/issues/1702) "Can't link using riscv64 toolchain" and open [#1236](https://github.com/abseil/abseil-cpp/issues/1236) "RISCV ILP32E does not mandate 16-byte alignment"; a previously-reported sampler-test segfault, [#2002](https://github.com/abseil/abseil-cpp/issues/2002), was not independently re-confirmed this session [NEEDS VERIFICATION] | Source only, no riscv64 binary artifacts | Zbc-based CRC32C hardware acceleration not yet merged ([#1986](https://github.com/abseil/abseil-cpp/issues/1986)); `ABSL_HAVE_UNSCALED_CYCLECLOCK_IMPLEMENTATION = 0` on riscv64 (no hardware cycle counter, profiling uses fallback clock) |
| Protocol Buffers | Profile-proto serialization, profile builder | runtime-dependency, critical | Builds from source | No dedicated riscv64 CI found | No riscv64 `protoc` prebuilt binary; source build only | Historical tracking issues [#12266](https://github.com/protocolbuffers/protobuf/issues/12266) ("Add riscv64 support"), [#14549](https://github.com/protocolbuffers/protobuf/issues/14549) ("Build fails on RISCV"), and [#17798](https://github.com/protocolbuffers/protobuf/issues/17798) ("Maven central protoc prebuilts for riscv64") are all closed; no currently-open riscv64 issue found live |
| re2 | Regular-expression matching, pulled in indirectly via Abseil | runtime-dependency, optional | No known build issues | No riscv64-specific failures found | Source only | None identified |
| googletest | Test framework | test-dependency, optional | Builds on riscv64 | Open [#3756](https://github.com/google/googletest/issues/3756) "GetThreadCountTest.ReturnsCorrectValue fails on risc-v64", filed 2022, still open | Source only | Test-only; does not affect tcmalloc's own runtime build |
| benchmark (google/benchmark) | Microbenchmark harness | test-dependency, optional | No riscv64-specific build issue found live | No riscv64-specific failures found | Source only | None blocking identified |
| fuzztest | Fuzz-testing harness | test-dependency, optional | No issues found | No riscv64-specific issues found | Source only | None identified |
| Bazel | Primary, official build system | build-dependency, critical | Data not available: Bazel's own riscv64 host-build support was not independently researched this session; tcmalloc's own `ci.yml` Bazel jobs run x86_64 only | Not covered by any riscv64 CI job | N/A (tool, not a library release) | None identified specific to tcmalloc's use |
| CMake | Secondary build system, explicitly "experimental" per README | build-dependency, optional | `CMakeLists.txt` has no riscv64-specific conditionals or toolchain file; not exercised by any riscv64 CI | Not covered by any riscv64 CI job | N/A | None identified specific to tcmalloc's use |
| GCC | Toolchain, minimum 12.1 enforced in `config.h` (not riscv64-specific) | build-dependency, critical | Data not available: no live research on GCC's riscv64 backend quality was performed; the 12.1+ floor is a repo-wide requirement, not a riscv64-specific finding | Not covered by any riscv64 CI job | N/A | None identified specific to tcmalloc's use |
| LLVM | Toolchain, minimum Clang 11.0 enforced in `config.h` (not riscv64-specific) | build-dependency, critical | Data not available: no live research on LLVM/Clang's riscv64 backend quality was performed; the 11.0+ floor is a repo-wide requirement, not a riscv64-specific finding | Not covered by any riscv64 CI job | N/A | None identified specific to tcmalloc's use |

**Dependency depth note:** Abseil's unresolved riscv64 linking issue (#1702) and alignment issue (#1236), plus its missing hardware cycle counter on riscv64, are the most load-bearing dependency-side risks, since they are runtime-critical and touch tcmalloc's own profiling and synchronization primitives. Protobuf's riscv64 history is better resolved (all tracked issues closed), though no `protoc` riscv64 prebuilt exists, forcing a source build. None of the six functional (non-toolchain) dependencies has a currently open, release-blocking riscv64 issue; tcmalloc's own riscv64 gap (Section 4) is an enablement gap internal to this repository, not something inherited from a dependency.

## 11. Known Bugs and Active Issues

### google/tcmalloc (upstream)

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| - | No riscv64-specific issue exists | - | - | Confirmed via `search_issues`/`search_pull_requests` ("riscv", "riscv64", "RISC-V") against `repo:google/tcmalloc`, and via GitHub's own issue search (`?q=riscv`): zero results in all cases |
| [#144](https://github.com/google/tcmalloc/issues/144) | glibc 2.35 rseq registration conflict | Open (updated Jan 2026) | High (amd64/arm64) | Workaround: `GLIBC_TUNABLES=glibc.pthread.rseq=0`. Not a current riscv64 issue since RSEQ is not used there at all, but is a prerequisite for ever enabling per-CPU caches on riscv64 in the future |
| [#286](https://github.com/google/tcmalloc/issues/286) | High spin lock activity and slow performance | Open (Oct 2025) | Medium | Not riscv64-specific |
| [#292](https://github.com/google/tcmalloc/issues/292) | RSEQ-related crashes since linux-6.19 | Opened Mar 2026, reported closed | High at the time | tcmalloc violated the upstream RSEQ ABI; kernel commit `39a167560a61` ("rseq: Optimize event setting") broke an undocumented assumption, causing a CHECK failure at `percpu_tcmalloc.h:852`. Affects RSEQ-capable architectures (x86_64/aarch64); riscv64 is unaffected because it never activates the RSEQ path. Broader context: [LWN "Restartable sequences, TCMalloc, and Hyrum's Law"](https://lwn.net/Articles/1070072/) and the follow-up [LWN "Fixing the TCMalloc regression with RSEQ operations"](https://lwn.net/Articles/1092555/) (Sept 2026), covering a proposed kernel-side RSEQ-operations API, still RFC as of that writing |

### gperftools (the unrelated, downstream-packaged "tcmalloc" - Section 8)

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [gperftools #1359](https://github.com/gperftools/gperftools/issues/1359) | Broken on riscv64: "Cannot calculate stack trace" | Closed (Jul 2023) | - | Fixed via generic frame-pointer unwinder in 2.11rc |
| [gperftools PR #1269](https://github.com/gperftools/gperftools/pull/1269) | Conditional pagesize for 64 KB kernel pages | Closed, not merged (Dec 2022) | Medium | Affects riscv64 systems with non-default 64 KB kernel page size; maintainer rejected the approach, no fix merged, issue remains unresolved in gperftools |
| [gperftools #1278](https://github.com/gperftools/gperftools/issues/1278) | Performance regression: `generic_fp` stacktrace vs native unwinder | Open (since May 2021) | Medium | `generic_fp`, used on riscv64, reported 4-8x slower than the native x86 unwinder for profiling workloads |

### Dependencies (Abseil, googletest - see Section 9 for full context)

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [abseil-cpp #1702](https://github.com/abseil/abseil-cpp/issues/1702) | Can't link using riscv64 toolchain | Open | High | Affects tcmalloc's build whenever this toolchain combination is hit |
| [abseil-cpp #1236](https://github.com/abseil/abseil-cpp/issues/1236) | RISCV ILP32E does not mandate 16-byte alignment | Open | Medium | ILP32E is an uncommon riscv32 ABI variant; relevance to the riscv64/lp64d target tcmalloc cares about is unconfirmed [NEEDS VERIFICATION] |
| [abseil-cpp #1986](https://github.com/abseil/abseil-cpp/issues/1986) | CRC32C hardware acceleration via Zbc not merged | Open | Low | Performance only, no correctness issue |
| [googletest #3756](https://github.com/google/googletest/issues/3756) | `GetThreadCountTest.ReturnsCorrectValue` fails on risc-v64 | Open (filed 2022) | Low | Test-infrastructure only; does not affect tcmalloc's production build |

No correctness bug specific to tcmalloc-on-riscv64 was found in any searched source. There is no RISC-V-specific performance regression on record either, because there is no benchmark data for riscv64 to regress against (Section 6).

## 12. Objections and Upstream Blockers

**No stated objections to riscv64 exist.** There is no issue, PR, or public discussion in which a maintainer has declined riscv64 work; the silence is total - no discussion of any kind beyond the nine terse, build-repair commit messages in Section 2.

**Technical blockers for per-CPU RSEQ enablement:**

1. Missing `percpu_rseq_riscv.S` - a hand-written assembly file implementing `TcmallocSlab_Internal_PushBatch`, `TcmallocSlab_Internal_PopBatch`, and `TcmallocSlab_Internal_PerCpuCmpxchg64` against the Linux rseq syscall ABI on riscv64 (kernel support has existed since v4.18). Reference complexity: the x86_64 equivalent is 362 lines, the aarch64 equivalent 377 lines, of hand-written RSEQ assembly implementing a race-free critical section and abort handler.
2. The `TCMALLOC_PERCPU_RSEQ_SUPPORTED_PLATFORM` guard in `percpu.h` must be extended from `(__x86_64__ || __aarch64__)` to include `__riscv`.
3. A valid RSEQ abort signature for riscv64 must be selected and registered (the platform currently has no riscv64-specific signature because the path is never compiled in).
4. The glibc 2.35+ rseq-registration conflict ([#144](https://github.com/google/tcmalloc/issues/144)) is a cross-platform prerequisite for safely enabling any new RSEQ-based platform, not riscv64-specific, but would need to be resolved or accounted for before a riscv64 RSEQ path could ship broadly.
5. riscv64 CI (Section 7) would need to be added to detect regressions; today, regressions on riscv64 are found only reactively, by whoever happens to build it (the pattern visible in the seven riscv64 build-repair commits of 2021-2022).

**Organizational blockers:**
- All merges require a Google-internal committer (Section 1); external contributors can open PRs but cannot merge, and Google-internal engineers are directed to land changes via an internal CL first. The project accepted the original 2021 riscv64-enablement commit internally, suggesting a well-scoped, well-tested external submission is plausible to be accepted, but there is no stated commitment to review riscv64 work, and no open issue or PR currently represents such a submission.
- The "Google-internal first, Copybara-sync second" model means external riscv64 work may sit unreviewed indefinitely absent an internal Google use case driving it.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** none
- **Optimization level:** absent - the hot path (the per-CPU RSEQ slab allocator) has no riscv64 implementation at all; `percpu.h`'s `TCMALLOC_PERCPU_RSEQ_SUPPORTED_PLATFORM` gate is limited to `__x86_64__`/`__aarch64__`, so riscv64 permanently falls back to the legacy per-thread `ThreadCache` path via the crash-stub `percpu_rseq_unsupported.cc`. Closing this gap requires writing `percpu_rseq_riscv.S` (RSEQ fast-path assembly against the standard Linux rseq syscall ABI, already available on riscv64 since kernel 4.18); no additional RISC-V ISA extension (e.g. V, Zba/Zbb/Zbc) is required to implement the RSEQ path itself, since x86_64 and aarch64's equivalents use no vector/bitmanip extensions either - closing the gap is an assembly/ABI-integration effort, not an ISA-extension-dependent one.
- **Justification:** `google/tcmalloc` has no upstream riscv64 CI at all: [`.github/workflows/ci.yml`](https://github.com/google/tcmalloc/blob/master/.github/workflows/ci.yml) runs a single x86_64-only job (`ubuntu-24.04`, matrixed over compiler/mode/exceptions) with no riscv64 build or test step; no GitHub releases exist for any architecture; and the only riscv64-named distro package sharing the "tcmalloc" name (Ubuntu/Debian `libtcmalloc-minimal4t64`) is sourced from the unrelated `gperftools` project, not from `google/tcmalloc` - so neither clean upstream CI nor a genuine downstream build of this repository exists for riscv64, placing it in the "no upstream CI / no distro trace" orange band. As an optimization-purpose project (a lock-free, per-CPU allocator whose value proposition is beating the system malloc), its RISC-V coverage at the hot path is absent: [`tcmalloc/internal/percpu.h`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu.h) gates `TCMALLOC_PERCPU_RSEQ_SUPPORTED_PLATFORM` to `__x86_64__`/`__aarch64__` only, with riscv64 falling back to the legacy `ThreadCache` path through the crash-stub [`percpu_rseq_unsupported.cc`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu_rseq_unsupported.cc). This optimization-absent finding caps the grade at orange as well, so it does not further lower an already-orange grade.
- **Pending work that could change the grade:** none is in flight. No open tracking issue, PR, or RISE involvement exists for a riscv64 RSEQ port. The last riscv64-touching commit was a test typo fix on 2023-09-12, and the port has been dormant for roughly three years. Closing the gap would require writing `percpu_rseq_riscv.S`, extending the `percpu.h` platform guard, and adding riscv64 CI - none of which is currently in progress upstream.

## 14. Investment Analysis

RISE has done no documented work on `google/tcmalloc` riscv64 support, and no community or third-party effort is in flight either. All nine existing commits (Section 2) came from a single Google engineer, 2021-2023, and the trail is cold. All investment sizing below is net-new work.

### 14.1 Functional Enablement

The critical functional gap is the per-CPU RSEQ slab allocator. This is the central reason to choose tcmalloc over glibc's allocator; without it, tcmalloc on riscv64 offers no architectural advantage over the fallback path it already runs.

Work required:
- Write `tcmalloc/internal/percpu_rseq_riscv.S` implementing the three RSEQ critical sections (`PushBatch`, `PopBatch`, `PerCpuCmpxchg64`) against the Linux rseq ABI on riscv64.
- Extend the `TCMALLOC_PERCPU_RSEQ_SUPPORTED_PLATFORM` guard in `percpu.h` to include `__riscv`.
- Select and register a valid RSEQ abort signature for riscv64.
- Coordinate with the glibc rseq-registration conflict (issue [#144](https://github.com/google/tcmalloc/issues/144)), which is cross-cutting and not riscv64-specific, but is a prerequisite for safe RSEQ activation on any new platform including this one.
- Implement the still-missing SEGV read/write fault classification for riscv64 (`segv_handler.cc`) - a smaller, independent fix.
- Write correctness tests exercising the riscv64 RSEQ path, and remove the test-size/skip accommodations currently masking the absence of that path.

Reference complexity: the x86_64 and aarch64 equivalents are 362 and 377 lines of hand-written RSEQ assembly respectively. RISC-V's simpler, more orthogonal ISA should make the raw assembly tractable, but RSEQ critical-section semantics (atomic commit against a kernel-visible abort point) require careful, correctness-first implementation.

### 14.2 Performance Optimization

Contingent on the RSEQ path existing first; has no value on its own until then:
- Add RISC-V prefetch intrinsics to `prefetch.h` (Zicbop extension, `prefetch.r`/`prefetch.w`), replacing the current generic `__builtin_prefetch`.
- Profile and tune slab batch sizes for riscv64 cache hierarchies once the per-CPU path is live.
- Track/contribute to abseil-cpp's Zbc-based CRC32C acceleration ([#1986](https://github.com/abseil/abseil-cpp/issues/1986)), which benefits tcmalloc's dependency chain more broadly.

### 14.3 CI/CD Infrastructure

- Add a riscv64 build/test job to `.github/workflows/ci.yml`'s matrix, or a parallel workflow, analogous in spirit to the existing (but currently unmatrixed) arm64 Docker image.
- Requires either a hardware riscv64 GitHub Actions runner or a QEMU-based emulation stage; the project currently has no QEMU usage anywhere, so this would be new infrastructure, not an extension of an existing pattern.
- Given the Piper/Copybara-first development model, any externally-contributed CI addition would need to be accepted and maintained through the same internal-CL-preferred process described in Section 1, adding organizational risk beyond the engineering effort.

### 14.4 Ecosystem Enablement

Not applicable. `google/tcmalloc` is a system-level C++ library with no dependent package ecosystem (no npm, PyPI, Maven, or similar downstream package graph depends on riscv64-specific tcmalloc artifacts) - see Section 10 note below.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Write `percpu_rseq_riscv.S` (RSEQ PushBatch/PopBatch/Cmpxchg64) | 4-6 | RISC-V systems engineer with RSEQ/assembly expertise | Critical |
| Functional | Extend `percpu.h` platform guard, select rseq signature, wire up build | 1 | Same | Critical |
| Functional | Resolve/account for glibc rseq conflict (issue #144, cross-platform) | 2-4 (coordination) | Upstream engagement + Google | High |
| Functional | Implement SEGV read/write fault classification for riscv64 | 1 | Same | Medium |
| Functional | Correctness tests for the riscv64 RSEQ path | 2 | Same | Critical |
| Performance | Zicbop prefetch intrinsics in `prefetch.h` | 1 | RISC-V systems engineer | Low |
| Performance | Slab batch size tuning for riscv64 cache hierarchy | 2 | Benchmark engineer | Low |
| CI/CD | riscv64 CI job (QEMU or hardware runner, wired into `ci.yml`) | 2-3 | Infrastructure engineer | High |
| Functional | Upstream submission and review iteration | 2-4 | Depends on Google-internal team responsiveness | High |

Total estimated effort: roughly 14-20 person-weeks for full functional parity (RSEQ path + CI). Performance optimization adds a further 3-5 person-weeks and has no standalone value before the functional work lands.

**Risk:** merge acceptance is not guaranteed. All merges require Google-internal committer approval, and the project's history shows no stated commitment to riscv64 advancement beyond the original 2021 compile-support commit. A rejected or indefinitely-stalled submission produces only a maintained fork, not an upstream fix - a materially different, lower-value outcome than the effort sizing above assumes.

## 15. References

- [google/tcmalloc repository](https://github.com/google/tcmalloc)
- [tcmalloc homepage](https://google.github.io/tcmalloc/)
- [tcmalloc docs/platforms.md](https://github.com/google/tcmalloc/blob/master/docs/platforms.md)
- [tcmalloc/internal/config.h](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/config.h)
- [tcmalloc/internal/percpu.h](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu.h)
- [tcmalloc/internal/percpu_rseq_unsupported.cc](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu_rseq_unsupported.cc)
- [tcmalloc/internal/percpu_rseq_x86_64.S](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu_rseq_x86_64.S)
- [tcmalloc/internal/percpu_rseq_aarch64.S](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu_rseq_aarch64.S)
- [tcmalloc/internal/prefetch.h](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/prefetch.h)
- [tcmalloc/internal/cache_topology.cc](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/cache_topology.cc)
- [tcmalloc/segv_handler.cc](https://github.com/google/tcmalloc/blob/master/tcmalloc/segv_handler.cc)
- [tcmalloc/tcmalloc.cc](https://github.com/google/tcmalloc/blob/master/tcmalloc/tcmalloc.cc)
- [.github/workflows/ci.yml](https://github.com/google/tcmalloc/blob/master/.github/workflows/ci.yml)
- [ci/linux_docker_containers.sh](https://github.com/google/tcmalloc/blob/master/ci/linux_docker_containers.sh)
- [Commit c730bdc: add initial support for RISCV targets (2021-08-16)](https://github.com/google/tcmalloc/commit/c730bdcd83af0381c094aca690ee2c5e96189287)
- [Commit f20b9468: tcmalloc: repair the RISC-V build (2021-08-26)](https://github.com/google/tcmalloc/commit/0f7596195f580b3fac6a815ce59704960f6f7082)
- [Commit f4e1fb0: tcmalloc: repair !TCMALLOC_PERCPU_USE_RSEQ builds (2021-09-08)](https://github.com/google/tcmalloc/commit/f4e1fb0bc6483e7d606894f085646616792ec8b2)
- [Commit f20b9468: tcmalloc: repair the percpu_tcmalloc related tests on RISC-V (2021-09-15)](https://github.com/google/tcmalloc/commit/f20b9468a107b2002d4d558c6a2bcf161d70e538)
- [Commit 54c1f7b: correct declaration for non-RSEQ platforms (2021-12-20)](https://github.com/google/tcmalloc/commit/54c1f7bc61db8888a67dc62288c522e8e6a6f630)
- [Commit cefed7bf: repair the build for non-rseq enabled platforms (2022-01-18)](https://github.com/google/tcmalloc/commit/cefed7bf7d696a251a98d58a158bdd565ab1eb36)
- [Commit 7ae2052: skip rseq tests on non-rseq targets (2022-02-03)](https://github.com/google/tcmalloc/commit/7ae2052200270cf1bd3e37f845e2c05d14b79aaf)
- [Commit 8f84341: fix unused-variable warning in config_test.cc on RISC-V (2023-08-25)](https://github.com/google/tcmalloc/commit/8f84341cb4b91eb025e66e55f6cbb83c8b1c62ea)
- [Commit 56e8b05: fix typos in memory_errors_test.cc for RISC-V (2023-09-12)](https://github.com/google/tcmalloc/commit/56e8b05f021b33883d881a69094816374e6c1497)
- [tcmalloc issue #144: glibc 2.35 rseq conflict](https://github.com/google/tcmalloc/issues/144)
- [tcmalloc issue #286: High spin lock activity and slow performance](https://github.com/google/tcmalloc/issues/286)
- [tcmalloc issue #292: RSEQ-related crashes since linux-6.19](https://github.com/google/tcmalloc/issues/292)
- [LWN: Restartable sequences, TCMalloc, and Hyrum's Law](https://lwn.net/Articles/1070072/)
- [LWN: Fixing the TCMalloc regression with RSEQ operations](https://lwn.net/Articles/1092555/)
- [abseil-cpp issue #1702: link failure with riscv64 toolchain](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp issue #1236: RISCV ILP32E alignment](https://github.com/abseil/abseil-cpp/issues/1236)
- [abseil-cpp issue #2002: sampler test segfault on riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp issue #1986: CRC32C acceleration via Zbc](https://github.com/abseil/abseil-cpp/issues/1986)
- [googletest issue #3756: GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [protobuf issue #12266: add riscv64 support (closed)](https://github.com/protocolbuffers/protobuf/issues/12266)
- [protobuf issue #14549: build fails on RISCV (closed)](https://github.com/protocolbuffers/protobuf/issues/14549)
- [protobuf issue #17798: Maven central protoc prebuilts for riscv64 (closed)](https://github.com/protocolbuffers/protobuf/issues/17798)
- [gperftools issue #1359: broken on riscv64 (closed)](https://github.com/gperftools/gperftools/issues/1359)
- [gperftools PR #1269: conditional pagesize for 64 KB kernels (closed, not merged)](https://github.com/gperftools/gperftools/pull/1269)
- [gperftools issue #1278: generic_fp profiling overhead](https://github.com/gperftools/gperftools/issues/1278)
- [Ubuntu resolute (26.04) libtcmalloc-minimal4t64 package](https://packages.ubuntu.com/resolute/libtcmalloc-minimal4t64)
- [Ubuntu package search for "tcmalloc"](https://packages.ubuntu.com/search?keywords=tcmalloc&searchon=names&section=all)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=tcmalloc)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [Linux kernel rseq ABI documentation](https://www.kernel.org/doc/html/latest/kernel/rseq.html)