---
title: libffi
parent: Project Reports
color: blue
dependencies:
  - name: GCC
    relation: build-dependency
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
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: DejaGNU
    relation: test-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="libffi" %}

# libffi

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for libffi<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libffi is a portable C library that provides a programmatic interface for calling compiled functions whose argument types and counts are not known at compile time. It implements the calling convention (ABI) for each supported platform in hand-written assembly and exposes closures, machine-code trampolines that let C code be called from foreign-function interfaces as if they were native function pointers. It is a foundational dependency for CPython's `ctypes` module, Ruby's `fiddle`, GHC's foreign function interface, LuaJIT bindings, and Node.js's native FFI addon.

**Governance:** libffi is run under a BDFL model with no formal foundation, governing board, or MAINTAINERS/CODEOWNERS file (confirmed by a 404 on both files at `raw.githubusercontent.com`). Anthony Green (Red Hat) created the project and, as of 2026-09-30, holds 1,169 commits, over twelve times the second-highest contributor, Richard Henderson (Linaro, email `richard.henderson@linaro.org`), at 95 commits. There is no documented tier/maturity policy. Contributions are accepted via GitHub pull request and Anthony Green merges them directly, frequently with no recorded review thread (PR [#933](https://github.com/libffi/libffi/pull/933) and PR [#972](https://github.com/libffi/libffi/pull/972) were both merged by atgreen with no visible code review).

**License:** MIT variant. GitHub's license API returns "Other / NOASSERTION" because the license text is not a standard SPDX-identified form. sourceware.org describes libffi only as "Free Software" under "a very liberal license," with no further detail.

**RISE involvement:** None found. A sitemap-based enumeration of all 35 posts published on [riseproject.dev/blog](https://riseproject.dev/blog) (May 2024 through September 2026), a site search for "libffi" (zero results), a full-text read of the five most plausible candidate posts, and an org-wide GitHub code/repo search across `riseproject-dev`'s 26 public repositories all return zero libffi-specific content. RISE's current membership is 8 Premier Members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent) and 12 General Members (Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE). Anthony Green's employer (Red Hat) and, per a commit-email affiliation change discussed below, Peter Bergner's employer (now apparently Tenstorrent) are both RISE Premier Members, but neither affiliation has produced RISE-tracked libffi work. libffi appears in the `riseproject-dev` org only as (a) a plain system package in the RISE CI runner's Docker image, (b) a build dependency of the `cffi` Python wheel in RISE's wheel-builder pipeline, and (c) a passing mention in a compilers-and-toolchains working-group meeting note about Peter Bergner's (then-IBM) static-trampoline contribution, none of which constitute RISE funding or ownership.

**Community culture on new ports:** Permissive in practice, with no formal objection process. Every riscv64 patch reviewed for this report was merged by Anthony Green with no recorded pushback.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| ~2015 | Initial RISC-V port written by Michael Knyszek and Andrew Waterman at UC Berkeley | [PR #281](https://github.com/libffi/libffi/pull/281) |
| 2016-09-09 | PR #281 submitted upstream by Stef O'Rear, a cleaned rebase of the Berkeley work | [PR #281](https://github.com/libffi/libffi/pull/281) |
| 2018-03-11 | PR #281 merged by Anthony Green, commit `3840d49a`, tested rv32imac/ilp32, rv32g/ilp32d, rv64imac/lp64, rv64g/lp64d under QEMU | [commit 3840d49](https://github.com/libffi/libffi/commit/3840d49aaa831d649b1597518a2903dfed0d57f3) |
| 2018-08-09 | Go closure support added for RISC-V, merged 2018-08-11 (PR #445) | [PR #445](https://github.com/libffi/libffi/pull/445) |
| 2019-11-23 | libffi 3.3 released, first release containing RISC-V support | GitHub releases |
| 2022-02-13 | Small-integer return-type widening added, commit `aa3fce0` (PR #680, andreas-schwab), intended to resolve issue #466 | [PR #680](https://github.com/libffi/libffi/pull/680) |
| 2022-05-24 | FreeBSD riscv fix: `__clear_cache` calling `abort()` under Clang/compiler-rt on non-x86 FreeBSD (PR #708, Kevin Bowling) | [PR #708](https://github.com/libffi/libffi/pull/708) |
| 2022-10-10 | Caller-side struct copy for large structs on riscv64, PR #738 (andreas-schwab), merged into v3.4.4 | [PR #738](https://github.com/libffi/libffi/pull/738) |
| 2025-08-06 | Earlier duplicate static-trampoline submission (PR #932) closed same day in favor of PR #933 (Clang integrated-assembler issue with `%hi()`/`auipc`) | [PR #932](https://github.com/libffi/libffi/pull/932) |
| 2025-08-07 | Static trampoline (W^X) support for riscv32/riscv64 Linux merged, PR #933 (Peter Bergner, then at IBM), commit `c9b2a8a`, tested on QEMU and natively on a BananaPi riscv64 board | [PR #933](https://github.com/libffi/libffi/pull/933) |
| 2026-06-18 | Float marshal bug fixed for ABI_FLEN >= 64 (PR #972, Levi Zim/kxxt): floats were double-widened instead of NaN-boxed, found via Node.js RISC-V CI failures | [PR #972](https://github.com/libffi/libffi/pull/972) |
| 2026-06-20 | libffi v3.6.0 released, first release containing both PR #933 and PR #972 | GitHub tags/releases |
| 2026-07-08 / 2026-07-10 | v3.7.0 and v3.7.1 released | GitHub tags |
| 2026-08-08 | v3.8.0 released (current latest); `configure.ac` `AC_INIT` confirms `libffi 3.8.0` at HEAD | live clone, `/home/user/libffi/libffi/README.md`, `configure.ac` |
| 2026-09-29 | PR #1026 ("riscv: ignore return buffer for void calls") opened, still open and unmerged one day later | [PR #1026](https://github.com/libffi/libffi/pull/1026) |

The port is fully upstream; there is no fork or vendor tree carrying riscv64-specific patches outside the main repository. The original port's review-to-merge cycle was 19 months (Sep 2016 to Mar 2018); subsequent riscv64 fixes have merged within one to two days of submission. No master/umbrella tracking issue exists for the port: GitHub's `risc-v` label applies to only four issues (#466, #694, #777, #931), each a discrete bug or feature request rather than a meta-tracker.

Key contributors:

| Contributor | GitHub login | Affiliation | Role |
|-------------|---------------|-------------|------|
| Michael Knyszek | - | UC Berkeley | Original port author (~2015) |
| Andrew Waterman | - | UC Berkeley | Original port co-author |
| Stef O'Rear | sorear | - | Upstream submission (2016-2018) |
| Andreas Schwab | andreas-schwab | historically SUSE (`schwab@suse.de`), currently `schwab@linux-m68k.org`, no current corporate affiliation found | Integer widening, struct copy, FreeBSD fixes |
| Peter Bergner | peter-bergner | IBM at time of PR #933 (2025-08); a March 2026 commit uses email `bergner@tenstorrent.com`, indicating a move to Tenstorrent [NEEDS VERIFICATION - affiliation change inferred from a single commit email, not independently confirmed via a bio or announcement] | Static trampoline support |
| Levi Zim | kxxt | - | Float marshal NaN-boxing fix (PR #972) |
| HNO3Miracle | HNO3Miracle | - | Author of open PR #1026, states the patch was AI-assisted |

## 3. Upstream Support Tier

libffi has no documented formal tier policy. The README states that listed platforms are "basic configurations that have been tested at the time of release," with no stated acceptance criteria; contributors are asked to "send additional platform test results to libffi-discuss@sourceware.org." Both "RISC-V 32-bit / Linux / GCC" and "RISC-V 64-bit / Linux / GCC" appear in the README's supported-platforms table. Clang is not a listed/tested riscv64 configuration.

The practical indicator of tier status is CI inclusion: riscv64 sits in the `build-qemu` matrix of `.github/workflows/build.yml` alongside ppc64le, s390x, and armv7, as a first-class, release-blocking CI target that runs the full DejaGNU testsuite (`make check`) on every push and pull request to master, release tags, and via manual dispatch.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| In README supported platforms | Yes | Yes | Yes |
| CI on push/PR | Yes (native) | Yes (QEMU) | Yes (QEMU) |
| Native CI runner | Yes | No | No |
| Release-gating CI job | Yes | Yes | Yes (same matrix) |
| Official GitHub-release binary | Windows MSVC only | No | No |
| Static trampoline support | Yes | Yes | Yes, since v3.6.0 |
| Known open ABI bugs (repo `risc-v`/arch labels) | 0 | 1 (#694, shared) | 3 (#466, #694, #777) + 1 open PR (#1026) pending |

No native riscv64 hardware runner exists in CI; all riscv64 testing is QEMU user-mode/system emulation on an `ubuntu-latest` (x86_64) host. A material caveat on the "test: yes" classification: `build-in-container.sh` runs `make check ... || true`, so a failing test does not by itself fail the CI job shell step; pass/fail signal is only surfaced via a separate `rlgl` report evaluated afterward, not as a hard gate visible in the job's green/red status alone.

## 4. Technical Architecture and RISC-V-Specific Subsystems

libffi's architecture-specific work is limited to (1) C code marshaling arguments per the platform ABI and (2) hand-written assembly for call dispatch and closure trampolines. There is no JIT compiler, no SIMD, no crypto, and no GC barrier code anywhere in libffi.

The riscv64 implementation lives in `src/riscv/` and consists of four files (verified against a live clone at HEAD `bc553867367246d140cd156f060bd0409f57f157`, 2026-09-21):

| Path | Lines | Purpose |
|------|-------|---------|
| `src/riscv/ffi.c` | 571 (one inventory pass counted 572; treated as the same file, likely a counting-methodology difference) | Integer/float argument marshaling (`marshal_atom`/`unmarshal_atom`), struct flattening for float-in-struct register passing, NaN-boxing of narrow floats in wide FP registers, `ffi_call`/`ffi_call_go`, `ffi_prep_closure_loc`, `ffi_prep_go_closure`, `ffi_closure_inner`, `ffi_tramp_arch` |
| `src/riscv/sysv.S` | 317 | `ffi_call_asm`, `ffi_closure_asm`, `ffi_go_closure_asm`, `trampoline_code_table` (under `FFI_EXEC_STATIC_TRAMP`); `.option norvc` forces 32-bit instruction encoding for trampoline alignment |
| `src/riscv/ffitarget.h` | 65-70 across two inventory passes (minor discrepancy, not resolved) | ABI enum (`FFI_SYSV`), `ffi_arg`/`ffi_sarg` typedefs, `FFI_CLOSURES`, `FFI_GO_CLOSURES`, `FFI_TRAMPOLINE_SIZE 24`, `FFI_EXTRA_CIF_FIELDS`, `FFI_TARGET_HAS_INT128` |
| `src/riscv/internal.h` | 7 | Static-trampoline constants (`RISCV_TRAMP_MAP_SHIFT`, `RISCV_TRAMP_MAP_SIZE`, `RISCV_TRAMP_SIZE`) |

`configure.host` (lines 234-237) maps `riscv*-*` to `TARGET=RISCV; TARGETDIR=riscv; SOURCES="ffi.c sysv.S"`. One source set covers both RV32 and RV64 via `__SIZEOF_POINTER__ == 8` conditionals; there is no separate riscv64-only source file, and no `arch/riscv/` directory (the standard `src/<arch>/` layout is used, as for x86 and aarch64).

**ISA extensions used:** Base RVI only, plus the F/D hard-float ABI variants selected at compile time via `__riscv_float_abi_double`/`__riscv_float_abi_single`, falling back to soft-float otherwise. No RVV (vector, 0 matches for `vfloat32m1_t`/`rvv`), no Zba/Zbb/Zbc/Zbs (bit manipulation), no Zfh, no Zicsr. The assembly uses only `a0-a7`, `fa0-fa7`, `t1`, `t2`, `s0`, `ra`.

**Stub/placeholder scan:** A grep for `TODO|FIXME|XXX|stub|not implemented|unimplemented|#error` across `src/riscv/*` returns only the two standard include-guard `#error` lines, the same pattern found in `src/aarch64/*` (3 hits, same category) and `src/x86/*` (1 hit, same category). No placeholder code exists in the riscv64 backend.

**Code-level audit of the two headline open bugs (adversarial verification pass, direct source read):**
- Issue [#466](https://github.com/libffi/libffi/issues/466) (small-integer return widening): reading `ffi_call_int` shows an explicit `switch` over `SINT8/16/32` and `UINT8/16/32` that re-unmarshals through the correctly sized type before writing `rvalue`, consistent with commit `aa3fce0` having landed the fix. This is a genuine discrepancy between code state and issue-tracker state: the widening code appears structurally complete in current HEAD, but issue #466 was never closed and no commenter, including the original reporter, has confirmed the fix resolves their reproducer. Treat the GitHub-open status as an unresolved-triage signal rather than proof the bug is still present in the binary, but treat "confirmed fixed" as unverified.
- Issue [#694](https://github.com/libffi/libffi/issues/694) (large struct pass-by-reference): PR #738's caller-side copy is present in source and a downstream user (FantasqueX) confirmed it fixed `struct_by_value_big.c` on ArchLinux riscv64 at both -O0 and -O2. The issue itself remains open, shared with aarch64; whether an aarch64-only residual or a riscv64 edge case (e.g. non-power-of-two struct sizes) remains open is not established by any source reviewed.
- PR [#1026](https://github.com/libffi/libffi/pull/1026) (SIGSEGV on `FFI_TYPE_VOID` calls): tracing `ffi_call_int` -> `unmarshal()` for `FFI_TYPE_VOID` (size 0) did not reproduce a clear out-of-bounds write from static reading alone; the defect may be in a narrower sub-path (e.g. `ffi_call_go`) or may depend on interaction with a caller's pointer-provenance checks (as in the cited rust-lang/miri#5356) rather than a literal out-of-bounds write reachable via the traced path. The PR's existence, open/unmerged status, and author's own claim that it is untested on native riscv64 hardware are confirmed; the exact defect mechanism is [NEEDS VERIFICATION], resting on the single source of the PR author's description.

**Component comparison:**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Integer call ABI | Full, hand-tuned asm | Full | Full |
| Float/FP ABI (NaN-boxing) | N/A (x87/SSE) | Full | Full, since PR #972 / v3.6.0 |
| Large struct pass-by-ref copy | Full | Partial (#694 open) | Partial, PR #738 landed but #694 open |
| Closures | Full | Full | Full |
| Go closures | Full | Full | Full |
| Static trampolines (W^X) | Full | Full | Full, since PR #933 / v3.6.0 |
| Variadic function support | Full | Full | Full |
| Small integer return widening | Full | Full | Code-complete per audit (PR #680/aa3fce0), but issue #466 unconfirmed/unclosed |
| FreeBSD support | Full | Full | Full, PR #708 (2022) |
| musl cross-compilation | Full | Full | Broken, issue #777 open |
| Pending unmerged riscv-specific fix | None | None | PR #1026 (void-return SIGSEGV), open, AI-assisted, untested on native hardware |
| RVV / SIMD | N/A | N/A (NEON not used) | N/A, not applicable to libffi's design |

## 5. Build System, Cross-Compilation, and Toolchain

libffi uses GNU Autotools exclusively (`autogen.sh` -> `configure` -> `make`). There is no CMakeLists.txt, no `cmake/` directory, no CMake toolchain file for riscv64, and no `-DUSE_X=OFF`-style cache flags anywhere in the repository. The only build/architecture documentation is `README.md`; there is no `BUILDING.md`, `INSTALL`, or dedicated cross-compilation doc.

**Native build on riscv64:**

```
./autogen.sh   # only needed from a git checkout, not a release tarball
./configure
make
make check
sudo make install
```

**Cross-compile from x86_64 (Debian/Ubuntu):**

```
sudo apt-get install gcc-riscv64-linux-gnu g++-riscv64-linux-gnu qemu-user-static
./autogen.sh
./configure --host=riscv64-linux-gnu \
            CC=riscv64-linux-gnu-gcc \
            CXX=riscv64-linux-gnu-g++
make
export QEMU_LD_PREFIX=/usr/riscv64-linux-gnu
make check
```

**Reproducing the CI QEMU container build** (`.ci/Containerfile.debian`, full content, verified against a live clone):

```
FROM debian:trixie

RUN apt-get update \
 && apt-get install -y --no-install-recommends \
      dejagnu automake autoconf texinfo gcc g++ libtool make ca-certificates \
 && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 10000 builder \
 && useradd  -u 10000 -g 10000 -d /home/builder -s /usr/sbin/nologin builder \
 && mkdir -p /home/builder \
 && chown 10000:10000 /home/builder
USER 10000
```

The actual configure/make/check sequence, run natively inside the emulated riscv64 container (`.ci/build-in-container.sh`, full content):

```
#!/bin/bash
set -x
export QEMU_LD_PREFIX=/usr/${HOST}
export DEJAGNU=/opt/.ci/site.exp
cd /opt
./configure ${HOST+--host=$HOST --disable-shared}
make
make dist || true
BOARDSDIR=/opt/.ci make check RUNTESTFLAGS="-a $RUNTESTFLAGS" || true
```

**Toolchain requirements:**
- `configure.ac` requires only C99 compatibility; no minimum GCC/Clang version is stated anywhere in the project for any architecture.
- CI installs `gcc`/`g++` unpinned from Debian trixie's apt repository inside the riscv64 container. Based on Debian's release cadence, trixie (Debian 13) is expected to ship GCC 14 as its default `gcc` metapackage [NEEDS VERIFICATION - could not be confirmed via web search this session; search quota was exhausted before the query ran].
- Clang is not part of the riscv64 CI matrix. PR #933's author tested riscv32/riscv64 with both GCC and Clang manually (plus native BananaPi hardware with GCC), but Clang is not maintained by CI. The earlier duplicate static-trampoline attempt, PR #932, was abandoned specifically because of a Clang integrated-assembler issue with `%hi()`/`auipc`.

**Known build failure:** Issue [#777](https://github.com/libffi/libffi/issues/777), open since 2023-04-21: cross-compiling for `riscv64-unknown-linux-musl` with GCC 12.0.1 fails with `relocation truncated to fit: R_RISCV_HI20 against '.L4'` in `marshal_atom` (`ffi.c`). No maintainer response and no fix in `configure.host` as of current HEAD. This affects musl/embedded/RTOS targets specifically; it does not affect standard glibc-based riscv64 builds, and CI does not exercise musl at all (the only riscv64 CI container is `debian:trixie`, glibc-based), so this gap is invisible to the project's own test matrix.

**Configure flags relevant to riscv64:**

| Flag | Effect |
|------|--------|
| `--disable-exec-static-tramp` | Disables static trampolines; enabled by default on riscv64-linux since v3.6.0 |
| `--disable-shared` | Static library only; used in CI's riscv64 cross build |
| `--host=riscv64-linux-gnu` | Sets cross-compilation target |

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:**

1. Small integer return widening (issue [#466](https://github.com/libffi/libffi/issues/466), open since 2019-01-29, still open as of 2026-09-30). The documented contract requires widening to `ffi_arg` size for return types narrower than the system register; the reporter's reproducer returns `0xffffffff0000002a` instead of `0x2a`. Commit `aa3fce0` (2022-02-13, PR #680) is the presumed fix and a direct code audit (Section 4) confirms the widening logic is structurally present at current HEAD, but the issue was never closed and no confirmation trail exists linking the fix to the original report.
2. Large struct pass-by-reference semantics (issue [#694](https://github.com/libffi/libffi/issues/694), open since 2022-03-01, shared with aarch64). PR #738 (merged 2022-10-10) added the caller-side copy on riscv64 and a downstream user confirmed it fixed `struct_by_value_big.c` on ArchLinux riscv64; the tracking issue remains open. CPython's own `ctypes` carries an independent `CTYPES_PASS_BY_REF_HACK` workaround rather than relying solely on the upstream fix.
3. musl cross-compilation (issue [#777](https://github.com/libffi/libffi/issues/777), open since 2023-04-21, zero maintainer response in three-plus years). Affects embedded/RTOS targets; does not affect glibc builds.
4. A new, unmerged correctness fix, PR [#1026](https://github.com/libffi/libffi/pull/1026) (opened 2026-09-29), targets a SIGSEGV on `FFI_TYPE_VOID` calls triggered by callers (such as Rust's Miri, rust-lang/miri#5356) that pass a dangling non-null pointer for an empty return buffer. The author reports the full riscv64 DejaGNU suite passing (354/0) with the fix and states explicitly that it was developed with AI assistance and has not been retested on native riscv64 hardware.

**Float semantics gap (resolved in v3.6.0 only):** Prior to PR #972 (merged 2026-06-18, first released in v3.6.0 on 2026-06-20), `float` arguments were double-widened rather than NaN-boxed per the RISC-V psABI, verified in source via `marshal_float`/`unmarshal_float`'s `UINT64_C(0xffffffff00000000) | value.i` pattern. The bug was discovered externally via Node.js's RISC-V CI (`add_f32(1.25, 2.75)` returning the wrong value), not by libffi's own testsuite. Every currently distributed riscv64 package identified in Section 8 predates v3.6.0 and therefore still carries this bug.

**Security hardening:** Static trampoline support (PR #933, merged 2025-08-07, released in v3.6.0) enables closures to function under W^X (write-xor-execute) policies, mirroring the s390x/powerpc approach of jumping directly to `ffi_closure_asm` rather than allocating a fresh RW+RX trampoline per closure. Prior riscv64 releases required writable-and-executable pages simultaneously, which hardened kernels and some container runtimes block by default.

**Performance data:** Data not available: no benchmark numbers for libffi call-dispatch overhead on riscv64, whether against arm64 or in absolute terms, were found in GitHub issues/PRs, RISE blog content (all 35 posts checked), or general web search (WebSearch quota was exhausted before dedicated performance queries could run; a Bing/DuckDuckGo WebFetch substitute and GitHub code search for "libffi riscv64 benchmark" returned only Buildroot/Yocto config toggles, not measurements).

**Comparison table:**

| Capability | amd64 | arm64 | riscv64 |
|------------|-------|-------|---------|
| Small-int return widening | Full | Full | Code-complete, issue open/unconfirmed |
| Large-struct by-reference copy | Full | Partial (#694) | Partial, PR #738 landed, #694 open |
| musl cross-build | Full | Full | Broken (#777) |
| Float NaN-boxing correctness | N/A | Full | Full since v3.6.0 only |
| W^X / static trampolines | Full | Full | Full since v3.6.0 only |
| Published perf benchmarks | N/A | N/A | Data not available |

## 7. CI/CD Infrastructure

**Configuration source:** `.github/workflows/build.yml` (736 lines), the only workflow file (of five: `build.yml`, `emscripten.yml`, `label-new-issue.yaml`, `release.yml`, `tarball.yml`) that mentions riscv/riscv64 in any form; the reference appears only in the `build-qemu` job's matrix (lines 528-531). No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository.

**Triggers (apply to the whole workflow file, including this job):**

```
on:
  push:
    branches: [ master ]
    tags: [ 'v[0-9]*' ]
  pull_request:
    branches: [ master ]
  workflow_dispatch:
```

**The riscv64 job, `build-qemu` (matrix entry, in context):**

```
build-qemu:
    name: QEMU ${{ matrix.HOST }} ${{ matrix.label }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        include:
          - HOST: powerpc64le-unknown-linux-gnu
            ...
          - HOST: s390x-unknown-linux-gnu
            ...
          - HOST: riscv64-unknown-linux-gnu
            docker_arch: riscv64
            image: libffi-ci-riscv64
            containerfile: .ci/Containerfile.debian
          - HOST: arm-unknown-linux-gnueabihf
            ...
    steps:
      - uses: actions/checkout@v4
      - name: Set up QEMU (binfmt)
        uses: docker/setup-qemu-action@v3
      - name: Build foreign-arch container image
        run: docker build --platform linux/${{ matrix.docker_arch }} -f ${{ matrix.containerfile }} -t ${{ matrix.image }} .ci
      - name: Build and test under emulation
        env:
          HOST: ${{ matrix.HOST }}
          FOREIGN_IMAGE: ${{ matrix.image }}
        run: |
          ./.ci/install.sh
          ./.ci/build.sh
```

**Mechanism:** `runs-on: ubuntu-latest` is a standard x86_64 GitHub-hosted runner; there is no dedicated riscv64 hardware runner. `docker/setup-qemu-action@v3` registers QEMU binfmt handlers, then `docker build --platform linux/riscv64` builds a riscv64-native container image whose `gcc`/`g++` are themselves riscv64 binaries, transparently run under QEMU user-mode emulation by the kernel's binfmt_misc. `configure`, `make`, and `make check` (the full DejaGNU testsuite) all run natively inside that emulated container, not merely the final test binaries.

**Test-result caveat:** the container's `make check` step is invoked as `make check ... || true`, so a failing test does not by itself fail that shell step. Pass/fail is instead surfaced by a subsequent `rlgl` report-evaluation step (`rlgl e ... --policy=...`) that was confirmed to run and exit non-zero on regression, but whose policy content was not independently audited this session. Results are also published to [libffi.github.io](https://libffi.github.io/libffi/reports/).

**RISE runners:** None. No RISE-provided native riscv64 hardware runner is used by upstream libffi CI.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI exists | Yes | Yes | Yes |
| Trigger | push/PR/tag/dispatch | push/PR/tag/dispatch | push/PR/tag/dispatch |
| Runner type | Native (ubuntu-latest) | QEMU | QEMU |
| Testsuite runs | Yes (full DejaGNU) | Yes | Yes, but gated post-hoc via rlgl, not the shell exit code |
| Native hardware CI | Yes | No | No |
| Clang variant in matrix | Yes | Yes | No |
| musl variant in matrix | No | No | No (issue #777 therefore invisible to CI) |

The absence of a Clang/riscv64 CI variant is a real gap: PR #933 was contributor-tested with Clang on riscv64, but that configuration is not maintained by CI, and Clang assembler issues (`%hi()`/`auipc`) are what forced the abandonment of PR #932. Float ABI bugs such as PR #972 were discovered externally via Node.js's own CI, not by libffi's CI, suggesting the riscv64 test matrix does not exercise all float-argument call patterns that downstream consumers rely on.

## 8. Distribution and Release Status

**Upstream GitHub releases:** libffi's current latest release is **v3.8.0** (2026-08-08; tag history via `git ls-remote --tags` confirms v3.5.2, v3.6.0, v3.7.0, v3.7.1, v3.8.0 in sequence). The release asset list for v3.8.0 (fetched via GitHub's lazy-load `expanded_assets` endpoint) contains only:
- `libffi-3.8.0-arm64-msvc-binaries.zip`
- `libffi-3.8.0-x86-32bit-msvc-binaries.zip`
- `libffi-3.8.0-x86-64bit-msvc-binaries.zip`
- `libffi-3.8.0.tar.gz` and source code (zip/tar.gz)

No riscv64, or any Linux, binary asset is shipped in GitHub releases at all; only Windows MSVC binaries and source tarballs are provided, so Linux users of every architecture, not just riscv64, build from source or use a distro package. This is the basis for `release_provider: distro` rather than `upstream` (see Section 13).

**Distro packages (riscv64):**

| Distro | Package | Version | riscv64 status | Notes |
|--------|---------|---------|-----------------|-------|
| Ubuntu 26.04 (Resolute) | `libffi8`, `libffi-dev` | 3.5.2-4 | Confirmed built for `riscv64` at [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libffi&suite=resolute) (arch list: amd64 arm64 armhf i386 ppc64el riscv64 s390x) | Predates v3.6.0; lacks both the NaN-boxing float fix (PR #972) and static-trampoline support (PR #933) |
| Debian sid / trixie | `libffi8` | 3.5.2-4 (sid) reported in libffi's own readiness justification; existing distro tracking additionally notes trixie at 3.4.8-2 [carried over, not independently re-verified this pass] | Available | Same gap: predates v3.6.0 |
| Arch Linux RISC-V (archriscv) | `libffi` | 3.8.0-1 | Confirmed: `core/libffi-3.8.0-1-riscv64.pkg.tar.zst`, signed, present in the live repo tree at [archriscv.felixc.at](https://archriscv.felixc.at/repo/core/) (dated 2026-08-15), matching the current upstream tag | Most current riscv64 binary found in any channel; includes both the float fix and static trampolines |

Note: a second, unrelated package also named `libffi` (`extra/libffi-0.2.1-4-riscv64.pkg.tar.zst`) exists in the same Arch repo tree; its version numbering does not correspond to the C library and should not be conflated with it.

**Non-applicable channels:** `https://pypi.org/pypi/libffi/json` returns HTTP 404, there is no PyPI project named `libffi` (it is a C library, not a Python package; `cffi`, which does exist on PyPI, links against it). The RISE GitLab wheel builder's endpoint for `libffi` 302-redirects to the same non-existent PyPI page, consistent with no package existing to build wheels for.

**Bottom line for a riscv64 user:** the fastest path to a correct (post-v3.6.0) riscv64 binary is Arch Linux RISC-V's `core/libffi` package (3.8.0-1); Ubuntu 26.04 and Debian sid/trixie users get 3.5.2-4, which carries the pre-v3.6.0 float-marshaling and W^X gaps. Building from the v3.8.0 source tarball is the only way to get the latest fixes on Ubuntu/Debian today.

## 9. Dependencies

libffi has no external runtime dependency beyond the OS ABI layer. It bundles `dlmalloc` (updated to 2.8.6 in v3.6.0) for platforms without `mmap`, and its build/test tooling requires Autotools and DejaGnu/expect/tcl.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|----------------|----------------|-------------------|-------------------|
| GCC | Primary compiler for `sysv.S` and `ffi.c`; sole compiler in the riscv64 CI matrix and the only compiler listed as tested in the README's platform table | Full riscv64 support | Used by CI for every riscv64 job | N/A | Issue #777: GCC 12 cross-compile to musl fails with `R_RISCV_HI20` relocation truncation |
| LLVM | Alternative compiler (Clang); contributor-tested on riscv32/riscv64 for PR #933, not part of CI matrix | Works for contributors manually | Not exercised in CI | N/A | PR #932 (superseded) was abandoned over a Clang integrated-assembler issue (`%hi()`/`auipc`) on riscv |
| autoconf | Generates `configure` from `configure.ac`/`configure.host` | Standard, no riscv-specific issues found | Installed in `.ci/Containerfile.debian` | N/A | None |
| automake | Generates `Makefile.in` from `Makefile.am` | Standard | Installed in CI container | N/A | None |
| Libtool | Builds shared/static libraries, handles cross-arch library naming | Standard | Installed in CI container | N/A | None |
| GNU make | Drives `configure && make && make check` across all build paths documented in Section 5 | Standard | Used in every CI and manual build path | N/A | None |
| DejaGnu | Testsuite harness driving `make check` against the riscv64 backend | Available on riscv64 Debian | Used inside the CI QEMU container; result gated via `rlgl`, not the raw exit code (Section 7) | N/A, test-only | None |
| QEMU | Provides binfmt emulation (`docker/setup-qemu-action@v3`) so the riscv64 container's own toolchain and test binaries can run on an x86_64 CI host | Not a build-time dependency of libffi itself, but a hard dependency of the only riscv64 CI path that exists | Entire riscv64 test path depends on it | N/A | None found, but its absence would remove all riscv64 CI coverage since no native runner exists |
| glibc | `mmap`, `memfd_create`, `pthread_mutex_t` for the trampoline and closure subsystems (including the `libpthread` symbols now folded into glibc) | Supported since glibc 2.27 (2018) | Passes in Debian/Ubuntu riscv64 | Shipped in all major riscv64 distros | None |
| Linux kernel | `memfd_create` + `mmap` for static-trampoline mapping, with a fallback RW+RX `mmap` pair when unavailable | riscv64 support since Linux 4.15 | Exercised inside the QEMU CI Debian trixie container | N/A, kernel not a distro package | None |
| dlmalloc (bundled, not an external dependency) | Closure allocation fallback on platforms without `mmap` | No riscv64-specific code | PR #981 fixed `__builtin_clz`/`ctz` portability across all GNU compilers, including riscv64-relevant builds | Bundled source, not separately packaged | None |
| texinfo, ca-certificates | Documentation build and container TLS trust, installed alongside the above in `.ci/Containerfile.debian` | N/A, build-container only | N/A | N/A | None |

None of libffi's dependencies carries a riscv64-blocking issue that propagates into libffi's own behavior; the three correctness bugs that matter to riscv64 users (#466, #694, #777) are in libffi's own code, not in a dependency. The dependency graph terminates at the compiler, Autotools, glibc, and the kernel; no further recursive analysis is warranted. The canonical Ubuntu-riscv64 `project-graph` cross-check that would normally corroborate this table's "found in distro" claims could not be run this session: the `project-graph` MCP server returned `CONNECTION_CLOSED` for the entire session (both the Ubuntu 26.04 riscv64 query and a PyPI query), a tooling failure rather than evidence of absence; it should be retried once that server reconnects.

## 11. Known Bugs and Active Issues

**Open correctness issues:**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#466](https://github.com/libffi/libffi/issues/466) | RISC-V 64bit: "Small" integers are not turned into ffi_arg | Open since 2019-01-29 (3 comments) | High (API contract violation) | Commit `aa3fce0` (PR #680, Feb 2022) is the presumed fix; a direct source audit (Section 4) confirms the widening logic is present and structurally complete at current HEAD, but the issue was never closed and no commenter confirmed resolution against the original reproducer |
| [#694](https://github.com/libffi/libffi/issues/694) | struct_by_value_big fails on aarch64 and riscv64 | Open since 2022-03-01 (5 comments) | Medium (struct ABI) | PR #738 landed a caller-side copy and a downstream user confirmed it fixed the riscv64 test case on ArchLinux; issue remains open, shared with aarch64; CPython carries an independent `CTYPES_PASS_BY_REF_HACK` workaround |
| [#777](https://github.com/libffi/libffi/issues/777) | Linking libffi.a on riscv64 machine failed | Open since 2023-04-21 (0 comments) | Medium (musl cross-build only) | `R_RISCV_HI20` relocation truncation cross-compiling to `riscv64-unknown-linux-musl` with GCC 12; zero maintainer response in three-plus years; not exercised by CI (glibc-only container) |

**Open, unmerged pull request:**

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| [PR #1026](https://github.com/libffi/libffi/pull/1026) | riscv: ignore return buffer for void calls | Opened 2026-09-29, still open one day later | SIGSEGV-class bug on `FFI_TYPE_VOID` calls given a non-null dangling return pointer (matches rust-lang/miri#5356); author's own testing shows 354/0 on the full riscv64 DejaGNU suite with the fix, but the author states the patch was "developed with AI assistance" and has not been tested on native riscv64 hardware. Exact defect mechanism could not be independently confirmed via static code reading this session; treat as [NEEDS VERIFICATION] pending either maintainer review or hardware testing |

**Recently resolved (all shipped only as of v3.6.0, 2026-06-20):**

| ID | Title | Merged | First Release | Notes |
|----|-------|--------|-----------------|-------|
| [PR #972](https://github.com/libffi/libffi/pull/972) | riscv64: fix float marshal for ABI_FLEN >= 64 | 2026-06-18 | v3.6.0 | Floats were double-widened instead of NaN-boxed; discovered via Node.js RISC-V CI; a source audit confirms the NaN-boxing implementation in current HEAD |
| [PR #933](https://github.com/libffi/libffi/pull/933) | riscv: Add static trampoline support | 2025-08-07 | v3.6.0 | Enables closures under W^X; tested on QEMU and natively on a BananaPi riscv64 board with no testsuite regressions reported |
| [PR #738](https://github.com/libffi/libffi/pull/738) | riscv: make copies of structs passed by reference | 2022-10-10 | v3.4.4 | Fixed `struct_by_value_big` failures on ArchLinux riscv64 |
| [PR #708](https://github.com/libffi/libffi/pull/708) | Upstream FreeBSD riscv patch | 2022-05-24 | v3.4.4 | `__clear_cache` calling `abort()` under Clang/compiler-rt on FreeBSD riscv |

Issue #466 is the most significant open item by age (seven-plus years) despite an apparently complete code fix; the gap is one of issue-tracker hygiene and unconfirmed regression coverage, not necessarily unfixed code, but no source reviewed this session closes that uncertainty. PR #1026 is the item most likely to need independent scrutiny before merge, given the author's own disclosure of AI assistance and lack of native-hardware testing.

## 12. Objections and Upstream Blockers

**No stated architecture-level objections:** Anthony Green has merged every riscv64 patch submitted across at least the last four years without recorded objection. The project's culture accepts architecture ports as long as they follow existing code patterns.

**Organizational blockers:** None. The single-maintainer BDFL model requires no committee approval. Anthony Green has repeatedly merged riscv64 fixes within one to two days of submission (PR #933: submitted and merged within a day; PR #972: submitted and merged within two days).

**Technical blockers:**
1. Issue #466 has no assignee and minimal recent discussion despite a plausibly complete fix already in the codebase; no one has closed the loop between the code audit finding in Section 4 and the original bug report.
2. Issue #777 (musl) requires a contributor who can reproduce the musl/GCC 12 cross-compilation environment; CI does not exercise musl at all, so this gap will not surface through the project's own automation.
3. Issue #694 (struct semantics) is shared with aarch64, which may raise its priority, but it has been open over four years with no follow-up PR after #738.
4. PR #1026 is a live example of a lower-rigor review pattern: an AI-assisted, hardware-untested patch that could plausibly merge based on emulator-only testing, consistent with the general observation that atgreen merges riscv PRs quickly with limited visible review discussion.

**Clang CI gap:** Clang is untested for riscv64 in CI; a contributor adding `CC=clang` to the riscv64 matrix entry would need to independently verify no clang-specific assembler regressions exist, given that the Clang integrated-assembler issue (`%hi()`/`auipc`) is what forced PR #932's abandonment in favor of PR #933.

**Acceptance probability:** High for correctness fixes. Every riscv64 patch submitted to date has been accepted; the barrier to closing the remaining gaps is identifying and writing the fixes (and, for #466, confirming an apparently-complete fix), not upstream willingness to merge them.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro
- **Justification:** libffi's riscv64 CI (`.github/workflows/build.yml`, `build-qemu` job, matrix entry `HOST: riscv64-unknown-linux-gnu`) builds riscv64 via QEMU-emulated Docker and runs the full DejaGNU testsuite (`make check`, evaluated via the `rlgl` report), but upstream GitHub releases ship only Windows MSVC binaries and source tarballs, no riscv64 binary artifact is provided ([libffi releases](https://github.com/libffi/libffi/releases)). That maps to build=yes, test=yes, release=no, giving blue. The riscv64 binary end users actually consume comes from Linux distributions (Ubuntu 26.04 `libffi8`/`libffi-dev` 3.5.2-4, Debian sid/trixie), confirmed at [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libffi&suite=resolute), so `release_provider` is distro, not upstream.
- **Pending work that could change the grade:** Three open riscv64 correctness bugs remain: [#466](https://github.com/libffi/libffi/issues/466) (small-integer return widening, open since 2019, the presumed fix in commit `aa3fce0` was never confirmed and the issue never closed), [#694](https://github.com/libffi/libffi/issues/694) (struct_by_value_big pass-by-reference, partially fixed by PR #738 but the issue is still open), and [#777](https://github.com/libffi/libffi/issues/777) (musl cross-compile `R_RISCV_HI20` relocation failure, open since 2023, no maintainer response). A brand-new open pull request, [#1026](https://github.com/libffi/libffi/pull/1026) (SIGSEGV on void-return calls), is pending merge; its author states it was AI-assisted and untested on native riscv64 hardware. No RISE funding or ownership of libffi was found (checked all 35 riseproject.dev blog posts and the riseproject-dev GitHub org). CI also runs `make check || true`, so pass/fail is visible only via the separate `rlgl` report rather than gating the job directly, a caveat worth weighing against the "test: yes" classification. The `project-graph` MCP server was unreachable all session (`CONNECTION_CLOSED`), so the canonical Ubuntu-riscv64 graph-DB cross-check could not be performed and should be retried once that server reconnects.

## 14. Investment Analysis

RISE has not funded any libffi work; all riscv64 investment to date has come from individual contributors (Andreas Schwab, Peter Bergner, Levi Zim/kxxt) and one company-affiliated engineer (Peter Bergner, IBM at the time of PR #933, with a possible later move to Tenstorrent per a March 2026 commit email). The three open bugs are discrete, well-defined correctness issues that do not require architectural redesign, and the code audit in Section 4 suggests at least one of them (#466) may be substantially smaller in scope than its seven-year-open status implies.

### 14.1 Functional Enablement

- Issue #466: confirm whether the widening logic already present at HEAD (Section 4) actually resolves the original reporter's case, then close or fix as needed. Given the code audit finding, this is likely closer to a verification-and-triage task than a from-scratch fix. Estimated 1 week.
- Issue #694: characterize whether the remaining gap after PR #738 is aarch64-only or also affects riscv64 edge cases (e.g. non-power-of-two struct sizes), then fix and close. Estimated 2-3 person-weeks.
- Issue #777: reproduce the musl/GCC 12 cross-compilation environment and fix the `R_RISCV_HI20` relocation failure, likely via a `-mcmodel` or PIC flag adjustment in `configure.host`. Estimated 1-2 person-weeks.
- PR #1026: independently test the void-return-buffer fix on native riscv64 hardware before it merges, given the author's own disclosure that it is AI-assisted and untested on hardware. Estimated 2-3 days of hardware verification.

### 14.2 Performance Optimization

Data not available: no baseline benchmark exists for libffi call overhead on riscv64 against arm64 or amd64, whether native or under QEMU. Before sizing optimization work, a benchmark suite comparing dispatch overhead should be established. No specific optimization vector was identified in any source reviewed; libffi's riscv64 assembly is already hand-written and compact, and RVV is not applicable since libffi does not vectorize any workload. Estimated 1 person-week to build and publish a baseline benchmark, as a prerequisite to any further optimization sizing.

### 14.3 CI/CD Infrastructure

Current gaps: riscv64 CI runs under QEMU emulation only, with no native hardware runner (the NaN-boxing bug fixed by PR #972 was caught by Node.js's own CI on real hardware-adjacent testing, not by libffi's CI); no Clang variant in the riscv64 matrix; no musl variant in the riscv64 matrix (which is why issue #777 has gone unnoticed by CI for over three years); and test pass/fail is gated by a post-hoc `rlgl` report rather than the shell exit code of `make check`. Contributing a native riscv64 runner would benefit every consumer of libffi (CPython, Ruby, GHC, Node.js). Estimated 1 person-week to configure and register a runner plus ongoing infrastructure cost; 1 person-week to add a Clang matrix entry; 3-5 days to add a musl container variant.

### 14.4 Ecosystem Enablement

libffi is a system library, not a package with a dependent ecosystem requiring independent riscv64 enablement; its downstream impact runs entirely through consumers (CPython `ctypes`, Ruby `fiddle`, GHC's FFI, Node.js). Fixing libffi's own bugs directly unblocks those consumers rather than requiring separate ecosystem-wide work. The float-marshal fix (PR #972) is already in v3.6.0+ but has not yet reached Ubuntu 26.04 or Debian sid/trixie packages (both still at 3.5.2-4); no action is needed beyond waiting for those distros to update, or documenting that riscv64 users who need the fix today should use Arch Linux RISC-V's `core/libffi` 3.8.0-1 package or build from source.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|--------------------------|-------|----------|
| Functional | Verify/close issue #466 (small-integer return widening) against current code | 1 | libffi contributor | High |
| Functional | Fix issue #694 (struct_by_value_big, riscv64 residual + aarch64) | 2-3 | libffi contributor | High |
| Functional | Fix issue #777 (musl cross-compile relocation error) | 1-2 | libffi contributor | Medium |
| Functional | Independently hardware-test PR #1026 before merge | 0.5 | libffi contributor / hardware owner | High |
| CI/CD | Add native riscv64 hardware runner to `build-qemu` | 1 (+ ongoing infra) | RISE / interested chip vendor | Medium |
| CI/CD | Add Clang variant for riscv64 to CI matrix | 1 | libffi contributor | Low |
| CI/CD | Add musl container variant for riscv64 to CI matrix | 0.5-1 | libffi contributor | Medium |
| Performance | Baseline benchmark, riscv64 vs arm64/amd64 call dispatch overhead | 1 | libffi contributor | Low |

Total estimated new work: approximately 9-11 person-weeks across functional fixes, CI hardening, and a performance baseline. RISE has no existing libffi investment to exclude from this sizing.

## 15. References

- [libffi GitHub repository](https://github.com/libffi/libffi)
- [libffi homepage (sourceware.org)](https://sourceware.org/libffi/)
- [libffi GitHub releases](https://github.com/libffi/libffi/releases)
- [Issue #466: RISC-V 64bit: "Small" integers are not turned into ffi_arg](https://github.com/libffi/libffi/issues/466)
- [Issue #694: struct_by_value_big fails on aarch64 and riscv64](https://github.com/libffi/libffi/issues/694)
- [Issue #777: Linking libffi.a on riscv64 machine failed](https://github.com/libffi/libffi/issues/777)
- [Issue #714: Tests fail on riscv64-linux (VisionFive hardware)](https://github.com/libffi/libffi/issues/714)
- [Issue #931: risc-v: Add static trampoline support](https://github.com/libffi/libffi/issues/931)
- [Issue #566: cross compile libffi for RISC-V](https://github.com/libffi/libffi/issues/566)
- [PR #281: New RISC-V port](https://github.com/libffi/libffi/pull/281)
- [PR #445: RISC-V go closures](https://github.com/libffi/libffi/pull/445)
- [PR #680: riscv: extend return types smaller than ffi_arg](https://github.com/libffi/libffi/pull/680)
- [PR #708: Upstream FreeBSD riscv patch](https://github.com/libffi/libffi/pull/708)
- [PR #738: riscv: make copies of structs passed by reference](https://github.com/libffi/libffi/pull/738)
- [PR #932: riscv: Add static trampoline support (duplicate, closed unmerged)](https://github.com/libffi/libffi/pull/932)
- [PR #933: riscv: Add static trampoline support](https://github.com/libffi/libffi/pull/933)
- [PR #972: riscv64: fix float marshal for ABI_FLEN >= 64](https://github.com/libffi/libffi/pull/972)
- [PR #1026: riscv: ignore return buffer for void calls](https://github.com/libffi/libffi/pull/1026)
- [commit aa3fce0: riscv: extend return types smaller than ffi_arg](https://github.com/libffi/libffi/commit/aa3fce08ba620c50db17215a9f14dd0f1facf741)
- [commit 3840d49: New RISC-V port (original merge)](https://github.com/libffi/libffi/commit/3840d49aaa831d649b1597518a2903dfed0d57f3)
- [commit c9b2a8a: riscv: Add static trampoline support](https://github.com/libffi/libffi/commit/c9b2a8a4ceb2fa1f46c0200592562677214084fd)
- [libffi risc-v label (all open/closed riscv issues)](https://github.com/libffi/libffi/labels/risc-v)
- [Ubuntu 26.04 (Resolute) package search: libffi](https://packages.ubuntu.com/search?keywords=libffi&suite=resolute)
- [Arch Linux RISC-V (archriscv) core repository](https://archriscv.felixc.at/repo/core/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project blog sitemap](https://riseproject.dev/wp-sitemap-posts-post-1.xml)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)
- [rust-lang/miri #5356 (PR #1026's cited trigger)](https://github.com/rust-lang/miri/issues/5356)