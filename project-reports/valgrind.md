---
title: Valgrind
parent: Project Reports
categories:
  - debug
---

# Valgrind

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for Valgrind<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[Valgrind](https://valgrind.org/) is a dynamic binary instrumentation framework providing memory error detection (Memcheck), data-race detection (Helgrind, DRD), call-graph profiling (Callgrind), and heap profiling (Massif). It operates by translating guest binary code into an intermediate representation (VEX IR) and re-emitting instrumented code for the host. It is licensed under GPLv3-or-later, hosted at [sourceware.org](https://sourceware.org/git/valgrind.git), and has no formal foundation. Sourceware.org is operated by Red Hat. Valgrind is not a RISE Project member.

The current upstream release is **3.27.1** (released 20 May 2026), which lists riscv64/linux as a supported platform.

---

## 2. Port History and Upstreaming Timeline

The riscv64 port was initiated by **Petr Pavlu** (SUSE) on **2020-12-09** in the standalone development fork [petrpavlu/valgrind-riscv64](https://github.com/petrpavlu/valgrind-riscv64), branch `riscv64-linux`. The first commit subject was `riscv64: Add host definitions`. [NEEDS VERIFICATION - single source: fork repository metadata]

The fork developed over approximately four years with contributions from the following individuals: laokz, Xeonacid, JackGittes (zhaomingxin), and rjiejie. 9 pull requests were merged into the fork branch and 2 were closed without merge.

The port was presented publicly at FOSDEM 2022 on February 6, 2022 (talk: "Valgrind on RISC-V", speaker: Petr Pavlu). [NEEDS VERIFICATION - single source: archive.fosdem.org]

**Upstream merge:** Valgrind **3.25.0** (released 25 April 2025) was the first release with official RISCV64/Linux support. The release notes state: "Added RISCV64 support for Linux. Specifically for the RV64GC instruction set." This resolved upstream Bugzilla [bug 468575](https://sourceware.org/bugzilla/show_bug.cgi?id=468575) ("Add support for RISC-V"), which served as the master tracking issue. The corresponding fork tracking issue [#3](https://github.com/petrpavlu/valgrind-riscv64/issues/3) ("Prepare for upstream?") remains open on the fork despite the merge having occurred.

Timeline summary:

| Date | Event |
|---|---|
| 2020-12-09 | First commit in petrpavlu/valgrind-riscv64 fork |
| 2022-02-06 | FOSDEM 2022 presentation |
| 2025-04-25 | Valgrind 3.25.0 -- first upstream release with riscv64/linux |
| 2025-10-24 | Valgrind 3.26.0 -- NaN-boxing and compiler warning fixes |
| 2026-04-20 | Valgrind 3.27.0 -- shift instruction correctness fix |
| 2026-05-20 | Valgrind 3.27.1 -- current release; riscv64/linux listed as fully supported |

---

## 3. Upstream Support Tier

Valgrind has no published tier policy. The project documentation states that each new port requires substantial ongoing maintainer commitment because Valgrind is deeply coupled to CPU and OS internals. The history of the RISC-V port -- roughly 4 years from first development commit to upstream acceptance -- is consistent with this position.

**No official RISC-V maintainer is listed** on the upstream developers page as of June 2026. [NEEDS VERIFICATION - single source: valgrind.org developers page]

The port is described as "supported" in the 3.27.1 release. The practical meaning of "supported" is that it compiles and passes the regression suite -- not that all instruction variants and extensions are complete (see Section 6).

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Valgrind's architecture code is organized by subsystem, with per-architecture files (e.g., `*-riscv64*.c/h/S`). There is no `arch/riscv/` directory. The riscv64 port consists of the following files.

**VEX IR/JIT backend (host-side code generation):**
- `VEX/priv/host_riscv64_defs.h` -- host register and instruction definitions
- `VEX/priv/host_riscv64_defs.c` -- implementation of host instruction defs
- `VEX/priv/host_riscv64_isel.c` -- instruction selector (IR to riscv64 machine code)

**VEX guest-state modeling (binary translation front-end):**
- `VEX/priv/guest_riscv64_defs.h` -- guest register file layout
- `VEX/priv/guest_riscv64_helpers.c` -- helpers for guest state (FP flags, etc.)
- `VEX/priv/guest_riscv64_toIR.c` -- disassembler/lifter: decodes RV64GC to VEX IR

**VEX public API:**
- `VEX/pub/libvex_guest_riscv64.h` -- public VEX guest state struct for riscv64

**Coregrind dispatch and syscall:**
- `coregrind/m_dispatch/dispatch-riscv64-linux.S` -- assembly dispatch loop
- `coregrind/m_syswrap/syscall-riscv64-linux.S` -- assembly syscall stub
- `coregrind/m_syswrap/syswrap-riscv64-linux.c` -- C-level syscall wrappers

**Signal handling:**
- `coregrind/m_sigframe/sigframe-riscv64-linux.c`

**GDB stub:**
- `coregrind/m_gdbserver/riscv64-cpu.xml`
- `coregrind/m_gdbserver/riscv64-cpu-valgrind-s1.xml`
- `coregrind/m_gdbserver/riscv64-cpu-valgrind-s2.xml`

**Kernel interface headers:**
- `include/vki/vki-riscv64-linux.h`
- `include/vki/vki-posixtypes-riscv64-linux.h`
- `include/vki/vki-scnums-riscv64-linux.h`

**Tests:**
- `none/tests/riscv64/` -- instruction-level tests (integer, muldiv, atomic, float32, float64, compressed, csr)
- `memcheck/tests/riscv64-linux/` -- Memcheck syscall and register context tests

**Documentation:**
- `README.riscv64` -- supported ISA (RV64IMAFDCZICSR) and known gaps

**Subsystem completeness assessment** (from direct code review of the fork):

*Signal frame handling (`sigframe-riscv64-linux.c`):* Full. All 32 GPRs, PC, 32 FPRs, and fcsr are saved and restored. No stubs or TODOs.

*GDB server (`valgrind-low-riscv64.c`):* Full. All 32 GPRs, PC, 32 FPRs, and CSR register fields are fully mapped. TLS via `tp`-based DTv is implemented.

*Thread clone/stack-switch:* Full. `do_syscall_clone_riscv64_linux` is a complete assembly implementation handling return-twice clone semantics.

*Instruction decoder (`guest_riscv64_toIR.c`):* Partial. See Section 6.

*VEX IR instruction selector (`host_riscv64_isel.c`):* Partial. `Iop_SubF32`, `Iop_MSubF32`, `Iop_MSubF64`, and `Iop_CmpNEZ16` are absent from the handler. These are functional gaps, not code-quality issues.

*Host instruction defs (`host_riscv64_defs.c/.h`):* Partial. `FSUB_S` (single-precision float subtract) is absent from `RISCV64FpBinaryOp`. `FLE_S` and `FLE_D` (float less-than-or-equal compare) are absent -- only FEQ and FLT are declared. `LR_D` and `SC_D` (64-bit load-reserved/store-conditional) are not declared -- only 32-bit `lr.w`/`sc.w` variants exist; 64-bit atomics go through `CAS_D`. There is a confirmed live correctness bug in `unchainXDirect_RISCV64`: it writes `p[19] = 0x89` instead of `0x92`, corrupting the unchained `c.jalr` instruction.

*Syscall wrappers (`syswrap-riscv64-linux.c`):* Partial. `__NR_kexec_load`, `__NR_clone3`, and `__NR_rseq` use `sys_ni_syscall` placeholders. The lookup function `ML_(get_linux_syscall_entry)` only searches the contiguous initial section, meaning io_uring (525+) and newer syscalls may be silently unreachable.

---

## 5. Build System, Cross-Compilation, and Toolchain

Valgrind uses GNU Autotools (autoconf/automake), not CMake.

**Native build (on riscv64 hardware or rootfs):**
```sh
./configure --prefix=/usr
make -j$(nproc)
make install
```

**Cross-compilation from x86_64:**
```sh
export CC=riscv64-linux-gnu-gcc
export AR=riscv64-linux-gnu-ar
export LD=riscv64-linux-gnu-ld
./configure --host=riscv64-linux-gnu --prefix=/usr
make -j$(nproc)
make install DESTDIR=$(pwd)/Inst
```

The `configure.ac` `host_cpu` case matches on `riscv64` and sets `ARCH_MAX="riscv64"`. The combined `ARCH_MAX-VGCONF_OS` case matches `riscv64-linux` to configure the platform with:

```
VGCONF_ARCH_PRI="riscv64"
VGCONF_ARCH_SEC=""
VGCONF_PLATFORM_PRI_CAPS="RISCV64_LINUX"
valt_load_address_pri_norml="0x58000000"
valt_load_address_pri_inner="0x38000000"
```

There is no secondary/biarch architecture for riscv64.

**Toolchain requirements:**

| Requirement | Version | Notes |
|---|---|---|
| GCC | >= 3.0 (stated); >= 7 (practical for riscv64-linux-gnu target) | configure.ac enforces >= 3.0 globally; no riscv64-specific floor |
| Clang | >= 2.9 (stated); >= 9 (practical for riscv64) | Same global check, no riscv64-specific gate |
| autoconf | >= 2.68 (>= 2.70 for preferred build path) | |
| automake | >= 1.10 | |
| Python | >= 3.9 | Required for regression tests |

**Hardening flags:** Stack-protector and several hardening flags are incompatible with Valgrind. Debian's packaging sets `hardening=-stackprotector,-stackprotectorstrong`. Gentoo's ebuild filters `-fomit-frame-pointer`, `-fstack-protector*`, `-fsanitize*`, and `-fharden-control-flow-redundancy` before running configure.

**QEMU:** The `README.riscv64` states only "The port has been tested to work on real hardware and under QEMU." No specific QEMU version floor or invocation flags are documented. Valgrind cannot run under QEMU user-mode itself -- Valgrind must execute on actual riscv64 hardware or a full-system QEMU guest.

**Dockerfile:** No Dockerfile exists in any accessible Valgrind source tree.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

The port targets **RV64GC** (I + M + A + F + D + C). Instruction coverage per `README.riscv64`:

| Extension | Supported | Total | Gap |
|---|---|---|---|
| RV64I | 52 | 52 | None |
| RV64M | 12 | 13 | MULHSU missing |
| RV64A | 22 | 22 | LR/SC use VEX fallback method with ABA problem |
| RV64F | 30 | 30 | NaN-boxing check missing (partially addressed by bug 503098 in 3.26.0) |
| RV64D | 32 | 32 | None |
| RV64Zicsr | 3 | 6 | CSRRWI, CSRRSI, CSRRCI missing; only fflags/frm/fcsr CSRs accepted |
| RV64Zifencei | 0 | 1 | FENCE.I entirely absent |
| RV64C | 37 | 37 | None |
| RVV (Vector) | 0 | large | No support; fundamental VEX IR limitation (see below) |
| Zba/Zbb | 0 | various | No support |
| XTHead vendor | 0 | various | No support |
| Zfh (half-precision FP) | 0 | various | PR #12 closed unmerged in 2023; no follow-on |
| RV32 on RV64 | 0 | n/a | Not implemented |

**RVV is not a near-term gap -- it is a fundamental architectural limitation.** VEX has no variable-length vector IR. All existing vector types are fixed-width (Ity_V128, Ity_V256). The VEX register allocator cannot handle vectors spanning multiple registers. Memcheck relies on fixed-width IR types. Adding RVV support requires a redesign of VEX IR, not incremental instruction coverage work. Open issue [#17](https://github.com/petrpavlu/valgrind-riscv64/issues/17) on the fork explicitly documents this; no solution has been proposed.

**Comparison with arm64 and amd64:** Data not available -- no published riscv64 vs. arm64 or riscv64 vs. amd64 instruction coverage or functional parity comparisons exist in any accessible source.

**Performance overhead:** The upstream documentation states Memcheck runs 10-50x slower than native and the no-op Nulgrind adds approximately 4x overhead. These figures apply to all platforms. No riscv64-specific overhead measurements exist in any public source -- not in release notes, mailing lists, the upstream bug tracker, the RISE Project blog, or the fork repository.

One data point from fork issue [#20](https://github.com/petrpavlu/valgrind-riscv64/issues/20): a user measured `valgrind --tool=none` at approximately 17x slowdown on a VisionFive 2, vs. qemu-riscv64-static at approximately 8x. The benchmark used is described at [hoult.org/primes.txt](http://hoult.org/primes.txt). [NEEDS VERIFICATION - single source: GitHub issue comment]

**Performance TODOs from `README.riscv64` (unfixed as of last fork update):**
- Optimize `<instr>i` instruction selection variants (small-immediate forms)
- Optimize floating-point exception handling to avoid helper calls
- Review codegen register usage
- Implement proper non-fallback LR/SC (correctness)
- Address thread-state race conditions in exit sequence (correctness)

---

## 7. CI/CD Infrastructure

**No automated CI pipeline for riscv64 exists anywhere in the Valgrind project.**

Specific evidence:

- No `.gitlab-ci.yml`, `.travis.yml`, `Jenkinsfile`, or `.circleci/config.yml` exists in the upstream repository. All probe attempts returned HTTP 404.
- No `.github/` directory exists in the upstream repository or in the `petrpavlu/valgrind-riscv64` fork.
- The upstream `nightly/conf/` directory contains 13 `.conf` files covering: cellbuzz-cross, cellbuzz-native, fedora390, freebsd, gcc114-arm64, illumos, lfedora1, nemesis, sless390, solaris11.3, solaris12, wildebeest, wildebeest32. Not one of these files contains any reference to `riscv`, `riscv64`, or `RISC-V`.

The `configure.ac` contains `riscv64)` case stanzas that allow the build system to configure for riscv64. This is build system support, not CI.

**Buildbot for Valgrind:** The sourceware.org Buildbot at [builder.sourceware.org](https://builder.sourceware.org/buildbot/#/builders?tags=valgrind) has two RISC-V builders.

*Builder: `valgrind-ubuntu-riscv` (builderid: 340):*
- Status: Active, connected to master 2
- Workers: 5 physical StarFive RISC-V boards (`starfive-riscv`, `starfive-1` through `starfive-4`), all running Ubuntu 24.04.4 LTS, kernel Linux 6.17.0-29-generic riscv64, glibc 2.39, g++ 14.2.0
- Admin: Mark Wielaard (mark@klomp.org)
- Build frequency: Daily; each build takes approximately 2.1 hours
- Recent builds: 1092-1096, all successful
- Build steps: git checkout, `./autogen.sh`, `./configure`, `make`, `make check`, `make regtest`, `make ltpchecks`, package results to `bunsen.cpio.gz`, upload to Bunsen test-tracking system, `make distclean`
- Hardware: real StarFive boards, not QEMU emulation

*Builder: `valgrind-fedora-riscv` (builderid: 342):*
- Status: Offline -- no active master assigned, no workers currently configured
- Recent builds: 166-170 (from June 2025), all successful, run times 63-179 minutes

**Conclusion:** riscv64 is tested daily on real hardware via the Buildbot Ubuntu builder. It is not integrated into any in-tree CI configuration and is not a gate on releases. The Fedora riscv64 builder is currently offline.

---

## 8. Distribution and Release Status

| Distribution | Version | riscv64 Binary | Notes |
|---|---|---|---|
| Upstream | 3.27.1 (2026-05-20) | Yes (source) | Official supported platform |
| Debian sid | 1:3.25.1-3 | Yes -- `valgrind_3.25.1-3_riscv64.deb` confirmed live (15.1 MiB) | Built successfully on rv-osuosl-01 approximately 250 days ago |
| Ubuntu 24.04 (Noble) | 1:3.22.0-0ubuntu3 | No | Version predates riscv64 support; `valgrind-if-available` is a dependency stub only |
| Gentoo | 3.26.0-3.27.1 | Yes (source) | Marked `~riscv` (testing/experimental keyword) |
| PyPI `valgrind` | 0.0.0 | No | Wrong package; a Python callgrind stub, not the Valgrind tool |
| Arch Linux RISC-V | Indeterminate | Indeterminate | Dynamic content not accessible; not found in blacklist |

Ubuntu 24.04 ships Valgrind 3.22.0, which predates riscv64 support entirely. Users on Ubuntu 24.04 riscv64 must build from source. Debian sid provides a binary package. No upgrade path exists for Ubuntu stable users short of a future release update or manual source build.

RISE Project involvement: The RISE Debug and Profiling Working Group listed Valgrind as a tracking item in its December 2024 roadmap ("Cleanup, fencei, NaN-box checking, B/V extension support"), but Valgrind does not have an assigned RISE RP (funded project) number. The upstream port was contributed by Petr Pavlu (SUSE) through community effort, independent of RISE funding.

---

## 9. Dependencies

| Dependency | Role | riscv64 Status | Blocking Issues |
|---|---|---|---|
| GCC >= 7 or Clang >= 9 | C/C++ compiler targeting riscv64-linux | Available | None |
| GNU Make | Build system | Available | None |
| autoconf >= 2.68 / automake >= 1.10 | Build configuration (developer builds only) | Available | None |
| Perl | Build-time test harness scripts | Available | None |
| glibc >= 2.2 | Required Linux C library; per-version suppression files shipped | Available; riscv64 suppression files included | Bug 503098 (NaN-boxing) fixed in 3.26.0; residual NaN-boxing TODO remains in README.riscv64 |
| Linux kernel >= 2.6 | Required OS; Valgrind wraps kernel syscalls | Available | Ongoing: not all riscv64-specific syscalls are wrapped; clone3/rseq/kexec_load are stubs |
| GDB | Optional -- `--vgdb` mode; built-in gdbserver | GDB 15+ has full riscv64 remote protocol support | No hard blockers as of GDB 15+ |
| VEX (libVEX) | Core IR translation engine; bundled in-tree | Partial -- MULHSU, CSRRWI/SI/CI, FENCE.I not lifted; LR/SC ABA flaw | These are in-tree TODOs, not external dependency issues |
| MPI (optional) | mpicc wrapper for MPI-aware tools | Available | None; optional feature |
| pthread / librt | Required runtime libraries | Available (part of glibc riscv64) | None |

GDB and glibc are tracked as first-class entries in this RISC-V ecosystem project.

---

## 10. Ecosystem Status

**Governance:** No formal foundation. Valgrind is not a RISE Project member. No named riscv64 maintainer exists upstream as of June 2026. Petr Pavlu (SUSE) authored the port but is not listed as a platform maintainer in the upstream developers list.

**RISE involvement:** The December 2024 RISE Webinar PDF identifies Valgrind as a work item within the Debug and Profiling Working Group (led by Xaio Wang, Intel, and Ludovic Henry, Rivos at that time). The roadmap items listed were: cleanup, fence.i, NaN-box checking, B/V extension support. No RISE RP number was assigned. Zero RISE blog posts mention Valgrind.

**Corporate maintainers active on the riscv64 port:**

| Person | Company | Role |
|---|---|---|
| Petr Pavlu | SUSE | Port author; not listed as upstream platform maintainer |
| XiaoWang1772 (xiao.w.wang@intel.com) | Intel | Author of open PRs #22 (MULHSU, CSR immediates) and #23 (link error fix) |
| ita-sc | Unknown | Author of open PRs #24 (compressed hints) and #25 (NaN-boxing) |
| mingyuan-xia | UltraRISC | Author of open PR #21 (fence.i) |
| Mark Wielaard | Red Hat | General release management; administers the Buildbot RISC-V hardware |

**Fork activity:** The [petrpavlu/valgrind-riscv64](https://github.com/petrpavlu/valgrind-riscv64) fork (68 stars, 17 forks) has 5 open pull requests and 4 open issues. None of the 5 open PRs have received review comments from the fork maintainer since their submission; the most recent reviewer ping went unanswered (PR #22, "Gentle ping," January 2, 2025). The fork's default branch was last updated July 2, 2024. The open PRs appear stalled.

---

## 11. Known Bugs and Active Issues

**Fixed upstream bugs (from release notes):**

| Bug | Title | Fixed In |
|---|---|---|
| [468575](https://sourceware.org/bugzilla/show_bug.cgi?id=468575) | Add support for RISC-V | 3.25.0 (Apr 2025) |
| [503098](https://sourceware.org/bugzilla/show_bug.cgi?id=503098) | Incorrect NAN-boxing for float registers in RISC-V | 3.26.0 (Oct 2025) |
| [503677](https://sourceware.org/bugzilla/show_bug.cgi?id=503677) | duplicated-cond compiler warning in dis_RV64M | 3.26.0 (Oct 2025) |
| [509157](https://sourceware.org/bugzilla/show_bug.cgi?id=509157) | riscv64: Shift instructions can behave wrong | Listed under 3.19.0 in NEWS but riscv64 support only landed in 3.25.0 -- placement is inconsistent with bug numbering sequence; actual fix cycle unclear |

Note on bug 509157: The placement of this bug number under the 3.19.0 release section is anomalous. Bug 503677 resolved in 3.26.0 carries a lower number than 509157. The research findings flag this as a likely documentation artifact; the actual fix may belong to the 3.26.x or 3.27.x cycle.

**Open issues (fork):**

| Issue | Title | Impact |
|---|---|---|
| [#17](https://github.com/petrpavlu/valgrind-riscv64/issues/17) | riscv vector ISA support | Fundamental VEX IR limitation; no VLA vector type; affects all RVV code |
| [#19](https://github.com/petrpavlu/valgrind-riscv64/issues/19) | Support for Zba, Zbb, and XTHead instructions | Hard crashes on TH1520 (XTHead) and VisionFive 2 (Zba/Zbb when enabled by compiler) |
| [#20](https://github.com/petrpavlu/valgrind-riscv64/issues/20) | Running RV32 code on RV64 | Not implemented |

**Open PRs awaiting upstream submission (fork only):**

| PR | Title | Author | Blocks |
|---|---|---|---|
| [#21](https://github.com/petrpavlu/valgrind-riscv64/pull/21) | support fence.i | mingyuan-xia (UltraRISC) | FENCE.I decode gap; some JIT-compiled code (OpenJDK) uses it |
| [#22](https://github.com/petrpavlu/valgrind-riscv64/pull/22) | Add support for mulhsu and CSRR*I instruction | XiaoWang1772 (Intel) | MULHSU and CSR immediate decode gaps |
| [#23](https://github.com/petrpavlu/valgrind-riscv64/pull/23) | Fix link error about relocation | XiaoWang1772 (Intel) | Build failure with GNU ld 2.42 on test files |
| [#24](https://github.com/petrpavlu/valgrind-riscv64/pull/24) | Support compress hint instructions | ita-sc | Compressed hint decode gap |
| [#25](https://github.com/petrpavlu/valgrind-riscv64/pull/25) | Correct nan-boxing for single-precision calculations | ita-sc | Residual NaN-boxing correctness after bug 503098 |

PRs #22, #23, #24, and #25 have received zero review comments from the fork maintainer. PR #21 received substantive technical review from petrpavlu in August-September 2024 but was not merged.

**Confirmed correctness bug in upstream code (from code review):**
In `host_riscv64_defs.c`, `unchainXDirect_RISCV64` writes `p[19] = 0x89` instead of the correct `0x92`, corrupting the unchained `c.jalr` instruction. This is a live correctness bug in the JIT chain/unchain path. It is not filed as a Bugzilla issue. [NEEDS VERIFICATION - single source: code review findings]

**Test suite status (from fork, last updated July 2024):**
737 total tests; 4 failures: `gdbserver_tests/hgtls` (stdoutB), `none/tests/double_close_range` (stderr, 3 variants).

---

## 12. Objections and Upstream Blockers

**Objection 1: The port reached "supported" status, so it is complete.**
Not accurate. "Supported" in Valgrind's terminology means it compiles and passes the regression suite. The port has documented correctness gaps in the host backend (missing FSUB_S, FLE_S/D, live unchainXDirect bug), instruction decode gaps (MULHSU, CSRRWI/SI/CI, FENCE.I, LR/SC ABA), and zero coverage of RVV and Zba/Zbb. These are not future-roadmap items; they cause hard crashes (`unhandled instruction`) when client code uses them.

**Objection 2: The 5 open fork PRs solve the known gaps.**
Partially. PRs #21-#25 address FENCE.I, MULHSU, CSR immediates, compressed hints, and NaN-boxing. However, they have no upstream maintainer attention (zero reviews on #22-#25 since November 2024) and have not been submitted to the upstream Valgrind project. The path from fork PR to upstream merge is unclear and there is no named maintainer to drive it. RVV and Zba/Zbb are not addressed by any open PR.

**Objection 3: The Buildbot riscv64 builder provides adequate CI.**
The Ubuntu riscv64 Buildbot builder runs daily on real StarFive hardware and catches regressions. However, it is not an in-tree CI gate, it is not triggered by patch submission, and it does not block merges. The Fedora riscv64 builder is currently offline. No contributor can submit a try-build against riscv64 via the standard Valgrind contribution flow.

**Objection 4: RVV support can be added incrementally.**
No. The VEX IR does not have variable-length vector types. `Ity_V128` and `Ity_V256` are fixed-width. Adding RVV support requires extending VEX IR to support VLA types and updating the register allocator. This is not an instruction-by-instruction coverage problem; it is a fundamental IR redesign. No design proposal exists in any upstream or fork discussion as of June 2026.

**Objection 5: Zba/Zbb issues only affect code compiled with those extensions explicitly enabled.**
Accurate but understates the risk. Modern RISC-V toolchains (GCC 12+, Clang 14+) target `-march=rv64gc_zba_zbb` by default on hardware that supports it. Valgrind will hard-crash with `disInstr(riscv64): unhandled instruction` on any binary compiled with those flags. This includes system libraries on Zba/Zbb-capable hardware such as the VisionFive 2. [NEEDS VERIFICATION on exact GCC/Clang default flag behavior -- single source: issue #19 comment from brucehoult]

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The riscv64 port is functional for plain C/C++ workloads on RV64GC hardware with no extensions beyond the base set. Three categories of hard crashes exist: (1) FENCE.I in JIT-compiled code (OpenJDK, similar), (2) MULHSU/CSR-immediate in math or low-level code, (3) Zba/Zbb instructions on hardware where the toolchain enables them by default. The `unchainXDirect` correctness bug affects all code hitting the JIT chain/unchain path.

Addressing functional gaps requires: submitting the 5 open fork PRs to upstream with test cases, a named upstream maintainer to shepherd review, and fixing the `unchainXDirect` bug. The Zba/Zbb gap requires new decode and emission code beyond the existing PRs.

RVV support requires a VEX IR redesign. This is not within the scope of a Valgrind-only investment; it requires coordination with all VEX platform backends and the upstream VEX/Valgrind maintainers.

### 13.2 Performance Optimization

No baseline riscv64 performance measurements exist. The `README.riscv64` documents three performance TODOs: FP exception handling via helper calls (eliminatable), small-immediate instruction selection, and register selection. None have been quantified. Establishing a baseline is prerequisite to any optimization investment.

### 13.3 CI/CD Infrastructure

The Buildbot riscv64 builder is operational but peripheral. Adding an in-tree CI configuration (e.g., a `.gitlab-ci.yml` entry for riscv64) would require hosting riscv64 runners accessible to the sourceware.org GitLab instance, or contributing patches to the existing Buildbot nightly conf directory. The Fedora riscv64 builder is offline; restoring it is low-effort if the worker hardware is available.

### 13.4 Ecosystem Enablement

Ubuntu 24.04 (Noble) does not ship a riscv64 Valgrind binary. Developers on Ubuntu riscv64 must build from source. Backporting Valgrind 3.25.x or later to Ubuntu 24.04 riscv64 would unblock this. Debian sid already provides the binary.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Submit fork PRs #21-#25 to upstream with test cases | 2 | Assignee TBD | Critical |
| Functional | Fix `unchainXDirect_RISCV64` `p[19]` byte corruption | 1 | Assignee TBD | Critical |
| Functional | Zba/Zbb instruction decode and emission | 4 | Assignee TBD | High |
| Functional | Clone3/rseq/kexec_load syscall wrapper completeness | 2 | Assignee TBD | High |
| Functional | Missing isel ops: SubF32, MSubF32/F64, CmpNEZ16 | 2 | Assignee TBD | High |
| Functional | Missing host defs: FSUB_S, FLE_S/D, LR_D/SC_D | 2 | Assignee TBD | High |
| Functional | XTHead vendor instruction decode (TH1520, C910) | 3 | Assignee TBD | Medium |
| Functional | LR/SC ABA problem (correctness for lock-free code) | 4 | Assignee TBD | Medium |
| Functional | RVV support | Data not available: requires VEX IR VLA redesign; no scoping has been done upstream | Upstream VEX maintainers | Low (pre-requisites not met) |
| Performance | Establish riscv64 performance baseline vs. arm64 | 2 | Assignee TBD | High |
| Performance | Eliminate FP exception helper calls | 3 | Assignee TBD | Medium |
| Performance | Small-immediate instruction selection (`<instr>i` forms) | 2 | Assignee TBD | Medium |
| CI/CD | Add riscv64 entry to nightly/conf/ (Buildbot) or in-tree CI | 2 | Assignee TBD | High |
| CI/CD | Restore Fedora riscv64 Buildbot worker | 1 | Assignee TBD | Medium |
| Ecosystem | Backport Valgrind >= 3.25.0 to Ubuntu 24.04 riscv64 | 3 | Canonical (RISE member) | High |
| Ecosystem | Identify and establish named upstream riscv64 maintainer | 0 (organizational) | Leadership | Critical |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [Valgrind homepage](https://valgrind.org/)
- [Valgrind release news (dist.news.html)](https://valgrind.org/docs/manual/dist.news.html)
- [Valgrind README.riscv64 (upstream docs)](https://valgrind.org/docs/manual/dist.readme-riscv64.html)
- [Valgrind manual core (performance figures)](https://valgrind.org/docs/manual/manual-core.html)
- [Valgrind upstream git repository](https://sourceware.org/git/valgrind.git)
- [Sourceware.org Bugzilla bug 468575](https://sourceware.org/bugzilla/show_bug.cgi?id=468575)
- [Sourceware.org Bugzilla bug 503098](https://sourceware.org/bugzilla/show_bug.cgi?id=503098)
- [Sourceware.org Bugzilla bug 503677](https://sourceware.org/bugzilla/show_bug.cgi?id=503677)
- [Sourceware.org Bugzilla bug 509157](https://sourceware.org/bugzilla/show_bug.cgi?id=509157)
- [petrpavlu/valgrind-riscv64 fork (GitHub)](https://github.com/petrpavlu/valgrind-riscv64)
- [Fork issue #3: Prepare for upstream?](https://github.com/petrpavlu/valgrind-riscv64/issues/3)
- [Fork issue #17: riscv vector ISA support](https://github.com/petrpavlu/valgrind-riscv64/issues/17)
- [Fork issue #19: Support for Zba, Zbb, and XTHead](https://github.com/petrpavlu/valgrind-riscv64/issues/19)
- [Fork issue #20: Running RV32 code on RV64](https://github.com/petrpavlu/valgrind-riscv64/issues/20)
- [Fork PR #21: support fence.i](https://github.com/petrpavlu/valgrind-riscv64/pull/21)
- [Fork PR #22: Add support for mulhsu and CSRR*I](https://github.com/petrpavlu/valgrind-riscv64/pull/22)
- [Fork PR #23: Fix link error about relocation](https://github.com/petrpavlu/valgrind-riscv64/pull/23)
- [Fork PR #24: Support compress hint instructions](https://github.com/petrpavlu/valgrind-riscv64/pull/24)
- [Fork PR #25: Correct nan-boxing for single-precision calculations](https://github.com/petrpavlu/valgrind-riscv64/pull/25)
- [Sourceware.org Buildbot (Valgrind builders)](https://builder.sourceware.org/buildbot/#/builders?tags=valgrind)
- [Debian packages.debian.org/sid/valgrind](https://packages.debian.org/sid/valgrind)
- [Ubuntu packages.ubuntu.com/noble/valgrind](https://packages.ubuntu.com/noble/valgrind)
- [RISE Project homepage](https://riseproject.dev)
- [RISE Project blog](https://riseproject.dev/blog/)
- [FOSDEM 2022: Valgrind on RISC-V (Petr Pavlu)](https://archive.fosdem.org/2022/schedule/event/valgrind_riscv/)