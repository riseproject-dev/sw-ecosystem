---
title: heir
---

# heir

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for heir<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[HEIR](https://heir.dev/) (Homomorphic Encryption Intermediate Representation) is an MLIR-based compiler framework for Fully Homomorphic Encryption (FHE). It was created 2023-04-17 and is hosted at [github.com/google/heir](https://github.com/google/heir). License: Apache 2.0.

HEIR does not generate machine code for CPU ISAs directly. It lowers FHE program IR through a chain of MLIR dialects and emits backend-specific code targeting cryptographic libraries: OpenFHE, Lattigo (Go), tfhe-rs (Rust), Jaxite, and hardware (Verilog for ASIC/FPGA synthesis via Yosys). The architecture of the target machine is a concern of those downstream FHE libraries, not of HEIR itself - except that HEIR links an LLVM instance for its MLIR infrastructure and JIT plumbing, and that LLVM instance currently includes only the X86 and AArch64 backend targets.

A companion paper was published 2025-08-14 (arXiv:2508.11095) by Asra Ali, Jaeho Choi, Bryant Gipson, Shruthi Gorantala, Jeremy Kun, et al.

**Governance.** HEIR has no formal governance structure and no foundation affiliation (not Linux Foundation, RISC-V International, or RISE). Three Google engineers are named stewards: Asra Ali (asraa), Shruthi Gorantala, and Jeremy Kun (j2kun). The policy requires at least two Google employees to approve every merge, enforced via Google's internal Copybara tooling. Maintainers have acknowledged this arrangement is temporary. New contributors not already known to maintainers must meet a maintainer in a non-textual format (in person, at office hours, or via video call) before a first PR is accepted. Google CLA is required.

The two-Googler approval requirement means any new platform tier (including riscv64 CI) requires internal Google buy-in. There is no external path to elevating riscv64 to first-class support without it.

**Corporate sponsor distribution.**

| GitHub login | Name | Affiliation | Commits |
|---|---|---|---|
| copybara-github | (bot) | Google (internal sync) | 1057 |
| j2kun | Jeremy Kun | Google | 900 |
| asraa | Asra Ali | Google | 429 |
| ZenithalHourlyRate | Hongren Zheng | unknown | 152 |
| AlexanderViand | Alexander Viand | Belfort Labs | 118 |
| d0k | Benjamin Kramer | unknown | 87 |
| gribozavr | Dmitri Gribenko | unknown | 84 |
| slackito | Jorge Gorbe Moya | unknown | 56 |
| crockeea | (name withheld) | Amazon Web Services | 35 |
| alinas | Alina Sbirlea | Google | 30 |
| WoutLegiest | (name withheld) | KU Leuven | 28 |
| mdgrs | Marc Desgroseilliers | Belfort Labs | 24 |
| metaflow | Mikhail Goncharov | Google | 20 |

Google is dominant. Belfort Labs is a secondary contributor. AWS and KU Leuven are minor. There is no RISC-V hardware vendor (SiFive, Rivos, Qualcomm RISC-V, SpacemiT) anywhere in the contributor list.

**Community stance on new ports.** No formal tier policy exists for CPU architecture support. Given the structure, a riscv64 enablement effort initiated externally would face the two-Googler approval gate for every PR. There is no indication the maintainers have considered or discussed riscv64 support.

---

## 2. Port History and Upstreaming Timeline

No RISC-V port has been started. There is no history to report.

Exhaustive search results:
- `gh search issues --repo google/heir "riscv"`: 1 result (issue [#847](https://github.com/google/heir/issues/847), closed 2025-09-02, mentions "SPIRV" not RISC-V - false positive)
- `gh search issues --repo google/heir "riscv64"`: 0 results
- `gh search prs --repo google/heir "riscv"`: 0 results
- `gh search prs --repo google/heir "riscv64"`: 0 results
- `gh search commits --repo google/heir "riscv"`: 0 results
- `gh api search/code?q=riscv+repo:google/heir`: 0 results
- Web searches for "site:github.com google/heir riscv64" and "heir riscv64 support MLIR": no relevant results

No tracking issue, no design discussion, no prototype branch, no contributor working on riscv64 support exists anywhere in the public record.

---

## 3. Upstream Support Tier

HEIR has no formal tier policy. Support status is inferred from CI coverage and release artifacts.

| Tier indicator | amd64 | arm64 | riscv64 |
|---|---|---|---|
| CI build (every commit) | Yes (ubuntu-latest) | Partial (ubuntu-24.04-arm, release builds) | No |
| CI test (every commit) | Yes | Partial | No |
| Official release binary | Yes (manylinux_2_28_x86_64) | Yes (manylinux_2_28_aarch64) | No |
| PyPI wheel (compiled) | Yes | Yes | No |
| macOS binary | Yes (macosx_11_0_arm64) | Yes (same) | N/A |
| Tracking issue filed | N/A | N/A | No |
| Named maintainer for port | N/A | N/A | No |

amd64 is the primary development platform. arm64 achieved release-binary status without a documented promotion process - it simply appeared in the nightly release matrix. riscv64 has no presence in any tier.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

HEIR is architecturally unusual compared to runtimes or system libraries: it contains zero architecture-specific source code. There are no `arch/` directories, no hand-written assembly, no SIMD intrinsic dispatchers, and no `#ifdef __riscv` / `#ifdef __aarch64__` / `#ifdef __x86_64__` guards anywhere in the repository (all three code searches returned 0 results). Two hits for "neon" were false positives: a GitHub username citation in a benchmark header and an MLIR target emitter string constant.

Architecture exposure is entirely delegated to LLVM/MLIR. HEIR lowers FHE IR through MLIR dialects and then calls into LLVM's backend for any machine-code generation. HEIR's own source code has no riscv64 work to do - the gap is in configuration, not implementation.

**Critical configuration gap: LLVM RISCV target excluded.**

From `MODULE.bazel`:
```python
_LLVM_TARGETS = [
    "X86",
    "AArch64",
]
```

`RISCV` is absent. Without it, MLIR cannot emit riscv64 machine code from an HEIR build. Adding `"RISCV"` to this list is necessary but not sufficient - the hermetic LLVM toolchain (`rules_llvm` version 0.8.9) would also need a riscv64 sysroot/cross-toolchain, which is not currently provided by that Bazel module.

**Component status table.**

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| MLIR dialect infrastructure | Full | Full | Missing (LLVM RISCV target not compiled in) |
| JIT code generation (via LLVM) | Full | Full | Missing (same) |
| FHE library backends (OpenFHE, Lattigo, tfhe-rs) | Full | Full | Unvalidated (see Section 9) |
| Hardware synthesis backend (Yosys) | Full | Full | Unvalidated |
| Python bindings | Full | Full | Missing (no riscv64 wheel build) |
| Architecture-specific intrinsics | None | None | None (not applicable) |
| Hand-written assembly | None | None | None (not applicable) |

HEIR's architecture means the riscv64 enablement effort is primarily in build configuration and dependency validation, not in implementing new architecture-specific code within HEIR itself.

---

## 5. Build System, Cross-Compilation, and Toolchain

**Build system:** Bazel exclusively. No CMakeLists.txt at repo root. Required version: 8.4.0 (`.bazelversion`). No Makefile, no Meson.

**Hermetic toolchain:** HEIR uses a self-contained LLVM/Clang toolchain via `bazel_dep(name = "llvm", version = "0.8.9")` with `register_toolchains("@llvm//toolchain:all")`. `.bazelrc` sets `common --repo_env=BAZEL_DO_NOT_DETECT_CPP_TOOLCHAIN=1` to force use of the hermetic toolchain and ignore any system compiler. The OpenFHE backend additionally requires Clang 19, installed via `./.github/install_clang_version.sh 19`.

**Build commands (native amd64/arm64 host, the only validated configurations):**
```bash
bazel build -c opt //tools:heir-opt
bazel test -c opt //...:all
```

**riscv64 cross-compilation:** Not supported. No Dockerfile for cross-compilation exists (only `docs/Dockerfile` for the Hugo static site builder). `setup.py` handles only `x86_64` and `arm64` ARCHFLAGS; a riscv64 build would fall through to `platform.machine()` and produce an unsupported Bazel platform target.

**What riscv64 support would require in the build system:**
1. Add `"RISCV"` to `_LLVM_TARGETS` in `MODULE.bazel`.
2. Add a riscv64 sysroot/cross-toolchain to `rules_llvm` (version 0.8.9 does not provide one) [NEEDS VERIFICATION - the rules_llvm module contents were not inspected directly].
3. Add a `linux-riscv64` runner to the GitHub Actions matrix (GitHub has no hosted riscv64 runner; a self-hosted runner or QEMU emulation step would be required).
4. Update `pyproject.toml` to add `manylinux-riscv64-image` and include riscv64 in the `archs` field (currently `"auto64"`, which only builds the runner's native architecture).

**Known build failures on riscv64:** None documented, because no one has attempted the build.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

Because HEIR delegates all machine-code generation to LLVM and all FHE math to downstream libraries, the feature gap is binary at the toolchain level: either HEIR can be built with riscv64 support or it cannot. Currently it cannot.

**Feature matrix.**

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build and run heir-opt | Full | Full | Blocked (LLVM RISCV target not compiled) |
| OpenFHE CKKS/BGV/BFV lowering | Full | Full | Unvalidated |
| Lattigo Go backend | Full | Full | Likely functional (pure Go) |
| tfhe-rs Rust backend | Full | Full | Likely functional (scalar fallback) |
| Jaxite backend | Full | Full | Unvalidated |
| Verilog/Yosys hardware synthesis | Full | Full | Unvalidated |
| Python wheel | Full | Full | Missing |
| OR-Tools polynomial optimization | Full | Full | Unvalidated |

**Performance gaps.** No benchmark data exists for any architecture (no stored results in the repository, none on the RISE project blog, none in published papers). The performance gap for riscv64 vs amd64 cannot be quantified from available data.

Data not available: Published HEIR performance benchmarks for any architecture, including amd64 and arm64.

**Functional gaps specific to riscv64:**
- HEIR cannot be built for riscv64 today due to the missing RISCV LLVM target in `MODULE.bazel` and the absence of a riscv64 hermetic toolchain in `rules_llvm` 0.8.9.
- The `poulpy-ckks` and `poulpy-cpu-ref` Rust crates (version 0.7.0) are not publicly visible on crates.io; their riscv64 portability is unknown.

**Security hardening gaps.** Data not available: No analysis was performed of stack canaries, CFI, shadow call stack, or other hardening flags in the hermetic toolchain for riscv64 targets.

**Floating-point semantics.** Data not available: No analysis of FHE-relevant floating-point behavior differences between riscv64 and amd64/arm64 was found in the research data.

---

## 7. CI/CD Infrastructure

All 14 GitHub Actions workflow files were inspected directly. No riscv64 runner, QEMU emulation for riscv64, or cross-compilation targeting riscv64 appears in any file.

**CI matrix (confirmed by direct YAML inspection of `nightly.yml` and `release.yml`):**

| Job | Runner | Trigger |
|---|---|---|
| linux-x86_64 build+test | ubuntu-latest / ubuntu-24.04 | Every commit, every PR |
| linux-aarch64 build+release | ubuntu-24.04-arm | Release builds (nightly + tagged) |
| macos-arm64 build+release | macos-15 | Release builds (nightly + tagged) |
| linux-riscv64 | **missing** | - |

**Additional CI files checked:** No `.gitlab-ci.yml`, no `Jenkinsfile`, no `.cirrus.yml` exist in the repository.

**RISE runners:** HEIR is not a RISE project. No RISE-provided riscv64 runners are used or available to this project.

**amd64 vs arm64 vs riscv64 CI comparison.**

| CI aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Build on every PR | Yes | No (release only) | No |
| Test suite on every PR | Yes | No | No |
| Nightly build | Yes | Yes | No |
| Release binary produced | Yes | Yes | No |
| Hardware type | GitHub-hosted | GitHub-hosted | N/A |
| QEMU emulation | N/A | N/A | Not configured |

---

## 8. Distribution and Release Status

**GitHub Releases.** Nightly releases (verified against releases from 2026-08-18 through 2026-08-22) ship exactly 8 assets each: binaries for `macosx_11_0_arm64`, `manylinux_2_28_aarch64`, and `manylinux_2_28_x86_64` (for both `heir-opt` and `heir-translate`), plus a source tarball and its SHA256. No riscv64 asset exists in any release.

**PyPI.** [`heir` on PyPI](https://pypi.org/project/heir/) contains a single distribution: `heir-0.0.1-py2.py3-none-any.whl`. This is a pure-Python stub wheel (architecture-agnostic). It does not contain the compiled MLIR/LLVM toolchain binaries. It would technically install on riscv64, but it does not provide a working `heir-opt` or `heir-translate` binary.

**Ubuntu 24.04 (noble).** The `heir` package does not exist in Ubuntu 24.04. Search returned no results.

**Debian.** [tracker.debian.org/pkg/heir](https://tracker.debian.org/pkg/heir) returned HTTP 404. `heir` is not tracked in Debian.

**Arch Linux RISC-V.** [archriscv.felixc.at](https://archriscv.felixc.at/?q=heir) returned no package listing for `heir`. Not packaged.

**What a user must do to get a working riscv64 binary today:** Build from source with a modified `MODULE.bazel` (add `"RISCV"` to `_LLVM_TARGETS`) using a cross-compilation toolchain that `rules_llvm` does not currently provide. This is not a documented or supported path.

---

## 9. Dependencies

**Summary table.**

| Dependency | Role | riscv64 Build | riscv64 Test | riscv64 Release | Blocking |
|---|---|---|---|---|---|
| LLVM/MLIR (pinned commit fdb39b11, 2026-08-12) | JIT codegen, MLIR dialect infrastructure | Builds upstream; HEIR excludes RISCV target | LLVM has native riscv64 CI upstream | LLVM ships riscv64 binaries | **Critical: RISCV target excluded from HEIR's MODULE.bazel** |
| OpenFHE 1.4.2.bcr.1 | FHE library (BFV, BGV, CKKS, TFHE) | Likely builds; `__int128` NTT fallback for riscv64; `WITH_NATIVEOPT` off by default | No riscv64 CI detected | Source only | No issues filed; unvalidated performance |
| tfhe-rs 1.5.0 (zama-ai) | Rust TFHE/shortint/integer FHE | Builds; `pulp` crate provides scalar fallback on riscv64 | No riscv64 CI (AWS runners: x86_64 and aarch64 only) | crates.io source only | No AVX-512/NEON equivalent; significant performance gap expected |
| poulpy-ckks / poulpy-cpu-ref 0.7.0 | Rust CKKS FHE backend | Unknown - crate not publicly visible on crates.io | Unknown | Unknown | Crate not publicly inspectable; riscv64 portability unverified |
| Lattigo v6.1.0 (tuneinsight) | Go CKKS/BGV/BFV FHE library | Builds - pure Go, no cgo, no assembly | Any GOARCH; no riscv64-specific CI slot visible | Go module (go install) | No issues; portable but unoptimized for riscv64 |
| Eigen 3.4.0.bcr.3 | Linear algebra (matmul, polynomial eval) | Builds; no RVV in this release | riscv64 CI exists upstream but on master only | No riscv64 binaries | **Version mismatch: all 13 RVV MRs are on master only; 3.4.0 has zero RISC-V SIMD** |
| Abseil-cpp 20250512.1 | C++ foundation: containers, hashing, CRC32 | Builds; stacktrace riscv64 support merged | No riscv64 CI | Source only | `hashtablez_sampler` and `cordz` SEGFAULT on Debian riscv64 ([Issue #2002](https://github.com/abseil/abseil-cpp/issues/2002), unresolved) |
| OR-Tools 9.12 | MILP solver (polynomial approximation optimization) | Builds on amd64/arm64; riscv64 untested | No riscv64 CI | Wheels for x86_64/aarch64 only | No riscv64 issues; pure C++/Go CP-SAT expected to compile but untested |
| googletest 1.17.0 | Test framework | Builds | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 ([Issue #3756](https://github.com/google/googletest/issues/3756), 2022, unresolved) | Source only | Flaky thread-count test unresolved since 2022 |
| fuzztest 20250805.0 | Coverage-guided fuzzing | Builds (C++ only) | No riscv64 CI; only x86_64 and arm64 tested | Source only | No riscv64 work ever started |
| zlib-ng 2.3.3 | Compression (LLVM bitcode, IR serialization) | Builds; RVV and Zbc paths present | riscv64 CI (GCC cross + QEMU) | Packaged Debian/Ubuntu | Code-coverage collection broken on Clang/riscv64 (non-blocking) |
| zstd 1.5.7 | Compression (LLVM IR, FHE key serialization) | Builds | QEMU Tier-3 riscv64 CI | Source only | Fast decode loop not enabled for riscv64; five open RVV PRs outstanding |
| google/benchmark 1.9.1 | Microbenchmarks | Builds | No riscv64 CI | Source only | `rdcycle` timer merged; no blocking issues |
| Yosys 0.64 (YosysHQ) | Hardware synthesis (CGGI/tfhe-rs lowering) | Builds (C++/Tcl, no ISA intrinsics) | No riscv64 CI | No riscv64 binaries | Only riscv-related issue (#5457) is about synthesizing a RISC-V CPU, not running Yosys on riscv64 |
| libffi 3.4.7.bcr.4 | JIT call glue for Python bindings | Builds; riscv64 port shipped in libffi 3.3 (2019) | Upstream CI includes riscv64 | Packaged Debian/Ubuntu | No open issues |

**Critical dependency findings:**

1. **LLVM RISCV target excluded (blocking).** HEIR's `MODULE.bazel` lists only `"X86"` and `"AArch64"` as LLVM backend targets. Without adding `"RISCV"`, MLIR cannot emit riscv64 machine code. Separately, LLVM has an open miscompile at -O2 on riscv64 ([llvm/llvm-project#80792](https://github.com/llvm/llvm-project/issues/80792)) and a CIR riscv64 null pointer exception ([llvm/llvm-project#215017](https://github.com/llvm/llvm-project/issues/215017)).

2. **Eigen version gap (blocking for vectorization).** HEIR pins Eigen 3.4.0.bcr.3. All 13 RVV merge requests are on Eigen master only. The pinned version has zero RISC-V SIMD support. A separate heap corruption bug in RVV at -O1/Clang 20.1 ([Eigen Issue #2930](https://gitlab.com/libeigen/eigen/-/work_items/2930)) exists on master. Upgrading Eigen is required to gain any riscv64 vectorization.

3. **OpenFHE and tfhe-rs: portable, unvalidated.** Both use software fallback paths on riscv64 (OpenFHE via `__int128` NTT in `ubintnat.h`; tfhe-rs via `pulp` scalar fallback). Correctness is expected but not tested. Performance degradation vs amd64 is unquantified.

4. **Abseil-cpp hashtable SEGFAULT (minor blocker).** [Issue #2002](https://github.com/abseil/abseil-cpp/issues/2002) remains unresolved. Affects `hashtablez_sampler` and `cordz` telemetry paths. Programs using default production settings (sampling disabled) are unaffected, but the issue is unresolved upstream.

5. **poulpy crates: unknown status.** `poulpy-ckks` and `poulpy-cpu-ref` at version 0.7.0 are not publicly visible on crates.io. Their riscv64 portability cannot be assessed without access to the source.

---

## 11. Known Bugs and Active Issues

No riscv64-specific bugs exist (none have been filed). The table below covers active correctness and performance bugs that would affect any riscv64 deployment:

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#3022](https://github.com/google/heir/issues/3022) | Add an end-to-end correctness test for ckks.relinearize | Open | Medium | Missing test coverage, not a confirmed bug |
| [#3196](https://github.com/google/heir/issues/3196) | OpenFhePkeEmitter tensor.insert emission aliases SSA result | Open | High | Emitter correctness bug |
| [#3195](https://github.com/google/heir/issues/3195) | openfhe-alloc-to-inplace overwrites value which has uses | Open | High | Data corruption in optimization pass |
| [#3189](https://github.com/google/heir/issues/3189) | Convert to ciphertext semantics incorrectly converts rotation shift | Open | High | Semantic correctness bug in rotation |
| [#2553](https://github.com/google/heir/issues/2553) | WrapGeneric forces output to secret type, leading to crashes | Open | High | Labeled bug + good first issue |
| [#2545](https://github.com/google/heir/issues/2545) | BGV noise analysis fails for trivial program | Open | High | Analysis correctness |
| [#2709](https://github.com/google/heir/issues/2709) | Configure OpenFHE for sparse packing properly | Open | Medium | OpenFHE backend misconfiguration |
| [#505](https://github.com/google/heir/issues/505) | Type materialization bug when lowering polynomial to standard | Open | High | Long-standing lowering correctness bug |
| [#519](https://github.com/google/heir/issues/519) | Vectorizer tests flake due to nondeterminism | Open | Low | Test reliability |
| [#2008](https://github.com/google/heir/issues/2008) | Slow input example for loop over dot products | Open | Medium | Performance regression |
| [#3304](https://github.com/google/heir/pull/3304) | fix poly approximation segfault from float cast assertion | Merged 2026-08-13 | High | Fixed segfault in polynomial approximation lowering |

All bugs above are architecture-agnostic. None are riscv64-specific because riscv64 has never been tested.

**Dependency-level bugs affecting riscv64 specifically:**

| Dependency | Issue | Status |
|---|---|---|
| LLVM | Miscompile at -O2 on riscv64 ([#80792](https://github.com/llvm/llvm-project/issues/80792)) | Open |
| LLVM | CIR riscv64 NPE ([#215017](https://github.com/llvm/llvm-project/issues/215017)) | Open |
| Abseil-cpp | `hashtablez_sampler` SEGFAULT on Debian riscv64 ([#2002](https://github.com/abseil/abseil-cpp/issues/2002)) | Open |
| googletest | `GetThreadCountTest.ReturnsCorrectValue` fails on riscv64 ([#3756](https://github.com/google/googletest/issues/3756)) | Open since 2022 |
| Eigen (master) | Heap corruption in RVV at -O1/Clang 20.1 ([#2930](https://gitlab.com/libeigen/eigen/-/work_items/2930)) | Open |

---

## 12. Objections and Upstream Blockers

**Organizational blockers.**

The two-Googler approval requirement is the primary organizational constraint. Any PR to add riscv64 CI, modify `MODULE.bazel` for the RISCV target, or update the release matrix requires at least two Google employees to approve. External contributors cannot merge changes unilaterally. A successful riscv64 effort requires either Google internal sponsorship or a sustained external lobbying effort to get a Google maintainer to co-own the work.

There is no stated objection to riscv64 (no issues or discussions mention it), which means there is also no stated interest. The project has not considered the question.

**Technical blockers.**

1. RISCV backend excluded from `MODULE.bazel` `_LLVM_TARGETS`. Mechanical fix, but requires Google approval.
2. `rules_llvm` version 0.8.9 does not provide a riscv64 hermetic sysroot or cross-toolchain. This may require changes to an upstream Bazel module not owned by HEIR.
3. No GitHub-hosted riscv64 runner is available (GitHub Actions does not offer hosted riscv64). A self-hosted runner or QEMU emulation step is required for CI.
4. The `poulpy-ckks` / `poulpy-cpu-ref` crates are not publicly accessible, making their riscv64 status opaque.
5. Eigen 3.4.0 (pinned) has no riscv64 SIMD. Vectorized FHE polynomial operations will run in scalar mode until Eigen is upgraded.
6. Abseil-cpp hashtable SEGFAULT ([#2002](https://github.com/abseil/abseil-cpp/issues/2002)) is unresolved upstream. Low risk in practice but needs upstream resolution before HEIR's riscv64 CI can be green.

**Acceptance probability.** Low without Google internal sponsorship. Medium if a Google team (e.g., the Google RISC-V team or a GCP riscv64 initiative) decided to fund the effort internally, since the two-Googler gate would then be cleared from within.

---

## 13. Investment Analysis

RISE has no involvement with HEIR. No RISE-funded work on HEIR for riscv64 has been done or is in progress. All work described below is unstarted.

### 13.1 Functional Enablement

The minimal change to make HEIR build and run on riscv64 is:
1. Add `"RISCV"` to `_LLVM_TARGETS` in `MODULE.bazel`.
2. Obtain or build a riscv64 hermetic sysroot for `rules_llvm`, either by contributing it upstream or by using a non-hermetic build with a system Clang.
3. Validate that `heir-opt` and `heir-translate` produce correct output for each supported backend (OpenFHE, Lattigo, tfhe-rs) on riscv64.
4. Resolve or characterize the `poulpy-ckks` / `poulpy-cpu-ref` crate riscv64 status.

The correctness bugs in HEIR itself (#3196, #3195, #3189) are pre-existing on all platforms and not riscv64-specific; they should be addressed independently.

### 13.2 Performance Optimization

HEIR does not contain architecture-specific performance code; all performance work would be in the downstream FHE libraries. Within HEIR's dependency tree:
- Eigen: upgrade from 3.4.0 to a post-RVV-merge version (or future 4.x) to get vectorized polynomial operations on riscv64.
- tfhe-rs: wait for or contribute RVV SIMD dispatch in the `pulp` crate; currently scalar-only on riscv64.
- OpenFHE: `WITH_NATIVEOPT` disabled by default; validate performance of the `__int128` NTT path on riscv64 hardware; contribute RVV-optimized NTT if needed.

Performance benchmarks for HEIR itself on any architecture do not exist publicly; establishing a baseline on amd64 before measuring riscv64 would be a prerequisite for any performance claim.

### 13.3 CI/CD Infrastructure

A riscv64 CI tier requires:
- A self-hosted riscv64 runner attached to the google/heir GitHub Actions, OR a QEMU emulation step added to the existing matrix.
- Google maintainer approval to merge the workflow change.
- Resolution of the abseil-cpp hashtable SEGFAULT and googletest thread-count test failure before the CI can be expected to stay green.

### 13.4 Ecosystem Enablement

HEIR has no dependent package ecosystem requiring separate enablement. Section 10 is omitted per scope rules.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Add `"RISCV"` to `_LLVM_TARGETS` in `MODULE.bazel` | 0.5 | External contributor + Google reviewer | Critical |
| Functional | Provide riscv64 hermetic sysroot for `rules_llvm` 0.8.9 or switch to non-hermetic build | 3-6 | External contributor; may require upstream `rules_llvm` change | Critical |
| Functional | Validate OpenFHE, Lattigo, tfhe-rs backends on riscv64 (build + correctness) | 2-4 | External contributor | High |
| Functional | Determine riscv64 portability of `poulpy-ckks` / `poulpy-cpu-ref` crates | 1 | External contributor (requires crate source access) | High |
| CI/CD | Add riscv64 runner (self-hosted or QEMU) to GitHub Actions matrix | 2-3 | External contributor + Google reviewer | High |
| CI/CD | Resolve abseil-cpp hashtable SEGFAULT ([#2002](https://github.com/abseil/abseil-cpp/issues/2002)) upstream | 2-4 | abseil-cpp maintainers (external to HEIR) | Medium |
| Performance | Upgrade Eigen from 3.4.0 to post-RVV version | 1-2 | External contributor + Google reviewer | Medium |
| Performance | Establish amd64 HEIR benchmark baseline (no public benchmarks exist) | 1 | External contributor | Medium |
| Performance | Characterize riscv64 FHE performance vs amd64 on OpenFHE CKKS benchmarks | 2-3 | External contributor | Medium |
| Performance | Contribute RVV SIMD to tfhe-rs `pulp` crate | 4-8 | tfhe-rs/zama-ai (external to HEIR) | Low |

Total estimated effort for functional enablement (critical + high items): approximately 9-18 person-weeks, contingent on Google maintainer engagement. The dominant uncertainty is the `rules_llvm` hermetic toolchain gap - this is an external dependency with its own upstream review process.

---

## 14. Updates

No updates yet - initial report dated 2026-06-17.

---

## 15. References

- [HEIR GitHub repository](https://github.com/google/heir)
- [HEIR project homepage](https://heir.dev/)
- [HEIR paper on arXiv (arXiv:2508.11095)](https://arxiv.org/abs/2508.11095)
- [HEIR MODULE.bazel (Bazel build configuration)](https://github.com/google/heir/blob/main/MODULE.bazel)
- [HEIR pyproject.toml (Python wheel build config)](https://github.com/google/heir/blob/main/pyproject.toml)
- [HEIR nightly.yml CI workflow](https://github.com/google/heir/blob/main/.github/workflows/nightly.yml)
- [HEIR build_and_test.yml CI workflow](https://github.com/google/heir/blob/main/.github/workflows/build_and_test.yml)
- [HEIR GitHub Releases](https://github.com/google/heir/releases)
- [heir on PyPI](https://pypi.org/project/heir/)
- [HEIR issue #847 (SPIRV false positive, closed)](https://github.com/google/heir/issues/847)
- [HEIR issue #3196 (OpenFhePkeEmitter tensor.insert aliases SSA result)](https://github.com/google/heir/issues/3196)
- [HEIR issue #3195 (openfhe-alloc-to-inplace overwrites value with uses)](https://github.com/google/heir/issues/3195)
- [HEIR issue #3189 (rotation shift conversion bug)](https://github.com/google/heir/issues/3189)
- [HEIR issue #2553 (WrapGeneric crash)](https://github.com/google/heir/issues/2553)
- [HEIR issue #2545 (BGV noise analysis bug)](https://github.com/google/heir/issues/2545)
- [HEIR issue #3304 (fix poly approximation segfault, merged 2026-08-13)](https://github.com/google/heir/pull/3304)
- [LLVM riscv64 miscompile at -O2 (#80792)](https://github.com/llvm/llvm-project/issues/80792)
- [LLVM CIR riscv64 NPE (#215017)](https://github.com/llvm/llvm-project/issues/215017)
- [Abseil-cpp hashtablez SEGFAULT on riscv64 (#2002)](https://github.com/abseil/abseil-cpp/issues/2002)
- [googletest riscv64 thread count test failure (#3756)](https://github.com/google/googletest/issues/3756)
- [Eigen RVV heap corruption at -O1/Clang 20.1 (#2930)](https://gitlab.com/libeigen/eigen/-/work_items/2930)
- [RISE project member list](https://riseproject.dev/members/)
- [RISE project blog](https://riseproject.dev/blog)
- [Arch Linux RISC-V package tracker](https://archriscv.felixc.at/)
- [Debian package tracker - heir (404)](https://tracker.debian.org/pkg/heir)