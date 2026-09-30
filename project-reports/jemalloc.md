---
title: jemalloc
parent: Project Reports
color: orange
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: runtime-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: libunwind
    relation: runtime-dependency
    criticality: optional
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="jemalloc" %}

# jemalloc

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Optimization level:** absent<br/>
**Scope:** RISC-V (riscv64/linux) support status for jemalloc<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

jemalloc is a general-purpose malloc(3) implementation emphasizing low fragmentation, scalable concurrency, and profiling facilities. It is used as the default or optional allocator in Firefox, FreeBSD libc, Android Bionic, Meta production infrastructure, Redis, MySQL, and numerous other systems. The project homepage is [jemalloc.net](https://jemalloc.net/) and the repository is [github.com/jemalloc/jemalloc](https://github.com/jemalloc/jemalloc).

**License:** BSD 2-Clause. Copyright held jointly by Jason Evans (original author, 2002-present), Mozilla Foundation (2007-2012, an early corporate sponsor/employer of Evans), and Facebook, Inc. (2009-present).

**Foundation:** None. jemalloc is not hosted by the Linux Foundation, Apache, CNCF, or the RISE Project. It is not a RISE member project: the RISE member list (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE) does not include jemalloc, and RISE membership is corporate, not project-based. There is no MAINTAINERS, OWNERS, CODEOWNERS, CONTRIBUTING.md, or GOVERNANCE.md file in the repository; governance is informal and exercised de facto by a small set of long-tenured committers via GitHub issues and Discussions.

**Corporate stewardship:** jemalloc is effectively a Meta-controlled project. Of the last 500 commits, 351 (~70%) came from `@meta.com`/`@fb.com` addresses:

| Contributor | Company | Commits (last 500) |
|---|---|---|
| Slobodan Predolac | Meta/Facebook | 137 |
| Guangli Dai | Meta (ex-Facebook) | 96 |
| Qi Wang (interwq) | Meta/Facebook, de facto lead maintainer who merges most PRs | 44 |
| Kevin Svetlitski | Meta | 35 |
| Tony Printezis | Meta/Facebook | 25 |
| Shirui Cheng | Meta | 21 |
| Carl Shapiro | Meta | 14 |
| David Goldblatt | Meta | 8 |
| Farid Zakaria | Meta | 5 |
| Bin Liu | Meta | 4 |

Non-Meta contributors are minor and scattered: Dmitry Ilvokhin (independent, 25), Christoph Gruninger (independent, 7), Raul Marin (ClickHouse, 3), Microsoft-affiliated (4), ByteDance (3), Shopify (1), Redis (1).

**Community stance on new ports:** Informal and reactive, not programmatic. There is no architecture-tier system, no dedicated porting roadmap, and no RISC-V-specific documentation or CI. Every RISC-V-related fix that has merged (macro-spelling PR #1081, atomics-linking PR #1402) went from open to merged within days with essentially no pushback, showing the maintainers do not obstruct RISC-V patches. But they also do not initiate any: [issue #2399](https://github.com/jemalloc/jemalloc/issues/2399), asking whether RISC-V64 cross-compilation is officially supported, has received zero maintainer response since it was opened on 2023-03-21, despite two independent community +1s (2023-08-09, 2024-06-16). New-architecture support for jemalloc depends entirely on unaffiliated outside contributors rather than any organized or funded effort.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2017-12-03 | PR #1081 opened by EdSchouten (NUXI/CloudABI, unaffiliated with Meta): corrects `__riscv__` macro spelling to `__riscv` per RISC-V toolchain conventions | [PR #1081](https://github.com/jemalloc/jemalloc/pull/1081) |
| 2017-12-09 | Reviewer interwq (Meta) requests the backward-compatible form `defined(__riscv) || defined(__riscv__)`; EdSchouten pushes the fix; merged same day as commit 749caf1 | [commit 749caf1](https://github.com/jemalloc/jemalloc/commit/749caf14ae73a9ab1c48e538a8af09addbb35ee7) |
| 2018-05-08 | jemalloc 5.1.0 released; first release containing `__riscv` detection | [releases](https://github.com/jemalloc/jemalloc/releases) |
| 2019-01-03 | Issue #1401 filed by paravoid (Debian jemalloc maintainer): riscv64 FTBFS, `undefined reference to '__atomic_compare_exchange_1'`, because riscv64 lacks native 8/16-bit atomics and libatomic was not being linked | [issue #1401](https://github.com/jemalloc/jemalloc/issues/1401) |
| 2019-01-03 | Reviewer davidtgoldblatt (Meta) raises a non-blocking performance concern about libatomic fallback speed on the comment thread | [issue #1401](https://github.com/jemalloc/jemalloc/issues/1401) |
| 2019-01-08/09 | PR #1402 opened and merged by paravoid: replaces `-lpthread` with `-pthread` in `configure.ac` and `Makefile.in`, causing the linker to auto-pull `-latomic`. Merged as commit 4711910, ~6-day turnaround from issue to fix | [PR #1402](https://github.com/jemalloc/jemalloc/pull/1402), [commit 4711910](https://github.com/jemalloc/jemalloc/commit/471191075d6a88eb1364fb5f332237eb3d512872) |
| 2019-04-02 | jemalloc 5.2.0 released; first release containing the `-pthread` fix | Verified via `git tag --contains 4711910` |
| 2022-08-29 | Issue #2323 filed by nc7s: `configure` does not recognize the `riscv64gc-unknown-linux-gnu` triple, blocking the Rust `jemalloc-sys` crate build on Debian; reporter also hits a GCC `-Werror=use-after-free` compile error in `test/integration/overflow.c` on riscv64 | [issue #2323](https://github.com/jemalloc/jemalloc/issues/2323) |
| 2023-03-21 | Issue #2399 filed by jinge90: asks whether cross-compilation from x86_64 to riscv64 is officially supported; still unanswered as of this report | [issue #2399](https://github.com/jemalloc/jemalloc/issues/2399) |
| 2023-11-02 | Issue #2323 closed with state_reason "completed" | [issue #2323](https://github.com/jemalloc/jemalloc/issues/2323) |

**Discrepancy flagged:** issue #2323 was closed as "completed" on 2023-11-02, but a full-history commit search (`git log --all --grep="riscv64gc" -i`, zero matches) and a PR search (`riscv64gc repo:jemalloc/jemalloc`, zero results) found no jemalloc commit or PR that actually resolves it. No trace of a `riscv64gc` config.sub/config.guess fix exists anywhere in jemalloc's tagged history. The likely explanation is that the fix (if any) was applied downstream in Debian's packaging rather than merged into jemalloc itself, or the issue was closed without an in-repo code change. This is the weakest-documented resolution of the three closed issues and should be treated as an open question, not a confirmed fix.

**Key contributors:** EdSchouten (external, NUXI/CloudABI) and paravoid (external, Debian) authored both merged riscv64 patches. Neither is a Meta employee. All merged RISC-V changes are upstream; none is carried as a downstream-only patch.

## 3. Upstream Support Tier

jemalloc has no formal tier policy. No `PLATFORMS.md`, `SUPPORT.md`, or `docs/platforms/` file exists in the repository. Platform support is defined implicitly by CI coverage only.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI coverage (upstream) | Yes (`ubuntu-24.04`) | Yes (`ubuntu-24.04-arm`) | No |
| Official binary releases | No (source tarball only) | No (source tarball only) | No (source tarball only) |
| CPU spin-wait hint | `pause` (asm) | `isb` (asm) | volatile no-op |
| Sub-word atomic ops | Native | Native | libatomic (software) |
| Named in configure.ac CPU-detection case | Yes | Yes | No (falls to generic wildcard) |
| Release-blocking | Yes (implicit via CI) | Yes (implicit via CI) | No |

riscv64 is a third-tier platform by practice: it compiles and runs, and is packaged by distros without downstream patches, but has no upstream CI, no architecture-specific optimization beyond one alignment macro, and no maintainer attention.

## 4. Technical Architecture and RISC-V-Specific Subsystems

jemalloc has no JIT, no SIMD paths, no cryptographic components, and no per-architecture source directories or assembly files for any platform (this includes amd64 and arm64: their "hand-tuned" paths are single inline-asm instructions, not full assembly backends). Architecture customization is confined entirely to preprocessor guards in shared headers and `configure.ac` dispatch tables.

Grepping `include/` and `src/` for architecture macros found: 5 files gate on `__x86_64__`/`__amd64__`/`__i386__`, 5 files gate on `__aarch64__`/`__arm__`, and exactly **1 file** gates on `__riscv`. Repo-wide, `__riscv` appears nowhere else (not in `src/`, not in `test/`). No `.s`/`.asm` files exist in the repository for any architecture.

**Allocation alignment (LG_QUANTUM):** `include/jemalloc/internal/quantum.h`, a 90-line file with no TODO/FIXME markers:
```c
#if defined(__riscv) || defined(__riscv__)
#   define LG_QUANTUM 4
#endif
```
Sets 16-byte minimum allocation alignment (2^4), identical to amd64, arm64, ppc64, and s390. This is the **only** RISC-V-specific code in the entire repository. It is correct and complete for its narrow purpose, but it is not a tuning win: it simply matches the value every other 64-bit architecture already uses. Per the orange readiness grade, this is the sole basis for any claim of RISC-V "support" in the allocator's differentiating logic.

**CPU spin-wait (`configure.ac` lines ~502-537, used by `spin.h`):**
```
case "${host_cpu}" in
  i686|x86_64)   -> hand-tuned: __asm__("pause") / _mm_pause()
  aarch64|arm*)  -> hand-tuned: __asm__("isb")
  *)             -> HAVE_CPU_SPINWAIT=0   (riscv64 lands here)
```
riscv64 falls into the wildcard default, compiling `spin_cpu_spinwait()` to a volatile no-op busy-loop rather than a hardware pause hint. RISC-V's Zihintpause extension (ratified, part of the riscv64gc baseline profile) defines a `pause` instruction that jemalloc never emits. This is a genuine, concrete, currently unfiled gap on a secondary hot path (adaptive spinlocks under contention), not the allocator's primary allocation/free path.

**Virtual address width (LG_VADDR, `configure.ac` lines ~546-619):**
```
case "${host_cpu}" in
  aarch64) -> hand-tuned constant (48, or 32 for ILP32)
  x86_64)  -> hand-tuned CPUID-leaf-0x80000008 runtime probe
  *)       -> assumes LG_VADDR = 8*sizeof(void*) = 64   (riscv64 lands here)
```
Real riscv64 Linux uses Sv39/Sv48/Sv57 paging (39/48/57 significant VA bits), not 64. This does not break correctness for native builds (a runtime probe overrides the fallback), but it zeroes `RTREE_NHIB` and disables the `RTREE_LEAF_COMPACT` radix-tree optimization that x86_64 and aarch64 receive. This is a "falls back to the generic/unoptimized C path" gap, not a missing feature.

**Canonical-pointer decode (`rtree.h`):** aarch64 gets a hand-written branch because ARM zero-extends unused high VA bits. riscv64 uses the generic sign-extension branch shared with x86_64 -- this is architecturally correct for RISC-V's Sv39/48/57 sign-extended canonical addressing, not a bug or gap; it is simply not special-cased because it does not need to be.

**Legacy `__sync`-builtin atomics fallback (`atomic_gcc_sync.h`):** superseded by `atomic_c11.h`/`atomic_gcc_atomic.h` on any modern toolchain. x86_64/ppc64/ppc/sparc64 get hand-tuned fence elision; riscv64 falls to the generic `__sync_synchronize()` catch-all. Low real-world impact since modern builds do not compile this file in.

**Experimental USDT tracing (`configure.ac` ~1787-1804, `jemalloc_probe_custom.h`):** explicit allow-list is `x86_64|aarch64|arm*` on Linux; riscv64 (and every other architecture) hits `AC_MSG_ERROR([Unsupported sdt on this platform])` if a user forces `--enable-experimental-sdt`. The feature is disabled (`#undef`) by default for all architectures, so this does not block normal riscv64 builds.

**Core atomics (load/store/CAS/fetch-add/fetch-sub):** routed through `atomic_c11.h` (C11 `<stdatomic.h>`) or `atomic_gcc_atomic.h` (`__atomic` builtins), both fully compiler-generic. riscv64 gets the same tier of support here as aarch64 and x86_64 -- the compiler lowers to native AMO/LR-SC instructions. No gap.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Core atomics (CAS/load/store) | Full (C intrinsics) | Full (C intrinsics) | Full (C intrinsics) -- no gap |
| Quantum / min-alignment | Full (explicit constant) | Full (explicit constant) | Full (explicit constant) -- no gap |
| Adaptive spinlock hint | Full (hand-tuned `pause`) | Full (hand-tuned `isb`) | Missing (generic no-op, no Zihintpause use) |
| VA-width detection (LG_VADDR) | Full (hand-tuned CPUID probe) | Full (hand-tuned constant) | Scalar (defaults to 64-bit, disables rtree compact-leaf optimization) |
| Canonical-pointer decode (rtree) | Scalar (shares generic branch, correctly) | Full (hand-tuned zero-ext branch) | Scalar (generic sign-ext branch, architecturally correct for RISC-V) |
| Legacy `__sync` fence fallback | Full (hand-tuned) | Scalar (generic) | Scalar (generic, rarely compiled in) |
| USDT tracing (experimental, opt-in, off by default) | Full | Full | Missing (explicit build error if forced) |
| Upstream CI verification | Yes | Yes | Missing |

riscv64 is not a stub: it builds and runs as a first-class C target because jemalloc's core allocator logic (size classes, radix tree, bins, atomics) is architecture-generic C with no riscv64-specific blocker. But it is the least-tuned of the three architectures: 1 arch-specific file versus 5 each for amd64 and arm64, and it silently falls through the generic default case in the two `configure.ac` dispatch tables (CPU spin-wait, VA-width) that give amd64 and arm64 hand-written optimizations.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autotools (`autoconf`/`configure`/`make`) exclusively. No `CMakeLists.txt`, no `setup.py`, no `go.mod`, no `Cargo.toml`, no `package.json`, no Dockerfiles anywhere in the repository (confirmed both by local inspection and by `mcp__github__search_code` returning 0 hits for any `.cmake`/`CMakeLists.txt`/`Dockerfile` path).

**Native build on riscv64:**
```bash
./autogen.sh
make
make install
```
No architecture-specific flags required. `configure` auto-detects `LG_QUANTUM=4` via the `quantum.h` preprocessor guard and page size via `sysconf(_SC_PAGESIZE)` at runtime.

**Cross-compilation from x86_64 to riscv64:** No official documentation exists anywhere in the repository -- no `BUILDING.md`, no `docs/cross-compilation.md`, no riscv64-specific section in `INSTALL.md`. Issue #2399 (open since 2023-03-21) is the direct evidence of this gap. `INSTALL.md` documents three flags as generically "useful when cross-compiling" (`--with-lg-page`, `--with-lg-hugepage`, `--with-lg-vaddr`), but none are riscv64-specific and jemalloc adds nothing on top of standard autoconf `--host=` handling. The inferred command, based on `configure.ac` analysis rather than any upstream recipe:
```bash
./autogen.sh
CC=riscv64-linux-gnu-gcc CXX=riscv64-linux-gnu-g++ \
  ./configure --host=riscv64-unknown-linux-gnu --build=$(./build-aux/config.guess) \
  --with-lg-page=12 --with-lg-vaddr=39
make
make install DESTDIR=/path/to/sysroot
```
`--with-lg-page` is required because the page-size runtime probe cannot execute under cross-compilation. `--with-lg-vaddr` is required because the generic fallback resolves to 64, which is incorrect for Sv39 (use 48 for Sv48 targets); without it the radix-tree compact-leaf optimization stays disabled and huge-page pointer arithmetic may be affected [NEEDS VERIFICATION -- no reported failure from this specific scenario was found in upstream issues].

**Test suite under cross-compilation (inferred, not documented upstream):**
```bash
JEMALLOC_TEST_PREFIX="qemu-riscv64-static -L /usr/riscv64-linux-gnu" make check
```

**Compiler requirements:** No documented minimum version, riscv64-specific or otherwise. `configure.ac` feature-probes rather than version-pins: it first checks for C11 `<stdatomic.h>` atomics (`JEMALLOC_C11_ATOMICS`), then falls back to GCC/Clang `__atomic_*` builtins, then to `__sync` builtins. Any riscv64 toolchain with working C11 atomics or `__atomic` builtins suffices (roughly GCC >= 4.9 / Clang >= 3.5 generation, universal on real riscv64 toolchains). Upstream CI itself uses `ubuntu-24.04` (GCC 13, Clang 18), but only for amd64 and arm64.

**Known build issues:**
- The `riscv64gc` triple was reportedly not recognized by `config.sub`/`config.guess` prior to some fix (issue #2323), but no commit resolving this was found in jemalloc's history (see Section 2 discrepancy).
- Issue #2323 also reports a `-Werror=use-after-free` compiler error in `test/integration/overflow.c` on riscv64gc under GCC (pointer reuse after `realloc()` trips a newer GCC diagnostic treated as fatal under `-Werror`). No fix commit for this was found either; it may still reproduce with current GCC versions.
- Issue #1401 (riscv64 FTBFS, `undefined reference to '__atomic_compare_exchange_1'`) is resolved: the `-pthread` linkage fix in PR #1402 auto-links `-latomic`, confirmed by commit history and the current `configure.ac` content.

**QEMU:** No riscv64-specific QEMU usage exists anywhere in jemalloc. The only QEMU-related content in the repository is a generic (architecture-agnostic) runtime check in `include/jemalloc/internal/os/linux/overcommit.h` guarding against a QEMU `madvise(MADV_DONTNEED)` zero-page bug, and one historical `ChangeLog` entry. No `-DUSE_QEMU` build flag or riscv64 QEMU CI leg exists.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:** None that prevent correct operation. jemalloc builds, links, and runs on riscv64, and Debian/Ubuntu ship it without downstream patches.

**Performance gaps:**
- CPU spin-wait: riscv64 uses a volatile no-op rather than a hardware pause/yield hint, unlike amd64 (`pause`) and arm64 (`isb`). Under high thread contention on lock-heavy allocation patterns, this forfeits a CPU power/speculation-pressure benefit that Zihintpause's `pause` instruction could provide. No performance measurement of this gap's real-world impact was found in any source.
- Sub-word atomics: 8-bit and 16-bit CAS operations route through libatomic software emulation on riscv64 (native only on amd64/arm64), because the RISC-V A extension covers only 32-bit and 64-bit LR/SC and AMO instructions. The magnitude of this delta is unquantified; no benchmark data comparing libatomic-emulated vs. native sub-word atomics on riscv64 was found in any source.
- VA-width fallback disables the `RTREE_LEAF_COMPACT` radix-tree optimization on riscv64 (see Section 4).

**Security hardening gaps:** Data not available: no search was performed specifically for CFI, stack-clash protection, or other hardening-flag parity between riscv64 and amd64/arm64 in jemalloc's build system.

**NaN / floating-point semantics:** Not applicable. jemalloc is a memory allocator with no floating-point code paths. No NaN or floating-point correctness issue, riscv64-specific or otherwise, was found in the issue tracker (explicit searches for "riscv nan floating" returned only the same three riscv64 issues already covered in Section 2, none of which mention NaN or floating point).

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Correct minimum alignment | Yes | Yes | Yes |
| CPU spin-wait (hardware hint) | Yes (`pause`) | Yes (`isb`) | No (no-op) |
| Native sub-word atomics | Yes | Yes | No (libatomic) |
| Heap profiling (`--enable-prof`) | Yes | Yes | Yes |
| Background threads | Yes | Yes | Yes |
| Huge page support | Yes | Yes | Yes |
| Statistics | Yes | Yes | Yes |
| C++ operator new/delete | Yes | Yes | Yes |
| Cross-compilation documented | Implicit (generic autotools) | Implicit (generic autotools) | No |
| Upstream CI coverage | Yes | Yes | No |

## 7. CI/CD Infrastructure

All 7 `.github/workflows/*` files plus `.travis.yml` were fetched and checked verbatim (not via search snippets). Zero occurrences of "riscv" (case-insensitive) in any of them. No `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, or `.circleci/config.yml` exist anywhere in the repository.

| File | `runs-on:` | riscv64? |
|---|---|---|
| `linux-ci.yml` | `ubuntu-24.04`, `ubuntu-24.04-arm` | No |
| `freebsd-ci.yml` | `ubuntu-latest` (runs FreeBSD via `vmactions/freebsd-vm`) | No |
| `illumos-ci.yml` | `ubuntu-latest` (runs OmniOS via `vmactions/omnios-vm`) | No |
| `macos-ci.yml` | `macos-15-intel`, `macos-15` | No |
| `windows-ci.yml` | `windows-latest` | No |
| `check_formatting.yaml` | `ubuntu-latest` | No |
| `static_analysis.yaml` | `ubuntu-latest` | No |
| `.travis.yml` | `amd64`, `arm64` architectures only | No |

`linux-ci.yml` (27 KB, the largest workflow) runs two jobs: `test-linux` on `ubuntu-24.04` with a matrix covering GCC/Clang, `-m32` (32-bit x86), and roughly 80 configure-flag combinations; `test-linux-arm64` on the native `ubuntu-24.04-arm` runner with GCC/Clang and configure variants. No riscv64 runner, no QEMU cross-arch emulation, no riscv64 cross-compilation leg exists in either job.

The repo-wide code-search index confirms the only "riscv" hits in the entire repository are the 3 non-CI files already covered in Sections 2 and 4 (`quantum.h`, `build-aux/config.sub`, `build-aux/config.guess`).

**RISE CI:** No RISE Project involvement in jemalloc CI was found. The RISE blog sitemap (35 posts, 2024-05 through 2026-09-28) was checked in full, including every post most likely to touch memory allocators (PyTorch on riscv64, CPython, Go, OpenJDK, V8, the RISC-V Optimization Guide, IREE/YOLOv8 benchmarking) -- none mention jemalloc. The RISE GitHub org (`riseproject-dev`, ~52 repos: `sw-ecosystem`, `python-wheels`, `board-farm`, `pytorch-ci`, `riscv-runner`, `system-libraries-wg`, etc.) has no jemalloc-named repository; `search_repositories` for `jemalloc org:riseproject-dev` returns 0 results, and `system-libraries-wg`'s README and issue tracker have no jemalloc mention.

One indirect touchpoint exists: `riseproject-dev/python-wheels` PR #2413 ("tabmat: add build-tabmat.yml for riscv64 wheel build", merged 2026-09-28) adds a riscv64 wheel build for the Python package `tabmat`, whose own build process compiles jemalloc from source as a build dependency (inherited from tabmat's upstream `pyproject.toml`, alongside xsimd). This is RISE building a package that happens to bundle jemalloc, not RISE-authored jemalloc porting work; it was not possible to confirm whether this build actually executes on RISE's bare-metal riscv64 runners, since GitHub MCP access in this research session was restricted to `riseproject-dev/sw-ecosystem` only.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI runner | `ubuntu-24.04` | `ubuntu-24.04-arm` | None |
| QEMU cross-test | No | No | No |
| CI covers configure variants | Yes (~80) | Yes (subset) | No |
| Release-blocking CI | Yes | Yes | No |
| RISE-funded CI runner | No | No | No |

## 8. Distribution and Release Status

**Upstream releases:** jemalloc ships source tarballs only, for every architecture including amd64 and arm64. Direct inspection of GitHub's `expanded_assets` endpoint for release 5.4.0 shows exactly 3 assets: `jemalloc-5.4.0.tar.bz2` (source tarball) plus GitHub's auto-generated `5.4.0.zip`/`5.4.0.tar.gz` source archives -- no compiled binary of any kind. The same 3-asset, source-only pattern holds for 5.3.0 and 5.3.1. jemalloc upstream has never shipped prebuilt binaries via GitHub Releases for any platform.

**PyPI:** No package named `jemalloc` exists on PyPI (`https://pypi.org/pypi/jemalloc/json` returns HTTP 404). The RISE GitLab wheel-builder PyPI mirror (`gitlab.com/api/v4/projects/56254198/packages/pypi/simple/jemalloc/`) redirects (HTTP 302) to the same nonexistent PyPI page. Not applicable to jemalloc as a packaging channel.

**Debian sid:** `libjemalloc2` version 5.3.1-2, status "Installed" for riscv64, built on `rv-osuosl-03`. No build failures on riscv64 (only on hurd-amd64/hurd-i386, an unrelated `PATH_MAX` issue). Source: [buildd.debian.org](https://buildd.debian.org/status/package.php?p=jemalloc).

**Ubuntu 24.04 Noble (LTS):** `libjemalloc2` 5.3.0-2build1 available for riscv64 alongside amd64, arm64, armhf, i386, ppc64el, s390x.

**Ubuntu 26.04 Resolute:** Directly confirmed via Launchpad (Ubuntu's own build infrastructure): source package `jemalloc 5.3.0-4` builds `libjemalloc2`, `libjemalloc-dev`, and `libjemalloc2-dbgsym` for amd64, amd64v3, arm64, armhf, i386, ppc64el, **riscv64**, and s390x. `packages.ubuntu.com`'s own search UI independently listed 6 matching packages for resolute with riscv64 in their architecture lists, including `libjemalloc-dev`, `libjemalloc2`, and three Rust binding packages (`librust-jemalloc-sys-dev`, `librust-tikv-jemalloc-ctl-dev`, `librust-tikv-jemalloc-sys-dev`). This corrects the Noble-era uncertainty about `libjemalloc-dev` riscv64 availability: by 26.04 it is confirmed present.

**Arch Linux riscv64:** Inconclusive. Official `archlinux.org` (x86_64 only) lists `jemalloc 1:5.4.0-1` in `[extra]`, but Arch's official repos do not target riscv64 (that is the purpose of the separate, unofficial archriscv port). The archriscv.felixc.at package search could not be queried (no server-rendered results, no discoverable JSON API, guessed direct package path 404'd) -- this channel should not be cited either way.

**Fedora/Koji, openSUSE:** Data not available: infrastructure returned Anubis/403 responses during research. Separately, `openkoji.iscas.ac.cn` was found to list a built RPM `jemalloc-5.3.0-7.fc41.riscv64`, confirming a Fedora/RISC-V build exists, though no performance or build-log detail was retrievable.

**User action to obtain a working binary:** On Debian sid, Ubuntu 24.04, or Ubuntu 26.04, `apt install libjemalloc2` (and `libjemalloc-dev` on 26.04+) produces a working riscv64 binary with no additional steps. On other distributions, build from the 5.4.0 source tarball using the cross-compilation flags in Section 5.

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| GCC (build-dependency, critical) | Toolchain; also provides `libatomic` (sub-word atomic emulation) and `libgcc_s` (`_Unwind_Backtrace` for optional profiling) | Yes | Yes | All major distros | None. `-latomic` auto-linked via `-pthread` since PR #1402 |
| GCC (runtime-dependency, critical) | `libatomic` at runtime for 8/16-bit atomic CAS on riscv64 (RISC-V A extension covers only 32/64-bit LR/SC/AMO) | Yes | Yes | All major distros | None; same fix as above |
| glibc (runtime-dependency, critical) | pthreads (TLS, mutexes, background threads), libm (`log(3)` for profiling), libdl (`dlsym()` for lazy-lock detection) | Yes | Yes | Debian sid and Ubuntu Noble/Resolute riscv64 | None. See `project-reports/glibc.md` |
| libunwind (runtime-dependency, optional) | Backtrace support for heap profiling (`--enable-prof-libunwind` only) | Yes | Partial | Debian sid v1.8.1; Ubuntu Noble v1.6.2 (version-lagged) | C++ exception unwinding is flagged unreliable on riscv64 upstream (open libunwind PRs #1032/#1035), but jemalloc only uses libunwind for backtrace capture, not exception handling, so this does not affect jemalloc's use case. See `project-reports/libunwind.md` |
| autoconf (build-dependency, optional) | Regenerates `configure` from `configure.ac` (only needed when running `./autogen.sh` from a fresh checkout rather than a release tarball with pre-generated `configure`) | Yes (generic autotools, not riscv64-specific) | Not applicable | Available all major distros | None found |
| QEMU (test-dependency, optional) | User-mode emulation (`qemu-riscv64-static`) needed to run `make check` for cross-compiled riscv64 builds on a non-riscv64 host | Yes (package available) | Not exercised by jemalloc's own CI, which has no riscv64 job at all (Section 7) | Available all major distros | None found for QEMU itself; jemalloc simply does not use it in any CI job today |

Transitive, through the optional libunwind dependency: **xz (liblzma)** (decompresses LZMA `.gnu_debugdata` sections when `--enable-minidebuginfo` is set) builds cleanly on riscv64 in Debian sid (5.8.3-1) with no riscv64 runner in xz's own upstream CI; **zlib** (same role for zlib-format `.gnu_debugdata`) likewise builds cleanly on riscv64 in Debian sid (1.3.2-3) with no riscv64 coverage in zlib's own CI. Neither introduces a blocking issue for jemalloc, since both are only reached via the already-optional libunwind path.

No JIT backend, SIMD/numerics library, crypto library, compression library, or other memory allocator is a dependency of jemalloc -- jemalloc is itself the allocator, and its full dependency surface is the basic libc/toolchain runtime pieces and one optional debugging library listed above.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2399](https://github.com/jemalloc/jemalloc/issues/2399) | Does jemalloc support cross build for RISCV64 target on Linux? | Open, no maintainer response | Low (documentation/support gap, no correctness impact) | Opened 2023-03-21, last activity 2024-06-16 (two community +1s, one explicitly Rust/`jemalloc-sys`-related). Zero maintainer engagement in over 3 years. |

**Closed RISC-V issues (historical record):**

| ID | Title | Status | Resolution |
|---|---|---|---|
| [#1401](https://github.com/jemalloc/jemalloc/issues/1401) | riscv64 FTBFS due to atomics | Closed 2019-01-09 | Fixed by [PR #1402](https://github.com/jemalloc/jemalloc/pull/1402) (`-pthread` flag, first released in 5.2.0) |
| [#2323](https://github.com/jemalloc/jemalloc/issues/2323) | Add support for riscv64gc | Closed 2023-11-02 as "completed" | **No resolving commit found.** `git log --all --grep="riscv64gc" -i` across full tagged history: 0 matches. `search_pull_requests` for `riscv64gc repo:jemalloc/jemalloc`: 0 results. [NEEDS VERIFICATION -- closed without a traceable in-repo fix; possibly resolved only in downstream Debian packaging] |

**Correctness bugs:** None open. No RISC-V-specific correctness (including NaN/floating-point) bug was found in the issue tracker.

**External discrepancy worth flagging:** a 2026-08-14 Sandia/LANL/HPE HPC paper (Henriksen et al., arXiv:2608.14799v1, Section II-A) states plainly: *"Jemalloc, Chapel's preferred parallel allocation backend, does not support RISC-V and was not used in these experiments."* The paper used mimalloc instead for its RISC-V benchmarks (MILK-V Pioneer/SG2042, HiFive Premier P550, HiFive Unmatched Rev B). This directly contradicts issue #2323 having been closed as "completed" in November 2023, and is consistent with the finding above that #2323's closure has no traceable upstream fix. Either jemalloc's riscv64 support regressed or was never fully merged, or the Chapel team's characterization is outdated/overstated -- this discrepancy could not be resolved with available sources and should be treated as unresolved.

**GCC 16 compatibility:** Issue #2917 (opened May 2026, not RISC-V-specific) seeks a jemalloc tag that builds cleanly with GCC 16. Since riscv64 distro toolchains track GCC closely, this could affect riscv64 builds once GCC 16 becomes a distro default, though no riscv64-specific report of this exists yet.

## 12. Objections and Upstream Blockers

**Stated objections:** None on record. No maintainer has objected to RISC-V support or expressed intent to remove existing RISC-V code.

**Technical blockers:** None blocking functional operation. The performance gaps identified in Sections 4 and 6 (missing CPU spin-wait hint, sub-word atomic software emulation, disabled rtree compact-leaf optimization) are known architectural characteristics, not bugs. The libatomic dependency for sub-word atomics is an ISA limitation (RISC-V A extension covers only 32/64-bit LR/SC/AMO) with no pure-software workaround available within jemalloc short of restructuring internal metadata to avoid sub-word atomics entirely.

**Organizational blockers:** The upstream maintainers (overwhelmingly Meta-employed engineers, per Section 1) have shown no proactive interest in RISC-V -- every merged RISC-V change originated from an external, non-Meta contributor responding to a concrete build failure, not from any Meta-driven roadmap item. Issue #2399, the one open question about official cross-build support, has zero maintainer responses across more than three years. jemalloc is not a RISE member project and no RISE funding, blog coverage, or dedicated repository addresses it (Section 1, Section 7).

**Acceptance probability for upstreaming patches:** High for correctness/build fixes -- the track record of PR #1081 (reviewed and merged same day) and PR #1402 (reviewed and merged within a day, ~6 days from issue to fix) shows fast, uncontested review for concrete bug fixes. Lower for pure performance enhancements (e.g., the CPU spin-wait fix) absent a demonstrated Meta production need, though nothing in the historical record shows active resistance to such patches either -- this is an inferred pattern from response behavior, not a stated maintainer position.

## 13. Readiness Assessment

- **Color:** orange (optimization-absent)
- **Release provider:** distro
- **Optimization level:** absent

jemalloc has zero riscv64 CI: all 7 GitHub Actions workflow files plus `.travis.yml` were checked directly and contain no "riscv" mentions anywhere ([jemalloc/jemalloc/.github/workflows](https://github.com/jemalloc/jemalloc/tree/dev/.github/workflows)). On their own, Debian sid and Ubuntu 24.04/26.04 building and shipping `libjemalloc2` for riscv64 from unmodified upstream source ([buildd.debian.org](https://buildd.debian.org/status/package.php?p=jemalloc)) would earn a yellow "clean-distro-build" floor. However, jemalloc is an optimization-purpose project: a memory allocator whose entire value proposition is outperforming the system allocator. It has essentially no RISC-V-specific optimization code -- the only riscv64-aware line in the source is the `LG_QUANTUM 4` alignment macro in `include/jemalloc/internal/quantum.h`, set to the same value already used by amd64/arm64 (not a tuning win), with no Zihintpause CPU-spinwait hint and no riscv64-tuned hot paths anywhere in the codebase. Per the optimization modifier, "absent" RISC-V-specific optimization caps the grade at orange, pulling the yellow CI-floor grade down.

**Pending work that could change the grade:** issue #2399 (cross-build support question, open since 2023-03-21) remains unanswered by maintainers. No RISE Project involvement, funding, or blog coverage of jemalloc was found anywhere in this research. A concrete, low-effort next step would be adding a riscv64 Zihintpause `pause` instruction to the `configure.ac` `CPU_SPINWAIT` dispatch (currently a no-op on riscv64 versus hand-tuned asm on amd64/arm64) plus a riscv64 QEMU CI job; this alone would not move the color past yellow, since it addresses only a secondary hot path (adaptive spinlocks under contention), not the allocator's primary differentiating allocation/free paths.

## 14. Investment Analysis

RISE Project has no involvement in jemalloc: no dedicated repository, no blog coverage, no funded porting work, and no entry in `system-libraries-wg` were found (Section 1, Section 7). The only touchpoint is incidental -- RISE's `python-wheels` CI builds the unrelated `tabmat` package, which happens to compile jemalloc from source as one of its own build dependencies. This is not jemalloc-specific work and covers none of the gaps below.

### 14.1 Functional Enablement

The library is functionally complete on riscv64 today; no functional enablement work is required for correctness. The remaining gap is entirely documentation: write and submit an upstream patch adding a cross-compilation section to `INSTALL.md` documenting `--with-lg-page=12 --with-lg-vaddr=39` (or 48 for Sv48) for riscv64 targets. This resolves issue #2399 and removes the recurring source of community confusion evidenced by its two independent +1s.

### 14.2 Performance Optimization

This is the section that determines the orange-to-yellow-or-higher transition, per the readiness justification in Section 13.

**CPU spinwait (Zihintpause `pause` instruction):** add a `riscv64` case to the `configure.ac` `CPU_SPINWAIT` dispatch block, analogous to the existing x86_64 (`pause`) and aarch64 (`isb`) cases, emitting the ratified Zihintpause `pause` encoding. This is a small, well-scoped `configure.ac` change plus a build-time test. Impact: reduced CPU power draw and potentially improved throughput under high allocator lock contention. Per the readiness justification, this alone does not clear the yellow bar because it only touches a secondary hot path (adaptive spinlocks), not jemalloc's primary allocation/free logic -- but it is the lowest-effort, highest-signal next step available.

**VA-width / rtree compact-leaf optimization:** add an explicit `riscv64` case to the `configure.ac` `LG_VADDR` dispatch (currently falls to the generic 64-bit default), set per Sv39/Sv48 as appropriate, to re-enable the `RTREE_LEAF_COMPACT` optimization that amd64 and arm64 already receive. Requires care since actual riscv64 Linux deployments may use Sv39, Sv48, or Sv57 depending on kernel/hardware configuration.

**Sub-word atomics:** no software workaround is possible within jemalloc without restructuring internal metadata to avoid 8/16-bit atomic operations; this is an ISA limitation (RISC-V A extension), not a jemalloc defect. Any such refactoring would be substantial and is not recommended without benchmark data first quantifying whether the libatomic-emulation delta is measurable in practice.

### 14.3 CI/CD Infrastructure

Add a riscv64 cross-compilation job to `linux-ci.yml` using QEMU user-mode emulation: install `gcc-riscv64-linux-gnu`, `qemu-user-static`, and `binfmt-misc`; build with `--host=riscv64-linux-gnu --with-lg-page=12 --with-lg-vaddr=39`; run `make check` under `JEMALLOC_TEST_PREFIX="qemu-riscv64-static -L /usr/riscv64-linux-gnu"`. This is the minimum investment needed to prevent silent regressions on riscv64, since none of the existing 7 workflows provide any riscv64 coverage today. A hardware riscv64 runner (e.g., RISE-provided bare-metal CI, which RISE already operates for other projects per Section 7) would give more accurate performance signal than QEMU but is not required for correctness coverage.

### 14.4 Ecosystem Enablement

Not applicable. jemalloc has no dependent package ecosystem of its own requiring separate riscv64 enablement -- it is a system library consumed directly by linking, not a package-manager ecosystem with transitive consumers that each need individual riscv64 builds (unlike, e.g., a language package index). Section 10 is omitted per the report format rules.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Document riscv64 cross-compilation flags (`--with-lg-page`, `--with-lg-vaddr`) in `INSTALL.md`; submit upstream; resolves issue #2399 | 0.5 | Any contributor | High |
| Performance | Add Zihintpause `pause` instruction to the `configure.ac` `CPU_SPINWAIT` dispatch for riscv64 | 0.5 | Contributor with riscv64 toolchain access | High |
| Performance | Add explicit riscv64 `LG_VADDR` case (Sv39/Sv48) to re-enable `RTREE_LEAF_COMPACT` | 1 | Contributor with riscv64 toolchain access | Medium |
| CI/CD | Add riscv64 QEMU cross-compilation and `make check` job to `linux-ci.yml` | 1 | Any contributor | Medium |
| Investigation | Resolve the #2323 "closed without traceable fix" discrepancy and the jemalloc-vs-Chapel-paper "does not support RISC-V" contradiction (Section 11) before committing further investment | 0.5 | Any contributor | High |
| Performance | Benchmark sub-word atomic performance gap (libatomic emulation vs. native) on riscv64 vs. amd64/arm64 to quantify or dismiss the concern | 1 | Performance engineer | Low |

Total estimated investment to clear the immediate documentation and CI gaps and attempt to move past the orange grade (excluding sub-word atomic refactoring, not recommended without prior benchmark justification): approximately 4.5 person-weeks. Per the readiness justification, the spinwait and VA-width fixes alone are not guaranteed to move the grade past yellow, since they address secondary hot paths rather than jemalloc's primary differentiating allocation/free logic.

## 15. References

- [jemalloc GitHub repository](https://github.com/jemalloc/jemalloc)
- [jemalloc project homepage](https://jemalloc.net/)
- [PR #1081: Correct the spelling of __riscv](https://github.com/jemalloc/jemalloc/pull/1081)
- [PR #1402: Replace -lpthread with -pthread](https://github.com/jemalloc/jemalloc/pull/1402)
- [Commit 749caf1: Also use __riscv to detect builds for RISC-V CPUs](https://github.com/jemalloc/jemalloc/commit/749caf14ae73a9ab1c48e538a8af09addbb35ee7)
- [Commit 4711910: Replace -lpthread with -pthread](https://github.com/jemalloc/jemalloc/commit/471191075d6a88eb1364fb5f332237eb3d512872)
- [Issue #1401: riscv64 FTBFS due to atomics](https://github.com/jemalloc/jemalloc/issues/1401)
- [Issue #2323: Add support for riscv64gc](https://github.com/jemalloc/jemalloc/issues/2323)
- [Issue #2399: Does jemalloc support cross build for RISCV64 target on Linux?](https://github.com/jemalloc/jemalloc/issues/2399)
- [jemalloc CI workflows directory](https://github.com/jemalloc/jemalloc/tree/dev/.github/workflows)
- [Debian buildd tracker: jemalloc](https://buildd.debian.org/status/package.php?p=jemalloc)
- [jemalloc GitHub releases](https://github.com/jemalloc/jemalloc/releases)
- [RISE Project blog](https://riseproject.dev/blog)
- [riseproject-dev/python-wheels PR #2413: tabmat riscv64 wheel build](https://github.com/riseproject-dev/python-wheels/pull/2413)
- [Henriksen et al., Chapel/Qthreads RISC-V HPC study, arXiv:2608.14799v1](https://arxiv.org/pdf/2608.14799)
- [RISE Project members](https://riseproject.dev/members)