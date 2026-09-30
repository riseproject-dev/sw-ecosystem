---
title: eBPF
parent: Project Reports
color: yellow
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: critical
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: dwarves
    relation: build-dependency
    criticality: critical
  - name: elfutils
    relation: runtime-dependency
    criticality: critical
  - name: libbpf
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: libcap
    relation: runtime-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="ebpf" %}

# eBPF

**Author:** Ludovic HENRY <mail@ludovic.dev><br/>
**Date:** 2026-09-30<br/>
**Readiness:** yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for eBPF<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION]. Where sources disagree, both are cited and the discrepancy is noted explicitly.<br/>

## 1. Project Overview

eBPF is a Linux kernel subsystem and associated userspace toolchain that lets sandboxed programs run inside the kernel without modifying kernel source or loading modules. Primary use cases are observability (tracing, profiling), networking (XDP, tc BPF) and security (LSM hooks, seccomp). eBPF is not a standalone application; it ships as an in-tree kernel subsystem plus a set of userspace libraries and tools (libbpf, bpftool, bpftrace, bcc).

**Repository:** [git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git) (mirrored at [github.com/torvalds/linux](https://github.com/torvalds/linux); direct fetches to git.kernel.org are blocked by an Anubis anti-bot wall / return HTTP 403 in this environment, so verification below relies on the GitHub mirror and on `raw.githubusercontent.com` where noted)<br/>
**Homepage:** [ebpf.io](https://ebpf.io/)<br/>
**Governance:** The [eBPF Foundation](https://ebpf.foundation/), a Directed Fund under the Linux Foundation, launched 2021-08-12. Founding members: Meta (Facebook), Google, Isovalent, Microsoft, and Netflix, per the [Linux Foundation launch press release](https://www.linuxfoundation.org/press/press-release/facebook-google-isovalent-microsoft-and-netflix-launch-ebpf-foundation-as-part-of-the-linux-foundation). Meta later upgraded to Platinum membership, Toyota joined as a Silver member, and Netflix's Anjali Kanak was elected Board Treasurer, per the [Foundation's growth announcement](https://www.linuxfoundation.org/press/ebpf-foundation-accelerates-growth-with-meta-toyota-membership-and-new-strategic-board-leadership). Membership tiers are Platinum ($70K/year, $50K for existing LF members, one board seat) and Silver ($5K-$30K by company size, one board seat per five Silver members); no separate "Gold" tier exists, per the [Foundation's membership page](https://ebpf.foundation/become-a-member/). [NEEDS VERIFICATION: whether CrowdStrike, Datadog and Intel currently hold Platinum/Silver seats as previously reported could not be re-confirmed this cycle; Microsoft's founding membership, absent from earlier tracking, is now confirmed directly from the Linux Foundation press release.]<br/>
**Governance bodies:** a Governing Board (member-company voting reps), a Marketing Committee, and the eBPF Steering Committee (BSC), the technical, consensus-driven body that sets technical direction and requires two-thirds approval for new members, capped at two seats per employer. Confirmed active BSC members include Daniel Borkmann (Isovalent/Cisco, eBPF co-creator) and KP Singh (Google, eBPF LSM maintainer), per [ebpf.foundation/bsc](https://ebpf.foundation/bsc/). Alan Jowett (Microsoft), Brendan Gregg (Intel) and Joe Stringer (Isovalent) are also reported BSC participants [NEEDS VERIFICATION: not independently re-confirmed this cycle].<br/>

**Kernel BPF subsystem maintainers:** Alexei Starovoitov (Meta) and Daniel Borkmann (Isovalent, now effectively Cisco following Cisco's 2023/2024 acquisition of Isovalent) are the core BPF subsystem co-creators/maintainers across both `bpf.git` (fixes) and `bpf-next.git` (development). Andrii Nakryiko (Meta) is a primary co-maintainer. Eduard Zingerman and Kumar Kartikeya Dwivedi serve as additional core maintainers/reviewers.

**RISC-V involvement:** RISE Project (the RISC-V Software Ecosystem consortium) has not funded or contributed to the Linux kernel eBPF/BPF-JIT subsystem itself. A full scan of the RISE blog (35-36 posts, May 2024 through September 2026, enumerated via WordPress sitemap and the site's own search) found zero posts mentioning eBPF or BPF. A search of the `riseproject-dev` GitHub organization (26 repositories confirmed via the GitHub search API; the org's public repo-list page claims "52 repositories" but that count could not be independently confirmed) found no repository dedicated to eBPF. There is one confirmed, narrower touchpoint: `riseproject-dev/python-wheels` PR [#2119](https://github.com/riseproject-dev/python-wheels/pull/2119) ("mitmproxy-linux: Add version 0.12.11", author luhenry) packages a riscv64 wheel for `mitmproxy-linux`, whose redirector binary embeds a small `cgroup/sock_create` eBPF program. Because `bpf-linker` needs LLVM shared libraries riscv64 toolchains do not ship, the workflow cross-compiles that eBPF object (architecture-independent BPF bytecode, targeting `bpfel-unknown-none`) on `ubuntu-latest` and embeds it when the wheel is natively built and tested on the RISE RISC-V Runner (`runs-on: ubuntu-24.04-riscv`). This is downstream packaging/CI work that ships an eBPF-carrying binary for riscv64; it is not RISE funding of the kernel eBPF port, RISC-V JIT development, or eBPF Foundation membership.

---

## 2. Port History and Upstreaming Timeline

The foundational riscv64 (RV64G) BPF JIT was introduced by commit [`2353ecc6f91fd15b893fa01bf85a1c7a823ee4f2`](https://github.com/torvalds/linux/commit/2353ecc6f91fd15b893fa01bf85a1c7a823ee4f2), "bpf, riscv: add BPF JIT for RV64G," authored by Bjorn Topel and committed by Daniel Borkmann. It implemented a two-pass JIT with dynamic prologue/epilogue (modeled on the MIPS64 JIT), passing 378/378 `test_bpf` module tests and 761/1268 `test_verifier` cases (2 failures and hundreds of skips tied to a known far-branch limitation beyond 4KB). At the time of the original commit Topel was at Intel; he is currently at Rivos, which Meta acquired in October 2025 (per [The Next Platform](https://www.nextplatform.com/compute/2025/10/02/meta-buys-rivos-to-accelerate-compute-engine-engineering/1642477)), so his affiliation should now be read as Meta (via Rivos), not Intel.

**Note on the exact merge release:** sources disagree on which mainline version first shipped the RV64G JIT. One cross-check in this research pass pinned it to Linux 5.7; an unrelated third-party project (`12345qwert123456/k3s.RISC-V`) states the riscv64 eBPF JIT was "mainlined around Linux 5.19+." Neither claim was independently verified against a kernel release changelog in this session. Only the commit SHA and author/committer are independently confirmed. Treat the exact release number as [NEEDS VERIFICATION].

The RV32G JIT followed via a v4/v5 patch series by Luke Nelson (University of Washington), posted as an RFC in June 2019 and merged into bpf-next in March 2020 ([cover letter](https://patchwork.kernel.org/project/linux-riscv/patch/20200305050207.4159-1-luke.r.nels@gmail.com/)). It adapted the RV64 and 32-bit ARM JITs, mapping 64-bit BPF registers onto pairs of 32-bit RV32 registers, and shares a later-factored-out `bpf_jit_core.c` with the RV64 backend. ALU64 DIV/MOD and 64-bit atomics (`BPF_XADD|BPF_DW`) were unsupported at merge, as on other 32-bit BPF JITs (e.g. ARM32). Test results at merge: 378/378 `test_bpf` (349/366 JIT-compiled), 1415/1580 `test_verifier` passing (122 skipped, 43 failed).

Key milestones since then:

| Date | Event | Author | Affiliation |
|---|---|---|---|
| ~2019 | First RV64G BPF JIT merged (commit `2353ecc6f91f`) | Bjorn Topel | Intel (now Meta via Rivos) |
| 2020-03 | RV32 JIT merged; shared core factored into `bpf_jit_core.c` | Luke Nelson | Univ. of Washington |
| 2021-10-27 | BPF exception tables (BPF_PROBE_MEM fault recovery) merged to bpf-next | Tong Tiangen | Huawei |
| 2022-2023 | Atomics, USDT arg parsing, trampolines, kfunc support, signed div/mod, unconditional bswap | Pu Lehui | Huawei |
| 2024-03 | kCFI + BPF support | Puranjay Mohan | Amazon (AWS) |
| 2024-04 | BPF Arena / PROBE_MEM32 / addr_space_cast; Pu Lehui and Puranjay Mohan added to MAINTAINERS as riscv64 reviewers | Puranjay Mohan, Bjorn Topel | Amazon, Intel |
| 2024-05 | Helper inlining (`bpf_get_smp_processor_id`); atomic memory-ordering fix (relaxed AMOs corrected to full-order for BPF_FETCH) | Puranjay Mohan | Amazon |
| 2024-05 | Zba/Zbb extension optimizations (shift-add, bswap, zextw) | Xiao Wang | Intel |
| 2025-07 | Arena atomics for RV64 via Zacas | Pu Lehui | Huawei |
| 2025-10-28 | CVE-2025-40079 disclosed and fixed (struct_ops return-value sign extension) | (fix authored per kernel commit; CVE record via MITRE) | - |
| 2025-12/2026-01 | Trampoline stack-overflow flag-check fix (`BPF_TRAMP_F_ORIG_STACK` vs `BPF_TRAMP_F_CALL_ORIG`) | Menglong Dong (per live verification) | China Telecom |
| 2026-06-29 to 2026-07-21 | "Mixing bpf2bpf and tailcalls for RV64" (v4-v6) merged to bpf-next | Pu Lehui | Huawei |
| 2026-07-21 | Arena atomic load_acquire: missing exception handler + info-leak fix merged to bpf-next | Feng Jiang | - |
| 2026-08-13 to 2026-09-05+ | "Add BPF stack arguments support for RV64 JIT" (v2-v5), still under review; refactor taken over by Pu Lehui | Feng Jiang, Pu Lehui | Huawei |
| 2026-09-15 | "riscv: patch: fix handling of bpf-jit execmem addresses" posted (`patch_map()`/`CONFIG_STRICT_MODULE_RWX` fix) | Wei-Jie Hung | - |
| Ongoing | "riscv, bpf: Prepare for upcoming daily CI" (unmerged PRs #14152/#14169/#14171) | - | - |

**Discrepancy on the trampoline stack-overflow fix:** one source pins this fix to commit `22cc16c04b78`, merged 2025-12-19; a second, independently fetched source pins the same defect (wrong `BPF_TRAMP_F_ORIG_STACK`/`BPF_TRAMP_F_CALL_ORIG` check) to commit `8f3e00af8e52`, merged 2026-01-06, authored by Menglong Dong. Both describe the same bug class in `arch/riscv/net/bpf_jit_comp64.c`; the exact commit hash and merge date are [NEEDS VERIFICATION].

The riscv64 BPF JIT has been upstream continuously since its initial merge and has not required a fork or out-of-tree carry at any point.

---

## 3. Upstream Support Tier

The Linux kernel MAINTAINERS file carries two separate entries for RISC-V BPF JITs:

- **BPF JIT for RISC-V (64-bit)** (`arch/riscv/net/`, excluding `bpf_jit_comp32.c`): Maintainer Bjorn Topel; Reviewers Pu Lehui (Huawei) and Puranjay Mohan (Amazon). Status: **Maintained**. Pu Lehui has additionally been proposed as co-maintainer (kernel-patches/bpf PR [#14174](https://github.com/kernel-patches/bpf/pull/14174)), citing a multi-year maintainer-response gap on the RV32 side.
- **BPF JIT for RISC-V (32-bit)**: Maintainers Luke Nelson and Xi Wang (University of Washington at time of authorship). Status: **Maintained**.

"Maintained" means patches are accepted and reviewed with no formal SLA, unlike "Supported," which implies a named vendor commitment (e.g., IBM for s390x). The RV64 JIT has de-facto commercial backing (Intel/Meta via Topel, Huawei via Pu Lehui, Amazon via Puranjay Mohan) without a formal "Supported" designation.

There is no documented formal tier policy (no Rust-style Tier 1/2/3 scheme) gating new BPF JIT architecture ports in the eBPF Foundation charter or BSC governance documents. The practical bar cleared by riscv64 in 2019-2020 was: correct instruction encoding, passing `test_bpf`/`test_verifier`, a named MAINTAINERS entry, and ongoing patch responsiveness.

**Decisive upstream-gate finding:** the authoritative automated BPF CI, `kernel-patches/bpf`, defines its architecture matrix in `.github/scripts/matrix.py` as an `Arch` enum containing only `AARCH64`, `S390X`, and `X86_64`. No `RISCV64` member exists, and the matrix-building `__main__` block instantiates build configs only for those three architectures. This was independently confirmed twice in this research pass, including by direct clone-and-grep of the repository (`grep -ril riscv .github/` returned zero matches across all 14 workflow files and scripts). Open PRs titled "riscv, bpf: Prepare for upcoming daily CI" (#14152, #14169, #14171) would add riscv64 to this matrix but are not merged as of 2026-09-30. Until they land, there is no upstream-automated build or test gate for riscv64, and the "Maintained" tier for the RV64/RV32 JITs is not backed by CI enforcement, per [The New Stack's assessment](https://thenewstack.io/the-risc-architecture-frontier-is-ebpf-ready-for-arm64-and-risc-v/) that RISC-V remains a "frontier" architecture relative to arm64's production parity (arm64 BPF JIT default since Linux v5.6, driven by cloud adoption).

| Architecture | CI-gated | Release-blocking | Official/distro binaries |
|---|---|---|---|
| amd64/x86_64 | Yes (kernel-patches/bpf matrix) | Yes | Yes (all distros, kernel.org) |
| arm64/aarch64 | Yes (kernel-patches/bpf matrix) | Yes | Yes (all distros, kernel.org) |
| s390x | Yes (kernel-patches/bpf matrix) | No | Yes (major distros) |
| riscv64 | No (matrix.py has no RISCV64 entry; PRs pending) | No | Yes, via distro (Debian/Ubuntu) rebuild of unmodified upstream source; not an upstream-published artifact |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Source File Inventory

All riscv64 eBPF JIT code lives in `arch/riscv/net/`:

- **`bpf_jit.h`**: shared header for RV32 and RV64 backends. RISC-V register enum, R/I/S/B/U/J-type instruction encoders, RVC (compressed) helpers, AMO instruction encoder `rv_amo_insn()`, `rv_ext_enabled()` gating Zba/Zbb/Zacas at runtime.
- **`bpf_jit_comp64.c`**: the RV64G JIT. Register map (`regmap[]`), `ex_handler_bpf()` for probe-memory fault recovery, full `bpf_jit_emit_insn()` opcode coverage, `arch_prepare_bpf_trampoline()`, capability hooks (`bpf_jit_supports_arena`, `_kfunc_call`, `_ptr_xchg`, `_percpu_insn`, `_subprog_tailcalls`, `_timed_may_goto`), all returning true (arena conditional on `system_has_cmpxchg128()`).
- **`bpf_jit_comp32.c`**: the RV32G JIT, prologue/epilogue plus 32-bit-register-pair emulation of 64-bit ALU ops.
- **`bpf_jit_core.c`**: shared convergence loop (up to 32 passes), `bpf_arch_text_copy()`/`bpf_arch_text_invalidate()`/`bpf_jit_free()`, RW/RX buffer separation via `bpf_jit_binary_pack_alloc`.
- **`bpf_timed_may_goto.S`**: RISC-V assembly implementing the timed `may_goto` BPF helper trampoline.

Related files: `arch/riscv/include/asm/extable.h` (declares `ex_handler_bpf()` gated on `CONFIG_BPF_JIT && CONFIG_ARCH_RV64I`), `arch/riscv/mm/extable.c` (`fixup_exception()` dispatches `EX_TYPE_BPF`), `arch/riscv/include/uapi/asm/bpf_perf_event.h`, and `arch/riscv/Kconfig` (`select HAVE_EBPF_JIT if MMU` - nommu riscv64 kernels cannot enable the JIT and fall back to the interpreter).

### 4.2 Register Mapping and Extension Gating

BPF R6-R9 and the AX scratch register map to RISC-V callee-saved registers S1-S5; BPF R0 maps to A5, with explicit ABI bridging at call boundaries against RISC-V's A0 return register. `rv_ext_enabled()` gates runtime use of:
- **Zba**: shift-add optimization (`add.uw`, `sh1add`/`sh2add`/`sh3add`)
- **Zbb**: bit manipulation (`rev8`/`orc.b` for bswap, `zext.w`)
- **Zacas**: single-instruction compare-and-swap (`amocas.{w,d,q}`), used for `BPF_CMPXCHG` in arena mode; falls back to an LR/SC loop when unavailable

No V-extension (RVV)/SIMD dispatch exists anywhere in the BPF JIT; the architecture-specific work is entirely JIT codegen (register allocation, instruction emission, CFI/Spectre-adjacent mitigations), not vector/SIMD selection.

### 4.3 Verified JIT Completeness (direct source inspection)

A direct read of `bpf_jit_comp64.c`, `bpf_jit_core.c` and `bpf_jit.h` (not mailing-list metadata) confirms the RV64 JIT is a mature, production-grade implementation on par with x86-64/arm64, not a stub:

| Component | Rating | Evidence |
|---|---|---|
| ALU64/ALU32 (full op set) | Full | All ops in `bpf_jit_emit_insn()` |
| Conditional/unconditional jumps | Full | Full signed/unsigned compare set |
| Far branches (>4KB) | Full | `emit_branch()` handles 13-bit branch, 21-bit JAL, and 32-bit auipc+jalr fallback - the one known gap in the 2019 original JIT has since closed |
| Tail calls | Full | `emit_bpf_tail_call()` with TCC bounds checking |
| BPF-to-BPF calls mixed with tail calls | Full | `BPF_PSEUDO_CALL` with TCC save/restore, reflecting the Pu Lehui v4-v6 series merged to bpf-next 2026-07-21 |
| Atomics (4/8-byte, incl. FETCH/XCHG/CMPXCHG) | Full | Native AMO; CMPXCHG uses `amocas` via Zacas when available, LR/SC loop otherwise |
| Atomics (1/2-byte) | Missing | No RISC-V hardware AMO for byte/halfword widths; a hardware limitation shared with arm64 [NEEDS VERIFICATION: arm64 exact status] |
| BPF_PROBE_MEM fault recovery (exception tables) | Full | `add_exception_handler()` + `ex_handler_bpf()`, merged 2021 |
| BPF exceptions (`bpf_throw`/exception scopes) | Missing | Explicitly excluded via `DENYLIST.riscv64` |
| Trampolines (fentry/fexit/fmod_ret, 12-arg) | Full | `arch_prepare_bpf_trampoline()` is a complete implementation |
| BPF stack arguments (>5 args, RV64) | In review | v2-v5 posted Aug-Sep 2026, not yet merged; Pu Lehui took over the refactor |
| Struct ops return-value handling | Full (fixed) | CVE-2025-40079 fix landed; see section 11 |
| BPF Arena (PROBE_MEM32, addr_space_cast, arena atomics) | Full | `bpf_jit_supports_arena()` true |
| Helper inlining (`bpf_get_smp_processor_id`, `bpf_get_current_task[_btf]`, `bpf_kptr_xchg`) | Full | Single-instruction inlines |
| kCFI | Full | Merged 2024-03 |
| BPF_NOSPEC (Spectre v1) | Missing | No-op; mitigation patch stalled since Dec 2025/Jan 2026, see section 12.1 |
| cBPF JIT (classic BPF) | Missing | Kernel's own "Feature status on riscv architecture" doc marks this "TODO"; never implemented for riscv |

RV32 JIT (secondary interest): full 32-bit ALU including div/mod; 64-bit ALU DIV/MOD unsupported (`-EFAULT`); atomics limited (only 32-bit `BPF_ADD` confirmed as of the research date, a fuller series by Kuan-Wei Chiu was superseded over a memory-ordering bug and a v2 has not landed); no trampoline support.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| eBPF JIT | Full | Full | Full (RV64), reduced (RV32) |
| Far branches | Full | Full | Full |
| bpf2bpf + tailcall mixing | Full | Full | Full (merged 2026-07-21) |
| BPF exceptions | Full | Full | Missing |
| 1/2-byte atomics | Full | Missing [NEEDS VERIFICATION] | Missing (hardware limitation) |
| BPF_NOSPEC | `lfence` | `csdb`-equivalent | No-op (stalled patch) |
| SIMD/vector dispatch in JIT | N/A (scalar codegen) | N/A | N/A (no RVV use) |

---

## 5. Build System, Cross-Compilation, and Toolchain

### 5.1 Build System

eBPF is built with the Linux Kbuild/Makefile system; there is no CMake or `./configure` anywhere in the kernel tree, and no Dockerfile exists in `torvalds/linux` or in the upstream BPF CI repo `kernel-patches/bpf` (confirmed via GitHub code search: `filename:Dockerfile repo:torvalds/linux` and `filename:Dockerfile repo:kernel-patches/bpf` both return zero results). The only Dockerfile found in the adjacent `libbpf/ci` repo targets an unrelated s390x self-hosted Actions runner. `arch/riscv/net/Makefile`:

```makefile
obj-$(CONFIG_BPF_JIT) += bpf_jit_core.o

ifeq ($(CONFIG_ARCH_RV64I),y)
	obj-$(CONFIG_BPF_JIT) += bpf_jit_comp64.o bpf_timed_may_goto.o
else
	obj-$(CONFIG_BPF_JIT) += bpf_jit_comp32.o
endif
```

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

The selftests Makefile selects LLD as the linker for both x86 and riscv (`ifeq ($(SRCARCH),$(filter $(SRCARCH),x86 riscv))`), and `get_sys_includes` greps the compiler for `__riscv_xlen` to inject `-D__riscv_xlen=<value> -D__BITS_PER_LONG=<value>` during BPF object compilation.

### 5.3 Toolchain Requirements and Why

From `scripts/min-tool-version.sh` (kernel-wide floors, no riscv64-specific override):

| Tool | Minimum | Notes |
|---|---|---|
| GCC | 8.1.0 | General kernel-wide floor |
| Clang/LLVM | 17.0.1 | General kernel-wide floor |
| Binutils | 2.30.0 | General kernel-wide floor |
| pahole (dwarves) | 1.22 functional floor per `Documentation/process/changes.rst`; 1.26 listed as the maintained minimum in the same doc | Required for `CONFIG_DEBUG_INFO_BTF=y` and CO-RE |
| GNU make | 4.0 | Kernel-wide |

riscv64-specific toolchain feature gates (from `arch/riscv/Kconfig`, not `min-tool-version.sh`):

| Constraint | Condition |
|---|---|
| `TOOLCHAIN_NEEDS_OLD_ISA_SPEC=y` | GCC < 11.3.0 |
| `TOOLCHAIN_HAS_V` (vector ext) | Binutils >= 2.38 |
| `TOOLCHAIN_HAS_ZBB/ZBA/ZBC/ZBKB` | Binutils >= 2.39 |
| `TOOLCHAIN_NEEDS_EXPLICIT_ZICSR_ZIFENCEI` | GNU as >= 2.36 |
| `GCC_ASM_GOTO_OUTPUT_BROKEN` | GCC < 11.5, or 12.x < 12.4, or 13.x < 13.3 |

Practical recommendation: GCC >= 12.4.0/13.3.0 to avoid the asm-goto-output bug; Clang >= 17.0.1 kernel-wide, with BPF Arena ASAN reportedly requiring LLVM >= 22 [NEEDS VERIFICATION, single source]. `libbpf/ci` infrastructure pins LLVM 21 and GCC 15.

### 5.4 QEMU Usage

`tools/testing/selftests/bpf/vmtest.sh` has explicit riscv64 platform handling: binary `qemu-system-riscv64`, arch id `riscv`, kernel image `arch/riscv/boot/Image`, console `ttyS0,115200`, a `config.riscv64` config fragment, and a `CROSS_COMPILE` requirement check. Minimum QEMU version is 7.2.0, stated explicitly in the script. CI-mode invocation has recently changed in unmerged upstream work: the older flag set was `-M virt -cpu rv64,sscofpmf=true -smp 8 -m 4G`; PRs #14152/#14169/#14171 ("prepare for upcoming daily CI") update this to `-cpu max,sscofpmf=false`, because the kernel/toolchain combination requires newer ISA extensions than the baseline `rv64` QEMU CPU model provides and `vmtest.sh` was observed panicking on boot under the old flags. Separately, `perf_event_open`-related BPF selftests fail under QEMU due to riscv64 PMU emulation gaps; the documented workaround is disabling the `sscofpmf` extension.

### 5.5 riscv64 Kernel Config Fragment and Denylist

`tools/testing/selftests/bpf/config.riscv64` provides 83 config options, including `CONFIG_RISCV_EFFICIENT_UNALIGNED_ACCESS=y`, `CONFIG_RISCV_ISA_C=y`, `CONFIG_RISCV_PMU_SBI=y`, `CONFIG_SOC_VIRT=y`, `CONFIG_BPF_JIT_ALWAYS_ON=y`, `CONFIG_NONPORTABLE=y`. `tools/testing/selftests/bpf/DENYLIST.riscv64` currently excludes `exceptions`; in-flight patches in the daily-CI-prep series add/remove entries such as `probe_user` and `stacktrace_build_id`, and are expected to drop the `exceptions` entry once JIT exception support lands, and already drop the tailcall-selftest entries now that bpf2bpf+tailcall mixing is merged.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | Status | Notes |
|---|---|---|
| ALU ops (32/64-bit) | Full | Zbb used for bswap, Zba for shift-add |
| Memory ops (all widths, PROBE_MEM/MEMSX/MEM32) | Full | |
| Conditional jumps (full BPF_JMP/JMP32 set) | Full | |
| Atomics 4/8-byte | Full | Native AMO; Zacas CAS when available |
| Atomics 1/2-byte | Missing | Hardware limitation, not riscv64-specific |
| Tail calls | Full | |
| bpf2bpf + tailcall mixing | Full (merged 2026-07-21) | Prior gap now closed |
| BPF exceptions (throw/exception scope) | Missing | Excluded via DENYLIST.riscv64 |
| Trampolines (fentry/fexit/fmod_ret, 12-arg) | Full | |
| Struct ops | Full (fixed) | CVE-2025-40079 resolved |
| BPF Arena | Full | |
| Helper inlining | Full | |
| kfunc calls, incl. stack-passed args | Partial | Under-5-arg path full; >5-arg stack-args series in review, not yet merged |
| Speculation barrier (BPF_NOSPEC) | Missing | No-op; patch stalled since Dec 2025/Jan 2026 |
| kCFI | Full | |
| cBPF JIT | Missing | Kernel's own status doc: "TODO" |
| DWARF userspace stack unwinding (bpftrace) | Missing | `HAVE_DW_UNWIND` gated to x86_64 in bpftrace source |

**Functional gaps relative to amd64/arm64:** BPF exceptions and the 1/2-byte atomic gap (the latter shared with most non-x86 architectures). The bpf2bpf+tailcall mixing gap that existed as of mid-2026 is now closed upstream.

**Performance gaps:** no SIMD/vector path exists in the BPF JIT on any architecture (BPF JIT codegen is scalar-only everywhere); riscv64-specific performance differences instead come from instruction-count verbosity (more instructions per BPF op on riscv64 than on mature x86/ARM64 JITs, per [The New Stack](https://thenewstack.io/the-risc-architecture-frontier-is-ebpf-ready-for-arm64-and-risc-v/), described only qualitatively, no percentage given) and from 64-bit immediate materialization requiring up to four instructions.

**Security hardening gap:** BPF_NOSPEC (Spectre v1 mitigation) is a no-op on riscv64. See section 12.1.

**Floating-point/NaN semantics:** not applicable; BPF's instruction set is integer-only and has no floating-point opcodes, so no NaN/FP-semantics gap exists for this subsystem specifically.

---

## 7. CI/CD Infrastructure

### 7.1 Upstream Kernel BPF CI (kernel-patches/bpf)

Confirmed by direct repository clone and file inspection (not summary): `.github/scripts/matrix.py`'s `Arch` enum contains only `AARCH64`, `S390X`, `X86_64`; a full `grep -ril riscv .github/` across all 14 workflow files and scripts returns zero matches; `kernel-build-test.yml`, `kernel-test.yml`, `test-progs-asan.yml` and the `veristat-*.yml` workflows enumerate only those same three architectures. **riscv64 has no build job and no test job in the authoritative upstream BPF CI as of 2026-09-30.** `torvalds/linux` itself carries no `.github` directory at all (confirmed HTTP 404), consistent with kernel CI being mailing-list/bot-driven rather than GitHub-Actions-driven for the canonical tree.

A `tools/testing/selftests/bpf/DENYLIST.riscv64` file does exist in the selftests source tree, with the header comment "riscv64 deny list for BPF CI and local vmtest," but it is not consumed by any active kernel-patches/bpf workflow, so it is effectively dormant from an automated-CI perspective (plausibly used only for manual/local vmtest runs on riscv64 hardware).

### 7.2 Pending and Third-Party CI

Three open, unmerged PRs against `kernel-patches/bpf` ("riscv, bpf: Prepare for upcoming daily CI," #14152, #14169, #14171) tune `vmtest.sh` and `DENYLIST.riscv64` for riscv64 inclusion in the daily matrix, including the QEMU CPU-model change noted in section 5.4 and fixes for `setget_sockopt` HZ=250 jiffy-quantization failures under riscv64 emulation. These are infrastructure-readiness work, not yet merged.

Separately, a standalone, already-running third-party daily CI exists at `pulehui/riscv-bpf-daily`: workflow `.github/workflows/riscv-bpf-daily.yml`, cron `0 22 * * *` plus `workflow_dispatch` and PR triggers, job `vmtest-riscv64`, syncs `bpf-next`, builds kernel + selftests in Docker, runs `test_progs`/`test_verifier` under QEMU riscv64 TCG emulation, and auto-files GitHub issues on failure (e.g. issues #9, #10, #11, "Daily failed at commit..."). This CI is real and operating today, but it is a maintainer's personal/unofficial repository, not an upstream-sanctioned gate, and its results do not block any merge.

### 7.3 Other eBPF-Ecosystem CI Systems

| CI System | Architectures Tested | riscv64? |
|---|---|---|
| kernel-patches/bpf (upstream kernel BPF) | x86_64, aarch64, s390x | No (PRs pending) |
| pulehui/riscv-bpf-daily (third-party) | riscv64 (QEMU) | Yes, but unofficial |
| libbpf/libbpf build CI | aarch64, ppc64le, s390x, amd64 | No |
| libbpf/libbpf vmtest / test CI | x86_64 only | No |
| cilium/ebpf (Go library) | x86_64, arm64 | No |
| iovisor/bcc | x86_64 only | No |
| libbpf/bpftool | Ubuntu 22.04/24.04 only (no arch matrix) | No |
| syzbot `ci-qemu2-riscv64` fuzzer | riscv64 (general kernel, not BPF-specific) | Yes, general-purpose, not BPF-focused |

The syzbot `ci-qemu2-riscv64` instance shows active crashes in the riscv64 kernel tree [NEEDS VERIFICATION: current crash count as of this report date]; not all are BPF-specific.

No RISE Runner usage was found in any riscv64 BPF CI path examined; the only confirmed RISE Runner usage touching eBPF at all is the unrelated `python-wheels` mitmproxy packaging job described in section 1.

---

## 8. Distribution and Release Status

eBPF is a kernel subsystem, not a separately released or packaged artifact from `git.kernel.org`. It ships in-tree with every Linux kernel that sets `CONFIG_BPF_JIT=y` (and, for the RV64 path, `CONFIG_ARCH_RV64I=y`). The kernel's own ["Feature status on riscv architecture" page](https://www.kernel.org/doc/html/next/riscv/features.html) marks eBPF-JIT as "ok" (supported) and cBPF-JIT as "TODO." The upstream git tree's cgit page showed tags up to `v7.3-rc5` as of this research pass [NEEDS VERIFICATION against a stable release changelog for the exact current mainline/LTS numbers].

Since there is no qualifying upstream CI gate (section 3, section 7), the consumable artifact for an end user is a distro-built kernel, not an upstream-published binary. Debian and Ubuntu build riscv64 kernels from unmodified upstream source with `CONFIG_BPF_JIT=y` on by default, since mainline riscv64 is a normal, unpatched kernel build target; this is the basis for the yellow/clean-distro-build readiness grade (section 13).

### 8.1 Userspace Package Availability on riscv64

**Ubuntu 26.04 LTS ("resolute"):** a direct `packages.ubuntu.com` search for package names containing "ebpf" in suite `resolute` returns exactly two matches:

| Package | Version | riscv64 |
|---|---|---|
| `golang-github-cilium-ebpf-dev` | 0.17.3+ds1-4 | Yes (arch: all, noarch) |
| `opensnitch-ebpf-modules` | 1.6.9-3ubuntu1 | Yes (explicit: amd64 arm64 riscv64 s390x, confirmed at [packages.ubuntu.com/resolute/riscv64/opensnitch-ebpf-modules](https://packages.ubuntu.com/resolute/riscv64/opensnitch-ebpf-modules)) |

Ubuntu resolute also carries a standalone `bpftool` package for riscv64 (also bundled in `linux-tools-generic`/`linux-tools-<ver>-generic`), which is an improvement over Debian Trixie, where bpftool is not packaged standalone (must be built from the kernel's `tools/bpf/bpftool/` source).

**Ubuntu 24.04 (Noble):**

| Package | Version | riscv64 |
|---|---|---|
| golang-github-cilium-ebpf-dev | 0.11.0-2 | Yes (arch: all) |
| libbpf1 / libbpf-dev | 1:1.3.0-2build2 | Yes |
| libbpfcc / libbpfcc-dev | 0.29.1+ds-1ubuntu7 | Yes |
| bpftrace | 0.20.2-1ubuntu4 | Yes |
| libbpf-tools | 0.29.1+ds-1ubuntu7 | No (amd64/arm64/ppc64el only) |

**Debian Trixie:** libbpf 1.5.0-3, libbpf-dev 1.5.0-3, bpftrace 0.23.2-1, elfutils 0.192-4, dwarves (pahole) 1.30-1, iproute2 6.15.0-1, llvm-toolchain-19 19.1.7-3, all installed for riscv64. bpftool has no standalone riscv64 binary package.

**Arch Linux RISC-V port:** an earlier report cited bpftrace 0.26.1-1 as present in the `extra` repo but FTBFS on riscv64 (bug [77579](https://bugs.archlinux.org/task/77579)). A direct grep of the port's own full build/porting-status page (`.status/status.htm`, ~694 KB) for "ebpf," "libbpf," and "bpftrace" (case-insensitive) returned zero matches for all three terms. This is a direct contradiction: either the package has since been dropped from the RISC-V port entirely, or the earlier FTBFS report referenced a status the current status page no longer surfaces. Current status is [NEEDS VERIFICATION].

**PyPI:** no package named `ebpf` exists (confirmed via both `https://pypi.org/pypi/ebpf/json` returning HTTP 404 and `https://pypi.org/simple/ebpf/` returning HTTP 404); the RISE GitLab wheel-builder registry redirects to the same non-existent PyPI project. `python3-ebpf` and `libebpf` also return no results on Ubuntu. This is a non-finding (no such package exists on any architecture), not a riscv64-specific gap.

### 8.2 What a User Must Do

On Debian or Ubuntu riscv64, eBPF JIT support is present out of the box in the distro kernel (no special installation). Userspace tooling for basic use (libbpf, cilium/ebpf, opensnitch's eBPF modules) is packaged for riscv64 on Ubuntu 26.04. A user needing `bpftool` as a standalone binary on Debian Trixie must build it from kernel source; on Ubuntu 26.04 it is packaged directly.

---

## 9. Dependencies

| Dependency | Role | Relation | Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|---|---|
| GCC | Alternative/kernel-native compiler; required to build the kernel itself | Build | Critical | Available (Ubuntu 26.04 resolute: gcc, gcc-14, gcc-15) | N/A | Available | None riscv64-specific |
| LLVM | BPF-bytecode-producing compiler (Clang); required by selftests (Clang >=12 for CO-RE, >=13 float/relocation, >=14 btf_tag) and by bpftrace | Build | Critical | Builds (Ubuntu 26.04 resolute: llvm/llvm-18/llvm-19, clang/clang-18/clang-19 present; Debian Trixie llvm-toolchain-19 19.1.7-3 confirmed) | CI is x86_64-only upstream; no riscv64 lane | Available | `HAVE_DW_UNWIND` (DWARF stack unwinding) is x86_64-only in bpftrace's use of LLVM |
| GNU binutils | Linker/assembler toolchain; also backs bpftool's disassembler (`-lbfd -lopcodes`) | Build | Critical | Available (Ubuntu 26.04 resolute: binutils); kernel-wide floor 2.30.0, riscv64 extension support needs 2.38 (V) / 2.39 (Zba/Zbb/Zbc/Zbkb) | Not riscv64-specific tested | Available | None found |
| dwarves | DWARF to BTF converter (pahole binary); required for `CONFIG_DEBUG_INFO_BTF=y` and CO-RE (>=1.22 functional floor, >=1.26 maintained minimum) | Build | Critical | Builds (Debian Trixie riscv64 v1.30-1; Ubuntu 26.04 resolute: dwarves, pahole, libdwarves1, libdwarves-dev present) | No riscv64-specific test flag upstream | Available | None riscv64-specific |
| elfutils | ELF parsing (libelf) and DWARF access (libdw); linked by libbpf, bpftool, pahole | Runtime | Critical | Builds (Debian Trixie riscv64 v0.192-4); Ubuntu 26.04 resolute carries it only under the renamed `libelf1t64`/`libelf-dev` package (legacy `libelf1` returns not-found due to the 64-bit time_t transition, a naming artifact, not a riscv64 gap) | Not riscv64-specific tested | Available | None specific to riscv64 |
| libbpf | Userspace BPF loader / CO-RE library; core runtime dependency for virtually all BPF consumers | Runtime | Critical | Builds (Debian Trixie riscv64 v1.5.0-3; Ubuntu 26.04 resolute: libbpf1, libbpf-dev present) | CI x86_64 only; no riscv64 VM test lane | Available (Debian Trixie, Ubuntu Noble and resolute) | None riscv64-specific found |
| zlib | Compression (`-lz`); linked by libbpf.so and bpftool | Runtime | Optional | Available (Ubuntu 26.04 resolute: zlib1g, zlib1g-dev) | N/A | Available | None |
| libcap | Capability checks in bpftool; also needed (`libcap-devel`) by selftests' vmtest.sh | Runtime | Optional | Available (Ubuntu 26.04 resolute: libcap2, libcap-dev) | N/A | Available | None |
| QEMU | riscv64 selftest execution environment (`qemu-system-riscv64`, `-M virt`) | Test | Critical | N/A | Version >=7.2.0 required by vmtest.sh; PMU/`sscofpmf` emulation gaps cause `perf_event_open`-related selftest failures; CPU model flag recently changed from `-cpu rv64` (boot panics observed) to `-cpu max` in unmerged CI-prep PRs | Available as a package on all major distros | PMU emulation gaps; CPU-model/extension mismatch with kernel/toolchain requirements |

**Additional indirect/recursed dependencies found in research** (not in the direct-dependency list above, but load-bearing for the broader eBPF toolchain on riscv64):

- **bpftool**: CLI to inspect/load/pin BPF programs, generates `vmlinux.h` for CO-RE, lives in `tools/bpf/bpftool/` in the kernel tree. Buildable from source on riscv64 everywhere; packaged standalone for riscv64 on Ubuntu 26.04 resolute but not on Debian Trixie.
- **iproute2**: attaches BPF programs as tc classifiers/actions. Builds on riscv64 (Debian Trixie v6.15.0-1 confirmed, Ubuntu resolute confirmed).
- **OpenSSL (libcrypto)**: bpftool's signing feature (`CRYPTO_LIBS := -lcrypto`). Present on Ubuntu 26.04 resolute only under the renamed `libssl3t64`/`libssl-dev` (legacy `libssl3` name renamed, not a riscv64 gap).
- **zstd (libzstd)**: bpftool BTF compression support. Available on Ubuntu 26.04 resolute (`libzstd1`).
- **linux-libc-dev**: kernel UAPI headers (`bpf.h`). Available on Ubuntu 26.04 resolute; not separately tracked as a project.
- **bpftrace**: high-level tracing DSL over BPF, a downstream consumer rather than a build/runtime dependency of the kernel subsystem itself; covered in section 10.

---

## 10. Ecosystem Status

eBPF itself, as a kernel subsystem, has no dependent package ecosystem in the PyPI/npm/Maven sense. It does, however, sit underneath a meaningful set of consuming tools and libraries that each require their own riscv64 enablement work, independent of the kernel JIT being ready. Findings on that consuming ecosystem:

### 10.1 iovisor/bcc

| Issue/PR | Date | Status | Summary |
|---|---|---|---|
| [#5492](https://github.com/iovisor/bcc/issues/5492) | 2026-03-11 | Open, no owner | USDT probe test failures on riscv64 Yocto builds; `FOLLY_SDT` macro in `StaticTracepoint.h` lacks riscv64 definitions. Seven BCC tests fail. |
| [#5490](https://github.com/iovisor/bcc/pull/5490) | 2026-03-31 | Merged | Add riscv syscall prefix detection in C++ API |
| [#5264](https://github.com/iovisor/bcc/pull/5264) | 2025-04-03 | Merged | libbpf-tools: fix incorrect syscall name (includes riscv) |
| [#5068](https://github.com/iovisor/bcc/pull/5068) | 2024-07-28 | Merged | Fix `get_syscall_prefix` on riscv for linux-6.6 |
| [#4637](https://github.com/iovisor/bcc/pull/4637) | 2023-06-21 | Merged | syscount: add syscall lookup table for arm64 and riscv |
| [#4287](https://github.com/iovisor/bcc/pull/4287) | 2022-10-27 | Merged | Fix libbpf tools for riscv |

The open USDT issue has no owner or fix; it blocks any riscv64 workflow relying on USDT probes via bcc.

### 10.2 bpftrace

[#3267](https://github.com/bpftrace/bpftrace/pull/3267) (2024-06-24, merged: fix include path on loongarch/mips/riscv/s390) and [#3299](https://github.com/bpftrace/bpftrace/pull/3299) (2024-07-15, merged: fix `-mno-omit-leaf-frame-pointer` compiler error on riscv) are the confirmed riscv64-relevant merges. No open riscv64-specific bpftrace issue was found. bpftrace is packaged for riscv64 on Debian Trixie and Ubuntu Noble, subject to the unresolved Arch Linux port discrepancy noted in section 8.1.

### 10.3 Rust ecosystem: aya-rs/aya

PR [#1139](https://github.com/aya-rs/aya/pull/1139) ("Fix aya-ebpf-* riscv64 build," opened 2025-01-21, merged 2025-01-22) fixed the `aya-ebpf` crates' `bpf_target_arch` derivation for riscv64 target triples (e.g. `riscv64gc`), unblocking downstream Rust-eBPF builds on riscv64 such as `mitmproxy-rs`.

### 10.4 eunomia-bpf

Issue [#112](https://github.com/eunomia-bpf/eunomia-bpf/issues/112) ("Add riscv and other platforms support," opened 2023-01-29) requested CMake cross-compilation support and a RISC-V vmlinux header, modeled on bcc's libbpf-tools pattern; closed via PR #152.

### 10.5 Other RISC-V + eBPF projects (informational, not tracked issues)

`latte-c/ebpf2rv` (standalone eBPF-to-RV64 JIT used in the rCore teaching OS), `luigimasdea/ebpf-nvme-jit` (eBPF-to-RV64G JIT for bare-metal/firmware), `rzetelskik/bpf-sanitizer` (architecture-agnostic sanitizing BPF prog type, referenced in riscv JIT security discussions), and `12345qwert123456/k3s.RISC-V` (builds Calico/Cilium's eBPF datapath for riscv64) are small, independent projects rather than tracked upstream deliverables.

### 10.6 libbpf periodic kernel-sync PRs

[libbpf/libbpf #946](https://github.com/libbpf/libbpf/pull/946) (2026-02-11, merged) and [#940](https://github.com/libbpf/libbpf/pull/940) (2026-01-29, merged) carried riscv-related upstream kernel sync changes. No open riscv-specific bug reports exist in the libbpf or bpftool issue trackers.

---

## 11. Known Bugs and Active Issues

| Issue | Status | Severity | Notes |
|---|---|---|---|
| CVE-2025-40079: struct_ops return values not sign-extended per RISC-V ABI | Fixed | High (CVSS 7.8) | `ns_bpf_qdisc` selftest triggered a kernel panic; a 32-bit pointer return from a struct_ops callback was mis-sign-extended. Fix commits `92751937f12a`, `918a399501e2`, `fd2e08128944` in `arch/riscv/net/bpf_jit_comp64.c`. Per the MITRE CVE record: reserved 2025-04-16, published 2025-10-28, fixed in mainline 6.18, backported to stable 6.17.3 and 6.12.53. Reachable via CAP_BPF (delegable to unprivileged containers via BPF tokens); gives kernel-memory disclosure and write primitives plus a reproducible crash. |
| Trampoline stack-overflow flag-check bug (`BPF_TRAMP_F_ORIG_STACK` used instead of `BPF_TRAMP_F_CALL_ORIG`) | Fixed | High (kernel panic) | Two sources disagree on the exact commit: `22cc16c04b78` merged 2025-12-19, vs. `8f3e00af8e52` merged 2026-01-06 (author Menglong Dong, China Telecom). Same defect class; exact SHA is [NEEDS VERIFICATION]. |
| Arena atomic load_acquire: missing exception-handler registration + register info-leak | Fixed | High (fault-triggered crash / data leak) | `ret = ret ?: add_exception_handler()` skipped registration when `emit_atomic_ld_st()` returned 1; separately, `REG_DONT_CLEAR_MARKER` left a faulted destination register stale, letting a verifier-trusted-but-unwritten register leak map data. Merged bpf-next as `5eb8921371c6`, 2026-07-21, author Feng Jiang. |
| BPF JIT execmem / `patch_map()` write fault under `CONFIG_STRICT_MODULE_RWX=n` | Open (GitHub mirror PR [#13848](https://github.com/kernel-patches/bpf/pull/13848) expired/auto-closed 2026-09-24 on patchwork; underlying patch not confirmed merged to mainline) | Medium (BPF load failures with kernel warnings) | `bpf_prog_pack_alloc` unconditionally calls `set_memory_rox()`, independent of `CONFIG_STRICT_MODULE_RWX`; `patch_map()` then returns a read-only address with no writable alias, so `copy_to_kernel_nofault()` faults. Fix mirrors arm64's `CONFIG_EXECMEM`-based approach (`b1480ed230ac`). Author Wei-Jie Hung. |
| Missing sign-extension for signed 1/2-byte kfunc args (RV64) | Open | Medium (breaks `kfunc_call`/`kfunc_call_test4` selftest) | RV64 ABI requires sign-extension for signed 1-byte/2-byte kfunc args; JIT does not perform it. Tracked at [kernel-patches/bpf-rc#9343](https://github.com/kernel-patches/bpf-rc/pull/9343). |
| RV32 JIT: signed div/mod + full 32-bit atomics with correct memory ordering | Open, superseded | Medium | v1 series (Kuan-Wei Chiu, 2026-04-29) fixed signed-as-unsigned div/mod (`-6/2` returning `0x7ffffffd` instead of `0xfffffffd`) and added missing `AND/OR/XOR/XCHG` (+FETCH) as native `amo*.w`, but used relaxed (`aq=0,rl=0`) ordering for FETCH variants, violating BPF's full-ordering requirement. v2 not observed in patchwork as of this report date. |
| BPF stack arguments for RV64 JIT (>5 args) | In review | Medium (feature gap, not correctness) | v2-v5 posted Aug 13 - Sept 5, 2026 by Feng Jiang; an AI-assisted review flagged a possible fentry/fexit trampoline incompatibility for static subprograms with >5 args; Pu Lehui proposed a deeper register-convention refactor and took over the next posting. Not merged as of 2026-09-30. |
| BPF_NOSPEC is a no-op on riscv64 | Open, stalled | High (security hardening gap) | See section 12.1. |
| `bpf_task_storage_get` allocation regression on Linux >=6.19 | Open, [NEEDS VERIFICATION, single source] | Unclear | Migration to `kmalloc_nolock` breaks allocation on architectures lacking `HAVE_CMPXCHG_DOUBLE`, including riscv64, per a third-party (kxxt.dev) blog; fix status not confirmed in any second source. |
| 6.6 LTS verifier performance regression | Fixed | Low-Medium | Backported security fix in Linux 6.6.64-6.6.70 degraded BPF verifier performance; resolved in 6.6.140, per a riscv-context eBPF maintenance blog [NEEDS VERIFICATION, single source]. |
| Missing `CONFIG_KPROBES_ON_FTRACE` on RISC-V | Open, [NEEDS VERIFICATION, single source] | Medium | Kprobe attachment to syscall wrappers fails on RISC-V since this ftrace feature is unsupported there, per a third-party blog. |
| No per-core Spectre v1/v4 granularity for `bpf_jit_bypass_spec_v1/v4()` | Under discussion | Medium | Needed so mitigations stay off on in-order cores and on for out-of-order cores; LKML thread, January 2026 (see [ratatoskr.run mirror](https://ratatoskr.run/linux-riscv/2026/01/7941154/t)). |
| QEMU PMU/`sscofpmf` emulation gaps affecting `perf_event_open` selftests; `vmtest.sh` boot panics under `-cpu rv64` | Workaround only | Low-Medium (CI reliability) | Documented workarounds (disable `sscofpmf`, use `-cpu max`); not a kernel fix. |
| "riscv/eBPF: Add BPF exception tables" (2021 original submission) | Changes Requested at v1; later superseded by the merged 2021-10-27 version | Historical | Björn Töpel requested subject-line convention changes, asked about RV32 coverage, and questioned the new `exception_table_entry` struct rather than reusing the generic `linux/extable.h` one. |
| ALU32 zero-extension bug (historical) | Fixed | Historical | RV64 JIT once emitted sign-extension instead of the required zero-extension for ALU32 `add/sub/neg/lsh/rsh/arsh`, per Jitterbug-project verification findings; fix already landed, exact commit [NEEDS VERIFICATION]. |

---

## 12. Objections and Upstream Blockers

### 12.1 Spectre Mitigation Stall (BPF_NOSPEC)

The most technically substantive open issue. The RV64 BPF JIT currently emits nothing for `BPF_NOSPEC`. A patch from Lukas Gerlach (CISPA Helmholtz Center for Information Security), proposing to emit `fence.i`, has been in "Changes Requested" state since December 2025/January 2026.

The core dispute is whether `fence.i` is an adequate Spectre v1 mitigation on RISC-V:
- **Bo Gan (RISC-V International):** the ISA specification only guarantees `fence.i` as a retirement barrier, not an issue barrier, and does not mandate that it prevents speculative execution of following instructions; forwarded the concern to the RISC-V Speculation Barriers Task Group.
- **Stefan O'Rear:** confirmed the retirement-barrier-only guarantee technically; on SiFive JH7110 hardware, `fence.i` invalidates all 512 I-cache lines (several thousand cycles of overhead per call).
- **Paul Walmsley:** favors switchable per-microarchitecture mitigations now rather than waiting years for Task Group ratification.
- **Luis Gerhorst:** argues a retirement barrier still reduces exploit success rate and bandwidth even without a formal guarantee; suggests per-microarchitecture bypass infrastructure modeled on PowerPC's `bpf_jit_bypass_spec_v1/v4()`.
- Empirically, `fence.i` is claimed to prevent Spectre-PHT attacks in practice on SiFive C910/C920 and P550 (out-of-order cores); in-order cores (U74, C906) are held to not need the mitigation at all.

A January 2026 LKML thread continues discussing per-core granularity for `bpf_jit_bypass_spec_v1/v4()`, but no active patch series currently implements it. Any RISC-V deployment of eBPF on out-of-order cores (SiFive P550, T-Head C910/C920, ESWIN EIC7700) runs today without a Spectre v1 mitigation for BPF programs, a real security gap relative to amd64 (`lfence`) and arm64 (`csdb`-class barrier).

### 12.2 No Qualifying Upstream CI Gate

All riscv64 BPF patches merge after manual maintainer review only. The `kernel-patches/bpf` CI matrix explicitly lists only x86_64, aarch64, s390x (section 7.1). This is the direct basis for the yellow readiness grade: there is no upstream-automated build or test gate for riscv64 today, only distro-level unpatched builds. The `pulehui/riscv-bpf-daily` third-party CI (section 7.2) demonstrates the gap is closeable with modest effort, but is not itself an upstream gate. Unmerged PRs #14152/#14169/#14171 are the concrete path to closing it.

### 12.3 USDT Probe Tooling Gap

`iovisor/bcc` issue [#5492](https://github.com/iovisor/bcc/issues/5492) (USDT probe failures on riscv64) has no owner and no fix. It is a userspace tooling gap in the `FOLLY_SDT` macro, not a kernel JIT issue, and blocks riscv64 users from USDT-based tracing via bcc.

### 12.4 RV32 JIT Maintenance Risk

The RV32 JIT's named maintainers (Luke Nelson, Xi Wang) carry a university affiliation from the time of original authorship with no confirmed current corporate backer. Current patch activity (signed div/mod, atomics) comes from an unaffiliated contributor (Kuan-Wei Chiu), and the superseded state of that fix series (awaiting a v2 with corrected memory ordering) suggests reduced review bandwidth on this path specifically.

### 12.5 BPF Stack Arguments Refactor in Flux

The v2-v5 "BPF stack arguments for RV64 JIT" series is mid-refactor: an AI-assisted review flagged a possible trampoline/ABI incompatibility for fentry/fexit attaching to static subprograms with more than 5 arguments, and the reviewer (Pu Lehui) proposed remapping to the standard RISC-V calling convention rather than the series' original approach. Pu Lehui has taken over posting the next version; timeline to merge is not fixed.

---

## 13. Readiness Assessment

- **Color:** yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** Upstream's own BPF CI matrix (`kernel-patches/bpf/.github/scripts/matrix.py`) defines only x86_64, aarch64, and s390x, with riscv64 support still pending in unmerged "prepare for upcoming daily CI" PRs ([#14152](https://github.com/kernel-patches/bpf/pull/14152), [#14169](https://github.com/kernel-patches/bpf/pull/14169), [#14171](https://github.com/kernel-patches/bpf/pull/14171)) - so there is no upstream-automated riscv64 build or test gate today. With no qualifying upstream CI, the distribution floor applies: Debian/Ubuntu ship riscv64 kernels built from unmodified upstream source with `CONFIG_BPF_JIT=y` on by default (mainline riscv64 is a normal, unpatched build target), and the kernel's own ["Feature status on riscv architecture"](https://www.kernel.org/doc/html/next/riscv/features.html) doc marks eBPF-JIT as "ok." This is a clean, unpatched distro build without upstream test-gating CI, giving yellow/clean-distro-build; the consumable artifact (a bootable riscv64 kernel) is published by the distro, not upstream, so release_provider is distro rather than upstream. Primary sources: [kernel-patches/bpf matrix.py](https://raw.githubusercontent.com/kernel-patches/bpf/master/.github/scripts/matrix.py) and [kernel.org riscv feature status](https://www.kernel.org/doc/html/next/riscv/features.html).
- **Pending work that could change the grade:** merging the open upstream PRs adding riscv64 to the kernel-patches/bpf daily CI matrix (#14152, #14169, #14171) would close the CI-gate gap directly and is the single highest-leverage change available. The already-running third-party daily CI at `pulehui/riscv-bpf-daily` is a ready-made candidate to fold into the official matrix rather than build from scratch. Two functional items remain unresolved and would need to land regardless of CI status: the BPF_NOSPEC (Spectre v1) mitigation patch, stalled in "Changes Requested" since December 2025/January 2026, and a v2 of the RV32 JIT fix series (signed div/mod, atomics), currently superseded and awaiting resubmission. RISE Project involvement is tangential only: PR [#2119](https://github.com/riseproject-dev/python-wheels/pull/2119) packages a prebuilt eBPF object into a riscv64 Python wheel via a RISE riscv64 CI runner, which is downstream packaging/CI, not funding of the kernel eBPF port itself, and does not move this grade.

---

## 14. Investment Analysis

RISE has not funded kernel-level eBPF/RISC-V JIT work; its only confirmed eBPF touchpoint is the unrelated `python-wheels` mitmproxy packaging job (section 1), so none of the work below is already covered by RISE funding. Separately, the "bpf2bpf + tail call mixing" functional gap called out in earlier tracking is now closed upstream (merged 2026-07-21) and has been removed from the work list below.

### 14.1 Functional Enablement

The RV64 JIT is production-quality for the large majority of eBPF use cases (networking, tracing, security); the confirmed remaining gaps are BPF exceptions (a newer feature, not yet ported) and 1/2-byte atomics (a RISC-V hardware limitation shared with other architectures, not fixable in software alone). Remaining functional work:
- Finish and merge the BPF stack-arguments series for RV64 (>5-arg kfunc/bpf2bpf calls); currently mid-refactor under Pu Lehui. Low-medium effort to help land, since the design work is already substantially done upstream.
- Resubmit the RV32 fix series v2 (signed div/mod already correct; atomics need corrected full-ordering semantics for FETCH variants). Medium effort (2-3 person-weeks), unblocked, needs only a v2 submission.
- BCC USDT riscv64 fix (`FOLLY_SDT` macro riscv64 definitions, issue #5492): low effort (1-2 person-weeks including testing), no owner currently assigned.
- BPF exceptions support in the riscv64 JIT: non-trivial (previously estimated at 4-6 person-weeks based on complexity in other architectures) [NEEDS VERIFICATION: no independent upstream estimate found].

### 14.2 Performance Optimization

This is not classified as an optimization-purpose project; investment here is secondary to closing the CI and correctness gaps. The one concrete academic data point found, the JitSynth paper (CAV/PLDI 2020, on a HiFive Unleashed board, [ResearchGate figure](https://www.researchgate.net/figure/Execution-time-of-eBPF-benchmarks-on-the-HiFive-Unleashed-RISC-V-development-board-using_fig2_342972209)), measured the hand-written Linux RV64G JIT at 5.24x faster than the BPF interpreter, with a synthesized alternative JIT running 1.82x slower than the hand-written one; this predates most of the 2024-2026 riscv64-specific optimization work (Zba/Zbb codegen, helper inlining) and should not be read as representative of the current JIT. No other quantitative riscv64-vs-arm64/amd64 eBPF benchmark was found in any accessible source (RISE blog, eBPF Foundation materials, academic papers, or GitHub search); the eBPF Foundation's own architecture-parity roadmap explicitly targets only x86-64 and arm64. The Alpha-Omega-funded security audit reportedly covering x86-64, arm64 and riscv64 JIT compilers is the one confirmed cross-architecture riscv64 investment from the Foundation [NEEDS VERIFICATION: audit scope and findings not independently re-confirmed this cycle]. Establishing a current riscv64-vs-arm64/amd64 performance baseline on real hardware remains open work (estimated 3 person-weeks).

### 14.3 CI/CD Infrastructure

This is the highest-leverage, most concrete investment target, and the work is now partially pre-built: the `pulehui/riscv-bpf-daily` third-party CI already demonstrates a working QEMU-riscv64 vmtest pipeline against bpf-next, and three PRs (#14152, #14169, #14171) already propose the corresponding `vmtest.sh`/`DENYLIST.riscv64` changes needed for official inclusion. What remains is: (a) helping land or sponsoring #14152/#14169/#14171 to completion, (b) adding a `RISCV64` member to the `Arch` enum in `matrix.py` and wiring it into the workflow files, and (c) coordinating with `kernel-patches/bpf` maintainers and/or Pu Lehui (who already runs the third-party daily CI) to fold that pipeline into the official matrix rather than duplicate it. This is a self-contained contribution not requiring BPF core-maintainer approval beyond CI configuration review, and materially lower effort than previously estimated given the third-party CI and pending PRs already exist. Estimated 1-1.5 person-weeks to help land the pending PRs plus matrix integration.

### 14.4 Ecosystem Enablement

The Spectre mitigation gap (section 12.1) is the most consequential ecosystem/security item: it requires either reaching consensus with the RISC-V Speculation Barriers Task Group on an ISA-sanctioned primitive, or implementing per-microarchitecture bypass infrastructure (`bpf_jit_bypass_spec_v1/v4()`-style, as on PowerPC) so that `fence.i` is applied selectively to out-of-order cores. This needs coordination with RISC-V International and SoC vendors; estimated 4-8 person-weeks depending on scope. The BCC USDT gap (#5492) is a smaller, self-contained ecosystem fix (1-2 person-weeks). The 1/2-byte atomics gap is not addressable without new RISC-V ISA hardware support and is out of scope for software investment.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Land #14152/#14169/#14171 and add riscv64 to kernel-patches/bpf matrix, integrating or replacing pulehui/riscv-bpf-daily | 1-1.5 | Qualcomm or upstream BPF/Pu Lehui | Critical |
| Security | BPF_NOSPEC: per-microarchitecture bypass infrastructure + resolve fence.i sufficiency question with RISC-V Speculation Barriers TG | 4-8 | Qualcomm + RISC-V International coordination | High |
| Functional | Help land BPF stack-arguments series for RV64 (v6+, post Pu Lehui refactor) | 1-2 | Feng Jiang / Pu Lehui, or Qualcomm co-review | High |
| Functional | RV32 fix series v2: signed div/mod already fixed; correct full-ordering semantics for 32-bit atomic FETCH variants | 3 | Kuan-Wei Chiu or Qualcomm | Medium |
| Ecosystem | Fix BCC USDT riscv64 failures (FOLLY_SDT macro, issue #5492) | 1.5 | Qualcomm or BCC maintainers | Medium |
| Performance | Establish current riscv64 eBPF performance baseline vs arm64/amd64 on real hardware | 3 | Qualcomm | Medium |
| Functional | BPF exceptions support in riscv64 JIT | 4-6 | Qualcomm or upstream | Medium |
| Quality | Verify/resolve the Arch Linux RISC-V bpftrace packaging discrepancy (section 8.1) | 0.5 | Qualcomm or Arch RISC-V port maintainers | Low |
| Functional | Investigate `bpf_task_storage_get` allocation regression on riscv64 for kernel >=6.19 | 1 | Qualcomm or upstream | Low |

---

## 15. References

- [Linux kernel BPF source: arch/riscv/net/](https://github.com/torvalds/linux/tree/master/arch/riscv/net)
- [Original RV64G BPF JIT commit (2353ecc6f91f)](https://github.com/torvalds/linux/commit/2353ecc6f91fd15b893fa01bf85a1c7a823ee4f2)
- [RV32G eBPF JIT v5 cover letter](https://patchwork.kernel.org/project/linux-riscv/patch/20200305050207.4159-1-luke.r.nels@gmail.com/)
- [BPF exception tables patch (Tong Tiangen)](https://patchwork.kernel.org/project/netdevbpf/patch/20211027111822.3801679-1-tongtiangen@huawei.com/)
- [Mixing bpf2bpf and tailcalls for RV64, v6](https://ratatoskr.run/linux-riscv/2026/07/17228822/t)
- [BPF stack arguments for RV64 JIT, v2](https://ratatoskr.run/lkml/2026/08/17406068/t) and [v3](https://ratatoskr.run/lkml/2026/08/17410437/t)
- [riscv: patch: fix handling of bpf-jit execmem addresses, PR #13848](https://github.com/kernel-patches/bpf/pull/13848)
- [Pu Lehui proposed as co-maintainer, PR #14174](https://github.com/kernel-patches/bpf/pull/14174)
- [kernel-patches/bpf CI matrix.py](https://raw.githubusercontent.com/kernel-patches/bpf/master/.github/scripts/matrix.py)
- [DENYLIST.riscv64](https://github.com/torvalds/linux/blob/master/tools/testing/selftests/bpf/DENYLIST.riscv64)
- [config.riscv64](https://github.com/torvalds/linux/blob/master/tools/testing/selftests/bpf/config.riscv64)
- [arch/riscv/net/Makefile](https://raw.githubusercontent.com/torvalds/linux/master/arch/riscv/net/Makefile)
- [scripts/min-tool-version.sh](https://raw.githubusercontent.com/torvalds/linux/master/scripts/min-tool-version.sh)
- [tools/testing/selftests/bpf/vmtest.sh](https://raw.githubusercontent.com/torvalds/linux/master/tools/testing/selftests/bpf/vmtest.sh)
- [Kernel feature status on riscv architecture](https://www.kernel.org/doc/html/next/riscv/features.html)
- [pulehui/riscv-bpf-daily third-party CI](https://github.com/pulehui/riscv-bpf-daily)
- [CVE-2025-40079 fix commit](https://git.kernel.org/stable/c/fd2e08128944a7679e753f920e9eda72057e427c)
- [aya-rs/aya PR #1139: fix riscv64 build](https://github.com/aya-rs/aya/pull/1139)
- [eunomia-bpf issue #112: riscv support](https://github.com/eunomia-bpf/eunomia-bpf/issues/112)
- [iovisor/bcc issue #5492: USDT probe failures on riscv64](https://github.com/iovisor/bcc/issues/5492)
- [bpftrace PR #3267: fix include path on riscv](https://github.com/bpftrace/bpftrace/pull/3267)
- [riseproject-dev/python-wheels PR #2119: mitmproxy-linux 0.12.11](https://github.com/riseproject-dev/python-wheels/pull/2119)
- [RISE Project blog](https://riseproject.dev/blog/)
- [RISE membership page](https://ebpf.foundation/become-a-member/)
- [eBPF Foundation launch press release](https://www.linuxfoundation.org/press/press-release/facebook-google-isovalent-microsoft-and-netflix-launch-ebpf-foundation-as-part-of-the-linux-foundation)
- [eBPF Foundation growth announcement](https://www.linuxfoundation.org/press/ebpf-foundation-accelerates-growth-with-meta-toyota-membership-and-new-strategic-board-leadership)
- [eBPF Steering Committee](https://ebpf.foundation/bsc/)
- [Meta acquires Rivos (Bjorn Topel's current employer)](https://www.nextplatform.com/compute/2025/10/02/meta-buys-rivos-to-accelerate-compute-engine-engineering/1642477)
- [The New Stack: Is eBPF ready for ARM64 and RISC-V?](https://thenewstack.io/the-risc-architecture-frontier-is-ebpf-ready-for-arm64-and-risc-v/)
- [FOSDEM 2026: eBPF Observability on RISC](https://fosdem.org/2026/schedule/event/8SRBCB-ebpf_observability_on_risc_what_works_what_breaks_and_how_to_test_it/)
- [JitSynth benchmark figure (ResearchGate)](https://www.researchgate.net/figure/Execution-time-of-eBPF-benchmarks-on-the-HiFive-Unleashed-RISC-V-development-board-using_fig2_342972209)
- [Ubuntu packages: opensnitch-ebpf-modules on riscv64 (resolute)](https://packages.ubuntu.com/resolute/riscv64/opensnitch-ebpf-modules)
- [Arch Linux RISC-V port status](https://archriscv.felixc.at/)
- [PyPI: ebpf package (404, does not exist)](https://pypi.org/pypi/ebpf/json)