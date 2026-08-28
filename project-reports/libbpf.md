---
title: libbpf
parent: Project Reports
categories:
  - libraries
  - perfmon
---

# libbpf

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com>
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for libbpf
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items verified against only one source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

libbpf is the canonical userspace library for loading, verifying, and managing BPF programs on Linux. It handles ELF parsing of compiled BPF objects, BTF (BPF Type Format) processing, CO-RE (Compile Once - Run Everywhere) relocation, map creation, program attachment (kprobes, uprobes, tracepoints, USDT, cgroup hooks), and the ring buffer and perf buffer APIs. It does not contain a JIT compiler -- that lives in the Linux kernel at `arch/riscv/net/bpf_jit_comp64.c`.

**Governance:** libbpf is a Linux kernel sub-project. The authoritative source is the `bpf-next` kernel tree under `tools/lib/bpf/`. The GitHub repository at [libbpf/libbpf](https://github.com/libbpf/libbpf) is an automated mirror maintained for standalone builds. Changes must be submitted to `bpf@vger.kernel.org`; GitHub PRs are accepted only for mirror-specific fixes. There is no standalone governance document.

The [eBPF Foundation](https://ebpf.io/foundation/) (a Linux Foundation sub-foundation) provides the institutional home. Platinum members: CrowdStrike, Google, Isovalent, Meta, Netflix. Silver members: Datadog, Intel, Toyota Motor Corporation.

**Core maintainers:**

- Andrii Nakryiko (Meta, `anakryiko`) -- de facto libbpf maintainer; committer on virtually every merge visible in the repo
- Alexei Starovoitov (Meta) -- BPF kernel co-creator, BSC member
- Daniel Borkmann (Isovalent) -- BPF/XDP co-maintainer, BSC member
- Yonghong Song (Meta) -- LLVM BPF backend, active sync contributor
- Eduard Zingerman (`eddyz87`) -- active sync contributor
- KP Singh (Google), Joe Stringer (Isovalent), Alan Jowett (Microsoft) -- BSC members

**License:** Dual-licensed BSD-2-Clause OR LGPL-2.1.

**Community posture on new ports:** The BPF community has accepted RISC-V contributions from Intel, IBM, Huawei, Rivos, and Gentoo without stated objections. The pattern is: patch to `bpf@vger.kernel.org`, reviewed and merged by Andrii Nakryiko, then mirrored to GitHub via automated sync PRs. There is no record of RISC-V work being blocked on architectural grounds.

**RISE Project involvement:** libbpf is not listed as a RISE member project or affiliated project. A full crawl of all 26 RISE blog posts (May 2024 through June 2026) produced zero mentions of libbpf, BPF, or eBPF. The RISE wheel builder index (focused on Python packages) has no libbpf entry, which is expected for a C library.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream in the Linux kernel tree and mirrored to the libbpf GitHub repo. No out-of-tree patches exist.

| Date | Event | Commit / PR | Author | Affiliation |
|------|-------|-------------|--------|-------------|
| 2021-11-01 | Initial RV64 PT_REGS macros added to `bpf_tracing.h` | [7beaa2e](https://github.com/libbpf/libbpf/commit/7beaa2ef90ede98dae9e6d1e0c48ef4f6c215f0b) | Bjorn Topel | Intel |
| 2022-02-09 | Fix register names: `fp -> s0`, `epc -> pc` | [497ec1d](https://github.com/libbpf/libbpf/commit/497ec1d35ca3bb824f9345e32b665157077b1746) | Ilya Leoshkevich | IBM |
| 2022-02-09 | Fix syscall argument access (pre-wrapper era) | [32c19d8](https://github.com/libbpf/libbpf/commit/32c19d8505ff32fe84d16277232bb7f0b645d63a) | Ilya Leoshkevich | IBM |
| 2022-04-27 | USDT argument parsing for riscv (RV32 + RV64 tested on hardware) | [eb2b216](https://github.com/libbpf/libbpf/commit/eb2b216081c3acca7f7657203b38414ff8a2de9f) | Pu Lehui | Huawei |
| 2022-07-31 | Fix return-value register: `a5 -> a0` per RISC-V calling convention | [8498996](https://github.com/libbpf/libbpf/commit/8498996f9fb347dea51dbe678867884358a978f2) | Yixun Lan | Gentoo |
| 2023-01-25 | Complete arch spec: add PARM6-PARM8 (a5-a7) | [9db84de](https://github.com/libbpf/libbpf/commit/9db84de5f0b7b0160c8d5ea698f7fe2353d066a3) | Andrii Nakryiko | Meta |
| 2023-01-25 | Define riscv syscall regs spec (a0-a5) | [ed66fb2](https://github.com/libbpf/libbpf/commit/ed66fb297d7895e879b30bc4d808e25843a64902) | Andrii Nakryiko | Meta |
| 2023-05-25 | Fix comment accuracy for riscv in bpf_tracing.h | [6a6cf6d](https://github.com/libbpf/libbpf/commit/6a6cf6dcdc711450a25dbf68b930f482f5274473) | Kenjiro Nakayama | -- |
| 2023-10-19 | Fix syscall wrapper: riscv now selects ARCH_HAS_SYSCALL_WRAPPER | [20c1170](https://github.com/libbpf/libbpf/commit/20c1170ea4044852e79297c66d6e1a7734d28984) | Alexandre Ghiti | Rivos Inc. |
| 2026-01-29 | Automated kernel sync including riscv changes | [PR #940](https://github.com/libbpf/libbpf/pull/940) | anakryiko (bot) | Meta |
| 2026-02-11 | Automated kernel sync including riscv changes | [PR #946](https://github.com/libbpf/libbpf/pull/946) | anakryiko (bot) | Meta |

All RISC-V work is in two files: `src/bpf_tracing.h` (PT_REGS macros, register definitions, syscall argument handling) and `src/usdt.c` (USDT argument parsing and register offset table). The work is 100% upstream. No vendor branches, no downstream-only patches.

---

## 3. Upstream Support Tier

libbpf has no formal tier policy document. Architecture support is de facto, determined by presence of arch-specific code and CI coverage.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| `bpf_tracing.h` PT_REGS macros | Complete | Complete | Complete |
| `usdt.c` USDT argument parsing | Complete | Complete | Complete |
| Upstream CI (build) | Yes | Yes | No |
| Upstream CI (functional tests) | Yes (vmtest, x86_64 only) | No | No |
| Official binary release | Source archive only | Source archive only | Source archive only |
| Distro binary packages | Yes | Yes | Yes (Debian, Ubuntu) |
| Hardware test record | Yes (CI) | Occasional | Mentioned in commit messages (Pu Lehui, Huawei) |

**Assessment:** riscv64 has complete source-level support, equivalent to arm64 in code coverage, but no upstream CI of any kind. The upstream release process does not validate riscv64 builds. This is a gap shared with arm64 for functional testing, but unlike arm64, riscv64 is also absent from the cross-build matrix in `build.yml`.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libbpf itself has no JIT compiler, no SIMD dispatch, no cryptographic code, and no hand-written assembly. All arch-specific code is in two C files and consists of preprocessor macros and lookup tables for register-to-ABI mappings.

### 4.1 bpf_tracing.h -- PT_REGS Macros

**Location:** `src/bpf_tracing.h`, lines 348-384 (37 lines, 22 `#define` macros)

**Purpose:** Provides portable macros for BPF kprobe and uprobe programs to read function arguments and registers. Each architecture must define its own register-to-macro mapping.

**RISC-V implementation:**

- Arch detection: `#elif defined(__riscv) && __riscv_xlen == 64` (native compilation) or `#elif defined(__TARGET_ARCH_riscv)` (BPF skeleton cross-compile). riscv32 is explicitly excluded by the `__riscv_xlen == 64` guard.
- `struct pt_regs___riscv { unsigned long orig_a0; }` -- CO-RE shadow struct for syscall entry. Required because the first syscall argument is stored in `orig_a0` at kernel entry, not in `a0`. Same pattern as arm64's `orig_x0`.
- `__PT_REGS_CAST(x)` overrides to `struct user_regs_struct *`. RISC-V exposes `user_regs_struct` to userspace (not `pt_regs`), same as arm64.
- Parameter registers: `__PT_PARM1_REG` through `__PT_PARM8_REG` mapped to `a0`-`a7`. RISC-V passes 8 integer arguments in registers, more than x86_64 (6).
- Syscall parameter override: `__PT_PARM1_SYSCALL_REG` = `orig_a0`. Syscall parameters `a0`-`a5` for positions 1-6.
- Special registers: `__PT_RET_REG` = `ra`, `__PT_FP_REG` = `s0`, `__PT_RC_REG` = `a0`, `__PT_SP_REG` = `sp`, `__PT_IP_REG` = `pc`.
- ISA extensions used: none. Base RV64I integer registers only.
- Zero `__unsupported__` entries. Zero TODO or FIXME markers.

### 4.2 usdt.c -- USDT Argument Parsing

**Location:** `src/usdt.c`, lines 1522-1607 (86 lines)

**Purpose:** Parses USDT (Userspace Statically Defined Tracing) probe argument specifications from ELF `.note.stapsdt` sections and maps register names to `user_regs_struct` offsets for uprobe attachment.

**RISC-V implementation:**

- Header poison workaround: `s8` is poisoned by kernel headers (naming conflict). The file defines `#define rv_s8 s8` inside a `#if defined(__riscv)` guard to work around this.
- `calc_pt_regs_off()`: Complete register name-to-`offsetof(struct user_regs_struct, ...)` table covering all 31 integer registers: `ra`, `sp`, `gp`, `tp`, `a0`-`a7`, `s0`-`s11`, `t0`-`t6`.
- `parse_usdt_arg()`: Three USDT argument format variants handled via `sscanf`:
  - Memory dereference: `-8@-88(s0)` pattern
  - Constant: `4@5` pattern
  - Register read: `-8@a1` pattern (no `%` prefix, unlike x86)
- ISA extensions used: none.
- No floating-point register support (`fa0`-`fa7`). See Section 6.
- NOP combo detection for uprobe optimization not implemented for RISC-V; returns `false`. This is an x86_64-only optimization with no functional impact on correctness.

### 4.3 Linux Kernel BPF JIT (critical dependency, not in libbpf)

The kernel BPF JIT for riscv64 lives at `arch/riscv/net/bpf_jit_comp64.c` (2,159 lines). It is functional but has known gaps. See Section 11 for current bugs.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| PT_REGS macros (bpf_tracing.h) | Complete | Complete | Complete |
| Syscall arg macros | Complete (6 args) | Complete (6 args) | Complete (6 args) |
| Function call arg macros | Complete (6 args) | Complete (8 args) | Complete (8 args) |
| Custom pt_regs struct/cast | Not needed | Yes (`user_pt_regs`) | Yes (`user_regs_struct`) |
| USDT calc_pt_regs_off() | Complete | Complete | Complete |
| USDT parse_usdt_arg() | Complete | Complete | Complete |
| USDT FP register support | Yes | Yes | No |
| NOP uprobe optimization | Yes | No | No |
| BPF JIT (kernel) | Mature | Mature | Functional, 2 denylisted test categories |
| 1-byte/2-byte RMW atomics (JIT) | Supported | Supported | Not supported |

---

## 5. Build System, Cross-Compilation, and Toolchain

libbpf uses a hand-written GNU Makefile with no CMake, no autoconf, and no per-architecture Docker files.

**Native build on riscv64:**
```
cd src && make
```

**Cross-compile from x86_64:**
```
cd src
CROSS_COMPILE=riscv64-linux-gnu- BUILD_STATIC_ONLY=y \
  OBJDIR=../build DESTDIR=../root make install
```

The Makefile honors `CROSS_COMPILE` via `allow-override`:
```makefile
$(call allow-override,CC,$(CROSS_COMPILE)cc)
$(call allow-override,LD,$(CROSS_COMPILE)ld)
```

**Cross-compile with explicit pkg-config sysroot:**
```
cd src
PKG_CONFIG_PATH=/sysroot/riscv64/lib/pkgconfig \
CROSS_COMPILE=riscv64-linux-gnu- \
DESTDIR=/output make install
```

**QEMU Docker build (matches CI pattern, not in CI matrix but works):**
```
docker run --rm --platform linux/riscv64 \
  -v $(pwd):$(pwd) -e GITHUB_WORKSPACE=$(pwd) \
  ubuntu:noble $(pwd)/ci/build-in-docker.sh
```

**Required dependencies for build:**
- `libelf` (elfutils) -- hard runtime dependency; located via `pkg-config` by default
- `zlib` -- hard runtime dependency; located via `pkg-config` by default
- `pkg-config` -- required unless `NO_PKG_CONFIG=1` is set (which then falls back to `-lelf -lz`)

**Toolchain requirements:** GCC 7+ with the riscv64-linux-gnu target is sufficient for building libbpf itself. Clang/LLVM 10+ is required only to compile BPF programs that will be loaded by libbpf, not to build the library. The CI tests gcc-10 through gcc-12 and clang-14 through clang-16; no riscv64-specific minimum is documented.

**`LIBSUBDIR` behavior:** The Makefile detects 64-bit targets via `$(CC) -dumpmachine`. On `riscv64-linux-gnu` toolchains the machine string ends in `64`, so `LIBSUBDIR` is set to `lib64`.

**No known build failures on riscv64.** The Debian `rv-manda-04` buildd successfully built `libbpf 1.7.0-1` approximately 84 days before this report.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap Type |
|---------|-------|-------|---------|----------|
| kprobe/uprobe attach via PT_REGS | Full | Full | Full | None |
| Syscall argument access (kprobe) | Full | Full | Full | None |
| USDT probe attachment | Full | Full | Full | None |
| USDT FP register args (fa0-fa7) | Supported | Supported | Not supported | Functional |
| USDT integer register args (a0-a7, s0-s11, t0-t6) | Full | Full | Full | None |
| BPF CO-RE relocations | Full | Full | Full | None |
| BPF tail calls | Full | Full | Functional (no bpf2bpf mixing) | Functional (kernel JIT) |
| BPF exceptions (`bpf_throw`) | Full | Full | Not supported (patch submitted 2026-06-21, not merged) | Functional (kernel JIT) |
| 64-bit atomics (cmpxchg, xchg, add, and, or, xor) | Full | Full | Full | None |
| 1-byte / 2-byte RMW atomics | Full | Full | Not supported | Functional (kernel JIT) |
| BPF trampolines (fentry/fexit) | Full | Full | Functional (bug fixed 2025-12-19) | None after fix |
| speculative execution barrier (BPF_NOSPEC) | Full | Full | Missing fence.i (patch under review) | Security hardening |
| NOP uprobe optimization | Yes | No | No | Performance (minor) |

**USDT FP register gap:** If a probe argument is passed in a floating-point register (`fa0`-`fa7`), libbpf on riscv64 will fail to parse that argument. The impact is limited to programs using SystemTap/DTrace-style USDT probes where the probe site passes FP-typed arguments. No bug report for this gap exists in the libbpf tracker.

**Tail call / bpf2bpf mixing gap:** The kernel BPF JIT does not support programs that mix `bpf2bpf` calls and tail calls. This is a kernel-level limitation affecting libbpf users; the selftests for this category are on `DENYLIST.riscv64`.

**BPF exceptions gap:** `bpf_throw()` / BPF exception handling is not supported by the riscv64 JIT. A patch series "Add BPF Exceptions support for RISC-V" was submitted 2026-06-21 by Varun R Mallya but is not yet merged. [NEEDS VERIFICATION -- patch state as of report date]

**Performance gap (USDT NOP):** The NOP combo detection optimization (`uprobe_perf_filter_attach`) is x86_64-specific and returns `false` on riscv64 as on arm64. No performance delta is quantifiable; no benchmark data was found.

---

## 7. CI/CD Infrastructure

**libbpf upstream CI has no riscv64 coverage of any kind.** This was verified by reading all 8 workflow files.

**`build.yml` (cross-arch build matrix):** Tests aarch64, ppc64le, s390x, amd64 via QEMU binfmt + `ubuntu:noble`. riscv64 is not in this matrix.

**`test.yml` / `vmtest.yml` (functional BPF selftests via QEMU VM boot):** Single matrix entry: `arch: x86_64`. The `run-qemu/run.sh` in `libbpf/ci` has an explicit `case "$ARCH"` block covering only x86_64, s390x, and aarch64 -- riscv64 hits the `*) exit 1` (unsupported) branch. `qemu-system-riscv64` is not installed by `run-qemu/action.yml`.

**`ondemand.yml`:** `workflow_dispatch` trigger; `arch` input defaults to `x86_64`. No riscv64 option listed.

**Dormant riscv64 reference:** `ci/helpers.sh` contains `platform_to_kernel_arch()` which maps `riscv64 -> riscv` (the kernel arch name). This mapping is never exercised by any workflow because no workflow passes riscv64 as the arch.

**RISE runners:** The RISE RISC-V Runners service (Scaleway EM-RV1 nodes) runs kernel 5.10.x and "does not support virtualization." The vmtest infrastructure requires QEMU VM boot, which requires virtualization. Even if riscv64 were added to the vmtest matrix, it cannot run on RISE runners as currently configured. The RISE runners are used by llama.cpp, PyTorch, containerd, Kubernetes, k3s, DuckDB, NumPy, and Wazero; libbpf is not among the listed projects.

| CI Capability | amd64 | arm64 | riscv64 |
|---------------|-------|-------|---------|
| Build validation (build.yml) | Yes | Yes | No |
| Functional BPF selftests (vmtest) | Yes | No | No |
| Fuzzing (cifuzz) | Yes | No | No |
| Static analysis (CodeQL, Coverity) | Yes | No | No |
| Lint | Yes | No | No |
| RISE runner coverage | No | No | No |

---

## 8. Distribution and Release Status

libbpf GitHub releases ship source archives only. Releases v1.7.0 and v1.6.3 (the two most recent) each have exactly 2 assets: auto-generated `.zip` and `.tar.gz` source archives. No architecture-specific binaries are attached to any release.

**Debian (sid):**
- `libbpf1` version `1:1.7.0-1` -- status: Installed on riscv64, built on `rv-manda-04`, approximately 84 days before this report
- `libbpf-dev` version `1:1.7.0-1` -- available for riscv64
- Direct download: `libbpf1_1.7.0-1_riscv64.deb` (180,388 bytes, SHA256 `fcd92aace19e013b1260f9efe1ec3a5cda27fa36031ed25ee0cb400d3a6c2410`)
- Debian stable carries 1.5.0-3

**Ubuntu 24.04 (Noble):**
- `libbpf1` -- available for riscv64
- `libbpf-dev` -- available for riscv64
- `libbpfcc` -- available for riscv64
- `libbpfcc-dev` -- available for riscv64
- `libbpf-tools` -- amd64 and arm64 only; riscv64 absent [NEEDS VERIFICATION for current state]

**Arch Linux RISC-V (archriscv.felixc.at):** The status page returned no usable data during research. The archriscv.felixc.at extra repository contains `bcc-libbpf-tools-0.36.1-3-riscv64.pkg.tar.zst` (a related BCC tools package). Standalone `libbpf` package status in the Arch RISC-V port is unverifiable from available sources.

**PyPI:** No `libbpf` package exists on PyPI. libbpf is a C library; no Python wrapper is distributed through PyPI.

**User path to a working binary:** On Debian or Ubuntu riscv64, `apt install libbpf-dev` installs the library and headers from the distribution repository. No manual build is required for the base library. Building tools that use libbpf requires only a working riscv64-linux-gnu toolchain with libelf and zlib available.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|------------|------|---------------|--------------|-----------------|-----------------|
| libelf (elfutils) | Required: ELF parsing, BTF loading | Passing (Debian sid 0.195-1 installed on rv-osuosl-01) | Distribution QA only; no upstream riscv64 CI | Released in elfutils 0.195 | Sourceware Bugzilla blocked by Anubis bot protection; no known open riscv64 bugs via Debian tracker |
| zlib | Required: compressed BTF decompression | Passing (Debian sid 1:1.3.dfsg+really1.3.2-3 installed on rv-manda-03) | No riscv64-specific CI upstream | Current release | No known blockers; zero open/closed riscv64 GitHub issues in madler/zlib |
| zlib-ng (optional replacement) | Optional: SIMD-accelerated zlib | Passing; has `arch/riscv` directory with RVV and ZBC intrinsics | QEMU-emulated CI covers riscv64 with RVV and ZBC paths | Builds and releases with riscv64 SIMD support | No known blockers |
| Linux BPF JIT (kernel riscv64) | Required for JIT-compiled BPF execution | Mature (`arch/riscv/net/bpf_jit_comp64.c`, 2,159 lines) | Kernel BPF selftests; 2 test categories on DENYLIST.riscv64 | Shipped in mainline Linux | Sub-word atomics (1- and 2-byte RMW) not supported; exceptions not yet supported; speculative barrier patch pending |
| pahole / dwarves | Optional: BTF generation from DWARF for CO-RE kernels | Passing (Debian sid 1.31-2 installed on rv-osuosl-01, approximately 138 days before report) | No riscv64-specific upstream CI; distribution QA only | Released | No known blockers |
| Clang/LLVM | Optional: required only to compile BPF programs, not to build libbpf | Passing (LLVM has full riscv64 backend) | No open issues at intersection of BPF and RISC-V in llvm-project | Shipping in LLVM releases | No known blockers |

**libelf (elfutils) depth:** elfutils lists `riscv` and `riscv64` as named ELF backends in its source. The Debian buildd for riscv64 shows version 0.195-1 with status Installed. Sourceware.org (upstream Bugzilla) is protected by the Anubis bot challenge system and returned "Access Denied" during research; no upstream riscv64 bugs could be confirmed or ruled out via Bugzilla directly.

**Linux BPF JIT depth:** The kernel JIT is the only dependency with known functional gaps on riscv64. Gaps are: (1) 1-byte and 2-byte RMW atomics unimplemented (explicit comment in `bpf_jit_comp64.c`); (2) bpf2bpf + tail call mixing unsupported (DENYLIST.riscv64); (3) BPF exceptions unsupported (patch submitted 2026-06-21, not merged). Recent correctness bugs were fixed in 2024-2025 (see Section 11). The JIT is otherwise production-grade in mainline Linux.

---

## 11. Known Bugs and Active Issues

### libbpf repository (libbpf/libbpf) -- riscv64-specific

No open riscv64-specific issues or PRs exist as of the research date. The two closed riscv64-related issues are:

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| [#616](https://github.com/libbpf/libbpf/issues/616) | libbpf: support >5 PT_REGS_PARMx() | Closed 2023-01-26 | Resolved by PARM6-PARM8 addition for RISC-V |
| [#916](https://github.com/libbpf/libbpf/issues/916) | Query: why riscv64 maps to "riscv" for \_\_TARGET_ARCH\_ | Closed 2025-08-21 | Informational; intentional behavior confirmed |

### Kernel BPF JIT (riscv64) -- bugs affecting libbpf users

| Patch / Commit | Date | Status | Severity | Description |
|----------------|------|--------|----------|-------------|
| [22cc16c04b78](https://github.com/torvalds/linux/commit/22cc16c04b78) | 2025-12-19 | Accepted | Critical | Wrong flag check in BPF trampoline caused kernel stack overflow |
| riscv: bpf: Fix uninitialized symbol 'retval_off' | 2025-09-22 | Accepted | High | Uninitialized variable in BPF trampoline |
| riscv, bpf: fix reads of thread_info.cpu | 2025-08-12 | Accepted | High | Incorrect load width reading CPU ID in BPF percpu ops |
| riscv, bpf: Fix possible infinite tailcall with CONFIG_CFI_CLANG | 2024-10-08 | Accepted | High | Infinite loop under CFI |
| riscv, bpf: Make BPF_CMPXCHG fully ordered | 2024-10-17 | Accepted | High | Memory ordering bug in atomic compare-exchange |
| riscv: bpf: big endian fixes, updated BPF_ALU ops | 2024-12-20 | RFC (not merged) | Medium | Big-endian correctness fixes |
| riscv, bpf: Fix signed operations and add 32-bit atomics | 2026-05-11 (v2) | Under review | High | Fixes BPF_SDIV, BPF_SMOD, BPF_MOVSX in RV32 JIT |
| riscv, bpf: Emit fence.i for BPF_NOSPEC | 2025-12-28 | Changes requested | Medium | Missing speculative execution barrier |

### Kernel DENYLIST.riscv64 (active functional gaps)

| Entry | Reason | Patch status |
|-------|--------|--------------|
| `exceptions` | JIT does not support BPF exceptions | Patch series submitted 2026-06-21 by Varun R Mallya; not merged |
| `tailcalls/tailcall_bpf2bpf*` | JIT does not support mixing bpf2bpf and tail calls | No patch active |

### libbpf library source (not tracked as bugs, but gaps)

- No floating-point register support (fa0-fa7) in USDT argument parsing in `usdt.c`. Only integer registers covered.
- `s8` register requires `rv_s8` poison workaround macro due to kernel header naming conflict. This is a code quality issue, not a bug.

---

## 12. Objections and Upstream Blockers

**No stated objections to RISC-V support exist.** The community has merged contributions from 5+ organizations without friction.

**Absence of riscv64 from CI matrix:** The `build.yml` matrix explicitly omits riscv64. No issue or PR has requested adding it. This is a gap of omission, not a deliberate exclusion. Adding riscv64 to the QEMU-emulated build matrix requires adding one entry to the matrix array and one QEMU binfmt target; this is a low-friction change.

**vmtest infrastructure limitation:** The vmtest functional test path cannot run on RISE runners due to the no-virtualization constraint of the Scaleway EM-RV1 nodes. A GitHub Actions QEMU-based runner or a hardware runner with virtualization support would be required. The vmtest framework already has the `platform_to_kernel_arch()` mapping for riscv64 in `helpers.sh`; the remaining work is adding `qemu-system-riscv64` installation and a riscv64 case in `run-qemu/run.sh`.

**Kernel JIT gaps as upstream blockers:** The two DENYLIST.riscv64 entries (exceptions, bpf2bpf+tailcall) are kernel JIT limitations, not libbpf limitations. libbpf itself does not need to change to support these when the kernel fixes land.

**Acceptance probability for CI addition:** High. The maintainer (Andrii Nakryiko, Meta) has shown no resistance to riscv64 work. The infrastructure pattern is established for three other architectures. A well-formed PR adding riscv64 to `build.yml` and basic vmtest support would align with existing precedent.

---

## 13. Investment Analysis

RISE has no prior investment in libbpf. All prior RISC-V work was contributed by individual developers at Intel, IBM, Huawei, Rivos, and Gentoo; none of it was RISE-coordinated.

### 13.1 Functional Enablement

The library itself is functionally complete on riscv64 for all common use cases. The two remaining functional gaps are:

1. USDT FP register argument support -- affects USDT probes where probe arguments are passed in floating-point registers. Narrow use case.
2. Kernel BPF JIT: exceptions and bpf2bpf+tailcall mixing -- these require kernel changes, not libbpf changes.

### 13.2 Performance Optimization

No performance gaps exist within libbpf itself. The library does not contain SIMD code or hot paths that require optimization. All performance concerns are in the kernel BPF JIT, which is out of libbpf's scope.

### 13.3 CI/CD Infrastructure

The most actionable investment is CI. riscv64 is absent from both the build matrix and the functional test path. Adding riscv64 to the build matrix is straightforward. Adding riscv64 to vmtest requires either QEMU VMs (possible in GitHub Actions) or hardware with virtualization.

### 13.4 Ecosystem Enablement

libbpf is a C library. It has no package ecosystem (no Python wheels, no npm packages). Downstream tools that depend on libbpf (bpftool, bcc, bpftrace) have their own riscv64 status and are outside this report's scope.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| CI | Add riscv64 to `build.yml` cross-build matrix | 0.5 | Upstream (libbpf maintainer, Meta) | High |
| CI | Add riscv64 QEMU vmtest path in `run-qemu/run.sh` and `action.yml` | 2 | Upstream (libbpf maintainer, Meta) | High |
| CI | Integrate riscv64 CI with RISE runners (if virtualization becomes available) | 1 | RISE infrastructure + upstream | Medium |
| Functional | USDT FP register support in `usdt.c` (`fa0`-`fa7`) | 1 | Upstream contribution | Low |
| Functional | BPF exceptions support in kernel riscv64 JIT | 3-4 (kernel work, not libbpf) | Rivos / Huawei contributors | High (kernel) |
| Functional | bpf2bpf + tail call mixing in kernel riscv64 JIT | 4-6 (kernel work, not libbpf) | Kernel BPF community | Medium (kernel) |
| Security | BPF_NOSPEC fence.i patch (pending review) | 0 (patch exists, needs review bandwidth) | Upstream reviewer | Medium |

**Total libbpf-specific effort (excluding kernel JIT work):** approximately 4-5 person-weeks to bring riscv64 to full CI parity with aarch64.

**Qualification:** The library itself requires no investment to be functionally usable on riscv64 today. Investment in CI is the primary value add -- it prevents regressions and signals to the community that riscv64 is a first-class target.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [libbpf/libbpf GitHub repository](https://github.com/libbpf/libbpf)
- [libbpf documentation (readthedocs)](https://libbpf.readthedocs.io/)
- [eBPF Foundation](https://ebpf.io/foundation/)
- [Commit 7beaa2e: Initial RV64 PT_REGS support (Bjorn Topel, Intel)](https://github.com/libbpf/libbpf/commit/7beaa2ef90ede98dae9e6d1e0c48ef4f6c215f0b)
- [Commit 497ec1d: Fix riscv register names (Ilya Leoshkevich, IBM)](https://github.com/libbpf/libbpf/commit/497ec1d35ca3bb824f9345e32b665157077b1746)
- [Commit 32c19d8: Fix syscall argument access on riscv](https://github.com/libbpf/libbpf/commit/32c19d8505ff32fe84d16277232bb7f0b645d63a)
- [Commit eb2b216: Support riscv USDT argument parsing (Pu Lehui, Huawei)](https://github.com/libbpf/libbpf/commit/eb2b216081c3acca7f7657203b38414ff8a2de9f)
- [Commit 8498996: Use a0 for RC register (Yixun Lan, Gentoo)](https://github.com/libbpf/libbpf/commit/8498996f9fb347dea51dbe678867884358a978f2)
- [Commit 9db84de: Complete riscv arch spec PARM6-PARM8 (Andrii Nakryiko, Meta)](https://github.com/libbpf/libbpf/commit/9db84de5f0b7b0160c8d5ea698f7fe2353d066a3)
- [Commit ed66fb2: Define riscv syscall regs spec (Andrii Nakryiko, Meta)](https://github.com/libbpf/libbpf/commit/ed66fb297d7895e879b30bc4d808e25843a64902)
- [Commit 6a6cf6d: Fix comment about riscv in bpf_tracing.h](https://github.com/libbpf/libbpf/commit/6a6cf6dcdc711450a25dbf68b930f482f5274473)
- [Commit 20c1170: Fix syscall wrapper for riscv ARCH_HAS_SYSCALL_WRAPPER (Alexandre Ghiti, Rivos)](https://github.com/libbpf/libbpf/commit/20c1170ea4044852e79297c66d6e1a7734d28984)
- [PR #655: Libbpf sync 2023-02-16](https://github.com/libbpf/libbpf/pull/655)
- [PR #693: Libbpf sync 2023-05-24](https://github.com/libbpf/libbpf/pull/693)
- [PR #744: sync: latest libbpf changes from kernel (syscall wrapper fix)](https://github.com/libbpf/libbpf/pull/744)
- [PR #799: sync: latest libbpf changes from kernel](https://github.com/libbpf/libbpf/pull/799)
- [PR #940: Libbpf sync 2026-01-28](https://github.com/libbpf/libbpf/pull/940)
- [PR #946: Libbpf sync 2026-02-11](https://github.com/libbpf/libbpf/pull/946)
- [Issue #616: libbpf: support >5 PT_REGS_PARMx()](https://github.com/libbpf/libbpf/issues/616)
- [Issue #916: Query on riscv64 target arch mapping](https://github.com/libbpf/libbpf/issues/916)
- [libbpf CI build.yml](https://github.com/libbpf/libbpf/blob/master/.github/workflows/build.yml)
- [libbpf CI test.yml](https://github.com/libbpf/libbpf/blob/master/.github/workflows/test.yml)
- [libbpf CI vmtest.yml](https://github.com/libbpf/libbpf/blob/master/.github/workflows/vmtest.yml)
- [libbpf CI run-qemu/action.yml](https://github.com/libbpf/ci/blob/main/run-qemu/action.yml)
- [libbpf CI helpers.sh](https://github.com/libbpf/ci/blob/main/helpers.sh)
- [Linux kernel DENYLIST.riscv64](https://github.com/torvalds/linux/blob/master/tools/testing/selftests/bpf/DENYLIST.riscv64)
- [Linux kernel BPF JIT for riscv64](https://github.com/torvalds/linux/blob/master/arch/riscv/net/bpf_jit_comp64.c)
- [Kernel commit 22cc16c04b78: fix incorrect BPF_TRAMP_F_ORIG_STACK usage](https://github.com/torvalds/linux/commit/22cc16c04b78)
- [Debian buildd status for libbpf](https://buildd.debian.org/status/package.php?p=libbpf)
- [Debian packages: libbpf riscv64](https://packages.debian.org/sid/riscv64/libbpf1)
- [Ubuntu 24.04 Noble libbpf packages](https://packages.ubuntu.com/search?keywords=libbpf&suite=noble)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE RISC-V Runners announcement](https://riseproject.dev/blog/risc-v-runners)
- [riscv-elf-psabi-doc RISC-V calling conventions](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-cc.adoc)