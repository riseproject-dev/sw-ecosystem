---
title: tcmalloc
categories:
  - libraries
---

# tcmalloc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for tcmalloc
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

[tcmalloc](https://google.github.io/tcmalloc/) (Thread-Caching Malloc) is Google's high-performance memory allocator, designed to reduce malloc/free latency by maintaining per-CPU lock-free slabs via Linux Restartable Sequences (RSEQ) and per-thread caches as a fallback. It is used in production across Google's infrastructure for latency-sensitive workloads.

The repository at [github.com/google/tcmalloc](https://github.com/google/tcmalloc) is a mirror of Google's internal Piper monorepo, synced via Copybara. External pull requests are accepted but cannot be merged by the contributor; merge authority rests entirely with Google's internal engineering team. The `CONTRIBUTING.md` states: "The current members of the TCMalloc engineering team are the only committers at present." There is no foundation affiliation (not Apache, CNCF, or Linux Foundation). The license is Apache 2.0.

The project is explicitly not an officially supported Google product. Community conduct is governed by [Google's Open Source Community Guidelines](https://opensource.google/conduct/).

Primary maintainers identified from commit history:

| Contributor | GitHub handle | Affiliation | Commits |
|---|---|---|---|
| Chris Kennelly | ckennelly | Google | 1,228 |
| Vaibhav Gogte | v-gogte | Google | 351 |
| Dmitry Vyukov | dvyukov | Google, Munich | 179 |
| Nilay Vaish | nilayvaish | Google | 103 |
| Martin Maas | martinmaas | Google | 22 |

Note: Martin Maas is a known Google RISC-V researcher [NEEDS VERIFICATION of current role], but there is no RISC-V-specific commit or issue attributed to him in the tcmalloc repository.

The project has no RISE Project membership and no RISE blog coverage. A full crawl of all 27 RISE Project blog posts (May 2024 through June 2026) returned zero mentions of tcmalloc.

Community posture on new architecture ports is conservative: all RISC-V enablement came from a single Google engineer via the internal monorepo in 2021, with no activity in the four subsequent years and no open tracking issue. The project does not solicit or organize community porting efforts.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-08-16 | Commit [c730bdc](https://github.com/google/tcmalloc/commit/c730bdc): "add initial support for RISCV targets". Adds `__riscv && __linux__` guards in `tcmalloc/internal/config.h`, sets `kAddressBits = 48` and `kHugePageShift = 21`. Author: Saleem Abdulrasool (compnerd, abdulras@google.com). Sourced via Copybara (PiperOrigin-RevId: 391119742). | [github.com/google/tcmalloc/commit/c730bdc](https://github.com/google/tcmalloc/commit/c730bdc) |
| 2021-12-20 | Commit [54c1f7b](https://github.com/google/tcmalloc/commit/54c1f7b): "correct declaration for non-RSEQ platforms". Fixes build failure on RISC-V in `tcmalloc/internal/percpu.h` by adding missing `size_t shift` parameter to `TcmallocSlab_Internal_Pop` declaration. Author: Saleem Abdulrasool. | [github.com/google/tcmalloc/commit/54c1f7b](https://github.com/google/tcmalloc/commit/54c1f7b) |
| 2022-2026 | No further RISC-V commits, issues, or pull requests. | [github.com/google/tcmalloc/issues](https://github.com/google/tcmalloc/issues) (zero riscv results confirmed) |

Both commits entered the public repository as direct Copybara pushes with no associated GitHub pull request. There is no public record of review discussion for either change.

Both commits are fully upstream. The port is stalled at a compile-only stub state. No tracking issue for a complete riscv64 port exists, open or closed.

---

## 3. Upstream Support Tier

The official platform support matrix is documented in [`docs/platforms.md`](https://github.com/google/tcmalloc/blob/master/docs/platforms.md):

| Architecture | Official Status |
|---|---|
| x86-64, Linux, 64-bit, LE | Supported |
| AArch64, Linux, 64-bit, LE | Supported |
| PPC, Linux, 64-bit, LE | Best effort |
| riscv64 | Not listed |

riscv64 is entirely absent from the official support matrix. There is no stated tier policy document; the categorization above is inferred from `docs/platforms.md` directly.

Tier evidence by architecture:

| Evidence | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed in `docs/platforms.md` | Yes (Supported) | Yes (Supported) | No |
| CI runner exists | Yes (x86 Docker, Kokoro) | Yes (ARM Docker, `linux_arm_hybrid-latest`) | No |
| Per-CPU RSEQ assembly | Yes | Yes | No |
| Release artifacts (GitHub) | N/A (source-only) | N/A | N/A |
| Distro packages (upstream source) | N/A | N/A | N/A |

tcmalloc ships no prebuilt binaries of any kind. There are zero GitHub releases. All distribution occurs via source or through downstream packagers (Debian/Ubuntu package gperftools, which is a separate codebase - see Section 8).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

tcmalloc's performance-critical subsystems and their riscv64 status:

### Per-CPU RSEQ Slab Allocator

The primary performance advantage of tcmalloc is its lock-free per-CPU memory slab, implemented using Linux Restartable Sequences (RSEQ). Each architecture requires a hand-written assembly file implementing `TcmallocSlab_Internal_PushBatch`, `PopBatch`, and `PerCpuCmpxchg64`.

The platform guard in [`tcmalloc/internal/percpu.h`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu.h):

```c
#if defined(__linux__) && (defined(__x86_64__) || defined(__aarch64__)) && \
    !defined(ABSL_HAVE_HWADDRESS_SANITIZER)
#define TCMALLOC_PERCPU_RSEQ_SUPPORTED_PLATFORM 1
```

RISC-V is not in this list. `TCMALLOC_PERCPU_RSEQ_SUPPORTED_PLATFORM = 0` for riscv64. The RSEQ signature for riscv64 is `0x0` (the invalid sentinel). On riscv64, all calls to RSEQ fast-path functions land in [`tcmalloc/internal/percpu_rseq_unsupported.cc`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu_rseq_unsupported.cc), which returns 0 or -1 and performs no allocation. `IsFast()` returns false on riscv64; the per-CPU cache is never activated. tcmalloc falls back to the per-thread cache path automatically.

The Linux kernel has supported RSEQ via syscall since v4.18 on riscv64. glibc 2.35 registers rseq per-thread. The kernel-side infrastructure exists; the missing piece is the `percpu_rseq_riscv.S` assembly file in tcmalloc.

### Platform Constants

[`tcmalloc/internal/config.h`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/config.h) has two riscv64-specific ifdefs:

```cpp
#elif defined __riscv && defined __linux__
inline constexpr int kAddressBits = 48;
...
#elif defined __riscv && defined __linux__
static constexpr size_t kHugePageShift = 21;
```

These values (48-bit VA, 2 MiB huge pages) are correct for sv48 RISC-V Linux and match aarch64. No architectural justification or citation is provided in the comment.

### Prefetch

[`tcmalloc/internal/prefetch.h`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/prefetch.h): x86_64 uses inline `PREFETCHW` asm. riscv64 receives `__builtin_prefetch` only -- no RISC-V prefetch intrinsics.

### Cache Topology

[`tcmalloc/internal/cache_topology.cc`](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/cache_topology.cc): aarch64 has an L3 identification fallback. riscv64 uses the generic sysfs path only.

### ISA Extensions

Zero usage of any RISC-V ISA extension: no RVV vector intrinsics, no Zba/Zbb/Zbc/Zbs bitmanip, no Zicbop prefetch hints, no inline assembly of any kind for riscv64.

### Summary Comparison Table

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Platform constants (`kAddressBits`, `kHugePageShift`) | Full | Full | Full (4 lines, values match arm64) |
| Per-CPU RSEQ slab assembly | Full (hand-tuned, `percpu_rseq_x86_64.S`, ~235 lines) | Full (hand-tuned, `percpu_rseq_aarch64.S`) | Missing -- crash stub only |
| RSEQ platform flag | 1 | 1 | 0 |
| RSEQ signature | `0x53053053` | `0xd428bc00` | `0x0` (invalid) |
| Prefetch hints | Hand-tuned inline asm (`PREFETCHW`) | `__builtin_prefetch` | `__builtin_prefetch` |
| Cache topology | Generic sysfs | aarch64 L3 fallback + sysfs | Generic sysfs |
| SIMD / vector usage | None | None | None |
| ISA extension usage | SSE/AVX (prefetch) | None | None |
| CI validation | Yes | Yes | No |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build systems:** Bazel (primary, Bazel 4.0+) and CMake (experimental).

**Compiler minimums** (enforced in `tcmalloc/internal/config.h`, not architecture-specific):
- GCC 12.1 or later (hard error below this)
- Clang 11 or later (hard error below this)
- C++17 required

**Standard Bazel build on a riscv64 host:**

```bash
bazel test //tcmalloc/... --cxxopt='-std=c++17'
```

No cross-compilation toolchain files exist in the repository: no `cmake/riscv64.cmake`, no `cmake/toolchain-riscv64.cmake`. No QEMU references appear anywhere in the codebase or CI scripts.

**CMake build** (experimental, from `ci/linux_gcc-latest_libstdcxx_cmake.sh`):

```bash
cmake /tcmalloc \
  -DCMAKE_CXX_STANDARD=17 \
  -DCMAKE_C_FLAGS="-Werror" \
  -DCMAKE_CXX_FLAGS="-Werror"
make -j$(nproc)
ctest --output-on-failure
```

No riscv64-specific CMake flags are documented.

**Relevant `-D` flags for riscv64:**

| Flag | Effect |
|---|---|
| `TCMALLOC_DEPRECATED_PERTHREAD` | Force per-thread mode (tcmalloc auto-selects this on riscv64 anyway; this flag is not required) |
| `TCMALLOC_INTERNAL_8K_PAGES` | Default page size (4 KB pages will malfunction on systems with 64 KB kernel pages -- see Section 11) |
| `TCMALLOC_INTERNAL_32K_PAGES` | Safe alternative for systems using 64 KB kernel pages |

**Known build failure history:** Commit [54c1f7b](https://github.com/google/tcmalloc/commit/54c1f7b) (2021-12-20) fixed the only documented riscv64 build failure (argument mismatch in `TcmallocSlab_Internal_Pop` declaration). No current build failure is documented. There is no CI to detect regressions.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### Functional Gaps

| Feature | amd64 | arm64 | riscv64 | Gap severity |
|---|---|---|---|---|
| Per-CPU RSEQ slab allocator (lock-free fast path) | Yes | Yes | No -- thread-cache fallback only | Critical: primary performance differentiator is unavailable |
| Per-CPU cache activation (`IsFast()` returns true) | Yes | Yes | No | Critical |
| RSEQ signature validation | Yes | Yes | No (signature = `0x0`) | Critical |
| Huge page support (2 MiB) | Yes | Yes | Yes (constants set) | None |
| 48-bit VA space support | Yes | Yes | Yes (constant set) | None |
| glibc 2.35+ rseq conflict resolution (issue #144) | Workaround only | Workaround only | N/A (RSEQ not used on riscv64) | Informational |

### Performance Gaps

The per-thread cache fallback path -- used exclusively on riscv64 -- is the older, slower allocation strategy. tcmalloc's documentation and design rationale indicate the per-CPU RSEQ path was introduced specifically because the per-thread path has contention at high thread counts.

No published benchmark comparing riscv64 vs amd64 or arm64 allocation throughput was found in any source. The magnitude of the regression is unquantified.

Data not available: published throughput numbers for tcmalloc on riscv64 at any thread count.

### Security Hardening Gaps

No RISC-V-specific security hardening is present. The RSEQ-based slab provides implicit temporal safety properties on x86_64 and aarch64 that are absent on riscv64. No specific CVE or hardening delta has been documented for riscv64.

---

## 7. CI/CD Infrastructure

tcmalloc's CI runs on Google's internal Kokoro infrastructure using Docker images defined in [`ci/linux_docker_containers.sh`](https://github.com/google/tcmalloc/blob/master/ci/linux_docker_containers.sh). GitHub Actions is not used (`.github/workflows/` does not exist in the repository). There are no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` files.

Docker containers defined in `ci/linux_docker_containers.sh`:

| Variable | Image | Architecture |
|---|---|---|
| `LINUX_CLANG_LATEST_CONTAINER` | `gcr.io/google.com/absl-177019/linux_hybrid-latest:20260131` | x86-64 |
| `LINUX_GCC_LATEST_CONTAINER` | `gcr.io/google.com/absl-177019/linux_hybrid-latest:20260131` | x86-64 |
| `LINUX_GCC_FLOOR_CONTAINER` | `gcr.io/google.com/absl-177019/linux_hybrid-latest:20260131` | x86-64 |
| `LINUX_ARM_CLANG_LATEST_CONTAINER` | `gcr.io/google.com/absl-177019/linux_arm_hybrid-latest:20260131` | AArch64 |
| `LINUX_ALPINE_CONTAINER` | (Alpine image) | x86-64 |

No `LINUX_RISCV*` container is defined. No QEMU-based riscv64 emulation stage exists. No self-hosted riscv64 runner is referenced anywhere.

CI comparison:

| Capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner exists | Yes | Yes | No |
| Build tested | Yes | Yes | No |
| Tests executed | Yes | Yes | No |
| RSEQ path exercised | Yes | Yes | N/A |
| RISE runners | No | No | No |
| Hardware runners | Yes (Docker/Kokoro) | Yes (Docker/Kokoro) | No |

---

## 8. Distribution and Release Status

**GitHub Releases:** Zero. The GitHub releases page for [google/tcmalloc](https://github.com/google/tcmalloc/releases) contains no entries. tcmalloc is a source-only project with no prebuilt binary artifacts of any kind, for any architecture.

**PyPI:** No package named `tcmalloc` exists on PyPI (HTTP 404 confirmed). No riscv64 wheels exist or can exist via this channel.

**RISE wheel builder:** Not applicable. The RISE Python wheel builder at [riseproject.gitlab.io](https://riseproject.gitlab.io/python/wheel_builder/) does not list tcmalloc. The project is not a Python package.

**Debian and Ubuntu packages:** Available for riscv64, but from the `gperftools` source, NOT from `google/tcmalloc`. These are two distinct codebases that share the `libtcmalloc` library name. This distinction is critical:

| Package | Source | riscv64 | Notes |
|---|---|---|---|
| `libtcmalloc-minimal4t64` 2.18.1-1 (Debian sid) | gperftools | Yes | Main Debian archive |
| `libtcmalloc-minimal4` 2.10-1 (Debian debports) | gperftools | Yes (debports only) | Unofficial ports archive; old version |
| `libtcmalloc-minimal4t64` 2.15-3build1 (Ubuntu 24.04) | gperftools | Yes | Main Ubuntu archive |
| `librust-tcmalloc-dev` 0.3.0-2 (Debian/Ubuntu) | Rust FFI wrapper over gperftools | Yes | Links against gperftools, not google/tcmalloc |
| `librust-tcmalloc-sys-dev` 0.3.0-1 (Debian/Ubuntu) | Rust FFI wrapper over gperftools | Yes | Same caveat |

**gperftools** (the upstream of the Debian/Ubuntu packages) is the older open-source release of classic TCMalloc from circa 2012. It achieved riscv64 support progressively: build fixes in 2.8.1 (Dec 2020), frame-pointer backtracer in 2.9rc (Feb 2021), and "Linux/riscv fully supported" declared in 2.11rc (Jul 2023).

**To obtain a working binary for riscv64:**

- For `google/tcmalloc` (modern): build from source on a riscv64 host with GCC 12.1+/Clang 11+ and Bazel 4.0+. Per-CPU RSEQ will not be active; the per-thread fallback runs instead.
- For `gperftools` (legacy): install `libtcmalloc-minimal4t64` from Debian or Ubuntu package repositories.

**Arch Linux:** tcmalloc is not packaged in Arch Linux at all (official or riscv64 port).

---

## 9. Dependencies

Critical first-order dependencies of `google/tcmalloc` and their riscv64 status:

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| abseil-cpp | Logging, sync, CRC, hash tables, stack traces, cycle clock, string utilities | Yes (Debian 20260107.0) | Partial -- 2 open test failures: `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test` segfault on riscv64-linux-gnu ([issue #2002](https://github.com/abseil/abseil-cpp/issues/2002), Feb 2026) | Source only | Open #2002: sampler segfault on riscv64. Open [#1702](https://github.com/abseil/abseil-cpp/issues/1702): link failure with older riscv64 toolchain (libatomic missing). Open [#1986](https://github.com/abseil/abseil-cpp/issues/1986): CRC32C hardware acceleration via Zbc not yet merged. `ABSL_HAVE_UNSCALED_CYCLECLOCK_IMPLEMENTATION = 0` on riscv64 -- no hardware cycle counter, profiling uses fallback clock. |
| protobuf | Profile proto serialization, profile builder | Yes (source) | No official riscv64 CI | No riscv64 protoc binary (v35.1 ships x86_32, x86_64, aarch64, ppcle_64, s390_64 only) | [Issue #12266](https://github.com/protocolbuffers/protobuf/issues/12266) requesting riscv64 protoc is closed-stale; reopened discussion May 2026. Downstream builds requiring protoc as a build-time binary must build from source. |
| re2 | Regular expression matching (indirect via abseil) | No known issues | No known failures | Source only | None identified |
| googletest | Test-only dependency | Builds on riscv64 | Open [issue #3756](https://github.com/google/googletest/issues/3756): `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (filed Feb 2022, still open) | Source only | Test-only; does not affect tcmalloc runtime |
| google/benchmark | Microbenchmark infrastructure (dev dependency) | Yes (PR #1802 fixed sign-conversion warning) | No known failures | Source only | None blocking |
| fuzztest | Fuzz testing (dev dependency) | No known issues | No known failures | Source only | None identified |
| Linux rseq syscall | Kernel-level primitive for per-CPU RSEQ slab | Available on riscv64 (kernel 4.18+) | N/A | N/A | Not a blocker -- kernel support exists. tcmalloc simply does not use it on riscv64. |
| glibc rseq registration | glibc 2.35+ registers rseq per-thread; conflicts with tcmalloc's own registration | N/A on riscv64 (tcmalloc does not use rseq on riscv64) | N/A | N/A | tcmalloc [issue #144](https://github.com/google/tcmalloc/issues/144) (updated Jan 2026): tcmalloc does not cooperate with glibc's rseq registration. This is a prerequisite for eventually enabling per-CPU caches on glibc 2.35+ systems including riscv64, but is not a current blocker since rseq is not used on riscv64 at all. |

**Dependency depth note:** abseil-cpp's open sampler segfault ([#2002](https://github.com/abseil/abseil-cpp/issues/2002)) and missing hardware cycle counter on riscv64 are relevant to tcmalloc's heap profiling subsystem, which relies on abseil's sampling infrastructure.

---

## 11. Known Bugs and Active Issues

### google/tcmalloc (upstream)

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| No riscv64 issues | -- | -- | -- | Confirmed: zero issues or PRs match riscv/risc-v/riscv64 in the tracker |
| [#144](https://github.com/google/tcmalloc/issues/144) | glibc 2.35 rseq conflict | Open (updated Jan 2026) | High (amd64/arm64) | Workaround: `GLIBC_TUNABLES=glibc.pthread.rseq=0`. Not a current riscv64 issue since rseq is not used there, but blocks any future rseq enablement on riscv64 |
| [#286](https://github.com/google/tcmalloc/issues/286) | High spin lock activity and slow performance | Open (Oct 2025) | Medium | Not riscv64-specific |
| [#292](https://github.com/google/tcmalloc/issues/292) | RSEQ-related crashes since linux-6.19 | Closed (May 2026) | -- | Affected x86_64/aarch64 only; riscv64 not affected |

### gperftools (Debian/Ubuntu packaged version)

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [gperftools #1359](https://github.com/gperftools/gperftools/issues/1359) | Broken on riscv64: "Cannot calculate stack trace" | Closed (Jul 2023) | -- | Fixed in gperftools 2.11rc via generic frame-pointer unwinder |
| [gperftools #1269](https://github.com/gperftools/gperftools/pull/1269) | Conditional pagesize for 64 KB kernel pages | Closed (Dec 2022, not merged) | Medium | Affects riscv64 with non-default 64 KB kernel page size. Maintainer rejected approach; no fix merged. Workaround: build with `-DTCMALLOC_INTERNAL_32K_PAGES` or larger. This issue is unresolved. |
| [gperftools #1278](https://github.com/gperftools/gperftools/issues/1278) | Performance regression: generic_fp stacktrace vs native | Open (May 2021) | Medium | `generic_fp` unwinder used by riscv64 is 4-8x slower than native x86 unwinder per reported measurements. Applies to profiling workloads on riscv64. |

### abseil-cpp (tcmalloc dependency)

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [abseil #2002](https://github.com/abseil/abseil-cpp/issues/2002) | Sampler tests segfault on riscv64 | Open (Feb 2026) | High | Affects `absl_hashtablez_sampler_test` and `absl_cordz_sample_token_test`; impacts tcmalloc heap profiling infrastructure |
| [abseil #1986](https://github.com/abseil/abseil-cpp/issues/1986) | CRC32C acceleration via Zbc not merged | Open | Low | Performance only; no correctness issue |

---

## 12. Objections and Upstream Blockers

**No stated objections to riscv64 exist** -- there are no issues, PRs, or public discussions where a maintainer has declined riscv64 work. The silence is total: no discussion at all.

**Technical blockers for per-CPU RSEQ enablement:**

1. Missing `percpu_rseq_riscv.S`: a hand-written assembly file implementing `TcmallocSlab_Internal_PushBatch`, `TcmallocSlab_Internal_PopBatch`, and `TcmallocSlab_Internal_PerCpuCmpxchg64` using the rseq syscall. The kernel rseq interface on riscv64 is available (kernel 4.18+); the assembly needs to implement the critical section and abort handler per the [rseq ABI](https://www.kernel.org/doc/html/latest/kernel/rseq.html).

2. `TCMALLOC_PERCPU_RSEQ_SUPPORTED_PLATFORM` guard in `percpu.h` must be extended to include `__riscv`.

3. glibc rseq conflict (issue #144) must be resolved before per-CPU caches can be safely enabled on any system with glibc 2.35+. This is an existing open issue affecting all platforms, not riscv64-specific.

4. A valid RSEQ abort signature for riscv64 must be selected and registered (currently `0x0`, which is invalid).

**Organizational blockers:**

- All merges require Google internal committers. External contributors can submit PRs but cannot merge. Acceptance probability for a high-quality, well-tested `percpu_rseq_riscv.S` submission is plausible given that the project accepted the 2021 compile support commit, but there is no stated commitment to review riscv64 work.
- The project's "Google-internal first, then Copybara sync" model means external riscv64 work may sit unreviewed indefinitely unless Google has an internal use case.

---

## 13. Investment Analysis

RISE has done no documented work on `google/tcmalloc` riscv64 support. The two existing commits came from a Google engineer in 2021. All investment sizing below is net-new work.

### 13.1 Functional Enablement

The critical functional gap is the per-CPU RSEQ slab allocator. This is the core reason to use tcmalloc over glibc ptmalloc; without it, tcmalloc on riscv64 offers no architectural advantage.

Work required:
- Write `tcmalloc/internal/percpu_rseq_riscv.S` implementing the three RSEQ critical sections (`PushBatch`, `PopBatch`, `PerCpuCmpxchg64`) using the Linux rseq ABI on riscv64.
- Update `TCMALLOC_PERCPU_RSEQ_SUPPORTED_PLATFORM` guard in `percpu.h` to include `__riscv`.
- Select and register a valid RSEQ abort signature for riscv64.
- Coordinate with glibc rseq conflict resolution (issue #144 -- cross-cutting, not riscv64-specific). This may require a separate upstream engagement.
- Write correctness tests exercising the RSEQ path on riscv64.

Reference complexity: `percpu_rseq_x86_64.S` is approximately 235 lines of hand-written RSEQ assembly. aarch64 is comparable. RISC-V's cleaner ISA and standard ABI should make the assembly tractable, but the RSEQ critical section semantics require careful implementation to be race-free.

### 13.2 Performance Optimization

Once the RSEQ path exists:
- Add RISC-V prefetch intrinsics to `prefetch.h` (Zicbop extension, `prefetch.r`/`prefetch.w` instructions).
- Profile and tune slab batch sizes for riscv64 cache hierarchy.
- Add Zbc-based CRC acceleration in abseil-cpp (dependency, tracked as abseil #1986).

This work is secondary to functional enablement and has no value until the RSEQ path exists.

### 13.3 CI/CD Infrastructure

- Add a riscv64 Docker container to `ci/linux_docker_containers.sh`, analogous to `linux_arm_hybrid-latest`.
- Add a CI script (e.g., `ci/linux_gcc-latest_libstdcxx_bazel_riscv64.sh`) using that container.
- Requires either a hardware riscv64 runner accessible to the project's Kokoro CI, or a QEMU-based emulation stage. The project uses Google-internal CI infrastructure; an external RISE-provided riscv64 runner would need to integrate with this, which is not straightforward for external contributors.

Alternatively: a RISE-hosted GitHub Actions CI job (if the project accepts GitHub Actions contributions). Currently the project has no GitHub Actions at all.

### 13.4 Ecosystem Enablement

Not applicable. `google/tcmalloc` has no plugin or package ecosystem. See Section 10 (omitted per scope rules -- no dependent package ecosystem exists for this project).

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Write `percpu_rseq_riscv.S` (RSEQ PushBatch/PopBatch/Cmpxchg64) | 4-6 | RISC-V systems engineer with RSEQ/asm expertise | Critical |
| Functional | Update `percpu.h` platform guard, select rseq signature, wire up build | 1 | Same | Critical |
| Functional | Resolve glibc rseq conflict (issue #144, cross-platform) | 2-4 (coordination) | Upstream engagement + Google | High |
| Functional | Correctness tests for riscv64 RSEQ path | 2 | Same | Critical |
| Performance | Prefetch intrinsics for Zicbop in `prefetch.h` | 1 | RISC-V systems engineer | Low |
| Performance | Slab batch size tuning for riscv64 cache hierarchy | 2 | Benchmark engineer | Low |
| CI/CD | riscv64 CI job (QEMU or hardware runner, Bazel) | 2 | Infrastructure | High |
| Functional | Upstream PR submission and review iteration | 2-4 | Depends on Google team responsiveness | High |

Total estimated effort: 16-22 person-weeks for full functional parity (RSEQ path + CI). Performance optimization adds 3-5 person-weeks.

Risk: merge acceptance is not guaranteed. All merges require Google internal committer approval. No prior commitment to riscv64 advancement has been stated. A rejected submission means the investment produces only a maintained fork, not an upstream fix.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/tcmalloc repository](https://github.com/google/tcmalloc)
- [tcmalloc homepage](https://google.github.io/tcmalloc/)
- [tcmalloc docs/platforms.md](https://github.com/google/tcmalloc/blob/master/docs/platforms.md)
- [tcmalloc/internal/config.h](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/config.h)
- [tcmalloc/internal/percpu.h](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu.h)
- [tcmalloc/internal/percpu_rseq_unsupported.cc](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/percpu_rseq_unsupported.cc)
- [tcmalloc/internal/BUILD](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/BUILD)
- [tcmalloc/internal/prefetch.h](https://github.com/google/tcmalloc/blob/master/tcmalloc/internal/prefetch.h)
- [ci/linux_docker_containers.sh](https://github.com/google/tcmalloc/blob/master/ci/linux_docker_containers.sh)
- [Commit c730bdc: add initial support for RISCV targets (2021-08-16)](https://github.com/google/tcmalloc/commit/c730bdc)
- [Commit 54c1f7b: correct declaration for non-RSEQ platforms (2021-12-20)](https://github.com/google/tcmalloc/commit/54c1f7b)
- [tcmalloc issue #144: glibc 2.35 rseq conflict](https://github.com/google/tcmalloc/issues/144)
- [tcmalloc issue #286: High spin lock activity and slow performance](https://github.com/google/tcmalloc/issues/286)
- [tcmalloc issue #292: RSEQ crashes since linux-6.19 (closed)](https://github.com/google/tcmalloc/issues/292)
- [abseil-cpp issue #2002: sampler test segfault on riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp issue #1702: link failure with older riscv64 toolchain](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp issue #1986: CRC32C acceleration for Zbc](https://github.com/abseil/abseil-cpp/issues/1986)
- [googletest issue #3756: GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [protobuf issue #12266: riscv64 protoc binary request](https://github.com/protocolbuffers/protobuf/issues/12266)
- [gperftools issue #1359: broken on riscv64 (closed)](https://github.com/gperftools/gperftools/issues/1359)
- [gperftools PR #1269: conditional pagesize for 64 KB kernels (closed, not merged)](https://github.com/gperftools/gperftools/pull/1269)
- [gperftools issue #1278: generic_fp profiling overhead](https://github.com/gperftools/gperftools/issues/1278)
- [Ubuntu 24.04 libtcmalloc-minimal4t64 package](https://packages.ubuntu.com/search?keywords=tcmalloc&suite=noble)
- [Debian sid tcmalloc package search](https://packages.debian.org/search?keywords=tcmalloc&searchon=names&suite=sid)
- [Linux kernel rseq ABI documentation](https://www.kernel.org/doc/html/latest/kernel/rseq.html)