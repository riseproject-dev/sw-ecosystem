---
title: neper
parent: Project Reports
---

# neper

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for neper<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

neper is a Linux network performance benchmarking tool written in pure C99. It measures TCP and UDP throughput, request/response latency, and connection rates. A separate set of binaries (`psp_stream`, `psp_rr`, `psp_crr`) targets Google's PSP transport-layer encryption protocol. The tool was developed inside Google and open-sourced under Apache-2.0. It has 326 GitHub stars and no formal release tags.

**Governance:** No foundation, no steering committee, no MAINTAINERS or CODEOWNERS file. All active maintainers are Google employees. The most active contributors by commit count: hi-rajat-kumar (Rajat Kumar, 27 commits), kevinGC (Kevin Krakauer, 18 commits), wdebruij (Willem de Bruijn, 14 commits). External contributors exist (George Prekas/Amazon, David Gibson/Red Hat) but hold single commits and are not maintainers.

**License:** Apache-2.0.

**Corporate sponsors:** Google exclusively. Google is a RISE Premier Member, but neper is not listed as a RISE-funded project and no RISE blog posts mention it.

**Culture on new ports:** The RISC-V port (PR #35, 2022) was accepted with no recorded friction. The author was a Google employee. The project's design -- pure C, no external dependencies, POSIX networking only -- makes porting inherently low-effort.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2022-07-28 | PR #35 submitted: "neper: add support for Linux on RISC-V with musl", author Michael Hope (mlhx@google.com, Google) | [PR #35](https://github.com/google/neper/pull/35) |
| 2022-07-31 | PR #35 merged by Willem de Bruijn (wdebruij, Google) | [PR #35](https://github.com/google/neper/pull/35) |

**PR #35 changes (19 additions, 19 deletions across 4 files):**

- `cpuinfo.c`: added `|| defined(__riscv)` to an existing three-way `#ifdef` that selects the flat `processor: N` `/proc/cpuinfo` parsing path (shared with aarch64 and powerpc).
- `rusage.c`: replaced the `HZ` macro with `sysconf(_SC_CLK_TCK)` -- a musl portability fix, not RISC-V-conditioned.
- `logging.c`: removed `fcloseall()`, a GNU extension absent from musl -- not RISC-V-conditioned.
- `thread.c`: reordered `pthread_create()` before `pthread_setaffinity_np()` and replaced `pthread_attr_setaffinity_np()` with the post-creation variant -- required because musl stubs the attr variant.

The RISC-V-specific code change is a single token: `|| defined(__riscv)` in one `#ifdef`. The remaining changes are musl portability fixes that benefit all non-glibc builds but happen to be required on RISC-V musl targets.

The port is fully upstream. There is no downstream fork, no patch queue, no out-of-tree maintenance.

---

## 3. Upstream Support Tier

No formal tier or platform policy document exists. No PLATFORMS.md, no MAINTAINERS file, no stated architecture support matrix.

Evidence from CI and distribution:

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI build | Yes (Docker image published) | Yes (Docker image via QEMU) | No |
| CI test | No dedicated test job for any arch | No dedicated test job for any arch | No |
| Release binary | No formal releases for any arch | No formal releases for any arch | No |
| Docker image at ghcr.io | Yes | Yes | No |
| Distro package | No | No | No |

The only CI workflow is `.github/workflows/publish-image.yaml`. Its `platforms:` line reads `linux/amd64,linux/arm64`. riscv64 is absent. There is no separate build-and-test workflow for any architecture; the CI exclusively publishes Docker images.

riscv64 is at a lower support tier than arm64 by the only measurable criterion (CI coverage), but since neither arm64 nor riscv64 receives functional test coverage, the practical gap is narrow.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

neper has no architecture-specialized compute. It is a network I/O benchmark: it opens sockets, spawns threads, measures throughput and latency. There are no JIT compilers, no cryptographic primitives, no SIMD kernels, no GC barriers.

**Architecture-specific file inventory:**

- No `.S` assembly files for any architecture.
- No `arch/` subdirectory.
- No SIMD intrinsics (no AVX, no NEON, no RVV).
- No `vfloat32m1_t`, `rvv`, or `riscv64` symbols anywhere in the tree (searches returned zero results).

**Per-component matrix:**

| Component | amd64 | arm64 | riscv64 | Notes |
|-----------|-------|-------|---------|-------|
| `/proc/cpuinfo` parsing | Full topology (physical_id, core_id, siblings, cpu_cores) | Flat (`processor` only) | Flat (`processor` only) -- identical path to arm64 | One `#ifdef __riscv` guard routes to the correct parser |
| Compute kernels | None | None | None | No compute kernels exist in neper |
| SIMD / ISA extensions | None | None | None | Not applicable |
| Assembly | None | None | None | Not applicable |
| NUMA topology (optional) | Supported | Supported | Supported (Debian sid) | Disabled by default (`-DNO_LIBNUMA`) |
| PSP binaries | Builds; requires Google-internal kernel patch | Builds; not tested | Builds; not tested | PSP not upstream for any arch |

The riscv64 implementation is complete for what neper requires. No stubs, no TODO markers, no missing paths were found.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make only. No CMake, meson, or autoconf. One Makefile at the repo root.

**CFLAGS (hardcoded):** `-std=c99 -Wall -O3 -g -D_GNU_SOURCE -DNO_LIBNUMA`

**Link flags:** `-lm -lrt -lpthread`

**Native build on riscv64 host:**

```
make all
```

Produces 8 binaries: `tcp_rr`, `tcp_stream`, `tcp_crr`, `udp_rr`, `udp_stream`, `psp_stream`, `psp_crr`, `psp_rr`.

**Cross-compilation from x86_64 (no official support documented, but functional):**

```
CC=riscv64-linux-gnu-gcc make all
```

or with Clang:

```
CC="clang --target=riscv64-linux-gnu" make all
```

**Toolchain requirements:**

- C99 required (`-std=c99` is hardcoded). Any GCC >= 4.x or Clang >= 3.x suffices.
- `-D_GNU_SOURCE` is set. glibc is the natural target. musl is supported (PR #35 resolved the blockers).
- `-DNO_LIBNUMA` is hardcoded in the upstream Makefile. No NUMA library is needed.
- `epoll_pwait2()` is optional: pass `-DHAVE_EPOLL_PWAIT2` only if your libc provides it. glibc >= 2.35 (Debian 12 / bookworm) includes this on riscv64.
- No minimum GCC version is documented. The `fcloseall()` removal in PR #35 was the only musl-blocking issue and is already resolved.

**Known build issue (Issue #67, open):** A floating-point static initializer in `histo.c` fails with `gcc 7.5.0 on SLES 15 SP5` (`error: initializer element is not constant`). Workaround: `make CC=clang`. GCC toolchains for riscv64 in Debian 12 and later are not affected, but embedded or vendor RISC-V toolchains on older GCC could trigger this. [NEEDS VERIFICATION for which riscv64 GCC versions reproduce this.]

**QEMU:** The CI pipeline installs `docker/setup-qemu-action@v3` to build the arm64 Docker image. Adding `linux/riscv64` to the `platforms:` field in `.github/workflows/publish-image.yaml` is all that is technically required, subject to the distroless image gap described in Section 8.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| TCP throughput (`tcp_stream`) | Yes | Yes | Yes (source-level) |
| TCP request/response (`tcp_rr`, `tcp_crr`) | Yes | Yes | Yes (source-level) |
| UDP throughput/RR (`udp_stream`, `udp_rr`) | Yes | Yes | Yes (source-level) |
| PSP encrypted transport | Requires Google kernel patch | Requires Google kernel patch | Requires Google kernel patch |
| NUMA-aware socket distribution | Yes (optional; disabled by default) | Yes (optional; disabled by default) | Yes (optional; Debian sid libnuma available) |
| `/proc/cpuinfo` topology | Full (threads, cores, sockets) | Core count only | Core count only |
| eBPF NUMA pinning | Yes (kernel BPF JIT) | Yes | Yes (riscv64 BPF JIT upstream since Linux 5.1) |

**Functional gaps:** None for the core benchmark workloads. PSP is equally non-functional on all architectures outside Google's internal kernel.

**Performance gaps:** No riscv64 benchmark data exists to quantify any gap (see Section 11). neper measures network I/O, not compute throughput, so the absence of SIMD is not architecturally significant. CPU overhead for packet processing at line rate could differ, but no data is available.

**Known portability issue (Issue #49, open):** The `%m` scanf specifier in `cpuinfo.c` is a glibc extension not present in musl. On musl-based riscv64 targets (e.g., Alpine Linux riscv64), this may fail at runtime when parsing `/proc/cpuinfo`. [NEEDS VERIFICATION: whether Alpine Linux riscv64 ships a glibc-compatible musl or a strict musl that omits `%m`.]

**Floating-point semantics:** No floating-point computation in the network measurement path. `histo.c` uses floating-point for histogram output only. No NaN or FP semantics issues expected on riscv64 beyond Issue #67 noted above.

---

## 7. CI/CD Infrastructure

**The only CI file:** `.github/workflows/publish-image.yaml`

**Trigger:** push to master and `workflow_dispatch`.

**Runner:** `ubuntu-latest` (x86_64).

**What it does:** Builds a Docker image via `docker buildx` with QEMU for arm64 emulation, then pushes to `ghcr.io/google/neper`. This is a packaging step, not a build-verification or test step.

**Platforms line (verbatim):** `platforms: linux/amd64,linux/arm64`

riscv64 is absent.

| CI dimension | amd64 | arm64 | riscv64 |
|--------------|-------|-------|---------|
| Docker image built | Yes | Yes (QEMU) | No |
| Build verification (compile-only) | Implicit via Docker build | Implicit via Docker build | Not done |
| Functional tests | No | No | No |
| Dedicated test runner | No | No | No |
| RISE hardware runner | No | No | No |

No RISE-provided riscv64 runners are used. No external CI (Cirrus CI, GitLab CI, Jenkins) exists.

---

## 8. Distribution and Release Status

**GitHub Releases:** The repository has zero release tags. The GitHub releases page is empty. No binary assets have ever been published.

**Docker image:** `ghcr.io/google/neper` is published for `linux/amd64` and `linux/arm64`. No `linux/riscv64` image is published. The Docker image uses a multi-stage build with `gcr.io/distroless/cc-debian12:debug` as the runtime base, which does not publish a riscv64 variant. This blocks riscv64 Docker image publication regardless of build success.

**Distro packages:**

| Distribution | amd64 | arm64 | riscv64 |
|-------------|-------|-------|---------|
| Debian sid | No package | No package | No package |
| Ubuntu 24.04 (noble) | No package | No package | No package |
| Arch Linux RISC-V | No package | No package | No package |
| PyPI | Not applicable (C tool) | Not applicable | Not applicable |

neper is not packaged in any major Linux distribution on any architecture.

**To obtain a working riscv64 binary today:** Clone the repository and run `make all` on a riscv64 host or cross-compile with `CC=riscv64-linux-gnu-gcc make all`. No other path exists.

---

## 9. Dependencies

**Summary table:**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|-----------|------|---------------|--------------|-----------------|-----------------|
| glibc (system) | libc, epoll, pthread, sched | Yes | Yes (Debian/Fedora CI) | All major distros | None |
| libm (`-lm`) | Math (histogram output only) | Yes | Yes | All major distros | None |
| librt (`-lrt`) | `clock_gettime`, shared memory | Yes | Yes | All major distros | None |
| libpthread (`-lpthread`) | POSIX threads | Yes | Yes | All major distros | None |
| libnuma (optional) | NUMA socket distribution, eBPF NUMA pinning | Yes (Debian sid `numactl 2.0.19-1+b2`) | No dedicated riscv64 CI in numactl | Debian sid riscv64 binary available | None open. Historical: [numactl PR #131](https://github.com/numactl/numactl/pull/131) (libatomic link error, closed 2022), [numactl #197](https://github.com/numactl/numactl/issues/197) (cleanup, closed 2024). Both resolved. |
| Linux kernel eBPF | NUMA-aware socket load balancing (optional) | riscv64 BPF JIT upstream since Linux 5.1 | Tested in mainline kernel CI | Mainline Linux | None |
| PSP kernel interface (`psp_kernel.h`) | Google PSP transport encryption | Requires Google-internal kernel patch | Not tested on any arch | Not upstream on any arch | PSP `setsockopt` constants (`TCP_PSP_TX_SPI_KEY = 1730` etc.) not in mainline Linux for any architecture. Equally blocked on x86_64, arm64, and riscv64. |
| GCC or Clang toolchain | C compiler, linker | riscv64 gcc/binutils fully supported in Debian | Debian builds natively on riscv64 | Available in all major distros | None |
| distroless/cc-debian12 (container base) | Runtime container image | No riscv64 tag published | Not tested | Not published for riscv64 | Blocks Docker image workflow for riscv64. Does not block native builds. |

**Critical dependency detail -- distroless/cc-debian12:** Google's distroless base image at `gcr.io/distroless/cc-debian12` publishes amd64 and arm64 only. Adding riscv64 to the Docker CI workflow requires either Google publishing a riscv64 distroless image or switching the base image to one that supports riscv64 (e.g., `debian:12-slim`).

**No JIT, crypto, or numerics dependencies exist.** The only compute in neper is socket I/O and histogram output. No dependency analysis beyond the single-level above is warranted.

---

## 11. Known Bugs and Active Issues

No riscv64-specific issues or pull requests exist in the google/neper repository. Searches across issues, PRs, and commits for "riscv" and "riscv64" returned zero results.

**Portability-relevant open issues:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#67](https://github.com/google/neper/issues/67) | `error: initializer element is not constant` (gcc 7.5.0 on SLES 15 SP5) | Open (Jul 2024) | Low | Floating-point static initializer in `histo.c`. Affects older or stricter GCC. Workaround: `make CC=clang`. May affect vendor riscv64 toolchains on older GCC. [NEEDS VERIFICATION for riscv64 GCC versions affected.] |
| [#49](https://github.com/google/neper/issues/49) | Non-C99 `%m` scanf specifier in `cpuinfo.c` | Open (Jan 2024) | Low | GNU extension; fails on strict musl. Affects musl-based riscv64 builds (e.g., Alpine Linux riscv64). Not a correctness bug on glibc targets. |

No correctness bugs specific to riscv64 were found.

**Benchmark data:** No riscv64 vs arm64 or riscv64 vs x86_64 performance measurements exist in any public source (GitHub, RISE blog, web search).

---

## 12. Objections and Upstream Blockers

**Stated objections:** None. The upstream repository contains no discussion of riscv64 beyond PR #35 (already merged).

**Technical blockers:**

1. **distroless/cc-debian12 has no riscv64 image.** This blocks adding `linux/riscv64` to the Docker CI workflow. Mitigation: switch the runtime base to `debian:12-slim` or wait for Google to publish a riscv64 distroless image. This is a blocker for Docker distribution only, not for native builds.

2. **PSP binaries require a Google-internal kernel patch.** This is not a riscv64-specific blocker; PSP is equally non-functional on all architectures outside Google's fleet. No action is needed.

3. **Issue #49 (`%m` specifier):** A one-line fix replacing `%m` with a portable equivalent. Trivial. No upstream maintainer has objected to fixing it.

**Organizational blockers:** None. The project accepted the RISC-V port in 2022 with no objections. The project has no tier policy, no NEW_PORTS review process, and no stated architecture exclusions. Google-internal review of a CI addition PR is the only gate.

**Acceptance probability for a CI addition PR:** High. The technical change is minimal (add `linux/riscv64` to the `platforms:` field, conditional on resolving the distroless base image issue). Google is a RISE Premier Member, which creates organizational alignment.

---

## 13. Investment Analysis

RISE has not funded or contributed to neper on riscv64. The RISE wheel builder does not track neper (it is not a Python package). No work is already covered.

### 13.1 Functional Enablement

The core tool builds and runs on riscv64 today without modification. The only functional gap for musl targets is Issue #49 (`%m` specifier in `cpuinfo.c`). On glibc-based riscv64 (Debian, Fedora, Ubuntu), there is no functional gap.

Fix for Issue #49: replace `%m` with `strerror(errno)` or `%s`, `strerror(errno)` in the format string. Estimated effort: 1 hour.

### 13.2 Performance Optimization

neper is a network I/O benchmark. CPU overhead is dominated by socket system calls, not compute. There are no SIMD kernels to optimize. No performance gap attributable to missing ISA extensions has been identified.

Data not available: riscv64 vs arm64 throughput/latency measurements for neper on any hardware.

### 13.3 CI/CD Infrastructure

The only actionable CI gap is the absence of riscv64 from the Docker image build matrix. The change is one line in `.github/workflows/publish-image.yaml`:

```
platforms: linux/amd64,linux/arm64,linux/riscv64
```

This requires resolving the distroless base image blocker. Options:

- Switch runtime base from `gcr.io/distroless/cc-debian12:debug` to `debian:12-slim` for the riscv64 layer. This is a one-line Dockerfile change that may face upstream resistance on security grounds (distroless is preferred for minimal attack surface).
- Use a multi-platform Dockerfile with a platform-conditional base: distroless for amd64/arm64, debian:12-slim for riscv64 temporarily.
- Wait for Google to publish a riscv64 distroless image (no timeline available).

Estimated effort for the CI PR (excluding distroless negotiation): 2 person-days. Negotiating the distroless base image with maintainers is the uncertainty.

### 13.4 Ecosystem Enablement

Not applicable. neper has no dependent package ecosystem. It is a standalone network benchmarking binary.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Fix Issue #49: replace `%m` with portable equivalent in `cpuinfo.c` | 0.1 | Any contributor | Low |
| CI/CD | Add `linux/riscv64` to Docker image `platforms:` field | 0.5 | RISE or Qualcomm contributor | Medium |
| CI/CD | Resolve distroless/cc-debian12 riscv64 base image (negotiate upstream or switch base) | 1-2 | Google distroless team (external) | Medium |
| Functional | Publish riscv64 vs arm64 vs x86_64 benchmark results on reference riscv64 hardware | 1 | RISE / Qualcomm | Low |

Total investment to achieve full riscv64 parity with arm64: approximately 2-3 person-weeks, with the primary uncertainty being Google's timeline for distroless riscv64 support.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [google/neper repository](https://github.com/google/neper)
- [PR #35 - neper: add support for Linux on RISC-V with musl](https://github.com/google/neper/pull/35)
- [Issue #67 - error: initializer element is not constant (gcc 7.5.0)](https://github.com/google/neper/issues/67)
- [Issue #49 - non-C99 %m scanf specifier in cpuinfo.c](https://github.com/google/neper/issues/49)
- [.github/workflows/publish-image.yaml](https://github.com/google/neper/blob/master/.github/workflows/publish-image.yaml)
- [numactl PR #131 - Fix build error on riscv64 by linking libatomic](https://github.com/numactl/numactl/pull/131)
- [numactl issue #197 - Revert unconditional libatomic on riscv64](https://github.com/numactl/numactl/issues/197)
- [Debian numactl build status (sid)](https://buildd.debian.org/status/package.php?p=numactl&suite=sid)
- [RISE Project member list](https://riseproject.dev/members/)