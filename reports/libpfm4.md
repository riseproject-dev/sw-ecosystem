---
title: libpfm4
categories:
  - libraries
  - perfmon
---

# libpfm4

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for libpfm4<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

libpfm4 is a C library that provides a hardware-independent API for encoding and discovering hardware performance monitoring unit (PMU) events on Linux via the `perf_event_open(2)` syscall. It is the core library behind PAPI, oprofile, and any tool that needs to look up hardware counter names by string (e.g., "INST_RETIRED:ANY") and translate them to the kernel's numeric event encoding. The library does not perform measurement itself -- it encodes events for the caller to pass to the kernel.

The project was created at Hewlett-Packard (2002-2006) and is licensed under the MIT License (copyright Hewlett-Packard Development Company, L.P.). It is hosted at [perfmon2.sourceforge.net](https://perfmon2.sourceforge.net/) with a GitHub mirror at [wcohen/libpfm4](https://github.com/wcohen/libpfm4). The canonical upstream is the SourceForge mailing-list-driven repository; the GitHub mirror is used for issue tracking and visibility.

**Governance:** No formal foundation, no governance charter, no sponsorship tiers. The project is effectively single-maintainer. Stephane Eranian (Google) holds 1,046 of 1,256 total commits (~83%). William Cohen (Red Hat, historical affiliation) hosts the GitHub mirror and has 19 commits. Occasional contributors include Ian Rogers (Google, ARM detection fixes 2021/2024), Swarup Sahoo (AMD Zen5 L3 PMU), Sachin Monga (IBM Power10), and historically Robert Richter (AMD), Thomas Richter (IBM s390), Shay Gal-On/shay-cavium/swalk-cavium (Cavium/Marvell ThunderX2), Masahiko Yamada (Fujitsu A64FX), and Lau Mercadal Melia (HiSilicon Kunpeng).

**Architecture policy for new ports:** Informal and vendor-driven. Every non-x86 architecture was contributed by the hardware vendor or their ecosystem partners (IBM for s390/Power, Cavium for ThunderX2, Fujitsu for A64FX, Huawei for Kunpeng). There is no written acceptance policy. New ports require submitting a patch series to the perfmon2-devel mailing list adding a `pfmlib_<arch>.c` PMU backend and corresponding event header files, reviewed and merged by Eranian.

**RISE Project involvement:** None. libpfm4 is not a RISE Project member and does not appear in any RISE blog post, working group deliverable, or funded RFP. The RISE Debug & Profiling working group (2024 achievements) covered DynamoRIO, Valgrind, GDB, Linux perf, and eBPF -- not libpfm4.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|------|-------|--------|
| 2002-2006 | Project created at HP; x86/IA-64 support | [perfmon2.sourceforge.net](https://perfmon2.sourceforge.net/) |
| (historical) | ARM, AArch64, SPARC, MIPS, IBM Power/z added by respective hardware vendors | [wcohen/libpfm4 lib/](https://github.com/wcohen/libpfm4/tree/master/lib) |
| (ongoing) | AMD Zen-series, Intel GraniteRapids/SapphireRapids, ARM Neoverse, IBM Power10 updates | [recent 50 commits](https://github.com/wcohen/libpfm4/commits/master) |
| 2026-06-13 | Most recent commit: "Update Intel GraniteRapids core events to 1.19" | [wcohen/libpfm4 commits](https://github.com/wcohen/libpfm4/commits/master) |
| June 2026 | RISC-V: no commits, no issues, no PRs, no source files | [wcohen/libpfm4](https://github.com/wcohen/libpfm4) |

No RISC-V work has ever been submitted or merged. The GitHub commit search for "riscv" in wcohen/libpfm4 returns 0 results. The perfmon2-devel mailing list search for "riscv" returns 0 results. There is no tracking issue, no roadmap entry, and no contributor known to be working on a RISC-V port.

---

## 3. Upstream Support Tier

There is no formal tier policy. The de facto tier of an architecture in libpfm4 is determined by the presence of PMU source files and event tables in the repository. By this measure:

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Architecture in `config.mk` | Yes (`CONFIG_PFMLIB_ARCH_X86_64`) | Yes (`CONFIG_PFMLIB_ARCH_ARM64`) | No |
| PMU C source files in `lib/` | ~110 files (Intel + AMD) | 18 files | 0 |
| Event tables in `lib/events/` | ~106 headers (Intel + AMD) | 18+ headers | 0 |
| Architecture guard in `pfmlib_common.c` | Yes | Yes | No |
| CI | None (project has no CI) | None | None |
| Release-blocking | n/a | n/a | n/a |
| Official upstream binary | No releases exist | No releases exist | No releases exist |
| Distro binary package | Yes (Debian, Ubuntu) | Yes (Debian, Ubuntu) | Yes (Debian, Ubuntu) -- non-functional for PMU |

The project has no GitHub releases for any architecture. No official pre-built binaries are distributed by upstream. Distro packages exist for riscv64 in Debian sid (version 4.13.0+git106-g3e4031b-1+b2, status Installed on buildd rv-manda-02) and Ubuntu 24.04 LTS Noble (version 4.13.0+git32-g0d4ed0e-1, in the universe component). These packages build and install on riscv64 but contain zero RISC-V PMU event tables -- they are non-functional for hardware performance counter access on RISC-V hardware.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libpfm4's architecture-specific work consists entirely of PMU event table definitions and `perf_event_open` encoding logic. There is no JIT backend, no SIMD dispatch, no cryptographic assembly, and no GC barrier code. The architecture-specific components are:

1. **Architecture detection** (`config.mk`): Maps `uname -m` output to a normalized ARCH value and sets a `CONFIG_PFMLIB_ARCH_*` build flag.
2. **PMU C source file** (`lib/pfmlib_<arch>*.c`): Implements event encoding, attribute parsing, and CPU family detection for each PMU family on the architecture.
3. **Event table headers** (`lib/events/<arch>_*_events.h`): Defines the named event descriptors for each supported CPU microarchitecture.
4. **Architecture guard** (`pfmlib_common.c`): Conditionally includes PMU backends based on `CONFIG_PFMLIB_ARCH_*` flags.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Architecture detection in `config.mk` | Full | Full | Missing |
| PMU source files in `lib/` | ~110 files (K7 through Zen5) | 18 files (ARMv6 through Neoverse V3, A64FX, Kunpeng) | 0 files |
| Event table headers in `lib/events/` | ~106 headers (Intel P6 through GraniteRapids + AMD) | 18+ headers | 0 headers |
| Architecture guard in `pfmlib_common.c` | Yes | Yes | No |
| Linux `perf_event_open` encoding | Full | Full | Missing |

There is no RVV (RISC-V Vector), Zba, Zbb, Zbs, or any other ISA extension reference anywhere in the libpfm4 codebase. RISC-V is categorically absent at every layer. This is not a stub or partial implementation; no RISC-V-specific file has ever existed in the repository.

Note: The kernel-side counterpart (`drivers/perf/riscv_pmu_sbi.c`, `riscv_pmu_legacy.c`) is in place in the Linux kernel for SBI PMU extension v0.3+. The gap is exclusively in libpfm4's event table and encoding layer, not in the kernel.

---

## 5. Build System, Cross-Compilation, and Toolchain

libpfm4 uses a pure GNU Make build system. There is no CMake, no Autoconf, no Meson, no Dockerfile, and no CI configuration of any kind.

Build system files: `config.mk` (architecture detection and global flags), `Makefile` (top-level targets), `rules.mk` (suffix rules for `.c`/`.cpp` -> `.o`/`.lo`).

**Native build on riscv64 host:**

```
make
make PREFIX=/usr install
make CONFIG_PFMLIB_SHARED=n           # static library only
make CONFIG_PFMLIB_NOPYTHON=y         # skip Python SWIG bindings
```

**What happens when building on riscv64:** `uname -m` returns `riscv64`. The `config.mk` architecture normalization does not match any known pattern, so `ARCH` stays as `riscv64` with no `CONFIG_PFMLIB_ARCH_*` flag set. The generic C library compiles without error (the core code is portable C89/C99 with no architecture-specific intrinsics in the generic path). The resulting library installs successfully but `pfm_initialize()` returns no PMU entries -- `pfm_get_pmu_info()` and `pfm_find_event()` return empty results for any RISC-V PMU name.

**Cross-compilation:** No `CROSS_COMPILE` variable and no documented cross-compilation procedure. To cross-compile, the user must manually override: `make CC=riscv64-linux-gnu-gcc ARCH=riscv64`. This produces the same non-functional result: a compilable library with no RISC-V PMU event tables.

**Required toolchain:** No documented minimum. Any GCC or Clang supporting the Linux 2.6.31+ `perf_event` ABI is sufficient for compilation. No architecture-specific compiler features are required.

**Known build flags:**
- `CONFIG_PFMLIB_SHARED=y/n` -- build shared + static (y, default) or static only (n)
- `CONFIG_PFMLIB_DEBUG=y/n` -- enable/disable debug assertions
- `CONFIG_PFMLIB_NOPYTHON=y/n` -- skip Python SWIG bindings
- `CONFIG_PFMLIB_NOTRACEPOINT=y/n` -- skip tracepoint support

**QEMU usage:** Not documented anywhere in the repository.

**Debian buildd riscv64 build status:** "Maybe-Successful" (not clean "Successful") for all riscv64 builds since at least 2018. This pattern is consistent with the test suite requiring hardware PMU counters unavailable in the build environment, not with a compilation failure. The build artifact is produced and installed correctly.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---------|-------|-------|---------|
| PMU event enumeration (`pfm_find_event`) | Full (Intel P6-GraniteRapids, AMD K7-Zen5) | Full (ARMv6-ARMv9, Neoverse N1-N3/V1-V3, A64FX, Kunpeng, ThunderX2) | Not supported |
| CPU family auto-detection | Yes | Yes | No |
| `perf_event_open` attribute encoding | Full | Full | Not supported |
| Uncore PMU events | Yes (Intel) | Partial | Not supported |
| Linux tracepoint events | Architecture-independent -- available | Architecture-independent -- available | Architecture-independent -- available |
| Software events | Architecture-independent -- available | Architecture-independent -- available | Architecture-independent -- available |
| Python bindings | Yes (built on Linux if SWIG present) | Yes | Builds, but no HW event support |
| PAPI integration | Full | Full | Builds, no HW counter support |

**Functional gaps (riscv64 vs arm64/amd64):**

The entire PMU-specific feature set is absent on riscv64. A user on riscv64 can:
- Call `pfm_initialize()` without error.
- Use software and tracepoint event types via generic `perf_event_open` parameters (these do not require libpfm4's encoding layer).

A user on riscv64 cannot:
- Look up any RISC-V hardware PMU event by name.
- Enumerate supported PMU families for the running CPU.
- Encode RISC-V hardware counter attributes for `perf_event_open`.

Any tool that depends on libpfm4 for hardware counter access (PAPI with hardware component, oprofile, VTune wrappers) falls back to generic `perf_event_open` encoding without the named-event abstraction. PAPI's hardware component would be non-functional.

**Performance gaps:** Not applicable -- no SIMD or numerics in libpfm4.

**Security hardening gaps:** Not applicable -- no cryptographic operations in libpfm4.

**Floating-point/NaN semantics:** Not applicable.

---

## 7. CI/CD Infrastructure

The repository has no CI configuration of any kind.

- `.github/workflows/` directory: HTTP 404 -- does not exist.
- `.travis.yml`, `.cirrus.yml`, `Jenkinsfile`: none present in the repository root (confirmed by directory listing showing only `.gitignore`, `COPYING`, `Makefile`, `README`, `config.mk`, `libpfm.spec`, `rules.mk`, and subdirectories `debian/`, `docs/`, `examples/`, `include/`, `lib/`, `perf_examples/`, `python/`, `tests/`).
- GitHub Actions tab: shows only the onboarding/promotional page -- zero workflow runs, zero workflow files configured.

| CI aspect | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI exists | No | No | No |
| Automated test runs | No | No | No |
| RISE-funded CI runner | No | No | No |
| Release gating | No | No | No |

The absence of CI is uniform across all architectures. There are no RISE CI runners for libpfm4. The Debian buildd system provides the only automated cross-architecture build check, and it is controlled by Debian, not the upstream project.

---

## 8. Distribution and Release Status

**Upstream releases:** None. The wcohen/libpfm4 GitHub repository has zero releases. No release assets exist for any architecture.

**PyPI:** HTTP 404. libpfm4 does not exist as a PyPI package on any architecture.

**RISE wheel builder:** Not present. libpfm4 does not appear in the RISE wheel builder package list.

**Arch Linux RISC-V (archriscv.felixc.at):** Not found. libpfm4 is not in main Arch Linux repositories (it is AUR-only), so absence in the Arch RISC-V port index is expected.

**Debian sid:** Available. Package `libpfm4`, version 4.13.0+git106-g3e4031b-1+b2, status Installed on buildd host rv-manda-02 (~55 days ago). Also `libpfm4-dev` available. riscv64 is a first-class Debian architecture for this package (no "(unofficial port)" designation). Source: [Debian buildd status for libpfm4 sid](https://buildd.debian.org/status/package.php?p=libpfm4&suite=sid).

**Ubuntu 24.04 LTS (Noble):** Available. Packages `libpfm4` and `libpfm4-dev`, version 4.13.0+git32-g0d4ed0e-1, in the universe component. riscv64 is explicitly listed among 7 supported architectures (amd64, arm64, armhf, i386, ppc64el, riscv64, s390x), package size 27.9 kB. Source: [Ubuntu Noble libpfm4](https://packages.ubuntu.com/noble/libpfm4).

**Caveat on distro packages:** The riscv64 Debian/Ubuntu packages compile and install correctly but provide zero RISC-V PMU event support at runtime. A user installing `libpfm4` on a riscv64 system gets a working binary that silently has no hardware PMU entries. Any software linking against it for hardware counter access will see an empty PMU list.

**To get a working binary for riscv64:** Install `libpfm4` from Debian sid or Ubuntu 24.04 universe. The library will be present but non-functional for hardware PMU access until upstream adds RISC-V event tables.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes |
|------------|------|---------------|--------------|-----------------|-------|
| Linux `perf_event` subsystem (kernel) | Core runtime -- all PMU access goes through `perf_event_open(2)` | Yes -- `riscv_pmu_sbi.c`, `riscv_pmu_legacy.c` merged | Functional on SBI v0.3+ boards | Present in all major riscv64 distros | Kernel side is ready; gap is in libpfm4's event table layer only |
| glibc / libc6 | Standard C runtime | Yes -- Debian/Ubuntu riscv64 v2.39+ | Tested | Released | No blockers. See `./libraries/glibc.md` |
| SWIG | Build-time -- generates Python binding glue from `python/src/perfmon_int.i` | Yes -- Debian sid riscv64 v4.4.1-2 | Not separately tested for riscv64 [NEEDS VERIFICATION] | Released | No blockers |
| Python 3 / python3-dev | Optional -- Python bindings in `python/` subdirectory | Yes -- Debian sid riscv64 v3.13.9-3+b1 | Functional | Released | Bindings build; no HW event support on riscv64. See `./runtimes/python.md` |
| ncurses / libncurses-dev | Optional -- `perf_examples/rtop` tool only | Yes -- Debian sid riscv64 v6.6+20251231-1+b1 | Functional | Released | No blockers |
| pthreads (NPTL) | Optional -- `perf_examples/rtop` tool only | Yes -- part of glibc on riscv64 | Functional | Released | No blockers |

**Critical dependency finding:** All build-time and optional runtime dependencies are available in official Debian sid and Ubuntu 24.04 riscv64 packages. There are no dependency blockers for building libpfm4 on riscv64. The single gap is architectural and internal to libpfm4: zero RISC-V PMU event tables. The Linux kernel PMU driver (`riscv_pmu_sbi.c`) is in place, meaning the kernel-side counterpart that libpfm4 would communicate with via `perf_event_open` is ready and waiting.

No dependency in libpfm4 involves JIT compilation, SIMD dispatch, cryptographic operations, or numerics that require separate RISC-V analysis.

---

## 11. Known Bugs and Active Issues

The repository has 4 open issues as of June 2026. None are related to RISC-V.

| # | Title | Status | Severity | Notes |
|---|-------|--------|----------|-------|
| [#9](https://github.com/wcohen/libpfm4/issues/9) | Intel GraniteRapids Uncore event | Open | Medium | Intel correctness; filed July 23, 2025 |
| [#8](https://github.com/wcohen/libpfm4/issues/8) | [bug] UNC_CHA_TOR_INSERTS events all zero | Open | Medium | Intel correctness; filed March 30, 2025 |
| [#7](https://github.com/wcohen/libpfm4/issues/7) | libpfm4 bug: 'sys/ioctl.h: No such file or directory' | Open | Low | Build/environment issue; filed July 17, 2024 |
| [#6](https://github.com/wcohen/libpfm4/issues/6) | Invalid event attribute for cpu_clk_unhalted.thread | Open | Medium | Intel correctness; filed May 9, 2023 |

The repository has 1 closed PR total: [#3](https://github.com/wcohen/libpfm4/pull/3) "Update libpfm.3" (September 2020).

**RISC-V issues:** Zero. GitHub issue search for "riscv" in wcohen/libpfm4 returns total_count: 0. No correctness bug, no build failure, no feature request, and no tracking issue for a RISC-V port exists in the issue tracker.

---

## 12. Objections and Upstream Blockers

**Organizational blockers:**

- Single-maintainer project. Stephane Eranian (Google) controls ~83% of commits and all architectural decisions. A RISC-V port requires his review and merge on the perfmon2-devel mailing list. There is no known objection to RISC-V from Eranian, but there is also no stated interest or engagement. The project operates on a vendor-contribution model: until a RISC-V hardware vendor (SiFive, Alibaba DAMO, Ventana, SpacemiT) or their ecosystem partners submit a patch series, no RISC-V work will be merged.

- No tracking issue exists. There is no upstream acknowledgment that RISC-V support is needed. Any contributor would be starting from zero with no prior community discussion to reference.

**Technical blockers:**

- A complete RISC-V port requires: (1) architecture detection in `config.mk` (`riscv64` branch, `CONFIG_PFMLIB_ARCH_RISCV` flag), (2) a `pfmlib_riscv.c` PMU backend implementing CPU family detection and `perf_event_open` attribute encoding for RISC-V SBI PMU events, (3) event table headers in `lib/events/` for each supported RISC-V CPU microarchitecture (SiFive P870, Alibaba C910/C920, SpacemiT X60, Ventana Veyron, etc.), and (4) integration into `pfmlib_common.c` and `lib/Makefile`.

- The RISC-V PMU event numbering is vendor-specific and partially standardized via the RISC-V SBI PMU extension (v0.3+). Each CPU vendor defines custom events in addition to the standard architectural counters. Event tables would need to be sourced from each vendor's hardware manual. Data availability for non-public pre-production hardware is a constraint.

- No stated objection to RISC-V from any maintainer. The project has historically accepted well-formed vendor patches. Acceptance probability is high if a complete, tested patch series is submitted.

**RISE coverage:** RISE does not fund or contribute to libpfm4. No pre-existing work to avoid duplicating.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The core work is a new RISC-V architecture port. The technical scope is well-defined: one new `pfmlib_riscv.c` source file, one or more `lib/events/riscv_*_events.h` event table headers per supported CPU, `config.mk` additions, and `pfmlib_common.c` guard additions. The Linux kernel PMU driver is already in place (riscv_pmu_sbi.c), which provides the kernel-side specification for what events are exposed.

The effort scales with the number of CPU microarchitectures to cover. A minimal port covering only the standard SBI architectural counters (cycle, instret, and the standardized hardware performance counters from the Sscofpmf extension) is a bounded effort. Expanding to vendor-specific PMU event tables for production silicon (SiFive P870, Alibaba C920, SpacemiT X60, Ventana Veyron) requires access to each vendor's hardware documentation and a target system for validation.

### 13.2 Performance Optimization

Not applicable. libpfm4 contains no SIMD, JIT, or numerics. There is no performance optimization work to do on RISC-V beyond the functional port.

### 13.3 CI/CD Infrastructure

The upstream project has no CI of any kind for any architecture. Adding riscv64 CI is not meaningful in isolation without also establishing baseline CI for the project. A pragmatic approach is to rely on the Debian buildd system (already building riscv64 packages) for compilation verification, and to add a GitHub Actions workflow with QEMU-based test execution for the test suite. However, the test suite requires hardware PMU counters, so QEMU-based testing would only validate software and tracepoint event types unless QEMU's RISC-V PMU emulation covers the SBI PMU extension (data not available: QEMU RISC-V PMU emulation coverage was not searched).

### 13.4 Ecosystem Enablement

libpfm4 has no package ecosystem of plugins or extensions. Section 10 is omitted per the formatting rules. The downstream impact is PAPI's hardware component on RISC-V, which depends on libpfm4 for hardware counter access. Enabling libpfm4 on RISC-V unblocks PAPI hardware profiling.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|-----------------------|-------|----------|
| Functional | RISC-V architecture detection in `config.mk` + `pfmlib_common.c` guard | 0.5 | libpfm4 contributor | Critical |
| Functional | `pfmlib_riscv.c`: CPU family detection + SBI PMU standard event encoding | 3 | libpfm4 contributor | Critical |
| Functional | `lib/events/riscv_sbi_events.h`: standard SBI architectural counters (cycle, instret, Sscofpmf) | 1 | libpfm4 contributor | Critical |
| Functional | `lib/events/riscv_<vendor>_events.h` per production CPU (SiFive P870, Alibaba C920, SpacemiT X60, Ventana Veyron) | 2-3 per CPU | Respective hardware vendor | High |
| Functional | Upstream submission to perfmon2-devel, iteration with Eranian | 2 | libpfm4 contributor | Critical |
| CI/CD | GitHub Actions workflow with QEMU RISC-V for compile + software-event test suite | 1 | libpfm4 contributor | Medium |
| CI/CD | Hardware-in-the-loop test job on physical RISC-V board (VisionFive 2 or equivalent) | 2 | RISE or contributor infra | Medium |

Total for minimal functional port (standard SBI counters, upstream submission): ~6.5-7 person-weeks.
Total for full production coverage (4 CPU vendors + CI): ~16-20 person-weeks.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [wcohen/libpfm4 GitHub mirror](https://github.com/wcohen/libpfm4)
- [libpfm4 / perfmon2 homepage](https://perfmon2.sourceforge.net/)
- [wcohen/libpfm4 commit history](https://github.com/wcohen/libpfm4/commits/master)
- [wcohen/libpfm4 lib/ directory](https://github.com/wcohen/libpfm4/tree/master/lib)
- [wcohen/libpfm4 lib/events/ directory](https://github.com/wcohen/libpfm4/tree/master/lib/events)
- [wcohen/libpfm4 issues tracker](https://github.com/wcohen/libpfm4/issues)
- [wcohen/libpfm4 GitHub Actions tab](https://github.com/wcohen/libpfm4/actions)
- [wcohen/libpfm4 releases](https://github.com/wcohen/libpfm4/releases)
- [Debian buildd status: libpfm4 sid](https://buildd.debian.org/status/package.php?p=libpfm4&suite=sid)
- [Ubuntu Noble: libpfm4](https://packages.ubuntu.com/noble/libpfm4)
- [RISE Project homepage](https://riseproject.dev/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project GitHub org](https://github.com/orgs/riseproject-dev/repositories)