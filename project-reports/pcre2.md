---
title: PCRE2
parent: Project Reports
color: blue
dependencies:
  - name: SLJIT
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: bzip2
    relation: runtime-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: CMake
    relation: build-dependency
    criticality: critical
  - name: Ninja
    relation: build-dependency
    criticality: optional
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: automake
    relation: build-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: critical
  - name: Valgrind
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="pcre2" %}

# PCRE2

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue (N/A)<br/>
**Scope:** RISC-V (riscv64/linux) support status for PCRE2<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

PCRE2 (Perl Compatible Regular Expressions, version 2) is a C library implementing Perl-compatible regex syntax. It is the de facto standard regex engine for C programs and is embedded in CPython, PHP, Nmap, Apple Safari (via WebKit), Postfix, KDE, and dozens of other widely deployed systems, per [pcre.org](https://www.pcre.org/).

**Governance.** PCRE2 has no software foundation, no corporate membership structure, and no formal governance bylaws. There is no MAINTAINERS/OWNERS/CODEOWNERS file; `AUTHORS.md` serves that function, and decisions are made via GitHub issues and pull requests. The project transitioned in 2024 from single-author maintenance (Philip Hazel, who created PCRE in 1997) to a two-administrator model. Both administrators are explicitly described in `AUTHORS.md` as "volunteers acting in a personal capacity":

| Maintainer | Affiliation (personal capacity) | Role |
|---|---|---|
| Nicholas Wilson (NWilson) | Microsoft Research, Cambridge, UK | Administration, releases, most active committer |
| Zoltan Herczeg (zherczeg) | University of Szeged, Hungary | JIT/sljit maintainer |

Neither Microsoft nor the University of Szeged is a named project sponsor and neither exercises formal governance; affiliations are disclosed for transparency only. No company is listed anywhere as an official sponsor of the project.

**License.** BSD, which pcre.org describes as "free, even for building proprietary software."

**RISE membership.** PCRE2 and the PCRE2Project organization are not members of the RISE project. Live research checked the RISE blog index, RISE site search ("pcre2" returns no results), the RISE Python wheel-builder's full 88-package list (PCRE2 absent), and GitHub code search across `riseproject-dev` (33 hits, all incidental references to PCRE2 as a third-party dependency of other projects' reports or build pipelines, none of them PCRE2 work itself). No RISE blog post across 27 posts (May 2024 through June 2026) mentions PCRE2.

