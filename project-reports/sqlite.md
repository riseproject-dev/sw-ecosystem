---
title: SQLite
parent: Project Reports
categories:
  - databases
---

# SQLite

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for SQLite<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

SQLite is a self-contained, serverless, zero-configuration SQL database engine written entirely in portable C. It is distributed as a single-file amalgamation (`sqlite3.c`) with no required external dependencies. The canonical repository is the Fossil SCM at [sqlite.org/src](https://www.sqlite.org/src/); the [sqlite/sqlite](https://github.com/sqlite/sqlite) GitHub repository is a read-only mirror and does not accept pull requests.

Development is controlled exclusively by D. Richard Hipp (drh) and colleagues at Hwaci (Hipp, Wyrick & Company, Inc.). SQLite is explicitly open-source but not open-contribution: patches are not accepted from contributors who have not signed a public domain affidavit on file at Hwaci. No external corporate co-maintainers exist. The project is in the public domain; no copyright is asserted.

SQLite is funded via the SQLite Consortium, a membership vehicle administered by Hwaci at $150,000/year per member. The member list is not publicly disclosed. No foundation governance exists; technical direction remains solely with SQLite developers.

SQLite is not a RISE Project member. RISE membership is organization-based; SQLite does not appear in any RISE funded project, blog post, wheel-builder package list, or runner usage report.

---

## 2. Port History and Upstreaming Timeline

SQLite requires no dedicated RISC-V port. The codebase is pure portable C with no assembly, no SIMD, and no JIT. RISC-V support follows automatically from compiler support for the target.

The only RISC-V-specific upstream activity found in the entire project history is a single build bug triggered by the introduction of `__uint128_t`-based high-precision multiply optimizations:

| Date (UTC) | Event |
|---|---|
| 2026-04-26 11:41 | Bernd Kuhls (Buildroot) files [forum post f8d1417ce8](https://sqlite.org/forum/forumpost/f8d1417ce8) reporting riscv32 build failure in SQLite 3.53.0: `error: unknown type name '__uint128_t'` in `src/util.c`. Root cause: the `defined(__riscv)` guard matched both riscv32 and riscv64, but `__uint128_t` is unavailable on 32-bit RISC-V. |
| 2026-04-26 14:31 | Stephan Beal (stephan) proposes fix using `__riscv_xlen > 32`. Notes: "This project does not accept PRs, nor do we have access to a 32-bit riscv system to test this one." |
| 2026-04-26 19:32 | bkuhls corrects a typo in stephan's patch (`__risc` -> `__riscv`) and confirms the fix works on both riscv32 and riscv64. |
| 2026-04-27 05:55 | stephan commits fix to trunk as [c4a2c20839](https://www.sqlite.org/src/info/c4a2c20839). Guard consolidated into `SQLITE_USE_UINT128` macro gated on `defined(__riscv) && defined(__riscv_xlen) && (__riscv_xlen>32)`. File changed: `src/util.c`. |
| 2026-04-27 06:48 | stephan commits [362ef7bc00](https://www.sqlite.org/src/info/362ef7bc00) to trunk, refactoring the `__uint128_t` detection logic to eliminate duplication. |
| 2026-04-27 12:25 | drh backports fix to branch-3.53 as [e3f318bf52](https://www.sqlite.org/src/info/e3f318bf52), ensuring the fix reaches the release series tracked by Buildroot and distributors. |
| 2026-04-27 19:05 | bkuhls closes [GitHub PR #44](https://github.com/sqlite/sqlite/pull/44) (which had proposed the same fix) after confirming the upstream Fossil commit resolves the issue. PR was never merged on GitHub (merged_at: null); the GitHub repo is a read-only mirror. |

No earlier RISC-V-specific commits, issues, or port activity were found in any searched source. A 2023-09-06 GitHub issue ([#15](https://github.com/sqlite/sqlite/issues/15)) asked the community to validate a research tool's assessment that SQLite is "simple" to port to RISC-V; it received zero responses and was closed the same day.

A separate forum report of `mmap` address space failures on FreeBSD/RISC-V (2025-06-04) was identified in search results but full content was not retrieved. [NEEDS VERIFICATION: content and resolution status of 2025-06-04 FreeBSD/RISC-V mmap forum thread.]

---

## 3. Upstream Support Tier

SQLite has no formal tier classification for platform support and does not publish a supported-platforms list. Architecture portability is handled entirely through portable C with compile-time flags.

The project's posture toward RISC-V is reactive rather than proactive:

- Maintainers have stated on the record that they do not have access to 32-bit RISC-V hardware.
- No riscv64 hardware or emulation is used in SQLite's own test infrastructure.
- Bug reports from the community are accepted via the Fossil forum and acted on promptly (the 2026-04-27 fix demonstrates a same-day turnaround), but the public-domain affidavit requirement makes community-driven port maintenance structurally difficult.
- Formal RISC-V support is not announced by the project.

Effective classification: **Best-effort community-reported, no upstream CI.** SQLite functions correctly on riscv64 but carries no upstream commitment to catch regressions proactively.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

SQLite has no assembly, no SIMD dispatch infrastructure, and no JIT compiler. The VDBE (Virtual Database Engine) is a pure C interpreter. There are no `.S` files anywhere in the repository. There are no `arch/riscv/` or `simd/` directories. There are no RVV intrinsics.

The complete inventory of all architecture-specific guards in the source that are relevant to riscv64:

| File | Guard | Purpose | riscv64 Status |
|---|---|---|---|
| `src/util.c:470-471` | `__x86_64__ \|\| __aarch64__ \|\| (__riscv && __riscv_xlen>32)` | Enable `__uint128_t` for `sqlite3Multiply128()` and `sqlite3Multiply160()` | Full -- riscv64 explicitly included since 2026-04-27 |
| `src/util.c:1019-1020` | `(__arm__ && !__aarch64__) \|\| (__ppc__ && !__ppc64__)` | `SQLITE_AVOID_U64_DIVIDE` -- software u64 division workaround | Not needed -- riscv64 has hardware u64 division; correctly absent |
| `src/hwtime.h:31-68` | x86, x86_64, aarch64, ppc -- else stub | High-resolution cycle counter for profiling/debug builds | Missing -- no riscv64 case; returns 0 |
| `src/sqliteInt.h:912-920` | `__SIZEOF_POINTER__` first, then explicit 32-bit list, else 8 | `SQLITE_PTRSIZE` detection | Full -- riscv64 uses `__SIZEOF_POINTER__=8` |
| `src/sqliteInt.h:989-1004` | `__BYTE_ORDER__` first (GCC/Clang intrinsic), then explicit arch lists | Byte-order detection | Full -- riscv64 uses `__BYTE_ORDER__==__ORDER_LITTLE_ENDIAN__` |

The `hwtime.h` stub (returning 0 on riscv64) is gated behind `SQLITE_DEBUG` and similar profiling flags. It has zero impact on release builds or correctness. The `rdcycle` CSR instruction could provide a cycle counter on riscv64 but is not implemented.

No TODO, FIXME, stub, or not-implemented comments related to riscv64 were found anywhere in the source tree.

**Summary:** riscv64 is at functional parity with x86_64 and aarch64. The `__uint128_t` multiply optimization is the only architecture-specific performance path in SQLite, and riscv64 is now explicitly included. All other components use portable C that requires no riscv64-specific attention.

---

## 5. Build System, Cross-Compilation, and Toolchain

SQLite uses **autosetup** (not CMake). There is no CMakeLists.txt. No riscv64-specific toolchain files, cmake presets, or build flags exist in the repository. No Dockerfiles of any kind exist in the repository.

**Cross-compilation methods for riscv64:**

Method 1 -- CROSS variable (recommended for full build):
```sh
./configure \
  CROSS=riscv64-linux-gnu- \
  --host=riscv64-unknown-linux-gnu
make
```

Method 2 -- Explicit CC:
```sh
./configure \
  CC=riscv64-linux-gnu-gcc \
  CC_FOR_BUILD=gcc \
  --host=riscv64-unknown-linux-gnu
make
```

Method 3 -- Amalgamation direct compile (recommended for embedded use):
```sh
riscv64-linux-gnu-gcc \
  -DSQLITE_THREADSAFE=0 \
  -DSQLITE_OMIT_LOAD_EXTENSION \
  -Os -c sqlite3.c -o sqlite3.o
```

**Known behavioral changes under cross-compilation:** The `-g` debug flag is dropped from default CFLAGS; readline header checks are skipped; WASI SDK cannot be combined with cross-compilation.

**Relevant `-D` flags for riscv64 targets:**

| Flag | Purpose |
|---|---|
| `-DSQLITE_BYTEORDER=1234` | RISC-V is little-endian; avoids runtime detection overhead |
| `-DSQLITE_THREADSAFE=0` | For single-threaded embedded targets |
| `-DSQLITE_OMIT_LOAD_EXTENSION` | Removes dlopen dependency |
| `-DSQLITE_OS_OTHER=1` | For bare-metal or custom OS targets |

**Minimum toolchain version:** SQLite's repository states no minimum GCC or Clang version. The source is C89/C90 compatible. Practical minimum for riscv64-linux-gnu cross-compilation is GCC >= 7.x (first mainstream release with riscv64-linux-gnu multilib support) or Clang >= 9.0 with `--target=riscv64-unknown-linux-gnu` and a sysroot. [NEEDS VERIFICATION: exact minimum version tested by SQLite maintainers.]

No QEMU documentation or scripts exist in the SQLite repository.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| `__uint128_t` high-precision multiply | Full (C intrinsic) | Full (C intrinsic) | Full (C intrinsic, since 2026-04-27) | None |
| u64 hardware division | Full | Full | Full | None |
| Cycle counter (hwtime.h) | Full (inline asm `rdtsc`) | Full (inline asm `mrs`) | Missing (returns 0) | Debug/profiling only; no production impact |
| Pointer size detection | Full | Full | Full | None |
| Byte-order detection | Full | Full | Full | None |
| Build system | Full | Full | Full | None |
| SIMD/vectorization | None (not implemented for any arch) | None | None | N/A |
| JIT | None (not implemented) | None | None | N/A |
| Assembly routines | None (not implemented) | None | None | N/A |

The only gap is the `hwtime.h` cycle counter, which is a debug/profiling stub. SQLite is functionally and performance-architecturally equivalent on riscv64, amd64, and arm64. All performance differences are a function of the C compiler and scalar hardware throughput.

---

## 7. CI/CD Infrastructure

SQLite has no cloud CI of any kind. The GitHub mirror at [sqlite/sqlite](https://github.com/sqlite/sqlite) has no `.github/` directory (HTTP 404 confirmed by API). No `.cirrus.yml`, `.travis.yml`, `.gitlab-ci.yml`, `azure-pipelines.yml`, `Jenkinsfile`, or `.appveyor.yml` exist in the repository (all individually confirmed HTTP 404). A recursive scan of all 2,265 files in the sqlite/sqlite master branch found zero `.yml` or `.yaml` files.

SQLite's testing infrastructure is entirely local, driven by `make` targets (`devtest`, `releasetest`) using a Tcl-based test harness. The testing documentation mentions testing on "a variety of CPU architectures" but names no specific architectures beyond x86 and makes no mention of RISC-V.

No RISE Project CI runners are used. No riscv64 automated testing exists in any known SQLite infrastructure.

Riscv64 regressions are currently caught only by downstream distribution build infrastructure (notably Buildroot autobuilders, which caught the April 2026 riscv32 bug, and Debian buildd running on `rv-osuosl-02` OSUOSL hardware).

---

## 8. Distribution and Release Status

SQLite does not publish riscv64 binary releases. The official downloads at [sqlite.org/download.html](https://www.sqlite.org/download.html) provide precompiled Linux binaries for x64 only (`sqlite-tools-linux-x64-3530200.zip`). macOS provides arm64 and x64; Windows provides arm64, x64, and x86. No `sqlite-tools-linux-riscv64` package exists. The GitHub API for releases returns an empty array; SQLite does not use GitHub releases.

Distribution packaging status:

| Distribution | Package | Version | riscv64 Status | Notes |
|---|---|---|---|---|
| Debian sid (unstable) | sqlite3, libsqlite3-0 | 3.53.2-1 | Available -- `libsqlite3-0_3.53.2-1_riscv64.deb` confirmed HTTP 200, 955 KB, built on `rv-osuosl-02` (OSUOSL RISC-V hardware, 2026-06-14) | Migration to Debian testing is blocked by regressions in dependent packages ruby-sqlite3 and tinysparql on riscv64; the regressions appear to affect all architectures equally, indicating they are not riscv64-specific |
| Ubuntu 24.04 LTS (noble) | sqlite3 | 3.45.1-1ubuntu2 | Available | Confirmed via packages.ubuntu.com; listed for amd64, arm64, armhf, i386, ppc64el, riscv64, s390x |
| Arch Linux RISC-V port | sqlite | 3.53.2-1 | Available -- `sqlite-3.53.2-1-riscv64.pkg.tar.zst` in core repo | [NEEDS VERIFICATION: archriscv.felixc.at page returned 404 during direct fetch; earlier research findings listed the package as present] |
| Fedora Rawhide | sqlite | 3.53.2-1.fc45 | Available | [NEEDS VERIFICATION: confirmed via Fedora any-arch policy description, not by direct package page fetch] |

The Debian migration blocker for 3.53.2 is in dependent packages (ruby-sqlite3, tinysparql), not in sqlite3 itself. The sqlite3 binary package builds cleanly on riscv64 at 3.53.2.

---

## 9. Dependencies

SQLite's core library has zero required external dependencies. All SQL engine functionality compiles from the amalgamation. External libraries are optional and affect specific features or the CLI shell only.

| Dependency | Role | riscv64 Build | riscv64 Release | Blocking Issues |
|---|---|---|---|---|
| zlib | Optional compression for SQL Archive and CLI `.archive` command (`SQLITE_HAVE_ZLIB`) | Available -- Debian `zlib1g 1:1.3.dfsg+really1.3.2-3` for riscv64 | Available in all major distros | [madler/zlib#1099](https://github.com/madler/zlib/pull/1099): RVV Adler32 optimization (7% decompression improvement on SG2042) stalled with no maintainer response since October 2025; not a build or correctness blocker, performance only. zlib has 153 open PRs and appears resource-constrained. |
| ICU (libicu) | Optional Unicode-aware collation, LIKE, case-folding (`SQLITE_ENABLE_ICU`) | Available -- Debian `libicu-dev` for riscv64 (all 16 Debian architectures) | Available in all major distros | None identified |
| readline | CLI shell line-editing (`sqlite3` shell only) | Available -- Debian `libreadline-dev` for riscv64 | Available | None |
| Tcl (>= 8.6) | (1) `libtclsqlite3.so` Tcl extension; (2) SQLite's entire test harness is Tcl scripts | Available -- Debian `tcl8.6` for riscv64 | Available | No riscv64-specific issues found in tcltk/tcl; indirect risk: Tcl riscv64 issues would affect SQLite's test suite |
| pthreads | Multi-threaded mode, WAL concurrent readers (`LDFLAGS_PTHREAD`) | Provided by glibc; no external package | Available | None |
| libdl | Loadable extension support (`LDFLAGS_DLOPEN`) | Provided by glibc | Available | None |
| libm | Math SQL functions: `sin()`, `cos()`, etc. (`SQLITE_ENABLE_MATH_FUNCTIONS`) | Provided by glibc | Available | None |

All distribution-packaged dependencies are available for riscv64 in Debian sid as official ports with no unofficial-port or missing-architecture gaps.

---

## 10. Ecosystem Status

**RISE Project involvement:** None. An exhaustive crawl of all 27 RISE Project blog posts (May 2024 through June 2026) found zero mentions of SQLite. The RISE wheel-builder package list (80+ packages) does not include SQLite. The riseproject-dev GitHub organization (30 repositories checked) contains no SQLite fork, CI configuration, or issue tracker. SQLite is not in the RISE funded project portfolio. RISE workstreams focus on OpenJDK, LLVM, Go, Rust, V8, Python wheels, and Yocto.

**Buildroot:** Buildroot autobuilders are the primary external infrastructure that caught the April 2026 riscv32 build failure. The reporter (Bernd Kuhls) is a Buildroot contributor. Buildroot ships SQLite as a package and its riscv32 cross-compilation infrastructure provides indirect regression detection for SQLite.

**Performance benchmarks:** No published SQLite-specific benchmark data for RISC-V exists from any source. The official [sqlite.org performance page](https://www.sqlite.org/cpu.html) contains only x64 data (showing SQLite 3.48.0 runs approximately 71% fewer CPU cycles than SQLite 3.6.1 on x64, but no RISC-V comparative data). Phoronix returned 403 during research. No community-published riscv64 `speedtest1` scores were found. Data not available: SQLite transactions/sec, latency, or speedtest1 comparisons between riscv64, amd64, and arm64.

**The only architecture-specific performance path in SQLite is the `__uint128_t` multiply in `src/util.c`.** This is a C intrinsic, not hand-tuned assembly. riscv64 is explicitly included as of April 2026. All other performance is determined by scalar integer throughput and compiler optimization.

---

## 11. Known Bugs and Active Issues

| Item | Status | Description | Affected Version | Resolution |
|---|---|---|---|---|
| [PR #44](https://github.com/sqlite/sqlite/pull/44) / [forum f8d1417ce8](https://sqlite.org/forum/forumpost/f8d1417ce8) | Resolved (2026-04-27) | riscv32 build failure: `__uint128_t` used on 32-bit RISC-V target where it is unavailable. `defined(__riscv)` guard matched both riscv32 and riscv64. | SQLite 3.53.0 (the release introducing the `__uint128_t` path) | Fixed in Fossil trunk ([c4a2c20839](https://www.sqlite.org/src/info/c4a2c20839)) and backported to branch-3.53 ([e3f318bf52](https://www.sqlite.org/src/info/e3f318bf52)). Released in 3.53.x. |
| [Issue #15](https://github.com/sqlite/sqlite/issues/15) | Closed (same day, 2023-09-06) | Researcher sought community validation that SQLite is "simple" to port to RISC-V. No response from maintainers. | N/A | Not a bug; not actionable. |

Open riscv64 bugs: none found.
Open riscv32 bugs: none found (the only known one is resolved).
NaN/floating point RISC-V bugs: none found.

The riscv32 `__uint128_t` bug is the only confirmed RISC-V defect in the project's history that was searchable via GitHub, Fossil, and the SQLite forum.

---

## 12. Objections and Upstream Blockers

**Contribution model is a structural risk.** SQLite does not accept patches from contributors without a public domain affidavit on file at Hwaci. This means bug fixes must either go through the Fossil forum and be adopted by Hwaci staff or be maintained out-of-tree. Response time is fast (the April 2026 fix took under 24 hours from report to backport), but the bus factor is low: two named committers (drh, stephan) handled the only RISC-V issue on record.

**No riscv64 CI means no regression detection.** Regressions will be caught only by downstream distribution builders (Buildroot, Debian buildd). There is no path to get a riscv64 test run from upstream SQLite without contributing a CI configuration -- which the project cannot accept via GitHub PR and which would need maintainer adoption via the Fossil forum.

**Maintainers lack RISC-V hardware.** Stephan Beal stated explicitly during the April 2026 incident: "This project does not accept PRs, nor do we have access to a 32-bit riscv system to test this one." This applies equally to riscv64. Any riscv64-specific bug requires the community to supply reproduction steps and confirm fixes, adding latency to the resolution cycle.

**`hwtime.h` cycle counter stub.** The `rdcycle` CSR is a natural fit for riscv64 (one instruction, same semantics as `rdtsc` on x86). The stub returning 0 on riscv64 is harmless for production use but prevents profiling and internal timing in debug builds. Implementing this would be a one-line inline assembly addition, but would require maintainer adoption.

**No blocking technical issues exist for production use of SQLite on riscv64.**

---

## 13. Investment Analysis

### 13.1 Functional Enablement

SQLite is functionally complete on riscv64. The only historical functional gap (the riscv32 `__uint128_t` build failure) was resolved in April 2026. No open bugs exist. No missing feature implementations exist. The codebase requires no architecture-specific work for riscv64 by design.

**Required investment: zero.** SQLite on riscv64 works today without any engineering contribution.

### 13.2 Performance Optimization

SQLite has no SIMD dispatch, no assembly routines, and no JIT. Performance optimization opportunities are limited to:

1. The `hwtime.h` cycle counter (1 line of inline assembly; debug/profiling infrastructure only; zero production impact).
2. Compiler flag tuning (outside SQLite's codebase; handled by distribution package maintainers).
3. No RVV opportunities exist in SQLite -- the project has no vectorized code for any architecture.

Data not available: SQLite performance on riscv64 vs amd64 vs arm64 (no published benchmark numbers in any indexed source as of June 2026). A baseline measurement using `speedtest1` would be a precondition for any informed performance investment decision.

**Required investment: low.** The cycle counter fix is 1-3 person-days including forum-based upstream submission. Performance baselining with `speedtest1` is 1-2 person-days. Both are optional.

### 13.3 CI/CD Infrastructure

SQLite has no CI infrastructure of any kind. Establishing riscv64 CI requires:

1. A mechanism to run the Tcl-based test suite on riscv64 (QEMU user-mode or hardware).
2. Convincing SQLite maintainers to adopt CI configuration via the Fossil forum. This is the primary risk: maintainers have shown no interest in cloud CI, and the contribution model is restrictive.

An alternative is a downstream CI configuration maintained outside SQLite's canonical repository (e.g., a Buildroot-level integration test or a distribution-level regression test). This would catch regressions without requiring upstream adoption.

**Required investment: medium, primarily due to upstream cooperation uncertainty.** A QEMU-based riscv64 test runner can be built in 2-4 person-weeks. Upstream adoption is uncertain.

### 13.4 Ecosystem Enablement

The Debian migration blocker for sqlite3 3.53.2 to Debian testing is caused by regressions in `ruby-sqlite3` and `tinysparql` that appear to affect all architectures equally (not riscv64-specific). Resolving this requires investigation in those dependent packages, not in SQLite itself.

The zlib RVV Adler32 optimization ([madler/zlib#1099](https://github.com/madler/zlib/pull/1099)) is stalled but only affects the SQL Archive compression feature, which is optional. This is not a SQLite investment item.

**Required investment: low.** The Debian migration blocker warrants a brief triage (1-3 days) to confirm the regressions are not riscv64-specific and to assess whether contributing fixes to ruby-sqlite3 or tinysparql is warranted.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Baseline riscv64 functional status (already done per this report) | 0 | N/A | Complete |
| Performance | Benchmark SQLite on riscv64 with `speedtest1` vs amd64 and arm64 | 0.5 | Performance team | Medium |
| Performance | Implement `hwtime.h` riscv64 cycle counter (1 line inline asm + upstream forum submission) | 0.2 | Any engineer | Low |
| CI/CD | QEMU-based riscv64 test runner for SQLite test suite (external, downstream) | 2-4 | Infrastructure team | Medium |
| CI/CD | Upstream riscv64 CI adoption (Fossil forum proposal; outcome uncertain) | 1 (proposal only) | Ecosystem team | Low |
| Ecosystem | Triage Debian testing migration blockers in ruby-sqlite3 and tinysparql | 0.5 | Ecosystem team | Medium |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [SQLite Fossil repository](https://www.sqlite.org/src/)
- [SQLite GitHub mirror (read-only)](https://github.com/sqlite/sqlite)
- [SQLite download page](https://www.sqlite.org/download.html)
- [SQLite consortium](https://sqlite.org/consortium.html)
- [SQLite copyright / public domain](https://sqlite.org/copyright.html)
- [SQLite forum post f8d1417ce8 -- riscv32 build failure](https://sqlite.org/forum/forumpost/f8d1417ce8)
- [GitHub PR #44 -- Disable uint128 intrinsics on riscv32](https://github.com/sqlite/sqlite/pull/44)
- [GitHub Issue #15 -- RISC-V porting complexity assessment](https://github.com/sqlite/sqlite/issues/15)
- [Fossil commit c4a2c20839 -- trunk fix, src/util.c](https://www.sqlite.org/src/info/c4a2c20839)
- [Fossil commit 362ef7bc00 -- uint128 detection refactor](https://www.sqlite.org/src/info/362ef7bc00)
- [Fossil commit e3f318bf52 -- branch-3.53 backport](https://www.sqlite.org/src/info/e3f318bf52)
- [Debian tracker for sqlite3](https://tracker.debian.org/pkg/sqlite3)
- [Ubuntu 24.04 sqlite3 package](https://packages.ubuntu.com/noble/sqlite3)
- [zlib PR #1099 -- RVV Adler32 optimization (stalled)](https://github.com/madler/zlib/pull/1099)
- [RISE Project](https://riseproject.dev)