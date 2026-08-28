---
title: mimalloc
parent: Project Reports
categories:
  - libraries
---

# mimalloc

**Author:** Ludovic HENRY \<ludovic.henry@qti.qualcomm.com\><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for mimalloc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

mimalloc is a general-purpose memory allocator written in C, developed at Microsoft Research. It is licensed under the MIT License. The repository is [microsoft/mimalloc](https://github.com/microsoft/mimalloc) under the Microsoft GitHub organization. There is no external foundation affiliation (Linux Foundation, Apache Software Foundation, etc.).

The project is effectively single-maintainer. Daan Leijen (`daanx`) is the creator and sole active committer on the `main`, `dev2`, and `dev3` branches, with 3,319 commits. David Carlier (`devnexen`) has 40 commits and contributes cross-platform fixes. All other contributors have fewer than 15 commits each.

Governance is informal. No MAINTAINERS, OWNERS, or CODEOWNERS file exists. Contributions require signing a Microsoft CLA. Security reports go to MSRC (Microsoft Security Response Center). There is no technical steering committee.

Microsoft is not a member of the RISE Project. No RISE blog posts or RISE wheel builder entries mention mimalloc. No RISE-funded work on mimalloc was found.

Community culture toward new ports is receptive but slow. The maintainer expressed interest in RISC-V hardware ("Very nice that you have a riscV machine -- I'm jealous") but the pattern across 2024-2026 is: community files PRs, maintainer acknowledges, PRs accumulate without merging. The project has a single-maintainer review bottleneck.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-08-10 | Issue [#610](https://github.com/microsoft/mimalloc/issues/610) opened: "MI_HINT area is outside the VA range on some systems" -- names RISC-V SV39 and AArch64 39-bit VA as affected | GitHub |
| 2022-11-05 | Issue [#640](https://github.com/microsoft/mimalloc/issues/640) opened: general aligned OS memory allocation failures; RISC-V SV39 discussion later branched to #939 | GitHub |
| 2024-09-02 | First RISC-V field report in #640 comments -- user `orlitzky` reports alignment failures on RISC-V/musl machine | GitHub |
| 2024-09-13 | Issue [#939](https://github.com/microsoft/mimalloc/issues/939) opened: "Unable to obtain aligned memory on RISC-V systems with an SV39 MMU" -- tested on Milk-V Pioneer Box; root cause identified as 2 TiB mmap hint exceeding 256 GiB SV39 ceiling | GitHub |
| 2024-10-18 | PR [#949](https://github.com/microsoft/mimalloc/pull/949) submitted by `orlitzky`: build-time SV39 detection via CMake + `/proc/cpuinfo`; introduces `MI_NO_ALIGNED_HINT` macro | GitHub |
| 2024-10-28 | Maintainer `daanx` integrates CMake SV39 check into dev branch as commit `b3828bb` -- adds `virtual_address_bits` to `mi_os_mem_config_t`; rejects `os.c` changes; states preference for runtime detection for binary distribution | GitHub |
| 2024-12-23 | Issue #939 closed by `orlitzky` (PR #949 closed without direct merge; fix absorbed upstream via `b3828bb`) | GitHub |
| 2025-01-03 | v3.0.1-alpha / v1.9.8 / v2.1.9 release notes list a "build compilation fix for riscV" alongside Windows arm64, cygwin, and DragonFly fixes | [NEEDS VERIFICATION] -- release notes referenced but not fetched verbatim |
| 2025-10-11-12 | PRs [#1154](https://github.com/microsoft/mimalloc/pull/1154) and [#1156](https://github.com/microsoft/mimalloc/pull/1156) by `MahnoKropotkinvich`: "Implement RISC-V64 atomic_yield fastpath" -- both closed without merge | GitHub |
| 2026-05-18 | PR [#1296](https://github.com/microsoft/mimalloc/pull/1296) by `aurel32`: runtime hwprobe VA detection -- closed 2026-06-24; wrong base branch (targeted main instead of dev) | GitHub |
| 2026-05-25 | PR [#1299](https://github.com/microsoft/mimalloc/pull/1299) by `aurel32`: successor to #1296, targets `dev3` branch; runtime VA detection via `hwprobe` (Linux 6.11+) with `/proc/cpuinfo` fallback; open as of 2026-06-24 | GitHub |
| 2026-06-05 | PR [#1305](https://github.com/microsoft/mimalloc/pull/1305) by `mengzhuo`: riscv64 TLS and atomic yield -- closed 2026-06-24; wrong base branch | GitHub |
| 2026-06-23 | PR [#1319](https://github.com/microsoft/mimalloc/pull/1319) by `mengzhuo`: successor to #1305, targets `dev` branch; riscv64 TLS via `tp` register and `pause`/Zihintpause atomic yield; open as of 2026-06-25, no reviews assigned | GitHub |

**Key contributors to the RISC-V port:** `orlitzky` (initial bug report and first fix attempt), `aurel32` (Debian developer; runtime VA detection), `mengzhuo` (TLS and atomic yield). None are affiliated with Microsoft. `daanx` (Microsoft Research) is the sole gatekeeper.

**Is the port fully upstream?** No. The only merged riscv64-specific change is the Dec 2024 `MI_NO_ALIGNED_HINT` / `virtual_address_bits` build-time workaround. Two PRs with substantive riscv64 code (#1299, #1319) are open and unmerged.

---

## 3. Upstream Support Tier

mimalloc has no formal tier policy document. Support tier is inferred from CI coverage, release artifacts, and maintainer statements.

| Signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI runner | Native (ubuntu-latest) | Native (ubuntu-22.04-arm) | None |
| Release binary | Yes (linux-x64) | Yes (linux-arm64) | No |
| Cross-compile CI | Win32 (x86) | No | No |
| Maintainer-authored code | Yes | Yes | No |
| Build-time workaround for known crash | N/A | N/A | Yes (SV39 hint suppression) |

**riscv64 effective tier: unsupported / best-effort community.** The architecture compiles and functionally works (via generic C fallbacks) but has no CI, no upstream binaries, no maintainer-authored arch code, and two open PRs that have been waiting for review for weeks to months.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

mimalloc has no JIT backend, no GC, no SIMD allocator path, and no cryptographic subsystem. The architecture-specific surface area is limited to three components:

**4.1 TLS (Thread-Local Storage) fast path**

Each thread has a mimalloc heap pointer stored in a TLS slot. The fast path reads a thread-pointer register directly to avoid the `pthread_getspecific` call overhead. On amd64 this uses the FS segment register; on arm64 it uses `mrs tpidr_el0`. On riscv64, the `tp` register serves the equivalent role.

- Current dev branch: no `#ifdef __riscv` block in `include/mimalloc/prim.h`. riscv64 falls through to the generic `__thread` variable path -- correct but slower.
- PR [#1319](https://github.com/microsoft/mimalloc/pull/1319) adds `mv %0, tp` inline assembly for riscv64 TLS slot read/write, plus opts riscv64 into the `__builtin_thread_pointer()` path for GCC >= 7 and into the glibc fast-TLS eligibility guard.

**4.2 Atomic yield / spin-wait hint**

Used in the lock-free fast path when spinning on a contested operation. On x86 this is the `pause` SSE2 instruction; on arm64 it is `isb`. The RISC-V equivalent is the `pause` instruction from the Zihintpause extension.

- Current dev branch: no `#ifdef __riscv` block in `include/mimalloc/atomic.h`. riscv64 falls through to `sleep(0)` -- a full OS scheduler yield, orders of magnitude heavier than a spin hint. This is a correctness-adjacent regression under high contention.
- PR [#1319](https://github.com/microsoft/mimalloc/pull/1319) adds `__asm__ volatile("pause" ::: "memory")` under `#if defined(__riscv_zihintpause)`, with `nop` fallback for hardware lacking Zihintpause.

**4.3 Virtual address space alignment hinting**

mimalloc uses `mmap()` with hint addresses starting near 2 TiB to keep heap metadata close together. On SV39 RISC-V, user virtual address space tops out at 256 GiB, so every hint above that fails with `ENOMEM`.

- Merged (main, Dec 2024): CMake reads `/proc/cpuinfo` at build time for `mmu: sv39/sv48/sv57` and sets `MI_DEFAULT_VIRTUAL_ADDRESS_BITS` accordingly; `MI_NO_ALIGNED_HINT` macro skips the doomed hint. This is a build-time-only fix -- a binary built on SV39 hardware segfaults when run on SV48/SV57 hardware.
- PR [#1299](https://github.com/microsoft/mimalloc/pull/1299): replaces build-time check with runtime `hwprobe` syscall (`RISCV_HWPROBE_KEY_HIGHEST_VIRT_ADDRESS`, Linux 6.11+) and `/proc/cpuinfo` fallback for older kernels. Unmerged as of 2026-06-25.

**4.4 Architecture detection in CMake**

`CMakeLists.txt` detects RISC-V via `CMAKE_SYSTEM_PROCESSOR MATCHES "^(riscv|riscv32|riscv64)$"` and sets `MI_ARCH` to `riscv32` or `riscv64` based on pointer size. No `-march=` optimization flags are injected for riscv64 (arm64 gets `-march=armv8.1-a`; riscv64 gets nothing).

**Component comparison table:**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| TLS register access | Full (FS segment asm) | Full (`mrs tpidr_el0`) | Missing -- `__thread` fallback |
| Atomic yield/pause | Full (`pause` SSE2 asm) | Full (`isb` asm) | Missing -- `sleep(0)` fallback |
| VA space alignment | Full | Full | Partial -- build-time workaround only; runtime detection in open PR #1299 |
| Arch detection in CMake | Full | Full | Partial -- detection present, no optimization flags |
| ISA extension usage | SSE2 (pause) | ARM8.1 (atomics) | None merged; Zihintpause in open PR #1319 |
| Dedicated prim directory | unix/ | unix/ | None -- no riscv/ subdir |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Requirements:** CMake >= 3.18 (uses `CheckLinkerFlag`). GCC >= 7 for `__builtin_thread_pointer()` optimization on riscv64 (detected via `__GNUC__ >= 7 && __riscv`, added in PR #1319 -- not yet merged). No minimum GCC/Clang version is stated in upstream docs for general riscv64 support.

**Native build (riscv64 Linux):**

```
mkdir build && cd build
cmake .. -DCMAKE_BUILD_TYPE=Release -DMI_BUILD_TESTS=OFF
make -j$(nproc)
```

**Cross-compilation (no upstream toolchain file exists):**

```
mkdir build && cd build
cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=riscv64-linux-gnu.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DMI_BUILD_TESTS=OFF \
  -DMI_OVERRIDE=ON
make -j$(nproc)
```

For musl static builds:

```
cmake .. \
  -DCMAKE_TOOLCHAIN_FILE=riscv64-linux-musl.cmake \
  -DCMAKE_BUILD_TYPE=Release \
  -DMI_LIBC_MUSL=ON \
  -DMI_BUILD_TESTS=OFF
```

**Critical cross-compilation caveat:** The build-time `/proc/cpuinfo` SV39 detection (`file(STRINGS /proc/cpuinfo ...)`) reads the build host, not the target. If the build machine is SV39 and the target is SV48/SV57, the resulting binary will apply the SV39 hint cap on a system that does not need it. Workaround: pass `-UMI_SV39_MMU` to CMake or use runtime detection from open PR #1299.

**Relevant CMake flags for riscv64:**

| Flag | Effect |
|---|---|
| `-DMI_LIBC_MUSL=ON` | Enables local-dynamic TLS for static builds; required for musl |
| `-DMI_LOCAL_DYNAMIC_TLS=ON` | dlopen-compatible TLS (`-ftls-model=local-dynamic`) |
| `-DMI_OPT_ARCH=OFF` | Default for riscv64; arm64 auto-enables but riscv64 does not |
| `-DMI_BUILD_TESTS=OFF` | Required for cross-builds; tests cannot run natively |
| `-DMI_OVERRIDE=ON` | Enable malloc override via `LD_PRELOAD` |
| `-DMI_SECURE=ON` | Guard pages and encrypted free lists |

`libatomic` is auto-detected via a linker flag probe (not `find_library`); this works correctly for cross-builds.

**QEMU:** No QEMU references anywhere in the upstream repository -- no workflow files, no Dockerfiles, no documentation. The upstream project has never used QEMU for riscv64 testing.

**Known build issues:** The Dec 2024 SV39 fix introduced a build-time-only workaround. A binary compiled on SV39 hardware and distributed to SV48/SV57 hardware will segfault due to wrong `virtual_address_bits` being baked in at compile time. This is the exact bug that PR #1299 fixes.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Memory allocation (correctness) | Full | Full | Full -- via overallocation fallback |
| Aligned OS memory hints | Full | Full | Partial -- SV39 suppressed at build time; may fail if built on wrong MMU config |
| TLS fast path | Full | Full | Missing -- `__thread` fallback only |
| Atomic yield spin hint | Full | Full | Missing -- `sleep(0)` fallback (heavy) |
| ISA extension optimization | SSE2 | ARM8.1 atomics | None |
| Prebuilt upstream binary | Yes | Yes | No |
| CI validation | Yes | Yes | No |
| Cross-compile safety | N/A | Partial | Broken (VA bits baked at build time) |
| musl static build | Supported | Supported | Supported (untested upstream) |

**Functional gaps:** None that affect correctness under normal use. The overallocation fallback ensures allocation succeeds even when aligned hints fail. A cross-compiled or redistributed binary may segfault if the VA-bits mismatch issue from PR #1299 is not resolved.

**Performance gaps:** Two regressions vs arm64/amd64:
1. TLS read per allocation uses `pthread_getspecific` or `__thread` instead of a direct register read. Overhead is allocation-count-proportional. No quantitative riscv64 benchmark data exists to measure the delta.
2. Atomic yield falls to `sleep(0)` instead of a spin hint. Under contended multithreaded workloads this converts spin-wait loops into full OS scheduler yields. For lock-heavy workloads this can cause unnecessary context switches and latency spikes.

**Security hardening:** `-DMI_SECURE=ON` (guard pages, encrypted free lists) works on riscv64 via generic C code. No riscv64-specific gaps in the security features.

**No floating-point, NaN, or numerics concerns** -- mimalloc is a pure memory allocator.

---

## 7. CI/CD Infrastructure

No riscv64 CI exists in microsoft/mimalloc. This was confirmed by direct inspection of the following files:

- [`.github/workflows/test.yaml` (main branch)](https://raw.githubusercontent.com/microsoft/mimalloc/main/.github/workflows/test.yaml)
- [`.github/workflows/test.yaml` (dev branch)](https://raw.githubusercontent.com/microsoft/mimalloc/dev/.github/workflows/test.yaml)
- [`.github/workflows/release.yaml` (dev branch)](https://raw.githubusercontent.com/microsoft/mimalloc/dev/.github/workflows/release.yaml)

No `.gitlab-ci.yml`, `.cirrus.yml`, or `Jenkinsfile` exists in the repository (all returned 404).

**CI matrix (test.yaml):**

| Runner | Architecture |
|---|---|
| windows-latest | x86_64 |
| macos-latest | ARM64 (Apple Silicon) |
| ubuntu-latest | x86_64 |
| macos-14 | ARM64 (Apple Silicon) |
| macos-15-intel | x86_64 |
| ubuntu-22.04-arm | ARM64 (Graviton) |
| windows-11-arm | ARM64 |
| Windows Win32 cross-compile | x86 32-bit |

No riscv64 runner, no QEMU emulation step, no cross-compiler targeting RISC-V.

**release.yaml** produces binary bundles for: `windows-latest`, `macos-latest`, `macos-15-intel`, `ubuntu-22.04`, `ubuntu-22.04-arm`. No riscv64 bundle is produced.

| CI signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native CI runner | Yes | Yes | No |
| QEMU emulation CI | No | No | No |
| Cross-compile CI | Win32 only | No | No |
| Release binary produced | Yes | Yes | No |
| RISE CI runner | No | No | No |

Open PRs #1299 and #1319 add riscv64 code but neither introduces CI coverage for RISC-V.

---

## 8. Distribution and Release Status

**Upstream GitHub releases:** Releases v3.3.0 through v3.3.2 (latest) each ship 27-29 binary assets covering v1/v2/v3 variant libraries for: `linux-x64`, `linux-arm64`, `macos-x64`, `macos-arm64`, `windows-x64`, `windows-x86`, `windows-arm64`, `windows-arm64ec`. No `linux-riscv64` or `riscv64` asset exists in any release. Verified via [GitHub Releases API](https://api.github.com/repos/microsoft/mimalloc/releases?per_page=5).

**PyPI:** No PyPI package named `mimalloc` exists. The endpoint `https://pypi.org/pypi/mimalloc/json` returns HTTP 404.

**Ubuntu 24.04 (Noble):** Four riscv64 packages are available in the `universe` component:
- `libmimalloc2.0` version `2.1.2+ds-2` -- riscv64 in universe
- `libmimalloc-dev` version `2.1.2+ds-2` -- riscv64 in universe
- `librust-libmimalloc-sys-dev` 0.1.25-1 -- riscv64
- `librust-mimalloc-dev` 0.1.29-1 -- riscv64

Note: Ubuntu ships version 2.1.2, which is two major versions behind upstream 3.3.2.

**Debian unstable (sid):** mimalloc version `3.3.2+ds-1` is confirmed installed for riscv64 on build daemon `rv-osuosl-03`. Source: [buildd.debian.org](https://buildd.debian.org/status/package.php?p=mimalloc&suite=sid). This is a distro-packaged build, not an upstream-provided binary. The `+ds` suffix indicates Debian-specific repacking.

**Arch Linux RISC-V:** Status unknown. The archriscv.felixc.at search index returned no mimalloc entry; direct URLs returned HTTP 404. Neither confirmed nor denied.

**To obtain a working riscv64 binary:** Use `apt install libmimalloc-dev` on Ubuntu 24.04 (gets 2.1.2) or Debian sid (gets 3.3.2). Alternatively, build from source using the CMake instructions above. No upstream prebuilt binary exists.

---

## 9. Dependencies

mimalloc is a standalone C library with no external library dependencies beyond system primitives. CMakeLists.txt links only `pthread`, `rt`, and optionally `atomic` on Linux; Win32 APIs on Windows. No JIT backend, no SIMD library, no crypto library, no compression dependency. No recursive dependency deep-dive is required.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| pthread (glibc/musl) | Thread support | OK | OK | Released in all distros | Standard Linux primitive |
| rt (glibc) | POSIX realtime -- `clock_gettime` | OK | OK | Released | Standard |
| libatomic (GCC) | Fallback atomic ops | OK | OK | Released | GCC provides for riscv64; auto-detected via linker flag probe |
| mimalloc itself | Memory allocator | Builds; SV39 fallback warnings | No upstream CI | Debian sid 3.3.2; Ubuntu Noble 2.1.2 | See open bugs below |

There are no dependency blockers for riscv64. All system-level dependencies are fully available on riscv64 Linux.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#610](https://github.com/microsoft/mimalloc/issues/610) | MI_HINT area is outside the VA range on some systems | Open | Medium | Names RISC-V SV39 and AArch64 39-bit VA; same root cause as #939; no fix proposed |
| [#640](https://github.com/microsoft/mimalloc/issues/640) | Lots of warnings due to failing to allocate aligned OS memory | Open | Low-Medium | Not RISC-V-specific; SV39 discussion branched to #939; affects performance via overallocation fallback |
| [#939](https://github.com/microsoft/mimalloc/issues/939) | Unable to obtain aligned memory on RISC-V systems with an SV39 MMU | Closed | High | Root cause: 2 TiB mmap hint exceeds 256 GiB SV39 ceiling. Build-time workaround merged Dec 2024. Runtime fix pending in PR #1299 |
| [#1299](https://github.com/microsoft/mimalloc/pull/1299) | RISC-V: detect virtual address space at runtime using hwprobe | Open PR | High | Fixes segfault when binary built on SV39 runs on SV48/SV57. Author incorporating review feedback. No merge date. |
| [#1319](https://github.com/microsoft/mimalloc/pull/1319) | Add RISC-V 64 TLS support and atomic yield functionality | Open PR | Medium | Adds `tp`-register TLS and Zihintpause yield. No reviewers assigned. No merge date. |
| (no issue) | Atomic yield falls to `sleep(0)` on riscv64 | Implicit in #1319 | Medium-High | Under contended workloads, `sleep(0)` causes full context switches instead of spin-wait. Performance regression for multithreaded use. |
| (no issue) | Cross-compiled binaries have baked-in wrong VA bits | Implicit in #1299 | High (correctness) | A binary built on SV39 hardware and run on SV48/SV57 hardware may segfault. The build-time `/proc/cpuinfo` check cannot handle this scenario. |

**Correctness bugs:** The VA-bits cross-compilation segfault (related to #1299) is a correctness issue, not just a performance issue. Binaries built and distributed from SV39 machines will crash on SV48/SV57 hardware. This affects any packager or CI system that cross-compiles on RISC-V hardware.

---

## 12. Objections and Upstream Blockers

**Technical blockers:**

1. PR #1299: maintainer `daanx` posted review comments to the wrong PR (#1296 instead of #1299). The author `aurel32` must incorporate the feedback into #1299 before re-review. Review comments include: `__has_include` requires C23 but mimalloc targets C11 (suggested CMake `CHECK_INCLUDE_FILES` instead); `/proc/cpuinfo` buffer size (2048 bytes required due to long ISA extension strings on SpacemiT K3); minor style issues. These are addressable in 1-2 days of work [NEEDS VERIFICATION -- no indication of author availability].

2. PR #1319: no reviewer is assigned. `daanx` reviewed the predecessor PR #1305 and requested a rebase to the `dev` branch; `mengzhuo` complied but the new PR has received no reviews. No stated objections.

**Organizational blockers:**

The primary blocker is single-maintainer bandwidth. `daanx` is the sole approver. Both open PRs are small, well-scoped, and technically sound. The delay is review latency, not technical rejection.

**Acceptance probability:** High for both PRs, based on: (1) `daanx` explicitly integrated the earlier SV39 fix from PR #949 himself, signaling that RISC-V fixes are acceptable; (2) both open PRs follow patterns already used for arm64 and x86; (3) there is no stated objection to the RISC-V work, only process delays.

**RISE involvement:** None. No RISE member organization has filed issues or PRs. No RISE blog post, wheel builder entry, or funded project covers mimalloc.

---

## 13. Investment Analysis

RISE has done no work on mimalloc. The two open PRs (#1299, #1319) represent active community work that just needs maintainer review to land.

### 13.1 Functional Enablement

The riscv64 port is functionally complete in the sense that allocation succeeds via fallback paths. Two correctness/reliability issues remain:

1. Cross-compiled binaries may segfault on mismatched VA hardware (PR #1299 fixes this).
2. Atomic yield uses `sleep(0)` instead of a spin hint (PR #1319 fixes this).

Both PRs are written, technically sound, and waiting for review. Sponsoring a RISE member or contributor to push these through to merge (rebasing, responding to review comments, pinging maintainer) is low-effort work.

### 13.2 Performance Optimization

No riscv64 performance data exists. The two missing optimizations are TLS fast path (PR #1319) and atomic yield (PR #1319). Once #1319 lands, quantitative benchmarking on representative RISC-V hardware (SpacemiT K3, Milk-V Pioneer, or similar) to compare against arm64 and x86-64 would be the logical next step. No upstream benchmark infrastructure exists for riscv64 -- a RISE-hosted runner would need to run the existing `bench/` directory workloads.

The published x86-64 benchmarks (AMD 5950x, Zen3) show mimalloc 13% faster than tcmalloc on `leanN`, 2.5x faster than jemalloc on `sh6bench`. No riscv64 baseline exists.

### 13.3 CI/CD Infrastructure

Zero riscv64 CI exists upstream. A riscv64 GitHub Actions runner (hardware or QEMU) would provide regression detection. The existing `test.yaml` matrix could be extended with a single `ubuntu-riscv64` entry. This requires either a GitHub-hosted riscv64 runner (not yet available as of 2026-06) or a self-hosted runner registered with the project.

This is an organizational ask as much as a technical one -- `daanx` would need to accept a riscv64 runner into the project's CI.

### 13.4 Ecosystem Enablement

Not applicable. mimalloc has no dependent package ecosystem requiring separate enablement. It is used as a drop-in allocator via `LD_PRELOAD` or linked directly; no plugin/extension ecosystem exists.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Land PR #1299: runtime VA detection via hwprobe | 0.5 | Community (aurel32) / RISE sponsor to coordinate | Critical |
| Functional | Land PR #1319: TLS `tp`-register and Zihintpause yield | 0.5 | Community (mengzhuo) / RISE sponsor to coordinate | High |
| Functional | Fix cross-compilation toolchain documentation for SV39/SV48/SV57 | 0.5 | RISE contributor | Medium |
| CI/CD | Add riscv64 self-hosted runner to `test.yaml` | 2 | RISE (hardware + maintainer coordination) | High |
| Performance | Baseline benchmarks on riscv64 vs arm64 and x86-64 using existing `bench/` workloads | 1 | RISE engineer with access to RISC-V hardware | Medium |
| Performance | Investigate additional arch-specific opts (Zba/Zbb bitmanip for size-class calculations) if benchmarks reveal gaps | 4 | RISE engineer | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [microsoft/mimalloc repository](https://github.com/microsoft/mimalloc)
- [Issue #610: MI_HINT area is outside the VA range on some systems](https://github.com/microsoft/mimalloc/issues/610)
- [Issue #640: Lots of warnings due to failing to allocate aligned OS memory](https://github.com/microsoft/mimalloc/issues/640)
- [Issue #939: Unable to obtain aligned memory on RISC-V systems with an SV39 MMU](https://github.com/microsoft/mimalloc/issues/939)
- [PR #949: Skip aligned allocation on SV39 MMUs](https://github.com/microsoft/mimalloc/pull/949)
- [PR #1154: Implement RISC-V64 atomic_yield fastpath](https://github.com/microsoft/mimalloc/pull/1154)
- [PR #1156: Implement RISC-V64 atomic_yield fastpath (second attempt)](https://github.com/microsoft/mimalloc/pull/1156)
- [PR #1296: RISC-V: detect virtual address space at runtime using hwprobe (superseded)](https://github.com/microsoft/mimalloc/pull/1296)
- [PR #1299: RISC-V: detect virtual address space at runtime using hwprobe](https://github.com/microsoft/mimalloc/pull/1299)
- [PR #1305: Add RISC-V 64 TLS support and atomic yield functionality (superseded)](https://github.com/microsoft/mimalloc/pull/1305)
- [PR #1319: Add RISC-V 64 TLS support and atomic yield functionality](https://github.com/microsoft/mimalloc/pull/1319)
- [mimalloc test.yaml CI workflow (main branch)](https://raw.githubusercontent.com/microsoft/mimalloc/main/.github/workflows/test.yaml)
- [mimalloc release.yaml CI workflow (dev branch)](https://raw.githubusercontent.com/microsoft/mimalloc/dev/.github/workflows/release.yaml)
- [GitHub Releases API for microsoft/mimalloc](https://api.github.com/repos/microsoft/mimalloc/releases?per_page=5)
- [Ubuntu 24.04 Noble package: libmimalloc2.0](https://packages.ubuntu.com/noble/libmimalloc2.0)
- [Debian buildd status for mimalloc (sid)](https://buildd.debian.org/status/package.php?p=mimalloc&suite=sid)
- [RISE Project member list](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog)