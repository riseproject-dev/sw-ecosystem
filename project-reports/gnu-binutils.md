---
title: GNU binutils
parent: Project Reports
color: blue
dependencies:
  - name: GCC
    relation: build-dependency
    criticality: critical
  - name: GNU make
    relation: build-dependency
    criticality: critical
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: zlib
    relation: runtime-dependency
    criticality: critical
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: elfutils
    relation: runtime-dependency
    criticality: optional
  - name: GNU bison
    relation: build-dependency
    criticality: optional
  - name: Flex
    relation: build-dependency
    criticality: optional
  - name: autoconf
    relation: build-dependency
    criticality: optional
  - name: automake
    relation: build-dependency
    criticality: optional
  - name: DejaGNU
    relation: test-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="gnu-binutils" %}

# GNU binutils

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-10-30<br/>
**Readiness:** blue (release provider: distro)<br/>
**Scope:** RISC-V (riscv64/linux) support status for GNU binutils<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

Evidence: the git repository was read directly from a clone of `binutils-gdb` (HEAD `93a115ecd1`, 2026-10-30). Sourceware's bot protection blocks its web front ends (Bugzilla, gitweb, pipermail), so bug statuses and mailing-list threads come from search snippets and are flagged. Package-graph availability was not queried.

## 1. Project Overview

