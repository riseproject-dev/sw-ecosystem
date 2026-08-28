---
title: mpact-riscv
parent: Project Reports
---

# mpact-riscv

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for mpact-riscv<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

mpact-riscv is a functional RISC-V instruction-set simulator (ISS) built atop Google's [MPACT-Sim](https://github.com/google/mpact-sim) framework. The entire repository is RISC-V by design: there is no prior multi-architecture history; the first substantive commit on 2023-03-06 created a RISC-V simulator from scratch. The project simulates RISC-V guest code while itself running on x86-64 or ARM64 host machines.

**License:** Apache-2.0.

**Governance:** Informal. No MAINTAINERS, OWNERS, or CODEOWNERS file exists. All contributions require a Google CLA. The project is effectively a Google-internal project mirrored to GitHub via Copybara (all commits contain `PiperOrigin-RevId` tags confirming internal origin).

**Primary maintainer:** Tor Jeremiassen (GitHub: torj9n, Google LLC) - 209 of 214 commits. Secondary: Cindy Liu (GitHub: hcindyl, Google) - 3 commits in early 2023. Two external contributors have merged one commit each (Akihiko Odaki: template specialization fix, January 2025; Liam Miller-Cushon: one commit). The maintainer responds to external bug reports within days and has closed all correctness bugs raised by CircuitSutra Technologies (India), demonstrating willingness to support external users.

