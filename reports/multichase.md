---
title: multichase
---

# multichase

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for multichase<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

multichase is a memory latency and bandwidth benchmark developed at Google, published under the Apache-2.0 license at [github.com/google/multichase](https://github.com/google/multichase). It ships four executables: `multichase` (pointer-chase memory latency; default: 256 MB array, 256-byte stride, 2.5 s, 1 thread), `multiload` (superset covering bandwidth and loaded-latency modes), `pingpong` (inter-core cache-line exchange latency), and `fairness` (atomic increment contention).

The project is a lean C (gnu99) tool with no external library dependencies beyond system glibc and libpthread. There is no versioned release history (zero GitHub releases), no distribution packaging, and no CI of any kind. It is consumed exclusively as a source build.

**Governance.** The project uses an informal, Google-internal maintainer model. There is no MAINTAINERS, OWNERS, CODEOWNERS, or SUPPORT.md file. All external contributions require signing the Google CLA. The sole merge authority is `seranian` (Stephane Eranian, Google), who has 33 commits and was last active 2026-07-15. Supporting Google committers include `CmdrMoozy` (Axel Rasmussen, 10 commits), `asteinha` (Anthony Steinhauser, 9 commits), and `soleen` (Pasha Tatashin, 5 commits). Non-Google contributors have landed commits historically: `antonblanchard` (Anton Blanchard, Tenstorrent, 3 commits) and `shay-cavium` (Shay Gal-On, Cavium/Marvell, 2 commits for the AArch64 port in 2017).

**Community culture on new ports.** The AArch64 port (2017, Cavium contributor) was reviewed and merged. The RISC-V PR has received an active code review with changes requested, indicating the maintainer is willing to merge riscv64 support but requires code quality to meet the bar of existing arch implementations. The project has no stated policy against new architecture ports.

**RISE involvement.** None. The RISE project website has no mention of multichase. multichase is not listed in the RISE wheel builder. Neither the PR author nor the reviewer has visible RISE affiliation. Google is a RISE Premier Member, but multichase is not a RISE-funded initiative.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2017 | AArch64 port merged by `shay-cavium` (Cavium/Marvell) | [github.com/google/multichase commits](https://github.com/google/multichase/commits/master) [NEEDS VERIFICATION - exact date from commit log not extracted] |
| 2025-07-15 | PR #49 "Try to add support code for riscv64" opened by `pengjunjie2100` (Sanechips/ZTE, peng.junjie1@sanechips.com.cn), tested on SpacemiT X60 board | [PR #49](https://github.com/google/multichase/pull/49) |
| 2025-07-15 | Google CLA bot flagged unsigned CLA; merge blocked | [PR #49](https://github.com/google/multichase/pull/49) |
| 2025-08-21 | PR author requested CI workflow approval from `seranian` | [PR #49](https://github.com/google/multichase/pull/49) |
| 2025-08-26 | `seranian` submitted CHANGES_REQUESTED review; author pushed fixes same day | [PR #49](https://github.com/google/multichase/pull/49) |
| 2026-08-14 (today) | PR #49 still open; no RISC-V code in master branch | [github.com/google/multichase](https://github.com/google/multichase) |

**RISC-V is not upstream.** Zero riscv-related commits exist in the master branch. The entire RISC-V effort is contained in one open PR from a single community contributor employed at ZTE's Sanechips subsidiary.

## 3. Upstream Support Tier

No formal tier or platform support policy document exists. Support tiers must be inferred from CI coverage, release artifacts, and codebase completeness.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Arch-specific code in master | Yes (all components) | Yes (all components) | No (none merged) |
| Dedicated CI pipeline | No CI exists | No CI exists | No CI exists |
| Release-blocking | N/A (no releases) | N/A (no releases) | N/A |
| Official binary artifacts | None | None | None |
| Open porting PR | N/A | N/A | PR #49 (open, 13 months) |

The project has no CI for any architecture. By the absence of CI, riscv64 is not uniquely disadvantaged relative to other platforms in that dimension. However, amd64 and arm64 have fully implemented arch-specific code paths merged into master; riscv64 has none.

**Effective support tier for riscv64:** Unsupported / community-in-progress. The project compiles and runs on riscv64 for most chase modes (via generic C fallbacks), but the branch-chase mode aborts at runtime, and no arch-specific optimizations are present.

## 4. Technical Architecture and RISC-V-Specific Subsystems

multichase contains five categories of arch-specific code. None are implemented for riscv64 in the master branch.

| Component | File | amd64 | arm64 | riscv64 (master) | riscv64 (PR #49, unmerged) |
|---|---|---|---|---|---|
| `cpu_relax()` spin-wait hint | `cpu_util.h` | `rep; nop` | `yield` | Missing - `#warning` + no-op stub | `asm volatile("pause")` using Zihintpause extension |
| JIT branch-chase emitter | `br_asm.c` | MOV imm64/RAX + JMP/RET byte emission | MOVZ/MOVK/BR/RET byte emission | Missing - `fprintf(stderr, "Not implemented"); exit(1)` | LUI+JALR+RET byte emission (see correctness note below) |
| Instruction cache flush | `multichase.c` | Not needed (guarded out) | `__builtin___clear_cache` | Missing - guarded out with `#if defined(__aarch64__)` | Merged into existing aarch64 `__builtin___clear_cache` block |
| Non-temporal store | `multiload.c` | `_mm_stream_si64` (SSE2) | `stnp` | Missing - plain scalar C `a[i] = b[i] + c[i]` | `sd` (Store Doubleword) inline asm (no cache-bypass semantics) |
| Build system arch detection | `Makefile` | Implicit | SVE/LSE/Zihintpause detection via `uname` | Missing - no riscv64 block | `/proc/cpuinfo` probe for `zihintpause`; sets `-march=rv64gc_zihintpause` |

**ISA extensions used by existing arch code:**
- amd64: SSE2 (`_mm_stream_si64`), `rep; nop`
- arm64: LSE atomics, SVE, non-temporal stores (`stnp`), `yield`
- riscv64: no extensions used in master; PR #49 uses Zihintpause (`pause`) and proposes no RVV, no Zicbom

**Quality assessment of PR #49 riscv64 JIT (br_asm.c):** The `riscv64_emit_lui_a0_imm64` function in PR #49 emits only the upper 32 bits of a 64-bit address into a single LUI instruction. A standard LUI has a 20-bit immediate field and loads bits [31:12]; loading a full 64-bit pointer requires a multi-instruction sequence (LUI + ADDI + SLLI + ADDI, or equivalent). The PR's implementation will produce incorrect machine code for addresses that use more than the upper 32 bits. Reviewer `seranian` did not flag this issue - the review focused on style (duplicate code blocks, missing asm comments). This is a correctness bug in the unmerged PR.

**Quality assessment of PR #49 non-temporal store (multiload.c):** The implementation uses a plain `sd` (Store Doubleword) instruction. RISC-V has no non-temporal store instruction in the base ISA or in any ratified extension. The implementation is functionally equivalent to the generic C scalar fallback; it provides no cache-bypass semantics. This is accurate to document as "riscv64 path present" but it does not implement the intended benchmark behavior.

**`cpu_relax()` ISA dependency:** The PR's `pause` instruction requires `-march=rv64gc_zihintpause`. Without this flag, the assembler will reject it. The Makefile probe (`grep zihintpause /proc/cpuinfo`) correctly conditions the flag, but `/proc/cpuinfo` ISA string formatting varies across Linux distributions on riscv64 - this may not be reliable on all targets [NEEDS VERIFICATION].

**RVV status:** No RVV code exists in multichase for any purpose, and PR #49 does not add any. The benchmark does not use SIMD for its core workload (pointer chasing is inherently serial). RVV is not a gap.

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** GNU Make only. Single flat Makefile at the repo root. No CMake, no autoconf, no configure script. (Note: PR #42, adding CMake support, has been open since 2024-07-23 and is not merged.)

**Native build (any supported arch):**
```
make
```
The Makefile auto-detects arch via `ARCH ?= $(shell uname -m)`. Output binaries: `multichase`, `multiload`, `fairness`, `pingpong`. All are statically linked (`LDFLAGS=-static`).

**Cross-compile for riscv64 (with PR #49 applied):**
```
make ARCH=riscv64 CC=riscv64-linux-gnu-gcc
```
Setting `CC` to a cross-compiler is sufficient. All other flags (`-std=gnu99 -O3 -static -pthread`) are generic. The static link requires glibc, libpthread, librt, and libm in the riscv64 sysroot.

**To include Zihintpause support in a cross build (Makefile probe is native-only):**
```
make ARCH=riscv64 CC=riscv64-linux-gnu-gcc \
  "CFLAGS=-std=gnu99 -g -O3 -fomit-frame-pointer -fno-unroll-loops -Wall \
  -Wstrict-prototypes -Wmissing-prototypes -Wshadow -Wmissing-declarations \
  -Wnested-externs -Wpointer-arith -W -Wno-unused-parameter -Werror \
  -pthread -Wno-tautological-compare -march=rv64gc_zihintpause"
```

**Toolchain version requirements:**
- Base riscv64 build (no Zihintpause): GCC >= 7 (first version with riscv64 backend support) [NEEDS VERIFICATION - exact minimum GCC version for riscv64]
- With `-march=rv64gc_zihintpause`: GCC >= 11.1 or Clang >= 14 (Zihintpause was ratified 2021 and added to GCC 11 and Clang 14) [NEEDS VERIFICATION]
- `__builtin___clear_cache`: in GCC since 4.3; not version-constrained in practice

**QEMU:** No QEMU instructions appear anywhere in the repo or PR. PR #49 was tested natively on a SpacemiT X60 board, not under QEMU. No known QEMU-specific issues are documented.

**Known -D flags / feature disablement:** None. The Makefile has no preprocessor defines and no optional feature flags.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Basic pointer-chase latency (`simple`, `stream-sum`, etc.) | Full | Full | Full (generic C) |
| Branch-chase mode (`-c branch`) | Full | Full | Crashes: `exit(1)` on master; PR #49 has incorrect JIT |
| Loaded latency (`multiload`) | Full | Full | Full (generic C fallback) |
| Non-temporal stream-triad | Full (`_mm_stream_si64`) | Full (`stnp`) | Scalar store only (no cache-bypass semantics) |
| Spin-wait efficiency (`cpu_relax`) | Full (`rep; nop`) | Full (`yield`) | No-op fallback on master; Zihintpause on PR #49 |
| Instruction cache management for branch mode | N/A | Full | Missing on master; in PR #49 |
| Ping-pong (inter-core latency) | Full | Full | Full (no arch-specific code needed) |
| Fairness (atomic contention) | Full | Full | Full (no arch-specific code needed) |
| Build system arch tuning | Full | Full (SVE/LSE detection) | Missing on master; partial in PR #49 |
| Static binary output | Yes | Yes | Yes (generic) |

**Functional gaps:**
- Branch-chase mode is non-functional on riscv64 (master branch). This mode measures branch misprediction latency and branch predictor characteristics - a meaningful workload for CPU microarchitecture evaluation.

**Performance gaps:**
- The non-temporal store path in `multiload` degrades to a plain scalar store on riscv64. The intended workload (cache-bypass write bandwidth) cannot be measured with correct semantics. The measured number will reflect normal write-allocate cache behavior, not streaming write bandwidth.
- `cpu_relax()` is a no-op on riscv64 master. In spin-wait loops this increases power draw and can interfere with SMT scheduling. The effect on benchmark accuracy is workload-dependent but non-zero.

**Security hardening gaps:** Data not available: no security hardening flags were searched in the Makefile or source.

**Floating-point / NaN semantics:** Not applicable. multichase uses no floating-point arithmetic in its benchmark critical path. `libm` is used only for `log2`/`lround` in sizing the branch-mode code buffer.

## 7. CI/CD Infrastructure

The google/multichase repository has **no CI configuration of any kind**. The complete root directory contains 22 files, none of which are CI configuration. There is no `.github/` directory. The GitHub API returns HTTP 404 for `.github/workflows`. No `.travis.yml`, `.cirrus.yml`, Jenkinsfile, or equivalent exists.

| CI Dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Automated build check | None | None | None |
| Automated test run | None | None | None |
| RISE runners | N/A | N/A | N/A |
| Hardware tested | Manual (Google infra, unreported) | Manual (Google infra, unreported) | SpacemiT X60 (PR author only, manual) |

PR #49's author explicitly requested that `seranian` approve the CI workflow run on 2025-08-21. As of the last recorded activity (2025-08-26), there is no record of approval and no CI results in the PR. Since the repo has no CI configuration, this request is moot - there is no workflow to approve.

The absence of CI is uniform across all architectures. riscv64 is not uniquely disadvantaged on this dimension relative to amd64 or arm64.

## 8. Distribution and Release Status

**GitHub releases:** Zero. The repository has zero tags and zero releases. Verified by `gh api "repos/google/multichase/releases"` returning `[]`.

**PyPI:** HTTP 404. multichase is not a Python project and has never been published to PyPI.

**RISE wheel builder:** Not listed. multichase is not a Python wheel.

**Debian:** HTTP 404 on [tracker.debian.org/pkg/multichase](https://tracker.debian.org/pkg/multichase). multichase is not packaged in Debian in any suite.

**Ubuntu 24.04 (noble):** No results at packages.ubuntu.com. Not packaged.

**Arch Linux RISC-V:** Not found at [archriscv.felixc.at](https://archriscv.felixc.at/?q=multichase).

**What a user must do to get a working riscv64 binary:**
1. Clone the repo from [github.com/google/multichase](https://github.com/google/multichase)
2. Apply PR #49 manually (or accept the master branch limitations: no branch mode, no `cpu_relax`)
3. Build natively on riscv64 hardware or cross-compile: `make ARCH=riscv64 CC=riscv64-linux-gnu-gcc`
4. The result is a set of statically-linked binaries that can be copied to the target

There is no package manager path to multichase on any platform. It has always been source-only.

## 9. Dependencies

multichase is deliberately lean. All runtime dependencies are components of system glibc.

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| glibc / libc | `mmap`, `mbind`, `pthread_create`, `clock_gettime`, `random_r`, standard C stdlib | Fully supported | Supported | Released | None |
| libpthread (glibc NPTL) | Threading: `pthread_create`, mutexes, barriers | Fully supported (NPTL on riscv64 since glibc 2.17+) [NEEDS VERIFICATION] | Supported | Released | None |
| librt (glibc) | `clock_gettime` POSIX realtime clocks | Fully supported | Supported | Released | None |
| libm (glibc) | `log2`, `lround` for branch-mode buffer sizing | Fully supported | Supported | Released | None |
| Linux kernel (`mbind`, `mmap`, THP, huge pages) | NUMA memory binding, memory-mapped arenas, transparent huge pages | riscv64 NUMA merged (kernel 5.x+); THP functional | Supported | Released | None |

No dependency has a riscv64 gap that would block multichase. All transitive dependencies ship in standard riscv64 Linux distributions.

## 11. Known Bugs and Active Issues

The issues tracker is disabled on google/multichase. All bug reports appear as PRs.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [PR #49](https://github.com/google/multichase/pull/49) | Try to add support code for riscv64 | Open, changes requested | Blocker for riscv64 branch mode | JIT address loading is incorrect for 64-bit pointers; CLA unsigned; no re-approval after author addressed review comments |
| [PR #55](https://github.com/google/multichase/pull/55) | Fix 32-bit count wrap in chase counter | Open | High - correctness | Per-thread chase counter is `uint32_t`; wraps at 2^32 iterations; at L1-cache speeds the counter overflows within a 500 ms sample window, inflating reported latency. Affects all architectures including riscv64. |
| [PR #53](https://github.com/google/multichase/pull/53) | fix the scalar for load_stream_triad | Open | High - correctness | The stream-triad load pattern (`a[i] = b[i] + scalar * c[i]`) is missing the scalar multiplication; runs as stream-add. Benchmark results for this mode are incorrect vs documented semantics. Affects all architectures. |

**Correctness bugs affecting riscv64 benchmark validity:**
- PR #55 (counter wrap) will corrupt L1/L2 latency measurements on riscv64 hardware capable of >69 GB/s pointer-chase throughput. This is relevant for high-performance riscv64 server chips.
- PR #53 (missing scalar in stream-triad) makes multiload bandwidth comparisons invalid for this specific mode on all architectures.
- PR #49 JIT bug: the `riscv64_emit_lui_a0_imm64` function in the unmerged PR emits truncated addresses. Branch-chase mode on riscv64 will produce incorrect machine code for all pointer values that use more than 32 bits of address space.

## 12. Objections and Upstream Blockers

| Blocker | Type | Status | Path to resolution |
|---|---|---|---|
| Google CLA unsigned | Administrative / legal | Active | Contributor `pengjunjie2100` (Sanechips/ZTE) must sign at cla.developers.google.com |
| CHANGES_REQUESTED not re-approved | Process | Active | Author pushed fixes 2025-08-26 but `seranian` has not submitted a follow-up APPROVED review; requires maintainer attention |
| JIT correctness bug (truncated 64-bit address in LUI) | Technical | Active, not yet flagged by maintainer | Requires correct multi-instruction address loading sequence in `br_asm.c` |
| No CI to validate riscv64 implementation | Infrastructure | Active | No CI exists for any architecture; riscv64 CI would need to be added; RISE runners are available but not configured |
| Single maintainer bandwidth | Organizational | Chronic | `seranian` is the sole merge authority; PR #49 received first review 13 months after opening |

**Acceptance probability:** Moderate. The maintainer has reviewed the PR and provided constructive feedback rather than rejecting it. The AArch64 precedent shows Google does accept arch ports from external contributors. The CLA and JIT correctness issues are the concrete blockers; neither is insurmountable. The 13-month lag before first review reflects maintainer bandwidth constraints rather than opposition to the port.

## 13. Investment Analysis

RISE has no involvement in multichase. No prior investment to account for.

### 13.1 Functional Enablement

Two items block fully functional riscv64 support:

1. **JIT correctness fix in `br_asm.c`:** The LUI+JALR sequence in PR #49 must be replaced with a correct 64-bit address loading sequence. Standard approach: LUI (loads bits 31:12), ADDI (adds bits 11:0 of lower 32), then SLLI+ADDI iterations for the upper 32 bits. Alternatively, use a 6-instruction auipc+ld trampoline table approach. This requires knowledge of RISC-V instruction encoding and must be validated on actual hardware.

2. **CLA and review resolution:** Engaging with Sanechips/ZTE to get the CLA signed, or submitting a clean independent patch that supersedes PR #49 (the new patch author would need to sign the CLA separately).

### 13.2 Performance Optimization

The non-temporal store path (`load_stream_triad_nontemporal_injection_delay`) cannot be meaningfully optimized on riscv64 because RISC-V has no non-temporal store instruction in any ratified ISA extension. The `sd` fallback in PR #49 is functionally the best available option. This is not a fixable gap - it is an architectural limitation of the RISC-V ISA as of 2026. The benchmark mode's semantics cannot be replicated exactly on riscv64.

No RVV optimization is applicable to multichase's core workloads (pointer-chase latency is inherently serial).

### 13.3 CI/CD Infrastructure

No CI exists for any architecture. Adding riscv64 CI via RISE runners (announced March 2026) would provide automated build and functional test coverage. This would be the first CI in the project and would require maintainer buy-in to add the `.github/workflows` directory.

### 13.4 Ecosystem Enablement

Not applicable. multichase is a standalone tool with no ecosystem of plugins or extensions.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix JIT 64-bit address loading in `br_asm.c` (correct LUI+JALR sequence for riscv64) | 1 | RISC-V arch engineer | Critical |
| Functional | Resolve CLA blocker and get corrected PR merged (coordinate with Sanechips/ZTE or submit independent patch) | 1 | Ecosystem / community manager | Critical |
| Functional | Fix PR #55: `uint32_t` counter wrap corrupting L1/L2 latency results | 0.5 | Any contributor | High |
| Functional | Fix PR #53: missing scalar in stream-triad multiload mode | 0.5 | Any contributor | High |
| CI/CD | Add GitHub Actions CI with riscv64 RISE runner (build + basic functional test) | 1 | CI engineer | Medium |
| Performance | Document non-temporal store limitation on riscv64 (no ISA equivalent to `stnp`/`_mm_stream_si64`) | 0.25 | RISC-V arch engineer | Low |

## 14. Updates

No updates yet - initial report dated 2026-08-14.

## 15. References

- [multichase GitHub repository](https://github.com/google/multichase)
- [PR #49: Try to add support code for riscv64](https://github.com/google/multichase/pull/49)
- [PR #53: fix the scalar for load_stream_triad](https://github.com/google/multichase/pull/53)
- [PR #55: Fix 32-bit count wrap in chase counter](https://github.com/google/multichase/pull/55)
- [RISE project website](https://riseproject.dev)
- [RISE RISC-V Runners announcement (March 2026)](https://riseproject.dev/blog)
- [Google CLA portal](https://cla.developers.google.com/)
- [Arch Linux RISC-V package search](https://archriscv.felixc.at/?q=multichase)
- [Debian package tracker (multichase - absent)](https://tracker.debian.org/pkg/multichase)
- [Ubuntu 24.04 package search (multichase - absent)](https://packages.ubuntu.com/search?keywords=multichase&suite=noble&searchon=names&section=all)