GNU binutils is the GNU assembler (gas), linker (ld), BFD (object and linker backend library), opcodes (disassembler and opcode tables), and the binary utilities (objdump, readelf and others). The repository is shared with GDB and the simulators: `https://sourceware.org/git/binutils-gdb.git`. The project homepage is [sourceware.org/binutils](https://sourceware.org/binutils/). The latest release shown on the homepage is 2.47.

**Foundation and governance**
- The FSF holds copyright, and the project is part of the GNU Project. The gnu.org copy of the page is run by the GNU Webmasters. The homepage names no other foundation.
- Per a search snippet of the "How Decisions Are Made" wiki page, the GNU Binutils Chief Maintainers make the highest-level policy decisions. The Administrators of the GNU Project appoint them. Subject maintainers have broad discretion in their areas. [NEEDS VERIFICATION] The wiki page itself was blocked.
- `binutils/MAINTAINERS` names Nick Clifton (head maintainer), Ian Lance Taylor, Jeff Law, Jim Wilson, DJ Delorie, Alan Modra, Michael Meissner, Richard Sandiford, Jan Beulich and Maciej W. Rozycki as the people with blanket write access. Other maintainers commit only within their own area. Areas without a maintainer fall to the head maintainer. Patches go to binutils@sourceware.org, except `config.guess` and `config.sub`, which go to config-patches@gnu.org.
- `MAINTAINERS` states that the project is currently not accepting LLM-generated patches, because the copyright status of such code is unclear. Trivial changes that are not legally significant are allowed.
- License: GPLv3 (`COPYING3`), with Free Software Foundation copyright headers in the source (for example `bfd/elfxx-riscv.c`: "Copyright (C) 2011-2026 Free Software Foundation, Inc.").

**Community stance on new ports**
- There is no formal approval policy. The homepage says binutils has been ported to most major Unix variants and Wintel systems, and that a porting guide has been contributed.
- In practice, new ports go through the binutils mailing list. The head maintainer or a global maintainer reviews and applies them, and the port's authors then become its maintainers. RISC-V followed this route in 2016.

**Corporate involvement (RISC-V)**
- Andrew Waterman: sifive.com address, listed as SiFive on a 2023-era Linux Foundation RISC-V toolchain page (search snippet only).
- Palmer Dabbelt: listed as Google on the same page. He used a personal email in the 2016 patch.
- Jim Wilson: SiFive, per the same page. An Oct 2020 mailing-list thread names him as one of three RISC-V maintainers.
- Nelson Chu: a sifive.com email in 2020 and in the current `MAINTAINERS` entry, but listed at Rivos (RIVOSINC) on the 2023-era page. His present employer is unverified.
- The current `MAINTAINERS` file lists five RISC-V maintainers: Palmer Dabbelt, Andrew Waterman, Jim Wilson, Nelson Chu and Kito Cheng (sifive.com addresses for Waterman, Chu and Cheng).
- Over the year to 2026-10-30, 72 commits touched the core RISC-V files (`gas/config/tc-riscv.c`, `bfd/elfnn-riscv.c`, `bfd/elfxx-riscv.c`, `opcodes/riscv-dis.c`, `ld/emultempl/riscvelf.em`, `include/opcode/riscv.h`). The most frequent authors were Jan Beulich (28) and Alan Modra (16), who are global maintainers working on shared code, then Jiawei (8), Ethan Y. C. Liang (8) and Kito Cheng (7).
- Binutils 2.47 adds SpacemiT vendor extensions (xsmtvdot, xsmtvdotii). The disassembler handles T-Head, CORE-V, SiFive and SpacemiT vendor operands.
- RISE: no evidence that binutils is a RISE project (see Section 14). The RISE tracker lists "DP_06_002 binutils" with SiFive as owner (contact Kito Cheng). [NEEDS VERIFICATION] Single source.

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2011 to 2014/15 | The RISC-V code was written out of tree. Copyright headers credit Andrew Waterman, UC Berkeley. It lived in riscv-gnu-toolchain until 2016. [NEEDS VERIFICATION] | [binutils list, Nov 2016](https://www.sourceware.org/ml/binutils/2016-11/msg00078.html) |
| Oct 2016 | The patch series was posted to the binutils list. It added bfd/cpu-riscv.c, bfd/elfnn-riscv.c, bfd/elfxx-riscv.c and include/elf/riscv.h, plus readelf and ELF machine-name changes. Search snippet only. [NEEDS VERIFICATION] | [binutils list, Oct 2016](https://www.sourceware.org/ml/binutils/2016-10/msg00098.html) |
| 2016-11-01 | Commit `e23eba971d` by Nick Clifton, "Add support for RISC-V architecture.", is the first commit adding `bfd/cpu-riscv.c`. Clifton approved and applied the MAINTAINERS patch adding Palmer Dabbelt and Andrew Waterman as RISC-V maintainers on 4 Nov 2016. | [binutils list, Nov 2016](https://www.sourceware.org/ml/binutils/2016-11/msg00078.html) |
| Dec 2016 | "RISC-V Fixes for 2.28" posted. The fetch returned 403, so only the title is known. | [pipermail](https://sourceware.org/pipermail/binutils/2016-December/096143.html) |
| Jan 2017 | Dabbelt submitted the GCC port. Search snippet only. [NEEDS VERIFICATION] | [gcc-patches](https://inbox.sourceware.org/gcc-patches/20170206082136.GA1849@tucnak/T) |
| 2017-03-02 | Binutils 2.28 (tag `binutils-2_28`) is the first release containing RISC-V, confirmed with `git tag --contains` on the first commit. Dabbelt backported fixes to the 2.28 branch in May 2017 [NEEDS VERIFICATION]. | Local clone, tags |
| 2017 Q2 | A commit lets a 32-bit BFD handle 64-bit objects. | [gdb-testers post](https://www.sourceware.org/ml/gdb-testers/2017-q2/msg01980.html) |
| Nov 2019 | Bug 25181 (linker relaxation with R_RISCV_ALIGN) fixed by Jim Wilson, with call-relax tests added. | [Bug 25181](https://sourceware.org/bugzilla/show_bug.cgi?id=25181) |
| Oct 2020 | Nelson Chu proposed as co-maintainer. | [pipermail](https://sourceware.org/pipermail/binutils/2020-October/113745.html), [pipermail](https://sourceware.org/pipermail/binutils/2020-October/113772.html) |
| Jul 2021 | Bug 28021 (wrong double relaxation with LTO) fixed in master and the 2.37 branch. | [Bug 28021](https://sourceware.org/bugzilla/show_bug.cgi?id=28021) |
| Apr 2023 | A patch for slow RISC-V objdump (bug 30282) was committed to master. The first attempt showed no significant speedup. Final status unconfirmed. | [Bug 30282](https://sourceware.org/bugzilla/show_bug.cgi?id=30282) |
| Jan 2024 | Mark Wielaard announced a riscv CI builder and a try builder on Sourceware Buildbot. | [announcement](https://inbox.sourceware.org/binutils/20240104003131.820681-2-mark@klomp.org/t) |
| Jul 2025 | Bug 33236 (`ld -r` with R_RISCV_ALIGN) filed 2025-07-31 by Fangrui Song. | [Bug 33236](https://sourceware.org/bugzilla/show_bug.cgi?id=33236) |
| Aug 2025 | Binutils 2.45 announced with "major enhancements for RISC-V". No feature list was fetched. | [Linuxiac](https://linuxiac.com/gnu-binutils-2-45-expands-risc-v-support/) |
| Feb 2026 | Binutils 2.46 released. The RISC-V item is generic (new instructions). | [Buildroot thread](https://ratatoskr.run/buildroot/2026/02/11784733), [OE-core thread](https://ratatoskr.run/openembedded-core/2026/02/16243728/t) |
| 26 Jul 2026 | Binutils 2.47 released. It adds Zalasr, Svrsw60t59b, Zvabd, Smpmpmt, nine vector dot-product extensions, SpacemiT vendor extensions and `--reloc-section-sym`. The official NEWS file was not seen. | [Linuxiac](https://linuxiac.com/gnu-binutils-2-47-released-with-new-risc-v-improvements/), [Phoronix](https://phoronix.com/news/GNU-Binutils-2.47), [Linux Journal](https://linuxjournal.com/content/gnu-binutils-247-released-new-risc-v-features-linker-improvements-and-reproducible-builds) |

**Fully upstream:** Yes. The RISC-V code is in the main tree on master. It is spread across `gas/config`, `bfd`, `opcodes`, `include`, `ld/emulparams`, `gdb` and `sim/riscv` (see Section 4). No out-of-tree patches are required for core functionality. Distros carry small patches (Section 8).

## 3. Upstream Support Tier

**Formal tier policy:** None found. The project has a Code of Conduct and a "How To Contribute" wiki page but no tier system.

**Evidence of support level**
- RISC-V has two dedicated Buildbot builders (per-commit and try) on Sourceware Buildbot. This is not in the repository (Section 7).
- Upstream publishes source tarballs and per-commit snapshots only ([releases](https://sourceware.org/pub/binutils/releases/), [GNU FTP](https://ftp.gnu.org/gnu/binutils), [snapshots](https://snapshots.sourceware.org/binutils/trunk/)). No official riscv64 binaries were found.
- Release-blocking status: Data not available. The release-process documentation was not retrievable.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Buildbot builders | x86_64 and i386 builders exist | arm64 and armhf builders exist | `binutils-ubuntu-riscv` (ID 283) and `binutils-try-ubuntu-riscv` (ID 284) |
| Builder hardware and OS | Data not available | Data not available | StarFive VisionFive 2, Ubuntu Server 23.10 as of Jan 2024 (search summary) [NEEDS VERIFICATION] |
| Upstream binaries | Source only | Source only | Source only |
| Formal tier | None | None | None |
| Current build status | Not checked | Not checked | Not checked (builder endpoints returned 403) |

Builder list source: [Buildbot builders API](https://builder.sourceware.org/buildbot/api/v2/builders).

## 4. Technical Architecture and RISC-V-Specific Subsystems

Binutils is C with no SIMD intrinsics, JIT, crypto kernels or GC barriers. A JIT backend or SIMD dispatch search was not run, so the absence is an assumption, not a result. RISC-V is a first-class, hand-written port, not a stub. File lists come from single-directory listings on [gnu.googlesource.com](https://gnu.googlesource.com/binutils-gdb/+/refs/heads/master/). Only the first ~100 KB of each large file was read, so the quality ratings below are partly inferred. [NEEDS VERIFICATION]

| Component | riscv64 evidence | Rating |
|---|---|---|
| BFD ELF backend (`bfd/elfnn-riscv.c`, 273 KB; `bfd/elfxx-riscv.c`, 185 KB) | Relocation application, GOT/PLT (including a Zicfilp landing-pad PLT variant), TLS (GD/IE/LE/TLSDESC), IFUNC via `.iplt`/`.igot.plt`, packed DT_RELR. `elfnn-riscv.c` is size-generic (elf32 and elf64). | Full |
| Linker relaxation (in `elfnn-riscv.c`) | Call, lui, pcrel, jal, tls_le, tlsdesc, align and GP relaxation, plus delete-bytes helpers. | Full, with open quality bugs (Section 11) |
| ISA and extension tables (`elfxx-riscv.c`, `include/opcode/riscv*.h`) | Implicit-extension rules, a large Z/S/X (vendor) table, profiles (`rva20u64`, `rva22u64`, `rva23u64` and others). | Full |
| Assembler (`gas/config/tc-riscv.c`, 241 KB) | `-march`/`-mabi`, macros (`li`, `la`, `call`, TLS, vector), branch relaxation, `.option`, `.attribute`, `.insn`, CSR checks. One noted TODO: incomplete error reporting for Zcmp register lists. | Full |
| Disassembler (`opcodes/riscv-dis.c`) | Defaults to `rv64gc`. Handles compressed (including Zcmp/Zcmt), vector and vendor operands (T-Head, CORE-V, SiFive, SpacemiT), and `$x`/`$d`/`$xrv` mapping symbols. Gap: constant pools are printed as code. | Full |
| Linker emulation (`ld/emulparams/`) | 14 parameter files covering elf32/elf64, little/big endian and the ilp32, ilp32f, lp64, lp64f ABIs. `elf64lriscv.sh` sets `OUTPUT_FORMAT=elf64-littleriscv` and the `/lib64/lp64d` search path. | Full |
| PE/COFF target (`bfd/pei-riscv64.c`, `bfd/coff-riscv64.c`) | `riscv64_pei_vec` target with tests `pei-riscv64.d/.s` in `binutils/testsuite/binutils-all/riscv`. Seen in an [AlmaLinux commit](https://git.almalinux.org/rpms/binutils/commit/47d833f38f327a94cd02dcd4078ef91b13b66ad6.diff) and the [master listing](https://gnu.googlesource.com/binutils-gdb/+/refs/heads/master/binutils/testsuite/binutils-all/riscv). | Present (not fetched in detail) |
| RVE and RVV PLT generation | `elfnn-riscv.c` emits a warning that these are unsupported. | Missing (niche gap) |
| GDB (same repo) | 12 `riscv-*` files in `gdb/` (linux, fbsd, none, ravenscar targets) and 10 files in `gdb/features/riscv/`. | Present |
| Simulator | `sim/riscv/` has 10 files (`interp.c`, `sim-main.c`, `machs.c` and others). | Present |
| Assembly (`.S`) files | None in `gas/testsuite/gas/riscv` (739 files, 258 `.s`) or `ld/testsuite/ld-riscv-elf` (320 files, 115 `.s`). The rest of the tree was not checked. | Not applicable |
| Testsuites | The ld RISC-V testsuite breakdown (about 58 attribute, 57 ifunc, 35 relr, 21 pcrel, 20 tls, 20 code-model, 19 Zicfilp/property tests) shows broad coverage. Only about 21 files are relaxation tests. | Broad |

amd64 vs arm64 vs riscv64: the amd64 and arm64 backends were not examined. Data not available: no search compared per-component implementations across architectures. The table above is riscv64-only.

Not checked for RISC-V code: `binutils/`, `gprof/`, `gold/`, `libctf/`, `gdbserver/`, `gdbsupport/`, `config.bfd`, `configure.tgt`, `ld/emultempl`, and `gdb/regformats/`.

## 5. Build System, Cross-Compilation, and Toolchain

Data not available: the build documentation could not be fetched. Sourceware, the GitHub mirror and `sourceware.org/binutils/docs` were all blocked or returned 403/404. No Dockerfile was found. Documentation location: [docs](https://sourceware.org/binutils/docs/).

The following commands are from memory only, not fetched from the build documentation. [NEEDS VERIFICATION]
- Cross: `./configure --target=riscv64-unknown-elf` (or `riscv64-linux-gnu`), then `make && make install`.
- Native riscv64: plain `./configure`.
- Common extra flags: `--disable-gdb`, `--disable-werror`, `--disable-nls`, `--with-sysroot`.

The build uses autotools. A separate `binutils-gdb-autoregen` builder exists on Buildbot and is not architecture-specific. Required GCC/Clang minimums and their rationale: Data not available.

**Known build and test issues (riscv64)**
- [Bug 28684](https://sourceware.org/bugzilla/show_bug.cgi?id=28684): 32-bit `--enable-targets=all` build breakage (Dec 2021, status not found).
- Gentoo bug 972719 reports ld tests failing on RISC-V. Only a snippet was available.
- Alpine carries `riscv64-textrels.patch`. Fedora carries `binutils-riscv-testsuite-fixes.patch`. The patch contents were not read.
- At the Jan 2024 announcement the gas and binutils testsuites had zero failures on riscv64, and some ld failures remained ([announcement](https://inbox.sourceware.org/binutils/20240104003131.820681-2-mark@klomp.org/t)). Current status is unverified.
- Build time on riscv64 hardware (Section 6).

**QEMU usage**
- Fedora uses QEMU with emulated cores to cope with slow RISC-V builders. [NEEDS VERIFICATION]
- A Fedora RISC-V porter tested with QEMU user-mode riscv64 emulation on an 80-core Ampere Altra AArch64 desktop. Some tests still time out ([primary blog](https://marcin.juszkiewicz.com.pl/2026/03/10/risc-v-is-sloooow/)).
- Upstream QEMU use for binutils: Data not available.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | riscv64 status | arm64 / amd64 |
|---|---|---|
| Assembler, disassembler, ELF linker | Present | Not examined |
| Linker relaxation | Present, slow and with open bugs | Not examined |
| TLS including TLSDESC, IFUNC, DT_RELR | Present | Not examined |
| Zicfilp landing-pad PLT, CFI property notes | Present (`property-cfi-lp-unlabeled.d`, `property-cfi-ss.d` tests exist) | Not examined |
| PE/COFF target | Present | Not examined |
| RVE and RVV PLT generation | Unsupported (warning) | Not examined |
| ld testsuite | Broad | Not examined |
| Vendor extensions | T-Head, CORE-V, SiFive, SpacemiT | Not examined |

**Functional gaps (cannot do X at all):**
- RVE and RVV PLT generation (the warning is emitted).
- `ld -r` fails when a non-relaxed section follows a relaxed one, per [Bug 33236](https://sourceware.org/bugzilla/show_bug.cgi?id=33236). The cause is that the assembler omits R_RISCV_ALIGN in that case. Open as of Jun 2026.
- `--emit-relocs` leaks internal relaxation relocation types into the output, per [Bug 34223](https://sourceware.org/bugzilla/show_bug.cgi?id=34223) (2.45). Unconfirmed.

**Performance gaps**
- Linker relaxation: over 90% of link time goes to `riscv_relax_delete_bytes`. Some large glibc testcases take about an hour to link on an Unmatched board ([Bug 28441](https://sourceware.org/bugzilla/show_bug.cgi?id=28441)).
- Binutils 2.47 claims no RISC-V runtime speedup. Its one speed change is generic BFD ld: `-O 0` stops merging mergeable section contents, which links faster but yields larger binaries ([Phoronix](https://phoronix.com/news/GNU-Binutils-2.47), [Linux Journal](https://www.linuxjournal.com/node/1341449)).
- No direct benchmark of as, ld or objdump on RISC-V against other architectures was found.
- The only data point is Fedora package build time, which measures hardware speed, not binutils speed (below).

**Fedora package build time for binutils 2.45.1-4.fc43** ([primary blog, 2026-03-10](https://marcin.juszkiewicz.com.pl/2026/03/10/risc-v-is-sloooow/)); the Phoronix secondary article returned 403, so its figures were checked only via search snippets.

| Arch | Cores | Memory (GB) | Build (min) |
|---|---|---|---|
| aarch64 | 12 | 46 | 36 |
| i686 | 8 | 29 | 25 |
| ppc64le | 10 | 37 | 46 |
| riscv64 | 8 | 16 | 143 |
| s390x | 3 | 45 | 37 |
| x86_64 | 8 | 29 | 29 |

- Derived ratios: riscv64 is about 4.9x slower than x86_64 (same core count) and about 4.0x slower than aarch64 (12 cores).
- The Fedora riscv64 port builds without LTO to save memory and time, while other architectures build with system-wide LTO. The real gap is therefore larger.
- Caveats: single-run wall-clock, cores not normalized, not a controlled benchmark.
- The table lists 8 cores for riscv64, but the post says RISC-V builders have 4 or 8 cores and the board is described as a StarFive VisionFive 2. Treat the core count as uncertain.
- A porter built binutils on a Milk-V Megrez in 58 minutes (primary blog). A Korean aggregator and a forum comment cite 67 minutes. These disagree, and the 67-minute blog is unidentified.
- Fedora's requirement to make riscv64 a primary architecture is hardware that builds binutils in under 1 hour with LTO, plus rackable and remotely manageable builders. UltraRISC UR-DP1000 and SpacemiT K3 are named as upcoming hardware ([pulse.bot](https://www.pulse.bot/hardware/news/current-risc-v-cpus-being-too-slow-causes-headaches-for-fedora-5x-slower-builds-50d3f4a8-26f8-44b3-9a21-ae04cb5d58b4/)).

**Security hardening gaps:** Zicfilp landing-pad PLT and CFI property support are present. Other hardening comparison: Data not available. Recent binutils 2.45/2.46 CVEs (heap overflow in `elf_swap_shdr`, readelf crashes on malformed ELF) are not RISC-V specific.

**NaN / floating-point semantics:** Not applicable to a toolchain of this kind. Data not available: none searched.

## 7. CI/CD Infrastructure

**In-tree CI:** None. The top level of master (28 directories plus dotfiles `.clang-format`, `.cvsignore`, `.editorconfig`, `.gitattributes`, `.gitignore`, `.pre-commit-config.yaml`) has no `.github/`, `.gitlab-ci.yml`, `.cirrus.yml` or `.travis.yml`, and `contrib/` has no CI files ([root](https://gnu.googlesource.com/binutils-gdb/+/refs/heads/master/), [contrib](https://gnu.googlesource.com/binutils-gdb/+/refs/heads/master/contrib/)). The only automation is [`.pre-commit-config.yaml`](https://gnu.googlesource.com/binutils-gdb/+/refs/heads/master/.pre-commit-config.yaml), which is lint-only. Its hooks are black, flake8, isort, codespell, tclint, yamllint, check-gnu-style, check-whitespace, check-include-guards, check-file-mode, check-copies and a manual shellcheck. It has no riscv64 reference. Subdirectories were not enumerated.

**External CI (Sourceware Buildbot):**
- Per the [builders API](https://builder.sourceware.org/buildbot/api/v2/builders), `binutils-ubuntu-riscv` (ID 283, tags binutils, ubuntu, riscv) builds and tests after each commit. `binutils-try-ubuntu-riscv` (ID 284) tests patches before they land.
- Per a web search summary of the [Jan 2024 announcement](https://inbox.sourceware.org/binutils/20240104003131.820681-2-mark@klomp.org/t), it runs on a StarFive VisionFive 2 with Ubuntu Server 23.10. gas and binutils testsuites had zero failures, and some ld failures remained. [NEEDS VERIFICATION] The thread returned HTTP 429, so the hardware and results are secondhand.
- Not verified: whether the builders are running and passing as of 2026-10-30. Builder detail endpoints returned 403. The Buildbot master configuration in `builder.git` was blocked.

The riscv64 CI is external to the repository. The in-tree files contain only a lint-only `.pre-commit-config.yaml` (confirmed from the clone), while the builder entries come from a direct fetch of the Buildbot API. The only unresolved point is whether the builders are current.

**Other riscv builders on the same Buildbot:** `gdb-riscv-full`, `glibc-fedora-riscv`, `valgrind-*-riscv`, `papi-ubuntu-riscv`, `systemtap-fedrawhide-riscv64`, and `gcc-full-spacemit-x60` (tag-only match).

**RISE runners:** The `riscv-runner` image installs the Ubuntu `binutils` package (`runner/images/Dockerfile.ubuntu`) and lists Binutils among its build tools. This is a generic tool in the image, not binutils CI. No binutils CI on RISE runners was found.

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Buildbot builders | Yes (x86_64, i386) | Yes (arm64, armhf) | Yes (2: per-commit and try) |
| Hardware | Data not available | Data not available | VisionFive 2 (Jan 2024) [NEEDS VERIFICATION] |
| In-tree CI config | None | None | None |
| Current pass status | Not checked | Not checked | Not checked |
| Distros | Debian, Fedora, openSUSE, Ubuntu, Gentoo (set shared across non-riscv builders) | Same | Ubuntu only |

## 8. Distribution and Release Status

**Upstream:** Source tarballs only ([releases](https://sourceware.org/pub/binutils/releases/), [GNU FTP](https://ftp.gnu.org/gnu/binutils), [snapshots](https://snapshots.sourceware.org/binutils/trunk/)). No official riscv64 binaries were found. The upstream release page itself was blocked.

**Distros (native riscv64 and target packages)**
- **Ubuntu 26.04 (resolute):** `binutils` 2.46-3ubuntu2 is Published in the release pocket, main component, for riscv64 as of 2026-03-19 ([Launchpad](https://launchpad.net/ubuntu/resolute/riscv64/binutils)). `packages.ubuntu.com` returned HTTP 500, so Launchpad was the fallback source.
- **Debian, Ubuntu:** [`binutils-riscv64-linux-gnu`](https://packages-picconi.debian.org/en/trixie/binutils-riscv64-linux-gnu) ([jammy page](https://packages.ubuntu.com/jammy/binutils-riscv64-linux-gnu)). This is the cross-binutils package for other host architectures, not proof of a native riscv64 binary. Debian sid riscv64 `binutils` was not checked.
- **Alpine:** [`binutils-riscv64`](https://pkgs.alpinelinux.org/package/v3.22/community/riscv64/binutils-riscv64) under community/riscv64. Carries `riscv64-textrels.patch`.
- **Fedora:** builds binutils on riscv64 (143 minutes for 2.45.1-4.fc43). Carries `binutils-riscv-testsuite-fixes.patch`.
- **Other target packages:** [Homebrew `riscv64-elf-binutils`](https://formulae.brew.sh/formula/riscv64-elf-binutils), [Arch `riscv64-elf-binutils`](https://archlinux.org/packages/extra/x86_64/riscv64-elf-binutils) (x86_64 host build), [MSYS2](https://packages.msys2.org/base/mingw-w64-riscv64-unknown-elf-binutils). Gentoo has a riscv64-related test bug (972719).
- **Arch Linux RISC-V** (archriscv.felixc.at): the query returned no listing, so availability is unknown.
- **PyPI:** `gnu-binutils` returns HTTP 404 ([PyPI](https://pypi.org/pypi/gnu-binutils/json)). The RISE wheel builder redirect also returned 404. Binutils is not distributed through PyPI. npm, Maven and OCI: Data not available (not searched).

**What a user must do:** On Ubuntu 26.04 riscv64, install the `binutils` package. On other distros, use the distro package. A user who wants an upstream build must compile from the source tarball. No upstream-provided riscv64 binary exists.

## 9. Dependencies

Package-graph evidence was not queried for any row. Roles for build/runtime/test come from the dependency list supplied for this report. Role details beyond that (for example, what each dependency does inside binutils) rest on general knowledge and are [NEEDS VERIFICATION]. riscv64 status for rows with local reports comes from those reports (`project-reports/*.md`), not from fresh checks.

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community |
|---|---|---|---|---|---|
| GCC | Build dependency (critical). Toolchain for building, and riscv64 target tests. | Yes, readiness blue | Yes | Not detailed (see [gcc report](project-reports/gcc.md)) | None noted |
| GNU make | Build dependency (critical). | Not assessed | Not assessed | Not assessed | No report exists |
| glibc | Runtime dependency (critical). Needed by the tools and for a native build. | Yes, readiness yellow | Not confirmed: the riscv64 builder state is contradictory in the report | Not detailed | Possible builder issues; no confirmed `make check` under QEMU (see [glibc report](project-reports/glibc.md)) |
| zlib | Runtime dependency (critical). Compressed debug sections (libbfd, gas, ld). | Yes. Upstream CI includes riscv64 and is release-blocking; readiness blue. | Yes, in CI | Source-only upstream. Packaged for riscv64 in Ubuntu 24.04, Debian sid, Arch RISC-V and Alpine edge. Ubuntu 26.04 not in the report. | Only RVV Adler32 PR #1099 is open and unreviewed (performance only). See [zlib report](project-reports/zlib.md). |
| zstd | Runtime dependency (optional). `--compress-debug-sections=zstd`. | Yes, readiness blue | Yes [NEEDS VERIFICATION] for release-blocking CI | v1.5.7 is current. Packaged for riscv64 in Ubuntu 24.04 and Debian sid. | The riscv64 arch-detection fix (PR #4525) is only in unreleased v1.6.0. No riscv64 PyPI wheel. See [zstd report](project-reports/zstd.md). |
| elfutils | Runtime dependency (optional). libdebuginfod lookup in binutils tools. | Yes, readiness blue | Not confirmed | 0.194-4 in Ubuntu 26.04 riscv64 (confirmed from a live page in the elfutils report); 0.196-1 on Arch RISC-V | None found. See [elfutils report](project-reports/elfutils.md). |
| GNU bison | Build dependency (optional). Parser generator for ld and gas. [NEEDS VERIFICATION] | Not assessed | Not assessed | Not assessed | In `projects.yml` but no `report:` |
| Flex | Build dependency (optional). Lexer generator. [NEEDS VERIFICATION] | Not assessed | Not assessed | Not assessed | No report |
| autoconf | Build dependency (optional). Presumably for regenerating configure scripts. | Not assessed | Not assessed | Not assessed | Data not available |
| automake | Build dependency (optional). Presumably for regenerating Makefile.in. | Not assessed | Not assessed | Not assessed | Data not available |
| DejaGNU | Test dependency (critical). Test harness for `make check`. [NEEDS VERIFICATION] | Not assessed | Not assessed | Not assessed | Not in `projects.yml` |

**Other candidate dependencies, not in the supplied list and unverified:** texinfo (documentation build), jansson (optional JSON output), and GMP/MPFR (needed by GDB in this repo, not binutils proper). Whether binutils actually uses jansson is unverified.

**Deep-dive (JIT, SIMD, crypto, numerics):** None of the listed dependencies fall in this category for binutils. The nearest items are zlib (the open RVV Adler32 PR #1099, performance only) and zstd (arch detection, PR #4525). Recursion on glibc and GCC dependencies: Data not available. Only their top-level readiness from the local reports was used.

## 11. Known Bugs and Active Issues

No master tracking bug for the riscv64 port exists in Sourceware Bugzilla. None of the bug pages could be opened, so all statuses come from search snippets. [NEEDS VERIFICATION] Severity in the table is an assessment, not a project-assigned value. Bug URL pattern: `https://sourceware.org/bugzilla/show_bug.cgi?id=N`.

**Correctness bugs**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [33236](https://sourceware.org/bugzilla/show_bug.cgi?id=33236) | ld riscv: Relocatable linking challenge with R_RISCV_ALIGN | Open (NEW). Filed 2025-07-31; comment 2026-06-05 points to a LoongArch patch on the list. | High | `ld -r` breaks when a non-relaxed section follows a relaxed one. |
| [34223](https://sourceware.org/bugzilla/show_bug.cgi?id=34223) | `--emit-relocs` writes internal relaxation relocation types into the executable (2.45) | Unconfirmed | Medium | ld.bfd leaks internal relocation types. |
| [31220](https://sourceware.org/bugzilla/show_bug.cgi?id=31220) | Fix relaxation of calls to addresses above 0xFFFF800 | Unconfirmed (Jan 2024) | Low | Patch attached. ROM in top 2 KiB of a 32-bit space. [NEEDS VERIFICATION] |
| [25258](https://sourceware.org/bugzilla/show_bug.cgi?id=25258) | relocation truncated to fit: R_RISCV_GPREL_I against `.LANCHOR2` | Unconfirmed | Medium | Seen in a FreeBSD build, bisected to a commit. |
| [22756](https://sourceware.org/bugzilla/show_bug.cgi?id=22756) | Relaxation miscalculates symbol addresses (2018) | Status not found | Medium | Only the testcase attachment was seen. |
| [31179](https://sourceware.org/bugzilla/show_bug.cgi?id=31179) | ld: SET/ADD/SUB fix breaks ABI compatibility with 2.41 objects (Dec 2023) | Status not found | High | ABI break for objects built with 2.41. |
| [25501](https://sourceware.org/bugzilla/show_bug.cgi?id=25501) | STT_GNU_IFUNC causes assertion on 64-bit RISC-V (Feb 2020, 2.34) | Status not found | Medium | |
| [32718](https://sourceware.org/bugzilla/show_bug.cgi?id=32718) | RISC-V relaxation and static-PIE addressing (Feb 2025) | Status not found | Medium | Seen only in an archive listing. |
| [28684](https://sourceware.org/bugzilla/show_bug.cgi?id=28684) | [RISCV] 32-bit `--enable-targets=all` build breakage (Dec 2021) | Status not found | Low | Build breakage on 32-bit hosts. |

**Performance and other**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [28441](https://sourceware.org/bugzilla/show_bug.cgi?id=28441) | [RISCV] ld linker relaxation is really slow | Open (NEW), no assignee. Filing date not found. | High (perf) | Reported against 2.35. About 1 hour to link some glibc tests on an Unmatched. Known about 4 years with no volunteer. |
| [29509](https://sourceware.org/bugzilla/show_bug.cgi?id=29509) | Proposal to remove RISC-V linker relaxation (2022) | Status not found | Context | Cites 28441 and other relaxation bugs. |
| [31653](https://sourceware.org/bugzilla/show_bug.cgi?id=31653) | readelf fails to apply R_RISCV_SET/SUB_ULEB128 relocations (Apr 2024) | Status not found | Low | Filed against debugedit, not binutils proper. |

**Closed or non-binutils (context)**
- [25181](https://sourceware.org/bugzilla/show_bug.cgi?id=25181): fixed Nov 2019.
- [28021](https://sourceware.org/bugzilla/show_bug.cgi?id=28021): fixed Jul 2021 in master and the 2.37 branch, with no further backports planned.
- [30282](https://sourceware.org/bugzilla/show_bug.cgi?id=30282): slow objdump; patch committed Apr 2023, final status unconfirmed.
- [24226](https://sourceware.org/bugzilla/show_bug.cgi?id=24226): judged a compiler bug by Jim Wilson.
- Bugzilla 27200 (2021, `ld -b binary` bad ELF header flag) and [Arch FS#71395](https://bugs.archlinux.org/task/71395) (2021, objdump segfault on raw binaries): status unknown.

A fetch-verification attempt on the first six bugs returned only Anubis "Access Denied" pages. No merge dates or first releases are verified for any row.

## 12. Objections and Upstream Blockers

- **Stated objections:** A 2022 proposal to remove RISC-V linker relaxation exists ([Bug 29509](https://sourceware.org/bugzilla/show_bug.cgi?id=29509)). Its outcome was not found. Relaxation is still present on master and is being extended (2.47 notes).
- **Technical blockers:** Relaxation performance has no volunteer after about 4 years (Bug 28441). The `ld -r` problem with R_RISCV_ALIGN (Bug 33236) is waiting on an approach already used by a LoongArch patch.
- **Organizational blockers:** Current CI status is unverifiable from outside, because Sourceware's bot protection blocks automated access to the bug tracker and web front ends. `MAINTAINERS` states that LLM-generated patches are not accepted, which constrains AI-assisted contributions.
- **Acceptance probability:** The port is already upstream and under active development (2.45 to 2.47 all carry RISC-V changes). No stated objection to the port itself was found. New RISC-V work follows the mailing-list review path with the RISC-V maintainers. No probability estimate is derivable from the evidence.

## 13. Readiness Assessment

- **Color:** blue
- **Release provider:** distro

Justification: Upstream's own Sourceware Buildbot has riscv64 builders [binutils-ubuntu-riscv and binutils-try-ubuntu-riscv](https://builder.sourceware.org/buildbot/api/v2/builders) that build and run the testsuite per commit on a VisionFive 2. Per the [Jan 2024 announcement](https://inbox.sourceware.org/binutils/20240104003131.820681-2-mark@klomp.org/t), gas and binutils had zero failures and only some ld failures remained. Upstream ships source tarballs only, so the consumable riscv64 binaries come from distros: release provided by distro (Ubuntu 26.04 has [binutils 2.46-3ubuntu2](https://launchpad.net/ubuntu/resolute/riscv64/binutils)), not upstream. Confidence is medium: the CI lives outside the repo (the in-tree files contain only a lint-only pre-commit config), and the builders could not be confirmed as still running or passing today.

Pending work that could change the grade:
- No open RISE work on binutils. RISE shows binutils only as a dependency. The RISE tracker lists DP_06_002 binutils with SiFive as owner.
- Open Bugzilla items [28441](https://sourceware.org/bugzilla/show_bug.cgi?id=28441) (ld relaxation very slow) and [33236](https://sourceware.org/bugzilla/show_bug.cgi?id=33236) (`ld -r` broken with R_RISCV_ALIGN). Neither blocks the grade.
- To confirm blue, someone needs to check current Buildbot build status (builder 283) and whether the remaining ld failures were fixed.
- If the Buildbot is judged not to count as upstream CI, the grade would fall to yellow or orange under the distribution floor. That would depend on distro patch status, since Alpine carries `riscv64-textrels.patch` and Fedora carries `binutils-riscv-testsuite-fixes.patch`.
- Package-graph evidence was not queried.

## 14. Investment Analysis

**What RISE has already done or funded:** Nothing specific to binutils was found.
- No RISE blog post, repo, runner work or Developer Appreciation Program award mentions binutils. The blog index never rendered, so this is likely but not exhaustively verified.
- The `compilers-and-toolchains-wg` README says it focuses on GCC and LLVM, "but may include specific items from binutils, Go, or other compilers". That is a charter statement, not work.
- The RISE tracker lists "DP_06_002 binutils" (SiFive, contact Kito Cheng) and "DP_10_003 Build performance CI infrastructure" (High priority, Intel, 2H2024, no numbers) ([RISE tracker](https://lf-rise.atlassian.net/wiki/x/sSSD)). [NEEDS VERIFICATION]
- The RISE slide deck lists LLVM, GCC and GLIBC under Compilers & Toolchains; binutils is not named.
- The sw-ecosystem reports record binutils version floors: 2.38 (sel4, dav1d, wireguard), 2.43 (xbyak-riscv Zvfbfwma test), 2.35 (LuaJIT `%got_pcrel_hi`), and 2.41 rejecting `zvfh` at assembly time (litert).

Effort figures below are planning estimates, not sourced findings. No existing RISE work overlaps with them.

### 14.1 Functional Enablement

- Fix `ld -r` handling of R_RISCV_ALIGN (Bug 33236). A LoongArch patch is already on the list as a model.
- Stop `--emit-relocs` from leaking internal relocation types (Bug 34223). The current status of the bug is unconfirmed.
- Triage the unresolved correctness bugs with unknown status (22756, 25501, 31179, 32718) and confirm which are fixed on master.
- RVE and RVV PLT generation (low priority, niche).

### 14.2 Performance Optimization

- Reduce `riscv_relax_delete_bytes` cost in ld (Bug 28441). It is the single largest identified RISC-V-specific performance defect, with over 90% of link time in relaxation on affected workloads.
- Hardware build speed (143 minutes for the Fedora package, against Fedora's under-60-minute LTO target) is a silicon and board matter. It is not binutils software work.

### 14.3 CI/CD Infrastructure

- Confirm that builders 283 and 284 are still running and passing, and whether the remaining ld failures were fixed.
- If the VisionFive 2 is still the builder, consider offering faster riscv64 hardware to Sourceware Buildbot. The cost depends on what hardware is available. Data not available: no pricing or Buildbot hosting terms were found.
- Trial a lint or build job on RISE runners only if Sourceware cannot host. No need identified.

### 14.4 Ecosystem Enablement

Binutils has no package ecosystem. The relevant work is upstreaming the distro carry patches (Alpine `riscv64-textrels.patch`, Fedora `binutils-riscv-testsuite-fixes.patch`) and resolving Gentoo bug 972719. Patch contents were not read, so effort is unknown.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| CI/CD | Verify Buildbot builders 283/284 status and remaining ld failures | 1 | RISE / Sourceware liaison | High |
| Functional | Fix `ld -r` with R_RISCV_ALIGN (Bug 33236) | 3 to 4 | Binutils RISC-V maintainers | High |
| Functional | Fix `--emit-relocs` internal relocation leak (Bug 34223) | 1 to 2 | Binutils RISC-V maintainers | Medium |
| Functional | Triage status of bugs 22756, 25501, 31179, 32718 | 1 to 2 | RISE | Medium |
| Performance | Speed up ld relaxation (Bug 28441) | 6 to 10 | Unassigned | High |
| Ecosystem | Upstream Alpine and Fedora riscv64 carry patches | 2 to 3 | RISE / distro maintainers | Medium |
| Functional | RVE and RVV PLT generation | 2 to 4 | Unassigned | Low |
| CI/CD | Faster riscv64 builder hardware for Buildbot | Data not available | Hardware sponsor | Low |

## 15. References

- [GNU binutils homepage](https://sourceware.org/binutils/)
- [Sourceware Buildbot builders API](https://builder.sourceware.org/buildbot/api/v2/builders)
- [New riscv CI and try builder for binutils, some ld failures (Jan 2024)](https://inbox.sourceware.org/binutils/20240104003131.820681-2-mark@klomp.org/t)
- [binutils master tree (gnu.googlesource.com)](https://gnu.googlesource.com/binutils-gdb/+/refs/heads/master/)
- [.pre-commit-config.yaml](https://gnu.googlesource.com/binutils-gdb/+/refs/heads/master/.pre-commit-config.yaml)
- [contrib/ listing](https://gnu.googlesource.com/binutils-gdb/+/refs/heads/master/contrib/)
- [binutils-all/riscv testsuite listing](https://gnu.googlesource.com/binutils-gdb/+/refs/heads/master/binutils/testsuite/binutils-all/riscv)
- [AlmaLinux binutils commit (pei-riscv64)](https://git.almalinux.org/rpms/binutils/commit/47d833f38f327a94cd02dcd4078ef91b13b66ad6.diff)
- [Binutils release tarballs](https://sourceware.org/pub/binutils/releases/)
- [GNU FTP binutils](https://ftp.gnu.org/gnu/binutils)
- [Binutils trunk snapshots](https://snapshots.sourceware.org/binutils/trunk/)
- [Binutils documentation](https://sourceware.org/binutils/docs/)
- [Launchpad binutils 2.46-3ubuntu2 resolute riscv64](https://launchpad.net/ubuntu/resolute/riscv64/binutils)
- [PyPI gnu-binutils (404)](https://pypi.org/pypi/gnu-binutils/json)
- [Debian binutils-riscv64-linux-gnu (trixie)](https://packages-picconi.debian.org/en/trixie/binutils-riscv64-linux-gnu)
- [Ubuntu binutils-riscv64-linux-gnu (jammy)](https://packages.ubuntu.com/jammy/binutils-riscv64-linux-gnu)
- [Homebrew riscv64-elf-binutils](https://formulae.brew.sh/formula/riscv64-elf-binutils)
- [Arch riscv64-elf-binutils](https://archlinux.org/packages/extra/x86_64/riscv64-elf-binutils)
- [MSYS2 riscv64-unknown-elf-binutils](https://packages.msys2.org/base/mingw-w64-riscv64-unknown-elf-binutils)
- [Alpine binutils-riscv64](https://pkgs.alpinelinux.org/package/v3.22/community/riscv64/binutils-riscv64)
- [Binutils 2.47 (Phoronix)](https://phoronix.com/news/GNU-Binutils-2.47)
- [Binutils 2.47 (Linuxiac)](https://linuxiac.com/gnu-binutils-2-47-released-with-new-risc-v-improvements/)
- [Binutils 2.47 (Linux Journal)](https://linuxjournal.com/content/gnu-binutils-247-released-new-risc-v-features-linker-improvements-and-reproducible-builds)
- [Binutils 2.47 (Linux Journal node)](https://www.linuxjournal.com/node/1341449)
- [Binutils 2.45 (Linuxiac)](https://linuxiac.com/gnu-binutils-2-45-expands-risc-v-support/)
- [Buildroot binutils 2.46 thread](https://ratatoskr.run/buildroot/2026/02/11784733)
- [OE-core binutils 2.46 thread](https://ratatoskr.run/openembedded-core/2026/02/16243728/t)
- [RISC-V Fixes for 2.28](https://sourceware.org/pipermail/binutils/2016-December/096143.html)
- [binutils list, Nov 2016 (MAINTAINERS patch)](https://www.sourceware.org/ml/binutils/2016-11/msg00078.html)
- [binutils list, Oct 2016 (port submission)](https://www.sourceware.org/ml/binutils/2016-10/msg00098.html)
- [binutils list, Oct 2020 (maintainers)](https://sourceware.org/pipermail/binutils/2020-October/113745.html)
- [binutils list, Oct 2020 (Nelson Chu)](https://sourceware.org/pipermail/binutils/2020-October/113772.html)
- [gcc-patches RISC-V port thread](https://inbox.sourceware.org/gcc-patches/20170206082136.GA1849@tucnak/T)
- [gdb-testers 2017 post](https://www.sourceware.org/ml/gdb-testers/2017-q2/msg01980.html)
- [Binutils bug 28441](https://sourceware.org/bugzilla/show_bug.cgi?id=28441)
- [Binutils bug 25181](https://sourceware.org/bugzilla/show_bug.cgi?id=25181)
- [Binutils bug 33236](https://sourceware.org/bugzilla/show_bug.cgi?id=33236)
- [Binutils bug 25258](https://sourceware.org/bugzilla/show_bug.cgi?id=25258)
- [Binutils bug 34223](https://sourceware.org/bugzilla/show_bug.cgi?id=34223)
- [Binutils bug 22756](https://sourceware.org/bugzilla/show_bug.cgi?id=22756)
- [Binutils bug 29509](https://sourceware.org/bugzilla/show_bug.cgi?id=29509)
- [Binutils bug 28684](https://sourceware.org/bugzilla/show_bug.cgi?id=28684)
- [Binutils bug 25501](https://sourceware.org/bugzilla/show_bug.cgi?id=25501)
- [Binutils bug 31179](https://sourceware.org/bugzilla/show_bug.cgi?id=31179)
- [Binutils bug 32718](https://sourceware.org/bugzilla/show_bug.cgi?id=32718)
- [Binutils bug 31653](https://sourceware.org/bugzilla/show_bug.cgi?id=31653)
- [Binutils bug 31220](https://sourceware.org/bugzilla/show_bug.cgi?id=31220)
- [Binutils bug 30282](https://sourceware.org/bugzilla/show_bug.cgi?id=30282)
- [Binutils bug 28021](https://sourceware.org/bugzilla/show_bug.cgi?id=28021)
- [Binutils bug 24226](https://sourceware.org/bugzilla/show_bug.cgi?id=24226)
- [Arch Linux FS#71395](https://bugs.archlinux.org/task/71395)
- [RISC-V is sloooow (Marcin Juszkiewicz, 2026-03-10)](https://marcin.juszkiewicz.com.pl/2026/03/10/risc-v-is-sloooow/)
- [Current RISC-V CPUs Being Too Slow Causes Headaches For Fedora (pulse.bot)](https://www.pulse.bot/hardware/news/current-risc-v-cpus-being-too-slow-causes-headaches-for-fedora-5x-slower-builds-50d3f4a8-26f8-44b3-9a21-ae04cb5d58b4/)
- [RISE tracker (DP_06_002, DP_10_003)](https://lf-rise.atlassian.net/wiki/x/sSSD)