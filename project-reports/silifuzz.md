---
title: silifuzz
parent: Project Reports
---

# silifuzz

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-08-14<br/>
**Scope:** RISC-V (riscv64/linux) support status for silifuzz<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

SiliFuzz is a hardware fuzzer that stresses CPUs and memory subsystems by running randomized or corpus-driven instruction sequences and comparing execution snapshots across hardware units or time. Its stated goal is catching silicon bugs, manufacturing defects, and compiler mis-optimizations that manifest as divergent CPU behavior. Known trophies include CVE-2021-26339 (AMD), AMD Errata 1386 and 1468, ARM Neoverse V2 Erratum 3442699, and ARM Cortex-X3 Erratum 3213672.

Repository: [github.com/google/silifuzz](https://github.com/google/silifuzz). License: Apache-2.0.

**Governance:** SiliFuzz is a Google-internal project published as open source via a Piper-to-GitHub mirror. All commits carry `PiperOrigin-RevId` trailers. Google LLC is the sole entity listed in AUTHORS. Top contributors by commit count are Nick Bray (316 commits), Doug Kwan (176 commits, confirmed Google Inc.), Kay Sharp (54), Sarah Gwin (47), and Han Yang Tay (40). There is no OWNERS, MAINTAINERS, or CODEOWNERS file. No formal governance document exists.

**Stance on external contributions:** [CONTRIBUTING.md](https://github.com/google/silifuzz/blob/main/CONTRIBUTING.md) states verbatim: "We are not yet accepting external contributions at this time." This has been in place since the repository was created on 2022-01-05 and has not changed. There is no community port pathway.

**Supported architectures:** The README states explicitly: "SiliFuzz runs on x86_64 and aarch64 Linux systems." This matches the source-level architecture enum. RISC-V is not mentioned anywhere in the codebase.

**RISE membership:** Google LLC is a Premier Member of the RISE Project but has not funded or published any SiliFuzz-related RISC-V work through RISE.

---

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2022-01-05 | Repository created. x86_64 and aarch64 supported from day one. | [github.com/google/silifuzz](https://github.com/google/silifuzz) |
| 2026-08-14 | Zero RISC-V commits, issues, PRs, or files. No port has been initiated. | Exhaustive search: 15 separate queries, all returning 0 results |

No RISC-V port has ever been started. No first commit date, no contributor, no tracking issue exists. The only text in the entire repository touching the word "RISC" is a single comment in `runner/snap_runner_util.h` reading "For RISC architectures, function calls usually..." -- a generic CPU architecture observation, not RISC-V-specific code.

---

## 3. Upstream Support Tier

SiliFuzz has no formal tier or platform support policy. There is no PLATFORMS.md, SUPPORT.md, or equivalent. The project releases no binaries and publishes no release tags. Support is inferred entirely from CI coverage and source-level architecture guards.

| Criterion | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Architecture enum entry | Yes (`kX86_64 = 1`) | Yes (`kAArch64 = 2`) | No (compile-time `#error`) |
| CI coverage | Yes (Kokoro, native) | No | No |
| Official binary releases | No (project ships no binaries) | No | No |
| README listed | Yes | Yes | No |
| Runner subdirectory | Yes (`runner/x86_64/`) | Yes (`runner/aarch64/`) | No |
| Snapshot subdirectory | Yes (`snap/x86_64/`) | Yes (`snap/aarch64/`) | No |
| Platform ID mapping | Yes (Intel and AMD entries) | Yes (Neoverse, AmpereOne entries) | No |

amd64 is the only actively tested architecture. arm64 is supported at the source level but has no CI. riscv64 is excluded at the source level.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

SiliFuzz consists of six major architecture-specific layers. Every one of them is absent for riscv64.

**4.1 Architecture type system (`util/arch.h`)**

```cpp
enum class ArchitectureId {
  kUndefined = 0,
  kX86_64 = 1,
  kAArch64 = 2,
};
#define ALL_ARCH_TYPES X86_64, AArch64
#if defined(__x86_64__)
using Host = X86_64;
#elif defined(__aarch64__)
using Host = AArch64;
#else
#error "Unsupported architecture"
#endif
```

No `kRiscV64` entry. The `ARCH_DISPATCH` macro switches on two cases. Compilation on a riscv64 host fails at this header before any other translation unit is reached.

**4.2 User-context save and restore (`util/ucontext/`)**

Hand-written assembly for register save/restore, signal widget generation, and snap exit sequences. Approximately 13 files for x86_64, 14 for aarch64, 0 for riscv64. No `riscv64/` subdirectory exists.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| ucontext save/restore (.S) | Hand-tuned assembly | Hand-tuned assembly | Missing |
| Signal delivery widgets | Present | Present | Missing |
| Snap exit sequence | Present | Present | Missing |

**4.3 Register groups and SIMD state (`util/`)**

x86_64 register groups cover XMM, YMM, ZMM (AVX-512), opmask registers. aarch64 register groups cover NEON and SVE. There are no register group definitions for RISC-V V extension (RVV) or F/D/Q floating-point extensions.

| SIMD/extension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Baseline integer regs | Full | Full | Missing |
| Vector registers | AVX-512 (hand-tuned .S) | SVE (hand-tuned .S) | Missing (no RVV) |
| Floating-point state | x87 + SSE | NEON | Missing (no F/D/Q) |
| Clear-state sequence | Present | Present | Missing |

**4.4 Platform ID mapping (`util/platform.h`)**

The `PlatformId` enum lists 24 named microarchitectures: Intel Skylake through Sapphire Rapids, AMD Zen 1 through Zen 4, ARM Neoverse V1/V2/N1, AmpereOne. Reserved slots 16-40 and 48 are unused. No RISC-V microarchitecture entry exists (not SiFive P870, not T-Head C908, not Spacemit X60, not any other).

**4.5 Snapshot runner (`runner/`)**

Architecture-specific runner entry points, trap handlers, and memory mapping code. `runner/x86_64/` (5 files), `runner/aarch64/` (5 files), `runner/riscv64/` does not exist.

**4.6 Instruction disassembler and static filter (`instruction/`)**

| Backend | Architecture | riscv64 |
|---|---|---|
| Intel XED (`xed_disassembler.cc`) | x86_64 only | Not applicable |
| Capstone (`capstone_disassembler.cc`) | x86_64 and aarch64 mode | No riscv64 Capstone mode configured |

Capstone itself supports RISC-V (with known accuracy gaps -- see Section 9), but SiliFuzz's Capstone wrapper has explicit specializations only for `X86_64` and `AArch64`. Adding RISC-V would require a new `InstructionCanBranch<RISCV64>` specialization, a new disassembler mode enum entry, and integration with the static instruction filter.

**4.7 Instruction fuzzer and mutator (`fuzzer/`)**

`program_x86_64.cc` and `program_aarch64.cc` exist. No `program_riscv64.cc`. The `hashtest_generator` tool comments explicitly: "Currently only x86_64 is supported."

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel only. No CMakeLists.txt exists anywhere in the repository.

**Required Bazel version:** 8.6.0 (pinned in `.bazelversion`).

**Required compiler:** Clang 18 or newer (stated in `install_build_dependencies.sh`). GCC is not supported; the project uses Clang-specific sanitizer runtimes and link-time optimization flags.

**Key `.bazelrc` flags:**
- `--client_env=CC=clang`
- `--cxxopt=-std=c++20`
- `--copt=-march=haswell` -- x86-specific, required because the Unicorn v2 proxy requires the `CX16` instruction (CMPXCHG16B). This flag makes the build explicitly x86-only at the compiler level.
- `--linkopt -fuse-ld=lld`
- `-U_FORTIFY_SOURCE` (required for nolibc runner builds)

**CI execution:** Kokoro CI runs `docker run --security-opt seccomp=unconfined ubuntu:noble` with a native amd64 toolchain. No cross-compilation toolchain, no QEMU invocation, no `--platforms=//build_defs/platform:riscv64` target defined.

**riscv64 cross-compilation status:** Not possible in the current tree. `install_build_dependencies.sh` installs `amd64`-only Bazel apt sources. No `WORKSPACE` or `MODULE.bazel` entry configures a riscv64 C++ toolchain. No `BUILD` file in `build_defs/platform/` defines a riscv64 platform config setting (only `x86_64` and `aarch64` are defined). A riscv64 build would require at minimum: a riscv64 Clang/LLD cross-toolchain entry in `WORKSPACE`, a new platform config in `build_defs/platform/BUILD`, the `ArchitectureId::kRiscV64` enum entry, and all assembly implementations listed in Section 4.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Compiles from source | Yes | Yes | No (compile-time `#error`) |
| Snapshot capture | Yes | Yes | Missing |
| Snapshot replay | Yes | Yes | Missing |
| Corpus-based fuzzing | Yes | Yes | Missing |
| Instruction-level disassembly | Yes (XED + Capstone) | Yes (Capstone) | Missing |
| Static instruction filter | Yes | Yes | Missing |
| Hardware counter proxy (libpfm4) | Yes | Yes | Missing (no RISC-V PMU tables in libpfm4; SBI PMU extension required) |
| Platform ID for microarch targeting | Yes (Intel/AMD SKUs) | Yes (Neoverse/AmpereOne) | Missing |
| Hashtest generator | Yes | No | No |
| SVE/AVX-512 register fuzzing | AVX-512 full | SVE full | No RVV |
| CI execution | Yes (Kokoro) | No | No |

The gap between riscv64 and arm64 is not a performance gap -- it is a complete absence. There is no scalar fallback, no stub, no partial port. riscv64 cannot be reached at any execution path because the build fails before linking.

---

## 7. CI/CD Infrastructure

| Attribute | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI system | Kokoro (Google) | None | None |
| GitHub Actions | None | None | None |
| Native hardware runner | Yes (GCP Ubuntu 20.04/Noble) | No | No |
| QEMU emulation | No | No | No |
| Cross-compilation | No | No | No |
| RISE runner | No | No | No |
| Release-blocking | Yes (Kokoro presubmit + continuous) | No | No |

The repository has no `.github/workflows/` directory (GitHub API returns HTTP 404 for that path). CI is exclusively Kokoro, triggered by Google-internal presubmit and continuous configs at `.kokoro/gcp_ubuntu/presubmit.cfg` and `.kokoro/gcp_ubuntu/continuous.cfg`. These configs run `bazel build` and `bazel test` with native x86_64 tooling inside `ubuntu:noble` Docker. There is no mechanism to add a RISE riscv64 runner without restructuring the CI entirely to use GitHub Actions or a publicly accessible CI system.

---

## 8. Distribution and Release Status

| Channel | riscv64 binary available | Notes |
|---|---|---|
| GitHub Releases | No | `gh api repos/google/silifuzz/releases` returns `[]`. No releases exist for any architecture. |
| PyPI | No | HTTP 404 -- silifuzz is not a Python package. |
| Ubuntu/Debian | No | HTTP 404 on both [tracker.debian.org/pkg/silifuzz](https://tracker.debian.org/pkg/silifuzz) and packages.ubuntu.com search. Not packaged. |
| Arch Linux RISC-V | No | [archriscv.felixc.at](https://archriscv.felixc.at/?q=silifuzz) returns no results. |
| RISE wheel builder | Not applicable | SiliFuzz is not a Python package. RISE wheel builder covers Python scientific packages only. |
| OCI container | Data not available: no DockerHub or ghcr.io search was performed. | |

SiliFuzz does not distribute prebuilt binaries for any architecture. A user on any platform must build from source. On riscv64, building from source is currently impossible due to the compile-time architecture guard and missing Bazel platform configuration.

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Open Blockers |
|---|---|---|---|---|---|
| abseil-cpp | Core utilities (strings, containers, logging, synchronization) | Broken (cross-compile) | Failing | N/A | [#1702](https://github.com/abseil/abseil-cpp/issues/1702) OPEN: undefined `__atomic_compare_exchange_1`; [#2002](https://github.com/abseil/abseil-cpp/issues/2002) OPEN: hashtable sampler and cordz tests SEGFAULT on riscv64-linux-gnu; [#2142](https://github.com/abseil/abseil-cpp/issues/2142) OPEN: SwissTable hash test fails on Group::kWidth==8 platforms |
| protobuf | Snapshot serialization | Working | Working | Released | All riscv64 issues closed; riscv64 protoc binaries on Maven Central |
| fuzztest | Fuzzing harness and corpus generation | Unknown | Unknown | Unknown | No riscv64 issues filed; SiliFuzz uses a pinned git commit override (7500662) |
| googletest | Unit and integration tests | Builds | Partial failure | Released | [#3756](https://github.com/google/googletest/issues/3756) OPEN: `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 |
| google_benchmark | Microbenchmarks | Builds | Passes | Released | No riscv64-specific open issues |
| libpfm4 | Performance counter access (PMU proxy) | Unknown | Unknown | Unknown | No GitHub issue tracker; RISC-V PMU depends on Linux SBI PMU extension (hsbi); no riscv64 event tables confirmed present |
| capstone | Instruction disassembler (static filter backend) | Builds | Partial failure | Released | [#2407](https://github.com/capstone-engine/capstone/issues/2407) OPEN: incorrect operands for RISC-V `ret` instruction; multiple closed issues for incorrect regs_access results, missing system registers, alias handling |
| unicorn | CPU emulator (x86_64 and aarch64 proxies) | Builds | Partial failure | Released | [#2402](https://github.com/unicorn-engine/unicorn/issues/2402) OPEN: RISC-V guest trap handlers don't receive exceptions; [#2390](https://github.com/unicorn-engine/unicorn/issues/2390) OPEN: execution starts from odd PC; [#2388](https://github.com/unicorn-engine/unicorn/issues/2388) OPEN: fsgnj.d/fmv.d retire without F/D extension; [#2389](https://github.com/unicorn-engine/unicorn/issues/2389) OPEN: D-width atomic instructions retire without A extension. Note: SiliFuzz implements only `unicorn_x86_64` and `unicorn_aarch64` proxies -- no `unicorn_riscv64` proxy exists |
| Intel XED (libxed) | x86 instruction encoder/decoder | Not applicable | Not applicable | Not applicable | x86-only; not relevant to RISC-V |
| linux-syscall-support (lss) | Low-level syscall wrappers (nolibc runner) | Unknown | Unknown | Unknown | Hosted at chromium.googlesource.com; no public issue tracker searchable. RISC-V syscall ABI is stable in Linux 5.4+ [NEEDS VERIFICATION] |
| liblzma (xz 5.2.5) | Corpus compression | Builds | Passes | Released | [#146](https://github.com/tukaani-project/xz/issues/146) CLOSED: `TUKLIB_FAST_UNALIGNED_ACCESS` for RISC-V (resolved) |
| cityhash | Snapshot checksumming | Builds | Unknown | Released (header-only) | No riscv64 issues in google/cityhash; portable C++ fallback path exists |
| zstd | Runtime decompression | Builds | Passes | Released | All riscv64 issues closed ([#3134](https://github.com/facebook/zstd/issues/3134), [#749](https://github.com/facebook/zstd/issues/749)) |

**Critical dependency observations:**

abseil-cpp is the most significant dependency blocker independent of SiliFuzz's own architecture gap. The undefined `__atomic_compare_exchange_1` linking bug (#1702) affects cross-compilation scenarios and would need `-latomic` or an upstream fix before any SiliFuzz riscv64 build could link. The hashtable and cordz segfaults (#2002) would likely manifest in SiliFuzz's corpus management code, which uses absl::flat_hash_map extensively.

unicorn's RISC-V emulation has four open correctness bugs covering trap handling, PC alignment, and extension enforcement. Even if a `unicorn_riscv64` proxy were written, the emulation layer cannot be trusted to produce accurate snapshots for hardware comparison -- which is the entire point of the tool. These bugs are blockers for the core use case.

capstone's RISC-V disassembly inaccuracies (#2407) would corrupt the static instruction filter, potentially passing illegal or branching instructions into the fuzzer corpus or incorrectly rejecting valid ones.

---

## 11. Known Bugs and Active Issues

As of 2026-08-14, the google/silifuzz repository has zero open issues. All 22 recorded issues are closed. None of the 22 issues (open or closed) mention RISC-V, riscv64, or any RISC-V performance or correctness concern. There are no RISC-V bugs to report.

The only performance-adjacent commit found references disabling HWAddressSanitizer for `PerfEventGroup.BasicTest` due to a kernel bug with tagged pointers on aarch64 -- unrelated to RISC-V.

Data not available: Bugzilla or mailing list bug reports, if any exist outside the GitHub issue tracker.

---

## 12. Objections and Upstream Blockers

**CONTRIBUTING.md rejection:** The repository states "We are not yet accepting external contributions at this time." This has been the policy since January 2022. A RISC-V port submitted as a pull request would be rejected on process grounds before any technical review. There is no community forum, mailing list, or RFC process to propose a port. The only path is to become a Google employee working on SiliFuzz or to obtain an explicit exception from the SiliFuzz team.

**Mirror architecture:** The repository is a Piper-to-GitHub mirror. Changes must originate inside Google's internal monorepo. External contributors cannot merge to the canonical source. Even if Google were willing to accept a RISC-V port, the operational mechanics require Google internal review, Piper submission, and re-export to GitHub.

**Scope mismatch:** SiliFuzz's primary mission is catching silicon bugs in production Google datacenter CPUs. Google's RISC-V datacenter presence is not established as of 2026-08. Without internal Google RISC-V hardware to run SiliFuzz against, the project team has no internal motivation to invest in a RISC-V port [NEEDS VERIFICATION: Google internal RISC-V hardware roadmap is not publicly disclosed].

**Unicorn emulation gaps:** Even if the architecture layers were implemented, the four open unicorn RISC-V bugs (trap handling, PC alignment, extension enforcement) mean the emulation-based proxy could not produce reliable snapshots. The core correctness guarantee of SiliFuzz -- that two runs of the same instruction sequence on the same or equivalent hardware produce identical state -- cannot be established with a broken emulation backend.

**libpfm4 PMU tables:** Hardware performance counter access on RISC-V requires the SBI PMU extension and corresponding kernel support. libpfm4 has no confirmed riscv64 event tables. Without PMU access, the performance counter proxy (`PerfEventGroup`) would be non-functional, limiting the tool to instruction-execution comparison only.

**Probability of upstream acceptance:** Near zero without internal Google sponsorship. The project is closed to external contributions by explicit policy, is an internal mirror, and has no established RISC-V use case.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

The minimum work to compile and run SiliFuzz on riscv64 is substantial. Every architecture-specific layer is absent. Work items:

1. Add `ArchitectureId::kRiscV64 = 3` to `util/arch.h` and thread the new enum through all `ARCH_DISPATCH` switch sites (estimated 40-60 call sites across the codebase).
2. Implement `util/ucontext/` save/restore assembly for the 32 integer registers, 32 floating-point registers, and the vector CSRs (vl, vtype, vstart) for RVV. This is the most labor-intensive item -- the aarch64 equivalent is approximately 14 files of assembly.
3. Implement register group definitions covering F, D, Q, and V extension registers.
4. Add a `PlatformId` entry (or entries) for target RISC-V microarchitectures.
5. Implement `runner/riscv64/` entry point, trap handler, and memory mapping.
6. Add a Capstone RISC-V disassembler mode to `instruction/capstone_disassembler.cc` and implement `InstructionCanBranch<RISCV64>`.
7. Implement `fuzzer/program_riscv64.cc` for instruction generation.
8. Add a `build_defs/platform/BUILD` config setting for riscv64 and configure a riscv64 Clang cross-toolchain in `WORKSPACE`.
9. Remove or conditionalize `--copt=-march=haswell` in `.bazelrc` for riscv64 builds.
10. Fix or work around the abseil-cpp atomic linking bug (#1702) for riscv64 cross-compilation.

Estimated effort: 20-30 person-weeks for a minimal functional port (compiles, captures and replays snapshots on riscv64 hardware, no RVV fuzzing). This estimate assumes an engineer with prior SiliFuzz codebase knowledge; without it, add 4-6 weeks for ramp-up. This estimate cannot be reduced by RISE-funded work because RISE has no involvement.

### 13.2 Performance Optimization

Not applicable at this stage. There is no baseline riscv64 implementation to optimize. Performance optimization (RVV register fuzzing, optimized snapshot serialization, RISC-V-specific instruction mutators) is a second phase that can only begin after functional enablement.

Estimated effort for RVV register group support and an optimized instruction mutator: 8-12 person-weeks after the functional baseline.

### 13.3 CI/CD Infrastructure

SiliFuzz uses Kokoro, which is not accessible to external contributors. A riscv64 CI track would require migrating to GitHub Actions or adding a separate CI system. RISE provides riscv64 GitHub Actions runners, but accessing them requires the project to adopt GitHub Actions, which it currently does not use at all (no `.github/workflows/` directory).

Estimated effort to add GitHub Actions riscv64 CI (assuming Google agrees to accept a GitHub Actions PR): 2-3 person-weeks for CI setup plus ongoing maintenance.

Without Google's agreement to merge the contribution, CI cannot be added to the upstream repository. A fork-based CI can be maintained but provides no upstream value.

### 13.4 Ecosystem Enablement

SiliFuzz has no package ecosystem. It distributes no binaries. Section 10 is omitted accordingly.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Architecture enum and ARCH_DISPATCH threading | 2 | Implementor | Critical |
| Functional | ucontext save/restore assembly (integer + FP regs) | 6 | Implementor | Critical |
| Functional | Register group definitions (F/D/Q extensions) | 3 | Implementor | Critical |
| Functional | Runner entry point and trap handler (riscv64/) | 4 | Implementor | Critical |
| Functional | Capstone RISC-V disassembler integration | 2 | Implementor | Critical |
| Functional | Bazel riscv64 platform config and cross-toolchain | 3 | Implementor | Critical |
| Functional | abseil-cpp atomic linking workaround (#1702) | 1 | Implementor | Critical |
| Functional | Instruction fuzzer (program_riscv64.cc, scalar baseline) | 4 | Implementor | High |
| Functional | Platform ID entries for target RISC-V microarchs | 1 | Implementor | High |
| Functional | libpfm4 riscv64 PMU event table verification | 2 | Implementor | High |
| Performance | RVV register group support | 4 | Implementor | Medium |
| Performance | RVV-aware instruction mutator | 4 | Implementor | Medium |
| Performance | Unicorn riscv64 proxy (blocked on upstream unicorn fixes) | 6 | Unicorn upstream + implementor | Low |
| CI/CD | GitHub Actions riscv64 CI (requires Google agreement) | 3 | Implementor | High |
| CI/CD | RISE riscv64 runner integration | 1 | RISE | Medium |

**Total for minimal functional enablement (rows marked Critical):** approximately 21 person-weeks.

**Total including High-priority items:** approximately 30 person-weeks.

**Critical caveat:** None of this work can be merged upstream without Google's explicit agreement to change their contribution policy and accept a riscv64 port. Without that agreement, the investment produces a maintained fork with no path to upstreaming. The probability of upstream acceptance without direct engagement with the SiliFuzz team at Google is near zero.

---

## 14. Updates

No updates yet -- initial report dated 2026-08-14.

---

## 15. References

- [google/silifuzz repository](https://github.com/google/silifuzz)
- [silifuzz README.md](https://github.com/google/silifuzz/blob/main/README.md)
- [silifuzz CONTRIBUTING.md](https://github.com/google/silifuzz/blob/main/CONTRIBUTING.md)
- [silifuzz util/arch.h (architecture enum)](https://github.com/google/silifuzz/blob/main/util/arch.h)
- [silifuzz util/platform.h (platform ID enum)](https://github.com/google/silifuzz/blob/main/util/platform.h)
- [silifuzz .bazelrc](https://github.com/google/silifuzz/blob/main/.bazelrc)
- [silifuzz .bazelversion](https://github.com/google/silifuzz/blob/main/.bazelversion)
- [silifuzz install_build_dependencies.sh](https://github.com/google/silifuzz/blob/main/install_build_dependencies.sh)
- [silifuzz .kokoro/gcp_ubuntu/presubmit.cfg](https://github.com/google/silifuzz/blob/main/.kokoro/gcp_ubuntu/presubmit.cfg)
- [silifuzz .kokoro/gcp_ubuntu/kokoro_build.sh](https://github.com/google/silifuzz/blob/main/.kokoro/gcp_ubuntu/kokoro_build.sh)
- [silifuzz runner/snap_runner_util.h (only "RISC" text in repo)](https://github.com/google/silifuzz/blob/main/runner/snap_runner_util.h)
- [abseil-cpp issue #1702: undefined __atomic_compare_exchange_1 on riscv64](https://github.com/abseil/abseil-cpp/issues/1702)
- [abseil-cpp issue #2002: hashtable sampler and cordz SEGFAULT on riscv64](https://github.com/abseil/abseil-cpp/issues/2002)
- [abseil-cpp issue #2142: SwissTable hash test fails on Group::kWidth==8 platforms](https://github.com/abseil/abseil-cpp/issues/2142)
- [googletest issue #3756: GetThreadCountTest fails on riscv64](https://github.com/google/googletest/issues/3756)
- [capstone issue #2407: incorrect operands for RISC-V ret instruction](https://github.com/capstone-engine/capstone/issues/2407)
- [unicorn issue #2402: RISC-V guest trap handlers broken](https://github.com/unicorn-engine/unicorn/issues/2402)
- [unicorn issue #2390: execution starts from odd PC on RISC-V](https://github.com/unicorn-engine/unicorn/issues/2390)
- [unicorn issue #2388: fsgnj.d/fmv.d retire without F/D extension](https://github.com/unicorn-engine/unicorn/issues/2388)
- [unicorn issue #2389: D-width atomics retire without A extension](https://github.com/unicorn-engine/unicorn/issues/2389)
- [xz issue #146: TUKLIB_FAST_UNALIGNED_ACCESS for RISC-V (closed)](https://github.com/tukaani-project/xz/issues/146)
- [RISE Project blog](https://riseproject.dev/category/blog/)
- [RISE Project member list](https://riseproject.dev/members/)
- [Arch Linux RISC-V package mirror](https://archriscv.felixc.at/)