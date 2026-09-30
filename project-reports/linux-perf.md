---
title: linux-perf
parent: Project Reports
color: yellow
dependencies:
  - name: elfutils
    relation: runtime-dependency
    criticality: critical
  - name: libtraceevent
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: libunwind
    relation: runtime-dependency
    criticality: optional
  - name: libbpf
    relation: runtime-dependency
    criticality: optional
  - name: OpenSSL
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: Python
    relation: runtime-dependency
    criticality: optional
  - name: libpfm4
    relation: runtime-dependency
    criticality: optional
  - name: libnuma
    relation: runtime-dependency
    criticality: optional
  - name: babeltrace
    relation: runtime-dependency
    criticality: optional
  - name: GTK2
    relation: runtime-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="linux-perf" %}

# linux-perf

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for linux-perf<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

linux-perf is not a standalone project with its own repository, release cadence, or governance body. It is the Linux kernel's performance-analysis subsystem, split across two components that must be evaluated separately:

- **Kernel side:** `kernel/events/` (arch-neutral core), `drivers/perf/riscv_pmu*.c` (RISC-V PMU drivers), `arch/riscv/kernel/perf_*.c` (register ABI and callchain unwinding) -- the `perf_event_open(2)` syscall implementation and hardware counter drivers.
- **Userspace tool:** `tools/perf/` -- the `perf` CLI (record, report, stat, trace, kvm, probe, script, annotate) and its supporting libraries.

Both components carry RISC-V support. The project is governed by the standard Linux kernel process: no separate foundation, no board, no membership tiers. Changes go through mailing-list review (lkml, linux-riscv, linux-perf-users) and land via the `tip` tree or the dedicated perf-tools trees, merged by Linus Torvalds. There is no GitHub repository, no GitHub issues/PRs for this project -- it is developed entirely on kernel.org mailing lists as patch series, a scope constraint confirmed across every research pass in this report.

Top-level PERFORMANCE EVENTS SUBSYSTEM maintainers (from `MAINTAINERS`): Peter Zijlstra, Ingo Molnar (Red Hat), Arnaldo Carvalho de Melo (Red Hat, perf-tools lead), Mark Rutland (Arm, reviewer). RISC-V PMU drivers have their own `MAINTAINERS` entry: Atish Patra (Rivos Inc.) as the named PMU maintainer, with Anup Patel (Ventana Micro Systems) and Albert Ou reviewing. RISC-V architecture maintainers Palmer Dabbelt (Rivos) and Conor Dooley (Microchip) oversee the surrounding arch tree. Git trees: `git://git.kernel.org/pub/scm/linux/kernel/git/tip/tip.git` and `git://git.kernel.org/pub/scm/linux/kernel/git/acme/linux.git`. Mailing list: `linux-perf-users@vger.kernel.org`.

License: GPLv2, kernel-standard. `perf` has been part of mainline since Linux 2.6.31 (2009). `perf.wiki.kernel.org` now redirects to `perfwiki.github.io`, a JS-rendered GitHub Pages site whose content could not be extracted by automated fetch during this research.

Neither the kernel-side PMU driver nor the userspace `perf` tool is a RISE-funded RFP project. Per the project's own RISE sw-ecosystem status report, RISC-V perf work is tracked informally as kernel-upstreaming line items by RISE's Debug and Profiling Working Group, merged into the Kernel and Virtualization Working Group effective 2026-06-25, not as a discrete funded engagement.

Community stance on new ports is the standard upstream-kernel posture: no special gatekeeping beyond normal `linux-riscv` / `linux-perf-users` maintainer review. RISC-V perf/PMU patches are accepted or rejected on technical merit through the ordinary review cycle (see Section 12 for specific rejections).

