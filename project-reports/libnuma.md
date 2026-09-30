---
title: libnuma
parent: Project Reports
color: orange
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: musl
    relation: runtime-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: runtime-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: autoconf
    relation: build-dependency
    criticality: critical
  - name: automake
    relation: build-dependency
    criticality: critical
  - name: GNU Libtool
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="libnuma" %}

# libnuma

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for libnuma<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libnuma is the C library component of the [numactl](https://github.com/numactl/numactl) project. It provides a programmatic interface to the Linux kernel NUMA policy syscalls: `mbind`, `get_mempolicy`, `set_mempolicy`, `migrate_pages`, and `move_pages`. The companion `numactl` binary is a process launcher that applies NUMA policy to arbitrary executables. `libnuma` itself is licensed LGPL-2.1; the `numactl` tool and demo programs are GPL-2.0. Manpages carry the Linux manpages license.

The repository is hosted under the `numactl` GitHub organization. There is no MAINTAINERS, OWNERS, or CODEOWNERS file, and no PLATFORMS.md, SUPPORT.md, or documented architecture-tier policy of any kind. The only governance-adjacent document is `SECURITY.md`, which states plainly: "This project is maintained by a team of volunteers on a reasonable-effort basis." Security reports go through GitHub security advisories with a roughly 90-day disclosure window, and patches are applied only to the latest release. The project has no foundation membership and is not a RISE Project member.

The README credits current maintainers as Andi Kleen and Chunsheng Luo ("Luo Chunsheng"), "as well as various contributors." Andi Kleen has been the sole merge gatekeeper since the project's inception; his email history shows Intel (`ak@linux.intel.com`) and SUSE Labs (`ak@suse.de`) affiliations, with commits now made from a personal domain (`github@halobates.de`). Chunsheng Luo (co-maintainer) is affiliated with Huawei (`luochunsheng@huawei.com`). Original v2.0.0 authors were Cliff Wickman and Christoph Lameter (SGI) and Lee Schermerhorn (HP). Other notable contributors by commit history include Filipe Brandenburger (Google), Petr Holasek, Pingfan Liu, and Sanskriti Sharma (Red Hat), Ben Widawsky (Intel), Harish and Tim Pepper (IBM), Hyeonggon Yoo (SK hynix), and Danial Klimkin (Google, author of the most recent RISC-V fix). No single company controls the project; contributions are spread across SGI (historical), Intel, SUSE, HP, Red Hat, IBM, Huawei, Google, and SK hynix, merged by an informally recognized volunteer maintainer.

The project has no documented policy on new architecture ports and no RFC or platform-tier gate for accepting one. In practice, new-architecture patches (small `#ifdef __ARCH__` additions to `syscall.c`) are reviewed and merged directly by Andi Kleen with no formal process, contributed by both individuals (Eric Long, Marvin Schmidt) and corporate engineers (Danial Klimkin, Google) with equally low friction.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-05-07 | Commit `e0de0d9` by ffontaine: adds portable `AC_SEARCH_LIBS([__atomic_fetch_and_1], [atomic])` to `configure.ac`. Fixes sparc and implicitly covers riscv64 for libatomic detection. | [numactl commits](https://github.com/numactl/numactl/commits/master) |
| 2022-08-21/22 | [PR #131](https://github.com/numactl/numactl/pull/131) merged by andikleen: adds riscv64-specific `-latomic` linking to `Makefile.am` via `AM_CONDITIONAL([RISCV64], ...)`, fixing a Debian riscv64 buildd failure (`undefined reference to __atomic_fetch_and_1`). Silently removes the `AC_SEARCH_LIBS` line added by `e0de0d9`. Author: Eric Long (hack3ric, no stated corporate affiliation). | [PR #131](https://github.com/numactl/numactl/pull/131) |
| 2022-09-07 | v2.0.15 released. Carries the riscv64-specific `-latomic` conditional; `AC_SEARCH_LIBS` is absent. | [GitHub releases](https://github.com/numactl/numactl/releases) |
| 2022-11-02 | Reviewer ffontaine comments on PR #131 (post-merge) that the architecture-based `-latomic` hack broke other architectures needing the same fix, explicitly naming sparc, microblaze, and some ARM flavors. This is the regression that directly triggers the later revert. | [PR #131 discussion](https://github.com/numactl/numactl/pull/131) |
| 2023-10-20 | [PR #197](https://github.com/numactl/numactl/pull/197) opened by Marvin Schmidt (marv, exherbo.org): proposes reverting PR #131. Rationale: whether `-latomic` is needed depends on the toolchain (GCC vs LLVM/Clang), not the architecture; an LLVM-toolchain riscv64 build has no `-latomic` to link, so the unconditional flag broke LLVM riscv64 builds. [PR #198](https://github.com/numactl/numactl/pull/198), opened the same day by the same author, fixes a separate riscv64/musl build warning by switching `sysfs.c` from `<sys/fcntl.h>` to `<fcntl.h>`. | [PR #197](https://github.com/numactl/numactl/pull/197), [PR #198](https://github.com/numactl/numactl/pull/198) |
| 2024-01-06 | Both PR #197 and PR #198 merged by andikleen (reviewed by luochenglcs), roughly 2.5 months after opening. `AC_SEARCH_LIBS([__atomic_fetch_and_1], [atomic])` is restored as the sole, toolchain-driven detection mechanism, replacing the architecture-based hack. | [PR #197](https://github.com/numactl/numactl/pull/197), [PR #198](https://github.com/numactl/numactl/pull/198) |
| 2024-01-17 | v2.0.17 released, containing PR #197 and PR #198. riscv64 builds correctly with both GCC and LLVM toolchains via `AC_SEARCH_LIBS`. | [GitHub releases](https://github.com/numactl/numactl/releases) |
| 2024-10-24 | v2.0.19 released (current latest tag). No riscv64-specific changes in this release beyond the state reached in v2.0.17. | [GitHub releases](https://github.com/numactl/numactl/releases) |
| 2026-09-23 | [PR #260](https://github.com/numactl/numactl/pull/260) merged by andikleen, same day it was opened, author dklimkin (Danial Klimkin, Google). Adds `defined(__riscv)` to the `set_mempolicy_home_node` fallback-syscall-number `#if` chain in `syscall.c`, so riscv64 shares syscall number 450 with x86_64/aarch64/i386/powerpc/mips/s390x instead of falling through to a build-time `#warning`. Commit `ab036a3`. | [PR #260](https://github.com/numactl/numactl/pull/260), [commit ab036a3](https://github.com/numactl/numactl/commit/ab036a3f74453ff34ede915fb4cbc7c7b0d7f6de) |

No tracking issue for a riscv64 port was ever filed (`search_issues` for "riscv" and "riscv64" scoped to `numactl/numactl` both return 0 results). All riscv64-related work is a small set of four standalone PRs (#131, #197, #198, #260); no fifth PR or abandoned attempt exists in the full commit history.

PR #260 is merged to `master` (commit `ab036a3`, HEAD as of this report is `09fc1874` with 491 commits and 45 tags) but is not yet in any tagged release: the latest tag, v2.0.19, was cut 2024-10-24, nearly two years before PR #260 merged. Until the next release, distro packages built from v2.0.19 (see Section 8) still carry the pre-#260 `syscall.c`, which emits a spurious build-time `#warning` on riscv64 for `set_mempolicy_home_node` but is otherwise functionally correct (the syscall falls through to ENOSYS on kernels that lack it).

The port is otherwise fully upstream: no downstream patches are required for core NUMA functionality on riscv64, because riscv64 uses the Linux generic syscall ABI and the five core syscall numbers (`mbind`, `get_mempolicy`, `set_mempolicy`, `migrate_pages`, `move_pages`) are already supplied by kernel/libc headers without any numactl-side `#ifdef`. Whether Debian or Ubuntu apply any additional patches on top of vanilla upstream source when building their riscv64 packages could not be confirmed from available data [NEEDS VERIFICATION] -- this is the single open question affecting the readiness grade (see Section 13).

## 3. Upstream Support Tier

numactl has no documented architecture support tiers of any kind; no PLATFORMS.md, SUPPORT.md, or docs/platforms/ directory exists, and no formal Tier 1/Tier 2/experimental distinction is made anywhere in the repository.

In practice, support can be inferred from CI coverage and release/packaging evidence:

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Tested in upstream CI | Yes (`makefile.yml`, `codeql.yml`, `cut-release.yml`, `.travis.yml`, all x86-only) | No | No |
| Official GitHub Release binaries | No (source tarball only) | No (source tarball only) | No (source tarball only) |
| Distro packaging | Yes (all distros) | Yes (all distros) | Yes (Debian sid main pool, Ubuntu 22.04/24.04/26.04) |
| `set_mempolicy_home_node` ifdef | Yes | Yes | Yes as of PR #260 (merged 2026-09-23, unreleased) |
| `clearcache` implementation | Yes (hand-tuned x86 asm) | No (generic scalar fallback) | No (generic scalar fallback) |
| Test suite run against hardware | Yes (CI) | Unknown | No (single-node NUMA hardware only; NUMA-dependent tests skipped) |

riscv64 and arm64 are at the same CI tier: neither has any upstream build or test job. Source-level completeness is also comparable between the two (see Section 4); riscv64 closed its one remaining gap relative to arm64 with PR #260, though that fix has not yet shipped in a tagged release.

## 4. Technical Architecture and RISC-V-Specific Subsystems

libnuma is a thin system call wrapper. It has no JIT, no SIMD, no cryptography, no compression, no garbage collection, and (outside two small files) no architecture-conditional code at all. A full-repository grep for `riscv`, `__riscv`, `rvv`, and `vfloat32m1_t` returns matches only in `syscall.c`; there is no `arch/riscv/` directory and no `.S` assembly files anywhere in the repository.

**`syscall.c` (305 lines) -- core NUMA syscall number table.** Defines fallback `#define __NR_mbind ...`-style values, gated by `#if !defined(__NR_mbind) || ...`, for architectures whose kernel/libc headers do not already supply them: x86_64, ia64, i386, powerpc, loongarch, MIPS (three ABIs), hppa, arm, and s390x. riscv64 is absent from this block, and that is not a gap: riscv64 uses the Linux generic syscall table (`asm-generic/unistd.h`), where `mbind`=235, `get_mempolicy`=236, `set_mempolicy`=237, `migrate_pages`=238, and `move_pages`=239 are already defined before this file compiles, so the outer guard evaluates false and the per-arch block is skipped entirely. x86_64/i386 additionally carry roughly 50 lines of hand-written inline-asm 6-argument syscall wrappers (`syscall6`) that riscv64 does not need or have.

**`syscall.c` -- `set_mempolicy_home_node` (syscall 450).** As of PR #260 (merged 2026-09-23, commit `ab036a3`, unreleased), the fallback-constant `#if` chain reads:
```c
#if !defined(__NR_set_mempolicy_home_node)
#if defined(__x86_64__) || defined(__aarch64__) || defined(__i386__) || defined(__powerpc__) || defined(__mips__) || defined(__s390x__) || defined(__riscv)
#define __NR_set_mempolicy_home_node 450
#else
#warning "Add syscalls for your architecture or update kernel headers"
```
Before this fix, riscv64 fell into the `#else` branch and emitted a spurious build-time warning; the runtime behavior was unaffected either way, since the API returns ENOSYS gracefully when unsupported. Every distro package currently shipping (all built from v2.0.19, tagged before PR #260) still carries the pre-fix warning.

**`clearcache.c` (77 lines).** Emits `#warning 'Consider adding a clearcache implementation for your architecture'` and falls back to a generic, portable scalar routine on riscv64. aarch64 has the identical gap; x86_64/i386 have a hand-tuned `cpuid`/`clflush` implementation. This is tracked by upstream [issue #205](https://github.com/numactl/numactl/issues/205), open since January 2024, labeled "help wanted," with no fix merged. It is a benchmark-tool (`numademo`) concern only, with no effect on the core library API.

**`libnuma.c` (2,392 lines) and `affinity.c` (347 lines).** Zero architecture `#ifdef`s of any kind -- this is the bulk of libnuma's actual logic (NUMA topology discovery, bitmask/policy handling, sysfs parsing, CPU affinity) and it is pure portable C for every architecture, riscv64 included. The only arch-aware logic anywhere is a runtime (not compile-time) 64-bit width check.

**`stream_lib.c`, `numademo.c`.** Zero architecture ifdefs. `stream_lib.c` relies entirely on compiler auto-vectorization (`-ftree-vectorize -ffast-math -funroll-loops`), with no SIMD intrinsics for any architecture -- no RVV, no SSE, no NEON.

**TODO/FIXME/stub search** across the repo returns exactly two hits, neither riscv-related: a generic nodemask_t TODO in `libnuma.c` and a powerpc-specific `move_pages` FIXME in `syscall.c`.

**Component summary:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core NUMA syscall numbers | Explicit ifdef + hand-asm `syscall6` | No explicit ifdef (kernel headers) | No explicit ifdef (kernel headers) |
| `set_mempolicy_home_node` | Explicit ifdef | Explicit ifdef | Explicit ifdef as of PR #260 (unreleased) |
| `clearcache` | Hand-tuned `cpuid`/`clflush` asm | Generic scalar fallback (warning) | Generic scalar fallback (warning) |
| `libnuma.c` / `affinity.c` topology logic | Portable C | Portable C | Portable C |
| SIMD / vectorized code | None (auto-vectorize only) | None (auto-vectorize only) | None (auto-vectorize only) |
| Assembly | x86/i386 syscall6 + clearcache only | None | None |
| JIT | None | None | None |

riscv64 is functionally equivalent to arm64 across the board, at the same completeness tier as numactl's most widely deployed non-x86 architecture. The architecture-specific surface is inherently tiny (2 files, on the order of 120 arch-conditional lines out of roughly 3,650 total), because libnuma's actual functionality is portable C over generic Linux syscalls.

## 5. Build System, Cross-Compilation, and Toolchain

Build system: GNU Autotools (`autoconf` >= 2.64, `automake`, `libtool`). There is no `CMakeLists.txt` on any branch (`master`, `action-1`, `imports`), no `cmake/` directory, no Meson, no Cargo, and no Dockerfiles anywhere in the repository. No `docs/BUILDING.md` or `docs/cross-compilation.md` exists; the only build documentation is `INSTALL.md`.

Standard build from a git checkout:
```sh
./autogen.sh
./configure --prefix=/usr --libdir=/usr/lib
make
make check
```

Cross-compilation for riscv64 (a plain, undocumented autotools invocation -- `./configure --help` exposes no riscv64-specific or architecture-specific `--enable-*`/`--disable-*` flags):
```sh
./autogen.sh
./configure --host=riscv64-linux-gnu --prefix=/usr --libdir=/usr/lib CC=riscv64-linux-gnu-gcc
make
make check
```

No minimum GCC or Clang version is stated anywhere in `configure.ac`, `Makefile.am`, `README.md`, or `INSTALL.md`; `AC_PREREQ([2.64])` is the only stated version floor, and it applies to autoconf, not the C compiler. The build depends on GCC `__atomic` builtin support (detected via `AC_SEARCH_LIBS([__atomic_fetch_and_1], [atomic])`, GCC >= 4.7 generically has this); on riscv64 specifically, any working GCC (riscv64 backend upstream since GCC 7, 2017, matured by GCC 8/9) or Clang/LLVM toolchain with working atomic codegen is sufficient. No `-march=`/`-mabi=` flags are hardcoded; the build uses whatever `CC`/`CFLAGS` are supplied by the caller. The historical Travis CI matrix (`.travis.yml`, x86-only) tested GCC 4.9 through GCC 10.

The only riscv64-specific build issue ever resolved is the libatomic linking saga (Section 2): PR #131 (Aug 2022) added an unconditional, architecture-gated `-latomic` link for riscv64 that broke LLVM-toolchain riscv64 builds (LLVM ships no separate `-latomic`) and regressed sparc/microblaze/some ARM flavors; PR #197 (Jan 2024) reverted it in favor of the toolchain-driven `AC_SEARCH_LIBS` probe, which correctly handles GCC and LLVM on riscv64 alike. A companion fix, PR #198 (same date), switched `sysfs.c` from `<sys/fcntl.h>` to `<fcntl.h>` to fix a build warning specific to riscv64/musl toolchains.

No QEMU usage exists anywhere in the repository or in any CI workflow. No cross-compilation job exists in upstream CI (see Section 7).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap Type |
|---|---|---|---|---|
| `mbind` | Full | Full | Full | None |
| `get_mempolicy` | Full | Full | Full | None |
| `set_mempolicy` | Full | Full | Full | None |
| `migrate_pages` | Full | Full | Full | None |
| `move_pages` | Full | Full | Full | None |
| `set_mempolicy_home_node` | Full | Full | Full as of PR #260 (unreleased); build warning only in all shipped v2.0.19 packages | Cosmetic build warning until next tagged release |
| `numa_alloc_*` / `numa_free` | Full | Full | Full | None |
| `numa_bind` | Full | Full | Full | None |
| `numa_node_of_cpu` | Full | Full | Full | None |
| `clearcache` | Implemented (hand-asm) | Not implemented (scalar fallback + warning) | Not implemented (scalar fallback + warning) | Functional gap, shared with arm64, tracked by issue #205 |
| SIMD-accelerated `stream_lib` | None (scalar, auto-vectorized) | None (scalar, auto-vectorized) | None (scalar, auto-vectorized) | Not implemented for any architecture, not riscv64-specific |
| NUMA multi-node topology exercised | Yes (hardware exists) | Yes (hardware exists) | No (no multi-node riscv64 hardware in wide deployment) | Hardware gap, not a software gap |

`numa_available()` returns -1 on current riscv64 boards (SiFive HiFive Unmatched, StarFive VisionFive 2) because none expose multi-node NUMA topology; this means the full NUMA-policy code paths are not exercised on any riscv64 hardware generally available today. This is a hardware constraint, not a software gap.

No floating-point, cryptographic, or security-hardening gaps exist for riscv64: libnuma performs no floating-point arithmetic and no cryptographic operations anywhere in its codebase.

## 7. CI/CD Infrastructure

All four CI/legacy-CI configuration files present in the repository were read directly (local clone, HEAD `09fc1874`); no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist.

**`.github/workflows/makefile.yml`.** Triggers on push/pull_request to `master` and `action-1`. Runs on `ubuntu-latest` (x86_64, GitHub-hosted). Steps: `./autogen.sh && ./configure`, `make` with GCC (`-Wall -Werror`), the same with `CC=clang`, `make check`, `make distcheck`. No matrix axis, no QEMU, no cross-compilation.

**`.github/workflows/codeql.yml`.** Triggers on push/pull_request to `master` and a weekly cron (`25 18 * * 6`). Runs on `ubuntu-latest` (x86_64). CodeQL static analysis, `language: [ 'cpp' ]` only -- no build/test execution of any kind, no architecture axis.

**`.github/workflows/cut-release.yml`.** Triggers on tag pushes matching `v*`. Runs on `ubuntu-22.04` (x86_64). Installs `build-essential fakeroot`, runs `autogen.sh`/`configure`/`fakeroot make distcheck`, then publishes a GitHub release built from the resulting source tarball -- no cross-compilation step and no per-architecture binary artifacts.

**`.travis.yml`** (legacy, present at repo root). `dist: bionic`/`xenial`, 7-job matrix varying only GCC 4.9 through GCC 10/g++ via the `ubuntu-toolchain-r-test` PPA, all on x86. Runs `make -k`, `./numactl --show`, `make -k check`, `make distcheck`.

`grep -rni "riscv"` across all four files, and across `.github/` as a whole, returns zero matches. Every job in every file runs exclusively on GitHub-hosted `ubuntu-latest`/`ubuntu-22.04` (x86) or Travis `bionic`/`xenial` (x86); there is no arm runner, no riscv64 runner (self-hosted or otherwise), and no QEMU emulation setup anywhere in upstream CI.

| CI Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build job exists | Yes | No | No |
| Test job (`make check`) | Yes | No | No |
| Cross-compilation job | No | No | No |
| QEMU-based job | No | No | No |
| Native hardware runner | No (GitHub/Travis-hosted) | No | No |
| Release build job | Yes | No | No |
| RISE CI runners | No | No | No |

No RISE CI infrastructure is used by numactl, consistent with the absence of any RISE involvement with the project (see Sections 1 and 13). The Debian and Ubuntu riscv64 buildds that produce the packages in Section 8 provide the only known riscv64 build validation of this codebase, and they are entirely downstream, not upstream CI.

## 8. Distribution and Release Status

Upstream GitHub Releases are source-only tarballs (e.g. `numactl-2.0.19.tar.gz`); `cut-release.yml` performs no cross-compilation and attaches no per-architecture binary assets, consistent with the release job description in Section 7. No riscv64 binary has ever been attached to a GitHub Release.

libnuma does not exist on PyPI under the name `libnuma` (`/pypi/libnuma/json` and `/simple/libnuma/` both return HTTP 404, confirmed directly and via the RISE wheel-builder's PyPI passthrough, which redirects to the same 404) or under the alternate name `py-numa` (also 404). This is expected: libnuma is a native C library, not a Python package, and is not in scope for the RISE wheel_builder's riscv64 Python wheel set.

**Distro package availability (directly verified this session unless noted):**

| Distro | Package | Version | riscv64 Status |
|---|---|---|---|
| Debian sid | `libnuma1`, `libnuma-dev` | 2.0.19-1+b2 | Confirmed: `libnuma1_2.0.19-1+b2_riscv64.deb` downloaded directly from the main pool (`ftp.debian.org`, not `debian-ports`), HTTP 200, 22,804 bytes -- riscv64 is a full release architecture in Debian's primary archive for this package |
| Ubuntu 26.04 (resolute) | `libnuma1`, `libnuma-dev` | 2.0.19-1build1 | Confirmed: `libnuma1_2.0.19-1build1_riscv64.deb` downloaded directly from `ports.ubuntu.com`, HTTP 200, 25,822 bytes -- riscv64 is in Ubuntu's **ports** archive tier (alongside armel/powerpc), a looser support guarantee than amd64/arm64 |
| Ubuntu 24.04 (noble) | `libnuma-dev` | 2.0.16-1 | Present, per direct package search; note the existing baseline for this report separately recorded 2.0.18-1build1 for the same release -- the discrepancy was not resolved in this pass [NEEDS VERIFICATION] |
| Ubuntu 22.04 (jammy) | `libnuma1` | 2.0.14-3ubuntu2 | Present, per Launchpad package listing |
| openSUSE Tumbleweed | `libnuma` | n/a | Reported present in one general web search; not independently re-verified by direct package-archive fetch in this session [NEEDS VERIFICATION] |
| Arch Linux RISC-V (archriscv.felixc.at) | `numactl` | n/a | Not present -- the repository index was fetched directly and neither `libnuma` nor `numactl` appears anywhere on it. This contradicts an earlier, unverified "present with `[nochecked]` status" claim; the direct index check in this session found no listing at all |
| Fedora | n/a | n/a | Data not available: Fedora riscv64 package status was not searched |

To obtain a working riscv64 binary today, a user installs the Debian sid or Ubuntu package directly; no manual build is required on either confirmed distro. Debian's main-pool placement is the stronger signal of the two, since Ubuntu riscv64 remains a ports-tier architecture. Whether either distro's packaging carries riscv64-specific patches on top of vanilla upstream source (for example, an early hand-added `__riscv` branch in `syscall.c` predating PR #260) could not be confirmed from available data [NEEDS VERIFICATION]; this uncertainty directly affects the readiness grade (Section 13).

## 9. Dependencies

| Dependency | Role | riscv64 Status |
|---|---|---|
| Linux kernel | runtime-dependency, critical -- supplies the five core NUMA syscall numbers via the generic syscall ABI (`asm-generic/unistd.h`), and syscall 450 for `set_mempolicy_home_node` (Linux 5.17+) | Fully supported since Linux 3.8+ for the core syscalls; no riscv64-specific kernel gap identified |
| glibc | runtime-dependency, critical -- `syscall()`, `sched_setaffinity`/`sched_getaffinity`; numactl uses a `__GLIBC_PREREQ(2, 11)` guard to select `syscall` vs `syscall6`, a threshold riscv64 glibc always meets | Full riscv64 support since glibc 2.33+; full test suite passes on glibc/Debian riscv64 |
| musl | runtime-dependency, optional -- alternate C runtime, notably used on some riscv64 embedded/distro toolchains | Full riscv64 support in musl 1.2.x; PR #198 fixed a musl-specific `<sys/fcntl.h>` build warning on riscv64. musl riscv64 test-suite results: data not available |
| GCC | build-dependency, critical -- primary compiler; build relies on `__atomic` builtins for sub-word atomics, detected via `AC_SEARCH_LIBS([__atomic_fetch_and_1], [atomic])` | riscv64 GCC backend upstream since GCC 7 (2017), matured by GCC 8/9; no minimum version is pinned in `configure.ac`. Confirmed working via Debian/Ubuntu riscv64 buildds |
| GCC | runtime-dependency, critical -- provides `libatomic` when the toolchain requires it for `__atomic_fetch_and_1` | Resolved via the same `AC_SEARCH_LIBS` probe since v2.0.17; correctly detects when `-latomic` is/isn't needed on riscv64 GCC builds |
| LLVM | build-dependency, optional -- alternate compiler (Clang); CI runs an explicit `CC=clang` build step (x86 only, not riscv64) | LLVM riscv64 builds do not ship a separate `-latomic`; the unconditional link added by PR #131 broke this and was reverted by PR #197. Current `AC_SEARCH_LIBS` detection correctly handles LLVM on riscv64 |
| autoconf | build-dependency, critical -- generates `configure` from `configure.ac` (`AC_PREREQ([2.64])`) | riscv64 is a fully supported autotools host/target; no arch-specific macros required |
| automake | build-dependency, critical -- generates `Makefile.in` from `Makefile.am` | Same as autoconf; no riscv64-specific handling needed |
| libtool | build-dependency, critical -- builds `libnuma.so`/`.a` | Same as autoconf/automake; no riscv64-specific handling needed |
| libm (`-lm`) | runtime-dependency, used only by the `numademo` benchmark binary, auto-vectorized by the compiler (no intrinsics) | Fully supported on riscv64; `-ftree-vectorize` degrades to scalar codegen in the absence of RVV, with no functional impact |

No JIT, SIMD, crypto, or compression dependencies exist in libnuma's dependency graph, so no deeper recursive dependency analysis is applicable beyond the Linux kernel and the C runtime/toolchain layer covered above.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#248](https://github.com/numactl/numactl/issues/248) | `numa_init` call-ordering regression via malloc hooks | Open (Jul 2025) | High | Calling `numa_set_bind_policy()` from a malloc hook during `numa_init` produces "request to allocate mask for invalid number: Invalid argument," introduced by commit `fd4ec69`. Not riscv64-specific. |
| [#227](https://github.com/numactl/numactl/issues/227) | Memory leak in `numa_distance` via `dlopen`/`dlclose` | Open (Jul 2024) | Medium | ASAN-confirmed 64-byte leak per load/unload cycle, reported on AArch64. Not riscv64-specific. |
| [#243](https://github.com/numactl/numactl/issues/243) | Static analysis findings (Ericsson, CodeChecker, v2.0.18) | Open (Feb 2025) | Unknown | Findings stored in an attached CSV only. Not riscv64-specific. |
| [#240](https://github.com/numactl/numactl/issues/240) | Build failure: `sys/shm.h` not properly linked | Open (Jan 2025) | Medium | Build/link correctness issue. Not riscv64-specific. |
| [#126](https://github.com/numactl/numactl/issues/126) | Memory policy functions return 0 instead of -1 on error | Open (Mar 2022) | Medium | API contract violation on some error paths. Not riscv64-specific. |
| [#205](https://github.com/numactl/numactl/issues/205) | Missing `clearcache` implementation for aarch64 and riscv64 | Open (Jan 2024) | Low | Labeled "help wanted." riscv64 is in the same state as aarch64: build warning only, no functional impact on the core library. No fix merged as of this report. |

No open GitHub issue is riscv64-specific (`search_issues` for "riscv"/"riscv64"/"riscv64 performance"/"riscv64 bug" scoped to `numactl/numactl` each return zero matches). The only riscv64-specific defects ever filed were fixed via the merged PRs in Section 2 (#131 introduced a regression later fixed by #197/#198; #260 closed the `set_mempolicy_home_node` build-warning gap). No correctness or performance bug specific to riscv64 is currently open, and libnuma performs no floating-point arithmetic, so no NaN/floating-point semantics issue exists for any architecture.

## 12. Objections and Upstream Blockers

No stated objections to riscv64 support exist anywhere in the project's history. The only riscv64-specific PR that was reverted (#131, reverted by #197) was reverted on technical grounds -- toolchain-based detection is more correct than architecture-based detection -- not because riscv64 support itself was rejected.

**Technical blockers:**

1. PR #260's `set_mempolicy_home_node` fix is merged to `master` but not yet in a tagged release; the next `v2.0.20`-or-later release is required for distro packages to pick it up. This is a release-cadence gap, not a code gap.
2. `clearcache.c` has no riscv64 implementation (issue #205, open since January 2024, "help wanted," no fix merged). A Zicbom-based `cbo.flush` implementation, or a documented no-op fallback for hardware lacking Zicbom, would close this; it is a benchmark-tool warning, not a functional blocker.
3. No upstream CI runs on riscv64 in any form (QEMU or native), across all four CI configuration files present in the repository (Section 7). There is no mechanism for upstream to catch riscv64 regressions automatically.

**Organizational blockers:** None identified. Andi Kleen merged PR #131 in one day and PR #260 the same day it was opened; PR #197/#198 took about 2.5 months from open to merge with no recorded pushback. The project accepts community and corporate contributions (Google's dklimkin, in the most recent case) without resistance.

**Acceptance probability:** High for small, targeted patches. The project has demonstrated repeated, low-friction acceptance of riscv64-specific fixes from both individual and corporate contributors; a well-formed patch adding riscv64 CI or a `clearcache` implementation would likely be accepted based on this merge history, though no one has yet submitted either.

## 13. Readiness Assessment

- **Color:** orange (downstream-only)
- **Release provider:** distro
- Optimization level: not applicable -- libnuma is not an optimization-purpose project. It is a thin syscall wrapper around `mbind`/`get_mempolicy`/`set_mempolicy`/`migrate_pages`/`move_pages` with no SIMD, crypto, JIT, or numerics differentiator, so no optimization-gap analysis applies.

**Justification:** libnuma/numactl has no upstream riscv64 CI at all. [`codeql.yml`](https://github.com/numactl/numactl/blob/master/.github/workflows/codeql.yml), [`makefile.yml`](https://github.com/numactl/numactl/blob/master/.github/workflows/makefile.yml), [`cut-release.yml`](https://github.com/numactl/numactl/blob/master/.github/workflows/cut-release.yml), and the legacy `.travis.yml` all run only on x86_64 (`ubuntu-latest`/`bionic`); a grep for "riscv" across all four files returns zero matches, and there is no `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml`. Upstream GitHub Releases are source-only tarballs with no riscv64 binary asset, so the release provider is not upstream. This maps to the "no upstream CI" base case, orange. The distribution floor applies because Debian sid (main pool, not ports) and Ubuntu 26.04 (ports) both build and ship real riscv64 `.deb` binaries at v2.0.19, verified in this report by direct download of `libnuma1_2.0.19-1+b2_riscv64.deb` and `libnuma1_2.0.19-1build1_riscv64.deb` -- so the project is not entirely unsupported on riscv64 in practice. Whether those distro packages are built from unmodified upstream source or carry riscv64-specific patches could not be confirmed [NEEDS VERIFICATION] regarding Debian's `syscall.c` handling, so per the grading rule the floor upgrade is capped at orange (downstream-only) rather than yellow (clean-distro-build).

**Pending work that could change the grade:** PR #260 (merged 2026-09-23, "Fix fallback for `set_mempolicy_home_node` syscall for RISC-V") is only on `master` and not yet in a tagged release (latest tag v2.0.19 is from 2024-10-24) -- once released, it closes the last known riscv64-specific code gap. Issue #205 (missing `clearcache` implementation, shared with aarch64) remains open since January 2024, labeled "help wanted," with no fix merged. No RISE Project involvement or funded work was found for libnuma/numactl in any source checked (blog posts, wheel_builder listing, GitHub org `riseproject-dev`, targeted web searches). No upstream riscv64 CI job (QEMU or native runner) has been proposed or added; adding one would be the single highest-leverage change to raise the grade. Debian/Ubuntu packaging patch status (vanilla vs riscv-patched) was not independently verified and, if confirmed unpatched, would justify reclassifying to yellow (clean-distro-build).

## 14. Investment Analysis

RISE has no involvement with libnuma: no RISE blog post, GitHub repository, working group, or funded project references it anywhere checked, including all identified RISE blog posts individually, the RISE wheel_builder package list (84 riscv64 Python wheels, none named libnuma), and the `riseproject-dev` GitHub org (26 repos, none libnuma-related). All items below represent work not covered by any existing funded effort.

### 14.1 Functional Enablement

One functional gap remains open:

1. Implement `clearcache` for riscv64 in `clearcache.c` (issue #205). This is shared work with the identical aarch64 gap. A correct riscv64 implementation would use `cbo.flush` (Zicbom extension) with a documented no-op fallback on hardware lacking Zicbom. Effort: low. The `set_mempolicy_home_node` gap (Section 4) is already fixed upstream via PR #260; the only remaining action there is waiting for, or requesting, the next tagged release.

### 14.2 Performance Optimization

Data not available: no public benchmark comparison data exists for libnuma on riscv64, whether against arm64, amd64, or in absolute terms. No RISE publication, blog post, or third-party source found in this research contains numeric libnuma-on-riscv64 performance results. Performance optimization of libnuma itself is not a meaningful investment target: the library is a thin syscall wrapper with no compute-intensive paths, and `numa_available()` returns -1 on all current riscv64 boards (no multi-node riscv64 hardware in wide deployment), so the NUMA policy paths that would be worth benchmarking are not exercisable on available hardware today. `stream_lib.c` auto-vectorizes via `-ftree-vectorize`; adding RVV intrinsics would benefit only the `numademo` benchmark binary, not a production workload.

### 14.3 CI/CD Infrastructure

This is the highest-value investment area, since it is the primary driver of the orange grade. Options:

- QEMU-based riscv64 cross-compilation and build/test job added to `makefile.yml`. NUMA-policy tests will be skipped under a single-node QEMU guest, but build verification is achieved and regressions on riscv64-relevant code paths (syscall number tables, atomic detection) would be caught automatically.
- Native riscv64 runner (RISE-hosted or self-hosted on SiFive/StarFive hardware) for full test execution, including exercising the non-NUMA-dependent parts of the test suite.

### 14.4 Ecosystem Enablement

Not applicable. libnuma is a system library with no dependent package ecosystem (it has no PyPI, npm, or Maven presence) requiring separate riscv64 enablement; its only consumers are downstream C/C++ binaries linking against `libnuma.so`, which distro packaging already covers.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Get PR #260 into a tagged release (request/cut a new numactl release) | 0.1 | Maintainer (andikleen) | High |
| Functional | Implement `clearcache` for riscv64 (Zicbom `cbo.flush` or documented no-op fallback) | 0.5 | Community contributor | Low |
| CI/CD | Add QEMU riscv64 cross-build job to `makefile.yml` | 0.5 | Community contributor | High |
| CI/CD | Add native riscv64 runner for full test execution | 2 | RISE or chip vendor | Medium |
| Verification | Confirm whether Debian/Ubuntu riscv64 packages are built from unmodified upstream source or carry local `syscall.c` patches | 0.25 | Community contributor / distro maintainer | Medium (directly affects readiness grade) |
| Bugfix | Resolve `numa_init` malloc hook ordering regression (#248) | 1-2 | Community (any platform) | High (not riscv64-specific) |

## 15. References

- [numactl/numactl repository](https://github.com/numactl/numactl)
- [PR #131: Fix build error on riscv64 by linking libatomic](https://github.com/numactl/numactl/pull/131)
- [PR #197: Revert "Fix build error on riscv64 by linking libatomic"](https://github.com/numactl/numactl/pull/197)
- [PR #198: Include fcntl.h instead of sys/fcntl.h](https://github.com/numactl/numactl/pull/198)
- [PR #260: Fix fallback for set_mempolicy_home_node syscall for RISC-V](https://github.com/numactl/numactl/pull/260)
- [Commit ab036a3: Same syscall number for __riscv](https://github.com/numactl/numactl/commit/ab036a3f74453ff34ede915fb4cbc7c7b0d7f6de)
- [Issue #248: numa_init malloc hook regression](https://github.com/numactl/numactl/issues/248)
- [Issue #227: Memory leak in numa_distance via dlopen](https://github.com/numactl/numactl/issues/227)
- [Issue #243: Static analysis report (Ericsson)](https://github.com/numactl/numactl/issues/243)
- [Issue #240: sys/shm.h build failure](https://github.com/numactl/numactl/issues/240)
- [Issue #205: Missing clearcache for aarch64 and riscv64](https://github.com/numactl/numactl/issues/205)
- [Issue #126: Memory policy functions return 0 on error](https://github.com/numactl/numactl/issues/126)
- [numactl GitHub Actions workflow: makefile.yml](https://github.com/numactl/numactl/blob/master/.github/workflows/makefile.yml)
- [numactl GitHub Actions workflow: codeql.yml](https://github.com/numactl/numactl/blob/master/.github/workflows/codeql.yml)
- [numactl GitHub Actions workflow: cut-release.yml](https://github.com/numactl/numactl/blob/master/.github/workflows/cut-release.yml)
- [numactl GitHub releases](https://github.com/numactl/numactl/releases)
- [Debian sid libnuma-dev package details](https://packages.debian.org/sid/libnuma-dev)
- [Ubuntu jammy libnuma1 package (Launchpad)](https://launchpad.net/ubuntu/jammy/+package/libnuma1)
- [Ubuntu noble libnuma-dev package (Launchpad)](https://launchpad.net/ubuntu/noble/+package/libnuma-dev)
- [Ubuntu resolute (26.04) package search for libnuma](https://packages.ubuntu.com/search?keywords=libnuma&suite=resolute&searchon=names&section=all)
- [Ubuntu ports archive, numactl pool directory](https://ports.ubuntu.com/pool/main/n/numactl/)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project blog: Easy Installation of Binary Python Packages on riscv64 Devices](https://riseproject.dev/2025/05/14/easy-installation-of-binary-python-packages-on-riscv64-devices/)
- [RISE Python wheel builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE Project blog: Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [Third-party (dev.to): The Dependency Rabbit Hole, why 25 RISC-V Python Wheels Weren't Enough](https://dev.to/gounthar/the-dependency-rabbit-hole-why-25-risc-v-python-wheels-werent-enough-13e7)
- [LWN: riscv, Add numa support for riscv64 platform](https://lwn.net/Articles/809181/)
- [LWN: NUMA emulation for arm64](https://lwn.net/Articles/979652/)