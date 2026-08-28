---
title: jemalloc
categories:
  - libraries
---

# jemalloc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for jemalloc
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

jemalloc is a general-purpose malloc(3) implementation emphasizing low fragmentation, scalable concurrency, and profiling facilities. It is used as the default or optional allocator in Firefox, FreeBSD libc, Android Bionic, Meta production infrastructure, Redis, MySQL, and numerous other systems. The project homepage is [jemalloc.net](https://jemalloc.net/) and the repository is [github.com/jemalloc/jemalloc](https://github.com/jemalloc/jemalloc).

**License:** BSD 2-Clause.

**Foundation:** None. jemalloc is not affiliated with any umbrella organization (not CNCF, Apache, Linux Foundation, or RISE Project). It operates under the `jemalloc` GitHub organization with informal governance.

**Corporate stewardship:** Meta (Facebook) is the primary industrial steward. Recent committers (`spredolac`, `guangli-dai`) appear to be Meta engineers based on commit patterns and tooling references. Jason Evans (canonware.com) is the original author with historical primary maintainer status (previously Twitter/Meta affiliation). Mozilla Foundation held copyright 2007-2012 as an early adopter for Firefox. No MAINTAINERS or CODEOWNERS file exists; governance is implicit.

**Community stance on new ports:** Passive. The sole RISC-V-specific contribution was a one-liner macro fix in 2017 from an external contributor. An open issue about RISC-V64 cross-compilation ([issue #2399](https://github.com/jemalloc/jemalloc/issues/2399), opened March 2023) has received zero maintainer responses in over three years. There is no platform support policy, no named RISC-V contact, and no RISC-V documentation anywhere in the repository.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2017-12-03 | PR #1081 opened by EdSchouten: corrected `__riscv__` macro spelling to `__riscv` per RISC-V toolchain conventions; backward-compatible form `defined(__riscv) \|\| defined(__riscv__)` requested by reviewer | [PR #1081](https://github.com/jemalloc/jemalloc/pull/1081) |
| 2017-12-09 | PR #1081 merged (commit 749caf1) by interwq; first RISC-V-specific code lands in jemalloc | [commit 749caf1](https://github.com/jemalloc/jemalloc/commit/749caf1) |
| 2018-05-08 | jemalloc 5.1.0 released; first release with `__riscv` detection | [GitHub releases](https://github.com/jemalloc/jemalloc/releases) |
| 2019-01-03 | Issue #1401 filed by paravoid (Debian): riscv64 FTBFS due to `undefined reference to __atomic_compare_exchange_1`; root cause is riscv64 lacking native sub-word atomics, requiring libatomic not pulled in by `-lpthread` | [issue #1401](https://github.com/jemalloc/jemalloc/issues/1401) |
| 2019-01-09 | PR #1402 merged (commit 4711910): replaced `-lpthread` with `-pthread`, enabling automatic `-latomic` linkage on riscv64; fixed issue #1401 | [PR #1402](https://github.com/jemalloc/jemalloc/pull/1402) |
| 2022-08-29 | Issue #2323 filed by nc7s: `configure` does not recognize `riscv64gc-unknown-linux-gnu` triple, blocking `jemalloc-sys` Rust crate on Debian riscv64 | [issue #2323](https://github.com/jemalloc/jemalloc/issues/2323) |
| 2023-03-21 | Issue #2399 filed by jinge90: asked whether cross-compilation from x86_64 to riscv64 is supported; no maintainer response to date | [issue #2399](https://github.com/jemalloc/jemalloc/issues/2399) |
| 2025-03-07 | Issue #2814 filed by jschwe: `config.sub` and `config.guess` not updated since 2021, blocking newer platform triples including riscv64gc | [issue #2814](https://github.com/jemalloc/jemalloc/issues/2814) |
| 2026-03-11 | Commit c51949e by lexprfuncall (committed by guangli-dai): updated `config.sub` and `config.guess` to latest GNU upstream (+1,493 / -867 lines), fixing riscv64gc recognition; closed issues #2323 and #2814 | [commit c51949e](https://github.com/jemalloc/jemalloc/commit/c51949e) |
| 2026-04-13 | jemalloc 5.3.1 released; no RISC-V-specific changes | [release 5.3.1](https://github.com/jemalloc/jemalloc/releases/tag/5.3.1) |

**Key contributors:** EdSchouten (external, NuxiNL/cloudlibc) contributed the initial macro fix. paravoid (Debian) contributed the atomic linkage fix. Both were external contributors, not Meta employees.

**Upstream status:** All merged changes are upstream. The port is not carried as a downstream patch in any distro. The open items (cross-compilation documentation, CPU spinwait hint) remain unaddressed upstream.

---

## 3. Upstream Support Tier

jemalloc has no formal tier policy or published platform support matrix.

**Evidence of tier by practice:**

- CI covers x86_64, x86 32-bit, and ARM64 only. riscv64 is absent from every workflow file.
- No official binary releases for any architecture; upstream ships source tarballs only.
- No release-blocking tests for riscv64.
- Only two riscv64-related PRs exist in the project history, both from external contributors, both in response to distro build failures.

**Comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI coverage (upstream) | Yes (ubuntu-24.04) | Yes (ubuntu-24.04-arm) | No |
| Official binary releases | No (source only) | No (source only) | No (source only) |
| CPU spin-wait hint | `pause` (asm) | `isb` (asm) | volatile no-op |
| Sub-word atomic ops | Native | Native | libatomic (software) |
| Named in configure.ac | Yes | Yes | No (generic fallback) |
| Release-blocking | Yes (implicit) | Yes (implicit) | No |

riscv64 is a third-tier platform by practice: it compiles and runs, is packaged by distros without downstream patches, but has no upstream CI, no architecture-specific optimizations, and no maintainer attention.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

jemalloc has no JIT, no SIMD paths, and no cryptographic components. Architecture customization is confined to preprocessor guards in shared headers and `configure.ac` dispatch tables. There are no per-architecture source directories, no assembly files, and no arch/ subdirectory.

**Component breakdown:**

**Allocation alignment (LG_QUANTUM):** Defined in `include/jemalloc/internal/quantum.h`. riscv64 is explicitly listed:

```c
#if defined(__riscv) || defined(__riscv__)
#   define LG_QUANTUM 4
```

This sets 16-byte minimum allocation alignment (2^4), correct for the riscv64 ABI and identical to amd64 and arm64. This is the only explicit RISC-V-specific code in the entire repository.

**CPU spin-wait:** Defined in `configure.ac`. amd64 gets `asm volatile("pause")`, arm64 gets `asm volatile("isb")`. riscv64 falls to the `*)` wildcard: `HAVE_CPU_SPINWAIT=0`, which compiles to a `volatile int x = 0; x = x;` no-op. The Zihintpause extension (ratified 2021, present in the riscv64gc profile) defines a `pause` instruction that jemalloc does not use. This is a performance gap under high lock contention.

**Atomic operations:** Defined in `include/jemalloc/internal/atomic_gcc_atomic.h`. jemalloc uses `__atomic_*` GCC builtins, which the compiler lowers to native `lr`/`sc`/`amo*` instructions for 32-bit and 64-bit operations. Sub-word (8-bit, 16-bit) atomics require `libatomic` software emulation on riscv64 because the RISC-V A extension specifies only 32-bit and 64-bit LR/SC and AMO instructions. This is an ISA limitation, not a jemalloc deficiency.

**Virtual address width (LG_VADDR):** Determined at configure time via pointer-size inference. riscv64 has no explicit entry in `configure.ac`; it falls through to the generic 64-bit path (`LG_VADDR=64`). Sv39 uses 39-bit VAs, Sv48 uses 48-bit VAs. For native builds, runtime probing is correct. For cross-compilation, `--with-lg-vaddr=39` or `--with-lg-vaddr=48` must be specified explicitly.

**Page size (LG_PAGE):** arm64 is hardcoded to `LG_PAGE=16`. riscv64 falls to runtime `sysconf(_SC_PAGESIZE)` detection, which is correct for native builds (Linux/riscv64 defaults to 4 KiB pages).

**Hash function:** `include/jemalloc/internal/hash.h` routes riscv64 to the `hash_x64_128` MurmurHash3 64-bit path, same as amd64 and arm64. No architecture-specific tuning for any platform; this is a non-gap.

**Thread-local storage:** Uses `__thread` GCC TLS, fully portable, no ISA-specific assembly. No gap.

**Memory operations (madvise, huge pages):** Gated on OS-level `#ifdef` (Linux/Solaris/FreeBSD), not CPU architecture. riscv64 on Linux gets the same THP and madvise support as amd64.

**Comparison table:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Minimum alignment (LG_QUANTUM) | 4 (correct) | 4 (correct) | 4 (correct, explicit) |
| CPU spin-wait | `pause` asm | `isb` asm | volatile no-op (missing) |
| 64-bit atomic ops | Native | Native | Native (GCC builtins -> lr/sc/amo) |
| 8/16-bit atomic ops | Native | Native | libatomic software emulation |
| Virtual address width | Explicit (48) | Explicit (48) | Generic fallback (64, incorrect for Sv39) |
| Page size detection | Runtime probe | Hardcoded (arm64=16) | Runtime probe |
| Hash path | Generic 64-bit | Generic 64-bit | Generic 64-bit |
| JIT / SIMD / crypto | None | None | None |
| Assembly files | None | None | None |

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autotools (autoconf/automake). No CMake, no CMakeLists.txt, no Dockerfiles anywhere in the repository.

**Native build on riscv64:**

```bash
./autogen.sh
make
make install
```

No architecture-specific flags required. `configure` auto-detects `LG_QUANTUM=4` via the `quantum.h` preprocessor guard and detects page size via `sysconf(_SC_PAGESIZE)`.

**Cross-compilation from x86_64 to riscv64:**

No official documentation exists; issue #2399 (March 2023, no maintainer response) confirms the gap. Based on `configure.ac` analysis, the required command is:

```bash
./autogen.sh
./configure \
  --host=riscv64-linux-gnu \
  --with-lg-page=12 \
  --with-lg-vaddr=39 \
  CC=riscv64-linux-gnu-gcc \
  CXX=riscv64-linux-gnu-g++
make
```

`--with-lg-page=12` is required because `AC_RUN_IFELSE` cannot execute on the cross-compilation host; configure falls back to `je_cv_lg_page=12` (4 KiB). `--with-lg-vaddr=39` is required because the generic fallback resolves to 64, which is incorrect for Sv39; use 48 for Sv48 targets. Omitting either flag will produce a misconfigured build.

To run the test suite under cross-compilation:

```bash
JEMALLOC_TEST_PREFIX="qemu-riscv64-static -L /usr/riscv64-linux-gnu" make check
```

**Compiler requirements:** No documented minimum version. GCC 7+ supports riscv64 targets syntactically; GCC 10+ is recommended for full RISC-V ISA support. The upstream CI uses ubuntu-24.04 (GCC 13, Clang 18). The `__riscv` macro fix (PR #1081) has been present since jemalloc 5.1.0 (2018).

**Known build issues:**

- riscv64gc triple (`riscv64gc-unknown-linux-gnu`) was not recognized by `configure` until commit c51949e (March 2026). Builds from any release before 5.3.1 may fail with triple-recognition errors on riscv64gc toolchains.
- The `-Werror=use-after-free` compiler error in `test/integration/overflow.c` was reported on riscv64 in issue #2323 but the resolution status is not confirmed.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None that prevent correct operation. jemalloc builds, links, and runs on riscv64. Distro packages (Debian, Ubuntu) build without patches.

**Performance gaps:**

- CPU spin-wait: riscv64 uses a volatile no-op rather than a hardware pause/yield hint. Under high thread contention on lock-heavy allocation patterns, this prevents the CPU from reducing speculation pressure, wasting energy and potentially reducing throughput. The Zihintpause `pause` instruction (riscv64gc baseline) could be used but is not.

- Sub-word atomics: 8-bit and 16-bit CAS operations use libatomic software emulation. These paths exist in jemalloc's internal metadata manipulation. The performance delta relative to native hardware CAS on amd64/arm64 is unquantified; no benchmark data was found in any source.

**Security hardening gaps:** Data not available: no search was performed specifically for CFI, stack-clash, or other hardening flags on riscv64 vs amd64/arm64 in the jemalloc build system.

**Virtual address configuration gap:** The generic `LG_VADDR=64` fallback for riscv64 is technically incorrect for Sv39 (39-bit VA). For native builds this is inconsequential because the runtime probe overrides it. For cross-compiled builds without `--with-lg-vaddr`, the resulting binary may have incorrect huge-page pointer arithmetic [NEEDS VERIFICATION -- no reported failure found in upstream issues].

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| Correct minimum alignment | Yes | Yes | Yes |
| CPU spin-wait (hardware hint) | Yes (pause) | Yes (isb) | No (no-op) |
| Native sub-word atomics | Yes | Yes | No (libatomic) |
| Heap profiling (--enable-prof) | Yes | Yes | Yes |
| Background threads | Yes | Yes | Yes |
| Huge page support | Yes | Yes | Yes |
| Statistics | Yes | Yes | Yes |
| C++ operator new/delete | Yes | Yes | Yes |
| Cross-compilation documented | Yes (implicit) | Yes (implicit) | No |

---

## 7. CI/CD Infrastructure

All six workflow files in `.github/workflows/` were read in full and contain zero occurrences of "riscv".

**check_formatting.yaml:** Trailing whitespace check on `ubuntu-latest`. No architecture testing.

**static_analysis.yaml:** Static analysis only. No architecture testing.

**windows-ci.yml:** GCC/MinGW and MSVC. x86/x64 only.

**macos-ci.yml:** `macos-15-intel` (x86_64) and `macos-15` (ARM64). No RISC-V.

**freebsd-ci.yml:** Runs on `ubuntu-latest` via vmactions/freebsd-vm, tests `64-bit` and `32-bit` FreeBSD (x86 variants). No RISC-V.

**linux-ci.yml:** Two jobs. `test-linux` on `ubuntu-24.04` (x86_64) with a matrix covering GCC/Clang, `-m32` (32-bit x86), and approximately 80 configure-flag combinations. `test-linux-arm64` on `ubuntu-24.04-arm` (ARM64) with GCC/Clang and configure variants. No riscv64 runner, no QEMU emulation, no cross-compilation to riscv64 in any job.

**RISE CI:** No RISE project involvement in jemalloc was found. The RISE blog (27 posts scanned) contains no jemalloc mention. jemalloc does not appear in RISE member project lists.

**Comparison table:**

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Upstream CI runner | ubuntu-24.04 | ubuntu-24.04-arm | None |
| QEMU cross-test | No | No | No |
| CI covers configure variants | Yes (~80) | Yes (subset) | No |
| Release-blocking CI | Yes | Yes | No |
| RISE-funded CI runner | No | No | No |

---

## 8. Distribution and Release Status

**Upstream releases:** jemalloc ships source tarballs only. No architecture-specific binary releases. The five most recent releases (5.3.1, 5.3.0, 5.2.1, 5.2.0, 5.1.0) each contain a single `.tar.bz2` asset with no architecture in the filename.

**PyPI:** No `jemalloc` package on PyPI (HTTP 404). Not applicable.

**Debian sid:** `libjemalloc2` version 5.3.1-2, status "Installed" for riscv64. Built on `rv-osuosl-03` approximately 49 days before the research date. No build failures on riscv64; failures only on hurd-amd64 and hurd-i386 (unrelated `PATH_MAX` issue). Source: [buildd.debian.org](https://buildd.debian.org/status/package.php?p=jemalloc).

**Ubuntu 24.04 Noble (LTS):** `libjemalloc2` version 5.3.0-2build1 available for riscv64 alongside amd64, arm64, armhf, i386, ppc64el, s390x. `libjemalloc-dev` (development headers) is NOT available for riscv64 in Ubuntu Noble [NEEDS VERIFICATION -- available on amd64/arm64 but riscv64 not listed; source: packages.ubuntu.com]. Source: [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=jemalloc&suite=noble).

**Arch Linux RISC-V:** jemalloc is not listed in the broken/outdated status file of `felixonmars/archriscv-packages`, indicating it builds from the main Arch repo without RISC-V-specific patches. Direct confirmation of a binary package was not possible due to search limitations on archriscv.felixc.at.

**Fedora/Koji, openSUSE:** Data not available: infrastructure blocked by Anubis/403 responses during research.

**User action to obtain a working binary:** On Debian sid or Ubuntu 24.04, `apt install libjemalloc2` produces a working riscv64 binary with no additional steps. On other distributions, build from the 5.3.1 source tarball using the cross-compilation flags documented in Section 5.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|-----------|------|--------------|-------------|-----------------|-----------------|
| pthreads (glibc NPTL) | Required. TLS, mutex, background thread management | Yes | Yes (glibc CI) | All major distros | None |
| libm (glibc math) | Required when heap profiling enabled (`--enable-prof`); uses `log(3)` | Yes | Yes | All major distros | None |
| libdl (glibc dynamic linker) | Required for lazy-lock; `dlsym()` to detect multi-threading | Yes | Yes | All major distros | None |
| libatomic (GCC runtime) | Required. Sub-word (8/16-bit) atomic emulation on riscv64 | Yes | Partial | All major distros | Not a blocker; -pthread flag auto-links it since PR #1402 |
| libunwind | Optional. Backtrace support for heap profiling (`--enable-prof-libunwind`) | Yes | Partial | Debian sid v1.8.1 | C++ exception unwinding broken on riscv64; not relevant for jemalloc heap profiling use case |
| libgcc_s | Optional. `_Unwind_Backtrace` for heap profiling (`--enable-prof-libgcc`) | Yes | Yes | All major distros | None |
| libstdc++ | Optional. C++ new/delete integration (`--enable-cxx`, default on) | Yes | Yes | All major distros | None |

glibc (which provides pthreads, libm, libdl, librt) is covered in a separate report at `libraries/glibc.md`.

**libatomic detail:** riscv64 lacks native hardware support for 8-bit and 16-bit compare-exchange operations (the RISC-V A extension covers only 32-bit and 64-bit LR/SC and AMO). jemalloc's internal code uses sub-word atomics in some metadata paths. These are emulated by GCC's `libatomic` runtime. The `-pthread` build flag (introduced in PR #1402) enables automatic `-latomic` linkage; without it, builds fail with linker errors as occurred in issue #1401. This is not a blocker but is a silent correctness dependency.

**libunwind detail:** libunwind PR #1032 (May 2026) proposes disabling C++ exception unwinding by default on RISC-V due to OpenSUSE build failures. This is not relevant to jemalloc's use case, which uses libunwind only for heap profiling backtraces, not exception unwinding.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#2399](https://github.com/jemalloc/jemalloc/issues/2399) | "Does jemalloc support cross build for RISCV64 target on Linux?" | Open, no response | Low | Documentation/support question; no correctness impact. No maintainer response since March 2023. |

**Closed RISC-V issues (historical record):**

| ID | Title | Status | Resolution |
|----|-------|--------|------------|
| [#1401](https://github.com/jemalloc/jemalloc/issues/1401) | riscv64 FTBFS due to atomics | Closed Jan 2019 | Fixed by PR #1402 (-pthread flag) |
| [#2323](https://github.com/jemalloc/jemalloc/issues/2323) | Add support for riscv64gc | Closed Nov 2023 | Fixed by commit c51949e (config.sub/config.guess update, March 2026) [NEEDS VERIFICATION -- issue closed Nov 2023 but fix committed March 2026] |
| [#2814](https://github.com/jemalloc/jemalloc/issues/2814) | Update config.sub and config.guess | Closed Mar 2026 | Fixed by commit c51949e |

**Correctness bugs:** None open. No riscv64 correctness bugs were found in the issue tracker.

**GCC 16 compatibility:** Issue #2917 (opened May 2026, not RISC-V-specific) seeks a tag that builds with GCC 16. riscv64 toolchains track GCC closely and may be affected if this is not resolved before GCC 16 becomes default in distros.

---

## 12. Objections and Upstream Blockers

**Stated objections:** None on record. No maintainer has objected to RISC-V support or expressed intent to remove it.

**Technical blockers:** None blocking functional operation. The two performance gaps (CPU spinwait, sub-word atomics) are known architectural characteristics. The libatomic dependency for sub-word atomics is an ISA limitation with no pure-software workaround within jemalloc.

**Organizational blockers:** The upstream maintainers (Meta-employed engineers) have shown no interest in RISC-V beyond accepting inbound patches. Issue #2399 (cross-compilation question, 3+ years old) has zero maintainer responses. New RISC-V patches will likely be accepted if submitted but will not be initiated upstream.

**Acceptance probability for upstreaming patches:** High for correctness fixes (the track record of PR #1081 and PR #1402 shows quick review and merge). Low for performance enhancements (CPU spinwait) without a Meta production use case justification. The maintainers have no stated position; inferred from response patterns only.

---

## 13. Investment Analysis

RISE Project has no involvement in jemalloc. No funded work exists; the full scope below is open.

### 13.1 Functional Enablement

The library is functionally complete on riscv64. No functional enablement work is required. The only remaining open issue (#2399) is a documentation gap, not a functional gap.

**Cross-compilation documentation:** Write and submit an upstream patch adding a `doc/` entry or README section documenting `--with-lg-page=12 --with-lg-vaddr=39` for riscv64 cross-compilation. Resolves issue #2399 and prevents recurring user confusion.

### 13.2 Performance Optimization

**CPU spinwait (Zihintpause `pause` instruction):** Add a `riscv64` case to the `configure.ac` spinwait dispatch block:

```
riscv64) HAVE_CPU_SPINWAIT=1
         CPU_SPINWAIT="__asm__ volatile(\".insn r 0x0f, 0, 0x10, x0, x0, x0\")"
```

The `pause` instruction encoding for Zihintpause is defined in the ratified spec. This is a one-line configure.ac addition plus a test. Impact: reduced CPU power and potentially improved throughput under high allocator contention on multi-threaded workloads. This is the highest-value single-line change available.

**Sub-word atomics:** No software workaround is possible within jemalloc without restructuring internal metadata to avoid sub-word atomic operations. This would be a substantial refactoring with no upstream motivation unless benchmarks show a measurable regression vs amd64/arm64. Not recommended without data.

### 13.3 CI/CD Infrastructure

Add a riscv64 cross-compilation job to `linux-ci.yml` using QEMU user-mode emulation. The job would: install `gcc-riscv64-linux-gnu`, `qemu-user-static`, and `binfmt-misc`; build with `--host=riscv64-linux-gnu --with-lg-page=12 --with-lg-vaddr=39`; and run `make check` under `JEMALLOC_TEST_PREFIX="qemu-riscv64-static -L /usr/riscv64-linux-gnu"`. This is the minimum CI investment to prevent regressions.

Hardware RISC-V runner (e.g., RISE-provided) would replace QEMU and provide more accurate performance data, but is not required for correctness coverage.

### 13.4 Ecosystem Enablement

jemalloc has no dependent package ecosystem requiring separate enablement work. It is a system library consumed directly by linking. No Section 10 content applies.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Document cross-compilation flags for riscv64 (--with-lg-page, --with-lg-vaddr); submit upstream; resolve issue #2399 | 0.5 | Any contributor | High |
| Performance | Add Zihintpause pause instruction to configure.ac CPU_SPINWAIT dispatch for riscv64 | 0.5 | Any contributor with riscv64 toolchain | High |
| CI/CD | Add riscv64 QEMU cross-compilation and test job to linux-ci.yml | 1 | Any contributor | Medium |
| Performance | Benchmark sub-word atomic performance gap (libatomic vs native) on riscv64 vs amd64/arm64 to quantify or dismiss the concern | 1 | Performance engineer | Low |

Total estimated investment for full riscv64 parity (excluding sub-word atomic refactoring, which is not recommended): 3 person-weeks.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [jemalloc GitHub repository](https://github.com/jemalloc/jemalloc)
- [jemalloc project homepage](https://jemalloc.net/)
- [PR #1081: Correct the spelling of __riscv](https://github.com/jemalloc/jemalloc/pull/1081)
- [PR #1402: Replace -lpthread with -pthread](https://github.com/jemalloc/jemalloc/pull/1402)
- [Commit 749caf1: Also use __riscv to detect builds for RISC-V CPUs](https://github.com/jemalloc/jemalloc/commit/749caf1)
- [Commit 4711910: Replace -lpthread with -pthread](https://github.com/jemalloc/jemalloc/commit/4711910)
- [Commit c51949e: Update config.guess and config.sub to the latest versions](https://github.com/jemalloc/jemalloc/commit/c51949e)
- [Issue #1401: riscv64 FTBFS due to atomics](https://github.com/jemalloc/jemalloc/issues/1401)
- [Issue #2323: Add support for riscv64gc](https://github.com/jemalloc/jemalloc/issues/2323)
- [Issue #2399: Does jemalloc support cross build for RISCV64 target on Linux?](https://github.com/jemalloc/jemalloc/issues/2399)
- [Issue #2814: Update config.sub and config.guess](https://github.com/jemalloc/jemalloc/issues/2814)
- [jemalloc linux-ci.yml workflow](https://github.com/jemalloc/jemalloc/tree/dev/.github/workflows)
- [Debian buildd tracker: jemalloc riscv64](https://buildd.debian.org/status/package.php?p=jemalloc)
- [Ubuntu Noble packages: jemalloc](https://packages.ubuntu.com/search?keywords=jemalloc&suite=noble)
- [jemalloc GitHub releases](https://github.com/jemalloc/jemalloc/releases)
- [RISE Project blog](https://riseproject.dev/blog)