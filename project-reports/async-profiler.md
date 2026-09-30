---
title: async-profiler
parent: Project Reports
color: orange
dependencies:
  - name: linux-perf
    relation: runtime-dependency
    criticality: critical
  - name: OpenJDK
    relation: runtime-dependency
    criticality: critical
  - name: GraalVM
    relation: runtime-dependency
    criticality: optional
  - name: glibc
    relation: runtime-dependency
    criticality: critical
  - name: GCC
    relation: build-dependency
    criticality: critical
---

{% include dependency-graph.html slug="dependencies" subset="async-profiler" %}

# async-profiler

**Author:** Ludovic HENRY <ludovic.henry@qti.qualcomm.com><br/>
**Date:** 2026-09-30<br/>
**Readiness:** orange<br/>
**Scope:** RISC-V (riscv64/linux) support status for async-profiler<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

## 1. Project Overview

[async-profiler](https://github.com/async-profiler/async-profiler) is a low-overhead sampling profiler for JVM-based applications. It produces CPU flamegraphs and allocation profiles by combining Linux `perf_event_open(2)`, the HotSpot `AsyncGetCallTrace` API, and JVMTI callbacks. The project is licensed Apache-2.0. The stated homepage, [async-profiler.github.io](https://async-profiler.github.io/), returns HTTP 404 and does not resolve to a live site; the GitHub repository and README are the project's actual front door.

Governance is single-maintainer: **Andrei Pangin** (`apangin`), creator and sole merge authority, with no formal foundation affiliation, no written governance charter, and no corporate steering committee. There is no MAINTAINERS, OWNERS, or CODEOWNERS file, and no PLATFORMS.md/SUPPORT.md.

There is strong circumstantial evidence of a de facto Amazon/AWS sponsorship, short of a formal "maintained by AWS" statement:
- `CONTRIBUTING.md`, `SECURITY.md`, and `CODE_OF_CONDUCT.md` are verbatim AWS open-source boilerplate (routing security reports to AWS/Amazon Security, adopting the Amazon Open Source Code of Conduct). These were added only in **v4.0 (2025-04-08)**; before that the project had no formal governance documents at all.
- The org's `.github` repository is a fork of `amzn/.github`.
- Several contributors commit from `@amazon.com` addresses or `-amzn`-suffixed handles (e.g. `ruparev@amazon.com`, `vishalvc@amazon.com`, `benty-amzn`).

Other identifiable corporate contributors (from commit-author domains): **Johannes Bechberger** (SAP), **korniltsev-grafanista** / Anatoly Korniltsev (Grafana), **Long Yang** (Alibaba), and **Leslie Zhai** (Loongson, author of the LoongArch64 port - notable as a case of a chip vendor contributing its own architecture's port directly, which has not happened for riscv64). `zifeihan` (Alibaba) is the RISC-V contributor of record (see Section 2).

Community culture on new architecture ports: `CONTRIBUTING.md` asks contributors to open an issue to discuss significant work before submitting a PR. There is no architecture-specific acceptance policy beyond that; in practice, riscv64, loongarch64, and ppc64le were all accepted as community contributions into a lower, non-officially-maintained tier (Section 3), at maintainer discretion, without becoming officially maintained. The project is not a member of the RISE Project (confirmed against [riseproject.dev/members](https://riseproject.dev/) - Premier and General members are silicon vendors and infrastructure partners, not downstream software projects) and has received no RISE funding or blog coverage (Section 10 of this assessment's underlying research; see Section 12).

## 2. Port History and Upstreaming Timeline

| Date | Event |
|---|---|
| 2022-09-02 | [PR #644](https://github.com/async-profiler/async-profiler/pull/644) "Basic RISC-V support" opened by `shipilev` (Aleksey Shipilev). Built/tested on a HiFive Unmatched board, Ubuntu 22.04, JDK 20 (`-Xint`, C1 `-XX:TieredStopAtLevel=1`, default C2). Self-described as "basic": not tested beyond toy examples, some features (stub pops) stubbed out. |
| 2022-09-05 | `apangin` raises a maintenance-sustainability objection: "Currently, I can't guarantee that ongoing development will keep the port functioning or even buildable." `luhenry` offers cross-compilation testing help same day. No technical defect is cited. |
| 2022-09-05 to 2022-11-28 | PR dormant (~14.5 months from open to merge). |
| 2022-11-28 | `RealFYang` revives the thread, introducing `zifeihan` (Alibaba) as a contributor with real-world async-profiler experience on riscv64. `zifeihan` adds an `arch.h` patch and posts full smoke/allocation/library-load test results on riscv64 Ubuntu. |
| 2022-11-29 | `apangin` states the operative blocker explicitly: "I have nothing against the content, however, the project does not accept external code contributions at this moment. This is temporary." |
| 2023-11-26 | `apangin` merges PR #644 (merge commit [`752b79e`](https://github.com/async-profiler/async-profiler/commit/752b79ec4e4cc46c105dade93e1df1954fbbc638)) after verifying "in QEMU that `make test` passes," and lands a same-day follow-up fix commit [`0d0f0f0`](https://github.com/async-profiler/async-profiler/commit/0d0f0f0c670c2d4dbea6eb9a0284079f58e2fb91) correcting `retval()` from `REG_RA` to `REG_A0` and adding `link()`, `jarg0()`, `method()`, `senderSP()`, `unwindStub()`/`unwindCompiled()`. |
| 2023-11-27 | `zifeihan` confirms success on a LicheePi-4A board and commits to ongoing maintenance of the riscv64 port. |
| 2024-01-20 | **v3.0** tagged - first release containing the riscv64 port, alongside the LoongArch64 port ([PR #770](https://github.com/async-profiler/async-profiler), Leslie Zhai/Loongson, committed 2023-12-01). Changelog: "#644: RISC-V port." |
| 2025-03-21 | [PR #1185](https://github.com/async-profiler/async-profiler/pull/1185) "Fix compilation with source merging disabled" (fandreuz) opened and merged same day. This is **not** riscv64-specific: it fixes a `make MERGE=false` build failure (missing `<cerrno>` include for `errno`, missing `OS` class header) whose error log happened to enumerate `src/stackFrame_riscv64.cpp` among all per-architecture source files being compiled - that log text is the only reason this PR matches a "riscv"/"riscv64" search. First shipped in **v4.0 (2025-04-08)**. |
| 2026-07-20 | **v4.5** (latest stable at research time). No riscv64-related changelog entries since v3.0. |

No standalone RISC-V tracking issue was ever filed (GitHub issue search for "riscv"/"riscv64" returns zero results, confirmed independently via the GitHub search API and the web issue-search UI). PR #644 is the sole substantive riscv64 PR and functions as the de facto tracking thread. A plain commit-message search for "riscv"/"riscv64" (which does not scan diffs or paths) also returns only the two PR #644 merge/fix commits. **No riscv64-specific commit has landed since the November 2023 merge**, through v4.5 (2026-07-20) - `zifeihan`'s 2023 maintenance commitment has not produced follow-up work in the public record.

## 3. Upstream Support Tier

The README defines an explicit two-tier platform model:

| Tier | Linux | macOS |
|---|---|---|
| **Officially maintained builds** (CI-built, tested, binaries in releases) | x64, arm64 | x64, arm64 |
| **Other available ports** (community-contributed, source-only, no CI, no official binaries) | x86, arm32, ppc64le, **riscv64**, loongarch64 | - |

riscv64 sits in the lower, community-maintained tier - the same tier as ppc64le and loongarch64 - not the officially maintained tier. This is consistent end to end with the CI evidence (Section 7) and release evidence (Section 8): the tiering is not aspirational labeling, it matches what actually gets built, tested, and shipped.

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Architecture-Specific File Footprint

| Arch | Files with arch guard | Dedicated stack-frame file LOC |
|---|---|---|
| x86_64 | 8 (`safeAccess.cpp`, `dwarf.h`, `symbols_linux.cpp`, `stackFrame_x64.cpp`, `arch.h`, `tsc.h`, `vmStructs.cpp`, `os_macos.cpp`) | 245 (0 stubs) |
| aarch64 | 10 (adds `perfEvents_linux.cpp`, `dwarf.cpp`) | 353 (0 stubs) |
| riscv64 | 3 (`symbols_linux.cpp`, `arch.h`, `stackFrame_riscv64.cpp`) | 109 |
| loongarch64 (community tier) | 3 | 107 |
| ppc64le (community tier) | 3 | 101 |

riscv64's footprint is essentially identical in shape to loongarch64 (same template, same stub pattern) and roughly a third of aarch64's - confirming it is a minimal community port rather than an independently engineered full implementation.

### 4.2 Register Accessors (`src/stackFrame_riscv64.cpp`) - Fully Implemented

Correctly mapped via `ucontext.uc_mcontext.__gregs[]`: `pc()` -> `REG_PC`, `sp()` -> `REG_SP`, `fp()` -> `REG_S0`, `retval()` -> `REG_A0` (corrected from an erroneous `REG_RA` mapping in the same-day follow-up fix commit `0d0f0f0`), `link()` -> `REG_RA` (x1), `arg0()`-`arg3()` -> `REG_A0`+offset, `jarg0()` -> `arg1()` (Java calling convention places the receiver in a0), `method()` -> x31/t6, `senderSP()` -> x19/s3.

`isSyscall()` detects the `ECALL` opcode (`0x00000073`); the source comment acknowledges RISC-V uses `ECALL` for both syscalls and debugger traps, so this "might technically mismatch" - no fix exists.

### 4.3 Stack Unwinding - Partial, With Explicit Stubs

`src/stackFrame_riscv64.cpp` contains, verbatim:
```
bool StackFrame::unwindPrologue(...) {
    // Not yet implemented
    return false;
}
bool StackFrame::unwindEpilogue(...) {
    // Not yet implemented
    return false;
}
void StackFrame::adjustSP(...) {
    // Not yet implemented
}
```
On x64 and aarch64, these functions perform instruction-pattern scanning to reconstruct frames at JIT method entry/exit boundaries before the frame pointer is established or after it has been torn down. On riscv64 they are unconditional no-ops, identical to loongarch64's stubs. `unwindStub()` is partially implemented (name-string matching for itable/vtable/InlineCacheBuffer cases only, setting `pc = link()`); it performs no instruction decoding, unlike the x64/aarch64 versions. `unwindAtomicStub()` returns `false` and is marked "Not needed" - aarch64 implements a real version of this.

### 4.4 Architecture Constants (`src/arch.h`)

Guarded by `#elif defined(__riscv) && (__riscv_xlen == 64)`:
- `BREAKPOINT`: `0x9002` (compressed `C.EBREAK`) when `__riscv_compressed` is defined, else `0x00100073` (standard `EBREAK`).
- `PLT_HEADER_SIZE = 24`, `PLT_ENTRY_SIZE = 24`: commented "Best guess from examining readelf" - not derived from the RISC-V psABI. Wrong values misattribute calls routed through the PLT.
- `spinPause()`: empty no-op, "No architecture support" - correct for base RV64I; does not assume `Zihintpause`.
- `rmb()`: `fence` instruction - correct.
- `PERF_REG_PC = 0` - correct, matches the Linux kernel's `PERF_REG_RISCV_PC`.

Detects `__riscv_compressed` (the C extension) only. No RVV, Zba, or Zbb intrinsics are used anywhere in the codebase (confirmed by repository-wide search for `vfloat32m1_t`, `rvv`: zero results). There is no `arch/riscv/` subdirectory and no `.S` assembly file for riscv64 - all architecture-specific logic lives in `#ifdef __riscv` blocks inside shared multi-arch files plus the one dedicated stack-frame file.

### 4.5 Subsystems With No riscv64 Implementation

- **DWARF unwinding is structurally unavailable.** `src/dwarf.h`'s `#if/#elif` chain sets `DWARF_SUPPORTED = true` only for `__x86_64__`, `__i386__`, `__aarch64__`; riscv64 falls to `#else` -> `DWARF_SUPPORTED = false`. `profiler.cpp` hard-errors ("DWARF unwinding is not supported on this platform") if a user requests `--cstack dwarf` on riscv64.
- **VMStructs fast-path stack walking (CSTACK_VM) is disabled.** `vmStructs.cpp`'s arch chain (`__x86_64__`/`__aarch64__`/`__arm__`) never sets `_interpreter_frame_bcp_offset` for riscv64 (nor ppc64le/loongarch64), so it retains its default `0`. `hasStackStructs()` is gated on `_interpreter_frame_bcp_offset != 0` and is therefore unconditionally `false` on riscv64 - the "prefer VMStructs" upgrade path never fires for any JVM version on riscv64. Net effect: riscv64 is left solely with the generic frame-pointer walker, whose own arch hooks (`unwindPrologue`/`unwindEpilogue`/`adjustSP`) are themselves the stubs described in 4.3.
- **TSC (hardware cycle counter) absent.** `tsc.h` defines `rdtsc()`/`TSC_SUPPORTED` only for x86/aarch64; riscv64 falls to `#else` (`TSC_SUPPORTED = false`, `rdtsc() = 0`, falls back to `clock_gettime`). The RISC-V `cycle` CSR (Zicntr extension, near-universal on Linux-booted riscv64 cores) is not used.
- **SafeAccess fault-tolerant reads are scalar C, not hand-tuned asm.** x86_64/i386/aarch64 have inline-asm implementations in `safeAccess.cpp`; riscv64 uses the generic `#else` branch (`void* ret = *ptr;`, a plain dereference wrapped in a compiler barrier).
- **Interrupted-syscall (poll/epoll) restart workaround absent.** x64/aarch64's `checkInterruptedSyscall()` contains JDK-8237858-specific logic to restart `poll`/`ppoll`/`epoll_wait` when interrupted by the profiler's signal. riscv64 (like arm/ppc64) uses the bare `return retval() == -EINTR;` with no restart logic - a tier-1-only feature, not riscv-unique, but absent.
- **ELF relocation handling is correctly done**, not a gap: `symbols_linux.cpp` documents that RISC-V has no `GLOB_DAT` relocation type and deliberately sets `R_GLOB_DAT = -1` as a sentinel - a considered design choice, confirmed present and correct.

## 5. Build System, Cross-Compilation, and Toolchain

The project uses a single hand-written `Makefile` (328 lines) exclusively. Confirmed absent: `CMakeLists.txt` (no CMake anywhere in the project), `BUILDING.md`, `INSTALL`, `docs/building.md`, `docs/cross-compilation.md`, any `cmake/` directory, and any riscv64 Dockerfile (`docker/` contains only `alpine.Dockerfile`, `debian.Dockerfile`, `amazonlinux2023.Dockerfile`, `alpaquita.Dockerfile`, `code-check.Dockerfile`).

**Native build (on a riscv64 host):**
```
make JAVA_HOME=<path-to-jdk>
```
The Makefile auto-detects `uname -m == riscv64` and sets `ARCH_TAG=riscv64`, controlling `make release` artifact naming (`async-profiler-<version>-linux-riscv64.tar.gz` - never actually produced in CI, see Section 8).

**Cross-compilation (from x86-64 host), inferred from Makefile logic, not documented anywhere in the repo:**
```
CROSS_COMPILE=riscv64-linux-gnu- ARCH_TAG=riscv64 JAVA_HOME=<riscv64-jdk-path> make
```
The Makefile rewrites `CC`, `CXX`, `AS`, `LD`, `STRIP`, `OBJCOPY` to `$(CROSS_COMPILE)<tool>` when `CROSS_COMPILE` is set - this is the project's only cross-compilation mechanism, generic across all architectures, offered informally in the PR #644 review thread by `luhenry` but never written up as official guidance. If the cross-toolchain does not support `-fwhole-program -fPIC -shared` together, `MERGE=false` is the documented workaround:
```
make CROSS_COMPILE=riscv64-linux-gnu- MERGE=false JAVA_HOME=<path>
```
A known riscv64-specific Makefile rule: `-momit-leaf-frame-pointer` is excluded for `ARCH_TAG=riscv64` because the flag is unsupported on that target (added in PR #644).

**Toolchain requirements** (project-wide, no riscv64-specific override documented): GCC 7.5.0+ or Clang 7.0.0+ (GCC 7 is the first version with a stable riscv64 Linux target; Clang 7 added the riscv64 backend), JDK 11+. Compile flags applied uniformly, including `-Wno-psabi` (suppresses ABI-compatibility warnings GCC may emit for riscv64 due to evolving psABI revisions) and `-fno-omit-frame-pointer` (required since the frame-pointer walker is the only unwinding strategy available on riscv64, per Section 4.5).

**CI toolchain reality:** `.github/workflows/build.yml` builds non-macOS targets with a static musl-gcc toolchain (`make COMMIT_TAG=$HASH CC=/usr/local/musl/bin/musl-gcc release coverage -j`), but this reusable workflow is invoked only for `linux-arm64` and `linux-x64` (Section 7) - there is no musl image or build path for riscv64 anywhere in the repository. No QEMU usage exists anywhere in the repo for any architecture; verification at PR #644 merge time was done manually by `apangin` (QEMU) and `zifeihan` (LicheePi-4A hardware), entirely outside CI.

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Register accessors | Full | Full | Full |
| `unwindStub` | Full | Full | Partial (name-match only, no decode) |
| `unwindPrologue` | Full | Full | **Missing (returns false)** |
| `unwindEpilogue` | Full | Full | **Missing (returns false)** |
| `unwindAtomicStub` | N/A | Full | **Missing ("not needed")** |
| `adjustSP` | N/A | Full | **Missing (no-op)** |
| DWARF unwinding | Full | Full | **Missing (`DWARF_SUPPORTED=false`, hard error)** |
| VMStructs fast-path (CSTACK_VM) | Full | Full | **Missing (`hasStackStructs()` always false)** |
| TSC / `rdtsc` | Full (asm) | Full (asm) | **Missing (returns 0, falls back to clock_gettime)** |
| `safeAccess` | Full (asm) | Full (asm) | Scalar C fallback |
| `spinPause()` | Full | Full | **Missing (no-op)** |
| Interrupted-syscall restart (JDK-8237858) | Full | Full | **Missing** |
| `isSyscall()` | Full | Full | Partial (ECALL ambiguity acknowledged in source) |
| PLT constants | Verified | Verified | **Guessed ("best guess from readelf")** |
| ELF relocation handling | Full | Full | Full (deliberate `R_GLOB_DAT=-1` sentinel) |
| CI coverage | Yes | Yes | **None** |
| Binary releases | Yes | Yes | **None** |
| Official support tier | Tier 1 | Tier 1 | Tier 2 ("other available port") |

With DWARF and VMStructs both structurally unavailable, riscv64 is left with the generic frame-pointer walker as its only unwinding strategy, and that walker's own architecture hooks are themselves unimplemented stubs - the practical effect is dropped or corrupt frames at JIT-compiled method prologue/epilogue boundaries, and no fallback strategy to compensate. No NaN-boxing or floating-point-correctness defect has been reported against async-profiler specifically; a well-documented class of RISC-V NaN-boxing bugs exists elsewhere in the ecosystem (e.g. Mozilla SpiderMonkey/Wasm bug 1975867, a Valgrind/VEX bug 503098) affecting exactly the kind of register/signal-context reading that async-profiler's stack walker performs - this is a latent risk class worth flagging, not a confirmed async-profiler defect [NEEDS VERIFICATION].

## 7. CI/CD Infrastructure

**No riscv64 CI exists.** All 7 workflow files in `.github/workflows/` were read directly from `raw.githubusercontent.com` and case-insensitively searched for "riscv": `build.yml`, `clang-tidy-review.yml`, `code-check.yml`, `compare-binary-sizes.yml`, `integ.yml`, `linters.yml`, `test-and-publish-nightly.yml`. Zero matches in any file. No `.gitlab-ci.yml`, `Jenkinsfile`, or `.cirrus.yml` exists in the repository.

`test-and-publish-nightly.yml` (name: `CI`) is the master workflow, triggered on `push`, `pull_request`, and `workflow_dispatch`, with an explicit, closed platform set:

| Job | Runner | Platform |
|---|---|---|
| `build-jars` | ubuntu-latest | (platform-independent) |
| `build-linux-arm64` | ubuntu-24.04-arm | linux-arm64 |
| `build-linux-x64` | ubuntu-latest | linux-x64 |
| `build-macos` | macos-15 | macos |
| `integ-linux-x64`, `integ-linux-arm64`, `integ-macos` | (matrices, Java 8/11/17/21/25) | same three platforms |
| `publish-only-on-push` | - | nightly release upload |

No riscv64 build job, integration job, runner, container, or QEMU step exists anywhere in the matrix. This was independently re-verified adversarially against the raw file contents, not inferred from search snippets. The RISE Project's own "RISE RISC-V Runners" (free, native RISC-V CI on GitHub, announced [2026-03-24](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)) exists as infrastructure but has not been adopted by async-profiler - no workflow file references it. Any riscv64 regression introduced since the v3.0 merge is invisible to CI; there is no automated gate of any kind.

## 8. Distribution and Release Status

**GitHub Releases - no riscv64 asset, stable or nightly.** v4.5 (latest stable, 2026-07-20) ships 9 assets: `async-profiler-4.5-linux-arm64.tar.gz`, `async-profiler-4.5-linux-arm64-debug.tar.gz`, `async-profiler-4.5-linux-x64.tar.gz`, `async-profiler-4.5-linux-x64-debug.tar.gz`, `async-profiler-4.5-macos.zip`, `async-profiler.jar`, `jfr-converter.jar`, and source (zip/tar.gz). No filename contains "riscv" or "riscv64." The nightly release (build `4.5-a07608e`) was separately checked and shows the same pattern (arm64/x64/macos only, no riscv asset), confirming this is not a stable-only gap.

**PyPI.** `https://pypi.org/pypi/async-profiler/json` returns HTTP 404, `{"message": "Not Found"}` - there is no PyPI project named `async-profiler` in any form (not merely lacking a riscv64 wheel). Confirmed independently via WebFetch and direct curl.

**RISE GitLab wheel builder.** `https://gitlab.com/api/v4/projects/56254198/packages/pypi/simple/async-profiler/` redirects (HTTP 302) to `pypi.org/simple/async-profiler/`, which itself 404s - no package in either location.

**Ubuntu 26.04 (resolute).** Direct search of `packages.ubuntu.com` for `async-profiver`, `python3-async-profiler`, or `libasync-profiler` returns "Sorry, your search gave no results" - no package exists for any architecture, let alone riscv64.

**Debian and official Arch Linux.** Carried forward from prior research rather than freshly re-verified in this pass: Debian's package tracker returns no entry, and the official Arch repositories return zero results via the packages API [NEEDS VERIFICATION - not independently re-run this cycle].

**AUR (unofficial, Arch Linux).** `async-profiler 4.4-1`, `async-profiler-bin 4.4-2`, and `async-profiler-git` exist as community build/wrapper scripts; `async-profiler-bin` explicitly downloads the upstream x64/arm64 tarballs and would fail on riscv64 since no such tarball exists [NEEDS VERIFICATION - single source, not re-checked this cycle].

**Arch Linux RISC-V (archriscv.felixc.at).** Contradictory evidence exists here. An initial pass characterized this channel as simply "not present." A later, more careful pass found the project's mirror has no browsable package-search UI, and direct directory probes (`~repo/extra/`, `repo/extra/os/riscv64/`, `repo/core/os/riscv64/` on `riscv.mirror.pkgbuild.com`) all returned 404 - this channel should be treated as **unverified-by-listing**, not a confirmed absence, since the expected browsing mechanism could not be reached. Given async-profiler is not a typical distro-packaged tool on any Arch architecture (normally consumed as an upstream tarball/jar), no positive evidence of an riscv64 package exists either way.

**Bottom line:** across every channel that could be directly queried (GitHub releases stable and nightly, PyPI, RISE wheel index, Ubuntu 26.04), there is zero evidence of any riscv64 binary or package for async-profiler. riscv64 support is source-build-only.

## 9. Dependencies

| Dependency | Role | Criticality | riscv64 Build | riscv64 Test | riscv64 Release | Blocking issues |
|---|---|---|---|---|---|---|
| linux-perf (`perf_events`, `perf_event_open(2)`) | Runtime dependency - CPU sampling engine | Critical | Builds (kernel 5.4+) | Software counters functional; hardware PMU via SBI PMU driver; frame-pointer callchain path fixed in kernel 6.12 | Ships in Debian sid, Ubuntu, Arch riscv64 | PMU throttle IRQ-storm bug (ByteDance patch, not upstream-merged); fixed-counter-stop bug (Alibaba patch, rejected by maintainer, needs rework). See [linux-perf status report](../linux-perf). |
| OpenJDK (HotSpot: `AsyncGetCallTrace`, JVMTI, TLAB) | Runtime dependency - JIT backend, Java callstack unwinding, allocation profiling | Critical | Builds; all JVM variants present | C1/C2/interpreter validated ad hoc on HiFive Unmatched and LicheePi-4A hardware (PR #644); no native riscv64 CI in `openjdk/jdk` itself - only undocumented Adoptium/RISE testing on a Scaleway EM-RV1 instance | No official upstream riscv64 binary | async-profiler's own `unwindPrologue`/`unwindEpilogue` stubs (Section 4.3) produce incomplete frames at JIT boundaries; the OpenJDK CI gap means regressions there also go undetected. See [OpenJDK status report](../openjdk). |
| GraalVM (Native Image `native-image`, `jfr-converter` helper only) | Runtime dependency | Optional | Experimental/failing: LLVM backend calling convention not implemented for riscv64 | Not functional | No native-image riscv64 binary for `jfr-converter` | [oracle/graal#13516](https://github.com/oracle/graal/issues/13516) (GraalCallingConvention missing in RISCVISelLowering.cpp, blocks all IR compilation), #13386 (pthread crash on shutdown), #13391 (pthread_key_t mapping); fix PR #13826 open. See [GraalVM status report](../graalvm). |
| glibc (`libdl`, `libpthread`, `librt`) | Runtime dependency - dynamic loading, thread support, POSIX timers | Critical | Builds | Functional; riscv64 glibc ships in Debian sid, Ubuntu, Arch riscv64 | Released, packaged | Known glibc riscv64 test-suite failures exist but are not production-blocking for async-profiler's symbol use; both sourceware.org riscv64 Buildbot builders reported offline/failing, so regressions are not CI-gated upstream. See [glibc status report](../glibc). |
| GCC | Build dependency - compiles `libasyncProfiler.so` and the bundled `jattach` helper | Critical | Builds; riscv64 backend stable since GCC 7.5.0 | N/A (build-time only) | N/A | None riscv64-specific; Clang 7.0.0+ is an accepted alternative per the README. |

**GraalVM's own riscv64 dependency chain** (indirect, recursed one level): GraalVM Native Image's riscv64 path is itself blocked by an LLVM 20.1.4 fork carrying the same calling-convention gap as #13516, a libffi 3.4.8 float-marshaling bug fixed only in 3.6.0, and a musl+GCC toolchain issue ([oracle/graal#8684](https://github.com/oracle/graal), no assignee). None of these are fixable from within async-profiler; they gate the `jfr-converter` helper JAR only, not the core profiling agent.

The bundled `jattach` helper (`src/jattach/`, vendored source rather than an external dependency) is pure C, architecture-neutral, and builds and functions on riscv64 with no known issues; it uses `/proc` and Unix sockets and has no riscv-specific code path.

## 11. Known Bugs and Active Issues

### 11.1 RISC-V-Specific Open Issues

**None.** Zero open issues mention riscv, riscv64, or RISC-V in the async-profiler tracker. This was independently confirmed via three separate methods: the GitHub search API (`total_count: 0` across repeated attempts, including after rate-limit retries), a direct GitHub web issue-search UI fetch ("Your search did not match any issues"), and a `riscv nan floating` query (0 matches - no NaN/floating-point correctness issue exists in this tracker for RISC-V). This reflects absence of testing and production usage at scale rather than confirmed absence of defects.

### 11.2 Documented Implementation Defects (from source, all confirmed by direct code reading)

1. `unwindPrologue()`, `unwindEpilogue()`, `adjustSP()` are literal "Not yet implemented" stubs - frames at JIT-compiled method prologue/epilogue boundaries are not recovered (Section 4.3).
2. DWARF unwinding is structurally absent (`DWARF_SUPPORTED=false`); requesting `--cstack dwarf` on riscv64 produces a hard runtime error (Section 4.5).
3. VMStructs fast-path stack walking (`CSTACK_VM`) is confirmed disabled - `_interpreter_frame_bcp_offset` is never set for riscv64, so `hasStackStructs()` is unconditionally false (Section 4.5; this closes out what was an unverified hypothesis in earlier research).
4. PLT constants (`PLT_HEADER_SIZE`, `PLT_ENTRY_SIZE`) are acknowledged guesses, not derived from the RISC-V psABI - incorrect values misattribute PLT-routed calls.
5. TSC is absent (`TSC_SUPPORTED=false`, `rdtsc()=0`) - no JFR timestamp correlation on riscv64, despite the `cycle` CSR being available on essentially all Linux-booted riscv64 cores.
6. `isSyscall()` has an acknowledged ECALL ambiguity (RISC-V uses the same opcode for syscalls and debugger traps); no fix exists.
7. `R_GLOB_DAT = -1` sentinel workaround for RISC-V's lack of a GLOB_DAT relocation is present and deliberate, not a defect.

### 11.3 General Open Issues Potentially Relevant to riscv64

Carried from prior research, not independently re-queried this cycle [NEEDS VERIFICATION]: [#1661](https://github.com/async-profiler/async-profiler/issues/1661) "VM structs stack walker fails to walk after an interpreter method is retransformed/redefined" (stack-walking correctness, relevant given riscv64's disabled VMStructs path); [#1676](https://github.com/async-profiler/async-profiler/issues/1676) "Unify dwarf and vm stack walking modes" (particularly relevant to architectures, like riscv64, lacking both DWARF and VMStructs); [#1756](https://github.com/async-profiler/async-profiler/issues/1756) "Runtime attach fails on JVMs with many native libraries" (not architecture-specific).

### 11.4 Performance Data

No benchmark comparing async-profiler overhead on riscv64 against arm64 or x86-64 exists in any public source - not in project docs, blog posts, or academic papers. The only performance-adjacent statement on record is `zifeihan`'s comment in PR #644 that SpecJVM2008 sampling results on riscv64 "compared favorably" against an aarch64 baseline - no numbers, methodology, or hardware specification were published. Data not available: async-profiler riscv64 vs. arm64/x64 sampling overhead, signal-delivery latency, or stack-walk time.

## 12. Objections and Upstream Blockers

**Single-maintainer bottleneck.** All merges go through `apangin`. He raised a sustainability objection in September 2022 and, more concretely, stated in November 2022 that "the project does not accept external code contributions at this moment" - a policy stance, not a technical one - which held PR #644 for roughly 14 months. There is no deputy maintainer, no written contribution SLA, and no committed review turnaround; any future riscv64 patch is subject to the same unpredictable delay.

**No active riscv64 maintainer since the 2023 merge.** `zifeihan` (Alibaba) committed to ongoing maintenance in November 2023. No riscv64-specific commit from `zifeihan` or any other contributor has landed through v4.5 (2026-07-20). PR #1185 (2025-03-21), despite incidentally touching `stackFrame_riscv64.cpp` in a build log, is an unrelated general build fix, not riscv64 maintenance work.

**GraalVM Native Image blocks `jfr-converter` on riscv64.** The LLVM backend calling convention for riscv64 is unimplemented ([oracle/graal#13516](https://github.com/oracle/graal/issues/13516)), compounded by a pthread shutdown crash (#13386) and a `pthread_key_t` mapping issue (#13391); a fix (PR #13826) is open but unmerged. This is an upstream GraalVM dependency, not fixable from within async-profiler, and is transitively deepened by GraalVM's own riscv64 LLVM-fork and libffi issues (Section 9).

**Linux PMU reliability on riscv64.** The SBI PMU driver has an IRQ-storm bug under high sampling rates (ByteDance patch exists, no upstream merge date found) and a counter-stop bug (Alibaba patch, rejected by the maintainer, pending rework). These affect the core CPU-sampling engine at high sampling frequencies, independent of async-profiler's own code.

**No binary distribution path.** No Debian package, no Ubuntu package, no PyPI package, and no official upstream binary release exists for riscv64 (Section 8). Users on RISC-V hardware must build from source with no official cross-compilation documentation. This adoption friction is largely independent of async-profiler's own port quality and would require either an upstream CI/release policy change from `apangin` or third-party packaging investment.

**No RISE Project involvement.** Confirmed by checking the RISE blog (all 35 posts via sitemap, 2024-05-15 through 2026-09-28 - no title or checked body mentions async-profiler), the RISE Python wheel builder's listed package set (70 packages, no profiler tooling), the RISE GitHub org (`riseproject-dev`, 26 repos, no async-profiler match), the RISE members list, and targeted web searches - none surface a connection. async-profiler is therefore not benefiting from any RISE-funded engineering, CI runner access, or ecosystem-integration work currently.

## 13. Readiness Assessment

- **Color:** orange (no-upstream-ci-no-release - a plain Step-1 orange row; not a distro-floor case, since no distribution packages async-profiler at all, so there is nothing to float up from)
- **Release provider:** none

**Justification:** All 7 GitHub Actions workflow files were read and adversarially re-verified directly from `raw.githubusercontent.com`: the CI matrix in [test-and-publish-nightly.yml](https://github.com/async-profiler/async-profiler/blob/master/.github/workflows/test-and-publish-nightly.yml) builds and tests only linux-arm64, linux-x64, and macOS - there is no riscv64 build job, test job, or QEMU step anywhere. The [v4.5 release assets](https://github.com/async-profiler/async-profiler/releases/tag/v4.5) ship only linux-arm64/linux-x64/macos tarballs, jars, and source - no riscv64 artifact has ever been published by upstream (release provider: none). No Linux distribution packages it either: Ubuntu 26.04/resolute search returns zero results for any architecture, and Debian/official-Arch also lack the package per prior research, so no distro floor applies. This lands squarely on the Step 1 "orange" row (no upstream CI, no test execution, no upstream release). It is not red: riscv64 source-level support ([PR #644](https://github.com/async-profiler/async-profiler/pull/644), merged 2023-11-26, first shipped v3.0) was manually validated by contributors on real hardware (HiFive Unmatched, LicheePi-4A) and in QEMU, and the README explicitly lists riscv64 as a community-maintained "other available port" rather than claiming it is broken. Not grey either: this is a well-characterized known state, not an unknown-unknown. async-profiler is a JVM sampling profiler/observability tool, not a project whose core value proposition is architecture-specific speed (no SIMD/crypto/compression/allocator framing), so the optimization-purpose modifier does not apply and no optimization-level rating is assigned.

**Pending work that could change the grade:** No open PR or issue adds riscv64 CI or a riscv64 release job. PR #1185 (merged 2025-03-21) was an unrelated build fix incidentally touching a riscv64 source file. `zifeihan` (Alibaba) volunteered in November 2023 to maintain the riscv64 port, but no riscv64-specific commits have landed since, through v4.5 (2026-07-20). RISE Project involvement is confirmed absent (not in the riseproject.dev blog, GitHub org, member list, or wheel builder). Several stack-unwinding functions (`unwindPrologue`/`unwindEpilogue`/`adjustSP`) remain explicit stubs in `src/stackFrame_riscv64.cpp`, and GraalVM Native Image's riscv64 LLVM backend gap ([oracle/graal#13516](https://github.com/oracle/graal/issues/13516)) blocks the `jfr-converter` helper - neither is CI/release-blocking for the core agent but would matter in a more code-completeness-oriented reassessment. The RISE RISC-V Runners program (free native RISC-V CI on GitHub, announced 2026-03-24) is available infrastructure that async-profiler has not adopted and that would materially lower the cost of closing the CI gap if a contributor pursued it.

## 14. Investment Analysis

RISE has not funded, benchmarked, or otherwise engineered any part of async-profiler's riscv64 support (Section 12) - none of the following work is already covered by outside investment.

### 14.1 Functional Enablement

**Implement `unwindPrologue`, `unwindEpilogue`, `adjustSP` in `stackFrame_riscv64.cpp`.** Highest-priority gap: these functions determine whether frames at JIT-compiled method boundaries are correctly recovered, and their absence is compounded by DWARF and VMStructs both being structurally unavailable on riscv64 (Section 4.5), leaving no fallback unwinding strategy. `stackFrame_aarch64.cpp` (354 lines) is the reference implementation. Requires a developer fluent in the RISC-V ABI and HotSpot JIT code generation, plus riscv64 hardware or a reliable QEMU environment. Correctness cannot be validated without full JVM workloads (SPECjvm2008, Renaissance) compared against known-good flamegraphs. Effort: 6-10 person-weeks.

**Implement VMStructs `_interpreter_frame_bcp_offset` for riscv64.** Unlocks the CSTACK_VM fast path currently disabled entirely on riscv64. Requires determining the correct HotSpot riscv64 interpreter frame offset from OpenJDK source. Effort: 1-2 person-weeks.

**Implement TSC via the `cycle` CSR in `src/tsc.h`.** Adds JFR timestamp correlation; the aarch64 implementation (`cntvct_el0` inline asm) is a direct analogue. Effort: 1-2 person-weeks.

**Verify and correct PLT constants in `arch.h`.** Must be confirmed against the RISC-V psABI and actual PLT entries in GCC- and LLVM-compiled riscv64 ELF binaries (lld and GNU ld may differ). Effort: 0.5 person-weeks.

**Implement `safeAccess` inline asm for riscv64.** Lower priority - the C fallback is functional; an asm implementation with explicit fault-handler registration would improve reliability profiling partially-unmapped regions. Effort: 1-2 person-weeks.

**DWARF unwinding support.** Larger, lower-priority item: extending `dwarf.h`/`dwarf.cpp` to riscv64 would give the port a second unwinding strategy independent of frame-pointer completeness. Not scoped in detail here; likely comparable in size to the aarch64 DWARF implementation. Data not available: no existing riscv64 DWARF prototype or design was found in any source checked.

### 14.2 Performance Optimization

Data not available: no benchmark comparing async-profiler overhead on riscv64 versus arm64 or x86-64 has been published anywhere (Section 11.4). Performance optimization work cannot be scoped without a baseline measurement campaign (signal delivery latency, stack-walk time, perf-event overhead) on target hardware. The informal SpecJVM2008 comparison from PR #644 provides no actionable numbers.

### 14.3 CI/CD Infrastructure

**Add riscv64 to the CI matrix.** GitHub Actions has no first-party hosted riscv64 runner. Options: (a) the RISE RISC-V Runners program (free native RISC-V CI on GitHub, live since March 2026, currently unused by this project) - the lowest-cost path given it requires no hardware procurement by async-profiler or a sponsor; (b) a self-hosted riscv64 runner (board or server); (c) QEMU user-mode emulation (`qemu-riscv64-static`), adequate for build/unit tests but not for perf-event testing, which needs real hardware. `apangin` verified the v3.0 merge manually via QEMU, so the mechanism is known to work; the gap is wiring it into CI and getting maintainer buy-in. Effort: 2-4 person-weeks if using RISE Runners (lower integration overhead than self-hosting); 3-4 person-weeks for self-hosted, plus ongoing runner cost.

**Publish riscv64 binary releases.** The Makefile already supports `make release` producing a correctly-named riscv64 tarball; the gap is CI integration and upload automation, conditional on CI existing first. Effort: 1-2 person-weeks.

### 14.4 Ecosystem Enablement

**Package async-profiler for Debian/Ubuntu (any architecture).** async-profiler is not in Debian or Ubuntu at all - this is packaging from scratch, not a riscv64-specific patch, and is a prerequisite independent of riscv64 port status. A Debian ITP (Intent to Package) is the entry point. Effort: 4-6 person-weeks initial, plus a long tail for Debian NEW queue processing.

**Monitor GraalVM riscv64 progress for `jfr-converter`.** Blocked on [oracle/graal#13516](https://github.com/oracle/graal/issues/13516) and #13386; fix PR #13826 is open. Outside async-profiler's control. Effort within async-profiler: 0 (blocked upstream); low ongoing effort to track.

### 14.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Implement `unwindPrologue`, `unwindEpilogue`, `adjustSP` | 6-10 | Needs RISC-V + HotSpot JIT expertise | Critical |
| Functional | Implement VMStructs `_interpreter_frame_bcp_offset` | 1-2 | Contributor with OpenJDK source access | High |
| Functional | Implement TSC via `cycle` CSR | 1-2 | Contributor with riscv64 toolchain | High |
| Functional | Verify and correct PLT constants | 0.5 | Contributor with riscv64 linker knowledge | High |
| Functional | Implement `safeAccess` inline asm | 1-2 | Contributor with riscv64 asm | Low |
| Functional | DWARF unwinding support | Data not available (unscoped) | Needs DWARF + RISC-V expertise | Medium |
| CI/CD | Add riscv64 to CI matrix (RISE Runners preferred, else self-hosted/QEMU) | 2-4 | DevOps + needs `apangin` acceptance | High |
| CI/CD | Publish riscv64 binary releases | 1-2 | Conditional on CI; needs `apangin` acceptance | Medium |
| Ecosystem | Debian/Ubuntu packaging (any arch, prerequisite) | 4-6 | Debian maintainer | Medium |
| Ecosystem | Monitor GraalVM #13516 for `jfr-converter` | Low ongoing | Tracker role | Low |
| Performance | Baseline benchmark campaign on riscv64 hardware | Data not available - cannot scope | - | Prerequisite for optimization work |

## 15. References

- [async-profiler repository](https://github.com/async-profiler/async-profiler)
- [async-profiler homepage (returns HTTP 404, does not resolve)](https://async-profiler.github.io/)
- [PR #644 "Basic RISC-V support"](https://github.com/async-profiler/async-profiler/pull/644) - merged 2023-11-26
- [Merge commit 752b79e](https://github.com/async-profiler/async-profiler/commit/752b79ec4e4cc46c105dade93e1df1954fbbc638)
- [Follow-up fix commit 0d0f0f0](https://github.com/async-profiler/async-profiler/commit/0d0f0f0c670c2d4dbea6eb9a0284079f58e2fb91)
- [PR #1185 "Fix compilation with source merging disabled"](https://github.com/async-profiler/async-profiler/pull/1185) - merged 2025-03-21, not riscv64-specific
- [v4.5 release](https://github.com/async-profiler/async-profiler/releases/tag/v4.5) - latest stable, 2026-07-20
- [test-and-publish-nightly.yml CI workflow](https://github.com/async-profiler/async-profiler/blob/master/.github/workflows/test-and-publish-nightly.yml)
- [GraalVM issue #13516](https://github.com/oracle/graal/issues/13516) - LLVM backend calling convention not implemented on riscv64, blocks `jfr-converter`
- [GraalVM issue #13386](https://github.com/oracle/graal/issues/13386) - pthread crash on shutdown on riscv64
- [GitHub issue #1661](https://github.com/async-profiler/async-profiler/issues/1661) - VM structs stack walker failure after retransform/redefine
- [GitHub issue #1676](https://github.com/async-profiler/async-profiler/issues/1676) - unify dwarf and vm stack walking modes
- [GitHub issue #1756](https://github.com/async-profiler/async-profiler/issues/1756) - runtime attach fails on JVMs with many native libraries
- [RISE Project members](https://riseproject.dev/)
- [RISE RISC-V Runners announcement](https://riseproject.dev/2026/03/24/announcing-the-rise-risc-v-runners-free-native-risc-v-ci-on-github/)
- [RISE: OpenJDK - Supercharging Vectorized Math with SLEEF](https://riseproject.dev/2025/09/24/openjdk-supercharging-vectorized-math-with-sleef/)
- [RISE: OpenJDK CMoveX & Vectorization](https://riseproject.dev/2025/07/23/cmovex-vectorization/)
- [RISE Python wheel builder](https://riseproject.gitlab.io/python/wheel_builder/)