---
title: xls
parent: Project Reports
color: orange
---

# xls

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for xls<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

XLS (Accelerated HW Synthesis) is a Google-internal project open-sourced under Apache-2.0. It is an HLS (High-Level Synthesis) toolchain that compiles DSLX, a domain-specific hardware description language, through an IR layer to Verilog/SystemVerilog for ASIC and FPGA synthesis. The toolchain includes a JIT compiler (LLVM-backed), a formal verification engine (Z3/Bitwuzla), a combinatorial optimizer (OR-Tools/CP-SAT), and a suite of EDA integration tools (Verilator, Yosys, Icarus Verilog).

XLS is explicitly described as "not an officially supported Google product." There is no OWNERS, MAINTAINERS, or CODEOWNERS file. Governance is benevolent-dictator / Google-controlled: all commit rights are held by Google employees, external contributions require the Google CLA, and community guidelines follow Google's Open Source Community Guidelines. There is no CNCF, Linux Foundation, Apache Foundation, or RISC-V International affiliation.

The top five contributors by commit count are all Google employees: Chris Leary (1,435 commits), Alex Light (812), an unidentified Google contributor (715), Eric Astor (676), and Paul Rigge (546). Google LLC is a RISE member, but XLS itself is not listed as a RISE project and has no funded RISE work.

The project is early-stage and explicitly warns of rapid breaking changes with no backward compatibility guarantees for DSLX. The CONTRIBUTING.md states: "Please try to lead with an issue. Engage us in conversation if you wish to upstream changes. Sending a PR without back and forth with us in an issue may be a longer road to success." No formal port acceptance policy exists.

## 2. Port History and Upstreaming Timeline

There is no riscv64 port of XLS. The RISC-V content in the repository is entirely about two unrelated efforts: a DSLX example file (`riscv_simple.x`) that implements a toy RV32I ISA simulator as a hardware description (i.e., XLS compiling a RISC-V CPU design to silicon, not XLS running on RISC-V hardware), and a stalled Renode co-simulation integration.