**RISE relationship:** Google LLC is a RISE Premier Member. mpact-riscv is not listed as a funded RISE RFP project. Tor Jeremiassen and Yenkai Wang (both Google) presented MPACT tooling at RISC-V Summit Europe 2026, covered in a [RISE blog post](https://riseproject.dev/2026/06/26/industry-cooperation-takes-center-stage-at-risc-v-summit-europe-2026/). No quantitative data was published in that post. mpact-riscv does not appear in the RISE wheel builder package list.

**Last repository update:** 2026-07-29 (per GitHub metadata). Most recent commit: `949e6453f7` (2026-06-15, "Updating riscv repo" - internal Google sync).

---

## 2. Port History and Upstreaming Timeline

mpact-riscv is not a port of an existing multi-architecture tool. It was created as a RISC-V simulator from day one. The question of "upstreaming" does not apply. The relevant history tracks ISA coverage expansion and correctness.

| Date | Event | Source |
|------|-------|--------|
| 2023-02-28 | Repository created on GitHub ("Initial empty repository"), Tor Jeremiassen (Google) | [github.com/google/mpact-riscv](https://github.com/google/mpact-riscv) |
| 2023-03-06 | First substantive commit: "Initial commit for MPACT-Sim based RiscV model." | git log |
| 2023-03-31 | Repository made public on GitHub | git log |
| 2023-04-18 | Release 0.0.1 (source tarball only, no binary assets) | [GitHub Releases](https://api.github.com/repos/google/mpact-riscv/releases) |
| 2023-04-24 | Release 0.0.2 | [GitHub Releases](https://api.github.com/repos/google/mpact-riscv/releases) |
| 2023-05-08 | Release 0.0.3 (most recent tagged release) | [GitHub Releases](https://api.github.com/repos/google/mpact-riscv/releases) |
| 2025-08-27 | Major refactor: split RV32G extensions; added Zve32x vector subset (`6f47655376`) | git log |
| 2025-10-13 | Fixed ELF LMA/VMA loader bug and interrupt EPC ordering bug (issues #11 and #12, commit `a793073d78`) | [Issue #11](https://github.com/google/mpact-riscv/issues/11), [Issue #12](https://github.com/google/mpact-riscv/issues/12) |
| 2025-10-23 | Fixed MIP/MIE CSRs hardcoded to 32-bit (issue #13, commit `3c6634d15f`) | [Issue #13](https://github.com/google/mpact-riscv/issues/13) |
| 2025-11-03 | Added RVA23 compliance: exceptions on C-extension decode when C bit not set in MISA (`8e88ee0cc5`) | git log |
| 2025-11-06 | Added Zihpm CSRs (non-functional stubs) for RVA23 (`d5dd094962`) | git log |
| 2026-01-29 | Fixed minstret/counter CSR bugs, JAL/JALR misalignment trap, vrsub.vi wrong destination | git log |
| 2026-03-05 | Fixed integer overflow in widening addition | git log |
| 2026-04-30 | Added `-O3` globally to all `cc_binary` and `cc_library` build targets [NEEDS VERIFICATION] | git log |
| 2026-05-21 | Fixed vector segment load incorrect when lmul > 1 (`98769f48`) | git log |
| 2026-06-15 | Most recent commit: internal Google sync (`949e6453f7`) | git log |

---

## 3. Upstream Support Tier

No formal tier policy exists. The project is a single-ISA RISC-V simulator with no concept of architecture ports. The relevant framing is whether the simulator can be built and run on a riscv64 host machine.

| Dimension | amd64 (x86-64) | arm64 (AArch64 / Apple M-series) | riscv64 |
|-----------|---------------|----------------------------------|---------|
| CI exists | Yes (ubuntu-22.04) | No | No |
| Release binary | No (source only) | No (source only) | No (source only) |
| Build documented | Yes (`bazel build //...`) | Yes (`bazel build --cpu=darwin_arm64 //...`) | No documentation |
| Host FP bridging code | Yes (`riscv_fp_host_x86.cc`) | Yes (`riscv_fp_host_arm.cc`) | Missing (no `riscv_fp_host_riscv.cc`) |
| Bazel config_setting | Default (//conditions:default) | arm_cpu, aarch64, darwin_arm64_cpu | Not defined |

amd64 is the only fully supported host platform. arm64 has documented build instructions and a host FP implementation but no CI. riscv64 has neither: no host FP implementation, no Bazel config_setting, and no build documentation. A riscv64 host build falls through to the x86 default, which will fail at compile time due to x86-specific MXCSR inline assembly.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

mpact-riscv implements the RISC-V ISA in portable C++17 with no JIT backend, no SIMD library dependencies, and no host-side RVV intrinsics. There are no `.S` assembly files. Architecture selection for the host is purely a Bazel build-time concern affecting only the floating-point status register bridging layer.

**Simulated ISA coverage (the simulator's target, not the host):**

| Extension | Files | Status |
|-----------|-------|--------|
| RV32I / RV64I | `riscv_i_instructions.{cc,h}`, `riscv32g.isa`, `riscv64g.isa` | Full |
| RV32M / RV64M | `riscv_m_instructions.{cc,h}` | Full |
| RV32A / RV64A | `riscv_a_instructions.{cc,h}` | Full (LR/SC reservation set implemented) |
| RV32F / RV64F | `riscv_f_instructions.{cc,h}` | Full |
| RV32D / RV64D | `riscv_d_instructions.{cc,h}` | Full |
| RV32C / RV64C | Encoded in Zca slots in `riscv_zc.isa` | Full |
| V (RVV) | `riscv_vector_opi_instructions.{cc,h}` (51 KB), `riscv_vector_opm_instructions.{cc,h}` (53 KB), `riscv_vector_memory_instructions.{cc,h}` (54 KB), `riscv_vector_fp_instructions.{cc,h}` (30 KB), plus 7 more files | Full (with correctness bugs fixed through May 2026; see Section 11) |
| Zba / Zbb / Zbc / Zbs | `riscv_bitmanip_instructions.{cc,h}`, `riscv32zb.isa`, `riscv64zb.isa` | Full (both RV32 and RV64) |
| Zvbb | `riscv_vector_basic_bit_manipulation_instructions.{cc,h}`, `zvbb_encoding.{cc,h}` | Full (vandn, vbrev8, vrev8, vrol, vror, vclz, vctz, vcpop, vwsll) |
| Zfh | `riscv_zfh_instructions.{cc,h}`, `riscv_zfh32.bin_fmt`, `riscv_zfh64.bin_fmt` | Full (half-precision FP, both RV32/RV64; correctness bugs fixed May 2025) |
| Zca / Zcb / Zcf / Zcmp / Zcmt | `riscv_zc.isa`, `riscv_zc_instructions.{cc,h}` | Full |
| Zicsr | `riscv_zicsr_instructions.{cc,h}`, `riscv_csr.{cc,h}` | Full |
| Zifencei | `riscv_zfencei_instructions.{cc,h}` | Full |
| Zicond | `riscv_zicond_instructions.{cc,h}` | Full |
| Zimop / Zcmop | `riscv_zimop_instructions.{cc,h}` | Full |
| Zicbop | `riscv_zicbop_instructions.{cc,h}` | Full |
| Zhintpause | `riscv_zhintpause_instructions.{cc,h}` | Full |
| Zihintntl | `riscv_zihintntl_instructions.{cc,h}` | Full |
| Zve32x | Included as vector subset | Full |
| Privileged (M-mode, S-mode) | `riscv_priv_instructions.{cc,h}`, `riscv_misa.{cc,h}`, `riscv_xstatus.{cc,h}`, `riscv_xip_xie.{cc,h}`, `riscv_pmp.h` | Partial: MRET/SRET complete; URET stub (empty body); all four `sfence.vma` variants stub (no MMU model) |
| Zihpm (perf counters) | `riscv_counter_csr.h` (partial) | Partial: CSRs present but commit `d5dd094962` explicitly describes them as "non-functional stubs" |
| CLINT / PLIC | `riscv_clint.{cc,h}`, `riscv_plic.{cc,h}` | Full |

**Host-architecture-specific code (affects the simulator's ability to run on a given host):**

| Component | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| Host FP status bridging | `riscv_fp_host_x86.cc` (MXCSR inline asm) - full | `riscv_fp_host_arm.cc` (FPCR/FPSR inline asm) - full | Missing: no file, no Bazel config_setting |
| JIT backend | None - N/A | None - N/A | None - N/A |
| SIMD usage | None - N/A | None - N/A | None - N/A |
| Assembly files | None | None | None |

The host FP bridging gap is the only architecture-specific code gap for riscv64. It is not optional: the bridging layer is linked into every simulator binary and is required for correct FCSR (floating-point control/status register) semantics when executing floating-point instructions in the simulator.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel exclusively. No CMake, no autoconf, no Meson. Version pinned to 8.6.0 via `.bazelversion` and `.bazeliskrc`.

**Compiler requirement:** Clang is mandated via `.bazelrc`:
```
build --action_env=CC="clang"
build --action_env=BAZEL_CXXOPTS="-std=c++17"
build --cxxopt="-std=c++17"
build --cxxopt=-include --cxxopt=cstdint
```
The `--cxxopt=-include --cxxopt=cstdint` is a workaround for `uintptr_t` availability required by Abseil and other dependencies.

**Standard build (x86-64 Linux):**
```
bazel build //...
bazel test //...
```

**ARM64 / Apple M-series build:**
```
bazel build --cpu=darwin_arm64 //...
bazel test --cpu=darwin_arm64 //...
```

**riscv64 build:** No procedure documented. No cross-compilation toolchain files. No `.bazelrc` platform flags for riscv64. No Dockerfile. No QEMU integration. The Bazel `riscv/BUILD` file defines `config_setting` blocks for `arm_cpu`, `aarch64`, and `darwin_arm64_cpu` but none for riscv64. A riscv64 native build will fail because `riscv_fp_host_x86.cc` (the default fallback) contains x86-specific MXCSR inline assembly that will not compile under a RISC-V toolchain.

**QEMU usage in CI:** None. The CI builds the host-side C++ simulator binary on x86-64; it does not execute riscv64 binaries under QEMU.

**Known build issues for riscv64:**
- `riscv_fp_host_x86.cc` will fail to compile on a riscv64 host with any standard toolchain.
- Abseil-cpp 20240116.2 (a mandatory dependency) has a known linker error on riscv64 cross-compilation with GCC < 12 toolchains: missing `__atomic_compare_exchange_1`, requiring explicit `-latomic` linkage. See [abseil-cpp issue #1702](https://github.com/abseil/abseil-cpp/issues/1702).

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

The simulated RISC-V instruction set (what the ISS can execute as guest code) is effectively equal across all three host platforms at the software level. The differences are in host-side support.

**Functional gaps (host = riscv64):**

| Gap | Severity | Notes |
|-----|----------|-------|
| No `riscv_fp_host_riscv.cc` | Blocking | Build fails; FP semantics would be incorrect even if patched around |
| No Bazel `config_setting` for riscv64 host | Blocking (build) | Requires a new `config_setting` and `select()` arm in `riscv/BUILD` |
| No riscv64 CI | Process gap | Any riscv64 host regression is undetectable |

**Simulated ISA gaps (applicable regardless of host):**

| Gap | Severity | Notes |
|-----|----------|-------|
| URET (user-mode trap return) | Low | Empty body; rarely exercised; not in RVA23 mandatory set |
| sfence.vma (all four variants) | Low for most workloads | No MMU model; TLB shootdown is a no-op; acceptable for flat-memory simulations |
| Zihpm performance counters | Low | CSR registers present but reads return fixed values; explicit "non-functional stubs" in commit message `d5dd094962` |

**Floating-point semantics:** The Zfh (half-precision) correctness bugs - double-to-half conversion, NaN-boxing in `fmv.h.x`, wrong XLEN handling, incorrect `fmin`/`fmax` rounding mode usage - were all fixed in commits from May 2025 (`5b28dd7c`, `97cf02d3`). No open FP correctness issues remain.

**Performance gap:** No benchmark data exists anywhere in the research. Data not available: simulation speed in MIPS or instructions-per-second; comparison versus Spike, QEMU, or gem5; before/after numbers for the `-O3` global optimization flag added 2026-04-30.

---

## 7. CI/CD Infrastructure

The repository contains exactly one CI configuration file: [`.github/workflows/test_build.yml`](https://github.com/google/mpact-riscv/blob/main/.github/workflows/test_build.yml).

- Triggers: `pull_request` and `workflow_dispatch` only. No `push` trigger, no scheduled run, no tag trigger.
- Runner: `ubuntu-22.04` (GitHub-hosted, x86-64). No arm runner, no self-hosted runner.
- Single job `bazel_build_test`: runs `bazel build //...` then `bazel test //...`.
- No QEMU invocation. No `--platforms` or `--cpu` flags targeting riscv64. No cross-compilation. The string "riscv" does not appear in the CI YAML at all.

The CI builds and tests the simulator's C++ source code on x86-64. It confirms the simulator compiles and its test suite passes on that host. It does not confirm that the simulator can be built or run on riscv64 hardware.

| Dimension | amd64 | arm64 | riscv64 |
|-----------|-------|-------|---------|
| CI exists | Yes | No | No |
| Build tested | Yes | No | No |
| Tests run | Yes | No | No |
| Trigger | PR + manual | - | - |
| Runner | ubuntu-22.04 (GH-hosted) | - | - |
| RISE-provided runner | No | - | - |
| QEMU in CI | No | - | - |

---

## 8. Distribution and Release Status

Three GitHub releases exist: [0.0.1](https://api.github.com/repos/google/mpact-riscv/releases) (2023-04-18), 0.0.2 (2023-04-24), 0.0.3 (2023-05-08). All three have an empty `assets` array - no binary attachments. Release artifacts are the source tarballs and zip archives that GitHub generates automatically for every tag.

| Distribution channel | Status |
|----------------------|--------|
| GitHub Releases (binary) | Not present (source-only, zero uploaded assets in all 3 releases) |
| PyPI | Not present (HTTP 404 at pypi.org/pypi/mpact-riscv/json) |
| RISE wheel builder | Not present (redirect to PyPI 404) |
| Debian | Not present (HTTP 404 at tracker.debian.org/pkg/mpact-riscv) |
| Ubuntu 24.04 (Noble) | Not present ("no results" at packages.ubuntu.com) |
| Arch Linux RISC-V | Not present (no results at archriscv.felixc.at) |

To obtain a working binary on any platform, a user must build from source using Bazel. On riscv64, the build fails due to missing host FP code (see Section 5).

---

## 9. Dependencies

| Dependency | Version | Role | riscv64 Build | riscv64 Test CI | riscv64 Release | Blocking Issues |
|---|---|---|---|---|---|---|
| mpact-sim | 1.0.2 | Core simulation framework (memory models, operand dispatch, decoder tables) | Untested (source-only, no cross-compile CI) | None | No releases at all (no tags) | No riscv64-specific issues filed |
| abseil-cpp | 20240116.2 | Base C++ utilities: containers, hash tables, strings, logging, sync | Builds with caveats (see below) | None | Debian/Ubuntu ships riscv64 .deb | [Issue #1702](https://github.com/abseil/abseil-cpp/issues/1702) (linker error with Bootlin riscv64 cross-toolchain, missing libatomic); [Issue #2002](https://github.com/abseil/abseil-cpp/issues/2002) (SEGFAULT in hashtablez_sampler_test and cordz_sample_token_test on riscv64-linux-gnu with 20260107.0) |
| protobuf | 29.0 | Serialization for debug/trace data | Builds (riscv64 support merged, [issue #12266](https://github.com/protocolbuffers/protobuf/issues/12266) closed 2024-03-05) | None | No prebuilt protoc for riscv64 ([issue #17798](https://github.com/protocolbuffers/protobuf/issues/17798) closed/wontfix) | Must build protoc from source on riscv64 host |
| googletest | 1.14.0.bcr.1 | Test framework (build-time only) | Builds | None | Debian/Ubuntu ships riscv64 package | [Issue #3756](https://github.com/google/googletest/issues/3756): `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 (returns 0); test-only, no runtime impact |
| RE2 | 2023-11-01 | Regular-expression matching in decoder/disassembler | Clean (pure C++, no arch code) | None | Debian/Ubuntu ships riscv64 package | None |
| ELFIO | 3.12 (non-module dep) | Header-only ELF file reader for loading RISC-V ELF binaries | Clean (header-only, zero arch code) | None | Header-only, no binary needed | None |
| ANTLR4 C++ Runtime | 4.13.1 (non-module dep) | Parser runtime for mpact-sim's ISA description language | Builds (pure C++, no arch SIMD) | None | No riscv64 binary; tool is JVM jar (OpenJDK ships riscv64 support) | Build-time only; not linked into simulator binaries |
| linenoise | 2.0.0 | CLI readline for interactive debug shell | Clean (pure C, no arch code) | None | No binary | None |
| bazel_skylib / rules_cc / rules_license | Various | Bazel build infrastructure | Bazel 7+ supports riscv64 cross-compile via `--platforms` | N/A | N/A | Not blockers; cross-compile config must be added to `.bazelrc` |

**Abseil detail (most significant dependency concern):** Issue #1702 requires explicitly linking `-latomic` when using GCC < 12 riscv toolchains because `__atomic_compare_exchange_1` is not inlined. GCC 13+ toolchains inline the operation and are unaffected. Issue #2002 is an unresolved SEGFAULT in Abseil's own test suite on current Debian riscv64 with release 20260107.0; this has not been reproduced against the pinned version 20240116.2 used by mpact-riscv. [NEEDS VERIFICATION: whether issue #2002 affects 20240116.2 specifically.]

---

## 11. Known Bugs and Active Issues

**Open issues (2 total):**

| ID | Title | Status | Severity | Notes |
|----|-------|--------|----------|-------|
| [#5](https://github.com/google/mpact-riscv/issues/5) | Security Policy violation: Binary Artifacts | Open since 2023-06-01 | Low (compliance) | Allstar/OpenSSF bot flagging committed ELF test binaries (`hello_world_64.elf`, `hello_world_arm.elf`, etc.). 67 automated bot pings. No human response in 3+ years. Not a correctness or security exploit - the files are test inputs, not production artifacts. |
| [#9](https://github.com/google/mpact-riscv/pull/9) | Remove riscv/ prefix from bin_fmt and isa includes | Open PR since 2025-01-22 | Low (usability) | Build/include-path fix for nested-repo builds. Currently in "dirty" state (merge conflict). No reviewer assigned. Maintainer expressed concern about the approach in Jan 2025; no resolution since. Users embedding mpact-riscv as a Bazel dependency in another repo encounter broken include paths. |

**Closed correctness bugs (selected, from commit log):**

| Date | Commit | Bug |
|------|--------|-----|
| 2026-05-21 | `98769f48` | Vector segment load incorrect when lmul > 1 |
| 2026-03-11 | `dc18e39c` | vlm.v / vsm.v ignored vl and vstart; could store/load wrong byte count |
| 2026-03-05/06 | `f4b42c9e` / `7d0cc327` | Integer overflow in widening addition (two-step fix) |
| 2026-01-29 | `2b2fa932` | minstret CSR incorrectly incremented on exceptions |
| 2026-01-29 | `c619818d` | JAL/JALR missing misalignment trap when C extension disabled (RV64 only) |
| 2026-01-29 | `df3dfc0e` | Counter CSRs incorrect after write (instruction increment compensation wrong) |
| 2026-01-29 | `40f07c01` | vrsub.vi had wrong destination operand |
| 2025-12-16 | `10dd8f1a` | Narrowing fp/int conversion: SEW set to source width instead of destination width |
| 2025-12-12 | `7dcd85b6` | Race condition under multi-threaded simulator use |
| 2025-12-10 | `336067a7` | Branch/jump target alignment checks missing; exceptions not generated |
| 2025-10-23 | `3c6634d1` | MIP/MIE CSRs hardcoded 32-bit; shift-by-32 UB; missed `CheckForInterrupt()` on `Set(uint64_t)` path (issue #13) |
| 2025-10-13 | `a793073d` | ELF loader LMA/VMA ordering (issue #11); interrupt EPC set to wrong PC after branch (issue #12) |
| 2025-05-09 | `5b28dd7c` | Zfh: double-to-half conversion wrong when cast+round; fflags wrong for inf/0; fmin/fmax used wrong rounding mode |
| 2025-05-16 | `97cf02d3` | Zfh: fmv.h.x missing NaN-boxing; XLEN 32 vs 64 handling wrong |

The fix record reveals a pattern: RVV (vector) instruction semantics have had multiple correctness bugs corrected through 2025-2026, including segment load semantics, vl/vstart handling, widening operations, and destination operand selection. Zfh had two rounds of bug fixes in May 2025. CSR semantics had several bugs corrected in late 2025. All are fixed and closed; no open correctness bugs are tracked.

---

## 12. Objections and Upstream Blockers

**Technical blockers for riscv64 host support:**

1. **Missing `riscv_fp_host_riscv.cc`:** The FP status register bridging layer that maps host-CPU FP exceptions and rounding modes to RISC-V FCSR does not exist for RISC-V hosts. This is a concrete, defined gap with clear scope. The x86 equivalent is 14 KB, the ARM equivalent is 12 KB. The RISC-V equivalent would use the `fcsr` CSR (read/written via `frcsr`/`fscsr` pseudo-instructions) and map the `fflags` and `frm` fields.

2. **Abseil-cpp atomics on older riscv64 toolchains:** Linking `-latomic` is required with GCC < 12. Ubuntu 24.04 ships GCC 13 by default; this blocker is not present on current distributions.

**Organizational blockers:**

- All substantive development is by one engineer (Tor Jeremiassen, Google). External PRs are reviewed but rare (one merged in 2+ years). A riscv64 host support contribution from outside Google would require coordinating with a single Google engineer who responds promptly but reviews on his own schedule.
- PR #9 has been stalled since January 2025 with no resolution, indicating that even small build-system patches can remain unmerged for extended periods if the maintainer has concerns about the approach.

**No stated objections to riscv64 host support:** No issue or discussion on the tracker opposes riscv64 host builds. The gap exists because no one has done the work, not because the project has declined it.

**Acceptance probability:** High. The project has Apache-2.0 license, a CLA process, and a responsive maintainer who has merged external contributions. A well-structured PR adding `riscv_fp_host_riscv.cc` and the corresponding Bazel `config_setting` would likely be accepted.

---

## 13. Investment Analysis

RISE has not funded or directly contributed to mpact-riscv beyond Google's membership. No work in this area is already covered.

The project does not need to be ported to riscv64 to simulate RISC-V programs - it already does that on x86-64 and arm64 hosts. The investment case is specifically for running the simulator on riscv64 host hardware (for cross-validation, pre-silicon testing workflows on RISC-V development boards, and closed-loop hardware-software co-design on RISC-V targets).

### 13.1 Functional Enablement

The blocking work is:
- Write `riscv/riscv_fp_host_riscv.cc` implementing `RiscVFPHostInterface` using RISC-V `frcsr`/`fscsr` instructions to read and write FCSR. Scope: ~10-15 KB, same structure as the x86 and ARM files.
- Add a `riscv64` `config_setting` to `riscv/BUILD` and wire it into the `select()` for the FP host file.
- Validate the build with Clang targeting riscv64-linux-gnu (Ubuntu 24.04 riscv64 container or QEMU system emulation).

### 13.2 Performance Optimization

Data not available: no benchmark numbers exist. No MIPS figures, no comparison with Spike or QEMU. A performance baseline must be established before optimization work can be scoped. The `-O3` addition in April 2026 may already have addressed the most tractable throughput gap. Additional JIT or translation-caching work would require upstreaming an architectural change to the MPACT-Sim framework itself, not just mpact-riscv.

### 13.3 CI/CD Infrastructure

Adding riscv64 CI requires either a self-hosted RISC-V runner or QEMU user-mode emulation within the existing ubuntu-22.04 runner. The build must first succeed (Section 13.1). Once it does, a QEMU-based CI job can be added to `.github/workflows/test_build.yml` with modest effort. RISE infrastructure for riscv64 CI runners would reduce the per-project overhead.

### 13.4 Ecosystem Enablement

Not applicable. mpact-riscv is a standalone C++ simulator with no dependent package ecosystem (no Python bindings, no npm packages, no Maven JARs). Section 10 is omitted.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|------|-----------|----------------------|-------|----------|
| Functional | Write `riscv_fp_host_riscv.cc` + Bazel config_setting for riscv64 host | 1 | External contributor or Google | Critical |
| Functional | Validate build on riscv64 host (container or QEMU system) | 0.5 | External contributor | Critical |
| CI/CD | Add riscv64 CI job (QEMU user-mode or self-hosted runner) | 1 | External contributor | High |
| Functional | Implement Zihpm (hardware perf counters) - currently non-functional stubs | 3-4 | Google or external | Medium |
| Functional | Implement sfence.vma (requires adding MMU model) | 6-10 | Google | Low (most workloads do not need MMU simulation) |
| Functional | Implement URET (user-mode trap return) | 0.5 | External contributor | Low |
| Functional | Resolve PR #9 (nested repo include path fix) | 0.5 | External contributor + Tor Jeremiassen review | Low |

Total critical path to riscv64 host functionality: ~2.5 person-weeks. This is a low-investment engagement with a high probability of acceptance and clear deliverables.

---

## 14. Updates

No updates yet - initial report dated 2026-08-14.

---

## 15. References

- [google/mpact-riscv repository](https://github.com/google/mpact-riscv)
- [google/mpact-sim repository](https://github.com/google/mpact-sim)
- [Issue #5: Security Policy violation Binary Artifacts](https://github.com/google/mpact-riscv/issues/5)
- [Issue #11: ELF segment loading LMA/VMA](https://github.com/google/mpact-riscv/issues/11)
- [Issue #12: Interrupt handling EPC positioning](https://github.com/google/mpact-riscv/issues/12)
- [Issue #13: MIP/MIE hardcoded 32-bit](https://github.com/google/mpact-riscv/issues/13)
- [PR #9: Remove riscv/ prefix from bin_fmt and isa includes](https://github.com/google/mpact-riscv/pull/9)
- [Commit a793073d78: Fix github issues 11 and 12](https://github.com/google/mpact-riscv/commit/a793073d785da6ceb1fd16bc317b43ecf2fc89fb)
- [Commit 3c6634d15f: Make *ie and *ip registers 64 bit CSRs](https://github.com/google/mpact-riscv/commit/3c6634d15fe3e082c5ae4a4c313dd9bab4033e09)
- [Commit 8e88ee0cc5: RVA23 MISA C-bit exception on decode](https://github.com/google/mpact-riscv/commit/8e88ee0cc5400333351c92be69224e640b1b394a)
- [Commit d5dd094962: RVA23 Zihpm CSRs](https://github.com/google/mpact-riscv/commit/d5dd094962af7dc63053e15b65e60c604989e83f)
- [Commit 6f47655376: Refactor mpact-riscv, add Zve32x](https://github.com/google/mpact-riscv/commit/6f4765537634fb27066fdcb9fd47fc75d405e8ad)
- [GitHub Releases API for mpact-riscv](https://api.github.com/repos/google/mpact-riscv/releases?per_page=5)
- [abseil-cpp issue #1702: riscv64 cross-compile linker error](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp issue #2002: SEGFAULT on riscv64-linux-gnu](https://github.com/abseil/abseil-cpp/issues/2002)
- [protobuf issue #12266: riscv64 build failure (closed)](https://github.com/protocolbuffers/protobuf/issues/12266)
- [protobuf issue #17798: no prebuilt protoc for riscv64 (wontfix)](https://github.com/protocolbuffers/protobuf/issues/17798)
- [googletest issue #3756: GetThreadCount returns 0 on riscv64](https://github.com/google/googletest/issues/3756)
- [RISE blog: RISC-V Summit Europe 2026 - MPACT mention](https://riseproject.dev/2026/06/26/industry-cooperation-takes-center-stage-at-risc-v-summit-europe-2026/)
- [RISE Project member list](https://riseproject.dev/members/)
- [RISE wheel builder package list](https://riseproject.gitlab.io/python/wheel_builder/)