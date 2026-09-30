---
title: libseccomp
parent: Project Reports
color: yellow
dependencies:
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: gperf
    relation: build-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: automake
    relation: build-dependency
    criticality: optional
  - name: GNU Libtool
    relation: build-dependency
    criticality: optional
  - name: Cython
    relation: build-dependency
    criticality: optional
  - name: Python
    relation: test-dependency
    criticality: optional
  - name: Valgrind
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libseccomp" %}

# libseccomp

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for libseccomp<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libseccomp is a C library providing a portable, architecture-abstracted API over the Linux kernel's seccomp-BPF syscall filter mechanism. Applications use libseccomp to build and load BPF programs that restrict which syscalls a process (or its children) may execute. It is a critical dependency for container runtimes (Docker, containerd, Podman), sandboxed browsers, and hardened service deployments.

**License:** LGPL-2.1.

**Governance:** No foundation affiliation (not Linux Foundation, CNCF, or any umbrella organization); the `seccomp` GitHub org is independent. There is no MAINTAINERS/OWNERS/CODEOWNERS file; governance is documented in `doc/admin/MAINTAINER_PROCESS.md` and `doc/admin/RELEASE_PROCESS.md`. Patches require an "Acked-by" from a simple majority of maintainers, or, absent any NACK within roughly two weeks, a maintainer may merge unilaterally. There is no formal RFC or architecture-tier process, and no PLATFORMS.md/SUPPORT.md exists, so there is no formal support-tier policy for any architecture. Two named maintainers per SECURITY.md:
- Paul Moore (`paul@paul-moore.com`, commits from a personal domain; mailmap shows a former Red Hat address, current employer not stated in the repo)
- Tom Hromatka (`tom.hromatka@oracle.com`, Oracle, explicit "(Oracle)" in commit author strings)

**Top contributors by commit count** (full `git shortlog` history): Paul Moore (745), Tom Hromatka/Oracle (83+5), Eric Paris/Red Hat (32), Corey Bryant/IBM (16), Tyler Hicks/Canonical (14), Kir Kolyshkin (9), Mike Frysinger/Gentoo (8), Kees Cook/Google (7), Andy Lutomirski (7), Xiaotian Wu and WANG Xuerui/Loongson (6+6), Markos Chandras/Imagination Technologies (6), Bogdan Purcareata/Freescale-NXP (6). Recent (2024-2026) activity is dominated by Moore and Hromatka (Oracle), with contributions from WANG Xuerui (Loongson), Sudipta Pandit (Microsoft), Sam James (Gentoo), and Romain Geissler (Amadeus).

**Community stance on new ports:** open and low-friction. Over 13+ years, architectures were added by outside individuals and vendors through ordinary PRs under `CONTRIBUTING.md`, with no special port-approval tier: x86/x86_64/x32 (Moore, 2012-13), ARM (Moore, 2012), MIPS BE/LE (Chandras/Imagination, 2014), AArch64 (Marcin Juszkiewicz/Red Hat, 2014), mips64/mips64n32/ppc64 (Moore, 2014), ppc (Purcareata/Freescale, 2015), s390/s390x (Jan Willeke/IBM, 2015), parisc (Helge Deller, 2016), riscv64 (Andreas Schwab/SUSE, 2020), SuperH (John Paul Adrian Glaubitz, 2020), LoongArch64 (Xiaotian Wu, 2021), m68k (Glaubitz, 2023). The de facto acceptance criterion for a new 64-bit little-endian architecture was that the Linux kernel's seccomp-BPF support for that architecture had already landed upstream - this held for riscv64 and currently blocks riscv32 (see Section 12).

