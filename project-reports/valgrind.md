---
title: Valgrind
parent: Project Reports
color: blue
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: LLVM
    relation: build-dependency
    criticality: optional
  - name: GNU binutils
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: automake
    relation: build-dependency
    criticality: optional
  - name: Perl
    relation: test-dependency
    criticality: critical
  - name: Python
    relation: test-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: Linux kernel
    relation: runtime-dependency
    criticality: critical
  - name: GDB
    relation: runtime-dependency
    criticality: optional
  - name: Open MPI
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="valgrind" %}

# Valgrind

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-02<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for Valgrind<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[Valgrind](https://valgrind.org/) is a dynamic binary instrumentation framework. Its tools include Memcheck (memory error detection), Helgrind and DRD (data-race detection), Callgrind and Cachegrind (profiling), and Massif (heap profiling). It translates guest machine code into an intermediate representation (VEX IR), instruments it, and re-emits host code. The guest and host architecture are the same on every supported platform, so each port needs both a guest decoder and a host code generator.

- **License:** GPL v3, as stated on valgrind.org. The out-of-tree riscv64 forks are licensed GPLv2.
- **Hosting:** [sourceware.org](https://sourceware.org/git/valgrind.git). The project is not on GitHub or GitLab.
- **Governance:** No foundation. Copyright is held by "Valgrind Developers". Governance is informal and meritocratic. The AUTHORS file credits Julian Seward as original founder. `README_DEVELOPERS` says commit access is granted by asking an existing developer and filling in the sourceware account form. The git tree has no MAINTAINERS file.
- **Patch flow:** Patches are attached to [KDE Bugzilla](https://bugs.kde.org/) bugs and committed directly to trunk. A contributor who offered a GitLab merge request on bug 503253 was told by Paul Floyd that the project does not use GitLab and patches go on the bug.
- **Sponsors:** The commit log shows the main corporate backers are Red Hat and IBM. Active committers since 2024-01-01 by commit count:

| Committer | Commits | Affiliation evidence |
|---|---|---|
| Paul Floyd | 970 | Unclear (wanadoo.fr email) |
| Florian Krohm | 297 | Personal email; IBM s390x work is from recollection [NEEDS VERIFICATION] |
| Mark Wielaard | 200 | Personal email; Red Hat is from recollection [NEEDS VERIFICATION] |
| Andreas Arnez | 63 | IBM (linux.ibm.com email) |
| Martin Cermak | 62 | Red Hat (redhat.com email) |
| Alexandra Hajkova | 33 | Red Hat (redhat.com email) |
| Philippe Waroquiers | 14 | Independent (skynet.be email) |
| Petr Pavlu | 10 | SUSE from recollection; commits use a personal email [NEEDS VERIFICATION] |

- **Stance on new ports:** Conservative. The [platforms page](https://valgrind.org/info/platforms.html) says "we can only justify supporting platforms that are widely used". It also says porters must make a "convincing case that the effort will be worth it, and that the port will be supported properly". The RISC-V port was accepted as a complete, tested, out-of-tree implementation that was then upstreamed.
- **RISE:** Valgrind is not a RISE Project member or project. It is not mentioned on the [RISE members page](https://riseproject.dev/members/). RISE does track Valgrind work as working-group items (Section 13). Red Hat is a RISE Premier member and Canonical a General member, but the members page does not link either to Valgrind.
- **Current release:** 3.27.1 (2026-05-20), preceded by 3.27.0 (2026-04-20) per valgrind.org. 3.28.0 is planned for October 2026 [NEEDS VERIFICATION - single source]. Tags VALGRIND_3_25_0, 3_25_1, 3_26_0, 3_27_0 and 3_27_1 exist in the repository.

## 2. Port History and Upstreaming Timeline

The riscv64/Linux port is fully upstream for the RV64GC instruction set. Everything beyond RV64GC (vector, Zfh, Zba/Zbb, XTHead) is not upstream (Section 6).

| Date | Event | Source |
|---|---|---|
| 2020-12-09 | First commit in the out-of-tree fork petrpavlu/valgrind-riscv64, branch `riscv64-linux` [NEEDS VERIFICATION - single source: fork metadata] | [fork](https://github.com/petrpavlu/valgrind-riscv64) |
| 2022-02-06 | FOSDEM 2022 talk "Valgrind on RISC-V" by Petr Pavlu [NEEDS VERIFICATION - single source] | [FOSDEM](https://archive.fosdem.org/2022/schedule/event/valgrind_riscv/) |
| 2023-04-16 | Bug 468575 "Add support for RISC-V" opened by Petr Pavlu. The port was submitted as 6 patches (3 add port-specific files, 3 modify existing files). Local test result at submission: about 675 passed, 8 failed. | [Bug 468575](https://bugs.kde.org/show_bug.cgi?id=468575) |
| 2023-04-26 | Bug 468979 (RVV support) opened | [Bug 468979](https://bugs.kde.org/show_bug.cgi?id=468979) |
| 2023-2024 | Port sat without upstream acceptance for over a year. Contributors cited the need for git write access for maintainers, review of a large change, and regression testing across all platforms. | [Bug 468575](https://bugs.kde.org/show_bug.cgi?id=468575) |
| 2024-12 to 2025-01 | Mark Wielaard rebased the patches onto trunk and fixed issues: `close_range` fd types, `readlinkat` POST handler, a VEX isel crash on I1 constants (plus And1 folding), missing `fence.tso`, test relocation problems with some binutils/GCC combinations, and an SV39 address-space limit in `sh-mem-random` (target moved from 408GB to 240GB). | [Bug 468575](https://bugs.kde.org/show_bug.cgi?id=468575) |
| 2025-02-25 | Initial port commit date seen in the `host_riscv64_defs.c` history [NEEDS VERIFICATION - single source]. The patches carry an authoring date of 2023-04-11 (first commit 949abd047). | upstream git history (clone) |
| 2025-04-25 | Valgrind 3.25.0, first release with RISCV64/Linux: "Added RISCV64 support for Linux. Specifically for the RV64GC instruction set." | [LWN](https://lwn.net/Articles/1019227/) |
| 2025-05-09 | Commit 9dd24c9b fixes NaN-boxing (bug 503098). Commit 5efdbbd3 makes `riscv_hwprobe` return ENOSYS (bug 503253). | [Bug 503098](https://bugs.kde.org/show_bug.cgi?id=503098), [Bug 503253](https://bugs.kde.org/show_bug.cgi?id=503253) |
| 2025-09-30 | Commit 97831bbb fixes shift masking (bug 509157) | [Bug 509157](https://bugs.kde.org/show_bug.cgi?id=509157) |
| 2025-10-24 | Valgrind 3.26.0. NEWS lists the fixes for 503098, 503677 and 509157. | [NEWS](https://valgrind.org/docs/manual/dist.news.html) |
| 2026-04-20 | Valgrind 3.27.0. NEWS lists no new RISC-V features; only skimmed. | [NEWS](https://valgrind.org/docs/manual/dist.news.html) |
| 2026-05-20 | Valgrind 3.27.1 | [valgrind.org](https://valgrind.org/) |
| 2026-06-21 | Latest riscv-related commit in the log, by Martin Cermak | upstream git history (clone) |

The final port test result on Pioneer hardware (Fedora 38, GCC 14.2.0, binutils 2.43.1) was 743 of 744 tests passing. The bug lists three remaining failures: `hgtls` (a GDB variable-location limitation), `sh-mem-random` (platform memory constraints) and `nestedfns` (a compiler-specific nested-function issue). Three named failures against a single failing test is a discrepancy in the source that was not resolved.

**Key contributors**

| Person | Role | Affiliation evidence |
|---|---|---|
| Petr Pavlu | Port author; maintains the fork | SUSE [NEEDS VERIFICATION] |
| Mark Wielaard | Rebased and landed the port; assignee on bugs 504648 and 514962; administers the Buildbot riscv workers | Red Hat [NEEDS VERIFICATION] |
| Martin Cermak | 15 of about 40 riscv-related commits since 2025-01-01 | Red Hat (redhat.com email) |
| Paul Floyd | Reviewer and committer | Unclear |
| Florian Krohm | Committed the shift fix (509157) | Unclear |
| Ivan Tetyushkin | Authored the NaN-boxing fix (503098) | Not stated |
| Christoph Jung | Authored the shift patch (509157) | Not stated |
| Xiao W Wang | Intel; RISE scalable vector IR work | Intel |
| laokz, Xeonacid, JackGittes (zhaomingxin), rjiejie | Fork contributors [NEEDS VERIFICATION - single source] | rjiejie and zhaomingxin use alibaba.com addresses on RVV patches |

Since 2025-01-01 there have been about 40 riscv-related commits. The authors are Martin Cermak (15), Petr Pavlu (10), Mark Wielaard (9), and one each from Florian Krohm, Paul Floyd, Andreas Schwab, Ivan Tetyushkin and zhaomingxin. The port is actively maintained, mostly by Red Hat staff.

## 3. Upstream Support Tier

**Formal policy.** The [platforms page](https://valgrind.org/info/platforms.html) defines three categories:

- **Current:** actively supported. It lists X86, AMD64, ARM, PPC, MIPS, S390X, FreeBSD, Solaris, Darwin, Android and RISCV64/Linux.
- **Out of Tree:** maintained outside the project, with varying completeness.
- **Historical:** discontinued ports, for example AIX, TileGX, Windows and SPARC64.

RISCV64/Linux is in the Current category. The `README.riscv64` states that the port was tested on real hardware and under QEMU. In practice "supported" means the port builds and passes the regression suite. It does not mean every instruction or extension is covered (Section 6).

**Evidence of tier**

- Official binaries: none. Upstream ships source tarballs only.
- In-tree CI: none (Section 7).
- Out-of-tree CI: the sourceware Buildbot builds and tests riscv64 on real hardware. Whether Buildbot results gate releases: Data not available. Nothing in the repository or the Buildbot configuration states either way.
- Named riscv64 maintainer: the tree has no MAINTAINERS file. Active committers are listed in Sections 1 and 2.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Listed as Current platform | Yes (AMD64) | Yes (ARM, which includes arm64) | Yes (RISCV64/Linux) |
| In-tree CI config | None found in tree (no CI files at all) | None found in tree | None found in tree |
| Nightly config in `nightly/conf/` | Data not available: architectures of the 13 configs were not enumerated | `gcc114-arm64` present | None (grep for "riscv" returns no matches) |
| Buildbot builders | Data not available: not enumerated | Data not available: not enumerated | 2 active (Ubuntu), 2 inactive (Fedora) |
| Official binaries | Source only | Source only | Source only |
| Vector extension | Fixed-width SIMD; AVX-512 requested in bug 383010 [NEEDS VERIFICATION] | SVE not supported (per bug 468979, 2023) | RVV not supported |

## 4. Technical Architecture and RISC-V-Specific Subsystems

Valgrind has no `arch/riscv/` directory. Architecture code lives in per-architecture files across `VEX/` and `coregrind/`. A clone of the sourceware repository at commit `0ff27aab0831786c7f419e73a2b5217cbbcc792d` has 63 tracked riscv64-specific files. About 55 further shared files contain `VGA_riscv64` or `VGP_riscv64_linux` branches, including `m_machine.c`, `m_translate.c`, `m_main.c`, `m_signals.c`, `m_scheduler/scheduler.c`, `m_stacktrace.c`, `m_redir.c`, `m_trampoline.S`, `m_debuginfo/*`, `m_initimg/initimg-linux.c`, `m_cache.c`, `m_coredump/coredump-elf.c`, `memcheck/mc_machine.c` and `drd/drd_*`.

| Component | Files | Size / quality |
|---|---|---|
| Guest decoder (RISC-V to VEX IR) | `VEX/priv/guest_riscv64_toIR.c`, `guest_riscv64_helpers.c`, `guest_riscv64_defs.h`, `VEX/pub/libvex_guest_riscv64.h` | 3559 lines in `toIR.c`, 481 in helpers. Covers RV64I, M, A, F, D, C and Zicsr. Scalar only. Complete for RV64GC apart from the gaps in Section 6. |
| Host back end (VEX IR to RISC-V) | `VEX/priv/host_riscv64_defs.c`, `host_riscv64_defs.h`, `host_riscv64_isel.c` | 2751 lines in `defs.c`, 2108 in `isel.c`. Scalar integer and FP. Complete for what the decoder emits (see below). |
| Dispatcher | `coregrind/m_dispatch/dispatch-riscv64-linux.S` | 298 lines, assembly. Complete; no TODOs found. |
| Syscall stub and clone | `coregrind/m_syswrap/syscall-riscv64-linux.S` | 198 lines, assembly. Complete; handles return-twice clone semantics. |
| Syscall wrappers | `coregrind/m_syswrap/syswrap-riscv64-linux.c` | Partial. The table runs contiguously to syscall 469 and io_uring (425-427) is wired. `riscv_hwprobe` (258), `rseq` (293), `clone3` (435), `kexec_load` and `fadvise64` map to `sys_ni_syscall` (ENOSYS). |
| Signal frames | `coregrind/m_sigframe/sigframe-riscv64-linux.c` | 422 lines. Complete; all 32 GPRs, PC, 32 FPRs and fcsr saved and restored. Not audited register by register. |
| gdbserver | `coregrind/m_gdbserver/valgrind-low-riscv64.c` plus 8 XML files (`riscv64-cpu*.xml`, `riscv64-fpu*.xml`, `riscv64-linux*.xml`) | 287 lines. Complete. |
| Kernel interface headers | `include/vki/vki-riscv64-linux.h`, `vki-posixtypes-riscv64-linux.h`, `vki-scnums-riscv64-linux.h` | Present. |
| Machine / hwcaps | `coregrind/m_machine.c` | Partial. riscv64 is registered as `VexArchRISCV64`. No extension detection for riscv64 was found. |
| Tests | `none/tests/riscv64/` (25 files; 8 `.c` sources: allexec, atomic, compressed, csr, float32, float64, integer, muldiv, plus testinst), `memcheck/tests/riscv64-linux/` (context_float, context_integer, scalar) | Present but thin. |
| Docs | `README.riscv64`, `docs/internals/qemu-riscv64-linux-HOWTO.txt` | Present. |

**Host back end detail.** An earlier code reading listed `Iop_SubF32`, `Iop_MSubF32/F64`, `Iop_CmpNEZ16`, `FSUB_S`, `FLE_S/D` and `LR_D/SC_D` as missing. A later reading of upstream concluded these are never emitted. Single-precision subtract is generated as `AddF32` with `NegF32`, comparisons use `FEQ` and `FLT`, and 64-bit atomics use the VEX fallback. The later reading is treated as authoritative, so these are design choices and not gaps.

**LR/SC.** `guest_riscv64_toIR.c` contains a TODO to rework the non-fallback mode. LR/SC use the generic VEX fallback, which has the ABA problem.

**Live back-end bug.** `unchainXDirect_RISCV64` in `host_riscv64_defs.c` (line 2725 in the tree read) writes `p[19] = 0x89`. Its own comment says the bytes should be `82 92`, the encoding of `c.jalr t0`. The result is a corrupted instruction whenever a chained translation is unchained, for example on translation discard. This was confirmed in a tree containing commits through 2025-12-03. It was not re-checked against the 2026-09-21 HEAD. [NEEDS VERIFICATION - single source: code reading]

**Comparison with amd64 and arm64**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Guest decoder / host back end | Data not available: not researched | Data not available: not researched | Present, scalar RV64GC |
| Fixed-width SIMD | Data not available: not researched | Data not available: not researched | Not applicable (no SIMD in RV64GC) |
| Scalable vector (SVE / RVV) | Not applicable | Not supported (bug 468979, 2023) | Not supported; out-of-tree prototypes only |
| Dispatcher, syscall stub, sigframe, gdbserver | Data not available: not researched | Data not available: not researched | Present and complete |
| Hand-tuned code | Data not available | Data not available | None; the README lists instruction-selection and FP-exception optimization as TODOs |

## 5. Build System, Cross-Compilation, and Toolchain

Valgrind uses GNU Autotools only. There is no CMake, no Dockerfile and no CI YAML in the tree. There are no `-DUSE_X=OFF` style options. The `configure` flags below are the equivalent.

**Native build from git** (tarballs skip `autogen.sh`):

```
git clone https://sourceware.org/git/valgrind.git
cd valgrind
./autogen.sh
./configure --prefix=/usr
make -j$(nproc)
make install
```

`autogen.sh` runs `aclocal -I m4`, `autoheader`, `automake -a` and `autoconf`.

**Cross-compilation.** Not documented anywhere in the tree. The following is the standard Autoconf approach and is untested here:

```
./autogen.sh
./configure --host=riscv64-linux-gnu --prefix=/usr CC=riscv64-linux-gnu-gcc
make -j$(nproc)
make install DESTDIR=$PWD/Inst
```

**Platform definition.** `configure.ac` accepts host_cpu `riscv64` and the combined platform `riscv64-linux`. It sets `VGCONF_PLATFORM_PRI_CAPS=RISCV64_LINUX` with no secondary architecture. The load addresses are `0x58000000` (normal) and `0x38000000` (inner). `Makefile.all.am` applies `@FLAG_M64@` (`-m64`) to riscv64. `--prefix` is baked into the binary, so the install must stay at that prefix (`README` and `README_PACKAGERS`).

**Toolchain requirements** (from `configure.ac`, `README_DEVELOPERS` and `README.riscv64`):

| Requirement | Version | Why |
|---|---|---|
| GCC | >= 3.0 | `configure.ac` global check. No riscv64-specific floor or `-march`/`-mabi` gate. |
| Clang | >= 2.9 | Same global check. `README.riscv64` notes clang lacks `__builtin_longjmp` for riscv64, which Valgrind needs. |
| autoconf | >= 2.69 | `AC_PREREQ(2.69)`; developer builds from git only |
| automake | No minimum set | `AM_INIT_AUTOMAKE` has no version argument; `AM_PROG_AS` is required |
| Python | >= 3.9 | Regression tests (`README_DEVELOPERS`) |
| GNU sed, gdb, C++ compiler | Not versioned | Regression tests (`README_DEVELOPERS`) |
| Perl | Located by `configure` | Test harness |

**Configure flags**

| Flag | Effect |
|---|---|
| `--enable-only64bit` | 64-bit only build. riscv64 has no secondary arch anyway. |
| `--enable-lto=yes` | Link-time optimization. `README_PACKAGERS` says smaller and up to 10% faster. |
| `--enable-inner` | Self-hosting build |
| `--enable-ubsan` | Undefined-behaviour sanitizer |
| `--enable-tls` | Platform supports TLS |
| `--with-tmpdir=PATH` | Temp file directory, default `/tmp` |
| `--with-gdbscripts-dir` | Where GDB scripts are installed |
| `--with-mpicc` | MPI wrapper compiler |

No `--disable-*` switches for individual tools are defined.

**Hardening flags.** Stack-protector and several hardening flags are incompatible with Valgrind. Debian packaging sets `hardening=-stackprotector,-stackprotectorstrong`. Gentoo's ebuild filters `-fomit-frame-pointer`, `-fstack-protector*`, `-fsanitize*` and `-fharden-control-flow-redundancy`. [NEEDS VERIFICATION - single source]

**QEMU.** `README.riscv64` says only "tested to work on real hardware and under QEMU", with no version. The [HOWTO](https://sourceware.org/git/valgrind.git) (last updated 2023-03-25) describes full-system emulation only. User-mode `qemu-riscv64` is not mentioned.

- Required: `qemu-system-riscv64`, OpenSBI firmware at `/usr/share/qemu/opensbi-riscv64-generic-fw_dynamic.bin`, an openSUSE Tumbleweed RISC-V JeOS efi raw image converted with `qemu-img convert -f raw -O qcow2` and resized to 20G, and the `u-boot-qemu-riscv64smode` rpm for `u-boot.bin`.
- Boot: `qemu-system-riscv64 -nographic -machine virt -smp 4 -m 8G -kernel u-boot/boot/u-boot.bin` with a virtio-blk drive and a user-mode netdev forwarding tcp::5555 to guest port 22.
- Guest setup: `ssh -p 5555 root@localhost` (preset password "linux"), then `zypper install autoconf automake make gcc gcc-c++ git-core`.

**Known build and test failures**

- Test compilation failed with some binutils/GCC combinations because of relocation problems in the compressed and integer tests (bug 468575, comment #76).
- Fork PR #23 reports a link error about relocation with GNU ld 2.42 on test files [NEEDS VERIFICATION - single source].
- With SV39 virtual memory, user space is limited to 256GB, which broke the original `sh-mem-random` target address.

I did not run a build or QEMU.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Instruction coverage** (from `README.riscv64`; the fork README reports the same counts except where noted):

| Extension | Supported | Total | Gap |
|---|---|---|---|
| RV64I | 52 | 52 | None |
| RV64M | 12 | 13 | MULHSU not recognized |
| RV64A | 22 | 22 | LR/SC use the VEX fallback with the ABA problem |
| RV64F | 30 | 30 | See NaN-boxing note below |
| RV64D | 32 | 32 | None |
| RV64C | 37 | 37 | None. The fork README lists 36/37 and fork PR #24 adds compressed hints [NEEDS VERIFICATION]. |
| Zicsr | 3 | 6 | CSRRWI, CSRRSI, CSRRCI not recognized; only fflags, frm and fcsr accepted |
| Zifencei | 0 | 1 | FENCE.I not recognized |
| V (RVV 0.7.1 and 1.0) | 0 | large | Not upstream |
| Zfh | 0 | various | Not upstream; patches under review (bug 504648) |
| Zba, Zbb, Zbs, Zicond, other B/K | 0 | various | No decoder matches found |
| XTHead | 0 | various | Not upstream (exists in the rjiejie fork) |
| RV32 on RV64 | 0 | n/a | Not implemented (fork issue #20) |

**NaN-boxing / floating point.** `README.riscv64` still states that FP operands are not checked for correct NaN-boxing. The decoder contradicts this: `getFReg32()` checks NaN-boxing and substitutes the canonical NaN, matching the fix for bug 503098 (commit 9dd24c9b, 2025-05-09). On 2025-05-14 Paul Floyd asked for the README note to be removed. The README is stale on this point. Other floating-point TODOs from the README are optimizing FP exception handling without helper calls and optimizing instruction selection.

**Functional gaps (hard failures).** Any guest instruction outside the supported set produces `disInstr(riscv64): unhandled instruction`.

- FENCE.I is used by JIT-generating runtimes such as OpenJDK. Fork PR #21 adds it.
- MULHSU and CSR immediate forms. Fork PR #22 adds them.
- Binaries containing Zba/Zbb or XTHead instructions crash Valgrind. Fork issue #19 reports this on TH1520 (XTHead) and VisionFive 2 (Zba/Zbb). The claim that current GCC/Clang emit Zba/Zbb by default on capable hardware is not verified [NEEDS VERIFICATION - single source].
- `riscv_hwprobe` (syscall 258) returns ENOSYS. glibc then falls back to baseline RV64GC code paths, so extension-specific IFUNC variants are not used. Bug 503253 notes this blocks any extension support.
- RVV is absent. There are scoped design efforts (Section 13) but nothing upstream. The design problem is that translation reuse is keyed on PC only, while RVV semantics depend on VTYPE/VL state (bug 473978), and that VEX has fixed-width vector types (Ity_V128, Ity_V256). Bug 474280 proposes `Ijk_ExitBB` for `vsetvl`/`vsetvli`.

**Comparison with arm64 and amd64.** Data not available: no published riscv64 vs arm64 or riscv64 vs amd64 coverage or parity comparison was found.

**Performance.**

- No RISC-V-specific Valgrind benchmark was found in the upstream README, Bugzilla, RISE wiki pages, RISE blog, or arXiv 2507.22451 ("Dissecting RISC-V Performance", which does not mention Valgrind).
- Generic overhead figures differ between sources. The upstream manual is cited as Memcheck 10-50x slower and Nulgrind about 4x. A search snippet gave about 4x generally and up to about 100x for Memcheck, not traced to a primary source. Both are platform-independent.
- One user measurement in the fork's issue tracker reports `valgrind --tool=none` at about 17x slowdown on a VisionFive 2, against about 8x for qemu-riscv64-static, using the benchmark at [hoult.org/primes.txt](http://hoult.org/primes.txt). [NEEDS VERIFICATION - single source]

**Security hardening gaps.** Data not available: no riscv64-specific hardening data was found beyond the flag incompatibilities in Section 5.

## 7. CI/CD Infrastructure

**In-tree CI: none.**

- The sourceware repository has no `.github/`, `.gitlab-ci.yml`, `.travis.yml`, `Jenkinsfile` or `.circleci/`. A search for `*.yml`, `*.yaml` and `Jenkinsfile` outside `.git` found nothing.
- `nightly/conf/` has 13 `.conf` and 13 `.sendmail` files: cellbuzz-cross, cellbuzz-native, fedora390, freebsd, gcc114-arm64, illumos, lfedora1, nemesis, sless390, solaris11.3, solaris12, wildebeest, wildebeest32. A case-insensitive grep for "riscv" in `nightly/` returns nothing.
- `tests/` has no riscv-named file. `configure.ac` has `riscv64)` cases, which is build-system support, not CI.
- The only Buildbot mention in the tree is `README_DEVELOPERS` (line 247), which links to the `valgrind-try` builders without naming a riscv builder.

**Buildbot (out of tree).** Scheduler and builder definitions are in `master.cfg` of [builder.git](https://sourceware.org/git/builder.git) and were checked against the live [Buildbot REST API](https://builder.sourceware.org/buildbot/#/builders?tags=valgrind). There are four riscv builders:

| Builder | ID | State | Latest builds |
|---|---|---|---|
| `valgrind-ubuntu-riscv` | 340 | Active, master 2, 5 workers | #1146-#1148 all succeeded; #1148 on revision `0ff27aab0831786c7f419e73a2b5217cbbcc792d` (matches repo HEAD), latest completed 2026-09-24 |
| `valgrind-try-ubuntu-riscv` | 341 | Active, master 2, same 5 workers | #211-#213 succeeded |
| `valgrind-fedora-riscv` | 342 | Inactive: no master or workers, commented out in `master.cfg`; was bound to `bpi_f3_workers` | Last build #170, 2025-07-01 (about 15 months idle) |
| `valgrind-try-fedora-riscv` | 343 | Inactive, commented out | Last build #19, about 2025-05-29 |

- **Triggers:** `valgrind-ubuntu-riscv` is in the `valgrind` scheduler, which fires on master-branch updates. `valgrind-try-ubuntu-riscv` is in the `valgrind-try` scheduler, which fires on `users/<name>/try-*` branches. Both use `valgrind_make_check_factory` on `starfive_workers`.
- **Workers:** the `starfive-riscv` worker reports Ubuntu 24.04.5, Linux 7.0.0-31 riscv64, glibc 2.39 and g++ 14.2.0. Its admin is Mark Wielaard. Other worker names are `starfive-1` through `starfive-4` [NEEDS VERIFICATION - single source]. An earlier record shows kernel 6.17.0-29 on Ubuntu 24.04.4, so the kernel and OS point release have changed.
- **Hardware:** real StarFive boards, not QEMU. Web search results say these are StarFive-donated VisionFive 2 (JH7110, RV64GC) boards. That was not confirmed for the Valgrind workers.
- **Cadence:** roughly daily (builds #1146-#1148). A build time of about 2.1 hours and the step list (`autogen.sh`, `configure`, `make`, `make check`, `make regtest`, `make ltpchecks`, upload to the Bunsen test-tracking system, `make distclean`) are carried from earlier records and were not re-verified. [NEEDS VERIFICATION]
- **Release gating:** Data not available. Nothing found shows that Buildbot results gate merges or releases.
- **RISE runners:** none. No connection between Valgrind and `riscv-runner` or any RISE CI was found.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| In-tree CI | None | None | None |
| `nightly/conf` entry | Data not available | `gcc114-arm64` | None |
| Buildbot builders | Data not available: not enumerated | Data not available: not enumerated | `valgrind-ubuntu-riscv` and try variant active; Fedora pair inactive |
| Hardware | Data not available | Data not available | Real StarFive boards |
| Try-build for contributors | Data not available | Data not available | Yes: `valgrind-try-ubuntu-riscv` |

## 8. Distribution and Release Status

**Upstream** ships source tarballs only, with no riscv64 binary. The riscv64 binary a user consumes comes from distributions.

| Channel | Version | riscv64 binary | Notes |
|---|---|---|---|
| Upstream | 3.27.1 (2026-05-20) | No (source only) | Supported platform |
| Debian sid | 1:3.27.1-0.2 per the [riscv64 package page](https://packages.debian.org/sid/riscv64/valgrind); 1:3.25.1-3 per an earlier check | Yes | Package page lists download size 14,928.7 kB. The earlier check found `valgrind_3.25.1-3_riscv64.deb` (15.1 MiB) built on rv-osuosl-01. Versions differ between checks; not reconciled. |
| Ubuntu 26.04 (resolute) | 1:3.26.0-0ubuntu1 per [Launchpad](https://launchpad.net/ubuntu/resolute/riscv64/valgrind), status Published, released 2026-02-23 | Yes [NEEDS VERIFICATION - single source; packages.ubuntu.com returned 503] | |
| Ubuntu 24.04 (noble) | 1:3.22.0-0ubuntu3 | No | Predates riscv64 support. `valgrind-if-available` is a dependency stub only. One search summary claims Ubuntu has riscv64 builds for Jammy and Noble, which conflicts; not resolved. |
| Gentoo | 3.26.0 to 3.27.1 | Yes (source) | Marked `~riscv` (testing keyword) |
| Arch Linux RISC-V | valgrind-3.23.0-8 in the [extra repo listing](https://archriscv.felixc.at/repo/extra/) | Yes | 3.23.0 predates upstream riscv64 support, so the package may carry out-of-tree patches or the listing may be stale. Not checked. |
| PyPI `valgrind` | 0.0.0 | No | Unrelated package ("Control callgrind instrumentation from Python"), with only a macOS x86_64 cp38 wheel and an sdist |
| RISE wheel builder | Not listed | No | The RISE GitLab index redirects to PyPI. The [wheel_builder page](https://riseproject.gitlab.io/python/wheel_builder/) lists 70 packages and Valgrind is not among them. |
| Fedora riscv64 | Data not available: not searched | | |
| npm, Maven, OCI | Not applicable / Data not available | | |

**What a user must do.** On Debian sid or Ubuntu 26.04, install the distribution package. On Ubuntu 24.04, Fedora or any other system, build from a source tarball or git as in Section 5.

## 9. Dependencies

The project-graph server failed to connect, so no Ubuntu 26.04 riscv64 graph query ran. Graph status is "Data not available" for every row, which is a tool failure and not an empty result. The build, test and release columns come from the research table and direct observation. Rows without a dependency-specific riscv64 query say so.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| GCC | build-dependency, critical | Available. `configure` requires >= 3.0 with no riscv64 floor. | Buildbot builds with g++ 14.2.0 | Available | Port tested with GCC 14.2.0 |
| LLVM | build-dependency, optional (clang >= 2.9) | Limited: `README.riscv64` notes clang lacks `__builtin_longjmp` for riscv64, which Valgrind needs | Data not available | Data not available: no clang-based riscv64 build record found | None found |
| GNU binutils | build-dependency, critical | Available. Port test run used 2.43.1. | Some binutils/GCC combinations broke test compilation (relocation errors); fork PR #23 reports a GNU ld 2.42 link error | Data not available: no dependency-specific riscv64 query was run | None found |
| GNU make | build-dependency, critical | Available | Available | Available | None found |
| autoconf | build-dependency, optional (>= 2.69, git builds only) | Available | Available | Available | None found |
| automake | build-dependency, optional (git builds only) | Available | Available | Available | None found |
| Perl | test-dependency, critical | Available | Available | Available | None found |
| Python | test-dependency, optional (>= 3.9 for regression tests) | Available | Available | Available | None found |
| glibc | runtime-dependency, critical | Available. Per-version suppression files are shipped. | Buildbot runs glibc 2.39 on riscv64 | Available | See status report in project-reports/glibc.md. Bug 503253 (hwprobe) limits IFUNC use under Valgrind. |
| Linux kernel | runtime-dependency, critical | Available | Buildbot runs Linux 7.0.0-31 | Available | `riscv_hwprobe`, `rseq`, `clone3`, `kexec_load`, `fadvise64` are ENOSYS stubs |
| GDB | runtime-dependency, optional (`--vgdb`, built-in gdbserver) | Available | Valgrind's gdbserver has a riscv64 target. The `hgtls` test fails. | GDB 15+ has full riscv64 remote support [NEEDS VERIFICATION - single source] | See status report in project-reports/gdb.md |
| Open MPI | runtime-dependency, optional (`mpicc` wrapper via `--with-mpicc`) | Available | Not recorded | Available | None found |
| pthread / librt (indirect) | Runtime libraries | Part of glibc riscv64 | Part of glibc | Part of glibc | None |
| VEX (bundled, indirect) | Core IR engine, built in-tree | Partial: MULHSU, CSRRWI/SI/CI and FENCE.I are not lifted; LR/SC ABA flaw; `unchainXDirect` bug | In-tree tests | Ships with Valgrind | Gaps are in-tree TODOs, not external dependency issues |

**Deep dive: glibc and kernel interaction.** glibc (2.41 and later, per bug 503253) probes CPU extensions through `riscv_hwprobe` to select IFUNC variants. Valgrind returns ENOSYS, so glibc stays on baseline RV64GC paths. This keeps glibc inside the instruction subset Valgrind decodes. The cost is that Valgrind cannot be used to analyse the extended-ISA code paths. A full implementation is blocked on extension support (Zfh bug 504648, RVV bug 468979).

**Deep dive: toolchain output.** Valgrind can only analyse binaries whose instructions it decodes. A binary compiled with `-march` including Zba/Zbb, or with XTHead instructions, crashes Valgrind (fork issue #19). Hardware-specific toolchain defaults are therefore a dependency of Valgrind usability.

## 11. Known Bugs and Active Issues

Valgrind's bug tracker is [KDE Bugzilla](https://bugs.kde.org/), product valgrind. Status labels (REPORTED, UNCONFIRMED, REOPENED) differed between list views and individual bug pages. The open/closed split below is reliable but the exact label is not.

**Correctness bugs**

| ID | Title | Status | Severity (assessed) | Notes |
|---|---|---|---|---|
| (none filed) | `unchainXDirect_RISCV64` writes `p[19] = 0x89` instead of `0x92` | Open in the code read; no Bugzilla entry found [NEEDS VERIFICATION] | High | Corrupts the `c.jalr` when a chained translation is unchained |
| (README) | LR/SC use the VEX fallback with the ABA problem | Open (TODO in `guest_riscv64_toIR.c`) | Medium | Affects lock-free code correctness |
| [509157](https://bugs.kde.org/show_bug.cgi?id=509157) | riscv64: Shift instructions can behave wrong | Fixed 2025-09-30 (commit 97831bbb), 3.26.0 | High (fixed) | Shift amounts were not masked to 6 bits (64-bit) or 5 bits (32-bit). Reported 2025-09-05. |
| [503098](https://bugs.kde.org/show_bug.cgi?id=503098) | Incorrect NAN-boxing for float registers | Fixed 2025-05-09 (commit 9dd24c9b) | Medium (fixed) | Reported 2025-04-21 by Ivan Tetyushkin. Release: NEWS places it in 3.26.0; a search result says 3.25.1. Discrepancy not resolved. |
| [503677](https://bugs.kde.org/show_bug.cgi?id=503677) | duplicated-cond compiler warning in `dis_RV64M` | Fixed 2025-05-04 (commit 09c161e6) | Low (fixed) | Duplicated `funct3 == 0b010` test; 3.26.0 |

**Open RISC-V bugs and gaps**

| ID | Title | Status | Notes |
|---|---|---|---|
| [503253](https://bugs.kde.org/show_bug.cgi?id=503253) | `riscv_hwprobe` syscall (258) is missing | Open, confirmed; last change 2026-01-15 | Workaround commit 5efdbbd3 returns ENOSYS. Wielaard (2025-10-17): the workaround "isn't ideal and prevents use of extended instruction sets." A volunteer offered a fix on 2026-01-15. |
| [504648](https://bugs.kde.org/show_bug.cgi?id=504648) | Add support for RISC-V Zfh | Open; last change 2026-01-19; assigned to Wielaard | 5 patches. Wielaard asked for `VEX_HWCAPS_RISCV_Zfh` checks in place of `#ifdef __riscv_zfh`, feature-detection tests and configure checks. Submitter posted updated patches in July 2025 and was waiting on review through January 2026. |
| [468979](https://bugs.kde.org/show_bug.cgi?id=468979) | Add support for RISC-V vector instructions | Open; last change 2024-12-23 | Out-of-tree implementation in [rjiejie/valgrind-riscv64](https://github.com/rjiejie/valgrind-riscv64) (Zfh, Xthead, V0.7.1, V1.0) |
| [473978](https://bugs.kde.org/show_bug.cgi?id=473978) | Add support for checking of cpu state in code translation | Open; last change 2024-12-23 | RVV prerequisite; 6 patches from Alibaba authors |
| [474280](https://bugs.kde.org/show_bug.cgi?id=474280) | Add Ijk_ExitBB IR for potential critical state | Open; last change 2024-12-23 | RVV prerequisite (`vsetvl`/`vsetvli`) |
| [514962](https://bugs.kde.org/show_bug.cgi?id=514962) | Add support for RISC-V debuginfo | Open; reported 2026-01-23; assigned to Wielaard | Patch attached |

Bugs 487862, 498103, 383010 and 522533 matched RISC-V searches but are not RISC-V-specific.

**Fork issues and PRs** (not in upstream; [petrpavlu/valgrind-riscv64](https://github.com/petrpavlu/valgrind-riscv64)):

| Item | Title | Notes |
|---|---|---|
| [Issue #3](https://github.com/petrpavlu/valgrind-riscv64/issues/3) | Prepare for upstream? | Open despite the upstream merge |
| [Issue #17](https://github.com/petrpavlu/valgrind-riscv64/issues/17) | riscv vector ISA support | Documents the VEX scalable-vector problem |
| [Issue #19](https://github.com/petrpavlu/valgrind-riscv64/issues/19) | Support for Zba, Zbb, and XTHead instructions | Hard crashes on TH1520 and VisionFive 2 |
| [Issue #20](https://github.com/petrpavlu/valgrind-riscv64/issues/20) | Running RV32 code on RV64 | Not implemented |
| [PR #21](https://github.com/petrpavlu/valgrind-riscv64/pull/21) | support fence.i (mingyuan-xia, UltraRISC) | Technical review from Pavlu in Aug-Sep 2024; not merged |
| [PR #22](https://github.com/petrpavlu/valgrind-riscv64/pull/22) | Add support for mulhsu and CSRR*I (XiaoWang1772, Intel) | Unreviewed; "Gentle ping" 2025-01-02 unanswered. Tracked by RISE issues #147 and #148. |
| [PR #23](https://github.com/petrpavlu/valgrind-riscv64/pull/23) | Fix link error about relocation (XiaoWang1772, Intel) | Unreviewed |
| [PR #24](https://github.com/petrpavlu/valgrind-riscv64/pull/24) | Support compress hint instructions (ita-sc) | Unreviewed |
| [PR #25](https://github.com/petrpavlu/valgrind-riscv64/pull/25) | Correct nan-boxing for single-precision calculations (ita-sc) | Unreviewed. Its title matches upstream commit 9dd24c9b and upstream `getFReg32()` already checks NaN-boxing, so it is likely superseded [NEEDS VERIFICATION]. |

PR author affiliations and review-status details are from fork metadata only [NEEDS VERIFICATION]. Fork repository metrics differ between fetches (59 or 68 stars, 17 forks, 4 or 7 open issues), so treat them as approximate. The fork README reports 737 tests with 4 failures (`hgtls` stdoutB and 3 `double_close_range` stderr variants), dated 2024-06-18.

## 12. Objections and Upstream Blockers

**Objection 1: "Supported" means complete.** Not accurate. Upstream covers RV64GC only. FENCE.I, MULHSU, CSR immediates and Zba/Zbb/XTHead instructions cause hard crashes. The `unchainXDirect` bug and the LR/SC ABA flaw are correctness issues independent of ISA coverage.

**Objection 2: The open fork PRs close the gaps.** Partially. PRs #21, #22 and #24 cover FENCE.I, MULHSU/CSR immediates and compressed hints. They sit in the fork and have not been submitted as Bugzilla patches. PR #25 is likely superseded. No PR addresses Zba/Zbb, XTHead, RVV or Zfh. RISE issues #147 and #148 track upstreaming of the PR #22 content.

**Objection 3: Buildbot is adequate CI.** It runs on real hardware almost daily and has a working try-build path (`valgrind-try-ubuntu-riscv`, triggered by `users/<name>/try-*` branches), so contributors can test riscv64 patches before commit. It is not an in-tree gate, and the Fedora pair has been inactive since mid-2025, leaving a single OS and worker pool.

**Objection 4: RVV can be added incrementally.** No. It needs scalable-vector IR support in VEX and CPU-state-aware translation caching (bugs 473978, 474280). This is under design (RISE issues #138 and #157; Section 13). The related Arm SVE prototype by Petr Pavlu and a unified SVE/RVV approach were discussed in 2023 (RISE issue #157 updates). Nothing is upstream.

**Objection 5: Zba/Zbb only affects explicit opt-in.** Binaries built with those extensions crash Valgrind. Whether current toolchains enable them by default on capable hardware is unverified [NEEDS VERIFICATION].

**Technical blockers**

- `riscv_hwprobe` needs a real implementation before any extension (Zfh, RVV) can be exposed to guests (bug 503253).
- Zfh needs hwcaps detection plumbing (`VEX_HWCAPS_RISCV_Zfh`) and tests (bug 504648).
- RVV needs scalable-vector IR, CPU-state-keyed translation cache, and an `Ijk_ExitBB` jump kind.

**Organizational blockers**

- Review bandwidth: the Zfh patches have been awaiting review since mid-2025, and Wielaard cited the 3.26.0 release for delays. Fork PRs #22-#25 have had no review.
- No named riscv64 maintainer and no MAINTAINERS file.
- Patch flow through Bugzilla attachments is unfamiliar to contributors who work through GitHub/GitLab, as the bug 503253 exchange shows.
- Historical precedent: the base port took about two years from submission (April 2023) to release (April 2025).

**Acceptance probability.** Data not available as a quantity. Observed fix turnaround for confirmed RISC-V defects is short: 503677 in about 2 days, 503098 in 18 days, 509157 in 25 days. Larger or extension-level work (Zfh, RVV, hwprobe) has not been accepted after 9 to 36 months.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro
- **Optimization-purpose project:** no. Valgrind is a dynamic analysis tool, so the optimization modifier does not apply.

**Justification.** The upstream sourceware Buildbot builder [valgrind-ubuntu-riscv](https://builder.sourceware.org/buildbot/#/builders?tags=valgrind) builds and runs make check/regtest on real riscv64 hardware (StarFive boards) almost daily. The last three builds (#1146-#1148, latest 2026-09-24) passed. riscv64/Linux has been a supported platform since [3.25.0](https://valgrind.org/docs/manual/dist.readme-riscv64.html), but upstream ships source tarballs only, so the consumable riscv64 binary comes from distros (Debian sid). The release is provided by Debian, not upstream. It is not green because upstream publishes no riscv64 binary. The CI is out-of-tree Buildbot, not an in-tree gate, and the Fedora riscv64 builder has been idle since 2025-07.

**Pending work that could change the grade**

- Open KDE Bugzilla items: [503253](https://bugs.kde.org/show_bug.cgi?id=503253) (`riscv_hwprobe` only stubbed to return ENOSYS), [504648](https://bugs.kde.org/show_bug.cgi?id=504648) (Zfh patches awaiting review since mid-2025), [468979](https://bugs.kde.org/show_bug.cgi?id=468979), [473978](https://bugs.kde.org/show_bug.cgi?id=473978) and [474280](https://bugs.kde.org/show_bug.cgi?id=474280) (RVV and its prerequisites, not upstream), and [514962](https://bugs.kde.org/show_bug.cgi?id=514962) (RISC-V debuginfo).
- Decode gaps are fork PRs #21-#25 (FENCE.I, MULHSU, CSR immediates, compressed hints), not yet upstream. Zba/Zbb/XTHead binaries crash Valgrind (fork issue #19).
- RISE tracks Valgrind work in [riseproject-dev/kernel-and-virtualization-wg](https://github.com/riseproject-dev/kernel-and-virtualization-wg) issues #138 (scalable vector IR), #147 (mulhsu), #148 (CSR*I) and #157 (vector support, Intel-led). There is no RISE runner or release involvement.
- The grade computation did not check the Ubuntu 26.04 riscv64 package because the project-graph server failed to connect. A Launchpad page shows 1:3.26.0-0ubuntu1 published for Ubuntu resolute riscv64 [NEEDS VERIFICATION - single source], which would be another distro provider. Ubuntu 24.04 ships 3.22.0 with no riscv64 binary.

**RISE involvement in detail**

- **Not a RISE project or member.** No RISE blog post mentions Valgrind (the [feed](https://riseproject.dev/feed/) returned 7 posts dated 2026-07-07 to 2026-09-28; older posts may not be covered). `riseproject-dev` has no Valgrind repository among its 30 repositories. The only Valgrind-related repos outside the organization are [petrpavlu/valgrind-riscv64](https://github.com/petrpavlu/valgrind-riscv64) and [intel/valgrind-rvv](https://github.com/intel/valgrind-rvv) (branch `poc-rvv`).
- **DP_00_001 Valgrind vector support** ([issue #157](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/157), open, last updated 2026-09-02). Led by Intel. Scope: a vector-IR framework plus tens of RVV instructions in the riscv port, tested against riscv-v-spec examples with Memcheck. Milestones: solution discussion 2023-08-31, prototype 2023-09-30, upstream 2023-12-31. Updates: 2023-08-30 Intel set up a public repo with dozens of RVV instructions; 2023-10-19 Petr Pavlu acked the patch; 2023-11-15 discussion of a unified SVE/RVV solution; 2024-02-29 Pavlu proposed an alternative approach, and Intel's prototype could run CoreMark with auto-vectorization. High priority per a search snippet [NEEDS VERIFICATION]. The Confluence page could not be fetched, so details come from the GitHub issue and search snippets. The `intel/valgrind-rvv` repository was archived read-only on 2025-09-29 and its README reports Memcheck 10/219, DRD 4/130, Helgrind 4/55 failing, in a status table dated December 2022.
- **DP_00_002 Valgrind vector instruction support.** Led by T-Head (Alibaba), medium priority, in progress, helper-function-based RVV approach. Confluence page only; upstream status unknown. This matches the rjiejie fork (Zfh, Xthead, V0.7.1, V1.0; test results as of 2023-08-29: Memcheck 0/219, DRD 0/130, Helgrind 0/55, GDBserver 0/25 failures).
- **DP_00_003 Valgrind basic RISC-V support.** Led by Ventana, low priority, tentative ETA Q3 2023, then RVA22/RVA23 extensions. Confluence page only. The base port later landed through community effort in 3.25.0.
- **DP_00_005 Valgrind scalable vector IR** ([issue #138](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/138)). Proof of concept of a generic scalable vector IR for both Arm SVE and RVV, based on intel/valgrind-rvv, so RVV can be upstreamed. The Confluence page is archived and credits Xiao W Wang.
- **[Issue #147](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/147) (mulhsu) and [#148](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/148) (CSRRWI/CSRRSI/CSRRCI).** Add the missing instructions with tests. Success is a posted and reviewed patch. Upstreaming is tracked in fork PR #22.
- All four issues are labelled "Debug Tools" and are open. They were created during the July 2026 move of working-group tracking to GitHub. The board at `riseproject-dev` project #14 and other working-group repositories were not searched. No funding amounts were seen.

## 14. Investment Analysis

RISE already tracks vector support (#157, DP_00_002), scalable vector IR (#138), mulhsu (#147) and CSR*I (#148). Those items are not sized below. Effort figures are engineering estimates, not measured data.

### 14.1 Functional Enablement

- Submit fork PRs #21 (FENCE.I) and #24 (compressed hints) as Bugzilla patches with tests. PR #22 content is covered by RISE #147 and #148. Confirm whether PR #25 is superseded by commit 9dd24c9b.
- Fix `unchainXDirect_RISCV64` and file the bug. Re-verify against the current HEAD first.
- Implement `riscv_hwprobe` properly (bug 503253). Pair it with extension detection in `m_machine.c`.
- Get the Zfh patches reviewed and finished (bug 504648). The code exists. The remaining work is review and the hwcaps and test changes Wielaard requested.
- Add Zba/Zbb decode and emission, then XTHead if TH1520/C910 support is wanted (fork issue #19).
- Resolve the LR/SC ABA problem for lock-free code.
- Complete ENOSYS-stubbed syscalls where fallback is not deliberate (`kexec_load`, `fadvise64`).
- Land RISC-V debuginfo (bug 514962 patch review).
- Remove the stale NaN-boxing note from `README.riscv64`.

### 14.2 Performance Optimization

No riscv64 baseline exists, so none of the README optimization TODOs can be sized from data. Establish a baseline against arm64 first. Then address FP exception handling without helper calls, instruction selection for immediate forms, and register usage review.

### 14.3 CI/CD Infrastructure

Buildbot riscv64 is operational for Ubuntu. Options: restore a Fedora riscv64 worker (the builder definitions exist but are commented out), and add an in-tree CI definition if the project accepts one. The project has none for any architecture today.

### 14.4 Ecosystem Enablement

Debian sid carries a riscv64 package and Ubuntu 26.04 reportedly carries 3.26.0. A backport to Ubuntu 24.04 remains the open distro item. A first-party upstream riscv64 binary is not planned in any source found.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix `unchainXDirect_RISCV64` byte corruption and file bug | 1 | Assignee TBD | Critical |
| Functional | Upstream fork PRs #21 and #24 (FENCE.I, compressed hints) with tests | 2 | Assignee TBD | High |
| Functional | Full `riscv_hwprobe` implementation plus hwcaps detection (bug 503253) | 3 | Assignee TBD | High |
| Functional | Drive Zfh patches through review (bug 504648) | 1 | Assignee TBD | High |
| Functional | Zba/Zbb decode and emission | 4 | Assignee TBD | High |
| Functional | LR/SC non-fallback implementation (ABA) | 4 | Assignee TBD | Medium |
| Functional | XTHead decode (TH1520, C910) | 3 | Assignee TBD | Medium |
| Functional | Syscall wrapper completeness (`kexec_load`, `fadvise64`, review of `clone3`/`rseq` fallbacks) | 2 | Assignee TBD | Medium |
| Functional | RISC-V debuginfo patch review (bug 514962) | 1 | Assignee TBD | Medium |
| Functional | mulhsu, CSR*I upstreaming | Covered by RISE issues #147 and #148 | RISE | Not sized |
| Functional | RVV and scalable vector IR | Covered by RISE issues #138 and #157 and DP_00_002; remaining effort not scoped upstream | Intel, T-Head, upstream maintainers | Not sized |
| Performance | Establish riscv64 performance baseline vs arm64 | 2 | Assignee TBD | High |
| Performance | Eliminate FP exception helper calls | 3 | Assignee TBD | Medium |
| Performance | Immediate-form instruction selection | 2 | Assignee TBD | Medium |
| CI/CD | Restore Fedora riscv64 Buildbot worker | 1 | Assignee TBD | Medium |
| CI/CD | In-tree or nightly riscv64 CI entry | 2 | Assignee TBD | Medium |
| Ecosystem | Backport Valgrind 3.25 or later to Ubuntu 24.04 riscv64 | 3 | Canonical | Medium |
| Ecosystem | Name an upstream riscv64 maintainer / review owner | 0 (organizational) | Leadership | Critical |

## 15. References

- [Valgrind homepage](https://valgrind.org/)
- [Valgrind platforms and tier policy](https://valgrind.org/info/platforms.html)
- [Valgrind release news](https://valgrind.org/docs/manual/dist.news.html)
- [Valgrind README.riscv64](https://valgrind.org/docs/manual/dist.readme-riscv64.html)
- [Valgrind git repository (sourceware)](https://sourceware.org/git/valgrind.git)
- [Sourceware Buildbot master configuration (builder.git)](https://sourceware.org/git/builder.git)
- [Sourceware Buildbot, Valgrind builders](https://builder.sourceware.org/buildbot/#/builders?tags=valgrind)
- [LWN: Valgrind 3.25.0](https://lwn.net/Articles/1019227/)
- [KDE Bug 468575: Add support for RISC-V](https://bugs.kde.org/show_bug.cgi?id=468575)
- [KDE Bug 468979: RISC-V vector instructions](https://bugs.kde.org/show_bug.cgi?id=468979)
- [KDE Bug 473978: checking of cpu state in code translation](https://bugs.kde.org/show_bug.cgi?id=473978)
- [KDE Bug 474280: Ijk_ExitBB IR](https://bugs.kde.org/show_bug.cgi?id=474280)
- [KDE Bug 503098: NaN-boxing](https://bugs.kde.org/show_bug.cgi?id=503098)
- [KDE Bug 503253: riscv_hwprobe missing](https://bugs.kde.org/show_bug.cgi?id=503253)
- [KDE Bug 503677: duplicated-cond warning in dis_RV64M](https://bugs.kde.org/show_bug.cgi?id=503677)
- [KDE Bug 504648: Zfh extension](https://bugs.kde.org/show_bug.cgi?id=504648)
- [KDE Bug 509157: Shift instructions](https://bugs.kde.org/show_bug.cgi?id=509157)
- [KDE Bug 514962: RISC-V debuginfo](https://bugs.kde.org/show_bug.cgi?id=514962)
- [KDE Bugzilla RISC-V query](https://bugs.kde.org/buglist.cgi?product=valgrind&quicksearch=riscv%20OR%20riscv64%20OR%20rvv&limit=100)
- [petrpavlu/valgrind-riscv64 fork](https://github.com/petrpavlu/valgrind-riscv64)
- [Fork issue #3](https://github.com/petrpavlu/valgrind-riscv64/issues/3)
- [Fork issue #17](https://github.com/petrpavlu/valgrind-riscv64/issues/17)
- [Fork issue #19](https://github.com/petrpavlu/valgrind-riscv64/issues/19)
- [Fork issue #20](https://github.com/petrpavlu/valgrind-riscv64/issues/20)
- [Fork PR #21](https://github.com/petrpavlu/valgrind-riscv64/pull/21)
- [Fork PR #22](https://github.com/petrpavlu/valgrind-riscv64/pull/22)
- [Fork PR #23](https://github.com/petrpavlu/valgrind-riscv64/pull/23)
- [Fork PR #24](https://github.com/petrpavlu/valgrind-riscv64/pull/24)
- [Fork PR #25](https://github.com/petrpavlu/valgrind-riscv64/pull/25)
- [rjiejie/valgrind-riscv64 (T-Head RVV fork)](https://github.com/rjiejie/valgrind-riscv64)
- [intel/valgrind-rvv](https://github.com/intel/valgrind-rvv)
- [FOSDEM 2022: Valgrind on RISC-V](https://archive.fosdem.org/2022/schedule/event/valgrind_riscv/)
- [RISE members](https://riseproject.dev/members/)
- [RISE blog feed](https://riseproject.dev/feed/)
- [RISE wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)
- [RISE DP_00_001 Valgrind vector support (wiki; not fetchable)](https://wiki.riseproject.dev/display/HOME/DP_00_001+-+Valgrind+vector+support)
- [RISE DP_00_005 Valgrind scalable vector IR](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/115081517/DP_00_005+-+Valgrind+scalable+vector+IR)
- [RISE Debug and Profiling WG projects](https://lf-rise.atlassian.net/wiki/spaces/HOME/pages/8589360/Debug+and+Profiling+WG+-+Projects)
- [RISE kernel-and-virtualization-wg issue #138](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/138)
- [RISE kernel-and-virtualization-wg issue #147](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/147)
- [RISE kernel-and-virtualization-wg issue #148](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/148)
- [RISE kernel-and-virtualization-wg issue #157](https://github.com/riseproject-dev/kernel-and-virtualization-wg/issues/157)
- [arXiv 2507.22451: Dissecting RISC-V Performance](https://arxiv.org/abs/2507.22451v1)
- [Primes benchmark referenced in fork issue](http://hoult.org/primes.txt)
- [Debian sid riscv64 valgrind package](https://packages.debian.org/sid/riscv64/valgrind)
- [Ubuntu resolute riscv64 valgrind (Launchpad)](https://launchpad.net/ubuntu/resolute/riscv64/valgrind)
- [Ubuntu noble valgrind package](https://packages.ubuntu.com/noble/valgrind)
- [Arch Linux RISC-V extra repository](https://archriscv.felixc.at/repo/extra/)
- [PyPI valgrind package (unrelated)](https://pypi.org/pypi/valgrind/json)
- [FreeBSD status report on Valgrind arm64](https://www.freebsd.org/status/report-2024-01-2024-03/valgrind)