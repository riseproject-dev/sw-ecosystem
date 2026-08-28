---
title: capstone
parent: Project Reports
---

# capstone

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for capstone<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

Capstone is a portable, multi-architecture disassembly engine written in C. It decodes machine instructions from binary byte sequences and returns structured data (mnemonic text, operand types, register read/write access, instruction group membership, CSR names). It does not execute code; it has no JIT or code generation component for any architecture. The library is designed for embedding in firmware, OS kernels, and security tools; it deliberately carries zero external runtime dependencies.

**License:** BSD 3-Clause for Capstone-original code; LLVM-derived generated tables are separately tracked under a BSD-style LLVM license (`LICENSE_LLVM.TXT`).

**Governance:** Informal benevolent-maintainer model. No Linux Foundation membership, no RISC-V International membership, no foundation affiliation. The `capstone-engine` GitHub org has 2 public members: `kabeor` (Wu ChenXu, credited as "reviewing all PRs" in the v6 release notes) and `xwings` (founder of Qiling Framework). The project was created by Nguyen Anh Quynh (`aquynh`) in 2013 under COSEINC; he remains the top all-time committer (3,137 commits) but has no listed company affiliation. There is no `MAINTAINERS`/`CODEOWNERS` file. Day-to-day technical decisions in 2025-2026 are dominated by Rot127, moste00, and wargio - all RizinOrg-affiliated.

