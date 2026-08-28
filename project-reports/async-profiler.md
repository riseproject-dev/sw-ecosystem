---
title: async-profiler
categories:
  - perfmon
---

# async-profiler

**Author:** Ludovic HENRY &lt;ludovic.henry@qti.qualcomm.com&gt;<br/>
**Date:** 2026-06-17<br/>
**Scope:** RISC-V (riscv64/linux) support status for async-profiler<br/>
**Audience:** Technical leadership, resource allocation strategy<br/>
**Verification policy:** Every claim is cross-referenced to a primary upstream source. Items that could not be verified against a second source are marked [NEEDS VERIFICATION].<br/>

---

## 1. Project Overview

[async-profiler](https://async-profiler.github.io/) is a low-overhead sampling profiler for JVM-based applications. It produces CPU flamegraphs and allocation profiles by combining Linux `perf_event_open(2)`, the HotSpot `AsyncGetCallTrace` API, and JVMTI callbacks. The project is hosted at [github.com/async-profiler/async-profiler](https://github.com/async-profiler/async-profiler) under the Apache-2.0 license.

The project is maintained by a single individual: **Andrei Pangin** (`apangin`), an independent Java Champion with a HotSpot background. He is the sole member of the `async-profiler` GitHub organization and the sole merge authority. There is no foundation affiliation, no formal governance document, and no corporate steering committee. The project is not a RISE member and has received no RISE funding.

The contributor base is heavily AWS/Amazon-dominated. The four highest-commit non-maintainer contributors (fandreuz, Baraa-Hasheesh, krk, benty-amzn) are all Amazon/AWS employees, accounting for 4 of the top-6 non-maintainer contributor slots.

---

## 2. Port History and Upstreaming Timeline

| Date | Event |
|---|---|
| 2022-09-02 | [PR #644](https://github.com/async-profiler/async-profiler/pull/644) "Basic RISC-V support" opened by `shipilev` (Aleksey Shipilev, AWS) |
| 2022-09-05 | `apangin` blocks merge: "the project does not accept external code contributions at this moment. This is temporary." No technical objection raised. |
| 2022-11-28 | `RealFYang` revives PR; `zifeihan` (Alibaba) adds missing `PROBE_SP_LIMIT` constant, shares passing `make test` output on riscv64 hardware |
| 2023-11-26 | PR #644 merged by `apangin` (merge commit `752b79ec4e4cc46c105dade93e1df1954fbbc638`). Follow-up fix commit `0d0f0f0` corrects `retval()` register mapping and adds missing interface methods. |
| 2024-01-21 | v3.0 released. Changelog entry: "#644: RISC-V and LoongArch64 ports" under Features. First and only release to mention RISC-V. |
| 2024-present | v4.0 through v4.4 (latest: v4.4, 2026-04-20): zero RISC-V mentions in any changelog. |
| 2025-03-21 | [PR #1185](https://github.com/async-profiler/async-profiler/pull/1185) "Fix compilation with source merging disabled" (fandreuz, AWS) opened, targeting riscv64. Closed without merge. |

The 14-month gap between PR submission (Sep 2022) and merge (Nov 2023) was caused by a maintainer-imposed contribution freeze, not by technical deficiencies in the patch. There is one merged RISC-V PR total in the repository's history. No dedicated tracking issue was ever filed. The entire RISC-V port effort resolves through a single PR thread.

---

## 3. Upstream Support Tier

The README defines an explicit two-tier platform model:

| Tier | Linux | macOS |
|---|---|---|
| **Tier 1** (officially maintained builds, CI, binary releases) | x64, arm64 | x64, arm64 |
| **Tier 2** (other available ports, source-only, no CI, no binaries) | x86, arm32, ppc64le, **riscv64**, loongarch64 | -- |

riscv64 is classified as Tier 2. This is the same tier as ppc64le and loongarch64. It compiles and can run, but the project makes no guarantees about correctness, maintenance, or binary availability on riscv64.

---

## 4. Technical Architecture and RISC-V-Specific Subsystems

### 4.1 Architecture-Specific File Inventory

| File | Lines | Status |
|---|---|---|
| `src/arch.h` (riscv64 block) | 19 of 204 | Partial -- PLT sizes are guesses |
| `src/stackFrame_riscv64.cpp` | 110 | Partial -- 3 of the critical unwinding functions are stubs |
| `Makefile` (riscv64 lines) | 2 of 328 | Complete for build purposes |

For comparison, the mature ports have substantially larger and fully-implemented stackFrame files: `src/stackFrame_x64.cpp` (246 lines, zero stubs), `src/stackFrame_aarch64.cpp` (354 lines, zero stubs).

### 4.2 Register Accessors (`src/stackFrame_riscv64.cpp`)

The following register accessors are fully implemented via `uc_mcontext.__gregs[]` mappings:

- `pc()` -> `REG_PC`
- `sp()` -> `REG_SP`
- `fp()` -> `REG_S0` (frame pointer)
- `retval()` -> `REG_A0` (corrected in follow-up commit `0d0f0f0`; original PR had it mapped to `REG_RA` in error)
- `link()` -> `REG_RA` (x1, return address)
- `arg0()` through `arg3()` -> `REG_A0` + offset
- `jarg0()` -> `arg1()` (Java calling convention: receiver occupies a0, first Java arg is at a1)
- `method()` -> `REG(31)` (x31/t6, used as JVM method register on RISC-V)
- `senderSP()` -> `REG(19)` (x19/s3)

### 4.3 Stack Unwinding Stubs

The following functions are explicitly marked "Not yet implemented":

- `unwindPrologue()` -- returns `false`
- `unwindEpilogue()` -- returns `false`
- `adjustSP()` -- no-op

On x64 and aarch64, these three functions perform instruction-pattern scanning to reconstruct stack frames at function entry/exit boundaries where the frame pointer has not yet been established or has already been torn down. On riscv64, all three return immediately without unwinding. This causes dropped or corrupt frames during sampling of JIT-compiled Java methods at prologue and epilogue boundaries.

`unwindStub()` is partially implemented -- it handles the itable, vtable, and InlineCacheBuffer cases by setting `pc = link()`. The x64 and aarch64 versions contain substantially more pattern-matching logic.

`isSyscall()` checks for opcode `0x00000073` (ECALL) but the source comment acknowledges: "RISC-V ISA uses ECALL for both syscalls and debugger calls, so this might technically mismatch."

### 4.4 Architecture Constants (`src/arch.h`)

The riscv64 block is guarded by `#elif defined(__riscv) && (__riscv_xlen == 64)`. Key values:

- `BREAKPOINT`: `0x9002` (C.EBREAK, compressed) when `__riscv_compressed` is defined; `0x00100073` (EBREAK, 32-bit) otherwise.
- `PLT_HEADER_SIZE = 24` and `PLT_ENTRY_SIZE = 24`: commented as "Best guess from examining readelf" -- not derived from the official RISC-V psABI. Incorrect values would cause wrong attribution of calls through the PLT.
- `spinPause()`: empty no-op, comment "No architecture support". Correct for RV64I base ISA; the `Zihintpause` extension is not assumed.
- `rmb()`: `asm volatile("fence" : : : "memory")` -- correct.
- `PERF_REG_PC = 0`: correct; matches `PERF_REG_RISCV_PC = 0` in the Linux kernel.

### 4.5 Components With No RISC-V Implementation

- **`src/tsc.h`**: x86 uses `rdtsc`; aarch64 uses `cntvct_el0`. riscv64 falls to the `#else` branch: `TSC_SUPPORTED = false`, `rdtsc() = 0`. RISC-V has the `cycle` CSR (Zicntr extension) but it is not implemented. JFR timestamp correlation is absent on RISC-V.
- **`src/safeAccess.cpp`**: x86-64, i386, and aarch64 have inline-asm specializations for safe memory loads with fault isolation. riscv64 falls to the generic C path. This provides weaker fault-isolation guarantees.
- **`src/vmStructs.cpp`**: The interpreter frame BCP offset (`_interpreter_frame_bcp_offset`) and entry frame call wrapper offset are set only for x86, aarch64, and arm32. No riscv64 branch exists. This likely causes `_has_stack_structs` to evaluate false on RISC-V, disabling interpreter-aware scope stack walking [NEEDS VERIFICATION].
- **`src/symbols_linux.cpp`**: Contains a RISC-V-specific workaround: `#define R_GLOB_DAT -1` with comment "RISC-V does not have GLOB_DAT relocation, use something neutral, like the impossible relocation number." This is present and handled.
- **RVV / Zba / Zbb**: No SIMD or bitmanip extension intrinsics are used anywhere in the codebase. Not applicable.

---

## 5. Build System, Cross-Compilation, and Toolchain

The project uses a hand-written `Makefile` exclusively. There is no CMakeLists.txt, no BUILDING.md, no cross-compilation documentation.

### 5.1 Native Build (on a riscv64 host)

```
make JAVA_HOME=<path-to-jdk>
```

The Makefile auto-detects `uname -m == riscv64` and sets `ARCH_TAG=riscv64`. This controls release artifact naming (produces `async-profiler-<version>-linux-riscv64.tar.gz` via `make release`).

### 5.2 Cross-Compilation (from x86-64 host)

```
make CROSS_COMPILE=riscv64-linux-gnu- JAVA_HOME=<path-to-riscv64-jdk>
```

The Makefile rewrites all toolchain variables when `CROSS_COMPILE` is set:

```makefile
CC  := $(CROSS_COMPILE)gcc
CXX := $(CROSS_COMPILE)g++
AS  := $(CROSS_COMPILE)as
LD  := $(CROSS_COMPILE)ld
STRIP   := $(CROSS_COMPILE)strip
OBJCOPY := $(CROSS_COMPILE)objcopy
```

Cross-compilation support is present in the Makefile and was offered during the PR #644 review thread (by `luhenry`). No official cross-compilation documentation exists in the repository.

A known issue: the Makefile wraps `-momit-leaf-frame-pointer` with `ifneq ($(ARCH_TAG),riscv64)` -- this flag is excluded for RISC-V because the compiler does not support it. This was added in PR #644.

If the cross-compiler does not support `-fwhole-program` combined with `-fPIC -shared`, use `MERGE=false`:

```
make CROSS_COMPILE=riscv64-linux-gnu- MERGE=false JAVA_HOME=<path>
```

### 5.3 Toolchain Requirements

From the README (applies to all architectures):

- GCC 7.5.0+ or Clang 7.0.0+ (GCC 7 is the first version with stable riscv64 Linux target; Clang 7 added the riscv64 backend)
- JDK 11+ (build-time, for Java helper classes and converter JAR)
- For cross-compilation: `gcc-riscv64-linux-gnu` / `g++-riscv64-linux-gnu` packages

Key compile flags applied on all architectures including riscv64:

```
-O3 -fno-exceptions -fno-rtti -fno-omit-frame-pointer -fvisibility=hidden -std=c++11
-U_FORTIFY_SOURCE -Wl,-z,defs -static-libstdc++ -static-libgcc
-fdata-sections -ffunction-sections -Wl,--gc-sections
-Wno-psabi
-ldl -lpthread -lrt
```

`-Wno-psabi` suppresses ABI-compatibility warnings that GCC may emit for riscv64 due to evolving psABI revisions.

No riscv64 Docker builder image exists in the repository. The official ECR builder images (`public.ecr.aws/async-profiler/asprof-builder-{arm:latest,x86:latest}`) cover only arm64 and x86-64. No musl-based riscv64 static binary is produced or published.

---

## 6. Feature Coverage and Gap Analysis vs arm64 and amd64

| Component | amd64 | arm64 | riscv64 |
|---|---|---|---|
| Register accessors | Full | Full | Full |
| `unwindStub` | Full | Full | Partial (3 cases only) |
| `unwindPrologue` | Full | Full | **Missing (returns false)** |
| `unwindEpilogue` | Full | Full | **Missing (returns false)** |
| `unwindAtomicStub` | N/A | Full | N/A |
| `adjustSP` | N/A | Full | **Missing (no-op)** |
| `isSyscall` | Full | Full | Partial (ECALL ambiguity) |
| TSC / `rdtsc` | Full (asm) | Full (asm) | **Missing (returns 0)** |
| `safeAccess` | Full (asm) | Full (asm) | Scalar C fallback |
| `vmStructs` BCP offset | Full | Full | **Missing** |
| PLT constants | Verified | Verified | **Guessed** |
| CI coverage | Yes | Yes | **None** |
| Binary releases | Yes | Yes | **None** |
| Official support tier | Tier 1 | Tier 1 | Tier 2 |

The riscv64 port is at roughly the same completeness level as ppc64le and loongarch64. Both of those architectures also have stub `unwindPrologue` and `unwindEpilogue`. riscv64 additionally lacks binary releases and CI coverage, and has no verified active maintainer posting upstream patches.

---

## 7. CI/CD Infrastructure

riscv64 is completely absent from the CI configuration. This is confirmed by reading all 7 workflow files in `.github/workflows/`:

- `build.yml` -- no "riscv" string
- `test-and-publish-nightly.yml` -- no "riscv" string
- `integ.yml` -- no "riscv" string
- `code-check.yml` -- no "riscv" string
- `clang-tidy-review.yml` -- no "riscv" string
- `compare-binary-sizes.yml` -- no "riscv" string
- `linters.yml` -- no "riscv" string

No Jenkinsfile, `.gitlab-ci.yml`, or `.cirrus.yml` exists in the repository.

The CI matrix (`test-and-publish-nightly.yml`) covers exactly three build targets:

| Target | Runner | Container |
|---|---|---|
| linux-arm64 | ubuntu-24.04-arm | arm:latest |
| linux-x64 | ubuntu-latest | x86:latest |
| macos | macos-15 (arm64) + macos-15-intel (x64) | -- |

No QEMU emulation for riscv64, no cross-compilation, no riscv64 runner. There is no official guidance or repository script for QEMU-based riscv64 testing. Verification at PR #644 merge time was done manually by `apangin` via QEMU and by `zifeihan` on LicheePI-4A hardware.

Any riscv64 regression introduced in any commit since v3.0 is invisible to CI. No automated gate exists.

---

## 8. Distribution and Release Status

### 8.1 Upstream Binary Releases

Releases v4.2 (2025-10-19) through v4.4 (2026-04-20) and nightly (2026-06-11) ship exactly 7 assets per release:

- `async-profiler-X.Y-linux-arm64.tar.gz`
- `async-profiler-X.Y-linux-arm64-debug.tar.gz`
- `async-profiler-X.Y-linux-x64.tar.gz`
- `async-profiler-X.Y-linux-x64-debug.tar.gz`
- `async-profiler-X.Y-macos.zip`
- `async-profiler.jar`
- `jfr-converter.jar`

No `linux-riscv64` asset exists in any release. Users must build from source. The `pom.xml` produces classified JARs only for linux-x64, linux-arm64, and macos.

### 8.2 Linux Distribution Packages

| Distribution | Package status | riscv64 binary |
|---|---|---|
| Debian | Not in package archive (tracker.debian.org returns 404) | N/A |
| Ubuntu | Not in any Ubuntu suite (packages.ubuntu.com returns no results) | N/A |
| Arch Linux (official) | Not in official repos (0 results via packages API) | N/A |
| Arch Linux (AUR) | `async-profiler 4.4-1`, `async-profiler-bin 4.4-2`, `async-profiler-git` exist as build scripts | `async-profiler-bin` explicitly downloads upstream x64/arm64 tarballs; would fail on riscv64 |
| PyPI | HTTP 404 -- package does not exist | N/A |
| RISE wheel builder | Not present in the RISE riscv64 wheel builder package list | N/A |
| Arch Linux RISC-V (archriscv.felixc.at) | Not present | None |

---

## 9. Dependencies

| Dependency | Role | riscv64 Build | riscv64 Runtime | Blocking Issues |
|---|---|---|---|---|
| Linux `perf_events` (`perf_event_open(2)`) | CPU sampling engine | Builds (kernel 5.4+) | Software counters functional; hardware PMU via SBI PMU driver; callchain frame-pointer path fixed in kernel 6.12 (2024-09-15) | PMU throttle IRQ-storm bug (ByteDance patch, no merge date); fixed counter stop bug (Alibaba patch, rejected, needs rework) |
| OpenJDK HotSpot (`AsyncGetCallTrace`, JVMTI, TLAB) | Java callstack unwinding; allocation profiling | Builds; all JVM variants present | C1/C2/interpreter validated on HiFive Unmatched (JDK 20) and LicheePI-4A (PR #644) | `unwindPrologue`/`unwindEpilogue` stubs produce incomplete frames at JIT boundary; no official riscv64 OpenJDK binary from upstream |
| GraalVM Native Image (`native-image`) | `jfr-converter` binary only | Experimental/failing: LLVM backend calling convention not implemented on riscv64 (issue #13516); pthread crash on shutdown (#13386) | Not functional on riscv64 | Fix PR #13826 open; `pthread_key_t` type mapping wrong (#13391 open); JDWP build failure (#12106) |
| glibc (`libdl`, `libpthread`, `librt`) | Dynamic loading, thread support, POSIX timers | Builds | Functional; riscv64 glibc ships in Debian sid, Ubuntu, Arch riscv64 | Known test suite failures in glibc riscv64 test suite but no production-blocking issues for async-profiler symbol use |
| GCC / Clang (build-time) | Compiles `libasyncProfiler.so` and `jattach` | Builds; riscv64 backend stable in both | N/A | None |
| `jattach` (bundled in `src/jattach/`) | Dynamic attach to running JVMs | Builds; pure C, architecture-neutral | Functional; uses `/proc` ptrace and Unix sockets | None riscv64-specific |

---

## 10. Ecosystem Status

- **RISE project involvement:** None. The RISE funded project list (RP001-RP016) contains no async-profiler entry. All 27 RISE blog posts (May 2024 - Jun 2026) contain zero mentions of async-profiler. The RISE riscv64 wheel builder does not include async-profiler.
- **RISE member activity:** `zifeihan` (Alibaba), a RISE General Member, contributed to PR #644 and committed to maintaining the riscv64 port in November 2023. No follow-up commits from `zifeihan` or any Alibaba contributor appear in v4.x.
- **Published benchmarks:** None. The only performance-adjacent statement on record is a comment from `zifeihan` in PR #644 that specjvm2008 results on riscv64 compared "favorably against linux-aarch64" -- no numbers, no methodology, no hardware specification were published.
- **Testing history:** PR #644 validated smoke tests (smoke-test.sh, thread-smoke-test.sh, alloc-smoke-test.sh, load-library-test.sh, fdtransfer-smoke-test.sh) passing on LicheePI-4A hardware. Profiling modes `-Xint`, C1, and C2 were exercised. No structured performance study exists in any public source.

---

## 11. Known Bugs and Active Issues

### 11.1 RISC-V-Specific Open Issues

**None.** Zero open issues mentioning riscv, riscv64, or RISC-V exist in the async-profiler issue tracker or Discussions. This reflects absence of testing and usage at scale rather than absence of bugs.

### 11.2 Documented Implementation Defects (from source code)

1. **`unwindPrologue` / `unwindEpilogue` / `adjustSP` are stubs** (`stackFrame_riscv64.cpp`): Frames at JIT-compiled method prologue and epilogue boundaries are not recovered. This produces dropped or corrupt frames in Java callstack profiles for compiled code.

2. **`unwindCompiled()` returns false** (present in the follow-up commit `0d0f0f0`): compiled Java stack unwinding is not implemented. [NEEDS VERIFICATION -- this maps to the renamed interface replacing the older `popMethod()` API.]

3. **PLT constants are guesses** (`arch.h`): `PLT_HEADER_SIZE = 24` and `PLT_ENTRY_SIZE = 24` are not derived from the RISC-V psABI specification. Incorrect values produce wrong attribution for calls routed through the PLT.

4. **TSC absent** (`tsc.h`): `TSC_SUPPORTED = false`, `rdtsc() = 0` on riscv64. No JFR timestamp correlation. The `cycle` CSR (Zicntr extension) is available on most riscv64 targets but is not implemented.

5. **`vmStructs` BCP offset not set**: Interpreter frame BCP offset is not defined for riscv64, likely disabling interpreter-aware scope stack walking.

6. **`isSyscall()` ECALL ambiguity**: RISC-V uses the same `ECALL` opcode (`0x00000073`) for both syscalls and debugger traps. The source comment explicitly acknowledges "this might technically mismatch." No fix exists.

7. **`R_GLOB_DAT` workaround**: RISC-V lacks the GLOB_DAT relocation type. A sentinel value of `-1` is used. This is present and handled but represents a divergence from the linker model used on other platforms.

### 11.3 General Open Issues That May Affect RISC-V

- **[#1661](https://github.com/async-profiler/async-profiler/issues/1661)** "VM structs stack walker fails to walk after an interpreter method is retransformed/redefined" (Jan 2026) -- stack walking correctness bug, not arch-specific but relevant given riscv64's incomplete vmStructs implementation.
- **[#1676](https://github.com/async-profiler/async-profiler/issues/1676)** "Unify `dwarf` and `vm` stack walking modes" (Feb 2026) -- DWARF vs VM stack walker consolidation, particularly relevant for architectures lacking mature frame pointer unwinding.
- **[#1756](https://github.com/async-profiler/async-profiler/issues/1756)** "Runtime attach fails on JVMs with many native libraries" (Jun 2026) -- not arch-specific.

---

## 12. Objections and Upstream Blockers

**Objection 1: Single-maintainer bottleneck.** All merges go through `apangin`. He imposed a contribution freeze in 2022 that held PR #644 for 14 months. There is no deputy maintainer, no written contribution policy, and no SLA for review turnaround. Any RISC-V patch submission is subject to the same unpredictable delay.

**Objection 2: No committed riscv64 maintainer.** `zifeihan` committed to maintaining the port in November 2023. No riscv64-related commits appear from any contributor through v4.4 (April 2026). The port has effectively been unattended for over two years since its introduction.

**Objection 3: GraalVM Native Image blocks `jfr-converter` on riscv64.** The LLVM backend calling convention for riscv64 is not implemented (GraalVM issue #13516). Until this is resolved, the JFR recording post-processing tool (`jfr-converter`) cannot be compiled on riscv64. This is a GraalVM upstream dependency, not fixable within async-profiler.

**Objection 4: Linux PMU reliability.** The SBI PMU driver on riscv64 has an IRQ-storm bug under high sampling rates (ByteDance patch, no upstream merge date) and a counter-stop bug (Alibaba patch, rejected by maintainer, pending rework). These affect the core CPU sampling engine at high frequencies.

**Objection 5: No binary distribution path.** There is no Debian package, no Ubuntu package, no PyPI package, and no official upstream binary release for riscv64. End users on RISC-V hardware must build from source. This creates adoption friction that is independent of async-profiler itself and would require either upstream policy change or third-party packaging investment.

---

## 13. Investment Analysis

### 13.1 Functional Enablement

These items unblock correct profiling on riscv64. All require upstream acceptance by `apangin`.

**Implement `unwindPrologue`, `unwindEpilogue`, `adjustSP` in `stackFrame_riscv64.cpp`**

The highest-priority gap. These three functions determine whether frames at JIT-compiled method boundaries are correctly recovered. The aarch64 implementation in `stackFrame_aarch64.cpp` (354 lines) provides the reference. riscv64 has a simpler calling convention (no Thumb-equivalent variable-width prologue complexity), but the implementation requires detailed knowledge of the riscv64 frame layout as generated by HotSpot C1 and C2.

Effort: 6-10 person-weeks. Requires a developer fluent in both the RISC-V ABI and HotSpot JIT code generation, plus access to riscv64 hardware or a reliable QEMU environment for iterative testing. Correctness cannot be validated without running full JVM workloads (e.g., SPECjvm2008, Renaissance benchmark suite) and comparing flamegraph output against known-good profiles.

**Implement TSC via `cycle` CSR in `src/tsc.h`**

Adds JFR timestamp correlation. The `cycle` CSR is available on all Linux-booted riscv64 cores that expose Zicntr (virtually universal). The aarch64 implementation is a direct analogue (cntvct_el0 read via inline asm). Implementation is straightforward.

Effort: 1-2 person-weeks.

**Implement `vmStructs` interpreter frame BCP offset for riscv64**

Required for interpreter-aware scope stack walking. Requires determining the correct frame offset value from the HotSpot riscv64 interpreter frame layout. This is a constant lookup against the OpenJDK source tree.

Effort: 1-2 person-weeks.

**Verify and correct PLT constants in `arch.h`**

`PLT_HEADER_SIZE` and `PLT_ENTRY_SIZE` are currently guesses (24 bytes each). These must be confirmed against the RISC-V psABI and verified by inspecting actual PLT entries in riscv64 ELF binaries compiled by GCC and LLVM with current linker defaults (lld and GNU ld may produce different PLT layouts).

Effort: 0.5 person-weeks.

**Implement `safeAccess` inline asm for riscv64**

Low priority -- the C fallback is functional. An asm implementation with explicit fault handler registration would improve reliability for profiling memory-mapped regions that may be partially unmapped.

Effort: 1-2 person-weeks.

### 13.2 Performance Optimization

**Data not available:** No benchmark comparing async-profiler overhead on riscv64 vs arm64 or x86-64 has been published. No profiling latency measurements (signal delivery, stack walk time, perf event overhead) exist for riscv64 in any public source. Performance optimization work cannot be scoped without a baseline measurement campaign on target hardware.

The informal specjvm2008 comparison from PR #644 ("looking good" against aarch64) provides no actionable data.

### 13.3 CI/CD Infrastructure

**Add riscv64 to CI matrix**

The CI (`test-and-publish-nightly.yml`) runs on GitHub-hosted runners. GitHub Actions does not offer a hosted riscv64 runner as of the research date. Options are:

- Self-hosted riscv64 runner (e.g., RISC-V development board or server with GitHub Actions runner agent)
- QEMU user-mode emulation via `qemu-riscv64-static` on an arm64 or x86-64 runner (slow; adequate for build and unit tests, not for perf event testing)
- Cross-compilation CI job producing binaries, with a separate hardware-based test stage

The maintainer (`apangin`) verified the v3.0 merge via QEMU manually. A QEMU-based CI job is technically feasible but has not been pursued. Adding CI requires `apangin`'s acceptance of the workflow change.

Effort: 3-4 person-weeks (setup, integration, maintenance). Ongoing: runner hardware cost or QEMU CPU overhead.

**Publish riscv64 binary releases**

Requires either extending the upstream release process (needs `apangin` agreement) or establishing a third-party binary distribution channel. The Makefile already supports `make release` producing `async-profiler-<version>-linux-riscv64.tar.gz`; the gap is CI integration and upload automation.

Effort: 1-2 person-weeks (conditional on CI being established first).

### 13.4 Ecosystem Enablement

**Package async-profiler for Debian/Ubuntu riscv64**

async-profiler is not in Debian or Ubuntu at all -- this requires packaging from scratch, not a riscv64-specific patch. A Debian ITP (Intent to Package) would be the entry point. This is independent of the RISC-V port status.

Effort: 4-6 person-weeks (initial packaging, policy review, upload). Long tail for Debian NEW queue processing.

**GraalVM Native Image riscv64 (`jfr-converter`)**

Blocked on GraalVM upstream issue #13516 (LLVM backend calling convention) and #13386 (pthread crash). Fix PR #13826 is open. This is outside async-profiler's control. If `jfr-converter` is required in the target deployment, track GraalVM riscv64 progress separately.

Effort within async-profiler: 0 (blocked on GraalVM). Monitoring: low ongoing effort.

### 13.5 Summary Table

| Area | Work Item | Effort (person-weeks) | Owner | Priority |
|---|---|---|---|---|
| Functional | Implement `unwindPrologue`, `unwindEpilogue`, `adjustSP` | 6-10 | Needs RISC-V + HotSpot JIT expertise | Critical |
| Functional | Implement TSC via `cycle` CSR | 1-2 | Any contributor with riscv64 toolchain | High |
| Functional | Set vmStructs BCP offset for riscv64 | 1-2 | Any contributor with OpenJDK source access | High |
| Functional | Verify and correct PLT constants | 0.5 | Any contributor with riscv64 linker knowledge | High |
| Functional | Implement `safeAccess` inline asm | 1-2 | Any contributor with riscv64 asm | Low |
| CI/CD | Add riscv64 to CI matrix (QEMU or self-hosted) | 3-4 | DevOps + needs `apangin` acceptance | High |
| CI/CD | Publish riscv64 binary releases | 1-2 | Conditional on CI; needs `apangin` acceptance | Medium |
| Ecosystem | Debian/Ubuntu packaging | 4-6 | Debian maintainer (independent of port) | Medium |
| Ecosystem | Monitor GraalVM #13516 for `jfr-converter` | Low ongoing | Tracker role | Low |
| Performance | Baseline benchmark campaign on riscv64 | Data not available -- cannot scope | -- | Prerequisite for optimization work |

---

## 14. Updates

No updates yet -- initial report dated 2026-06-17.

---

## 15. References

- [async-profiler repository](https://github.com/async-profiler/async-profiler)
- [async-profiler homepage](https://async-profiler.github.io/)
- [PR #644 "Basic RISC-V support"](https://github.com/async-profiler/async-profiler/pull/644) -- merged 2023-11-26, merge commit `752b79ec4e4cc46c105dade93e1df1954fbbc638`
- [v3.0 release](https://github.com/async-profiler/async-profiler/releases/tag/v3.0) -- first release containing RISC-V port, 2024-01-21
- [v4.4 release](https://github.com/async-profiler/async-profiler/releases/tag/v4.4) -- latest stable release as of research date, 2026-04-20
- [PR #1185 "Fix compilation with source merging disabled"](https://github.com/async-profiler/async-profiler/pull/1185) -- riscv64-related, closed without merge, 2025-03-21
- [GraalVM issue #13516](https://github.com/oracle/graal/issues/13516) -- LLVM backend calling convention not implemented on riscv64; blocks `jfr-converter`
- [GraalVM issue #13386](https://github.com/oracle/graal/issues/13386) -- pthread crash on shutdown on riscv64
- [RISE funded projects wiki](https://wiki.riseproject.dev/index.php/Main_Page) -- RP001-RP016 reviewed; async-profiler absent