**RISE membership:** libseccomp is not a RISE member or RISE-affiliated project. Neither "libseccomp" nor "seccomp" appear on [riseproject.dev/members](https://riseproject.dev/members/), whose roster lists companies only (Premier: Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm, Red Hat, SiFive, Tenstorrent; General: Akeana, Andes, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin, ISCAS, Microchip, NextSilicon, Quintauris, SpacemiT, ZTE).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2016-10-18 | [PR #50](https://github.com/seccomp/libseccomp/pull/50) opened by rwmjones (Richard W.M. Jones) - first riscv64 attempt, added riscv64-only support plus preadv2/pwritev2, submitted before kernel-side RISC-V syscall support existed. Closed 2018-02-20, unmerged. | GitHub PR #50 |
| 2018-02-20 | [Issue #110](https://github.com/seccomp/libseccomp/issues/110) opened by pcmoore as the master tracking issue for RISC-V support, referencing PR #50 and PR #108. | GitHub Issue #110 |
| 2018-04-05 | [PR #108](https://github.com/seccomp/libseccomp/pull/108) opened by Icenowy - second attempt, submitted once kernel support was more established. Closed 2018-04-05, unmerged; kernel support still incomplete. | GitHub PR #108 |
| 2018-12-06 | [PR #134](https://github.com/seccomp/libseccomp/pull/134) opened by davidlt (David Abdurachmanov) - substantial implementation adding riscv64 plus syscalls `riscv_flush_icache`, `preadv2`, `pwritev2`, `renameat`, `renameat2`, `io_pgetevents`, `rseq`. Validated on Fedora 29/RISC-V (kernel 4.19), later retested on kernel 5.2-rc7 and on a SiFive Unleashed board; cited results include live regression 8-9/9 passed, full regression suite 5,200+ tests passed with 0 failures, and kernel BPF selftests 73/74 passed. Per-syscall overhead of approximately 316-643 ns was reported in discussion [NEEDS VERIFICATION - single-source PR comment, no independent benchmark located]. | GitHub PR #134 |
| 2019-11-11 | PR #134 closed by pcmoore: "we won't do so until the kernel has the necessary support." Not a rejection of the implementation - the PR was ahead of upstream kernel merge status. | GitHub PR #134 |
| 2020-01-07 | [PR #197](https://github.com/seccomp/libseccomp/pull/197) opened by Andreas Schwab (SUSE). | GitHub PR #197 |
| 2020-01-08 | pcmoore retitles PR #197 "RFE: add RISC-V 64-bit support," requests review from Hromatka and himself, sets v2.5 milestone. | GitHub PR #197 |
| 2020-02-19 | Hromatka approves after running `arch-syscall-validate`: "RISC-V stuff all passed... The changes look reasonable to me." `Acked-by: Tom Hromatka <tom.hromatka@oracle.com>`. | GitHub PR #197 |
| 2020-02-23 | PR #197 merged by pcmoore, commit [5432e15](https://github.com/seccomp/libseccomp/commit/5432e15521d5ce5a7d3f26bf78674cbaa9d73d1f) ("arch: Add RISC-V 64-bit support"), 22 files changed, 677 additions. | GitHub PR #197 |
| 2020-02-24 | Issue #110 closed as completed, one day after PR #197 merged. | GitHub Issue #110 |
| 2020-02-24/25 | Post-merge validation: Schwab shares a successful openSUSE OBS build log; Carlos E. D. P. reports "5,229 tests passed; 0 tests failed" on real RISC-V hardware. A separate qemu-linux-user OBS build failure is identified as "qemu-linux-user rejecting to emulate seccomp" - a QEMU limitation, not a libseccomp bug. | GitHub PR #197 |
| 2020-03-05 | [PR #209](https://github.com/seccomp/libseccomp/pull/209) merged - fixes out-of-source-directory build (include path for generated seccomp.h), needed for building on riscv64 and other architectures. | GitHub PR #209 |
| 2020-03-10 | [PR #212](https://github.com/seccomp/libseccomp/pull/212) merged - adds riscv64 support to the `arch-syscall-dump` and `arch-syscall-validate` maintenance scripts, which had been missed during the main enablement work. Merged same-day by pcmoore. | GitHub PR #212 |
| 2020-03-10 | [PR #211](https://github.com/seccomp/libseccomp/pull/211) merged - fixes tests 53/55 failing on aarch64 and other non-x86_64 architectures (riscv64 included) by using real syscall names instead of fictitious numbers. | GitHub PR #211 |
| 2020-07-20 | libseccomp v2.5.0 released, shipping riscv64 support. | GitHub releases |
| 2020-08-18/20 | [PR #290](https://github.com/seccomp/libseccomp/pull/290) opened and merged - riscv64 (like aarch64) does not implement the legacy `open`/`stat` syscalls; tests 04 and 06 rewritten to use `openat`/`fstat` instead. `Acked-by: Paul Moore`, `Acked-by: Tom Hromatka`. Merged to master as `a317fab`, backported to release-2.5 as `cc580a5`. Shipped in v2.5.1. | GitHub PR #290 |
| 2021-06-09 | [PR #327](https://github.com/seccomp/libseccomp/pull/327) opened by kraj (Khem Raj) for riscv32 (32-bit) support, extending the existing riscv64 (64-bit) support. Milestone v2.7.0 (open). | GitHub PR #327 |
| 2024-05-30 | PR #327 last updated. No merge; test failures unresolved, no active maintainer ownership. | GitHub PR #327 |
| 2024-08-20/2024-11-11 | [PR #435](https://github.com/seccomp/libseccomp/pull/435) "Sync to Linux 6.12 syscall definitions" merged (v2.6.0) - not riscv64-specific, but notes aarch64 and riscv64 syscall-definition sourcing needed `arch-syscall-validate` backporting since both archs derive syscalls from `syscall.tbl` rather than `asm-generic/unistd.h`. | GitHub PR #435 |
| 2025-01-23 | libseccomp v2.6.0 released (adds `seccomp_precompute()` API, an architecture-agnostic performance feature; no further riscv64-specific changes). | GitHub releases |
| 2026-07-01 | libseccomp v2.6.1 released. Latest release as of this report. | GitHub releases |

**Status:** riscv64 support is fully upstream as of v2.5.0 (July 2020) and has received no reported regressions since. riscv32 support does not exist upstream; PR #327 remains open and stalled.

**Key contributor organizations:** SUSE (Andreas Schwab, author of the merged PR #197); independent community (Carlos E. D. P., hardware validation); Oracle (Tom Hromatka, code review and testing); the earlier attempts came from an independent contributor (rwmjones, PR #50) and Icenowy (PR #108).

## 3. Upstream Support Tier

**Formal tier policy:** None. No PLATFORMS.md, SUPPORT.md, or docs/platforms/ exists. All supported architectures appear equally in the CHANGELOG and README with no tier distinctions.

**De facto evidence of support quality by architecture:**

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Source support | Yes (since project inception) | Yes | Yes (v2.5.0, 2020) |
| CI coverage | Yes (all 6 CI jobs plus CodeQL run on `ubuntu-24.04`, native) | No | No |
| Live hardware testing in CI | No (CI uses native x86_64 GitHub-hosted runner only) | No | No |
| Official upstream binaries | No (releases are source-only tarballs) | No | No |
| Ubuntu binary package | Yes | Yes | Yes (26.04 "resolute": libseccomp2/libseccomp-dev 2.6.0-2ubuntu5) |
| Debian binary package | Yes | Yes | Yes (trixie: 2.6.0-2) |
| Arch Linux binary package | Yes | Yes | Yes (core repo: libseccomp-2.6.0-1-riscv64.pkg.tar.zst) |
| Kernel dependency met | Yes | Yes | Yes |

**Assessment:** riscv64 has source-level parity with arm64. Neither arm64 nor riscv64 receives CI coverage in the upstream project; both depend entirely on downstream distribution packagers for build verification. This is confirmed directly against the current default-branch workflow files (Section 7), not inferred from historical PR discussion.

## 4. Technical Architecture and RISC-V-Specific Subsystems

libseccomp generates BPF bytecode in pure C. It has no JIT, no SIMD, no hand-written assembly anywhere in the repository (confirmed via a full-repo search for `.S`/`.s` files - zero results, for any architecture, not just riscv64), and no floating-point or cryptographic code. The only architecture-specific work is a syscall-number lookup table and an architecture-descriptor struct - the requested JIT/SIMD/crypto/GC-barrier rubric does not map onto this codebase because none of those subsystems exist for any architecture it supports.

**RISC-V-specific source files** (verified by direct inspection of a local clone, HEAD `90d3f7d`):

- `src/arch-riscv64.h` (22 lines): declares riscv64 arch symbols via the generic `ARCH_DECL(riscv64)` macro, identical in shape to `arch-x86_64.h`/`arch-aarch64.h`. No ISA-extension references. Complete.
- `src/arch-riscv64.c` (36 lines): defines `arch_def_riscv64` with token `SCMP_ARCH_RISCV64`, BPF token `AUDIT_ARCH_RISCV64`, 64-bit size, little-endian, and real function pointers for `syscall_resolve_name_raw`, `syscall_resolve_num_raw`, `syscall_name_kver`, `syscall_num_kver`. `syscall_rewrite = NULL` and `rule_add = NULL` are correct, not missing - every 64-bit architecture using direct (non-multiplexed) syscall numbering sets these to NULL. No TODO/FIXME/stub comments found anywhere in riscv64-related code.
- `src/arch.c`: native-arch autodetection via `#elif __riscv && __riscv_xlen == 64` (line 106) - the only raw preprocessor guard needed, matching the single `#elif` every other architecture gets in the same dispatch block. riscv64 is also wired into runtime token dispatch and name-string dispatch in the same file.
- `src/syscalls.csv`: contains the riscv64 syscall-number column, populated for 328 of 508 total syscall rows (compare: x86 461, arm 430, x86_64 385, aarch64 327). riscv64 and aarch64 are at parity - both are "clean" Linux ABIs that never implemented the legacy `open`/`stat` family, which is why PR #290 had to special-case those tests (Section 2), not a libseccomp gap.
- `include/seccomp.h.in`, `include/seccomp-syscalls.h`, `tools/util.h`/`util.c`: `AUDIT_ARCH_RISCV64`/`EM_RISCV` constant definitions, plus `__PNR_riscv_flush_icache`/`__PNR_riscv_hwprobe` placeholders for the two RISC-V-specific Linux syscalls.
- `src/system.c`, `src/gen_pfc.c`: riscv64 handled in the actual BPF-generation and pretty-print-format code paths.
- `src/python/libseccomp.pxd`, `src/python/seccomp.pyx`: Cython bindings expose `Arch.RISCV64` as a first-class constant.
- Test suite: 10 files reference riscv64 (`15-basic-resolver.c`, `16-sim-arch_basic.{c,py}`, `23-sim-arch_all_le_basic.{c,py}`, `38-basic-pfc_coverage.c`, `56-basic-iterate_syscalls.{c,py}`, and `tests/regression`) - riscv64 is iterated in the same loops as every other supported architecture, not special-cased out.

**Component comparison:**

| Component | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Arch descriptor (.c/.h) | Yes (43/29 lines) | Yes (43/29 lines) | Yes (36/22 lines) | Smaller because, like x86_64/aarch64, riscv64 needs no legacy multiplexed-syscall rewriting (unlike arm's 97/29 or mips's 112/31) |
| Syscall table population | 385 | 327 | 328 | riscv64 and aarch64 at parity |
| BPF filter emission | Yes (shared) | Yes (shared) | Yes (shared) | Architecture-agnostic C code |
| JIT backend | None (project-wide) | None | None | libseccomp does not JIT |
| SIMD / vector | N/A | N/A | N/A | No RVV, no `vfloat32m1_t`, no vector intrinsics anywhere in the codebase (repo-wide search returned 0 hits) |
| Assembly | None | None | None | Pure C, no arch has any `.S`/`.s` files |
| ISA extensions used | None | None | None | No RVV, Zba, Zbb, Zbc, Zbs, or any other extension |

**Verdict: riscv64 = full/complete.** It is structurally identical to the "clean" 64-bit architectures (x86_64, aarch64, loongarch64), at syscall-table parity with aarch64, fully wired into runtime dispatch, Python bindings, and the test harness. It is not a stub and not missing any component present on comparable architectures.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Autotools (`configure.ac` + per-directory `Makefile.am`). Confirmed absent: CMakeLists.txt, setup.py, go.mod, Cargo.toml, package.json, Meson, and any Dockerfile (repo-wide search for all of these returned zero results).

**Standard build** (from README.md "Building and Installing the Library"):
```
./autogen.sh   (only needed building from git, not from a release tarball; runs autoreconf -fi)
./configure
make [V=0|1]
make install
```

**riscv64 support is source-level, not build-system-level.** There is no separate riscv64 configure flag or build target. The same generic `./configure && make` builds riscv64 support when compiling natively on riscv64, or via the standard (undocumented in-repo, but standard-autotools) cross-compilation invocation:
```
./autogen.sh
CC=riscv64-linux-gnu-gcc ./configure --host=riscv64-linux-gnu
make
```

**Configure options** (from `configure.ac`, via `AC_ARG_ENABLE`): only `--enable-python`/`--disable-python` (requires Cython >= 0.29, for building the Python bindings) and `--enable-code-coverage` (lcov, via the `AX_CODE_COVERAGE` m4 macro). No `-DUSE_X=OFF`-style or architecture-toggle flags of any kind exist.

**Toolchain version requirements:** No minimum GCC/Clang version is specified anywhere in `configure.ac`, README, or CONTRIBUTING.md; `AC_PROG_CC` is used with no version gating. The one compiler-related note in the build system is unrelated to riscv64: `-Umips` is added to `AM_CFLAGS` because MIPS GCC compilers auto-define `mips`.

**Required build tools:** `gperf` (mandatory - generates the perfect-hash syscall lookup table `syscalls.perf.c`; build fails without it); `autoconf`/`automake`/`libtool` (for building from git); a C compiler (GCC or Clang); for Python bindings, Cython >= 0.29 and Python 3.

**No QEMU usage anywhere in the repository** (`grep -rI -i qemu .` returns zero matches) and no Dockerfiles at all. Tests in upstream CI run natively on x86_64; no architecture uses QEMU in the upstream build/test pipeline.

**Known build issues (downstream, not upstream):**
- NixOS: libseccomp-2.5.5's test suite fails building for riscv64 under QEMU emulation on NixOS ([nixpkgs #301385](https://github.com/NixOS/nixpkgs/issues/301385), opened 2024, status stale/unresolved). Workaround is disabling tests during the build. Root cause is likely a QEMU seccomp-emulation gap, not a libseccomp bug; no upstream fix has been filed.
- OBS (openSUSE Build Service): post-merge of PR #197, a live test (Test 52-basic-load, rc=22) failed under QEMU. Confirmed by Andreas Schwab to be QEMU refusing to emulate seccomp, not a libseccomp defect. Not actionable upstream.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| BPF filter generation | Yes | Yes | Yes | Full parity |
| Syscall allow/deny by name | Yes | Yes | Yes | Full parity |
| Syscall argument filtering | Yes | Yes | Yes | Full parity |
| Notification API (`seccomp_notify`) | Yes | Yes | Yes | Architecture-agnostic |
| `SCMP_ACT_*` actions | All | All | All | Full parity |
| `seccomp_precompute()` (v2.6.0) | Yes | Yes | Yes | Architecture-agnostic performance feature added Jan 2025 |
| Legacy syscalls (`open`, `stat`, `fork`, etc.) | Full | Partial (PNR) | Partial (PNR, same as arm64) | riscv64 never implemented these in-kernel; applications must use `openat`, `fstatat`, `clone`, etc. Fixed in libseccomp's own test suite via PR #290 (openat/fstat substitution) |
| `riscv_flush_icache`, `riscv_hwprobe` | N/A | N/A | Yes | RISC-V-specific syscalls present in the table |
| riscv32 (32-bit) support | N/A | N/A | No | PR #327 open, stalled since 2021/2022 |

**Functional gaps:** the only functional gap is the kernel-level absence of legacy POSIX syscalls (`open`, `fork`, `stat`, etc.) on riscv64 - this is a kernel ABI property shared with aarch64, not a libseccomp deficiency, and is already handled in libseccomp's own test suite.

**Performance gaps:** none attributable to libseccomp. Filter generation is architecture-agnostic C code; filter execution performance is a kernel BPF-interpreter concern, not a libseccomp concern. No SIMD/vector code path exists on any architecture this library supports, so there is no "missing vectorization" performance delta to report (Section 4).

**Security hardening gaps:** none. ASLR, stack protection, and related mitigations are controlled by compiler flags at build time and are not architecture-specific in libseccomp's own build system.

**NaN/floating-point issues:** not applicable. libseccomp performs no floating-point computation.

## 7. CI/CD Infrastructure

**Files present** (confirmed by cloning the repository and reading directly, HEAD `90d3f7d`): `.github/workflows/continuous-integration.yml` and `.github/workflows/codeql-analysis.yml`. Confirmed absent: `.gitlab-ci.yml`, `.cirrus.yml`, `.travis.yml`, Jenkinsfile, any Azure Pipelines file.

**Exhaustive search for "riscv" (case-insensitive)** across every `.yml`/`.yaml` file and the `.github/actions/setup/action.yml` composite action both workflows call: **zero matches** in any CI configuration file. The only files anywhere in the repository containing "riscv" are source/test/doc files (`src/arch-riscv64.{c,h}`, `src/syscalls.csv`, `src/arch.c`, various test files, README.md, man pages, `tools/*`) - none of these are CI configuration.

**continuous-integration.yml:** triggers on `["push", "pull_request"]`; 6 jobs (tests, livetests, scanbuild, codecoverage, codespell, clang), every one running on `ubuntu-24.04` (a standard GitHub-hosted native x86_64 runner). No matrix strategy over architecture, no riscv64 runner, no QEMU/binfmt/cross-compilation step. The coverage upload is explicitly flagged `"amd64"`.

**codeql-analysis.yml:** triggers on `["push", "pull_request"]`; single `analyze` job on `ubuntu-24.04` with a language matrix `['cpp', 'python']` only - no architecture matrix.

**.github/actions/setup/action.yml:** installs `build-essential valgrind clang-tools lcov gperf astyle codespell` plus Python/Cython, then runs `./autogen.sh`. No cross-compilation toolchain, no riscv64-related packages, no QEMU setup.

**Architecture CI comparison:**

| Architecture | CI build | CI test | Live kernel test | Hardware/emulation runner |
|---|---|---|---|---|
| amd64 | Yes | Yes | Yes | ubuntu-24.04 (native) |
| arm64 | No | No | No | None |
| riscv64 | No | No | No | None |

**RISE runners:** not used. RISE has no involvement with libseccomp (Section 1); libseccomp appears only as an incidental apt build dependency in RISE's own `riscv-runner` Dockerfile (`riseproject-dev/riscv-runner/runner/images/Dockerfile.ubuntu`, which lists `libseccomp*` as a package installed when building that runner's own container image) - this is consumption of libseccomp, not RISE CI coverage of libseccomp.

**Consequence:** the only riscv64 build and test validation that currently exists anywhere is performed by downstream distribution packagers (Debian, Ubuntu, Arch Linux). A regression in riscv64 support could ship in a libseccomp release without detection by upstream CI.

## 8. Distribution and Release Status

**Upstream GitHub releases are source-only.** Latest release v2.6.1 (published 2026-07-01) ships exactly six assets, all confirmed via the release page: `libseccomp-2.6.1.tar.gz`, `.tar.gz.asc`, `.tar.gz.SHA256SUM`, `.tar.gz.SHA256SUM.asc`, plus GitHub's auto-generated "Source code (zip)" and "Source code (tar.gz)". No filename contains "riscv" or "riscv64" - no architecture-specific binaries of any kind are shipped by the upstream project, for any architecture.

**Distribution binary packages for riscv64** (all confirmed live, not inferred):

| Distribution | Package | Version | riscv64 available | Source |
|---|---|---|---|---|
| Ubuntu 26.04 "resolute" | libseccomp2 | 2.6.0-2ubuntu5 | Yes (HTTP 200, 54.5 kB / 196.0 kB installed) | [packages.ubuntu.com/resolute/riscv64/libseccomp2](https://packages.ubuntu.com/resolute/riscv64/libseccomp2) |
| Ubuntu 26.04 "resolute" | libseccomp-dev | 2.6.0-2ubuntu5 | Yes | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=libseccomp&suite=resolute&searchon=names&section=all) |
| Debian trixie | libseccomp2 | 2.6.0-2 | Yes | Debian package archive |
| Arch Linux RISC-V | libseccomp | 2.6.0-1 | Yes (`libseccomp-2.6.0-1-riscv64.pkg.tar.zst`, signed, `core` repo) | [archriscv.felixc.at/repo/core](https://archriscv.felixc.at/) |

Note: Arch Linux RISC-V's `core` repo build (2.6.0-1) is one release behind current upstream (2.6.1).

**PyPI:** no `libseccomp` package exists (confirmed `pypi.org/pypi/libseccomp/json` returns HTTP 404; `libseccomp-python` also 404; simple index 404). This is expected - libseccomp is a C library, not distributed as a Python wheel.

**RISE wheel builder:** not applicable for the same reason - libseccomp has no PyPI presence to be listed in RISE's Python wheel builder regardless of RISE involvement.

**What a user must do to get a working riscv64 binary:** install the distribution package (`apt install libseccomp2 libseccomp-dev` on Debian/Ubuntu, or the Arch Linux RISC-V equivalent). No additional steps, patches, or workarounds are required - all three verified distribution channels ship current, unpatched builds from vanilla upstream source.

## 9. Dependencies

libseccomp has no shared-library runtime dependencies. Verified three independent ways in the local clone (`/home/user/seccomp/libseccomp`, HEAD `90d3f7d`): `libseccomp.pc.in` links only `-lseccomp`; `src/Makefile.am`/`tools/Makefile.am` contain no third-party `-l<lib>` flags; `configure.ac` contains no `AC_CHECK_LIB`/`PKG_CHECK_MODULES` for any external library. It links only against the Linux kernel ABI (syscall interface plus seccomp-BPF). All dependencies below are build-time or test-time tooling, not link-time libraries.

| Dependency | Role | riscv64 status |
|---|---|---|
| Linux kernel | Runtime-dependency, critical - seccomp-BPF execution engine, `HAVE_ARCH_SECCOMP_FILTER` | riscv64 seccomp-BPF support has shipped since the kernel merge that unblocked PR #197 (2019-2020 cycle); no outstanding riscv64 kernel gap for the 64-bit target. riscv32 (`AUDIT_ARCH_RISCV32`) kernel-side audit support is not confirmed merged, which is a blocker for PR #327 (Section 12) |
| gperf | Build-dependency, critical - generates the perfect-hash syscall lookup table (`syscalls.perf.c`); build fails without it | Packaged for riscv64 in Debian/Ubuntu; architecture-agnostic output |
| GCC | Build-dependency, critical - default C compiler | Available for riscv64 in all three verified distributions; no minimum version required by `configure.ac` |
| autoconf | Build-dependency, optional - required only when building from git (`autogen.sh`), not from a release tarball | Standard packaged tool, no riscv64-specific issues found |
| automake | Build-dependency, optional - same as autoconf | Standard packaged tool, no riscv64-specific issues found |
| libtool | Build-dependency, optional - same as autoconf | Standard packaged tool, no riscv64-specific issues found |
| Cython | Build-dependency, optional - compiles the Python bindings when `--enable-python` is set (requires >= 0.29) | Packaged for riscv64 (e.g. Debian cython3); produces an architecture-specific C extension that builds on riscv64 |
| Python | Test-dependency, optional - runtime for the Python bindings and parts of the test harness | Packaged for riscv64 across all major distributions; no riscv64-specific issues known |
| Valgrind | Test-dependency, optional - memory-error checking of the test suite in CI, not linked into the library | riscv64 is an officially supported Valgrind target (v3.19+); packaged for riscv64. See the project's own status report, [project-reports/valgrind.md] |

None of these dependencies have JIT, SIMD, cryptographic, or numerics components - consistent with libseccomp itself having none (Section 4). The dependency graph is shallow, entirely build/test-time, and fully resolved for riscv64: every tool above is available as a packaged riscv64 binary in at least one verified distribution, and none blocks a riscv64 build, test run, or release today.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #290](https://github.com/seccomp/libseccomp/pull/290) | BUG: skip stat and open syscalls on riscv64 in tests 04 and 06 | Merged 2020-08-20 (resolved, shipped v2.5.1) | Medium (resolved) | riscv64 and aarch64 lack legacy `open`/`stat`; test suite fixed via `openat`/`fstat` substitution |
| [PR #327](https://github.com/seccomp/libseccomp/pull/327) | RFE: add RISC-V 32-bit arch support | Open, stalled since 2021-06-09, last activity 2024-05-30 | Low (does not affect riscv64) | Test failures unresolved; no active maintainer ownership |
| [nixpkgs #301385](https://github.com/NixOS/nixpkgs/issues/301385) | libseccomp-2.5.5 test suite fails on riscv64 under QEMU on NixOS | Open/stale (2024) | Low | QEMU seccomp-emulation gap, not a libseccomp bug; workaround is disabling tests at build time; no upstream fix filed |

**No open riscv64 correctness bugs exist in the upstream seccomp/libseccomp issue tracker.** A full scan of all RISC-V-mentioning issues (`riscv repo:seccomp/libseccomp`) returns only 3 issues, all closed: [#56](https://github.com/seccomp/libseccomp/issues/56) (README arch-list request, closed 2018), [#110](https://github.com/seccomp/libseccomp/issues/110) (tracking issue, closed 2020), [#262](https://github.com/seccomp/libseccomp/issues/262) (release-timing question, closed 2020). A targeted query for `riscv64 bug repo:seccomp/libseccomp is:open` returns 0 results. No NaN/floating-point bug applies - libseccomp performs no floating-point handling.

**Syscall coverage gaps (not bugs):** several newer syscalls are marked PNR (not present) on riscv64 in `syscalls.csv`, reflecting kernel ABI reality rather than a libseccomp defect.

## 12. Objections and Upstream Blockers

**Historical objections (resolved):** the sole stated objection to riscv64 support was the kernel prerequisite - `HAVE_ARCH_SECCOMP_FILTER` (or equivalent seccomp-BPF support) had to be merged into Linus' tree before any libseccomp riscv64 PR would be considered, per pcmoore's stated close rationale on PR #134 ("we won't do so until the kernel has the necessary support"). Once that kernel-side support matured, PR #197 was reviewed, approved (Hromatka), and merged (pcmoore) within about six weeks (2020-01-07 to 2020-02-23). riscv64 has had no open blockers since.

**Current blockers for riscv32** (distinct architecture target, PR #327):
1. Test failures remain unresolved - the PR has been open since 2021-06-09 with no confirmed fix as of its last update, 2024-05-30.
2. No maintainer or contributor currently owns the work; author kraj has not driven it to completion.
3. No confirmation was found that kernel-side riscv32 audit support (`AUDIT_ARCH_RISCV32`) has landed in Linus' tree - this is a plausible hard blocker analogous to the one that delayed riscv64 for over three years, though it was not independently re-verified against current kernel source in this research pass [NEEDS VERIFICATION].

**riscv64 has no current blockers.** All historical objections are resolved and no open issue or PR threatens existing riscv64 support.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** libseccomp has zero riscv64 presence in upstream CI - both [`.github/workflows/continuous-integration.yml`](https://github.com/seccomp/libseccomp/blob/main/.github/workflows/continuous-integration.yml) and [`codeql-analysis.yml`](https://github.com/seccomp/libseccomp/blob/main/.github/workflows/codeql-analysis.yml) run every job exclusively on `ubuntu-24.04` (native x86_64), with no architecture matrix, no QEMU step, and the string "riscv" absent from either file (confirmed by cloning the repository and reading the workflows directly). Upstream GitHub releases are source-only tarballs (v2.6.1, no per-architecture binaries), so there is no upstream-published riscv64 artifact either. However, riscv64 support landed natively in the library source in v2.5.0 (merged [PR #197](https://github.com/seccomp/libseccomp/pull/197), commit [5432e15](https://github.com/seccomp/libseccomp/commit/5432e15521d5ce5a7d3f26bf78674cbaa9d73d1f), February 2020) and distributions build it from unmodified upstream source with no riscv64-specific packaging patches needed: Ubuntu 26.04 "resolute" ships `libseccomp2`/`libseccomp-dev` 2.6.0-2ubuntu5 for riscv64 (confirmed live), Debian trixie ships 2.6.0-2, and Arch Linux RISC-V ships `libseccomp-2.6.0-1-riscv64.pkg.tar.zst` in its `core` repo. This is the clean-distro-build floor: no upstream CI/release, but a confirmed unpatched build from vanilla source, which caps the grade at yellow (not orange, since no patches were needed, and not blue/green, which require upstream-run tests or upstream-published binaries).
- **Pending work that could change the grade:** PR #327 ("add RISC-V 32-bit arch support") remains open and stalled since 2021/2022 - riscv32 (distinct from the already-supported riscv64) is not yet mergeable pending test failures and no active maintainer ownership. No RISE involvement with libseccomp was found (no blog post, working group, or funded RFP; libseccomp appears only as an incidental apt build dependency in RISE's own riscv-runner Dockerfile). The single highest-leverage change that would raise the grade is adding a riscv64 (QEMU or native-runner) build+test job to `continuous-integration.yml` - no such work is currently in flight upstream.

## 14. Investment Analysis

RISE has no current or prior involvement with libseccomp: no funded RFP, no blog post, no working group activity covers this project (Section 1, Section 7). riscv64 support was fully upstreamed independently in 2020 by SUSE (Andreas Schwab) before RISE existed as a project. No prior RISE work needs to be excluded from the sizing below.

### 14.1 Functional Enablement

**riscv64:** no work needed. Implementation is complete, upstream since v2.5.0 (2020), and shipping unmodified in Debian, Ubuntu, and Arch Linux. The 5,229-test pass on real RISC-V hardware in February 2020 (PR #197 discussion) validates the implementation; no riscv64 regression or open correctness issue has been reported since (Section 11).

**riscv32:** PR #327 requires resolving its outstanding test failures and securing a maintainer/contributor to drive it to merge; the PR itself provides no further public detail on remaining root causes beyond "unresolved as of 2024-05-30." Confirming kernel-side `AUDIT_ARCH_RISCV32` support is a likely prerequisite (Section 12) [NEEDS VERIFICATION]. Effort estimate: 3-6 person-weeks for an engineer familiar with the RISC-V 32-bit ABI and the libseccomp codebase, contingent on first re-establishing what remains broken in the PR (the available research did not surface a current, detailed failure log).

### 14.2 Performance Optimization

Data not available: no riscv64 vs. arm64 vs. amd64 benchmark comparisons for libseccomp exist in any source located (GitHub issues, PR discussion, general web search, or the RISE Project blog were all checked and returned nothing). libseccomp's performance is bound by BPF filter construction (CPU-bound C code, architecture-agnostic) and BPF filter execution (kernel BPF interpreter, not a libseccomp concern); the library has no architecture-specific hot path (Section 4, Section 6). Performance optimization is not a viable investment area for this project.

### 14.3 CI/CD Infrastructure

Upstream CI covers amd64 only, confirmed by direct inspection of both workflow files (Section 7). Closing this gap requires either a RISC-V hardware GitHub Actions runner or a QEMU-based cross-build/test job added to `continuous-integration.yml`. Given the confirmed downstream QEMU seccomp-emulation problems (nixpkgs #301385, the OBS Test 52-basic-load failure after PR #197), a QEMU-based live-kernel-test job is likely to hit the same emulation limitation and may require a native riscv64 runner instead. Estimated effort: 2-4 person-weeks for a QEMU-based or native riscv64 build-and-test job in `continuous-integration.yml`; an additional 2-4 person-weeks if a live kernel-test job is also pursued, contingent on resolving or working around the known QEMU seccomp-emulation gap. Maintainer buy-in (Moore/Hromatka) is required to merge any CI addition.

### 14.4 Ecosystem Enablement

Not applicable - libseccomp is a standalone C library with no dependent package ecosystem requiring separate riscv64 enablement (Section 9, Section 10 omitted per scope).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | riscv64 support | 0 (complete) | N/A | N/A - complete |
| Functional | Complete riscv32 support (PR #327): diagnose and fix remaining test failures, secure maintainer sign-off, confirm kernel `AUDIT_ARCH_RISCV32` prerequisite | 3-6 | Contributor (kraj disengaged; needs new owner) | Low |
| CI/CD | Add riscv64 (QEMU or native-runner) build+test job to `continuous-integration.yml` | 2-4 | Contributor + maintainer review | Medium - highest-leverage change available, prevents undetected riscv64 regressions |
| CI/CD | Add riscv64 live kernel-test job | 2-4 | Contributor + maintainer review | Low - known QEMU seccomp-emulation gap may block this path entirely |
| Performance | Benchmark libseccomp filter construction/loading on riscv64 vs. amd64/arm64 | 1-2 | Contributor | Low - no architecture-specific hot path exists to optimize |

## 15. References

- [Issue #110: RFE: add RISC-V support (tracking issue)](https://github.com/seccomp/libseccomp/issues/110)
- [Issue #56: RFE: add a list of supported architectures to the README](https://github.com/seccomp/libseccomp/issues/56)
- [Issue #262: Q: when will master branch with RISCV support be added to a release?](https://github.com/seccomp/libseccomp/issues/262)
- [PR #50: RFE: add RISC-V 64 bit support (first attempt, 2016, closed unmerged)](https://github.com/seccomp/libseccomp/pull/50)
- [PR #108: RFE: add RISC-V support (second attempt, 2018, closed unmerged)](https://github.com/seccomp/libseccomp/pull/108)
- [PR #134: Add support for RISC-V RV64 (third attempt, 2018-2019, closed unmerged)](https://github.com/seccomp/libseccomp/pull/134)
- [PR #197: RFE: add RISC-V 64-bit support (merged 2020-02-23, v2.5.0)](https://github.com/seccomp/libseccomp/pull/197)
- [PR #209: BUG: fix building outside source directory](https://github.com/seccomp/libseccomp/pull/209)
- [PR #211: BUG: fix test failures on aarch64 and other architectures](https://github.com/seccomp/libseccomp/pull/211)
- [PR #212: RFE: Add RISCV64 support to scripts](https://github.com/seccomp/libseccomp/pull/212)
- [PR #290: BUG: skip stat and open syscalls on riscv64 in tests 04 and 06 (merged 2020-08-20, v2.5.1)](https://github.com/seccomp/libseccomp/pull/290)
- [PR #327: RFE: add RISC-V 32-bit arch support (open, stalled)](https://github.com/seccomp/libseccomp/pull/327)
- [PR #435: RFE: Sync to Linux 6.12 syscall definitions](https://github.com/seccomp/libseccomp/pull/435)
- [Commit 5432e15: arch: Add RISC-V 64-bit support](https://github.com/seccomp/libseccomp/commit/5432e15521d5ce5a7d3f26bf78674cbaa9d73d1f)
- [GitHub Actions: continuous-integration.yml](https://github.com/seccomp/libseccomp/blob/main/.github/workflows/continuous-integration.yml)
- [GitHub Actions: codeql-analysis.yml](https://github.com/seccomp/libseccomp/blob/main/.github/workflows/codeql-analysis.yml)
- [Ubuntu 26.04 "resolute": libseccomp2/libseccomp-dev riscv64](https://packages.ubuntu.com/resolute/riscv64/libseccomp2)
- [Debian trixie: libseccomp2 2.6.0-2](https://packages.debian.org/trixie/libseccomp2)
- [Arch Linux RISC-V mirror: core repo](https://archriscv.felixc.at/)
- [nixpkgs issue #301385: libseccomp-2.5.5 test suite fails on riscv64 under QEMU](https://github.com/NixOS/nixpkgs/issues/301385)
- [RISE project members](https://riseproject.dev/members/)
- [RISE project blog](https://riseproject.dev/blog)
- [riseproject-dev/riscv-runner Dockerfile.ubuntu (libseccomp as incidental apt dependency)](https://github.com/riseproject-dev/riscv-runner)
- [seccomp/libseccomp repository](https://github.com/seccomp/libseccomp)
- [libseccomp v2.6.1 release](https://github.com/seccomp/libseccomp/releases/tag/v2.6.1)
- [libseccomp v2.6.0 release](https://github.com/seccomp/libseccomp/releases/tag/v2.6.0)
- [libseccomp v2.5.0 release](https://github.com/seccomp/libseccomp/releases/tag/v2.5.0)