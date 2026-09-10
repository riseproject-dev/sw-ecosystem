---
title: OpenOCD
parent: Project Reports
color: yellow
dependencies:
  - name: jimtcl
    relation: runtime-dependency
    criticality: optional
  - name: capstone
    relation: runtime-dependency
    criticality: optional
  - name: libusb
    relation: runtime-dependency
    criticality: critical
  - name: hidapi
    relation: runtime-dependency
    criticality: optional
  - name: libftdi
    relation: runtime-dependency
    criticality: optional
  - name: libgpiod
    relation: runtime-dependency
    criticality: optional
  - name: libjaylink
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="openocd" %}

# OpenOCD

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for OpenOCD<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

OpenOCD (Open On-Chip Debugger) is a host-side program that bridges JTAG/SWD debug adapters (ST-Link, CMSIS-DAP, FTDI-based probes, J-Link, GPIO-bitbang probes, etc.) to a target CPU's on-chip debug module, exposing a GDB remote-serial-protocol server plus a Tcl command console. It is the de facto open-source debug backend used by GDB, Eclipse Embedded CDT, PlatformIO, and most embedded toolchains.

**Governance.** OpenOCD has no foundation affiliation (not Linux Foundation, Eclipse, Apache, or RISE Project). It is a self-hosted, independent GPL-2.0-or-later project (`COPYING`, `SPDX-License-Identifier: GPL-2.0-or-later`). All code review happens on Gerrit at [review.openocd.org](https://review.openocd.org/q/project:openocd+status:open); discussion is on the `openocd-devel@lists.sourceforge.net` mailing list; bug tracking is on SourceForge. `openocd-org/openocd` on GitHub is an explicitly labeled "Official OpenOCD Read-Only Mirror (no pull requests)" - it has zero GitHub Issues and zero GitHub Pull Requests by design; only merged commits are mirrored. There is no MAINTAINERS, OWNERS, CODEOWNERS, GOVERNANCE.md, PLATFORMS.md, or SUPPORT.md file in the repository. Maintainer status is informal and earned through review activity - active reviewers currently include Antonio Borneo, Tomas Vanek, and Marc Schink, who merge patches via Gerrit's +2 review score. See [OpenOCD Developers doc](https://openocd.org/doc/html/Developers.html).

**Corporate contributors.** Commit-volume analysis over the last 3,000 commits (cross-referenced by email domain) shows a broad, vendor-federated contributor base rather than a single dominant sponsor: Antonio Borneo (1045 commits, independent), Marc Schink (346, independent), Tomas Vanek (332, independent), Tarek Bouchkati (119, STMicroelectronics), Erhan Kurubas (66, Espressif Systems), Nishanth Menon (54, Texas Instruments), Tim Newsome (37, SiFive - RISC-V port author), Evgeniy Naydanov/A. Parshintsev (27/15, Syntacore), Ahmed Haoues (24, STMicroelectronics), Ian Thompson (22, Cadence), Jerome Pouiller (20, Silicon Labs), Jan Matyas/Marek Vrbka (18/17, Codasip).

**Community stance on new ports.** Open and permissive in practice. The project has absorbed vendor-contributed drivers and target ports for years (Espressif USB-JTAG, Cadence Virtual Debug, TI AM335x GPIO, Xtensa LX, GD32VF103, and RISC-V itself, all via vendor contribution). Formal requirements are limited to the standard patch-quality bar documented in `HACKING`: single-issue commits, checkpatch-clean, endian-clean C, documentation updated in the same commit, and roughly 1-2 week review windows on Gerrit to accommodate volunteer maintainers' availability. No evidence of resistance to new architecture ports as a matter of policy was found.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2018-07-18 | Initial RISC-V support merged ("Add RISC-V support", debug spec v0.11 and v0.13), authored by Tim Newsome (SiFive), reviewed by Liviu Ionescu and Matthias Welwarsky | commit `a51ab8ddf63a0d60eaaf3b8f3eedcada1e773c20`, merged via `openocd.zylin.com` Gerrit |
| 2018-2021+ | Piecemeal upstreaming of "tons of RISC-V changes" from the SiFive-maintained out-of-tree fork continues over multiple years | [riscv-collab/riscv-openocd](https://github.com/riscv-collab/riscv-openocd) commit history |
| 2020-2026 | 130 RISC-V-touching commits identified via GitHub commit search against the mainline mirror (bug fixes, vector-CSR cache correctness, SMP hart-index validation, Capstone v6 disassembly adaptation, etc.) | GitHub commit search, `riscv repo:openocd-org/openocd` |
| 2026-07-17 | `riscv-collab/riscv-openocd`, the historical RISC-V development fork, is archived (read-only), consistent with RISC-V International's stated push to upstream RISC-V support directly into mainline projects | [riscv.org, "Full-Fat, Kernel-Ready"](https://riscv.org/blog/risc-v-upstreaming/); [riscv-collab/riscv-openocd](https://github.com/riscv-collab/riscv-openocd) |
| 2026-09-06 | Most recent RISC-V commit merged into the mainline mirror ("target/riscv: remove RISCV_SCAN_DELAY_MAX") | commit [a98fc5e](https://github.com/openocd-org/openocd/commit/a98fc5ebe2c0194894f564e54ae8f494eb87db15) |

**Key contributors and organizations:** Tim Newsome (SiFive) - original port author, 2018. Evgeniy Naydanov and A. Parshintsev (Syntacore) - ongoing correctness fixes. Jan Matyas and Marek Vrbka (Codasip) - CI-infrastructure work on the (now-archived) `riscv-collab` fork, including the Spike-based smoke-test workflow (PRs [#563](https://github.com/riscv-collab/riscv-openocd/pull/563) / [#809](https://github.com/riscv-collab/riscv-openocd/pull/809)). Contributor `en-sc` - drove the 0.11/0.13 debug-spec separation refactor (PR [#1044](https://github.com/riscv-collab/riscv-openocd/pull/1044)) and opened the fork-vs-upstream divergence tracking issue ([#979](https://github.com/riscv-collab/riscv-openocd/issues/979)).

**Is it fully upstream?** Yes for the core target-debug implementation. `src/target/riscv/` is unconditionally compiled into every OpenOCD build (it is not gated behind a configure flag) and is fully merged into `openocd-org/openocd` mainline. What is **not** fully resolved is CI/release infrastructure: the historical staging ground for RISC-V-specific changes (`riscv-collab/riscv-openocd`) is now archived and read-only, meaning all future RISC-V work must go directly through Gerrit at `review.openocd.org` with no intermediate GitHub-native fork to absorb vendor contributions before upstreaming.

## 3. Upstream Support Tier

No formal, published support-tier policy exists (no `PLATFORMS.md`/`SUPPORT.md`). Support tiering is de facto, driven by code maturity and reviewer attention rather than a documented policy.

| Aspect | amd64 (build host) | arm64 (build host) | riscv64 (build host) |
|---|---|---|---|
| Upstream CI | Yes, `.travis.yml` arch matrix, build-only | Yes, `.travis.yml` arch matrix, build-only | No - absent from the `.travis.yml` arch matrix entirely |
| Test suite executed in CI | No (both CI files are build/package-only, no target-arch has test execution) | No | No (N/A - no job exists) |
| Upstream official binary (Linux) | None - upstream ships only a Windows i686-mingw32 snapshot and source tarballs via GitHub Releases | None (same) | None (same) |
| Distro riscv64 package | N/A (native arch for all major distros) | N/A (native arch for all major distros) | Ubuntu 26.04 "resolute" (0.12.0-3build3, universe) and Arch Linux RISC-V (1:0.12.0-6-riscv64) both ship a compiled binary built from unmodified upstream source |

Note: because OpenOCD's RISC-V *target-debug* code (Section 4) is unconditionally compiled regardless of host architecture, "amd64 vs riscv64" in this table refers strictly to what host architecture OpenOCD itself runs on - not to which target CPUs it can debug (RISC-V target support exists identically in every build, on every host).

## 4. Technical Architecture and RISC-V-Specific Subsystems

OpenOCD is a debug-adapter host program, not a compute/codec library - it has no JIT backend, no SIMD-optimized hot path, and no `arch/riscv/`-style host-architecture-conditional directory (there is exactly one incidental `#ifdef __riscv` in `riscv/encoding.h:314`, an unrelated host-native-build guard inside a shared CSR-definitions header). Its "architecture-specific" subsystem is instead a **debug-target backend**: C code implementing the RISC-V External Debug Support Specification so OpenOCD can control a RISC-V CPU over JTAG.

**`src/target/riscv/`** - 30,952 lines across 26 files, the largest target backend in the codebase:

| File | Lines | Purpose |
|---|---|---|
| `riscv.c` | 6,416 | Main target driver: lifecycle, halt/resume/step, breakpoints/watchpoints, memory access |
| `riscv-013.c` | 5,621 | Debug Spec v0.13 (current) implementation: Debug Module protocol, abstract commands, program-buffer execution, vector-register access |
| `encoding.h` | 4,992 | Auto-generated from `riscv/riscv-opcodes`: instruction/CSR encoding tables |
| `debug_defines.c`/`.h` | 3,902 / 3,234 | Auto-generated from the official riscv-debug-spec repo |
| `riscv-011.c`/`.h` | 2,469 / 15 | Legacy Debug Spec v0.11 support (pre-standard SiFive silicon) |
| `riscv_reg.c` | 990 | Register cache/get-set abstraction |
| `batch.c`/`.h` | 457 / 221 | DMI transaction batching |
| `opcodes.h` | 449 | Hand-picked opcodes for synthesizing program-buffer code |
| `riscv_semihosting.c` | 241 | Semihosting call handling |

Comparison against other target backends in the same tree confirms RISC-V is the most heavily invested backend, not a stub:

| Component | amd64 (x86_32) target-debug support | arm64 (aarch64) target-debug support | riscv64 target-debug support |
|---|---|---|---|
| Backend size | `x86_32_common.c`+`.h`, 1,853 lines | `aarch64.c`+`.h`, 3,443 lines | `riscv/*`, 30,952 lines |
| Callback-table (`target_type`) coverage | Full | Full | Full - matches every standard hook (examine, poll, halt, resume, step, reset, memory r/w, checksum, mmu, gdb reg list, breakpoints, watchpoints, run_algorithm, disassembly) |
| Width-specific (32 vs 64-bit) handling | N/A | Fixed 64-bit | Explicit runtime `riscv_xlen()` detection with separate compiled flash/checksum loader binaries per width (`riscv32_crc.inc`/`riscv64_crc.inc`, `riscv32_fespi.inc`/`riscv64_fespi.inc`) |
| Vector-extension debug support | N/A | Generic register access | V-extension: `vlenb` CSR read to detect vector width, GDB access to `v0`-`v31` |
| Real shipping boards/chips configured | Fewer (x86 JTAG-over-BMC use cases are uncommon) | Many ARM SoCs | 13+ Tcl configs: SiFive HiFive1, Espressif ESP32-C2/C3/C6/H2, Renesas RZ/Five (RV64 AX45MP), SpacemiT K1/K3 (RV64), GD32VF103, Bouffalo Lab bl602/bl616, HPMicro hpm63xx/68xx/75xx, Microchip PolarFire/PIC64GX, Raspberry Pi RP2350, Andes NDS32V5 |

**ISA extension coverage:** `misa` CSR read on target examine (detects XLEN and base ISA letters I/M/A/F/D/C). `V` (vector) extension: debug-side support only (`vlenb` detection, GDB register access) - no RVV compiler intrinsics anywhere in the codebase (0 hits for `vfloat32m1_t`, `rvv`), which is expected since OpenOCD does not execute vectorized workloads itself. No Zba/Zbb/Zbc/Zbs bit-manipulation-specific code found.

**Flash/checksum loader binaries** (`contrib/loaders/`) - small standalone RISC-V programs cross-compiled for both rv32 and rv64 and embedded as byte arrays: `contrib/loaders/flash/fespi/riscv_fespi.c` (SiFive FE310/FESPI SPI-flash driver), `contrib/loaders/checksum/riscv_crc.c` (CRC32, adapted from GCC libiberty), `contrib/loaders/flash/gd32vf103/`, `contrib/loaders/flash/hpmicro/`.

**Verdict:** RISC-V target-debug support is complete and production-grade, comparable to or exceeding the aarch64 and x86_32 backends by every measure checked (size, callback coverage, TODO density, real-hardware config usage, commit activity). The rating scale used elsewhere in this report series for optimization-purpose projects (full/partial/minimal/absent SIMD coverage) does not map onto this codebase - OpenOCD is not an optimization-purpose project (see Section 13).

## 5. Build System, Cross-Compilation, and Toolchain

OpenOCD uses GNU Autotools, not CMake. No `CMakeLists.txt`, `BUILDING.md`, `docs/building.md`, `docs/cross-compilation.md`, or Dockerfile exists anywhere in the repository.

**Standard build:**
```
./bootstrap        # git checkout only; generates ./configure and INSTALL
./configure [options]
make
sudo make install
```

**riscv64 cross-compilation** (generic autotools `--host` mechanism, no dedicated riscv64 script or toolchain file exists):
```
./bootstrap
./configure --host=riscv64-linux-gnu [options]
make
```
The repository provides a generic, triplet-agnostic helper `contrib/cross-build.sh <host-triplet>` for cross-building dependencies (libusb-1.0, hidapi, libftdi, capstone, libjaylink) - it works identically for any `--host` value, riscv64 included, and is a pkg-config-wrapper generator, not a CMake toolchain file.

**RISC-V is not a build-time toggle.** `src/target/riscv/` (built as static lib `libriscv.la`) is unconditionally included by `src/target/Makefile.am` and compiled into every OpenOCD build alongside every other target backend (ARM, MIPS, Xtensa, etc.). There is no `--enable-target-riscv` or equivalent flag - only optional *adapter/driver* flags exist (e.g. `--enable-parport`, `--enable-cmsis-dap`), none riscv64-specific.

**Toolchain requirements (from `README.md`, "OpenOCD Dependencies"):** GCC or Clang, described only as "must be somewhat modern" - no exact minimum version pinned. Requires C99 support and tolerance for strict warnings (`-Wall -Werror -Wextra` and more). `libjim` >= 0.79 (or internal jimtcl via `--enable-internal-jimtcl`, pinned to 0.83 in CI). `pkg-config` >= 0.23. For git-checkout builds: `autoconf` >= 2.69, `automake` >= 1.14, `texinfo` >= 5.0.

**QEMU:** No QEMU usage found anywhere in the repository's build documentation, CI workflows, or `testing/` directory, for riscv64 or any other target.

**Known build failures:** none documented specific to riscv64 - unsurprising, since no riscv64 CI exists to have surfaced any (Section 7). Data not available: whether native riscv64-host compilation has ever failed, since no CI or upstream report tracks this.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because the RISC-V *target-debug* implementation is functionally complete and unconditionally compiled (Section 4), there is no host-architecture functional gap in what OpenOCD can debug on riscv64 hosts vs. amd64/arm64 hosts - the same 30,952-line backend runs identically regardless of host CPU. The gaps that exist are in specific correctness bugs and in CI/release infrastructure, not in missing functionality:

**Known correctness/performance bugs** (from `riscv-collab/riscv-openocd`, the now-archived RISC-V-support fork - see Section 11 for the full list):
- A cluster of DMI-busy-delay bugs (issues [#1322](https://github.com/riscv-collab/riscv-openocd/issues/1322), [#1310](https://github.com/riscv-collab/riscv-openocd/issues/1310), [#1308](https://github.com/riscv-collab/riscv-openocd/issues/1308), [#1307](https://github.com/riscv-collab/riscv-openocd/issues/1307), [#633](https://github.com/riscv-collab/riscv-openocd/issues/633)) causing `dmi_busy_delay` to run away to ~1,000,000 cycles under certain trigger/breakpoint configurations, freezing the telnet interface.
- An open register-write-to-read-only-CSR bug ([#1305](https://github.com/riscv-collab/riscv-openocd/issues/1305)): OpenOCD attempts to write `vl`/`vtype`/`vlenb`, which the RISC-V Vector spec marks user-read-only.
- An 8-year-old open crash-on-error path ([#195](https://github.com/riscv-collab/riscv-openocd/issues/195)): an unhaltable hart currently causes OpenOCD to call `abort()`, killing the whole debug session, rather than attempting recovery.

**Performance benchmarks:** No quantitative benchmark data (memory-transfer throughput, register-read latency, comparative KB/s figures) for OpenOCD on riscv64 vs. arm64/amd64 could be found in any source searched - not from RISE Project, not from independent sources, not on GitHub. Data not available: this appears to be a genuine gap in public data, not a search failure - it should be flagged rather than filled with invented numbers.

**NaN / floating-point semantics:** No open or closed issue specifically about NaN handling was found in either `openocd-org/openocd` or `riscv-collab/riscv-openocd`. The only floating-point-adjacent issue found is closed issue [#336](https://github.com/riscv-collab/riscv-openocd/issues/336) ("RVDF FPU F/D register is described only as D", closed 2020-04-10) - a register-naming/description gap, not a NaN correctness bug.

**Security hardening gaps:** Data not available: no riscv64-specific security-hardening research was surfaced by this investigation.

## 7. CI/CD Infrastructure

`openocd-org/openocd` contains exactly two CI configuration files. Both were read in full and grepped for `riscv`/`riscv64`/`RISCV` - zero matches in either.

**[`.github/workflows/snapshot.yml`](https://github.com/openocd-org/openocd/blob/master/.github/workflows/snapshot.yml)** (132 lines): triggers on `push`, runs on `ubuntu-latest` (single job named `package`), and does exactly one thing - cross-compiles OpenOCD **for Windows** (`i686-w64-mingw32`) via `contrib/cross-build.sh`, packaging the result as a GitHub Release/artifact. No test execution step. No riscv/riscv64 references anywhere in the file.

**[`.travis.yml`](https://github.com/openocd-org/openocd/blob/master/.travis.yml)** (92 lines): the `arch:` matrix lists exactly `amd64`, `arm64`, `ppc64le`, `s390x` - **riscv64 is absent**. (Note: `arm64` here is the ARM 64-bit ISA, unrelated to RISC-V.) The matrix additionally builds macOS and Windows via MSYS2/mingw. The script step is `./bootstrap && ./configure && make` - a native-compile check only, no test suite invocation, no QEMU.

No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists anywhere in the repository. Real per-patch CI for Gerrit-submitted changes, if any exists, runs on infrastructure not visible in this mirrored repo.

No evidence was found of RISE RISC-V Runner usage tied to OpenOCD specifically - the RISE RISC-V Runners service ([announced 2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) is a general-purpose GitHub Actions CI offering (`ubuntu-24.04-riscv` label, Scaleway bare-metal/Kubernetes) unrelated to OpenOCD.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI: build | Yes (`.travis.yml`) | Yes (`.travis.yml`) | No - not in the arch matrix |
| CI: test execution | No (build-only pipeline for every arch) | No | No (N/A, no job) |
| CI: release-blocking | No (Travis job is informational, not gating in a repo with no PRs) | No | N/A |
| Native or QEMU | Native Travis runner | Native Travis runner (ARM) | N/A |

**Claim verified: no riscv64-specific CI job, runner, or QEMU-based riscv64 testing exists in `openocd-org/openocd`'s CI configuration.**

## 8. Distribution and Release Status

**Upstream GitHub Releases:** ship only a Windows (`i686-w64-mingw32`) snapshot tarball plus source zip/tar.gz archives, verified across the four most recent releases (v0.12.0 and its three release candidates) via [github.com/openocd-org/openocd/releases](https://github.com/openocd-org/openocd/releases). No Linux binaries of any architecture, riscv64 included, are published this way.

**PyPI:** the `openocd` package ([pypi.org/project/openocd](https://pypi.org/project/openocd/), latest v0.6.0) is a pure-Python API wrapper around a system-installed OpenOCD binary, not the debugger itself - files are `py3-none-any.whl` and a source `.tar.gz`, architecture-neutral by construction. This is not a real distribution channel for a working riscv64 OpenOCD binary.

**Ubuntu 26.04 "resolute":** ships `openocd` 0.12.0-3build3 for riscv64 (universe section), confirmed via [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=OpenOCD&suite=resolute&searchon=names&section=all) and a working [filelist](https://packages.ubuntu.com/resolute/riscv64/openocd/filelist) showing `usr/bin/openocd` - a genuine compiled binary, not a metapackage. This is built from unmodified upstream source (no riscv64-specific packaging patches identified).

**Arch Linux RISC-V:** ships `openocd-1:0.12.0-6-riscv64.pkg.tar.zst` (signed, ~1.9 MB, dated 28-Aug-2026), confirmed via the authoritative pacman repository index at [archriscv.felixc.at/repo/extra/](https://archriscv.felixc.at/repo/extra/).

**What a user must do to get a working riscv64 OpenOCD binary today:** install it from Ubuntu 26.04+ (`apt install openocd`, universe) or Arch Linux RISC-V (`pacman`), or build from source on/for riscv64 via `./bootstrap && ./configure --host=riscv64-linux-gnu && make` (or a native `./configure && make` on a riscv64 host), since no upstream-published binary exists for any Linux architecture, riscv64 included.

## 9. Dependencies

OpenOCD's dependency surface is dominated by USB/HID/GPIO hardware-transport libraries plus one embedded Tcl interpreter and one disassembly engine - it has no JIT, SIMD, numerics, or crypto library dependencies in the sense normally screened for in this report series.

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Notes |
|---|---|---|---|---|---|
| jimtcl (msteveb/jimtcl) | Embedded Tcl interpreter for OpenOCD's config/command language | Confirmed - Ubuntu 26.04 `libjim-dev` 0.83-2 (universe) | Pure-C, no arch-specific paths | Packaged for riscv64 | No open riscv64 issues found |
| capstone (capstone-engine/capstone) | Optional disassembly backend for `disassemble` command | Confirmed - Ubuntu 26.04 `libcapstone-dev` 5.0.7-2 | Host-agnostic disassembler, no known riscv64 gaps | Packaged for riscv64 in Ubuntu, Debian sid, Arch; **no PyPI riscv64 wheel** (source-compiles via cmake) | Two closed RISC-V-target decode bugs (#2977, #2936), both fixed. Tracked separately - see `project-reports/capstone.md` |
| libusb-1.0 (libusb/libusb) | Core USB transport for most JTAG/SWD adapters | Confirmed - Ubuntu 26.04 `libusb-1.0-0-dev` 2:1.0.29-2build1 | No riscv64-specific test issues found | Packaged for riscv64 | No blockers |
| hidapi (libusb/hidapi) | HID-class debug adapter driver | Confirmed - Ubuntu 26.04 `libhidapi-dev` 0.15.0-2 | No reported issues | Packaged for riscv64 | No blockers |
| libftdi1 (intra2net) | FTDI FT2232/FT232H JTAG adapter driver | Confirmed - Ubuntu 26.04 `libftdi1-dev` 1.6~rc1-1build1 | No known gaps | Packaged for riscv64 | Upstream not on GitHub; no issue search performed |
| libgpiod >=2.0 (kernel.org, mirrored at brgl/libgpiod) | GPIO-bitbang JTAG/SWD driver | Confirmed - Ubuntu 26.04 `libgpiod-dev` 2.2.1-3build1 | No riscv64-specific issues found | Packaged for riscv64 | Weak signal only (upstream dev on mailing list, not GitHub) |
| libjaylink (zapb.de) | SEGGER J-Link protocol library | Confirmed - Ubuntu 26.04 `libjaylink-dev` 0.4.0-1build1 | No known issues | Packaged for riscv64 | Hosted on GitLab, not GitHub |

All seven dependencies are confirmed present and packaged for riscv64 in Ubuntu 26.04 "resolute" via Launchpad, with no open riscv64-blocking issue found for any. Capstone (the closest match to a "JIT-backend-like" dependency) is the only one also independently tracked in this report series - see `project-reports/capstone.md` for its full riscv64 build/CI/release breakdown.

**Caveat:** the `project-graph` MCP tool was unreachable this entire research session (`CONNECTION_CLOSED`). The riscv64/Ubuntu-26.04 dependency findings above come from direct Launchpad and packages.ubuntu.com lookups as a substitute, not from the project's SPARQL package-graph tool. This should be re-verified once that server reconnects, particularly for transitive `hasDependency` chains.

## 11. Known Bugs and Active Issues

All items below are from `riscv-collab/riscv-openocd` (the RISC-V-support fork, archived read-only 2026-07-17), since `openocd-org/openocd` uses no GitHub Issues at all.

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#979](https://github.com/riscv-collab/riscv-openocd/issues/979) | Track and clarify differences with upstream OpenOCD | Open | Medium | Master tracking issue for fork-vs-upstream drift; flags GD32V flash loader, DSP563xx target, FTDI configs, GD32VF103 config as possibly-unintentional divergence |
| [#559](https://github.com/riscv-collab/riscv-openocd/issues/559) | `read_memory()` failure corrupts x8/s0/fp register | Closed (fixed by PR #560) | High (correctness) | A failed memory read left the frame-pointer register holding the failed target address instead of being restored |
| [#195](https://github.com/riscv-collab/riscv-openocd/issues/195) | Unable to halt hart should not cause `abort()` | Open (8+ years) | High (correctness/reliability) | Current behavior kills the whole debug session instead of attempting `reset halt` recovery |
| [#1322](https://github.com/riscv-collab/riscv-openocd/issues/1322) | `dmi_busy_delay`/`idle_cycles` increment too much during trigger examination | Open | Medium (performance) | Runs away to ~1,000,000 cycles with 8 hardware breakpoints set, freezing telnet |
| [#1310](https://github.com/riscv-collab/riscv-openocd/issues/1310) | Drop RTI cycle when DMI delay is zero | Open | Low (performance) | Part of the busy-delay cleanup cluster |
| [#1308](https://github.com/riscv-collab/riscv-openocd/issues/1308) | No need for busy delays after a DMI NOP | Open | Low (performance) | Part of the busy-delay cleanup cluster |
| [#1307](https://github.com/riscv-collab/riscv-openocd/issues/1307) | DMI busy is mishandled on Microchip PolarFire SoC | Open | High (correctness) | Low 32 bits of `a0` silently read back as zero after a specific sequence |
| [#1306](https://github.com/riscv-collab/riscv-openocd/issues/1306) | Memory burst writes with abstractauto can fail due to missing BUSY checks | Open | Medium (correctness) | |
| [#1311](https://github.com/riscv-collab/riscv-openocd/issues/1311) | Check value read from target before address arithmetic | Open | Medium (correctness) | |
| [#1309](https://github.com/riscv-collab/riscv-openocd/issues/1309) | Assertion failure when force-reading a dirty register | Open | Medium (correctness) | Crashes via `riscv_reg_impl_is_initialized` assertion |
| [#1305](https://github.com/riscv-collab/riscv-openocd/issues/1305) | Writes to read-only vector CSRs (vl, vtype, vlenb) | Open | Medium (spec violation) | Violates RISC-V Vector spec (URO fields) |
| [#1320](https://github.com/riscv-collab/riscv-openocd/issues/1320) | Support for RISC-V RNMI registers | Open | Low (missing feature) | |
| [#1318](https://github.com/riscv-collab/riscv-openocd/issues/1318) | Implement DMI behind Coresight DAP | Open | Medium (architectural gap) | |
| [#1317](https://github.com/riscv-collab/riscv-openocd/issues/1317) | `dcsr.stepie` defaults to zero although `set_maskisr` is off | Open | Low (correctness) | |
| [#1323](https://github.com/riscv-collab/riscv-openocd/issues/1323) | Build errors relating to const abuse | Open | Low (build correctness) | |
| [#836](https://github.com/riscv-collab/riscv-openocd/issues/836) | Multiple issues related to resuming and breakpoints | Open | Medium (correctness) | |
| [#652](https://github.com/riscv-collab/riscv-openocd/issues/652) | `read_memory_abstract` uses `data1` even when `datacount == 1` | Open | Low (correctness) | |
| [#633](https://github.com/riscv-collab/riscv-openocd/issues/633) | Busy delays not reset on external reset trigger | Open | Low (performance) | Part of the busy-delay cleanup cluster |
| [#587](https://github.com/riscv-collab/riscv-openocd/issues/587) | Loading programs with program buffer expects autoexec support | Open | Low (feature gap) | |
| [#933](https://github.com/riscv-collab/riscv-openocd/issues/933) | `execute_fence` does not handle errors | Closed (fixed by PR #964) | Medium (correctness) | Always returned `ERROR_OK` even on fence failure |
| [#788](https://github.com/riscv-collab/riscv-openocd/issues/788) | Trigger-matching stops at first candidate instead of trying all | Closed (fixed by PR #800) | Medium (correctness) | |
| [#1232](https://github.com/riscv-collab/riscv-openocd/issues/1232) | Five separate abstract-command caching booleans should be one | Closed (fixed by PR #1235) | Low (refactor) | Also dropped a buggy `aampostincrement` check |

**Correctness bugs to highlight:** #559 (register corruption, fixed), #1307 (silent data corruption on PolarFire, open), #1309 (assertion crash, open), #1305 (spec-violating CSR writes, open), #195 (session-killing `abort()`, open 8+ years).

## 12. Objections and Upstream Blockers

**Stated objections:** none found. RISC-V support was accepted via ordinary vendor contribution in 2018 with no documented resistance, and vendor-federated maintenance (SiFive, Syntacore, Codasip, and others) has continued uninterrupted since.

**Technical blockers:** the DMI-busy-delay bug cluster (#1322/#1307/#1308/#1310/#633) affects reliability under realistic multi-breakpoint/trigger configurations and remains open. The vector-CSR read-only-write violation (#1305) is a spec-compliance gap.

**Organizational blockers:** `openocd-org/openocd`'s status as a strict read-only GitHub mirror with no GitHub Issues/PRs means any new contributor must learn the Gerrit-plus-mailing-list workflow - a materially higher barrier than a GitHub-native PR. This friction is compounded by the July 2026 archival of `riscv-collab/riscv-openocd`, which had functioned as an intermediate, GitHub-native staging fork for RISC-V-specific vendor contributions; that staging ground no longer exists, so all future RISC-V changes (including any riscv64 CI addition) must go directly through Gerrit.

**Acceptance probability for closing the riscv64-CI gap:** likely high in principle - there is no stated policy objection to any architecture, and the RISE Project has a funded RFP explicitly targeting this project (**RP007, "RISC-V OpenOCD Upstreaming"**, per [wiki.riseproject.dev](https://wiki.riseproject.dev/display/HOME/RISE+RFP)) plus an open tracking issue ([riseproject-dev/kernel-and-virtualization-wg#142](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/142), "Evaluate OpenOCD status on RISC-V", opened 2026-07-27). However, no evidence of completed deliverables from either the RFP or the tracking issue was found - this is recognized, funded intent, not yet realized work.

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro (Ubuntu, Arch Linux RISC-V)
- **Justification:** `openocd-org/openocd` has no riscv64 CI at all - both CI configuration files in the repository ([.github/workflows/snapshot.yml](https://github.com/openocd-org/openocd/blob/master/.github/workflows/snapshot.yml) and [.travis.yml](https://github.com/openocd-org/openocd/blob/master/.travis.yml)) were read directly and contain zero references to riscv or riscv64 in any form; the Travis `arch:` matrix explicitly lists only amd64, arm64, ppc64le, and s390x. Because upstream CI is entirely absent for this architecture, the distribution floor applies: Ubuntu 26.04 "resolute" ships `openocd` 0.12.0-3build3 for riscv64 built from unmodified upstream source (confirmed via a working [filelist](https://packages.ubuntu.com/resolute/riscv64/openocd/filelist) showing a real compiled `usr/bin/openocd` binary, not a patched fork), and Arch Linux RISC-V independently confirms the same clean build via its [pacman repository index](https://archriscv.felixc.at/repo/extra/). A no-CI project with a clean (unpatched), distro-built riscv64 package is graded yellow, sub-type `clean-distro-build`, per the color model's distribution floor.
- **Optimization level:** not applicable - OpenOCD is not an optimization-purpose project (it is a debug-adapter host tool whose value is protocol-correctness and hardware coverage, not computational speed relative to a reference implementation), so the Step 2 optimization modifier does not apply and no optimization level is assigned.
- **Pending work that could change the grade:** RISE Project's funded RFP RP007 ("RISC-V OpenOCD Upstreaming") and the open tracking issue [riseproject-dev/kernel-and-virtualization-wg#142](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/142) both target this project directly. If either results in a Gerrit-submitted riscv64 CI job that runs (not just builds) a test suite, the grade would move to blue; if upstream additionally began publishing a riscv64 release artifact directly, it would move to green. No evidence of either outcome exists yet.

## 14. Investment Analysis

RISE has a funded RFP (RP007) and an open tracking issue targeting OpenOCD's RISC-V status specifically, but no completed deliverable was found from either - none of the work below should be treated as already covered.

### 14.1 Functional Enablement

The RISC-V target-debug implementation itself is mature and complete (Section 4) - no functional-enablement work is needed to add riscv64 *target* support, since it already exists and is unconditionally compiled. The functional gap that remains is fixing the open correctness bugs in the DMI-busy-delay cluster (#1322/#1307/#1308/#1310/#633) and the vector-CSR read-only-write violation (#1305), all currently tracked on the archived `riscv-collab/riscv-openocd` fork and requiring resubmission through Gerrit to land upstream.

### 14.2 Performance Optimization

Not a priority area - OpenOCD is not an optimization-purpose project, and no performance-benchmark data exists at all (Section 6) to establish whether a riscv64-specific performance gap is even present relative to amd64/arm64. The first piece of work here, if pursued, would be establishing a benchmark methodology (e.g. reviving the Spike-based `riscv-tests/debug` harness from the archived fork's PR [#563](https://github.com/riscv-collab/riscv-openocd/pull/563)/[#809](https://github.com/riscv-collab/riscv-openocd/pull/809)), not optimizing against a known baseline.

### 14.3 CI/CD Infrastructure

This is the primary, well-defined gap. Work required: submit a Gerrit change (since `openocd-org/openocd` accepts no GitHub PRs) adding a riscv64 leg that both builds and executes a real test suite against RISC-V targets - the archived fork's Spike-based `riscv-tests/debug` workflow (PRs #563/#809) is a directly reusable template. RISE's RISC-V Runners service (GitHub Actions `ubuntu-24.04-riscv` label) is a plausible execution host if the Gerrit workflow can be adapted to trigger it, and this work maps directly onto RISE's own stated RFP goal (RP007).

### 14.4 Ecosystem Enablement

Not applicable - OpenOCD is a standalone debugger tool with no dependent package ecosystem (no plugin/extension registry of packages that themselves need riscv64 enablement).

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix DMI-busy-delay bug cluster (#1322/#1307/#1308/#1310/#633) and resubmit via Gerrit | 2-4 | Upstream/vendor contributor (Syntacore/Codasip pattern) | Medium |
| Functional | Fix vector-CSR read-only-write violation (#1305) | 1 | Upstream/vendor contributor | Medium |
| CI/CD | Design and submit a Gerrit change adding a riscv64 build+test CI leg, reusing the archived fork's Spike/`riscv-tests/debug` harness | 3-6 | RISE (RP007) or vendor contributor | High |
| CI/CD | Investigate hosting the new riscv64 CI job on RISE RISC-V Runners | 1-2 | RISE | Medium |
| Release | Advocate for/contribute a riscv64 leg to `.travis.yml` or a new GitHub Actions workflow producing a riscv64 snapshot artifact | 1-2 | Upstream/RISE | Low-Medium |
| Data gap | Establish a riscv64-vs-arm64/amd64 OpenOCD performance benchmark methodology (none currently exists anywhere) | 2-3 | RISE or independent contributor | Low |

## 15. Updates

(No updates yet - initial report dated 2026-06-17.)

## 16. References

- [OpenOCD GitHub mirror](https://github.com/openocd-org/openocd)
- [OpenOCD homepage](https://openocd.org/)
- [OpenOCD Developers doc](https://openocd.org/doc/html/Developers.html)
- [Gerrit review.openocd.org, project:openocd open changes](https://review.openocd.org/q/project:openocd+status:open)
- [.github/workflows/snapshot.yml](https://github.com/openocd-org/openocd/blob/master/.github/workflows/snapshot.yml)
- [.travis.yml](https://github.com/openocd-org/openocd/blob/master/.travis.yml)
- [OpenOCD GitHub Releases](https://github.com/openocd-org/openocd/releases)
- [PyPI: openocd package](https://pypi.org/project/openocd/)
- [PyPI simple index: openocd](https://pypi.org/simple/openocd/)
- [Ubuntu packages.ubuntu.com search: OpenOCD, resolute suite](https://packages.ubuntu.com/search?keywords=OpenOCD&suite=resolute&searchon=names&section=all)
- [Ubuntu resolute riscv64 openocd package page](https://packages.ubuntu.com/resolute/riscv64/openocd)
- [Ubuntu resolute riscv64 openocd filelist](https://packages.ubuntu.com/resolute/riscv64/openocd/filelist)
- [Arch Linux RISC-V repo index (extra)](https://archriscv.felixc.at/repo/extra/)
- [Commit a98fc5e: target/riscv: remove RISCV_SCAN_DELAY_MAX](https://github.com/openocd-org/openocd/commit/a98fc5ebe2c0194894f564e54ae8f494eb87db15)
- [Commit 3280595: target/riscv: fix bug in scratch_reserve](https://github.com/openocd-org/openocd/commit/3280595478bc2cdd5cd58b1a2069b3cf1d755f7c)
- [Commit 10edeed: target/smp: split target->smp into bool + smp_id](https://github.com/openocd-org/openocd/commit/10edeeda3245cffc627aba0882aa0380e8ff299f)
- [Commit 7df0c24: target/riscv: fix memory leak](https://github.com/openocd-org/openocd/commit/7df0c2427cd9b9c9d30304455d4c521ee0b5c52c)
- [Commit 141be2a: target/riscv: validate hart index unique per DM](https://github.com/openocd-org/openocd/commit/141be2a87d625ffbbeb5ef36814904b82cd69c97)
- [Commit da3920b: target/riscv: add hart index bounds checking](https://github.com/openocd-org/openocd/commit/da3920b0a52dc2d394afb222c688dac7e57acc1b)
- [Commit abbbc2e: target/riscv: add dcsr cetrig control](https://github.com/openocd-org/openocd/commit/abbbc2e05ee9a9221811cac0b7b3a2df1de9d761)
- [Commit 081459d: target: riscv: enable 'disassemble' command](https://github.com/openocd-org/openocd/commit/081459d16fde4bb53cc8f96baa49cc937c1d0d95)
- [Commit 25b89a9: target/riscv: mark dscratch* registers non-cacheable](https://github.com/openocd-org/openocd/commit/25b89a97df2bcca30eb867ba2986bf36c9de6f7d)
- [Commit b63fc37: target/riscv: do not cache vxrm/vxsat/vcsr](https://github.com/openocd-org/openocd/commit/b63fc374f038a474fd0cbca2728138512d4f640e)
- [Commit ef5ac7a: target/riscv: preserve vstart when manipulating vector state](https://github.com/openocd-org/openocd/commit/ef5ac7aef3d11dfe806b9bdd88a2770febdaefa3)
- [Commit dfccacd: target/riscv: respect DM_DMSTATUS_ALLUNAVAIL during examine](https://github.com/openocd-org/openocd/commit/dfccacd7e5fcae5c362d7f665cb75e03eaed8c0d)
- [Commit 25c6ac8: target: riscv: error out instead of truncating register values](https://github.com/openocd-org/openocd/commit/25c6ac85cdeec5104e66dcd7bca2f62177fdaf01)
- [Commit fa01258: target/oocd_capstone: fix RISC-V mode name for capstone v6](https://github.com/openocd-org/openocd/commit/fa01258d99d8b72a5eec2903b0240eeec0ceb82c)
- [Commit ad0ed19: target/riscv: fix exec_progbuf for SMP targets](https://github.com/openocd-org/openocd/commit/ad0ed194f55c8caa114b11e22a650cfbaf3be26d)
- [riscv-collab/riscv-openocd (archived RISC-V fork)](https://github.com/riscv-collab/riscv-openocd)
- [Issue #979: Track and clarify differences with upstream OpenOCD](https://github.com/riscv-collab/riscv-openocd/issues/979)
- [Issue #559: read_memory() failure corrupts x8/s0/fp register](https://github.com/riscv-collab/riscv-openocd/issues/559)
- [Issue #195: Unable to halt hart should not cause abort()](https://github.com/riscv-collab/riscv-openocd/issues/195)
- [PR #563: Add CI for riscv-openocd](https://github.com/riscv-collab/riscv-openocd/pull/563)
- [PR #809: Multiple improvements to Spike smoke-test workflow](https://github.com/riscv-collab/riscv-openocd/pull/809)
- [PR #1044: target/riscv: stop using register_get/set for 0.11 targets](https://github.com/riscv-collab/riscv-openocd/pull/1044)
- [Issue #1322: dmi_busy_delay and idle_cycles increment too much](https://github.com/riscv-collab/riscv-openocd/issues/1322)
- [Issue #1310: Drop RTI cycle in case DMI delay is zero](https://github.com/riscv-collab/riscv-openocd/issues/1310)
- [Issue #1308: No need for busy delays after a DMI NOP](https://github.com/riscv-collab/riscv-openocd/issues/1308)
- [Issue #1307: DMI busy is mishandled on Microchip PolarFire SoC](https://github.com/riscv-collab/riscv-openocd/issues/1307)
- [Issue #1306: Memory burst writes with abstractauto can fail](https://github.com/riscv-collab/riscv-openocd/issues/1306)
- [Issue #1311: Check the value read from target before address arithmetic](https://github.com/riscv-collab/riscv-openocd/issues/1311)
- [Issue #1309: Assertion failure when force-reading a dirty register](https://github.com/riscv-collab/riscv-openocd/issues/1309)
- [Issue #1305: Writes to read-only vector CSRs](https://github.com/riscv-collab/riscv-openocd/issues/1305)
- [Issue #1320: Support for RISC-V RNMI registers](https://github.com/riscv-collab/riscv-openocd/issues/1320)
- [Issue #1318: Implement DMI behind Coresight DAP](https://github.com/riscv-collab/riscv-openocd/issues/1318)
- [Issue #1317: dcsr.stepie default zero](https://github.com/riscv-collab/riscv-openocd/issues/1317)
- [Issue #1323: Build errors relating to const abuse](https://github.com/riscv-collab/riscv-openocd/issues/1323)
- [Issue #836: Multiple issues related to resuming and breakpoints](https://github.com/riscv-collab/riscv-openocd/issues/836)
- [Issue #652: read_memory_abstract uses data1 even when datacount == 1](https://github.com/riscv-collab/riscv-openocd/issues/652)
- [Issue #633: Busy delays not reset on external reset trigger](https://github.com/riscv-collab/riscv-openocd/issues/633)
- [Issue #587: Loading programs with program buffer expects autoexec support](https://github.com/riscv-collab/riscv-openocd/issues/587)
- [Issue #933: execute_fence does not handle errors](https://github.com/riscv-collab/riscv-openocd/issues/933)
- [Issue #788: Try all triggers in maybe_add_trigger_t*](https://github.com/riscv-collab/riscv-openocd/issues/788)
- [Issue #1232: Consolidate abstract-command caching booleans](https://github.com/riscv-collab/riscv-openocd/issues/1232)
- [Issue #336: RVDF FPU F/D register described only as D](https://github.com/riscv-collab/riscv-openocd/issues/336)
- [RISC-V International, "Full-Fat, Kernel-Ready: Why RISC-V Linux Needs Everyone Upstream"](https://riscv.org/blog/risc-v-upstreaming/)
- [RISE Project RFP wiki](https://wiki.riseproject.dev/display/HOME/RISE+RFP)
- [riseproject-dev/kernel-and-virtualization-wg issue #142: Evaluate OpenOCD status on RISC-V](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/142)
- [riseproject-dev/board-farm](https://github.com/riseproject-dev/board-farm)
- [RISE Project: Announcing the RISE RISC-V Runners](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [craigjb.com, VexRiscv JTAG-tunnel post (anecdotal JTAG-clock note, not a benchmark)](https://craigjb.com/2024/09/09/vexriscv-jtag-tunnel/)
- [lists.riscv.org tech-debug: RISC-V vector-extension support gap discussion](https://lists.riscv.org/g/tech-debug/topic/risc_v_tech_vector_ext/106411278)