---
title: RT-Thread
parent: Project Reports
color: blue
dependencies:
  - name: Mbed TLS
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: musl
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="rt-thread" %}

# RT-Thread

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-08<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for RT-Thread<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

RT-Thread is an open-source, Apache-2.0-licensed real-time operating system (RTOS) for embedded systems, written in C and distributed as source only (no CMakeLists.txt at the repo root; the native build system is SCons + Kconfig). It is founded and steered by Shanghai Real-Thread Inc., the company behind the project ([Shanghai Real-Thread Inc. GitHub org profile](https://github.com/BernardXiong)). There is no neutral foundation, no published `GOVERNANCE.md`, and no formal board or technical-steering-committee document was found in the repository or on [rt-thread.io](https://www.rt-thread.io/). The project self-describes only as "open-source, neutral, and community-based."

Corporate sponsorship is two-tiered per the [rt-thread.io homepage](https://www.rt-thread.io/): Premier Members (CEVA-DSP, STMicroelectronics, NXP, plus additional logo-only partners) and Ecosystem Members (LVGL, Open Hardware Group, plus additional logo-only partners). The site claims 248 contributors.

Governance culture toward new ports is open and PR-driven: there is no formal tiering document (no `PLATFORMS.md`/`SUPPORT.md`/Tier 1-2-3 classification). New boards and vendor SDKs are accepted via ordinary PR review with `CODEOWNERS`-based auto-assignment, subject only to a structural [BSP Contribution Guide](https://github.com/RT-Thread/rt-thread/blob/master/documentation/7.contribution/bsp_contribution_guide_en.md) (directory layout, no duplicate vendor SDK copies). Vendor-submitted BSPs (e.g., UltraRISC's own `bsp/ultrarisc`) are merged as ordinary community contributions.

RT-Thread is **not a RISE (RISC-V Software Ecosystem) member** (checked against RISE's Premier and General member lists) and has received no RISE funding, blog coverage, or RFP investment (see Section 12).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2017-07-17 | Earliest RISC-V commit: SiFive HiFive1/FE310 port begins (`libcpu/risc-v/e310/context_gcc.S`), author zhangjun1996 | Commit search on RT-Thread/rt-thread history |
| 2018-05-29 | HiFive1/E310 port removed | [PR #1484](https://github.com/RT-Thread/rt-thread/pull/1484), merged by Bernard Xiong |
| 2019-08-26 | GD32VF103 (RISC-V) BSP added | PR #2980, author Guozhanxin |
| 2020-11-22/23 | K210 (Canaan Kendryte) FPU support and T-Head-Smart (RV32) BSP added | Commit history, authors tangweikang/balanceTWK |
| 2024-07-12 to 2024-09-11 | Unification of C906/virt64 ports (predecessor to "common64") | [PR #9181](https://github.com/RT-Thread/rt-thread/pull/9181) merged |
| 2025-04-23 to 2025-05-08 | vDSO support added for riscv64 | [PR #10219](https://github.com/RT-Thread/rt-thread/pull/10219) merged |
| 2025-05-23 | Master umbrella refactor PR opened | [PR #10320](https://github.com/RT-Thread/rt-thread/pull/10320) - still OPEN as of 2026-09-08 |
| 2025-06-09 to 2025-06-22 | C906 VIRT64 BSP added | [PR #10374](https://github.com/RT-Thread/rt-thread/pull/10374) merged |
| 2025-07-17 | Restartable syscalls for riscv64 | [PR #10518](https://github.com/RT-Thread/rt-thread/pull/10518) merged |
| 2025-09-22 | "RISC-V TODO LIST" tracking issue opened | [Issue #10722](https://github.com/RT-Thread/rt-thread/issues/10722) |
| 2025-12-04 | SMP support lands on master for qemu-virt64-riscv, via a direct (non-PR-merge) commit | Commit [acef64e](https://github.com/RT-Thread/rt-thread/commit/acef64ed2a30bd1b2c832114dde7d9b1f5b9a509); the originating [PR #10887](https://github.com/RT-Thread/rt-thread/pull/10887) closed unmerged, superseded by [PR #11015](https://github.com/RT-Thread/rt-thread/pull/11015) (merged) |
| 2026-02-25/26 | T-Head/XuanTie C908X BSP and Svpbmt extension support | [PR #11219](https://github.com/RT-Thread/rt-thread/pull/11219), [PR #11227](https://github.com/RT-Thread/rt-thread/pull/11227) merged |
| 2026-03-10 | Successor roadmap issue opened by PR #10320's author | [Issue #11246](https://github.com/RT-Thread/rt-thread/issues/11246) |
| 2026-08-18/28 | C908 RT-Smart (MMU/userspace) support | [PR #11719](https://github.com/RT-Thread/rt-thread/pull/11719) merged |
| 2026-09-07 | OSPP 2026 proposal for lazy FP/RVV context switching | [Issue #11786](https://github.com/RT-Thread/rt-thread/issues/11786) |

Key contributors and organizations: GuEe-GUI (architecture lead for the RISC-V refactor, organization unstated), Yaochenger/WangShun (sole current maintainer of `libcpu/risc-v`, organization unstated), Bernard Xiong (founder, Shanghai Real-Thread Inc.), zhangjing0303 (UltraRISC, email domain ultrarisc.com, contributed DP1000 platform work), unicornx and Rbb666 (reviewers/maintainers).

**Is it fully upstream?** Partially. Core riscv64 support (context switch, MMU, interrupt controllers, SMP for one BSP) is merged to `master`. The comprehensive architectural refactor (PR #10320, unifying RV32/RV64, ISA bitmap management, unified interrupt controllers, non-zero-core boot) is explicitly **not** merged and is being staged as a long-lived development branch with maintainer agreement to extract smaller PRs incrementally (see Section 12). [PR #10320](https://github.com/RT-Thread/rt-thread/pull/10320) has been open since 2025-05-23 (over 15 months) with no merge date.

## 3. Upstream Support Tier

No formal tier policy exists (no `PLATFORMS.md`/`SUPPORT.md`). In practice, riscv64 is treated as a first-class but community-maintained architecture: it has dedicated CI (Section 7), a dedicated maintainer (`libcpu/risc-v`, Yaochenger), and multiple active vendor BSPs, but no upstream-published binary release and open correctness bugs specific to SMP/real hardware (Section 11).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | N/A (RT-Thread targets embedded MCU/SoC, not host amd64) | Yes, extensive BSP matrix (STM32, NXP, etc.) | Yes ([bsp_buildings.yml](https://github.com/RT-Thread/rt-thread/blob/master/.github/workflows/bsp_buildings.yml)) |
| CI runs tests | N/A | Data not available: not in scope of this riscv64-focused research | Yes, boots under `qemu-system-riscv64` and gates on utest pass/fail ([utest_auto_run.yml](https://github.com/RT-Thread/rt-thread/blob/master/.github/workflows/utest_auto_run.yml)) |
| Official binary release | N/A | No (source tarballs only) | No (source tarballs only) |
| SMP support | N/A | Data not available | Only on `qemu-virt64-riscv` BSP; hartid-in-satp implementation acknowledged by maintainer GuEe-GUI as breaking Smart/MMU builds on real hardware ([PR #10887 discussion](https://github.com/RT-Thread/rt-thread/pull/10887)) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

RT-Thread's riscv64 support is substantial and not a stub. Core architecture code lives in `libcpu/risc-v/` (34 files, ~12,448 lines):

| Subdirectory | Purpose | Completeness |
|---|---|---|
| `common/` | Generic RV32 port base, A-extension atomics (`amoswap`/`amoadd`/`amoor`) | Complete, documented in a 187-line porting guide |
| `common64/` | Generic RV64 (Sv39) port base: MMU (1088 lines), ASID support, trap handling, SBI ecall interface v1.0, CSR/privileged-ISA v1.12 definitions | Complete, primary 64-bit path |
| `rv64/` | Older/minimal RV64 variant, parallel/legacy path | Complete but being superseded per [Issue #11246](https://github.com/RT-Thread/rt-thread/issues/11246) |
| `vector/rvv-1.0/` | RVV 1.0 kernel context save/restore (vstart/vtype/vl/vcsr + v0-v31) for `ARCH_VECTOR_VLEN_128/256` | Complete for kernel context-switch scope; no application-level SIMD/intrinsics dispatch exists (0 hits for `vfloat32m1_t` in the codebase) |
| `t-head/c906/`, `t-head/c908/` | Vendor CPU ports (T-Head/XuanTie) | Complete, ~1000+ lines each |
| `virt64/` | QEMU virt64 board CPU port (PLIC spec v1.0.0) | Complete, backs `bsp/qemu-virt64-riscv` |

Additional arch-specific code: `components/lwp/arch/risc-v/rv64/` (RT-Smart process context switch, signal handling, clone/fork), `components/lwp/vdso/user/arch/risc-v/` (vDSO), `components/libc/posix/libdl/arch/riscv.c` (relocation handling for `dlopen`-style loading, static relocation only, not a JIT).

**Confirmed absent:** No JIT backend anywhere in the tree (not applicable to an RTOS kernel). No RVV/SIMD intrinsics dispatch library for application code. No Zba/Zbb/Zbc/Zbs bit-manipulation extension code found anywhere.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Context switch / trap handling | N/A | Data not available (out of scope) | Hand-written assembly (`context_gcc.S`, `interrupt_gcc.S`), complete |
| MMU | N/A | Data not available | Sv32/39/48/57/64 supported in the unmerged refactor (PR #10320); merged code supports Sv39 |
| SMP | N/A | Data not available | Present only for `qemu-virt64-riscv`; correctness bug open (#11226) on real silicon |
| Vector/SIMD | N/A | Data not available | RVV 1.0 kernel context save/restore only; no compute-kernel dispatch |
| Atomics | N/A | Data not available | A-extension inline asm in `atomic_riscv.c`, xlen 32/64 |

## 5. Build System, Cross-Compilation, and Toolchain

RT-Thread uses **SCons + Kconfig**, not CMake. No root `CMakeLists.txt`, no `BUILDING.md`, no riscv64 cmake toolchain file, and no riscv64-specific Dockerfile exist anywhere in the repository (verified by direct file inspection of a clone at HEAD `7fa651b`).

**Build commands** (from [bsp/qemu-virt64-riscv/README.md](https://github.com/RT-Thread/rt-thread/blob/master/bsp/qemu-virt64-riscv/README.md)):
```
cd rt-thread/bsp/qemu-virt64-riscv
scons --menuconfig
scons -j$(nproc)
```
CI adds `scons --pyconfig-silent -C <bsp>` then `scons -j$(nproc) --strict -C <bsp>` (warnings-as-errors).

**Toolchain versions** (pinned in CI, from `.github/workflows/utest_auto_run.yml` and `bsp_buildings.yml`):

| Variant | Toolchain | Version | Source |
|---|---|---|---|
| Standard bare-metal ELF | `riscv64-unknown-elf-toolchain` | GCC 10.2.0 | `github.com/RT-Thread/toolchains-ci` release v1.4 |
| rt-smart (musl) | `riscv64-unknown-linux-musl-gcc` | musl-gcc | `toolchains-ci` v1.7 |
| Xuantie C906 rt-smart | Xuantie-900 fork | gcc-linux-6.6.0-musl64 | `toolchains-ci` v1.9 |

Compile flags: `-mcmodel=medany -march=rv64imafdc -mabi=lp64 -ffreestanding`. Link: `-nostartfiles -Wl,--gc-sections -T link.lds -static`. No Clang path is documented for riscv64.

**QEMU usage:** CI's actual test invocation is `qemu-system-riscv64 -nographic -M virt -kernel rtthread.bin` (plus `-smp` for the SMP leg), piped to a log tailed for `[FAILED]` markers and `[utest] finished`, 20-minute timeout ([utest_auto_run.yml](https://github.com/RT-Thread/rt-thread/blob/master/.github/workflows/utest_auto_run.yml)).

**Known build failures:** [Issue #10028](https://github.com/RT-Thread/rt-thread/issues/10028) - latest riscv musl toolchain produced a non-functional "hello world" build (closed/resolved 2026-02-04). No riscv64 Dockerfile exists; the only `.devcontainer/Dockerfile` in the repo targets `arm-none-eabi-gcc`/QEMU-ARM, unrelated to riscv64.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 status | Notes |
|---|---|---|
| Bare-metal (M-mode) execution | Working | Core path |
| RT-Smart (userspace/MMU) | Working, actively expanding (C908 added Aug 2026) | [PR #11719](https://github.com/RT-Thread/rt-thread/pull/11719) |
| SMP | Working only on `qemu-virt64-riscv`; broken on real silicon | [Issue #11226](https://github.com/RT-Thread/rt-thread/issues/11226): hartid stored in `satp` violates RISC-V privileged spec when `satp.MODE=0`, works under QEMU emulation but breaks on the UltraRISC dp1000 board |
| Nested interrupts | Not supported on CLIC controllers | [Issue #10457](https://github.com/RT-Thread/rt-thread/issues/10457), open since 2025-07-04 |
| TLS (thread-pointer init) | Not initialized | [Issue #7820](https://github.com/RT-Thread/rt-thread/issues/7820), open since 2023-07-14, still unresolved per [Issue #11246](https://github.com/RT-Thread/rt-thread/issues/11246) checklist |
| Lazy FP/RVV context switching | Absent - full FPU state saved/restored unconditionally on every context switch regardless of use; RVV vector state is not part of thread context at all, meaning any thread using V instructions has state silently corrupted on switch | [Issue #11786](https://github.com/RT-Thread/rt-thread/issues/11786), filed 2026-09-07 as an OSPP 2026 proposal, not yet fixed |
| pthread cancellation (RT-Smart musl) | Broken | [Issue #10492](https://github.com/RT-Thread/rt-thread/issues/10492): `__syscall_cp` doesn't implement cancellation-point detection; `pthread_cancel` loops forever on qemu-riscv64 rt-smart |
| Filesystem on qemu-virt64-riscv | Malfunctioning | [Issue #11237](https://github.com/RT-Thread/rt-thread/issues/11237): reboot/poweroff misbehave after filesystem creation |

**Performance gap:** the unconditional full-FPU-register save/restore on every context switch (Issue #11786) is a documented, acknowledged inefficiency, not yet quantified with benchmark numbers (see Section 11).

**NaN/floating-point:** no NaN-specific or floating-point-correctness defect was found in this research; the only floating-point-related open item is the context-switch completeness gap above (Issue #11786), which is a performance/completeness issue, not a correctness/NaN defect.

**Security hardening gaps:** Data not available: no riscv64-specific hardening research (ASLR, stack protector, CFI) was performed in this session beyond the correctness bugs listed above.

## 7. CI/CD Infrastructure

Verified by direct file read of `.github/workflows/bsp_buildings.yml` and `.github/workflows/utest_auto_run.yml` at HEAD `7fa651b` (not from search results or issue text).

- **`bsp_buildings.yml`**: triggers on `push`/`pull_request` to `master` (plus `repository_dispatch`/`workflow_dispatch`). Runs on `ubuntu-22.04` (x86, GitHub-hosted). Cross-compiles riscv64 BSPs (`qemu-virt64-riscv`, K230, allwinner d1s, ultrarisc, bluetrum) via `scons`. **Build-only** - no execution.
- **`utest_auto_run.yml`**: triggers on `push`/`pull_request` to `master`, path-filtered to include `bsp/qemu-virt64-riscv/**`, `bsp/xuantie/virt64/c906/**`, `components/**`, `libcpu/**`, `src/**`, `tools/**`. Runs on `ubuntu-22.04`. Cross-compiles the riscv64 kernel then **boots it under `qemu-system-riscv64`** in three configurations (standard, rtsmart, smp) plus a T-Head XuanTie C906 QEMU boot, and gates the run on the in-VM utest suite completing (`"[utest] finished"`) without `[FAILED]` markers, 20-minute timeout. This is genuine test execution under emulation, not build-only verification.

No RISE RISC-V Runners are used ([riscv-runners.riseproject.dev](https://riscv-runners.riseproject.dev/) does not list RT-Thread as a user, and its runners are Ubuntu 24.04/Scaleway EM-RV1 hardware, distinct from RT-Thread's `ubuntu-22.04`+QEMU CI). No native riscv64 hardware runner exists anywhere in the CI.

| | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build | N/A | Yes (extensive BSP matrix) | Yes |
| CI test execution | N/A | Data not available (out of scope) | Yes, via `qemu-system-riscv64` boot + utest gate |
| Release-blocking | Data not available | Data not available | Yes for `master` push/PR (both workflows trigger on `push`/`pull_request` to `master`, not `workflow_dispatch`-only) |
| Hardware used | N/A | Data not available | GitHub-hosted x86 runner + QEMU emulation; no native riscv64 silicon |

## 8. Distribution and Release Status

RT-Thread ships **source only**. GitHub Releases for `RT-Thread/rt-thread` contain only `v5.2.2.zip`/`v5.2.2.tar.gz`-style source archives (checked v5.2.2 and v5.2.1 asset lists) - no riscv64 (or any-architecture) prebuilt binaries, consistent with its nature as a cross-compiled-per-board embedded RTOS.

- **PyPI**: `https://pypi.org/pypi/rt-thread/json` returns HTTP 404 - no such package exists (expected; RT-Thread is a C RTOS, not a Python package).
- **RISE wheel builder**: redirects to the same 404 PyPI page - no package.
- **Ubuntu 26.04 (resolute)**: search for `rt-thread`/`python3-rt-thread`/`librt-thread` returns "Sorry, your search gave no results" - no package for any architecture.
- **Arch Linux RISC-V** (archriscv.felixc.at): no package found.
- **npm/Maven/OCI**: not applicable (C RTOS, no such channels used).

**What a user must do to get a working riscv64 binary:** clone the source, install the CI-pinned toolchain (Section 5), select or write a BSP for their target riscv64 chip, run `scons --menuconfig` then `scons`, and flash/boot the resulting `rtthread.bin`/`.elf` themselves. There is no path to a pre-built consumable riscv64 artifact from any upstream, distro, or third-party channel.

## 9. Dependencies

RT-Thread has no single dependency manifest (no `CMakeLists.txt`/`setup.py`/`go.mod`/`Cargo.toml` at repo root). Dependencies are vendored/optional via Kconfig/SConscript.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Community/notes |
|---|---|---|---|---|---|
| Mbed TLS | Crypto/TLS backend (`components/net/sal`, `PKG_USING_MBEDTLS`) | Portable C, no riscv64-specific code paths | No dedicated riscv64 CI found; only 4 GitHub issues match "riscv64," all closed/old, one architecture-generic (2020, #3066, closed) | Ships as part of normal releases, no riscv64-specific notes | None open specific to riscv64 |
| zlib | Optional compression backend for `RT_USING_DFS_CROMFS` (commented out by default) | Builds as portable C on riscv64; an RVV-accelerated Adler32 patch exists but is unmerged | OpenBSD/riscv64 added to zlib's own CI matrix (merged 2026-01-28) - covers zlib itself, not exercised through RT-Thread's CROMFS path | v1.3.2 (2026-02-17) shipped the CI change, zero riscv64 source changes | [PR #1099](https://github.com/madler/zlib) (RVV Adler32, opened 2025-10-28) stalled unanswered; see `project-reports/zlib.md` |
| musl (rt-smart libc, `git.musl-libc.org`) | libc backend for RT-Smart's riscv64gc toolchain | musl has native riscv64 support since 2018 | Not independently tested by musl upstream for RT-Thread's custom toolchain build | No RT-Thread-specific musl release; tracks whatever riscv64gc toolchain RT-Thread ships | [Issue #10492](https://github.com/RT-Thread/rt-thread/issues/10492): custom toolchain's `__syscall_cp` lacks cancellation-point support |

**Note:** `project-graph` MCP server (Ubuntu 26.04 riscv64 SPARQL index) failed to connect (`CONNECTION_CLOSED`) throughout this research effort - none of the "riscv64 availability" data points above are graph-verified; this is a connectivity gap, not confirmation of absence, and should be re-run when the server is reachable.

lwIP (vendored TCP/IP stack, `components/net/lwip`) is arguably RT-Thread's most critical vendored dependency but did not match the JIT/SIMD/numerics/crypto/compression/allocator filter applied and was not deep-dived in this research.

## 10. Ecosystem Status

Not applicable. RT-Thread is a standalone embedded RTOS/kernel distributed as source with vendored/optional components managed through its own package mechanism (`RT-Thread-packages`); it does not have a significant external dependent package ecosystem (npm, PyPI, Maven, Kubernetes operators) whose riscv64 enablement would need separate tracking. Section omitted per instructions.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#11786](https://github.com/RT-Thread/rt-thread/issues/11786) | Lazy FP/RVV context switching for RISC-V (OSPP 2026 idea) | Open (filed 2026-09-07) | Performance/Correctness | Unconditional full FPU save/restore on every switch; RVV state not part of thread context at all - threads using V instructions get silently corrupted state on switch |
| [#11226](https://github.com/RT-Thread/rt-thread/issues/11226) | riscv64 SMP hartid save invalid | Open (2026-02-25) | Correctness | `satp` misused to store hartid, violates privileged spec when `satp.MODE=0`; works on QEMU, breaks on real silicon (ur-dp1000) |
| [#10457](https://github.com/RT-Thread/rt-thread/issues/10457) | riscv interrupt could not be nested | Open (2025-07-04) | Correctness | CLIC nested interrupts switch to task-stack instead of staying on interrupt-stack, risking corruption |
| [#10526](https://github.com/RT-Thread/rt-thread/issues/10526) | arch_signal_quit implementation risk on riscv64 | Open (2025-07-18) | Correctness/SMP race | Kernel-stack address stored in user stack; sibling hart running a co-thread can corrupt it |
| [#10492](https://github.com/RT-Thread/rt-thread/issues/10492) | RT-Smart riscv64gc toolchain `__syscall_cp` lacks cancellation-point support | Open (2025-07-10) | Correctness (toolchain) | `pthread_cancel` never terminates the thread on qemu-riscv64 rt-smart |
| [#9992](https://github.com/RT-Thread/rt-thread/issues/9992) | Signal-handling example crashes on qemu-virt64-riscv | Open (2025-02-14) | Correctness | Suspected libcpu support gap |
| [#11237](https://github.com/RT-Thread/rt-thread/issues/11237) | Filesystem malfunction on qemu-virt64-riscv | Open (2026-03-06) | Correctness | reboot/poweroff misbehave after filesystem creation |
| [#7820](https://github.com/RT-Thread/rt-thread/issues/7820) | Thread-pointer (TLS) not initialized in RISC-V port | Open (2023-07-14) | Correctness | Still tracked unresolved in Issue #11246's active checklist |
| [#5060](https://github.com/RT-Thread/rt-thread/issues/5060) | riscv context switch interrupt error | Closed | Correctness | `mstatus` interrupts re-enabled before x4-x31 fully restored during context switch - a corruption window; closed with no visible fix/discussion in fetched content, verify current status before relying on resolution |
| [#10722](https://github.com/RT-Thread/rt-thread/issues/10722) | RISC-V TODO LIST (umbrella) | Open (2025-09-22) | Tracking | FP optimization, RVV 0.7/1.0, RVA23 profile, SMP, SpacemiT K1 |
| [#11246](https://github.com/RT-Thread/rt-thread/issues/11246) | RISC-V near-term adjustments (umbrella) | Open (2026-03-10) | Tracking | Successor roadmap rolling up items above |

**Correctness bugs highlighted separately:** #11226 (SMP hartid, breaks real hardware), #10457 (interrupt nesting), #10526 (SMP signal-quit race), #7820 (TLS), #9992 (signal-handling crash), #11237 (filesystem) are all open, confirmed correctness defects, not merely feature gaps.

## 12. Objections and Upstream Blockers

The master umbrella refactor, [PR #10320](https://github.com/RT-Thread/rt-thread/pull/10320) ("[ARCH/RISC-V] Next RISC-V"), has been open since 2025-05-23 with explicit maintainer objections:

- **unicornx (reviewer/maintainer, 2025-05-24):** stated the PR is too large to review safely ("这个 PR 改动也太大了，我感觉很难 review") and asked for it to be split into at least 10 independent PRs matching its stated scope, warning that merging such a large change at once could break other RISC-V products (especially T-Head) without a clear migration plan.
- **BernardXiong (founder/maintainer, 2025-05-26):** raised a fundamental architecture objection, questioning whether RV32/RV64 should be merged at all and whether the approach would actually let RISC-V vendors converge going forward.
- **GuEe-GUI (author, 2025-05-24):** argued the change cannot be split without risking an endless "kernel chases BSP, BSP chases kernel" cycle, and that a from-scratch rewrite is the only way to fix RT-Thread's RISC-V maintainability debt.
- **Resolution (2025-05-25):** unicornx and GuEe-GUI agreed to keep the work on a long-lived development branch (`next_riscv`), periodically rebased to `master`, with smaller independently-mergeable features extracted and submitted separately over time - this is the exact origin of the current incremental-extraction model, later formalized in [Issue #11246](https://github.com/RT-Thread/rt-thread/issues/11246).

A concrete instance of this friction: [PR #10887](https://github.com/RT-Thread/rt-thread/pull/10887) (SMP for qemu-virt64-riscv) was closed **unmerged** after (a) automated Copilot review flagged the non-standard use of `satp` to store hartid as risking MMU interference, (b) GuEe-GUI raised the same architectural objection directly, (c) maintainer Rbb666 caught a genuine Smart-SMP CI regression, and (d) MuChenger objected to duplicated `atomic_riscv.c` code. The functionality was rebased into [PR #11015](https://github.com/RT-Thread/rt-thread/pull/11015) (merged) rather than merging #10887 directly - PR-level correctness gates did work here, at the cost of the original PR never merging.

**Organizational blockers:** RT-Thread's RISC-V architecture layer has a single named maintainer (Yaochenger/WangShun) per `MAINTAINERS`/`.github/CODEOWNERS`, concentrating review capacity. There is no RISE involvement, funding, or CI runner usage (confirmed across the RISE blog, member list, wheel builder, and `riseproject-dev` GitHub org - see below).

**Acceptance probability:** the core, narrower SMP/BSP contributions have a demonstrated path to merge (multiple PRs landed in 2025-2026). The comprehensive architectural refactor (PR #10320) has an agreed-upon, if slow, incremental path via extraction; there is no indication it will be rejected outright, but no committed timeline exists either.

**RISE involvement: confirmed zero.** Checked and found no reference to RT-Thread in: the complete [RISE blog post index](https://riseproject.dev/blog) (34 posts, May 2024-Aug 2026), the [RISE RISC-V Runners page](https://riscv-runners.riseproject.dev/), the [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/) (~73 packages, no RTOS content), RISE's Premier/General member lists, and a GitHub org-wide code search of `riseproject-dev`'s 25 public repos (2 incidental hits only: an unauthored backlog queue entry in `sw-ecosystem/project-reports/.queue.yml`, and a passing mention of "rt-thread smart" as a third party's bug-report target inside the unrelated `libffi.md` project report).

## 13. Readiness Assessment

- **Color:** blue (no sub-case)
- **Release provider:** none - no upstream, distro, or third-party channel publishes a consumable riscv64 binary artifact of RT-Thread. GitHub Releases carry only source tarballs (v5.2.2.zip/tar.gz), consistent with RT-Thread's cross-compiled-per-board embedded RTOS distribution model; there is no PyPI, Ubuntu 26.04, or Arch Linux RISC-V package.
- **Optimization level:** not applicable - RT-Thread is a general-purpose embedded RTOS/kernel, not an optimization-purpose project per the Step 2 test (it delivers its core value - real-time scheduling, portability, driver framework - independent of RISC-V-specific vectorization or hand-tuned kernels). The Step 2 modifier is not triggered, and `optimization_gap` = N/A.
- **Justification:** upstream CI on `master` push/PR both cross-compiles riscv64 BSPs ([bsp_buildings.yml](https://github.com/RT-Thread/rt-thread/blob/master/.github/workflows/bsp_buildings.yml), build-only) and, critically, actually **boots the compiled kernel under `qemu-system-riscv64` and gates on an in-VM utest suite passing** ([utest_auto_run.yml](https://github.com/RT-Thread/rt-thread/blob/master/.github/workflows/utest_auto_run.yml)), verified by direct read of the workflow YAML rather than issue text or README claims. This clears the "build-only" ceiling that would otherwise cap the project at yellow, and satisfies "CI builds + tests pass" for the blue tier. It does not reach green because no upstream (or distro, or third-party) channel publishes a riscv64 artifact - RT-Thread ships source only, and users must cross-compile per target BSP themselves, which is inherent to its distribution model rather than a fixable release gap.
- **Pending work that could change the grade:** the master umbrella refactor [PR #10320](https://github.com/RT-Thread/rt-thread/pull/10320) remains open (staged as a long-lived dev branch with incremental extraction, per maintainer agreement) and, if it or its extracted sub-PRs eventually land, would fix the SMP-on-real-hardware bug (#11226), unify Sv39/48/57/64 MMU support, and add proper AIA/CLIC/ACLINT interrupt-controller support - none of which would change the color (still capped by the release-provider gap) but would resolve most of Section 11's correctness bugs. RISE has zero involvement; if RISE were to fund a riscv64 board-farm CI leg on real silicon (addressing the "works on QEMU, breaks on real hardware" pattern seen in #11226) or sponsor prebuilt reference images, that could eventually change `release_provider` from `none`.

## 14. Investment Analysis

RISE has funded zero work on RT-Thread (Section 12). No existing RISE investment needs to be excluded from sizing below.

### 14.1 Functional Enablement

- Fix SMP hartid-in-satp violation of the privileged spec so SMP works on real silicon, not just QEMU ([#11226](https://github.com/RT-Thread/rt-thread/issues/11226)).
- Add CLIC nested-interrupt support, replacing the current fast-in/fast-out-only model ([#10457](https://github.com/RT-Thread/rt-thread/issues/10457)).
- Fix thread-pointer/TLS initialization in the RISC-V port, open since 2023 ([#7820](https://github.com/RT-Thread/rt-thread/issues/7820)).
- Fix RT-Smart musl toolchain's `__syscall_cp` to support pthread cancellation points ([#10492](https://github.com/RT-Thread/rt-thread/issues/10492)).
- Fix qemu-virt64-riscv filesystem/reboot misbehavior ([#11237](https://github.com/RT-Thread/rt-thread/issues/11237)) and signal-handling crash ([#9992](https://github.com/RT-Thread/rt-thread/issues/9992)).
- Support incremental extraction of PR #10320's unified MMU (Sv32/39/48/57/64) and AIA/CLIC/ACLINT interrupt-controller consolidation, following the agreed incremental-PR process.

### 14.2 Performance Optimization

- Implement lazy FP/RVV context-switch save-restore using `mstatus.FS`/`mstatus.VS` dirty bits, closing the gap identified in [#11786](https://github.com/RT-Thread/rt-thread/issues/11786) (currently an open OSPP 2026 proposal with no assigned engineer as of this report's date).
- Add RVV vector-register state to thread context tracking (currently silently corrupted on context switch for any thread using V instructions) - this is a correctness fix with performance implications, not purely an optimization.
- No RVV compute-kernel/intrinsics library exists for application-level use; if a use case requires vectorized application code atop RT-Thread, this would need to be built from scratch (out of scope for the RTOS kernel itself).

### 14.3 CI/CD Infrastructure

- Add native riscv64 hardware to CI (current CI runs cross-compiled binaries under QEMU only, on x86 GitHub-hosted runners) - would catch real-silicon issues like #11226 that QEMU emulation does not surface.
- Extend `utest_auto_run.yml` test-execution coverage to additional BSPs beyond `qemu-virt64-riscv` and XuanTie C906 (e.g., SpacemiT K1, per [Issue #10722](https://github.com/RT-Thread/rt-thread/issues/10722)'s TODO list).
- Data not available: no analysis performed on whether RISE RISC-V Runners could be adopted for this CI (would require RT-Thread to opt in; no such discussion found).

### 14.4 Ecosystem Enablement

Not applicable - Section 10 was omitted as RT-Thread has no significant dependent package ecosystem requiring separate riscv64 enablement tracking.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix SMP hartid-in-satp spec violation for real silicon ([#11226](https://github.com/RT-Thread/rt-thread/issues/11226)) | 2-4 | RT-Thread riscv arch maintainer | Critical |
| Functional | Fix CLIC nested-interrupt handling ([#10457](https://github.com/RT-Thread/rt-thread/issues/10457)) | 2-3 | RT-Thread riscv arch maintainer | High |
| Functional | Fix thread-pointer/TLS init ([#7820](https://github.com/RT-Thread/rt-thread/issues/7820)) | 1 | RT-Thread riscv arch maintainer | High |
| Functional | Fix RT-Smart musl `__syscall_cp` cancellation support ([#10492](https://github.com/RT-Thread/rt-thread/issues/10492)) | 1-2 | Toolchain owner | Medium |
| Functional | Fix qemu-virt64-riscv filesystem/reboot bug ([#11237](https://github.com/RT-Thread/rt-thread/issues/11237)) | 1-2 | RT-Thread riscv arch maintainer | Medium |
| Performance | Implement lazy FP/RVV context switching ([#11786](https://github.com/RT-Thread/rt-thread/issues/11786)) | 3-5 | OSPP contributor / RT-Thread maintainer | High |
| Performance | Add RVV vector-register state to thread context (correctness+perf) | 3-5 | RT-Thread riscv arch maintainer | Critical |
| CI/CD | Add native riscv64 hardware CI leg | 2-3 (infra) | Infra/RISE (if engaged) | Medium |
| CI/CD | Extend utest execution to additional riscv64 BSPs (SpacemiT K1, etc.) | 2-4 | RT-Thread BSP maintainers | Low |
| Architectural | Support incremental extraction of PR #10320 (unified MMU/ISA/interrupt controllers) | Ongoing, multi-quarter | GuEe-GUI + reviewers | Medium |

## 15. Updates

No updates yet - initial report dated 2026-09-08.

## 16. References

- [PR #10320 - [ARCH/RISC-V] Next RISC-V](https://github.com/RT-Thread/rt-thread/pull/10320)
- [Issue #10722 - RISC-V TODO LIST](https://github.com/RT-Thread/rt-thread/issues/10722)
- [Issue #11246 - RISC-V near-term adjustments](https://github.com/RT-Thread/rt-thread/issues/11246)
- [Issue #8358 - rt-smart for riscv64 TODO list (closed)](https://github.com/RT-Thread/rt-thread/issues/8358)
- [Issue #11786 - OSPP 2026 idea: Lazy FP/RVV context switching](https://github.com/RT-Thread/rt-thread/issues/11786)
- [Issue #11226 - riscv64 SMP hartid save invalid](https://github.com/RT-Thread/rt-thread/issues/11226)
- [Issue #11237 - qemu-virt64-riscv filesystem malfunction](https://github.com/RT-Thread/rt-thread/issues/11237)
- [Issue #11693 - fence instruction during context switch discussion](https://github.com/RT-Thread/rt-thread/issues/11693)
- [Issue #10457 - riscv interrupt could not be nested](https://github.com/RT-Thread/rt-thread/issues/10457)
- [Issue #10161 - RISC-V toolchain discussion](https://github.com/RT-Thread/rt-thread/issues/10161)
- [Issue #9851 - qemu-virt64-riscv SMP support request (closed)](https://github.com/RT-Thread/rt-thread/issues/9851)
- [Issue #10028 - riscv musl toolchain hello-world failure (closed)](https://github.com/RT-Thread/rt-thread/issues/10028)
- [Issue #7820 - thread-pointer not initialized](https://github.com/RT-Thread/rt-thread/issues/7820)
- [Issue #10526 - arch_signal_quit implementation risk](https://github.com/RT-Thread/rt-thread/issues/10526)
- [Issue #10492 - RT-Smart riscv64gc toolchain __syscall_cp issue](https://github.com/RT-Thread/rt-thread/issues/10492)
- [Issue #9992 - qemu-risc64 signal example crash](https://github.com/RT-Thread/rt-thread/issues/9992)
- [Issue #5060 - riscv context switch interrupt error (closed)](https://github.com/RT-Thread/rt-thread/issues/5060)
- [PR #10887 - Qemu-virt64-riscv BSP support SMP architecture (closed, unmerged)](https://github.com/RT-Thread/rt-thread/pull/10887)
- [PR #11015 - SMP support for qemu-virt64-riscv (merged)](https://github.com/RT-Thread/rt-thread/pull/11015)
- [PR #11229 - fix mmu pte configuration](https://github.com/RT-Thread/rt-thread/pull/11229)
- [PR #11305 - Fix PLIC interrupt processing order](https://github.com/RT-Thread/rt-thread/pull/11305)
- [PR #11227 - Support RISC-V Standard Svpbmt Extension](https://github.com/RT-Thread/rt-thread/pull/11227)
- [PR #11219 - Feat/xuantie c908x](https://github.com/RT-Thread/rt-thread/pull/11219)
- [PR #11719 - c908 support rt-smart](https://github.com/RT-Thread/rt-thread/pull/11719)
- [PR #10374 - ADD C906 VIRT64 BSP SUPPORT](https://github.com/RT-Thread/rt-thread/pull/10374)
- [PR #10219 - Add VDSO functionality under riscv64](https://github.com/RT-Thread/rt-thread/pull/10219)
- [PR #10518 - restartable system calls for riscv64](https://github.com/RT-Thread/rt-thread/pull/10518)
- [PR #9181 - Unify c906 and virt64 architecture portings](https://github.com/RT-Thread/rt-thread/pull/9181)
- [PR #9067 - rv64 ARCH_REMAP_KERNEL support](https://github.com/RT-Thread/rt-thread/pull/9067)
- [PR #1484 - remove hifive1 bsp and risc-v/e310 porting](https://github.com/RT-Thread/rt-thread/pull/1484)
- [Commit acef64e - SMP support for qemu-virt64-riscv](https://github.com/RT-Thread/rt-thread/commit/acef64ed2a30bd1b2c832114dde7d9b1f5b9a509)
- [bsp_buildings.yml workflow file](https://github.com/RT-Thread/rt-thread/blob/master/.github/workflows/bsp_buildings.yml)
- [utest_auto_run.yml workflow file](https://github.com/RT-Thread/rt-thread/blob/master/.github/workflows/utest_auto_run.yml)
- [bsp/qemu-virt64-riscv/README.md](https://github.com/RT-Thread/rt-thread/blob/master/bsp/qemu-virt64-riscv/README.md)
- [BSP Contribution Guide](https://github.com/RT-Thread/rt-thread/blob/master/documentation/7.contribution/bsp_contribution_guide_en.md)
- [MAINTAINERS file](https://github.com/RT-Thread/rt-thread/blob/master/MAINTAINERS)
- [rt-thread.io homepage](https://www.rt-thread.io/)
- [RISE blog index](https://riseproject.dev/blog)
- [RISE RISC-V Runners page](https://riscv-runners.riseproject.dev/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [PyPI rt-thread package check (404)](https://pypi.org/pypi/rt-thread/json)
- [Ubuntu package search - no results](https://packages.ubuntu.com/search?keywords=RT-Thread&suite=resolute&searchon=names&section=all)
- [RISC-V International blog - RT-Thread: Pioneering RTOS for RISC-V](https://riscv.org/blog/rt-thread-pioneering-real-time-operating-system-for-risc-v/)
- [zlib project report (RVV Adler32 status)](https://github.com/madler/zlib)
