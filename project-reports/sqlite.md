---
title: SQLite
parent: Project Reports
color: yellow
dependencies:
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: ICU
    relation: runtime-dependency
    criticality: optional
  - name: readline
    relation: runtime-dependency
    criticality: optional
  - name: Tcl
    relation: test-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: autosetup
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="sqlite" %}

# SQLite

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for SQLite<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

SQLite is a self-contained, serverless, zero-configuration SQL database engine written in portable ANSI C (C89/C99-compatible only; no C++, no STL, no exceptions, no VLAs, per the project's own `AGENTS.md`). It ships as a single-file amalgamation (`sqlite3.c`) with zero required external dependencies. Canonical source control is a self-hosted Fossil repository at [sqlite.org/src](https://www.sqlite.org/src/); [github.com/sqlite/sqlite](https://github.com/sqlite/sqlite) is explicitly documented in its own README as a read-only mirror ("If you are reading this on GitHub or some other Git repository or service, then you are looking at a mirror"), and the project states it "does not normally accept pull requests."

License: public domain. Per [sqlite.org/copyright.html](https://sqlite.org/copyright.html), "SQLite source code is in the public-domain and is free to everyone to use for any purpose"; all authors have signed affidavits dedicating their work to the public domain. There is no foundation governance; SQLite is not part of Apache, the Linux Foundation, or any similar body. Development is funded by Hwaci (Hipp, Wyrick & Company, Inc.), a private company, historically supplemented by the SQLite Consortium, a paying-sponsor membership program. The sponsor roster is not publicly disclosed on the sqlite.org homepage. A previously reported figure of $150,000/year per Consortium member could not be corroborated against any primary source this round and is marked [NEEDS VERIFICATION].

Governance is explicitly "open-source, not open-contribution": free to use and modify, but unsolicited outside patches are not merged without a signed public-domain affidavit on file with Hwaci, preserving the public-domain status of the codebase. Free support runs through the SQLite Forum; paid professional/custom work is sold directly by D. Richard Hipp via Hwaci. There is no documented formal platform/port-tier policy and no stated process for accepting new architecture ports (`sqlite.org/support.html` describes only these two support tiers). Commit-authorship data from the GitHub mirror (a 3,138-commit sample) shows activity concentrated in three individuals, all associated with Hwaci: drh (D. Richard Hipp, 1,826 commits), stephan (Stephan Beal, 737 commits), dan (Dan Kennedy, 565 commits), with a long tail (jeffchen 7, mistachkin 2, larrybr 1). No MAINTAINERS/OWNERS/CODEOWNERS file exists anywhere in the repository.

SQLite is not a RISE Project member. RISE membership is organization-level (Premier members: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General members: Akeana, Andes Technology, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software/CAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE - per [riseproject.dev](https://riseproject.dev) and [riseproject.dev/members](https://riseproject.dev/members/)) and does not apply to individual libraries. SQLite the core project does not appear in any RISE funded-project listing, blog post, or runner-usage report; the only RISE-adjacent activity found is downstream riscv64 wheel-building for third-party Python bindings that depend on SQLite, not SQLite itself (see Section 10).

## 2. Port History and Upstreaming Timeline

| Date (UTC) | Event | Source |
|---|---|---|
| 2026-04-26 11:41 | Bernd Kuhls (bkuhls, Buildroot contributor) files a SQLite Forum post reporting a riscv32 build failure in SQLite 3.53.0: `error: unknown type name '__uint128_t'` at `sqlite3.c:36804`, inside `sqlite3Multiply128()`. Root cause: the `defined(__riscv)` guard matched both riscv32 and riscv64, but `__uint128_t` is only available on 64-bit RISC-V. | [SQLite Forum f8d1417ce8](https://sqlite.org/forum/info/f8d1417ce8eb2f22dd1754d39e735114fa102ab2294b96bf8e4d075bd8ab8a7a) |
| 2026-04-26 | bkuhls opens [GitHub PR #44](https://github.com/sqlite/sqlite/pull/44), "Disable the use of intrinsic high-precision multiplies on riscv32," mirroring the forum report with a build log attached. | GitHub PR #44 |
| 2026-04-26 14:31 | Stephan Beal (core dev) replies on the forum: the project does not accept PRs directly and has no riscv32 test hardware; proposes gating on `__riscv_xlen > 32` instead of the bare `__riscv` macro. | SQLite Forum |
| 2026-04-26 19:32 | bkuhls corrects a typo in Stephan's patch (`__risc` -> `__riscv`) and confirms the corrected version fixes riscv32 while riscv64 continues to take the 128-bit path. | SQLite Forum |
| 2026-04-27 05:55 | stephan commits the fix to trunk: adds a detection block gated on `defined(__riscv) && defined(__riscv_xlen) && (__riscv_xlen>32)`, replacing the bare `__riscv` checks in `sqlite3Multiply128()`/`sqlite3Multiply160()`, in `src/util.c` (+16/-10 lines). | GitHub mirror commit [70d1e3e75e4a0bd15b2f6c800628887e1884e675](https://github.com/sqlite/sqlite/commit/70d1e3e75e4a0bd15b2f6c800628887e1884e675) (FossilOrigin-Name `c4a2c20839...`) |
| 2026-04-27 (same day) | A follow-up commit refactors the `__uint128_t` detection logic to remove duplication and adds `#undef SQLITE_RISCV64` to avoid macro leakage. | `src/util.c` diff |
| 2026-04-27 | bkuhls closes PR #44 on GitHub once the Fossil-trunk fix lands, without the PR itself ever being merged; the branch is deleted. | GitHub PR #44 |

**Correction to a previously cited backport.** An earlier version of this report cited a same-day backport to `branch-3.53` via a Fossil commit referenced as `e3f318bf52`. Direct git-ancestry verification against the GitHub mirror this round (`git merge-base --is-ancestor`) found that commit `70d1e3e` is **not** an ancestor of the `branch-3.53` tip, which includes the latest tagged release `version-3.53.4` (2026-07-24); no `branch-3.54` or `3.54.x` tag exists as of 2026-10-01. The fix therefore sits on trunk only and has not shipped in any official SQLite release. One PR #44 comment referenced a fix commit as "e3f318bf52932460" / "27e808f," but a direct check found no commit with that SHA anywhere in the repository - this earlier reference appears to be erroneous rather than a real backport. This is flagged as a discrepancy between sources: [NEEDS VERIFICATION].

No other RISC-V-specific commits, issues, or port-related activity were found anywhere in the project's searchable history (GitHub issue search for "riscv"/"riscv64"/"risc-v" returns zero results in all three queries; commit-log grep across ~3,138 commits of mirrored history found no other matches). A 2023-09-06 GitHub posting, [PR #15](https://github.com/sqlite/sqlite/pull/15), asked the community to validate a third-party tool's assessment that SQLite is "simple" to port to RISC-V; it received zero engagement and was closed the same day - not a code contribution. A separate PR, [#24 "Add loongarch support"](https://github.com/sqlite/sqlite/pull/24) (closed 2026-06-26), mentions RISC-V only once as an analogy ("LoongArch is a new RISC ISA, like MIPS or RISC-V") and is excluded from scope here. A forum report of mmap address-space failures on FreeBSD/RISC-V (2025-06-04) was flagged in an earlier pass but its content and resolution status could not be retrieved this round either; it remains [NEEDS VERIFICATION].

SQLite requires no dedicated "riscv64 port" in the conventional sense: the codebase is pure portable C with no assembly, no SIMD, and no JIT, so riscv64 support follows automatically from compiler support for the target. The only RISC-V-aware code anywhere in the tree is the `__uint128_t` feature-detection guard above, plus RISC-V CPU-name recognition in the vendored (boilerplate, non-SQLite-specific) GNU `config.sub`/`config.guess` scripts used by the autosetup build system.

## 3. Upstream Support Tier

No formal tier classification exists; no published supported-platforms list (`PLATFORMS.md`, `SUPPORT.md`, `docs/platforms/` are all confirmed absent from the repository). Architecture portability is handled entirely through portable C plus compile-time macros.

Evidence of posture:

- Maintainers have stated on the record they lack access to riscv32 hardware ("we do not have access to a 32-bit riscv system to test this one" - Stephan Beal, SQLite Forum, 2026-04-26); by extension the same applies to riscv64, since no riscv64 CI or dedicated hardware was found anywhere in SQLite's own infrastructure.
- No `.github/` directory exists in the GitHub mirror at all, confirmed via GitHub code search (`path:.github` returns zero results) - no workflows, no issue templates. `extension:yml` returns zero results repo-wide. Filename searches for `Jenkinsfile`, `.gitlab-ci.yml`, `.travis.yml`, and `.cirrus.yml` each return zero results. SQLite's real development happens on the Fossil infrastructure at sqlite.org, and no riscv64 CI evidence was found there either.
- Community bug reports are accepted via the Fossil forum and acted on quickly when reported (same-day turnaround for the April 2026 fix), but the public-domain-affidavit contribution requirement makes external, community-driven port maintenance structurally difficult.
- No formal RISC-V support announcement exists from the project.

| Architecture | CI | Official binary release | Release-blocking test | Formal support claim |
|---|---|---|---|---|
| amd64/x86_64 | None found (no CI of any kind exists for any architecture) | [sqlite.org/download.html](https://www.sqlite.org/download.html) ships precompiled Linux x64 binaries | Local Tcl test harness only (`make devtest`/`releasetest`) | Implicit (primary dev/release platform) |
| arm64/aarch64 | None found | macOS arm64 and Windows arm64 provided; no Linux arm64 binary on sqlite.org | Same local harness | Implicit |
| riscv64 | None found (same as every architecture) | None directly from sqlite.org; available only via distro packaging (Section 8) | Same local harness; no riscv64-specific test coverage | Not stated |

Effective classification: best-effort, community-reported, no upstream CI for any architecture. riscv64 is not singled out for worse treatment than amd64/arm64 - SQLite simply has no upstream CI infrastructure at all, for any CPU target. This absence of any upstream riscv64 CI or test is the basis for ruling out green/blue in Section 13.

## 4. Technical Architecture and RISC-V-Specific Subsystems

SQLite has no assembly, no SIMD dispatch infrastructure, and no JIT compiler for any architecture. The VDBE (Virtual Database Engine) is a pure C bytecode interpreter. There are zero `.S` files anywhere in the repository (`extension:S` code search returns zero results), no `arch/riscv/` directory, and no RVV intrinsics (`vfloat32m1_t` code search returns zero results).

Exhaustive code search (`riscv`, `riscv64`, `__riscv`, `rvv` queries against `sqlite/sqlite`) confirms exactly three files in the entire 154-file `src/` tree reference any CPU architecture relevant to riscv64, and none implement riscv64-specific algorithmic logic:

| File | Guard | Purpose | riscv64 status |
|---|---|---|---|
| `src/util.c:468-473` | `defined(__x86_64__) \|\| defined(__aarch64__) \|\| (defined(__riscv) && defined(__riscv_xlen) && (__riscv_xlen>32))` | Enables `SQLITE_USE_UINT128`, gating `__uint128_t`-based 128-bit multiply in `sqlite3Multiply128()`/`sqlite3Multiply160()` | Full - riscv64 explicitly included since 2026-04-27; identical compiler-intrinsic code path as x86_64/aarch64, not hand-written assembly |
| `src/hwtime.h` | x86, x86_64, aarch64, ppc listed explicitly; else stub returning 0 | Optional, debug-only high-resolution cycle counter for profiling builds; project's own comment states it is "not in any deliverable" | Missing - no riscv64 branch; falls through to the generic stub, same as most non-x86/arm architectures (ppc64le, s390x, loongarch, mips, etc.) |
| `autosetup/autosetup-config.sub`, `autosetup/autosetup-config.guess` | Standard GNU `config.sub`/`config.guess` CPU-triplet tables | Recognize `riscv`, `riscv32`, `riscv32be`, `riscv64`, `riscv64be` as canonical architecture names for `./configure` target-triplet validation | Vendored autotools boilerplate, not SQLite-specific logic |

No TODO, FIXME, stub, or not-implemented comment related to riscv64 was found anywhere in the source tree. The `hwtime.h` gap is gated behind `SQLITE_DEBUG`-class builds and has zero impact on production correctness or performance.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| `__uint128_t` high-precision multiply | Partial (C intrinsic) | Partial (C intrinsic) | Partial (C intrinsic, identical code path, since 2026-04-27) |
| Debug cycle counter (`hwtime.h`) | Implemented (inline asm `rdtsc`) | Implemented (inline asm `mrs`) | Missing (stub returns 0; debug-only) |
| SIMD/vectorization | None (not implemented for any architecture) | None | None |
| JIT | None (not implemented for any architecture) | None | None |

**Summary:** riscv64 sits at the same tier as amd64 and aarch64 for the one place in SQLite's source where CPU architecture is actually load-bearing to correctness (the 128-bit multiply intrinsic); none of the three is "full hand-tuned" because SQLite has no hand-written assembly or SIMD kernels for its database engine on any architecture. The only riscv64-specific gap is the irrelevant debug-only cycle counter.

## 5. Build System, Cross-Compilation, and Toolchain

SQLite uses **autosetup**, not GNU Autoconf and not CMake. Per `AGENTS.md`: "The configure script uses [autosetup](https://msteveb.github.io/autosetup/), not GNU Autoconf." `./configure` is a four-line wrapper that execs `autosetup/autosetup`, driven by `auto.def` + `autosetup/sqlite-config.tcl`. No `CMakeLists.txt` or `*.cmake` file exists anywhere in the tree; no Dockerfiles of any kind exist (`filename:Dockerfile` code search returns zero results); no QEMU references exist anywhere in the repository.

autosetup's `system.tcl` (`system-init`) implements standard `--build`/`--host` cross-compilation semantics, using `$host-` as the toolchain prefix (overridable via the `CROSS` environment variable). Confirmed riscv64 cross-compile invocation:

```sh
./configure --host=riscv64-linux-gnu \
            CC=riscv64-linux-gnu-gcc \
            --disable-tcl \
            --dev
make sqlite3.c      # amalgamation
make sqlite3         # cross-compiled CLI binary
```

Equivalent `CROSS` form:

```sh
./configure CROSS=riscv64-linux-gnu- --host=riscv64-unknown-linux-gnu
make
```

Direct amalgamation compile without autosetup, useful for embedded integration:

```sh
riscv64-linux-gnu-gcc -DSQLITE_THREADSAFE=0 -DSQLITE_OMIT_LOAD_EXTENSION \
  -Os -c sqlite3.c -o sqlite3.o
```

Canonical GNU triple recognized by the bundled `config.guess`: `riscv64-unknown-linux-gnu` (from the `riscv64:Linux:*:*` case arm). Cross-compiling automatically skips host-dependent checks, e.g. `autosetup/sqlite-config.tcl` (~line 1256): `if {$::sqliteConfig(is-cross-compiling)} { proj-warn "Skipping check for readline.h because we're cross-compiling." }`.

Relevant configure flags:

| Flag | Effect |
|---|---|
| `--disable-tcl` | Disable Tcl-dependent components (all tests) - useful for cross builds with no riscv64 tclsh |
| `--disable-shared` / `--disable-static` | Disable shared/static library build |
| `--disable-amalgamation` | Build all files separately instead of single `sqlite3.c` |
| `--disable-load-extension` | Remove dlopen dependency |
| `--disable-readline` | Disable readline support (no deps on cross sysroot) |
| `--static-cli-shell` | Statically link CLI shell, useful for QEMU-run binaries |
| `-DSQLITE_BYTEORDER=1234` | RISC-V is little-endian; avoids runtime detection overhead |
| `-DSQLITE_OS_OTHER=1` | For bare-metal/custom OS targets |

**Minimum toolchain version:** no minimum GCC/Clang version is stated anywhere in the build system or docs, for riscv64 or any architecture. The only requirement in `AGENTS.md` is C89/C99 compatibility. The `SQLITE_USE_UINT128` optimization is auto-detected purely via `defined(__GNUC__) || defined(__clang__)` plus the architecture macros in Section 4, with no version check; if the intrinsic is unavailable, the code falls back silently to a portable 64x64->128 software path with no build failure. A practical floor (GCC >= 7, Clang >= 9 with `--target=riscv64-unknown-linux-gnu` and a sysroot) is a reasonable estimate but is not documented by SQLite itself: [NEEDS VERIFICATION].

QEMU use (e.g. `qemu-riscv64 -L /usr/riscv64-linux-gnu ./sqlite3 --version`) is a downstream practice; SQLite's own tree documents, tests, or ships no QEMU tooling.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| `__uint128_t` high-precision multiply | Full (C intrinsic) | Full (C intrinsic) | Full (C intrinsic, since 2026-04-27) | None |
| u64 hardware division | Full | Full | Full | None |
| Cycle counter (`hwtime.h`) | Full (inline asm `rdtsc`) | Full (inline asm `mrs`) | Missing (returns 0) | Debug/profiling only; zero production impact |
| Pointer-size detection | Full (`__SIZEOF_POINTER__`) | Full | Full | None |
| Byte-order detection | Full (`__BYTE_ORDER__`) | Full | Full | None |
| Build system | Full | Full | Full | None |
| SIMD/vectorization | None (not implemented for any arch) | None | None | N/A |
| JIT | None | None | None | N/A |
| Assembly routines | None | None | None | N/A |

The only gap is the `hwtime.h` debug cycle counter, which has no bearing on production use. SQLite is functionally and performance-architecturally equivalent across riscv64, amd64, and arm64; all remaining performance differences are a function of the C compiler and scalar hardware throughput, not missing SQLite code paths. No RISC-V-specific NaN or floating-point correctness issue was found; SQLite has a general (non-architecture-specific) quirk where `sqlite3_bind_double(NaN)` is stored/read back as SQL NULL, and a historical `sqlite3IsNaN()` bug exists for "RISC OS" (the 1980s Acorn operating system) - unrelated to the RISC-V ISA and worth noting only to avoid confusion with search results.

## 7. CI/CD Infrastructure

SQLite's GitHub mirror has **no CI infrastructure of any kind, for any architecture.** This was verified directly via GitHub code search against real indexed file content (not inference from a blocked API):

- `path:.github` -> 0 results. No `.github` directory exists at all; GitHub Actions workflows can only live under `.github/workflows/`, so a zero-result query on that path is direct, strong evidence of absence, not merely "unable to find."
- `extension:yml` -> 0 results. Zero YAML files anywhere in the repository.
- `filename:Jenkinsfile`, `filename:.gitlab-ci.yml`, `filename:.travis.yml`, `filename:.cirrus.yml` -> 0 results each.
- `workflow_dispatch` -> 0 results; no manually-triggered job exists under any filename.
- `riscv64` -> 2 results total, both the generic `config.sub`/`config.guess` boilerplate described in Section 4, neither CI-related.

SQLite's canonical development on the Fossil infrastructure at sqlite.org was also checked for riscv64 CI evidence and none was found. SQLite's testing is entirely local, driven by `make devtest`/`releasetest` using the Tcl-based test harness; its documentation mentions testing on "a variety of CPU architectures" without naming any beyond x86, and makes no mention of RISC-V.

| Architecture | Upstream CI | Hardware used | RISE runners used |
|---|---|---|---|
| amd64 | None | N/A | No |
| arm64 | None | N/A | No |
| riscv64 | None | N/A | No |

No RISE Project CI runners are used anywhere in SQLite's own infrastructure. riscv64 regressions are caught only by downstream distribution build infrastructure: Buildroot autobuilders (which caught the April 2026 riscv32 bug) and Debian `buildd`, which builds `libsqlite3-0` on real riscv64 hardware (`rv-osuosl-02`, an OSUOSL-hosted machine).

## 8. Distribution and Release Status

SQLite does not publish riscv64 binaries itself. [sqlite.org/download.html](https://www.sqlite.org/download.html) provides precompiled Linux binaries for x64 only; macOS provides arm64/x64; Windows provides arm64/x64/x86. No `sqlite-tools-linux-riscv64` package exists. GitHub Releases are not used at all - a direct fetch of [github.com/sqlite/sqlite/releases](https://github.com/sqlite/sqlite/releases) returns "There aren't any releases here," confirming SQLite distributes via sqlite.org's amalgamation download rather than GitHub release assets, for any architecture.

| Distribution | Package | Version | riscv64 status | Notes |
|---|---|---|---|---|
| Ubuntu 24.04 LTS (noble) | `sqlite3` / `libsqlite3-0` | per [packages.ubuntu.com](https://packages.ubuntu.com/resolute/riscv64/sqlite3) | Available | Built for riscv64 alongside amd64, arm64, armhf, i386, ppc64el, s390x |
| Ubuntu 26.04 LTS (resolute) | `sqlite3` / `sqlite3-tools` | `3.46.1-9` [ports]; `3.46.1-9ubuntu0.3` [resolute-updates, security] | Available | Directly confirmed: HTTP 200 at [packages.ubuntu.com/resolute/riscv64/sqlite3](https://packages.ubuntu.com/resolute/riscv64/sqlite3), riscv64 sits in Ubuntu's "ports" (community-maintained) architecture tier for the base package, with a riscv64 build also present in the primary security-updates channel |
| Debian sid (unstable) | `sqlite3`, `libsqlite3-0` | 3.53.2-1 (most recent version directly confirmed) | Available | Built on real riscv64 hardware (`rv-osuosl-02`, OSUOSL); migration to Debian testing is blocked by regressions in *dependent* packages `ruby-sqlite3` and `tinysparql`, which appear to affect all architectures equally, not sqlite3 itself |
| Arch Linux RISC-V (unofficial port) | `sqlite` | previously reported as 3.53.2-1-riscv64 | Unresolved this round | Direct re-verification attempted; the general project-info page returned no package table, and guessed repo-browse URLs (`/~ambroz/riscv64/`, `/~ambroz/repo/riscv64/`) both 404'd. Neither confirmed present nor confirmed absent: [NEEDS VERIFICATION] |
| Fedora Rawhide | `sqlite` | previously reported as 3.53.2-1.fc45 | Not independently re-confirmed this round | [NEEDS VERIFICATION] |
| PyPI | `sqlite` | N/A | Does not exist | `pypi.org/pypi/sqlite/json` and `pypi.org/simple/sqlite/` both return HTTP 404; SQLite is a C library, not a Python package (Python's `sqlite3` module is stdlib). RISE wheel-mirror proxy redirects to pypi.org, which also 404s |

No riscv-specific packaging patches were found in any distro's packaging metadata; the only riscv-specific change anywhere is the upstream `__uint128_t` fix landed directly into SQLite's own source (Section 2), not a distro-side patch. This is a clean distro build - see Section 13.

## 9. Dependencies

SQLite's core library has zero required external dependencies; all SQL engine functionality compiles from the amalgamation. External libraries are optional and affect specific features or the CLI shell only; the build toolchain itself is the only critical dependency class.

| Dependency | Role | Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Notes / Blocking Issues |
|---|---|---|---|---|---|---|
| zlib | Optional compression for SQL Archive and the CLI `.archive` command (`SQLITE_HAVE_ZLIB`) | Optional | Available - Debian `zlib1g` for riscv64 | N/A (optional) | Available in all major distros | [madler/zlib#1099](https://github.com/madler/zlib/pull/1099): RVV Adler32 optimization stalled since October 2025 - performance only, not a build or correctness blocker |
| ICU | Optional Unicode-aware collation, LIKE, case-folding (`SQLITE_ENABLE_ICU`) | Optional | Available - Debian `libicu-dev`, all 16 Debian architectures including riscv64 | N/A | Available | None identified |
| readline | CLI shell line-editing only (`sqlite3` shell) | Optional | Available - Debian `libreadline-dev` for riscv64 | N/A | Available | None; cross-compiles skip the readline.h check automatically (`autosetup/sqlite-config.tcl`) |
| Tcl | `libtclsqlite3.so` extension, and SQLite's entire Tcl-based test harness | Critical (for testing) | Available - Debian `tcl8.6` for riscv64 | No riscv64-specific Tcl defects found; indirect risk to SQLite's own test suite if Tcl regresses on riscv64 | Available | None found specific to riscv64 |
| GCC | Primary build toolchain; riscv64 cross-compilation via `riscv64-linux-gnu-gcc` | Critical | Mainline riscv64 target support; used in every documented cross-compile recipe (Section 5) | N/A | riscv64 native/cross GCC packages available in Debian/Ubuntu | None found |
| LLVM | Alternative build toolchain (Clang); gates the same `__uint128_t` detection via `defined(__clang__)` alongside GCC | Optional | riscv64 target supported via `--target=riscv64-unknown-linux-gnu` plus sysroot | N/A | Available | No minimum version stated by SQLite or confirmed from a primary upstream doc: [NEEDS VERIFICATION] |
| autosetup | SQLite's build-configuration system (not GNU Autoconf, not CMake); vendored directly inside the source tree (`autosetup/` directory), driven by `auto.def` + `autosetup/sqlite-config.tcl` | Critical | Vendored in-tree - not a separately packaged riscv64 dependency; runs in whatever host/cross environment invokes it | N/A | Ships embedded in every SQLite source release, including the amalgamation tarball | None found |
| pthreads | Multi-threaded mode, WAL concurrent readers | Optional | Provided by glibc; no external package | N/A | Available | None |
| libdl | Loadable extension support (`dlopen`) | Optional | Provided by glibc | N/A | Available | None |
| libm | Math SQL functions (`sin()`, `cos()`, etc., under `SQLITE_ENABLE_MATH_FUNCTIONS`) | Optional | Provided by glibc | N/A | Available | None |

All distribution-packaged runtime dependencies are available for riscv64 in Debian sid as official ports with no unofficial-port or missing-architecture gaps. The build-toolchain dependencies (GCC, LLVM, autosetup) impose no riscv64-specific constraint beyond standard cross-compiler availability.

## 10. Ecosystem Status

SQLite itself has no package-manager presence to track (no PyPI, npm, or Maven artifact named `sqlite` - Section 8), so there is no "SQLite package ecosystem" in the conventional sense. There is, however, a real and recent riscv64 enablement ecosystem around third-party **language bindings that depend on SQLite**, driven by RISE's `riseproject-dev/python-wheels` repository, which is worth tracking separately since each binding needs its own riscv64 wheel.

Since September 2026, riscv64 wheel-build CI was merged for the following SQLite-adjacent Python packages, all authored by `luhenry` (RISE/python-wheels maintainer, MEMBER association) and running on RISE's dedicated riscv64 GitHub Actions runner fleet (non-emulated, real riscv64 builds):

| Package | PR | Merged | Notes |
|---|---|---|---|
| sqlite-vec | [#951](https://github.com/riseproject-dev/python-wheels/pull/951) | 2026-09-05 | Follow-up issue [#952](https://github.com/riseproject-dev/python-wheels/issues/952) (open) requests the riscv64 wheel be published to PyPI, not just built in CI |
| apsw | [#1071](https://github.com/riseproject-dev/python-wheels/pull/1071) | 2026-09-06 | |
| adbc-driver-manager | [#1023](https://github.com/riseproject-dev/python-wheels/pull/1023) | 2026-09-06 | |
| pysqlite3 | [#1183](https://github.com/riseproject-dev/python-wheels/pull/1183) | 2026-09-07 | |
| sqlean-py | [#1217](https://github.com/riseproject-dev/python-wheels/pull/1217) | 2026-09-07 | |
| pysqlite3-binary | [#1498](https://github.com/riseproject-dev/python-wheels/pull/1498) | 2026-09-08 | |
| adbc-driver-sqlite | [#1740](https://github.com/riseproject-dev/python-wheels/pull/1740) | 2026-09-12 | v1.12.0; mirrors upstream Apache Arrow ADBC manylinux job; builds libsqlite3 from manylinux's `sqlite-devel` rather than a vcpkg riscv64 cache |
| adbc-driver-flightsql | [#2271](https://github.com/riseproject-dev/python-wheels/pull/2271) | 2026-09-24 | Version bump to 1.12.0 |

A related but unrelated-to-SQLite-itself issue, [riseproject-dev/python-wheels#1260](https://github.com/riseproject-dev/python-wheels) ("sqloxide riscv64 support," opened 2026-09-07), requests a riscv64 wheel for the `sqloxide` SQL-parsing package.

This activity is **not reflected** in RISE's own curated Wheel Builder documentation page (`riseproject.gitlab.io/python/wheel_builder/`), which does not list "SQLite" or any of the package names above - that doc page is a stale, non-exhaustive subset of the actual CI repository's much larger backlog (797 open issues at time of check). No RISE blog post discusses SQLite or any of these bindings.

**Bottom line:** SQLite the core C library has zero RISE involvement, but a real, actively-maintained riscv64 wheel-build pipeline exists for its most common Python bindings, built on standard GitHub Actions workflows running on RISE's riscv64 runner fleet. This is routine wheel-packaging CI contribution from a RISE maintainer, not a funded engagement, and at least one package (sqlite-vec) has a riscv64 wheel built in CI but not yet published to PyPI.

## 11. Known Bugs and Active Issues

| Item | Status | Description | Affected version | Resolution |
|---|---|---|---|---|
| [PR #44](https://github.com/sqlite/sqlite/pull/44) / [Forum f8d1417ce8](https://sqlite.org/forum/info/f8d1417ce8eb2f22dd1754d39e735114fa102ab2294b96bf8e4d075bd8ab8a7a) | Closed, not merged on GitHub; fixed upstream | riscv32 build failure: `__uint128_t` used on a 32-bit RISC-V target where it is unavailable, because `defined(__riscv)` matched both riscv32 and riscv64 | SQLite 3.53.0 | Fixed directly on Fossil trunk (git-mirror SHA [70d1e3e](https://github.com/sqlite/sqlite/commit/70d1e3e75e4a0bd15b2f6c800628887e1884e675), 2026-04-27). **Not yet in any tagged release** - latest release is 3.53.4 (2026-07-24), confirmed via git-ancestry check NOT to contain this fix; pending a future 3.53.5 or 3.54.0 |
| [PR #15](https://github.com/sqlite/sqlite/pull/15) | Closed, 0 engagement | Non-code discussion post asking the community to validate a third-party tool's "simple to port" assessment of SQLite for RISC-V | N/A | Not actionable; no maintainer response |
| [PR #24](https://github.com/sqlite/sqlite/pull/24) "Add loongarch support" | Closed, not merged | Mentions RISC-V once as an analogy only; not actually a RISC-V item | N/A | Excluded from scope, noted for completeness |

Open riscv64 bugs: none found, in GitHub issues, GitHub PRs, GitHub commit search, or the SQLite Forum. Open riscv32 bugs: none (the only known one is fixed on trunk, unreleased). No RISC-V-specific NaN or floating-point correctness bug exists; see Section 6 for the unrelated "RISC OS" naming collision. The riscv32 `__uint128_t` bug is the only confirmed RISC-V-related defect found anywhere in the project's searchable history.

## 12. Objections and Upstream Blockers

**Contribution model is a structural risk.** SQLite does not accept patches from contributors without a public-domain affidavit on file at Hwaci. Bug fixes must go through the Fossil forum and be adopted by Hwaci staff, or be maintained out-of-tree. Response time can be fast (the April 2026 fix took under 24 hours from report to trunk commit), but the bus factor is low - two named committers (drh, stephan) handled the only RISC-V issue on record, and GitHub PRs against `sqlite/sqlite` are routinely closed unmerged once an equivalent fix lands upstream.

**No upstream CI of any kind means no automated regression detection, for any architecture.** This is not a riscv64-specific deficiency - SQLite has zero GitHub Actions presence, zero `.yml` CI files, and no equivalent CI infrastructure found on its Fossil repository either. Establishing riscv64 CI would require first establishing CI for SQLite generally, which the project has shown no indication of adopting; regressions are caught only by downstream distribution builders (Buildroot, Debian buildd on `rv-osuosl-02`).

**Maintainers lack RISC-V hardware.** Stephan Beal stated explicitly during the April 2026 incident: "This project does not accept PRs, nor do we have access to a 32-bit riscv system to test this one." No evidence of riscv64 hardware access was found either. Any riscv64-specific bug requires the community to supply reproduction steps and confirm fixes, adding latency to the resolution cycle.

**The one confirmed fix has not shipped yet.** The riscv32 `__uint128_t` fix sits on trunk, unreleased as of the latest tag (3.53.4, 2026-07-24). This does not affect riscv64 (which was never broken), but it means any downstream distro tracking a tagged release rather than trunk is still carrying the pre-fix code path for riscv32 builds specifically.

**`hwtime.h` cycle counter stub.** The `rdcycle` CSR is a natural one-instruction fit for riscv64, equivalent to `rdtsc` on x86. The stub returning 0 is harmless for production use but blocks profiling/internal timing in debug builds. A fix would be a small inline-assembly addition but requires maintainer adoption via the forum, same as any other change.

**No blocking technical issue exists for production use of SQLite on riscv64.** The Debian testing-migration blocker is in dependent packages (`ruby-sqlite3`, `tinysparql`), not in `sqlite3` itself, and no open riscv64-specific issue or PR exists against `sqlite/sqlite`.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro

**Justification.** SQLite's GitHub mirror has no upstream CI of any kind for any architecture - confirmed via GitHub code search returning zero results for `path:.github`, `extension:yml`, and filename searches for `Jenkinsfile`/`.gitlab-ci.yml`/`.cirrus.yml` in `sqlite/sqlite`; SQLite's real development happens on a Fossil repository at sqlite.org, where no riscv64 CI evidence was found either. The absence of any upstream riscv64 build or test CI rules out green or blue. The distribution floor applies instead: Ubuntu ships `sqlite3`/`libsqlite3-0` for riscv64 in both noble (24.04) and resolute (26.04) per [packages.ubuntu.com](https://packages.ubuntu.com/resolute/riscv64/sqlite3), and Debian sid builds it on real riscv64 hardware (`rv-osuosl-02`), all from unmodified upstream source. The only riscv-specific code anywhere in the project - a `__riscv_xlen`-gated `__uint128_t` feature-detection fix for riscv32 (commit [70d1e3e](https://github.com/sqlite/sqlite/commit/70d1e3e75e4a0bd15b2f6c800628887e1884e675)) - was landed directly upstream, not as a distro patch. With no riscv64-specific packaging patches found anywhere, this is a clean distro build, capping the color at yellow under the clean-distro-build sub-rule. SQLite is a general-purpose embedded SQL engine, not a project whose core value is RISC-V-specific speedups, so it is not an optimization-purpose project and the optimization-level modifier does not apply.

**Pending work that could change the grade.** No open riscv64-specific issues or PRs exist against `sqlite/sqlite` (it uses GitHub only as a mirror and does not accept PRs). The riscv32 `__uint128_t` bug fix (landed 2026-04-27) has not yet shipped in a tagged release (latest is 3.53.4, 2026-07-24); it sits on trunk pending a future release. A Debian testing migration is blocked by regressions in dependent packages (`ruby-sqlite3`, `tinysparql`), not `sqlite3` itself. No RISE blog, funded-project, or wheel-builder involvement with SQLite was found - RISE's SQLite-adjacent work is limited to riscv64 wheels for third-party Python bindings (sqlite-vec, apsw, pysqlite3, and others, Section 10) in `riseproject-dev/python-wheels`, not SQLite itself. None of this would change the color absent upstream riscv64 CI appearing.

## 14. Investment Analysis

RISE has not funded or engaged with SQLite core directly; its only adjacent work is routine wheel-build CI for third-party SQLite Python bindings (Section 10), which is already in progress and should not be re-sized here.

### 14.1 Functional Enablement

SQLite is functionally complete on riscv64 today. The only historical functional gap (the riscv32 `__uint128_t` build failure, which does not affect riscv64) was fixed on trunk in April 2026, though it has not yet shipped in a tagged release. No open bugs exist against riscv64. No missing feature implementations exist. The codebase requires no architecture-specific work for riscv64 by design.

**Required investment: zero to low.** SQLite on riscv64 works today without engineering contribution. The only optional item is confirming (via the SQLite Forum, since GitHub PRs are not merged) when the trunk fix ships in a tagged release, relevant only to riscv32 consumers.

### 14.2 Performance Optimization

SQLite has no SIMD dispatch, no assembly routines, and no JIT for any architecture. Optimization opportunities are limited to:

1. The `hwtime.h` cycle counter (one line of inline assembly; debug/profiling infrastructure only, zero production impact).
2. Compiler flag tuning, which is outside SQLite's codebase and handled by distribution package maintainers.
3. No RVV opportunities exist in SQLite - the project has no vectorized code for any architecture.

Data not available: a riscv64-vs-amd64-vs-arm64 performance comparison for SQLite using a stated methodology. The official [sqlite.org/cpu.html](https://www.sqlite.org/cpu.html) performance page contains only x64 data. A Phoronix/OpenBenchmarking.org `speedtest1` result exists for two individual riscv64 boards (SiFive @ 1.50GHz/StarFive VisionFive V2: 686.67s +/- 6.74s; SpacemiT X100: 227.22s) but without a same-run x86/arm64 baseline, so it cannot be used as a cross-architecture comparison [NEEDS VERIFICATION]. A set of Go SQLite-driver riscv64 benchmark figures found via web search could not be traced to a confirmed primary source and carry inconsistent driver-name labels across queries; they are not citable as-is.

**Required investment: low.** The cycle-counter fix is roughly 1-3 person-days including forum-based upstream submission. A proper `speedtest1`-based riscv64-vs-arm64-vs-amd64 baseline, run on comparable hardware, is roughly 1-2 person-days and is a precondition for any informed performance investment decision. Both are optional given SQLite's architecture-neutral design.

### 14.3 CI/CD Infrastructure

SQLite has no CI infrastructure of any kind, for any architecture. Establishing riscv64-specific CI is not really a standalone item - it requires first establishing CI for SQLite generally, which the project has shown no interest in and whose GitHub mirror does not accept the PR mechanism normally used to propose one. An alternative is a downstream CI configuration maintained outside SQLite's canonical repository (e.g., a Buildroot-level or distro-level regression test), which catches regressions without requiring upstream adoption and is effectively what already happens via Buildroot and Debian buildd.

**Required investment: medium, primarily due to upstream-cooperation uncertainty.** A QEMU-based riscv64 test runner, maintained downstream, is roughly 2-4 person-weeks. Upstream CI adoption via the Fossil forum is a low-cost proposal (roughly 1 person-week) with an uncertain, likely low, probability of acceptance given the project's demonstrated lack of CI for any architecture.

### 14.4 Ecosystem Enablement

The Debian testing-migration blocker (regressions in `ruby-sqlite3` and `tinysparql`) warrants brief triage to confirm the regressions are architecture-agnostic and to assess whether a fix contribution is warranted; this is a dependent-package issue, not a SQLite issue. The zlib RVV Adler32 optimization ([madler/zlib#1099](https://github.com/madler/zlib/pull/1099)) is stalled but only affects the optional SQL Archive compression feature and is not a SQLite investment item. Separately, RISE's `python-wheels` CI already covers the riscv64 wheel-build step for the main SQLite Python bindings (Section 10); the remaining gap is publication, not building - e.g. sqlite-vec's riscv64 wheel is built in CI but not yet pushed to PyPI per open issue [#952](https://github.com/riseproject-dev/python-wheels/issues/952).

**Required investment: low.** Debian dependent-package triage: 1-3 person-days. Following up on the sqlite-vec PyPI-publish gap (and any similarly-stuck bindings) is a coordination task, not new engineering, roughly 1-2 person-days.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Track upstream release shipping the riscv32 `__uint128_t` trunk fix (no riscv64 impact) | 0.1 | Ecosystem team | Low |
| Performance | Baseline SQLite `speedtest1` on riscv64 vs amd64 vs arm64, same hardware tier | 0.4 | Performance team | Medium |
| Performance | Implement `hwtime.h` riscv64 cycle counter (inline asm + upstream forum submission) | 0.2 | Any engineer | Low |
| CI/CD | QEMU-based downstream riscv64 test runner for SQLite's Tcl test suite | 2-4 | Infrastructure team | Medium |
| CI/CD | Upstream CI adoption proposal via Fossil forum (outcome uncertain, applies to SQLite generally, not just riscv64) | 1 | Ecosystem team | Low |
| Ecosystem | Triage Debian testing-migration blockers in `ruby-sqlite3` and `tinysparql` | 0.5 | Ecosystem team | Medium |
| Ecosystem | Coordinate with RISE python-wheels maintainer to publish built-but-unpublished riscv64 wheels (e.g. sqlite-vec, issue #952) | 0.3 | Ecosystem team | Low |

## 15. References

- [SQLite Fossil repository](https://www.sqlite.org/src/)
- [SQLite GitHub mirror (read-only)](https://github.com/sqlite/sqlite)
- [SQLite download page](https://www.sqlite.org/download.html)
- [SQLite copyright / public domain](https://sqlite.org/copyright.html)
- [SQLite CPU performance page](https://www.sqlite.org/cpu.html)
- [SQLite Forum f8d1417ce8 - riscv32 build failure report and fix thread](https://sqlite.org/forum/info/f8d1417ce8eb2f22dd1754d39e735114fa102ab2294b96bf8e4d075bd8ab8a7a)
- [GitHub PR #44 - Disable uint128 intrinsics on riscv32](https://github.com/sqlite/sqlite/pull/44)
- [GitHub PR #15 - RISC-V porting complexity assessment](https://github.com/sqlite/sqlite/pull/15)
- [GitHub PR #24 - Add loongarch support (false positive, RISC-V mentioned only as analogy)](https://github.com/sqlite/sqlite/pull/24)
- [GitHub mirror commit 70d1e3e - trunk fix, src/util.c](https://github.com/sqlite/sqlite/commit/70d1e3e75e4a0bd15b2f6c800628887e1884e675)
- [Ubuntu resolute (26.04) sqlite3 riscv64 package page](https://packages.ubuntu.com/resolute/riscv64/sqlite3)
- [zlib PR #1099 - RVV Adler32 optimization (stalled)](https://github.com/madler/zlib/pull/1099)
- [RISE Project](https://riseproject.dev)
- [RISE Project members](https://riseproject.dev/members/)
- [riseproject-dev/python-wheels PR #951 - sqlite-vec riscv64 wheel build](https://github.com/riseproject-dev/python-wheels/pull/951)
- [riseproject-dev/python-wheels Issue #952 - publish sqlite-vec riscv64 wheel to PyPI](https://github.com/riseproject-dev/python-wheels/issues/952)
- [riseproject-dev/python-wheels PR #1071 - apsw riscv64 wheel build](https://github.com/riseproject-dev/python-wheels/pull/1071)
- [riseproject-dev/python-wheels PR #1023 - adbc-driver-manager riscv64 wheel build](https://github.com/riseproject-dev/python-wheels/pull/1023)
- [riseproject-dev/python-wheels PR #1183 - pysqlite3 riscv64 wheel build](https://github.com/riseproject-dev/python-wheels/pull/1183)
- [riseproject-dev/python-wheels PR #1217 - sqlean-py riscv64 wheel build](https://github.com/riseproject-dev/python-wheels/pull/1217)
- [riseproject-dev/python-wheels PR #1498 - pysqlite3-binary riscv64 wheel build](https://github.com/riseproject-dev/python-wheels/pull/1498)
- [riseproject-dev/python-wheels PR #1740 - adbc-driver-sqlite riscv64 wheel build](https://github.com/riseproject-dev/python-wheels/pull/1740)
- [riseproject-dev/python-wheels PR #2271 - adbc-driver-flightsql version bump](https://github.com/riseproject-dev/python-wheels/pull/2271)