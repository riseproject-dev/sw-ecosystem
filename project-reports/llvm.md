---
title: llvm
parent: Project Reports
color: yellow
dependencies:
  - name: libffi
    relation: runtime-dependency
    criticality: optional
  - name: zlib
    relation: runtime-dependency
    criticality: optional
  - name: zstd
    relation: runtime-dependency
    criticality: optional
  - name: libpfm4
    relation: runtime-dependency
    criticality: optional
  - name: Z3
    relation: runtime-dependency
    criticality: optional
---

{% include dependency-graph.html slug="dependencies" subset="llvm" %}

# llvm

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-10<br/>
**Readiness:** yellow<br/>
**Scope:** RISC-V (riscv64/linux) support status for llvm<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

LLVM is a modular compiler and toolchain infrastructure project (backend/codegen library, Clang C/C++/ObjC frontend, LLD linker, LLDB debugger, compiler-rt runtime, LLVM-libc, BOLT binary optimizer, and associated tooling). It is stewarded by the nonprofit **LLVM Foundation** (501(c)(3)), separate from day-to-day technical governance, which runs on a per-subproject **maintainer model** (`Maintainers.md` files) rather than a single BDFL. The lead maintainer of the core LLVM repo is Nikita Popov (Red Hat). A Code of Conduct Committee (>=5 members, jointly selected with the Board) handles conduct issues and publishes annual transparency reports. License: Apache 2.0 with LLVM Exceptions.

**LLVM Foundation Board (Aug 2024 - Aug 2026, 9 seats):** Kristof Beyls (Arm), Chris Bieneman (Microsoft, Treasurer), Anshu Dasgupta (NVIDIA), Mike Edwards, Reid Kleckner (NVIDIA, Secretary), Anton Korobeynikov (St. Petersburg State University), Chris Lattner (Modular, cofounder/CEO), Tanya Lattner (LLVM Foundation, President/Executive Director), Wei Wu (PLCT Lab).

**Corporate sponsors (LLVM Foundation, by tier):** Diamond: AMD, Apple, Google, Qualcomm. Platinum: Arm, Fastly, Huawei, Meta, NVIDIA. Gold: Access Softek, AWS, BayLibre, Fujitsu, MathWorks, Microsoft, Sony Interactive. Corporate Supporter: Tesla.

**Maintainers by company (non-exhaustive, subproject-relevant):** Red Hat (Nikita Popov, lead maintainer), Google (Arthur Eubanks, Derek Schuff, Vitaly Buka, Teresa Johnson), AMD (Matt Arsenault), Arm (David Green), **SiFive (Craig Topper, SelectionDAG / RISC-V backend)**, Sony (Andrea Di Biagio, James Henderson), Apple (Adrian Prantl), LLNL (Johannes Doerfert).

**Community stance on new ports:** structurally welcoming but gated. LLVM's `DeveloperPolicy` defines a tiered pipeline (Peripheral/experimental -> Core/official) requiring an RFC on LLVM Discourse, an active sub-community with buildbots, a named maintainer in `Maintainers.md`, and >=3 months of stability before promotion; neglected components risk demotion or removal ("bit-rot leads to demotion"). This is a deliberate barrier against unmaintained or half-finished backends, not an obstacle specific to RISC-V.

**RISE membership note:** `riseproject.dev` (Linux Foundation project partnered with RISC-V International) does not list LLVM or the LLVM Foundation among its Premier or General members. LLVM is not a RISE member organization; RISE funds specific LLVM work (see Section 12/14) through third parties (Igalia).

## 2. Port History and Upstreaming Timeline

