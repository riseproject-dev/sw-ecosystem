---
title: elfutils
parent: Project Reports
color: blue
dependencies:
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: critical
  - name: bzip2
    relation: runtime-dependency
    criticality: optional
  - name: xz
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: libcurl
    relation: runtime-dependency
    criticality: optional
  - name: libmicrohttpd
    relation: runtime-dependency
    criticality: optional
  - name: SQLite
    relation: runtime-dependency
    criticality: optional
  - name: libarchive
    relation: runtime-dependency
    criticality: optional
  - name: json-c
    relation: runtime-dependency
    criticality: optional
  - name: QEMU
    relation: test-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="elfutils" %}

# elfutils

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** blue<br/>
**Scope:** RISC-V (riscv64/linux) support status for elfutils<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

elfutils is the canonical ELF and DWARF processing library suite on Linux. It provides:

- **libelf**: low-level ELF file read/write (an alternative to BFD's libelf)
- **libdw**: DWARF consumer (CFI, line tables, type info, abbreviations)
- **libdwfl**: higher-level debugger integration layer (module loading, stack unwinding, live process inspection via ptrace)
- **libcpu**: per-architecture disassemblers (used by eu-objdump)
- **debuginfod**: a source/debuginfo distribution server, client library, and CLI
- **Command-line tools**: eu-strip, eu-readelf, eu-objdump, eu-stack, eu-elflint, eu-nm, eu-addr2line, debuginfod-find

The project is the ELF/DWARF backend for systemtap, perf symbol annotation, bpftrace symbol resolution, GDB's build-ID index, RPM debuginfo packaging, Fedora/Red Hat's debuginfod infrastructure, and several kernel profiling tools.

elfutils is hosted on [sourceware.org](https://sourceware.org/elfutils/) (git, Bugzilla, mailing list, Patchwork), not GitHub; unofficial read-only GitHub mirrors exist (e.g. `sailfishos-mirror/elfutils`, `fedora-riscv/elfutils`) but carry no project activity of their own. Since 2023, Sourceware is a member project of the Software Freedom Conservancy, which acts as fiscal sponsor and legal/governance host. Sourceware's own governance is a Project Leadership Committee (PLC) of 8 people with a rule that no more than 2 members may work for the same employer (members include Mark J. Wielaard, Ian Lance Taylor, Tom Tromey, Jon Turney, Elena Zannoni, Frank Ch. Eigler, Christopher Faylor, Ian Kelling). Day-to-day elfutils maintenance is informal and mailing-list-driven (`elfutils-devel@sourceware.org`), led in practice by **Mark J. Wielaard** (Red Hat), who is also a Sourceware PLC member. There is no MAINTAINERS or CODEOWNERS file in the repository (confirmed by a direct clone); only AUTHORS, THANKS, CONTRIBUTING, CONDUCT and SECURITY exist. Patches use a Linux-kernel-style `Signed-off-by` DCO process; there is no CLA. License is dual GPLv2+/LGPLv3+ for the libraries and backends, GPLv3+ for the command-line utilities.

**Corporate affiliations of key RISC-V contributors** (no single corporate sponsor, but concentrated in a few companies):

| Contributor | Org | Role |
|---|---|---|
| Andreas Schwab | SUSE | Authored the original RISC-V backend (2018); most prolific RISC-V contributor (10 commits to the riscv backend) |
| Mark Wielaard | Red Hat | Lead maintainer; merged flatten_aggregate and disassembler fixes |
| Jim Wilson | SiFive (at the time) | 3 commits improving riscv64 core-file/return-value support, Dec 2018 |
| William Cohen | Red Hat | LP64/LP64F ABI return-value support, 2021 |
| Ilya Leoshkevich | IBM | lvalue/rvalue reference return support, 2023 |
| Ulrich Drepper | Independent (formerly Red Hat/Google/Akamai) | Added the RISC-V disassembler, 2019 |
| Aaron Merey | Red Hat | Disassembler fixes, const-correctness, CSR out-of-bounds fixes |

For comparison, the later LoongArch backend was contributed by Loongson engineers (Youling Tang, Liwei Ge) following the same "company engineer submits a patch series, gets it merged" pattern used for RISC-V. elfutils has no formal architecture-tiering policy and no RFC/vote/foundation-approval gate for new backends: a new architecture is accepted through ordinary patch review on `elfutils-devel`.

**RISE Project involvement:** elfutils is not a RISE member or backed project. A full inventory of all 35 RISE blog posts (May 2024 to Sep 2026, via the site's sitemap) and the site's own search contain zero mentions of elfutils, libdw, libelf, or debuginfod. elfutils is also not listed on RISE's Python wheel_builder page (79 packages tracked, elfutils absent), and a check of the `riseproject-dev/system-libraries-wg` GitHub issue tracker (18 issues) found zero elfutils references. The only concrete, verifiable touchpoint found is indirect: `riseproject-dev/python-wheels` PR #2398 ("pystack: Add version 1.7.1") compiles elfutils from source as a native build dependency of pystack's nanobind C++ extension (which links against libdw/libelf), built and tested on RISE's own bare-metal RISC-V Runners (`riseproject-dev/riscv-runner`, Scaleway EM-RV1 hardware). That PR explicitly notes there is no riscv64 equivalent of the `elfutils-aarch64-signal-frame.patch` used for AArch64 native-unwind support, i.e. a documented per-architecture native-unwind gap surfaces even in this downstream consumer. This is an incidental build dependency inside RISE's Python package pipeline, not a funded or tracked RISE project.

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream. No downstream-only patches were found in Debian, Ubuntu, or Arch Linux RISC-V packaging for elfutils.

| Date | Event | Source |
|---|---|---|
| 2018-04-19 | First RISC-V commit (`470aba95790b52d70b6bd78b4c4a481ab791a4c9`, "Add support for RISC-V"): initial riscv64 backend module, `backends/riscv_init.c`. Author: Andreas Schwab (SUSE). | [Governance/history research, direct clone](https://sourceware.org/elfutils/) |
| 2018-Q2/Q3 | Initial backend files follow: riscv_reloc.def, riscv_symbol.c, riscv_regs.c, riscv_cfi.c. | [elfutils homepage](https://sourceware.org/elfutils/) |
| 2018-12 | Jim Wilson (SiFive): 3 commits improving riscv64 core-file and return-value support. | Contributor-history research |
| 2019-09-07 | Ulrich Drepper posts the RISC-V disassembler patch (`libcpu/riscv_disasm.c`, ~1501 lines, rv32/rv64, compressed+standard encodings, float/system instructions). Reviewed by Mark Wielaard and Jim Wilson (SiFive), who flags the deliberate exclusion of the then-unstable Vector and Bit-Manipulation extensions. | [2019q3 thread](https://sourceware.org/pipermail/elfutils-devel/2019q3/001999.html) |
| 2019-11-27 | elfutils 0.178 released, confirmed shipping the RISC-V disassembler per the release announcement. | [Release announcement](https://sourceware.org/legacy-ml/elfutils-devel/2019-q4/msg00219.html) |
| 2022-10 to 11 | Andreas Schwab / Mark Wielaard: PT_RISCV_ATTRIBUTES / SHT_RISCV_ATTRIBUTES object-attribute support (elf.h sync, elflint zero-p_memsz handling, readelf attribute printing via a new `has_gnu_attributes` ebl flag). Root RFC thread authored by Mark Wielaard, not Andreas Schwab as earlier summarized; final committed diff text was not independently retrievable (Bugzilla/gitweb blocked by anti-bot protection), so the mechanism is confirmed via mailing-list discussion, not the literal merged patch. | [RFC thread](https://sourceware.org/pipermail/elfutils-devel/2022q4/005408.html) |
| 2022-11-02 | elfutils 0.188 released; `SHT_RISCV_ATTRIBUTES` confirmed present in `src/readelf.c` at the 0.188 tag, absent at 0.187. | Source-diff verification |
| 2021 | William Cohen (Red Hat): LP64/LP64F ABI return-value support. | Contributor-history research |
| 2023-06-17 | Test fix: `run-strip-reloc.sh` updated for RISC-V ELF relocation sections. | [Commit 127e3831](https://sourceware.org/git/?p=elfutils.git;a=commit;h=127e3831c169851e796496582213a94965337696) |
| 2023-06-26 | psABI sync: add IRELATIVE, PLT32, SET_ULEB128, SUB_ULEB128 to riscv_reloc.def. | [Commit 485b87a2](https://sourceware.org/git/?p=elfutils.git;a=commit;h=485b87a2e53045d2284a6649d529ab3aaa22e127) |
| 2023 | Ilya Leoshkevich (IBM): lvalue/rvalue reference return support. | Contributor-history research |
| 2024-03-19 | Bugzilla backends/31142 fixed ("riscv pass_by_flattened_arg not implemented"): partial `flatten_aggregate` implementation in `riscv_retval.c` for same-base-type struct members. SiFive's Palmer Dabbelt (RISC-V psABI maintainer) reviewed and flagged that the psABI also allows a struct with one float and one integer member to be split across an FP and a GP register, a case the initial patch did not handle; Mark Wielaard acknowledged the gap and committed to extending the implementation. Author: Mark Wielaard. | [Commit 669b6481](https://sourceware.org/git/?p=elfutils.git;a=commit;h=669b648111d3bc27cd4756879f5fe5a18515de77), [review thread](https://www.mail-archive.com/elfutils-devel@sourceware.org/msg06864.html) |
| 2024-03-19 | elfutils 0.192 released; commit confirmed present (absent in the 0.191 tag source, present in 0.192). | Tag-diff verification |
| 2024-07-31 | Remove seven obsolete relocations from riscv_reloc.def. Authors: Andreas Schwab / Aaron Merey. | [Commit 46c5c98e](https://sourceware.org/git/?p=elfutils.git;a=commit;h=46c5c98ee7ce2108f51ca8ecb0e81d55797c8470) |
| 2024-12-30 | Fix false elflint `_GLOBAL_OFFSET_TABLE_` warning for RISC-V `.got.plt` layout (lld-linked binaries). Author: Mark Wielaard. First shipped in 0.193. | [Commit a4ece6a5](https://sourceware.org/git/?p=elfutils.git;a=commit;h=a4ece6a521c181e43854a5691d8c2828d326a925) |
| 2025-05-27 | Bug tools/33006 opened (Xiaoguo Li, CUPL; Xudong Cao, UCAS), against elfutils 0.192: AddressSanitizer-detected stack buffer overflow in `riscv_disasm.c:1308` (`mnebuf` overflow disassembling crafted illegal instructions up to 24 bytes). Mark Wielaard's first triage closed it NOTABUG, characterizing it as a `_FORTIFY_SOURCE`-triggered `snprintf` truncation rather than an exploitable overflow; the reporter reopened and reproduced on current main before the fix. | [Bug report thread](https://www.mail-archive.com/elfutils-devel@sourceware.org/msg08170.html) |
| 2025-06-03 | Bug 33006 fixed: `mnebuf` enlarged to 50 chars. Author: Mark Wielaard. First shipped in elfutils 0.194 (confirmed present in the 0.194 tag shortlog; tag dated 2025-10-25). | [Commit 07bd923c](https://sourceware.org/git/?p=elfutils.git;a=commit;h=07bd923cea4b883ca2357e9fc80babcedd242b37) |
| 2025-11-24 | Fix const-correctness in `riscv_disasm.c` (C23 `bsearch` const-`void*` prototype mismatch broke clang `-Werror` builds for 0.191-0.194). Authors: Andreas Schwab / Aaron Merey. First shipped in 0.195. | [Commit 4a5cf8be](https://sourceware.org/git/?p=elfutils.git;a=commit;h=4a5cf8be906d5991e7527e69e3f2ceaa74811301) |
| 2026-05-31 | Fix two out-of-bounds reads in `riscv_disasm.c` CSR mnemonic lookup arrays (crafted-ELF triggerable). Author: Aaron Merey. Carried in the 0.196 changelog per the August 2026 release notes. | [Commit 003d1c8b](https://sourceware.org/git/?p=elfutils.git;a=commit;h=003d1c8bc8be6c45fc39eb1b886def17482ed3a5) |
| 2026 (summer) | elfutils 0.196 released (current upstream release; confirmed via a direct repo clone showing `AC_INIT` version 0.196 with copyright lines through 2026, and the release announcement). | [0.196 release announcement](http://www.mail-archive.com/elfutils-devel@sourceware.org/msg09512.html) |

No single master tracking bug for "the riscv64 port" exists; support was added incrementally across release cycles, each reviewed and merged directly to `master` by Mark Wielaard with no foundation approval gate.

## 3. Upstream Support Tier

elfutils publishes no formal tiering policy (no document analogous to GCC's host/target tier list or LLVM's tier policy). The effective tier is determined in practice by whether a Buildbot CI worker exists for the architecture, whether it is listed as supported on the project homepage, and whether the maintainer accepts patches for it. riscv64 satisfies all three.

riscv64 is explicitly listed as a supported ELF backend architecture on the [elfutils homepage](https://sourceware.org/elfutils/). Releases are not formally gated on riscv64 CI passing (there is no documented release-blocking policy for any architecture), but the CI runs on every push regardless.

| Architecture | Buildbot builder present | Worker type | Active |
|---|---|---|---|
| amd64/x86_64 | Yes (Debian, Fedora, CentOS, openSUSE builders) | x86_64 VM | Yes |
| arm64 | Yes (Debian builder) | arm64 VM | Yes |
| riscv64 | Yes (`elfutils-ubuntu-riscv`, `elfutils-try-ubuntu-riscv`) | 5 physical StarFive VisionFive V2 boards | Yes |

The project's stance on riscv32 is explicitly limited: Mark Wielaard has stated that elfutils "accepts 32-bit RISC-V ELF files, but don't know anything about how it handles calling conventions." Only riscv64 ABIs (lp64, lp64f, lp64d) are implemented in `riscv_retval.c` and `riscv_initreg.c`. This report covers riscv64 only.

## 4. Technical Architecture and RISC-V-Specific Subsystems

elfutils is a pure C project: no JIT, no SIMD dispatch, no cryptographic implementation, and no assembly code anywhere in the source tree, for any architecture (this is a general project characteristic, not a riscv64-specific gap). Architecture-specific code lives in `backends/` (ELF/DWARF processing) and `libcpu/` (disassembly), using an `<arch>_*.c` filename-prefix convention rather than an `arch/riscv/` subdirectory.

**RISC-V backend files, independently reviewed against current upstream source (direct clone of `sourceware.org/git/elfutils.git`):**

| File | Purpose | Quality | Notes |
|---|---|---|---|
| `riscv_reloc.def` | Relocation type table | Full | Complete, including TLS and ADD/SUB relaxation relocations |
| `riscv_retval.c` (413 lines) | DWARF return-value location for lp64/lp64f/lp64d ABIs | Full for simple cases, partial overall | Correctly implements GPR/FPR passing, struct "flattening" for same-base-type members, pass-by-reference for large aggregates, and complex floats; mixed int+float structs, nested structs, and unions remain unimplemented (acknowledged partial in the 2024-03-19 commit) |
| `riscv_cfi.c` | DWARF CFI ABI defaults | Full | Correct CFA=sp, ra=x1, all callee-saved GPRs/FPRs (s0-s11, fs0-fs11) marked same-value |
| `riscv_regs.c` | DWARF register name/number table | Full | All 64 int+FP register names (x0-x31, f0-f31 with ABI aliases) |
| `riscv_symbol.c` | Special symbol/ELF metadata validation, object attributes | Full, with one known bug | `PT/SHT_RISCV_ATTRIBUTES`, `DT_RISCV_VARIANT_CC`, `_GLOBAL_OFFSET_TABLE_`/`__global_pointer$` handling correctly implemented; see SHT_RISCV_ATTRIBUTES stripping bug in Section 6/11 |
| `riscv_corenote.c` / `riscv64_corenote.c` | Core-dump note parsing | Partial | Only `PRSTATUS` (integer registers + pc) is defined; unlike `aarch64_corenote.c`, `x86_64_corenote.c`, and `arm_corenote.c`, there is no `NT_FPREGSET` item set at all |
| `riscv_initreg.c` | Live register read via ptrace for debugger integration | Partial | Fetches x0-x31 and PC via `PTRACE_GETREGSET`/`NT_PRSTATUS` correctly; source explicitly states "FP registers not yet supported," no `NT_FPREGSET` fetch |
| `libcpu/riscv_disasm.c` (1504 lines) | Instruction disassembler | Partial | Hand-decodes RV64 base integer, compressed 16-bit (C), multiply/divide (M), atomics (A), float/double (F/D), CSR and privileged instructions - this is real bit-level decoding, not a wrapper. No decode for the V (vector) or B (bitmanip) extensions (falls through to raw hex); several `// TODO translate address` sites mean branch/jump targets are not symbolized |
| (none: no `riscv_unwind.c`) | Frame-pointer fallback stack unwinding | Missing | `backends/Makefile.am` lists no `riscv_unwind.c`, while x86_64, aarch64, s390, ppc64, and loongarch each ship one; riscv64 has no fallback when `.eh_frame`/CFI is unavailable and depends entirely on CFI-based unwinding |
| (none: no `riscv_auxv.c`) | Auxv name table | Missing, but not riscv-specific | Also absent on loongarch, csky, mips, hexagon, bpf - a general gap across newer ports rather than a riscv64 deficiency |

Code-coverage figures from the 0.196 LCOV report (single source, [NEEDS VERIFICATION]): `riscv_init.c` 91.7%, `riscv_regs.c` 97.1%, `riscv_retval.c` 55.2%, `riscv_symbol.c` 54.5%, `riscv_disasm.c` 82%, consistent with active CI exercising the backend and with `riscv_retval.c`'s known partial coverage of aggregate-return edge cases.

**Comparison table:**

| Subsystem | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Register table | Full | Full | Full |
| CFI ABI defaults | Full | Full | Full |
| Core note parsing (integer) | Full | Full | Full |
| Core note parsing (FP registers) | Full | Full | Missing (no NT_FPREGSET) |
| Relocation table | Full | Full | Full (psABI-current) |
| Special symbol / object-attribute validation | Full | Full | Full, one known bug (SHT_RISCV_ATTRIBUTES stripping) |
| Return-value location (simple aggregates) | Full | Full | Full |
| Return-value location (mixed/nested aggregates) | Full | Full | Partial (unimplemented) |
| Live register read (integer, ptrace) | Full | Full | Full |
| Live register read (FPU, ptrace) | Full | Full | Missing |
| Disassembler (base ISA) | Full | Full | Full |
| Disassembler (vector/bitmanip extensions) | Full (AVX/SSE etc.) | Full (NEON/SVE) | Missing (V, B) |
| Frame-pointer fallback unwind | Present | Present | Missing |

## 5. Build System, Cross-Compilation, and Toolchain

elfutils uses GNU Autotools (autoconf 2.69+, automake 1.11+). There is no CMake build anywhere in the tree, and no Dockerfile exists in the elfutils repository (confirmed via a full root-tree listing: `backends, config, debuginfod, doc, lib, libasm, libcpu, libdw, libdwelf, libdwfl, libdwfl_stacktrace, libebl, libelf, m4, po, src, tests, .forgejo/workflows`, plus top-level README/NEWS/configure.ac). CI (`.forgejo/workflows/check-fedora.yaml`, `check-debian.yaml`) runs natively on x86_64 Sourceware runners, with no cross-compilation, containers, or per-architecture matrix.

**No QEMU usage exists anywhere in the elfutils source tree or CI** (a text search for "qemu" across the tree returns zero hits). riscv64 test coverage (`tests/testfile-riscv64-*`, `run-disasm-riscv64.sh`, etc.) uses pre-built binary fixtures checked into `tests/`; a comment in `run-readelf-mixed-corenote.sh` confirms the riscv64 core-dump fixture was generated natively "on a riscv64 machine," not via emulation. QEMU only becomes relevant for a third party wanting to run the riscv64 test suite under emulation on a non-riscv64 build host (via `qemu-riscv64-static` + binfmt_misc), which is why it appears as an optional test-dependency in the tracked dependency list (Section 9) even though upstream's own CI does not use it.

**Toolchain requirements (from `configure.ac`):**

| Requirement | Minimum | Reason |
|---|---|---|
| C compiler | C11 | `AC_PROG_CC` followed by a hard error if `ac_cv_prog_cc_c11` is absent |
| stdatomic.h | GCC 4.9+ / equivalent | Hard error if absent |
| Autoconf | 2.69 | `AC_PREREQ(2.69)` |
| Automake | 1.11 | `AM_INIT_AUTOMAKE([gnits 1.11 ...])` |
| gettext | 0.19.6 | `AM_GNU_GETTEXT_VERSION` |
| C++ (optional) | C++20 preferred, falls back to C++11 | `AX_CXX_COMPILE_STDCXX(20, noext, optional)`, then `(11, noext, optional)` |

C++11 is sufficient to build the debuginfod client/server if json-c, libarchive and sqlite3 are present. C++20 (plus `<format>` support, practically GCC 10+ or Clang 10+) is required only for `eu-stackprof`.

**Exact build commands, none riscv64-specific (from README and CI config):**

```
git clone git://sourceware.org/git/elfutils.git
autoreconf -i -f && ./configure --enable-maintainer-mode && make && make check
```

CI's actual sequence (`check-fedora.yaml`): `autoreconf -f -i`, `./configure --enable-maintainer-mode`, `make -j$(nproc)`, `make check -j$(nproc)`, `make rpmbuild`. None of these differ for riscv64; riscv backend code is unconditionally compiled into every build alongside all other architectures, with no per-architecture configure switch.

**Cross-compiling to riscv64** is not documented by elfutils itself (no mention in README, configure.ac, or CI). The standard autotools approach, inferred rather than upstream-documented:

```
./configure --host=riscv64-linux-gnu \
  CC=riscv64-linux-gnu-gcc CXX=riscv64-linux-gnu-g++ \
  --build=$(./config.guess)
```

**Two distinct riscv64-specific feature gates exist in `configure.ac`:**

1. **eu-stacktrace**: gated on the presence of an architecture-specific kernel perf_regs header (`_ASM_X86_PERF_REGS_H` / `_ASM_ARM_PERF_REGS_H` / `_ASM_ARM64_PERF_REGS_H`). No riscv64 equivalent exists, so `--enable-stacktrace` fails to configure on riscv64.
2. **eu-stackprof**: gated by an explicit `case $host_cpu in i?86|x86_64|amd64|arm*|aarch64*) stackprof_arch_supported=yes ;; *) stackprof_arch_supported=no ;; esac` - riscv/riscv64 is not in that list. Passing `--enable-stackprof=yes` explicitly on riscv64 hard-fails configure (`AC_MSG_ERROR([Unable to build eu-stackprof, unsupported host cpu or missing linux <perf_event.h> with build_id or C++20 with <format.h>])`); leaving the default (`auto`) silently disables it.

**Musl riscv64 caveat:** `argp`, `fts`, and `obstack` are absent from musl libc; configure fails unless `libargp`, `libfts`, and `libobstack` are installed and discovered via `AC_SEARCH_LIBS`.

**Known, now-fixed build issue:** elfutils 0.191-0.194 failed to build under clang with `-Werror=incompatible-pointer-types-discards-qualifiers` in `libcpu/riscv_disasm.c` (a non-const `struct known_csrs *found` receiving `bsearch()`'s `const void *` return per C11/C23; GCC was permissive, clang rejected it). Fixed in 0.195 ([commit 4a5cf8be](https://sourceware.org/git/?p=elfutils.git;a=commit;h=4a5cf8be906d5991e7527e69e3f2ceaa74811301), 2025-11-24). Distributions still vendoring 0.191-0.194 and building with clang need either the patch or `-Wno-error=incompatible-pointer-types-discards-qualifiers`; Ubuntu 26.04 resolute's 0.194-4 package falls in this affected range (see Section 8).

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps:**

1. **eu-stacktrace disabled**: permanently gated off pending a kernel `_ASM_RISCV_PERF_REGS_H`-equivalent header; see Section 5.
2. **FPU live register read missing**: `riscv_initreg.c` does not fetch FP registers via ptrace, so `dwfl_thread_getframes()` cannot observe floating-point state when unwinding a live riscv64 process. Affects FP-heavy code paths in perf/bpftrace/systemtap symbol resolution.
3. **Complex heterogeneous struct return-value location unimplemented**: mixed int+float structs, nested structs, and unions give incorrect `dwfl_module_return_value_location` results on riscv64; SiFive's Palmer Dabbelt specifically flagged the mixed-type case during review of the 2024-03-19 fix.
4. **eu-strip incorrectly strips `SHT_RISCV_ATTRIBUTES`**: `eu-strip --remove-comment` removes the `.riscv.attributes` section (type `SHT_RISCV_ATTRIBUTES` = 0x70000003), destroying RISC-V ISA/ABI metadata. Tracked only downstream in [openeuler-riscv/oerv-team #2074](https://github.com/openeuler-riscv/oerv-team/issues/2074); no upstream elfutils bug has been filed.
5. **No frame-pointer fallback unwinder**: `riscv_unwind.c` does not exist for riscv64 (unlike x86_64, aarch64, s390, ppc64, loongarch), so unwinding fails entirely if CFI/`.eh_frame` data is missing or corrupt.

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| ELF read/write/strip | Full | Full | Full |
| DWARF consumer (libdw) | Full | Full | Full |
| Core file parsing (integer regs) | Full | Full | Full |
| Core file parsing (FP regs) | Full | Full | Missing |
| Return value location (simple) | Full | Full | Full |
| Return value location (complex aggregates) | Full | Full | Partial |
| Live register read (integer) | Full | Full | Full |
| Live register read (FPU) | Full | Full | Missing |
| CFI-based stack unwind (eu-stack) | Full | Full | Full |
| Frame-pointer fallback unwind | Present | Present | Missing |
| eu-stacktrace | Full | Partial | Not available |
| eu-stackprof | Full | Full | Not available |
| Disassembly (base ISA) | Full | Full | Full |
| Disassembly (vector/bitmanip extensions) | Full | Full | Missing |
| eu-strip --remove-comment correctness | Correct | Correct | Bug (strips SHT_RISCV_ATTRIBUTES) |
| elflint GOT validation | Correct | Correct | Correct (fixed 2024-12-30) |
| clang buildability | Full | Full | Requires 0.195+ |

**Security hardening:** no riscv64-specific gaps remain open. The disassembler stack buffer overflow (Bug 33006) and the CSR mnemonic out-of-bounds reads were riscv64-specific security-relevant bugs, both fixed (0.194 and 0.196 respectively). Two general (non-riscv64) memory-safety CVEs in elfutils 0.192, CVE-2025-1352 (`__libdw_thread_tail`/`libdw_alloc.c`) and CVE-2025-1376 (`elf_strptr`/`libelf`), affect all architectures and are not RISC-V-specific.

## 7. CI/CD Infrastructure

**riscv64 CI exists and is active, independently re-verified this session by cloning the canonical CI config repository (`https://sourceware.org/git/builder.git`) and reading `builder/master.cfg` (7083 lines) directly at commit `2148972be9406234f13a8880acfb3d05a70971f6` (dated 2026-09-26, four days before this report):**

- **Workers** (lines 93-136): 5 physical riscv64 workers, `starfive-riscv` and `starfive-1` through `starfive-4`, each a StarFive VisionFive V2 board (8 GB RAM, 4 cores, donated by StarFive), grouped as `starfive_workers`. Live and wired into the config, not dead code.
- **Builders** (lines 2822-2836): `elfutils-ubuntu-riscv` (Buildbot builder id 274) and `elfutils-try-ubuntu-riscv`, both running on `starfive_workers`, tagged `["elfutils","ubuntu","riscv"]` / `["elfutils-try","ubuntu","riscv"]`.
- **Schedulers** (lines 718-765): `elfutils_scheduler` (`SingleBranchScheduler`, branch `main`) lists `elfutils-ubuntu-riscv`; `elfutils_try_scheduler` (`AnyBranchScheduler`, try-branch regex) lists `elfutils-try-ubuntu-riscv`. Every push to elfutils' `main` branch and every try-branch push triggers a native riscv64 build+test.
- **Build factory** (`elfutils_factory`, lines 2532-2541): git checkout, `autoreconf`, `configure`, `make`, `make check` (full test suite), upload of `.trs`/`.log` results to Bunsen, then `make distclean` - run natively on the StarFive hardware, not emulated.
- **Corroboration**: mailing-list buildbot notifications (e.g. `elfutils-devel@sourceware.org` msg09439) show live build activity from `elfutils-ubuntu-riscv` on worker `starfive-2`; the 0.196 LCOV coverage report includes `backends/riscv_cfi.c.gcov.html`, indicating riscv-specific code is actively exercised by this CI.

| Builder | Architecture | Worker | Status |
|---|---|---|---|
| `elfutils-ubuntu-riscv` (id 274) | riscv64 (native) | StarFive VisionFive V2 physical boards | Active, config-verified |
| `elfutils-try-ubuntu-riscv` | riscv64 (native) | Same StarFive boards | Active, config-verified |
| `elfutils-debian-riscv` / `elfutils-try-debian-riscv` | riscv64 | Unclear | The Buildbot REST API lists builder ids 271/272 under these names, but neither appears in the current `master.cfg` text; likely a stale API entry or a builder defined outside this file. A separate claim, that this builder logged only 2 builds (both 2023 failures) and is now offline, could not be corroborated this session and is carried here only as [NEEDS VERIFICATION] |
| `elfutils-debian-amd64` / `elfutils-fedora-x86_64` | amd64/x86_64 | VM | Active |
| `elfutils-debian-arm64` | arm64 | VM | Active |

**RISE runners**: elfutils' own riscv64 CI does not run on RISE infrastructure; it runs on Sourceware's own StarFive hardware. RISE's RISC-V Runners (bare-metal Scaleway EM-RV1, `riseproject-dev/riscv-runner`) are used only downstream, to build and test the pystack Python wheel that compiles elfutils from source as a dependency (Section 1).

## 8. Distribution and Release Status

**No upstream-published riscv64 (or any architecture-specific) binaries exist.** elfutils' own releases are source tarballs only; `sourceware.org/git/elfutils.git`'s web UI is behind an anti-bot (Anubis) wall that blocked direct verification of the release page, but this is consistent across every source checked and matches the project's Autotools-only build model (Section 5). This is the central fact behind the project's readiness color: build and test both pass natively, but the consumable riscv64 artifact always comes from a downstream distro rebuilding upstream source, not from elfutils itself.

**Current upstream version:** 0.196, confirmed via a direct repository clone (AC_INIT version 0.196, copyright lines through 2026) and the [0.196 release announcement](http://www.mail-archive.com/elfutils-devel@sourceware.org/msg09512.html).

**Binary package availability (verified via live HTTP fetches against each archive):**

| Distribution | Version (riscv64) | Status | Notes |
|---|---|---|---|
| Ubuntu 26.04 "resolute" | 0.194-4 [ports] | Confirmed present, HTTP 200 | [packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=elfutils&suite=resolute&searchon=names&section=all) live page shows architecture riscv64 explicitly, package size 544.8 kB, installed size 2,959.0 kB, real dependency chain to riscv64 libdw1t64/libelf1t64. Tagged `[ports]` (built via Ubuntu's ports infrastructure rather than the primary archive) but is a real, signed, installable binary, not a placeholder. Lags upstream: missing both the 0.195 clang const-correctness fix and the 0.196 CSR out-of-bounds-read fix |
| Debian sid/testing | riscv64 build present | Confirmed present | Unmodified upstream source, no riscv64-specific packaging patches found |
| Arch Linux RISC-V | `elfutils-0.196-1-riscv64.pkg.tar.zst` | Confirmed present, HTTP 200 | [archriscv.felixc.at/repo/core/](https://archriscv.felixc.at/repo/core/) live directory listing: signed package, 700,423 bytes, dated 2026-08-19 - the most current elfutils package of any distribution checked, matching current upstream 0.196 |
| Ubuntu 24.04 LTS | 0.190-1.1build4 (carried over, not independently re-checked this session) | Available in ports pocket | [NEEDS VERIFICATION]: not re-verified in this research pass |
| Fedora | Data not available: Fedora riscv64 build status was not retrieved in this research session | - | - |
| PyPI | N/A | No package named `elfutils` exists on PyPI for any architecture (`pypi.org/pypi/elfutils/json` returns HTTP 404) | elfutils is a C library/toolset, not a Python package; this is expected, not a gap |
| RISE GitLab wheel mirror | N/A | 302-redirects to the same PyPI 404 | Consistent with elfutils having no PyPI presence |
| OCI/container images | Data not available: no search was performed for official elfutils container images | - | - |

**To get a working riscv64 binary today**: `apt install elfutils` on Ubuntu 26.04 or Debian sid/testing (0.194-4, missing two post-0.194 correctness/security fixes), or `pacman -S elfutils` on Arch Linux RISC-V (0.196-1, fully current). There is no path to an upstream-published riscv64 binary; building from source is the only way to get exactly-current upstream on riscv64.

## 9. Dependencies

All tracked elfutils build/runtime dependencies have riscv64 binaries present in the live Ubuntu 26.04 "resolute" archive, and elfutils itself (0.194-4) is built and released for riscv64 in that same suite, so no dependency currently blocks elfutils' riscv64 availability on Ubuntu. Six of the twelve tracked dependencies already have their own dedicated RISC-V readiness reports in this repository; three have no report yet.

| Name | Relation | Criticality | Role in elfutils | riscv64 status (Ubuntu 26.04 resolute) | Notes |
|---|---|---|---|---|---|
| glibc | runtime-dependency | critical | C runtime; also provides `argp` (CLI argument parsing) natively | Fully supported; tier-1 platform since glibc 2.27 | musl systems need separate `libargp`/`libfts`/`libobstack` |
| GCC | build-dependency | critical | Build toolchain; C11 mandatory, C++20 optional for eu-stackprof | GCC 15.3.0 available in Debian sid | None found |
| zlib | runtime-dependency | critical | DEFLATE compression of `.zdebug`/`.zlib` sections; configure fails hard without it | `zlib1g` 1:1.3.dfsg+really1.3.1-1ubuntu3, builds cleanly | None found. See status report at project-reports/zlib.md (rated blue) |
| bzip2 | runtime-dependency | optional | `.bz2`-compressed debug sections | `libbz2-1.0` 1.0.8-6build2, builds cleanly | Distro-build verified only, not full upstream riscv64 CI. See status report at project-reports/bzip2.md (rated yellow) |
| xz | runtime-dependency | optional | `.xz`-compressed debug sections, increasingly the toolchain default | `liblzma5` 5.8.3-1, builds cleanly; upstream has a merged RISC-V BCJ filter | See status report at project-reports/xz.md (rated yellow despite the native filter - see that report for nuance) |
| zstd | runtime-dependency | optional | `.zstd`-compressed debug sections; also used internally by debuginfod caching | `libzstd1` 1.5.7+dfsg-3, builds cleanly, good coverage | None found. See status report at project-reports/zstd.md (rated blue) |
| libcurl | runtime-dependency | optional | debuginfod federation (fetching from upstream debuginfod servers) and debuginfod-client | `libcurl4t64` 8.18.0-1ubuntu2, builds cleanly | See status report at project-reports/libcurl.md (rated yellow, TLS-backend/optional-dep nuances) |
| libmicrohttpd | runtime-dependency | optional | debuginfod's embedded HTTP server (REST/webapi) | `libmicrohttpd12t64`/`libmicrohttpd-dev` 1.0.1-2, builds cleanly | In RISC-V Ecosystem scope but no status report generated yet |
| SQLite | runtime-dependency | optional | debuginfod's index database backend | `libsqlite3-0` 3.46.1-9, builds cleanly | See status report at project-reports/sqlite.md (rated yellow) |
| libarchive | runtime-dependency | optional | debuginfod source-archive indexing (reads rpm/deb/tar/cpio to extract source+debug info) | `libarchive13t64` 3.8.5-1ubuntu2, builds cleanly | In RISC-V Ecosystem scope but no status report generated yet |
| json-c | runtime-dependency | optional | debuginfod metadata/webapi JSON handling and IMA verification | `libjson-c5` 0.18+ds-3, builds cleanly | In RISC-V Ecosystem scope but no status report generated yet |
| QEMU | test-dependency | optional | Not used by elfutils' own CI (tests natively on real riscv64 hardware) or in-tree (zero references found); relevant only to a third party cross-compiling elfutils and wanting to run `make check` under `qemu-riscv64-static`/binfmt_misc on a non-riscv64 host | N/A (not a build/runtime input of the shipped package) | None found |

**Additional indirect/transitive dependencies identified during research:**

| Name | Role | riscv64 status |
|---|---|---|
| OpenSSL | TLS backend used transitively via libcurl for debuginfod client connections | Well-supported on riscv64; CI passes |
| libstdc++ | C++ demangler support (unless `--disable-demangler`) | Present on riscv64 across major distros |

None of elfutils' dependencies has a JIT, SIMD, or cryptographic implementation that creates riscv64-specific correctness risk: zlib, bzip2, xz, and zstd have optional SIMD-accelerated paths but degrade gracefully to scalar C on riscv64, and no riscv64 correctness issue in any of their scalar fallbacks was found.

## 11. Known Bugs and Active Issues

**Active issues:**

| Reference | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [openeuler-riscv/oerv-team #2074](https://github.com/openeuler-riscv/oerv-team/issues/2074) | `eu-strip --remove-comment` incorrectly strips the `SHT_RISCV_ATTRIBUTES` (`.riscv.attributes`) section | Open, tracked downstream only | High | Destroys RISC-V ISA/ABI metadata; no upstream elfutils Bugzilla entry exists yet |
| No upstream bug ID | `riscv_retval.c`: `flatten_aggregate` handles only same-base-type struct members | Open, acknowledged partial in the 2024-03-19 commit; mixed float+int gap specifically flagged by SiFive's Palmer Dabbelt in review | Medium | Mixed int+float structs, nested structs, unions give incorrect `dwfl_module_return_value_location` results |
| No upstream bug ID | `riscv_initreg.c`: FPU live registers not read via ptrace | Open, TODO comment in source ("FP registers not yet supported") | Medium | `dwfl_thread_getframes()` cannot see FP register state for live riscv64 processes |
| Architectural gap, not a bug | `eu-stacktrace` hard-disabled on riscv64 at configure time (no perf_regs kernel header) | Permanent until a kernel ABI addition | - | See Section 5 |
| Architectural gap, not a bug | No `riscv_unwind.c` frame-pointer fallback unwinder | Open | Medium | Unwinding fails entirely if `.eh_frame`/CFI data is unavailable |
| No upstream bug ID | `libcpu/riscv_disasm.c` has no decode for V (vector) or B (bitmanip) extensions | Open | Low-Medium | Such instructions dump as raw hex in `eu-objdump` |

Upstream Bugzilla itself (bugs.sourceware.org) could not be queried directly in this or the prior research pass (blocked by Anubis anti-bot protection), so additional open riscv-tagged bugs may exist that were not surfaced by mailing-list/mirror search.

**Resolved issues:**

| ID | Title | Fixed in | Commit | Severity |
|---|---|---|---|---|
| [Bug 33006](https://sourceware.org/bugzilla/show_bug.cgi?id=33006) | Stack buffer overflow in `riscv_disasm` (`mnebuf` too small for wide illegal instructions) | 0.194 (2025-06-03) | [07bd923c](https://sourceware.org/git/?p=elfutils.git;a=commit;h=07bd923cea4b883ca2357e9fc80babcedd242b37) | High |
| [Bug 31142](https://sourceware.org/bugzilla/show_bug.cgi?id=31142) | `riscv: pass_by_flattened_arg` not implemented | 0.192 (2024-03-19) | [669b6481](https://sourceware.org/git/?p=elfutils.git;a=commit;h=669b648111d3bc27cd4756879f5fe5a18515de77) | Medium |
| No Bugzilla ID | Two out-of-bounds reads in `riscv_disasm.c` CSR mnemonic lookup arrays | 0.196 (2026-05-31) | [003d1c8b](https://sourceware.org/git/?p=elfutils.git;a=commit;h=003d1c8bc8be6c45fc39eb1b886def17482ed3a5) | High (security-relevant, crafted-ELF triggerable) |
| No Bugzilla ID | `riscv_disasm.c` const-correctness (clang `-Werror`/C23 `bsearch` prototype mismatch), broke clang builds for 0.191-0.194 | 0.195 (2025-11-24) | [4a5cf8be](https://sourceware.org/git/?p=elfutils.git;a=commit;h=4a5cf8be906d5991e7527e69e3f2ceaa74811301) | Medium |
| No Bugzilla ID | `elflint` false `_GLOBAL_OFFSET_TABLE_` warning for RISC-V `.got.plt` layout (lld-linked binaries) | 0.193 (2024-12-30) | [a4ece6a5](https://sourceware.org/git/?p=elfutils.git;a=commit;h=a4ece6a521c181e43854a5691d8c2828d326a925) | Low |

Not riscv-specific, for completeness: CVE-2025-1352 and CVE-2025-1376 in elfutils 0.192 are general memory-safety issues affecting all architectures.

**Performance data**: Data not available. No riscv64-vs-arm64/amd64 performance comparison for elfutils tools (eu-readelf, eu-strip, libdw parsing, debuginfod indexing) was found in any public source, including Phoronix's extensive RISC-V hardware benchmark suite (SpacemiT K3/RVV, SiFive HiFive Unmatched, Scaleway EM-RV1, Ubuntu RISC-V evolution), which covers general CPU/SoC workloads but not ELF/DWARF tooling specifically. This is consistent with elfutils being I/O-bound (ELF/DWARF file parsing) with no hot, SIMD-acceleratable inner loops, making dedicated performance benchmarking low-value.

## 12. Objections and Upstream Blockers

No blockers exist for riscv64 in elfutils. The port is fully upstream, CI is active and passing on dedicated hardware, distributions ship packages built from unmodified upstream source, and the maintainer (Mark Wielaard) has a track record of reviewing and merging RISC-V patches within days to weeks (both tracked Bugzilla bugs, 31142 and 33006, were resolved on this timescale).

**Open gaps that require upstream contribution, not blocked by policy:**

1. **SHT_RISCV_ATTRIBUTES stripping bug**: needs an upstream Bugzilla report (none filed as of this writing; tracked only in [openeuler-riscv/oerv-team #2074](https://github.com/openeuler-riscv/oerv-team/issues/2074)) and a one-line fix in eu-strip to preserve sections of type SHT_RISCV_ATTRIBUTES.
2. **FPU live register read**: requires implementing `PTRACE_GETREGSET`/`NT_FPREGSET` support in `riscv_initreg.c` (kernel struct `struct __riscv_d_ext_state`), analogous to the existing arm64 implementation.
3. **Complex aggregate return-value location**: requires completing `flatten_aggregate` in `riscv_retval.c` for heterogeneous structs per the LP64D psABI floating-point calling convention, including the mixed int+float case Palmer Dabbelt (SiFive) specifically flagged in review.
4. **Disassembler extension coverage**: table-driven addition of Zba/Zbb/Zbc/Zbs (bitmanip) and V (vector) decode to `riscv_disasm.c`; mechanical but volume-intensive.
5. **Frame-pointer fallback unwinder**: a new `riscv_unwind.c`, modeled on the existing x86_64/aarch64/s390/ppc64/loongarch implementations.
6. **`elfutils-debian-riscv`/`elfutils-try-debian-riscv` builder status is unclear**: these builder ids appear in the Buildbot REST API but not in the current `master.cfg`; whether a Debian-based riscv64 builder is actually running today could not be confirmed this session and would need direct confirmation with the Sourceware infrastructure team before being scoped as investment.

**Organizational stance**: Mark Wielaard has accepted every RISC-V patch submitted with tests and mailing-list review to date; there is no stated objection to further RISC-V work.

## 13. Readiness Assessment

- **Color:** blue (N/A - blue has no sub-type; build = yes, test = yes, upstream-published riscv64 artifact = no)
- **Release provider:** distro

elfutils has active, passing native riscv64 CI: the sourceware.org Buildbot builder "elfutils-ubuntu-riscv" runs full autoreconf/configure/make/`make check` on 5 dedicated physical StarFive VisionFive V2 boards for every main-branch and try-branch push ([builder.sourceware.org/buildbot/#/builders/274](https://builder.sourceware.org/buildbot/#/builders/274)), so build = yes and test = yes. However elfutils itself only ships source tarballs; it does not publish riscv64 (or any architecture-specific) binaries directly, so the consumable riscv64 package comes from downstream distros: Ubuntu 26.04 "resolute" ships elfutils 0.194-4 for riscv64 ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=elfutils&suite=resolute&searchon=names&section=all)) and Debian sid/testing also carries a riscv64 build, both from unmodified upstream source with no riscv64-specific packaging patches found. Per the release-provider rule, this yields blue (build yes, test yes, upstream-published artifact no) rather than green, with the release provided by the distro, not upstream.

**Pending work that could change the grade** (non-blocking correctness gaps that do not affect the color but are worth tracking): `eu-strip --remove-comment` incorrectly strips the SHT_RISCV_ATTRIBUTES section (tracked only in a downstream GitHub issue, [openeuler-riscv/oerv-team #2074](https://github.com/openeuler-riscv/oerv-team/issues/2074), not yet filed upstream); `riscv_retval.c`'s `flatten_aggregate` handles only simple homogeneous-type struct returns (mixed int+float, nested structs, unions unimplemented, acknowledged partial in the 2024-03-19 commit); `riscv_initreg.c` does not read FPU live registers via ptrace; `eu-stacktrace` is permanently disabled on riscv64 pending a kernel perf_regs header. There is no RISE project funding or involvement in elfutils specifically; all RISC-V work to date is organic upstream contribution from SUSE, Red Hat, and SiFive engineers, with a responsive maintainer (two riscv64 Bugzilla bugs filed and fixed within days to weeks in 2024-2025).

## 14. Investment Analysis

RISE has no prior investment in elfutils. All existing RISC-V work was contributed organically by SUSE, Red Hat, SiFive, and IBM engineers; the CI hardware (StarFive boards) was donated independently of RISE. The only RISE touchpoint found is incidental: elfutils is compiled from source as a native build dependency of pystack in `riseproject-dev/python-wheels` PR #2398, using RISE's RISC-V Runners as the execution environment, not as a funded improvement to elfutils itself.

### 14.1 Functional Enablement

**eu-strip SHT_RISCV_ATTRIBUTES fix**: a one-line fix in eu-strip's `--remove-comment` path, adding a check for `sh_type == SHT_RISCV_ATTRIBUTES`. An upstream bug report must be filed first (none exists yet).

**FPU live register read (`riscv_initreg.c`)**: add `PTRACE_GETREGSET`/`NT_FPREGSET` support (kernel struct `struct __riscv_d_ext_state`, 32 FP registers + fcsr), analogous to the existing arm64 peer implementation. Requires a riscv64 Linux machine for testing.

**Complete `flatten_aggregate` in `riscv_retval.c`**: handle heterogeneous aggregates per LP64D psABI section 2.14, including the mixed int+float split-register case SiFive flagged in review. New test binaries are needed for each aggregate pattern.

**Frame-pointer fallback unwinder**: a new `riscv_unwind.c`, modeled on the x86_64/aarch64/s390/ppc64/loongarch implementations already in the tree.

### 14.2 Performance Optimization

Data not available: no benchmark data comparing elfutils performance on riscv64 vs arm64 or amd64 was found in any public source. elfutils is primarily I/O-bound with no hot SIMD-acceleratable inner loops. Performance investment is low priority.

### 14.3 CI/CD Infrastructure

**Confirm status of `elfutils-debian-riscv`/`elfutils-try-debian-riscv` builders**: these builder ids appear in the Buildbot REST API but not in the current `master.cfg`; direct confirmation with the Sourceware infrastructure team is needed before this can be scoped as a restoration effort or ruled out entirely. The active `elfutils-ubuntu-riscv` builder already provides solid native riscv64 coverage; a second, Debian-based builder would primarily catch packaging/dependency differences rather than close a functional gap.

### 14.4 Ecosystem Enablement

Not applicable: elfutils has no dependent Python/npm/Maven/OCI package ecosystem of its own; it is a C library consumed via system package managers. The one indirect ecosystem touchpoint found, elfutils being compiled from source inside pystack's riscv64 wheel build (`riseproject-dev/python-wheels` PR #2398), is a single downstream consumer's build dependency, not a package ecosystem requiring separate riscv64 enablement work on elfutils' side.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | File upstream bug and fix eu-strip SHT_RISCV_ATTRIBUTES stripping | 1 | Chip company contributor | Critical |
| Functional | Implement FPU live register read in riscv_initreg.c (NT_FPREGSET via ptrace) | 2 | Chip company contributor | High |
| Functional | Complete flatten_aggregate for heterogeneous aggregates in riscv_retval.c | 3 | Chip company contributor | High |
| Functional | Implement riscv_unwind.c frame-pointer fallback unwinder | 2 | Chip company contributor | Medium |
| Functional | Disassembler: add Zba/Zbb/Zbc/Zbs (bitmanip) decode to riscv_disasm.c | 3 | Chip company contributor | Medium |
| Functional | Disassembler: add V (vector) extension decode to riscv_disasm.c | 5 | Chip company contributor | Medium |
| Functional | Disassembler: implement symcb address resolution for branch targets (TODO in source) | 2 | Chip company contributor | Low |
| CI/CD | Confirm and, if needed, restore a Debian-based riscv64 Buildbot builder | 1 | Chip company contributor + Sourceware infra team | Medium |

Total estimated effort: 19 person-weeks across all items. The three Critical/High functional items (SHT_RISCV_ATTRIBUTES fix, FPU live register read, complex aggregate return values) total 6 person-weeks and resolve the most user-visible correctness gaps in DWARF/debugger tooling on riscv64.

## 15. References

- [elfutils project homepage](https://sourceware.org/elfutils/)
- [elfutils git repository](https://sourceware.org/git/?p=elfutils.git)
- [Buildbot: elfutils-ubuntu-riscv builder (id 274)](https://builder.sourceware.org/buildbot/#/builders/274)
- [2019q3 thread: RISC-V disassembler](https://sourceware.org/pipermail/elfutils-devel/2019q3/001999.html)
- [elfutils 0.178 release announcement](https://sourceware.org/legacy-ml/elfutils-devel/2019-q4/msg00219.html)
- [PT_RISCV_ATTRIBUTES RFC thread](https://sourceware.org/pipermail/elfutils-devel/2022q4/005408.html)
- [Commit 127e3831: tests: use readelf -N -w in run-strip-reloc.sh (2023-06-17)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=127e3831c169851e796496582213a94965337696)
- [Commit 485b87a2: backends: update list of RISC-V relocations (2023-06-26)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=485b87a2e53045d2284a6649d529ab3aaa22e127)
- [Commit 669b6481: riscv: partial implementation of flatten_aggregate (2024-03-19)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=669b648111d3bc27cd4756879f5fe5a18515de77)
- [Bug 31142 review thread (Palmer Dabbelt)](https://www.mail-archive.com/elfutils-devel@sourceware.org/msg06864.html)
- [Commit 46c5c98e: backends/riscv: remove unused relocations (2024-07-31)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=46c5c98ee7ce2108f51ca8ecb0e81d55797c8470)
- [Commit a4ece6a5: backends: check_special_symbol _GLOBAL_OFFSET_TABLE_ (2024-12-30)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=a4ece6a521c181e43854a5691d8c2828d326a925)
- [Bug tools/33006 initial report](https://www.mail-archive.com/elfutils-devel@sourceware.org/msg08170.html)
- [Bug tools/33006 reopen](https://www.mail-archive.com/elfutils-devel@sourceware.org/msg08208.html)
- [Commit 07bd923c: libcpu: riscv_disasm use 50 char mnebuf (2025-06-03)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=07bd923cea4b883ca2357e9fc80babcedd242b37)
- [Commit 4a5cf8be: fix const-correctness issues in riscv_disasm.c (2025-11-24)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=4a5cf8be906d5991e7527e69e3f2ceaa74811301)
- [Commit 003d1c8b: riscv_disasm.c: fix out-of-bounds reads (2026-05-31)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=003d1c8bc8be6c45fc39eb1b886def17482ed3a5)
- [elfutils 0.196 released announcement](http://www.mail-archive.com/elfutils-devel@sourceware.org/msg09512.html)
- [elfutils Bug 31142: riscv pass_by_flattened_arg not implemented](https://sourceware.org/bugzilla/show_bug.cgi?id=31142)
- [elfutils Bug 33006: stack buffer overflow in riscv_disasm](https://sourceware.org/bugzilla/show_bug.cgi?id=33006)
- [openeuler-riscv/oerv-team issue #2074: eu-strip --remove-comment incorrectly strips .riscv.attributes](https://github.com/openeuler-riscv/oerv-team/issues/2074)
- [Ubuntu 26.04 resolute elfutils package search](https://packages.ubuntu.com/search?keywords=elfutils&suite=resolute&searchon=names&section=all)
- [Ubuntu 24.04 elfutils package (noble ports)](https://packages.ubuntu.com/noble/elfutils)
- [Arch Linux RISC-V core repository listing](https://archriscv.felixc.at/repo/core/)
- [sourceware.org Buildbot API: elfutils builders](https://builder.sourceware.org/buildbot/api/v2/builders?tags__contains=elfutils)
- [riseproject-dev/python-wheels PR #2398: pystack: Add version 1.7.1](https://github.com/riseproject-dev/python-wheels/pull/2398)
- [RISE Project blog](https://riseproject.dev/blog)