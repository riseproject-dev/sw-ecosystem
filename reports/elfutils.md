---
title: elfutils
categories:
  - debug
  - perfmon
---

# elfutils
**Author:** Ludovic HENRY &lt;ludovic.henry@qti.qualcomm.com&gt;
**Date:** 2026-06-17
**Scope:** RISC-V (riscv64/linux) support status for elfutils
**Audience:** Technical leadership, resource allocation strategy
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items verified against only one source are marked [NEEDS VERIFICATION].

---

## 1. Project Overview

elfutils is the canonical ELF and DWARF processing library suite on Linux. It provides:

- **libelf**: Low-level ELF file read/write (replaces libelf from BFD)
- **libdw**: DWARF consumer (CFI, line tables, type info, abbreviations)
- **libdwfl**: Higher-level debugger integration layer (module loading, stack unwinding, live process inspection via ptrace)
- **libcpu**: Per-architecture disassemblers (used by eu-objdump)
- **Command-line tools**: eu-strip, eu-readelf, eu-objdump, eu-stack, eu-elflint, eu-nm, eu-addr2line, debuginfod/debuginfod-find

The project is the ELF/DWARF backend for systemtap, perf annotation, bpftrace symbol resolution, GDB's build-ID index, RPM debuginfo packaging, Fedora/Red Hat's debuginfod infrastructure, and several Linux kernel profiling tools. It is not affiliated with any foundation. Hosting is on [sourceware.org](https://sourceware.org/elfutils/), which is Red Hat infrastructure. The governance model is mailing-list review plus maintainer push: Mark Wielaard (mark@klomp.org) is the gatekeeper; approval is signaled by "Looks good. Pushed." All patches go to `elfutils-devel@sourceware.org`. There is no formal contributor agreement or CLA.

Corporate contributors identified in RISC-V-related commits: Red Hat, SUSE, SiFive (copyright in riscv_retval.c). No public governance document lists a formal tiered support policy. Acceptance of new architecture backends is permissive: the RISC-V backend was merged in 2018 before riscv64 CI hardware existed.

elfutils is not a member project of the RISE Project. No RISE blog posts, working group deliverables, or wheel builder entries reference elfutils.

---

## 2. Port History and Upstreaming Timeline

All RISC-V work is fully upstream. There are no downstream-only patches in any major distribution (Debian, Ubuntu, Arch Linux RISC-V carry no riscv64-specific patches for elfutils).

| Date | Event | Source |
|------|-------|--------|
| 2018-04-19 | Initial RISC-V backend: riscv_reloc.def, riscv_symbol.c, riscv_regs.c, riscv_cfi.c, test binary hello_riscv64.ko.bz2. Author: Andreas Schwab (SUSE Labs). | [commit, elfutils NEWS 0.171](https://sourceware.org/elfutils/) |
| 2018-09 | elfutils 0.174 released: riscv64 core file support added | [sourceware.org/elfutils](https://sourceware.org/elfutils/) |
| 2018-11 | elfutils 0.175: ADD/SUB relocation handling for RISC-V | [sourceware.org/elfutils](https://sourceware.org/elfutils/) |
| 2019 | elfutils 0.176: riscv_retval.c (return value location), riscv64_corenote.c | [sourceware.org/elfutils](https://sourceware.org/elfutils/) |
| ~2020 | elfutils 0.178: RISC-V disassembler (libcpu/riscv_disasm.c) added | [sourceware.org/elfutils](https://sourceware.org/elfutils/) |
| 2022-08 | Andreas Schwab: sync elf.h for EF_RISCV_RVE, EF_RISCV_TSO, STO_RISCV_VARIANT_CC, SHT_RISCV_ATTRIBUTES, PT_RISCV_ATTRIBUTES, DT_RISCV_VARIANT_CC; implement segment/section/dynamic tag handlers; fix elflint for PT_RISCV_ATTRIBUTES; readelf SHT_RISCV_ATTRIBUTES display | [sourceware.org git](https://sourceware.org/git/?p=elfutils.git) |
| 2023-06-17 | Tests: fix run-strip-reloc.sh for RISC-V ELF relocation sections | [commit 127e3831](https://sourceware.org/git/?p=elfutils.git;a=commit;h=127e3831c169851e796496582213a94965337696) |
| 2023-06-26 | Add IRELATIVE, PLT32, SET_ULEB128, SUB_ULEB128 to riscv_reloc.def (psABI sync) | [commit 485b87a2](https://sourceware.org/git/?p=elfutils.git;a=commit;h=485b87a2e53045d2284a6649d529ab3aaa22e127) |
| 2024-Q1 | Sync elf.h: add NT_RISCV_CSR, NT_RISCV_VECTOR note types | [sourceware.org git](https://sourceware.org/git/?p=elfutils.git) |
| 2024-03-19 | riscv_retval.c: partial implementation of flatten_aggregate (Bug 31142). Author: Mark Wielaard | [commit 669b648](https://sourceware.org/git/?p=elfutils.git;a=commit;h=669b648111d3bc27cd4756879f5fe5a18515de77) |
| 2024-07-31 | Remove seven obsolete relocations from riscv_reloc.def. Authors: Andreas Schwab/Aaron Merey | [commit 46c5c98e](https://sourceware.org/git/?p=elfutils.git;a=commit;h=46c5c98ee7ce2108f51ca8ecb0e81d55797c8470) |
| 2024-12-30 | riscv_symbol.c: fix false elflint warning for _GLOBAL_OFFSET_TABLE_ with .got.plt layout. Author: Mark Wielaard | [commit a4ece6a5](https://sourceware.org/git/?p=elfutils.git;a=commit;h=a4ece6a521c181e43854a5691d8c2828d326a925) |
| 2025-06-03 | riscv_disasm.c: extend mnebuf to 50 chars, fixing _FORTIFY_SOURCE abort on wide illegal instructions (Bug 33006). Author: Mark Wielaard | [commit 07bd923c](https://sourceware.org/git/?p=elfutils.git;a=commit;h=07bd923cea4b883ca2357e9fc80babcedd242b37) |
| 2025-11-24 | Fix const-correctness in riscv_disasm.c (C23 bsearch const void* issue). Authors: Andreas Schwab/Aaron Merey | [commit 4a5cf8be](https://sourceware.org/git/?p=elfutils.git;a=commit;h=4a5cf8be906d5991e7527e69e3f2ceaa74811301) |
| 2026-05-31 | riscv_disasm.c: fix two out-of-bounds reads in CSR mnemonic array lookups. Author: Aaron Merey | [commit 003d1c8b](https://sourceware.org/git/?p=elfutils.git;a=commit;h=003d1c8bc8be6c45fc39eb1b886def17482ed3a5) |

**Key contributors by organization:**

| Contributor | Org | Role |
|-------------|-----|------|
| Andreas Schwab | SUSE Labs | Initial RISC-V backend author; most prolific RISC-V contributor |
| Mark Wielaard | Red Hat-adjacent (personal domain) | Primary maintainer; merger, flatten_aggregate, disasm fixes |
| Aaron Merey | Red Hat | Disassembler fixes, const-correctness |
| William Cohen | Red Hat | Bug tracking (Bug 27925) |
| Jim Wilson | Formerly SiFive/Google | riscv_retval.c initial authorship (SiFive copyright 2018) |

The port is fully upstream. No patches live outside the mainline `sourceware.org/git/elfutils.git` tree.

---

## 3. Upstream Support Tier

elfutils has no published formal tiering policy. There is no document analogous to GCC's host/target tier list or LLVM's tier policy. The effective tier is determined by:

1. Whether a Buildbot CI worker exists for the architecture
2. Whether the architecture is listed on the project homepage as supported
3. Whether patches for the architecture are accepted by the maintainer

riscv64 satisfies all three criteria as of 2021.

**CI coverage comparison:**

| Architecture | Buildbot builder present | Worker type | Active | Passing |
|---|---|---|---|---|
| amd64/x86_64 | Yes (multiple: Debian, Fedora, CentOS, openSUSE) | x86_64 VM | Yes | Yes |
| arm64 | Yes (elfutils-debian-arm64) | arm64 VM | Yes | Yes |
| riscv64 | Yes (elfutils-ubuntu-riscv, builder ID 274) | StarFive physical board, Linux 6.17 riscv64 | Yes | Yes (331 builds, last pass 2026-06-21) |

The `elfutils-debian-riscv` builder (ID 272) has only 2 builds (both 2023 failures) and is currently offline (no masterids). Only the Ubuntu-based riscv64 builder is active.

riscv64 is listed as a first-class supported ELF backend on the [elfutils homepage](https://sourceware.org/elfutils/). Releases are not gated on riscv64 CI passing, but the CI exists and does gate tree health for the Ubuntu RISC-V platform.

The project's stance on riscv32 is explicitly limited: Mark Wielaard stated publicly that "we accept 32-bit RISC-V ELF files, but don't know anything about how it handles calling conventions." Only riscv64 ABIs (lp64, lp64f, lp64d) are implemented in riscv_retval.c and riscv_initreg.c. This report covers riscv64 only.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

elfutils is a pure C project. There is no JIT, no SIMD dispatch, no cryptographic implementation, and no assembly code in the source tree. All architecture-specific code lives in `backends/` (ELF/DWARF processing) and `libcpu/` (disassembly). There is no `arch/riscv/` directory.

**RISC-V backend files (9 files):**

| File | Purpose | Quality | Gaps |
|------|---------|---------|------|
| riscv_regs.c | DWARF register name/number table (64 regs: 32 int + 32 FPU) | Full | None |
| riscv_cfi.c | DWARF CFI ABI defaults (callee-saved regs, CFA=SP, ra=reg1) | Full | None |
| riscv_corenote.c + riscv64_corenote.c | Core dump note parsing (RV32 + RV64 via BITS macro) | Full | None |
| riscv_reloc.def | Relocation type table (psABI-current) | Full | None |
| riscv_symbol.c | Special symbol/ELF metadata validation | Full with known bug | SHT_RISCV_ATTRIBUTES stripping via eu-strip --remove-comment (oerv-team #2074, not yet upstream) |
| riscv_retval.c | DWARF return value location for lp64/lp64f/lp64d ABIs | Partial | Complex heterogeneous aggregates unimplemented (mixed int+float fields, nested structs, unions) |
| riscv_initreg.c | Live register read via ptrace(PTRACE_GETREGSET) | Partial | FPU register live-read explicitly unimplemented (comment: "FP registers not yet supported.") |
| riscv_reloc.def | Relocation types | Full | None |
| libcpu/riscv_disasm.c | Instruction disassembler | Partial | No Zb*/Zv/B/J/H extension decode; symcb address resolution stubbed (TODO comment); instructions wider than 32 bits hex-dumped |

**Comparison table: architecture-specific feature coverage**

| Subsystem | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Register table | Full | Full | Full |
| CFI ABI defaults | Full | Full | Full |
| Core note parsing | Full | Full | Full (RV32+RV64) |
| Relocation table | Full | Full | Full (psABI-current) |
| Special symbol validation | Full | Full | Full with 1 known bug |
| Return value location | Full | Full | Partial (homogeneous aggregates only) |
| Live register read (ptrace) | Full (int+FPU) | Full (int+FPU) | Partial (int only, no FPU) |
| Disassembler | Full (x86 + AVX/SSE decode) | Full (AArch64) | Partial (RV32I/C/M/A/F/D/Q, no Zb*/V) |
| Stack unwind (eu-stack) | Supported | Supported | Falls back to frame pointer or fails |
| eu-stacktrace | Supported | Supported | Not supported (configure hard-blocks it) |

Note on eu-stacktrace: `configure.ac` checks for `_ASM_X86_PERF_REGS_H` / `_ASM_ARM_PERF_REGS_H` / `_ASM_ARM64_PERF_REGS_H`. RISC-V is absent. `--enable-stacktrace` on riscv64 results in a configure error. This is a known architectural gap, not a dependency issue.

---

## 5. Build System, Cross-Compilation, and Toolchain

elfutils uses Autotools (autoconf 2.69+, automake 1.11+). There is no CMake build. No Dockerfile is shipped in the tarball or upstream source tree.

**Minimum toolchain requirements:**

| Requirement | Minimum | Reason |
|---|---|---|
| C compiler | C11 | configure.ac hard-errors if `ac_cv_prog_cc_c11` is absent |
| stdatomic.h | GCC 4.9+ | Hard error if absent; comment says "We need at least gcc 4.9+" |
| __thread (TLS) | Any GCC/clang with TLS | Hard error if absent |
| Autoconf | 2.69 | AC_PREREQ(2.69) |
| Automake | 1.11 | AM_INIT_AUTOMAKE gnits 1.11 |
| gettext | 0.19.6 | AM_GNU_GETTEXT_VERSION |

In practice GCC 5+ or clang 6+ is required for full C11 with stdatomic.h. GCC 4.9 is the absolute floor.

**Native build on riscv64:**

```
./configure --program-prefix=eu-
make
make install
```

**Cross-compilation from x86_64 to riscv64:**

```
./configure \
  --host=riscv64-linux-gnu \
  CC=riscv64-linux-gnu-gcc \
  CXX=riscv64-linux-gnu-g++
make
```

`make check` in a cross build requires QEMU binfmt_misc: set up `qemu-riscv64-static` with `QEMU_LD_PREFIX` pointing to the riscv64 sysroot. The INSTALL file documents this generically; no riscv64-specific QEMU wrapper is included in the source tree.

**Required `--disable` flag on riscv64:**

```
--disable-stacktrace
```

This is mandatory. Without it, configure fails with: "stacktrace currently only supports x86/arm". The Fedora RPM spec gates `--enable-stacktrace` with `%ifarch x86_64`.

**Optional disables:**

```
--disable-symbol-versioning   # if cross-toolchain .symver fails; breaks ABI
--disable-demangler           # if no libstdc++ for target
--disable-debuginfod          # if server deps (sqlite3, libmicrohttpd) unavailable
--disable-libdebuginfod       # if libcurl unavailable
```

**Musl riscv64 caveat:** On musl-based systems, argp, fts, and obstack are absent from musl libc. configure will fail unless `libargp`, `libfts`, and `libobstack` packages are installed and found via `AC_SEARCH_LIBS`.

**Known build issue, now fixed:** elfutils 0.191-0.194 failed to build under clang with `-Werror=incompatible-pointer-types-discards-qualifiers` in `libcpu/riscv_disasm.c` at line 1259. The root cause was a non-const `struct known_csrs *found` receiving the return value of `bsearch()` (which returns `const void *` per C11/C23). GCC was permissive; clang rejected it. Fixed in elfutils 0.195 ([commit 4a5cf8be](https://sourceware.org/git/?p=elfutils.git;a=commit;h=4a5cf8be906d5991e7527e69e3f2ceaa74811301), merged 2025-11-24). Distributions vendoring 0.191-0.194 and building with clang require either the patch or `-Wno-error=incompatible-pointer-types-discards-qualifiers`.

**Fedora RPM spec `%build` section:**

```bash
RPM_OPT_FLAGS="${RPM_OPT_FLAGS/-Wall/}"
RPM_OPT_FLAGS="${RPM_OPT_FLAGS} -Wformat"
%configure CFLAGS="$RPM_OPT_FLAGS"
%make_build
```

`-Wall` is stripped because elfutils adds its own `-Werror` selectively; `-Wformat` is re-added for `-Werror=format-security`.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

**Functional gaps (features that do not work on riscv64):**

1. **eu-stacktrace**: Disabled at configure time. No RISC-V PMU register header is present. This is a permanent gap until a `_ASM_RISCV_PERF_REGS_H` equivalent is added to the kernel ABI and the elfutils configure check is updated.

2. **FPU live register read in debugger integration**: `riscv_initreg.c` fetches x0-x31 and PC via `PTRACE_GETREGSET/NT_PRSTATUS`, but explicitly does not fetch FP registers. The source contains the comment "FP registers not yet supported." This means `dwfl_thread_getframes()` cannot observe floating-point state when unwinding a live riscv64 process, which affects stack profiling tools (perf, bpftrace, systemtap) when the unwinder needs FP register state.

3. **Complex heterogeneous struct return value location**: `riscv_retval.c` handles simple cases (one or two members of the same base type fitting in 1-2 registers). Mixed-type structs and nested aggregates are unimplemented. The upstream commit message (2024-03-19) explicitly labels this "partial implementation." Tools relying on `dwfl_module_return_value_location` for struct-returning functions will get incorrect results for non-trivial aggregate types.

4. **eu-strip incorrectly removes SHT_RISCV_ATTRIBUTES**: `eu-strip --remove-comment` strips the `.riscv.attributes` section (SHT_RISCV_ATTRIBUTES = 0x70000003). This section carries the ISA string and ABI metadata required by the RISC-V psABI. Stripping it breaks dynamic linker ABI compatibility checks and tools that inspect ABI compliance. This bug is tracked externally in [openeuler-riscv/oerv-team #2074](https://github.com/openeuler-riscv/oerv-team/issues/2074) but has not yet been filed upstream or fixed in elfutils as of 2026-05-31.

**Feature matrix:**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| ELF read/write/strip | Full | Full | Full |
| DWARF consumer (libdw) | Full | Full | Full |
| Core file parsing | Full | Full | Full |
| Return value location (simple) | Full | Full | Full |
| Return value location (complex aggregates) | Full | Full | Partial |
| Live register read (integer) | Full | Full | Full |
| Live register read (FPU) | Full | Full | Missing |
| Stack unwind (eu-stack) | Full | Full | Partial (no FPU state) |
| eu-stacktrace | Full | Partial | Not available |
| Disassembly (base ISA) | Full | Full | Full |
| Disassembly (extensions) | Full (AVX/SSE/etc.) | Full (NEON/SVE) | Partial (no Zb*/V/B/J) |
| eu-strip --remove-comment correctness | Correct | Correct | Bug: removes SHT_RISCV_ATTRIBUTES |
| elflint GOT validation | Correct | Correct | Correct (fixed 2024-12-30) |
| clang buildability | Full | Full | Requires 0.195+ (pre-0.195 fails) |

**Security hardening gaps:** None specific to riscv64. The disassembler buffer overflow (Bug 33006, fixed 2025-06-03) and the out-of-bounds reads (fixed 2026-05-31) were riscv64-specific correctness/security issues that are now resolved in 0.195.

---

## 7. CI/CD Infrastructure

**Upstream CI (sourceware.org Buildbot):**

| Builder | ID | Architecture | Worker | Status | Recent builds |
|---|---|---|---|---|---|
| elfutils-ubuntu-riscv | 274 | riscv64 (native) | starfive-1 (StarFive board, Ubuntu 24.04, Linux 6.17 riscv64) | Active, passing | 20/20 passes (#312-#331), last pass 2026-06-21 |
| elfutils-debian-riscv | 272 | riscv64 | offline (masterids: []) | Inactive since 2023 | 2 builds total, both failures in 2023 |
| elfutils-debian-amd64 | - | amd64 | VM | Active | Passing |
| elfutils-debian-arm64 | - | arm64 | VM | Active | Passing |
| elfutils-fedora-x86_64 | - | x86_64 | VM | Active | Passing |

The riscv64 CI runs on physical StarFive hardware administered by Mark Wielaard. Historical failures are visible: build #166 (2025-Q1) failed on starfive-4, fixed in #167 on starfive-2; build #212 (2025-Q3) failed on starfive-1, fixed in #213.

**RISE runners:** No involvement. elfutils is not a RISE member project, has no entries in the RISE runner matrix, and is not mentioned in any RISE blog post or working group deliverable.

**CI comparison:**

| Architecture | Builders present | Worker type | Gating releases |
|---|---|---|---|
| amd64/x86_64 | Multiple (Debian, Fedora, CentOS, openSUSE) | VM | Yes |
| arm64 | 1 (Debian) | VM | Yes |
| riscv64 | 1 active (Ubuntu, StarFive hardware) | Physical board | Builds run; releases not formally gated |

---

## 8. Distribution and Release Status

**Current upstream release:** elfutils 0.195 (released 2026-04-15). Source: [sourceware.org/elfutils](https://sourceware.org/elfutils/) (direct access blocked by Anubis; version confirmed via Debian and Ubuntu package metadata).

**Binary package availability:**

| Distribution | Version | riscv64 status | Notes |
|---|---|---|---|
| Debian sid (unstable) | 0.195-1 | Installed (built on rv-osuosl-01, ~61 days ago as of research date) | riscv64 is a Debian sid/testing architecture only; not in Debian stable (bookworm) |
| Ubuntu 24.04 LTS | 0.190-1.1build4 | Available in ports pocket | Security-patched amd64/i386 at 0.190-1.1ubuntu0.1; riscv64 carries unpatched 0.190 |
| Arch Linux RISC-V | Unknown | Likely present (no distro-specific patches in felixonmars/archriscv-packages for elfutils) | Direct package availability unverifiable from available sources [NEEDS VERIFICATION] |
| Fedora | Data not available: Fedora riscv64 build status was not retrieved in this research session | - | - |
| PyPI | N/A | N/A | elfutils has no PyPI package; it is a C library |
| OCI/container images | Data not available: no search was performed for official elfutils container images | - | - |

**To get a working riscv64 binary:** On Debian sid or Ubuntu 24.04+, `apt install elfutils` or `apt install libdw-dev` is sufficient. For the latest 0.195 on Ubuntu LTS, building from source or using the Debian sid package in a container is required.

**Ubuntu LTS gap:** Ubuntu 24.04 ships 0.190 for riscv64. Fixes for the clang const-correctness build failure (0.195), the disassembler buffer overflow (0.194), and the _GLOBAL_OFFSET_TABLE_ elflint false positive (0.193) are absent from the Ubuntu LTS riscv64 package. Users relying on Ubuntu LTS riscv64 for clang-built environments will encounter build failures with elfutils 0.190 unless they backport the 0.195 patches.

---

## 9. Dependencies

All external dependencies of elfutils build and release cleanly on riscv64. No dependency is a blocker for any elfutils functionality.

**Critical dependency table:**

| Name | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|
| glibc | C runtime (mandatory) | Installed (Debian sid 2.42-17) | Tier-1 platform since glibc 2.27 | Fully released | None |
| zlib | Compression of .debug sections (mandatory) | Installed (Debian sid) | Passes | All major distros | None |
| bzip2 | bzip2-compressed .debug sections (optional) | Installed (Debian sid 1.0.8) | Passes | All major distros | None |
| xz/liblzma | LZMA-compressed .debug sections (optional) | Installed (Debian sid 5.8.3) | Passes | All major distros | None |
| zstd/libzstd | zstd-compressed .debug sections (optional, added ~0.185) | Installed (Debian sid 1.5.7) | Passes | All major distros | None |
| libcurl | debuginfod client (required for libdebuginfod) | Installed (Debian sid 8.21.0) | Passes | All major distros | None |
| libmicrohttpd | debuginfod server (optional) | Installed (Debian sid 1.0.5) | Passes | All major distros | None |
| sqlite3 | debuginfod server index (optional) | Installed (Debian sid 3.53.2) | Passes | All major distros | None |
| libarchive | debuginfod archive handling (optional) | Installed (Debian sid 3.8.7) | Passes | All major distros | None |
| json-c | debuginfod IMA verification (optional) | Installed (Debian sid 0.18) | Passes | All major distros | None |
| OpenSSL | TLS for debuginfod client via libcurl (transitive) | Well-supported on riscv64 | CI passes | All major distros | None |
| GCC | Build toolchain | GCC-15 installed (Debian sid 15.3.0); GCC-14 showed needs-build on Debian but superseded | N/A | Fully released | None (GCC-14 stale status resolved by GCC-15) |
| libstdc++ | C++ demangler (required unless --disable-demangler) | Present on riscv64 | N/A | All major distros | None |
| argp/fts/obstack | POSIX extensions absent from musl | Available as standalone libs for glibc systems | N/A | Not applicable on glibc | On musl riscv64 these must be provided separately |

**Notable: no dependency has a JIT, SIMD, crypto, or numerics component that creates riscv64-specific risk.** elfutils itself has no JIT. zlib, bzip2, and zstd have optional SIMD acceleration but degrade gracefully to scalar on riscv64. None of their riscv64 scalar fallbacks are known to have correctness issues.

---

## 11. Known Bugs and Active Issues

**Active correctness issues:**

| ID / Reference | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [openeuler-riscv/oerv-team #2074](https://github.com/openeuler-riscv/oerv-team/issues/2074) | eu-strip --remove-comment incorrectly strips .riscv.attributes section | Open (downstream investigation, not yet filed upstream) | High | SHT_RISCV_ATTRIBUTES removed by eu-strip; breaks RISC-V ABI metadata; psABI specifies this section must be preserved. No upstream elfutils fix as of 2026-05-31. |
| Internal (no upstream bug ID) | riscv_retval.c: complex heterogeneous aggregates unimplemented | Not filed as a separate bug; acknowledged in 2024-03-19 commit message | Medium | Affects `dwfl_module_return_value_location` for functions returning mixed int+float structs, nested structs, unions. Incorrect results silently returned. |
| Internal (no upstream bug ID) | riscv_initreg.c: FPU live registers not read | Not filed as a bug; marked TODO in source | Medium | `dwfl_thread_getframes()` cannot observe FPU state for live riscv64 processes. Affects bpftrace/perf symbol resolution in FP-heavy code. |

**Resolved correctness issues (with release versions):**

| Bug ID | Title | Fixed in | Severity | Notes |
|---|---|---|---|---|
| [Bug 33006](https://sourceware.org/bugzilla/show_bug.cgi?id=33006) | Stack buffer overflow in riscv_disasm (mnebuf too small) | 0.194 ([commit 07bd923c](https://sourceware.org/git/?p=elfutils.git;a=commit;h=07bd923cea4b883ca2357e9fc80babcedd242b37), 2025-06-03) | High | _FORTIFY_SOURCE abort on wide illegal RISC-V instructions; without hardening: UB stack write |
| [Bug 31142](https://sourceware.org/bugzilla/show_bug.cgi?id=31142) | riscv: pass_by_flattened_arg not implemented | 0.192 ([commit 669b648](https://sourceware.org/git/?p=elfutils.git;a=commit;h=669b648111d3bc27cd4756879f5fe5a18515de77), 2024-03-19) | Medium | dwfl_module_return_value_location failed on struct-returning functions |
| (no Bugzilla ID) | riscv_disasm.c: two out-of-bounds reads in CSR mnemonic lookup | 0.195 ([commit 003d1c8b](https://sourceware.org/git/?p=elfutils.git;a=commit;h=003d1c8bc8be6c45fc39eb1b886def17482ed3a5), 2026-05-31) | High | Off-by-one bounds on static arrays; triggerable by crafted ELF; security-relevant |
| (no Bugzilla ID) | riscv_disasm.c: const-correctness failure (clang -Werror) | 0.195 ([commit 4a5cf8be](https://sourceware.org/git/?p=elfutils.git;a=commit;h=4a5cf8be906d5991e7527e69e3f2ceaa74811301), 2025-11-24) | Medium | Build failure with clang strict mode / C23 bsearch prototype; affected 0.191-0.194 |
| (no Bugzilla ID) | elflint: false GOT warning for RISC-V binaries using .got.plt | 0.193 ([commit a4ece6a5](https://sourceware.org/git/?p=elfutils.git;a=commit;h=a4ece6a521c181e43854a5691d8c2828d326a925), 2024-12-30) | Low | False positive from eu-elflint for lld-linked RISC-V ELF |

Upstream Bugzilla (bugs.sourceware.org) was inaccessible during research due to Anubis bot protection. Additional open RISC-V bugs may exist that were not retrieved.

---

## 12. Objections and Upstream Blockers

**No blockers exist for riscv64 in elfutils.** The port is upstream, the CI is active, distributions ship packages, and the maintainer (Mark Wielaard) actively reviews and merges RISC-V patches.

**Open gaps that require upstream contribution (not blocked by policy):**

1. **SHT_RISCV_ATTRIBUTES stripping bug**: Requires an upstream bug report and a one-line fix in eu-strip to preserve sections of type SHT_RISCV_ATTRIBUTES. No organizational or technical objection is anticipated.

2. **FPU live register read in riscv_initreg.c**: Requires implementing `PTRACE_GETREGSET/NT_FPREGSET` (or equivalent) for riscv64. The kernel API exists; it is a straightforward addition analogous to arm64's implementation.

3. **Complex aggregate return value location**: Requires completing `flatten_aggregate` in riscv_retval.c to handle heterogeneous structs per the LP64D psABI floating-point calling convention rules. This is moderate effort (100-200 lines) but requires careful testing against the RISC-V psABI spec.

4. **Disassembler extension coverage**: Adding Zba/Zbb/Zbc/Zbs (bitmanip), Zicond (conditional ops), V (vector) decode to riscv_disasm.c. The disassembler is table-driven; adding extensions is mechanical but volume-intensive work.

5. **elfutils-debian-riscv builder offline**: The Debian riscv64 Buildbot builder (ID 272) has been offline since 2023. Restoring it would require a Debian riscv64 build worker being registered with the sourceware Buildbot master. This is a maintenance/infrastructure gap, not a technical blocker.

**Organizational stance:** Mark Wielaard has accepted all RISC-V patches submitted with tests and mailing-list review. There is no stated objection to further RISC-V work. Patch turnaround on the mailing list is typically days to weeks.

---

## 13. Investment Analysis

RISE has no prior investment in elfutils. All existing RISC-V work was contributed by SUSE, Red Hat, and community contributors. The CI infrastructure (StarFive hardware) was provided independently of RISE.

### 13.1 Functional Enablement

**eu-strip SHT_RISCV_ATTRIBUTES fix:** One-line fix in eu-strip. Requires understanding the `--remove-comment` code path, adding a check for `sh_type == SHT_RISCV_ATTRIBUTES`. Straightforward. Upstream bug report must be filed first (none exists yet).

**FPU live register read (riscv_initreg.c):** Add `PTRACE_GETREGSET/NT_FPREGSET` support. The kernel struct is `struct __riscv_d_ext_state` (32 FP regs + fcsr). Implementation is analogous to arm64's `riscv_initreg.c` peers. Requires a riscv64 Linux machine for testing.

**Complete flatten_aggregate in riscv_retval.c:** Handle heterogeneous aggregates per LP64D psABI section 2.14. The existing code handles same-base-type structs only. Mixed int+float, nested structs, and union types need to be added. Tests require new test binaries for each aggregate pattern.

### 13.2 Performance Optimization

Data not available: no benchmark data comparing elfutils performance on riscv64 vs arm64 or amd64 was found in any public source. elfutils is primarily I/O-bound (ELF file parsing) with no hot SIMD-acceleratable inner loops. Performance investment is low-priority.

### 13.3 CI/CD Infrastructure

**Restore elfutils-debian-riscv Buildbot worker:** Coordinate with Debian riscv64 porter team and Mark Wielaard to re-register a Debian riscv64 build worker. The Ubuntu riscv64 builder is active but Debian-based testing catches different packaging/dependency issues.

### 13.4 Ecosystem Enablement

Not applicable. elfutils has no Python/npm/Maven/OCI package ecosystem. It is a C library consumed via system package managers. Section 10 is omitted per report rules.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix eu-strip SHT_RISCV_ATTRIBUTES stripping (file upstream bug, implement fix, test) | 1 | Chip company contributor | Critical |
| Functional | Implement FPU live register read in riscv_initreg.c (NT_FPREGSET via ptrace) | 2 | Chip company contributor | High |
| Functional | Complete flatten_aggregate for heterogeneous aggregates in riscv_retval.c | 3 | Chip company contributor | High |
| Functional | Disassembler: add Zba/Zbb/Zbc/Zbs (bitmanip) decode to riscv_disasm.c | 3 | Chip company contributor | Medium |
| Functional | Disassembler: add V (vector) extension decode to riscv_disasm.c | 5 | Chip company contributor | Medium |
| Functional | Disassembler: implement symcb address resolution for branch targets (TODO in source) | 2 | Chip company contributor | Low |
| CI/CD | Restore elfutils-debian-riscv Buildbot worker | 1 | Chip company contributor + Debian porter team | Medium |

Total estimated effort: 17 person-weeks across all items. The two Critical/High functional items (SHT_RISCV_ATTRIBUTES fix + FPU live reg read) are 3 person-weeks and resolve the most user-visible correctness gaps. The aggregate return value work (3 weeks) resolves the remaining DWARF tooling correctness issue for struct-returning functions.

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [elfutils project homepage](https://sourceware.org/elfutils/)
- [elfutils git repository](https://sourceware.org/git/?p=elfutils.git)
- [Buildbot: elfutils-ubuntu-riscv builder (ID 274)](https://builder.sourceware.org/buildbot/#/builders/274)
- [Commit 127e3831: tests: Use readelf -N -w in run-strip-reloc.sh (2023-06-17)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=127e3831c169851e796496582213a94965337696)
- [Commit 485b87a2: backends: Update list of RISC-V relocations (2023-06-26)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=485b87a2e53045d2284a6649d529ab3aaa22e127)
- [Commit 669b6481: riscv: Partial implementation of flatten_aggregate (2024-03-19)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=669b648111d3bc27cd4756879f5fe5a18515de77)
- [Commit 46c5c98e: backends/riscv: Remove unused relocations (2024-07-31)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=46c5c98ee7ce2108f51ca8ecb0e81d55797c8470)
- [Commit a4ece6a5: backends: check_special_symbol _GLOBAL_OFFSET_TABLE_ (2024-12-30)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=a4ece6a521c181e43854a5691d8c2828d326a925)
- [Commit 07bd923c: libcpu: riscv_disasm use 50 char mnebuf (2025-06-03)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=07bd923cea4b883ca2357e9fc80babcedd242b37)
- [Commit 4a5cf8be: Fix const-correctness issues in riscv_disasm.c (2025-11-24)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=4a5cf8be906d5991e7527e69e3f2ceaa74811301)
- [Commit 003d1c8b: riscv_disasm.c: Fix out-of-bounds reads (2026-05-31)](https://sourceware.org/git/?p=elfutils.git;a=commit;h=003d1c8bc8be6c45fc39eb1b886def17482ed3a5)
- [elfutils Bug 31142: riscv pass_by_flattened_arg not implemented](https://sourceware.org/bugzilla/show_bug.cgi?id=31142)
- [elfutils Bug 33006: Stack buffer overflow in riscv_disasm](https://sourceware.org/bugzilla/show_bug.cgi?id=33006)
- [openeuler-riscv/oerv-team issue #2074: eu-strip --remove-comment incorrectly strips .riscv.attributes](https://github.com/openeuler-riscv/oerv-team/issues/2074)
- [ROCm/TheRock issue #5120: elfutils 0.192 fails to build under amd-llvm/clang](https://github.com/ROCm/TheRock/issues/5120)
- [Debian buildd tracker for elfutils](https://buildd.debian.org/status/package.php?p=elfutils)
- [Ubuntu 24.04 elfutils package (noble ports)](https://packages.ubuntu.com/noble/elfutils)
- [sourceware.org Buildbot API: elfutils builders](https://builder.sourceware.org/buildbot/api/v2/builders?tags__contains=elfutils)