**Community stance on new ports.** There is no documented formal tier policy. New architectures are accepted when a contributor submits a working implementation and CI coverage. The riscv64 CI job was added by Nicholas Wilson on 2025-01-11 at the explicit request of the JIT maintainer (zherczeg), with the code comment "Not used by anyone yet, really, but potentially the 'next big thing.'" ([dev.yml](https://github.com/PCRE2Project/pcre2/blob/main/.github/workflows/dev.yml)). This reflects a positive but opportunistic posture: riscv64 is welcome and actively exercised, but the maintainers themselves characterize current real-world riscv64 PCRE2 usage as low.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2021-08-30 | [Issue #14](https://github.com/PCRE2Project/pcre2/issues/14) opened by aaronfranke: "Add support for the RISC-V architecture", a low-priority feature request for RV64 (rv64g/rv64gc) in the sljit JIT backend. Assigned to zherczeg. | GitHub |
| 2022-07-14 | zherczeg comments on #14: "There is an experimental risc-v support in the jit compiler now. It is only tested with qemu, so there might be cache flush issues." | GitHub |
| 2022-12-06 | carenas comments: RISC-V JIT "Released with PCRE2 10.41." | GitHub |
| 2022-12-19 | carenas confirms real-hardware testing on two rv64g systems via the GCC Compile Farm; notes the implementation at that time does not use compressed instructions or vector extensions and assumes a hard-float ABI; notes autodetection already works and is enabled in Alpine Linux. | GitHub |
| 2023-01-18 | ljavorsk confirms `pcre2-jit` test passes on real riscv64 Fedora builders for PCRE2 10.42. [Issue #14](https://github.com/PCRE2Project/pcre2/issues/14) closed as completed. | GitHub |
| 2024-11-26 to 2024-11-30 | [PR #583](https://github.com/PCRE2Project/pcre2/pull/583), "JIT compiler update", merged (commit `6ef4fee`, first released in PCRE2 10.45, 2025-02-04). Description notes CI testing on non-x86 CPUs (ARM, s390x) could be added later. Reviewer carenas asks directly: "how is this going to affect RISCV, knowing we have a problem there with SIMD that could result in crashes?" zherczeg's reply addresses x86's vector-register handling but does not directly answer the RISC-V question, and states he had not yet had time to "merge the others and simplify those platforms." | GitHub |
| 2025-01-11 | [PR #663](https://github.com/PCRE2Project/pcre2/pull/663), "Add multiarch build jobs", opened and merged same day by NWilson (commit `971de5f`, first released in PCRE2 10.47, 2025-10-20). Original scope covered s390x, ppc64le, armv7, aarch64; zherczeg commented "Could RISCV be added as well?" and NWilson added it, with the commit message framing RISC-V as "the Next Big Thing(tm)." This is the commit that gave PCRE2 continuous riscv64 CI for the first time. | [PR #663](https://github.com/PCRE2Project/pcre2/pull/663), [commit 971de5f](https://github.com/PCRE2Project/pcre2/commit/971de5f444f011cc2c8dd6ea8275b606f2cbf6f0) |
| 2025-01-22 | `README.md` updated (~11 days after PR #663) to publicly list RISC-V (riscv64) among continuously tested processors. | GitHub |
| 2025-10-26 to 2025-10-31 | [Issue #831](https://github.com/PCRE2Project/pcre2/issues/831) opened by Puqns67: `pcre2_test` fails on RISC-V when both the B (bitmanip) and Zicond extensions are enabled together via `-march=rv64gcb_zicond`, reproduced with gcc 15.2.0 and clang 21.1.4 on a Spacemit CPU; JIT build succeeds, only test execution fails. zherczeg initially suspected sljit's extension handling; carenas root-caused it as a buffer overflow in `pcre2test`'s fixed-size `VERSION_SIZE` (64 bytes) when the CPU-feature string (e.g. `rv64gac_zba_zbb_zicond`) overruns it, authored the fix in [PR #835](https://github.com/PCRE2Project/pcre2/pull/835) ("pcre2test: dynamically allocate buffer for JITTARGET", merged 2025-10-30), and Puqns67 confirmed the fix on real Spacemit X60 hardware. NWilson merged it and cleared it for 10.47 backport; issue closed 2025-10-31, 5 days after opening. Also filed downstream at [Gentoo bug 964425](https://bugs.gentoo.org/964425), which thesamesam confirmed and backported. A follow-on, PR #836, and a tangential pcre2-config multilib PR (#859) grew out of the same thread. | [Issue #831](https://github.com/PCRE2Project/pcre2/issues/831), [Gentoo 964425](https://bugs.gentoo.org/964425) |
| 2026-08-08 to 2026-09-11 | [PR #939](https://github.com/PCRE2Project/pcre2/pull/939), "Test the remaining JIT backends under QEMU", by mattst88, merged by NWilson. Confirms the existing "ptarmigan" CI job already covers s390x, ppc64le, armv7, aarch64, and riscv64, and adds a separate job (via raw `qemu-user`, not `run-on-arch-action`) for sljit backends still untested: arm (`-marm`/`-mthumb`), powerpc(64), mips variants, and loongarch64. Not yet in any released version as of 10.48/10.49. RISC-V is referenced here only as already-covered context, not as new work. | [PR #939](https://github.com/PCRE2Project/pcre2/pull/939) |

**Is the port fully upstream?** Yes. All RISC-V support lives in the upstream repository or its vendored `deps/sljit` submodule ([zherczeg/sljit](https://github.com/zherczeg/sljit)); no downstream-only patches are required for standard rv64gc hardware as of 10.47. PCRE2's own source tree (`src/`) contains zero RISC-V-specific code; the RISC-V implementation is entirely inside the sljit JIT engine.

**Key contributors.** Zoltan Herczeg (University of Szeged) owns the sljit JIT backend and its RISC-V code generators. Carlo "carenas" Arenas Belon diagnosed and fixed the #831 buffer-overflow bug and has repeatedly tested PCRE2 on real riscv64 hardware (GCC Compile Farm, SiFive, Spacemit). Nicholas Wilson (Microsoft Research) added riscv64 to CI at zherczeg's request and merges most riscv64-touching PRs.

---

## 3. Upstream Support Tier

There is no documented formal tier policy; support level is inferred from observable CI and release behavior.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI on every push | Yes (`build.yml`, native runner) | Yes (macOS ARM runner, native) | Yes (`dev.yml`, `ptarmigan` job, QEMU) |
| CI on every pull request | Yes | Yes | **No** - job-level `if:` only allows `workflow_dispatch` or `push`; `pull_request` is in the workflow's top-level `on:` block but the `ptarmigan` job itself skips it (confirmed by direct clone and grep of `.github/workflows/dev.yml`, lines 574-642) |
| CI hardware | Native x86_64 runner | Native macOS ARM runner | QEMU user/system emulation on an x86_64 `ubuntu-latest` runner, via [uraimo/run-on-arch-action](https://github.com/uraimo/run-on-arch-action) v3.2.1 |
| Release-blocking | Yes (implicit) | Yes (implicit) | No - separate workflow, not gating merges to `main` on PRs |
| Official upstream binaries | No (source-only GitHub releases for every architecture) | No | No |
| JIT enabled in CI | Yes | Yes | Yes (`-DPCRE2_SUPPORT_JIT=ON`, confirmed in the live `ptarmigan` job definition) |
| PCRE2-layer SIMD fast-path | Yes (SSE2) | Yes (NEON) | No (scalar fallback; see Section 4.2) |

The riscv64 tier sits below amd64 and arm64 on two dimensions: CI does not gate pull requests, and PCRE2's own SIMD character-scan dispatch excludes RISC-V. Neither is a functional blocker for a library shipped as source, but the PR-gating gap means a riscv64 regression can merge before CI catches it, surfacing only on the next push or manual dispatch.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

PCRE2's performance-critical path has two architecture-relevant layers:

1. **SLJIT JIT engine** (`deps/sljit`, a git submodule pointing to [zherczeg/sljit](https://github.com/zherczeg/sljit)): generates native machine code at runtime for the regex match loop. All PCRE2 architecture-specific code generation lives here, not in PCRE2's own source tree (`grep -ril "riscv" src/` returns zero matches).
2. **PCRE2-layer SIMD fast-path dispatcher** (`src/pcre2_jit_simd_inc.h`): hand-written character-scan routines (`fast_forward_char_simd`, `fast_requested_char_simd`, `fast_forward_char_pair_simd`) gated by a compile-time architecture guard, used inside JIT-compiled matching.

### 4.1 SLJIT JIT Backend

SLJIT auto-detects riscv64 via the compiler's `__riscv_xlen` predefine and sets `SLJIT_CONFIG_RISCV_64`. The backend is implemented in three files under `deps/sljit/sljit_src/`, directly inspected via a shallow clone of the submodule target:

| File | Lines | Scope |
|---|---|---|
| `sljitNativeRISCV_common.c` | 4,868 | Shared RV32/RV64 codegen: register allocation, instruction encoding/emission, stack frames, branches, SIMD/vector ops |
| `sljitNativeRISCV_64.c` | 296 | RV64-specific: 64-bit immediate loading, `sljit_emit_fset64`, `sljit_set_jump_addr` |
| `sljitNativeRISCV_32.c` | 154 | RV32-specific immediate-load/word-size helpers |

For comparison, the riscv64 implementation (5,318 total lines / 179,514 bytes across the 64-bit-relevant files) is larger than arm64's self-contained `sljitNativeARM_64.c` (3,805 lines / 111,857 bytes) and roughly 70 percent the size of the x86 backend (8,582 lines / 247,689 bytes across its three files). The RISC-V common file exports 45 `SLJIT_API_FUNC_ATTRIBUTE` functions versus 38 for x86 and 50 for ARM_64; the only two functions it does not override fall through to the shared generic implementation, the same pattern PPC, MIPS, and LoongArch use. No TODO/FIXME/"not implemented" markers exist anywhere in the RISC-V source files. This is a hand-tuned, production-quality backend, not a stub.

**Per-component status:**

| Component | ISA extensions | riscv64 quality | amd64 quality | arm64 quality |
|---|---|---|---|---|
| Core integer (load/store/branch/arith) | RV64I | Full, hand-written | Full | Full |
| Float/double | F/D | Full (`sljit_emit_fset64`, FPU macros) | Full | Full |
| Compressed instructions (code density) | C (RVC) | Full | N/A | N/A |
| Bit manipulation / conditional ops | Zba, Zbb, Zicond | Full, extension-aware with software fallback (`RISCV_HAS_BITMANIP_B`, `RISCV_HAS_ICOND` style guards) | Full (BMI/BMI2) | Full |
| Atomics | A | Full - real `LR`/`SC` emission gated on `RISCV_HAS_ATOMIC` | Full | Full |
| Vector/SIMD (generic sljit API) | V (RVV) | Present and real: `sljit_emit_simd_mov`, `_simd_replicate`, `_simd_lane_mov`, using `VSETVLI`/`VSETIVLI` and a runtime CSR read (`csrr %0,0xc22`) for vector length probing | Full (SSE2/AVX) | Full (NEON/SVE) |
| CPU feature auto-detection | - | Compiler-predefine-based (`__riscv_atomic`, `__riscv_compressed`, `__riscv_vector`, `__riscv_zba`, `__riscv_zbb`, `__riscv_zicond`) plus a runtime CSR read for vector length; feature string format `"RISCV (rv64g[_atomic][c][v][_zba][_zbb][_zicond])"` | - | - |

### 4.2 PCRE2-Layer SIMD Dispatch - the critical gap

The compile-time guard in `src/pcre2_jit_simd_inc.h` is:

```c
#if (SLJIT_CONFIG_X86 || SLJIT_CONFIG_ARM_64 || SLJIT_CONFIG_S390X || SLJIT_CONFIG_LOONGARCH_64)
```

`SLJIT_CONFIG_RISCV` is absent. Critically, live research clarifies this is not merely a dispatch omission layered on top of a working sljit vector path: PCRE2's JIT compilation layer (`src/pcre2_jit_compile.c`) only ever calls scalar sljit feature-query APIs (`sljit_has_cpu_feature(SLJIT_HAS_CMOV)`, `SLJIT_HAS_ZERO_REGISTER`) and never calls `sljit_emit_simd_*`/vector functions on any architecture, including x86 and arm64. The x86/arm64 "SIMD fast-path" in `pcre2_jit_simd_inc.h` is PCRE2's own hand-written intrinsics code, not an invocation of sljit's generic vector-emission interface. So sljit's genuine RVV vector codegen (section 4.1) exists for other sljit consumers but is simply unused by PCRE2 regardless of target architecture - and because the `pcre2_jit_simd_inc.h` guard omits RISC-V specifically, riscv64 always falls back to scalar, byte-at-a-time scanning for first-character/requested-character search, even on V-extension-capable hardware, while x86 and arm64 get their own hand-written vectorized fast paths.

This is the single largest technical/performance gap for PCRE2 on RISC-V relative to arm64 and amd64, and it is unquantified: no benchmark exists measuring its real-world cost (see Section 6).

### 4.3 SIMD Crash Concern - unresolved thread

In [PR #583](https://github.com/PCRE2Project/pcre2/pull/583) (November 2024), reviewer carenas asked directly whether RISC-V's known SIMD problem could cause crashes; zherczeg's reply addressed x86's vector-register handling but did not directly answer for RISC-V, and acknowledged not having had time to bring the other (non-x86) platforms' SIMD handling up to the same standard. This thread was never formally closed with a resolution statement in the PR itself.

Separately, live research into PCRE2's dependency tree found an **open** upstream bug in the vendored sljit project itself: [zherczeg/sljit#271](https://github.com/zherczeg/sljit/issues/271), "riscv: SIGBUS when running `test_simd1` in RVV 1.0 CPU," opened 2024-10-02 and still open as of this report. This is in the sljit repository (a separate GitHub project from PCRE2Project/pcre2, vendored as a submodule), not in PCRE2's own issue tracker, and is distinct from the closed PCRE2#831 (which was a `pcre2test` buffer-overflow bug, not a sljit SIMD bug). Because PCRE2 itself never invokes sljit's vector-emission API (section 4.2), sljit#271 does not affect PCRE2's own correctness today, but it is evidence that sljit's RVV vector path - the same path that would need to mature before PCRE2 could close its Section 4.2 gap - still has open stability issues. [NEEDS VERIFICATION: whether sljit#271 was ever discussed in the PR #583 thread as the same concern carenas raised; no comment thread evidence links the two directly.]

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system.** CMake (primary, used in CI) and Autotools both supported. No `BUILDING.md`/`docs/cross-compilation.md` exists; relevant docs are `README.md`, `INSTALL`, and `NON-AUTOTOOLS-BUILD`, none of which mention riscv64 specifically.

**Exact command run for riscv64 in CI** (from `.github/workflows/dev.yml`, `ptarmigan` job, directly confirmed via clone at HEAD `4b957eea5c1a0d89a8c06b84a11647d9f60bd781`):

```
# install step (inside the emulated riscv64 container)
apt-get -qq install -y gcc cmake ninja-build zlib1g-dev libbz2-dev libreadline-dev

# configure/build/test step
cmake -Wdev -Werror=dev -Wdeprecated -Werror=deprecated --warn-uninitialized \
  -G Ninja \
  -DPCRE2_SUPPORT_JIT=ON \
  -DPCRE2_BUILD_PCRE2_16=ON \
  -DPCRE2_BUILD_PCRE2_32=ON \
  -DBUILD_SHARED_LIBS=ON \
  -DBUILD_STATIC_LIBS=ON \
  -DPCRE2_DEBUG=ON \
  -DCMAKE_C_FLAGS="-Wall -Wextra -pedantic -Wdeclaration-after-statement -Wshadow -Wno-overlength-strings -Wimplicit-fallthrough" \
  -DCMAKE_COMPILE_WARNING_AS_ERROR=ON \
  -DCMAKE_BUILD_TYPE=RelWithDebInfo \
  -B build
cd build
ninja
ctest -j$(nproc) --output-on-failure
```

Everything is enabled for riscv64 (JIT, 16-bit and 32-bit code units, shared and static libraries, debug assertions, warnings-as-errors); no `-DPCRE2_*=OFF` flags are used for this target.

**QEMU mechanism.** CI uses [uraimo/run-on-arch-action](https://github.com/uraimo/run-on-arch-action), pinned to commit `fa1f3e7de95534497266c7265950b5188355fbfb` (v3.2.1), which boots a full-system QEMU-emulated riscv64 Ubuntu container on the x86_64 `ubuntu-latest` host and builds and tests **natively inside it**. This is not a cross-compile with a `--host=riscv64-...` triple, and there is no explicit `qemu-riscv64` invocation in the PCRE2 workflow itself; QEMU is an internal implementation detail of the third-party action, invoked transparently via `binfmt_misc`.

A separate job in the same workflow, `coelacanth` ("QEMU..."), does perform real cross-compilation (`./configure --host=<triple>` plus explicit `qemu-<arch>` invocation) for `alpha`, `arm`, `arm-thumb2`, `loongarch64`, `powerpc`, `powerpc64`, and several MIPS variants - but riscv64 is explicitly absent from that matrix, since it is already covered natively by `ptarmigan`.

**Toolchain minimum.** No pinned minimum GCC/Clang version exists for riscv64 specifically; the install step takes whatever `gcc` Ubuntu's `ubuntu_latest` riscv64 repos resolve to at run time (unpinned), unlike some `coelacanth` targets (e.g. `alpha`, pinned to `gcc-14` because only that version is packaged on Ubuntu 26.04 for that target). `README.md` states generally: "PCRE2 is portable C code, and is likely to work on any system with a C99 compiler."

**Cross-compilation.** No riscv64 CMake toolchain file exists in `cmake/` (only `FindEditline.cmake`, `FindReadline.cmake`, `PCRE2CheckVscript.cmake`, `PCRE2UseSystemExtensions.cmake`, `PCRE2WarningAsError.cmake`, `pcre2-config.cmake.in`). For manual cross-compilation via Autotools: `./configure --host=riscv64-linux-gnu --build=x86_64-linux-gnu`. No riscv64-specific `--disable-*` flags are documented or required.

**Known build/test issues.** Issue #831 (October 2025): building with `-march=rv64gcb_zicond` caused `pcre2_test` (the test driver, not the JIT itself) to fail due to a `VERSION_SIZE` buffer overflow in `pcre2test.c`. Fixed upstream for 10.47 via PR #835 (and #836, which removed `VERSION_SIZE` entirely); backported to Gentoo. No other riscv64-specific build failures are documented. No Dockerfile exists anywhere in the repository for any architecture (confirmed by local search and GitHub code search returning zero hits for `filename:Dockerfile`).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT regex compilation | Yes | Yes | Yes |
| JIT float operations | Yes | Yes | Yes |
| JIT compressed instructions | N/A | N/A | Yes (C extension) |
| JIT vector/SIMD codegen in sljit (unused by PCRE2 on any arch) | Present (SSE2/AVX) | Present (NEON) | Present (RVV, per section 4.1) |
| PCRE2-layer SIMD fast-path (hand-written intrinsics, actually used) | Yes (SSE2) | Yes (NEON) | **No** - scalar fallback (section 4.2) |
| JIT atomic operations | Yes | Yes | Yes (A extension) |
| JIT bit manipulation | Yes (BMI/BMI2) | Yes | Yes (Zba/Zbb/Zicond) |
| Interpreted (non-JIT) mode | Yes | Yes | Yes |
| 8/16/32-bit code units | Yes | Yes | Yes |
| pcre2grep compression (zlib/bzip2) | Yes | Yes | Yes |

**Functional gaps.** None. All PCRE2 functionality is available on riscv64: the JIT works, every regex operation works, every character-unit width works, and the interpreter fallback is always present regardless of JIT availability.

**Performance gap.** The scalar `fast_forward_char` path scans one byte per iteration. The SSE2 (x86) and NEON (arm64) implementations scan 16-32 bytes per iteration. On character-heavy patterns where the engine spends significant time scanning for a first-character or requested-character match, the scalar path on riscv64 will be meaningfully slower than the x86/arm64 fast paths; the order of magnitude scales with vector width.

**Quantitative benchmark data.** Data not available: no published benchmarks comparing PCRE2 throughput on riscv64 versus arm64 or amd64 were found, searched via GitHub issues/PRs, RISE blog posts, riscv-runners.riseproject.dev, the RISC-V Optimization Guide, or general web search. One general-purpose regex engine comparison site (`pts/regex-benchmark` on OpenBenchmarking.org) returned HTTP 403 on direct fetch and could not be confirmed or quoted with exact figures; earlier indexing reportedly includes a RISC-V/Spacemit X100 result but no numbers could be verified [NEEDS VERIFICATION - unreachable at verification time]. PCRE2-JIT-vs-RE2 comparisons exist for x86 only and are not relevant to a riscv64 assessment.

**Security hardening gaps.** No riscv64-specific security hardening differences are documented in any source consulted.

**Floating-point / NaN semantics.** No riscv64-specific floating-point correctness issues were found in any issue search (a targeted search for "riscv nan floating" against PCRE2Project/pcre2 returned zero results). The F/D extensions are fully implemented in sljit's RISC-V backend.

---

## 7. CI/CD Infrastructure

| Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI workflow file | `build.yml` | `build.yml` (macOS runner) | `dev.yml`, `ptarmigan` job |
| Triggers | push, pull_request | push, pull_request | push, workflow_dispatch only - **not pull_request** (job-level `if:` omits it despite the workflow's top-level `on:` including it) |
| Runner hardware | Native x86_64 | Native macOS ARM (Apple Silicon) | QEMU-emulated full-system container on an x86_64 `ubuntu-latest` host |
| JIT enabled in CI | Yes | Yes | Yes |
| Tests run | Full `ctest` | Full `ctest` | Full `ctest -j$(nproc) --output-on-failure` |
| Warning-as-error | Yes | Yes | Yes (`-DCMAKE_COMPILE_WARNING_AS_ERROR=ON`, confirmed current) |
| PR feedback | Yes | Yes | No |

No GitLab CI, Jenkinsfile, or Cirrus CI configuration exists anywhere in the repository (confirmed by direct search); GitHub Actions (`.github/workflows/`, 8 files) is the only CI system.

**RISE runners.** None. PCRE2 uses standard GitHub-hosted Actions runners with third-party QEMU emulation (`uraimo/run-on-arch-action`), not RISE-provided native RISC-V hardware runners. No RISE involvement with PCRE2 was found anywhere (Section 1).

**CI maturity signal.** [PR #939](https://github.com/PCRE2Project/pcre2/pull/939) (merged 2026-09-11) explicitly uses the existing riscv64 `ptarmigan` coverage as the stable baseline against which newly-added, still-gap-filled sljit backends (arm 32-bit variants, powerpc, mips, loongarch64) are compared - evidence that riscv64's CI entry is mature and settled relative to the other backends still being onboarded.

---

## 8. Distribution and Release Status

**Upstream GitHub releases.** The PCRE2Project publishes source-only releases for every architecture - no platform-specific binaries of any kind. Live verification was partially blocked: this session's GitHub API access was scoped only to a single unrelated repository, so release asset filenames could not be enumerated directly via the API. A WebFetch of the releases page showed a consistent "8 assets" count across 10.48, 10.48-RC1, and 10.49, consistent with the project's known pattern of shipping `.tar.gz`/`.tar.bz2`/`.zip` plus signature and checksum files only - but the individual filenames were not directly confirmed in this session [NEEDS VERIFICATION]. No riscv64 (or any architecture-specific) binary asset is expected or claimed to exist on GitHub releases.

**Ubuntu 26.04 "resolute" - confirmed with strongest available evidence.** `packages.ubuntu.com` (suite=resolute) lists riscv64 builds for `libpcre2-8-0`, `libpcre2-16-0`, `libpcre2-32-0`, `libpcre2-dev`, `libpcre2-posix3`, `pcre2-utils` (all version 10.46-1build1), plus `python3-pcre2` (0.6.0+ds-1build1), `pcre2-ocaml`/`pcre2-ocaml-dev`, `lua-pcre2`/`lua-pcre2-dev`, Haskell `libghc-regex-pcre2-dev`, and Rust source packages. Live research went further than metadata: it downloaded `pcre2-utils_10.46-1build1_riscv64.deb` directly from the official `ports.ubuntu.com` mirror and ran `file` on the extracted binaries, confirming genuine, executable RISC-V ELF binaries:
```
usr/bin/pcre2grep: ELF 64-bit LSB pie executable, UCB RISC-V, RVC, double-float ABI, ... stripped
usr/bin/pcre2test: ELF 64-bit LSB pie executable, UCB RISC-V, RVC, double-float ABI, ... stripped
```
The `ports.ubuntu.com` pool further shows riscv64 builds for PCRE2 going back to version 10.34-7 - a multi-year continuous build history, not a one-off.

**Ubuntu 24.04 (Noble) / Debian.** Earlier project tracking recorded 14 riscv64-architecture PCRE2 packages in Ubuntu 24.04 and `pcre2` 10.46-1+b2 as "Installed" for riscv64 in Debian sid (buildd host `rv-osuosl-01`), covering core libraries and language bindings (Python, Rust, OCaml, Lua). [NEEDS VERIFICATION for the current date: this was not independently re-confirmed in the latest research pass, which focused on 26.04 "resolute."]

**PyPI.** The `pcre2` PyPI package (`PCRE2.py`, v0.7.1) ships wheels for macOS (x86_64, arm64), manylinux (x86_64, aarch64), musllinux (x86_64), and Windows (amd64, arm64) only. No riscv64 wheel exists; riscv64 users must build from the sdist.

**RISE wheel builder.** The RISE PyPI mirror for `pcre2` (`gitlab.com/.../packages/pypi/simple/pcre2/`) 302-redirects to the standard PyPI simple index, i.e. RISE has not built a separate riscv64 wheel for this package; it is also absent from the RISE wheel builder's full package list.

**Arch Linux RISC-V.** Inconclusive. The Arch RISC-V status page's `?q=` search parameter has no server-side effect, and its "detailed status" exception page (which lists only outdated/blacklisted packages) contains zero mentions of "pcre2" - weak indirect evidence of normal build status, not direct proof. Repository mirror path probes returned 404 under every layout tried. Data not available: could not confirm riscv64 PCRE2 package availability on Arch Linux RISC-V through any reachable endpoint.

**What a user must do to get a working binary.**
- On Ubuntu 26.04/Debian sid riscv64: `apt install libpcre2-8-0 libpcre2-dev` works out of the box, confirmed via direct binary download and inspection.
- On other distributions without riscv64 packaging: build from source with CMake; `-DPCRE2_SUPPORT_JIT=ON` works on standard rv64gc hardware with no patches required as of 10.47.
- For hardware combining the B and Zicond extensions (e.g. Spacemit X60): requires PCRE2 10.47 or later, or a backport of PR #835/#836.

---

## 9. Dependencies

| Dependency | Relation | Criticality | Role | riscv64 status |
|---|---|---|---|---|
| SLJIT | runtime-dependency | critical | Vendored JIT code generator (`deps/sljit` git submodule to [zherczeg/sljit](https://github.com/zherczeg/sljit)); compiles matched regexes to native machine code. PCRE2's sole architecture-specific dependency. | Builds and passes on riscv64 in CI with `-DPCRE2_SUPPORT_JIT=ON` (confirmed live log on issue #831, both gcc 15.2.0 and clang 21.1.4). Hand-tuned backend covering RV64I, F/D, C, A, Zba/Zbb/Zicond, and real RVV vector codegen (section 4.1), though PCRE2 itself never calls the vector-emission API. One open upstream bug in the sljit project itself: [zherczeg/sljit#271](https://github.com/zherczeg/sljit/issues/271) (SIGBUS in `test_simd1` on RVV 1.0 hardware, open since 2024-10-02) - does not affect PCRE2 directly since PCRE2 never invokes sljit's vector path, but signals the vector path's stability is not yet proven. PCRE2-side JIT/riscv64 bug #831 is closed. No formal riscv64 release tier; shipped as source inside PCRE2's own distro packages wherever JIT is compiled in. |
| zlib | runtime-dependency | optional | Transparent `.gz` decompression in `pcre2grep` (`PCRE2_SUPPORT_LIBZ`, default ON); CMake `find_package(ZLIB)`. | Pure portable C, no riscv64-specific code needed. Builds/tests clean on riscv64 per zlib's own upstream CI (OpenBSD/riscv64 via vmactions). Confirmed shipping for riscv64 in Ubuntu/Debian packaging. No blocking issues. |
| bzip2 | runtime-dependency | optional | Transparent `.bz2` decompression in `pcre2grep` (`PCRE2_SUPPORT_LIBBZ2`, default ON); CMake `find_package(BZip2)`. | Pure portable C89, zero architecture-conditioned code. No upstream CI exists for bzip2 at all (any architecture); riscv64 validation comes entirely from Debian/Ubuntu build farms. Ubuntu 26.04 "resolute" ships bzip2 1.0.8-6build2 for riscv64, on an older, unpatched build revision than amd64/arm64/i386 (relevant to [Debian bug 1138255 / CVE-2026-42250](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1138255), which is architecture-agnostic; whether riscv64's older revision is specifically because of this CVE was not confirmed). No riscv64-specific defect found. |
| glibc | runtime-dependency | critical | Provides `pthreads`, used for JIT executable-memory allocation when `PCRE2_SUPPORT_JIT=ON` on Linux (a required, non-optional runtime dependency once JIT is enabled, per CMake's `Threads` requirement). | Fully supported on riscv64 via glibc's long-standing riscv64 port; foundational to every Linux riscv64 distribution PCRE2 is confirmed shipping on (Section 8). No PCRE2-specific or riscv64-specific glibc issues found. |
| CMake | build-dependency | critical | Primary build system; used for all CI builds including the riscv64 `ptarmigan` job. | Ubuntu's riscv64 `cmake` package is what CI installs via `apt-get install -y cmake` inside the emulated riscv64 container; no riscv64-specific CMake issues surfaced in any search. |
| Ninja | build-dependency | optional | Build generator used in CI (`-G Ninja`); Autotools remains the build-system alternative that does not require Ninja. | Installed via `apt-get install -y ninja-build` inside the riscv64 CI container; no riscv64-specific issues found. |
| autoconf | build-dependency | optional | Required only for the Autotools build path (`./autogen.sh` invokes `autoreconf`, used as a CI preparation step even for the CMake-based `ptarmigan` job). | Standard Ubuntu/Debian riscv64 package; no PCRE2-specific or riscv64-specific issues found. Data not available: no dedicated riscv64 autoconf testing evidence was found beyond its routine presence in Ubuntu riscv64 repositories. |
| automake | build-dependency | optional | Paired with autoconf for the Autotools build path. | Same as autoconf: standard Ubuntu/Debian riscv64 package; no PCRE2-specific or riscv64-specific issues found. |
| QEMU | test-dependency | critical | Provides riscv64 CI execution entirely: `uraimo/run-on-arch-action` uses QEMU (via binfmt_misc) to boot and run a full riscv64 Ubuntu container on an x86_64 GitHub-hosted runner for the `ptarmigan` job; this is the only mechanism by which PCRE2's riscv64 test suite runs in CI today, since no RISE or other native riscv64 runner is in use. | Functioning and actively used on every push/workflow_dispatch; without it, PCRE2 would have zero riscv64 test execution in CI. |
| Valgrind | test-dependency | optional | Memory-debugging tool for JIT correctness testing; not an end-user runtime dependency. | riscv64 support was added in Valgrind 3.25.0 (April 2025), covering the RV64GC base ISA; Valgrind 3.27.1 (May 2026) lists riscv64/linux as supported. Memcheck is functional on the base ISA, but coverage of extended ISA (V, B, Zicond) may produce unhandled-instruction warnings. No PCRE2-specific blocker identified, since Valgrind is not part of the `ptarmigan` CI job itself. |

PCRE2's only true architecture-specific ("critical" in the JIT/SIMD sense) dependency is SLJIT. It is also the one dependency chain with a currently open riscv64 bug, though that bug (sljit#271) is in an unused-by-PCRE2 code path. zlib, bzip2, and glibc are functionally solid on riscv64 with no architecture-specific gaps. CMake/Ninja/autoconf/automake are generic build tooling with no documented riscv64 issues. QEMU is the single point of failure for PCRE2's entire riscv64 test signal today, since no native riscv64 CI hardware is used.

---

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PCRE2 Issue #831](https://github.com/PCRE2Project/pcre2/issues/831) | `-march=rv64gcb_zicond` with JIT causes `pcre2_test` failure | Closed (fixed 2025-10-31, 5 days after opening) | High (correctness, in the test driver, not the engine) | Root cause: `VERSION_SIZE 64` buffer overflow in `pcre2test.c` when the B+Zicond CPU feature string exceeds the fixed buffer. Fixed by [PR #835](https://github.com/PCRE2Project/pcre2/pull/835)/[#836](https://github.com/PCRE2Project/pcre2/pull/836). Backported to Gentoo ([bug 964425](https://bugs.gentoo.org/964425)). Does not affect `pcre2_jit_test` itself, only the `pcre2test` driver binary. |
| [zherczeg/sljit#271](https://github.com/zherczeg/sljit/issues/271) | riscv: SIGBUS when running `test_simd1` in RVV 1.0 CPU | **Open** (since 2024-10-02) | Medium (in a vendored dependency's own test suite; path unused by PCRE2) | Lives in the sljit upstream repository, a submodule vendored by PCRE2, not in PCRE2Project/pcre2 itself. Because PCRE2's own JIT layer never calls sljit's vector-emission API (section 4.2), this bug does not currently affect PCRE2's own correctness, but it is the one genuinely open RISC-V defect anywhere in PCRE2's dependency chain. |
| [PCRE2 Issue #14](https://github.com/PCRE2Project/pcre2/issues/14) | Add support for the RISC-V architecture | Closed (completed, 2023-01-18) | N/A (feature tracking) | Original RV64 JIT port request; closed once confirmed working on real hardware. |
| PR #583 SIMD concern | "how is this going to affect RISCV, knowing we have a problem there with SIMD that could result in crashes?" | Open (informal; no dedicated issue filed in PCRE2Project/pcre2) | Medium | Raised by carenas in PR #583 review (Nov 2024); zherczeg's reply did not directly address RISC-V. Possibly related to sljit#271, but no comment thread links the two explicitly - treat as a still-open, informally-tracked concern. |
| [PCRE2 Issue #654](https://github.com/PCRE2Project/pcre2/issues/654) | Valgrind JIT conditional jump errors | Open | Low | Manifests on amd64 only; not RISC-V. Listed for completeness, surfaced only by broad semantic search. |
| [PCRE2 Issue #762](https://github.com/PCRE2Project/pcre2/issues/762) | Segfault on ppc64 with JIT and SEAlloc | Open | Low | POWER, not RISC-V; listed for completeness. |

**Zero currently open bugs in the PCRE2Project/pcre2 repository itself are RISC-V-specific.** The one genuinely open RISC-V defect in PCRE2's full dependency chain lives in the vendored sljit project (sljit#271) and, per current code-path analysis, does not reach PCRE2's own runtime behavior. The PR #583 SIMD-crash thread remains informally open with no formal closure statement.

---

## 12. Objections and Upstream Blockers

**Stated objections.** None on record against riscv64 support in general. Maintainers accepted riscv64 CI at the JIT author's own request and merged the only correctness bug report (#831) within 5 days.

**Technical blockers.**
1. **PCRE2-layer SIMD dispatch missing RISC-V** (section 4.2). The four-way architecture guard in `pcre2_jit_simd_inc.h` excludes `SLJIT_CONFIG_RISCV`. This is pure implementation bandwidth, not an architectural objection - sljit's vector infrastructure for RISC-V already exists, though its stability is not yet proven for PCRE2's purposes given the open sljit#271 SIGBUS bug in that same vector path.
2. **CI does not run on pull requests.** A one-line configuration gap (job-level `if:` condition), not a technical blocker; it means riscv64 regressions from contributor PRs are not caught before merge, only on the next push or manual dispatch.
3. **Upstream release process ships no binaries for any architecture.** Not RISC-V-specific; every consumer of every architecture, including amd64 and arm64, must build from source or rely on distro packaging. This is why riscv64's consumable binary comes from Ubuntu/Debian packaging rather than from PCRE2Project directly.

**Organizational blockers.** None identified. Both maintainers are receptive to RISC-V improvements; zherczeg, the sljit author, implemented the RISC-V backend himself and continues to maintain it. The project's track record on riscv64 (issue #14 accepted and shipped, PR #663 added within hours of a maintainer's own request, PR #835 merged within 2 days of the triggering issue) supports a high acceptance probability for well-formed contributions.

**Acceptance probability for new RISC-V contributions.** High, provided patches are well-tested and include CI verification (QEMU-based is sufficient for correctness review; real hardware would be needed to substantiate any performance claim).

---

## 13. Readiness Assessment

- **Color:** blue (N/A)
- **Release provider:** distro
- Not an optimization-purpose project: PCRE2's primary value proposition is Perl-compatible regex correctness and syntax support, not raw speed. The JIT is an optional accelerator and the project is fully functional in interpreted mode without it, so the optimization-level modifier does not apply.
- **Justification:** Upstream CI (`.github/workflows/dev.yml`, the `ptarmigan` "Multiarch" job) both builds and runs PCRE2's full `ctest` suite for riscv64 under full-system QEMU emulation ([uraimo/run-on-arch-action](https://github.com/uraimo/run-on-arch-action)), with JIT, 16/32-bit code units, and shared+static libs all enabled - see [dev.yml](https://github.com/PCRE2Project/pcre2/blob/main/.github/workflows/dev.yml) and the recently-fixed-within-5-days correctness bug [issue #831](https://github.com/PCRE2Project/pcre2/issues/831). Per the color model (CI build = yes, CI test = yes, CI release = no, which yields blue), the only reason this is not green is that PCRE2Project publishes source-only GitHub releases for every architecture (no binaries at all), so the consumable riscv64 binary comes from Linux distro packaging - Ubuntu 26.04 "resolute" ships `libpcre2-8-0`/`-16-0`/`-32-0`/`-dev`/`pcre2-utils` for riscv64 at 10.46-1build1, confirmed by downloading and `file`-inspecting a genuine riscv64 ELF binary (Section 8) - rather than from upstream directly. Release provider is therefore distro, not upstream.
- **Pending work that could change the grade:** riscv64 CI runs only on push/workflow_dispatch, not on pull_request, so a riscv64 regression from a contributor's PR could merge without CI feedback until the next push. Zero open RISC-V-specific bugs remain in PCRE2Project/pcre2 itself (issue #831 was fixed and closed within 5 days; issue #14, the original JIT-port tracking issue, closed completed in 2023) - though one open bug, [zherczeg/sljit#271](https://github.com/zherczeg/sljit/issues/271) (SIGBUS on RVV 1.0 hardware), exists in the vendored sljit dependency's own test suite and does not currently reach PCRE2 because PCRE2 never exercises that code path. PR #939 (merged 2026-09-11) confirms the riscv64 `ptarmigan` CI job is mature/stable relative to other sljit backends still being filled in. No RISE involvement with PCRE2 was found (no RISE blog mentions, no RISE wheel, no RISE runners, not a RISE member). PyPI's `pcre2` package and the RISE wheel builder ship no riscv64 wheels (falls back to source).

---

## 14. Investment Analysis

RISE has no prior investment in PCRE2 (Section 1), so all sizing below covers the full identified gap.

### 14.1 Functional Enablement

PCRE2 is fully functional on riscv64 today: JIT works, all regex operations work, all character encodings work, and the project is confirmed shipping genuine riscv64 binaries via Ubuntu packaging. No functional enablement work is required.

### 14.2 Performance Optimization

The primary, well-defined gap is the missing PCRE2-layer SIMD dispatch for RISC-V:

1. Implement `fast_forward_char_simd`, `fast_requested_char_simd`, and `fast_forward_char_pair_simd` for RISC-V using RVV intrinsics, following the existing x86 (SSE2) and arm64 (NEON) implementations as reference, and add `SLJIT_CONFIG_RISCV` to the guard in `pcre2_jit_simd_inc.h`.
2. Before relying on sljit's generic vector-emission interface for this work, verify or help resolve [zherczeg/sljit#271](https://github.com/zherczeg/sljit/issues/271) (open SIGBUS on RVV 1.0), since that bug sits in the same vector codegen family this work would newly start exercising.
3. Add riscv64-specific tests for the new SIMD paths (QEMU-based is acceptable for correctness; real hardware is required for any performance claim).
4. Establish a baseline benchmark of PCRE2 JIT throughput on riscv64 versus arm64/amd64 - no such benchmark exists anywhere today (Section 6), so the magnitude of the scalar-fallback penalty this work would close is currently unquantified.

### 14.3 CI/CD Infrastructure

Current CI runs riscv64 under QEMU, adequate for correctness but blind to performance regressions and hardware-specific extension interactions (the B+Zicond issue in #831 was caught by a downstream user on real Spacemit hardware, not by upstream CI). Two independent, low-cost improvements:
- Extend the `ptarmigan` job's riscv64 matrix entry (or add a dedicated job) to trigger on `pull_request`, not just `push`/`workflow_dispatch` - a small, low-risk `dev.yml` change that would close the PR-gating gap noted in Sections 3, 7, and 12.
- Consider a native riscv64 hardware runner (RISE-provided or otherwise) to catch extension-specific issues like #831 before they reach users, and to make performance-regression testing possible at all.

### 14.4 Ecosystem Enablement

Not applicable. PCRE2 is a system library distributed as source; its primary consumers (Debian, Ubuntu, Fedora, Alpine) already build and ship riscv64 packages independently of upstream (Section 8). No ecosystem enablement work is required from RISE.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Performance | Implement PCRE2-layer SIMD dispatch for the RVV extension (`pcre2_jit_simd_inc.h` + three fast-path functions) | 3-5 | RISC-V contributor + zherczeg review | High |
| Performance | Establish baseline PCRE2 JIT throughput benchmark on riscv64 vs arm64/amd64 | 1-2 | RISC-V contributor | High |
| Reliability | Investigate/help resolve open sljit vector bug [zherczeg/sljit#271](https://github.com/zherczeg/sljit/issues/271) before building new RVV codegen on top of it | 1-2 | Contributor, coordinated with zherczeg | Medium |
| CI/CD | Enable riscv64 CI on pull requests (small `dev.yml` change to the `ptarmigan` job's `if:` condition) | 0.25 | NWilson or contributor | Medium |
| CI/CD | Evaluate adding a native riscv64 hardware runner to catch extension-specific issues (e.g. the class of bug seen in #831) before users do | 2-3 (setup + maintenance) | RISE infrastructure | Medium |
| Reliability | Formally resolve the informally-open PR #583 SIMD crash concern - confirm it maps to sljit#271 or file a dedicated PCRE2Project/pcre2 issue | 0.25 | Contributor | Low |

---

## 15. References

- [PCRE2 GitHub repository](https://github.com/PCRE2Project/pcre2)
- [PCRE2 homepage](https://www.pcre.org/)
- [sljit GitHub repository (zherczeg)](https://github.com/zherczeg/sljit)
- [Issue #14: Add support for the RISC-V architecture](https://github.com/PCRE2Project/pcre2/issues/14)
- [Issue #831: -march=rv64gcb_zicond causes JIT test failure on RISC-V](https://github.com/PCRE2Project/pcre2/issues/831)
- [Issue #654: Valgrind JIT conditional jump errors (amd64, open)](https://github.com/PCRE2Project/pcre2/issues/654)
- [Issue #762: Segfault on ppc64 with JIT and SEAlloc](https://github.com/PCRE2Project/pcre2/issues/762)
- [PR #583: JIT compiler update](https://github.com/PCRE2Project/pcre2/pull/583)
- [PR #663: Add multiarch build jobs](https://github.com/PCRE2Project/pcre2/pull/663)
- [Commit 971de5f: Add multiarch build jobs (#663)](https://github.com/PCRE2Project/pcre2/commit/971de5f444f011cc2c8dd6ea8275b606f2cbf6f0)
- [PR #835: pcre2test: dynamically allocate buffer for JITTARGET](https://github.com/PCRE2Project/pcre2/pull/835)
- [PR #836: remove VERSION_SIZE](https://github.com/PCRE2Project/pcre2/pull/836)
- [PR #939: Test the remaining JIT backends under QEMU](https://github.com/PCRE2Project/pcre2/pull/939)
- [PR #921: alpha: Add JIT support (tangential, references the riscv64-inclusive ptarmigan job)](https://github.com/PCRE2Project/pcre2/pull/921)
- [zherczeg/sljit issue #271: riscv SIGBUS when running test_simd1 in RVV 1.0 CPU (open)](https://github.com/zherczeg/sljit/issues/271)
- [Gentoo bug 964425: libpcre2 JIT on RISC-V](https://bugs.gentoo.org/964425)
- [Debian bug 1138255 / CVE-2026-42250 (bzip2, architecture-agnostic)](https://bugs.debian.org/cgi-bin/bugreport.cgi?bug=1138255)
- [PCRE2 CI workflow dev.yml (riscv64 ptarmigan job)](https://github.com/PCRE2Project/pcre2/blob/main/.github/workflows/dev.yml)
- [uraimo/run-on-arch-action (QEMU CI action)](https://github.com/uraimo/run-on-arch-action)
- [Ubuntu 26.04 "resolute" PCRE2 packages](https://packages.ubuntu.com/search?keywords=PCRE2&suite=resolute&searchon=names&section=all)
- [Ubuntu ports.ubuntu.com pcre2 pool (riscv64 build history)](https://ports.ubuntu.com/pool/universe/p/pcre2/)
- [PyPI pcre2 package JSON API](https://pypi.org/pypi/pcre2/json)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE project member list](https://riseproject.dev)
- [Arch Linux RISC-V port status](https://archriscv.felixc.at/)