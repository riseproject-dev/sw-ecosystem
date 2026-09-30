---
title: libbpf
parent: Project Reports
color: yellow
dependencies:
  - name: elfutils
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: critical
  - name: zlib-ng
    relation: runtime-dependency
    criticality: optional
  - name: dwarves
    relation: build-dependency
    criticality: optional
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: test-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="libbpf" %}

# libbpf

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** Yellow (clean-distro-build)<br/>
**Scope:** RISC-V (riscv64/linux) support status for libbpf<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

libbpf is the canonical userspace library for loading, verifying, and managing BPF programs on Linux. It handles ELF parsing of compiled BPF objects, BTF (BPF Type Format) processing, CO-RE (Compile Once, Run Everywhere) relocation, map creation, program attachment (kprobes, uprobes, tracepoints, USDT, cgroup hooks), and the ring buffer and perf buffer APIs. It contains no JIT compiler, no SIMD dispatch code, and no cryptography; the BPF JIT that actually generates machine code lives in the Linux kernel at `arch/riscv/net/bpf_jit_comp64.c`, outside this project's scope.

**Governance:** libbpf is a Linux kernel sub-project. The authoritative source is the `bpf-next` kernel tree under `tools/lib/bpf/`. The [libbpf/libbpf](https://github.com/libbpf/libbpf) GitHub repository is explicitly described in its own README as an "automated upstream mirror": contributors are told "all libbpf changes should be sent to the BPF mailing list... please don't open PRs here." Governance is therefore standard Linux kernel BPF-subsystem process (patch review on `bpf@vger.kernel.org`, merge by kernel BPF maintainers), not a separate foundation or consortium body. License: dual SPDX `BSD-2-Clause OR LGPL-2.1-only`.

**Institutional home:** The [eBPF Foundation](https://ebpf.io/foundation/) (a Linux Foundation sub-foundation) provides an institutional umbrella for the broader eBPF ecosystem. Platinum members: CrowdStrike, Google, Isovalent, Meta, Netflix. Silver members: Datadog, Intel, Toyota Motor Corporation. This is adjacent context; it is not libbpf's governance body.

**Core maintainers / corporate affiliations** (from commit sign-off history):

- Andrii Nakryiko (Meta) -- de facto lead maintainer; author of nearly every "sync: latest libbpf changes from kernel" commit and the systematic per-architecture completion work, including RISC-V's PARM6-PARM8 and syscall-regs-spec commits.
- Alexei Starovoitov (Meta) -- BPF subsystem co-maintainer.
- Daniel Borkmann (Isovalent/Cisco) -- BPF/XDP co-maintainer, signs off most libbpf patches at the kernel level, including the original RISC-V commit.
- Yonghong Song (Meta), Daniel Muller (Meta, per sign-off address) -- frequent sync-commit authors.
- Ilya Leoshkevich (IBM) -- authored the RISC-V register-name and syscall-argument fixes (2022).
- Bjorn Topel (kernel.org address; formerly Intel) -- authored the original RISC-V `bpf_tracing.h` support (2021).
- Pu Lehui (Huawei) -- added RISC-V USDT argument-parsing support (2022) and the 2024 `orig_a0` syscall fix.
- Alexandre Ghiti (Rivos Inc., a RISC-V CPU startup) -- fixed RISC-V syscall-argument access after the kernel's syscall-wrapper ABI change (2023).
- Yixun Lan (Gentoo) -- fixed the RISC-V return-value register naming (2022).

**Community posture on new ports:** No documented tier policy or PLATFORMS.md/SUPPORT.md exists anywhere in the repository or docs. In practice, RISC-V contributions from Intel, IBM, Huawei, Rivos, and Gentoo have all been merged without recorded objection, following the same pattern used for every other supported architecture (arc, loongarch, sparc, mips, powerpc): patch to the kernel mailing list, review, merge, then automated sync to GitHub. There is no record of RISC-V work being blocked on architectural or policy grounds.

**RISE Project involvement:** Confirmed absent. A direct check of [riseproject.dev/members](https://riseproject.dev/members/) lists Premier members (Alibaba Damo, Google, MediaTek, NVIDIA, Qualcomm Technologies, Red Hat, SiFive, Tenstorrent), General members (Akeana, Andes Technology, Beijing ESWIN, Beijing Institute of Open Source Chip, Canonical, Douyin Vision, Institute of Software CAS, Microchip Technology, NextSilicon, Quintauris, SpacemiT, ZTE), and Partners (RISC-V International, Scaleway, OSU OSL, Yocto Project) -- none overlap with libbpf's actual contributor base (Meta, Isovalent, IBM, Huawei, Rivos, Gentoo, Intel). Two independent crawls of the RISE blog (one counting 35 posts via sitemap, one counting 32 posts via `riseproject.dev/feed/`; this discrepancy in post count was not resolved and is noted rather than adjudicated) found zero mentions of libbpf, BPF, or eBPF in any post title or summary across both passes. The GitHub org `riseproject-dev` (26 repositories) has no libbpf-related repository, and its `kernel-and-virtualization-wg` and `system-libraries-wg` working groups -- the ones that would plausibly track a libbpf effort -- have no matching repo. **No RISE funding or coordinated investment in libbpf was found by any research pass.**

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is upstream in the Linux kernel `bpf-next` tree and mirrored automatically to the libbpf GitHub repository. No out-of-tree or vendor-branch patches exist. 19 commits directly touch RISC-V support, spanning October 2021 to September/October 2024 (confirmed via `search_commits` against `libbpf/libbpf`, both `riscv` and `riscv64` queries, sorted by author date).

| Date | Event | Commit | Author | Affiliation |
|------|-------|--------|--------|-------------|
| 2021-10-28 (landed 2021-11-01 via sync `c4f9ee9f`) | Original RISC-V (RV64) `PT_REGS` macros added to `bpf_tracing.h` -- foundational enablement commit | [7beaa2ef](https://github.com/libbpf/libbpf/commit/7beaa2ef90ede98dae9e6d1e0c48ef4f6c215f0b) | Bjorn Topel | kernel.org / formerly Intel |
| 2021-11-05 | `bpf: Change value of MAX_TAIL_CALL_CNT from 32 to 33` -- cross-arch tail-call fix touching the riscv JIT tail-call-count register among other arches | [5ca49d2b](https://github.com/libbpf/libbpf) | -- | -- |
| 2022-02-09 (landed via sync `528094c0`) | Fix riscv register names: `epc -> pc`, `fp -> s0` -- reported by Heiko Carstens (IBM) | [497ec1d3](https://github.com/libbpf/libbpf/commit/497ec1d35ca3bb824f9345e32b665157077b1746) | Ilya Leoshkevich | IBM |
| 2022-02-09 | Fix accessing syscall arguments on riscv (riscv did not yet select `ARCH_HAS_SYSCALL_WRAPPER`) | [32c19d85](https://github.com/libbpf/libbpf/commit/32c19d8505ff32fe84d16277232bb7f0b645d63a) | Ilya Leoshkevich | IBM |
| 2022-04-19 (landed via sync `3a4e2630`) | Support riscv USDT argument parsing logic; explicitly tested on both RV32 and RV64 hardware/emulation by the author | [eb2b2160](https://github.com/libbpf/libbpf/commit/eb2b216081c3acca7f7657203b38414ff8a2de9f) | Pu Lehui | Huawei |
| 2022-07-06 (landed via sync `3fa2c28d`) | Use `a0` for the RC (return-value) register per RISC-V calling convention | [8498996f](https://github.com/libbpf/libbpf/commit/8498996f9fb347dea51dbe678867884358a978f2) | Yixun Lan | Gentoo |
| 2023-01-20 (landed via sync `e398e7ea`) | Define riscv syscall regs spec + complete riscv arch spec (adds PARM6-PARM8) in `bpf_tracing.h` | [ed66fb29](https://github.com/libbpf/libbpf/commit/ed66fb297d7895e879b30bc4d808e25843a64902), [9db84de5](https://github.com/libbpf/libbpf/commit/9db84de5f0b7b0160c8d5ea698f7fe2353d066a3) | Andrii Nakryiko | Meta |
| 2023-05-04 (landed via sync `9aea1da2`) | Fix comment about arc and riscv arch in `bpf_tracing.h`. Submitted as standalone PR [#686](https://github.com/libbpf/libbpf/pull/686) by Kenjiro Nakayama; direct verification of the PR page shows it was **closed without merge** on 2023-05-04. The equivalent fix landed instead through commit `6a6cf6dc`, submitted the same day to the kernel mailing list by the same author and synced in on 2023-05-24/25. (Note: an initial broad search pass had characterized PR #686 as "merged" based on search-result metadata alone; a dedicated verification pass fetching the rendered PR page directly found a Closed, not Merged, badge -- the direct-fetch result is treated as authoritative here.) | [6a6cf6dc](https://github.com/libbpf/libbpf/commit/6a6cf6dcdc711450a25dbf68b930f482f5274473) | Kenjiro Nakayama | -- |
| 2023-10-04/19 (landed via sync `6a577606`) | Fix syscall access arguments on riscv: switches to the generic `PT_REGS_SYSCALL_REGS()` implementation now that riscv selects `ARCH_HAS_SYSCALL_WRAPPER` (reviewed by Sami Tolvanen, Google -- the only riscv commit in this set with an explicit third-party `Reviewed-by:`) | [20c1170e](https://github.com/libbpf/libbpf/commit/20c1170ea4044852e79297c66d6e1a7734d28984) | Alexandre Ghiti | Rivos Inc. |
| 2024-08-31 (merged 2024-10-09) | Fix accessing first syscall argument on RV64: uses `orig_a0` per `arch/riscv64/include/asm/syscall.h`; fixes `bpf_syscall_macro`, `vmlinux`, `test_lsm` selftest failures on RV64 | [9045c3ab](https://github.com/libbpf/libbpf/commit/9045c3ab53519869051b365bbfa7a1c3b4d2a525) | Pu Lehui | Huawei |
| 2024-09-16 | `bpf: __bpf_fastcall for bpf_get_smp_processor_id in uapi` -- cross-arch (x86/riscv/arm) attribute update, riscv mentioned incidentally | `89df6536` | -- | -- |

**Important correction to the prior version of this section:** PRs #940 and #946, previously listed as "automated kernel sync including riscv changes," are generic "Libbpf sync ... from kernel" batch-sync PRs that bundle many unrelated commits and happen to match a broad `riscv` search only incidentally. The same is true of PR search hits #799, #744, #746, #706, #693, #655. Only one standalone, genuinely RISC-V-titled PR has ever existed against this repository: #686, and as noted above it was closed unmerged, with the substantive fix landing via direct kernel-sync commit instead. This is consistent with the repository's stated mirror model -- essentially no RISC-V work has ever entered the codebase through GitHub's own PR-merge mechanism.

All RISC-V work concentrates in two files: `src/bpf_tracing.h` (PT_REGS macros, register definitions, syscall-argument handling) and `src/usdt.c` (USDT argument parsing and register-offset table), plus a changelog reference in `SYNC.md`. The work is 100% upstream; no downstream-only or vendor patches exist.

---

## 3. Upstream Support Tier

libbpf has no formal tier-policy document (no PLATFORMS.md, SUPPORT.md, or architecture-tier file anywhere in the repo or docs tree). Architecture standing is de facto, determined by presence of source-level code and CI coverage.

| Criterion | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| `bpf_tracing.h` PT_REGS macros | Complete | Complete | Complete |
| `usdt.c` USDT argument parsing | Complete | Complete | Complete |
| Upstream CI (build, `build.yml`) | Yes | Yes | **No** |
| Upstream CI (functional tests, `test.yml`/`vmtest.yml`) | Yes (x86_64 only) | No | **No** |
| Official GitHub release binaries | Source archive only | Source archive only | Source archive only |
| Distro binary packages | Yes | Yes | Yes (Debian sid, Ubuntu 26.04 resolute) |
| Hardware/emulation test record | Yes (CI) | Occasional | Mentioned in individual commit messages (Pu Lehui/Huawei tested RV32+RV64 for USDT) |

**Assessment:** riscv64 has source-level support equivalent in depth to arm64 (see Section 4), but zero upstream CI of any kind -- it is entirely absent from the cross-build matrix, unlike arm64 which is at least build-tested. This is the central finding driving the readiness grade: the project itself validates nothing on riscv64; validation happens entirely downstream, in Debian and Ubuntu buildd infrastructure building unmodified upstream source.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

libbpf has no JIT compiler, no SIMD dispatch, and no hand-written assembly anywhere in the codebase (confirmed: no `arch/` directory, no `.S` files, zero matches for RVV intrinsics such as `vfloat32m1_t`). All architecture-specific code is preprocessor-guarded sections inside shared C files. A source-level review of every riscv-touching file (`src/bpf_tracing.h`, `src/usdt.c`, `src/libbpf.c`, `src/bpf.c`, `include/linux/compiler.h`) found the port to be a genuinely complete, actively maintained architecture backend for libbpf's scope, not a stub, with two narrow, verified gaps.

### 4.1 `bpf_tracing.h` -- PT_REGS macros

**Location:** `src/bpf_tracing.h`, a 37-line block (lines 348-384), structurally identical in size/depth to the arm64 block (lines 217-253, also 37 lines) and more complete than mips (which lacks the CO-RE syscall macro).

- Arch detection: `#elif defined(__riscv) && __riscv_xlen == 64` (native compile) or `#elif defined(__TARGET_ARCH_riscv)` (BPF skeleton cross-compile). riscv32 is explicitly excluded by the `__riscv_xlen == 64` guard.
- `struct pt_regs___riscv { unsigned long orig_a0; }` -- a CO-RE shadow struct for syscall entry, required because the first syscall argument lives in `orig_a0` at kernel entry, not `a0`. Same pattern as arm64's `orig_x0`.
- `__PT_REGS_CAST(x)` overrides to `struct user_regs_struct *` -- RISC-V exposes `user_regs_struct` to userspace, not `pt_regs`, matching arm64's convention.
- Parameter registers `__PT_PARM1_REG` through `__PT_PARM8_REG` mapped to `a0`-`a7` (RISC-V passes 8 integer arguments in registers, more than x86_64's 6).
- Syscall parameter override: `__PT_PARM1_SYSCALL_REG = orig_a0`; syscall parameters `a0`-`a5` for positions 1-6.
- Special registers: `__PT_RET_REG = ra`, `__PT_FP_REG = s0`, `__PT_RC_REG = a0`, `__PT_SP_REG = sp`, `__PT_IP_REG = pc`.
- ISA extensions used: none -- base RV64I integer registers only. Zero TODO/FIXME markers.

### 4.2 `usdt.c` -- USDT argument parsing

**Location:** `src/usdt.c`, an 85-line implementation (lines 1522-1609), on par with the aarch64 block (59 lines) and x86_64.

- Header-poison workaround: `s8` is poisoned by kernel headers (naming conflict); the file defines `#define rv_s8 s8` inside `#if defined(__riscv)`.
- `calc_pt_regs_off()`: a complete register-name-to-`offsetof(struct user_regs_struct, ...)` table covering all 31 integer registers (`ra`, `sp`, `gp`, `tp`, `a0`-`a7`, `s0`-`s11`, `t0`-`t6`).
- `parse_usdt_arg()`: all three USDT argument encoding forms are handled -- memory dereference (`-8@-88(s0)`), constant (`4@5`), register read (`-8@a1`, no `%` prefix unlike x86).
- No floating-point register support (`fa0`-`fa7`) -- see Section 6.
- NOP-combo detection for uprobe optimization returns `false` on riscv64, as it does on arm64; this is an x86_64-only performance optimization with no correctness impact.

### 4.3 Two additional narrow gaps (verified, not previously documented)

- **`src/bpf.c` `__NR_bpf` syscall-number fallback table:** riscv has no entry. This table is only consulted when `unistd.h` does not already define `__NR_bpf` -- a narrow edge case on older/unusual toolchains, since glibc on riscv64 defines `__NR_bpf` via standard syscall headers in normal use. i386, x86_64, aarch64, sparc, s390, arc, three mips variants, and loongarch all have entries; riscv never has. Confirmed absent by direct inspection of current master (lines 43-66) and by zero hits for `"__NR_bpf riscv"` via `search_code`/`search_commits` repo-wide.
- **`include/linux/compiler.h` memory barriers (`smp_rmb`/`wmb`/`mb`):** only x86_64 (`lock addl`) and aarch64 (`dmb ish*`) get hand-tuned inline assembly. riscv64, like powerpc/s390/sparc/mips/arc/loongarch, falls through to the generic `__sync_synchronize()` builtin, which compiles to a RISC-V `fence` instruction. This is correct but unoptimized -- and it is the default treatment for every architecture except the two most-used ones, not riscv-specific neglect.

### 4.4 Linux kernel BPF JIT (critical runtime dependency, out of libbpf's own scope)

The kernel JIT for riscv64, `arch/riscv/net/bpf_jit_comp64.c` (2,159 lines), is functional but has documented gaps (see Sections 6, 9, 11, 12). It is a separate codebase from libbpf and is not affected by libbpf's grade.

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| PT_REGS macros (`bpf_tracing.h`) | Complete | Complete | Complete |
| Syscall arg macros | Complete (6 args) | Complete (6 args) | Complete (6 args) |
| Function-call arg macros | Complete (6 args) | Complete (8 args) | Complete (8 args) |
| Custom pt_regs struct/cast | Not needed | Yes (`user_pt_regs`) | Yes (`user_regs_struct`) |
| USDT `calc_pt_regs_off()` | Complete | Complete | Complete |
| USDT `parse_usdt_arg()` | Complete | Complete | Complete |
| USDT FP register support | Yes | Yes | No |
| `__NR_bpf` fallback table entry | Yes | Yes | **Missing** |
| Hand-tuned memory barriers | Yes | Yes | No (generic `__sync_synchronize()`) |
| NOP uprobe optimization | Yes | No | No |
| BPF JIT (kernel, separate codebase) | Mature | Mature | Functional, documented gaps (Section 6) |

---

## 5. Build System, Cross-Compilation, and Toolchain

libbpf uses a hand-written GNU Makefile (`src/Makefile`). There is no CMake, no autoconf, and no per-architecture Dockerfile anywhere in the repository (confirmed: repo root contains only `.github, assets, ci, docs, fuzz, include, scripts, src, LICENSE*, README.md, SYNC.md, .readthedocs.yaml`; no `CMakeLists.txt`, `setup.py`, `go.mod`, `Cargo.toml`, or `package.json` exist).

**Native build on riscv64:**
```
cd src && make
```

**Cross-compile from x86_64** (standard `CROSS_COMPILE` prefix convention, via `allow-override` in the Makefile):
```
cd src
CROSS_COMPILE=riscv64-linux-gnu- BUILD_STATIC_ONLY=y \
  OBJDIR=../build DESTDIR=../root make install
```

**Cross-compile with explicit pkg-config sysroot:**
```
cd src
PKG_CONFIG_PATH=/sysroot/riscv64/lib/pkgconfig \
CROSS_COMPILE=riscv64-linux-gnu- \
DESTDIR=/output make install
```

**QEMU Docker build** (matches the pattern used by `build.yml` for other architectures; riscv64 is not in that matrix today but the mechanism transfers directly since `docker/setup-qemu-action` supports `linux/riscv64` as a platform value):
```
docker run --rm --platform linux/riscv64 \
  -v $(pwd):$(pwd) -e GITHUB_WORKSPACE=$(pwd) \
  ubuntu:noble $(pwd)/ci/build-in-docker.sh
```

**Hard build/runtime dependencies (via pkg-config):** `libelf` and `zlib`, declared directly in `src/Makefile` (`ALL_CFLAGS += $(shell $(PKG_CONFIG) --cflags libelf zlib)`, `ALL_LDFLAGS += -lelf -lz`). `pkg-config` itself is required unless `NO_PKG_CONFIG=1` is set, which falls back to `-lelf -lz` directly.

**Toolchain requirements:** No minimum GCC version is documented for any architecture, riscv64 included; CI tests gcc-10 through gcc-12 and clang-14 through clang-16 on amd64/other tested arches, with no riscv64-specific minimum stated anywhere. Clang/LLVM 10+ is required only to compile BPF programs that libbpf will load, not to build libbpf itself.

**`LIBSUBDIR` behavior:** the Makefile detects 64-bit targets via `$(CC) -dumpmachine`; on `riscv64-linux-gnu` toolchains the machine string ends in `64`, so `LIBSUBDIR` resolves to `lib64` correctly.

**No dedicated riscv64 build documentation exists.** There is no `BUILDING.md`, `INSTALL`, `docs/building.md`, or `docs/cross-compilation.md`; the only build instructions anywhere are the generic ones in `README.md` and `src/Makefile`. The `CROSS_COMPILE=riscv64-linux-gnu-` invocation above is inferred from the Makefile's generic cross-compile handling, not stated explicitly for riscv64 anywhere in project documentation.

**No known build failures on riscv64.** The Debian `rv-manda-04` buildd successfully built libbpf 1.7.0-1 for riscv64 (the build that underlies the current sid package, described further in Section 8).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap type |
|---------|-------|-------|---------|----------|
| kprobe/uprobe attach via PT_REGS | Full | Full | Full | None |
| Syscall argument access (kprobe) | Full | Full | Full | None |
| USDT probe attachment | Full | Full | Full | None |
| USDT FP register args (`fa0`-`fa7`) | Supported | Supported | Not supported | Functional |
| USDT integer register args | Full | Full | Full | None |
| BPF CO-RE relocations | Full | Full | Full | None |
| `__NR_bpf` syscall fallback table entry | Yes | Yes | Missing | Functional (narrow, toolchain-edge-case only) |
| BPF tail calls | Full | Full | Functional (no bpf2bpf mixing) | Functional (kernel JIT) |
| BPF exceptions (`bpf_throw`) | Full | Full | Not supported; a patch series adding `arch_bpf_stack_walk()` and register-save changes was posted in a June 2026 mailing-list thread but is not confirmed merged [NEEDS VERIFICATION -- exact submission date and author attributed only in the prior version of this report] | Functional (kernel JIT) |
| 64-bit atomics (cmpxchg, xchg, add, and, or, xor) | Full | Full | Full | None |
| 1-byte / 2-byte RMW atomics | Full | Full | Not supported | Functional (kernel JIT) |
| Hand-tuned memory barriers | Yes | Yes | No (generic fence via `__sync_synchronize()`) | Micro-performance |
| Speculative-execution barrier (BPF_NOSPEC / `fence.i`) | Full | Full | Patch reportedly under review, not confirmed merged [NEEDS VERIFICATION -- single-sourced] | Security hardening |
| NOP uprobe optimization | Yes | No | No | Performance (minor, shared with arm64) |

**USDT FP-register gap:** if a probe argument is passed in a floating-point register, libbpf on riscv64 cannot parse it. This affects only USDT-style probes whose call sites pass FP-typed arguments -- a narrow real-world case. No bug report against this gap exists in the libbpf tracker.

**Tail-call / bpf2bpf mixing gap:** a kernel-level JIT limitation, not a libbpf limitation; affected selftest categories are denylisted for riscv64 in the kernel's `DENYLIST.riscv64`.

**Performance commentary (qualitative only, no benchmark numbers located):** [The New Stack, "The RISC architecture frontier: Is eBPF ready for ARM64 and RISC-V?", 2026-02-10](https://thenewstack.io/the-risc-architecture-frontier-is-ebpf-ready-for-arm64-and-risc-v/) quotes Bill Mulligan (Isovalent/Cisco): "ARM64 is already spinning at full speed while RISC-V is just starting to spin that wheel," citing "slightly higher CPU usage per probe execution" at high-frequency profiling (10k+ events/sec) without giving a concrete percentage, and Nikola Grcevski (Grafana Labs) characterizing the RISC-V JIT as "still catching up" relative to x86_64 ("the gold standard") and arm64. The same article notes RISC-V's weaker memory-ordering model can surface "subtle bugs in complex eBPF programs that rely on specific memory ordering," and that most RISC-V eBPF testing today happens on QEMU rather than physical silicon. A FOSDEM 2026 talk abstract ("eBPF Observability on RISC: What Works, What Breaks, and How to Test It," Yuning Liang/DeepComputing and Bruce Gain) states "RISC-V support exists but remains incomplete" with no numeric results in the abstract itself. [NEEDS VERIFICATION -- no quantitative benchmark data for libbpf/eBPF on riscv64 was located by any research pass despite targeted searches; treat all performance commentary above as qualitative industry opinion, not measured results.]

---

## 7. CI/CD Infrastructure

**libbpf upstream CI has no riscv64 coverage of any kind.** This was independently confirmed twice: once by reading all workflow files in `.github/workflows/` (`build.yml`, `cifuzz.yml`, `codeql.yml`, `coverity.yml`, `lint.yml`, `ondemand.yml`, `pr-policy.yml`, `test.yml`, `vmtest.yml`), and again by a separate adversarial pass that directly `grep -i riscv`'d each raw file from `raw.githubusercontent.com` and found zero matches in every one.

- **`build.yml` (cross-arch build matrix):** tests `aarch64`, `ppc64le`, `s390x`, `amd64` via Docker + QEMU binfmt (`docker/setup-qemu-action`) against `ubuntu:noble`. riscv64 is absent from this matrix.
- **`test.yml` / `vmtest.yml` (functional BPF selftests via QEMU-based VM boot):** single matrix entry, `arch: x86_64`. `vmtest.yml`'s `arch` input defaults to `x86_64` and is only ever invoked with `x86_64`.
- **`ondemand.yml`:** `workflow_dispatch`-only trigger; `arch` input defaults to `x86_64` and is a free-text string with no enum restriction, so a maintainer could in principle manually dispatch it with `arch=riscv64` -- but no evidence exists that this has ever been done, and `ci/vmtest/configs/` contains no riscv64-specific config or denylist file, only an s390x-specific one. This is a theoretical, unused surface, not functioning riscv64 CI.
- `cifuzz.yml`, `codeql.yml`, `coverity.yml`, `lint.yml`, `pr-policy.yml` are architecture-agnostic (fuzzing, static analysis, PR-policy checks) and contain no riscv references.
- The only case-insensitive "riscv" hits anywhere under `.github/` are inside `.github/actions/build-selftests/vmlinux.h`, a generated kernel BTF/vmlinux header bundled for selftest builds (enum identifiers like `CPUHP_AP_IRQ_RISCV_IMSIC_STARTING`, `BCJ_RISCV`) -- kernel type data, unrelated to CI triggers or runner configuration.
- No other CI system exists: `.gitlab-ci.yml`, `Jenkinsfile`, `.cirrus.yml`, `.travis.yml`, `azure-pipelines.yml` are all absent from the repo root.
- A dormant reference exists in `ci/helpers.sh`: `platform_to_kernel_arch()` maps `riscv64 -> riscv` (the kernel architecture name), but this mapping is never exercised because no workflow ever passes `riscv64` as the target arch.

**RISE runner constraint:** the RISE RISC-V Runners service (Scaleway EM-RV1 nodes, kernel 5.10.x) "does not support virtualization" per its own announcement. The vmtest functional-test path requires QEMU VM boot, which requires virtualization -- so even if riscv64 were added to the vmtest matrix today, it could not run on RISE's current runner fleet without either a GitHub-Actions-hosted QEMU-emulated path or hardware runners with virtualization support. The RISE runners are used by llama.cpp, PyTorch, containerd, Kubernetes, k3s, DuckDB, NumPy, and Wazero; libbpf is not among the projects using them.

| CI capability | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build validation (`build.yml`) | Yes | Yes | No |
| Functional BPF selftests (vmtest) | Yes | No | No |
| Fuzzing (cifuzz) | Yes | No | No |
| Static analysis (CodeQL, Coverity) | Yes | No | No |
| Lint | Yes | No | No |
| RISE runner coverage | No | No | No |

---

## 8. Distribution and Release Status

**GitHub releases:** ship source archives only. Direct API/file access to `libbpf/libbpf` was blocked across every research pass in this session (GitHub MCP access restricted to a single unrelated repository; raw API fetches returned 403). The rendered releases page for v1.7.0, v1.6.3, and v1.6.2 shows "Assets 2" per release, consistent with GitHub's default auto-generated `Source code (zip)` + `Source code (tar.gz)` pair and no custom-uploaded binaries, but individual asset filenames could not be confirmed. [NEEDS VERIFICATION -- release-asset content is inferred from UI asset counts, not a confirmed filename listing; this gap should be re-checked once repository access is available.]

**Debian (sid):** `libbpf1` version `1:1.7.0-1` is built and installed for riscv64 on buildd `rv-manda-04`; `libbpf-dev` is likewise available. Debian stable carries an older `1.5.0-3`. `dwarves` `1.31-2` and `zlib` `1:1.3.dfsg+really1.3.2-3` are also built for riscv64 on Debian buildds (`rv-osuosl-01`, `rv-manda-03`).

**Ubuntu 26.04 (resolute):** directly confirmed via a live fetch of `https://packages.ubuntu.com/resolute/riscv64/libbpf1` (HTTP 200): `libbpf1` version `1:1.6.3-1ubuntu1`, source package `libbpf`, served from the "ports" pocket (Ubuntu's secondary-architecture archive for riscv64/armhf/ppc64el/s390x). `libbpf-dev` at the same version and pocket is likewise confirmed for riscv64. A companion family of packages is also present for resolute/riscv64: `libbpf-cargo`, `libbpf-cargo-dev`, `libbpf-tools`, `libbpfcc`, `libbpfcc-dev`, `libbpfilter-dev`, `libbpfilter0`, `libbpftune-dev`, `libbpftune0`, `librust-libbpf-rs-dev`, `librust-libbpf-sys-dev`. One nuance worth flagging: a full-archive search summary lists `libbpf-dev` in the primary/universe pocket as `0.31.0+ds-7ubuntu2: amd64 arm64` only (no riscv64) -- the riscv64 build is a separately versioned upload served from the ports pocket, which is easy to miss if reading only the summary table rather than the direct per-architecture package page.

**Arch Linux RISC-V (`archriscv.felixc.at`):** `libbpf` is not listed on the RISC-V port tracker; no Arch riscv64 build of libbpf exists. The related `bcc-libbpf-tools-0.36.1-3-riscv64.pkg.tar.zst` package does exist in the `archriscv.felixc.at` extra repository, but standalone `libbpf` does not.

**PyPI:** no package named `libbpf` exists (`https://pypi.org/pypi/libbpf/json` and `https://pypi.org/simple/libbpf/` both return HTTP 404). libbpf is a C library with no Python wrapper distributed through PyPI; riscv64 wheel availability is not applicable.

**RISE wheel builder** (`https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/libbpf/`): redirects to the nonexistent PyPI entry (302 -> 404). No riscv64 wheels exist there either, consistent with PyPI having no `libbpf` package at all.

**User path to a working binary:** on Debian sid or Ubuntu 26.04 (resolute) riscv64, `apt install libbpf-dev` installs the library and headers directly from unmodified upstream source, with no manual build step required. Building tools that use libbpf from source requires only a working `riscv64-linux-gnu` toolchain with libelf and zlib available.

---

## 9. Dependencies

Direct dependencies, exactly as scoped for this project, plus indirect dependencies surfaced by research:

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Notes / Blocking issues |
|---|---|---|---|---|---|
| elfutils | runtime-dependency, critical -- ELF parsing, BTF loading (`-lelf` via pkg-config) | Passing: Debian sid 0.195-1, built on `rv-manda-04` | Distribution QA only; no upstream riscv64 CI | Released in elfutils 0.195+ | No riscv64-relevant open issues found via live `search_issues` against `libbpf/libbpf` (0 results). elfutils' own Sourceware Bugzilla is unreachable behind Anubis bot-protection in this session, so elfutils' own tracker could not be searched directly. [NEEDS VERIFICATION -- elfutils' own bug tracker was never reachable] |
| zlib | runtime-dependency, critical -- compressed BTF decompression (`-lz` via pkg-config) | Passing: Debian sid `1:1.3.dfsg+really1.3.2-3`, built on `rv-manda-03` | No riscv64-specific upstream CI | Current release | Live `search_issues riscv64 repo:madler/zlib` returned 0 riscv-relevant hits (results were s390x/32-bit/Windows/ARM64 issues) -- confirms no known riscv64 blockers. |
| zlib-ng | runtime-dependency, optional -- SIMD-accelerated zlib substitute, listed as an optional dependency in this project's manifest | Passing today; repo has `arch/riscv` with RVV and Zbc intrinsics | QEMU-based CI covers riscv64 RVV/Zbc code paths | Ships with riscv64 SIMD support | Live `search_issues riscv64 repo:zlib-ng/zlib-ng` surfaced 9 riscv-related issues, **all closed**: #1997 "RISC-V Zbc extension detection is broken," #2148 "`crc32_riscv64_zbc` undeclared" build error, #941 "riscv64 support in cmake is broken," #1936 crossbuild x86_64->riscv64 with `-static-pie` illegal instruction, #1670 "RISC-V and unaligned memory access," among others. This is a real history of riscv64-specific bugs, all resolved, none open today -- indicating riscv64 was historically the least mature zlib-ng target, now stabilized. |
| dwarves | build-dependency, optional -- BTF generation from DWARF for CO-RE kernels (pahole) | Passing: Debian sid 1.31-2, built on `rv-osuosl-01` | No upstream riscv64 CI; distribution QA only | Released | `search_issues repo:acmel/dwarves` could not complete live in this session (GitHub App rate-limit contention from concurrent workflow runs, no clean retry window). [NEEDS VERIFICATION -- not independently re-confirmed this run; no known blockers per the single source that did check] |
| GCC | build-dependency, critical -- primary toolchain for building libbpf itself | riscv64-linux-gnu cross toolchain and native GCC both work via the Makefile's `CROSS_COMPILE`/`allow-override` mechanism (Section 5) | N/A | N/A | No minimum GCC version is documented for any architecture, riscv64 included. No riscv64-specific GCC bug affecting libbpf was found. |
| LLVM | test-dependency, critical -- Clang/LLVM is required to compile the BPF programs that libbpf's tests and selftests load, not to build libbpf itself | LLVM has a full riscv64 backend | No open issues found at the intersection of BPF and RISC-V in `llvm-project` per the existing research base | Ships in regular LLVM releases | No known blockers. |
| Linux kernel | runtime-dependency, critical -- the kernel BPF JIT (`arch/riscv/net/bpf_jit_comp64.c`) and BPF syscall interface are the functional runtime prerequisite for anything libbpf loads | Functional, 2,159 lines, shipped in mainline | Kernel BPF selftests; entries on `DENYLIST.riscv64` for unsupported categories | Shipped in mainline Linux | Known open gaps: 1-byte/2-byte RMW atomics unsupported; BPF exceptions unsupported (patch posted, not confirmed merged); bpf2bpf+tailcall mixing unsupported; `fence.i`/BPF_NOSPEC patch reportedly under review [NEEDS VERIFICATION on exact status of the last two -- see Section 11]. These are kernel-side JIT limitations, not libbpf limitations, and do not affect libbpf's own readiness grade. |
| QEMU | test-dependency, optional -- used in libbpf's own CI (aarch64/ppc64le/s390x Docker cross-builds via `docker/setup-qemu-action`) and in downstream riscv64 testing (zlib-ng's QEMU-based riscv64 CI, general riscv64 development/emulation) | N/A (tooling, not a library link dependency) | Supports riscv64 emulation broadly; used by zlib-ng's riscv64 CI and general riscv64 development workflows | N/A | The New Stack (Feb 2026) specifically calls out that most RISC-V eBPF testing today happens on QEMU rather than physical silicon, which "hides hardware-specific timing quirks, cache behavior, and JIT edge cases" -- a caveat on how much QEMU-only test coverage is worth for riscv64 eBPF work specifically. |

**libbpf itself, as a dependency target:** live `search_issues riscv64 repo:libbpf/libbpf` returned 0 results. No open riscv64 issues exist against libbpf; the only two historical closed riscv-related issues are catalogued in Section 11.

**Project-graph database cross-check:** unavailable this run. The `project-graph` MCP server returned `CONNECTION_CLOSED` on every call attempt across multiple independent passes. This is an infrastructure failure, not evidence of absence -- no Ubuntu 26.04 riscv64 graph-backed verification of this dependency table could be run, and the table above relies entirely on direct live HTTP verification (packages.ubuntu.com, GitHub search endpoints) as a substitute.

---

## 11. Known Bugs and Active Issues

### `libbpf/libbpf` repository -- riscv64-specific

No open riscv64-specific issues or PRs exist (confirmed: `search_issues riscv64 repo:libbpf/libbpf` and `search_issues riscv repo:libbpf/libbpf` both return 0 results). Two historical closed issues:

| ID | Title | Status | Notes |
|----|-------|--------|-------|
| [#616](https://github.com/libbpf/libbpf/issues/616) | libbpf: support >5 PT_REGS_PARMx() | Closed 2023-01-26 | Resolved by the PARM6-PARM8 addition for RISC-V (and other architectures) in commits `ed66fb29`/`9db84de5`. |
| [#916](https://github.com/libbpf/libbpf/issues/916) | Query: why riscv64 maps to "riscv" for `__TARGET_ARCH_` | Closed 2025-08-21 | Informational; intentional behavior confirmed. |

A broader semantic `search_issues riscv64 bug repo:libbpf/libbpf` surfaced 11 results (#793, #796, #864, #804, #764, #737, #483, #482, #644, #433, #150), but none of these mention RISC-V anywhere in the title or are architecture-specific -- they are generic memory-safety/fuzzing findings matched only by the word "bug," not by architecture relevance.

### Kernel BPF JIT (riscv64) -- affects libbpf users but tracked outside this repository

The following table is carried forward from the existing report; beyond the general category confirmation in Section 13's grade justification (exceptions, sub-word atomics, bpf2bpf+tailcall mixing, and the `fence.i` patch are all independently named there as open kernel-side JIT gaps), the specific commit SHAs, exact dates, and review status below are single-sourced and should be treated as [NEEDS VERIFICATION]:

| Patch / commit | Date | Status | Severity | Description |
|---|---|---|---|---|
| [22cc16c04b78](https://github.com/torvalds/linux/commit/22cc16c04b78) | 2025-12-19 | Accepted | Critical | Wrong flag check in BPF trampoline caused kernel stack overflow. |
| riscv: bpf: Fix uninitialized symbol 'retval_off' | 2025-09-22 | Accepted | High | Uninitialized variable in BPF trampoline. |
| riscv, bpf: fix reads of thread_info.cpu | 2025-08-12 | Accepted | High | Incorrect load width reading CPU ID in BPF percpu ops. |
| riscv, bpf: Fix possible infinite tailcall with CONFIG_CFI_CLANG | 2024-10-08 | Accepted | High | Infinite loop under CFI. |
| riscv, bpf: Make BPF_CMPXCHG fully ordered | 2024-10-17 | Accepted | High | Memory-ordering bug in atomic compare-exchange. |
| riscv: bpf: big endian fixes, updated BPF_ALU ops | 2024-12-20 | RFC, not merged | Medium | Big-endian correctness fixes. |
| riscv, bpf: Fix signed operations and add 32-bit atomics | 2026-05-11 (v2) | Under review | High | Fixes BPF_SDIV, BPF_SMOD, BPF_MOVSX in the RV32 JIT. |
| riscv, bpf: Emit fence.i for BPF_NOSPEC | 2025-12-28 | Changes requested | Medium | Missing speculative-execution barrier. |

### Kernel `DENYLIST.riscv64` (active functional gaps)

| Entry | Reason | Patch status |
|---|---|---|
| `exceptions` | JIT does not support BPF exceptions (`bpf_throw`) | A patch series adding `arch_bpf_stack_walk()` and callee-saved-register-save JIT changes was posted in a June 2026 thread; the series itself notes "mixing of tail_calls and bpf-to-bpf calls is not supported." Merge status not confirmed. [NEEDS VERIFICATION] |
| `tailcalls/tailcall_bpf2bpf*` | JIT does not support mixing bpf2bpf calls and tail calls | No active patch found. |

### `libbpf` source-level gaps (design limitations, not tracked as filed bugs)

- No floating-point register support (`fa0`-`fa7`) in USDT argument parsing (`usdt.c`) -- integer registers only.
- `s8` register requires the `rv_s8` poison-workaround macro due to a kernel-header naming conflict -- a code-quality note, not a functional bug.
- `__NR_bpf` syscall-number fallback table has no riscv entry in `src/bpf.c` (Section 4.3) -- narrow toolchain-edge-case gap, no filed issue found.

---

## 12. Objections and Upstream Blockers

**No stated objections to RISC-V support exist anywhere in the research.** Contributions from five organizations (Intel/kernel.org, IBM, Huawei, Rivos, Gentoo) plus Meta's own completion work have all merged without recorded pushback, following the exact process used for every other architecture.

**Absence of riscv64 from the CI matrix is a gap of omission, not deliberate exclusion.** No issue or PR requesting its addition to `build.yml` was found (live search: 0 riscv-related issues or PRs of any kind against `libbpf/libbpf`). The mechanism to add it is low-friction: `build.yml`'s Docker+QEMU binfmt cross-build pattern already supports `linux/riscv64` as a platform value for `docker/setup-qemu-action`; only a matrix-array entry is missing.

**vmtest functional-test path has an infrastructure blocker, not a policy blocker.** RISE's own riscv64 runner fleet (Scaleway EM-RV1) explicitly lacks virtualization support, which the kernel-VM-boot-based vmtest framework requires. `ci/helpers.sh` already has the `riscv64 -> riscv` kernel-arch mapping in place; the missing pieces are QEMU riscv64 installation in `run-qemu/action.yml` and a riscv64 case in `run-qemu/run.sh`.

**Kernel JIT gaps are kernel-side blockers, not libbpf blockers.** The `DENYLIST.riscv64` entries (exceptions, bpf2bpf+tailcall mixing) require Linux kernel changes; libbpf itself needs no modification for these to resolve.

**Acceptance probability for a CI-matrix addition:** assessed as high based on precedent -- the de facto maintainer (Andrii Nakryiko, Meta) has never blocked a riscv64 contribution, the QEMU cross-build infrastructure already exists for three other secondary architectures, and no organizational resistance of any kind was found in any research pass.

---

## 13. Readiness Assessment

- **Color:** Yellow (clean-distro-build)
- **Release provider:** distro
- **Justification:** libbpf has no upstream riscv64 CI at all, confirmed by reading `build.yml`, `test.yml`, `vmtest.yml`, `ondemand.yml`, and every other workflow file in the repository: the cross-arch build matrix covers only aarch64/ppc64le/s390x/amd64, and functional CI is x86_64-only (see [build.yml](https://github.com/libbpf/libbpf/blob/master/.github/workflows/build.yml)). It also ships no upstream riscv64 release artifacts -- GitHub releases are source-only tarballs. This triggers the distribution floor: Debian sid (`libbpf1` `1:1.7.0-1`, built on `rv-manda-04`) and Ubuntu 26.04 resolute (`libbpf1` `1:1.6.3-1ubuntu1`, confirmed via [packages.ubuntu.com/resolute/riscv64/libbpf1](https://packages.ubuntu.com/resolute/riscv64/libbpf1)) both build and ship riscv64 packages from unmodified upstream source. riscv64 register/syscall/USDT support is complete at the source level (`src/bpf_tracing.h`, `src/usdt.c`) and is fully upstream via the kernel `bpf-next` tree, with no evidence of riscv64-specific packaging patches or build workarounds required anywhere in the Debian or Ubuntu build logs reviewed. That places the project at yellow (clean-distro-build), not orange (downstream-only patched), because the distro builds are not patching around upstream deficiencies -- they are simply building what upstream ships, unmodified. libbpf is not an optimization-purpose project: it is a userspace BPF-loader/ELF/BTF library with no JIT, SIMD, or crypto code of its own (the actual BPF JIT lives in the Linux kernel, out of scope for this grade), so the optimization-level modifier does not apply and does not cap the grade further.
- **Pending work that could change the grade:** No open riscv64-related issues or PRs exist in `libbpf/libbpf` (confirmed by live search: zero). The only concrete path to a higher grade is upstream adding riscv64 to the `build.yml` cross-arch matrix (a low-friction, approximately 0.5-person-week change, Section 14) and/or establishing a functional riscv64 test path; neither is currently in flight. No RISE involvement or funding was found for libbpf at any point in this research (Section 1). Kernel-side BPF JIT gaps (exceptions, sub-word atomics, bpf2bpf+tailcall mixing, the `fence.i` patch) are Linux-kernel riscv64 JIT limitations, not libbpf limitations, and do not affect this grade.

---

## 14. Investment Analysis

RISE has no prior investment in libbpf (Section 1). All RISC-V work to date was contributed by individual developers and their employers (Intel/kernel.org, IBM, Huawei, Rivos, Gentoo, Meta) through the standard kernel-mailing-list process; none of it was RISE-coordinated, and no RISE funding request or wheel-builder entry exists for this project.

### 14.1 Functional Enablement

The library is functionally complete on riscv64 for all common use cases. Remaining gaps are narrow:

1. USDT floating-point register argument support (`fa0`-`fa7`) -- affects only probes whose arguments are FP-typed at the call site.
2. `__NR_bpf` syscall-number fallback-table entry in `src/bpf.c` -- affects only toolchains where `unistd.h` does not already define `__NR_bpf`, which is not the common case on riscv64/glibc.
3. Kernel BPF JIT: exceptions and bpf2bpf+tailcall mixing -- require kernel changes, not libbpf changes.

### 14.2 Performance Optimization

No performance gaps exist within libbpf itself -- it contains no SIMD code or architecture-specific hot paths. The one micro-optimization gap (generic vs. hand-tuned memory barriers) mirrors the treatment every non-x86_64/arm64 architecture receives and is not riscv64-specific neglect. All performance commentary found in industry sources (Section 6) concerns the kernel BPF JIT's code-generation maturity, which is out of libbpf's scope.

### 14.3 CI/CD Infrastructure

This is the most actionable investment area and the direct driver of the current grade. Adding riscv64 to the `build.yml` cross-build matrix is a small, well-precedented change (one matrix entry, reusing the existing QEMU binfmt mechanism already exercised for three other architectures). Adding riscv64 to the functional `vmtest` path is a larger effort requiring either QEMU-VM support in GitHub Actions or a virtualization-capable riscv64 hardware runner -- the RISE RISC-V Runners fleet does not currently support virtualization and cannot host this without infrastructure changes.

### 14.4 Ecosystem Enablement

Not applicable. libbpf is a C library with no dependent package ecosystem (no PyPI, npm, or similar downstream package surface of its own to enable on riscv64). Downstream tools that depend on libbpf (bpftool, bcc, bpftrace) have their own independent riscv64 status and are outside this report's scope.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI | Add riscv64 to `build.yml` cross-build matrix | 0.5 | Upstream (libbpf maintainer, Meta) | High |
| CI | Add riscv64 QEMU vmtest path in `run-qemu/run.sh` and `action.yml` | 2 | Upstream (libbpf maintainer, Meta) | High |
| CI | Integrate riscv64 CI with RISE runners (contingent on virtualization support being added to the runner fleet) | 1 | RISE infrastructure + upstream | Medium |
| Functional | USDT FP register support in `usdt.c` (`fa0`-`fa7`) | 1 | Upstream contribution | Low |
| Functional | `__NR_bpf` fallback-table entry for riscv in `src/bpf.c` | 0.1 | Upstream contribution | Low |
| Functional | BPF exceptions support in the kernel riscv64 JIT | 3-4 (kernel work, not libbpf) | Rivos / Huawei / kernel BPF community | High (kernel-scoped) |
| Functional | bpf2bpf + tail-call mixing in the kernel riscv64 JIT | 4-6 (kernel work, not libbpf) | Kernel BPF community | Medium (kernel-scoped) |
| Security | `BPF_NOSPEC`/`fence.i` patch (reportedly under review) | 0 (patch exists per single-source evidence; needs review bandwidth) [NEEDS VERIFICATION] | Upstream reviewer | Medium |

**Total libbpf-specific effort (excluding kernel JIT work):** approximately 4.6 person-weeks to bring riscv64 to CI parity with aarch64.

**Qualification:** the library requires no investment to be functionally usable on riscv64 today via Debian sid or Ubuntu 26.04 packages built from unmodified upstream source. Investment in CI is the primary lever available -- it would prevent silent regressions and would be the concrete change needed to move the project's grade above yellow, since the distribution floor is currently the ceiling in the absence of any upstream riscv64 validation.

---

## 15. References

- [libbpf/libbpf GitHub repository](https://github.com/libbpf/libbpf)
- [libbpf documentation (readthedocs)](https://libbpf.readthedocs.io/)
- [eBPF Foundation](https://ebpf.io/foundation/)
- [Commit 7beaa2ef: initial RV64 PT_REGS support (Bjorn Topel)](https://github.com/libbpf/libbpf/commit/7beaa2ef90ede98dae9e6d1e0c48ef4f6c215f0b)
- [Commit 497ec1d3: fix riscv register names (Ilya Leoshkevich, IBM)](https://github.com/libbpf/libbpf/commit/497ec1d35ca3bb824f9345e32b665157077b1746)
- [Commit 32c19d85: fix syscall argument access on riscv (Ilya Leoshkevich, IBM)](https://github.com/libbpf/libbpf/commit/32c19d8505ff32fe84d16277232bb7f0b645d63a)
- [Commit eb2b2160: support riscv USDT argument parsing (Pu Lehui, Huawei)](https://github.com/libbpf/libbpf/commit/eb2b216081c3acca7f7657203b38414ff8a2de9f)
- [Commit 8498996f: use a0 for RC register (Yixun Lan, Gentoo)](https://github.com/libbpf/libbpf/commit/8498996f9fb347dea51dbe678867884358a978f2)
- [Commit 9db84de5: complete riscv arch spec, PARM6-PARM8 (Andrii Nakryiko, Meta)](https://github.com/libbpf/libbpf/commit/9db84de5f0b7b0160c8d5ea698f7fe2353d066a3)
- [Commit ed66fb29: define riscv syscall regs spec (Andrii Nakryiko, Meta)](https://github.com/libbpf/libbpf/commit/ed66fb297d7895e879b30bc4d808e25843a64902)
- [Commit 6a6cf6dc: fix comment about arc and riscv arch in bpf_tracing.h](https://github.com/libbpf/libbpf/commit/6a6cf6dcdc711450a25dbf68b930f482f5274473)
- [Commit 20c1170e: fix syscall wrapper for riscv ARCH_HAS_SYSCALL_WRAPPER (Alexandre Ghiti, Rivos)](https://github.com/libbpf/libbpf/commit/20c1170ea4044852e79297c66d6e1a7734d28984)
- [Commit 9045c3ab: fix accessing first syscall argument on RV64 (Pu Lehui, Huawei)](https://github.com/libbpf/libbpf/commit/9045c3ab53519869051b365bbfa7a1c3b4d2a525)
- [PR #686: fix comment about arc provides user_regs_struct (closed, not merged)](https://github.com/libbpf/libbpf/pull/686)
- [Issue #616: libbpf: support >5 PT_REGS_PARMx()](https://github.com/libbpf/libbpf/issues/616)
- [Issue #916: query on riscv64 target arch mapping](https://github.com/libbpf/libbpf/issues/916)
- [libbpf CI build.yml](https://github.com/libbpf/libbpf/blob/master/.github/workflows/build.yml)
- [libbpf CI test.yml](https://github.com/libbpf/libbpf/blob/master/.github/workflows/test.yml)
- [libbpf CI vmtest.yml](https://github.com/libbpf/libbpf/blob/master/.github/workflows/vmtest.yml)
- [libbpf CI run-qemu/action.yml](https://github.com/libbpf/ci/blob/main/run-qemu/action.yml)
- [libbpf CI helpers.sh](https://github.com/libbpf/ci/blob/main/helpers.sh)
- [Linux kernel DENYLIST.riscv64](https://github.com/torvalds/linux/blob/master/tools/testing/selftests/bpf/DENYLIST.riscv64)
- [Linux kernel BPF JIT for riscv64](https://github.com/torvalds/linux/blob/master/arch/riscv/net/bpf_jit_comp64.c)
- [Kernel commit 22cc16c04b78: fix incorrect BPF_TRAMP_F_ORIG_STACK usage](https://github.com/torvalds/linux/commit/22cc16c04b78)
- [Debian packages: libbpf1 riscv64 (sid)](https://packages.debian.org/sid/riscv64/libbpf1)
- [Ubuntu 26.04 resolute libbpf1 riscv64 package page](https://packages.ubuntu.com/resolute/riscv64/libbpf1)
- [Ubuntu package search: libbpf, suite=resolute](https://packages.ubuntu.com/search?keywords=libbpf&suite=resolute&searchon=names&section=all)
- [Arch Linux RISC-V port tracker](https://archriscv.felixc.at/)
- [PyPI: libbpf (not found)](https://pypi.org/pypi/libbpf/json)
- [RISE Project blog](https://riseproject.dev/blog)
- [RISE Project members](https://riseproject.dev/members/)
- [RISE wheel_builder package index](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [riscv-elf-psabi-doc: RISC-V calling conventions](https://github.com/riscv-non-isa/riscv-elf-psabi-doc/blob/master/riscv-cc.adoc)
- [zlib-ng GitHub repository (dependency riscv64 issue history)](https://github.com/zlib-ng/zlib-ng)
- [The New Stack: "The RISC architecture frontier: Is eBPF ready for ARM64 and RISC-V?" (2026-02-10)](https://thenewstack.io/the-risc-architecture-frontier-is-ebpf-ready-for-arm64-and-risc-v/)
- [FOSDEM 2026: "eBPF Observability on RISC: What Works, What Breaks, and How to Test It"](https://fosdem.org/2026/schedule/event/8SRBCB-ebpf_observability_on_risc_what_works_what_breaks_and_how_to_test_it/)