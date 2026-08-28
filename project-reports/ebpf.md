---
title: eBPF
parent: Project Reports
categories:
  - perfmon
---

# eBPF

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for eBPF<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

eBPF is a Linux kernel subsystem and associated userspace toolchain that allows sandboxed programs to run in the kernel without modifying kernel source code or loading modules. The primary use cases are observability (tracing, profiling), networking (XDP, tc BPF), and security (LSM hooks, seccomp). eBPF is not a standalone application; it is a subsystem of the Linux kernel with associated userspace libraries.

**Repository:** [git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git)<br/>
**Homepage:** [ebpf.io](https://ebpf.io/)<br/>
**Governance:** The [eBPF Foundation](https://ebpf.foundation/), a Directed Fund under the Linux Foundation. Governance is split between a Governing Board (corporate members) and a BPF Steering Committee (BSC, community maintainers). The BSC requires two-thirds approval for new members and caps representation at two seats per employer.<br/>
**Platinum members:** CrowdStrike, Google, Isovalent (Cisco), Meta Platforms, Netflix.<br/>
**Silver members:** Datadog, Intel, Toyota Motor.<br/>
**BSC active members:** Alexei Starovoitov (Meta), Daniel Borkmann (Isovalent/Cisco), Alan Jowett (Microsoft), Brendan Gregg (Intel), Joe Stringer (Isovalent), KP Singh (Google).<br/>

The Linux kernel BPF subsystem has two maintainer trees: [bpf.git](https://git.kernel.org/pub/scm/linux/kernel/git/bpf/bpf.git) (fixes) and [bpf-next.git](https://git.kernel.org/pub/scm/linux/kernel/git/bpf/bpf-next.git) (development). Core maintainers are Alexei Starovoitov and Daniel Borkmann, with Andrii Nakryiko (Meta) as a primary co-maintainer.

**RISE Project involvement:** None. A full scan of all 27 RISE blog posts (May 2024 through June 2026) and all 30 repositories in the [riseproject-dev GitHub organization](https://github.com/orgs/riseproject-dev/repositories) found zero eBPF content. eBPF is not a RISE project member, and no RISE project number (RPXXX) covering eBPF has been publicly documented.

---

## 2. Port History and Upstreaming Timeline

The riscv64 BPF JIT was introduced to the Linux kernel on 2019-02-05 by Bjorn Topel (Intel), commit `2353ecc6f91f`, titled "bpf, riscv: add BPF JIT for RV64G." The commit was co-signed by Daniel Borkmann. It implemented a two-pass JIT targeting RV64G and was noted as lacking `CONFIG_HAVE_KPROBES` support at the time.

The RV32 JIT was added in March 2020 by Luke Nelson and Xi Wang (University of Washington), commit `ca6cb5447cec`, which also factored shared RV32/RV64 code into `bpf_jit_core.c`.

Key milestones since then:

| Date | Event | Author | Affiliation |
|---|---|---|---|
| 2019-02-05 | First RV64G BPF JIT added | Bjorn Topel | Intel |
| 2020-03-05 | RV32 JIT added; shared core factored out | Luke Nelson, Xi Wang | Univ. of Washington |
| 2021-10-27 | BPF exception tables added | Tong Tiangen | Huawei |
| 2021-10-28 | riscv added to bpf_tracing.h | Bjorn Topel | Intel |
| 2022-04-10 | More atomic operations for RV64 | Pu Lehui | Huawei |
| 2022-04-19 | USDT argument parsing support in libbpf | Pu Lehui | Huawei |
| 2023-02-15 | BPF trampoline support for RV64 | Pu Lehui | Huawei |
| 2023-02-21 | kfunc support for RV64 | Pu Lehui | Huawei |
| 2023-08-24 | Signed div/mod, unconditional bswap | Pu Lehui | Huawei |
| 2024-03-03 | kCFI + BPF support on riscv64 | Puranjay Mohan | (independent/AWS) |
| 2024-04-04 | BPF Arena / PROBE_MEM32 / addr_space_cast | Puranjay Mohan | (independent/AWS) |
| 2024-04-05 | Pu Lehui and Puranjay added to MAINTAINERS as riscv64 reviewers | Bjorn Topel | Intel |
| 2024-05-02 | bpf_get_smp_processor_id() inlined; per-CPU addr resolution | Puranjay Mohan | (independent/AWS) |
| 2024-05-05 | Atomic memory ordering bug fixed (relaxed AMOs changed to full-order) | Puranjay Mohan | (independent/AWS) |
| 2024-05-24 | Zba/Zbb extension optimizations (shift-add, bswap, zextw) | Xiao Wang | Intel |
| 2024-07-02 | 12-argument trampoline support | Pu Lehui | Huawei |
| 2025-07-19 | Arena atomics for RV64 (Zacas) | Pu Lehui | Huawei |
| 2025-09-08 | Struct ops return value sign-extension fix | Hengqi Chen | (independent) |
| 2025-12-29 | Fix .btf.o generation when cross-compiling for RISC-V | Ihor Solodrai | (independent) |
| 2026-02-08 | fsession trampoline support | Menglong Dong | China Telecom |
| 2026-06-02 | Inline bpf_get_current_task() / bpf_get_current_task_btf() | Varun R Mallya | (independent) |

The riscv64 BPF JIT has been upstream continuously since Linux 5.1 (2019). It has not required a fork or out-of-tree carry at any point.

---

## 3. Upstream Support Tier

The Linux kernel MAINTAINERS file lists two separate BPF JIT entries for RISC-V:

**BPF JIT for RISC-V (64-bit)** covering `arch/riscv/net/` (excluding `bpf_jit_comp32.c`):
- Maintainer: Bjorn Topel `bjorn@kernel.org` (Intel)
- Reviewer: Pu Lehui `pulehui@huawei.com` (Huawei)
- Reviewer: Puranjay Mohan `puranjay@kernel.org` (AWS)
- Status: **Maintained**

**BPF JIT for RISC-V (32-bit)** covering the RV32 path:
- Maintainer: Luke Nelson `luke.r.nels@gmail.com` (University of Washington at time of authorship)
- Maintainer: Xi Wang `xi.wang@gmail.com` (University of Washington at time of authorship)
- Status: **Maintained**

The `Maintained` designation means patches are accepted and reviewed but there is no SLA or commercial support obligation. This contrasts with `Supported`, which implies a vendor with a formal backing commitment (for example, the s390x BPF JIT carries `Supported` from IBM). The RV64 JIT has de-facto commercial backing through Intel (Topel) and Huawei (Pu Lehui), and AWS (Puranjay Mohan), but none have formalized this as a `Supported` entry.

There is no formal tier policy gating new architecture ports in the eBPF Foundation charter or BSC governance documents. The practical bar for a new JIT is: correct instruction encoding, passing `test_bpf` and `test_verifier`, a named MAINTAINERS entry, and ongoing patch responsiveness. The riscv64 JIT cleared all of these in 2019.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Source File Inventory

All riscv64 eBPF JIT code lives in `arch/riscv/net/` (four C files plus one header and one Makefile):

- **`bpf_jit.h`** - Shared header for RV32 and RV64 backends. Contains: RISC-V register enum (RV_REG_ZERO through T6), R/I/S/B/U/J-type instruction encoders, RVC (compressed) helpers and `is_creg()`, AMO instruction encoder `rv_amo_insn()`, `rv_ext_enabled()` macro gating Zba/Zbb/Zacas extensions at runtime, `emit_addi`/`emit_lw` wrappers that auto-select 2-byte compressed forms.

- **`bpf_jit_comp64.c`** - Main eBPF JIT for RV64G. Contains: `regmap[]` mapping BPF_REG_0..BPF_REG_AX to RISC-V hardware registers; `ex_handler_bpf()` for probe-memory fault recovery; `bpf_jit_emit_insn()` covering the full BPF ISA (ALU32/64, load/store, branches, calls, tail calls, atomics, BPF_PROBE_MEM/MEM32); `arch_prepare_bpf_trampoline()` for fentry/fexit/fmod_ret trampoline generation; `bpf_jit_supports_arena()` returning true; `bpf_jit_supports_kfunc_call()` returning true; `bpf_jit_supports_fsession()` returning true.

- **`bpf_jit_comp32.c`** - BPF JIT for RV32G (Luke Nelson, Xi Wang, 2020). Full prologue/epilogue, ALU32/64 with 32-bit emulation sequences for 64-bit operations.

- **`bpf_jit_core.c`** - Shared convergence loop (Bjorn Topel). Runs up to NR_JIT_ITERATIONS=32 convergence passes; calls `bpf_jit_emit_insn()` per instruction; implements `bpf_arch_text_copy()`, `bpf_arch_text_invalidate()`, `bpf_jit_free()`; calls `bpf_jit_binary_pack_finalize()` on the stable pass.

Related files outside `arch/riscv/net/`:

- **`arch/riscv/include/asm/extable.h`** - Declares `ex_handler_bpf()` gated on `#if defined(CONFIG_BPF_JIT) && defined(CONFIG_ARCH_RV64I)`; provides a false stub otherwise.
- **`arch/riscv/mm/extable.c`** - `fixup_exception()` dispatches `case EX_TYPE_BPF: return ex_handler_bpf(ex, regs)`.
- **`arch/riscv/include/uapi/asm/bpf_perf_event.h`** - `typedef struct user_regs_struct bpf_user_pt_regs_t` for BPF perf event programs.
- **`arch/riscv/Kconfig`** - `select HAVE_EBPF_JIT if MMU`. JIT is enabled only when the MMU is active. nommu RISC-V kernels fall back to the interpreter.

### 4.2 Register Mapping

The RV64 JIT maps BPF registers to RISC-V hardware registers via `regmap[]`. BPF R6-R9 and the AX scratch register are callee-saved RISC-V registers (S1-S5). BPF R0 maps to A5 (the BPF return value register), with BPF-to-RISC-V ABI bridging handled explicitly at call boundaries because the RISC-V ABI return register is A0.

### 4.3 Extension Gating

`rv_ext_enabled()` in `bpf_jit.h` gates integer extension use at runtime:
- **Zba**: shift-add optimization (`add.uw`, `sh1add`, `sh2add`, `sh3add`)
- **Zbb**: bit manipulation (`rev8`, `orc.b` for bswap; `zext.w`)
- **Zacas**: compare-and-swap via a single `amocas.{w,d,q}` instruction instead of an LR/SC loop; required for `BPF_CMPXCHG` in arena mode

No V-extension (RVV) or SIMD dispatch exists in the BPF JIT. The extension gate covers integer extensions only.

### 4.4 JIT Design

The JIT uses a two-pass design with separate read-write and read-execute buffers (`bpf_jit_binary_pack_alloc`). The convergence loop runs up to 32 passes. 64-bit immediates require up to four instructions (`lui`/`addiw`/`addi`/`slli` sequences). Out-of-range function calls (outside `[-2^31 - 2^11, 2^31 - 2^11)`) fail with `-ERANGE`.

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build System

eBPF is a kernel subsystem built with the Linux Kbuild/Makefile system. There is no cmake or configure invocation. The riscv64 JIT is built conditionally via `arch/riscv/net/Makefile`:
- `bpf_jit_core.o` is built unconditionally when `CONFIG_BPF_JIT=y`
- `bpf_jit_comp64.o` is built when `CONFIG_ARCH_RV64I=y`
- `bpf_jit_comp32.o` is built otherwise

### 5.2 Cross-Compilation Commands

Kernel build:
```
make ARCH=riscv CROSS_COMPILE=riscv64-linux-gnu- -j$(nproc)
```

BPF selftests cross-build:
```
make -C tools/testing/selftests/bpf \
     ARCH=riscv \
     CROSS_COMPILE=riscv64-linux-gnu- \
     CLANG=clang-${LLVM_VERSION} \
     EXTRA_LDFLAGS=-static \
     -j$(nproc)
```

The selftests Makefile automatically selects LLD as the linker on riscv64:
```makefile
ifeq ($(SRCARCH),$(filter $(SRCARCH),x86 riscv))
  # uses lld
```

The `get_sys_includes` function greps the compiler for `__riscv_xlen` and injects `-D__riscv_xlen=<value> -D__BITS_PER_LONG=<value>` during BPF object compilation.

### 5.3 Toolchain Requirements

Absolute minimums from `scripts/min-tool-version.sh`:

| Tool | Minimum | Notes |
|---|---|---|
| GCC | 8.1.0 | General minimum for all architectures |
| Clang/LLVM | 17.0.1 | General minimum |
| Binutils (ld) | 2.30.0 | |
| pahole | 1.22 | Required for `CONFIG_DEBUG_INFO_BTF=y` |

Additional RISC-V-specific toolchain constraints:

| Constraint | Condition |
|---|---|
| `TOOLCHAIN_NEEDS_OLD_ISA_SPEC=y` | GCC < 11.3.0 (uses old ISA spec syntax) |
| `TOOLCHAIN_HAS_V` (vector ext) | Binutils >= 2.38 |
| `TOOLCHAIN_HAS_ZBB/ZBA/ZBC/ZBKB` | Binutils >= 2.39 |
| `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` | GNU assembler >= 2.36 |
| `ARCH_HAS_BROKEN_DWARF5` | assembler < 18.0.0 and LLD < 18.0.0 |
| `GCC_ASM_GOTO_OUTPUT_BROKEN` | GCC < 11.5, or 12.x < 12.4, or 13.x < 13.3 |

Practical recommendation: GCC >= 12.4.0 or >= 13.3.0 to avoid the asm-goto-output bug; Clang >= 17.0.1. BPF Arena ASAN requires LLVM >= 22.

The `libbpf/ci` CI infrastructure pins LLVM 21 and GCC 15 (hardcoded in `action.sh`). When GCC >= 15, the Ubuntu codename is overridden from `noble` (24.04) to `plucky` (25.04) because GCC 15 is not in LTS releases.

Cross-compilation package setup (Ubuntu):
```
apt-get install -y \
  binfmt-support qemu-user-static \
  gcc-${GCC_VERSION}-riscv64-linux-gnu \
  g++-${GCC_VERSION}-riscv64-linux-gnu \
  linux-libc-dev:riscv64 \
  libelf-dev:riscv64 libssl-dev:riscv64 zlib1g-dev:riscv64
```

### 5.4 QEMU Configuration

The selftests `vmtest.sh` uses `qemu-system-riscv64` with `-M virt -cpu rv64,sscofpmf=true -smp 8 -m 4G`. Minimum required QEMU version is 7.2.0 (stated explicitly in `vmtest.sh` source). Kernel image is loaded from `arch/riscv/boot/Image`. Console is `ttyS0,115200`.

### 5.5 riscv64 Kernel Config Fragment

`tools/testing/selftests/bpf/config.riscv64` provides 83 config options. Key riscv64-specific entries include:
- `CONFIG_RISCV_EFFICIENT_UNALIGNED_ACCESS=y`
- `CONFIG_RISCV_ISA_C=y` (compressed instructions)
- `CONFIG_RISCV_PMU_SBI=y`
- `CONFIG_SOC_VIRT=y` (QEMU virt machine)
- `CONFIG_BPF_JIT_ALWAYS_ON=y`
- `CONFIG_NONPORTABLE=y`

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

### 6.1 RV64 JIT Completeness

| Component | Status | Notes |
|---|---|---|
| ALU ops (64-bit) | Full | All BPF_ALU64 ops: MOV, ADD, SUB, AND, OR, XOR, MUL, DIV, MOD, LSH, RSH, ARSH, NEG, BSWAP/endian. Signed vs. unsigned selected via `off` field. Zbb used for bswap optimization. |
| ALU ops (32-bit) | Full | All BPF_ALU ops with auto zero-extension via `emit_zextw`. Zba for shift-add. |
| Memory ops | Full | BPF_MEM, BPF_PROBE_MEM, BPF_MEMSX, BPF_PROBE_MEMSX, BPF_PROBE_MEM32 (arena-relative). All widths B/H/W/DW. |
| Conditional jumps | Full | Full set: JEQ, JNE, JGT, JLT, JGE, JLE, JSGT, JSLT, JSGE, JSLE, JSET for both BPF_JMP and BPF_JMP32. |
| Atomics (4/8-byte) | Full | ADD, AND, OR, XOR (plain + FETCH), XCHG, CMPXCHG via AMO. BPF_LOAD_ACQ / BPF_STORE_REL via fence. CMPXCHG in arena mode requires Zacas. |
| Atomics (1/2-byte) | Missing | 1-byte and 2-byte RMW atomics return `-EINVAL`. No hardware AMO support for these widths on any RISC-V implementation. |
| Tail calls | Partial | Implemented (decrements TCC, jumps to prologue). Mixing bpf2bpf calls with tail calls is unsupported (in DENYLIST.riscv64). |
| BPF exceptions | Missing | Explicitly in DENYLIST.riscv64 as "JIT does not support exceptions." |
| Trampolines | Full | fentry, fexit, modify-return, session cookies, IP argument passing, BPF_TRAMP_F_CALL_ORIG. BPF_TRAMP_F_ORIG_STACK and BPF_TRAMP_F_SHARE_IPMODIFY return `-ENOTSUPP`. |
| 12-argument trampolines | Full | Stack-passed arguments beyond 8 registers handled via `restore_stack_args()`. |
| fsession | Full | `bpf_jit_supports_fsession()` returns true; session cookie encoding into `func_meta` implemented. |
| Struct ops | Full | Indirect trampoline path with kcfi hash emission and return-value sign-extension per `ret_size` and `ret_flags`. |
| BPF Arena | Full | `bpf_jit_supports_arena()` returns true. PROBE_MEM32, addr_space_cast, arena atomics (Zacas for cmpxchg) all implemented. |
| Helper inlining | Full | `bpf_get_smp_processor_id()` (single `lw` from TP), `bpf_get_current_task()` / `bpf_get_current_task_btf()` (single `mv a5, tp`), `bpf_kptr_xchg()` all inlined. |
| kfunc calls | Full | Argument sign-extension for int-sized kfunc parameters. |
| Speculation barrier (BPF_NOSPEC) | Missing | Explicit no-op -- no `fence.i` or equivalent emitted. Patch submitted 2025-12-28, left in "Changes Requested" state. See section 12. |
| kCFI | Full | `kcfi` hash emission in trampolines; `bpf/riscv: Support kCFI + BPF on riscv64` merged 2024-03-03. |
| Per-CPU address resolution | Full | Internal BPF pseudo-instruction resolves per-CPU data offsets via `__per_cpu_offset`. |
| JIT infrastructure | Full | `bpf_jit_binary_pack_alloc` (RW/RX separation), exception tables, convergence loop (up to 32 passes), `bpf_prog_pack` for trampoline memory. |

### 6.2 RV32 JIT Completeness (Secondary Interest)

| Component | Status | Notes |
|---|---|---|
| ALU 32-bit | Full | All ops including div/mod. |
| ALU 64-bit | Partial | DIV/MOD unsupported, return `-EFAULT`. All others via register pairs. |
| Atomics | Partial | As of the research date: only 32-bit BPF_ADD (amoadd.w). A patch series adding full 32-bit atomic ops (Kuan-Wei Chiu, 2026-04-29) was superseded due to a memory ordering bug; a corrected v2 has not appeared in the active patchwork listing. 64-bit atomics structurally unsupported on RV32. |
| Trampolines | Missing | No trampoline support in the RV32 JIT. |
| Signed div/mod | Fixed | Fixed 2026-04-29 in the same series; superseded; fix expected to land in v2. |

### 6.3 Gaps Relative to arm64 and amd64

- **1/2-byte atomics:** Neither arm64 nor the RISC-V JIT implements 1/2-byte RMW atomics. This is a hardware limitation on RISC-V (no AMO for byte/halfword); it is also absent on arm64. On amd64 these are implemented. [NEEDS VERIFICATION: arm64 1/2-byte atomic status in the BPF JIT]
- **BPF exceptions:** Not supported on RISC-V. amd64 and arm64 both support BPF exceptions.
- **bpf2bpf + tail call mixing:** Not supported on RISC-V. Both amd64 and arm64 support this.
- **BPF_NOSPEC:** Emits a no-op on RISC-V. amd64 emits `lfence`; arm64 emits `csdb` (or equivalent). This is a correctness gap under speculative execution threat models.
- **DWARF-based userspace stack unwinding in bpftrace:** Gated behind x86_64 in the bpftrace codebase. Unavailable on riscv64. The `HAVE_DW_UNWIND` feature in bpftrace requires x86_64 and LLVM >= 21.

---

## 7. CI/CD Infrastructure

### 7.1 Upstream Kernel BPF CI (kernel-patches/bpf)

The authoritative BPF CI is at [kernel-patches/bpf](https://github.com/kernel-patches/bpf). The architecture matrix is defined in `.github/scripts/matrix.py`. The `Arch` enum in that file defines exactly three architectures: `x86_64`, `aarch64`, `s390x`.

**riscv64 is absent from this matrix.** This was confirmed by direct inspection of the matrix.py file content and cross-referenced against `.github/workflows/kernel-build-test.yml`, which explicitly names only these three architectures. There is no riscv64 build job and no riscv64 test job in the upstream BPF CI.

### 7.2 Other eBPF CI Systems

| CI System | Architectures Tested | riscv64? |
|---|---|---|
| kernel-patches/bpf (upstream kernel BPF) | x86_64, aarch64, s390x | No |
| libbpf/libbpf build CI | aarch64, ppc64le, s390x, amd64 | No |
| libbpf/libbpf vmtest CI | x86_64 only | No |
| libbpf/libbpf test CI | x86_64 only | No |
| cilium/ebpf (Go library) | x86_64, arm64 | No |
| iovisor/bcc | x86_64 only | No |
| libbpf/bpftool | Ubuntu 22.04 and 24.04 only (no arch matrix) | No |

Source for all entries above: direct inspection of the respective `.github/workflows/` files for each repository.

**riscv64 is absent from every eBPF CI system examined.** RISC-V BPF patches are merged after manual review and testing by the named maintainers, without automated validation on riscv64 hardware or QEMU. This means riscv64-specific regressions are not caught by CI and will only surface via developer reports or downstream testing.

The kernel does contain a `tools/testing/selftests/bpf/config.riscv64` fragment and a `DENYLIST.riscv64` file, which represent infrastructure readiness for riscv64 selftest runs. The DENYLIST explicitly excludes `exceptions` and `tailcalls/tailcall_bpf2bpf*` on riscv64 with documented reasons. This means the selftest suite is runnable on riscv64 -- but no upstream CI actually runs it.

There is a third-party reference to a Docker-based workflow for riscv64 BPF testing at `pulehui/riscv-bpf-vmtest` mentioned in vmtest.sh comments, but that is a maintainer's personal repository, not an official CI system [NEEDS VERIFICATION: current state and accessibility of pulehui/riscv-bpf-vmtest].

The syzbot `ci-qemu2-riscv64` fuzzer instance exists and shows 31 active crashes in the riscv64 kernel tree as of mid-June 2026. Not all are BPF-specific.

---

## 8. Distribution and Release Status

eBPF is a kernel subsystem, not a standalone release artifact. The JIT support is in-tree and ships with every Linux kernel that sets `CONFIG_BPF_JIT=y` and `CONFIG_ARCH_RV64I=y`. The latest mainline kernel is 7.1 (2026-06-14); latest stable is 7.0.12 (2026-06-09).

### 8.1 Associated Package Status on riscv64

**Ubuntu 24.04 (Noble):**

| Package | Version | riscv64 Available |
|---|---|---|
| golang-github-cilium-ebpf-dev | 0.11.0-2 | Yes (arch: all) |
| libbpf1 / libbpf-dev | 1:1.3.0-2build2 | Yes |
| libbpfcc / libbpfcc-dev | 0.29.1+ds-1ubuntu7 | Yes |
| bpftrace | 0.20.2-1ubuntu4 | Yes |
| libbpf-tools | 0.29.1+ds-1ubuntu7 | No (amd64/arm64/ppc64el only) |

**Debian Trixie (Sid):**

| Package | Version | riscv64 Status |
|---|---|---|
| libbpf | 1.5.0-3 | Installed |
| libbpf-dev | 1.5.0-3 | Installed |
| bpftrace | 0.23.2-1 | Installed |
| elfutils | 0.192-4 | Installed |
| dwarves (pahole) | 1.30-1 | Installed |
| iproute2 | 6.15.0-1 | Installed |
| llvm-toolchain-19 | 19.1.7-3 | Installed |
| bpftool | Not found | No entry in riscv64 buildd database |

bpftool is not packaged as a standalone binary for riscv64 in Debian Trixie. It can be built from the kernel `tools/bpf/bpftool/` source tree but is not distributed as a binary package.

**Arch Linux RISC-V port:**

bpftrace 0.26.1-1 (extra repo) is FTBFS (Fails To Build From Source) on the Arch Linux RISC-V port. Broken dependencies: `linux-headers` (make), `xxd` (make). Upstream bug: [bugs.archlinux.org/task/77579](https://bugs.archlinux.org/task/77579). [NEEDS VERIFICATION: current status of bpftrace Arch RISC-V FTBFS as of report date]

**PyPI:** No package named `ebpf` exists on PyPI (HTTP 404 confirmed). Not applicable.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| Linux kernel (BPF JIT) | Core: `arch/riscv/net/` implements the eBPF-to-RV64G JIT | Builds; JIT enabled by default when MMU is active | Partial -- DENYLIST.riscv64 skips `exceptions` and `tailcalls/tailcall_bpf2bpf*` | Shipped in mainline since 5.1 | JIT does not support BPF exceptions. JIT cannot mix bpf2bpf calls with tail calls. 1/2-byte RMW atomics unsupported. BPF_NOSPEC is a no-op. |
| libbpf | Userspace BPF loader and CO-RE library | Builds (Debian Trixie riscv64: v1.5.0-3 Installed) | CI runs x86_64 only; no riscv64 VM test lane | Available in Debian Trixie and Ubuntu Noble | No riscv64-specific open issues found |
| bpftool | CLI to inspect/load/pin BPF programs; generates vmlinux.h for CO-RE | Can be built from source; no standalone package | No dedicated riscv64 test run | Not packaged standalone for riscv64 in Debian Trixie | No LLVM disassembly limitation; falls back to libbfd/libopcodes |
| Clang/LLVM | Required to compile BPF programs; required by bpftrace | Builds (Debian Trixie riscv64: llvm-toolchain-19 v19.1.7-3 Installed) | CI x86_64 only | Available in Debian Trixie | DWARF stack unwinding (`HAVE_DW_UNWIND`) requires x86_64 -- unavailable on riscv64 |
| elfutils / libelf | ELF parsing (libelf) and DWARF access (libdw); required by libbpf, bpftool, bpftrace | Builds (Debian Trixie riscv64: elfutils v0.192-4 Installed) | Not riscv64-specific tested upstream | Available in Debian Trixie | None specific to riscv64 |
| pahole (dwarves) | Converts DWARF to BTF; required for `CONFIG_DEBUG_INFO_BTF=y` and CO-RE | Builds (Debian Trixie riscv64: dwarves v1.30-1 Installed; meets >= 1.22 requirement) | No riscv64-specific flag | Available in Debian Trixie | None specific to riscv64 |
| iproute2 (tc BPF) | Attaches BPF programs as tc classifiers/actions | Builds (Debian Trixie riscv64: v6.15.0-1 Installed) | No riscv64-specific test lane | Available in Debian Trixie | None specific to riscv64 |
| bpftrace | High-level tracing language over BPF | Builds (Debian Trixie riscv64: v0.23.2-1 Installed) | CI x86_64 only; packaged but untested upstream | Available in Debian Trixie; FTBFS on Arch RISC-V port | DWARF-based userspace stack unwinding (`HAVE_DW_UNWIND`) unavailable on riscv64. Arch RISC-V port FTBFS. |
| zlib | Compression; required by libbpf, bpftool, bpftrace | Available | N/A | Available | None |
| libcap | Capability checking; optional in bpftool | Available | N/A | Available | None |

---

## 10. Ecosystem Status

### 10.1 iovisor/bcc

bcc is the BPF Compiler Collection, providing Python/Lua frontends for BPF programs. riscv64-relevant changes in bcc:

| Issue/PR | Date | Status | Summary |
|---|---|---|---|
| [#5492](https://github.com/iovisor/bcc/issues/5492) | 2026-03-11 | Open | USDT probe test failures on riscv64 Yocto builds. Root cause: `FOLLY_SDT` macro in `StaticTracepoint.h` lacks riscv64 architecture definitions. Seven BCC tests fail. No fix or assignee. |
| [#5490](https://github.com/iovisor/bcc/pull/5490) | 2026-03-31 | Merged | Add riscv syscall prefix detection in C++ API |
| [#5264](https://github.com/iovisor/bcc/pull/5264) | 2025-04-03 | Merged | libbpf-tools: Fix incorrect syscall name (includes riscv) |
| [#5068](https://github.com/iovisor/bcc/pull/5068) | 2024-07-28 | Merged | Fix get_syscall_prefix on riscv for linux-6.6 |
| [#4637](https://github.com/iovisor/bcc/pull/4637) | 2023-06-21 | Merged | syscount: Add syscall lookup table for arm64 and riscv |
| [#4287](https://github.com/iovisor/bcc/pull/4287) | 2022-10-27 | Merged | Fix libbpf tools for riscv |

The open issue #5492 (USDT probe failures) has no owner and no fix as of the research date. This is a tooling gap that affects any riscv64 USDT-based tracing workflow using bcc.

### 10.2 bpftrace

| PR | Date | Status | Summary |
|---|---|---|---|
| [#3267](https://github.com/bpftrace/bpftrace/pull/3267) | 2024-06-24 | Merged | Fix include path on loongarch, mips, riscv, and s390 |
| [#3299](https://github.com/bpftrace/bpftrace/pull/3299) | 2024-07-15 | Merged | Fix compiler error: unrecognized option `-mno-omit-leaf-frame-pointer` on riscv |

No open riscv64-specific bpftrace issues exist as of the research date. bpftrace is packaged for riscv64 on Debian Trixie and Ubuntu Noble and builds successfully, with the noted exception of the Arch Linux RISC-V port FTBFS.

### 10.3 libbpf

libbpf periodic kernel sync PRs that included riscv-related upstream changes:

| PR | Date | Status |
|---|---|---|
| [libbpf/libbpf #946](https://github.com/libbpf/libbpf/pull/946) | 2026-02-11 | Merged |
| [libbpf/libbpf #940](https://github.com/libbpf/libbpf/pull/940) | 2026-01-29 | Merged |

No riscv-specific bug reports exist in the libbpf or bpftool issue trackers.

### 10.4 Performance Data

No public head-to-head performance benchmarks comparing eBPF JIT execution on riscv64 against x86_64 or arm64 exist in any accessible published source (RISE blog, eBPF Foundation, Phoronix, academic papers, or GitHub repositories searched as of June 2026).

The only quantitative per-architecture JIT numbers found in the research come from inline benchmark data in individual kernel patches:

- **`bpf_get_current_task()` inlining** (Varun R Mallya, merged 2026-06-02, commit `6d13ddb1d465`): On QEMU RISC-V, before inlining: 173,490 runs/sec (57 ns/call). After inlining (`mv a5, tp`): 320,497 runs/sec (31 ns/call). Delta: +84.7% throughput, -45.6% latency. These numbers are from the patch author's QEMU environment and are not independently verified cross-architecture comparisons.

- **`bpf_get_smp_processor_id()` inlining** (Puranjay Mohan, merged 2024-05-02, commit `2ddec2c80b44`): On QEMU, glob-arr-inc +24%, arr-inc +23.6%, hash-inc +32.2% after inlining to a single `lw a5,32(tp)`.

No system-level benchmarks (XDP packet rates, tc filter throughput, uprobe/kprobe overhead) on riscv64 hardware were found.

The eBPF Foundation's 2025 Year in Review mentions a security audit (Alpha-Omega grant, $228,200) covering x86-64, arm64, and riscv64 JIT compilers, including instruction encoding, register allocation, and immediate value handling. Architecture parity goals in the Foundation's roadmap explicitly target only x86-64 and arm64; riscv64 is not part of those goals.

---

## 11. Known Bugs and Active Issues

### 11.1 Open Patches (Not Merged as of June 2026)

**`lw` vs `ld` for `thread_info.cpu` (Radim Krcmar, Ventana Micro, 2025-08-12)**
State: Awaiting Upstream. Reviewed-by Pu Lehui (2025-08-16). All CI green (x86_64, aarch64, s390x only -- no riscv64 hardware CI). Fixes a correctness bug introduced in commit `19c56d4e5be1`: `emit_ld` (64-bit load) was used to read `thread_info.cpu`, which is a 32-bit `int`. The bug was latent on little-endian due to a struct hole after `cpu`. Fix is a one-line change to `emit_lw`. Companion patch applies the same fix to `bpf_get_smp_processor_id()`. [Patchwork](https://patchwork.kernel.org/project/netdevbpf/patch/20250812090256.757273-3-rkrcmar@ventanamicro.com/)

**`fence.i` for BPF_NOSPEC speculation barrier (Lukas Gerlach, CISPA, 2025-12-28)**
State: Changes Requested. This patch remains stalled. The current RISC-V BPF JIT emits a no-op for `BPF_NOSPEC`, leaving programs without a Spectre v1 mitigation. The proposed fix emits `fence.i` at each `BPF_NOSPEC` site. Key objections (see section 12 for full analysis): (a) `fence.i` only guarantees a retirement barrier, not an issue barrier -- Bo Gan (RISC-V International) formally disputed whether it constitutes an adequate Spectre mitigation; (b) measurable performance overhead on in-order cores (Stefan O'Rear: several thousand cycles per `fence.i` on JH7110 due to full I-cache invalidation); (c) no per-microarchitecture BPF bypass infrastructure on RISC-V yet. [Patchwork](https://patchwork.kernel.org/project/netdevbpf/patch/20251228173753.56767-1-lukas.gerlach@cispa.de/)

**RV32 signed div/mod and 32-bit atomics (Kuan-Wei Chiu, 2026-04-29)**
State: Superseded. The v1 series was superseded due to a memory ordering bug in the atomic operations patch: `aq=0, rl=0` (relaxed) was used for all fetch/xchg operations, but BPF semantics require full ordering for `BPF_FETCH` variants. A corrected v2 has not appeared in the active patchwork listing as of the research date. The underlying bugs are real:
- RV32 JIT treated `BPF_SDIV`/`BPF_SMOD` as unsigned: `-6 / 2` returned `0x7ffffffd` instead of `0xfffffffd`.
- RV32 JIT lacked `BPF_AND`, `BPF_OR`, `BPF_XOR`, `BPF_XCHG` (plus FETCH variants) as native `amo*.w` instructions. [Patchwork](https://patchwork.kernel.org/project/netdevbpf/patch/20260429123513.3477780-2-visitorckw@gmail.com/)

**riscv selftest support for `get_preempt_count()` (Tiezhu Yang, 2026, RFC)**
State: RFC. Selftest gap: the preempt count helper is not available in BPF selftests on RISC-V. No concrete patch landed as of the research date. [NEEDS VERIFICATION: current disposition of this RFC]

### 11.2 Open Tooling Issues

**BCC USDT probe test failures on riscv64 ([iovisor/bcc #5492](https://github.com/iovisor/bcc/issues/5492), 2026-03-11)**
State: Open, no owner. Seven BCC tests fail on riscv64 Yocto builds because `FOLLY_SDT` macro in `StaticTracepoint.h` lacks riscv64 architecture definitions, so USDT probes are not embedded in test binaries. This is a tooling-level gap that blocks any riscv64 workflow relying on USDT probes via bcc.

### 11.3 Recently Fixed Bugs (Merged 2024-2026)

| Commit | Date | Bug Fixed |
|---|---|---|
| `22cc16c04b78` | 2025-12-19 | `BPF_TRAMP_F_ORIG_STACK` used instead of `BPF_TRAMP_F_CALL_ORIG` in trampoline, causing kernel stack overflow on RISC-V. Crash: `Kernel panic - not syncing: Kernel stack overflow`. |
| `fd2e08128944` | 2025-09-15 | Struct ops return values sign-extended as 32-bit values in epilogue, violating RISC-V ABI. Caused kernel panic in `ns_bpf_qdisc` selftest. |
| `8a16586` + `ad5348c` | 2025-08 | `lw` not used when reading `int cpu` in `bpf_get_smp_processor_id` and `BPF_MOV64_PERCPU_REG`. Correctness bug on 64-bit RISC-V with 32-bit int fields. (The second instance, in Radim Krcmar's patch series, is still awaiting merge as of the research date.) |
| `fb7cefabae81` | 2025-08 | Arena atomics for RV64 added (10-patch series). Non-Zacas cmpxchg in arena mode excluded pending extable and loop logic complexity. |
| `20a759df3bba` | 2024-05-05 | RV64 BPF JIT was emitting relaxed (`aq=0, rl=0`) AMOs for `BPF_FETCH` variants and `BPF_XCHG`, violating BPF memory model requirement for full ordering. Fixed to `aq=1, rl=1`. The same review found the same bug in the PowerPC, s390x, and LoongArch BPF JITs. |
| `600605853f87` | 2025-12-30 | `scripts/gen-btf.sh` failed to generate a linkable `.btf.o` when cross-compiling for RISC-V with LLVM. `${KBUILD_CFLAGS}` was not passed to the empty C compilation step. |

---

## 12. Objections and Upstream Blockers

### 12.1 Spectre Mitigation Stall (BPF_NOSPEC)

This is the most technically substantive open issue. The current state: the riscv64 BPF JIT emits nothing for `BPF_NOSPEC`. A patch from Lukas Gerlach (CISPA Helmholtz Center for Information Security) proposes emitting `fence.i`. The patch has been in "Changes Requested" state since January 2026.

The core technical dispute is whether `fence.i` constitutes an adequate Spectre v1 mitigation on RISC-V:

- **RISC-V ISA specification position (Bo Gan):** `fence.i` only guarantees a retirement barrier, not an issue barrier. The ISA specification does not mandate that `fence.i` prevents speculative execution of instructions following it. Bo Gan forwarded this concern to the RISC-V Speculation Barriers Task Group.
- **Stefan O'Rear:** Technically confirmed the retirement-barrier-only guarantee. On JH7110 hardware, `fence.i` invalidates all 512 I-cache lines (several thousand cycles of overhead per invocation).
- **Paul Walmsley:** Supports switchable per-microarchitecture mitigations now rather than waiting for the Task Group ("unlikely to ratify for quite some time... years before entering silicon").
- **Luis Gerhorst:** A retirement barrier still reduces exploit success rate and bandwidth even if not a formal guarantee. Suggested implementing per-microarchitecture bypass infrastructure modeled on PowerPC's `bpf_jit_bypass_spec_v1/v4()`. Raised concern about Zifencei availability (though Samuel Holland confirmed Linux requires it and no Linux-capable RISC-V core omits it).
- **Empirical claim (Gerlach):** `fence.i` prevents Spectre-PHT attacks on SiFive C910/C920 and P550 in practice (drains pipeline). In-order cores (U74, C906) are not vulnerable due to lack of speculation.

The path forward requires: (a) deciding whether to emit `fence.i` unconditionally or only on out-of-order cores, and (b) implementing per-microarchitecture bypass infrastructure analogous to what arm64 has. Neither is currently in progress in an active patch series.

This is a security gap relative to amd64 and arm64. Any RISC-V deployment of eBPF on out-of-order cores (SiFive P550, T-Head C910/C920, ESWIN EIC7700) is running without a Spectre v1 mitigation for BPF programs.

### 12.2 No Automated CI Validation

All RISC-V BPF patches merge after manual review only. There is no riscv64 CI lane in the upstream BPF CI (`kernel-patches/bpf`) or in any associated project (`libbpf`, `bcc`, `bpftrace`, `cilium/ebpf`). This means:

- Regressions specific to riscv64 are not caught automatically.
- The memory ordering bug fixed in commit `20a759df3bba` (relaxed AMOs in BPF FETCH operations) was in the tree from 2022 to 2024 without being detected by CI.
- The `lw`/`ld` correctness bug (Krcmar, still awaiting merge) was also missed by CI.

The BPF selftests infrastructure is ready for riscv64 (`config.riscv64` exists, `DENYLIST.riscv64` is maintained), but no one runs it in CI.

### 12.3 USDT Probe Tooling Gap

BCC issue [#5492](https://github.com/iovisor/bcc/issues/5492) (USDT probe failures on riscv64) has no owner and no fix. This is not a kernel JIT issue; it is a userspace tooling issue in the `FOLLY_SDT` macro definitions. It blocks riscv64 users from using USDT-based tracing via bcc.

### 12.4 RV32 JIT Maintenance Risk

The RV32 JIT is listed under two academic-affiliation maintainers (Luke Nelson and Xi Wang, University of Washington). The current patch activity on RV32 issues (signed div/mod, atomics) is from unaffiliated contributors (Kuan-Wei Chiu). There is no corporate backer for the RV32 JIT. The superseded state of the RV32 fix series suggests reduced review bandwidth.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The riscv64 BPF JIT is production-quality for the majority of eBPF use cases. The core JIT path (networking, tracing, security) works without modification. The gaps that remain (1/2-byte atomics, BPF exceptions, bpf2bpf+tailcall mixing) are either hardware limitations (1/2-byte atomics), newer BPF features not yet ported (exceptions), or known limitations with documented reasons.

The remaining functional work is:

- **Complete the `lw` fix for `thread_info.cpu`** (Krcmar patch, already reviewed): Low effort, rebase and resend.
- **RV32 fix series v2** (signed div/mod + atomics with correct memory ordering): Medium effort (2-3 person-weeks). Unblocked, just needs a v2 submission.
- **bpf2bpf + tail call mixing**: This requires significant JIT rework and is explicitly disabled on arm64 as well in some configurations [NEEDS VERIFICATION: arm64 bpf2bpf+tailcall status]. Non-trivial.
- **BPF exceptions**: Requires implementing exception unwinding infrastructure in the riscv64 JIT. Non-trivial (estimated 4-6 person-weeks minimum based on complexity of the feature in other architectures [NEEDS VERIFICATION: upstream estimate]).
- **BCC USDT riscv64 fix** (add riscv64 to `FOLLY_SDT` definitions): Low effort, 1-2 person-weeks including testing.

### 13.2 Performance Optimization

No public benchmarks exist for riscv64 eBPF performance relative to arm64 or amd64. The inlining work done by Puranjay Mohan and Varun R Mallya (helper inlining: +84.7% for `bpf_get_current_task()`, +23-32% for `bpf_get_smp_processor_id()`) demonstrates that riscv64 benefits significantly from JIT-level optimizations that eliminate helper call overhead.

Additional optimization opportunities identified from source analysis:
- **64-bit immediate encoding**: Currently up to four instructions per 64-bit constant. Instruction sequence could be shortened for common constants.
- **Non-Zacas cmpxchg in arena mode**: Currently unsupported (requires LR/SC loop with complex extable). Implementing this would unblock arena-mode cmpxchg on hardware without the Zacas extension.
- **DWARF stack unwinding in bpftrace**: Requires upstream bpftrace changes and LLVM support. The x86_64 gating is in bpftrace source, not a kernel limitation.

Data not available: Cycle-accurate benchmarks comparing RV64 JIT output quality to arm64/amd64 JIT output for representative BPF programs (XDP, tc, kprobe). This data does not exist in any publicly accessible source and would require a dedicated benchmarking effort on RISC-V hardware.

### 13.3 CI/CD Infrastructure

The absence of riscv64 CI is the single highest-leverage investment target. The infrastructure is ready (selftest config, DENYLIST, QEMU support). What is missing is a runner and integration into the upstream CI matrix.

Adding riscv64 to `kernel-patches/bpf` CI requires:
- A QEMU-based riscv64 runner (no bare metal required; the existing QEMU vmtest infrastructure supports riscv64 with `-M virt`).
- Adding `riscv64` to the `Arch` enum in `.github/scripts/matrix.py` and updating the workflow files.
- Providing a rootfs image (the `mkrootfs_debian.sh` script already supports riscv64 with `--arch riscv64`).
- Aligning with the BPF CI maintainers at `kernel-patches/bpf` to accept the contribution.

This is a self-contained contribution that does not require BPF core maintainer approval beyond CI configuration review. It is the highest-priority item for ecosystem health because it prevents silent regressions.

### 13.4 Ecosystem Enablement

The Spectre mitigation gap is a correctness-affecting issue for production eBPF deployments on out-of-order RISC-V cores. Resolving it requires:
1. Reaching consensus with the RISC-V Speculation Barriers Task Group on the right primitive (or accepting that `fence.i` is sufficient pending a formal solution).
2. Implementing per-microarchitecture bypass infrastructure in the RISC-V BPF JIT, analogous to arm64's `cpufeature`-based mitigation selection.
3. Defining which RISC-V microarchitectures are out-of-order and therefore require the mitigation.

This is a 4-8 person-week effort depending on the degree of per-uarch infrastructure built. It requires coordination with RISC-V International and RISC-V SoC vendors.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Add riscv64 to kernel-patches/bpf CI matrix (QEMU-based) | 2 | Qualcomm or upstream BPF maintainers | Critical |
| Functional | Merge pending `lw` fix for `thread_info.cpu` (Krcmar patch) | 0.5 | Pu Lehui / Puranjay Mohan | High |
| Functional | RV32 fix series v2: signed div/mod + full 32-bit atomics with correct ordering | 3 | Kuan-Wei Chiu or Qualcomm | High |
| Ecosystem | Fix BCC USDT riscv64 failures (FOLLY_SDT macro, issue #5492) | 1.5 | Qualcomm or BCC maintainers | High |
| Security | BPF_NOSPEC Spectre mitigation: per-uarch bypass infrastructure + fence.i (or ISA-sanctioned barrier) | 6 | Qualcomm + RISC-V Speculation Barriers TG coordination | High |
| Performance | Establish riscv64 eBPF performance baseline vs arm64/amd64 (benchmarking on RISC-V hardware) | 3 | Qualcomm | Medium |
| Functional | BPF exceptions support in riscv64 JIT | 5 | Qualcomm or upstream | Medium |
| Performance | 64-bit immediate encoding optimization | 2 | Qualcomm or Intel (Topel/Wang) | Medium |
| Performance | DWARF stack unwinding for bpftrace on riscv64 | 4 | Qualcomm + bpftrace maintainers | Low |
| Functional | bpf2bpf + tail call mixing in riscv64 JIT | 8 | Qualcomm or upstream | Low |
| Functional | Arena-mode cmpxchg without Zacas (LR/SC loop with extable) | 4 | Qualcomm or Pu Lehui | Low |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Linux kernel BPF source: arch/riscv/net/](https://github.com/torvalds/linux/tree/master/arch/riscv/net)
- [bpf_jit_comp64.c (RV64 JIT)](https://github.com/torvalds/linux/blob/master/arch/riscv/net/bpf_jit_comp64.c)
- [bpf_jit_comp32.c (RV32 JIT)](https://github.com/torvalds/linux/blob/master/arch/riscv/net/bpf_jit_comp32.c)
- [DENYLIST.riscv64](https://github.com/torvalds/linux/blob/master/tools/testing/selftests/bpf/DENYLIST.riscv64)
- [config.riscv64](https://github.com/torvalds/linux/blob/master/tools/testing/selftests/bpf/config.riscv64)
- [kernel-patches/bpf CI matrix.py](https://raw.githubusercontent.com/kernel-patches/bpf/master/.github/scripts/matrix.py)
- [Linux kernel BPF patchwork (RISC-V patches)](https://patchwork.kernel.org/project/netdevbpf/list/?q=riscv&archive=both&state=*)
- [MAINTAINERS: Add Pu Lehui and Puranjay as riscv64 reviewers (commit 76cd338994778c)](https://patchwork.kernel.org/project/netdevbpf/patch/20240405123352.2852393-1-bjorn@kernel.org/)
- [BPF arena atomics for RV64 (commit fb7cefabae81)](https://patchwork.kernel.org/project/netdevbpf/patch/20250719091730.2660197-10-pulehui@huaweicloud.com/)
- [fence.i for BPF_NOSPEC -- Changes Requested](https://patchwork.kernel.org/project/netdevbpf/patch/20251228173753.56767-1-lukas.gerlach@cispa.de/)
- [Fix lw for int cpu (Radim Krcmar, Awaiting Upstream)](https://patchwork.kernel.org/project/netdevbpf/patch/20250812090256.757273-3-rkrcmar@ventanamicro.com/)
- [Inline bpf_get_current_task() for RV64 (commit 6d13ddb1d465)](https://patchwork.kernel.org/project/netdevbpf/patch/20260602205847.102825-3-varunrmallya@gmail.com/)
- [RV32 signed div/mod and atomics fix (Superseded)](https://patchwork.kernel.org/project/netdevbpf/patch/20260429123513.3477780-2-visitorckw@gmail.com/)
- [Atomic memory ordering fix for RV64 (commit 20a759df3bba)](https://patchwork.kernel.org/project/netdevbpf/patch/20240505201633.123115-1-puranjay@kernel.org/)
- [BCC issue #5492: USDT probe failures on riscv64](https://github.com/iovisor/bcc/issues/5492)
- [bpftrace PR #3267: Fix include path on riscv](https://github.com/bpftrace/bpftrace/pull/3267)
- [libbpf/libbpf build workflow (no riscv64)](https://raw.githubusercontent.com/libbpf/libbpf/master/.github/workflows/build.yml)
- [eBPF Foundation governing charter](https://ebpf.foundation/)
- [RISE Project blog](https://riseproject.dev/blog)
- [Ubuntu packages -- bpftrace riscv64](https://packages.ubuntu.com/noble/bpftrace)
- [Arch Linux RISC-V port status](https://archriscv.felixc.at/)
- [Syzbot riscv64 CI instance](https://syzkaller.appspot.com/upstream)