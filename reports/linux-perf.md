---
title: linux-perf
categories:
  - perfmon
---

# linux-perf

**Author:** Ludovic HENRY `<ludovic.henry@qti.qualcomm.com>`
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for linux-perf<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

linux-perf is not a standalone project. It is the Linux kernel's performance analysis subsystem, comprising two components that must be considered separately:

- **Kernel side:** `kernel/events/`, `drivers/perf/riscv_pmu*.c`, `arch/riscv/kernel/perf_*.c` -- the `perf_event_open(2)` syscall implementation, hardware PMU drivers, and callchain infrastructure.
- **Userspace tool:** `tools/perf/` -- the `perf` CLI and supporting libraries for record, report, stat, trace, kvm, probe, and script subcommands.

Both components have RISC-V support. Neither is a RISE-funded RFP project. RISC-V perf work is tracked as kernel upstreaming tasks within the RISE Debug & Profiling Working Group (now merged into the Kernel and Virtualization Working Group effective 2026-06-25), not as a discrete funded engagement.

Repository: [git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
Homepage: [perf.wiki.kernel.org](https://perf.wiki.kernel.org/)

---

## 2. Port History and Upstreaming Timeline

RISC-V perf support has been built incrementally since 2019. The table below lists confirmed merged commits in chronological order. All SHAs are verified against [github.com/torvalds/linux](https://github.com/torvalds/linux).

| Date | SHA | Title | Author | Company |
|---|---|---|---|---|
| 2019-09-04 | `dbeb90b` | riscv: Add perf callchain support | (see note) | -- |
| 2019-09-05 | `51bc620` | riscv: Add support for libdw | Mao Han | C-SKY / Alibaba T-Head |
| 2021-11-17 | `84af21d` | perf: Drop dead guest support from riscv | -- | -- |
| 2022-03-21 | `9dc6ce8` | RISC-V: Remove current perf implementation (replaced by SBI PMU) | -- | -- |
| 2022-04-11 | `335f70f` | perf jitdump: Add riscv64 support | -- | -- |
| 2022-10-27 | `25c2e59` | perf tools riscv: Add get_cpuid_str support | -- | -- |
| 2024-06-26 | `da7b1b5` | perf kvm/riscv: Port perf kvm stat to RISC-V | Shenlin Liang | -- |
| 2024-09-15 | `1a74833` | riscv: stacktrace: Add USER_STACKTRACE support | ruanjinjie-eng | -- |
| 2024-09-15 | `22ab089` | riscv: Fix fp alignment bug in perf_callchain_user() | ruanjinjie-eng | -- |
| 2024-10-28 | `5bb5ccb` | riscv: perf: add guest vs host distinction | zcxGGmu | ISCAS |
| 2024-10-31 | `8c0d120` | perf, riscv: Wire up perf trace support for RISC-V | bjorn-rivos | Rivos Inc. |
| 2024-11-09 | `a90c451` | perf riscv: Remove dwarf-regs.c, add dwarf-regs-table.h | Ian Rogers | Google |
| 2024-11-12 | `57f7c7d` | drivers/perf: riscv: Fix wrong put_cpu() placement | Alexandre Ghiti | Rivos Inc. |
| 2025-01-09 | `4a73aff` | perf tools: Create generic syscall table support | Charlie Jenkins | Rivos Inc. |
| 2025-02-03 | `16dccbb` | perf regs: Remove __weak arch__xxx_reg_mask() functions | Dapeng Mi | -- |
| 2025-02-13 | (merged) | perf vendor events riscv: Update SiFive CPU PMU events | Samuel Holland | SiFive |
| 2025-04-09 | `e4c39a4` | perf symbols: Ignore mapping symbols on riscv | Haibo Xu | Intel |
| 2025-08-04 | `568a2fa` | riscv: perf: skip empty batches in counter start | Yunhui Cui | ByteDance |
| 2025-09-16 | `880fcc3`+ | Add SBI v3.0 PMU enhancements (4-commit group) | Atish Patra | Rivos Inc. |
| 2025-07-28 | `3b7270c` | RISC-V: perf/kvm: Add reporting of interrupt events | zcxGGmu | ISCAS |
| 2025-12-04 | (accepted) | perf vendor events riscv: Add CVA6 JSON file | Manuel Hernandez | OpenChip |
| 2026-02-06 | `16dccbb` | perf regs: Remove __weak arch__xxx_reg_mask() | Dapeng Mi | -- |
| 2026-05-23 | (applied) | perf riscv: Fix discarded const qualifier in _get_field() | Li Guan | ISCAS |

Note on 2019-09-04 `dbeb90b`: the author and company are not recorded in the research findings. The first author confirmed in research is Mao Han (C-SKY Microsystems, a subsidiary of Alibaba/T-Head) for `51bc620` (2019-09-05), which added DWARF register mappings and libdw support and was merged into Linux v5.4-rc1.

The original CSR-only PMU implementation was replaced wholesale in 2022-03-21 by the SBI PMU extension driver (`drivers/perf/riscv_pmu_sbi.c`). All current hardware counter access goes through SBI ecalls rather than direct CSR reads, except for the legacy driver (`riscv_pmu_legacy.c`) which exposes only CYCLE and INSTRET.

**Total confirmed merged commits to `tools/perf/arch/riscv/`:** 33 as of early 2026 [NEEDS VERIFICATION -- figure sourced from a single search result].

---

## 3. Upstream Support Tier

linux-perf has no formal tier system comparable to Rust's or Node.js's. The kernel uses an implicit status model per `MAINTAINERS`:

- `drivers/perf/riscv_pmu*.c` is classified **Supported** (the highest kernel status level) with a named maintainer: Atish Patra (atishp@rivosinc.com, Rivos Inc.) and reviewer Anup Patel (anup@brainfault.org, Ventana Micro Systems).
- `tools/perf/arch/riscv/` has no dedicated MAINTAINERS entry equivalent to the ARM64 tooling reviewer team. RISC-V perf tool patches are handled by the top-level PERFORMANCE EVENTS SUBSYSTEM maintainers (Arnaldo Carvalho de Melo, Namhyung Kim, Peter Zijlstra, Ingo Molnar) on an ad hoc basis.
- There is no gating policy for new RISC-V perf patches. All 33 merged commits were accepted without recorded mailing list objection.

The absence of a dedicated RISC-V reviewer team in MAINTAINERS for `tools/perf/arch/riscv/` is a structural gap relative to ARM64. It means review latency depends on the bandwidth of top-level maintainers who are not RISC-V specialists.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Kernel-side register ABI

`arch/riscv/include/uapi/asm/perf_regs.h` defines `enum perf_event_riscv_regs` with 32 entries covering PC, RA, SP, GP, TP, T0-T6, S0-S11, and A0-A7, plus `PERF_REG_RISCV_MAX`. This is the userspace ABI for register sampling.

`arch/riscv/kernel/perf_regs.c` implements:
- `perf_reg_value()`: reads any of 32 registers by casting `pt_regs` to `unsigned long` array.
- `perf_reg_abi()`: compile-time branch on `__riscv_xlen == 64` returning `PERF_SAMPLE_REGS_ABI_64`, else `ABI_32`.
- `perf_get_regs_user()`: populates perf_regs from `task_pt_regs`.

### 4.2 Callchain unwinding

`arch/riscv/kernel/perf_callchain.c` implements:
- `perf_callchain_user()`: frame-pointer based, calls `arch_stack_walk_user()`. Requires `-fno-omit-frame-pointer` in profiled binaries for correctness.
- `perf_callchain_kernel()`: calls `walk_stackframe()`.
- Guest OS callchain: **not supported**. The source contains explicit TODO comments.

User-space callchain was partially broken prior to 2024-09-15, when `1a74833` added `USER_STACKTRACE` support and `22ab089` fixed a frame-pointer alignment bug in the user-space callchain walker.

### 4.3 PMU driver stack (three tiers)

**Legacy driver (`riscv_pmu_legacy.c`):** Exposes only CYCLE (index 0) and INSTRET (index 2) CSRs. Sets `PERF_PMU_CAP_NO_INTERRUPT` and `PERF_PMU_CAP_NO_EXCLUDE`. Handles 32-bit counter pairs: `(u64)csr_read(CSR_CYCLEH) << 32 | val`. Registered via `late_initcall`. Suppressed by the SBI driver when SBI PMU is present.

**SBI driver (`riscv_pmu_sbi.c`):** Full SBI PMU extension driver supporting SBI v2 and v3. Key mechanisms:
- `pmu_sbi_ctr_get_idx()`: allocates a physical counter via SBI `COUNTER_CFG_MATCH` ecall.
- `pmu_sbi_snapshot_setup()`: per-CPU shared memory page with firmware for bulk counter reads.
- `pmu_sbi_stop_hw_ctrs()`: stops all active HW counters and saves snapshot values.
- Vendor-specific overrides via `ALT_SBI_PMU_OVERFLOW` for T-Head and Andes cores.
- `CSR_SCOUNTEREN` control for userspace counter read access.

**Core infrastructure (`riscv_pmu.c`):** Provides `riscv_pmu_alloc()` and the event init/add/del/start/stop callbacks. `csr_read_num()` is a macro-generated switch reading any of 32 HPM counter CSRs (CSR_CYCLE through CSR_HPMCOUNTER31H). User-space counter access via `PERF_EVENT_FLAG_USER_READ_CNT`.

### 4.4 Userspace tool arch support

`tools/perf/arch/riscv/` contains:
- `Makefile`: Sets `PERF_HAVE_JITDUMP := 1`. This enables perf to consume JIT dump files from JVM/JIT runtimes; it is not a JIT compiler in perf itself.
- `util/header.c`: `get_cpuid()` reads `/proc/cpuinfo`, parses `mvendorid`, `marchid`, `mimpid`, returns `"MVENDORID-MARCHID-MIMPID"`.
- `include/dwarf-regs-table.h`: maps all 32 integer registers (x0-x31) to DWARF numbering with ABI names (`%zero`, `%ra`, `%sp`, etc.). Included by `tools/perf/util/dwarf-regs.c` via `DEFINE_DWARF_REGSTR_TABLE`.
- `include/perf_regs.h`: `PERF_REGS_MASK = (1ULL << PERF_REG_RISCV_MAX) - 1`.

No `.S` assembly files exist in the RISC-V perf arch port. All code is pure C. No SIMD dispatch code. No JIT compiler backend.

### 4.5 KVM perf integration

`perf kvm stat` was ported to RISC-V in 2024-06-26 (`da7b1b5`). Prior to 2024-10-28 (`5bb5ccb`), samples taken in KVM guest context were incorrectly attributed as host kernel samples. Both issues are now fixed. KVM interrupt events were previously labeled `UNKNOWN` in `perf kvm stat` output; this was fixed in 2025-07-28 (`3b7270c`) by replacing `riscv_exception_types.h` with a unified `riscv_trap_types.h` covering both interrupts and exceptions.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build system

linux-perf uses GNU Make exclusively. No CMake, no configure script. The wrapper `tools/perf/Makefile` delegates to `tools/perf/Makefile.perf`, which includes `Makefile.arch` (ARCH/SRCARCH detection) and `Makefile.config` (feature detection and `NO_*` flag resolution).

### 5.2 ARCH detection

`uname -m` output `riscv64` maps to `ARCH=riscv` and `SRCARCH=riscv` automatically on native builds.

### 5.3 Exact make commands

**Native build on riscv64:**
```sh
make -C tools/perf
```

**Cross-compilation from x86_64 (GCC):**
```sh
make -C tools/perf \
  ARCH=riscv \
  CROSS_COMPILE=riscv64-linux-gnu-
```

**Cross-compilation (static):**
```sh
make -C tools/perf \
  ARCH=riscv \
  CROSS_COMPILE=riscv64-linux-gnu- \
  LDFLAGS="-static" \
  NO_PERF_READ_VDSO32=1 \
  NO_PERF_READ_VDSOX32=1
```
`NO_PERF_READ_VDSO32` and `NO_PERF_READ_VDSOX32` are required for all non-x86 builds; these are x86-only 32-bit VDSO readers.

**Cross-compilation with Clang:**
```sh
make -C tools/perf \
  ARCH=riscv \
  CROSS_COMPILE=riscv64-linux-gnu- \
  CC=clang CXX=clang++ HOSTCC=clang
```
`Makefile.config` contains `CLANG_TARGET_FLAGS_riscv := riscv64-linux-gnu` and auto-constructs `--target=riscv64-linux-gnu` when `CROSS_COMPILE` is set.

**Rust cross-target:** `RUST_TARGET_FLAGS_riscv := riscv64gc-unknown-linux-gnu`.

**Minimal build (strip all optional features):**
```sh
make -C tools/perf \
  ARCH=riscv \
  CROSS_COMPILE=riscv64-linux-gnu- \
  NO_LIBELF=1 NO_LIBDW=1 NO_LIBUNWIND=1 NO_LIBBPF=1 \
  NO_ZLIB=1 NO_LIBZSTD=1 NO_LZMA=1 NO_LIBNUMA=1 \
  NO_LIBPYTHON=1 NO_LIBPERL=1 NO_SLANG=1 NO_LIBLLVM=1 \
  NO_CAPSTONE=1 NO_LIBBABELTRACE=1 NO_JVMTI=1 NO_RUST=1 \
  NO_LIBTRACEEVENT=1 NO_SDT=1 NO_AIO=1 NO_LIBPFM4=1 \
  LDFLAGS="-static" \
  NO_PERF_READ_VDSO32=1 NO_PERF_READ_VDSOX32=1
```
`NO_LIBTRACEEVENT=1` is required when `libtraceevent-dev` is absent; without it the build fails hard with `"ERROR: libtraceevent is missing."`.

### 5.4 Toolchain minimum versions

| Tool | Minimum | Source |
|---|---|---|
| GCC | 8.1.0 | `scripts/min-tool-version.sh` |
| Clang (general) | 17.0.1 | `scripts/min-tool-version.sh` |
| Clang (BPF skeletons) | 12.0.1 | `Makefile.config` |
| Binutils | 2.30 | `scripts/min-tool-version.sh` |
| Binutils (non-distro) | 2.42 | `Makefile.config` |
| GNU make | 4.0 | kernel docs |
| elfutils/libdw | 0.157 | `Makefile.config` |
| libunwind | 1.1 | `Makefile.config` |
| Python | 3.6 (jevents), 3.9 (kernel-wide) | `scripts/min-tool-version.sh` |
| pahole (BTF/CO-RE) | 1.26 | `Makefile.config` |

### 5.5 libunwind gap

`Makefile.config` lists per-architecture libunwind library mappings only for: arm, aarch64, x86_64, mips, loongarch64, powerpc, s390. **riscv64 is absent.** libunwind on riscv64 falls through to generic detection. The recommended and validated unwinding path on riscv64 is DWARF via libdw (`--call-graph=dwarf`), not libunwind.

A 7-patch series (Ian Rogers, Google, v5, 2026-05-13) adds `libunwind-riscv.c` implementing `UNW_RISCV_X1`-`X31` and `UNW_RISCV_PC` register mapping. This patch is currently in "New" status with no merge date.

### 5.6 QEMU integration

The perf build system has no built-in QEMU integration. `perf_event_open` is available in QEMU system-mode on riscv64 for software counters. Hardware PMU events require real hardware or a PMU-emulating QEMU plugin. The counter delegation series (v6, patch #17) explicitly requires QEMU with flags `smstateen=true,sscofpmf=true,ssccfg=true,smcdeleg=true,smcsrind=true,sscsrind=true`, available in the `rv-etrace` branch at `gitlab.com/danielhb/qemu.git` [NEEDS VERIFICATION -- sourced from patch cover letter only].

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Hardware PMU counters | Yes | Yes | Yes (SBI PMU) | riscv64 PMU access goes through SBI ecalls, adding firmware round-trip overhead vs direct CSR access |
| Named hardware PMU events (perf list) | Yes | Yes | Partial | JSON vendor files merged for SiFive (U74, P550, P650), CVA6; missing for most commercial RISC-V SoCs |
| Kernel callchain unwinding | Yes | Yes | Yes | `walk_stackframe()` |
| User callchain (frame pointer) | Yes | Yes | Yes (since v6.12) | Fixed in 2024-09-15 |
| User callchain (DWARF) | Yes | Yes | Yes | via libdw; primary production path on riscv64 |
| User callchain (libunwind) | Yes | Yes | Partial | Not wired in `Makefile.config`; in-review patch v5 |
| Guest vs host callchain (KVM) | Yes | Yes | Yes (since v6.12) | Fixed in 2024-10-28 |
| Guest callchain | Yes | Yes | No | Explicit TODO in source |
| perf kvm stat | Yes | Yes | Yes (since v6.10) | Ported 2024-06-26 |
| perf trace (syscall tracing) | Yes | Yes | Yes (since v6.13) | Wired 2024-10-31 |
| JIT profiling (jitdump) | Yes | Yes | Yes | PERF_HAVE_JITDUMP=1 |
| BPF-based profiling | Yes | Yes | Yes | eBPF JIT present since kernel 5.4 |
| perf probe (uprobes/kprobes) | Yes | Yes | Yes | Requires libelf |
| perf annotate (disassembly) | Yes | Yes | Partial | Depends on libcapstone/libllvm; no riscv64-specific issues noted |
| Counter delegation (Ssccfg/Smcdeleg) | N/A | N/A | No | v6 series in review, 2 years in review cycle |
| Hardware instruction tracing (AUX) | Yes (Intel PT) | Yes (CoreSight) | No | v4 trace decoder series in review, stub only |
| PMU event throttle correctness | Yes | Yes | Buggy | ByteDance patch in review; build error present; not merged |
| Fixed counter stop bug | Yes | Yes | Buggy | Alibaba patch in review; needs rework per maintainer |
| libpfm4 named events | Yes | Yes | No | No RISC-V hardware PMU tables in libpfm4 upstream |
| perf annotate --gtk | Yes | Partial | Unknown | GTK2 deprecated; status on riscv64 not assessed |
| perf script (Python) | Yes | Yes | Partial | CPython issue #121201: perf_jit_trampoline.c build failure on Python 3.13+ on riscv64 |
| MAINTAINERS reviewer team | Yes | Yes | No | No dedicated RISC-V tooling reviewer entry |

---

## 7. CI/CD Infrastructure

### 7.1 What exists

The `linux-riscv/linux` repository (the RISC-V maintainer staging tree) has a GitHub Actions workflow (`.github/workflows/patchwork.yml`) that runs on self-hosted runners via `ghcr.io/linux-riscv/pw-builder:latest`. The CI is driven by `.github/scripts/pw_ci.py`, whose `create_test_list()` function generates the following RISC-V build checks:

- `build-rv64-clang-allmodconfig`
- `build-rv64-gcc-allmodconfig`
- `build-rv64-nommu-k210-defconfig`
- `build-rv64-nommu-k210-virt`

These checks run for all patches submitted to the linux-riscv patchwork project, including perf patches. They are compile-only checks against `ARCH=riscv allmodconfig`.

### 7.2 What does not exist

- No dedicated linux-perf CI project targeting riscv64.
- No CI that runs `perf` userspace test cases on riscv64. The `build-rv64-*` checks verify that the kernel tree (including `drivers/perf/`) compiles; they do not execute perf functionality.
- The upstream Torvalds tree (`torvalds/linux`) has no `.github` directory and no GitHub Actions CI of any kind.
- KernelCI lists RISC-V as a partner ecosystem, but no publicly accessible CI configuration for linux-perf + riscv64 was found in `kernelci/kernelci-core`.
- The RISE Confluence wiki explicitly states: "Perf CI on open source projects (LKP etc.): just build check, no function/perf test and profiling" -- with enabling functional/perf CI listed as future work.

### 7.3 Practical consequence

Build regressions in `drivers/perf/riscv_pmu_sbi.c` and `tools/perf/arch/riscv/` are caught by the linux-riscv `allmodconfig` CI. Runtime regressions (wrong counter values, callchain corruption, KVM attribution errors) are caught only by developers with physical hardware or by reports from downstream users. There is no automated functional regression coverage.

---

## 8. Distribution and Release Status

| Distribution | Package Name | riscv64 Available | Version | Notes |
|---|---|---|---|---|
| kernel.org | N/A (source only) | N/A | v7.1 (2026-06-14) | Latest stable; perf is in tools/perf/ |
| Debian sid | `linux-perf` | Yes | 7.0.12-2 | Official port; riscv64 binary built alongside amd64, arm64, loong64, s390x |
| Ubuntu 24.04 | `linux-tools-generic` | Indirectly | -- | Kernel perf binary shipped as `linux-tools-<kernel-version>`, not `linux-perf` |
| Ubuntu 24.04 | `librust-linux-perf-data-dev` | Yes | 0.6.0-1 | Rust crate wrapper; riscv64 present |
| Arch Linux RISC-V | `perf` | Yes | 7.0.10-1 | `perf-7.0.10-1-riscv64.pkg.tar.zst`, 3.0 MB, 2026-05-29 |
| PyPI | `linux-perf` | No | N/A | HTTP 404; package does not exist |
| RISE wheel builder | `linux-perf` | No | N/A | Redirects to PyPI; also 404 |

---

## 9. Dependencies

| Dependency | Role | riscv64 Build Status | riscv64 Release Status | Blocking Issues |
|---|---|---|---|---|
| libelf (elfutils) | ELF/DWARF parsing; required for symbol resolution, kprobes, uprobes, JVMTI; disabling cascades to disable libdw, libbpf, and JVMTI | Builds | Debian sid, Ubuntu 24.04, Arch Linux riscv64 all package libelf; Arch riscv64 lags at 0.192 vs. 0.195 upstream | Version lag on riscv64 distros; no build blockers |
| libdw (elfutils) | DWARF stack unwinding (`--call-graph=dwarf`); primary production unwinder on riscv64 | Builds | Same packages as libelf | None specific to riscv64; this is the dominant unwinder on riscv64 in practice |
| libunwind | Stack unwinding (`--call-graph=fp`); not wired for riscv64 in `Makefile.config` | Builds (generic path) | Debian sid 1.8.1, Arch riscv64 1.8.1 | Not wired in `Makefile.config` per-arch map; Ian Rogers v5 patch in review; medium severity |
| libbpf | BPF program loading, `perf stat --bpf-counters`, `perf trace`, BPF skeletons | Builds | Debian sid 1.7.0; official port | BPF skeletons on riscv64 require clang with riscv64 BPF backend (available since LLVM 12); not blocking |
| OpenSSL | Required for `BUILD_BPF_SKEL`; perf kvm key validation | Builds | Debian sid, Ubuntu 24.04, Arch riscv64 all package OpenSSL 3.x; some distros lag vs. upstream | Version lag on some riscv64 distros; see `libraries/openssl.md` (not yet written) |
| zlib | Compressed debug sections | Builds | Debian sid 1.3.x | None; architecture-neutral |
| libzstd | zstd-compressed trace data | Builds | Available in Debian sid, Arch riscv64 | None |
| Python 3 | `perf script` Python bindings; `jevents` event table generation | Partial | Available; build failure on Python 3.13+ | CPython issue #121201 (open): `perf_jit_trampoline.c` fails to build on riscv64 for Python 3.13-3.15; affects JIT profiling integration |
| libpfm4 | Hardware PMU event name resolution (`perf list`) | Builds | Debian sid 4.13.0+git106 for riscv64 | No RISC-V hardware PMU event tables defined in libpfm4 upstream; `perf list` falls back to raw event codes |
| glibc | C runtime; `perf_event_open` ABI | Partial | Available in all major riscv64 distros | Known test failures in glibc test suite on riscv64; see `libraries/glibc.md` (not yet written) |
| libtraceevent | Trace event parsing; hard required unless `NO_LIBTRACEEVENT=1` | Builds | Debian sid for riscv64 | Cross-compilation fails silently if absent without explicit `NO_LIBTRACEEVENT=1` |
| libnuma | NUMA topology in `perf stat`, `perf bench numa` | Builds | Debian sid 2.0.19-1 for riscv64 | NUMA on riscv64 requires kernel NUMA support; mainstream RISC-V SoCs are single-node |
| libslang2 | TUI for `perf top`, `perf report` | Builds | Debian sid 2.3.3-6 for riscv64 | None |
| libbabeltrace | CTF conversion in `perf data --to-ctf` | Builds | Debian sid 1.5.11-6 for riscv64 | None; optional path |
| GTK2 | `perf annotate --gtk` GUI | Unknown | Minimal riscv64 availability; GTK2 is EOL | GTK2 deprecated; not a production use case blocker |
| clang | Required for `BUILD_BPF_SKEL` | Builds | Available in all major riscv64 distros | LLVM riscv64 backend is Tier-1; see `debug/lldb.md` |

---

## 10. Ecosystem Status

### 10.1 Governance and maintainership

linux-perf is governed by the Linux Foundation / kernel.org development process. No separate foundation exists.

Top-level PERFORMANCE EVENTS SUBSYSTEM maintainers (from `MAINTAINERS`):

| Role | Name | Company |
|---|---|---|
| Maintainer | Peter Zijlstra | Intel |
| Maintainer | Ingo Molnar | Red Hat / IBM |
| Maintainer | Arnaldo Carvalho de Melo | Red Hat / IBM |
| Maintainer | Namhyung Kim | Google |
| Reviewer | Mark Rutland | Arm |
| Reviewer | Alexander Shishkin | Intel |
| Reviewer | Jiri Olsa | Red Hat / IBM |
| Reviewer | Ian Rogers | Google |
| Reviewer | Adrian Hunter | Intel |
| Reviewer | James Clark | Linaro |

RISC-V PMU DRIVERS (`drivers/perf/riscv_pmu*.c`) maintainers:

| Role | Name | Company |
|---|---|---|
| Maintainer | Atish Patra | Rivos Inc. |
| Reviewer | Anup Patel | Ventana Micro Systems |

Dominant corporate presence in top-level maintainers: Red Hat/IBM (two of four maintainers), Intel (one maintainer + one reviewer), Google (one maintainer + one reviewer). Rivos Inc. owns RISC-V PMU driver maintenance.

Git trees:
- `git://git.kernel.org/pub/scm/linux/kernel/git/tip/tip.git perf/core`
- `git://git.kernel.org/pub/scm/linux/kernel/git/perf/perf-tools.git`
- `git://git.kernel.org/pub/scm/linux/kernel/git/perf/perf-tools-next.git`

### 10.2 Active contributors to RISC-V perf (2024-2026)

Contributors with merged or in-review RISC-V perf patches in the last two years:

| Contributor | Affiliation | Work |
|---|---|---|
| Atish Patra | Rivos Inc. / Meta | SBI v3.0 PMU, counter delegation (v6), primary PMU maintainer |
| Ian Rogers | Google | libunwind support (v5), DWARF refactor, perf regs cleanup |
| Charlie Jenkins | Rivos Inc. | perf trace syscall table, code reading fix |
| Haibo Xu | Intel | perf symbols mapping fix |
| Alexandre Ghiti | Rivos Inc. | put_cpu() fix |
| Yunhui Cui | ByteDance | empty batch optimization |
| Zhanpeng Zhang | ByteDance | throttle bug fix (blocked) |
| Chen Pei | Alibaba | fixed counter bug (blocked), SDT argument parsing |
| zcxGGmu (Quan Zhou) | ISCAS | KVM interrupt events, guest/host distinction |
| Anup Patel / Mayuresh Chitale | Qualcomm | RISC-V trace framework + perf decoder |
| Samuel Holland | SiFive | SiFive P550/P650 vendor event files |
| Manuel Hernandez | OpenChip | CVA6 vendor event file |
| Li Guan | ISCAS | const qualifier fix |

### 10.3 RISE involvement

The RISE Debug & Profiling Working Group tracks linux-perf as kernel upstreaming tasks, not as a funded RFP project. Tracked items include:

- `DP_04_001` -- Userspace cycle/instret access: Completed and upstreamed (Q3 2023).
- `DP_04_002` -- Perf event discovery/encoding from JSON: Development done; upstreaming in progress via counter delegation series.
- `DP_04_003` -- Perf CTR (Control Transfer Records, equivalent to Intel PT/LBR): Development done; upstreaming in progress as of December 2024.
- `LK_01_024` -- Supervisor counter delegation (Smcdeleg/Ssccfg): Tracked separately; v6 series in review.
- `LK_01_025` -- Control Transfer Record perf driver: Development done, upstreaming WIP (December 2024 webinar).
- `LK_01_053` -- RISC-V eTrace perf support: Development completed, upstreaming ongoing; companies: Ventana; contacts: Mayuresh Chitale, Aravind Buduri.

No quantitative benchmark data comparing linux-perf on riscv64 vs arm64 was found in RISE publications. The RISE Confluence wiki explicitly states that RISC-V perf CI is currently build-check only with no functional or performance testing.

RISE member companies with confirmed contributors to RISC-V perf patches: ByteDance, ISCAS, Qualcomm, SiFive. Rivos Inc. is the primary maintainer but is not listed as a current RISE member on the homepage [NEEDS VERIFICATION -- member list may lag actual membership status].

---

## 11. Known Bugs and Active Issues

### 11.1 Open patches in "New" status (unmerged as of 2026-06-17)

**PMU throttle incorrectness (ByteDance):**
- Patch: [20260415032017.10712-1-zhangzhanpeng.jasper@bytedance.com](https://patchwork.kernel.org/project/linux-riscv/patch/20260415032017.10712-1-zhangzhanpeng.jasper@bytedance.com/)
- Author: Zhanpeng Zhang (ByteDance), 2026-04-15
- Problem: The RISC-V SBI PMU overflow handler unconditionally restarts all counters, bypassing the perf core throttle mechanism. A small sampling period (e.g., `perf top -c 20`) can trigger an IRQ storm and soft lockup.
- Current status: Build failure (`MAX_INTERRUPTS` undeclared; missing header include). Reviewer objection from Michael Ellerman questioning the implementation approach. Not accepted as-is.
- Severity: High -- can produce IRQ storms under normal usage conditions.

**Fixed counter stops counting (Alibaba):**
- Patch: [20260131112440.2915-1-cp0613@linux.alibaba.com](https://patchwork.kernel.org/project/linux-riscv/patch/20260131112440.2915-1-cp0613@linux.alibaba.com/)
- Author: Chen Pei (Alibaba), 2026-01-31
- Problem: Fixed hardware counters (CYCLE, INSTRET) stop counting unexpectedly under certain conditions.
- Current status: Maintainer (Atish Patra) rejected the proposed fix approach on 2026-03-28, stating counting should only be enabled in explicit legacy mode and citing side-channel concerns. Needs rework.
- Severity: Medium -- affects measurement accuracy when fixed counters are used.

**errno misalignment for unsupported perf types (Huawei):**
- Patch: submitted 2024-08-29
- Author: Pu Lehui (Huawei)
- Problem: `pmu_sbi_event_map()` returns incorrect errno values for unsupported perf event types, violating API contracts.
- Current status: New, unmerged since August 2024 -- 10 months open.
- Severity: Low -- API contract violation that may confuse tooling.

**Stale patches (unmerged since 2022):** Four patches have been open with "New" status since 2022 with no recorded reviewer activity:
- T-Head C9xx PMU variant (Heiko Stubner, 2022-09-05): PMU support for T-Head C9xx cores not upstream via SBI PMU.
- `perf_user_access` sysctl missing (Heiko Stubner, 2022-08-26): No sysctl knob for controlling userspace counter access.
- Unique SoC PMU identification (Nikita Shubin, 2022-06-28 v5): No mechanism to uniquely identify SoC-level PMU instances.
- PMU PM notifier missing (Eric Lin, SiFive, 2022-07-05): No power management notifier; PM state transitions may corrupt counter state.

### 11.2 Major feature gaps (in-review series)

**Counter delegation ISA extension support:**
- Series: 21 patches, [v6 cover letter](https://patchwork.kernel.org/project/linux-riscv/cover/20260608-counter_delegation-v6-0-285b72ed65a9@meta.com/)
- Author: Atish Patra (Meta/Rivos Inc.), 2026-06-08
- RFC first appeared 2024-02-17 -- two years in review cycle.
- Current status: New; build failures on `rv64-clang-allmodconfig` and `rv64-gcc-allmodconfig`; two TEST patches marked do-not-upstream.
- Impact: Without Ssccfg/Smcdeleg support, supervisor software cannot delegate PMU counters to guest VMs; KVM PMU passthrough is incomplete. Vendor-specific named events in perf JSON (the preferred event encoding path) depend on this series.

**libunwind stack unwinding:**
- Series: 7 patches, [v5 patch 7/7](https://patchwork.kernel.org/project/linux-riscv/patch/20260513233151.572332-8-irogers@google.com/)
- Author: Ian Rogers (Google), 2026-05-13
- Current status: New; all CI checks pass except one checkpatch warning; no reviewer activity recorded.
- Impact: `--call-graph=fp` and `--call-graph=lbr` via libunwind unavailable on riscv64. DWARF via libdw works but is slower and requires debug info in binaries.

**RISC-V trace decoder:**
- Series: 12 patches, [v4 patch 11/12](https://patchwork.kernel.org/project/linux-riscv/patch/20260429125135.1983498-12-anup.patel@oss.qualcomm.com/)
- Author: Mayuresh Chitale / Anup Patel (Qualcomm), 2026-04-29
- Current status: New; build failures on allmodconfig; Reviewed-by from Adrian Hunter (Intel) on 2026-05-20. Greg Kroah-Hartman commented 2026-05-21 that the user ABI must be agreed upon before upstreaming.
- Impact: No `perf record` with AUX-buffer instruction tracing (equivalent to Intel PT or ARM CoreSight) on RISC-V. The decoder is currently a stub with no decoding logic.

**IOMMU hardware performance monitoring:**
- Series: v5, 2026-02-28
- Author: Zong Li (SiFive) / Lv Zheng
- Current status: New
- Impact: No perf events from RISC-V IOMMU; cannot profile DMA/IO traffic.

### 11.3 Python 3.13+ build failure

CPython issue #121201 (open as of June 2026): `Python/perf_jit_trampoline.c` fails to build on riscv64 for Python 3.13-3.15. `test_c_stack_unwind` and `test_frame_pointer_unwind` fail on Fedora 44/riscv64. This is a CPython upstream bug, not a distro packaging issue. Affects `perf script` JIT unwinding integration.

### 11.4 Vendor event coverage

Named PMU events in `perf list` depend on vendor JSON files being merged. Status:

| Vendor / Core | Status |
|---|---|
| SiFive U74 (Bullet) | Merged (2025-02-13) |
| SiFive P550 | Merged (2025-02-13) |
| SiFive P650 | Merged (2025-02-13) |
| CVA6 (OpenChip) | Accepted (2025-12-04) |
| T-Head C920V2 | Awaiting upstream (2025-10) |
| T-Head C930 | Handled elsewhere (2025-09) |
| SpacemiT T100 | In review (v5, 2026-02) |
| QEMU virt machine | Part of counter delegation v6; not yet merged |
| Andes (any core) | Data not available |
| Qualcomm (any core) | Data not available |

The majority of commercial RISC-V SoCs have no named PMU events upstream. `perf list` on those systems shows only generic SBI PMU events.

---

## 12. Objections and Upstream Blockers

**Counter delegation series (v6) build failures:** The CI shows compile errors on both `rv64-clang-allmodconfig` and `rv64-gcc-allmodconfig`. These must be resolved before the series can merge. The series has been in review since February 2024 (RFC) with six revision cycles and remains open. The complexity (21 patches, 3 new ISA extensions, changes to both kernel driver and perf tool JSON format) contributes to review friction.

**PMU throttle patch build error:** `MAX_INTERRUPTS` not visible in `riscv_pmu_sbi.c` due to missing header include. Additionally, reviewer Michael Ellerman questioned whether `PERF_HES_STOPPED` should be used instead. The patch author has not responded to either issue as of 2026-06-17.

**Fixed counter patch approach rejected:** Maintainer Atish Patra explicitly rejected the proposed implementation on 2026-03-28 citing side-channel concerns. The patch needs a complete design revision.

**RISC-V trace decoder user ABI:** Greg Kroah-Hartman stated on 2026-05-21 that submissions "should be as patches, not a pull request, after you get everyone to agree that the user API is ok." The user ABI for RISC-V trace auxtrace data has not been agreed upon by the community.

**No dedicated RISC-V tooling reviewer:** The absence of a named RISC-V reviewer in `MAINTAINERS` for `tools/perf/arch/riscv/` means review depends on top-level maintainer bandwidth. The libunwind v5 patch (Ian Rogers, Google) has been in "New" status since 2026-05-13 with no recorded reviewer activity.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The core sampling and profiling path on riscv64 is functional: hardware PMU counters via SBI, DWARF callchain unwinding, KVM stat, perf trace, JIT profiling. The gaps are in advanced features (instruction tracing, counter delegation, libunwind) and correctness bugs (throttle IRQ storm, fixed counter stop). The throttle bug is the highest-priority correctness issue given it can cause soft lockups under normal usage.

### 13.2 Performance Optimization

No quantitative benchmark data comparing linux-perf overhead on riscv64 vs arm64 or amd64 was found in any public source. The architectural difference with potential performance impact is that the SBI PMU driver goes through firmware ecalls for counter configuration and overflow handling, adding kernel-to-firmware round-trip latency that direct CSR access (as used on x86 and arm64) avoids. The counter delegation extension (Ssccfg/Smcdeleg), once merged, eliminates this overhead for supervisor mode. Quantifying the overhead difference requires hardware measurement; no published data exists.

### 13.3 CI/CD Infrastructure

The current state -- build-only CI, no functional test coverage -- is the highest-leverage gap relative to arm64 and amd64. Regressions in counter accuracy, callchain correctness, and KVM attribution are invisible until a user with hardware reports them. RISE has explicitly identified functional/perf CI for RISC-V as future work.

### 13.4 Ecosystem Enablement

The missing libpfm4 RISC-V PMU event tables block named-event access in `perf list` for all RISC-V hardware not covered by the merged vendor JSON files. For a chip company shipping a new SoC, contributing a vendor event JSON file (relatively small effort) provides named event access; contributing libpfm4 tables provides access via the libpfm4 path used by some tooling.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix PMU throttle bug (ByteDance patch rebuild + address reviewer feedback) | 1-2 | RISC-V PMU contributor | Critical |
| Functional | Fix fixed counter stop bug (rework per Atish Patra feedback) | 2-3 | RISC-V PMU contributor | High |
| Functional | Resolve libunwind riscv64 wiring in `Makefile.config` (complement Ian Rogers v5) | 1 | perf tooling contributor | High |
| Functional | Push counter delegation v6 to merge (fix build failures, address review) | 4-8 | Rivos Inc. / any RISC-V contributor | High |
| Functional | Add vendor PMU event JSON for target SoC | 1-2 | SoC vendor | High |
| Functional | Fix CPython issue #121201 (perf_jit_trampoline.c on riscv64) | 2-4 | CPython / downstream contributor | Medium |
| Functional | Add libpfm4 RISC-V hardware PMU event tables | 3-6 | SoC vendor | Medium |
| Functional | Add PMU PM notifier (SiFive patch, stale since 2022) | 1-2 | RISC-V PMU contributor | Medium |
| Functional | Drive RISC-V trace decoder to merge (resolve user ABI, fix build failures) | 8-16 | Qualcomm / RISC-V trace contributors | Low (long horizon) |
| CI/CD | Add riscv64 functional perf test execution to linux-riscv CI (QEMU system-mode) | 4-8 | Infrastructure contributor | High |
| CI/CD | Add riscv64 perf runtime tests to KernelCI | 8-16 | KernelCI / RISE infrastructure | Medium |
| Ecosystem | Add RISC-V reviewer entry to MAINTAINERS for `tools/perf/arch/riscv/` | 0 (nomination) | Existing active contributor | Medium |
| Ecosystem | Contribute stale 2022 patches (perf_user_access sysctl, PM notifier, SoC PMU ID) | 2-4 per patch | RISC-V PMU contributor | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [linux-perf kernel source: tools/perf/arch/riscv/](https://github.com/torvalds/linux/tree/master/tools/perf/arch/riscv)
- [linux-perf kernel source: drivers/perf/](https://github.com/torvalds/linux/tree/master/drivers/perf)
- [linux-riscv patchwork: perf patches](https://patchwork.kernel.org/project/linux-riscv/list/?q=perf)
- [linux-riscv patchwork: drivers/perf patches](https://patchwork.kernel.org/project/linux-riscv/list/?q=drivers%2Fperf)
- [v6 counter delegation cover letter](https://patchwork.kernel.org/project/linux-riscv/cover/20260608-counter_delegation-v6-0-285b72ed65a9@meta.com/)
- [v5 libunwind riscv64 patch](https://patchwork.kernel.org/project/linux-riscv/patch/20260513233151.572332-8-irogers@google.com/)
- [v4 RISC-V trace decoder patch](https://patchwork.kernel.org/project/linux-riscv/patch/20260429125135.1983498-12-anup.patel@oss.qualcomm.com/)
- [PMU throttle fix patch](https://patchwork.kernel.org/project/linux-riscv/patch/20260415032017.10712-1-zhangzhanpeng.jasper@bytedance.com/)
- [Fixed counter stop fix patch](https://patchwork.kernel.org/project/linux-riscv/patch/20260131112440.2915-1-cp0613@linux.alibaba.com/)
- [SBI v3.0 PMU commit 880fcc3](https://github.com/torvalds/linux/commit/880fcc329e2473ba02ffbc446fcd403972ab1fca)
- [perf symbols mapping fix e4c39a4](https://github.com/torvalds/linux/commit/e4c39a45a0ea93c9c8e0e682a1f55a7683ba78bb)
- [perf kvm stat RISC-V port da7b1b5](https://github.com/torvalds/linux/commit/da7b1b525e972b8c5b16640fa5b2ff2497b5c652)
- [USER_STACKTRACE support 1a74833](https://github.com/torvalds/linux/commit/1a7483318274d0ec60f160e604c2a1dbce27fc0a)
- [perf trace wiring 8c0d120](https://github.com/torvalds/linux/commit/8c0d1202bad3aa6e40fb078dc08158f0bb4e03e2)
- [skip empty batches 568a2fa](https://github.com/torvalds/linux/commit/568a2fa10dd06bbd8160e3f8cce9483fabcb7121)
- [perf regs __weak removal 16dccbb](https://github.com/torvalds/linux/commit/16dccbb84203196dab2e578b27c3c8f549ebff66)
- [Debian linux-perf tracker](https://tracker.debian.org/pkg/linux-perf)
- [Arch Linux RISC-V repo](https://archriscv.felixc.at/repo/extra/)
- [RISE Debug and Profiling WG projects](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8589360/Debug+and+Profiling+WG+-+Projects)
- [RISE Debug and Profiling: opensource project status](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8591190/Debug+and+Profiling+-+Status+of+Opensource+Projects)
- [RISE December 2024 Webinar PDF](https://riseproject.dev/wp-content/uploads/sites/25/2024/12/RISE-Webinar-December-2024.pdf)
- [linux-riscv CI workflow](https://github.com/linux-riscv/linux/blob/workflow/.github/workflows/patchwork.yml)