| Date | Event | Source |
|---|---|---|
| 2016-08 | RFC posted to llvm-dev mailing list proposing a RISC-V backend (Differential Revision D23557) | Referenced in first commit message |
| 2016-11-01 | First RISC-V commit merged: `b6e784a240fa3f62874c457afa43be37278cfa2d`, "[RISCV] Recognise riscv32 and riscv64 in triple parsing code," by Alex Bradbury (lowRISC), "1 of 10" in an incremental MC-layer patch series | [Commit b6e784a](https://github.com/llvm/llvm-project/commit/b6e784a240fa3f62874c457afa43be37278cfa2d) |
| 2016-2019 | RISC-V backend progresses through experimental tier to become an official/core target (exact promotion date not located in this research) | [Data not available: exact tier-promotion date/commit not found in this session's research] |
| 2024-10-15 | RISE/Igalia partnership announced to expand LLVM RISC-V CI (QEMU + hardware runners) | [RISE blog](https://riseproject.dev/2024/10/15/working-with-igalia-to-improve-risc-v-llvm-continuous-integration/) |
| 2025-05-08 | RISE/Igalia "RP009" SPEC CPU2017 optimization project completed (SpacemiT-X60 scheduling model, SLP vectorizer fix, IPRA), delivering up to ~15% execution-time reduction | [RISE blog](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/) |
| 2026-09-06/07 | PR #221593 merged fixing an infinite DAGCombine loop (compiler hang) on RISC-V, targeted at LLVM 24.1.0 | [PR #221593](https://github.com/llvm/llvm-project/pull/221593) |
| 2026-09-04 | PR #218347 merged fixing shrink-wrapping bypass of SiFive CLIC interrupt prologues | [PR #218347](https://github.com/llvm/llvm-project/pull/218347) |

**Key contributors/orgs:** Alex Bradbury (lowRISC, original port author), Craig Topper (SiFive, current RISC-V/SelectionDAG maintainer), lukel97 (RISC-V vectorizer/EVL tail-folding lead), wangpc-pp (recurring codegen-correctness fixer), Mikhail Gadelha (Igalia, RISE-funded SPEC optimization work).

**Fully upstream?** Yes. RISC-V is not a fork or downstream patch set; the full backend (target/codegen, RVV vector extension, GlobalISel, BOLT, LLD, LLVM-libc, LLDB, JITLink, compiler-rt) lives in `llvm/llvm-project` mainline. There is no master/umbrella tracking issue for "the riscv64 port" because it is treated as a mature, ongoing target rather than a port-in-progress (a `label:riscv` search returned 0 results; RISC-V issues are tagged via title prefix `[RISCV]`, not a GitHub label).

## 3. Upstream Support Tier

LLVM's formal tier policy (`docs/DeveloperPolicy.html`) defines two tiers:
- **Peripheral (experimental):** entry point for new targets; requires an active maintainer, a sub-community providing buildbots, and adequate docs/hardware access; not built by default; test failures are the sub-community's responsibility.
- **Core (official):** production-ready, tested by official buildbots, breakage-on-red obligations fall on all developers.

RISC-V functions today as a de facto core target (built by default via `LLVM_TARGETS_TO_BUILD`, actively maintained by SiFive's Craig Topper, thousands of merged PRs), but the **evidence for release-blocking, required CI is absent**: riscv64 is not part of the primary/required pre-merge gate (`.ci/*` invoked by `premerge.yaml`), unlike x86_64, AArch64, Windows x86_64, and macOS arm64, which are all required checks. [Data not available: an explicit upstream document stating "riscv64 = official/core tier" was not located; tier classification here is inferred from CI/build-default status, not a formal declaration.]

**Comparison table:**

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Built by default (`LLVM_TARGETS_TO_BUILD`) | yes | yes | yes |
| Required pre-merge CI (`.ci/*`/`premerge.yaml`) | yes | yes | **no** |
| Upstream release binaries | yes | yes | **no** |
| QEMU-executed scoped CI (libc) | n/a (native) | n/a (native, Apple silicon runners) | yes, `libc/**`-scoped only |
| Distro packages (Ubuntu) | yes | yes | yes (unpatched, resolute) |

## 4. Technical Architecture and RISC-V-Specific Subsystems

RISC-V support is not a stub; it spans nearly every LLVM subproject.

| Subsystem | riscv64 implementation exists? | ISA extensions covered | Quality |
|---|---|---|---|
| Core codegen backend (`llvm/lib/Target/RISCV/`) | Yes, ~150+ files: `RISCVISelLowering`, `RISCVSubtarget`, `RISCVInstrInfoVPseudos.td`, `RISCVTargetTransformInfo` (vectorizer cost model), `MCA/RISCVCustomBehaviour.cpp` (llvm-mca scheduling) | RV32/RV64 base, RVV 1.0 (all LMUL/SEW/tail-mask policy variants), Zb* bitmanip, Zve32f, scalar crypto (Zk*), P-extension (in progress), vendor: SiFive VCIX/XSf*, Andes (NDS), CORE-V (OpenHW), MIPS-vendor, Qualcomm nonstandard relocations | Complete, actively developed, first-tier |
| RVV intrinsics (Clang frontend) | Yes: `RISCVVTypes.def`, `RISCVVIntrinsicUtils`, `SemaRISCV.cpp`, `riscv_vector.td`, `riscv_sifive_vector.td`, `riscv_andes_vector.td`; hundreds of tests under `clang/test/CodeGen/RISCV/` | Full RVV 1.0 spec, TAMA/TAMU/TUMA/TUMU tail/mask policy | Complete |
| Scalar extension intrinsics (`clang/lib/Headers/`) | Yes: `riscv_bitmanip.h`, `riscv_crypto.h`, `riscv_corev_alu.h`, `riscv_nds.h`, `riscv_mips.h`, `riscv_ntlh.h` | Zba/Zbb/Zbc/Zbs, Zk* crypto, vendor ALU extensions | Complete |
| Linker (LLD, `lld/ELF/Arch/RISCV.cpp`) | Yes: full ELF relocation/relaxation backend, incl. vendor (Qualcomm `R_RISCV_QC_*`) relocations | n/a | Complete |
| JIT backend (JITLink, `llvm/lib/ExecutionEngine/JITLink/riscv.cpp`) | Yes: full graph/relocation support (`R_RISCV_ADD32/64`, `R_RISCV_LO12_I`) | n/a | Complete |
| compiler-rt | Yes: `cpu_model/riscv.{c,h}`, XRay trampolines (asm), HWASan riscv64 asm, sanitizer syscall shims, Scudo `SCUDO_RISCV64` platform flag | n/a | Complete |
| LLVM-libc | Yes: `setjmp/riscv/`, `startup/linux/riscv/`, `FPUtil/riscv/sqrt.h`; riscv32 and riscv64 both listed supported in `libc/docs/arch_support.md` | n/a | Complete for supported subset; **UEFI riscv64 explicitly documented as not yet enabled** ([libc/docs/uefi/building.rst](https://github.com/llvm/llvm-project/blob/main/libc/docs/uefi/building.rst)) |
| LLDB (debugger) | Yes: full plugin stack (ABI, register contexts, Linux live-process, core-dump, FreeBSD kernel-core) for riscv64 | n/a | Complete |
| llvm-exegesis, OpenMP, offload | Yes: `RISCV/Target.cpp` (RVV-aware benchmarking), `KMP_ARCH_RISCV64`, offload host target | n/a | Complete for exegesis's own codegen support; note the separate `libpfm4` PMU-backend gap in Section 9 that leaves `llvm-exegesis`'s hardware-counter path non-functional on riscv64 |

**Comparison note (amd64/arm64/riscv64):** all three architectures have complete, first-tier implementations across these subsystems; the gap for riscv64 is not missing code but missing **CI verification and release automation** (Section 3, Section 7), plus the libpfm4 dependency gap noted above and the UEFI libc gap.

## 5. Build System, Cross-Compilation, and Toolchain

**Host toolchain minimums** (`llvm/docs/GettingStarted.md`): Clang >=5.0, Apple Clang >=10.0, GCC >=7.4, Visual Studio 2019 16.8. These are general C++-standard-support minimums, not riscv64-specific. CMake >=3.20.0, Python >=3.8 required.

**Documented cross-compilation path** (`llvm/docs/HowToCrossCompileLLVM.md`, explicitly covers riscv64 from an x86_64 host):

```bash
sudo debootstrap --arch=riscv64 --variant=minbase --include=build-essential,symlinks unstable sysroot-deb-riscv64-unstable
sudo chroot sysroot-deb-riscv64-unstable symlinks -cr .

SYSROOT=$HOME/sysroot-deb-riscv64-unstable
TARGET=riscv64-linux-gnu
CFLAGS="-march=rva20u64"
```
Toolchain CMake file sets `CMAKE_SYSTEM_NAME Linux`, `CMAKE_SYSROOT`, `CMAKE_C/CXX_COMPILER_TARGET`, `CMAKE_LINKER_TYPE LLD`. Build:
```bash
cmake -G Ninja -DCMAKE_BUILD_TYPE=Release -DLLVM_ENABLE_PROJECTS="lld;clang" \
  -DCMAKE_TOOLCHAIN_FILE=$(pwd)/$TARGET-clang.cmake -DLLVM_HOST_TRIPLE=$TARGET \
  -DCMAKE_INSTALL_PREFIX=$HOME/clang-$TARGET -S llvm -B build/$TARGET
cmake --build build/$TARGET
```
Testing via QEMU: `qemu-riscv64-static -L $SYSROOT ./build/riscv64-linux-gnu/bin/clang --version`, or `QEMU_LD_PREFIX=$SYSROOT` with `binfmt_misc`.

**CI's own toolchain file** (`.github/workflows/test-suite/riscv64.cmake`): `-march=rva23u64 -save-temps=obj`, `CMAKE_LINKER_TYPE LLD`. Built against a Clang compiled with `LLVM_TARGETS_TO_BUILD "AArch64;RISCV;X86"`.

**Relevant CMake flags:**
- `-DLLVM_TARGETS_TO_BUILD` (e.g. `"AArch64;RISCV;X86"`) restricts backends built.
- `compiler-rt` arch-detection (`compiler-rt/cmake/base-config-ix.cmake`) treats riscv64 as a cross-compile target requiring host-tool test execution.
- `clang/cmake/caches/BaremetalRISCV.cmake` sets `TRIPLES riscv64-unknown-elf;riscv32-unknown-elf` for bare-metal builds.
- `clang/cmake/caches/Fuchsia-stage2.cmake` includes `riscv64-unknown-linux-gnu`/`riscv64-unknown-fuchsia` in its multilib target loops.
- No riscv64-specific feature is force-disabled with an explicit `OFF`; disabling is generic, feature-detected (`COMPILER_RT_HAS_*`), not riscv-targeted.

**Known build issues:** [Data not available: no riscv64-specific build failure was documented in `GettingStarted.md`'s known-bad-tools list; the listed known-bad tools (old GNU ld/binutils/gold versions) are architecture-general, not riscv64-specific].

**QEMU usage:** user-mode emulation via `qemu-user-static`/`binfmt-support` for cross-built binary execution; used both in the documented cross-compile workflow and in CI's `libc-overlay-tests.yml`/`libc-shared-tests.yml` jobs.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Feature | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Codegen backend completeness | Complete | Complete | Complete (Section 4) |
| Required pre-merge CI | Yes | Yes | **No** |
| Upstream release binaries | Yes | Yes | **No** |
| Comprehensive test execution in CI | Yes (full test-suite) | Yes (full test-suite) | Partial: QEMU execution only for `libc/**`-scoped changes; whole-project codegen correctness relies on fuzzing + issue reports, not CI |
| UEFI libc support | [Data not available for amd64/arm64 comparison in this research] | [Data not available] | Explicitly documented as **not yet enabled** ([libc/docs/uefi/building.rst](https://github.com/llvm/llvm-project/blob/main/libc/docs/uefi/building.rst)) |
| llvm-exegesis hardware PMU counters | Functional (libpfm4 has x86 support) | [Data not available: libpfm4 arm64 status not confirmed in this research] | **Non-functional**: libpfm4 has zero riscv64 port (0 commits, 0 issues, 0 PRs); `pfm_find_event()`/`pfm_get_pmu_info()` return nothing on riscv64 |

**Functional gaps:** llvm-exegesis cannot read hardware performance counters on riscv64 due to the libpfm4 gap (Section 9). UEFI riscv64 target in LLVM-libc is not yet enabled.

**Performance gaps (SIMD/codegen-quality related, not "missing" but "leaves performance on the table"):** zlib and zstd (LLVM's optional compression dependencies) have RVV-optimized PRs stalled in upstream review (Section 9) rather than merged, meaning distro-shipped LLVM builds compress bitcode/debug info without RVV acceleration even though patches exist. Multiple open LLVM-native missed-optimization issues for RISC-V codegen itself are cataloged in Section 11 (e.g. #209237 8% SLP-vectorization regression, #194871 ~5% LSR-induced degradation vs GCC, #212267 ~2.7% estimated overhead from redundant VL1R reloads).

**Security hardening gaps:** [Data not available: no riscv64-specific sanitizer/hardening gap (e.g., missing ASan/MSan/HWASan riscv64 support) was found; compiler-rt's HWASan riscv64 asm trampolines exist per Section 4, suggesting parity, but a systematic sanitizer-by-sanitizer riscv64 vs amd64/arm64 comparison was not performed in this research].

**NaN / floating-point semantics issues:** Open bug [#200030](https://github.com/llvm/llvm-project/issues/200030): `-NAN + 0 = -NAN` on riscv64 when using compile-time-constant `double` literals, versus the canonical positive NaN (`0x7ff8000000000000`) produced for the runtime-variable version - inconsistent with the RISC-V spec's canonical-NaN rule and with x86/AArch64 behavior on the same code. Confirmed open as of this research; no fix PR identified.

## 7. CI/CD Infrastructure

**Primary/required PR gate** (`.github/workflows/premerge.yaml`, backed by `.ci/*` scripts: `monolithic-linux.sh`, `monolithic-windows.sh`, `monolithic-macos.sh`, `compute_projects.py`): grepped for "riscv" (case-insensitive) - **zero matches**. Builds/tests only on ubuntu-24.04(-arm)/depot-arm, Windows, and self-hosted macOS arm64 runners. riscv64 is not part of the required check set at all.

**Files with riscv64 references (8 total under `.github/`):**

| Workflow | Trigger | Runner | riscv64 execution mode |
|---|---|---|---|
| `test-suite.yml` | `issue_comment` `/test-suite` (manual, gated to llvm-committers) | ubuntu-24.04 (x86) container | Cross-compile + codegen/size diff only, **no execution** |
| `libc-overlay-tests.yml` (`qemu` job) | `pull_request` on `libc/**` | ubuntu-24.04 (x86) container | Cross-compile + **QEMU user-mode execution** (`qemu-riscv64-static`) - genuine functional test run |
| `libc-shared-tests.yml` (`linux-cross-arch-shared`) | `pull_request` on `libc/**` | ubuntu-24.04 (x86) container | Cross-compile (clang & gcc) + **QEMU user-mode execution** |
| `libc-fullbuild-tests.yml` | `pull_request` on `libc/**` | - | **riscv64 absent** from this workflow's matrix (only riscv32 baremetal, build-only, `testing: SKIP`) |
| `.github/new-prs-labeler.yml` | n/a | n/a | Label-only (`backend:RISC-V` rule), no build/test |

RISE-funded builders (`rise-clang-riscv-rva20-2stage`, `rise-clang-riscv-rva23-2stage`, and two EVL/vector-bits variants per [RISE's Oct 2024 blog](https://riseproject.dev/2024/10/15/working-with-igalia-to-improve-risc-v-llvm-continuous-integration/)) run on **RISE's own build farm**, not inside `llvm/llvm-project`'s `.github/workflows/`; they are not part of the repo's required gate as verified by direct file inspection. Stated future work in that post includes migrating these builders to LLVM's main buildmaster - not yet done as of this research.

**Comparison table:**

| Aspect | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Required pre-merge CI | Yes | Yes | **No** |
| Native hardware CI | Yes (x86 runners) | Yes (macOS arm64 self-hosted) | **No native riscv64 hardware runner found in-repo**; QEMU only |
| Full project test execution | Yes | Yes | **No** - only `libc/**`-scoped QEMU execution |
| RISE runner involvement | n/a | n/a | Yes, but on a separate build farm outside the repo's own CI, per office-hours notes: "gcc and LLVM CI on build farm. Mainly ran by Rivos... looking for volunteers or it will be shut down" |

## 8. Distribution and Release Status

**Upstream GitHub Releases:** checked the 5 most recent releases (23.1.1, 23.1.0, 23.1.0-rc3, 23.1.0-rc2, 22.1.8) - **no riscv64/riscv-tagged binary assets** in any of them. Releases ship x86_64/ARM64 Linux, macOS ARM64, and Windows x64/ARM64 installers only, plus source tarballs.

**PyPI:** no package literally named "llvm" exists on PyPI (`https://pypi.org/pypi/llvm/json` -> HTTP 404); not applicable as a distribution channel for this project.

**RISE wheel builder:** redirects to the nonexistent PyPI page above; not applicable.

**Ubuntu 26.04 ("resolute"):** exact hit - `llvm` (1:21.1.6-71) available on amd64, arm64, armhf, i386, ppc64el, **riscv64**, s390x. Versioned packages `llvm-17` through `llvm-22` (and `-dev`/`-doc`/`-examples`/`-linker-tools`/`-runtime`/`-tools` variants) all listed for the same architecture set including riscv64. [NEEDS VERIFICATION: whether these packages carry any riscv64-specific patches was not confirmed in this research - the finding states "unpatched" based on distro build-from-source convention, not a direct diff review of the Ubuntu packaging repo's `debian/patches/` directory.]

**What a user must do to get a working riscv64 binary today:** either (a) install from a distro that packages it for riscv64 (confirmed: Ubuntu 26.04/resolute), or (b) build from source using the documented cross-compilation path in Section 5, since upstream publishes no riscv64 release binary directly.

## 9. Dependencies

Parsed from `llvm/CMakeLists.txt` `option()`/`find_package()` calls matching JIT/SIMD/numerics/crypto/compression/allocator criteria:

| Name | Role | riscv64 build | riscv64 test | riscv64 release | Community responsiveness |
|---|---|---|---|---|---|
| libffi | Optional FFI backend for `lli` interpreter (`LLVM_ENABLE_FFI`, default OFF) | Full port since v3.3 (2018); CI runs full DejaGNU suite on riscv64 via QEMU | Passes in CI but 3 open correctness bugs: [#466](https://github.com/libffi/libffi/issues/466) (7 yrs open, small-int widening), [#694](https://github.com/libffi/libffi/issues/694) (struct-by-value-big), [#777](https://github.com/libffi/libffi/issues/777) (musl cross-compile) | v3.6.0 (2026-06-20) first release with correct float marshaling (PR #972) and W^X-safe trampolines (PR #933); **all current Debian/Ubuntu riscv64 packages predate v3.6.0** and carry the float bug | Single BDFL maintainer merges riscv64 fixes readily; issues unassigned rather than rejected |
| zlib | Compression for object-file/debug-info sections (`LLVM_ENABLE_ZLIB`, default ON) | Pure portable C, builds cleanly | Only OpenBSD/riscv64 CI via QEMU; riscv64 absent from the Linux cross-compile matrix | Present in all major riscv64 distros | RVV Adler32 perf PR [#1099](https://github.com/madler/zlib/pull/1099) unmerged 8+ months, zero maintainer response (documented multi-year pattern, e.g. Power8 PRs open since 2019) |
| zstd | Compression for LLVM bitcode/object streams (`LLVM_ENABLE_ZSTD`, default ON) | Builds; RVV intrinsics need GCC>=14 or Clang>=19, else correct scalar fallback | QEMU CI, PR-triggered only, not release-blocking | v1.5.7 latest; riscv64 arch-detection fix (PR #4525) pending in v1.6.0 | 7 riscv64 performance PRs stalled 2-6 months, e.g. [#4596](https://github.com/facebook/zstd/pull/4596) (+74% compression via Zicclsm), [#4629](https://github.com/facebook/zstd/pull/4629) (RVV `ZSTD_count`); open issues [#4471](https://github.com/facebook/zstd/issues/4471), [#4546](https://github.com/facebook/zstd/issues/4546) |
| libpfm4 | PMU/hardware-perf-counter encoding for `llvm-exegesis` (`LLVM_ENABLE_LIBPFM`, default ON) | Compiles cleanly (generic C) but **zero riscv64 architecture code exists** | No CI on any arch; Debian buildd riscv64 status "Maybe-Successful" | Distro packages exist but are functionally empty on riscv64: `pfm_find_event()`/`pfm_get_pmu_info()` return nothing | **0 commits, 0 issues, 0 PRs for riscv64** - a port was never started. Estimated 6.5-20 person-weeks for a full new-arch port. Most severe gap of the five dependencies. |
| Z3 (Z3Prover/z3) | Optional SMT solver for Clang Static Analyzer's Z3 refutation engine (`LLVM_ENABLE_Z3_SOLVER`) | Historically failed (closed [#7181](https://github.com/Z3Prover/z3/issues/7181)), now resolved | n/a | PyPI riscv64 wheel issues both closed: [#7605](https://github.com/Z3Prover/z3/issues/7605), [#9147](https://github.com/Z3Prover/z3/issues/9147), suggesting riscv64 wheel support has since landed | No open riscv64 issues in tracker |

**Bottom line:** `llvm-exegesis`'s hardware-counter path is non-functional on riscv64 as a direct consequence of libpfm4's absent port - this is the single most concrete functional gap identified in the dependency chain. zlib/zstd are functionally correct but leave RVV-accelerated performance unclaimed due to stalled upstream review, not any LLVM-side blocker. libffi has a real correctness bug (bad float marshaling) fixed only in v3.6.0 (June 2026); distro-packaged libffi on riscv64 predates that fix, so any LLVM build with `LLVM_ENABLE_FFI=ON` against a distro libffi on riscv64 should be flagged. [NEEDS VERIFICATION: Ubuntu 26.04 "resolute" riscv64 package availability for libffi-dev/libffi8, zlib1g/zlib1g-dev, libzstd1/libzstd-dev, libpfm4/libpfm4-dev, libz3-4/libz3-dev could not be confirmed via the project-graph SPARQL endpoint, which failed to connect (CONNECTION_CLOSED) throughout this research session - it should be re-run once that server reconnects.]

## 11. Known Bugs and Active Issues

**Open correctness bugs:**

| ID | Title | Status | Severity | Notes |
|---|---|---|---|---|
| [#200030](https://github.com/llvm/llvm-project/issues/200030) | `-NAN + 0 = -NAN` with `double` literals on riscv64 | Open | Correctness | Inconsistent with RISC-V canonical-NaN spec and x86/AArch64 behavior |
| [#171978](https://github.com/llvm/llvm-project/issues/171978) | Wrong code at -O2/O3, "Illegal instruction" at runtime | Open | Correctness (miscompilation) | `-march=rv64gcvb_zicond -static -O2`; involves `__riscv_orc_b_32` + vector shuffle codegen |
| [#168308](https://github.com/llvm/llvm-project/issues/168308) | Clang misaligns kprobe test arrays / omits labels, breaks Linux kernel KUnit | Open | Correctness | GCC-built kernel unaffected; missing `.globl` labels and 8-byte alignment in `.rodata` |
| [#138130](https://github.com/llvm/llvm-project/issues/138130) | Infinite loop with `-fstack-clash-protection` | Open | Correctness (hang) | Traced to `emitStackProbeInline` in `RISCVFrameLowering.cpp:2201` |
| [#201252](https://github.com/llvm/llvm-project/issues/201252) | Clang crash at -O1+ with `asm goto` | Open | Correctness (crash) | Segfault in `DomTreeBuilder::SemiNCAInfo` |
| [#199020](https://github.com/llvm/llvm-project/issues/199020) | Full LTO + loop unrolling at -O3 triggers MachineVerifier failure on rv64gcv | Open | Correctness | Found via fuzzing; not reproducible with thin LTO/-O2/no-unroll |
| [#168256](https://github.com/llvm/llvm-project/issues/168256) | Instruction selection crash | Open | Correctness (crash) | - |
| [#170298](https://github.com/llvm/llvm-project/issues/170298) | Crash at -O2: "SubRange for this mask not found" | Open | Correctness (crash) | - |
| [#215017](https://github.com/llvm/llvm-project/issues/215017) | ClangIR NPE dereferencing bitfield on riscv64 | Open | Correctness (crash) | New CIR codegen path |
| [#221163](https://github.com/llvm/llvm-project/issues/221163) | Loop-carried WAR hazard on RVV registers | Open, assigned wangpc-pp | Correctness-adjacent (scheduling) | Register `v8` reused across loop iterations, serializes iterations |

**Recently fixed correctness bugs (merged, same-week turnaround):**

| ID | Title | Status | Fix |
|---|---|---|---|
| [#221521](https://github.com/llvm/llvm-project/issues/221521) | Compiler hang with -O2 (fuzzer-found) | Closed 2026-09-06 | [PR #221593](https://github.com/llvm/llvm-project/pull/221593), merged 2026-09-07, targeted at LLVM 24.1.0 |
| [#212226](https://github.com/llvm/llvm-project/issues/212226) | Wrong code at -O2 -march=rv64gcv | Closed 2026-07-27 | [PR #212236](https://github.com/llvm/llvm-project/pull/212236), merged 2026-07-28: replaced hand-rolled move-safety barrier logic with generic `MachineInstr::isSafeToMove` |
| [#218344](https://github.com/llvm/llvm-project/issues/218344) | Shrink-wrapping bypasses SiFive CLIC prologue | Closed 2026-08-24 | [PR #218347](https://github.com/llvm/llvm-project/pull/218347), merged 2026-09-04 |

**Open performance/missed-optimization bugs:**

| ID | Title | Detail |
|---|---|---|
| [#209237](https://github.com/llvm/llvm-project/issues/209237) | RISC-V perf regression in telecomm-gsm | 8% slowdown from unprofitable SLP vectorization |
| [#156646](https://github.com/llvm/llvm-project/issues/156646) | Suboptimal codegen for LMBench `rd` | Gather/scatter cost model rejects beneficial vectorization |
| [#190868](https://github.com/llvm/llvm-project/issues/190868) | Minor code size regression in embench-iot picojpeg | 0.7% code size regression, LLVM 22 vs prior |
| [#199960](https://github.com/llvm/llvm-project/issues/199960) | Jump tables use full-word offsets | Code bloat on rv32imb_zec vs ARM's byte-sized `tbb` |
| [#194871](https://github.com/llvm/llvm-project/issues/194871) | LSR introduces redundant IV on RISC-V | ~5% performance degradation vs GCC |
| [#212267](https://github.com/llvm/llvm-project/issues/212267) | Redundant VL1R reloads after InlineSpiller | ~2.7% estimated overhead on OoO CPUs, seen in SPEC CPU 2026 820.cloverleaf_s |
| [#211361](https://github.com/llvm/llvm-project/issues/211361) | Use P extension for narrow unsigned scalar arithmetic | Missed use of `padd.b` vs `add`+`zext.b` |
| [#217273](https://github.com/llvm/llvm-project/issues/217273) | `icmp samesign` on i8/i16 emits redundant zero-extension | Missed peephole |
| [#208549](https://github.com/llvm/llvm-project/issues/208549) | RV64 missed narrowing of `trunc(load i64)` to `lbu` | Missed optimization |
| [#123069](https://github.com/llvm/llvm-project/issues/123069) | RISC-V EVL tail folding (tracking issue) | 14/18 checklist done; blockers include #122461 (fixed-order-recurrence codegen bug) and #146672 (first-order splices); as of July 2025 EVL tail folding outperforms scalar epilogue on SPEC CPU2017/TSVC geomean, but is not yet the default |

**Other open issues:** [#216741](https://github.com/llvm/llvm-project/issues/216741) - LLVM silently switches ABI (`ilp32` -> `ilp32e`) when target features are inconsistent, with no warning; cites ARM precedent fix #110383 as the model. Open, unaddressed as of 2026-09-10.

## 12. Objections and Upstream Blockers

No stated organizational objection to RISC-V support was found; the backend is actively developed by SiFive (Craig Topper) and others and merges dozens of PRs weekly. The blockers identified in this research are technical/process, not objections:

- **CI gap is structural, not contested.** riscv64's absence from the required `premerge.yaml` gate appears to be a resourcing/infrastructure gap rather than a policy decision - RISE/Igalia's Oct 2024 CI investment explicitly targets closing this gap, with stated future work to "migrate builders to LLVM's main buildmaster," not yet completed.
- **libpfm4's absent riscv64 port** is an external-dependency blocker outside LLVM's control, affecting `llvm-exegesis` specifically; no LLVM-side workaround identified.
- **zlib/zstd RVV performance PRs stalled** at those upstream projects (not LLVM) due to unresponsive/slow maintainer review, not technical rejection.
- **Acceptance probability for further RISC-V investment:** high. RISC-V is already a maintained, merged, first-tier backend with an established contribution pathway (numbered PR series, `[RISCV]` title-tag convention, active reviewers `topperc`/`lukel97`/`wangpc-pp`); the fuzzer-found correctness bugs cataloged in Section 11 were fixed same-week, indicating responsive maintainership, not resistance.

## 13. Readiness Assessment

- **Color:** yellow (build-only-ci)
- **Release provider:** Ubuntu (distro-provided; upstream publishes no riscv64 release artifacts)
- **Justification:** LLVM's required pre-merge gate (`.ci/*` invoked by `premerge.yaml`) has zero riscv64 references, confirmed by grep, and builds/tests only x86_64 Linux, AArch64 Linux, Windows x86_64, and macOS arm64 as required checks. The only riscv64 test execution that exists is QEMU-based and scoped narrowly to `libc/**` changes ([libc-overlay-tests.yml](https://github.com/llvm/llvm-project/blob/main/.github/workflows/libc-overlay-tests.yml)), and the whole-project codegen-diff job (`test-suite.yml`) is comment-triggered/manual, not required - so the RISC-V codegen backend itself (the part that actually defines "RISC-V support" for most users) is never exercised by required CI. This independently satisfies the distribution floor for yellow as well: no comprehensive upstream CI, but Ubuntu 26.04 (resolute) ships `llvm`/`llvm-17` through `llvm-22` for riscv64 built from source ([packages.ubuntu.com](https://packages.ubuntu.com/search?keywords=llvm&suite=resolute&searchon=names&section=all)), and no riscv64 binaries appear in the last 5 upstream GitHub releases checked (23.1.1 down to 22.1.8).
- **Optimization-purpose modifier:** not applicable. LLVM is a general-purpose compiler toolchain, not an optimization-purpose library per the Step 2 test (Section 1); its RISC-V codegen backend is target-support infrastructure, and Step 2's cap does not apply.
- **Pending work that could raise the grade:** RISE/Igalia-funded dedicated RISC-V buildbots ([Oct 2024 announcement](https://riseproject.dev/2024/10/15/working-with-igalia-to-improve-risc-v-llvm-continuous-integration/)) run QEMU full-system and user-space emulation plus hardware runners, with explicitly stated future work to migrate into LLVM's main buildmaster and integrate the `test-suite` repo - if completed, this would move riscv64 from a RISE-external build farm into the project's own required CI, which is the single change that would raise this grade toward blue or green. The open EVL tail-folding tracking issue [#123069](https://github.com/llvm/llvm-project/issues/123069) (14/18 items complete) and ongoing SPEC optimization follow-up (issue #132787) are also active RISE/Igalia-adjacent workstreams, though they affect codegen quality rather than CI/release posture directly.

## 14. Investment Analysis

RISE has already funded: (1) dedicated LLVM RISC-V CI infrastructure via Igalia/Alex Bradbury (four staging buildbots, QEMU + hardware runners, announced Oct 2024), and (2) an 8-month SPEC CPU2017 optimization project via Igalia/Mikhail Gadelha (RP009, delivered ~15% execution-time improvement on SpacemiT-X60 through a new scheduling model, SLP vectorizer spill-cost fix, and IPRA support). Both efforts are documented on the RISE blog and should not be re-sized below.

### 14.1 Functional Enablement

- **libpfm4 riscv64 port** (blocks `llvm-exegesis` hardware-counter functionality): estimated 6.5-20 person-weeks per Section 9 findings. This is the most concrete, unclaimed functional gap identified.
- **LLVM-libc UEFI riscv64 target**: documented as not yet enabled; scope not sized in this research. [Data not available: no effort estimate found for this item.]
- **ABI silent-switch fix** (#216741): small, well-scoped fix following the ARM precedent (#110383); likely low effort (days, not weeks) but not independently estimated here.

### 14.2 Performance Optimization

- **zlib/zstd RVV PRs**: the work already exists as unmerged upstream PRs ([zstd #4596](https://github.com/facebook/zstd/pull/4596), [#4629](https://github.com/facebook/zstd/pull/4629); [zlib #1099](https://github.com/madler/zlib/pull/1099)) - the investment needed is maintainer-engagement/advocacy effort to get them reviewed and merged, not new engineering. Low-cost, high-leverage if RISE or a sponsor can apply reviewer pressure at those upstream projects.
- **EVL tail folding default-enablement** (#123069): 4 of 18 checklist items remain (fixed-order-recurrence bug #122461, first-order-splice fix #146672, `VPWidenIntOrFpInductionRecipe`/`VPWidenPointerInductionRecipe` support, cost-model tuning). This is already RISE/Igalia-adjacent active work; sizing should account for what's already funded via that channel rather than treating it as new scope.
- **Missed-optimization backlog** (Section 11: #209237, #156646, #190868, #199960, #194871, #212267, #211361, #217273, #208549): 9 open, discrete, individually small-to-medium codegen fixes; a reasonable engineering estimate is 0.5-2 person-weeks each depending on DAGCombine/SLP/regalloc complexity, but no per-issue effort estimate was found upstream - treat as [NEEDS VERIFICATION] pending a maintainer/PR-size-based estimate.

### 14.3 CI/CD Infrastructure

- **Migrate RISE buildbots into `llvm/llvm-project`'s required `premerge.yaml` gate**: this is the single highest-leverage investment to move the grade from yellow to blue/green. RISE's own blog states this as intended future work but it is not yet done. Effort is primarily upstream-process (RFC, buildbot registration, sub-community sign-off per `DeveloperPolicy`) rather than raw engineering; [Data not available: no person-week estimate found for this migration in the research].
- **Extend `libc-overlay-tests.yml`-style QEMU execution beyond `libc/**`** to cover core codegen (e.g., a scoped riscv64 lane in `premerge.yaml` itself, even if not initially required): moderate effort, bounded by existing container/toolchain assets already built for the libc jobs (`ghcr.io/llvm/libc-ubuntu-24.04`).

### 14.4 Ecosystem Enablement

Not applicable - see Section 10 omission rationale: LLVM is a standalone compiler toolchain/system library, not a project with a significant dependent package ecosystem (Python/npm/Maven packages, Kubernetes operators) requiring separate riscv64 enablement per project.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | libpfm4 riscv64 port (unblocks llvm-exegesis hardware counters) | 6.5-20 | External (libpfm4 upstream) / sponsor-funded contributor | High |
| Functional | LLVM-libc UEFI riscv64 enablement | Data not available | LLVM-libc maintainers | Medium |
| Functional | Fix silent ABI switch (#216741) | <1 (estimate, not sourced) | LLVM RISC-V maintainers | Low |
| Performance | Advocate/fund review of stalled zlib/zstd RVV PRs | <1 (advocacy, not engineering) | RISE / sponsor liaison | Medium |
| Performance | Complete EVL tail-folding checklist (#123069) | Already RISE/Igalia-funded; do not re-size | Igalia (RISE-funded) | Medium (in progress) |
| Performance | Missed-optimization backlog (9 open issues, Section 11) | Data not available (est. 0.5-2 each, unsourced) | LLVM RISC-V maintainers | Medium |
| CI/CD | Migrate RISE buildbots into required `premerge.yaml` gate | Data not available | RISE / Igalia / LLVM infra maintainers | Critical (highest grade-leverage item) |
| CI/CD | Extend QEMU-execution CI beyond `libc/**` scope | Data not available | LLVM infra maintainers | High |

## 15. Updates

(No updates yet - initial report dated 2026-09-10.)

## 16. References

- [llvm/llvm-project GitHub repository](https://github.com/llvm/llvm-project)
- [LLVM homepage](https://llvm.org/)
- [First RISC-V commit b6e784a](https://github.com/llvm/llvm-project/commit/b6e784a240fa3f62874c457afa43be37278cfa2d)
- [Issue #222158 - Vector Not(Sne) sequences](https://github.com/llvm/llvm-project/issues/222158)
- [Issue #221521 - Compiler hang with O2](https://github.com/llvm/llvm-project/issues/221521)
- [PR #221593 - Fix infinite DAGCombine loop](https://github.com/llvm/llvm-project/pull/221593)
- [Issue #221163 - Loop-carried WAR hazard on RVV registers](https://github.com/llvm/llvm-project/issues/221163)
- [Issue #218344 - Shrink wrapping bypasses SiFive CLIC prologue](https://github.com/llvm/llvm-project/issues/218344)
- [PR #218347 - Disable shrink wrapping for SiFive CLIC/QCI handlers](https://github.com/llvm/llvm-project/pull/218347)
- [Issue #217273 - icmp samesign redundant zero-extension](https://github.com/llvm/llvm-project/issues/217273)
- [Issue #216741 - LLVM silently switches ABI](https://github.com/llvm/llvm-project/issues/216741)
- [Issue #215017 - ClangIR NPE dereferencing bitfield](https://github.com/llvm/llvm-project/issues/215017)
- [Issue #212226 - Wrong code at -O2 -march=rv64gcv](https://github.com/llvm/llvm-project/issues/212226)
- [PR #212236 - Don't move memory instructions across calls in isSafeToMove](https://github.com/llvm/llvm-project/pull/212236)
- [Issue #211361 - Use P extension for narrow unsigned scalar arithmetic](https://github.com/llvm/llvm-project/issues/211361)
- [Issue #209237 - RISC-V performance regression in telecomm-gsm](https://github.com/llvm/llvm-project/issues/209237)
- [Issue #123069 - RISC-V EVL tail folding](https://github.com/llvm/llvm-project/issues/123069)
- [Issue #200030 - -NAN + 0 = -NAN with double literals](https://github.com/llvm/llvm-project/issues/200030)
- [Issue #171978 - Wrong code at -O2/O3](https://github.com/llvm/llvm-project/issues/171978)
- [Issue #168308 - Clang misaligns kprobe test arrays](https://github.com/llvm/llvm-project/issues/168308)
- [Issue #138130 - Infinite loop with -fstack-clash-protection](https://github.com/llvm/llvm-project/issues/138130)
- [Issue #201252 - Clang crash with asm goto](https://github.com/llvm/llvm-project/issues/201252)
- [Issue #199020 - Full LTO + loop unrolling triggers MachineVerifier failure](https://github.com/llvm/llvm-project/issues/199020)
- [Issue #156646 - Suboptimal codegen for LMBench rd](https://github.com/llvm/llvm-project/issues/156646)
- [Issue #190868 - Minor code size regression in picojpeg](https://github.com/llvm/llvm-project/issues/190868)
- [Issue #199960 - Jump tables use full-word offsets](https://github.com/llvm/llvm-project/issues/199960)
- [Issue #194871 - LSR introduces redundant IV](https://github.com/llvm/llvm-project/issues/194871)
- [Issue #212267 - Redundant VL1R reloads after InlineSpiller](https://github.com/llvm/llvm-project/issues/212267)
- [Issue #208549 - RV64 missed narrowing of trunc(load i64)](https://github.com/llvm/llvm-project/issues/208549)
- [.github/workflows/libc-overlay-tests.yml](https://github.com/llvm/llvm-project/blob/main/.github/workflows/libc-overlay-tests.yml)
- [.github/workflows/libc-shared-tests.yml](https://github.com/llvm/llvm-project/blob/main/.github/workflows/libc-shared-tests.yml)
- [.github/workflows/test-suite.yml](https://github.com/llvm/llvm-project/blob/main/.github/workflows/test-suite.yml)
- [libc/docs/uefi/building.rst](https://github.com/llvm/llvm-project/blob/main/libc/docs/uefi/building.rst)
- [llvm/docs/GettingStarted.md](https://github.com/llvm/llvm-project/blob/main/llvm/docs/GettingStarted.md)
- [llvm/docs/HowToCrossCompileLLVM.md](https://github.com/llvm/llvm-project/blob/main/llvm/docs/HowToCrossCompileLLVM.md)
- [LLVM GitHub Releases](https://github.com/llvm/llvm-project/releases)
- [Ubuntu resolute package search: llvm](https://packages.ubuntu.com/search?keywords=llvm&suite=resolute&searchon=names&section=all)
- [RISE blog: Working with Igalia to improve RISC-V LLVM Continuous Integration](https://riseproject.dev/2024/10/15/working-with-igalia-to-improve-risc-v-llvm-continuous-integration/)
- [RISE blog: Project RP009: LLVM SPEC Optimization](https://riseproject.dev/2025/05/08/project-rp009-llvm-spec-optimization/)
- [Igalia blog: Boosting RISC-V Application Performance](https://blogs.igalia.com/compilers/2025/05/05/boosting-risc-v-application-performance-an-8-month-llvm-journey/)
- [RISE blog: Optimizing IREE compilation for RISC-V](https://riseproject.dev/2026/07/07/optimizing-iree-compilation-and-end-to-end-object-detection-pipeline-for-risc-v/)
- [libffi issue #466](https://github.com/libffi/libffi/issues/466)
- [libffi issue #694](https://github.com/libffi/libffi/issues/694)
- [libffi issue #777](https://github.com/libffi/libffi/issues/777)
- [zlib PR #1099](https://github.com/madler/zlib/pull/1099)
- [zstd PR #4596](https://github.com/facebook/zstd/pull/4596)
- [zstd PR #4629](https://github.com/facebook/zstd/pull/4629)
- [zstd issue #4471](https://github.com/facebook/zstd/issues/4471)
- [zstd issue #4546](https://github.com/facebook/zstd/issues/4546)
- [Z3 issue #7181](https://github.com/Z3Prover/z3/issues/7181)
- [Z3 issue #7605](https://github.com/Z3Prover/z3/issues/7605)
- [Z3 issue #9147](https://github.com/Z3Prover/z3/issues/9147)