**Primary corporate sponsor:** [RizinOrg](https://rizin.re) (the organization behind the Rizin reverse-engineering framework). The v6 release guide states explicitly: "Almost all the work [on v6] was sponsored by RizinOrg. This release would have simply not happened without them." RizinOrg-sponsored developers include Rot127 (AArch64/ARM/PPC/SystemZ/Auto-Sync infra), moste00 (RISC-V), billow/b1llow (TriCore/M68K), and R33v0LT (Alpha/HPPA). No other company has committed funding at comparable scale for v6.

Secondary RISC-V contributors include slate5 (Petar Andric, Barcelona Supercomputing Center) and 12101111 (Harbin Institute of Technology). Historical v4.0/v4.0.1 sponsors (NowSecure, Verichains, VSEC, Thinkst Canary, Catena Cyber) are no longer listed.

**Community culture on new ports:** Formal written policy in `CONTRIBUTING.md`: open an issue before starting work. This rule was instituted largely because the RISC-V port had three independent competing implementations (porto703/citypw/fanfuqiang) over a 20-month period before a single one merged in 2019. New-port proposals are welcomed procedurally but are self-funding: the project has no budget to pay outside contributors. The v6 refactor explicitly required corporate sponsorship (RizinOrg) to happen at all.

**Project history note (2020 near-death):** XVilka described the project as "dying without enough maintainers" in October 2020. RizinOrg sponsorship starting around 2023 revived it. There was an explicit fork threat from XVilka/Rot127 in June 2023 if the auto-sync breaking changes were not merged - "if auto-sync work is not merged, I am afraid we have to fork the capstone." The founder (aquynh) capitulated and agreed to the v6 breaking changes.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2017-07-18 | Issue #966 opened requesting RISC-V disassembly support | [Issue #966](https://github.com/capstone-engine/capstone/issues/966) |
| 2018-05-08 | PR #1131 by porto703 (based on lowRISC riscv-llvm) - opened, never merged | [PR #1131](https://github.com/capstone-engine/capstone/pull/1131) |
| 2018-07-05 | PR #1198 "Basic RISCV support" by citypw - opened, never merged | [PR #1198](https://github.com/capstone-engine/capstone/pull/1198) |
| 2019-02-27 | PR #1401 "RISCV support ISRV32/ISRV64" opened by fanfuqiang (consolidating ultrasoc fork) | [PR #1401](https://github.com/capstone-engine/capstone/pull/1401) |
| 2019-03-09 | PR #1401 merged by aquynh - first RISC-V support in upstream Capstone | [PR #1401](https://github.com/capstone-engine/capstone/pull/1401) |
| 2021-03-07 | PR #1690 merged by Richard Henderson - added CSR register name output | [PR #1690](https://github.com/capstone-engine/capstone/pull/1690) |
| 2023-06-10 | PR #2007 merged - added call/int/branch_relative instruction groups | [PR #2007](https://github.com/capstone-engine/capstone/pull/2007) |
| 2024-06-24 | Issue #2392 opened tracking SAIL-based alternative generator approach | [Issue #2392](https://github.com/capstone-engine/capstone/issues/2392) |
| 2024-07-10 | PR #2393 merged - added register/memory read-write access detail | [PR #2393](https://github.com/capstone-engine/capstone/pull/2393) |
| 2025-07-03 | PR #2745 merged - fixed c.srli illegal shift amount decoding | [PR #2745](https://github.com/capstone-engine/capstone/pull/2745) |
| 2025-07-16 | PR #2756 opened by moste00 - full LLVM-18 auto-sync rewrite (424 files, +316k/-14k lines) | [PR #2756](https://github.com/capstone-engine/capstone/pull/2756) |
| 2025-11-09 | Draft PR #2498 (SAIL-based generator) closed as abandoned | [PR #2498](https://github.com/capstone-engine/capstone/pull/2498) |
| 2026-01-13 | Issue #2392 (SAIL approach) closed: "obsolete, too complex" | [Issue #2392](https://github.com/capstone-engine/capstone/issues/2392) |
| 2026-02-01 | PR #2756 merged by Rot127 - RISC-V auto-sync rewrite shipped in v6 | [PR #2756](https://github.com/capstone-engine/capstone/pull/2756) |
| 2026-02-01 | Issue #966 closed: "So much closed with #2756" | [Issue #966](https://github.com/capstone-engine/capstone/issues/966) |
| 2026-02-11 / 2026-02-13 | PRs #2859/#2860 merged - fixed control-flow-group misclassification post-#2756 | [PR #2859](https://github.com/capstone-engine/capstone/pull/2859) / [PR #2860](https://github.com/capstone-engine/capstone/pull/2860) |
| 2026-03 through 2026-07 | 12+ follow-on RISC-V fix/cleanup PRs merged (aliases, sysregs, Ventana vendor, writeback, crash fixes, frm operands) | See Section 11 |
| 2026-07-31 | PR #3008 opened - broader alias-flag redesign, still under review | [PR #3008](https://github.com/capstone-engine/capstone/pull/3008) |

**RISC-V is fully upstream.** There are no known forks carrying RISC-V improvements not yet upstreamed. The entire RISC-V module (`arch/RISCV/`) is generated from `capstone-engine/llvm-capstone` (an LLVM fork tracking LLVM-18) via the Auto-Sync pipeline. The update procedure is documented in `contrib/riscv_update/README.md`.

**Key contributors:**
- moste00 (مصطفي محمود كمال الدين, Cairo University, sponsored by RizinOrg) - author of PR #2756 and nearly all 2025-2026 RISC-V work
- Rot127 (RizinOrg) - primary reviewer for all RISC-V work, Auto-Sync infrastructure
- slate5 (Petar Andric, Barcelona Supercomputing Center) - Ventana vendor support, alias fixes, writeback detection
- Richard Henderson - CSR output (2021)
- h01G3r - c.srli fix (2025)

---

## 3. Upstream Support Tier

Capstone has no formal numbered tier system. There is a de facto three-bucket model tracked in [Issue #2015](https://github.com/capstone-engine/capstone/issues/2015):

1. **Auto-Sync "Done"** - regenerated from LLVM tablegen on each LLVM update. RISC-V is in this bucket as of PR #2756 (v6), alongside ARM, AArch64, PPC, SystemZ, Mips, Sparc, LoongArch, HPPA, Alpha, TriCore, BPF, M68k.
2. **Backlog** - not yet auto-synced, rated by refactor difficulty (Easy: AVR, Lanai, MSP430; Medium: CSKY, VE; Hard: Hexagon).
3. **Permanently excluded** - x86, because "we cannot generate all tables in C."

RISC-V's move from a hand-maintained LLVM-7-era frozen module to Auto-Sync "Done" happened in v6. This is the highest maintenance tier in Capstone. PR #2756 carried the `blocker` label ("Must be finished with the assigned milestone"), confirming it was release-blocking for v6.

Open issue #2848 flags that the 32-bit `cs_mode` bitfield is nearly exhausted by RISC-V's ~26+ vector-extension combinations alone, with a larger representation (proposed 256-bit) needed eventually. [NEEDS VERIFICATION - the issue was referenced in research findings but the exact bit-exhaustion count was not confirmed from the issue body itself.]

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Auto-Sync tier (LLVM-generated) | No (x86 excluded) | Yes (AArch64) | Yes (as of v6/PR #2756) |
| Release-blocking label on refactor PR | N/A | Yes | Yes |
| Official prebuilt binaries (GitHub Releases) | Yes (.rpm, .deb, .exe) | No | No |
| Python wheels on PyPI | Yes (manylinux x86_64) | Yes (manylinux aarch64) | No |
| Public API header coverage | riscv.h (2893 lines, 1764 INS enum, 460 REG enum) | aarch64.h | riscv.h (same) |
| Java bindings | Yes | Yes | No (gap, WIP PR #2904) |
| Python bindings | Yes | Yes | Yes (same module) |

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

Capstone is a pure disassembler. Its architecture-specific components are: a decode table (LLVM-generated `.inc` files), an instruction printer, a mapping layer (instruction ID to name/group/register-access), and a public API header. There is no JIT, no code generation, no SIMD execution, no crypto implementation, no GC barrier, and no assembler. The "SIMD" entries below refer to Capstone's ability to decode SIMD instructions (e.g., RVV), not to using SIMD in its own implementation.

| Component | Description | amd64 | arm64 | riscv64 |
|---|---|---|---|---|
| Instruction decoder (`RISCVDisassembler.c`, 758 lines) | Decodes binary bytes to `MCInst` struct | x86Disassembler (hand-written) | AArch64Disassembler (auto-sync) | RISCVDisassembler (auto-sync from LLVM-18) - complete |
| Instruction printer (`RISCVInstPrinter.c`, 447 lines) | Formats `MCInst` to mnemonic+operands text | x86InstPrinter | AArch64InstPrinter | RISCVInstPrinter - complete |
| Mapping layer (`RISCVMapping.c`, 493 lines) | Instruction name/group/reg-access | x86Mapping | AArch64Mapping | RISCVMapping - complete, active fixes ongoing |
| Public API header | `include/capstone/riscv.h` | x86.h | aarch64.h | riscv.h - 2893 lines, 1764 instruction enum entries, 460 register entries |
| Base ISA | RV32I/RV64I/RV32E/RV64E | N/A | N/A | Complete |
| Standard extensions | M, A, F, D, C, Zicsr, Zifencei | N/A | N/A | Complete |
| Bit-manipulation extensions | Zba, Zbb, Zbc, Zbs, Zbkb, Zbkc, Zbkx | N/A | N/A | Complete |
| Cryptography extensions | Zknd, Zkne, Zknh, Zksed, Zksh, Zkr | N/A | N/A | Complete |
| Vector (RVV 1.0) | V extension, vsetvl, load/store/arith/mask/reduction | N/A | N/A | Complete (decode/print only, not execution) |
| Vector-crypto | Zvkb/Zvbb/Zvbc/Zvkg/Zvkned/Zvknha/Zvknhb/Zvksed/Zvksh | N/A | N/A | Complete |
| Half/other float | Zfh, Zfhmin, Zfbfmin, Zfa, Zfinx/Zdinx/Zhinx | N/A | N/A | Complete |
| Code-size extensions | Zca/Zcb/Zcd/Zcmp/Zcmt/Zcmop, Zicond, Zimop | N/A | N/A | Complete |
| CFI extensions | Zicfilp, Zicfiss | N/A | N/A | Complete |
| Cache/pause hints | Zicbom/p/z, Zihintpause, Zihintntl | N/A | N/A | Complete |
| Atomics | Zacas, Zawrs, Ztso, Svinval | N/A | N/A | Complete |
| Hypervisor | H extension | N/A | N/A | Complete |
| Vendor: T-Head | XTHead Ba/Bb/Bs/CondMov/Cmo/FMemIdx/Mac/MemIdx/MemPair/Sync/Vdot (10 sub-extensions) | N/A | N/A | Complete |
| Vendor: SiFive | XSfvcp/XSfvqmaccdod/XSfvqmaccqoq/XSfvfwmaccqqq/XSfvfnrclipxfqf | N/A | N/A | Complete |
| Vendor: OpenHW CORE-V | XCV elw/bitmanip/mac/mem/alu/simd/bi (7 sub-extensions) | N/A | N/A | Complete |
| Vendor: Ventana | XVentanaCondOps | N/A | N/A | Complete (added via PR #2917, merged 2026-05-16) |
| FP rounding-mode operand (`frm`) | Exposes rounding mode field as operand on F/D instructions | N/A | N/A | Added PR #2972, merged 2026-06-23 |
| Register read/write access detail | `cs_regs` read/write access tracking | Yes | Yes | Yes (added PR #2393, 2024; extended PR #2895, 2026-04) |
| Instruction groups | INT/CALL/JUMP/BRANCH_RELATIVE/RET/IRET/PRIVILEGE | Yes | Yes | Yes (correctness bug in `ret` group, see Section 11) |
| CSR system register names | Named CSR operands | Yes | N/A | Yes (PR #1690, 2021; public enum added PR #2894, 2026-04) |
| Java bindings | `Riscv.java`/`Riscv_const.java` | Yes | Yes | No - gap, WIP PR #2904 open |
| Python bindings | `riscv.py` + `riscv_const.py` | Yes | Yes | Yes - complete |

**Extension coverage note:** ~100 feature flags are present in `RISCVGenCSFeatureName.inc`. RISC-V is, by extension count, the most complex architecture module in Capstone.

**No `.S` assembly files, no JIT component.** Capstone performs no runtime code generation for any architecture.

---

## 5. Build System, Cross-Compilation, and Toolchain

Capstone supports two build systems: CMake (primary, recommended) and a top-level `make.sh` wrapper.

**RISC-V disassembler module build (on any host):**

```
cmake -DCAPSTONE_RISCV_SUPPORT=1 -DCMAKE_BUILD_TYPE=Release \
      -DCAPSTONE_INSTALL=1 -DCAPSTONE_BUILD_SHARED_LIBS=1 \
      -DCMAKE_INSTALL_PREFIX=/usr -B build .
cmake --build build --target install
```

This builds and installs `libcapstone.so` and `cstool` with RISC-V decode support on any host (x86, arm64, riscv64). The library is a pure disassembler; it does not need to execute RISC-V instructions. `cstool` on an x86 host can disassemble riscv64 instruction bytes natively.

**Required toolchain:** C99-capable C compiler (GCC or Clang), CMake. No minimum version is stated in the research findings beyond what CMake/GCC versions Ubuntu 22.04/24.04 ship with. The auto-sync riscv.h compat-header check in CI requires `clang-format-20` (Ubuntu 24.04 only).

**Cross-compilation to riscv64:** Standard CMake cross-compilation via `CMAKE_TOOLCHAIN_FILE` with `gcc-riscv64-linux-gnu` toolchain. No RISC-V-specific CMake options are required beyond enabling `CAPSTONE_RISCV_SUPPORT=1`. No QEMU is needed at build time; the library is host-agnostic.

**Known build failure:** Issue #2887 "Disabling CAPSTONE_RISCV_SUPPORT causes a crash during the build" - closed 2026-07-10 as fixed. Builds with the module disabled are now clean.

**QEMU usage:** Not documented in research findings as part of the normal build or test workflow. The CI cross-build matrix (`CrossBuilds.yml`) uses QEMU user-mode emulation for s390x, MIPS, MIPS64el, PPC64, and ARM - but not riscv64. A user wishing to run Capstone's test suite on riscv64 via QEMU would need to set this up independently.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 | Gap |
|---|---|---|---|---|
| Full instruction decode/print | Yes | Yes | Yes | None |
| Operand type coverage (REG/IMM/MEM) | Yes | Yes | Yes | None |
| FP operand (FP rounding mode frm) | N/A | N/A | Yes (added 2026-06-23) | None |
| CSR operand type | N/A | N/A | Yes | None |
| Register read/write access detail | Yes | Yes | Yes | None |
| Instruction group classification | Yes | Yes | Partial (ret groups had bugs, fixed 2026-02; `ret` operand bug still open) | Issue #2407 (open) |
| Compressed instruction alias semantics | N/A | N/A | Incorrect (design bug, active redesign) | Issue #2959, PR #3008 (open) |
| Java bindings | Yes | Yes | No | PR #2904 (WIP) |
| Python bindings | Yes | Yes | Yes | None |
| Prebuilt wheel on PyPI | Yes | Yes | No | Source build required |
| Prebuilt binary in GitHub Releases | Yes (x86_64 .deb/.rpm) | No | No | None vs arm64; parity with arm64 |
| OOB-read in cs_insn_name() | Not affected | Not affected | CVE-2026-49282 (CVSS 5.1, unfixed as of 2026-05-27) | Security gap |
| 32-bit cs_mode bitfield exhaustion | Not affected | Not affected | Risk: ~26+ vector-extension combinations near the 32-bit limit | Issue #2848 (open) |
| Auto-Sync from LLVM | No (excluded by design) | Yes | Yes | None vs arm64 |

**Performance gaps:** Data not available. No RISC-V-specific decode throughput benchmarks (instructions/second, latency) were found in the repository, the project website, or the RISE blog. The project advertises "high performance" generally but publishes no architecture-comparative numbers.

**Floating-point semantics:** Capstone decodes FP instructions and exposes the `frm` (rounding-mode) field as an operand since PR #2972 (2026-06-23). It does not execute FP operations; there are no FP semantics correctness concerns applicable to a disassembler.

**Security hardening:** CVE-2026-49282 (CVSS 5.1) is a RISC-V-specific OOB read in `RISCV_insn_name()` triggered by passing an instruction ID in the range `[RISCV_INS_ALIAS_BEGIN, RISCV_INS_ALIAS_END)` to `cs_insn_name()`. The bounds check passes but the index computation `id - RISCV_INS_ALIAS_BEGIN - 1` underflows as an unsigned value, producing index ~4.3 billion into `insn_alias_mnem_map`. This causes an ASan-confirmed SEGV. No patched version is listed in the advisory's `vulnerable_version_range`. This is not present in the amd64 or arm64 backends.

---

## 7. CI/CD Infrastructure

GitHub Actions is the sole CI system. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exist in the repository (all 404).

RISC-V content appears in 2 of 11 workflow files (`CITest.yml`, `cstool.yml`). In both cases, the CI runs on an x86 `ubuntu-latest` or `ubuntu-22.04`/`ubuntu-24.04` runner; no riscv64 runner or QEMU riscv64 emulation is present anywhere.

**`cstool.yml`** - builds Capstone with only `CAPSTONE_RISCV_SUPPORT=1` and runs:
```
cstool -d riscv64+v+fd 57144a14
```
on the x86 host. This confirms the RISC-V decoder builds and produces output for a 4-byte instruction sequence. Runner: `ubuntu-latest` (x86).

**`CITest.yml`** - the "Compatibility header generation" step (gated to `ubuntu-24.04`, cmake builds only) runs:
```
./suite/auto-sync/src/autosync/HeaderPatcher.py --riscv-compat --header ./include/capstone/riscv.h
diff ./include/capstone/riscv.h riscv_current.h
```
This detects ABI-breaking drift in `riscv.h` between commits. It is a header-text diff, not an execution test.

**`CrossBuilds.yml`** - explicitly omits riscv64. This workflow performs QEMU-based cross-architecture execution tests for s390x, MIPS 32, MIPS64el, PPC64, and ARM. riscv64 is absent.

**RISE runners:** RISE announced free native RISC-V CI runners on GitHub in March 2026 ([announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)). Capstone does not use them. No `runs-on:` value in any Capstone workflow file references a RISC-V runner label.

| CI criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build tested in CI | Yes (multiple matrix entries) | No (not in CI matrix) | No (not in CI matrix) |
| Decode correctness (MC test corpus) tested in CI | Yes (ctest runs MC vectors on x86 host) | Yes (same, x86 host) | Yes (same, x86 host, not on riscv64 hardware) |
| QEMU cross-execution CI | N/A | No | No |
| Native hardware CI runner | x86 GitHub-hosted | No | No |
| Header compat-drift CI check | No | No | Yes (CITest.yml ubuntu-24.04) |
| ASAN/UBSAN tested | Yes (ubuntu-24.04 ASAN matrix entry) | No | No |

---

## 8. Distribution and Release Status

**Upstream GitHub Releases (`capstone-engine/capstone`):**

Latest stable: 5.0.9 (source tarball only). Latest pre-release: 6.0.0-Alpha10 (2026-07-21). For Alpha10: assets are `capstone-6.0.0-Alpha10-Windows-x64.exe`, `capstone-6.0.0-Alpha10.tar.xz` (source), `capstone-devel-6.0.0-Alpha10.x86_64.rpm`, `libcapstone-dev_6.0.0-Alpha10_amd64.deb`. No riscv64 binary in any release. Source tarballs are available for all architectures.

**PyPI:**

Latest stable: 5.0.9. Latest alpha: 6.0.0a7. Wheels cover: `manylinux_2_17_aarch64`, `manylinux_2_17_x86_64`, `manylinux2014_i686`, `musllinux_1_2_{aarch64,i686,x86_64}`, macOS universal2/arm64/x86_64, Windows win32/win_amd64/win_arm64. No riscv64 wheel exists in any version (5.0.0 through 6.0.0a7). `pip install capstone` on riscv64 triggers a source compile via `setup.py::build_libraries()` using cmake/make.

**RISE wheel builder:** RISE's GitLab wheel builder for Python packages (73 packages) does not include capstone. The `riseproject-dev/python-wheels` package list has no capstone entry. A query to the RISE GitLab PyPI endpoint for capstone redirects to public PyPI.

**Ubuntu 24.04 (Noble):** All 6 capstone-related packages are built for riscv64 at version 4.0.2-5.1build1:
- `capstone-tool`, `libcapstone-dev`, `libcapstone4`, `python3-capstone` (version 4.0.2)
- `librust-capstone-dev` 0.11.0-2, `librust-capstone-sys-dev` 0.15.0-2

Note: Ubuntu 24.04 ships version 4.0.2, not 5.x or 6.x. Users who need v5 or v6 features on riscv64 must build from source.

**Debian sid:** Capstone 5.0.9-1 builds successfully on riscv64. Status: "Installed", build time 22d 6h 54m, buildd host `rv-manda-02`. Same "Installed" status as all other tracked architectures.

**Arch Linux RISC-V (`archriscv.felixc.at`):**
- `extra` repo: `capstone-5.0.9-1-riscv64.pkg.tar.zst`
- `extra` repo: `capstone6pwndbg-6.0.0Alpha9-1-riscv64.pkg.tar.zst` (pwndbg-patched Capstone 6 alpha fork)

| Source | riscv64 available | Version |
|---|---|---|
| GitHub Releases | No - source tarball only | 6.0.0-Alpha10 (latest) |
| PyPI wheels | No - source sdist only | 5.0.9 / 6.0.0a7 |
| RISE wheel builder | No | N/A |
| Ubuntu 24.04 | Yes (all packages) | 4.0.2 |
| Debian sid | Yes | 5.0.9-1 |
| Arch Linux RISC-V | Yes | 5.0.9 + Alpha9 fork |

**What a riscv64 user must do:** Install from distro package manager for Debian/Ubuntu/Arch (gets 4.0.2 or 5.0.9 depending on distro). For v6 (which contains the LLVM-18 auto-sync rewrite): build from source (`cmake` + `gcc`). `pip install capstone` triggers a source compile automatically.

---

## 9. Dependencies

Capstone's shipped library (`libcapstone`) and CLI (`cstool`) have zero external runtime or build dependencies. The only external dependencies are confined to the test framework (`suite/cstest`) and the maintainer-only LLVM-resync tool (`suite/auto-sync`). Neither is part of the distributed product.

| Name | Role | riscv64 build | riscv64 test | riscv64 release/package | Notes |
|---|---|---|---|---|---|
| **cmocka** | C unit-test/mocking framework for `suite/cstest` | OK | OK | Debian sid riscv64: 2.0.2-1+b1 installed | Fetched via ExternalProject_Add at v1.1.8 if no system copy |
| **libyaml** | YAML parser for `suite/cstest` test fixture files | OK | OK | Debian sid riscv64: 0.2.5-2+b1 installed | Built from source at tag 0.2.5 if no system lib |
| **libcyaml** | Thin libyaml wrapper for `suite/cstest` | OK | OK | Debian sid riscv64: 1.4.2-1+b2 installed | ExternalProject_Add at v1.4.2 |
| **tree-sitter** (Python) | Incremental parser for Auto-Sync `ASUpdater` (LLVM table regeneration) | Debian package OK (0.26.11-1). PyPI wheels for pinned version 0.24.0 have no riscv64 build; riscv64 wheels only available from 0.26.0+ | Not in CI | Dev-only, never shipped | PyPI source build falls back for riscv64 on pinned 0.24.0 |
| **tree-sitter-cpp** (Python) | C++ grammar for Auto-Sync header patcher | Debian package OK (0.23.4-3). PyPI wheel for pinned 0.23.4 has no riscv64 build | Not in CI | Dev-only, never shipped | tree-sitter/tree-sitter issue #5458 notes sdist source builds for grammar packages miss `tree_sitter/parser.h`; closed "not planned" by maintainers |
| **PyYAML** | YAML parsing for `cstest_py` Python test wrapper | OK (system libyaml-dev on riscv64, C extension builds from source) | Not in CI | No riscv64 wheel (6.0.3); sdist fallback works | No blocking issues found |
| **LLVM** (llvm-tblgen, llvm-mc, FileCheck) | Table generator for Auto-Sync resync from `capstone-engine/llvm-capstone` fork | LLVM has native riscv64 host+target support | N/A | Dev-only, never shipped | Cloned/built manually by maintainer; not in any manifest |

**Recursion depth assessment:** The shipped library has no dependency chain to recurse into. The test-only dependencies (cmocka, libyaml, libcyaml) are all present and building in Debian riscv64 with no known issues. The dev-tooling dependency nuance (tree-sitter pinned versions lacking riscv64 wheels) affects only a maintainer running the LLVM-resync pipeline on a riscv64 machine; it has no effect on building, testing, or packaging Capstone itself.

---

## 11. Known Bugs and Active Issues

**Open RISC-V correctness/design bugs:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2407](https://github.com/capstone-engine/capstone/issues/2407) | Incorrect operands data for RISC-V ret | Open since 2024-07-24 | High (operand API returns empty for `ret`) | `CsInsn.operands` returns empty list for `ret` instruction in Python bindings; mnemonic text is correct but structured data is wrong. Maintainer said fix would ride on a since-superseded PR; still unresolved. |
| [#2959](https://github.com/capstone-engine/capstone/pull/2959) | RISCV: compressed insn treats the uncompressed version as an alias | Open/draft since 2026-06-09, 38 comments | High (design-level, wrong detail data) | Compressed instructions (`c.*`) modeled as aliases of uncompressed counterparts, causing wrong operand data. Superseded by PR #3008. |
| [#3008](https://github.com/capstone-engine/capstone/pull/3008) | Revamp flags to allow fine grained control over aliasing | Open since 2026-07-31, updated 2026-08-16 | Design (3500+/3400- line diff) | Broader flag-based redesign for alias control, continuing from #2923 and #2959. Active review as of 4 days before this report. |
| [#2848](https://github.com/capstone-engine/capstone/issues/2848) | 32-bit cs_mode bitfield nearly exhausted by RISC-V extensions | Open | Medium (future scalability) | ~26+ RISC-V vector-extension combinations nearly fill the 32-bit mode flag space. Proposed resolution: larger bitfield representation. |

**Security vulnerabilities:**

| CVE/GHSA | CVSS | Affected | Status | Description |
|---|---|---|---|---|
| CVE-2026-49282 / [GHSA-jrw4-wj52-2vw8](https://github.com/capstone-engine/capstone/security/advisories/GHSA-jrw4-wj52-2vw8) | 5.1 (medium) | RISC-V (and M68K) | Unfixed as of 2026-05-27 | `RISCV_insn_name()` unsigned index underflow - passes first bounds check, then `id - RISCV_INS_ALIAS_BEGIN - 1` underflows to ~4.3B, causing OOB read and SEGV. Reported by Thai Son Dinh (VinSOC Labs). |

Other 2026 CVEs in the repo (SH decoder OOB, ARM check_pop_return, 3DNow! NULL deref, Xtensa, SStream/skipdata) do not name RISC-V.

**Recently fixed RISC-V bugs (last 12 months, showing post-v6 churn):**

| PR/Issue | Fix | Merged |
|---|---|---|
| [PR #2996](https://github.com/capstone-engine/capstone/pull/2996) | Restored backward compat for `CS_MODE_RISCVC` renamed to `CS_MODE_RISCV_C` in v6 | 2026-07-18 |
| [PR #2972](https://github.com/capstone-engine/capstone/pull/2972) | Added `frm` rounding-mode operand on F/D-extension instructions | 2026-06-23 |
| [PR #2966](https://github.com/capstone-engine/capstone/pull/2966) | Fixed crash from invalid register value leaking through public API | 2026-06-20 |
| [PR #2960](https://github.com/capstone-engine/capstone/pull/2960) | Fixed `MCInst_handleWriteback()` not being called - `tied_op_idx` never populated | 2026-06-13 |
| [PR #2917](https://github.com/capstone-engine/capstone/pull/2917) | Added Ventana vendor identifier missing from public API | 2026-05-16 |
| [PR #2897](https://github.com/capstone-engine/capstone/pull/2897) | Fixed `cstool` misreporting alias operand sets as "REAL" | 2026-04-20 |
| [PR #2895](https://github.com/capstone-engine/capstone/pull/2895) | Extended `reg_access` testing to Python bindings | 2026-04-17 |
| [PR #2894](https://github.com/capstone-engine/capstone/pull/2894) | Added public enum for CSR system registers in `riscv.h` | 2026-04-15 |
| [PR #2891](https://github.com/capstone-engine/capstone/pull/2891) | Fixed alias mnemonic mapping table | 2026-04-10 |
| [PR #2881](https://github.com/capstone-engine/capstone/pull/2881) | Fixed stale values in `cs_detail` between decode calls | 2026-03-29 |
| [PR #2869](https://github.com/capstone-engine/capstone/pull/2869) | Added `+noaliascompressed` option to disable compressed alias printing | 2026-03-04 |
| [PR #2860](https://github.com/capstone-engine/capstone/pull/2860) | Fixed spurious return groups for `JALR ra` | 2026-02-13 |
| [PR #2859](https://github.com/capstone-engine/capstone/pull/2859) | Fixed `ret` group misclassification after #2756 | 2026-02-11 |
| [PR #2745](https://github.com/capstone-engine/capstone/pull/2745) | Fixed `c.srli` vs. custom-extension-space disambiguation (bit 12 check) | 2025-07-03 |

**Churn assessment:** 15 RISC-V-specific merged fix PRs in 13 months post-PR #2756 merge indicates the auto-sync rewrite introduced a cluster of correctness regressions being actively worked down. The alias semantics issue (#2959, #3008) is the most architecturally significant open item and involves a 3500+ line redesign still under active review.

---

## 12. Objections and Upstream Blockers

**No organizational objections to riscv64.** The project has no stated policy against RISC-V; the opposite is true - the RISC-V auto-sync rewrite was a v6 release blocker.

**Technical blockers (active):**

1. **Alias semantics redesign (PR #3008):** The ongoing redesign of how aliases (including compressed/uncompressed instruction pairs) are represented is a significant open change (3500+/3400- lines) that will affect the RISC-V public API. Any downstream code using RISC-V compressed instruction details should not depend on the current alias behavior. Status: active review as of 2026-08-16.

2. **CVE-2026-49282 unfixed:** An OOB-read in `RISCV_insn_name()` with no patched version. Any security-sensitive deployment using the RISC-V backend should be aware this is unpatched in the current release line.

3. **32-bit cs_mode near-exhaustion (#2848):** The flag space for RISC-V extensions is nearly full. Adding further fine-grained extension flags (demanded by wargio during PR #2756 review) will require a bitfield representation change, which is an ABI break. This may delay stable v6 finalization.

4. **Java bindings gap:** PR #2904 is WIP. Java-based tooling consuming Capstone's RISC-V decode via JNI has no structured access to RISC-V operand data.

5. **No riscv64 QEMU cross-execution CI:** The test suite runs on x86 hosts only. Bugs that manifest only on riscv64 hardware (e.g., endianness or alignment issues in the library's own code, not in its decode tables) would not be caught by CI.

**Acceptance probability for riscv64 contributions:** High. The project actively merged 15 RISC-V fixes in 13 months. The governance precedent set by PR #2756 (full breaking rewrite accepted with `blocker` label) shows the project will accept significant RISC-V work if it comes with tests and reviewer bandwidth. The constraint is reviewer capacity (Rot127 is the bottleneck), not architectural hostility.

---

## 13. Investment Analysis

RISE has no involvement with Capstone. No RISE blog post (33 checked), no RISE python-wheels entry, no riseproject-dev GitHub repo, and no issue or PR in capstone-engine/capstone references RISE. All RISC-V work to date has been funded by RizinOrg.

### 13.1 Functional Enablement

**Active unfixed correctness bugs:**
- CVE-2026-49282: OOB read in `RISCV_insn_name()` requires a targeted fix in `arch/RISCV/RISCVMapping.c` lines 374-384. The bounds check logic must handle the `[RISCV_INS_ALIAS_BEGIN, RISCV_INS_ALIAS_END)` range correctly before computing the alias index.
- Issue #2407: `ret` instruction returns empty operands in Python bindings. Requires tracing the alias-to-operand pipeline for pseudo-instruction expansion in `RISCVMapping.c`/`RISCVDisassembler.c`.
- Java bindings gap (PR #2904 WIP): completing Java RISC-V bindings enables Java-based security tooling (IDA alternatives, Rizin Java bridge, etc.) to consume structured RISC-V decode data.

### 13.2 Performance Optimization

Data not available: no riscv64 decode throughput benchmarks exist. Performance optimization cannot be prioritized without baseline measurements. A benchmark suite measuring decode throughput (instructions/second) and memory footprint on riscv64 hardware would be a prerequisite before any optimization investment.

### 13.3 CI/CD Infrastructure

Two gaps with clear remediation paths:

1. **riscv64 QEMU cross-execution CI in `CrossBuilds.yml`:** Adding a riscv64 entry to the existing QEMU cross-build matrix (which already covers s390x, MIPS, MIPS64el, PPC64, ARM) is straightforward - the infrastructure pattern is identical. Requires installing `gcc-riscv64-linux-gnu` and `qemu-user-static` on the Ubuntu host and adding a matrix entry. This catches any host-architecture bugs in the library itself (not the decode tables).

2. **Native riscv64 CI via RISE runners:** RISE offers free native RISC-V CI runners on GitHub. Adopting these for a subset of the test suite (cstest MC vectors, unit tests) would give ground-truth execution results on real riscv64 hardware without QEMU overhead.

### 13.4 Ecosystem Enablement

No significant RISC-V-specific ecosystem gaps. The library builds from source on riscv64 with no issues. Debian, Ubuntu, and Arch Linux RISC-V all ship riscv64 packages. The only gap is PyPI riscv64 wheels, but `pip install capstone` already falls back to source build automatically and succeeds. Adding riscv64 to the `build-wheels-publish.yml` workflow is low complexity; the `manylinux_2_31_riscv64` platform tag is established on PyPI.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Fix CVE-2026-49282 OOB read in `RISCV_insn_name()` bounds check | 0.5 | External contributor or RizinOrg | Critical |
| Functional | Fix Issue #2407: `ret` instruction empty operands in Python bindings | 1 | External contributor | High |
| Functional | Complete Java RISC-V bindings (PR #2904, currently WIP) | 2 | External contributor | Medium |
| CI/CD | Add riscv64 QEMU entry to `CrossBuilds.yml` (pattern-match existing MIPS/PPC entries) | 0.5 | External contributor | High |
| CI/CD | Adopt RISE native riscv64 runners for MC test corpus execution | 1 | External contributor + RISE coordination | Medium |
| Ecosystem | Add `manylinux_2_31_riscv64` wheel to `build-wheels-publish.yml` | 1 | External contributor | Low |
| Functional | Monitor and validate PR #3008 (alias redesign) for RISC-V API stability | 2 (review bandwidth) | Qualcomm/RizinOrg jointly | High |

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [Issue #966 - Support for RISC-V instruction disassembly (2017-2026)](https://github.com/capstone-engine/capstone/issues/966)
- [Issue #2015 - auto-sync progress tracker (master tracker, still active)](https://github.com/capstone-engine/capstone/issues/2015)
- [Issue #2392 - SAIL-based module generator (closed 2026-01-13)](https://github.com/capstone-engine/capstone/issues/2392)
- [Issue #2407 - Incorrect operands data for RISC-V ret (open)](https://github.com/capstone-engine/capstone/issues/2407)
- [Issue #2848 - 32-bit cs_mode bitfield exhaustion (open)](https://github.com/capstone-engine/capstone/issues/2848)
- [PR #1401 - RISCV support ISRV32/ISRV64 (merged 2019-03-09)](https://github.com/capstone-engine/capstone/pull/1401)
- [PR #1690 - RISC-V CSR output (merged 2021-03-07)](https://github.com/capstone-engine/capstone/pull/1690)
- [PR #2007 - RISCV instruction groups (merged 2023-06-10)](https://github.com/capstone-engine/capstone/pull/2007)
- [PR #2393 - Add access support for RISC-V (merged 2024-07-10)](https://github.com/capstone-engine/capstone/pull/2393)
- [PR #2498 - SAIL-based disassembler module (draft, closed 2025-11-09)](https://github.com/capstone-engine/capstone/pull/2498)
- [PR #2745 - Fix c.srli decoding (merged 2025-07-03)](https://github.com/capstone-engine/capstone/pull/2745)
- [PR #2756 - Refactoring RISCV architecture to Auto-Sync on LLVM (merged 2026-02-01)](https://github.com/capstone-engine/capstone/pull/2756)
- [PR #2859 - RISCV: Details: Fix ret groups (merged 2026-02-11)](https://github.com/capstone-engine/capstone/pull/2859)
- [PR #2860 - Fix spurious return groups for JALR ra (merged 2026-02-13)](https://github.com/capstone-engine/capstone/pull/2860)
- [PR #2869 - Introduce +noaliascompressed option (merged 2026-03-04)](https://github.com/capstone-engine/capstone/pull/2869)
- [PR #2881 - Fix stale values in detail struct (merged 2026-03-29)](https://github.com/capstone-engine/capstone/pull/2881)
- [PR #2891 - Fix RISCV aliases (merged 2026-04-10)](https://github.com/capstone-engine/capstone/pull/2891)
- [PR #2894 - Fix sysreg registers in RISC-V (merged 2026-04-15)](https://github.com/capstone-engine/capstone/pull/2894)
- [PR #2895 - RISC-V: add reg_access and test in C and Python (merged 2026-04-17)](https://github.com/capstone-engine/capstone/pull/2895)
- [PR #2897 - RISCV: Fix operand detection REAL/ALIAS (merged 2026-04-20)](https://github.com/capstone-engine/capstone/pull/2897)
- [PR #2904 - Update Java bindings and add cstest_java (WIP, open)](https://github.com/capstone-engine/capstone/pull/2904)
- [PR #2917 - RISCV: Ventana vendor missing in API (merged 2026-05-16)](https://github.com/capstone-engine/capstone/pull/2917)
- [PR #2959 - RISCV: compressed insn treats uncompressed as alias (open)](https://github.com/capstone-engine/capstone/pull/2959)
- [PR #2960 - Find writeback registers (merged 2026-06-13)](https://github.com/capstone-engine/capstone/pull/2960)
- [PR #2966 - Fix crash due to invalid register (merged 2026-06-20)](https://github.com/capstone-engine/capstone/pull/2966)
- [PR #2972 - Add frm operands to float/double instructions (merged 2026-06-23)](https://github.com/capstone-engine/capstone/pull/2972)
- [PR #2996 - Add compat behaviour for RISCVC/RISCV_C constant (merged 2026-07-18)](https://github.com/capstone-engine/capstone/pull/2996)
- [PR #3008 - Revamp flags for fine grained aliasing control (open, updated 2026-08-16)](https://github.com/capstone-engine/capstone/pull/3008)
- [Security Advisory GHSA-jrw4-wj52-2vw8 / CVE-2026-49282 - cs_insn_name OOB read](https://github.com/capstone-engine/capstone/security/advisories/GHSA-jrw4-wj52-2vw8)
- [Capstone GitHub repository](https://github.com/capstone-engine/capstone)
- [Capstone project homepage](https://www.capstone-engine.org/)
- [Ubuntu 24.04 capstone packages](https://packages.ubuntu.com/search?keywords=capstone&suite=noble&searchon=names&section=all)
- [Debian buildd capstone riscv64 status](https://buildd.debian.org/status/package.php?p=capstone)
- [Arch Linux RISC-V extra repository](https://archriscv.felixc.at/repo/extra/)
- [PyPI capstone package](https://pypi.org/pypi/capstone/json)
- [RISE Project blog - no capstone content confirmed](https://riseproject.dev/blog)
- [RISE announcement: RISC-V Runners on GitHub (2026-03-24)](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [tree-sitter issue #5458 - sdist builds missing parser.h on riscv64](https://github.com/tree-sitter/tree-sitter/issues/5458)