| Date | Event | Source |
|---|---|---|
| 2020-05 | XLS repository created on GitHub | [google/xls](https://github.com/google/xls) |
| 2020-09-08 | First commit touching `riscv_simple.x` (comment cleanup) | [commit a1a9cb1b](https://github.com/google/xls/commit/a1a9cb1b213c) |
| 2020-08-06 | PR #66 merged: JIT execution for DSLX tests; `riscv_simple.x` segfaults in JIT, temporarily disabled | [PR #66](https://github.com/google/xls/pull/66) |
| 2020-08-06 | Issue #78 opened: `riscv_simple.x` segfaults in JIT | [Issue #78](https://github.com/google/xls/issues/78) |
| 2021-03-18 | Issue #78 closed: fixed as side effect of transition to C++ interpreter | [Issue #78](https://github.com/google/xls/issues/78) |
| 2021-07-29 | PR #456 merged: `riscv_simple.x` cleanup (bit-slice expressions, `decode_j_instruction` correctness fix) | [PR #456](https://github.com/google/xls/pull/456) |
| 2023-05-30 | Issue #997 opened: umbrella issue for Renode/RISC-V co-simulation integration | [Issue #997](https://github.com/google/xls/issues/997) |
| 2023-08-31 | PR #1123 opened: Renode integration (Antmicro, 42,881 lines added) | [PR #1123](https://github.com/google/xls/pull/1123) |
| 2023-10-31 | PRs #1176, #1177, #1178 opened: generic integration interfaces/channels/memory peripheral (split from #1123) | [PR #1176](https://github.com/google/xls/pull/1176), [#1177](https://github.com/google/xls/pull/1177), [#1178](https://github.com/google/xls/pull/1178) |
| 2024-04-02 | PRs #1123, #1176, #1177, #1178 all closed without merge; work moved to external `antmicro/xls-cosimulation-demonstrator` repo | [PR #1123](https://github.com/google/xls/pull/1123) |
| 2024-06-24 to 2024-07-12 | `riscv_simple.x` correctness fixes: endianness (big-endian to little-endian), store instruction register swap, LBU fix, place-and-route build rules added | [commit cf384445](https://github.com/google/xls/commit/cf384445ce09), [commit 27ca0d26](https://github.com/google/xls/commit/27ca0d26b1dd) |

Key contributors to RISC-V-adjacent work: Johan Euphrosine (`proppy`, Google) as primary reviewer for Renode integration; Maciej Dudek (`mtdudek`, Antmicro) as primary author of Renode integration PRs; Hoa Nguyen as author of 2024 `riscv_simple.x` correctness fixes.

There is no riscv64 port upstream, no tracking issue for one, and no stated intent to create one.

## 3. Upstream Support Tier

XLS has no formal tier policy. The project targets Verilog/SystemVerilog RTL output and is technology-agnostic at the HLS level, but the toolchain itself (the binaries that perform compilation) only runs on x86_64 Linux.

| Dimension | amd64 (x86_64) | arm64 (aarch64) | riscv64 |
|---|---|---|---|
| CI builds | Yes (ubuntu-22.04-64core) | No | No |
| CI tests | Yes | No | No |
| Official release binary | Yes (linux-x64 tar.gz) | No | No |
| AOT compiler target | Yes (`"x86_64"`) | Yes (`"aarch64"`) | No (hard-rejected) |
| LLVM backend initialized | Yes | Yes | No |
| Docker image | Yes (Dockerfile-ubuntu-22.04) | No | No |

Note: aarch64 has AOT compiler target support and LLVM backend initialization, but no CI and no release binary. [NEEDS VERIFICATION: whether aarch64 builds are tested by any party outside Google.]

## 4. Technical Architecture and RISC-V-Specific Subsystems

XLS has two architecture-sensitive subsystems: the LLVM-backed JIT compiler and the AOT compiler. Both are explicitly limited to x86_64 and aarch64.

**JIT compiler (`xls/jit/llvm_compiler.cc`)**

The `OnceInit()` function registers LLVM backends at startup. The complete list is:

```
LLVMInitializeNativeTarget()
LLVMInitializeAArch64Target() + TargetInfo + TargetMC + AsmParser + AsmPrinter
LLVMInitializeX86Target() + TargetInfo + TargetMC + AsmParser + AsmPrinter
```

`LLVMInitializeRISCVTarget()` is never called. If XLS were built and run on a riscv64 host, the JIT would fall back to `LLVMInitializeNativeTarget()`, which would attempt to initialize the RISC-V backend -- but that backend is not linked into the binary because the LLVM module configuration in `MODULE.bazel` only lists `"AArch64"` and `"X86"` as targets. The result would be a link-time or runtime failure.

**AOT compiler (`xls/jit/aot_compiler.cc`)**

The `--aot_target` flag accepts only `"native"`, `"aarch64"`, and `"x86_64"`. Any other value returns `absl::InternalError`. The architecture switch at L112-136 has explicit cases for `x86_64` (Haswell baseline, feature tuning) and `aarch64` (feature clear), with a `default:` path that returns `absl::InvalidArgumentError`. riscv64 hits the default error path.

**LLVM module configuration (`MODULE.bazel`)**

```python
llvm_configure(
    name = "llvm-project",
    targets = ["AArch64", "X86"],
)
```

`"RISCV"` is absent. This means the RISC-V LLVM backend is not compiled into XLS binaries at all.

**Build rule platform select (`xls/build_rules/xls_ir_wrapper_rules.bzl`)**

```python
aot_target = select({
    "@platforms//cpu:aarch64": "aarch64",
    "@platforms//cpu:x86_64": "x86_64",
    "//conditions:default": "native",
})
```

riscv64 falls through to `"native"`, which would then fail at the AOT compiler's architecture switch.

**Cross-compilation**

Multiple BUILD files contain the comment: "The XLS AOT compiler does not currently support cross-compilation." Found in `xls/jit/BUILD` and `xls/modules/aes/BUILD`.

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT backend (LLVM) | Full | Full | Missing -- not linked |
| AOT compiler target | Full (Haswell tuning) | Full | Hard-rejected |
| LLVM module config | `"X86"` | `"AArch64"` | Absent |
| Build rule platform select | Explicit | Explicit | Falls to `"native"` (fails) |
| Cross-compilation | Not supported | Not supported | Not supported |
| SIMD / RVV | N/A | N/A | N/A |
| Assembly routines | None | None | None |

XLS has no hand-written assembly, no SIMD intrinsics, and no architecture-specific crypto code. The only architecture sensitivity is in the JIT/AOT layer.

## 5. Build System, Cross-Compilation, and Toolchain

XLS uses Bazel 8.7.0 exclusively. There are no CMakeLists.txt files. The build uses a fully hermetic Clang toolchain via `bazel_dep(name = "llvm", version = "0.8.11")` -- no system GCC or Clang is required.

**Standard build (x86_64 Ubuntu 22.04):**

```bash
sudo apt-get install -y python3-dev python-is-python3 libtinfo6 \
  build-essential liblapack-dev libblas-dev gfortran

# DSLX only (~2h on 8-core)
bazel test -c opt -- //xls/... -//xls/contrib/xlscc/...

# Everything including C++ front-end (~6h on 8-core)
bazel test -c opt -- //xls/...
```

**Toolchain versions:**

| Component | Version |
|---|---|
| Bazel | 8.7.0 |
| C++ standard | C++20 |
| Compiler | Hermetic Clang (via Bazel LLVM rules) |
| LLVM commit | ab547095 (post-LLVM 20, dated 2026-08-18) |
| Python | 3.14 |
| Java (tools) | 21 (remotejdk_21) |
| Ubuntu CI | 22.04 (Jammy) |

**riscv64 build status:** No documented procedure exists. No riscv64 Dockerfile exists (only `Dockerfile-ubuntu-22.04`, labeled "Docker Image for Building/Testing XLS on Ubuntu 22.04 x86-64"). No QEMU references exist anywhere in the repository. Cross-compilation is explicitly unsupported. Attempting a native riscv64 build would fail at the LLVM module configuration step because `"RISCV"` is not listed as a target, and would fail again at the AOT compiler's architecture validation.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| JIT compilation | Full | Full | Not functional -- LLVM backend absent |
| AOT compilation | Full | Full | Hard-rejected by compiler |
| DSLX interpreter (no JIT) | Full | Unknown [NEEDS VERIFICATION] | Unknown -- would require build |
| Formal verification (Z3) | Full | Unknown [NEEDS VERIFICATION] | Unknown -- Z3 builds on riscv64 |
| Formal verification (Bitwuzla) | Full | Unknown [NEEDS VERIFICATION] | Unknown -- no riscv64 CI for Bitwuzla |
| CP-SAT optimization (OR-Tools) | Full | Unknown [NEEDS VERIFICATION] | Not available -- OR-Tools has no riscv64 release |
| RTL synthesis output (Verilog) | Full | Unknown [NEEDS VERIFICATION] | Unknown -- depends on build succeeding |
| `riscv_simple.x` DSLX example | Compiles and tests pass | Unknown | Unknown |

**Functional gaps on riscv64:**

1. JIT is non-functional: the LLVM RISC-V backend is not linked. Any operation requiring JIT (including JIT-accelerated DSLX tests) would fail.
2. AOT compilation is hard-rejected: `aot_compiler.cc` returns an error for any target other than `native`/`aarch64`/`x86_64`.
3. OR-Tools (CP-SAT) has no riscv64 release artifacts and no riscv64 CI. XLS's scheduling and optimization passes that use CP-SAT would be unavailable or require building OR-Tools from source with unverified results.
4. Bitwuzla (bundled SMT solver) has no riscv64 CI or release artifacts. Build status on riscv64 is unknown.

**Note on `riscv_simple.x`:** The JIT comparison test for `riscv_simple.x` is explicitly disabled in `xls/examples/BUILD` with the comment `# TODO(hjmontero): run_instruction segfaults in the JIT`. This is a pre-existing issue on x86_64, not a riscv64-specific problem. The interpreter path works.

**Floating-point / NaN semantics:** No riscv64-specific floating-point issues found. Zero open NaN correctness bugs in the tracker.

## 7. CI/CD Infrastructure

All seven workflow files in `.github/workflows/` were read in full. Zero references to `riscv`, `riscv64`, `risc-v`, `qemu`, `arm64`, or `aarch64` appear in any workflow file.

| Workflow | Runner | Trigger |
|---|---|---|
| `continuous-integration.yml` | ubuntu-22.04-64core (x86_64) | push/PR to main, workflow_dispatch |
| `continuous-docs-deployment.yml` | ubuntu-22.04-4core (x86_64) | push/PR to main, workflow_dispatch |
| `modules-zstd.yml` | ubuntu-22.04-64core (x86_64) | push/PR to main (zstd paths), workflow_dispatch |
| `nightly-fuzz.yml` | ubuntu-22.04-64core (x86_64) | nightly cron, workflow_dispatch |
| `nightly-macos.yml` | macos-latest-xlarge (macOS) | nightly cron, workflow_dispatch |
| `nightly-ubuntu-22.04.yml` | ubuntu-22.04-64core (x86_64) | nightly cron, workflow_dispatch |
| `one-bazel-test-ubuntu-22.04.yml` | ubuntu-22.04-64core (x86_64) | workflow_dispatch (manual) |

| CI dimension | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Upstream CI exists | Yes | No | No |
| Tests run in CI | Yes | No | No |
| RISE runners used | No | No | No |
| QEMU emulation | No | No | No |

No GitLab CI, Jenkinsfile, Cirrus CI, or Travis CI configuration exists in the repository.

RISE involvement: XLS is listed in the RISE `sw-ecosystem` queue.yml as a candidate for a future project report. It is not in scope.yml, has no funded work, and no RISE blog post mentions it.

## 8. Distribution and Release Status

GitHub releases for `google/xls` ship exactly one asset per release: `xls-v0.0.0-NNNNN-gHASH-linux-x64.tar.gz`. All 20 most recent releases (v0.0.0-10419 through v0.0.0-10585) follow this pattern. No riscv64 asset exists in any release.

| Distribution channel | riscv64 available | Notes |
|---|---|---|
| GitHub releases (google/xls) | No | linux-x64 only, all releases |
| Ubuntu 26.04 (resolute) | No | Package `xls` does not exist in resolute |
| Debian | No | Not packaged |
| Arch Linux RISC-V | No | Not in archriscv port repository |
| PyPI `xls` | No | Unrelated package (SheetJS py-xls); source-only sdist, no wheels |
| RISE wheel builder | No | Redirects to PyPI; no riscv64 wheel |

To obtain a working XLS binary on riscv64, a user would need to: add `"RISCV"` to the LLVM module targets in `MODULE.bazel`, add `LLVMInitializeRISCV*` calls to `llvm_compiler.cc`, add riscv64 handling to `aot_compiler.cc`, resolve OR-Tools and Bitwuzla build issues on riscv64, and perform a native or cross-compiled Bazel build -- none of which has been attempted or documented.

## 9. Dependencies

| Dependency | Role | riscv64 build | riscv64 test | riscv64 release | Blocking issues |
|---|---|---|---|---|---|
| LLVM (commit ab547095) | JIT backend, IR compiler, MLIR | Yes | Partial | Ubuntu 26.04: `llvm-20-dev 1:20.1.8-2ubuntu8` | [#68372](https://github.com/llvm/llvm-project/issues/68372) TSAN missing; [#203972](https://github.com/llvm/llvm-project/issues/203972) GlobalISel miscompile (open 2026-06) |
| Z3 (4.14.1, bundled) | SMT solver, formal verification | Yes | Yes | Ubuntu 26.04: `libz3-dev 4.13.3-1build1`; PyPI `z3-solver 5.1.0` ships `manylinux_2_38_riscv64` | None |
| Abseil-cpp (20260526.0) | C++ foundation | Yes | Partial | Ubuntu 26.04: `libabsl-dev 20260107.0-4` | [#2002](https://github.com/abseil/abseil-cpp/issues/2002) SEGFAULT in hashtablez/cordz tests on Debian riscv64 (open 2026-08) |
| gRPC (1.80.0) | RPC framework | Yes | No riscv64 CI | Ubuntu 26.04: `libgrpc++-dev 1.51.1-8ubuntu1` (version gap: Ubuntu 1.51.1 vs XLS 1.80.0) | No riscv64 CI; Python wheels not published for riscv64 |
| Protobuf (33.5, patched) | Serialization | Yes | Yes | Ubuntu 26.04: `libprotobuf-dev 3.21.12-15ubuntu1` (version gap: Ubuntu 3.21.12 vs XLS 33.5; XLS bundles its own) | None |
| OR-Tools (9.15) | CP-SAT optimization, scheduling | Partial (cross-compile via Bootlin) | No | Not in Ubuntu 26.04 riscv64 | No riscv64 CI; no release artifacts; Tier 2-minus |
| Bitwuzla (commit 3f5d9cd, bundled) | SMT solver (alternative to Z3) | Unknown | Unknown | Not in Ubuntu 26.04 | No riscv64 CI; no release artifacts |
| BoringSSL (0.20250114.0, bundled) | Cryptography | Yes (compile-only, Android CI) | No Linux riscv64 CI | Not packaged in Ubuntu/Debian | No Linux riscv64 test CI; no riscv64 assembly (C fallback only) |
| re2 (2024-07-02) | Regular expressions | Yes | Yes | Ubuntu 26.04: `libre2-dev 20250805-1build3` | None |
| GMP (6.3.0, bundled) | Arbitrary-precision arithmetic | Yes | Yes | Ubuntu 26.04: `libgmp-dev 2:6.3.0+dfsg-5ubuntu2` | None |
| MPFR (4.2.2, bundled) | Multiple-precision floating-point | Yes | Yes | Ubuntu 26.04: `libmpfr-dev 4.2.2-3` | None |
| zstd (1.5.7) | Compression | Yes | Yes | Ubuntu 26.04: `libzstd-dev 1.5.7+dfsg-3` | None |
| nlohmann_json (3.12.0) | JSON parsing (header-only) | Yes | Yes | Ubuntu 26.04: `nlohmann-json3-dev 3.12.0.really.3.11.3-3build1` | None |
| Riegeli (0.0.0-20250822, bundled) | Streaming data I/O | Unknown | Unknown | Not packaged | No riscv64 CI; no releases |
| Verilator (via rules_hdl) | HDL simulation | Yes | Yes | Ubuntu 26.04: `verilator 5.032-1` | None |
| Yosys (via rules_hdl) | Logic synthesis | Yes | Yes | Ubuntu 26.04: `yosys 0.52-2` | None |
| Icarus Verilog (via rules_hdl) | Verilog simulation | Yes | Yes | Ubuntu 26.04: `iverilog 12.0-3` | None |

**Critical dependency deep-dives:**

**LLVM:** The LLVM RISC-V backend (`ELF_riscv.cpp`, ORC JIT `riscv.cpp`) exists and is functional in upstream LLVM. The Ubuntu 26.04 package includes it. The blocker is that XLS does not configure or link it: `MODULE.bazel` lists only `"AArch64"` and `"X86"`, and `llvm_compiler.cc` never calls `LLVMInitializeRISCVTarget()`. Enabling riscv64 JIT requires changes to both files. Two open LLVM issues are relevant: [#68372](https://github.com/llvm/llvm-project/issues/68372) (TSAN missing on riscv64) and [#203972](https://github.com/llvm/llvm-project/issues/203972) (GlobalISel miscompile, open as of 2026-06). The XLS-pinned LLVM commit (ab547095, 2026-08-18) postdates the GlobalISel issue's last update; whether the fix is included is not confirmed by the research findings.

**OR-Tools (9.15):** No riscv64 CI, no release artifacts, not in Ubuntu 26.04 riscv64 as a dev library. XLS uses OR-Tools for CP-SAT-based scheduling. This is a blocking dependency for the optimizer on riscv64. See [project-reports/or-tools.md](or-tools.md).

**Bitwuzla (bundled):** CI covers x86_64 and arm64 only. No riscv64 release binaries. Build status on riscv64 is completely unknown. Bundled in XLS, so it must be built from source as part of the XLS build.

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist in the `google/xls` tracker. Zero issues match `riscv64 bug` or `riscv64 performance` queries.

**Open correctness and performance bugs (all architectures):**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#2783](https://github.com/google/xls/issues/2783) | Array-slice miscompile: `array_simp` pass produces wrong results | Open | High -- correctness | Optimizer miscompile; architecture-independent |
| [#4372](https://github.com/google/xls/issues/4372) | SIGABRT in `llvm::LiveRangeCalc` (SSA dominance failure after narrow pass) | Open | High -- JIT crash | Fuzzer-found; architecture-independent |
| [#4380](https://github.com/google/xls/issues/4380) | LLVM JIT hangs/timeouts when returning large array of tuples | Open | Medium -- performance | JIT hang; architecture-independent |
| [#4425](https://github.com/google/xls/issues/4425) | `opt_main` times out in `PartialInfoQueryEngine` / `IntervalSet::Combine` | Open | Medium -- performance | Optimizer timeout; architecture-independent |
| [#4508](https://github.com/google/xls/issues/4508) | JIT compile hang in LLVM `ConstraintEliminationPass` for large array comparisons | Open | Medium -- performance | JIT hang; architecture-independent |
| [#4545](https://github.com/google/xls/issues/4545) | Infinite optimization loop: Strength Reduction vs. Array Simplification | Open | Medium -- correctness | Optimizer hang; architecture-independent |
| [#1155](https://github.com/google/xls/issues/1155) | Non-packed views do not always correctly match JIT ABI | Open | Medium -- correctness | JIT ABI mismatch; architecture-independent |
| [#997](https://github.com/google/xls/issues/997) | Add RISC-V based simulation for DSLX examples (Renode integration) | Open | Low -- feature | Umbrella issue; Renode PRs stalled since Apr 2024 |

Total open bugs in `google/xls`: 135. None are riscv64-specific.

## 12. Objections and Upstream Blockers

**Technical blockers for a riscv64 port:**

1. LLVM module configuration: `MODULE.bazel` must add `"RISCV"` to the targets list. This is a one-line change but requires rebuilding the hermetic LLVM toolchain.
2. JIT backend initialization: `llvm_compiler.cc` must add `LLVMInitializeRISCV*` calls. Straightforward code change.
3. AOT compiler: `aot_compiler.cc` must add a riscv64 case to the target validation and architecture switch. Requires deciding on a baseline ISA (RV64GC minimum; RV64GCV for vector).
4. Build rule platform select: `xls_ir_wrapper_rules.bzl` must add an explicit riscv64 case.
5. OR-Tools: No riscv64 release artifacts. XLS's CP-SAT-dependent passes require either building OR-Tools from source on riscv64 (unverified) or disabling those passes. See [project-reports/or-tools.md](or-tools.md).
6. Bitwuzla: Build status on riscv64 unknown. Must be verified.
7. Riegeli: Build status on riscv64 unknown. Must be verified.

**Organizational blockers:**

Google controls all merge rights. The CONTRIBUTING.md explicitly requires issue-first engagement before PRs. No Google team member has expressed interest in a riscv64 port. The project is early-stage with no backward compatibility guarantees.

**Renode co-simulation (issue #997):** The four Renode integration PRs (#1123, #1176, #1177, #1178) were closed April 2024 without merge. Work moved to the external `antmicro/xls-cosimulation-demonstrator` repository. The stated blocker is Bazel workspace integration for the Renode simulator build. Issue #997 has had no activity since January 2024. This effort is about using a RISC-V simulator (Renode) to test XLS-generated hardware, not about running XLS on riscv64 hardware.

**Acceptance probability for a riscv64 port PR:** Low without prior issue engagement and Google team buy-in. The project has no precedent for accepting architecture port work from external contributors.

## 13. Readiness Assessment

- **Color:** orange (no upstream riscv64 CI; no distro package; no riscv64 binary from any source)
- **Release provider:** none

XLS has no riscv64 CI in any of its seven workflow files, no riscv64 release binary (all GitHub releases are `linux-x64` only), and is not packaged in Ubuntu 26.04 (resolute) or any other checked distribution for riscv64. The LLVM RISC-V backend is not linked into XLS binaries, and the AOT compiler hard-rejects riscv64 as a target. The distribution floor rule (no upstream CI, no distro package) yields orange.

No pending work exists that would change this grade. Issue #997 (Renode co-simulation) is unrelated to running XLS on riscv64 hardware. RISE has XLS in its queue.yml candidate list but has not initiated any work.

## 14. Investment Analysis

RISE has no existing work on XLS for riscv64. All items below are unaddressed.

### 14.1 Functional Enablement

The minimum viable work to produce a functional (non-JIT) XLS binary on riscv64:

1. Verify that Bitwuzla and Riegeli build on riscv64 (bundled dependencies with unknown status).
2. Attempt a native riscv64 Bazel build and triage failures.
3. Engage Google XLS team via issue to establish acceptance criteria for a riscv64 port.

The minimum viable work to produce a fully functional XLS binary on riscv64 (including JIT):

4. Add `"RISCV"` to `llvm_configure` targets in `MODULE.bazel`.
5. Add `LLVMInitializeRISCV*` calls to `llvm_compiler.cc`.
6. Add riscv64 case to `aot_compiler.cc` target validation and architecture switch (requires baseline ISA decision).
7. Add riscv64 platform select case to `xls_ir_wrapper_rules.bzl`.
8. Resolve OR-Tools riscv64 availability (blocked on upstream OR-Tools; see [project-reports/or-tools.md](or-tools.md)).

### 14.2 Performance Optimization

XLS has no SIMD, no hand-written assembly, and no architecture-specific optimizations for any platform. The JIT produces code via LLVM; RISC-V code quality is entirely determined by LLVM's RISC-V backend. No XLS-level performance optimization work is applicable until functional enablement is complete.

Data not available: LLVM RISC-V backend code quality relative to x86_64 for the specific IR patterns XLS generates (no benchmarks exist for XLS on riscv64).

### 14.3 CI/CD Infrastructure

Adding riscv64 CI requires: a RISE riscv64 runner or Q