---
title: FreeRTOS
parent: Project Reports
color: orange
dependencies:
  - name: Mbed TLS
    relation: build-dependency
    criticality: optional
  - name: wolfSSL
    relation: build-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="freertos" %}

# FreeRTOS

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for FreeRTOS<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

FreeRTOS is a real-time operating system kernel for microcontrollers and small microprocessors, distributed as C source under the MIT license. It is not foundation-governed: freertos.org states the project is "Maintained by AWS for the benefit of the FreeRTOS community", and all high-volume, ongoing kernel committers (Richard Barry, Gaurav Aggarwal, Ching-Hsin Lee, Rahul Kar, Paul Bartell, Kody Stribrny, Tony Josi) carry @amazon.com addresses. Every pull request in `FreeRTOS/FreeRTOS` and `FreeRTOS/FreeRTOS-Kernel` requires review from the `@FreeRTOS/pr-bar-raisers` team, an AWS-controlled gatekeeper; there is no public MAINTAINERS or GOVERNANCE.md file and no independent board or charter.

FreeRTOS's stance toward new architecture ports is structured but tiered: the kernel splits ports into (1) official/core, reviewed and owned by AWS engineering; (2) `FreeRTOS-Kernel-Partner-Supported-Ports`, unreviewed by the FreeRTOS team but partner-tested and partner-supported; and (3) `FreeRTOS-Kernel-Community-Supported-Ports`, unreviewed and community-supported. RISC-V's original GCC port lives in the official/core tier, but newer RISC-V variants (e.g. `RISC-V_RV32_MPU`) are being routed to the lowest, community-support tier rather than absorbed into AWS-owned core, a pattern consistent with a corporate maintainer that accepts community contributions but does not commit engineering ownership to expanding them.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-06-20 | Original RISC-V GCC port added (commit `3d8d2f3`, "Add RISCV port layer"), authored by Richard Barry (Amazon) | [commit 3d8d2f3](https://github.com/FreeRTOS/FreeRTOS/commit/3d8d2f3cc81130af792d805ba5f292f291c7c0f2) |
| 2021-04-08 | PR #554 merged: RV32/RV64 side-by-side Spike demo improvements | [PR #554](https://github.com/FreeRTOS/FreeRTOS/pull/554) |
| 2022-08-10 | PR #838 merged: fixes ELF32/64 link mismatch and missing debug info in QEMU virt demo | [PR #838](https://github.com/FreeRTOS/FreeRTOS/pull/838) |
| 2023-05-31 | PR #906 merged: same ELF32/64 mismatch fix applied to spike-htif demo, plus RWX-permission linker warnings across three demos | [PR #906](https://github.com/FreeRTOS/FreeRTOS/pull/906) |
| 2025-03-10 | PR #1329 merged (author: SiFive): adds RVA23/RV64/FPU build option to the RV32 QEMU virt demo, gated on companion FreeRTOS-Kernel PR #1250 (FPU context save) | [PR #1329](https://github.com/FreeRTOS/FreeRTOS/pull/1329) |
| 2025-03-31 | PR #1334 merged: adds vector-register (RVV) context-save checking to the same demo, gated on FreeRTOS-Kernel PR #1260 (vector context save) | [PR #1334](https://github.com/FreeRTOS/FreeRTOS/pull/1334) |
| 2026-06-24 | PR #1415 opened (draft, unmerged as of report date): updates the Spike-simulator demo for current OpenOCD/toolchain syntax; author states it stays in draft because "mainline OpenOCD currently does not support FreeRTOS on RISC-V" | [PR #1415](https://github.com/FreeRTOS/FreeRTOS/pull/1415) |

Key contributors by organization: Richard Barry and Gaurav Aggarwal (AWS, core port and QEMU demos), cubidesj (SiFive, RVA23/RV64/FPU/vector demo work, PRs #1329/#1334), Tim Newsome (SiFive, 2021 spike/debug demo work) [NEEDS VERIFICATION - attribution from research synthesis, not independently re-confirmed against a commit log], Microchip-affiliated contributors (PolarFire RV64 hardware demo).

The RISC-V port is upstream and has been since 2018; RV64-specific enablement (FPU and vector context switch) is upstream and merged as of March 2025. No master tracking issue for a "riscv64 port" exists in `FreeRTOS/FreeRTOS`; the work is tracked only through the individual PRs above and their FreeRTOS-Kernel counterparts (#1250, #1260).

## 3. Upstream Support Tier

FreeRTOS has no dedicated riscv64-vs-arm64-vs-amd64 CI tier table because it has no CI for any RISC-V target and no binary release model for any architecture. The tier comparison is therefore about port completeness and CI presence, not release parity.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Native interrupt-driven hardware port | No hardware port in mainline; closest equivalent is `WIN32-MSVC`/`WIN32-MingW`, a host-thread simulator (`CreateThread`, Win32 events/mutexes), not real context switching | `portable/GCC/ARM_AARCH64`, `ARM_AARCH64_SRE`: full hand-tuned assembly ports (1230-1259 LOC) | `portable/GCC/RISC-V`: full hand-tuned assembly port (1672 LOC across portmacro.h, port.c, portContext.h, portASM.S) |
| FPU context switch | N/A (simulator only) | Full | Full (F/D extension, `flw/fld`/`fsw/fsd`, MSTATUS.FS dirty-bit gating) |
| Vector/SIMD context switch | N/A | Not found in this research pass | Full (V/RVV extension, `vsetvl`, group-of-8 `v0-v31` save/restore, dirty-bit gating) - no arm64 or x86 port in this repo has an equivalent |
| CI build/test | N/A | Not the subject of this report | None (see Section 7) |
| Official binary release | N/A (source-zip releases only) | N/A | N/A |

Source: direct inspection of `FreeRTOS-Kernel` at commit `8be86d4a24`, ports cloned to `/home/user/freertos/FreeRTOS-Kernel`.

## 4. Technical Architecture and RISC-V-Specific Subsystems

FreeRTOS is a kernel, not a compute or JIT library, so its architecture-specific surface is limited to the context-switch/trap layer plus a small set of chip-specific extension stubs.

| Component | riscv64 status | ISA extensions used | Quality |
|---|---|---|---|
| Context switch (integer GPR save/restore) | Complete | Base I/E, width-generic via `__riscv_xlen` (32 vs 64) | Hand-tuned assembly; RV64 path uses native `ld`/`sd`, distinct from the RV32 carry-propagation path |
| FPU context | Complete | F/D (`configENABLE_FPU`) | Hand-tuned; MSTATUS.FS dirty-bit tracking to skip unnecessary saves |
| Vector (RVV) context | Complete, context-switch level only | V (`configENABLE_VPU`, gated on `__riscv_vector`) | Hand-tuned; `vsetvl`/`vlenb`-based group save/restore with dirty-bit gating. No compute-side RVV usage anywhere (`vfloat32m1_t`: 0 matches repo-wide) - expected and complete for an RTOS kernel's scope, which is not a math/SIMD library |
| Timer/tick (mtimer compare update) | Complete | CLINT `mtime`/`mtimecmp` | Hand-tuned; RV64 uses a single 64-bit-native instruction sequence vs RV32's two-word carry-propagation workaround |
| Chip-specific extension hooks | Mostly stub | none | `RISCV_no_extensions`, `RV32I_CLINT_no_extensions`, `RISCV_MTIME_CLINT_no_extensions` are no-op stubs; `Pulpino_Vega_RV32M1RM` documents PULP custom CSRs but adds no custom save code |
| Zba/Zbb (bit-manipulation) | Not used in kernel code | Zba/Zbb referenced only as a QEMU CPU-flag string (`-cpu rv64,zba=true,zbb=true,...`) in one demo README, not exercised by any actual code path | N/A |
| `portable/ThirdParty/GCC/RISC-V/` | Stub only | - | 5-line pointer file redirecting to the official GCC/IAR ports; no code |

Comparison table (component-level, riscv64 vs arm64 vs amd64): see Section 3. Bottom line from source inspection: **riscv64 support is complete, not a stub, and is implemented to a higher standard than the equivalent "amd64" offering** (which has no genuine bare-metal port, only a Windows-hosted thread simulator). It is architecturally on par with, and for vector-extension context switching ahead of, the arm64 port.

## 5. Build System, Cross-Compilation, and Toolchain

There is no CMakeLists.txt at the top of `FreeRTOS/FreeRTOS` (it is a demo/submodule umbrella repo). The kernel submodule's CMake build treats RISC-V as one `FREERTOS_PORT` string value among roughly 150, width-agnostic (the caller supplies `-march`/`-mabi` via their own toolchain file). No Dockerfile exists in either repo. There is no genuine "riscv64" CMake target; the real build path is plain GNU Make in the individual demo directories.

**Actual build commands** (from `Demo/RISC-V_RV32_QEMU_VIRT_GCC/build/gcc/Makefile`, the most current demo):
```
export PATH="/YOUR_PATH/riscv64-unknown-elf/bin:${PATH}"
make -C build/gcc/                 # RV32 release build
make -C build/gcc/ DEBUG=1         # RV32 debug build
make -C build/gcc/ RVA23=1         # RV64/RVA23 build (the closest thing to "riscv64")
```
RV64/RVA23 flags used internally: `MARCH = rv64imafdcv_zicsr_zicntr_...`, `MABI = lp64d`, `MCMODEL = medany`.

**Spike-htif demo** (`Demo/RISC-V-spike-htif_GCC/Makefile`) uses explicit width selection:
```
make XLEN=64          # -march=rv64ima -mabi=lp64 -mcmodel=medany
make XLEN=32          # -march=rv32ima -mabi=ilp32 (default)
```

**Toolchain requirement and rationale:** GCC/binutils >= 11.1.0 is required to use the `_zicsr` march suffix, because Zicsr (CSR instructions) was split out of the base "I" ISA in the RISC-V spec, and toolchains before 11.1.0 reject the explicit suffix; the Makefile probes `gcc --version` and falls back to omitting `_zicsr` on older toolchains. Tested toolchain/QEMU versions per demo `Readme.md`: SiFive prebuilt GCC v3.0.4 or `riscv-gnu-toolchain` tag 2025.01.20; `qemu-system-riscv64` v8.2.2 or SiFive prebuilt v3.0.4; host OS Ubuntu 24.04 LTS.

**QEMU invocation (RVA23/RV64):**
```
qemu-system-riscv64 -nographic -machine virt -net none -chardev stdio,id=con,mux=on \
  -serial chardev:con -mon chardev=con,mode=readline -bios none -smp 4 \
  -cpu rv64,zba=true,zbb=true,v=true,vlen=256,vext_spec=v1.0,rvv_ta_all_1s=true,rvv_ma_all_1s=true \
  -s --kernel build/gcc/output/RTOSDemo.elf
```

**Known build failures:** [Issue #830](https://github.com/FreeRTOS/FreeRTOS/issues/830) ("target emulation 'elf32-littleriscv' does not match 'elf64-littleriscv'") and the same root cause fixed again in a different demo by [PR #906](https://github.com/FreeRTOS/FreeRTOS/pull/906): when `LDFLAGS` omits explicit `-march`/`-mabi`, a multilib `riscv64-unknown-elf` toolchain silently falls back to linking against its `rv64gc/lp64d` default libraries even when the objects were compiled RV32, producing an ABI-mismatch link error (and in one report, a linker SIGSEGV). This is a recurring gotcha across multiple demos and multiple years (2022, 2023), not a one-off. `RISC-V_RV64_PolarFire_SoftConsole` is an Eclipse/SoftConsole IDE project (`.cproject`), not a CLI-buildable target, and its debug tooling is currently a self-acknowledged gap: [PR #1415](https://github.com/FreeRTOS/FreeRTOS/pull/1415)'s author kept it in draft because "mainline OpenOCD currently does not support FreeRTOS on RISC-V" and the `riscv-openocd` fork's FreeRTOS support is "outdated and stale."

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Real interrupt-driven hardware port | Absent (simulator only) | Present | Present |
| FPU context switch | N/A | Present | Present |
| Vector context switch | N/A | Not found in this research pass | Present (RVV) - unique among the ports examined |
| SMP / multi-core | Not the subject of this report | Not the subject of this report | Absent - [FreeRTOS-Kernel #370](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/370) "RISC-V SMP Support", open since 2021 |
| Memory protection / user-mode isolation | Not the subject of this report | Not the subject of this report | Absent - [FreeRTOS-Kernel #908](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/908) "RISC-V Kernel Security Isolation" (no MPU/PMP support), and [#97](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/97) confirms all tasks run in M-mode with no U-mode isolation |
| Debug tooling (OpenOCD/GDB) | Not the subject of this report | Not the subject of this report | Gap: no working mainline OpenOCD FreeRTOS-aware support as of PR #1415 (2026-06-24) |
| CI validation | Not the subject of this report | Not the subject of this report | None (Section 7) |

**Performance gap (measured, not RISC-V-vs-other-architecture but RV32-vs-RV64 on the same RISC-V core):** an arXiv paper ("Analyzing RV32/RV64 Trade-offs for FreeRTOS Latency on 8-Stage RISC-V Soft Processors", [arxiv.org/html/2608.00353](https://arxiv.org/html/2608.00353)) measured, on a custom 8-stage RV32IM/RV64IM soft core (Nexys Video FPGA, Artix-7 XC7A200T, 100 MHz, FreeRTOS V11.1.0+, GCC 15.2.0 `-Os`): task-switch latency 320 cycles (RV32) vs 437 cycles (RV64), +36.6%; task preemption latency 1074 vs 1264 cycles, +17.7%; trap-frame size 124 vs 248 bytes (2x), attributed to the doubled register width dominating context save/restore cost. This is a single academic FPGA soft-core data point [NEEDS VERIFICATION], not an industry-standard or real-silicon benchmark, and it does not compare riscv64 against arm64 or amd64.

A related open optimization item, [FreeRTOS-Kernel #1464](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/1464) (open, filed 2026-08-02), proposes skipping unconditional callee-saved register save/restore on the no-context-switch timer-tick path, backed by hardware measurements on a JH7110/U74 board (M-mode, 10,000 samples): median 59 to 50 cycles, mean 155.281 to 144.746 cycles.

**Security hardening gaps:** no MPU/PMP-based memory isolation on RISC-V ([#908](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/908)); all tasks execute in M-mode with no U-mode privilege separation ([#97](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/97), closed as a documentation/scope note but the underlying gap persists per #908 remaining open).

**NaN / floating-point semantics:** no open or closed GitHub issue matched "NaN" specifically for RISC-V. The closest and most concrete correctness issue is [FreeRTOS-Kernel #1327](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/1327) ("Incorrect FPU restore for RISC-V", opened 2025-10-22, closed 2025-11-03): restoring `mstatus` on first task run could flip the FPU status (FS) field from Clean to Dirty even though FPU registers were never saved for that task, corrupting runtime state, confirmed on BL702 hardware. This, combined with a historical forum thread on FPU context-switch support ([FreeRTOS forums](https://forums.freertos.org/t/support-for-fpu-context-switch-in-risc-v/22570)), indicates FPU/mstatus state handling around context switches is a recurring correctness weak point on the RISC-V port, now fixed for the specific #1327 case.

## 7. CI/CD Infrastructure

**Confirmed: no riscv64 CI exists in FreeRTOS/FreeRTOS.** All 7 GitHub Actions workflow files (`auto-release.yml`, `ci.yml`, `core-checks.yml`, `freertos_demos.yml`, `freertos_mpu_demo.yml`, `freertos_plus_demos.yml`, `kernel-unit-tests.yml`) were cloned and read in full, and a case-insensitive grep for "riscv", "risc-v", and "riscv64" across all seven files returned zero matches. A broadened grep for `spike|qemu|rv32|rv64|xuantie|cva6` matched only ARM Cortex-M / QEMU-ARM jobs (e.g. `Build CORTEX_MPU_M3_MPS2_QEMU_GCC Demo`, `FreeRTOS+TCP QEMU ARM MPS2 AN385`). `ci.yml`'s actual jobs are `git-secrets`, `formatting`, `spell-check`, `doxygen`, `verify-manifest`, `memory-statistics`, `proof_ci` (CBMC) - none touch RISC-V. No `.gitlab-ci.yml`, Jenkinsfile, or `.cirrus.yml` exists in the repository. Source: local clone at `/home/user/freertos/freertos`, commit `f4fcc3b228643144727e9257ba12db1cb632b6e6`, workflow files at `.github/workflows/`.

No RISE RISC-V runner usage was found (see Section 12/14 - no RISE involvement of any kind was found for this project).

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI builds | Not the subject of this report | Present (ARM Cortex-M/QEMU-ARM jobs exist) | **None** |
| CI tests | Not the subject of this report | Present for the jobs that exist | **None** |
| Release-blocking | Not the subject of this report | Not determined in this research pass | N/A (no CI at all) |
| Hardware/emulation used | Not the subject of this report | QEMU-ARM (per workflow job names) | N/A - RISC-V demos (RV32/RV64 QEMU virt, spike-htif, PolarFire hardware) exist as source/Makefiles a developer must build manually; none are exercised by any CI job |

The RV64/RVA23/vector demo work (PRs #1329, #1334) is real, working, and validated by the PR authors locally and via QEMU at merge time, but it is not continuously exercised - a future regression in the RISC-V port would not be caught by CI.

## 8. Distribution and Release Status

FreeRTOS ships no binary release for any architecture, riscv64 included. GitHub Releases (`FreeRTOS/FreeRTOS`) were checked directly via the API: every tag (202411.00, 202212.01, 202212.00) contains exactly one asset, a source-code ZIP (`FreeRTOSv<version>.zip`). No release, current or historical, has ever contained a compiled binary of any kind. FreeRTOSv202411.00 (2024-11-21) remains the latest tag as of the report date; no tag has been cut since, meaning PRs #1329, #1334, and #1380 (all merged in 2025) are on `main` but not yet in any numbered release.

Checked and confirmed absent:
- PyPI: [`https://pypi.org/pypi/freertos/json`](https://pypi.org/pypi/freertos/json) returns HTTP 404 - no such package exists.
- RISE Python wheel builder: [`gitlab.com/.../packages/pypi/simple/freertos/`](https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/freertos/) redirects to PyPI, which also 404s.
- Ubuntu 26.04 "resolute": [packages.ubuntu.com search](https://packages.ubuntu.com/search?keywords=FreeRTOS&suite=resolute&searchon=names&section=all) returns "Sorry, your search gave no results."
- Arch Linux RISC-V (archriscv.felixc.at): no reachable search interface returned a positive or negative result [NEEDS VERIFICATION - inconclusive by direct fetch, but no positive evidence found].

**What a user must do to get a working binary:** clone `FreeRTOS/FreeRTOS` (with submodules), install a `riscv64-unknown-elf-*` GCC toolchain (>= 11.1.0), and build one of the demo directories with `make` (optionally `RVA23=1` or `XLEN=64` for a 64-bit target) - there is no other path to a runnable riscv64 FreeRTOS image. This is consistent with FreeRTOS's nature as source-only, per-target-compiled software, not evidence of riscv64 being treated worse than other architectures.

## 9. Dependencies

FreeRTOS/FreeRTOS's dependency manifest is `manifest.yml` (git-submodule based; no CMakeLists.txt/package.json/go.mod/Cargo.toml governs top-level dependencies). Of the full submodule list (kernel, FreeRTOS-Plus-TCP, coreMQTT/coreHTTP/coreJSON/corePKCS11/coreSNTP, AWS IoT SDK C libraries, backoffAlgorithm, TraceRecorder, tinycbor, libslirp, glib, CMock, mbedTLS, wolfSSL), three match the categories relevant to RISC-V readiness (memory allocators, crypto):

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| FreeRTOS-Kernel | Scheduler, context-switch, heap allocators (heap_1-5.c) | Builds on riscv64 (source-level, `__riscv_xlen`-gated); no dedicated riscv64 CI gate | Runs on QEMU riscv64 virt and real RV64 boards manually; no CI | Ships as source in every FreeRTOS release | Open: [Kernel #1464](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/1464) (perf refinement), [#908](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/908) (security isolation gap), [#370](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/370) (no SMP) - all feature gaps, not regressions |
| mbedTLS (pinned v3.5.1) | TLS/crypto backend for FreeRTOS-Plus-TCP, corePKCS11, AWS IoT SDK libs | Generic C fallback builds on riscv64; no RISC-V-specific code path required | No RISC-V-specific hardware-acceleration (Vector Crypto / Zvk*) found | Not applicable (no separate FreeRTOS-shipped mbedTLS binary) | No open riscv64-specific issues found; gap is architectural absence of RVV/Zvk* crypto acceleration, not a defect |
| wolfSSL (pinned v4.5.0-stable) | Alternative TLS/crypto backend | Builds on riscv64 | Has genuine RISC-V assembly acceleration in wolfSSL mainline, with multiple bugs found and fixed through mid-2026 (e.g. [#10525](https://github.com/wolfssl/wolfssl/issues/10525), [#10043](https://github.com/wolfssl/wolfssl/issues/10043)) - but FreeRTOS's pinned v4.5.0-stable (circa 2021) predates all of this work | N/A | The riscv64 story for FreeRTOS's actual vendored wolfSSL is materially worse than for wolfSSL mainline, because the pin has not been bumped to capture the RISC-V assembly fixes |

Note: `Mbed TLS` is the only one of these three tracked in this repository's `projects.yml`, but as of this research pass it has no corresponding `project-reports/mbed-tls.md` file - a gap in the tracking registry, not a finding about FreeRTOS itself.

An Ubuntu 26.04 riscv64 package-graph check (via the `project-graph` MCP tool, for `libmbedtls-dev`/`libwolfssl-dev`) could not be executed - the `project-graph` server failed to connect (`CONNECTION_CLOSED`) throughout this research effort. This is a tool/connection failure, not evidence of package absence, and should be retried.

## 11. Known Bugs and Active Issues

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [FreeRTOS-Kernel #1327](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/1327) | Incorrect FPU restore for RISC-V | Closed (2025-10-22 to 2025-11-03) | Correctness | `mstatus.FS` could go Clean-to-Dirty incorrectly on first task run, corrupting runtime state; confirmed on BL702 |
| [FreeRTOS-Kernel #100](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/100) | "c" extension breaks next-instruction-address-by-4 assumption | Closed | Correctness | Trap handler assumed 4-byte instructions; wrong PC after synchronous exception with RVC compressed instructions |
| [FreeRTOS-Kernel #222](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/222) | Vector-only trap mode (ibex) unsupported | Closed | Correctness | `mtvec` direct-mode assert failed on cores supporting only vectored trap mode |
| [FreeRTOS #830](https://github.com/FreeRTOS/FreeRTOS/issues/830) | elf32-littleriscv vs elf64-littleriscv link mismatch | Closed (2022-08-08) | Build | Recurring multilib-toolchain gotcha, also fixed again separately in PR #906 |
| [FreeRTOS-Kernel #908](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/908) | RISC-V Kernel Security Isolation | Open | Feature gap | No MPU/PMP memory protection on RISC-V |
| [FreeRTOS-Kernel #370](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/370) | RISC-V SMP Support | Open (since 2021) | Feature gap | No official multi-core RISC-V support; abandoned community forks exist (Kendryte K210) |
| [FreeRTOS-Kernel #1464](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/1464) | Defer callee-saved register handling on no-switch timer interrupts | Open (filed 2026-08-02) | Performance | Hardware-measured 59 to 50 median cycles on JH7110/U74; PR pending maintainer feedback |
| [FreeRTOS #1415](https://github.com/FreeRTOS/FreeRTOS/pull/1415) | Update RISC-V Demo for Spike simulator | Open (Draft) | Tooling | Self-blocked pending upstream OpenOCD FreeRTOS/RISC-V support |

Correctness bugs (#1327, #100, #222) are all closed/fixed. The two open feature-gap issues (#908, #370) represent structural absence of security isolation and SMP on RISC-V, not regressions.

## 12. Objections and Upstream Blockers

No stated objection to RISC-V exists in any PR or issue reviewed; reviewers (kstribrnAmzn, jasonpcarroll, aggarg, bhoomrs) approved the RV64/vector work with only process-level questions, not architectural rejection. The most concrete technical/organizational friction points found:

- **Naming/structure debate, unresolved:** in [PR #1329](https://github.com/FreeRTOS/FreeRTOS/pull/1329), reviewer jasonpcarroll raised that the demo directory `RISC-V_RV32_QEMU_VIRT_GCC` now also covers RV64/RVA23 builds, which is misleading; author cubidesj acknowledged the forum had debated this without resolution, proposed a shared-code directory, and the PR was merged with the RV32 name retained. This is cosmetic, not a merge blocker, but signals no settled plan for how RV64 demos should be organized going forward.
- **Tier segregation:** per Section 1, RISC-V's original GCC port is in the AWS-owned core tier, but the formal `Partner-Supported-Ports` repo has no RISC-V entry at all, and newer RISC-V variants are relegated to the unreviewed `Community-Supported-Ports` tier - meaning further RISC-V port expansion does not automatically get AWS engineering review or ownership.
- **Vendor demo rejection:** [PR #1048](https://github.com/FreeRTOS/FreeRTOS/pull/1048) (CVA6 demo) and [PR #620](https://github.com/FreeRTOS/FreeRTOS/pull/620)/[#602](https://github.com/FreeRTOS/FreeRTOS/pull/602) (T-HEAD/Alibaba E906) were closed without merging into `FreeRTOS/FreeRTOS` core; #620 was in fact merged, but into the separate `FreeRTOS-Community-Supported-Demos` repository, per maintainer @aggarg - consistent with the tier-segregation pattern above.
- **Tooling blocker outside FreeRTOS's control:** [PR #1415](https://github.com/FreeRTOS/FreeRTOS/pull/1415)'s author states plainly that mainline OpenOCD has no FreeRTOS-aware RISC-V debug support and the `riscv-openocd` fork is stale - a real-world usability blocker for RISC-V FreeRTOS development that FreeRTOS itself cannot fix.
- **No organizational blocker from AWS:** RISC-V changes have been reviewed and merged promptly (days to weeks) when submitted by capable outside contributors (SiFive); the absence of CI and releases reflects resourcing priority, not rejection.

**Acceptance probability for further RISC-V work:** high for demo-level and port-level contributions following the existing PR pattern (SiFive precedent), given prompt reviews and no architectural objection found. Low-to-none for CI/release infrastructure investment unless a contributor does the work directly, since AWS's own CI/release effort has not touched RISC-V despite the RV64 work having landed 18 months before this report.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI, no distribution or upstream release channel ships FreeRTOS for riscv64, and riscv64 support is not broken)
- **Release provider:** none
- **Justification:** All 7 GitHub Actions workflow files in `FreeRTOS/FreeRTOS` were read directly and contain zero riscv/risc-v/riscv64 references ([workflow directory](https://github.com/FreeRTOS/FreeRTOS/tree/main/.github/workflows)), so there is no upstream CI of any kind for RISC-V. No Linux distribution, PyPI, or RISE wheel builder ships a FreeRTOS riscv64 package (all checked and confirmed absent, Section 8), so the distribution floor does not apply and there is no basis to upgrade from orange to yellow. This is not red: the port itself is confirmed functional and well-implemented (hand-tuned RV64/FPU/vector context-switch code, validated on real PolarFire RV64 hardware and QEMU per Section 4), it is simply never CI-gated or released. FreeRTOS is not an optimization-purpose project (it is an RTOS kernel/runtime, not a math, ML, or codec library), so the Step 2 optimization-coverage cap does not apply and no `Optimization level` header field is included.
- **Pending work that could change the grade:** [PR #1415](https://github.com/FreeRTOS/FreeRTOS/pull/1415) (open, draft) would refresh the Spike-simulator demo but does not add CI. No open PR or issue found proposes adding a riscv64 CI job to any of the 7 workflow files. No RISE involvement of any kind was found (Section 14) - RISE funding or runner adoption for a riscv64 CI job would be the most direct path to yellow or blue, since the underlying port code is already complete and would likely pass tests immediately if CI were added.

## 14. Investment Analysis

RISE has done and funded nothing on FreeRTOS: exhaustive checks of the RISE blog (all 33 posts, plus on-site search for "FreeRTOS" returning "no results were found"), the RISE Python wheel builder page, the `riseproject-dev` GitHub org (25 repos, org-wide code search), and the RISE members list (Amazon/AWS is not a RISE member) all confirm zero RISE engagement. No RISE work needs to be excluded from the sizing below.

### 14.1 Functional Enablement

The functional port (context switch, FPU, vector context-switch, RV64/RVA23 demo) is already complete and merged upstream as of March 2025 (PRs #1329, #1334). Remaining functional gaps are SMP support ([#370](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/370)) and memory protection/PMP isolation ([#908](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/908)), both open feature requests with no assigned owner or timeline. Estimated effort: SMP support for RISC-V, following the pattern of FreeRTOS's existing SMP implementations for other architectures, is a multi-month kernel-level effort, not a small patch - 8-12 person-weeks for a working PMP/MPU-based isolation port targeting a specific reference SoC, and materially more (12-20 person-weeks) for genuine multi-core SMP given the lack of any existing RISC-V SMP reference in the codebase to build from.

### 14.2 Performance Optimization

The one open, hardware-measured performance item ([Kernel #1464](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/1464), deferring callee-saved register handling on no-switch ticks) is small in scope, already has a proposed patch pending maintainer feedback, and needs only review/merge effort: 0.5-1 person-week to shepherd it to merge. Broader RV32-vs-RV64 context-switch overhead (documented in the arXiv paper, Section 6) is an inherent trap-frame-size cost of the wider ISA, not something further RISC-V-specific tuning can eliminate; no additional investment is recommended here beyond monitoring for further micro-optimizations of this kind.

### 14.3 CI/CD Infrastructure

This is the highest-leverage gap: the port is functionally complete but has zero CI coverage, so regressions would go undetected. Adding a riscv64 QEMU-based build-and-test job to `freertos_demos.yml` (mirroring the existing ARM Cortex-M/QEMU-ARM job pattern already in that file) targeting the existing `RISC-V_RV32_QEMU_VIRT_GCC` demo (both RV32 and `RVA23=1` RV64 configurations) is a well-scoped, low-risk addition given the demo and its Makefile already exist and build successfully. Estimated effort: 1-2 person-weeks (workflow authoring, QEMU invocation matching the documented `qemu-system-riscv64 -cpu rv64,zba=true,zbb=true,v=true,...` command from the demo's own Readme, plus getting it past AWS's `pr-bar-raisers` review). This would move the color from orange to blue (build+test CI, still no upstream riscv64 artifact, since FreeRTOS has no binary release model for any architecture) without requiring any port code changes.

### 14.4 Ecosystem Enablement

Not applicable - FreeRTOS has no dependent package ecosystem (no PyPI/npm/Maven consumers; it is a source kernel that application firmware links against directly). Section 10 is omitted per report scope rules.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 QEMU build+test job to `freertos_demos.yml` covering RV32 and RVA23/RV64 configurations | 1-2 | Upstream (AWS) or a sponsoring silicon vendor via PR | Critical |
| Performance | Shepherd [Kernel #1464](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/1464) (defer callee-saved reg handling on no-switch ticks) to merge | 0.5-1 | Upstream (AWS) or issue author | Medium |
| Functional | PMP/MPU-based memory isolation port ([#908](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/908)) for a reference RISC-V SoC | 8-12 | A silicon vendor or RISE-funded contributor | High |
| Functional | RISC-V SMP support ([#370](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/370)) | 12-20 | A silicon vendor or RISE-funded contributor | Medium |
| Tooling | Upstream OpenOCD FreeRTOS-aware RISC-V debug support (blocks [#1415](https://github.com/FreeRTOS/FreeRTOS/pull/1415) from leaving draft) | 2-4 (in OpenOCD, not FreeRTOS itself) | OpenOCD project / a sponsoring contributor | Low-Medium |
| Dependency | Bump vendored wolfSSL pin past v4.5.0-stable to capture upstream RISC-V assembly crypto fixes | 1 | Upstream (AWS) submodule bump | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [FreeRTOS official RISC-V support page](https://www.freertos.org/Using-FreeRTOS-on-RISC-V)
- [FreeRTOS/FreeRTOS repository](https://github.com/FreeRTOS/FreeRTOS)
- [FreeRTOS/FreeRTOS-Kernel repository](https://github.com/FreeRTOS/FreeRTOS-Kernel)
- [Commit 3d8d2f3 - original RISC-V port, 2018-06-20](https://github.com/FreeRTOS/FreeRTOS/commit/3d8d2f3cc81130af792d805ba5f292f291c7c0f2)
- [PR #554 - RV32/RV64 spike demo improvements](https://github.com/FreeRTOS/FreeRTOS/pull/554)
- [Issue #830 - elf32/elf64-littleriscv mismatch](https://github.com/FreeRTOS/FreeRTOS/issues/830)
- [PR #838 - fix qemu riscv build error](https://github.com/FreeRTOS/FreeRTOS/pull/838)
- [PR #906 - fix RISC-V-spike-htif ELF64/32 mismatch and RWX warnings](https://github.com/FreeRTOS/FreeRTOS/pull/906)
- [PR #1048 - Add RISCV CVA6 Demo (closed, unmerged)](https://github.com/FreeRTOS/FreeRTOS/pull/1048)
- [PR #620 - T-HEAD E906 demo (merged into FreeRTOS-Community-Supported-Demos)](https://github.com/FreeRTOS/FreeRTOS/pull/620)
- [PR #602 - Smart-EVB XUANTIE-E906 support (closed, unmerged)](https://github.com/FreeRTOS/FreeRTOS/pull/602)
- [PR #1329 - Update RV32 qemu Demo to support RVA23 (RV64/FPU)](https://github.com/FreeRTOS/FreeRTOS/pull/1329)
- [PR #1334 - Update RISCV qemu demo to check vector context save](https://github.com/FreeRTOS/FreeRTOS/pull/1334)
- [PR #1380 - allow overriding toolchain prefix in RISC-V QEMU virt GCC demo](https://github.com/FreeRTOS/FreeRTOS/pull/1380)
- [PR #1415 - Update RISC-V Demo for Spike simulator (open, draft)](https://github.com/FreeRTOS/FreeRTOS/pull/1415)
- [FreeRTOS-Kernel #1327 - Incorrect FPU restore for RISC-V (closed)](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/1327)
- [FreeRTOS-Kernel #100 - "c" extension instruction-address bug (closed)](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/100)
- [FreeRTOS-Kernel #222 - vector-only trap mode / ibex support (closed)](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/222)
- [FreeRTOS-Kernel #97 - u-mode for RISC-V tasks (closed)](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/97)
- [FreeRTOS-Kernel #908 - RISC-V Kernel Security Isolation (open)](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/908)
- [FreeRTOS-Kernel #370 - RISC-V SMP Support (open)](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/370)
- [FreeRTOS-Kernel #1464 - Defer RISC-V callee-saved register handling (open)](https://github.com/FreeRTOS/FreeRTOS-Kernel/issues/1464)
- [FreeRTOS forums - Support for FPU context switch in RISC-V](https://forums.freertos.org/t/support-for-fpu-context-switch-in-risc-v/22570)
- [arXiv 2608.00353 - Analyzing RV32/RV64 Trade-offs for FreeRTOS Latency on 8-Stage RISC-V Soft Processors](https://arxiv.org/html/2608.00353)
- [FreeRTOS GitHub Actions workflows directory](https://github.com/FreeRTOS/FreeRTOS/tree/main/.github/workflows)
- [GitHub Releases - FreeRTOS/FreeRTOS](https://github.com/FreeRTOS/FreeRTOS/releases)
- [PyPI - freertos (404, package does not exist)](https://pypi.org/pypi/freertos/json)
- [Ubuntu packages.ubuntu.com search - FreeRTOS in resolute (no results)](https://packages.ubuntu.com/search?keywords=FreeRTOS&suite=resolute&searchon=names&section=all)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [wolfSSL #10525 - RISC-V assembly alignment issues (closed)](https://github.com/wolfssl/wolfssl/issues/10525)
- [wolfSSL #10043 - Load64Unaligned unaligned load faults on RISC-V (closed)](https://github.com/wolfssl/wolfssl/issues/10043)