Repository: [git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
Homepage: [perf.wiki.kernel.org](https://perf.wiki.kernel.org/)

## 2. Port History and Upstreaming Timeline

The first RISC-V PMU driver was introduced by Alan Kao (Andes Technology) in "[PATCH 0/2] perf: riscv: Preliminary Perf Event Support on RISC-V", posted to LKML in March-April 2018. Full-content fetch of the v3/v4 threads confirms an 802-line, two-patch series: a baseline PMU driver (`arch/riscv/kernel/perf_event.c`, +468 lines, implementing `riscv_base_pmu` with two hardware events -- instructions and cycles) plus a porting-guide document (`Documentation/riscv/pmu.txt`, +249 lines). This was merged for **Linux 4.18** (commit `178e9fc47aae`, merged 2018-06-16 via the `riscv-for-linus-4.18-merge_window` tag, released 2018-08-12), independently confirmed by Phoronix ("RISC-V Changes Merged For Linux 4.18, Early Perf Subsystem Work").

The original CSR-only PMU implementation was replaced wholesale on 2022-03-21 (`9dc6ce8`, "RISC-V: Remove current perf implementation") by the SBI PMU extension driver (`drivers/perf/riscv_pmu_sbi.c`). All modern hardware counter access goes through SBI ecalls rather than direct CSR reads; the legacy driver (`riscv_pmu_legacy.c`) remains only as a fallback exposing CYCLE and INSTRET.

Confirmed merges, verified against actual commit SHAs in `torvalds/linux`:

| Date merged | SHA | Title | Author / Company | First release |
|---|---|---|---|---|
| 2018-06-16 | [`178e9fc47aae`](https://github.com/torvalds/linux/commit/178e9fc47aaec1b8952b553444e94802d7570599) | perf: riscv: preliminary RISC-V support | Alan Kao, Andes Technology | v4.18 |
| 2021-11-08 | [`0ba37e05c240`](https://github.com/torvalds/linux/commit/0ba37e05c240c7b38e5a327a96f404798a8698ff) | perf annotate: Add riscv64 support | William Cohen, Red Hat | v5.16 |
| 2023-09-01 | [`7aa7d502e4d5`](https://github.com/torvalds/linux/commit/7aa7d502e4d5a42353325cb4bf2aa880b10168e9) | riscv: Allow userspace to directly access perf counters (10-patch series, v6/final) | Alexandre Ghiti, Rivos Inc. | v6.6 |
| 2024-03-01 | [`34b567868777`](https://github.com/torvalds/linux/commit/34b567868777e9fd39ec5333969728a7f0cf179c) | perf: RISCV: Fix panic on pmu overflow handler (CVE-2024-26902 fix) | Fei Wu | v6.8 (backported to 6.7.11) |
| 2024-11-08 | [`5bb5ccb3e8d8`](https://github.com/torvalds/linux/commit/5bb5ccb3e8d8dba29941cd78d5c1bcd27b227b4a) + [`eded6754f398`](https://github.com/torvalds/linux/commit/eded6754f398b5b4950e8f593f75fee63a8b49ad) | riscv: perf: add guest vs host distinction + riscv: KVM: basic host vs guest profiling | Quan Zhou, ISCAS | v6.13 |

Additional merges reported in the existing project tracking (not independently re-verified against commit SHAs in this round, retained with [NEEDS VERIFICATION]): `perf jitdump: Add riscv64 support` (2022-04-11, `335f70f`); `perf tools riscv: Add get_cpuid_str support` (2022-10-27, `25c2e59`); `riscv: stacktrace: Add USER_STACKTRACE support` and `riscv: Fix fp alignment bug in perf_callchain_user()` (both 2024-09-15); `perf riscv: Remove dwarf-regs.c, add dwarf-regs-table.h` (Ian Rogers, Google, 2024-11-09); `drivers/perf: riscv: Fix wrong put_cpu() placement` (Alexandre Ghiti, Rivos, 2024-11-12); `perf tools: Create generic syscall table support` (Charlie Jenkins, Rivos, 2025-01-09); `perf regs: Remove __weak arch__xxx_reg_mask() functions` (Dapeng Mi, 2025-02-03/2026-02-06); SiFive CPU PMU vendor events (Samuel Holland, SiFive, 2025-02-13); `perf symbols: Ignore mapping symbols on riscv` (Haibo Xu, Intel, 2025-04-09); `riscv: perf: skip empty batches in counter start` (Yunhui Cui, ByteDance, 2025-08-04); SBI v3.0 PMU enhancements (Atish Patra, Rivos, 2025-09-16); KVM interrupt event reporting (Quan Zhou, ISCAS, 2025-07-28); CVA6 vendor JSON (Manuel Hernandez, OpenChip, 2025-12-04); and `perf riscv: Fix discarded const qualifier in _get_field()`, confirmed independently below as commit `7378b6656aa4` (Li Guan, applied 2026-06-26).

Two threads were explicitly verified as **not merged**, correcting the implied trajectory of a strictly linear, all-accepted upstreaming path: "[PATCH v5 0/4] RISC-V: Create unique identification for SoC PMU" (Nikita Shubin, posted 2022-06-28, stalled at v5, no matching commit found in `torvalds/linux`), and "[PATCH] perf callchain: Support riscv cross-platform" (Paran Lee, 2023-11-22), which the 0-Day kernel test robot flagged with multiple compile failures in `util/unwind-libunwind.c` (undefined labels, unused variables, a missing `tools/arch/riscv/include/uapi/asm/kvm.h`) and which has no merged follow-up.

Two more recent build-regression fixes, confirmed via full thread fetch, are notable data points on ongoing RISC-V perf build health rather than feature work: a GCC-13-only `-Werror=alloc-size-larger-than=` false positive in `cpumap.c` introduced by commit `5cf6e76e4f4f` (reported by Haixiao Yan, 2026-03-19, fixed by Ian Rogers, Google, backport requested to linux-6.6.y), and a GCC-14 `-Werror=discarded-qualifiers` regression in `tools/perf/arch/riscv/util/header.c` (Li Guan, submitted 2026-05-13, applied as commit `7378b6656aa4` on 2026-06-26 after Ian Rogers rejected a broader, incorrect first attempt that would have decoupled arch-specific auxtrace decoders -- code that is deliberately built in so perf.data recorded on x86/ARM can be analyzed on RISC-V).

## 3. Upstream Support Tier

linux-perf has no formal tier system comparable to a language runtime's Tier-1/Tier-2 classification. Kernel status is implicit via `MAINTAINERS` entries:

- `drivers/perf/riscv_pmu*.c` carries a named maintainer (Atish Patra, Rivos Inc.) and reviewer (Anup Patel, Ventana Micro), the kernel's highest informal support signal.
- `tools/perf/arch/riscv/` has **no dedicated MAINTAINERS entry**. Patches to it are handled ad hoc by the top-level PERFORMANCE EVENTS SUBSYSTEM maintainers, who are not RISC-V specialists. This is a structural gap relative to arm64, which has its own tooling reviewer coverage via Arm-affiliated maintainers.
- There is no gating policy specific to new RISC-V perf patches beyond ordinary review. Acceptance and rejection both occur on technical grounds (see Section 12).

| Tier signal | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Named PMU driver maintainer | Yes (x86 team) | Yes (Arm) | Yes (Atish Patra, Rivos) |
| Dedicated `tools/perf/arch/*` reviewer | Yes | Yes | No -- handled by top-level maintainers |
| Release-blocking on CI failure | De facto (build fails block merge) | De facto | Build-only (see Section 7); no functional test gating |
| Distro-shipped official binary | Yes, primary arch | Yes, primary arch | Yes, but via Ubuntu's ports (secondary) pocket at an older version (Section 8) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Component-level maturity, established by direct reading of current mainline source (`git.kernel.org` cgit, cross-checked via `github.com/torvalds/linux` mirror; a prior AI-generated summary of this tree was discarded after it was found to hallucinate filenames):

| Component | File(s) | Size | Rating | Notes |
|---|---|---|---|---|
| Kernel PMU driver (SBI) | `drivers/perf/riscv_pmu_sbi.c` | 1630 lines | Full, hand-tuned | Raw/cache events, overflow-IRQ handling with CVE-2024-26902's `BIT_ULL(lidx)` fix present and correct, sysctl-gated userspace direct counter access, legacy fallback |
| Legacy PMU driver | `drivers/perf/riscv_pmu_legacy.c` | 177 lines | Full | Pre-SBI-PMU fallback, CYCLE/INSTRET only |
| KVM guest PMU virtualization | `arch/riscv/kvm/vcpu_pmu.c` | 947 lines | Full, hand-tuned | Substantial implementation, not a shim |
| perf_regs / uprobe SDT arg parsing | `tools/perf/util/perf-regs-arch/perf_regs_riscv.c` | 221 lines | Full | Complete register table, ip/sp accessors, full SDT operand regex parser -- on par with aarch64's 229-line equivalent |
| perf annotate (disassembly classification) | `tools/perf/util/annotate-arch/annotate-riscv64.c` | 41 lines | Partial | Classifies jal/jr/call/ret/branch opcodes so call-graph arrows render, but has no custom operand/target parsing -- unlike arm64 (127 lines, resolves adrp+add PC-relative targets to symbol names) or x86 (852 lines). RISC-V's auipc+jalr far-call idiom is not specially resolved |
| `perf kvm stat` (host-side guest/host attribution) | -- | -- | Missing | No `tools/perf/arch/riscv/util/kvm-stat.c`, zero "riscv" hits in `builtin-kvm.c`. Quan Zhou's series (item 7, Section 2) remains unmerged upstream as of this research date, despite the existing project tracking having recorded it as landed -- this is a direct correction: the patch adds host/guest PMU-interrupt disambiguation and was tested with QEMU 9.0.0 nested KVM (perf kvm top distinguishing host/guest symbols, perf kvm record capturing ~18,000 samples in 60s), but is still "under active revision" per the mailing-list thread, not confirmed merged by direct source inspection |
| `perf trace` (syscall tracing) | -- | -- | Missing | No `tools/perf/arch/riscv/entry/`, no `trace/beauty/riscv/`, no arch syscall table header found in current tree. The Dec 2024 thread "Re: [PATCH] perf, riscv: Wire up perf trace support for RISC-V" was "in discussion," not confirmed merged |
| DWARF/CFI call-graph unwind | -- | -- | Not arch-specific | `unwind-libdw.c` / `unwind-libunwind.c` carry no riscv-specific code; relies on generic code plus external libdw/elfutils, same situation as most other perf-tools arches |

Note: the current tree's layout differs from what the 2021 "perf annotate: Add riscv64 support" patch (Section 2, item 2) implies. `perf_regs` and `annotate` logic have since been refactored into shared cross-arch directories (`tools/perf/util/perf-regs-arch/`, `tools/perf/util/annotate-arch/`) that build every architecture into one binary, enabling cross-arch trace analysis (a perf.data file recorded on x86 can be parsed on riscv64). `tools/perf/arch/riscv/` proper is now deliberately thin by design: `Build`, `Makefile`, two headers, and a 104-line `util/header.c` for CPU-ID string generation (`mvendorid-marchid-mimpid` parsed from `/proc/cpuinfo`).

No `.S` assembly files exist anywhere in the RISC-V perf port -- all code is C. There is no SIMD dispatch code specific to perf (the generic `arch/riscv/kernel/vector.c` handles RVV context-switch support but is not perf-specific) and no JIT backend within perf itself (`PERF_HAVE_JITDUMP := 1` lets perf consume JIT dump files emitted by JVMs/JIT runtimes; this is a consumer feature, not a JIT compiler in perf).

`arch/riscv/kernel/perf_regs.c` implements `perf_reg_value()` (casts `pt_regs` to an `unsigned long` array, indexable across 32 registers), `perf_reg_abi()` (compile-time branch on `__riscv_xlen`), and `perf_get_regs_user()`. `arch/riscv/kernel/perf_callchain.c` implements frame-pointer-based `perf_callchain_user()` (requires `-fno-omit-frame-pointer` in profiled binaries for correctness) and `perf_callchain_kernel()`; guest-OS callchain support is explicitly absent (TODO comments in source), consistent with the missing `perf kvm stat` finding above.

## 5. Build System, Cross-Compilation, and Toolchain

linux-perf uses GNU Make exclusively (`Makefile` -> `Makefile.perf` -> `tools/build/Makefile.build`). There is no CMake, no `configure` script, and no Dockerfile anywhere under `tools/perf/` -- confirmed by direct directory listing of the tree (`.clang-format .gitignore Build CREDITS Documentation MANIFEST Makefile Makefile.config Makefile.perf arch bench bpf_skel.mak ...`).

**Native build on riscv64:**
```
make -C tools/perf
```

**Cross-compilation (GCC):**
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -C tools/perf
```

**Cross-compilation (static):**
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- LDFLAGS="-static" -C tools/perf
```

**With explicit pkg-config sysroot (embedded/cross toolchains):**
```
PKG_CONFIG_SYSROOT_DIR="/path/to/cross/build/sysroot" \
PKG_CONFIG_LIBDIR="/usr/lib/:/usr/local/lib" \
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -C tools/perf
```

**With Clang** (confirmed via `Makefile.config`'s `CLANG_TARGET_FLAGS_riscv := riscv64-linux-gnu`, auto-constructing `--target=riscv64-linux-gnu`):
```
HOSTCC=clang CC=clang CXX=clang++ ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- make -C tools/perf
```

**Install:**
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- DESTDIR=/usr -C tools/perf install
```

**Minimal build, stripping optional features:**
```
make -C tools/perf ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- \
  NO_LIBELF=1 NO_LIBDW=1 NO_LIBUNWIND=1 NO_LIBBPF=1 NO_ZLIB=1 NO_LIBZSTD=1 \
  NO_LZMA=1 NO_LIBNUMA=1 NO_LIBPYTHON=1 NO_SLANG=1 NO_LIBLLVM=1 NO_CAPSTONE=1 \
  NO_LIBBABELTRACE=1 NO_JVMTI=1 NO_RUST=1 NO_LIBTRACEEVENT=1 NO_SDT=1 NO_AIO=1 \
  NO_LIBPFM4=1 LDFLAGS="-static"
```
`NO_LIBTRACEEVENT=1` is required whenever `libtraceevent-dev` is absent from the sysroot; without it, the build fails hard with `"ERROR: libtraceevent is missing."` -- this is a hard, silent-cross-compile-failure risk flagged in the dependency research (Section 9).

Rust cross-target for perf's optional Rust components: `RUST_TARGET_FLAGS_riscv := riscv64gc-unknown-linux-gnu`.

Feature-selection flags (the functional equivalent of CMake's `-DUSE_X=OFF`) are `NO_<FEATURE>=1` make variables read from `Makefile.config`: `NO_LIBUNWIND, NO_LIBDW, NO_LIBBPF, NO_JVMTI, NO_LIBELF, NO_SDT, NO_LIBDEBUGINFOD, NO_AIO, NO_ZLIB, NO_SLANG, NO_GTK2, NO_LIBPYTHON, NO_JEVENTS, NO_LIBLLVM, NO_DEMANGLE, NO_LZMA, NO_LIBZSTD, NO_BACKTRACE, NO_LIBNUMA, NO_PERF_READ_VDSO32, NO_PERF_READ_VDSOX32, NO_BABELTRACE2, NO_CAPSTONE, NO_JVMTI_CMLR, NO_LIBPFM4, NO_LIBTRACEEVENT, NO_RUST, NO_LOCAL_LIBUNWIND`.

riscv-relevant `Makefile.config` entries:
```
CLANG_TARGET_FLAGS_riscv    := riscv64-linux-gnu
RUST_TARGET_FLAGS_riscv     := riscv64gc-unknown-linux-gnu
LIBUNWIND_ARCHS := aarch64 arm loongarch64 mips ppc32 ppc64 riscv s390x x86 x86_64
ifeq ($(SRCARCH),riscv)
  LIBUNWIND_LIBS := -lunwind -lunwind-riscv
endif
```
Note `NO_PERF_READ_VDSO32` and `NO_PERF_READ_VDSOX32` should be set on all non-x86 cross builds -- these guard x86-only 32-bit VDSO readers that otherwise fail on riscv64 targets.

**Toolchain minimum versions**, from `Documentation/process/changes.rst` (kernel-wide, applying to the headers/uapi perf consumes; no separate riscv-specific minimums were found -- the `Documentation/riscv/patch-acceptance.rst` / toolchain pages returned 404 on this fetch, so this is flagged rather than guessed): GCC 8.1, Clang/LLVM 17.0.1 (12.0.1 specifically for BPF skeleton compilation per `Makefile.config`), GNU binutils 2.30 (2.42 for non-distro builds per `Makefile.config`), GNU make 4.0, bash 4.2, flex 2.5.35, bison 2.0, Rust 1.85.0 (optional), bindgen 0.71.1 (optional). These matter for riscv64 specifically because the RVV/newer-ISA-extension assembler and disassembler support (and libunwind's riscv backend) depend on toolchain version, not a perf-internal check.

**libunwind gap:** `Makefile.config` lists per-architecture libunwind mappings for arm, aarch64, x86_64, mips, loongarch64, powerpc, and s390 -- **riscv64 is absent** from this explicit map, falling through to generic detection. The production-validated unwinding path on riscv64 is therefore DWARF via libdw (`--call-graph=dwarf`), not libunwind. A 7-patch series from Ian Rogers (Google), v5 as of 2026-05-13, adds `libunwind-riscv.c` with `UNW_RISCV_X1`-`X31` / `UNW_RISCV_PC` mapping; it remains unmerged (Section 11/12).

**QEMU:** no QEMU integration is documented in `tools/perf/Documentation/`, and no perf-specific QEMU test harness exists in the tree. `perf_event_open` works in QEMU system-mode for software counters; hardware PMU events require real hardware or a PMU-emulating QEMU plugin. The counter-delegation series (Section 11) requires QEMU built with `smstateen=true,sscofpmf=true,ssccfg=true,smcdeleg=true,smcsrind=true,sscsrind=true`, reportedly available on the `rv-etrace` branch at `gitlab.com/danielhb/qemu.git` [NEEDS VERIFICATION -- sourced only from a patch cover letter, not independently confirmed this round].

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Notes |
|---|---|---|---|---|
| Hardware PMU counters | Yes | Yes | Yes (SBI PMU) | SBI ecalls add firmware round-trip latency vs direct CSR access on amd64/arm64 |
| Named hardware PMU events (`perf list`) | Yes | Yes | Partial | JSON vendor files merged for SiFive U74/P550/P650 and CVA6; missing for most commercial SoCs |
| Kernel callchain unwinding | Yes | Yes | Yes | `walk_stackframe()` |
| User callchain (frame pointer) | Yes | Yes | Yes | Fixed by `1a74833` (2024-09-15) [NEEDS VERIFICATION on exact SHA] |
| User callchain (DWARF) | Yes | Yes | Yes | Via libdw; primary production path |
| User callchain (libunwind) | Yes | Yes | Not wired | See Section 5; v5 patch in review |
| Guest vs host callchain (KVM) | Yes | Yes | Unmerged | Quan Zhou's series remains under active revision, not confirmed merged (see Section 4 correction) |
| Guest-OS callchain | Yes | Yes | No | Explicit TODO in source |
| `perf kvm stat` | Yes | Yes | Not confirmed merged | Source inspection found no `kvm-stat.c` arch backend for riscv (Section 4) |
| `perf trace` (syscall tracing) | Yes | Yes | In discussion | Dec 2024 thread; not confirmed merged |
| JIT profiling (jitdump) | Yes | Yes | Yes | `PERF_HAVE_JITDUMP=1` |
| BPF-based profiling | Yes | Yes | Yes | eBPF JIT present since kernel 5.4; BPF skeletons need clang's riscv64 BPF backend (available since LLVM 12) |
| `perf probe` (uprobes/kprobes) | Yes | Yes | Yes | Requires libelf |
| `perf annotate` (disassembly) | Full (852 lines) | Partial-plus (127 lines, resolves PC-relative targets) | Partial (41 lines) | No custom target resolution for RISC-V's auipc+jalr far-call idiom |
| Counter delegation (Ssccfg/Smcdeleg) | N/A | N/A | No | v6 series in review, in the review cycle since RFC (Feb 2024); build failures reported on rv64-clang/gcc-allmodconfig |
| Hardware instruction tracing (AUX) | Yes (Intel PT) | Yes (CoreSight) | No | v4 trace decoder series (Qualcomm) in review, user-ABI not yet agreed per Greg Kroah-Hartman |
| PMU throttle correctness | Correct | Correct | Buggy | ByteDance fix has a build error and an unresolved reviewer objection |
| Fixed-counter-stop correctness | Correct | Correct | Buggy | Alibaba fix's design was rejected by the maintainer |
| libpfm4 named events | Yes | Yes | No | No RISC-V hardware PMU event tables exist in libpfm4 upstream; `perf list` falls back to raw event codes |
| `perf script` (Python bindings) | Yes | Yes | Partial | Open CPython bug blocks `perf_jit_trampoline.c` on riscv64 for Python 3.13-3.15 (see Section 9) |
| Dedicated `MAINTAINERS` tooling reviewer | Yes | Yes | No | See Section 3 |

No quantitative benchmark data comparing raw `perf` sampling overhead on riscv64 against arm64 or amd64 was found in any source consulted. Two academic measurements exist for overhead/accuracy on RISC-V specifically (not comparative against other arches): a CVA6-on-FPGA study (Linux 5.7, 100 MHz) measured **perf monitoring overhead at 0.283%** running CoreMark v1.0 (score 174.59), with IPC of 0.6195 and a branch-misprediction rate of 18.14% recorded via HPM counters ([arXiv:2112.11767](https://arxiv.org/abs/2112.11767)). A separate, more recent PMU-profiling/roofline study on production silicon found real-world profiling gaps rather than overhead numbers: on a SpacemiT X60, `sqlite3VdbeExec` showed IPC 0.86 versus 3.38 on an Intel Core i5-1135G7 for the same workload, and roofline analysis measured only 1.58 GFLOP/s achieved against a 25.6 GFLOP/s theoretical peak (versus 34-48 GFLOP/s achieved on the Intel comparator) ([arXiv:2507.22451](https://arxiv.org/html/2507.22451v1)). That paper also documents that RISC-V developers "frequently encounter unreliable hardware counters, incomplete kernel support, or outright hardware bugs that prevent standard profiling," and describes a workaround for the SpacemiT X60's missing `mcycle`/`minstret` overflow interrupts using non-standard `u_mode_cycle`/`m_mode_cycle`/`s_mode_cycle` counters. The architectural root cause -- the base RISC-V ISA historically lacked standardized performance-counter overflow interrupts -- is addressed incrementally via the Sscofpmf extension and the SBI PMU extension ([LWN: Improve RISC-V Perf support using SBI PMU and sscofpmf extension](https://lwn.net/Articles/879905/)), but hardware support remains inconsistent across vendors: the SiFive U74 has no out-of-order execution, no RVV, and no overflow interrupts but full upstream Linux support; the T-Head C910 has OoO and RVV 0.7.1 with partial upstream support; the SpacemiT X60 has RVV 1.0 but limited overflow-interrupt support and is not upstream.

## 7. CI/CD Infrastructure

Direct fetch of the `torvalds/linux.git` root tree and the `tools/perf` subtree (raw listings, not summarized) confirms **no CI configuration exists inside the repository at all**, for any architecture: no `.github/`, no `.gitlab-ci.yml`, no `Jenkinsfile`, no `ci/` directory. `tools/perf/tests/` is perf's own in-tree self-test harness (`perf test`, run manually or by distro packagers), not an automated CI pipeline definition.

riscv64 CI coverage for linux-perf exists **outside** this repository, in two places:

1. **linux-riscv maintainer staging tree** (`github.com/linux-riscv/linux`) runs GitHub Actions (`.github/workflows/patchwork.yml`, self-hosted runners via `ghcr.io/linux-riscv/pw-builder:latest`), generating `build-rv64-clang-allmodconfig` and `build-rv64-gcc-allmodconfig` jobs (plus two nommu/k210 defconfig jobs) for every patch submitted to the linux-riscv patchwork project, including perf patches. These are compile-only checks against `ARCH=riscv allmodconfig` -- they verify that `drivers/perf/` and `tools/perf/arch/riscv/` compile, nothing more.
2. **Intel's 0-Day / kernel-test-robot** (the `lkp-tests` project) independently cross-builds `tools/perf` for riscv64 using config `riscv-allnoconfig-bpf` and `riscv64-linux-gnu-gcc`, watching `linux-perf-users@vger.kernel.org` and other mailing lists plus patchwork, posting build reports back to-list. Concrete examples: a build failure in `tools/perf/tests/pmu-events.c` bisected to commit `e4c41d658075` ([2026-06 report](https://ratatoskr.run/oe-kbuild/2026/06/17078974)); a `riscv-allnoconfig-bpf` build of a perf-record patch ([2026-03](https://ratatoskr.run/oe-kbuild/2026/03/14472731)); and the November 2023 build-failure report on the unmerged "perf callchain: Support riscv" patch ([2023-11](https://ratatoskr.run/oe-kbuild-all/2023/11/2409541)).

No Buildbot, Jenkins, or GitLab CI pipeline dedicated to linux-perf + riscv64 was found; Jenkins itself has no native RISC-V support. `git.kernel.org`'s cgit interface carries no CI integration of any kind -- it is a bare source mirror.

Per the project's own RISE sw-ecosystem status report, this CI is explicitly characterized as "just build check, no function/perf test and profiling." **This is a build-only CI job: it compiles riscv64, it runs no test suite.** No RISE-funded RFP or RISE RISC-V Runner-based CI exists for linux-perf; it is tracked only informally by the (now-merged) Debug and Profiling Working Group.

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compile-checked on every patch | Yes (0-Day CI, native CI) | Yes | Yes (linux-riscv staging tree + 0-Day riscv-allnoconfig-bpf) |
| Functional/regression test execution | Yes (x86 selftests, KUnit) | Partial | No -- build-only |
| Hardware-in-the-loop perf accuracy testing | Ad hoc | Ad hoc | None identified |

**Practical consequence:** build regressions in `drivers/perf/riscv_pmu_sbi.c` and `tools/perf/arch/riscv/` are caught automatically. Runtime regressions -- wrong counter values, callchain corruption, KVM attribution errors -- are caught only by developers with physical hardware or downstream bug reports. The single change that would move linux-perf's grade above build-only CI is adding riscv64 functional/test execution to either the linux-riscv staging tree or the 0-Day CI, rather than compile checks alone.

## 8. Distribution and Release Status

**PyPI:** no package. `https://pypi.org/pypi/linux-perf/json` returns HTTP 404 (`{"message": "Not Found"}`), confirmed on repeated checks including a no-hyphen variant (`linuxperf`, also 404). This is expected: linux-perf is not a Python package, it is the kernel's `perf` tool. The RISE GitLab wheel-builder endpoint (`gitlab.com/api/v4/.../packages/pypi/simple/linux-perf/`) redirects (HTTP 302) to the same PyPI 404.

**Ubuntu 26.04 (resolute):** confirmed available for riscv64 via three independent live checks (search page, direct package page, and a HEAD request on the actual `.deb`, all HTTP 200). Critically, riscv64 ships only through the **ports** pocket at an older build, not the primary security-tracked build:
- `7.0.0-34.34` [security pocket]: amd64, arm64 only.
- `7.0.0-14.14` [**ports** pocket]: ppc64el, **riscv64**, s390x.

The riscv64 `.deb` itself was verified reachable: `http://ports.ubuntu.com/pool/main/l/linux/linux-perf_7.0.0-14.14_riscv64.deb` returns HTTP 200, content-length 5,914,818 bytes, matching the listed 5,776.2 kB -- a real binary artifact, not a placeholder. This is a secondary-tier, currently-stale build relative to the primary architectures: riscv64 lags the amd64/arm64 build by roughly 20 point releases (14.14 vs 34.34) within the same 7.0.0 series. On Ubuntu 24.04, the kernel-matched perf binary is instead shipped as `linux-tools-<kernel-version>` (indirect path).

**Debian sid:** per the project's own prior status research and the readiness-grade justification, Debian sid ships `linux-perf`/`perf` for riscv64 built from unmodified upstream source with no riscv64-specific packaging patches identified. This was not independently re-fetched in the current research round; it is consistent with, and not contradicted by, any live finding here.

**Arch Linux RISC-V:** **contradictory evidence.** The readiness-grade justification and an earlier dependency pass both state Arch Linux RISC-V ships `perf` for riscv64 (a specific version, `perf-7.0.10-1-riscv64.pkg.tar.zst`, 3.0 MB, dated 2026-05-29, appears in project tracking). However, a direct verification pass against `archriscv.felixc.at` -- checking the search endpoint, the full repo listing, and the site home page -- found **no package named `linux-perf`, and no hit at all for the substring "perf" anywhere on the site**. This is a genuine discrepancy between sources: either the earlier claim is stale/inaccurate, the package is hosted under a different name or a different repo mirror than the one checked, or the `archriscv.felixc.at` mirror is itself incomplete relative to the canonical Arch Linux RISC-V repository. [NEEDS VERIFICATION -- re-check against the authoritative Arch Linux RISC-V package index directly, not the felixc.at mirror, before treating Arch as a confirmed riscv64 distribution channel.]

**What a user must do to get a working binary today:** on Ubuntu 26.04, enable the ports pocket and install the riscv64 `.deb` directly (accepting a ~20-release-behind version relative to amd64/arm64); on Debian sid, install the standard `linux-perf` package (riscv64 believed current, not independently re-verified this round); Arch Linux RISC-V availability is unconfirmed pending resolution of the discrepancy above. There is no first-class, always-current riscv64 binary channel; the kernel itself publishes no binaries (packaging is distro-owned).

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 build status | riscv64 release status | Notes / blocking issues |
|---|---|---|---|---|---|
| elfutils | ELF/DWARF parsing (libelf/libdw); symbol resolution, uprobes/kprobes, JVMTI, DWARF unwinding | Critical | Builds | Debian sid, Ubuntu, Arch Linux RISC-V package it for riscv64; Arch lags at 0.192 vs 0.195 upstream | Disabling it cascades to disable libdw, libbpf-dependent features, and JVMTI. DWARF unwinding via libdw is the dominant unwinder on riscv64 in practice |
| libtraceevent | Trace event parsing | Critical | Builds | Packaged in Debian sid for riscv64 | Hard build failure (`"ERROR: libtraceevent is missing."`) unless `NO_LIBTRACEEVENT=1` is set explicitly when absent -- a silent cross-compile trap |
| GCC | Primary build toolchain | Critical (build) | Riscv64 cross-compiler (`riscv64-linux-gnu-gcc`) widely available and is the toolchain used by both 0-Day CI and distro packagers | N/A (toolchain, not a runtime artifact) | GCC 13.3.0/13.4.0 had a confirmed false-positive `-Werror=alloc-size-larger-than=` regression building perf's `cpumap.c` on riscv64 (fixed by Ian Rogers, March 2026); GCC 11.5.0, 12.5.0, 14.3.0, 15.2.0 unaffected. Minimum version 8.1 kernel-wide |
| GNU binutils | Assembler/linker | Critical (build) | Riscv64 cross-binutils widely available | N/A | Minimum 2.30 (2.42 for non-distro builds per `Makefile.config`); riscv64 relies on reasonably current binutils for RVV/newer-ISA-extension assembler support |
| LLVM | Optional Clang build path, BPF skeleton compilation | Optional (build) | Builds; riscv64 is a Tier-1 LLVM backend | Available on all major riscv64 distros | Clang 12.0.1+ required specifically for BPF skeletons; `CLANG_TARGET_FLAGS_riscv := riscv64-linux-gnu` auto-configures the target triple |
| libunwind | Frame-pointer/LBR-style stack unwinding (`--call-graph=fp`) | Optional (runtime) | Builds via generic fallback path only | Debian sid 1.8.1; Arch riscv64 1.8.1 (subject to the Section 8 Arch discrepancy) | **Not wired into `Makefile.config`'s per-architecture map** (riscv64 absent from the explicit `LIBUNWIND_ARCHS` handling seen at build time; a 7-patch wiring series from Ian Rogers, Google, v5 as of 2026-05-13, remains unmerged, "New" status, no recorded reviewer activity as of the last check) |
| libbpf | BPF program loading, `perf stat --bpf-counters`, BPF skeletons | Optional (runtime) | Builds | Debian sid 1.7.0, official port | BPF skeletons require a riscv64 clang BPF backend, available since LLVM 12; not currently blocking |
| OpenSSL | Required for `BUILD_BPF_SKEL`, KVM key validation | Optional (runtime) | Builds | Debian sid, Ubuntu, Arch riscv64 all package OpenSSL 3.x | Some riscv64 distro builds lag upstream OpenSSL by a version or two; not a hard blocker |
| zlib | Compressed debug-section support | Optional (runtime) | Builds | Debian sid 1.3.x for riscv64 | Architecture-neutral; no riscv64-specific issues |
| zstd | zstd trace-data compression | Optional (runtime) | Builds | Available in Debian sid, Arch riscv64 (subject to Section 8 caveat) | None identified |
| Python | `perf script` bindings, `jevents` PMU event-table generation | Optional (runtime) | Partial -- fails for Python 3.13-3.15 | Available on all major riscv64 distros at the interpreter level | Open bug, CPython issue #120400/#121201: `Python/perf_jit_trampoline.c` fails to build on riscv64 for CPython 3.13-3.15 (`HAVE_PERF_TRAMPOLINE` reports 0). A fix attempt (PR #120089) was followed by a reversion (PR #121328) that disabled `perf_trampoline` on riscv64 again after implementation problems surfaced; the issue is closed with the feature effectively deferred, not fixed. This breaks `perf script` JIT/Python-call visibility on riscv64 specifically |
| libpfm4 | Hardware PMU event-name resolution for `perf list` | Optional (runtime) | Builds | Debian sid 4.13.0+git106 for riscv64 | No RISC-V hardware PMU event tables exist in libpfm4 upstream at all; `perf list` falls back to raw event codes on every RISC-V platform |
| libnuma | NUMA topology in `perf stat`/`perf bench numa` | Optional (runtime) | Builds | Debian sid 2.0.19-1 for riscv64 | Mainstream RISC-V SoCs are currently single-node; low practical impact |
| babeltrace | CTF trace conversion (`perf data --to-ctf`) | Optional (runtime) | Builds (Debian sid ships 1.5.11-6, an older libbabeltrace2) | Packaged for riscv64 in Debian sid | Optional code path; no riscv64-specific issues found |
| GTK2 | `perf annotate --gtk` GUI | Optional (runtime) | Status unassessed for riscv64 | Minimal riscv64 availability; GTK2 is EOL upstream | Deprecated toolkit generally; not a production blocker |
| glibc | C runtime, `perf_event_open` ABI | Critical | Available on all major riscv64 distros | Available | Known riscv64 glibc test-suite failures exist upstream (tracked separately, outside this report's scope); no perf-specific glibc blocker identified |
| flex | Build-time parser generator | Build (indirect, not in the direct-dependency list above) | Architecture-neutral tool | Universal | Not a riscv64 concern |
| bison | Build-time parser generator | Build (indirect) | Architecture-neutral tool | Universal | Not a riscv64 concern |
| libslang2 | TUI for `perf top`/`perf report` | Optional (indirect) | Builds | Debian sid 2.3.3-6 for riscv64 | None identified |
| libcapstone | Disassembly engine for `perf annotate` | Optional (indirect) | Status not directly confirmed for riscv64 | Not directly confirmed in prior research | No riscv64-specific issues noted |
| liblzma (xz) | xz decompression | Optional (indirect) | Builds | Tracked upstream, architecture-neutral | None expected |

## 11. Known Bugs and Active Issues

| Item | Status | Severity | Notes |
|---|---|---|---|
| CVE-2024-26902: perf panic on PMU overflow handler | Fixed, merged v6.8, backported to stable (e.g. 6.7.11) | Was Medium (CVSS 5.5, local DoS) | Introduced by commits `4905ec2`/`cc4c07c`: a plain bitwise-OR instead of `BIT()` on the `overflowed_ctrs` bitmap in the SBI PMU overflow handler caused a NULL-pointer-dereference kernel panic reproducible via `perf record -e branches` on Sophgo SG2042 hardware. Fix confirmed present and correct (`BIT_ULL(lidx)`) in current mainline. [Ubuntu CVE tracker](https://ubuntu.com/security/CVE-2024-26902) |
| PMU throttle IRQ-storm bug (ByteDance) | Open, build error, unresolved reviewer objection | High | Zhanpeng Zhang's fix (submitted 2026-04-15) for the SBI PMU overflow handler unconditionally restarting all counters (bypassing perf-core throttle, risking IRQ storm/soft lockup under a small sampling period e.g. `perf top -c 20`) has an undeclared-identifier build error (`MAX_INTERRUPTS`) and an unaddressed question from a reviewer about using `PERF_HES_STOPPED` instead |
| Fixed-counter-stop bug (Alibaba) | Open, design rejected by maintainer | Medium | Chen Pei's fix (submitted 2026-01-31) for CYCLE/INSTRET counters unexpectedly stopping was explicitly rejected by maintainer Atish Patra (2026-03-28) over side-channel concerns; needs a full design rework |
| GCC-13 riscv64 build regression | Fixed | Was build-blocking | A commit preserving external `EXTRA_CFLAGS` leaked `-O6` into libperf, triggering a false-positive GCC-13-only `-Werror=alloc-size-larger-than=` warning in `cpumap.c`. Fixed by Ian Rogers (Google); confirmed working on riscv64/ppc64 with GCC 13.4.0; backport to linux-6.6.y requested |
| GCC-14 cross-arch `-Werror=discarded-qualifiers` | Fixed, applied as `7378b6656aa4` (2026-06-26) | Was build-blocking | `strrchr()` return assigned to non-const `char *` in `tools/perf/arch/riscv/util/header.c` broke under GCC 14's stricter glibc prototype. Maintainer rejected the initial, broader fix approach (would have incorrectly decoupled arch-specific auxtrace decoders needed for cross-arch perf.data analysis); accepted v2 narrowed to a `const char *` correction |
| `perf-regs` abort bug | In review (v3, 2026-02-03) | Medium | `perf record -I`/`--user-regs` with no explicit register list aborts instead of defaulting to all GP registers; traced to commit `3d06db9bad1a`. Fix centralizes register-mask handling into `util/perf-regs-arch/` for cross-arch perf.data portability |
| "perf callchain: Support riscv" build failure | Unmerged since Nov 2023 | Medium | 0-Day CI found multiple compile errors (undefined labels, unused variables, missing header); no accepted follow-up version found |
| SoC PMU unique identification (Nikita Shubin) | Stalled at v5, no commit found, open since 2022-06-28 | Low | No vendor-specific PMU SoC-ID mechanism upstream |
| CPython perf trampoline on riscv64 | Closed as deferred/reverted, not fixed | Medium | python/cpython issue #120400: `HAVE_PERF_TRAMPOLINE` is 0 on riscv64; a fix (PR #120089) was reverted (PR #121328) after implementation problems. `perf script` cannot see Python calls on riscv64 |
| `libtraceevent` silent cross-compile failure mode | Ongoing build-process risk, not a bug per se | Low-Medium | Absent `NO_LIBTRACEEVENT=1`, cross builds fail without a clear diagnostic when the library is missing from the sysroot |

Stale, long-open (since 2022) items with no recorded reviewer activity, per prior project tracking [NEEDS VERIFICATION -- not re-fetched this round]: T-Head C9xx PMU variant support (Heiko Stubner), a missing `perf_user_access` sysctl knob (Heiko Stubner), and a missing PMU power-management notifier (Eric Lin, SiFive).

## 12. Objections and Upstream Blockers

**Counter delegation series (v6, Atish Patra, 21 patches):** in review since RFC (2024-02) -- over two years in the review cycle as of this writing. CI shows compile errors on both `rv64-clang-allmodconfig` and `rv64-gcc-allmodconfig`. The scope (21 patches spanning three new ISA extensions, kernel driver changes, and perf JSON event-encoding format changes) is itself a contributor to review friction.

**PMU throttle patch:** blocked on an undeclared-identifier build error (`MAX_INTERRUPTS`) plus an unresolved reviewer question about whether `PERF_HES_STOPPED` should be used instead. No author response recorded as of the last check.

**Fixed-counter patch:** design explicitly rejected by the PMU maintainer over side-channel exposure concerns (enabling counting outside explicit legacy mode was judged to open a measurable side channel). Requires a full redesign, not an incremental fix.

**RISC-V trace decoder (Qualcomm, Anup Patel / Mayuresh Chitale, v4, 12 patches):** build failures on allmodconfig; received a `Reviewed-by` from Adrian Hunter (Intel) on one revision, but Greg Kroah-Hartman stated the user ABI for RISC-V trace auxtrace data must be agreed upon by the community before upstreaming proceeds as submissions rather than a pull request. This is an organizational blocker (ABI consensus), not purely a technical one.

**libunwind riscv64 wiring (Ian Rogers, Google, v5):** no build failures reported, but no recorded reviewer activity since the 2026-05-13 posting -- a direct consequence of the Section 3 structural gap (no dedicated RISC-V tooling reviewer in `MAINTAINERS` for `tools/perf/arch/riscv/`), leaving review dependent on top-level maintainer bandwidth for a component most top-level maintainers are not RISC-V specialists in.

**"perf build: Fix cross-arch build failures" (Li Guan):** a useful data point on review discipline -- the maintainer (Ian Rogers) explicitly rejected two of three patches in the original series (decoupling arch-specific auxtrace decoders, and weak-symbol stubs he called "the devil's work" over C-spec violations and LTO risk), accepting only a narrowly scoped `const`-qualifier fix. This indicates active, substantive maintainer engagement on riscv64 build-correctness patches specifically, even where the broader design proposal is rejected.

No organizational blocker was found against RISC-V PMU/perf support in general; rejections found were narrowly scoped to specific patch designs (side-channel concerns, incorrect refactors), not to RISC-V support as a category. The trace-decoder ABI-consensus requirement is the one clear case of a structural/process blocker rather than a code-quality objection.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** distro

linux-perf (`tools/perf` plus the RISC-V PMU driver in `drivers/perf/` and `arch/riscv/kernel/perf_*.c`) has no CI in the `torvalds/linux` tree itself, confirmed by direct inspection of the repository's root and `tools/perf` file listings (Section 7) -- there is no GitHub-hosted issue tracker or PR flow for this project at all, since it is developed entirely on the lkml/linux-riscv/linux-perf-users mailing lists. The closest thing to upstream CI is the linux-riscv maintainer staging tree's GitHub Actions (`build-rv64-clang-allmodconfig`, `build-rv64-gcc-allmodconfig`) plus Intel's 0-Day/kernel-test-robot, which explicitly cross-builds `tools/perf` for riscv64 (config `riscv-allnoconfig-bpf`, e.g. [a June 2026 build-failure report](https://ratatoskr.run/oe-kbuild/2026/06/17078974)) -- but per the project's own status report and the RISE Debug and Profiling Working Group's tracking, this is "just build check, no function/perf test and profiling." That is a textbook build-only CI job (compiles riscv64, runs no test suite), which caps the color at yellow regardless of the otherwise-solid functional coverage confirmed in Section 4 (SBI PMU driver, DWARF/frame-pointer callchains, and the merged userspace access model). The distribution floor independently supports yellow: Ubuntu ships `linux-perf` for riscv64 via the ports pocket at an older build (Section 8), and the project's own prior status research indicates Debian sid does as well, with no riscv64-specific packaging patches identified (the Arch Linux RISC-V claim carries an open discrepancy per Section 8 and should not be relied on without re-verification).

linux-perf is a profiling/observability tool, not an optimization-purpose project -- it would still deliver its core value (exposing PMU counters and producing profiles) on RISC-V even without any RVV/SIMD-style tuning -- so no optimization-level rating applies here. The `perf annotate`/disassembly and callchain code under `tools/perf/util/annotate-arch/` is architecture support, not a performance-optimization hot path.

**Pending work that could change the grade:** four open patch series are live at the time of this research: (1) the RISC-V trace decoder (Qualcomm, v4, in review, would add AUX instruction-tracing support, currently blocked on user-ABI consensus rather than code); (2) libunwind riscv64 wiring (Ian Rogers/Google, v5, in review, no recorded reviewer activity); (3) counter delegation / Ssccfg-Smcdeleg (Atish Patra, v6, in review, with reported build failures on rv64-clang/gcc-allmodconfig); and (4) the PMU throttle IRQ-storm fix (ByteDance, build error, unresolved reviewer objection) and the fixed-counter-stop bug (Alibaba, design rejected by maintainer) -- both still open. If either of the last two turns out to affect mainline behavior rather than only the pending (unmerged) patch, that is a candidate for a future downgrade to red. No RISE-funded RFP or RISE-runner CI exists for linux-perf; it is tracked only informally by the RISE Debug and Profiling Working Group, now merged into the Kernel and Virtualization Working Group. The single change that would raise this project to blue is adding riscv64 functional/test execution to the linux-riscv staging tree or the 0-Day CI, in place of build-only checks.

## 14. Investment Analysis

Before sizing any item below: RISE has funded no dedicated RFP for linux-perf. The only RISE artifact referencing the project is a passive status-tracking page maintained by the (now-merged) Debug and Profiling Working Group -- there is no RISE-runner CI, no RISE-funded engineering, and no RISE blog coverage of the perf tool itself (RISE's public benchmarking work touches LLVM, OpenJDK, V8, IREE, and Go, not `perf`). None of the work below is already covered by existing RISE funding.

### 14.1 Functional Enablement

Core sampling and profiling on riscv64 is solid: hardware PMU counters via SBI, DWARF callchain unwinding, and the merged userspace direct-access model. The confirmed gaps are: `perf kvm stat` and `perf trace` support, both still under active revision or discussion rather than confirmed merged (Section 4, a correction against the prior assumption that these had already landed); two open correctness bugs (PMU throttle IRQ storm, fixed-counter stop) with a clear severity ranking -- the throttle bug is the higher-priority fix given its soft-lockup potential under ordinary `perf top`/`perf record` usage with a tight sampling period; the unwired libunwind path; and the unmerged counter-delegation and trace-decoder feature series.

### 14.2 Performance Optimization

Not applicable in the "optimization-purpose project" sense (Section 13), but architecturally relevant: the SBI PMU driver's firmware-ecall path for counter configuration and overflow handling adds kernel-to-firmware round-trip latency that amd64/arm64 avoid via direct CSR access. The counter-delegation extension (Ssccfg/Smcdeleg), once merged, removes this overhead for supervisor-mode counter access. No published data quantifies this overhead delta; the one directly relevant academic measurement (0.283% perf monitoring overhead on a CVA6 FPGA core) predates SBI PMU and is not architecture-comparative.

### 14.3 CI/CD Infrastructure

This is the single highest-leverage gap identified in this report. Build-only CI (Section 7) means counter-accuracy regressions, callchain-correctness regressions, and KVM-attribution regressions are invisible until a developer with physical RISC-V hardware notices, or a downstream user reports it. Both open correctness bugs in Section 11 (throttle IRQ storm, fixed-counter stop) are exactly the class of defect functional CI would catch before merge.

### 14.4 Ecosystem Enablement

libpfm4's complete absence of RISC-V hardware PMU event tables blocks named-event access via that path for every RISC-V SoC; `perf list` falls back to raw event codes universally. Contributing a vendor event JSON file for a specific SoC (the merged SiFive U74/P550/P650 and CVA6 files are precedent) is comparatively low effort and unlocks named-event usability for that hardware immediately; contributing libpfm4 tables is a separate, larger effort that benefits tooling beyond perf itself.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix PMU throttle IRQ-storm bug (resolve build error, address reviewer objection) | 1-2 | RISC-V PMU contributor | Critical |
| Functional | Rework fixed-counter-stop fix per maintainer's side-channel objection | 2-3 | RISC-V PMU contributor | High |
| Functional | Confirm and, if needed, complete `perf kvm stat` / `perf trace` upstreaming (verify actual merge status, finish review) | 2-4 | Kernel contributor | High |
| Functional | Wire libunwind riscv64 into `Makefile.config`'s per-arch map (complement Ian Rogers' v5) | 1 | perf-tooling contributor | High |
| Functional | Drive counter delegation v6 to merge (fix allmodconfig build failures, address review) | 4-8 | Rivos Inc. / any RISC-V contributor | High |
| Functional | Add vendor PMU event JSON for target SoC | 1-2 | SoC vendor | High |
| Functional | Resolve CPython perf-trampoline build/regression on riscv64 (#120400/#121201) | 2-4 | CPython / downstream contributor | Medium |
| Functional | Add libpfm4 RISC-V hardware PMU event tables | 3-6 | SoC vendor | Medium |
| Functional | Extend `perf annotate` riscv64 target resolution to match arm64's PC-relative symbol resolution | 2-3 | perf-tooling contributor | Medium |
| Functional | Drive RISC-V trace decoder to merge (resolve user-ABI consensus first, then fix build failures) | 8-16 | Qualcomm / RISC-V trace contributors | Low (long horizon, ABI-gated) |
| CI/CD | Add riscv64 functional perf test execution (QEMU system-mode or hardware runner) to the linux-riscv staging tree or 0-Day CI | 4-8 | Infrastructure contributor | High -- directly moves the readiness grade |
| CI/CD | Extend riscv64 perf coverage into KernelCI | 8-16 | KernelCI / infrastructure contributor | Medium |
| Ecosystem | Add a named RISC-V reviewer entry to `MAINTAINERS` for `tools/perf/arch/riscv/` | 0 (nomination) | Existing active contributor | Medium |
| Ecosystem | Clarify Arch Linux RISC-V `linux-perf`/`perf` packaging status (resolve Section 8 discrepancy) | <1 | Packaging contributor | Low |

## 15. References

- [git.kernel.org: torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)
- [perf.wiki.kernel.org](https://perf.wiki.kernel.org/)
- [PATCH 0/2: perf: riscv: Preliminary Perf Event Support on RISC-V](https://lkml.iu.edu/hypermail/linux/kernel/1804.0/00404.html)
- [Commit 178e9fc47aae: perf: riscv: preliminary RISC-V support](https://github.com/torvalds/linux/commit/178e9fc47aaec1b8952b553444e94802d7570599)
- [PATCH: perf annotate: Add riscv64 support (William Cohen)](https://lore.kernel.org/linux-riscv/20210927005115.610264-1-wcohen@redhat.com/)
- [Commit 0ba37e05c240: perf annotate riscv64 support merged](https://github.com/torvalds/linux/commit/0ba37e05c240c7b38e5a327a96f404798a8698ff)
- [PATCH v5 0/4: RISC-V: Create unique identification for SoC PMU](https://lore.kernel.org/linux-arm-kernel/20220628114625.166665-1-nikita.shubin@maquefel.me/)
- [PATCH v4: riscv: Allow userspace to directly access perf counters (Ghiti)](https://patchew.org/linux/20230703124647.215952-1-alexghiti@rivosinc.com/)
- [Commit 7aa7d502e4d5: userspace perf counter access merged series](https://github.com/torvalds/linux/commit/7aa7d502e4d5a42353325cb4bf2aa880b10168e9)
- [Re: PATCH perf callchain: Support riscv (build-bot thread)](https://ratatoskr.run/oe-kbuild-all/2023/11/2409541)
- [Ubuntu CVE tracker: CVE-2024-26902](https://ubuntu.com/security/CVE-2024-26902)
- [lore.kernel.org CVE-2024-26902 announcement](https://lore.kernel.org/linux-cve-announce/2024041745-CVE-2024-26902-5f77@gregkh/)
- [Commit 34b567868777: perf RISCV panic fix](https://github.com/torvalds/linux/commit/34b567868777e9fd39ec5333969728a7f0cf179c)
- [PATCH v5: riscv perf KVM guest statistics (Quan Zhou)](https://lkml.iu.edu/hypermail/linux/kernel/2410.1/10926.html)
- [PATCH v3 cover: riscv perf KVM guest statistics](https://patchew.org/linux/cover.1726126795.git.zhouquan@iscas.ac.cn/)
- [Commit 5bb5ccb3e8d8: riscv perf guest vs host distinction](https://github.com/torvalds/linux/commit/5bb5ccb3e8d8dba29941cd78d5c1bcd27b227b4a)
- [Commit eded6754f398: riscv KVM host vs guest profiling](https://github.com/torvalds/linux/commit/eded6754f398b5b4950e8f593f75fee63a8b49ad)
- [REGRESSION: perf build failed after 5cf6e76e4f4f on riscv64 with GCC 13](https://lore.kernel.org/lkml/20260319081843.1650640-1-irogers@google.com/)
- [PATCH 0/3: perf build cross-arch GCC14 fix (Li Guan)](https://ratatoskr.run/linux-riscv/2026/05/9004202/t)
- [PATCHES v2 perf-tools-next 0/4: Cleanups and a fix](https://ratatoskr.run/linux-perf-users/2026/04/3494464/t)
- [avpatel riscv_trace_support_v5 build-bot thread](https://ratatoskr.run/oe-kbuild-all/2026/08/17400390)
- [Re: PATCH perf riscv: Wire up perf trace support](https://lkml.iu.edu/hypermail/linux/kernel/2412.1/06014.html)
- [0-Day CI riscv64 tools/perf build report (pmu-events.c failure)](https://ratatoskr.run/oe-kbuild/2026/06/17078974)
- [0-Day CI riscv-allnoconfig-bpf build report (perf-record patch)](https://ratatoskr.run/oe-kbuild/2026/03/14472731)
- [intel/lkp-tests wiki (0-Day CI test-runner codebase)](https://github.com/intel/lkp-tests/wiki)
- [Ubuntu packages: linux-perf search, resolute suite](https://packages.ubuntu.com/search?keywords=linux-perf&suite=resolute&searchon=names&section=all)
- [Ubuntu packages: linux-perf riscv64 direct page, resolute](https://packages.ubuntu.com/resolute/riscv64/linux-perf)
- [Arch Linux RISC-V package mirror](https://archriscv.felixc.at/)
- [PyPI: linux-perf project page](https://pypi.org/pypi/linux-perf/json)
- [Perf tools: perf-regs bug fix and optimization, v3](https://ratatoskr.run/linux-riscv/2026/02/3398512/t)
- [REGRESSION: perf build failure GCC13 riscv64 (thread)](https://ratatoskr.run/linux-riscv/2026/03/3467688/t)
- [PATCH: perf build cross-arch GCC14 fix (thread)](https://ratatoskr.run/linux-riscv/2026/05/9004202/t)
- [drivers/perf: riscv throttled events patch, kernel test robot report](https://ratatoskr.run/llvm/2026/04/3538963)
- [LWN: Improve RISC-V Perf support using SBI PMU and sscofpmf extension](https://lwn.net/Articles/879905/)
- [SiFive Forums: Linux perf tool support - RISC-V](https://forums.sifive.com/t/linux-perf-tool-support/3926)
- [Dissecting RISC-V Performance: Practical PMU Profiling and Hardware-Agnostic Roofline Analysis (arXiv 2507.22451)](https://arxiv.org/html/2507.22451v1)
- [Supporting RISC-V Performance Counters through Perf (arXiv 2112.11767)](https://arxiv.org/abs/2112.11767)
- [Supporting RISC-V Performance Counters Through Linux Performance Analysis Tools (INESC-ID / ASAP23 PDF)](https://hpcas.inesc-id.pt/~unify/papers/conf_asap23.pdf)
- [Phoronix: RISC-V CPU Performance Up 8x In Five Years](https://www.phoronix.com/review/risc-v-5-year-performance)
- [Phoronix: Initial Benchmarks Of The SpacemiT K3 RVA23 RISC-V CPU](https://www.phoronix.com/review/spacemit-k3-pico-itx/2)
- [Phoronix: RISC-V RVV Vector Performance Benchmarks With The SpacemiT K3 SoC](https://www.phoronix.com/review/risc-v-rvv-vector-benchmarks)
- [Phoronix RISC-V archive](https://www.phoronix.com/linux/RISC-V)
- [python/cpython issue #120400: perf profile can not see Python calls on RISC-V](https://github.com/python/cpython/issues/120400)
- [python/cpython issue #157688: test_linux_ext_suffix riscv64](https://github.com/python/cpython/issues/157688)
- [golang/go issue #53745: x/perf storage test slow on linux-riscv64 builder](https://github.com/golang/go/issues/53745)
- [RISE sw-ecosystem project report: linux-perf](https://riseproject-dev.github.io/sw-ecosystem/project-reports/linux-perf.html)
- [RISE sw-ecosystem tracker](https://riseproject-dev.github.io/sw-ecosystem/)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project: Project RP009: LLVM SPEC Optimization](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [RISE Project: OpenJDK: Supercharging Vectorized Math with SLEEF](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/)
- [RISE Project: Optimizing IREE Compilation for RISC-V](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)
- [RISE Project: A Glimpse Into V8 Development for RISC-V](https://riseproject.dev/2025/12/09/a-glimpse-into-v8-development-for-risc-v/)
- [RISE Project: RISE RISC-V Runners: six weeks in](https://riseproject.dev/2026/05/12/rise-risc-v-runners-six-weeks-in/)
- [RISE Project: RISE Working Groups move their project tracking to GitHub](https://riseproject.dev/2026/07/30/rise-working-groups-move-their-project-tracking-to-github/)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE python-wheels builder index](https://riseproject.gitlab.io/python/wheel_builder/)
- [riseproject-dev GitHub organization](https://github.com/riseproject-dev)